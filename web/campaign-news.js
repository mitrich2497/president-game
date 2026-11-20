import {CITY_BY_ID,PERSONAS,infrastructureLimit,actionPlayerId} from './engine.js';

export const NEWS_DEFAULTS={enabled:true,filter:'all',duration:6,sound:false,format:'full'};
export function newsPreferences(value={}){
 const v=value&&typeof value==='object'?value:{};
 return {enabled:typeof v.enabled==='boolean'?v.enabled:true,filter:v.filter==='important'?'important':'all',duration:[3,6,10].includes(v.duration)?v.duration:6,sound:v.sound===true,format:v.format==='compact'?'compact':'full'};
}

// Only public, committed changes become news. No card hands or decision text
// enter this record; human and computer turns pass through the same boundary.
export function collectCampaignNews(before,after,action){
 const events=[],actor=actionPlayerId(before),paid=['BUY','HQ','OFFICE'].includes(action.type)?Math.max(0,before.players[actor].cash-after.players[actor].cash):null;
 const add=(kind,player,position,extra={})=>events.push({id:`${after.serial}:${events.length}:${kind}`,round:after.round,actor:player,persona:after.players[player].persona,kind,position,...extra});
 for(const [key,r] of Object.entries(after.regions)){
  const pos=Number(key),old=before.regions[key];
  if(!old||old.owner!==r.owner){
   add(old?'capture':'acquire',r.owner,pos,{previousOwner:old?.owner??null,level:r.level,cost:paid,count:action.type==='INFRA_PLACE'?infrastructureLimit(after,r.owner):null,limit:infrastructureLimit(after,r.owner)});
  }else if(old.level!==r.level){add(r.level==='regional_office'?'office':'hq',r.owner,pos,{level:r.level,cost:paid});}
  if(old&&old.owner===r.owner){
   const builders=new Set([...Object.keys(old.infrastructure||{}),...Object.keys(r.infrastructure||{})]);
   for(const id of builders){const count=r.infrastructure?.[id]||0,prior=old.infrastructure?.[id]||0;
    if(count>prior)add('infrastructure',Number(id),pos,{count,limit:infrastructureLimit(after,Number(id)),previousOwner:r.owner});
    if(count<prior)add('defense',actor,pos,{count,limit:infrastructureLimit(after,Number(id)),target:Number(id)});
   }
  }
 }
 if(after.phase==='finished'&&before.phase!=='finished')add('victory',after.winner,null);
 return events;
}
export function withCampaignNews(before,after,action){
 after.news=[...collectCampaignNews(before,after,action).reverse(),...(before.news||[])].slice(0,60);return after;
}
export function validCampaignNews(value,state){
 if(!Array.isArray(value))return [];
 const kinds=['acquire','capture','hq','office','infrastructure','defense','victory'],ids=new Set(),integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
 return value.slice(0,60).flatMap(e=>{
  if(!e||typeof e.id!=='string'||e.id.length>80||ids.has(e.id)||!integer(e.round,1,state.round)||!integer(e.actor,0,state.players.length-1)||!PERSONAS[e.persona]||!kinds.includes(e.kind))return [];
  if(e.kind==='victory'?e.position!==null:!Object.hasOwn(CITY_BY_ID,e.position))return [];
  if(!/^\d+:\d+:[a-z]+$/.test(e.id)||Number(e.id.split(':')[0])>state.serial)return [];
  const clean={id:e.id,round:e.round,actor:e.actor,persona:e.persona,kind:e.kind,position:e.position};
  if(['base','headquarters','regional_office'].includes(e.level))clean.level=e.level;
  if(e.cost===null||integer(e.cost,0,1e12))clean.cost=e.cost;
  for(const key of ['previousOwner','target'])if(integer(e[key],0,state.players.length-1))clean[key]=e[key];
  if(integer(e.limit,2,3)&&integer(e.count,0,e.limit)){clean.limit=e.limit;clean.count=e.count;}
  if(['infrastructure','defense'].includes(e.kind)&&clean.count===undefined)return [];
  ids.add(e.id);return [clean];
 });
}

// One visible card; unseen hot-seat opponents are delivered on handover.
// Loading a saved party seeds each viewer's cursor and never replays old news.
export function createNewsQueue(initial=[]){
 let baseline=new Set(initial.map(e=>e.id)),seen=new Map(),viewer=null,pending=[],active=null,remaining=0,options=newsPreferences(),paused=false;
 const markFor=id=>{if(!seen.has(id))seen.set(id,new Set(baseline));return seen.get(id);};
 const advance=()=>{if(!active&&pending.length){active=pending.shift();remaining=options.duration*1000;}};
 return {
  reset(events=[]){baseline=new Set(events.map(e=>e.id));seen.clear();pending=[];active=null;remaining=0;viewer=null;},
  sync(events,id,preferences,{visible=true,suspended=false}={}){
   const next=newsPreferences(preferences),changed=viewer!==id;
   if(changed){viewer=id;pending=[];active=null;}
   if(!next.enabled||!visible){pending=[];active=null;}
   if(next.filter!==options.filter){pending=pending.filter(e=>next.filter==='all'||['capture','victory'].includes(e.kind));if(active&&next.filter==='important'&&!['capture','victory'].includes(active.kind))active=null;}
   if(active&&next.duration!==options.duration)remaining=Math.min(remaining,next.duration*1000);
   options=next;paused=suspended||!visible;
   const present=new Set(events.map(e=>e.id));baseline=new Set([...baseline].filter(id=>present.has(id)));
   for(const e of events)if(!options.enabled||!visible||options.filter==='important'&&!['capture','victory'].includes(e.kind))baseline.add(e.id);
   const cursor=markFor(id);
   for(const e of [...events].reverse()){
    if(cursor.has(e.id)||baseline.has(e.id))continue;cursor.add(e.id);
    if(options.enabled&&visible&&e.actor!==id&&(options.filter==='all'||['capture','victory'].includes(e.kind)))pending.push(e);
   }
   // Bound only the display queue; the persistent journal keeps all 60 records.
   if(pending.length>8)pending=pending.slice(-8);
   // Retain cursors only for the bounded journal plus its initial baseline.
   const live=new Set([...baseline,...events.map(e=>e.id)]);
   for(const [id,entries] of seen)seen.set(id,new Set([...entries].filter(key=>live.has(key))));
   advance();return this.snapshot();
  },
  tick(ms,{hovered=false}={}){if(!paused&&!hovered&&active){remaining-=Math.max(0,ms);if(remaining<=0){active=null;advance();}}return this.snapshot();},
  dismiss(){active=null;advance();return this.snapshot();},
  snapshot(){return {event:active,remaining,progress:Math.max(0,remaining/(options.duration*1000)),hidden:paused,queued:pending.length};}
 };
}
