import test from 'node:test';
import assert from 'node:assert/strict';
import {setImmediate} from 'node:timers/promises';
import {createSoundscape} from '../web/sound.js';

test('a pending studio download does not block cues or music',async t=>{
 let recordingLoads=0,musicStarts=0,resolveRecording;
 const recording=new Promise(resolve=>{resolveRecording=resolve;});
 const started=[];
 const parameter=()=>({
  value:1,cancelScheduledValues(){},setTargetAtTime(){},setValueAtTime(){},
  linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}
 });
 const node=()=>({connect(){},disconnect(){}});
 const voice=()=>({...node(),start(){started.push(this);},stop(){}});
 const oldAudio=globalThis.Audio,oldContext=globalThis.AudioContext;
 globalThis.AudioContext=class {
  currentTime=0;
  state='suspended';
  destination={};
  async resume(){this.state='running';}
  async close(){this.state='closed';}
  createGain(){return {...node(),gain:parameter()};}
  createOscillator(){return {...voice(),frequency:parameter()};}
  createMediaElementSource(){return node();}
  createBufferSource(){return voice();}
 };
 globalThis.Audio=class {
  paused=true;
  setAttribute(){}
  addEventListener(){}
  load(){}
  async play(){this.paused=false;musicStarts++;}
  pause(){this.paused=true;}
 };
 const sound=createSoundscape({
  enabled:true,musicEnabled:true,
  recordingLoader:()=>{recordingLoads++;return recording;}
 });
 t.after(()=>{
  resolveRecording(null);
  sound.dispose();
  globalThis.Audio=oldAudio;
  globalThis.AudioContext=oldContext;
 });

 const unlock=sound.unlock();
 sound.play('campaign');
 assert.equal(await Promise.race([unlock,setImmediate(false)]),true);
 assert(started.some(source=>source.frequency),'the first cue uses synthesized audio');
 assert.equal(musicStarts,1);
 assert.equal(recordingLoads,1);

 const studioBuffer={duration:60};
 resolveRecording(studioBuffer);
 await setImmediate();
 sound.play('court');
 assert.equal(started.at(-1).buffer,studioBuffer);
 assert.equal(await sound.unlock(),true);
 assert.equal(recordingLoads,1);
});
