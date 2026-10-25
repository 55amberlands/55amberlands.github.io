/* 55 AMBERLANDS — Device sign-in (additive authentication UI only).
 * Uses Supabase Anonymous Sign-ins via the existing AMBER_CLOUD client.
 * Never edits gameplay, saves, Supabase schema, Google OAuth or game UI.
 * Caveat: session is tied to this browser's stored auth tokens, not hardware.
 */
(() => {
  'use strict';
  const BUTTON_ID = 'amberDeviceSignIn';
  const HINT_ID = 'amberDeviceSignInHint';
  let busy = false;
  let observed = null;

  function addOption() {
    const gate = document.getElementById('amberOnlineGate');
    if (!gate) return false;
    const controls = gate.querySelector('#amberGateControls');
    if (!controls || controls.querySelector('#' + BUTTON_ID)) return !!controls?.querySelector('#' + BUTTON_ID);
    const googleButton = Array.from(controls.querySelectorAll('button')).find(btn =>
      /Google/i.test(btn.textContent || ''));
    if (!googleButton) return false;

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.textContent = '📱 เข้าเกมด้วยเครื่องนี้ (ไม่ใช้ Gmail)';
    button.style.cssText = 'background:linear-gradient(180deg,#285a73,#16364d);border-color:#75d2ea;';

    const hint = document.createElement('div');
    hint.id = HINT_ID;
    hint.setAttribute('role', 'status');
    hint.setAttribute('aria-live', 'polite');
    hint.style.cssText = 'margin-top:9px;color:#bcd6df;font-size:12px;line-height:1.6;text-align:left;';
    hint.textContent = 'ไม่ต้องสมัคร Gmail • จำตัวละครในเบราว์เซอร์นี้ • หากล้างข้อมูลเว็บหรือเปลี่ยนเครื่อง อาจกู้คืนไม่ได้';

    button.addEventListener('click', async () => {
      if (busy) return;
      const client = window.AMBER_CLOUD?.getClient?.();
      if (!client?.auth?.signInAnonymously) {
        hint.textContent = 'ยังไม่สามารถเริ่มระบบจำเครื่องได้ กรุณาตรวจการเชื่อมต่อและรีเฟรชเกม';
        return;
      }
      busy = true;
      button.disabled = true;
      button.textContent = 'กำลังสร้างบัญชีสำหรับเครื่องนี้...';
      hint.textContent = 'กำลังเข้าสู่ระบบ โปรดอย่าปิดหน้านี้';
      try {
        // Existing auth has persistSession=true. Supabase stores the anonymous
        // session in this origin's browser storage and restores it next visit.
        const {data, error} = await client.auth.signInAnonymously();
        if (error) throw error;
        if (!data?.session?.user?.id && !data?.user?.id) throw new Error('ไม่พบข้อมูลบัญชีที่ได้รับ');
        // Reload into the existing, unchanged boot() / loadCloud() flow.
        window.location.reload();
      } catch (err) {
        console.error('[55 AMBERLANDS Device Login]', err);
        const msg = String(err?.message || err || 'Unknown error');
        hint.textContent = /anonymous.{0,25}(disabled|not allowed)|signups not allowed|anonymous sign-ins are disabled/i.test(msg)
          ? 'ผู้ดูแลยังไม่ได้เปิด Allow anonymous sign-ins ใน Supabase → Authentication → Settings'
          : 'เข้าเกมด้วยเครื่องนี้ไม่สำเร็จ: ' + msg.slice(0, 160);
        button.disabled = false;
        button.textContent = '📱 ลองเข้าเกมด้วยเครื่องนี้อีกครั้ง';
        busy = false;
      }
    });

    googleButton.insertAdjacentElement('afterend', button);
    button.insertAdjacentElement('afterend', hint);
    return true;
  }

  function start() {
    if (addOption()) return;
    // Login overlay is created asynchronously while Supabase checks sessions.
    // Stop observing after installing the button; do not watch gameplay DOM.
    observed = new MutationObserver(() => {
      if (addOption()) {
        observed?.disconnect();
        observed = null;
      }
    });
    observed.observe(document.body, {subtree:true, childList:true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
