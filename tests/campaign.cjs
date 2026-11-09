const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const path = require("node:path");
const root = path.resolve(__dirname, "..");

function harness(saved = new Map(), build = null) {
  const events = {};
  const listen = (name, fn) => (events[name] ||= []).push(fn);
  const context = new Proxy({
    measureText: s => ({ width: s.length * 5 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} })
  }, { get: (o, k) => o[k] || (() => {}) });
  const canvas = { getContext: () => context, addEventListener: listen, setPointerCapture() {},
    getBoundingClientRect: () => ({ left:0,top:0,width:360,height:640 }) };
  class Image { constructor() { this.complete = false; this.naturalWidth = 0; } addEventListener() {} }
  const sandbox = { Image, console, performance:{now:()=>0}, requestAnimationFrame() {},
    addEventListener:listen, document:{getElementById:()=>canvas,addEventListener:listen,hidden:false},
    window:{BELL_BUILD:build}, nativeEvents:events, localStorage:{ getItem:k=>saved.get(k)||null, setItem:(k,v)=>saved.set(k,v) } };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root,"campaign.js"),"utf8"), sandbox);
  let source = fs.readFileSync(path.join(root,"index.html"),"utf8").match(/<script>([\s\S]*?)<\/script>/)[1];
  const close = source.lastIndexOf("  })();");
  source = source.slice(0,close) + `
    startAudio=()=>{};sfx=()=>{};
    globalThis.qa={campaign,game,keys,update,draw,doJump,doAttack,doInteract,contextAction,
      blockedAt,moveActor,finish,bell,resetGame,SPIRIT_SEGMENTS,SPIRIT_TERRAIN,spiritSurfaceY,spiritTerrainScale,drawSpiritTerrainSegment,advanceFrame,platformTap,stopHeroTravel,frame};
  ` + source.slice(close);
  vm.runInContext(source,sandbox);
  const q=sandbox.qa;
  q.resetGame();
  q.frames=(n,dt=1/60)=>{for(let i=0;i<n;i++)q.update(dt);};
  q.startCampaign=()=>{q.campaign.prologueOutcome("victory");q.campaign.debug.home();};
  return {q,saved,sandbox};
}
let failures=0;
function test(name,fn){
  try{fn();console.log("PASS "+name);}
  catch(e){failures++;console.error("FAIL "+name+"\n"+e.stack);}
}
test("Android default launch enters the expanded campaign without a query parameter or old demo save",()=>{
  const {q,saved}=harness(new Map(),{edition:"android-campaign",version:"0.1.1"});
  q.campaign.startFromTitle({x:180,y:510});
  assert.equal(q.game.phase,"campaign_home");assert.equal(q.game.nodes.length,0);
  assert.equal(q.campaign.debug.progress.prologue,true);
  assert.ok(saved.has("bell-before-dusk.campaign.v1.android-campaign"));
  assert.equal(saved.has("bell-before-dusk.campaign.v1"),false);
  for(const [y,label] of [[982,"SOUTH"],[680,"NORTH"]]){
    q.game.hero.x=540;q.game.hero.y=y;assert.equal(q.contextAction().label,label);
  }
});
test("Retrying a prologue defeat never reloads the one-HP enemy swarm save",()=>{
  const {q}=harness();q.game.phase="run1";q.game.mapId="outside";q.game.hero.hp=1;
  q.game.hero.x=360;q.game.hero.y=300;q.campaign.debug.save();q.finish("defeat");
  q.campaign.startFromTitle({x:180,y:510});
  assert.equal(q.game.scene,"topdown");assert.equal(q.game.mapId,"town");
  assert.equal(q.game.hero.hp,q.game.hero.maxHp);assert.ok(q.game.hero.invulnerable>=3);
});
test("Campaign defeat retries recover at a safe entry with full health",()=>{
  const {q}=harness();q.startCampaign();q.campaign.debug.enterZone("south",350,700);
  q.game.hero.hp=1;q.campaign.debug.save();q.finish("defeat");
  q.campaign.startFromTitle({x:180,y:510});
  assert.equal(q.game.hero.hp,q.game.hero.maxHp);assert.equal(q.game.hero.y,170);
  assert.ok(q.game.hero.invulnerable>=2);
});
test("Original bell victory starts the campaign and keeps the prologue save",()=>{
  const {q}=harness();q.finish("victory");q.campaign.startFromTitle({x:180,y:510});
  assert.equal(q.game.phase,"campaign_home");assert.equal(q.game.mapId,"town");
  assert.equal(q.campaign.debug.readSave().progress.prologue,true);
});
test("Both home gates can be interacted with from walkable pavement",()=>{
  const {q}=harness();q.startCampaign();
  for(const [y,label] of [[982,"SOUTH"],[680,"NORTH"]]){
    q.game.hero.x=540;q.game.hero.y=y;
    assert.equal(q.blockedAt(q.game.hero,540,y),false);
    assert.equal(q.contextAction().label,label);
  }
});
test("Southern exits are connected; west gate requires Harvest key",()=>{
  const {q}=harness();q.startCampaign();
  q.campaign.debug.enterZone("south",358,160);
  const map=q.campaign.debug.MAPS.south;
  const west=map.exits.find(e=>e.stage==="storehouse");
  q.campaign.debug.travel(west);assert.equal(q.campaign.debug.mode,"zone");
  assert.equal(q.campaign.paused,true);q.campaign.pointer({x:180,y:416});
  q.campaign.debug.progress.cleared.push("harvest");
  q.campaign.debug.travel(west);assert.equal(q.campaign.debug.stage.id,"storehouse");
  q.campaign.debug.enterZone("south",358,160);
  q.campaign.debug.travel(map.exits.find(e=>e.to==="willow"));
  assert.equal(q.game.mapId,"willow");assert.equal(q.campaign.debug.residents.length,3);
});
test("All map exits and six service NPCs are reachable from their map entry",()=>{
  const {q}=harness();q.startCampaign();
  for(const [id,map] of Object.entries(q.campaign.debug.MAPS)){
    // Flood-fill walkable grid using the same radius as the hero. Interactions
    // must have a reachable sample within their activation radius.
    const cell=10, seen=new Set(),queue=[];
    const open=(x,y)=>[[-7,0],[7,0],[0,-7],[0,7]].every(([dx,dy])=>
      map.floors.some(r=>x+dx>=r[0]&&x+dx<=r[0]+r[2]&&y+dy>=r[1]&&y+dy<=r[1]+r[3])&&
      !(map.solids||[]).some(r=>x+dx>=r[0]&&x+dx<=r[0]+r[2]&&y+dy>=r[1]&&y+dy<=r[1]+r[3]));
    const start=id==="cedar"?[540,450]:id==="willow"?[535,260]:id==="south"?[358,160]:[360,790];
    queue.push(start);seen.add(start.join(","));
    for(let i=0;i<queue.length;i++){
      const [x,y]=queue[i];
      for(const [dx,dy] of [[cell,0],[-cell,0],[0,cell],[0,-cell]]){
        const nx=x+dx,ny=y+dy,key=nx+","+ny;
        if(!seen.has(key)&&open(nx,ny)){seen.add(key);queue.push([nx,ny]);}
      }
    }
    for(const target of [...map.exits,...(map.people||[]),...(map.shops||[])]){
      assert.ok(queue.some(([x,y])=>Math.hypot(x-target.x,y-target.y)<55),
        id+" unreachable "+(target.name||target.label));
    }
  }
});
test("One-way platform collision catches descent but permits ascent and drop-through",()=>{
  const {q}=harness();q.startCampaign();q.campaign.debug.enterStage("canopy","woods");
  const d=q.campaign.debug;
  assert.equal(d.land(375,350,-100,250,false),null);
  assert.equal(d.land(350,365,100,250,false).y,359);
  assert.equal(d.land(350,365,100,250,true),null);
  assert.equal(d.land(450,465,100,250,true).y,460);
});
test("Player can jump from ground to the middle and upper decks",()=>{
  const {q}=harness();q.startCampaign();q.campaign.debug.enterStage("canopy","woods");
  const p=q.campaign.debug.stage;p.x=300;p.enemies=[];
  q.keys.add(" ");q.doJump();q.frames(60);
  assert.equal(p.y,359);assert.equal(p.grounded,true);
  q.doJump();q.frames(60);assert.equal(p.y,250);
  q.keys.add("arrowdown");q.doJump();q.frames(45);q.keys.clear();
  assert.equal(p.y,359);
});
test("A causeway gap is jumpable and falling returns to a checkpoint",()=>{
  const {q}=harness();q.startCampaign();q.campaign.debug.enterStage("causeway","south");
  const p=q.campaign.debug.stage;p.enemies=[];p.x=420;p.y=460;
  q.keys.add("arrowright");q.doJump();q.frames(40);q.keys.clear();
  assert.ok(p.x>480);assert.ok(q.game.hero.hp>0);
  p.x=460;p.y=650;p.vy=200;q.frames(10);
  assert.ok(p.x<100);assert.equal(p.y,460);
});
test("Causeway upper decks are reachable with the actual jump physics",()=>{
  const {q}=harness();q.startCampaign();q.campaign.debug.enterStage("causeway");
  const p=q.campaign.debug.stage;p.enemies=[];p.x=300;p.y=460;
  q.keys.add(" ");q.doJump();q.frames(65);
  assert.equal(p.y,357.5);assert.equal(p.grounded,true);
});
test("Upper floors never auto-exit; stage gates require a ground-level interaction",()=>{
  const {q}=harness();q.startCampaign();q.campaign.debug.enterStage("canopy");
  const p=q.campaign.debug.stage;p.enemies=[];p.relicCollected=true;
  p.x=p.width-40;p.y=260;p.grounded=true;q.frames(65);
  assert.equal(q.campaign.debug.mode,"stage");q.doInteract();
  assert.equal(q.campaign.debug.mode,"stage");
  p.y=460;p.vy=0;p.grounded=true;q.frames(60);
  assert.equal(q.campaign.debug.mode,"stage");
  q.campaign.pointer({x:300,y:425});assert.equal(q.campaign.debug.mode,"zone");
});
test("Scenery and gate thresholds block bodies but leave reachable approaches",()=>{
  const {q}=harness();q.startCampaign();const d=q.campaign.debug;
  for(const [id,x,y] of [["woods",610,420],["willow",125,375],["willow",535,550],
    ["south",690,510],["south",50,1655],["south",358,1790]]){
    d.enterZone(id);assert.equal(d.walkable(x,y,q.game.hero),false,id+" scenery should be solid");
  }
});
test("Roads include bandits and enemy facing follows displacement",()=>{
  const {q}=harness();q.startCampaign();const d=q.campaign.debug;
  d.enterZone("south",270,500);assert.ok(d.foes.some(e=>e.type==="bandit"));
  const e=d.foes[0];e.x=270;e.y=420;e.cooldown=1;q.frames(1);
  assert.ok(e.facingY>0);assert.equal(e.facingX,0);
});
test("Original ghosts remain alongside bandits and tougher road demons",()=>{
  const {q}=harness();q.startCampaign();const d=q.campaign.debug;d.enterZone("south",350,700);
  assert.ok(d.foes.some(e=>e.type==="wisp"));assert.ok(d.foes.some(e=>e.type==="bandit"));
  assert.ok(d.foes.some(e=>e.type==="prowler"));assert.ok(d.foes.some(e=>e.type==="raider"));
  assert.ok(d.foes.find(e=>e.type==="bandit").hp>=6);
});
test("Original Forest Spirit Path remains selectable and returns to its field",()=>{
  const {q}=harness();q.startCampaign();const d=q.campaign.debug;d.enterZone("woods",580,240);
  d.travel(d.MAPS.woods.exits.find(e=>e.trails));assert.equal(q.campaign.paused,true);
  q.campaign.pointer({x:180,y:280});assert.equal(d.stage.id,"spirit");assert.equal(d.stage.width,1320);
  assert.equal(d.stage.surfaces.length,6);d.completeStage();assert.equal(q.game.mapId,"woods");
});
test("Original opening replay preserves the expanded journey and reconnects after the chase",()=>{
  const {q}=harness();q.startCampaign();const d=q.campaign.debug;
  d.enterZone("willow",535,300);q.game.mon=19;d.save();
  q.game.scene="title";q.campaign.startFromTitle({x:180,y:609});
  assert.equal(q.game.phase,"town_intro");assert.equal(q.campaign.storyOpening,true);
  assert.equal(d.readSave().game.mon,19);
  q.game.chaseComplete=true;q.game.mapId="town";q.campaign.tick(.01);
  assert.equal(q.campaign.storyOpening,false);assert.equal(q.game.mapId,"town");assert.equal(q.game.phase,"campaign_home");assert.equal(q.game.mon,19);
  assert.equal(d.readSave().game.mapId,"town");
});

