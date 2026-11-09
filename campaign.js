/* Bell Before Dusk campaign. All assets and gameplay run locally.
 * Maps and stage geometry are data; the original prologue keeps its own rules.
 */
window.createBellCampaign = function createBellCampaign(api) {
  "use strict";
  const { game, ctx, keys, bell, W, H, say, sfx, setObjective } = api;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const campaignEdition = window.BELL_BUILD?.edition === "android-campaign";
  const roadChapter = campaignEdition || (typeof location !== "undefined" &&
    new URLSearchParams(location.search).get("chapter") === "roads");
  const KEY = "bell-before-dusk.campaign.v1" + (campaignEdition ? ".android-campaign" : roadChapter ? ".roads-preview" : "");
  const SCHEMA = 1;
  const ART = "assets/environment/campaign/";
  const cache = new Map();
  let mode = null, zone = null, stage = null, menu = false, shop = null, dialogue = null, mapOpen=false, interior=null, trailChoice=false;
  let residents = [], foes = [], shots = [], hazards = [], guardian = null;
  let clock = 0, saveClock = 0, transitionClock = 0, newGameArmed = false;
  let storageFailed = false;
  let openingReplay=null;
  let progress = freshProgress();
  let storyCards=[],storyCardIndex=0,storyKind=null;
  let demonFeet=null;
  let demonFrontSpec=null;
  const story=window.BELL_STORY;
  const billing=window.createBellBilling?.(api)||null;
  const journey=window.createBellJourneyFeatures?.({...api,getProgress:()=>progress,save,
    openTrade:npc=>{shop={...npc};api.stopHeroTravel();api.clearMessage();},
    getLocation:()=>({town:mode==="interior"?interior.zone:mode==="zone"&&MAPS[zone]?.safe?zone:!mode&&progress.prologue&&game.mapId==="town"?"home":null,
      safe:mode==="interior"||mode==="zone"&&!!MAPS[zone]?.safe||!mode&&progress.prologue&&game.mapId==="town",stage:mode==="stage"?stage.id:null}),
    travelToTown:id=>{if(id==="home")home();else if(id==="cedar")enterZone(id,540,450);else if(id==="willow")enterZone(id,535,440);}})||null;

  function beginStory(kind){
    if(!story)return;
    storyKind=kind;storyCardIndex=0;
    storyCards=[...(kind==="intro"?story.introduction:story.epilogue)];
    if(kind==="ending")storyCards.push({title:"DELIVERY COMPLETE",text:story.credits.join("\n")});
    menu=false;journey?.close();api.stopHeroTravel();api.clearMessage();
  }
  function finishStory(){
    if(storyKind==="intro")progress.storyIntroSeen=true;
    if(storyKind==="ending")progress.storyEndingSeen=true;
    storyCards=[];storyCardIndex=0;storyKind=null;save();
  }

  function freshProgress() {
    return { prologue: false, cleared: [], captain: false, demon: false, guardian: false,
      quests: [], purchases: [], visited: [], phase: 0, playTime: 0, respawns: 0,
      storyIntroSeen:false,storyEndingSeen:false };
  }
  function image(path) {
    if (!cache.has(path)) {
      const value = new Image();
      value.src = path;
      cache.set(path, value);
    }
    return cache.get(path);
  }
  function ready(value) { return value.complete && value.naturalWidth > 0; }
  function retainImages(paths) {
    for(const path of cache.keys())if(!paths.includes(path))cache.delete(path);
  }
  function readSave() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!value || value.schema !== SCHEMA || !value.game?.hero ||
          !Number.isFinite(value.game.hero.maxHp) || !Array.isArray(value.progress?.cleared)) return null;
      if (value.mode === "stage" && !STAGES[value.stage?.id]) return null;
      if (value.mode === "zone" && !MAPS[value.zone]) return null;
      if(value.mode==="interior"&&(!MAPS[value.interior?.zone]?.shops?.some(s=>s.service===value.interior.service)))return null;
      return value;
    } catch (_) { return null; }
  }
  function save() {
    if(openingReplay)return false; // Replaying the introduction never overwrites the journey.
    if (!game.hero || game.hero.hp <= 0 || game.scene === "title" ||
        game.scene === "outcome" || game.scene === "repair" || game.scene === "shop") return false;
    journey?.normalize(progress);
    const snapshot = JSON.parse(JSON.stringify(game));
    snapshot.tapTarget = null;
    snapshot.hero.moving = false;
    snapshot.hero.attackFx = 0;
    const payload = { schema: SCHEMA, progress, game: snapshot, bell: { ...bell },
      mode, zone, interior:interior?{zone:interior.zone,service:interior.store.service}:null,stage: stage ? { id: stage.id, checkpoint: stage.checkpoint, returnTo: stage.returnTo,
        relicCollected: stage.relicCollected } : null };
    try {
      localStorage.setItem(KEY, JSON.stringify(payload));
      storageFailed = false;
      return true;
    } catch (_) { storageFailed = true; return false; }
  }
  function resume(value) {
    api.resetGame();
    Object.assign(game, value.game);
    Object.assign(bell, value.bell);
    progress = { ...freshProgress(), ...value.progress };
    journey?.normalize(progress);journey?.close();storyCards=[];
    api.stopHeroTravel();
    game.hero.hp = Math.max(1, Math.min(game.hero.hp, game.hero.maxHp));
    game.hero.invulnerable=Math.max(2,game.hero.invulnerable||0);
    if(billing&&!billing.full()&&(value.mode==="interior"||value.mode==="zone"&&value.zone!=="woods"||value.mode==="stage"&&!["spirit","canopy"].includes(value.stage?.id))){home();billing.open();return;}
    if (value.mode === "stage") enterStage(value.stage.id,value.stage.id==="harvest"?"march":value.stage.returnTo, value.stage.checkpoint, value.stage.relicCollected);
    else if (value.mode === "zone") enterZone(value.zone, game.hero.x, game.hero.y);
    else if(value.mode==="interior"){
      const room=value.interior;enterZone(room.zone);
      const store=MAPS[room.zone].shops.find(s=>s.service===room.service);if(store)enterRoom(store);
    }
    else {
      mode = null; zone = null; stage = null;
      if (!["topdown", "platform"].includes(game.scene)) game.scene = "topdown";
      const width = game.mapId === "town" ? 1080 : game.mapId === "outside" ? 720 : 360;
      api.setCamera(clamp(game.hero.x - 158, 0, Math.max(0, width - 316)),
        game.mapId === "town" ? 480 : Math.max(0, game.hero.y - 340));
      say("Journey resumed. Progress saves at gates and during play.");
    }
    if(progress.guardian&&!progress.storyEndingSeen)beginStory("ending");
    else if(value.progress.storyIntroSeen===false&&progress.playTime<1&&!progress.visited.length&&roadChapter)beginStory("intro");
  }
  function startFromTitle(p) {
    billing?.close();
    journey?.close();storyCards=[];
    menu = false;shop=null;dialogue=null;
    if(game.scene==="title"&&p.y>=596){beginOpening();return;}
    if(game.scene==="title"&&openingReplay)openingReplay=null;
    if (game.scene === "outcome" && game.outcome === "victory") {
      progress.prologue = true;
      game.hero.hp = game.hero.maxHp;
      home();
      return;
    }
    if(game.scene==="outcome"){
      if(openingReplay){api.resetGame();progress=freshProgress();game.hero.invulnerable=3;return;}
      const value=readSave();
      if(value?.progress.prologue){
        resume(value);
        if(mode)respawn();
        else {game.hero.hp=game.hero.maxHp;game.hero.invulnerable=3;home();}
      }else {
        // A prologue retry must not reload a one-HP autosave inside a swarm.
        beginFreshJourney();game.hero.invulnerable=3;
        say("Recovered at the start with full health. Your previous attempt is over.");
      }
      return;
    }
    if (p.y >= 557 && game.scene === "title") {
      if (!newGameArmed && readSave()) {
        newGameArmed = true;
        return;
      }
      beginFreshJourney(); newGameArmed = false;
      return;
    }
    const value = readSave();
    if (value) resume(value);
    else {
      beginFreshJourney();
    }
  }
  function beginOpening(){
    openingReplay={saved:readSave()};progress=freshProgress();mode=null;zone=null;stage=null;menu=false;shop=null;dialogue=null;
    api.resetGame();say("Talk to the official. Chase the thief through the original Forest Spirit Path; the roads open afterward.");
  }
  function beginFreshJourney() {
    progress = freshProgress(); mode = null; stage = null; zone = null;
    api.resetGame();
    if(roadChapter){
      progress.prologue=true;game.chaseComplete=true;game.banditFled=true;
      game.hero.damage=2;game.mon=6;home();beginStory("intro");
    }else save();
  }
  function home() {
    journey?.close();
    api.stopHeroTravel();
    mode = null; zone = null; stage = null; menu = false;shop=null;dialogue=null;
    game.scene = "topdown"; game.mapId = "town"; game.phase = "campaign_home";
    game.enemies = []; game.nodes = []; game.hasKatana = true;
    game.hero.x = 540; game.hero.y = 880;
    api.setCamera(382, 480);
    objective();
    say(story?(progress.guardian?story.events.homeRestored:story.events.homeArrival):progress.guardian ? "The roads are safe. Visit your friends or replay cleared routes."
      : "The bell holds. Now follow the roads north and south to find what disturbed the wards.");
    save();
  }
  const MAPS = {
    south: { name: "SOUTHERN HIGH ROAD", w: 720, h: 2092,
      art: ART + "southern-high-road-v3-combined.png", safe: false,
      floors: [[98,120,520,1685],[600,478,115,65],[35,1610,85,96]],
      solids:[[98,120,520,12],[98,1780,520,30],[675,478,40,65],[35,1610,35,96]],
      exits: [{x:358,y:135,label:"HOME",to:"home"},
        {x:358,y:1800,label:"TOWN",to:"willow"},
        {x:640,y:510,label:"PATH",stage:"causeway"},
        {x:100,y:1655,label:"LOCKED",stage:"storehouse",locked:()=>!cleared("harvest")}],
      spawns: [[270,420],[465,730],[220,1030],[480,1360],[300,1620]] },
    woods: { name: "CEDAR ROAD", w:720,h:1080,art:"assets/environment/haunted-field-open-v2.png",safe:false,
      floors:[[60,193,600,707]],
      solids:[[570,383,90,76],[315,193,90,18],[578,193,82,18],[60,883,600,17]],
      exits:[{x:360,y:880,label:"HOME",to:"home"},{x:360,y:200,label:"TOWN",to:"cedar",locked:()=>!cleared("canopy")},
        {x:612,y:220,label:"TRAILS",trails:true}],
      spawns:[[180,340],[470,460],[260,600],[500,750]] },
    cedar: { name:"CEDAR HAMLET",w:1080,h:720,art:ART+"cedar-hamlet-concept-v2.png",safe:true,
      floors:[[55,164,965,74],[55,326,965,186],[207,228,134,108],[740,228,139,108],
        [480,100,120,90],[480,500,120,90]],
      solids:[[480,100,120,45],[480,540,120,50],[95,0,152,172],[300,0,158,172]],
      shops:[{x:175,y:192,labelY:145,name:"GEN'S INN",service:"rest",room:"inn",column:4,
        building:{source:[252,100,215,245],target:[95,0,152,172]}},
        {x:380,y:192,labelY:145,name:"TAKESHI'S FORGE",service:"steel",room:"forge",column:5,
        building:{source:[1060,100,225,245],target:[300,0,158,172]}}],
      exits:[{x:540,y:520,label:"ROAD",to:"woods"},{x:540,y:170,label:"WARD",to:"ward",locked:()=>!progress.captain||!progress.demon&&!progress.guardian}],
      people:[
        {name:"Aya",role:"WARDEN",column:0,x:560,y:400,service:"warden"},
        {name:"Sota",role:"TRADER",column:4,x:300,y:400,service:"local",line:"The inn and forge are on the upper-left street. Take the left stairs, then use their doors."},
        {name:"Shin",role:"FISHERMAN",column:1,x:790,y:410,service:"local",line:"Aya guards the north road. The captain stole her seal; find him beyond the locked west High Road gate."}
      ] },
    willow: {name:"WILLOW FERRY",w:1080,h:720,art:ART+"willow-ferry-concept-v2.png",safe:true,
      floors:[[153,215,845,274],[475,125,120,115],[475,480,120,125],[90,320,80,140]],
      solids:[[475,125,120,60],[475,525,120,80],[90,335,75,90],[170,62,152,172],[335,62,158,172]],
      shops:[{x:250,y:254,labelY:207,name:"MIKA'S INN",service:"rest",room:"inn",column:2,variant:1,
        building:{source:[252,100,215,245],target:[170,62,152,172]}},
        {x:415,y:254,labelY:207,name:"RIKU'S MARKET",service:"supplies",room:"forge",column:4,
        building:{source:[1060,100,225,245],target:[335,62,158,172]}}],
      exits:[{x:535,y:210,label:"ROAD",to:"south"},{x:535,y:500,label:"RIVER ROAD",to:"march"}],
      people:[
        {name:"Nao",role:"FERRYMASTER",column:1,variant:0,x:260,y:360,service:"ferry"},
        {name:"Mina",role:"TOWNSWOMAN",column:2,variant:1,x:480,y:360,service:"local",line:"Mika's inn is on the northwest row, beside Riku's market. Go inside to rest or trade."},
        {name:"Sada",role:"TRADER",column:4,x:730,y:370,service:"local",line:"South of our gate is River March. Its west trail leads to the harvest warehouses; the farther roads are still closed."}
      ] },
    march: {name:"RIVER MARCH",w:720,h:2092,art:ART+"southern-high-road-v3-combined.png",safe:false,
      floors:[[98,120,520,1685],[600,478,115,65],[35,1610,85,96]],
      solids:[[98,120,520,12],[98,1780,520,30],[675,478,40,65],[35,1610,35,96]],
      exits:[{x:358,y:135,label:"WILLOW",to:"willow"},
        {x:100,y:1655,label:"HARVEST TRAIL",stage:"harvest",locked:()=>!cleared("causeway")},
        {x:640,y:510,label:"CLOSED ROAD",locked:()=>true,closed:"The eastern road is beyond the current playable chapter."},
        {x:358,y:1800,label:"CLOSED COAST",locked:()=>true,closed:"The coast road is not open in this chapter. Take the west Harvest Trail."}],
      spawns:[[270,420],[465,730],[220,1030],[480,1360],[300,1620]]},
    ward: {name:"BROKEN WARD",w:720,h:1080,art:"assets/environment/haunted-field-open-v2.png",safe:false,
      floors:[[65,210,590,660]],solids:[[570,383,85,76]],exits:[{x:360,y:850,label:"TOWN",to:"cedar"}],spawns:[]}
  };

  // Each image is registered in horizontal strips so the same landing heights
  // continue across panel seams despite small differences in generated art.
  const STAGES = {
    spirit:{name:"FOREST SPIRIT PATH",classic:true,returnTo:"woods"},
    canopy: {name:"CEDAR CANOPY", art:"cedar-canopy-lanes-v1", three:true,
      bands:[[176,394,596],[210,397,580]], cuts:[[0,330,545,724],[0,340,540,724]],
      lanes:[
        [[210,1130],[1320,2172]],[[0,900],[1040,2020]],
        [[0,180],[380,1360],[1560,2172]],[[0,1010],[1160,2172]]
      ], returnTo:"woods"},
    causeway: {name:"FLOODED CAUSEWAY",art:"flooded-causeway-v1",three:false,
      bands:[[240,445],[230,438]],cuts:[[0,400,724],[0,390,724]],
      lanes:[[[450,1100],[1260,1750]],[[0,880],[960,1260],[1340,1700],[1780,2172]],
        [[300,1000],[1140,1560]],[[0,480],[560,890],[970,1300],[1380,2172]]],returnTo:"south"},
    harvest: {name:"HARVEST LEVEE",art:"harvest-levee-v1",three:true,
      bands:[[180,374,565],[180,374,565]],cuts:[[0,310,500,724],[0,310,500,724]],
      lanes:[[[210,1130],[1320,2172]],[[0,900],[1040,2020]],
        [[0,1020],[1180,1900]],[[0,980],[1060,1800]]],returnTo:"march"},
    storehouse: {name:"BANDIT STOREHOUSE",art:"bandit-storehouse-v1",three:true,boss:true,
      arena:{start:2172,width:360,floor:460,art:"captain-arena-backdrop-v1.png"},
      bands:[[166,390,610],[150,385,600]],cuts:[[0,310,545,724],[0,290,525,724]],
      lanes:[[[0,1180],[1400,2172]],[[0,980],[1080,2172]],
        [[0,400],[520,1510],[1610,2172]],[[0,990],[1100,2172]]],returnTo:"south"}
  };
  function cleared(id) { return progress.cleared.includes(id); }
  function inside(x,y,r) { return x>=r[0] && x<=r[0]+r[2] && y>=r[1] && y<=r[1]+r[3]; }
  function npcSolid(x,y,actor) {
    return residents.some(n=>n!==actor && Math.hypot((x-n.x)/1.3,y-n.y)<17);
  }
  function walkable(x,y,actor) {
    if(mode==="interior")return api.interiorWalkableAt(x,y,actor?.moveR||7)&&
      !(Math.hypot(x-180,y-344)<18);
    const map = MAPS[zone], radius = actor?.moveR || 7;
    return [[x-radius,y],[x+radius,y],[x,y-radius],[x,y+radius]]
      .every(p=>map.floors.some(r=>inside(p[0],p[1],r)) &&
        !(map.solids||[]).some(r=>inside(p[0],p[1],r))) && !npcSolid(x,y,actor);
  }
  function move(actor,dx,dy) {
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/4));
    for(let i=0;i<steps;i++){
      if(walkable(actor.x+dx/steps,actor.y,actor))actor.x+=dx/steps;
      if(walkable(actor.x,actor.y+dy/steps,actor))actor.y+=dy/steps;
    }
  }
  function objective() {
    let line;
    if(!progress.prologue) return;
    if(story){setObjective(story.objective(progress));return;}
    if(progress.guardian) line="Journey complete • replay routes or visit the towns";
    else if(progress.captain) line="Return to Aya in Cedar Hamlet • confront the ward guardian";
    else if(cleared("harvest")) line="The west road is open • defeat the bandit captain";
    else if(cleared("causeway")) line="Willow south gate → River March → west Harvest Trail → warehouse key";
    else if(cleared("canopy")) line="South High Road → east Flooded Causeway → Willow Ferry";
    else line="North → Cedar Road → shrine trails → Cedar Canopy → Cedar Hamlet";
    setObjective(line);
  }
  function directions() {
    if(story)return story.directions(progress);
    if(progress.guardian)return "Both roads are safe. You can revisit the towns and replay any trail.";
    if(progress.captain)return "Take Cedar Hamlet's north gate to the Broken Ward. Speak to Aya in town first if you need directions.";
    if(cleared("harvest"))return "You have the warehouse key. Go NORTH from Willow Ferry onto the High Road, then take its WEST gate to the Bandit Storehouse. The captain has the ward seal.";
    if(cleared("causeway"))return "Go SOUTH from Willow Ferry into River March. Take its WEST Harvest Trail. Collect the warehouse key on the upper deck, then use EXIT at the far end.";
    if(cleared("canopy"))return "From Post Town go SOUTH onto the High Road. Take the EAST Flooded Causeway, cross it and use the far EXIT. Then visit Nao in Willow Ferry.";
    return "From Post Town go NORTH onto Cedar Road. At the northeast shrine choose CEDAR CANOPY, collect its ward token, then use the far EXIT. The original Spirit Path is an optional trail.";
  }
  function showDialogue(line) {
    dialogue=line;api.stopHeroTravel();api.clearMessage();
  }
  function makeFoe(x,y,type="prowler") {
    const boss=type==="boss";
    const tier=mode==="zone"?(zone==="march"?2:zone==="south"?1:0):0;
    const health=boss?36:Math.ceil((type==="wisp"?4:type==="bandit"?6:8)*(1+tier*.15));
    return {x,y,type,hp:health,maxHp:health,r:boss?25:13,moveR:9,
      boss,dead:false,flash:0,seed:x*0.01,state:"wander",stateClock:1,
      animDistance:0,facingX:1,facingY:0,cooldown:0};
  }
  function enterZone(id,x,y) {
    if(!["home","woods"].includes(id)&&billing&&!billing.requireFull())return;
    journey?.close();
    if(id==="home"){home();return;}
    const map=MAPS[id];
    if(!map) return;
    mode="zone";zone=id;stage=null;menu=false;shop=null;dialogue=null;
    api.stopHeroTravel();
    api.clearMessage();
    game.scene="topdown";game.mapId=id;game.phase="campaign";game.enemies=[];game.nodes=[];
    game.hasKatana=true;game.hero.x=x??(id==="south"?358:540);game.hero.y=y??(id==="south"?160:440);
    if(!progress.visited.includes(id))progress.visited.push(id);
    progress.phase++;
    residents=(map.people||[]).map((n,i)=>({...n,homeX:n.x,homeY:n.y,
      r:8,moveR:8,walkDistance:0,facingX:0,facingY:1,moving:false,pause:0,
      waypoint:0,route:[[n.x,n.y],[n.x+45,n.y],[n.x+45,n.y+48],[n.x,n.y+48]]}));
    // Older saves may have stopped inside scenery that is now solid.
    if(!walkable(game.hero.x,game.hero.y,game.hero)){
      const origin={x:game.hero.x,y:game.hero.y};let arrival=null;
      for(let radius=8;radius<=Math.max(map.w,map.h)&&!arrival;radius+=8)
        for(let step=0;step<32&&!arrival;step++){
          const angle=step*Math.PI/16,x=origin.x+Math.cos(angle)*radius,y=origin.y+Math.sin(angle)*radius;
          if(walkable(x,y,game.hero))arrival={x,y};
        }
      if(arrival)Object.assign(game.hero,arrival);
    }
    foes=(map.spawns||[]).map((p,i)=>makeFoe(...p,["bandit","wisp","prowler","raider"][i%4]));
    shots=[];hazards=[];guardian=null;transitionClock=0.8;
    retainImages([map.art]);
    if(id==="ward"&&!progress.guardian){
      guardian=makeFoe(360,400,"boss");
      guardian.state="rest";guardian.stateClock=1.8;guardian.attackIndex=0;
      foes=[guardian];
    }
    objective();
    if(id==="ward"&&!progress.guardian)setObjective("Read the guardian's warnings • strike during its recovery");
    setCamera(true);
    image(map.art); save();
  }
  function travel(exit) {
    if(exit.trails){trailChoice=true;api.stopHeroTravel();return;}
    if(exit.locked?.()){
      showDialogue(exit.closed|| (exit.stage==="storehouse" ? "The west lock needs the warehouse key. Nao knows who carries it."
        :exit.to==="cedar" ? "Clear Cedar Canopy to open the northern ward road."
        :exit.to==="ward" ? progress.captain?"Aya: The Cinder Maw still binds the seal. Defeat it in the storehouse's tiered room first.":"Aya: The captain carries the stolen ward seal. Bring it back first."
        :"Clear the east Flooded Causeway first. Then return to the west Harvest Trail in River March.")+" "+directions());
      return;
    }
    if(exit.stage) {enterStage(exit.stage,zone);return;}
    const from=zone;
    if(exit.to==="home")home();
    else if(exit.to==="south")enterZone("south",358,1740);
    else if(exit.to==="woods")enterZone("woods",360,245);
    else if(exit.to==="cedar")enterZone("cedar",540,450);
    else if(exit.to==="willow")enterZone("willow",535,from==="march"?475:260);
    else if(exit.to==="march")enterZone("march",358,160);
    else if(exit.to==="ward")enterZone("ward",360,790);
    if(from!==zone)sfx("pickup");
  }
  function context() {
    if(menu)return null;
    if(mode==="interior"){
      if(distance(game.hero,{x:180,y:570})<62)return {label:"EXIT",type:"campaign",leaveRoom:true};
      if(distance(game.hero,{x:180,y:344})<75)return {label:interior.store.service==="rest"?"REST":"TRADE",type:"campaign",npc:interior.store};
      return null;
    }
    if(mode==="zone"){
      const store=(MAPS[zone].shops||[]).find(s=>distance(game.hero,s)<58);
      if(store)return {label:"ENTER",type:"campaign",store};
      const npc=residents.find(n=>distance(game.hero,n)<60);
      if(npc)return {label:npc.service==="rest"?"REST":npc.service==="steel"||npc.service==="supplies"?"TRADE":"TALK",
        type:"campaign",npc};
      const exit=MAPS[zone].exits.find(e=>distance(game.hero,e)<76);
      if(exit)return {label:exit.locked?.()?"LOCKED":exit.label,type:"campaign",exit};
    }
    if(progress.prologue && !mode && game.mapId==="town" && game.phase==="campaign_home"){
      if(distance(game.hero,{x:540,y:990})<76)return {label:"SOUTH",type:"campaign",homeExit:"south"};
      if(distance(game.hero,{x:540,y:665})<90)return {label:"NORTH",type:"campaign",homeExit:"woods"};
      if(distance(game.hero,{x:540,y:828})<65)return {label:"TALK",type:"campaign",
        npc:{name:"Official",service:"guide"}};
    }
    return null;
  }
  function interact() {
    if(dialogue){dialogue=null;return true;}
    if(shop)return true;
    if(menu)return true;
    if(mode==="stage"){
      if(gateReady()&&stage.x<100)returnFromStage();
      else if(gateReady()&&stage.x>stage.width-110)completeStage();
      else say("Jump: Space or red button. Slash: J or teal button. Down + jump drops through a deck.");
      return true;
    }
    const action=context();
    if(action?.type!=="campaign")return false;
    if(action.homeExit){
      if(action.homeExit==="south")enterZone("south",358,160);
      else enterZone("woods",360,820);
    } else if(action.store)enterRoom(action.store);
    else if(action.leaveRoom)leaveRoom();
    else if(action.exit)travel(action.exit);
    else talk(action.npc);
    return true;
  }
  function talk(npc) {
    if(journey?.npcTalk(npc))return;
    if(npc.service==="steel"||npc.service==="supplies"){
      shop={...npc};api.stopHeroTravel();api.clearMessage();return;
    }
    const say=showDialogue;
    npc.pause=3;
    const h=game.hero;
    if(npc.service==="local")say(npc.name+": "+npc.line);
    else if(npc.service==="rest"){
      h.hp=h.maxHp;progress.phase++;
      say(npc.name+": Your wounds are treated. Rest here before you take the road. Health restored.");
    } else if(npc.service==="ferry"){
      if(!progress.quests.includes("ferry"))progress.quests.push("ferry");
      say("Nao: "+directions());
    } else if(npc.service==="guide"){
      say("Official: "+directions());
    } else {
      if(progress.guardian)say("Aya: The guardian rests. Both towns will remember who reopened these roads.");
      else if(progress.captain){say("Aya: The stolen seal is back. Take the north gate; the guardian must be calmed.");}
      else say("Aya: The captain stole our ward seal. "+directions());
    }
    const authored=story?.npc(npc,progress);if(authored)showDialogue(authored);
    objective();save();
  }
  function setCamera(snap=false) {
    if(mode==="interior"){api.setCamera(0,0);return;}
    const map=MAPS[zone],old=api.getCamera(),zoom=api.CAMERA_ZOOM;
    const x=clamp(game.hero.x-W/(zoom*2),0,Math.max(0,map.w-W/zoom));
    // Reserve the HUD-covered top band so upper-street doors remain visible.
    const y=clamp(game.hero.y-360,-120,Math.max(0,map.h-H/zoom));
    api.setCamera(snap?x:old.x+(x-old.x)*0.14,snap?y:old.y+(y-old.y)*0.14);
  }
  function enterRoom(store){
    interior={zone,store,x:store.x,y:store.y+15};mode="interior";api.stopHeroTravel();
    game.mapId=store.room==="inn"?"inn":"smith";game.hero.x=180;game.hero.y=520;
    api.setCamera(0,0);api.clearMessage();setObjective("Approach the host to trade or rest • south door returns to town");save();
  }
  function leaveRoom(){
    const arrival=interior;interior=null;enterZone(arrival.zone,arrival.x,arrival.y);
  }
  function buyShopItem() {
    if(!shop)return;
    const id=shop.service,cost=id==="steel"?6:4;
    if(progress.purchases.includes(id)){shop.notice="Already equipped.";return;}
    if(game.mon<cost){shop.notice="Not enough mon. Earn it from enemies and routes.";return;}
    game.mon-=cost;
    if(id==="steel")game.hero.damage++;
    else {game.hero.maxHp+=20;game.hero.hp=game.hero.maxHp;}
    progress.purchases.push(id);shop.notice="Equipped permanently. Journey saved.";
    sfx("upgrade");save();
  }
  function drawShop() {
    const steel=shop.service==="steel",cost=steel?6:4,owned=progress.purchases.includes(shop.service);
    ctx.fillStyle="#050911dc";ctx.fillRect(0,0,W,H);
    api.paperPanel(24,135,312,330);
    api.text(shop.name||"ROAD SHOP",180,168,16,"#3d3020","center",true);
    api.text(steel?"REFORGED BLADE":"TRAVEL KIT",180,207,15,"#884631","center",true);
    api.text(steel?"Permanent attack +1":"Permanent maximum health +20",180,237,10,"#584b36","center");
    api.text("PRICE "+cost+" MON  •  PURSE "+game.mon,180,267,11,"#526142","center",true);
    for(const [y,label] of [[292,owned?"ALREADY EQUIPPED":"BUY — "+cost+" MON"],[360,"LEAVE SHOP"]]){
      api.menuButton(48,y,264,44,y===292);api.text(label,180,y+22,12,"#f5e6c9","center",true);
    }
    api.wrappedText(shop.notice||"Mon is earned in play. No real-money purchases.",180,432,260,14,9,"#584b36",2);
  }
  function tick(dt) {
    if(openingReplay&&game.chaseComplete&&game.mapId==="town"){
      const prior=openingReplay;openingReplay=null;
      // Recover saved gear/progression, but the field's south gate is always
      // Post Town, never whichever town was saved before replaying the opening.
      if(prior.saved){
        Object.assign(game,prior.saved.game);Object.assign(bell,prior.saved.bell);
        progress={...freshProgress(),...prior.saved.progress};
      }
      progress.prologue=true;game.chaseComplete=true;game.banditFled=true;
      game.hero.hp=game.hero.maxHp;game.hero.invulnerable=3;home();
      say("Clapper recovered. Follow the stolen seal north and south; the road map shows your next lead.");
    }
    if(game.scene==="title")return;
    if(menu||storyCards.length||journey?.paused||billing?.paused)return;
    clock+=dt;progress.playTime+=dt;saveClock+=dt;
    if(saveClock>=8){saveClock=0;save();}
  }
  function update(dt) {
    if(menu)return;
    game.elapsed+=dt;
    const h=game.hero;
    h.attackCooldown=Math.max(0,h.attackCooldown-dt);
    h.attackFx=Math.max(0,h.attackFx-dt);
    h.invulnerable=Math.max(0,h.invulnerable-dt);
    transitionClock=Math.max(0,transitionClock-dt);
    if(mode==="stage"){updateStage(dt);return;}
    let input=api.movementInput();
    if(Math.hypot(input.x,input.y)>0.1)game.tapTarget=null;
    if(game.tapTarget&&Math.hypot(input.x,input.y)<=0.1){
      const d=distance(h,game.tapTarget);
      if(d<8)game.tapTarget=null;
      else input={x:(game.tapTarget.x-h.x)/d,y:(game.tapTarget.y-h.y)/d};
    }
    const oldX=h.x,oldY=h.y;
    if(Math.hypot(input.x,input.y)>0.1){
      h.facingX=input.x;h.facingY=input.y;
      move(h,input.x*h.speed*dt,input.y*h.speed*dt);
    }
    const travelled=Math.hypot(h.x-oldX,h.y-oldY);
    h.moving=travelled>0.000001;
    h.walkDistance=(h.walkDistance||0)+travelled;
    if(!h.moving&&game.tapTarget)game.tapTarget=null;
    if(mode==="interior"){api.setCamera(0,0);return;}
    updatePeople(dt);
    for(const enemy of foes)if(!enemy.dead){
      enemy.flash=Math.max(0,enemy.flash-dt);
      if(enemy===guardian)updateGuardian(dt);
      else updateFieldFoe(enemy,dt);
    }
    updateShots(dt);
    for(const hazard of hazards){
      hazard.t-=dt;
      if(hazard.t<=0&&!hazard.fired){
        hazard.fired=true;
        if(distance(h,hazard)<hazard.r)hurt(15);
      }
    }
    hazards=hazards.filter(a=>a.t>-0.35);
    setCamera();
    if(h.hp<=0)respawn();
  }
  function updatePeople(dt) {
    for(const n of residents){
      n.pause=Math.max(0,n.pause-dt);n.moving=false;
      if(n.pause>0||distance(n,game.hero)<65)continue;
      const target=n.route[n.waypoint],dx=target[0]-n.x,dy=target[1]-n.y,d=Math.hypot(dx,dy);
      if(d<3){n.waypoint=(n.waypoint+1)%n.route.length;n.pause=1.1;continue;}
      const x=n.x,y=n.y;
      move(n,dx/d*19*dt,dy/d*19*dt);
      n.moving=Math.hypot(n.x-x,n.y-y)>0.000001;
      if(n.moving){
        n.walkDistance+=Math.hypot(n.x-x,n.y-y);
        n.facingX=Math.abs(dx)>Math.abs(dy)?Math.sign(dx):0;
        n.facingY=n.facingX?0:Math.sign(dy);
      }
    }
  }
  function hurt(amount) {
    if(game.hero.invulnerable>0)return;
    game.hero.hp=Math.max(0,game.hero.hp-(journey?.damageTaken(amount)??amount));
    game.hero.invulnerable=0.9;sfx("hurt");
  }
  function updateFieldFoe(e,dt) {
    e.cooldown=Math.max(0,e.cooldown-dt);
    const h=game.hero,d=distance(e,h),oldX=e.x,oldY=e.y;
    if(e.state==="ranged"){
      e.stateClock-=dt;
      if(e.stateClock<=0){const length=distance(e,e.target)||1;
        shots.push({x:e.x,y:e.y-10,vx:(e.target.x-e.x)/length*110,vy:(e.target.y-e.y)/length*110,t:3});
        e.cooldown=2.2;e.state="recover";
      }
    }else if(e.type==="wisp"&&d>70&&d<230&&e.cooldown<=0){e.state="ranged";e.stateClock=journey?.warningTime(.75)??.75;e.target={x:h.x,y:h.y};}
    else if(e.state==="telegraph"){
      e.stateClock-=dt;
      if(e.stateClock<=0){if(d<40)hurt(e.type==="raider"?16:13);e.cooldown=1.1;e.state="recover";}
    } else if(d<36&&e.cooldown<=0){e.state="telegraph";e.stateClock=journey?.warningTime(.55)??.55;}
    else if(d<280){
      e.state="chase";
      const speed=e.type==="bandit"?65:e.type==="wisp"?38:54;
      move(e,(h.x-e.x)/(d||1)*speed*dt,(h.y-e.y)/(d||1)*speed*dt);
    }else {e.state="wander";move(e,Math.sin(clock+e.seed)*8*dt,Math.cos(clock+e.seed)*8*dt);}
    const dx=e.x-oldX,dy=e.y-oldY;
    e.animDistance+=Math.hypot(dx,dy);
    if(Math.hypot(dx,dy)>0.001){e.facingX=dx;e.facingY=dy;}
  }
  function damageEnemy(e,amount) {
    if(e.dead)return;
    e.hp-=amount;e.flash=0.18;sfx("hit");
    if(e.hp>0)return;
    e.dead=true;game.mon+=e.boss?8:1;game.ash+=e.boss?3:1;game.score+=e.boss?1000:100;
    if(e===guardian){
      progress.guardian=true;objective();save();
      say(story?.events.guardianDefeated||"The guardian settles. The stolen wards are restored; both towns and roads are safe.");
      if(!progress.storyEndingSeen)beginStory("ending");
    }
  }
  function attack() {
    if(menu||game.hero.attackCooldown>0)return;
    const h=game.hero,weapon=journey?.weapon();h.attackCooldown=weapon?.cooldown??.34;h.attackFx=Math.min(.24,h.attackCooldown);sfx("slash");
    const reach=weapon?.reach??58,damage=h.damage*(weapon?.damage??1);
    if(mode==="stage"){
      stage.slashSerial++;
      for(const e of stage.enemies){
        if(e.dead||Math.abs(stage.x-e.x)>reach||Math.abs(stage.y-e.y)>52)continue;
        if((e.x-stage.x)*stage.facing<-12)continue;
        if(e.boss&&e.state!=="recover"){say(e.demon?"The Cinder Maw's armor holds. Change tiers, then strike during OPEN.":"Captain is guarding. Evade his rush; strike while he recovers.");continue;}
        damageEnemy(e,damage);
        if(e.boss&&e.dead){
          if(e.demon){progress.demon=true;e.deathAge=0;objective();save();say("Cinder Maw banished. The seal is free — take EXIT and return to Aya.");}
          else {progress.captain=true;stage.demonPending=1.4;stage.checkpoint=2200;save();say("The captain falls, but a demon has bound the stolen seal. Climb to escape its fire!");}
        }
      }
      return;
    }
    const target=foes.filter(e=>!e.dead&&distance(e,h)<(weapon?reach:63)).sort((a,b)=>distance(a,h)-distance(b,h))[0];
    if(target){
      const d=distance(target,h)||1;h.facingX=(target.x-h.x)/d;h.facingY=(target.y-h.y)/d;
      if(target===guardian&&guardian.state!=="recover"){
        say("The ward armor holds. Wait for the guardian to recover after its attack.");
      }else damageEnemy(target,damage);
    }
  }
  function updateGuardian(dt) {
    const b=guardian,h=game.hero;
    b.stateClock-=dt;
    if(b.state==="rest"&&b.stateClock<=0){
      const choice=b.attackIndex++%3;b.target={x:h.x,y:h.y};
      b.attack=choice;b.state="telegraph";b.stateClock=journey?.warningTime(b.hp<b.maxHp/2?.75:1.05)??(b.hp<b.maxHp/2?.75:1.05);
      if(choice===1)for(let i=0;i<3;i++)hazards.push({x:clamp(h.x+(i-1)*80,110,610),
        y:clamp(h.y+(i%2)*60,270,800),r:43,t:journey?.warningTime(1.2+i*.2)??(1.2+i*.2),fired:false});
    } else if(b.state==="telegraph"&&b.stateClock<=0){
      if(b.attack===0){b.state="charge";b.stateClock=0.7;const d=distance(b,b.target)||1;
        b.vx=(b.target.x-b.x)/d*280;b.vy=(b.target.y-b.y)/d*280;}
      else if(b.attack===2){
        for(let i=0;i<10;i++){const a=i*Math.PI/5;shots.push({x:b.x,y:b.y,vx:Math.cos(a)*95,vy:Math.sin(a)*95,t:4,side:false});}
        b.state="recover";b.stateClock=2.5;
      }else {b.state="recover";b.stateClock=2.6;}
    } else if(b.state==="charge"){
      move(b,b.vx*dt,b.vy*dt);b.animDistance+=280*dt;
      if(distance(b,h)<42)hurt(18);
      if(b.stateClock<=0){b.state="recover";b.stateClock=2.8;}
    } else if(b.state==="recover"&&b.stateClock<=0){b.state="rest";b.stateClock=1.2;}
    b.facingX=Math.sign(h.x-b.x)||1;
  }
  function updateShots(dt) {
    for(const shot of shots){
      shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.t-=dt;
      const target=shot.side?{x:stage.x,y:stage.y-28}:game.hero;
      if(distance(shot,target)<19){hurt(10);shot.t=0;}
    }
    shots=shots.filter(s=>s.t>0);
  }

  function surfacesFor(id) {
    const def=STAGES[id],list=[];
    if(def.classic)return api.spiritSegments.map(s=>({x:s.start,end:s.end,y:s.y0,yEnd:s.y1,spirit:s,oneWay:false}));
    for(let panel=0;panel<2;panel++){
      const offset=panel*1086;
      for(let lane=0;lane<2;lane++){
        const y=bandY(def,panel,lane);
        for(const [left,right] of def.lanes[panel*2+lane])
          list.push({x:offset+left/2,end:offset+right/2,y,oneWay:true});
      }
    }
    if(def.three)list.push({x:0,end:2172,y:460,oneWay:false});
    else list.filter(s=>s.y===460).forEach(s=>s.oneWay=false);
    return list.concat(arenaSurfaces(def));
  }
  function arenaSurfaces(def){
    if(!def.arena)return [];
    const a=def.arena;
    return [{x:a.start,end:a.start+a.width,y:a.floor,oneWay:false,arena:true},
      ...[[32,108,370],[252,328,370],[0,64,285],[296,360,285],[86,156,200],[204,274,200]]
        .map(([left,right,y])=>({x:a.start+left,end:a.start+right,y,oneWay:true,arena:true}))];
  }
  function bandY(def,panel,lane){
    const contacts=def.bands[panel];return 460+(contacts[lane]-contacts.at(-1))/2;
  }
  function surfaceY(s,x){return s.spirit?api.spiritSurfaceY(s.spirit,x):s.y+(s.yEnd===undefined?0:(s.yEnd-s.y)*clamp((x-s.x)/(s.end-s.x),0,1));}
  function refineStageGeometry(){
    const p=stage,def=STAGES[p.id];if(p.geometryReady||def.classic)return;
    const panels=["a","b"].map(s=>image(ART+"platformers/"+def.art+"-panel-"+s+".png"));
    if(!panels.every(ready))return;
    const surfaces=[];
    for(let panel=0;panel<2;panel++){
      const art=panels[panel],scan=document.createElement("canvas");scan.width=art.naturalWidth;scan.height=art.naturalHeight;
      const paint=scan.getContext("2d",{willReadFrequently:true});paint.drawImage(art,0,0);
      const alpha=paint.getImageData(0,0,scan.width,scan.height).data;
      for(let lane=0;lane<def.bands[panel].length;lane++){
        const contact=def.bands[panel][lane],runs=[];let start=-1,last=-1;
        for(let x=0;x<scan.width;x++){
          let solid=0;for(let y=contact+4;y<=contact+16;y++)if(alpha[(y*scan.width+x)*4+3]>64)solid++;
          if(solid>=4){if(start<0)start=x;last=x;}
          else if(start>=0&&x-last>6){if(last-start>=28)runs.push([start,last+1]);start=-1;}
        }
        if(start>=0&&last-start>=28)runs.push([start,last+1]);
        for(const [left,right] of runs)surfaces.push({x:panel*1086+left/2,end:panel*1086+right/2,
          y:bandY(def,panel,lane),oneWay:lane<def.bands[panel].length-1});
      }
    }
    if(surfaces.length){
      surfaces.push(...arenaSurfaces(def));
      p.surfaces=surfaces;p.geometryReady=true;
      if(!surfaces.some(s=>!s.oneWay&&p.checkpoint>=s.x+8&&p.checkpoint<=s.end-8)){
        const ground=surfaces.filter(s=>!s.oneWay).sort((a,b)=>Math.abs(clamp(p.checkpoint,a.x,a.end)-p.checkpoint)-Math.abs(clamp(p.checkpoint,b.x,b.end)-p.checkpoint))[0];
        if(ground)p.checkpoint=clamp(p.checkpoint,ground.x+10,ground.end-10);
      }
      for(const e of p.enemies){
        const floor=surfaces.find(s=>Math.abs(s.y-e.y)<2&&e.x>=s.x&&e.x<=s.end);
        if(floor){e.left=Math.max(e.left,floor.x+10);e.right=Math.min(e.right,floor.end-10);}
        else if(!e.boss)e.dead=true;
      }
      if(p.relic&&!surfaces.some(s=>s.y===p.relic.y&&p.relic.x>=s.x+12&&p.relic.x<=s.end-12)){
        const floor=surfaces.filter(s=>s.y===p.relic.y).sort((a,b)=>Math.abs((a.x+a.end)/2-p.relic.x)-Math.abs((b.x+b.end)/2-p.relic.x))[0];
        if(floor)p.relic.x=clamp(p.relic.x,floor.x+15,floor.end-15);
      }
    }
  }
  function gateReady(p=stage){
    const gateX=p.x<100?42:p.width-55;
    const ground=p.surfaces.filter(s=>!s.oneWay&&gateX>=s.x&&gateX<=s.end).at(-1);
    return p.grounded&&ground&&Math.abs(p.y-surfaceY(ground,gateX))<4;
  }
  function enterStage(id,returnTo,checkpoint=40,relicCollected=false) {
    if(!STAGES[id])return;
    mode="stage";zone=null;menu=false;
    api.stopHeroTravel();game.scene="platform";game.phase="campaign";game.mapId=id;game.platform=null;
    game.hasKatana=true;game.enemies=[];game.nodes=[];
    const def=STAGES[id];
    const width=def.classic?1320:2172+(def.arena?.width||0);
    stage={id,returnTo:returnTo||def.returnTo,width,x:clamp(checkpoint,35,width-57),y:def.classic?500:460,
      vx:0,vy:0,facing:1,grounded:true,checkpoint:clamp(checkpoint,35,width-57),
      camera:0,cameraY:0,dropUntil:0,slashSerial:0,surfaces:surfacesFor(id),enemies:[],jumpAge:0,
      arenaStarted:!!def.arena&&checkpoint>=def.arena.start+18&&!progress.captain,
      relicCollected:relicCollected||cleared(id),
      relic:id==="canopy"?{x:1950,y:260,name:"ROAD TOKEN"}:
        id==="harvest"?{x:1900,y:bandY(def,1,0),name:"WAREHOUSE KEY"}:null};
    if(stage.relic&&id==="canopy")stage.relic.y=bandY(def,1,0);
    const arrival=stage.surfaces.find(s=>!s.oneWay&&stage.x>=s.x&&stage.x<=s.end);
    if(arrival)stage.y=surfaceY(arrival,stage.x);
    for(let i=0;i<7;i++){
      const x=240+i*235;
      if(x>width-100)continue;
      const band=def.classic?0:def.three?(i%3===0?bandY(def,Math.floor(x/1086),1):i%3===1?bandY(def,Math.floor(x/1086),0):460):(i%2?bandY(def,Math.floor(x/1086),0):460);
      const floor=stage.surfaces.find(s=>x>=s.x+25&&x<=s.end-25&&s.y===band)||
        stage.surfaces.find(s=>x>=s.x+25&&x<=s.end-25);
      if(floor)stage.enemies.push({...makeFoe(x,surfaceY(floor,x),"raider"),hp:4,maxHp:4,
        variant:i%2,dir:i%2?-1:1,left:Math.max(floor.x+15,x-65),right:Math.min(floor.end-15,x+65),telegraph:0});
    }
    if(def.boss&&!progress.captain)stage.enemies.push({...makeFoe(def.arena?def.arena.start+180:2020,460,"raider"),boss:true,
      hp:24,maxHp:24,variant:2,dir:-1,left:def.arena?def.arena.start+24:1750,right:def.arena?width-24:2120,telegraph:0,state:def.arena&&!stage.arenaStarted?"waiting":"rest",
      stateClock:1.5,attackIndex:0});
    if(def.boss&&progress.captain&&!progress.demon)spawnDemon();
    shots=[];hazards=[];guardian=null;transitionClock=0.5;
    const stageImages=def.classic?[]:["a","b"].map(suffix=>ART+"platformers/"+def.art+"-panel-"+suffix+".png");
    if(def.arena)stageImages.push(ART+"platformers/"+def.arena.art);
    if(def.boss)stageImages.push("assets/characters/cinder-maw-boss-atlas-v1.png","assets/characters/cinder-maw-boss-atlas-right-v1.png","assets/characters/cinder-maw-front-idle-v1.png");
    retainImages(stageImages);
    for(const path of stageImages)image(path);
    setObjective(def.boss?progress.captain&&!progress.demon?"CINDER MAW • climb for floor fire, change tiers for breath, punish its landing":"Cross the storehouse • confront the captain in the tiered courtyard"
      :stage.relic&&!stage.relicCollected?"Recover the "+stage.relic.name.toLowerCase()+" on the upper deck, then reach the exit"
      :"Reach the far exit • clear guards for mon • down + jump drops through decks");
    say("Tap JUMP for a short hop; hold it for a high jump. Hold down + JUMP to drop through a deck.");
    save();
  }
  function jump(kind) {
    if(menu||mode!=="stage"||!stage.grounded)return;
    if(api.movementInput().y>0.45){
      const floor=stage.surfaces.find(s=>stage.x>=s.x&&stage.x<=s.end&&Math.abs(stage.y-s.y)<3);
      if(floor?.oneWay){stage.dropUntil=clock+0.3;stage.y+=3;stage.vy=45;stage.grounded=false;return;}
    }
    stage.vy=-460;stage.grounded=false;stage.jumpAge=0;stage.gestureJump=kind;sfx("jump");
  }
  function land(previousY,nextY,vy,x,drop) {
    if(vy<0)return null;
    return stage.surfaces.filter(s=>x>=s.x&&x<=s.end&&previousY<=surfaceY(s,x)+2&&nextY>=surfaceY(s,x)&&
      !(s.oneWay&&drop)).sort((a,b)=>surfaceY(a,x)-surfaceY(b,x))[0]||null;
  }
  function updateStage(dt) {
    refineStageGeometry();
    const p=stage,h=game.hero,input=api.platformInput(stage);
    if(Math.abs(input.x)>0.05)p.facing=Math.sign(input.x);
    const target=input.x*175,acc=p.grounded?1100:600;
    p.vx+=clamp(target-p.vx,-acc*dt,acc*dt);
    const previousY=p.y;
    const wasGrounded=p.grounded;
    const arena=STAGES[p.id].arena,boss=p.enemies.find(e=>e.boss&&!e.dead);
    const leftBound=arena&&p.arenaStarted&&(boss||p.demonPending>0)?arena.start+15:15;
    p.x=clamp(p.x+p.vx*dt,leftBound,p.width-20);
    if(arena&&!p.arenaStarted&&boss&&p.x>=arena.start+18){
      p.arenaStarted=true;p.checkpoint=arena.start+28;
      boss.state=boss.demon?"emerge":"rest";boss.stateClock=1.6;shots=[];
      setObjective(boss.demon?"CINDER MAW • use the ledges and strike during OPEN":"Captain's courtyard • climb the ledges, evade the warning, strike during OPEN");
      say(boss.demon?"Cinder Maw binds the seal. Climb for floor fire, change tiers for breath, and leave its landing mark.":"The captain seals the courtyard. Use the side ledges; his rush, knives and leap each leave an opening.");
      save();
    }
    if(!p.grounded){p.jumpAge+=dt;
      const held=p.gestureJump==="high"?p.jumpAge<.6:p.gestureJump==="short"?false:api.actionHeld?.()||keys.has(" ");
      if(!held&&p.jumpAge>.09&&p.vy<-190)p.vy=-190;
    }
    p.vy+=800*dt;p.y+=p.vy*dt;p.grounded=false;
    const floor=land(previousY,p.y,p.vy,p.x,clock<p.dropUntil);
    if(floor){p.y=surfaceY(floor,p.x);p.vy=0;p.grounded=true;}
    // Walking along an authored ramp follows it, but empty space never supports us.
    if(!floor&&wasGrounded&&STAGES[p.id].classic){
      const ramp=p.surfaces.find(s=>p.x>=s.x&&p.x<=s.end&&Math.abs(surfaceY(s,p.x)-previousY)<8);
      if(ramp){p.y=surfaceY(ramp,p.x);p.vy=0;p.grounded=true;}
    }
    if(p.y>660){hurt(10);if(h.hp>0)resetCheckpoint();else respawn();return;}
    p.camera=arena&&p.x>=arena.start?arena.start:clamp(p.x-135,0,p.width-W);
    p.cameraY+=(clamp(p.y-330,-160,0)-p.cameraY)*Math.min(1,dt*8);
    for(const e of p.enemies)if(!e.dead){
      e.cooldown=Math.max(0,e.cooldown-dt);
      if(e.boss){if(e.demon)updateDemon(e,dt);else updateCaptain(e,dt);continue;}
      const same=Math.abs(p.y-e.y)<48,dx=p.x-e.x;
      if(e.telegraph>0){
        e.telegraph-=dt;
        if(e.telegraph<=0){if(Math.abs(dx)<47&&same)hurt(10);e.cooldown=1;}
      }else {
        if(Math.abs(dx)<105&&same)e.dir=Math.sign(dx)||e.dir;
        e.x=clamp(e.x+e.dir*30*dt,e.left,e.right);
        if(e.x<=e.left||e.x>=e.right)e.dir*=-1;
        if(same&&Math.abs(dx)<39&&e.cooldown<=0)e.telegraph=journey?.warningTime(.5)??.5;
      }
    }
    for(const e of p.enemies)if(e.demon&&e.dead)e.deathAge=(e.deathAge||0)+dt;
    if(p.demonPending>0){p.demonPending-=dt;if(p.demonPending<=0)spawnDemon();}
    updateShots(dt);
    const item=journey?.pickup(p.id);
    if(item){const floors=p.surfaces.filter(s=>item.x>=s.x&&item.x<=s.end);const ground=floors.find(s=>!s.oneWay)||floors.sort((a,b)=>b.y-a.y)[0];if(ground)journey.collectAt(p.id,p.x,p.y,surfaceY(ground,item.x));}
    if(p.relic&&!p.relicCollected&&Math.abs(p.x-p.relic.x)<28&&Math.abs(p.y-p.relic.y)<32){
      p.relicCollected=true;game.score+=150;sfx("pickup");
      setObjective(p.relic.name+" recovered • reach the far exit");
      say(p.relic.name+" recovered. The route ahead is open.");save();
    }
    if(p.grounded&&p.x>p.checkpoint+400&&p.surfaces.some(s=>!s.oneWay&&p.x>=s.x&&p.x<=s.end&&Math.abs(p.y-surfaceY(s,p.x))<2)){
      p.checkpoint=p.x;save();say("Road marker reached • checkpoint saved.",1.5);
    }
    if(h.hp<=0){respawn();return;}
    // Leaving is a deliberate gate interaction, never an X-only trigger.
  }
  function updateCaptain(b,dt) {
    if(b.state==="waiting")return;
    const arena=STAGES[stage.id].arena;
    b.stateClock-=dt;
    if(b.state==="rest"&&b.stateClock<=0){
      b.dir=Math.sign(stage.x-b.x)||-1;b.attack=b.attackIndex++%(arena?3:2);
      b.target={x:stage.x,y:stage.y};
      b.state="telegraph";b.telegraph=journey?.warningTime(1)??1;b.stateClock=b.telegraph;
      if(arena&&b.attack===2){
        const surfaces=stage.surfaces.filter(s=>s.arena&&s.x+15<=stage.x&&s.end-15>=stage.x&&s.y>=stage.y-15);
        const floor=surfaces.sort((a,c)=>Math.abs(a.y-stage.y)-Math.abs(c.y-stage.y))[0]||stage.surfaces.find(s=>s.arena&&!s.oneWay);
        b.landing={x:clamp(stage.x,floor.x+17,floor.end-17),y:floor.y,left:floor.x+17,right:floor.end-17};
      }
    }else if(b.state==="telegraph"){
      b.telegraph=Math.max(0,b.stateClock);
      if(b.stateClock<=0){
        if(b.attack===0){b.state="rush";b.stateClock=0.75;}
        else if(b.attack===2&&arena){
          b.state="leap";b.stateClock=.8;b.leapFrom={x:b.x,y:b.y};
        }else {
          const angle=arena?Math.atan2(b.target.y-28-(b.y-28),b.target.x-b.x):b.dir<0?Math.PI:0;
          for(let i=-1;i<=1;i++){const a=angle+i*.16;shots.push({x:b.x,y:b.y-28,vx:Math.cos(a)*130,vy:Math.sin(a)*130,t:3,side:true});}
          b.state="recover";b.stateClock=2.6;
        }
      }
    }else if(b.state==="rush"){
      b.x=clamp(b.x+b.dir*245*dt,b.left,b.right);
      if(Math.abs(stage.x-b.x)<35&&Math.abs(stage.y-b.y)<40)hurt(16);
      if(b.stateClock<=0||b.x<=b.left||b.x>=b.right){b.state="recover";b.stateClock=2.8;}
    }else if(b.state==="leap"){
      const t=clamp(1-b.stateClock/.8,0,1);
      b.x=b.leapFrom.x+(b.landing.x-b.leapFrom.x)*t;
      b.y=b.leapFrom.y+(b.landing.y-b.leapFrom.y)*t-Math.sin(t*Math.PI)*80;
      if(Math.abs(stage.x-b.x)<33&&Math.abs(stage.y-b.y)<40)hurt(16);
      if(b.stateClock<=0){
        b.x=b.landing.x;b.y=b.landing.y;b.left=b.landing.left;b.right=b.landing.right;
        b.state="recover";b.stateClock=3;
      }
    }else if(b.state==="recover"&&b.stateClock<=0){b.state="rest";b.stateClock=1;}
  }
  function spawnDemon(){
    if(stage.enemies.some(e=>e.demon&&!e.dead))return;
    const a=STAGES[stage.id].arena;
    stage.arenaStarted=stage.arenaStarted||stage.x>=a.start+18;
    stage.enemies.push({...makeFoe(a.start+180,a.floor,"boss"),demon:true,boss:true,hp:42,maxHp:42,
      state:stage.arenaStarted?"emerge":"waiting",stateClock:1.6,attackIndex:0,dir:-1,deathAge:0,left:a.start+16,right:a.start+a.width-16});
    stage.demonPending=0;if(stage.arenaStarted)stage.checkpoint=a.start+28;
    shots=[];
    image("assets/characters/cinder-maw-boss-atlas-v1.png");
    setObjective("CINDER MAW • climb for floor fire, change tiers for breath, punish its landing");save();
  }
  function updateDemon(b,dt){
    const p=stage,a=STAGES[p.id].arena;
    if(b.state==="waiting")return;
    b.stateClock-=dt;b.flash=Math.max(0,(b.flash||0)-dt);
    b.dir=Math.sign(p.x-b.x)||b.dir;
    if(b.state==="emerge"&&b.stateClock<=0){b.state="rest";b.stateClock=.8;}
    else if(b.state==="rest"&&b.stateClock<=0){
      b.attack=b.attackIndex++%3;b.state="telegraph";
      b.stateClock=journey?.warningTime(b.hp<21?1.2:1.5)??1.5;
      const floors=p.surfaces.filter(s=>s.arena&&p.x>=s.x+12&&p.x<=s.end-12&&s.y>=p.y-8)
        .sort((x,y)=>Math.abs(x.y-p.y)-Math.abs(y.y-p.y));
      const floor=floors[0]||p.surfaces.find(s=>s.arena&&!s.oneWay);
      b.mark={x:clamp(p.x,floor.x+16,floor.end-16),y:floor.y};
    }else if(b.state==="telegraph"&&b.stateClock<=0){
      if(b.attack===0){b.state="burn";b.stateClock=b.hp<21?1.9:1.6;}
      else if(b.attack===1){b.state="sweep";b.stateClock=1.15;}
      else {b.state="dive";b.stateClock=.85;b.from={x:b.x,y:b.y};}
    }else if(b.state==="burn"){
      // Sustained fire outlasts a jump: the lower ledges are the safe ground.
      if(p.y>a.floor-45)hurt(14);
      if(b.stateClock<=0){b.state="recover";b.stateClock=3.3;}
    }else if(b.state==="sweep"){
      if(Math.abs(p.y-b.mark.y)<48)hurt(14);
      if(b.stateClock<=0){b.state="recover";b.stateClock=3.3;}
    }else if(b.state==="dive"){
      const t=clamp(1-b.stateClock/.85,0,1);
      b.x=b.from.x+(b.mark.x-b.from.x)*t;
      b.y=b.from.y+(b.mark.y-b.from.y)*t-Math.sin(t*Math.PI)*115;
      if(b.stateClock<=0){b.x=b.mark.x;b.y=b.mark.y;
        if(Math.abs(p.x-b.x)<45&&Math.abs(p.y-b.y)<48)hurt(18);
        b.state="recover";b.stateClock=3.6;}
    }else if(b.state==="recover"&&b.stateClock<=0){b.state="rest";b.stateClock=.9;}
  }
  function resetCheckpoint() {
    const p=stage;p.x=p.checkpoint;
    const ground=p.surfaces.find(s=>!s.oneWay&&p.x>=s.x&&p.x<=s.end);
    p.y=ground?surfaceY(ground,p.x):460;p.vx=0;p.vy=0;p.grounded=true;p.dropUntil=0;
    game.hero.invulnerable=1.5;api.stopHeroTravel();shots=[];
  }
  function respawn() {
    progress.respawns++;game.mon=Math.max(0,game.mon-1);
    game.hero.hp=game.hero.maxHp;game.hero.invulnerable=2;
    if(mode==="stage"){
      const {id,returnTo,checkpoint,relicCollected}=stage;
      enterStage(id,returnTo,checkpoint,relicCollected);
    }else if(zone==="ward")enterZone("ward",360,790);
    else {
      const arrival={south:[358,170],march:[358,170],woods:[360,820],cedar:[540,450],willow:[535,300]}[zone];
      enterZone(zone,...arrival);
    }
    say("Back at the last safe marker. One mon lost; your journey progress is intact.");
    save();
  }
  function returnFromStage() {
    const to=stage.returnTo,from=stage.id;
    if(to==="south")enterZone("south",from==="storehouse"?160:590,from==="storehouse"?1655:510);
    else if(to==="woods")enterZone("woods",560,250);
    else if(to==="march")enterZone("march",160,1655);
    else enterZone("willow",535,450);
  }
  function completeStage() {
    if(stage.relic&&!stage.relicCollected){
      stage.x=stage.width-85;
      say("Recover the "+stage.relic.name.toLowerCase()+" on the upper deck before leaving.");
      return;
    }
    if(stage.enemies.some(e=>e.boss&&!e.dead)||stage.demonPending>0||stage.id==="storehouse"&&!progress.demon){stage.x=stage.width-85;say("Defeat the captain and Cinder Maw before leaving with the seal.");return;}
    const id=stage.id;
    journey?.notifyStage(id);
    if(!cleared(id)){progress.cleared.push(id);game.mon+=4;game.cedar+=2;game.score+=500;}
    else game.mon+=2;
    game.hero.hp=Math.min(game.hero.maxHp,game.hero.hp+25);
    returnFromStage();objective();save();
    say(id==="harvest"?"Warehouse key recovered. The locked west road can now be opened."
      :id==="canopy"?"Cedar Canopy cleared. The road to Cedar Hamlet is open."
      :id==="storehouse"?"Ward seal recovered. Return to Aya in Cedar Hamlet."
      :"Causeway cleared. Speak to Nao at Willow Ferry.");
  }
  function toggleMenu() {
    if(billing?.paused){billing.close();return;}
    if(storyCards.length)return;
    if(journey?.paused){journey.close();return;}
    if(mapOpen||trailChoice){mapOpen=false;trailChoice=false;return;}
    if(dialogue){dialogue=null;return;}
    if(shop){shop=null;return;}
    if(!game.hero||!["topdown","platform"].includes(game.scene))return;
    menu=!menu;api.stopHeroTravel();api.clearMessage();if(menu)save();
  }
  function pointer(p) {
    if(billing?.pointer(p))return true;
    if(storyCards.length){
      if(p.x>=40&&p.x<=320&&p.y>=540&&p.y<=590){
        storyCardIndex++;if(storyCardIndex>=storyCards.length)finishStory();
      }
      return true;
    }
    if(journey?.pointer(p))return true;
    if(mapOpen){mapOpen=false;return true;}
    if(trailChoice){
      if(p.x>=48&&p.x<=312&&p.y>=260&&p.y<=310){trailChoice=false;enterStage("spirit","woods");}
      else if(p.x>=48&&p.x<=312&&p.y>=325&&p.y<=375){trailChoice=false;enterStage("canopy","woods");}
      else if(p.y>=410)trailChoice=false;
      return true;
    }
    if(dialogue){dialogue=null;return true;}
    if(shop){
      if(p.x>=48&&p.x<=312&&p.y>=292&&p.y<=336)buyShopItem();
      else if(p.x>=48&&p.x<=312&&p.y>=360&&p.y<=404)shop=null;
      return true;
    }
    if(menu){
      if(p.x>=48&&p.x<=312&&p.y>=558&&p.y<=583&&billing&&!billing.full()){billing.open();return true;}
      if(p.x>=48&&p.x<=312&&p.y>=486&&p.y<=522){journey?.openMenu("hub");return true;}
      if(p.y>=268&&p.y<320){toggleMenu();return true;}
      if(p.y>=332&&p.y<385){
        if(mode==="interior")leaveRoom();
        else if(mode==="stage")returnFromStage();
        else if(mode==="zone"&&!MAPS[zone].safe){if(zone==="ward")enterZone("cedar",540,450);else home();}
        else home();
        menu=false;save();return true;
      }
      if(p.y>=398&&p.y<448){save();api.stopHeroTravel();mode=null;stage=null;zone=null;menu=false;game.scene="title";return true;}
      if(p.y>=450&&p.y<=475){menu=false;showDialogue(directions());return true;}
      return true;
    }
    if(p.y>=167&&p.y<=193&&p.x<76){toggleMenu();return true;}
    if(p.y>=167&&p.y<=193&&p.x>=78&&p.x<136){mapOpen=true;api.stopHeroTravel();return true;}
    if(mode==="stage"&&gateReady()&&
      (stage.x<100||stage.x>stage.width-110)&&p.x>=258&&p.y>=402&&p.y<=448){interact();return true;}
    return false;
  }
  function drawMap() {
    const map=MAPS[zone],camera=api.getCamera(),zoom=api.CAMERA_ZOOM;
    ctx.fillStyle="#292d25";ctx.fillRect(0,0,W,H);
    ctx.save();ctx.scale(zoom,zoom);ctx.translate(-camera.x,-camera.y);
    const backdrop=image(map.art);
    if(ready(backdrop))ctx.drawImage(backdrop,0,0,map.w,map.h);
    else {ctx.fillStyle="#615b42";ctx.fillRect(0,0,map.w,map.h);}
    if(ready(api.images.town))for(const s of map.shops||[]){
      if(s.building)ctx.drawImage(api.images.town,...s.building.source,...s.building.target);
    }
    for(const e of map.exits){
      ctx.save();ctx.globalAlpha=distance(game.hero,e)<42?0.25:0.85;
      api.drawDoorPlaque(e.x,e.y,e.locked?.()?"LOCKED":e.label);ctx.restore();
    }
    for(const s of map.shops||[]){ctx.save();ctx.globalAlpha=distance(game.hero,s)<34?0.3:0.9;
      api.drawDoorPlaque(s.x,s.labelY??s.y,s.name);ctx.restore();}
    if(guardian&&!guardian.dead){
      for(const a of hazards){
        ctx.strokeStyle=a.fired?"#f7a45c":"#d75e53";ctx.lineWidth=a.fired?5:2;
        ctx.fillStyle=a.fired?"#db684666":"#f0924422";
        ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,Math.PI*2);ctx.fill();ctx.stroke();
      }
      if(guardian.state==="telegraph"&&guardian.attack===0){
        ctx.strokeStyle="#ed795b";ctx.lineWidth=22;ctx.globalAlpha=0.45;
        ctx.beginPath();ctx.moveTo(guardian.x,guardian.y);ctx.lineTo(guardian.target.x,guardian.target.y);ctx.stroke();ctx.globalAlpha=1;
      }
    }
    const actors=residents.map(n=>({y:n.y,draw:()=>{
      api.drawTownResident(n);
      if(["warden","ferry"].includes(n.service))api.drawDoorPlaque(n.x,n.y-76,n.name.toUpperCase()+" • GUIDE");
    }}));
    for(const e of foes)if(!e.dead)actors.push({y:e.y,draw:()=>{
      api.drawEnemy(e);
      if(e.state==="telegraph")warning(e.x,e.y-48);
    }});
    actors.push({y:game.hero.y,draw:()=>api.drawHero(game.hero)});
    actors.sort((a,b)=>a.y-b.y).forEach(a=>a.draw());
    for(const shot of shots)orb(shot.x,shot.y);
    ctx.restore();
    api.drawHud();api.drawControls();
    if(guardian&&!guardian.dead)bossBar("WARD GUARDIAN",guardian);
    else if(progress.guardian&&zone==="ward"){
      api.panel(42,185,276,47,"#101923ed","#bfa264");
      api.text("THE ROADS ARE FREE",180,202,14,"#f1d886","center",true);
      api.text("Return to the towns • your journey is saved",180,220,8,"#e9dfc8","center");
    }
  }
  function drawRoom(){
    ctx.fillStyle="#17141a";ctx.fillRect(0,0,W,H);
    const backdrop=interior.store.room==="inn"?api.images.inn:api.images.forge;
    if(ready(backdrop))ctx.drawImage(backdrop,0,96,W,540);
    api.drawTownResident({column:interior.store.column??4,variant:interior.store.variant,x:180,y:344,
      facingX:0,facingY:1,walkDistance:0,moving:false});
    api.drawHero(game.hero);api.drawDoorPlaque(180,576,"EXIT TO TOWN");
    api.drawHud();api.drawControls();
  }
  // Reusable blank plaque; labels remain live text, never baked into map art.
  function mapPlaque(x,y,width,height,accent="#827453"){
    ctx.fillStyle="#28342940";ctx.fillRect(x+2,y+2,width,height);
    ctx.fillStyle="#f1e4c8";ctx.fillRect(x,y,width,height);
    ctx.strokeStyle="#756344";ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,width-1,height-1);
    ctx.fillStyle=accent;ctx.fillRect(x+1,y+1,3,height-2);
  }
  function mapText(value,x,y,size=10,align="center",color="#30382c",bold=false){
    ctx.font=`${bold?"600 ":""}${size}px Arial, sans-serif`;
    ctx.textAlign=align;ctx.textBaseline="middle";ctx.fillStyle=color;
    ctx.fillText(value,x,y);
  }
  function mapLeadLines(value,width){
    ctx.font="11px Arial, sans-serif";
    const lines=[];let line="";
    for(const word of value.split(/\s+/)){
      const next=line?line+" "+word:word;
      if(line&&ctx.measureText(next).width>width){lines.push(line);line=word;}else line=next;
    }
    if(line)lines.push(line);
    if(lines.length>3){lines.length=3;while(ctx.measureText(lines[2]+"…").width>width)lines[2]=lines[2].slice(0,-1);lines[2]+="…";}
    return lines;
  }
  function drawRouteMap(){
    ctx.save();ctx.globalAlpha=1;ctx.shadowColor="transparent";
    ctx.fillStyle="#344137c9";ctx.fillRect(0,0,W,H);api.paperPanel(12,90,336,532);
    const art=api.images.japanMap;
    if(art&&ready(art))ctx.drawImage(art,24,142,312,465);
    api.text("NORTHERN HONSHU",180,112,16,"#3b3425","center",true);
    mapText("THE ROAD CHAPTER • NOT TO SCALE",180,132,9.5);
    for(const [from,to,side] of JOURNEY_MAP.edges){
      const a=JOURNEY_MAP.nodes.find(n=>n.id===from),b=JOURNEY_MAP.nodes.find(n=>n.id===to);
      ctx.save();ctx.lineCap="round";
      ctx.strokeStyle="#e3cca2";ctx.lineWidth=side?4:6;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      ctx.strokeStyle=side?"#555f44":"#a44d32";ctx.lineWidth=side?1.5:2.5;
      if(side)ctx.setLineDash([3,3]);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();
    }
    for(const n of JOURNEY_MAP.nodes){
      const here=zone===n.id||(n.id==="home"&&!mode&&game.mapId==="town")||(mode==="stage"&&stage.id===n.id);
      const locked=n.id==="ward"&&(!progress.captain||!progress.demon&&!progress.guardian)||n.id==="storehouse"&&!cleared("harvest")||n.id==="cedar"&&!cleared("canopy")||n.id==="harvest"&&!cleared("causeway");
      const done=cleared(n.id)||n.id==="ward"&&progress.guardian||n.id==="storehouse"&&progress.captain;
      const width=n.id==="ward"?116:96,height=24;
      mapPlaque(n.x-width/2,n.y-height/2,width,height,here?"#b38329":locked?"#9c4a37":done?"#55734d":"#827453");
      mapText(n.label,n.x+1,n.y,9.5,"center",locked?"#853e2d":"#30382c",true);
      if(here){ctx.strokeStyle="#bd8929";ctx.lineWidth=2;ctx.strokeRect(n.x-width/2-2,n.y-height/2-2,width+4,height+4);}
    }
    mapPlaque(78,487,204,22);
    mapText("LANDS BEYOND THIS CHAPTER",180,498,9);
    mapPlaque(24,519,312,78,"#a54c34");
    mapText("YOUR NEXT LEAD",36,533,10,"left","#873d2d",true);
    mapLeadLines(game.objective,286).forEach((line,i)=>mapText(line,36,552+i*14,11,"left"));
    ctx.fillStyle="#eee0c1";ctx.fillRect(24,599,312,17);
    mapText("Gold: you   •   Red: locked   •   Dashed: side trail",180,607,9);
    mapPlaque(98,158,164,24);
    mapText("TAP ANYWHERE TO CLOSE",180,170,9.5,"center","#30382c",true);
    ctx.restore();
  }
  const JOURNEY_MAP={
    nodes:[
      {id:"ward",label:"WARD GUARDIAN",x:180,y:238},
      {id:"cedar",label:"CEDAR HAMLET",x:180,y:270,town:true},
      {id:"woods",label:"CEDAR ROAD",x:180,y:308},
      {id:"home",label:"POST TOWN",x:180,y:345,town:true},
      {id:"south",label:"HIGH ROAD",x:180,y:382},
      {id:"willow",label:"WILLOW FERRY",x:180,y:419,town:true},
      {id:"march",label:"RIVER MARCH",x:180,y:456},
      {id:"spirit",label:"SPIRIT PATH",x:77,y:308},
      {id:"canopy",label:"CEDAR CANOPY",x:283,y:308},
      {id:"storehouse",label:"CAPTAIN",x:77,y:382},
      {id:"causeway",label:"CAUSEWAY",x:283,y:382},
      {id:"harvest",label:"HARVEST",x:77,y:456}
    ],
    edges:[["ward","cedar"],["cedar","woods"],["woods","home"],["home","south"],["south","willow"],["willow","march"],
      ["woods","spirit",true],["woods","canopy",true],["south","storehouse",true],["south","causeway",true],["march","harvest",true]]
  };
  function drawCaptainArena(def){
    const a=def.arena;if(!a)return;
    // Cover the whole moving viewport even while the image is loading.
    ctx.fillStyle="#1c1712";ctx.fillRect(a.start,-180,a.width,H+180);
    const backdrop=image(ART+"platformers/"+a.art);
    // Background floor line is at 78.5% of the source; it shares the y460
    // collision plane. Decorative floor depth below it is never walkable air.
    if(ready(backdrop)){
      const floorLine=Math.round(backdrop.naturalHeight*.785);
      // Fill above the highest camera position as well as below the floor;
      // upper shelves must never expose the unrelated outdoor backdrop.
      ctx.drawImage(backdrop,0,0,backdrop.naturalWidth,floorLine,a.start,-180,a.width,640);
      ctx.drawImage(backdrop,0,floorLine,backdrop.naturalWidth,backdrop.naturalHeight-floorLine,a.start,a.floor,a.width,98);
    }
    const planks=image(ART+"platformers/"+def.art+"-panel-b.png");
    if(ready(planks))for(const s of stage.surfaces.filter(s=>s.arena&&s.oneWay)){
      ctx.save();ctx.globalAlpha=.65;
      // Cut real storehouse timber from the existing atlas, including braces;
      // supports sit behind the player and lead visually down to the floor.
      for(const x of [s.x+8,s.end-15])ctx.drawImage(planks,18,390,18,110,x,s.y+8,7,a.floor-s.y-8);
      ctx.restore();
      ctx.drawImage(planks,610,385,190,66,s.x,s.y,s.end-s.x,23);
      ctx.fillStyle="#c39b63";ctx.fillRect(s.x,s.y,s.end-s.x,1);
    }
    const boss=stage.enemies.find(e=>e.boss&&!e.dead);
    if(boss?.demon)drawDemonDanger(boss);
    if(stage.arenaStarted&&boss&&!boss.demon){
      if(ready(planks))ctx.drawImage(planks,18,390,18,110,a.start+5,342,9,118);
      if(boss.state==="telegraph"&&boss.attack===2&&boss.landing){
        const t=boss.landing;ctx.strokeStyle="#f6c071";ctx.lineWidth=2;
        ctx.beginPath();ctx.ellipse(t.x,t.y-2,25,6,0,0,Math.PI*2);ctx.stroke();
        api.text("LEAP",t.x,t.y-15,8,"#ffe3a6","center",true);
      }
      if(boss.state==="telegraph"&&boss.attack===1){
        ctx.save();ctx.globalAlpha=.5;ctx.strokeStyle="#f0c46f";ctx.setLineDash([4,4]);ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(boss.x,boss.y-28);ctx.lineTo(boss.target.x,boss.target.y-28);ctx.stroke();ctx.restore();
      }
    }
  }
  function drawDemonDanger(b){
    const a=STAGES[stage.id].arena,warning=b.state==="telegraph";
    if((warning&&b.attack===0)||b.state==="burn"){
      ctx.fillStyle=warning?"#efb24655":"#ed4b2088";ctx.fillRect(a.start,a.floor-45,a.width,45);
      for(let x=a.start+8;x<a.start+a.width;x+=18){ctx.fillStyle=warning?"#f2cf84":"#ffb449";ctx.fillRect(x,a.floor-(warning?5:12+Math.sin(clock*15+x)*6),8,6);}
    }
    if((warning&&b.attack===1)||b.state==="sweep"){
      ctx.fillStyle=warning?"#f5b95555":"#ed6426bb";ctx.fillRect(a.start,b.mark.y-45,a.width,45);
      api.text(warning?"CHANGE TIER":"FIRE BREATH",a.start+180,b.mark.y-50,9,"#ffe3a6","center",true);
    }
    if((warning&&b.attack===2)||b.state==="dive"){
      ctx.strokeStyle="#ffd275";ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(b.mark.x,b.mark.y-2,45,7,0,0,Math.PI*2);ctx.stroke();
      api.text("MOVE OFF THE MARK",b.mark.x,b.mark.y-18,8,"#ffe3a6","center",true);
    }
  }
  function drawDemon(b){
    const sheet=image("assets/characters/cinder-maw-boss-atlas-v1.png");if(!ready(sheet))return;
    if(!b.dead&&["emerge","rest","waiting"].includes(b.state)){
      const front=image("assets/characters/cinder-maw-front-idle-v1.png");
      if(ready(front)){
        if(!demonFrontSpec){
          const scan=document.createElement('canvas');scan.width=front.naturalWidth;scan.height=front.naturalHeight;
          const paint=scan.getContext('2d',{willReadFrequently:true});paint.drawImage(front,0,0);
          const data=paint.getImageData(0,0,scan.width,scan.height).data;
          let minX=scan.width,maxX=0,minY=scan.height,maxY=0;
          for(let y=0;y<scan.height;y++)for(let x=0;x<scan.width;x++)if(data[(y*scan.width+x)*4+3]>128){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
          demonFrontSpec={x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1};
        }
        const r=demonFrontSpec,scale=88/r.h;
        api.drawGroundShadow(b.x,b.y,19,.35);
        ctx.drawImage(front,r.x,r.y,r.w,r.h,b.x-r.w*scale/2,b.y-88,r.w*scale,88);return;
      }
    }
    let cell=b.dead?11:b.flash>0?10:b.state==="recover"?8+Math.floor(clock*4)%2:
      b.state==="telegraph"?[2,4,6][b.attack]:b.state==="burn"?3:b.state==="sweep"?5:b.state==="dive"?7:b.state==="emerge"?6:Math.floor(clock*3)%2;
    // Explicit source rectangles keep oversized wind-up/fire poses intact.
    // One fixed scale and authored foot anchors avoid per-frame size pumping.
    const frames=[
      [0,0,360,393,175,378],[360,0,345,393,550,378],[705,0,361,393,900,378],[1066,0,382,393,1260,389],
      [0,393,330,366,175,732],[330,393,409,366,565,742],[739,393,327,366,900,747],[1066,393,382,366,1260,742],
      [0,759,360,327,180,1056],[360,759,345,327,550,1056],[705,759,361,327,900,1056],[1066,759,382,327,1260,1056]
    ];
    if(!demonFeet){
      const scan=document.createElement('canvas');scan.width=sheet.naturalWidth;scan.height=sheet.naturalHeight;
      const paint=scan.getContext('2d',{willReadFrequently:true});paint.drawImage(sheet,0,0);
      const data=paint.getImageData(0,0,scan.width,scan.height).data;
      demonFeet=frames.map(([sx,sy,sw,sh,ax,ay])=>{
        for(let y=sy+sh-1;y>sy+sh*.5;y--){let count=0;
          for(let x=Math.max(sx,ax-110);x<Math.min(sx+sw,ax+110);x++)if(data[(y*scan.width+x)*4+3]>128)count++;
          if(count>=10)return y+1;
        }return ay;
      });
    }
    const [sx,sy,sw,sh,ax]=frames[cell],ay=demonFeet[cell],scale=.32;
    const right=image("assets/characters/cinder-maw-boss-atlas-right-v1.png");
    const mirrored=b.dir>0&&ready(right);
    ctx.save();ctx.translate(b.x,b.y);if(b.dir>0&&!mirrored)ctx.scale(-1,1);
    if(b.dead)ctx.globalAlpha=Math.max(0,1-b.deathAge/1.2);
    const sourceX=mirrored?sheet.naturalWidth-sx-sw:sx,anchorX=mirrored?sheet.naturalWidth-ax:ax;
    ctx.drawImage(mirrored?right:sheet,sourceX,sy,sw,sh,(sourceX-anchorX)*scale,(sy-ay)*scale,sw*scale,sh*scale);ctx.restore();
  }
  function drawStage() {
    const def=STAGES[stage.id];
    ctx.fillStyle="#141b25";ctx.fillRect(0,0,W,H);
    const backdrop=api.images.backdrop;
    if(ready(backdrop)){
      const start=-(stage.camera*.18)%W;
      for(let tile=-1;tile<3;tile++)ctx.drawImage(backdrop,start+tile*W,0,W,H);
    }
    ctx.fillStyle="#0c13254d";ctx.fillRect(0,160,W,480);
    ctx.save();ctx.translate(-stage.camera,-stage.cameraY);
    if(def.classic){for(const segment of api.spiritSegments)api.drawSpiritTerrainSegment(segment);}
    else for(let p=0;p<2;p++){
      const art=image(ART+"platformers/"+def.art+"-panel-"+(p?"b":"a")+".png");
      if(!ready(art))continue;
      // One image transform, also used by bandY: never cut gates/supports into
      // independently raised strips. Landing heights now match authored pixels.
      ctx.drawImage(art,p*1086,460-def.bands[p].at(-1)/2,1086,362);
    }
    if(def.arena)drawCaptainArena(def);
    for(const e of stage.enemies)if(!e.dead||e.demon&&e.deathAge<1.2){
      if(e.demon)drawDemon(e);else api.drawPlatformBandit(e.x,e.y,e.boss,e);
      if(e.boss&&e.state==="recover")api.text("OPEN",e.x,e.y-80,9,"#9fe6c3","center",true);
    }
    if(stage.relic&&!stage.relicCollected){
      const r=stage.relic;
      ctx.strokeStyle="#f5d77b";ctx.lineWidth=2;ctx.fillStyle="#b58c37";
      ctx.beginPath();ctx.arc(r.x,r.y-18,11,0,Math.PI*2);ctx.fill();ctx.stroke();
      api.text(r.name,r.x,r.y-40,8,"#ffe9ab","center",true);
    }
    const p=stage;
    const item=journey?.pickup(p.id);
    if(item){const floors=p.surfaces.filter(s=>item.x>=s.x&&item.x<=s.end);const ground=floors.find(s=>!s.oneWay)||floors.sort((a,b)=>b.y-a.y)[0];if(ground)journey.drawWorldPickup(p.id,0,0,surfaceY(ground,item.x));}
    if(!(game.hero.invulnerable>0&&Math.floor(clock*14)%2)){
      if(p.grounded)api.drawGroundShadow(p.x,p.y,13,0.4);
      if(!(game.hero.attackFx<=0&&Math.abs(p.vx)>8&&p.grounded&&api.drawHeroRun?.(p.facing<0?1:2,p.x,p.y,Math.floor(clock*10)%4)))
        api.drawHeroCell(game.hero.attackFx>0?3:Math.abs(p.vx)>8?1:0,3,p.x,p.y,68,p.facing<0);
    }
    if(game.hero.attackFx>0){
      const weapon=journey?.weapon();ctx.strokeStyle=weapon?.color||"#ffe9b2";ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(p.x+p.facing*22,p.y-25,(weapon?.reach??58)/2,-1.2,1.2);ctx.stroke();
    }
    for(const shot of shots)orb(shot.x,shot.y);
    const entry=stage.surfaces.find(s=>!s.oneWay&&42>=s.x&&42<=s.end),exit=stage.surfaces.find(s=>!s.oneWay&&stage.width-55>=s.x&&stage.width-55<=s.end);
    api.drawDoorPlaque(42,(entry?surfaceY(entry,42):460)-20,"RETURN");
    api.drawDoorPlaque(stage.width-55,(exit?surfaceY(exit,stage.width-55):460)-20,"EXIT");
    ctx.restore();api.drawHud();api.drawControls();
    if(gateReady()&&(stage.x<100||stage.x>stage.width-110)){
      api.panel(258,402,90,46,"#172829f5","#d4ad63");
      api.text(stage.x<100?"RETURN":"EXIT",303,425,11,"#ffe7ae","center",true);
    }
    const boss=stage.enemies.find(e=>e.boss&&!e.dead);
    if(boss&&Math.abs(stage.x-boss.x)<430){
      bossBar(boss.demon?"CINDER MAW":"BANDIT CAPTAIN",boss);
      if(boss.state==="telegraph")api.text((boss.demon?["CLIMB — FLOOR FIRE","CHANGE TIER — FIRE BREATH","DIVE — LEAVE THE MARK"]:["RUSH — CLIMB OR JUMP","KNIVES — KEEP MOVING","LEAP — LEAVE THE MARK"])[boss.attack],180,214,9,"#ffe0a4","center",true);
      else if(boss.state==="recover")api.text("OPEN — STRIKE NOW",180,214,9,"#a4e2b8","center",true);
    }
    else api.text("DOWN + JUMP: DROP THROUGH",180,181,8,"#f2dfbb","center",true);
  }
  function warning(x,y) {api.text("!",x,y,21,"#ffd38a","center",true);}
  function orb(x,y) {ctx.fillStyle="#f3c65e";ctx.strokeStyle="#713b36";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();ctx.stroke();}
  function bossBar(name,boss) {
    api.panel(83,169,265,31,"#10141dec","#c9a061");
    api.text(name,215,178,8,"#f2dab2","center",true);
    ctx.fillStyle="#4c2831";ctx.fillRect(96,188,239,5);
    ctx.fillStyle=boss.state==="recover"?"#8bd2b5":"#d66057";
    ctx.fillRect(96,188,239*clamp(boss.hp/boss.maxHp,0,1),5);
  }
  function drawTitle() {
    if(game.scene!=="title")return;
    api.panel(73,500,214,35,"#10141af5","#b68c48");
    api.text(readSave()?"CONTINUE JOURNEY":roadChapter?"BEGIN ROAD CHAPTER":"BEGIN JOURNEY",180,517,14,"#fff1cc","center",true);
    if(campaignEdition)api.text("EXPANDED CAMPAIGN • ANDROID "+window.BELL_BUILD.version,180,543,8,"#9dd9ce","center",true);
    api.panel(85,557,190,29,"#10141af0","#826d50");
    api.text(newGameArmed?"TAP AGAIN: NEW JOURNEY":"NEW JOURNEY",180,572,10,"#d6c4a6","center",true);
    api.panel(85,596,190,27,"#10141af0","#826d50");
    api.text("PLAY ORIGINAL OPENING",180,609,9,"#e9d9be","center",true);
  }
  function drawOverlay() {
    if(billing?.draw())return;
    if(storyCards.length){
      ctx.save();ctx.fillStyle="#101a20df";ctx.fillRect(0,0,W,H);api.paperPanel(20,122,320,482);
      const card=storyCards[storyCardIndex];
      mapText(card.title,180,166,17,"center","#413525",true);
      ctx.font="12px Arial, sans-serif";
      let line="",lines=[];
      for(const paragraph of card.text.split("\n")){
        for(const word of paragraph.split(/\s+/)){const next=line?line+" "+word:word;if(line&&ctx.measureText(next).width>266){lines.push(line);line=word;}else line=next;}
        if(line)lines.push(line);line="";
      }
      lines.forEach((text,i)=>mapText(text,46,220+i*21,12,"left"));
      mapText((storyCardIndex+1)+" / "+storyCards.length,180,512,10);
      api.menuButton(40,540,280,44,true);mapText(storyCardIndex===storyCards.length-1?"CONTINUE JOURNEY":"NEXT",180,562,12,"center","#f5e6c9",true);
      ctx.restore();return;
    }
    if(journey?.draw())return;
    if(game.scene==="title")return;
    if(game.scene==="outcome"&&game.outcome==="victory"){
      api.panel(26,559,308,53,"#101821f5","#d3ad61");
      api.text("CONTINUE THE JOURNEY",180,579,15,"#ffe4a5","center",true);
      api.text("Post Town's bell is only the beginning",180,599,9,"#e3d4ba","center");
      return;
    }
    if(!["topdown","platform"].includes(game.scene))return;
    api.panel(9,169,63,23,"#101821ef","#bc9654");
    api.text("JOURNAL",40,180,8,"#f2deb5","center",true);
    api.panel(79,169,51,23,"#101821ef","#bc9654");api.text("MAP",104,180,8,"#f2deb5","center",true);
    if(storageFailed)api.text("SAVE UNAVAILABLE",180,625,8,"#f6b5a0","center",true);
    if(!mode&&progress.prologue&&game.mapId==="town"&&game.phase==="campaign_home"){
      ctx.save();ctx.scale(api.CAMERA_ZOOM,api.CAMERA_ZOOM);
      const c=api.getCamera();ctx.translate(-c.x,-c.y);
      api.drawDoorPlaque(540,990,"SOUTH ROAD");
      api.drawDoorPlaque(540,665,"CEDAR ROAD");ctx.restore();
    }
    if(dialogue){
      ctx.fillStyle="#050911a0";ctx.fillRect(0,0,W,H);
      api.paperPanel(22,218,316,234);
      api.text("A WORD ON THE ROAD",180,240,10,"#8b4731","center",true);
      api.wrappedText(dialogue,180,268,272,18,10,"#3c3023",8);
      api.text("TAP TO CONTINUE",180,430,9,"#586044","center",true);return;
    }
    if(trailChoice){
      ctx.fillStyle="#050911dc";ctx.fillRect(0,0,W,H);api.paperPanel(24,170,312,310);
      api.text("SHRINE TRAILS",180,204,18,"#3f3020","center",true);
      api.text("Both trails return to Cedar Road",180,231,9,"#64533c","center");
      for(const [y,label] of [[260,"FOREST SPIRIT PATH — ORIGINAL"],[325,"CEDAR CANOPY — NORTHERN KEY"],[410,"BACK TO ROAD"]]){
        api.menuButton(48,y,264,44,y===325);api.text(label,180,y+22,10,"#f5e6c9","center",true);
      }return;
    }
    if(mapOpen){drawRouteMap();return;}
    if(shop){drawShop();return;}
    if(!menu)return;
    ctx.fillStyle="#050911dc";ctx.fillRect(0,0,W,H);
    api.paperPanel(24,109,312,492);
    api.text(progress.guardian?"THE ROADS ARE FREE":"JOURNEY JOURNAL",180,140,18,"#382a1e","center",true);
    api.text("CURRENT LEAD",180,168,8,"#8b4731","center",true);
    api.wrappedText(game.objective,180,189,258,17,11,"#443725",3);
    api.text("ROUTES "+progress.cleared.length+"/5  •  "+(progress.phase%2?"DUSK":"DAY"),180,246,10,"#576044","center",true);
    for(const [y,label] of [[270,"RESUME"],[334,mode==="stage"?"RETREAT TO ROAD":"RETURN TO SAFETY"],[400,"SAVE AND TITLE"]]){
      api.menuButton(48,y,264,43,y===270);api.text(label,180,y+22,12,"#f5e6c9","center",true);
    }
    api.text("DIRECTIONS / CONTROLS",180,462,10,"#884631","center",true);
    api.menuButton(48,486,264,36);mapText("JOURNEY KIT",180,504,12,"center","#f5e6c9",true);
    api.text("Weapons • Side quests • Town travel • Assist",180,536,9,"#504732","center");
    api.text("Tap terrain to travel • tap Yusuke to slash",180,552,8,"#504732","center");
    api.text(storageFailed?"SAVE FAILED — keep this game open":"Progress saves at gates and during play",180,568,8,storageFailed?"#9c3929":"#6b5c44","center");
    if(billing&&!billing.full()){api.menuButton(48,558,264,25);mapText("FULL GAME / RESTORE PURCHASES",180,571,10,"center","#f5e6c9",true);}
    api.text("BUILD "+(window.BELL_BUILD?.version||document.querySelector?.('meta[name="bell-build"]')?.content||"local"),180,586,7,"#5c5e43","center");
  }
  function prologueOutcome(result) {
    if(result!=="victory")return;
    progress.prologue=true;
    // Store a safe campaign arrival, never an outcome screen or dead actor.
    const prior=game.scene;game.scene="topdown";const phase=game.phase;
    game.phase="campaign_home";game.mapId="town";game.enemies=[];game.nodes=[];
    game.hero.x=540;game.hero.y=880;game.hero.hp=game.hero.maxHp;
    save();game.scene=prior;game.phase=phase;
  }
  return {
    get platformActor(){return mode==="stage"?stage:null;},
    get active(){return mode!==null;},
    get paused(){return menu||!!shop||!!dialogue||mapOpen||trailChoice||storyCards.length>0||!!journey?.paused||!!billing?.paused;},
    get weaponProfile(){return progress.prologue?journey?.weapon():null;},
    damageTaken:amount=>progress.prologue?(journey?.damageTaken(amount)??amount):amount,
    get storyOpening(){return !!openingReplay;},
    get title(){return mode==="interior"?interior.store.name:mode==="stage"?STAGES[stage.id].name:mode==="zone"?MAPS[zone].name:
      progress.prologue&&game.phase==="campaign_home"?"POST TOWN":null;},
    get safe(){return mode==="interior"||(mode==="zone"&&MAPS[zone].safe)||
      (!mode&&progress.prologue&&game.phase==="campaign_home");},
    startFromTitle,prologueOutcome,tick,update,saveSession:save,draw:()=>mode==="stage"?drawStage():mode==="interior"?drawRoom():drawMap(),
    context,interact,attack,jump,pointer,toggleMenu,drawTitle,drawOverlay,
    // Readable level data also powers deterministic regression checks.
    debug:{journey,hurt,damageEnemy,updateGuardian,beginStory,get storyCards(){return storyCards.length?storyCards:null;},MAPS,STAGES,surfacesFor,land,enterZone,enterStage,save,readSave,resume,
      runtimeCounts:()=>({foes:foes.length,shots:shots.length,hazards:hazards.length,images:cache.size}),
      get progress(){return progress;},get stage(){return stage;},get foes(){return foes;},
      get guardian(){return guardian;},get residents(){return residents;},
      get mode(){return mode;},home,completeStage,travel,respawn,walkable,talk,buyShopItem,bandY,gateReady,enterRoom,leaveRoom,beginOpening,directions,surfaceY,JOURNEY_MAP,
      get shop(){return shop;}}
  };
};
