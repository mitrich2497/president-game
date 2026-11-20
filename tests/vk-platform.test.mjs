import test from 'node:test';
import assert from 'node:assert/strict';
import {createVkPlatform,isVkLaunch,readRoomInvitation,updateRoomAddress,vkRoomInvite} from '../web/vk-platform.js';
import {createRoomClient,createRoomStorage} from '../web/multiplayer-client.js';
import {RoomCore} from '../multiplayer-core.mjs';
import worker from '../worker/index.js';

const launch=new URL('https://game.example/vk.html?vk_app_id=54891960&vk_user_id=123&sign=example#room=abc234');

test('VK invites open the right room and carry only the public room code',()=>{
 assert(isVkLaunch(launch));
 assert.equal(readRoomInvitation(launch),'ABC234');
 assert.equal(vkRoomInvite('abc234'),'https://vk.ru/app54891960#/room/ABC234');
 assert.equal(vkRoomInvite('ABC234&token=x'),null);
 const switched=updateRoomAddress(launch,'XYZ789');
 assert.equal(switched.hash,'#/room/XYZ789');
 assert.equal(switched.searchParams.get('sign'),'example');
 assert.equal(readRoomInvitation(switched),'XYZ789');
 assert.equal(readRoomInvitation(updateRoomAddress(switched,null)),'');
 const standalone=new URL('https://game.example/?room=XYZ789#room=ABC234');
 assert(!isVkLaunch(standalone));
 assert.equal(readRoomInvitation(standalone),'XYZ789');
 assert(!isVkLaunch(new URL('https://game.example/vk.html?vk_app_id=999')));
});

test('VK launch accepts routed, escaped and legacy invitations before Bridge is ready',()=>{
 for(const url of [
  'https://game.example/vk.html?vk_app_id=54891960#/room/abc234',
  'https://game.example/vk.html?vk_app_id=54891960#%2Froom%2Fabc234',
  'https://game.example/vk.html?vk_app_id=54891960#/room/abc234/?source=message',
  'https://game.example/vk.html?vk_app_id=54891960#/?room=abc234&source=message',
  'https://game.example/vk.html#room%3Dabc234',
  'https://game.example/?vk_app_id=54891960#room=abc234',
 ])assert.equal(readRoomInvitation(new URL(url)),'ABC234',url);
 const recovered=updateRoomAddress(new URL('https://game.example/vk.html#room=abc234'),'abc234');
 recovered.hash='';
 assert.equal(readRoomInvitation(recovered),'ABC234');
 for(const hash of ['#/room/ABC234/extra','#room=ABC234&room=DEF567','#room=%XX','#/room/ABC230']){
  assert.equal(readRoomInvitation(new URL('https://game.example/vk.html'+hash)),'');
 }
});

test('GitHub Pages uses its configured base path for VK invitations and room addresses',()=>{
 const options={basePath:'/president-game/'};
 for(const path of ['/president-game/vk.html','/president-game/']){
  const entry=new URL('https://example.github.io'+path+'?vk_app_id=54891960&vk_user_id=123&sign=example');
  assert(isVkLaunch(entry,options));
  for(const fragment of ['/room/abc234','%2Froom%2Fabc234','room%3Dabc234','/?room=abc234&source=message']){
   const launch=new URL(entry);launch.hash=fragment;
   assert.equal(readRoomInvitation(launch,options),'ABC234');
  }
  const switched=updateRoomAddress(entry,'xyz789',options);
  assert.equal(switched.pathname,path);
  assert.equal(switched.hash,'#/room/XYZ789');
  assert.equal(switched.searchParams.get('room'),'XYZ789');
  assert.equal(switched.searchParams.get('sign'),'example');
  assert.equal(switched.searchParams.get('vk_user_id'),'123');
  assert.equal(readRoomInvitation(switched,options),'XYZ789');
  switched.hash='';
  assert.equal(readRoomInvitation(switched,options),'XYZ789');
  const cleared=updateRoomAddress(switched,null,options);
  assert.equal(cleared.hash,'');
  assert.equal(readRoomInvitation(cleared,options),'');
  entry.searchParams.set('vk_app_id','999');
  assert.equal(isVkLaunch(entry,options),false);
 }
 assert(isVkLaunch(new URL('https://example.github.io/president-game/vk.html'),options));
 assert(!isVkLaunch(new URL('https://example.github.io/president-game/'),options));
 assert(!isVkLaunch(new URL('https://example.github.io/vk.html?vk_app_id=54891960'),options));
 assert(!isVkLaunch(new URL('https://example.github.io/other/vk.html?vk_app_id=54891960'),options));
 assert(!isVkLaunch(new URL('https://example.github.io/president-game/vk.html?vk_app_id=54891960')));
 assert(isVkLaunch(new URL('https://example.github.io/president-game/vk.html'),{basePath:'president-game'}));
});