test("Keyboard codes, legacy Android Space and W support short and held jumps",()=>{
  for(const [key,code] of [["Unidentified","Space"],["Spacebar",""],["w","KeyW"],["ArrowUp",""]]){
    const peaks=[];
    for(const held of [false,true]){
      const {q,sandbox}=harness();q.startCampaign();q.campaign.debug.enterStage("canopy");
      const p=q.campaign.debug.stage;p.x=100;p.enemies=[];
      const event={key,code,repeat:false,preventDefault(){}};
      sandbox.nativeEvents.keydown[0](event);
      assert.equal(p.grounded,false);
      if(!held)sandbox.nativeEvents.keyup[0](event);
      let peak=p.y;for(let i=0;i<45;i++){q.frames(1);peak=Math.min(peak,p.y);}peaks.push(peak);
      sandbox.nativeEvents.keyup[0](event);assert.equal(q.keys.size,0);
    }
    assert.ok(peaks[0]-peaks[1]>50,key+" hold must jump higher");
  }
});

test("Classic stairs share the artwork transform and can be walked in both directions",()=>{
  const {q}=harness();q.startCampaign();const d=q.campaign.debug;d.enterStage("spirit");
  const p=d.stage;p.enemies=[];
  for(const segment of q.SPIRIT_SEGMENTS){
    const spec=q.SPIRIT_TERRAIN[segment.art],s=p.surfaces.find(s=>s.spirit===segment);
    assert.equal(q.spiritSurfaceY(segment,segment.start),segment.y0);
    for(const [sx,sy] of spec.contact){
      const x=segment.start+sx/spec.sw*(segment.end-segment.start);
      const imageY=segment.y0+(sy-spec.contact[0][1])*q.spiritTerrainScale(segment);
      assert.ok(Math.abs(d.surfaceY(s,x+.00001)-imageY)<.01);
    }
    for(const direction of [1,-1]){
      p.x=direction>0?segment.start+12:segment.end-12;p.y=q.spiritSurfaceY(segment,p.x);p.grounded=true;p.vy=0;
      q.keys.add(direction>0?"d":"a");
      for(let i=0;i<50&&p.x>segment.start+4&&p.x<segment.end-4;i++){
        q.frames(1);assert.equal(p.grounded,true,"Lost footing on art "+segment.art);
        assert.ok(Math.abs(p.y-q.spiritSurfaceY(segment,p.x))<.01);
      }
      q.keys.clear();p.vx=0;
    }
  }
});

