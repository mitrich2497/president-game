import {playVisual,visualMotionAllowed} from './visual-director.js';

// A reveal is keyed to a real arrival, not a rerender, preview click or resize.
// Never gate a game action on animation completion.
export function createArrivalDirector(root,{play=playVisual,allowed=visualMotionAllowed}={}){
 let previous=null;
 return {rendered(screen,{busy=false}={}){
  if(screen!=='game'){previous=null;return;}
  if(busy)return;
  const panel=root.querySelector('.arrival-dock');
  if(!panel){previous=null;return;}
  const key=panel.dataset.arrivalKey,changed=key!==previous;previous=key;
  if(!changed||!allowed())return;
  const card=panel.querySelector('.arrival-card'),deck=panel.dataset.arrivalKind!=='city';
  const mobile=globalThis.matchMedia?.('(max-width: 850px) and (orientation: portrait)').matches;
  play(card,deck?[{opacity:0,transform:'perspective(1100px) rotateY(-16deg) translateY(14px)',filter:'brightness(.65)'},{opacity:1,transform:'perspective(1100px) rotateY(0deg) translateY(0)',filter:'brightness(1)'}]:[{opacity:0,transform:`translate(${mobile?'0, 18px':'18px, 0'}) scale(.975)`},{opacity:1,transform:'translate(0, 0) scale(1)'}],{duration:deck?720:780});
  play(panel.querySelector('.arrival-light'),[{opacity:0,transform:'translateX(-110%)'},{opacity:.55,offset:.35},{opacity:0,transform:'translateX(110%)'}],{duration:780,delay:90});
  const tile=root.querySelector(`[data-tile="${panel.dataset.arrivalPosition}"] .tile-hit`);
  play(tile,[{fill:'#ffe1a7',fillOpacity:.24,stroke:'#fff1c2',strokeWidth:4},{fill:'transparent',fillOpacity:0,stroke:'#f4d691',strokeWidth:2}],{duration:700});
 }};
}
