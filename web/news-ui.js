import {PERSONAS,CITY_BY_ID,money} from './engine.js';
import {PORTRAIT_ASSETS,CITY_ICON_ASSETS} from './design-assets.js';
import {SELECTION_ART} from './character-selection.js';
import {WORLD_ART,worldObject} from './world-art.js';
import {CAMPAIGN_COLORS} from './campaign-ui.js';
import {referenceCorners,referenceTexture} from './reference-art.js';
import {palaceFlourish} from './palace-art.js';
import {createNewsQueue} from './campaign-news.js';

const newsEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const newsLocative={1:'Москве',3:'Воронеже',5:'Ярославле',7:'Тюмени',9:'Челябинске',11:'Екатеринбурге',13:'Архангельске',15:'Санкт-Петербурге',17:'Калининграде',19:'Омске',21:'Новосибирске',23:'Красноярске',25:'Улан-Удэ',27:'Хабаровске',29:'Владивостоке',31:'Махачкале',33:'Грозном',35:'Пятигорске',37:'Севастополе',39:'Ростове-на-Дону',41:'Волгограде',43:'Самаре',45:'Казани',47:'Нижнем Новгороде'};
export function newsCopy(e,s){
 const person=PERSONAS[e.persona]?.name||'Кандидат',place=newsLocative[e.position]||CITY_BY_ID[e.position]?.city||'',female=['catherine','catherine_i','elizabeth','anna'].includes(e.persona);
 const owner=s.players[e.previousOwner]?.name||'соперник',target=s.players[e.target]?.name||'соперник';
 const cost=e.cost===null||e.cost===undefined?'':e.cost===0?'Без расходов':`Инвестиция — ${money(e.cost)}`;
 const texts={
  acquire:[`${person} ${female?'стала':'стал'} лидером в ${place}`,cost||'Открыта новая кампания в городе'],
  hq:[`${person} открывает штаб в ${place}`,cost||'Влияние города усилено'],
  office:[`${person} открывает региональное отделение`,`${CITY_BY_ID[e.position]?.city} · ${cost||'Новый уровень развития'}`],
  infrastructure:[`${person} строит инфраструктуру в ${place}`,`${e.count} из ${e.limit} до перехвата · Лидер: ${owner}`],
  defense:[`${person} защищает влияние в ${place}`,`Убран объект соперника: ${target} · Осталось ${e.count}/${e.limit}`],
  capture:[`${person} ${female?'перехватила':'перехватил'} лидерство в ${place}`,`Прежний лидер: ${owner}. ${e.level==='regional_office'?'Отделение сохранено.':e.level==='headquarters'?'Штаб сохранён.':'Город сменил владельца.'}`],
  victory:[`${person} побеждает на выборах`,'Кампания завершена · Поздравляем победителя']
 };
 const [title,detail]=texts[e.kind]||['Новости кампании',''];return {title,detail};
}
export function newsCard(e,s,{preview=false,journal=false}={}){
 const {title,detail}=newsCopy(e,s),progress=e.kind==='infrastructure'?`<span class="news-count" aria-label="${e.count} из ${e.limit} объектов">${Array.from({length:e.limit},(_,i)=>`<i class="${i<e.count?'filled':''}"></i>`).join('')}<b>${e.count}/${e.limit}</b></span>`:'';
 return `<article class="campaign-news-card ${journal?'news-record':''}" style="--news-player:${CAMPAIGN_COLORS[e.actor%6]}">${referenceCorners()}<div class="news-portrait"><img src="${PORTRAIT_ASSETS[e.persona]}" alt="" draggable="false"><span aria-hidden="true">${e.actor+1}</span></div><div class="news-message"><div class="news-kicker">${journal?'Раунд '+e.round:preview?'Пример уведомления':'Сводка кампании'}${e.kind==='capture'?'<em>СМЕНА ЛИДЕРА</em>':''}</div><h3>${newsEsc(title)}</h3><p>${newsEsc(detail)}</p><div class="news-card-bottom">${progress}${!preview&&e.position!==null?`<button class="news-show" data-action="newsCity" data-position="${e.position}">Показать город <span aria-hidden="true">↗</span></button>`:''}${!preview&&!journal?'<button class="news-all" data-action="log" aria-label="Открыть журнал событий">Журнал</button>':''}</div></div>${!preview&&!journal?'<button class="news-dismiss" data-action="newsDismiss" aria-label="Закрыть уведомление">×</button>':''}${!journal?'<div class="news-lifetime" aria-hidden="true"><i></i></div>':''}</article>`;
}
export const NEWS_SAMPLE={id:'sample',actor:1,persona:'nicholas',kind:'acquire',position:19,cost:500,round:1};
// Ownership is resolved from the recorded event, never from a later board state.
export function newsEventOwner(e){return e.kind==='infrastructure'?e.previousOwner:['acquire','capture','hq','office','defense'].includes(e.kind)?e.actor:null;}
export function newsStoryCard(e,s,{preview=false}={}){
 const person=PERSONAS[e.persona],city=CITY_BY_ID[e.position],ownerId=newsEventOwner(e),owner=preview?{persona:e.persona,name:person.name}:s.players[ownerId],copy=newsCopy(e,s);
 const heading={infrastructure:'Новый шаг в '+newsLocative[e.position],capture:'Город меняет лидера',acquire:'Новая кампания в '+newsLocative[e.position],hq:'Открытие предвыборного штаба',office:'Влияние на весь округ',defense:'Город защищает своё влияние',victory:'У кампании есть победитель'}[e.kind]||'Новый поворот кампании';
 const art=e.position===5?WORLD_ART.yaroslavl:e.position===1?'./assets/reference-v16/moscow-panorama.png':CITY_ICON_ASSETS[e.position]||WORLD_ART.desktop;
 const progress=e.kind==='infrastructure'||e.kind==='capture'&&e.count;
 const outcome=e.kind==='infrastructure'?'Контроль над городом не изменился.':e.kind==='capture'?(e.level==='regional_office'?'Региональное отделение сохранено.':e.level==='headquarters'?'Предвыборный штаб сохранён.':'Город перешёл новому владельцу.'):e.kind==='acquire'?'Теперь город поддерживает нового кандидата.':e.kind==='defense'?'Чужое влияние в городе уменьшилось.':e.kind==='victory'?'Поздравляем победителя кампании.':'Город получил новый уровень развития.';
 return `<article class="world-news-card" aria-label="${newsEsc(copy.title)}" style="--news-player:${CAMPAIGN_COLORS[e.actor%6]}">${referenceTexture()}${referenceCorners()}<header><span>${preview?'Пример сводки':'Хроника · Раунд '+e.round}</span><h2>Сводка кампании</h2><button class="news-dismiss" data-action="${preview?'close':'newsDismiss'}" aria-label="Закрыть уведомление">×</button></header><div class="world-news-body"><div class="world-news-scene"><img class="world-news-city" src="${art}" alt="${city?.city||'Кампания'}"><img class="world-news-person" src="${SELECTION_ART[e.persona]||PORTRAIT_ASSETS[e.persona]}" alt=""><span>${city?.city||'Финал кампании'}</span></div><div class="world-news-copy"><div class="world-news-actor"><img src="${PORTRAIT_ASSETS[e.persona]}" alt=""><span>${person.name}</span></div><h3>${newsEsc(heading)}</h3><p class="world-news-description">${newsEsc(copy.title)}</p>${progress?`<div class="world-news-progress"><span>Инфраструктура кандидата</span><div>${Array.from({length:e.limit},(_,i)=>`<span class="${i<e.count?'built':'unbuilt'}">${worldObject('infrastructure')}</span>`).join('')}<b>${e.count} / ${e.limit}</b></div></div>`:`<div class="world-news-investment">${worldObject(e.kind==='hq'||e.kind==='office'?'campaign':e.kind==='defense'?'infrastructure':e.kind==='victory'?'votes':'budget')}<span>${newsEsc(copy.detail)}</span></div>`}${owner?`<div class="world-news-owner"><img src="${PORTRAIT_ASSETS[owner.persona]}" alt=""><span>Владелец <b>${newsEsc(owner.name)}</b></span></div>`:''}<p class="world-news-outcome">${outcome}</p></div></div><footer><button class="world-button" data-action="newsSettings">Настроить</button><button class="world-button world-primary" data-action="${preview?'close':'newsDismiss'}">Понятно</button><button class="world-button" data-action="log">В журнал</button></footer><div class="news-lifetime" aria-hidden="true"><i></i></div><small class="world-news-timer">${preview?'Предпросмотр · партия не меняется':'Закроется через <span>6</span> с'}</small></article>`;
}
export function newsSettingsContent(settings,s){
 const toggle=(key,on,label)=>`<button class="news-switch" role="switch" aria-checked="${on}" aria-label="${label}" data-action="newsOption" data-key="${key}"><span></span></button>`;
 return `<div class="news-settings-content">${referenceCorners()}<section class="news-setting-master"><div><h3>Всплывающие уведомления</h3><p>Поверх игры, без сдвига поля</p></div>${toggle('enabled',settings.enabled,'Всплывающие уведомления')}</section><fieldset class="news-format"><legend>Вид сводки</legend><div>${[['full','Полная','Сюжетная сцена'],['compact','Компактная','Короткая карточка']].map(([v,title,hint])=>`<button data-action="newsOption" data-key="format" data-value="${v}" aria-pressed="${settings.format===v}"><strong>${title}</strong><small>${hint}</small></button>`).join('')}</div></fieldset><fieldset class="news-event-filter"><legend>Что показывать</legend>${[['all','Все действия','Покупки, постройки, защита и смена контроля'],['important','Только важное','Перехват города и победа']].map(([v,title,hint])=>`<label><input type="radio" name="news-filter" value="${v}" ${settings.filter===v?'checked':''}><span class="news-radio" aria-hidden="true"></span><span><strong>${title}</strong><small>${hint}</small></span></label>`).join('')}</fieldset><fieldset class="news-duration"><legend>Время показа</legend><div role="group" aria-label="Время показа уведомления">${[3,6,10].map(n=>`<button data-action="newsOption" data-key="duration" data-value="${n}" aria-pressed="${settings.duration===n}">${n} с</button>`).join('')}</div></fieldset><section class="news-setting-sound"><div><h3>Звук уведомлений</h3><p>Учитывает общую громкость эффектов</p></div>${toggle('sound',settings.sound,'Звук уведомлений')}</section><div class="news-settings-preview">${newsCard(NEWS_SAMPLE,s,{preview:true})}</div><p class="news-setting-hint">Наведение и фокус приостанавливают таймер. Смахните, чтобы закрыть. События остаются в журнале.</p><div class="news-settings-actions"><button data-action="newsPreview">Пример</button><button class="news-done" data-action="close">Готово</button></div></div>`;
}
export function newsJournalContent(s){return `<div class="news-journal-tools"><p>Публичные действия всех участников. Последние 60 событий.</p><button data-action="newsSettings">Настроить уведомления</button></div><div class="news-journal-records">${(s.news||[]).length?s.news.map(e=>newsCard(e,s,{journal:true})).join(''):`<div class="news-empty">${palaceFlourish()}<h3>История начинается здесь</h3><p>Покупки, постройки и перехваты появятся после действий участников.</p></div>`}</div><button class="news-full-log" data-action="fullLog">Открыть полную хронику ходов</button>`;}