test("Every town guide and journal give progression-aware directions without changing locks",()=>{
  const {q}=harness();q.startCampaign();const d=q.campaign.debug;
  for(const id of ["canopy","causeway","harvest"]){d.progress.cleared.push(id);}
  assert.match(d.directions(),/NORTH.*Willow.*WEST.*Storehouse/);
  d.enterZone("willow",260,400);d.talk(d.residents.find(n=>n.service==="ferry"));
  assert.equal(q.campaign.paused,true);q.campaign.pointer({x:180,y:416});
  d.enterZone("march",350,1700);const gate=d.MAPS.march.exits.find(e=>e.label==="CLOSED COAST");
  d.travel(gate);assert.equal(d.mode,"zone");assert.equal(q.campaign.paused,true);
  q.campaign.pointer({x:180,y:416});q.campaign.toggleMenu();q.campaign.pointer({x:180,y:462});
  assert.equal(q.campaign.paused,true);
});
test("A tap gives a short hop; holding jump reaches the next landing layer",()=>{
  const peaks=[];
  for(const hold of [false,true]){
    const {q}=harness();q.startCampaign();q.campaign.debug.enterStage("canopy");
    const p=q.campaign.debug.stage;p.x=100;p.enemies=[];
    if(hold)q.keys.add(" ");q.doJump();let highest=460;
    for(let i=0;i<60;i++){q.frames(1);highest=Math.min(highest,p.y);}peaks.push(highest);
  }
  assert.ok(peaks[0]>380);assert.ok(peaks[1]<350);assert.ok(peaks[0]-peaks[1]>50);
});
test("Stepping beyond an upper ledge falls instead of running on empty air",()=>{
  const {q}=harness();q.startCampaign();q.campaign.debug.enterStage("canopy");
  const p=q.campaign.debug.stage;p.enemies=[];p.x=600;p.y=250;p.grounded=true;
  q.frames(5);assert.equal(p.grounded,false);assert.ok(p.y>250);
});
test("Willow south gate leads to a field, whose Harvest side trail returns there",()=>{
  const {q}=harness();q.startCampaign();const d=q.campaign.debug;d.enterZone("willow",535,475);
  q.doInteract();assert.equal(q.game.mapId,"march");assert.equal(d.MAPS.march.exits.length,4);
  d.progress.cleared.push("causeway");d.travel(d.MAPS.march.exits.find(e=>e.stage==="harvest"));
  assert.equal(d.stage.id,"harvest");d.stage.relicCollected=true;d.completeStage();assert.equal(q.game.mapId,"march");
});
test("New town doors enter reused interiors; saves restore the room and correct town exit",()=>{
  const {q,saved}=harness();q.startCampaign();q.campaign.debug.enterZone("cedar",380,205);
  q.doInteract();assert.equal(q.campaign.debug.mode,"interior");assert.equal(q.game.mapId,"smith");
  const {q:restored}=harness(saved);restored.campaign.startFromTitle({x:180,y:510});
  assert.equal(restored.campaign.debug.mode,"interior");assert.equal(restored.game.mapId,"smith");
  restored.campaign.debug.leaveRoom();assert.equal(restored.game.mapId,"cedar");
  assert.ok(restored.game.hero.x<450&&restored.game.hero.y<240);
});
test("Original Post Town inn and forge still have their entry interactions",()=>{
  const {q}=harness();q.startCampaign();
  for(const [x,type] of [[260,"enterInn"],[830,"enterSmith"]]){
    q.game.hero.x=x;q.game.hero.y=730;assert.equal(q.contextAction().type,type);
  }
});
test("Touch map pauses the world and closes without teleporting the hero",()=>{
  const {q}=harness();q.startCampaign();q.campaign.debug.enterZone("south",350,700);
  q.campaign.pointer({x:104,y:180});assert.equal(q.campaign.paused,true);q.keys.add("arrowright");q.frames(60);
  assert.equal(q.game.hero.x,350);q.campaign.pointer({x:180,y:300});assert.equal(q.campaign.paused,false);
});
test("Old saves inside newly bounded scenery recover to walkable ground",()=>{
  const {q}=harness();q.startCampaign();const d=q.campaign.debug;
  d.enterZone("willow",535,550);
  assert.equal(d.walkable(q.game.hero.x,q.game.hero.y,q.game.hero),true);
  assert.ok(q.game.hero.y<525);
});
test("Dialogue waits for acknowledgement and does not run the world underneath",()=>{
  const {q}=harness();q.startCampaign();const d=q.campaign.debug;
  d.enterZone("willow",260,400);q.doInteract();assert.equal(q.campaign.paused,true);
  const y=q.game.hero.y;q.keys.add("arrowdown");q.frames(600);assert.equal(q.game.hero.y,y);
  q.campaign.pointer({x:180,y:400});assert.equal(q.campaign.paused,false);
});
test("Each stage has a continuous ground route or jumpable lower gaps",()=>{
  const {q}=harness();q.startCampaign();
  for(const id of Object.keys(q.campaign.debug.STAGES)){
    const lower=q.campaign.debug.surfacesFor(id).filter(s=>!s.oneWay).sort((a,b)=>a.x-b.x);
    const classic=q.campaign.debug.STAGES[id].classic;
    assert.ok(lower[0].x<=10);assert.ok(lower.at(-1).end>=(classic?1310:2150));
    for(let i=1;i<lower.length;i++)assert.ok(lower[i].x-lower[i-1].end<=85,id+" impossible gap");
    if(!classic)assert.ok(fs.existsSync(path.join(root,"assets/environment/concepts/platformers",
      q.campaign.debug.STAGES[id].art+"-panel-a.png")));
  }
});
test("Upper route tokens gate exits, survive saves and unlock the correct road",()=>{
  const {q,saved}=harness();q.startCampaign();
  for(const id of ["canopy","harvest"]){
    q.campaign.debug.enterStage(id);
    let p=q.campaign.debug.stage;
    p.x=p.width-40;q.campaign.debug.completeStage();
    assert.equal(q.campaign.debug.mode,"stage");assert.equal(q.campaign.debug.progress.cleared.includes(id),false);
    p.enemies=[];p.x=p.relic.x;p.y=p.relic.y;q.update(1/60);
    assert.equal(p.relicCollected,true);
    q.campaign.debug.save();
    const check=harness(saved).q;check.campaign.startFromTitle({y:510});
    assert.equal(check.campaign.debug.stage.relicCollected,true);
    p.x=p.width-40;q.campaign.debug.completeStage();
    assert.ok(q.campaign.debug.progress.cleared.includes(id));
  }
  q.campaign.debug.enterStage("causeway","south");
  q.campaign.debug.completeStage();
  assert.equal(q.game.hero.x,590,"Causeway must return to east, even after the west road unlocks");
});
test("Captain guard blocks damage; recovery permits a win and persists the seal",()=>{
  const {q}=harness();q.startCampaign();q.campaign.debug.enterStage("storehouse","south");
  const p=q.campaign.debug.stage,b=p.enemies.find(e=>e.boss);
  p.x=b.x-40;p.y=b.y;p.facing=1;
  q.doAttack();assert.equal(b.hp,24);
  b.state="recover";b.stateClock=3;q.game.hero.attackCooldown=0;b.hp=1;
  q.doAttack();assert.equal(b.dead,true);assert.equal(q.campaign.debug.progress.captain,true);
  q.frames(90);const demon=p.enemies.find(e=>e.demon);assert.ok(demon);
  demon.state="recover";demon.hp=1;p.x=demon.x-35;p.y=demon.y;p.facing=1;q.game.hero.attackCooldown=0;q.doAttack();
  assert.equal(q.campaign.debug.progress.demon,true);
  p.x=p.width-40;q.campaign.debug.completeStage();
  assert.ok(q.campaign.debug.progress.cleared.includes("storehouse"));
});
test("Guardian cycles three attacks and only takes damage while recovering",()=>{
  const {q}=harness();q.startCampaign();q.campaign.debug.progress.captain=true;
  q.campaign.debug.enterZone("ward",360,600);
  const b=q.campaign.debug.guardian;
  q.game.hero.invulnerable=999;
  const attacks=new Set();
  for(let i=0;i<1800;i++){q.update(1/60);if(b.state==="telegraph")attacks.add(b.attack);}
  assert.equal(attacks.size,3);
  q.game.hero.x=b.x-35;q.game.hero.y=b.y;b.state="rest";b.hp=2;
  q.game.hero.attackCooldown=0;q.doAttack();assert.equal(b.hp,2);
  b.state="recover";q.game.hero.attackCooldown=0;q.game.hero.damage=2;q.doAttack();
  assert.equal(q.campaign.debug.progress.guardian,true);
  assert.equal(q.campaign.debug.readSave().progress.guardian,true);
});
test("Saving/restoring preserves town, upgrades, quest flags and stage checkpoints",()=>{
  const {q,saved}=harness();q.startCampaign();q.game.mon=14;
  q.campaign.debug.progress.cleared.push("causeway");
  q.campaign.debug.enterZone("cedar",540,440);
  q.campaign.debug.save();
  const restored=harness(saved).q;restored.campaign.startFromTitle({y:510});
  assert.equal(restored.game.mapId,"cedar");assert.equal(restored.game.mon,14);
  assert.ok(restored.campaign.debug.progress.cleared.includes("causeway"));
  restored.campaign.debug.enterStage("canopy","woods",450);restored.campaign.debug.save();
  const again=harness(saved).q;again.campaign.startFromTitle({y:510});
  assert.equal(again.campaign.debug.stage.checkpoint,450);
  assert.equal(again.campaign.debug.stage.y,460);
});
test("New town services heal for free and permanently upgrade only once",()=>{
  const {q}=harness();q.startCampaign();q.game.mon=20;
  q.campaign.debug.enterZone("cedar",380,205);q.doInteract();
  assert.equal(q.campaign.debug.mode,"interior");q.game.hero.x=180;q.game.hero.y=400;
  q.doInteract();assert.equal(q.game.hero.damage,1);assert.equal(q.game.mon,20);
  q.campaign.debug.buyShopItem();assert.equal(q.game.hero.damage,2);assert.equal(q.game.mon,14);
  q.campaign.debug.buyShopItem();assert.equal(q.game.hero.damage,2);assert.equal(q.game.mon,14);
  q.campaign.pointer({x:180,y:380});
  q.campaign.debug.leaveRoom();q.campaign.debug.enterZone("cedar",175,205);q.doInteract();
  q.game.hero.x=180;q.game.hero.y=400;q.game.hero.hp=5;q.game.mon=0;
  q.doInteract();assert.equal(q.game.hero.hp,q.game.hero.maxHp);assert.equal(q.game.mon,0);
  q.doInteract();
  q.campaign.debug.leaveRoom();q.campaign.debug.enterZone("willow",415,265);q.doInteract();
  q.game.hero.x=180;q.game.hero.y=400;q.game.mon=4;
  q.doInteract();assert.equal(q.game.hero.maxHp,100);assert.equal(q.game.mon,4);
  q.campaign.debug.buyShopItem();assert.equal(q.game.hero.maxHp,120);assert.equal(q.game.mon,0);
  q.doInteract();assert.equal(q.game.hero.maxHp,120);
});
test("The full route chain reaches campaign victory without bypassing progression locks",()=>{
  const {q}=harness();q.startCampaign();const c=q.campaign,d=c.debug;
  q.game.hero.x=540;q.game.hero.y=680;q.doInteract();assert.equal(q.game.mapId,"woods");
  d.travel(d.MAPS.woods.exits.find(e=>e.trails));c.pointer({x:180,y:350});
  d.stage.relicCollected=true;d.completeStage();
  d.travel(d.MAPS.woods.exits.find(e=>e.to==="cedar"));assert.equal(q.game.mapId,"cedar");
  d.travel(d.MAPS.cedar.exits.find(e=>e.to==="woods"));d.travel(d.MAPS.woods.exits.find(e=>e.to==="home"));
  q.game.hero.x=540;q.game.hero.y=982;q.doInteract();assert.equal(q.game.mapId,"south");
  d.travel(d.MAPS.south.exits.find(e=>e.stage==="causeway"));d.completeStage();
  d.travel(d.MAPS.south.exits.find(e=>e.to==="willow"));
  d.travel(d.MAPS.willow.exits.find(e=>e.to==="march"));assert.equal(q.game.mapId,"march");
  d.travel(d.MAPS.march.exits.find(e=>e.stage==="harvest"));assert.equal(d.stage.id,"harvest");
  d.stage.relicCollected=true;d.completeStage();assert.equal(q.game.mapId,"march");
  d.travel(d.MAPS.march.exits.find(e=>e.to==="willow"));d.travel(d.MAPS.willow.exits.find(e=>e.to==="south"));
  d.travel(d.MAPS.south.exits.find(e=>e.stage==="storehouse"));
  const boss=d.stage.enemies.find(e=>e.boss);boss.state="recover";boss.hp=1;
  d.stage.x=boss.x-35;d.stage.y=boss.y;d.stage.facing=1;q.game.hero.attackCooldown=0;q.doAttack();
  q.frames(90);const demon=d.stage.enemies.find(e=>e.demon);demon.state="recover";demon.hp=1;
  d.stage.x=demon.x-35;d.stage.y=demon.y;d.stage.facing=1;q.game.hero.attackCooldown=0;q.doAttack();
  d.completeStage();d.travel(d.MAPS.south.exits.find(e=>e.to==="home"));
  q.game.hero.x=540;q.game.hero.y=680;q.doInteract();
  d.travel(d.MAPS.woods.exits.find(e=>e.to==="cedar"));d.travel(d.MAPS.cedar.exits.find(e=>e.to==="ward"));
  const guardian=d.guardian;guardian.state="recover";guardian.hp=1;
  q.game.hero.x=guardian.x-35;q.game.hero.y=guardian.y;q.game.hero.attackCooldown=0;q.doAttack();
  assert.equal(d.progress.guardian,true);assert.equal(d.progress.cleared.length,4);
  assert.equal(d.readSave().progress.guardian,true);
});
test("Journal pauses both prologue and campaign and releases input",()=>{
  const {q}=harness();q.keys.add("arrowdown");q.campaign.toggleMenu();
  const y=q.game.hero.y;q.frames(60);assert.equal(q.game.hero.y,y);assert.equal(q.keys.size,0);
  q.campaign.toggleMenu();q.startCampaign();q.campaign.debug.enterZone("south",358,300);
  q.campaign.toggleMenu();q.keys.add("arrowdown");q.frames(60);assert.equal(q.game.hero.y,300);
});
test("Every expansion scene draws without browser-only globals or missing state",()=>{
  const {q}=harness();q.startCampaign();
  for(const id of Object.keys(q.campaign.debug.MAPS)){q.campaign.debug.enterZone(id);q.draw();}
  for(const id of Object.keys(q.campaign.debug.STAGES)){q.campaign.debug.enterStage(id);q.draw();}
});
test("Denied storage does not crash gameplay or pretend a save exists",()=>{
  const {q,sandbox}=harness();sandbox.localStorage.setItem=()=>{throw Error("blocked");};
  q.startCampaign();assert.equal(q.campaign.debug.save(),false);q.draw();
});
test("Android background lifecycle clears input, saves and pauses without closing an existing dialogue",()=>{
  const {q,sandbox}=harness();q.startCampaign();q.campaign.debug.enterZone("south",350,700);
  q.keys.add("arrowright");
  // Listener capture is exposed only by the test harness, never by the app.
  sandbox.nativeEvents["bell:native-pause"][0]();
  assert.equal(q.keys.size,0);assert.equal(q.campaign.paused,true);
  assert.equal(q.campaign.debug.readSave().zone,"south");
  q.campaign.toggleMenu();q.campaign.debug.enterZone("willow",260,400);q.doInteract();
  assert.equal(q.campaign.paused,true);sandbox.nativeEvents["bell:native-pause"][0]();
  assert.equal(q.campaign.paused,true);
});
test("Android Back opens the journal during play and leaves title exit to Android",()=>{
  const {q,sandbox}=harness();q.startCampaign();let prevented=false;
  sandbox.nativeEvents["bell:native-back"][0]({preventDefault(){prevented=true;}});
  assert.equal(prevented,true);assert.equal(q.campaign.paused,true);
  q.game.scene="title";prevented=false;
  sandbox.nativeEvents["bell:native-back"][0]({preventDefault(){prevented=true;}});
  assert.equal(prevented,false);
});
test("Platform taps walk to a destination; manual input and pause cancel it",()=>{
  const {q}=harness();q.startCampaign();const d=q.campaign.debug;d.enterStage("canopy");const p=d.stage;p.enemies=[];p.x=100;
  q.platformTap({x:220,y:350},p);assert.equal(p.tapX,220);
  for(let i=0;i<90;i++)q.advanceFrame(1/60);
  assert.ok(Math.abs(p.x-220)<8);assert.equal(p.tapX,null);
  q.platformTap({x:280,y:350},p);q.keys.add("a");q.advanceFrame(1/60);assert.equal(p.tapX,null);
  q.keys.clear();q.platformTap({x:280,y:350},p);q.campaign.toggleMenu();assert.equal(p.tapX,null);
});

