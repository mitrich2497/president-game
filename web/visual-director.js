import {getVotes,money,viewerId,voteTarget} from './engine.js';

// Presentation is observational: it never changes the campaign or consumes dice.
const visualAnimations=new Map(),visualEphemera=new Set();
const visualEase='cubic-bezier(.22,.72,.2,1)';
export function visualMotionAllowed(){return !globalThis.document?.hidden&&!globalThis.document?.body?.classList.contains('reduce-motion')&&!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}
export function playVisual(element,frames,options={},cleanup=()=>{}){
 if(!element||!visualMotionAllowed()||typeof element.animate!=='function'){cleanup();return null;}
 let animation;
 try{animation=element.animate(frames,{duration:460,easing:visualEase,fill:'backwards',...options});}catch{cleanup();return null;}
 let complete=false;
 const finish=()=>{if(complete)return;complete=true;visualAnimations.delete(animation);animation.cancel();cleanup();};
 visualAnimations.set(animation,{element,finish});animation.finished.then(finish,finish);
 return animation;
}
export function clearVisualEffects(){
 for(const [animation,entry] of [...visualAnimations]){animation.cancel();entry.finish();}
 for(const element of visualEphemera)element.remove();visualEphemera.clear();
 globalThis.document?.querySelector('#effects-layer')?.replaceChildren();
}
function visualPrune(){for(const [animation,entry] of [...visualAnimations])if(!entry.element.isConnected){animation.cancel();entry.finish();}}
function visualReveal(root,selector,stagger=45){
 [...root.querySelectorAll(selector)].forEach((element,i)=>playVisual(element,[{opacity:0,translate:'0 12px'},{opacity:1,translate:'0 0'}],{delay:Math.min(i,6)*stagger}));
}
export function presentationPlan(before,after){
 if(!before||before.screen!==after.screen)return ['screen'];
 if(after.screen==='setup')return ['hero','faction','roster'].filter(key=>before[key]!==after[key]);
 if(after.screen==='game')return ['location','decision','forecast'].filter(key=>before[key]!==after[key]);
 return [];
}
export function createVisualDirector(root){
 let previous=null;
 return {rendered(screen,{skipEntrance=false}={}){
  visualPrune();
  const value=selector=>root.querySelector(selector)?.textContent||'';
  const selection=root.querySelector('.character-selection');
  const current={screen,hero:selection?.dataset.previewPersona||'',faction:selection?.dataset.faction||'',roster:value('.selection-players')+value('.selection-footer'),location:value('.location-title h2'),decision:value('.action-context'),forecast:!!root.querySelector('.tactical-panel')};
  const changes=presentationPlan(previous,current);previous=current;
  if(changes.includes('screen')){
   clearVisualEffects();
   const selectors={menu:'.palace-brand,.palace-save,.palace-invitation,.palace-navigation,.palace-menu-footer',setup:'.selection-header,.selection-factions,.selection-character,.selection-dossier,.selection-footer',game:'.game-hud,.field-heading,.board-window,.campaign-dock,.campaign-report,.game-footer'};
   if(!skipEntrance)visualReveal(root,selectors[screen]);
  }else{
   if(changes.includes('hero'))visualReveal(root,'.selection-portrait,.selection-dossier',65);
   if(changes.includes('faction'))visualReveal(root,'.selection-thumbnails>button',60);
   if(changes.includes('roster'))visualReveal(root,'.selection-players,.selection-footer',0);
   if(changes.includes('location'))visualReveal(root,'.dock-artwork,.location-title',30);
   if(changes.includes('decision')&&!root.querySelector('.arrival-dock'))visualReveal(root,'.action-context,.main-command>button',45);
   if(changes.includes('forecast')&&current.forecast)visualReveal(root,'.tactical-panel',0);
  }
 }};
}

