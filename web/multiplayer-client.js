// Only the seat credential and an unacknowledged command are stored locally.
// The server remains authoritative for progress, dice and private cards.
const SESSION_KEY='president.room.v1';
const LEGACY_VK_OWNER='president.vk.room-owner.v1';
const validCode=code=>/^[A-Z2-9]{6}$/.test(code);
const entryKey=code=>SESSION_KEY+'.entry'+(code?'.'+code:'');
export function createRoomStorage(getStorage,vkUserId){
 const account=typeof vkUserId==='string'&&/^[1-9][0-9]{0,19}$/.test(vkUserId)?vkUserId:'';
 const prefix=account?'president.vk.'+account+'.':'';
 let initialized=false;
 function storage(){
  const target=getStorage();
  if(!account||initialized)return target;
  if(target.getItem(LEGACY_VK_OWNER)===null){
   const oldKeys=Array.from({length:target.length},(_,index)=>target.key(index))
    .filter(key=>key===SESSION_KEY||key?.startsWith(SESSION_KEY+'.'));
   // Older versions had no account marker. Only the first VK account can import them.
   target.setItem(LEGACY_VK_OWNER,account);
   for(const key of oldKeys){
    const value=target.getItem(key);
    if(value!==null&&target.getItem(prefix+key)===null)target.setItem(prefix+key,value);
   }
  }
  initialized=true;
  return target;
 }
 return {
  getItem:key=>storage().getItem(prefix+key),
  setItem:(key,value)=>storage().setItem(prefix+key,value),
  removeItem:key=>storage().removeItem(prefix+key)
 };
}
function readEntry(storage,code){
 try{
  const entry=JSON.parse(storage?.getItem(entryKey(code))||'null');
  if(entry&&/^[a-f0-9]{48}$/.test(entry.seat)&&(entry.code===null||validCode(entry.code))&&(!code||entry.code===code))return entry;
 }catch{}
 return null;
}
function readSeat(storage,code){
 try{
  const value=JSON.parse((code&&storage?.getItem(SESSION_KEY+'.'+code))||storage?.getItem(SESSION_KEY)||'null');
  if(!value||!validCode(value.code)||!/^[a-f0-9]{48}$/.test(value.token)||(code&&value.code!==code))return null;
  return value;
 }catch{return null;}
}
export function createRoomClient({storage,legacyStorage,onUpdate,onConnection,onError,onExpired,onEntryChange,onLeft,fetcher=fetch,roomCode=null,apiOrigin}={}){
 const invited=validCode(String(roomCode||'').toUpperCase())?String(roomCode).toUpperCase():null;
 let credential=readSeat(storage,invited)||readSeat(legacyStorage,invited);
 let entry=readEntry(storage,invited)||readEntry(legacyStorage,invited);
 if(!entry&&invited&&!credential){
  const latest=readEntry(storage)||readEntry(legacyStorage);
  if(latest?.invitation===invited)entry=latest;
 }
 if(entry?.seat===credential?.token||(invited&&credential))entry=null;
 if(entry)credential=null;
 let snapshot=null,connected=false,pending=false,stopped=true,timer=null,queue=Promise.resolve(),generation=0,polling=null,storageWarning=false;
 const controllers=new Set();
 const status=value=>{if(connected!==value){connected=value;onConnection?.(value);}};
 const requestId=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 function saveSeat(makeLatest=false){
  if(!credential)return;
  const value=JSON.stringify(credential);
  let durable=false;
  for(const target of [storage,legacyStorage]){
   try{
    if(!target)continue;
    target.setItem(SESSION_KEY+'.'+credential.code,value);
    if(makeLatest||readSeat(target)?.code===credential.code)target.setItem(SESSION_KEY,value);
    if(target===storage)durable=true;
   }catch{}
  }
  if(!durable&&!storageWarning)onError?.('Браузер не разрешает сохранять место в комнате. Не закрывайте вкладку; разрешите хранение данных сайта для возвращения в игру.');
  storageWarning=!durable;
 }
 async function request(url,body,token=credential?.token){
  const controller=new AbortController(),deadline=setTimeout(()=>controller.abort(),8000);controllers.add(controller);
  try{
   const endpoint=apiOrigin?new URL(url,apiOrigin).href:url;
   const response=await fetcher(endpoint,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store',credentials:'omit',signal:controller.signal});
   let data;try{data=await response.json();}catch{throw new Error('Сервер игры временно недоступен. Подключение восстановится автоматически.');}
   if(!response.ok)throw Object.assign(new Error(data.error||'Сервер не ответил.'),{status:response.status});return data;
  }catch(error){if(error.name==='AbortError'||error instanceof TypeError)throw new Error('Нет связи с сервером. Восстанавливаем подключение…');throw error;}
  finally{clearTimeout(deadline);controllers.delete(controller);}
 }
 function deliver(data,epoch=generation){
  queue=queue.catch(()=>{}).then(async()=>{
   if(epoch!==generation||stopped||!credential||data.code!==credential.code)return;
   if(snapshot&&data.revision<snapshot.revision)return;
   const changed=!snapshot||data.revision!==snapshot.revision,previous=snapshot;
   snapshot={...snapshot,...data};if(!data.game&&previous?.game)snapshot.game=previous.game;
   if(snapshot.game)snapshot.game.network={...snapshot.game.network,members:data.members,connected:true};
   status(true);await onUpdate?.(snapshot,{changed,initial:!previous});
  });return queue;
 }
 function schedule(){clearTimeout(timer);if((credential||entry)&&!stopped)timer=setTimeout(poll,1000);}
 function terminal(error){
  if(error.status!==401&&error.status!==404)return false;
  const code=credential?.code;reset();onExpired?.({code,message:error.message});onError?.(error.message);return true;
 }
 // Keep the original request ID until the server acknowledges it. Reopening
 // after a lost response can never charge twice or produce a second dice roll.
 async function flush(epoch){
  const body=credential?.command;if(!body)return true;
  let data;
  try{data=await request('/api/rooms/'+credential.code+'/command',body);}
  catch(error){
   if(body.kind!=='leave'||![401,404].includes(error.status))throw error;
   data={left:true}; // The seat is already gone, even if the departure response was lost.
  }
  if(epoch!==generation||stopped)return false;
  if(data.left){reset();onLeft?.();return true;}
  delete credential.command;saveSeat();await deliver(data,epoch);return true;
 }
 async function poll(){
  if(stopped)return;
  if(polling)return polling;
  if(pending){schedule();return;}
  if(entry)return submitEntry();
  if(!credential)return;
  const epoch=generation;
  const run=(async()=>{
   try{
    if(credential.command){
     try{await flush(epoch);}catch(error){
      if(epoch!==generation)return;
      if(!error.status||error.status>=500||error.status===429)throw error;
      if(terminal(error))return;
      delete credential.command;saveSeat();onError?.(error.message);
     }
    }
    if(epoch===generation&&credential&&!stopped)await deliver(await request('/api/rooms/'+credential.code+'?after='+(snapshot?.revision??-1)),epoch);
   }catch(error){if(epoch===generation){status(false);terminal(error);}}
  })();
  polling=run;
  try{await run;}finally{if(polling===run)polling=null;if(epoch===generation)schedule();}
 }
 async function connect(code,name){
  if(pending)return;
  // Entering a known room's code also restores its existing seat.
  const existing=code&&(readSeat(storage,code)||readSeat(legacyStorage,code));
  if(existing){stop();credential=existing;snapshot=null;return resume();}
  const saved=readEntry(storage,code)||readEntry(legacyStorage,code);
  if(entry?.code!==code){
   try{
    entry=saved?.code===code?saved:{
     code,name,invitation:invited,seat:Array.from(crypto.getRandomValues(new Uint8Array(24)),byte=>byte.toString(16).padStart(2,'0')).join('')
    };
   }catch{onError?.('Не удалось подготовить безопасный ключ комнаты. Попробуйте открыть игру в другом браузере.');return;}
  }
  stop();credential=null;snapshot=null;
  for(const target of [storage,legacyStorage])try{
   const data=JSON.stringify(entry);
   target?.setItem(entryKey(null),data);
   if(code)target?.setItem(entryKey(code),data);
  }catch{}
  stopped=false;onEntryChange?.();
  return submitEntry();
 }
 function clearEntry(){
  if(!entry)return;
  for(const target of [storage,legacyStorage])for(const key of new Set([entry.code,null]))try{
   if(readEntry(target,key)?.seat===entry.seat)target?.removeItem(entryKey(key));
  }catch{}
  entry=null;
 }
 async function submitEntry(){
  if(pending||!entry||stopped)return;
  pending=true;
  const epoch=generation,{code,name,seat}=entry;
  try{
   const data=await request(code?'/api/rooms/'+code+'/join':'/api/rooms',{name,seat},null);
   if(epoch!==generation)return;
   credential={code:data.code,token:data.token};delete data.token;snapshot=null;saveSeat(true);
   clearEntry();await deliver(data,epoch);
  }catch(error){
   if(epoch!==generation)return;
   if(error.status&&error.status<500&&error.status!==429){clearEntry();onEntryChange?.();onError?.(error.message);}
   else if(connected)status(false);
  }finally{if(epoch===generation){pending=false;schedule();}}
 }
 async function command(kind,details={}){
  if(pending||!credential||!snapshot||stopped||credential.command)return false;
  pending=true;const epoch=generation;
  credential.command={kind,...details,revision:snapshot.revision,request:requestId()};
  if(kind==='ready')credential.command.rosterRevision=snapshot.rosterRevision;
  saveSeat();
  try{
   try{return await flush(epoch);}catch(error){
    if(error.status||epoch!==generation)throw error;
    return await flush(epoch);
   }
  }catch(error){
   if(epoch===generation){
    if(terminal(error))return false;
    if(error.status&&error.status<500&&error.status!==429){delete credential.command;saveSeat();}
    else status(false);
    onError?.(error.message);
   }return false;
  }finally{if(epoch===generation){pending=false;schedule();}}
 }
 function stop(){
  stopped=true;generation++;clearTimeout(timer);polling=null;pending=false;
  for(const controller of controllers)controller.abort();
 }
 function reset(){
  const old=credential;stop();clearEntry();credential=null;snapshot=null;status(false);
  for(const target of [storage,legacyStorage])try{
   if(old)target?.removeItem(SESSION_KEY+'.'+old.code);
   if(readSeat(target)?.code===old?.code)target?.removeItem(SESSION_KEY);
  }catch{}
 }
 function resume(){stopped=false;saveSeat(true);return poll();}
 return {
  get active(){return !!(credential||entry);},get entering(){return !!entry;},get code(){return credential?.code||entry?.code||null;},get snapshot(){return snapshot;},get connected(){return connected;},get pending(){return pending||!!credential?.command;},
  info:()=>request('/api/info',null,null),create:name=>connect(null,name),join:(code,name)=>connect(code.trim().toUpperCase(),name),command,play:action=>command('action',{action}),resume,reset,stop,
  reconnect:()=>{if(!stopped)return poll();},disconnect:()=>status(false),
  async leave(){if(!connected)return false;return command('leave');}
 };
}
