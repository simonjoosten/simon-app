// Korte geanimeerde scènes (intro's / overwinning) in canvas. Scenes.play(host, id, opts) -> { stop(), done }.
// opts: {title, sub, theme (wereld-id voor de achtergrond), w, h, loop, skippable, value (getal/tekst, extra), icon (extra: held-icoon)}
// Elke scène: >=3 lagen (achtergrond, parallax/decor, held, deeltjes, titel). Tik = overslaan. GFX.reduce -> statisch beeld + korte fade.
import { GFX } from './settings.js?v=1';
import { drawIcon } from './art.js?v=1';
import { Particles, TAU, clamp, lerp, hexA, glow, softShadow, vignette, lightRays, gradientSky, rng, bokeh } from './fx.js?v=1';
import { Themes } from './themes.js?v=1';

const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const E = {
  out: (x) => 1 - Math.pow(1 - x, 3),
  in: (x) => x * x * x,
  io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  back: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  elastic: (x) => (x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (TAU / 3)) + 1),
  bounce: (x) => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; },
};
const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';

/* ---------- gedeelde bouwstenen ---------- */
function flip(ctx, name, x, y, s, dir, o) { ctx.save(); ctx.translate(x, y); ctx.scale(dir < 0 ? 1 : -1, 1); drawIcon(ctx, name, 0, 0, s, o); ctx.restore(); }
function pop(ctx, name, x, y, s, t, t0, o = {}) { // verschijnt met elastische schaal
  const p = seg(t, t0, t0 + (o.d || 0.7)); if (p <= 0) return 0;
  const k = E.elastic(p); drawIcon(ctx, name, x, y, s * Math.max(0.01, k), Object.assign({ alpha: clamp(p * 4, 0, 1) }, o)); return p;
}
function sunburst(ctx, cx, cy, R, n, rot, col, a) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  for (let i = 0; i < n; i++) {
    const g = ctx.createLinearGradient(0, 0, R, 0); g.addColorStop(0, hexA(col, a)); g.addColorStop(1, hexA(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, (i / n) * TAU, ((i + 0.5) / n) * TAU); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function ring(ctx, x, y, r, col, a, lw) { if (a <= 0) return; ctx.strokeStyle = hexA(col, a); ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); ctx.stroke(); }
function chevron(ctx, x, y, s, col, a) { ctx.strokeStyle = hexA(col, a); ctx.lineWidth = s * 0.28; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - s, y + s * 0.5); ctx.lineTo(x, y - s * 0.5); ctx.lineTo(x + s, y + s * 0.5); ctx.stroke(); }
function wrapX(x0, speed, t, w, pad) { const L = w + pad * 2; return (((x0 + t * speed) % L) + L) % L - pad; }

