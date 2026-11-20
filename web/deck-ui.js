import {SWAN,TRAVEL,LAWYERS,PERSONAS,AIRPORTS,CITY_BY_ID,TILE_BY_ID,actionPlayerId,getVotes,money,tileName,planMove,canSettleSwan,reduce} from './engine.js';
import {PORTRAIT_ASSETS} from './design-assets.js';
import {referenceCorners,referenceTexture} from './reference-art.js';
import {palaceFlourish} from './palace-art.js';

// Approved illustration sheets are viewed through SVG windows. Rule text, values,
// participants and buttons are HTML, never baked into the illustration.
export const DECK_ART={lawyer:'./assets/decks-v18/lawyer.png',swan:'./assets/decks-v18/black-swan.png',travel:'./assets/decks-v18/travel.png'};
export const DECK_NAMES={lawyer:'Юрист',swan:'Чёрный лебедь',travel:'Командировка'};
const deckEscape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const deckCatalog=kind=>({lawyer:LAWYERS,swan:SWAN,travel:TRAVEL})[kind]||LAWYERS;
export function deckPainting(kind,part='scene'){
 const regions={lawyer:{back:[134,68,592,854],scene:[820,186,550,241]},swan:{back:[122,65,609,850],scene:[199,216,447,425]},travel:{back:[124,72,613,842],scene:[822,187,551,341]}};
 const crop=regions[kind]?.[part]||regions.lawyer.scene;
 return `<svg class="deck-painting deck-painting-${part}" viewBox="${crop.join(' ')}" preserveAspectRatio="${kind==='swan'&&part==='scene'?'xMidYMin':'xMidYMid'} ${part==='back'?'meet':'slice'}" aria-hidden="true"><image href="${DECK_ART[kind]||DECK_ART.lawyer}" width="1536" height="1024"/></svg>`;
}
function deckButton(label,action,{secondary=false,disabled=false,attrs=''}={}){return `<button class="deck-button ${secondary?'deck-button-secondary':''}" data-action="${action}" ${disabled?'disabled':''} ${attrs}>${label}</button>`;}
function deckTileLabel(n){return CITY_BY_ID[n]?.city||({infra:'Инфраструктура',swan:'Чёрный лебедь',travel:'Командировка',lawyer:'Юрист',court:'Судебное следствие',president:'Президент',start:'Старт'})[TILE_BY_ID[n]?.kind]||tileName(n);}
function deckPortrait(player){return `<span class="deck-portrait"><img src="${PORTRAIT_ASSETS[player.persona]}" alt="" draggable="false"></span>`;}
function deckActor(s,id=actionPlayerId(s)){const p=s.players[id];return `<div class="deck-actor">${deckPortrait(p)}<div><span class="deck-eyebrow">${s.network&&s.network.viewer!==id?'РЕШЕНИЕ СОПЕРНИКА':p.bot?'ХОД КОМПЬЮТЕРА':id===s.current?'ВАШ ХОД':'ВАШЕ РЕШЕНИЕ'}</span><strong>${deckEscape(p.name)}</strong><span>${money(p.cash)} <i>◆</i> ${getVotes(s,id)}% поддержки</span></div></div>`;}
function deckMetric(label,value,note=''){return `<div class="deck-metric"><span>${label}</span><strong>${value}</strong>${note?`<small>${note}</small>`:''}</div>`;}
function deckFace(kind,card,{footer='',compact=false}={}){
 return `<article class="deck-face ${compact?'deck-face-compact':''} deck-${kind}">${referenceCorners()}<div class="deck-face-heading"><span>${DECK_NAMES[kind]}</span><small>Дела особой важности</small></div><div class="deck-scene">${deckPainting(kind)}</div><div class="deck-face-title"><h3>${deckEscape(card.name)}</h3></div><div class="deck-paper"><p>${deckEscape(card.text)}</p>${palaceFlourish()}${footer}</div></article>`;
}
export function lawyerCards(player,kind='view'){
 const closed=kind==='sue',lead=closed?'Выберите одну из двух закрытых карт. Исход дела откроется только после выбора.':kind==='swap'?'Выберите карту, которую хотите заменить. Новая карта останется известна только вам.':'Эти карты определяют исход судебных дел против вашей кампании.';
 return `<div class="deck-hand-intro">${deckPortrait(player)}<div><span class="deck-eyebrow">${closed?'ОТВЕТЧИК':'ВАША СУДЕБНАЯ ПРАКТИКА'}</span><h3>${deckEscape(player.name)}</h3><p>${lead}</p></div></div><div class="deck-hand ${closed?'deck-hand-closed':''}">${(closed?[null,null]:player.hand).map((id,i)=>{
  const c=closed?null:LAWYERS.find(x=>x.id===id),action=closed?'sueCard':kind==='swap'?'swapCard':null;
  const art=closed?`<span class="deck-back">${deckPainting('lawyer','back')}</span>`:deckFace('lawyer',c,{compact:true});
  return `<${action?'button':'article'} class="deck-hand-card ${closed?'is-closed':''}" ${action?`data-action="${action}" data-index="${i}" data-target="${player.id}" aria-label="${closed?'Выбрать закрытую карту':`Заменить карту «${deckEscape(c.name)}»`} ${i+1}"`:''}><span class="deck-slot">КАРТА ${i+1}</span>${art}<span class="deck-hand-caption">${closed?'Выбрать карту':kind==='swap'?'Заменить карту':'Карта вашей кампании'} ${action?'↗':''}</span></${action?'button':'article'}>`;
 }).join('')}</div><p class="deck-footnote">${closed?'Обе рубашки одинаковы: они не раскрывают название и результат карты.':'Способности участников могут изменить выплату и последствия суда.'}</p>`;
}

