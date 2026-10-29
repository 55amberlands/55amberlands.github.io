/* 55 AMBERLANDS V31.4 - AFK shortcut on the actual realtime game scene.
 * UI-only: the V31.2 Supabase RPC owns all AFK progression and rewards.
 * The browser is NOT required to stay awake after a server-confirmed start.
 */
(()=>{
'use strict';
if(window.AMBER_V314_AFK_BUTTON)return;
const $=id=>document.getElementById(id);
const afk=()=>window.AMBER_V312;
const ready=()=>!!(window.AMBER_CLOUD?.getClient?.()&&window.AMBER_CLOUD?.getStatus?.()?.cloudReady);
let refreshedAt=0,requesting=false;
const css=`
#amber314-afk-game{position:absolute!important;right:8px;bottom:8px;z-index:80!important;
display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
min-height:45px;max-width:min(43%,160px);padding:6px 10px;
border:2px solid #8bbdff;border-radius:12px;color:#fff9d7;background:#132443e8;
box-shadow:0 2px 10px #000b;cursor:pointer;pointer-events:auto;
font:800 12px/1.2 system-ui;text-align:center;touch-action:manipulation}
#amber314-afk-game:active{transform:scale(.97)}
#amber314-afk-game[data-state=on]{border-color:#58e7a7;background:#103d32eb}
#amber314-afk-game[data-state=claim]{border-color:#ffd878;background:#42310fea}
#amber314-afk-game .amber314-sub{font:600 10px/1.15 system-ui;color:#cee1f2}
@media(max-width:460px){#amber314-afk-game{right:5px;bottom:5px;padding:5px 7px;min-height:42px;font-size:11px}}
`;
function styles(){
 if($('amber314-afk-style'))return;
 const el=document.createElement('style');el.id='amber314-afk-style';el.textContent=css;
 document.head.appendChild(el);
}
function openPanel(){
 if(typeof window.openModal!=='function'||!afk()?.open){
  try{notify('ยังไม่พร้อมเปิดระบบ AFK กรุณาเข้าเกมออนไลน์ใหม่')}catch(_){}
  return;
 }
 window.openModal('🤖 บอทปิดจอ · Supabase 24 ชั่วโมง','<div id="amber314-afk-panel"></div>');
 afk().open();
 refresh(true);
}
function mount(){
 const scene=$('scene');if(!scene||!afk())return;
 // V31.2 may already supply the on-scene AFK button. Never stack two buttons.
 if($('amber312-scene')){$('amber314-afk-game')?.remove();return;}
 styles();
 let btn=$('amber314-afk-game');
 if(btn?.parentNode===scene)return;
 if(btn)btn.remove();
 btn=document.createElement('button');
 btn.type='button';btn.id='amber314-afk-game';
 btn.setAttribute('aria-label','เปิดหน้าต่างบอทปิดจอ AFK บนเซิร์ฟเวอร์');
 btn.innerHTML='<span class="amber314-main">🤖 บอทปิดจอ</span><span class="amber314-sub">AFK ออนไลน์ 24 ชม.</span>';
 btn.addEventListener('click',e=>{e.stopPropagation();openPanel();});
 scene.appendChild(btn);
 paint();
}
function timeLeft(end){
 const endMs=Date.parse(String(end||''));
 if(!Number.isFinite(endMs))return '';
 const s=Math.max(0,Math.floor((endMs-Date.now())/1000));
 return s?Math.floor(s/3600)+'ชม. '+Math.floor(s%3600/60)+'น.':'ครบเวลา';
}
function paint(){
 const btn=$('amber314-afk-game');if(!btn)return;
 const status=afk()?.status?.();
 const active=!!status?.active;
 const pending=Number(status?.pending_kills||0)>0 || Number(status?.pending_gear||0)>0 ||
               Number(status?.pending_gold||0)>0 || Number(status?.pending_exp||0)>0;
 const state=active?'on':pending?'claim':'off';
 btn.dataset.state=state;
 const main=btn.querySelector('.amber314-main');
 const sub=btn.querySelector('.amber314-sub');
 if(main)main.textContent=active?'🟢 บอทปิดจอทำงาน':pending?'🎁 รับรางวัล AFK':'🤖 บอทปิดจอ';
 if(sub)sub.textContent=active?'เหลือ '+timeLeft(status.expires_at):
      pending?'แตะรับ EXP / ไอเทม':'AFK ออนไลน์สูงสุด 24 ชม.';
 btn.title=active?'บอททำงานบน Supabase แม้ปิดหน้าจอ Android':'แตะเพื่อเริ่มหรือรับรางวัล AFK';
}
async function refresh(force=false){
 if($('amber312-scene'))return; // the built-in AFK module already refreshes status
 if(!ready()||!afk()?.refresh||requesting)return;
 if(!force&&Date.now()-refreshedAt<25000)return;
 refreshedAt=Date.now();requesting=true;
 try{await afk().refresh();}catch(e){console.warn('[AFK 31.4] status',e)}
 finally{requesting=false;paint();}
}
function tick(){
 mount();
 if($('amber312-scene'))return;
 paint();if(!document.hidden)void refresh();
}
window.addEventListener('pageshow',()=>{mount();void refresh(true)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){mount();void refresh(true)}});
window.AMBER_V314_AFK_BUTTON={open:openPanel,refresh:()=>refresh(true)};
mount();void refresh(true);setInterval(tick,2000);
})();