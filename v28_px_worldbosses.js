/* 55 AMBERLANDS V28 — 10 NEW WORLD BOSSES (code-drawn pixel art, animated, with fire / light / lightning FX)
 *  PX.worldBosses = { LIST, get(id), table(id), reg(id), pick(eventKey), byName(name) }
 *  Each boss: idle x8 + attack x6 + hurt x2 + die x6 frames (112x112), same frame-table contract as PX.creatures.
 *  The boss's `name` is registered into PX.creatures.TABLE as an alias so the existing arena / codex can draw it.
 *  CLIENT ONLY — no Supabase, no saves, no SQL.
 */
(() => {
'use strict';
const PX = window.PX; if (!PX || !PX.Sp) return;
const { Sp } = PX; const S = 112, sin = Math.sin, cos = Math.cos, PI = Math.PI, TAU = PI * 2;
const OUT = '#0b0614', A = (c, a) => PX.alpha(c, a), M = (a, b, t) => PX.mix(a, b, t);
const rnd = n => { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* ------------------------------------------------ shared FX helpers */
function flame(sp, x, y, h, w, t, seed, cols) {      // flickering teardrop flame, tip at top
  const sway = sin(t * TAU * 2 + seed) * w * .35, hh = h * (.85 + .15 * sin(t * TAU * 3 + seed * 2));
  cols.forEach((c, i) => { const k = 1 - i / cols.length * .62; sp.poly([[x - w * k, y], [x - w * k * .7 + sway * .4, y - hh * k * .5], [x + sway * k, y - hh * k], [x + w * k * .7 + sway * .4, y - hh * k * .5], [x + w * k, y]], c); sp.ell(x, y, w * k, w * k * .55, c); });
}
function embers(sp, t, cx, cy, spread, rise, n, cols, seed = 0) {
  for (let i = 0; i < n; i++) { const ph = (t * 1 + rnd(i + seed) ) % 1, x = cx + (rnd(i * 3 + seed) - .5) * spread + sin(ph * TAU + i) * 3, y = cy - ph * rise; const c = cols[i % cols.length]; sp.px(x, y, A(c, 1 - ph)); if (i % 3 == 0) sp.px(x + 1, y, A(c, .6 * (1 - ph))); }
}
function rays(sp, cx, cy, R0, R1, n, t, col, a = .55) {
  for (let i = 0; i < n; i++) { const an = i / n * TAU + t * TAU * .25, w = .07 + .03 * sin(t * TAU + i); const p = [[cx + cos(an - w) * R0, cy + sin(an - w) * R0], [cx + cos(an) * R1, cy + sin(an) * R1], [cx + cos(an + w) * R0, cy + sin(an + w) * R0]]; sp.poly(p, A(col, a * (.6 + .4 * sin(t * TAU * 2 + i * 1.7)))); }
}
function bolt(sp, x0, y0, x1, y1, seed, cols, th = 1) {
  let px = x0, py = y0; const n = 7; for (let i = 1; i <= n; i++) { const f = i / n, nx = x0 + (x1 - x0) * f + (i < n ? (rnd(seed + i) - .5) * 14 : 0), ny = y0 + (y1 - y0) * f; sp.line(px, py, nx, ny, cols[0], th + 1); sp.line(px, py, nx, ny, cols[1], th); px = nx; py = ny; }
}
function ring(sp, cx, cy, r, col, a = .8) { for (let k = 0; k < 90; k++) { const an = k / 90 * TAU; sp.px(cx + cos(an) * r, cy + sin(an) * r * .55, A(col, a)); sp.px(cx + cos(an) * (r - 1), cy + sin(an) * (r - 1) * .55, A(col, a * .5)); } }
const ramp = (a, b, c) => [a, b, c];
const E = (an) => Math.max(0, sin(an * PI));        // attack energy 0..1..0
function layer(fn) { const l = new Sp(S, S); fn(l); l.sel(OUT); return l; }
function shadeTop(l, hi, amt = .35) {       // cheap top-light: lighten upper-left pixels of each column run
  for (let y = 1; y < S; y++) for (let x = 1; x < S; x++) { const i = y * S + x, c = l.d[i]; if (!(c >>> 24)) continue; const up = l.d[(y - 1) * S + x], lf = l.d[y * S + x - 1]; if (!(up >>> 24) || !(lf >>> 24)) l.d[i] = PX.P(M(PX.unpackHex ? PX.unpackHex(c) : '#ffffff', hi, 0)) && c; }
  return l;
}

/* ------------------------------------------------ the 10 bosses (each draws into sp at time t (0..1 loop), attack a (-1 or 0..1)) */
const D = {};

D.phoenix = (sp, t, a) => {
  const en = a >= 0 ? E(a) : 0, bob = sin(t * TAU) * 2, cx = 56, cy = 54 + bob, fl = sin(t * TAU), wf = fl * .5 + en * .6;
  sp.glow(cx, cy, 52 + en * 8, '#ff5a1a', .38);
  const wing = d => { const o = cx + d * 8, top = cy - 30 - wf * 10, sp2 = [];
    const bl = layer(l => { l.poly([[o, cy - 6], [o + d * 18, top], [o + d * 34, top + 6 - wf * 4], [o + d * 50, cy - 10 - wf * 12], [o + d * 44, cy + 2], [o + d * 52, cy + 14 + wf * 4], [o + d * 36, cy + 12], [o + d * 38, cy + 26 + wf * 6], [o + d * 22, cy + 18], [o + d * 8, cy + 20]], '#ff6a1a'); l.poly([[o, cy - 2], [o + d * 18, top + 8], [o + d * 30, cy - 6], [o + d * 36, cy + 8], [o + d * 20, cy + 10]], '#ffb02e'); l.poly([[o + d * 2, cy], [o + d * 14, top + 16], [o + d * 22, cy], [o + d * 14, cy + 8]], '#fff0a0'); }); sp.blit(bl, 0, 0); };
  wing(-1); wing(1);
  for (let i = 0; i < 5; i++) { const x = cx + (i - 2) * 7; flame(sp, x, cy + 40 + (i % 2) * 4, 36 - Math.abs(i - 2) * 4 + en * 6, 5, t, i, ['#ff3a1a', '#ff9a2a', '#ffe14a', '#ffffff']); }
  const body = layer(l => { l.ell(cx, cy + 4, 12, 18, '#ff7a1a'); l.ell(cx, cy + 8, 8, 12, '#ffd24a'); l.ell(cx, cy - 16 + 0, 8, 9, '#ff5a1a'); l.poly([[cx - 4, cy - 22], [cx - 2, cy - 33], [cx, cy - 25], [cx + 2, cy - 34], [cx + 4, cy - 22]], '#ffe14a'); l.poly([[cx + 6, cy - 18], [cx + 16, cy - 15], [cx + 6, cy - 13]], '#ffc83a'); });
  sp.blit(body, 0, 0); sp.rect(cx + 1, cy - 19, 3, 3, '#ffffff'); sp.px(cx + 2, cy - 18, '#d8101a');
  sp.glow(cx, cy + 4, 18, '#fff0a0', .35); embers(sp, t, cx, cy + 30, 70, 70, 26, ['#ffe14a', '#ff9a2a', '#ff5a1a']);
  if (en > 0) { sp.glow(cx, cy - 6, 40 * en + 12, '#ffffff', .4 * en); ring(sp, cx, cy + 12, 20 + en * 34, '#ffe14a'); }
};

D.titan = (sp, t, a) => {
  const en = a >= 0 ? E(a) : 0, bob = sin(t * TAU) * 1.5, cx = 56, gy = 108;
  sp.glow(cx, 56, 50, '#4aa8ff', .3 + .1 * sin(t * TAU * 2) + en * .25);
  const b = layer(l => {
    l.rect(cx - 24, gy - 30, 18, 30, '#2a4a8a'); l.rect(cx + 6, gy - 30, 18, 30, '#2a4a8a'); l.rect(cx - 26, gy - 6, 22, 7, '#16284a'); l.rect(cx + 4, gy - 6, 22, 7, '#16284a');
    l.poly([[cx - 30, gy - 78 + bob], [cx + 30, gy - 78 + bob], [cx + 24, gy - 28], [cx - 24, gy - 28]], '#3a68c8'); l.poly([[cx - 22, gy - 72 + bob], [cx + 22, gy - 72 + bob], [cx + 16, gy - 36], [cx - 16, gy - 36]], '#5a98f0');
    l.rect(cx - 6, gy - 66 + bob, 12, 20, '#e8fbff'); l.rect(cx - 3, gy - 60 + bob, 6, 8, '#ffffff');
    l.ell(cx - 36, gy - 72 + bob, 12, 11, '#2a4a8a'); l.ell(cx + 36, gy - 72 + bob, 12, 11, '#2a4a8a'); l.ell(cx - 36, gy - 74 + bob, 8, 6, '#6aa8ff'); l.ell(cx + 36, gy - 74 + bob, 8, 6, '#6aa8ff');
    l.cap(cx - 38, gy - 66 + bob, cx - 42, gy - 36, 7, 6, '#3a68c8'); l.cap(cx + 38, gy - 66 + bob, cx + 40 + en * 6, gy - 46 - en * 16, 7, 6, '#3a68c8');
    l.ell(cx, gy - 88 + bob, 13, 12, '#e8c8a0'); l.rect(cx - 13, gy - 94 + bob, 26, 7, '#2a4a8a'); l.poly([[cx - 14, gy - 94 + bob], [cx - 20, gy - 110 + bob], [cx - 8, gy - 96 + bob]], '#e8fbff'); l.poly([[cx + 14, gy - 94 + bob], [cx + 20, gy - 110 + bob], [cx + 8, gy - 96 + bob]], '#e8fbff');
    l.rect(cx + 38, gy - 52 + bob - en * 18, 6, 40, '#8a6a3a'); l.rect(cx + 30, gy - 64 + bob - en * 18, 22, 14, '#c8d8f0'); l.rect(cx + 32, gy - 62 + bob - en * 18, 18, 4, '#ffffff');
  }); sp.blit(b, 0, 0);
  sp.rect(cx - 7, gy - 90 + bob, 4, 3, '#ffffff'); sp.rect(cx + 3, gy - 90 + bob, 4, 3, '#ffffff'); sp.glow(cx - 5, gy - 89 + bob, 5, '#4affff', .6); sp.glow(cx + 5, gy - 89 + bob, 5, '#4affff', .6);
  const k = Math.floor(t * 8);
  for (let i = 0; i < 3 + Math.round(en * 4); i++) bolt(sp, cx + 41, gy - 64 + bob - en * 18, 4 + rnd(k + i) * 100, 8 + rnd(k * 3 + i) * 60, k * 7 + i * 3, ['#4a8aff', '#ffffff'], 1);
  if (en > 0) { sp.glow(cx + 41, gy - 64 - en * 18, 24, '#ffffff', .6 * en); }
};

D.solar = (sp, t, a) => {
  const en = a >= 0 ? E(a) : 0, bob = sin(t * TAU) * 2, cx = 56, cy = 58 + bob;
  rays(sp, cx, 40, 14, 54 + en * 10, 14, t, '#ffe14a', .5); sp.glow(cx, 40, 38, '#fff0a0', .5); sp.disc(cx, 40, 22, A('#ffb02e', .85)); sp.disc(cx, 40, 17, A('#ffe98a', .9));
  const fl = sin(t * TAU) * .5;
  const b = layer(l => {
    for (const d of [-1, 1]) l.poly([[cx + d * 10, cy], [cx + d * 30, cy - 24 - fl * 8], [cx + d * 52, cy - 14 - fl * 12], [cx + d * 44, cy + 2], [cx + d * 52, cy + 14], [cx + d * 30, cy + 10], [cx + d * 14, cy + 16]], '#f0a028');
    l.ell(cx, cy + 14, 16, 26, '#e89018'); l.ell(cx, cy + 20, 10, 20, '#fff0a0'); l.cap(cx, cy - 4, cx, cy - 22, 9, 8, '#e89018');
    l.ell(cx, cy - 26, 11, 9, '#ffc83a'); l.poly([[cx - 8, cy - 32], [cx - 14, cy - 48], [cx - 3, cy - 34]], '#fff0a0'); l.poly([[cx + 8, cy - 32], [cx + 14, cy - 48], [cx + 3, cy - 34]], '#fff0a0'); l.ell(cx, cy - 22, 6, 4, '#ffd978');
    l.cap(cx, cy + 30, cx - 22, cy + 44, 8, 3, '#e89018'); l.cap(cx - 22, cy + 44, cx - 32, cy + 30, 3, 1, '#ffe14a');
  }); sp.blit(b, 0, 0);
  sp.rect(cx - 6, cy - 29, 3, 3, '#ffffff'); sp.rect(cx + 3, cy - 29, 3, 3, '#ffffff'); sp.px(cx - 5, cy - 28, '#d8101a'); sp.px(cx + 4, cy - 28, '#d8101a');
  for (let i = 0; i < 6; i++) { const f = ((t * 2 + i / 6) % 1); sp.ell(cx + 8 + f * 40, cy - 22 + f * 14 + sin(i) * 4, 4 * (1 - f) + 1, 3 * (1 - f) + 1, A(i % 2 ? '#ffffff' : '#ffe14a', .9 * (1 - f))); }
  if (en > 0) { sp.rect(cx, cy - 24, 52, 8, A('#ffffff', .85 * en)); sp.rect(cx, cy - 22, 56, 4, A('#ffe14a', en)); sp.glow(cx + 40, cy - 20, 22, '#ffffff', .7 * en); }
  embers(sp, t, cx, cy + 40, 60, 60, 16, ['#ffe14a', '#ffffff']);
};

D.empress = (sp, t, a) => {
  const en = a >= 0 ? E(a) : 0, bob = sin(t * TAU) * 2, cx = 56, cy = 60 + bob;
  sp.glow(cx, 32, 46, '#9ab4ff', .35); sp.disc(cx, 30, 24, A('#e8f0ff', .22)); for (let k = 0; k < 360; k += 3) { const an = k / 57.3; sp.px(cx + cos(an) * 26, 30 + sin(an) * 26, A('#cfe0ff', .9)); }
  sp.disc(cx - 4, 30, 21, '#07061a' && A('#0b0a2a', .0));
  const b = layer(l => {
    l.poly([[cx - 20, cy + 46], [cx - 12, cy], [cx + 12, cy], [cx + 20, cy + 46]], '#3a3a9a'); l.poly([[cx - 14, cy + 44], [cx - 8, cy + 4], [cx + 8, cy + 4], [cx + 14, cy + 44]], '#6a6ae0'); l.rect(cx - 2, cy + 8, 4, 34, '#cfe0ff');
    for (const d of [-1, 1]) l.poly([[cx + d * 8, cy + 2], [cx + d * 28, cy - 22 - sin(t * TAU) * 4], [cx + d * 44, cy - 6], [cx + d * 30, cy + 8]], A('#8ab0ff', 1));
    l.ell(cx, cy - 4, 9, 11, '#e8e0f8'); l.ell(cx, cy - 22, 9, 9, '#f4ecff'); l.poly([[cx - 10, cy - 20], [cx - 22, cy + 22 + sin(t * TAU + 1) * 3], [cx - 8, cy + 16], [cx - 6, cy - 10]], '#c8d8ff'); l.poly([[cx + 10, cy - 20], [cx + 22, cy + 22 + sin(t * TAU + 2) * 3], [cx + 8, cy + 16], [cx + 6, cy - 10]], '#c8d8ff');
    l.poly([[cx - 9, cy - 28], [cx - 7, cy - 38], [cx - 3, cy - 31], [cx, cy - 42], [cx + 3, cy - 31], [cx + 7, cy - 38], [cx + 9, cy - 28]], '#e8f0ff');
    l.cap(cx + 12, cy - 2, cx + 26 + en * 8, cy - 16 - en * 6, 3, 3, '#cfe0ff');
  }); sp.blit(b, 0, 0);
  sp.rect(cx - 5, cy - 24, 3, 2, '#4a6aff'); sp.rect(cx + 2, cy - 24, 3, 2, '#4a6aff');
  const ox = cx + 28 + en * 8, oy = cy - 20 - en * 6; sp.glow(ox, oy, 14 + en * 14, '#ffffff', .8); sp.disc(ox, oy, 5, '#ffffff'); sp.disc(ox, oy, 3, '#bfe0ff');
  for (let i = 0; i < 14; i++) { const ph = (t + i / 14) % 1, an = i * 2.4; sp.px(cx + cos(an + t * TAU) * (20 + ph * 36), cy - 10 + sin(an * 1.3) * 30 - ph * 20, A('#ffffff', 1 - ph)); }
  if (en > 0) { rays(sp, ox, oy, 6, 40, 10, t, '#ffffff', .6 * en); ring(sp, ox, oy, 16 + en * 38, '#bfe0ff'); }
};

D.cerberus = (sp, t, a) => {
  const en = a >= 0 ? E(a) : 0, bob = sin(t * TAU) * 2, cx = 56, gy = 104;
  sp.glow(cx, 70, 52, '#ff3a1a', .3 + en * .2);
  const b = layer(l => {
    l.ell(cx, gy - 30, 34, 24 , '#3a1a1a'); l.ell(cx, gy - 28, 28, 18, '#5a2a22');
    for (const x of [-24, -8, 10, 26]) l.cap(cx + x, gy - 24, cx + x + (x % 2 ? 2 : -2), gy - 2, 6, 5, '#3a1a1a');
    for (const [dx, dy, s] of [[-24, 0, 1], [0, -8, 1.15], [24, 0, 1]]) { const hx = cx + dx, hy = gy - 62 + dy + bob * (dx ? .5 : 1) - (dx ? en * 6 : 0);
      l.cap(cx + dx * .5, gy - 44, hx, hy + 8, 8, 7, '#4a2020'); l.ell(hx, hy, 12 * s, 10 * s, '#5a2a22'); l.ell(hx + 2, hy + 8 * s, 9 * s, 6 * s, '#7a3a2a'); l.poly([[hx - 10 * s, hy - 6], [hx - 14 * s, hy - 20 * s], [hx - 4, hy - 9]], '#3a1a1a'); l.poly([[hx + 10 * s, hy - 6], [hx + 14 * s, hy - 20 * s], [hx + 4, hy - 9]], '#3a1a1a'); l.rect(hx - 6, hy + 11 * s, 3, 4, '#fff'); l.rect(hx + 3, hy + 11 * s, 3, 4, '#fff'); }
  }); sp.blit(b, 0, 0);
  for (const [dx, dy, s] of [[-24, 0, 1], [0, -8, 1.15], [24, 0, 1]]) { const hx = cx + dx, hy = gy - 62 + dy + bob * (dx ? .5 : 1) - (dx ? en * 6 : 0); sp.rect(hx - 7, hy - 3, 5, 3, '#ffe14a'); sp.rect(hx + 2, hy - 3, 5, 3, '#ffe14a'); sp.glow(hx - 5, hy - 2, 5, '#ff8a1a', .7); sp.glow(hx + 4, hy - 2, 5, '#ff8a1a', .7);
    for (let i = -2; i <= 2; i++) flame(sp, hx + i * 5, hy - 12 * s + Math.abs(i), 18 + en * 8 - Math.abs(i) * 3, 4, t, i + dx, ['#c81a10', '#ff6a1a', '#ffd24a']);
    if (en > 0) for (let i = 0; i < 9; i++) { const f = i / 9; sp.ell(hx + 8 + f * 36, hy + 12 + f * 10 + sin(i) * 2, 3 + f * 6, 2 + f * 4, A(f < .4 ? '#ffffff' : f < .7 ? '#ffd24a' : '#ff5a1a', .85 * en)); } }
  for (let i = 0; i < 4; i++) flame(sp, cx - 30 + i * 20, gy - 6, 14, 3, t, i + 9, ['#ff3a1a', '#ffb02e']);
  embers(sp, t, cx, gy - 40, 80, 70, 22, ['#ff9a2a', '#ffe14a']);
};

D.leviathan = (sp, t, a) => {
  const en = a >= 0 ? E(a) : 0, cx = 56;
  sp.glow(cx, 60, 54, '#2aa8ff', .3 + en * .2);
  const seg = (n, f) => { const k = n / 11; return [cx - 20 + sin(t * TAU + k * 5) * 6 + k * 40 * f, 100 - k * 70 + cos(k * 3) * 2]; };
  const b = layer(l => {
    for (let i = 10; i >= 0; i--) { const [x, y] = seg(i, 1), r = 12 - i * .6; l.ell(x, y, r, r * .8, i % 2 ? '#1a6ac8' : '#2a88e8'); l.ell(x, y + r * .3, r * .7, r * .4, '#9ae0ff'); if (i % 3 == 0) l.poly([[x - 3, y - r], [x, y - r - 8], [x + 3, y - r]], '#4affff'); }
    const [hx, hy] = seg(11, 1); const hh = hy - 6 - en * 4; l.ell(hx, hh, 14, 11, '#2a88e8'); l.ell(hx + 6, hh + 6, 12, 6 + en * 3, '#1a6ac8'); l.poly([[hx - 6, hh - 8], [hx - 14, hh - 22], [hx, hh - 10]], '#e8fbff'); l.poly([[hx + 6, hh - 8], [hx + 14, hh - 22], [hx + 2, hh - 10]], '#e8fbff'); if (en > .3) l.rect(hx - 2, hh + 6, 16, 4 * en, '#5a1020');
  }); sp.blit(b, 0, 0);
  const [hx, hy] = seg(11, 1), hh = hy - 6 - en * 4; sp.rect(hx - 6, hh - 3, 4, 3, '#ffffff'); sp.rect(hx + 3, hh - 3, 4, 3, '#ffffff'); sp.glow(hx - 4, hh - 2, 6, '#4affff', .8);
  for (let x = 0; x < S; x += 2) { const y = 100 + sin(x * .22 + t * TAU * 2) * 2; sp.rect(x, y, 2, 12, '#1a6ac8'); sp.rect(x, y, 2, 2, '#bfefff'); }
  for (let i = 0; i < 18; i++) { const ph = (t + rnd(i)) % 1; sp.px(10 + rnd(i * 5) * 92, 100 - ph * 70, A('#bfefff', 1 - ph)); }
  if (en > 0) { for (let i = 0; i < 10; i++) { const f = i / 10; sp.ell(hx + 10 + f * 36, hh + 8 + f * 18, 2 + f * 5, 2 + f * 4, A(i % 2 ? '#ffffff' : '#4affff', .8 * en)); } sp.glow(hx + 10, hh + 8, 20, '#bfefff', .6 * en); }
};

D.lich = (sp, t, a) => {
  const en = a >= 0 ? E(a) : 0, bob = sin(t * TAU) * 2, cx = 56, cy = 62 + bob;
  sp.glow(cx, 56, 50, '#3aff9a', .3 + en * .2);
  const b = layer(l => {
    l.poly([[cx - 26, cy + 46], [cx - 14, cy - 8], [cx + 14, cy - 8], [cx + 26, cy + 46 + sin(t * TAU) * 2], [cx + 12, cy + 38], [cx, cy + 48], [cx - 12, cy + 38]], '#1a2a4a'); l.poly([[cx - 16, cy + 40], [cx - 8, cy], [cx + 8, cy], [cx + 16, cy + 40]], '#2a4a7a');
    l.rect(cx - 8, cy + 4, 16, 3, '#e8f4ff'); l.rect(cx - 6, cy + 10, 12, 3, '#cfe0f0'); l.rect(cx - 5, cy + 16, 10, 3, '#cfe0f0');
    l.ell(cx, cy - 18, 12, 13, '#f0f4ff'); l.rect(cx - 6, cy - 8, 12, 5, '#f0f4ff'); l.rect(cx - 3, cy - 6, 2, 4, '#1a2a4a'); l.rect(cx + 1, cy - 6, 2, 4, '#1a2a4a');
    l.poly([[cx - 14, cy - 26], [cx - 15, cy - 42], [cx - 8, cy - 32], [cx - 4, cy - 46], [cx, cy - 33], [cx + 4, cy - 46], [cx + 8, cy - 32], [cx + 15, cy - 42], [cx + 14, cy - 26]], '#6ae0c8'); l.rect(cx - 14, cy - 28, 28, 3, '#3aaa90');
    l.cap(cx + 14, cy, cx + 34, cy - 8 - en * 8, 4, 3, '#cfe0f0'); l.rect(cx + 33, cy - 44 - en * 8, 4, 44, '#3a2a5a'); l.poly([[cx + 28, cy - 44 - en * 8], [cx + 35, cy - 56 - en * 8], [cx + 42, cy - 44 - en * 8]], '#6ae0c8');
  }); sp.blit(b, 0, 0);
  sp.rect(cx - 7, cy - 22, 5, 4, '#3aff9a'); sp.rect(cx + 2, cy - 22, 5, 4, '#3aff9a'); sp.glow(cx - 4, cy - 20, 7, '#3aff9a', .9); sp.glow(cx + 5, cy - 20, 7, '#3aff9a', .9);
  const oy = cy - 52 - en * 8; sp.glow(cx + 35, oy, 14 + en * 10, '#3aff9a', .8); sp.disc(cx + 35, oy, 4, '#ffffff');
  for (let i = 0; i < 5; i++) { const an = t * TAU + i * 1.26, r = 36 + sin(i) * 6, x = cx + cos(an) * r, y = cy - 6 + sin(an) * 12 - 6; flame(sp, x, y + 7, 12, 3, t, i, ['#2aaa6a', '#3aff9a', '#e8fff4']); sp.rect(x - 1, y - 2, 1, 1, '#0b2a1a'); sp.rect(x + 1, y - 2, 1, 1, '#0b2a1a'); }
  if (en > 0) { ring(sp, cx, cy + 20, 14 + en * 40, '#3aff9a'); sp.glow(cx, cy + 10, 44 * en, '#3aff9a', .3 * en); }
};

D.prism = (sp, t, a) => {
  const en = a >= 0 ? E(a) : 0, bob = sin(t * TAU) * 1.5, cx = 56, gy = 108;
  const hue = h => PX.hsl((h + t * 360) % 360, .85, .62);
  sp.glow(cx, 56, 52, hue(0), .28 + en * .2);
  const b = layer(l => {
    l.poly([[cx - 20, gy], [cx - 28, gy - 44], [cx, gy - 56], [cx + 28, gy - 44], [cx + 20, gy]], '#6a5ac8');
    l.poly([[cx - 22, gy - 48 + bob], [cx - 36, gy - 70 + bob], [cx - 20, gy - 84 + bob], [cx - 10, gy - 60 + bob]], '#8a7af0'); l.poly([[cx + 22, gy - 48 + bob], [cx + 36, gy - 70 + bob], [cx + 20, gy - 84 + bob], [cx + 10, gy - 60 + bob]], '#8a7af0');
    l.poly([[cx - 16, gy - 54 + bob], [cx, gy - 100 + bob - en * 4], [cx + 16, gy - 54 + bob], [cx + 8, gy - 38], [cx - 8, gy - 38]], '#b8a8ff');
    l.poly([[cx, gy - 98 + bob], [cx + 16, gy - 54 + bob], [cx + 4, gy - 54 + bob]], '#e8e0ff'); l.poly([[cx - 36, gy - 70], [cx - 52, gy - 56 + bob], [cx - 34, gy - 50 + bob]], '#8a7af0'); l.poly([[cx + 36, gy - 70], [cx + 52, gy - 56 + bob], [cx + 34, gy - 50 + bob]], '#8a7af0');
  }); sp.blit(b, 0, 0);
  for (let i = 0; i < 7; i++) { const x = cx - 18 + i * 6, y = gy - 70 + sin(i * 1.3) * 12 + bob; sp.poly([[x, y - 6], [x + 4, y], [x, y + 6], [x - 4, y]], A(hue(i * 50), .8)); sp.px(x - 1, y - 2, '#ffffff'); }
  sp.glow(cx, gy - 66 + bob, 16 + en * 16, '#ffffff', .8); sp.disc(cx, gy - 66 + bob, 5, '#ffffff'); rays(sp, cx, gy - 66 + bob, 6, 40 + en * 14, 12, t, hue(120), .6);
  for (let i = 0; i < 4; i++) { const an = t * TAU + i * 1.57, x = cx + cos(an) * 46, y = gy - 62 + sin(an) * 10; sp.poly([[x, y - 5], [x + 3, y], [x, y + 5], [x - 3, y]], hue(i * 90)); }
  if (en > 0) for (let i = 0; i < 6; i++) sp.line(cx, gy - 66 + bob, 4 + i * 20, 6 + (i % 2) * 20, A(hue(i * 60), .9 * en), 2);
};

D.magma = (sp, t, a) => {
  const en = a >= 0 ? E(a) : 0, bob = sin(t * TAU) * 1.5, cx = 56, gy = 108;
  sp.glow(cx, 66, 54, '#ff4a0a', .35 + en * .2);
  const b = layer(l => {
    l.poly([[cx - 26, gy], [cx - 32, gy - 36], [cx - 24, gy - 60 + bob], [cx + 24, gy - 60 + bob], [cx + 32, gy - 36], [cx + 26, gy]], '#3a1a14'); l.poly([[cx - 18, gy - 4], [cx - 22, gy - 38], [cx - 14, gy - 56 + bob], [cx + 14, gy - 56 + bob], [cx + 22, gy - 38], [cx + 18, gy - 4]], '#5a2a1c');
    l.ell(cx - 38, gy - 52 + bob, 12, 11, '#3a1a14'); l.ell(cx + 38, gy - 52 + bob, 12, 11, '#3a1a14'); l.cap(cx - 40, gy - 46 + bob, cx - 44, gy - 12, 9, 8, '#4a2218'); l.cap(cx + 40, gy - 46 + bob, cx + 44 + en * 4, gy - 14 - en * 26, 9, 8, '#4a2218'); l.ell(cx - 44, gy - 8, 10, 8, '#3a1a14'); l.ell(cx + 44 + en * 4, gy - 10 - en * 26, 10, 8, '#3a1a14');
    l.ell(cx, gy - 74 + bob, 15, 14, '#4a2218'); l.poly([[cx - 12, gy - 82 + bob], [cx - 18, gy - 98 + bob], [cx - 4, gy - 86 + bob]], '#2a100c'); l.poly([[cx + 12, gy - 82 + bob], [cx + 18, gy - 98 + bob], [cx + 4, gy - 86 + bob]], '#2a100c');
  }); sp.blit(b, 0, 0);
  const lv = (x0, y0, x1, y1) => { sp.line(x0, y0, x1, y1, '#ff5a1a', 2); sp.line(x0, y0, x1, y1, '#ffe14a', 1); };
  lv(cx - 10, gy - 52, cx - 6, gy - 30); lv(cx - 6, gy - 30, cx - 14, gy - 12); lv(cx + 8, gy - 54, cx + 12, gy - 34); lv(cx + 12, gy - 34, cx + 6, gy - 10); lv(cx - 30, gy - 40, cx - 24, gy - 26); lv(cx + 30, gy - 42, cx + 26, gy - 24); lv(cx - 4, gy - 44, cx + 4, gy - 40);
  sp.rect(cx - 8, gy - 78 + bob, 5, 4, '#ffe14a'); sp.rect(cx + 3, gy - 78 + bob, 5, 4, '#ffe14a'); sp.glow(cx, gy - 77 + bob, 12, '#ff9a2a', .8);
  for (let i = -3; i <= 3; i++) flame(sp, cx + i * 5, gy - 86 + Math.abs(i) * 2 + bob, 26 + en * 8 - Math.abs(i) * 3, 4, t, i, ['#c81a10', '#ff6a1a', '#ffd24a', '#ffffff']);
  for (const x of [-44, 44]) flame(sp, cx + x, gy - 62 + bob, 18, 4, t, x, ['#ff3a1a', '#ffb02e', '#ffe14a']);
  embers(sp, t, cx, gy - 30, 90, 80, 30, ['#ff9a2a', '#ffe14a', '#ff5a1a']);
  if (en > 0) { sp.rect(0, gy - 6, S, 6, A('#ff5a1a', .8 * en)); for (let i = 0; i < 6; i++) flame(sp, 10 + i * 18, gy, 30 * en, 6, t, i * 3, ['#ff3a1a', '#ffb02e', '#ffffff']); }
};

D.seraph = (sp, t, a) => {
  const en = a >= 0 ? E(a) : 0, bob = sin(t * TAU) * 2, cx = 56, cy = 56 + bob, fl = sin(t * TAU) * .5;
  sp.glow(cx, cy, 56, '#a24aff', .35 + en * .25); sp.disc(cx, cy, 34, A('#05020c', .85)); ring(sp, cx, cy, 40 + en * 6, '#d8a0ff', .7); rays(sp, cx, cy, 20, 54, 12, t, '#c880ff', .35);
  const wings = layer(l => { for (const d of [-1, 1]) for (let k = 0; k < 3; k++) { const yy = cy - 22 + k * 20, len = 46 - k * 6 + fl * 8 * (k ? -1 : 1); l.poly([[cx + d * 8, yy], [cx + d * len, yy - 10 + fl * 6], [cx + d * (len - 10), yy + 2], [cx + d * 10, yy + 12]], k === 1 ? '#6a2ad8' : '#e8d0ff'); } }); sp.blit(wings, 0, 0);
  const b = layer(l => { l.poly([[cx - 12, cy + 38], [cx - 10, cy - 8], [cx + 10, cy - 8], [cx + 12, cy + 38], [cx, cy + 46]], '#2a1450'); l.poly([[cx - 6, cy + 34], [cx - 5, cy - 4], [cx + 5, cy - 4], [cx + 6, cy + 34]], '#6a2ad8'); l.ell(cx, cy - 22, 11, 12, '#f4e8ff'); l.poly([[cx - 8, cy - 32], [cx - 10, cy - 44], [cx - 3, cy - 34]], '#ffd24a'); l.poly([[cx + 8, cy - 32], [cx + 10, cy - 44], [cx + 3, cy - 34]], '#ffd24a'); });
  sp.blit(b, 0, 0);
  sp.disc(cx, cy - 22, 6, '#05020c'); sp.ell(cx, cy - 22, 5, 3, '#ffffff'); sp.disc(cx, cy - 22, 2, '#a24aff'); sp.glow(cx, cy - 22, 12 + en * 10, '#ffffff', .8);
  for (let i = 0; i < 4; i++) { const an = t * TAU * (i % 2 ? -1 : 1) + i * 1.57, x = cx + cos(an) * 38, y = cy + sin(an) * 22; sp.glow(x, y, 8, '#d8a0ff', .8); sp.disc(x, y, 2.5, '#ffffff'); }
  const ox = cx, oy = cy + 8; sp.glow(ox, oy, 8 + en * 20, '#000000', .0); sp.disc(ox, oy, 5 + en * 6, '#05020c'); ring(sp, ox, oy, 8 + en * 20, '#ffffff', .9);
  if (en > 0) { for (const d of [-1, 1]) sp.poly([[cx, cy - 22], [cx + d * 54, cy - 30], [cx + d * 54, cy - 14]], A('#ffffff', .5 * en)); }
  embers(sp, t, cx, cy + 44, 70, 80, 18, ['#d8a0ff', '#ffffff']);
};

/* ------------------------------------------------ list */
const LIST = [
  { id: 'phoenix', name: 'ฟีนิกซ์เพลิงอมตะ', title: 'Eternal Phoenix', element: 'ไฟ', icon: 'fire', scene: 'dragon', lv: 1, col: '#ff7a2a', hp: 150000, atk: 1200, frag: { id: 'frag_phoenix', name: 'ขนนกเพลิงอมตะ', desc: 'ขนนกที่ยังลุกไหม้ไม่มีวันดับ', icon: 'feather' }, draw: D.phoenix },
  { id: 'titan', name: 'ไททันอสุนีบาต', title: 'Storm Titan', element: 'สายฟ้า', icon: 'bolt', scene: 'night', lv: 2, col: '#4aa8ff', hp: 220000, atk: 1900, frag: { id: 'frag_titan', name: 'แก่นสายฟ้าไททัน', desc: 'ผลึกสายฟ้าจากหัวใจไททัน', icon: 'bolt' }, draw: D.titan },
  { id: 'cerberus', name: 'เซอร์เบอรัสแห่งนรก', title: 'Hellfire Cerberus', element: 'ไฟนรก', icon: 'fire', scene: 'dungeon', lv: 3, col: '#ff3a1a', hp: 330000, atk: 2900, frag: { id: 'frag_cerberus', name: 'เขี้ยวสามเศียรนรก', desc: 'เขี้ยวของสุนัขสามหัวแห่งนรก', icon: 'demon' }, draw: D.cerberus },
  { id: 'leviathan', name: 'เลวีอาธานมหาสมุทร', title: 'Abyss Leviathan', element: 'น้ำ', icon: 'drop', scene: 'water', lv: 4, col: '#2aa8ff', hp: 480000, atk: 4300, frag: { id: 'frag_leviathan', name: 'เกล็ดมหาสมุทรลึก', desc: 'เกล็ดสีครามจากก้นมหาสมุทร', icon: 'drop' }, draw: D.leviathan },
  { id: 'empress', name: 'จันทราจักรพรรดินี', title: 'Lunar Empress', element: 'จันทรา', icon: 'star', scene: 'night', lv: 5, col: '#9ab4ff', hp: 710000, atk: 6500, frag: { id: 'frag_empress', name: 'เศษจันทราสะท้อนแสง', desc: 'เศษพระจันทร์ที่ส่องสว่างในความมืด', icon: 'star' }, draw: D.empress },
  { id: 'lich', name: 'ราชาลิชวิญญาณ', title: 'Soul Lich King', element: 'วิญญาณ', icon: 'demon', scene: 'ruins', lv: 6, col: '#3aff9a', hp: 1050000, atk: 9500, frag: { id: 'frag_lich', name: 'กระดูกวิญญาณมรกต', desc: 'กระดูกที่ผนึกวิญญาณนับพัน', icon: 'demon' }, draw: D.lich },
  { id: 'solar', name: 'มังกรสุริยะทอง', title: 'Solar Dragon', element: 'แสง', icon: 'star', scene: 'desert', lv: 7, col: '#ffd24a', hp: 1550000, atk: 14000, frag: { id: 'frag_solar', name: 'เกล็ดสุริยะทอง', desc: 'เกล็ดที่ดูดกลืนแสงอาทิตย์', icon: 'crown' }, draw: D.solar },
  { id: 'magma', name: 'ยักษ์หินลาวา', title: 'Magma Colossus', element: 'ลาวา', icon: 'fire', scene: 'worldboss', lv: 8, col: '#ff4a0a', hp: 2300000, atk: 21000, frag: { id: 'frag_magma', name: 'แก่นลาวาหลอมละลาย', desc: 'หินหลอมเหลวจากใจกลางภูเขาไฟ', icon: 'fire' }, draw: D.magma },
  { id: 'prism', name: 'โคลอสซัสปริซึม', title: 'Prism Colossus', element: 'สายรุ้ง', icon: 'rainbow', scene: 'snow', lv: 9, col: '#b8a8ff', hp: 3400000, atk: 31000, frag: { id: 'frag_prism', name: 'ปริซึมเจ็ดสี', desc: 'ผลึกที่แตกแสงเป็นเจ็ดสี', icon: 'gem' }, draw: D.prism },
  { id: 'seraph', name: 'เซราฟว่างเปล่า', title: 'Void Seraph', element: 'ความว่างเปล่า', icon: 'star', scene: 'worldboss', lv: 10, col: '#a24aff', hp: 5000000, atk: 46000, frag: { id: 'frag_seraph', name: 'ปีกแห่งความว่างเปล่า', desc: 'ปีกที่กลืนกินแสงทุกชนิด', icon: 'wind' }, draw: D.seraph },
];
const BY = {}, BYNAME = {}; LIST.forEach(b => { BY[b.id] = b; BYNAME[b.name] = b; });

/* ------------------------------------------------ frame table */
const cache = {};
function frame(b, mode, i, n) {
  const sp = new Sp(S, S); let t = 0, a = -1;
  if (mode === 'idle') t = i / n; else if (mode === 'attack') { a = (i + .5) / n; t = i / n * .3; } else t = .1;
  b.draw(sp, t, a);
  if (mode === 'hurt') { sp.tint('#ff3a3a', i === 0 ? .55 : .3); const m = new Sp(S, S); m.blit(sp, i === 0 ? 2 : -1, 0); return m; }
  if (mode === 'die') { const k = (i + 1) / n, m = new Sp(S, S); for (let y = 0; y < S; y++) { const sy = Math.floor(S - 1 - (S - 1 - y) / (1 - k * .8)); if (sy < 0 || sy >= S) continue; for (let x = 0; x < S; x++) { const c = sp.d[sy * S + x]; if (c >>> 24) m.d[y * S + x] = c; } } m.alphaMul(1 - k * .85); return m; }
  return sp;
}
function table(id) {
  const b = BY[id] || BYNAME[id]; if (!b) return null; if (cache[b.id]) return cache[b.id];
  const v = { name: b.name, S, boss: true, plan: 'worldboss', idle: [], attack: [], hurt: [], die: [] };
  for (let i = 0; i < 8; i++) v.idle.push(frame(b, 'idle', i, 8)); for (let i = 0; i < 6; i++) v.attack.push(frame(b, 'attack', i, 6));
  for (let i = 0; i < 2; i++) v.hurt.push(frame(b, 'hurt', i, 2)); for (let i = 0; i < 6; i++) v.die.push(frame(b, 'die', i, 6));
  return cache[b.id] = v;
}
function reg(id) {
  const b = BY[id] || BYNAME[id]; if (!b) return null; const key = 'wb28|' + b.id; if (PX.anim.has(key)) return PX.anim.get(key).first;
  const t = table(b.id); return PX.anim.reg(key, { idle: [...t.idle, ...t.idle, ...t.attack] }, { fps: 8 });
}
/* deterministic per-slot choice: every player gets the same boss for the same 3-hour event key */
function pick(eventKey) { let h = 0; const s = String(eventKey || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return LIST[h % LIST.length]; }

/* the arena + codex ask PX.creatures for sprites by NAME → alias our names so they work everywhere */
if (PX.creatures) {
  const t0 = PX.creatures.table, r0 = PX.creatures.reg;
  PX.creatures.table = n => BYNAME[n] ? table(n) : t0(n);
  PX.creatures.reg = n => BYNAME[n] ? reg(n) : r0(n);
  LIST.forEach(b => { PX.creatures.TABLE[b.name] = { plan: 'worldboss', boss: 1, c: {}, S }; });
}
PX.worldBosses = { LIST, get: id => BY[id], byName: n => BYNAME[n], table, reg, pick, S };
})();
