import {createAmbientMusic,CAMPAIGN_MUSIC} from './ambient-music.js';
import {TACTILE_CUES,renderFoley} from './foley.js';
import {STUDIO_FOLEY} from './studio-foley.js';
// Recorded, edited foley is loaded from the bundled asset, once per audio context.
// The deterministic synthesis below is a fallback for unavailable audio decoding.
export const SOUND_SCORE={
 click:[[740,0,.07,.06]],
 roll:[],diceLand:[],
 step:[[240,0,.065,.07],[410,.018,.04,.025]],
 arrival:[[392,0,.3,.075],[587.33,.08,.45,.05]],
 turn:[[392,0,.3,.06],[523.25,.14,.42,.055]],
 campaign:[[130.81,0,1.1,.055],[261.63,.08,1,.05],[392,.2,.85,.045],[523.25,.34,1,.035]],
 event:[[196,0,.7,.05],[293.66,.12,.65,.04],[311.13,.25,.75,.025]],
 card:[],draw:[],cardFlip:[],shuffle:[],page:[],
 court:[[130.81,0,.15,.14],[196,.05,.22,.05],[261.63,.18,.55,.045]],
 travel:[[329.63,0,.28,.055],[392,.11,.3,.05],[523.25,.22,.5,.05]],
 wheel:[],
 route:[[392,0,.22,.06],[587.33,.09,.4,.06]],
 build:[[261.63,0,.18,.065],[392,.1,.3,.07],[523.25,.22,.6,.065],[659.25,.33,.75,.035]],
 coin:[],coinCount:[],payment:[],supportUp:[],supportDown:[],
 victory:[[261.63,0,.7,.07],[392,.18,.6,.06],[523.25,.36,.6,.06],[659.25,.55,.7,.05],[783.99,.75,1.15,.045]]
};
export const FOLEY_SCORE={
 click:[[0,.025,.085,1700]],
 step:[[0,.035,.075,1000]],
 court:[[0,.05,.18,680]],
 build:[[0,.08,.08,1100]],
 wheel:Array.from({length:19},(_,i)=>{const t=i/18;return [2.4*(.32*t+.68*t*t),.035,.06,1800-i*28];})
};
export function soundVolume(value,fallback=.65){const n=typeof value==='number'?value:Number(value);return value===null||value===''||!Number.isFinite(n)?fallback:Math.max(0,Math.min(1,n));}
export async function loadStudioRecording(context){
 if(!context.decodeAudioData||!globalThis.fetch)return null;
 const response=await fetch(STUDIO_FOLEY.src);if(!response.ok)throw new Error('Sound recording unavailable');
 return context.decodeAudioData(await response.arrayBuffer());
}
export function createSoundscape({enabled=false,effectsVolume=.65,musicVolume=.25,musicEnabled=false,onChange=()=>{},onSettingsChange=()=>{},onMusicStateChange=()=>{},recordingLoader=loadStudioRecording}={}){
 effectsVolume=soundVolume(effectsVolume);musicVolume=soundVolume(musicVolume,.25);
 let context=null,master=null,effects=null,music=null,score=null,unlocked=false,unlocking=null,noise=null,pending=null,generation=0,studio=null,studioTask=null;
 const voices=new Set(),lastCue=new Map(),textures=new Map(),variants=new Map();
 const settings=()=>({effectsVolume,musicVolume,musicEnabled});
 const hidden=()=>!!globalThis.document?.hidden;
 const ramp=(param,value)=>{if(!param)return;param.cancelScheduledValues?.(context.currentTime);if(param.setTargetAtTime)param.setTargetAtTime(value,context.currentTime,.035);else param.value=value;};
 const applyLevels=()=>{if(!context)return;ramp(master?.gain,enabled?.65:0);ramp(effects?.gain,effectsVolume**2);ramp(music?.gain,musicEnabled?musicVolume**1.5*.6:0);};
 function release(voice){if(!voices.delete(voice))return;for(const node of voice.nodes)try{node.disconnect();}catch{}}
 function stopVoices(group){for(const voice of [...voices])if(!group||voice.group===group){try{voice.source.stop();}catch{}release(voice);}}
 function stopMusic(){score?.pause();}
 function buffer(){
  if(noise)return noise;if(!context.createBuffer)return null;
  noise=context.createBuffer(1,context.sampleRate,context.sampleRate);const data=noise.getChannelData(0);let seed=0x195832;
  for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}
  return noise;
 }
 function voice({pitch=0,offset=0,duration=.2,level=.05,cutoff=1400,group='effects',noiseVoice=false,pad=false}){
  if(voices.size>=80)return;
  let source,filter;
  if(noiseVoice){if(!context.createBufferSource||!buffer())return;source=context.createBufferSource();source.buffer=buffer();}
  else{source=context.createOscillator();source.type=pad?'sine':'triangle';source.frequency.setValueAtTime(pitch,context.currentTime+offset);}
  const gain=context.createGain(),at=context.currentTime+offset,attack=pad?.35:noiseVoice?.006:.008;
  gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(level,at+Math.min(attack,duration*.35));gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
  const nodes=[source,gain];
  if(context.createBiquadFilter){filter=context.createBiquadFilter();filter.type=noiseVoice?'bandpass':'lowpass';filter.frequency.value=noiseVoice?cutoff:pad?900:Math.max(1000,pitch*3);filter.Q.value=noiseVoice?.65:.45;source.connect(filter);filter.connect(gain);nodes.push(filter);}else source.connect(gain);
  gain.connect(group==='music'?music:effects);
  const entry={source,nodes,group};voices.add(entry);source.onended=()=>release(entry);
  source.start(at);source.stop(at+duration+.02);
 }
 function tactile(name,offset,gain){
  if(voices.size>=80||!context.createBufferSource||!context.createBuffer)return;
  const variant=(variants.get(name)||0)%3;variants.set(name,variant+1);
  const key=name+':'+variant;let pcm=textures.get(key);
  if(!pcm){const data=renderFoley(name,context.sampleRate,variant);pcm=context.createBuffer(1,data.length,context.sampleRate);pcm.getChannelData(0).set(data);textures.set(key,pcm);}
  const source=context.createBufferSource(),volume=context.createGain(),at=context.currentTime+offset;
  source.buffer=pcm;volume.gain.setValueAtTime(gain,at);source.connect(volume);volume.connect(effects);
  const entry={source,nodes:[source,volume],group:'effects'};voices.add(entry);source.onended=()=>release(entry);
  source.start(at);source.stop(at+TACTILE_CUES[name]+.02);
 }
 function recorded(name,offset,gain){
  if(voices.size>=80)return;
  const choices=STUDIO_FOLEY.cues[name],index=(variants.get(name)||0)%choices.length,clip=choices[index];variants.set(name,index+1);
  const source=context.createBufferSource(),volume=context.createGain(),at=context.currentTime+offset;
  source.buffer=studio;volume.gain.setValueAtTime(gain,at);source.connect(volume);volume.connect(effects);
  const entry={source,nodes:[source,volume],group:'effects'};voices.add(entry);source.onended=()=>release(entry);
  source.start(at,clip.offset,clip.duration);source.stop(at+clip.duration+.01);
 }
 function scheduleCue(name,{delay=0,gain=1}={}){
  delay=Number.isFinite(delay)?Math.max(0,Math.min(2,delay)):0;gain=soundVolume(gain,1);if(!gain)return;
  const now=context.currentTime;if(now-(lastCue.get(name)??-Infinity)<(name==='step'?.075:.055))return;lastCue.set(name,now);
  if(studio&&Object.hasOwn(STUDIO_FOLEY.cues,name))recorded(name,delay,gain);
  else{
   if(Object.hasOwn(TACTILE_CUES,name))tactile(name,delay,gain);
   for(const [pitch,offset,duration,level] of SOUND_SCORE[name]||[]){voice({pitch,offset:offset+delay,duration,level:level*gain});if(duration>.25)voice({pitch:pitch*2,offset:offset+delay,duration:duration*.65,level:level*.16*gain});}
   for(const [offset,duration,level,cutoff] of FOLEY_SCORE[name]||[])voice({offset:offset+delay,duration,level:level*gain,cutoff,noiseVoice:true});
  }
  if(['campaign','court','event','travel','build','victory','route'].includes(name))score?.duck();
 }
 function startMusic(){
  if(!enabled||!unlocked||context?.state!=='running'||!musicEnabled||musicVolume===0||hidden())return;
  score??=createAmbientMusic(context,music,{onStateChange:onMusicStateChange,onTrackChange:onMusicStateChange});score.start();
 }
 async function unlock(){
  if(!enabled||hidden())return false;
  if(unlocked&&context?.state==='running'){startMusic();return true;}
  if(unlocking)return unlocking;
  const version=generation;
  const task=(async()=>{
   try{
    const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return false;
    context??=new Audio();const current=context;
    if(!master){
     master=context.createGain();effects=context.createGain();music=context.createGain();effects.connect(master);music.connect(master);
     if(context.createDynamicsCompressor){const limiter=context.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=12;limiter.ratio.value=5;limiter.attack.value=.004;limiter.release.value=.15;master.connect(limiter);limiter.connect(context.destination);}else master.connect(context.destination);
     applyLevels();
    }
    if(current.state!=='running'&&current.state!=='closed')await current.resume();
    if(version!==generation||!enabled||hidden()||context!==current)return false;
    unlocked=current.state==='running';
    if(unlocked){
     // Keep synthesized cues available while the studio recording is loading.
     studioTask??=Promise.resolve().then(()=>recordingLoader(current)).then(recording=>{
      if(context===current)studio=recording;
     }).catch(()=>{});
     startMusic();
     if(pending&&Date.now()-pending.at<300&&effectsVolume>0)scheduleCue(pending.name,pending.options);
     pending=null;
    }
    return unlocked;
   }catch{if(version===generation)unlocked=false;return false;}
  })();
  unlocking=task;try{return await task;}finally{if(unlocking===task)unlocking=null;}
 }
 function play(name,options={}){
  if(!enabled||hidden()||effectsVolume===0||!Object.hasOwn(SOUND_SCORE,name))return;
  if(!unlocked||context?.state!=='running'){if(unlocking)pending={name,options,at:Date.now()};return;}
  try{scheduleCue(name,options);}catch{stopVoices('effects');}
 }
 return {
  get enabled(){return enabled;},get settings(){return settings();},get musicState(){return score?.status||'idle';},get musicTrack(){return score?.track||CAMPAIGN_MUSIC;},get musicIndex(){return score?.index||0;},selectMusic(index){if(!context)return;score??=createAmbientMusic(context,music,{onStateChange:onMusicStateChange,onTrackChange:onMusicStateChange});return score.select(index);},unlock,play,
  preview(name){stopVoices('effects');pending=null;lastCue.delete(name);play(name);},
  async toggle(){
   const version=++generation;enabled=!enabled;unlocking=null;
   if(!enabled){pending=null;unlocked=false;stopMusic();stopVoices();applyLevels();}
   else{applyLevels();const ready=await unlock();if(version!==generation)return enabled;if(!ready){enabled=false;stopMusic();stopVoices();applyLevels();}}
   onChange(enabled);if(enabled)play('turn');return enabled;
  },
  setEffectsVolume(value){effectsVolume=soundVolume(value);if(effectsVolume===0)stopVoices('effects');applyLevels();onSettingsChange(settings());},
  setMusicVolume(value){musicVolume=soundVolume(value,.25);if(musicVolume===0)stopMusic();applyLevels();startMusic();onSettingsChange(settings());},
  setMusicEnabled(value){musicEnabled=!!value;if(!musicEnabled)stopMusic();applyLevels();startMusic();onSettingsChange(settings());},
  suspend(){generation++;unlocking=null;pending=null;unlocked=false;stopMusic();stopVoices();lastCue.clear();context?.suspend().catch(()=>{});},
  dispose(){generation++;unlocking=null;pending=null;unlocked=false;score?.dispose();score=null;stopVoices();lastCue.clear();textures.clear();variants.clear();context?.close().catch(()=>{});context=null;master=null;effects=null;music=null;noise=null;studio=null;studioTask=null;}
 };
}
