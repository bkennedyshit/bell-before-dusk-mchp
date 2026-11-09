/* Test only our explicitly selected Android playtest app. No app data is cleared. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {execFileSync}=require("node:child_process");
let playwright;
try{playwright=require("playwright");}catch(_){playwright=require("C:/Users/billk/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");}
const root=path.resolve(__dirname,".."),out=path.join(root,"art-review","android-playtest");
const sdk=process.env.ANDROID_HOME||path.join(process.env.LOCALAPPDATA,"Android","Sdk");
const adb=path.join(sdk,"platform-tools","adb.exe"),serial=process.env.BELL_ANDROID_SERIAL||"emulator-5554";
const app="com.bellbeforedusk.playtest",key="bell-before-dusk.campaign.v1.android-campaign";
const run=(...args)=>execFileSync(adb,["-s",serial,...args],{encoding:"utf8",timeout:30000}).trim();
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let port,androidDevice,page,priorSave,oldAirplane;
fs.mkdirSync(out,{recursive:true});
async function connect(){
  let pid="";
  for(let i=0;i<20&&!pid;i++){try{pid=run("shell","pidof",app);}catch(_){}if(!pid)await sleep(500);}
  assert.match(pid,/^\d+$/,"App process must be running");
  port=run("forward","tcp:0","localabstract:webview_devtools_remote_"+pid);
  androidDevice=(await playwright._android.devices({omitDriverInstall:true})).find(d=>d.serial()===serial);
  assert.ok(androidDevice,"Selected ADB device is available");
  page=await (await androidDevice.webView({pkg:app})).page();
  assert.ok(page,"Packaged local WebView is inspectable");
}
async function tap(x,y){
  const b=await page.locator("canvas").boundingBox(),width=await page.evaluate(()=>innerWidth);
  const deviceWidth=Number(run("shell","wm","size").match(/(\d+)x\d+/)[1]);
  run("shell","input","tap",String(Math.round((b.x+x/360*b.width)*deviceWidth/width)),
    String(Math.round((b.y+y/640*b.height)*deviceWidth/width)));
}
async function swipe(x1,y1,x2,y2,duration){
  const b=await page.locator("canvas").boundingBox(),width=await page.evaluate(()=>innerWidth);
  const ratio=Number(run("shell","wm","size").match(/(\d+)x\d+/)[1])/width;
  run("shell","input","swipe",String(Math.round((b.x+x1/360*b.width)*ratio)),String(Math.round((b.y+y1/640*b.height)*ratio)),
    String(Math.round((b.x+x2/360*b.width)*ratio)),String(Math.round((b.y+y2/640*b.height)*ratio)),String(duration));
}
async function screenshot(name){
  fs.writeFileSync(path.join(out,name+".png"),execFileSync(adb,["-s",serial,"exec-out","screencap","-p"],{timeout:15000,maxBuffer:20*1024*1024}));
}
(async()=>{
  run("shell","am","start","-n",app+"/.MainActivity");
  await connect();
  // Android can show its one-time immersive-mode guidance over a fresh install.
  try{
    run("shell","uiautomator","dump","/sdcard/bell-playtest-ui.xml");
    const ui=run("shell","cat","/sdcard/bell-playtest-ui.xml");
    const tip=ui.match(/<node[^>]*text="Got it"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if(tip)run("shell","input","tap",String(Math.round((+tip[1]+ +tip[3])/2)),String(Math.round((+tip[2]+ +tip[4])/2)));
  }catch(_){}
  const errors=[],external=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("request",r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith("https://localhost/"))external.push(r.url());});
  priorSave=await page.evaluate(k=>localStorage.getItem(k),key);
  await page.goto("https://localhost/");
  assert.equal(await page.evaluate(()=>window.BELL_BUILD?.edition),"android-campaign");
  assert.equal(await page.evaluate(()=>location.search),"");
  await page.waitForFunction(()=>document.querySelector("canvas")&&performance.now()>1000);
  await sleep(700);await screenshot("01-title");
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await tap(180,515);
  await page.waitForFunction(k=>!!localStorage.getItem(k),key,{timeout:15000});
  const arrival=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  assert.equal(arrival.progress.prologue,true,"Default Android entry must bypass the legacy collection/demo loop");
  if(!priorSave){
    // A genuinely new Android campaign now begins with three authored cards.
    for(let i=0;i<3;i++){await tap(180,560);await sleep(150);}
    assert.equal(arrival.game.phase,"campaign_home");assert.equal(arrival.game.nodes.length,0);
    await sleep(3200); // let the arrival notice expire before touch navigation
    await swipe(57,582,57,620,1500);await tap(300,506);await sleep(300);
    assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).zone,key),"south",
      "The south exit must work from the default app launch, not just a QA deep link");
    await screenshot("02a-default-launch-south-exit");
  }
  await sleep(500);await screenshot("02-touch-start");
  run("shell","input","keyevent","4");await sleep(300);
  await screenshot("03-android-back-journal");
  assert.ok(run("shell","pidof",app),"Android Back must not exit during play");
  // Return to title before changing a QA save. An active WebView saves on unload;
  // otherwise that legitimate lifecycle save would overwrite the seeded fixture.
  await tap(180,420);await sleep(250);
  // Back up and restore this dedicated Android campaign slot around QA fixtures.
  await page.evaluate(k=>{
    const value=JSON.parse(localStorage.getItem(k));
    value.mode="zone";value.zone="south";value.stage=null;
    value.progress.prologue=true;value.progress.visited=["south"];
    value.game.hero.x=350;value.game.hero.y=700;value.game.hero.hp=value.game.hero.maxHp;
    value.game.mon=17;value.game.scene="topdown";
    localStorage.setItem(k,JSON.stringify(value));
  },key);
  await page.reload();await sleep(800);await tap(180,515);await sleep(700);
  await screenshot("04-southern-road");
  // A native background/resume must save and leave the journal paused.
  run("shell","input","keyevent","3");await sleep(700);
  run("shell","am","start","-n",app+"/.MainActivity");await sleep(700);
  await screenshot("05-background-resume");
  const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  assert.equal(saved.zone,"south");assert.equal(saved.game.mon,17);
  await tap(180,420);await sleep(250);
  // Follow the actual mobile town exit into the new field, then enter a real shop doorway.
  await page.evaluate(k=>{
    const value=JSON.parse(localStorage.getItem(k));value.mode="zone";value.zone="willow";value.stage=null;
    value.game.scene="topdown";value.game.hero.x=535;value.game.hero.y=475;
    localStorage.setItem(k,JSON.stringify(value));
  },key);
  await page.reload();await sleep(800);await tap(180,515);await sleep(500);await tap(300,506);await sleep(500);
  assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).zone,key),"march");
  await screenshot("10-willow-south-field");
  run("shell","input","keyevent","4");await sleep(250);await tap(180,420);
  await page.evaluate(k=>{
    const value=JSON.parse(localStorage.getItem(k));value.mode="zone";value.zone="cedar";value.stage=null;
    value.game.scene="topdown";value.game.hero.x=380;value.game.hero.y=205;
    localStorage.setItem(k,JSON.stringify(value));
  },key);
  await page.reload();await sleep(800);await tap(180,515);await sleep(500);await screenshot("11-actual-forge-door");
  await tap(300,506);await sleep(500);
  assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).mode,key),"interior");
  await screenshot("12-reused-forge-interior");
  run("shell","input","keyevent","4");await sleep(250);await tap(180,420);
  await page.evaluate(k=>{
    const value=JSON.parse(localStorage.getItem(k));
    value.mode="stage";value.zone=null;
    value.stage={id:"causeway",returnTo:"south",checkpoint:550,relicCollected:false};
    value.game.scene="platform";localStorage.setItem(k,JSON.stringify(value));
  },key);
  await page.reload();await sleep(800);await tap(180,515);await sleep(900);
  await screenshot("06-causeway");await tap(304,580);await sleep(150);await screenshot("07-native-jump");
  // Airplane mode is changed only on the disposable emulator used by this test.
  if(serial.startsWith("emulator-")){
    oldAirplane=run("shell","settings","get","global","airplane_mode_on");
    run("shell","cmd","connectivity","airplane-mode","enable");
  }
  await page.reload();await sleep(900);await tap(180,515);await sleep(700);
  await screenshot("08-offline-reload");
  assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).game.mon,key),17);
  assert.ok(await page.evaluate(()=>performance.getEntriesByType("resource").some(r=>r.name.includes("flooded-causeway"))),"Stage artwork loaded offline");
  run("shell","input","keyevent","4");await sleep(250);await tap(180,420);
  await tap(180,609);await sleep(500);await tap(300,506);await sleep(500);
  await screenshot("13-original-thief-opening");
  assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).game.mon,key),17,"Opening replay preserves the journey save");
  run("shell","input","keyevent","3");await sleep(600);
  run("shell","am","force-stop",app);
  await androidDevice.close();androidDevice=null;
  run("forward","--remove","tcp:"+port);port=null;
  run("shell","am","start","-n",app+"/.MainActivity");await sleep(700);
  await connect();
  page.on("pageerror",e=>errors.push(e.message));
  // A cold launch must retain the Android campaign edition without any query parameter.
  assert.equal(await page.evaluate(()=>location.search),"");
  assert.equal(await page.evaluate(()=>window.BELL_BUILD?.edition),"android-campaign");
  assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).game.mon,key),17);
  await screenshot("09-offline-cold-launch");
  assert.deepEqual(external,[],"Packaged game must not fetch a hosted game or analytics");
  assert.deepEqual(errors,[],"Android WebView JavaScript errors");
  const logs=run("logcat","-d","-t","1500");
  fs.writeFileSync(path.join(out,"logcat.txt"),logs);
  assert.ok(!logs.includes("FATAL EXCEPTION"),"No native fatal exception in recent logcat");
  fs.writeFileSync(path.join(out,"smoke-result.json"),JSON.stringify({passed:true,build:await page.evaluate(()=>window.BELL_BUILD),serial,android:run("shell","getprop","ro.build.version.release"),checks:["native touch start","portrait fit","Android Back journal","background/save/resume","expanded road and causeway assets","native jump","offline reload","Willow south exit reaches River March","actual forge doorway enters reused interior","original thief opening replay preserves journey","offline cold launch and process-restart save persistence","no external game requests","no JS/native crash"],physicalPhoneTested:false,billingBridgeBuilt:true,billingPurchaseTested:false},null,2));
  console.log("PASS Android: touch, portrait, Back, save/resume, campaign assets, jump, offline reload; no external requests or JS/native crashes.");
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{
  if(oldAirplane!==undefined&&oldAirplane!=="1")try{run("shell","cmd","connectivity","airplane-mode","disable");}catch(_){}
  if(page&&priorSave!==undefined)try{await page.evaluate(({key,value})=>{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);},{key,value:priorSave});await page.goto("https://localhost/");}catch(_){}
  if(androidDevice)await androidDevice.close();
  if(port)try{run("forward","--remove","tcp:"+port);}catch(_){}
});
