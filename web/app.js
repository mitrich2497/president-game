import {createRoomClient,createRoomStorage} from './multiplayer-client.js';
import {createVkPlatform,isVkLaunch,readRoomInvitation,updateRoomAddress,vkRoomInvite} from './vk-platform.js';
import {roomScreen,roomBadge,ROOM_ACTIONS} from './multiplayer-ui.js';
import {createArrivalDirector} from './arrival-motion.js';
import {worldScreen,worldPrologue,worldChoice,worldStep,worldReadingCount} from './campaign-world.js';
import {arrivalKind} from './arrival-ui.js';
import {newsPreferences,withCampaignNews} from './campaign-news.js';
import {createNewsOverlay,newsSettingsContent,newsJournalContent,newsStoryCard,newsCard,NEWS_SAMPLE} from './news-ui.js';
import {heroChoiceState,heroHistoryDetails,setupRosterContent} from './character-selection.js';
import {infrastructurePanel} from './infrastructure-ui.js';
import {installFullscreen} from './fullscreen.js';
import {CAMPAIGN_PLAYLIST,musicDuration} from './ambient-music.js';
import {presentationPlayerId} from './campaign-ui.js';
import {createCampaignEntrance} from './campaign-entrance.js';
import {DECK_NAMES,deckEventContent,swanDebtContent,deckCollection,deckVerdictContent,courtResult,courtOfferContent} from './deck-ui.js';
import {botTurnAction} from './ability-actions.js';
import {rulesContent,ruleLocation,ruleStep,ruleSearchMarkup} from './rulebook.js';
import {adaptRuleLayout,ruleReadingLayout} from './rulebook-layout.js';
import {airportInstrument,INSTRUMENT_LABELS} from './airport-instrument.js';
import {palaceFlourish} from './palace-art.js';
import {launchScreen,setupScreen,heroesContent,defaultRoster,resizeRoster,chooseHero} from './lobby.js';
import {animateDice,settleDice} from './dice-motion.js';
import {createVisualDirector,installVisualInteractions,clearVisualEffects,revealVisualDialog,dismissVisualDialog,showResourceFeedback,emphasizeDevelopment,revealAirportRoute,revealMovementPhase} from './visual-director.js';
import {createSoundscape} from './sound.js';
import {momentFor,showMoment,clearMoments,floatIncome} from './experience.js';
import {actionSoundCues} from './audio-events.js';
import {animateJourney,celebrateArrival,settleAnimations} from './motion.js';
import {menuContent,newCampaignContent,lawyerHandContent,chronicleContent,illustratedCollection} from './interface.js';
import {parseCampaign,campaignForArchive,createCampaignStorage} from './storage.js';
import {presentTurn} from './turn-flow.js';
import {DESIGN_ASSETS,DISTRICT_IDS,designImage,CITY_ICON_ASSETS} from './design-assets.js';
import {CITY_ART} from './city-catalog.js';
import {DISTRICT_STYLE,emblem} from './emblems.js';
import {CITIES,TILES} from './data.js';
import {CITY_BY_ID,TILE_BY_ID,AIRPORTS,EXITS,PERSONAS,SWAN,LAWYERS,newGame,reduce,scenario,getVotes,money,canHQ,canOffice,tileName,viewerId,cityVotes,actionPlayerId,canControl,lawsuitTargets,infrastructureTurn,canSettleSwan} from './engine.js';
import {renderScreen,portrait,primary,secondary,icon,frame,point,tileRect,GATES,EXIT_GATES,cityDetails,overviewContent,candidateContent} from './view.js';
const $=s=>document.querySelector(s),app=$('#app'),dialog=$('#dialog');
installFullscreen(document,{notify:message=>toast(message)});
const visualDirector=createVisualDirector(app);
const arrivalDirector=createArrivalDirector(app);
const campaignEntrance=createCampaignEntrance(app);
installVisualInteractions(app);installVisualInteractions(dialog);
const KEY='president.campaign.v1',BACKUP='president.campaign.backup.v1',PREVIOUS='president.campaign.before-new.v1';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const delay=ms=>new Promise(r=>setTimeout(r,(document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches)?Math.min(ms,30):ms));
const randomDie=()=>1+Math.floor(Math.random()*6);
function rollDice(){
 const qa=new URLSearchParams(location.search);
 if(isolatedTest&&state.phase==='jailed'&&['double','miss','bot-double','bot-miss'].includes(qa.get('jail')))return qa.get('jail').endsWith('double')?[3,3]:[2,5];
 return [randomDie(),randomDie()];
}
let storageAvailable=true;
// A visible QA session never reads or writes browser storage, even on the same origin.
const isolatedTest=new URLSearchParams(location.search).get('test')==='1',testRecords=new Map();
const testStorage={getItem:key=>testRecords.get(key)??null,setItem:(key,value)=>testRecords.set(key,value),removeItem:key=>testRecords.delete(key)};
const storage=createCampaignStorage(()=>isolatedTest?testStorage:window.localStorage,()=>{storageAvailable=false;queueMicrotask(()=>toast('Сохранение в браузере недоступно. Партия работает до закрытия вкладки.'));});
const stored=storage.read(KEY);let state=parseCampaign(stored);
if(!state){
 if(stored){storage.write(KEY+'.damaged',stored);state=parseCampaign(storage.read(KEY+'.previous'));const message=state?'Восстановлена предыдущая сохранённая позиция.':'Сохранение повреждено. Открыта новая кампания; исходная запись сохранена отдельно.';queueMicrotask(()=>toast(message));}
 state??=newGame();
}
let screen='menu',roster=defaultRoster(),activeSeat=0,selectedFaction=null,previewPersona=null,hasSaved=!!parseCampaign(stored)||!!(stored&&parseCampaign(storage.read(KEY+'.previous'))),campaignEpoch=0;
const WORLD_SEEN='president.world.seen.v1';
let worldView={tab:'premise',faction:'empresses',persona:'catherine',detail:'ability',page:0,origin:'menu'},worldOnboarding=false;
let forecast=false,forecastSum=7;
let soundPreferences={};try{soundPreferences=JSON.parse(storage.read('president.audio.v2')||'{}')||{};}catch{}
const soundscape=createSoundscape({enabled:storage.read('president.sound.v1')!=='off',effectsVolume:soundPreferences.effectsVolume,musicVolume:soundPreferences.musicVolume,musicEnabled:soundPreferences.musicEnabled===true,onChange:enabled=>storage.write('president.sound.v1',enabled?'on':'off'),onSettingsChange:value=>{storage.write('president.audio.v2',JSON.stringify(value));updateMusicStatus();},onMusicStateChange:()=>updateMusicStatus()});
let newsSettings;try{newsSettings=newsPreferences(JSON.parse(storage.read('president.news.v1')||'{}'));}catch{newsSettings=newsPreferences();}
const newsOverlay=createNewsOverlay({document,initial:state.news||[],onSound:()=>soundscape.play('arrival',{gain:.35})});
let campaignPaused=false;
document.body.classList.toggle('reduce-motion',storage.read('president.motion.v1')==='reduced');
let busy=false,botRunning=false,selected=state.players[state.current].position,zoom=1,newPersona='catherine',newMode='bot',wheelValue=null,wheelBusy=false,stagedDice=null,stagedDicePurpose='move';
let roomServerInfo=null,roomFaction=null,offlineCampaign=null;
const launchUrl=new URL(location.href),inVk=!isolatedTest&&isVkLaunch(launchUrl);
let invitationCode=readRoomInvitation(launchUrl),openingVkInvitation=false;
if(inVk&&invitationCode)history.replaceState(history.state,'',updateRoomAddress(launchUrl,invitationCode));
function openVkInvitation(code){
 if(!code||code===invitationCode||openingVkInvitation)return;
 openingVkInvitation=true;network.stop();
 location.replace(updateRoomAddress(new URL(location.href),code).href);
}
const vkPlatform=inVk?createVkPlatform({url:launchUrl,onRoomInvitation:openVkInvitation,onRestore:()=>network.reconnect()}):null;
if(inVk)window.addEventListener('hashchange',()=>openVkInvitation(readRoomInvitation(new URL(location.href))));
let roomNameDraft='Игрок',roomCodeDraft=invitationCode;
function replaceRoomAddress(code){
 const url=updateRoomAddress(new URL(location.href),code);
 if(url.href!==location.href)history.replaceState(history.state,'',url);
 invitationCode=code||'';roomCodeDraft=invitationCode;
 vkPlatform?.setRoom(invitationCode);
}
const vkUserId=inVk?launchUrl.searchParams.get('vk_user_id'):null;
const roomStorage=isolatedTest?testStorage:createRoomStorage(()=>localStorage,vkUserId);
const legacyRoomStorage=isolatedTest?null:createRoomStorage(()=>sessionStorage,vkUserId);
const network=createRoomClient({storage:roomStorage,legacyStorage:legacyRoomStorage,onEntryChange:()=>{if(screen==='room')render();},onLeft:()=>{
 replaceRoomAddress(null);roomFaction=null;openMenu();
},onExpired:()=>{
 campaignEpoch++;busy=false;settleAnimations();settleDice();
 if(state.network&&offlineCampaign){state=offlineCampaign.state;hasSaved=offlineCampaign.hasSaved;offlineCampaign=null;}
 if(dialog.open)dialog.close();screen='room';newsOverlay.reset(state.news||[]);render();
},roomCode:invitationCode,onError:message=>{toast(message);const el=app.querySelector('.room-error');if(el)el.textContent=message;},onConnection:connected=>{
 if(state.network){state.network.connected=connected;if(screen==='game')render();}
 else if(screen==='room')render();
},onUpdate:async(data,{changed,initial})=>{
 if(!isolatedTest&&(data.code!==invitationCode||inVk&&initial))replaceRoomAddress(data.code);
 if(!data.started){if(screen==='room'){const old=app.querySelector('.room-seats')?.innerHTML;const template=document.createElement('template');template.innerHTML=roomScreen(data,{faction:roomFaction,connected:network.connected});if(changed||old!==template.content.querySelector('.room-seats')?.innerHTML)render();}return;}
 const next=data.game;if(!next)return;next.network.revision=data.revision;
 if(!state.network){offlineCampaign={state,hasSaved};campaignEpoch++;campaignPaused=false;screen='game';if(dialog.open)dialog.close();state=next;newsOverlay.reset(state.news||[]);selected=state.players[state.current].position;render();soundscape.play('campaign');showPendingEvent();return;}
 if(changed){
  if(dialog.open&&!wheelBusy&&dialog.querySelector('.hand-dialog,.deck-event-dialog,.court-offer-dialog,.infrastructure-dialog,.city-dialog'))dialog.close();
  if(data.event&&data.event.previousRevision===state.network.revision&&screen==='game')await commit(data.event.action,{dice:!!data.event.action.dice,remote:data});
  else{state=next;selected=state.players[state.current].position;render();showPendingEvent();}
 }else{state.network={...next.network};const badge=document.querySelector('.room-game-badge');if(badge){const html=roomBadge(state);if(badge.outerHTML!==html)badge.outerHTML=html;}}
}});
async function openRoom(){
 const server=document.querySelector('meta[name="president-room-server"]')?.content;
 if(server){
  const target=new URL(server);
  target.searchParams.set(invitationCode?'room':'multiplayer',invitationCode||'1');
  location.assign(target.href);return;
 }
 if(busy)return;if(dialog.open)dialog.close();campaignEpoch++;campaignPaused=false;screen='room';render();
 // Restoring a seat must retry even if the initial server-info request fails.
 if(network.active){await network.resume();return;}
 const epoch=campaignEpoch;
 try{roomServerInfo=await network.info();}catch(error){
  if(epoch!==campaignEpoch||screen!=='room'||network.active)return;
  if(['127.0.0.1','localhost'].includes(location.hostname)){try{const response=await fetch('./network-launch.json',{cache:'no-store'}),config=await response.json(),target=new URL(config.url);if(target.protocol==='http:'&&(['127.0.0.1','localhost'].includes(target.hostname)||/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(target.hostname))){target.searchParams.set('multiplayer','1');if(invitationCode)target.searchParams.set('room',invitationCode);location.assign(target.href);return;}}catch{}}
  toast(error.message);const el=app.querySelector('.room-error');if(el)el.textContent=error.message;return;
 }
 if(epoch===campaignEpoch&&screen==='room'&&!network.active)render();
}
function showRoomInfo(){const data=network.snapshot;if(!data)return;modal('Сетевая кампания','<div class="room-notice"><p>Комната <strong>'+data.code+'</strong> · вы играете за '+escape(state.players[data.you]?.name||'выбранного героя')+'.</p><ul>'+data.members.map(m=>'<li>'+escape(m.name)+' — '+(m.connected?'на связи':'ожидаем подключения')+'</li>').join('')+'</ul><p>Открытые окна не приостанавливают соперников. Решение вне очереди появится только у нужного участника.</p><p>Место сохранено в этом браузере. После закрытия вкладки откройте игру или ссылку комнаты — вернутся ваш герой, карты и текущий ход. При обрыве интернета связь восстанавливается автоматически. Партия хранится семь дней после последнего действия.</p>'+secondary('Правила игры','rules')+secondary('Настройки','settings')+secondary('Мир кампании','world')+secondary('Скопировать приглашение','roomCopy')+secondary('В главное меню','roomBack')+'</div>','Комната '+data.code);}
function roomInvite(){
 const code=network.snapshot.code;
 if(inVk)return vkRoomInvite(code);
 const base=['127.0.0.1','localhost','[::1]'].includes(location.hostname)?roomServerInfo?.addresses?.[0]||location.origin+'/':location.origin+'/';
 const url=new URL(base);url.searchParams.set('room',code);return url.href;
}
function roomControls(){
 if(!state.network)return;
 if(!state.network.connected)app.insertAdjacentHTML('beforeend','<div class="room-connection-note" role="status">Восстанавливаем связь · ваше место сохранено</div>');
 const label=app.querySelector('.arrival-goal');if(label)label.innerHTML=roomBadge(state);else app.insertAdjacentHTML('beforeend',roomBadge(state));
 if(!canControl(state))for(const button of app.querySelectorAll('[data-action]'))if(ROOM_ACTIONS.has(button.dataset.action))button.disabled=true;
}
function syncNews(){newsOverlay.sync(state,newsSettings,{visible:screen==='game',suspended:document.hidden||dialog.open||campaignEntrance.active});}
function render(){
 queueMicrotask(syncNews);
 document.body.dataset.screen=screen;
 document.body.classList.toggle('isolated-test',isolatedTest);
 const lobbyFocus=document.activeElement&&app.contains(document.activeElement)?{...document.activeElement.dataset}:null;
 const restoreLobbyFocus=()=>{if(lobbyFocus?.action)[...app.querySelectorAll('[data-action]')].find(el=>Object.entries(lobbyFocus).every(([k,v])=>el.dataset[k]===v))?.focus({preventScroll:true});};
 document.body.classList.toggle('in-lobby',screen!=='game');
 if(screen==='room'){
  const inputId=document.activeElement?.id;
  app.innerHTML=roomScreen(network.snapshot,{faction:roomFaction,info:roomServerInfo,connected:network.connected,recovering:network.active&&(!network.snapshot||network.snapshot.started),entering:network.entering,code:network.entering?network.code:network.code||invitationCode});
  const nameInput=$('#room-name'),codeInput=$('#room-code');
  if(nameInput)nameInput.value=roomNameDraft;
  if(codeInput)codeInput.value=roomCodeDraft;
  if(inputId==='room-name')nameInput?.focus({preventScroll:true});
  if(inputId==='room-code')codeInput?.focus({preventScroll:true});
  restoreLobbyFocus();return;
 }
 if(screen==='menu'){app.innerHTML=launchScreen(offlineCampaign?.state||state,{saved:offlineCampaign?.hasSaved??hasSaved,sound:soundscape.enabled,online:network.active,previous:!!parseCampaign(storage.read(PREVIOUS))});restoreLobbyFocus();visualDirector.rendered(screen);arrivalDirector.rendered(screen);return;}
 if(screen==='setup'){app.innerHTML=setupScreen(roster,activeSeat,{saved:hasSaved,faction:selectedFaction,preview:previewPersona});restoreLobbyFocus();visualDirector.rendered(screen);arrivalDirector.rendered(screen);return;}
 if(screen==='world'||screen==='prologue'){app.innerHTML=screen==='prologue'?worldPrologue({onboarding:true}):worldScreen(state,{...worldView,onboarding:worldOnboarding,pageSize:worldReadingCount(window.innerWidth,window.innerHeight)});restoreLobbyFocus();visualDirector.rendered(screen);arrivalDirector.rendered(screen);return;}

 const focus=document.activeElement,focusData=focus&&app.contains(focus)?{...focus.dataset}:null;
 const scroll=$('.board-window'),sx=scroll?.scrollLeft||0,sy=scroll?.scrollTop||0,forecastScroll=$('.forecast-sums')?.scrollLeft||0;
 app.innerHTML=renderScreen(state,selected,zoom,busy,stagedDice,{forecast:forecast&&state.phase==='ready'&&!busy,forecastSum,sound:soundscape.enabled,dicePurpose:stagedDicePurpose});
 roomControls();
 if(!storageAvailable){const note=document.createElement('p');note.className='save-status';note.textContent='Партия сохранится только до закрытия этой вкладки';app.querySelector('.game-stage').append(note);}
 if(scroll){$('.board-window').scrollLeft=sx;$('.board-window').scrollTop=sy;}
 if($('.forecast-sums'))$('.forecast-sums').scrollLeft=forecastScroll;
 if(focusData){const candidates=[...app.querySelectorAll('[data-action],[data-tile],[data-district]')];const same=candidates.find(el=>Object.entries(focusData).every(([k,v])=>el.dataset[k]===v));(same&&!same.disabled?same:app.querySelector('.main-command button:not(:disabled)'))?.focus({preventScroll:true});}
 visualDirector.rendered(screen,{skipEntrance:campaignEntrance.active});
 arrivalDirector.rendered(screen,{busy});
}
function openMiniatures(){modal('Символы кампании',illustratedCollection(),'Иллюстрированная коллекция','collection-dialog');}
function openDistrict(id){const d=DISTRICT_STYLE[id];if(!d)return;
 modal(id,'<div class="district-landscape"><img src="'+DESIGN_ASSETS[DISTRICT_IDS[id]]+'" alt=""></div><div class="district-heading">'+emblem(id)+'<h3>'+d.name+'</h3></div><div class="holdings">'+CITIES.filter(c=>c.district_on_board===id).map(c=>'<button class="city-choice" data-action="cityDetails" data-position="'+c.position+'"><img class="city-choice-art" src="'+CITY_ICON_ASSETS[c.position]+'" alt=""><span><strong>'+c.city+'</strong><small>'+ (state.regions[c.position]?'Кампания: '+state.players[state.regions[c.position].owner].name:'Кампания ещё не открыта')+'</small></span><span class="cost">'+money(c.acquisition_cost_million_rub)+'</span></button>').join('')+'</div>','Округа на игровом поле');
}
function visualFeedback(before,after,action){
 const person=before.current,pos=action.position??after.players[person].position;
 if(['HQ','OFFICE','BUY','INFRA_PLACE','INFRA_REMOVE'].includes(action.type)){celebrateArrival(pos,point(pos,person),true);emphasizeDevelopment(pos);}
 showResourceFeedback(before,after);
 if(before.current!==after.current) $('.candidate-portrait.current')?.classList.add('new-turn');
}
function openCity(){soundscape.play('page');modal(CITY_BY_ID[selected]?.city||tileName(selected),cityDetails(state,selected,{interactive:screen==='game'&&!busy&&!botRunning&&canControl(state),atlas:screen!=='game'}),'Регионы кампании',CITY_BY_ID[selected]?'city-dialog palace-city-dialog':'special-city-dialog');}
function closePanel(){dismissVisualDialog(dialog);if(campaignPaused){campaignPaused=false;setTimeout(runBot,350);}}
function openPause(){
 if(state.network){showRoomInfo();return;}
 if(busy){toast('Дождитесь завершения броска.');return;}
 campaignPaused=true;campaignEpoch++;
 const p=state.players[presentationPlayerId(state)];
 modal('Пауза','<div class="palace-pause"><div class="pause-portrait">'+portrait(p.persona)+'</div><span class="eyebrow">РАУНД '+state.round+'</span><h3>'+p.name+'</h3><p>Кампания приостановлена</p>'+palaceFlourish()+primary('Вернуться к игре','close')+secondary('Колоды кампании','decks')+secondary('Мир кампании','world')+secondary('Правила','rules')+secondary('Настройки','settings')+secondary('Главное меню','launch')+'<small>'+(isolatedTest?'Тестовая партия хранится только до закрытия вкладки.':storageAvailable?'Партия сохранена на этом устройстве.':'Партия хранится только до закрытия вкладки: сохранение недоступно.')+'</small></div>','Предвыборная гонка','pause-dialog');
}
function musicStatusText(){
 if(!soundscape.enabled)return 'Звуки игры выключены';
 if(!soundscape.settings.musicEnabled)return 'Тема выключена';
 if(soundscape.settings.musicVolume===0)return 'Громкость музыки — 0%';
 return {playing:'Сейчас звучит',loading:'Подготовка музыки…',error:'Не удалось включить. Нажмите «Послушать тему» ещё раз.',paused:'На паузе',idle:'Готова к прослушиванию'}[soundscape.musicState];
}
function updateMusicStatus(){
 const label=document.querySelector('#music-track-status');if(label)label.textContent=musicStatusText();
 const card=document.querySelector('.music-track');if(!card)return;
 card.dataset.playing=String(soundscape.enabled&&soundscape.musicState==='playing');
 const track=soundscape.musicTrack;
 card.querySelector('h4').textContent=track.title;
 card.querySelector('.music-track-meta').textContent='Оригинальная тема · '+musicDuration(track.duration);
 card.querySelector('.music-track-description').textContent=track.description;
 card.querySelectorAll('[data-action="musicSelect"]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===soundscape.musicIndex)));
}
function refreshAudioSettings(){
 const root=dialog.querySelector('.settings-dialog');if(!root)return;
 const controls=[['settingsSound',soundscape.enabled,'Включены','Выключены'],['settingsMusic',soundscape.settings.musicEnabled,'Включён','Выключен']];
 for(const [action,on,yes,no] of controls){const button=root.querySelector('[data-action="'+action+'"]');if(button){button.setAttribute('aria-pressed',String(on));button.textContent=on?yes:no;}}
 const note=root.querySelector('#audio-muted-note');if(note)note.textContent=soundscape.enabled?'Нажмите, чтобы послушать пример.':'Включите звуки игры, чтобы послушать примеры.';
 updateMusicStatus();
}
function musicPlaylistMarkup(){return '<div class="music-playlist" role="group" aria-label="Музыка кампании">'+CAMPAIGN_PLAYLIST.map((t,i)=>'<button data-action="musicSelect" data-track="'+i+'" aria-pressed="'+(i===soundscape.musicIndex)+'"><span>'+String(i+1).padStart(2,'0')+'</span><strong>'+t.title+'</strong><small>'+musicDuration(t.duration)+'</small></button>').join('')+'</div><p class="playlist-note">Две разные по звучанию темы сменяют друг друга автоматически.</p>';}
function openNewsSettings(){modal('Уведомления',newsSettingsContent(newsSettings,state),'Сводка действий соперников','news-settings-dialog');}
function refreshNewsSettings(){
 const root=dialog.querySelector('.news-settings-content');if(!root)return;
 root.querySelectorAll('[data-action="newsOption"]').forEach(el=>{const key=el.dataset.key;if(key==='format')el.setAttribute('aria-pressed',String(el.dataset.value===newsSettings.format));else if(key==='duration')el.setAttribute('aria-pressed',String(Number(el.dataset.value)===newsSettings.duration));else el.setAttribute('aria-checked',String(newsSettings[key]));});
 root.querySelectorAll('[name="news-filter"]').forEach(el=>el.checked=el.value===newsSettings.filter);
}
function saveNewsSettings(){storage.write('president.news.v1',JSON.stringify(newsSettings));refreshNewsSettings();syncNews();}
function openSettings(){
 const reduced=document.body.classList.contains('reduce-motion'),audio=soundscape.settings;
 modal('Настройки','<div class="palace-settings"><p>Настройте атмосферу вашей кампании.</p><button class="news-settings-link" data-action="newsSettings"><div><strong>Уведомления</strong><small>Сводка действий соперников · поверх поля</small></div><span aria-hidden="true">↗</span></button><section><div><h3>Звуки игры</h3><p>Перекат кубиков, шелест карт, монеты и отклик поддержки.</p></div><button class="palace-toggle" data-action="settingsSound" aria-label="Звуки игры" aria-pressed="'+soundscape.enabled+'">'+(soundscape.enabled?'Включены':'Выключены')+'</button></section><div class="audio-mixer"><label for="effects-volume"><span>Громкость эффектов</span><output id="effects-volume-value">'+Math.round(audio.effectsVolume*100)+'%</output></label><input id="effects-volume" type="range" min="0" max="100" step="5" value="'+Math.round(audio.effectsVolume*100)+'" aria-describedby="audio-muted-note"><div class="audio-preview" role="group" aria-label="Послушать звуки"><button data-action="previewSound" data-cue="roll">Бросок кубиков</button><button data-action="previewSound" data-cue="draw">Взять карту</button><button data-action="previewSound" data-cue="shuffle">Тасовка</button><button data-action="previewSound" data-cue="cardFlip">Перевернуть карту</button><button data-action="previewSound" data-cue="page">Листать</button><button data-action="previewSound" data-cue="coinCount">Покупка</button><button data-action="previewSound" data-cue="coin">Доход</button><button data-action="previewSound" data-cue="payment">Выплата</button><button data-action="previewSound" data-cue="supportUp">Рост поддержки</button><button data-action="previewSound" data-cue="supportDown">Спад поддержки</button><button data-action="previewSound" data-cue="build">Постройка</button></div><p id="audio-muted-note">'+(soundscape.enabled?'Нажмите, чтобы послушать пример.':'Включите звуки игры, чтобы послушать примеры.')+'</p></div><section><div><h3>Музыкальный фон</h3><p>Фортепианная тема и акустический сад: арфа, маримба, струнные.</p></div><button class="palace-toggle" data-action="settingsMusic" aria-label="Музыкальный фон" aria-pressed="'+audio.musicEnabled+'">'+(audio.musicEnabled?'Включён':'Выключен')+'</button></section><div class="music-track" data-playing="'+(soundscape.enabled&&soundscape.musicState==='playing')+'"><div class="music-track-heading"><span class="music-track-mark" aria-hidden="true">♫</span><div><h4>'+soundscape.musicTrack.title+'</h4><span class="music-track-meta">Оригинальная тема · '+musicDuration(soundscape.musicTrack.duration)+'</span></div><span class="music-track-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></div><p class="music-track-description">'+soundscape.musicTrack.description+'</p>'+musicPlaylistMarkup()+'<div class="music-track-footer"><span id="music-track-status" role="status">'+musicStatusText()+'</span><button data-action="previewMusic">Послушать тему</button></div></div><div class="audio-mixer"><label for="music-volume"><span>Громкость музыки</span><output id="music-volume-value">'+Math.round(audio.musicVolume*100)+'%</output></label><input id="music-volume" type="range" min="0" max="100" step="5" value="'+Math.round(audio.musicVolume*100)+'"></div><section><div><h3>Спокойные анимации</h3><p>Короткие переходы и мгновенное движение.</p></div><button class="palace-toggle" data-action="settingsMotion" aria-label="Спокойные анимации" aria-pressed="'+reduced+'">'+(reduced?'Включены':'Выключены')+'</button></section><p class="palace-hint">Настройки сохраняются на устройстве. Системное уменьшение движения учитывается автоматически.</p>'+secondary('Готово','close')+'</div>','Звук и движение','settings-dialog');
}
function openCities(){modal('Города на поле','<p class="cities-intro">24 архитектурные иллюстрации. Откройте город, чтобы рассмотреть его и спланировать развитие кампании.</p><div class="cities-index">'+Object.entries(DISTRICT_STYLE).map(([id,d])=>'<section><div class="cities-index-heading">'+emblem(id)+'<h3>'+id+'</h3></div>'+CITIES.filter(c=>c.district_on_board===id).map(c=>'<button data-action="cityDetails" data-position="'+c.position+'"><img src="'+CITY_ICON_ASSETS[c.position]+'" alt=""><strong>'+c.city+'</strong><span>'+CITY_ART[c.position].motif+'</span><i>↗</i></button>').join('')+'</section>').join('')+'</div>','Архитектура России','cities-dialog');}

function openOverview(){modal('Обзор кампании',overviewContent(state).replace('Партия автоматически сохраняется в этом браузере.',storageAvailable?'Партия автоматически сохраняется в этом браузере.':'Сохранение в браузере недоступно. Партия и возврат из сценариев доступны до закрытия вкладки.'),'Президент','overview-dialog');}
function openCandidate(id){modal(state.players[id].name,candidateContent(state,id)+secondary('История и досье кандидата','world','data-persona="'+state.players[id].persona+'"'),'Историческая личность','candidate-dialog');}
function persist(value=state){if(value.network)return;hasSaved=true;const previous=storage.read(KEY);if(parseCampaign(previous))storage.write(KEY+'.previous',previous);storage.write(KEY,JSON.stringify(value));}
function archiveCampaign(){
 const campaign=campaignForArchive(state,storage.read(BACKUP));
 return campaign&&storage.write(PREVIOUS,JSON.stringify(campaign));
}
function toast(text){const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),4000);}
function modal(title,body,eyebrow='Президент',extraClass=''){
 if(busy){toast('Дождитесь завершения перемещения.');return;}
 if(dialog.open)dialog.close();
 dialog.setAttribute('aria-label',title);
 dialog.innerHTML=frame()+'<div class="modal-body '+extraClass+'"><div class="modal-top"><div><div class="eyebrow">'+eyebrow+'</div><h2>'+title+'</h2></div><button class="icon-button" data-action="close" aria-label="Закрыть">×</button></div>'+body+'</div>';dialog.showModal();dialog.scrollTop=0;revealVisualDialog(dialog);
}
function openDecks(kind='lawyer',card=null){if(!Object.hasOwn(DECK_NAMES,kind))return;soundscape.play(card?'cardFlip':'shuffle');modal('Колоды кампании',deckCollection(kind,card),'Иллюстрированный справочник','deck-dialog deck-library-dialog');}
function openEvent(announce=true){if(screen!=='game'||busy||!['swan','travel'].includes(state.decision?.kind))return;if(announce)soundscape.play('cardFlip');modal(DECK_NAMES[state.decision.kind],deckEventContent(state),'Президент · дела особой важности','deck-dialog deck-event-dialog');}
// Landing events are revealed in the live panel, so the board stays visible.
let lastCourtOffer=null;
function showPendingEvent(){
 if(screen!=='game'||busy||campaignPaused||campaignEntrance.active||dialog.open)return;
 if(state.decision?.kind==='courtAccusation'&&canControl(state)){
  const key=[state.round,state.current,state.serial,state.decision.actor].join(':');
  if(lastCourtOffer!==key){lastCourtOffer=key;modal('Судебное следствие',courtOfferContent(state),'Соперник на судебной клетке','court-offer-dialog');}
 }
 if(['swan','travel'].includes(state.decision?.kind))app.querySelector('.arrival-actions')?.setAttribute('aria-label','Решение по карте «'+state.decision.card.name+'»');
}
let ruleView={chapter:'preparation',page:0,hero:0};
function openRules(chapter='preparation',page=0,hero=0,step=0){
 ruleView={...ruleLocation(chapter,page),hero};
 const html=rulesContent(ruleView.chapter,{compact:window.innerWidth<=700,inGame:screen==='game',page:ruleView.page,hero});
 const existing=dialog.querySelector('.reference-rules-dialog');
 if(dialog.open&&existing){
  existing.querySelector('.visual-rulebook').outerHTML=html;
  existing.querySelector('.rb-body').focus({preventScroll:true});
 }else modal('Правила игры',html,'Справочник кампании','reference-rules-dialog');
 const root=dialog.querySelector('.visual-rulebook');if(root)Object.assign(ruleView,adaptRuleLayout(root,{...ruleReadingLayout(window.innerWidth,window.innerHeight),step}));
}

