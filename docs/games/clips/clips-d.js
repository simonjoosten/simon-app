// Gamescroller clips D (d01..d40) - fantasie, superhelden, dino's, tijdreizen, sprookjes, ridders vs. techniek, magie
// Pure draw(ctx, t, w, h), w=360 h=640
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const P = (t, a, b) => clamp((t - a) / (b - a));
const rnd = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const E = {
  lin: (k) => k,
  in: (k) => k * k,
  out: (k) => 1 - (1 - k) * (1 - k),
  io: (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2),
  back: (k) => { const c = 2.70158; return 1 + c * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2); },
  bounce: (k) => {
    const n = 7.5625, d = 2.75;
    if (k < 1 / d) return n * k * k;
    if (k < 2 / d) { k -= 1.5 / d; return n * k * k + 0.75; }
    if (k < 2.5 / d) { k -= 2.25 / d; return n * k * k + 0.9375; }
    k -= 2.625 / d; return n * k * k + 0.984375;
  },
  elastic: (k) => (k === 0 || k === 1 ? k : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * 2.0944) + 1),
};
const arc = (k, h) => 4 * h * k * (1 - k);
const shk = (t, a) => [a * Math.sin(t * 91), a * Math.cos(t * 77)];
const pulse = (t, a, b) => Math.sin(clamp((t - a) / (b - a)) * Math.PI); // 0..1..0

function begin(ctx, w, h, o = {}) {
  const sh = o.sh || [0, 0];
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  if (o.z && o.z !== 1) {
    const c = o.zc || [w / 2, h / 2];
    ctx.translate(c[0], c[1]); ctx.scale(o.z, o.z); ctx.translate(-c[0], -c[1]);
  }
  ctx.translate(sh[0], sh[1]);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, o.top || '#8fd3ff');
  g.addColorStop(1, o.bot || '#e6f7ff');
  ctx.fillStyle = g;
  ctx.fillRect(-60, -60, w + 120, h + 120);
  if (o.gy != null) ground(ctx, w, h, o.gy, o.gc || '#6bbf59');
}
function end(ctx) { ctx.restore(); }
function ground(ctx, w, h, gy, col) {
  ctx.fillStyle = col; ctx.fillRect(-60, gy, w + 120, h - gy + 60);
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-60, gy, w + 120, 4);
}
function em(ctx, ch, x, y, s = 64, o = {}) {
  ctx.save();
  ctx.translate(x, y);
  if (o.r) ctx.rotate(o.r);
  ctx.scale((o.fx ? -1 : 1) * (o.sx == null ? 1 : o.sx), o.sy == null ? 1 : o.sy);
  ctx.globalAlpha = o.a == null ? 1 : clamp(o.a);
  ctx.font = s + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(ch, 0, 0);
  ctx.restore();
}
function txt(ctx, s, x, y, size = 24, col = '#fff', a = 1, stroke) {
  ctx.save();
  ctx.globalAlpha = clamp(a);
  ctx.font = 'bold ' + size + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (stroke) { ctx.lineWidth = 5; ctx.strokeStyle = stroke; ctx.strokeText(s, x, y); }
  ctx.fillStyle = col; ctx.fillText(s, x, y);
  ctx.restore();
}
function shadow(ctx, x, y, r, a = 0.25) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(1, r), Math.max(1, r * 0.25), 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function circle(ctx, x, y, r, col, a = 1) {
  ctx.save(); ctx.globalAlpha = clamp(a); ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function ring(ctx, x, y, r, col, lw = 4, a = 1) {
  ctx.save(); ctx.globalAlpha = clamp(a); ctx.strokeStyle = col; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}
function line(ctx, x1, y1, x2, y2, col, lw = 3, a = 1) {
  ctx.save(); ctx.globalAlpha = clamp(a); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}
function rect(ctx, x, y, ww, hh, col, a = 1) {
  ctx.save(); ctx.globalAlpha = clamp(a); ctx.fillStyle = col; ctx.fillRect(x, y, ww, hh); ctx.restore();
}
function sparks(ctx, x, y, k, n, r, col = '#ffd23f', seed = 0) {
  if (k <= 0 || k >= 1) return;
  for (let i = 0; i < n; i++) {
    const a = rnd(i + seed) * Math.PI * 2, d = r * E.out(k) * (0.5 + rnd(i + seed + 40) * 0.5);
    circle(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, 5 * (1 - k), col, 1 - k * 0.5);
  }
}
function rain(ctx, t, x0, x1, y0, y1, n, col = '#4aa8ff', a = 0.8) {
  for (let i = 0; i < n; i++) {
    const x = x0 + rnd(i) * (x1 - x0), y = y0 + ((t * 420 + rnd(i + 50) * (y1 - y0)) % (y1 - y0));
    line(ctx, x, y, x - 3, y + 14, col, 2, a);
  }
}
function bub(ctx, s, x, y, a = 1, size = 18) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(a);
  ctx.font = 'bold ' + size + 'px sans-serif';
  const tw = ctx.measureText ? (ctx.measureText(s).width || s.length * size * 0.6) : s.length * size * 0.6;
  const bw = (typeof tw === 'number' ? tw : s.length * size * 0.6) / 2 + 16;
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#222'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(x, y, bw, size * 0.95, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#111'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y);
  ctx.restore();
}
function flash(ctx, w, h, a, col = '#fff') { if (a > 0) rect(ctx, -60, -60, w + 120, h + 120, col, a); }
function dust(ctx, x, y, k, n = 6) {
  if (k <= 0 || k >= 1) return;
  for (let i = 0; i < n; i++) circle(ctx, x + (rnd(i) - 0.5) * 80 * k, y - k * 30 * rnd(i + 9), 8 + 14 * k, '#d9c9a8', 0.7 * (1 - k));
}
function stars(ctx, t, n, w, hmax) {
  for (let i = 0; i < n; i++) circle(ctx, rnd(i) * w, rnd(i + 20) * hmax, 1.5 + rnd(i + 5) * 1.5, '#fff', 0.5 + 0.5 * Math.sin(t * 3 + i));
}
function hill(ctx, w, y, col, amp = 30) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-10, 700);
  for (let x = -10; x <= w + 10; x += 20) ctx.lineTo(x, y - Math.sin(x * 0.02 + amp) * amp);
  ctx.lineTo(w + 10, 700); ctx.fill();
}

const CLIPS_ARR = [];
const add = (id, title, caption, dur, draw) => CLIPS_ARR.push({ id, title, caption, dur, draw });

add('d01', 'Brandalarm in de grot', 'Hij had de rookmelder echt over het hoofd gezien.', 6, (ctx, t, w, h) => {
  const trig = 3.4;
  const rainOn = P(t, trig, trig + 0.2) * (1 - P(t, 5.6, 5.9));
  begin(ctx, w, h, { top: '#2b1b3d', bot: '#6a4a6a', gy: 470, gc: '#4a4458', sh: t > trig && t < 4.2 ? shk(t, 2) : [0, 0] });
  rect(ctx, 0, 0, w, 18, '#222');
  circle(ctx, 250, 28, 12, '#999'); circle(ctx, 250, 28, 5, '#555');
  const dx = lerp(-70, 110, E.out(P(t, 0, 1.6)));
  const shrink = 1 - 0.35 * P(t, trig + 0.4, 4.6);
  shadow(ctx, dx, 478, 70 * shrink);
  em(ctx, '🐉', dx, 420, 120 * shrink, { fx: true, sy: 1 + 0.04 * Math.sin(t * 6) });
  const f = P(t, 2, 3.1) * (1 - P(t, trig, trig + 0.5));
  for (let i = 0; i < 5; i++) { const k = i / 5; if (f * 5 > i) em(ctx, '🔥', dx + 60 + k * 150 * f + 10, 415 - Math.sin(t * 12 + i) * 6, 36 + k * 36, { r: Math.sin(t * 10 + i) * 0.3 }); }
  if (t > trig - 0.6 && t < trig + 2) em(ctx, '🚨', 250, 70, 34 + 4 * Math.sin(t * 20));
  if (rainOn > 0) { rain(ctx, t, 60, 330, 40, 480, 60, '#4aa8ff', rainOn); rect(ctx, 0, 0, w, h, '#3a7acf', 0.15 * rainOn); }
  if (t > trig + 0.5 && t < 5.5) for (let i = 0; i < 4; i++) em(ctx, '💨', dx + 20 + i * 12, 360 - ((t * 40 + i * 25) % 90), 28, { a: 0.7 });
  if (t > 4.6) em(ctx, '☂️', dx, 340, 54, { a: P(t, 4.6, 4.9) });
  end(ctx);
});

add('d02', 'Parkeergarage voor ridders', 'Zonder kaartje komt niemand er langs. Behalve de ridder.', 6, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#9ed8ff', bot: '#f2fbff', gy: 480, gc: '#7a7a82' });
  rect(ctx, 0, 482, w, 6, '#ffd23f');
  rect(ctx, 270, 390, 20, 92, '#555');
  const open = 0;
  line(ctx, 275, 410, 275 - 150 * (1 - open) - 0, 410, '#fff', 12);
  for (let i = 0; i < 4; i++) rect(ctx, 275 - 25 - i * 35, 404, 14, 12, '#e33');
  txt(ctx, 'P', 300, 330, 44, '#fff', 1, '#1a52c8');
  const hx = lerp(-60, 215, E.in(P(t, 0.3, 2.3)));
  const stopped = t > 2.3;
  shadow(ctx, hx, 482, 50);
  em(ctx, '🐎', hx, 440, 84, { fx: false, sx: 1, r: stopped ? -0.2 * Math.max(0, 1 - (t - 2.3) * 3) : Math.sin(t * 20) * 0.04 });
  dust(ctx, hx - 20, 482, P(t, 2.3, 3.0));
  let rx = hx + 4, ry = 385;
  const k = P(t, 2.3, 3.7);
  if (stopped) { rx = hx + 4 + 125 * k; ry = 385 - arc(k, 130) * 1 + (k >= 1 ? 80 : 0); if (k < 1) ry = 385 - arc(k, 130) + k * 85; }
  em(ctx, '🤺', rx, ry, 56, { r: stopped ? k * 6.28 * (k < 1 ? 1 : 0) + (k >= 1 ? 1.57 : 0) : 0 });
  if (k >= 1) { sparks(ctx, rx, 470, P(t, 3.7, 4.3), 8, 40); txt(ctx, '*klang*', rx, 420 - P(t, 3.7, 4.5) * 20, 20, '#fff', 1 - P(t, 4.3, 5), '#333'); }
  if (t > 4.4) bub(ctx, 'Kaartje?', 250, 330, P(t, 4.4, 4.7), 20);
  end(ctx);
});

add('d03', 'Spiegeltje, spiegeltje', 'Rekenen kan ze, richten niet.', 6, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#3a2a5a', bot: '#a57ab8', gy: 480, gc: '#3d3050' });
  stars(ctx, t, 20, w, 250);
  const done = t > 3.3;
  shadow(ctx, 80, 484, 40);
  if (!done) em(ctx, '🧙‍♀️', 80, 425, 90, { sx: 1 + 0.03 * Math.sin(t * 8) });
  else {
    const k = P(t, 3.3, 3.9);
    em(ctx, '🐸', 80, 465 - arc((t * 1.5) % 1, 22) * (t > 4 ? 1 : 0), 52 + 38 * (1 - k));
    em(ctx, '🎩', 80, 380 + E.bounce(P(t, 3.3, 4.2)) * 70, 50, { r: -0.4 });
    sparks(ctx, 80, 430, P(t, 3.3, 4.3), 14, 80, '#c77dff');
    txt(ctx, 'KWAK', 150, 380, 26, '#9be564', P(t, 4.2, 4.4) * (1 - P(t, 5.2, 5.8)), '#223');
  }
  em(ctx, '🐇', 310, 440, 50, { fx: true, a: 1 });
  rect(ctx, 224, 360, 14, 120, '#c9b037');
  em(ctx, '🪞', 232, 410, 90);
  if (t > 1.2 && t < 2.2) { const k = P(t, 1.2, 2.0); line(ctx, 112, 420, lerp(112, 220, k), lerp(420, 405, k), '#d96bff', 8); }
  if (t > 2.1 && t < 3.4) { const k = P(t, 2.1, 3.0); line(ctx, 225, 405, lerp(225, 112, k), lerp(405, 420, k), '#ff7bd9', 8); }
  if (t > 2.0 && t < 2.4) sparks(ctx, 225, 405, P(t, 2.0, 2.4), 8, 30, '#fff');
  flash(ctx, w, h, 0.6 * pulse(t, 3.1, 3.5));
  end(ctx);
});

