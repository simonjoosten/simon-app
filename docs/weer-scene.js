// Weer: geanimeerde weerscène op canvas (lucht, zon/maan/sterren, wolken, regen, sneeuw, hagel, mist, bliksem, heuvels),
// met 3D-iconen en optioneel een "wereld" als achtergrond. Reageert op kwaliteit en GFX.reduce.
import { GFX, Themes, drawIcon } from './tools-ui.js?v=1';
import { gradientSky, mix, hexA, glow, vignette, rng } from './gfx/fx.js?v=1';

const TAU = Math.PI * 2;
const DAY = { clear: ['#2f7ae5', '#8fc5f7'], mostly: ['#4a90e2', '#a8d0f5'], partly: ['#5b8fc7', '#b4cde6'], cloudy: ['#8191a7', '#c3ccd6'], fog: ['#aab3be', '#dde2e8'], drizzle: ['#73849b', '#b0bcc9'], rain: ['#576981', '#94a1b2'], heavy: ['#3d495b', '#78859a'], snow: ['#94a9c0', '#e3ebf3'], storm: ['#262d3b', '#535c74'] };
const NIGHT = { clear: ['#040714', '#1a2a5e'], mostly: ['#060a1c', '#1c2b56'], partly: ['#0a1022', '#26324e'], cloudy: ['#10151f', '#2a3344'], fog: ['#1a202b', '#3a4354'], drizzle: ['#0e131d', '#27303f'], rain: ['#0b1019', '#222b3a'], heavy: ['#080c14', '#1b2230'], snow: ['#1a2233', '#4a5a73'], storm: ['#05070d', '#1a2030'] };
const CLOUDCOL = { clear: '#ffffff', mostly: '#ffffff', partly: '#f4f7fb', cloudy: '#d7dde6', fog: '#e5e9ee', drizzle: '#c3cbd6', rain: '#9aa6b6', heavy: '#6b7686', snow: '#e8eef5', storm: '#4b5365' };

/** Nummer 0..1 naar tijdstip van de dag: nodig voor de stand van zon/maan. */
export class WeatherScene {
  constructor() { this.p = null; this.drops = []; this.flakes = []; this.clouds = []; this.stars = []; this.flash = 0; this.nextFlash = 2.5; this.bolt = null; this.fogT = 0; this.splash = []; this.sunFrac = 0.5; this.world = null; this.key = ''; }

  /** params = sceneParams(...) ; o = { sunFrac (0..1 of null), world, seed } */
  set(params, o = {}) {
    this.p = params; this.sunFrac = o.sunFrac == null ? (params.night ? null : 0.5) : o.sunFrac; this.world = o.world || null;
    const key = [params.kind, Math.round(params.clouds * 10), Math.round(params.precip * 10), params.night, GFX.q].join('|');
    if (key === this.key) return; this.key = key;
    const r = rng(7), q = GFX.q;
    this.clouds = Array.from({ length: Math.round(params.clouds * [5, 8, 12][q]) }, (_, i) => ({ x: r(), y: 0.06 + r() * 0.42, s: 0.16 + r() * 0.22, v: 4 + r() * 10, layer: r() < 0.5 ? 0 : 1, ph: r() * TAU }));
    this.stars = Array.from({ length: [40, 80, 140][q] }, () => ({ x: r(), y: r() * 0.7, s: 0.6 + r() * 1.6, ph: r() * TAU }));
    const base = [50, 110, 200][q], n = Math.round(params.precip * base);
    this.drops = Array.from({ length: n }, () => ({ x: r(), y: r(), l: 0.5 + r() * 0.8, v: 0.8 + r() * 0.7, ph: r() * TAU }));
    this.splash.length = 0;
  }