const visualDialogVersions=new WeakMap();
export function revealVisualDialog(dialog){
 visualDialogVersions.set(dialog,(visualDialogVersions.get(dialog)||0)+1);
 delete dialog.dataset.vfxClosing;
 for(const [animation,entry] of [...visualAnimations])if(entry.element===dialog||dialog.contains(entry.element)||!entry.element.isConnected){animation.cancel();entry.finish();}
 playVisual(dialog,[{opacity:0,translate:'0 14px',scale:'.98'},{opacity:1,translate:'0 0',scale:'1'}],{duration:330});
 visualReveal(dialog,'.modal-top,.city-model-hero,.district-landscape,.law-card,.special-detail,.faction-library>section',30);
 if(dialog.querySelector('.victory-dialog')){
  const crown=dialog.querySelector('.victory');
  visualSparks(crown,18,true);
 }
}
export function dismissVisualDialog(dialog){
 if(!dialog.open||dialog.dataset.vfxClosing)return;
 const version=visualDialogVersions.get(dialog);
 dialog.dataset.vfxClosing='true';
 playVisual(dialog,[{opacity:1,translate:'0 0'},{opacity:0,translate:'0 8px'}],{duration:160,fill:'forwards'},()=>{
  if(visualDialogVersions.get(dialog)===version){delete dialog.dataset.vfxClosing;dialog.close();}
 });
}

