/* 55 AMBERLANDS — CBT notice (visual-only addon).
   Does not modify game logic, Supabase, character data, or UI placements.
   Shows only AFTER successful Google login + cloud character load.
*/
(() => {
  'use strict';
  const PERMANENT_KEY = '55amberlands_cbt_poster_dismissed_permanently_v1';
  const IMAGE_URL = './assets/notice/amberlands_cbt_announcement.png';
  let shownThisPage = false;
  let dismissedThisPage = false;
  let overlay = null;
  let observer = null;
  let priorOverflow = null;
  let priorFocus = null;

  const permanentlyDismissed = () => {
    try { return localStorage.getItem(PERMANENT_KEY) === 'yes'; }
    catch (_) { return false; }
  };
  const loginComplete = () => {
    // Cloud loading (including first-character creation) must have finished.
    const s = window.AMBER_ONLINE_STATUS;
    return document.documentElement.classList.contains('amber-ready')
      && s?.signedIn === true && s?.cloudReady === true;
  };

  function closeNotice(permanent) {
    if (permanent) {
      try { localStorage.setItem(PERMANENT_KEY, 'yes'); }
      catch (_) { /* storage blocked: dismiss for the current page instead */ }
    }
    dismissedThisPage = true;
    if (overlay) { overlay.remove(); overlay = null; }
    if (priorOverflow !== null) {
      document.body.style.overflow = priorOverflow;
      priorOverflow = null;
    }
    if (priorFocus?.isConnected) priorFocus.focus?.({preventScroll:true});
    priorFocus = null;
    observer?.disconnect();
    observer = null;
  }

  function showNotice() {
    if (shownThisPage || dismissedThisPage || permanentlyDismissed() || !loginComplete()) return;
    shownThisPage = true;
    observer?.disconnect();
    observer = null;
    priorFocus = document.activeElement;
    priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const backdrop = document.createElement('div');
    backdrop.id = 'amberCbtNotice';
    backdrop.setAttribute('role','dialog');
    backdrop.setAttribute('aria-modal','true');
    backdrop.setAttribute('aria-label','ประกาศช่วงทดสอบ CBT เกม 55 AMBERLANDS');
    backdrop.innerHTML = `
      <style>
        #amberCbtNotice, #amberCbtNotice * { box-sizing:border-box; }
        #amberCbtNotice {
          position:fixed!important;inset:0!important;z-index:2147483647!important;
          display:flex!important;align-items:center;justify-content:center;
          background:rgba(2,5,15,.92);padding:calc(10px + env(safe-area-inset-top,0px))
          calc(10px + env(safe-area-inset-right,0px))
          calc(10px + env(safe-area-inset-bottom,0px))
          calc(10px + env(safe-area-inset-left,0px));
          font-family:system-ui,'Noto Sans Thai',sans-serif;color:#fff;
          overflow:auto;overscroll-behavior:contain;
        }
        #amberCbtNotice .amberCbtFrame {
          position:relative;display:flex;flex-direction:column;align-items:stretch;
          width:min(440px,100%);max-height:100%;min-height:0;
          border:2px solid #d8a755;border-radius:12px;
          background:linear-gradient(180deg,#14243c,#080f20);
          box-shadow:0 14px 55px rgba(0,0,0,.85);
          padding:9px;gap:9px;
        }
        #amberCbtNotice .amberCbtPicture {
          width:100%;height:auto;max-height:calc(100dvh - 155px);
          object-fit:contain;display:block;min-height:0;
          border-radius:5px;
          background:#0a1627;
        }
        #amberCbtNotice .amberCbtButtons {display:grid;grid-template-columns:1fr 1fr;gap:8px;flex-shrink:0;}
        #amberCbtNotice button {
          color:#fff4db;font:700 clamp(12px,3.3vw,14px) system-ui,'Noto Sans Thai',sans-serif;
          border-radius:8px;cursor:pointer;min-height:47px;line-height:1.3;padding:8px 6px;
          border:1px solid #e9bf74;touch-action:manipulation;
        }
        #amberCbtNotice .amberCbtOnce {background:linear-gradient(#b57825,#71400f);}
        #amberCbtNotice .amberCbtAlways {background:linear-gradient(#30455e,#132238);}
        #amberCbtNotice .amberCbtX {
          position:absolute;right:3px;top:3px;width:39px;height:39px;min-height:39px;
          border-radius:50%;background:rgba(5,11,22,.93);
          border:2px solid #ffe19c;font-size:25px;z-index:2;padding:0;
          display:flex;align-items:center;justify-content:center;
        }
        #amberCbtNotice .amberCbtHint {
          text-align:center;color:#c5d0e5;font-size:11px;line-height:1.35;
        }
        @media (max-height:560px) {
          #amberCbtNotice { align-items:flex-start; }
          #amberCbtNotice .amberCbtPicture { max-height:calc(100dvh - 130px); }
        }
      </style>
      <div class="amberCbtFrame">
        <button type="button" class="amberCbtX" aria-label="ปิดประกาศเฉพาะครั้งนี้">×</button>
        <img class="amberCbtPicture" src="${IMAGE_URL}" alt="ประกาศช่วงทดสอบ CBT ของ 55 AMBERLANDS กำลังปรับปรุงและแก้ไขระบบเกม และจะรีเซ็ตตัวละครทั้งหมดเมื่อเปิด Open Beta" />
        <div class="amberCbtButtons">
          <button type="button" class="amberCbtOnce">ปิดเฉพาะครั้งนี้</button>
          <button type="button" class="amberCbtAlways">ปิดถาวร (เครื่องนี้)</button>
        </div>
        <div class="amberCbtHint">กากบาทหรือปิดครั้งนี้: เข้าเกมใหม่จะแสดงอีก • ปิดถาวร: จำไว้ในเบราว์เซอร์นี้</div>
      </div>`;
    document.body.appendChild(backdrop);
    overlay = backdrop;
    backdrop.querySelector('.amberCbtOnce').addEventListener('click',()=>closeNotice(false));
    backdrop.querySelector('.amberCbtX').addEventListener('click',()=>closeNotice(false));
    backdrop.querySelector('.amberCbtAlways').addEventListener('click',()=>closeNotice(true));
    backdrop.querySelector('.amberCbtX').focus({preventScroll:true});
  }

  function startObserver() {
    if (permanentlyDismissed()) return;
    // The existing online bridge marks amber-ready only after loadCloud()
    // has finished; observe this marker rather than changing any bridge code.
    if (loginComplete()) { showNotice(); return; }
    observer = new MutationObserver(() => {
      if (loginComplete()) showNotice();
    });
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',startObserver,{once:true});
  } else startObserver();

  // Only debugging/accessibility helpers; no game state or Supabase mutation.
  window.AMBER_CBT_NOTICE = Object.freeze({
    resetPermanentDismissal() {
      try { localStorage.removeItem(PERMANENT_KEY); return true; }catch (_) { return false; }
    },
    isPermanentlyDismissed: permanentlyDismissed
  });
})();