// Deterministic route preview; no random draws, no state changes.
export function travelPreview(s,card=s.decision?.card){
 const p=s.players[s.current],from=p.position;
 if(card.id==='humility')return {from,to:0,steps:0,income:0,note:'Возвращение на «Старт» без выплаты за круг.'};
 let steps;
 if(card.id==='luck'){
  steps=Array.from({length:48},(_,i)=>i+1).find(n=>CITY_BY_ID[(from+n)%48]&&!s.regions[(from+n)%48]);
  if(!steps){let to=from;do{to=(to+47)%48;}while(!AIRPORTS.includes(to));return {from,to,steps:0,income:0,note:'Свободных городов нет. Возвращение в аэропорт; маршрут определится в следующий ход.'};}
 }else steps=Array.from({length:48},(_,i)=>i+1).find(n=>TILE_BY_ID[(from+n)%48]?.kind==='infra');
 const route=planMove(from,steps),income=route.startPasses*(p.persona==='brezhnev'?1500:1000);
 return {...route,steps,income,note:card.id==='luck'?'Кампания в этом городе откроется бесплатно.':'После перемещения выполните действие клетки. Штаб оплачивается отдельно.'};
}
export function deckEventContent(s){
 const d=s.decision;if(!['swan','travel'].includes(d?.kind))return '';
 if(d.kind==='swan')return swanReferenceContent(s);
 const p=s.players[actionPlayerId(s)],c=d.card,disabled=p.bot;
 let details='',actions='';
 if(d.kind==='travel'){
  const r=travelPreview(s);
  details=`<div class="deck-section-label">Маршрут перемещения</div><div class="deck-route"><span>Клетка ${String(r.from).padStart(2,'0')}<small>${deckTileLabel(r.from)}</small></span><b aria-hidden="true">→</b><span>Клетка ${String(r.to).padStart(2,'0')}<small>${deckTileLabel(r.to)}</small></span></div><div class="deck-destination"><small>Пункт назначения</small><strong>${deckTileLabel(r.to)}</strong></div><div class="deck-balance"><span>Выплата за «Старт»</span><strong>${r.income?'+'+money(r.income):'Без выплаты'}</strong></div><p class="deck-note">${r.note}</p>`;
  actions=deckButton('Отправиться →','travel',{disabled});
 }else if(c.penalty){
  const n=c.penalty,reverse=p.persona==='catherine_i';
  details=`<div class="deck-section-label">${reverse?'Поворот судьбы · Екатерина I':'Два решения на выбор'}</div><div class="deck-metrics">${deckMetric(reverse?'Получить из казны':'Заплатить сейчас',(reverse?'+':'−')+money(n.cash),reverse?'Без потери поддержки':'Поддержка сохранится')}${deckMetric(reverse?'Получить поддержку':'Сохранить деньги',(reverse?'+':'−')+n.votes+'%',reverse?'Без затрат':'До оплаты сохранённой карты')}</div><p class="deck-note">${reverse?'Способность заменяет штраф бонусом. Выберите деньги или голоса. Карта не оставляет долга.':'Карта останется у вас. Позже её можно оплатить через «Карты» за '+money(n.cash*2)+' и снять штраф поддержки.'}</p>`;
  details+=`<div class="deck-balance"><span>Бюджет при выборе денег</span><strong>${money(p.cash+(reverse?n.cash:-n.cash))}</strong></div><p class="deck-note">После решения: ${getVotes(s,p.id)}% поддержки при выборе денег. При выборе голосов: ${reverse?getVotes(s,p.id)+n.votes:Math.max(0,getVotes(s,p.id)-n.votes)}%.</p>`;
  actions=deckButton((reverse?'Получить ':'Заплатить ')+money(n.cash),'swanYes',{disabled:disabled||!reverse&&p.cash<n.cash})+deckButton(reverse?'Получить +'+n.votes+'%':'Потерять '+n.votes+'% · сохранить деньги','swanNo',{secondary:true,disabled});
  if(p.persona==='milyukov'&&d.recipient===undefined)actions+=deckButton('Передать событие · способность','swanPass',{secondary:true,disabled});
 }else{
  const f=p.persona==='catherine'?2:1,cost=(c.cost||0)*f,cash=(c.cash||0)*f,votes=(c.votes||0)*f,after=p.cash+cash-cost;
  details=`<div class="deck-section-label">Решение вашей кампании</div><div class="deck-metrics">${deckMetric(cost?'Вложение':'Поступление',cost?'−'+money(cost):cash?'+'+money(cash):'Без затрат')}${deckMetric('Поддержка',votes?'+'+votes+'%':'Без изменений','После решения: '+(getVotes(s,p.id)+votes)+'%')}</div><div class="deck-balance"><span>Бюджет после решения</span><strong>${money(after)}</strong></div>${f===2?'<p class="deck-ability">Екатерина II · эффект и стоимость удвоены.</p>':''}${cost?`<p class="deck-note">Вложение добровольное. При отказе бюджет и поддержка сохраняются.</p>`:'<p class="deck-note">Получите результат события и продолжите кампанию.</p>'}${cost>0&&cost>p.cash?'<p class="deck-warning" role="status">Недостаточно средств для этого вложения.</p>':''}`;
  actions=deckButton(cost?'Вложиться · '+money(cost):'Получить '+(cash?money(cash):'поддержку'),'swanYes',{disabled:disabled||cost>0&&cost>p.cash});
  if(cost)actions+=deckButton('Отказаться от вложения','swanNo',{secondary:true,disabled});
  if(p.persona==='milyukov'&&d.recipient===undefined)actions+=deckButton('Передать событие · способность','swanPass',{secondary:true,disabled});
 }
 return `<div class="deck-event deck-${d.kind}">${referenceTexture()}<div class="deck-event-art">${deckFace(d.kind,c)}</div><section class="deck-event-detail">${deckActor(s)}<h3>${deckEscape(c.name)}</h3>${palaceFlourish()}${details}<div class="deck-actions">${actions}</div><small class="deck-footnote">${d.recipient!==undefined?'Событие передано. Затем продолжится ход: '+deckEscape(s.players[s.current].name)+'.':'Результат будет применён после вашего решения.'}</small></section></div>`;
}