add('d04', 'Schat zoeken', 'De kaart zei X. De kaart zei niet wat erin zat.', 7, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#7fd0ff', bot: '#cfeaff', gy: 400, gc: '#e8cf8e' });
  rect(ctx, 0, 400, w, 240, '#e8cf8e');
  em(ctx, '🌴', 300, 340, 90);
  txt(ctx, 'X', 160, 470, 54, '#d6221f', 1, '#fff');
  const dig = P(t, 0.8, 3.6);
  const holeW = 30 + 90 * dig;
  ctx.save(); ctx.fillStyle = '#6a4a28'; ctx.beginPath(); ctx.ellipse(160, 480, holeW, 8 + 28 * dig, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  if (dig > 0 && dig < 1) for (let i = 0; i < 6; i++) { const k = ((t * 2.5 + i / 6) % 1); circle(ctx, 160 + (rnd(i) - 0.5) * 120 * k, 480 - arc(k, 80), 6, '#c9a85e'); }
  const px = 160 + (t > 3.8 ? -P(t, 3.8, 4.3) * 15 : 0);
  em(ctx, '🧔', 80 + 0 * px, 395 + Math.abs(Math.sin(t * 8)) * (dig < 1 && dig > 0 ? 6 : 0), 76);
  em(ctx, '🦜', 118, 360, 34, { sy: 1 + 0.1 * Math.sin(t * 6) });
  line(ctx, 112, 430, 150, 460 + Math.sin(t * 8) * 8 * (dig > 0 && dig < 1 ? 1 : 0), '#7a5a2a', 5);
  if (t > 3.6) {
    const k = P(t, 3.6, 4.3);
    rect(ctx, 140, 462 - 10 * k, 40, 24, '#8a5a2a', 1); rect(ctx, 140, 462 - 10 * k, 40, 5, '#d9a441');
    const lid = P(t, 4.3, 4.9);
    line(ctx, 142, 462 - 10 * k, 142, 462 - 10 * k - 22 * lid, '#a8742e', 8);
    if (lid > 0) { ring(ctx, 160, 458, 20 + 60 * lid, '#ffe27a', 6, 1 - lid); em(ctx, '✨', 160, 440 - lid * 20, 40, { a: 1 - P(t, 5.5, 6) }); }
    const s = P(t, 5.0, 6.0);
    if (s > 0) em(ctx, '🧦', 160 + s * 40, 450 - arc(s, 130), 46, { r: s * 8 });
  }
  if (t > 6.0) bub(ctx, 'Eén sok?!', 100, 320, P(t, 6, 6.3), 18);
  end(ctx);
});

add('d05', 'Spook met pech', 'Hij verwacht niet dat jij zijn gespook gewoon negeert.', 6, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#1c1633', bot: '#4a3f72', gy: 500, gc: '#2a2442' });
  circle(ctx, 290, 90, 38, '#fff6c9'); stars(ctx, t, 25, w, 200);
  const px = lerp(-60, 420, P(t, 0, 5.8));
  const gs = t < 2 ? 1 : t < 3 ? 1 + 2 * E.out(P(t, 2, 2.5)) : lerp(3, 0.3, E.io(P(t, 4.5, 5.2)));
  const gx = 230;
  if (t > 1.8) txt(ctx, 'BOEEE!', gx, 240 - 20 * gs, 22 + 12 * gs, '#ff6b6b', 1, '#000');
  em(ctx, '👻', gx, 380 + Math.sin(t * 3) * 10 - (gs - 1) * 30, 70 * gs, { sy: t > 4.3 ? 0.6 : 1, a: 0.9 });
  shadow(ctx, px, 505, 36);
  em(ctx, '🚶', px, 450, 70, { fx: false, sy: 1 + 0.04 * Math.sin(t * 14) });
  em(ctx, '🎧', px - 2, 418, 30);
  if (t > 4.3 && t < 5.5) txt(ctx, 'pfff...', gx, 440, 20, '#ccc', 1);
  end(ctx);
});

add('d06', 'De drie bokken', 'Troll vergeet dat het formaat niet bij elke bok past.', 7, (ctx, t, w, h) => {
  const hit = 5.1;
  begin(ctx, w, h, { top: '#a8d8ff', bot: '#e2f4ff', gy: 520, gc: '#5aa04a', sh: t > hit && t < hit + 0.6 ? shk(t, 6) : [0, 0] });
  rect(ctx, 0, 400, w, 120, '#4aa8d8', 0.6); // water
  rect(ctx, 0, 380, w, 22, '#8a6a4a'); rect(ctx, 0, 380, w, 5, '#a8845a');
  rect(ctx, 20, 400, 22, 120, '#6a5038'); rect(ctx, w - 42, 400, 22, 120, '#6a5038');
  const sizes = [34, 60, 100];
  for (let i = 0; i < 3; i++) {
    const s0 = 0.4 + i * 1.6;
    const gx = lerp(-40, 400, P(t, s0, s0 + 1.5));
    if (i === 2 && t > hit) continue;
    if (P(t, s0, s0 + 1.5) > 0 && P(t, s0, s0 + 1.5) < 1) em(ctx, '🐐', gx, 345 - sizes[i] * 0.12 + Math.abs(Math.sin(t * 9 + i)) * 4, sizes[i], { fx: true });
  }
  const trollY = 450;
  const gx3 = lerp(-40, 400, P(t, 3.6, 5.1));
  let tr = 1 - 0.0;
  if (t < hit) {
    em(ctx, '🧌', 190, trollY + 20 * (t > 1.8 ? 0 : 0), 84 * tr, { sx: 1, sy: 1 });
    if (t < 1.6) bub(ctx, 'Toll!', 190, 380, 1, 14);
  }
  if (t > 3.9 && t < hit) em(ctx, '🐐', lerp(-40, 190, P(t, 3.6, hit)), 340, 100, { fx: true });
  if (t >= hit) {
    const k = P(t, hit, hit + 1.6);
    em(ctx, '🧌', 190 + k * 60, trollY - k * 700 + 300 * k * k * 0, 84, { r: k * 14 });
    em(ctx, '🐐', 215, 335, 100, { fx: true, sx: 1 + 0.2 * pulse(t, hit, hit + 0.3) });
    sparks(ctx, 190, 400, P(t, hit, hit + 0.5), 10, 70, '#fff');
    if (k > 0.7) txt(ctx, '✨', 250, 40 + (1 - k) * 100, 30, '#fff', P(t, 6.2, 6.4));
  }
  end(ctx);
});

add('d07', 'Regenboog-belasting', 'Zelfs aan het eind van de regenboog moet je aangifte doen.', 6.5, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#8fd3ff', bot: '#e6f7ff', gy: 480, gc: '#6bbf59' });
  const cols = ['#ff4d4d', '#ffa13d', '#ffe23d', '#5ccf4d', '#3da1ff', '#7a4dff'];
  for (let i = 0; i < 6; i++) { ctx.strokeStyle = cols[i]; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(60, 480, 330 - i * 9, Math.PI * 1.1, Math.PI * 1.9 + 0.2); ctx.stroke(); }
  em(ctx, '☁️', 300, 110, 80, { a: 0.9 });
  em(ctx, '🪙', 100, 458, 52);
  txt(ctx, '💰', 100, 450, 1, '#fff', 0);
  const bld = P(t, 2.6, 3.2);
  em(ctx, '🏢', 330 + (1 - E.out(bld)) * 120, 420, 120);
  em(ctx, '🧙', 150, 440, 60, { fx: false, sy: 1 + 0.03 * Math.sin(t * 7) });
  if (t < 2.4) em(ctx, '🎩', 150, 395, 1, { a: 0 });
  const n = 8;
  for (let i = 0; i < n; i++) {
    const k = P(t, 3.3 + i * 0.12, 4.6 + i * 0.12);
    if (k > 0 && k < 1) em(ctx, '🪙', lerp(100, 330, E.io(k)), 450 - arc(k, 130 + i * 6) , 24, { r: k * 10 });
  }
  const gone = P(t, 3.3, 4.8);
  if (t < 3.3) em(ctx, '🪙', 90, 455, 26); 
  if (t > 3.2 && t < 5.2) sparks(ctx, 330, 420, P(t, 4.4, 5.2), 8, 30, '#ffd23f');
  if (t > 2.8) bub(ctx, 'Aangifte!', 270, 300, P(t, 2.8, 3.1) * (1 - P(t, 5.0, 5.4)), 18);
  if (t > 5.0) { em(ctx, '😑', 150, 400, 40, { a: 1 }); bub(ctx, '...', 150, 345, P(t, 5, 5.3), 16); }
  end(ctx);
});

add('d08', 'Superheldenlanding', 'Perfect geland. Op de auto van de buurman.', 5.5, (ctx, t, w, h) => {
  const hit = 2.2;
  const kz = P(t, hit - 0.4, hit);
  begin(ctx, w, h, { top: '#74c4ff', bot: '#d8f0ff', gy: 500, gc: '#555a66', sh: t > hit && t < hit + 0.7 ? shk(t, 8 * (1 - P(t, hit, hit + 0.7))) : [0, 0], z: 1 + 0.15 * pulse(t, hit - 0.6, hit + 0.5) });
  rect(ctx, 0, 500, w, 6, '#ffd23f');
  em(ctx, '🏙️', 90, 400, 160, { a: 0.5 });
  const squash = t > hit ? 1 - 0.55 * E.elastic(P(t, hit, hit + 0.5)) * 0 - 0.4 * (1 - 0) : 1;
  const sq = t > hit ? 0.55 : 1;
  em(ctx, '🚗', 190, 470 + (1 - sq) * 22, 100, { sy: sq, sx: 1 + (1 - sq) * 0.5 });
  if (t > hit) em(ctx, '💥', 190, 440, 70 * pulse(t, hit, hit + 0.4) + 20, { a: 1 - P(t, hit + 0.4, hit + 0.6) });
  if (t > hit) { const a = clamp(Math.sin(t * 28)); em(ctx, '🚨', 215, 420, 26, { a }); }
  const k = P(t, 0, hit);
  const hy = lerp(-60, 405, E.in(k));
  if (t < hit) { line(ctx, 190, hy - 60, 190, hy - 140, 'rgba(255,255,255,0.7)', 6); em(ctx, '🦸', 190, hy, 76, { r: 3.14 + 0 }); }
  else { em(ctx, '🦸', 190, 395 + 0, 76, { r: 0, sy: 1 }); }
  if (t > 3.4) { em(ctx, '🧔', 55, 455, 64, { fx: true, a: P(t, 3.4, 3.7) }); bub(ctx, 'Mijn Opel!', 70, 390, P(t, 3.6, 3.9), 16); }
  end(ctx);
});

add('d09', 'Cape in de liftdeur', 'Vliegen kan hij. Weggaan uit de lift niet.', 6, (ctx, t, w, h) => {
  const snap = 2.8;
  begin(ctx, w, h, { top: '#7ec8f8', bot: '#c9e8ff' });
  rect(ctx, 0, 0, 30, h, '#8a8f99');
  rect(ctx, 0, 180, 40, 260, '#5b6270'); rect(ctx, 4, 190, 14, 240, '#aeb6c2'); rect(ctx, 22, 190, 14, 240, '#8e97a4');
  txt(ctx, '↑↓', 20, 160, 18, '#fff');
  const k = t < snap ? E.in(P(t, 0.6, snap)) : 0;
  const stretch = Math.min(1, k);
  const hx = t < snap ? lerp(70, 280, stretch) : lerp(280, 60, E.back(P(t, snap, snap + 0.35)));
  const hy = 310 + (t < snap ? Math.sin(t * 6) * 4 : 0);
  line(ctx, 32, 310, hx - 20, hy, '#e33', 10);
  line(ctx, 32, 296, hx - 20, hy - 12, '#c11', 4);
  em(ctx, '🦸', hx, hy, 76, { sx: t < snap ? 1 + 0.1 * stretch : 1, r: t < snap ? -0.15 * stretch : 0 });
  if (t > snap) {
    const sh = pulse(t, snap, snap + 0.8);
    sparks(ctx, hx, hy, P(t, snap + 0.2, snap + 0.8), 8, 40, '#fff');
    if (t > snap + 0.3) em(ctx, '🤕', hx, hy - 50, 30, { a: P(t, snap + 0.3, snap + 0.5) });
    txt(ctx, 'AU', hx, hy + 60, 24, '#ff5252', P(t, snap + 0.15, snap + 0.35) * (1 - P(t, 4.5, 5)), '#000');
  }
  if (t < snap) for (let i = 0; i < 3; i++) line(ctx, hx - 60 - i * 20, hy - 20 + i * 14, hx - 90 - i * 20, hy - 20 + i * 14, '#fff', 3, 0.7 * stretch);
  if (t > 4.5) txt(ctx, 'Deur sluit...', 190, 560, 22, '#334', P(t, 4.5, 4.8));
  end(ctx);
});

