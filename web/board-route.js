// The navigation layer follows the printed numbering, including all four visits
// to the one airport. It is shared by the live board and the exported atlas.
export const AIRPORT_TRANSITS=[
 {from:6,to:7,d:'M455 572 Q420 642 455 710',x:432,y:642,angle:90},
 {from:18,to:19,d:'M479 735 Q541 779 604 735',x:541,y:771,angle:0},
 {from:30,to:31,d:'M628 710 Q663 642 628 572',x:652,y:642,angle:-90},
 {from:42,to:43,d:'M604 547 Q541 504 479 547',x:541,y:517,angle:0,label:'43 ← 42'}
];
const roundRoute=points=>{
 const corners=points.map((b,i)=>{
  const a=points[(i+points.length-1)%points.length],c=points[(i+1)%points.length],incoming=Math.hypot(b[0]-a[0],b[1]-a[1]),outgoing=Math.hypot(c[0]-b[0],c[1]-b[1]),r=Math.min(12,incoming/2,outgoing/2);
  return {b,enter:[b[0]-(b[0]-a[0])/incoming*r,b[1]-(b[1]-a[1])/incoming*r],exit:[b[0]+(c[0]-b[0])/outgoing*r,b[1]+(c[1]-b[1])/outgoing*r]};
 });
 return corners.map(({b,enter,exit},i)=>`${i?'L':'M'}${enter.join(' ')}Q${b.join(' ')} ${exit.join(' ')}`).join('')+'Z';
};
export function routeDefs(){return `
 <linearGradient id="route-bronze" x1="0" y1="0" x2=".4" y2="1"><stop stop-color="#d0b77e"/><stop offset=".5" stop-color="#776a4c"/><stop offset="1" stop-color="#c7ac75"/></linearGradient>
 <linearGradient id="route-surface" x2=".3" y2="1"><stop stop-color="#35535a"/><stop offset=".45" stop-color="#17343f"/><stop offset="1" stop-color="#29464b"/></linearGradient>
 <linearGradient id="tile-surface" x2=".5" y2="1"><stop stop-color="#36565b" stop-opacity=".56"/><stop offset=".6" stop-color="#1c3d47" stop-opacity=".18"/><stop offset="1" stop-color="#0c2632" stop-opacity=".66"/></linearGradient>
 <marker id="route-transit-tip" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1 9 5 1 9 3 5Z" fill="#d9c18d"/></marker>`;}
export function routeFoundation(){
 const lanes=[
 [[402,621],[32,621],[32,124],[527,124],[527,496],[405,496],[405,248],[154,248],[154,499],[402,499]],
 [[405,782],[527,782],[527,1157],[32,1157],[32,652],[402,652],[402,778],[154,778],[154,1031],[405,1031]],
 [[682,652],[1053,652],[1053,1157],[559,1157],[559,782],[681,782],[681,1031],[931,1031],[931,778],[682,778]],
 [[559,496],[559,124],[1053,124],[1053,621],[682,621],[682,499],[931,499],[931,248],[681,248],[681,496]]
 ];
 return `<g class="route-foundation" fill="none" stroke-linecap="butt" stroke-linejoin="round" pointer-events="none">
 ${lanes.map(p=>{const d=roundRoute(p);return `<path d="${d}" fill="#041822" stroke="#041822" stroke-width="3" opacity=".8" transform="translate(0 4)"/><path d="${d}" fill="url(#route-surface)" stroke="url(#route-bronze)" stroke-width="1.8"/>`;}).join('')}
 </g>`;
}
export function adjacentDirections(rects){
 const steps=[];
 for(let from=0;from<48;from++){
  const to=(from+1)%48,a=rects[from],b=rects[to];if(!a||!b)continue;
  const p={x:a.x+a.w/2,y:a.y+a.h/2},q={x:b.x+b.w/2,y:b.y+b.h/2};
  steps.push({from,to,x:(p.x+q.x)/2,y:(p.y+q.y)/2,angle:Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI});
 }
 return steps;
}
export function routeDirections(rects,active=-1){return `<g class="route-directions" pointer-events="none">
 ${adjacentDirections(rects).map(p=>`<g class="route-step ${p.from===active?'next-step':''}" data-route="${p.from}-${p.to}" transform="translate(${p.x} ${p.y}) rotate(${p.angle})"><rect x="-10" y="-8" width="20" height="16" rx="7" fill="#122c36" stroke="#ae9766" stroke-opacity=".75" stroke-width=".9"/><path d="M-5-4 0 0-5 4M1-4 6 0 1 4" fill="none" stroke="${p.from===active?'#fff0ba':'#dec58f'}" stroke-width="${p.from===active?2.2:1.7}" stroke-linecap="round" stroke-linejoin="round"/></g>`).join('')}
 </g>`;}
export function airportTransits(active=-1){return `<g class="airport-transits" pointer-events="none">
 ${AIRPORT_TRANSITS.map(t=>`<g data-route="${t.from}-${t.to}" class="airport-transit ${active===t.from?'next-step':''}"><path d="${t.d}" fill="none" stroke="#051c27" stroke-width="5"/><path d="${t.d}" fill="none" stroke="${active===t.from?'#ffe6a7':'#c8b17e'}" stroke-opacity=".85" stroke-width="1.8" stroke-dasharray="3 5" marker-end="url(#route-transit-tip)"/><g transform="translate(${t.x} ${t.y}) rotate(${t.angle})"><rect x="-29" y="-8" width="58" height="16" rx="8" fill="#102e39" stroke="#a9906255"/><text y="3.2" text-anchor="middle" font-family="Arial,sans-serif" font-size="9.5" font-weight="600" letter-spacing="1" fill="#ebd8b1">${t.label||`${String(t.from).padStart(2,'0')} → ${String(t.to).padStart(2,'0')}`}</text></g></g>`).join('')}
 </g>`;}
