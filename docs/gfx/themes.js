// Werelden/thema's: elke wereld heeft eigen verloop, hemellichaam, ver/mid-silhouetten, grondlaag, decoratie (iconen) en deeltjes.
// Themes.paintBackground(ctx,w,h,world,t) tekent alles gelaagd (kwaliteit-bewust) en is stateless: t = seconden.
import { GFX } from './settings.js?v=1';
import { drawIcon } from './art.js?v=1';
import { TAU, clamp, lerp, mix, hexA, rng, hash, glow, gradientSky, lightRays, bokeh, vignette, softShadow } from './fx.js?v=1';

// Velden: bg (2-3 kleuren boven->onder), ground, gk (grondsoort), far/mid (silhouetten), sky (sun|moon|planet|none), deco (iconen),
// particle (stars|snow|bubbles|leaves|embers|sparkles|petals|rain|dust|candy|bits|fireflies), mood (dark|light), hz (horizon 0..1)
export const WORLDS = [
  { id: 'ruimte', name: 'Ruimte', emoji: '🚀', bg: ['#050816', '#1b1450', '#3b1d6e'], accent: '#a78bfa', ground: '#1e1b4b', gk: 'moon', far: 'crystals', mid: 'hills', sky: 'planet', deco: ['rocket', 'planet', 'star', 'ufo', 'satellite', 'comet', 'astronaut'], particle: 'stars', mood: 'dark', hz: 0.84 },
  { id: 'onderwater', name: 'Onderwater', emoji: '🐠', bg: ['#38bdf8', '#0369a1', '#082f49'], accent: '#22d3ee', ground: '#d9b36c', gk: 'sand', far: 'kelp', mid: 'kelp', sky: 'none', deco: ['shell', 'crab', 'octopus', 'turtle', 'fish', 'jellyfish', 'whale', 'submarine'], particle: 'bubbles', mood: 'dark', hz: 0.86, rays: true },
  { id: 'kasteel', name: 'Kasteel', emoji: '🏰', bg: ['#7dd3fc', '#bfdbfe', '#fde68a'], accent: '#f59e0b', ground: '#4d9d3a', gk: 'grass', far: 'mountains', mid: 'castle', sky: 'sun', deco: ['castle', 'tower', 'flag', 'shield', 'crown', 'dragon', 'sword'], particle: 'sparkles', mood: 'light', hz: 0.8 },
  { id: 'bos', name: 'Bos', emoji: '🌲', bg: ['#a7f3d0', '#86efac', '#fef9c3'], accent: '#16a34a', ground: '#2f7d32', gk: 'grass', far: 'pines', mid: 'pines', sky: 'sun', deco: ['tree', 'pine', 'mushroom', 'fox', 'owl', 'flower', 'butterfly', 'bee'], particle: 'fireflies', mood: 'light', hz: 0.8, rays: true },
  { id: 'woestijn', name: 'Woestijn', emoji: '🏜️', bg: ['#fb923c', '#fcd34d', '#fef3c7'], accent: '#ea580c', ground: '#e0a458', gk: 'sand', far: 'dunes', mid: 'dunes', sky: 'sun', deco: ['cactus', 'pyramid', 'rock', 'sun', 'cactus'], particle: 'dust', mood: 'light', hz: 0.8 },
  { id: 'ijs', name: 'IJs', emoji: '❄️', bg: ['#bae6fd', '#e0f2fe', '#f0f9ff'], accent: '#0ea5e9', ground: '#f1f5f9', gk: 'snow', far: 'mountains', mid: 'pines', sky: 'sun', deco: ['igloo', 'pine', 'penguin', 'bear', 'snowflake', 'rock'], particle: 'snow', mood: 'light', hz: 0.8, cap: true },
  { id: 'snoepland', name: 'Snoepland', emoji: '🍭', bg: ['#fbcfe8', '#f9a8d4', '#fde68a'], accent: '#ec4899', ground: '#f472b6', gk: 'candy', far: 'bumps', mid: 'bumps', sky: 'sun', deco: ['lollipop', 'icecream', 'cupcake', 'donut', 'candy', 'cookie', 'cake'], particle: 'candy', mood: 'light', hz: 0.8 },
  { id: 'stad', name: 'Stad', emoji: '🏙️', bg: ['#1e3a8a', '#6366f1', '#fdba74'], accent: '#38bdf8', ground: '#334155', gk: 'road', far: 'city', mid: 'city', sky: 'moon', deco: ['skyscraper', 'house', 'car', 'bus', 'shop', 'bridge', 'plane'], particle: 'sparkles', mood: 'dark', hz: 0.82 },
  { id: 'jungle', name: 'Jungle', emoji: '🌴', bg: ['#14532d', '#16a34a', '#bef264'], accent: '#84cc16', ground: '#166534', gk: 'grass', far: 'blobs', mid: 'blobs', sky: 'sun', deco: ['palm', 'monkey', 'frog', 'flower', 'butterfly', 'snail', 'sunflower'], particle: 'fireflies', mood: 'light', hz: 0.82, rays: true },
  { id: 'vulkaan', name: 'Vulkaan', emoji: '🌋', bg: ['#1c0a0a', '#7f1d1d', '#ea580c'], accent: '#f97316', ground: '#27272a', gk: 'lava', far: 'volcano', mid: 'mountains', sky: 'none', deco: ['volcano', 'flame', 'dragon', 'rock', 'skull'], particle: 'embers', mood: 'dark', hz: 0.82 },
  { id: 'wolken', name: 'Wolken', emoji: '☁️', bg: ['#60a5fa', '#a5d8ff', '#fff1f2'], accent: '#38bdf8', ground: '#ffffff', gk: 'cloud', far: 'clouds', mid: 'clouds', sky: 'sun', deco: ['cloud', 'balloon', 'rainbow', 'unicorn', 'plane', 'helicopter', 'star'], particle: 'sparkles', mood: 'light', hz: 0.86, rays: true },
  { id: 'piraten', name: 'Piraten', emoji: '🏴‍☠️', bg: ['#0f172a', '#155e75', '#f59e0b'], accent: '#f59e0b', ground: '#92400e', gk: 'water', far: 'waves', mid: 'waves', sky: 'moon', deco: ['ship', 'chest', 'skull', 'flag', 'map', 'compass', 'shell'], particle: 'dust', mood: 'dark', hz: 0.74 },
  { id: 'robots', name: 'Robots', emoji: '🤖', bg: ['#0f172a', '#1e293b', '#334155'], accent: '#22d3ee', ground: '#475569', gk: 'metal', far: 'circuit', mid: 'circuit', sky: 'none', deco: ['robot', 'gear', 'bolt', 'satellite', 'lightbulb', 'magnet'], particle: 'bits', mood: 'dark', hz: 0.82 },
  { id: 'dino', name: 'Dino', emoji: '🦖', bg: ['#fde68a', '#fdba74', '#86efac'], accent: '#65a30d', ground: '#5b7f2b', gk: 'grass', far: 'volcano', mid: 'blobs', sky: 'sun', deco: ['dino', 'palm', 'egg', 'rock', 'volcano', 'leaf'], particle: 'dust', mood: 'light', hz: 0.8 },
  { id: 'neon', name: 'Neon', emoji: '🪩', bg: ['#0a0014', '#3b0764', '#be185d'], accent: '#f0abfc', ground: '#1e0a3c', gk: 'neon', far: 'city', mid: 'crystals', sky: 'moon', deco: ['note', 'bolt', 'star', 'headphones', 'guitar', 'drum'], particle: 'bits', mood: 'dark', hz: 0.8 },
  { id: 'herfst', name: 'Herfst', emoji: '🍂', bg: ['#fcd34d', '#fb923c', '#7c2d12'], accent: '#ea580c', ground: '#9a3412', gk: 'grass', far: 'hills', mid: 'hills', sky: 'sun', deco: ['tree', 'leaf', 'mushroom', 'owl', 'pie', 'clover'], particle: 'leaves', mood: 'light', hz: 0.8 },
  { id: 'boerderij', name: 'Boerderij', emoji: '🚜', bg: ['#7dd3fc', '#bae6fd', '#fef9c3'], accent: '#65a30d', ground: '#65a30d', gk: 'grass', far: 'hills', mid: 'hills', sky: 'sun', deco: ['barn', 'windmill', 'tractor', 'cow', 'pig', 'chicken', 'sheep', 'wheat'], particle: 'petals', mood: 'light', hz: 0.78 },
  { id: 'pretpark', name: 'Pretpark', emoji: '🎡', bg: ['#a78bfa', '#f0abfc', '#fed7aa'], accent: '#f43f5e', ground: '#7c3aed', gk: 'road', far: 'hills', mid: 'bumps', sky: 'sun', deco: ['ferriswheel', 'rollercoaster', 'carousel', 'balloon', 'ticket', 'bell'], particle: 'sparkles', mood: 'light', hz: 0.8 },
];
// Wie vliegt/zweeft (komt in de lucht, beweegt zacht) en wie staat op de grond.
const FLY = new Set(['fish', 'whale', 'jellyfish', 'cloud', 'balloon', 'plane', 'ufo', 'satellite', 'comet', 'butterfly', 'helicopter', 'bee', 'planet', 'rocket', 'star', 'rainbow', 'unicorn', 'astronaut', 'note', 'bolt', 'snowflake', 'sun', 'leaf', 'submarine', 'lightbulb', 'magnet', 'dragon']);
const BYID = new Map(WORLDS.map((w) => [w.id, w]));
const AIR = new Set(['rainbow', 'sun']); // vliegers die niet driften
for (const w of WORLDS) w.deco = w.deco.filter((n) => typeof n === 'string');

