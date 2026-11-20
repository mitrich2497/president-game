import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {RoomService,multiplayerHandler} from '../multiplayer.mjs';
import {scenario,actionPlayerId,viewerId,canControl,PERSONAS} from '../web/engine.js';
import {botTurnAction} from '../web/ability-actions.js';
import {roomScreen} from '../web/multiplayer-ui.js';
import {createRoomClient} from '../web/multiplayer-client.js';
import {renderScreen} from '../web/view.js';
let serial=0;
test('a room invitation selects its own session and never resumes an unrelated room',()=>{
 const records=new Map([['president.room.v1',JSON.stringify({code:'ABC234',token:'a'.repeat(48)})],['president.room.v1.DEF567',JSON.stringify({code:'DEF567',token:'b'.repeat(48)})]]);
 const storage={getItem:k=>records.get(k),setItem:(k,v)=>records.set(k,v),removeItem:k=>records.delete(k)};
 const invited=createRoomClient({storage,roomCode:'ZZZ999'});assert.equal(invited.active,false);
 const own=createRoomClient({storage,roomCode:'DEF567'});assert.equal(own.active,true);own.reset();
 assert(records.has('president.room.v1'));assert(!records.has('president.room.v1.DEF567'));
});
function command(s,c,kind,extra={}){return s.command(c.code,c.token,{revision:s.get(c.code).revision,request:'test-request-'+(++serial),kind,...extra});}
function setup(count=2,options={}){const s=new RoomService(options),host=s.create('Хозяин'),clients=[host];for(let i=1;i<count;i++)clients.push(s.join(host.code,'Игрок '+i));for(const c of clients)command(s,c,'ready',{ready:true});command(s,host,'start');return {s,clients,code:host.code};}
function install(s,code,state){const room=s.get(code);room.game=state;room.members.forEach((m,i)=>{m.persona=state.players[i].persona;});room.revision++;room.event=null;}
function act(s,clients,action){return command(s,clients[actionPlayerId(s.get(clients[0].code).game)],'action',{action});}

