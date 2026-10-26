/* 55 AMBERLANDS V29.6 — Supabase-authoritative EXP bar.
 * Display only. All XP awards, level-ups and required thresholds belong to SQL.
 * This script never sends experience amounts or changes character saves.
 */
(function(){
'use strict';
const requirements=new Map();
let pending=null, lastFailure=0;
const ready=()=>Boolean(window.AMBER_CLOUD?.getStatus?.()?.cloudReady && window.AMBER_CLOUD?.getClient?.());
const level=()=>Number(state?.lv)||1;
const xp=()=>Math.max(0,Number(state?.xp)||0);
const fmt=n=>Math.round(n).toLocaleString('th-TH');
function draw(){
 const el=document.getElementById('pxp'),percentage=document.getElementById('expPercent');
 if(!el||!percentage||typeof state==='undefined')return;
 const fill=el.querySelector('.fill'),label=el.querySelector('.barlabel');
 const lv=level();
 if(lv>=100){
   if(fill)fill.style.width='100%';
   if(label)label.textContent='MAX LEVEL 100';
   percentage.textContent='MAX';
   return;
 }
 const required=requirements.get(lv);
 if(!Number.isSafeInteger(required)||required<=0){
   if(fill)fill.style.width='0%';
   if(label)label.textContent=ready()?'กำลังตรวจสอบ EXP จาก Supabase':'รอเชื่อม Supabase';
   percentage.textContent='รอยืนยัน';
   return;
 }
 const current=xp();
 const pct=Math.max(0,Math.min(100,100*current/required));
 if(fill)fill.style.width=pct.toFixed(2)+'%';
 if(label)label.textContent=fmt(current)+' / '+fmt(required);
 percentage.textContent=pct.toFixed(1)+'%';
 el.title='EXP จาก Supabase · '+fmt(current)+' / '+fmt(required)+' · อีก '+fmt(Math.max(0,required-current))+' EXP';
}
async function sync(force=false){
 if(!ready()||pending||level()>=100)return;
 if(!force&&requirements.has(level()))return;
 if(Date.now()-lastFailure<5000)return;
 const sb=window.AMBER_CLOUD.getClient();
 pending=Promise.resolve().then(()=>sb.rpc('amber_v296_exp_progress')).then(({data,error})=>{
   if(error)throw error;
   if(!data?.ok||Number(data.curve_version)!==296)throw new Error('V296_EXP_RESPONSE_UNTRUSTED');
   const lv=Number(data.level),req=Number(data.required);
   if(Number.isInteger(lv)&&lv>=1&&lv<100&&Number.isSafeInteger(req)&&req>0){
     requirements.set(lv,req);
   }
   // Never overwrite player's level, XP, money or inventory from a progress read.
   draw();
 }).catch(err=>{
   lastFailure=Date.now();
   console.warn('[55 AMBERLANDS V29.6 EXP]',String(err?.message||err));
 }).finally(()=>{pending=null;});
 return pending;
}
const previousRenderTop=window.renderTop;
if(typeof previousRenderTop!=='function'){
 console.warn('[V29.6 EXP] renderTop not ready; XP client not installed');
 return;
}
window.renderTop=function v296ServerExpRenderTop(){
 const result=previousRenderTop.apply(this,arguments);
 draw();
 if(!requirements.has(level())&&ready())void sync();
 return result;
};
window.AMBER_V296_EXP=Object.freeze({
 version:'29.6',refresh:()=>sync(true),status:()=>({level:level(),required:requirements.get(level())||null,ready:ready()})
});
document.addEventListener('visibilitychange',()=>{
 if(!document.hidden&&ready())void sync(true);
});
setInterval(()=>{if(document.hidden||!ready())return;if(!requirements.has(level()))void sync();},5000);
if(ready())void sync();
})();
