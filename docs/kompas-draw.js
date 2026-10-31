// Kompas: tekenen van het 3D-kompas en de waterpas op canvas.
import { GFX, drawIcon } from './tools-ui.js?v=1';
import { softShadow, glow } from './gfx/fx.js?v=1';

const TAU = Math.PI * 2, rad = Math.PI / 180;
const LETTERS = [['N', 0, '#ef4444'], ['O', 90, null], ['Z', 180, null], ['W', 270, null]];
const MINOR = [['NO', 45], ['ZO', 135], ['ZW', 225], ['NW', 315]];

/**
 * Teken het kompas. o = { heading, tiltX, tiltY (-1..1, kanteling van het toestel), target (graden, optioneel), sunAz, sunAlt, locked, dark }
 */
export function drawCompass(ctx, cx, cy, R, o) {
  const q = GFX.q, hd = o.heading == null ? 0 : o.heading, tx = o.tiltX || 0, ty = o.tiltY || 0;
  if (q > 0) softShadow(ctx, cx - tx * R * 0.12, cy + R * (0.97 - ty * 0.05), R * 0.92, R * 0.15, 0.35);
  // koperen rand
  let g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  g.addColorStop(0, '#fde68a'); g.addColorStop(0.35, '#b45309'); g.addColorStop(0.65, '#fcd34d'); g.addColorStop(1, '#78350f');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
  g = ctx.createLinearGradient(cx + R, cy + R, cx - R, cy - R); g.addColorStop(0, '#fef3c7'); g.addColorStop(1, '#92400e');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 0.93, 0, TAU); ctx.fill();
  // schroefjes
  if (q > 0) for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + 0.78, x = cx + Math.cos(a) * R * 0.965, y = cy + Math.sin(a) * R * 0.965; ctx.fillStyle = '#78350f'; ctx.beginPath(); ctx.arc(x, y, R * 0.018, 0, TAU); ctx.fill(); }
  const fr = R * 0.88;
  g = ctx.createRadialGradient(cx - fr * 0.2, cy - fr * 0.25, fr * 0.1, cx, cy, fr);
  g.addColorStop(0, o.dark ? '#1e293b' : '#fffbeb'); g.addColorStop(1, o.dark ? '#0f172a' : '#fde9b8');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, fr, 0, TAU); ctx.fill();
  // draaiende roos
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-hd * rad);
  const ink = o.dark ? '#e2e8f0' : '#3b2a14';
  for (let d = 0; d < 360; d += 2) {
    const major = d % 30 === 0, mid = d % 10 === 0, r1 = fr * (major ? 0.88 : mid ? 0.92 : 0.95), r2 = fr * 0.985;
    if (!major && !mid && q === 0 && d % 6) continue;
    ctx.strokeStyle = ink; ctx.lineWidth = major ? R * 0.016 : mid ? R * 0.009 : R * 0.005; ctx.globalAlpha = major ? 1 : 0.75;
    const a = d * rad; ctx.beginPath(); ctx.moveTo(Math.sin(a) * r1, -Math.cos(a) * r1); ctx.lineTo(Math.sin(a) * r2, -Math.cos(a) * r2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // graden-getallen
  ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 ${Math.round(R * 0.07)}px system-ui,sans-serif`;
  for (let d = 30; d < 360; d += 30) { if (d % 90 === 0) continue; const a = d * rad; ctx.save(); ctx.translate(Math.sin(a) * fr * 0.78, -Math.cos(a) * fr * 0.78); ctx.rotate(a); ctx.fillText(String(d), 0, 0); ctx.restore(); }
  // 8-puntige roos met licht/donker vlakken (3D-effect)
  const star = (ang, len, wd, c1, c2) => {
    ctx.save(); ctx.rotate(ang * rad);
    ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(0, -len); ctx.lineTo(wd, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(0, -len); ctx.lineTo(-wd, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.restore();
  };
  for (const a of [45, 135, 225, 315]) star(a, fr * 0.5, fr * 0.07, '#d6c08f', '#9a7b43');
  for (const a of [90, 180, 270]) star(a, fr * 0.62, fr * 0.1, '#f1e4bd', '#6b4f24');
  star(0, fr * 0.66, fr * 0.11, '#fca5a5', '#b91c1c');
  // letters
  ctx.font = `800 ${Math.round(R * 0.17)}px system-ui,sans-serif`;
  for (const [l, d, c] of LETTERS) { const a = d * rad; ctx.save(); ctx.translate(Math.sin(a) * fr * 0.77, -Math.cos(a) * fr * 0.77); ctx.rotate(a); ctx.fillStyle = c || ink; ctx.fillText(l, 0, 0); ctx.restore(); }
  ctx.font = `700 ${Math.round(R * 0.075)}px system-ui,sans-serif`; ctx.fillStyle = ink;
  for (const [l, d] of MINOR) { const a = d * rad; ctx.save(); ctx.translate(Math.sin(a) * fr * 0.66, -Math.cos(a) * fr * 0.66); ctx.rotate(a); ctx.fillText(l, 0, 0); ctx.restore(); }
  // doel en zon op de ring
  if (o.target != null) { const a = o.target * rad; drawIcon(ctx, 'flag', Math.sin(a) * fr * 0.9, -Math.cos(a) * fr * 0.9, R * 0.22); }
  if (o.sunAz != null && o.sunAlt > -2) { const a = o.sunAz * rad; drawIcon(ctx, 'sun', Math.sin(a) * fr * 0.9, -Math.cos(a) * fr * 0.9, R * 0.2); }
  if (o.locked != null) { const a = o.locked * rad; ctx.strokeStyle = '#2563eb'; ctx.lineWidth = R * 0.02; ctx.setLineDash && ctx.setLineDash([R * 0.04, R * 0.04]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a) * fr * 0.92, -Math.cos(a) * fr * 0.92); ctx.stroke(); ctx.setLineDash && ctx.setLineDash([]); }
  ctx.restore();
  // naaldkap
  g = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, R * 0.08); g.addColorStop(0, '#fff'); g.addColorStop(1, '#78350f');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 0.05, 0, TAU); ctx.fill();
  // vaste rode streep boven (kijklijn)
  ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.moveTo(cx, cy - fr * 1.0); ctx.lineTo(cx - R * 0.06, cy - R * 1.04); ctx.lineTo(cx + R * 0.06, cy - R * 1.04); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(220,38,38,.55)'; ctx.lineWidth = R * 0.012; ctx.beginPath(); ctx.moveTo(cx, cy - R * 0.2); ctx.lineTo(cx, cy - fr * 0.97); ctx.stroke();
  // glas
  if (q > 0) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, fr, 0, TAU); ctx.clip();
    g = ctx.createLinearGradient(cx - fr, cy - fr, cx + fr * 0.3, cy + fr * 0.4); g.addColorStop(0, 'rgba(255,255,255,.42)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx - fr * 0.2 - tx * fr * 0.25, cy - fr * 0.45 - ty * fr * 0.2, fr * 0.85, fr * 0.45, -0.45, 0, TAU); ctx.fill(); ctx.restore();
  }
  if (q === 2) glow(ctx, cx - R * 0.5 - tx * R * 0.2, cy - R * 0.6 - ty * R * 0.15, R * 0.3, '#fff', 0.2);
}

/** Cirkelvormige waterpas + twee buisjes. o = { beta, gamma } */
export function drawLevel(ctx, cx, cy, R, o) {
  const q = GFX.q, b = Math.max(-45, Math.min(45, o.beta || 0)), gm = Math.max(-45, Math.min(45, o.gamma || 0));
  const flat = Math.abs(b) < 1.5 && Math.abs(gm) < 1.5;
  if (q > 0) softShadow(ctx, cx, cy + R * 0.98, R * 0.9, R * 0.13, 0.3);
  let g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, '#fde047'); g.addColorStop(1, '#a16207');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
  g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R * 0.9); g.addColorStop(0, flat ? '#bbf7d0' : '#e0f2fe'); g.addColorStop(1, flat ? '#4ade80' : '#7dd3fc');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 0.9, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(30,41,59,.5)'; ctx.lineWidth = 1.5;
  for (const f of [0.25, 0.5, 0.75]) { ctx.beginPath(); ctx.arc(cx, cy, R * 0.9 * f, 0, TAU); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(cx - R * 0.9, cy); ctx.lineTo(cx + R * 0.9, cy); ctx.moveTo(cx, cy - R * 0.9); ctx.lineTo(cx, cy + R * 0.9); ctx.stroke();
  // luchtbel (beweegt naar de hoge kant, zoals in een echte waterpas)
  let bx = -gm / 45 * R * 0.8, by = -b / 45 * R * 0.8; const dl = Math.hypot(bx, by), mx = R * 0.72; if (dl > mx) { bx *= mx / dl; by *= mx / dl; }
  const br = R * 0.17;
  g = ctx.createRadialGradient(cx + bx - br * 0.3, cy + by - br * 0.35, br * 0.1, cx + bx, cy + by, br);
  g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.5, flat ? 'rgba(34,197,94,.75)' : 'rgba(251,191,36,.8)'); g.addColorStop(1, flat ? 'rgba(21,128,61,.9)' : 'rgba(180,83,9,.9)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx + bx, cy + by, br, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.stroke();
  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, R * 0.16, 0, TAU); ctx.stroke();
  if (q > 0) { ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R * 0.9, 0, TAU); ctx.clip(); g = ctx.createLinearGradient(cx - R, cy - R, cx, cy); g.addColorStop(0, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx - R * 0.2, cy - R * 0.45, R * 0.75, R * 0.35, -0.5, 0, TAU); ctx.fill(); ctx.restore(); }
  return flat;
}
