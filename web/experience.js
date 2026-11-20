import {CITY_BY_ID,getVotes,money,cityVotes,actionPlayerId} from './engine.js';
import {CITY_ICON_ASSETS,DESIGN_ASSETS,PORTRAIT_ASSETS} from './design-assets.js';

export function momentFor(before,after,action){
 const p=after.players[before.current],pos=action.position??p.position;
 if(after.phase==='finished')return null;
 if(before.current!==after.current){const next=after.players[after.current];return {kind:'turn',image:PORTRAIT_ASSETS[next.persona],eyebrow:'РАУНД '+after.round,title:'Ход: '+next.name,detail:next.bot?'Компьютер продолжает кампанию':'Ваша история продолжается',cue:'turn'};}
 if(['INFRA_PLACE','INFRA_REMOVE'].includes(action.type)){const captured=before.regions[pos].owner!==after.regions[pos].owner;return {kind:'development',image:CITY_ICON_ASSETS[pos],eyebrow:captured?'ГОРОД ПЕРЕШЁЛ К ВАМ':action.type==='INFRA_REMOVE'?'ЗАЩИТА ГОРОДА':'ИНФРАСТРУКТУРА',title:CITY_BY_ID[pos].city,detail:captured?cityVotes(after,pos)+'% поддержки · постройки сохранены':after.decision.text,cue:'build'};}
 if(['BUY','HQ','OFFICE'].includes(action.type))return {kind:'development',image:CITY_ICON_ASSETS[pos],eyebrow:action.type==='BUY'?'КАМПАНИЯ ОТКРЫТА':action.type==='HQ'?'НОВЫЙ ПРЕДВЫБОРНЫЙ ШТАБ':'РЕГИОНАЛЬНОЕ ОТДЕЛЕНИЕ',title:CITY_BY_ID[pos].city,detail:cityVotes(after,pos)+'% поддержки города',cue:'build'};
 if(after.decision&&['swan','travel'].includes(after.decision.kind)&&before.decision?.card?.id!==after.decision.card.id)return {kind:'event',image:DESIGN_ASSETS[after.decision.kind],eyebrow:after.decision.kind==='swan'?'ЧЁРНЫЙ ЛЕБЕДЬ':'КОМАНДИРОВКА',title:after.decision.card.name,detail:'Новое событие вашей кампании',cue:after.decision.kind==='travel'?'travel':'event'};
 if(action.type==='SWAN'&&(action.accept!==false||before.decision.card.penalty)){
  const id=actionPlayerId(before),cash=after.players[id].cash-before.players[id].cash,votes=getVotes(after,id)-getVotes(before,id);
  const details=[cash?(cash>0?'+':'−')+money(Math.abs(cash)):'',votes?(votes>0?'+':'−')+Math.abs(votes)+'% поддержки':''].filter(Boolean).join(' · ');
  return {kind:'reward',image:DESIGN_ASSETS.swan,eyebrow:'СОБЫТИЕ РАЗЫГРАНО',title:before.decision.card.name,detail:after.players[id].name+': '+(details||after.decision?.text||'Кампания продолжается'),cue:cash<0?'payment':cash>0?'coin':'arrival'};
 }
 return null;
}
let momentTimer;
export function showMoment(moment){
 const host=document.querySelector('#cinematic-notices');if(!host||!moment||document.hidden)return;
 clearTimeout(momentTimer);host.replaceChildren();
 const card=document.createElement('div');card.className='campaign-moment '+moment.kind;
 const image=document.createElement('img');image.src=moment.image;image.alt='';
 const text=document.createElement('div');for(const [tag,value] of [['small',moment.eyebrow],['strong',moment.title],['span',moment.detail]]){const el=document.createElement(tag);el.textContent=value;text.append(el);}
 card.append(image,text);host.append(card);momentTimer=setTimeout(()=>host.replaceChildren(),2900);
}
export function clearMoments(){clearTimeout(momentTimer);document.querySelector('#cinematic-notices')?.replaceChildren();}
export function revealDecision(){document.querySelector('.action-context')?.classList.add('new-decision');}
export function floatIncome(at,position,text){
 const board=document.querySelector('.board-svg');if(!board||document.hidden)return;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','g');svg.setAttribute('class','map-income');svg.setAttribute('transform',`translate(${at.x} ${at.y-30})`);svg.setAttribute('pointer-events','none');
 const label=document.createElementNS(svg.namespaceURI,'text');label.setAttribute('text-anchor','middle');label.textContent=text;svg.append(label);board.append(svg);setTimeout(()=>svg.remove(),1800);
}
