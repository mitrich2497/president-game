import { CITIES, TILES } from './data.js';
export const CITY_BY_ID = Object.fromEntries(CITIES.map(c=>[c.position,c]));
export const TILE_BY_ID = Object.fromEntries(TILES.map(t=>[t.n,t]));
export const AIRPORTS=[6,18,30,42];
export const EXITS=[
 {value:1,position:6,city:7,name:'Уральский федеральный округ',wheelLabel:'Уральский',district:'УФО',color:'#d8a34d'},
 {value:2,position:18,city:19,name:'Сибирский федеральный округ',wheelLabel:'Сибирский',district:'СФО',color:'#528ab6'},
 {value:3,position:30,city:31,name:'Северо-Кавказский федеральный округ',wheelLabel:'Северо-Кавказский',district:'СКФО',color:'#a58ac9'},
 {value:4,position:42,city:43,name:'Приволжский федеральный округ',wheelLabel:'Приволжский',district:'ПФО',color:'#cb8ea5'},
 {value:5,position:24,name:'Президент',color:'#beab77'},
 {value:6,position:12,name:'Следствие',color:'#798d95'}
];
export const PERSONAS={
 catherine:{name:'Екатерина II',short:'Екатерина',portrait:0,era:'Императрицы',style:'Влияние и возможности',ability:'Положительные эффекты «Чёрного лебедя» и их стоимость удваиваются.'},
 nicholas:{name:'Николай II',short:'Николай',portrait:1,era:'Российская империя',style:'Развитие округов',ability:'Может построить региональное отделение в своей столице, не собирая весь округ.'},
 elizabeth:{name:'Елизавета Петровна',short:'Елизавета',portrait:2,era:'Императрицы',style:'Влияние в Сибири',ability:'Голоса подконтрольных городов Сибирского федерального округа удваиваются.'},
 lenin:{name:'Владимир Ленин',short:'Ленин',portrait:3,era:'Революция',style:'Непрерывная кампания',ability:'Не пропускает ход после встречи с президентом. Под следствием может бесплатно продолжить ход.'},
 brezhnev:{name:'Леонид Брежнев',short:'Брежнев',portrait:4,era:'СССР',style:'Ресурсы кампании',ability:'За каждый проход «Старта» получает дополнительно 500 млн ₽: всего 1,5 млрд ₽.'},
 stalin:{name:'Иосиф Сталин',short:'Сталин',portrait:7,era:'СССР',style:'Судебная стратегия',ability:'В его судебных делах выплаты удваиваются; ответчик в любом случае отправляется под следствие.'},
 kolchak:{name:'Александр Колчак',short:'Колчак',portrait:8,era:'Революция',style:'Решительный манёвр',ability:'Если сумма двух кубиков меньше 6, может удвоить число шагов. Перед выбором видны обе возможные остановки.'},
 milyukov:{name:'Павел Милюков',short:'Милюков',portrait:9,era:'Российская империя',style:'Передача инициативы',ability:'Может передать вытянутого «Чёрного лебедя» любому сопернику. Получатель решает, оплачивать ли необязательное событие.'},
 khrushchev:{name:'Никита Хрущёв',short:'Хрущёв',portrait:10,era:'СССР',style:'Двойной иск',ability:'На клетке «Юрист» может предъявить иски двум разным соперникам. Издержки платит только по первому проигранному делу. Следствие прерывает серию.'},
 kerensky:{name:'Александр Керенский',short:'Керенский',portrait:11,era:'Революция',style:'Ответный иск',ability:'Когда соперник заменяет карту на клетке «Юрист», может сразу предъявить ему иск вне своего хода. Автоматическое пополнение после суда не запускает новый иск.'},
 catherine_i:{name:'Екатерина I',short:'Екатерина I',portrait:12,era:'Императрицы',style:'Поворот судьбы',ability:'Штрафные события «Чёрного лебедя» превращает в бонусы: вместо выплаты получает деньги, вместо потери — голоса. Выбирает один результат.'},
 anna:{name:'Анна Иоанновна',short:'Анна',portrait:13,era:'Императрицы',style:'Защита владений',ability:'На клетке «Инфраструктура» может бесплатно убрать по одному чужому объекту из двух разных своих городов.'},
 witte:{name:'Сергей Витте',short:'Витте',portrait:14,era:'Российская империя',style:'Ответное развитие',ability:'На клетке «Инфраструктура» после бесплатного удаления чужого объекта может бесплатно поставить свой в городе соперника.'},
 stolypin:{name:'Пётр Столыпин',short:'Столыпин',portrait:15,era:'Российская империя',style:'Развитие территорий',ability:'На клетке «Инфраструктура» может бесплатно поставить по одному объекту в двух разных городах соперников.'},
 kirov:{name:'Сергей Киров',short:'Киров',portrait:16,era:'СССР',style:'Опора на Северо-Западе',ability:'В подконтрольных ему городах СЗФО соперники не могут размещать инфраструктуру. Уже стоящие объекты сохраняются.'},
 trotsky:{name:'Лев Троцкий',short:'Троцкий',portrait:17,era:'Революция',style:'Быстрый перехват',ability:'Перехватывает чужой город двумя собственными объектами инфраструктуры вместо трёх. Объекты разных кандидатов не складываются.'}
};
export const PLAYER_COLORS=['#83d8bd','#edc47b','#bd9ae0','#e89782','#82bbeb','#d0d88b'];
export function voteTarget(s){const count=typeof s==='number'?s:s.players.length;return count===2?51:count<=4?41:31;}
export function cityVotes(s,pos,id=s.regions[pos]?.owner,level=s.regions[pos]?.level||'base'){const c=CITY_BY_ID[pos];return c.levels[level].votes_percent*(s.players[id]?.persona==='elizabeth'&&c.district_on_board==='СФО'?2:1);}
export function actionPlayerId(s){return s.phase==='decision'?(s.decision?.actor??s.decision?.recipient??s.current):s.current;}
export function canControl(s){return !s.players[actionPlayerId(s)].bot&&(!s.network||(s.network.connected&&s.network.viewer===actionPlayerId(s)));}
export function viewerId(s){if(s.network)return s.network.viewer;const id=actionPlayerId(s);return s.players[id].bot?s.players.find(p=>!p.bot).id:id;}
export function lawsuitTargets(s){const d=s.decision;return s.players.filter(p=>['reaction','courtAccusation'].includes(d?.kind)?p.id===d.target:p.id!==s.current&&!d?.accused?.includes(p.id));}
export const SWAN=[
 {id:'treasury',name:'Казна',text:'Госбюджет выделил срочные средства.',cash:250},
 {id:'recognition',name:'Признание народа',text:'Твои заслуги заметили избиратели.',votes:1},
 {id:'growth',name:'Рост',text:'Экономика бьёт рекорды.',cash:1000},
 {id:'debates',name:'Дебаты',text:'Ты блистаешь на экране. Вложись в кампанию или сохрани средства.',cost:500,votes:2},
 {id:'work',name:'Работа',text:'Новые рабочие места радуют жителей.',cost:750,votes:3},
 {id:'meeting',name:'Митинг',text:'Народ собрался в поддержку.',cost:500,votes:2},
 {id:'celebration',name:'Праздник',text:'Гуляния сплотили народ.',cost:500,votes:2},
 {id:'success',name:'Успех',text:'Регион процветает под твоим руководством.',cost:500,votes:2},
 {id:'blizzard',name:'Метель',text:'Снегопад парализовал регионы. Заплатите 500 млн ₽ или потеряйте 2% голосов до уплаты. Поздняя оплата — 1 млрд ₽.',penalty:{cash:500,votes:2}},
 {id:'leak',name:'Утечка',text:'Секреты штаба попали в прессу. Заплатите 250 млн ₽ или потеряйте 1% голосов до уплаты. Поздняя оплата — 500 млн ₽.',penalty:{cash:250,votes:1}}
];
export const TRAVEL=[
 {id:'industry',name:'Трудолюбие',text:'Идите вперёд до ближайшей клетки «Инфраструктура».'},
 {id:'luck',name:'Удача',text:'Перейдите к ближайшему свободному городу и получите его бесплатно. Если свободных нет — вернитесь к аэропорту.'},
 {id:'humility',name:'Смирение',text:'Вернитесь на «Старт» без выплаты за круг.'},
 {id:'practical',name:'Практичность',text:'Перейдите вперёд до ближайшей клетки «Инфраструктура».'},
 {id:'resolve',name:'Решительность',text:'Двигайтесь вперёд до ближайшей клетки «Инфраструктура».'}
];
export const LAWYERS=[
 {id:'false-votes',name:'Фальшивые голоса',text:'Ответчик платит истцу 300 млн ₽ и отправляется под судебное следствие.',payer:'defendant',amount:300,jail:'defendant'},
 {id:'clean',name:'Чистая репутация',text:'Истец платит ответчику 200 млн ₽. Ответчик получает +1% поддержки. Без следствия.',payer:'plaintiff',amount:200,votes:'defendant'},
 {id:'evidence',name:'Фальшивые улики',text:'Истец платит ответчику 300 млн ₽ и отправляется под судебное следствие.',payer:'plaintiff',amount:300,jail:'plaintiff'},
 {id:'unproven',name:'Недоказанная взятка',text:'Истец платит ответчику 200 млн ₽. Без следствия.',payer:'plaintiff',amount:200},
 {id:'false-report',name:'Ложный донос',text:'Истец платит ответчику 300 млн ₽. Без следствия.',payer:'plaintiff',amount:300},
 {id:'fair',name:'Честная игра',text:'Истец платит ответчику 200 млн ₽. Без следствия.',payer:'plaintiff',amount:200}
];
const clone=s=>structuredClone(s);
export class RuleViolation extends Error {}
const assert=(v,m)=>{if(!v)throw new RuleViolation(m);};
const shuffle=a=>{const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;};
export function money(n){return Math.abs(n)>=1000?new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n/1000)+' млрд ₽':new Intl.NumberFormat('ru-RU').format(n)+' млн ₽';}
export function tileName(n){return AIRPORTS.includes(n)?'Аэропорт':TILE_BY_ID[n]?.name||'Старт';}
export function getVotes(s,id){return Math.max(0,s.players[id].bonusVotes-(s.players[id].swanDebts||[]).reduce((sum,key)=>sum+(SWAN.find(c=>c.id===key)?.penalty?.votes||0),0)+Object.entries(s.regions).reduce((sum,[pos,r])=>sum+(r.owner===id?cityVotes(s,+pos,id,r.level):0),0));}
export function canSettleSwan(s,index){const p=s.players[s.current],c=SWAN.find(c=>c.id===p.swanDebts?.[index]);return (s.phase==='ready'||s.phase==='decision'&&s.decision?.kind==='end')&&Number.isInteger(index)&&!!c?.penalty&&p.cash>=c.penalty.cash*2;}
export function newGame({human='catherine',mode='bot',players:roster}={}){
 const other=human==='catherine'?'nicholas':'catherine';
 const seats=roster||[human,other].map((persona,i)=>({persona,bot:mode==='bot'&&i===1}));
 assert(Array.isArray(seats)&&seats.length>=2&&seats.length<=6,'Выберите от 2 до 6 участников.');
 assert(seats.every(p=>p&&Object.hasOwn(PERSONAS,p.persona)&&typeof p.bot==='boolean')&&new Set(seats.map(p=>p.persona)).size===seats.length,'У каждого участника должна быть своя личность.');
 assert(seats.some(p=>!p.bot),'Нужен хотя бы один игрок-человек.');
 mode=seats.some(p=>p.bot)?'bot':'manual';
 const s={version:1,current:0,round:1,phase:'ready',decision:null,lastDice:[1,1],lastRoll:null,extraRoll:false,regions:{},log:[],serial:0,winner:null,mode,scenario:null,
 players:seats.map(({persona,bot},i)=>({id:i,persona,name:PERSONAS[persona].name,cash:2000,bonusVotes:0,position:0,airportPending:false,jail:0,skip:0,hand:shuffle(LAWYERS.map(x=>x.id)).slice(0,2),bot})),
 decks:{swan:shuffle(SWAN.map(x=>x.id)),travel:shuffle(TRAVEL.map(x=>x.id))}};
 log(s,'Начало кампании. У каждого кандидата — 2 млрд ₽.');return s;
}
function log(s,message){s.log.unshift({id:++s.serial,turn:s.round,player:s.current,text:message});s.log=s.log.slice(0,60);}
function checkVictory(s){if(s.phase==='finished')return;const p=s.players.find(p=>p.cash>=15000||getVotes(s,p.id)>=voteTarget(s));if(p){s.winner=p.id;s.phase='finished';log(s,p.name+' побеждает: '+(p.cash>=15000?'накоплено 15 млрд ₽.':'получено не менее '+voteTarget(s)+'% поддержки.'));}}
function current(s){return s.players[s.current];}
function done(s,title,text){s.phase='decision';s.decision={kind:'end',title,text};}
function draw(s,deck){const items=deck==='swan'?SWAN:TRAVEL,held=new Set(deck==='swan'?s.players.flatMap(p=>p.swanDebts||[]):[]);s.decks[deck]=s.decks[deck].filter(id=>!held.has(id));if(!s.decks[deck].length)s.decks[deck]=shuffle(items.filter(x=>!held.has(x.id)).map(x=>x.id));const id=s.decks[deck].pop();return items.find(x=>x.id===id);}
export function planMove(from,steps){assert(Number.isInteger(from)&&from>=0&&from<48,'Неверная позиция.');assert(Number.isInteger(steps)&&steps>0&&steps<=48,'Неверное число шагов.');const path=Array.from({length:steps},(_,i)=>(from+i+1)%48);return {from,to:path.at(-1),path,startPasses:path.filter(n=>n===0).length};}
function move(s,steps){const p=current(s),route=planMove(p.position,steps);p.position=route.to;p.airportPending=false;
 if(route.startPasses){const income=(p.persona==='brezhnev'?1500:1000)*route.startPasses;p.cash+=income;log(s,p.name+': проход «Старта», +'+money(income)+'.');}
 s.transition={...route,id:++s.serial,player:s.current};checkVictory(s);return route;
}
function teleport(s,id,to){const p=s.players[id];s.transition={id:++s.serial,player:id,from:p.position,to,path:[to],startPasses:0};p.position=to;p.airportPending=false;}
function sendJail(s,id){const p=s.players[id];teleport(s,id,12);p.jail=3;if(id===s.current)s.extraRoll=false;}
function releaseInvestigation(s,message){
 const p=current(s);p.jail=0;s.phase='ready';s.decision=null;s.extraRoll=false;
 s.notice=message+' Бросьте кубики для движения в этом ходу.';
 log(s,p.name+': '+message+' Продолжает текущий ход.');
}
function waitInvestigation(s,dice=null){
 const p=current(s);p.jail--;s.extraRoll=false;s.notice=null;
 const outcome=p.jail?'Осталось собственных ходов ожидания: '+p.jail+'.':'Три хода ожидания завершены. Движение — в следующий собственный ход.';
 done(s,p.jail?(dice?'Следствие продолжается':'Пропуск хода'):'Следствие завершено',outcome);
 log(s,p.name+': '+(dice?dice.join(' + ')+' — дубля нет. ':'Пропущен один ход ожидания. ')+(p.jail?outcome:'Следствие завершено. Движение — в следующий собственный ход.'));
}
function arrive(s){
 if(s.phase==='finished')return;
 const p=current(s),pos=p.position;
 if(AIRPORTS.includes(pos)){p.airportPending=true;s.extraRoll=false;done(s,'Пересадка в аэропорту','Ход завершён. В начале следующего хода колесо определит направление, затем можно бросить кубики.');log(s,p.name+' останавливается в аэропорту.');return;}
 const t=TILE_BY_ID[pos];s.phase='decision';
 if(t.kind==='city'){
  const city=CITY_BY_ID[pos],r=s.regions[pos];
  if(!r){s.decision={kind:'city',position:pos,title:city.city,text:'Вложитесь в кампанию и закрепите поддержку города.'};return;}
  if(r.owner===p.id){s.decision={kind:'owncity',position:pos,title:city.city,text:'Развивайте собственную кампанию: штаб увеличивает поддержку и платёж за остановку.'};return;}
  const amount=city.levels[r.level].money_million_rub;p.cash-=amount;s.players[r.owner].cash+=amount;
  log(s,p.name+' → '+s.players[r.owner].name+': '+money(amount)+' за остановку в '+city.city+'.');
  done(s,'Поддержка соперника',city.city+': '+money(amount)+' перечислено кандидату '+s.players[r.owner].name+'.');checkVictory(s);return;
 }
 if(t.kind==='swan'){s.decision={kind:'swan',card:draw(s,'swan')};return;}
 if(t.kind==='travel'){s.decision={kind:'travel',card:draw(s,'travel')};return;}
 if(t.kind==='lawyer'){s.decision={kind:'lawyer',title:'Юрист',text:'Обновите одну свою карту или предъявите иск, выбрав закрытую карту соперника.'};return;}
 if(t.kind==='infra'){s.decision={kind:'infrastructure',title:'Инфраструктура',text:['anna','witte','stolypin'].includes(p.persona)?PERSONAS[p.persona].ability:'Одно действие: бесплатно разместите объект в чужом городе, уберите чужой объект из своего города или постройте платный штаб.'};return;}
 if(t.kind==='president'){p.skip=p.persona==='lenin'?0:1;s.extraRoll=false;s.decision={kind:'president',title:'Встреча с президентом',text:p.persona==='lenin'?'Способность Ленина: следующий ход не пропускается.':'Вы на встрече с президентом. Следующий ход будет пропущен.'};log(s,p.name+' прибывает на встречу с президентом.');return;}
 if(t.kind==='court'){const queue=Array.from({length:s.players.length-1},(_,i)=>(s.current+i+1)%s.players.length);log(s,p.name+' останавливается на «Судебном следствии». Соперники могут предъявить иск.');offerCourtAccusation(s,queue);return;}
 done(s,'Новый круг','Вы на старте кампании.');checkVictory(s);
}
export function infrastructureEntries(s,pos){return Object.entries(s.regions[pos]?.infrastructure||{}).map(([id,count])=>({player:Number(id),count})).filter(x=>s.players[x.player]&&x.count>0).sort((a,b)=>b.count-a.count||a.player-b.player);}
export function infrastructureLimit(s,id=s?.current){return s?.players[id]?.persona==='trotsky'?2:3;}
export function infrastructureProtected(s,pos){return s.players[s.regions[pos]?.owner]?.persona==='kirov'&&CITY_BY_ID[pos]?.district_on_board==='СЗФО';}
export function infrastructureTurn(s){return s.phase==='decision'&&['infrastructure','hq'].includes(s.decision?.kind)&&TILE_BY_ID[s.players[s.current].position]?.kind==='infra';}
export function canPlaceInfrastructure(s,pos){const r=s.regions[pos],next=s.decision?.followup;return infrastructureTurn(s)&&(!next||next.mode==='place'&&next.used!==pos)&&!!CITY_BY_ID[pos]&&!!r&&r.owner!==s.current&&!infrastructureProtected(s,pos);}
export function canRemoveInfrastructure(s,pos,target){const r=s.regions[pos],next=s.decision?.followup;return infrastructureTurn(s)&&(!next||next.mode==='remove'&&next.used!==pos)&&r?.owner===s.current&&Number.isInteger(target)&&target!==s.current&&(r.infrastructure?.[target]||0)>0;}
export function canHQ(s,pos,free=false){const r=s.regions[pos],c=CITY_BY_ID[pos];return !s.decision?.followup&&!!r&&r.owner===s.current&&r.level==='base'&&!infrastructureEntries(s,pos).length&&(free||current(s).cash>=c.headquarters_cost_million_rub);}
function extraInfrastructure(s,previous,action,pos){
 if(previous.followup)return;
 const hero=current(s).persona,mode=hero==='stolypin'&&action==='place'?'place':hero==='anna'&&action==='remove'?'remove':hero==='witte'&&action==='remove'?'place':null;
 if(!mode)return;
 const result=s.decision;
 s.decision={kind:'infrastructure',title:PERSONAS[hero].style,text:result.text+' Можно выполнить дополнительное действие или завершить ход.',followup:{mode,used:pos}};
 const available=CITIES.some(c=>mode==='place'?canPlaceInfrastructure(s,c.position):infrastructureEntries(s,c.position).some(x=>canRemoveInfrastructure(s,c.position,x.player)));
 if(!available)s.decision=result;
}
export function botInfrastructureAction(s){
 if(!infrastructureTurn(s))return null;
 const p=current(s),votes=getVotes(s,p.id),target=voteTarget(s);
 const rivals=CITIES.filter(c=>canPlaceInfrastructure(s,c.position)).sort((a,b)=>(s.regions[b.position].infrastructure?.[s.current]||0)-(s.regions[a.position].infrastructure?.[s.current]||0)||cityVotes(s,b.position,p.id)-cityVotes(s,a.position,p.id)||a.position-b.position);
 const captures=rivals.filter(c=>(s.regions[c.position].infrastructure?.[s.current]||0)===infrastructureLimit(s)-1),imminent=captures[0];
 const victory=captures.find(c=>votes+cityVotes(s,c.position,p.id)>=target);
 if(victory)return {type:'INFRA_PLACE',position:victory.position};
 const threats=CITIES.flatMap(c=>infrastructureEntries(s,c.position).filter(x=>canRemoveInfrastructure(s,c.position,x.player)).map(x=>({...x,position:c.position}))).sort((a,b)=>(infrastructureLimit(s,a.player)-a.count)-(infrastructureLimit(s,b.player)-b.count)||cityVotes(s,b.position)-cityVotes(s,a.position));
 const upgrades=CITIES.filter(c=>canHQ(s,c.position)).sort((a,b)=>(cityVotes(s,b.position,p.id,'headquarters')-cityVotes(s,b.position))-(cityVotes(s,a.position,p.id,'headquarters')-cityVotes(s,a.position)));
 const winningHQ=upgrades.find(c=>votes+cityVotes(s,c.position,p.id,'headquarters')-cityVotes(s,c.position)>=target);
 if(winningHQ)return {type:'HQ',position:winningHQ.position};
 if(p.persona==='witte'&&threats.length&&rivals.length||p.persona==='anna'&&new Set(threats.map(x=>x.position)).size>=2)return {type:'INFRA_REMOVE',position:threats[0].position,target:threats[0].player};
 if(imminent)return {type:'INFRA_PLACE',position:imminent.position};
 if(threats[0]?.count===infrastructureLimit(s,threats[0]?.player)-1)return {type:'INFRA_REMOVE',position:threats[0].position,target:threats[0].player};
 if(p.persona==='stolypin'&&rivals.length>=2)return {type:'INFRA_PLACE',position:rivals[0].position};
 const hq=upgrades.find(c=>p.cash-c.headquarters_cost_million_rub>=300);
 if(hq)return {type:'HQ',position:hq.position};
 if(rivals[0])return {type:'INFRA_PLACE',position:rivals[0].position};
 if(threats[0])return {type:'INFRA_REMOVE',position:threats[0].position,target:threats[0].player};
 return {type:'END_TURN'};
}
export function canOffice(s,pos){const r=s.regions[pos],c=CITY_BY_ID[pos];if(!r||r.owner!==s.current||!c.regional_office_cost_million_rub||r.level==='regional_office'||current(s).cash<c.regional_office_cost_million_rub)return false;
 if(current(s).persona==='nicholas')return true;
 return CITIES.filter(x=>x.district_on_board===c.district_on_board).every(x=>s.regions[x.position]?.owner===s.current&&s.regions[x.position].level!=='base');
}
function advanceTurn(s){
 s.lastRoll=null;
 s.notice=null;
 const p=current(s);
 if(s.extraRoll&&!p.airportPending&&!p.jail&&!p.skip){s.extraRoll=false;s.phase='ready';s.decision=null;log(s,p.name+': дубль даёт дополнительный бросок.');return;}
 s.extraRoll=false;
 for(let i=0;i<s.players.length*2+1;i++){s.current=(s.current+1)%s.players.length;if(s.current===0)s.round++;const n=current(s);
  if(n.skip){n.skip--;log(s,n.name+' пропускает ход после встречи с президентом.');continue;}
  s.decision=null;s.phase=n.jail?'jailed':n.airportPending?'airport':'ready';return;
 }
 throw new Error('Не удалось передать ход.');
}
// A normal visit opens a finite clockwise response window. Detention and
// teleports from verdicts bypass arrive(), so they cannot start another window.
function offerCourtAccusation(s,queue,result=null){
 if(!queue.length||current(s).jail){
  done(s,result?.title||'Проверка завершена',result?.text||'Все соперники ответили. Кандидат остаётся на свободе и может завершить ход.');
  if(result)s.decision.verdict=result.verdict;
  return;
 }
 s.phase='decision';s.decision={kind:'courtAccusation',actor:queue[0],target:s.current,queue:[...queue],title:'Возможность обвинить',text:current(s).name+' на клетке «Судебное следствие». Выберите закрытую карту этого кандидата или откажитесь от иска.',...(result?{caseResult:result}:{})};
}

