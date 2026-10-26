/* 55 AMBERLANDS V27.8 -- PET ACCOUNTING VIA SERVER RPC.
   Supports V277 single server-authority mutex; no client-provided prices, cooldowns or outcomes.
*/
(()=>{'use strict';
 const inv=()=>window.AMBER_V277?.invoke;
 async function pet(action,sku=null,itemId=null){
   if(!inv())throw new Error('ระบบ Supabase ยังไม่พร้อม');
   return await inv()('amber_v278_pet',{p_action:action,p_sku:sku,p_item_id:itemId},{silent:true});
 }
 async function regen(){
   if(!inv())return false;
   try{return await inv()('amber_v278_pet_regen',{}, {silent:true})}catch{return false}
 }
 window.AMBER_V278=Object.freeze({version:'27.8',pet,regen});
 console.info('[AMBER V27.8] Pet transactions: server only');
})();
