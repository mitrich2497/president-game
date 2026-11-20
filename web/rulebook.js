import {icon,portrait} from './view.js';
import {referenceCorners,referenceTexture} from './reference-art.js';
import {palaceFlourish} from './palace-art.js';
import {CITY_BY_ID,PERSONAS,SWAN,money} from './engine.js';
import {CITY_ICON_ASSETS,DESIGN_ASSETS} from './design-assets.js';
import {FACTIONS,factionEmblem,factionOf} from './factions.js';


const RB_CRAFT_OBJECTS={people:0,dice:1,coins:2,cards:3,flag:4,hq:5,airport:6,scales:7};
function rbIcon(name){
 if(!Object.hasOwn(RB_CRAFT_OBJECTS,name))return icon(name);
 const n=RB_CRAFT_OBJECTS[name],u=443.5;
 return '<svg class="ui-icon rb-object" viewBox="'+((n%4)*u)+' '+(Math.floor(n/4)*u)+' '+u+' '+u+'" aria-hidden="true"><image href="./assets/rulebook-v35/objects.png" width="1774" height="887"/></svg>';
}
function rbStudy(){return '<div class="rb-study" data-rule-decorative><img src="./assets/rulebook-v35/study.png" alt="" draggable="false"><span>История · Стратегия · Влияние</span></div>';}
function rbGoalRibbon(){return '<div class="rb-goal-ribbon" data-rule-decorative>'+rbIcon('people')+'<strong>Поддержка</strong><i>ИЛИ</i>'+rbIcon('coins')+'<strong>15 млрд ₽</strong><span>Достигните одной цели, чтобы победить</span></div>';}
function rbCityOverview(){
 const y=CITY_BY_ID[5],m=CITY_BY_ID[1];
 return '<div class="rb-city-overview rb-wide-only">'+
 '<section class="rb-overview-hq"><h4 class="rb-ribbon">Пример: Ярославль</h4><div class="rb-comparison">'+rbCity(5)+'<div class="rb-upgrade"><span>Постройка</span><strong>'+money(y.headquarters_cost_million_rub)+'</strong>'+rbArrow()+'</div>'+rbCity(5,{level:'headquarters'})+'</div><div class="rb-overview-facts"><span>Первое вложение: <b>500 млн ₽</b></span><strong>2% — всего, не +2%</strong></div></section>'+
 '<aside class="rb-overview-payment"><h4 class="rb-ribbon">Только при остановке соперника</h4><div class="rb-payment-flow"><div>'+portrait('stalin')+'<span>Посетитель</span></div>'+rbArrow()+rbIcon('coins')+rbArrow()+'<div>'+portrait('nicholas')+'<span>Владелец</span></div></div><strong class="rb-ribbon">500 млн ₽</strong><p>Деньги получает владелец города.</p></aside>'+
 '<section class="rb-overview-office"><h4 class="rb-ribbon">Региональное отделение</h4><div class="rb-office-showcase"><div class="rb-office-required"><div class="rb-three-cities">'+[1,3,5].map(pos=>rbCity(pos,{level:'headquarters',stats:false})).join('')+'</div><p>✓ Штабы во всех трёх городах<br>+ остановка в своей столице</p></div>'+rbArrow()+'<div class="rb-office-result">'+rbCity(1,{level:'regional_office'})+'<span class="rb-ribbon">Постройка: '+money(m.regional_office_cost_million_rub)+'</span></div><aside class="rb-office-exception">'+portrait('nicholas')+'<strong>Николай II: можно раньше, цена сохраняется</strong><p>В Ярославле отделение недоступно.</p></aside></div></section></div>';
}
const RB_PAGE_TITLES={preparation:['От первого выбора — к кампании','Герой и цель кампании'],turn:['Один ход — четыре шага','Особые клетки'],cities:['Города: влияние, штаб, отделение','Региональное отделение','Кому поступают деньги'],infrastructure:['Ваш ход — ваш выбор','Как перехватить город','Защитите своё влияние'],airport:['Одна клетка — четыре маршрута','Куда продолжится путь?','Два особых исхода','Как считать шаги'],cards:['Судебный вердикт','Неожиданный поворот','Пора в дорогу'],abilities:['Императрицы','Российская империя','Революция','СССР'],victory:['Два пути к победе','Как считается результат']};
let ruleSearchIndex;
export function ruleSearchResults(query=''){
 const q=String(query).trim().toLocaleLowerCase('ru').replaceAll('ё','е');
 if(!q)return RULE_CHAPTERS.map(c=>({chapter:c.id,page:0,hero:0,title:c.pages[0],section:c.title}));
 const rows=ruleSearchIndex??=RULE_CHAPTERS.flatMap(c=>c.pages.flatMap((title,page)=>{
  const heroes=c.id==='abilities'?Object.keys(PERSONAS).filter(id=>factionOf(PERSONAS[id])===Object.keys(FACTIONS)[page]):[null];
  return heroes.map((id,hero)=>({chapter:c.id,page,hero,title:id?PERSONAS[id].name:title,section:c.title,text:(c.title+' '+title+' '+rbBody(c.id,page,hero).replace(/<div class="rb-hero-picker"[\s\S]*?<section/, '<section').replace(/<[^>]*>/g,' ')).toLocaleLowerCase('ru').replaceAll('ё','е')}));
 }));
 const found=rows.filter(r=>q.split(/\s+/).every(w=>r.text.includes(w)));
 return found.slice(0,8).map(r=>({chapter:r.chapter,page:r.page,hero:r.hero,title:r.title,section:r.section}));
}
export function ruleSearchMarkup(query=''){
 const found=ruleSearchResults(query);
 return found.length?found.map(r=>'<button data-action="ruleChapter" data-chapter="'+r.chapter+'" data-rule-page="'+r.page+'" data-hero-index="'+r.hero+'"><strong>'+r.section+'</strong><span>'+r.title+' →</span></button>').join(''):'<p>Нет совпадений. Попробуйте «штаб», «перехват» или «аэропорт».</p>';
}

