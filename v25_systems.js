/* 55 AMBERLANDS V25 — RETENTION & SOCIAL SYSTEMS (client side; saved inside state.v25, NO SQL needed for the solo parts)
 *  1 Daily check-in (7 days)      2 Daily missions
 *  4 Scheduled World Boss event   5 Monster card album (+stats) 6 Titles (full boss set = glowing title + aura)
 *  7 Rebirth                      8 Guild + weekly leaderboard + invite code (online; needs 55_amberlands_v25_social.sql ONCE)
 *  9 Emotes with pixel bubbles   10 Share-card (PNG) for +10 / boss moments
 */
(() => {
'use strict';
const PX = window.PX; if (!PX || !PX.ui) { console.warn('[v25] pixel UI missing'); return; }
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.max(0, Math.floor(Number(n) || 0)).toLocaleString('th-TH');
const safe = (fn, d) => { try { return fn(); } catch (e) { console.warn('[v25]', e && e.stack); return d; } };
const S = () => (typeof state !== 'undefined' ? state : null);
const cloud = () => window.AMBER_CLOUD;
const sb = () => safe(() => cloud().getClient(), null);
const uid = () => safe(() => cloud().getUser()?.id ?? null, null);
const online = () => !!(sb() && uid());

/* ------------------------------------------------------------------ state */
const DAY = 86400000, pad = n => String(n).padStart(2, '0');
const dkey = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const wkey = (d = new Date()) => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), dn = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - dn); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + '-W' + pad(Math.ceil(((t - y0) / DAY + 1) / 7)); };
function V() {
  const st = S(); if (!st) return {};
  const v = st.v25 || (st.v25 = {});
  v.checkin = v.checkin || { day: 0, last: '' };
  v.daily = v.daily || { date: '', m: [], bonus: false };
  v.ck = v.ck || {};                 // monster kills by name
  v.titles = v.titles || { owned: [], active: 'auto' };
  v.rebirth = v.rebirth | 0;
  v.wb = v.wb || { slot: '', claimed: '', week: '', dmg: 0 };
  v.ref = v.ref || { redeemed: false, claimed: [] };
  v.stat = v.stat || { skills: 0, enh: 0, raids: 0 };
  return v;
}
function commit() { safe(() => save()); safe(() => cloud() && cloud().saveNow && cloud().saveNow()); }
function refresh() { safe(() => { window.V9AP && window.V9AP(); }); safe(() => renderTop()); safe(() => render()); safe(() => { renderBag && renderBag(); }); }
const addGold = n => { S().gold += n; };
const addGems = n => { S().gems = (S().gems || 0) + n; };
function addPotion(id, n) { const st = S(); if (id === 'hp') st.potHP = (st.potHP || 0) + n; else st.potMP = (st.potMP || 0) + n; }
function addMat(k, n) { const st = S(); st.mats = st.mats && typeof st.mats === 'object' ? st.mats : { gw: 0, ga: 0 }; st.mats[k] = (st.mats[k] || 0) + n; }
function xpAdd(x) { const st = S(); if (!st || st.lv >= 100) return; st.xp += Math.max(1, Math.round(x)); let g = 0; while (st.lv < 100 && st.xp >= need() && g++ < 40) { st.xp -= need(); st.lv++; st.points += 5; st.skillPoints = (st.skillPoints || 0) + 1; } if (g) { st.hp = maxHp(); st.mp = maxMp(); } }
function grant(r) {
  const parts = [];
  if (r.gold) { addGold(r.gold); parts.push('💰 ' + fmt(r.gold) + ' Gold'); }
  if (r.gems) { addGems(r.gems); parts.push('💠 ' + fmt(r.gems) + ' คอยล์'); }
  if (r.hp) { addPotion('hp', r.hp); parts.push('🧪 ยา HP ×' + r.hp); }
  if (r.mp) { addPotion('mp', r.mp); parts.push('💧 ยา MP ×' + r.mp); }
  if (r.gw) { addMat('gw', r.gw); parts.push('🔥 เพชรเพลิงมังกร ×' + r.gw); }
  if (r.ga) { addMat('ga', r.ga); parts.push('🛡️ ไข่มุกพิทักษ์ ×' + r.ga); }
  if (r.ore_prism) { addMat('ore_prism', r.ore_prism); parts.push('🌈 แร่รุ้งดารา ×' + r.ore_prism); }
  if (r.xp) { xpAdd(r.xp); parts.push('⭐ EXP ' + fmt(r.xp)); }
  return parts.join(' · ');
}

/* ------------------------------------------------------------------ bonuses (cards / rebirth / set) */
const MON = () => safe(() => MONS, []) || [];
const CARD_T = [25, 100, 400, 1500], BOSS_T = [1, 5, 15, 40];
const STAT4 = [['ATK', 5, 'โจมตี'], ['DEF', 3, 'ป้องกัน'], ['HP', 65, 'HP'], ['MP', 30, 'MP']];
const TMULT = [0, 1, 2, 3.5, 6];
const cardTier = (name, boss) => { const k = V().ck[name] | 0, T = boss ? BOSS_T : CARD_T; let t = 0; for (let i = 0; i < 4; i++) if (k >= T[i]) t = i + 1; return t; };
function cardBonus(m, t) { const h = PX.hash(m.name) % 4, [k, base] = STAT4[h]; return { k, v: Math.round(base * TMULT[t] * (m.boss ? 3 : 1)), label: STAT4[h][2] }; }
function totalCards() { let n = 0; for (const m of MON()) if (cardTier(m.name, m.boss) > 0) n++; return n; }
function eqPieces() {
  const st = S(); if (!st) return [];
  return ['W', 'S', 'G', 'B', 'R'].map(sl => { const id = st.eq && st.eq[sl], g = id && (st.gear || []).find(x => String(x.id) === String(id)); return g || null; });
}
const isBossG = g => !!(g && PX.items.isBoss(g));
function setInfo() {
  const p = eqPieces(), boss = p.filter(isBossG), n = boss.length, th = {};
  boss.forEach(g => { const t = safe(() => PX.weaponSpec({ ...g, cls: g.cls || 'ดาบ' }).theme, 'normal') || 'normal'; th[t] = (th[t] || 0) + 1; });
  let id = '', kind = '';
  if (n === 5) { if (th.fire === 5) { id = 'set_fire'; kind = 'fire'; } else if (th.ice === 5) { id = 'set_ice'; kind = 'ice'; } else if (th.prism >= 3) { id = 'set_prism'; kind = 'rainbow'; } else { id = 'set_boss'; kind = 'rainbow'; } }
  else if (n >= 3) id = 'boss3';
  return { n, id, kind, full: n === 5 };
}
window.AMBER_V25_BONUS = b => {
  const st = S(); if (!st || !st.v25) return; const v = V(), add = (k, x) => { b[k] = (b[k] || 0) + x; };
  for (const m of MON()) { const t = cardTier(m.name, m.boss); if (t) { const c = cardBonus(m, t); add(c.k, c.v); } }
  if (v.rebirth) { add('ATK', v.rebirth * 12); add('DEF', v.rebirth * 8); add('HP', v.rebirth * 150); add('MP', v.rebirth * 40); }
  const si = setInfo(); if (si.full) { add('ATK', 100); add('DEF', 60); add('HP', 800); add('MP', 200); add('CRIT', 3); } else if (si.n >= 3) { add('ATK', 30); add('DEF', 20); add('HP', 250); }
};