  update(dt, w, h) {
    const p = this.p; if (!p || GFX.reduce) return;
    const slant = Math.max(-0.7, Math.min(0.7, p.wind / 70));
    for (const c of this.clouds) { c.x += (c.v * (c.layer ? 1.4 : 0.8) * dt * (1 + p.wind / 40)) / Math.max(1, w); if (c.x > 1.3) c.x = -0.3; }
    for (const d of this.drops) {
      if (p.flakes) { d.y += d.v * dt * 0.1 * (p.hail ? 5 : 1); d.x += Math.sin(d.ph + performance.now() / 900 + d.y * 6) * dt * 0.02 + slant * dt * 0.05; }
      else { d.y += d.v * dt * (p.hail ? 1.1 : 1.7); d.x += slant * dt * 0.9; }
      if (d.y > 1) { if (!p.flakes && GFX.q === 2 && this.splash.length < 60) this.splash.push({ x: d.x, age: 0 }); d.y -= 1.05; d.x = Math.random(); }
      if (d.x > 1.05) d.x -= 1.1; if (d.x < -0.05) d.x += 1.1;
    }
    for (let i = this.splash.length - 1; i >= 0; i--) { this.splash[i].age += dt; if (this.splash[i].age > 0.35) this.splash.splice(i, 1); }
    if (p.thunder) {
      this.nextFlash -= dt; if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2.5);
      if (this.nextFlash <= 0) { this.flash = 1; this.nextFlash = 3 + Math.random() * 4; const pts = []; let x = 0.2 + Math.random() * 0.6, y = 0.25; while (y < 0.82) { pts.push([x, y]); x += (Math.random() - 0.5) * 0.08; y += 0.06 + Math.random() * 0.05; } this.bolt = pts; }
    }
  }

  cloudShape(ctx, x, y, s, col, a) {
    ctx.save(); ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(0, y - s * 0.5, 0, y + s * 0.4); g.addColorStop(0, col); g.addColorStop(1, mix(col, '#7b8798', 0.35));
    ctx.fillStyle = g; ctx.beginPath();
    ctx.arc(x - s * 0.55, y, s * 0.38, 0, TAU); ctx.arc(x - s * 0.2, y - s * 0.22, s * 0.46, 0, TAU); ctx.arc(x + s * 0.28, y - s * 0.14, s * 0.4, 0, TAU); ctx.arc(x + s * 0.62, y + s * 0.04, s * 0.32, 0, TAU);
    ctx.rect(x - s * 0.55, y, s * 1.2, s * 0.34); ctx.fill(); ctx.restore();
  }

  draw(ctx, w, h, t) {
    const p = this.p; if (!p) return;
    const night = p.night, q = GFX.q, pal = (night ? NIGHT : DAY)[p.kind] || DAY.clear;
    ctx.save();
    // lucht (of een hele wereld)
    if (this.world) { Themes.paintBackground(ctx, w, h, this.world, GFX.reduce ? 0 : t); ctx.fillStyle = `rgba(${night ? '5,10,30' : '40,50,70'},${Math.min(0.75, p.clouds * 0.45 + p.precip * 0.2 + (night ? 0.25 : 0))})`; ctx.fillRect(0, 0, w, h); }
    else {
      let top = pal[0], bot = pal[1];
      if (this.sunFrac != null && !night && (this.sunFrac < 0.07 || this.sunFrac > 0.93)) { const k = this.sunFrac < 0.07 ? 1 - this.sunFrac / 0.07 : (this.sunFrac - 0.93) / 0.07; bot = mix(bot, '#fb923c', 0.55 * k * (1 - p.clouds * 0.5)); top = mix(top, '#6d4a9c', 0.3 * k); }
      gradientSky(ctx, w, h, top, bot);
    }
    // sterren
    if (night && p.clouds < 0.75) for (const s of this.stars) { const tw = GFX.reduce ? 1 : 0.6 + 0.4 * Math.sin(t * 2 + s.ph); ctx.fillStyle = `rgba(255,255,255,${(0.85 - p.clouds) * tw})`; ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.s * (w / 400 + 0.5), 0, TAU); ctx.fill(); }
    // zon of maan
    const vis = 1 - Math.min(1, p.clouds * 1.05);
    if (!night && this.sunFrac != null && !this.world) {
      const f = this.sunFrac, sx = w * (0.14 + 0.72 * f), sy = h * (0.58 - 0.4 * Math.sin(Math.PI * f)), sz = Math.min(w, h) * 0.3;
      if (vis > 0.05) { glow(ctx, sx, sy, sz * 2.2, '#fde68a', 0.55 * vis); if (q > 0 && !GFX.reduce) { ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * 0.08); ctx.fillStyle = `rgba(255,244,190,${0.1 * vis})`; for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sz * 3, -sz * 0.12); ctx.lineTo(sz * 3, sz * 0.12); ctx.fill(); } ctx.restore(); } drawIcon(ctx, 'sun', sx, sy, sz, { alpha: Math.max(0.15, vis) }); }
      else if (p.clouds < 1) drawIcon(ctx, 'sun', sx, sy, sz * 0.8, { alpha: 0.3 });
    } else if (night && !this.world) {
      const mx = w * 0.76, my = h * 0.26, sz = Math.min(w, h) * 0.24; glow(ctx, mx, my, sz * 2, '#c7d2fe', 0.35 * Math.max(0.2, vis)); drawIcon(ctx, 'moon', mx, my, sz, { alpha: Math.max(0.2, vis) });
    }
    // wolken (twee lagen, parallax)
    const ccol = night ? mix(CLOUDCOL[p.kind] || '#d7dde6', '#1f2937', 0.7) : (CLOUDCOL[p.kind] || '#fff');
    for (const layer of [0, 1]) for (const c of this.clouds) { if (c.layer !== layer) continue; const bob = GFX.reduce ? 0 : Math.sin(t * 0.4 + c.ph) * 3; this.cloudShape(ctx, c.x * w * 1.3 - w * 0.15, c.y * h + bob, c.s * Math.min(w, h * 2) * (layer ? 1.15 : 0.85), ccol, layer ? 0.95 : 0.7); }
    // mist
    if (p.fog) { for (let i = 0; i < 5; i++) { const y = h * (0.25 + i * 0.14), dx = GFX.reduce ? 0 : Math.sin(t * 0.15 + i) * w * 0.08; const g = ctx.createLinearGradient(0, y - h * 0.1, 0, y + h * 0.1); g.addColorStop(0, 'rgba(235,240,245,0)'); g.addColorStop(0.5, `rgba(235,240,245,${night ? 0.25 : 0.5})`); g.addColorStop(1, 'rgba(235,240,245,0)'); ctx.fillStyle = g; ctx.fillRect(dx - w * 0.1, y - h * 0.1, w * 1.2, h * 0.2); } }
    // heuvels (alleen zonder wereld)
    if (!this.world) {
      const snowy = p.kind === 'snow', gcol = snowy ? '#f1f5f9' : p.kind === 'storm' || p.kind === 'heavy' ? '#2d4a35' : '#3f8a47';
      for (let L = 0; L < 2; L++) { ctx.fillStyle = night ? mix(L ? gcol : mix(gcol, '#94a3b8', 0.3), '#050816', 0.72) : (L ? gcol : mix(gcol, '#cbd5e1', 0.35)); ctx.beginPath(); ctx.moveTo(0, h); for (let x = 0; x <= w + 8; x += 8) { const y = h * (0.86 - L * 0.06) - Math.sin(x / w * (3 + L * 2) + L * 1.7) * h * 0.04 - Math.sin(x / w * 9 + L) * h * 0.012; ctx.lineTo(x, y); } ctx.lineTo(w, h); ctx.closePath(); ctx.fill(); }
    }
    // regen / sneeuw / hagel
    if (this.drops.length) {
      const slant = Math.max(-0.7, Math.min(0.7, p.wind / 70));
      if (p.flakes && !p.hail) { ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.beginPath(); for (const d of this.drops) { const r = (1.2 + d.l * 2.2) * (w / 380 + 0.6); ctx.moveTo(d.x * w + r, d.y * h); ctx.arc(d.x * w, d.y * h, r, 0, TAU); } ctx.fill(); }
      else if (p.hail) { ctx.fillStyle = 'rgba(235,245,255,.9)'; ctx.beginPath(); for (const d of this.drops) { const r = 1.5 + d.l * 1.8; ctx.moveTo(d.x * w + r, d.y * h); ctx.arc(d.x * w, d.y * h, r, 0, TAU); } ctx.fill(); }
      else { ctx.strokeStyle = night ? 'rgba(190,210,255,.5)' : 'rgba(215,230,255,.65)'; ctx.lineWidth = 1.2 + (w > 500 ? 0.6 : 0); ctx.lineCap = 'round'; ctx.beginPath(); for (const d of this.drops) { const x = d.x * w, y = d.y * h, len = (10 + d.l * 16) * (p.kind === 'drizzle' ? 0.6 : 1); ctx.moveTo(x, y); ctx.lineTo(x + slant * len * 1.6, y + len); } ctx.stroke(); }
      if (this.splash.length) { ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1; for (const s of this.splash) { ctx.beginPath(); ctx.ellipse(s.x * w, h * 0.93, 3 + s.age * 22, 1 + s.age * 5, 0, 0, TAU); ctx.stroke(); } }
    }
    // bliksem
    if (p.thunder && this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.5})`; ctx.fillRect(0, 0, w, h);
      if (this.bolt && this.flash > 0.4) { ctx.strokeStyle = `rgba(255,250,200,${this.flash})`; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath(); this.bolt.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h))); ctx.stroke(); ctx.strokeStyle = `rgba(255,255,255,${this.flash})`; ctx.lineWidth = 1.5; ctx.stroke(); }
    }
    if (q > 0) vignette(ctx, w, h, night ? 0.45 : 0.2);
    ctx.restore();
  }
}
