import {createHash} from 'node:crypto';
import {RoomCore,entryToken} from '../multiplayer-core.mjs';
import {VK_ENTRY_PATH,VK_FRAME_POLICY} from '../web/vk-platform.js';
import {soundtrackAsset,soundtrackResponse} from '../soundtrack.mjs';

const TTL=7*86400000;
const MAX_ROOMS=2000;
const PAGES_ORIGIN='https://mitrich2497.github.io';
const CORS_HEADERS=new Set(['authorization','content-type']);
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'}});

async function bodyOf(request){
 if(!request.headers.get('content-type')?.startsWith('application/json'))fail('Ожидаются данные игры.',415);
 if(Number(request.headers.get('content-length'))>8192)fail('Слишком большой запрос.',413);
 const reader=request.body?.getReader();if(!reader)fail('Пустой запрос.');
 const chunks=[];let length=0;
 while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>8192){await reader.cancel();fail('Слишком большой запрос.',413);}chunks.push(value);}
 const bytes=new Uint8Array(length);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
 let result;try{result=JSON.parse(new TextDecoder().decode(bytes));}catch{fail('Не удалось прочитать запрос.');}
 if(!result||typeof result!=='object'||Array.isArray(result))fail('Неверный запрос.');return result;
}

async function rateLimit(db,request,now){
 // Store a one-way address hash for the current minute, never a visitor's IP.
 const key=createHash('sha256').update((request.headers.get('cf-connecting-ip')||'anonymous')+':'+Math.floor(now/60000)).digest('hex');
 const row=await db.prepare('INSERT INTO room_limits (id, count, expires) VALUES (?, 1, ?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(key,now+120000).first();
 if(row.count>20)fail('Слишком много подключений. Попробуйте через минуту.',429);
}

async function readRoom(db,code,now){
 const row=await db.prepare('SELECT data, revision FROM rooms WHERE code=? AND expires>?').bind(code,now).first();
 if(!row)fail('Комната не найдена или срок её хранения истёк.',404);
 const room=JSON.parse(row.data);
 const seen=await db.prepare('SELECT member_key, seen FROM room_presence WHERE code=?').bind(code).all();
 const times=new Map(seen.results.map(x=>[x.member_key,x.seen]));room.members.forEach(m=>m.seen=Math.max(m.seen||0,times.get(m.key)||0));
 return room;
}
async function heartbeat(db,code,member,now){
 // A separate row prevents presence updates from overwriting a concurrent move.
 if(now-member.seen<4000)return;
 await db.prepare('INSERT INTO room_presence (code, member_key, seen) SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM rooms WHERE code=?) ON CONFLICT(code, member_key) DO UPDATE SET seen=MAX(seen, excluded.seen)').bind(code,member.key,now,code).run();
}
async function cleanExpired(db,now){
 await db.batch([
  db.prepare('DELETE FROM room_presence WHERE code IN (SELECT code FROM rooms WHERE expires<=?)').bind(now),
  db.prepare('DELETE FROM rooms WHERE expires<=?').bind(now),
  db.prepare('DELETE FROM room_limits WHERE expires<=?').bind(now)
 ]);
}
async function cleanAbandoned(db){
 // Older builds kept an empty lobby until its seven-day expiration.
 const empty="SELECT code FROM rooms WHERE json_type(data, '$.members')='array' AND json_array_length(data, '$.members')=0";
 const [,removed]=await db.batch([
  db.prepare('DELETE FROM room_presence WHERE code IN ('+empty+')'),
  db.prepare('DELETE FROM rooms WHERE code IN ('+empty+')')
 ]);
 return removed.meta.changes;
}

async function serveRoomApi(request,env,{now=Date.now(),coreOptions={}}={}){
 const url=new URL(request.url),path=url.pathname;
 try{
  if(request.method==='GET'&&path==='/api/info')return json({multiplayer:true,hosted:true,addresses:[],origin:url.origin});
  if(!env.DB)fail('Сервер комнат временно недоступен.',503);
  // Read from the primary so a guest joining from another region sees fresh moves.
  const db=env.DB.withSession?env.DB.withSession('first-primary'):env.DB;
  const match=/^\/api\/rooms\/([A-Z2-9]{6})(?:\/(join|command))?$/.exec(path);
  if(!['GET','POST'].includes(request.method))return json({error:'Метод не поддерживается.'},405);
  const body=request.method==='POST'?await bodyOf(request):{};
  const creating=request.method==='POST'&&path==='/api/rooms',joining=request.method==='POST'&&match?.[2]==='join';
  if(creating||joining)await rateLimit(db,request,now);
  if(creating){
   await cleanExpired(db,now);
   const token=entryToken(body.seat);
   let {count}=await db.prepare('SELECT COUNT(*) AS count FROM rooms').first();
   if(count>=MAX_ROOMS)count-=await cleanAbandoned(db);
   for(let attempt=0;attempt<4;attempt++){
    const service=new RoomCore({...coreOptions,now:()=>now}),snapshot=service.create(body.name,token,attempt),room=service.get(snapshot.code);
    const existing=await db.prepare('SELECT data FROM rooms WHERE code=? AND expires>?').bind(room.code,now).first();
    if(existing){
     const saved=await readRoom(db,room.code,now),member=saved.members.find(m=>m.key===room.members[0].key);
     if(member){await heartbeat(db,room.code,member,now);member.seen=now;return json({...service.snapshot(saved,member),token});}
     continue;
    }
    if(count>=MAX_ROOMS)fail('Сервер заполнен. Попробуйте позже.',503);
    const stored=await db.prepare('INSERT OR IGNORE INTO rooms (code, revision, data, expires) VALUES (?, ?, ?, ?)').bind(room.code,room.revision,JSON.stringify(room),now+TTL).run();
    if(stored.meta.changes){await heartbeat(db,room.code,{...room.members[0],seen:0},now);return json(snapshot);}
    // Another request may have just created this exact room.
    const saved=await readRoom(db,room.code,now),member=saved.members.find(m=>m.key===room.members[0].key);
    if(member){await heartbeat(db,room.code,member,now);member.seen=now;return json({...service.snapshot(saved,member),token});}
   }
   fail('Не удалось создать комнату. Попробуйте ещё раз.',503);
  }
  if(!match)fail('Команда комнаты не найдена.',404);
  const code=match[1],token=(request.headers.get('authorization')||'').replace(/^Bearer /,'');
  for(let attempt=0;attempt<8;attempt++){
   const room=await readRoom(db,code,now),service=new RoomCore({...coreOptions,now:()=>now});service.rooms.set(code,room);
   let snapshot,member;
   if(joining){
    const previousPresence=new Map(room.members.map(m=>[m.id,m.seen]));
    snapshot=service.join(code,body.name,body.seat);
    member=service.get(code).members.find(m=>m.id===snapshot.you);
    if(snapshot.revision===room.revision)await heartbeat(db,code,{...member,seen:previousPresence.get(member.id)},now);
   }
   else{
    // Authentication may update only this request's in-memory presence.
    const savedSeen=room.members.map(m=>m.seen);member=service.authenticate(room,token);
    await heartbeat(db,code,{...member,seen:savedSeen[room.members.indexOf(member)]},now);
    if(request.method==='GET'&&!match[2])return json(service.snapshot(room,member,Number(url.searchParams.get('after')??-1)));
    if(request.method!=='POST'||match[2]!=='command')fail('Команда комнаты не найдена.',404);
    snapshot=service.command(code,token,body);
   }
   if(snapshot.left&&room.members.length===1){
    // A simultaneous join takes precedence if it has already changed this revision.
    const [,removed]=await db.batch([
     db.prepare('DELETE FROM room_presence WHERE code=? AND EXISTS (SELECT 1 FROM rooms WHERE code=? AND revision=?)').bind(code,code,room.revision),
     db.prepare('DELETE FROM rooms WHERE code=? AND revision=?').bind(code,room.revision)
    ]);
    if(removed.meta.changes)return json(snapshot);
    continue;
   }
   const next=service.get(code);
   // A duplicate command is already committed. Return its current private view.
   if(next.revision===room.revision)return json(snapshot);
   const stored=await db.prepare('UPDATE rooms SET revision=?, data=?, expires=? WHERE code=? AND revision=?').bind(next.revision,JSON.stringify(next),now+TTL,code,room.revision).run();
   if(!stored.meta.changes)continue;
   if(joining)await heartbeat(db,code,{...member,seen:0},now);
   if(snapshot.left)await db.prepare('DELETE FROM room_presence WHERE code=? AND member_key=?').bind(code,member.key).run();
   return json(snapshot);
  }
  fail('Комната обновилась. Повторите действие.',409);
 }catch(error){
  if(!error.status)console.error('Room request failed:',error.message);
  return json({error:error.status?error.message:'Связь с хранилищем временно прервана. Повторите действие.'},error.status||503);
 }
}

export async function roomApi(request,env,options={}){
 const url=new URL(request.url),origin=request.headers.get('origin');
 let response;
 if(origin&&origin!==url.origin&&origin!==PAGES_ORIGIN){
  response=json({error:'Подключайтесь со страницы игры.'},403);
 }else if(request.method==='OPTIONS'){
  const method=request.headers.get('access-control-request-method');
  const fields=(request.headers.get('access-control-request-headers')||'').split(',').map(header=>header.trim().toLowerCase()).filter(Boolean);
  if(!origin||!['GET','POST'].includes(method)||fields.some(header=>!CORS_HEADERS.has(header))){
   response=json({error:'Этот запрос к серверу игры не разрешён.'},403);
  }else{
   response=new Response(null,{status:204,headers:{
    'Access-Control-Allow-Methods':'GET, POST',
    'Access-Control-Allow-Headers':'Authorization, Content-Type',
    'Access-Control-Max-Age':'600',
    'Cache-Control':'no-store',
    'Vary':'Access-Control-Request-Method, Access-Control-Request-Headers'
   }});
  }
 }else{
  response=await serveRoomApi(request,env,options);
 }
 const headers=new Headers(response.headers);
 headers.append('Vary','Origin');
 if(origin===PAGES_ORIGIN)headers.set('Access-Control-Allow-Origin',PAGES_ORIGIN);
 // Room authentication uses the bearer key. Cross-origin cookies are never enabled.
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/'))return roomApi(request,env);
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  const audio=soundtrackAsset(url.pathname);
  if(audio)return soundtrackResponse(request,env.ASSETS,audio);
  if(url.pathname===VK_ENTRY_PATH){
   const entry=new URL('/',url);
   const asset=await env.ASSETS.fetch(new Request(entry,{method:request.method}));
   const headers=new Headers(asset.headers);
   headers.append('Content-Security-Policy',VK_FRAME_POLICY);
   headers.set('Referrer-Policy','no-referrer');
   return new Response(asset.body,{status:asset.status,headers});
  }
  return env.ASSETS.fetch(request);
 }
};
