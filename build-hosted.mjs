import fs from 'node:fs/promises';
import {build} from 'esbuild';
await fs.rm('dist',{recursive:true,force:true});
await fs.mkdir('dist/client',{recursive:true});
await fs.cp('web','dist/client',{recursive:true});
await build({entryPoints:['worker/index.js'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'neutral',target:'es2022',external:['node:crypto'],minify:true});
try{
 await fs.mkdir('dist/.openai',{recursive:true});
 await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');
}catch(error){if(error.code!=='ENOENT')throw error;}
console.log('Cloud game built.');
