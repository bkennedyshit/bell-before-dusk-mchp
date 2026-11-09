/* Native completion-pass smoke. Uses disposable fixtures and restores the exact
 * selected Android save. This is not a fresh-save campaign playthrough. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const prefix=fs.readFileSync(path.join(__dirname,'android-smoke.cjs'),'utf8').split('(async()=>{')[0];
vm.runInNewContext(prefix+`
(async()=>{
  await connect();
  // Navigate to title first so pagehide saves the current legitimate session.
  await page.goto('https://localhost/');await sleep(500);
  priorSave=await page.evaluate(k=>localStorage.getItem(k),key);
  if(!priorSave)throw Error('This smoke requires an existing save to preserve; run baseline smoke first.');
  await page.evaluate(k=>{
    const value=JSON.parse(localStorage.getItem(k));
    value.mode='stage';value.zone=null;value.stage={id:'storehouse',returnTo:'south',checkpoint:2200,relicCollected:true};
    value.progress.prologue=true;value.progress.captain=false;value.progress.guardian=false;
    value.game.scene='platform';value.game.hero.hp=value.game.hero.maxHp;value.game.hero.invulnerable=10;
    localStorage.setItem(k,JSON.stringify(value));
  },key);
  await page.reload();await sleep(500);await tap(180,515);await sleep(700);
  await screenshot('14-tiered-captain-room');
  assert.ok(await page.evaluate(()=>performance.getEntriesByType('resource').some(r=>r.name.includes('captain-arena-backdrop'))),'Native arena asset loads');
  await tap(304,580);await sleep(130);await screenshot('15-arena-native-jump');
  await tap(40,180);await sleep(150);await tap(180,504);await sleep(150);
  await screenshot('16-native-journey-kit');
  await tap(180,232);await sleep(150);await screenshot('17-native-weapons');
  const billing=await page.evaluate(async()=>{
    const plugin=window.Capacitor.registerPlugin?.('BellBilling')||window.Capacitor.Plugins?.BellBilling;
    if(!plugin)throw Error('Billing bridge absent; Capacitor keys: '+Object.keys(window.Capacitor).join(','));
    return await plugin.status();
  });
  assert.equal(billing.owned,false);assert.equal(billing.configured,false,'Blank public key fails closed');
  assert.equal(billing.available,false);assert.equal(billing.price,'');
  // Fresh opening cards in this temporary slot, not a reset of the owner's app.
  await page.goto('https://localhost/');await sleep(250);
  await page.evaluate(k=>localStorage.removeItem(k),key);await page.reload();await sleep(350);
  await tap(180,515);await sleep(200);await screenshot('18-native-story-intro');
  for(let i=0;i<3;i++){await tap(180,560);await sleep(100);}
  const intro=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  assert.equal(intro.progress.storyIntroSeen,true);assert.equal(intro.game.phase,'campaign_home');
  fs.writeFileSync(path.join(out,'completion-smoke-result.json'),JSON.stringify({passed:true,build:await page.evaluate(()=>window.BELL_BUILD),
    checks:['native captain arena loads','native arena jump','native journey kit and weapons cards','native billing bridge missing-key rejection','fresh story introduction touch acknowledgement'],
    fixturesUsed:true,fullPlaythrough:false,livePurchaseTested:false},null,2));
  console.log('PASS Android completion smoke: arena/jump, Journey Kit/weapons, story intro, native billing fail-closed; no live purchase.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{
  if(page&&priorSave!==undefined)try{
    await page.goto('https://localhost/');
    await page.evaluate(({key,value})=>{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);},{key,value:priorSave});
    await page.reload();assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),priorSave,'Exact owner save restored');
    console.log('PASS Exact owner save restored after disposable native fixtures.');
  }catch(e){console.error('SAVE RESTORATION FAILED',e);process.exitCode=1;}
  if(androidDevice)await androidDevice.close();if(port)try{run('forward','--remove','tcp:'+port);}catch(_){}
});`,{require,__dirname,console,process,Buffer,setTimeout,clearTimeout});