/* ---------- ruis & silhouetten ---------- */
const hv = (s, i) => { let h = (i * 374761393 + s * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const sm = (t) => t * t * (3 - 2 * t);
function noise(s, x) { const i = Math.floor(x), f = x - i; return lerp(hv(s, i), hv(s, i + 1), sm(f)); }

function silhouette(ctx, type, w, base, amp, color, o) {
  const s = o.seed, off = o.off || 0, step = GFX.q === 0 ? 14 : 7;
  ctx.fillStyle = color;
  const poly = (fn) => { ctx.beginPath(); ctx.moveTo(-2, base + 2); for (let x = -2; x <= w + step; x += step) ctx.lineTo(x, base - fn(x + off) * amp); ctx.lineTo(w + step, base + 2); ctx.closePath(); ctx.fill(); };
  switch (type) {
    case 'mountains': case 'volcano': {
      if (o.cap) { const gr = ctx.createLinearGradient(0, base - amp, 0, base); gr.addColorStop(0, '#f8fafc'); gr.addColorStop(0.22, '#f8fafc'); gr.addColorStop(0.26, color); gr.addColorStop(1, color); ctx.fillStyle = gr; }
      poly((x) => { let v = 1 - Math.abs(2 * noise(s, x / 150) - 1); v = v * 0.7 + 0.3 * noise(s + 3, x / 40); if (type === 'volcano') { const c = Math.abs(x - o.cx) / (amp * 1.6); v = Math.max(v * 0.45, 1.05 - c - (c < 0.1 ? (0.1 - c) * 2.5 : 0)); } return clamp(v, 0, 1.05); });
      if (type === 'volcano') { const ty = base - amp * 0.97; glow(ctx, o.cx, ty, amp * 0.9, '#f97316', 0.55); }
      break;
    }
    case 'dunes': poly((x) => 0.35 + 0.65 * noise(s, x / 260) * (0.7 + 0.3 * Math.sin(x / 90 + s))); break;
    case 'waves': poly((x) => 0.5 + 0.28 * Math.sin(x / 70 + o.t * 1.2 + s) + 0.18 * Math.sin(x / 31 - o.t * 1.7)); break;
    case 'blobs': { ctx.beginPath(); ctx.moveTo(-2, base + 2); const r = rng(s); for (let x = -40; x < w + 80; x += 40 + r() * 40) { const rr = amp * (0.45 + r() * 0.55); ctx.arc(x + off, base - rr * 0.35, rr, Math.PI, 0); } ctx.lineTo(w + 80, base + 2); ctx.closePath(); ctx.fill(); break; }
    case 'bumps': { ctx.beginPath(); ctx.moveTo(-2, base + 2); const r = rng(s); for (let x = 0; x < w + 100; x += 60 + r() * 50) { const rr = amp * (0.5 + r() * 0.5); ctx.arc(x + off, base, rr, Math.PI, 0); } ctx.lineTo(w + 100, base + 2); ctx.closePath(); ctx.fill(); break; }
    case 'clouds': { const r = rng(s); for (let x = -50; x < w + 80; x += 70 + r() * 50) { const rr = amp * (0.35 + r() * 0.4); ctx.beginPath(); ctx.arc(x + off, base - rr * 0.4, rr, 0, TAU); ctx.arc(x + off + rr * 0.9, base - rr * 0.2, rr * 0.75, 0, TAU); ctx.arc(x + off - rr * 0.9, base - rr * 0.15, rr * 0.7, 0, TAU); ctx.fill(); } ctx.fillRect(-2, base - 2, w + 4, 6); break; }
    case 'pines': { const r = rng(s); for (let x = -20; x < w + 40; x += 18 + r() * 22) { const hh = amp * (0.45 + r() * 0.55), ww = hh * 0.42, bx = x + off; ctx.beginPath(); ctx.moveTo(bx, base - hh); ctx.lineTo(bx + ww, base - hh * 0.25); ctx.lineTo(bx + ww * 0.45, base - hh * 0.25); ctx.lineTo(bx + ww * 1.1, base); ctx.lineTo(bx - ww * 1.1, base); ctx.lineTo(bx - ww * 0.45, base - hh * 0.25); ctx.lineTo(bx - ww, base - hh * 0.25); ctx.closePath(); ctx.fill(); } ctx.fillRect(-2, base - 3, w + 4, 6); break; }
    case 'crystals': { const r = rng(s); for (let x = -20; x < w + 40; x += 26 + r() * 36) { const hh = amp * (0.35 + r() * 0.65), ww = 8 + r() * 16, bx = x + off, l = (r() - 0.5) * ww; ctx.beginPath(); ctx.moveTo(bx - ww, base); ctx.lineTo(bx + l, base - hh); ctx.lineTo(bx + ww, base); ctx.closePath(); ctx.fill(); } ctx.fillRect(-2, base - 2, w + 4, 6); break; }
    case 'kelp': { const r = rng(s); ctx.strokeStyle = color; ctx.lineCap = 'round'; for (let x = 0; x < w + 30; x += 22 + r() * 30) { const hh = amp * (0.4 + r() * 0.6), ph = r() * TAU; ctx.lineWidth = 5 + r() * 6; ctx.beginPath(); ctx.moveTo(x, base); for (let k = 1; k <= 6; k++) ctx.lineTo(x + Math.sin(o.t * 0.9 + ph + k * 0.7) * 9 * (k / 6), base - hh * k / 6); ctx.stroke(); } ctx.fillRect(-2, base - 2, w + 4, 6); break; }
    case 'city': case 'circuit': case 'castle': {
      const r = rng(s); const dark = o.dark; let x = -10 + (off % 20);
      while (x < w + 20) {
        const bw = type === 'city' ? 16 + r() * 22 : type === 'castle' ? 26 + r() * 28 : 30 + r() * 40;
        const hh = amp * (0.3 + r() * 0.7);
        ctx.fillStyle = color; ctx.fillRect(x, base - hh, bw, hh + 2);
        if (type === 'castle') { for (let k = 0; k < bw - 4; k += 9) ctx.fillRect(x + k, base - hh - 5, 5, 6); if (r() > 0.4) { ctx.beginPath(); ctx.moveTo(x - 3, base - hh); ctx.lineTo(x + bw / 2, base - hh - bw * 0.9); ctx.lineTo(x + bw + 3, base - hh); ctx.fill(); } }
        else if (type === 'city' && r() > 0.7) ctx.fillRect(x + bw / 2 - 1, base - hh - 12, 2, 12);
        else if (type === 'circuit' && r() > 0.5) { ctx.fillRect(x + 6, base - hh - 8, bw - 12, 8); }
        if (o.lit && GFX.q > 0) { ctx.fillStyle = o.lit; for (let wy = base - hh + 6; wy < base - 4; wy += 9) for (let wx = x + 4; wx < x + bw - 5; wx += 8) { if (hv(s, (wx * 7 + wy * 13) | 0) > 0.55) ctx.fillRect(wx, wy, 3, 4); } ctx.fillStyle = color; }
        x += bw + (type === 'city' ? r() * 4 : r() * 12);
      }
      break;
    }
    default: poly((x) => 0.3 + 0.7 * (0.6 * noise(s, x / 170) + 0.4 * noise(s + 5, x / 70)));
  }
}

/* ---------- hemel ---------- */
function paintSky(ctx, w, h, W, t, hz) {
  const cols = W.bg;
  gradientSky(ctx, w, h * hz + 2, cols[0], cols[1]);
  if (cols[2]) { const gr = ctx.createLinearGradient(0, h * hz * 0.55, 0, h * hz + 2); gr.addColorStop(0, hexA(cols[2], 0)); gr.addColorStop(1, hexA(cols[2], W.mood === 'dark' ? 0.75 : 0.9)); ctx.fillStyle = gr; ctx.fillRect(0, h * hz * 0.55, w, h * hz * 0.45 + 2); }
  const u = Math.min(w * 1.15, h);
  const sx = w * 0.74, sy = h * hz * 0.32 + Math.sin(t * 0.15) * (GFX.reduce ? 0 : 4);
  if (W.sky === 'sun') { glow(ctx, sx, sy, u * 0.5, '#fff7d6', 0.55); ctx.fillStyle = '#fffbe6'; ctx.beginPath(); ctx.arc(sx, sy, u * 0.075, 0, TAU); ctx.fill(); }
  else if (W.sky === 'moon') { glow(ctx, sx, sy, u * 0.4, '#dbeafe', 0.4); ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(sx, sy, u * 0.06, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(148,163,184,.35)'; for (const [dx, dy, r] of [[-0.02, -0.01, 0.012], [0.02, 0.02, 0.016], [0.0, 0.035, 0.008]]) { ctx.beginPath(); ctx.arc(sx + dx * u, sy + dy * u, r * u, 0, TAU); ctx.fill(); } }
  else if (W.sky === 'planet') {
    const pr = u * 0.12; glow(ctx, sx, sy, pr * 3, W.accent, 0.35);
    const gr = ctx.createRadialGradient(sx - pr * 0.4, sy - pr * 0.4, pr * 0.1, sx, sy, pr); gr.addColorStop(0, '#fde68a'); gr.addColorStop(1, '#b45309');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(sx, sy, pr, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(253,230,138,.7)'; ctx.lineWidth = pr * 0.14; ctx.beginPath(); ctx.ellipse(sx, sy, pr * 1.7, pr * 0.42, -0.3, 0, TAU); ctx.stroke();
  }
}

function paintStars(ctx, w, h, t, hz, n, seed) {
  const r = rng(seed); const m = GFX.particles(n);
  for (let i = 0; i < m; i++) {
    const x = r() * w, y = r() * h * hz * 0.9, s = 0.6 + r() * 1.6, ph = r() * TAU, tw = GFX.reduce ? 0.8 : 0.55 + 0.45 * Math.sin(t * (1 + r() * 2) + ph);
    ctx.fillStyle = `rgba(255,255,255,${(0.35 + 0.65 * tw) * (0.5 + r() * 0.5)})`;
    ctx.fillRect(x, y, s, s);
    if (GFX.q === 2 && s > 1.7) glow(ctx, x, y, s * 5, '#cfe', 0.18 * tw);
  }
}

/* ---------- grond ---------- */
function paintGround(ctx, w, h, W, t, gy) {
  const g = W.ground, hi = mix(g, '#ffffff', 0.28), lo = mix(g, '#000000', 0.3);
  const gr = ctx.createLinearGradient(0, gy, 0, h); gr.addColorStop(0, g); gr.addColorStop(1, lo);
  ctx.fillStyle = gr;
  const top = (fn) => { ctx.beginPath(); ctx.moveTo(0, h); for (let x = 0; x <= w + 8; x += 8) ctx.lineTo(x, gy + fn(x)); ctx.lineTo(w + 8, h); ctx.closePath(); ctx.fill(); };
  const r = rng(hash(W.id));
  switch (W.gk) {
    case 'water': top((x) => Math.sin(x / 40 + t * 1.5) * 3 + Math.sin(x / 17 - t * 2.2) * 1.6);
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let x = 0; x <= w + 8; x += 8) { const y = gy + 10 + k * 14 + Math.sin(x / 36 + t * 1.2 + k * 2) * 3; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); } break;
    case 'cloud': ctx.fillStyle = gr; ctx.fillRect(0, gy + 8, w, h); for (let x = -20; x < w + 40; x += 38) { const rr = 24 + hv(7, x) * 14; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + (hv(8, x) - 0.5) * 20, gy + 8, rr, Math.PI, 0); ctx.fill(); } break;
    case 'moon': top((x) => Math.sin(x / 90) * 4); ctx.fillStyle = hexA('#000', 0.25); for (let i = 0; i < 7; i++) { const cx = r() * w, cy = gy + 14 + r() * (h - gy - 20), rx = 10 + r() * 26; ctx.beginPath(); ctx.ellipse(cx, cy, rx, rx * 0.3, 0, 0, TAU); ctx.fill(); } break;
    case 'lava': top((x) => Math.sin(x / 70) * 2); for (let i = 0; i < 5; i++) { const x0 = r() * w, y0 = gy + 8 + r() * 10; ctx.strokeStyle = hexA('#fb923c', 0.55 + 0.35 * Math.sin(t * 2 + i)); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + 30 + r() * 30, y0 + 12 + r() * 20); ctx.lineTo(x0 + 10 + r() * 50, y0 + 30 + r() * (h - gy - 30 + 1)); ctx.stroke(); } if (GFX.q > 0) glow(ctx, w * 0.5, gy + 8, w * 0.5, '#f97316', 0.18); break;
    case 'neon': top(() => 0); ctx.strokeStyle = hexA(W.accent, 0.7); ctx.lineWidth = 1.5; for (let i = 1; i < 8; i++) { const y = gy + (h - gy) * Math.pow(i / 8, 1.8); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); } for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(w / 2 + i * 14, gy); ctx.lineTo(w / 2 + i * w * 0.12, h); ctx.stroke(); } if (GFX.q > 0) glow(ctx, w / 2, gy, w * 0.6, W.accent, 0.2); break;
    case 'road': top(() => 0); ctx.fillStyle = hexA('#000', 0.22); ctx.fillRect(0, gy + (h - gy) * 0.35, w, (h - gy) * 0.5); ctx.fillStyle = '#fde68a'; { const dw = 34, off = GFX.reduce ? 0 : (t * 30) % (dw * 2); for (let x = -dw * 2 + off; x < w; x += dw * 2) ctx.fillRect(x, gy + (h - gy) * 0.58, dw, 4); } break;
    case 'metal': top(() => 0); ctx.strokeStyle = hexA('#fff', 0.1); ctx.lineWidth = 2; for (let x = 0; x < w; x += 46) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x - 16, h); ctx.stroke(); } ctx.fillStyle = hexA(W.accent, 0.5 + 0.4 * Math.sin(t * 3)); ctx.fillRect(w * 0.1, gy + 6, 8, 3); ctx.fillRect(w * 0.7, gy + 6, 8, 3); break;
    case 'candy': top((x) => Math.sin(x / 50) * 3); ctx.strokeStyle = hexA('#fff', 0.35); ctx.lineWidth = 8; for (let x = -40; x < w + 60; x += 56) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + 40, gy + 6); ctx.stroke(); } break;
    case 'snow': top((x) => Math.sin(x / 80) * 4 + Math.sin(x / 30) * 1.5); break;
    case 'sand': top((x) => Math.sin(x / 110) * 5 + Math.sin(x / 37) * 1.2); ctx.fillStyle = hexA('#fff', 0.14); for (let i = 0; i < 24; i++) ctx.fillRect(r() * w, gy + 8 + r() * (h - gy - 10), 2 + r() * 3, 2); break;
    default: top((x) => Math.sin(x / 100) * 4 + Math.sin(x / 41) * 1.5); // gras
      ctx.strokeStyle = hi; ctx.lineWidth = 2; ctx.beginPath(); for (let x = 0; x <= w + 8; x += 8) { const y = gy + 1 + Math.sin(x / 100) * 4 + Math.sin(x / 41) * 1.5; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      if (GFX.q > 0) { ctx.strokeStyle = hexA(hi, 0.6); ctx.lineWidth = 1.5; for (let i = 0; i < 40; i++) { const x = r() * w, y = gy + 6 + r() * (h - gy - 8), sw = GFX.reduce ? 0 : Math.sin(t * 1.5 + i) * 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sw, y - 6 - r() * 4); ctx.stroke(); } }
  }
}