/* ------------------------------------------------------------------ titles */
const TITLES = {
  set_fire:  { name: 'จอมทัพเปลวเพลิง', cls: 'fire',  live: true, how: 'สวมของบอสสายไฟครบ 5 ชิ้น' },
  set_ice:   { name: 'ราชันเหมันต์',    cls: 'ice',   live: true, how: 'สวมของบอสสายน้ำแข็งครบ 5 ชิ้น' },
  set_prism: { name: 'จักรพรรดิสายรุ้ง', cls: 'rain',  live: true, how: 'สวมของบอสครบ 5 ชิ้น (มีสายรุ้ง ≥3)' },
  set_boss:  { name: 'จอมพิชิตบอส',     cls: 'rain',  live: true, how: 'สวมของบอสครบ 5 ชิ้น (ชุดผสม)' },
  boss3:     { name: 'ผู้ล่าบอส',       cls: 'gold',  live: true, how: 'สวมของบอส 3-4 ชิ้น' },
  k100:   { name: 'นักล่าฝึกหัด', cls: 'plain', test: () => S().kills >= 100,   how: 'ฆ่ามอนสเตอร์ 100 ตัว' },
  k1000:  { name: 'นักล่าจอมโหด', cls: 'gold',  test: () => S().kills >= 1000,  how: 'ฆ่ามอนสเตอร์ 1,000 ตัว' },
  k10000: { name: 'ตำนานนักล่า',  cls: 'rain',  test: () => S().kills >= 10000, how: 'ฆ่ามอนสเตอร์ 10,000 ตัว' },
  plus10: { name: 'ผู้บรรลุสูงสุด', cls: 'rain', test: () => (S().gear || []).some(g => g.enh >= 10), how: 'ตีบวกอุปกรณ์ถึง +10' },
  reb1:   { name: 'ผู้เกิดใหม่',   cls: 'gold',  test: () => V().rebirth >= 1,   how: 'เกิดใหม่ 1 ครั้ง' },
  cards20:{ name: 'นักสะสมการ์ด', cls: 'ice',   test: () => totalCards() >= 20,  how: 'สะสมการ์ดมอนสเตอร์ 20 ใบ' },
  ck7:    { name: 'ขยันขันแข็ง',   cls: 'plain', test: () => V().checkin.day >= 7, how: 'เช็กอินครบ 7 วัน' },
  wb1:    { name: 'ผู้กล้าบอสโลก', cls: 'fire',  test: () => V().wb.total > 0,    how: 'ชนะบอสโลกในช่วงกิจกรรม' }
};
function refreshTitles() {
  const v = V(); let gain = [];
  for (const [id, t] of Object.entries(TITLES)) if (!t.live && t.test && safe(t.test, false) && !v.titles.owned.includes(id)) { v.titles.owned.push(id); gain.push(t.name); }
  if (gain.length) { safe(() => notify('🏷️ ได้รับฉายาใหม่: ' + gain.join(', '))); commit(); }
}
function activeTitleId() {
  const v = V(), si = setInfo();
  if (v.titles.active === 'auto' || !v.titles.active) { if (si.id) return si.id; const o = v.titles.owned; return o.length ? o[o.length - 1] : ''; }
  if (v.titles.active.startsWith('set_') || v.titles.active === 'boss3') return si.id === v.titles.active ? si.id : (si.id || '');
  return v.titles.owned.includes(v.titles.active) ? v.titles.active : '';
}
function titleHTML(id, small) {
  const t = TITLES[id]; if (!t) return '';
  return `<span class="px25-title t-${t.cls}${small ? ' sm' : ''}"><img class="px25-sp l" src="${PX.ui.sparkURL()}" alt=""><b>${esc(t.name)}</b><img class="px25-sp r" src="${PX.ui.sparkURL()}" alt=""></span>`;
}
const auraKind = id => ({ set_fire: 'fire', set_ice: 'ice', set_prism: 'rainbow', set_boss: 'rainbow' }[id] || '');

/* ------------------------------------------------------------------ 1 check-in */
const CK_REWARDS = [
  { gw: 1, ic: 'crystal' }, { ga: 2, hp: 10, ic: 'crystal' },
  { gw: 2, ga: 1, ic: 'crystal' }, { ore_prism: 1, mp: 10, ic: 'chest' },
  { gw: 3, ga: 2, ic: 'crystal' }, { ore_prism: 2, gw: 2, ic: 'chest' },
  { ore_prism: 4, gw: 5, ga: 5, gems: 150, ic: 'chest', rain: true }
];
function ckState() {
  const c = V().checkin, info = window.AMBER_V27?.getState();
  if (online()) {
    if (!info?.today_th) return { c, can: false, broken: false, today: '' };
    const today = info.today_th, yest = new Date(Date.parse(today + 'T00:00:00Z') - DAY).toISOString().slice(0, 10);
    c.day = Number(info.checkin_day) || 0;
    c.last = info.checkin_last || '';
    return { c, can: c.last !== today, broken: !!(c.last && c.last !== today && c.last !== yest), today };
  }
  return { c, can: false, broken: false, today: '' };
}
function doCheckin() {
  if (!online() || !window.AMBER_V27) { safe(() => notify('เช็กอินต้องเชื่อม Supabase V27 ก่อน')); return; }
  void window.AMBER_V27.checkin();
}

/* ------------------------------------------------------------------ 2 daily missions */
const POOL = [
  { id: 'kill', t: lv => `ฆ่ามอนสเตอร์ ${lv < 20 ? 40 : 80} ตัว`, need: lv => lv < 20 ? 40 : 80, r: lv => ({ gw: 1, hp: 5 }) },
  { id: 'kill2', t: () => 'ฆ่ามอนสเตอร์ 150 ตัว', need: () => 150, r: lv => ({ gw: 2, ga: 1, gems: 15 }) },
  { id: 'skill', t: () => 'ใช้สกิล 25 ครั้ง', need: () => 25, r: lv => ({ ga: 1, mp: 6 }) },
  { id: 'enh', t: () => 'ตีบวกอุปกรณ์ 1 ครั้ง', need: () => 1, r: () => ({ gems: 20, ga: 1 }) },
  { id: 'raid', t: () => 'ชนะเรดบอส 1 ครั้ง', need: () => 1, r: lv => ({ ore_prism: 1, gems: 25, gw: 2 }) },
  { id: 'login', t: () => 'เข้าเกมวันนี้', need: () => 1, r: () => ({ gw: 1, hp: 5, mp: 5 }), auto: true }
];
function ensureDaily() {
  const v = V(), today = dkey(), st = S(); if (!st) return;
  if (v.daily.date === today && v.daily.m.length) return;
  const h = PX.hash(today + (st.name || '')), pick = [POOL[5]], rest = POOL.slice(0, 5), a = rest.splice(h % rest.length, 1)[0], b = rest[(h >>> 3) % rest.length];
  v.daily = { date: today, bonus: false, m: [pick[0], a, b].map(p => ({ id: p.id, have: p.auto ? 1 : 0, need: p.need(st.lv), claimed: false })) };
}
function bump(id, n = 1) { const v = V(); ensureDaily(); const m = v.daily.m.find(x => x.id === id || (id === 'kill' && x.id === 'kill2')); v.daily.m.forEach(x => { if ((id === 'kill' && (x.id === 'kill' || x.id === 'kill2')) || x.id === id) x.have = Math.min(x.need, x.have + n); }); }
// V27.9: Daily missions read ONLY server-verified evidence, never local .have counters.
let missionBusy = false;
async function missionRefresh() {
  if (!online()) throw Error('ต้องเข้าสู่ระบบ Google และเชื่อม Supabase ก่อน');
  const { data, error } = await sb().rpc('amber_v279_mission_status');
  if (error) throw error;
  if (!data?.ok || !Array.isArray(data.m) || data.m.length !== 3) throw Error('MISSION_STATUS_NOT_READY');
  V().daily = {date: String(data.date), bonus: !!data.bonus,
    m: data.m.map(x => ({id: String(x.id), have: Math.max(0, Number(x.have) || 0),
      need: Math.max(1, Number(x.need) || 1), claimed: !!x.claimed}))};
  return data;
}
async function missionClaimRpc(mission) {
  if (missionBusy) return;
  missionBusy = true;
  try {
    if (!online()) throw Error('ต้องเชื่อม Supabase ก่อนรับรางวัล');
    // V28.2: quest claim itself is already an atomic, server-locked transaction.
    // Do NOT call beginMarket(): legacy autosave can reject and prevent claiming rewards.
    const {data, error} = await sb().rpc('amber_v279_mission_claim',{p_mission: mission});
    if (error) throw error;
    if (!data?.ok) {
      const reason = ({already_claimed:'ได้รับรางวัลนี้แล้ว',not_today_mission:'เควสต์นี้ไม่ใช่ภารกิจวันนี้',
        not_enough_server_evidence:'หลักฐานจากเซิร์ฟเวอร์ยังไม่ครบ',
        three_missions_not_claimed:'ต้องรับรางวัลทั้งสามเควสต์ก่อนเปิดหีบ',
        invalid_mission:'ประเภทเควสต์ไม่ถูกต้อง'})[data?.reason] || 'Supabase ยังไม่อนุมัติ';
      notify('🛡️ '+reason+(data?.reason==='not_enough_server_evidence'?` (${data.verified}/${data.need})`:''));
      return;
    }
    notify('✅ Supabase จ่ายรางวัลเควสต์ให้แล้ว');
  } catch (e) {
    console.error('[V27.9 mission claim]',e);
    notify('รับรางวัลเควสต์ไม่สำเร็จ: '+String(e.message || e).slice(0,105));
  } finally {
    // Always reload wallet and bag from Supabase, including the success path.
    try { await cloud()?.refreshMarketEconomy?.(); } catch(e) {console.warn('[V28.2 quest wallet sync]',e);}
    missionBusy = false;
    try {await missionRefresh();} catch (e) { console.warn('[V27.9 mission status]',e); }
  }
}
async function claimMission(i) {
  const m = V().daily?.m?.[i];
  if (!m || m.claimed || m.have < m.need) return;
  if (m.id === 'login' && online() && window.AMBER_V27) return window.AMBER_V27.loginMission(i);
  return missionClaimRpc(m.id);
}
async function claimDailyBonus() {
  return missionClaimRpc('daily_bonus');
}

