import {validCampaignNews} from './campaign-news.js';
import {CITY_BY_ID,TILE_BY_ID,AIRPORTS,EXITS,PERSONAS,SWAN,TRAVEL,LAWYERS,getVotes,voteTarget,infrastructureLimit} from './engine.js';

// Only validated gameplay data crosses the persistence boundary. Display names and
// card effects come from the catalogue, not from editable browser storage.
export function parseCampaign(raw){
 try{
  if(typeof raw!=='string'||raw.length>250000)return null;
  const s=JSON.parse(raw),valid=(ok)=>{if(!ok)throw Error('Invalid campaign');};
  const integer=(n,min,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
  const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  valid(record(s)&&s.version===1&&['bot','manual'].includes(s.mode));
  valid(Array.isArray(s.players)&&integer(s.players.length,2,6)&&integer(s.current,0,s.players.length-1));
  const last=s.players.length-1;valid(new Set(s.players.map(p=>p?.persona)).size===s.players.length);
  valid(integer(s.round,1)&&integer(s.serial,0)&&typeof s.extraRoll==='boolean');
  valid(['ready','airport','jailed','decision','finished'].includes(s.phase));
  valid(s.scenario===null||['airport','yaroslavl','rent','multiplayer','infrastructure','catherine_i','anna','witte','stolypin','kirov','trotsky','lawyer-deck','swan-deck','swan-blizzard','travel-deck','kolchak','milyukov','khrushchev','kerensky','court-visit'].includes(s.scenario));
  valid(Array.isArray(s.lastDice)&&s.lastDice.length===2&&s.lastDice.every(n=>integer(n,1,6)));
  s.players=s.players.map((p,id)=>{
   valid(record(p)&&p.id===id&&Object.hasOwn(PERSONAS,p.persona)&&typeof p.bot==='boolean');
   valid(integer(p.cash,-1e12,1e12)&&integer(p.bonusVotes,0,1e6)&&integer(p.position,0,47));
   valid(integer(p.jail,0,3)&&integer(p.skip,0,1)&&typeof p.airportPending==='boolean');
   valid(!p.jail||p.position===12);
   valid(!p.airportPending||AIRPORTS.includes(p.position));
   valid(Array.isArray(p.hand)&&p.hand.length===2&&p.hand.every(id=>LAWYERS.some(c=>c.id===id)));
   if(p.swanDebts!==undefined)valid(Array.isArray(p.swanDebts)&&p.swanDebts.length<=1000&&p.swanDebts.every(key=>SWAN.some(c=>c.id===key&&c.penalty)));
   return {id,persona:p.persona,name:PERSONAS[p.persona].name,cash:p.cash,bonusVotes:p.bonusVotes,position:p.position,jail:p.jail,skip:p.skip,airportPending:p.airportPending,hand:p.hand,bot:p.bot,...(p.swanDebts?{swanDebts:[...p.swanDebts]}:{})};
  });
  valid(s.players.some(p=>!p.bot)&&s.mode===(s.players.some(p=>p.bot)?'bot':'manual'));
  valid(record(s.regions));const regions={};
  for(const [pos,r] of Object.entries(s.regions)){
   valid(Object.hasOwn(CITY_BY_ID,pos)&&record(r)&&integer(r.owner,0,last)&&Object.hasOwn(CITY_BY_ID[pos].levels,r.level));
   regions[pos]={owner:r.owner,level:r.level};
   if(r.infrastructure!==undefined){
    valid(record(r.infrastructure));const objects={};
    for(const [id,count] of Object.entries(r.infrastructure)){
     valid(String(Number(id))===id&&integer(Number(id),0,last)&&Number(id)!==r.owner&&integer(count,1,infrastructureLimit(s,Number(id))-1));objects[id]=count;
    }
    if(Object.keys(objects).length)regions[pos].infrastructure=objects;
   }
  }
  s.regions=regions;valid(record(s.decks));
  for(const [key,items] of [['swan',SWAN],['travel',TRAVEL]])valid(Array.isArray(s.decks[key])&&s.decks[key].length<=items.length&&new Set(s.decks[key]).size===s.decks[key].length&&s.decks[key].every(id=>items.some(c=>c.id===id)));
  valid(Array.isArray(s.log)&&s.log.length<=60);
  s.log=s.log.map(l=>{valid(record(l)&&integer(l.id,0,s.serial)&&integer(l.turn,1,s.round)&&integer(l.player,0,last)&&typeof l.text==='string'&&l.text.length<3000);return {id:l.id,turn:l.turn,player:l.player,text:l.text};});
  const p=s.players[s.current],d=s.decision;
  if(s.phase==='decision'){
   valid(record(d)&&['city','owncity','swan','travel','lawyer','hq','infrastructure','president','end','moveChoice','lawyerSecond','reaction','courtAccusation'].includes(d.kind));
   if(['swan','travel'].includes(d.kind)){
    const card=(d.kind==='swan'?SWAN:TRAVEL).find(c=>c.id===d.card?.id);
    valid(!!card&&TILE_BY_ID[p.position]?.kind===d.kind);s.decision={kind:d.kind,card:{...card}};
    if(d.recipient!==undefined){valid(d.kind==='swan'&&p.persona==='milyukov'&&integer(d.recipient,0,last)&&d.recipient!==p.id);s.decision.recipient=d.recipient;}
   }else{
    valid(typeof d.title==='string'&&d.title.length<300&&typeof d.text==='string'&&d.text.length<3000);
    s.decision={kind:d.kind,title:d.title,text:d.text};
    if(['city','owncity'].includes(d.kind)){
     valid(d.position===p.position&&Object.hasOwn(CITY_BY_ID,d.position));
     valid(d.kind==='city'?!regions[d.position]:regions[d.position]?.owner===p.id);
     s.decision.position=d.position;
    }
    if(['lawyer','hq','infrastructure','president'].includes(d.kind))valid(TILE_BY_ID[p.position]?.kind===({hq:'infra',infrastructure:'infra'}[d.kind]||d.kind));
    if(d.kind==='hq')s.decision={kind:'infrastructure',title:'Инфраструктура',text:'Бесплатно разместите или уберите один объект либо постройте платный штаб.'};
    if(d.followup!==undefined){
     const mode={stolypin:'place',anna:'remove',witte:'place'}[p.persona];
     valid(d.kind==='infrastructure'&&record(d.followup)&&!!mode&&d.followup.mode===mode&&Object.hasOwn(CITY_BY_ID,d.followup.used)&&integer(d.followup.used,1,47));
     valid(p.persona==='stolypin'||regions[d.followup.used]?.owner===p.id);
     s.decision.followup={mode,used:d.followup.used};
    }
    if(d.kind==='moveChoice'){
     valid(p.persona==='kolchak'&&!p.jail&&!p.airportPending&&integer(d.steps,2,5));
     valid(s.lastRoll?.purpose==='move'&&s.lastRoll.player===p.id&&s.lastRoll.round===s.round&&Array.isArray(s.lastRoll.dice)&&s.lastRoll.dice.length===2&&s.lastRoll.dice.every(n=>integer(n,1,6))&&s.lastRoll.dice[0]+s.lastRoll.dice[1]===d.steps);
     s.decision.steps=d.steps;
    }
    if(d.kind==='lawyerSecond'){
     valid(p.persona==='khrushchev'&&TILE_BY_ID[p.position]?.kind==='lawyer'&&!p.jail&&last>=2&&Array.isArray(d.accused)&&d.accused.length===1&&integer(d.accused[0],0,last)&&d.accused[0]!==p.id&&typeof d.costsPaid==='boolean');
     s.decision.accused=[...d.accused];s.decision.costsPaid=d.costsPaid;
    }
    if(d.kind==='courtAccusation'){
     const order=Array.from({length:last},(_,i)=>(p.id+i+1)%s.players.length),start=order.indexOf(d.actor);
     valid(p.position===12&&!p.jail&&d.target===p.id&&integer(d.actor,0,last)&&start>=0&&Array.isArray(d.queue)&&JSON.stringify(d.queue)===JSON.stringify(order.slice(start)));
     s.decision.actor=d.actor;s.decision.target=d.target;s.decision.queue=[...d.queue];
     if(d.caseResult!==undefined){
      const c=d.caseResult;valid(record(c)&&typeof c.title==='string'&&c.title.length<300&&typeof c.text==='string'&&c.text.length<3000&&typeof c.verdict==='string'&&c.verdict.length<300&&typeof c.paid==='boolean');
      s.decision.caseResult={title:c.title,text:c.text,verdict:c.verdict,paid:c.paid};
     }
    }
    if(d.kind==='reaction'){
     valid(integer(d.actor,0,last)&&d.actor!==p.id&&s.players[d.actor].persona==='kerensky'&&!s.players[d.actor].jail&&d.target===p.id&&TILE_BY_ID[p.position]?.kind==='lawyer');
     s.decision.actor=d.actor;s.decision.target=d.target;
    }
    if(d.verdict!==undefined){valid(typeof d.verdict==='string'&&d.verdict.length<300);s.decision.verdict=d.verdict;}
   }
  }else s.decision=null;
  // Upgrade the previous release's unhandled normal court visit only.
  // Resolved verdicts and forced detention must never restart an accusation.
  if(s.phase==='decision'&&s.decision?.kind==='end'&&p.position===12&&!p.jail&&s.decision.title==='Судебное следствие'&&s.decision.text==='Обычная остановка не отправляет кандидата под следствие. Можно продолжить кампанию.'){
   const queue=Array.from({length:last},(_,i)=>(p.id+i+1)%s.players.length);
   s.decision={kind:'courtAccusation',actor:queue[0],target:p.id,queue,title:'Возможность обвинить',text:p.name+' на клетке «Судебное следствие». Выберите закрытую карту этого кандидата или откажитесь от иска.'};
  }
  if(s.phase==='airport')valid(p.airportPending&&!p.jail&&!p.skip);
  if(s.phase==='jailed')valid(p.jail>0);
  if(s.phase==='ready')valid(!p.airportPending&&!p.jail&&!p.skip);
  if(s.phase==='finished')valid(integer(s.winner,0,last)&&(s.players[s.winner].cash>=15000||getVotes(s,s.winner)>=voteTarget(s)));
  else valid(s.winner===null);
  const result={version:1,players:s.players,current:s.current,round:s.round,phase:s.phase,decision:s.decision,lastDice:s.lastDice,extraRoll:s.extraRoll,regions:s.regions,log:s.log,serial:s.serial,winner:s.winner,mode:s.mode,scenario:s.scenario,decks:{swan:s.decks.swan,travel:s.decks.travel},transition:null};
  result.lastRoll=null;
  if(s.lastRoll){const r=s.lastRoll;if(record(r)&&integer(r.player,0,last)&&integer(r.round,1,s.round)&&['move','jail'].includes(r.purpose)&&Array.isArray(r.dice)&&r.dice.length===2&&r.dice.every(n=>integer(n,1,6)))result.lastRoll={player:r.player,round:r.round,purpose:r.purpose,dice:[...r.dice]};}
  if(s.lastRoll?.steps!==undefined){
   const r=result.lastRoll,n=s.lastRoll.steps,total=r?.dice[0]+r?.dice[1];
   valid(r?.purpose==='move'&&s.players[r.player].persona==='kolchak'&&total<6&&(n===total||n===2*total));result.lastRoll.steps=n;
  }
  if(typeof s.notice==='string'&&s.notice.length<1000)result.notice=s.notice;
  if(s.lastExit){const exit=EXITS.find(x=>x.value===s.lastExit.value);if(exit)result.lastExit={...exit};}
  if(result.phase==='ready'&&result.notice&&result.lastExit?.district&&p.position===result.lastExit.position)result.notice='Идите через '+result.lastExit.name+'. Бросьте кубики.';
  result.news=validCampaignNews(s.news,result);
  return result;
 }catch{return null;}
}

export function campaignForArchive(active,backup){
 if(!active.scenario)return active;
 const campaign=parseCampaign(backup);
 return campaign&&!campaign.scenario?campaign:null;
}

// A denied/quota-limited storage API must not prevent play or erase the party
// when opening a demonstration. The in-memory copy also supports scenario return.
export function createCampaignStorage(getStorage,onFailure=()=>{}){
 const memory=new Map();let notified=false;
 const fail=()=>{if(!notified){notified=true;onFailure();}};
 return {
  read(key){if(memory.has(key))return memory.get(key);try{const value=getStorage().getItem(key);memory.set(key,value);return value;}catch{fail();return null;}},
  write(key,value){memory.set(key,value);try{getStorage().setItem(key,value);return true;}catch{fail();return false;}},
  remove(key){memory.set(key,null);try{getStorage().removeItem(key);return true;}catch{fail();return false;}}
 };
}
