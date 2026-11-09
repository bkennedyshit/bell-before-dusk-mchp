const fs=require("node:fs");
const path=require("node:path");
const http=require("node:http");
const assert=require("node:assert/strict");
let playwright;
try { playwright=require("playwright"); }
catch (_) { playwright=require("C:/Users/billk/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"); }
const root=path.resolve(__dirname,"..");
const output=path.join(root,"art-review","campaign-playtest");
fs.mkdirSync(output,{recursive:true});
const html=fs.readFileSync(path.join(root,"index.html"),"utf8").replace(
  "    requestAnimationFrame(frame);",
  `    window.__qa={campaign,game,keys,update,draw,doAttack,doJump,doInteract,finish,
    auditMotion:()=>{
      const old=ctx.drawImage,rows=[];let last;
      ctx.drawImage=function(...args){last={args,flip:ctx.getTransform().a<0};return old.apply(this,args);};
      try{
        for(let direction=0;direction<8;direction++)for(let frame=0;frame<4;frame++){
          drawHeroRun(direction,180,300,frame,true);
          rows.push({kind:'hero',direction,frame,height:last.args[8],bottom:last.args[6]+last.args[8]});
        }
        for(let variant=0;variant<2;variant++)for(let direction=0;direction<4;direction++)for(let frame=0;frame<2;frame++){
          const [facingX,facingY]=[[0,1],[0,-1],[-1,0],[1,0]][direction];
          drawTownResident({variant,x:180,y:284,facingX,facingY,walkDistance:frame*7,moving:true});
          rows.push({kind:'ferry',variant,direction,frame,height:last.args[8],bottom:last.args[6]+last.args[8],flip:last.flip});
        }
      }finally{ctx.drawImage=old;}
      return rows;
    },
    ferryPoseSheet:()=>{
      ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#b8a276';ctx.fillRect(0,0,360,640);
      for(let variant=0;variant<2;variant++)for(let direction=0;direction<4;direction++){
        const [facingX,facingY]=[[0,1],[0,-1],[-1,0],[1,0]][direction];
        for(let frame=0;frame<2;frame++)drawTownResident({variant,x:50+direction*86,y:120+variant*285+frame*110,facingX,facingY,walkDistance:frame*7,moving:true});
      }
      ctx.restore();return canvas.toDataURL('image/png');
    },
    poseSheet:()=>{
      ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#b8a276';ctx.fillRect(0,0,360,640);
      for(let direction=0;direction<4;direction++){
        const x=47+direction*86;
        text(['FRONT','LEFT','RIGHT','BACK'][direction],x,22,9,'#33291b','center',true);
        const facing=[[0,1],[-1,0],[1,0],[0,-1]][direction];
        drawHero({...game.hero,x,y:98,invulnerable:0,moving:false,attackFx:0,facingX:facing[0],facingY:facing[1]});
        for(let frame=0;frame<4;frame++)drawHeroRun(direction,x,225+frame*113,frame,true);
      }
      ctx.restore();return canvas.toDataURL('image/png');
    },
    auditLayers:()=>{
      const oldDraw=ctx.drawImage,oldPlaque=drawDoorPlaque,trace=[];
      ctx.drawImage=function(sheet,...args){if(sheet===touchControls)trace.push('touch');return oldDraw.call(this,sheet,...args);};
      drawDoorPlaque=(...args)=>{trace.push('world-label');oldPlaque(...args);};
      try{draw();}finally{ctx.drawImage=oldDraw;drawDoorPlaque=oldPlaque;}
      return trace;
    },
    auditPlaque:()=>{
      const oldRect=ctx.fillRect,oldAlpha=ctx.globalAlpha,hero={...game.hero},scene=game.scene,alphas=[];
      ctx.fillRect=function(){alphas.push(ctx.globalAlpha);};ctx.globalAlpha=1;game.scene='topdown';
      game.hero.x=540;game.hero.y=680;drawDoorPlaque(540,665,'CEDAR ROAD');
      game.hero.x=800;drawDoorPlaque(540,665,'CEDAR ROAD');
      ctx.fillRect=oldRect;ctx.globalAlpha=oldAlpha;Object.assign(game.hero,hero);game.scene=scene;return alphas;
    },
    auditTerrain:()=>{
      if(!spiritTerrainSheet.complete||!spiritTerrainSheet.naturalWidth)return null;
      const scan=document.createElement('canvas');scan.width=spiritTerrainSheet.naturalWidth;scan.height=spiritTerrainSheet.naturalHeight;
      const paint=scan.getContext('2d');paint.drawImage(spiritTerrainSheet,0,0);
      const data=paint.getImageData(0,0,scan.width,scan.height).data,errors=[];
      for(const segment of SPIRIT_SEGMENTS){
        const spec=SPIRIT_TERRAIN[segment.art],scale=spiritTerrainScale(segment);
        for(const t of [.2,.4,.6,.8]){
          const sx=Math.round(spec.sx+t*spec.sw),worldX=segment.start+t*(segment.end-segment.start);
          const worldY=spiritSurfaceY(segment,worldX);
          const expectedSource=spec.contact[0][1]+(worldY-segment.y0)/scale;
          let top=-1;
          for(let y=Math.max(spec.sy,Math.floor(expectedSource-25));y<expectedSource+25;y++){
            if([0,1,2,3].every(k=>data[((y+k)*scan.width+sx)*4+3]>128)){top=y;break;}
          }
          errors.push({art:segment.art,t,error:top<0?999:(expectedSource-top)*scale});
        }
      }
      return errors;
    },
    auditRun:()=>{
      if(!heroRunSheet.complete||!heroRunSheet.naturalWidth||!heroDiagonalSheet.complete||!heroDiagonalSheet.naturalWidth||!roadBanditSheet.complete||!roadBanditSheet.naturalWidth)return null;
      const draws=[],shadows=[],oldDraw=ctx.drawImage,oldShadow=drawGroundShadow;
      ctx.drawImage=function(sheet,...args){draws.push({sheet,args});};
      drawGroundShadow=(x,y,r)=>shadows.push({x,y,r});
      try{
        for(let row=0;row<8;row++)for(let frame=0;frame<4;frame++)drawHeroRun(row,180,300,frame,true);
        for(let row=0;row<4;row++)for(let column=0;column<8;column++)registeredSprite(roadBanditSheet,8,4,column,row,180,300,61,true);
      }
      finally{ctx.drawImage=oldDraw;drawGroundShadow=oldShadow;}
      return draws.map(({sheet,args:[sx,sy,sw,sh,dx,dy,dw,dh]},i)=>{
        const pixels=sheet.getContext('2d').getImageData(0,0,sheet.width,sheet.height).data;
        let lowest=-1,footSum=0,footCount=0;
        for(let y=sy;y<sy+sh;y++)for(let x=sx;x<sx+sw;x++)if(pixels[(y*sheet.width+x)*4+3]>64)lowest=Math.max(lowest,y);
        for(let y=lowest-11;y<=lowest;y++)for(let x=sx;x<sx+sw;x++)if(pixels[(y*sheet.width+x)*4+3]>64){footSum+=x;footCount++;}
        return {height:dh,ground:dy+(lowest-sy+1)*dh/sh,foot:dx+(footSum/footCount-sx)*dw/sw,shadow:shadows[i]};
      });
    }};\n    requestAnimationFrame(frame);`
);
const errors=[],missing=[];
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,"http://localhost");
  const name=url.pathname==="/"?"index.html":decodeURIComponent(url.pathname.slice(1));
  const target=path.resolve(root,name);
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  if(name==="index.html"){res.setHeader("Content-Type","text/html");res.end(html);return;}
  if(!fs.existsSync(target)){res.writeHead(404).end();return;}
  const types={".js":"text/javascript",".png":"image/png",".mp3":"audio/mpeg"};
  res.setHeader("Content-Type",types[path.extname(target)]||"application/octet-stream");
  fs.createReadStream(target).pipe(res);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const browser=await playwright.chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:450,height:800},deviceScaleFactor:1});
    page.on("pageerror",e=>errors.push(e.message));
    page.on("response",r=>{if(r.status()>=400&&!r.url().endsWith("favicon.ico"))missing.push(r.url());});
    await page.goto("http://127.0.0.1:"+server.address().port+"/index.html");
    await page.waitForFunction(()=>!!window.__qa);
    await page.click("canvas",{position:{x:225,y:645}});
    await page.evaluate(()=>{
      const q=window.__qa;q.finish("victory");q.campaign.startFromTitle({x:180,y:510});
    });
    const scenes=[
      ["south","zone",358,510],
      ["willow","zone",535,355],
      ["cedar","zone",540,410],
      ["march","zone",350,700],
      ["spirit","stage",500],
      ["canopy","stage",300],
      ["causeway","stage",550],
      ["harvest","stage",1000],
      ["storehouse","stage",1950],
      ["ward","zone",360,550]
    ];
    for(const [id,type,x,y] of scenes){
      await page.evaluate(({id,type,x,y})=>{
        const q=window.__qa;
        if(type==="zone")q.campaign.debug.enterZone(id,x,y);
        else {
          q.campaign.debug.enterStage(id);
          q.campaign.debug.stage.x=x;
        }
      },{id,type,x,y});
      await page.waitForTimeout(900);
      await page.screenshot({path:path.join(output,id+".png")});
      await page.evaluate(()=>{
        const q=window.__qa;
        if(q.campaign.debug.mode==="stage")q.doJump();
        q.doAttack();
      });
    }
    await page.evaluate(()=>{const q=window.__qa;q.campaign.debug.enterStage('storehouse','south',2200);q.game.hero.invulnerable=0;q.campaign.debug.stage.enemies.find(e=>e.boss).stateClock=5;});
    await page.waitForTimeout(3500);await page.screenshot({path:path.join(output,'captain-arena.png')});
    await page.evaluate(()=>{const p=window.__qa.campaign.debug.stage;p.x=2280;p.y=200;p.vx=0;p.vy=0;p.grounded=true;});
    await page.waitForTimeout(500);await page.screenshot({path:path.join(output,'captain-arena-upper.png')});
    await page.evaluate(()=>{const q=window.__qa,d=q.campaign.debug;d.progress.captain=true;d.progress.demon=false;d.enterStage('storehouse','south',2200);q.game.hero.invulnerable=999;d.stage.enemies.find(e=>e.demon).stateClock=100;});
    await page.waitForTimeout(800);
    const floorPixel=await page.evaluate(()=>{window.__qa.campaign.draw();return Array.from(document.querySelector('canvas').getContext('2d').getImageData(180,625,1,1).data);});
    await page.screenshot({path:path.join(output,'cinder-maw-arena.png')});
    const arenaState=await page.evaluate(()=>({camera:window.__qa.campaign.debug.stage.camera,paused:window.__qa.campaign.paused,x:window.__qa.campaign.debug.stage.x}));
    assert.ok(floorPixel[0]>floorPixel[2]&&floorPixel[0]<45,'Arena backing covers the lower viewport without outdoor blue scenery: '+floorPixel+' '+JSON.stringify(arenaState));
    await page.evaluate(()=>{const d=window.__qa.campaign.debug,b=d.stage.enemies.find(e=>e.demon);b.state='telegraph';b.attack=0;b.stateClock=100;});
    await page.waitForTimeout(100);await page.screenshot({path:path.join(output,'cinder-maw-climb-warning.png')});
    await page.evaluate(()=>{const q=window.__qa,b=q.campaign.debug.stage.enemies.find(e=>e.demon);for(const state of ['rest','telegraph','burn','sweep','dive','recover'])for(let attack=0;attack<3;attack++){
      b.state=state;b.attack=attack;b.mark={x:2222,y:370};q.draw();
    }b.state='rest';b.stateClock=100;});
    await page.waitForTimeout(400);await page.screenshot({path:path.join(output,'cinder-maw-front.png')});
    await page.evaluate(()=>{const q=window.__qa,b=q.campaign.debug.stage.enemies.find(e=>e.demon);b.state='telegraph';b.attack=1;b.dir=1;b.mark={x:2222,y:370};b.stateClock=100;q.draw();});
    await page.waitForTimeout(100);await page.screenshot({path:path.join(output,'cinder-maw-right.png')});
    const runAnchors=await page.evaluate(()=>window.__qa.auditRun());
    await page.evaluate(()=>window.__qa.campaign.debug.home());
    const layers=await page.evaluate(()=>window.__qa.auditLayers());
    assert.ok(layers.indexOf('touch')>layers.lastIndexOf('world-label'),'Touch controls are above every world plaque: '+layers);
    assert.equal(await page.evaluate(()=>Object.values(window.BELL_SPRITE_CONTACTS).reduce((n,s)=>n+s.cells.filter(Boolean).length,0)),64);
    const labelAlpha=await page.evaluate(()=>window.__qa.auditPlaque());
    assert.ok(labelAlpha[0]<.2&&labelAlpha[1]>.99,'World plaque fades over the hero: '+labelAlpha);
    assert.equal(runAnchors.length,64);
    fs.writeFileSync(path.join(output,'hero-contact-sheet.png'),Buffer.from((await page.evaluate(()=>window.__qa.poseSheet())).split(',')[1],'base64'));
    for(const pose of runAnchors){
      assert.ok(Math.abs(pose.ground-300)<0.01,"Run soles stay on the ground in every frame/facing");
      assert.equal(pose.shadow.x,180,"Body shadow never drifts with a leading foot");
      assert.ok(Math.abs(pose.foot-pose.shadow.x)<pose.shadow.r+2,"Planted foot remains inside the body shadow");
      assert.equal(pose.shadow.y,300);
    }
    for(const pose of runAnchors.slice(32))assert.ok(pose.height<=50.01&&pose.shadow.r===10,"Bandits use a consistent smaller silhouette and shadow");
    // Exercise generated sprite registration, persistent dialogue and priced shops.
    await page.evaluate(()=>window.__qa.campaign.debug.enterZone("south",350,700));
    await page.keyboard.down("ArrowRight");await page.waitForTimeout(300);
    await page.screenshot({path:path.join(output,"hero-run.png")});await page.keyboard.up("ArrowRight");
    await page.keyboard.down("ArrowLeft");await page.waitForTimeout(250);
    await page.screenshot({path:path.join(output,"hero-run-left.png")});await page.keyboard.up("ArrowLeft");
    await page.keyboard.down("ArrowRight");await page.keyboard.down("ArrowDown");await page.waitForTimeout(250);
    await page.screenshot({path:path.join(output,"hero-run-diagonal.png")});await page.keyboard.up("ArrowRight");await page.keyboard.up("ArrowDown");
    await page.evaluate(()=>{const q=window.__qa;q.campaign.pointer({x:105,y:180});});
    await page.screenshot({path:path.join(output,"route-map.png")});await page.evaluate(()=>window.__qa.campaign.pointer({x:180,y:300}));
    await page.evaluate(()=>{
      const q=window.__qa;q.campaign.debug.enterZone("cedar",380,205);q.doInteract();
    });
    assert.equal(await page.evaluate(()=>window.__qa.campaign.debug.mode),"interior");
    await page.screenshot({path:path.join(output,"cedar-forge-interior.png")});
    await page.evaluate(()=>window.__qa.campaign.debug.leaveRoom());
    await page.evaluate(()=>{
      const q=window.__qa;q.campaign.debug.enterZone("cedar",380,205);q.doInteract();
      q.game.hero.x=180;q.game.hero.y=400;q.game.mon=10;q.doInteract();
    });
    assert.equal(await page.evaluate(()=>window.__qa.game.mon),10,"Talking must not auto-buy");
    assert.equal(await page.evaluate(()=>window.__qa.campaign.debug.journey.page),'quest','Smith offers an optional errand');
    await page.screenshot({path:path.join(output,'smith-quest.png')});
    await page.click('canvas',{position:{x:225,y:719}});
    assert.ok(await page.evaluate(()=>window.__qa.campaign.debug.shop),'Declining errand still permits trading');
    await page.screenshot({path:path.join(output,"shop.png")});
    await page.click("canvas",{position:{x:225,y:390}});
    assert.equal(await page.evaluate(()=>window.__qa.game.mon),4);
    await page.click("canvas",{position:{x:225,y:475}});
    await page.evaluate(()=>{const q=window.__qa;q.campaign.debug.enterZone("willow",260,400);q.doInteract();});
    assert.equal(await page.evaluate(()=>window.__qa.campaign.paused),true);
    await page.waitForTimeout(300);
    await page.screenshot({path:path.join(output,"dialogue.png")});
    await page.click("canvas",{position:{x:225,y:520}});
    assert.equal(await page.evaluate(()=>window.__qa.campaign.paused),false);
    // A real reload must restore the recorded arrival and resources.
    await page.evaluate(()=>{
      const q=window.__qa;q.game.mon=17;
      q.campaign.debug.progress.cleared.push("causeway");
      q.campaign.debug.enterZone("willow",535,300);
      q.campaign.debug.save();
    });
    await page.reload();await page.waitForFunction(()=>!!window.__qa);
    await page.click("canvas",{position:{x:225,y:645}});
    assert.equal(await page.evaluate(()=>window.__qa.game.mapId),"willow");
    assert.equal(await page.evaluate(()=>window.__qa.game.mon),17);
    // Touch journal pauses movement, and portrait viewport fits the device.
    await page.click("canvas",{position:{x:50,y:225}});
    assert.equal(await page.evaluate(()=>window.__qa.campaign.paused),true);
    await page.screenshot({path:path.join(output,"journal.png")});
    await page.click('canvas',{position:{x:225,y:630}});
    assert.equal(await page.evaluate(()=>window.__qa.campaign.debug.journey.page),'hub');
    await page.screenshot({path:path.join(output,'journey-kit.png')});
    await page.click('canvas',{position:{x:225,y:290}});
    assert.equal(await page.evaluate(()=>window.__qa.campaign.debug.journey.page),'weapons');
    await page.screenshot({path:path.join(output,'weapons.png')});
    await page.evaluate(()=>window.__qa.campaign.debug.journey.close());
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.goto("http://127.0.0.1:"+server.address().port+"/index.html?chapter=roads");
    await page.waitForFunction(()=>!!window.__qa);
    await page.click("canvas",{position:{x:225,y:645}});
    assert.equal(await page.evaluate(()=>window.__qa.game.phase),"campaign_home");
    assert.equal(await page.evaluate(()=>window.__qa.game.mon),6);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("bell-before-dusk.campaign.v1")).game.mon),17,
      "Road chapter preview must not replace the player's main journey");
    assert.deepEqual(missing,[],"Missing requested assets");
    assert.deepEqual(errors,[],"Browser runtime errors");
    await page.screenshot({path:path.join(output,'story-introduction.png')});
    for(let i=0;i<4;i++)await page.evaluate(()=>window.__qa.campaign.pointer({x:180,y:560}));
    const terrain=await page.evaluate(()=>window.__qa.auditTerrain());
    assert.ok(terrain&&terrain.every(p=>Math.abs(p.error)<6),"Art/feet contact mismatch: "+JSON.stringify(terrain));
    for(const [x,name] of [[340,"spirit-ramp"],[800,"spirit-stairs"]]){
      await page.evaluate(x=>{const q=window.__qa,d=q.campaign.debug;d.enterStage('spirit');const p=d.stage;p.x=x;p.enemies=[];
        const s=p.surfaces.find(s=>x>=s.x&&x<=s.end);p.y=d.surfaceY(s,x);p.camera=x-135;p.cameraY=0;q.game.hero.invulnerable=0;},x);
      await page.waitForTimeout(150);await page.screenshot({path:path.join(output,name+".png")});
    }
    const peaks=[];
    for(const held of [false,true]){
      await page.evaluate(()=>{const q=window.__qa;q.campaign.debug.enterStage('canopy');q.campaign.debug.stage.enemies=[];});
      await page.keyboard.down('Space');
      if(!held)await page.keyboard.up('Space');
      await page.waitForTimeout(300);peaks.push(await page.evaluate(()=>window.__qa.campaign.debug.stage.y));
      await page.keyboard.up('Space');
    }
    assert.ok(peaks[0]-peaks[1]>25,"Actual keyboard hold must jump higher than tap: "+peaks);
    await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete));
    const motion=await page.evaluate(()=>window.__qa.auditMotion());
    fs.writeFileSync(path.join(output,'ferry-contact-sheet.png'),Buffer.from((await page.evaluate(()=>window.__qa.ferryPoseSheet())).split(',')[1],'base64'));
    for(const pose of motion){
      assert.ok(Math.abs(pose.height-(pose.kind==='hero'?58:54))<.01,'Stable silhouette size: '+JSON.stringify(pose));
      assert.ok(Math.abs(pose.bottom-300)<.01,'Stable ground baseline: '+JSON.stringify(pose));
      if(pose.kind==='ferry')assert.equal(pose.flip,pose.frame===1&&(pose.direction===1||(pose.variant===1&&pose.direction===0)),'Prop stays in the same hand');
    }
    const touchPeaks=[];
    for(const taps of [2,3]){
      await page.evaluate(()=>{const q=window.__qa;q.campaign.debug.enterStage('canopy');const p=q.campaign.debug.stage;p.enemies=[];p.x=100;q.game.hero.invulnerable=0;});
      const box=await page.locator('canvas').boundingBox();
      for(let i=0;i<taps;i++){
        await page.mouse.click(box.x+240/360*box.width,box.y+350/640*box.height);
        await page.waitForTimeout(50);
      }
      await page.waitForTimeout(350);touchPeaks.push(await page.evaluate(()=>window.__qa.campaign.debug.stage.y));
    }
    assert.ok(touchPeaks[0]-touchPeaks[1]>25,'Canvas triple tap exceeds double tap: '+touchPeaks);
    console.log("PASS Browser: all scenes, terrain pixel contact, keyboard hold/tap, real assets, actions, reload save, touch journal, isolated road preview");
    console.log("Screenshots: "+output);
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
