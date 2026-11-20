import {AIRPORTS,tileName} from './engine.js';
import {point,GATES,EXIT_GATES} from './view.js';
import {visualMotionAllowed} from './visual-director.js';

// All presentation paths are derived from the same numbered route as the rules.
export function journeyStops(transition){
 let previous=transition.from;
 const stops=[{...point(previous,transition.player),position:previous}];
 for(const position of transition.path){
  if(AIRPORTS.includes(position))stops.push({...GATES[position],position:null});
  else if(AIRPORTS.includes(previous)&&EXIT_GATES[position])stops.push({...GATES[EXIT_GATES[position]],position:null});
  stops.push({...point(position,transition.player),position});previous=position;
 }
 return stops;
}
const journeyAnimations=new Set();
function journeyRibbon(token,stops){
 if(!visualMotionAllowed())return null;
 const board=token.closest('.board-svg');if(!board)return null;
 const ribbon=document.createElementNS('http://www.w3.org/2000/svg','g');ribbon.setAttribute('class','journey-ribbon');ribbon.setAttribute('aria-hidden','true');ribbon.setAttribute('pointer-events','none');
 ribbon.innerHTML='<path class="route-haze"/><path class="route-thread"/><path class="route-light"/><circle class="route-origin" cx="'+stops[0].x+'" cy="'+stops[0].y+'" r="3"/>';
 board.insertBefore(ribbon,board.querySelector('.pawn'));
 return {step(index){const d=stops.slice(Math.max(0,index-7),index+1).map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' ');ribbon.querySelectorAll('path').forEach(p=>p.setAttribute('d',d));},remove(){ribbon.remove();}};
}
export function settleAnimations(){for(const animation of journeyAnimations){try{animation.finish();}catch{animation.cancel();}}}
export async function animateJourney(transition,{onStep=()=>{}}={}){
 const token=document.querySelector('#pawn-'+transition.player);if(!token)return;
 const stops=journeyStops(transition),reduced=!visualMotionAllowed();
 const ribbon=journeyRibbon(token,stops);
 const status=document.querySelector('#movement-status');
 token.classList.add('travelling');
 try{
  for(let i=1;i<stops.length;i++){
   const from=stops[i-1],to=stops[i],translate=p=>`translate(${p.x}px,${p.y}px)`;
   if(!reduced&&!document.hidden&&typeof token.animate==='function'){
    const animation=token.animate([{transform:translate(from)},{transform:translate(to)}],{duration:Math.min(200,125+Math.hypot(to.x-from.x,to.y-from.y)*.2),easing:'cubic-bezier(.2,.65,.3,1)',fill:'forwards'});
    journeyAnimations.add(animation);try{await animation.finished;}catch{}finally{token.style.transform=translate(to);journeyAnimations.delete(animation);animation.cancel();}
   }else token.style.transform=translate(to);
   ribbon?.step(i);
   if(to.position!==null){
    onStep(to.position);
    const viewport=document.querySelector('.board-window.zoomed');if(viewport&&!document.hidden){const b=token.getBoundingClientRect(),v=viewport.getBoundingClientRect();if(b.left<v.left+28||b.right>v.right-28||b.top<v.top+28||b.bottom>v.bottom-28)viewport.scrollTo({left:viewport.scrollLeft+b.x+b.width/2-v.x-v.width/2,top:viewport.scrollTop+b.y+b.height/2-v.y-v.height/2,behavior:reduced?'instant':'smooth'});}
    document.querySelectorAll('.journey-step').forEach(el=>el.classList.remove('journey-step'));
    document.querySelector(`[data-tile="${to.position}"]`)?.classList.add('journey-step');
    if(status)status.textContent=tileName(to.position)+' · '+String(to.position).padStart(2,'0');
   }
  }
 }finally{ribbon?.remove();token.classList.remove('travelling');document.querySelectorAll('.journey-step').forEach(el=>el.classList.remove('journey-step'));
  const viewport=document.querySelector('.board-window.zoomed');if(viewport&&!document.hidden){const b=token.getBoundingClientRect(),v=viewport.getBoundingClientRect();if(b.left<v.left||b.right>v.right||b.top<v.top||b.bottom>v.bottom)viewport.scrollTo({left:viewport.scrollLeft+b.x+b.width/2-v.x-v.width/2,top:viewport.scrollTop+b.y+b.height/2-v.y-v.height/2,behavior:'instant'});}
 }
}
export function celebrateArrival(position,at,development=false){
 const tile=document.querySelector(`[data-tile="${position}"]`);tile?.classList.add(development?'city-developed':'city-arrived');
 const board=document.querySelector('.board-svg');if(!board)return;
 const burst=document.createElementNS('http://www.w3.org/2000/svg','g');burst.setAttribute('class','arrival-burst');burst.setAttribute('transform',`translate(${at.x} ${at.y})`);burst.setAttribute('pointer-events','none');
 burst.innerHTML='<circle r="24" fill="none" stroke="#ffe4a3" stroke-width="1.6"/><circle r="34" fill="none" stroke="#83d5bd" stroke-width=".8"/>'+(development?Array.from({length:8},(_,i)=>`<path d="M0-30v-8" transform="rotate(${i*45})" stroke="#f3d594" stroke-width="2"/>`).join(''):'');
 board.append(burst);setTimeout(()=>{burst.remove();tile?.classList.remove('city-developed','city-arrived');},1400);
}
