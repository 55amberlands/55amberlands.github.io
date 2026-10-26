/* 55 AMBERLANDS V30.4: UI stability + verified title RPC bridge.
   Does not modify combat, inventory, item rewards or Supabase save rules. */
(()=>{'use strict';
if(window.AMBER_V304_STABLE)return;
const $=id=>document.getElementById(id);
const CLOUD=()=>window.AMBER_CLOUD;
const isOnline=()=>!!(CLOUD()?.getStatus?.()?.cloudReady&&CLOUD()?.getUser?.()?.id&&CLOUD()?.getClient?.());
const T={account:'',loaded:false,active:'',owned:new Set(),busy:false,last:0,request:'auto'};
function state(){const id=String(CLOUD()?.getUser?.()?.id||'');if(T.account!==id){T.account=id;T.loaded=false;T.active='';T.owned=new Set();T.last=0;}return id;}
function active(){if(!isOnline())return null;state();return T.loaded?T.active:'';}
function owns(id){if(!isOnline())return null;state();return T.loaded?T.owned.has(String(id)):false;}
function notifySafe(msg){try{if(typeof window.notify==='function')window.notify(msg);else console.info('[V304]',msg);}catch{}}
async function call(action='get',title=null){
 if(!isOnline())return {ok:false,reason:'not_online'};
 state();if(T.busy)return {ok:false,reason:'busy'};
 T.busy=true;const account=T.account;
 try{
  const {data,error}=await CLOUD().getClient().rpc('amber_v304_title',{p_action:action,p_title:title});
  if(error)throw error;
  if(data?.ok!==true)return data||{ok:false,reason:'server_rejected'};
  if(account!==String(CLOUD()?.getUser?.()?.id||''))return {ok:false,reason:'account_switched'};
  T.loaded=true;T.active=String(data.active||'');T.request=String(data.requested||'auto');
  T.owned=new Set(Array.isArray(data.owned)?data.owned:[]);T.last=Date.now();
  const local=window.AMBER_V25?.V?.();if(local?.titles)local.titles.active=T.request;
  refreshLabels();
  return data;
 }catch(e){console.warn('[V304] title RPC',e);return {ok:false,reason:'rpc_failed'};}
 finally{T.busy=false;}
}
async function refresh(force=false){
 if(!isOnline())return null;
 state();if(T.busy||(!force&&Date.now()-T.last<15000))return null;
 return call('get');
}
async function select(id){
 if(!isOnline()){notifySafe('รอ Supabase เชื่อมต่อก่อนเลือกฉายา');return false;}
 const result=await call('set',id);
 if(!result?.ok){notifySafe(result?.reason==='title_locked'?'ยังไม่ได้ปลดล็อกฉายานี้บนเซิร์ฟเวอร์':'บันทึกฉายาไม่สำเร็จ กรุณาลองใหม่');return false;}
 notifySafe('บันทึกฉายาลง Supabase แล้ว');refreshLabels();
 try{if(window.AMBER_V25?.open && $('modalTitle')?.textContent?.includes('กิจกรรม'))await window.AMBER_V25.open('titles');}catch{}
 return true;
}
function refreshLabels(){
 // V25 keeps an internal closure for rendering; update it only when the title changed.
 const v=window.AMBER_V25; if(!v||!T.loaded)return;
 const id=T.active||'',sig=T.account+'|'+id;
 const el=$('px25TopTitle');if(el&&el.dataset.v304!==sig){el.innerHTML=id?v.titleHTML(id,true):'';el.dataset.v304=sig;el.dataset.h=el.innerHTML;}
}
window.AMBER_V304_TITLES=Object.freeze({active,owns,refresh,select,status:()=>({loaded:T.loaded,active:T.active,owned:[...T.owned],requested:T.request})});
const css=document.createElement('style');css.id='v304-stable-css';css.textContent=`
/* Keep the CURRENT pixel layer and avoid old scene flash. */
#scene:has(#px24Scene){background-image:none!important;background-color:#101827!important}
#scene #px24Scene{opacity:1!important;animation:none!important}
/* The V25 separate boss ticker is superseded by the V28 unified hub. */
.px25-wb{display:none!important}
/* Mobile nav/hud: no stacked floating widgets over the skill bar. */
@media(max-width:700px){
 #px28Hud{position:relative!important;z-index:3!important;padding:3px 6px!important;justify-content:center!important}
 #px28Hud .px28-hl,#px28Hud .px28-hq{display:flex!important;justify-content:center!important;gap:3px!important;flex-wrap:wrap!important;margin:0!important}
 #px28Hud .px28-q{font-size:10px!important;min-height:26px!important;padding:2px 5px!important}
 #px28Hud .px28-chip{font-size:10px!important}
 #px25EmoPanel{max-width:calc(100vw - 20px)!important}
 #px26Arena{padding-bottom:env(safe-area-inset-bottom,0px)!important;max-height:100dvh!important;overflow-y:auto!important}
 #px26Arena .px26-bimg{height:min(24dvh,180px)!important;flex-shrink:0!important}
 #px26Arena .px26-field{min-height:60px!important;max-height:32dvh!important;overflow:auto!important;flex:1 0 auto!important}
 #px26Arena .px26-top{padding:4px 8px!important}
 #px273Actions{padding:3px 5px!important}
 #px273Actions button{font-size:10px!important;min-height:30px!important;padding:5px 3px!important}
 #px26Arena #px26Bg{opacity:.26!important;filter:brightness(.65)!important}
 #px26Arena #px26Fx{opacity:.55!important}
 #px26Arena img.hit{filter:brightness(1.25)!important}
}
/* The legacy title badge lives outside the pixel scene; do not animate its container. */
#px25TopTitle,.px25-plate{transition:none!important}
/* No full-screen floating announcements when inventory and panels are open. */
body:has(#modalWrap.show) #px28Ann,body:has(#modalWrap.show) #px25EmoPanel{display:none!important}
`;document.head.appendChild(css);
window.AMBER_V304_STABLE=Object.freeze({version:'30.4'});
setInterval(()=>{if(!document.hidden)void refresh()},17000);
window.addEventListener('focus',()=>void refresh(true));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh(true)});
setTimeout(()=>void refresh(true),250);
})();