add('d10', 'De rode knop', 'Waarom staat die knop eigenlijk onder zijn stoel?', 6, (ctx, t, w, h) => {
  const fall = 3.7;
  begin(ctx, w, h, { top: '#2a0d0d', bot: '#6a1d1d', gy: 470, gc: '#2c2c36', sh: t > fall && t < fall + 0.5 ? shk(t, 4) : [0, 0] });
  const gx = 170;
  rect(ctx, 150, 478, 120, 6, '#000', 0.4);
  const open = P(t, fall - 0.4, fall);
  rect(ctx, 110, 470, 120 * (1 - open) + 0, 12, '#555');
  if (open > 0) rect(ctx, 110, 470, 120, 170, '#000', open);
  em(ctx, '🦈', 300, 520, 80, { fx: true, sy: 1 + 0.05 * Math.sin(t * 5) });
  rect(ctx, 255, 540, 100, 100, '#3a8ed8', 0.8);
  let y = 410, x = 170;
  if (t > fall) { const k = P(t, fall, fall + 1.3); y = 410 + E.in(k) * 220; x = 170 + k * 100; }
  em(ctx, '🦹', x, y, 84, { r: t > fall ? (t - fall) * 4 : 0 });
  if (t < fall) {
    em(ctx, '🪑', 170, 440, 40, { a: 0 });
    circle(ctx, 70, 468, 20, '#a00'); circle(ctx, 70, 464 + (t > 2.8 ? 8 * P(t, 2.8, 3.1) : 0), 16, t > 2.8 ? '#ff2a2a' : '#d22');
    if (t > 1.5) { const hand = P(t, 1.5, 2.8); line(ctx, 130, 430, lerp(130, 72, hand), lerp(430, 450, hand), '#e5b887', 8); }
    if (t > 3.1) bub(ctx, 'Mwahaha!', 170, 330, P(t, 3.1, 3.3) * (1 - P(t, 3.5, 3.7)), 18);
    if (t > 0.6 && t < 1.5) bub(ctx, 'Nu... de wereld!', 170, 330, 1, 16);
  } else {
    if (t > fall + 1.2) { sparks(ctx, 280, 560, P(t, fall + 1.2, fall + 2), 12, 70, '#bfe6ff'); }
    txt(ctx, 'AAAAH!', 170, 300, 28, '#fff', 1 - P(t, fall + 0.9, fall + 1.3), '#a00');
    if (t > fall + 1.7) bub(ctx, 'Wat een haai-tech...', 210, 460, P(t, fall + 1.7, fall + 2), 14);
  }
  end(ctx);
});

add('d11', 'Jeukende neus', 'Die armpjes hadden er echt iets aan moeten doen.', 6.5, (ctx, t, w, h) => {
  const hit = 4.0;
  begin(ctx, w, h, { top: '#f8c36b', bot: '#ffe9b5', gy: 500, gc: '#9a7a4a', sh: t > hit && t < hit + 0.8 ? shk(t, 8 * (1 - P(t, hit, hit + 0.8))) : [0, 0] });
  circle(ctx, 280, 100, 40, '#ff7b3d', 0.9);
  const body = 180, by = 380;
  em(ctx, '🦖', body, by, 190, { sx: 1 });
  const tries = t < hit ? Math.sin(t * 9) * 8 : 0;
  line(ctx, body - 30, by + 20, body - 52 + tries, by + 8, '#2d8c4a', 8);
  line(ctx, body - 30, by + 30, body - 54 + tries, by + 36, '#2d8c4a', 8);
  txt(ctx, '~', body - 100 - Math.sin(t * 8) * 4, by - 40, 30, '#f55', t < hit ? 1 : 0);
  if (t > 1) bub(ctx, 'Jeuk!', 85, 260, P(t, 1, 1.2) * (t < hit ? 1 : 0), 18);
  if (t >= 1 && t < hit) em(ctx, '😣', body - 60, by - 90, 30);
  const k = P(t, 2.4, hit);
  if (k > 0 && t < hit + 0.1) {
    em(ctx, '☄️', lerp(420, body - 80, E.in(k)), lerp(-60, by - 70, E.in(k)), 80, { r: 0.6 });
  }
  flash(ctx, w, h, 0.9 * pulse(t, hit, hit + 0.35));
  if (t > hit) {
    sparks(ctx, body - 70, by - 70, P(t, hit, hit + 1), 16, 120, '#ff9a3d');
    dust(ctx, body - 70, 500, P(t, hit + 0.1, hit + 1.2), 8);
    if (t > hit + 1.3) { em(ctx, '😌', body - 60, by - 90, 34); bub(ctx, 'Ahhh... beter', 200, 240, P(t, hit + 1.3, hit + 1.6), 16); }
  }
  end(ctx);
});

add('d12', 'Koffie van gisteren', 'Tijdreizen om koffie te redden werkt dus niet.', 6.5, (ctx, t, w, h) => {
  const spill = 1.3, back = 2.4, hit = 4.1;
  begin(ctx, w, h, { top: '#d8e6f2', bot: '#f4f8fb', gy: 500, gc: '#b9c4cf', sh: t > hit && t < hit + 0.5 ? shk(t, 5) : [0, 0] });
  if (t < back) {
    em(ctx, '🧑', 110, 440, 80);
    const k = P(t, 0.4, spill);
    em(ctx, '☕', 160 + 5 * k, 420 + E.in(k) * 60, 40, { r: k * 2.2 });
    if (t > spill) { circle(ctx, 165, 500, 20 + 14 * P(t, spill, spill + 0.3), '#6a3f1e', 0.9); em(ctx, '😱', 110, 400, 30); }
  }
  if (t >= back && t < hit) {
    const k = P(t, back, back + 0.6);
    ring(ctx, 110, 440, 100 * (1 - k), '#7a5cff', 6, k);
    em(ctx, '🧑', lerp(110, 150, 0), 440, 80, { a: 0 });
    const run = P(t, back + 0.5, hit);
    em(ctx, '🧑', lerp(-40, 135, E.in(run)), 440, 80);
    const c = P(t, back, hit);
    em(ctx, '☕', 160, 420 + E.in(P(t, 0, 1)) * 0 + (1 - clamp(c * 2)) * 0 + c * 0 + 0, 40, { a: 0 });
    em(ctx, '☕', 165, 360 + 40 * (c < 0.5 ? 0 : 0) + E.in(c) * 100, 40, { r: c * 2 });
    em(ctx, '🧑', 200, 440, 80, { fx: true });
  }
  if (t >= hit) {
    const k = P(t, hit, hit + 0.4);
    em(ctx, '🧑', 130 - k * 20, 440 + k * 15, 80, { r: -k * 0.8 });
    em(ctx, '🧑', 210 + k * 20, 440 + k * 15, 80, { fx: true, r: k * 0.8 });
    for (let i = 0; i < 12; i++) { const a = rnd(i) * Math.PI * 2; circle(ctx, 170 + Math.cos(a) * 90 * k, 400 - Math.abs(Math.sin(a)) * 100 * E.out(k) + k * k * 100, 6, '#6a3f1e', 1 - P(t, hit + 0.5, hit + 1)); }
    circle(ctx, 170, 505, 70 * E.out(P(t, hit + 0.2, hit + 1)), '#6a3f1e', 0.9);
    if (t > hit + 1.2) { bub(ctx, 'Dat was ik...', 100, 340, P(t, hit + 1.2, hit + 1.4), 14); bub(ctx, 'Nee, dat was IK', 255, 340, P(t, hit + 1.6, hit + 1.8), 14); }
  }
  end(ctx);
});

add('d13', 'Wat een grote ogen', 'De wolf kreeg meer dan een antwoord.', 7, (ctx, t, w, h) => {
  const bat = 4.4;
  begin(ctx, w, h, { top: '#e8c9a0', bot: '#f6e6cc', gy: 520, gc: '#9a6a3a', sh: t > bat + 0.2 && t < bat + 0.7 ? shk(t, 8) : [0, 0] });
  rect(ctx, 0, 0, w, 520, '#d9b88a', 0.4);
  rect(ctx, 40, 400, 280, 40, '#c33'); rect(ctx, 40, 420, 20, 100, '#6a3f1e'); rect(ctx, 300, 420, 20, 100, '#6a3f1e');
  const gone = t > bat + 0.15;
  const eye = 1 + 0.9 * E.out(P(t, 1.2, 1.8)), ear = 1 + 0.8 * E.out(P(t, 2.6, 3.2));
  if (!gone) {
    em(ctx, '🐺', 180, 370, 100);
    em(ctx, '👵', 180, 345, 1, { a: 0 });
    em(ctx, '👓', 180, 343, 40 * eye);
    em(ctx, '🛌', 180, 400, 1, { a: 0 });
    em(ctx, '👂', 140, 305, 22 * ear, { fx: true }); em(ctx, '👂', 220, 305, 22 * ear);
  } else {
    const k = P(t, bat + 0.15, bat + 1.3);
    em(ctx, '🐺', 180 + k * 300, 370 - arc(k, 100) - k * 160, 100, { r: k * 14 });
  }
  em(ctx, '👧', 60, 470, 70, { sy: 1 + 0.03 * Math.sin(t * 6) });
  if (t > 0.5 && t < 2.4) bub(ctx, 'Wat grote ogen!', 100, 300, P(t, 0.5, 0.8), 16);
  if (t > 2.4 && t < 3.8) bub(ctx, 'Wat grote oren!', 100, 300, P(t, 2.4, 2.7), 16);
  if (t > 3.6 && t < bat) { bub(ctx, 'Wat een grote...', 100, 300, P(t, 3.6, 3.9), 16); }
  const g = P(t, 3.9, bat);
  if (t > 3.9 && !gone) em(ctx, '👵', 300 - g * 40 + (1 - E.out(P(t, 3.9, 4.2))) * 60, 465, 80, { fx: true });
  if (t > 3.9 && t < bat + 0.4) em(ctx, '🏏', 250 - 80 * (t > bat ? E.out(P(t, bat, bat + 0.2)) : 0), 430, 50, { r: -0.6 + (t > bat ? 1.4 * E.out(P(t, bat, bat + 0.2)) : 0) });
  if (gone) { txt(ctx, 'KLONK', 180, 350, 34, '#ffd23f', 1 - P(t, bat + 0.8, bat + 1.2), '#a00'); em(ctx, '👵', 250, 465, 80, { fx: true }); bub(ctx, 'Voor de mand!', 250, 400, P(t, bat + 1.2, bat + 1.5), 14); }
  end(ctx);
});

add('d14', 'Het broodkruimelspoor', 'Het spoor was geslaagd. Alleen niet voor hen.', 7, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#2f4a2a', bot: '#7aa65a', gy: 520, gc: '#3c6a2e' });
  for (let i = 0; i < 4; i++) em(ctx, '🌲', 30 + i * 105 + (i % 2) * 20, 440, 140, { a: 0.9 });
  const kids = lerp(30, 290, P(t, 0, 3.5));
  const turn = t > 3.8;
  const crumbs = [];
  for (let i = 0; i < 9; i++) crumbs.push(30 + i * 30);
  const bird = turn ? lerp(kids - 10, kids - 50, 0) : lerp(-20, kids - 110, E.out(P(t, 0.3, 3.5)));
  const eaten = Math.max(0, Math.min(9, (bird + 20 - 30) / 30));
  crumbs.forEach((x, i) => { if (x < kids - 10 && i >= eaten - 0.0) circle(ctx, x, 528, 5, '#c98a3c'); });
  const belly = 1 + 0.9 * P(t, 2.0, 5.2);
  const bx = turn ? kids - 80 + (t > 5 ? 0 : 0) : bird;
  em(ctx, '🐦', bx, 515 + Math.abs(Math.sin(t * 10)) * (turn ? 0 : -6), 34 * belly, { sx: belly > 1.4 ? 1.15 : 1 });
  em(ctx, '👦', kids, 480, 56, { fx: turn });
  em(ctx, '👧', kids + 36, 480, 56, { fx: turn });
  if (turn) {
    const k = P(t, 3.8, 4.3);
    txt(ctx, '!', kids + 5, 420, 30, '#ffd23f', k);
    if (t > 4.6) em(ctx, '🎶', bx, 430 - Math.sin(t * 5) * 8, 28, { a: P(t, 4.6, 4.8) });
    if (t > 5.4) bub(ctx, 'Ik wist van niks', bx - 20, 440, P(t, 5.4, 5.7), 14);
  } else txt(ctx, '🍞', kids - 40, 535, 14, '#fff', 0.01);
  end(ctx);
});

add('d15', 'Snooze, Doornroosje', 'Honderd jaar slapen is nog te kort.', 6.5, (ctx, t, w, h) => {
  const kiss = 3.6;
  begin(ctx, w, h, { top: '#c9a8e8', bot: '#f0e2fa', gy: 520, gc: '#8a5a8a', sh: t > kiss + 0.3 && t < kiss + 0.6 ? shk(t, 6) : [0, 0] });
  rect(ctx, 60, 440, 240, 70, '#e8b4d0'); rect(ctx, 50, 410, 30, 110, '#a8648e'); rect(ctx, 60, 440, 240, 12, '#fff', 0.5);
  em(ctx, '😴', 150, 420, 56);
  const ring = [0.8, 1.7, 2.6];
  em(ctx, '⏰', 270, 380 + (ring.some((r) => t > r && t < r + 0.6) ? Math.sin(t * 60) * 3 : 0), 46);
  ring.forEach((r) => { if (t > r && t < r + 0.6) txt(ctx, 'RING!', 270, 340, 20, '#ff4d4d', 1, '#fff'); });
  const hit = ring.map((r) => P(t, r + 0.3, r + 0.4)).reduce((a, b) => a + b, 0);
  if (hit > 0 && t < 3) { const hk = ring.find((r) => t > r + 0.3 && t < r + 0.6); if (hk) line(ctx, 190, 380, 262, 380, '#e5b887', 8); }
  for (let i = 0; i < 3; i++) { const g = P(t, 1 + i * 0.5, 3.5); if (g > 0) em(ctx, '🌿', 70 + i * 90, 515 - g * 60, 30 + 30 * g); }
  for (let i = 0; i < 3; i++) em(ctx, 'Z', 190 + i * 14, 380 - ((t * 25 + i * 20) % 60), 20 + i * 4, { a: 0.8 });
  const px = lerp(-50, 90, E.out(P(t, 2.4, 3.4)));
  const sl = t > kiss + 0.15;
  if (!sl) em(ctx, '🤴', px, 470, 70 + 0);
  else {
    const k = P(t, kiss + 0.15, kiss + 1.1);
    em(ctx, '🤴', px - k * 220, 470 - arc(k, 80), 70, { r: -k * 9 });
    em(ctx, '💢', 140, 380, 34, { a: pulse(t, kiss + 0.15, kiss + 0.9) });
    txt(ctx, 'KLETS', 120, 360, 28, '#fff', 1 - P(t, kiss + 0.6, kiss + 1.1), '#a00');
    if (t > kiss + 1.5) bub(ctx, 'Nog 5 minuten...', 190, 340, P(t, kiss + 1.5, kiss + 1.8), 14);
  }
  if (t > 3 && t < kiss + 0.15) em(ctx, '💋', px + 40, 440, 30, { a: P(t, 3.1, 3.4) });
  end(ctx);
});

