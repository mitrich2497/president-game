import {randomBytes,randomInt,createHash} from 'node:crypto';
import {PERSONAS,newGame,reduce,actionPlayerId,RuleViolation} from './web/engine.js';
import {withCampaignNews} from './web/campaign-news.js';
import {courtResult} from './web/deck-ui.js';

const digest=value=>createHash('sha256').update(value).digest('hex');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function entryToken(value){
 if(value===undefined)return randomBytes(24).toString('hex');
 if(typeof value!=='string'||!/^[a-f0-9]{48}$/.test(value))fail('Неверный ключ подключения.');
 return value;
}
function roomCode(token,attempt){
 const hash=createHash('sha256').update('room:'+token+':'+attempt).digest();
 return Array.from(hash.subarray(0,6),byte=>alphabet[byte%alphabet.length]).join('');
}
const fields={ROLL:[],AIRPORT:[],JAIL_TRY:[],BUY:[],HQ:['position'],OFFICE:['position'],INFRA_PLACE:['position'],INFRA_REMOVE:['position','target'],KOLCHAK_MOVE:['double'],SWAN:['accept'],SWAN_PASS:['target'],SWAN_SETTLE:['index'],TRAVEL:[],LAW_SWAP:['index'],LAW_SUE:['index','target'],COURT_RESPONSE:['accept','index'],KERENSKY_RESPONSE:['accept','index'],LENIN_CONTINUE:[],JAIL_PAY:[],JAIL_WAIT:[],END_TURN:[]};
const cleanName=value=>String(value||'Игрок').replace(/[\p{C}<>]/gu,'').trim().slice(0,28)||'Игрок';
const memberPublic=(m,now)=>({id:m.id,name:m.name,persona:m.persona,ready:m.ready,connected:now-m.seen<12000});