// Preview the same pure transition as the live action. Ability changes, vote
// floors, transferred events and victories cannot drift from the game rules.
export function swanDecisionOptions(s){
 if(s.phase!=='decision'||s.decision?.kind!=='swan')return [];
 const id=actionPlayerId(s),p=s.players[id],c=s.decision.card,reverse=p.persona==='catherine_i',factor=p.persona==='catherine'?2:1;
 const choices=[{accept:true,label:c.penalty?(reverse?'Получить ':'Оплатить ')+money(c.penalty.cash):c.cost?'Вложиться · '+money(c.cost*factor):c.cash?'Получить '+money(c.cash*factor):'Получить поддержку'}];
 if(c.cost||c.penalty)choices.push({accept:false,label:c.penalty?(reverse?'Получить +'+c.penalty.votes+'% поддержки':'Принять −'+c.penalty.votes+'% поддержки'):'Отказаться от вложения'});
 return choices.map(option=>{
  try{const next=reduce(s,{type:'SWAN',accept:option.accept});return {...option,cash:next.players[id].cash,votes:getVotes(next,id),allowed:true};}
  catch{return {...option,cash:p.cash,votes:getVotes(s,id),allowed:false};}
 });
}
function swanReferenceContent(s){
 const d=s.decision,c=d.card,id=actionPlayerId(s),p=s.players[id],reverse=!!c.penalty&&p.persona==='catherine_i',choices=swanDecisionOptions(s);
 const art=c.id==='blizzard'?'<img src="./assets/reference-v30/blizzard.png" alt="Чёрный лебедь на заснеженной реке — иллюстрация события" draggable="false">':`<div class="swan-other-art">${deckPainting('swan')}</div>`;
 const description=c.id==='blizzard'?(reverse?'Штраф превращается в возможность. Выберите один бонус: деньги или поддержку.':'Непогода мешает кампании. Оплатите последствия или временно потеряйте поддержку.'):c.text;
 const later=c.penalty&&!reverse?`<aside class="swan-ref-later"><strong>Если отложить оплату</strong><p>Карта останется у вас. Позднее её можно закрыть через «Карты» за ${money(c.penalty.cash*2)}.</p></aside>`:reverse?'<aside class="swan-ref-later"><strong>Поворот судьбы · Екатерина I</strong><p>Выберите один бонус. Карта не оставляет долга.</p></aside>':p.persona==='catherine'?'<p class="deck-ability">Екатерина II · эффект и стоимость удвоены.</p>':'';
 return `<article class="swan-reference" data-card="${c.id}"><section class="swan-art-panel"><div class="swan-ref-deck">ЧЁРНЫЙ ЛЕБЕДЬ</div>${art}<h3>${deckEscape(c.name)}</h3><p>${deckEscape(description)}</p></section><section class="swan-ref-detail">${deckActor(s)}<h4>ВЫБЕРИТЕ РЕШЕНИЕ</h4><div class="swan-ref-choices">${choices.map(o=>`<button class="swan-choice ${o.accept?'':'secondary-choice'}" data-action="${o.accept?'swanYes':'swanNo'}" ${!o.allowed||p.bot?'disabled':''}><strong>${o.label}</strong><span>${o.allowed?'Бюджет: '+money(o.cash)+(o.cash===p.cash?' — без изменений':''):'Недостаточно средств для этого вложения'}</span><small>После решения: ${o.votes}% поддержки${o.votes===getVotes(s,id)?' — без изменений':''}</small></button>`).join('')}${p.persona==='milyukov'&&d.recipient===undefined?deckButton('Передать событие · способность','swanPass',{secondary:true,disabled:p.bot}):''}</div>${later}<small class="deck-footnote">${d.recipient!==undefined?'Событие передано. Затем продолжится ход: '+deckEscape(s.players[s.current].name)+'.':'Результат будет применён после вашего решения.'}</small></section></article>`;
}

