/* 55 AMBERLANDS V28.3 -- SERVER-OWNED ACTIONS
 * Browser only sends intents. No damage/Gold/EXP/upgrade outcome is accepted from JS.
 * Incomplete legacy systems MUST NOT be treated as securely migrated.
 */
(() => {
'use strict';
let busy=false;
// One server action at a time; avoid cancelling AUTO on transient network failures.
let autoRetryAfter=0,autoErrorCount=0;
const blockedAutoSkillIds=new Set(); // V29.3: ignore only server-rejected skills for this session
let slotsPending=false,desiredSlots=null,slotQueue=Promise.resolve();
const C=()=>window.AMBER_CLOUD;
const ready=()=>Boolean(C()?.getStatus?.()?.cloudReady && C()?.getClient?.());
const tell=t=>{try{notify(t)}catch{console.log(t)}};
function apply(serverSave){
 if(!serverSave||typeof serverSave!=='object')throw Error('INVALID_SERVER_SAVE');
 const auto=!!state.auto,logNow=Array.isArray(state.log)?state.log:[];
 state={...starter(),...serverSave,auto,log:logNow};
 // Do not display an obsolete slot snapshot while an explicit edit is saving.
 if(slotsPending && desiredSlots)state.autoSkillSlots=[...desiredSlots];
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

// V28.3: normal-map AUTO uses one atomic server action (optional potion + attack).
// Server validates skill ownership, inventory stock, HP/MP and damage.
window.tick=async function v283ServerTick(){
 if(!ready()||busy||Date.now()<autoRetryAfter)return;
 const m=mob();
 if(!m||(m.boss&&['dungeon','worldboss'].includes(m.map))){if(state.auto)stop();tell('👑 บอสโลกและดันเจียนต้องใช้โหมดเรดที่ Supabase ตรวจสอบ');return;}
 const oldLevel=Number(state.lv)||1;
 const lastAuto=!!state.auto;
 const learned=Array.isArray(state.learned)?state.learned:[];
 const usable=SKILLS.filter(x=>learned.includes(x.id)&&x.job===state.job&&!x.buff&&Number(state.mp)>=Number(x.mp)
    &&(Number(state.v25?.rebirth||0)>0||Number(state.lv)>=Number(x.level||1))
    &&!blockedAutoSkillIds.has(x.id));
 // A manually queued skill is permitted; AUTO only selects the configured 6 slots.
 const manual=window.AMBER_V12?.takeQueuedSkill?.(usable)||null;
 const picked=manual||(lastAuto && state.autoSkill
   ? (window.AMBER_V19?.pickSkill?.(usable)||null):null);
 const params={p_monster_id:m.id,p_skill_id:picked?.id||null};
 if(lastAuto){
   Object.assign(params,{p_auto_potion:!!state.autopot,
     p_hp_threshold:Math.max(1,Math.min(99,Math.round(Number(state.hpthreshold)||70))),
     p_mp_threshold:Math.max(1,Math.min(99,Math.round(Number(state.mpthreshold)||50)))});
 }
 try{
   const r=await invoke(lastAuto?'amber_v283_auto_attack':'amber_v277_attack',params,{silent:true});
    // AMBER298_BOSS_LOCK — server-confirmed response; never mint boss XP/Gold in the client.
    if(r.monster_id && String(r.monster_id)!==String(m.id)){
      if(state.auto && typeof stop==='function')stop();
      tell('⚠️ เป้าหมายฝั่งเซิร์ฟเวอร์ไม่ตรง กรุณาเลือกบอสใหม่');return;
    }
    if(m.boss && r.boss_respawning===true){
      currentHp=0;
      window.AMBER_V298?.markDead?.(m.id,r.respawn_at);
      if(state.auto && typeof stop==='function')stop();
      tell('🔒 '+m.name+' ถูกกำจัดแล้ว ต้องรอเกิดใหม่จึงจะโจมตีและรับรางวัลได้');
      renderScene();return;
    }
   autoErrorCount=0;autoRetryAfter=0;
   currentHp=Number(r.monster_hp??m.hp);
   if(Number(state.lv)>oldLevel)levelNotice(oldLevel);
   if(Number(r.damage)>0){
     showDamage(Number(r.damage));
     // AMBER297_MAP_CRIT: only style damage after the authoritative server reports crit=true.
     if(r.crit===true){
       const sc=document.getElementById('scene');
       const pops=sc?.querySelectorAll('.damage');
       const last=pops?.[pops.length-1];
       if(last){
         last.textContent='✦ CRITICAL! ✦ '+Math.round(Number(r.damage)).toLocaleString('th-TH');
         last.style.cssText+=';font-size:24px;font-weight:1000;color:#fff1a8;background:linear-gradient(130deg,#58340d,#9c6516,#482609);border:2px solid #ffda79;border-radius:8px;padding:4px 8px;box-shadow:0 0 14px #ffcc66;white-space:nowrap;text-shadow:1px 2px 2px #1a0b04;z-index:55;';
       }
     }
     if(picked)window.AMBER_FX?.onAttack?.(picked,Number(r.damage),m);
     else window.AMBER_FX?.onBasicHit?.(Number(r.damage),m,{crit:!!r.crit});
   }
   if(r.auto_hp_used||r.auto_mp_used)log('🧪 AUTO ยา: '+[r.auto_hp_used?'HP':'',r.auto_mp_used?'MP':''].filter(Boolean).join(' + '),'good');
   if(r.killed){
      if(m.boss){
        window.AMBER_V298?.markDead?.(m.id,r.respawn_at);
        currentHp=0;
        if(state.auto && typeof stop==='function')stop();
      }
     log('🛡️ Supabase ยืนยันกำจัด '+m.name+' +'+r.reward_exp+' EXP +'+r.reward_gold+' Gold','good');
     if(r.drop_name)log('🎁 ดรอป: '+r.drop_name+' (ยืนยันบนเซิร์ฟเวอร์)','loot');
   }
   if(state.hp<=0&&typeof showRevive==='function'){stop();showRevive();}
   renderTop();renderScene();renderBag();
 }catch(e){
   const message=String(e.message||e);
   if(/COOLDOWN|ระบบกำลังทำรายการ/.test(message))return;
   if(lastAuto && picked && /SKILL_INVALID|V277_MP_LOW/.test(message)){
     blockedAutoSkillIds.add(picked.id);
     tell('⚠️ AUTO ข้ามสกิลที่เซิร์ฟเวอร์ปฏิเสธ: '+String(picked.name||picked.id).slice(0,40)+' · เปลี่ยนเป็นโจมตีปกติต่อ');
     return;
   }
   const hard=/LEVEL_LOCK|MAP_MISMATCH|MONSTER_NOT_FOUND|SKILL_INVALID|MP_LOW|CHARACTER_DEAD|BAD_SAVE|V283_STATE_INVALID|V283_THRESHOLD_INVALID/i.test(message);
   if(hard){if(lastAuto)stop();tell('🛡️ ต้องตรวจสถานะ AUTO: '+message.slice(0,90));return;}
   // Temporary connection/server error: retry with bounded backoff instead of stopping.
   autoErrorCount=Math.min(5,autoErrorCount+1);
   autoRetryAfter=Date.now()+Math.min(10000,850*Math.pow(2,autoErrorCount));
   if(autoErrorCount===1)tell('⚠️ AUTO รอเชื่อม Supabase อีกครั้ง: '+message.slice(0,70));
   if(autoErrorCount>=5){if(lastAuto)stop();tell('⏹ หยุด AUTO หลังเชื่อมต่อผิดพลาดซ้ำ 5 ครั้ง');}
 }
};
// Original UI/start-stop logic remains; only throttle the loop to the server's 750ms cooldown.
const legacyStart=window.start;
if(typeof legacyStart==='function')window.start=function v283Start(){
 legacyStart();
 if(state.auto && typeof timer!=='undefined' && timer){
   clearInterval(timer);
   timer=setInterval(()=>window.tick(),Math.max(840,Math.round(925-(Number(state.stats?.AGI)||0)*2)));
 }
};
// Save the exact 6 chosen slots on Supabase, not inside the writable legacy save.
async function persistSlots(slots){
 if(!ready())throw Error('ต้องเชื่อม Supabase ก่อนบันทึกช่องสกิล');
 const {data,error}=await C().getClient().rpc('amber_v283_auto_skill_slots',{p_slots:slots});
 if(error)throw error;
 if(!data?.ok)throw Error('V283_SLOTS_NOT_CONFIRMED');
 return data;
}
function saveSlots(slots){
 desiredSlots=Array.isArray(slots)?[...slots]:null;
 if(!desiredSlots||desiredSlots.length!==6)return Promise.reject(Error('ต้องมี 6 ช่องสกิล'));
 slotsPending=true;
 const snapshot=[...desiredSlots];
 slotQueue=slotQueue.catch(()=>{}).then(()=>persistSlots(snapshot)).then(result=>{
   if(JSON.stringify(desiredSlots)===JSON.stringify(snapshot)){
     slotsPending=false;
     state.autoSkillSlots=[...result.slots];
   }
   return result;
 }).catch(err=>{
   slotsPending=false;
   tell('⚠️ บันทึกช่อง AUTO ไม่สำเร็จ: '+String(err.message||err).slice(0,80));
   throw err;
 });
 return slotQueue;
}
window.AMBER_V283={version:'28.3',saveSlots};

window.buy=async function v277BuyPotion(type){
 try{await economy('buy_potion',{type});tell('✅ Supabase อนุมัติการซื้อยา');}catch{}
};
// V29.5: stat allocation is confirmed by Supabase BEFORE updating displayed values.
// The V12 extended combat panel is outside render(); refresh it in-place so the
// modal and its scroll position stay open on mobile. Never locally mint stat points.
window.upStat=async function v295LiveStat(st){
 if(!['STR','DEX','INT','VIT','AGI','LUK'].includes(st))return;
 try{
   const receipt=await economy('allocate_stat',{stat:st});
   if(!receipt?.ok || !receipt?.save)throw Error('STAT_NOT_CONFIRMED');
   statRows();
   window.AMBER_V12?.updateExtended?.();
   window.AMBER_V12?.statStrip?.();
   // The modal's original summary line is not part of render()/statRows().
   // Replace just its numeric text; preserve the points button and its scroll.
   const summary=document.getElementById('statrows')?.previousElementSibling;
   if(summary?.tagName==='P' && summary.textContent.includes('พลังต่อสู้')){
     const power=Math.round((Number(state.stats?.STR)||0)*8+(Number(state.stats?.DEX)||0)*3+(Number(state.lv)||1)*20);
     for(const node of summary.childNodes){
       if(node.nodeType===3 && node.textContent.includes('พลังต่อสู้'))
         node.textContent=node.textContent.replace(/(พลังต่อสู้\s*)[0-9,]+/u,(_,prefix)=>prefix+power.toLocaleString('th-TH'));
     }
   }
 }catch(err){console.warn('[V29.5 live stat refresh]',err);}
};
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
window.AMBER_V277={version:'28.3',mode:'SERVER_ACTION_RPC',ready,invoke,combat:'38 normal monsters',shop:'server',enhance:'server',inventory:'server'};
console.info('[AMBER V28.3] Server-authoritative actions installed');
})();