/* ------------------------------------------------------------------ hooks: kills, skills, enhance, raid win */
function installHooks() {
  safe(() => {
    const t0 = tick;
    tick = function () {
      const st = S(), k = st ? st.kills : 0, m = safe(() => mob(), null), name = m && m.name, rd = typeof raid !== 'undefined' ? raid : null;
      t0.apply(this, arguments);
      if (st && st.kills > k && name && !rd) { const n = st.kills - k, v = V(); const before = cardTier(name, m.boss); v.ck[name] = (v.ck[name] | 0) + n; bump('kill', n); if (cardTier(name, m.boss) > before) onCardUp(m); }
    };
  });
  safe(() => { const lg = log; log = function (msg, t) { lg.apply(this, arguments); if (typeof msg === 'string' && /^🏆 กำจัด /.test(msg)) onRaidWin(); }; });
  safe(() => { const A = window.AMBER_V23_SKILL_ART; if (A && A.play) { const p0 = A.play; A.play = function (sk, who, at, remote) { if (!remote) { bump('skill'); V().stat.skills++; } return p0.apply(this, arguments); }; } });
  safe(() => { const e0 = window.enhance; if (typeof e0 === 'function') window.enhance = function (id) { const g0 = (S().gear || []).find(x => String(x.id) === String(id)), b = g0 ? g0.enh : 0; const r = e0.apply(this, arguments); safe(() => { bump('enh'); V().stat.enh++; refreshTitles(); }); return r; }; });
  safe(() => { const o = window.AMBER_V12 && window.AMBER_V12.presenceInfo; if (o) window.AMBER_V12.presenceInfo = function () { const base = o.apply(this, arguments) || {}; const v = V(), ti = activeTitleId(); return { ...base, ttl: ti, emo: emo.id, emt: emo.t }; }; });
}
function onCardUp(m) { const t = cardTier(m.name, m.boss), c = cardBonus(m, t); safe(() => notify(`🃏 การ์ด ${m.name} เลื่อนเป็นระดับ ${PX.ui.RARITY[t].name}! ${c.label} +${c.v}`)); refreshTitles(); refresh(); commit(); }
function onRaidWin() {
  const v = V(), rd = typeof raid !== 'undefined' ? raid : null, m = safe(() => mob(), null); v.stat.raids++; bump('raid');
  const dmg = rd && rd.members && rd.members[0] ? rd.members[0].damage | 0 : 0;
  if (m) { const before = cardTier(m.name, true); v.ck[m.name] = (v.ck[m.name] | 0) + 1; if (cardTier(m.name, true) > before) onCardUp(m); }
  const w = wkey(); if (v.wb.week !== w) { v.wb.week = w; v.wb.dmg = 0; } v.wb.dmg += dmg;
  if (wbWindow().open) safe(() => notify('🛡️ โบนัสบอสโลกรอเซิร์ฟเวอร์ตรวจผลก่อนจ่ายจริง'));
  refreshTitles(); commit(); pushScore();
}

/* ------------------------------------------------------------------ 4 world boss event */
const WB_HOURS = [0,3,6,9,12,15,18,21], WB_MIN = 30;
function wbWindow() {
  const n = new Date(); let open = null, next = null;
  for (let d = 0; d < 2 && !open; d++) for (const h of WB_HOURS) { const s = new Date(n.getFullYear(), n.getMonth(), n.getDate() + d, h, 0, 0).getTime(), e = s + WB_MIN * 60000; if (n >= s && n < e) { open = { s, e }; break; } if (s > n && !next) next = s; }
  return { open: !!open, end: open ? open.e : 0, next };
}
function wbJoin() {
  const st = S(); const cand = MON().filter(m => m.boss && st.lv >= m.lv - 5).sort((a, b) => b.lv - a.lv)[0];
  if (!cand) { safe(() => notify('ยังไม่มีบอสที่เลเวลถึง (ต้อง Lv ≥ บอส-5)')); return; }
  safe(() => { if (st.map !== cand.map) chooseMap(cand.map); bossAvailable = true; bossMap = state.map; if (typeof raid === 'undefined' || !raid) openRaid(); });
  closeHub();
}
let wbEl;
function wbTick() {
  if (!S()) return; if (!wbEl) { wbEl = el('div', 'px25-wb', ''); wbEl.onclick = () => { if (wbWindow().open) { if (window.AMBER_V26) window.AMBER_V26.openArena(false); else wbJoin(); } else openHub('boss'); }; document.body.appendChild(wbEl); }
  const w = wbWindow(), n = Date.now(), f = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); };
  if (w.open) { wbEl.className = 'px25-wb on'; wbEl.innerHTML = `<img src="${PX.ui.sparkURL()}" alt=""> 👑 บอสโลกเปิดแล้ว! เหลือ ${f(w.end - n)} <b>แตะเพื่อเข้าร่วม</b> (รางวัลคูณพิเศษ)`; }
  else { const d = w.next - n; if (d < 30 * 60000) { wbEl.className = 'px25-wb soon'; wbEl.innerHTML = `👑 บอสโลกเริ่มใน ${f(d)}`; } else wbEl.className = 'px25-wb off'; }
}
setInterval(() => safe(wbTick), 1000);

/* ------------------------------------------------------------------ 7 rebirth */
async function doRebirth() {
  // V28.2: one authoritative RPC transaction. NEVER alter level, wallet or inventory locally.
  const st = S(), v = V();
  if (!st || st.lv < 100 || v.rebirth >= 10) return;
  if (!window.AMBER_V277?.ready?.()) {
    safe(() => notify('🔒 ต้องเชื่อม Supabase ก่อนเกิดใหม่'));
    return;
  }
  if (!confirm('เกิดใหม่: เลเวลกลับเป็น 1 แต่ได้โบนัสถาวร ATK+12 DEF+8 HP+150 MP+40 และ EXP+10% ต่อครั้ง (สูงสุด 10 ครั้ง) · ของ ทอง และสกิลที่เรียนยังอยู่ · ยืนยัน?')) return;
  try {
    const data = await window.AMBER_V277.invoke('amber_v282_rebirth', {});
    if (!data?.ok || !data?.save || !Number.isInteger(data.rebirth)) throw new Error('REBIRTH_NOT_CONFIRMED');
    // invoke applies the *server save*, including map, level, points and all owned items.
    refreshTitles();
    refresh();
    safe(() => notify('🔥 Supabase ยืนยันการเกิดใหม่ครั้งที่ ' + data.rebirth + '!'));
    await openHub('rebirth');
  } catch (e) {
    console.error('[AMBER V28.2] server rebirth', e);
    safe(() => notify('เกิดใหม่ไม่สำเร็จ: ' + (e?.message || e)));
    // Do not change game state on failure; prior items and level remain server-owned.
  }
}

safe(() => { const sh = window.AMBER_ITEM_SHOP; if (sh && sh.expApply) { const o = sh.expApply; sh.expApply = function (x) { const r = V().rebirth | 0; return o.call(this, r ? Math.round(x * (1 + .1 * r)) : x); }; } });

/* ------------------------------------------------------------------ 9 emotes */
const emo = { id: '', t: 0 };
function sendEmote(id) { emo.id = id; emo.t = Date.now(); showEmotes(); emoPanel(false); }
const seenEmo = new Map();
function showEmotes() {
  const people = window.AMBER_SCENE_PLAYERS || [];
  document.querySelectorAll('#sprites .sprite').forEach((spr, i) => {
    const d = i === 0 ? emo : { id: (people[i - 1] || {}).emo, t: (people[i - 1] || {}).emt };
    const old = spr.querySelector(':scope > .px25-emote'); const live = d.id && d.t && Date.now() - d.t < 3500;
    if (!live) { if (old) old.remove(); return; }
    if (old && old.dataset.k === d.id + d.t) return; if (old) old.remove();
    const im = new Image(); im.className = 'px25-emote'; im.dataset.k = d.id + d.t; im.src = PX.ui.emoteURL(d.id); spr.appendChild(im);
  });
}
function emoPanel(show) {
  let p = $('px25EmoPanel'); if (!p) { p = el('div', '', ''); p.id = 'px25EmoPanel'; p.innerHTML = PX.ui.EMOTES.map(id => `<button type="button" data-emo="${id}" title="${PX.ui.emoteName(id)}"><img src="${PX.ui.emoteURL(id)}" alt=""></button>`).join(''); document.body.appendChild(p); p.addEventListener('click', e => { const b = e.target.closest('[data-emo]'); if (b) sendEmote(b.dataset.emo); }); }
  p.classList.toggle('on', show !== undefined ? show : !p.classList.contains('on'));
}
setInterval(() => safe(showEmotes), 700);

