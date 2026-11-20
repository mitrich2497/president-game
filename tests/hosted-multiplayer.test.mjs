import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import {roomApi} from '../worker/index.js';
import {RoomCore} from '../multiplayer-core.mjs';
import {actionPlayerId} from '../web/engine.js';

// Execute the actual migration and SQL against SQLite, matching D1's API.
function database(){
 const raw=new DatabaseSync(':memory:');raw.exec(fs.readFileSync(new URL('../drizzle/0000_rooms.sql',import.meta.url),'utf8'));
 const db={raw,withSession(){return this;},prepare(sql){let values=[];return {bind(...args){values=args;return this;},async first(){return raw.prepare(sql).get(...values)??null;},async all(){return {results:raw.prepare(sql).all(...values)};},async run(){const out=raw.prepare(sql).run(...values);return {success:true,meta:{changes:Number(out.changes)}};}};},async batch(statements){raw.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());raw.exec('COMMIT');return out;}catch(e){raw.exec('ROLLBACK');throw e;}}};return db;
}
let sequence=0;
function api(db,{time=1800000000000,die=()=>2}={}){let now=time;return {advance(ms){now+=ms;},async request(path,{body,token,origin,ip='1.2.3.4'}={}){const response=await roomApi(new Request('https://game.example'+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{}),...(origin?{Origin:origin}:{}),'cf-connecting-ip':ip},body:body?JSON.stringify(body):undefined}),{DB:db},{now,coreOptions:{die}});return {status:response.status,data:await response.json()};}};}
async function create(a,name='Хозяин'){const out=await a.request('/api/rooms',{body:{name}});assert.equal(out.status,200);return out.data;}
async function join(a,c,name='Друг'){const out=await a.request('/api/rooms/'+c.code+'/join',{body:{name}});assert.equal(out.status,200);return out.data;}
async function poll(a,c){return a.request('/api/rooms/'+c.code,{token:c.token});}
async function cmd(a,c,kind,extra={},revision,request){revision??=(await poll(a,c)).data.revision;return a.request('/api/rooms/'+c.code+'/command',{token:c.token,body:{kind,...extra,revision,request:request||'hosted-test-'+(++sequence)}});}

