export const WORLD_ART={desktop:'./assets/world-v40/prologue-desktop.png',mobile:'./assets/world-v40/prologue-mobile.png',objects:'./assets/world-v40/objects.png',yaroslavl:'./assets/reference-v30/yaroslavl-panorama.png'};
const worldObjectIds={art:0,learning:1,budget:2,votes:3,campaign:4,city:5,swan:6,infrastructure:7};
let worldObjectSerial=0;
export function worldObject(name){const n=worldObjectIds[name]??worldObjectIds.city,u=443.5,x=n%4*u,y=Math.floor(n/4)*u,id='world-object-'+(++worldObjectSerial);return `<svg class="world-object" viewBox="${x} ${y} ${u} ${u}" aria-hidden="true"><defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${u}" height="${u}"/></clipPath></defs><image href="${WORLD_ART.objects}" width="1774" height="887" clip-path="url(#${id})"/></svg>`;}
