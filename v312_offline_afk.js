/* 55 AMBERLANDS V31.2 — server AFK farm / power saver. Mobile Chrome safe.
 * Offline earnings run on Supabase pg_cron, never with a background browser timer.
 * The display-only saver does not fake hits, drops or server wallet writes.
 */
(()=>{
'use strict';
if(window.AMBER_V312)return;
let busy=false,last=null,dim=false,lastSync=0;
const rpc=(action,monster)=>window.AMBER_CLOUD?.getClient?.()?.rpc('amber_v312_afk',{p_action:action,p_monster_id:monster||null});
const ready=()=>!!(window.AMBER_CLOUD?.getUser?.()?.id&&window.AMBER_CLOUD?.getStatus?.()?.cloudReady&&window.AMBER_CLOUD?.getClient?.());
const $=id=>document.getElementById(id);
const fmt=x=>Math.max(0,Number(x)||0).toLocaleString('th-TH');
function toast(s){try{notify(s)}catch(e){console.info('[AFK]',s)}}
const css=`
#amber312-quick{flex:1 1 180px!important;min-height:52px!important;background:linear-gradient(120deg,#1d5262,#114e42)!important;color:#f5fff7!important;border:2px solid #8feec5!important;border-radius:10px!important;font:900 14px/1.3 system-ui!important;box-shadow:0 0 12px #33e8ad44!important}
#amber312-quick.amber312-on,#amber312-scene.amber312-on{border-color:#d4ff8a!important;background:linear-gradient(130deg,#1b6348,#164c36)!important}
#amber312-scene{position:absolute!important;right:7px!important;bottom:7px!important;z-index:65!important;min-height:36px!important;padding:5px 9px!important;border:2px solid #8feec5!important;border-radius:10px!important;background:#103b3de8!important;color:#fafff1!important;font:900 11px/1.2 system-ui!important;box-shadow:0 2px 9px #0018!important;pointer-events:auto!important;max-width:150px!important}
#amber312-scene:active,#amber312-quick:active{transform:scale(.97)}
#amber312-panel{box-sizing:border-box;max-width:100%;background:#0c1932;color:#f0f4ff;border:1px solid #86b5f6;border-radius:12px;padding:12px;margin:6px 0;font:13px/1.5 system-ui;overflow-wrap:anywhere}
#amber312-panel h3{color:#ffe497;font:900 18px system-ui;margin:0 0 7px}
#amber312-panel p{margin:7px 0}
#amber312-panel button{padding:9px 11px;border-radius:8px;border:1px solid #7eb5e6;background:#173a63;color:white;font:700 13px system-ui;margin:4px 5px 4px 0;min-height:40px}
#amber312-panel button:disabled{opacity:.55;cursor:wait}
#amber312-panel .amber312-status{white-space:pre-line;padding:10px;background:#071327;border-radius:8px;margin:9px 0;color:#b5edcf;font-size:13px;line-height:1.6}
#amber312-panel .amber312-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
#amber312-panel .amber312-actions button{box-sizing:border-box;min-width:0;width:100%;margin:0;white-space:normal;line-height:1.35;min-height:45px}
#amber312-panel .amber312-actions button[data-afk-action=start]{background:#16704f;border-color:#7bffc1}
#amber312-panel .amber312-actions button[data-afk-action=stop]{background:#79431c;border-color:#ffcf86}
#amber312-panel details{margin:10px 0 2px;color:#aecbe3}
#amber312-panel summary{cursor:pointer;font-size:12px;font-weight:700}
body:has(#amber312-panel) #amber312-scene,
body:has(#amber312-panel) #amber314-afk-game{display:none!important}
body:has(#amber312-panel) .px25-wb,
body:has(#amber312-panel) #amber3014-v28-announcement{visibility:hidden!important}
#amber312-dim{position:fixed;inset:0;z-index:1001000;background:#010204;color:#f3e6b2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;text-align:center;font:700 14px/1.5 system-ui;padding:20px;box-sizing:border-box}
#amber312-dim h2{font:900 26px system-ui;margin:0}
#amber312-dim button{background:#233d59;color:white;border:1px solid #a1bad9;border-radius:13px;padding:14px 20px;font:800 16px system-ui;min-width:170px}
html.amber312-saver *:not(#amber312-dim):not(#amber312-dim *){animation-play-state:paused!important;transition-duration:0s!important}
`;
function styles(){if($('amber312-css'))return;const st=document.createElement('style');st.id='amber312-css';st.textContent=css;document.head.appendChild(st);}
function lightMode(on){
 dim=!!on;styles();$('amber312-dim')?.remove();document.documentElement.classList.toggle('amber312-saver',dim);
 if(!dim)return;
 const cover=document.createElement('div');cover.id='amber312-dim';
 const heading=document.createElement('h2');heading.textContent='🌙 โหมดประหยัดพลังงาน';
 const info=document.createElement('p');info.textContent=last?.active?'กำลังฟาร์มบน Supabase · กดปิดหน้าจอมือถือได้':'ลดภาพเคลื่อนไหวและการใช้หน้าจอขณะเปิดเกม';
 const btn=document.createElement('button');btn.type='button';btn.textContent='☀️ กลับเข้าเกม';btn.onclick=()=>lightMode(false);
 cover.append(heading,info,btn);
 document.body.appendChild(cover);
}
function statusText(){
 if(!ready())return '🔒 กรุณาเข้าสู่ระบบ Google และเชื่อมต่อ Supabase';
 if(!last)return 'กำลังตรวจสถานะจากเซิร์ฟเวอร์…';
 const active=!!last.active;
 const count=Number(last.pending_kills)||0;
 const pending=count>0||Number(last.pending_gear)>0||Number(last.pending_exp)>0||Number(last.pending_gold)>0;
 if(!active&&!pending)return '⚪ ยังไม่ได้เปิดบอทปิดจอ\\nเลือกมอนสเตอร์ทั่วไปในแผนที่ก่อนเริ่ม';
 const lines=[active?'🟢 กำลังฟาร์มบนเซิร์ฟเวอร์':'🎁 มีรางวัล AFK รอรับ'];
 lines.push('🎯 '+String(last.monster_name||last.monster_id||'ไม่ทราบชื่อ'));
 const end=Date.parse(String(last.expires_at||''));
 if(Number.isFinite(end))lines.push('⏰ สิ้นสุด '+new Date(end).toLocaleString('th-TH',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'}));
 lines.push('⚔️ กำจัด '+fmt(count)+' ตัว · EXP '+fmt(last.pending_exp));
 lines.push('🪙 Gold '+fmt(last.pending_gold)+' · อุปกรณ์ '+fmt(last.pending_gear)+' ชิ้น');
 lines.push('🧪 ยา HP/MP '+fmt(last.pending_hp_pots)+'/'+fmt(last.pending_mp_pots));
 return lines.join('\\n');
}
function redraw(){
 for(const id of ['amber312-quick','amber312-scene']){
  const btn=$(id);if(!btn)continue;
  btn.classList.toggle('amber312-on',!!last?.active);
  btn.textContent=last?.active?'🟢 บอทปิดจอทำงาน':(Number(last?.pending_kills)>0?'🎁 รับรางวัล AFK':'🌙 บอทปิดจอ');
  btn.title=last?.active?'AFK ฟาร์มบน Supabase ขณะปิดจอได้':'แตะเพื่อเปิด AFK ออนไลน์สูงสุด 24 ชั่วโมง';
  btn.setAttribute('aria-label',btn.textContent);
 }
 const panel=$('amber312-panel');if(!panel)return;
 const msg=panel.querySelector('.amber312-status');if(msg)msg.textContent=statusText();
 for(const btn of panel.querySelectorAll('[data-afk-action]'))btn.disabled=busy||!ready()||(btn.dataset.afkAction==='start'&&!!last?.active);
}
async function action(kind){
 if(busy)return;
 if(kind==='dim'){lightMode(true);return;}
 if(!ready()){toast('🔒 เข้าสู่ระบบออนไลน์ก่อน');return;}
 busy=true;redraw();
 try{
  let monster=null;
  if(kind==='start'){
   const m=typeof mob==='function'?mob():null;
   if(!m||m.boss||m.map==='dungeon'||m.map==='worldboss')throw Error('เลือกมอนสเตอร์ทั่วไปในแมพก่อนเปิดฟาร์ม');
   monster=String(m.id||'');
   if(typeof stop==='function'&&typeof state!=='undefined'&&state.auto)stop();
  }
  const out=await rpc(kind==='refresh'?'status':kind,monster);
  if(out.error)throw out.error;
  const data=out.data;if(!data?.ok)throw Error(data?.reason||'SERVER_AFK_FAILED');
  last=data;lastSync=Date.now();
  if(kind==='stop'){
   if(data.save&&typeof state!=='undefined'){
    state={...state,...data.save,auto:false};
    try{save()}catch(e){console.warn('[AFK] save display',e)}
    try{render()}catch(e){}
    try{renderTop()}catch(e){}
    try{renderBag()}catch(e){}
   }
   toast('🎁 รับ AFK '+fmt(data.kills)+' ตัว · EXP +'+fmt(data.exp)+' · Gold +'+fmt(data.gold)+' · อุปกรณ์ '+fmt(data.gear_received)+' · ของ '+fmt(data.loot_received)+' · ใช้ HP/MP '+fmt(data.hp_pots_used)+'/'+fmt(data.mp_pots_used));
   await actionStatus();
  }else if(kind==='start')toast('🟢 AFK บน Supabase เปิด 24 ชั่วโมง · AUTO สกิล/ยา/ของ เปิด · ปิดจอได้');
 }catch(e){toast('⚠️ โหมดประหยัดพลังงาน: '+String(e.message||e).slice(0,120));}
 finally{busy=false;redraw();}
}
async function actionStatus(){
 if(!ready())return;
 try{const r=await rpc('status');if(!r.error&&r.data?.ok){last=r.data;lastSync=Date.now();}}catch(e){console.warn('[AFK status]',e)}
 redraw();
}
function panel(){
 const host=$('modalBody');
 if(!host)return;
 $('amber312-panel')?.remove();
 styles();
 const box=document.createElement('section');box.id='amber312-panel';
 const title=document.createElement('h3');title.textContent='🌙 AFK ออนไลน์ · 24 ชั่วโมง';
 const para=document.createElement('p');para.textContent='ตีมอนทั่วไป ใช้สกิล/ยา และเก็บของบน Supabase แม้ปิดหน้าจอ Android';
 const st=document.createElement('div');st.className='amber312-status';st.setAttribute('role','status');
 const actions=document.createElement('div');actions.className='amber312-actions';
 for(const [key,label] of [['start','▶ เริ่มบอท'],['stop','■ หยุดและรับของ'],['refresh','↻ ตรวจสถานะ'],['dim','🌑 ประหยัดจอ']]){
  const btn=document.createElement('button');btn.type='button';btn.dataset.afkAction=key;
  btn.textContent=label;btn.onclick=()=>{if(key==='dim')lightMode(true);else void action(key)};
  actions.appendChild(btn);
 }
 const details=document.createElement('details');
 const summary=document.createElement('summary');summary.textContent='รายละเอียดการทำงานและข้อจำกัด';
 const note=document.createElement('p');note.textContent='หลังเริ่มบอท กด Power ปิดจอหรือปิด Chrome ได้ เซิร์ฟเวอร์จะทำงานตามรอบของ Supabase สูงสุด 24 ชั่วโมง ต้องหยุดเพื่อรับ EXP/Gold/ไอเทมจริง และระบบจะหยุดเมื่อ HP หรือยาไม่พอ ไม่รองรับบอสโลก บอสแร่ ดันเจี้ยน หรือ PvP ห้ามโจมตีพร้อม AFK';
 details.append(summary,note);
 box.append(title,para,st,actions,details);
 host.appendChild(box);
 redraw();
 void actionStatus();
}
function openAfk(){
 if(typeof openModal==='function'){
  openModal('🌙 บอทปิดจอ','<p style="color:#c8eadb">กำลังตรวจสถานะ Supabase…</p>');
  panel();
 }else toast('ยังเปิดเมนู AFK ไม่ได้ กรุณาโหลดเกมให้ครบก่อน');
}
function installQuickButtons(){
 styles();
 const sc=$('scene');
 if(sc&&!$('amber312-scene')){
  const btn=document.createElement('button');btn.type='button';btn.id='amber312-scene';
  btn.textContent='🌙 บอทปิดจอ';btn.onclick=openAfk;
  sc.appendChild(btn);
 }
 redraw();
}

window.AMBER_V312={open:openAfk,powerSave:lightMode,refresh:actionStatus,status:()=>last};
window.addEventListener('pageshow',()=>{installQuickButtons();if(ready())void actionStatus();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ready())void actionStatus();});
setInterval(()=>{installQuickButtons();if(ready()&&!document.hidden&&Date.now()-lastSync>30000)void actionStatus();},7000);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{installQuickButtons();if(ready())void actionStatus();},{once:true});
else {installQuickButtons();if(ready())void actionStatus();}
console.info('[V31.4] Screen-off AFK button visible in realtime scene and AUTO controls');
})();