// The authoritative state and bearer-token hashes never enter the static directory.
export class RoomCore {
 constructor({now=()=>Date.now(),die=()=>randomInt(1,7)}={}){this.rooms=new Map();this.now=now;this.die=die;}
 save(room){this.rooms.set(room.code,room);}
 remove(code){this.rooms.delete(code);}
 get(code){const room=this.rooms.get(String(code).toUpperCase());if(!room||room.updated<this.now()-7*86400000)fail('Комната не найдена или срок её хранения истёк.',404);return room;}
 authenticate(room,token){if(typeof token!=='string'||token.length!==48)fail('Нужен ключ участника. Подключитесь к комнате.',401);const member=room.members.find(m=>m.key===digest(token));if(!member)fail('Это подключение больше не принадлежит комнате.',401);member.seen=this.now();return member;}
 create(name,seat,attempt=0){
  for(const [code,r] of this.rooms)if(!r.members.length||r.updated<this.now()-7*86400000){this.remove(code);}
  const token=entryToken(seat),key=digest(token);
  let code;
  do{code=roomCode(token,attempt++);}while(this.rooms.has(code)&&!this.rooms.get(code).members.some(m=>m.key===key));
  if(this.rooms.has(code))return {...this.poll(code,token),token};
  if(this.rooms.size>=100)fail('Сервер заполнен. Попробуйте позже.',503);
  const member={id:0,name:cleanName(name),persona:'catherine',ready:false,key,seen:this.now()};
  const room={schema:1,code,host:0,revision:1,rosterRevision:1,updated:this.now(),members:[member],game:null,event:null,receipts:[]};this.save(room);return {...this.snapshot(room,member),token};
 }
 join(code,name,seat){
  const original=this.get(code),token=entryToken(seat),key=digest(token);
  if(original.members.some(m=>m.key===key))return {...this.poll(code,token),token};
  if(!original.members.length)fail('Участники покинули комнату. Попросите новое приглашение.',404);
  if(original.game)fail('Партия уже началась. Вернитесь по ссылке комнаты в том браузере, где вы уже играли.',409);
  if(original.members.length>=6)fail('В комнате уже шесть участников.',409);
  const room=structuredClone(original),member={id:Math.max(...room.members.map(m=>m.id))+1,name:cleanName(name),persona:Object.keys(PERSONAS).find(id=>!room.members.some(m=>m.persona===id)),ready:false,key,seen:this.now()};
  room.members.push(member);room.members.forEach(m=>m.ready=false);room.rosterRevision=++room.revision;room.updated=this.now();this.save(room);return {...this.snapshot(room,member),token};
 }
 snapshot(room,member,after=-1){
  const members=room.members.map(m=>memberPublic(m,this.now())),result={code:room.code,revision:room.revision,rosterRevision:room.rosterRevision??room.revision,host:room.host,you:member.id,members,started:!!room.game};
  if(after===room.revision)return result;
  if(room.game){
   const s=structuredClone(room.game);delete s.decks;
   s.players.forEach(p=>{if(p.id!==member.id)p.hand=p.hand.map(()=>null);});
   // LAW_SWAP's private receipt names the new card. Other players see the action only.
   if(s.current!==member.id&&s.decision?.title==='Карта заменена')s.decision.text='Кандидат заменил одну закрытую карту «Юрист».';
   s.network={code:room.code,viewer:member.id,connected:true,members};result.game=s;
   if(room.event){result.event=structuredClone(room.event);if(result.event.court){for(const who of ['plaintiff','defendant'])delete result.event.court[who].hand;}}
  }
  return result;
 }
 poll(code,token,after){const room=this.get(code),member=this.authenticate(room,token);return this.snapshot(room,member,after);}
 command(code,token,input){
  const original=this.get(code),identity=this.authenticate(original,token),request=input?.request;
  if(typeof request!=='string'||!/^[\w-]{8,80}$/.test(request))fail('Неверный номер запроса.');
  const receipt=identity.key+':'+request;
  if(original.receipts.includes(receipt)||original.receipts.includes(identity.id+':'+request))return this.snapshot(original,identity);
  const rosterRevision=original.rosterRevision??original.revision;
  const parallelReady=!original.game&&input.kind==='ready'&&Number.isInteger(input.revision)&&input.revision<original.revision
   &&input.rosterRevision===rosterRevision&&(identity.readyRevision??0)<=input.revision;
  if(input.revision!==original.revision&&!parallelReady)fail('Партия обновилась. Проверьте текущий ход и повторите действие.',409);
  const room=structuredClone(original),member=room.members.find(m=>m.id===identity.id),kind=input.kind;
  room.rosterRevision=['hero','leave'].includes(kind)?room.revision+1:rosterRevision;
  if(kind==='leave'){
   if(room.game)fail('Место в начавшейся партии закреплено за вами. Можно закрыть вкладку и вернуться в этом браузере.');
   room.members=room.members.filter(m=>m.id!==member.id);
   if(!room.members.length){this.remove(room.code);return {left:true};}
   if(room.host===member.id)room.host=room.members[0].id;
   room.members.forEach(m=>m.ready=false);
  }else if(!room.game){
   if(kind==='hero'){if(!Object.hasOwn(PERSONAS,input.persona))fail('Неизвестный персонаж.');if(room.members.some(m=>m.id!==member.id&&m.persona===input.persona))fail('Этот персонаж уже выбран другим участником.',409);member.persona=input.persona;member.ready=false;}
   else if(kind==='ready'){if(typeof input.ready!=='boolean')fail('Укажите готовность.');member.ready=input.ready;member.readyRevision=room.revision+1;}
   else if(kind==='start'){
    if(member.id!==room.host)fail('Кампанию запускает создатель комнаты.',403);
    if(room.members.length<2||!room.members.every(m=>m.ready&&this.now()-m.seen<12000))fail('Нужно от двух до шести подключённых и готовых участников.');
    room.members.forEach((m,id)=>m.id=id);room.host=room.members.find(m=>m.key===member.key).id;
    room.game=newGame({players:room.members.map(m=>({persona:m.persona,bot:false}))});room.event=null;
   }else fail('Это действие недоступно в комнате.');
  }else{
   if(kind!=='action')fail('Партия уже началась.');
   if(member.id!==actionPlayerId(room.game))fail('Сейчас решение принимает другой участник.',403);
   const source=input.action;if(!source||!Object.hasOwn(fields,source.type))fail('Неизвестное игровое действие.');
   const action={type:source.type};for(const key of fields[source.type])if(Object.hasOwn(source,key))action[key]=source[key];
   if(['ROLL','JAIL_TRY'].includes(action.type))action.dice=[this.die(),this.die()];if(action.type==='AIRPORT')action.value=this.die();
   const before=room.game;
   try{room.game=withCampaignNews(before,reduce(before,action),action);}
   catch(error){if(error instanceof RuleViolation)fail(error.message,422);throw error;}
   const court=courtResult(before,room.game,action);if(court)for(const who of ['plaintiff','defendant'])court[who]={...court[who],hand:undefined};
   room.event={action,court,previousRevision:original.revision};
  }
  room.revision++;room.updated=this.now();room.receipts.push(receipt);room.receipts=room.receipts.slice(-256);this.save(room);
  return kind==='leave'?{left:true}:this.snapshot(room,room.members.find(m=>m.key===member.key));
 }
}
