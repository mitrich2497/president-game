import {CITY_BY_ID,TILE_BY_ID,AIRPORTS,planMove,money,cityVotes,tileName} from './engine.js';

export function rollForecast(s){
 if(s.phase!=='ready')return [];
 const p=s.players[s.current];
 return Array.from({length:11},(_,i)=>{
  const sum=i+2,ways=6-Math.abs(7-sum),route=planMove(p.position,sum),city=CITY_BY_ID[route.to],region=s.regions[route.to],tile=TILE_BY_ID[route.to];
  let tone='event',detail=({start:'Проход старта · +'+money(p.persona==='brezhnev'?1500:1000),lawyer:'Замена карты или судебное дело',swan:'Карта события',travel:'Карта маршрута',infra:'Развитие кампании',president:p.persona==='lenin'?'Встреча без пропуска хода':'Пропуск следующего хода',court:'Соперники смогут обвинить по закрытой карте'})[tile?.kind]||'Пересадка в следующий ход';
  if(city){
   tone=!region?'free':region.owner===p.id?'own':'rival';
   detail=!region?'Вложение · '+money(city.acquisition_cost_million_rub):region.owner===p.id?'Ваша кампания · '+cityVotes(s,route.to)+'%':'Сопернику · '+money(city.levels[region.level].money_million_rub);
  }
  if(p.persona==='kolchak'&&sum<6)detail+=' · Можно удвоить: '+tileName(planMove(p.position,sum*2).to);
  return {sum,ways,chance:ways/36,position:route.to,path:route.path,startPasses:route.startPasses,name:city?.city||(AIRPORTS.includes(route.to)?'Аэропорт':tile.name.charAt(0)+tile.name.slice(1).toLowerCase()),tone,detail};
 });
}
export function forecastPanel(s,sum=7){
 const forecasts=rollForecast(s),chosen=forecasts.find(x=>x.sum===sum)||forecasts[5];if(!chosen)return '';
 return `<section class="tactical-panel" aria-label="Прогноз броска"><div class="tactical-heading"><span><small>ТАКТИЧЕСКИЙ ОБЗОР</small><strong>Куда приведут кубики</strong></span><span class="probability-label">36 сочетаний · 11 исходов</span></div><div class="forecast-sums" aria-label="Сумма двух кубиков">${forecasts.map(f=>`<button data-action="forecastSum" data-sum="${f.sum}" aria-pressed="${f.sum===chosen.sum}" aria-label="${f.sum}: ${f.name}, ${(f.chance*100).toFixed(1).replace('.',',')}%" style="--chance:${f.ways/6}"><span>${f.sum}</span><i></i><small>${(f.chance*100).toFixed(1).replace('.',',')}%</small></button>`).join('')}</div><div class="forecast-result ${chosen.tone}"><span class="forecast-number">${String(chosen.position).padStart(2,'0')}</span><div><strong>${chosen.name}</strong><p>${chosen.detail}${chosen.startPasses&&chosen.position!==0?' · По дороге: +'+money(s.players[s.current].persona==='brezhnev'?1500:1000)+' за старт':''}</p></div><span class="forecast-chance">${(chosen.chance*100).toFixed(1).replace('.',',')}<small>%</small></span></div><p class="forecast-note">Вероятности двух честных кубиков. Выбор суммы показывает маршрут и не влияет на бросок.</p></section>`;
}
