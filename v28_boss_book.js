/* 55 AMBERLANDS V28 — WORLD BOSS HUB: choose a boss (10) · boss book · ultimate-weapon exchange
 *  Pages:  1) เลือกบอส   2) สมุดบอส (what each boss drops)   3) แลกอาวุธตำนาน (4 lines, 30 of each fragment)
 *  SECURITY MODEL: this file NEVER grants fragments or weapons. It only calls server RPCs `amber_v28_*`
 *  and shows what the server answers. Fragment counts are kept in memory only (never in the save / localStorage).
 *  If the server functions are not installed yet, real fights/exchange are disabled; practice mode still works.
 *  CLIENT ONLY: no SQL here. The server contract is in SUPABASE_V28_SPEC_FOR_GPT.md
 */
(() => {
'use strict';
const PX = window.PX; if (!PX || !PX.worldBosses) return;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"'`]/g, c => '&#' + c.charCodeAt(0) + ';');
const fmt = n => Math.max(0, Math.floor(Number(n) || 0)).toLocaleString('th-TH');
const safe = (fn, d) => { try { return fn(); } catch (e) { console.warn('[v28 boss]', e && e.message); return d; } };
const WB = PX.worldBosses, LIST = WB.LIST;
const MIN_DMG = 100000, NEED = 30, DROP = [2, 3];
const cloud = () => window.AMBER_CLOUD;
const ready = () => !!(cloud()?.getUser?.()?.id && cloud()?.getStatus?.()?.cloudReady && cloud()?.getClient?.());

/* ============================================================ server adapter */
let locked = false, busy = false, recentEvent = '', installed = null;          // installed: null unknown / true / false
let FR = null;                                                                  // {frag_x: n}
let OWN = [];                                                                   // owned ultimate weapons (from server)
async function rpc(name, args) {
  const { data, error } = await cloud().getClient().rpc(name, args || {});
  if (error) { const m = String(error.message || error.code || error); if (/Could not find the function|42883|PGRST202|does not exist/i.test(m + ' ' + (error.code || ''))) installed = false; throw error; }
  installed = true; return data || { ok: false, reason: 'empty_response' };
}
const errS = e => e?.message || String(e);
async function unlock() { if (!locked) return; try { await cloud().endMarket(); } finally { locked = false; } }
const S = {
  ready: () => ready() && installed !== false,
  installed: () => installed,
  async probe() { if (!ready()) return { ok: false, reason: 'login_required' }; try { const r = await rpc('amber_v28_info'); return r; } catch (e) { return { ok: false, reason: errS(e) }; } },
  async refreshFragments() {
    if (!ready()) { FR = null; return null; }
    try { const r = await rpc('amber_v28_fragments'); if (r.ok) { FR = r.fragments || {}; OWN = r.weapons || []; } return r; } catch (e) { return { ok: false, reason: errS(e) }; }
  },
  async join(bossId) {
    if (!ready()) return { ok: false, reason: 'login_required' };
    if (locked) return { ok: false, reason: 'already_in_session' };
    try { await cloud().beginMarket(); locked = true; const r = await rpc('amber_v28_join', { p_boss_id: bossId }); if (!r.ok) await unlock(); else recentEvent = r.event_key; return r; }
    catch (e) { try { await unlock(); } catch (x) { } return { ok: false, reason: installed === false ? 'server_not_installed' : errS(e) }; }
  },
  async attack(skill, potion) {
    if (!ready() || !locked) return { ok: false, reason: 'not_joined' }; if (busy) return { ok: false, reason: 'busy' }; busy = true;
    try { return await rpc('amber_v28_attack', { p_skill: !!skill, p_auto_potion: !!potion }); } catch (e) { return { ok: false, reason: errS(e) }; } finally { busy = false; }
  },
  async status(key, bossId) { if (!ready()) return { ok: false, reason: 'login_required' }; try { return await rpc('amber_v28_status', { p_event_key: key || null, p_boss_id: bossId || null }); } catch (e) { return { ok: false, reason: errS(e) }; } },
  async claim(key) {
    if (!ready()) return { ok: false, reason: 'login_required' }; let tmp = false;
    try {
      if (!locked) { await cloud().beginMarket(); locked = true; tmp = true; }
      const r = await rpc('amber_v28_claim', { p_event_key: key || recentEvent || null });
      if (r.ok || r.reason === 'already_claimed') recentEvent = r.event_key || recentEvent;
      await unlock(); safe(() => window.AMBER_V25?.refresh?.()); S.refreshFragments(); return r;
    } catch (e) { return { ok: false, reason: errS(e) }; } finally { if (locked && tmp) { try { await unlock(); } catch (x) { } } }
  },
  async leave() { try { await unlock(); } catch (e) { } },
  async exchange(cls) {
    if (!ready()) return { ok: false, reason: 'login_required' };
    try {
      await cloud().beginMarket(); let r; try { r = await rpc('amber_v28_exchange', { p_cls: cls }); } finally { await cloud().endMarket(); }
      if (r.ok) { safe(() => window.AMBER_V25?.refresh?.()); safe(() => { const st = (typeof state !== 'undefined' ? state : null); if (st && r.gear && !(st.gear || []).some(g => String(g.id) === String(r.gear.id))) { st.gear = st.gear || []; st.gear.push(r.gear); } }); await S.refreshFragments(); }
      return r;
    } catch (e) { return { ok: false, reason: installed === false ? 'server_not_installed' : errS(e) }; }
  }
};
window.AMBER_V28S = Object.freeze(S);

/* ============================================================ helpers */
const bossImg = b => safe(() => WB.table(b.id).idle[0].toURL(), '');
const fragIcon = b => safe(() => PX.uiSkin.icon(b.frag.icon), '');
const REASON = { login_required: 'ต้องล็อกอินก่อน', server_not_installed: 'เซิร์ฟเวอร์ยังไม่ได้ติดตั้งระบบบอสโลก V28', not_joined: 'ยังไม่ได้เข้าห้อง', busy: 'กำลังประมวลผล', not_enough_fragments: 'เศษบอสยังไม่ครบ 30 ชิ้นทุกชนิด', already_claimed: 'รับรางวัลรอบนี้ไปแล้ว', window_closed: 'ยังไม่ถึงเวลาบอสโลก (เปิดทุก 3 ชั่วโมง นาทีที่ 0–30)', already_owned: 'คุณมีอาวุธสายนี้อยู่แล้ว' };
const why = r => REASON[r && r.reason] || (r && r.reason) || 'ไม่สำเร็จ';
const winOpen = () => safe(() => window.AMBER_V25.wbWindow(), { open: false });
const fcount = id => FR ? (FR[id] | 0) : 0;
let TAB = 'select';

const TIPS = {
  phoenix: 'ลุกไหม้รอบตัว โจมตีเป็นคลื่นไฟ — เหมาะเริ่มต้นสำหรับผู้เล่นใหม่',
  titan: 'ฟ้าผ่าหลายสายพร้อมกัน — ยาลด/พกยา HP ไว้ให้พอ',
  cerberus: 'สามเศียรพ่นไฟเป็นแนวยาว — โจมตีรัวและอย่าให้เลือดต่ำกว่า 40%',
  leviathan: 'คลื่นน้ำถล่มทั้งสนาม — ควรเล่นเป็นปาร์ตี้ มีฮีลเลอร์/ยาเยอะ',
  empress: 'ลูกแก้วจันทราแตกกระจาย — ดาเมจสูงเป็นช่วงๆ',
  lich: 'ไฟวิญญาณหมุนวน ดูดเลือด — ต้องมีดาเมจสูงพอก่อนเลือดหมด',
  solar: 'ลำแสงสุริยะกวาดทั้งสนาม — ดาเมจแรงมาก',
  magma: 'ลาวาถล่มพื้น เลือดเยอะมาก — ควรมีปาร์ตี้และยา HP เต็มกระเป๋า',
  prism: 'แสงเจ็ดสีสะท้อนหลายครั้ง — ดาเมจหนักต่อเนื่อง',
  seraph: 'บอสสุดท้าย 5,000,000 HP — หลุมดำกลืนทุกอย่าง ต้องรวมพลปาร์ตี้เต็มกำลัง'
};
const SCALE = b => Math.round(b.atk);

/* ============================================================ UI */
const CSS = `
.px28h-tabs{display:flex;gap:6px;margin-bottom:10px}.px28h-tabs button{flex:1;padding:8px 4px;border-radius:10px;border:1px solid #3a4a78;background:#161e3a;color:#cfe0ff;font-weight:800;cursor:pointer}
.px28h-tabs button.on{background:linear-gradient(#5a3ac8,#2a1a78);color:#fff;border-color:#fff1a0}
.px28h-note{font-size:12px;line-height:1.5;color:#b8c6ee;background:#101834;border:1px solid #2a3a68;border-radius:10px;padding:8px 10px;margin-bottom:10px}
.px28h-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.px28h-card{border:2px solid var(--c,#4a5a98);border-radius:12px;background:linear-gradient(#141c3a,#0c1128);padding:8px;text-align:center;position:relative;box-shadow:0 0 12px -4px var(--c,#4a5a98)}
.px28h-card img.bs{width:100%;max-width:110px;height:auto;image-rendering:pixelated;display:block;margin:0 auto}
.px28h-card b{display:block;font-size:13px;margin-top:2px}.px28h-card small{display:block;color:#aab8e0;font-size:11px;line-height:1.4}
.px28h-lv{position:absolute;left:6px;top:6px;background:var(--c);color:#000;font-weight:900;border-radius:8px;padding:1px 7px;font-size:12px}
.px28h-btn{margin-top:6px;width:100%;padding:7px 4px;border-radius:9px;border:1px solid #fff1a0;background:linear-gradient(#ffb02e,#c8650a);color:#2a1200;font-weight:900;cursor:pointer}
.px28h-btn.alt{background:#1c2a58;color:#cfe0ff;border-color:#4a5a98}.px28h-btn[disabled]{opacity:.45;cursor:not-allowed}
.px28h-row{display:flex;gap:10px;align-items:flex-start;border:1px solid #2a3a68;border-radius:12px;background:#0e1530;padding:8px;margin-bottom:8px}
.px28h-row img.bs{width:92px;image-rendering:pixelated;flex:none}.px28h-row .t{flex:1;font-size:12px;line-height:1.55;color:#cfe0ff}.px28h-row h4{margin:0 0 2px;font-size:14px}
.px28h-frag{display:inline-flex;align-items:center;gap:4px;background:#1a2450;border:1px solid var(--c,#4a5a98);border-radius:999px;padding:1px 8px;font-weight:800}
.px28h-frag img{height:16px;image-rendering:pixelated}
.px28h-bar{height:8px;border-radius:6px;background:#1a2450;overflow:hidden}.px28h-bar i{display:block;height:100%;background:linear-gradient(90deg,#4ae8ff,#8a5aff)}
.px28h-w{border:2px solid #fff1a0;border-radius:14px;background:linear-gradient(#1a1050,#0a0626);padding:10px;margin-bottom:12px;box-shadow:0 0 18px -2px #8a5aff}
.px28h-w .hd{display:flex;gap:12px;align-items:center}.px28h-w .hd img{width:96px;height:96px;image-rendering:pixelated;background:radial-gradient(#5a2ec8,#0a0626 70%);border-radius:12px;padding:4px;flex:none}
.px28h-fr{display:grid;grid-template-columns:repeat(auto-fill,minmax(125px,1fr));gap:5px;margin:8px 0}.px28h-fr div{font-size:11px;background:#0e1530;border-radius:8px;padding:4px 6px;border:1px solid #2a3a68}
.px28h-fr div.ok{border-color:#4aff9a}`;
if (!$('px28-hub-css')) { const st = document.createElement('style'); st.id = 'px28-hub-css'; st.textContent = CSS; document.head.appendChild(st); }

function tabs() { return `<div class="px28h-tabs">${[['select', '🐉 เลือกบอส'], ['book', '📖 สมุดบอส'], ['exchange', '⚡ แลกอาวุธตำนาน'], ['legacy', '👑 บอสเดิม']].map(([k, n]) => `<button data-h28tab="${k}" class="${TAB === k ? 'on' : ''}">${n}</button>`).join('')}</div>`; }
function srvNote() {
  if (!ready()) return '<div class="px28h-note">🔒 ล็อกอินเพื่อเข้าสู้จริง เก็บเศษบอส และแลกอาวุธ — ถ้ายังไม่ล็อกอินจะเล่น <b>โหมดซ้อม</b> ได้อย่างเดียว (ไม่ได้รางวัล)</div>';
  if (installed === false) return '<div class="px28h-note">🛠️ เซิร์ฟเวอร์ยังไม่ได้ติดตั้งระบบบอสโลก V28 — โหมดซ้อมใช้ได้ปกติ ส่วนสู้จริง/เศษบอส/แลกอาวุธจะเปิดเมื่อติดตั้งฝั่ง Supabase แล้ว</div>';
  return '';
}
function pageSelect() {
  const w = winOpen(), can = w.open && ready() && installed !== false;
  const win = w.open ? '<b style="color:#4aff9a">🟢 บอสโลกเปิดอยู่ตอนนี้</b> — เลือกบอสที่จะสู้' : '<b style="color:#ffb02e">⏳ ยังไม่ถึงเวลาบอสโลก</b> (เปิดทุก 3 ชั่วโมง ตั้งแต่ 00:00 นาทีที่ 0–30) — ซ้อมมือได้ตลอด';
  return `<div class="px28h-note">${win}<br>บอสทั้ง 10 ตัวเกิดพร้อมกันทุกรอบ เลือกเข้าตัวไหนก็ได้ · ทำดาเมจ <b>≥ ${fmt(MIN_DMG)}</b> ถึงจะมีสิทธิ์ลุ้นเศษบอส (ได้ ${DROP[0]}–${DROP[1]} ชิ้น) · สู้คนเดียวหรือเป็นปาร์ตี้ก็ได้</div>${srvNote()}
  <div class="px28h-grid">${LIST.map(b => `<div class="px28h-card" style="--c:${b.col}"><span class="px28h-lv">Lv ${b.lv}</span><img class="bs" src="${bossImg(b)}" alt=""><b>${esc(b.name)}</b><small>${esc(b.title)} · ${esc(b.element)}</small><small>❤ ${fmt(b.hp)}</small><small>เศษ: ${esc(b.frag.name)}</small>
  <button class="px28h-btn" data-h28go="${b.id}" ${can ? '' : 'disabled'}>⚔ เข้าสู้จริง</button><button class="px28h-btn alt" data-h28prac="${b.id}">🧪 ซ้อมมือ</button></div>`).join('')}</div>`;
}
function pageBook() {
  return srvNote() + LIST.map(b => `<div class="px28h-row" style="--c:${b.col}"><img class="bs" src="${bossImg(b)}" alt=""><div class="t"><h4 style="color:${b.col}">Lv ${b.lv} · ${esc(b.name)} <small style="color:#8a9ad0">${esc(b.title)}</small></h4>
  ธาตุ: <b>${esc(b.element)}</b> · เลือด <b>${fmt(b.hp)}</b> · พลังโจมตีบอส ≈ <b>${fmt(SCALE(b))}</b><br>
  <span class="px28h-frag"><img src="${fragIcon(b)}" alt="">${esc(b.frag.name)}</span> ได้ครั้งละ ${DROP[0]}–${DROP[1]} ชิ้น เมื่อทำดาเมจ ≥ ${fmt(MIN_DMG)} (อัตราเหมือนบอสดันเจี้ยน)<br>
  สะสมแล้ว: <b>${fcount('frag_' + b.id)}</b> / ${NEED}<div class="px28h-bar"><i style="width:${Math.min(100, fcount('frag_' + b.id) / NEED * 100)}%"></i></div>
  <span style="color:#9fb0e8">💡 ${esc(TIPS[b.id] || '')}</span></div></div>`).join('');
}
function pageExchange() {
  const D = (window.AMBER_V28_ULT || {}).DEFS || {};
  const all = LIST.every(b => fcount('frag_' + b.id) >= NEED);
  return `<div class="px28h-note">⚡ อาวุธตำนานบอสโลก — แรงสุด หายากสุด ใช้เศษ <b>ทุกชนิด ชนิดละ ${NEED} ชิ้น</b> (รวม ${NEED * 10} ชิ้น) แลกได้ <b>1 ชิ้น/สาย</b> · เมื่อตีบวก <b>+10</b> จะมีสายฟ้าอลังการ และได้ฉายา + กรอบสายฟ้า</div>${srvNote()}
  ${Object.keys(D).map(cls => { const d = D[cls], has = OWN.some(o => o.cls === cls || o === cls), icon = safe(() => window.AMBER_V28_ULT.icon(cls), '');
    return `<div class="px28h-w"><div class="hd"><img src="${icon}" alt=""><div><b style="font-size:15px;color:#fff1a0">${esc(d.short)}</b><br><small>${esc(d.en)} · สาย${esc(cls)} (${esc(d.job)})</small><br><small>ฉายา: <span class="px28-ult-title">⚡ ${esc(d.title)}</span></small></div></div>
    <div class="px28h-fr">${LIST.map(b => { const n = fcount('frag_' + b.id); return `<div class="${n >= NEED ? 'ok' : ''}" style="--c:${b.col}"><img src="${fragIcon(b)}" style="height:13px;image-rendering:pixelated;vertical-align:-2px"> ${esc(b.frag.name)}<br><b>${n}/${NEED}</b></div>`; }).join('')}</div>
    <button class="px28h-btn" data-h28ex="${esc(cls)}" ${(all && ready() && installed !== false && !has) ? '' : 'disabled'}>${has ? '✅ มีอาวุธสายนี้แล้ว' : '⚡ แลกอาวุธ'}</button></div>`; }).join('')}`;
}
function pageLegacy(){
  const w=winOpen(),v=window.AMBER_V25?.V?.()||{};
  const next=w.open?'กำลังเปิดรอบบอส':('รอบถัดไป '+(w.next?new Date(w.next).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}):'—'));
  return `<div class="px28h-note"><b>👑 ห้องบอสโลกเดิม V27.3</b><br>คงค่ารางวัลและสิทธิ์เดิมจาก Supabase ไว้โดยไม่รวมยอด HP กับบอสใหม่ทั้ง 10 ตัว<br>สถานะ: <b>${esc(next)}</b> · รับรางวัลผ่านเซิร์ฟเวอร์เท่านั้น</div>
  <div class="px28h-w"><b>จ้าวมังกรเพลิง (ระบบเดิม)</b><br><small>อยู่ในหน้าบอสโลกเดียวกันแล้ว ไม่มีกล่องบอสเก่าลอยทับหน้าเกม</small>
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
   <button data-h28legacygo="1" class="px28h-btn" ${w.open&&ready()?'':'disabled'}>⚔️ เข้าสู้บอสเดิม</button>
   <button data-h28legacypractice="1" class="px28h-btn alt">🧪 ซ้อมบอสเดิม</button>
   <button data-h28legacyclaim="1" class="px28h-btn alt">🏅 ตรวจรับรางวัลเดิม</button>
  </div></div>`;
}
function render() { const b = $('modalBody'); if (!b || !b.querySelector('#px28hub')) return; b.querySelector('#px28hub').innerHTML = tabs() + (TAB === 'book' ? pageBook() : TAB === 'exchange' ? pageExchange() : TAB === 'legacy' ? pageLegacy() : pageSelect()); }
async function openHub(tab) {
  TAB = tab || TAB; if (typeof openModal !== 'function') return;
  openModal('🐉 บอสโลก', '<div id="px28hub"></div>'); render();
  if (ready()) { if (installed === null) await S.probe(); await S.refreshFragments(); render(); }
}

