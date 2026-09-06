const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path');
let source=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const ctx=new Proxy({}, {get:()=>()=>{}}),canvas={getContext:()=>ctx,addEventListener(){}};
class Image {addEventListener(){}}
source=source.replace('  })();',`
citizenWalkAtlas={};citizenVerticalAtlas={};
let recorded;
drawCitizenWalkCell=(col,row,x,y,size,flip)=>{recorded={kind:'side',col,row,flip};};
drawCitizenVerticalCell=(col,row)=>{recorded={kind:'vertical',col,row};};
globalThis.qa={game,resetGame,spawnEnemy,updateEnemy,moveEnemyAnimated,
render:e=>{drawEnemy(e);return recorded;}};
  })();`);
const sandbox={Image,document:{getElementById:()=>canvas,addEventListener(){}},window:{},
performance:{now:()=>0},addEventListener(){},requestAnimationFrame(){}};
vm.runInNewContext(source,sandbox);const q=sandbox.qa;q.resetGame();
const thief=q.spawnEnemy('bandit',650,800);
Object.assign(thief,{state:'escapeTown',route:[[590,800],[540,720],[540,620]],routeIndex:0,
revealTime:.7,facingX:0,facingY:1});
for(let i=0;i<30;i++)q.updateEnemy(thief,1/60);
assert.equal(thief.x,650);assert.equal(q.render(thief).row,0);assert.equal(q.render(thief).kind,'vertical');
const backRows=new Set();let left=false;
for(let i=0;i<300 && !thief.dead;i++) {
 q.updateEnemy(thief,1/60);const pose=q.render(thief);
 assert.equal(pose.col,3);
 if(thief.facingY<0) {assert.equal(pose.kind,'vertical');assert.ok(pose.row>=2);backRows.add(pose.row);}
 if(thief.facingX<0) {assert.equal(pose.kind,'side');assert.equal(pose.flip,true);left=true;}
}
assert.ok(left);assert.deepEqual([...backRows].sort(),[2,3]);assert.ok(thief.dead);assert.equal(q.game.phase,'chase_gate');
q.resetGame();const fieldThief=q.spawnEnemy('bandit',360,820);
q.game.mapId='outside';Object.assign(fieldThief,{state:'escapeField',route:[[360,760]],routeIndex:0});
q.updateEnemy(fieldThief,1/60);assert.equal(q.render(fieldThief).row,2);
q.game.hero.x=0;const before=q.render(fieldThief);q.game.hero.x=720;
assert.deepEqual(q.render(fieldThief),before,'player position must not flip escape sprite');
const distance=fieldThief.animDistance;
Object.assign(fieldThief,{x:620,y:193});q.moveEnemyAnimated(fieldThief,0,-30);
assert.equal(fieldThief.animDistance,distance,'blocked actor must not advance footsteps');
console.log('PASS thief introduction, west-facing escape, both northbound footfalls, gate progression, field facing, and blocked animation');
