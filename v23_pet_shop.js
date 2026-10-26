/* 55 AMBERLANDS V23 — Dog companion + separate pet-skill scrolls + food + DUO card.
   The old 99,999 beta Coin is client controlled, NOT a secure paid shop. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PRODUCTS=[
 {id:'dog',name:'ลูกสุนัขผู้พิทักษ์',price:800,icon:'🐶',kind:'dog',detail:'ปลดล็อกสัตว์เลี้ยงสุนัข · เรียกและเก็บได้'},
 {id:'shield',name:'ตำราสกิลเกราะพิทักษ์',price:400,icon:'🛡️',kind:'skill',detail:'ลดดาเมจที่ได้รับ 25% เป็นเวลา 20 วินาที (คูลดาวน์ 35 วินาที)'},
 {id:'regen',name:'ตำราสกิลฟื้นฟู HP/MP',price:450,icon:'💚',kind:'skill',detail:'ฟื้น HP 10% และ MP 8% ทุก 3 วินาที นาน 24 วินาที (คูลดาวน์ 30 วินาที)'},
 {id:'attack',name:'ตำราสกิลพลังนักล่า',price:450,icon:'⚔️',kind:'skill',detail:'เพิ่ม ATK 30% นาน 18 วินาที (คูลดาวน์ 40 วินาที)'},
 {id:'duo',name:'บัตร DUO Pet Skill',price:900,icon:'🎴',kind:'duo',detail:'ติดตั้งสกิลสัตว์เลี้ยงได้พร้อมกัน 2 สกิล'},
 {id:'food',name:'อาหารสุนัขวิเศษ',price:80,icon:'🦴',kind:'food',detail:'ใช้งานจากกระเป๋าเพื่อเพิ่มความอิ่ม +40%'}
];
const SPEC={shield:{name:'🛡️ เกราะพิทักษ์',duration:20000,cooldown:35000},regen:{name:'💚 ฟื้นฟู HP/MP',duration:24000,cooldown:30000},attack:{name:'⚔️ พลังนักล่า',duration:18000,cooldown:40000}};
const cloud=()=>window.AMBER_CLOUD;
const ready=()=>!!cloud()?.getStatus?.()?.cloudReady;
let pendingSave=false;
function pet(){
 if(!state.pet23||typeof state.pet23!=='object')state.pet23={owned:false,active:false,hunger:100,skills:[],unlocked:[],duo:false,items:[],lastAt:Date.now(),cooldown:{},effects:{}};
 const p=state.pet23;
 if(!Array.isArray(p.items))p.items=[];
 if(!Array.isArray(p.skills))p.skills=[];
 if(!Array.isArray(p.unlocked))p.unlocked=[];
 if(!p.cooldown||typeof p.cooldown!=='object')p.cooldown={};
 if(!p.effects||typeof p.effects!=='object')p.effects={};
 p.hunger=Math.max(0,Math.min(100,Number(p.hunger)||0));
 p.lastAt=Number(p.lastAt)||Date.now();
 if(!p.owned||!p.hunger)p.active=false;
 return p;
}
function commit(){try{save()}catch(e){console.warn('[V278 UI]',e)}}
function consumeTime(){/* Server owns pet hunger and timers from V27.8 onwards. */}
function productsHTML(){return `<section class="amber23-products"><h3>🐶 สัตว์เลี้ยงและสกิล (V23)</h3><p class="hint">ของทุกชิ้นที่ซื้อจะเข้ากระเป๋าก่อน · สกิลขายแยก · บัตร DUO ใช้แล้วติดตั้งได้ 2 สกิล</p><div class="amber23-shopGrid">${PRODUCTS.map(g=>`<article class="amber23-goods"><span>${window.PXI?PXI(g.id,g.icon):g.icon}</span><b>${esc(g.name)}</b><small>${esc(g.detail)}</small><button type="button" data-am23-buy="${g.id}">💠 ${g.price} คอยล์ · ซื้อ</button></article>`).join('')}</div></section>`}
function decorateShop(){const host=$('amber20ShopProducts');if(!host||$('amber23ShopSection'))return;
 const root=document.createElement('div');root.id='amber23ShopSection';root.innerHTML=productsHTML();host.parentNode.insertBefore(root,host.nextSibling);
 root.querySelectorAll('[data-am23-buy]').forEach(b=>b.addEventListener('click',()=>purchase(b.dataset.am23Buy)));
}
async function purchase(id){
 const g=PRODUCTS.find(x=>x.id===id);if(!g)return;
 if(!ready())return notify('ต้องล็อกอิน Google');
 let qty=1;
 if(id==='food'){
   const response=window.prompt('ซื้ออาหารสัตว์เลี้ยงจำนวนกี่ชิ้น? (1–50 ชิ้น)','10');
   if(response===null)return;
   qty=Number(response.trim());
   if(!Number.isInteger(qty)||qty<1||qty>50)return notify('กรุณาระบุจำนวน 1 ถึง 50 ชิ้น');
 }
 const total=g.price*qty;
 if(!confirm('ซื้อ '+g.name+' ×'+qty+' ราคา '+total+' คอยล์ผ่าน Supabase?'))return;
 try{
   if(id==='food')await window.AMBER_V277.invoke('amber_v289_buy_pet_food',{p_qty:qty},{silent:true});
   else await window.AMBER_V278.pet('buy',id);
   notify('✅ Supabase ยืนยันการซื้อ '+g.name+' ×'+qty);
   window.AMBER_ITEM_SHOP?.open?.();
 }catch(e){notify('ซื้อไม่สำเร็จ: '+String(e.message||e).slice(0,100));}
}
// V28.9: Read-only server pet hunger. Browser never submits calculated hunger.
let petStatusPending=false;
async function refreshPetHunger(){
 if(!ready()||petStatusPending||document.hidden)return;
 petStatusPending=true;
 try{
   const {data,error}=await cloud().getClient().rpc('amber_v289_pet_status');
   if(error||!data?.ok||!data?.pet)return;
   const wasActive=!!pet().active;
   state.pet23={...state.pet23,...data.pet};
   const p=pet();
   const label=$('amber23PetHunger');
   if(label)label.textContent='🍖 ความอิ่ม '+Number(p.hunger).toFixed(1)+'%';
   const bar=$('amber23PetBar');
   if(bar)bar.style.width=Math.max(0,Math.min(100,Number(p.hunger))).toFixed(1)+'%';
   const label2=$('amber23PetStatus');
   if(label2)label2.textContent='สถานะ: '+(!p.owned?'🔒 ยังไม่ได้รับ':p.active?'🟢 กำลังติดตาม':'⚪ เก็บอยู่');
   const toggleButton=$('amber23Toggle');
   if(toggleButton)toggleButton.textContent=p.active?'🐾 เก็บสัตว์เลี้ยง':'🐕 เรียกสัตว์เลี้ยง';
   if(wasActive&&!p.active){decorateScene();window.dispatchEvent(new Event('amber-v19-location'));}
 }catch(e){console.warn('[AMBER PET STATUS]',e)}finally{petStatusPending=false}
}
function currentEffect(k){return pet().active&&Number(pet().effects[k]||0)>Date.now()}
function damageFactor(){return currentEffect('shield')?.75:1}
function attackFactor(){return currentEffect('attack')?1.30:1}
async function useItem(id){
 try{await window.AMBER_V278.pet('use',null,id);notify('✅ Supabase อนุมัติใช้ไอเทมสัตว์เลี้ยง');renderBag();openInventory();}
 catch(e){notify('ใช้ไอเทมไม่ได้: '+String(e.message||e).slice(0,85))}
}
function showItem(id){const ent=pet().items.find(x=>x.id===id),g=PRODUCTS.find(x=>x.id===ent?.sku);if(!g)return;
 openModal(g.icon+' '+g.name,`<p>${esc(g.detail)}</p><p>คงเหลือ ${ent.qty} ชิ้น · ซื้อมาแล้ว ยังไม่ได้ใช้งาน</p><button id="amber23UseItem">✅ ใช้ไอเทมจากกระเป๋า</button><button id="amber23GoBag">← กลับกระเป๋า</button>`);
 $('amber23UseItem')?.addEventListener('click',()=>useItem(id));$('amber23GoBag')?.addEventListener('click',openInventory);
}
function itemList(){return pet().items.map(it=>{const g=PRODUCTS.find(x=>x.id===it.sku);return g?`<button class="amber23-item" type="button" data-am23-item="${esc(it.id)}"><span>${window.PXI?PXI(g.id,g.icon):g.icon}</span><b>${esc(g.name)}</b><small>×${it.qty}</small></button>`:''}).join('')}
function decorateBag(){const list=$('bag');if(!list)return;const frag=document.createElement('div');frag.id='amber23BagCards';frag.innerHTML=itemList();list.appendChild(frag)}
const oldBag=renderBag;renderBag=function(){oldBag();decorateBag()};
const oldInventory=openInventory;openInventory=function(){oldInventory();const parent=$('modalBody');if(parent){const items=itemList();parent.insertAdjacentHTML('beforeend',`<section class="amber23-inv"><h3>🐶 ไอเทมสัตว์เลี้ยง / Item Shop</h3><div class="amber23-itemGrid">${items||'<small>ยังไม่มีไอเทมสัตว์เลี้ยงในกระเป๋า</small>'}</div></section>`)} };
document.addEventListener('click',ev=>{const el=ev.target.closest?.('[data-am23-item]');if(!el)return;ev.preventDefault();ev.stopImmediatePropagation();showItem(el.dataset.am23Item)},true);
async function toggle(){
 try{await window.AMBER_V278.pet('toggle');showPet();renderScene();window.dispatchEvent(new Event('amber-v19-location'));}
 catch(e){notify('เรียกสัตว์เลี้ยงไม่ได้: '+String(e.message||e).slice(0,85))}
}
async function slotSkill(id){
 try{await window.AMBER_V278.pet('slot',id);showPet();}
 catch(e){notify('จัดสกิลไม่ได้: '+String(e.message||e).slice(0,85))}
}
function showPet(){consumeTime();refreshPetHunger();const p=pet(),slots=p.duo?2:1;openModal('🐶 จัดการสัตว์เลี้ยง',`<div class="amber23-petPanel"><img src="./assets/pet_dog_v23.png" alt="สุนัข"/><div><b>ลูกสุนัขผู้พิทักษ์</b><p id="amber23PetStatus">สถานะ: ${!p.owned?'🔒 ยังไม่ได้รับ':p.active?'🟢 กำลังติดตาม':'⚪ เก็บอยู่'}</p><p id="amber23PetHunger">🍖 ความอิ่ม ${Number(p.hunger).toFixed(1)}%</p><div class="amber23-hbar"><i id="amber23PetBar" style="width:${Math.floor(p.hunger)}%"></i></div>${p.hunger<=0?'<small style="color:#ff9292">⛔ หิว 0% เรียกสัตว์เลี้ยงไม่ได้ กรุณาให้อาหารจากกระเป๋า</small>':''}</div></div>
 <button id="amber23Toggle" ${!p.owned?'disabled':''}>${p.active?'🐾 เก็บสัตว์เลี้ยง':'🐕 เรียกสัตว์เลี้ยง'}</button>
 <h3>✨ จัดช่องสกิล (${p.skills.length}/${slots}) ${p.duo?'🎴 DUO':''}</h3><div class="amber23-skills">${Object.entries(SPEC).map(([id,sk])=>`<button data-am23-slot="${id}" ${!p.unlocked.includes(id)?'disabled':''}><b>${sk.name}</b><small>${!p.unlocked.includes(id)?'🔒 ซื้อแยกจาก Item Shop':p.skills.includes(id)?'✅ ติดตั้งแล้ว — แตะเพื่อถอด':'แตะเพื่อติดตั้ง'} · CD ${sk.cooldown/1000} วินาที</small></button>`).join('')}</div><p class="hint">🛡️ เกราะลดดาเมจ 25% · 💚 ฟื้น HP 10% และ MP 8% ทุก 3 วินาที · ⚔️ ATK +30% (มีระยะเวลาบัฟและคูลดาวน์ เพื่อรักษาสมดุล)</p><button id="amber23ToShop">💠 ไป Item Shop</button>`);
 $('amber23Toggle')?.addEventListener('click',toggle);
 $('amber23ToShop')?.addEventListener('click',()=>window.AMBER_ITEM_SHOP?.open?.());
 $('modalBody').querySelectorAll('[data-am23-slot]').forEach(b=>b.addEventListener('click',()=>slotSkill(b.dataset.am23Slot)));
}
function showFx(k,notice){const s=$('scene')||$('sprites')?.children?.[0];if(!s)return;const el=document.createElement('span');el.className='amber23-petburst amber23-petburst-'+k;el.textContent=notice;s.appendChild(el);setTimeout(()=>el.remove(),2200)}
async function cast(k){
 if(!['shield','regen','attack'].includes(k))return false;
 try{await window.AMBER_V278.pet('cast',k,null);showFx(k,SPEC[k].name);updateChip();return true;}
 catch(e){return false;}
}
function updateChip(){let chip=document.getElementById('amber23PetEffectChip');if(!chip){chip=document.createElement('div');chip.id='amber23PetEffectChip';document.querySelector('.playerhead')?.appendChild(chip)}if(!chip)return;const p=pet(),now=Date.now();const buffs=[];if(p.active){if(p.effects.shield>now)buffs.push('🛡️ DEF +25%');if(p.effects.regen>now)buffs.push('💚 ฟื้น HP/MP');if(p.effects.attack>now)buffs.push('⚔️ ATK +30%')}chip.textContent=buffs.join(' · ');chip.style.display=buffs.length?'block':'none'}
function autoSkills(){const p=pet();if(!p.active||!p.skills.length||state.hp<=0)return;for(const k of p.skills){if(!currentEffect(k)&&!(p.cooldown[k]>Date.now()))cast(k)}}
async function regen(){
 const p=pet();if(!p.active||!currentEffect('regen')||state.hp<=0)return;
 try{await window.AMBER_V278.regen();}catch(e){/* cooldown, busy or offline */}
}
const previousCombat=window.AMBER_V12?.combat;
if(previousCombat){window.AMBER_V12.combat=function(){const c=previousCombat();return {...c,atk:Math.round(c.atk*attackFactor())}}}
function presenceInfo(){const p=pet();return {pet:p.owned&&p.active&&p.hunger>0?1:0}}
function decorateScene(){const sprites=$('sprites');if(!sprites)return;const others=window.AMBER_SCENE_PLAYERS||[];
 Array.from(sprites.children).forEach((sp,i)=>{
  sp.querySelectorAll('.amber23-pet-sprite').forEach(el=>el.remove());
  const visible=i===0?pet().active&&pet().hunger>0:!!others[i-1]?.pet;
  if(!visible)return;
  const img=document.createElement('img');img.className='amber23-pet-sprite';img.src='./assets/pet_dog_v23.png';img.alt='🐕 สุนัข';sp.appendChild(img);
 });
}
const oldScene=renderScene;renderScene=function(){oldScene();decorateScene()};
const openModalPrev=openModal;openModal=function(title,body){openModalPrev(title,body);if(String(title).includes('Item Shop'))queueMicrotask(decorateShop)};
const nav=document.querySelector('.nav')||document.querySelector('nav');if(nav){const btn=document.createElement('button');btn.id='amber23PetNav';btn.textContent='🐶 สัตว์เลี้ยง';btn.addEventListener('click',showPet);nav.appendChild(btn)}
const st=document.createElement('style');st.textContent=`
#amber23PetEffectChip{margin-top:3px;font-size:10px;color:#befba4;line-height:1.3;text-shadow:0 1px 2px #000}
.amber23-products{padding:12px;margin:14px 0;background:#112030;border:1px solid #957c4d;border-radius:10px}
.amber23-shopGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.amber23-goods{display:flex;flex-direction:column;gap:6px;background:#111923;border:1px solid #5d6370;border-radius:9px;padding:9px;min-width:0}
.amber23-goods>span{font-size:31px}.amber23-goods>b{font-size:13px;color:#f5d18d}.amber23-goods small{color:#bed0dc;line-height:1.35;font-size:11px;flex:1}.amber23-goods button{font-size:12px}
#amber23BagCards{display:contents}.amber23-itemGrid{display:flex;gap:6px;flex-wrap:wrap}.amber23-item{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:75px;width:85px;min-height:88px;padding:5px;border:1px solid #9b865e;border-radius:8px;background:#152133;color:#e9d5a6;gap:3px}.amber23-item span{font-size:25px}.amber23-item b{font-size:9px;line-height:1.3}.amber23-item small{color:#afe7fa}
.amber23-inv{margin:14px 0;padding:8px;background:#111e2b;border:1px solid #55472a;border-radius:9px}.amber23-petPanel{display:flex;align-items:center;gap:10px}.amber23-petPanel img{width:110px;max-width:40%;height:110px;object-fit:contain;filter:drop-shadow(0 0 8px #57ddff33)}.amber23-petPanel p{margin:4px 0}.amber23-hbar{height:10px;background:#1a2229;border-radius:6px;overflow:hidden}.amber23-hbar i{display:block;height:100%;background:linear-gradient(90deg,#ce712a,#c5ff71)}.amber23-skills{display:grid;gap:7px;margin:9px 0}.amber23-skills button{display:flex;flex-direction:column;align-items:start;gap:5px}.amber23-skills small{font-size:10px}
#sprites .sprite>.amber23-pet-sprite{position:absolute!important;right:-31px!important;bottom:-4px!important;width:35px!important;height:35px!important;object-fit:contain!important;background:transparent!important;border:0!important;z-index:13!important;filter:drop-shadow(0 0 3px #7af0fa)}
.amber23-petburst{position:absolute;z-index:45;color:#d4ffaf;text-shadow:0 2px 5px #000,0 0 9px #12753b;top:38%;left:16%;white-space:nowrap;animation:amber23-pet-rise 2.1s ease-out forwards;font-size:clamp(12px,3.2vw,19px);font-weight:1000;pointer-events:none}.amber23-petburst-attack{color:#ffcb60;text-shadow:0 0 12px #ff5722,0 2px 3px #000}.amber23-petburst-shield{color:#a7e7ff;text-shadow:0 0 12px #36baff,0 2px 3px #000}
@keyframes amber23-pet-rise{from{opacity:0;transform:translateY(16px) scale(.8)}20%{opacity:1}to{opacity:0;transform:translateY(-36px) scale(1.1)}}
@media(max-width:380px){.amber23-shopGrid{grid-template-columns:1fr 1fr}.amber23-goods button{font-size:10px}}
`;document.head.appendChild(st);
window.AMBER_PET={pet,presenceInfo,decorateScene,showPet,damageFactor,attackFactor,cast};
setInterval(()=>{if(pet().active)autoSkills()},3000);
setInterval(regen,3000);setInterval(updateChip,1800);
setInterval(()=>{if(ready()&&(pet().active||$('amber23PetHunger')))refreshPetHunger()},5000);
window.addEventListener('focus',refreshPetHunger);
window.addEventListener('focus',()=>{consumeTime();decorateScene()});
setTimeout(()=>{pet();decorateScene()},750);
})();