// Titel: letter voor letter met veer-easing, daarna subtitel. Rand + donkere gloed zonder blur.
function drawTitle(c, text, sub, t0) {
  const { ctx, w, h, t, u } = c; if (!text || t < t0) return;
  let fs = Math.round(u * 0.115); ctx.font = `900 ${fs}px ${FONT}`;
  const mw = w * 0.9; while (ctx.measureText(text).width > mw && fs > 14) { fs -= 2; ctx.font = `900 ${fs}px ${FONT}`; }
  const chars = [...text], widths = chars.map((ch) => ctx.measureText(ch).width), total = widths.reduce((a, b) => a + b, 0);
  const y = h * 0.2, x0 = (w - total) / 2;
  ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
  glow(ctx, w / 2, y, total * 0.7, '#000', 0.25);
  let x = x0;
  chars.forEach((ch, i) => {
    const p = c.reduce ? 1 : seg(t - t0, i * 0.045, i * 0.045 + 0.45), k = E.back(p);
    if (p > 0 && ch !== ' ') {
      ctx.save(); ctx.globalAlpha = clamp(p * 3, 0, 1); ctx.translate(x + widths[i] / 2, y + (1 - k) * fs * 0.9); ctx.rotate((1 - k) * 0.35 * (i % 2 ? 1 : -1)); ctx.scale(0.5 + 0.5 * k, 0.5 + 0.5 * k);
      ctx.textAlign = 'center'; ctx.strokeStyle = 'rgba(20,10,50,.85)'; ctx.lineWidth = fs * 0.2; ctx.strokeText(ch, 0, fs * 0.06);
      const gr = ctx.createLinearGradient(0, -fs / 2, 0, fs / 2); gr.addColorStop(0, '#fff'); gr.addColorStop(1, c.accent || '#fde68a');
      ctx.fillStyle = gr; ctx.fillText(ch, 0, 0); ctx.restore();
    }
    x += widths[i];
  });
  if (sub) {
    const ps = c.reduce ? 1 : E.out(seg(t - t0, 0.5, 1.0)); let sf = Math.round(u * 0.052); ctx.font = `700 ${sf}px ${FONT}`;
    while (ctx.measureText(sub).width > mw && sf > 11) { sf -= 1; ctx.font = `700 ${sf}px ${FONT}`; }
    ctx.globalAlpha = ps; ctx.textAlign = 'center'; ctx.strokeStyle = 'rgba(20,10,50,.8)'; ctx.lineWidth = sf * 0.28; ctx.strokeText(sub, w / 2, y + fs * 0.85 + (1 - ps) * 10);
    ctx.fillStyle = '#fff'; ctx.fillText(sub, w / 2, y + fs * 0.85 + (1 - ps) * 10);
  }
  ctx.restore();
}
function bigValue(c, text, y, t0, col = '#fde68a') {
  if (text == null || text === '' || c.t < t0) return;
  const { ctx, w, u } = c; const p = c.reduce ? 1 : E.elastic(seg(c.t, t0, t0 + 0.8)), fs = Math.round(u * 0.17 * (0.6 + 0.4 * p));
  ctx.save(); ctx.globalAlpha = clamp(p * 3, 0, 1); ctx.font = `900 ${fs}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(30,10,60,.9)'; ctx.lineWidth = fs * 0.16; ctx.strokeText(String(text), w / 2, y); ctx.fillStyle = col; ctx.fillText(String(text), w / 2, y); ctx.restore();
}
const confetti = (c, x, y, ang, n = 40) => c.fx.burst(x, y, { kind: 'confetti', n, angle: ang, spread: 0.9, power: 2.1 });

/* ---------- de scènes ---------- */
// titleAt: wanneer de titel verschijnt. world: achtergrond (Themes) of eigen bg-functie.
const S = {};
const def = (id, o) => { S[id] = o; };

def('intro-ruimte', { name: 'Ruimte-intro', world: 'ruimte', dur: 3.8, title: 'Naar de ruimte!', sub: 'Klaar voor de lancering?', titleAt: 0.9, accent: '#c4b5fd',
  draw(c) {
    const { ctx, w, h, t, u } = c;
    if (GFX.q > 0) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.2; const r = rng(3); for (let i = 0; i < (GFX.q === 2 ? 26 : 12); i++) { const sp = 160 + r() * 260, x = wrapX(r() * w, -sp * 0.5, c.tm, w, 40), y = (r() * h + c.tm * sp) % (h + 60) - 30; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 6, y - 22); ctx.stroke(); } }
    drawIcon(ctx, 'planet', w * 0.2 - c.tm * 6, h * 0.46, u * 0.34, { alpha: 0.9, rot: -0.2 });
    drawIcon(ctx, 'comet', wrapX(w * 0.9, -90, c.tm, w, 80), h * 0.12 + c.tm * 14, u * 0.12, { alpha: 0.8 });
    const p = E.io(seg(t, 0, 2.6)), x = lerp(-w * 0.1, w * 0.74, p), y = lerp(h * 1.0, h * 0.34, p) - Math.sin(p * Math.PI) * h * 0.08 + (p >= 1 ? Math.sin(t * 2) * 5 : 0), s = u * (0.22 + 0.1 * p);
    glow(ctx, x - s * 0.3, y + s * 0.3, s * 0.9, '#fb923c', 0.55);
    drawIcon(ctx, 'rocket', x, y, s, { rot: Math.sin(t * 9) * 0.03 });
    if (p < 1) { c.emit('tr', 40, () => { c.fx.burst(x - s * 0.3, y + s * 0.35, { kind: 'smoke', n: 1, angle: Math.PI * 0.75, spread: 0.5, power: 0.6, color: '#e5e7eb' }); }); c.emit('sp', 25, () => c.fx.burst(x - s * 0.25, y + s * 0.3, { kind: 'sparkle', n: 1, angle: Math.PI * 0.75, spread: 0.8, power: 0.8, color: '#fbbf24' })); }
    pop(ctx, 'star', w * 0.12, h * 0.3, u * 0.1, t, 1.6); pop(ctx, 'ufo', w * 0.86, h * 0.62, u * 0.14, t, 2.0);
  } });

def('intro-onderwater', { name: 'Onderwater-intro', world: 'onderwater', dur: 3.8, title: 'Duik de diepte in!', sub: 'Wat zwemt daar?', titleAt: 0.8, accent: '#a5f3fc',
  draw(c) {
    const { ctx, w, h, t, u } = c;
    for (let i = 0; i < (GFX.q === 0 ? 3 : 6); i++) { const far = i % 2, s = u * (far ? 0.09 : 0.15), sp = 18 + i * 9, dir = i % 3 === 0 ? -1 : 1; const x = wrapX(i * w * 0.31, sp * dir, c.tm, w, s * 2); flip(ctx, 'fish', x, h * (0.32 + i * 0.075) + Math.sin(t * 2 + i) * 6, s, dir, { alpha: far ? 0.55 : 0.95 }); }
    const p = E.out(seg(t, 0, 2.2)), sx = lerp(-w * 0.2, w * 0.45, p), sy = h * 0.5 + Math.sin(t * 1.4) * 10;
    flip(ctx, 'submarine', sx, sy, u * 0.34, 1, {});
    c.emit('bb', 9, () => c.fx.burst(sx - u * 0.17, sy - u * 0.02, { kind: 'bubbles', n: 1, angle: -Math.PI / 2, spread: 1, power: 0.4 }));
    pop(ctx, 'whale', w * 0.78, h * 0.28, u * 0.3, t, 1.5, { d: 1 }); pop(ctx, 'jellyfish', w * 0.12, h * 0.58, u * 0.14, t, 1.9);
    pop(ctx, 'octopus', w * 0.22, h * 0.8, u * 0.16, t, 2.3); pop(ctx, 'crab', w * 0.72, h * 0.85, u * 0.13, t, 2.5);
  } });

def('intro-kasteel', { name: 'Kasteel-intro', world: 'kasteel', dur: 3.8, title: 'Het kasteel wacht!', sub: 'Durf jij naar binnen?', titleAt: 1.1, accent: '#fde68a',
  draw(c) {
    const { ctx, w, h, t, u } = c;
    const p = E.back(seg(t, 0.1, 1.4)), cs = u * 0.48, cy = lerp(h + cs, h * 0.6, p);
    softShadow(ctx, w / 2, h * 0.8, cs * 0.5, cs * 0.07, 0.35 * p);
    drawIcon(ctx, 'castle', w / 2, cy, cs);
    c.at(1.4, () => { c.fx.burst(w / 2, h * 0.5, { kind: 'sparkle', n: 24, power: 1.2 }); c.fx.burst(w / 2, h * 0.5, { kind: 'stars', n: 10, power: 1.1 }); });
    for (const sgn of [-1, 1]) { const q = E.out(seg(t, 0.9 + (sgn > 0) * 0.2, 1.6)); drawIcon(ctx, 'flag', w / 2 + sgn * cs * 0.62, lerp(h, h * 0.6, q), u * 0.13, { rot: Math.sin(t * 4 + sgn) * 0.12 }); }
    const dq = seg(t, 1.6, 3.6); if (dq > 0 && dq < 1) flip(ctx, 'dragon', lerp(-u * 0.2, w + u * 0.2, dq), h * 0.22 + Math.sin(dq * 9) * 14, u * 0.2, 1, {});
    const cq = seg(t, 2.1, 2.9); if (cq > 0) drawIcon(ctx, 'crown', w / 2, lerp(-u * 0.1, h * 0.3, E.bounce(cq)), u * 0.12, { shadow: false });
  } });

def('intro-bos', { name: 'Bos-intro', world: 'bos', dur: 3.8, title: 'Het bos in!', sub: 'Wie woont er hier?', titleAt: 1.0, accent: '#bbf7d0',
  draw(c) {
    const { ctx, w, h, t, u } = c; const pan = (1 - E.out(seg(t, 0, 2.6)));
    const trees = [['pine', 0.08, 0.3, 0.9], ['tree', 0.92, 0.32, 0.9], ['pine', 0.0, 0.42, 1.2], ['tree', 1.0, 0.44, 1.2]];
    for (const [n, fx, sz, par] of trees) { const x = w * fx + (fx < 0.5 ? -1 : 1) * pan * w * 0.4 * par, s = u * sz; drawIcon(ctx, n, x, h * 0.86 - s * 0.35, s, { rot: Math.sin(t * 1.2 + fx * 5) * 0.015 }); }
    const fq = seg(t, 0.6, 3.3); flip(ctx, 'fox', lerp(-u * 0.2, w * 0.62, E.out(fq)), h * 0.84 + Math.abs(Math.sin(t * 9)) * -10 * (fq < 1 ? 1 : 0), u * 0.2, 1, { shadow: true });
    pop(ctx, 'owl', w * 0.78, h * 0.5, u * 0.16, t, 1.8); pop(ctx, 'mushroom', w * 0.3, h * 0.88, u * 0.1, t, 2.2); pop(ctx, 'flower', w * 0.5, h * 0.9, u * 0.09, t, 2.4);
    for (let i = 0; i < 3; i++) drawIcon(ctx, 'butterfly', w * (0.2 + i * 0.28) + Math.sin(t * 1.3 + i * 2) * 40, h * 0.58 + Math.cos(t * 1.7 + i) * 22, u * 0.07, { rot: Math.sin(t * 8 + i) * 0.2 });
  } });

def('intro-stad', { name: 'Stad-intro', world: 'stad', dur: 3.6, title: 'Welkom in de stad!', sub: 'Wat ga je bouwen?', titleAt: 1.0, accent: '#bae6fd',
  draw(c) {
    const { ctx, w, h, t, u } = c;
    ['skyscraper', 'house', 'shop', 'skyscraper', 'school'].forEach((n, i) => { const q = E.back(seg(t, 0.2 + i * 0.28, 0.9 + i * 0.28)); if (q <= 0) return; const s = u * (n === 'skyscraper' ? 0.3 : 0.2); ctx.save(); ctx.translate(w * (0.1 + i * 0.2), h * 0.74); ctx.scale(1, q); drawIcon(ctx, n, 0, -s * 0.45, s); ctx.restore(); });
    const cars = [['car', 0.14, 70, 0], ['bus', 0.2, 50, 1.1], ['truck', 0.16, 85, 2.2], ['car', 0.12, 110, 3.1]];
    cars.forEach(([n, sz, sp, o], i) => { const lane = h * (0.8 + (i % 2) * 0.05), x = wrapX(o * 60 - 60, sp * 2.2, c.tm, w, u * 0.2); flip(ctx, n, x, lane + Math.sin(t * 20 + i) * 0.8, u * sz, 1, { shadow: true }); });
    drawIcon(ctx, 'plane', wrapX(-u * 0.2, 80, c.tm, w, u * 0.2), h * 0.4, u * 0.1, { rot: -0.05, alpha: 0.9 });
    pop(ctx, 'bridge', w * 0.5, h * 0.64, u * 0.2, t, 2.0);
    c.at(2.2, () => c.fx.burst(w / 2, h * 0.5, { kind: 'sparkle', n: 18 }));
  } });

def('intro-pretpark', { name: 'Pretpark-intro', world: 'pretpark', dur: 3.8, title: 'Pretpark!', sub: 'Wie durft in het reuzenrad?', titleAt: 0.9, accent: '#fecdd3',
  draw(c) {
    const { ctx, w, h, t, u } = c; const cx = w / 2, cy = h * 0.52, R = u * 0.3, sc = E.back(seg(t, 0, 0.9)), rot = t * 0.5;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc);
    ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = u * 0.012; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-R * 0.55, R * 1.35); ctx.lineTo(0, 0); ctx.lineTo(R * 0.55, R * 1.35); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, R * 0.7, 0, TAU); ctx.stroke();
    for (let i = 0; i < 10; i++) { const a = rot + (i / 10) * TAU, gx = Math.cos(a) * R, gy = Math.sin(a) * R; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(gx, gy); ctx.stroke(); ctx.fillStyle = ['#f43f5e', '#fbbf24', '#22c55e', '#38bdf8', '#a78bfa'][i % 5]; ctx.beginPath(); ctx.moveTo(gx - u * 0.025, gy + u * 0.075); ctx.lineTo(gx + u * 0.025, gy + u * 0.075); ctx.lineTo(gx + u * 0.03, gy + u * 0.02); ctx.lineTo(gx - u * 0.03, gy + u * 0.02); ctx.closePath(); ctx.fill(); }
    glow(ctx, 0, 0, R * 0.2, '#fff', 0.8); ctx.restore();
    for (let i = 0; i < 4; i++) { const q = seg(t, 0.5 + i * 0.4, 3.6 + i * 0.4); if (q > 0 && q < 1) drawIcon(ctx, 'balloon', w * (0.15 + i * 0.23) + Math.sin(t * 2 + i) * 10, lerp(h * 1.1, -u * 0.1, q), u * 0.13, { rot: Math.sin(t * 2 + i) * 0.08 }); }
    pop(ctx, 'rollercoaster', w * 0.2, h * 0.84, u * 0.2, t, 1.6); pop(ctx, 'carousel', w * 0.82, h * 0.84, u * 0.2, t, 1.9);
    c.at(0.8, () => confetti(c, w * 0.1, h * 0.9, -1.2)); c.at(1.2, () => confetti(c, w * 0.9, h * 0.9, -Math.PI + 1.2)); c.at(2.4, () => confetti(c, w / 2, h * 0.95, -Math.PI / 2, 50));
  } });

def('intro-boerderij', { name: 'Boerderij-intro', world: 'boerderij', dur: 3.8, title: 'Op de boerderij!', sub: 'De dieren wachten op je', titleAt: 1.0, accent: '#fef08a',
  draw(c) {
    const { ctx, w, h, t, u } = c; sunburst(ctx, w * 0.74, h * 0.2, u * 0.9, 12, t * 0.08, '#fff7d6', GFX.q ? 0.14 : 0.08);
    drawIcon(ctx, 'barn', w * 0.2, h * 0.7, u * 0.34); drawIcon(ctx, 'windmill', w * 0.84, h * 0.66, u * 0.3, { rot: Math.sin(t * 1.2) * 0.03 });
    [['cow', 0.3], ['pig', 0.5], ['sheep', 0.68], ['chicken', 0.84]].forEach(([n, fx], i) => { const t0 = 0.5 + i * 0.4, q = seg(t, t0, t0 + 0.7); if (q <= 0) return; const y = h * 0.87 - Math.abs(Math.sin(q * Math.PI * 2.5)) * (1 - q) * u * 0.15, sq = 1 + (1 - E.out(q)) * 0.0; ctx.save(); ctx.translate(w * fx, y); ctx.scale(sq, 1); drawIcon(ctx, n, 0, 0, u * 0.17, { shadow: true }); ctx.restore(); c.at(t0 + 0.6, () => c.fx.burst(w * fx, h * 0.9, { kind: 'sparkle', n: 6, power: 0.6 })); });
    const tq = seg(t, 1.8, 3.8); if (tq > 0 && tq < 1) flip(ctx, 'tractor', lerp(-u * 0.2, w + u * 0.2, tq), h * 0.95 + Math.sin(t * 22) * 1, u * 0.2, 1, { shadow: true });
    drawIcon(ctx, 'wheat', w * 0.06, h * 0.92, u * 0.12, { rot: Math.sin(t * 2) * 0.05 }); drawIcon(ctx, 'wheat', w * 0.95, h * 0.93, u * 0.11, { rot: Math.sin(t * 2 + 1) * 0.05 });
  } });

def('intro-snoepland', { name: 'Snoepland-intro', world: 'snoepland', dur: 3.8, title: 'Snoepland!', sub: 'Mmm, wat lekker!', titleAt: 1.1, accent: '#fff1f2',
  draw(c) {
    const { ctx, w, h, t, u } = c; const q0 = E.out(seg(t, 0, 1.2)); drawIcon(ctx, 'rainbow', w / 2, h * 0.5, u * 0.7 * q0, { alpha: 0.9 * q0 });
    const items = ['lollipop', 'icecream', 'cupcake', 'donut', 'candy', 'cookie', 'cake', 'lollipop', 'cupcake'], r = rng(5);
    items.forEach((n, i) => { const t0 = 0.2 + i * 0.26, p = seg(t, t0, t0 + 0.9); if (p <= 0) return; const gy = h * (0.8 + (i % 3) * 0.045), fx = (i + 0.5) / items.length, y = lerp(-u * 0.2, gy, E.bounce(p)), s = u * (0.12 + r() * 0.05); ctx.save(); ctx.translate(w * fx, y); const sq = p > 0.35 && p < 0.6 ? 1 + Math.sin((p - 0.35) / 0.25 * Math.PI) * 0.1 : 1; ctx.scale(1 / sq, sq); drawIcon(ctx, n, 0, 0, s, { rot: (1 - p) * 0.8 * (i % 2 ? 1 : -1) }); ctx.restore(); c.at(t0 + 0.4, () => c.fx.burst(w * fx, gy + s * 0.3, { kind: 'sparkle', n: 6, power: 0.5, color: '#fff' })); });
    drawIcon(ctx, 'icecream', w * 0.84, h * 0.4 + Math.sin(t * 2) * 8, u * 0.2, { rot: Math.sin(t * 1.5) * 0.1, alpha: E.out(seg(t, 1.5, 2.2)) });
  } });

def('victory', { name: 'Overwinning', bg: ['#1e1b4b', '#5b21b6', '#c026d3'], dur: 3.6, title: 'Gewonnen!', sub: 'Wat een topprestatie!', titleAt: 0.7, accent: '#fde68a',
  draw(c) {
    const { ctx, w, h, t, u } = c; sunburst(ctx, w / 2, h * 0.55, Math.hypot(w, h), 18, t * 0.25, '#fde68a', 0.2 * E.out(seg(t, 0, 1)));
    glow(ctx, w / 2, h * 0.55, u * 0.5, '#fde047', 0.45 + 0.1 * Math.sin(t * 4));
    for (let i = 0; i < 8; i++) { const a = t * 0.9 + (i / 8) * TAU, R = u * (0.3 + 0.04 * Math.sin(t * 2 + i)) * E.out(seg(t, 0.6, 1.6)); drawIcon(ctx, 'star', w / 2 + Math.cos(a) * R, h * 0.55 + Math.sin(a) * R * 0.7, u * 0.07, { rot: a }); }
    const tr = pop(ctx, 'trophy', w / 2, h * 0.55, u * 0.46, t, 0.2, { d: 1, shadow: true }); if (tr >= 1) { /* zachte zweving */ }
    c.at(0.5, () => { confetti(c, w * 0.05, h * 0.95, -1.15, 55); confetti(c, w * 0.95, h * 0.95, -Math.PI + 1.15, 55); c.fx.burst(w / 2, h * 0.5, { kind: 'stars', n: 14, power: 1.3 }); });
    c.at(1.7, () => { confetti(c, w * 0.25, h * 1.0, -1.3, 40); confetti(c, w * 0.75, h * 1.0, -Math.PI + 1.3, 40); });
    c.emit('sp', 10, () => c.fx.burst(w / 2 + (Math.random() - 0.5) * u * 0.5, h * 0.55 + (Math.random() - 0.5) * u * 0.4, { kind: 'sparkle', n: 1, power: 0.2 }));
  } });

def('levelup', { name: 'Level omhoog', bg: ['#0c4a6e', '#0e7490', '#10b981'], dur: 3.2, title: 'Level omhoog!', sub: 'Je wordt steeds sterker', titleAt: 0.8, accent: '#a7f3d0',
  draw(c) {
    const { ctx, w, h, t, u } = c;
    for (let i = 0; i < 5; i++) { const x = w * (0.1 + i * 0.2), gr = ctx.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, hexA('#6ee7b7', 0.0)); gr.addColorStop(0.5, hexA('#6ee7b7', 0.14 + 0.06 * Math.sin(t * 2 + i))); gr.addColorStop(1, hexA('#6ee7b7', 0)); ctx.fillStyle = gr; ctx.fillRect(x - u * 0.05, 0, u * 0.1, h); }
    for (let i = 0; i < 6; i++) { const ph = ((t * 0.7 + i / 6) % 1), a = Math.sin(ph * Math.PI) * 0.8; chevron(ctx, w * (0.15 + (i % 3) * 0.35) + (i > 2 ? w * 0.1 : 0), lerp(h, h * 0.2, ph), u * 0.06, '#a7f3d0', a); }
    for (let k = 0; k < 3; k++) { const ph = ((t - 0.4 - k * 0.5) / 1.4); if (ph > 0 && ph < 1) ring(ctx, w / 2, h * 0.52, u * 0.12 + ph * u * 0.5, '#ecfeff', (1 - ph) * 0.8, u * 0.02 * (1 - ph) + 1); }
    glow(ctx, w / 2, h * 0.52, u * 0.4, '#ecfeff', 0.5);
    pop(ctx, 'star', w / 2, h * 0.52, u * 0.4, t, 0.2, { d: 0.9, shadow: true });
    if (c.value != null) bigValue(c, c.value, h * 0.52, 0.5, '#fff');
    pop(ctx, 'bolt', w * 0.22, h * 0.68, u * 0.12, t, 1.0); pop(ctx, 'bolt', w * 0.78, h * 0.68, u * 0.12, t, 1.15);
    c.at(0.3, () => c.fx.burst(w / 2, h * 0.52, { kind: 'stars', n: 14, power: 1.4 }));
    c.emit('sp', 18, () => c.fx.burst(Math.random() * w, h * 1.02, { kind: 'sparkle', n: 1, angle: -Math.PI / 2, spread: 0.2, power: 1.4, color: '#a7f3d0' }));
  } });

def('chest-open', { name: 'Schatkist open', bg: ['#1e1b4b', '#4c1d95', '#7c2d12'], dur: 3.6, title: 'Schatkist open!', sub: 'Kijk wat erin zit', titleAt: 1.5, accent: '#fde68a',
  draw(c) {
    const { ctx, w, h, t, u } = c; const cx = w / 2, cy = h * 0.62, open = 1.1, o = t >= open;
    if (o) lightRays(ctx, w, h, t, { x: cx, y: cy, color: '#fde68a', a: 0.25 });
    glow(ctx, cx, cy, u * (o ? 0.7 : 0.4), '#fbbf24', o ? 0.6 : 0.2);
    const shake = !o ? Math.sin(t * 40) * u * 0.008 * (t / open) * (t / open) * 3 : 0, sc = o ? 1 + 0.15 * Math.max(0, 1 - (t - open) * 4) : 1;
    softShadow(ctx, cx, cy + u * 0.22, u * 0.25, u * 0.04, 0.4);
    drawIcon(ctx, 'chest', cx + shake, cy, u * 0.4 * sc, { rot: shake * 0.01 });
    c.at(open, () => { c.fx.burst(cx, cy - u * 0.1, { kind: 'coins', n: 22, spread: 1.6, power: 1.5 }); c.fx.burst(cx, cy - u * 0.1, { kind: 'sparkle', n: 30, power: 1.6 }); c.flash = 1; });
    ['gem', 'coin', 'crown', 'star', 'potion', 'gem', 'ring'].forEach((n, i, arr) => {
      const q = E.out(seg(t, open + i * 0.07, open + 0.8 + i * 0.07)); if (q <= 0) return;
      const a = lerp(-2.7, -0.45, i / (arr.length - 1)), R = u * (0.3 + (i % 2) * 0.1), tx = cx + Math.cos(a) * R * 1.1, ty = cy - u * 0.12 + Math.sin(a) * R;
      drawIcon(ctx, n, lerp(cx, tx, q), lerp(cy, ty, q) + Math.sin(t * 2.2 + i) * 5 * q, u * 0.13 * (0.5 + 0.5 * q), { rot: Math.sin(t * 2 + i) * 0.15, shadow: false });
    });
  } });

def('coins-rain', { name: 'Muntenregen', bg: ['#451a03', '#b45309', '#fbbf24'], dur: 3.4, title: 'Muntenregen!', sub: 'Vang ze allemaal', titleAt: 0.6, accent: '#fef08a',
  draw(c) {
    const { ctx, w, h, t, u } = c; sunburst(ctx, w / 2, h * 1.05, Math.hypot(w, h), 14, Math.sin(t * 0.4) * 0.2, '#fff7ae', 0.14);
    const n = GFX.particles(36), r = rng(11);
    for (let d = 2; d >= 0; d--) for (let i = 0; i < n; i++) {
      if (i % 3 !== d) { r(); r(); r(); continue; }
      const x = r() * w, st = r() * 2.2, sp = (260 + d * 120) * (0.8 + r() * 0.4), s = u * (0.06 + d * 0.035), ph = r() * TAU, y = -s + (t - st) * sp;
      if (t < st || y > h + s) continue;
      ctx.save(); ctx.translate(x + Math.sin(t + ph) * 8, y); ctx.scale(0.25 + 0.75 * Math.abs(Math.cos(t * 5 + ph)), 1); drawIcon(ctx, 'coin', 0, 0, s, { alpha: 0.55 + d * 0.22 }); ctx.restore();
    }
    const bq = E.elastic(seg(t, 0.3, 1.1)), bump = 1 + 0.05 * Math.sin(t * 13) * (t > 1 ? 1 : 0);
    softShadow(ctx, w / 2, h * 0.9, u * 0.2, u * 0.03, 0.4);
    drawIcon(ctx, 'bag', w / 2, h * 0.82, u * 0.36 * bq * bump);
    c.emit('sp', 12, () => c.fx.burst(w / 2 + (Math.random() - 0.5) * u * 0.3, h * 0.72, { kind: 'sparkle', n: 1, power: 0.7 }));
    if (c.value != null) bigValue(c, '+' + Math.round(+c.value * E.out(seg(t, 0.8, 2.6))), h * 0.5, 0.8);
  } });

def('boss-defeated', { name: 'Baas verslagen', bg: ['#0a0a0a', '#450a0a', '#991b1b'], dur: 3.8, title: 'Baas verslagen!', sub: 'Niemand houdt jou tegen', titleAt: 2.0, accent: '#fecaca',
  shake: (t) => (t < 2.0 ? 5 * (1 - t / 2.2) * (t > 1.5 ? 2 : 1) : 0),
  draw(c) {
    const { ctx, w, h, t, u } = c; const cx = w / 2, cy = h * 0.55, boss = c.icon || 'dragon', ex = 1.6;
    if (t < ex) {
      let sq = 1; for (const hit of [0.4, 0.8, 1.2]) { const d = t - hit; if (d > 0 && d < 0.2) sq = 1 - 0.15 * Math.sin((d / 0.2) * Math.PI); }
      glow(ctx, cx, cy, u * 0.5, '#ef4444', 0.35);
      drawIcon(ctx, boss, cx + Math.sin(t * 30) * u * 0.006 * t, cy + Math.sin(t * 2) * 6, u * 0.42 * sq * (t > 1.4 ? 1 + (t - 1.4) * 1.5 : 1), { shadow: true, alpha: t > 1.45 ? 1 - (t - 1.45) / 0.2 : 1 });
    }
    for (const hit of [0.4, 0.8, 1.2]) c.at(hit, () => { c.fx.burst(cx + (Math.random() - 0.5) * u * 0.2, cy, { kind: 'sparkle', n: 14, power: 1.5, color: '#fca5a5' }); c.flash = 0.5; });
    c.at(ex, () => { c.flash = 1; c.fx.burst(cx, cy, { kind: 'smoke', n: 24, power: 1.6 }); c.fx.burst(cx, cy, { kind: 'sparkle', n: 40, power: 2.2, color: '#fbbf24' }); c.fx.burst(cx, cy, { kind: 'stars', n: 12, power: 1.8 }); });
    for (let k = 0; k < 3; k++) { const ph = (t - ex - k * 0.18) / 1.0; if (ph > 0 && ph < 1) ring(ctx, cx, cy, ph * u * 0.9, '#fde68a', (1 - ph) * 0.8, u * 0.03 * (1 - ph) + 1); }
    if (t > ex) { lightRays(ctx, w, h, t, { x: cx, y: cy, color: '#fde68a', a: 0.14 }); const q = E.back(seg(t, ex + 0.5, ex + 1.3)); drawIcon(ctx, 'sword', cx - u * 0.18, cy + u * 0.02, u * 0.22 * q, { rot: -0.5 }); drawIcon(ctx, 'crown', cx + u * 0.16, cy - u * 0.02 + (1 - q) * -u * 0.2, u * 0.2 * q, { rot: 0.2 }); }
  } });

def('new-record', { name: 'Nieuw record', bg: ['#020617', '#1e3a8a', '#6d28d9'], dur: 3.6, title: 'Nieuw record!', sub: 'Beter dan ooit', titleAt: 0.8, accent: '#fde68a',
  draw(c) {
    const { ctx, w, h, t, u } = c;
    for (const s of [-1, 1]) { const a = Math.PI / 2 + s * (0.5 - 0.3 * E.out(seg(t, 0, 1.2))) + Math.sin(t * 1.5 + s) * 0.06, L = h * 1.2, x = w / 2 + s * w * 0.5; const gr = ctx.createLinearGradient(x, -10, x + Math.cos(a) * L, Math.sin(a) * L); gr.addColorStop(0, hexA('#fff', 0.35)); gr.addColorStop(1, hexA('#fff', 0)); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x, -10); ctx.lineTo(x + Math.cos(a - 0.1) * L, Math.sin(a - 0.1) * L); ctx.lineTo(x + Math.cos(a + 0.1) * L, Math.sin(a + 0.1) * L); ctx.closePath(); ctx.fill(); }
    sunburst(ctx, w / 2, h * 0.52, u * 0.9, 14, -t * 0.3, '#fde68a', 0.13);
    ctx.fillStyle = hexA('#000', 0.35); ctx.fillRect(w / 2 - u * 0.28, h * 0.72, u * 0.56, u * 0.06); ctx.fillStyle = hexA('#fde68a', 0.9); ctx.fillRect(w / 2 - u * 0.28, h * 0.72, u * 0.56, u * 0.012);
    const p = pop(ctx, 'medal', w / 2, h * 0.5 + (1 - E.out(seg(t, 0.2, 1))) * -u * 0.1, u * 0.4, t, 0.2, { d: 1, shadow: true });
    pop(ctx, 'crown', w / 2, h * 0.5 - u * 0.27, u * 0.16, t, 0.9); pop(ctx, 'star', w / 2 - u * 0.3, h * 0.6, u * 0.1, t, 1.1); pop(ctx, 'star', w / 2 + u * 0.3, h * 0.6, u * 0.1, t, 1.25);
    bigValue(c, c.value, h * 0.82, 1.0);
    c.at(0.6, () => { confetti(c, w * 0.1, h * 0.9, -1.1, 45); confetti(c, w * 0.9, h * 0.9, -Math.PI + 1.1, 45); });
    c.at(1.8, () => c.fx.burst(w / 2, h * 0.5, { kind: 'stars', n: 16, power: 1.5 }));
    c.emit('sp', 10, () => c.fx.burst(Math.random() * w, Math.random() * h * 0.7, { kind: 'sparkle', n: 1, power: 0.2 }));
  } });

def('daily-bonus', { name: 'Dagelijkse bonus', bg: ['#fb7185', '#f59e0b', '#fde68a'], dur: 3.6, title: 'Dagelijkse bonus!', sub: 'Tot morgen weer een cadeau', titleAt: 1.7, accent: '#fff7ed',
  draw(c) {
    const { ctx, w, h, t, u } = c; const cx = w / 2, cy = h * 0.58, op = 1.7;
    sunburst(ctx, cx, cy, Math.hypot(w, h), 16, t * 0.2, '#fff', 0.14 + (t > op ? 0.1 : 0));
    const drop = seg(t, 0, 0.7); let gy = lerp(-u * 0.3, cy, E.bounce(drop)), sc = 1, rot = 0;
    if (t > 1.0 && t < op) { rot = Math.sin(t * 30) * 0.12 * seg(t, 1.0, op); sc = 1 + 0.05 * Math.sin(t * 20); }
    softShadow(ctx, cx, cy + u * 0.22, u * 0.2 * drop, u * 0.035, 0.35);
    if (t < op + 0.35) { const k = t > op ? 1 + (t - op) * 2.2 : sc; drawIcon(ctx, 'gift', cx, gy, u * 0.4 * k, { rot, alpha: t > op ? 1 - (t - op) / 0.35 : 1 }); }
    c.at(op, () => { c.flash = 0.9; c.fx.burst(cx, cy, { kind: 'coins', n: 18, spread: 2.2, power: 1.6 }); c.fx.burst(cx, cy, { kind: 'sparkle', n: 34, power: 1.8 }); c.fx.burst(cx, cy, { kind: 'stars', n: 10, power: 1.4 }); });
    if (t > op) { for (const [n, dx, dy, d] of [['gem', -0.26, -0.1, 0], ['coin', 0.26, -0.08, 0.1], ['star', 0, -0.26, 0.2]]) pop(ctx, n, cx + dx * u, cy + dy * u + Math.sin(t * 2 + dx * 9) * 6, u * 0.16, t, op + 0.1 + d, { d: 0.8 }); }
    bigValue(c, c.value, h * 0.82, op + 0.3);
    c.at(0.7, () => c.fx.burst(cx, cy + u * 0.2, { kind: 'sparkle', n: 8, power: 0.7 }));
  } });

/* ---------- speler ---------- */
const now = () => (globalThis.performance && performance.now ? performance.now() : Date.now());
const raf = (f) => (globalThis.requestAnimationFrame ? globalThis.requestAnimationFrame(f) : setTimeout(() => f(now()), 16));
const caf = (id) => (globalThis.cancelAnimationFrame ? globalThis.cancelAnimationFrame(id) : clearTimeout(id));

function play(host, id, opts = {}) {
  const sc = S[id];
  let resolve; const done = new Promise((r) => { resolve = r; });
  if (!sc || !host || !globalThis.document) { resolve({ skipped: false, error: true }); return { stop() {}, done }; }
  const doc = globalThis.document;
  const wrap = doc.createElement('div'), cv = doc.createElement('canvas');
  const fixed = host === doc.body || host === doc.documentElement;
  wrap.className = 'gfx-scene'; wrap.setAttribute('role', 'img'); wrap.setAttribute('aria-label', opts.title || sc.title);
  wrap.style.cssText = `position:${fixed ? 'fixed' : 'absolute'};inset:0;z-index:9999;overflow:hidden;border-radius:inherit;background:#000;touch-action:manipulation;${opts.skippable === false ? '' : 'cursor:pointer;'}-webkit-tap-highlight-color:transparent`;
  cv.style.cssText = 'width:100%;height:100%;display:block';
  wrap.appendChild(cv); let prevPos = null;
  try { if (!fixed && globalThis.getComputedStyle && getComputedStyle(host).position === 'static') { prevPos = host.style.position; host.style.position = 'relative'; } } catch { /* stil */ }
  host.appendChild(wrap);
  const ctx = cv.getContext('2d');
  const fx = new Particles(), reduce = GFX.reduce, dur = sc.dur, loop = !!opts.loop;
  let w = 0, h = 0, dpr = 1, raf0 = 0, t0 = null, last = 0, closed = false, skipping = null, fired = new Set(), acc = {}, hintAt = 1.2;
  const world = Themes.world(opts.theme || sc.world || 'wolken');
  const c = { ctx, fx, reduce, accent: sc.accent, value: opts.value, icon: opts.icon, flash: 0, dt: 0, t: 0, tm: 0, w: 0, h: 0, u: 0, q: GFX.q };
  // at: eenmalig op tijdstip (sleutel = tijd); emit: herhaald met vaste frequentie
  c.at = (time, fn) => { const k = 'a' + time; if (!fired.has(k) && c.t >= time) { fired.add(k); fn(); } };
  c.emit = (name, rate, fn) => { if (reduce) return; acc[name] = (acc[name] || 0) + c.dt * rate; let n = 0; while (acc[name] >= 1 && n++ < 6) { acc[name] -= 1; fn(); } if (acc[name] > 6) acc[name] = 0; };

  function size() {
    const nw = Math.max(1, Math.round(opts.w || host.clientWidth || 360)), nh = Math.max(1, Math.round(opts.h || host.clientHeight || 640)), nd = GFX.dpr || 1;
    if (nw === w && nh === h && nd === dpr) return;
    w = nw; h = nh; dpr = nd; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); c.w = w; c.h = h; c.u = Math.min(w * 1.1, h);
  }
  function finish(skipped) {
    if (closed) return; closed = true; caf(raf0);
    try { wrap.removeEventListener('pointerdown', onTap); wrap.removeEventListener('click', onTap); } catch { /* stil */ }
    try { host.removeChild(wrap); } catch { /* stil */ }
    if (prevPos !== null) host.style.position = prevPos;
    resolve({ skipped: !!skipped });
  }
  const onTap = (e) => { if (opts.skippable === false || skipping != null) return; if (e && e.stopPropagation) e.stopPropagation(); skipping = c.real; };
  if (opts.skippable !== false) { wrap.addEventListener('pointerdown', onTap); wrap.addEventListener('click', onTap); }

  function bg() {
    if (opts.theme || sc.world) { Themes.paintBackground(ctx, w, h, world, c.tm); return; }
    gradientSky(ctx, w, h, sc.bg); if (GFX.q > 0) { lightRays(ctx, w, h, c.tm, { x: w / 2, y: -h * 0.1, a: 0.1 }); }
    if (GFX.q === 2) bokeh(ctx, w, h, c.tm, { n: 12, color: '#fff', a: 0.08, seed: 9 });
  }
  function frame(ts) {
    if (closed) return;
    size();
    const real = ((typeof ts === 'number' ? ts : now()) - (t0 == null ? (t0 = typeof ts === 'number' ? ts : now()) : t0)) / 1000;
    const dt = Math.max(0, Math.min(0.05, real - last)); last = real; c.real = real; c.dt = dt;
    let t = real, fade = 1;
    if (reduce) { // statisch eindbeeld met korte fade
      t = Math.min(dur - 0.5, dur * 0.8); fade = Math.min(seg(real, 0, 0.25), 1 - seg(real, 0.9, 1.2)); if (real >= 1.2 || skipping != null) return finish(skipping != null);
    } else {
      if (loop && t > dur + 0.3) { t0 = typeof ts === 'number' ? ts : now(); last = 0; fired = new Set(); acc = {}; fx.clear(); t = 0; }
      fade = Math.min(seg(t, 0, 0.25), loop ? 1 : 1 - seg(t, dur - 0.35, dur));
      if (skipping != null) fade = Math.min(fade, 1 - seg(real - skipping, 0, 0.2));
      if (!loop && t >= dur || (skipping != null && real - skipping >= 0.2)) return finish(skipping != null);
    }
    c.t = t; c.tm = t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1; ctx.clearRect(0, 0, w, h);
    ctx.save();
    const sh = !reduce && sc.shake ? sc.shake(t) : 0; if (sh) ctx.translate((Math.random() - 0.5) * sh * 2, (Math.random() - 0.5) * sh * 2);
    bg();
    sc.draw(c);
    if (!reduce) { fx.update(dt); fx.draw(ctx); }
    drawTitle(c, opts.title || sc.title, opts.sub != null ? opts.sub : sc.sub, reduce ? 0 : sc.titleAt || 1);
    ctx.restore();
    if (c.flash > 0.01) { ctx.fillStyle = hexA('#fff', c.flash * 0.7); ctx.fillRect(0, 0, w, h); c.flash *= Math.pow(0.0025, dt); }
    if (GFX.q > 0) vignette(ctx, w, h, 0.3);
    if (opts.skippable !== false && !reduce && t > hintAt) { ctx.save(); ctx.globalAlpha = 0.65 * seg(t, hintAt, hintAt + 0.5) * fade; ctx.font = `600 ${Math.round(c.u * 0.036)}px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('Tik om over te slaan', w / 2, h - c.u * 0.04); ctx.restore(); }
    if (fade < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - fade})`; ctx.fillRect(0, 0, w, h); }
    raf0 = raf(frame);
  }
  raf0 = raf(frame);
  return { stop() { finish(false); }, done };
}

export const Scenes = {
  list: Object.fromEntries(Object.entries(S).map(([id, s]) => [id, { name: s.name, dur: s.dur, world: s.world || null }])),
  play,
};
