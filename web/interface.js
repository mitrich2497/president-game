import {lawyerCards} from './deck-ui.js';
import {palacePainting} from './palace-art.js';
import {DESIGN_ASSETS,CITY_ICON_ASSETS} from './design-assets.js';
import {PERSONAS,getVotes,money,LAWYERS} from './engine.js';
import {primary,secondary,portrait,icon,campaignSeal} from './view.js';
import {emblem,DISTRICT_STYLE} from './emblems.js';

export function menuContent(s){
 const p=s.players[s.current];
 const destinations=[
  ['cities','Атлас городов','24 архитектурные миниатюры',CITY_ICON_ASSETS[45]],
  ['miniatures','Жетоны и гербы','Символы вашей кампании',DESIGN_ASSETS.president],
  ['cards','Карты «Юрист»','Ваша судебная практика',DESIGN_ASSETS.lawyer],
  ['rules','Как играть','От первого хода до победы',DESIGN_ASSETS.airport]
 ];
 return `<div class="menu-scene" aria-hidden="true"><img class="menu-landscape" src="${DESIGN_ASSETS.cfo}" alt=""><div class="menu-atmosphere"></div><img class="menu-city menu-city-back" src="${CITY_ICON_ASSETS[15]}" alt=""><img class="menu-city menu-city-front" src="${CITY_ICON_ASSETS[1]}" alt=""></div><div class="menu-heading"><span class="menu-crest">${emblem('ЦФО')}</span><span class="eyebrow">ПРЕДВЫБОРНАЯ ГОНКА</span><h2>ПРЕЗИДЕНТ</h2><p>История. Влияние. Ваш ход.</p></div><div class="menu-content"><div class="resume-panel"><div class="resume-status">${portrait(p.persona)}<div><span class="eyebrow">ТЕКУЩАЯ КАМПАНИЯ · РАУНД ${s.round}</span><strong>${p.name}</strong><small>${getVotes(s,p.id)}% поддержки <i>◆</i> ${money(p.cash)}</small></div></div>${primary('Вернуться к игре','close')}${secondary(icon('plus')+' Новая кампания','new')}<span class="menu-note">${s.players.length} кандидатов · ${s.players.filter(p=>!p.bot).length} игроков</span></div><nav class="menu-destinations" aria-label="Разделы игры">${destinations.map(([action,title,subtitle,image])=>`<button class="menu-destination" data-action="${action}"><img src="${image}" alt="" draggable="false"><span><strong>${title}</strong><small>${subtitle}</small></span><i>↗</i></button>`).join('')}</nav></div><div class="menu-footnote"><span>24 ГОРОДА</span><i>◆</i><span>8 ФЕДЕРАЛЬНЫХ ОКРУГОВ</span><i>◆</i><button data-action="overview">Обзор вашей кампании ↗</button></div>`;
}

export function newCampaignContent(persona,mode){
 const detail={catherine:['Императрица','Возможности и влияние','Положительные события «Чёрного лебедя» приносят двойной эффект и требуют двойных вложений.','cfo'],nicholas:['Император','Стратегия развития','Может открыть региональное отделение в своей столице, не собирая все города округа.','szfo']};
 return `<p class="dialog-lead">У каждой личности свой путь к победе. Выберите, чью кампанию возглавить.</p><div class="persona-select">${Object.entries(PERSONAS).map(([id,p])=>{const [rank,title,ability,land]=detail[id]||[p.era,p.style,p.ability,'cfo'];return `<button class="persona-card ${id===persona?'selected':''}" data-action="persona" data-persona="${id}" aria-pressed="${id===persona}"><img class="persona-landscape" src="${DESIGN_ASSETS[land]}" alt=""><span class="persona-check" aria-hidden="true">${id===persona?'✓':'◇'}</span><span class="persona-medallion">${portrait(id)}</span><span class="eyebrow">${rank}</span><strong>${p.name}</strong><span class="persona-ability"><b>${title}</b><small>${ability}</small></span><span class="persona-select-label">${id===persona?'КАНДИДАТ ВЫБРАН':'ВЫБРАТЬ КАНДИДАТА'}</span></button>`;}).join('')}</div><label class="opponent-setting" for="bot-mode"><span class="setting-icon">${icon('crown')}</span><span><strong>Компьютерный соперник</strong><small>Отключите, чтобы играть вдвоём на одном устройстве</small></span><input type="checkbox" id="bot-mode" ${mode==='bot'?'checked':''}><i class="setting-switch" aria-hidden="true"></i></label><div class="new-game-action">${primary('Начать кампанию','startGame')}<p>Новая кампания заменит текущую сохранённую партию.</p></div>`;
}

export function lawyerHandContent(player,kind){return lawyerCards(player,kind);}

export function chronicleContent(s){
 return `<div class="chronicle-banner"><img src="${DESIGN_ASSETS.travel}" alt=""><div><span class="eyebrow">СОБЫТИЯ ВАШЕЙ ПАРТИИ</span><strong>Каждый ход меняет историю</strong><small>Раунд ${s.round} · ${s.log.length} записей</small></div></div><div class="chronicle-list">${s.log.map((x,i)=>`<div class="log-item"><span class="log-pin" aria-hidden="true"></span><small>РАУНД ${x.turn}</small><p>${String(x.text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</p></div>`).join('')}</div>`;
}

export function illustratedCollection(){return `<p class="dialog-lead">Исторические личности, флаги кампаний и геральдика восьми округов. Ваши символы на игровом поле.</p><div class="token-collection">${Object.entries(PERSONAS).map(([id,p])=>[id,p.name,p.style]).map(([id,name,note])=>`<article class="token-display ${id}"><div class="collectible-token">${portrait(id)}<i>◆</i></div><span>ЖЕТОН КАНДИДАТА</span><h3>${name}</h3><p>${note}</p></article>`).join('')}<article class="token-display seal-display">${campaignSeal()}<span>РАЗВИТИЕ КАМПАНИИ</span><h3>Предвыборный штаб</h3><p>Флаг под названием города. Монограмма и цвет обозначают владельца.</p></article><article class="token-display seal-display">${campaignSeal(true)}<span>ВЛИЯНИЕ В ОКРУГЕ</span><h3>Региональное отделение</h3><p>Флаг поднят к плашке названия города. Крупного здания на поле нет.</p></article></div><div class="collection-caption"><span>ГЕРБЫ ВОСЬМИ ОКРУГОВ</span><i></i></div><div class="emblem-collection">${Object.entries(DISTRICT_STYLE).map(([id,d])=>`<button data-district="${id}" title="${d.name}">${emblem(id)}<span>${id}</span></button>`).join('')}</div>`;}