/* ------------------------------------------------------------------ title plate + full-set aura in scene */
function decorateScene() {
  const st = S(); if (!st) return; const people = window.AMBER_SCENE_PLAYERS || [];
  document.querySelectorAll('#sprites .sprite').forEach((spr, i) => {
    const tid = i === 0 ? activeTitleId() : (people[i - 1] || {}).ttl || '', key = tid || '-';
    if (spr.dataset.px25 === key && spr.querySelector('.px25-plate, .px25-aura') !== null === !!tid) return;
    spr.dataset.px25 = key; spr.querySelectorAll(':scope > .px25-plate, :scope > .px25-aura').forEach(n => n.remove());
    if (!tid || !TITLES[tid]) return;
    const pl = el('div', 'px25-plate', titleHTML(tid, true)); spr.insertBefore(pl, spr.querySelector(':scope > small') || null);
    const ak = auraKind(tid); if (ak) { const a = new Image(); a.className = 'px25-aura'; a.src = PX.ui.auraURL(ak); spr.insertBefore(a, spr.firstChild); }
  });
  const top = $('pname'); if (top) { let t = $('px25TopTitle'); const tid = activeTitleId(); if (!t) { t = el('div', '', ''); t.id = 'px25TopTitle'; top.insertAdjacentElement('afterend', t); } const h = tid ? titleHTML(tid, true) : ''; if (t.dataset.h !== h) { t.dataset.h = h; t.innerHTML = h; } }
}
setInterval(() => safe(decorateScene), 500);