function advanceRules(direction){
 const step=(ruleView.step||0)+direction;
 if(step>=0&&step<(ruleView.count||1)){openRules(ruleView.chapter,ruleView.page,ruleView.hero,step);return;}
 const next=ruleStep(ruleView.chapter,ruleView.page,direction);openRules(next.chapter,next.page,0,direction<0?-1:0);
}
let ruleResizeTimer;window.addEventListener('resize',()=>{clearTimeout(ruleResizeTimer);ruleResizeTimer=setTimeout(()=>{const layout=ruleReadingLayout(window.innerWidth,window.innerHeight);if(dialog.open&&dialog.querySelector('.visual-rulebook')&&(ruleView.compact!==layout.compact||ruleView.shortLandscape!==layout.shortLandscape))openRules(ruleView.chapter,ruleView.page,ruleView.hero,ruleView.step);if(screen==='world'&&worldView.tab==='chronicle')render();},100);});
function openNew(){campaignPaused=false;if(busy)return;campaignEpoch++;if(dialog.open)dialog.close();screen=storage.read(WORLD_SEEN)==='yes'?'setup':'prologue';worldOnboarding=screen==='prologue';worldView={tab:'premise',faction:'empresses',persona:'catherine',detail:'ability',page:0,origin:'setup'};activeSeat=0;selectedFaction=null;previewPersona=null;roster=defaultRoster();clearMoments();render();window.scrollTo(0,0);}
function openWorld(persona=null,tab='premise'){
 if(busy){toast('Дождитесь завершения перемещения.');return;}
 const origin=screen==='world'||screen==='prologue'?worldView.origin:screen;
 if(screen==='game')campaignEpoch++;
 if(dialog.open)dialog.close();campaignPaused=false;clearMoments();
 const choice=worldChoice(null,persona||previewPersona||roster[activeSeat]?.persona||'catherine');
 worldView={...choice,tab:persona?'dossiers':tab,detail:'ability',page:0,origin};screen='world';render();
}
function returnFromWorld(){
 if(worldOnboarding){screen='prologue';render();return;}
 screen=['game','setup'].includes(worldView.origin)?worldView.origin:'menu';render();
 if(screen==='game')setTimeout(runBot,250);
}
function beginFromWorld(persona=null){
 storage.write(WORLD_SEEN,'yes');worldOnboarding=false;
 if(worldView.origin==='game'){returnFromWorld();return;}
 if(worldView.origin!=='setup'){roster=defaultRoster();activeSeat=0;selectedFaction=null;previewPersona=null;}
 if(PERSONAS[persona]){const c=worldChoice(null,persona);selectedFaction=c.faction;previewPersona=c.persona;}
 screen='setup';render();
}
function openMenu(){worldOnboarding=false;campaignPaused=false;if(busy){toast('Бросок завершается. После него можно открыть меню.');return;}campaignEpoch++;if(dialog.open)dialog.close();screen='menu';clearMoments();render();window.scrollTo(0,0);}
async function enterCampaign(fresh=false){
 if(campaignEntrance.active||busy)return;
 lastCourtOffer=null;
 campaignPaused=false;const epoch=++campaignEpoch;
 if(dialog.open)dialog.close();clearMoments();
 const player=fresh?PERSONAS[roster[0].persona].name:state.players[presentationPlayerId(state)].name;
 try{
  await campaignEntrance.play(()=>{
   if(fresh){forecast=false;if(!hasSaved||archiveCampaign())storage.remove(BACKUP);state=newGame({players:roster});newsOverlay.reset();selected=0;persist();}
   screen='game';render();window.scrollTo(0,0);soundscape.play('campaign');
  },{fresh,player,round:fresh?1:state.round});
 }catch(error){console.warn('Campaign entrance unavailable.',error);toast('Не удалось открыть экран кампании. Вернитесь в меню и повторите.');return;}
 if(epoch!==campaignEpoch||screen!=='game')return;
 showPendingEvent();setTimeout(runBot,250);
}
function openSetupRoster(){modal('Участники кампании',setupRosterContent(roster,activeSeat),'Подготовка партии','setup-roster-dialog');}
function refreshSetupRoster(){if(dialog.open&&dialog.querySelector('.setup-roster-dialog'))openSetupRoster();}
function openHeroes(){modal('Личности кампании',heroesContent(),'История и характер','hero-library-dialog');}
function openDemo(){modal('Проверить механику',(isolatedTest?'<div class="demo-list">'+['court-visit','catherine_i','anna','witte','stolypin','kirov','trotsky','lawyer-deck','swan-deck','swan-blizzard','travel-deck','kolchak','milyukov','khrushchev','kerensky'].map(id=>'<button class="demo-button" data-action="scenario" data-scenario="'+id+'">'+(PERSONAS[id]?'Способность: '+PERSONAS[id].name:({'court-visit':'Судебная клетка: предложение обвинить','lawyer-deck':'Карты: Юрист','swan-deck':'Карты: Чёрный лебедь','swan-blizzard':'Карты: Метель','travel-deck':'Карты: Командировка'})[id])+'</button>').join('')+'</div>':'')+'<p>Эти короткие сценарии помогут проверить правила. Текущая партия сохранится, к ней можно будет вернуться.</p><div class="demo-list"><button class="demo-button" data-action="scenario" data-scenario="infrastructure"><strong>Инфраструктура и перехват</strong><p>Шесть кандидатов, флаги штабов и отделения. Завершите кампанию в Ярославле третьим объектом или защитите свой город.</p></button><button class="demo-button" data-action="scenario" data-scenario="multiplayer"><strong>Партия на четверых</strong><p>Четыре кандидата на поле. Постройте штаб в Ярославле и передайте ход следующему игроку.</p></button><button class="demo-button" data-action="scenario" data-scenario="airport"><strong>Пересадка в аэропорту</strong><p>Фишка уже в аэропорту. Определите направление и сделайте следующий бросок.</p></button><button class="demo-button" data-action="scenario" data-scenario="yaroslavl"><strong>Штаб в Ярославле</strong><p>Город ваш. Проверьте, как 250 млн ₽ превращают 1% поддержки в 2% всего.</p></button><button class="demo-button" data-action="scenario" data-scenario="rent"><strong>Платёж сопернику</strong><p>Вы остановились в Ярославле со штабом другого кандидата: 500 млн ₽ переводятся напрямую.</p></button></div>','Сценарии');}
function openHand(kind='view',target=null){
 soundscape.play('card');
 if(kind==='sue'&&target===null){const rivals=lawsuitTargets(state);if(rivals.length===1)return openHand('sue',rivals[0].id);modal('Выберите ответчика','<p class="dialog-lead">Выберите кандидата, затем одну из его закрытых карт.</p><div class="law-target-list">'+rivals.map(p=>'<button data-action="sueTarget" data-target="'+p.id+'">'+portrait(p.persona)+'<strong>'+p.name+'</strong><small>'+getVotes(state,p.id)+'% поддержки</small></button>').join('')+'</div>','Судебная практика');return;}
 const id=kind==='sue'?target:viewerId(state);
 modal(kind==='sue'?'Предъявить иск':kind==='swap'?'Заменить карту':'Карты кампании',lawyerHandContent(state.players[id],kind)+(kind==='view'?swanDebtContent(state,id):''),'Юрист · судебная практика','hand-dialog deck-dialog');
}
function openInfrastructure(mode='place',position=null,target=null){
 if(screen!=='game'||busy||!infrastructureTurn(state)||state.players[state.current].bot)return;
 soundscape.play('page');modal('Инфраструктура',infrastructurePanel(state,mode,position,target),'Расширение и защита влияния','infrastructure-dialog');
 if(position!==null&&matchMedia('(max-width:700px)').matches){requestAnimationFrame(()=>dialog.querySelector('.infra-preview')?.scrollIntoView({block:'start',behavior:'instant'}));}
}
function openHQ(){const cities=CITIES.filter(c=>canHQ(state,c.position));modal('Где открыть штаб?',cities.length?cities.map(c=>'<button class="city-choice" data-action="buildHQ" data-position="'+c.position+'"><img class="city-choice-art" src="'+CITY_ICON_ASSETS[c.position]+'" alt=""><span><strong>'+c.city+'</strong><small>'+cityVotes(state,c.position,state.current,'base')+'% → '+cityVotes(state,c.position,state.current,'headquarters')+'% поддержки</small></span><span class="cost">'+money(c.headquarters_cost_million_rub)+'</span></button>').join(''):'<p>Пока нет собственного города, в котором хватает средств на штаб.</p>','Инфраструктура');}
function openAirport(infoOnly=false){
 if(infoOnly||state.phase!=='airport'||!canControl(state)){
  modal('Аэропорт','<div class="airport-intro">'+designImage('airport')+'</div><p>Светлые стрелки ведут в аэропорт. Бирюзовые — к городам. 6, 18, 30 и 42 — одна общая клетка. При проходе через аэропорт сохраняется нумерация: 6 → 7, 18 → 19, 30 → 31 и 42 → 43.</p><div class="route-grid">'+EXITS.map(e=>'<div><b>'+e.value+'</b>'+(e.district?emblem(e.district):designImage(e.value===5?'president':'court'))+'<span>'+e.name+'</span><small>'+(e.district||'Особый исход')+'</small></div>').join('')+'</div><p>Остановились здесь — в следующий ход определите направление стрелкой. Если шаги остались, продолжайте движение по номерам.</p>','Маршруты кампании');return;
 }
 wheelValue=null;wheelBusy=false;
 modal('Аэропорт','<p class="airport-lead">Направление вашей кампании</p><div class="airport-navigation"><div class="wheel-wrap"><div class="wheel">'+airportInstrument()+EXITS.map((e,i)=>'<span class="wheel-label" role="img" aria-label="'+e.value+': '+e.name+'" style="left:'+INSTRUMENT_LABELS[i][0]+'%;top:'+INSTRUMENT_LABELS[i][1]+'%">'+(e.district?'<span class="wheel-district">'+e.wheelLabel.replace('-','-<wbr>')+'<small>федеральный округ</small></span>':e.name)+'</span>').join('')+'</div><div class="wheel-needle"><i></i></div><div class="wheel-hub">'+icon('airport')+'</div></div><section class="airport-route-panel"><div class="route-landscape"><img id="route-landscape-image" src="'+DESIGN_ASSETS.airport+'" alt=""></div><span class="eyebrow" id="wheel-status">ВАШ СЛЕДУЮЩИЙ МАРШРУТ</span><div class="wheel-outcome" id="wheel-outcome" role="status" aria-live="polite">Куда отправимся?</div><p class="wheel-description" id="wheel-description">Шесть равных секторов. Определите направление, затем бросьте кубики.</p><div id="wheel-action">'+primary('Определить маршрут','spin')+'</div></section></div>','Маршруты кампании','airport-dialog');
}
async function spin(){
 if(wheelBusy||wheelValue||busy||!canControl(state))return;wheelBusy=true;wheelValue=state.network?null:randomDie();
 try{
  if(state.network){if(!await network.play({type:'AIRPORT'}))return;wheelValue=network.snapshot.event.action.value;}else{state=reduce(state,{type:'AIRPORT',value:wheelValue});persist();}
  $('#wheel-action button').disabled=true;$('#wheel-outcome').textContent='Выбираем направление…';
  $('.wheel-wrap').classList.add('is-routing');
  if(!document.body.classList.contains('reduce-motion')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)soundscape.play('wheel');
  $('.wheel-needle').style.transform='rotate('+(2160+(wheelValue-1)*60)+'deg)';
  await delay(2900);selected=state.players[state.current].position;render();if(!dialog.open||!$('#wheel-outcome'))return;
  const e=EXITS[wheelValue-1];$('#wheel-outcome').textContent=e.name;
  $('#wheel-status').textContent='НАПРАВЛЕНИЕ ВЫБРАНО';
  $('#route-landscape-image').src=DESIGN_ASSETS[e.district?DISTRICT_IDS[e.district]:wheelValue===5?'president':'court'];
  $('#wheel-description').textContent=wheelValue<=4?'Идите через '+e.name+'. Затем бросьте кубики.':wheelValue===5?'Встреча с президентом · Клетка 24':'Судебное следствие · Клетка 12';
  $('#wheel-action').innerHTML=primary(wheelValue<=4?'Перейти к броску':'Продолжить','confirmRoute');
  revealAirportRoute(wheelValue);soundscape.play('route');
 }catch(error){toast(error.message);dialog.close();render();}
 finally{wheelBusy=false;}
}
async function animateMove(transition){revealMovementPhase();await animateJourney(transition,{onStep:()=>soundscape.play('step')});}
async function commit(action,{dice=false,remote=null}={}){
 if(busy)return false;
 if(state.network&&!remote)return network.play(action);
 const before=state,remoteEpoch=campaignEpoch;let next;try{next=remote?remote.game:withCampaignNews(before,reduce(state,action),action);}catch(e){toast(e.message);return false;}
 busy=true;forecast=false;clearMoments();if(dice)soundscape.play(document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches?'diceLand':'roll');
 await presentTurn(next,{
  save:persist,
  animate:async()=>{if(dice){stagedDice=action.dice;stagedDicePurpose=action.type==='JAIL_TRY'?'jail':'move';}render();if(dice)await animateDice(action.dice,{play:cue=>soundscape.play(cue)});stagedDice=null;$('.dice-theatre')?.remove();document.querySelectorAll('.ivory-die.rolling').forEach(el=>el.classList.remove('rolling'));if(next.transition)await animateMove(next.transition);},
  onError:error=>{console.warn('Turn animation failed; applying the saved result.',error);settleAnimations();},
  finish:value=>{if(remote&&remoteEpoch!==campaignEpoch)return;state=value;if(remote)state.network.connected=network.connected;busy=false;stagedDice=null;selected=state.players[state.current].position;render();}
 });
 if(remote&&remoteEpoch!==campaignEpoch)return false;
 try{visualFeedback(before,state,action);if(next.transition)celebrateArrival(next.transition.to,point(next.transition.to,next.transition.player));}catch(error){console.warn('Feedback effect unavailable.',error);}
 const court=state.phase!=='finished'?(remote?remote.event?.court:courtResult(before,state,action)):null;
 if(court&&(state.network?[court.plaintiff.id,court.defendant.id].includes(viewerId(state)):(!court.plaintiff.bot||!court.defendant.bot)))modal('Решение суда',deckVerdictContent(state,court),'Юрист · дело рассмотрено','deck-dialog deck-event-dialog');
 else if(!dialog.open)showPendingEvent();
 const moment=momentFor(before,state,action);if(moment&&!(moment.kind==='development'&&actionPlayerId(before)!==viewerId(before)))showMoment(moment);
 for(const {name,delay,gain} of actionSoundCues(before,state,action,{court,moment}))soundscape.play(name,{delay,gain});
 if(['BUY','HQ','OFFICE'].includes(action.type)){const pos=action.position??state.players[before.current].position;floatIncome(point(pos,before.current),pos,cityVotes(state,pos)+'% поддержки');}
 if(state.phase==='finished'){soundscape.play('victory');const p=state.players[state.winner];modal('Победа на выборах','<div class="victory-portrait">'+portrait(p.persona)+'</div><div class="victory">'+icon('crown')+'</div><h2 class="victory-name">'+p.name+'</h2><p class="victory-result">'+getVotes(state,p.id)+'% поддержки · '+money(p.cash)+'</p>'+primary('Новая кампания','new'),'История вашей кампании','victory-dialog');}
 return true;
}
async function runBot(){
 if(state.network)return;
 if(screen!=='game'||campaignPaused||dialog.open||botRunning||busy||!state.players[actionPlayerId(state)].bot||state.phase==='finished')return;botRunning=true;const epoch=campaignEpoch;let failed=false;
 try{
 for(let i=0;i<40&&state.players[actionPlayerId(state)].bot&&state.phase!=='finished';i++){
  await delay(arrivalKind(state)?1150:650);if(screen!=='game'||campaignPaused||dialog.open||epoch!==campaignEpoch||!state.players[actionPlayerId(state)].bot||busy)break;
  const a=botTurnAction(state);if(!a)break;
  if(isolatedTest&&a.type==='JAIL_TRY')a.dice=rollDice();
  if(isolatedTest&&a.type==='ROLL'&&new URLSearchParams(location.search).get('jail')?.startsWith('bot-'))a.dice=[1,2];
  if(!await commit(a,{dice:!!a.dice})){failed=true;break;}
 }
 }finally{botRunning=false;}
 if(screen==='game'&&!campaignPaused&&!dialog.open&&!failed&&state.players[actionPlayerId(state)].bot&&state.phase!=='finished')setTimeout(runBot,400);
 else if(screen==='game'&&!campaignPaused&&state.phase==='airport'&&!dialog.open)openAirport();
}
async function handleClick(event){
 soundscape.unlock();
 if(campaignEntrance.active)return;
 if(wheelBusy)return;
 const crest=event.target.closest('[data-district]');if(crest){openDistrict(crest.dataset.district);return;}
 const tile=event.target.closest('[data-tile]');if(tile){if(busy)return;selected=Number(tile.dataset.tile);render();openCity();return;}
 if(event.target.closest('[data-airport]')){openAirport();return;}
 const b=event.target.closest('[data-action]');if(!b||b.disabled)return;const a=b.dataset.action;
 if(a==='multiplayer'){await openRoom();return;}
 if(a==='roomCreate'||a==='roomJoin'){
  const name=app.querySelector('#room-name')?.value||'Игрок',code=app.querySelector('#room-code')?.value.trim().toUpperCase();
  if(a==='roomJoin'&&!/^[A-Z2-9]{6}$/.test(code||'')){toast('Введите шестизначный код комнаты.');return;}
  b.disabled=true;try{if(a==='roomCreate')await network.create(name);else await network.join(code,name);}finally{b.disabled=false;}return;
 }
 if(a==='roomReconnect'){await network.reconnect();return;}
 if(a==='roomFaction'){roomFaction=b.dataset.faction;render();return;}
 if(a==='roomHero'){await network.command('hero',{persona:b.dataset.persona});return;}
 if(a==='roomReady'){const data=network.snapshot;await network.command('ready',{ready:!data.members.find(m=>m.id===data.you).ready});return;}
 if(a==='roomStart'){await network.command('start');return;}
 if(a==='roomInfo'){showRoomInfo();return;}
 if(a==='roomCopy'){
  const link=roomInvite(),code=network.snapshot.code;
  try{
   if(!vkPlatform||!await vkPlatform.copyInvite(link))await navigator.clipboard.writeText(link);
   toast('Ссылка скопирована. Отправьте её друзьям.');
  }catch{modal('Приглашение','<p>Код комнаты: <strong>'+code+'</strong></p><p class="room-info-link">'+escape(link)+'</p>','Игра с друзьями');}
  return;
 }
 if(a==='roomBack'){
  if(busy){toast('Дождитесь завершения текущего действия.');return;}
  if(state.network||network.snapshot?.started||!network.connected){network.stop();if(offlineCampaign){state=offlineCampaign.state;hasSaved=offlineCampaign.hasSaved;offlineCampaign=null;}newsOverlay.reset(state.news||[]);}
  else if(network.active){await network.leave();return;}
  roomFaction=null;openMenu();return;
 }
 if(state.network&&['new','resume','demo','scenario','restore','restorePrevious','startGame','worldBegin'].includes(a)){toast('Сначала выйдите в главное меню через меню сетевой партии.');return;}
 if(state.network&&ROOM_ACTIONS.has(a)&&(!canControl(state)||network.pending)){toast(!network.connected?'Восстанавливаем подключение…':'Дождитесь своего решения.');return;}
 if(['faction','previewHero','chooseHero','playerCount','selectSeat','seatRole','new','resume','close','settings'].includes(a))soundscape.play('click');
 if(a==='close'){if(!wheelBusy)closePanel();return;}
 if(a==='skipDice'){settleDice();return;}
 if(a==='resume'){await enterCampaign();return;}
 if(a==='previousCampaign'){const old=parseCampaign(storage.read(PREVIOUS));if(old)modal('Предыдущая кампания',candidateContent(old,old.current)+primary('Восстановить эту партию','restorePrevious'),'Резервная копия');return;}
 if(a==='restorePrevious'){const old=parseCampaign(storage.read(PREVIOUS));if(!old)return;archiveCampaign();state=old;newsOverlay.reset(state.news||[]);selected=state.players[state.current].position;persist();dialog.close();screen='menu';render();return;}
 if(a==='launch'){openMenu();return;}
 if(a==='heroes'){openWorld(null,'dossiers');return;}
 if(a==='world'){openWorld(b.dataset.persona||null);return;}
 if(a==='worldBack'){returnFromWorld();return;}
 if(a==='worldBegin'){beginFromWorld(b.dataset.persona||null);return;}
 if(a==='worldTab'&&['world','prologue'].includes(screen)){if(!['premise','dossiers','chronicle'].includes(b.dataset.tab))return;worldView.tab=b.dataset.tab;screen='world';render();return;}
 if(a==='worldFaction'&&screen==='world'){Object.assign(worldView,worldChoice(b.dataset.faction,worldView.persona));render();return;}
 if(a==='worldHero'&&screen==='world'){const c=worldChoice(worldView.faction,b.dataset.persona);worldView.persona=c.persona;render();return;}
 if(a==='worldStep'&&screen==='world'){worldView.persona=worldStep(worldView.faction,worldView.persona,Number(b.dataset.direction));render();return;}
 if(a==='worldDetail'&&screen==='world'){if(['history','character','ability'].includes(b.dataset.detail))worldView.detail=b.dataset.detail;render();return;}
 if(a==='worldPage'&&screen==='world'){worldView.page=Number(b.dataset.page);render();return;}
 if(a==='setupRoster'&&screen==='setup'){openSetupRoster();return;}
 if(a==='heroHistory'&&PERSONAS[b.dataset.persona]){modal('История персонажа',heroHistoryDetails(b.dataset.persona),'История и игровая интерпретация','hero-history-dialog');return;}
 if(a==='faction'&&screen==='setup'){const choice=heroChoiceState(roster,activeSeat,{faction:b.dataset.faction});selectedFaction=choice.faction;previewPersona=choice.persona;render();return;}
 if(a==='previewHero'&&screen==='setup'){const choice=heroChoiceState(roster,activeSeat,{faction:selectedFaction});if(choice.ids.includes(b.dataset.persona))previewPersona=b.dataset.persona;render();return;}
 if(a==='playerCount'&&screen==='setup'){roster=resizeRoster(roster,Number(b.dataset.count));activeSeat=Math.min(activeSeat,roster.length-1);render();refreshSetupRoster();return;}
 if(a==='selectSeat'&&screen==='setup'){const n=Number(b.dataset.seat);if(roster[n])activeSeat=n;selectedFaction=null;previewPersona=null;if(dialog.open)dialog.close();render();return;}
 if(a==='chooseHero'&&screen==='setup'){const choice=heroChoiceState(roster,activeSeat,{faction:selectedFaction,preview:previewPersona});if(choice.persona!==b.dataset.persona)return;roster=chooseHero(roster,activeSeat,choice.persona);previewPersona=choice.persona;render();return;}
 if(a==='seatRole'&&screen==='setup'){const n=Number(b.dataset.seat);if(roster[n]&&n>0)roster[n].bot=b.dataset.bot==='true';render();refreshSetupRoster();return;}

 if(a==='newsSettings'){if(busy){toast('Дождитесь завершения перемещения.');return;}if(event.target.closest('#campaign-news'))newsOverlay.dismiss();openNewsSettings();return;}
 if(a==='newsDismiss'){newsOverlay.dismiss();return;}
 if(a==='newsCity'){if(busy){toast('Город можно открыть после перемещения фишки.');return;}selected=Number(b.dataset.position);newsOverlay.dismiss();render();openCity();return;}
 if(a==='newsOption'){const key=b.dataset.key;if(key==='format')newsSettings.format=b.dataset.value;else if(key==='duration')newsSettings.duration=Number(b.dataset.value);else if(['enabled','sound'].includes(key))newsSettings[key]=!newsSettings[key];newsSettings=newsPreferences(newsSettings);saveNewsSettings();return;}
 if(a==='newsPreview'){const full=newsSettings.format==='full';modal('Пример сводки',full?newsStoryCard(NEWS_SAMPLE,state,{preview:true}):newsCard(NEWS_SAMPLE,state,{preview:true}),'Предпросмотр · данные партии не меняются',full?'world-news-preview-dialog':'news-compact-preview-dialog');if(newsSettings.sound)soundscape.play('arrival',{gain:.35});return;}
 if(a==='settings'){openSettings();return;}
 if(a==='settingsSound'){await soundscape.toggle();render();refreshAudioSettings();return;}
 if(a==='settingsMusic'){soundscape.setMusicEnabled(!soundscape.settings.musicEnabled);await soundscape.unlock();refreshAudioSettings();return;}
 if(a==='musicSelect'){if(!soundscape.enabled)await soundscape.toggle();await soundscape.unlock();await soundscape.selectMusic(Number(b.dataset.track));soundscape.setMusicEnabled(true);refreshAudioSettings();return;}
 if(a==='previewMusic'){if(!soundscape.enabled)await soundscape.toggle();soundscape.setMusicEnabled(true);await soundscape.unlock();render();refreshAudioSettings();return;}
 if(a==='previewSound'){await soundscape.unlock();soundscape.preview(b.dataset.cue);const note=$('#audio-muted-note');if(note)note.textContent=!soundscape.enabled?'Включите звуки игры, чтобы послушать примеры.':soundscape.settings.effectsVolume===0?'Увеличьте громкость эффектов, чтобы послушать пример.':'Прослушивание: '+b.textContent+'.';return;}
 if(a==='settingsMotion'){const reduced=document.body.classList.toggle('reduce-motion');storage.write('president.motion.v1',reduced?'reduced':'full');if(reduced){settleAnimations();settleDice();clearVisualEffects();}openSettings();return;}
 if(a==='sound'){const enabled=await soundscape.toggle();if(!busy)render();toast(enabled?'Звуки кампании включены':'Звуки кампании выключены');return;}
 if(a==='focusTurn'){$('.campaign-dock')?.scrollIntoView({block:'start',behavior:document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}
 if(a==='forecast'){if(state.phase!=='ready'||busy)return;forecast=!forecast;render();soundscape.play('click');return;}
 if(a==='forecastSum'){const sum=Number(b.dataset.sum);if(!forecast||!Number.isInteger(sum)||sum<2||sum>12)return;forecastSum=sum;render();soundscape.play('click');return;}
 if(!['roll','jailTry','spin'].includes(a))soundscape.play('click');
 if(a==='menu'){openPause();return;}
 if(a==='cities'){openCities();return;}
 if(a==='miniatures'){openMiniatures();return;}
 if(a==='rules'){openRules(ruleView.chapter,ruleView.page,ruleView.hero,ruleView.step);return;}
 if(a==='ruleSearch'){const panel=dialog.querySelector('.rb-search-panel'),trigger=dialog.querySelector('.rb-search-trigger');panel.hidden=!panel.hidden;trigger.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)panel.querySelector('input').focus();else if(trigger.getClientRects().length)trigger.focus();else dialog.querySelector('[data-rule-select]')?.focus();return;}
 if(a==='ruleChapter'){openRules(b.dataset.chapter,Number(b.dataset.rulePage)||0,Number(b.dataset.heroIndex)||0);return;}
 if(a==='ruleAdvance'){advanceRules(Number(b.dataset.direction));return;}
 if(a==='ruleHero'){openRules(ruleView.chapter,ruleView.page,Number(b.dataset.heroIndex)||0);return;}
 if(a==='log'){if(busy){toast('Дождитесь завершения перемещения.');return;}if(event.target.closest('#campaign-news'))newsOverlay.dismiss();modal('Сводка кампании',newsJournalContent(state),'Новости участников','news-journal-dialog');return;}
 if(a==='fullLog'){modal('Хроника кампании',chronicleContent(state),'Летопись вашей партии','chronicle-dialog');return;}
 if(a==='cards'){openHand();return;}
 if(a==='decks'){openDecks();return;}
 if(a==='deckKind'||a==='deckCard'){openDecks(b.dataset.deck,b.dataset.card);return;}
 if(a==='eventCard'){openEvent();return;}
 if(a==='overview'){openOverview();return;}
 if(a==='holdings'){openCandidate(viewerId(state));return;}
 if(a==='details'){openCity();return;}
 if(a==='cityDetails'){selected=Number(b.dataset.position);render();openCity();return;}
 if(a==='cityLevel'){
  const position=Number(b.dataset.position),level=b.dataset.level,c=CITY_BY_ID[position],panel=dialog.querySelector('.city-development');
  if(position!==selected||!c||!Object.hasOwn(c.levels,level)||!panel)return;
  const scrollTop=dialog.scrollTop,template=document.createElement('template');
  template.innerHTML=cityDetails(state,position,{interactive:screen==='game'&&!busy&&!botRunning&&canControl(state),atlas:screen!=='game',previewLevel:level});
  panel.replaceWith(template.content.querySelector('.city-development'));
  dialog.querySelector(`[data-action="cityLevel"][data-level="${level}"]`)?.focus({preventScroll:true});
  dialog.scrollTop=scrollTop;
  return;
 }
 if(a==='candidate'){openCandidate(Number(b.dataset.player));return;}
 if(a==='airportInfo'){openAirport(true);return;}
 if(a==='zoomReset'){zoom=1;render();return;}
 if(a==='new'){if(busy){toast('Дождитесь завершения хода соперника.');return;}newPersona=state.players[0].persona;newMode=state.mode;openNew();return;}
 if(a==='persona'){newPersona=b.dataset.persona;openNew();return;}
 if(a==='demo'){if(busy||botRunning){toast('Дождитесь завершения хода.');return;}openDemo();return;}
 if(a==='zoomIn'||a==='zoomOut'){zoom=Math.max(1,Math.min(2.5,zoom+(a==='zoomIn'?.5:-.5)));render();return;}
 if(a==='airport'){openAirport();return;}
 if(a==='spin'){await spin();return;}
 if(a==='confirmRoute'){if(!wheelBusy){dialog.close();render();}return;}
 if(a==='startGame'&&screen==='setup'){await enterCampaign(true);return;}
 if(busy||botRunning){toast('Дождитесь завершения хода.');return;}
 
 if(a==='scenario'){lastCourtOffer=null;campaignPaused=false;campaignEpoch++;forecast=false;clearMoments();if(!state.scenario)storage.write(BACKUP,JSON.stringify(state));screen='game';state=scenario(b.dataset.scenario,{human:state.players[0].persona,mode:'manual'});newsOverlay.reset();selected=state.players[0].position;dialog.close();persist();render();if(state.phase==='airport')openAirport();else showPendingEvent();return;}
 if(a==='restore'){forecast=false;clearMoments();const old=parseCampaign(storage.read(BACKUP));if(!old){toast('Резервная партия недоступна. Текущий сценарий сохранён.');return;}campaignPaused=false;campaignEpoch++;if(dialog.open)dialog.close();state=old;newsOverlay.reset(state.news||[]);selected=state.players[state.current].position;persist();render();showPendingEvent();runBot();return;}
 if(!canControl(state)){toast(state.network&&!network.connected?'Восстанавливаем подключение.':'Сейчас решение принимает другой участник.');return;}
 if(a==='hqSelect'){openHQ();return;}
 if(a==='infraOpen'||a==='infraMode'){openInfrastructure(b.dataset.mode||'place');return;}
 if(a==='infraTarget'){openInfrastructure(b.dataset.mode,Number(b.dataset.position),b.dataset.target!==undefined?Number(b.dataset.target):null);return;}
 if(a==='courtAccuse'){if(state.phase==='decision'&&state.decision?.kind==='courtAccusation')openHand('sue',state.decision.target);return;}
 if(a==='sue'){openHand('sue');return;}
 if(a==='swanPass'){
  modal('Кому передать событие?','<p class="dialog-lead">Получатель применит событие к своей кампании. Вложения останутся добровольными.</p><div class="law-target-list">'+state.players.filter(p=>p.id!==state.current).map(p=>'<button data-action="swanTarget" data-target="'+p.id+'">'+portrait(p.persona)+'<strong>'+p.name+'</strong><small>'+getVotes(state,p.id)+'% поддержки · '+money(p.cash)+'</small></button>').join('')+'</div>','Способность Милюкова');return;
 }
 if(a==='sueTarget'){openHand('sue',Number(b.dataset.target));return;}
 if(a==='swap'){openHand('swap');return;}
 let action;
 if(a==='kolchakDouble'||a==='kolchakNormal')action={type:'KOLCHAK_MOVE',double:a==='kolchakDouble'};
 if(a==='courtDecline')action={type:'COURT_RESPONSE',accept:false};
 if(a==='reactionNo')action={type:'KERENSKY_RESPONSE',accept:false};
 if(a==='swanTarget')action={type:'SWAN_PASS',target:Number(b.dataset.target)};
 if(a==='roll')action={type:'ROLL',dice:rollDice()};
 if(a==='buy')action={type:'BUY'};
 if(a==='end')action={type:'END_TURN'};
 if(a==='infraPlace')action={type:'INFRA_PLACE',position:Number(b.dataset.position)};
 if(a==='infraRemove')action={type:'INFRA_REMOVE',position:Number(b.dataset.position),target:Number(b.dataset.target)};
 if(a==='buildHQ')action={type:'HQ',position:Number(b.dataset.position)};
 if(a==='buildOffice')action={type:'OFFICE',position:Number(b.dataset.position)};
 if(a==='travel')action={type:'TRAVEL'};
 if(a==='swanSettle')action={type:'SWAN_SETTLE',index:Number(b.dataset.index)};
 if(a==='swanYes'||a==='swanNo')action={type:'SWAN',accept:a==='swanYes'};
 if(a==='swapCard')action={type:'LAW_SWAP',index:Number(b.dataset.index)};
 if(a==='sueCard')action=state.decision?.kind==='courtAccusation'?{type:'COURT_RESPONSE',accept:true,index:Number(b.dataset.index)}:state.decision?.kind==='reaction'?{type:'KERENSKY_RESPONSE',accept:true,index:Number(b.dataset.index)}:{type:'LAW_SUE',index:Number(b.dataset.index),target:Number(b.dataset.target)};
 if(a==='leninContinue')action={type:'LENIN_CONTINUE'};
 if(a==='jailPay')action={type:'JAIL_PAY'};
 if(a==='jailTry')action={type:'JAIL_TRY',dice:rollDice()};
 if(a==='jailWait')action={type:'JAIL_WAIT'};
 if(!action)return;
 const cityCommand=b.dataset.cityCommand==='true',cityPosition=Number(b.dataset.position);
 if(dialog.open)dialog.close();const applied=await commit(action,{dice:!!action.dice});
 if(cityCommand&&applied&&state.phase!=='finished'){selected=cityPosition;if(infrastructureTurn(state)&&state.decision.followup)openInfrastructure(state.decision.followup.mode);else openCity();}
 if(a==='swanSettle'&&applied&&state.phase!=='finished')openHand();
 runBot();
 if(state.phase==='airport'&&canControl(state)&&!dialog.open)openAirport();
}
app.addEventListener('click',handleClick);dialog.addEventListener('click',handleClick);newsOverlay.host.addEventListener('click',handleClick);
app.addEventListener('input',event=>{
 if(event.target.id==='room-name')roomNameDraft=event.target.value;
 if(event.target.id==='room-code')roomCodeDraft=event.target.value;
});
new MutationObserver(syncNews).observe(dialog,{attributes:true,attributeFilter:['open']});
dialog.addEventListener('change',e=>{if(e.target.matches('[data-rule-select]'))openRules(e.target.value);});
dialog.addEventListener('input',e=>{if(e.target.matches('[data-rule-search]'))dialog.querySelector('.rb-search-results').innerHTML=ruleSearchMarkup(e.target.value);});
dialog.addEventListener('keydown',e=>{
 const search=dialog.querySelector('.rb-search-panel:not([hidden])');if(search&&e.key==='Escape'){e.preventDefault();e.stopPropagation();search.hidden=true;const trigger=dialog.querySelector('.rb-search-trigger');trigger.setAttribute('aria-expanded','false');trigger.focus();return;}
 if(search)return;
 if(!dialog.querySelector('.visual-rulebook')||e.target.matches('select,input,textarea')||e.altKey||e.ctrlKey||e.metaKey)return;
 if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();advanceRules(e.key==='ArrowLeft'?-1:1);}
});
dialog.addEventListener('change',e=>{if(e.target.name==='news-filter'){newsSettings.filter=e.target.value;saveNewsSettings();}});
app.addEventListener('keydown',e=>{if(e.key==='Escape'&&['world','prologue'].includes(screen)&&!dialog.open){e.preventDefault();if(screen==='prologue')beginFromWorld();else returnFromWorld();}});
app.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('[data-tile],[data-airport],[data-district],g.pawn')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
dialog.addEventListener('change',e=>{if(e.target.id==='bot-mode')newMode=e.target.checked?'bot':'manual';});
dialog.addEventListener('input',event=>{
 const input=event.target;if(!['effects-volume','music-volume'].includes(input.id))return;
 const value=Number(input.value)/100;
 if(input.id==='effects-volume')soundscape.setEffectsVolume(value);else soundscape.setMusicVolume(value);
 const output=dialog.querySelector('#'+input.id+'-value');if(output)output.textContent=Math.round(value*100)+'%';
});
dialog.addEventListener('cancel',e=>{e.preventDefault();if(!wheelBusy)closePanel();});
// Reading a city, card or reference pauses computer decisions until the window closes.
dialog.addEventListener('close',()=>{setTimeout(()=>{showPendingEvent();runBot();},200);});
if(isolatedTest){
 const demo=new URLSearchParams(location.search).get('scene');
 if(['court-visit','catherine_i','anna','witte','stolypin','kirov','trotsky','lawyer-deck','swan-deck','swan-blizzard','travel-deck','milyukov','kerensky','khrushchev','kolchak','airport','multiplayer','infrastructure'].includes(demo)){state=scenario(demo);screen='game';selected=state.players[0].position;}
}
if(isolatedTest){const wp=new URLSearchParams(location.search).get('world');if(wp==='prologue'){screen='prologue';worldOnboarding=true;worldView.origin='setup';}else if(wp&&PERSONAS[wp]){screen='world';Object.assign(worldView,worldChoice(null,wp),{tab:'dossiers'});}}
if(isolatedTest){
 const courtDemo=new URLSearchParams(location.search).get('court');
 if(['visit','bot','computer-visit'].includes(courtDemo)){
  state=scenario('court-visit');
  if(courtDemo==='bot'){state.players.forEach(p=>p.bot=p.id!==0);state.mode='bot';state.players[0].hand=['false-votes','false-votes'];}
  if(courtDemo==='computer-visit'){
   state=newGame({players:[{persona:'catherine',bot:false},{persona:'nicholas',bot:true}]});state.current=1;state.players[1].position=7;state.players[1].hand=['clean','false-votes'];state=reduce(state,{type:'ROLL',dice:[2,3]});
  }
  screen='game';selected=12;if(courtDemo==='bot')setTimeout(runBot,300);
 }
}
if(isolatedTest){
 const jailDemo=new URLSearchParams(location.search).get('jail');
 if(['pay','wait','double','miss','bot-pay','bot-double','bot-miss'].includes(jailDemo)){
  const bot=jailDemo.startsWith('bot-');state=newGame({players:[{persona:'catherine',bot:false},{persona:'nicholas',bot}]});state.current=bot?1:0;
  Object.assign(state.players[state.current],{position:12,jail:jailDemo==='wait'?1:3,cash:jailDemo.endsWith('pay')?250+(bot?250:0):100});state.phase='jailed';state.decision=null;screen='game';selected=12;
  if(bot)setTimeout(runBot,300);
 }
}
render();showPendingEvent();
if(isolatedTest&&new URLSearchParams(location.search).get('news')==='demo'){
 const previous=newGame({players:['catherine','nicholas','lenin','stalin'].map(persona=>({persona,bot:false}))});
 previous.current=1;previous.round=3;previous.players[1].position=19;previous.phase='decision';previous.decision={kind:'city',position:19,title:'Омск',text:'Откройте кампанию.'};
 state=withCampaignNews(previous,reduce(previous,{type:'BUY'}),{type:'BUY'});
 state.current=0;state.phase='ready';state.decision=null;state.players[0].position=5;screen='game';selected=5;render();
}


