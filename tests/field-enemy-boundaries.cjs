const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const html=process.argv.includes('--baseline') ? execFileSync('git',['show','HEAD:index.html'],{cwd:root,encoding:'utf8'}) : fs.readFileSync(path.join(root,'index.html'),'utf8');
let source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const ctx=new Proxy({}, {get:()=>()=>{}}),canvas={getContext:()=>ctx,addEventListener(){}};
class Image{addEventListener(){}}
let random=.1;
const math=Object.create(Math);math.random=()=>random;
source=source.replace('  })();',`
sfx=()=>{};startAudio=()=>{};
globalThis.qa={game,resetGame,spawnEnemy,updateRun,updateEnemy,blockedAt,doAttack};
  })();`);
const sandbox={Image,Math:math,document:{getElementById:()=>canvas,addEventListener(){}},window:{},
performance:{now:()=>0},addEventListener(){},requestAnimationFrame(){}};
vm.runInNewContext(source,sandbox);const q=sandbox.qa;
function field(){q.resetGame();Object.assign(q.game,{mapId:'outside',phase:'run2',run:2,
fogPhase:'clear',fogPhaseClock:1000,spawnClock:0,runFogMod:1,hasKatana:true});}
function valid(e){assert.equal(q.blockedAt(e,e.x,e.y),false,`enemy trapped at ${e.x}, ${e.y}`);}
let cases=0;
// All eight edge/corner camps, both runs, both random directions/types.
for(const run of [1,2])for(const value of [.1,.9])for(const [x,y] of [[63,193],[360,193],[657,193],[63,550],[657,550],[63,897],[360,897],[657,897]]) {
 field();random=value;q.game.run=run;Object.assign(q.game.hero,{x,y});
 q.updateRun(1/60);assert.equal(q.game.enemies.length,1);
 const e=q.game.enemies[0];valid(e);
 assert.ok(Math.hypot(e.x-x,e.y-y)>=90,'spawn too close to player');
 const start=Math.hypot(e.x-x,e.y-y);
 for(let i=0;i<60;i++)q.updateEnemy(e,1/60);
 valid(e);assert.ok(Math.hypot(e.x-x,e.y-y)<start-10,'spawn cannot chase player');cases++;
}
console.log(`PASS ${cases} edge/corner spawns remain walkable and chase the player`);
for(const type of ['wisp','prowler']) {
 field();Object.assign(q.game.hero,{x:360,y:300});
 const e=q.spawnEnemy(type,400,150);valid(e);
 // Simulate an enemy restored from an older trapped state.
 e.y=150;const oldY=e.y;q.updateEnemy(e,1/60);valid(e);assert.ok(e.y>oldY+30);
}
console.log('PASS trapped gate enemies recover onto the field');
field();Object.assign(q.game.hero,{x:360,y:225,facingX:0,facingY:-1,attackCooldown:0});
const victim=q.spawnEnemy('prowler',360,195);victim.hp=100;
q.doAttack();assert.ok(victim.hp<100,'attack did not hit');valid(victim);
console.log('PASS sword knockback cannot push a demon inside the north gate');
