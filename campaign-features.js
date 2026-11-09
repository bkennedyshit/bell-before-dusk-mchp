/* Optional journey systems. No network, billing or changes to the save schema. */
window.createBellJourneyFeatures = function createBellJourneyFeatures(api) {
  "use strict";
  const WEAPONS = Object.freeze({
    katana: Object.freeze({id:"katana",name:"Courier Katana",damage:1,reach:52,cooldown:.32,color:"#e8d7ac",description:"Balanced reach, speed and damage. Your trusted road blade."}),
    tanto: Object.freeze({id:"tanto",name:"River Tanto",damage:.8,reach:38,cooldown:.22,color:"#b8d9d0",description:"Short reach and lighter hits, but a quicker follow-up. Earned from Shin's missing tackle."}),
    longblade: Object.freeze({id:"longblade",name:"Warden Longblade",damage:1.3,reach:72,cooldown:.52,color:"#e0b978",description:"Long reach and stronger hits. The longer recovery rewards careful timing. Earned from Takeshi's tool."})
  });
  const QUESTS = Object.freeze({
    tackle: Object.freeze({id:"tackle",name:"The Missing Tackle",giver:"Shin",stage:"spirit",stageName:"Forest Spirit Path",x:900,reward:8,weapon:"tanto",
      request:"Shin's tackle was taken onto Forest Spirit Path, the optional trail beside Cedar Canopy. Find the wrapped tackle and bring it back. The main road does not depend on this errand.",
      recovered:"You recovered Shin's tackle. Return it here for 8 mon and the River Tanto."}),
    tool: Object.freeze({id:"tool",name:"The Smith's Lost Tool",giver:"Takeshi",stage:"causeway",stageName:"Flooded Causeway",x:1450,reward:10,weapon:"longblade",
      request:"Bandits dropped Takeshi's steel-working tool along Flooded Causeway. Recover the tool and bring it back. The reward is a longer blade, not a key to the main quest.",
      recovered:"You recovered Takeshi's tool. Return it here for 10 mon and the Warden Longblade."})
  });
  const TOWNS = Object.freeze([{id:"home",name:"Post Town"},{id:"cedar",name:"Cedar Hamlet"},{id:"willow",name:"Willow Ferry"}]);
  const owns=(object,key)=>typeof key==="string"&&Object.prototype.hasOwnProperty.call(object,key);
  let page=null,questPage=null,returnPage="quests",notice="",questNPC=null;
  function normalize(progress=api.getProgress()) {
    if(!progress.journey||typeof progress.journey!=="object"||Array.isArray(progress.journey))progress.journey={};
    const state=progress.journey;
    state.difficulty=state.difficulty==="assist"?"assist":"normal";
    state.unlocked=Array.isArray(state.unlocked)?[...new Set(["katana",...state.unlocked.filter(id=>owns(WEAPONS,id))])]:["katana"];
    state.questStates=state.questStates&&typeof state.questStates==="object"&&!Array.isArray(state.questStates)?state.questStates:{};
    for(const id of Object.keys(QUESTS)){
      if(!["available","accepted","recovered","claimed"].includes(state.questStates[id]))state.questStates[id]="available";
      if(state.questStates[id]==="claimed"&&!state.unlocked.includes(QUESTS[id].weapon))state.unlocked.push(QUESTS[id].weapon);
    }
    state.weapon=state.unlocked.includes(state.weapon)?state.weapon:"katana";
    return state;
  }
  const state=()=>normalize();
  function persist(){api.save?.();}
  function location(){return api.getLocation?.()||{safe:false,town:null};}
  const visited=()=>Array.isArray(api.getProgress().visited)?api.getProgress().visited:[];
  function discovered(){const p=api.getProgress();return TOWNS.filter(t=>t.id==="home"?p.prologue:visited().includes(t.id));}
  function travelAvailable(){const l=location();return !!(l.safe&&l.town&&!l.stage&&TOWNS.some(t=>t.id===l.town)&&visited().includes("willow"));}
  function weapon(){return WEAPONS[state().weapon];}
  function equip(id){const s=state();if(!owns(WEAPONS,id)||!s.unlocked.includes(id))return false;s.weapon=id;notice=WEAPONS[id].name+" equipped.";persist();return true;}
  function setDifficulty(value){if(!["normal","assist"].includes(value))return false;state().difficulty=value;notice=value==="assist"?"Assist enabled. Movement and jumping are unchanged.":"Normal difficulty enabled.";persist();return true;}
  function acceptQuest(id){const q=QUESTS[id],s=state();if(!q||s.questStates[id]!=="available")return false;s.questStates[id]="accepted";notice=q.name+" accepted.";persist();return true;}
  function recoverQuest(id){const q=QUESTS[id],s=state();if(!q||s.questStates[id]!=="accepted")return false;s.questStates[id]="recovered";notice=q.name+": item recovered. Return to "+q.giver+".";api.say?.(notice);persist();return true;}
  function claimQuest(id){const q=QUESTS[id],s=state(),l=location();if(!q||s.questStates[id]!=="recovered"||!l.safe||l.town!=="cedar")return false;s.questStates[id]="claimed";if(!s.unlocked.includes(q.weapon))s.unlocked.push(q.weapon);if(api.game)api.game.mon+=q.reward;notice=q.giver+" thanks you. +"+q.reward+" mon; "+WEAPONS[q.weapon].name+" unlocked.";api.say?.(notice);persist();return true;}
  function npcQuest(npc){if(!npc)return null;if(npc.service==="steel"||npc.name==="Takeshi")return "tool";if(npc.name==="Shin"||npc.role==="FISHERMAN"&&npc.service!=="ferry")return "tackle";return null;}
  function npcTalk(npc){const id=npcQuest(npc);if(!id||!["available","recovered"].includes(state().questStates[id]))return false;openQuest(id,"npc");questNPC=npc;return true;}
  function openQuest(id,from="quests"){if(!QUESTS[id])return false;questPage=id;returnPage=from;page="quest";notice="";api.stopHeroTravel?.();return true;}
  function collectAt(stageId,x,y,floorY){
    const q=Object.values(QUESTS).find(q=>q.stage===stageId&&state().questStates[q.id]==="accepted");
    if(!q||Math.abs(x-q.x)>30)return false;
    if(Number.isFinite(floorY)&&Number.isFinite(y)&&Math.abs(y-floorY)>42)return false;
    return recoverQuest(q.id);
  }
  function notifyStage(stageId){for(const q of Object.values(QUESTS))if(q.stage===stageId)recoverQuest(q.id);}
  function pickup(stageId){const q=Object.values(QUESTS).find(q=>q.stage===stageId&&state().questStates[q.id]==="accepted");return q?{id:q.id,x:q.x,name:q.id==="tackle"?"SHIN'S TACKLE":"TAKESHI'S TOOL"}:null;}
  function drawWorldPickup(stageId,xOrCamera=0,yOrCamera=0,floorY){
    const item=pickup(stageId);if(!item||!api.ctx)return;
    // Intended inside the stage's world transform. Parent supplies the actual
    // reachable floor baseline, keeping marker art and collision in agreement.
    const x=item.x,y=Number.isFinite(floorY)?floorY:460,c=api.ctx;
    c.save();c.fillStyle="#18291c";c.fillRect(x-10,y-22,20,18);c.strokeStyle="#dfc891";c.lineWidth=2;c.strokeRect(x-10,y-22,20,18);
    c.strokeStyle="#d2ae68";c.beginPath();c.moveTo(x-10,y-14);c.lineTo(x+10,y-14);c.moveTo(x,y-22);c.lineTo(x,y-4);c.stroke();
    c.fillStyle="#f0d88b";c.beginPath();c.moveTo(x,y-29);c.lineTo(x-4,y-34);c.lineTo(x,y-39);c.lineTo(x+4,y-34);c.closePath();c.fill();c.restore();
  }
  function openMenu(kind="hub"){page=({equipment:"weapons",loadout:"weapons",difficulty:"settings",fastTravel:"travel"})[kind]||kind;if(!["hub","weapons","quests","travel","settings"].includes(page))page="hub";notice="";api.stopHeroTravel?.();return true;}
  function close(){page=null;questPage=null;notice="";}
  function travel(id){
    if(!travelAvailable()||!discovered().some(t=>t.id===id)||id===location().town)return false;
    close();api.stopHeroTravel?.();api.travelToTown?.(id);persist();return true;
  }
  function back(){if(page==="hub")close();else if(page==="quest"){if(returnPage==="npc"){const npc=questNPC;questNPC=null;close();if(npc?.service==="steel")api.openTrade?.(npc);}else page="quests";}else page="hub";}
  const inside=(p,y,h=44)=>p.x>=40&&p.x<=320&&p.y>=y&&p.y<=y+h;
  function pointer(p){
    if(!page)return false;
    if(inside(p,557,36)){back();return true;}
    if(page==="hub"){
      const index=[210,275,340,405].findIndex(y=>inside(p,y));
      if(index>=0)openMenu(["weapons","quests","travel","settings"][index]);
    }else if(page==="weapons"){
      Object.values(WEAPONS).forEach((w,i)=>{if(inside(p,201+i*102,86))equip(w.id);});
    }else if(page==="quests"){
      Object.values(QUESTS).forEach((q,i)=>{if(inside(p,205+i*135,112))openQuest(q.id);});
    }else if(page==="quest"){
      if(inside(p,430)){
        const q=QUESTS[questPage],s=state().questStates[q.id];
        if(s==="available")acceptQuest(q.id);
        else if(s==="recovered"){
          // Rewards require the giver's town. Journal access does not turn
          // optional errands into remote turn-ins from dangerous fields.
          if(!claimQuest(q.id))notice="Return to "+q.giver+" in Cedar Hamlet to hand this in.";
        }
      }
    }else if(page==="travel"){
      TOWNS.forEach((t,i)=>{if(inside(p,250+i*68))travel(t.id);});
    }else if(page==="settings"){
      if(inside(p,225,70))setDifficulty("normal");else if(inside(p,323,90))setDifficulty("assist");
    }
    return true;
  }
  function label(value,x,y,size=11,color="#30382d",align="left",bold=false){
    const c=api.ctx;c.font=`${bold?"600 ":""}${size}px Arial, sans-serif`;c.fillStyle=color;c.textAlign=align;c.textBaseline="middle";c.fillText(value,x,y);
  }
  function lines(value,x,y,width=248,size=11,max=5){
    const c=api.ctx;c.font=`${size}px Arial, sans-serif`;const out=[];let line="";
    for(const word of String(value).split(/\s+/)){const next=line?line+" "+word:word;if(line&&c.measureText(next).width>width){out.push(line);line=word;}else line=next;}if(line)out.push(line);
    out.slice(0,max).forEach((s,i)=>label(s,x,y+i*16,size));
  }
  function button(y,title,subtitle,active=false,height=44){api.menuButton(40,y,280,height,active);label(title,54,y+17,12,"#f6ebd4","left",true);if(subtitle)label(subtitle,54,y+height-16,10,"#e5deca");}
  function draw(){
    if(!page||!api.ctx)return false;
    const c=api.ctx;c.save();c.globalAlpha=1;c.fillStyle="#101a20c9";c.fillRect(0,0,api.W||360,api.H||640);api.paperPanel(20,108,320,500);
    const title={hub:"JOURNEY KIT",weapons:"WEAPONS",quests:"SIDE QUESTS",quest:QUESTS[questPage]?.name.toUpperCase(),travel:"TOWN TRAVEL",settings:"DIFFICULTY"}[page];
    label(title,180,140,18,"#3c3425","center",true);
    if(page==="hub"){
      label("Tools for the road ahead",180,174,11,"#5b604b","center");
      button(210,"WEAPONS",weapon().name);button(275,"SIDE QUESTS","Two optional errands; no main-road locks");
      button(340,"TOWN TRAVEL",travelAvailable()?"Travel to towns already discovered":"Reconnect Willow Ferry to unlock");button(405,"DIFFICULTY",state().difficulty==="assist"?"Assist":"Normal");
    }else if(page==="weapons"){
      label("Earn blades through side quests. Tap to equip.",180,175,10,"#555c48","center");
      Object.values(WEAPONS).forEach((w,i)=>{
        const unlocked=state().unlocked.includes(w.id),equipped=weapon().id===w.id;
        button(201+i*102,w.name+(equipped?" • EQUIPPED":unlocked?"":" • LOCKED"),"Reach "+w.reach+"  •  Damage ×"+w.damage+"  •  Recovery "+w.cooldown+"s",equipped,86);
        label(w.id==="katana"?"Balanced":w.id==="tanto"?"Shin's tackle reward":"Takeshi's tool reward",54,201+i*102+43,10,"#f0e8d4");
      });
    }else if(page==="quests"){
      label("Optional help for people along the road",180,176,10,"#555c48","center");
      Object.values(QUESTS).forEach((q,i)=>{const y=205+i*135;button(y,q.name,state().questStates[q.id].toUpperCase(),false,112);label(q.giver+" • "+q.stageName,54,y+45,11,"#f0e8d4");label(q.reward+" mon + "+WEAPONS[q.weapon].name,54,y+66,10,"#f0e8d4");});
    }else if(page==="quest"){
      const q=QUESTS[questPage],s=state().questStates[q.id];label(q.giver+" • "+s.toUpperCase(),40,184,11,"#775137","left",true);
      lines(s==="recovered"?q.recovered:s==="claimed"?"This favor is complete. Your reward is already in your journey kit.":q.request,40,218,274,12,8);
      lines("Reward: "+q.reward+" mon and "+WEAPONS[q.weapon].name+". Equip unlocked weapons from Journey Kit.",40,360,274,11,3);
      if(s!=="claimed")button(430,s==="available"?"ACCEPT ERRAND":s==="recovered"?"RETURN ITEM":"ITEM STILL MISSING",s==="accepted"?"Find it on "+q.stageName:"Optional; does not block the main story",s==="recovered",58);
    }else if(page==="travel"){
      lines(travelAvailable()?"Take the reopened roads to a town you have already reached. Travel does not finish stages or unlock new gates.":"First reach Willow Ferry. Town travel is then available while safely inside a discovered town—not on roads or in battles.",40,180,275,11,4);
      const found=discovered();TOWNS.forEach((t,i)=>button(250+i*68,t.name,t.id===location().town?"YOU ARE HERE":!found.some(d=>d.id===t.id)?"NOT DISCOVERED":travelAvailable()?"TRAVEL":"UNAVAILABLE HERE",t.id===location().town,52));
    }else if(page==="settings"){
      lines("Change at any time. Your rewards and progress stay the same. Movement, jump height and platform geometry never change.",40,179,274,11,3);
      button(225,"NORMAL",state().difficulty==="normal"?"SELECTED • Standard combat":"Standard combat",state().difficulty==="normal",70);
      button(323,"ASSIST","35% less damage • 35% longer warnings",state().difficulty==="assist",90);
      lines("Assist gives more room to read attacks. Boss guard and recovery rules still apply.",40,434,274,11,3);
    }
    if(notice)lines(notice,40,507,275,10,3);
    button(557,page==="hub"?"BACK TO JOURNAL":"BACK",null,false,36);c.restore();return true;
  }
  return {normalize,weapon,equip,setDifficulty,damageTaken:amount=>Math.max(1,Math.round(amount*(state().difficulty==="assist"?.65:1))),
    warningTime:seconds=>seconds*(state().difficulty==="assist"?1.35:1),acceptQuest,recoverQuest,claimQuest,npcTalk,npcQuest,collectAt,notifyStage,pickup,drawWorldPickup,
    openMenu,openQuest,pointer,draw,close,travel,travelAvailable,discovered,get paused(){return page!==null;},get page(){return page;},WEAPONS,QUESTS};
};
