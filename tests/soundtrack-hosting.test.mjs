import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import {CAMPAIGN_PLAYLIST} from '../web/ambient-music.js';

const contents='abcdefgh';
const origin='https://game.example/';
function open(track,options){
 return worker.fetch(new Request(new URL(track.src,origin),options),{ASSETS:{
  fetch(request){
   assert.equal(new URL(request.url).pathname,'/assets/audio/'+track.id+'.m4a');
   assert.equal(request.headers.has('Range'),false);
   return new Response(request.method==='HEAD'?null:contents,{headers:{
    'Content-Type':'application/octet-stream','Content-Length':String(contents.length),ETag:'"track"'
   }});
  }
 }});
}

test('hosted soundtrack uses audio MIME and preserves full GET and HEAD',async()=>{
 for(const track of CAMPAIGN_PLAYLIST){
  for(const method of ['GET','HEAD']){
   const response=await open(track,{method});
   assert.equal(response.status,200);
   assert.equal(response.headers.get('Content-Type'),'audio/mp4');
   assert.equal(response.headers.get('Accept-Ranges'),'bytes');
   assert.equal(response.headers.get('Content-Length'),String(contents.length));
   assert.equal(await response.text(),method==='HEAD'?'':contents);
  }
 }
});

test('hosted soundtrack handles Safari probes, open and suffix ranges',async()=>{
 const track=CAMPAIGN_PLAYLIST[0];
 for(const [range,interval,body] of [
  ['bytes=0-1','0-1','ab'],
  ['bytes=3-','3-7','defgh'],
  ['bytes=-3','5-7','fgh'],
  ['bytes=6-99','6-7','gh'],
 ]){
  const response=await open(track,{headers:{Range:range,'If-Range':'"track"'}});
  assert.equal(response.status,206);
  assert.equal(response.headers.get('Content-Type'),'audio/mp4');
  assert.equal(response.headers.get('Content-Range'),'bytes '+interval+'/'+contents.length);
  assert.equal(response.headers.get('Content-Length'),String(body.length));
  assert.equal(await response.text(),body);
 }
 const missing=await open(track,{headers:{Range:'bytes=8-'}});
 assert.equal(missing.status,416);
 assert.equal(missing.headers.get('Content-Range'),'bytes */8');
 const stale=await open(track,{headers:{Range:'bytes=0-1','If-Range':'"older-track"'}});
 assert.equal(stale.status,200);
 assert.equal(await stale.text(),contents);
});
