/* 55 AMBERLANDS V28 — PIXEL ICON SET (icons only; the original UI look is untouched)
 *  16x16 code-drawn icons used by the V28 panels (PX.uiSkin.icon(name) -> dataURL).
 *  CLIENT ONLY. Does not touch Supabase, saves, or any game logic.
 */
(() => {
'use strict';
const PX = window.PX; if (!PX || !PX.Sp) return;
const { Sp } = PX;
const OUT = '#0b0614';
const mx = PX.mix;
/* ============================================================ pixel icons (16x16, drawn with code) */
const I = {};
const mk = fn => { const s = new Sp(16, 16); fn(s); s.sel(OUT); return s; };
const star5 = (s, cx, cy, R, r, c) => { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; pts.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q]); } s.poly(pts, c); };
I.sword = mk(s => { s.line(5, 10, 12, 3, '#dfe8f6', 2); s.line(5, 9, 11, 3, '#ffffff'); s.line(3, 8, 8, 13, '#e0a030', 2); s.line(3, 14, 5, 11, '#8a5a2a', 2); s.px(2, 14, '#ffd24a'); });
I.shield = mk(s => { s.poly([[3, 2], [13, 2], [13, 8], [8, 14], [3, 8]], '#4a7ad8'); s.poly([[4, 3], [12, 3], [12, 8], [8, 12], [4, 8]], '#6a9af0'); s.rect(7, 4, 2, 7, '#ffd24a'); s.rect(5, 6, 6, 2, '#ffd24a'); });
I.burst = mk(s => { const p = []; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, q = i % 2 ? 3.6 : 7; p.push([8 + Math.cos(a) * q, 8 + Math.sin(a) * q]); } s.poly(p, '#ff8a1a'); const p2 = []; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, q = i % 2 ? 2 : 4.2; p2.push([8 + Math.cos(a) * q, 8 + Math.sin(a) * q]); } s.poly(p2, '#ffe14a'); });
I.target = mk(s => { s.disc(8, 8, 6.4, '#e84a4a'); s.disc(8, 8, 4.6, '#ffffff'); s.disc(8, 8, 3, '#e84a4a'); s.disc(8, 8, 1.2, '#ffffff'); });
I.wind = mk(s => { s.line(2, 5, 10, 5, '#bfefff', 2); s.ell(11, 4, 2, 2, '#bfefff'); s.line(2, 9, 12, 9, '#9fe0ff', 2); s.ell(13, 10, 1.6, 1.6, '#9fe0ff'); s.line(2, 13, 8, 13, '#bfefff', 2); });
I.bolt = mk(s => { s.poly([[9, 1], [3, 9], [7, 9], [5, 15], [13, 6], [8, 6]], '#ffd24a'); s.poly([[9, 3], [6, 8], [8, 8], [7, 12], [11, 7], [9, 7]], '#fff4b0'); });
I.lock = mk(s => { s.rect(4, 2, 2, 6, '#c8c8d8'); s.rect(10, 2, 2, 6, '#c8c8d8'); s.rect(4, 2, 8, 2, '#c8c8d8'); s.rect(3, 7, 10, 7, '#e0a030'); s.rect(3, 7, 10, 2, '#ffd978'); s.rect(7, 9, 2, 3, '#3a2410'); });
I.demon = mk(s => { s.poly([[2, 6], [4, 1], [6, 5]], '#f0e0c0'); s.poly([[14, 6], [12, 1], [10, 5]], '#f0e0c0'); s.ell(8, 9, 6, 5.4, '#d83a3a'); s.rect(4, 7, 3, 2, '#ffe14a'); s.rect(9, 7, 3, 2, '#ffe14a'); s.rect(5, 11, 6, 1, '#3a0810'); s.px(6, 12, '#fff'); s.px(9, 12, '#fff'); });
I.pin = mk(s => { s.ell(8, 6, 4.4, 4.4, '#e84a4a'); s.poly([[4, 8], [12, 8], [8, 14]], '#e84a4a'); s.disc(8, 6, 1.6, '#ffffff'); });
const bottle = (c, h) => mk(s => { s.rect(6, 1, 4, 2, '#8a5a2a'); s.rect(6, 3, 4, 3, '#cfd6e6'); s.ell(8, 10, 5.2, 4.6, c); s.px(5, 9, h); s.px(5, 10, h); s.px(6, 8, h); });
I.potion = bottle('#e84a4a', '#ffb0b0'); I.potionB = bottle('#3a86f0', '#bfe0ff');
I.drop = mk(s => { s.poly([[8, 1], [3, 9], [13, 9]], '#4a9aff'); s.ell(8, 10, 5, 4.2, '#4a9aff'); s.px(6, 10, '#d0ecff'); s.px(6, 11, '#d0ecff'); s.px(7, 9, '#d0ecff'); });
I.crown = mk(s => { s.poly([[2, 12], [2, 5], [5, 8], [8, 3], [11, 8], [14, 5], [14, 12]], '#ffc83a'); s.rect(2, 11, 12, 2, '#e0a020'); s.px(8, 8, '#e84a4a'); s.px(4, 10, '#4ad8ff'); s.px(12, 10, '#4ad8ff'); });
I.calendar = mk(s => { s.rect(2, 3, 12, 11, '#f4f4fa'); s.rect(2, 3, 12, 4, '#e84a4a'); s.px(5, 2, '#9aa4b8'); s.px(10, 2, '#9aa4b8'); for (let y = 9; y < 13; y += 2) for (let x = 4; x < 13; x += 3) s.px(x, y, '#5a6a8a'); });
I.gift = mk(s => { s.rect(2, 7, 12, 7, '#e84a8a'); s.rect(1, 5, 14, 3, '#ff7ab0'); s.rect(7, 5, 2, 9, '#ffd24a'); s.ell(5.5, 3.5, 2.2, 1.6, '#ffd24a'); s.ell(10.5, 3.5, 2.2, 1.6, '#ffd24a'); });
I.gem = mk(s => { s.poly([[8, 2], [14, 7], [8, 14], [2, 7]], '#3ad0ff'); s.poly([[8, 2], [14, 7], [8, 7]], '#8ae8ff'); s.poly([[2, 7], [8, 7], [8, 14]], '#1a90d0'); s.px(6, 5, '#ffffff'); });
I.coin = mk(s => { s.disc(8, 8, 6.4, '#ffd24a'); s.disc(8, 8, 4.6, '#e0a020'); s.rect(7, 5, 2, 6, '#ffe98a'); s.px(5, 5, '#fff3b0'); });
I.trophy = mk(s => { s.poly([[4, 2], [12, 2], [11, 8], [5, 8]], '#ffc83a'); s.rect(1, 3, 3, 4, '#e0a020'); s.rect(12, 3, 3, 4, '#e0a020'); s.rect(7, 8, 2, 3, '#e0a020'); s.rect(4, 11, 8, 3, '#8a5a2a'); s.px(6, 4, '#fff3b0'); });
I.card = mk(s => { s.rect(3, 1, 10, 14, '#f4f4fa'); s.poly([[8, 4], [11, 8], [8, 12], [5, 8]], '#a47ae0'); s.px(4, 2, '#e84a4a'); s.px(11, 13, '#e84a4a'); });
I.tag = mk(s => { s.poly([[2, 8], [8, 2], [14, 2], [14, 8], [8, 14]], '#ff9a2a'); s.disc(11, 5, 1.4, '#ffffff'); s.px(11, 5, '#6a3a10'); });
I.fire = mk(s => { s.poly([[8, 1], [12, 6], [13, 10], [8, 15], [3, 10], [4, 6], [6, 6]], '#ff5a1a'); s.poly([[8, 6], [11, 10], [8, 14], [5, 10]], '#ffb02e'); s.poly([[8, 9], [9.5, 11], [8, 13], [6.5, 11]], '#fff4a0'); });
I.camera = mk(s => { s.rect(2, 5, 12, 8, '#cfd6e6'); s.rect(5, 3, 4, 2, '#cfd6e6'); s.disc(8, 9, 3, '#3a4a78'); s.disc(8, 9, 1.6, '#9ad0ff'); s.px(12, 6, '#e84a4a'); });
I.map = mk(s => { s.poly([[1, 4], [5, 3], [5, 14], [1, 15]], '#8ad86a'); s.poly([[5, 3], [10, 4], [10, 15], [5, 14]], '#e8d090'); s.poly([[10, 4], [15, 3], [15, 14], [10, 15]], '#8ad86a'); s.px(7, 8, '#e84a4a'); s.px(8, 9, '#e84a4a'); s.px(8, 7, '#e84a4a'); s.px(7, 10, '#e84a4a'); });
I.party = mk(s => { s.ell(5, 12, 3.6, 3, '#4a7ad8'); s.disc(5, 6.4, 2.6, '#ffd0a0'); s.ell(11, 12, 3.6, 3, '#e84a8a'); s.disc(11, 6.4, 2.6, '#ffd0a0'); s.rect(3, 4, 5, 1, '#6a3a18'); s.rect(9, 4, 5, 1, '#ffd24a'); });
I.star = mk(s => { star5(s, 8, 8.4, 7, 3, '#ffd24a'); star5(s, 8, 8.4, 4.4, 1.8, '#fff3b0'); });
I.check = mk(s => { s.rect(1, 1, 14, 14, '#2a9a4a'); s.rect(2, 2, 12, 12, '#4adc6a'); s.line(4, 8, 7, 11, '#ffffff', 2); s.line(7, 11, 12, 4, '#ffffff', 2); });
I.warn = mk(s => { s.poly([[8, 1], [15, 14], [1, 14]], '#ffd24a'); s.rect(7, 5, 2, 5, '#3a2410'); s.rect(7, 11, 2, 2, '#3a2410'); });
I.hourglass = mk(s => { s.rect(3, 1, 10, 2, '#c8963e'); s.rect(3, 13, 10, 2, '#c8963e'); s.poly([[4, 3], [12, 3], [8, 8]], '#ffe98a'); s.poly([[8, 8], [4, 13], [12, 13]], '#e0a020'); });
I.rainbow = mk(s => { const cols = ['#ff5a5a', '#ffb02e', '#ffe14a', '#5adc6a', '#4a9aff', '#a47ae0']; cols.forEach((c, i) => { const r = 7 - i; for (let a = Math.PI; a <= Math.PI * 2 + .01; a += .08) { s.px(8 + Math.cos(a) * r, 12 + Math.sin(a) * r, c); s.px(8 + Math.cos(a) * (r - .5), 12 + Math.sin(a) * (r - .5), c); } }); });
I.heart = mk(s => { s.disc(5.2, 6, 3.4, '#e84a4a'); s.disc(10.8, 6, 3.4, '#e84a4a'); s.poly([[2, 7], [14, 7], [8, 14]], '#e84a4a'); s.px(4, 4, '#ffb0b0'); s.px(5, 4, '#ffb0b0'); });
I.cross = mk(s => { s.line(3, 3, 13, 13, '#ff6a6a', 2); s.line(13, 3, 3, 13, '#ff6a6a', 2); });
I.smile = mk(s => { s.disc(8, 8, 6.4, '#ffd24a'); s.rect(5, 6, 2, 2, '#3a2410'); s.rect(9, 6, 2, 2, '#3a2410'); s.rect(5, 10, 6, 1, '#3a2410'); s.px(4, 9, '#3a2410'); s.px(11, 9, '#3a2410'); });
I.zzz = mk(s => { s.rect(2, 3, 6, 1, '#9ad0ff'); s.line(7, 4, 2, 8, '#9ad0ff'); s.rect(2, 8, 6, 1, '#9ad0ff'); s.rect(8, 8, 5, 1, '#bfe8ff'); s.line(12, 9, 8, 12, '#bfe8ff'); s.rect(8, 12, 5, 1, '#bfe8ff'); });
I.castle = mk(s => { s.rect(2, 6, 12, 8, '#9aa4b8'); for (const x of [2, 6, 10]) s.rect(x, 3, 3, 4, '#9aa4b8'); s.rect(6, 10, 4, 4, '#3a2a14'); s.rect(7, 8, 2, 1, '#ffe14a'); });
I.paw = mk(s => { s.ell(8, 11, 4, 3.4, '#c8903a'); for (const [x, y] of [[3.5, 7], [6.5, 4.6], [9.5, 4.6], [12.5, 7]]) s.disc(x, y, 1.8, '#c8903a'); });
I.expand = mk(s => { for (const [x, y, dx, dy] of [[2, 2, 1, 1], [13, 2, -1, 1], [2, 13, 1, -1], [13, 13, -1, -1]]) { s.rect(x + (dx < 0 ? -4 : 0), y, 5, 2, '#f4e0a0'); s.rect(x, y + (dy < 0 ? -4 : 0), 2, 5, '#f4e0a0'); } });
I.chart = mk(s => { s.rect(2, 9, 3, 5, '#4a9aff'); s.rect(6, 5, 3, 9, '#5adc6a'); s.rect(10, 2, 3, 12, '#ffd24a'); });
I.loop = mk(s => { for (let a = .6; a < 5.4; a += .1) s.px(8 + Math.cos(a) * 5, 8 + Math.sin(a) * 5, '#7ad8ff'), s.px(8 + Math.cos(a) * 4.4, 8 + Math.sin(a) * 4.4, '#7ad8ff'); s.poly([[11, 2], [15, 6], [10, 7]], '#7ad8ff'); });
I.mail = mk(s => { s.rect(1, 3, 14, 10, '#f4f4fa'); s.line(1, 3, 8, 9, '#9aa4b8'); s.line(15, 3, 8, 9, '#9aa4b8'); });
I.plus = mk(s => { s.rect(6, 2, 4, 12, '#5adc6a'); s.rect(2, 6, 12, 4, '#5adc6a'); });
I.link = mk(s => { s.ell(5.5, 8, 4, 2.6, '#9ad0ff'); s.ell(10.5, 8, 4, 2.6, '#9ad0ff'); s.ell(5.5, 8, 2.2, 1, '#142042'); s.ell(10.5, 8, 2.2, 1, '#142042'); });
I.hand = mk(s => { s.rect(4, 8, 8, 6, '#ffd0a0'); for (const x of [4, 6, 8, 10]) s.rect(x, 3 + (x % 4 ? 0 : 1), 2, 6, '#ffd0a0'); s.rect(2, 8, 3, 2, '#ffd0a0'); });
I.walk = mk(s => { s.disc(8, 3.4, 2, '#ffd0a0'); s.rect(7, 5, 3, 5, '#4a7ad8'); s.line(7, 10, 4, 14, '#4a7ad8', 2); s.line(9, 10, 12, 14, '#4a7ad8', 2); s.line(7, 6, 4, 9, '#ffd0a0', 2); s.line(10, 6, 13, 8, '#ffd0a0', 2); });
I.dot = mk(s => { s.disc(8, 8, 4, '#e8eef8'); s.px(7, 7, '#fff'); });
I.book = mk(s => { s.rect(2, 2, 12, 12, '#8a3aa8'); s.rect(3, 3, 10, 10, '#f4ead0'); s.line(8, 3, 8, 12, '#8a3aa8'); });
I.bag = mk(s => { s.ell(8, 10, 6, 5, '#b8763a'); s.rect(5, 3, 6, 4, '#9a5e28'); s.rect(5, 6, 6, 1, '#ffd24a'); s.px(8, 10, '#ffd24a'); });

