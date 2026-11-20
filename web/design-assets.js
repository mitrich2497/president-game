// One asset per subject. Landscape illustrations are artistic district impressions.
export const DESIGN_ASSETS={
 cfo:'./assets/design/cfo.png',pfo:'./assets/design/pfo.png',skfo:'./assets/design/skfo.png',yufo:'./assets/design/yufo.png',
 szfo:'./assets/design/szfo.png',ufo:'./assets/design/ufo.png',sfo:'./assets/design/sfo.png',dfo:'./assets/design/dfo.png',
 swan:'./assets/design/black-swan.png',lawyer:'./assets/design/lawyer.png',travel:'./assets/design/travel.png',infra:'./assets/design/infrastructure.png',
 court:'./assets/design/court.png',president:'./assets/design/president.png',airport:'./assets/design/airport.png'
};
export const DISTRICT_IDS={'ЦФО':'cfo','ПФО':'pfo','СКФО':'skfo','ЮФО':'yufo','СЗФО':'szfo','УФО':'ufo','СФО':'sfo','ДФО':'dfo'};
export const DISTRICT_COLORS={cfo:'#963e4c',pfo:'#a25175',skfo:'#776295',yufo:'#347c70',szfo:'#3d849a',ufo:'#aa7b41',sfo:'#466e9b',dfo:'#4d8661',neutral:'#b18d50'};
export function designImage(kind,cls='',alt=''){return `<img class="design-image ${cls}" src="${DESIGN_ASSETS[kind]}" alt="${alt}" draggable="false">`;}

export const PORTRAIT_ASSETS={catherine_i:'./assets/portraits-v29/catherine_i.png',anna:'./assets/portraits-v29/anna.png',witte:'./assets/portraits-v29/witte.png',stolypin:'./assets/portraits-v29/stolypin.png',kirov:'./assets/portraits-v29/kirov.png',trotsky:'./assets/portraits-v29/trotsky.png',kolchak:'./assets/portraits-v17/kolchak.png',milyukov:'./assets/portraits-v17/milyukov.png',khrushchev:'./assets/portraits-v17/khrushchev.png',kerensky:'./assets/portraits-v17/kerensky.png',catherine:'./assets/portraits/catherine-v08.png',nicholas:'./assets/portraits/nicholas-v08.png',lenin:'./assets/portraits/lenin-v11.png',elizabeth:'./assets/portraits/elizabeth-v11.png',brezhnev:'./assets/portraits/brezhnev-v11.png',stalin:'./assets/portraits/stalin-v11.png'};

// Original illustrated city collection, shared by all game surfaces.
export const CITY_ICON_ASSETS={"1": "./assets/city-icons/01.png", "3": "./assets/city-icons/03.png", "5": "./assets/city-icons/05.png", "7": "./assets/city-icons/07.png", "9": "./assets/city-icons/09.png", "11": "./assets/city-icons/11.png", "13": "./assets/city-icons/13.png", "15": "./assets/city-icons/15.png", "17": "./assets/city-icons/17.png", "19": "./assets/city-icons/19.png", "21": "./assets/city-icons/21.png", "23": "./assets/city-icons/23.png", "25": "./assets/city-icons/25.png", "27": "./assets/city-icons/27.png", "29": "./assets/city-icons/29.png", "31": "./assets/city-icons/31.png", "33": "./assets/city-icons/33.png", "35": "./assets/city-icons/35.png", "37": "./assets/city-icons/37.png", "39": "./assets/city-icons/39.png", "41": "./assets/city-icons/41.png", "43": "./assets/city-icons/43.png", "45": "./assets/city-icons/45.png", "47": "./assets/city-icons/47.png"};
