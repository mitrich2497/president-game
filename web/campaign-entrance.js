import {visualMotionAllowed} from './visual-director.js';
import {palacePainting,palaceFlourish} from './palace-art.js';

// One transition owns one commit. Skipping, changing tabs and repeated clicks
// must never create a second campaign or leave the interface inert.
export function createCampaignEntrance(root,{motionAllowed=visualMotionAllowed,mount=mountCampaignEntrance,clock=globalThis}={}){
 let active=null;
 function play(commit,details={}){
  if(active)return active.promise;
  let resolve,reject;
  const run={committed:false,settled:false,timers:[],view:null,promise:new Promise((yes,no)=>{resolve=yes;reject=no;})};
  active=run;
  const cleanup=()=>{for(const timer of run.timers)clock.clearTimeout(timer);run.view?.remove();if(active===run)active=null;};
  const apply=()=>{if(!run.committed){run.committed=true;commit();}};
  const fail=error=>{if(run.settled)return;run.settled=true;cleanup();reject(error);};
  const finish=()=>{
   if(run.settled)return;
   try{apply();run.settled=true;cleanup();resolve(true);}catch(error){fail(error);}
  };
  run.finish=finish;
  if(!motionAllowed()){finish();return run.promise;}
  try{run.view=mount(root,details,finish);}catch{finish();return run.promise;}
  run.timers.push(clock.setTimeout(()=>{
   if(run.settled)return;
   try{apply();run.view?.reveal();}catch(error){fail(error);}
  },190));
  // A timer also completes the transition if the animation API is interrupted.
  run.timers.push(clock.setTimeout(finish,1180));
  return run.promise;
 }
 return {play,finish(){active?.finish();},get active(){return !!active;}};
}

function mountCampaignEntrance(root,{fresh=false,player='',round=1},skip){
 const doc=root.ownerDocument,layer=doc.createElement('section'),animations=[];
 const previousInert=root.inert;
 layer.className='campaign-entrance';layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-labelledby','campaign-entrance-title');
 layer.innerHTML=`<div class="entrance-veil" aria-hidden="true"></div><div class="entrance-wing entrance-wing-left" aria-hidden="true"><i></i></div><div class="entrance-wing entrance-wing-right" aria-hidden="true"><i></i></div><div class="entrance-light" aria-hidden="true"></div><div class="entrance-identity"><div class="entrance-seal" aria-hidden="true"><span></span>${palacePainting('crest')}</div><small>ПРЕЗИДЕНТ · ПРЕДВЫБОРНАЯ ГОНКА</small><h2 id="campaign-entrance-title"></h2>${palaceFlourish()}<p></p></div><button type="button" class="entrance-skip">Пропустить <span aria-hidden="true">→</span></button>`;
 layer.querySelector('h2').textContent=fresh?'Новая кампания':'Кампания продолжается';
 layer.querySelector('.entrance-identity p').textContent=`Раунд ${round} · ${player}`;
 const animate=(el,frames,options)=>{
  if(!el?.animate)return;
  try{const a=el.animate(frames,{duration:600,easing:'cubic-bezier(.22,.75,.2,1)',fill:'both',...options});animations.push(a);a.finished.catch(()=>{});}catch{}
 };
 const keydown=event=>{if(event.key==='Escape'){event.preventDefault();skip();}else if(event.key==='Tab'){event.preventDefault();layer.querySelector('button').focus({preventScroll:true});}};
 const skipButton=layer.querySelector('button');skipButton.addEventListener('click',skip);layer.addEventListener('keydown',keydown);
 root.inert=true;doc.body.classList.add('campaign-entering');doc.body.append(layer);skipButton.focus({preventScroll:true});
 animate(layer,[{opacity:0},{opacity:1}],{duration:180});
 animate(layer.querySelector('.entrance-identity'),[{opacity:0,transform:'translateY(8px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:320});
 let removed=false;
 return {
  reveal(){
   const left=layer.querySelector('.entrance-wing-left'),right=layer.querySelector('.entrance-wing-right');
   animate(left,[{transform:'translateX(0)'},{transform:'translateX(-102%)'}],{duration:830,delay:100});
   animate(right,[{transform:'translateX(0)'},{transform:'translateX(102%)'}],{duration:830,delay:100});
   animate(layer.querySelector('.entrance-veil'),[{opacity:1},{opacity:0}],{duration:660,delay:200});
   animate(layer.querySelector('.entrance-light'),[{opacity:0,transform:'scaleX(.15)'},{opacity:.8,offset:.25},{opacity:0,transform:'scaleX(1.6)'}],{duration:750,delay:80});
   animate(layer.querySelector('.entrance-identity'),[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-12px)'}],{duration:300,delay:100});
   animate(skipButton,[{opacity:1},{opacity:0}],{duration:150,delay:770});
   animate(root.querySelector('.board-window'),[{opacity:.1,transform:'translateY(12px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:680,delay:200});
   animate(root.querySelector('.campaign-dock'),[{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:460,delay:330});
   root.querySelectorAll('.participant-card').forEach((el,i)=>animate(el,[{opacity:0,transform:'translateY(-10px)'},{opacity:1,transform:'translateY(0)'}],{duration:400,delay:230+i*45}));
  },
  remove(){
   if(removed)return;removed=true;
   const hadFocus=layer.contains(doc.activeElement);
   for(const a of animations)a.cancel();
   layer.removeEventListener('keydown',keydown);skipButton.removeEventListener('click',skip);layer.remove();
   root.inert=previousInert;doc.body.classList.remove('campaign-entering');
   if(hadFocus&&!doc.hidden)(root.querySelector('.main-command button:not(:disabled)')||root.querySelector('button:not(:disabled)'))?.focus({preventScroll:true});
  }
 };
}
