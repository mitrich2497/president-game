// Standalone illustrations and scalable ornament; all labels and values remain HTML.
export const REFERENCE_ART={moscow:'./assets/reference-v16/moscow-panorama.png',buildings:'./assets/reference-v16/development-buildings.png',crest:'./assets/reference-v16/moscow-crest.png',texture:'./assets/interface-v14/main-menu.png'};
let referenceBuildingId=0;
export function developmentBuilding(level){
 const crop={base:[15,180,620,490],headquarters:[675,75,735,590],regional_office:[1430,70,742,600]}[level]||[0,0,650,724];
 const id="building-clip-"+(++referenceBuildingId);
 return `<svg class="development-building" viewBox="${crop.join(' ')}" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><defs><clipPath id="${id}"><rect x="${crop[0]}" y="${crop[1]}" width="${crop[2]}" height="${crop[3]}"/></clipPath></defs><image href="${REFERENCE_ART.buildings}" width="2172" height="724" clip-path="url(#${id})"/></svg>`;
}
export function moscowCrest(){return `<svg class="moscow-crest" viewBox="0 0 1086 1448" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><image href="${REFERENCE_ART.crest}" width="1086" height="1448"/></svg>`;}
export function referenceCorners(){return `<span class="reference-corners" aria-hidden="true">${[0,1,2,3].map(i=>`<svg class="ref-corner ref-corner-${i}" viewBox="0 0 76 76"><path d="M3 74V28C18 28 28 18 28 3h46M9 74V33C23 31 31 23 33 9h41M15 65V39Q37 37 39 15h26"/><path d="M8 13C4 0 25 4 21 15S9 25 10 15c8-1 8-7 3-7M37 30c-13 3-15 17-8 13s8-15 17-9m-16 3c-3 13-17 15-13 8s15-8 9-17"/><path d="m42 27 7-9c-7-1-11 2-7 9m-15 15-9 7c-1-7 2-11 9-7" fill="currentColor"/></svg>`).join('')}</span>`;}
let referenceTextureId=0;
export function referenceTexture(){const id='emerald-texture-'+(++referenceTextureId);return `<svg class="reference-texture" aria-hidden="true"><defs><pattern id="${id}" width="300" height="180" patternUnits="userSpaceOnUse"><svg width="300" height="180" viewBox="200 845 240 65" preserveAspectRatio="none"><image href="${REFERENCE_ART.texture}" width="1672" height="941"/></svg></pattern></defs><rect width="100%" height="100%" fill="url(#${id})"/></svg>`;}
export function referenceHeader(title,backLabel,backAction){return `<header class="reference-header"><button class="reference-back" data-action="${backAction}"><span aria-hidden="true">←</span> ${backLabel}</button><h2>${title}</h2><span class="reference-header-ornament" aria-hidden="true">❧</span></header>`;}
