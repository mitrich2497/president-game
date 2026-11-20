import {canControl} from './engine.js';
import {CITY_BY_ID,PERSONAS,reduce,cityVotes,getVotes,money,actionPlayerId,canHQ,canOffice,tileName} from './engine.js';
import {CITY_ICON_ASSETS} from './design-assets.js';
import {CAMPAIGN_COLORS,actorHeading,currentRoll,nextTurnPreview} from './campaign-ui.js';
import {deckPainting,DECK_NAMES,swanDecisionOptions,travelPreview} from './deck-ui.js';
import {referenceCorners,referenceTexture} from './reference-art.js';

const arrivalEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Read-only forecasts use the same transition as the confirmed action. No
// synthetic numbers or ownership changes are introduced by the presentation.
export function arrivalCityOptions(s){
 const p=s.players[s.current],c=CITY_BY_ID[p.position],d=s.decision;
 if(s.phase!=='decision'||!c||!['city','owncity'].includes(d?.kind))return [];
 const actions=d.kind==='city'?[{type:'BUY',action:'buy',label:'Открыть кампанию',cost:c.acquisition_cost_million_rub}]:[
  ...(canHQ(s,p.position)?[{type:'HQ',action:'buildHQ',label:'Построить штаб',cost:c.headquarters_cost_million_rub}]:[]),
  ...(canOffice(s,p.position)?[{type:'OFFICE',action:'buildOffice',label:'Открыть отделение',cost:c.regional_office_cost_million_rub}]:[])
 ];
 return actions.map(a=>{
  try{const next=reduce(s,{type:a.type,position:p.position}),r=next.regions[p.position];return {...a,allowed:true,cash:next.players[p.id].cash,votes:getVotes(next,p.id),cityVotes:cityVotes(next,p.position),payment:c.levels[r.level].money_million_rub};}
  catch{return {...a,allowed:false,cash:p.cash,votes:getVotes(s,p.id),cityVotes:0,payment:0};}
 });
}

export function arrivalKind(s){
 if(s.phase!=='decision')return null;
 const kind=s.decision?.kind;
 if(['swan','travel'].includes(kind))return kind;
 if(CITY_BY_ID[s.players[s.current].position]&&['city','owncity','end'].includes(kind))return 'city';
 return null;
}

export function arrivalIdentity(s){
 const kind=arrivalKind(s);if(!kind)return null;
 return [s.round,s.current,s.players[s.current].position,kind,s.decision?.card?.id||'',actionPlayerId(s)].join(':');
}

function arrivalButton(label,action,{disabled=false,secondary=false,position,detail=''}={}){
 return `<button class="arrival-button ${secondary?'arrival-secondary':''}" data-action="${action}" ${position===undefined?'':`data-position="${position}"`} ${disabled?'disabled':''}><strong>${label}</strong>${detail?`<small>${detail}</small>`:''}</button>`;
}
function arrivalForecast(cash,votes){return `<span>${money(cash)}</span><i>◆</i><span>${votes}% поддержки</span>`;}
function arrivalEnd(s){const p=s.players[s.current];return s.extraRoll&&!p.airportPending&&!p.jail&&!p.skip?'Бросить ещё раз':'Завершить ход';}
function arrivalNext(s){const n=nextTurnPreview(s);return n?`${n.label}: <strong>${arrivalEscape(PERSONAS[s.players[n.id].persona].short)}</strong>`:'';}