export function swanDebtContent(s,id){
 const p=s.players[id];if(!p.swanDebts?.length)return '';
 return `<section class="swan-debts"><h3>Сохранённые события</h3><p>Штраф действует до оплаты. Оплатить можно в свой ход перед броском или после основного действия.</p>${p.swanDebts.map((key,index)=>{const c=SWAN.find(x=>x.id===key);return `<div class="deck-balance"><span><strong>${c.name}</strong><small> −${c.penalty.votes}% поддержки</small></span>${deckButton('Оплатить · '+money(c.penalty.cash*2),'swanSettle',{disabled:id!==s.current||p.bot||!canSettleSwan(s,index),attrs:`data-index="${index}"`})}</div>`;}).join('')}</section>`;
}

export function courtResult(before,after,a){
 if(!['LAW_SUE','KERENSKY_RESPONSE','COURT_RESPONSE'].includes(a.type)||a.accept===false)return null;
 const plaintiff=before.players[a.type!=='LAW_SUE'?before.decision.actor:before.current],defendant=before.players[a.type!=='LAW_SUE'?before.decision.target:a.target??before.players.find(p=>p.id!==before.current).id];
 const card=LAWYERS.find(c=>c.id===defendant.hand[a.index]);
 return {card,plaintiff,defendant,text:after.decision?.caseResult?.text||after.decision?.text,verdict:after.decision?.caseResult?.verdict||after.decision?.verdict,changes:[plaintiff,defendant].map(p=>({id:p.id,cash:after.players[p.id].cash-p.cash,votes:getVotes(after,p.id)-getVotes(before,p.id),jail:after.players[p.id].jail>0&&(card.jail===(p.id===plaintiff.id?'plaintiff':'defendant')||p.id===defendant.id&&[plaintiff.persona,defendant.persona].includes('stalin'))}))};
}
export function deckVerdictContent(s,result){
 const {card,plaintiff,defendant,changes}=result,payer=changes.find(p=>p.cash<0),payee=changes.find(p=>p.cash>0),jailed=changes.filter(p=>p.jail);
 const effectiveCard={...card,text:result.text||card.text};
 return `<div class="deck-event deck-lawyer deck-verdict">${referenceTexture()}<div class="deck-event-art">${deckFace('lawyer',effectiveCard,{footer:`<span class="deck-verdict-stamp">${deckEscape(result.verdict||'Решение вынесено')}</span>`})}</div><section class="deck-event-detail"><span class="deck-eyebrow">${deckEscape(result.verdict||'Судебное решение')}</span><h3>${deckEscape(card.name)}</h3>${palaceFlourish()}<div class="deck-parties">${[plaintiff,defendant].map((p,i)=>`<div>${deckPortrait(p)}<small>${i?'ОТВЕТЧИК':'ИСТЕЦ'}</small><strong>${deckEscape(p.name)}</strong></div>`).join('<b class="deck-versus">◆</b>')}</div><div class="deck-transfer"><small>${payer?deckEscape(s.players[payer.id].name)+' → '+deckEscape(s.players[payee.id].name):'Повторные издержки отменены'}</small><strong>${payer?money(-payer.cash):'Без выплаты'}</strong></div><div class="deck-verdict-status ${jailed.length?'has-investigation':''}">${jailed.length?'Под следствие: '+jailed.map(p=>deckEscape(s.players[p.id].name)).join(', '):'✓ Без следствия'}</div>${changes.filter(p=>p.votes).map(p=>`<p class="deck-ability">${deckEscape(s.players[p.id].name)}: ${p.votes>0?'+':''}${p.votes}% поддержки.</p>`).join('')}<p class="deck-note">Решение исполнено. Выбранная карта ответчика заменена новой закрытой картой.</p><div class="deck-actions">${deckButton(s.decision?.kind==='courtAccusation'?'Следующий участник':s.decision?.kind==='lawyerSecond'?'Продолжить · доступен второй иск':'Продолжить кампанию','close')}</div></section></div>`;
}
export function deckDock(kind){return `<button class="deck-dock-preview" data-action="eventCard" aria-label="Открыть карту «${DECK_NAMES[kind]}»"><span>${deckPainting(kind,'back')}</span><div><small>ДЕЛА ОСОБОЙ ВАЖНОСТИ</small><strong>${DECK_NAMES[kind]}</strong><em>Открыть карту и последствия ↗</em></div></button>`;}
export function deckCollection(kind='lawyer',selectedId=null){
 const cards=deckCatalog(kind),card=cards.find(c=>c.id===selectedId)||cards[0];
 return `<nav class="deck-tabs" aria-label="Колоды кампании">${Object.entries(DECK_NAMES).map(([id,name])=>deckButton(name,'deckKind',{secondary:true,attrs:`data-deck="${id}" aria-pressed="${id===kind}"`})).join('')}</nav><div class="deck-collection"><section class="deck-library-art"><div class="deck-library-back">${deckPainting(kind,'back')}</div>${deckFace(kind,card)}<p>Рубашка и открытая карта</p></section><section class="deck-library-index"><span class="deck-eyebrow">КАРТЫ В ТЕКУЩЕЙ ИГРЕ · ${cards.length}</span><h3>${DECK_NAMES[kind]}</h3><p>${kind==='lawyer'?'Карты хранятся у игроков. Соперник выбирает закрытую карту, когда предъявляет иск.':kind==='swan'?'Событие открывается на клетке «Чёрный лебедь». Эффект учитывает способности получателя.':'Карта задаёт новый маршрут. Конечная клетка рассчитывается из вашей позиции на поле.'}</p><div class="deck-library-options">${cards.map(c=>`<button data-action="deckCard" data-deck="${kind}" data-card="${c.id}" aria-pressed="${c.id===card.id}"><span>${deckEscape(c.name)}</span><i>${c.id===card.id?'◆':'↗'}</i></button>`).join('')}</div><p class="deck-note">Просмотр справочника не меняет партию. На карточке показано базовое правило; в игре последствия учитывают способности участников.</p></section></div>`;
}

