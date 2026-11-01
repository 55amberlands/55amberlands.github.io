/* 55 AMBERLANDS — Open Beta November 10, 2026: visual notice only.
 * Works before Google login, shows once per browser, never modifies game state.
 */
(()=>{
'use strict';
if(window.AMBER_OPEN_BETA)return;
const KEY='55amberlands_open_beta_nov10_2026_seen_v1';
let backdrop=null,oldFocus=null,oldOverflow=null;
const seen=()=>{try{return localStorage.getItem(KEY)==='1';}catch(_){return false;}};
function onKey(ev){if(ev.key==='Escape')close();}
function close(){
 if(!backdrop)return;
 try{localStorage.setItem(KEY,'1');}catch(_){}
 backdrop.remove();backdrop=null;
 document.removeEventListener('keydown',onKey);
 if(oldOverflow!==null){document.body.style.overflow=oldOverflow;oldOverflow=null;}
 if(oldFocus?.isConnected)try{oldFocus.focus({preventScroll:true});}catch(_){}
 oldFocus=null;
}
function show(force=false){
 if(backdrop||(!force&&seen()))return;
 if(!document.body){document.addEventListener('DOMContentLoaded',()=>show(force),{once:true});return;}
 oldFocus=document.activeElement;oldOverflow=document.body.style.overflow;
 document.body.style.overflow='hidden';
 backdrop=document.createElement('div');
 backdrop.id='amberOpenBetaNov10';backdrop.setAttribute('role','dialog');
 backdrop.setAttribute('aria-modal','true');
 backdrop.setAttribute('aria-label','เปิด Open Beta วันที่ 10 พฤศจิกายน 2569');
 backdrop.innerHTML="<style>\n #amberOpenBetaNov10,#amberOpenBetaNov10 *{box-sizing:border-box}\n #amberOpenBetaNov10{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:center;justify-content:center;background:rgba(1,5,17,.93);padding:max(10px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));overflow:auto;overscroll-behavior:contain;color:#fff;font-family:system-ui,'Noto Sans Thai',sans-serif}\n #amberOpenBetaNov10 .ob-card{width:min(760px,100%);max-height:100%;min-height:0;position:relative;display:flex;flex-direction:column;gap:7px;align-items:stretch;padding:8px;background:linear-gradient(160deg,#3f2054,#110d2b);border:2px solid #e8bd6e;border-radius:12px;box-shadow:0 14px 45px #000a,0 0 25px #8e50d658}\n #amberOpenBetaNov10 img.ob-poster{display:block;width:100%;max-height:calc(100dvh - 155px);min-height:0;object-fit:contain;aspect-ratio:4/3;border-radius:6px;background:#120a24}\n #amberOpenBetaNov10 .ob-close{position:absolute;top:9px;right:9px;width:42px;height:42px;min-width:42px;min-height:42px;padding:0;display:grid;place-items:center;border-radius:50%;background:linear-gradient(#cf3a37,#81131a);color:#fff;font-size:26px;line-height:1;border:2px solid #ffdf93;box-shadow:0 3px 13px #000c;z-index:2;cursor:pointer;touch-action:manipulation}\n #amberOpenBetaNov10 .ob-date{padding:5px 3px 2px;text-align:center;color:#ffedc0;font-weight:900;font-size:clamp(12px,3.4vw,18px);text-shadow:0 0 6px #ff7e3e}\n #amberOpenBetaNov10 .ob-ok{width:100%;min-height:46px;border:1px solid #ffdf8b;border-radius:8px;font-weight:800;background:linear-gradient(#e7ad50,#855015);color:#fff8e4;font-size:clamp(14px,3.8vw,18px);cursor:pointer;touch-action:manipulation}\n #amberOpenBetaNov10 .ob-hint{font-size:11px;color:#bbbfde;text-align:center;line-height:1.35}\n @media(max-height:550px){#amberOpenBetaNov10{align-items:flex-start}#amberOpenBetaNov10 img.ob-poster{max-height:calc(100dvh - 132px)}}\n @media(prefers-reduced-motion:reduce){#amberOpenBetaNov10 *{animation:none!important}}\n </style>\n <div class=\"ob-card\" role=\"document\">\n <button type=\"button\" class=\"ob-close\" aria-label=\"ปิดประกาศ\">×</button>\n <img class=\"ob-poster\" src=\"./assets/notice/amberlands_open_beta_2026_11_10.webp\" alt=\"55 AMBERLANDS เปิด Open Beta วันที่ 10 พฤศจิกายน 2569\">\n <div class=\"ob-date\">✨ เปิด Open Beta วันที่ 10 พฤศจิกายน 2569 ✨</div>\n <button type=\"button\" class=\"ob-ok\">รับทราบ · เข้าเกม</button>\n <div class=\"ob-hint\">แสดงครั้งแรกบนอุปกรณ์นี้ · กดปิดเพื่อกลับสู่หน้าเกมหรือเข้าสู่ระบบ Google</div>\n </div>";
 document.body.appendChild(backdrop);
 backdrop.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',close));
 backdrop.addEventListener('click',ev=>{if(ev.target===backdrop)close();});
 backdrop.querySelector('.ob-poster')?.addEventListener('error',()=>{
  const img=backdrop?.querySelector('.ob-poster');
  if(img){img.style.display='none';const n=document.createElement('div');
   n.style.cssText='padding:30px 12px;text-align:center;color:#ffe6b1;font-size:20px;font-weight:900';
   n.textContent='55 AMBERLANDS — OPEN BETA 10 พฤศจิกายน 2569';img.after(n);}
 });
 document.addEventListener('keydown',onKey);
 try{backdrop.querySelector('.ob-close').focus({preventScroll:true});}catch(_){}
}
window.AMBER_OPEN_BETA=Object.freeze({show:()=>show(true),close,isDismissed:seen});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>show(),{once:true});
else show();
})();