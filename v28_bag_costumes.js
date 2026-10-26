/* 55 AMBERLANDS V28 — (1) bulk-sell list with item pictures  (2) 12 job costumes in the Item Shop (light / lightning / flame)
 *  Costumes are VISUAL ONLY (no stats). They are stored in state.cos28 = {owned:[ids], equipped:id} inside the game's normal save JSON.
 *  No new Supabase call, no SQL.
 */
(() => {
'use strict';
const PX = window.PX; if (!PX) return;
const $ = id => document.getElementById(id), TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos;
const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safe = (f, d) => { try { return f(); } catch (e) { return d; } };
const ST = () => safe(() => state, null), fmt = n => Math.max(0, Math.floor(Number(n) || 0)).toLocaleString('th-TH');
const ico = k => safe(() => PX.uiSkin.icon(k), '');

/* ============================================================ 1. bulk-sell rows with pictures */
const RC = ['#c8d0dc', '#5ad87a', '#5aa8ff', '#c880ff'];
function sellImages() {
  const st = ST(); if (!st) return;
  document.querySelectorAll('.amber23-bulkRow').forEach(row => {
    if (row.querySelector('.px28-sellimg')) return; const cb = row.querySelector('input[data-bulk-key]'); if (!cb) return; const key = cb.dataset.bulkKey || ''; let html = '', cls = '';
    if (key[0] === 'b') { const it = (st.bag || [])[+key.slice(1)]; if (it) html = safe(() => window.PXI ? PXI(it.id, it.icon || '🎒') : (it.icon || '🎒'), it.icon || '🎒'); }
    else if (key[0] === 'g') { const g = (st.gear || []).find(x => String(x.id) === key.slice(1)); if (g) { html = safe(() => PX.items.gearImg(g, ''), ''); cls = ' r' + (g.rar | 0); if (g.enh) html += `<em class="px28-enhb">+${g.enh | 0}</em>`; } }
    if (!html) return; const s = document.createElement('span'); s.className = 'px28-sellimg' + cls; s.innerHTML = html; s.style.setProperty('--rc', RC[safe(() => (st.gear || []).find(x => String(x.id) === key.slice(1)).rar | 0, 0)] || RC[0]);
    row.insertBefore(s, cb.nextSibling);
  });
}

/* ============================================================ 2. costumes */
const COS = [
  { id: 'sw_thunder', job: 'ดาบ', name: 'พาลาดินสายฟ้า', en: 'Thunder Paladin', price: 1800, c: ['#4aa8ff', '#e8fbff', '#ffffff'], back: 'wingsBolt', front: 'bolts', halo: 'halo', f: 'saturate(1.15) brightness(1.15) contrast(1.05) hue-rotate(8deg)' },
  { id: 'sw_inferno', job: 'ดาบ', name: 'อัศวินเพลิงนรก', en: 'Inferno Knight', price: 2200, c: ['#ff5a1a', '#ffd24a', '#ffffff'], back: 'wingsFire', front: 'flames', halo: 'crown', f: 'saturate(1.35) brightness(1.05) contrast(1.1) hue-rotate(-12deg)' },
  { id: 'sw_holy', job: 'ดาบ', name: 'ราชันย์แสงศักดิ์สิทธิ์', en: 'Radiant Lord', price: 3000, c: ['#ffd24a', '#fff6c0', '#ffffff'], back: 'wingsLight', front: 'stars', halo: 'halo', f: 'saturate(1.25) brightness(1.25) contrast(1.0) sepia(.15)' },
  { id: 'fi_dragon', job: 'หมัด', name: 'จ้าวหมัดมังกรเพลิง', en: 'Dragon Fist Master', price: 1800, c: ['#ff3a1a', '#ffb02e', '#ffffff'], back: 'dragonFire', front: 'flames', halo: 'crown', f: 'saturate(1.4) brightness(1.05) contrast(1.1) hue-rotate(-14deg)' },
  { id: 'fi_storm', job: 'หมัด', name: 'นักบุญพายุสายฟ้า', en: 'Storm Monk', price: 2200, c: ['#ffe14a', '#9ad0ff', '#ffffff'], back: 'wingsBolt', front: 'bolts', halo: 'halo', f: 'saturate(1.2) brightness(1.2) contrast(1.05) hue-rotate(10deg)' },
  { id: 'fi_void', job: 'หมัด', name: 'จอมโหดความว่างเปล่า', en: 'Void Brawler', price: 3000, c: ['#a24aff', '#ff7aff', '#ffffff'], back: 'wingsBat', front: 'stars', halo: 'crown', f: 'saturate(1.1) brightness(.92) contrast(1.2) hue-rotate(18deg)' },
  { id: 'bo_wind', job: 'ธนู', name: 'ผู้พิทักษ์วายุมรกต', en: 'Wind Ranger', price: 1800, c: ['#3aff9a', '#d8ffe8', '#ffffff'], back: 'wingsLight', front: 'stars', halo: 'halo', f: 'saturate(1.25) brightness(1.15) hue-rotate(-8deg)' },
  { id: 'bo_sun', job: 'ธนู', name: 'นักล่าสุริยะ', en: 'Sun Hunter', price: 2200, c: ['#ffb02e', '#fff0a0', '#ffffff'], back: 'sunrays', front: 'flames', halo: 'crown', f: 'saturate(1.4) brightness(1.2) sepia(.2)' },
  { id: 'bo_night', job: 'ธนู', name: 'เงามัจจุราชสายฟ้า', en: 'Night Assassin', price: 3000, c: ['#a45cff', '#4af0ff', '#ffffff'], back: 'cape', front: 'bolts', halo: 'none', f: 'saturate(1.0) brightness(.88) contrast(1.25) hue-rotate(15deg)' },
  { id: 'ma_arcane', job: 'จอมเวท', name: 'อาร์คเมจรูนมนตรา', en: 'Arcane Archmage', price: 1800, c: ['#9a4cff', '#e0b8ff', '#ffffff'], back: 'runes', front: 'stars', halo: 'halo', f: 'saturate(1.2) brightness(1.08) hue-rotate(12deg)' },
  { id: 'ma_frost', job: 'จอมเวท', name: 'จักรพรรดิน้ำแข็งแสงเหนือ', en: 'Frost Sovereign', price: 2200, c: ['#6ae0ff', '#e8fbff', '#ffffff'], back: 'wingsLight', front: 'stars', halo: 'crown', f: 'saturate(1.0) brightness(1.25) contrast(1.0) hue-rotate(-10deg)' },
  { id: 'ma_star', job: 'จอมเวท', name: 'จอมปราชญ์ดาราสายฟ้า', en: 'Starlight Sage', price: 3000, c: ['#ffd24a', '#a45cff', '#ffffff'], back: 'runes', front: 'bolts', halo: 'halo', f: 'saturate(1.35) brightness(1.2) sepia(.15)' }
];
const BYID = {}; COS.forEach(c => { BYID[c.id] = c; });
const AW = 160, AH = 176;
const hexRgb = h => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const rgba = (h, a) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`; };
function glow(g, x, y, r, col, a) { const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, rgba(col, a)); q.addColorStop(.4, rgba(col, a * .4)); q.addColorStop(1, rgba(col, 0)); g.fillStyle = q; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
function bolt(g, x0, y0, x1, y1, seed, col, w) { let s = seed * 7919 + 13; const R = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; const pts = [[x0, y0]]; for (let i = 1; i < 6; i++) { const f = i / 6; pts.push([x0 + (x1 - x0) * f + (R() - .5) * 16, y0 + (y1 - y0) * f + (R() - .5) * 16]); } pts.push([x1, y1]); g.lineJoin = 'round'; g.lineCap = 'round'; g.shadowColor = col; g.shadowBlur = 9; for (const [c, ww] of [[rgba(col, .85), w * 2.4], ['#ffffff', w * .8]]) { g.strokeStyle = c; g.lineWidth = ww; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); } g.shadowBlur = 0; }
function feather(g, ox, oy, ang, len, wid, c1, c2) { g.save(); g.translate(ox, oy); g.rotate(ang); const q = g.createLinearGradient(0, 0, len, 0); q.addColorStop(0, rgba(c1, .95)); q.addColorStop(1, rgba(c2, .5)); g.fillStyle = q; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * .5, -wid, len, 0); g.quadraticCurveTo(len * .5, wid * .6, 0, 0); g.fill(); g.strokeStyle = rgba('#ffffff', .55); g.lineWidth = 1; g.beginPath(); g.moveTo(0, 0); g.lineTo(len * .92, 0); g.stroke(); g.restore(); }
const W = {
  wingsLight(g, t, C) { const fl = sin(t * TAU) * .13; for (const d of [-1, 1]) { const ox = AW / 2 + d * 10, oy = AH * .36; for (let i = 0; i < 6; i++) { const a = -.95 + i * .26 + fl; feather(g, ox, oy, d < 0 ? Math.PI - a : a, 70 - i * 3 + (i === 0 ? 8 : 0), 11, C[0], C[1]); } } glow(g, AW / 2, AH * .42, 60, C[0], .25); },
  wingsFire(g, t, C) { const fl = sin(t * TAU) * .14; for (const d of [-1, 1]) { const ox = AW / 2 + d * 10, oy = AH * .38; for (let i = 0; i < 5; i++) { const a = -.95 + i * .3 + fl; feather(g, ox, oy, d < 0 ? Math.PI - a : a, 76 - i * 5, 12, C[0], C[1]); } for (let i = 0; i < 5; i++) { const fx = ox + d * (22 + i * 14), fy = oy - 30 + i * 6; for (const [cc, k] of [[C[0], 1], [C[1], .62], ['#ffffff', .3]]) { g.fillStyle = rgba(cc, .8); g.beginPath(); g.moveTo(fx - 6 * k, fy + 10); g.quadraticCurveTo(fx - 6 * k, fy - 8 * k, fx + sin(t * TAU * 2 + i) * 4, fy - 24 * k - 6); g.quadraticCurveTo(fx + 6 * k, fy - 8 * k, fx + 6 * k, fy + 10); g.fill(); } } } glow(g, AW / 2, AH * .5, 65, C[0], .3); },
  wingsBolt(g, t, C, st, f) { const fl = sin(t * TAU) * .1; for (const d of [-1, 1]) { const ox = AW / 2 + d * 10, oy = AH * .38; g.fillStyle = rgba(C[0], .55); g.beginPath(); g.moveTo(ox, oy); for (let i = 0; i < 6; i++) { const a = -1.1 + i * .3 + fl, r = i % 2 ? 62 : 78; g.lineTo(ox + d * cos(a) * r, oy + sin(a) * r); } g.lineTo(ox, oy + 30); g.closePath(); g.fill(); g.strokeStyle = rgba(C[1], .9); g.lineWidth = 2; g.stroke(); bolt(g, ox, oy, ox + d * (50 + (f % 3) * 10), oy - 28 + (f % 2) * 30, f * 3 + (d > 0 ? 1 : 2), C[0], 1.3); } glow(g, AW / 2, AH * .5, 60, C[0], .25); },
  wingsBat(g, t, C) { const fl = sin(t * TAU) * .12; for (const d of [-1, 1]) { const ox = AW / 2 + d * 8, oy = AH * .38; const q = g.createLinearGradient(ox, oy, ox + d * 80, oy); q.addColorStop(0, rgba(C[0], .95)); q.addColorStop(1, rgba(C[1], .35)); g.fillStyle = q; g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + d * 40, oy - 54 - fl * 60); g.lineTo(ox + d * 58, oy - 20); g.lineTo(ox + d * 78, oy - 34 - fl * 40); g.lineTo(ox + d * 66, oy + 10); g.lineTo(ox + d * 50, oy + 8); g.lineTo(ox + d * 52, oy + 34); g.lineTo(ox + d * 30, oy + 18); g.lineTo(ox + d * 14, oy + 30); g.closePath(); g.fill(); g.strokeStyle = rgba(C[1], .9); g.lineWidth = 1.5; g.stroke(); } glow(g, AW / 2, AH * .5, 58, C[0], .25); },
  dragonFire(g, t, C) { const fl = sin(t * TAU); for (const d of [-1, 1]) { const ox = AW / 2 + d * 14, oy = AH * .4; g.strokeStyle = rgba(C[0], .9); g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(ox, oy + 20); g.bezierCurveTo(ox + d * 40, oy + 10 + fl * 4, ox + d * 50, oy - 40, ox + d * 24, oy - 64 + fl * 4); g.stroke(); g.strokeStyle = rgba(C[1], .9); g.lineWidth = 3; g.stroke(); glow(g, ox + d * 24, oy - 64 + fl * 4, 22, C[1], .9); } for (let i = 0; i < 7; i++) { const x = AW * (.2 + i * .1), h = 26 + (i % 3) * 8; for (const [cc, k] of [[C[0], 1], [C[1], .6], ['#ffffff', .3]]) { g.fillStyle = rgba(cc, .8); g.beginPath(); g.moveTo(x - 7 * k, AH * .94); g.quadraticCurveTo(x - 7 * k, AH * .94 - h * k * .6, x + sin(t * TAU * 2 + i) * 4, AH * .94 - h * k); g.quadraticCurveTo(x + 7 * k, AH * .94 - h * k * .6, x + 7 * k, AH * .94); g.fill(); } } glow(g, AW / 2, AH * .5, 62, C[0], .3); },
  sunrays(g, t, C) { for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + t * TAU * .25, w = .06 + .02 * sin(t * TAU * 2 + i); g.fillStyle = rgba(i % 2 ? C[1] : C[0], .5); g.beginPath(); g.moveTo(AW / 2 + cos(a - w) * 22, AH * .42 + sin(a - w) * 22); g.lineTo(AW / 2 + cos(a) * 82, AH * .42 + sin(a) * 82); g.lineTo(AW / 2 + cos(a + w) * 22, AH * .42 + sin(a + w) * 22); g.fill(); } glow(g, AW / 2, AH * .42, 56, C[1], .45); },
  cape(g, t, C) { const w = sin(t * TAU) * 6; const q = g.createLinearGradient(0, AH * .3, 0, AH); q.addColorStop(0, rgba(C[0], .95)); q.addColorStop(1, rgba(C[0], .15)); g.fillStyle = q; g.beginPath(); g.moveTo(AW / 2 - 18, AH * .32); g.quadraticCurveTo(AW / 2 - 62 - w, AH * .6, AW / 2 - 50 + w, AH * .97); g.lineTo(AW / 2 + 50 - w, AH * .97); g.quadraticCurveTo(AW / 2 + 62 + w, AH * .6, AW / 2 + 18, AH * .32); g.closePath(); g.fill(); g.strokeStyle = rgba(C[1], .8); g.lineWidth = 2; g.stroke(); glow(g, AW / 2, AH * .55, 60, C[1], .2); },
  runes(g, t, C) { const cy = AH * .93; for (const [r, w, c] of [[60, 4, C[0]], [42, 2.5, C[1]]]) { g.save(); g.translate(AW / 2, cy); g.scale(1, .3); g.strokeStyle = rgba(c, .95); g.lineWidth = w; g.shadowColor = c; g.shadowBlur = 8; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); g.restore(); } g.shadowBlur = 0; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t * TAU, x = AW / 2 + cos(a) * 60, y = cy + sin(a) * 18; g.strokeStyle = rgba('#ffffff', .9); g.lineWidth = 2; g.beginPath(); g.moveTo(x - 4, y + 4); g.lineTo(x, y - 5); g.lineTo(x + 4, y + 4); g.stroke(); } const q = g.createLinearGradient(0, cy, 0, AH * .1); q.addColorStop(0, rgba(C[0], .5)); q.addColorStop(1, rgba(C[0], 0)); g.fillStyle = q; g.fillRect(AW / 2 - 40, AH * .1, 80, cy - AH * .1); glow(g, AW / 2, AH * .5, 58, C[0], .22); }
};
const F = {
  halo(g, t, C) { const y = AH * .08 + sin(t * TAU) * 1.5; g.save(); g.translate(AW / 2, y); g.scale(1, .32); g.strokeStyle = rgba(C[1], .95); g.lineWidth = 6; g.shadowColor = C[0]; g.shadowBlur = 14; g.beginPath(); g.arc(0, 0, 24, 0, TAU); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); g.restore(); g.shadowBlur = 0; glow(g, AW / 2 + cos(t * TAU) * 24, y + sin(t * TAU) * 8, 8, '#ffffff', .9); },
  crown(g, t, C) { const y = AH * .1 + sin(t * TAU) * 1.2; g.fillStyle = rgba(C[1], .95); g.shadowColor = C[0]; g.shadowBlur = 12; g.beginPath(); g.moveTo(AW / 2 - 20, y + 12); g.lineTo(AW / 2 - 22, y - 6); g.lineTo(AW / 2 - 10, y + 3); g.lineTo(AW / 2, y - 12); g.lineTo(AW / 2 + 10, y + 3); g.lineTo(AW / 2 + 22, y - 6); g.lineTo(AW / 2 + 20, y + 12); g.closePath(); g.fill(); g.shadowBlur = 0; glow(g, AW / 2, y - 12, 10, '#ffffff', .9); },
  bolts(g, t, C, f) { for (let b = 0; b < 4; b++) { if ((f + b) % 3 === 0) continue; const a = ((f * 1.3 + b * 1.6) % TAU), r0 = 20, r1 = 52 + (b % 2) * 16; bolt(g, AW / 2 + cos(a) * r0, AH * .5 + sin(a) * r0 * 1.3, AW / 2 + cos(a) * r1, AH * .5 + sin(a) * r1 * 1.3, f * 11 + b, C[0], 1.2); } glow(g, AW / 2, AH * .5, 50, C[0], .15 + .1 * sin(t * TAU * 2)); },
  flames(g, t, C) { for (let i = 0; i < 6; i++) { const x = AW * (.22 + i * .112), y = AH * (.55 + (i % 2) * .3), h = 30 + (i % 3) * 8; for (const [cc, k] of [[C[0], 1], [C[1], .62], ['#ffffff', .3]]) { g.fillStyle = rgba(cc, .78); g.beginPath(); g.moveTo(x - 6 * k, y); g.quadraticCurveTo(x - 6 * k, y - h * k * .5, x + sin(t * TAU * 2 + i) * 4, y - h * k); g.quadraticCurveTo(x + 6 * k, y - h * k * .5, x + 6 * k, y); g.fill(); } } },
  stars(g, t, C) { for (let i = 0; i < 14; i++) { const ph = (t + i / 14) % 1, a = i * 2.4, x = AW / 2 + cos(a + t * TAU) * (26 + (i % 4) * 14), y = AH * (.18 + ((i * .137) % .7)) - ph * 10, tw = sin((ph) * Math.PI), s = 2 + tw * 3; g.fillStyle = rgba(i % 2 ? C[1] : '#ffffff', tw); g.fillRect(x - s / 2, y - .5, s, 1); g.fillRect(x - .5, y - s / 2, 1, s); glow(g, x, y, 5, C[0], tw * .7); } },
  none() { }
};
const sheetC = {};
function sheet(c, layer) {
  const key = c.id + layer; if (sheetC[key]) return sheetC[key];
  const cv = document.createElement('canvas'); cv.width = AW * 8; cv.height = AH; const g = cv.getContext('2d');
  for (let f = 0; f < 8; f++) { g.save(); g.translate(f * AW, 0); g.beginPath(); g.rect(0, 0, AW, AH); g.clip(); g.globalCompositeOperation = 'lighter'; const t = f / 8;
    if (layer === 'back') safe(() => W[c.back](g, t, c.c, c, f)); else { safe(() => F[c.front](g, t, c.c, f)); if (c.halo !== 'none') safe(() => F[c.halo](g, t, c.c, f)); } g.restore(); }
  return sheetC[key] = cv.toDataURL('image/png');
}
function previewURL(c) {
  const key = 'pv' + c.id; if (sheetC[key]) return sheetC[key]; const cv = document.createElement('canvas'); cv.width = AW; cv.height = AH; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  const grad = g.createLinearGradient(0, 0, 0, AH); grad.addColorStop(0, '#0e1634'); grad.addColorStop(1, '#05081a'); g.fillStyle = grad; g.fillRect(0, 0, AW, AH);
  return new Promise(res => {
    const bk = new Image(), fr = new Image(); let n = 0; const done = () => { if (++n < 2) return;
      g.drawImage(bk, 0, 0, AW, AH, 0, 0, AW, AH);
      safe(() => { const spr = PX.hero.frames(c.job, 'male', null).idle[0], t = spr.toCanvas(1), sc = Math.min(AW * .7 / t.width, AH * .86 / t.height) * 1; const hs = document.createElement('canvas'); hs.width = t.width; hs.height = t.height; const hg = hs.getContext('2d'); hg.filter = c.f; hg.drawImage(t, 0, 0); const w = t.width * sc, h = t.height * sc; g.imageSmoothingEnabled = false; g.drawImage(hs, (AW - w) / 2, AH - h - 2, w, h); });
      g.drawImage(fr, 0, 0, AW, AH, 0, 0, AW, AH); sheetC[key] = cv.toDataURL(); res(sheetC[key]); };
    bk.onload = fr.onload = done; bk.src = sheet(c, 'back'); fr.src = sheet(c, 'front');
  });
}
/* ---- state ---- */
function cs() { const st = ST(); if (!st) return null; if (!st.cos28 || typeof st.cos28 !== 'object') st.cos28 = { owned: [], equipped: '' }; if (!Array.isArray(st.cos28.owned)) st.cos28.owned = []; return st.cos28; }
const jobOK = c => { const st = ST(); return !!st && safe(() => PX.hero.jobOf(st.job), '') === c.job; };
async function serverCosmetic(action,id) {
  const client = window.AMBER_CLOUD?.getClient?.();
  if (!window.AMBER_CLOUD?.getStatus?.()?.cloudReady || !client) { notify('กรุณาเข้าสู่ระบบออนไลน์ก่อน'); return false; }
  try {
    const {data,error} = await client.rpc('amber_v302_costume',{p_action:action,p_id:id||null});
    if (error) throw error;
    if (!data?.ok || !data?.save) throw Error(data?.reason || 'SERVER_NOT_CONFIRMED');
    Object.assign(state,data.save); // server-proven save, NOT a client-side grant
    if (typeof renderTop==='function') renderTop();
    if (typeof renderScene==='function') renderScene();
    if (typeof render==='function') render();
    return true;
  } catch(e) { notify('⚠️ Supabase ไม่ยืนยันชุด: '+String(e.message||e).slice(0,95)); return false; }
}
async function buy(id) {
  const c=BYID[id],st=ST(); if(!c||!st) return;
  if(!confirm('ใช้ '+fmt(c.price)+' คอยล์ซื้อชุด "'+c.name+'" ?'))return;
  if(await serverCosmetic('buy',id)) {notify('✅ ซื้อชุด '+c.name+' สำเร็จ');render();}
}
async function wear(id) {
  const c=BYID[id];if(!c||!jobOK(c))return;
  if(await serverCosmetic('wear',id)) {notify('✨ สวมชุด '+c.name);render();}
}
async function strip() {if(await serverCosmetic('strip',null))render();}
let sec = null;
function render() { if (!sec || !sec.isConnected) return; const S = cs(), st = ST(); if (!S) return; sec.innerHTML = `<h3>👘 ชุดคอสตูมอาชีพ (แสง · สายฟ้า · เปลวเพลิง)</h3><p class="hint">ชุดเป็นเอฟเฟกต์ความสวยงามถาวร ไม่เพิ่มสเตตัส · ใส่ได้ตามอาชีพของคุณ (${esc(st.job)})${S.equipped ? ' · กำลังสวม: <b>' + esc(BYID[S.equipped] ? BYID[S.equipped].name : '') + '</b>' : ''}</p><div class="px28-cgrid">${COS.map(c => { const own = S.owned.includes(c.id), eq = S.equipped === c.id, ok = jobOK(c); return `<div class="px28-cc${eq ? ' eq' : ''}${ok ? '' : ' dim'}" style="--c:${c.c[0]}"><img data-pv="${c.id}" alt="" width="96" height="106"><b>${esc(c.name)}</b><small>${esc(c.en)} · ${esc(c.job)}</small>${own ? (eq ? `<button data-cos="strip">ถอดชุด</button>` : `<button class="goldbtn" data-cos="wear" data-id="${c.id}">สวมใส่</button>`) : `<button data-cos="buy" data-id="${c.id}"><img class="pxe" src="${ico('gem')}" alt=""> ${fmt(c.price)}</button>`}</div>`; }).join('')}</div>`; sec.querySelectorAll('img[data-pv]').forEach(im => { Promise.resolve(previewURL(BYID[im.dataset.pv])).then(u => { im.src = u; }); }); }
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-cos]'); if (!b) return; e.preventDefault(); const a = b.dataset.cos; if (a === 'buy') buy(b.dataset.id); else if (a === 'wear') wear(b.dataset.id); else if (a === 'strip') strip(); });
function injectShop() { const host = $('amber20ShopProducts'); if (!host) return; if (host.parentNode.querySelector('#px28Cos')) { sec = host.parentNode.querySelector('#px28Cos'); return; } sec = document.createElement('section'); sec.id = 'px28Cos'; sec.className = 'px28-cos'; host.insertAdjacentElement('afterend', sec); render(); }
/* ---- apply to hero sprite (own character only) ---- */
function applyCostume() {
  const S = cs(), els = document.querySelectorAll('#sprites .sprite'); const el = els[0]; if (!el) return; const c = S && BYID[S.equipped];
  const bk = el.querySelector(':scope > .px28-cos-b'), fr = el.querySelector(':scope > .px28-cos-f'), img = el.querySelector(':scope > img.px24-hero, :scope > img.amber20-characterBody');
  if (!c || !jobOK(c)) { bk && bk.remove(); fr && fr.remove(); if (img) { img.classList.remove('px28-costumed'); img.style.removeProperty('--px28-f'); } return; }
  const mk = (cls, layer) => { const e = document.createElement('i'); e.className = cls; e.setAttribute('aria-hidden', 'true'); e.style.backgroundImage = `url(${sheet(c, layer)})`; e.dataset.id = c.id; el.appendChild(e); };
  if (!bk || bk.dataset.id !== c.id) { bk && bk.remove(); mk('px28-cos-b', 'back'); }
  if (!fr || fr.dataset.id !== c.id) { fr && fr.remove(); mk('px28-cos-f', 'front'); }
  if (img) { img.classList.add('px28-costumed'); img.style.setProperty('--px28-f', c.f); }
}
const css = document.createElement('style'); css.id = 'px28-bag-css'; css.textContent = `
.px28-sellimg{position:relative;flex:0 0 46px!important;width:46px!important;min-width:46px!important;max-width:46px!important;height:46px!important;display:flex;align-items:center;justify-content:center;background:#0b1224;border:3px solid var(--rc,#c8d0dc);box-shadow:0 0 0 2px #0b0614,inset 0 0 8px #0008}.px28-sellimg img{max-width:40px;max-height:40px;image-rendering:pixelated}.px28-sellimg .px24-boss{filter:drop-shadow(0 0 4px #ffd24a)}
.px28-enhb{position:absolute;right:-3px;bottom:-3px;font:800 10px system-ui;background:#a45cff;color:#fff;padding:0 3px;border:1px solid #0b0614;font-style:normal}
.amber23-bulkRow{align-items:center!important}
.px28-cos{margin-top:12px}.px28-cgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.px28-cc{display:flex;flex-direction:column;align-items:center;gap:3px;text-align:center;padding:8px 6px;background:linear-gradient(#17254a,#0a1130);box-shadow:inset 0 0 0 2px var(--c),inset 0 0 14px color-mix(in srgb,var(--c) 40%,transparent),0 0 0 2px #0b0614}
.px28-cc.eq{box-shadow:inset 0 0 0 3px #ffd24a,0 0 14px #ffd24a99,0 0 0 2px #0b0614}.px28-cc.dim{opacity:.62}
.px28-cc>img[data-pv]{width:96px;height:106px;object-fit:contain;image-rendering:pixelated;background:#050818;box-shadow:0 0 0 2px #0b0614}.px28-cc b{font-size:12px;color:#ffe9a8}.px28-cc small{font-size:10px;color:#9fb0d0}.px28-cc button{width:100%;min-height:34px}
#sprites .sprite>.px28-cos-b,#sprites .sprite>.px28-cos-f{position:absolute;left:-30%;right:-30%;top:-14%;bottom:-6%;pointer-events:none;background-size:800% 100%;background-repeat:no-repeat;animation:px28enh .9s steps(8) infinite}
#sprites .sprite>.px28-cos-b{z-index:1}#sprites .sprite>.px28-cos-f{z-index:4;mix-blend-mode:screen;opacity:.75}
#sprites .sprite>img.px24-hero.px28-costumed{position:relative;z-index:5;filter:var(--px28-f) drop-shadow(0 0 3px #fff6)!important}
`; document.head.appendChild(css);
setInterval(() => { if (document.hidden) return; safe(sellImages); safe(injectShop); safe(applyCostume); }, 450);
window.AMBER_V28 = Object.assign(window.AMBER_V28 || {}, { costumes: COS });
})();