add('d16', 'Robotstofzuiger vs. ridder', 'Hij had alle draken gewonnen. Niet dit.', 6, (ctx, t, w, h) => {
  const hit = 2.9;
  begin(ctx, w, h, { top: '#cfc3b0', bot: '#efe7d8', gy: 480, gc: '#9a8a74', sh: t > hit && t < hit + 0.4 ? shk(t, 5) : [0, 0] });
  rect(ctx, 20, 120, 60, 360, '#8a8f99', 0.5); rect(ctx, 280, 100, 60, 380, '#8a8f99', 0.5);
  const rx = lerp(-40, 150, P(t, 0.3, hit - 0.1)) - (t > hit ? 0 : 0);
  const back = t > hit ? -20 * pulse(t, hit, hit + 0.5) : 0;
  const robx = rx + back;
  const roty = 505;
  ctx.save(); ctx.translate(robx, roty); ctx.fillStyle = '#d9dde3'; ctx.beginPath(); ctx.ellipse(0, 0, 36, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4a4f5a'; ctx.beginPath(); ctx.ellipse(0, -4, 28, 7, 0, 0, Math.PI * 2); ctx.fill(); circle(ctx, 16, -5, 3, t % 0.5 < 0.25 ? '#3f3' : '#161'); ctx.restore();
  const fall = P(t, hit, hit + 0.7);
  const kx = 190;
  if (t < hit) { em(ctx, '🤺', kx, 440, 90, { sy: 1 + 0.02 * Math.sin(t * 6) }); em(ctx, '🛡️', kx - 40, 450, 36, { a: 1 }); }
  else {
    em(ctx, '🤺', kx + 30 * fall, 440 + 40 * E.in(fall), 90, { r: fall * 1.5, sy: 1 });
    em(ctx, '🪖', kx + 60 + E.out(P(t, hit + 0.2, hit + 1.2)) * 90, 480 - arc(P(t, hit + 0.2, hit + 1), 40), 30, { r: t * 8 });
    if (t > hit + 0.6) { txt(ctx, '*KLANG*', kx, 360 - P(t, hit + 0.6, hit + 1.6) * 20, 26, '#fff', 1 - P(t, hit + 1.4, hit + 2), '#333'); }
  }
  if (t > hit + 1.5) { const rk = lerp(robx, 400, P(t, hit + 1.5, hit + 2.5)); }
  if (t > hit + 1.2) txt(ctx, 'bzzzz', robx + 40, 470, 16, '#556', P(t, hit + 1.2, hit + 1.5));
  end(ctx);
});

add('d17', 'Zelfscankassa', 'Onverwacht zwaard in de inpakruimte.', 7, (ctx, t, w, h) => {
  const alarm = 3.9;
  const red = t > alarm && t < 6.4;
  begin(ctx, w, h, { top: '#e6ecf2', bot: '#f8fafc', gy: 520, gc: '#b6bfca', sh: t > alarm && t < 4.8 ? shk(t, 2) : [0, 0] });
  rect(ctx, 180, 330, 150, 190, '#2c3a4a');
  rect(ctx, 192, 345, 126, 80, red && Math.floor(t * 6) % 2 ? '#ff3a3a' : red ? '#a02020' : '#6fdc8a');
  txt(ctx, red ? 'WACHT OP HULP' : t > 2 ? 'SCAN...' : 'WELKOM', 255, 385, red ? 14 : 18, '#fff');
  rect(ctx, 190, 445, 130, 12, '#1a222c');
  if (red) em(ctx, '🚨', 255, 300, 36);
  const kx = 90;
  em(ctx, '🤺', kx, 460, 92);
  const sw = P(t, 0.6, 1.8);
  const sx = lerp(kx + 40, 255, E.out(sw)), sy = lerp(440, 435 - arc(sw, 30), 1);
  if (t < 2.2) { em(ctx, '🗡️', sx, sy, 40, { r: 0.5 }); if (t > 1.8) txt(ctx, 'piep', 255, 420, 16, '#222', 1); }
  else {
    const hs = P(t, 2.4, 3.4);
    if (t < alarm + 0.1) { em(ctx, '🪖', lerp(kx, 255, E.out(hs)), 400 - arc(hs, 40), 34); if (hs >= 1) txt(ctx, 'piep', 255, 420, 16, '#222'); }
    em(ctx, '🗡️', 255, 440, 36, { r: 0.5, a: t < alarm ? 1 : 1 });
  }
  if (t < alarm + 0.1 && t > 3.3) txt(ctx, '?', 255, 300, 30, '#e33', 1);
  if (red) bub(ctx, 'Onverwacht item!', 130, 360, P(t, alarm, alarm + 0.3), 15);
  if (t > 5.2) {
    const k = P(t, 5.2, 6.4);
    em(ctx, '🤖', lerp(400, 240, E.out(k)), 485, 54, { fx: true });
    if (t > 5.9) em(ctx, '🤺', kx - E.in(P(t, 5.9, 6.4)) * 160, 460 - arc(P(t, 5.9, 6.4), 60), 92, { r: -P(t, 5.9, 6.4) * 7 });
  }
  end(ctx);
});

add('d18', 'Kraanmagneet', 'Alles zat vast aan de magneet. Behalve de ridder.', 6.5, (ctx, t, w, h) => {
  const catchT = 2.3;
  begin(ctx, w, h, { top: '#8fd0ff', bot: '#e9f6ff', gy: 520, gc: '#8c8c94' });
  rect(ctx, 20, 0, 12, 200, '#e8a93a'); rect(ctx, 20, 0, 330, 14, '#e8a93a');
  const mx = lerp(300, 180, E.io(P(t, 0, 1.2)));
  const down = P(t, 1.2, catchT) - P(t, 4.2, 5.2) * 1;
  const my = 40 + 340 * clamp(down);
  line(ctx, mx, 14, mx, my, '#222', 3);
  em(ctx, '🧲', mx, my + 12, 60);
  const kx = 180, ky = 470;
  const pull = P(t, catchT, catchT + 0.35);
  // ridder in onderbroek
  em(ctx, '🧍', kx, ky, 1, { a: 0 });
  const stayY = ky;
  em(ctx, '🥶', kx, stayY - 28, 40);
  rect(ctx, kx - 14, stayY - 6, 28, 18, '#ff6fa8');
  line(ctx, kx - 8, stayY + 12, kx - 8, stayY + 40, '#e5b887', 6); line(ctx, kx + 8, stayY + 12, kx + 8, stayY + 40, '#e5b887', 6);
  const lift = t > catchT ? E.in(P(t, catchT + 0.1, 4)) : 0;
  const ay = t > catchT ? lerp(ky - 36, my + 70, pull) - lift * 0 : ky - 36;
  const armY = t < catchT ? ky - 36 : lerp(ky - 36, my + 66, pull);
  const armX = t < catchT ? kx : lerp(kx, mx, pull);
  if (t < catchT + 0.4 || true) {
    const ax = t < catchT ? kx : lerp(kx, mx, pull), aY = t < catchT ? ky - 25 : lerp(ky - 25, my + 70, pull) ;
    em(ctx, '🛡️', ax + 0, aY, 70, { r: Math.sin(t * 40) * (t > catchT && pull < 1 ? 0.2 : 0) });
    em(ctx, '🪖', ax, aY - 38, 36);
  }
  if (t > catchT + 0.4) { sparks(ctx, mx, my + 30, P(t, catchT + 0.3, catchT + 0.8), 8, 40, '#fff'); }
  if (t > 4.0) bub(ctx, 'Mijn harnas!', 250, 410, P(t, 4, 4.3), 16);
  if (t > 3) { const up = P(t, 3.0, 4.2); }
  end(ctx);
});

add('d19', 'Navigatie voor ridders', 'Over 200 meter: keer om. Daarna: waterval.', 7, (ctx, t, w, h) => {
  const splash = 5.3;
  begin(ctx, w, h, { top: '#9fd9ff', bot: '#e9f7ff', gy: 430, gc: '#6bbf59', sh: t > splash && t < splash + 0.5 ? shk(t, 6) : [0, 0] });
  rect(ctx, 0, 430, 220, 210, '#6bbf59'); rect(ctx, 220, 440, 140, 200, '#3aa0e0');
  ctx.fillStyle = '#6bbf59'; ctx.fillRect(220, 430, 0, 0);
  rect(ctx, 0, 170, 360, 4, '#fff', 0.0);
  rect(ctx, 24, 60, 120, 60, '#222'); rect(ctx, 28, 64, 112, 52, '#2a62c8');
  line(ctx, 40, 100, 70, 80, '#fff', 4); line(ctx, 70, 80, 120, 100, '#fff', 4);
  const phase = t < 2.0 ? 0 : t < 3.5 ? 1 : 2;
  let kx, fx = false;
  if (t < 2.0) kx = lerp(-40, 180, E.lin(P(t, 0, 2.0)));
  else if (t < 3.5) { kx = lerp(180, 20, E.io(P(t, 2.0, 3.5))); fx = true; }
  else if (t < 4.7) { kx = lerp(20, 190, P(t, 3.5, 4.7)); fx = false; }
  else kx = 190 + 0;
  let ky = 405;
  if (t > 4.7) { const k = P(t, 4.7, splash); kx = lerp(190, 270, k); ky = 405 + E.in(k) * 75; }
  if (t > splash) ky = 480 + 6 * Math.sin(t * 6);
  shadow(ctx, kx, 432, 40, t > 4.7 ? 0 : 0.25);
  em(ctx, '🏇', kx, ky, 80, { fx: !fx, r: t > 4.7 && t < splash ? P(t, 4.7, splash) * 0.8 : 0 });
  if (t > splash) { sparks(ctx, kx, 450, P(t, splash, splash + 0.8), 14, 90, '#bfe6ff'); for (let i = 0; i < 3; i++) ring(ctx, kx, 484, 20 + 30 * P(t, splash + i * 0.15, splash + 1.2 + i * 0.15), '#fff', 3, 1 - P(t, splash, splash + 1.5)); }
  const say = t < 1.0 ? '' : t < 2.0 ? 'Keer om!' : t < 3.5 ? 'Bij de bocht: keer om' : t < 4.7 ? 'Herberekenen...' : '';
  if (say) bub(ctx, say, 80, 150, 1, 14);
  if (t > splash + 0.4) bub(ctx, 'Je bent er', 210, 360, P(t, splash + 0.4, splash + 0.7), 16);
  end(ctx);
});

add('d20', 'Konijn wint', 'Dit was niet het voorgenomen eindshow-nummer.', 6.5, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#2b1a46', bot: '#5a3a82', gy: 500, gc: '#3a2a5a' });
  rect(ctx, 0, 0, w, h, '#ffd0ff', 0.0);
  for (let i = 0; i < 12; i++) circle(ctx, rnd(i) * w, 40 + rnd(i + 3) * 300, 3, '#ffe27a', 0.5 + 0.5 * Math.sin(t * 4 + i));
  rect(ctx, 100, 480, 160, 70, '#6a3f1e'); rect(ctx, 90, 470, 180, 14, '#8a5a2a');
  const ex = 1.8;
  const hatK = E.out(P(t, 0.3, 1));
  em(ctx, '🎩', 180, 445, 100);
  em(ctx, '🧙‍♂️', 70, 450, 84);
  if (t < ex) { em(ctx, '🐇', 180, 395 - 15 * P(t, 1.0, 1.7), 50, { sy: 1, a: P(t, 0.6, 1.0) }); }
  else {
    const jump = P(t, ex, ex + 0.5);
    em(ctx, '🐇', 180 - 60 * E.out(P(t, ex, ex + 0.8)), 395 - arc(jump, 40), 50);
    const wand = P(t, 2.8, 3.4);
    em(ctx, '🪄', 140 + 0 * wand, 405, 28, { r: -0.6 });
    if (t > 3.2 && t < 3.9) { line(ctx, 130, 400, lerp(130, 70, P(t, 3.2, 3.6)), 440, '#ff7bd9', 8); }
    sparks(ctx, 70, 440, P(t, 3.5, 4.3), 14, 70, '#ff7bd9');
    if (t < 3.5) em(ctx, '🧙‍♂️', 70, 450, 1, { a: 0 });
  }
  if (t >= 3.5) { }
  // wizard erase+carrot overlay
  if (t >= 3.5) { ctx.save(); ctx.fillStyle = '#4c2e72'; ctx.fillRect(10, 395, 120, 100); ctx.restore(); em(ctx, '🥕', 70, 460 + 0, 80 - 20 * P(t, 4.6, 6), { r: 0.5 }); }
  if (t > 5) { const k = P(t, 5, 5.6); em(ctx, '🐇', 110, 460, 60); if (k > 0) sparks(ctx, 80, 460, k, 6, 30, '#ff9a3d'); txt(ctx, 'NOM', 90, 410, 24, '#ff9a3d', pulse(t, 5.2, 6.2), '#000'); }
  end(ctx);
});

