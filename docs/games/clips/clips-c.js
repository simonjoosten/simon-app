// Gamescroller clips C (c01..c40) - pure draw(ctx, t, w, h), w=360 h=640
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const P = (t, a, b) => clamp((t - a) / (b - a));
const rnd = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const E = {
  in: (k) => k * k,
  out: (k) => 1 - (1 - k) * (1 - k),
  io: (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2),
  back: (k) => 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2),
  bounce: (k) => {
    const n = 7.5625, d = 2.75;
    if (k < 1 / d) return n * k * k;
    if (k < 2 / d) { k -= 1.5 / d; return n * k * k + 0.75; }
    if (k < 2.5 / d) { k -= 2.25 / d; return n * k * k + 0.9375; }
    k -= 2.625 / d; return n * k * k + 0.984375;
  },
};
const arc = (k, h) => 4 * h * k * (1 - k);
const shake = (t, a) => [a * Math.sin(t * 93), a * Math.cos(t * 71)];

function B(ctx, w, h, o = {}) {
  ctx.clearRect(0, 0, w, h);
  const sh = o.sh || [0, 0];
  ctx.translate(sh[0], sh[1]);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, o.top || '#8fd3ff');
  g.addColorStop(1, o.bot || '#e6f7ff');
  ctx.fillStyle = g;
  ctx.fillRect(-30, -30, w + 60, h + 60);
  if (o.gy != null) {
    ctx.fillStyle = o.gc || '#6bbf59';
    ctx.fillRect(-30, o.gy, w + 60, h - o.gy + 30);
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fillRect(-30, o.gy, w + 60, 4);
  }
}
function R(ctx, x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); }
function C(ctx, x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.fill(); }
function L(ctx, x1, y1, x2, y2, col, wd = 3) {
  ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function em(ctx, ch, x, y, s = 64, o = {}) {
  ctx.save();
  ctx.translate(x, y);
  if (o.r) ctx.rotate(o.r);
  ctx.scale((o.fx ? -1 : 1) * (o.sx == null ? 1 : o.sx), o.sy == null ? 1 : o.sy);
  ctx.globalAlpha = o.a == null ? 1 : clamp(o.a);
  ctx.font = s + 'px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ch, 0, 0);
  ctx.restore();
}
function txt(ctx, s, x, y, size = 24, col = '#fff', a = 1) {
  ctx.save();
  ctx.globalAlpha = clamp(a);
  ctx.font = 'bold ' + size + 'px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineJoin = 'round';
  ctx.strokeText(s, x, y);
  ctx.fillStyle = col;
  ctx.fillText(s, x, y);
  ctx.restore();
}
function shade(ctx, x, y, rx, a = 0.25) {
  ctx.fillStyle = 'rgba(0,0,0,' + a + ')';
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(1, rx), Math.max(1, rx * 0.22), 0, 0, Math.PI * 2); ctx.fill();
}
function bub(ctx, s, x, y, a = 1) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = clamp(a);
  const bw = s.length * 9.5 + 22;
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.rect(x - bw / 2, y - 18, bw, 36); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 8, y + 18); ctx.lineTo(x - 2, y + 32); ctx.lineTo(x + 8, y + 18); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.fillStyle = '#222'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
  ctx.restore();
}
// partikels: n emoji's die vanaf (x,y) uitwaaieren vanaf tijdstip t0
function burst(ctx, t, t0, x, y, chars, n = 10, v = 160, size = 24, life = 1.3) {
  const d = t - t0;
  if (d < 0 || d > life) return;
  for (let i = 0; i < n; i++) {
    const a = rnd(i + 3) * Math.PI * 2, sp = v * (0.4 + rnd(i + 17));
    em(ctx, chars[i % chars.length], x + Math.cos(a) * sp * d, y + Math.sin(a) * sp * d + 260 * d * d, size, { a: 1 - d / life, r: d * (rnd(i) - 0.5) * 8 });
  }
}
function stars(ctx, t, x, y, r = 30) {
  for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.094; em(ctx, '⭐', x + Math.cos(a) * r, y + Math.sin(a) * r * 0.35, 18); }
}
function walk(t, f = 9) { return { bob: -Math.abs(Math.sin(t * f)) * 6, rot: Math.sin(t * f) * 0.08 }; }
function mk(id, title, caption, dur, fn) {
  return { id, title, caption, dur, draw(ctx, t, w, h) { ctx.save(); fn(ctx, t, w, h); ctx.restore(); } };
}

