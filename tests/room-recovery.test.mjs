import test from 'node:test';
import assert from 'node:assert/strict';
import {RoomService} from '../multiplayer.mjs';
import {createRoomClient} from '../web/multiplayer-client.js';
import {scenario} from '../web/engine.js';
import {roomScreen} from '../web/multiplayer-ui.js';

const key='president.room.v1';
function memory(){const records=new Map();return {records,getItem:k=>records.get(k)??null,setItem:(k,v)=>records.set(k,v),removeItem:k=>records.delete(k)};}
function bridge(service){
 const control={offline:false,drop:0,dropEntry:false,requests:[]};
 control.fetcher=async(url,options)=>{
  if(control.offline)throw new TypeError('offline');
  const body=options.body&&JSON.parse(options.body),token=options.headers.Authorization?.slice(7),code=url.split('/')[3]?.split('?')[0];
  control.requests.push({url,body});
  try{
   let data;
   if(url==='/api/rooms')data=service.create(body.name,body.seat);
   else if(url.endsWith('/join'))data=service.join(code,body.name,body.seat);
   else if(url.endsWith('/command')){data=service.command(code,token,body);if(control.drop-- >0)throw new TypeError('response lost');}
   else data=service.poll(code,token,Number(new URL(url,'http://test').searchParams.get('after')??-1));
   if(control.dropEntry&&data.token){control.dropEntry=false;throw new TypeError('entry response lost');}
   return {ok:true,json:async()=>structuredClone(data)};
  }catch(error){if(!error.status)throw error;return {ok:false,status:error.status,json:async()=>({error:error.message})};}
 };
 return control;
}
async function game(t){
 const service=new RoomService({die:()=>2}),storage=memory(),legacyStorage=memory(),api=bridge(service),errors=[];
 const make=extra=>{const c=createRoomClient({storage,legacyStorage,fetcher:api.fetcher,onError:e=>errors.push(e),...extra});t.after(()=>c.stop());return c;};
 const client=make();await client.create('Хозяин');const other=service.join(client.code,'Друг');
 let serial=0;for(const who of [JSON.parse(storage.getItem(key)),other])service.command(client.code,who.token,{kind:'ready',ready:true,request:'ready-'+(++serial)+'-test',revision:service.get(client.code).revision});
 await client.reconnect();await client.command('start');
 return {service,storage,legacyStorage,api,errors,client,make,other};
}
test('closing a tab restores the same hero, private hand, cities, cash and turn without joining again',async t=>{
 const {client,make,service,storage,legacyStorage,api}=await game(t);
 const room=service.get(client.code);room.game=scenario('yaroslavl');room.revision++;
 await client.reconnect();assert.equal(await client.play({type:'HQ',position:5}),true);
 const expected=structuredClone(client.snapshot),code=client.code;client.stop();legacyStorage.records.clear();
 const restored=make({roomCode:code,legacyStorage:memory()});await restored.resume();
 assert.equal(restored.snapshot.you,expected.you);assert.deepEqual(restored.snapshot.game.players,expected.game.players);
 assert.deepEqual(restored.snapshot.game.regions,expected.game.regions);assert.equal(restored.snapshot.game.phase,expected.game.phase);
 assert.equal(service.get(code).members.length,2);assert.equal(api.requests.filter(r=>r.url.endsWith('/join')).length,0);
 assert(storage.getItem(key+'.'+code));assert.deepEqual(restored.snapshot.game.players[1].hand,[null,null]);
});
test('old session-only keys migrate on return and survive a new browser tab',async t=>{
 const service=new RoomService(),seat=service.create('Старое место'),storage=memory(),legacyStorage=memory(),api=bridge(service);
 legacyStorage.setItem(key,JSON.stringify({code:seat.code,token:seat.token}));
 const client=createRoomClient({storage,legacyStorage,fetcher:api.fetcher});t.after(()=>client.stop());await client.resume();
 assert(storage.getItem(key+'.'+seat.code));client.stop();legacyStorage.records.clear();
 const restored=createRoomClient({storage,fetcher:api.fetcher});t.after(()=>restored.stop());await restored.resume();assert.equal(restored.snapshot.you,seat.you);
});
test('starting offline retains the seat and reconnects automatically on the retry timer',async t=>{
 const {client,make,api,storage}=await game(t);const code=client.code;client.stop();api.offline=true;
 let updated;const update=new Promise(r=>updated=r),restored=make({onUpdate:updated});await restored.resume();
 assert.equal(restored.active,true);assert.equal(restored.connected,false);assert(storage.getItem(key+'.'+code));
 api.offline=false;await Promise.race([update,new Promise((_,reject)=>{const timer=setTimeout(()=>reject(new Error('No automatic reconnection')),2500);t.after(()=>clearTimeout(timer));})]);
 assert.equal(restored.connected,true);assert.equal(restored.snapshot.code,code);
});
test('a purchase with both responses lost resumes once after closing the tab',async t=>{
 const {client,make,service,api,storage}=await game(t);const room=service.get(client.code);room.game=scenario('yaroslavl');room.revision++;
 await client.reconnect();const before=room.game.players[0].cash;api.drop=2;
 assert.equal(await client.play({type:'HQ',position:5}),false);assert.equal(client.pending,true);
 const request=JSON.parse(storage.getItem(key)).command.request;client.stop();const restored=make();await restored.resume();
 assert.equal(restored.pending,false);assert.equal(restored.snapshot.game.players[0].cash,before-250);
 assert.equal(restored.snapshot.game.regions[5].level,'headquarters');assert.equal(JSON.parse(storage.getItem(key)).command,undefined);
 assert.equal(api.requests.filter(r=>r.body?.request===request).length,3);
});
test('a lost dice response preserves the original roll and position after reconnect',async t=>{
 const {client,make,api,service}=await game(t);api.drop=2;await client.play({type:'ROLL'});
 const expected=structuredClone(service.get(client.code).game);client.stop();const restored=make();await restored.resume();
 assert.deepEqual(restored.snapshot.game.lastDice,[2,2]);assert.equal(restored.snapshot.game.players[0].position,expected.players[0].position);
 assert.equal(restored.snapshot.game.phase,expected.phase);
});
test('an unsent command is recovered only at its original revision',async t=>{
 const {client,make,api,service,errors}=await game(t);api.offline=true;await client.play({type:'ROLL'});
 // Another tab of the same player already acted; never apply a stale request.
 const room=service.get(client.code);room.game.players[0].cash=1800;room.revision++;
 client.stop();api.offline=false;const restored=make();await restored.resume();
 assert.equal(restored.pending,false);assert.equal(restored.snapshot.game.players[0].cash,1800);assert.equal(restored.snapshot.game.phase,'ready');assert(errors.some(e=>e.includes('обновилась')));
});
test('re-entering a saved room code restores the original seat instead of adding a participant',async t=>{
 const {client,make,service}=await game(t);const code=client.code;client.stop();
 const invitedElsewhere=make({roomCode:'ZZZ999'});assert.equal(invitedElsewhere.active,false);
 await invitedElsewhere.join(code,'Другое имя');assert.equal(invitedElsewhere.snapshot.you,0);assert.equal(service.get(code).members.length,2);
});
test('expired rooms are cleared once without deleting credentials for other rooms',async t=>{
 const {client,make,service,storage}=await game(t);const code=client.code;client.stop();
 storage.setItem(key+'.ABC234',JSON.stringify({code:'ABC234',token:'b'.repeat(48)}));service.rooms.delete(code);
 let expired=0;const restored=make({onExpired:()=>expired++});await restored.resume();await restored.reconnect();
 assert.equal(expired,1);assert.equal(restored.active,false);assert.equal(storage.getItem(key+'.'+code),null);assert(storage.getItem(key+'.ABC234'));
});
test('a revoked seat does not endlessly retry or silently join as another player',async t=>{
 const {client,make,storage}=await game(t);const code=client.code;client.stop();
 storage.setItem(key+'.'+code,JSON.stringify({code,token:'a'.repeat(48)}));let expired=0;
 const restored=make({roomCode:code,onExpired:()=>expired++});await restored.resume();assert.equal(expired,1);assert.equal(restored.active,false);
});
test('late responses after leaving the screen cannot reopen the game',async t=>{
 const {client,make,api}=await game(t);client.stop();let release,updates=0;
 const restored=make({fetcher:async(...args)=>{const response=await api.fetcher(...args);await new Promise(r=>release=r);return response;},onUpdate:()=>updates++});
 const attempt=restored.resume();await new Promise(r=>setImmediate(r));restored.stop();release();await attempt;assert.equal(updates,0);assert.equal(restored.snapshot,null);
});
test('storage denial warns explicitly and keeps the session fallback usable',async t=>{
 const api=bridge(new RoomService()),legacyStorage=memory(),errors=[],blocked={getItem(){throw new Error('denied');},setItem(){throw new Error('denied');},removeItem(){}};
 const client=createRoomClient({storage:blocked,legacyStorage,fetcher:api.fetcher,onError:e=>errors.push(e)});t.after(()=>client.stop());await client.create('A');
 assert(client.active);assert(legacyStorage.getItem(key));assert(errors.some(e=>e.includes('Не закрывайте вкладку')));
});
test('recovery screen offers reconnection, not a fresh seat, and includes no private credential',()=>{
 const html=roomScreen(null,{code:'ABC234',recovering:true,connected:false});
 assert(html.includes('roomReconnect'));assert(html.includes('ABC234'));assert(!html.includes('roomJoin'));assert(!html.includes('roomCreate'));assert(html.includes('Герой, карты и прогресс'));
});
test('losing the first join response and closing the tab recovers the existing seat',async t=>{
 const service=new RoomService(),host=service.create('Хозяин'),storage=memory(),api=bridge(service);
 const first=createRoomClient({storage,roomCode:host.code,fetcher:api.fetcher});t.after(()=>first.stop());
 api.dropEntry=true;await first.join(host.code,'Друг');first.stop();
 assert.equal(first.snapshot,null);
 assert.equal(service.get(host.code).members.length,2);
 const reopened=createRoomClient({storage,roomCode:host.code,fetcher:api.fetcher});t.after(()=>reopened.stop());
 assert(reopened.active);await reopened.resume();
 assert.equal(reopened.snapshot.you,1);
 assert.equal(reopened.snapshot.members.length,2);
 assert.equal(storage.getItem(key+'.entry.'+host.code),null);
});
test('losing the first create response recovers the same room after a fresh tab',async t=>{
 const service=new RoomService(),storage=memory(),api=bridge(service);
 const first=createRoomClient({storage,roomCode:'ZZZ999',fetcher:api.fetcher});t.after(()=>first.stop());
 api.dropEntry=true;await first.create('Хозяин');first.stop();
 const [original]=service.rooms.keys();
 const reopened=createRoomClient({storage,roomCode:'ZZZ999',fetcher:api.fetcher});t.after(()=>reopened.stop());await reopened.resume();
 assert.equal(reopened.code,original);
 assert.equal(service.rooms.size,1);
 assert.equal(storage.getItem(key+'.entry'),null);
});
test('a lost departure confirmation still returns to the menu and releases the seat',async t=>{
 const service=new RoomService(),storage=memory(),api=bridge(service);let left=0;
 const client=createRoomClient({storage,fetcher:api.fetcher,onLeft:()=>left++});t.after(()=>client.stop());
 await client.create('Хозяин');const code=client.code;api.drop=1;
 assert.equal(await client.leave(),true);assert.equal(left,1);
 assert.equal(client.active,false);assert.equal(storage.getItem(key+'.'+code),null);
});
test('an action rejected by the rules clears the queue and keeps the valid turn playable',async t=>{
 const {client,errors}=await game(t);
 assert.equal(await client.play({type:'BUY'}),false);
 assert.equal(client.pending,false);
 assert.equal(client.connected,true);
 assert(errors.length);
 assert.equal(await client.play({type:'ROLL'}),true);
});
