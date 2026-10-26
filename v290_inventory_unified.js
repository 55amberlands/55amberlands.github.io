/* 55 AMBERLANDS V29.1 — restore ALL original art + secure universal market.
   Keeps the entire legacy inventory rendering stack (pixel icons, ores, pets, wings, gear)
   untouched; only adds server-verification and a marketplace entry. No items moved locally.
   Server remains sole authority for inventory, market ownership, rolls, wallets. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
let seq=0,posting=false;
const notifySafe=s=>typeof window.notify==='function'?window.notify(s):console.info('[AMBER V291]',s);
const cloud=()=>window.AMBER_CLOUD;
const online=()=>!!(window.AMBER_V277?.ready?.()&&cloud()?.getClient?.());
const valid={potion:'ยา',bag:'ของทั่วไป',gear:'อุปกรณ์',material:'แร่/วัสดุ',shop:'ปีก / Item Shop',pet:'สัตว์เลี้ยง / อาหาร'};
function allItems(){
 if(!online())return Promise.reject(Error('ต้องล็อกอินและเชื่อม Supabase'));
 return cloud().getClient().rpc('amber_v290_inventory_manifest').then(({data,error})=>{
  if(error)throw error;
  if(!data?.ok||!Array.isArray(data.items))throw Error('INVENTORY_NOT_VERIFIED');
  return data.items;
 });
}
const isSellable=it=>{
 if(!it||!Object.prototype.hasOwnProperty.call(valid,it.kind))return false;
 if(it.equipped===true||!Number.isInteger(+it.qty)||+it.qty<=0)return false;
 if(it.kind==='material'&&!['gw','ga','ore_fire','ore_ice','ore_prism'].includes(it.id))return false;
 if(it.kind==='shop' && /^(sun_|moon_)/.test(String(it.sku||'')) &&
   (!it.expiresAt || Date.parse(it.expiresAt)<=Date.now()))return false;
 return true;
};
function art(it){
 const host=document.createElement('span');host.style.cssText='display:inline-flex;width:35px;height:35px;align-items:center;justify-content:center;flex:0 0 35px;font-size:26px';
 if(it.kind==='gear'){
  const g=(state.gear||[]).find(g=>String(g.id)===String(it.id));
  if(g&&window.PX?.items?.gearURL){try{const img=document.createElement('img');img.src=PX.items.gearURL(g);img.alt='';img.width=35;img.height=35;host.appendChild(img);return host;}catch(e){console.warn('[V291] gear preview',e)}}
 }
 if(it.kind==='shop' && /^(sun_|moon_)/.test(String(it.sku||''))){
  const img=document.createElement('img');img.src=String(it.sku).startsWith('sun_')?'./assets/wing_amber.svg':'./assets/wing_violet.svg';img.alt='';img.width=35;img.height=35;host.appendChild(img);return host;
 }
 if(it.kind==='pet'&&it.sku==='dog'){
  const img=document.createElement('img');img.src='./assets/pet_dog_v23.png';img.alt='';img.width=35;img.height=35;host.appendChild(img);return host;
 }
 const emojis={gw:'🔥',ga:'🛡️',ore_fire:'🔥',ore_ice:'❄️',ore_prism:'🌈',food:'🦴',hp:'🧪',mp:'💧'};
 host.textContent=emojis[it.id]||emojis[it.sku]||String(it.icon||'📦');return host;
}
function rowButton(it){
 const btn=document.createElement('button');btn.type='button';btn.className='amber291-offer';
 btn.appendChild(art(it));
 const content=document.createElement('span');content.style.flex='1';content.style.textAlign='left';
 const name=document.createElement('b');name.textContent=String(it.name||'ไอเทม')+(it.enh?` +${it.enh}`:'');
 const info=document.createElement('small');info.style.display='block';info.textContent=valid[it.kind]+' · จำนวน '+Number(it.qty).toLocaleString();
 content.append(name,info);btn.appendChild(content);btn.onclick=()=>priceForm(it);return btn;
}
async function openOffers(){
 if(posting)return;
 if(!online()){notifySafe('🔒 ต้องเชื่อม Supabase ก่อนตั้งขาย');return;}
 try{
  const all=await allItems(),items=all.filter(isSellable);
  if(typeof window.openModal!=='function')throw Error('ไม่พบหน้าต่างตลาด');
  openModal('⚖️ ตั้งขายไอเทมทุกชนิด', '<p class="hint">เลือกไอเทม · Supabase ตรวจกรรมสิทธิ์ จำนวน ราคา และโอนให้ผู้ซื้อจริง</p><div id="amber291Offers"></div><button id="amber291Back">🎒 กลับกระเป๋า</button>');
  const root=$('amber291Offers');if(!root)return;
  if(!items.length)root.textContent='ไม่มีไอเทมที่นำมาขายในตลาดได้';
  else for(const it of items)root.appendChild(rowButton(it));
  $('amber291Back')?.addEventListener('click',()=>window.openInventory?.());
 }catch(e){notifySafe('ไม่สามารถอ่านกระเป๋าจากเซิร์ฟเวอร์: '+String(e.message||e).slice(0,105))}
}
function priceForm(it){
 const max=Math.min(9999,(it.kind==='gear'||it.kind==='shop')?1:Math.max(1,Math.floor(Number(it.qty))));
 openModal('📣 ลงขาย '+String(it.name||'ไอเทม'),'<p class="hint">ราคาต่อชิ้น (Gold) · ของจะถูกพักในตลาดจนกว่าจะขายหรือยกเลิก</p><div id="amber291OfferItem"></div><label>จำนวน<input id="amber291Qty" type="number" min="1" step="1" inputmode="numeric"></label><label>ราคาต่อชิ้น<input id="amber291Price" type="number" min="1" max="10000000" step="1" inputmode="numeric"></label><button class="goldbtn" id="amber291Submit">✅ ยืนยันตั้งขาย</button><button id="amber291Back">ย้อนกลับ</button>');
 $('amber291Qty').max=String(max);$('amber291Qty').value='1';$('amber291Price').value='1000';
 $('amber291OfferItem')?.appendChild(rowButton(it));
 $('amber291Submit')?.addEventListener('click',()=>submit(it,max));
 $('amber291Back')?.addEventListener('click',openOffers);
}
async function submit(it,max){
 if(posting)return;
 const qty=Number($('amber291Qty')?.value),price=Number($('amber291Price')?.value);
 if(!Number.isSafeInteger(qty)||qty<1||qty>max||!Number.isSafeInteger(price)||price<1||price>10000000){notifySafe('จำนวนหรือราคาไม่ถูกต้อง');return;}
 if(!confirm(`ตั้งขาย ${it.name} ×${qty} ชิ้น ราคา ${price.toLocaleString()} Gold/ชิ้น?`))return;
 const c=cloud();if(!online()){notifySafe('Supabase ไม่พร้อม');return;}
 posting=true;
 try{
  if(typeof c.beginMarket==='function')await c.beginMarket();
  try{
   const {data,error}=await c.getClient().rpc('amber_market_post',{p_kind:it.kind,p_key:String(it.id),p_quantity:qty,p_price:price});
   if(error)throw error;
   if(data==null)throw Error('MARKET_POST_UNCONFIRMED');
   window.AMBER_V19?.onMarketMutation?.('amber_market_post');
  }finally{if(typeof c.endMarket==='function')await c.endMarket();}
  notifySafe('✅ Supabase ยืนยันตั้งขายแล้ว');
  if(window.AMBER_V16?.showMarket)window.AMBER_V16.showMarket();else window.openInventory?.();
 }catch(e){console.warn('[V291 MARKET]',e);notifySafe('ตั้งขายไม่สำเร็จ: '+String(e.message||e).slice(0,120))}
 finally{posting=false}
}
// IMPORTANT: never wrap or hide existing bag children: their original selectors and images must stay intact.
const old=window.openInventory;
if(typeof old!=='function')return;
window.openInventory=function v291OpenInventory(...args){
 const result=old.apply(this,args),current=++seq;
 if(!String($('modalTitle')?.textContent||'').includes('กระเป๋า'))return result;
 const body=$('modalBody');if(!body)return result;
 const previous=$('amber291IntegratedMarket');if(previous)previous.remove();
 const section=document.createElement('section');section.id='amber291IntegratedMarket';
 const status=document.createElement('small');status.textContent='กำลังตรวจสอบข้อมูลจาก Supabase…';
 const button=document.createElement('button');button.type='button';button.className='goldbtn';button.textContent='⚖️ ตั้งขายทุกชนิดในตลาด';
 button.addEventListener('click',openOffers);
 section.append(status,button);body.appendChild(section);
 if(!online()){status.textContent='ต้องเชื่อม Supabase เพื่อดูจำนวนล่าสุดและลงขาย';button.disabled=true;return result;}
 allItems().then(items=>{if(current===seq&&section.isConnected)status.textContent='✅ Supabase ยืนยัน '+items.length+' รายการ · ภาพและปุ่มใช้ไอเทมเดิมครบ';})
  .catch(e=>{if(current===seq&&section.isConnected){status.textContent='⚠️ ติดต่อ Supabase ไม่สำเร็จ: ใช้กระเป๋าเดิมได้ แต่ยังลงขายไม่ได้';button.disabled=true;}});
 return result;
};
const style=document.createElement('style');style.id='amber291-inventory-restore-css';
style.textContent='#amber291IntegratedMarket{margin:12px 0;padding:9px;border:1px solid #8f7047;border-radius:9px;display:flex;gap:9px;align-items:center;flex-wrap:wrap}#amber291IntegratedMarket small{flex:1 1 160px}#amber291Offers{display:flex;flex-direction:column;gap:6px;max-height:55vh;overflow-y:auto}#amber291Offers .amber291-offer{width:100%;display:flex;gap:8px;align-items:center;background:#152536;border:1px solid #655636;color:#f7e0b8;padding:7px;border-radius:8px}#amber291OfferItem .amber291-offer{pointer-events:none}#amber291IntegratedMarket button{min-height:36px}';document.head.appendChild(style);
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

window.AMBER_V290=Object.freeze({version:'29.1',manifest:'server',enhancementOre:'server',mainInventoryArt:'restored',marketKinds:'six'});
console.info('[AMBER V29.1] Original asset inventory fully restored, server market expanded');
})();