/* ---------- decoratie (iconen) ---------- */
function paintDeco(ctx, w, h, W, t, gy, layer) {
  const ground = W.deco.filter((n) => !FLY.has(n)), air = W.deco.filter((n) => FLY.has(n));
  const u = Math.min(w * 1.15, h), q = GFX.q, still = GFX.reduce ? 0 : 1;
  const r = rng(hash(W.id + layer));
  if (layer === 'sky') {
    if (!air.length || q === 0 && W.deco.length > 6) return;
    const n = Math.min(air.length, q === 2 ? 5 : q === 1 ? 3 : 2);
    for (let i = 0; i < n; i++) {
      const nm = air[(i * 2 + 1) % air.length], s = u * (0.07 + r() * 0.06), sp = AIR.has(nm) ? 0 : 7 + r() * 14, y0 = gy * (0.14 + r() * 0.5);
      const x = AIR.has(nm) ? w * (0.15 + r() * 0.5) : ((r() * w + t * sp * still) % (w + s * 3) + w + s * 3) % (w + s * 3) - s * 1.5;
      const bob = Math.sin(t * 0.8 + i * 2) * 6 * still;
      drawIcon(ctx, nm, x, y0 + bob, s, { alpha: 0.85, rot: Math.sin(t * 0.6 + i) * 0.05 * still });
    }
    return;
  }
  if (!ground.length) return;
  const cfg = { far: { n: q === 0 ? 0 : 5, s: 0.1, a: 0.5, y: 0.0 }, mid: { n: q === 0 ? 3 : 4, s: 0.16, a: 0.85, y: 0.04 }, near: { n: q === 0 ? 2 : 3, s: 0.26, a: 1, y: 0.12 } }[layer];
  const per = Math.max(1, Math.min(cfg.n, Math.round(w / (u * cfg.s * 1.7))));
  const off = layer === 'far' ? 0 : layer === 'mid' ? 1 : 2;
  for (let i = 0; i < per; i++) {
    const nm = ground[(i + off * 2) % ground.length], s = u * cfg.s * (0.85 + r() * 0.3);
    const x = ((i + 0.5 + (r() - 0.5) * 0.5) / per) * w, y = gy + (h - gy) * cfg.y - s * 0.38 + (layer === 'near' ? (h - gy) * 0.12 : 0);
    if (layer === 'near') softShadow(ctx, x, y + s * 0.44, s * 0.42, s * 0.08, 0.3);
    drawIcon(ctx, nm, x, y, s, { alpha: cfg.a, rot: layer === 'near' ? Math.sin(t * 1.1 + i * 1.7) * 0.025 * still : 0 });
  }
}

