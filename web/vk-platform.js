export const VK_APP_ID='54891960';
export const VK_ENTRY_PATH='/vk.html';
export const VK_LAUNCH_LINK='https://vk.ru/app'+VK_APP_ID;
export const VK_FRAME_POLICY="frame-ancestors 'self' https://vk.ru https://*.vk.ru https://vk.com https://*.vk.com";

const roomCode=value=>typeof value==='string'&&/^[A-Z2-9]{6}$/i.test(value)?value.toUpperCase():'';
const roomFragment=code=>code?'/room/'+code:'';
function codeFromFragment(fragment){
 if(typeof fragment!=='string')return '';
 let value;
 try{value=decodeURIComponent(fragment).replace(/^#/,'');}catch{return '';}
 const route=/^\/?room\/([A-Z2-9]{6})\/?(?:\?.*)?$/i.exec(value);
 if(route)return roomCode(route[1]);
 // Older invitations used a room parameter instead of a route.
 const params=new URLSearchParams(value.replace(/^\/\?/,'?'));
 const rooms=params.getAll('room');
 return rooms.length===1?roomCode(rooms[0]):'';
}

function launchPaths({basePath='/'}={}){
 const path='/'+basePath.replace(/^\/+|\/+$/g,'');
 const directory=path==='/'?path:path+'/';
 return {directory,entry:directory+'vk.html'};
}

export function isVkLaunch(url,options){
 const id=url.searchParams.get('vk_app_id');
 const {directory,entry}=launchPaths(options);
 return url.pathname===entry?(id===null||id===VK_APP_ID):url.pathname===directory&&id===VK_APP_ID;
}
export function readRoomInvitation(url,options){
 const queryCode=roomCode(url.searchParams.get('room')?.trim());
 return isVkLaunch(url,options)?codeFromFragment(url.hash)||queryCode:queryCode;
}
export function updateRoomAddress(url,code,options){
 const target=new URL(url),valid=roomCode(code);
 if(valid)target.searchParams.set('room',valid);else target.searchParams.delete('room');
 target.searchParams.delete('multiplayer');
 if(isVkLaunch(target,options))target.hash=roomFragment(valid);
 return target;
}
export function vkRoomInvite(code){
 const valid=roomCode(code);
 return valid?VK_LAUNCH_LINK+'#'+roomFragment(valid):null;
}

async function loadVkBridge(){
 // The pinned official SDK is served by the game host.
 await import('./vendor/vk-bridge-3.0.2.min.js');
 return window.vkBridge;
}
async function sendWithTimeout(bridge,method,params){
 let timeout;
 try{
  return await Promise.race([
   bridge.send(method,params),
   new Promise(resolve=>{timeout=setTimeout(()=>resolve(null),1800);})
  ]);
 }finally{clearTimeout(timeout);}
}

export function createVkPlatform({url,basePath='/',loadBridge=loadVkBridge,onRoomInvitation,onRestore}){
 const options={basePath},enabled=isVkLaunch(url,options);
 let bridge=null,latestRoom=readRoomInvitation(url,options);
 const ready=enabled?loadBridge().then(async sdk=>{
  if(!sdk?.isEmbedded())return;
  sdk.subscribe(({detail})=>{
   if(detail?.type==='VKWebAppViewRestore')onRestore?.();
   if(detail?.type==='VKWebAppChangeFragment'||detail?.type==='VKWebAppLocationChanged'){
    const code=codeFromFragment(detail.data?.location);
    if(code&&code!==latestRoom)onRoomInvitation?.(code);
   }
  });
  await sendWithTimeout(sdk,'VKWebAppInit');
  bridge=sdk;
  if(latestRoom!==readRoomInvitation(url,options))updateLocation();
 }).catch(()=>{}):Promise.resolve();

 function updateLocation(){
  if(bridge)bridge.send('VKWebAppSetLocation',{location:roomFragment(latestRoom),replace_state:true}).catch(()=>{});
 }
 return {
  enabled,ready,
  setRoom(code){latestRoom=roomCode(code);updateLocation();},
  async copyInvite(link){
   if(!bridge)return false;
   try{return (await sendWithTimeout(bridge,'VKWebAppCopyText',{text:link}))?.result===true;}
   catch{return false;}
  }
 };
}