if(isolatedTest&&new URLSearchParams(location.search).get('news')==='world'){
 const previous=newGame({players:['catherine','nicholas','lenin','stalin'].map((persona,i)=>({persona,bot:i!==0}))});
 previous.current=2;previous.round=7;previous.players[2].position=20;previous.players[0].position=3;previous.players[1].position=1;previous.players[3].position=19;
 previous.regions[5]={owner:1,level:'headquarters',infrastructure:{}};previous.regions[1]={owner:1,level:'regional_office',infrastructure:{}};
 previous.phase='decision';previous.decision={kind:'infrastructure',title:'Инфраструктура',text:'Разместите один объект.'};
 state=withCampaignNews(previous,reduce(previous,{type:'INFRA_PLACE',position:5}),{type:'INFRA_PLACE',position:5});
 newsSettings.duration=10;screen='game';selected=5;render();
}


document.addEventListener('visibilitychange',()=>{syncNews();document.body.classList.toggle('motion-paused',document.hidden);if(document.hidden){campaignEntrance.finish();settleAnimations();settleDice();clearMoments();clearVisualEffects();soundscape.suspend();}});
window.addEventListener('online',()=>{network.reconnect();});
window.addEventListener('offline',()=>{network.disconnect();});
window.addEventListener('focus',()=>{network.reconnect();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)network.reconnect();});
window.addEventListener('pageshow',event=>{if(event.persisted&&network.active&&(screen==='room'||state.network))network.resume();});
window.addEventListener('pagehide',()=>{network.stop();newsOverlay.reset(state.news||[]);campaignEntrance.finish();settleAnimations();settleDice();clearMoments();clearVisualEffects();soundscape.dispose();});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change',event=>{if(event.matches){campaignEntrance.finish();settleAnimations();settleDice();clearVisualEffects();}});

if(!isolatedTest&&(network.active||invitationCode||launchUrl.searchParams.has('multiplayer')))queueMicrotask(async()=>{
 // On a bare VK launch, give a new invitation time to arrive before resuming an older seat.
 if(inVk&&!invitationCode)await vkPlatform.ready;
 if(!openingVkInvitation)await openRoom();
});
