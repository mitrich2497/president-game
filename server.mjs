import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {RoomService,multiplayerHandler} from './multiplayer.mjs';
import {VK_ENTRY_PATH,VK_FRAME_POLICY} from './web/vk-platform.js';
import {soundtrackAsset} from './soundtrack.mjs';
const base=path.dirname(fileURLToPath(import.meta.url)),root=path.join(base,'web');
const port=Number(process.env.PORT||4175),host=process.env.HOST||'0.0.0.0';
const addresses=Object.values(os.networkInterfaces()).flat().filter(x=>x.family==='IPv4'&&!x.internal&&/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(x.address)).map(x=>`http://${x.address}:${port}/`);
const api=multiplayerHandler(new RoomService({directory:process.env.ROOM_DIRECTORY||path.join(base,'work','rooms')}),{addresses});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.m4a':'audio/mp4','.wav':'audio/wav'};
http.createServer(async(req,res)=>{
 if(await api(req,res))return;
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 const vkEntry=pathname===VK_ENTRY_PATH;
 const file=path.resolve(root,'.'+(pathname==='/'||vkEntry?'/index.html':soundtrackAsset(pathname)||pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'}).end();return;}
 fs.stat(file,(err,stat)=>{
  if(err||!stat.isFile()){res.writeHead(404).end('Not found');return;}
  let start=0,end=stat.size-1,status=200;
  if(req.headers.range){
   const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
   if(!match||(!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':'bytes */'+stat.size}).end();return;}
   start=match[1]?Number(match[1]):Math.max(0,stat.size-Number(match[2]));
   end=match[1]&&match[2]?Math.min(Number(match[2]),stat.size-1):stat.size-1;
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=stat.size){res.writeHead(416,{'Content-Range':'bytes */'+stat.size}).end();return;}
   status=206;
  }
  const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','Accept-Ranges':'bytes','Content-Length':Math.max(0,end-start+1)};
  if(vkEntry){headers['Content-Security-Policy']=VK_FRAME_POLICY;headers['Referrer-Policy']='no-referrer';}
  if(status===206)headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
  res.writeHead(status,headers);
  if(req.method==='HEAD'||stat.size===0){res.end();return;}
  const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 });
}).listen(port,host,()=>{if(addresses[0]){try{fs.writeFileSync(path.join(root,'network-launch.json'),JSON.stringify({url:'http://127.0.0.1:'+port+'/'}));}catch{}}console.log(['Local: http://127.0.0.1:'+port,...addresses.map(x=>'Сеть: '+x)].join('\n'));});
