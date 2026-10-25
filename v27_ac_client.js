/* 55 AMBERLANDS V27.1.1 client-to-Supabase bridge.
 * IMPORTANT: Uses only RPCs already installed in Supabase V27.1.1.
 * Never awards valuable resources from browser-side data.
 * No SQL writes except authenticated, server-authoritative RPCs.
 */
(() => {
  'use strict';
  const cloud = () => window.AMBER_CLOUD;
  const account = () => cloud()?.getUser()?.id || '';
  const ready = () => Boolean(account() && cloud()?.getStatus()?.cloudReady && cloud()?.getClient());
  const v25 = () => window.AMBER_V25;
  const warn = message => {
    console.warn('[AMBER V27]', message);
    try { if (typeof notify === 'function') notify('🛡️ ' + message); } catch (_) {}
  };
  let server = null, serverFor = '', loading = null, busy = false;

  async function syncState(force = false) {
    if (!ready()) { server = null; serverFor = ''; return null; }
    const user = account();
    if (!force && serverFor === user && server) return server;
    if (loading) return loading;
    loading = (async () => {
      const { data, error } = await cloud().getClient().rpc('amber_ac_state');
      if (error) throw error;
      if (user !== account()) return null;
      serverFor = user; server = data;
      const v = v25()?.V();
      if (v && data) {
        v.checkin.day = Number(data.checkin_day) || 0;
        v.checkin.last = data.checkin_last || '';
      }
      return data;
    })();
    try { return await loading; }
    catch (e) { console.error('[V27 state]', e); server = null; warn('โหลดสถานะรางวัลจากเซิร์ฟเวอร์ไม่สำเร็จ'); return null; }
    finally { loading = null; }
  }
  const getState = () => serverFor === account() ? server : null;
  const formatReward = r => {
    if (!r) return '';
    const arr = [];
    const names = { gold: 'Gold', gems: 'คอยล์', gw: 'เพชรเพลิง', ga: 'ไข่มุก', ore_prism: 'แร่รุ้ง', potHP: 'ยา HP', potMP: 'ยา MP' };
    for (const [key, name] of Object.entries(names)) {
      const qty = key in r ? Number(r[key]) : 0;
      if (Number.isFinite(qty) && qty > 0) arr.push(name + ' ×' + qty.toLocaleString('th-TH'));
    }
    return arr.join(' · ');
  };
  const reason = code => ({
    already_claimed: 'รับรางวัลนี้ไปแล้ว',
    no_server_verified_result: 'ยังไม่มีผลบอสที่เซิร์ฟเวอร์รับรอง จึงยังจ่ายคอยล์ไม่ได้',
    boss_not_defeated: 'บอสยังไม่ถูกปราบ',
    verified_friends_required: 'ยังมีเพื่อนเลเวล 5 ที่เซิร์ฟเวอร์ยืนยันไม่ครบ',
    already_redeemed: 'บัญชีนี้ใช้รหัสเชิญแล้ว',
    invalid_or_self_code: 'รหัสเชิญไม่ถูกต้อง หรือเป็นรหัสตัวเอง',
    invalid_code: 'รูปแบบรหัสไม่ถูกต้อง'
  }[code] || String(code || 'เซิร์ฟเวอร์ยังไม่อนุมัติรางวัล'));

  async function claimRpc(name, params, success) {
    if (!ready()) { warn('ต้องล็อกอิน Google และโหลดตัวละครให้เสร็จก่อน'); return {ok:false, reason:'login_required'}; }
    if (busy) { warn('กำลังตรวจรายการก่อนหน้า'); return {ok:false, reason:'busy'}; }
    busy = true;
    let locked = false;
    try {
      // The live game autosaves every 15 seconds. Reuse its existing market mutex
      // so an older browser save cannot immediately erase a server-granted wallet.
      await cloud().beginMarket();
      locked = true;
      const { data, error } = await cloud().getClient().rpc(name, params || {});
      if (error) throw error;
      if (data?.ok !== true) { warn(reason(data?.reason)); return {ok:false, reason:data?.reason || 'rejected'}; }
      // Pull server wallet AFTER the RPC transaction. endMarket also unlocks autosave.
      await cloud().endMarket();
      locked = false;
      await syncState(true);
      if (success) await success(data);
      v25()?.refresh();
      warn('ยืนยันจากเซิร์ฟเวอร์แล้ว' + (data.reward ? ' · ' + formatReward(data.reward) : ''));
      return {ok:true, data};
    } catch (e) {
      console.error('[V27 claim]', name, e);
      warn('ทำรายการไม่สำเร็จ: ' + (e?.message || String(e)));
      return {ok:false, reason:'rpc_error'};
    } finally {
      if (locked) { try { await cloud().endMarket(); } catch (e) { console.error('[V27 unlock]', e); } }
      busy = false;
    }
  }

  async function checkin() {
    await claimRpc('amber_ac_checkin', {}, async () => {
      // Re-sync with the authoritative server day; do not apply grant() locally.
      await v25()?.open('checkin');
    });
  }
  async function loginMission(index) {
    await claimRpc('amber_ac_login_mission', {}, async () => {
      const m = v25()?.V()?.daily?.m?.[index];
      if (m?.id === 'login') m.claimed = true;
      v25()?.commit();
      await v25()?.open('daily');
    });
  }
  async function refRedeem(code) {
    await claimRpc('amber_ac_referral_redeem', { p_code: String(code || '').trim().toUpperCase() }, async () => {
      const ref = v25()?.V()?.ref;
      if (ref) ref.redeemed = true;
      v25()?.commit();
      warn('ลงทะเบียนรหัสแล้ว รางวัลจะรอระบบตรวจเลเวลจากเซิร์ฟเวอร์');
      await v25()?.open('invite');
    });
  }
  async function refBonus(level) {
    await claimRpc('amber_ac_referral_bonus', { p_threshold: Number(level) }, async () => {
      const ref = v25()?.V()?.ref;
      if (ref && !ref.claimed.includes(Number(level))) ref.claimed.push(Number(level));
      v25()?.commit();
      await v25()?.open('invite');
    });
  }
  async function worldClaim() {
    const info = await syncState(true);
    if (!info?.today_th) { warn('ยังตรวจวันที่กิจกรรมจากเซิร์ฟเวอร์ไม่ได้'); return {ok:false, reason:'server_date_unavailable'}; }
    // Return the server receipt. Arena must NEVER mark victory rewards claimed before this is ok.
    return await claimRpc('amber_ac_world_claim', { p_event_day: info.today_th });
  }

  // Only authoritative RPC payouts are trusted. Do not provide any grant bypass.
  window.AMBER_V27 = Object.freeze({
    syncState, getState, checkin, loginMission, refRedeem, refBonus,
    worldClaim, blockClientScore: true
  });
})();
