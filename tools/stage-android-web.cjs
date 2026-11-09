const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const output = path.join(root, "mobile", "www");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const assets = new Set([...html.matchAll(/["'](assets\/[^"'\s]+)["']/g)].map(m => m[1]));
for (const file of ["cedar-hamlet-concept-v2.png", "willow-ferry-concept-v2.png", "southern-high-road-v3-combined.png"])
  assets.add("assets/environment/campaign/" + file);
for (const stage of ["cedar-canopy-lanes-v1", "flooded-causeway-v1", "harvest-levee-v1", "bandit-storehouse-v1"])
  for (const panel of ["a", "b"])
    assets.add("assets/environment/campaign/platformers/" + stage + "-panel-" + panel + ".png");
assets.add("assets/environment/campaign/platformers/captain-arena-backdrop-v1.png");
assets.add("assets/characters/cinder-maw-boss-atlas-v1.png");
assets.add("assets/characters/cinder-maw-boss-atlas-right-v1.png");
assets.add("assets/characters/cinder-maw-front-idle-v1.png");
for (const file of ["index.html", "campaign.js", "campaign-features.js", "campaign-story.js", "campaign-billing.js", ...assets]) {
  const source = path.join(root, file), target = path.join(output, file);
  if (!fs.existsSync(source)) throw Error("Missing runtime file: " + file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}
// Android playtests must start in the expansion, not silently enter the legacy demo.
// This marker exists only in staged APK content; root HTML and Vercel stay unchanged.
// The game is plain HTML, not a bundler app. Include Capacitor's public JS API
// so custom native plugins use the supported registerPlugin proxy/headers.
fs.copyFileSync(path.join(root,"mobile/node_modules/@capacitor/core/dist/capacitor.js"),path.join(output,"native-capacitor-runtime.js"));
const build = {edition:"android-campaign",version:"0.3.1",playtest:!process.argv.includes("--release"),saveSlot:"bell-before-dusk.campaign.v1.android-campaign"};
const nativeHtml=html.replace('<script src="campaign-billing.js"></script>','<script src="native-capacitor-runtime.js"></script>\n  <script src="campaign-billing.js"></script>');
fs.writeFileSync(path.join(output,"index.html"),nativeHtml.replace('<script src="campaign.js"></script>',
  '<script>window.BELL_BUILD='+JSON.stringify(build)+';</script>\n  <script src="campaign.js"></script>'));
fs.writeFileSync(path.join(output,"build-info.json"),JSON.stringify(build,null,2));
console.log("Staged offline game: " + output + " (" + assets.size + " assets)");