test('rooms require ready players, unique heroes and the host to start',()=>{
 const s=new RoomService(),a=s.create('<Хозяин>'),b=s.join(a.code,'Друг');assert.equal(a.members[0].name,'Хозяин');
 assert.throws(()=>command(s,b,'start'),/создатель/);assert.throws(()=>command(s,a,'start'),/готовых/);assert.throws(()=>command(s,b,'hero',{persona:'catherine'}),/уже выбран/);
 for(let i=2;i<6;i++)s.join(a.code,'Друг');assert.throws(()=>s.join(a.code,'Седьмой'),/шесть/);
});
test('hero selection clears readiness and lobby departure transfers host',()=>{
 const s=new RoomService(),a=s.create('A'),b=s.join(a.code,'B');command(s,b,'ready',{ready:true});command(s,b,'hero',{persona:'lenin'});assert.equal(s.get(a.code).members[1].ready,false);
 command(s,a,'leave');assert.equal(s.get(a.code).host,b.you);command(s,b,'ready',{ready:true});const c=s.join(a.code,'C');assert(s.get(a.code).members.every(m=>!m.ready));
 command(s,b,'ready',{ready:true});command(s,c,'ready',{ready:true});const result=command(s,b,'start');assert.equal(result.you,0);assert.equal(result.host,0);assert.equal(result.game.players.length,2);
});
test('the last lobby departure frees capacity and removes its persisted room',t=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'president-empty-rooms-'));
 t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
 const service=new RoomService({directory});
 for(let i=0;i<=100;i++){
  const host=service.create('Хозяин');
  assert.deepEqual(command(service,host,'leave'),{left:true});
 }
 assert.deepEqual(fs.readdirSync(directory),[]);
 assert.equal(service.rooms.size,0);
 assert.equal(service.create('Новый хозяин').members.length,1);
});
test('projection hides other hands, future decks, bearer keys and the swapped card',()=>{
 const {s,clients,code}=setup();const game=scenario('lawyer-deck');install(s,code,game);
 const response=act(s,clients,{type:'LAW_SWAP',index:0}),other=s.poll(code,clients[1].token,-1);
 assert(response.game.players[0].hand.every(Boolean));assert.deepEqual(other.game.players[0].hand,[null,null]);assert(other.game.players[1].hand.every(Boolean));assert.equal(other.game.decks,undefined);
 assert.equal(other.game.decision.text,'Кандидат заменил одну закрытую карту «Юрист».');assert(!JSON.stringify(other).includes('"key"'));assert(!JSON.stringify(other).includes(clients[0].token));assert.equal(viewerId(other.game),1);assert.equal(canControl(other.game),false);assert.equal(canControl(response.game),true);
});
test('server authenticates actors, ignores client dice, rejects stale and forbidden actions',()=>{
 const {s,clients,code}=setup(2,{die:()=>2});assert.throws(()=>command(s,clients[1],'action',{action:{type:'ROLL'}}),/другой/);assert.throws(()=>s.poll(code,'a'.repeat(48)),/подключение/);assert.throws(()=>command(s,clients[0],'action',{action:{type:'NEW_GAME'}}),/Неизвестное/);
 const revision=s.get(code).revision,result=act(s,clients,{type:'ROLL',dice:[6,6],current:1});assert.deepEqual(result.game.lastDice,[2,2]);assert.throws(()=>s.command(code,clients[0].token,{kind:'action',action:{type:'END_TURN'},revision,request:'stale-request'}),/обновилась/);
});
test('retrying a purchase applies the payment once',()=>{
 const {s,clients,code}=setup(),game=scenario('yaroslavl');install(s,code,game);const req={kind:'action',action:{type:'HQ',position:5},revision:s.get(code).revision,request:'same-purchase'};
 const first=s.command(code,clients[0].token,req),again=s.command(code,clients[0].token,req);assert.equal(again.revision,first.revision);assert.equal(again.game.players[0].cash,game.players[0].cash-250);
});
test('court authorizes the out-of-turn accuser and reveals only the resolved card',()=>{
 const {s,clients,code}=setup(4),game=scenario('court-visit');install(s,code,game);assert.equal(actionPlayerId(game),1);assert.throws(()=>command(s,clients[0],'action',{action:{type:'COURT_RESPONSE',accept:false}}),/другой/);
 const response=act(s,clients,{type:'COURT_RESPONSE',accept:true,index:0});assert(response.event.court.card);assert.equal(response.event.court.defendant.hand,undefined);
 for(const c of clients){const data=s.poll(code,c.token,-1);for(const p of data.game.players)if(p.id!==data.you)assert.deepEqual(p.hand,[null,null]);assert.doesNotThrow(()=>renderScreen(data.game,12,1,false,null));}
});
test('Kerensky and Milyukov give the decision to the correct remote participant',()=>{
 for(const name of ['kerensky','milyukov']){const {s,clients,code}=setup(3);const game=scenario(name);install(s,code,game);
  if(name!=='kerensky')act(s,clients,{type:'SWAN_PASS',target:1});
  assert.notEqual(actionPlayerId(s.get(code).game),s.get(code).game.current);assert.throws(()=>command(s,clients[0],'action',{action:{type:name==='kerensky'?'KERENSKY_RESPONSE':'SWAN',accept:false}}),/другой/);assert.doesNotThrow(()=>act(s,clients,{type:name==='kerensky'?'KERENSKY_RESPONSE':'SWAN',accept:false}));
 }
});
test('network jail exits and airport randomness follow the shared rules',()=>{
 for(const type of ['JAIL_PAY','JAIL_TRY','JAIL_WAIT']){const {s,clients,code}=setup(2,{die:()=>3}),room=s.get(code);room.game.players[0].jail=3;room.game.players[0].position=12;room.game.phase='jailed';const out=act(s,clients,{type,dice:[1,2]});assert.equal(out.game.players[0].jail,type==='JAIL_WAIT'?2:0);assert.equal(out.game.players[0].cash,type==='JAIL_PAY'?1750:2000);}
 const {s,clients,code}=setup(2,{die:()=>4});s.get(code).game.phase='airport';s.get(code).game.players[0].airportPending=true;const out=act(s,clients,{type:'AIRPORT',value:1});assert.equal(out.event.action.value,4);assert.equal(out.game.players[0].position,42);
});
test('server restart restores rooms without storing bearer tokens as plaintext',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'president-rooms-'));try{let now=1000000000;const {s,clients,code}=setup(2,{directory,now:()=>now,die:()=>2});act(s,clients,{type:'ROLL'});assert(!fs.readFileSync(path.join(directory,code+'.json'),'utf8').includes(clients[0].token));const restored=new RoomService({directory,now:()=>now});assert.deepEqual(restored.poll(code,clients[0].token,-1).game.lastDice,[2,2]);assert.equal(restored.poll(code,clients[0].token,-1).members[1].connected,false);now+=8*86400000;assert.throws(()=>restored.poll(code,clients[0].token,-1),/истёк/);}finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('all 16 heroes play authenticated multiplayer turns using private projections',()=>{
 const heroes=Object.keys(PERSONAS);let actions=0;
 for(let start=0;start<16;start+=2){const {s,clients,code}=setup(6);s.get(code).game.players.forEach((p,i)=>p.persona=heroes[(start+i)%16]);for(let n=0;n<120&&s.get(code).game.phase!=='finished';n++){const action=botTurnAction(s.get(code).game);assert(action);const response=act(s,clients,action);actions++;assert.equal(response.game.players.filter(p=>p.hand.some(Boolean)).length,1);assert.doesNotThrow(()=>renderScreen(response.game,response.game.players[response.game.current].position,1,false,null));}}
 assert(actions>500);
});
test('lobby only shows the chosen faction and escapes participant names',()=>{
 const s=new RoomService(),a=s.create('A & B'),html=roomScreen(a,{faction:'empresses'});assert(html.includes('A &amp; B'));for(const id of ['catherine','catherine_i','anna','elizabeth'])assert(html.includes('data-persona="'+id+'"'));assert(!html.includes('data-persona="lenin"'));
});
test('HTTP rejects cross-origin commands and unauthenticated game reads',async()=>{
 const api=multiplayerHandler(new RoomService()),server=http.createServer((req,res)=>api(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{let r=await fetch(base+'/api/rooms',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://other.example'},body:'{}'});assert.equal(r.status,403);r=await fetch(base+'/api/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Хозяин'})});const data=await r.json();assert.equal(r.status,200);assert(data.token);r=await fetch(base+'/api/rooms/'+data.code);assert.equal(r.status,401);r=await fetch(base+'/api/rooms/'+data.code,{headers:{Authorization:'Bearer '+data.token}});assert.equal((await r.json()).you,0);}finally{await new Promise(r=>server.close(r));}
});
test('client retries a lost response idempotently and resumes its seat after refresh',async()=>{
 const s=new RoomService(),records=new Map(),storage={getItem:k=>records.get(k),setItem:(k,v)=>records.set(k,v),removeItem:k=>records.delete(k)};let latest,lose=false;const requests=[];
 const fetcher=async(url,opts)=>{const body=opts.body&&JSON.parse(opts.body),token=opts.headers.Authorization?.slice(7),code=url.split('/')[3]?.split('?')[0];let data;try{if(url==='/api/rooms')data=s.create(body.name);else if(url.endsWith('/command')){requests.push(body.request);data=s.command(code,token,body);if(lose){lose=false;throw new TypeError('lost');}}else data=s.poll(code,token,Number(new URL(url,'http://test').searchParams.get('after')??-1));}catch(e){if(!e.status)throw e;return {ok:false,status:e.status,json:async()=>({error:e.message})};}return {ok:true,json:async()=>data};};
 const c=createRoomClient({storage,fetcher,onUpdate:data=>{latest=data;}});await c.create('A');lose=true;await c.command('ready',{ready:true});assert.equal(requests[0],requests[1]);assert(latest.members[0].ready);c.stop();const restored=createRoomClient({storage,fetcher,onUpdate:data=>{latest=data;}});await restored.resume();assert(restored.active);assert.equal(latest.you,0);assert(latest.members[0].ready);restored.stop();
});