add('d21', 'File op de bezemsteel', 'Eén tikje en iedereen heeft haast.', 6.5, (ctx, t, w, h) => {
  const bump = 2.2;
  begin(ctx, w, h, { top: '#3a2a6a', bot: '#e8a26a', gy: 600, gc: '#2a2040' });
  circle(ctx, 280, 200, 50, '#fff0b0'); stars(ctx, t, 18, w, 150);
  for (let i = 0; i < 5; i++) {
    const baseX = 20 + i * 66;
    const k = P(t, bump + i * 0.2, bump + i * 0.2 + 0.4);
    const push = lerp(0, 22, k) - lerp(0, 22, P(t, bump + i * 0.2 + 0.6, bump + i * 0.2 + 1.2));
    const fly = t > 4.4 ? E.in(P(t, 4.4 + i * 0.2, 5.5 + i * 0.2)) * 480 : 0;
    const y = 360 + Math.sin(t * 2 + i) * 4;
    const x = baseX + push + (t < 1 ? (1 - E.out(P(t, 0, 1))) * 400 : 0) + fly;
    line(ctx, x - 30, y + 22, x + 36, y + 22, '#8a5a2a', 5);
    line(ctx, x - 50, y + 20, x - 30, y + 18, '#e8c35a', 7);
    em(ctx, '🧙‍♀️', x, y, 52, { fx: false, r: Math.sin(t * 10 + i) * 0.08 * (k > 0 && k < 1 ? 1 : 0) });
    if (t > 0.9 && t < 4.4) circle(ctx, x - 60, y + 22, 5, '#ff3a3a', 0.6 + 0.4 * Math.sin(t * 8));
    if (k > 0.1 && k < 0.9) txt(ctx, 'TOET', x, y - 50, 18, '#ffd23f', 1, '#222');
  }
  if (t > 3.0 && t < 4.4) bub(ctx, 'Hoe lang nog?!', 180, 260, P(t, 3.0, 3.2), 16);
  if (t > 4.0) { const k = P(t, 4.0, 4.4); em(ctx, '🐦', 330 - E.in(P(t, 4.0, 6)) * 400, 300, 28, { a: k }); }
  if (t > 5.8) txt(ctx, 'Sorry, ik was te vroeg', 180, 540, 18, '#fff', P(t, 5.8, 6.1));
  end(ctx);
});

add('d22', 'Marshmallow-ramp', 'De draak bedoelde het goed. Dat zeggen ze allemaal.', 7, (ctx, t, w, h) => {
  const blast = 3.3;
  begin(ctx, w, h, { top: '#14203c', bot: '#2c3a60', gy: 480, gc: '#2a3a28' });
  stars(ctx, t, 28, w, 280);
  em(ctx, '🪵', 150, 485, 50); em(ctx, '🔥', 150, 450, 36 + 4 * Math.sin(t * 12));
  circle(ctx, 150, 450, 90, '#ff9a3d', 0.15);
  const burn = pulse(t, blast, blast + 1.3);
  const kx = 80;
  em(ctx, '🤺', kx, 440, 76);
  line(ctx, kx + 20, 450, 135, 435, '#7a5a2a', 3);
  const gold = t > 5.4;
  if (t < blast + 0.4) em(ctx, '🍡', 138, 433, 18);
  if (t >= 5.4) em(ctx, '🍡', 138, 433, 18);
  const dx = lerp(420, 275, E.out(P(t, 1.2, 2.5)));
  em(ctx, '🐉', dx, 400, 130, { fx: false });
  if (t > blast - 0.3 && t < blast + 1.8) { const f = P(t, blast - 0.3, blast + 0.2); for (let i = 0; i < 5; i++) em(ctx, '🔥', dx - 60 - i * 30 * f, 420 - Math.sin(t * 20 + i) * 8, 50 + i * 8, { a: 1 - P(t, blast + 1.2, blast + 1.8) }); }
  flash(ctx, w, h, 0.8 * burn, '#ffb347');
  if (t > blast + 0.9 && t < 5.0) { circle(ctx, kx, 440, 38, '#111', 0.0); em(ctx, '🤺', kx, 440, 76); rect(ctx, kx - 28, 408, 56, 60, '#000', 0.55); em(ctx, '💨', kx + 20, 395 - (t - blast) * 6, 30, { a: 0.7 }); }
  if (t > 4.9) { bub(ctx, 'Hier, een lekkere!', 262, 330, P(t, 4.9, 5.2), 14); }
  if (t > 5.4) em(ctx, '🍡', lerp(262, 140, E.out(P(t, 5.4, 6.0))), 400 - arc(P(t, 5.4, 6), 30), 28);
  if (t > 6.2) em(ctx, '😑', kx, 395, 30, { a: P(t, 6.2, 6.4) });
  end(ctx);
});

add('d23', 'Muur van beton', 'Hij doet het al 300 jaar zo. Dit was nieuw.', 6.5, (ctx, t, w, h) => {
  const hit = 3.4;
  begin(ctx, w, h, { top: '#201a38', bot: '#3d3466', gy: 540, gc: '#1a1630', sh: t > hit && t < hit + 0.5 ? shk(t, 6) : [0, 0] });
  stars(ctx, t, 20, w, 200);
  const walls = [{ x: 100, c: '#8a5a2a', n: 'hout' }, { x: 190, c: '#a85a48', n: 'baksteen' }, { x: 280, c: '#6a7080', n: 'beton' }];
  walls.forEach((wl, i) => { rect(ctx, wl.x, 220, 28, 320, wl.c); for (let y = 220; y < 540; y += 24) rect(ctx, wl.x, y, 28, 2, 'rgba(0,0,0,0.3)'); });
  txt(ctx, '🚫', 294, 190, 44, '#fff', 1);
  em(ctx, '👻', 294, 190, 1, { a: 0 });
  const gx = t < 0.2 ? 10 : t < hit ? lerp(10, 262, P(t, 0.2, hit)) : 262;
  const slow1 = [0, 0, 0];
  let x = gx;
  const ghostY = 380;
  const stretch = t > hit ? 0.55 : 1;
  const sq = t > hit ? 1 - 0.5 * E.out(P(t, hit, hit + 0.15)) + 0.5 * 0 : 1;
  const slide = t > hit + 0.3 ? E.in(P(t, hit + 0.3, hit + 1.3)) * 140 : 0;
  em(ctx, '👻', x - (t > hit ? 0 : 0), ghostY + slide, 80, { sx: t > hit ? 0.5 : 1, sy: t > hit ? 1.1 : 1, a: 0.9 });
  if (t > hit) { sparks(ctx, 262, ghostY, P(t, hit, hit + 0.6), 8, 40, '#fff'); txt(ctx, 'BONK', 230, 330, 30, '#ffd23f', 1 - P(t, hit + 0.6, hit + 1.2), '#000'); }
  if (t > hit + 1.5) bub(ctx, 'Nieuwbouw...', 140, 280, P(t, hit + 1.5, hit + 1.8), 16);
  if (t > hit + 1.2) em(ctx, '💫', 250, 510 + 0, 30, { a: 1 });
  end(ctx);
});

add('d24', 'Zonnebrand voor vampiers', 'Factor 5000. Hij ging toch wel.', 7, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#5ab4ff', bot: '#d8f0ff', gy: 470, gc: '#f1d58a' });
  em(ctx, '☀️', 290, 90, 110 + 6 * Math.sin(t * 3));
  for (let i = 0; i < 8; i++) line(ctx, 290, 90, 290 - 260 * Math.cos(0.5 + i * 0.12), 90 + 340, 'rgba(255,240,150,0.25)', 6);
  rect(ctx, 0, 470, w, 170, '#f1d58a'); rect(ctx, 0, 500, w, 140, '#3aa0e0', 0.5 * P(t, 4.5, 5));
  const shade = 120;
  rect(ctx, 0, 0, shade, 470, 'rgba(10,0,30,0.45)');
  txt(ctx, 'Schaduw', 60, 40, 16, '#fff', 0.8);
  let vx = lerp(40, 200, E.io(P(t, 0.4, 1.4)));
  if (t > 1.4 && t < 2.6) vx = 200 - P(t, 1.8, 2.6) * 150;
  if (t >= 2.6) vx = 50 + 0;
  const sun = vx > shade;
  em(ctx, '🧛', vx, 410, 84, { sx: 1 });
  if (t > 0.9 && t < 1.9) { for (let i = 0; i < 5; i++) em(ctx, '💨', vx + (i - 2) * 14, 360 - ((t * 60 + i * 20) % 50), 24, { a: 0.8 }); txt(ctx, 'SSSS', vx, 330, 20, '#f55', 1, '#fff'); }
  if (t >= 2.8) {
    const s = P(t, 2.8, 3.5);
    em(ctx, '🧴', 60 + 0, 330 - 10 * s, 40, { r: -0.6 * s });
    if (t > 3.3) em(ctx, '🕶️', vx + 0, 400, 40, { a: P(t, 3.3, 3.5) });
    const go = P(t, 3.8, 4.8);
    if (t > 3.8) { /* walk to sun */ }
  }
  if (t >= 3.8) {
    ctx.save(); ctx.fillStyle = '#5ab4ff'; ctx.restore();
    const wx = lerp(50, 230, E.out(P(t, 3.8, 4.8)));
    rect(ctx, 0, 380, 135, 100, 'rgba(0,0,0,0)'); 
    em(ctx, '🧛', wx, 410, 84, { a: 1 });
    if (t > 4.8) { em(ctx, '⛱️', wx + 40, 380, 80); em(ctx, '🏝️', 0, 0, 1, { a: 0 }); em(ctx, '😎', wx - 5, 410, 24, { a: P(t, 4.8, 5) }); }
    if (t > 5.2) bub(ctx, 'Beetje bruin?', wx - 20, 320, P(t, 5.2, 5.5), 14);
  }
  end(ctx);
});

add('d25', 'Glazen muil', 'De prins zocht een voet. Nu heeft hij er een te veel.', 7, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#f6d4ee', bot: '#fff1fa', gy: 470, gc: '#c88aa8' });
  rect(ctx, 0, 470, w, 170, '#d9a0c0');
  const feet = [{ s: 40, x: 90 }, { s: 70, x: 90 }, { s: 50, x: 90 }, { s: 140, x: 90 }];
  const idx = Math.min(3, Math.floor(t / 1.6));
  const lt = t - idx * 1.6;
  const f = feet[idx];
  em(ctx, '🤴', 270, 400, 80, { fx: true });
  em(ctx, '🦶', f.x, 460 + (f.s > 100 ? -f.s * 0.25 + 40 : 0), f.s, { sy: 1 + 0.03 * Math.sin(t * 8) });
  const sc = idx === 0 ? 0.6 : idx === 1 ? 1.4 : idx === 2 ? 0.7 : 1;
  const slide = E.out(P(lt, 0.1, 0.8));
  const shoeS = idx < 3 ? 56 * (idx === 0 ? 1.2 : idx === 1 ? 0.6 : 1) : 56 + 150 * E.out(P(lt, 0.9, 1.4));
  em(ctx, '👠', lerp(240, f.x + 0, slide), 430 - (idx === 3 ? 22 : 0), shoeS, { r: -0.2 });
  const msg = ['Te groot', 'Te klein', 'Te... grappig', 'PAST!'][idx];
  if (lt > 0.9) bub(ctx, msg, 190, 330, P(lt, 0.9, 1.1), 18);
  if (idx === 3 && lt > 1.0) { sparks(ctx, 90, 430, P(lt, 1.0, 1.8), 12, 90, '#fff'); em(ctx, '😵', 270, 355, 34, { a: P(lt, 1.2, 1.5) }); }
  if (idx === 3 && t > 5.2) txt(ctx, 'Stretch!', 90, 300, 22, '#b04a8a', P(t, 5.2, 5.4));
  end(ctx);
});