test("Double-tap is a short hop, triple-tap is high, with no repeat jump on landing",()=>{
  const peaks=[];
  for(const count of [2,3]){
    const {q}=harness();q.startCampaign();q.campaign.debug.enterStage("canopy");const p=q.campaign.debug.stage;p.enemies=[];p.x=100;
    for(let n=0;n<count;n++){q.platformTap({x:240,y:350},p);q.advanceFrame(.07);}
    let peak=460;
    for(let n=0;n<90;n++){q.advanceFrame(1/60);peak=Math.min(peak,p.y);}
    peaks.push(peak);assert.equal(p.grounded,true);assert.equal(p.tapX,null);
  }
  assert.ok(peaks[0]-peaks[1]>50,JSON.stringify(peaks));
});

test("Tap Yusuke slashes and never queues a walking destination",()=>{
  const {q}=harness();q.startCampaign();q.campaign.debug.enterStage("canopy");const p=q.campaign.debug.stage;p.enemies=[];p.x=100;
  q.platformTap({x:p.x-p.camera,y:p.y-p.cameraY-30},p);
  assert.ok(q.game.hero.attackFx>0);assert.equal(p.tapX,null);
});

test("Top-down tapping Yusuke attacks instead of creating a travel target",()=>{
  const {q,sandbox}=harness();q.startCampaign();q.game.hero.attackCooldown=0;
  sandbox.nativeEvents.pointerdown[0]({clientX:180,clientY:445,pointerId:1,preventDefault(){}});
  assert.ok(q.game.hero.attackFx>0);assert.equal(q.game.tapTarget,null);assert.equal(q.game.scene,"topdown");
});