function visualTransient(element,frames,options){
 visualEphemera.add(element);
 playVisual(element,frames,options,()=>{element.remove();visualEphemera.delete(element);});
}
function visualSparks(anchor,count=9,ceremony=false){
 if(!anchor||!visualMotionAllowed())return;
 const host=anchor.closest('dialog')?.querySelector('.modal-body')||document.querySelector('#effects-layer');if(!host)return;
 const box=anchor.getBoundingClientRect(),base=host.getBoundingClientRect();
 const x=box.left+box.width/2-base.left+host.scrollLeft,y=box.top+box.height/2-base.top+host.scrollTop;
 for(let i=0;i<count;i++){
  const star=document.createElement('i');star.className='vfx-mote';star.setAttribute('aria-hidden','true');
  star.style.left=x+'px';star.style.top=y+'px';star.style.background=i%3===0?'#a5e5cc':'#f5d997';
  const angle=i/count*Math.PI*2,reach=(ceremony?85:34)+(i%3)*11,dx=Math.cos(angle)*reach,dy=Math.sin(angle)*reach;
  host.append(star);
  visualTransient(star,[{opacity:0,transform:'translate(0,0) scale(.4)'},{opacity:.9,offset:.2},{opacity:0,transform:`translate(${dx}px,${dy}px) scale(.1)`}],{duration:ceremony?1550:850,delay:i*15});
 }
}
export function resourceDeltas(before,after){
 return after.players.map(p=>({id:p.id,name:p.name,cash:p.cash-before.players[p.id].cash,votes:getVotes(after,p.id)-getVotes(before,p.id)})).filter(p=>p.cash||p.votes);
}
export function showResourceFeedback(before,after){
 const changes=resourceDeltas(before,after);if(!changes.length||document.hidden)return;
 const owner=viewerId(after),visible=changes.find(p=>p.id===owner),actor=changes.find(p=>p.id===before.current),notice=actor||visible;
 if(visible){
  for(const [selector,delta] of [[`.participant-card[data-player="${owner}"] .participant-cash`,visible.cash],[`.participant-card[data-player="${owner}"] .participant-votes`,visible.votes]]){
   const stat=document.querySelector(selector);if(!stat||!delta)continue;
   playVisual(stat,[{boxShadow:'inset 0 0 0 1px '+(delta>0?'#b2dfb9':'#d8a18b')+',0 0 24px '+(delta>0?'#8bdab044':'#d8a18b33')},{boxShadow:getComputedStyle(stat).boxShadow}],{duration:1000});
   playVisual(stat.querySelector('strong'),[{opacity:.45,translate:'0 5px'},{opacity:1,translate:'0 0'}],{duration:550});
   if(delta>0)visualSparks(stat,7);
  }
  if(visible.votes){
   const progress=document.querySelector(`.participant-card[data-player="${owner}"] .participant-progress>i`),target=voteTarget(after),from=Math.min(100,getVotes(before,owner)/target*100),to=Math.min(100,getVotes(after,owner)/target*100);
   playVisual(progress,[{width:from+'%'},{width:to+'%'}],{duration:850});
  }
 }
 if(!notice)return;
 const flash=document.createElement('div');flash.className='resource-flash vfx-resource';flash.setAttribute('role','status');
 const label=document.createElement('small');label.textContent=notice.name;flash.append(label);
 for(const [delta,text] of [[notice.cash,money(Math.abs(notice.cash))],[notice.votes,Math.abs(notice.votes)+'% поддержки']]){
  if(!delta)continue;const part=document.createElement('span');part.className=delta>0?'gain':'loss';part.textContent=(delta>0?'+':'−')+text;flash.append(part);
 }
 const host=document.querySelector('#effects-layer');if(!host)return;
 host.querySelectorAll('.vfx-resource').forEach(el=>el.remove());host.append(flash);
 if(!visualMotionAllowed()){setTimeout(()=>flash.remove(),2300);return;}
 visualTransient(flash,[{opacity:0,translate:'0 10px'},{opacity:1,translate:'0 0',offset:.12},{opacity:1,translate:'0 0',offset:.82},{opacity:0,translate:'0 -8px'}],{duration:2300});
}
export function emphasizeDevelopment(position){
 const tile=document.querySelector(`[data-tile="${position}"]`);if(!tile)return;
 playVisual(tile.querySelector('.territory-mark'),[{opacity:0},{opacity:1}],{duration:800});
 const seal=tile.querySelector('.map-campaign-flag>svg');
 playVisual(seal,[{opacity:0,translate:'0 -13px'},{opacity:1,translate:'0 2px',offset:.7},{opacity:1,translate:'0 0'}],{duration:750});
 visualSparks(seal||tile,10);
}
export function revealMovementPhase(){
 document.querySelectorAll('.turn-steps>span').forEach((step,i)=>{
  step.classList.toggle('current',i===1);step.classList.toggle('done',i<1);
  if(i===1)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');
  const number=step.querySelector('i');if(number)number.textContent=i<1?'✓':String(i+1);
 });
}
export function revealAirportRoute(value){
 const wheel=document.querySelector('.wheel-wrap');if(!wheel)return;
 wheel.classList.remove('is-routing');wheel.classList.add('route-revealed');
 wheel.querySelectorAll('.instrument-sector').forEach((sector,i)=>sector.classList.toggle('selected-sector',i===value-1));
 const label=wheel.querySelectorAll('.wheel-label')[value-1];label?.classList.add('chosen-route');
 playVisual(label,[{opacity:.45,scale:'.92'},{opacity:1,scale:'1'}],{duration:600});
 visualSparks(wheel.querySelector('.wheel-hub'),10);
 visualReveal(document,'#wheel-outcome,#wheel-description,#wheel-action',60);
}

export function installVisualInteractions(root){
 const press=event=>{
  if(!visualMotionAllowed())return;
  if(event.type==='click'&&event.detail!==0)return;
  if(event.type==='pointerdown'&&(event.button!==0||event.isPrimary===false))return;
  const button=event.target.closest('button');if(!button||button.disabled||button.getAttribute('aria-disabled')==='true')return;
  const box=button.getBoundingClientRect();if(!box.width||!box.height)return;
  const ripple=document.createElement('span');ripple.className='vfx-press';ripple.setAttribute('aria-hidden','true');
  ripple.style.left=(event.type==='click'?box.width/2:event.clientX-box.left)+'px';ripple.style.top=(event.type==='click'?box.height/2:event.clientY-box.top)+'px';
  button.append(ripple);
  visualTransient(ripple,[{opacity:.65,transform:'translate(-50%,-50%) scale(.15)'},{opacity:0,transform:'translate(-50%,-50%) scale(1)'}],{duration:480});
 };
 root.addEventListener('pointerdown',press,{passive:true});root.addEventListener('click',press);
 return ()=>{root.removeEventListener('pointerdown',press);root.removeEventListener('click',press);};
}