export function arrivalPanel(s,{busy=false,die=()=>''}={}){
 const kind=arrivalKind(s);if(!kind)return '';
 const id=actionPlayerId(s),actor=s.players[id],p=s.players[s.current],d=s.decision,roll=currentRoll(s);
 const disabled=!canControl(s)||busy,identity=arrivalIdentity(s);
 const dice=roll?`<div class="arrival-dice completed-roll"><span class="dice-pair">${roll.dice.map(n=>die(n)).join('')}</span><strong class="dice-equation">${roll.dice[0]} + ${roll.dice[1]} = ${roll.dice[0]+roll.dice[1]}${roll.steps>roll.dice[0]+roll.dice[1]?` → ${roll.steps}`:''}</strong></div>`:'';
 let content='';
 if(kind==='city'){
  const c=CITY_BY_ID[p.position],r=s.regions[p.position],owner=r?s.players[r.owner]:null,own=owner?.id===p.id,level=r?.level||'base',options=arrivalCityOptions(s),forecast=options.find(o=>o.allowed);
  const status=!r?'Свободный город':`${own&&(!s.network||s.network.viewer===owner.id)?'Ваш город':arrivalEscape(owner.name)} · ${{base:'Без штаба',headquarters:'Штаб построен',regional_office:'Региональное отделение'}[level]}`;
  const image=p.position===5?'./assets/reference-v30/yaroslavl-panorama.png':p.position===1?'./assets/reference-v16/moscow-panorama.png':CITY_ICON_ASSETS[p.position];
  const votes=r?cityVotes(s,p.position):0,payment=r?c.levels[level].money_million_rub:0;
  const comparison=forecast?`<span class="arrival-before">${votes}% <i>→</i></span> ${forecast.cityVotes}%`:`${votes}%`;
  const rate=forecast?`<span class="arrival-before">${money(payment)} <i>→</i></span> ${money(forecast.payment)}`:money(payment);
  const actions=options.map(o=>arrivalButton(`${o.label} · ${money(o.cost)}`,o.action,{position:p.position,disabled:disabled||!o.allowed,detail:options.length>1&&o.allowed?'После: '+money(o.cash)+' · '+o.votes+'% поддержки':!o.allowed?'Недостаточно средств':''})).join('');
  const info=d.kind==='end'?`<p class="arrival-outcome"><b>${arrivalEscape(d.title)}</b> ${arrivalEscape(d.text)}</p>`:d.kind==='owncity'&&!options.length?'<p class="arrival-note">Развитие сейчас недоступно. Условия — в карточке города.</p>':'';
  content=`<header class="arrival-heading"><button class="location-title" data-action="cityDetails" data-position="${p.position}" aria-label="Подробнее: ${arrivalEscape(c.city)}" ${busy?'disabled':''}><small>${c.district_on_board} · Клетка ${String(p.position).padStart(2,'0')}</small><h2>${arrivalEscape(c.city)}</h2></button><span class="arrival-status">${status}</span></header>
   <div class="arrival-art arrival-city-art"><img src="${image}" alt="Панорама города ${arrivalEscape(c.city)}" draggable="false"><span class="arrival-light" aria-hidden="true"></span></div>
   <dl class="arrival-metrics"><div><dt>Поддержка города${forecast&&options.length>1?' · после штаба':''}</dt><dd>${comparison}</dd></div><div><dt>Плата за остановку</dt><dd>${rate}</dd></div></dl>${info}
   <div class="arrival-actions main-command">${actions}${arrivalButton(d.kind==='city'?'Отказаться · '+arrivalEnd(s).toLowerCase():arrivalEnd(s),'end',{disabled,secondary:!!actions})}</div>
   ${forecast&&options.length===1?`<p class="arrival-projection">После ${d.kind==='city'?'покупки':'постройки'}: ${arrivalForecast(forecast.cash,forecast.votes)}</p>`:''}`;
 }else{
  const c=d.card;
  const description=kind==='swan'&&c.penalty&&actor.persona==='catherine_i'?'Екатерина I превращает неудачу в возможность: выберите деньги или поддержку. Карта не оставляет долга.':c.text;
  const art=kind==='swan'&&c.id==='blizzard'?'<img src="./assets/reference-v30/blizzard.png" alt="Метель над городом" draggable="false">':deckPainting(kind);
  let actions='',note='';
  if(kind==='swan'){
   const reverse=!!c.penalty&&actor.persona==='catherine_i',choices=swanDecisionOptions(s);
   actions=choices.map(o=>{
    const label=c.penalty&&!reverse?(o.accept?'Заплатить '+money(c.penalty.cash):'Оставить карту'):o.label;
    const effect=c.penalty?(reverse?'Бонус вместо штрафа':o.accept?'Сохранить поддержку':'−'+c.penalty.votes+'% до оплаты'):c.cost&&!o.accept?'Сохранить деньги и поддержку':'Результат события';
    return `<button class="arrival-button arrival-choice ${o.accept?'':'arrival-secondary'}" data-action="${o.accept?'swanYes':'swanNo'}" ${disabled||!o.allowed?'disabled':''}><strong>${arrivalEscape(label)}</strong><small>${o.allowed?effect:'Недостаточно средств'}</small><span class="arrival-choice-result">${arrivalForecast(o.cash,o.votes)}</span></button>`;
   }).join('');
   if(actor.persona==='milyukov'&&d.recipient===undefined)actions+=arrivalButton('Передать событие','swanPass',{disabled,secondary:true});
   note=c.penalty&&!reverse?`Поздняя оплата: <strong>${money(c.penalty.cash*2)}</strong> · через «Карты»`:reverse?'Екатерина I: штраф заменён бонусом. Долга нет.':actor.persona==='catherine'?'Екатерина II: эффект и стоимость удвоены.':'';
  }else{
   const route=travelPreview(s);
   actions=`<div class="arrival-route"><span>${arrivalEscape(tileName(route.from))}<small>${String(route.from).padStart(2,'0')}</small></span><i>→</i><span>${arrivalEscape(tileName(route.to))}<small>${String(route.to).padStart(2,'0')}</small></span></div>${arrivalButton('Отправиться →','travel',{disabled})}`;
   note=(route.income?'За проход старта: +'+money(route.income)+'. ':'Без выплаты за «Старт». ')+route.note;
  }
  content=`<header class="arrival-heading arrival-event-heading"><span class="arrival-deck-label">${DECK_NAMES[kind]}</span><button class="arrival-detail" data-action="eventCard" aria-label="Подробнее о карте ${arrivalEscape(c.name)}" ${busy?'disabled':''}>i</button></header><div class="arrival-art arrival-event-art">${art}<span class="arrival-light" aria-hidden="true"></span><h2>${arrivalEscape(c.name)}</h2></div><p class="arrival-event-description">${arrivalEscape(description)}</p><div class="arrival-actions main-command arrival-event-actions">${actions}</div>${note?`<p class="arrival-note">${note}</p>`:''}${d.recipient!==undefined?`<p class="arrival-note arrival-recipient">Решает ${arrivalEscape(actor.name)}. Ход: ${arrivalEscape(p.name)}.</p>`:''}`;
 }
 return `<section class="campaign-dock arrival-dock arrival-${kind}" aria-label="Панель хода" aria-busy="${busy}" data-arrival-key="${identity}" data-arrival-kind="${kind}" data-arrival-position="${p.position}" style="--actor-color:${CAMPAIGN_COLORS[id]}">${referenceTexture()}${referenceCorners()}<div class="arrival-turn"><span><small>${actorHeading(s)}</small><strong>${arrivalEscape(actor.name)}</strong></span>${dice}</div><div class="arrival-card">${content}</div><div class="arrival-next">${arrivalNext(s)}</div></section>`;
}
