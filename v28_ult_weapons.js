/* 55 AMBERLANDS V28 — ULTIMATE WORLD-BOSS WEAPONS (4 lines) + lightning + titles
 *  The 4 rarest weapons in the game. Obtained ONLY by exchanging 30 fragments of EACH of the 10 world bosses
 *  (server-side exchange, see SUPABASE_V28_SPEC_FOR_GPT.md). This file only DRAWS and DESCRIBES them.
 *  CLIENT ONLY: no Supabase call here, no local grant path.
 */
(() => {
'use strict';
const PX = window.PX; if (!PX || !PX.weapon) return;
const W = PX.weapon;
const poly = (pts, c, post) => ({ t: 'poly', pts, c, post });
const ell = (cx, cy, rx, ry, c, post) => ({ t: 'ell', cx, cy, rx, ry, c, post });
const line = (x0, y0, x1, y1, c, th = 1, post) => ({ t: 'line', x0, y0, x1, y1, c, th, post });
const cap = (x0, y0, x1, y1, r0, r1, c, post) => ({ t: 'cap', x0, y0, x1, y1, r0, r1, c, post });
const rect = (x, y, w, h, c, post) => poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], c, post);
const mir = ops => ops.map(o => { const m = { ...o }; if (o.pts) m.pts = o.pts.map(p => [-p[0], p[1]]); if (o.cx != null) m.cx = -o.cx; if (o.x0 != null) { m.x0 = -o.x0; m.x1 = -o.x1; } return m; });
const C = { gold: '#ffd24a', gold2: '#fff1a0', goldD: '#a86a12', vio: '#2a1458', vio2: '#5a2ec8', cy: '#4ae8ff', cy2: '#e8fdff', wh: '#ffffff', navy: '#120a34' };

