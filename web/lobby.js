import {characterSelectionScreen} from './character-selection.js';
import {presentationPlayerId} from './campaign-ui.js';
import {palacePainting,palaceFlourish,palaceCorners} from './palace-art.js';
import {FACTIONS,factionOf,factionEmblem} from './factions.js';
import {PERSONAS,PLAYER_COLORS,voteTarget,getVotes,money} from './engine.js';
import {DESIGN_ASSETS,CITY_ICON_ASSETS,PORTRAIT_ASSETS} from './design-assets.js';
import {portrait,primary,secondary,icon} from './view.js';
import {emblem} from './emblems.js';

export function defaultRoster(){return [{persona:'catherine',bot:false},{persona:'nicholas',bot:true}];}
export function resizeRoster(roster,count){
 if(!Number.isInteger(count)||count<2||count>6)return roster;
 const next=roster.slice(0,count).map(p=>({...p}));
 while(next.length<count)next.push({persona:['catherine','nicholas','lenin','stalin','elizabeth','brezhnev'].find(id=>!next.some(p=>p.persona===id)),bot:true});
 return next;
}
export function chooseHero(roster,seat,persona){
 if(!Number.isInteger(seat)||!roster[seat]||!Object.hasOwn(PERSONAS,persona))return roster;
 const other=roster.findIndex(p=>p.persona===persona),old=roster[seat].persona;
 return roster.map((p,i)=>i===seat?{...p,persona}:i===other?{...p,persona:old}:p);
}
const lobbyMark=()=>`<span class="lobby-wordmark">${icon('crown')} ПРЕЗИДЕНТ <small>ПРЕДВЫБОРНАЯ ГОНКА</small></span>`;
const stars=()=>'<div class="lobby-dust" aria-hidden="true">'+Array.from({length:14},(_,i)=>`<i style="--x:${(i*37+11)%97}%;--y:${(i*19+7)%90}%;--delay:${-i*1.7}s"></i>`).join('')+'</div>';
export function launchScreen(s,{saved=false,sound=false,online=false,previous=false}={}){
 const p=s.players[presentationPlayerId(s)];
 const entries=[['multiplayer',online?'Вернуться в комнату':'Играть с друзьями','people'],...(saved?[['new','Новая кампания','book']]:[]),['cities','Атлас городов','hq'],['world','Мир кампании','book'],['rules','Правила','book']];
 return `<main class="palace-menu reference-menu"><div class="palace-menu-scene" aria-hidden="true"><img class="reference-menu-panorama" src="./assets/reference-v30/menu-panorama.png" alt="" fetchpriority="high">${stars()}</div><section class="palace-menu-panel"><header class="palace-brand"><div class="palace-brand-crest">${palacePainting('crest')}</div><h1>ПРЕЗИДЕНТ</h1><p>Предвыборная гонка</p></header>${saved?`<button class="palace-save" data-action="resume">${portrait(p.persona)}<span><small>${s.phase==='finished'?'ИТОГИ КАМПАНИИ':'ПРОДОЛЖИТЬ КАМПАНИЮ'}</small><strong>${p.name}</strong><span>Раунд ${s.round} · ${s.players.length} ${s.players.length>4?'участников':'участника'}</span><span>${money(p.cash)} · Поддержка ${getVotes(s,p.id)}%</span></span></button>`:`<div class="palace-invitation"><span>ВАША ИСТОРИЯ НАЧИНАЕТСЯ ЗДЕСЬ</span><p>Возглавьте кампанию.<br>Завоюйте доверие страны.</p>${primary('Начать кампанию','new')}</div>`}<nav class="palace-navigation" aria-label="Главное меню">${entries.map(([action,label,symbol])=>`<button data-action="${action}">${icon(symbol)}<span>${label}</span></button>`).join('')}</nav><div class="reference-menu-tools"><button data-action="settings">${icon('menu')} Настройки</button><button data-action="sound" aria-label="${sound?'Выключить':'Включить'} звуки" aria-pressed="${sound}">${icon(sound?'sound':'muted')} Звук</button><button data-action="decks" title="Колоды кампании">${icon('cards')} Колоды</button></div>${previous?'<button class="palace-previous" data-action="previousCampaign">Предыдущая кампания ↗</button>':''}</section><footer class="palace-menu-footer"><span>${saved?'✓ Партия сохраняется автоматически':'2–6 участников · За одним столом или по сети'}</span></footer></main>`;
}
export function setupScreen(roster,seat,options={}){return characterSelectionScreen(roster,seat,options);}
export function heroesContent(){return `<p class="dialog-lead">Фракции из авторской колоды «Личности». Выберите героя и изучите его игровую способность.</p><div class="faction-library">${Object.entries(FACTIONS).map(([id,f])=>`<section><header style="--faction-color:${f.color}">${factionEmblem(id)}<div><small>ИСТОРИЧЕСКАЯ ФРАКЦИЯ</small><h3>${f.name}</h3><p>${f.motto}</p></div></header><div class="hero-library">${Object.entries(PERSONAS).filter(([,p])=>p.era===f.name).map(([id,p])=>`<article><img src="${PORTRAIT_ASSETS[id]}" alt="${p.name}" loading="lazy"><div><h3>${p.name}</h3><b>${p.style}</b><p>${p.ability}</p></div></article>`).join('')}</div></section>`).join('')}</div>`;}
