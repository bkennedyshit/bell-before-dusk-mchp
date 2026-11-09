const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const scope={require,__dirname,console};
vm.runInNewContext(fs.readFileSync(__dirname+'/campaign.cjs','utf8').split('let failures=0;')[0]+'\nglobalThis.make=harness;',scope);
function setup(){const {q}=scope.make();q.startCampaign();const d=q.campaign.debug;d.progress.captain=true;d.enterStage('storehouse','south',2200);return {q,d,p:d.stage,b:d.stage.enemies.find(e=>e.demon)};}
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
test('Captain remains defeated across resume; demon checkpoint and unfreed seal persist',()=>{
 const {q,d,p,b}=setup();assert.ok(b);assert.ok(!p.enemies.some(e=>e.boss&&!e.demon));
 d.save();d.resume(d.readSave());assert.equal(d.progress.captain,true);assert.equal(d.progress.demon,false);
 assert.ok(d.stage.enemies.some(e=>e.demon));d.completeStage();assert.equal(d.mode,'stage');
 const gate=d.MAPS.cedar.exits.find(e=>e.to==='ward');assert.equal(gate.locked(),true);
});
test('Returning through the approach never teleports into an active arena',()=>{
 const {q,d}=setup();d.enterStage('storehouse','south',40);q.frames(60);
 assert.equal(d.stage.x,40);assert.equal(d.stage.arenaStarted,false);assert.equal(d.stage.enemies.find(e=>e.demon).state,'waiting');
});
test('Floor fire punishes staying on ground but lower ledges are safe',()=>{
 const {q,p,b}=setup();p.x=2352;p.y=460;b.state='burn';b.stateClock=1.6;q.game.hero.hp=100;q.game.hero.invulnerable=0;q.frames(1);assert.equal(q.game.hero.hp,86);
 p.x=2222;p.y=370;p.grounded=true;b.state='burn';b.stateClock=1.6;q.game.hero.hp=100;q.game.hero.invulnerable=0;q.frames(80);assert.equal(q.game.hero.hp,100);
});
test('A single ground jump cannot outlast the floor attack; held jump reaches safety ledge',()=>{
 const first=setup();first.p.x=2352;first.p.y=460;first.b.state='burn';first.b.stateClock=1.6;first.q.keys.add(' ');first.q.doJump();first.q.game.hero.invulnerable=.1;first.q.frames(96);assert.ok(first.q.game.hero.hp<100);
 const {q,p,b}=setup();p.x=2222;p.y=460;b.state='telegraph';b.attack=0;b.stateClock=1.5;
 q.keys.add(' ');q.doJump();q.frames(85);q.keys.clear();assert.equal(p.y,370);q.frames(95);assert.equal(q.game.hero.hp,100);
});
test('Breath marks one height; changing tiers avoids damage',()=>{
 const {q,p,b}=setup();b.mark={x:2222,y:370};b.state='sweep';b.stateClock=1;p.x=2222;p.y=370;p.grounded=true;q.game.hero.invulnerable=0;q.frames(1);assert.equal(q.game.hero.hp,86);
 p.y=285;q.game.hero.hp=100;q.game.hero.invulnerable=0;q.frames(1);assert.equal(q.game.hero.hp,100);
});
test('Dive chooses real shelf, leaves time to move, and exposes a recovery window',()=>{
 const {q,p,b}=setup();p.x=2222;p.y=370;p.grounded=true;b.state='rest';b.stateClock=0;b.attackIndex=2;q.frames(1);
 assert.equal(b.state,'telegraph');assert.equal(b.mark.y,370);assert.ok(b.stateClock>=1.49);
 p.x=2400;p.y=460;q.frames(150);assert.equal(b.state,'recover');assert.equal(b.y,370);assert.ok(b.stateClock>2);
 assert.ok(p.surfaces.some(s=>b.x>=s.x&&b.x<=s.end&&b.y===s.y));
});
test('Only recovery takes damage; kill releases seal/exit and persists without replay',()=>{
 const {q,d,p,b}=setup();p.x=b.x-30;p.y=b.y;p.facing=1;b.state='rest';q.doAttack();assert.equal(b.hp,42);
 b.state='recover';b.hp=1;q.game.hero.attackCooldown=0;q.doAttack();assert.equal(d.progress.demon,true);
 assert.equal(d.MAPS.cedar.exits.find(e=>e.to==='ward').locked(),false);
 p.x=p.width-55;p.y=460;p.grounded=true;d.completeStage();assert.equal(q.game.mapId,'south');
 d.resume(d.readSave());assert.equal(d.progress.demon,true);d.enterStage('storehouse','south',2200);assert.ok(!d.stage.enemies.some(e=>e.boss));
});
test('Every demon attack telegraph renders without entering captain-only targeting code',()=>{
 const {q,b}=setup();for(const state of ['emerge','rest','telegraph','burn','sweep','dive','recover'])for(let attack=0;attack<3;attack++){
   b.state=state;b.attack=attack;b.mark={x:2222,y:370};q.draw();
 }
});
test('Death retries the demon at its safe marker with full health and no repeated captain',()=>{
 const {q,d}=setup();q.game.hero.invulnerable=0;d.hurt(999);q.frames(1);
 assert.equal(q.game.hero.hp,q.game.hero.maxHp);assert.ok(q.game.hero.invulnerable>1);
 assert.equal(d.stage.checkpoint,2200);assert.equal(d.stage.x,2200);assert.equal(d.stage.y,460);
 assert.equal(d.progress.captain,true);assert.equal(d.progress.demon,false);
 assert.ok(d.stage.enemies.some(e=>e.demon));assert.ok(!d.stage.enemies.some(e=>e.boss&&!e.demon));
});
console.log(count+' demon encounter checks passed');
