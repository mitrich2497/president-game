import {TILES} from './data.js';
import {DISTRICT_PANELS} from './board-design.js';
import {routeDefs,routeDirections,airportTransits} from './board-route.js';

// The approved painting is an atlas, not a screenshot of game state. Every cell
// is mounted on the existing route geometry; ownership and tokens stay live.
export const BOARD_MASTER='./assets/board-master-v13.png';
export const MASTER_GRIDS={
 TL:{x:[18,158,293,422,544],y:[125,262,405,539,680]},
 TR:{x:[573,702,834,967,1110],y:[125,262,405,539,680]},
 BL:{x:[18,158,293,422,544],y:[727,863,998,1139,1300]},
 BR:{x:[573,694,832,967,1110],y:[727,863,998,1139,1300]}
};
export function masterCell(t){const g=MASTER_GRIDS[t.quadrant];return {x:g.x[t.col],y:g.y[t.row],w:g.x[t.col+1]-g.x[t.col],h:g.y[t.row+1]-g.y[t.row]};}
function masterSlice(source,target,cls=''){return `<svg class="${cls}" x="${target.x}" y="${target.y}" width="${target.w}" height="${target.h}" viewBox="${source.x} ${source.y} ${source.w} ${source.h}" preserveAspectRatio="none" overflow="hidden"><use href="#campaign-master-painting"/></svg>`;}
const districtNames={cfo:'ЦФО',pfo:'ПФО',skfo:'СКФО',yufo:'ЮФО',szfo:'СЗФО',ufo:'УФО',sfo:'СФО',dfo:'ДФО'};
function premiumDistricts(){return DISTRICT_PANELS.map((p,i)=>{
 const g=MASTER_GRIDS[['TL','TR','BL','BR'][i]],polys=p.diagonal==='down'?[`0,0 ${p.w},0 ${p.w},${p.h}`,`0,0 0,${p.h} ${p.w},${p.h}`]:[`0,0 ${p.w},0 0,${p.h}`,`${p.w},0 ${p.w},${p.h} 0,${p.h}`];
 return `<g class="painted-districts">${masterSlice({x:g.x[1],y:g.y[1],w:g.x[3]-g.x[1],h:g.y[3]-g.y[1]},p)}<g transform="translate(${p.x} ${p.y})">${[p.a,p.b].map((id,j)=>`<polygon class="district-hit" data-district="${districtNames[id]}" points="${polys[j]}" fill="transparent" role="button" tabindex="0" aria-label="${districtNames[id]}: города округа"><title>${districtNames[id]}</title></polygon>`).join('')}</g></g>`;
 }).join('');}
function premiumAirport(active){return `<g class="airport-art" pointer-events="none"><defs><clipPath id="master-airport-clip"><path d="M541 524 656 642 541 762 426 642Z"/></clipPath><linearGradient id="master-arrow-gold" x2="0" y2="1"><stop stop-color="#fff1bc"/><stop offset=".5" stop-color="#e6b65a"/><stop offset="1" stop-color="#8e5e25"/></linearGradient><marker id="master-in" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto"><path d="M1 1 9 5 1 9Z" fill="#ffe1a0" stroke="#8e6a32" stroke-width=".35"/></marker><marker id="master-out" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto"><path d="M1 1 9 5 1 9Z" fill="#60efda" stroke="#007e76" stroke-width=".35"/></marker></defs>
 <g clip-path="url(#master-airport-clip)">${masterSlice({x:419,y:572,w:279,h:283},{x:426,y:524,w:230,h:238})}</g><path d="M541 524 656 642 541 762 426 642Z" fill="none" stroke="#f1cb80" stroke-width="1.4"/>
 <g fill="none" stroke-width="5"><path class="route-in" d="M465 502v36" stroke="#edc77e" marker-end="url(#master-in)"/><path class="route-out" d="M445 558h-32" stroke="#60efda" marker-end="url(#master-out)"/><path class="route-in" d="M680 558h-41" stroke="#edc77e" marker-end="url(#master-in)"/><path class="route-out" d="M618 537v-35" stroke="#60efda" marker-end="url(#master-out)"/><path class="route-in" d="M405 724h39" stroke="#edc77e" marker-end="url(#master-in)"/><path class="route-out" d="M465 745v33" stroke="#60efda" marker-end="url(#master-out)"/><path class="route-in" d="M618 778v-33" stroke="#edc77e" marker-end="url(#master-in)"/><path class="route-out" d="M639 724h40" stroke="#60efda" marker-end="url(#master-out)"/></g>
 ${[[465,558,6],[618,558,42],[465,724,18],[618,724,30]].map(([x,y,n])=>`<g transform="translate(${x} ${y})"><circle r="16" fill="#062e31" stroke="#e8c073" stroke-width="1.8"/><text y="5" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#ffebba">${n}</text></g>`).join('')}${airportTransits(active)}</g>`;}
export function premiumBoard(rects,active=-1){return `<defs>${routeDefs()}<image id="campaign-master-painting" href="${BOARD_MASTER}" width="1122" height="1402"/></defs><rect x="25" y="117" width="1037" height="1047" fill="#052c2b"/>${premiumDistricts()}<g class="painted-cells" aria-hidden="true" pointer-events="none">${TILES.map(t=>masterSlice(masterCell(t),rects[t.n],'painted-cell')).join('')}</g>${premiumAirport(active)}${routeDirections(rects,active)}<rect x="28" y="120" width="1031" height="1041" rx="8" fill="none" stroke="#b38840" stroke-width="2" pointer-events="none"/>`;}