add('d26', 'Bonenstaak', 'Er was nooit een reuzen. Alleen een slechte buurman.', 7, (ctx, t, w, h) => {
  const sneeze = 5.1;
  const grow = E.out(P(t, 0.8, 3.0));
  begin(ctx, w, h, { top: '#7fc8ff', bot: '#d8f2ff', gy: 560, gc: '#6bbf59', z: 1 + 0.08 * pulse(t, sneeze - 0.2, sneeze + 0.4) });
  em(ctx, '☁️', 80, 70, 120); em(ctx, '☁️', 270, 100, 100);
  if (t < 0.8) { circle(ctx, 120, 555, 5, '#7a5a2a'); em(ctx, '🫘', 120, 553, 14); }
  // staak
  ctx.save(); ctx.strokeStyle = '#2f9e44'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(120, 560);
  const top = 560 - grow * 470;
  for (let y = 560; y > top; y -= 10) ctx.lineTo(120 + Math.sin(y * 0.05) * 18, y);
  ctx.stroke(); ctx.restore();
  for (let i = 0; i < 6; i++) { const y = 540 - i * 70; if (y > top) em(ctx, '🍃', 120 + (i % 2 ? 26 : -26), y, 26, { r: i % 2 ? 0.6 : -0.6 }); }
  const kp = P(t, 3.0, 4.8);
  const kyy = lerp(540, 110, kp);
  const jx = 120 + Math.sin(kyy * 0.05) * 18;
  if (t > 3.0 && t < sneeze + 0.05) em(ctx, '🧒', jx, kyy, 40, { sx: 1 });
  em(ctx, '🏠', 250, 520, 80);
  if (t > 4.2) {
    const g = E.back(P(t, 4.2, 4.9));
    em(ctx, '🧌', 250, lerp(-60, 120, g) + 0, 110);
    if (t > 4.7 && t < sneeze) bub(ctx, 'Fee-fi-fo-ha...', 180, 200, P(t, 4.7, 4.9), 14);
  }
  if (t >= sneeze) {
    const k = P(t, sneeze, sneeze + 1.4);
    txt(ctx, 'HATSJOE!', 200, 190, 28, '#ffd23f', 1 - P(t, sneeze + 0.8, sneeze + 1.4), '#a00');
    em(ctx, '🧒', jx - k * 300, 110 - arc(k, -100) + k * 450 * k, 40, { r: -k * 12 });
    for (let i = 0; i < 6; i++) circle(ctx, 240 - k * 160 - i * 8, 140 + rnd(i) * 30 + k * 40, 4, '#9cd8ff', 1 - k);
  }
  end(ctx);
});

add('d27', 'Parkeerbon voor de held', 'Superkracht, maar geen vergunning.', 6, (ctx, t, w, h) => {
  const tk = 3.2;
  begin(ctx, w, h, { top: '#7ec8f8', bot: '#d8efff', gy: 500, gc: '#5a5f6a', sh: t > tk && t < tk + 0.4 ? shk(t, 4) : [0, 0] });
  rect(ctx, 0, 500, w, 6, '#ffd23f');
  em(ctx, '🏙️', 260, 400, 150, { a: 0.4 });
  const lift = E.out(P(t, 0.6, 1.8));
  const trem = t > 1.8 && t < tk ? Math.sin(t * 40) * 1.5 : 0;
  const carY = lerp(460, 190, lift);
  em(ctx, '🚗', 180 + trem, carY, 100);
  em(ctx, '🦸', 180, 470, 100, { sy: 1 - 0.08 * lift });
  line(ctx, 150, 440, 150, carY + 20, '#e5b887', 10); line(ctx, 210, 440, 210, carY + 20, '#e5b887', 10);
  if (t > 1.6 && t < tk) sparks(ctx, 180, 300, P(t, 1.6, 3.2) % 1, 8, 40, '#fff', 4);
  txt(ctx, 'Wow!', 60, 250, 22, '#fff', P(t, 1.7, 2.0) * (t < tk ? 1 : 0), '#333');
  if (t > 2.0 && t < tk) em(ctx, '🚶', 330 - E.out(P(t, 2.0, 3.0)) * 60, 475, 64, { fx: true });
  if (t >= tk) {
    const k = E.back(P(t, tk, tk + 0.3));
    em(ctx, '🧾', lerp(300, 190, k), carY - 20, 46, { r: 0.3 });
    em(ctx, '🚶', 270, 475, 64, { fx: true });
    txt(ctx, 'PLAK', 250, carY - 70, 26, '#ffd23f', 1 - P(t, tk + 0.6, tk + 1), '#a00');
    if (t > tk + 0.8) bub(ctx, 'Hier mag je niet staan', 240, 330, P(t, tk + 0.8, tk + 1.1), 14);
    if (t > tk + 1.6) { em(ctx, '😐', 180, 415, 28, { a: P(t, tk + 1.6, tk + 1.8) }); }
    const drop = P(t, tk + 1.9, tk + 2.4);
    if (drop > 0) em(ctx, '🚗', 180, lerp(carY, 460, E.in(drop)), 100, { a: 0 });
  }
  end(ctx);
});

add('d28', 'Update bij de apocalyps', 'De wereldwijde doemmachine installeert eerst even 14 updates.', 7, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#130a20', bot: '#4a1a4a', gy: 520, gc: '#241633' });
  rect(ctx, 40, 150, 280, 220, '#2c2c3c'); rect(ctx, 52, 162, 256, 140, '#101018');
  const cd = Math.max(0, 3 - Math.floor(t));
  if (t < 3) txt(ctx, String(cd), 180, 232, 80, '#ff3a3a', 1);
  else {
    txt(ctx, 'UPDATE', 180, 202, 26, '#7ac8ff', 1);
    txt(ctx, 'Even geduld...', 180, 232, 16, '#ccc', 1);
    rect(ctx, 80, 260, 200, 18, '#222');
    rect(ctx, 80, 260, 200 * lerp(0, 0.98, E.out(P(t, 3, 5.0))) , 18, '#4ac8ff');
    txt(ctx, Math.floor(98 * E.out(P(t, 3, 5.0))) + '%', 180, 290, 14, '#fff');
    if (t > 5.2) txt(ctx, '1 van 14', 180, 320, 14, '#ccc');
  }
  em(ctx, '🦹', 90, 450, 80, { sy: 1 + 0.02 * Math.sin(t * 5) });
  em(ctx, '🦸', 270, 455 + (t > 4 ? 6 : 0), 80, { fx: true, r: t > 4 ? 0.1 : 0 });
  if (t > 3.5) { for (let i = 0; i < 3; i++) em(ctx, 'Z', 292 + i * 12, 405 - ((t * 20 + i * 12) % 36), 16 + i * 4, { a: 0.8 }); }
  if (t > 0.3 && t < 2.8) bub(ctx, 'Mwahaha, nu valt de wereld!', 130, 110, 1, 12);
  if (t > 3.4 && t < 6) bub(ctx, 'Wacht... nee...', 100, 400, P(t, 3.4, 3.7), 14);
  if (t > 3 && t < 3.15) flash(ctx, w, h, 0.5, '#f33');
  if (t > 6) { const sh = shk(t, 4); txt(ctx, 'Opnieuw opstarten', 180, 580, 20, '#fff', P(t, 6, 6.3)); }
  end(ctx);
});

add('d29', 'Telefooncel-pech', 'De verkleedplek had een winkelpassage nodig.', 6.5, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#98d4ff', bot: '#e6f5ff', gy: 500, gc: '#7a7a86' });
  rect(ctx, 0, 500, w, 140, '#9a9aa6');
  const cell = (x) => { rect(ctx, x - 40, 330, 80, 170, '#d33', 0.9); rect(ctx, x - 32, 340, 64, 140, '#aee4ff', 0.6); rect(ctx, x - 42, 322, 84, 12, '#a22'); };
  const spin = P(t, 1.0, 2.6);
  const cx = 130;
  if (t < 2.7) { ctx.save(); ctx.translate(cx, 0); ctx.scale(1 + 0.15 * Math.sin(spin * 40) * spin * (1 - spin), 1); ctx.translate(-cx, 0); cell(cx); ctx.restore(); }
  else cell(cx);
  if (t < 1.0) { const wx = lerp(-40, cx, E.out(P(t, 0, 0.9))); em(ctx, '🧔', wx, 440, 60); }
  if (t >= 1.0 && t < 2.6) { em(ctx, '💫', cx, 400, 30 + 10 * Math.sin(t * 20)); for (let i = 0; i < 6; i++) em(ctx, '✨', cx + Math.cos(t * 12 + i) * 30, 420 + Math.sin(t * 12 + i) * 40, 14); }
  flash(ctx, w, h, 0.8 * pulse(t, 2.5, 2.9));
  if (t >= 2.7) {
    const o = E.back(P(t, 2.7, 3.1));
    const px = lerp(cx, 260, E.out(P(t, 2.8, 3.8)));
    em(ctx, '🧔', px, 440, 60);
    line(ctx, px - 14, 424, px - 14 - 30, 424 + 12 * Math.sin(t * 6), '#e33', 10);
    rect(ctx, px - 14, 460, 28, 18, '#ffffff');
    line(ctx, px - 8, 478, px - 8, 498, '#e5b887', 6); line(ctx, px + 8, 478, px + 8, 498, '#e5b887', 6);
    if (t > 3.9) {
      for (let i = 0; i < 3; i++) em(ctx, '🚶', 340 + i * 30 - E.out(P(t, 3.9, 4.6)) * 60, 450, 40, { fx: true, a: 0.9 });
      bub(ctx, 'Is dat ondergoed?', 170, 340, P(t, 4.0, 4.3), 14);
      em(ctx, '😳', px, 410, 26, { a: P(t, 4.3, 4.6) });
    }
    if (t > 5.2) { const k = P(t, 5.2, 5.8); em(ctx, '☎️', cx, 400, 40, { a: k }); bub(ctx, 'Hallo?', cx, 340, k, 14); }
  }
  end(ctx);
});

add('d30', 'Dinerroof', 'Wie gaat er nu pizza halen, vroeg niemand.', 6.5, (ctx, t, w, h) => {
  const grab = 3.2;
  begin(ctx, w, h, { top: '#f6d38a', bot: '#ffeccc', gy: 520, gc: '#7aa65a' });
  em(ctx, '🏠', 280, 440, 140);
  rect(ctx, 240, 430, 40, 30, '#ffe58a'); rect(ctx, 240, 430, 40, 30, 'rgba(255,230,120,0.4)');
  em(ctx, '🍽️', 262, 445, 28);
  em(ctx, '🍕', 262, 440 - (t > grab && t < grab + 1 ? 0 : 0) , t < grab + 0.4 ? 22 : 0);
  em(ctx, '🦕', 70, 480, 100);
  const ext = t < 1 ? 0 : t < grab ? E.io(P(t, 1, grab)) : 1 - E.io(P(t, grab + 0.5, grab + 1.8));
  const tx = 85 + ext * 165, ty = 430 - ext * 15 + Math.sin(t * 5) * 3 * ext;
  ctx.save(); ctx.strokeStyle = '#4c9a5a'; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(95, 440);
  ctx.quadraticCurveTo(lerp(110, 170, ext), lerp(330, 360, ext) - 30 * ext, tx, ty); ctx.stroke(); ctx.restore();
  em(ctx, '🦕', tx, ty, 1, { a: 0 });
  circle(ctx, tx, ty, 18, '#4c9a5a'); circle(ctx, tx + 5, ty - 4, 3, '#000');
  if (t > grab && t < grab + 1.8) em(ctx, '🍕', tx + 16, ty, 22);
  if (t > grab - 0.2 && t < grab + 0.4) txt(ctx, 'HAP', tx, ty - 40, 22, '#fff', 1, '#a00');
  if (t > 1.0 && t < grab) bub(ctx, 'Hmm, pizza...', 140, 300, P(t, 1.0, 1.3), 14);
  if (t > grab + 0.2) {
    em(ctx, '😮', 280, 400, 1, { a: 0 });
    em(ctx, '🧑', 270, 395, 40, { a: P(t, grab + 0.2, grab + 0.5), fx: true });
    bub(ctx, 'Mijn pizza!!', 250, 340, P(t, grab + 0.3, grab + 0.6), 14);
  }
  if (t > grab + 1.8) { em(ctx, '😋', 70, 430, 28, { a: P(t, grab + 1.8, grab + 2.0) }); }
  if (t > 5.4) em(ctx, '🍕', 90, 440, 18, { a: 0 });
  end(ctx);
});