test('the embedded Pages entry initializes Bridge and handles incoming and outgoing rooms',async()=>{
 const calls=[],events=[];let callback;
 const basePath='/president-game/';
 const url=new URL('https://example.github.io/president-game/vk.html?vk_app_id=54891960#%2Froom%2FABC234');
 const platform=createVkPlatform({url,basePath,loadBridge:async()=>({
  isEmbedded:()=>true,
  subscribe:listener=>{callback=listener;},
  send:async(method,params)=>{calls.push({method,params});return {result:true};}
 }),onRoomInvitation:code=>events.push(code),onRestore:()=>events.push('restore')});
 assert(platform.enabled);
 await platform.ready;
 assert.equal(calls[0].method,'VKWebAppInit');
 callback({detail:{type:'VKWebAppChangeFragment',data:{location:'/room/ABC234'}}});
 callback({detail:{type:'VKWebAppChangeFragment',data:{location:'%2Froom%2FDEF567'}}});
 callback({detail:{type:'VKWebAppLocationChanged',data:{location:'room=XYZ789'}}});
 callback({detail:{type:'VKWebAppViewRestore'}});
 assert.deepEqual(events,['DEF567','XYZ789','restore']);
 platform.setRoom('DEF567');
 assert.deepEqual(calls[1],{method:'VKWebAppSetLocation',params:{location:'/room/DEF567',replace_state:true}});
});

test('a configured Pages entry for a different app never initializes VK Bridge',async()=>{
 let loaded=false;
 const platform=createVkPlatform({
  url:new URL('https://example.github.io/president-game/vk.html?vk_app_id=999'),
  basePath:'/president-game/',
  loadBridge:async()=>{loaded=true;}
 });
 await platform.ready;
 assert.equal(platform.enabled,false);
 assert.equal(loaded,false);
});

test('embedded launch initializes VK, copies the room invite, and reacts to restoration and new links',async()=>{
 const events=[],calls=[];let callback;
 const platform=createVkPlatform({url:launch,loadBridge:async()=>({
  isEmbedded:()=>true,
  subscribe:listener=>{callback=listener;},
  send:async(method,params)=>{calls.push({method,params});return {result:true};}
 }),onRoomInvitation:code=>events.push(code),onRestore:()=>events.push('restore')});
 await platform.ready;
 assert.equal(calls[0].method,'VKWebAppInit');
 platform.setRoom('XYZ789');
 assert.deepEqual(calls[1],{method:'VKWebAppSetLocation',params:{location:'/room/XYZ789',replace_state:true}});
 assert(await platform.copyInvite(vkRoomInvite('XYZ789')));
 assert.deepEqual(calls[2],{method:'VKWebAppCopyText',params:{text:'https://vk.ru/app54891960#/room/XYZ789'}});
 callback({detail:{type:'VKWebAppChangeFragment',data:{location:'room=XYZ789'}}});
 callback({detail:{type:'VKWebAppChangeFragment',data:{location:'room=DEF567'}}});
 callback({detail:{type:'VKWebAppViewRestore'}});
 assert.deepEqual(events,['DEF567','restore']);
});

test('a VK fragment delivered during initialization reaches the app before automatic restoration',async()=>{
 const visits=[],calls=[];let notify,finishInit;
 const platform=createVkPlatform({url:new URL('https://game.example/vk.html'),
  loadBridge:async()=>({
   isEmbedded:()=>true,
   subscribe:listener=>{notify=listener;},
   send:(method,params)=>{
    calls.push({method,params});
    if(method==='VKWebAppInit')return new Promise(resolve=>{finishInit=resolve;});
   }
  }),onRoomInvitation:code=>visits.push(code)});
 await Promise.resolve();
 notify({detail:{type:'VKWebAppChangeFragment',data:{location:'%2Froom%2FDEF567'}}});
 assert.deepEqual(visits,['DEF567']);
 finishInit({result:true});await platform.ready;
 assert.deepEqual(calls.map(c=>c.method),['VKWebAppInit']);
});

