/* Full-game entitlement lives in native Play Billing, never in gameplay saves. */
window.createBellBilling = function(api){
  const build=window.BELL_BUILD;
  const gated=build?.edition==="android-campaign"&&build.playtest!==true;
  let native=null,opened=false,busy=false;
  let status={owned:false,pending:false,available:false,configured:false,price:"",message:"Connect to Google Play to check full-game access."};
  try{native=window.Capacitor?.registerPlugin?.("BellBilling")||window.Capacitor?.Plugins?.BellBilling;}catch(_){}
  function full(){return !gated||status.owned===true;}
  function apply(value){status={...status,...value};if(status.owned&&opened){opened=false;api.say?.("Full game unlocked. Your journey progress is unchanged.");}}
  async function request(method){
    if(busy||!gated)return;
    busy=true;
    try{if(!native?.[method])throw Error("unavailable");apply(await native[method]());}
    catch(_){status.message="Google Play is unavailable. The free opening remains playable. Use Restore when connected.";}
    finally{busy=false;}
  }
  function open(){if(full())return false;opened=true;api.stopHeroTravel?.();request("status");return true;}
  function requireFull(){if(full())return true;open();return false;}
  function pointer(p){
    if(!opened)return false;
    if(p.x<40||p.x>320)return true;
    if(p.y>=390&&p.y<=438&&status.available&&status.price&&!busy)request("purchase");
    else if(p.y>=450&&p.y<=494&&!busy)request("restore");
    else if(p.y>=540&&p.y<=584)opened=false;
    return true;
  }
  function text(s,x,y,size=12,color="#3b382d",align="left"){
    const c=api.ctx;c.font=`${size}px Arial, sans-serif`;c.textAlign=align;c.textBaseline="middle";c.fillStyle=color;c.fillText(s,x,y);
  }
  function wrap(s,y){const c=api.ctx;c.font="11px Arial, sans-serif";let line="",row=0;for(const word of s.split(/\s+/)){const next=line?line+" "+word:word;if(line&&c.measureText(next).width>270){text(line,45,y+row++*17,11);line=word;}else line=next;}if(line)text(line,45,y+row*17,11);}
  function button(y,title){api.menuButton(40,y,280,44);text(title,180,y+22,12,"#f5e6c9","center");}
  function draw(){if(!opened)return false;const c=api.ctx;c.save();c.fillStyle="#101a20dc";c.fillRect(0,0,360,640);api.paperPanel(20,110,320,498);
    text("CONTINUE THE FULL JOURNEY",180,145,16,"#3b382d","center");
    wrap("The opening is yours to play. One purchase unlocks all three towns, every trail, both bosses, side quests and weapons. No subscriptions or consumable currency.",183);
    wrap(busy?"Checking with Google Play…":status.message,290);
    button(390,status.owned?"FULL GAME OWNED":status.pending?"PAYMENT PENDING":status.available&&status.price?"UNLOCK FULL GAME — "+status.price:"PURCHASE NOT AVAILABLE");
    button(450,"RESTORE PURCHASES");button(540,"BACK TO FREE OPENING");c.restore();return true;}
  if(gated){request("status");document.addEventListener?.("visibilitychange",()=>{if(!document.hidden)request("status");});
    try{native?.addListener?.("billingChanged",apply);}catch(_){}
  }
  return {full,requireFull,open,pointer,draw,refresh:()=>request("status"),close:()=>{opened=false;},get paused(){return opened;},get state(){return {...status};},get gated(){return gated;}};
};