document.addEventListener('click', async e => {
  const t = e.target.closest('[data-h28tab],[data-h28go],[data-h28prac],[data-h28ex],[data-h28legacygo],[data-h28legacypractice],[data-h28legacyclaim]'); if (!t) return;
  if (t.dataset.h28tab) { TAB = t.dataset.h28tab; render(); return; }
  if(t.dataset.h28legacygo){closeModal();window.AMBER_V26?.openArena?.(false,{_hub:1});return;}
  if(t.dataset.h28legacypractice){closeModal();window.AMBER_V26?.openArena?.(true,{_hub:1});return;}
  if(t.dataset.h28legacyclaim){await window.AMBER_V273?.claimLast?.();return;}
  if (t.dataset.h28prac) { closeModal(); window.AMBER_V26 && AMBER_V26.openArena(true, { bossId: t.dataset.h28prac, api: null, _hub: 1 }); return; }
  if (t.dataset.h28go) { closeModal(); window.AMBER_V26 && AMBER_V26.openArena(false, { bossId: t.dataset.h28go, api: S, _hub: 1 }); return; }
  if (t.dataset.h28ex) {
    const cls = t.dataset.h28ex; t.disabled = true; t.textContent = '⏳ กำลังแลก...';
    const r = await S.exchange(cls);
    if (r.ok) { const d = (window.AMBER_V28_ULT.DEFS || {})[cls]; safe(() => notify('⚡ ได้รับ ' + d.short + '!')); safe(() => window.AMBER_V28.ultGot(d.short)); }
    else safe(() => notify('🛡️ ' + why(r)));
    render();
  }
});

/* the 3-hourly world-boss banner / button now opens the boss-selection page instead of a random boss */
(function hook() {
  const V = window.AMBER_V26; if (!V || V.__hub28) { if (!V) setTimeout(hook, 500); return; }
  const orig = V.openArena; V.__hub28 = 1;
  V.openArena = function (practice, opt) { if (!opt || !opt._hub) { if (!practice) { openHub('select'); return; } } return orig.call(V, practice, opt || {}); };
})();
function navBtn() {
  const nav = document.querySelector('.nav'); if (!nav) return;
  if (!$('px28BossBtn')) { const b = document.createElement('button'); b.id = 'px28BossBtn'; b.type = 'button'; b.innerHTML = '🐉<span>บอสโลก</span>'; b.onclick = () => openHub('select'); nav.appendChild(b); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', navBtn); else navBtn();
setInterval(navBtn, 3000);
window.AMBER_V28_HUB = { open: openHub, render };
})();
