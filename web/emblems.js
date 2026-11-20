export const DISTRICT_STYLE={
 'ЦФО':{name:'Центральный федеральный округ',color:'#8a2538',symbol:'horse',x:350,y:281},
 'ПФО':{name:'Приволжский федеральный округ',color:'#953455',symbol:'deer',x:212,y:382},
 'СКФО':{name:'Северо-Кавказский федеральный округ',color:'#53406c',symbol:'eagle',x:744,y:276},
 'ЮФО':{name:'Южный федеральный округ',color:'#1d6557',symbol:'tower',x:842,y:383},
 'СЗФО':{name:'Северо-Западный федеральный округ',color:'#236780',symbol:'anchors',x:226,y:799},
 'УФО':{name:'Уральский федеральный округ',color:'#98642c',symbol:'bear',x:350,y:916},
 'СФО':{name:'Сибирский федеральный округ',color:'#244d73',symbol:'wolf',x:843,y:800},
 'ДФО':{name:'Дальневосточный федеральный округ',color:'#337052',symbol:'tiger',x:739,y:916}
};
const motifs={
 horse:'<path d="M17 50h30l-2-8-11-6 5-10 7 6 5-5-7-14-9-8-3 9-8 4-7 14 8 7-2 6Z"/><path class="engrave" d="m25 19 4 5-7 10 7 4m7-21 3 2m-11 21 10 5"/>',
 deer:'<path d="m26 30-6-8-7-1-2 4 10 8 5 4-3 13h18l-3-13 5-4 10-8-2-4-7 1-6 8Z"/><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" d="M28 31 21 14l-8-4-3-7m11 11-1-9m1 9-10 3-6-4m31 18 7-17 8-4 3-7m-11 11 1-9m-1 9 10 3 6-4"/><path class="engrave" d="m28 36 4 4 4-4m-7 10h6"/>',
 eagle:'<path d="m31 22-7-7-19-5 5 9 11 6-14-3 6 8 12 3-14 1 8 7 9-2-6 13 10-5 10 5-6-13 9 2 8-7-14-1 12-3 6-8-14 3 11-6 5-9-19 5-5 6 4-9-5-3-4 4Z"/><path class="engrave" d="M28 27h8m-4 1v13"/>',
 tower:'<path d="M15 12v10l5 5-3 25h30l-3-25 5-5V12h-8v7h-5v-7h-8v7h-5v-7Z"/><path class="engrave" d="M19 28h26M18 35h28M18 42h28M26 28v7m12 0v7M28 52V43a4 4 0 0 1 8 0v9"/>',
 anchors:'<g fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 15 30 33m-34-18c-5 12 8 24 20 19M9 30l3-5 5 3m15 18 3 4-5 4M48 15 18 48m34-18c5 12-8 24-20 19m23-19-3-5-5 3M32 46l-3 4 5 4M14 22l10-9m16 0 10 9"/><circle cx="12" cy="10" r="4"/><circle cx="52" cy="10" r="4"/></g>',
 bear:'<path d="m7 29 3-10 14-4 15 2 8-5 7 4 1 8 6 3-2 8-10 2-3 13h-8l-1-12-12-1-4 13h-8l2-17-8 2Z"/><path class="engrave" d="M46 22h3m-7 7 5 5M22 25l-3 9"/>',
 wolf:'<path d="m6 27 14-4 15 2 7-10 1-9 7 7 5-4-1 12 7 4-4 8-11 3-5 15h-6l1-16-13-2-5 18h-7l3-18-7 2-5-7Z"/><path class="engrave" d="m44 22 6 3m-10 5-7-1m-18-2 7 4"/>',
 tiger:'<path d="M17 16 9 10l-3 8 9 12 2 13 15 11 15-11 2-13 9-12-3-8-8 6-15-5Z"/><path class="engrave" d="m20 16 5 8m19-8-5 8m-7-12v10M15 29l10 4m-9 4 9 3m24-11-10 4m9 4-9 3m-13-15 3 2m7-2-3 2m-8 11 7 5 7-5m-7 5v6"/>'
};
let emblemSerial=0;
export function emblem(district,cls=''){
 const d=DISTRICT_STYLE[district];if(!d)return '';const id='herald-'+(++emblemSerial);
 const leaves=[-1,1].map(side=>`<g transform="translate(60 0) scale(${side} 1)"><path d="M7 125C49 111 55 74 46 41" fill="none" stroke="url(#${id})" stroke-width="1.8"/>${Array.from({length:8},(_,i)=>{const y=51+i*8,x=48-Math.pow((y-65)/11,2)*.6;return `<path d="M${x} ${y+8}Q${x-13} ${y+2} ${x-10} ${y-6}Q${x+2} ${y-1} ${x} ${y+8}Z" fill="url(#${id})"/><path d="M${x+1} ${y+8}Q${x+13} ${y+2} ${x+11} ${y-8}Q${x+2} ${y-3} ${x+1} ${y+8}Z" fill="url(#${id})"/>`;}).join('')}</g>`).join('');
 return `<svg class="district-emblem ${cls}" viewBox="0 0 120 144" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#fff1c5"/><stop offset=".25" stop-color="#b68a42"/><stop offset=".5" stop-color="#ffe8a8"/><stop offset=".75" stop-color="#b38a4c"/><stop offset="1" stop-color="#78532d"/></linearGradient><linearGradient id="${id}-field" x2=".9" y2="1"><stop stop-color="${d.color}"/><stop offset="1" stop-color="#122c35"/></linearGradient></defs>${leaves}<path d="M23 27Q60 16 97 27v48c0 23-23 42-37 51-14-9-37-28-37-51Z" fill="#081c26" transform="translate(0 3)"/><path d="M23 24Q60 13 97 24v48c0 23-23 42-37 51-14-9-37-28-37-51Z" fill="url(#${id})" stroke="#f1d595" stroke-width=".8"/><path d="M28 28Q60 20 92 28v43c0 20-20 38-32 46-12-8-32-26-32-46Z" fill="url(#${id}-field)" stroke="#3a2a1a"/><path d="M32 32Q60 25 88 32v38c0 18-17 34-28 42-11-8-28-24-28-42Z" fill="none" stroke="#e7c98d" stroke-opacity=".4" stroke-width=".7"/><path d="M31 32Q59 23 89 32L31 76Z" fill="#fff" opacity=".04"/><g transform="translate(28 38)" fill="url(#${id})" style="color:#efd49b">${motifs[d.symbol]}</g><path d="M47 17v-7l7 4 6-10 6 10 7-4v7Z" fill="url(#${id})" stroke="#eed6a2" stroke-width=".5"/><circle cx="60" cy="4" r="2" fill="#f5dba1"/><path d="m60 105 4 4-4 4-4-4Z" fill="url(#${id})"/><path d="m60 128 4 4-4 4-4-4Z" fill="url(#${id})"/></svg>`;
}
const crestPositions={'ЦФО':[329,323],'ПФО':[231,422],'СКФО':[756,323],'ЮФО':[857,422],'СЗФО':[231,856],'УФО':[329,956],'СФО':[857,856],'ДФО':[756,956]};
export function boardEmblems(){return Object.entries(DISTRICT_STYLE).map(([id,d])=>{const [x,y]=crestPositions[id];return `<g class="board-crest" data-district="${id}" tabindex="0" role="button" aria-label="${d.name}" transform="translate(${x} ${y})"><title>${d.name}</title><ellipse cy="8" rx="48" ry="50" fill="#061d29" opacity=".28"/><svg x="-35" y="-51" width="70" height="84" viewBox="0 0 120 144">${emblem(id).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</svg><rect x="-48" y="25" width="96" height="25" rx="12.5" fill="#102d37" fill-opacity=".78"/><path d="M-28 49H28" stroke="#cfb47b" stroke-opacity=".45" stroke-width=".7"/><text y="42" text-anchor="middle" font-family="Georgia,serif" font-size="20" letter-spacing="1" fill="#fff0ce">${id}</text></g>`;}).join('');}