test("Lower render FPS preserves travel time without large collision steps",()=>{
  const positions=[];
  for(const fps of [20,30,60,120]){
    const {q}=harness();q.startCampaign();q.campaign.debug.enterZone("south",350,600);q.campaign.debug.foes.forEach(e=>e.dead=true);q.keys.add("s");
    for(let n=0;n<fps;n++)q.advanceFrame(1/fps);
    positions.push(q.game.hero.y);
  }
  assert.ok(Math.max(...positions)-Math.min(...positions)<.1,JSON.stringify(positions));
});

test("Tiny final physics steps keep walking poses and tap destinations alive",()=>{
  for(const place of ['home','south']){
    const {q}=harness();q.startCampaign();
    if(place==='south')q.campaign.debug.enterZone('south',350,700);
    else {q.game.hero.x=540;q.game.hero.y=850;}
    const start=q.game.hero.x;
    q.game.tapTarget={x:start+80,y:q.game.hero.y};
    q.advanceFrame(1/60+.00008);
    assert.equal(q.game.hero.moving,true,place+': remainder must not switch the render to idle');
    assert.ok(q.game.tapTarget,place+': remainder must not cancel tap-to-walk');
    for(let n=0;n<15;n++)q.advanceFrame(1/60+.00008);
    assert.ok(q.game.hero.x-start>25,place+': walking continues across frames');
  }
});

