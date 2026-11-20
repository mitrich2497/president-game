// Original, deterministic physical textures. Audio randomness never touches game dice.
export const TACTILE_CUES=Object.freeze({roll:.88,diceLand:.26,card:.42,draw:.38,cardFlip:.32,shuffle:.78,page:.42,coin:.55,coinCount:.78,payment:.55,supportUp:1.05,supportDown:.95});
export function renderFoley(name,sampleRate=44100,variant=0){
 if(!Object.hasOwn(TACTILE_CUES,name))throw new RangeError('Unknown sound');
 if(!Number.isFinite(sampleRate)||sampleRate<1000||sampleRate>192000)throw new RangeError('Invalid sample rate');
 const output=new Float32Array(Math.ceil(TACTILE_CUES[name]*sampleRate));
 let seed=(0x7e548b91+Math.trunc(variant)*7919+[...name].reduce((a,c)=>a+c.charCodeAt(0)*31,0))>>>0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const add=(at,seconds,fn)=>{const start=Math.round(at*sampleRate),length=Math.min(Math.round(seconds*sampleRate),output.length-start);for(let i=0;i<length;i++)output[start+i]+=fn(i/sampleRate,i);};
 const resonant=(at,duration,gain,frequencies,decay)=>{
  const detune=.97+random()*.06,phases=frequencies.map(()=>random()*.2);
  add(at,duration,t=>{const attack=Math.min(1,t/.0015),tail=Math.min(1,(duration-t)/.012);let value=0;for(let k=0;k<frequencies.length;k++)value+=Math.sin(2*Math.PI*Math.min(sampleRate*.42,frequencies[k]*detune)*t+phases[k])*Math.exp(-t*(1+k*.55)/decay)/(1+k*.8);return value*gain*attack*tail;});
 };
 const paper=(at,duration,gain,roughness=1)=>{
  let low=0,slow=0;const flutter=29+random()*30;
  add(at,duration,t=>{const white=random()*2-1;low+=.25*(white-low);slow+=.045*(white-slow);const texture=(low-slow)*1.7+white*.08;return texture*gain*Math.sin(Math.PI*t/duration)**.8*(.72+.28*Math.sin(t*flutter*2*Math.PI))*roughness;});
 };
 const impact=(at,gain,hardness=1)=>{
  resonant(at,.16,gain,[183,327,613,1087].map(f=>f*hardness),.024);
  resonant(at,.1,gain*.26,[91],.025);
  paper(at,.016,gain*.95);
 };
 const metal=(at,gain)=>{resonant(at,.3,gain,[1670,2938,4212,5597],.075);paper(at,.014,gain*.7);};
 if(name==='roll'){
  paper(0,.17,.1);
  [0,.044,.112,.183,.282,.386,.515,.665].forEach((at,i)=>impact(at+(i?random()*.012:0),(.19-i*.013)*(1+random()*.18),.8+random()*.4));
 }else if(name==='diceLand'){
  impact(0,.23,.94);impact(.048,.13,1.14);impact(.115,.045,1.04);
 }else if(name==='card'){
  [0,.035,.075,.12,.17].forEach((at,i)=>paper(at,.16,.19-i*.017));impact(.32,.025,1.4);
 }else if(name==='draw'){
  paper(0,.22,.25);paper(.16,.11,.09);impact(.27,.055,1.1);
 }else if(name==='cardFlip'){
  paper(0,.16,.22);paper(.12,.12,.13);impact(.22,.045,1.25);
 }else if(name==='shuffle'){
  paper(0,.18,.18);
  for(let i=0;i<18;i++)paper(.11+i*.022+random()*.005,.035,.12+Math.sin(i/18*Math.PI)*.14);
  paper(.51,.15,.23);impact(.65,.07,.8);
 }else if(name==='page'){
  paper(0,.3,.22);paper(.2,.16,.085);
 }else if(name==='coin'){
  metal(0,.13);metal(.09,.085);metal(.23,.05);
 }else if(name==='coinCount'){
  [0,.12,.23,.33,.42,.48].forEach((at,i)=>{metal(at,.11-i*.007);impact(at,.035,.65);});
 }else if(name==='payment'){
  paper(0,.22,.22);metal(.12,.09);metal(.25,.055);impact(.3,.045,.65);
 }else{
  const notes=name==='supportUp'?[392,493.88,587.33]:[493.88,392,329.63];
  notes.forEach((pitch,i)=>{const at=i*.125;resonant(at,.65,.105-i*.012,[pitch,pitch*2,pitch*3.01],.22);paper(at,.06,.014);});
 }
 // Remove DC and gently master transients; both ends are silent, without a hard cut.
 let previous=0,dc=0,peak=0;
 for(let i=0;i<output.length;i++){const raw=output[i];dc=raw-previous+.995*dc;previous=raw;output[i]=dc;peak=Math.max(peak,Math.abs(dc));}
 const scale=peak>.55?.55/peak:1,fade=Math.round(sampleRate*.006);
 for(let i=0;i<output.length;i++)output[i]*=scale*Math.min(1,i/fade,(output.length-1-i)/fade);
 return output;
}