/* ------- the four weapons (grip at 0,0, tip toward -y) ------- */
function sword() {
  const o = [], L = 40, w = 5.2;
  o.push(poly([[-w, -4], [w, -4], [w + 1.5, -L + 12], [0, -L], [-w - 1.5, -L + 12]], C.vio2));
  o.push(poly([[-w + 1.6, -5], [w - 1.6, -5], [w - .6, -L + 13], [0, -L + 3], [-w + .6, -L + 13]], C.cy));
  o.push(poly([[-1.1, -5], [1.1, -5], [1.1, -L + 7], [0, -L + 4], [-1.1, -L + 7]], C.cy2));
  for (let i = 0; i < 5; i++) { const y = -9 - i * 5.4; o.push(poly([[w + 1, y], [w + 4.2, y - 2.4], [w + .8, y - 4.4]], C.gold), poly([[-w - 1, y - 1.6], [-w - 4.2, y - 4], [-w - .8, y - 6]], C.gold)); }
  const wing = [poly([[0, -4], [11, -10], [20, -17], [17, -8], [24, -10], [16, -1], [20, 4], [9, 0], [0, 1]], C.gold), poly([[0, -3], [10, -8], [16, -12], [13, -5], [8, -2]], C.gold2, true), poly([[7, -2], [17, -6], [13, 1]], C.goldD)];
  o.push(...wing, ...mir(wing));
  o.push(ell(0, -2.4, 3.4, 3.4, C.vio), ell(0, -2.4, 2.2, 2.2, C.cy), ell(-.7, -3.2, .8, .8, C.wh, true));
  o.push(rect(-1.5, -.6, 3, 10.5, C.vio), line(-1.2, 2, 1.2, 3, C.gold, 1, true), line(-1.2, 5, 1.2, 6, C.gold, 1, true), line(-1.2, 8, 1.2, 9, C.gold, 1, true));
  o.push(ell(0, 10.6, 2.8, 2.6, C.gold), ell(0, 10.6, 1.4, 1.4, C.cy), ell(-.6, 9.8, .6, .6, C.wh, true));
  return { ops: o, len: L };
}
function claw() {
  const o = [];
  o.push(rect(-6, -1.5, 12, 6, C.vio2)); for (let i = 0; i < 4; i++) { const x = -4.5 + i * 3; o.push(ell(x, -3.6, 1.8, 2.7, C.vio), ell(x, -5.8, 1.5, 1.2, C.gold)); }
  o.push(ell(-6.2, -.2, 1.7, 3, C.vio2));
  for (let i = 0; i < 4; i++) { const x = -4.5 + i * 3, ext = 20 + (i === 1 || i === 2 ? 8 : 0); o.push(poly([[x - 1.5, -6], [x + 1.5, -6], [x + .6, -6 - ext], [x - .5, -6 - ext]], C.vio2), poly([[x - .5, -7], [x + .5, -7], [x + .2, -5 - ext * .9], [x - .2, -5 - ext * .9]], C.cy)); }
  const wing = [poly([[6, -1], [13, -10], [22, -16], [18, -7], [25, -6], [15, 0], [18, 6], [8, 3]], C.gold), poly([[7, -2], [14, -9], [18, -11], [13, -4]], C.gold2, true)];
  o.push(...wing, ...mir(wing));
  o.push(poly([[-2.4, -6], [0, -28], [2.4, -6]], C.cy2));
  o.push(ell(0, 1.4, 2.6, 2.6, C.cy), ell(-.7, .6, .8, .8, C.wh, true), rect(-5, 3.9, 10, 4, C.vio), line(-4.5, 5.9, 4.5, 5.9, C.gold, 1, true));
  return { ops: o, len: 30, mid: -3 };
}
function bow() {
  const o = [], H = 30, bulge = 9;
  for (let i = 0; i < 16; i++) { const a0 = -H + 2 * H * i / 16, a1 = -H + 2 * H * (i + 1) / 16, x0 = bulge * Math.cos(a0 / H * Math.PI / 2) - bulge * .1, x1 = bulge * Math.cos(a1 / H * Math.PI / 2) - bulge * .1, r = 3.4 * (1 - Math.abs(a0 / H) * .4); o.push(cap(x0, a0, x1, a1, r, r * .9, i % 2 ? C.vio2 : C.vio)); o.push(cap(x0, a0, x1, a1, r * .35, r * .3, C.cy, true)); }
  const tipX = -bulge * .1;
  for (const s of [-1, 1]) { o.push(poly([[tipX - 2, s * H], [tipX + 3, s * (H + 10)], [tipX + 6, s * (H - 2)]], C.gold), poly([[tipX, s * H], [tipX + 3, s * (H + 6)], [tipX + 4, s * H]], C.gold2, true)); }
  const wg = [poly([[2, -3], [12, -8], [20, -15], [16, -6], [22, -4], [12, 1], [4, 0]], C.gold), poly([[4, -3], [12, -7], [15, -9], [10, -3]], C.gold2, true)];
  o.push(...wg, ...wg.map(m => ({ ...m, pts: m.pts.map(q => [q[0], -q[1]]) })));
  o.push(rect(-2.2, -4, 4.4, 8, C.vio), ell(.5, 0, 3, 3, C.cy), ell(-.2, -.8, .9, .9, C.wh, true), line(-2, -1.4, 2, -1.4, C.gold, 1, true), line(-2, 1.6, 2, 1.6, C.gold, 1, true));
  return { ops: o, len: H, string: { x: tipX - .2, y0: -H, y1: H, c: '#e8fdff' }, H, bulge };
}
function staff() {
  const o = [], L = 44;
  o.push(cap(0, 13, 0, -L + 6, 1.9, 2, C.vio), line(-.5, 13, -.5, -L + 8, C.vio2, 1, true));
  o.push(rect(-2.4, -.8, 4.8, 2.6, C.gold), rect(-2, 5, 4, 1.6, C.gold), rect(-2, 9, 4, 1.4, C.gold), ell(0, 13.4, 2.4, 2.2, C.cy));
  const hy = -L + 4;
  const wing = [poly([[0, hy + 6], [9, hy - 2], [19, hy - 10], [16, hy], [23, hy + 2], [14, hy + 7], [8, hy + 12], [0, hy + 11]], C.gold), poly([[1, hy + 5], [9, hy - 1], [15, hy - 6], [11, hy + 1]], C.gold2, true)];
  o.push(...wing, ...mir(wing));
  o.push(poly([[-5, hy + 8], [-3, hy - 8], [-1, hy + 4]], C.vio2), poly([[5, hy + 8], [3, hy - 8], [1, hy + 4]], C.vio2));
  o.push(poly([[0, hy - 15], [5, hy - 4], [0, hy + 7], [-5, hy - 4]], C.cy), poly([[0, hy - 13], [2, hy - 5], [0, hy + 1], [-2, hy - 5]], C.cy2, true));
  o.push(ell(0, hy - 4, 7.5, 7.5, '#9ff3ff', true));
  return { ops: o, len: L };
}
const SHAPES = { 'ดาบ': sword, 'หมัด': claw, 'ธนู': bow, 'จอมเวท': staff };
const memo = new Map();
function build(spec) { const k = spec.cls; let v = memo.get(k); if (!v) { v = (SHAPES[k] || sword)(); memo.set(k, v); } return v; }

