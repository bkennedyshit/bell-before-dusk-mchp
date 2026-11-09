const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const sandbox = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,"..","campaign-story.js"),"utf8"),sandbox);
const story = sandbox.window.BELL_STORY;
let count=0;
function check(label,fn){fn();count++;console.log("PASS "+label);}
check("Legacy progress resolves the first actual road lead",()=>{
  assert.equal(story.chapter({}),"canopy");
  assert.match(story.objective({}),/Cedar Canopy/);
  assert.match(story.directions({}),/optional trail/);
});
check("Every main-story checkpoint has the correct next destination",()=>{
  for(const [p,state,fragment] of [
    [{cleared:["canopy"]},"south","Flooded Causeway"],
    [{cleared:["canopy","causeway"]},"harvest","Harvest Trail"],
    [{cleared:["harvest"]},"captain","Bandit Storehouse"],
    [{captain:true},"ward","Broken Ward"],
    [{guardian:true},"restored","revisit"]
  ]){
    assert.equal(story.chapter(p),state);
    assert.match(story.objective(p),new RegExp(fragment,"i"));
  }
});
check("Future extensions are never presented as required playable roads",()=>{
  assert.match(story.directions({cleared:["causeway"]}),/not part of this journey/);
  assert.match(story.directions({guardian:true}),/outside this chapter/);
});
check("Causeway gives an exit objective and the bound seal points back to the demon",()=>{
  const crossing=story.directions({cleared:['canopy']});assert.match(crossing,/Cross the EAST Flooded Causeway/);assert.ok(!/recover.*cargo marker/i.test(crossing));
  const progress={captain:true,demon:false};assert.equal(story.chapter(progress),'demon');
  assert.match(story.npc({name:'Aya',service:'warden'},progress),/Cinder Maw/);
  assert.match(story.directions(progress),/storehouse/i);
  assert.equal(story.chapter({captain:true,demon:true}),'ward');
});
check("NPC narrative does not mutate progression or replace the shops",()=>{
  const progress={cleared:["canopy"],quests:["ferry"],captain:false};
  const before=JSON.stringify(progress);
  assert.match(story.npc({name:"Aya",service:"warden"},progress),/captain/i);
  assert.equal(story.npc({name:"Takeshi",service:"steel"},progress),null);
  assert.equal(story.npc({name:"Riku",service:"supplies"},progress),null);
  assert.equal(JSON.stringify(progress),before);
});
check("Restoration changes the townspeople's responses",()=>{
  assert.match(story.npc({name:"Aya",service:"warden"},{guardian:true}),/Families/);
  assert.match(story.npc({name:"Nao",service:"ferry"},{guardian:true}),/first boat/);
  assert.match(story.npc({name:"Mina",service:"local"},{guardian:true}),/sister/);
});
check("Story cards fit concise mobile presentation and credits make no fake attribution",()=>{
  assert.equal(story.title,"Bell Before Dusk");
  assert.equal(story.introduction.length,3);assert.equal(story.epilogue.length,3);
  for(const page of [...story.introduction,...story.epilogue]){
    assert.ok(page.title.length<=28);
    assert.ok(page.text.split(/\s+/).length<=55);
  }
  assert.ok(story.credits.some(line=>line.includes("AI-generated")));
  assert.ok(Object.isFrozen(story.epilogue));
});
console.log(`PASS ${count} narrative checks`);
