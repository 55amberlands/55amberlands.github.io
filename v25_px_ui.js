/* 55 AMBERLANDS V25 — NEW PIXEL ASSETS for the new systems (drawn by code)
 *  emotes (8 x 6 frames) · full boss-set aura (rainbow / fire / ice, 10 frames) · monster cards (3 rarities + rainbow boss, holo shimmer)
 *  sparkle stars (title plate glitter) · reward tiles · share-card background
 */
(() => {
'use strict';
const PX = window.PX; if (!PX || !PX.shop) return;
const { Sp, mix } = PX;
const sin = Math.sin, cos = Math.cos, PI = Math.PI, TAU = PI * 2;
const UI = PX.ui = {};

/* ---------------- EMOTES ---------------- */
const EMO = {
  heart:    { th: 'รัก',     c: '#ff4a6a', g: (s, c, t) => { s.ell(6.5, 7, 2.6, 2.6, c); s.ell(11.5, 7, 2.6, 2.6, c); s.poly([[4, 8.5], [14, 8.5], [9, 14.5]], c); s.px(6, 6, '#ffffff'); } },
  exclaim:  { th: 'ตกใจ',    c: '#ffd24a', g: (s, c) => { s.rect(8, 3, 3, 7, c); s.rect(8, 12, 3, 3, c); } },
  question: { th: 'งง',      c: '#7ad8ff', g: (s, c) => { s.rect(6, 4, 6, 2, c); s.rect(11, 5, 2, 4, c); s.rect(8, 8, 4, 2, c); s.rect(8, 10, 2, 2, c); s.rect(8, 13, 2, 2, c); } },
  sweat:    { th: 'เหงื่อตก', c: '#7ad8ff', g: (s, c) => { s.poly([[9, 3], [13, 10], [12, 13], [9, 14.5], [6, 13], [5, 10]], c); s.px(8, 10, '#ffffff'); } },
  anger:    { th: 'โกรธ',    c: '#ff4a3a', g: (s, c) => { for (const [x, y] of [[5, 5], [12, 5], [5, 11], [12, 11]]) { s.rect(x, y, 2, 2, c); s.rect(x + (x < 9 ? 2 : -2), y, 1, 1, c); } s.rect(8, 8, 3, 3, c); } },
  star:     { th: 'เจ๋ง',    c: '#ffe14a', g: (s, c) => { s.poly([[9, 2], [11, 7], [16, 7.5], [12, 11], [13.5, 16], [9, 13], [4.5, 16], [6, 11], [2, 7.5], [7, 7]], c); s.px(8, 7, '#ffffff'); } },
  zzz:      { th: 'ง่วง',    c: '#b9a8ff', g: (s, c) => { s.rect(4, 4, 5, 1, c); s.rect(7, 5, 1, 1, c); s.rect(6, 6, 1, 1, c); s.rect(4, 7, 5, 1, c); s.rect(9, 9, 5, 1, c); s.rect(12, 10, 1, 1, c); s.rect(11, 11, 1, 1, c); s.rect(9, 12, 5, 1, c); } },
  note:     { th: 'สนุก',    c: '#7dff9a', g: (s, c) => { s.ell(6, 13, 2.6, 2, c); s.rect(8, 4, 1.5, 9, c); s.rect(8, 4, 6, 2, c); s.ell(13, 11, 2.2, 1.8, c); s.rect(13.5, 5, 1.2, 6, c); } }
};
UI.EMOTES = Object.keys(EMO); UI.emoteName = id => EMO[id] && EMO[id].th;
function emoteFrame(id, i, n) {
  const e = EMO[id], S = 22, sp = new Sp(S, S), t = i / n, bob = Math.round(sin(t * TAU) * 1), pulse = 1 + (i % 3 === 0 ? .0 : 0);
  const d = new Sp(S, S);
  d.ell(10.5, 9.5, 9, 8, '#ffffff'); d.poly([[6, 15], [9, 19], [12, 15.5]], '#ffffff');                // bubble + tail
  sp.blit(d, 0, 0, { rim: true });
  const g = new Sp(S, S); e.g(g, e.c, t); g.shade(null, { R: 1 });
  const out = new Sp(S, S + 2); out.blit(sp, 0, 1 + bob); out.blit(g, 1, 1 + bob - 0, { rim: false });
  if (i % 3 === 0) { out.px(1, 2 + bob, '#fff1a0'); out.px(20, 3 + bob, '#fff1a0'); }
  return out;
}
UI.emoteURL = id => { const key = 'emote|' + id; if (PX.anim.has(key)) return PX.anim.get(key).first; return PX.anim.reg(key, Array.from({ length: 6 }, (_, i) => emoteFrame(id, i, 6)), { fps: 8 }); };

/* ---------------- FULL BOSS-SET AURA ---------------- */
const AURA = {
  rainbow: { hue: i => i, glow: '#ffffff' },
  fire:    { cols: ['#ff3a1a', '#ff9a2a', '#ffe14a', '#ffffff'] },
  ice:     { cols: ['#3a78ff', '#7ad8ff', '#c8f4ff', '#ffffff'] }
};
function auraFrame(kind, f, n) {
  const W = 72, H = 110, sp = new Sp(W, H), k = f / n, cx = W / 2, r = PX.rng(5 + f);
  const cc = (y, x) => {                              // colour at position
    if (kind === 'rainbow') return PX.hsl(((y / H) * 300 + k * 360 + x * 2) % 360, .9, .62);
    const c = AURA[kind].cols, v = Math.min(3, Math.floor(((H - y) / H) * 3.2 + Math.abs(x - cx) / W)); return c[v];
  };
  for (let y = 4; y < H - 6; y++) {                  // column of light (soft, dithered edge)
    const t = y / H, wmax = 11 + 13 * Math.pow(1 - t, .6) + sin(t * 9 + k * TAU) * 2;
    for (let x = 0; x < W; x++) { const dx = Math.abs(x - cx), a = 1 - dx / wmax; if (a <= 0) continue; const th = a > .66 ? 1 : a > .33 ? .6 : .3; if (th < 1 && ((x + y) & 1)) continue; sp.px(x, y, PX.alpha(cc(y, x), th * (.4 + .5 * (1 - t)))); }
  }
  for (const [rr, a, off] of [[27, .9, 0], [20, .6, .3], [14, .5, .6]]) {       // rotating rings at feet
    const ry = rr * .26, cy = H - 14;
    for (let q = 0; q < rr * 7; q++) { const ang = q / (rr * 7) * TAU + k * TAU * (off ? -1 : 1); const x = cx + cos(ang) * rr, y = cy + sin(ang) * ry; const front = sin(ang) > 0; sp.px(x, y, PX.alpha(cc(y, x), front ? a : a * .5)); if (front && (q % 4 === 0)) sp.px(x, y - 1, '#ffffff'); }
  }
  for (let i = 0; i < 16; i++) {                      // rising stars
    const ph = (k * 1.0 + i / 16) % 1, x = cx + Math.sin(i * 2.4 + ph * 6) * (8 + (i % 4) * 5), y = H - 10 - ph * (H - 16);
    sp.px(x, y, '#ffffff'); if (i % 3 === 0) { sp.px(x - 1, y, cc(y, x)); sp.px(x + 1, y, cc(y, x)); sp.px(x, y - 1, cc(y, x)); sp.px(x, y + 1, cc(y, x)); }
  }
  // crown glint above head
  const gy = 6 + Math.round(sin(k * TAU) * 1.5); for (let q = -4; q <= 4; q++) { sp.px(cx + q, gy, Math.abs(q) < 2 ? '#ffffff' : cc(gy, cx + q)); } sp.px(cx, gy - 1, '#ffffff'); sp.px(cx, gy + 1, '#ffffff'); sp.px(cx, gy - 2, cc(gy, cx)); sp.px(cx, gy + 2, cc(gy, cx));
  return sp;
}
UI.auraURL = kind => { const key = 'aura|' + kind; if (PX.anim.has(key)) return PX.anim.get(key).first; return PX.anim.reg(key, Array.from({ length: 10 }, (_, i) => auraFrame(kind, i, 10)), { fps: 10 }); };

/* ---------------- MONSTER CARDS ---------------- */
const RAR = {
  1: { name: 'ทองแดง', a: '#e8a060', b: '#7a4020', hi: '#ffd6a8' },
  2: { name: 'เงิน',    a: '#e4ecf8', b: '#6a7890', hi: '#ffffff' },
  3: { name: 'ทอง',     a: '#ffe14a', b: '#a8741a', hi: '#fff8c0' },
  4: { name: 'รุ้ง',    a: '#ffffff', b: '#6a3aa8', hi: '#ffffff' }
};
UI.RARITY = RAR;
const CW = 80, CH = 104;
function cardFrame(name, tier, f, n, locked) {
  const R = RAR[Math.max(1, Math.min(4, tier || 1))], sp = new Sp(CW, CH), k = f / n, rain = tier >= 4;
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    let c;
    if (rain) { const v = ((x + y) / (CW + CH) * 2 + 1 - k) % 1; c = PX.hsl(v * 360, .8, .62); } else c = mix(R.b, mix(R.a, '#ffffff', .1), 1 - y / CH * .8);
    sp.px(x, y, locked ? mix('#2a2438', '#463c5c', 1 - y / CH) : mix(c, '#150a28', Math.min(.5, Math.pow(Math.hypot(x - CW / 2, y - CH * .45) / (CH * .75), 2) * .5)));
  }
  const t = PX.creatures.table(name), fr = t.idle[f % t.idle.length], bb = fr.bbox ? fr.bbox() : { x: 0, y: 0, w: fr.w, h: fr.h };
  let crop = bb && bb.w ? fr.crop(bb.x, bb.y, bb.w, bb.h) : fr;
  const sc = Math.max(1, Math.min(3, Math.floor(Math.min(64 / crop.w, 62 / crop.h))));
  if (sc > 1) { const big = new Sp(crop.w * sc, crop.h * sc); for (let y = 0; y < big.h; y++) for (let x = 0; x < big.w; x++) big.d[y * big.w + x] = crop.get(Math.floor(x / sc), Math.floor(y / sc)); crop = big; }
  const ox = Math.round((CW - crop.w) / 2), oy = Math.round(CH * .5 - crop.h / 2) + 2;
  if (locked) { const s = new Sp(crop.w, crop.h); for (let i = 0; i < s.d.length; i++) if (crop.d[i] >>> 24) s.d[i] = 0xff1a1424; sp.blit(s, ox, oy); }
  else { const g = new Sp(CW, CH); g.glow(CW / 2, CH * .5, 30, rain ? '#ffffff' : R.hi, .22); g.blit(sp, 0, 0); sp.d.set(g.d); sp.blit(crop, ox, oy, { rim: true }); }
  sp.ell(CW / 2, oy + crop.h + 1, Math.min(26, crop.w * .45), 3, PX.alpha('#000000', .28));
  const edge = locked ? '#5a4e72' : rain ? PX.hsl((k * 360) % 360, .9, .8) : R.hi;                // frame
  for (let i = 0; i < CW; i++) { sp.px(i, 0, '#120a20'); sp.px(i, CH - 1, '#120a20'); sp.px(i, 1, edge); sp.px(i, CH - 2, R.b); }
  for (let i = 0; i < CH; i++) { sp.px(0, i, '#120a20'); sp.px(CW - 1, i, '#120a20'); sp.px(1, i, edge); sp.px(CW - 2, i, R.b); }
  if (!locked && tier >= 2) {                         // holo sweep + glitter on silver+
    const gx = ((k * 1.5) % 1) * (CW + CH) - 20;
    for (let y = 2; y < CH - 2; y++) for (let q = 0; q < 3; q++) { const x = gx - y + q; if (x > 1 && x < CW - 2) sp.px(x, y, q === 1 ? '#ffffffbb' : '#ffffff55'); }
    const r = PX.rng(31 + name.length); for (let i = 0; i < 10 + tier * 4; i++) { const x = 3 + Math.floor(r() * (CW - 6)), y = 3 + Math.floor(r() * (CH - 6)), a = Math.max(0, sin((k + r()) * TAU)); if (a > .7) { sp.px(x, y, '#ffffff'); sp.px(x - 1, y, '#ffffffbb'); sp.px(x + 1, y, '#ffffffbb'); sp.px(x, y - 1, '#ffffffbb'); sp.px(x, y + 1, '#ffffffbb'); } }
  }
  return sp;
}
UI.cardURL = (name, tier, locked) => {
  const key = ['card', name, locked ? 'L' : tier].join('|'); if (PX.anim.has(key)) return PX.anim.get(key).first;
  const N = (locked || tier < 2) ? 1 : 8;
  return PX.anim.reg(key, Array.from({ length: N }, (_, i) => cardFrame(name, tier, i, 8, locked)), { fps: 8, static: N === 1 });
};

/* ---------------- SPARKLE STAR (title glitter) ---------------- */
UI.sparkURL = () => {
  const key = 'spark'; if (PX.anim.has(key)) return PX.anim.get(key).first;
  const fr = []; for (let f = 0; f < 6; f++) { const s = new Sp(13, 13), L = [1, 3, 5, 6, 4, 2][f]; for (let q = -L; q <= L; q++) { const w = Math.abs(q) < 2 ? '#ffffff' : '#fff1a0'; s.px(6 + q, 6, w); s.px(6, 6 + q, w); } s.px(6, 6, '#ffffff'); if (L > 3) for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) s.px(6 + dx, 6 + dy, '#ffffffaa'); fr.push(s); }
  return PX.anim.reg(key, fr, { fps: 9 });
};

/* ---------------- tiles for rewards ---------------- */
UI.rewardTile = (iconName, kind, size = 40) => {
  const key = ['rt', iconName, kind, size].join('|'); if (PX.anim.has(key)) return PX.anim.get(key).first;
  const ic = PX.items.icon(iconName) || PX.shop.goodsSp(iconName), fr = [];
  for (let f = 0; f < 8; f++) { const t = kind === 'rain' ? PX.items.rainbowTile(size, f, 8) : PX.shop.goodsTile(size, f, 8); t.blit(ic, Math.round((size - ic.w) / 2), Math.round((size - ic.h) / 2)); fr.push(t); }
  return PX.anim.reg(key, fr, { fps: 7 });
};
})();
