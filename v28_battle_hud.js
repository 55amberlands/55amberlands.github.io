/* 55 AMBERLANDS V28 — battle HUD, weapon-enhancement aura (+7..+10), live announcements
 *  1. Aura for ALL weapons (sword / fist / bow / staff) at +7 +8 +9 +10 on the hero sprites in the battle scene (the old aura sat on a hidden image)
 *  2. Level + rebirth count on every hero label, a Lv/rebirth chip, and quick buttons: use HP potion / MP potion / AUTO-potion on-off
 *     (also inside dungeon boss rooms)
 *  3. Announcements: someone defeats a world boss, or gets a +7 / +8 / +9 / +10 weapon or armour (sent over the existing game room, NOT Supabase)
 *  CLIENT ONLY. Visual / UI only. No SQL, no save format change.
 */
(() => {
'use strict';
const PX = window.PX; if (!PX) return;
const $ = id => document.getElementById(id), TAU = Math.PI * 2, sin = Math.sin, cos = Math.cos;
const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safe = (f, d) => { try { return f(); } catch (e) { return d; } };
const ST = () => safe(() => state, null);
const ico = k => safe(() => PX.uiSkin.icon(k), '');
const fmt = n => safe(() => Number(n).toLocaleString('th-TH'), String(n));

/* ============================================================ A. enhancement aura sheets (8 frames, smooth additive light) */
const AW = 160, AH = 176;
const hexRgb = h => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const rgba = (h, a) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`; };
const hsl = (h, s, l) => { s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join(''); };
function glow(g, x, y, r, col, a) { const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, rgba(col, a)); q.addColorStop(.4, rgba(col, a * .4)); q.addColorStop(1, rgba(col, 0)); g.fillStyle = q; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
function bolt(g, x0, y0, x1, y1, seed, col, w) { let s = seed; const R = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; const pts = [[x0, y0]]; for (let i = 1; i < 6; i++) { const f = i / 6; pts.push([x0 + (x1 - x0) * f + (R() - .5) * 18, y0 + (y1 - y0) * f + (R() - .5) * 18]); } pts.push([x1, y1]); g.lineJoin = 'round'; g.lineCap = 'round'; g.shadowColor = col; g.shadowBlur = 10; for (const [c, ww] of [[col, w * 2.4], ['#ffffff', w * .8]]) { g.strokeStyle = c === '#ffffff' ? '#fff' : rgba(c, .8); g.lineWidth = ww; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); } g.shadowBlur = 0; }
function flame(g, x, y, h, w, cols, t, sd) { const sw = sin(t * TAU * 2 + sd) * w * .35; cols.forEach((c, i) => { const k = 1 - i * .3; g.fillStyle = rgba(c, .8); g.beginPath(); g.moveTo(x - w * k, y); g.quadraticCurveTo(x - w * k, y - h * k * .5, x + sw * k, y - h * k); g.quadraticCurveTo(x + w * k, y - h * k * .5, x + w * k, y); g.closePath(); g.fill(); }); }
const HANDS = { 'หมัด': [[.2, .64], [.8, .64]], 'ดาบ': [[.84, .5]], 'ธนู': [[.82, .5]], 'จอมเวท': [[.82, .36]] };
const SHEETS = {};
function aura(tier, cls) {
  const key = tier + '|' + cls; if (SHEETS[key]) return SHEETS[key];
  const cv = document.createElement('canvas'); cv.width = AW * 8; cv.height = AH; const g = cv.getContext('2d');
  const pts = HANDS[cls] || HANDS['ดาบ'];
  for (let f = 0; f < 8; f++) {
    g.save(); g.translate(f * AW, 0); g.beginPath(); g.rect(0, 0, AW, AH); g.clip(); g.globalCompositeOperation = 'lighter';
    const t = f / 8, pulse = .75 + .25 * sin(t * TAU);
    const main = tier >= 10 ? hsl((t * 360) % 360, 100, 62) : tier === 9 ? '#ff5a1a' : tier === 8 ? '#a45cff' : '#ffd24a';
    const sub = tier >= 10 ? '#ffffff' : tier === 9 ? '#ffe14a' : tier === 8 ? '#e0b8ff' : '#fff3b0';
    if (tier >= 8) { glow(g, AW / 2, AH * .55, AW * .5, main, .16 * pulse); }
    if (tier >= 9) { glow(g, AW / 2, AH * .55, AW * .42, sub, .12 * pulse); }
    pts.forEach(([px, py], pi) => {
      const x = px * AW, y = py * AH;
      glow(g, x, y, 34 * pulse + tier, main, .85); glow(g, x, y, 17 * pulse, sub, .9); glow(g, x, y, 7, '#ffffff', .95);
      for (let i = 0; i < 5 + tier; i++) { const ph = (t + i / (5 + tier)) % 1, an = i * 2.4 + pi + t * TAU * (tier >= 8 ? 1 : .5), rr = 14 + 22 * ph; g.fillStyle = rgba(i % 2 ? sub : main, 1 - ph); g.fillRect(x + cos(an) * rr - 1.5, y + sin(an) * rr - ph * 16 - 1.5, 3, 3); }
      if (tier >= 8) { const n = tier >= 10 ? 3 : 2; for (let b = 0; b < n; b++) { const an = (f * 1.7 + b * 2.1 + pi) % TAU, L = 30 + (b % 2) * 14; bolt(g, x, y, x + cos(an) * L, y + sin(an) * L, f * 97 + b * 31 + pi * 7 + 5, main, 1.2); } }
      if (tier >= 9) { for (let i = -2; i <= 2; i++) flame(g, x + i * 7, y + 6, 36 - Math.abs(i) * 6, 6, [main, sub, '#ffffff'], t, i + pi); }
      if (tier >= 10) { for (let i = 0; i < 10; i++) { const an = i / 10 * TAU + t * TAU * .5; g.strokeStyle = rgba('#ffffff', .35 * pulse); g.lineWidth = 2; g.beginPath(); g.moveTo(x + cos(an) * 10, y + sin(an) * 10); g.lineTo(x + cos(an) * 44, y + sin(an) * 44); g.stroke(); } }
    });
    if (tier >= 8) { for (let i = 0; i < 6; i++) { const ph = (t + i / 6) % 1, x = AW * (.28 + .44 * ((i * .37) % 1)); g.fillStyle = rgba(i % 2 ? sub : main, (1 - ph) * .9); g.fillRect(x, AH * .95 - ph * AH * .7, 2.5, 2.5); } }
    g.restore();
  }
  return SHEETS[key] = cv.toDataURL('image/png');
}
function enhOf(i) {
  const st = ST(); if (!st) return null;
  if (i === 0) { const g = (st.gear || []).find(x => String(x.id) === String(st.eq && st.eq.W)); const wi = safe(() => window.AMBER_V12.weaponInfo(), null); const e = g ? g.enh | 0 : wi ? wi.enh | 0 : 0; const cls = g ? g.cls : wi ? wi.cls : 'ดาบ'; return { e, cls: cls || 'ดาบ', ult: /ตำนานบอสโลก/.test(String((g && g.name) || (wi && wi.name) || '')) }; }
  const p = (window.AMBER_SCENE_PLAYERS || [])[i - 1]; if (!p) return null; return { e: p.we | 0, cls: p.wt || 'ดาบ', ult: /ตำนานบอสโลก/.test(String(p.w || '')) };
}
function paintAura() {
  document.querySelectorAll('#sprites .sprite').forEach((el, i) => {
    const d = enhOf(i), tier = d ? Math.min(10, d.e) : 0; let o = el.querySelector(':scope > .px28-enh');
    if (tier < 7) { if (o) o.remove(); return; }
    const ultOn = !!(d.ult && tier >= 10 && window.PX && PX.ultWeapons); const key = tier + '|' + d.cls + (ultOn ? '|U' : ''); if (o && o.dataset.k === key) return; if (!o) { o = document.createElement('i'); o.className = 'px28-enh'; o.setAttribute('aria-hidden', 'true'); el.appendChild(o); }
    o.dataset.k = key; o.style.backgroundImage = `url(${ultOn ? PX.ultWeapons.aura(d.cls) : aura(tier, d.cls)})`; o.dataset.tier = ultOn ? 11 : tier;
  });
}

/* ============================================================ B. HUD: level / rebirth / quick potions */
const reb = () => safe(() => window.AMBER_V25.V().rebirth | 0, 0);
function labels() {
  const st = ST(); if (!st) return;
  document.querySelectorAll('#sprites .sprite').forEach((el, i) => {
    const sm = el.querySelector(':scope > small'); if (!sm) return;
    let lv = null, rb = 0; if (i === 0) { lv = st.lv; rb = reb(); } else { const p = (window.AMBER_SCENE_PLAYERS || [])[i - 1]; if (p) { lv = p.lv || p.level; rb = p.rb | 0; } }
    if (lv == null) return; const sig = lv + '|' + rb + '|' + sm.textContent.replace(/^Lv.*?\s/, '');
    if (sm.dataset.px28 === sig) return; const nm = sm.dataset.nm || sm.textContent.replace(/^\s*Lv\.\d+\s*(⟲\d+\s*)?/, ''); sm.dataset.nm = nm;
    sm.innerHTML = `<span class="px28-lv">Lv.${esc(lv)}</span>${rb ? `<span class="px28-rb"><img src="${ico('loop')}" alt="">${rb}</span>` : ''} ${esc(nm)}`; sm.dataset.px28 = lv + '|' + rb + '|' + nm;
  });
}
const chipHTML = () => { const st = ST(); if (!st) return ''; const rb = reb(); return `<span class="px28-chip"><img src="${ico('crown')}" alt="">Lv.<b>${esc(st.lv)}</b></span><span class="px28-chip rb"><img src="${ico('loop')}" alt="">เกิดใหม่ <b>${rb}</b>/10</span>`; };
const quickHTML = () => { const st = ST(); if (!st) return ''; return `<button type="button" data-px28="php" class="px28-q hp"><img src="${ico('potion')}" alt=""><b>${fmt(st.potHP | 0)}</b></button><button type="button" data-px28="pmp" class="px28-q mp"><img src="${ico('potionB')}" alt=""><b>${fmt(st.potMP | 0)}</b></button><button type="button" data-px28="pauto" class="px28-q auto${st.autopot ? ' on' : ''}"><img src="${ico('bolt')}" alt="">AUTO ยา <b>${st.autopot ? 'ON' : 'OFF'}</b></button>`; };
function paintHud() {
  const st = ST(), info = document.querySelector('.top .statsline'); if (!st || !info) return;
  let h = $('px28Hud'); if (!h) { h = document.createElement('div'); h.id = 'px28Hud'; }
  if (h.parentNode !== info) info.appendChild(h);
  // The original Lv/Rebirth and potion bar below the scene were redundant.
  // Keep real potion/AUTO buttons, but render ONE compact bar inside the profile.
  const html = `<div class="px28-hq">${quickHTML()}</div>`; if (h.dataset.s !== html) { h.dataset.s = html; h.innerHTML = html; }
  const dg = document.querySelector('#modalBody .amber23-dungeonBoss'); if (dg) { let d = dg.querySelector('.px28-dg'); const hh = `<div class="px28-dg">${chipHTML()}<span class="sp"></span>${quickHTML()}</div>`; if (!d) dg.insertAdjacentHTML('afterbegin', hh); else if (d.outerHTML !== hh) { const n = document.createElement('div'); n.innerHTML = hh; d.replaceWith(n.firstChild); } }
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-px28]'); if (!b) return; const st = ST(); if (!st) return; e.preventDefault(); e.stopPropagation();
  const a = b.dataset.px28;
  if (a === 'php') safe(() => usePotion('hp')); else if (a === 'pmp') safe(() => usePotion('mp'));
  else if (a === 'pauto') { st.autopot = !st.autopot; const c = $('autoPotion'); if (c) c.checked = st.autopot; safe(() => save()); safe(() => notify('AUTO ยา ' + (st.autopot ? 'เปิด' : 'ปิด'))); }
  paintHud();
}, true);

/* ============================================================ C. announcements */
const root = document.createElement('div'); root.id = 'px28Ann'; (document.body || document.documentElement).appendChild(root);
const seen = new Set();
function announce(html, kind, icon) {
  const d = document.createElement('div'); d.className = 'px28-ann ' + (kind || ''); d.innerHTML = `<img src="${ico(icon || 'trophy')}" alt=""><div>${html}</div>`;
  root.appendChild(d); while (root.children.length > 3) root.firstChild.remove(); setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 600); }, 7500);
  safe(() => log(d.textContent.replace(/\s+/g, ' ').trim(), 'good'));
}
let R = null, Rp = null;
const getR = () => R ? Promise.resolve(R) : (!window.claude || !claude.use) ? Promise.resolve(null) : Rp || (Rp = claude.use('room').then(r => (R = r), () => null));
const emit = (evt, data) => getR().then(r => r && r.emit && r.emit(evt, data).catch(() => { }));
const lastFrom = {};
getR().then(r => r && r.on && r.on('v28ann', m => safe(() => {
  const d = m && m.data; if (!d || m.isMe) return; const by = m.by || '?', now = Date.now(); if (now - (lastFrom[by] || 0) < 2500) return; lastFrom[by] = now;
  if (d.k === 'enh') { const e = d.e | 0; if (e < 7 || e > 10) return; const key = 'e' + by + e + Math.floor(now / 20000); if (seen.has(key)) return; seen.add(key); showEnh(String(d.n || '?').slice(0, 16), String(d.i || '').slice(0, 30), e); }
  else if (d.k === 'ult') { const key = 'u' + by + Math.floor(now / 60000); if (seen.has(key)) return; seen.add(key); showUlt(String(d.n || '?').slice(0, 16), String(d.i || '').slice(0, 40)); }
  else if (d.k === 'wb') { const key = 'w' + String(d.ev || '').slice(0, 20); if (seen.has(key)) return; seen.add(key); showWb(String(d.b || '').slice(0, 30), String(d.t || '').slice(0, 16), d.d | 0); }
})));
const ENH_TXT = { 7: ['gold', 'ตีบวกสำเร็จ'], 8: ['violet', 'ตีบวกสำเร็จ'], 9: ['fire', 'ตีบวกสำเร็จ!!'], 10: ['rainbow', 'ตีบวกขั้นสูงสุด!!!'] };
function showEnh(name, item, e) { const [k, t] = ENH_TXT[e] || ENH_TXT[7]; announce(`<b>${esc(name)}</b> ${t}<br><span class="px28-it">${esc(item)} <em>+${e}</em></span>`, 'enh ' + k, e >= 9 ? 'fire' : e === 8 ? 'bolt' : 'star'); }
function showUlt(name, item) { announce(`<b>${esc(name)}</b> ได้รับอาวุธตำนานบอสโลก!!!<br><span class="px28-it">${esc(item)}</span>`, 'enh rainbow', 'bolt'); }
function ultGot(item) { const st = ST(); const n = (st && st.name) || 'ผู้เล่น'; showUlt(n, item); emit('v28ann', { k: 'ult', n, i: item }); }
function showWb(boss, top, dmg) { announce(`<b>${esc(boss)}</b> ถูกสังหารแล้ว!<br><span class="px28-it">ดาเมจสูงสุด: <em>${esc(top || '—')}</em>${dmg ? ' · ' + fmt(dmg) : ''}</span>`, 'wb', 'crown'); }
/* world boss defeated (called by the arena when the server says defeated) */
function bossDown(ev, bossName, ranking) {
  const key = 'w' + String(ev || '').slice(0, 20); if (seen.has(key)) return; seen.add(key);
  const r0 = (ranking || [])[0], st = ST(); let top = r0 ? (window.AMBER_MINE_NAME ? window.AMBER_MINE_NAME({ name: r0.name, damage: r0.damage }) : r0.name) : (st && st.name) || '';
  showWb(bossName || 'บอสโลก', top, r0 ? r0.damage : 0); emit('v28ann', { k: 'wb', ev: String(ev || ''), b: bossName || '', t: top, d: r0 ? r0.damage | 0 : 0 });
}
/* +7..+10 announcements: wrap the game's own enhance() without changing its logic */
function hookEnhance() {
  const o = window.enhance; if (typeof o !== 'function' || o.__px28) return;
  const w = function (id) {
    const st = ST(), g0 = st && (st.gear || []).find(x => String(x.id) === String(id)), before = g0 ? g0.enh | 0 : 0;
    const r = o.apply(this, arguments);
    safe(() => { const g1 = (ST().gear || []).find(x => String(x.id) === String(id)), after = g1 ? g1.enh | 0 : 0; if (g1 && after > before && after >= 7) { const nm = String(g1.name || '').replace(/^[^\wก-๙\[]+/, '').slice(0, 30); showEnh(ST().name, nm, after); emit('v28ann', { k: 'enh', n: ST().name, i: nm, e: after }); } });
    return r;
  }; w.__px28 = 1; window.enhance = w;
}

/* ============================================================ CSS */
const css = document.createElement('style'); css.id = 'px28-hud-css'; css.textContent = `
#sprites .sprite{overflow:visible!important}
#sprites .sprite>.px28-enh{position:absolute;left:-12%;right:-12%;top:-6%;bottom:-4%;pointer-events:none;z-index:8;background-size:800% 100%;background-repeat:no-repeat;mix-blend-mode:screen;image-rendering:auto;animation:px28enh .9s steps(8) infinite}
#sprites .sprite>.px28-enh[data-tier="9"]{animation-duration:.7s}#sprites .sprite>.px28-enh[data-tier="10"]{animation-duration:.6s}#sprites .sprite>.px28-enh[data-tier="11"]{animation-duration:.45s;left:-30%;right:-30%;top:-22%;bottom:-14%;filter:drop-shadow(0 0 8px #4ae8ff)}
@keyframes px28enh{from{background-position:0 0}to{background-position:114.2857% 0}}
.px28-lv{display:inline-block;background:#0b0614;color:#ffe9a8;border:1px solid #e8b050;padding:0 3px;font:800 9px/12px system-ui;margin-right:2px;box-shadow:1px 1px 0 #000}
.px28-rb{display:inline-flex;align-items:center;gap:1px;background:#3a1060;color:#e8c8ff;border:1px solid #a45cff;padding:0 3px;font:800 9px/12px system-ui;margin-right:2px}.px28-rb img{height:9px;image-rendering:pixelated}
#px28Hud{position:relative;z-index:30;display:flex;justify-content:space-between;align-items:center;gap:4px;padding:4px 2px;flex-wrap:wrap}
#px28Hud>div{display:flex;gap:4px;flex-wrap:wrap}#px28Hud .px28-hq{margin-left:auto}
.px28-chip{display:inline-flex;align-items:center;gap:3px;background:#0b0614d8;border:2px solid #e8b050;color:#ffe9a8;font:700 11px system-ui;padding:1px 6px;box-shadow:2px 2px 0 #000}.px28-chip img{height:13px;image-rendering:pixelated}.px28-chip.rb{border-color:#a45cff;color:#e8c8ff}.px28-chip b{color:#fff}
.px28-q{display:inline-flex!important;align-items:center;gap:3px;min-height:30px;padding:2px 7px!important;font:800 11px system-ui!important;pointer-events:auto;touch-action:manipulation}.px28-q img{height:16px;image-rendering:pixelated}.px28-q.auto.on{filter:drop-shadow(0 0 4px #5adc6a)}
.px28-dg{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin:0 0 6px}.px28-dg .sp{flex:1}
#px28Ann{position:fixed;left:auto;right:8px;top:calc(env(safe-area-inset-top,0px) + 6px);z-index:55;max-width:240px;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none}
.px28-ann{display:flex;align-items:center;gap:8px;max-width:min(92vw,420px);padding:8px 12px;border:4px solid #0b0614;background:linear-gradient(#2a1a58,#120a2c);color:#fff1c8;font:700 13px/1.35 system-ui;box-shadow:0 0 0 2px #e8b050,0 6px 18px #000c;animation:px28in .5s cubic-bezier(.2,1.4,.4,1) both;image-rendering:pixelated}
.px28-ann.out{animation:px28out .6s ease-in both}.px28-ann img{height:34px;image-rendering:pixelated;filter:drop-shadow(0 0 6px #ffd24a)}.px28-ann em{font-style:normal;color:#ffd24a;font-size:15px}.px28-it{color:#cfe0ff;font-weight:600}
.px28-ann.enh.gold{box-shadow:0 0 0 2px #ffd24a,0 0 18px #ffd24a99,0 6px 18px #000c}
.px28-ann.enh.violet{background:linear-gradient(#3a1a78,#160a30);box-shadow:0 0 0 2px #a45cff,0 0 22px #a45cffaa,0 6px 18px #000c}
.px28-ann.enh.fire{background:linear-gradient(#7a1a10,#2a0a08);box-shadow:0 0 0 2px #ff7a1a,0 0 26px #ff5a1acc,0 6px 18px #000c}
.px28-ann.enh.rainbow{background:linear-gradient(90deg,#7a1a40,#7a6a10,#107a40,#10407a,#5a107a);box-shadow:0 0 0 2px #fff,0 0 30px #fff9,0 6px 18px #000c}
.px28-ann.wb{background:linear-gradient(#5a1a10,#1a0608);box-shadow:0 0 0 2px #ffd24a,0 0 26px #ff4a1acc,0 6px 18px #000c}
@keyframes px28in{from{transform:translateY(-60px) scale(.8);opacity:0}to{transform:none;opacity:1}}@keyframes px28out{to{transform:translateY(-40px);opacity:0}}
`; document.head.appendChild(css);

setInterval(() => { if (document.hidden) return; safe(paintAura); safe(labels); safe(paintHud); safe(hookEnhance); }, 500);
window.AMBER_V28 = Object.assign(window.AMBER_V28 || {}, { announce, bossDown, showEnh, showWb, showUlt, ultGot, auraSheet: aura });
})();
