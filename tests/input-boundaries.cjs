const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = process.argv.includes('--baseline')
  ? execFileSync('git', ['show', 'HEAD:index.html'], {cwd:root, encoding:'utf8'})
  : fs.readFileSync(path.join(root,'index.html'),'utf8');
let source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const canvasEvents = {}, windowEvents = {}, documentEvents = {};
const listen = table => (name, fn) => (table[name] ||= []).push(fn);
const context = new Proxy({measureText:text=>({width:text.length*6})}, {get:(o,k)=>o[k] || (()=>{})});
const canvas = {getContext:()=>context, addEventListener:listen(canvasEvents), setPointerCapture:()=>{}, getBoundingClientRect:()=>({left:0,top:0,width:360,height:640})};
class Image {addEventListener() {} }
const sandbox = {Image, console, performance:{now:()=>0}, requestAnimationFrame:()=>{}, addEventListener:listen(windowEvents),
  document:{getElementById:()=>canvas, addEventListener:listen(documentEvents), hidden:false}, window:{}};
const close = source.lastIndexOf('  })();');
source = source.slice(0,close) + `
startAudio = () => {}; sfx = () => {};
globalThis.qa = { game, stick, keys, actionButton, contextButton, resetGame, startPlatform,
 finishPlatformChase, finishPlatformReplay, beginChaseField, updateTopdown, contextAction,
 stopHeroTravel, blockedAt, moveActor, makeNodes,
 silence: () => { messageTime = 0; },
 field: () => { resetGame(); Object.assign(game,{mapId:'outside',phase:'post_chase_field',enemies:[],nodes:[]});
 game.hero.x=620;game.hero.y=208;cameraX=400;cameraY=0;messageTime=0; }
};
` + source.slice(close);
vm.runInNewContext(source,sandbox);
const q=sandbox.qa;
const emit=(table,name,event={})=>(table[name]||[]).forEach(fn=>fn({type:name,preventDefault(){},...event}));
const pointer=(x,y,id=1)=>emit(canvasEvents,'pointerdown',{clientX:x,clientY:y,pointerId:id});
const frames=n=>{for(let i=0;i<n;i++)q.updateTopdown(1/60);};
let failures=0;
function test(name,fn){try{q.keys.clear();q.stopHeroTravel();q.field();fn();console.log('PASS '+name);}catch(e){failures++;console.log('FAIL '+name+': '+e.message);}}
test('Old tap target is cleared entering and leaving the platformer',()=>{
 q.game.tapTarget={x:620,y:100}; q.startPlatform(); assert.equal(q.game.tapTarget,null);
 q.game.tapTarget={x:620,y:100};q.keys.add('arrowup');q.stick.active=true;q.stick.dy=-1;
 q.finishPlatformChase();q.silence();frames(120);
 assert.equal(q.game.hero.y,208);assert.equal(q.game.hero.moving,false);assert.equal(q.keys.size,0);
});
test('Replay return also cancels held input and prior destinations',()=>{
 q.startPlatform(true);q.game.tapTarget={x:620,y:77};q.keys.add('arrowup');q.finishPlatformReplay();q.silence();frames(120);assert.equal(q.game.hero.y,208);
});
test('Lost pointer capture releases the joystick',()=>{
 pointer(57,548,7);emit(canvasEvents,'lostpointercapture',{pointerId:7});const y=q.game.hero.y;frames(30);assert.equal(q.game.hero.y,y);assert.equal(q.stick.active,false);
});
test('Blur clears held keyboard movement and pending tap travel',()=>{
 q.keys.add('arrowup');q.game.tapTarget={x:600,y:400};emit(windowEvents,'blur');assert.equal(q.keys.size,0);assert.equal(q.game.tapTarget,null);
});
test('Backgrounding and pointer cancellation release all held actions',()=>{
 q.keys.add('w');q.actionButton.down=true;q.contextButton.down=true;q.stick.active=true;q.stick.dy=-1;
 sandbox.document.hidden=true;emit(documentEvents,'visibilitychange');sandbox.document.hidden=false;
 assert.equal(q.keys.size,0);assert.equal(q.actionButton.down,false);assert.equal(q.contextButton.down,false);
 pointer(57,548,7);emit(canvasEvents,'pointercancel',{pointerId:7});assert.equal(q.stick.active,false);
});
test('Touching the stick center cancels auto-walk immediately',()=>{
 q.game.tapTarget={x:620,y:500};pointer(57,582);emit(canvasEvents,'pointerup',{pointerId:1});frames(30);assert.equal(q.game.hero.y,208);
});
test('A second finger cannot take over the movement stick',()=>{
 pointer(57,548,1);pointer(80,600,2);assert.equal(q.stick.id,1);emit(canvasEvents,'pointerup',{pointerId:1});assert.equal(q.stick.active,false);
});
test('HUD and inactive action area cannot create travel targets',()=>{
 pointer(250,60);assert.equal(q.game.tapTarget,null);pointer(300,506);assert.equal(q.game.tapTarget,null);
});
test('Tapping the torii structure is rejected as a travel target',()=>{
 pointer((620-400)*1.14,180*1.14);assert.equal(q.game.tapTarget,null);
});
test('Holding UP stops in front of north gates and stops walk animation',()=>{
 q.keys.add('arrowup');frames(300);assert.ok(q.game.hero.y>=192);assert.equal(q.game.hero.moving,false);
 assert.equal(q.blockedAt(q.game.hero,620,120),true);assert.equal(q.blockedAt(q.game.hero,360,120),true);
});
test('CHASE, PATH, SEALED and the south return remain reachable',()=>{
 q.game.hero.y=198;q.game.phase='chase_field';assert.equal(q.contextAction().label,'CHASE');
 q.game.phase='run2';assert.equal(q.contextAction().label,'PATH');
 q.game.hero.x=360;q.game.hero.y=193;assert.equal(q.contextAction().label,'SEALED');
 q.game.phase='post_chase_field';q.game.hero.y=898;assert.equal(q.contextAction().label,'TOWN');
 for(const node of q.makeNodes(2))assert.equal(q.blockedAt(q.game.hero,node.x,node.y),false);
});
test('Moving away from the blocked gate works after key release',()=>{
 q.keys.add('arrowup');frames(60);q.keys.delete('arrowup');q.keys.add('arrowdown');const y=q.game.hero.y;frames(30);assert.ok(q.game.hero.y>y+40);
});
process.exitCode=failures?1:0;
