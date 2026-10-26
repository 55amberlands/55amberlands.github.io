/* V30.1.4 safe dual-boss announcements.
 * Existing V25 banner is for the OLD boss, renamed to บอสแร่ in its source.
 * This NEW V28 banner is a separate small sibling BELOW it; it never hijacks old battle logic.
 * The browser countdown is informational. Server RPC enforces actual event time.
 */
(() => {
'use strict';
if (window.AMBER_V3014_BANNERS) return;
const HOUR=3600000, THAI=7*HOUR, EVERY=3*HOUR, OPEN=30*60000;
let clockSkew=0, clockOk=false, lastClockAttempt=0;
const now=()=>Date.now()+clockSkew;
const fmt=ms=>{
 const s=Math.max(0,Math.floor(ms/1000));
 return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
};
function windowInfo(t){
  // Event schedule is midnight, 03,06... Thailand time, regardless of device timezone.
  const start=Math.floor((t+THAI)/EVERY)*EVERY-THAI;
  const open=t>=start&&t<start+OPEN;
  return {open,start,end:start+OPEN,next:open?start:start+EVERY,
    left:open?start+OPEN-t:start+EVERY-t};
}
const root=document.createElement('div');root.id='amber3014-v28-announcement';
root.style.cssText='position:fixed;z-index:9100;display:none;left:50%;transform:translateX(-50%);max-width:92vw;min-width:min(290px,88vw);box-sizing:border-box;padding:8px 12px;border:2px solid #96dfff;border-radius:10px;color:#fff5ce;text-align:center;background:#141d3beb;box-shadow:0 2px 12px #000a;cursor:pointer;font:700 12px/1.35 system-ui;pointer-events:auto';
root.setAttribute('role','button');root.tabIndex=0;root.title='บอสโลก V28 ใหม่ 10 ตัว';
root.addEventListener('click',()=>window.AMBER_V28_HUB?.open?.('select'));
root.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();root.click();}});
(document.body||document.documentElement).appendChild(root);
function paint(){
  const original=document.querySelector('.px25-wb');
  if(original){
    const r=original.getBoundingClientRect();
    const shown=getComputedStyle(original).display!=='none' && r.height>0;
    root.style.top=Math.round(shown?r.bottom+7:Math.max(7,Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sat')||'7')))+'px';
  } else root.style.top='7px';
  const w=windowInfo(now());
  // Banner only 30 minutes before spawn or during the 30-minute spawn window.
  if(!window.AMBER_V28_HUB || (!w.open && w.left>30*60000)){
    root.style.display='none';return;
  }
  root.style.display='block';
  root.textContent=w.open
   ? '🐉 บอสโลก V28 เปิดแล้ว! เหลือ '+fmt(w.left)+' · แตะเลือกบอส 10 ตัว'
   : '🐉 บอสโลก V28 เกิดใน '+fmt(w.left)+' · แตะดูสมุดบอส';
  root.style.borderColor=w.open?'#ffc95b':'#96dfff';
}
// Optional low-cost read-only clock RPC; if absent, use local time only for display.
async function refreshClock(){
 const c=window.AMBER_CLOUD;
 if(!c?.getStatus?.()?.cloudReady || !c?.getClient?.())return;
 const started=Date.now();
 try{
   const {data,error}=await c.getClient().rpc('amber_v28_clock');
   if(error||!data?.ok||!Number.isFinite(Number(data.epoch_ms)))return;
   clockSkew=Number(data.epoch_ms)-((started+Date.now())/2);
   clockOk=true;
 }catch(e){}
}
function tick(){paint();const t=Date.now();if(t-lastClockAttempt>5*60000){lastClockAttempt=t;void refreshClock();}}
window.AMBER_V3014_BANNERS={windowInfo,clockVerified:()=>clockOk};
tick();setInterval(tick,1000);
})();