test('cloud rooms survive a new Worker instance and hide keys and cards',async()=>{
 const db=database(),a=api(db),host=await create(a),guest=await join(a,host);
 await cmd(a,host,'ready',{ready:true});await cmd(a,guest,'ready',{ready:true});assert.equal((await cmd(a,host,'start')).status,200);
 const b=api(db),view=(await poll(b,guest)).data;assert.equal(view.you,1);assert.deepEqual(view.game.players[0].hand,[null,null]);assert(!view.game.decks);assert(!JSON.stringify(view).includes(host.token));assert(!db.raw.prepare('SELECT data FROM rooms').get().data.includes(host.token));
 assert.equal((await poll(b,{...host,token:'a'.repeat(48)})).status,401);
 db.raw.close();
});
test('simultaneous room joins preserve both participants',async()=>{
 const db=database(),a=api(db),host=await create(a);
 const results=await Promise.all(['Один','Два','Три','Четыре','Пять'].map(name=>a.request('/api/rooms/'+host.code+'/join',{body:{name}})));
 // Conflicting fifth writer may need another attempt after four compare-and-swaps.
 for(let i=0;i<results.length;i++)if(results[i].status===409)results[i]=await a.request('/api/rooms/'+host.code+'/join',{body:{name:['Один','Два','Три','Четыре','Пять'][i]}});
 assert(results.every(x=>x.status===200));const view=(await poll(a,host)).data;assert.equal(view.members.length,6);assert.equal(new Set(view.members.map(m=>m.persona)).size,6);db.raw.close();
});
test('concurrent commands and retries cannot charge or roll twice',async()=>{
 const db=database(),a=api(db),h=await create(a),g=await join(a,h);
 await cmd(a,h,'ready',{ready:true});await cmd(a,g,'ready',{ready:true});const start=await cmd(a,h,'start');
 const revision=start.data.revision,request='same-roll-request';const results=await Promise.all([cmd(a,h,'action',{action:{type:'ROLL',dice:[6,6]}},revision,request),cmd(a,h,'action',{action:{type:'ROLL'}},revision,request)]);
 assert(results.every(x=>x.status===200));const view=(await poll(a,h)).data;assert.equal(view.revision,revision+1);assert.deepEqual(view.game.lastDice,[2,2]);assert.equal(view.game.players[0].position,4);
 assert.equal((await cmd(a,g,'action',{action:{type:'END_TURN'}})).status,403);db.raw.close();
});
test('stale distinct commands are rejected without overwriting a committed choice',async()=>{
 const db=database(),a=api(db),h=await create(a),revision=h.revision;
 const r=await Promise.all([cmd(a,h,'hero',{persona:'lenin'},revision),cmd(a,h,'hero',{persona:'stalin'},revision)]);assert.deepEqual(r.map(x=>x.status).sort(),[200,409]);assert.equal((await poll(a,h)).data.revision,revision+1);db.raw.close();
});
test('presence changes do not erase game state and expired rooms stop accepting keys',async()=>{
 const db=database(),a=api(db),h=await create(a),g=await join(a,h);a.advance(15000);const v=await poll(a,h);assert(v.data.members[0].connected);assert(!v.data.members[1].connected);await poll(a,g);assert((await poll(a,h)).data.members.every(m=>m.connected));
 a.advance(8*86400000);assert.equal((await poll(a,h)).status,404);await create(a);assert.equal(db.raw.prepare('SELECT COUNT(*) AS n FROM rooms').get().n,1);assert.equal(db.raw.prepare('SELECT COUNT(*) AS n FROM room_presence WHERE code=?').get(h.code).n,0);db.raw.close();
});
test('public endpoints reject foreign origins, oversized bodies and creation abuse',async()=>{
 const db=database(),a=api(db);assert.equal((await a.request('/api/rooms',{body:{},origin:'https://other.example'})).status,403);assert.equal((await a.request('/api/rooms',{body:{name:'x'.repeat(9000)}})).status,413);
 for(let i=0;i<20;i++)await create(a);assert.equal((await a.request('/api/rooms',{body:{name:'Excess'}})).status,429);assert.equal((await a.request('/api/info')).data.hosted,true);db.raw.close();
});
test('a departure transfers ownership and no old key can read the room',async()=>{
 const db=database(),a=api(db),h=await create(a),g=await join(a,h);assert.equal((await cmd(a,h,'leave')).data.left,true);assert.equal((await poll(a,h)).status,401);assert.equal((await poll(a,g)).data.host,g.you);db.raw.close();
});
test('hosted and local reducers use exactly the same rules and hero roster',async()=>{
 const db=database(),a=api(db),h=await create(a),g=await join(a,h);await cmd(a,h,'hero',{persona:'anna'});await cmd(a,g,'hero',{persona:'witte'});await cmd(a,h,'ready',{ready:true});await cmd(a,g,'ready',{ready:true});await cmd(a,h,'start');
 const room=JSON.parse(db.raw.prepare('SELECT data FROM rooms').get().data),local=new RoomCore({die:()=>2});local.rooms.set(room.code,room);const action={type:'ROLL'};
 const expected=local.command(h.code,h.token,{kind:'action',action,revision:room.revision,request:'local-equivalence'});
 const actual=await cmd(a,h,'action',{action});delete expected.game.network;delete actual.data.game.network;assert.deepEqual(actual.data.game,expected.game);db.raw.close();
});
test('retries of create and invite join keep the same room and seat, including after start',async t=>{
 const db=database();t.after(()=>db.raw.close());const a=api(db),owner='a'.repeat(48),guest='b'.repeat(48);
 const first=await a.request('/api/rooms',{body:{name:'Хозяин',seat:owner}});
 const second=await a.request('/api/rooms',{body:{name:'Хозяин',seat:owner}});
 assert.equal(first.status,200);assert.equal(second.status,200);assert.equal(first.data.code,second.data.code);
 const path='/api/rooms/'+first.data.code+'/join';
 const pair=await Promise.all([a.request(path,{body:{name:'Друг',seat:guest}}),a.request(path,{body:{name:'Друг',seat:guest}})]);
 assert(pair.every(result=>result.status===200&&result.data.you===1&&result.data.members.length===2));
 await cmd(a,first.data,'ready',{ready:true});await cmd(a,pair[0].data,'ready',{ready:true});await cmd(a,first.data,'start');
 const restored=await a.request(path,{body:{name:'Друг',seat:guest}});
 assert.equal(restored.status,200);assert.equal(restored.data.you,1);assert(restored.data.started);
 assert.equal(db.raw.prepare('SELECT COUNT(*) AS n FROM rooms').get().n,1);
 assert.equal((await a.request(path,{body:{name:'Опоздавший',seat:'c'.repeat(48)}})).status,409);
});
test('all six independent ready clicks commit against a common roster revision',async t=>{
 const db=database();t.after(()=>db.raw.close());const a=api(db),host=await create(a),seats=[host];
 for(let i=1;i<6;i++)seats.push(await join(a,host,'Игрок '+i));
 const {revision,rosterRevision}=(await poll(a,host)).data;
 const results=await Promise.all(seats.map(c=>cmd(a,c,'ready',{ready:true,rosterRevision},revision)));
 assert(results.every(r=>r.status===200));assert((await poll(a,host)).data.members.every(m=>m.ready));
 assert.equal((await cmd(a,host,'ready',{ready:false,rosterRevision},revision)).status,409);
 assert.equal((await cmd(a,host,'start')).status,200);
});
test('a stale ready click cannot confirm a changed hero roster',async t=>{
 const db=database();t.after(()=>db.raw.close());const a=api(db),h=await create(a),g=await join(a,h);
 const {revision,rosterRevision}=(await poll(a,h)).data;
 assert.equal((await cmd(a,g,'hero',{persona:'lenin'})).status,200);
 assert.equal((await cmd(a,h,'ready',{ready:true,rosterRevision},revision)).status,409);
});
test('a room left by its final member cannot be rejoined without a host',async t=>{
 const db=database();t.after(()=>db.raw.close());const a=api(db),h=await create(a);
 assert.equal((await cmd(a,h,'leave')).status,200);
 assert.equal((await a.request('/api/rooms/'+h.code+'/join',{body:{name:'Друг'}})).status,404);
 assert.equal(db.raw.prepare('SELECT COUNT(*) AS n FROM rooms').get().n,0);
 assert.equal(db.raw.prepare('SELECT COUNT(*) AS n FROM room_presence').get().n,0);
});
test('a final departure cannot delete a concurrently joined guest',async t=>{
 const db=database();t.after(()=>db.raw.close());const a=api(db),host=await create(a);
 const batch=db.batch.bind(db);let guest;
 db.batch=async statements=>{db.batch=batch;guest=await join(a,host);return batch(statements);};
 assert.equal((await cmd(a,host,'leave')).status,409);
 const room=(await poll(a,guest)).data;
 assert.equal(room.members.length,2);
 assert.equal(room.host,host.you);
});
test('cloud capacity excludes abandoned lobbies retained by older versions',async t=>{
 const db=database();t.after(()=>db.raw.close());const a=api(db),active=await create(a);
 const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',expires=1800000000000+86400000;
 const prefix=active.code.startsWith('ZXZ')?'VQY':'ZXZ';
 const insert=db.raw.prepare('INSERT INTO rooms (code,revision,data,expires) VALUES (?,1,?,?)');
 for(let i=0;i<1999;i++){
  const code=prefix+alphabet[i>>10]+alphabet[(i>>5)&31]+alphabet[i&31];
  insert.run(code,'{"members":[]}',expires);
 }
 db.raw.prepare('INSERT INTO room_presence (code,member_key,seen) VALUES (?,?,?)').run(prefix+'AAA','old-key',1800000000000);
 const next=await create(a,'Новый хозяин');
 assert.notEqual(next.code,active.code);
 assert.equal((await poll(a,active)).status,200);
 assert.equal(db.raw.prepare('SELECT COUNT(*) AS n FROM rooms').get().n,2);
 assert.equal(db.raw.prepare('SELECT COUNT(*) AS n FROM room_presence WHERE code=?').get(prefix+'AAA').n,0);
});
test('a start retry survives renumbering after a host leaves the lobby',async t=>{
 const db=database();t.after(()=>db.raw.close());const a=api(db),original=await create(a),h=await join(a,original),g=await join(a,h,'Ещё друг');
 await cmd(a,original,'leave');await cmd(a,h,'ready',{ready:true});await cmd(a,g,'ready',{ready:true});
 const revision=(await poll(a,h)).data.revision;
 const initial=await cmd(a,h,'start',{},revision,'retry-start-renumber');
 const retry=await cmd(a,h,'start',{},revision,'retry-start-renumber');
 assert.equal(initial.status,200);assert.equal(retry.status,200);assert.equal(retry.data.you,0);
 assert.deepEqual(retry.data.game.players,initial.data.game.players);
});
test('six players resume a saved court queue, then continue the same turn and purchase',async t=>{
 const db=database();t.after(()=>db.raw.close());
 const dice=[6,6,1,2],a=api(db,{die:()=>dice.shift()}),h=await create(a),seats=[h];
 for(let i=1;i<6;i++)seats.push(await join(a,h,'Игрок '+i));
 for(const c of seats)await cmd(a,c,'ready',{ready:true});
 const started=await cmd(a,h,'start');
 assert.equal(started.status,200);
 assert.equal((await cmd(a,h,'action',{action:{type:'BUY'}})).status,422);
 const court=await cmd(a,h,'action',{action:{type:'ROLL'}});
 assert.equal(court.status,200);assert.equal(court.data.game.decision.kind,'courtAccusation');
 const restarted=api(db,{time:1800000015000,die:()=>dice.shift()});
 for(let i=1;i<6;i++){
  const view=(await poll(restarted,seats[i])).data;
  assert.equal(actionPlayerId(view.game),i);
  assert.equal((await cmd(restarted,h,'action',{action:{type:'END_TURN'}})).status,403);
  assert.equal((await cmd(restarted,seats[i],'action',{action:{type:'COURT_RESPONSE',accept:false}})).status,200);
 }
 assert.equal((await cmd(restarted,h,'action',{action:{type:'END_TURN'}})).status,200);
 assert.equal((await cmd(restarted,h,'action',{action:{type:'ROLL'}})).status,200);
 const buy=await cmd(restarted,h,'action',{action:{type:'BUY'}});
 assert.equal(buy.status,200);assert.equal(buy.data.game.regions[15].owner,0);
 const turn=await cmd(restarted,h,'action',{action:{type:'END_TURN'}});
 assert.equal(turn.status,200);assert.equal(turn.data.game.current,1);
 const views=await Promise.all(seats.map(c=>poll(restarted,c)));
 for(const [i,{data}] of views.entries()){
  assert.equal(data.you,i);assert.equal(data.revision,turn.data.revision);
  assert.equal(data.game.current,1);assert.deepEqual(data.game.regions,turn.data.game.regions);
  assert.deepEqual(data.game.players.map(p=>p.cash),turn.data.game.players.map(p=>p.cash));
  assert(data.game.players[i].hand.every(Boolean));
  assert(data.game.players.filter(p=>p.id!==i).every(p=>p.hand.every(card=>card===null)));
 }
});
