// Decorative frames never determine the result: the reducer has already saved it.
let finishCurrentDice=null;
export function settleDice(){finishCurrentDice?.();}
export function animateDice(values,{play=()=>{},reduced=globalThis.document?.body?.classList.contains('reduce-motion')||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches}={}){
 const stage=document.querySelector('.dice-theatre');if(!stage)return Promise.resolve();
 settleDice();
 const dice=[...stage.querySelectorAll('.ivory-die')],pips={1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};
 const paint=(el,value)=>{[...el.children].forEach((pip,i)=>pip.classList.toggle('pip',pips[value].includes(i+1)));el.setAttribute('aria-label','Кубик: '+value);};
 return new Promise(resolve=>{
  let interval,timer,landing,closed=false;
  const reveal=()=>{clearInterval(interval);dice.forEach((el,i)=>paint(el,values[i]));stage.classList.add('settled');stage.querySelector?.('.dice-outcome')?.setAttribute('aria-hidden','false');};
  const finish=()=>{if(closed)return;closed=true;reveal();clearTimeout(timer);clearTimeout(landing);document.removeEventListener('visibilitychange',onHidden);finishCurrentDice=null;resolve();};
  const onHidden=()=>{if(document.hidden)finish();};finishCurrentDice=finish;
  document.addEventListener('visibilitychange',onHidden);
  if(reduced||document.hidden){reveal();timer=setTimeout(finish,120);return;}
  stage.classList.add('throwing');let frame=0;
  interval=setInterval(()=>{dice.forEach((el,i)=>paint(el,(frame+i*3)%6+1));frame++;},65);
  landing=setTimeout(()=>{reveal();play('diceLand');},860);
  timer=setTimeout(finish,1650);
 });
}
