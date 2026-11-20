export function soundtrackAsset(pathname){
 const match=/^\/soundtrack\/(quiet-horizons|lantern-garden)\.m4a$/.exec(pathname);
 return match?'/assets/audio/'+match[1]+'.m4a':null;
}

export async function soundtrackResponse(request,assets,path){
 const url=new URL(path,request.url),sourceHeaders=new Headers(request.headers);
 sourceHeaders.delete('Range');
 sourceHeaders.delete('If-Range');
 sourceHeaders.set('Accept-Encoding','identity');
 const asset=await assets.fetch(new Request(url,{method:request.method,headers:sourceHeaders}));
 if(asset.status!==200)return asset;

 const headers=new Headers(asset.headers);
 headers.set('Content-Type','audio/mp4');
 headers.set('Accept-Ranges','bytes');
 const range=request.method==='GET'&&request.headers.get('Range');
 const validator=request.headers.get('If-Range');
 if(!range||validator&&validator!==headers.get('ETag')&&validator!==headers.get('Last-Modified')){
  return new Response(asset.body,{headers});
 }

 // The static asset binding always serves the complete track. The public
 // soundtrack endpoint handles the byte ranges that iOS media players request.
 const bytes=await asset.arrayBuffer(),size=bytes.byteLength;
 const match=/^bytes=(\d*)-(\d*)$/i.exec(range);
 if(match&&(match[1]||match[2])){
  const first=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
  const last=match[1]&&match[2]?Math.min(size-1,Number(match[2])):size-1;
  if(first<size&&last>=first){
   headers.set('Content-Range','bytes '+first+'-'+last+'/'+size);
   headers.set('Content-Length',String(last-first+1));
   return new Response(bytes.slice(first,last+1),{status:206,headers});
  }
 }
 headers.set('Content-Range','bytes */'+size);
 headers.set('Content-Length','0');
 return new Response(null,{status:416,headers});
}
