import {routeDefs,routeFoundation,routeDirections,airportTransits} from './board-route.js';
import {DESIGN_ASSETS,DISTRICT_COLORS,CITY_ICON_ASSETS} from './design-assets.js';
import {CITIES,TILES} from './data.js';

export const DISTRICT_PANELS=[
 {x:155.3,y:249,w:248.6,h:249,diagonal:'down',a:'cfo',b:'pfo'},
 {x:682.3,y:249,w:248.6,h:249,diagonal:'up',a:'skfo',b:'yufo'},
 {x:155.3,y:782,w:248.6,h:248,diagonal:'up',a:'szfo',b:'ufo'},
 {x:682.3,y:782,w:248.6,h:248,diagonal:'down',a:'sfo',b:'dfo'}
];
const ornament=(x,y,w,h)=>`<path d="M${x+8} ${y+18}v-10h10M${x+w-18} ${y+8}h10v10M${x+8} ${y+h-18}v10h10M${x+w-18} ${y+h-8}h10v-10" fill="none" stroke="#c8ad74" stroke-width=".65" opacity=".8"/>`;
export function boardDesignDefs(){return `<defs>${routeDefs()}
 <linearGradient id="bd-gold" x1="0" y1="0" x2=".75" y2="1"><stop stop-color="#ffedbb"/><stop offset=".45" stop-color="#b58a51"/><stop offset="1" stop-color="#edce90"/></linearGradient>
 <radialGradient id="bd-paper" cx=".4" cy=".2" r="1"><stop stop-color="#315258" stop-opacity=".38"/><stop offset="1" stop-color="#102f3b" stop-opacity=".08"/></radialGradient>
 <radialGradient id="bd-light" cx=".5" cy=".5" r=".6"><stop stop-color="#71b8a0" stop-opacity=".2"/><stop offset="1" stop-color="#102c38" stop-opacity="0"/></radialGradient>
 <linearGradient id="bd-enamel" x2=".8" y2="1"><stop stop-color="#264b50"/><stop offset=".55" stop-color="#163540"/><stop offset="1" stop-color="#0b2532"/></linearGradient>
 <linearGradient id="bd-veil" x2="0" y2="1"><stop stop-color="#0a2735" stop-opacity=".15"/><stop offset=".55" stop-color="#071d29" stop-opacity=".2"/><stop offset="1" stop-color="#091f2b" stop-opacity=".68"/></linearGradient>
 <radialGradient id="bd-cityshadow"><stop stop-color="#000c16" stop-opacity=".7"/><stop offset="1" stop-color="#00101d" stop-opacity="0"/></radialGradient>
 <radialGradient id="bd-world"><stop stop-color="#30545a"/><stop offset=".65" stop-color="#133440"/><stop offset="1" stop-color="#091f2c"/></radialGradient>
 <radialGradient id="bd-panel-fade"><stop offset=".48" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient>
 <radialGradient id="bd-airport-light"><stop stop-color="#51726d" stop-opacity=".6"/><stop offset=".65" stop-color="#315152" stop-opacity=".25"/><stop offset="1" stop-color="#122f3b" stop-opacity="0"/></radialGradient>
 <pattern id="bd-grain" width="96" height="96" patternUnits="userSpaceOnUse"><path d="M-20 40Q20 0 60 30T130 24M-20 49Q20 9 60 39T130 33M-20 58Q20 18 60 48T130 42M-20 67Q20 27 60 57T130 51" fill="none" stroke="#82afa3" stroke-width=".55" opacity=".07"/></pattern>
 <marker id="bd-in" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="m1 1 8 4-8 4 2-4Z" fill="#f2d69b"/></marker>
 <marker id="bd-out" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="m1 1 8 4-8 4 2-4Z" fill="#70ddca"/></marker>
 </defs>`;}
