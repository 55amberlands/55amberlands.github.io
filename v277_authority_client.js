/* 55 AMBERLANDS V27.7 -- SERVER-OWNED ACTIONS
 * Browser only sends intents. No damage/Gold/EXP/upgrade outcome is accepted from JS.
 * Incomplete legacy systems MUST NOT be treated as securely migrated.
 */
(() => {
'use strict';
let busy=false;
const C=()=>window.AMBER_CLOUD;
const ready=()=>Boolean(C()?.getStatus?.()?.cloudReady && C()?.getClient?.());
const tell=t=>{try{notify(t)}catch{console.log(t)}};
function apply(serverSave){
 if(!serverSave||typeof serverSave!=='object')throw Error('INVALID_SERVER_SAVE');
 const auto=!!state.auto,logNow=Array.isArray(state.log)?state.log:[];
 state={...starter(),...serverSave,auto,log:logNow};
 save();render();
}
async function invoke(proc,args,{silent=false}={}){
 if(!ready())throw Error('ต้องเชื่อม Supabase ก่อน');
 if(busy)throw Error('ระบบกำลังทำรายการ');
 busy=true;
 try{
   const {data,error}=await C().getClient().rpc(proc,args);
   if(error)throw error;
   if(!data?.ok||!data.save)throw Error('SERVER_DID_NOT_CONFIRM');
   apply(data.save);
   return data;
 }catch(e){
   console.warn('[V27.7 RPC]',proc,e);
   if(!silent)tell('🛡️ Supabase ปฏิเสธรายการ: '+String(e.message||e).slice(0,95));
   throw e;
 }finally{busy=false}
}
const economy=(action,args)=>invoke('amber_v277_economy',{p_action:action,p_args:args});
const inventory=(action,id)=>invoke('amber_v277_inventory',{p_action:action,p_item_id:id});
const recovery=(action,id=null)=>invoke('amber_v277_recovery',{p_action:action,p_id:id});
let selectedShopItemId=null;
document.addEventListener('pointerdown',evt=>{const tile=evt.target.closest?.('[data-am21-shop-bag]');if(tile)selectedShopItemId=tile.dataset.am21ShopBag;},true);

// V27.7 replaces the final wrapped tick (including legacy random local drops).
window.tick=async function v277ServerTick(){
 if(!ready()||busy)return;
 const m=mob();
 if(!m||m.boss){if(state.auto)stop();tell('👑 บอสต้องเข้าเรดหรือดันเจียนที่ Supabase ตรวจสอบ');return;}
 const oldLevel=Number(state.lv)||1;
 const lastAuto=!!state.auto;
 const usable=SKILLS.filter(x=>state.learned.includes(x.id)&&!x.buff&&state.mp>=x.mp);
 const queued=window.AMBER_V12?.takeQueuedSkill?.(usable)
   || (state.auto && state.autoSkill && usable.length && Math.random()<0.35
       ? usable[Math.floor(Math.random()*usable.length)] : null);
 try{
   const r=await invoke('amber_v277_attack',{p_monster_id:m.id,p_skill_id:queued?.id||null},{silent:true});
   currentHp=Number(r.monster_hp??m.hp);
   if(Number(state.lv)>oldLevel)levelNotice(oldLevel);
   if(Number(r.damage)>0){showDamage(Number(r.damage));window.AMBER_FX?.onBasicHit?.(Number(r.damage),m,{crit:!!r.crit})}
   if(r.killed){log('🛡️ Supabase ยืนยันกำจัด '+m.name+' +' +r.reward_exp+' EXP +' +r.reward_gold+' Gold','good');
      if(r.drop_name)log('🎁 ดรอป: '+r.drop_name+' (ยืนยันบนเซิร์ฟเวอร์)','loot');}
   if(state.hp<=0&&typeof showRevive==='function'){stop();showRevive();}
   renderTop();renderScene();renderBag();
 }catch(e){
   if(String(e.message).includes('COOLDOWN'))return;
   if(lastAuto)stop();
   tell('🛡️ โจมตีไม่สำเร็จ: '+String(e.message||e).slice(0,90));
 }
};

window.buy=async function v277BuyPotion(type){
 try{await economy('buy_potion',{type});tell('✅ Supabase อนุมัติการซื้อยา');}catch{}
};
window.upStat=async function v277Stat(st){try{await economy('allocate_stat',{stat:st});statRows();}catch{}}
window.selectJob=async function v277Job(job){try{await economy('change_job',{job});closeModal();}catch{}}
window.learnSkill=async function v277LearnSkill(id,path){try{await economy('learn_skill',{skill_id:id});showSkillPath(path)}catch{}}
window.enhance=async function v277Enhance(id){
 try{const x=await economy('enhance',{id});const info=x.details||{};
   openGear(id,info.success?'✅ ตีบวกสำเร็จ +'+info.new_level:'❌ ตีบวกล้มเหลว เหลือ +'+info.new_level);
 }catch{}
};
window.sellG=async function v277SellGear(id){
 try{await inventory('sell_gear',id);closeModal();tell('✅ Supabase ยืนยันการขาย');}catch{}
};
window.equipG=async function v277EquipGear(id){
 try{await inventory('equip',id);openGear(id);}catch{}
};
window.sellItem=async function v277SellItem(index){
 const id=state.bag?.[index]?.id;
 if(!id)return;
 try{await inventory('sell_item',id);closeModal();}catch{}
};
if(window.AMBER_V12)window.AMBER_V12.buyNpc=async function v277BuyNpc(job,slot,level){
 try{await economy('npc_gear',{job,slot,level});window.AMBER_V12.shopRefresh?.();}catch{}
};
window.usePotion=async function v277UsePotion(type,auto=false){
 if(!['hp','mp'].includes(type))return false;
 try{await recovery(type);return true;}catch{return false}
};
window.reviveCharacter=async function v277Revive(){
 try{await recovery('revive');document.getElementById('amberRevive')?.remove();}catch{}
};

// Item Shop's original purchase/equip/use callbacks are local closures.
// Capture the controls before their local handlers run, then invoke Supabase.
document.addEventListener('click',async evt=>{
 const el=evt.target.closest?.('[data-am20-buy],[data-am20-equip],[data-am20-use],#amber20Unequip,#amber21BagEquip,#amber21BagUse');
 if(!el)return;
 evt.preventDefault();evt.stopImmediatePropagation();
 try{
   if(el.matches('[data-am20-buy]')){
     const sku=el.dataset.am20Buy;
     if(!confirm('ยืนยันซื้อ '+sku+' ผ่าน Supabase?'))return;
     await economy('buy_shop',{sku});window.AMBER_ITEM_SHOP?.open?.();return;
   }
   if(el.id==='amber20Unequip'){await economy('equip_wing',{id:null});window.AMBER_ITEM_SHOP?.showCostumes?.();return;}
   if(el.matches('[data-am20-equip]')){
     await economy('equip_wing',{id:el.dataset.am20Equip});window.AMBER_ITEM_SHOP?.showCostumes?.();return;
   }
   if(el.matches('[data-am20-use]')){
     await recovery('consume_shop',el.dataset.am20Use);window.AMBER_ITEM_SHOP?.open?.();return;
   }
   if(el.id==='amber21BagEquip'){
     const id=selectedShopItemId;
     if(!id)throw Error('ไม่พบปีก');
     await economy('equip_wing',{id:state.shop20?.equipped===id?null:id});window.openInventory?.();return;
   }
   if(el.id==='amber21BagUse'){
     // Use the id from the visible item-details modal, not arbitrary user input.
     const item=(state.shop20?.owned||[]).find(x=>x.id===selectedShopItemId && ['reset_skill','reset_stat'].includes(x.sku));
     if(!item)throw Error('ไม่พบไอเทมนี้');
     await recovery('consume_shop',item.id);window.openInventory?.();return;
   }
 }catch(e){tell('🛡️ รายการไม่สำเร็จ: '+String(e.message||e).slice(0,90))}
},true);

// Change-map/target is visual only, but must sync immediately so the server can validate next attack.
const originalChooseMap=window.chooseMap;
window.chooseMap=function v277Map(id){
 originalChooseMap?.(id);
 if(ready())C().getClient().rpc('amber_v277_visual_save',{p_visual:{map:state.map,mob:state.mob}})
  .then(({error})=>{if(error)tell('ย้ายแผนที่ไม่สำเร็จ: '+error.message)});
};
const originalChooseMob=window.chooseMob;
window.chooseMob=function v277Mob(id){
 originalChooseMob?.(id);
 if(ready())C().getClient().rpc('amber_v277_visual_save',{p_visual:{mob:state.mob}})
  .then(({error})=>{if(error)tell('เลือกมอนสเตอร์ไม่สำเร็จ: '+error.message)});
};
window.AMBER_V277={version:'27.7',mode:'SERVER_ACTION_RPC',ready,invoke,combat:'38 normal monsters',shop:'server',enhance:'server',inventory:'server'};
console.info('[AMBER V27.7] Server-authoritative actions installed');
})();
