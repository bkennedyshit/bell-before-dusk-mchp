/* Instrumented native route session. Captures references, never grants progress,
 * health or positions. Storage is redirected to an isolated QA slot. */
const fs=require('node:fs'),path=require('node:path'),readline=require('node:readline');
const {execFileSync}=require('node:child_process');
const pw=require('C:/Users/billk/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const adb=path.join(process.env.LOCALAPPDATA,'Android/Sdk/platform-tools/adb.exe');
const run=(...args)=>execFileSync(adb,['-s','emulator-5554',...args],{encoding:'utf8'}).trim();
const key='bell-before-dusk.campaign.v1.android-campaign';
const out=path.resolve(__dirname,'../art-review/'+(process.env.BELL_ROUTE_OUT||'android-route-2026-10-29'));fs.mkdirSync(out,{recursive:true});
const slotPrefix=key+'.'+(process.env.BELL_ROUTE_SLOT||'qa-route-20261029');
(async()=>{
 const device=(await pw._android.devices({omitDriverInstall:true})).find(d=>d.serial()==='emulator-5554');
 const page=await(await device.webView({pkg:'com.bellbeforedusk.playtest'})).page();
 await page.goto('https://localhost/');
 const original=await page.evaluate(k=>localStorage.getItem(k),key);
 fs.writeFileSync(path.join(out,'owner-save-backup.json'),JSON.stringify({key,value:original}));
 await page.context().addInitScript(({key,slotPrefix})=>{
   const oldSlots=Object.keys(localStorage).filter(k=>k.startsWith(slotPrefix));
   const temp=oldSlots.sort((a,b)=>{
     try{return JSON.parse(localStorage.getItem(b)).progress.playTime-JSON.parse(localStorage.getItem(a)).progress.playTime;}catch{return 0;}
   })[0]||slotPrefix;
   const get=Storage.prototype.getItem,set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
   Storage.prototype.getItem=function(k){return get.call(this,k===key?temp:k)};
   Storage.prototype.setItem=function(k,v){return set.call(this,k===key?temp:k,v)};
   Storage.prototype.removeItem=function(k){return remove.call(this,k===key?temp:k)};
   window.__ownerSave=()=>get.call(localStorage,key);
   let factory;
   Object.defineProperty(window,'createBellCampaign',{configurable:true,get:()=>factory,set:fn=>{
     factory=api=>{const c=fn(api);window.routeQA={api,c,d:c.debug,g:api.game,k:api.keys};return c;};
   }});
 },{key,slotPrefix});
 await page.reload();await page.waitForFunction(()=>window.routeQA);await page.waitForTimeout(800);
 await page.evaluate(()=>{
   const q=window.routeQA;
   window.routeState=()=>({title:q.c.title,scene:q.g.scene,mode:q.d.mode,paused:q.c.paused,hp:q.g.hero?.hp,
     hero:{x:q.g.hero?.x,y:q.g.hero?.y},progress:q.d.progress,context:q.c.context(),
     stage:q.d.stage?{...q.d.stage}:null,guardian:q.d.guardian});
   window.routeKey=(key,down=true)=>dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{key,bubbles:true}));
   window.routeStop=()=>{for(const key of [...q.k])window.routeKey(key,false);q.api.stopHeroTravel();};
   window.routeWait=ms=>new Promise(r=>setTimeout(r,ms));
   window.routeMove=async(x,y,limit=20000)=>{
     const started=performance.now();let last='';
     while(performance.now()-started<limit){
       const h=q.g.hero,dx=x-h.x,dy=y-h.y;if(Math.hypot(dx,dy)<10)break;
       if(q.c.paused||q.d.mode==='stage')break;
       const desired=new Set();if(Math.abs(dx)>6)desired.add(dx>0?'d':'a');if(Math.abs(dy)>6)desired.add(dy>0?'s':'w');
       for(const k of ['w','a','s','d'])if(desired.has(k)!==q.k.has(k))window.routeKey(k,desired.has(k));
       window.routeKey('j');window.routeKey('j',false);
       await window.routeWait(100);
     }
     window.routeStop();return window.routeState();
   };
 });
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 console.log('READY '+JSON.stringify(await page.evaluate(()=>({build:window.BELL_BUILD,state:routeState()}))));
 const input=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
 try{for await(const line of input){
   try{const cmd=JSON.parse(line);let value;
     if(cmd.shot){fs.writeFileSync(path.join(out,cmd.shot+'.png'),execFileSync(adb,['-s','emulator-5554','exec-out','screencap','-p'],{maxBuffer:20*1024*1024}));value='Native screenshot saved';}
     else if(cmd.finish){await page.evaluate(()=>routeStop());break;}
     else value=await page.evaluate(cmd.code);
     console.log('RESULT '+JSON.stringify(value));
     fs.appendFileSync(path.join(out,'session.jsonl'),JSON.stringify({time:new Date().toISOString(),command:cmd,result:value})+'\n');
   }catch(e){console.log('ERROR '+e.message);}
 }}finally{
   const state=await page.evaluate(()=>{routeStop();return routeState();});
   const same=await page.evaluate(original=>window.__ownerSave()===original,original);
   fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({state,errors,ownerSaveUnchanged:same,fullPlaythrough:!!state.progress.storyEndingSeen,instrumented:true},null,2));
   // A new non-instrumented WebView launch removes all temporary hooks.
   run('shell','am','force-stop','com.bellbeforedusk.playtest');
   run('shell','am','start','-n','com.bellbeforedusk.playtest/.MainActivity');
   await device.close();console.log('CLOSED ownerSaveUnchanged='+same);
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