function districtPanels(){return DISTRICT_PANELS.map(({x,y,w,h,diagonal,a,b},i)=>{
 const p=diagonal==='down'?[`0,0 ${w},0 ${w},${h}`,`0,0 0,${h} ${w},${h}`]:[`0,0 ${w},0 0,${h}`,`${w},0 ${w},${h} 0,${h}`];
 return `<g class="district-panel" transform="translate(${x} ${y})"><defs><mask id="panel-fade-${i}"><rect x="-8" y="-8" width="${w+16}" height="${h+16}" fill="url(#bd-panel-fade)"/></mask>${[a,b].map((id,j)=>`<clipPath id="panel-${id}"><polygon points="${p[j]}"/></clipPath>`).join('')}</defs><g mask="url(#panel-fade-${i})">${[a,b].map((id,j)=>`<g clip-path="url(#panel-${id})"><image href="${DESIGN_ASSETS[id]}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/><rect width="${w}" height="${h}" fill="url(#bd-veil)"/></g>`).join('')}<path d="${diagonal==='down'?`M0 0 ${w} ${h}`:`M0 ${h} ${w} 0`}" stroke="#cfba82" stroke-opacity=".4" stroke-width=".8"/></g></g>`;
 }).join('');}
export function designedTile(t,r){
 const c=CITIES.find(c=>c.position===t.n),col=DISTRICT_COLORS[t.group]||DISTRICT_COLORS.neutral,w=r.w-4,h=r.h-4;
 const lines=t.n===12?['СУДЕБНОЕ','СЛЕДСТВИЕ']:t.n===47?['НИЖНИЙ','НОВГОРОД']:[t.name];
 const caption=lines.map((line,i)=>`<text x="${w/2}" y="${lines.length===2?13+i*9:18}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${lines.length===2?9:line.length>14?8.5:line.length>11?9.5:11}" font-weight="600" letter-spacing=".45" fill="#fff1d2">${line}</text>`).join('');
 let art='';
 if(c) art=`<ellipse cx="60" cy="70" rx="59" ry="45" fill="url(#bd-light)"/><ellipse cx="62" cy="96" rx="48" ry="12" fill="url(#bd-cityshadow)"/><image class="city-illustration" href="${CITY_ICON_ASSETS[t.n]}" x="1" y="23" width="${w-2}" height="${h-34}" preserveAspectRatio="xMidYMid meet"/>`;
 else if(t.kind==='start') art=`<g transform="translate(27 47)"><path d="M0 13h31Q37 13 37 7V0l29 24-29 24v-7q0-6-6-6H0Z" fill="url(#bd-gold)" stroke="#fff0bd" stroke-width=".5"/><path d="M3 17h33Q41 17 41 13V9l19 15H3" fill="#fff0c5" opacity=".28"/></g>`;
 else art=`<ellipse cx="60" cy="66" rx="53" ry="42" fill="url(#bd-airport-light)"/><ellipse cx="60" cy="94" rx="40" ry="10" fill="url(#bd-cityshadow)"/><image href="${DESIGN_ASSETS[t.kind]}" x="${t.kind==='travel'?18:14}" y="27" width="${t.kind==='travel'?84:92}" height="${h-39}" preserveAspectRatio="xMidYMid meet"/>`;
 const price=c?(c.acquisition_cost_million_rub>=1000?String(c.acquisition_cost_million_rub/1000).replace('.',',')+' млрд ₽':c.acquisition_cost_million_rub+' млн ₽'):({start:'+1 млрд ₽',lawyer:'ПРАВО',swan:'СОБЫТИЕ',travel:'МАРШРУТ',infra:'РАЗВИТИЕ',court:'СЛЕДСТВИЕ',president:'ВСТРЕЧА'}[t.kind]);
 return `<g class="designed-tile ${c?'city-tile':'special-tile'}" data-design-kind="${t.kind}" transform="translate(${r.x+2} ${r.y+2})" pointer-events="none"><rect x="1" y="1" width="${w-2}" height="${h-2}" rx="14" fill="url(#tile-surface)" stroke="#d0b583" stroke-opacity=".56" stroke-width="1.1"/><path d="M26 2H${w-26}" stroke="${col}" stroke-opacity="1" stroke-width="3.5" stroke-linecap="round"/>${caption}${art}<rect x="${w-30}" y="${h-22}" width="26" height="19" rx="7" fill="#0b2631" stroke="#b99c6866" stroke-width=".6"/><text x="10" y="${h-7}" font-family="Arial,sans-serif" font-size="8.6" letter-spacing=".15" fill="#d3ded0">${price}</text><text x="${w-8}" y="${h-7}" text-anchor="end" font-family="Georgia,serif" font-size="12" font-weight="600" fill="#f3dca4">${String(t.n).padStart(2,'0')}</text></g>`;
}
export function airportDesign(active=-1){return `<g class="airport-art" pointer-events="none">
 <circle cx="541" cy="642" r="142" fill="url(#bd-airport-light)"/>
 <circle cx="541" cy="642" r="96" fill="#173944" fill-opacity=".4" stroke="#d6c18e" stroke-opacity=".36" stroke-width="1"/>
 <circle cx="541" cy="642" r="91" fill="none" stroke="#c8b07b" stroke-opacity=".15" stroke-dasharray="1 7"/>
 <path d="M541 518v16m0 216v16M417 642h16m216 0h16" stroke="#cfb57a" stroke-width="1" stroke-linecap="round"/>
 <ellipse cx="541" cy="679" rx="85" ry="21" fill="url(#bd-cityshadow)"/>
 <image href="${DESIGN_ASSETS.airport}" x="447" y="560" width="188" height="153" preserveAspectRatio="xMidYMid meet"/>
 <text x="541" y="718" text-anchor="middle" font-family="Georgia,serif" font-size="15" letter-spacing="2.2" fill="#f6e2b5">АЭРОПОРТ</text><text x="541" y="735" text-anchor="middle" font-family="Arial,sans-serif" font-size="6.5" letter-spacing="2.5" fill="#91b5ad">ЕДИНЫЙ ПЕРЕСАДОЧНЫЙ УЗЕЛ</text>
 <g fill="none" stroke="#b4cab0" stroke-opacity=".15" stroke-width="1.3"><path d="M465 500v39q0 19-19 19h-34M680 558h-43q-19 0-19-19v-38M405 724h41q19 0 19 19v36M618 779v-36q0-19 19-19h43"/></g>
 <g fill="none" stroke-width="2.5" stroke-linecap="round"><path class="route-in" d="M465 502v35" stroke="#f2d69b" marker-end="url(#bd-in)"/><path class="route-out" d="M445 558h-32" stroke="#70ddca" marker-end="url(#bd-out)"/>
 <path class="route-in" d="M680 558h-41" stroke="#f2d69b" marker-end="url(#bd-in)"/><path class="route-out" d="M618 537v-35" stroke="#70ddca" marker-end="url(#bd-out)"/>
 <path class="route-in" d="M405 724h39" stroke="#f2d69b" marker-end="url(#bd-in)"/><path class="route-out" d="M465 745v33" stroke="#70ddca" marker-end="url(#bd-out)"/>
 <path class="route-in" d="M618 778v-33" stroke="#f2d69b" marker-end="url(#bd-in)"/><path class="route-out" d="M639 724h40" stroke="#70ddca" marker-end="url(#bd-out)"/></g>
 ${[[465,558,6],[618,558,42],[465,724,18],[618,724,30]].map(([x,y,n])=>`<g transform="translate(${x} ${y})"><circle r="15" fill="#153742" stroke="#bda370" stroke-opacity=".7" stroke-width=".8"/><text y="4" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#f7e0ac">${n}</text></g>`).join('')}
 ${airportTransits(active)}</g>`;}
export function designedBoard(rects,active=-1){return `${boardDesignDefs()}<g aria-hidden="true"><rect x="25" y="117" width="1037" height="1047" rx="22" fill="url(#bd-world)"/><rect x="25" y="117" width="1037" height="1047" fill="url(#bd-grain)"/><path d="M541 126v353M541 804v351M40 637h338m327 0h340" stroke="#c5a86c" stroke-opacity=".09" stroke-dasharray="1 8"/>${districtPanels()}${routeFoundation()}${TILES.map(t=>designedTile(t,rects[t.n])).join('')}${airportDesign(active)}${routeDirections(rects,active)}<rect x="28" y="120" width="1031" height="1041" rx="22" fill="none" stroke="url(#route-bronze)" stroke-width="1.5" opacity=".7"/></g>`;}
