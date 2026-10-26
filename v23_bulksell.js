/* V28.4 server-confirmed, all-or-nothing NPC bulk sale. No client-generated Gold. */
(()=>{'use strict';const $=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let selected=new Set();
const gearPrice=g=>Math.round((Number(g.lv)||1)*12*([1,1.25,1.6,2.1][Math.max(0,Math.min(3,g.rar||0))]||1)*(1+(Number(g.enh)||0)*.6)+20);
function entries(){const out=[];state.bag.forEach((g,i)=>{if(['hp','mp'].includes(g.id))return;out.push({key:'b'+i,kind:'bag',index:i,name:g.name,qty:Math.max(0,Number(g.qty)||0),price:25})});
(state.gear||[]).forEach((g,i)=>{if(state.eq?.[g.slot]===g.id||g?.mythic||g?.boss===true||g?.bossDrop===true||String(g?.id||'').startsWith('dg_'))return;out.push({key:'g'+g.id,kind:'gear',index:i,id:g.id,name:g.name+(g.enh?' +'+g.enh:''),qty:1,price:gearPrice(g)})});return out}
function show(){selected=new Set();renderBulk()}
function renderBulk(){const rows=entries();openModal('💰 เลือกขายของหลายชนิด',`<p class="hint">เลือกหลายชนิดเพื่อขายให้ NPC ในครั้งเดียว · ป้องกันขายไอเทมที่สวมใส่และอาวุธออปเทพ · ไอเทมคอยล์ขายไม่ได้</p><div class="amber23-bulk"><div class="amber23-bulkTools"><button id="v23SelectAll">เลือกทั้งหมด</button><button id="v23Unselect">ล้างการเลือก</button></div>${rows.map(e=>`<label class="amber23-bulkRow"><input type="checkbox" data-bulk-key="${esc(e.key)}" ${selected.has(e.key)?'checked':''}><span><b>${esc(e.name)}</b><small>${e.kind==='bag'?'×'+e.qty+' · ขายทั้งกอง':'อุปกรณ์ ×1'} · ${e.price} Gold/ชิ้น</small></span><strong>${(e.price*e.qty).toLocaleString()} G</strong></label>`).join('')||'<p>ไม่มีรายการขายได้</p>'}</div><button id="v23SellConfirm" class="goldbtn">💰 ขายของที่เลือก</button>`);
$('v23SelectAll').onclick=()=>{selected=new Set(rows.map(r=>r.key));renderBulk()};$('v23Unselect').onclick=()=>{selected.clear();renderBulk()};
$('modalBody').querySelectorAll('[data-bulk-key]').forEach(c=>c.onchange=()=>{c.checked?selected.add(c.dataset.bulkKey):selected.delete(c.dataset.bulkKey)});
$('v23SellConfirm').onclick=()=>sale();}
let saleBusy=false;
async function sale(){
 if(saleBusy)return;
 const chosen=entries().filter(r=>selected.has(r.key));
 if(!chosen.length){notify('ยังไม่ได้เลือกของที่จะขาย');return;}
 if(!window.AMBER_V277?.ready?.()||!window.AMBER_V277?.invoke){notify('ต้องเชื่อม Supabase ก่อนขายของ');return;}
 // Build item identifiers only. Price/ownership/stock are never accepted from the browser.
 const items=chosen.map(r=>({
  kind:r.kind,
  key:r.kind==='bag'?String(state.bag?.[r.index]?.id||''):String(r.id||''),
  quantity:Math.trunc(Number(r.qty)||0)
 }));
 if(items.some(x=>!x.key||x.quantity<1||x.quantity>1000)){
  notify('จำนวนต่อกองต้องอยู่ระหว่าง 1–1,000 ชิ้น');return;
 }
 if(items.length>60){notify('ขายพร้อมกันได้ไม่เกิน 60 รายการ');return;}
 const estimate=chosen.reduce((n,x)=>n+x.price*x.qty,0);
 if(!confirm(`ยืนยันขาย ${items.length} ชนิดให้ NPC ผ่าน Supabase? (ประมาณ ${estimate.toLocaleString('th-TH')} Gold; เซิร์ฟเวอร์เป็นผู้กำหนดราคาจริง)`))return;
 saleBusy=true;
 try{
   const result=await window.AMBER_V277.invoke('amber_v284_bulk_sell',{p_items:items});
   // invoke() has already replaced local state using result.save returned by the DB.
   selected.clear();closeModal();renderBag();renderTop();
   notify('✅ Supabase ยืนยันขาย '+result.count+' ชนิด ได้ '+Number(result.amount||0).toLocaleString('th-TH')+' Gold');
 }catch(e){
   console.warn('[V28.4 server bulk sale]',e);
   notify('❌ ขายไม่สำเร็จ ไม่มีการหักของ: '+String(e.message||e).slice(0,95));
 }finally{saleBusy=false;}
}
const previous=openInventory;openInventory=function(){previous();const container=$('modalBody');if(!container)return;
const b=document.createElement('button');b.textContent='💰 เลือกขายหลายชนิด';b.className='goldbtn';b.style.cssText='width:100%;margin-top:8px;min-height:44px';b.onclick=show;container.appendChild(b)};
const st=document.createElement('style');st.textContent=`.amber23-bulk{max-height:50vh;overflow:auto}.amber23-bulkTools{display:flex;gap:8px;margin:8px 0}.amber23-bulkRow{display:flex;align-items:center;gap:10px;border:1px solid #645b4d;border-radius:8px;padding:8px;margin:5px 0;background:#14212c;min-height:51px}.amber23-bulkRow input{accent-color:#dfaf5b;width:19px;height:19px}.amber23-bulkRow span{display:flex;flex:1;min-width:0;flex-direction:column}.amber23-bulkRow small{color:#afc6d7}.amber23-bulkRow strong{white-space:nowrap;color:#ffcf85}`;document.head.appendChild(st);
})();