export function createNewsOverlay({document:doc,initial=[],onSound=()=>{}}){
 const host=doc.createElement('aside');host.id='campaign-news';host.setAttribute('aria-label','Сводка кампании');doc.body.append(host);
 const announcer=doc.createElement('div');announcer.className='news-sr';announcer.setAttribute('role','status');announcer.setAttribute('aria-live','polite');announcer.setAttribute('aria-atomic','true');doc.body.append(announcer);
 const queue=createNewsQueue(initial);let currentId=null,currentFormat=null,hovered=false,focused=false,context=null,last=performance.now(),pointer=null;
 function position(){if(context?.settings.format==='full'){host.removeAttribute('style');return;}const board=doc.querySelector('.board-viewport'),r=board?.getBoundingClientRect();if(!r)return;const mobile=window.innerWidth<=700,w=Math.min(mobile?400:430,window.innerWidth-24),h=host.offsetHeight||150;host.style.width=w+'px';host.style.left=Math.max(12,Math.min(window.innerWidth-w-12,mobile?r.left+(r.width-w)/2:r.right-w-16))+'px';host.style.top=Math.max(12,Math.min(window.innerHeight-h-12,mobile?r.top+(r.height-h)/2:r.top+18))+'px';}
 function draw(snapshot){
  const e=snapshot.event,format=context?.settings.format||'full';host.hidden=!e||snapshot.hidden;host.dataset.format=format;
  if(e&&(e.id!==currentId||format!==currentFormat)){const newEvent=e.id!==currentId;currentId=e.id;currentFormat=format;hovered=false;focused=false;host.innerHTML=format==='full'?newsStoryCard(e,context.state):newsCard(e,context.state);announcer.textContent=newsCopy(e,context.state).title;if(newEvent&&context.settings.sound&&!snapshot.hidden)onSound();position();}
  if(!e){currentId=null;host.replaceChildren();}
  const timerLabel=host.querySelector('.world-news-timer');if(timerLabel)timerLabel.innerHTML=hovered||focused?'Чтение · таймер приостановлен':'Закроется через <span>'+Math.ceil(snapshot.remaining/1000)+'</span> с';
  const bar=host.querySelector('.news-lifetime i');if(bar)bar.style.transform=`scaleX(${snapshot.progress})`;
 }
 const api={host,
  sync(state,settings,{visible=true,suspended=false}={}){last=performance.now();context={state,settings};const active=state.players[state.decision?.actor??state.decision?.recipient??state.current],viewer=active.bot?state.players.find(p=>!p.bot).id:active.id;draw(queue.sync(state.news||[],viewer,settings,{visible,suspended}));position();},
  reset(events=[]){queue.reset(events);currentId=null;host.hidden=true;host.replaceChildren();},
  dismiss(){hovered=false;focused=false;draw(queue.dismiss());},
  dispose(){clearInterval(timer);window.removeEventListener('resize',position);host.remove();announcer.remove();}
 };
 host.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')hovered=!!e.target.closest('.world-news-card,.campaign-news-card');});host.addEventListener('pointerleave',()=>hovered=false);
 host.addEventListener('focusin',()=>focused=true);host.addEventListener('focusout',()=>queueMicrotask(()=>focused=host.contains(doc.activeElement)));
 host.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY,id:e.pointerId};if(!e.target.closest('button'))host.setPointerCapture?.(e.pointerId);});
 host.addEventListener('pointerup',e=>{if(pointer&&pointer.id===e.pointerId&&Math.abs(e.clientX-pointer.x)>55&&Math.abs(e.clientX-pointer.x)>Math.abs(e.clientY-pointer.y)){api.dismiss();}pointer=null;});
 host.addEventListener('pointercancel',()=>pointer=null);
 host.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();api.dismiss();doc.querySelector('.main-command button:not(:disabled)')?.focus({preventScroll:true});}});
 const timer=setInterval(()=>{const now=performance.now(),elapsed=now-last;last=now;if(context){draw(queue.tick(elapsed,{hovered:hovered||focused||doc.hidden||!!doc.querySelector('dialog[open]')}));}},100);
 window.addEventListener('resize',position);return api;
}
