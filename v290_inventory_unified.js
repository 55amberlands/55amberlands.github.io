/* 55 AMBERLANDS V29.0 - one MAIN inventory, authenticated read projection.
   Inventory ownership and quantities come from Supabase RPC, never from client-supplied counts.
   Existing item actions continue using the existing Supabase-verified RPCs.
   Does not move, mint or delete any item, and does not change sprites/assets. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 let generation=0;
 const cats=[['potion','🧪 ยาฟื้นฟู'],['bag','📦 ไอเทมทั่วไป / ของดรอป'],['gear','⚔️ อาวุธและอุปกรณ์'],['material','💎 แร่และหินตีบวกทุกชนิด'],['shop','🪽 ปีก / คอสตูม / Item Shop'],['pet','🐶 สัตว์เลี้ยง / อาหาร / ตำรา']];
 const safeNum=x=>Number.isFinite(Number(x))?Math.max(0,Math.floor(Number(x))):0;
 const notifySafe=s=>typeof window.notify==='function'?notify(s):console.info('[AMBER V290]',s);
 function makeItem(it){
  const el=document.createElement('button');el.type='button';el.className='item amber290-card';
  const kind=String(it.kind||''),id=String(it.id||'');
  const icon=document.createElement('div');icon.className='amber290-art';icon.textContent=String(it.icon||({gear:'⚔️',material:'💎',pet:'🐶',shop:'🪽'}[kind]||'📦'));
  if(kind==='gear'){
   const g=(state.gear||[]).find(x=>String(x.id)===id);
   if(g&&window.PX?.items?.gearURL){try{const img=document.createElement('img');img.className='ic l';img.alt='';img.src=window.PX.items.gearURL(g);icon.textContent='';icon.appendChild(img)}catch{}}
  }
  const title=document.createElement('small');title.textContent=String(it.name||'ไอเทม')+(kind==='gear'&&safeNum(it.enh)>0?' +'+safeNum(it.enh):'');
  const qty=document.createElement('em');qty.textContent='×'+safeNum(it.qty);
  el.append(icon,title,qty);
  if(it.equipped===true)el.title='✅ กำลังสวมใส่';
  if(it.boss===true)el.classList.add('amber-boss-rainbow');
  if(kind==='shop'){el.dataset.am21ShopBag=id;el.classList.add('amber21-shopBagItem')}
  else if(kind==='pet'){el.dataset.am23Item=id;el.classList.add('amber23-item')}
  else el.addEventListener('click',()=>{
   try{
    if(kind==='gear'){
      if(!(state.gear||[]).some(g=>String(g.id)===id)){notifySafe('ข้อมูลอุปกรณ์กำลังซิงก์ กรุณาเข้าเกมใหม่');return}
      if(typeof window.openGear==='function')window.openGear(id);
    }else if(kind==='bag'){
      const ix=(state.bag||[]).findIndex(b=>String(b.id)===id);
      if(ix<0){notifySafe('ข้อมูลกระเป๋ากำลังซิงก์ กรุณาเข้าเกมใหม่');return}
      if(typeof window.itemClick==='function')window.itemClick(ix);
    }else if(kind==='potion'){
      if(window.AMBER_V16?.show)window.AMBER_V16.show('potion',id);
    }else if(kind==='material'){
      if(['gw','ga'].includes(id)&&window.AMBER_V16?.show)window.AMBER_V16.show('material',id);
      else notifySafe('💎 เลือกอุปกรณ์ที่ต้องการตีบวก แล้วใช้แร่จากเมนูอุปกรณ์');
    }
   }catch(e){console.warn('[AMBER V290] item action',e);notifySafe('ไม่สามารถเปิดไอเทมนี้ได้')}
  });
  return el;
 }
 function draw(holder,items){
  holder.replaceChildren();
  const top=document.createElement('p');top.className='hint';top.textContent='🎒 กระเป๋าหลักรวมทุกชนิด · ยืนยันจำนวนจาก Supabase · ไอเทมยังอยู่ที่เดิม ไม่ย้ายซ้ำ';holder.appendChild(top);
  let count=0;
  for(const [kind,title] of cats){const group=items.filter(i=>i&&i.kind===kind&&safeNum(i.qty)>0);if(!group.length)continue;
   count+=group.length;const h=document.createElement('h3');h.textContent=title+' ('+group.length+')';holder.appendChild(h);
   const grid=document.createElement('div');grid.className='inventory amber290-grid';for(const item of group)grid.appendChild(makeItem(item));holder.appendChild(grid);
  }
  if(!count){const p=document.createElement('p');p.className='hint';p.textContent='ยังไม่มีไอเทมในกระเป๋า';holder.appendChild(p)}
 }
 function addPanel(){
  const body=$('modalBody');if(!body)return null;
  const legacy=document.createElement('div');legacy.id='amber290-legacy';
  while(body.firstChild)legacy.appendChild(body.firstChild);
  const main=document.createElement('section');main.id='amber290-main';main.className='amber21-bagSection';
  const loading=document.createElement('p');loading.className='hint';loading.textContent='🔄 กำลังตรวจสอบไอเทมทั้งหมดจาก Supabase…';main.appendChild(loading);
  body.append(main,legacy);
  return {main,legacy,body};
 }
 const old=window.openInventory;
 if(typeof old!=='function')return;
 window.openInventory=function v290OpenMainInventory(...args){
  const result=old.apply(this,args);
  const current=++generation;
  if(!String($('modalTitle')?.textContent||'').includes('กระเป๋า'))return result;
  const panel=addPanel();if(!panel)return result;
  const client=window.AMBER_CLOUD?.getClient?.();
  if(!window.AMBER_V277?.ready?.()||!client){panel.main.textContent='🔒 ต้องเชื่อมต่อ Supabase เพื่อดูกระเป๋าหลัก';return result}
  Promise.resolve(client.rpc('amber_v290_inventory_manifest')).then(({data,error})=>{
   if(current!==generation||!panel.main.isConnected)return;
   if(error||!data?.ok||!Array.isArray(data.items))throw error||Error('INVALID_INVENTORY_RESPONSE');
   // NEVER save a server item projection into state or localStorage: only display it.
   draw(panel.main,data.items);
   const tools=[...panel.legacy.querySelectorAll('button')].filter(b=>/เลือกขายหลายชนิด/.test(b.textContent||''));
   if(tools.length){const btn=document.createElement('button');btn.className='goldbtn';btn.textContent='💰 เลือกขายหลายชนิด';btn.onclick=()=>tools[0].click();panel.main.appendChild(btn)}
   panel.legacy.hidden=true;  // prevent duplicate rows, retain old click handlers when needed
  }).catch(e=>{
   if(current!==generation||!panel.main.isConnected)return;
   console.warn('[AMBER V290] inventory RPC',e);
   panel.main.textContent='⚠️ โหลดกระเป๋าจาก Supabase ไม่สำเร็จ — แสดงกระเป๋าเดิมชั่วคราว';
   panel.legacy.hidden=false;
  });
  return result;
 };
 const st=document.createElement('style');st.id='amber290-inventory-css';st.textContent=`
  #amber290-main{margin:6px 0 15px;padding:9px;border:1px solid #886e47;border-radius:9px;background:#111d2b}
  #amber290-main h3{margin:11px 0 6px;color:#f4d796;font-size:13px}
  #amber290-main .amber290-grid{display:flex;flex-wrap:wrap;gap:7px}
  #amber290-main .amber290-card{width:80px;min-width:74px;max-width:calc(33% - 5px);min-height:87px;padding:5px;cursor:pointer}
  #amber290-main .amber290-art{font-size:24px;min-height:29px}
  #amber290-main .amber290-art img{width:32px;height:32px;object-fit:contain}
  #amber290-main .amber290-card small{white-space:normal;overflow-wrap:anywhere;line-height:1.2}
  #amber290-main .amber290-card em{font-size:11px}
  #amber290-legacy[hidden]{display:none!important}`;document.head.appendChild(st);
 // Previous enhance UI tried to consume ores locally, bypassing authority.
 // Send any optional ore to the server and consume it only after the confirmed RPC.
 const originalEnhance=window.enhance;
 if(typeof originalEnhance==='function')window.enhance=async function v290Enhance(id){
  const ore=$('amber232OreChoice')?.value||'';
  if(!ore)return originalEnhance(id);
  if(!['ore_fire','ore_ice','ore_prism'].includes(ore)){notifySafe('ชนิดแร่ไม่ถูกต้อง');return}
  try{
   if(!window.AMBER_V277?.ready?.())throw Error('ต้องเชื่อม Supabase');
   const r=await window.AMBER_V277.invoke('amber_v277_economy',{p_action:'enhance',p_args:{id,ore}});
   const d=r.details||{};
   if(typeof window.openGear==='function')window.openGear(id,d.success?'✅ ตีบวกสำเร็จ +'+d.new_level:'❌ ตีบวกล้มเหลว เหลือ +'+d.new_level);
   if(typeof window.renderBag==='function')window.renderBag();
  }catch(e){console.warn('[AMBER V290] enhance ore',e);notifySafe('Supabase ปฏิเสธการตีบวกแร่: '+String(e.message||e).slice(0,85))}
 };
 window.AMBER_V290=Object.freeze({version:'29.0',manifest:'server',enhancementOre:'server'});
 console.info('[AMBER V29.0] Server-projected unified inventory');
})();
