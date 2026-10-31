// Canvas-effecten die op kwaliteit reageren (GFX.q 0/1/2). Geen ctx.filter / shadowBlur: alleen verlopen en alpha.
import { GFX } from './settings.js?v=1';
import { drawIcon } from './art.js?v=1';

export const TAU = Math.PI * 2;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rnd = (a, b) => a + Math.random() * (b - a);
// vaste (seed-)generator zodat achtergronden niet flikkeren
export function rng(seed) {
  let a = (seed | 0) ^ 0x9e3779b9;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

function parse(c) {
  if (typeof c !== 'string') return [255, 255, 255];
  if (c[0] === '#') {
    if (c.length === 4) return [parseInt(c[1] + c[1], 16), parseInt(c[2] + c[2], 16), parseInt(c[3] + c[3], 16)];
    return [parseInt(c.slice(1, 3), 16) || 0, parseInt(c.slice(3, 5), 16) || 0, parseInt(c.slice(5, 7), 16) || 0];
  }
  const m = c.match(/[\d.]+/g);
  return m && m.length >= 3 ? [+m[0], +m[1], +m[2]] : [255, 255, 255];
}
export const hexA = (c, a) => { const [r, g, b] = parse(c); return `rgba(${r},${g},${b},${clamp(a, 0, 1)})`; };
export function mix(c1, c2, t) {
  const a = parse(c1), b = parse(c2);
  return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
}

/* ---------- vaste hulpjes ---------- */

export function softShadow(ctx, x, y, rx, ry, a = 0.3) {
  if (GFX.q === 0) { ctx.fillStyle = hexA('#000', a * 0.7); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); return; }
  ctx.save();
  ctx.translate(x, y); ctx.scale(1, ry / rx);
  const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  gr.addColorStop(0, hexA('#000', a)); gr.addColorStop(0.6, hexA('#000', a * 0.45)); gr.addColorStop(1, hexA('#000', 0));
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill();
  ctx.restore();
}

export function glow(ctx, x, y, r, color = '#fff', a = 0.6) {
  if (r <= 0 || a <= 0) return;
  const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, hexA(color, a)); gr.addColorStop(0.4, hexA(color, a * 0.4)); gr.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

export function vignette(ctx, w, h, a = 0.45) {
  if (GFX.q === 0) a *= 0.6;
  const gr = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.55);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, hexA('#000', a));
  ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
}

// stops: top/bottom of array met kleuren (gelijk verdeeld)
export function gradientSky(ctx, w, h, top, bottom) {
  const gr = ctx.createLinearGradient(0, 0, 0, h);
  const cols = Array.isArray(top) ? top : [top, bottom];
  cols.forEach((c, i) => gr.addColorStop(cols.length === 1 ? 0 : i / (cols.length - 1), c));
  if (cols.length === 1) gr.addColorStop(1, cols[0]);
  ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
}

// Waaier van lichtstralen vanuit (x,y); q0: niets
export function lightRays(ctx, w, h, t, o = {}) {
  if (GFX.q === 0) return;
  const n = GFX.q === 2 ? 9 : 5, x = o.x == null ? w * 0.5 : o.x, y = o.y == null ? -h * 0.05 : o.y;
  const len = Math.hypot(w, h) * 1.1, col = o.color || '#fff', a = (o.a == null ? 0.12 : o.a);
  const sp = GFX.reduce ? 0 : 1;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const base = Math.PI / 2 + (i - (n - 1) / 2) * (0.9 / n) + Math.sin(t * 0.3 * sp + i * 1.7) * 0.06;
    const wd = 0.05 + 0.03 * Math.sin(i * 2.3 + t * 0.5 * sp);
    const gr = ctx.createLinearGradient(x, y, x + Math.cos(base) * len, y + Math.sin(base) * len);
    gr.addColorStop(0, hexA(col, a * (0.6 + 0.4 * Math.sin(t * 0.8 * sp + i)))); gr.addColorStop(1, hexA(col, 0));
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(base - wd) * len, y + Math.sin(base - wd) * len);
    ctx.lineTo(x + Math.cos(base + wd) * len, y + Math.sin(base + wd) * len);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// Zwevende lichtbolletjes; q0: niets
export function bokeh(ctx, w, h, t, o = {}) {
  if (GFX.q === 0) return;
  const n = Math.round((o.n || 14) * (GFX.q === 2 ? 1.5 : 0.8)), r = rng(o.seed || 7), col = o.color || '#fff', a = o.a == null ? 0.12 : o.a;
  const tt = GFX.reduce ? 0 : t;
  for (let i = 0; i < n; i++) {
    const bx = r() * w, by = r() * h, rad = (0.02 + r() * 0.05) * Math.min(w, h), sp = 8 + r() * 18, ph = r() * TAU;
    const x = (bx + Math.sin(tt * 0.2 + ph) * 20 + w) % w, y = ((by - tt * sp) % (h + rad * 2) + h + rad * 2) % (h + rad * 2) - rad;
    const gr = ctx.createRadialGradient(x, y, rad * 0.6, x, y, rad);
    gr.addColorStop(0, hexA(col, a * 0.5)); gr.addColorStop(0.85, hexA(col, a)); gr.addColorStop(1, hexA(col, 0));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
  }
}

/* ---------- deeltjes ---------- */

const CONF = ['#f43f5e', '#f59e0b', '#22c55e', '#38bdf8', '#a78bfa', '#ec4899', '#facc15'];
const MAXP = [120, 260, 520];

function star(ctx, r, pts = 5, inner = 0.45) {
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / pts, rr = i % 2 ? r * inner : r; i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath();
}

