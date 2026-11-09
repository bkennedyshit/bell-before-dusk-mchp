const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const assets=new Set([...html.matchAll(/["'](assets\/[^"'\s]+)["']/g)].map(m=>m[1]));
for(const file of ["cedar-hamlet-concept-v2.png","willow-ferry-concept-v2.png","southern-high-road-v3-combined.png"])
  assets.add("assets/environment/campaign/"+file);
for(const stage of ["cedar-canopy-lanes-v1","flooded-causeway-v1","harvest-levee-v1","bandit-storehouse-v1"])
  for(const panel of ["a","b"])assets.add("assets/environment/campaign/platformers/"+stage+"-panel-"+panel+".png");
assets.add("assets/environment/campaign/platformers/captain-arena-backdrop-v1.png");
for(const file of ["cinder-maw-boss-atlas-v1.png","cinder-maw-boss-atlas-right-v1.png","cinder-maw-front-idle-v1.png"])
  assets.add("assets/characters/"+file);
const base=path.join(root,"dist","bell-before-dusk-campaign-alpha");
// Never overwrite a prior playtest build.
let output=base,index=1;
while(fs.existsSync(output))output=base+"-"+index++;
fs.mkdirSync(output,{recursive:true});
for(const file of ["index.html","campaign.js","campaign-features.js","campaign-story.js","campaign-billing.js",...assets]){
  const source=path.join(root,file);
  if(!fs.existsSync(source))throw Error("Missing runtime asset: "+file);
  const target=path.join(output,file);
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);
}
const bytes=[...assets].reduce((sum,file)=>sum+fs.statSync(path.join(root,file)).size,0);
console.log(output);
console.log(assets.size+" runtime assets; "+(bytes/1024/1024).toFixed(1)+" MB; no development dependencies");
