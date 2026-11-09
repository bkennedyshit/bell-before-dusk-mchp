/* Check the Git index, not ignored working-tree copies, before sharing a build. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const git=(...args)=>cp.execFileSync('git',args,{cwd:root,maxBuffer:20*1024*1024});
const files=git('ls-files','-z').toString().split('\0').filter(Boolean),indexed=new Set(files);
const text=file=>git('show',':'+file).toString();
const html=text('index.html'),assets=new Set([...html.matchAll(/["'](assets\/[^"'\s]+)["']/g)].map(m=>m[1]));
for(const name of ['cedar-hamlet-concept-v2.png','willow-ferry-concept-v2.png','southern-high-road-v3-combined.png'])assets.add('assets/environment/campaign/'+name);
for(const name of ['cedar-canopy-lanes-v1','flooded-causeway-v1','harvest-levee-v1','bandit-storehouse-v1'])for(const panel of ['a','b'])assets.add('assets/environment/campaign/platformers/'+name+'-panel-'+panel+'.png');
assets.add('assets/environment/campaign/platformers/captain-arena-backdrop-v1.png');
for(const name of ['cinder-maw-boss-atlas-v1.png','cinder-maw-boss-atlas-right-v1.png','cinder-maw-front-idle-v1.png'])assets.add('assets/characters/'+name);
const runtime=['index.html','campaign.js','campaign-features.js','campaign-story.js','campaign-billing.js',...assets];
for(const name of runtime)assert.ok(indexed.has(name),'Runtime missing from Git index: '+name);
for(const match of html.matchAll(/<script[^>]+src=["']([^"']+)/g))if(!/^https?:/.test(match[1]))assert.ok(indexed.has(match[1]),'Script missing from index: '+match[1]);
assert.equal(JSON.parse(text('mobile/package.json')).version,'0.3.1');
assert.ok(text('campaign.js').includes('function updateDemon'));
assert.equal(JSON.parse(text('vercel.json')).git.deploymentEnabled,false);
assert.match(text('mobile/android/app/src/main/res/values/billing.xml'),/<string name="bell_billing_public_key"[^>]*>\s*<\/string>/);
const secretRules=[['private key',new RegExp('-----BEGIN '+'(?:RSA |EC |OPENSSH )?PRIVATE KEY-----')],
 ['access token',new RegExp('(?:gh[pousr]_'+'|github_pat_'+'|sk-proj-)[A-Za-z0-9_\-]{20,}')],
 ['AWS key',new RegExp('AKIA'+'[A-Z0-9]{16}')]];
const forbidden=/(?:^|\/)(?:node_modules|\.gradle|\.vercel|xcuserdata|DerivedData)(?:\/|$)|(?:^|\/)\.env(?:\.|$)|\.(?:apk|aab|jks|keystore|p12|p8|mobileprovision)$|owner-save-backup|session\.jsonl|(?:^|\/)local\.properties$/;
let bytes=0,max={path:'',bytes:0},textCount=0;
for(const file of files){
 assert.ok(!forbidden.test(file),'Generated/private file staged: '+file);
 const size=Number(git('cat-file','-s',':'+file).toString());bytes+=size;if(size>max.bytes)max={path:file,bytes:size};
 assert.ok(size<50*1024*1024,'Large file needs separate handling: '+file);
 if(/\.(?:js|cjs|html|json|md|txt|xml|java|gradle|properties|ps1|py|yml|yaml)$/.test(file)){
   textCount++;const value=text(file);for(const [label,rule]of secretRules)assert.ok(!rule.test(value),'Possible '+label+' in '+file);
 }
}
console.log(JSON.stringify({passed:true,indexFiles:files.length,runtimeFiles:runtime.length,runtimeAssets:assets.size,textFilesScanned:textCount,totalMiB:+(bytes/1048576).toFixed(2),largestFile:max,version:'0.3.1'},null,2));
