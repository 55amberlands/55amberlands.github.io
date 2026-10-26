/* 55 AMBERLANDS V30.8: verified titles and world-boss entry points.
   DISPLAY ONLY except RPC user-initiated selection of a server-authorized title. */
(()=>{'use strict';
if(window.AMBER_V308_LIVE_FIX)return;
window.AMBER_V308_LIVE_FIX=Object.freeze({version:'30.8',mode:'server-read-only-plus-title-selection'});
const css=document.createElement('style');css.id='amber-v308-display';css.textContent=`
#amber308BossStatus{display:flex;flex-wrap:wrap;gap:5px;max-width:100%;box-sizing:border-box;margin:8px 0 5px}
#amber308BossStatus button{flex:1 1 145px;max-width:100%;min-width:0;box-sizing:border-box;text-align:left;white-space:normal;
  font:700 11px/1.45 system-ui;background:#192b40;color:#f5d78b;border:1px solid #b99549;border-radius:9px;padding:7px 9px}
#amber308BossStatus small{display:block;color:#c7ddf5;font-size:10px;font-weight:500}
#amber308TitleUse{font:700 11px system-ui;background:#182b41;color:#ffe5a1;border:1px solid #dca94a;border-radius:7px;padding:5px 9px;max-width:100%;box-sizing:border-box}
/* Force modern canvas to cover any V1 background: do not hide the live boss or hero sprites. */
#scene{isolation:isolate;max-width:100%;box-sizing:border-box;overflow:hidden}
#scene #px24Scene{left:0!important;top:0!important;width:100%!important;height:100%!important;max-width:100%!important;display:block!important}
#scene #sprites .sprite>img:not(.px24-hero):not(.px24-wing):not(.amber20-characterWing):not(.amber23-pet-sprite):not(.px25-aura):not(.px24-equipfx){background:transparent!important;border:0!important;box-shadow:none!important}
#scene #sprites .sprite>img.px24-hero{background:transparent!important;object-fit:contain!important;max-width:100%!important}
@media(max-width:700px){#amber308BossStatus{gap:4px}#amber308BossStatus button{flex-basis:125px;font-size:10px;padding:6px}
#amber308TitleUse{font-size:10px}#px25EmoBtn{z-index:35!important}}
`;document.head.appendChild(css);
const $=id=>document.getElementById(id);
const W=()=>window.AMBER_V25;
function status(){const v=W();const obj=v?.wbWindow?.();if(!obj)return 'ดูบอสโลกเดิม';
  const mins=Math.max(0,Math.ceil((Number(obj.open?obj.end:obj.next)-Date.now())/60000));
  if(obj.open)return `รอบบอสเปิดตามเวลา · ${mins} นาที`;
  return Number.isFinite(mins)?`รอบถัดไปอีกประมาณ ${mins} นาที`:'ดูรอบบอส';}
function mount(){
  // Keep notice in the static character profile; never place it inside realtime canvas or modal.
  const host=$('amberStatStrip')?.parentElement||$('pname')?.parentElement;
  if(!host)return;
  let bar=$('amber308BossStatus');if(!bar){bar=document.createElement('div');bar.id='amber308BossStatus';
    bar.innerHTML='<button type="button" data-v308-boss="legacy">👑 บอสโลกเดิม <small data-v308-label="old">ดูรอบบอส</small></button><button type="button" data-v308-boss="new">🐉 บอสโลกใหม่ V28 <small>10 บอส · สมุดบอส · แลกอาวุธ</small></button>';
  }
  if(bar.parentElement!==host)host.appendChild(bar);
  const old=bar.querySelector('[data-v308-label="old"]');const txt=status();if(old&&old.textContent!==txt)old.textContent=txt;
  const v=window.AMBER_V304_TITLES;
  if(!v)return;
  const verified=v.status?.();let b=$('amber308TitleUse');
  if(verified?.loaded && verified.owned?.includes('plus10')){
    if(!b){b=document.createElement('button');b.id='amber308TitleUse';b.type='button';b.textContent='⚡ ใช้ฉายาอาวุธ +10';}
    if(b.parentElement!==host)host.appendChild(b);
    b.disabled=verified.active==='plus10';b.textContent=b.disabled?'⚡ ฉายา +10 กำลังแสดง':'⚡ เลือกฉายาอาวุธ +10';
  }else if(b)b.remove();
}
document.addEventListener('click',e=>{
  const t=e.target.closest?.('[data-v308-boss]');
  if(t){e.preventDefault();const tab=t.dataset.v308Boss==='legacy'?'legacy':'select';
    if(window.AMBER_V28_HUB?.open)window.AMBER_V28_HUB.open(tab);
    else window.AMBER_V25?.open?.('boss');
    return;
  }
  if(e.target.closest?.('#amber308TitleUse')){
    e.preventDefault();e.target.disabled=true;
    Promise.resolve(window.AMBER_V304_TITLES?.select?.('plus10')).finally(()=>{e.target.disabled=false;mount()});
  }
});
// Owner server already validates unlock. Do not grant titles from the client.
setInterval(()=>{if(!document.hidden)mount();},5000);
setTimeout(()=>{mount();void window.AMBER_V304_TITLES?.refresh?.(true);},400);
window.addEventListener('focus',()=>{mount();void window.AMBER_V304_TITLES?.refresh?.(true)});
})();
