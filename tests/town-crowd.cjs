const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const ctx = new Proxy({}, {get: () => () => {}});
const canvas = {getContext: () => ctx, addEventListener() {}};
class Image {addEventListener() {}}
source = source.replace('  })();', `
globalThis.qa={game,official,resetGame,updateResidents,moveActor,blockedAt,crowdOverlap,residentPose,contextAction};
  })();`);
const sandbox = {Image, document: {getElementById: () => canvas, addEventListener() {}}, window: {},
  performance: {now: () => 0}, addEventListener() {}, requestAnimationFrame() {}};
vm.runInNewContext(source, sandbox);
const q = sandbox.qa;
let passed = 0;
function test(name, fn) {q.resetGame(); fn(); console.log('PASS ' + name); passed++;}
function spacing() {
  const actors = [q.game.hero, q.official, ...q.game.residents];
  for (let a=0;a<actors.length;a++) for(let b=a+1;b<actors.length;b++) {
    assert.ok(!q.crowdOverlap(actors[a].x, actors[a].y, actors[b]), `overlap ${a}/${b}`);
  }
}
test('Three minutes of shared streets: spacing, scenery, four facings and both footfalls', () => {
  const seen = q.game.residents.map(() => new Set());
  for(let frame=0;frame<60*180;frame++) {
    q.updateResidents(1/60);
    spacing();
    q.game.residents.forEach((p,i) => {
      assert.ok(!q.blockedAt(p,p.x,p.y),'resident entered scenery');
      if(p.moving) {const pose=q.residentPose(p); seen[i].add(`${p.facingX},${p.facingY}:${pose.row%2}`);}
    });
  }
  seen.forEach((poses,i) => assert.equal(poses.size,8,`${q.game.residents[i].role} missing directions/steps: ${[...poses]}`));
});
test('Head-on residents pass without merging or remaining stuck', () => {
  const [a,b] = q.game.residents;
  q.game.residents=[a,b]; q.game.hero.x=900;q.game.hero.y=920;
  Object.assign(a,{x:240,y:900,route:[[470,900],[240,900]]});
  Object.assign(b,{x:470,y:900,route:[[240,900],[470,900]]});
  for(let i=0;i<600;i++){q.updateResidents(1/60);spacing();}
  assert.ok(a.x>b.x,`did not pass: ${a.x}/${b.x}`);
});
test('Hero and residents stop at the same boundary, including large movement steps', () => {
  const p=q.game.residents[0];q.game.residents=[p];
  Object.assign(p,{x:260,y:900,route:[[600,900]]});
  Object.assign(q.game.hero,{x:380,y:900});
  q.moveActor(q.game.hero,-250,0);spacing();
  assert.ok(q.game.hero.x>=308);
  for(let i=0;i<120;i++){q.updateResidents(1/60);spacing();}
});
test('Blocked residents freeze their walk cycle instead of walking in place', () => {
  const p=q.game.residents[0];
  Object.assign(p,{x:300,y:900,route:[[400,900]],pause:0,walkDistance:13});
  q.game.residents=[p,...[[49,0],[-49,0],[0,61],[0,-61]].map(([dx,dy])=>
    ({...p,x:p.x+dx,y:p.y+dy,pause:2}))];
  q.updateResidents(0.5);assert.equal(p.walkDistance,13);assert.equal(p.moving,false);
  assert.equal(q.residentPose(p).row,0);
});
test('Northbound motion alternates actual rear rows 2 and 3', () => {
  const p=q.game.residents[1];q.game.residents=[p];
  Object.assign(p,{x:760,y:930,route:[[760,760]],walkDistance:0});
  const rows=new Set();
  for(let i=0;i<120;i++){q.updateResidents(1/60);rows.add(q.residentPose(p).row);}
  assert.deepEqual([...rows].sort(),[2,3]);
});
test('Talking remains reachable outside personal space in both axes', () => {
  const p=q.game.residents[1];q.game.residents=[p];Object.assign(p,{x:700,y:900});
  for(const [dx,dy] of [[50,0],[0,62]]) {
    Object.assign(q.game.hero,{x:p.x+dx,y:p.y+dy});
    assert.ok(!q.blockedAt(q.game.hero,q.game.hero.x,q.game.hero.y));
    assert.equal(q.contextAction().type,'resident');
  }
  Object.assign(q.game.hero,{x:q.official.x,y:q.official.y+62});
  assert.equal(q.contextAction().type,'official');
  q.game.phase='town_gate';assert.equal(q.contextAction().type,'officialAgain');
});
test('Patrol distance and animation phase are consistent at 30, 60 and 120 FPS', () => {
  const results=[];
  for(const fps of [30,60,120]) {
    q.resetGame();const p=q.game.residents[0];q.game.residents=[p];
    for(let i=0;i<fps*3;i++)q.updateResidents(1/fps);
    results.push([p.x,p.y,p.walkDistance,q.residentPose(p).row]);
  }
  for(const result of results) result.forEach((value,i)=>assert.ok(Math.abs(value-results[0][i])<1e-6));
});
console.log(`PASS ${passed} town movement regressions`);