/* ------------------------------------------------------------------ 8 social (guild / leaderboard / referral) */
const NPC = ['Aria', 'Kenji', 'Mochi', 'Zeno', 'Luna', 'Bank', 'Pim', 'Rex', 'Nana', 'Tao'];
async function pushScore() {
  // V27.1.1: stop client-submitted rank points until server combat events exist.
  return;
  if (!online()) return; const st = S(), v = V();
  safe(() => sb().from('amber_scores').upsert({ week: wkey(), user_id: uid(), name: st.name, job: st.job, lv: st.lv, kills: st.kills, boss_dmg: v.wb.week === wkey() ? v.wb.dmg : 0, updated_at: new Date().toISOString() }, { onConflict: 'week,user_id' }).then(() => { }, () => { }));
}
setInterval(() => safe(pushScore), 90000);
async function dbq(p) { try { const r = await p; if (r.error) return { err: r.error.message || String(r.error) }; return { data: r.data }; } catch (e) { return { err: e.message || String(e) }; } }
const NEED_SQL = '<p class="px25-warn">⚠️ ยังไม่ได้รันไฟล์ <b>55_amberlands_v25_social.sql</b> ใน Supabase (ครั้งเดียว) · ระบบนี้จึงยังไม่ทำงานออนไลน์</p>';
async function tabBoard() {
  const st = S(), v = V(), w = wkey();
  if (!online()) { const rows = NPC.map((n, i) => ({ name: n, boss_dmg: Math.round(900000 / (i + 1.6)), lv: 60 - i * 3, job: ['ดาบ', 'ธนู', 'หมัด', 'จอมเวท'][i % 4], sim: 1 })); rows.push({ name: st.name + ' (คุณ)', boss_dmg: v.wb.week === w ? v.wb.dmg : 0, lv: st.lv, job: st.job, me: 1 }); rows.sort((a, b) => b.boss_dmg - a.boss_dmg); return boardHTML(rows, true); }
  await pushScore(); const r = await dbq(sb().from('amber_scores').select('name,job,lv,kills,boss_dmg,user_id').eq('week', w).order('boss_dmg', { ascending: false }).limit(20));
  if (r.err) return NEED_SQL + `<small>${esc(r.err)}</small>`; return boardHTML(r.data.map(x => ({ ...x, me: x.user_id === uid() })), false);
}
const boardHTML = (rows, sim) => `<p class="px25-hint">🏆 อันดับดาเมจบอสประจำสัปดาห์ ${wkey()} ${sim ? '(ตัวอย่างจำลอง — เล่นออนไลน์เพื่อดูอันดับจริง)' : ''} · ปิดรอบทุกวันจันทร์</p><div class="px25-board">${rows.map((r, i) => `<div class="px25-row${r.me ? ' me' : ''}"><span class="rk r${i + 1}">${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span><span class="nm">${esc(r.name)} <small>${esc(r.job || '')} · Lv.${r.lv || 0}</small></span><b>${fmt(r.boss_dmg)}</b></div>`).join('')}</div>`;
async function tabGuild() {
  if (!online()) return `<p class="px25-hint">🛡️ กิลด์ใช้ได้เมื่อเล่นออนไลน์ (ล็อกอิน Google) · สร้างกิลด์ ชวนเพื่อน แชตกิลด์ และรับโบนัสกิลด์</p><div class="px25-sim">ไฟล์ HTML ออฟไลน์ไม่มีเซิร์ฟเวอร์ จึงเปิดกิลด์ไม่ได้</div>`;
  const me = await dbq(sb().from('amber_guild_members').select('guild_id').eq('user_id', uid()).maybeSingle());
  if (me.err) return NEED_SQL + `<small>${esc(me.err)}</small>`;
  if (!me.data) return `<p class="px25-hint">ยังไม่มีกิลด์ — สร้างใหม่ หรือใส่รหัสกิลด์ของเพื่อน</p><div class="px25-form"><input id="px25GName" maxlength="16" placeholder="ชื่อกิลด์ใหม่"><button class="goldbtn" data-v25="gcreate">➕ สร้างกิลด์</button></div><div class="px25-form"><input id="px25GCode" maxlength="8" placeholder="รหัสกิลด์ 6 ตัว"><button data-v25="gjoin">🔗 เข้าร่วม</button></div>`;
  const gid = me.data.guild_id, [g, mem, chat] = await Promise.all([dbq(sb().from('amber_guilds').select('*').eq('id', gid).maybeSingle()), dbq(sb().from('amber_guild_members').select('name,job,lv,user_id').eq('guild_id', gid).order('lv', { ascending: false }).limit(50)), dbq(sb().from('amber_guild_chat').select('name,msg,created_at').eq('guild_id', gid).order('created_at', { ascending: false }).limit(25))]);
  const gg = g.data || {}, ms = mem.data || [], ch = (chat.data || []).reverse(), bonus = Math.min(10, ms.length);
  return `<div class="px25-guild"><h3>🛡️ ${esc(gg.name)} <small>รหัส <b id="px25Gc">${esc(gg.code)}</b> · ${ms.length} คน · โบนัส EXP +${bonus}%</small></h3><div class="px25-members">${ms.map(m => `<span>${esc(m.name)} <small>Lv.${m.lv}</small></span>`).join('')}</div><div class="px25-chat" id="px25Chat">${ch.map(c => `<div><b>${esc(c.name)}</b> ${esc(c.msg)}</div>`).join('') || '<small>ยังไม่มีข้อความ</small>'}</div><div class="px25-form"><input id="px25Msg" maxlength="120" placeholder="พิมพ์ข้อความถึงกิลด์"><button data-v25="gsend" data-g="${gid}">ส่ง</button></div><button class="red" data-v25="gleave">ออกจากกิลด์</button></div>`;
}
const code6 = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
async function guildAct(a, btn) {
  const st = S();
  if (a === 'gcreate') { const n = ($('px25GName').value || '').trim(); if (n.length < 2) return notify('ตั้งชื่ออย่างน้อย 2 ตัวอักษร'); const r = await dbq(sb().from('amber_guilds').insert({ name: n, code: code6(), owner: uid() }).select().single()); if (r.err) return notify('สร้างไม่สำเร็จ: ' + r.err); await dbq(sb().from('amber_guild_members').insert({ guild_id: r.data.id, user_id: uid(), name: st.name, job: st.job, lv: st.lv })); }
  if (a === 'gjoin') { const c = ($('px25GCode').value || '').trim().toUpperCase(); const g = await dbq(sb().from('amber_guilds').select('id').eq('code', c).maybeSingle()); if (!g.data) return notify('ไม่พบรหัสกิลด์นี้'); const r = await dbq(sb().from('amber_guild_members').insert({ guild_id: g.data.id, user_id: uid(), name: st.name, job: st.job, lv: st.lv })); if (r.err) return notify('เข้าร่วมไม่สำเร็จ: ' + r.err); }
  if (a === 'gsend') { const m = ($('px25Msg').value || '').trim(); if (!m) return; await dbq(sb().from('amber_guild_chat').insert({ guild_id: btn.dataset.g, user_id: uid(), name: st.name, msg: m })); }
  if (a === 'gleave') { if (!confirm('ออกจากกิลด์?')) return; await dbq(sb().from('amber_guild_members').delete().eq('user_id', uid())); }
  openHub('guild');
}
const myCode = () => (uid() || 'LOCAL000').replace(/-/g, '').slice(0, 8).toUpperCase();
async function tabInvite() {
  const v = V(), code = myCode(); let cnt = 0, err = '';
  if (online()) { await dbq(sb().from('amber_referrals').upsert({ code, owner: uid() }, { onConflict: 'code' })); const r = await dbq(sb().from('amber_referral_redeems').select('redeemer', { count: 'exact' }).eq('referrer', uid())); if (r.err) err = NEED_SQL; else cnt = (r.data || []).length; }
  const MS = [[1, { gems: 40, gold: 3000 }], [3, { gems: 120, ga: 2 }], [5, { gems: 250, gw: 2, ore_prism: 1 }], [10, { gems: 600, ore_prism: 3 }]];
  const link = location.origin + location.pathname + '?ref=' + code;
  return `${err}<div class="px25-inv"><p>รหัสเชิญของคุณ</p><div class="px25-code">${code}</div><button data-v25="copy" data-t="${esc(link)}">📋 คัดลอกลิงก์เชิญ</button><p class="px25-hint">เพื่อนที่ใส่รหัสนี้ได้ <b>รางวัลรอเซิร์ฟเวอร์ตรวจเลเวลก่อน</b> · คุณได้รางวัลตามจำนวนเพื่อนที่ชวนมา (รหัสเชิญที่ใช้ ${cnt} คน · รางวัลนับเฉพาะเพื่อนที่เซิร์ฟเวอร์ยืนยัน Lv.5+)</p>
  <div class="px25-ms">${MS.map(([n, r]) => { const got = v.ref.claimed.includes(n), ok = cnt >= n; return `<div class="px25-m${got ? ' got' : ''}"><b>ชวน ${n} คน</b><small>${grantText(r)}</small>${got ? '<span>✅</span>' : `<button data-v25="refclaim" data-n="${n}" ${ok ? '' : 'disabled'}>รับ</button>`}</div>`; }).join('')}</div>
  <div class="px25-form"><input id="px25Ref" maxlength="8" placeholder="ใส่รหัสเชิญของเพื่อน" ${v.ref.redeemed ? 'disabled' : ''}><button data-v25="refuse" ${v.ref.redeemed ? 'disabled' : ''}>ใช้รหัส</button></div></div>`;
}
const grantText = r => [r.gold && fmt(r.gold) + ' Gold', r.gems && r.gems + ' คอยล์', r.ga && 'ไข่มุก×' + r.ga, r.gw && 'เพชร×' + r.gw, r.ore_prism && 'แร่รุ้ง×' + r.ore_prism].filter(Boolean).join(' · ');
async function refAct(a, btn) {
  if (!online() || !window.AMBER_V27) return safe(() => notify('รางวัลชวนเพื่อนต้องยืนยันจาก Supabase'));
  if (a === 'refuse') {
    const code = ($('px25Ref')?.value || '').trim().toUpperCase();
    return void window.AMBER_V27.refRedeem(code);
  }
  if (a === 'refclaim') return void window.AMBER_V27.refBonus(Number(btn.dataset.n));
}
safe(() => { const m = location.search.match(/[?&]ref=([A-Za-z0-9]{6,8})/); if (m) localStorage.setItem('amber_v25_ref', m[1].toUpperCase()); });

/* ------------------------------------------------------------------ 10 share card */
function shareCard(g) {
  const st = S(), c = document.createElement('canvas'); c.width = 540; c.height = 760; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  const boss = g && isBossG(g), si = setInfo();
  const bgTile = boss || (g && g.enh >= 7) ? PX.items.rainbowTile(36, 3, 8) : PX.shop.goodsTile(36, 3, 8);
  x.drawImage(bgTile.toCanvas(1), 0, 0, 540, 760);
  const gr = x.createLinearGradient(0, 0, 0, 760); gr.addColorStop(0, '#0000'); gr.addColorStop(.7, '#10062088'); gr.addColorStop(1, '#100620ee'); x.fillStyle = gr; x.fillRect(0, 0, 540, 760);
  const wi = safe(() => window.AMBER_V12.weaponInfo(), null), wp = g && g.slot === 'W' ? PX.weaponSpec(g) : wi && wi.name ? PX.weaponSpec({ w: wi.name, wt: wi.cls, wr: wi.rar, we: wi.enh, wl: wi.lv }) : null;
  const hero = PX.hero.frames(st.job, st.gender || 'male', wp).fight[3]; x.drawImage(hero.toCanvas(1), 110, 190, 320, 360);
  if (g) { const u = new Image(); u.onload = () => { x.drawImage(u, 22, 22, 150, 150); fin(); }; u.src = PX.items.gearURL(g); } else fin();
  function fin() {
    x.textAlign = 'center'; x.fillStyle = '#fff'; x.shadowColor = '#000'; x.shadowBlur = 6; x.font = '700 40px system-ui,"Noto Sans Thai",sans-serif';
    if (g) { x.fillStyle = '#ffe14a'; x.fillText((g.enh ? '+' + g.enh + ' ' : '') + String(g.name).replace(/^🌈\s*/, '').slice(0, 20), 300, 80); x.font = '24px system-ui,"Noto Sans Thai"'; x.fillStyle = '#fff'; x.fillText(boss ? '✦ อุปกรณ์บอสกรอบรุ้ง ✦' : 'ตีบวกสำเร็จ!', 300, 120); }
    x.font = '700 34px system-ui,"Noto Sans Thai"'; x.fillStyle = '#fff'; x.fillText(st.name + ' · Lv.' + st.lv, 270, 610);
    const tid = activeTitleId(); if (tid) { x.font = '700 28px system-ui,"Noto Sans Thai"'; const gg = x.createLinearGradient(120, 0, 420, 0); ['#ff6a6a', '#ffe14a', '#7dff9a', '#7ad8ff', '#c08aff'].forEach((c2, i) => gg.addColorStop(i / 4, c2)); x.fillStyle = gg; x.fillText('「 ' + TITLES[tid].name + ' 」', 270, 656); }
    x.font = '20px system-ui,"Noto Sans Thai"'; x.fillStyle = '#d9c8ff'; x.shadowBlur = 0; x.fillText('55 AMBERLANDS · Pixel MMORPG', 270, 716); x.font = '14px system-ui'; x.fillStyle = '#b9a8e6'; x.fillText(location.host || 'offline', 270, 738);
    showShare(c);
  }
}
function showShare(c) {
  const box = el('div', 'px25-modal', `<div class="px25-sharebox"><img src="${c.toDataURL()}" alt="share"><div class="row"><button class="goldbtn" id="px25Dl">💾 บันทึกรูป</button><button id="px25Sh">📤 แชร์</button><button id="px25X">ปิด</button></div></div>`);
  box.querySelector('#px25X').onclick = () => box.remove();
  box.querySelector('#px25Dl').onclick = () => { const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = 'amberlands-moment.png'; a.click(); };
  box.querySelector('#px25Sh').onclick = () => c.toBlob(async b => { try { const f = new File([b], 'amberlands.png', { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f], text: 'เล่น 55 AMBERLANDS สิ!' }); else { const a = document.createElement('a'); a.href = c.toDataURL(); a.download = 'amberlands-moment.png'; a.click(); } } catch (e) { } });
}

