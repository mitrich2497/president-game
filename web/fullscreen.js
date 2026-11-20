// Native fullscreen must begin directly from the button's user gesture.
export function installFullscreen(doc,{notify=()=>{}}={}){
 const button=doc.querySelector('#fullscreen-toggle'),root=doc.documentElement;
 if(!button)return ()=>{};
 let pending=false;
 const active=()=>!!(doc.fullscreenElement||doc.webkitFullscreenElement);
 const supported=!!(root.requestFullscreen||root.webkitRequestFullscreen);
 function update(){const full=active();button.setAttribute('aria-pressed',String(full));button.setAttribute('aria-label',full?'Выйти из полного экрана':'На весь экран');button.title=full?'Выйти из полного экрана · Esc':'На весь экран';button.dataset.fullscreen=String(full);}
 async function toggle(){
  if(pending)return;
  if(!supported){notify('Этот браузер не поддерживает полный экран. Поле уже подстроено под размер окна.');return;}
  pending=true;
  try{if(active()){const exit=doc.exitFullscreen||doc.webkitExitFullscreen;await exit.call(doc);}else{const enter=root.requestFullscreen||root.webkitRequestFullscreen;await enter.call(root);}}
  catch{notify('Браузер не разрешил полный экран. Можно продолжить игру в этом окне.');}
  finally{pending=false;update();}
 }
 button.addEventListener('click',toggle);doc.addEventListener('fullscreenchange',update);doc.addEventListener('webkitfullscreenchange',update);update();
 return ()=>{button.removeEventListener('click',toggle);doc.removeEventListener('fullscreenchange',update);doc.removeEventListener('webkitfullscreenchange',update);};
}