/* ------- 4 weapon definitions (names are what the SERVER writes into the gear row; keep them identical) ------- */
const DEFS = {
  'ดาบ':    { id: 'ult_sword', name: '⚡ ดาบจักรพรรดิอสุนีบาต [ตำนานบอสโลก]', short: 'ดาบจักรพรรดิอสุนีบาต', en: 'Imperial Stormblade', job: 'นักดาบ', stat: 'STR', title: 'จักรพรรดิดาบสายฟ้า' },
  'หมัด':   { id: 'ult_fist', name: '⚡ กรงเล็บมังกรฟ้าผ่า [ตำนานบอสโลก]', short: 'กรงเล็บมังกรฟ้าผ่า', en: 'Thunderdrake Claws', job: 'นักสู้หมัด', stat: 'STR', title: 'ราชันกรงเล็บอัสนี' },
  'ธนู':    { id: 'ult_bow', name: '⚡ ธนูวชิระพิฆาตสวรรค์ [ตำนานบอสโลก]', short: 'ธนูวชิระพิฆาตสวรรค์', en: 'Vajra Skybreaker', job: 'นักธนู', stat: 'DEX', title: 'เทพพรานวชิระ' },
  'จอมเวท': { id: 'ult_staff', name: '⚡ คทาเทพีอัสนีพิภพ [ตำนานบอสโลก]', short: 'คทาเทพีอัสนีพิภพ', en: 'Tempest Goddess Staff', job: 'จอมเวท', stat: 'INT', title: 'จอมเวทอัสนีนิรันดร์' }
};
const RE = /ตำนานบอสโลก/;
const isUlt = g => !!g && RE.test(String(g.name || g.w || '')) && (/^ult_(?:sword|fist|bow|staff)_/.test(String(g.id || '')) || !g.id); // V3014 reject legacy/test gear mislabeled ult

/* weaponSpec: ult weapons get {ult:1, tier:3, theme:'ult'} */
const ws0 = PX.weaponSpec;
PX.weaponSpec = function (g) {
  const s = ws0 ? ws0(g) : null;
  if (s && isUlt(g)) { s.ult = 1; s.tier = 3; s.theme = 'ult'; }
  return s;
};
PX.ultWeapons = { build, DEFS, isUlt, C, SHAPES };

/* ------- lightning drawn on the weapon in-hand / in icons (called from PX.weapon.fx for theme 'ult') ------- */
PX.ultWeapons.fx = function (dst, spec, x, y, ang, t, sc) {
  // V30.2: no lightning from exchanging a +0 weapon. Only a real +10 gets weapon bolts.
  if (Math.max(0, Number(spec?.enh || 0)) < 10) return;
  const b = build(spec), a = ang * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), L = b.len || 30;
  const at = (lx, ly) => [x + (lx * ca - ly * sa) * sc, y + (lx * sa + ly * ca) * sc];
  const r = PX.rng ? PX.rng(PX.hash('ult') + Math.floor(t * 10)) : Math.random;
  for (let i = 0; i < 3; i++) { const p0 = at((r() - .5) * 4, -r() * L), p1 = at((r() - .5) * 18, -r() * L * 1.1); dst.line(p0[0], p0[1], p1[0], p1[1], i ? C.cy2 : C.cy, 1); }
  for (let i = 0; i < 5; i++) { const p = at((r() - .5) * 8, -r() * L); dst.px(p[0], p[1], r() > .5 ? C.wh : C.gold2); }
};

