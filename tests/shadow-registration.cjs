// Compare actual draw destinations against independently measured sprite pixels.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const measured = JSON.parse(execFileSync('py', [path.join(__dirname, 'measure-ground-anchors.py'), '--json'], {encoding:'utf8'}));
let source = fs.readFileSync(path.join(root, 'index.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
let state = {x:0, sx:1}, stack = [], draw;
const ctx = {
  save(){stack.push({...state});}, restore(){state=stack.pop();},
  translate(x){state.x+=state.sx*x;}, scale(x){state.sx*=x;},
  drawImage(...args){draw={args,state:{...state}};}
};
const canvas = {getContext:()=>ctx, addEventListener(){}};
class Image {addEventListener(){}}
source = source.replace('  })();', `
  Object.assign(heroSheet, {complete:true,naturalWidth:${measured.hero.width},naturalHeight:${measured.hero.height}});
  citizenWalkAtlas = ${JSON.stringify(measured.walk)};
  citizenVerticalAtlas = ${JSON.stringify(measured.vertical)};
  citizenPortraitAtlas = ${JSON.stringify(measured.portrait)};
  globalThis.drawers = {hero:drawHeroCell,walk:drawCitizenWalkCell,vertical:drawCitizenVerticalCell,portrait:drawCitizenPortraitCell};
  })();`);
const sandbox = {Image,document:{getElementById:()=>canvas,addEventListener(){}},window:{},performance:{now:()=>0},addEventListener(){},requestAnimationFrame(){}};
vm.runInNewContext(source,sandbox);
let count=0;
for (const [kind,data] of Object.entries(measured)) {
  const rows=kind==='hero' ? data.anchors.slice(0,3) : data.anchors;
  rows.forEach((cells,row)=>cells.forEach(([ax,ay],col)=>{
    for(const flip of (kind==='hero'||kind==='walk' ? [false,true] : [false])) {
      state={x:0,sx:1}; stack=[]; draw=null;
      sandbox.drawers[kind](col,row,200,300,68,flip,true);
      assert.ok(draw,`${kind} ${row}/${col}: no sprite rendered`);
      const [,,,,,dx,dy,dw,dh]=draw.args;
      const groundX=draw.state.x+draw.state.sx*(dx+ax*dw);
      const groundY=dy+ay*dh;
      assert.ok(Number.isFinite(groundX)&&Number.isFinite(groundY),`${kind} ${row}/${col}: invalid draw destination`);
      assert.ok(Math.abs(groundX-200)<0.01,`${kind} ${row}/${col}: feet shifted horizontally ${groundX-200}px`);
      assert.ok(Math.abs(groundY-300)<0.01,`${kind} ${row}/${col}: feet shifted vertically ${groundY-300}px`);
      count++;
    }
  }));
}
console.log(`PASS ${count} rendered poses/flips meet the measured ground point within 0.01 pixel`);
