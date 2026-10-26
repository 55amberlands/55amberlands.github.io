/* 55 AMBERLANDS V30.3 — unified UI + server-verified monster cards.
   No client combat/drops/rewards or wallet writes. */
(()=>{'use strict';
if (window.AMBER_V303_UNIFY) return;
const $=id=>document.getElementById(id);
const style=document.createElement('style');
style.id='amber-v303-unified-css';
style.textContent=`
/* The legacy World Boss ticker remains mounted by V25; hide its separate UI.
   V30.3 makes the older World Boss accessible from the V28 hub instead. */
.px25-wb{display:none!important}
/* Always put a visible modal over floating game controls/announcements. */
#modalWrap.show{z-index:9500!important}
html.amber-v303-modal-open #px28Ann,
html.amber-v303-modal-open #px25EmoBtn,
html.amber-v303-modal-open #px25EmoPanel{display:none!important}
html.amber-v303-modal-open #toast{z-index:9600!important}
/* Old sprite background must not flash over the modern real-time pixel canvas. */
#scene:has(#px24Scene){background-image:none!important;background-color:#101827!important}
#scene #px24Scene{will-change:contents;backface-visibility:hidden}
/* The collapsed nav and expanded mobile menu have different occupied heights. */
@media(max-width:700px){
body:not(.amber24-menu-closed) #px25EmoBtn{
 bottom:calc(var(--amber24-nav-height,165px) + 58px + env(safe-area-inset-bottom,0px))!important;
 right:10px!important
}
body:not(.amber24-menu-closed) #px25EmoPanel{
 bottom:calc(var(--amber24-nav-height,165px) + 112px + env(safe-area-inset-bottom,0px))!important;
 right:10px!important;max-height:32dvh!important;overflow-y:auto!important
}
body.amber24-menu-closed #px25EmoBtn{bottom:calc(74px + env(safe-area-inset-bottom,0px))!important}
body.amber24-menu-closed #px25EmoPanel{bottom:calc(125px + env(safe-area-inset-bottom,0px))!important;max-height:40dvh!important;overflow-y:auto!important}
}
/* Four tabs must fit on a narrow portrait screen. */
#px28hub .px28h-tabs{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}
#px28hub .px28h-tabs button{min-width:0;white-space:normal;font-size:11px;line-height:1.25}
#px28Ann{max-width:min(190px,47vw)!important;pointer-events:none!important}
#px28Ann .px28-ann{font-size:10px!important;padding:4px 6px!important}
`;
document.head.appendChild(style);
function modalState(){
  const opened=!!$('modalWrap')?.classList.contains('show');
  document.documentElement.classList.toggle('amber-v303-modal-open',opened);
  if(opened) $('px25EmoPanel')?.classList.remove('on');
}
const modal=$('modalWrap');
if(modal){new MutationObserver(modalState).observe(modal,{attributes:true,attributeFilter:['class']});modalState()}
// A fixed announcement can outlive the modal state; this rule prevents a stale toast
// from reappearing when the modal closes.
function pruneAnnouncements(){const root=$('px28Ann');if(!root)return;for(const child of [...root.children]){
 if(child.classList.contains('out'))child.remove();
}}
setInterval(()=>{if(document.hidden)return;modalState();pruneAnnouncements()},1200);
const server=()=>window.AMBER_CLOUD;
const online=()=>!!(server()?.getStatus?.()?.cloudReady&&server()?.getUser?.()?.id&&server()?.getClient?.());
let currentUser='',cards=Object.freeze({}),loaded=false,busy=false,last=0,failures=0;
function count(name,boss){
 if(!online())return null; // Offline previews may use their existing local counters.
 const n=Number(cards[String(name)]||0);
 // V291 collects verified normal-monster kills; boss progression stays unverified
 // until a separate server-side boss receipt integration is completed.
 if(boss)return 0;
 return Number.isSafeInteger(n)&&n>=0?n:0;
}
async function refresh(force=false){
 if(!online()){loaded=false;cards=Object.freeze({});currentUser='';return false}
 const id=String(server().getUser().id);
 if(currentUser!==id){currentUser=id;loaded=false;cards=Object.freeze({});last=0}
 if(busy || (!force&&Date.now()-last<10000))return loaded;
 busy=true;last=Date.now();
 try{
  const {data,error}=await server().getClient().rpc('amber_v291_verified_cards');
  if(error)throw error;
  if(!data?.ok||!data.cards||typeof data.cards!=='object'||Array.isArray(data.cards))throw Error('INVALID_VERIFIED_CARDS');
  const next=Object.create(null);
  for(const [key,value] of Object.entries(data.cards)){
    const n=Number(value);if(typeof key==='string'&&key.length<=120&&Number.isSafeInteger(n)&&n>=0&&n<=10000000) next[key]=n;
  }
  // Ignore stale results after a switch to another account.
  if(currentUser===String(server()?.getUser?.()?.id||'')){
    cards=Object.freeze(next);loaded=true;failures=0;last=Date.now();
  }
  return loaded;
 }catch(e){failures++;last=Date.now();console.warn('[V303] verified card read failed',e);return false}
 finally{busy=false}
}
window.AMBER_V303_CARDS=Object.freeze({count,refresh,ready:()=>loaded&&online(),snapshot:()=>({...cards})});
window.AMBER_V303_UNIFY=Object.freeze({version:'30.3',modalState});
window.addEventListener('focus',()=>void refresh(true));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh(true)});
setInterval(()=>{if(!document.hidden)void refresh(false)},12000);
void refresh(true);
console.info('[AMBER V30.3] unified modern UI and verified card progress enabled');
})();
