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
#amber312-panel{background:#0c1932;color:#f0f4ff;border:1px solid #86b5f6;border-radius:12px;padding:12px;margin:14px 0;font:13px/1.5 system-ui}
#amber312-panel h3{color:#ffe497;font:900 18px system-ui;margin:0 0 7px}
#amber312-panel p{margin:7px 0}
#amber312-panel button{padding:9px 11px;border-radius:8px;border:1px solid #7eb5e6;background:#173a63;color:white;font:700 13px system-ui;margin:4px 5px 4px 0;min-height:40px}
#amber312-panel button:disabled{opacity:.55;cursor:wait}
#amber312-panel .amber312-status{padding:8px;background:#071327;border-radius:8px;margin-top:9px;color:#b5edcf}
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
 if(!last)return 'กดตรวจสถานะ เพื่อดูข้อมูลจากเซิร์ฟเวอร์';
 if(!last.active&&!Number(last.pending_kills))return '⏹ ไม่ได้เปิดฟาร์มปิดจอ';
 const progress='กำจัด '+fmt(last.pending_kills)+' ตัว · EXP '+fmt(last.pending_exp)+' · Gold '+fmt(last.pending_gold)+' · วัตถุดิบ '+fmt(Number(last.pending_gw)+Number(last.pending_ga));
 return (last.active?'🟢 เซิร์ฟเวอร์กำลังฟาร์ม':'🎁 มีรางวัลที่ยังไม่ได้รับ')+' · '+String(last.monster_name||last.monster_id||'')+' · '+progress;
}
function redraw(){
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
   toast('🎁 รับผลฟาร์ม '+fmt(data.kills)+' ตัว · EXP +'+fmt(data.exp)+' · Gold +'+fmt(data.gold));
   await actionStatus();
  }else if(kind==='start')toast('🟢 เปิดฟาร์มบนเซิร์ฟเวอร์แล้ว · สามารถดับจอมือถือได้');
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
 if($('amber312-panel')){$('amber312-panel').remove();}
 styles();
 const box=document.createElement('section');box.id='amber312-panel';
 const title=document.createElement('h3');title.textContent='🌙 ประหยัดพลังงาน / ฟาร์มปิดจอ';
 const para=document.createElement('p');para.textContent='โหมดฟาร์มปิดจอใช้ Supabase ทำงานทุก 1 นาที สะสม EXP, Gold และวัตถุดิบจากมอนทั่วไปในแมพปัจจุบัน กดหยุดเพื่อรับรางวัลเข้าตัวละคร (ไม่มีการสุ่มอาวุธหรือบอสในโหมดนี้)';
 box.append(title,para);
 for(const [key,label] of [['start','▶️ เริ่มฟาร์มปิดจอ'],['stop','⏹ หยุดและรับรางวัล'],['refresh','🔄 ตรวจสถานะ'],['dim','🌑 ประหยัดจอ']]){
  const btn=document.createElement('button');btn.type='button';btn.dataset.afkAction=key;btn.textContent=label;btn.onclick=()=>{if(key==='dim')lightMode(true);else void action(key);};box.appendChild(btn);
 }
 const st=document.createElement('p');st.className='amber312-status';box.appendChild(st);
 const note=document.createElement('p');note.textContent='หลังเริ่มฟาร์ม สามารถกดปุ่ม Power ปิดจอ Android ได้ ตัวละครจะฟาร์มต่อที่เซิร์ฟเวอร์จนกว่าจะกดหยุด ไม่ต้องเปิดแอปค้างไว้ แต่ฟาร์มปกติและฟาร์มปิดจอจะไม่ทำงานซ้อนกัน';
 box.appendChild(note);
 host.appendChild(box);
 redraw();
 void actionStatus();
}
const oldSettings=window.openSettings;
if(typeof oldSettings==='function'){
 window.openSettings=function amber312Settings(){
  const result=oldSettings.apply(this,arguments);
  setTimeout(panel,0);return result;
 };
}
window.AMBER_V312={open:panel,powerSave:lightMode,refresh:actionStatus,status:()=>last};
window.addEventListener('pageshow',()=>{if(ready())void actionStatus();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ready())void actionStatus();});
console.info('[V31.2] Supabase AFK mode and local low-power overlay loaded');
})();