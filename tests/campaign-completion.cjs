/* Integration checks for the authored completion pass. Test fixtures may set
 * positions/health; production movement and combat hooks remain real. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function harness(saved=new Map()){
  const events={},listen=(name,fn)=>(events[name]||=[]).push(fn);
  const context=new Proxy({measureText:s=>({width:String(s).length*5}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
  const canvas={getContext:()=>context,addEventListener:listen,setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:360,height:640})};
  class Image{constructor(){this.complete=false;this.naturalWidth=0;}addEventListener(){}}
  const sandbox={Image,console,performance:{now:()=>0},requestAnimationFrame(){},addEventListener:listen,
    document:{getElementById:()=>canvas,addEventListener:listen,hidden:false},window:{BELL_BUILD:{edition:'android-campaign',version:'completion-test'}},
    localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)}};
  vm.createContext(sandbox);
  for(const file of ['campaign-features.js','campaign-story.js','campaign.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox);
  let source=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
  const close=source.lastIndexOf('  })();');
  source=source.slice(0,close)+`startAudio=()=>{};sfx=()=>{};globalThis.qa={campaign,game,keys,update,draw,doJump,doAttack,doInteract,contextAction,resetGame};`+source.slice(close);
  vm.runInContext(source,sandbox);const q=sandbox.qa;q.resetGame();
  q.frames=(n,dt=1/60)=>{for(let i=0;i<n;i++)q.update(dt);};
  q.startCampaign=()=>{q.campaign.prologueOutcome('victory');q.campaign.debug.home();};
  return {q,d:q.campaign.debug,sandbox,saved};
}
let failures=0,count=0;function test(name,run){try{run();count++;console.log('PASS '+name);}catch(error){failures++;console.error('FAIL '+name+'\n'+error.stack);}}
const near=(actual,expected,label)=>assert.ok(Math.abs(actual-expected)<.00001,label+': '+actual+' vs '+expected);
function unlockWeapons(d){const s=d.journey.normalize();s.unlocked=['katana','tanto','longblade'];}

test('Legacy campaign save keeps inventory/clears and gains completion feature defaults',()=>{
  const h=harness();h.q.startCampaign();h.d.enterZone('south',350,700);h.q.game.mon=31;h.q.game.hero.damage=3;
  h.d.progress.cleared.push('canopy');h.d.progress.purchases.push('steel');h.d.progress.quests.push('ferry');h.d.save();
  const old=h.d.readSave();delete old.progress.journey;delete old.progress.story;
  h.d.resume(old);
  assert.equal(h.q.game.mon,31);assert.equal(h.q.game.hero.damage,3);assert.ok(h.d.progress.cleared.includes('canopy'));
  assert.ok(h.d.progress.purchases.includes('steel'));assert.ok(h.d.progress.quests.includes('ferry'));
  assert.equal(h.d.journey.weapon().id,'katana');assert.equal(h.d.journey.normalize().difficulty,'normal');
  assert.equal(h.q.campaign.paused,false,'Resuming a legacy save must not inject an unseen intro over gameplay');
});

test('Opening Journey Kit from the real journal pauses the world and Back returns correctly',()=>{
  const {q,d}=harness();q.startCampaign();q.campaign.toggleMenu();
  q.campaign.pointer({x:180,y:504});assert.equal(d.journey.page,'hub');assert.equal(q.campaign.paused,true);q.draw();
  q.campaign.pointer({x:180,y:232});assert.equal(d.journey.page,'weapons');q.draw();
  q.campaign.pointer({x:180,y:575});assert.equal(d.journey.page,'hub');
  q.campaign.pointer({x:180,y:575});assert.equal(d.journey.paused,false);assert.equal(q.campaign.paused,true);
  q.campaign.toggleMenu();assert.equal(q.campaign.paused,false);
});

test('Actual top-down attacks consume equipped cooldown and use weapon damage and reach',()=>{
  const {q,d}=harness();q.startCampaign();d.enterZone('south',350,700);unlockWeapons(d);
  const foe=d.foes[0];d.foes.forEach(e=>e.dead=e!==foe);q.game.hero.damage=2;
  for(const [id,reach,damage,cooldown] of [['katana',52,1,.32],['tanto',38,.8,.22],['longblade',72,1.3,.52]]){
    d.journey.equip(id);foe.dead=false;foe.hp=20;foe.maxHp=20;foe.x=q.game.hero.x+30;foe.y=q.game.hero.y;
    q.game.hero.attackCooldown=0;q.doAttack();near(20-foe.hp,2*damage,id+' damage');near(q.game.hero.attackCooldown,cooldown,id+' cooldown');
    const after=foe.hp;q.doAttack();near(foe.hp,after,id+' blocks repeat attack during recovery');
    q.game.hero.attackCooldown=0;foe.hp=20;foe.x=q.game.hero.x+reach+2;q.doAttack();near(foe.hp,20,id+' outside reach');
    q.game.hero.attackCooldown=0;foe.x=q.game.hero.x+reach-2;q.doAttack();assert.ok(foe.hp<20,id+' inside reach');
  }
});

test('Equipped weapon reach also applies to real platform combat',()=>{
  const {q,d}=harness();q.startCampaign();d.enterStage('causeway');unlockWeapons(d);
  const p=d.stage,e=p.enemies[0];p.enemies.forEach(foe=>foe.dead=foe!==e);p.x=500;p.y=460;p.facing=1;
  e.dead=false;e.x=565;e.y=460;e.hp=20;e.maxHp=20;
  d.journey.equip('tanto');q.game.hero.attackCooldown=0;q.doAttack();near(e.hp,20,'Tanto cannot reach 65 pixels');
  d.journey.equip('longblade');q.game.hero.attackCooldown=0;q.doAttack();assert.ok(e.hp<20,'Longblade reaches the same target');
});

test('Assist modifies actual incoming campaign damage and guardian warnings, not movement',()=>{
  const {q,d}=harness();q.startCampaign();d.enterZone('ward',360,600);const speed=q.game.hero.speed;
  q.game.hero.hp=100;q.game.hero.invulnerable=0;d.journey.setDifficulty('normal');d.hurt(20);assert.equal(q.game.hero.hp,80);
  q.game.hero.hp=100;q.game.hero.invulnerable=0;d.journey.setDifficulty('assist');d.hurt(20);assert.equal(q.game.hero.hp,87);assert.equal(q.game.hero.speed,speed);
  const b=d.guardian;b.hp=b.maxHp;b.state='rest';b.stateClock=0;b.attackIndex=0;d.journey.setDifficulty('normal');d.updateGuardian(.01);const normal=b.stateClock;
  b.state='rest';b.stateClock=0;b.attackIndex=0;d.journey.setDifficulty('assist');d.updateGuardian(.01);near(b.stateClock,normal*1.35,'Assist guardian warning');
  assert.equal(b.state,'telegraph');
});

test('The real quest NPC modal accepts explicitly; spatial recovery and completion fallback persist',()=>{
  const {q,d}=harness();q.startCampaign();d.enterZone('cedar',540,400);
  d.talk({name:'Shin',role:'FISHERMAN',service:'local',line:'The road is open.'});assert.equal(d.journey.page,'quest');
  assert.equal(d.journey.normalize().questStates.tackle,'available');q.campaign.pointer({x:180,y:450});assert.equal(d.journey.normalize().questStates.tackle,'accepted');
  q.campaign.pointer({x:180,y:575});d.enterStage('spirit');const p=d.stage,item=d.journey.pickup('spirit');
  const floor=p.surfaces.filter(s=>item.x>=s.x&&item.x<=s.end).sort((a,b)=>d.surfaceY(b,item.x)-d.surfaceY(a,item.x))[0];
  assert.ok(floor,'Quest pickup has a reachable authored floor');p.x=item.x;p.y=d.surfaceY(floor,item.x);p.vx=0;p.vy=0;p.grounded=true;
  q.frames(1);assert.equal(d.journey.normalize().questStates.tackle,'recovered');assert.equal(d.readSave().progress.journey.questStates.tackle,'recovered');
  d.enterZone('cedar',540,400);const before=q.game.mon;d.talk({name:'Shin',role:'FISHERMAN',service:'local'});q.campaign.pointer({x:180,y:450});
  assert.equal(q.game.mon,before+8);assert.equal(d.journey.normalize().questStates.tackle,'claimed');
  d.journey.close();d.journey.acceptQuest('tool');d.enterStage('causeway');d.stage.relicCollected=true;d.completeStage();
  assert.equal(d.journey.normalize().questStates.tool,'recovered','Clearing a route recovers an accepted item even if a pickup was missed');
});

test('Town travel uses actual safe arrivals and never grants undiscovered locations or route keys',()=>{
  const {q,d}=harness();q.startCampaign();assert.equal(d.journey.travel('willow'),false);
  d.progress.visited.push('willow');assert.equal(d.journey.travel('cedar'),false);assert.equal(q.game.mapId,'town');
  d.progress.visited.push('cedar');const clears=d.progress.cleared.slice();assert.equal(d.journey.travel('cedar'),true);assert.equal(q.game.mapId,'cedar');
  assert.deepEqual(Array.from(d.progress.cleared),Array.from(clears));assert.equal(d.progress.captain,false);
  assert.equal(d.journey.travel('willow'),true);assert.equal(q.game.mapId,'willow');assert.equal(q.campaign.safe,true);
  d.enterZone('south',350,700);assert.equal(d.journey.travel('home'),false);assert.equal(q.game.mapId,'south');
});

test('Guardian victory opens authored epilogue and acknowledgement survives save/resume',()=>{
  const {q,d,sandbox}=harness();q.startCampaign();d.enterZone('ward',360,600);const b=d.guardian;
  b.hp=1;b.state='recover';q.game.hero.x=b.x-25;q.game.hero.y=b.y;q.game.hero.attackCooldown=0;q.doAttack();
  assert.equal(d.progress.guardian,true);assert.ok(q.campaign.paused,'Ending cards pause combat');
  assert.ok(d.storyCards,'Authored epilogue is active');
  d.resume(d.readSave());assert.ok(d.storyCards,'An interrupted ending reopens after restore');
  const text=JSON.stringify(sandbox.window.BELL_STORY.epilogue);assert.ok(text.includes('DELIVERY COMPLETE'));
  for(let n=0;n<10&&d.storyCards;n++)q.campaign.pointer({x:180,y:560});
  assert.equal(!!d.storyCards,false,'All ending cards can be dismissed with touch');
  const saved=d.readSave();assert.equal(saved.progress.guardian,true);d.resume(saved);
  assert.equal(q.campaign.paused,false,'Acknowledged ending does not trap the resumed game in credits');
});

test('A fresh introduction pauses and survives interruption without replaying over legacy saves',()=>{
  const {q,d}=harness();q.campaign.startFromTitle({x:180,y:510});
  assert.ok(d.storyCards);assert.equal(q.campaign.paused,true);
  d.resume(d.readSave());assert.ok(d.storyCards);
  for(let n=0;n<3;n++)q.campaign.pointer({x:180,y:560});
  assert.equal(d.readSave().progress.storyIntroSeen,true);assert.equal(q.campaign.paused,false);
});

console.log(count+' campaign completion checks passed; '+failures+' failed');process.exitCode=failures?1:0;
