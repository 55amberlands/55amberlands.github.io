/* 55 AMBERLANDS V26 — REALTIME CROWD / PARTY WORLD MAP / WORLD-BOSS ARENA
 *  A  Same-map crowd: see up to 10 players (you + 9) standing in the map, each with the monster they fight above them
 *  B  "ใครอยู่ไหน" world map: dots for up to 10 parties (+ solo dots) per place, tap a party dot -> request to join
 *  C  3-hourly World-Boss arena: browser renders; V27.3 Supabase RPC owns damage, HP, cooldown and payout
 *  Uses the existing Supabase realtime room (presence + broadcast). No new SQL. Offline = simulation mode.
 */
(() => {
'use strict';
const PX = window.PX; if (!PX) return;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"'`]/g, c => '&#' + c.charCodeAt(0) + ';');
const fmt = n => Math.max(0, Math.floor(Number(n) || 0)).toLocaleString('th-TH');
const safe = (fn, d) => { try { return fn(); } catch (e) { console.warn('[v26]', e && e.message); return d; } };
const ST = () => (typeof state !== 'undefined' ? state : null);
const jobName = j => ({ 'เวท': 'จอมเวท' }[j] || j || 'นักผจญภัย');
const V25 = () => window.AMBER_V25 || {};
const myId = () => safe(() => window.AMBER_CLOUD.getUser()?.id, null) || 'me';

/* =============================================================== network */
let R = null, Rp = null;
function getR() { if (R) return Promise.resolve(R); if (!window.claude || !claude.use) return Promise.resolve(null); return Rp || (Rp = claude.use('room').then(r => (R = r), () => null)); }
function onNet(evt, fn) { getR().then(r => r && r.on && r.on(evt, m => safe(() => fn(m)))); }
function emit(evt, data) { getR().then(r => r && r.emit && r.emit(evt, data).catch(() => { })); }
const isOnline = () => !!(window.AMBER_PUBLIC_PEERS && window.AMBER_PUBLIC_PEERS.length) && !FAKE.on;

/* ---------- fake crowd (offline preview + tests) ---------- */
const FAKE = { on: false, list: [], t: 0 };
const FN = ['Aria', 'Kenji', 'Mochi', 'Zeno', 'Luna', 'Bank', 'Pim', 'Rex', 'Nana', 'Tao', 'Fah', 'Ken', 'Mint', 'Joe', 'Nok', 'Ice', 'Boss', 'Gift', 'Ploy', 'Max'];
const FJ = ['ดาบ', 'ธนู', 'หมัด', 'จอมเวท'];
function makeFake(n) {
  const st = ST(), maps = (typeof MAPS !== 'undefined' ? MAPS : []), here = st ? st.map : 'school', out = [];
  for (let i = 0; i < n; i++) {
    const inHere = i < 12, map = inHere ? here : maps[(i * 3) % Math.max(1, maps.length)][0];
    const party = i % 5 === 0 ? 'fk-A' : i % 5 === 1 ? 'fk-A' : i % 7 === 3 ? 'fk-B' : i % 7 === 4 ? 'fk-B' : '';
    const mons = (typeof MONS !== 'undefined' ? MONS : []).filter(m => m.map === map && !m.boss);
    out.push({ by: 'fake' + i, isMe: false, kind: 'viewer', presence: { n: FN[i % FN.length], lv: Math.max(1, (st ? st.lv : 10) + (i % 7) - 3), job: FJ[i % 4], gender: i % 2 ? 'female' : 'male', map, zone: ['A · ทางเข้า', 'B · กลางแผนที่', 'C · มอนสเตอร์หนาแน่น', 'D · ลานบอส'][(i * 5) % 4], pid: party, w: 'ดาบกล้า', wt: FJ[i % 4], wr: i % 4, we: (i * 3) % 11, wl: 10, atk: 60 + i * 25, mon: (mons[i % Math.max(1, mons.length)] || {}).name || '', mh: 40 + (i * 17) % 60, ttl: i === 2 ? 'set_fire' : i === 6 ? 'k1000' : '' } });
  }
  return out;
}
function setFake(on) {
  FAKE.on = !!on; if (on) { FAKE.list = makeFake(24); FAKE.t = Date.now(); } renderCrowd(true);
}
setInterval(() => { if (!FAKE.on) return; FAKE.list.forEach((p, i) => { const x = p.presence; x.mh -= 6 + (i % 4) * 3; if (x.mh <= 0) { x.mh = 100; const ms = (typeof MONS !== 'undefined' ? MONS : []).filter(m => m.map === x.map && !m.boss); if (ms.length) x.mon = ms[Math.floor(Math.random() * ms.length)].name; } }); }, 1200);

function norm(p) {
  const x = p.presence || {}, lv = live[p.by] || {};
  return { id: p.by, n: String(x.n || '?').slice(0, 16), lv: x.lv | 0, job: String(x.job || '').slice(0, 8), g: x.gender === 'female' ? 'female' : 'male', map: String(x.map || ''), zone: String(x.zone || ''), pid: x.pid ? String(x.pid).slice(0, 40) : '', w: { w: String(x.w || '').slice(0, 55), wt: String(x.wt || ''), wr: x.wr | 0, we: x.we | 0, wl: x.wl | 0 }, atk: x.atk | 0, ttl: String(x.ttl || ''), dg: !!x.dungeon, mon: lv.m || x.mon || '', mh: lv.h != null ? lv.h : (x.mh != null ? x.mh : 100), d: lv.d || 0, dt: lv.t || 0, emo: x.emo, emt: x.emt };
}
const peers = () => (FAKE.on ? FAKE.list : (window.AMBER_PUBLIC_PEERS || [])).filter(p => !p.isMe && p.by && p.presence).map(norm);
const live = {};   // by -> {m,h,d,t}
onNet('v26st', m => { const d = m.data; if (!d || m.isMe || !m.by) return; live[m.by] = { m: String(d.m || '').slice(0, 20), h: Math.max(0, Math.min(100, d.h | 0)), d: d.d | 0, t: Date.now() }; });

/* own status hooks: presence gets mon / hp% (slow fallback) ; fast broadcast every 2.5 s */
function myMob() { const m = safe(() => mob(), null); if (!m) return { m: '', h: 100 }; const cur = safe(() => currentHp, m.hp); return { m: m.name, h: Math.max(0, Math.min(100, Math.round(100 * cur / m.hp))) }; }
safe(() => { const o = window.AMBER_V12 && window.AMBER_V12.presenceInfo; if (o) window.AMBER_V12.presenceInfo = function () { const b = o.apply(this, arguments) || {}, mm = myMob(); return { ...b, mon: mm.m, mh: mm.h }; }; });
setInterval(() => {
  const st = ST(); if (!st || FAKE.on || document.hidden) return;
  if (!peers().some(p => p.map === st.map)) return;
  const mm = myMob(), c = safe(() => window.AMBER_V12.combat(), { atk: 30 });
  emit('v26st', { m: mm.m, h: mm.h, d: Math.round(c.atk * (0.85 + Math.random() * .3)) });
}, 2500);

/* =============================================================== A. crowd overlay */
let crowd = null, cSig = '', cEls = {};
function ensureCrowd() {
  const sc = $('scene'); if (!sc) return null;
  if (!crowd || crowd.parentNode !== sc) { crowd = document.createElement('div'); crowd.id = 'px26Crowd'; sc.appendChild(crowd); cSig = ''; cEls = {}; }
  return crowd;
}
const heroURL = p => safe(() => PX.hero.reg(jobName(p.job), p.g, p.w && p.w.w ? PX.weaponSpec({ w: p.w.w, wt: p.w.wt, wr: p.w.wr, we: p.w.we, wl: p.w.wl }) : null), '');
const monURL = n => (n && PX.creatures.TABLE[n]) ? safe(() => PX.creatures.reg(n), '') : '';
function crowdList() {
  const st = ST(); if (!st) return [];
  const sc = $('scene'); if (sc && sc.classList.contains('amber24-dungeon-scene')) return [];
  let mp = null; safe(() => { mp = typeof myPid !== 'undefined' ? myPid : null; });
  const ps = peers().filter(p => p.map === st.map && !p.dg), pid = window.AMBER_MY_PID || '';
  const partyShown = ps.filter(p => pid && p.pid === pid).length;
  const others = ps.filter(p => !(pid && p.pid === pid)).sort((a, b) => Math.abs(a.lv - st.lv) - Math.abs(b.lv - st.lv));
  return others.slice(0, Math.max(0, 9 - partyShown));
}
function renderCrowd(force) {
  const st = ST(); if (!st) return; const host = ensureCrowd(); if (!host) return;
  const list = crowdList(), sig = list.map(p => p.id + p.lv + p.job + p.n + p.w.w + p.w.we + p.ttl + p.pid).join('|');
  if (force || sig !== cSig) {
    cSig = sig; host.innerHTML = ''; cEls = {};
    host.classList.toggle('many', list.length > 4);
    list.forEach(p => {
      const c = document.createElement('div'); c.className = 'px26-c'; c.dataset.id = p.id;
      const ak = V25().auraKind ? V25().auraKind(p.ttl) : '';
      c.innerHTML = `<div class="px26-m"><img class="px26-mi" alt=""><i><u></u></i><b class="px26-dmg"></b></div><div class="px26-hw">${ak ? `<img class="px26-aura" src="${PX.ui.auraURL(ak)}" alt="">` : ''}<img class="px26-h" src="${heroURL(p)}" alt="${esc(p.n)}"></div><small>${p.pid ? '👥' : ''}${esc(p.n)}</small>${p.ttl && V25().TITLES && V25().TITLES[p.ttl] ? `<div class="px26-t">${V25().titleHTML(p.ttl, true)}</div>` : ''}`;
      host.appendChild(c); cEls[p.id] = c;
    });
  }
  const now = Date.now();
  list.forEach(p => {
    const c = cEls[p.id]; if (!c) return; const mi = c.querySelector('.px26-mi'), m = c.querySelector('.px26-m'), u = c.querySelector('i u'), dm = c.querySelector('.px26-dmg');
    const url = monURL(p.mon); if (url) { if (mi.dataset.m !== p.mon) { mi.dataset.m = p.mon; mi.src = url; } m.style.visibility = 'visible'; } else m.style.visibility = 'hidden';
    u.style.width = Math.max(0, Math.min(100, p.mh)) + '%';
    if (p.dt && p.dt !== c._dt && now - p.dt < 4000) { c._dt = p.dt; dm.textContent = '-' + fmt(p.d); dm.classList.remove('pop'); void dm.offsetWidth; dm.classList.add('pop'); }
    if (p.emo && p.emt && now - p.emt < 3500) { if (c._em !== p.emt) { c._em = p.emt; c.querySelectorAll('.px26-em').forEach(e => e.remove()); const im = new Image(); im.className = 'px26-em'; im.src = PX.ui.emoteURL(p.emo); c.appendChild(im); setTimeout(() => im.remove(), 3500); } }
  });
}
setInterval(() => safe(() => renderCrowd(false)), 700);
document.addEventListener('click', e => { const c = e.target.closest('.px26-c'); if (c && c.dataset.id) showPeerCard(c.dataset.id); });
function showPeerCard(id) {
  const p = peers().find(x => x.id === id); if (!p) return; $('px26Peer')?.remove();
  const d = document.createElement('div'); d.id = 'px26Peer'; d.className = 'px26-pop';
  const mine = window.AMBER_MY_PID || '';
  d.innerHTML = `<b>${esc(p.n)}</b> <small>Lv.${p.lv} ${esc(p.job)}</small><br>${p.ttl && V25().TITLES && V25().TITLES[p.ttl] ? V25().titleHTML(p.ttl, true) + '<br>' : ''}<small>${esc(p.zone)}${p.pid ? ' · 👥 อยู่ในปาร์ตี้' : ''}</small><div class="row">${!FAKE.on ? `<button data-px26="inv" data-id="${esc(p.id)}">📨 ชวนเข้าปาร์ตี้</button>` : ''}${p.pid && p.pid !== mine && !FAKE.on ? `<button data-px26="join" data-pid="${esc(p.pid)}">🙋 ขอเข้าปาร์ตี้นี้</button>` : ''}<button data-px26="x">ปิด</button></div>`;
  document.body.appendChild(d);
}

/* =============================================================== B. party world map */
const ZONES = [['A', 'ทางเข้า'], ['B', 'กลางแผนที่'], ['C', 'มอนหนาแน่น'], ['D', 'ลานบอส']];
const pcol = s => { const h = PX.hash(s || 'x') % 360; return `hsl(${h} 80% 62%)`; };
const zoneIdx = z => Math.max(0, ZONES.findIndex(q => String(z).startsWith(q[0])));
let mapSel = null, pending = null;
function worldData() {
  const st = ST(), maps = typeof MAPS !== 'undefined' ? MAPS : [], res = {}, pid = window.AMBER_MY_PID || '';
  maps.forEach(m => res[m[0]] = { m, parties: {}, solos: [], n: 0 });
  const all = peers().filter(p => !p.dg);
  all.push({ id: 'me', n: st.name + ' (คุณ)', lv: st.lv, job: st.job, map: st.map, zone: (($('spot') || {}).value) || 'A · ทางเข้า', pid, me: true });
  all.forEach(p => { const r = res[p.map]; if (!r) return; r.n++; if (p.pid) (r.parties[p.pid] = r.parties[p.pid] || []).push(p); else r.solos.push(p); });
  // cap parties to 10 in total (biggest first)
  const plist = []; Object.values(res).forEach(r => Object.entries(r.parties).forEach(([k, v]) => plist.push({ r, k, n: v.length })));
  plist.sort((a, b) => b.n - a.n); const keep = new Set(plist.slice(0, 10).map(x => x.k)), hidden = plist.length - keep.size;
  Object.values(res).forEach(r => { Object.keys(r.parties).forEach(k => { if (!keep.has(k)) { r.solos.push(...r.parties[k]); delete r.parties[k]; } }); });
  return { res, hidden, total: all.length, parties: Math.min(10, plist.length) };
}
function mapHTML() {
  const d = worldData(), st = ST();
  let h = `<p class="px26-hint">${FAKE.on ? '🧪 <b>โหมดจำลอง</b> (ข้อมูลตัวอย่าง) · ' : ''}ออนไลน์ทั้งเกม <b>${d.total}</b> คน · จุดสี = ปาร์ตี้ (ตัวเลข = จำนวนคน, แสดงสูงสุด 10 ปาร์ตี้) · จุดเทา = ผู้เล่นเดี่ยว${d.hidden > 0 ? ` · ซ่อนอีก ${d.hidden} ปาร์ตี้` : ''}</p>`;
  h += Object.values(d.res).map(r => {
    const [id, name, lo, hi] = r.m, here = id === st.map, locked = st.lv < lo - 0;
    const slots = ZONES.map((z, zi) => {
      const dots = Object.entries(r.parties).filter(([k, v]) => zoneIdx(v[0].zone) === zi).map(([k, v]) => `<button class="px26-dot party" style="--c:${pcol(k)}" data-px26="pd" data-k="${esc(k)}" data-map="${esc(id)}" title="ปาร์ตี้ ${v.length} คน">${v.length}</button>`).join('')
        + r.solos.filter(p => zoneIdx(p.zone) === zi).slice(0, 8).map(p => `<span class="px26-dot solo${p.me ? ' me' : ''}" title="${esc(p.n)}"></span>`).join('');
      return `<div class="px26-slot"><em>${z[1]}</em><div>${dots}</div></div>`;
    }).join('');
    return `<div class="px26-mapcard${here ? ' here' : ''}"><div class="hd"><b>${esc(name)}</b><small>Lv.${lo}-${hi}${here ? ' · 📍 คุณอยู่ที่นี่' : ''}</small><span>👥 ${r.n}</span></div><div class="px26-zones">${slots}</div></div>`;
  }).join('');
  h += `<div id="px26Det" class="px26-det">${detHTML()}</div><div class="px26-form"><button data-px26="sim">${FAKE.on ? '⏹️ ปิดโหมดจำลอง' : '🧪 จำลองผู้เล่น 24 คน (ดูตัวอย่าง)'}</button></div>`;
  return h;
}
function detHTML() {
  if (!mapSel) return '<small>แตะจุดสีเพื่อดูสมาชิกปาร์ตี้ และขอเข้าร่วม</small>';
  const d = worldData(), r = d.res[mapSel.map], mem = r && r.parties[mapSel.k]; if (!mem) return '<small>ปาร์ตี้นี้ไม่อยู่แล้ว</small>';
  const st = ST(), mine = window.AMBER_MY_PID || '', zone = mem[0].zone, lo = r.m[2];
  const canGo = st.map !== mapSel.map && st.lv >= lo;
  return `<b style="color:${pcol(mapSel.k)}">● ปาร์ตี้ ${mem.length}/7</b> · ${esc(r.m[1])} · ${esc(zone)}<div class="px26-mem">${mem.map(p => `<span>${esc(p.n)} <small>Lv.${p.lv} ${esc(p.job)}</small></span>`).join('')}</div><div class="row">${mem.some(p => p.me) ? '<small>นี่คือปาร์ตี้ของคุณ</small>' : (mine ? '<small>ออกจากปาร์ตี้ปัจจุบันก่อนจึงจะขอเข้าอื่นได้</small>' : mem.length >= 7 ? '<small>ปาร์ตี้เต็ม</small>' : `<button class="goldbtn" data-px26="join" data-pid="${esc(mapSel.k)}">🙋 ขอเข้าปาร์ตี้</button>`)}${canGo ? `<button data-px26="go" data-map="${esc(mapSel.map)}">🚶 ไปแมปนี้</button>` : (st.map !== mapSel.map ? `<small>ต้อง Lv.${lo}+</small>` : '')}</div>`;
}
function openWorld() {
  safe(() => openModal('🗺️ ใครอยู่ที่ไหน (ปาร์ตี้ออนไลน์)', '<div id="px26Map"></div>'));
  paintWorld();
}
function paintWorld() { const b = $('px26Map'); if (b) b.innerHTML = mapHTML(); }
setInterval(() => { const b = $('px26Map'); if (b && b.isConnected) { const y = b.parentNode.scrollTop; paintWorld(); b.parentNode.scrollTop = y; } }, 4000);

/* join request: requester -> party; any member accepts -> existing 'pinv' invite flow */
onNet('v26jr', m => {
  const d = m.data, mine = window.AMBER_MY_PID || ''; if (!d || m.isMe || !mine || d.pid !== mine || pending) return;
  pending = { from: m.by, n: String(d.n || 'ผู้เล่น').slice(0, 16), lv: d.lv | 0, job: String(d.job || '').slice(0, 8) };
  const c = document.createElement('div'); c.className = 'raidalert'; c.id = 'px26Req';
  c.innerHTML = `<div class="raidcard"><h2>🙋 ขอเข้าปาร์ตี้</h2><p><b>${esc(pending.n)}</b> Lv.${pending.lv} ${esc(pending.job)} ขอเข้าร่วมปาร์ตี้ของคุณ</p><button class="goldbtn" data-px26="reqok">✅ รับเข้า</button><button data-px26="reqno">ปฏิเสธ</button></div>`;
  document.body.appendChild(c); pending.t = setTimeout(() => { pending = null; c.remove(); }, 30000);
});

/* =============================================================== C. world boss arena */
const ARENA = { on: false, practice: false, simulated: false, serverMode: false, server: null, serverBusy: false, claiming: false, ev: '', boss: null, me: null, roster: {}, bots: [], t0: 0, done: false, tick: 0, hb: 0, timers: [], autoBot: true, autoSkill: true, autoPotion: true, testHP: 500, testMaxHP: 500, testMP: 120, testMaxMP: 120, testHpPots: 5, testMpPots: 5, manual: false };
const eventKey = () => { const d = new Date(); const h = Math.floor(d.getHours()/3)*3; return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') + 'T' + String(h).padStart(2,'0'); };
function pickBoss() {
  const bs = (typeof MONS !== 'undefined' ? MONS : []).filter(m => m.boss && PX.creatures.TABLE[m.name]); if (!bs.length) return null;
  const day = Math.floor(Date.now() / 86400000); return bs[day % bs.length];
}
function pickBossId(id) {
  try { const b=PX.worldBosses.get(id);if(b) return {name:b.name,lv:b.lv,boss:true,map:'worldboss',scene:b.scene,
    wb28:b.id,col:b.col,element:b.element,title:b.title,hp28:b.hp,atk28:b.atk}; }
  catch(e) {console.warn('[V3014 V28 boss asset]',e)} return pickBoss();
}
function myRow() {
  const st = ST(), c = safe(() => window.AMBER_V12.combat(), { atk: 40, crit: .1 }), wi = safe(() => window.AMBER_V12.weaponInfo(), null) || {};
  return { id: myId(), n: st.name, lv: st.lv, job: st.job, g: st.gender || 'male', pid: window.AMBER_MY_PID || myId(), atk: c.atk, crit: c.crit || .1, w: { w: wi.name || '', wt: wi.cls || '', wr: wi.rar | 0, we: wi.enh | 0, wl: wi.lv | 0 }, d: ARENA.me ? ARENA.me.d : 0, j: ARENA.me ? ARENA.me.j : Date.now(), ttl: safe(() => V25().activeTitleId(), ''), seen: Date.now(), me: true };
}
onNet('v26wb', m => {
  const d = m.data; if (!d || m.isMe || !m.by || !ARENA.on || d.ev !== ARENA.ev) return;
  const r = ARENA.roster[m.by], nd = d.d | 0;
  ARENA.roster[m.by] = { id: m.by, n: String(d.n || '?').slice(0, 16), lv: d.lv | 0, job: String(d.job || ''), g: d.g === 'female' ? 'female' : 'male', pid: String(d.pid || m.by).slice(0, 40), atk: Math.max(1, d.atk | 0), w: d.w || {}, d: nd, j: d.j | 0, ttl: String(d.ttl || ''), seen: Date.now(), prev: r ? r.d : nd, popAt: 0 };
});
function bossMax() { const all = allPlayers(); return Math.max(20000, all.reduce((s, p) => s + Math.max(30, p.atk), 0) * 240); }
function admitted() {
  const all = Object.values(ARENA.roster).concat(ARENA.me ? [ARENA.me] : []).concat(ARENA.bots).filter(p => Date.now() - p.seen < 14000 || p.bot);
  const first = {}; all.forEach(p => { first[p.pid] = Math.min(first[p.pid] || 1e15, p.j || 0); });
  const keys = Object.keys(first).sort((a, b) => first[a] - first[b] || (a < b ? -1 : 1)).slice(0, 10);
  return { keys, all: all.filter(p => keys.includes(p.pid)), full: Object.keys(first).length > 10 };
}
const allPlayers = () => admitted().all;
const total = () => allPlayers().reduce((s, p) => s + (p.d | 0), 0);
function startBots() {
  ARENA.bots = []; const st = ST(), now = Date.now(); const groups = [['sim-A', 6], ['sim-B', 4], ['sim-C', 3], ['sim-D', 1]];
  let i = 0; groups.forEach(([k, n], gi) => { for (let a = 0; a < n; a++, i++) ARENA.bots.push({ id: 'bot' + i, bot: true, n: FN[i % FN.length], lv: Math.max(20, st.lv + (i % 5) - 2), job: FJ[i % 4], g: i % 2 ? 'female' : 'male', pid: k, atk: Math.max(80, (safe(() => window.AMBER_V12.combat().atk, 100)) * (0.7 + (i % 5) * .15)), crit: .12, w: { w: 'ดาบกล้า', wt: FJ[i % 4], wr: i % 4, we: (i * 2) % 11, wl: 30 }, d: 0, j: now + gi * 10, ttl: i === 1 ? 'set_prism' : i === 5 ? 'set_fire' : '', seen: now, prev: 0 }); });
}
function hit(p) { const crit = Math.random() < (p.crit || .1); const base = p.atk * (0.8 + Math.random() * .4); return Math.round(base * (crit ? 1.9 : 1)); }
const API=()=>ARENA.api || window.AMBER_V273;
async function openArena(practice,opt) {
  opt=opt||{};
  const w = safe(() => V25().wbWindow(), { open: false });
  if (!practice && !w.open) practice = true;
  safe(() => closeModal());
  if (ARENA.on) return;
  const real = !practice;
  if (real && !(opt.api || window.AMBER_V273)?.ready?.()) {
    safe(() => notify('🛡️ บอสจริงต้องล็อกอินและติดตั้ง Supabase V27.3 ก่อน (กดซ้อมได้)')); return;
  }
  const st = ST() || {};
  Object.assign(ARENA, { on: true, practice: !!practice, simulated: !!practice,
    api:opt.api||null, isV28:!!opt.bossId, serverMode: real, server: null, serverBusy: false, claiming: false, me: null,
    ev: real ? eventKey() : 'prac' + Date.now(), boss: (opt.bossId ? pickBossId(opt.bossId) : pickBoss()), roster: {}, bots: [],
    t0: Date.now(), done: false, tick: 0, hb: 0, manual: false,
    autoBot: true, autoSkill: st.autoSkill !== false, autoPotion: st.autopot !== false,
    testMaxHP: safe(() => maxHp(),500), testMaxMP: safe(() => maxMp(),120),
    testHpPots: 5, testMpPots: 5 });
  ARENA.testHP = ARENA.testMaxHP; ARENA.testMP = ARENA.testMaxMP;
  if (!ARENA.boss) { ARENA.on = false; safe(() => notify('ยังไม่มีบอสให้จัดกิจกรรม')); return; }
  ARENA.me = myRow(); ARENA.me.d = 0; ARENA.me.j = Date.now();
  if (real) {
    const joined = await (opt.api || window.AMBER_V273).join(opt.bossId);
    if (!joined?.ok) {
      ARENA.on = false;
      safe(() => notify('🛡️ เข้า World Boss จริงไม่ได้: ' + (joined?.reason || 'เซิร์ฟเวอร์ไม่ตอบรับ')));
      return;
    }
    ARENA.server = joined; ARENA.ev = joined.event_key;
  } else startBots();
  buildArena();
  ARENA.timers.push(setInterval(arenaTick, 1000));
}
function closeArena() {
  ARENA.timers.forEach(clearInterval); ARENA.timers = []; ARENA.on = false;
  $('px26Arena')?.remove();
  if (ARENA.serverMode && !ARENA.claiming) void API()?.leave?.();
}
function buildArena() {
  $('px26Arena')?.remove(); const b = ARENA.boss;
  const a = document.createElement('div'); a.id = 'px26Arena';
  a.innerHTML = `<canvas id="px26Bg"></canvas><div class="px26-top"><div><b>👑 ${ARENA.isV28 ? (ARENA.practice ? 'ซ้อมบอสโลก V28 (ไม่มีรางวัลจริง)' : 'บอสโลก V28 · ยืนยันโดย Supabase') : (ARENA.practice || ARENA.simulated ? 'ซ้อมบอสแร่ (ไม่มีรางวัลจริง)' : 'บอสแร่ทุก 3 ชั่วโมง · ยืนยันโดย Supabase')}</b> <small id="px26Time"></small></div><button data-px26="arx">✖ ออก</button></div>
  ${ARENA.serverMode ? `<div class="amber311-cbt-enter" role="status" style="position:absolute!important;z-index:80!important;top:56px;left:50%;transform:translateX(-50%);width:min(92vw,520px);box-sizing:border-box;text-align:center;border:3px solid #ffe184;border-radius:14px;padding:9px 12px;color:#fff6c9;background:#14284bf5;box-shadow:0 4px 28px #000b,0 0 18px #ffc95c77;pointer-events:none;animation:amber311cbt 8s ease-in forwards"><div style="font:900 clamp(17px,4vw,24px)/1.25 system-ui">🧪 CBT · บอส${ARENA.isV28?'โลก':'แร่'} ลงซ้ำได้ใน 30 นาที!</div><div style="font:700 12px/1.35 system-ui;margin-top:4px">${ARENA.isV28?'ปราบแล้วเข้าใหม่ได้ในรอบกิจกรรม · รางวัลแยกตามรอบ':'รับรางวัลให้ครบทุกคน ก่อนเปิดบอสแร่รอบถัดไป · รางวัลหนึ่งครั้งต่อช่วงกิจกรรม'}</div></div><style>@keyframes amber311cbt{0%,70%{opacity:1;visibility:visible}100%{opacity:0;visibility:hidden}}</style>` : ''}
  <div class="px26-boss"><div class="px26-bn">${esc(b.name)} <small>Lv.${b.lv}</small></div><div class="px26-bbar"><i id="px26Hp"></i><span id="px26HpT"></span></div><div class="px26-bimg"><img id="px26Boss" src="${PX.creatures.reg(b.name)}" alt=""><div id="px26Fx"></div></div></div>
  <div id="px273Vitals"><div>❤️ HP <b id="px273HpT">–</b><div class="px273-meter"><i id="px273Hp"></i></div></div><div>💧 MP <b id="px273MpT">–</b><div class="px273-meter mana"><i id="px273Mp"></i></div></div><small id="px273Pots">🧪 –</small><small id="px273Received"></small></div>
  <div id="px273Actions" class="px273-collapsed"><div class="px273-buttons" id="px273ActionButtons"><button data-px26="abot" id="px273AutoBot">AUTO BOT</button><button data-px26="askill" id="px273AutoSkill">AUTO SKILL</button><button data-px26="apot" id="px273AutoPotion">AUTO ยา</button><button data-px26="ahit" id="px273Hit">⚔️ ตีเอง</button></div><button type="button" data-px26="atoggle" id="px273Toggle" aria-controls="px273ActionButtons" aria-expanded="false" aria-label="กางแถบ Auto" title="กางแถบ Auto">▼ AUTO</button></div>
  <div class="px26-field" id="px26Field"></div><div class="px26-foot" id="px26Foot"></div>`;
  document.body.appendChild(a);
  safe(() => { const mi = typeof MAPS !== 'undefined' ? MAPS.findIndex(m => m[0] === b.map) : 0, key = PX.scenes.KEYS[Math.max(0, mi) % PX.scenes.KEYS.length], cv = $('px26Bg'), W = Math.ceil(innerWidth / 4), H = Math.ceil(innerHeight / 4); cv.width = W; cv.height = H; ARENA.scn = PX.scenes.create(key, W, H); ARENA.cv = cv.getContext('2d'); ARENA.W = W; ARENA.H = H; });
  paintArena(true);
}
let lastField = '';
function paintArena(force) {
  if (!ARENA.on) return; const adm = admitted(), all = adm.all;
  const max = ARENA.serverMode ? (ARENA.server?.boss_max_hp || 14000) : bossMax();
  const tot = total();
  const left = ARENA.serverMode ? (ARENA.server?.boss_hp ?? max) : Math.max(0,max-tot);
  const pct = Math.max(0, 100 * left / max);
  paintVitals();
  $('px26Hp').style.width = pct + '%'; $('px26HpT').textContent = fmt(left) + ' / ' + fmt(max) + ' (' + pct.toFixed(1) + '%)';
  const w = safe(() => V25().wbWindow(), { open: false, end: 0 }), tl = ARENA.practice ? '' : (w.open ? '⏳ เหลือ ' + Math.max(0, Math.floor((w.end - Date.now()) / 60000)) + ' นาที' : '');
  $('px26Time').textContent = tl + ' · 👥 ' + all.length + ' คน · ' + adm.keys.length + '/10 ปาร์ตี้';
  const mineIn = ARENA.serverMode || adm.keys.includes(ARENA.me.pid), sig = all.map(p => p.id + p.pid + p.lv + p.ttl + p.w.we).join('|') + adm.keys.join(',');
  if (force || sig !== lastField) {
    lastField = sig; const n = all.length, size = n <= 14 ? 58 : n <= 30 ? 46 : 38;
    const groups = adm.keys.map(k => ({ k, ps: all.filter(p => p.pid === k) }));
    $('px26Field').style.setProperty('--sz', size + 'px');
    $('px26Field').innerHTML = '<div class="px26-party-stack">' + groups.map((g, gi) => `<div class="px26-grp" style="--c:${pcol(g.k)}"><b>${g.ps.some(p => p.me) ? '⭐ ปาร์ตี้ของคุณ' : 'ปาร์ตี้ ' + (gi + 1)} <small>${g.ps.length} คน</small></b><div class="rw">${g.ps.map(p => { const ak = V25().auraKind ? V25().auraKind(p.ttl) : ''; return `<div class="px26-ap${p.me ? ' me' : ''}" data-pid="${esc(p.id)}">${ak ? `<img class="px26-aura" src="${PX.ui.auraURL(ak)}" alt="">` : ''}<img class="px26-h atk" src="${heroURL({ job: p.job, g: p.g, w: p.w })}" alt=""><small>${esc(p.n)}</small><em class="dm" data-dm="${esc(p.id)}"></em></div>`; }).join('')}</div></div>`).join('') + (adm.full ? '<p class="px26-warn">🚫 มีผู้เข้าร่วมครบ 10 ปาร์ตี้แล้ว — ปาร์ตี้ใหม่รอรอบหน้า</p>' : '') + '</div>';
  }
  const rank = ARENA.serverMode ? (ARENA.server?.ranking || []) : all.slice().sort((a,b) => b.d-a.d).slice(0,5);
  const rankText = ARENA.serverMode ? rank.map((p,i) => `${p.rank || i+1}.${esc(p.name)} ${fmt(p.damage)}`).join(' · ')
    : rank.map((p,i) => `${i+1}.${esc(p.n)} ${fmt(p.d)}`).join(' · ');
  $('px26Foot').innerHTML = (mineIn ? `<span>⚔️ ดาเมจคุณ <b>${fmt(ARENA.me.d)}</b> ${ARENA.serverMode ? '🛡️ SERVER' : '🧪 ซ้อม'}${ARENA.serverMode && ARENA.server?.my_atk ? ' · ATK '+fmt(ARENA.server.my_atk) : ''}</span>` : '<span class="px26-warn">🚫 ปาร์ตี้ของคุณเกิน 10 ปาร์ตี้ — โหมดผู้ชม</span>') + `<span class="rk">🏆 ${rankText}</span>`;
}
function popDmg(id, val, crit) {
  const el = document.querySelector(`[data-dm="${CSS.escape(id)}"]`); if (el) { el.textContent = '-' + fmt(val); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  const fx = $('px26Fx'); if (fx) { const s = document.createElement('span'); s.className = 'px26-bd' + (crit ? ' crit' : ''); s.textContent = crit ? '✦ CRITICAL! ✦ ' + fmt(val) : fmt(val); s.style.left = (15 + Math.random() * 70) + '%'; fx.appendChild(s); setTimeout(() => s.remove(), 900); }
  const bi = $('px26Boss'); if (bi) { bi.classList.add('hit'); setTimeout(() => bi.classList.remove('hit'), 90); }
}
function paintVitals() {
  const d = ARENA.serverMode ? (ARENA.server || {}) : {
    my_hp:ARENA.testHP,my_max_hp:ARENA.testMaxHP,my_mp:ARENA.testMP,my_max_mp:ARENA.testMaxMP,
    hp_pots:ARENA.testHpPots,mp_pots:ARENA.testMpPots};
  const hp = Math.max(0,d.my_hp ?? 0), maxHP = Math.max(1,d.my_max_hp || 1);
  const mp = Math.max(0,d.my_mp ?? 0), maxMP = Math.max(1,d.my_max_mp || 1);
  const hpbar = $('px273Hp'), mpbar = $('px273Mp');
  if (hpbar) hpbar.style.width = (100*hp/maxHP)+'%';
  if (mpbar) mpbar.style.width = (100*mp/maxMP)+'%';
  if ($('px273HpT')) $('px273HpT').textContent = fmt(hp)+' / '+fmt(maxHP);
  if ($('px273MpT')) $('px273MpT').textContent = fmt(mp)+' / '+fmt(maxMP);
  if ($('px273Pots')) $('px273Pots').textContent = `🧪 HP×${fmt(d.hp_pots)} · MP×${fmt(d.mp_pots)}`;
  const labels = [['px273AutoBot',ARENA.autoBot],['px273AutoSkill',ARENA.autoSkill],['px273AutoPotion',ARENA.autoPotion]];
  labels.forEach(([id,on]) => { const btn=$(id);if(btn){btn.classList.toggle('on',!!on);btn.setAttribute('aria-pressed',String(!!on));} });
  if ($('px273Hit')) $('px273Hit').disabled = ARENA.autoBot || ARENA.done;
}
async function serverArenaStep(doAttack) {
  if (!ARENA.on || ARENA.done || ARENA.serverBusy) return;
  ARENA.serverBusy = true;
  const ev = ARENA.ev;
  try {
    const s = doAttack ? await API().attack(ARENA.autoSkill,ARENA.autoPotion)
      : await API().status(ev);
    if (!ARENA.on || ARENA.ev !== ev) return;
    if (s?.ok) {
      ARENA.server = {...ARENA.server,...s};
      if (s.my_damage != null) ARENA.me.d = s.my_damage;
      if (s.hit_damage>0) {
        popDmg(ARENA.me.id,s.hit_damage,s.crit === true); // AMBER297_WORLDBOSS_CRIT: server flag only
        if (s.used_skill) safe(() => {
          const known = typeof SKILLS !== 'undefined' ? SKILLS.filter(sk => ST()?.learned?.includes(sk.id)) : [];
          const sk = window.AMBER_V19?.pickSkill?.(known) || known[0];
          if (sk) window.AMBER_FX?.onAttack?.(sk,s.hit_damage,ARENA.boss);
        });
      }
      const hp = $('px273Received');
      if (hp && s.incoming_damage>0) hp.textContent = '💥 บอสตีคุณ -'+fmt(s.incoming_damage)+' HP'+(s.used_hp_pot?' · ใช้ยา HP':'');
      if (s.incoming_damage>0) {const sprite=document.querySelector('.px26-ap.me');if(sprite){sprite.classList.remove('px273-hurt');void sprite.offsetWidth;sprite.classList.add('px273-hurt');}}
      if (s.used_hp_pot || s.used_mp_pot) safe(() => {if (typeof renderTop==='function') renderTop();});
      paintArena(false);
      if (s.defeated) { if (ARENA.api) try { window.AMBER_V28?.bossDown?.(ARENA.ev,ARENA.boss?.name,s.ranking); } catch (_) {} finishArena(true); }
      else if (s.my_hp === 0) finishArena(false);
      else if (s.ended || !V25().wbWindow().open) finishArena(false);
    } else if (s?.reason === 'player_defeated') finishArena(false);
    else if (s?.reason !== 'cooldown' && s?.reason !== 'busy') {
      const hp=$('px273Received');if(hp)hp.textContent='🛡️ '+String(s?.reason||'เซิร์ฟเวอร์ไม่ตอบกลับ').slice(0,80);
    }
  } catch(e) { console.error('[V27.3 arena]',e); }
  finally { ARENA.serverBusy=false; }
}
function arenaTick() {
  if (!ARENA.on || ARENA.done) return;
  // Keep the local hero visible throughout a boss fight, including practice.
  // Remote peers still expire normally if their Realtime presence stops.
  if (ARENA.me) ARENA.me.seen = Date.now();
  ARENA.tick++;
  if (ARENA.serverMode) {
    if (ARENA.autoBot || ARENA.manual) { ARENA.manual=false; void serverArenaStep(true); }
    else if (ARENA.tick%3===0) void serverArenaStep(false);
    // V28.7: Real-time verified ranking is refreshed even while AUTO attacks.
    if (ARENA.tick%3===0 && !ARENA.rankingBusy && !ARENA.done) {
      ARENA.rankingBusy=true;const key=ARENA.ev;
      Promise.resolve(API().status(key)).then(s=>{
        if(ARENA.on&&ARENA.ev===key&&s?.ok&&Array.isArray(s.ranking)){
          ARENA.server={...(ARENA.server||{}),ranking:s.ranking};
          paintArena(false);
        }
      }).catch(e=>console.warn('[V287 server ranking]',e)).finally(()=>{ARENA.rankingBusy=false});
    }
  } else {
    const adm=admitted(); const me=Object.assign(ARENA.me,myRow());me.d=ARENA.me.d;
    const isHit = ARENA.autoBot || ARENA.manual; ARENA.manual=false;
    if (isHit && adm.keys.includes(ARENA.me.pid)) {
      const skilled = ARENA.autoSkill && ARENA.testMP>=12 && ARENA.tick%4===0;
      let dmg = hit(me)*(skilled?2:1);
      if(skilled) ARENA.testMP-=12;
      me.d+=dmg;popDmg(me.id,dmg,skilled);
      const received=8+(ARENA.tick%7);
      ARENA.testHP=Math.max(0,ARENA.testHP-received);
      if(ARENA.autoPotion && ARENA.testHpPots>0 && ARENA.testHP<ARENA.testMaxHP*.45){
        ARENA.testHpPots--;ARENA.testHP=Math.min(ARENA.testMaxHP,ARENA.testHP+Math.ceil(ARENA.testMaxHP*.45));
      }
      if(ARENA.autoPotion && ARENA.testMpPots>0 && ARENA.testMP<ARENA.testMaxMP*.2){
        ARENA.testMpPots--;ARENA.testMP=Math.min(ARENA.testMaxMP,ARENA.testMP+Math.ceil(ARENA.testMaxMP*.5));
      }
      if($('px273Received'))$('px273Received').textContent='💥 บอสตีคุณ -'+received+' HP (ซ้อม)';
    }
    ARENA.bots.forEach(b=>{b.seen=Date.now();if(Math.random()<.8){const dmg=hit(b);b.d+=dmg;if(Math.random()<.5)popDmg(b.id,dmg);}});
    if (total()>=bossMax()) finishArena(true);
    else if (ARENA.testHP<=0) finishArena(false);
  }
  Object.values(ARENA.roster).forEach(p=>{if(p.d>p.prev&&Date.now()-p.popAt>700){p.popAt=Date.now();popDmg(p.id,Math.round((p.d-p.prev)/2.5),false);p.prev=p.d;}});
  // Broadcast status is visual only: not accepted as proof of damage or victory.
  if (!ARENA.practice && !FAKE.on && Date.now()-ARENA.hb>2600) {
    ARENA.hb=Date.now(); const me=ARENA.me;
    emit('v26wb',{ev:ARENA.ev,n:me.n,lv:me.lv,job:me.job,g:me.g,pid:me.pid,atk:me.atk,w:me.w,d:me.d,j:me.j,ttl:me.ttl});
  }
  if(ARENA.cv){const sp=ARENA.scn.render(performance.now());ARENA.cv.putImageData(new ImageData(new Uint8ClampedArray(sp.d.buffer.slice(0)),ARENA.W,ARENA.H),0,0);}
  paintArena(false);
  if (ARENA.serverMode && !V25().wbWindow().open && !ARENA.done) finishArena(false);
}
function finishArena(win) {
  if (ARENA.done) return;
  ARENA.done = true;
  // In a real World Boss, never show fake Realtime/BOT scores as rankings.
  const verified=ARENA.serverMode ? (Array.isArray(ARENA.server?.ranking)?ARENA.server.ranking:[]) : [];
  const all=ARENA.serverMode ? verified.map((r,i)=>({n:String(r.name||'ผู้เล่น'),d:Number(r.damage)||0,me:String(r.name)===ARENA.me.n,id:'server_'+i})) : allPlayers().slice().sort((a,b)=>b.d-a.d);
  const myRank = all.findIndex(p=>p.me)+1;
  const v = safe(() => V25().V(), null);
  const event = ARENA.ev;
  const simulated = ARENA.practice || ARENA.simulated;
  let rewardTxt = simulated ? 'โหมดซ้อม: ไม่มีรางวัลจริง'
    : !win ? 'ยังไม่ชนะหรือ HP หมด: ยังไม่ได้รับรางวัล (ตรวจรางวัลล่าสุดได้ภายหลัง)'
    : '⏳ Supabase กำลังตรวจผลบอสจริงและจ่าย Gold/แร่ (ไม่แจกคอยล์)';

  // Server HP is authoritative. No local broadcast, hit(), ranking, or bot can mint prizes.
  if (ARENA.serverMode && win && v && API()?.claim) {
    ARENA.claiming = true;
    void API().claim(event).then(result => {
      if (ARENA.api && result?.ok === true) {
        rewardTxt='✅ Supabase ยืนยันรางวัล'+(result.fragments_text ? ' · '+String(result.fragments_text) : (result.reason_text ? ' · '+String(result.reason_text) : ''));
        window.AMBER_V28S?.refreshFragments?.();
      } else if (result?.ok === true) {
        v.wb.claimed = event;
        v.wb.total = (v.wb.total | 0) + 1;
        safe(() => { V25().commit(); V25().refresh(); });
        const r = result.reward || {};
        rewardTxt = '✅ Supabase จ่าย Gold '+fmt(r.gold)+' · แร่รุ้ง ×'+fmt(r.ore_prism)+' · ไม่แจกคอยล์';
      } else if (result?.reason === 'already_claimed') {
        v.wb.claimed = event;safe(() => V25().commit());
        rewardTxt = '✅ Supabase ยืนยันว่ารับรางวัลรอบนี้แล้ว';
      } else rewardTxt = '🛡️ เซิร์ฟเวอร์ยังไม่จ่ายรางวัล: '+String(result?.reason||'ไม่ผ่านการตรวจสอบ');
      if (ARENA.ev === event && ARENA.done && $('px26RewardStatus')) $('px26RewardStatus').textContent = rewardTxt;
    }).catch(e => {
      console.error('[V27.3 boss claim]',e);
      if (ARENA.ev === event && $('px26RewardStatus')) $('px26RewardStatus').textContent='🛡️ ตรวจสอบรางวัลไม่สำเร็จ กดตรวจรางวัลล่าสุดจากเมนูกิจกรรมได้';
    }).finally(() => { ARENA.claiming = false; if (!ARENA.on) void API()?.leave?.(); });
  }
  const res = document.createElement('div'); res.className = 'px26-res';
  res.innerHTML = `<div class="box"><h2>${win ? (simulated ? '⚔️ จบการซ้อมบอส' : '🏆 ปราบบอสสำเร็จ!') : '⌛ บอสหนีไปแล้ว'}</h2><p>${esc(ARENA.boss.name)} · ผู้ร่วมรบ ${all.length} คน</p><ol id="px287WorldBossRank">${ARENA.serverMode&&!all.length?'<li>กำลังตรวจอันดับกับ Supabase...</li>':all.slice(0,10).map(p=>`<li${p.me?' class="me"':''}>${esc(p.n)} <b>${fmt(p.d)}</b></li>`).join('')}</ol><p id="px26RewardStatus">${esc(rewardTxt)}</p><button class="goldbtn" data-px26="arx">ปิด</button></div>`;
  $('px26Arena')?.appendChild(res);
  // Refresh final scores AFTER the winning hit; attack RPC may not include the ranking array.
  if(ARENA.serverMode && API()?.status){
    Promise.resolve(API().status(event)).then(s=>{
      if(ARENA.ev!==event||!s?.ok||!Array.isArray(s.ranking))return;
      ARENA.server={...(ARENA.server||{}),ranking:s.ranking};
      const target=$('px287WorldBossRank');if(!target)return;
      target.textContent='';
      for(const row of s.ranking.slice(0,10)){
        const li=document.createElement('li'),b=document.createElement('b');
        b.textContent=fmt(Number(row.damage)||0);
        li.textContent=String(row.name||'ผู้เล่น')+' ';li.appendChild(b);target.appendChild(li);
      }
    }).catch(e=>console.warn('[V287 final ranking]',e));
  }
}

/* =============================================================== delegated actions + UI */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-px26]'); if (!b) return; const a = b.dataset.px26;
  if (a === 'x') $('px26Peer')?.remove();
  else if (a === 'inv') { safe(() => AMBO.inv(b.dataset.id)); $('px26Peer')?.remove(); }
  else if (a === 'join') { if (!window.AMBER_MY_PID) { const st = ST(); emit('v26jr', { pid: b.dataset.pid, n: st.name, lv: st.lv, job: st.job }); safe(() => notify('ส่งคำขอเข้าปาร์ตี้แล้ว รอสมาชิกตอบรับ')); } $('px26Peer')?.remove(); }
  else if (a === 'pd') { mapSel = { k: b.dataset.k, map: b.dataset.map }; const d = $('px26Det'); if (d) d.innerHTML = detHTML(); }
  else if (a === 'go') { safe(() => chooseMap(b.dataset.map)); safe(() => closeModal()); }
  else if (a === 'sim') { setFake(!FAKE.on); paintWorld(); }
  else if (a === 'reqok') { if (pending) { clearTimeout(pending.t); emit('pinv', { to: pending.from, pid: window.AMBER_MY_PID }); safe(() => notify('ส่งคำเชิญตอบรับแล้ว')); pending = null; } $('px26Req')?.remove(); }
  else if (a === 'reqno') { if (pending) clearTimeout(pending.t); pending = null; $('px26Req')?.remove(); }
  else if (a === 'arx') closeArena();
  else if (a === 'atoggle') {
    const bar = $('px273Actions'), t = $('px273Toggle');
    if (!bar || !t) return;
    const folded = bar.classList.toggle('px273-collapsed');
    t.textContent = folded ? '▼ AUTO' : '▲';
    t.setAttribute('aria-expanded', String(!folded));
    t.setAttribute('aria-label', folded ? 'กางแถบ Auto' : 'พับแถบ Auto');
    t.title = folded ? 'กางแถบ Auto' : 'พับแถบ Auto';
  }
  else if (a === 'abot') { ARENA.autoBot=!ARENA.autoBot;paintVitals(); }
  else if (a === 'askill') { ARENA.autoSkill=!ARENA.autoSkill;paintVitals(); }
  else if (a === 'apot') { ARENA.autoPotion=!ARENA.autoPotion;paintVitals(); }
  else if (a === 'ahit') { if (!ARENA.done && !ARENA.autoBot) { ARENA.manual=true;arenaTick(); } }
  else if (a === 'world') openWorld();
});

const css = document.createElement('style'); css.textContent = `
#px26Crowd{position:absolute;left:4px;right:4px;top:62px;bottom:158px;display:flex;flex-wrap:wrap;align-content:flex-end;justify-content:center;gap:0 4px;z-index:2;pointer-events:none}
.px26-c{position:relative;width:64px;text-align:center;pointer-events:auto;cursor:pointer;filter:drop-shadow(0 3px 2px #000a)}.many .px26-c{width:52px}
.px26-m{position:relative;height:42px;display:flex;justify-content:center;align-items:flex-end}.px26-mi{max-height:38px;max-width:46px;object-fit:contain;image-rendering:pixelated;background:none!important;border-radius:0!important}
.px26-m i{position:absolute;left:8px;right:8px;bottom:-3px;height:4px;background:#2a0a14;border:1px solid #000;border-radius:2px;overflow:hidden}.px26-m i u{display:block;height:100%;background:linear-gradient(90deg,#d83a3a,#ff9a5a)}
.px26-dmg{position:absolute;left:50%;top:0;transform:translateX(-50%);font:800 12px system-ui;color:#fff;text-shadow:0 0 3px #000,1px 1px 0 #c00;opacity:0}.px26-dmg.pop{animation:px26up 1.2s ease-out}
@keyframes px26up{0%{opacity:1;transform:translate(-50%,10px)}100%{opacity:0;transform:translate(-50%,-22px)}}
.px26-hw{position:relative;height:50px;display:flex;justify-content:center;align-items:flex-end}.px26-h{max-height:50px;max-width:50px;width:auto!important;height:auto!important;image-rendering:pixelated;background:none!important;border-radius:0!important;position:relative;z-index:1}
.px26-aura{position:absolute;bottom:-4px;left:50%;width:120%;max-width:none!important;transform:translateX(-50%);mix-blend-mode:screen;image-rendering:pixelated;pointer-events:none;background:none!important;border-radius:0!important}
.px26-c small{display:block;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff;text-shadow:0 1px 2px #000;background:#0008;border-radius:4px;padding:0 2px}.px26-t{position:absolute;left:50%;transform:translateX(-50%);top:30px;white-space:nowrap}.px26-t .px25-title{font-size:8px;padding:0 6px}
.px26-em{position:absolute;left:50%;top:34px;width:34px;transform:translateX(-50%);image-rendering:pixelated;z-index:5;background:none!important;border-radius:0!important}
.px26-pop{position:fixed;left:50%;top:40%;transform:translateX(-50%);z-index:99995;background:#1a0e33;border:2px solid #ffd24a;border-radius:12px;padding:10px 14px;text-align:center;box-shadow:0 0 18px #000}.px26-pop .row,.px26-det .row{display:flex;gap:6px;justify-content:center;margin-top:7px;flex-wrap:wrap}
.px26-hint{color:#d9c8f8;font-size:12.5px;margin:4px 0 8px}.px26-mapcard{background:#150a28;border:1px solid #4a2c86;border-radius:10px;margin:6px 0;padding:6px 8px}.px26-mapcard.here{border-color:#ffd24a}.px26-mapcard .hd{display:flex;gap:8px;align-items:baseline}.px26-mapcard .hd b{flex:1}.px26-mapcard small{color:#bba6e6}
.px26-zones{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:5px}.px26-slot{background:#0d0820;border-radius:7px;min-height:46px;padding:2px 4px}.px26-slot em{font:10px system-ui;color:#8a7aa8;display:block;font-style:normal}.px26-slot div{display:flex;flex-wrap:wrap;gap:3px;margin-top:3px}
.px26-dot{display:inline-block;border-radius:50%}.px26-dot.party{width:26px!important;height:26px!important;min-width:0!important;border-radius:50%!important;padding:0!important;line-height:22px;text-align:center;background:var(--c);color:#1a0e33;font-weight:800;font-size:12px;border:2px solid #fff;padding:0;box-shadow:0 0 8px var(--c);animation:px26pulse 1.6s infinite}.px26-dot.solo{width:9px;height:9px;background:#aab;margin:7px 1px}.px26-dot.solo.me{background:#ffd24a;box-shadow:0 0 6px #ffd24a}@keyframes px26pulse{50%{transform:scale(1.15)}}
.px26-det{background:#1a0e33;border:1px dashed #ffd24a;border-radius:10px;padding:8px;margin-top:8px;position:sticky;bottom:0}.px26-mem span{display:inline-block;background:#2a1850;border-radius:99px;padding:1px 9px;margin:2px;font-size:12px}.px26-form{margin-top:8px}
#px26Arena{position:fixed;inset:0;z-index:99980;background:#05020c;display:flex;flex-direction:column;overflow:hidden;color:#fff}#px26Bg{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;opacity:.75;z-index:0}#px26Arena>*:not(#px26Bg){position:relative;z-index:1}
.px26-top{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:linear-gradient(#000c,#0000)}
.px26-boss{text-align:center;padding:0 12px}.px26-bn{font-weight:800;font-size:18px;text-shadow:0 2px 4px #000}.px26-bbar{position:relative;max-width:560px;height:20px;margin:4px auto;background:#2a0a14;border:2px solid #ffd24a;border-radius:10px;overflow:hidden}.px26-bbar i{position:absolute;left:0;top:0;bottom:0;width:100%;background:linear-gradient(90deg,#c01818,#ff6a2a,#ffd24a);transition:width .9s}.px26-bbar span{position:relative;font:700 11px system-ui;line-height:16px;text-shadow:0 1px 2px #000}
.px26-bimg{position:relative;height:min(34vh,260px);display:flex;justify-content:center;align-items:flex-end}.px26-bimg img{height:100%;max-width:90%;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 10px 8px #000c);background:none!important;border-radius:0!important}.px26-bimg img.hit{filter:brightness(2.2) saturate(.5) drop-shadow(0 10px 8px #000c)}
#px26Fx{position:absolute;inset:0;pointer-events:none}.px26-bd{position:absolute;bottom:30%;font:800 20px system-ui;color:#ffe9a8;text-shadow:0 0 4px #000,2px 2px 0 #b00;animation:px26bd .9s ease-out forwards}.px26-bd.crit{font-size:25px;font-weight:1000;color:#fff3b2;background:linear-gradient(130deg,#54330d,#a86d17 55%,#43260b);border:2px solid #ffe18a;border-radius:8px;padding:5px 9px;box-shadow:0 0 15px #ffd54daa,inset 0 0 8px #ffe18150;white-space:nowrap;z-index:50;text-shadow:1px 2px 2px #1d1003}@keyframes px26bd{to{transform:translateY(-90px);opacity:0}}
.px26-field{flex:1;overflow:auto;display:flex;flex-wrap:wrap;align-content:flex-end;justify-content:center;gap:8px;padding:6px 8px 4px}.px26-grp{border:1px solid color-mix(in srgb,var(--c) 70%,transparent);background:#0008;border-radius:10px;padding:2px 6px 4px}.px26-grp>b{display:block;font-size:11px;color:var(--c)}.px26-grp .rw{display:flex;gap:2px;flex-wrap:wrap;justify-content:center;max-width:calc(var(--sz)*4.2)}
.px26-ap{position:relative;width:var(--sz);text-align:center}.px26-ap .px26-h{max-height:var(--sz);max-width:var(--sz);display:block;margin:0 auto}.px26-ap small{display:block;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 2px #000}.px26-ap.me small{color:#ffd24a;font-weight:700}.px26-ap .dm{position:absolute;left:50%;top:-6px;transform:translateX(-50%);font:800 11px system-ui;font-style:normal;color:#fff;text-shadow:0 0 3px #000,1px 1px 0 #c00;opacity:0}.px26-ap .dm.pop{animation:px26up 1s ease-out}.px26-ap .px26-aura{width:150%}
.px26-ap .px26-h.atk{animation:px26atk .6s steps(2) infinite}@keyframes px26atk{50%{transform:translateY(-4px)}}
.px26-foot{display:flex;justify-content:space-between;gap:8px;padding:6px 12px;background:#000b;font-size:12px;flex-wrap:wrap}.px26-warn{color:#ff9a9a;font-size:12px}
#px273Vitals{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:5px 9px;padding:4px 8px;background:#100d24e8;font:11px system-ui}#px273Vitals>div{min-width:92px;flex:1;max-width:190px}#px273Vitals small{font-size:10px;color:#ffe2b0}.px273-meter{height:8px;background:#370d15;border:1px solid #9c4651;border-radius:8px;overflow:hidden}.px273-meter i{height:100%;display:block;width:100%;background:linear-gradient(90deg,#e1314c,#ff8a72);transition:width .3s}.px273-meter.mana{background:#081b3e;border-color:#436fc1}.px273-meter.mana i{background:linear-gradient(90deg,#3479f9,#72dbff)}
#px273Actions{display:flex;flex-wrap:wrap;justify-content:center;gap:4px;padding:5px 8px;background:#130f26}#px273Actions button{border:1px solid #a18a64;background:#30263b;color:#e2dce4;font:700 11px system-ui;border-radius:8px;padding:8px 5px;min-width:72px;flex:1}#px273Actions button.on{border-color:#94d595;color:#caffc5;background:#205035}#px273Actions button:disabled{opacity:.42}.px26-ap.me.px273-hurt{animation:px273hurt .35s ease-out}@keyframes px273hurt{50%{filter:brightness(3) saturate(.3);transform:translateX(3px)}}
.px26-res{position:absolute!important;inset:0;background:#000b;display:flex;align-items:center;justify-content:center;z-index:5}.px26-res .box{background:#1a0e33;border:2px solid #ffd24a;border-radius:14px;padding:16px;max-width:380px;width:92%;text-align:center;box-shadow:0 0 28px #ff9aff66}.px26-res ol{text-align:left;padding-left:22px;font-size:13px}.px26-res li.me{color:#ffd24a;font-weight:700}.px26-res li b{float:right}
/* V27.3.1 Compact World Boss controls, layout-only. */
#px273Actions{display:flex;flex-wrap:nowrap;align-items:stretch;justify-content:flex-end;gap:4px;padding:3px 8px;background:#130f26d8;flex:0 0 auto}
#px273Actions .px273-buttons{display:flex;flex:1 1 auto;min-width:0;gap:3px;align-items:stretch}
#px273Actions .px273-buttons button{flex:1 1 0;min-width:0;min-height:33px;border-radius:6px;padding:5px 2px;font:700 10px/1.08 system-ui,sans-serif;white-space:nowrap;box-shadow:none}
#px273Actions #px273Toggle{display:block;flex:0 0 35px;min-width:35px;min-height:33px;padding:5px 2px;font:800 11px system-ui,sans-serif;background:#2b2944;border:1px solid #e6b76a;color:#ffe7ae;border-radius:6px;touch-action:manipulation}
#px273Actions.px273-collapsed{background:transparent;padding:1px 8px 0;min-height:28px}
#px273Actions.px273-collapsed .px273-buttons{display:none}
#px273Actions.px273-collapsed #px273Toggle{flex-basis:63px;min-width:63px;min-height:27px;font-size:10px;background:#211a37dd}
@media(max-width:390px){#px273Actions .px273-buttons button{font-size:9px;min-height:31px;padding:4px 1px}#px273Actions #px273Toggle{flex-basis:33px;min-width:33px;min-height:31px}#px273Actions.px273-collapsed #px273Toggle{flex-basis:63px;min-width:63px}}

/* V27.3.3: party field is a scroll viewport, never a bottom-aligned flex-wrap.
   A separate inner stack preserves all party rows when the viewport is shorter
   than the contents. This is a layout-only patch; characters are never hidden. */
#px26Arena .px26-field{
  display:block !important;
  flex:1 1 0 !important;
  min-height:0 !important;
  min-width:0;
  overflow-y:auto !important;
  overflow-x:hidden !important;
  padding:8px 8px 16px !important;
  overscroll-behavior:contain;
  -webkit-overflow-scrolling:touch;
  touch-action:pan-y;
  scroll-padding-top:8px;
}
#px26Arena .px26-party-stack{
  display:flex;
  flex-flow:row wrap;
  align-items:flex-start;
  align-content:flex-start;
  justify-content:center;
  width:100%;
  box-sizing:border-box;
  gap:8px;
  min-height:0;
}
#px26Arena .px26-grp{align-self:flex-start;max-width:100%;box-sizing:border-box}
#px26Arena .px26-grp .rw{min-height:0;overflow:visible}
#px26Arena .px26-bimg{height:min(24dvh,200px) !important}
#px26Arena .px26-bimg img{max-height:100%;object-fit:contain}
#px26Arena .px26-top,#px26Arena .px26-boss,#px273Vitals,#px273Actions,#px26Arena .px26-foot{
  flex-shrink:0;
}
@media(max-height:700px){
  #px26Arena .px26-bimg{height:min(20dvh,150px) !important}
  #px26Arena .px26-top{padding:5px 10px}
}

#px26Hub{position:relative}
`;
document.head.appendChild(css);
function mount() {
  const nav = document.querySelector('.nav'); if (nav && !$('px26Btn')) { const b = document.createElement('button'); b.id = 'px26Btn'; b.type = 'button'; b.dataset.px26 = 'world'; b.innerHTML = '🗺️<span>ใครอยู่ไหน</span>'; nav.appendChild(b); }
}
function start() {
  if (!ST()) return setTimeout(start, 300);
  safe(() => { const o = window.AMBER_V12 && window.AMBER_V12.presenceInfo; });
  mount(); setInterval(mount, 3000);
  // V313 CBT AFK: server-side bot. UI only issues start/status/stop intents.
  (function installScreenOffAFK(){
    if(document.getElementById('amber313-afk-style'))return;
    const css=document.createElement('style');css.id='amber313-afk-style';
    css.textContent='#amber313AfkBtn{background:#183e45;color:#fff;border:1px solid #72e4cd;border-radius:9px;padding:5px 9px;font-weight:800}#amber313AfkPanel{position:fixed;z-index:99970;right:8px;bottom:12px;width:min(92vw,360px);max-height:72dvh;overflow:auto;background:#10202df5;border:2px solid #71dccd;border-radius:15px;padding:13px;color:white;box-shadow:0 8px 35px #000a;font:14px system-ui}#amber313AfkPanel button{padding:10px;border-radius:9px;border:1px solid #8ed6c9;background:#24545c;color:white;font-weight:800;margin:4px}#amber313AfkPanel button:disabled{opacity:.5}#amber313AfkPanel select{max-width:100%;padding:8px;border-radius:7px}#amber313AfkStatus{white-space:pre-wrap;font-size:13px;line-height:1.6}';
    document.head.appendChild(css);
    let panel=null,busy=false;
    const cloud=()=>window.AMBER_CLOUD;
    const api=()=>cloud()?.getClient?.();
    const online=()=>!!(cloud()?.getStatus?.()?.cloudReady && api());
    const fmt=t=>t?new Date(t).toLocaleString('th-TH'):'–';
    const render=(data)=>{
      if(!panel)return;
      const el=panel.querySelector('#amber313AfkStatus');if(!el)return;
      el.textContent=data.active?'🟢 บอทออนไลน์บน Supabase\n':'⚪ บอทหยุดแล้ว\n';
      el.textContent+='มอนสเตอร์: '+(data.monster_name||data.monster_id||'–')+'\n';
      el.textContent+='สิ้นสุด: '+fmt(data.expires_at)+'\n';
      el.textContent+='ฆ่า: '+(data.pending_kills||0)+'  EXP: '+(data.pending_exp||0)+'\n';
      el.textContent+='ทอง: '+(data.pending_gold||0)+'  ใช้สกิล: '+(data.pending_skill_uses||0)+'\n';
      el.textContent+='ยา HP/MP: '+(data.pending_hp_pots||0)+' / '+(data.pending_mp_pots||0)+'\n';
      el.textContent+='ของดรอปค้างรับ: '+(data.pending_gear||0)+' ชิ้นอุปกรณ์';
      panel.querySelector('#amber313AfkStart').disabled=busy||!!data.active;
      panel.querySelector('#amber313AfkStop').disabled=busy||!data.active&&!data.pending_kills;
    };
    const rpc=async(action,monster)=>{
      if(!online())throw Error('ต้องล็อกอินและเชื่อมต่อ Supabase ก่อน');
      const {data,error}=await api().rpc('amber_v312_afk',{p_action:action,p_monster_id:monster||null});
      if(error)throw error;
      if(!data?.ok)throw Error(data?.reason||'เซิร์ฟเวอร์ไม่ยืนยัน');
      return data;
    };
    const refresh=async()=>{try{render(await rpc('status'))}catch(e){if(panel)panel.querySelector('#amber313AfkStatus').textContent='⚠️ '+(e.message||e)}};
    const button=document.createElement('button');button.id='amber313AfkBtn';button.type='button';button.textContent='🌙 บอทปิดจอ';
    const mountButton=()=>{
      const nav=document.querySelector('.nav');
      if(nav&&!button.isConnected)nav.appendChild(button);
    };
    button.addEventListener('click',()=>{
      if(panel){panel.remove();panel=null;return}
      panel=document.createElement('div');panel.id='amber313AfkPanel';
      panel.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><strong style="font-size:18px">🌙 บอทปิดจอ · ออนไลน์ 24 ชม.</strong><button id="amber313AfkClose">✕</button></div><p>Supabase ตีมอน ใช้สกิล ใช้ยา และเก็บของต่อได้แม้ปิดหน้าจอ Android (เฉพาะมอนทั่วไป)</p><div id="amber313AfkStatus">กำลังตรวจสถานะ...</div><p>เลือกมอนจากแผนที่ปัจจุบันในเกมก่อนกดเริ่ม</p><button id="amber313AfkStart">▶ เริ่มบอท 24 ชม.</button><button id="amber313AfkStop">■ หยุดและรับรางวัล</button><button id="amber313AfkRefresh">↻ ตรวจสถานะ</button><p style="font-size:12px;opacity:.8">บอสโลก บอสแร่ ดันเจี้ยน และ PvP ไม่รองรับ AFK · อย่าโจมตีเองพร้อมกับเปิดบอท</p>';
      document.body.appendChild(panel);
      panel.querySelector('#amber313AfkClose').onclick=()=>{panel.remove();panel=null};
      panel.querySelector('#amber313AfkRefresh').onclick=refresh;
      panel.querySelector('#amber313AfkStart').onclick=async()=>{
        if(busy)return;busy=true;
        try{
          const mon=typeof state!=='undefined'?state.mob:null;
          if(!mon)throw Error('เลือกมอนสเตอร์ก่อน');
          render(await rpc('start',mon));
        }catch(e){panel?.querySelector('#amber313AfkStatus')&&(panel.querySelector('#amber313AfkStatus').textContent='⚠️ '+(e.message||e))}
        finally{busy=false}
      };
      panel.querySelector('#amber313AfkStop').onclick=async()=>{
        if(busy)return;busy=true;
        try{
          const d=await rpc('stop');render(d);
          if(d.save&&typeof state!=='undefined'){
            const auto=!!state.auto;state={...state,...d.save,auto};save();render?.();
          }
        }catch(e){panel?.querySelector('#amber313AfkStatus')&&(panel.querySelector('#amber313AfkStatus').textContent='⚠️ '+(e.message||e))}
        finally{busy=false}
      };
      void refresh();
    });
    mountButton();setInterval(mountButton,3000);
  })();
  // keep own party id readable for this module
  setInterval(() => safe(() => { window.AMBER_MY_PID = (typeof myPid !== 'undefined') ? myPid : (window.AMBER_MY_PID || null); }), 1000);
}
window.AMBER_V26 = { openArena, closeArena, openWorld, setFake, crowdList, worldData, ARENA, FAKE };
start();
})();
