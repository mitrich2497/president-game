import {PERSONAS,CITY_BY_ID,getVotes,money,voteTarget,viewerId,actionPlayerId} from './engine.js';

export const CAMPAIGN_COLORS=['#44d9c2','#65adff','#ef7666','#f3bd57','#bb95f3','#d7df85'];
const tokenMotifs={
 catherine_i:'<path d="m3 8 5 4 4-8 4 8 5-4-3 12H6ZM7 23h10"/><circle cx="12" cy="15" r="2"/>',
 anna:'<path d="M4 5h16v9c0 6-8 10-8 10S4 20 4 14ZM7 2h10M9 13l3-4 3 4-3 4Z"/>',
 witte:'<circle cx="12" cy="12" r="8"/><path d="M10 7v10m0-10h4a3 3 0 0 1 0 6h-6m0 3h7M5 24h14"/>',
 stolypin:'<path d="M3 22h18M5 20v-8l7-7 7 7v8M3 12h18M9 20v-5h6v5M12 5V1h6v4"/>',
 kirov:'<path d="M4 4h16v10c0 6-8 10-8 10S4 20 4 14ZM8 17V9h8v8M6 17h12M11 17v-4h2"/>',
 trotsky:'<path d="m14 2-9 13h6l-1 10 9-15h-6ZM2 22h4M18 4h4"/>',
 kolchak:'<circle cx="12" cy="5" r="3"/><path d="M12 8v15M7 11h10M3 15v3c0 4 9 6 9 6s9-2 9-6v-3M1 18l2-3 3 3m12 0 3-3 2 3"/>',
 milyukov:'<path d="M5 21h14M6 18l2-5L19 2l3 3-11 11-5 2ZM8 13l3 3M4 24h16"/>',
 khrushchev:'<path d="M12 3v20M4 23h16M3 8h18M5 8 2 15h6L5 8Zm14 0-3 7h6l-3-7Z"/><circle cx="12" cy="4" r="2"/>',
 kerensky:'<path d="M7 4h13v17H7ZM4 8H1v17h15M10 8h7m-7 4h7m-7 4h4M5 14l-4 4 4 4"/>',
 catherine:'<path d="m3 7 5 4 4-7 4 7 5-4-3 12H6ZM7 22h10"/>',
 nicholas:'<path d="M12 21V8M12 13 5 5 2 7l3 9 7 3m0-6 7-8 3 2-3 9-7 3M8 5l1-3 3 3 3-3 1 3M8 23l4-2 4 2"/>',
 lenin:'<path d="M13 2c-8 7 2 8-5 13-2-3-2-6-2-6C-1 22 13 26 19 19c5-7-3-13-3-13 1 8-6 9-4 3Z"/>',
 stalin:'<path d="m12 2 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z"/>',
 elizabeth:'<path d="m3 8 4 4 5-9 5 9 4-4-3 12H6ZM8 23h8M12 10v8m-3-4h6"/>',
 brezhnev:'<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1ZM2 17l3 6m17-6-3 6"/>'
};
export function tokenSymbol(persona){return `<svg viewBox="0 0 24 26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${tokenMotifs[persona]||tokenMotifs.catherine}</svg>`;}
export function localSeatLabel(s,id){if(s.network)return id===s.network.viewer?'ВЫ':s.network.members?.find(m=>m.id===id)?.connected===false?'НЕТ СВЯЗИ':'ИГРОК '+(id+1);const humans=s.players.filter(p=>!p.bot);return s.players[id].bot?'КОМПЬЮТЕР':humans.length===1?'ВЫ':'ИГРОК '+(id+1);}
export function presentationPlayerId(s){return s.phase==='finished'?s.winner:actionPlayerId(s);}
export function nextTurnPreview(s){
 const p=s.players[s.current];if(s.phase==='finished')return null;
 if(actionPlayerId(s)!==s.current)return {id:s.current,label:'Продолжит ход'};
 if(s.extraRoll&&!p.airportPending&&!p.jail&&!p.skip)return {id:p.id,label:'Дополнительный бросок'};
 const skipped=s.players.map(p=>p.skip);let next=s.current;
 for(let i=0;i<s.players.length*2+1;i++){next=(next+1)%s.players.length;if(skipped[next]){skipped[next]--;continue;}return {id:next,label:'Следующий'};}
 return null;
}
export function actorHeading(s){if(s.phase==='finished')return 'Кампания завершена';const id=actionPlayerId(s),p=s.players[id];if(s.network)return id===s.network.viewer?(id!==s.current?'Ваше решение':'Ваш ход'):(id!==s.current?'Решение соперника':'Ход соперника');if(id!==s.current)return p.bot?'Решение соперника':'Решение игрока '+(id+1);return p.bot?'Ход соперника':s.players.filter(p=>!p.bot).length===1?'Ваш ход':'Ход игрока '+(p.id+1);}
export function currentRoll(s){
 const r=s.lastRoll,released=s.phase==='ready'&&r?.purpose==='jail'&&r.dice[0]===r.dice[1]&&!s.players[s.current].jail;
 return actionPlayerId(s)===s.current&&r&&r.player===s.current&&r.round===s.round&&(released||!['ready','airport','jailed'].includes(s.phase))?r:null;
}
export function developmentPreview(s){const p=s.players[s.current],c=CITY_BY_ID[p.position],r=s.regions[p.position];if(s.phase!=='decision'||s.decision?.kind!=='owncity'||!c||r?.level!=='base')return null;const factor=p.persona==='elizabeth'&&c.district_on_board==='СФО'?2:1;return {votes:[c.levels.base.votes_percent*factor,c.levels.headquarters.votes_percent*factor],payment:[c.levels.base.money_million_rub,c.levels.headquarters.money_million_rub],cost:c.headquarters_cost_million_rub};}
export function rosterSummary(s){return s.players.map(p=>({id:p.id,name:PERSONAS[p.persona].name,cash:money(p.cash),votes:getVotes(s,p.id),active:p.id===presentationPlayerId(s),local:p.id===viewerId(s),label:localSeatLabel(s,p.id),target:voteTarget(s)}));}