const MAP = { '⚔': 'sword', '🗡': 'sword', '🛡': 'shield', '💥': 'burst', '🎯': 'target', '💨': 'wind', '⚡': 'bolt', '🔒': 'lock', '👹': 'demon', '📍': 'pin', '🧪': 'potion', '💧': 'drop', '👑': 'crown', '📅': 'calendar', '🎁': 'gift', '💠': 'gem', '💎': 'gem', '💰': 'coin', '🪙': 'coin', '🏆': 'trophy', '🃏': 'card', '🏷': 'tag', '🔥': 'fire', '📸': 'camera', '🗺': 'map', '👥': 'party', '🌟': 'star', '⭐': 'star', '✨': 'star', '✅': 'check', '✔': 'check', '⚠': 'warn', '⏳': 'hourglass', '⌛': 'hourglass', '🌈': 'rainbow', '❤': 'heart', '✖': 'cross', '❌': 'cross', '😀': 'smile', '💤': 'zzz', '🏰': 'castle', '🐶': 'paw', '⛶': 'expand', '📊': 'chart', '🔁': 'loop', '📨': 'mail', '➕': 'plus', '🔗': 'link', '🙋': 'hand', '🚶': 'walk', '⚪': 'dot', '📖': 'book', '🎒': 'bag', '🔓': 'lock', '🌐': 'dot' };
const URLS = {}; const urlOf = k => URLS[k] || (URLS[k] = I[k].toURL());
const EMO_URL = ch => MAP[ch] ? urlOf(MAP[ch]) : null;
PX.uiSkin = { icon: k => urlOf(k), emoji: EMO_URL, MAP };
const st = document.createElement('style'); st.id = 'px28-icons';
st.textContent = '.pxe{height:1.2em;width:auto;vertical-align:-.25em;image-rendering:pixelated;display:inline-block;margin:0 2px}';
document.head.appendChild(st);
})();