add('d31', 'Dino-trampoline', 'Omhoog ging zonder problemen. Terug minder.', 7.5, (ctx, t, w, h) => {
  const land = 5.7;
  const up = t >= 3.0 && t < land;
  const camY = up ? 0 : 0;
  let space = 0;
  if (t >= 3.2 && t < 5.7) space = pulse(t, 3.2, 5.7);
  begin(ctx, w, h, { top: space > 0.6 ? '#0b0b2a' : '#8fd3ff', bot: space > 0.6 ? '#2a2a6a' : '#e6f7ff', gy: 520, gc: '#6bbf59', sh: t > land && t < land + 0.8 ? shk(t, 10 * (1 - P(t, land, land + 0.8))) : [0, 0] });
  if (space > 0.4) { stars(ctx, t, 40, w, 600); em(ctx, '🌕', 290, 100 + (1 - space) * 80, 60); }
  const jumpNo = t < 1.0 ? 0 : t < 2.0 ? 1 : t < 3.0 ? 2 : 3;
  let ty = 460, sq = 1;
  const rise = 520 - 0;
  if (t < 3.0) { const k = (t % 1); const hgt = t < 1 ? 0 : t < 2 ? 70 : 150; ty = 420 - arc(k, hgt); sq = k < 0.15 ? 0.8 : 1; }
  else if (t < land) {
    const k = P(t, 3.0, land);
    ty = 420 - arc(k, 1) * 0 - (1 - Math.pow(2 * k - 1, 2)) * 1000 * 0.9 + (k > 0.5 ? 0 : 0);
    ty = lerp(420, 420, 0) - (1 - Math.pow(2 * k - 1, 2)) * 700;
  } else ty = 440;
  ty = ty > 600 ? 600 : ty;
  const tramSink = t < 3.0 ? (t % 1 < 0.15 || t % 1 > 0.9 ? 12 : 0) : (t >= land ? 30 * (1 - E.out(P(t, land, land + 0.3))) + 10 : 0);
  const tramY = 505 + tramSink;
  const camOff = t >= 3.2 && t < land ? Math.min(0, -(420 - ty) * 0.6) : 0;
  ctx.save(); ctx.translate(0, t >= land ? 0 : -camOff * 0);
  if (!(t > land + 0.2 && t < land + 4 && false)) {
    rect(ctx, 90, tramY, 180, 12, '#2a2f44'); line(ctx, 100, tramY + 12, 100, 540, '#444', 4); line(ctx, 260, tramY + 12, 260, 540, '#444', 4);
    if (t > land + 0.2) { line(ctx, 90, tramY + 8, 270, tramY + 8, '#222', 3); txt(ctx, 'TSJOEF', 180, 470, 22, '#fff', 1 - P(t, land + 0.3, land + 1), '#a00'); }
  }
  ctx.restore();
  const showDino = ty < 700;
  if (t < 3.0 || t >= land) em(ctx, '🦖', 180, t < 3.0 ? ty : 440 + 0, 100, { sy: sq });
  else {
    const dy = clamp(ty, 40 - (space > 0 ? 0 : 0), 700);
    const screenY = lerp(ty + 700, 330, 1) * 0 + (ty < 0 ? 40 + (ty + 700) * 0.0 : ty);
    const k = P(t, 3.0, land);
    const dY = 420 - (1 - Math.pow(2 * k - 1, 2)) * 380;
    em(ctx, '🦖', 180, dY, 100 - 40 * (1 - Math.abs(2 * k - 1)) * 0.0, { r: Math.sin(t * 3) * 0.2 });
    if (k > 0.5 && k < 0.95) { em(ctx, '🔥', 180, dY - 60, 60, { a: P(k, 0.5, 0.7) }); }
    if (k > 0.3 && k < 0.6) txt(ctx, 'Hallo maan!', 180, dY + 60, 18, '#fff');
  }
  if (t > land + 0.3) { em(ctx, '😵', 180, 440, 28, { a: P(t, land + 0.3, land + 0.6) }); dust(ctx, 180, 520, P(t, land, land + 1.4), 10); }
  end(ctx);
});

add('d32', 'Het ei', 'Evolutie is soms ook gewoon grap.', 6, (ctx, t, w, h) => {
  const hatch = 3.2;
  begin(ctx, w, h, { top: '#e6d9a8', bot: '#fff6d8', gy: 500, gc: '#b89a5a' });
  em(ctx, '🌋', 290, 380, 200, { a: 0.35 });
  em(ctx, '🦖', 100, 440, 150, { fx: false });
  const wob = t > 1 && t < hatch ? Math.sin(t * 25) * 0.15 * P(t, 1, hatch) : 0;
  if (t < hatch) em(ctx, '🥚', 220, 480, 56, { r: wob });
  else {
    em(ctx, '🥚', 220, 490, 1, { a: 0 });
    em(ctx, '🐣', 220, 480, 36, { a: 0 });
    em(ctx, '🐔', 220, 475 - 6 * Math.abs(Math.sin(t * 8)), 64 * E.back(P(t, hatch, hatch + 0.4)));
    for (let i = 0; i < 6; i++) { const k = P(t, hatch, hatch + 0.8); circle(ctx, 220 + (rnd(i) - 0.5) * 100 * k, 480 - arc(k, 40 + rnd(i) * 40), 5, '#fff8e6', 1 - k); }
    if (t > hatch + 0.6) txt(ctx, 'KOKKELOERIKOE', 220, 400, 18, '#d94a2a', P(t, hatch + 0.6, hatch + 0.8) * (1 - P(t, 5.2, 5.6)), '#fff');
    if (t > hatch + 1.4) {
      em(ctx, '😳', 100, 360, 30, { a: P(t, hatch + 1.4, hatch + 1.6) });
      txt(ctx, '?', 100, 320 - 8 * Math.sin(t * 6), 40, '#222', P(t, hatch + 1.4, hatch + 1.6));
    }
  }
  if (t < hatch) { if (t > 1.2) for (let i = 0; i < 3; i++) line(ctx, 205 + i * 15, 465, 210 + i * 15, 480, '#7a5a2a', 2, P(t, 1.2 + i * 0.5, 2 + i * 0.5)); }
  if (t > 5.0) { const k = P(t, 5.0, 5.5); em(ctx, '☄️', 330, 60 + (1 - k) * 0, 24, { a: 0 }); }
  end(ctx);
});

add('d33', 'Piramide uit de doos', 'Er bleef nog één schroefje over.', 7.5, (ctx, t, w, h) => {
  const fall = 5.0;
  begin(ctx, w, h, { top: '#ffd78a', bot: '#ffeec0', gy: 500, gc: '#e8c27a', sh: t > fall + 0.6 && t < fall + 1.4 ? shk(t, 6) : [0, 0] });
  circle(ctx, 70, 90, 40, '#fff2a8', 1);
  const tiers = 5;
  const b = (i) => P(t, 1.2 + i * 0.5, 1.9 + i * 0.5);
  const col = '#d9a24a';
  for (let i = 0; i < tiers; i++) {
    const k = b(i);
    const f = P(t, fall + 0.1 + i * 0.12, fall + 0.8 + i * 0.12);
    const bw = 200 - i * 36, y = 470 - i * 34;
    if (k > 0) {
      const dy = (1 - E.bounce(k)) * -120 * (t < fall ? 1 : 0);
      ctx.save(); ctx.globalAlpha = 1 - f; ctx.translate(180 + (f > 0 ? (i - 2) * f * 90 : 0), y + dy + f * 160); ctx.rotate(f * (i % 2 ? 1 : -1) * 1.2);
      ctx.fillStyle = i % 2 ? col : '#c28f3a'; ctx.fillRect(-bw / 2, -16, bw, 32); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-bw / 2, 12, bw, 4); ctx.restore();
    }
  }
  em(ctx, '🧑‍🔧', 55, 460, 70);
  em(ctx, '📖', 40, 520, 30, { r: 0.3 });
  const hammer = t > 1.2 && t < 4.0 ? Math.sin(t * 10) * 0.5 : 0;
  em(ctx, '🔨', 90, 430, 30, { r: hammer });
  if (t > 4.0 && t < fall) { em(ctx, '🔩', 295, 440 + (t > 4.3 ? 0 : 0), 20 + 0); txt(ctx, '?', 55, 400, 30, '#a00', 1); em(ctx, '😬', 55, 410, 1, { a: 0 }); }
  if (t > 4.4 && t < fall) { const k = P(t, 4.4, fall); em(ctx, '🔩', lerp(55, 180, k), 280 + 0 - arc(k, 40) + k * 130, 20, { r: k * 20 }); }
  if (t > fall + 0.4) { dust(ctx, 180, 500, P(t, fall + 0.5, fall + 1.6), 12); dust(ctx, 130, 500, P(t, fall + 0.7, fall + 1.8), 8); }
  if (t > fall + 0.7) { bub(ctx, 'Overal staat nog 1 over', 215, 330, P(t, fall + 0.7, fall + 1.0), 14); em(ctx, '🙂', 55, 405, 24, { a: P(t, fall + 0.7, fall + 1) }); }
  end(ctx);
});

add('d34', 'Het wiel', 'Uitvinder rent. Uitvinding rent harder, en komt terug.', 7, (ctx, t, w, h) => {
  const hit = 4.5;
  begin(ctx, w, h, { top: '#f0c28a', bot: '#ffe8c4', gy: 500, gc: '#b58a54', sh: t > hit && t < hit + 0.5 ? shk(t, 5) : [0, 0] });
  em(ctx, '🌋', 70, 380, 120, { a: 0.35 });
  const wheelX = t < 1.0 ? 140 : t < 3.0 ? lerp(140, 440, E.in(P(t, 1.0, 3.0))) : t < hit - 0.6 ? 440 : lerp(-80, 180, E.in(P(t, hit - 0.6, hit)));
  const roll = wheelX * 0.05;
  const wy = 460;
  const kx = t < 1 ? 70 : t < 3 ? lerp(70, 330, E.in(P(t, 1.5, 3.5))) : 330;
  const sq = t >= hit;
  if (!sq) {
    ctx.save(); ctx.translate(wheelX, wy); ctx.rotate(roll * 8);
    ctx.fillStyle = '#8a5a2a'; ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c28f3a'; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 4); ctx.fillStyle = '#8a5a2a'; ctx.fillRect(-3, -30, 6, 60); }
    ctx.restore();
  }
  if (t < 1.0) { em(ctx, '🦣', 0, 0, 1, { a: 0 }); em(ctx, '🧔', 70, 450, 70); bub(ctx, 'Ik heb... iets rond!', 140, 360, P(t, 0.2, 0.5), 14); }
  else if (t < hit) { const px = t < 3.5 ? lerp(70, 330, E.in(P(t, 1.5, 3.5))) : 330; em(ctx, '🧔', Math.min(px, 330), 450, 70, { fx: false }); if (t > 3) txt(ctx, '...', 330, 400, 20, '#222', P(t, 3, 3.3)); }
  if (t > hit) { const k = P(t, hit, hit + 0.15); em(ctx, '🧔', 330, 450 + 25 * k, 70, { sy: 1 - 0.7 * k, sx: 1 + 0.7 * k }); txt(ctx, 'BATS', 300, 380, 30, '#fff', 1 - P(t, hit + 0.5, hit + 1.1), '#a00'); ring(ctx, 300, 470, 70 * P(t, hit, hit + 0.8), '#fff', 3, 1 - P(t, hit, hit + 0.8)); }
  if (t > hit) { const wx = 330 + P(t, hit, hit + 1.5) * 220; ctx.save(); ctx.translate(wx, wy); ctx.rotate(wx * 0.08); ctx.fillStyle = '#8a5a2a'; ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#c28f3a'; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  if (t > hit + 1.6) bub(ctx, 'Rond is dus gevaarlijk', 180, 330, P(t, hit + 1.6, hit + 1.9), 14);
  end(ctx);
});

add('d35', 'Waarschuwing uit de toekomst', 'Tijdreiziger waarschuwt iedereen. Behalve zichzelf.', 7, (ctx, t, w, h) => {
  const arrive = 1.6, slip = 4.6;
  begin(ctx, w, h, { top: '#8ed0ff', bot: '#e8f6ff', gy: 500, gc: '#8a8f99', sh: t > slip && t < slip + 0.4 ? shk(t, 6) : [0, 0] });
  em(ctx, '🍌', 220, 495, 40);
  const wk = lerp(-40, 160, P(t, 0, 3.0));
  const turned = t > 3.0;
  const px = t < 3.0 ? wk : 160 - E.out(P(t, 3.0, 3.8)) * 10;
  em(ctx, '🚶', px, 450, 66, { fx: false });
  if (t < 3.0) em(ctx, '🎧', px - 2, 420, 22);
  const tx = 280;
  if (t > arrive - 0.2) {
    const k = P(t, arrive - 0.2, arrive + 0.2);
    ring(ctx, tx, 440, 80 * (1 - k) + 10, '#7a5cff', 6, k * (1 - P(t, arrive + 0.2, arrive + 0.8)));
    flash(ctx, w, h, 0.7 * pulse(t, arrive - 0.2, arrive + 0.3));
  }
  if (t > arrive && t < slip) {
    const sx2 = lerp(tx, 235, E.out(P(t, 3.2, 4.4)));
    em(ctx, '🧑‍🚀', sx2, 440, 66, { fx: true });
    const k = P(t, arrive + 0.2, arrive + 0.5);
    rect(ctx, 105 + (tx - 105 - (sx2 > 0 ? tx - sx2 : 0)) * 0, 520, 0, 0, '#fff');
    ctx.save(); ctx.translate(sx2 - 40, 380); ctx.rotate(-0.05 + 0.05 * Math.sin(t * 8)); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#222'; ctx.lineWidth = 3; ctx.fillRect(-48, -22, 96, 44); ctx.strokeRect(-48, -22, 96, 44); ctx.restore();
    txt(ctx, 'STOP! BANAAN!', sx2 - 40, 380, 11, '#d00', k);
    if (t > 3.0 && t < 3.9) em(ctx, '😮', px, 420, 24);
  }
  if (t >= slip) {
    const k = P(t, slip, slip + 0.9);
    em(ctx, '🧑‍🚀', lerp(235, 150, k), 440 - arc(k, 70), 66, { fx: true, r: -k * 6.28 + 0 });
    if (k >= 1) { em(ctx, '🧑‍🚀', 150, 490, 66, { r: 1.57, fx: true }); }
    txt(ctx, 'AU!', 190, 320, 28, '#ff5252', P(t, slip + 0.5, slip + 0.6), '#fff');
    em(ctx, '🚶', 160 - 50 * E.out(P(t, slip, slip + 1)), 450, 66, { fx: true });
    bub(ctx, 'Dat zag ik niet...', 240, 300, P(t, slip + 0.9, slip + 1.2), 14);
  }
  end(ctx);
});

add('d36', 'Wens: één pizza', 'Hij zei niet hoe groot. Of hoeveel.', 6.5, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#6a3fb8', bot: '#e8a0d8', gy: 520, gc: '#e8c27a' });
  stars(ctx, t, 20, w, 300);
  const gk = E.back(P(t, 0.3, 1.3));
  em(ctx, '🪔', 90, 480, 54);
  if (t > 0.3) { em(ctx, '💨', 95, 440, 40, { a: 0.7 * (1 - P(t, 1.3, 2.0)) }); em(ctx, '🧞', 100, lerp(470, 350, gk), 100 * gk); }
  em(ctx, '🧔', 270, 470, 70);
  if (t > 1.5 && t < 2.8) bub(ctx, 'Een pizza graag', 240, 380, P(t, 1.5, 1.8), 14);
  if (t > 2.8 && t < 3.6) bub(ctx, 'Groot? Tuurlijk', 100, 270, P(t, 2.8, 3.1), 14);
  if (t > 3.2) {
    const k = t - 3.2;
    for (let i = 0; i < 22; i++) {
      const st = i * 0.14;
      const f = k - st;
      if (f > 0) {
        const x = 20 + rnd(i) * 320, size = 50 + rnd(i + 8) * 90;
        const y = -80 + E.in(clamp(f / 0.8)) * (520 - i * 4 - rnd(i + 3) * 40);
        em(ctx, '🍕', x, Math.min(y, 500 - size * 0.3), size, { r: rnd(i + 1) * 3 });
      }
    }
  }
  const buried = P(t, 4.8, 5.4);
  if (t < 4.6) em(ctx, '🧔', 270, 470, 1, { a: 0 });
  if (t > 4.6) txt(ctx, '*mm!*', 180, 560, 24, '#a00', P(t, 4.8, 5.0), '#fff');
  if (t > 5.4) bub(ctx, 'Nu wil ik drinken', 180, 90, P(t, 5.4, 5.7), 14);
  end(ctx);
});