export const CLIPS = [
  mk('c01', 'Mail van de kat', 'Hij typte alleen wat hij echt vond.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#ffe9c7', bot: '#fff4e0', gy: 470, gc: '#b5835a' });
    R(ctx, 20, 392, 320, 14, '#7b4f2a'); R(ctx, 40, 406, 14, 64, '#7b4f2a'); R(ctx, 306, 406, 14, 64, '#7b4f2a');
    R(ctx, 120, 250, 220, 130, '#2b2b2b'); R(ctx, 130, 260, 200, 110, '#d9f2e6'); R(ctx, 215, 380, 30, 12, '#2b2b2b');
    const s = 'asdfjk;lkj gggh qqqqq';
    const n = Math.floor(P(t, 2.2, 4.4) * s.length);
    txt(ctx, s.slice(0, n), 230, 300, 16, '#111');
    const x = lerp(-50, 190, E.out(P(t, 0.2, 2)));
    const wk = P(t, 0.2, 2) < 1 ? walk(t) : { bob: 0, rot: 0 };
    const sit = P(t, 2, 2.4);
    em(ctx, '🐈', x, 370 + wk.bob + sit * 6 + (t > 2.2 && t < 4.4 ? Math.sin(t * 40) * 3 : 0), 70, { r: wk.rot, sy: 1 - sit * 0.12 });
    const k = P(t, 4.6, 5.8);
    if (k > 0 && k < 1) em(ctx, '✉️', lerp(230, 330, k), 300 - 500 * k + 300 * k * k, 44, { r: k * 6 });
    if (t > 4.6) txt(ctx, 'VERZONDEN', 230, 340, 15, '#d22', clamp((t - 4.6) * 3));
    const b = E.back(P(t, 5.4, 6));
    em(ctx, '😡', 300, 560 - 70 * b + 60, 30 + 60 * b, { a: b });
    if (t > 5.8) bub(ctx, 'WIE WAS DAT?', 230, 500, 1);
  }),
  mk('c02', 'Glazen deur', 'Hij heeft het nooit eerder zo doorgehad.', 6.5, (ctx, t, w, h) => {
    const sh = t > 2.1 && t < 2.8 ? shake(t, 6 * (2.8 - t)) : [0, 0];
    B(ctx, w, h, { top: '#cfe8ff', bot: '#f4fbff', gy: 470, gc: '#8bc26b', sh });
    R(ctx, 200, 270, 170, 200, '#c98a5b');
    const open = E.io(P(t, 5, 5.6));
    R(ctx, 225, 300, 100, 170, 'rgba(120,180,220,0.45)');
    R(ctx, 225 - 90 * open, 300, 100, 170, 'rgba(160,210,240,0.55)');
    L(ctx, 240 - 90 * open, 320, 270 - 90 * open, 300, 'rgba(255,255,255,0.7)', 5);
    const run = E.in(P(t, 0.3, 2.1));
    let x = lerp(-40, 190, run), sx = 1;
    if (t > 2.1) { const b = P(t, 2.1, 2.9); x = lerp(190, 110, E.out(b)); sx = 1 - 0.5 * (1 - b) * (b < 0.15 ? 1 : 0); }
    if (t > 5) x = lerp(110, 290, E.io(P(t, 5.2, 6.4)));
    const wob = t > 3 && t < 5 ? Math.sin(t * 5) * 0.2 : 0;
    em(ctx, '🐕', x, 440 + (t < 2.1 ? walk(t, 14).bob : 0), 66, { sx, r: wob, fx: t > 5 ? false : true });
    if (t > 2.1 && t < 5) stars(ctx, t, x, 400);
    if (t > 2.1 && t < 2.6) burst(ctx, t, 2.1, 195, 430, ['💥'], 1, 0, 40, 0.5);
    if (t > 4.8) em(ctx, '🦴', 350 - 20 * P(t, 5, 6), 450, 36 + 10 * Math.sin(t * 8));
  }),
  mk('c03', 'Hamsterwiel', 'Hij wilde gewoon wat vooruitkomen.', 6.5, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#e8d7ff', bot: '#fff1fb', gy: 500, gc: '#d9b38c' });
    const up = E.in(P(t, 3.8, 6.2));
    const cy = 340 - up * 560, sp = 3 + 2.5 * t * t * 0.5;
    const ang = 3 * t + 1.5 * t * t;
    R(ctx, 100, cy + 100, 160, 10, '#888'); L(ctx, 180, cy + 100, 120, 500, '#666', 6); L(ctx, 180, cy + 100, 240, 500, '#666', 6);
    ctx.save(); ctx.translate(180, cy); ctx.rotate(ang);
    for (let i = 0; i < 8; i++) L(ctx, 0, 0, Math.cos(i * 0.785) * 100, Math.sin(i * 0.785) * 100, '#aaa', 2);
    ctx.strokeStyle = '#555'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 100, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    const wob = Math.sin(t * (10 + t * 3)) * 0.2;
    em(ctx, '🐹', 180, cy + 70, 64, { r: wob });
    if (t > 3.8) { em(ctx, '🔥', 180, cy + 130, 50 + 15 * Math.sin(t * 30)); em(ctx, '💨', 180 - 70, cy + 90, 30); }
    txt(ctx, 'km/u: ' + Math.floor(3 + t * t * 4), 180, 60, 22, '#fff');
    if (up > 0.8) txt(ctx, 'tot ziens!', 180, 300, 22, '#fff', (up - 0.8) * 5);
  }),
  mk('c04', 'Goudvis geheugen', 'Drie seconden. Elke keer weer een kasteel.', 6.6, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#7fd0ff', bot: '#2a7fc0' });
    C(ctx, 180, 340, 170, 'rgba(255,255,255,0.15)');
    R(ctx, 0, 460, w, 180, '#e8d28a');
    em(ctx, '🏰', 70, 430, 70); em(ctx, '🏰', 290, 430, 70);
    for (let i = 0; i < 6; i++) em(ctx, '🫧', 60 + i * 50, 450 - ((t * 40 + i * 90) % 300), 16, { a: 0.6 });
    const u = t / 2.2, i = Math.floor(u), ph = u - i, dir = i % 2;
    const sw = E.io(P(ph, 0, 0.6));
    const x = dir === 0 ? lerp(120, 240, sw) : lerp(240, 120, sw);
    em(ctx, '🐟', x, 330 + Math.sin(t * 5) * 8, 60, { fx: dir === 1 ? false : true });
    if (ph > 0.65 && ph < 0.98) bub(ctx, 'Wow, een kasteel!', 180, 230, 1);
    if (t < 0.1) bub(ctx, 'Wow, een kasteel!', 180, 230, 0);
  }),
  mk('c05', 'Grasmaaien om 7 uur', 'Toevallig ook meteen de tuin van de buren.', 6.5, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#bfe6ff', bot: '#f2fbff', gy: 440, gc: '#6bbf59' });
    const mx = lerp(-40, 380, P(t, 0.6, 5.6));
    R(ctx, 190, 440, 0, 0, '#000');
    R(ctx, -30, 440, Math.max(0, mx + 30), 28, '#8fd873');
    const fence = mx < 190;
    if (fence) { for (let i = 0; i < 6; i++) R(ctx, 184 + (i % 2) * 0, 380 + i * 0, 8, 62, '#c9a26b'); R(ctx, 170, 400, 40, 8, '#b08850'); }
    else burst(ctx, t, 190 / 420 * 5 + 0.6 - 0.3, 190, 410, ['🪵'], 5, 110, 22);
    for (let i = 0; i < 5; i++) {
      const fx = 215 + i * 26;
      if (mx < fx) em(ctx, '🌷', fx, 425, 28);
      else burst(ctx, t, 0.6 + (fx + 40) / 420 * 5, fx, 420, ['🌸'], 3, 100, 16, 0.9);
    }
    em(ctx, '🏠', 300, 320, 90); 
    em(ctx, '🚜', mx, 420 + Math.sin(t * 30) * 2, 64, { fx: true });
    if (mx > 200) { em(ctx, '😠', 300, 300, 36 * E.back(P(mx, 200, 260))); }
    if (t > 5.8) txt(ctx, 'oeps', 180, 200, 28, '#fff', P(t, 5.8, 6.1));
  }),
  mk('c06', 'Heg knippen', 'Na twintig jaar kenden ze elkaars gezicht niet.', 6.5, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#bfe6ff', bot: '#f2fbff', gy: 460, gc: '#7ec86a' });
    const k = E.io(P(t, 0.4, 4.4));
    const hw = 150 * (1 - k);
    R(ctx, 180 - hw / 2, 360, hw, 100, '#2f8a3a');
    for (let i = 0; i < 8; i++) C(ctx, 180 - hw / 2 + (i * 37 % Math.max(1, hw)), 380 + (i * 29 % 60), 6, '#3fae4b');
    const gap = 0.5;
    const lx = 180 - hw / 2 - 40, rx = 180 + hw / 2 + 40;
    em(ctx, '🧑‍🌾', lx, 415, 66, { r: Math.sin(t * 14) * 0.07 * (t < 4.4 ? 1 : 0) });
    em(ctx, '👴', rx, 415, 66, { r: -Math.sin(t * 14 + 1) * 0.07 * (t < 4.4 ? 1 : 0), fx: true });
    if (t < 4.4) { burst(ctx, t % 0.4 + 0, 0, lx + 20, 400, ['🍃'], 2, 50, 14, 0.4); burst(ctx, t % 0.4, 0, rx - 20, 400, ['🍃'], 2, 50, 14, 0.4); }
    if (t > 4.5 && t < 5.4) { em(ctx, '😳', lx, 360, 24); em(ctx, '😳', rx, 360, 24); }
    if (t > 5.2) { em(ctx, '👋', lx + 35, 395 + Math.sin(t * 12) * 4, 28); bub(ctx, 'Hoi...', 180, 300, 1); }
    if (t > 5.9) { const o = P(t, 5.9, 6.5); em(ctx, '🌱', 180, 450, 12 + 40 * o); }
  }),
  mk('c07', 'Pakketje bij de buren', 'De bezorger heeft zijn favoriet.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#d6ecff', bot: '#fdfdf5', gy: 470, gc: '#b9b9b0' });
    R(ctx, 30, 270, 110, 200, '#d98c6c'); R(ctx, 220, 270, 110, 200, '#6c9ad9');
    R(ctx, 60, 350, 50, 120, '#7a4a2a'); R(ctx, 250, 350, 50, 120, '#2a4a7a');
    em(ctx, '🚚', lerp(-60, 420, P(t, 0.4, 4.2)), 540, 74, { fx: true });
    for (let i = 0; i < 5; i++) {
      const t0 = 0.8 + i * 0.7, k = P(t, t0, t0 + 0.6);
      if (k <= 0) continue;
      const fx = lerp(180, 275, k), fy = 480 - arc(k, 130) - (k >= 1 ? 0 : 0);
      const ty = 470 - 30 - i * 32;
      const y = k < 1 ? lerp(520, ty, k) - arc(k, 110) : ty;
      let x = fx, r = 0;
      const tip = P(t, 5.3, 6.4);
      if (tip > 0) { x = lerp(275, 90 - i * 5, E.in(tip)); r = tip * 4 * (i % 2 ? 1 : -1); }
      em(ctx, '📦', x, y + tip * (tip > 0.5 ? (i * 2) : 0), 34, { r });
    }
    em(ctx, '🧍', 85, 440, 56);
    const gone = P(t, 6.2, 6.5);
    if (t > 4.4 && t < 5.3) em(ctx, '😐', 85, 400, 22);
    if (t > 6.2) { txt(ctx, 'Bij de buren...', 100, 200, 22, '#fff', gone); em(ctx, '😵', 85, 440, 40, { a: gone }); }
  }),
  mk('c08', 'Barbecue-rook', 'Buren die gezellig meeroken, gratis.', 6.5, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#cfe9ff', bot: '#f5fbff', gy: 470, gc: '#7ec86a' });
    const gk = P(t, 1, 4.5);
    R(ctx, 0, 0, w, h, 'rgba(70,60,55,' + (0.55 * gk) + ')');
    R(ctx, 180, 380, 6, 90, '#9a7b52');
    em(ctx, '🔥', 270, 430, 50 + 8 * Math.sin(t * 20)); R(ctx, 240, 450, 60, 20, '#222');
    for (let i = 0; i < 7; i++) { const d = (t * 0.5 + i / 7) % 1; em(ctx, '💨', 270 - d * 280, 400 - d * 120 - i * 10, 34 + d * 60, { a: (1 - d) * 0.7 * clamp(t / 1) }); }
    L(ctx, 20, 290, 175, 290, '#555', 2);
    for (let i = 0; i < 4; i++) {
      em(ctx, '👕', 40 + i * 38, 318 + Math.sin(t * 3 + i) * 3, 38);
      if (gk > 0) { ctx.fillStyle = 'rgba(90,75,60,' + 0.7 * gk + ')'; ctx.fillRect(40 + i * 38 - 15, 305, 30, 28); }
    }
    em(ctx, '🧑', 90, 430, 58); if (t > 2.5) em(ctx, '😷', 90, 430, 58);
    em(ctx, '👨‍🍳', 300, 410, 54, { fx: true });
    const k = P(t, 5, 5.7);
    if (k > 0) { em(ctx, '🌭', lerp(280, 100, E.out(k)), 340 - arc(k, 60), 34); if (k >= 1) bub(ctx, 'Een worstje?', 180, 200, 1); }
  }),
  mk('c09', 'Toeristenfoto', 'Op het fietspad? Natuurlijk, mooi licht.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#cfe9ff', bot: '#fff', gy: 330, gc: '#8bc26b' });
    R(ctx, 0, 380, w, 120, '#c4503f'); R(ctx, 0, 436, w, 4, '#fff');
    const qn = Math.floor(clamp(t / 0.7, 0, 6)), go = P(t, 5, 5.6);
    for (let i = 0; i < qn; i++) {
      let x = 130 - i * 62;
      if (go > 0) x += (E.in(go) * 600);
      em(ctx, '🚴', x, 410 + (go > 0 ? -Math.abs(Math.sin(t * 20)) * 3 : 0), 54, { fx: false });
    }
    const flash = t > 3.2 && t < 4.6 && Math.floor(t * 4) % 2 === 0;
    let tx = 230, rot = 0, ty = 408;
    if (go > 0) { tx = 230 + 80 * go; rot = go * 14; ty = 408 - Math.sin(go * Math.PI) * 120; }
    if (go > 0.9) { tx = 230 + 80 * 0.9 + (go - 0.9) * 800; }
    em(ctx, '🚶', tx, ty, 62, { r: rot });
    em(ctx, '📸', tx - 20, ty - 10, 26);
    if (flash) R(ctx, 0, 0, w, h, 'rgba(255,255,255,0.7)');
    if (t > 2.4 && t < 5) for (let i = 0; i < 3; i++) em(ctx, '🔔', 150 + i * 10, 340 - ((t * 60 + i * 30) % 60), 22, { a: 0.7 });
    txt(ctx, 'RING RING', 160, 560, 24, '#ffd54a', t > 2.4 && t < 5 ? 1 : 0);
  }),
  mk('c10', 'Tegenwind', 'Windkracht 8, richting thuis.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#b7d4e6', bot: '#eef4f7', gy: 450, gc: '#9fb28a' });
    const turn = t > 5;
    for (let i = 0; i < 8; i++) { const x = ((turn ? -t : t) * 400 + i * 70) % 420; const xx = turn ? x : 420 - x; L(ctx, xx, 100 + i * 45, xx + (turn ? -50 : 50), 100 + i * 45, 'rgba(255,255,255,0.8)', 3); }
    em(ctx, '🚴', turn ? lerp(180, -120, E.in(P(t, 5.6, 6.6))) : 150 + Math.sin(t * 6) * 3, 420, 80, { fx: turn, r: turn ? 0.15 : -0.2 });
    em(ctx, '💦', 100, 380, 22, { a: turn ? 0 : 0.8 });
    if (!turn) {
      const x = lerp(-60, 460, P(t, 0.5, 4.8));
      em(ctx, '🐌', x, 460, 46, { fx: true });
      if (x > 200) txt(ctx, 'inhalen', x, 500, 18, '#fff');
      if (t > 3.8) em(ctx, '🥱', x - 5, 424, 22);
    }
    if (t > 5 && t < 5.6) txt(ctx, 'Hm...', 180, 300, 22, '#fff');
    if (t > 5.8) txt(ctx, 'MEEWIND!', 200, 250, 28, '#ffd54a');
  }),
  mk('c11', 'Eigen regenwolk', 'Het is de vijfde keer dit jaar, zegt hij.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#79c8ff', bot: '#e8f7ff', gy: 470, gc: '#7ec86a' });
    em(ctx, '☀️', 60, 90, 70);
    const px = 40 + 280 * P(t, 0.3, 5.5) + Math.sin(t * 2) * 6;
    const cx = lerp(300, px + 10, E.out(P(t, 0.3, 1.6)));
    const umb = t > 2.4 && t < 4.4;
    em(ctx, '☁️', cx, 190, 130, { a: 1 });
    ctx.save(); ctx.globalAlpha = 0.9;
    if (!umb) for (let i = 0; i < 12; i++) { const y = 230 + ((t * 420 + i * 33) % 230); L(ctx, cx - 40 + i * 7, y, cx - 44 + i * 7, y + 12, '#2c6fb8', 2); }
    ctx.restore();
    em(ctx, '🚶', px, 430, 64, { r: Math.sin(t * 9) * 0.06 });
    em(ctx, umb ? '☂️' : '🌂', px, 365, 60, { a: umb ? 1 : 0 });
    if (t > 4.4 && t < 4.7) txt(ctx, 'Hoppa', px, 330, 18, '#fff');
    if (t > 5.6) txt(ctx, 'Elke dag.', 180, 590, 22, '#fff', P(t, 5.6, 5.9));
    em(ctx, '🌷', 320, 450, 30, { sy: 1 + (px > 280 ? 0.6 : 0) });
  }),
  mk('c12', 'Stroopwafel', 'Warm worden duurt altijd net iets te lang.', 6.5, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#f3e2cc', bot: '#fff7ea', gy: 470, gc: '#a0724a' });
    R(ctx, 100, 360, 160, 110, '#f4f4f4'); R(ctx, 255, 380, 30, 50, '#f4f4f4');
    ctx.fillStyle = '#5b3418'; ctx.beginPath(); ctx.ellipse(180, 360, 80, 14, 0, 0, Math.PI * 2); ctx.fill();
    const sink = E.in(P(t, 2.5, 3.6));
    const ox = P(t, 4, 5);
    const wy = lerp(330, 365, P(t, 0.5, 2.5)) + sink * 12;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, w, 360 + 14 - 6); ctx.clip();
    if (sink < 1) em(ctx, '🧇', 180, wy - sink * 40 + sink * 0, 90 - sink * 20, { sy: 1 - sink * 0.2 });
    ctx.restore();
    if (sink >= 1) { em(ctx, '😱', 180, 300 - 6 * Math.sin(t * 20), 44); }
    R(ctx, 100, 360, 160, 110, '#f4f4f4'); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(110, 375, 14, 80);
    ctx.fillStyle = '#5b3418'; ctx.beginPath(); ctx.ellipse(180 , 468 , 80, 6, 0, 0, Math.PI * 2); ctx.fill();
    if (ox > 0) { ctx.fillStyle = '#5b3418'; ctx.beginPath(); ctx.ellipse(180, 470, 80 + 60 * ox, 10 + 6 * ox, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(100 - 4, 380 + 90 * ox, 8, 10); }
    em(ctx, '☕', 0, -100, 1);
    if (t > 4) txt(ctx, 'Hij was nog niet warm...', 180, 560, 18, '#fff', P(t, 4, 4.4));
    burst(ctx, t, 3.6, 180, 350, ['💧'], 6, 100, 18, 0.8);
  }),
  mk('c13', 'Kaasrollen', 'De kaas won. Zoals altijd.', 6.5, (ctx, t, w, h) => {
    const crash = t > 4.4;
    B(ctx, w, h, { top: '#bfe6ff', bot: '#f3fbff', sh: crash && t < 5 ? shake(t, 5) : [0, 0] });
    ctx.fillStyle = '#6bbf59'; ctx.beginPath(); ctx.moveTo(-30, 300); ctx.lineTo(380, 520); ctx.lineTo(380, 700); ctx.lineTo(-30, 700); ctx.fill();
    const k = P(t, 0.4, 4.4);
    const cx = lerp(10, 330, k), cy = lerp(280, 490, k) - 14;
    em(ctx, '🧀', cx, cy - 8, 52, { r: k * 22 });
    for (let i = 0; i < 6; i++) {
      const d = 50 + i * 38; const rx = lerp(10, 330, clamp(k - 0.0)) - d * (1 - P(t, 4.4, 4.5)) * 1;
      let x = cx - d, y = lerp(280, 490, clamp((x - 10) / 320)) - 30;
      let r = Math.sin(t * 14 + i) * 0.15;
      if (crash) { const f = P(t, 4.4, 5.6); x = lerp(cx - 20, cx - 20 + (i - 3) * 20, f); y = 470 - arc(f, 60 + 10 * i) - (i % 2) * 8 + 4; r = f * (i - 3); }
      if (x > -30) em(ctx, ['🏃', '🏃‍♀️', '🏃‍♂️'][i % 3], x, y, 46, { r });
    }
    if (t > 4.4) stars(ctx, t, cx - 60, 450, 40);
    if (t > 5.2) { em(ctx, '🧀', 345, 495, 40, { r: t * 3 }); txt(ctx, 'Kaas: 1 - Mensen: 0', 180, 90, 20, '#fff'); }
  }),
  mk('c14', 'Tulpenmanie', 'De beurs stortte in. De tulp ook.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#cfe9ff', bot: '#f6fbff', gy: 480, gc: '#6bbf59' });
    const g = E.in(P(t, 0.5, 4.8));
    const pop = t > 5;
    const price = Math.floor(5 + g * g * 9995);
    if (!pop) {
      R(ctx, 178, 480 - 100 - g * 120, 4, 100 + g * 120, '#2f8a3a');
      em(ctx, '🌷', 180, 480 - 100 - g * 120, 60 + g * 150 + Math.sin(t * 25) * g * 3);
    } else {
      burst(ctx, t, 5, 180, 220, ['🌷', '💸', '💥'], 14, 220, 34, 1.4);
      em(ctx, '🥀', 180, 450, 40 * P(t, 5.4, 5.8), { a: P(t, 5.4, 5.8) });
    }
    txt(ctx, pop ? '€ 0' : '€ ' + price, 180, 70, 36, pop ? '#ff6b6b' : '#ffd54a');
    em(ctx, '📈', 70, 130, 36, { a: pop ? 0 : 1 }); em(ctx, '📉', 70, 130, 36, { a: pop ? 1 : 0 });
    if (pop && t > 5.4) em(ctx, '🤵', 300, 440, 50);
    if (pop && t > 5.8) bub(ctx, 'Ik had een tulp...', 230, 360, 1);
  }),
  mk('c15', 'Molen ontvlucht', 'Windkracht 12, de molen deed het zelf.', 7, (ctx, t, w, h) => {
    const sh = t > 2 ? shake(t, 2 * clamp(t - 2, 0, 1)) : [0, 0];
    B(ctx, w, h, { top: '#9ecbe8', bot: '#eaf5fb', gy: 500, gc: '#6bbf59', sh });
    const up = E.in(P(t, 4, 6.4));
    const my = -up * 640;
    ctx.save(); ctx.translate(0, my);
    ctx.fillStyle = '#c0563a'; ctx.beginPath(); ctx.moveTo(130, 500); ctx.lineTo(230, 500); ctx.lineTo(210, 300); ctx.lineTo(150, 300); ctx.fill();
    ctx.fillStyle = '#8a3a28'; ctx.beginPath(); ctx.moveTo(140, 300); ctx.lineTo(220, 300); ctx.lineTo(180, 250); ctx.fill();
    R(ctx, 165, 440, 30, 60, '#5a3a22');
    const ang = 1.5 * t + 1.2 * t * t;
    ctx.translate(180, 290); ctx.rotate(ang);
    for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); L(ctx, 0, 0, 0, -130, '#5a3a22', 6); R(ctx, -14, -125, 28, 70, '#f1e6c8'); ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.strokeRect(-14, -125, 28, 70); }
    ctx.restore();
    for (let i = 0; i < 6; i++) { const x = ((t * 500 + i * 90) % 480) - 60; L(ctx, x, 120 + i * 60, x + 60, 120 + i * 60, 'rgba(255,255,255,0.8)', 3); }
    if (up > 0) em(ctx, '🌫️', 180, 500 + 0, 70, { a: 0.6 });
    if (t > 6.2) txt(ctx, 'Dag molen...', 180, 320, 24, '#fff', P(t, 6.2, 6.5));
    em(ctx, '🧑‍🌾', 270, 470, 46, { a: 1 }); if (t > 4) em(ctx, '😮', 270, 470, 46);
  }),
  mk('c16', 'Elfstedenkoorts', 'Een halve graad. Het hele land wist het.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#dbeeff', bot: '#f8fcff', gy: 450, gc: '#e4f4ff' });
    const temp = t < 1 ? 2 : t < 3.2 ? lerp(2, -1.5, P(t, 1, 3.2)) : t < 4.6 ? -1.5 : lerp(-1.5, 3, P(t, 4.6, 5.4));
    const happy = temp < 0;
    R(ctx, 160, 80, 40, 220, '#fff'); C(ctx, 180, 310, 34, '#e33');
    const my = 290 - (temp + 3) * 28; R(ctx, 173, my, 14, 300 - my, '#e33');
    txt(ctx, temp.toFixed(1) + ' °C', 180, 50, 26, '#fff');
    for (let i = 0; i < 6; i++) {
      const x = 40 + i * 56, j = happy ? Math.abs(Math.sin(t * 9 + i)) * 30 : 0;
      em(ctx, happy ? '⛸️' : '🌧️', x, 400 - j + (happy ? 0 : 10), 40);
      em(ctx, happy ? '🥳' : '😞', x, 360 - j + (happy ? 0 : 14 + 4 * Math.sin(t * 2 + i)), 36);
    }
    R(ctx, 0, 450, w, 190, happy ? '#d6f0ff' : '#7aa5c4');
    if (t > 4.6) txt(ctx, 'Toch weer niet.', 180, 560, 24, '#fff', P(t, 4.8, 5.2));
    if (happy && t > 3.2) txt(ctx, 'ER IS IJS!', 180, 540, 28, '#ff5252', 1);
  }),
  mk('c17', 'Vlaai-overval', 'De laatste puntjes zijn er altijd al niet meer.', 6.5, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#fbe3c0', bot: '#fff4e3', gy: 400, gc: '#9b6a3f' });
    const cx = 180, cy = 330, r = 100;
    ctx.fillStyle = '#e8c07a'; ctx.beginPath(); ctx.ellipse(cx, cy, r + 8, r * 0.45 + 6, 0, 0, Math.PI * 2); ctx.fill();
    const taken = Math.floor(clamp((t - 1) / 0.7, 0, 8));
    for (let i = 0; i < 8; i++) {
      if (i < taken) continue;
      const a0 = i * Math.PI / 4, a1 = a0 + Math.PI / 4;
      ctx.fillStyle = i % 2 ? '#b02a3a' : '#c8344a';
      ctx.beginPath(); ctx.moveTo(cx, cy);
      for (let a = a0; a <= a1 + 0.001; a += 0.1) ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.45);
      ctx.fill();
    }
    for (let i = 0; i < Math.min(taken, 8); i++) {
      const k = P(t, 1 + i * 0.7, 1.4 + i * 0.7), side = i % 2 ? 1 : -1;
      em(ctx, '✋', cx + side * (lerp(r + 80, 40, 1 - Math.abs(2 * k - 1))), cy - 10, 40, { fx: side > 0 });
    }
    if (t > 6) {}
    const walkin = E.out(P(t, 5.3, 6.2));
    if (taken >= 8) {
      em(ctx, '🧔', lerp(420, 260, walkin), 480, 60);
      if (t > 6) bub(ctx, 'Is er nog vlaai?', 220, 400, 1);
      em(ctx, '🍽️', cx, cy, 60);
    }
  }),
  mk('c18', 'Hagelslag-lawine', 'Een beetje meer? Ja. Meer.', 6.5, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#fff3e0', bot: '#ffe4bf', gy: 470, gc: '#a0724a' });
    const k = P(t, 1, 5);
    const mound = 30 + 180 * E.io(k);
    em(ctx, '🍞', 180, 440, 90, { a: 1 });
    em(ctx, '🥫', 180, 150 - 0, 0);
    const tilt = P(t, 0.4, 1) * 2.2;
    em(ctx, '🥣', 180, 120, 70, { r: tilt * 0.4 });
    const cols = ['#e74c3c', '#f1c40f', '#3498db', '#8e44ad', '#2ecc71', '#7b3f1d'];
    if (t > 1 && t < 5.5) for (let i = 0; i < 70; i++) {
      const ph = (t * 1.6 + rnd(i)) % 1, x = 160 + rnd(i + 5) * 40 + (rnd(i + 2) - 0.5) * ph * 30;
      const y = 140 + ph * (470 - mound - 140);
      R(ctx, x, y, 3, 8, cols[i % 6]);
    }
    ctx.save(); ctx.fillStyle = '#7b3f1d';
    ctx.beginPath(); ctx.moveTo(180 - mound * 1.1, 470); ctx.quadraticCurveTo(180, 470 - mound * 2, 180 + mound * 1.1, 470); ctx.fill();
    ctx.clip();
    for (let i = 0; i < 90; i++) R(ctx, 180 + (rnd(i) - 0.5) * mound * 2.2, 470 - rnd(i + 8) * mound * 1.1, 4, 4, cols[i % 6]);
    ctx.restore();
    if (t > 5.2) { bub(ctx, 'Waar is mijn boterham?', 180, 250, P(t, 5.2, 5.5)); }
    em(ctx, '😶', 60, 500, 40, { a: t > 4 ? 1 : 0 });
  }),
  mk('c19', 'Alpenhoogte', 'Zuid-Limburg zet je nog in je CV.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#a5d8ff', bot: '#effaff', gy: 470, gc: '#6bbf59' });
    ctx.fillStyle = '#6bbf59'; ctx.beginPath(); ctx.moveTo(100, 470); ctx.quadraticCurveTo(180, 440, 260, 470); ctx.fill();
    const k = P(t, 0.4, 4.4);
    const x = lerp(20, 180, E.io(k)) + (k >= 1 ? lerp(0, 150, E.in(P(t, 5.8, 6.8))) : 0);
    const y = 470 - Math.sin(clamp((x - 100) / 160, 0, 1) * Math.PI) * 18;
    const hard = k < 1 ? Math.sin(t * 14) * 0.08 : 0;
    em(ctx, '🧗', x, y - 32, 62, { r: hard });
    if (k < 1) for (let i = 0; i < 3; i++) em(ctx, '💦', x + 20 + i * 8, y - 70 - ((t * 40 + i * 20) % 30), 14);
    if (k >= 1 && t < 5.8) { const f = E.back(P(t, 4.6, 5.2)); em(ctx, '🚩', 180, 420 - 6, 44 * f); txt(ctx, 'Toppunt: 2 meter', 180, 330, 24, '#fff', P(t, 4.8, 5.2)); }
    if (t > 5.2 && t < 5.8) em(ctx, '😮‍💨', x + 10, y - 75, 30);
    if (t > 4.4) em(ctx, '🏔️', 70, 190, 70 * 0 + 50 * clamp(1 - Math.abs(Math.sin(t * 3)), 0, 1) + 30, { a: 0.3 });
  }),
  mk('c20', 'Fietsslot-niveau 99', 'Het slot was onbreekbaar. De paal niet.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#cdd8e8', bot: '#eef2f8', gy: 470, gc: '#8a8f98' });
    const lock = Math.floor(clamp(t / 0.5, 0, 6));
    const thief = P(t, 3, 4.5), pull = E.in(P(t, 4.5, 6.5));
    const dx = -pull * 440;
    R(ctx, 210 + dx, 330, 14, 140, '#555'); 
    if (t > 4.5 && t < 6.4) ctx.fillStyle = '#333', ctx.fillRect(205 + dx + 7 - 18, 465, 36, 8);
    em(ctx, '🚲', 170 + dx, 430, 90 - 0);
    for (let i = 0; i < lock; i++) em(ctx, '🔒', 190 + dx + (i % 3) * 14, 415 + Math.floor(i / 3) * 24, 22);
    L(ctx, 150 + dx, 440, 217 + dx, 400, '#999', 3);
    const tx = lerp(-40, 150, E.out(thief)) + dx * 0.85 - (pull > 0 ? 0 : 0);
    if (t > 3 && t < 6.5) em(ctx, '🦹', tx, 420 - Math.abs(Math.sin(t * 12)) * (pull > 0 ? 8 : 0), 58, { fx: false });
    if (t > 3.2 && t < 4.5) bub(ctx, 'Hmm, sterk slot.', 120, 330, 1);
    if (t > 4.4 && t < 4.9) txt(ctx, 'RUK', 210, 300, 30, '#ff5252');
    if (t > 6) em(ctx, '🕳️', 217, 475, 36);
    if (t > 6.2) { txt(ctx, 'Nu nog een paal', 180, 580, 20, '#fff', P(t, 6.2, 6.5)); }
    if (t < 3) em(ctx, '😎', 60, 520, 36);
  }),
  mk('c21', 'Net gemist', 'Daarna komen ze met z\'n drieën.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#cfe0f5', bot: '#eef3fa', gy: 470, gc: '#777' });
    R(ctx, 0, 470, w, 8, '#fff');
    R(ctx, 270, 330, 6, 140, '#444'); R(ctx, 250, 320, 46, 18, '#2a6fd6'); txt(ctx, 'HALTE', 273, 329, 10, '#fff');
    const bus = P(t, 1.2, 3.2);
    const bx = t < 1.2 ? 250 : lerp(250, 520, E.in(bus));
    em(ctx, '🚌', bx, 430, 100, { fx: true });
    const rx = lerp(-40, 380, E.io(P(t, 0.4, 3.2)));
    em(ctx, '🏃', Math.min(rx, 330), 430 - Math.abs(Math.sin(t * 14)) * 10, 54);
    if (t > 1.2 && t < 2.6) { txt(ctx, 'HÉ!', Math.min(rx, 330), 360, 22, '#ff5252'); }
    if (t > 3.5 && t < 4.6) { em(ctx, '😮‍💨', Math.min(rx, 330), 420, 50); }
    for (let i = 0; i < 3; i++) {
      const k = E.out(P(t, 4.6 + i * 0.2, 5.8 + i * 0.2));
      em(ctx, '🚌', lerp(-80, 150 + i * 0, k) - i * 0, 430 - i * 0, 70 - i * 6, { fx: true, a: 1 });
    }
    const k3 = E.out(P(t, 4.6, 5.8)); const k2 = E.out(P(t, 4.8, 6)); const k1 = E.out(P(t, 5, 6.2));
    void k3; void k2; void k1;
    if (t > 6.2) txt(ctx, 'ALLE DRIE', 180, 300, 26, '#ffd54a');
  }),
  mk('c22', 'Spoorloos vertraagd', 'Vijf minuten, meldt de omroeper.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#c8d3e2', bot: '#e9eef5', gy: 480, gc: '#9aa3ae' });
    R(ctx, 40, 60, 280, 100, '#10212f'); R(ctx, 46, 66, 268, 88, '#0a1520');
    const mins = [5, 15, 45, 120, 999];
    const idx = Math.min(4, Math.floor(t / 1.3));
    const label = idx === 4 ? 'VERVALT' : '+' + mins[idx] + ' min';
    txt(ctx, 'Intercity 1234', 180, 90, 14, '#7fe');
    txt(ctx, label, 180, 128, 32, idx >= 3 ? '#ff5252' : '#ffd54a');
    const age = P(t, 0.5, 6);
    const who = age < 0.35 ? '🧑' : age < 0.7 ? '🧔' : '👴';
    em(ctx, who, 180, 420 + (age > 0.7 ? 0 : 0), 72, { sy: 1 + age * 0.04 });
    for (let i = 0; i < 10; i++) { if (age > 0.1 * i) em(ctx, '🍂', 40 + rnd(i) * 280, 480 + rnd(i + 3) * 20, 20, { r: rnd(i + 9) * 3 }); }
    if (age > 0.6) em(ctx, '🕸️', 300, 200, 60 * clamp((age - 0.6) * 3));
    em(ctx, '🪴', 50, 450, 50 + 80 * age, { a: 1 });
    if (t > 5.8) txt(ctx, 'Wij bieden onze excuses aan.', 180, 580, 17, '#fff', P(t, 5.8, 6.2));
  }),
  mk('c23', 'Eendenfile', 'Op de weg heeft alleen de eend voorrang.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#bfe6ff', bot: '#f2fbff', gy: 330, gc: '#8bc26b' });
    R(ctx, 0, 380, w, 130, '#555'); for (let i = 0; i < 6; i++) R(ctx, i * 70 + 10, 442, 40, 6, '#ffe');
    const back = E.in(P(t, 5.2, 6.8));
    const wait = P(t, 0, 0.8);
    for (let i = 0; i < 3; i++) {
      const x = lerp(-60, 110 - i * 90, E.out(wait)) - back * 400 * (1 + i * 0.1);
      em(ctx, '🚗', x, 470, 64, { fx: true });
      if (t > 3 && Math.floor(t * 5 + i) % 2) txt(ctx, 'TOET', x + 10, 420, 16, '#ffd54a');
    }
    for (let i = 0; i < 4; i++) {
      const x = lerp(-30, 360, clamp((t - 0.8 - i * 0.55) / 2.8));
      const last = i === 3;
      const ex = last ? Math.min(x, 230) : x;
      em(ctx, last ? '🦆' : '🐥', ex, 395 + Math.sin(t * 9 + i) * 3, last ? 48 : 30, { fx: true });
    }
    if (t > 3.8 && t < 5.8) { em(ctx, '🦆', 230, 395, 56, { fx: false }); bub(ctx, 'Wat?', 230, 340, 1); }
    if (t > 5) txt(ctx, 'Zo, rustig aan...', 180, 560, 18, '#fff', P(t, 5, 5.3));
  }),
  mk('c24', 'Inparkeren', 'Hij stond er recht in, zegt hij.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#d6e4f5', bot: '#eef2f8', gy: 440, gc: '#777' });
    R(ctx, 0, 440, w, 200, '#666');
    for (let i = 0; i < 6; i++) R(ctx, 40 + i * 0, 440, 0, 0, '#fff');
    R(ctx, 105, 480, 4, 100, '#fff'); R(ctx, 255, 480, 4, 100, '#fff'); R(ctx, 105, 480, 154, 4, '#fff');
    const bump = [P(t, 1.5, 1.8) - P(t, 1.8, 2.1), P(t, 3.2, 3.5) - P(t, 3.5, 3.8)];
    em(ctx, '🚙', 55 - bump[0] * 4, 540 + bump[0] * -6, 74 * 0 + 74, { r: bump[0] * 0.1 });
    em(ctx, '🚐', 305 + bump[1] * 6, 540, 74, { r: -bump[1] * 0.1 });
    const k = P(t, 0.2, 5);
    const x = lerp(-60, 188, E.out(k)) + Math.sin(k * 14) * 10 * (1 - k);
    const y = lerp(380, 540, k) + (k < 1 ? Math.sin(k * 12) * 20 * (1 - k) : 0);
    const r = Math.sin(k * 13) * 0.5 * (1 - k) + 0.25 * k * (1 - 0) * 1;
    em(ctx, '🚗', x, y, 78, { r: r * 0.6 });
    if (t > 1.5 && t < 2.1 || t > 3.2 && t < 3.8) txt(ctx, 'KRRK', 180, 440, 24, '#ffd54a');
    if (t > 5.2) { em(ctx, '😎', 188, 540, 22); txt(ctx, 'Prima.', 180, 330, 26, '#fff', P(t, 5.2, 5.5)); }
    if (t > 5.9) { const f = E.back(P(t, 5.9, 6.5)); em(ctx, '🛵', 330 - 0, 530, 40 * f); em(ctx, '🤔', 330, 480, 24 * f); }
  }),
  mk('c25', 'U bent aangekomen', 'De route zei rechtdoor. Dus.', 7, (ctx, t, w, h) => {
    const splash = t > 3.4;
    B(ctx, w, h, { top: '#cfe9ff', bot: '#f6fbff', sh: splash && t < 3.9 ? shake(t, 5) : [0, 0] });
    R(ctx, 0, 380, 220, 260, '#8a8f98'); R(ctx, 0, 380, 220, 6, '#ddd');
    R(ctx, 220, 400, 160, 240, '#3b82b8'); R(ctx, 220, 400, 160, 8, '#8fd0f0');
    em(ctx, '🏠', 90, 330, 70); em(ctx, '🏡', 30, 340, 50);
    const x = lerp(-60, 260, E.in(P(t, 0.5, 3.4)));
    const sink = P(t, 3.4, 6);
    const y = 345 + (x > 215 ? 40 * sink + Math.sin(t * 3) * 3 : 0) + (x > 215 ? 20 : 0);
    em(ctx, '🚗', x, y, 62, { r: x > 215 ? 0.2 + sink * 0.5 : 0 });
    R(ctx, 0, 0, 0, 0, '#000');
    R(ctx, 226, 405, 154, 235, 'rgba(60,130,190,0.35)');
    burst(ctx, t, 3.4, 250, 380, ['💦'], 10, 160, 22, 1);
    em(ctx, '📱', 300, 130, 56); R(ctx, 275, 160, 0, 0, '#000');
    if (t < 3.4) bub(ctx, 'Rechtdoor.', 300, 190, 1);
    else if (t > 3.8) bub(ctx, 'U bent aangekomen.', 220, 190, 1);
    if (t > 5) em(ctx, '🦆', 300 + Math.sin(t) * 4, 410, 40);
  }),
  mk('c26', 'Winkelwagen-chaos', 'Eén wiel doet altijd zijn eigen ding.', 7, (ctx, t, w, h) => {
    const crash = t > 3.2;
    B(ctx, w, h, { top: '#f7f7f0', bot: '#e9e9df', gy: 480, gc: '#cfd2c8', sh: crash && t < 4 ? shake(t, 7 * (4 - t)) : [0, 0] });
    const k = P(t, 0.3, 3.2);
    const x = lerp(-60, 240, E.in(k)), swerve = Math.sin(k * 11) * 40 * k;
    for (let r = 0; r < 4; r++) for (let c = 0; c <= r; c++) {
      const bx = 270 + (c - r / 2) * 30, by = 460 - r * 30;
      const f = P(t, 3.2 + r * 0.1 + c * 0.03, 4.8);
      em(ctx, '🥫', bx + f * (110 + (c - r / 2) * 30 + r * 10) * (c % 2 ? 1 : 1.2), by - arc(f, 40 + 10 * r) + (f > 0.5 ? 0 : 0), 28, { r: f * 8 * (c - 1) });
    }
    if (!crash) {
      em(ctx, '🛒', x, 440 + swerve * 0.3, 70, { r: Math.sin(k * 11) * 0.2 });
      em(ctx, '🧑', x - 50, 430 + swerve * 0.3, 60);
    } else {
      const f = P(t, 3.2, 4.2);
      em(ctx, '🛒', 245 - f * 10, 440 - arc(f, 30), 70, { r: -f * 0.8 });
      em(ctx, '🧑', 215 - f * 30, 430 - arc(f, 70), 60, { r: -f * 1.2 });
    }
    if (t > 4.8) { em(ctx, '😵‍💫', 190, 440, 34); txt(ctx, 'Hij zei toch: schoon wagentje', 180, 150, 16, '#555', P(t, 4.9, 5.2)); }
    if (t > 3.2 && t < 3.6) txt(ctx, 'KLETTER', 250, 340, 28, '#ff5252');
  }),
  mk('c27', 'Zelfscankassa', 'Onverwacht artikel. Wacht op medewerker.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#e9eef2', bot: '#fafafa', gy: 480, gc: '#c9ccd1' });
    R(ctx, 90, 300, 180, 180, '#334'); R(ctx, 100, 310, 160, 80, '#9be'); R(ctx, 100, 410, 160, 40, '#bbb');
    const err = t > 1.4;
    txt(ctx, err ? 'WACHT OP MEDEWERKER' : 'Scan uw product', 180, 350, err ? 12 : 14, err ? '#c00' : '#036');
    const k = E.out(P(t, 0.2, 1.4));
    em(ctx, '🍌', lerp(150, 180, k), lerp(260, 430, k) , 38 );
    if (err && Math.floor(t * 4) % 2 === 0) R(ctx, 0, 0, w, h, 'rgba(255,0,0,0.12)');
    em(ctx, '🚨', 180, 280, 34 + (Math.floor(t * 4) % 2) * 6, { a: err ? 1 : 0 });
    const n = Math.floor(clamp((t - 1.5) / 0.55, 0, 8));
    for (let i = 0; i < n; i++) em(ctx, i % 2 ? '🧓' : '🧑', 330 - 0 + 0 - 0, 0, 0);
    for (let i = 0; i < n; i++) { const x = 20 + i * 40; em(ctx, ['🧓', '🧑', '👩', '👴'][i % 4], 330 - (7 - i) * 0 - i * 0 + (i - 0) * 0 + 0 - 0 + 0 - (0), 0, 0); }
    for (let i = 0; i < n; i++) em(ctx, ['🧓', '🧑', '👩', '👴'][i % 4], 30 + i * 40 - 0, 540 - (i % 2) * 12, 44, { r: Math.sin(t * 3 + i) * 0.05 });
    if (t > 5.2) { em(ctx, '🧑‍💼', lerp(420, 300, E.out(P(t, 5.2, 6))), 430, 60); if (t > 6) bub(ctx, 'Pauze.', 280, 360, 1); }
  }),
  mk('c28', 'Rij kiezen', 'De andere rij is altijd sneller. Tot je er staat.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#f2f2ea', bot: '#e6e6da', gy: 470, gc: '#cfcfc2' });
    R(ctx, 60, 140, 80, 40, '#333'); R(ctx, 220, 140, 80, 40, '#333'); txt(ctx, 'KASSA 1', 100, 160, 12, '#fff'); txt(ctx, 'KASSA 2', 260, 160, 12, '#fff');
    const m = (t % 1.7) / 1.7, ph = Math.floor(t / 1.7);
    const person = (i, lane) => ['🧓', '🧑', '👩'][i % 3];
    // lane A moves when phase even -> we are in B
    for (let lane = 0; lane < 2; lane++) {
      const moving = (ph % 2 === lane) && t < 5.1;
      const adv = moving ? E.io(clamp(m * 1.5)) * 50 : 0;
      const final = t >= 5.1;
      for (let i = 0; i < 4; i++) {
        const x = lane === 0 ? 100 : 260;
        const y = 220 + i * 60 - (final ? E.in(P(t, 5.2, 6)) * 120 : (moving ? adv : 0) - (ph > lane ? 0 : 0) * 0);
        em(ctx, person(i + lane), x, y, 40);
      }
    }
    const sw = (ph % 2 === 0) ? E.io(P(m, 0.4, 1)) : 1 - E.io(P(m, 0.4, 1));
    const px = t > 5.1 ? lerp(100, 260, 0.5) : lerp(100, 260, sw);
    em(ctx, '🧔', px, 480, 50, { r: Math.sin(t * 6) * 0.05 });
    em(ctx, '😤', px, 440, 20);
    if (t > 5.1) { txt(ctx, 'BEIDE RIJEN BEWEGEN', 180, 100, 15, '#ffd54a'); em(ctx, '😭', px, 440, 20); }
    if (t < 5.1 && m > 0.4 && m < 0.8) txt(ctx, 'Hop!', px, 410, 18, '#fff');
  }),
  mk('c29', 'Bonuskaart', 'Heeft u een bonuskaart? Alleen van alles behalve deze.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#f2f2ea', bot: '#ececdf', gy: 520, gc: '#c9c9ba' });
    R(ctx, 30, 380, 300, 80, '#4a4a4a'); R(ctx, 30, 380, 300, 10, '#666');
    em(ctx, '🧑‍💼', 280, 340, 64);
    bub(ctx, 'Bonuskaart?', 260, 250, P(t, 0.3, 0.6) * (t < 5.6 ? 1 : 0));
    const n = Math.floor(clamp((t - 1) / 0.12, 0, 34));
    for (let i = 0; i < n; i++) {
      const f = clamp((t - 1 - i * 0.12) / 0.9);
      const x = lerp(90, 40 + rnd(i) * 200, f), y = lerp(300, 520 - (i % 4) * 8, E.in(f));
      em(ctx, ['💳', '🪪', '🎫', '🏷️'][i % 4], x, y, 32, { r: f * 6 * (rnd(i + 2) - 0.5) });
    }
    em(ctx, '🧑', 90, 340, 70, { r: Math.sin(t * 10) * 0.05 * (t < 4.5 ? 1 : 0) });
    em(ctx, '👛', 90, 390, 40);
    if (t > 4.8) { em(ctx, '😬', 90, 340, 70); bub(ctx, 'Nee.', 90, 270, 1); }
  }),
  mk('c30', 'Uitverkoop', 'Iedereen rende voor hetzelfde ding.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#fff1b8', bot: '#fffbe0', gy: 480, gc: '#d0c9a8' });
    R(ctx, 0, 0, w, 6, '#e00'); txt(ctx, 'SALE -70%', 180, 80, 34, '#e00');
    const open = E.io(P(t, 0.4, 1.2));
    R(ctx, 10, 250, 340, 230, '#5a4a3a');
    R(ctx, 110 - open * 90, 260, 70, 220, 'rgba(170,220,250,0.7)'); R(ctx, 180 + open * 90, 260, 70, 220, 'rgba(170,220,250,0.7)');
    const run = P(t, 1.2, 2.4);
    for (let i = 0; i < 9; i++) {
      const x = lerp(-20 - i * 25, 180 + (rnd(i) - 0.5) * 60, E.out(run));
      if (t > 1.2 && t < 3.4) em(ctx, ['🏃', '🏃‍♀️', '🙋', '🧓'][i % 4], x, 400 - (i % 3) * 10, 40);
    }
    if (t >= 2.4 && t < 4.4) {
      const sh = shake(t, 5);
      ctx.fillStyle = 'rgba(210,205,190,0.9)'; ctx.beginPath(); ctx.arc(180 + sh[0], 400 + sh[1], 90, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 6; i++) { const a = t * 7 + i; em(ctx, ['✋', '🦵', '👊', '💥'][i % 4], 180 + Math.cos(a) * 90, 400 + Math.sin(a) * 70, 28); }
    }
    const f = P(t, 4.4, 5.6);
    if (t >= 4.4) {
      em(ctx, '🧴', lerp(180, 300, f), 400 - arc(f, 200), 36, { r: f * 12 });
      em(ctx, '🧓', 310, 420, 54); em(ctx, '💫', 180, 420, 30, { a: 1 - f });
      if (t > 5.6) { bub(ctx, 'Dank u wel.', 300, 340, 1); }
    }
  }),
  mk('c31', 'Tent opzetten', 'Tent: 0. Wind: 1.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#9fd4ff', bot: '#e4f5ff', gy: 470, gc: '#7ec86a' });
    for (let i = 0; i < 6; i++) { const x = ((t * 350 + i * 80) % 460) - 60; L(ctx, x, 120 + i * 50, x + 50, 120 + i * 50, 'rgba(255,255,255,0.8)', 3); }
    const k = P(t, 1.5, 3.2), up = E.in(P(t, 3.2, 6)), 
      tx = 200 + 90 * up, ty = 400 - 480 * up;
    const grow = E.out(P(t, 0.3, 1.5));
    em(ctx, '⛺', tx, ty - 5, 130 * grow + 10, { r: up * 0.9 + Math.sin(t * 20) * 0.04 * k });
    if (up === 0) shade(ctx, 200, 470, 50 * grow);
    const hy = 440 - up * 120 * (up > 0.3 ? 0.3 : 1);
    const px = 140 + 40 * up;
    const dangle = up > 0.05;
    em(ctx, '🧑', px + (dangle ? 90 * up * 0.2 : 0), dangle ? 420 - 150 * up * 1.3 : 430, 62, { r: dangle ? 0.6 + Math.sin(t * 9) * 0.2 : 0 });
    if (dangle) L(ctx, px + 20, 400 - 150 * up, tx - 20, ty + 20, '#c33', 2);
    if (t > 6 && t < 7) txt(ctx, 'Tentharingen? Ja!', 180, 570, 18, '#fff', P(t, 6, 6.3));
    if (t > 3.4) txt(ctx, 'AAAH', 120, 300, 24, '#ff5252', 1 - P(t, 5, 6));
  }),
  mk('c32', 'Lege camping', 'Er is 10 hectare. Hij wilde juist hier.', 7, (ctx, t, w, h) => {
    const bump = t > 3.5 && t < 4.2;
    B(ctx, w, h, { top: '#b8e0ff', bot: '#effaff', gy: 400, gc: '#6bbf59', sh: bump ? shake(t, 4) : [0, 0] });
    for (let i = 0; i < 6; i++) em(ctx, '🌲', 30 + i * 60, 360, 40);
    const squash = bump ? 1 - 0.2 * Math.sin((t - 3.5) / 0.7 * Math.PI) : 1;
    em(ctx, '⛺', 120, 470, 100 * 1, { sx: squash });
    em(ctx, '🧔', 200, 500, 52); if (t > 4) em(ctx, '😑', 200, 500, 52);
    const x = lerp(420, 215, E.out(P(t, 0.4, 3.5)));
    em(ctx, '🚐', x, 480, 120 );
    em(ctx, '🪑', x - 80 + 0, 520, 0);
    if (t > 3.5) { em(ctx, '🧓', 280, 560, 50); bub(ctx, 'Gezellig, hè?', 270, 500, P(t, 4, 4.4)); }
    em(ctx, '🔌', 140, 540, 30 * P(t, 4.8, 5.2)); L(ctx, 140, 540, x, 520, '#222', 3 * P(t, 4.8, 5.2));
    if (t > 5.4) txt(ctx, 'Stekker lenen? Ja.', 180, 600, 18, '#fff', P(t, 5.4, 5.7));
  }),
  mk('c33', 'Smoorheet', 'Factor 50 was ook gewoon een getal.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#74c7ff', bot: '#fff0c0', gy: 420, gc: '#f2d98a' });
    const s = P(t, 0, 4);
    const sunS = 70 + 80 * s;
    em(ctx, '🌞', 280, 110, sunS, { r: t * 0.3 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + t; L(ctx, 280 + Math.cos(a) * (sunS * 0.65), 110 + Math.sin(a) * (sunS * 0.65), 280 + Math.cos(a) * (sunS * 0.65 + 20 + s * 40), 110 + Math.sin(a) * (sunS * 0.65 + 20 + s * 40), 'rgba(255,200,0,0.7)', 3); }
    em(ctx, '⛱️', 60, 380, 80, { a: 1 });
    R(ctx, 80, 440, 150, 22, '#e84a7a');
    const who = t < 4.4 ? '🧑' : '🦞';
    em(ctx, who, 160, 420, 80 + (t > 4.4 ? 10 * E.back(P(t, 4.4, 5)) : 0), { sy: 1 });
    if (t < 4.4) { ctx.fillStyle = 'rgba(255,40,0,' + 0.5 * s + ')'; ctx.beginPath(); ctx.arc(160, 420, 36, 0, Math.PI * 2); ctx.fill(); }
    if (t > 4.4) { burst(ctx, t, 4.4, 160, 400, ['💨', '♨️'], 6, 80, 22, 1.2); bub(ctx, 'Ik zit nog onder de parasol!', 180, 300, 1); }
    em(ctx, '🧴', 300 - 0, 470, 30, { r: 0.5 }); 
    if (s > 0.5 && t < 4.4) txt(ctx, 'sssss', 160, 360, 18, '#ffd54a');
  }),
  mk('c34', 'Zandkasteel', 'De krab nam de sleutels over.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#9fdcff', bot: '#e7f6ff', gy: 400, gc: '#f0d890' });
    R(ctx, 0, 240, w, 160, '#3a9ad9'); R(ctx, 0, 240, w, 8, '#bfe6ff');
    const wave = E.io(P(t, 2.2, 3.6)) - E.io(P(t, 4, 5.4));
    ctx.fillStyle = 'rgba(58,154,217,0.85)'; ctx.fillRect(-30, 400 - wave * 90, w + 60, wave * 90 + 2);
    ctx.fillStyle = '#f0d890';
    const k = E.out(P(t, 0.2, 2.2)), er = E.io(P(t, 2.6, 3.8));
    const hgt = 100 * k * (1 - er) + 10 * er;
    ctx.fillStyle = '#d9b560';
    ctx.beginPath(); ctx.moveTo(100, 460); ctx.lineTo(100, 460 - hgt); ctx.lineTo(120, 460 - hgt); ctx.lineTo(120, 460 - hgt * 0.8); ctx.lineTo(140, 460 - hgt * 0.8); ctx.lineTo(140, 460 - hgt); ctx.lineTo(160, 460 - hgt);
    ctx.lineTo(160, 460); ctx.fill();
    ctx.fillRect(100, 458, 200, 22);
    if (er < 0.5) em(ctx, '🚩', 130, 460 - hgt - 20, 30);
    em(ctx, '🧒', 260, 440, 56, { sy: t > 3 ? 1 : 1 }); 
    if (t > 3.8) em(ctx, '😭', 260, 440, 56);
    const cr = E.out(P(t, 4.8, 5.8));
    em(ctx, '🦀', lerp(380, 130, cr), 470, 44 + 4 * Math.sin(t * 12));
    if (t > 5.8) { em(ctx, '🚩', 130, 440, 28); em(ctx, '🔑', 150, 470, 22); txt(ctx, 'Verhuisd.', 180, 560, 24, '#fff', P(t, 5.8, 6.1)); }
  }),
  mk('c35', 'Meeuwenroof', 'Eén patatje is nooit één patatje.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#8fd3ff', bot: '#eefaff', gy: 440, gc: '#f0d890' });
    R(ctx, 0, 330, w, 110, '#4ca3e0');
    const dive = P(t, 1.4, 2.1);
    const fries = t < 1.8;
    em(ctx, '🧍', 120, 420, 64);
    if (fries) em(ctx, '🍟', 160, 395, 32);
    const gx = lerp(430, 190, E.in(P(t, 0.9, 1.8))), gy = lerp(80, 400, E.in(P(t, 0.9, 1.8)));
    if (t < 2.4) em(ctx, '🕊️', gx, gy, 56, { fx: true, r: 0.5 });
    if (t >= 2.4 && t < 3.6) em(ctx, '🕊️', lerp(190, -40, P(t, 1.8, 3.6)), lerp(400, 120, P(t, 1.8, 3.6)), 56, { fx: false });
    if (t > 1.8 && t < 3.2) { em(ctx, '🍟', lerp(160, 70, P(t, 1.8, 3.6)), lerp(395, 140, P(t, 1.8, 3.6)), 32); }
    if (t > 1.8) em(ctx, '😮', 120, 380, 24);
    if (t > 3.6) {
      em(ctx, '🍦', 160, 395, 34);
      for (let i = 0; i < 6; i++) {
        const k = E.in(P(t, 4.4 + i * 0.15, 5.4 + i * 0.15));
        em(ctx, '🕊️', lerp(-40 + i * 80, 160, k), lerp(-30, 395, k) + (i % 2) * 5, 34, { fx: false });
      }
      if (t > 5.4) { em(ctx, '😱', 120, 380, 28); const f = P(t, 5.4, 6.8); }
    }
    if (t > 5.4) txt(ctx, 'AAAAH!', 180, 280, 28, '#ff5252');
  }),
  mk('c36', 'Overgewicht', 'Handbagage mocht 8 kilo. Aan het lijf niet.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#e8eef5', bot: '#f8fafc', gy: 500, gc: '#c0c6ce' });
    R(ctx, 90, 420, 180, 22, '#333'); 
    const kg = (23 + 7 * E.out(P(t, 0.4, 1.5)) - 7 * E.in(P(t, 2, 2.8)));
    txt(ctx, kg.toFixed(1) + ' kg', 180, 431, 16, '#7fe');
    const hot = t > 4;
    em(ctx, '🧳', 180, 380, 80);
    const layers = Math.floor(clamp((t - 2.4) / 0.4, 0, 5));
    const fat = 1 + layers * 0.18;
    em(ctx, hot ? '🥵' : '🧑', 180, 250, 54, { sx: fat });
    for (let i = 0; i < layers; i++) em(ctx, ['🧥', '🧣', '🧦', '🧤', '👖'][i], 180 + (i % 2 ? 40 : -40) * fat * 0.7, 270 + i * 6, 28);
    if (layers >= 5) em(ctx, '🧑‍🦲', 0, 0, 0);
    if (hot) {
      const k = P(t, 4, 4.5);
      R(ctx, 0, 0, w, h, 'rgba(255,170,0,' + 0.25 * k + ')');
      em(ctx, '☀️', 300, 100, 60 + 10 * Math.sin(t * 8));
      for (let i = 0; i < 4; i++) em(ctx, '💦', 140 + i * 25, 230 + ((t * 70 + i * 20) % 70), 18);
      txt(ctx, '35 °C', 80, 90, 28, '#fff');
    } else if (t < 2.4) em(ctx, '😰', 255, 330, 26);
    if (t > 5.4) txt(ctx, 'Gate 12: Curaçao', 180, 580, 18, '#fff', P(t, 5.4, 5.7));
  }),
  mk('c37', 'Pauze!', 'Zo snel als in de les ging hij nooit.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#cfe9ff', bot: '#f6fbff', gy: 460, gc: '#aab4bd' });
    R(ctx, 20, 200, 120, 260, '#c9a27a'); R(ctx, 60, 340, 42, 120, '#5a3a22');
    const bell1 = t > 0.8 && t < 1.6 || t > 5 && t < 5.6;
    em(ctx, '🔔', 80, 170 + (bell1 ? Math.sin(t * 50) * 4 : 0), 40);
    const out = P(t, 1.2, 3), back = P(t, 5.3, 6.8);
    const n = 12;
    for (let i = 0; i < n; i++) {
      let x = 90, y = 430;
      const dx = 50 + rnd(i) * 250, dy = 440 + (rnd(i + 4) - 0.5) * 90;
      const o = E.out(clamp(out - i * 0.02));
      x = lerp(90, dx, o); y = lerp(430, dy, o) - arc(clamp(o), 20);
      if (t > 3) { const wig = Math.sin(t * 7 + i) * 8; x += wig; y += Math.abs(Math.sin(t * 6 + i)) * -10; }
      if (t > 5) { const b = E.in(clamp(back - i * 0.02)); x = lerp(x, 90, b); y = lerp(y, 430, b); }
      if (!(back > 0.99 && t > 6.7)) em(ctx, ['🧒', '👧', '🧑‍🎓'][i % 3], x, y, 36, { fx: x < 90 });
    }
    const spin = P(t, 1.2, 2.2);
    em(ctx, '👩‍🏫', 100 - 0, 440 + 0, 56, { r: spin < 1 ? spin * 12 : 0 });
    if (t > 2.2 && t < 4.8) { em(ctx, '☕', 80, 420, 30); em(ctx, '😌', 80, 380, 24); }
    if (t > 5) txt(ctx, 'Pauze is voorbij.', 220, 120, 22, '#fff', P(t, 5, 5.3));
  }),
  mk('c38', 'Bal op het dak', 'Volgende week gaat het dak open.', 7, (ctx, t, w, h) => {
    const crash = t > 5.6;
    B(ctx, w, h, { top: '#bfe6ff', bot: '#f2fbff', gy: 500, gc: '#9aa3ae', sh: crash && t < 6.3 ? shake(t, 5) : [0, 0] });
    R(ctx, 120, 250, 220, 250, '#d9886a');
    const sag = E.in(P(t, 4, 5.6));
    ctx.fillStyle = '#7a3a2a'; ctx.beginPath(); ctx.moveTo(100, 252); ctx.lineTo(230, 200 + sag * 40); ctx.lineTo(360, 252); ctx.fill();
    for (let i = 0; i < 4; i++) R(ctx, 140 + i * 50, 300, 30, 40, '#9fd0ee');
    const balls = Math.floor(clamp((t - 0.6) / 0.8, 0, 6));
    for (let i = 0; i < 6; i++) {
      const t0 = 0.6 + i * 0.8, k = P(t, t0, t0 + 0.8);
      if (k <= 0) continue;
      const fx = 120 + i * 0, gx = 150 + (i % 3) * 25, gy = 232 + sag * 36 - Math.floor(i / 3) * 18;
      const x = lerp(60, gx + 40, k), y = k < 1 ? lerp(470, gy, k) - arc(k, 260) : gy;
      em(ctx, '⚽', x, crash ? y + P(t, 5.6, 6.2) * 240 : y, 30, { r: k * 7 });
    }
    em(ctx, '🧒', 60, 470, 46, { a: 1 });
    if (t > 4.4 && t < 5.6) txt(ctx, 'KRAAK', 230, 170, 24, '#ffd54a', 1);
    if (crash) { burst(ctx, t, 5.6, 230, 260, ['🧱', '💥'], 10, 150, 30, 1.2); }
    if (crash) em(ctx, '🤷', 60, 470, 46);
  }),
  mk('c39', 'Mijn hond heeft...', 'De hond bleek het niet eens te willen.', 7, (ctx, t, w, h) => {
    B(ctx, w, h, { top: '#f6e8c8', bot: '#fff7e6', gy: 490, gc: '#b8855a' });
    R(ctx, 30, 120, 90, 120, '#2d6a4f'); txt(ctx, 'KLAS', 75, 150, 18, '#fff');
    em(ctx, '👩‍🏫', 270, 430, 80);
    em(ctx, '🧒', 100, 440, 74);
    const ph = P(t, 0.8, 1.4);
    bub(ctx, 'Mijn hond heeft het opgegeten.', 160, 330, ph * (t < 4.4 ? 1 : 0));
    if (t > 2.2) em(ctx, '🤨', 270, 395, 30);
    const dx = lerp(-60, 190, E.out(P(t, 2.2, 3.6)));
    em(ctx, '🐕', dx, 480, 62);
    if (t > 3.6 && t < 4.6) { const b = Math.sin(P(t, 3.6, 4.6) * Math.PI); em(ctx, '🐕', dx, 480, 62 * 0 + 0); ctx.save(); ctx.translate(dx, 480); ctx.scale(1 + b * 0.18, 1 + b * 0.18); ctx.restore(); }
    const k = P(t, 4.2, 5.4);
    if (k > 0) {
      if (k < 1) em(ctx, '📄', lerp(dx + 25, 130, k), 460 - arc(k, 60), 30, { r: k * 9 });
      txt(ctx, 'BRRRP', dx, 400, 22, '#ffd54a', P(t, 4.2, 4.4) * (1 - P(t, 4.8, 5.2)));
      if (k >= 1) { em(ctx, '📄', 130, 490, 30, { r: 0.3 }); em(ctx, '💧', 130, 510, 14); }
    }
    if (t > 5.6) { em(ctx, '😳', 100, 440, 74); txt(ctx, 'Gerecht.', 270, 360, 20, '#fff', P(t, 5.6, 5.9)); }
  }),
  mk('c40', 'Touwklimmen', 'Omhoog ging prima. Het plan voor omlaag ontbrak.', 7, (ctx, t, w, h) => {
    const slam = t > 4.4;
    B(ctx, w, h, { top: '#eadfca', bot: '#f6efe0', gy: 520, gc: '#7a9a6e', sh: slam && t < 5 ? shake(t, 5 * (5 - t)) : [0, 0] });
    R(ctx, 0, 70, w, 12, '#8b6b4a');
    R(ctx, 176, 82, 6, 440, '#b8914f');
    R(ctx, 120, 505, 120, 20, '#2a6fd6');
    em(ctx, '🧒', 70, 470, 40, { a: 0 });
    const up = E.io(P(t, 0.4, 3));
    const y0 = 490 - up * 380;
    const drop = P(t, 4.4, 4.8);
    const bounce = P(t, 4.8, 6.4);
    let y = y0;
    if (t > 3.6 && t < 4.4) y = 110 + Math.sin(t * 10) * 3;
    if (t >= 4.4) y = lerp(110, 475, E.in(drop)) - (bounce > 0 ? arc(bounce, 480) : 0);
    em(ctx, '🧒', 179, y, 46, { r: t > 3.6 && t < 4.4 ? Math.sin(t * 8) * 0.2 : 0 });
    em(ctx, '👨‍🏫', 300, 470, 56);
    em(ctx, '⏱️', 300, 420, 28);
    if (t > 3.2 && t < 4.4) bub(ctx, 'Hoe kom ik omlaag?', 179, 150, 1);
    if (t > 4.5 && t < 5) txt(ctx, 'PLOF', 180, 430, 28, '#ffd54a');
    if (t > 5.4 && t < 6.4) { const b = bounce; if (b > 0.85) em(ctx, '💡', 179, 90, 30); }
    if (t > 6) txt(ctx, 'Tijd: gelukt-ish', 180, 590, 20, '#555', P(t, 6, 6.3));
  }),
];
