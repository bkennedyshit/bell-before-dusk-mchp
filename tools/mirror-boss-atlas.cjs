/* User-requested exact mirrored sibling, retaining RGBA and original art. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/billk/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage();const root=path.resolve(__dirname,'..');
 const input=fs.readFileSync(path.join(root,'assets/characters/cinder-maw-boss-atlas-v1.png'));
 const result=await page.evaluate(async data=>{
   const im=new Image();im.src=data;await im.decode();
   const c=document.createElement('canvas');c.width=im.width;c.height=im.height;
   const p=c.getContext('2d');p.translate(c.width,0);p.scale(-1,1);p.drawImage(im,0,0);p.setTransform(1,0,0,1,0,0);
   const flipped=p.getImageData(0,0,c.width,c.height).data;
   const original=document.createElement('canvas');original.width=c.width;original.height=c.height;
   const op=original.getContext('2d');op.drawImage(im,0,0);const src=op.getImageData(0,0,c.width,c.height).data;
   let mismatches=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)for(let channel=0;channel<4;channel++)
     if(src[(y*c.width+x)*4+channel]!==flipped[(y*c.width+c.width-1-x)*4+channel])mismatches++;
   return {data:c.toDataURL('image/png').split(',')[1],width:c.width,height:c.height,mismatches};
 },'data:image/png;base64,'+input.toString('base64'));
 assert.equal(result.mismatches,0,'All RGBA pixels mirror exactly');
 fs.writeFileSync(path.join(root,'assets/characters/cinder-maw-boss-atlas-right-v1.png'),Buffer.from(result.data,'base64'));
 console.log('PASS exact RGBA mirror '+result.width+'x'+result.height);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