export const RULE_CHAPTERS=[
 {id:'preparation',title:'Подготовка',icon:'list',pages:['Участники','Начало партии']},
 {id:'turn',title:'Ход игрока',icon:'dice',pages:['Четыре шага','Особые клетки']},
 {id:'cities',title:'Города и развитие',icon:'flag',pages:['Штаб','Отделение','Платежи']},
 {id:'infrastructure',title:'Инфраструктура',icon:'hq',pages:['Действия','Перехват','Защита']},
 {id:'airport',title:'Аэропорт',icon:'airport',pages:['Пересадка','Маршруты','5–6','Примеры']},
 {id:'cards',title:'Карты',icon:'cards',pages:['Юрист','Чёрный лебедь','Командировка']},
 {id:'abilities',title:'Способности',icon:'crown',pages:['Императрицы','Империя','Революция','СССР']},
 {id:'victory',title:'Победа',icon:'crown',pages:['Две цели','Подсчёт']}
];
export function ruleLocation(chapter='cities',page=0){
 const index=Math.max(0,RULE_CHAPTERS.findIndex(c=>c.id===chapter)),c=RULE_CHAPTERS[index],n=Number(page);
 return {chapter:c.id,page:Number.isFinite(n)?Math.max(0,Math.min(c.pages.length-1,Math.floor(n))):0,index};
}
export function ruleStep(chapter,page,direction){
 const loc=ruleLocation(chapter,page),c=RULE_CHAPTERS[loc.index],next=loc.page+(direction<0?-1:1);
 if(next>=0&&next<c.pages.length)return {...loc,page:next};
 const index=loc.index+(direction<0?-1:1);
 if(index<0||index>=RULE_CHAPTERS.length)return loc;
 return {chapter:RULE_CHAPTERS[index].id,page:direction<0?RULE_CHAPTERS[index].pages.length-1:0,index};
}
const rbArt=(src,cls='')=>'<img class="rb-art '+cls+'" src="'+src+'" alt="" draggable="false">';
const rbNote=(text,symbol='info')=>'<div class="rb-note">'+rbIcon(symbol)+'<span>'+text+'</span></div>';
const rbNumber=(n,label,symbol='coins')=>'<div class="rb-number">'+rbIcon(symbol)+'<strong>'+n+'</strong><span>'+label+'</span></div>';
const rbPanel=(heading,body,cls='')=>'<section class="rb-panel '+cls+'">'+referenceCorners()+'<h4>'+heading+'</h4>'+body+'</section>';
const rbArrow=()=>'<span class="rb-arrow" aria-hidden="true">→</span>';
const rbFlag=(text,office=false,color='green')=>'<span class="rb-flag '+(office?'raised':'')+' '+color+'"><i></i><b>'+text+'</b></span>';
function rbCity(position,{level='base',owner='Н II',color='blue',stats=true,persona=null}={}){
 const c=CITY_BY_ID[position],l=c.levels[level],src=position===5?'./assets/reference-v30/yaroslavl-panorama.png':position===1?'./assets/reference-v16/moscow-panorama.png':CITY_ICON_ASSETS[position];
 return '<div class="rb-city '+level+'">'+rbArt(src)+(persona?'<div class="rb-owner-portrait">'+portrait(persona)+'</div>':'')+'<div class="rb-city-caption"><h4>'+c.city+'</h4>'+(level==='base'?'<span class="rb-owner '+color+'">'+owner+'</span>':rbFlag(owner,level==='regional_office',color))+'<span class="rb-tier">'+({base:'Влияние',headquarters:'Штаб',regional_office:'Отделение'}[level])+'</span></div>'+(stats?'<div class="rb-city-stats"><span>'+rbIcon('people')+'<b>'+l.votes_percent+'%</b><small>всего</small></span><span>'+rbIcon('coins')+'<b>'+money(l.money_million_rub)+'</b><small>за остановку</small></span></div>':'')+'</div>';
}
function rbPips(n){const spots={1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]}[n];return '<span class="rb-die" role="img" aria-label="Кубик: '+n+'">'+Array.from({length:9},(_,i)=>'<i class="'+(spots.includes(i+1)?'pip':'')+'"></i>').join('')+'</span>';}
function rbInfraRow(owner,count,color='green',max=3){return '<div class="rb-infra-row '+color+'"><b>'+owner+'</b><span class="rb-objects">'+Array.from({length:max},(_,i)=>'<i class="'+(i<count?'filled':'')+'">'+rbIcon('hq')+'</i>').join('')+'</span><strong>'+count+'/'+max+'</strong></div>';}
function rbPreparation(page){
 if(page===0)return '<div class="rb-prep-grid">'+rbStudy()+rbPanel('01 · Соберите участников',rbNumber('2–6','игроков','people')+'<p>С друзьями по ссылке, на одном устройстве или против компьютера.</p>')+rbPanel('02 · Выберите героев','<div class="rb-factions">'+Object.entries(FACTIONS).map(([id,f])=>'<div>'+factionEmblem(id)+'<span>'+f.name+'</span><b>4</b></div>').join('')+'</div>')+rbPanel('03 · Получите ресурсы',rbNumber('2 млрд ₽','каждому участнику')+'<div class="rb-mini-cards">'+rbIcon('cards')+'<b>2 карты «Юрист»</b><span>Закрытые</span></div>')+rbPanel('04 · Начните кампанию','<div class="rb-start">'+rbIcon('flag')+'<b>СТАРТ</b><span>1 → 2 → 3 → 4 → …</span></div><p>Первый участник начинает. Далее — по порядку мест.</p>')+rbGoalRibbon()+'</div>';
 return '<div class="rb-two">'+rbPanel('Ваша личность','<div class="rb-face-row">'+['catherine','nicholas','lenin'].map(p=>portrait(p)).join('')+'</div><strong class="rb-display">16 героев · 4 фракции</strong><p>Просмотр героя не меняет состав: подтвердите назначение.</p>')+rbPanel('Ваша цель',rbNumber('51 / 41 / 31%','порог зависит от числа игроков','people')+'<span class="rb-or">ИЛИ</span>'+rbNumber('15 млрд ₽','накопленный бюджет'),'rb-goal-preview')+'</div>'+rbNote('Начальные ресурсы одинаковы. Способность героя действует и у компьютера.','crown');
}
function rbTurn(page){
 if(page===0)return '<div class="rb-turn-grid">'+
 rbPanel('01 · Бросок','<div class="rb-dice">'+rbPips(2)+rbPips(3)+'</div><strong class="rb-display">2 + 3 = 5 шагов</strong>')+
 rbPanel('02 · Движение','<div class="rb-track">'+['00','01','02','03','04','05'].map((n,i)=>'<span class="'+(i===5?'active':'')+'">'+n+'</span>').join('')+'</div><p>По возрастанию номеров.</p><div class="rb-pill">'+rbIcon('flag')+' Старт: +1 млрд ₽</div>')+
 rbPanel('03 · Клетка','<div class="rb-action-icons">'+rbIcon('flag')+rbIcon('cards')+rbIcon('coins')+'</div><strong class="rb-display">Выполните действие</strong><p>Покупка, стройка, выплата или событие.</p>')+
 rbPanel('04 · Очередь','<div class="rb-face-row">'+portrait('catherine')+rbArrow()+portrait('nicholas')+'</div><p>Завершите ход. Дубль даёт ещё один бросок.</p>')+'</div>'+rbNote('Точная остановка в аэропорту завершает ход даже при дубле.','airport');
 return '<div class="rb-special-grid">'+rbPanel('Аэропорт',rbArt(DESIGN_ASSETS.airport)+'<p>Точная остановка → конец хода. Колесо — в следующий ход.</p>')+rbPanel('Президент',rbArt(DESIGN_ASSETS.president)+'<p>Пропустите следующий ход. У Ленина — без пропуска.</p>')+rbPanel('Следствие','<div class="rb-justice">'+rbIcon('scales')+'</div><div class="rb-options"><b>250 млн ₽</b><span>или дубль</span><span>или 3 хода</span></div><p>Ленин выходит бесплатно.</p>')+'</div>'+rbNote('Обычная остановка: соперники по очереди могут выбрать вашу закрытую карту «Юрист» или отказаться. Под следствие отправляет исход суда; сам визит не лишает хода.','scales');
}
function rbCities(page){
 const y=CITY_BY_ID[5],m=CITY_BY_ID[1];
 if(page===0)return rbCityOverview()+'<div class="rb-comparison">'+rbCity(5)+'<div class="rb-upgrade">'+rbIcon('flag')+'<span>Постройка</span><strong>'+money(y.headquarters_cost_million_rub)+'</strong>'+rbArrow()+'</div>'+rbCity(5,{level:'headquarters'})+'</div><div class="rb-two rb-short">'+rbPanel('Первое вложение','<strong class="rb-display">'+money(y.acquisition_cost_million_rub)+'</strong><p>Стоимость покупки Ярославля.</p>')+rbPanel('Голоса города','<strong class="rb-display">1% → 2%</strong><p><b>2% — всего, а не дополнительно.</b></p>')+'</div>'+rbNote('Штаб — в своём городе без чужой инфраструктуры. Николай II может открыть отделение раньше в столице округа.','flag');
 if(page===1)return '<div class="rb-office-layout"><div class="rb-prerequisites">'+rbPanel('Штабы в трёх городах','<div class="rb-three-cities">'+[1,3,5].map(pos=>rbCity(pos,{level:'headquarters',stats:false})).join('')+'</div>')+rbNote('Остановитесь в своей столице округа.','airport')+rbNote('Николай II: можно без остальных городов и штабов. Цена сохраняется.','crown')+'</div>'+rbCity(1,{level:'regional_office'})+'</div><div class="rb-costline"><span>Отделение в Москве</span><strong>'+money(m.regional_office_cost_million_rub)+'</strong></div>'+rbNote('Отделение строится в столице округа. В Ярославле оно недоступно.','flag');
 return '<div class="rb-payment">'+rbPanel('Посетитель',portrait('catherine')+'<strong>Соперник</strong>')+'<div class="rb-pay-arrow">'+rbIcon('coins')+'<b>'+money(y.levels.headquarters.money_million_rub)+'</b>'+rbArrow()+'</div>'+rbPanel('Владелец',portrait('nicholas')+'<strong>Ваша кампания</strong>')+'</div>'+rbPanel('Ярославль со штабом','<div class="rb-two-stats">'+rbNumber('2%','голоса города','people')+rbNumber('500 млн ₽','плата соперника')+'</div>')+rbNote('Деньги поступают только при остановке соперника. Автоматического дохода каждый ход нет.','coins');
}
function rbInfrastructure(page){
 if(page===0)return '<div class="rb-special-grid">'+rbPanel('Разместить',rbInfraRow('Е II',1)+'<strong class="rb-display">Бесплатно</strong><p>Один ваш объект в городе соперника.</p>')+rbPanel('Удалить',rbInfraRow('Н II',1,'blue')+'<strong class="rb-display">Бесплатно</strong><p>Один чужой объект из своего города.</p>')+rbPanel('Построить штаб','<div class="rb-flag-demo">'+rbFlag('Е II')+'</div><strong class="rb-display">Половина цены города</strong><p>В своём городе без чужих объектов.</p>')+'</div>'+rbNote('Одна остановка — одно действие. Способности дают необязательное дополнительное действие.','hq');
 if(page===1)return '<div class="rb-capture"><section class="rb-panel rb-capture-before">'+rbCity(5,{level:'headquarters',stats:false,persona:'nicholas'})+'<span class="rb-caption">Владелец: Николай II</span>'+rbInfraRow('Е II',3)+rbInfraRow('В Л',1,'red')+'</section><div class="rb-capture-arrow">'+rbArrow()+'<b>Третий ваш объект</b></div><section class="rb-panel rb-capture-after">'+rbCity(5,{level:'headquarters',owner:'Е II',color:'green',stats:false,persona:'catherine'})+'<span class="rb-caption">Теперь: Екатерина II</span>'+rbInfraRow('В Л',1,'red')+'<div class="rb-success">✓ Штаб сохранён</div></section></div><div class="rb-retain"><span>Ваши объекты убраны</span><span>Чужие остаются</span></div>'+rbNote('3 ваших → перехват. Троцкому достаточно 2.','flag');
 return rbPanel('Счётчик каждого застройщика',rbInfraRow('Е II',2)+rbInfraRow('В Л',1,'red')+'<strong class="rb-equation"><i class="green">2</i> + <i class="red">1</i> ≠ <i class="green">3</i></strong><p>Два ваших и один чужой не дают перехват.</p>')+'<div class="rb-two">'+rbPanel('Защитите город','<p>Бесплатно удалите один чужой объект из своего города.</p>')+rbPanel('Исключение: Киров','<p>В его городах СЗФО новые чужие объекты запрещены. Уже стоящие сохраняются.</p>')+'</div>'+rbNote('Инфраструктура — отдельный счётчик, а не уровень «штаб → отделение».','hq');
}
function rbCompass(){
 const names=['УФО','СФО','СКФО','ПФО','Президент','Следствие'],colors=['#264e32','#193e68','#45315b','#682b45','#6c4925','#343f40'];
 const point=(r,a)=>[180+r*Math.cos(a*Math.PI/180),180+r*Math.sin(a*Math.PI/180)];
 const ticks=Array.from({length:120},(_,i)=>{const a=point(i%5===0?158:162,i*3),b=point(168,i*3);return '<path d="M'+a.join(' ')+'L'+b.join(' ')+'" stroke="#f4d493" stroke-width="'+(i%5===0?1.3:.6)+'"/>';}).join('');
 return '<svg viewBox="0 0 360 360" class="rb-compass" role="img" aria-label="Колесо: шесть равновероятных исходов"><defs><linearGradient id="rb-metal" x2=".8" y2="1"><stop stop-color="#fff2b8"/><stop offset=".2" stop-color="#8a5e28"/><stop offset=".4" stop-color="#ffe9a7"/><stop offset=".7" stop-color="#a77933"/><stop offset="1" stop-color="#ffe7a0"/></linearGradient><radialGradient id="rb-dial"><stop stop-color="#001710" stop-opacity=".8"/><stop offset=".65" stop-color="#061b11" stop-opacity=".08"/><stop offset="1" stop-color="#000d09" stop-opacity=".7"/></radialGradient><pattern id="rb-stone-pattern" patternUnits="userSpaceOnUse" width="360" height="360"><image href="./assets/rulebook-v35/malachite.png" width="360" height="360"/></pattern></defs><circle cx="180" cy="180" r="176" fill="#102b21" stroke="url(#rb-metal)" stroke-width="7"/>'+names.map((name,i)=>{
  const a=-120+i*60,b=a+60,p=point(168,a),q=point(168,b),t=point(112,a+30);
  return '<path d="M180 180L'+p.join(' ')+'A168 168 0 0 1 '+q.join(' ')+'Z" fill="'+colors[i]+'" stroke="url(#rb-metal)" stroke-width="2"/>';
 }).join('')+'<circle cx="180" cy="180" r="167" fill="url(#rb-stone-pattern)" opacity=".18"/><circle cx="180" cy="180" r="167" fill="url(#rb-dial)"/>'+ticks+names.map((name,i)=>{const t=point(111,-90+i*60);return '<text x="'+t[0]+'" y="'+(t[1]-6)+'" text-anchor="middle" fill="#ffe9ac" font-family="Georgia" font-size="29">'+(i+1)+'</text><text x="'+t[0]+'" y="'+(t[1]+18)+'" text-anchor="middle" fill="#f7e4ba" font-family="Georgia" font-size="'+(i<4?19:13)+'">'+name+'</text>';}).join('')+'<circle cx="180" cy="180" r="61" fill="url(#rb-stone-pattern)" stroke="url(#rb-metal)" stroke-width="6"/><circle cx="180" cy="180" r="54" fill="none" stroke="#c69f58"/><text x="180" y="185" text-anchor="middle" fill="#ffe6ae" font-size="38">✈</text><text x="180" y="205" text-anchor="middle" fill="#f4dfac" font-family="Georgia" font-size="12">6 исходов</text><path d="M168 3H192L180 25Z" fill="url(#rb-metal)" stroke="#8b602c" stroke-width="1.5"/></svg>';
}

