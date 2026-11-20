import {actionPlayerId,getVotes} from './engine.js';

// One plan for humans and bots, based on committed results rather than button labels.
export function actionSoundCues(before,after,action,{court=null,moment=null}={}){
 if(after.phase==='finished')return [];
 const actor=actionPlayerId(before),gain=before.players[actor].bot?.72:1,cues=[];
 const add=(name,delay=0)=>{if(!cues.some(c=>c.name===name))cues.push({name,delay,gain});};
 if(before.current!==after.current){add('turn');return cues;}
 const newCard=['swan','travel'].includes(after.decision?.kind)&&before.decision?.card?.id!==after.decision.card.id;
 if(court){add('cardFlip');add('court',.18);}
 else if(newCard){add('draw');add(after.decision.kind==='travel'?'travel':'event',.2);}
 else if(action.type==='LAW_SWAP')add('shuffle');
 else if(action.type==='SWAN_PASS'||action.type==='LAW_SUE')add('draw');
 else if(['HQ','OFFICE','INFRA_PLACE','INFRA_REMOVE'].includes(action.type))add('build');
 else if(action.type==='TRAVEL')add('cardFlip');

 const deltas=after.players.map((p,i)=>({id:i,cash:p.cash-before.players[i].cash,votes:getVotes(after,i)-getVotes(before,i)}));
 const cash=deltas[actor].cash;
 // A transfer is one transaction. Prefer the decision-maker; otherwise its recipient.
 const moneyDelta=cash||deltas.find(d=>d.cash)?.cash||0;
 if(after.transition?.startPasses>0){
  // Passing Start and paying rent can cancel out in the balance. Both still happen.
  const rent=deltas.filter(d=>d.id!==actor&&d.cash>0).reduce((sum,d)=>sum+d.cash,0);
  if(cash+rent>0)add('coin',cues.length?.2:0);
  if(rent>0)add('payment',.38);
 }else if(moneyDelta){
  const purchase=['BUY','HQ','OFFICE'].includes(action.type)&&cash<0;
  add(purchase?'coinCount':moneyDelta>0?'coin':'payment',cues.length?.25:0);
 }
 const voteDelta=deltas[actor].votes||deltas.find(d=>d.votes)?.votes||0;
 if(voteDelta)add(voteDelta>0?'supportUp':'supportDown',cues.length?.55:0);
 if(!cues.length){
  // Declined offers have no reward cue; support penalties at zero stay silent too.
  const declined=action.type==='SWAN'&&action.accept===false;
  if(!declined&&moment?.cue&&!['payment','coin','build'].includes(moment.cue))add(moment.cue);
  else if(after.transition)add('arrival');
 }
 return cues;
}
