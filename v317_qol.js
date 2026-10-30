/* 55 AMBERLANDS CBT V31.7 — focused UI fixes.
   Server owns skills, potions and comparison stats. No client-side reward writes. */
(()=>{
'use strict';
if(window.AMBER_V317_QOL)return;
const $=id=>document.getElementById(id);
const escaped=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cloud=()=>window.AMBER_CLOUD;
const online=()=>!!(window.AMBER_V277?.ready?.()&&cloud()?.getClient?.());
const tell=s=>{try{notify(s)}catch(e){console.info('[V317]',s)}};
const number=v=>Math.round(Number(v)||0).toLocaleString('th-TH');
const amount=v=>{const n=Number(v);return Number.isSafeInteger(n)&&n>=1&&n<=1000?n:0};
const reborn=()=>Number(state?.v25?.rebirth||0)>0;
const statName={ATK:'ATK',DEF:'DEF',HP:'HP',MP:'MP',STR:'STR',DEX:'DEX',INT:'INT',VIT:'VIT',AGI:'AGI',LUK:'LUK',CRIT:'CRIT'};
let purchasing=false,gearSequence=0,lastInventoryScroll=0;

/* 1. The 120-skill tree used client Lv even after an authorized rebirth.
      The verified server RPC is the only place where points are spent. */
window.showSkillPath=function amber317SkillPath(path){
 const host=$('skilltree');if(!host||typeof SKILLS==='undefined'||typeof state==='undefined')return;
 if(!['POWER','DEX','INT'].includes(path))return;
 const key=path==='POWER'?'STR':path;
 const level=Number(state.lv)||1;
 const learned=new Set(Array.isArray(state.learned)?state.learned:[]);
 const available=Number(state.skillPoints)||0;
 const skills=SKILLS.filter(x=>x.job===state.job&&x.path===path);
 host.innerHTML='<h3>'+escaped(path)+' · ต้องอัป '+escaped(key)+'</h3>'
  +(reborn()?'<p style="color:#a9ffcf">♻ รีเบิร์นแล้ว: ไม่ต้องกลับไปเก็บเลเวลเพื่อเรียนสกิล แต่ยังต้องมีแต้มและสเตตัสตามเงื่อนไข</p>':'')
  +skills.map(sk=>{
   const done=learned.has(sk.id);
   const levelOK=level>=Number(sk.level)||reborn();
   const statOK=Number(state.stats?.[key]||0)>=Number(sk.stat);
   const okay=!done&&levelOK&&statOK&&available>0;
   const why=done?'เรียนแล้ว':!levelOK?'Lv. ไม่ถึง':!statOK?'สเตตัสไม่ถึง':available<1?'แต้มไม่พอ':'เรียน';
   return '<div class="skillrow"><img src="'+escaped(image(sk.icon))+'" alt="">'
    +'<div><b>'+escaped(sk.name)+(sk.buff?' ✨ BUFF':'')+'</b><small>Lv.'+Number(sk.level)+' · '+escaped(key)+' '+Number(sk.stat)+' · MP '+Number(sk.mp)+'</small></div>'
    +'<button type="button" '+(okay?'':'disabled')+' onclick="learnSkill(\''+escaped(sk.id)+'\',\''+escaped(path)+'\')">'+escaped(why)+'</button></div>';
  }).join('');
 const title=$('modalBody')?.querySelector('p');
 if(title&&title.textContent.includes('แต้มสกิล')){
  const counter=title.querySelector('b');if(counter)counter.textContent=number(available);
 }
};
const previousLearn=window.learnSkill;
if(typeof previousLearn==='function')window.learnSkill=async function amber317Learn(id,path){
 if(!online()){tell('🔒 ต้องเชื่อมต่อ Supabase เพื่อเรียนสกิล');return}
 await previousLearn(id,path);
 window.showSkillPath(path);
};

/* 2. Purchase several potions in one atomic, verified RPC. */
window.buy=async function amber317BuyPotions(type,qty=1){
 if(type!=='hp'&&type!=='mp')return;
 const n=amount(qty);
 if(!n){tell('จำนวนยาต้องเป็น 1–1,000 ขวด');return;}
 if(!online()){tell('🔒 ต้องเชื่อมต่อ Supabase เพื่อซื้อยา');return;}
 if(purchasing)return;
 purchasing=true;
 const inputs=$('modalBody')?.querySelectorAll('[data-v317-potion]');
 if(inputs)for(const b of inputs)b.disabled=true;
 try{
   const reply=await window.AMBER_V277.invoke('amber_v277_economy',
      {p_action:'buy_potion',p_args:{type,quantity:n}});
   if(!reply?.ok)throw Error('SERVER_POTION_NOT_CONFIRMED');
   tell('✅ ซื้อยา '+type.toUpperCase()+' ×'+number(n)+' สำเร็จ ใช้ Gold '+number(n*50));
   const info=$('amber317PotionWallet');
   if(info)info.textContent='Gold: '+number(state.gold)+' · HP ×'+number(state.potHP)+' · MP ×'+number(state.potMP);
 }catch(e){console.warn('[V317 potion]',e);tell('ซื้อยาไม่สำเร็จ: '+String(e.message||e).slice(0,100));}
 finally{
   purchasing=false;
   if(inputs)for(const b of inputs)b.disabled=false;
 }
};
const originalShop=window.openShop;
if(typeof originalShop==='function')window.openShop=function amber317Shop(...args){
 const ret=originalShop.apply(this,args);
 const title=String($('modalTitle')?.textContent||'');
 const root=$('modalBody');
 if(!root||!title.includes('ร้านค้า'))return ret;
 if($('amber317PotionWallet'))return ret;
 const wallet=document.createElement('div');wallet.id='amber317PotionWallet';
 wallet.style.cssText='padding:8px;margin:6px 0;background:#102e35;border-radius:9px;color:#bdf5d6;font-weight:800';
 wallet.textContent='Gold: '+number(state.gold)+' · HP ×'+number(state.potHP)+' · MP ×'+number(state.potMP);
 root.prepend(wallet);
 for(const [kind,search] of [['hp','ยาฟื้น HP'],['mp','ยาฟื้น MP']]){
  const row=Array.from(root.querySelectorAll('.statrow')).find(el=>el.textContent.includes(search));
  if(!row)continue;
  const oldBtn=row.querySelector('button');if(oldBtn)oldBtn.remove();
  const box=document.createElement('span');box.style.cssText='display:flex;flex-wrap:wrap;align-items:center;gap:5px;justify-content:flex-end';
  const label=document.createElement('label');label.textContent='จำนวน ';
  const qty=document.createElement('input');qty.type='number';qty.min='1';qty.max='1000';qty.step='1';qty.inputMode='numeric';qty.value='10';qty.style.cssText='width:80px;padding:7px;color:#fff;background:#172c37;border:1px solid #83baa8;border-radius:7px';
  label.appendChild(qty);
  const presets=document.createElement('select');presets.style.cssText='padding:7px;color:#fff;background:#172c37;border-radius:7px';
  for(const n of [1,10,50,100,500,1000]){const op=document.createElement('option');op.value=String(n);op.textContent='×'+n;if(n===10)op.selected=true;presets.appendChild(op)}
  presets.addEventListener('change',()=>{qty.value=presets.value});
  const btn=document.createElement('button');btn.type='button';btn.className='goldbtn';btn.dataset.v317Potion=kind;btn.textContent='ซื้อยา';
  btn.onclick=()=>window.buy(kind,qty.value);
  box.append(label,presets,btn);row.appendChild(box);
 }
 return ret;
};

/* 3. The old item tooltip multiplied flat CRIT options by enhancement;
      server treats them as flat percentage points. */
const formattedOption=(key,val)=>'+'+number(val)+(key==='CRIT'?'%':'');
const setRawGearDisplay=(root,base,opts,enh)=>{
 if(!root)return;
 const rows=Array.from(root.querySelectorAll('.statrow'));
 const baseRow=rows.find(row=>row.querySelector('span')?.textContent.trim()==='ค่าหลัก');
 const factor=1+Math.max(0,Math.min(10,Number(enh)||0))*0.10;
 if(baseRow){
  const b=baseRow.querySelector('b');
  if(b)b.textContent=Object.entries(base||{}).map(([k,v])=>(statName[k]||k)+' +'+number(Number(v)*factor)).join(' · ')||'ไม่มี';
 }
 const optRows=rows.filter(row=>row.querySelector('span')?.textContent.trim().startsWith('✦'));
 for(let i=0;i<Math.min(optRows.length,(opts||[]).length);i++){
  const pair=opts[i],val=Number(pair?.[1]);
  if(!Array.isArray(pair)||!Number.isFinite(val))continue;
  const b=optRows[i].querySelector('b');
  if(b)b.textContent=formattedOption(pair[0],val);
 }
};
function showComparison(root,data){
 if(!root?.isConnected||!data?.ok)return;
 const line=root.querySelector('#amber317CompStatus');
 if(!line)return;
 const current=data.current||{},next=data.after||{},delta=data.delta||{};
 const value=(key,percent)=>percent?(Number(current[key])*100).toFixed(1)+'%':number(current[key]);
 const after=(key,percent)=>percent?(Number(next[key])*100).toFixed(1)+'%':number(next[key]);
 const diff=(key,percent)=>{
  const n=Number(delta[key])||0;return (n>=0?'+':'')+(percent?n.toFixed(2):number(n))+(percent?'%':'');
 };
 const keys=[['atk','atk',false,'ATK'],['def','def',false,'DEF'],['crit','crit_percent',true,'CRIT'],['max_hp','hp',false,'HP'],['max_mp','mp',false,'MP']];
 let table='<div style="overflow-x:auto"><table style="width:100%;font-size:12px;border-collapse:collapse"><thead><tr><th>ค่า</th><th>ปัจจุบัน</th><th>ถ้าเปลี่ยน</th><th>ต่าง</th></tr></thead><tbody>';
 for(const [key,dk,pct,label]of keys){
  const amount=Number(delta[dk]||0);
  table+='<tr><td>'+label+'</td><td>'+value(key,pct)+'</td><td>'+after(key,pct)+'</td>'
   +'<td style="color:'+(amount>0?'#9bffac':amount<0?'#ffaeae':'#b9ced6')+'">'+diff(dk,pct)+'</td></tr>';
 }
 table+='</tbody></table></div>';
 line.innerHTML='<p>สวมอยู่: <b>'+escaped(data.equipped_name||'ไม่มี')+'</b>'
   +(data.already_equipped?' · <b>กำลังสวมชิ้นนี้</b>':'')+'</p>'
   +(!data.eligible?'<p style="color:#ffcf83">อุปกรณ์นี้ยังสวมไม่ได้ตามเงื่อนไขอาชีพ/เลเวล</p>':'')
   +table+'<small>ค่าสถานะด้านบนมาจากสูตร Supabase · CRIT เป็นเปอร์เซ็นต์ (สูงสุดตามเพดานเกม)</small>';
 setRawGearDisplay($('modalBody'),data.base||{},data.opts||[],data.enh);
}
const originalGear=window.openGear;
if(typeof originalGear==='function')window.openGear=function amber317GearDetail(id,msg){
 const before=$('modalBody');
 if(before&&String($('modalTitle')?.textContent||'').includes('กระเป๋า'))lastInventoryScroll=before.scrollTop;
 const result=originalGear.apply(this,arguments);
 const root=$('modalBody');
 if(!root||!String($('modalTitle')?.textContent||'').includes('รายละเอียดอุปกรณ์'))return result;
 const item=(state?.gear||[]).find(g=>String(g.id)===String(id));
 if(item)setRawGearDisplay(root,item.base||{},item.opts||[],item.enh);
 const cmp=document.createElement('section');cmp.id='amber317Comparison';cmp.style.cssText='padding:10px;background:#122735;border:1px solid #89b8c5;border-radius:10px;margin:10px 0';
 const h=document.createElement('h3');h.textContent='⚖️ เทียบกับอุปกรณ์ที่ใส่';h.style.cssText='font-size:15px;margin:0 0 8px;color:#ffe59d';
 const status=document.createElement('div');status.id='amber317CompStatus';status.textContent='กำลังตรวจค่าสถานะจาก Supabase…';
 cmp.append(h,status);
 root.appendChild(cmp);
 addBackToBag(root);
 const serial=++gearSequence;
 if(!online()){status.textContent='ต้องออนไลน์เพื่อเทียบค่าสถานะจริง';return result;}
 cloud().getClient().rpc('amber_v317_gear_compare',{p_item_id:String(id)})
  .then(({data,error})=>{
   if(error)throw error;
   if(serial!==gearSequence||!cmp.isConnected)return;
   if(!data?.ok)throw Error('SERVER_COMPARISON_NOT_VERIFIED');
   showComparison(cmp,data);
  })
  .catch(e=>{if(serial===gearSequence&&cmp.isConnected)status.textContent='⚠️ เทียบจากเซิร์ฟเวอร์ไม่ได้: '+String(e.message||e).slice(0,110)});
 return result;
};

/* 4. A single "back to bag" action instead of reopening the inventory many times. */
function addBackToBag(root){
 if(!root||root.querySelector('#amber317BackBag'))return;
 const bar=document.createElement('div');bar.id='amber317BackBag';bar.style.cssText='position:sticky;bottom:0;margin:10px 0 0;padding:8px 2px;background:#122333f0;z-index:12';
 const btn=document.createElement('button');btn.type='button';btn.className='goldbtn';btn.style.cssText='width:100%;padding:11px';
 btn.textContent='🎒 กลับกระเป๋า (ตำแหน่งเดิม)';
 btn.onclick=()=>{window.openInventory?.();const body=$('modalBody');if(body)body.scrollTop=lastInventoryScroll;};
 bar.appendChild(btn);root.appendChild(bar);
}
const originalInventory=window.openInventory;
if(typeof originalInventory==='function')window.openInventory=function amber317Inventory(...args){
 const result=originalInventory.apply(this,args);
 const root=$('modalBody');
 if(root&&String($('modalTitle')?.textContent||'').includes('กระเป๋า')){
  root.scrollTop=lastInventoryScroll;
 }
 return result;
};
const originalBagItem=window.itemClick;
if(typeof originalBagItem==='function')window.itemClick=function amber317BagItem(...args){
 const body=$('modalBody');
 if(body&&String($('modalTitle')?.textContent||'').includes('กระเป๋า'))lastInventoryScroll=body.scrollTop;
 const result=originalBagItem.apply(this,args);
 if(String($('modalTitle')?.textContent||'').startsWith('🎒'))addBackToBag($('modalBody'));
 return result;
};

/* 5. Resume a lost AUTO timer after UI tabs or Android visibility changes,
      but never during a server AFK session or a dungeon/raid. */
let lastTickCall=Date.now();
const originalTick=window.tick;
if(typeof originalTick==='function')window.tick=function amber317TrackTick(...args){
 lastTickCall=Date.now();
 return originalTick.apply(this,args);
};
const recovery=()=>{
 try{
  if(document.hidden||!online()||typeof state==='undefined'||!state.auto)return;
  if(window.AMBER_V312?.status?.()?.active)return;
  if($('px26Arena')||window.AMBER_DUNGEON?.isInside?.())return;
  if(typeof timer==='undefined')return;
  // A throttled mobile tab can preserve a dead timer handle. Recover only
  // after more than 8 seconds without an actual tick invocation.
  if(timer&&Date.now()-lastTickCall>8000){
    clearInterval(timer);timer=null;
  }
  if(timer)return;
  const target=typeof mob==='function'?mob():null;
  if(!target||['dungeon','worldboss'].includes(target.map))return;
  const speed=Math.max(785,Math.round(830-(Number(state.stats?.AGI)||0)*1.5));
  timer=setInterval(()=>window.tick?.(),speed);
  lastTickCall=Date.now();
  console.info('[V317] Restored AUTO timer after UI transition');
 }catch(e){console.warn('[V317 AUTO]',e)}
};
document.addEventListener('click',e=>{
 if(e.target.closest?.('.nav button,.pathbar button,[data-v25],.tabbar button'))setTimeout(recovery,650);
},true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(recovery,400)});
window.addEventListener('pageshow',()=>setTimeout(recovery,400));
setInterval(recovery,5000);

window.AMBER_V317_QOL=Object.freeze({version:'31.7',serverSkills:true,potionQuantityMax:1000,comparison:'server',bagReturn:true,autoTimerRecovery:true});
console.info('[V31.7] Gameplay QoL patches loaded');
})();
