const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function harness(seed={}){
  const sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(root,'campaign-features.js'),'utf8'),sandbox);
  const progress={prologue:true,quests:['ferry'],purchases:['steel'],visited:[],...seed},game={mon:3,hero:{speed:114,maxHp:100}},trips=[],messages=[];
  let location={town:'home',safe:true},saves=0;
  const ctx=new Proxy({measureText:s=>({width:s.length*5})},{get:(o,k)=>o[k]||(()=>{})});
  const api={getProgress:()=>progress,game,save:()=>saves++,getLocation:()=>location,travelToTown:id=>trips.push(id),say:s=>messages.push(s),stopHeroTravel(){},ctx,paperPanel(){},menuButton(){}};
  return {f:sandbox.window.createBellJourneyFeatures(api),progress,game,trips,messages,setLocation:v=>location=v,get saves(){return saves;}};
}
let count=0;function test(name,run){run();count++;console.log('PASS '+name);}
test('Legacy saves keep quest/purchase flags and receive safe feature defaults',()=>{
  const h=harness(),s=h.f.normalize();assert.equal(s.weapon,'katana');assert.equal(s.difficulty,'normal');
  assert.deepEqual(h.progress.quests,['ferry']);assert.deepEqual(h.progress.purchases,['steel']);assert.equal(h.f.weapon().reach,52);
  const corrupt=harness({journey:{weapon:'constructor',difficulty:'impossible',unlocked:['constructor','katana','katana'],questStates:null}});
  assert.equal(corrupt.f.weapon().id,'katana');assert.equal(corrupt.f.equip('constructor'),false);assert.equal(corrupt.f.normalize().unlocked.length,1);
});
test('Optional item recovery requires acceptance and the correct stage/floor',()=>{
  const h=harness();h.f.notifyStage('spirit');assert.equal(h.f.normalize().questStates.tackle,'available');
  assert.equal(h.f.acceptQuest('tackle'),true);assert.equal(h.f.acceptQuest('tackle'),false);
  assert.equal(h.f.collectAt('causeway',900,460,460),false);assert.equal(h.f.collectAt('spirit',900,300,460),false);
  assert.equal(h.f.collectAt('spirit',900,455,460),true);assert.equal(h.f.collectAt('spirit',900,455,460),false);
  assert.equal(h.f.pickup('spirit'),null);
});
test('Quest rewards require safe hand-in and cannot be duplicated after reload',()=>{
  const h=harness();h.f.acceptQuest('tool');h.f.notifyStage('causeway');
  assert.equal(h.f.claimQuest('tool'),false);assert.equal(h.game.mon,3);
  h.setLocation({town:'cedar',safe:true});assert.equal(h.f.claimQuest('tool'),true);assert.equal(h.game.mon,13);
  assert.equal(h.f.claimQuest('tool'),false);h.f.notifyStage('causeway');assert.equal(h.game.mon,13);
  const resumed=harness(JSON.parse(JSON.stringify(h.progress)));assert.equal(resumed.f.equip('longblade'),true);
  resumed.setLocation({town:'cedar',safe:true});assert.equal(resumed.f.claimQuest('tool'),false);
});
test('The three blades have distinct reach, damage and recovery without paywalls',()=>{
  const h=harness();assert.equal(h.f.equip('longblade'),false);h.setLocation({town:'cedar',safe:true});
  for(const [id,stage] of [['tackle','spirit'],['tool','causeway']]){h.f.acceptQuest(id);h.f.notifyStage(stage);h.f.claimQuest(id);}
  const weapons=[];for(const id of ['katana','tanto','longblade']){assert.equal(h.f.equip(id),true);weapons.push(h.f.weapon());}
  assert.ok(weapons[1].reach<weapons[0].reach&&weapons[0].reach<weapons[2].reach);
  assert.ok(weapons[1].cooldown<weapons[0].cooldown&&weapons[0].cooldown<weapons[2].cooldown);
  assert.ok(weapons[1].damage<weapons[0].damage&&weapons[0].damage<weapons[2].damage);
});
test('Assist is saved and changes combat only, not movement or rewards',()=>{
  const h=harness();assert.equal(h.f.damageTaken(20),20);assert.equal(h.f.warningTime(1),1);
  assert.equal(h.f.setDifficulty('assist'),true);assert.equal(h.f.damageTaken(20),13);assert.equal(h.f.warningTime(1),1.35);
  assert.equal(h.game.hero.speed,114);assert.equal(h.game.hero.maxHp,100);assert.equal(h.game.mon,3);
  const resumed=harness(JSON.parse(JSON.stringify(h.progress)));assert.equal(resumed.f.damageTaken(20),13);
  assert.equal(h.f.setDifficulty('hard'),false);
});
test('Town travel cannot skip discovery or operate on a road/in combat',()=>{
  const h=harness();assert.equal(h.f.travelAvailable(),false);assert.equal(h.f.travel('willow'),false);
  h.progress.visited.push('willow');assert.equal(h.f.travelAvailable(),true);assert.equal(h.f.travel('cedar'),false);
  assert.equal(h.f.travel('willow'),true);assert.deepEqual(h.trips,['willow']);
  h.setLocation({town:'willow',safe:false});assert.equal(h.f.travel('home'),false);
  h.setLocation({town:'willow',safe:true,stage:'causeway'});assert.equal(h.f.travel('home'),false);
  h.setLocation({town:'willow',safe:true});assert.equal(h.f.travel('home'),true);
});
test('NPC quest cards do not permanently intercept trading and every menu closes',()=>{
  const h=harness();assert.equal(h.f.npcTalk({name:'Takeshi',service:'steel'}),true);assert.equal(h.f.paused,true);h.f.draw();
  h.f.pointer({x:180,y:450});assert.equal(h.f.normalize().questStates.tool,'accepted');h.f.pointer({x:180,y:575});assert.equal(h.f.paused,false);
  assert.equal(h.f.npcTalk({name:'Takeshi',service:'steel'}),false);
  for(const page of ['hub','weapons','quests','travel','settings']){h.f.openMenu(page);assert.equal(h.f.paused,true);h.f.draw();h.f.close();assert.equal(h.f.paused,false);}
  assert.equal(h.f.pointer({x:50,y:50}),false);assert.ok(h.saves>0);
});
console.log('PASS '+count+' journey feature checks');