function rbAirport(page){
 if(page===0)return '<div class="rb-airport-hero">'+rbArt(DESIGN_ASSETS.airport)+'<div><span class="rb-eyebrow">ОДНА ОБЩАЯ КЛЕТКА</span><strong>06 = 18 = 30 = 42</strong></div></div><div class="rb-sequence"><span>'+rbIcon('flag')+'Точная остановка</span>'+rbArrow()+'<span>'+rbIcon('reset')+'Следующий ход</span>'+rbArrow()+'<span>'+rbIcon('compass')+'Колесо</span></div><div class="rb-route-sides">'+rbPanel('Вход в аэропорт','<p>ЦФО · СЗФО · ДФО · ЮФО</p><span class="rb-gold">→ АЭРОПОРТ</span>')+rbPanel('Выход к городам','<p>УФО · СФО · СКФО · ПФО</p><span class="rb-teal">АЭРОПОРТ →</span>')+'</div>'+rbNote('Если шаги остались, проходите аэропорт по нумерации без остановки.','airport');
 if(page===1)return '<div class="rb-airport-directions-layout">'+rbCompass()+'<div class="rb-directions">'+[['Уральский федеральный округ','Тюмень','ufo'],['Сибирский федеральный округ','Омск','sfo'],['Северо-Кавказский федеральный округ','Махачкалу','skfo'],['Приволжский федеральный округ','Самару','pfo']].map(([name,city,art],i)=>'<div class="rb-route">'+rbArt(DESIGN_ASSETS[art])+'<b>'+(i+1)+'</b><span><strong>'+name+'</strong><small>Через '+city+'</small></span>'+rbIcon('airport')+'</div>').join('')+'</div></div><div class="rb-route-roll">'+rbIcon('dice')+'<b>Затем бросьте 2 кубика</b><span>Первый шаг — первый город.</span></div>'+rbNote('1–4: направление. 5–6: особые клетки. Все исходы равновероятны.','compass');
 if(page===2)return '<div class="rb-two">'+rbPanel('5 · Президент',rbArt(DESIGN_ASSETS.president,'rb-special-art')+'<strong class="rb-display">Сразу на клетку</strong><p>Обычно пропустите следующий ход. Ленин не пропускает.</p>')+rbPanel('6 · Судебное следствие',rbArt(DESIGN_ASSETS.court,'rb-special-art')+'<strong class="rb-display">Сразу под следствие</strong><p>Выход: 250 млн ₽, дубль или 3 хода. Ленин — бесплатно.</p>')+'</div>'+rbNote('При исходах 5 и 6 новый бросок не нужен. Перемещение выполняется сразу.','compass');
 return '<div class="rb-two">'+rbPanel('Шаги остались','<div class="rb-track"><span>05</span><span>06</span><span>07</span><span class="active">08</span></div><strong class="rb-display">3 шага: 05 → 08</strong><p>Пройдите аэропорт, идите по номерам.</p>')+rbPanel('Точная остановка','<div class="rb-track"><span>04</span><span>05</span><span class="active">06</span></div><strong class="rb-display">2 шага (1 + 1): 04 → 06</strong><p>Ход завершён даже при дубле. Колесо — в следующий ход.</p>')+'</div>'+rbPanel('Выход: Уральский округ','<div class="rb-sequence"><span>Колесо: 1</span>'+rbArrow()+'<span>Бросок: 2 + 3</span>'+rbArrow()+'<span>7 → 8 → 9 → 10 → 11</span></div><p>Первый шаг — Тюмень № 7, пятый — Екатеринбург № 11.</p>');
}
function rbCards(page){
 if(page===0)return '<div class="rb-deck-scene">'+rbArt('./assets/decks-v18/lawyer.png')+'<div><span class="rb-eyebrow">ЮРИСТ</span><h4>Выберите закрытую карту</h4><div class="rb-sequence"><span>Соперник</span>'+rbArrow()+'<span>Карта 1 или 2</span>'+rbArrow()+'<span>Вердикт</span></div><p>На «Юристе»: иск или замена своей карты. На «Следствии»: соперники решают, обвинять ли остановившегося игрока.</p></div></div>'+rbPanel('Пример: недоказанная взятка','<div class="rb-sequence"><span>Истец</span>'+rbArrow()+'<strong>200 млн ₽</strong>'+rbArrow()+'<span>Ответчик</span></div><div class="rb-success">Без следствия по этой карте</div>')+rbNote('Герой может изменить исход: у Сталина выплаты ×2, ответчик отправляется под следствие.','scales');
 if(page===1)return '<div class="rb-deck-scene">'+rbArt('./assets/decks-v18/black-swan.png')+'<div><span class="rb-eyebrow">ЧЁРНЫЙ ЛЕБЕДЬ</span><h4>«Метель»: выберите исход</h4><p>Пример без особой способности героя.</p></div></div><div class="rb-two">'+rbPanel('Оплатить сейчас',rbNumber('500 млн ₽','сохраните поддержку'))+rbPanel('Оставить карту',rbNumber('−2%','пока штраф не оплачен','people'))+'</div>'+rbNote('Поздняя оплата: 1 млрд ₽ в «Картах кампании». После оплаты штраф −2% снимается.','cards');
 return '<div class="rb-deck-scene">'+rbArt('./assets/decks-v18/travel.png')+'<div><span class="rb-eyebrow">КОМАНДИРОВКА</span><h4>«Трудолюбие»</h4><p>К ближайшей следующей инфраструктуре.</p></div></div>'+rbPanel('Пример маршрута','<div class="rb-track">'+[22,23,24,25,26,27,28].map(n=>'<span class="'+(n===28?'active':'')+'">'+n+'</span>').join('')+'</div><div class="rb-sequence"><span>Карта</span>'+rbArrow()+'<span>Перемещение</span>'+rbArrow()+'<span>Действие клетки</span></div>')+rbNote('По прибытии выполните действие инфраструктуры. Карта не даёт дополнительную постройку.','hq');
}
const debates=SWAN.find(card=>card.id==='debates');
const RB_HERO_EXAMPLES={
 catherine:['Положительный эффект события','«'+debates.name+'»: +'+debates.votes+'% за '+money(debates.cost)+' → +'+(debates.votes*2)+'% за '+money(debates.cost*2)+'.'],
 catherine_i:['Штрафное событие','«Метель»: +500 млн ₽ ИЛИ +2% вместо штрафа.'],
 elizabeth:['Город в СФО под вашим контролем','Базовые 2% города → 4%. Потеряли город — потеряли бонус.'],
 anna:['Клетка «Инфраструктура»','Убрать 1 объект из своего города → можно убрать 1 из другого своего.'],
 nicholas:['Остановка в своей столице','Москва: отделение за 2 млрд ₽ даже без Воронежа и Ярославля.'],
 witte:['Клетка «Инфраструктура»','Убрать 1 чужой объект → можно поставить 1 свой в чужом городе.'],
 stolypin:['Клетка «Инфраструктура»','Поставить 1 объект → можно поставить 1 в другом чужом городе.'],
 milyukov:['Вы вытянули «Чёрного лебедя»','Соперник получает событие и решает, оплачивать ли его.'],
 lenin:['Президент или следствие','Встреча — без пропуска. Следствие — бесплатное продолжение.'],
 trotsky:['Инфраструктура в чужом городе','2 ваших объекта → город ваш. Чужие объекты не учитываются.'],
 kolchak:['Сумма кубиков меньше 6','2 + 3 = 5: выберите 5 или 10 шагов. При сумме 6 бонуса нет.'],
 kerensky:['Соперник заменяет карту','Можно подать иск вне очереди. Пополнение после суда не считается.'],
 stalin:['Сталин — истец или ответчик','200 млн → 400 млн. Ответчик отправляется под следствие.'],
 brezhnev:['Каждый проход «Старта»','1 млрд + 500 млн = 1,5 млрд ₽.'],
 khrushchev:['Клетка «Юрист»','После первого иска — второй другому сопернику. Следствие прерывает серию.'],
 kirov:['Ваши города СЗФО','Нельзя поставить новый чужой объект. Уже стоящие не исчезают.']
};
function rbAbilities(page,heroIndex){
 const faction=Object.keys(FACTIONS)[page],heroes=Object.keys(PERSONAS).filter(id=>factionOf(PERSONAS[id])===faction);
 const n=Number.isInteger(Number(heroIndex))?Math.max(0,Math.min(heroes.length-1,Number(heroIndex))):0,hero=heroes[n],p=PERSONAS[hero],example=RB_HERO_EXAMPLES[hero];
 return '<div class="rb-hero-picker" role="group" aria-label="Герои фракции '+FACTIONS[faction].name+'">'+heroes.map((id,i)=>'<button data-action="ruleHero" data-hero-index="'+i+'" aria-pressed="'+(i===n)+'">'+portrait(id)+'<span>'+PERSONAS[id].short+'</span></button>').join('')+'</div><section class="rb-hero-detail" data-rule-hero="'+hero+'"><div class="rb-hero-art">'+portrait(hero)+factionEmblem(faction)+'</div><div class="rb-hero-copy"><span class="rb-eyebrow">'+FACTIONS[faction].name+'</span><h4>'+p.name+'</h4><div class="rb-ability">'+rbIcon('crown')+'<span>'+p.ability+'</span></div><div class="rb-hero-example"><small>'+example[0]+'</small><p>'+example[1]+'</p></div></div></section>'+rbNote('Игровая способность — отдельный блок от истории героя. Действует и у компьютера.','book');
}
function rbVictory(page){
 if(page===0)return '<div class="rb-victory-layout">'+rbPanel('Поддержка избирателей','<div class="rb-goals">'+[[2,51],['3–4',41],['5–6',31]].map(([n,v])=>'<div><span>'+n+' '+(n==='5–6'?'игроков':'игрока')+'</span><strong>'+v+'%</strong><i style="--goal:'+v+'%"></i></div>').join('')+'</div>')+'<span class="rb-or">ИЛИ</span>'+rbPanel('Бюджет кампании',rbNumber('15 млрд ₽','накопленных денег')+'<div class="rb-trophy">'+rbIcon('crown')+'</div>')+'</div>'+rbPanel('Партия на четверых','<div class="rb-win-example"><span>40%</span><b>+1%</b><span>41%</span><strong>ПОБЕДА</strong></div>')+rbNote('Достаточно достичь одной цели.','crown');
 return rbPanel('Из чего складывается поддержка','<div class="rb-sequence"><span>'+rbIcon('flag')+'Голоса городов</span><b>+</b><span>'+rbIcon('cards')+'Эффекты карт</span><b>−</b><span>'+rbIcon('minus')+'Активные штрафы</span></div>')+'<div class="rb-two">'+rbPanel('Развитие','<strong class="rb-display">1% → 2% всего</strong><p>Новое значение заменяет прежнее.</p>')+rbPanel('Смена владельца','<div class="rb-face-row">'+portrait('nicholas')+rbArrow()+portrait('catherine')+'</div><p>Голоса переходят новому владельцу.</p>')+'</div>'+rbNote('Победа по бюджету — деньги на руках. Стоимость городов и построек не прибавляется.','coins');
}
function rbBody(chapter,page,hero){return ({preparation:rbPreparation,turn:rbTurn,cities:rbCities,infrastructure:rbInfrastructure,airport:rbAirport,cards:rbCards,abilities:rbAbilities,victory:rbVictory})[chapter](page,hero);}
export function rulesContent(requested='cities',{compact=false,inGame=false,page=0,hero=0}={}){
 const loc=ruleLocation(requested,page),chapter=RULE_CHAPTERS[loc.index],prev=ruleStep(loc.chapter,loc.page,-1),next=ruleStep(loc.chapter,loc.page,1),last=loc.index===7&&loc.page===chapter.pages.length-1;
 const attrs=l=>'data-chapter="'+l.chapter+'" data-rule-page="'+l.page+'"';
 return '<div class="visual-rulebook reference-shell rb-crafted" data-rule-compact="'+compact+'">'+referenceTexture()+referenceCorners()+
 '<header class="rb-header"><button class="rb-back" data-action="close">← <span>'+(inGame?'К игре':'В меню')+'</span></button><div><img src="./assets/interface-v24/president-crest.png" alt=""><h2>ПРАВИЛА ИГРЫ</h2></div><button class="rb-search-trigger" data-action="ruleSearch" aria-expanded="false">⌕ <span>Найти правило</span></button></header>'+
 '<div class="rb-search-panel" hidden><button class="rb-search-close" data-action="ruleSearch" aria-label="Закрыть поиск">Закрыть ×</button><label>Найти правило<input type="search" data-rule-search placeholder="Город, штаб, голоса…" autocomplete="off"></label><div class="rb-search-results">'+ruleSearchMarkup()+'</div></div>'+
 '<div class="rb-workspace"><nav class="rb-sidebar" aria-label="Разделы правил">'+RULE_CHAPTERS.map((c,i)=>'<button data-action="ruleChapter" data-chapter="'+c.id+'" '+(c.id===chapter.id?'aria-current="page"':'')+'>'+rbIcon(c.icon)+'<span><small>'+String(i+1).padStart(2,'0')+'</small>'+c.title+'</span></button>').join('')+palaceFlourish()+'<span class="rb-sidebar-note">История · Стратегия · Влияние</span></nav>'+
 '<main class="rb-main"><label class="rb-mobile-sections"><span class="sr-only">Раздел правил</span><select data-rule-select aria-label="Раздел правил">'+RULE_CHAPTERS.map((c,i)=>'<option value="'+c.id+'" '+(c.id===chapter.id?'selected':'')+'>'+String(i+1).padStart(2,'0')+' · '+c.title+'</option>').join('')+'</select></label>'+
 '<div class="rb-page-heading"><span class="rb-eyebrow">РАЗДЕЛ '+String(loc.index+1).padStart(2,'0')+' / 08</span><h3>'+RB_PAGE_TITLES[chapter.id][loc.page]+'</h3>'+palaceFlourish()+'</div>'+
 '<div class="rb-tabs" role="group" aria-label="Страницы раздела">'+chapter.pages.map((title,i)=>'<button data-action="ruleChapter" data-chapter="'+chapter.id+'" data-rule-page="'+i+'" aria-pressed="'+(i===loc.page)+'">'+title+'</button>').join('')+'</div>'+
 '<article class="rb-body rb-'+loc.chapter+' rb-page-'+loc.page+'" aria-label="'+chapter.title+': '+chapter.pages[loc.page]+'" data-rule-section="'+chapter.id+'" data-rule-page="'+loc.page+'" tabindex="-1">'+rbBody(chapter.id,loc.page,hero)+'</article></main></div>'+
 '<footer class="rb-footer"><button data-action="ruleChapter" '+attrs(prev)+' '+(loc.index===0&&loc.page===0?'disabled':'')+'>← Назад</button><div class="rb-progress" aria-live="polite"><span>'+chapter.pages[loc.page]+'</span><b>'+(loc.page+1)+' / '+chapter.pages.length+'</b></div><button data-action="'+(last?'close':'ruleChapter')+'" '+attrs(next)+'>'+(last?'Понятно ✓':'Далее →')+'</button></footer></div>';
}

