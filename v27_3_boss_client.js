/* 55 AMBERLANDS V27.3 — real world boss uses SERVER-VERIFIED combat.
 * No local win, damage, party broadcast, or client clock can grant a prize.
 * The legacy regular-monster economy remains unverified; see README.
 */
(() => {
  'use strict';
  const cloud = () => window.AMBER_CLOUD;
  const ready = () => Boolean(cloud()?.getUser()?.id && cloud()?.getStatus()?.cloudReady && cloud()?.getClient());
  let locked = false, busy = false, recentEvent = '';
  async function rpc(name, args = {}) {
    const { data, error } = await cloud().getClient().rpc(name, args);
    if (error) throw error;
    return data || {ok:false, reason:'empty_response'};
  }
  const errorString = e => e?.message || String(e);
  async function unlock() {
    if (!locked) return;
    try { await cloud().endMarket(); }
    finally { locked = false; }
  }
  async function join() {
    if (!ready()) return {ok:false,reason:'login_required'};
    if (locked) return {ok:false,reason:'already_in_session'};
    try {
      await cloud().beginMarket();
      locked = true; // Suppress stale 15-second autosaves while server decrements arena potions.
      const r = await rpc('amber_v273_join');
      if (!r.ok) await unlock();
      else recentEvent = r.event_key;
      return r;
    } catch (e) {
      console.error('[V27.3 join]', e);
      try { await unlock(); } catch (err) { console.error(err); }
      return {ok:false,reason:errorString(e)};
    }
  }
  async function attack(autoSkill, autoPotion) {
    if (!ready() || !locked) return {ok:false,reason:'not_joined'};
    if (busy) return {ok:false,reason:'busy'};
    busy = true;
    try { return await rpc('amber_v273_attack', {p_skill:!!autoSkill,p_auto_potion:!!autoPotion}); }
    catch (e) { console.error('[V27.3 attack]',e); return {ok:false,reason:errorString(e)}; }
    finally { busy = false; }
  }
  async function status(key = null) {
    if (!ready()) return {ok:false,reason:'login_required'};
    try { return await rpc('amber_v273_status', {p_event_key:key}); }
    catch (e) { return {ok:false,reason:errorString(e)}; }
  }
  async function claim(key = null) {
    if (!ready()) return {ok:false,reason:'login_required'};
    let temporaryLock = false;
    try {
      if (!locked) {
        await cloud().beginMarket();
        locked = true; temporaryLock = true;
      }
      const r = await rpc('amber_v273_claim', {p_event_key:key||recentEvent||null});
      if (r.ok || r.reason === 'already_claimed') recentEvent = r.event_key || recentEvent;
      // IMPORTANT: pull server wallet before allowing autosave again.
      await unlock();
      window.AMBER_V25?.refresh?.();
      return r;
    } catch (e) {
      console.error('[V27.3 claim]',e);
      return {ok:false,reason:errorString(e)};
    } finally {
      if (locked && temporaryLock) { try { await unlock(); } catch (e) { console.error(e); } }
    }
  }
  async function leave() {
    // Read-only check / unlock. Autosave can resume after refreshing server potion stock.
    try { await unlock(); } catch (e) { console.error('[V27.3 leave]',e); }
  }
  async function claimLast() {
    const r = await claim(null);
    const txt = r.ok ? '✅ เซิร์ฟเวอร์จ่ายรางวัลบอสแร่แล้ว'
      : r.reason === 'already_claimed' ? '✅ รับรางวัลรอบล่าสุดไปแล้ว'
      : '🛡️ ยังไม่ได้รับรางวัลจากเซิร์ฟเวอร์: ' + (r.reason || 'ไม่พบผลที่ยืนยัน');
    if (typeof notify === 'function') notify(txt);
    return r;
  }
  window.AMBER_V273 = Object.freeze({ready,join,attack,status,claim,leave,claimLast});
})();
