// Illustration regions from the approved concepts. All text and controls are live HTML.
export const PALACE_ART={
 crest:'./assets/interface-v24/president-crest.png',
 hall:'./assets/interface-v14/main-menu.png',
 city:'./assets/interface-v14/city-development.png',
 components:'./assets/interface-v14/components-cards.png'
};
export function palacePainting(subject,cls=''){
 if(subject==='yaroslavl')return `<img class="palace-painting palace-landscape ${cls}" src="./assets/reference-v30/yaroslavl-panorama.png" alt="" aria-hidden="true" draggable="false">`;
 if(subject==='crest')return `<img class="palace-painting palace-crest-image ${cls}" src="${PALACE_ART.crest}" alt="" aria-hidden="true" draggable="false">`;
 const crops={hall:[PALACE_ART.hall,520,0,1140,830],crest:[PALACE_ART.hall,117,22,283,114],corner:[PALACE_ART.hall,0,0,62,62],yaroslavl:[PALACE_ART.city,4,272,1008,540],swan:[PALACE_ART.components,859,128,418,328],lawyer:[PALACE_ART.components,139,558,324,354]};
 const [src,x,y,w,h]=crops[subject]||crops.hall;
 return `<svg class="palace-painting ${cls}" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href="${src}" width="1672" height="941"/></svg>`;
}
export function palaceCorners(){return '<span class="palace-corners" aria-hidden="true">'+[0,1,2,3].map(n=>`<span class="palace-corner corner-${n}">${palacePainting('corner')}</span>`).join('')+'</span>';}
export function palaceFlourish(){return `<svg class="palace-flourish" viewBox="0 0 300 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M1 12h94q12-14 26 0t29 0q15-14 29 0t26 0h94M82 12q12 12 24 0m88 0q12 12 24 0M119 12q5-10 12 0m38 0q7-10 12 0"/><path d="m150 7 5 5-5 5-5-5Z" fill="currentColor"/></svg>`;}
