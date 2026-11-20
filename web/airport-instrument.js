// Decorative figures from the approved concept. The plate, six equal sectors,
// pointer, labels and selected outcome are live interface elements.
export const INSTRUMENT_ART='./assets/airport-instrument-v13.png';
export const INSTRUMENT_LABELS=[[50,29],[77,44],[77,76],[50,85],[23,76],[23,44]];
const instrumentFigures=[
 {source:[402,66,236,139],target:[191,38,118,76]},
 {source:[670,197,196,140],target:[332,123,110,80]},
 {source:[650,483,243,145],target:[328,295,120,76]},
 {source:[418,599,229,164],target:[197,344,108,77]},
 {source:[177,485,230,177],target:[49,288,123,88]},
 {source:[211,202,186,147],target:[65,124,103,81]}
];
export function airportInstrument(){
 const point=(r,a)=>[250+Math.sin(a*Math.PI/180)*r,250-Math.cos(a*Math.PI/180)*r];
 const colors=['#835020','#1a5b5d','#6d3238','#255b3d','#284b68','#48365b'];
 return `<svg class="instrument-plate" viewBox="0 0 500 500" aria-hidden="true"><defs>
 <linearGradient id="instrument-gold" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#fff2ba"/><stop offset=".22" stop-color="#8d602a"/><stop offset=".45" stop-color="#ffe5a0"/><stop offset=".7" stop-color="#be893c"/><stop offset="1" stop-color="#fff0b9"/></linearGradient>
 <radialGradient id="instrument-shade"><stop stop-color="#031c24" stop-opacity=".9"/><stop offset=".43" stop-color="#031c24" stop-opacity=".25"/><stop offset=".8" stop-color="#031c24" stop-opacity=".15"/><stop offset="1" stop-color="#031c24" stop-opacity=".8"/></radialGradient>
 <radialGradient id="instrument-feather"><stop offset=".48" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient>
 <mask id="instrument-art-mask" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#instrument-feather)"/></mask>
 <image id="instrument-painting" href="${INSTRUMENT_ART}" width="1586" height="992"/>
 </defs><circle cx="250" cy="250" r="247" fill="#0a282b" stroke="#8c612e" stroke-width="5"/><circle cx="250" cy="250" r="240" fill="none" stroke="url(#instrument-gold)" stroke-width="9"/>
 ${colors.map((color,i)=>{const a=point(228,i*60-30),b=point(228,i*60+30);return `<path class="instrument-sector" data-sector="${i+1}" d="M250 250L${a}A228 228 0 0 1 ${b}Z" fill="${color}" stroke="#e2ba70" stroke-width="2"/>`;}).join('')}
 <circle cx="250" cy="250" r="227" fill="url(#instrument-shade)" pointer-events="none"/>
 ${instrumentFigures.map(({source:[x,y,w,h],target:[tx,ty,tw,th]},i)=>`<defs><clipPath id="instrument-art-clip-${i}"><rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="8"/></clipPath><radialGradient id="instrument-fade-${i}" gradientUnits="userSpaceOnUse" cx="${tx+tw/2}" cy="${ty+th/2}" r="${tw/2}"><stop offset=".55" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient><mask id="instrument-mask-${i}" maskUnits="userSpaceOnUse" x="${tx}" y="${ty}" width="${tw}" height="${th}"><rect x="${tx}" y="${ty}" width="${tw}" height="${th}" fill="url(#instrument-fade-${i})"/></mask></defs><g clip-path="url(#instrument-art-clip-${i})" mask="url(#instrument-mask-${i})"><svg x="${tx}" y="${ty}" width="${tw}" height="${th}" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid slice" overflow="hidden"><use href="#instrument-painting"/></svg></g>`).join('')}
 ${Array.from({length:120},(_,i)=>{const a=point(i%5===0?229:232,i*3),b=point(236,i*3);return `<path d="M${a}L${b}" stroke="#fae3a6" stroke-width="${i%5===0?1.6:.65}" opacity=".8"/>`;}).join('')}
 ${colors.map((_,i)=>{const [x,y]=point(231,i*60);return `<g transform="translate(${x} ${y})"><circle r="15" fill="#123330" stroke="url(#instrument-gold)" stroke-width="2.5"/><text text-anchor="middle" y="6" font-family="Georgia,serif" font-size="20" fill="#fff0bd">${i+1}</text></g>`;}).join('')}
 <circle cx="250" cy="250" r="54" fill="#062e32" stroke="url(#instrument-gold)" stroke-width="6"/><circle cx="250" cy="250" r="47" fill="none" stroke="#c69951" stroke-width="1"/>
 </svg>`;
}