/* ------- smooth +10 mega lightning aura for the BATTLE HUD (replaces the normal +10 aura for ult weapons) ------- */
function lightningSheet(cls) {
  const AW = 160, AH = 176, N = 8, cv = document.createElement('canvas'); cv.width = AW * N; cv.height = AH; const g = cv.getContext('2d');
  const rn = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  for (let f = 0; f < N; f++) {
    g.save(); g.translate(f * AW, 0); g.globalCompositeOperation = 'lighter';
    const cx = AW / 2, cy = AH / 2 + 6, ph = f / N * Math.PI * 2;
    const rg = g.createRadialGradient(cx, cy, 6, cx, cy, 80); rg.addColorStop(0, 'rgba(255,255,255,.55)'); rg.addColorStop(.35, 'rgba(74,232,255,.35)'); rg.addColorStop(.7, 'rgba(120,70,255,.22)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(0, 0, AW, AH);
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (let k = 0; k < 9; k++) {                       // big forked bolts radiating from the centre
      const an = k / 9 * Math.PI * 2 + (f % 2) * .18 + rn(k + f * 7) * .25, len = 56 + rn(k * 3 + f) * 26;
      let px = cx, py = cy; g.beginPath(); g.moveTo(px, py);
      const pts = [[px, py]];
      for (let s = 1; s <= 6; s++) { const d = len * s / 6, j = (rn(k * 11 + s * 5 + f * 13) - .5) * 20; px = cx + Math.cos(an) * d + Math.cos(an + 1.57) * j; py = cy + Math.sin(an) * d * .92 + Math.sin(an + 1.57) * j; g.lineTo(px, py); pts.push([px, py]); }
      g.strokeStyle = 'rgba(80,140,255,.45)'; g.lineWidth = 7; g.stroke();
      g.strokeStyle = 'rgba(74,232,255,.85)'; g.lineWidth = 3; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.98)'; g.lineWidth = 1.2; g.stroke();
      if (k % 3 === 0) { const m = pts[3]; g.beginPath(); g.moveTo(m[0], m[1]); g.lineTo(m[0] + Math.cos(an + .8) * 22, m[1] + Math.sin(an + .8) * 22); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.4; g.stroke(); }
    }
    for (let k = 0; k < 14; k++) { const a2 = ph + k * .45, rr = 40 + rn(k + f) * 34; g.fillStyle = k % 2 ? 'rgba(255,241,160,.95)' : 'rgba(232,253,255,.95)'; g.beginPath(); g.arc(cx + Math.cos(a2) * rr, cy + Math.sin(a2) * rr * .9, 1.4 + rn(k) * 1.8, 0, 7); g.fill(); }
    g.restore();
  }
  return cv.toDataURL();
}
const sheets = {}; PX.ultWeapons.aura = cls => sheets[cls] || (sheets[cls] = lightningSheet(cls));

/* ------- titles + lightning frame CSS ------- */
const css = `
.px28-ult-frame{position:relative;border-radius:14px;box-shadow:0 0 0 2px #fff1a0,0 0 0 4px #5a2ec8,0 0 18px 4px #4ae8ff,0 0 38px 8px rgba(120,70,255,.65);animation:px28ultpulse 1.1s ease-in-out infinite alternate}
@keyframes px28ultpulse{from{box-shadow:0 0 0 2px #fff1a0,0 0 0 4px #5a2ec8,0 0 12px 2px #4ae8ff,0 0 26px 4px rgba(120,70,255,.5)}to{box-shadow:0 0 0 2px #ffffff,0 0 0 4px #8a5aff,0 0 26px 7px #9ff3ff,0 0 52px 12px rgba(150,90,255,.85)}}
.px28-ult-frame::before,.px28-ult-frame::after{content:'⚡';position:absolute;top:-10px;font-size:20px;color:#fff1a0;text-shadow:0 0 8px #4ae8ff,0 0 16px #8a5aff;animation:px28flick .7s steps(2) infinite}
.px28-ult-frame::before{left:-8px}.px28-ult-frame::after{right:-8px;animation-delay:.35s}
@keyframes px28flick{0%{opacity:1;transform:scale(1) rotate(-8deg)}50%{opacity:.35;transform:scale(1.25) rotate(8deg)}100%{opacity:1;transform:scale(1) rotate(-8deg)}}
.px28-ult-title{display:inline-block;padding:2px 12px;border-radius:999px;font-weight:900;letter-spacing:.5px;color:#fff;background:linear-gradient(90deg,#2a1458,#5a2ec8,#2a1458);border:2px solid #fff1a0;text-shadow:0 0 6px #4ae8ff,0 0 12px #8a5aff;box-shadow:0 0 12px #4ae8ff,inset 0 0 8px rgba(255,255,255,.35);animation:px28ultpulse 1.1s ease-in-out infinite alternate}
.t-bolt{--a:#4ae8ff;--b:#fff1a0;--g:#8a5aff}
.px25-title.t-bolt{border:2px solid #fff1a0!important;background:linear-gradient(90deg,#1a0a48,#3a1e98,#1a0a48)!important;box-shadow:0 0 0 1px #000,0 0 14px #4ae8ff,0 0 28px #8a5aff;animation:px28ultpulse 1.1s ease-in-out infinite alternate}`;
const st = document.createElement('style'); st.id = 'px28-ult-css'; st.textContent = css; document.head.appendChild(st);