/* ------------------------------------------------------------------ HUB UI */
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (cls && cls.includes('px25-modal')) document.body.appendChild(e); return e; }
const TABS = [['checkin', '📅 เช็กอิน'], ['daily', '🎯 ภารกิจ'], ['boss', '👑 บอสโลก'], ['cards', '🃏 การ์ด'], ['titles', '🏷️ ฉายา'], ['rebirth', '🔥 เกิดใหม่'], ['guild', '🛡️ กิลด์'], ['board', '🏆 อันดับ'], ['invite', '🎁 ชวนเพื่อน'], ['share', '📸 แชร์']];
let curTab = 'checkin';
function closeHub() { safe(() => closeModal()); }
async function openHub(tab) {
  curTab = tab || curTab; ensureDaily(); refreshTitles();
  if (curTab === 'checkin' && window.AMBER_V27) await window.AMBER_V27.syncState(true);
  const tabs = `<div class="px25-tabs">${TABS.map(([id, t]) => `<button data-v25tab="${id}" class="${id === curTab ? 'on' : ''}">${t}</button>`).join('')}</div>`;
  openModal('🎯 กิจกรรม & ระบบเสริม', tabs + '<div id="px25Body" class="px25-body"><p class="px25-hint">กำลังโหลด…</p></div>');
  const body = $('px25Body'); if (!body) return;
  const html = await ({ checkin: tabCheckin, daily: tabDaily, boss: tabBoss, cards: tabCards, titles: tabTitles, rebirth: tabRebirth, guild: tabGuild, board: tabBoard, invite: tabInvite, share: tabShare }[curTab])();
  const b2 = $('px25Body'); if (b2) b2.innerHTML = html; paintDot();
}
function tabCheckin() {
  const { c, can, broken } = ckState(), day = broken || c.day >= 7 ? 0 : c.day;
  return `<p class="px25-hint">เช็กอินทุกวันต่อเนื่อง 7 วัน — รางวัลเป็นแร่ตีบวก วันที่ 7 ได้หีบแร่ใหญ่ ${broken ? '<b style="color:#ff8a8a">(ขาดวัน — เริ่มนับใหม่)</b>' : ''}</p><div class="px25-days">${CK_REWARDS.map((r, i) => `<div class="px25-day${i < day ? ' got' : ''}${i === day && can ? ' now' : ''}"><small>วัน ${i + 1}</small><img src="${PX.ui.rewardTile(r.ic, r.rain ? 'rain' : 'p', 44)}" alt=""><em>${grantText(r) || ''}${r.hp ? ' ยา×' + r.hp : ''}</em>${i < day ? '<span>✅</span>' : ''}</div>`).join('')}</div><button class="goldbtn px25-big" data-v25="checkin" ${can ? '' : 'disabled'}>${can ? '📅 เช็กอินวันนี้' : '✅ เช็กอินแล้ววันนี้ — กลับมาพรุ่งนี้'}</button>`;
}
async function tabDaily() {
  if (!online()) return '<p class="px25-warn">🔒 ต้องเชื่อม Supabase เพื่อดูหลักฐานเควสต์และรับรางวัล</p>';
  try { await missionRefresh(); }
  catch(e) { console.error('[V27.9 mission load]',e); return '<p class="px25-warn">❌ โหลดหลักฐานเควสต์จากเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่</p>'; }
  const v = V(); const all = v.daily.m.every(m => m.claimed);
  return `<p class="px25-hint">ภารกิจรีเซ็ตทุกเที่ยงคืน · ทำครบ 3 อย่างได้หีบโบนัส</p><p class="px25-hint">🛡️ นับเฉพาะการฆ่ามอน ใช้สกิล ตีบวก และเรดที่ Supabase บันทึกผลจริง · จำนวนที่เคยนับเฉพาะในมือถือจะไม่นำมาคิด</p><div class="px25-ms">${v.daily.m.map((m, i) => { const p = POOL.find(x => x.id === m.id), r = p.r(S().lv); const pct = Math.round(100 * m.have / m.need); return `<div class="px25-m${m.claimed ? ' got' : ''}"><b>${esc(p.t(S().lv))}</b><div class="px25-pb"><i style="width:${pct}%"></i><span>${m.have}/${m.need}</span></div><small>${grantText(r)}${r.hp ? ' · ยา HP×' + r.hp : ''}${r.mp ? ' · ยา MP×' + r.mp : ''}</small>${m.claimed ? '<span>✅</span>' : `<button data-v25="mclaim" data-i="${i}" ${m.have >= m.need ? '' : 'disabled'}>รับ</button>`}</div>`; }).join('')}</div><div class="px25-m ${v.daily.bonus ? 'got' : ''}"><b>🎁 หีบโบนัสรายวัน</b><small>${grantText({ gems: 40, ore_prism: 1, ga: 3, gw: 2 })}</small>${v.daily.bonus ? '<span>✅</span>' : `<button class="goldbtn" data-v25="dbonus" ${all ? '' : 'disabled'}>เปิดหีบ</button>`}</div>`;
}
function tabBoss() {
  const w = wbWindow(), ts = WB_HOURS.map(h => pad(h) + ':00').join(' · '), v = V();
  return `<p class="px25-hint">👑 บอสโลกเกิดทุก 3 ชั่วโมง (เวลาไทย): <b>${ts} น.</b> ครั้งละ <b>${WB_MIN} นาที</b> · ตีจริงใช้ผล HP/ดาเมจและอันดับจาก Supabase เท่านั้น · รางวัล: <b>Gold 100,000 / 75,000 / 55,000 / 35,000</b> ตามอันดับ + โบนัส Gold ตามเลเวล, <b>แร่รุ้ง 5 / 4 / 3 / 2</b>, เพชรเพลิง ×1 และไข่มุก ×1 · <b>ไม่แจกคอยล์</b> · Auto Bot / Auto Skill / Auto Potion เปิด-ปิดในห้องบอส · โหมดซ้อมไม่ได้ของจริง</p><div class="px25-wbcard ${w.open ? 'on' : ''}"><img src="${PX.creatures.reg('จ้าวมังกรเพลิง')}" alt=""><div>${w.open ? '🔥 <b>เปิดอยู่ตอนนี้!</b>' : '⏳ รอบถัดไป ' + new Date(w.next).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}<br><small>ดาเมจสัปดาห์นี้: <b>${fmt(v.wb.week === wkey() ? v.wb.dmg : 0)}</b> · ชนะบอสโลก ${v.wb.total | 0} ครั้ง</small></div><button class="goldbtn" data-v25="wbjoin">⚔️ ${w.open ? 'เข้าร่วมเลย' : 'ดูห้องบอส (ซ้อม)'}</button><button data-v25="wbprac">🧪 ซ้อมดูมุมมอง</button><button data-v25="wbclaim">🏅 ตรวจรับรางวัลบอสล่าสุด</button><a href="./v27_3_safety_status.html" target="_blank" rel="noopener">🛡️ Safety Supabase</a></div>`;
}
function tabCards() {
  const mons = MON(); let own = 0; const cells = mons.map(m => {
    const t = cardTier(m.name, m.boss), k = V().ck[m.name] | 0, T = m.boss ? BOSS_T : CARD_T, nx = T[Math.min(3, t)]; if (t) own++;
    const c = t ? cardBonus(m, t) : cardBonus(m, 1);
    // V26.1: Present the exact bonuses calculated by the existing card system.
    // Information only: card thresholds, stat calculation and saved data stay unchanged.
    const levelName = n => PX.ui.RARITY[n].name;
    const tiers = T.map((kills, i) => {
      const rank = i + 1, bonus = cardBonus(m, rank), reached = t >= rank;
      return `<div>${reached ? '✅' : '🔒'} ${esc(levelName(rank))} (${kills} ${m.boss ? 'ครั้ง' : 'ตัว'}) — ${esc(bonus.label)} +${fmt(bonus.v)}</div>`;
    }).join('');
    const now = t ? `ได้รับแล้ว: ${esc(c.label)} +${fmt(c.v)} (มีผลอัตโนมัติ)` : 'ยังไม่ได้รับโบนัส — ปลดล็อกระดับแรกเพื่อรับค่าสถานะ';
    const next = t >= 4 ? 'สะสมครบระดับรุ้งแล้ว' : `อีก ${Math.max(0, T[t] - k)} ${m.boss ? 'ครั้ง' : 'ตัว'} จะถึงระดับ${esc(levelName(t + 1))}`;
    return `<div class="px25-card${t ? '' : ' lock'}"><img src="${PX.ui.cardURL(m.name, t || 1, !t)}" alt=""><b>${esc(m.name)}</b><small>${t ? PX.ui.RARITY[t].name + ' · ' + c.label + ' +' + c.v : 'ยังไม่ได้การ์ด'}</small><div class="px25-pb"><i style="width:${t >= 4 ? 100 : Math.round(100 * k / nx)}%"></i><span>${k}/${t >= 4 ? 'MAX' : nx}</span></div><details class="px25-cardinfo"><summary>ดูรายละเอียดโบนัส</summary><div>${now}</div><div>${next}</div>${tiers}</details></div>`;
  }).join('');
  return `<p class="px25-hint">ฆ่ามอนครบจำนวนจะได้การ์ด (ทองแดง→เงิน→ทอง→รุ้ง) ใส่ถาวรเพิ่มค่าสเตตัสอัตโนมัติ · บอสเรดได้การ์ดเร็วกว่าและแรงกว่า ×3 · สะสมแล้ว <b>${own}/${mons.length}</b></p><div class="px25-cards">${cells}</div>`;
}
function tabTitles() {
  const v = V(), si = setInfo(), act = activeTitleId();
  const rows = Object.entries(TITLES).map(([id, t]) => { const own = t.live ? si.id === id : v.titles.owned.includes(id); return `<div class="px25-m ${act === id ? 'got' : ''}">${titleHTML(id)}<small>${esc(t.how)}</small>${own ? (act === id ? '<span>✔ ใช้อยู่</span>' : `<button data-v25="title" data-id="${id}">ใช้ฉายา</button>`) : '<small>🔒</small>'}</div>`; }).join('');
  const pieces = eqPieces().map((g, i) => `<span class="px25-pc ${isBossG(g) ? 'ok' : ''}">${['อาวุธ', 'ชุด', 'ถุงมือ', 'รองเท้า', 'แหวน'][i]} ${isBossG(g) ? '🌈' : '—'}</span>`).join('');
  return `<div class="px25-setbox ${si.full ? 'full' : ''}"><b>ชุดบอส ${si.n}/5</b><div>${pieces}</div><small>${si.full ? '✨ ครบเซ็ต! ฉายาเรืองแสงพร้อมออร่าแสงสีรอบตัว + โบนัส ATK+100 DEF+60 HP+800 MP+200 CRIT+3' : 'สวมของบอสจากดันเจียนให้ครบ 5 ชิ้น (อาวุธ ชุด ถุงมือ รองเท้า แหวน) เพื่อปลดฉายาและออร่า'}</small></div><div class="px25-ms">${rows}</div><button data-v25="titleauto" ${v.titles.active === 'auto' ? 'disabled' : ''}>🔁 เลือกฉายาที่ดีที่สุดอัตโนมัติ</button>`;
}
function tabRebirth() {
  const st = S(), v = V(), can = st.lv >= 100 && v.rebirth < 10;
  return `<div class="px25-reb"><img src="${PX.ui.rewardTile('star', 'rain', 56)}" alt=""><h3>🔥 เกิดใหม่ (Rebirth)</h3><p>ถึงเลเวล 100 แล้วเกิดใหม่ได้ — เลเวลกลับเป็น 1 แต่ได้ <b>โบนัสถาวรสะสม</b> ต่อครั้ง: ATK +12 · DEF +8 · HP +150 · MP +40 · EXP +10% (สูงสุด 10 ครั้ง)<br>ของ ทอง สกิล การ์ด ฉายา ยังอยู่ · ได้แต้มสเตตัสเริ่มต้นเพิ่ม</p><div class="px25-code">เกิดใหม่แล้ว ${v.rebirth}/10 ครั้ง</div><small>โบนัสตอนนี้: ATK +${v.rebirth * 12} · DEF +${v.rebirth * 8} · HP +${v.rebirth * 150} · EXP +${v.rebirth * 10}%</small><br><button class="goldbtn px25-big" data-v25="rebirth" ${can ? '' : 'disabled'}>${st.lv < 100 ? 'ต้องถึง Lv.100 (ตอนนี้ Lv.' + st.lv + ')' : v.rebirth >= 10 ? 'เกิดใหม่ครบแล้ว' : '🔥 เกิดใหม่เดี๋ยวนี้'}</button></div>`;
}
function tabShare() {
  const gear = (S().gear || []).filter(g => g.enh >= 7 || isBossG(g)).slice(0, 12);
  return `<p class="px25-hint">สร้างภาพโมเมนต์สวยๆ (ฮีโร่ + ของหายาก + ฉายา) บันทึกหรือแชร์ลงโซเชียลได้</p><button class="goldbtn px25-big" data-v25="sharechar">📸 แชร์ตัวละครของฉัน</button><div class="px25-ms">${gear.map(g => `<div class="px25-m"><b>${esc(g.name)}${g.enh ? ' +' + g.enh : ''}</b>${isBossG(g) ? '<small>🌈 ของบอส</small>' : ''}<button data-v25="shareg" data-id="${esc(g.id)}">📸 แชร์ชิ้นนี้</button></div>`).join('') || '<small>ตีบวก ≥ +7 หรือได้ของบอส จะมาแสดงที่นี่</small>'}</div>`;
}
function paintDot() { const b = $('px25Hub'); if (!b) return; const { can } = ckState(); ensureDaily(); const m = V().daily.m.some(x => !x.claimed && x.have >= x.need), bonus = !V().daily.bonus && V().daily.m.every(x => x.claimed); b.classList.toggle('dot', can || m || bonus || wbWindow().open); }