export function courtOfferContent(s){
 const d=s.decision,actor=s.players[d.actor],target=s.players[d.target];
 return `<div class="court-offer">${referenceTexture()}<div class="court-offer-art">${deckPainting('lawyer','scene')}</div><span class="deck-eyebrow">ОБЫЧНАЯ ОСТАНОВКА · КЛЕТКА 12</span><h3>Предъявить обвинение?</h3><div class="deck-parties">${[actor,target].map((p,i)=>`<div>${deckPortrait(p)}<small>${i?'КАНДИДАТ НА КЛЕТКЕ':'РЕШЕНИЕ ПРИНИМАЕТ'}</small><strong>${deckEscape(p.name)}</strong></div>`).join('<b class="deck-versus">◆</b>')}</div><p>${deckEscape(target.name)} пока не под следствием. Выберите наудачу одну из двух закрытых карт «Юрист» этого кандидата.</p><p class="court-offer-warning">Исход неизвестен. Платёж и следствие могут достаться и истцу.</p><div class="deck-actions">${deckButton('Обвинить · выбрать карту','courtAccuse')}${deckButton('Не обвинять','courtDecline',{secondary:true})}</div><small class="court-offer-order">Соперники отвечают по очереди. После ответов соперников ход продолжается.</small></div>`;
}