/* ---------- deeltjes (stateless) ---------- */
function paintParticles(ctx, w, h, W, t, gy) {
  const n = GFX.particles(W.particle === 'stars' ? 0 : 26), tt = GFX.reduce ? 0 : t, p = W.particle, r = rng(hash(W.id) ^ 77);
  if (p === 'stars') { return; }
  for (let i = 0; i < n; i++) {
    const x0 = r() * w, y0 = r() * h, sp = 0.5 + r() * 1, ph = r() * TAU, sz = 1.5 + r() * 3;
    let x, y;
    switch (p) {
      case 'snow': y = (y0 + tt * 28 * sp) % h; x = x0 + Math.sin(tt * 0.8 + ph) * 14; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(x, y, sz * 0.8, 0, TAU); ctx.fill(); break;
      case 'bubbles': y = h - ((h - y0 + tt * 30 * sp) % (h + 20)) + 10; x = x0 + Math.sin(tt * 1.3 + ph) * 8; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, sz * 1.6, 0, TAU); ctx.stroke(); break;
      case 'leaves': y = (y0 + tt * 36 * sp) % (h + 20) - 10; x = x0 + Math.sin(tt * 0.9 + ph) * 30; ctx.save(); ctx.translate(x, y); ctx.rotate(tt * sp + ph); ctx.fillStyle = ['#ea580c', '#f59e0b', '#b91c1c', '#ca8a04'][i % 4]; ctx.beginPath(); ctx.ellipse(0, 0, sz * 2.4, sz * 1.2, 0, 0, TAU); ctx.fill(); ctx.restore(); break;
      case 'petals': y = (y0 + tt * 22 * sp) % (h + 20) - 10; x = x0 + Math.sin(tt * 0.7 + ph) * 26; ctx.save(); ctx.translate(x, y); ctx.rotate(tt * 0.8 * sp + ph); ctx.fillStyle = i % 2 ? '#fbcfe8' : '#fef9c3'; ctx.beginPath(); ctx.ellipse(0, 0, sz * 1.8, sz, 0, 0, TAU); ctx.fill(); ctx.restore(); break;
      case 'embers': y = h - ((h - y0 + tt * 45 * sp) % h); x = x0 + Math.sin(tt * 1.5 + ph) * 12; ctx.globalAlpha = clamp(y / h * 1.5, 0, 1); glow(ctx, x, y, sz * 3.5, '#fb923c', 0.7); ctx.fillStyle = '#fde68a'; ctx.fillRect(x - 1, y - 1, 2, 2); ctx.globalAlpha = 1; break;
      case 'sparkles': case 'fireflies': { const k = 0.5 + 0.5 * Math.sin(tt * (1 + sp) + ph); x = x0 + Math.sin(tt * 0.3 + ph) * 18; y = (p === 'fireflies' ? gy * 0.45 + y0 * 0.55 : y0 * 0.9) + Math.cos(tt * 0.4 + ph) * 12; glow(ctx, x, y, sz * (p === 'fireflies' ? 4 : 3) * (0.6 + k), p === 'fireflies' ? '#d9f99d' : '#ffffff', 0.5 * k); ctx.fillStyle = hexA('#fff', 0.9 * k); ctx.fillRect(x - 1, y - 1, 2, 2); break; }
      case 'candy': y = (y0 + tt * 26 * sp) % (h + 20) - 10; x = x0 + Math.sin(tt + ph) * 12; ctx.fillStyle = ['#f43f5e', '#facc15', '#38bdf8', '#a78bfa', '#4ade80'][i % 5]; ctx.beginPath(); ctx.arc(x, y, sz * 1.1, 0, TAU); ctx.fill(); break;
      case 'bits': y = (y0 - tt * 20 * sp + h * 4) % h; x = x0 + Math.sin(tt * 0.5 + ph) * 10; ctx.fillStyle = hexA(W.accent, 0.4 + 0.5 * Math.sin(tt * 2 + ph) ** 2); ctx.fillRect(x, y, sz * 1.6, sz * 1.6); break;
      case 'dust': x = (x0 + tt * 14 * sp) % (w + 20) - 10; y = y0 * 0.8 + gy * 0.2 + Math.sin(tt * 0.6 + ph) * 8; ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x, y, sz * 0.8, sz * 0.8); break;
      case 'rain': y = (y0 + tt * 420 * sp) % h; x = x0 - y * 0.15; ctx.strokeStyle = 'rgba(200,220,255,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 12); ctx.stroke(); break;
      default: break;
    }
  }
}