add('d37', 'Groeidrank', 'Het huis zit hem als een muts.', 7, (ctx, t, w, h) => {
  const gr = P(t, 1.6, 4.0);
  const s = 1 + 3.2 * E.out(gr);
  const roofOff = E.in(P(t, 2.0, 3.0)) * 200;
  begin(ctx, w, h, { top: '#9ad8ff', bot: '#eaf7ff', gy: 520, gc: '#6bbf59', sh: t > 1.6 && t < 3.0 ? shk(t, 2 + 4 * gr) : [0, 0] });
  em(ctx, '☁️', 60, 90, 90, { a: 0.9 });
  const hx = 180;
  rect(ctx, hx - 80, 440, 160, 80, '#d9a56a'); rect(ctx, hx - 70, 460, 30, 40, '#a8d8ff'); rect(ctx, hx + 40, 460, 30, 40, '#a8d8ff');
  if (t < 3.0) {
    ctx.save(); ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(hx - 100, 440 + 0); ctx.lineTo(hx, 360); ctx.lineTo(hx + 100, 440); ctx.fill(); ctx.restore();
  }
  const roofY = t < 3.0 ? 0 : E.in(P(t, 3.0, 4.0)) * 0;
  const mx = 60 + 60 * 0;
  if (t < 1.2) { em(ctx, '🧙', mx + 70, 485, 60); em(ctx, '🧪', mx + 110, 470, 24, { r: -0.5 * P(t, 0.4, 1.0) }); if (t > 0.4) txt(ctx, 'glub', mx + 110, 440, 16, '#9be564', P(t, 0.8, 1.1)); }
  const wizTop = 440 - 90 * s + 60;
  if (t >= 1.2) {
    ctx.save(); ctx.translate(hx, 520); ctx.scale(s, s); ctx.translate(-hx, -520);
    em(ctx, '🧙', hx, 485, 60);
    ctx.restore();
  }
  if (t >= 3.0) {
    const k = P(t, 3.0, 4.8);
    ctx.save(); ctx.translate(hx, 520 - 0); ctx.rotate(0.15 * Math.sin(k * 3)); ctx.translate(-hx, -520);
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(hx - 100, 440 - 220 * k); ctx.lineTo(hx, 360 - 220 * k); ctx.lineTo(hx + 100, 440 - 220 * k); ctx.fill();
    ctx.restore();
  }
  if (t > 4.4) bub(ctx, 'Past nét niet', 180, 180, P(t, 4.4, 4.7), 14);
  if (t > 5.4) em(ctx, '🎩', 180, 120 + (1 - E.bounce(P(t, 5.4, 6.3))) * -80 + 0, 1, { a: 0 });
  if (t > 3.0 && t < 3.6) sparks(ctx, hx, 440, P(t, 3.0, 3.6), 14, 120, '#ffd23f');
  end(ctx);
});

add('d38', 'Haakhand op kinderfeestje', 'De piraat heeft dit zichzelf aangedaan.', 6.5, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#ffd0e8', bot: '#fff0f8', gy: 500, gc: '#d9a07a' });
  rect(ctx, 0, 500, w, 140, '#c98a64');
  const cols = ['#ff4d6d', '#ffd23f', '#4dd2ff', '#7cff6b', '#c77dff'];
  const popAt = [1.6, 2.4, 3.2, 3.9, 4.5];
  for (let i = 0; i < 5; i++) {
    const bx = 70 + i * 55 + Math.sin(t * 1.5 + i) * 6, by = 220 + (i % 2) * 40 + Math.sin(t * 2 + i) * 8;
    if (t < popAt[i]) { circle(ctx, bx, by, 24, cols[i]); line(ctx, bx, by + 24, bx + Math.sin(t + i) * 4, by + 90, '#666', 1); circle(ctx, bx - 8, by - 8, 6, '#fff', 0.5); }
    else { sparks(ctx, bx, by, P(t, popAt[i], popAt[i] + 0.4), 8, 40, cols[i]); txt(ctx, 'POP', bx, by - 30, 16, '#222', pulse(t, popAt[i], popAt[i] + 0.5)); }
  }
  em(ctx, '🧔', 80, 440, 84);
  em(ctx, '🏴‍☠️', 80, 395, 30, { a: 0.0 });
  const reach = (i) => t > popAt[i] - 0.5 && t < popAt[i] + 0.3;
  let hx = 120, hy = 440;
  for (let i = 0; i < 5; i++) if (t > popAt[i] - 0.6 && t < popAt[i] + 0.2) { const k = P(t, popAt[i] - 0.6, popAt[i]); hx = lerp(120, 70 + i * 55, E.io(k)); hy = lerp(440, 235 + (i % 2) * 40, E.io(k)); }
  line(ctx, 100, 450, hx, hy, '#e5b887', 9);
  ctx.save(); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(hx, hy - 6, 9, 0.5, Math.PI * 1.7); ctx.stroke(); ctx.restore();
  em(ctx, '🦜', 130, 400, 28);
  const kidsX = [130, 190, 250, 310];
  kidsX.forEach((x, i) => {
    const sad = t > popAt[2];
    em(ctx, '🧒', x, 485 + 0, 44, { sy: 1 + 0.03 * Math.sin(t * 5 + i) });
    if (sad) em(ctx, i % 2 ? '😢' : '😭', x, 455, 22, { a: P(t, popAt[2], popAt[2] + 0.4) });
  });
  if (t > 5.0) bub(ctx, 'Oeps', 90, 370, P(t, 5.0, 5.3), 16);
  if (t > 5.4) em(ctx, '🎂', 270, 470, 1, { a: 0 });
  end(ctx);
});

add('d39', 'Troll bij zonsopgang', 'Hij zou het dansje nooit meer doen. Er is nu bewijs.', 7, (ctx, t, w, h) => {
  const sun = P(t, 0.2, 3.6);
  const stone = P(t, 3.6, 4.4);
  begin(ctx, w, h, { top: stone > 0 ? '#ffb27a' : lerp(0, 1, sun) > 0.5 ? '#ff9a6a' : '#2a1d4a', bot: '#ffe0a0', gy: 480, gc: '#3a4a2a' });
  rect(ctx, 0, 0, w, h, '#0b0b30', 1 - sun);
  if (sun < 0.6) stars(ctx, t, 25, w, 250);
  circle(ctx, 280, lerp(560, 260, E.out(sun)), 52, '#fff2a0'); circle(ctx, 280, lerp(560, 260, E.out(sun)), 76, '#ffd27a', 0.3);
  hill(ctx, w, 460, '#2f3a24', 20);
  const dance = t < 3.6;
  const wob = dance ? Math.sin(t * 9) : Math.sin(3.6 * 9);
  ctx.save();
  ctx.translate(150, 410);
  ctx.rotate(wob * 0.25);
  ctx.scale(1 + (dance ? 0.05 * Math.cos(t * 18) : 0), 1 - (dance ? 0.05 * Math.cos(t * 18) : 0));
  em(ctx, '🧌', 0, 0, 110);
  if (stone > 0) { ctx.globalAlpha = stone * 0.85; ctx.fillStyle = '#8a8a90'; ctx.beginPath(); ctx.ellipse(0, 0, 44, 52, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = stone; ctx.font = '110px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = 0.5 * stone; ctx.fillText('🪨', 0, 0); }
  ctx.restore();
  if (dance) for (let i = 0; i < 3; i++) em(ctx, '🎵', 60 + i * 60 + Math.sin(t * 4 + i) * 10, 330 - ((t * 30 + i * 20) % 50), 22, { a: 0.8 });
  if (t > 3.4 && t < 4.4) em(ctx, '☀️', 150, 330, 40 * pulse(t, 3.4, 4.4));
  if (t > 4.6) {
    const k = E.in(P(t, 4.6, 5.3));
    em(ctx, '🐦', lerp(380, 150, E.out(P(t, 4.6, 5.0))), 260 - 20 * Math.sin(t * 10), 30);
    if (t > 5.2) { circle(ctx, 152, 300 + P(t, 5.2, 5.6) * 90 - 0, 5, '#fff', 1 - P(t, 5.7, 6)); txt(ctx, 'plop', 180, 360, 16, '#222', P(t, 5.5, 5.8)); }
    if (t > 5.8) bub(ctx, '...', 150, 290, P(t, 5.8, 6.1), 18);
  }
  end(ctx);
});

add('d40', 'Toverstaf, 2%', 'Vergeten op te laden. Spreuk geeft alsnog licht. Uit.', 7, (ctx, t, w, h) => {
  const blackout = 4.9;
  const dark = t > blackout ? 1 : 0;
  begin(ctx, w, h, { top: '#3a2a6a', bot: '#7a5aa8', gy: 500, gc: '#2a2040' });
  em(ctx, '🏰', 280, 400, 160, { a: 0.6 });
  const wx = 90;
  em(ctx, '🧙', wx, 440, 90);
  rect(ctx, 250, 470, 20, 30, '#ddd'); rect(ctx, 254, 478, 4, 8, '#333'); rect(ctx, 262, 478, 4, 8, '#333');
  const plugged = t > 3.0;
  const wy = 400;
  const wandCol = t < 1.2 ? '#ffd23f' : '#888';
  em(ctx, '🪄', wx + 40, wy, 40, { r: -0.7 + (t < 1.2 ? Math.sin(t * 10) * 0.2 : 0) });
  if (t < 1.0) { const k = P(t, 0.3, 1.0); em(ctx, '🔥', lerp(wx + 60, 220, k), 400, 36 + 40 * k, { a: 1 - P(t, 0.9, 1.0) }); }
  if (t > 1.2 && t < 3.0) { em(ctx, '🪫', wx + 70, 360, 36 + 4 * Math.sin(t * 14)); bub(ctx, '2%...', wx, 330, P(t, 1.3, 1.6), 14); txt(ctx, 'pffft', wx + 80, 410, 14, '#ccc', P(t, 1.4, 1.7)); }
  const cableEnd = plugged ? 258 : lerp(wx + 50, 258, P(t, 2.0, 3.0));
  const cy = plugged ? 480 : lerp(410, 480, P(t, 2.0, 3.0));
  if (t > 1.8) { ctx.save(); ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx + 44, wy + 4); ctx.quadraticCurveTo((wx + cableEnd) / 2, cy + 40, cableEnd, cy); ctx.stroke(); ctx.restore(); }
  if (plugged && t < blackout) {
    em(ctx, '🔋', wx + 70, 360, 30, { a: 1 });
    rect(ctx, wx + 56, 372, 28 * P(t, 3.0, 4.2), 5, '#5f5');
    if (t > 4.2 && t < blackout) { const k = P(t, 4.2, blackout); em(ctx, '⚡', wx + 100 + k * 100, 400 - Math.sin(k * 20) * 6, 50 + 60 * k); }
  }
  if (t > blackout - 0.2) { rect(ctx, -60, -60, w + 120, h + 120, '#000', 0.96); }
  if (t > blackout) {
    const k = P(t, blackout, blackout + 0.3);
    circle(ctx, wx + 40, wy, 30 + 20 * Math.sin(t * 20), '#ffe27a', 0.3 + 0.1 * Math.sin(t * 20));
    em(ctx, '🪄', wx + 40, wy, 40, { r: -0.7 });
    txt(ctx, 'zzzt...', 180, 280, 22, '#aaa', P(t, blackout + 0.4, blackout + 0.7));
    em(ctx, '😬', wx, 440, 40, { a: 0.9 * P(t, blackout + 0.9, blackout + 1.2) });
    bub(ctx, 'Wie heeft de stoppen...', 180, 200, P(t, blackout + 1.2, blackout + 1.5), 12);
  }
  end(ctx);
});

export const CLIPS = CLIPS_ARR;