/* ------- register titles into the existing V25 title system (shown only when the weapon is owned & at +10) ------- */
function ownsUltAt10(cls) {
  try { const s = (typeof state !== 'undefined' ? state : null); if (!s) return false; const all = [...(s.gear || [])]; return all.some(g => g && g.slot === 'W' && isUlt(g) && (g.cls === cls) && (g.enh | 0) >= 10); } catch (e) { return false; }
}
function addTitles() {
  const V = window.AMBER_V25; if (!V || !V.TITLES) return false; if (V.__ult28) return true;
  Object.keys(DEFS).forEach(cls => { const d = DEFS[cls]; if (V.TITLES[d.id]) return; V.TITLES[d.id] = { name: '⚡ ' + d.title, cls: 'bolt', test: () => ownsUltAt10(cls), how: 'ถือ ' + d.short + ' ที่ตีบวก +10' }; });
  V.__ult28 = 1; return true;
}
let tries = 0; const iv = setInterval(() => { if (addTitles() || ++tries > 60) clearInterval(iv); }, 500);


/* ------- BAG / EQUIP / DETAIL: special electric-blue card for ultimate weapons (replaces the normal boss rainbow card) ------- */
const BOLT1 = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke-linecap='round' stroke-linejoin='round'><path d='M20 4 L34 38 L18 44 L40 82 L28 88 L46 116' stroke='%234ae8ff' stroke-width='5' opacity='.55'/><path d='M20 4 L34 38 L18 44 L40 82 L28 88 L46 116' stroke='%23ffffff' stroke-width='1.8'/><path d='M34 38 L62 52 L56 62 L84 76' stroke='%23ffffff' stroke-width='1.4'/><path d='M96 6 L82 34 L98 40 L80 70' stroke='%23ffffff' stroke-width='1.6'/></g></svg>\")";
const BOLT2 = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'><g fill='none' stroke-linecap='round' stroke-linejoin='round'><path d='M110 2 L92 40 L108 46 L84 90 L98 96 L74 138' stroke='%238a5aff' stroke-width='5' opacity='.6'/><path d='M110 2 L92 40 L108 46 L84 90 L98 96 L74 138' stroke='%23e8fdff' stroke-width='1.8'/><path d='M92 40 L60 56 L66 68 L30 84' stroke='%23ffffff' stroke-width='1.4'/><path d='M14 10 L30 44 L14 52' stroke='%23ffffff' stroke-width='1.5'/></g></svg>\")";
const css2 = `
.gc.px28-ult-card.px28-ult-card,.item.px28-ult-card.px28-ult-card{position:relative!important;isolation:isolate!important;overflow:hidden!important;border:3px solid #9ff3ff!important;border-radius:10px!important;
 background:radial-gradient(circle at 50% 35%,#3a8cff 0%,#1538b8 45%,#07124a 85%)!important;background-size:100% 100%!important;
 box-shadow:0 0 12px #4ae8ff,0 0 24px #8a5aff88,inset 0 0 16px #4ae8ff66!important;animation:px28ultpulse 1.2s ease-in-out infinite alternate!important}
.gc.px28-ult-card.px28-ult-card>*{position:relative;z-index:2}
.gc.px28-ult-card.px28-ult-card:before,.gc.px28-ult-card.px28-ult-card:after{content:'';position:absolute;inset:0;z-index:1;pointer-events:none;mix-blend-mode:screen;background-repeat:no-repeat;background-size:70% 100%}
.gc.px28-ult-card.px28-ult-card:before{background-image:${BOLT1};background-position:0 0;animation:px28bolt1 1.9s steps(1) infinite}
.gc.px28-ult-card.px28-ult-card:after{background-image:${BOLT2};background-position:100% 0;animation:px28bolt2 2.3s steps(1) infinite}
@keyframes px28bolt1{0%{opacity:0}4%{opacity:1}9%{opacity:.15}13%{opacity:1}20%{opacity:0}58%{opacity:0}61%{opacity:1}66%{opacity:.2}70%{opacity:1}76%,100%{opacity:0}}
@keyframes px28bolt2{0%,30%{opacity:0}33%{opacity:1}38%{opacity:.1}42%{opacity:1}50%{opacity:0}80%{opacity:0}83%{opacity:1}88%{opacity:.2}92%{opacity:1}97%,100%{opacity:0}}
.gc.px28-ult-card.px28-ult-card small{color:#e8fdff!important;text-shadow:0 0 6px #4ae8ff,0 1px 3px #000}
.gi.big.px28-ult-icon.px28-ult-icon{position:relative!important;overflow:hidden!important;isolation:isolate!important;border:4px solid #9ff3ff!important;border-radius:14px!important;
 background:radial-gradient(circle at 50% 38%,#3a8cff 0%,#1538b8 50%,#07124a 90%)!important;background-size:100% 100%!important;box-shadow:0 0 20px #4ae8ff,0 0 40px #8a5aff99,inset 0 0 22px #4ae8ff77!important;animation:px28ultpulse 1.1s ease-in-out infinite alternate!important}
.gi.big.px28-ult-icon:before,.gi.big.px28-ult-icon:after{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;mix-blend-mode:screen;background-repeat:no-repeat;background-size:80% 100%}
.gi.big.px28-ult-icon:before{background-image:${BOLT1};animation:px28bolt1 1.5s steps(1) infinite}.gi.big.px28-ult-icon:after{background-image:${BOLT2};background-position:100% 0;animation:px28bolt2 1.8s steps(1) infinite}
.gi.big.px28-ult-icon>*{position:relative;z-index:2}
.gc.px28-ult-card .gi,.gc.px28-ult-card .gi *,.gc.px28-ult-card img,.gi.big.px28-ult-icon img{animation:none!important;filter:none!important}
.px28-ult-modal .statrow{border-color:#4ae8ff!important}
.px28-ult-ribbon{text-align:center;margin:2px 0 6px}`;
const st2 = document.createElement('style'); st2.id = 'px28-ult-card-css'; st2.textContent = css2; document.head.appendChild(st2);

