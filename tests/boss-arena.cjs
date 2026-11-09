// Real campaign physics/AI, isolated from the player's save and Android app.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=fs.readFileSync(path.join(__dirname,'campaign.cjs'),'utf8').split('let failures=0;')[0];
const scope={require,__dirname,console};
vm.runInNewContext(base+'\nglobalThis.makeArenaHarness=harness;',scope);
let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name);}
function start(checkpoint=40){
  const {q}=scope.makeArenaHarness();q.startCampaign();q.campaign.debug.enterStage('storehouse','south',checkpoint);
  return {q,p:q.campaign.debug.stage,b:q.campaign.debug.stage.enemies.find(e=>e.boss)};
}
test('Captain arena appends to the original storehouse and keeps six tiered shelves',()=>{
  const {q,p,b}=start(1750);assert.equal(p.width,2532);assert.equal(p.x,1750);assert.equal(b.state,'waiting');
  const shelves=p.surfaces.filter(s=>s.arena&&s.oneWay);
  assert.equal(shelves.length,6);assert.deepEqual([...new Set(shelves.map(s=>s.y))].sort((a,b)=>a-b),[200,285,370]);
  assert.ok(p.surfaces.some(s=>s.arena&&!s.oneWay&&s.x===2172&&s.end===2532));
  q.frames(120);assert.equal(b.state,'waiting','Captain does not attack from off-screen approach');
});
test('Crossing the courtyard door saves a safe checkpoint and seals only that encounter',()=>{
  const {q,p,b}=start();p.x=2191;p.y=460;q.frames(1);
  assert.equal(p.arenaStarted,true);assert.equal(p.checkpoint,2200);assert.equal(b.state,'rest');
  assert.equal(q.campaign.debug.readSave().stage.checkpoint,2200);
  p.x=2188;q.keys.add('a');q.frames(45);q.keys.clear();assert.ok(p.x>=2187);
});
test('Low, middle and high shelves are reachable with existing held-jump physics',()=>{
  const {q,p,b}=start(2200);b.dead=true;p.enemies=[];q.game.hero.invulnerable=999;
  p.x=2222;p.y=460;p.grounded=true;
  q.keys.add(' ');q.doJump();q.frames(90);q.keys.clear();assert.equal(p.y,370,'Ground to lower shelf');
  q.keys.add(' ');q.doJump();q.frames(90);q.keys.clear();assert.equal(p.y,285,'Lower to outer middle shelf');
  q.keys.add(' ');q.doJump();q.keys.add('d');q.frames(18);q.keys.delete('d');q.frames(72);q.keys.clear();
  assert.equal(p.y,200,'Outer middle to inner high shelf');assert.ok(p.x>=2258&&p.x<=2328);
});
test('Captain has rush, aimed knives and a marked leap that lands on a real shelf',()=>{
  const {q,p,b}=start(2200);q.game.hero.invulnerable=999;p.x=2222;p.y=370;p.grounded=true;
  const attacks=[];
  for(let expected=0;expected<3;expected++){
    b.state='rest';b.stateClock=0;q.frames(1);attacks.push(b.attack);
    assert.equal(b.state,'telegraph');assert.ok(b.stateClock>=.9);
    q.frames(61);
    if(expected===0)assert.equal(b.state,'rush');
    else if(expected===1)assert.equal(b.state,'recover');
    else {assert.equal(b.state,'leap');q.frames(50);assert.equal(b.state,'recover');assert.equal(b.y,370);}
  }
  assert.deepEqual(attacks,[0,1,2]);
  assert.ok(p.surfaces.some(s=>b.x>=s.x&&b.x<=s.end&&b.y===s.y));
});
test('Arena checkpoint resumes on floor and victory permits the touch exit',()=>{
  const {q,p,b}=start(2200);assert.equal(p.y,460);assert.equal(p.arenaStarted,true);
  p.x=b.x-35;p.y=b.y;p.facing=1;b.state='recover';b.hp=1;q.doAttack();
  assert.equal(q.campaign.debug.progress.captain,true);q.frames(90);
  const demon=p.enemies.find(e=>e.demon);demon.state='recover';demon.hp=1;
  p.x=demon.x-35;p.y=demon.y;p.facing=1;q.game.hero.attackCooldown=0;q.doAttack();
  assert.equal(q.campaign.debug.progress.demon,true);p.x=p.width-55;p.y=460;p.grounded=true;
  assert.equal(q.campaign.debug.gateReady(),true);q.campaign.debug.completeStage();
  assert.ok(q.campaign.debug.progress.cleared.includes('storehouse'));assert.equal(q.game.mapId,'south');
});
console.log('PASS '+count+' arena checks');
