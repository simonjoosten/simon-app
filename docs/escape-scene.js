// Escape Room: de sfeer-achtergrond van een kamer op een canvas (muur, vloer, stralen, zwevend decor, deeltjes).
// De klikbare voorwerpen zijn gewone knoppen eroverheen (zie escape.js), dit tekent alleen de kamer zelf.
import { drawIcon, preload } from './gfx/art.js?v=1';
import { GFX } from './gfx/settings.js?v=1';
import { gradientSky, glow, vignette, lightRays, bokeh, softShadow, Particles, hexA, rng, TAU } from './gfx/fx.js?v=1';

export function paintRoom(ctx, w, h, room, t, o = {}) {
  const tt = GFX.reduce ? 0 : t, wallH = h * 0.7;
  gradientSky(ctx, w, wallH, room.bg[0], room.bg[1]);
  // vloer met perspectieflijnen
  ctx.fillStyle = room.floor; ctx.fillRect(0, wallH, w, h - wallH);
  ctx.strokeStyle = hexA('#000', 0.22); ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -6; i <= 6; i++) { ctx.moveTo(w / 2 + i * w * 0.07, wallH); ctx.lineTo(w / 2 + i * w * 0.22, h); }
  for (let k = 1; k <= 4; k++) { const y = wallH + (h - wallH) * (k * k) / 16; ctx.moveTo(0, y); ctx.lineTo(w, y); }
  ctx.stroke();
  const gr = ctx.createLinearGradient(0, wallH - 10, 0, wallH + 14);
  gr.addColorStop(0, hexA('#000', 0)); gr.addColorStop(1, hexA('#000', 0.28)); ctx.fillStyle = gr; ctx.fillRect(0, wallH - 10, w, 24);
  // raam / deur-gloed in het midden
  const pulse = o.pulse || 0;
  glow(ctx, w * 0.5, wallH * 0.45, w * (0.45 + pulse * 0.2), room.accent, 0.18 + 0.12 * Math.sin(tt * 0.8) + pulse * 0.35);
  lightRays(ctx, w, h, tt, { color: room.accent, a: 0.1, x: w * 0.5, y: -h * 0.05 });
  // zwevend decor (verre laag, groot en doorzichtig)
  const R = rng(room.id.length * 977 + room.id.charCodeAt(0));
  room.decor.forEach((ic, i) => {
    const bx = ((i + 0.5) / room.decor.length) * w, by = wallH * (0.28 + R() * 0.4), sz = w * (0.17 + R() * 0.07);
    const dy = Math.sin(tt * 0.7 + i * 1.9) * h * 0.012, rot = Math.sin(tt * 0.5 + i) * 0.06;
    softShadow(ctx, bx, wallH + h * 0.04 + (i % 2) * h * 0.05, sz * 0.4, sz * 0.07, 0.18);
    drawIcon(ctx, ic, bx, by + dy, sz, { alpha: 0.4, rot });
  });
  bokeh(ctx, w, h, tt, { n: 12, color: room.accent, a: 0.1, seed: room.id.length + 3 });
  if (o.particles) { o.particles.update(1 / 60); o.particles.draw(ctx); }
  vignette(ctx, w, h, 0.5);
}

export function makeScene(canvas, room) {
  const ctx = canvas.getContext('2d'), parts = new Particles();
  let raf = 0, alive = true, t0 = null, pulse = 0, w = 360, h = 360, last = 0;
  preload([...room.decor]).catch(() => {});
  const draw = (ms) => {
    if (!alive) return;
    if (t0 == null) t0 = ms || 0;
    const t = ((ms || 0) - t0) / 1000;
    pulse = Math.max(0, pulse - 0.02);
    ctx.save();
    ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
    paintRoom(ctx, w, h, room, t, { pulse, particles: parts });
    ctx.restore();
  };
  const loop = (ms) => {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    if (GFX.reduce) { if (pulse <= 0 && parts.count === 0 && last) return; }
    if (GFX.q === 0 && (ms - last) < 33) return;
    last = ms || 1; draw(ms);
  };
  return {
    resize(cw, ch) {
      w = Math.max(100, cw); h = Math.max(100, ch);
      const dpr = GFX.dpr || 1; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      draw(last || 0);
    },
    start() { if (!raf) raf = requestAnimationFrame(loop); },
    burst(x, y, kind = 'sparkle', n = 24) { parts.burst(x * w, y * h, { kind, n, power: 1.1 }); pulse = 1; last = 0; },
    pulse() { pulse = 1; },
    stop() { alive = false; if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf); raf = 0; },
  };
}
