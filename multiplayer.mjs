import fs from 'node:fs';
import path from 'node:path';
import {RoomCore} from './multiplayer-core.mjs';
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
export class RoomService extends RoomCore {
 constructor({directory=null,...options}={}){
  super(options);this.directory=directory;
  if(directory){fs.mkdirSync(directory,{recursive:true,mode:0o700});for(const file of fs.readdirSync(directory).filter(f=>/^[A-Z2-9]{6}\.json$/.test(f))){try{const room=JSON.parse(fs.readFileSync(path.join(directory,file),'utf8'));if(room.schema===1&&room.updated>this.now()-7*86400000){room.members.forEach(m=>m.seen=0);this.rooms.set(room.code,room);}}catch(error){console.warn('Room restore skipped:',file,error.message);}}}
 }
 save(room){if(this.directory){const file=path.join(this.directory,room.code+'.json'),temporary=file+'.tmp';fs.writeFileSync(temporary,JSON.stringify(room),{mode:0o600});fs.renameSync(temporary,file);}super.save(room);}
 remove(code){if(this.directory)fs.rmSync(path.join(this.directory,code+'.json'),{force:true});super.remove(code);}
}

export function multiplayerHandler(service,{addresses=[]}={}){
 const attempts=new Map();
 return async(req,res)=>{
  const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith('/api/'))return false;
  const reply=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
  try{
   // Same-origin requests only; no cross-site room creation or authenticated moves.
   if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)fail('Подключайтесь со страницы игры.',403);
   if(req.method==='GET'&&url.pathname==='/api/info'){reply(200,{multiplayer:true,addresses});return true;}
   let body={};if(req.method==='POST'){
    if(!(req.headers['content-type']||'').startsWith('application/json'))fail('Ожидаются данные игры.',415);
    let data='';for await(const chunk of req){data+=chunk;if(Buffer.byteLength(data)>8192)fail('Слишком большой запрос.',413);}try{body=JSON.parse(data);}catch{fail('Не удалось прочитать запрос.');}if(!body||typeof body!=='object'||Array.isArray(body))fail('Неверный запрос.');
   }
   const match=/^\/api\/rooms\/([A-Z2-9]{6})(?:\/(join|command))?$/.exec(url.pathname);
   if(req.method==='POST'&&(url.pathname==='/api/rooms'||match?.[2]==='join')){
    const key=req.socket.remoteAddress,now=Date.now(),recent=(attempts.get(key)||[]).filter(t=>now-t<60000);if(recent.length>=20)fail('Слишком много подключений. Попробуйте через минуту.',429);recent.push(now);attempts.set(key,recent);if(attempts.size>1000)for(const [ip,times] of attempts)if(times.at(-1)<now-60000)attempts.delete(ip);
    reply(200,url.pathname==='/api/rooms'?service.create(body.name,body.seat):service.join(match[1],body.name,body.seat));return true;
   }
   const token=(req.headers.authorization||'').replace(/^Bearer /,'');
   if(match&&req.method==='GET'&&!match[2])reply(200,service.poll(match[1],token,Number(url.searchParams.get('after')??-1)));
   else if(match&&req.method==='POST'&&match[2]==='command')reply(200,service.command(match[1],token,body));
   else reply(404,{error:'Команда комнаты не найдена.'});
  }catch(error){if(!error.status&&!(error instanceof Error))console.error(error);reply(error.status||400,{error:error.message||'Не удалось выполнить действие.'});}
  return true;
 };
}