test('a VK invitation opens its exact room and returns to the same seat on a bare reload',async t=>{
 const server=new RoomCore({die:()=>1}),host=server.create('Хозяин'),other=server.create('Другая партия');
 const records=new Map([['president.room.v1',JSON.stringify({code:other.code,token:other.token})]]);
 const storage={getItem:key=>records.get(key),setItem:(key,value)=>records.set(key,value),removeItem:key=>records.delete(key)};
 const fetcher=async(path,{body,headers})=>{
  const url=new URL(path,'https://game.example'),[, , ,code,operation]=url.pathname.split('/');
  const input=body&&JSON.parse(body),token=headers.Authorization?.slice(7);
  const data=operation==='join'?server.join(code,input.name,input.seat):server.poll(code,token);
  return {ok:true,json:async()=>data};
 };
 const open=url=>createRoomClient({storage,fetcher,roomCode:readRoomInvitation(new URL(url))});
 const invite=new URL(vkRoomInvite(host.code)),entry='https://game.example/vk.html?vk_app_id=54891960';
 const forwarded=entry+'#'+encodeURIComponent(invite.hash.slice(1));
 const guest=open(forwarded);
 t.after(()=>guest.stop());
 assert.equal(guest.active,false);
 await guest.join(readRoomInvitation(new URL(forwarded)),'Друг');
 const seat=guest.snapshot.you;
 assert.equal(guest.snapshot.code,host.code);
 assert.notEqual(seat,host.you);
 guest.stop();
 const command=(token,kind,extra={})=>server.command(host.code,token,{kind,...extra,request:crypto.randomUUID(),revision:server.get(host.code).revision});
 command(host.token,'ready',{ready:true});
 const guestToken=JSON.parse(records.get('president.room.v1')).token;
 command(guestToken,'ready',{ready:true});
 command(host.token,'start');
 command(host.token,'action',{action:{type:'ROLL'}});
 const restored=open(entry);t.after(()=>restored.stop());
 await restored.resume();
 assert.equal(restored.snapshot.code,host.code);
 assert.equal(restored.snapshot.you,seat);
 assert.equal(restored.snapshot.members.length,2);
 assert.deepEqual(restored.snapshot.game.lastDice,[1,1]);
 assert(restored.snapshot.game.players[seat].hand.every(Boolean));
});

test('a missing or rejected VK Bridge falls back to the usual invitation controls',async()=>{
 const platform=createVkPlatform({url:launch,loadBridge:async()=>{throw new Error('Bridge unavailable');}});
 await platform.ready;
 platform.setRoom('XYZ789');
 assert.equal(await platform.copyInvite(vkRoomInvite('XYZ789')),false);
});

test('two VK accounts in one browser restore their own seats in the same room',async t=>{
 const records=new Map(),raw={
  get length(){return records.size;},key:index=>[...records.keys()][index]??null,
  getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value),removeItem:key=>records.delete(key)
 };
 const server=new RoomCore(),host=server.create('Первый игрок'),legacy=createRoomStorage(()=>raw);
 legacy.setItem('president.room.v1',JSON.stringify({code:host.code,token:host.token}));
 const fetcher=async(path,{body,headers})=>{
  const url=new URL(path,'https://game.example'),token=headers.Authorization?.slice(7);
  const input=body&&JSON.parse(body);
  const data=url.pathname.endsWith('/join')?server.join(host.code,input.name,input.seat):server.poll(host.code,token);
  return {ok:true,json:async()=>data};
 };
 const open=(user,roomCode)=>createRoomClient({storage:createRoomStorage(()=>raw,user),fetcher,roomCode});
 const first=open('111'),second=open('222',host.code);
 t.after(()=>{first.stop();second.stop();});
 await first.resume();
 assert.equal(first.snapshot.you,host.you);
 assert.equal(second.active,false);
 await second.join(host.code,'Второй игрок');
 const seat=second.snapshot.you;
 assert.notEqual(seat,host.you);
 for(const [account,expected] of [['111',host.you],['222',seat]]){
  const reopened=open(account);t.after(()=>reopened.stop());await reopened.resume();
  assert.equal(reopened.snapshot.you,expected);
  assert.equal(reopened.snapshot.code,host.code);
 }
 first.reset();
 assert.equal(open('111',host.code).active,false);
 assert(legacy.getItem('president.room.v1'));
});

test('the dedicated game entry sends no launch parameters to assets and limits embedding to VK',async()=>{
 const response=await worker.fetch(new Request(launch),{ASSETS:{fetch:request=>{
  assert.equal(request.url,'https://game.example/');
  return new Response('<main>Президент</main>',{headers:{'Content-Type':'text/html'}});
 }}});
 assert.equal(response.status,200);
 assert.match(response.headers.get('Content-Security-Policy'),/frame-ancestors.*https:\/\/vk\.ru/);
 assert.equal(response.headers.get('Referrer-Policy'),'no-referrer');
 assert.match(await response.text(),/Президент/);
});