/* gear modal: share button */
function gearShare() {
  const body = $('modalBody'); if (!body || body.querySelector('#px25ShareBtn')) return; const t = body.querySelector('#px24Try'); if (!t) return;
  const btn = body.querySelector('[onclick*="equipG("]'); const id = btn && (btn.getAttribute('onclick').match(/equipG\('([^']+)'\)/) || [])[1]; const g = id && (S().gear || []).find(x => String(x.id) === id); if (!g || !(g.enh >= 7 || isBossG(g))) return;
  const b = el('button', '', '📸 แชร์โมเมนต์นี้'); b.id = 'px25ShareBtn'; b.type = 'button'; b.onclick = () => shareCard(g); t.querySelector('.px24-trybtns') && t.querySelector('.px24-trybtns').appendChild(b);
}
new MutationObserver(() => safe(gearShare)).observe(document.body, { childList: true, subtree: true });

/* delegated clicks */
document.addEventListener('click', e => {
  const tb = e.target.closest('[data-v25tab]'); if (tb) { openHub(tb.dataset.v25tab); return; }
  const b = e.target.closest('[data-v25]'); if (!b || b.disabled) return; const a = b.dataset.v25;
  if (a === 'checkin') { doCheckin(); openHub('checkin'); } else if (a === 'mclaim') { void claimMission(+b.dataset.i).then(()=>openHub('daily')); } else if (a === 'dbonus') { void claimDailyBonus().then(()=>openHub('daily')); }
  else if (a === 'wbjoin') { if (window.AMBER_V26) { closeHub(); window.AMBER_V26.openArena(false); } else wbJoin(); } else if (a === 'wbprac') { closeHub(); window.AMBER_V26 && window.AMBER_V26.openArena(true); } else if (a === 'wbclaim') { window.AMBER_V273?.claimLast?.(); } else if (a === 'rebirth') doRebirth();
  else if (a === 'title') { V().titles.active = b.dataset.id; commit(); decorateScene(); openHub('titles'); } else if (a === 'titleauto') { V().titles.active = 'auto'; commit(); openHub('titles'); }
  else if (a === 'sharechar') shareCard(null); else if (a === 'shareg') shareCard((S().gear || []).find(g => String(g.id) === b.dataset.id));
  else if (a === 'copy') { safe(() => navigator.clipboard.writeText(b.dataset.t)); notify('คัดลอกแล้ว'); }
  else if (/^g(create|join|send|leave)$/.test(a)) guildAct(a, b); else if (a === 'refuse' || a === 'refclaim') refAct(a, b);
});

/* ------------------------------------------------------------------ CSS + mount */
const css = document.createElement('style'); css.textContent = `
.px25-tabs{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px}.px25-tabs button{padding:6px 9px;font-size:12px}.px25-tabs button.on{background:#ffd24a;color:#2a1850;font-weight:700}
.px25-hint{color:#d9c8f8;font-size:12.5px;margin:6px 0}.px25-warn{background:#4a1a2a;border:1px solid #ff8a8a;padding:8px;border-radius:8px;font-size:12px}
.px25-days{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:8px 0}.px25-day{position:relative;text-align:center;background:#1a0e33;border:1px solid #4a2c86;border-radius:9px;padding:4px;font-size:10px}.px25-day img{width:44px;height:44px;image-rendering:pixelated;display:block;margin:2px auto}.px25-day.now{border-color:#ffd24a;box-shadow:0 0 10px #ffd24a99}.px25-day.got{opacity:.55}.px25-day span{position:absolute;top:2px;right:4px}.px25-day em{font-style:normal;color:#ffe9a8;display:block;min-height:24px}
.px25-big{width:100%;padding:11px;font-size:15px;margin-top:6px}
.px25-ms{display:grid;gap:7px;margin:8px 0}.px25-m{display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#1a0e33;border:1px solid #4a2c86;border-radius:9px;padding:8px}.px25-m.got{border-color:#58c878}.px25-m b{flex:1 1 130px}.px25-m small{flex:1 1 100%;color:#bba6e6}
.px25-pb{position:relative;flex:1 1 110px;height:14px;background:#0d0820;border-radius:7px;overflow:hidden;border:1px solid #4a2c86}.px25-pb i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#7a4ab8,#ffd24a)}.px25-pb span{position:relative;font-size:10px;display:block;text-align:center;line-height:13px}
.px25-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px}.px25-card{text-align:center;background:#150a28;border:1px solid #4a2c86;border-radius:10px;padding:5px;font-size:11px}.px25-card img{width:80px;height:104px;image-rendering:pixelated;display:block;margin:0 auto 3px}.px25-card b{display:block}.px25-card small{display:block;color:#ffe9a8;min-height:14px}.px25-card.lock b,.px25-card.lock small{color:#8a7aa8}
.px25-cardinfo{margin-top:5px;border-top:1px solid #4a2c86;padding-top:4px;text-align:left;overflow-wrap:anywhere}.px25-cardinfo summary{cursor:pointer;color:#ffdd8d;text-align:center;line-height:1.35}.px25-cardinfo[open]{font-size:10px;line-height:1.6}.px25-cardinfo[open] div{padding:2px 0;border-bottom:1px solid #ffffff12}
.px25-title{position:relative;display:inline-flex;align-items:center;gap:3px;padding:3px 14px;border-radius:5px;font-size:13px;letter-spacing:.3px;border:2px solid #fff3;background:#1a0e33;box-shadow:0 0 0 1px #000,0 0 10px var(--g,#ffd24a);white-space:nowrap}.px25-title.sm{font-size:10px;padding:1px 10px;border-width:1px}
.px25-title b{background:linear-gradient(90deg,var(--a),var(--b),var(--a));background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:px25shine 2.2s linear infinite;text-shadow:none;font-weight:800}
.px25-title .px25-sp{width:13px;height:13px;image-rendering:pixelated;position:absolute;top:-6px}.px25-title .px25-sp.l{left:-6px}.px25-title .px25-sp.r{right:-6px;bottom:-6px;top:auto}
.t-fire{--a:#ff3a1a;--b:#ffe14a;--g:#ff7a2a}.t-ice{--a:#4a8aff;--b:#c8f4ff;--g:#7ad8ff}.t-gold{--a:#ffb02e;--b:#fff6c0;--g:#ffd24a}.t-plain{--a:#d9c8f8;--b:#ffffff;--g:#a47ae0}
.t-rain{--g:#ff9aff;border-color:#ffffff88;animation:px25glow 3s linear infinite}.t-rain b{background:linear-gradient(90deg,#ff6a6a,#ffe14a,#7dff9a,#7ad8ff,#c08aff,#ff6a6a);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:px25shine 2.6s linear infinite}
@keyframes px25shine{to{background-position:200% 0}}@keyframes px25glow{0%{box-shadow:0 0 0 1px #000,0 0 12px #ff6a6a}25%{box-shadow:0 0 0 1px #000,0 0 12px #ffe14a}50%{box-shadow:0 0 0 1px #000,0 0 12px #7dff9a}75%{box-shadow:0 0 0 1px #000,0 0 12px #7ad8ff}100%{box-shadow:0 0 0 1px #000,0 0 12px #ff6a6a}}
.px25-plate{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(100% + 2px);z-index:6;pointer-events:none}#sprites .sprite{position:relative}
.px25-aura{position:absolute!important;left:50%;bottom:-6px;width:150%!important;max-width:none!important;height:auto!important;border:0!important;border-radius:0!important;transform:translateX(-50%);z-index:0!important;pointer-events:none;image-rendering:pixelated;mix-blend-mode:screen;opacity:.95}
.px25-emote{position:absolute!important;left:50%;top:-26px;width:44px!important;height:auto!important;border:0!important;border-radius:0!important;transform:translateX(-50%);z-index:9;image-rendering:pixelated;pointer-events:none;animation:px25pop .3s ease-out}@keyframes px25pop{from{transform:translateX(-50%) scale(.3)}to{transform:translateX(-50%) scale(1)}}
#px25TopTitle{margin:3px 0 1px}
.px25-setbox{border:1px solid #4a2c86;border-radius:10px;padding:8px;background:#1a0e33;margin-bottom:8px}.px25-setbox.full{border-color:#fff;box-shadow:0 0 14px #ff9aff88 inset,0 0 10px #7ad8ff88;animation:px25glow 3s linear infinite}.px25-pc{display:inline-block;font-size:11px;background:#2a1850;border-radius:99px;padding:1px 8px;margin:2px;color:#8a7aa8}.px25-pc.ok{color:#fff;background:#6a3aa8}
.px25-wb{position:fixed;left:50%;top:6px;transform:translateX(-50%);z-index:9000;font-size:12px;padding:5px 12px;border-radius:99px;cursor:pointer;background:#2a1850;border:1px solid #a47ae0;color:#fff;display:none;max-width:94vw;text-align:center}.px25-wb.on{display:block;background:linear-gradient(90deg,#7a1a2a,#c8501a,#7a1a2a);border-color:#ffd24a;box-shadow:0 0 14px #ff7a2a;animation:px25glow 2s linear infinite}.px25-wb.soon{display:block}.px25-wb img{width:13px;height:13px;image-rendering:pixelated;vertical-align:middle}
.px25-wbcard{display:flex;gap:10px;align-items:center;background:#1a0e33;border:1px solid #4a2c86;border-radius:10px;padding:8px;flex-wrap:wrap}.px25-wbcard.on{border-color:#ffd24a;box-shadow:0 0 12px #ff7a2a88}.px25-wbcard img{width:96px;height:96px;object-fit:contain;image-rendering:pixelated;background:#6a3aa8;border-radius:8px}
.px25-board .px25-row{display:flex;gap:8px;align-items:center;padding:5px 8px;border-bottom:1px solid #3a2466}.px25-row.me{background:#3a2466}.px25-row .rk{width:28px;text-align:center}.px25-row .nm{flex:1}.px25-row b{color:#ffe9a8}
.px25-form{display:flex;gap:6px;margin:7px 0}.px25-form input{flex:1;background:#0d0820;border:1px solid #6a3aa8;color:#fff;border-radius:7px;padding:8px}.px25-chat{max-height:150px;overflow:auto;background:#0d0820;border-radius:8px;padding:6px;font-size:12px;margin:6px 0}.px25-members span{display:inline-block;background:#2a1850;border-radius:99px;padding:1px 9px;margin:2px;font-size:12px}
.px25-code{font:700 22px monospace;letter-spacing:4px;text-align:center;background:#0d0820;border:1px dashed #ffd24a;border-radius:8px;padding:6px;margin:6px 0;color:#ffd24a}.px25-sim{background:#1a0e33;border:1px dashed #6a3aa8;border-radius:8px;padding:10px;color:#bba6e6;font-size:12px}.px25-reb{text-align:center}.px25-reb img{width:56px;height:56px;image-rendering:pixelated}
#px25Hub{position:relative}#px25Hub.dot::after{content:'';position:absolute;top:3px;right:3px;width:10px;height:10px;border-radius:50%;background:#ff3a3a;box-shadow:0 0 6px #ff3a3a;border:1px solid #fff}
#px25EmoBtn{position:fixed;right:10px;bottom:84px;z-index:8000;width:44px;height:44px;border-radius:50%;border:2px solid #ffd24a;background:#2a1850;font-size:20px;padding:0;cursor:pointer}#px25EmoPanel{display:none;position:fixed;right:10px;bottom:134px;z-index:8000;background:#1a0e33;border:2px solid #ffd24a;border-radius:12px;padding:6px;grid-template-columns:repeat(4,1fr);gap:4px}#px25EmoPanel.on{display:grid}#px25EmoPanel button{padding:2px;background:#2a1850;border:1px solid #6a3aa8;border-radius:8px}#px25EmoPanel img{width:38px;height:40px;image-rendering:pixelated;display:block}
.px25-modal{position:fixed;inset:0;z-index:99990;background:#000a;display:flex;align-items:center;justify-content:center;padding:12px}.px25-offl,.px25-sharebox{background:#1a0e33;border:2px solid #ffd24a;border-radius:14px;padding:16px;text-align:center;max-width:380px;max-height:94vh;overflow:auto;box-shadow:0 0 24px #ff9aff66}.px25-offl img{width:56px;height:56px;image-rendering:pixelated}.px25-sharebox img{max-width:100%;max-height:68vh;image-rendering:pixelated}.px25-sharebox .row{display:flex;gap:6px;justify-content:center;margin-top:8px}
`;
document.head.appendChild(css);
function mount() {
  const nav = document.querySelector('.nav'); if (nav && !$('px25Hub')) { const b = document.createElement('button'); b.id = 'px25Hub'; b.type = 'button'; b.innerHTML = '🎯<span>กิจกรรม</span>'; b.onclick = () => openHub(); nav.appendChild(b); }
  if (!$('px25EmoBtn')) { const e = document.createElement('button'); e.id = 'px25EmoBtn'; e.type = 'button'; e.textContent = '😀'; e.title = 'อีโมต'; e.onclick = () => emoPanel(); document.body.appendChild(e); }
}
function start() {
  if (!S()) return setTimeout(start, 300);
  ensureDaily(); installHooks(); mount(); refreshTitles(); setTimeout(() => { refresh(); paintDot(); }, 900);
  safe(() => { const r = localStorage.getItem('amber_v25_ref'); if (r) { const v = V(); if (!v.ref.hint) { v.ref.hint = r; } } });
  setInterval(() => { ensureDaily(); paintDot(); refreshTitles(); }, 15000);
}
window.AMBER_V25 = { open: openHub, V, setInfo, activeTitleId, TITLES, shareCard, cardTier, titleHTML, auraKind, wbWindow, grant, commit, refresh };
start();
})();
