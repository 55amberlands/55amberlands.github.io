/* 55 AMBERLANDS V29.4 — server-owned world-map boss bridge.
 * Map bosses on eight leveling maps use authenticated V277 attack RPC.
 * World Boss arena & dragon/ice dungeons retain their dedicated RPC paths.
 * This module does not award items, EXP or damage from JavaScript.
 */
(()=>{
 'use strict';
 const RESERVED=new Set(['worldboss','dungeon']);
 const mapBoss=m=>!!(m&&m.boss&&!RESERVED.has(String(m.map||'')));
 const priorChoose=window.chooseMob,priorStart=window.start;
 let pendingTarget=Promise.resolve();
 const message=t=>{try{notify(t)}catch(e){console.warn('[V294]',t,e)}};
 const server=()=>window.AMBER_CLOUD?.getClient?.();
 function canEngage(m){
   if(!m||m.map!==state.map)return false;
   if(Number(m.lv)>Number(state.lv)+5){message('🔒 บอสนี้ต้องมีเลเวลอย่างน้อย '+(Number(m.lv)-5));return false;}
   if(!window.AMBER_V277?.ready?.()){message('🔒 ต้องเชื่อม Supabase ก่อนสู้บอส');return false;}
   return true;
 }
 window.chooseMob=function v294ServerBossTarget(id){
   const m=typeof MONS!=='undefined'?MONS.find(x=>x.id===id):null;
   if(!mapBoss(m))return priorChoose?.(id);
   if(!canEngage(m))return;
   if(state.auto&&typeof stop==='function')stop();
   state.mob=id;
   if(typeof currentHp!=='undefined')currentHp=Number(m.hp)||1;
   try{render()}catch(e){console.warn('[V294] render',e)}
   // The server owns the selected target; a rejected selection can never attack.
   pendingTarget=(async()=>{
     const client=server();if(!client)throw Error('Supabase not ready');
     const {error}=await client.rpc('amber_v277_visual_save',{p_visual:{mob:id}});
     if(error)throw error;
     return id;
   })();
   pendingTarget.catch(err=>message('⚠️ เลือกบอสบนเซิร์ฟเวอร์ไม่สำเร็จ: '+String(err?.message||err).slice(0,70)));
 };
 window.start=async function v294ServerBossStart(){
   const m=typeof mob==='function'?mob():null;
   if(!mapBoss(m))return priorStart?.();
   if(state.auto){if(typeof stop==='function')stop();return;}
   if(!canEngage(m))return;
   if(Number(state.hp)<=0){if(typeof showRevive==='function')showRevive();return;}
   try{const confirmed=await pendingTarget;if(confirmed&&confirmed!==m.id)return;
     if(!canEngage(m))return;
     state.auto=true;
     if(typeof log==='function')log('⚔️ เริ่มสู้ '+m.name+' · ดาเมจและรางวัลตรวจโดย Supabase','sys');
     if(typeof renderScene==='function')renderScene();
     if(typeof timer!=='undefined'&&timer)clearInterval(timer);
     if(typeof timer!=='undefined')timer=setInterval(()=>window.tick?.(),Math.max(840,Math.round(925-(Number(state.stats?.AGI)||0)*2)));
     void window.tick?.();
   }catch(err){message('⚠️ ไม่สามารถเริ่มตีบอส: '+String(err?.message||err).slice(0,80));}
 };
 console.info('[55 AMBERLANDS V29.4] All 8 map bosses routed to verified Supabase combat');
})();