// Court resolution is shared by a normal turn and Kerensky's out-of-turn response.
// Replenishment is not a fresh Lawyer action: it cannot recurse into another case.
function resolveLawsuit(s,plaintiffId,target,index,{waiveCosts=false}={}){
 assert(index===0||index===1,'Выберите закрытую карту.');
 const plaintiff=s.players[plaintiffId],defendant=s.players[target];
 const c=LAWYERS.find(x=>x.id===defendant.hand[index]),roles={plaintiff,defendant},payer=roles[c.payer],payee=payer===plaintiff?defendant:plaintiff;
 const stalin=[plaintiff.persona,defendant.persona].includes('stalin');
 const waived=waiveCosts&&c.payer==='plaintiff',amount=waived?0:c.amount*(stalin?2:1);
 payer.cash-=amount;payee.cash+=amount;if(c.votes)roles[c.votes].bonusVotes++;
 if(c.jail)sendJail(s,roles[c.jail].id);if(stalin&&c.jail!=='defendant')sendJail(s,defendant.id);
 defendant.hand[index]=LAWYERS[Math.floor(Math.random()*LAWYERS.length)].id;
 const text=(waived?'Способность Хрущёва: повторные издержки не выплачиваются.':payer.name+' → '+payee.name+': '+money(amount)+'.')+(c.votes?' Ответчик получает +1% поддержки.':'')+(stalin?' Способность Сталина: двойная выплата, ответчик под следствием.':c.jail?' '+roles[c.jail].name+' отправляется под следствие.':' Без следствия.');
 log(s,'«'+c.name+'»: '+text);
 return {title:c.name,text,verdict:c.payer==='plaintiff'?'Истец проиграл':'Ответчик проиграл',paid:c.payer==='plaintiff'&&amount>0};
}
export function reduce(state,a){
 assert(state&&state.version===1,'Сохранение несовместимо.');const s=clone(state);s.transition=null;const p=current(s);
 if(a.type==='NEW_GAME')return newGame(a.options);
 assert(s.phase!=='finished','Партия уже завершена.');
 switch(a.type){
 case 'ROLL':{
  assert(s.phase==='ready','Сначала завершите текущее действие.');assert(Array.isArray(a.dice)&&a.dice.length===2&&a.dice.every(x=>Number.isInteger(x)&&x>=1&&x<=6),'Неверные кубики.');
  s.notice=null;s.lastDice=a.dice;s.lastRoll={player:p.id,round:s.round,dice:[...a.dice],purpose:'move'};s.extraRoll=a.dice[0]===a.dice[1];log(s,p.name+': '+a.dice.join(' + ')+' = '+(a.dice[0]+a.dice[1])+'.');
  const steps=a.dice[0]+a.dice[1];
  if(p.persona==='kolchak'&&steps<6){s.phase='decision';s.decision={kind:'moveChoice',title:'Решительный манёвр',text:'Удвоить число шагов или оставить обычный ход?',steps};}
  else{move(s,steps);arrive(s);}break;
 }
 case 'KOLCHAK_MOVE':{
  assert(s.phase==='decision'&&s.decision?.kind==='moveChoice'&&p.persona==='kolchak','Выбор манёвра недоступен.');
  assert(typeof a.double==='boolean','Выберите обычный или удвоенный ход.');
  const steps=s.decision.steps*(a.double?2:1);s.lastRoll.steps=steps;
  log(s,p.name+': '+(a.double?'удвоение':'обычный ход')+', '+steps+' шагов.');move(s,steps);arrive(s);break;
 }
 case 'AIRPORT':{
  assert(s.phase==='airport','Выбор направления сейчас недоступен.');assert(Number.isInteger(a.value)&&a.value>=1&&a.value<=6,'Неверный сектор.');
  const exit=EXITS[a.value-1];p.airportPending=false;s.extraRoll=false;s.lastRoll=null;log(s,p.name+': аэропорт → '+exit.name+'.');
  if(a.value<=4){p.position=exit.position;s.phase='ready';s.decision=null;s.lastExit=exit;s.notice='Идите через '+exit.name+'. Бросьте кубики.';}
  else if(a.value===5){teleport(s,p.id,24);arrive(s);}
  else {sendJail(s,p.id);done(s,'Судебное следствие','Вы отправлены под следствие. В следующий ход можно заплатить 250 млн ₽, попытаться выбросить дубль или ждать три хода.');}
  break;
 }
 case 'BUY':{
  assert(s.phase==='decision'&&s.decision?.kind==='city','Сейчас нельзя приобрести город.');const c=CITY_BY_ID[p.position];assert(!s.regions[p.position]&&p.cash>=c.acquisition_cost_million_rub,'Не хватает средств.');
  p.cash-=c.acquisition_cost_million_rub;s.regions[p.position]={owner:p.id,level:'base'};log(s,p.name+' закрепляет '+c.city+': '+money(c.acquisition_cost_million_rub)+'.');done(s,c.city+' поддерживает вас','Поддержка города: '+cityVotes(s,p.position)+'%. Доход за остановку соперника: '+money(c.levels.base.money_million_rub)+'.');checkVictory(s);break;
 }
 case 'HQ':{
  assert(s.phase==='decision'&&(['owncity'].includes(s.decision?.kind)||infrastructureTurn(s)),'Сейчас нельзя строить штаб.');assert(infrastructureTurn(s)||a.position===p.position,'Строительство доступно в текущем городе.');
  assert(canHQ(s,a.position),'Штаб недоступен.');const c=CITY_BY_ID[a.position];p.cash-=c.headquarters_cost_million_rub;s.regions[a.position].level='headquarters';
  log(s,p.name+' строит штаб в '+c.city+': '+money(c.headquarters_cost_million_rub)+'.');done(s,'Штаб открыт',c.city+': '+cityVotes(s,a.position)+'% поддержки всего.');checkVictory(s);break;
 }
 case 'INFRA_PLACE':{
  assert(canPlaceInfrastructure(s,a.position),'Разместить инфраструктуру можно на соответствующей клетке, в городе соперника.');
  const previous=s.decision,limit=infrastructureLimit(s),r=s.regions[a.position],c=CITY_BY_ID[a.position],previousOwner=r.owner;
  r.infrastructure??={};r.infrastructure[p.id]=(r.infrastructure[p.id]||0)+1;
  if(r.infrastructure[p.id]>=limit){
   r.owner=p.id;delete r.infrastructure[p.id];if(!Object.keys(r.infrastructure).length)delete r.infrastructure;
   log(s,p.name+' перехватывает '+c.city+' у '+s.players[previousOwner].name+'. Постройки города и инфраструктура остальных соперников сохранены.');
   done(s,'Город перешёл к вам',c.city+': '+cityVotes(s,a.position)+'% поддержки. '+(r.level==='base'?'Уровень влияния сохранён.':r.level==='headquarters'?'Штаб сохранён.':'Региональное отделение сохранено.')+' Ваша инфраструктура выполнена и убрана; объекты других кандидатов остаются.');
  }else{
   log(s,p.name+' бесплатно размещает инфраструктуру в '+c.city+': '+r.infrastructure[p.id]+'/'+limit+'.');
   done(s,'Инфраструктура размещена',c.city+': '+r.infrastructure[p.id]+'/'+limit+' ваших объектов. Владелец города: '+s.players[r.owner].name+'.');
  }
  extraInfrastructure(s,previous,'place',a.position);
  break;
 }
 case 'INFRA_REMOVE':{
  assert(canRemoveInfrastructure(s,a.position,a.target),'Можно убрать один чужой объект только из собственного города на клетке «Инфраструктура».');
  const previous=s.decision,r=s.regions[a.position],c=CITY_BY_ID[a.position];r.infrastructure[a.target]--;
  if(!r.infrastructure[a.target])delete r.infrastructure[a.target];if(!Object.keys(r.infrastructure).length)delete r.infrastructure;
  log(s,p.name+' бесплатно убирает один объект '+s.players[a.target].name+' из '+c.city+'.');
  done(s,'Объект убран',c.city+': осталось '+(r.infrastructure?.[a.target]||0)+'/'+infrastructureLimit(s,a.target)+' объектов кандидата '+s.players[a.target].name+'.');extraInfrastructure(s,previous,'remove',a.position);break;
 }
 case 'OFFICE':{
  assert(s.phase==='decision'&&s.decision?.kind==='owncity'&&p.position===a.position,'Отделение доступно при остановке в своей столице.');assert(canOffice(s,a.position),'Условия отделения не выполнены.');
  const c=CITY_BY_ID[a.position];p.cash-=c.regional_office_cost_million_rub;s.regions[a.position].level='regional_office';log(s,p.name+' открывает региональное отделение в '+c.city+'.');done(s,'Региональное отделение',c.city+': '+cityVotes(s,a.position)+'% поддержки всего.');checkVictory(s);break;
 }
 case 'SWAN_PASS':{
  assert(s.phase==='decision'&&s.decision?.kind==='swan'&&p.persona==='milyukov'&&s.decision.recipient===undefined,'Передача события недоступна.');
  assert(Number.isInteger(a.target)&&s.players[a.target]&&a.target!==p.id,'Выберите другого кандидата.');
  s.decision.recipient=a.target;log(s,p.name+' передаёт «'+s.decision.card.name+'» кандидату '+s.players[a.target].name+'.');break;
 }
 case 'SWAN':{
  assert(s.phase==='decision'&&s.decision?.kind==='swan','Нет карты события.');const recipient=s.players[actionPlayerId(s)],c=s.decision.card,f=recipient.persona==='catherine'?2:1;
  if(c.penalty){
   const reverse=recipient.persona==='catherine_i',n=c.penalty;let text;
   if(a.accept===false){
    if(reverse){recipient.bonusVotes+=n.votes;text='+'+n.votes+'% поддержки благодаря способности Екатерины I.';}
    else{(recipient.swanDebts??=[]).push(c.id);text='−'+n.votes+'% поддержки до уплаты. Поздняя оплата: '+money(n.cash*2)+'. Откройте «Карты» в свой ход.';}
   }else{assert(reverse||recipient.cash>=n.cash,'Не хватает средств.');recipient.cash+=reverse?n.cash:-n.cash;text=(reverse?'+':'−')+money(n.cash)+(reverse?' благодаря способности Екатерины I.':'. Поддержка сохранена.');}
   log(s,c.name+': '+recipient.name+', '+text);done(s,c.name,recipient.name+': '+text);break;
  }
  if(a.accept===false){assert(c.cost,'Эту карту нужно выполнить.');done(s,'Средства сохранены',recipient.name+' отказывается от дополнительных вложений.');break;}
  assert(!c.cost||recipient.cash>=c.cost*f,'Не хватает средств.');recipient.cash+=(c.cash||0)*f-(c.cost||0)*f;recipient.bonusVotes+=(c.votes||0)*f;
  const details=[c.cash?'+'+money(c.cash*f):'',c.cost?'−'+money(c.cost*f):'',c.votes?'+'+c.votes*f+'% поддержки':''].filter(Boolean).join(' · ');
  log(s,c.name+': '+recipient.name+', '+details+'.');done(s,c.name,(recipient.id!==p.id?recipient.name+': ':'')+details+(f===2?' · Способность Екатерины II.':''));checkVictory(s);break;
 }
 case 'SWAN_SETTLE':{
  assert(canSettleSwan(s,a.index),'Оплата доступна в свой ход перед броском или после завершения действия, если хватает средств.');
  const c=SWAN.find(x=>x.id===p.swanDebts[a.index]);p.cash-=c.penalty.cash*2;p.swanDebts.splice(a.index,1);
  log(s,p.name+' оплачивает «'+c.name+'»: '+money(c.penalty.cash*2)+'. Штраф поддержки снят.');break;
 }
 case 'TRAVEL':{
  assert(s.phase==='decision'&&s.decision?.kind==='travel','Нет карты командировки.');const c=s.decision.card;log(s,'Командировка «'+c.name+'».');
  if(c.id==='humility'){s.transition={id:++s.serial,player:s.current,path:[0],from:p.position,to:0,startPasses:0};p.position=0;p.airportPending=false;done(s,'Возвращение на старт','Выплата за круг не начисляется.');break;}
  if(c.id==='luck'){
   let steps=Array.from({length:48},(_,i)=>i+1).find(n=>CITY_BY_ID[(p.position+n)%48]&&!s.regions[(p.position+n)%48]);
   if(steps){move(s,steps);if(s.phase==='finished')break;s.regions[p.position]={owner:p.id,level:'base'};done(s,'Удача',CITY_BY_ID[p.position].city+' теперь поддерживает вас. Вложение не требуется.');log(s,p.name+' получает '+CITY_BY_ID[p.position].city+' бесплатно.');checkVictory(s);}
   else{let previous=p.position;do{previous=(previous+47)%48;}while(!AIRPORTS.includes(previous));teleport(s,p.id,previous);arrive(s);}break;
  }
  const steps=Array.from({length:48},(_,i)=>i+1).find(n=>TILE_BY_ID[(p.position+n)%48]?.kind==='infra');move(s,steps);arrive(s);break;
 }
 case 'LAW_SWAP':{
  assert(s.phase==='decision'&&s.decision?.kind==='lawyer','Замена доступна на клетке «Юрист».');assert(a.index===0||a.index===1,'Выберите карту.');const choices=LAWYERS.filter(x=>!p.hand.includes(x.id));const card=choices[Math.floor(Math.random()*choices.length)];p.hand[a.index]=card.id;done(s,'Карта заменена','Новая карта: «'+card.name+'». Её исход может определить дело против вас.');log(s,p.name+' заменяет карту «Юрист».');
  const responder=s.players.find(x=>x.persona==='kerensky'&&x.id!==p.id&&!x.jail);
  if(responder)s.decision={kind:'reaction',actor:responder.id,target:p.id,title:'Ответный иск Керенского',text:p.name+' заменяет карту «Юрист». '+responder.name+' может предъявить немедленный иск или отказаться.'};
  break;
 }
 case 'LAW_SUE':{
  assert(s.phase==='decision'&&['lawyer','lawyerSecond'].includes(s.decision?.kind),'Иск сейчас недоступен.');
  const d=s.decision,target=a.target??lawsuitTargets(s)[0]?.id;
  assert(lawsuitTargets(s).some(x=>x.id===target),'Выберите другого кандидата, против которого ещё не было иска.');
  const result=resolveLawsuit(s,p.id,target,a.index,{waiveCosts:!!d.costsPaid});
  done(s,result.title,result.text);s.decision.verdict=result.verdict;
  if(p.persona==='khrushchev'&&d.kind==='lawyer'&&s.players.length>2&&!p.jail){s.decision={...s.decision,kind:'lawyerSecond',accused:[target],costsPaid:result.paid};}
  checkVictory(s);break;
 }
 case 'COURT_RESPONSE':{
  assert(s.phase==='decision'&&s.decision?.kind==='courtAccusation','Нет предложения обвинить на судебной клетке.');
  const d=s.decision;assert(typeof a.accept==='boolean','Выберите: обвинить или отказаться.');
  assert(d.target===s.current&&d.actor!==d.target&&d.queue[0]===d.actor&&!p.jail,'Предложение обвинения уже недоступно.');
  if(!a.accept){log(s,s.players[d.actor].name+' отказывается от иска к '+p.name+'.');offerCourtAccusation(s,d.queue.slice(1));}
  else{const result=resolveLawsuit(s,d.actor,d.target,a.index);offerCourtAccusation(s,d.queue.slice(1),result);}
  break;
 }
 case 'KERENSKY_RESPONSE':{
  assert(s.phase==='decision'&&s.decision?.kind==='reaction','Нет ответного иска.');
  const d=s.decision;
  if(a.accept===false){log(s,s.players[d.actor].name+' отказывается от ответного иска.');done(s,'Карта заменена','Ответный иск не предъявлен. Можно завершить ход.');}
  else{assert(a.accept===true,'Выберите ответ на замену карты.');const result=resolveLawsuit(s,d.actor,d.target,a.index);done(s,result.title,result.text);s.decision.verdict=result.verdict;}
  checkVictory(s);break;
 }
 case 'LENIN_CONTINUE':assert(s.phase==='jailed'&&p.persona==='lenin','Эта способность сейчас недоступна.');s.lastRoll=null;releaseInvestigation(s,'Выход из-под следствия бесплатно — способность Ленина.');break;
 case 'JAIL_PAY':assert(s.phase==='jailed','Кандидат не под следствием.');assert(p.cash>=250,'Недостаточно средств для выхода.');p.cash-=250;s.lastRoll=null;releaseInvestigation(s,'Уплачено в казну 250 млн ₽. Следствие завершено.');break;
 case 'JAIL_TRY':{
  assert(s.phase==='jailed','Кандидат не под следствием.');assert(Array.isArray(a.dice)&&a.dice.length===2&&[...a.dice].every(x=>Number.isInteger(x)&&x>=1&&x<=6),'Неверные кубики.');s.lastDice=[...a.dice];s.lastRoll={player:p.id,round:s.round,dice:[...a.dice],purpose:'jail'};
  if(a.dice[0]===a.dice[1])releaseInvestigation(s,'Дубль '+a.dice.join(' + ')+': выход из-под следствия без оплаты.');
  else waitInvestigation(s,a.dice);break;
 }
 case 'JAIL_WAIT':assert(s.phase==='jailed','Ожидание сейчас недоступно.');s.lastRoll=null;waitInvestigation(s);break;
 case 'END_TURN':assert(s.phase==='decision'&&!['swan','travel','moveChoice','reaction','courtAccusation'].includes(s.decision?.kind),'Сначала выполните карту.');advanceTurn(s);break;
 default:throw new Error('Неизвестное действие.');
 }
 checkVictory(s);return s;
}
export function scenario(kind,options={}){
 if(kind==='court-visit'){
  const s=newGame({players:['nicholas','catherine','lenin','stalin'].map(persona=>({persona,bot:false}))});
  s.scenario=kind;s.round=4;s.players[0].position=7;s.players[0].hand=['clean','false-votes'];
  return reduce(s,{type:'ROLL',dice:[2,3]});
 }

 if(['catherine_i','anna','witte','stolypin','kirov','trotsky'].includes(kind)){
  const s=newGame({players:[kind,'nicholas','lenin'].map(persona=>({persona,bot:false}))});s.scenario=kind;s.round=4;
  if(kind==='catherine_i'){s.players[0].position=4;s.phase='decision';s.decision={kind:'swan',card:SWAN.find(c=>c.id==='blizzard')};return s;}
  s.players[0].position=16;
  s.regions={1:{owner:0,level:'base',infrastructure:{1:1}},3:{owner:0,level:'base',infrastructure:{1:2}},5:{owner:1,level:'headquarters',infrastructure:{0:kind==='trotsky'?1:2,2:1}},15:{owner:0,level:'headquarters'},19:{owner:1,level:'base'}};
  arrive(s);return s;
 }
 if(kind==='infrastructure'){
  const s=newGame({players:['catherine','nicholas','lenin','stalin','elizabeth','brezhnev'].map(persona=>({persona,bot:false}))});s.scenario=kind;s.round=7;
  s.players.forEach((p,i)=>{p.position=[16,1,19,39,7,27][i];p.cash=2400;});
  s.regions={1:{owner:1,level:'regional_office'},3:{owner:1,level:'headquarters'},5:{owner:1,level:'headquarters',infrastructure:{0:2,2:1}},15:{owner:0,level:'base',infrastructure:{1:2,3:1,4:1}},17:{owner:0,level:'base'},19:{owner:2,level:'headquarters'},39:{owner:3,level:'headquarters'}};
  arrive(s);log(s,'Инфраструктура: разные кандидаты ведут отдельные кампании. Екатерина может перехватить Ярославль третьим объектом.');return s;
 }
 if(['lawyer-deck','swan-deck','swan-blizzard','travel-deck'].includes(kind)){
  const s=newGame({players:['nicholas','catherine','lenin','stalin'].map(persona=>({persona,bot:false}))});s.scenario=kind;s.round=7;
  s.players[0].cash=2400;s.players[0].bonusVotes=20;
  s.players[1].hand=['unproven','false-votes'];
  if(kind==='lawyer-deck'){s.players[0].position=2;arrive(s);}
  if(['swan-deck','swan-blizzard'].includes(kind)){s.players[0].position=4;s.phase='decision';s.decision={kind:'swan',card:SWAN.find(c=>c.id===(kind==='swan-blizzard'?'blizzard':'debates'))};}
  if(kind==='travel-deck'){s.players[0].position=22;s.phase='decision';s.decision={kind:'travel',card:TRAVEL.find(c=>c.id==='industry')};}
  return s;
 }
 if(['kolchak','milyukov','khrushchev','kerensky'].includes(kind)){
  const heroes=kind==='kerensky'?['nicholas','kerensky','kolchak']: [kind,...['catherine','nicholas','lenin'].filter(id=>id!==kind)];
  let s=newGame({players:heroes.map(persona=>({persona,bot:false}))});s.scenario=kind;
  if(kind==='kolchak')return reduce(s,{type:'ROLL',dice:[2,3]});
  if(kind==='milyukov'){s.players[0].position=4;s.phase='decision';s.decision={kind:'swan',card:SWAN.find(c=>c.id==='debates')};return s;}
  s.players[0].position=2;s.phase='decision';s.decision={kind:'lawyer',title:'Юрист',text:'Проверка способности на клетке «Юрист».'};
  if(kind==='kerensky')return reduce(s,{type:'LAW_SWAP',index:0});
  s.players[1].hand[0]='unproven';s.players[2].hand[0]='unproven';return s;
 }

 const s=newGame(kind==='multiplayer'?{players:['catherine','nicholas','lenin','stalin'].map(persona=>({persona,bot:false}))}:options);s.scenario=kind;
 if(kind==='multiplayer'){
  const ownership=[[[1,'headquarters'],[3,'headquarters'],[5,'base'],[45,'headquarters']],[[15,'headquarters'],[17,'headquarters'],[13,'headquarters'],[11,'regional_office'],[7,'base'],[9,'base']],[[31,'headquarters'],[33,'headquarters'],[35,'headquarters'],[19,'base'],[21,'base'],[23,'base']],[[25,'headquarters'],[27,'headquarters'],[29,'headquarters'],[37,'headquarters'],[39,'headquarters'],[41,'headquarters']]];
  ownership.forEach((cities,owner)=>cities.forEach(([position,level])=>s.regions[position]={owner,level}));
  s.players.forEach((p,i)=>{p.position=[5,15,21,39][i];p.cash=[2400,1800,1600,2100][i];});
  s.lastDice=[2,3];s.lastRoll={player:0,round:s.round,dice:[2,3],purpose:'move'};arrive(s);log(s,'Екатерина II: 2 + 3 = 5. Прибыла в свой Ярославль.');
 }
 if(kind==='airport'){s.players[0].position=6;s.players[0].airportPending=true;s.phase='airport';log(s,'Сценарий: точная остановка в аэропорту. Наступил следующий ход.');}
 if(kind==='yaroslavl'){s.players[0].position=5;s.regions[5]={owner:0,level:'base'};arrive(s);log(s,'Сценарий: Ярославль даёт 1% поддержки. Штаб стоит 250 млн ₽.');}
 if(kind==='rent'){s.players[0].position=5;s.regions[5]={owner:1,level:'headquarters'};arrive(s);log(s,'Сценарий: остановка в городе соперника со штабом.');}
 return s;
}

