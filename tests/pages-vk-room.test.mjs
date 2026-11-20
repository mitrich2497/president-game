import test from 'node:test';
import assert from 'node:assert/strict';
import {RoomCore} from '../multiplayer-core.mjs';
import {createRoomClient,createRoomStorage} from '../web/multiplayer-client.js';
import {readRoomInvitation,vkRoomInvite} from '../web/vk-platform.js';

test('the Pages VK entry joins the shared backend and restores both seats without an invite',async t=>{
 const backend='https://rooms.example/';
 const entry='https://mitrich2497.github.io/president-game/vk.html?vk_app_id=54891960';
 const basePath='/president-game/';
 const records=new Map();
 const browser={
  get length(){return records.size;},key:index=>[...records.keys()][index]??null,
  getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value),removeItem:key=>records.delete(key)
 };
 const core=new RoomCore({die:()=>1});
 const fetcher=async(address,options)=>{
  assert.equal(options.credentials,'omit');
  const url=new URL(address);
  assert.equal(url.origin,new URL(backend).origin);
  const [, , ,code,operation]=url.pathname.split('/');
  const body=options.body&&JSON.parse(options.body);
  const key=options.headers.Authorization?.slice('Bearer '.length);
  const data=operation==='join'?core.join(code,body.name,body.seat)
   :operation==='command'?core.command(code,key,body)
   :code?core.poll(code,key):core.create(body.name,body.seat);
  return {ok:true,json:async()=>data};
 };
 function open(user,fragment=''){
  const url=new URL(entry+'&vk_user_id='+user+fragment);
  const client=createRoomClient({
   storage:createRoomStorage(()=>browser,user),apiOrigin:backend,fetcher,
   roomCode:readRoomInvitation(url,{basePath})
  });
  t.after(()=>client.stop());
  return client;
 }
 const host=open('101');
 await host.create('Создатель');
 const invite=new URL(vkRoomInvite(host.snapshot.code));
 const fragment='#'+encodeURIComponent(invite.hash.slice(1));
 const guest=open('202',fragment);
 const code=readRoomInvitation(new URL(entry+fragment),{basePath});
 await guest.join(code,'Друг');
 assert.equal(guest.snapshot.code,host.snapshot.code);
 assert.notEqual(guest.snapshot.you,host.snapshot.you);
 await host.reconnect();
 assert(await host.command('ready',{ready:true}));
 await guest.reconnect();
 assert(await guest.command('ready',{ready:true}));
 await host.reconnect();
 assert(await host.command('start'));
 assert(await host.play({type:'ROLL'}));
 await guest.reconnect();
 const seats=[host.snapshot.you,guest.snapshot.you];
 assert.deepEqual(guest.snapshot.game.lastDice,[1,1]);
 host.stop();guest.stop();
 for(const [index,user] of ['101','202'].entries()){
  const restored=open(user);
  await restored.resume();
  assert.equal(restored.snapshot.code,code);
  assert.equal(restored.snapshot.you,seats[index]);
  assert.equal(restored.snapshot.members.length,2);
  assert.deepEqual(restored.snapshot.game.lastDice,[1,1]);
  assert(restored.snapshot.game.players[seats[index]].hand.every(Boolean));
 }
});