export class Particles {
  constructor() { this.list = []; this.t = 0; }
  get count() { return this.list.length; }
  clear() { this.list.length = 0; }

  // kind: coins|sparkle|confetti|smoke|bubbles|stars. o: {n, spread (rad), angle, power, color, size, gravity}
  burst(x, y, o = {}) {
    const kind = o.kind || 'sparkle';
    const n = GFX.particles(o.n == null ? 20 : o.n);
    const room = MAXP[GFX.q] - this.list.length;
    const cnt = Math.min(n, Math.max(0, room));
    const ang = o.angle == null ? -Math.PI / 2 : o.angle, spr = o.spread == null ? Math.PI * 2 : o.spread, pw = o.power || 1, sz = o.size || 1;
    for (let i = 0; i < cnt; i++) {
      const a = ang + (Math.random() - 0.5) * spr, sp = rnd(0.5, 1) * 260 * pw;
      const p = { kind, x: x + rnd(-4, 4), y: y + rnd(-4, 4), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, life: 1.2, g: 0, drag: 0.5, size: 8 * sz, rot: rnd(0, TAU), vr: rnd(-6, 6), c: o.color || '#fde047', ph: rnd(0, TAU) };
      switch (kind) {
        case 'coins': p.g = 700; p.life = rnd(1.1, 1.8); p.size = rnd(22, 30) * sz; p.vy -= 120 * pw; p.drag = 0.2; break;
        case 'confetti': p.g = 260; p.life = rnd(1.6, 2.8); p.size = rnd(6, 11) * sz; p.c = o.color || CONF[(Math.random() * CONF.length) | 0]; p.drag = 1.6; break;
        case 'smoke': p.g = -40; p.life = rnd(0.9, 1.6); p.size = rnd(14, 26) * sz; p.vx *= 0.25; p.vy *= 0.25; p.c = o.color || '#9ca3af'; p.drag = 1.2; break;
        case 'bubbles': p.g = -90; p.life = rnd(1.2, 2.4); p.size = rnd(4, 11) * sz; p.vx *= 0.3; p.vy *= 0.3; p.c = o.color || '#bae6fd'; p.drag = 1; break;
        case 'stars': p.g = 120; p.life = rnd(0.9, 1.5); p.size = rnd(8, 15) * sz; p.c = o.color || '#fde047'; break;
        default: p.g = 0; p.life = rnd(0.5, 1.0); p.size = rnd(5, 10) * sz; p.vx *= 0.6; p.vy *= 0.6; p.drag = 2; p.c = o.color || '#fff7ae';
      }
      if (o.gravity != null) p.g = o.gravity;
      this.list.push(p);
    }
    return cnt;
  }

  update(dt) {
    dt = Math.min(dt, 0.05); this.t += dt;
    const L = this.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i];
      p.age += dt;
      if (p.age >= p.life) { L[i] = L[L.length - 1]; L.pop(); continue; }
      const d = Math.max(0, 1 - p.drag * dt);
      p.vx *= d; p.vy = p.vy * d + p.g * dt;
      p.x += p.vx * dt + (p.kind === 'bubbles' ? Math.sin(p.age * 5 + p.ph) * 0.6 : 0);
      p.y += p.vy * dt; p.rot += p.vr * dt;
    }
  }

  draw(ctx) {
    const L = this.list;
    if (!L.length) return;
    ctx.save();
    for (const p of L) {
      const k = p.age / p.life, fade = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      ctx.globalAlpha = clamp(fade, 0, 1);
      switch (p.kind) {
        case 'coins': {
          const sq = Math.abs(Math.cos(p.age * 9 + p.ph)); // tuimelen: breedte krimpt
          ctx.save(); ctx.translate(p.x, p.y); ctx.scale(0.25 + 0.75 * sq, 1);
          drawIcon(ctx, 'coin', 0, 0, p.size);
          ctx.restore(); break;
        }
        case 'confetti':
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.age * 7 + p.ph));
          ctx.fillStyle = p.c; ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); ctx.restore(); break;
        case 'smoke': {
          const r = p.size * (1 + k * 1.6);
          const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
          gr.addColorStop(0, hexA(p.c, 0.45 * fade)); gr.addColorStop(1, hexA(p.c, 0));
          ctx.globalAlpha = 1; ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill(); break;
        }
        case 'bubbles':
          ctx.strokeStyle = hexA(p.c, 0.9); ctx.fillStyle = hexA(p.c, 0.18); ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(p.x - p.size * 0.35, p.y - p.size * 0.35, p.size * 0.22, 0, TAU); ctx.fill(); break;
        case 'stars':
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; star(ctx, p.size * (1 - k * 0.4)); ctx.fill(); ctx.restore(); break;
        default: { // sparkle: viersprong + gloed
          const s = p.size * (1 - k * 0.6);
          ctx.globalCompositeOperation = 'lighter';
          if (GFX.q > 0) glow(ctx, p.x, p.y, s * 2.2, p.c, 0.5 * fade);
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * 0.3); ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s * 0.12, -s * 0.12, s, 0); ctx.quadraticCurveTo(s * 0.12, s * 0.12, 0, s); ctx.quadraticCurveTo(-s * 0.12, s * 0.12, -s, 0); ctx.quadraticCurveTo(-s * 0.12, -s * 0.12, 0, -s); ctx.fill();
          ctx.restore(); ctx.globalCompositeOperation = 'source-over';
        }
      }
    }
    ctx.restore();
  }
}
export const createParticles = () => new Particles();
