const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../campaign-billing.js'),'utf8');
const flush=()=>new Promise(r=>setImmediate(r));
function make(build,reply={}){
  const calls=[];let owned=reply;
  const plugin={status:async()=>{calls.push('status');return owned;},restore:async()=>{calls.push('restore');return owned;},purchase:async()=>{calls.push('purchase');return owned;},addListener(){}};
  const sandbox={window:{BELL_BUILD:build,Capacitor:{registerPlugin:()=>plugin}},document:{addEventListener(){}}};vm.createContext(sandbox);vm.runInContext(source,sandbox);
  return {gate:sandbox.window.createBellBilling({stopHeroTravel(){},say(){}}),calls,set:value=>{owned=value;}};
}
(async()=>{
  const debug=make({edition:'android-campaign',playtest:true});assert.equal(debug.gate.full(),true);assert.equal(debug.calls.length,0);
  const live=make({edition:'android-campaign',playtest:false},{owned:false,pending:true,available:false});await flush();
  assert.equal(live.gate.full(),false);assert.equal(live.gate.requireFull(),false);await flush();assert.equal(live.gate.paused,true);
  live.gate.pointer({x:180,y:410});await flush();assert.ok(!live.calls.includes('purchase'),'Pending or unavailable never starts checkout');
  live.set({owned:false,pending:false,available:true,price:'localized price',configured:true});await live.gate.refresh();
  live.gate.pointer({x:180,y:410});await flush();assert.ok(live.calls.includes('purchase'));assert.equal(live.gate.full(),false,'Opening checkout never grants ownership');
  live.set({owned:true,pending:false});live.gate.pointer({x:180,y:470});await flush();assert.equal(live.gate.full(),true);assert.equal(live.gate.paused,false);
  const unset=make({edition:'android-campaign'});await flush();assert.equal(unset.gate.full(),false,'Missing debug flag fails closed');
  console.log('PASS Billing gate: playtest isolation, release fail-closed, pending/unavailable, explicit checkout and restored ownership');
})().catch(e=>{console.error(e);process.exitCode=1;});
