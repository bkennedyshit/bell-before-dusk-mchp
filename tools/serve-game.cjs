const http=require("node:http");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const port=Number(process.env.BELL_PORT||4173);
const host=process.env.BELL_HOST||"127.0.0.1";
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
  ".png":"image/png",".mp3":"audio/mpeg",".json":"application/json"};
http.createServer((req,res)=>{
  const pathname=new URL(req.url,"http://127.0.0.1").pathname;
  let name;
  try{name=decodeURIComponent(pathname);}catch(_){res.writeHead(400).end();return;}
  const file=path.resolve(root,"."+name+(name.endsWith("/")?"index.html":""));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.setHeader("Content-Type",mime[path.extname(file)]||"application/octet-stream");
  res.setHeader("Cache-Control","no-store");
  fs.createReadStream(file).pipe(res);
}).listen(port,host,()=>console.log("Bell Before Dusk: http://"+host+":"+port+"/"));