const gearById = id => { try { return (state.gear || []).find(x => String(x.id) === String(id)); } catch (e) { return null; } };

/* ------- animated electric-blue tile (replaces the rainbow tile for ultimate weapons: bag icon, detail icon, try-on stage) ------- */
function ultTile(size, f, n) {
  const sp = new PX.Sp(size, size), cx = size / 2, cy = size * .42, mx = PX.mix;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const d = Math.min(1, Math.hypot(x - cx, (y - cy) * .9) / (size * .72)); sp.px(x, y, mx(mx('#3a8cff', '#1538b8', Math.min(1, d * 1.2)), '#07124a', Math.max(0, d - .55) * 1.6)); }
  const rn = k => { const v = Math.sin(k * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const show = [1, 0, 1, 1, 0, 0, 1, 0][f % 8];
  const bolts = show ? 2 : 1;
  for (let b = 0; b < bolts; b++) {
    let x = size * (.2 + rn(f * 3 + b * 7) * .6), y = 0; const pts = [[x, y]];
    while (y < size) { y += size * (.12 + rn(f * 11 + b + y) * .1); x += (rn(f * 5 + y + b * 3) - .5) * size * .35; pts.push([Math.max(1, Math.min(size - 2, x)), Math.min(size, y)]); }
    for (let i = 1; i < pts.length; i++) { sp.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], '#4ae8ffaa', 2); sp.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], '#ffffff', 1); }
  }
  for (let i = 0; i < 4; i++) { const a = (f / n + i / 4) * Math.PI * 2; sp.px(cx + Math.cos(a) * size * .42, cy + Math.sin(a) * size * .42, '#fff1a0'); }
  for (let i = 0; i < size; i++) { sp.px(i, 0, '#9ff3ff'); sp.px(i, size - 1, '#9ff3ff'); sp.px(0, i, '#9ff3ff'); sp.px(size - 1, i, '#9ff3ff'); }
  return sp;
}
const gu0 = PX.items && PX.items.gearURL;
if (gu0 && !gu0.__ult) {
  const gu = function (g) {
    if (!isUlt(g)) return gu0(g);
    const key = 'ultgear|' + (g.cls || '') + '|' + (g.enh | 0); if (PX.anim.has(key)) return PX.anim.get(key).first;
    const ic = W.icon(PX.weaponSpec({ ...g, slot: 'W' }), 32), fr = [];
    for (let f = 0; f < 8; f++) { const t = ultTile(36, f, 8); t.blit(ic, 2, 2, { rim: false }); fr.push(t); }
    return PX.anim.reg(key, fr, { fps: 8 });
  };
  gu.__ult = 1; PX.items.gearURL = gu;
}
function ultStageURL() { const key = 'ultstage'; if (PX.anim.has(key)) return PX.anim.get(key).first; const fr = []; for (let f = 0; f < 8; f++) fr.push(ultTile(72, f, 8)); return PX.anim.reg(key, fr, { fps: 7 }); }
function fixStage() { const mb = document.getElementById('modalBody'); if (!mb || !mb.classList.contains('px28-ult-modal')) return; const im = mb.querySelector('.px24-stagebg'); if (im && im.dataset.ult !== '1') { im.src = ultStageURL(); im.dataset.ult = '1'; const hd = mb.querySelector('.px24-tryhd'); if (hd) hd.textContent = hd.textContent.replace('🌈', '⚡'); } }
setInterval(() => { if (!document.hidden) fixStage(); }, 300);

