/* 55 AMBERLANDS V28 — NEW SKILL VFX (smooth, glowing, high-resolution — replaces the old chunky pixel skill sheets)
 *  - 120 skills (20 styles x 3 paths x 10 tiers) re-drawn with canvas light: additive glow, crescent slashes, lightning, flames, runes
 *  - atlas is 10 frames of 256x256 (2560x256); shown at 200px, so it looks crisp and big on phones
 *  - new jewelled skill icons (64x64) shown in the skill list, AUTO slots and the battle skill bar
 *  CLIENT ONLY. Visual only: no stats, no saves, no Supabase.
 */
(() => {
'use strict';
const PX = window.PX; if (!PX || !PX.skills) return;
const W = 256, C = 128, TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos, PI = Math.PI;
const mkRng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const hex = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const rgba = (h, a) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`; };
const mixc = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const ease = t => t * t * (3 - 2 * t), eo = t => 1 - (1 - t) * (1 - t);

const PATHS = { POWER: ['#ff4a1a', '#ffb02e'], DEX: ['#18d0ff', '#9affd0'], INT: ['#9a4cff', '#ff7aff'] };
const JOBT = { 'ดาบ': '#cfe0ff', 'หมัด': '#ffd878', 'ธนู': '#aaffb8', 'จอมเวท': '#e0b8ff' };
const pal = (job, path) => { const [m, s] = PATHS[path] || PATHS.POWER; return { m, s, core: mixc('#ffffff', JOBT[job] || '#fff', .25), dark: mixc(m, '#10061e', .7) }; };

/* ---------------- light primitives (all additive) ---------------- */
const glow = (g, x, y, r, col, a = 1) => { const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, rgba(col, a)); q.addColorStop(.35, rgba(col, a * .45)); q.addColorStop(1, rgba(col, 0)); g.fillStyle = q; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
function streak(g, x0, y0, x1, y1, w, P, a = 1) {
  g.lineCap = 'round'; g.shadowColor = P.m; g.shadowBlur = w * 2.4;
  g.strokeStyle = rgba(P.m, a * .9); g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  g.strokeStyle = rgba(P.s, a); g.lineWidth = w * .55; g.stroke();
  g.shadowBlur = 0; g.strokeStyle = rgba(P.core, a); g.lineWidth = Math.max(1, w * .22); g.stroke();
}
function crescent(g, cx, cy, r, a0, a1, w, P, a = 1) {      // tapered curved blade of light
  const n = 28, o = [], inn = [];
  for (let i = 0; i <= n; i++) { const t = i / n, an = a0 + (a1 - a0) * t, wd = w * Math.pow(sin(t * PI), .8); o.push([cx + cos(an) * (r + wd * .5), cy + sin(an) * (r + wd * .5)]); inn.push([cx + cos(an) * (r - wd * .5), cy + sin(an) * (r - wd * .5)]); }
  const path = () => { g.beginPath(); o.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); for (let i = inn.length - 1; i >= 0; i--) g.lineTo(inn[i][0], inn[i][1]); g.closePath(); };
  g.shadowColor = P.m; g.shadowBlur = 22; g.fillStyle = rgba(P.m, a * .85); path(); g.fill(); g.shadowBlur = 0;
  g.save(); g.translate(cx, cy); g.scale(.93, .93); g.translate(-cx, -cy); g.fillStyle = rgba(P.s, a * .9); path(); g.fill(); g.restore();
  g.save(); g.translate(cx, cy); g.scale(.86, .86); g.translate(-cx, -cy); g.fillStyle = rgba(P.core, a); path(); g.fill(); g.restore();
}
function bolt(g, x0, y0, x1, y1, rng, P, w = 3, a = 1, jit = 22) {
  const pts = [[x0, y0]], n = 8; for (let i = 1; i < n; i++) { const f = i / n; pts.push([x0 + (x1 - x0) * f + (rng() - .5) * jit, y0 + (y1 - y0) * f + (rng() - .5) * jit]); } pts.push([x1, y1]);
  g.lineJoin = 'round'; g.lineCap = 'round'; g.shadowColor = P.m; g.shadowBlur = 16;
  for (const [c, wd, aa] of [[P.m, w * 2.4, .6], [P.s, w * 1.3, .9], [P.core, w * .6, 1]]) { g.strokeStyle = rgba(c, a * aa); g.lineWidth = wd; g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke(); }
  g.shadowBlur = 0;
}
const ring = (g, cx, cy, r, w, col, a = 1, sq = 1) => { g.save(); g.translate(cx, cy); g.scale(1, sq); g.strokeStyle = rgba(col, a); g.lineWidth = w; g.shadowColor = col; g.shadowBlur = w * 2; g.beginPath(); g.arc(0, 0, Math.max(1, r), 0, TAU); g.stroke(); g.restore(); g.shadowBlur = 0; };
function flare(g, x, y, r, P, a = 1) { glow(g, x, y, r, P.m, a * .9); glow(g, x, y, r * .55, P.s, a); glow(g, x, y, r * .28, P.core, a); for (const an of [0, PI / 2]) { g.save(); g.translate(x, y); g.rotate(an + .0); const q = g.createLinearGradient(-r * 1.4, 0, r * 1.4, 0); q.addColorStop(0, rgba(P.core, 0)); q.addColorStop(.5, rgba(P.core, a)); q.addColorStop(1, rgba(P.core, 0)); g.fillStyle = q; g.fillRect(-r * 1.4, -1.6, r * 2.8, 3.2); g.restore(); } }
function sparks(g, rng, n, cx, cy, p, spread, P, size = 3) { for (let i = 0; i < n; i++) { const an = rng() * TAU, sp = (.35 + rng() * .65) * spread, d = sp * eo(p), x = cx + cos(an) * d, y = cy + sin(an) * d + p * p * 26, life = 1 - p; glow(g, x, y, size * 2.4, i % 2 ? P.s : P.core, life * .9); g.fillStyle = rgba('#ffffff', life); g.fillRect(x - 1, y - 1, 2, 2); } }
function flame(g, x, y, h, w, P, t, seed) { const sw = sin(t * TAU * 2 + seed) * w * .3; for (const [c, k] of [[P.m, 1], [P.s, .66], [P.core, .34]]) { g.fillStyle = rgba(c, .75); g.beginPath(); g.moveTo(x - w * k, y); g.quadraticCurveTo(x - w * k * .9, y - h * k * .5, x + sw * k, y - h * k); g.quadraticCurveTo(x + w * k * .9, y - h * k * .5, x + w * k, y); g.closePath(); g.fill(); } }
const rune = (g, x, y, s, a, P, rot) => { g.save(); g.translate(x, y); g.rotate(rot); g.strokeStyle = rgba(P.core, a); g.lineWidth = 2; g.shadowColor = P.m; g.shadowBlur = 8; g.beginPath(); g.moveTo(-s, s); g.lineTo(0, -s); g.lineTo(s, s); g.moveTo(-s * .6, s * .2); g.lineTo(s * .6, s * .2); g.stroke(); g.restore(); g.shadowBlur = 0; };

/* ---------------- the 20 styles. p = 0..1 time, k = tier 0..1, f = fade-out ---------------- */
const S = {};
S.cleave = (g, p, P, k, r, f) => { const sw = eo(Math.min(1, p * 1.6)); crescent(g, C - 6, C + 14, 82 + k * 16, -2.5, -2.5 + 3.2 * sw, 34 + k * 20, P, f); if (k > .3) crescent(g, C - 6, C + 14, 58, -2.3, -2.3 + 2.8 * sw, 18, P, f * .8); glow(g, C + 26, C - 22, 40 + 30 * sin(p * PI), P.s, f * .7); sparks(g, r, 14 + k * 20, C + 30, C - 10, p, 90, P); if (p > .35) flare(g, C + 40, C - 20, 34 * sin(Math.min(1, (p - .35) * 2) * PI) + 6, P, f); };
S.crosscut = (g, p, P, k, r, f) => { const a = eo(Math.min(1, p * 2)), b = eo(Math.min(1, Math.max(0, p * 2 - .5))); streak(g, C - 70, C - 70, C - 70 + 140 * a, C - 70 + 140 * a, 14 + k * 8, P, f); streak(g, C + 70, C - 70, C + 70 - 140 * b, C - 70 + 140 * b, 14 + k * 8, P, f); if (p > .3) { flare(g, C, C, 50 * sin(Math.min(1, (p - .3) * 1.8) * PI) + 8, P, f); ring(g, C, C, 20 + p * 90, 5, P.s, f * .8, .9); } sparks(g, r, 20 + k * 20, C, C, p, 100, P); };
S.whirl = (g, p, P, k, r, f) => { const n = 3 + Math.round(k * 3); for (let i = 0; i < n; i++) { const a0 = p * TAU * 1.5 + i * TAU / n; crescent(g, C, C, 62 + (i % 2) * 14 + k * 10, a0, a0 + 1.7, 24 + k * 10, P, f); } glow(g, C, C, 52, P.s, f * .5); ring(g, C, C, 96 * eo(p), 6, P.m, f * .6, .55); if (k > .5) for (let i = 0; i < 3; i++) bolt(g, C, C, C + cos(p * 9 + i * 2) * 100, C + sin(p * 9 + i * 2) * 100, mkRng(i * 7 + Math.floor(p * 10)), P, 2, f * .8, 16); };
S.bladeburst = (g, p, P, k, r, f) => { const n = 10 + Math.round(k * 10), L = 30 + eo(p) * (80 + k * 20); for (let i = 0; i < n; i++) { const an = i / n * TAU + .2, a0 = 14 + eo(p) * 10; streak(g, C + cos(an) * a0, C + sin(an) * a0, C + cos(an) * L, C + sin(an) * L, 7 + (i % 2) * 4, P, f); } flare(g, C, C, 40 + 40 * sin(p * PI), P, f); ring(g, C, C, 24 + eo(p) * 90, 6, P.s, f * .8, 1); sparks(g, r, 18, C, C, p, 110, P); };
S.swordrain = (g, p, P, k, r, f) => { const n = 6 + Math.round(k * 8); for (let i = 0; i < n; i++) { const x = 28 + r() * 200, d = r() * .35, q = Math.min(1, Math.max(0, (p - d) / .5)); if (q <= 0) continue; const y = -40 + (C + 50 + r() * 40) * eo(q); streak(g, x, y - 46, x, y, 7 + k * 3, P, f); g.fillStyle = rgba(P.core, f); g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x, y + 14); g.lineTo(x + 6, y); g.fill(); if (q >= 1) { flare(g, x, y + 8, 22 * (1 - p) + 8, P, f); ring(g, x, y + 10, (p - d) * 70, 3, P.s, f * .7, .4); } } };
S.shockwave = (g, p, P, k, r, f) => { for (let i = 0; i < 3 + Math.round(k * 2); i++) { const q = Math.max(0, p * 1.4 - i * .16); if (q > 0 && q < 1) ring(g, C, C + 10, 10 + eo(q) * (96 + k * 20), 12 - q * 8, i % 2 ? P.s : P.m, f * (1 - q), .62); } flare(g, C, C + 6, 60 * (1 - p * .6) + 10, P, f); sparks(g, r, 22 + k * 20, C, C + 10, p, 100, P); g.fillStyle = rgba(P.core, f * .35 * (1 - p)); g.fillRect(0, C + 40, W, 3); };
S.uppercut = (g, p, P, k, r, f) => { const h = eo(Math.min(1, p * 1.5)) * (150 + k * 30); const q = g.createLinearGradient(0, C + 90, 0, C + 90 - h); q.addColorStop(0, rgba(P.m, 0)); q.addColorStop(.5, rgba(P.m, f * .8)); q.addColorStop(1, rgba(P.core, f)); g.fillStyle = q; g.beginPath(); g.moveTo(C - 30, C + 90); g.quadraticCurveTo(C - 36, C + 90 - h * .5, C, C + 90 - h); g.quadraticCurveTo(C + 36, C + 90 - h * .5, C + 30, C + 90); g.fill(); for (let i = 0; i < 6; i++) flame(g, C - 40 + i * 16, C + 92 - h * .1, 60 + k * 30 + (i % 2) * 20, 12, P, p, i); glow(g, C, C + 90 - h, 46, P.core, f); sparks(g, r, 26, C, C + 90 - h, p, 100, P); ring(g, C, C + 92, 24 + p * 80, 6, P.s, f * .8, .35); };
S.afterimage = (g, p, P, k, r, f) => { const n = 5 + Math.round(k * 3); for (let i = 0; i < n; i++) { const y = C - 50 + i * (100 / n), x0 = 20 + i * 8, x1 = x0 + 170 * eo(Math.min(1, p * 1.7 - i * .05)); if (x1 > x0) { streak(g, x0, y, x1, y + 8, 9 + (i % 2) * 4, P, f * (.5 + i / n * .5)); glow(g, x1, y + 8, 22, P.s, f); } } flare(g, C + 80, C + 6, 54 * sin(p * PI) + 8, P, f); sparks(g, r, 18, C + 80, C, p, 80, P); };
S.groundbreak = (g, p, P, k, r, f) => { const n = 8 + Math.round(k * 6); for (let i = 0; i < n; i++) { const an = i / n * TAU + r() * .4, L = (60 + r() * 50 + k * 20) * eo(Math.min(1, p * 1.6)); let x = C, y = C + 60; g.strokeStyle = rgba(P.s, f); g.lineWidth = 4; g.shadowColor = P.m; g.shadowBlur = 12; g.beginPath(); g.moveTo(x, y); for (let j = 1; j <= 5; j++) { x += cos(an) * L / 5 + (r() - .5) * 14; y += sin(an) * L / 5 * .5 + (r() - .5) * 6; g.lineTo(x, y); } g.stroke(); g.shadowBlur = 0; }
  const h = sin(Math.min(1, p * 1.3) * PI) * (130 + k * 40); const q = g.createLinearGradient(0, C + 60, 0, C + 60 - h); q.addColorStop(0, rgba(P.core, f)); q.addColorStop(1, rgba(P.m, 0)); g.fillStyle = q; g.fillRect(C - 28, C + 60 - h, 56, h);
  for (let i = 0; i < 10; i++) { const x = C + (r() - .5) * 130, y = C + 55 - sin(p * PI) * (30 + r() * 80); g.fillStyle = rgba(mixc(P.m, '#6a4a2a', .5), f); g.fillRect(x, y, 6 + r() * 6, 6 + r() * 6); } ring(g, C, C + 62, 20 + p * 100, 8, P.s, f * .9, .3); flare(g, C, C + 58, 40 * (1 - p) + 10, P, f); };
S.spiralpunch = (g, p, P, k, r, f) => { for (let s = 0; s < 3; s++) { g.strokeStyle = rgba(s ? P.s : P.m, f * .9); g.lineWidth = 12 - s * 3; g.shadowColor = P.m; g.shadowBlur = 16; g.beginPath(); for (let t = 0; t <= 1; t += .02) { const an = t * TAU * (2.2 + k) + s * 2.1 + p * 6, rad = 12 + t * 80, x = C - 70 + t * 150 * eo(Math.min(1, p * 1.6)), y = C + sin(an) * rad * (1 - t * .3) * .5; t ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } g.shadowBlur = 0; flare(g, C + 78 * eo(Math.min(1, p * 1.6)) - 6, C, 36 + 30 * sin(p * PI), P, f); sparks(g, r, 20, C + 60, C, p, 90, P); };
S.arrowswarm = (g, p, P, k, r, f) => { const n = 8 + Math.round(k * 10); for (let i = 0; i < n; i++) { const y0 = r() * 200 + 20, d = r() * .3, q = Math.min(1, Math.max(0, (p - d) / .55)); if (q <= 0) continue; const x1 = 10 + 190 * eo(q); streak(g, x1 - 70, y0 + (C - y0) * eo(q) * .3, x1, y0 + (C - y0) * eo(q) * .5, 5 + k * 2, P, f); g.fillStyle = rgba(P.core, f); g.beginPath(); const yy = y0 + (C - y0) * eo(q) * .5; g.moveTo(x1 + 10, yy); g.lineTo(x1 - 4, yy - 5); g.lineTo(x1 - 4, yy + 5); g.fill(); } if (p > .45) flare(g, C + 50, C, 50 * sin((p - .45) * 1.8 * PI) + 10, P, f); sparks(g, r, 14, C + 50, C, p, 80, P); };
S.pierce = (g, p, P, k, r, f) => { const x1 = 20 + 230 * eo(Math.min(1, p * 1.8)); streak(g, 10, C, x1, C, 26 + k * 12, P, f); glow(g, x1, C, 50, P.core, f); for (let i = 0; i < 4; i++) ring(g, 40 + i * 52 * eo(Math.min(1, p * 1.8)), C, 26 + i * 4, 4, P.s, f * .8, 1.6); flare(g, x1, C, 44, P, f); sparks(g, r, 20, x1, C, p, 80, P); };
S.arrowrain = (g, p, P, k, r, f) => { const n = 10 + Math.round(k * 12); for (let i = 0; i < n; i++) { const x = 24 + r() * 208, d = r() * .4, q = Math.min(1, Math.max(0, (p - d) / .45)); if (q <= 0) continue; const y = -30 + (C + 80) * eo(q); streak(g, x - 12, y - 56, x, y, 5, P, f); if (q >= 1) { glow(g, x, y, 20, P.s, f * (1 - (p - d - .45) * 2)); ring(g, x, y + 2, (p - d - .45) * 60, 2, P.s, f * .7, .4); } } };
S.homing = (g, p, P, k, r, f) => { const n = 5 + Math.round(k * 5); for (let i = 0; i < n; i++) { const an = i / n * TAU, sx = C + cos(an) * 110, sy = C + sin(an) * 110, q = eo(Math.min(1, p * 1.5)), cxp = C + cos(an + 1.2) * 70, cyp = C + sin(an + 1.2) * 70; for (let t = 0; t < 12; t++) { const u = Math.max(0, q - t * .04), x = (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * cxp + u * u * C, y = (1 - u) * (1 - u) * sy + 2 * (1 - u) * u * cyp + u * u * C; glow(g, x, y, 9 - t * .5, t ? P.m : P.core, f * (1 - t / 12)); } } if (p > .6) { flare(g, C, C, 56 * sin((p - .6) * 2.5 * PI) + 8, P, f); ring(g, C, C, (p - .6) * 220, 6, P.s, f, 1); } };
S.bowburst = (g, p, P, k, r, f) => { const n = 9 + Math.round(k * 8); for (let i = 0; i < n; i++) { const an = i / n * TAU, a0 = 20, L = 20 + eo(p) * 100; streak(g, C + cos(an) * a0, C + sin(an) * a0, C + cos(an) * L, C + sin(an) * L, 6, P, f); g.fillStyle = rgba(P.core, f); g.save(); g.translate(C + cos(an) * (L + 6), C + sin(an) * (L + 6)); g.rotate(an); g.beginPath(); g.moveTo(8, 0); g.lineTo(-4, -5); g.lineTo(-4, 5); g.fill(); g.restore(); } flare(g, C, C, 36 + 30 * (1 - p), P, f); ring(g, C, C, eo(p) * 100, 5, P.s, f * .8, 1); };
S.spellring = (g, p, P, k, r, f) => { const sq = .42, rr = 80 + k * 14; ring(g, C, C + 30, rr, 5, P.m, f, sq); ring(g, C, C + 30, rr * .7, 3, P.s, f, sq); for (let i = 0; i < 6; i++) { const an = i / 6 * TAU + p * 3; rune(g, C + cos(an) * rr, C + 30 + sin(an) * rr * sq, 9, f, P, an); } for (let i = 0; i < 3; i++) { const an = p * 4 + i * 2.1; g.strokeStyle = rgba(P.s, f * .5); g.lineWidth = 2; g.beginPath(); for (let j = 0; j < 3; j++) { const aa = an + j * TAU / 3; j ? g.lineTo(C + cos(aa) * rr * .7, C + 30 + sin(aa) * rr * .7 * sq) : g.moveTo(C + cos(aa) * rr * .7, C + 30 + sin(aa) * rr * .7 * sq); } g.closePath(); g.stroke(); }
  const h = sin(Math.min(1, p * 1.4) * PI) * (130 + k * 50), q = g.createLinearGradient(0, C + 30, 0, C + 30 - h); q.addColorStop(0, rgba(P.core, f * .9)); q.addColorStop(1, rgba(P.m, 0)); g.fillStyle = q; g.fillRect(C - 26, C + 30 - h, 52, h); glow(g, C, C + 30 - h * .3, 50, P.s, f * .6); sparks(g, r, 22, C, C, p, 70, P); };
S.meteor = (g, p, P, k, r, f) => { const q = Math.min(1, p * 1.5), x = 20 + 108 * eo(q), y = -20 + 150 * eo(q); if (q < 1) { for (let t = 0; t < 14; t++) glow(g, x - t * 7, y - t * 8, 24 - t, t > 6 ? P.m : P.s, f * (1 - t / 14)); glow(g, x, y, 30, P.core, f); g.fillStyle = rgba(P.dark, 1); g.beginPath(); g.arc(x, y, 14 + k * 4, 0, TAU); g.fill(); glow(g, x, y, 22, P.s, f * .8); } else { const e = (p - .667) / .333; flare(g, C, C + 20, 60 + 50 * e, P, f * (1 - e * .5)); ring(g, C, C + 24, 20 + e * 100, 10 - e * 6, P.s, f, .5); for (let i = 0; i < 7; i++) flame(g, C - 60 + i * 20, C + 36, 50 * (1 - e * .6) + 14, 12, P, p, i); sparks(g, r, 30 + k * 20, C, C + 20, e, 110, P, 4); } };
S.lightning = (g, p, P, k, r, f) => { const n = 3 + Math.round(k * 3), fk = Math.floor(p * 10); for (let i = 0; i < n; i++) { const rr = mkRng(i * 31 + fk * 7 + 1), x = C + (i - (n - 1) / 2) * 38 + (rr() - .5) * 20; if (rr() > .22 || p < .5) bolt(g, x + (rr() - .5) * 30, -10, x, C + 60, rr, P, 3 + k * 2, f, 30); } g.fillStyle = rgba(P.core, f * .35 * Math.max(0, 1 - Math.abs(p - .3) * 5)); g.fillRect(0, 0, W, W); flare(g, C, C + 60, 36 + 24 * sin(p * PI), P, f); ring(g, C, C + 62, 10 + p * 100, 5, P.s, f * .8, .35); sparks(g, r, 22, C, C + 56, p, 100, P); };
S.icecrystals = (g, p, P, k, r, f) => { const n = 7 + Math.round(k * 5), gr = eo(Math.min(1, p * 1.8)); for (let i = 0; i < n; i++) { const x = C + (i - (n - 1) / 2) * 24 + (r() - .5) * 10, h = (40 + r() * 70 + k * 30) * gr, w = 10 + r() * 8, y = C + 70; const q = g.createLinearGradient(x, y, x, y - h); q.addColorStop(0, rgba(P.m, f)); q.addColorStop(1, rgba(P.core, f)); g.fillStyle = q; g.shadowColor = P.m; g.shadowBlur = 14; g.beginPath(); g.moveTo(x - w, y); g.lineTo(x - w * .3, y - h * .7); g.lineTo(x, y - h); g.lineTo(x + w * .4, y - h * .65); g.lineTo(x + w, y); g.closePath(); g.fill(); g.shadowBlur = 0; g.fillStyle = rgba('#ffffff', f * .6); g.beginPath(); g.moveTo(x - w * .3, y - 4); g.lineTo(x, y - h); g.lineTo(x - w * .1, y - 4); g.fill(); } ring(g, C, C + 72, 20 + p * 110, 6, P.s, f * .8, .3); sparks(g, r, 26, C, C + 40, p, 110, P); flare(g, C, C + 30, 30 * sin(p * PI) + 6, P, f); };
S.nova = (g, p, P, k, r, f) => { const e = eo(p); glow(g, C, C, 40 + e * 100, P.m, f * .8); glow(g, C, C, 20 + e * 60, P.s, f); glow(g, C, C, 10 + e * 30, P.core, f); for (let i = 0; i < 3; i++) { const q = Math.max(0, p * 1.4 - i * .18); if (q > 0 && q < 1) ring(g, C, C, 10 + eo(q) * 118, 10 - q * 7, i % 2 ? P.s : P.m, f * (1 - q * .7), 1); } for (let i = 0; i < 10 + Math.round(k * 8); i++) { const an = i / (10 + k * 8) * TAU + p, L = 30 + e * (90 + (i % 3) * 14); streak(g, C + cos(an) * 16, C + sin(an) * 16, C + cos(an) * L, C + sin(an) * L, 4, P, f * .9); } flare(g, C, C, 60 * (1 - p * .5), P, f); sparks(g, r, 28 + k * 20, C, C, p, 110, P, 3.5); };

/* ---------------- atlas + icons ---------------- */
const fk = c => c.style + '|' + c.job + '|' + c.path + '|' + c.index;
const sheets = new Map(), icons = new Map();
function frame(cfg, i, n = 10) {
  const cv = document.createElement('canvas'); cv.width = cv.height = W; const g = cv.getContext('2d'); g.globalCompositeOperation = 'lighter';
  const p = (i + .5) / n, P = pal(cfg.job, cfg.path), k = (cfg.index || 0) / 9, key = fk(cfg); let h = 0; for (let j = 0; j < key.length; j++) h = (h * 31 + key.charCodeAt(j)) >>> 0;
  const f = p < .1 ? p / .1 : p > .8 ? Math.max(0, (1 - p) / .2) : 1, fn = S[cfg.style] || S.nova;
  try { fn(g, p, P, k, mkRng(h), f); } catch (e) { }
  if (k >= .5) { const rr = mkRng(h + 99), nb = Math.round((k - .4) * 6); for (let b = 0; b < nb; b++) { if (rr() < .7) bolt(g, C + (rr() - .5) * 90, C + (rr() - .5) * 90, C + (rr() - .5) * 220, C + (rr() - .5) * 220, mkRng(h + b * 13 + i * 5), P, 1.6, f * .7, 18); } }
  if (k >= .8) glow(g, C, C, 120, P.s, f * .12);
  return cv;
}
function sheetURL(cfg) {
  const key = fk(cfg); let u = sheets.get(key); if (u) return u;
  const cv = document.createElement('canvas'); cv.width = W * 10; cv.height = W; const g = cv.getContext('2d');
  for (let i = 0; i < 10; i++) g.drawImage(frame(cfg, i), i * W, 0);
  u = cv.toDataURL('image/png'); sheets.set(key, u); return u;
}
function iconURL(cfg) {
  const key = fk(cfg); let u = icons.get(key); if (u) return u; const Z = 72, P = pal(cfg.job, cfg.path), k = (cfg.index || 0) / 9;
  const cv = document.createElement('canvas'); cv.width = cv.height = Z; const g = cv.getContext('2d');
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const bg = g.createRadialGradient(Z / 2, Z * .4, 4, Z / 2, Z / 2, Z * .75); bg.addColorStop(0, mixc(P.m, '#10061e', .5)); bg.addColorStop(1, '#08040f'); g.fillStyle = bg; rr(2, 2, Z - 4, Z - 4, 14); g.fill();
  g.save(); rr(2, 2, Z - 4, Z - 4, 14); g.clip(); const fr = frame(cfg, 4); g.globalCompositeOperation = 'lighter'; g.drawImage(fr, -26, -26, Z + 52, Z + 52); g.drawImage(fr, -26, -26, Z + 52, Z + 52); g.restore();
  g.globalCompositeOperation = 'source-over'; const tc = k >= .8 ? ['#fff3b0', '#ff9a2a'] : k >= .5 ? ['#f0e0ff', '#a45cff'] : k >= .3 ? ['#d8f0ff', '#3a9aff'] : ['#e8e0d0', '#8a7a60'];
  const bd = g.createLinearGradient(0, 0, Z, Z); bd.addColorStop(0, tc[0]); bd.addColorStop(1, tc[1]); g.strokeStyle = bd; g.lineWidth = 3.5; rr(3, 3, Z - 6, Z - 6, 13); g.stroke(); g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1; rr(5.5, 5.5, Z - 11, Z - 11, 11); g.stroke();
  const stars = 1 + Math.floor((cfg.index || 0) / 3); g.fillStyle = tc[0]; for (let i = 0; i < stars; i++) { g.beginPath(); const x = 12 + i * 9, y = Z - 11; for (let j = 0; j < 10; j++) { const an = -PI / 2 + j * PI / 5, q = j % 2 ? 2 : 4.4; j ? g.lineTo(x + cos(an) * q, y + sin(an) * q) : g.moveTo(x + cos(an) * q, y + sin(an) * q); } g.fill(); }
  u = cv.toDataURL('image/png'); icons.set(key, u); return u;
}
/* replace the old module's exports */
PX.skills.sheetURL = sheetURL; PX.skills.iconURL = iconURL; PX.skills.vfx28 = true;

/* ---------------- CSS: bigger, crisper effect box ---------------- */
const SZ = 200, st = document.createElement('style'); st.id = 'px28-skillfx';
st.textContent = `.amber23-fx{width:${SZ}px!important;height:${SZ}px!important}.amber23-atlas{width:${SZ}px!important;height:${SZ}px!important;background-size:${SZ * 10}px ${SZ}px!important;animation-name:px28-atlas!important;image-rendering:auto!important;filter:none!important;mix-blend-mode:screen}
@keyframes px28-atlas{0%{background-position:0 0;opacity:0}6%{opacity:1}94%{opacity:1}100%{background-position:-${SZ * 10}px 0;opacity:0}}
.px28-sico{border-radius:12px!important;image-rendering:auto!important;background:none!important;border:0!important;box-shadow:0 0 0 2px #0b0614,0 0 10px #000a!important;object-fit:cover}`;
document.head.appendChild(st);

/* ---------------- swap every skill icon in the UI ---------------- */
function skillList() { try { return typeof SKILLS !== 'undefined' ? SKILLS : []; } catch (e) { return []; } }
function cfgOf(id) { const m = window.AMBER_V23_SKILL_ART && window.AMBER_V23_SKILL_ART.manifest; return m && m[id]; }
function iconFor(sk) { const c = sk && cfgOf(sk.id); return c ? iconURL(c) : ''; }
function stripName(t) { return String(t || '').replace(/[✨✨]/g, '').replace(/\s+/g, ' ').trim(); }
function paint() {
  const L = skillList(); if (!L.length) return; const byName = {}; L.forEach(s => { byName[s.name] = s; });
  document.querySelectorAll('.skillrow').forEach(row => { const b = row.querySelector('b'), im = row.querySelector(':scope > img'); if (!b || !im) return; const nm = stripName(b.textContent).replace(/\s*(บัฟทีม)\s*$/, '').replace(/\s*(✦)\s*$/, ''); const sk = byName[nm] || L.find(s => nm.startsWith(s.name)); if (!sk) return; const u = iconFor(sk); if (u && im.dataset.px28 !== sk.id) { im.src = u; im.dataset.px28 = sk.id; im.classList.add('px28-sico'); } });
  const learned = (typeof state !== 'undefined' && state.learned) ? L.filter(s => state.learned.includes(s.id)).slice(0, 8) : [];
  const box = document.getElementById('skills'); if (box) box.querySelectorAll('button').forEach((bt, i) => { const sk = learned[i]; if (!sk) return; let im = bt.querySelector('img'); const u = iconFor(sk); if (!u) return; if (im && im.dataset.px28 !== sk.id) { im.src = u; im.dataset.px28 = sk.id; im.classList.add('px28-sico'); } });
  document.querySelectorAll('.amber19-slot').forEach((row, i) => { const im = row.querySelector('.amber19-sloticon img'); const nm = stripName((row.querySelector('.amber19-slotlabel b') || {}).textContent).replace(/^ช่อง \d+ · /, ''); const sk = byName[nm]; if (!im || !sk) return; const u = iconFor(sk); if (u && im.dataset.px28 !== sk.id) { im.src = u; im.dataset.px28 = sk.id; im.classList.add('px28-sico'); } });
}
let tm = 0; const mo = new MutationObserver(() => { if (!tm) tm = setTimeout(() => { tm = 0; try { paint(); } catch (e) { } }, 150); });
const go = () => { mo.observe(document.body, { childList: true, subtree: true }); paint(); }; if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
window.AMBER_V28_SKILLVFX = { sheetURL, iconURL, frame, styles: Object.keys(S) };
})();
