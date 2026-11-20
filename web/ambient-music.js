export const CAMPAIGN_PLAYLIST=Object.freeze([
 {id:'quiet-horizons',title:'Тихие горизонты',duration:224,gain:.75,src:'./soundtrack/quiet-horizons.m4a',description:'Фортепиано и воздушные созвучия. Просторная, неторопливая тема.'},
 {id:'lantern-garden',title:'Сад фонарей',duration:174,gain:1.25,src:'./soundtrack/lantern-garden.m4a',description:'Арфа и деревянная маримба, тёплая виолончель и редкие ответы кларнета. Лёгкое трёхдольное движение.'}
]);
export const CAMPAIGN_MUSIC=CAMPAIGN_PLAYLIST[0];
export function musicDuration(seconds){const n=Math.round(seconds);return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');}

// One streaming media element for the whole playlist. No decoded long buffers,
// no parallel tracks. Muting preserves position; a completed score advances.
export function createAmbientMusic(context,destination,{onStateChange=()=>{},onTrackChange=()=>{}}={}){
 let media=null,source=null,envelope=null,duckBus=null,wanted=false,disposed=false,generation=0,task=null,status='idle',index=0;
 const setState=value=>{if(status!==value){status=value;onStateChange(value);}};
 const hidePage=()=>!!globalThis.document?.hidden;
 function ensure(){
  if(media)return;
  if(!globalThis.Audio||!context.createMediaElementSource)throw new Error('Music playback unavailable');
  media=new globalThis.Audio(CAMPAIGN_PLAYLIST[index].src);media.loop=false;media.preload='none';
  media.setAttribute?.('playsinline','');media.setAttribute?.('aria-hidden','true');media.setAttribute?.('data-campaign-music','');media.hidden=true;
  globalThis.document?.body?.append?.(media);
  envelope=context.createGain();duckBus=context.createGain();envelope.gain.value=0;duckBus.gain.value=1;
  source=context.createMediaElementSource(media);source.connect(envelope);envelope.connect(duckBus);duckBus.connect(destination);
  media.addEventListener('error',()=>{if(!disposed&&wanted&&media?.error){wanted=false;setState('error');}});
  media.addEventListener('ended',()=>{if(!disposed&&media?.ended&&wanted)select(index+1);});
 }
 function pause(){
  wanted=false;generation++;task=null;media?.pause();
  if(envelope){envelope.gain.cancelScheduledValues(context.currentTime);envelope.gain.setValueAtTime(0,context.currentTime);}
  if(duckBus){duckBus.gain.cancelScheduledValues(context.currentTime);duckBus.gain.setValueAtTime(1,context.currentTime);}
  if(status!=='idle')setState('paused');
 }
 async function start(){
  if(disposed||hidePage())return false;
  wanted=true;if(status==='playing'&&!media?.paused)return true;if(task)return task;
  const version=++generation;
  const pending=(async()=>{
   try{
    ensure();const playingMedia=media;setState('loading');await playingMedia.play();
    if(version!==generation||!wanted||disposed||hidePage()){if(!wanted||disposed||hidePage())playingMedia.pause();return false;}
    envelope.gain.cancelScheduledValues(context.currentTime);envelope.gain.setValueAtTime(0,context.currentTime);envelope.gain.linearRampToValueAtTime(CAMPAIGN_PLAYLIST[index].gain,context.currentTime+1.4);
    setState('playing');return true;
   }catch{
    if(version===generation&&!disposed){wanted=false;media?.pause();setState('error');}return false;
   }
  })();
  task=pending;try{return await pending;}finally{if(task===pending)task=null;}
 }
 async function select(next){
  if(disposed||!Number.isInteger(next))return false;
  const value=((next%CAMPAIGN_PLAYLIST.length)+CAMPAIGN_PLAYLIST.length)%CAMPAIGN_PLAYLIST.length;
  if(value===index&&!media?.ended)return wanted?start():false;
  const resume=wanted;pause();index=value;
  if(media){media.src=CAMPAIGN_PLAYLIST[index].src;media.load();}
  onTrackChange(CAMPAIGN_PLAYLIST[index],index);
  return resume?start():false;
 }
 function duck(){
  if(!duckBus||status!=='playing')return;
  const gain=duckBus.gain,now=context.currentTime;
  if(gain.cancelAndHoldAtTime)gain.cancelAndHoldAtTime(now);else{gain.cancelScheduledValues(now);gain.setValueAtTime(gain.value,now);}
  gain.linearRampToValueAtTime(.62,now+.045);gain.setValueAtTime(.62,now+.25);gain.linearRampToValueAtTime(1,now+1.2);
 }
 function dispose(){
  disposed=true;pause();if(media){media.removeAttribute?.('src');media.load?.();media.remove?.();}
  for(const node of [source,envelope,duckBus])try{node?.disconnect();}catch{}
  media=null;source=null;envelope=null;duckBus=null;
 }
 return {start,pause,duck,dispose,select,next:()=>select(index+1),previous:()=>select(index-1),get track(){return CAMPAIGN_PLAYLIST[index];},get index(){return index;},get status(){return status;}};
}