/* ---------- hoofdschilder ---------- */
function paintBackground(ctx, w, h, world, t = 0) {
  const W = typeof world === 'string' ? Themes.world(world) : (world || WORLDS[0]);
  const q = GFX.q, hz = W.hz || 0.8, gy = h * hz, u = Math.min(w * 1.15, h), seed = hash(W.id), tt = GFX.reduce ? 0 : t;
  const dark = W.mood === 'dark', bot = W.bg[W.bg.length - 1];
  ctx.save();
  paintSky(ctx, w, h, W, tt, hz);
  if (dark || W.particle === 'stars') paintStars(ctx, w, h, tt, hz, 70, seed);
  if (W.rays && q > 0) lightRays(ctx, w, h, tt, { x: w * 0.7, y: -h * 0.05, a: dark ? 0.1 : 0.14 });
  paintDeco(ctx, w, h, W, tt, gy, 'sky');
  const farC = W.farColor || mix(bot, W.ground, 0.3), midC = W.midColor || mix(bot, W.ground, 0.65);
  const lit = dark && (W.far === 'city' || W.far === 'circuit') ? '#fde68a' : null;
  // ver
  silhouette(ctx, W.far, w, gy + 2, u * 0.26, farC, { seed, off: Math.sin(tt * 0.05) * 6, t: tt, cx: w * 0.3, cap: W.cap, lit, dark });
  paintDeco(ctx, w, h, W, tt, gy - u * 0.02, 'far');
  // mid
  silhouette(ctx, W.mid, w, gy + 6, u * 0.17, midC, { seed: seed + 11, off: Math.sin(tt * 0.08) * 12 + 30, t: tt, cx: w * 0.7, lit, dark });
  paintDeco(ctx, w, h, W, tt, gy, 'mid');
  // grond
  paintGround(ctx, w, h, W, tt, gy);
  paintDeco(ctx, w, h, W, tt, gy, 'near');
  paintParticles(ctx, w, h, W, tt, gy);
  if (q === 2) { bokeh(ctx, w, h, tt, { n: 10, color: W.accent, a: 0.1, seed }); }
  if (q > 0) vignette(ctx, w, h, dark ? 0.5 : 0.28);
  ctx.restore();
}

export const Themes = {
  list: WORLDS,
  world(id) { return BYID.get(id) || WORLDS[0]; },
  forGame(gameId) {
    let id = null;
    try { id = globalThis.localStorage.getItem('gfx:world:' + gameId); } catch { /* stil */ }
    return BYID.get(id) || WORLDS[hash(String(gameId)) % WORLDS.length];
  },
  setForGame(gameId, worldId) {
    if (!BYID.has(worldId)) return false;
    try { globalThis.localStorage.setItem('gfx:world:' + gameId, worldId); } catch { /* stil */ }
    return true;
  },
  paintBackground,
  cssVars(world) {
    const W = typeof world === 'string' ? Themes.world(world) : (world || WORLDS[0]);
    return {
      '--world-bg1': W.bg[0], '--world-bg2': W.bg[W.bg.length - 1], '--world-accent': W.accent, '--world-ground': W.ground,
      '--world-grad': `linear-gradient(180deg, ${W.bg.join(', ')})`,
      '--world-text': W.mood === 'dark' ? '#f8fafc' : '#1e293b',
    };
  },
};
export { paintBackground };
