import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const target=path.join(root,'dist','pages');
const online='https://president-campaign-oct22.vlast2497.chatgpt.site/';

await fs.rm(target,{recursive:true,force:true});
await fs.cp(path.join(root,'web'),target,{recursive:true});
await fs.rm(path.join(target,'network-launch.json'),{force:true});
const html=await fs.readFile(path.join(target,'index.html'),'utf8');
const page=html.replace('<head>','<head><meta name="president-room-server" content="'+online+'">');
await fs.writeFile(path.join(target,'index.html'),page);
await fs.writeFile(path.join(target,'vk.html'),page);
await fs.writeFile(path.join(target,'.nojekyll'),'');
await fs.mkdir(path.join(target,'soundtrack'),{recursive:true});
for(const track of ['quiet-horizons','lantern-garden']){
 await fs.copyFile(path.join(target,'assets','audio',track+'.m4a'),path.join(target,'soundtrack',track+'.m4a'));
}
console.log('GitHub Pages build ready in dist/pages.');
