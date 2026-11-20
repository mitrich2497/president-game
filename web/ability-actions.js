import {actionPlayerId,lawsuitTargets,planMove,CITY_BY_ID,AIRPORTS,getVotes,voteTarget,cityVotes,canHQ,canOffice,infrastructureTurn,botInfrastructureAction,canSettleSwan,LAWYERS} from './engine.js';

// Decisions use public board information and the bot's own cards only.
// The same policy is used by the application and by complete-game tests.
export function botAbilityAction(s,random=Math.random){
 const p=s.players[actionPlayerId(s)],d=s.decision;if(s.phase!=='decision')return null;
 if(d.kind==='moveChoice'){
  const score=steps=>{const route=planMove(p.position,steps),c=CITY_BY_ID[route.to],r=s.regions[route.to];
   if(p.cash+route.startPasses*1000>=15000)return 10000;
   return route.startPasses*4+(c?(!r?(p.cash+route.startPasses*1000>=c.acquisition_cost_million_rub?3:0):r.owner===p.id?2:-c.levels[r.level].money_million_rub/200):AIRPORTS.includes(route.to)?-1:route.to===24?-3:1);};
  return {type:'KOLCHAK_MOVE',double:score(d.steps*2)>score(d.steps)};
 }
 // Court choices use no opponent card information: the slot is chosen blindly.
 if(d.kind==='courtAccusation')return p.cash<300&&p.persona!=='stalin'?{type:'COURT_RESPONSE',accept:false}:{type:'COURT_RESPONSE',accept:true,index:Math.floor(random()*2)};
 if(d.kind==='reaction')return {type:'KERENSKY_RESPONSE',accept:true,index:Math.floor(random()*2)};
 if(d.kind==='lawyerSecond'){const targets=lawsuitTargets(s);return targets.length?{type:'LAW_SUE',target:targets[Math.floor(random()*targets.length)].id,index:Math.floor(random()*2)}:{type:'END_TURN'};}
 if(d.kind==='swan'&&p.persona==='milyukov'&&d.recipient===undefined&&d.card.penalty){
  // Do not turn a penalty into a gift for Catherine I.
  const target=s.players.filter(x=>x.id!==p.id&&x.persona!=='catherine_i').sort((a,b)=>getVotes(s,b.id)/voteTarget(s)+b.cash/15000-getVotes(s,a.id)/voteTarget(s)-a.cash/15000)[0];
  if(target)return {type:'SWAN_PASS',target:target.id};
 }
 return null;
}
export function botTurnAction(s,random=Math.random){
 if(s.phase==='finished')return null;
 const p=s.players[actionPlayerId(s)],d=s.decision,votes=getVotes(s,p.id),target=voteTarget(s),die=()=>1+Math.floor(random()*6);
 const ability=botAbilityAction(s,random);if(ability)return ability;
 if(s.phase==='ready'||s.phase==='decision'&&d.kind==='end'){
  const index=(p.swanDebts||[]).findIndex((_,i)=>canSettleSwan(s,i));if(index>=0)return {type:'SWAN_SETTLE',index};
 }
 if(s.phase==='ready')return {type:'ROLL',dice:[die(),die()]};
 if(s.phase==='airport')return {type:'AIRPORT',value:die()};
 if(s.phase==='jailed')return p.persona==='lenin'?{type:'LENIN_CONTINUE'}:p.cash>=500?{type:'JAIL_PAY'}:{type:'JAIL_TRY',dice:[die(),die()]};
 if(d.kind==='city'){const c=CITY_BY_ID[p.position];return p.cash>=c.acquisition_cost_million_rub?{type:'BUY'}:{type:'END_TURN'};}
 if(d.kind==='owncity'){
  const c=CITY_BY_ID[p.position],r=s.regions[p.position],win=level=>votes+cityVotes(s,p.position,p.id,level)-cityVotes(s,p.position,p.id,r.level)>=target;
  if(canOffice(s,p.position)&&(win('regional_office')||p.cash-c.regional_office_cost_million_rub>=600))return {type:'OFFICE',position:p.position};
  if(canHQ(s,p.position)&&(win('headquarters')||p.cash-c.headquarters_cost_million_rub>=300))return {type:'HQ',position:p.position};
 }
 if(infrastructureTurn(s))return botInfrastructureAction(s);
 if(d.kind==='swan'){
  const c=d.card;
  if(c.penalty){
   if(p.persona==='catherine_i')return {type:'SWAN',accept:p.cash+c.penalty.cash>=15000?true:votes+c.penalty.votes>=target?false:p.cash<600};
   return {type:'SWAN',accept:p.cash-c.penalty.cash>=400};
  }
  const f=p.persona==='catherine'?2:1,cost=(c.cost||0)*f,win=votes+(c.votes||0)*f>=target;
  return {type:'SWAN',accept:!cost||p.cash>=cost&&(win||p.cash-cost>=400)};
 }
 if(d.kind==='travel')return {type:'TRAVEL'};
 if(d.kind==='lawyer'){
  // A dangerous card is known to its owner. Never inspect a rival's hand.
  const unsafe=p.hand.findIndex(id=>LAWYERS.find(c=>c.id===id)?.payer==='defendant');
  if(unsafe>=0&&!['stalin','khrushchev'].includes(p.persona)&&random()<.3)return {type:'LAW_SWAP',index:unsafe};
  const rivals=lawsuitTargets(s);return {type:'LAW_SUE',index:Math.floor(random()*2),target:rivals[Math.floor(random()*rivals.length)].id};
 }
 return {type:'END_TURN'};
}