function decorateUlt() {
  document.querySelectorAll('.gc').forEach(el => {
    const id = (el.getAttribute('onclick') || '').match(/openGear\('([^']+)'\)/); if (!id) return;
    if (isUlt(gearById(id[1]))) el.classList.add('px28-ult-card');
  });
}
const og = window.openGear;
if (typeof og === 'function' && !og.__px28ult) {
  const w = function (id, msg) {
    const r = og.apply(this, arguments);
    try {
      const g = gearById(id), mb = document.getElementById('modalBody');
      if (isUlt(g) && mb) {
        mb.classList.add('px28-ult-modal');
        mb.querySelectorAll('.gi.big').forEach(e => { e.classList.add('px28-ult-icon'); e.classList.remove('amber-boss-rainbow-icon'); });
        if (!mb.querySelector('.px28-ult-ribbon')) { const d = DEFS[g.cls] || {}; const rb = document.createElement('div'); rb.className = 'px28-ult-ribbon'; rb.innerHTML = '<span class="px28-ult-title">⚡ ตำนานบอสโลก' + (d.title ? ' · ' + d.title : '') + '</span>'; const big = mb.querySelector('.gi.big'); if (big && big.parentElement) big.parentElement.after(rb); }
      } else if (mb) mb.classList.remove('px28-ult-modal');
    } catch (e) { }
    return r;
  };
  w.__px28ult = 1; window.openGear = w;
}
setInterval(() => { if (!document.hidden) decorateUlt(); }, 700);

window.AMBER_V28_ULT = { DEFS, isUlt, ownsUltAt10, build: PX.ultWeapons.build, icon: cls => W.icon({ cls, tier: 3, theme: 'ult', ult: 1 }, 48).toURL() };
})();