test("Japan journey map preserves the north/south spine and all returning side trails",()=>{
  const {q}=harness();const m=q.campaign.debug.JOURNEY_MAP;
  for(const [a,b] of [["ward","cedar"],["cedar","woods"],["woods","home"],["home","south"],["south","willow"],["willow","march"],
    ["woods","spirit"],["woods","canopy"],["south","storehouse"],["south","causeway"],["march","harvest"]]){
    assert.ok(m.edges.some(e=>e[0]===a&&e[1]===b),a+" to "+b);
  }
  assert.equal(m.edges.length,11);assert.equal(m.nodes.length,12);
  assert.ok(m.nodes.every(n=>n.y>=230&&n.y<470),"Chapter plaques leave southern geography available for expansion");
  for(let i=0;i<m.nodes.length;i++)for(let j=i+1;j<m.nodes.length;j++){
    const a=m.nodes[i],b=m.nodes[j];
    assert.ok(Math.abs(a.x-b.x)>=101||Math.abs(a.y-b.y)>=29,"Map plaques do not overlap: "+a.id+" / "+b.id);
  }
  assert.ok(!m.nodes.some(n=>n.id==="future"),"Uncharted geography is not a playable destination");
});

test("Leaving the window pauses and saves rather than allowing off-screen damage",()=>{
  const {q,sandbox}=harness();q.startCampaign();q.campaign.debug.enterZone("south",350,700);q.game.hero.hp=1;
  sandbox.nativeEvents.blur[0]();assert.equal(q.campaign.paused,true);
  q.frames(600);assert.equal(q.game.hero.hp,1);assert.equal(q.campaign.debug.readSave().zone,"south");
});

test("One minute without input pauses the game and preserves the current location",()=>{
  const {q}=harness();q.startCampaign();q.campaign.debug.enterZone("south",350,700);q.game.hero.invulnerable=999;
  for(let n=1;n<=610;n++)q.frame(n*100);
  assert.equal(q.campaign.paused,true);assert.equal(q.game.mapId,"south");
});

test("Thirty simulated minutes keep enemy, projectile and art-cache collections bounded",()=>{
  const {q}=harness();q.startCampaign();q.campaign.debug.enterZone("south",350,700);q.game.hero.invulnerable=3600;
  for(let n=0;n<18000;n++)q.update(.1);
  const c=q.campaign.debug.runtimeCounts();assert.ok(c.foes<=5&&c.shots<30&&c.hazards<10&&c.images<=2,JSON.stringify(c));
});
process.exitCode=failures?1:0;
