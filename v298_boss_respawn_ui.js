/* 55 AMBERLANDS V29.8 — server-authoritative map boss respawn presentation.
 * No client-generated EXP/Gold/loot; the RPC and server clock determine availability.
 * Requires V29.4 world-map boss bridge and V29.8 Supabase migration.
 */
(()=>{
 'use strict';
 const boss=m=>!!(m&&m.boss&&!['worldboss','dungeon'].includes(String(m.map||'')));
 const data=new Map();
 const oldChoose=window.chooseMob,oldStart=window.start;
 const bossById=id=>typeof MONS!=='undefined'?MONS.find(x=>x.id===id):null;
 const rpc=()=>window.AMBER_CLOUD?.getClient?.();
 const ready=()=>window.AMBER_CLOUD?.getStatus?.()?.cloudReady===true;
 const tell=text=>{try{notify(text)}catch(e){console.warn('[V298 boss]',text)}};
 let chosenCheck=Promise.resolve(true),chosenSerial=0,mapCheck='',busy=false;
 function left(id){
   const end=data.get(String(id));
   if(!end)return 0;
   const seconds=Math.max(0,Math.ceil((end-Date.now())/1000));
   if(!seconds)data.delete(String(id));
   return seconds;
 }
 function countdown(id){const seconds=left(id);return seconds?`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`:'';}
 function markDead(id,time){
   const m=bossById(id);if(!boss(m))return;
   const until=Date.parse(String(time||''));
   if(Number.isFinite(until)&&until>Date.now())data.set(String(id),until);
   paint();
 }
 function ingest(entry){
   if(!entry||!boss(bossById(entry.monster_id)))return;
   if(entry.respawning===true)markDead(entry.monster_id,entry.respawn_at);
   else data.delete(String(entry.monster_id));
 }
 async function status(id){
   const client=rpc();if(!ready()||!client)throw Error('ยังไม่ได้เชื่อม Supabase');
   const {data:answer,error}=await client.rpc('amber_v298_map_boss_status',
     id?{p_monster_id:String(id)}:{p_monster_id:null});
   if(error)throw error;
   if(answer?.ok!==true)throw Error('เซิร์ฟเวอร์ไม่ยืนยันสถานะเกิดบอส');
   if(id){ingest(answer);paint();return answer;}
   for(const row of answer.bosses||[])ingest(row);
   paint();return answer;
 }
 function paint(){
   const selected=bossById(typeof state!=='undefined'?state.mob:null);
   try{
     const list=document.getElementById('monsters');
     if(list)for(const btn of list.querySelectorAll('button.monster')){
       const parsed=String(btn.getAttribute('onclick')||'').match(/chooseMob\(['"]([^'"]+)['"]\)/);
       if(!parsed||!boss(bossById(parsed[1])))continue;
       const leftSec=left(parsed[1]);
       let tag=btn.querySelector('.amber298-wait');
       if(leftSec){
         btn.disabled=true;btn.dataset.amber298Locked='1';
         if(!tag){tag=document.createElement('span');tag.className='amber298-wait';btn.appendChild(tag)}
         tag.textContent='⏳ '+countdown(parsed[1]);
       }else{
         if(btn.dataset.amber298Locked==='1'){btn.disabled=false;delete btn.dataset.amber298Locked}
         tag?.remove();
       }
     }
     const panel=document.getElementById('mobdetails');
     if(panel){panel.querySelector('.amber298-panel-wait')?.remove();
       if(boss(selected)&&left(selected.id)){
         const badge=document.createElement('div');badge.className='amber298-panel-wait';
         badge.textContent='🔒 บอสถูกกำจัดแล้ว · เกิดใหม่ใน '+countdown(selected.id);
         panel.appendChild(badge);
       }
     }
     if(boss(selected)&&left(selected.id)){
       const startBtn=document.getElementById('autobtn'),onceBtn=document.getElementById('oncebtn');
       if(startBtn){startBtn.disabled=true;startBtn.dataset.amber298Locked='1';}
       if(onceBtn){onceBtn.disabled=true;onceBtn.dataset.amber298Locked='1';}
     }else{
       const startBtn=document.getElementById('autobtn');
       if(startBtn?.dataset.amber298Locked==='1'){startBtn.disabled=false;delete startBtn.dataset.amber298Locked;}
       const onceBtn=document.getElementById('oncebtn');
       if(onceBtn?.dataset.amber298Locked==='1'){onceBtn.disabled=!!state.auto;delete onceBtn.dataset.amber298Locked;}
     }
   }catch(e){console.warn('[V298 paint]',e)}
 }
 window.chooseMob=function v298Choose(id){
   const m=bossById(id);
   if(!boss(m))return oldChoose?.(id);
   const wait=left(id);
   if(wait){tell('🔒 '+m.name+' ยังไม่เกิดใหม่ · เหลือ '+countdown(id));paint();return;}
   const seq=++chosenSerial;
   oldChoose?.(id); // V29.4 synchronizes visual target on the server.
   chosenCheck=status(id).then(answer=>{
     if(seq!==chosenSerial)return false;
     if(answer.respawning===true){
       if(typeof stop==='function'&&state.auto)stop();
       tell('🔒 '+m.name+' ยังไม่เกิดใหม่ · เหลือ '+countdown(id));
       return false;
     }
     return true;
   }).catch(e=>{tell('⚠️ ตรวจเวลาบอสไม่ได้: '+String(e.message||e).slice(0,85));return false;});
 };
 window.start=async function v298Start(){
   const m=typeof mob==='function'?mob():null;
   if(!boss(m))return oldStart?.();
   if(left(m.id)){tell('🔒 '+m.name+' จะเกิดใหม่ใน '+countdown(m.id));paint();return;}
   if(!(await chosenCheck)){
     // Retry a fresh server status rather than permanently blocking this target.
     try{const again=await status(m.id);if(again.respawning)return;}
     catch(err){tell('⚠️ ตรวจเวลาบอสไม่ได้: '+String(err?.message||err).slice(0,70));return;}
   }
   try{
     const answer=await status(m.id);
     if(answer.respawning){tell('🔒 '+m.name+' จะเกิดใหม่ใน '+countdown(m.id));return;}
     return oldStart?.();
   }catch(e){tell('⚠️ บอสยังไม่พร้อม: '+String(e.message||e).slice(0,80));}
 };
 async function refresh(){if(busy||!ready())return;busy=true;
   try{await status(null)}catch(e){console.warn('[V298 boss refresh]',e)}finally{busy=false;paint()}}
 const css=document.createElement('style');
 css.textContent='.amber298-wait{display:block!important;color:#ffd977!important;font-size:11px;font-weight:800;margin-top:4px}.amber298-panel-wait{margin-top:6px;padding:7px;background:#37200c;border:1px solid #dca348;color:#ffe59d;border-radius:8px;font-size:12px}.monster[data-amber298-locked="1"]{opacity:.60;cursor:not-allowed}';
 document.head.appendChild(css);
 window.AMBER_V298=Object.freeze({markDead,refresh,isLocked:id=>left(id)>0,countdown,version:'29.8'});
 let lastMap='';
 setInterval(()=>{
   paint();
   const map=typeof state!=='undefined'?state.map:'';
   if(map && map!==lastMap){lastMap=map;setTimeout(refresh,700)}
 },1000);
 setInterval(refresh,30000);
 setTimeout(refresh,2200);
 console.info('[55 AMBERLANDS V29.8] Map bosses wait for Supabase respawn clock');
})();
