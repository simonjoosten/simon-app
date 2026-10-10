// Gamescroller clips E (e01..e40) - pure draw(ctx, t, w, h), w=360 h=640
const TAU = Math.PI * 2;
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
};
const shk = (t, a) => [a * Math.sin(t * 91), a * Math.cos(t * 77)];
const arc = (k, hh) => 4 * hh * k * (1 - k);

function begin(ctx, w, h, o = {}) {
  const sh = o.sh || [0, 0];
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.translate(sh[0], sh[1]);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, o.top || '#8fd3ff');
  g.addColorStop(1, o.bot || '#e6f7ff');
  ctx.fillStyle = g;
  ctx.fillRect(-30, -30, w + 60, h + 60);
  if (o.gy != null) {
    ctx.fillStyle = o.gc || '#6bbf59';
    ctx.fillRect(-30, o.gy, w + 60, h - o.gy + 30);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(-30, o.gy, w + 60, 4);
  }
}
function end(ctx) { ctx.restore(); }
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
function txt(ctx, s, x, y, size = 24, col = '#fff', a = 1, r = 0) {
  ctx.save();
  ctx.globalAlpha = clamp(a);
  ctx.translate(x, y);
  if (r) ctx.rotate(r);
  ctx.font = 'bold ' + size + 'px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(2, size / 6);
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineJoin = 'round';
  ctx.strokeText(s, 0, 0);
  ctx.fillStyle = col;
  ctx.fillText(s, 0, 0);
  ctx.restore();
}
function shadow(ctx, x, y, r, a = 0.25) {
  ctx.save(); ctx.globalAlpha = clamp(a); ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(1, r), Math.max(1, r * 0.25), 0, 0, TAU); ctx.fill(); ctx.restore();
}
function circle(ctx, x, y, r, col, a = 1) {
  ctx.save(); ctx.globalAlpha = clamp(a); ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); ctx.fill(); ctx.restore();
}
function line(ctx, x1, y1, x2, y2, col, lw = 3) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}
function rect(ctx, x, y, ww, hh, col, a = 1, r = 0) {
  ctx.save(); ctx.globalAlpha = clamp(a); ctx.fillStyle = col;
  if (r > 0) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + ww - r, y); ctx.quadraticCurveTo(x + ww, y, x + ww, y + r);
    ctx.lineTo(x + ww, y + hh - r); ctx.quadraticCurveTo(x + ww, y + hh, x + ww - r, y + hh);
    ctx.lineTo(x + r, y + hh); ctx.quadraticCurveTo(x, y + hh, x, y + hh - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath(); ctx.fill();
  } else ctx.fillRect(x, y, ww, hh);
  ctx.restore();
}
function flash(ctx, w, h, a, col = '#fff') { rect(ctx, -30, -30, w + 60, h + 60, col, a); }
function spin(ctx, x, y, r, t, col = '#fff') {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y, r, t * 7, t * 7 + 4.2); ctx.stroke(); ctx.restore();
}
// partikels: n deeltjes vanaf (x0,y0) die op tijd t0 starten
function parts(ctx, t, t0, x0, y0, n, o = {}) {
  const u = t - t0;
  const life = o.life || 1.2;
  if (u < 0 || u > life) return;
  const a0 = o.a0 == null ? 0 : o.a0, a1 = o.a1 == null ? TAU : o.a1, sd = o.seed || 0;
  for (let i = 0; i < n; i++) {
    const ang = a0 + rnd(i + sd) * (a1 - a0);
    const sp = (o.v || 200) * (0.35 + rnd(i * 3 + sd + 1));
    const x = x0 + Math.cos(ang) * sp * u;
    const y = y0 + Math.sin(ang) * sp * u + 0.5 * (o.g == null ? 400 : o.g) * u * u;
    const a = 1 - u / life;
    if (o.ch) em(ctx, o.ch, x, y, o.size || 24, { a, r: u * (rnd(i + 9) - 0.5) * 12 });
    else if (o.rect) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(u * (rnd(i + 5) - 0.5) * 14);
      rect(ctx, -o.size / 2, -o.size / 3, o.size, o.size * 0.66, o.cols ? o.cols[i % o.cols.length] : (o.col || '#fff'), a);
      ctx.restore();
    } else circle(ctx, x, y, (o.size || 5) * (0.5 + rnd(i + 2)), o.cols ? o.cols[i % o.cols.length] : (o.col || '#fff'), a);
  }
}
const C = [];
export const CLIPS = C;
const add = (id, title, caption, dur, fn) => C.push({ id, title, caption, dur, draw(ctx, t, w, h) { fn(ctx, t % dur, w, h); } });

// ---------- TECHNIEK EN GAMEN ----------
add('e01', 'Lag', 'Zijn computer was er nog niet.', 6, (ctx, t, w, h) => {
  let x;
  if (t < 2) x = 30 + (t / 2) * 140;
  else if (t < 4) x = 170;
  else if (t < 4.25) x = lerp(170, 30, P(t, 4, 4.25));
  else x = lerp(30, 292, E.in(P(t, 4.25, 4.9)));
  const hit = t > 4.9;
  begin(ctx, w, h, { top: '#bde6ff', bot: '#eaf8ff', gy: 470, gc: '#7bc86c', sh: hit && t < 5.4 ? shk(t, 7) : [0, 0] });
  em(ctx, '🌵', 330, 440, 64);
  em(ctx, '🐢', lerp(-40, 420, P(t, 2, 4.4)), 452, 38);
  shadow(ctx, x, 478, 28);
  if (hit) {
    const k = P(t, 4.9, 5.8);
    em(ctx, '🏃', 292 - k * 40, 430 - arc(k, 40), 64, { fx: true, r: -k * 5 });
    txt(ctx, 'AU!', 250, 360 - k * 20, 30, '#ff5252', 1 - P(t, 5.4, 5.9));
  } else em(ctx, '🏃', x, 430, 64, { fx: true });
  if (t >= 2 && t < 4) {
    spin(ctx, x, 360, 16, t, '#555');
    txt(ctx, 'LAG', 180, 180 + Math.sin(t * 30) * 3, 54, '#ff5252');
    txt(ctx, 'ping 2400 ms', 180, 230, 22, '#fff');
  }
  end(ctx);
});

add('e02', 'Eén streepje', 'De router stond al die tijd beneden.', 6, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#cfe6ff', bot: '#f4fbff', gy: 480, gc: '#c9a979' });
  const ang = E.in(P(t, 3, 3.9)) * 0.9;
  const bx = 90, by = 480;
  const d = lerp(40, 285, E.io(P(t, 0.3, 3)));
  ctx.save(); ctx.translate(bx, by); ctx.rotate(ang);
  line(ctx, -20, 0, -20, -310, '#8d5a2b', 7); line(ctx, 20, 0, 20, -310, '#8d5a2b', 7);
  for (let i = 1; i < 8; i++) line(ctx, -20, -i * 40, 20, -i * 40, '#8d5a2b', 5);
  ctx.restore();
  let px, py, pr = 0;
  if (t < 3.9) { px = bx + Math.sin(ang) * d; py = by - Math.cos(ang) * d - 30; pr = ang; }
  else {
    const k = P(t, 3.9, 4.8);
    const sx = bx + Math.sin(0.9) * 285, sy = by - Math.cos(0.9) * 285 - 30;
    px = lerp(sx, 262, k); py = lerp(sy, 452, E.bounce(k)); pr = lerp(0.9, 1.57, k);
  }
  em(ctx, '📡', 296, 450, 44);
  em(ctx, '🧍', px, py, 60, { r: pr });
  em(ctx, '📱', px + 22, py - 28, 22, { r: pr });
  const bars = t < 3.9 ? (d > 270 ? 1 : 0) : (t > 4.6 ? 4 : 0);
  rect(ctx, 14, 14, 112, 54, 'rgba(0,0,0,0.55)', 1, 10);
  for (let i = 0; i < 4; i++) rect(ctx, 28 + i * 20, 56 - (i + 1) * 9, 13, (i + 1) * 9, i < bars ? '#4cff7a' : '#777', 1, 2);
  if (t > 4.6) txt(ctx, 'Verbonden!', 180, 110, 28, '#2e9e4f');
  if (t > 3.9 && t < 4.6) txt(ctx, 'AAAH', 250, 200, 28, '#ff5252');
  end(ctx);
});

add('e03', '99 procent', 'Nog heel even geduld.', 7, (ctx, t, w, h) => {
  const rs = t > 5.6;
  begin(ctx, w, h, { top: '#1e3f8a', bot: '#2a5cc0', sh: rs && t < 6 ? shk(t, 8) : [0, 0] });
  let p = rs ? 0 : Math.min(99, E.out(P(t, 0, 4.2)) * 99);
  if (t >= 4.2 && t < 5.6) p = 99;
  txt(ctx, rs ? 'Update 1 van 214' : 'Updates installeren...', 180, 200, 24);
  rect(ctx, 40, 260, 280, 26, 'rgba(255,255,255,0.25)', 1, 13);
  rect(ctx, 40, 260, 280 * (rs ? 0.003 : p / 100), 26, '#7ff0a0', 1, 13);
  txt(ctx, Math.floor(p) + '%', 180, 320, 40);
  spin(ctx, 180, 400, 22, t);
  const face = t < 3 ? '🙂' : t < 4.6 ? '😐' : t < 5.6 ? '😡' : '😭';
  em(ctx, face, 180, 530, 72, { sx: 1 + (t > 4.6 && t < 5.6 ? Math.sin(t * 40) * 0.04 : 0) });
  if (t > 3 && t < 5.6) txt(ctx, 'Zzz'.slice(0, 1 + Math.floor(t * 3) % 3), 240, 490, 24);
  if (t > 5.6) txt(ctx, 'Zet de computer niet uit', 180, 140, 18, '#ffd24a');
  end(ctx);
});

add('e04', 'Game over', 'Continue? Negen seconden over.', 6.5, (ctx, t, w, h) => {
  const over = t > 2.2;
  begin(ctx, w, h, { top: '#10113a', bot: '#2b2f77', sh: t > 2.2 && t < 2.6 ? shk(t, 9) : [0, 0] });
  rect(ctx, -30, 440, 190, 220, '#6a4a2a'); rect(ctx, 250, 440, 140, 220, '#6a4a2a');
  rect(ctx, -30, 440, 190, 12, '#58d05a'); rect(ctx, 250, 440, 140, 12, '#58d05a');
  let x, y;
  if (t < 2.2) {
    x = lerp(30, 215, P(t, 0, 2.2)); y = 405 - arc(P(t, 1.2, 2.2), 70) + (t > 1.9 ? (t - 1.9) * 90 : 0);
  } else { x = 215; y = 405; }
  if (t < 3.3) {
    const fall = t > 2.0 ? Math.pow(t - 2.0, 2) * 400 : 0;
    em(ctx, '🏃', x, y + fall, 56, { fx: true, r: fall > 0 ? (t - 2) * 3 : 0, a: 1 - P(t, 2.6, 3.3) });
  } else if (t > 5.4) {
    const k = E.back(P(t, 5.4, 6.0));
    em(ctx, '🏃', 40 + k * 10, 405, 56, { fx: true, sy: k });
  }
  if (over) {
    rect(ctx, -30, -30, w + 60, h + 60, '#000', 0.55 * P(t, 2.2, 2.6));
    txt(ctx, 'GAME OVER', 180, 200, 44, '#ff4d4d', P(t, 2.2, 2.5));
    if (t < 5.4) {
      const n = Math.max(0, 9 - Math.floor((t - 3) / 0.25 * 0.5));
      txt(ctx, 'CONTINUE?', 180, 290, 26, '#fff', P(t, 2.8, 3));
      txt(ctx, String(Math.max(0, 9 - Math.floor((t - 3) * 2.6))), 180, 360, 80, '#ffd24a', P(t, 2.8, 3));
    } else txt(ctx, 'JA!', 180, 300, 50, '#7ff0a0');
  }
  end(ctx);
});

add('e05', 'Noob', 'Eerste level, eerste schade.', 6, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#9ad0f5', bot: '#dff3ff', gy: 470, gc: '#74b856' });
  const swing = P(t, 1.0, 2.0);
  const wob = t > 2.0 ? Math.sin(t * 40) * 0.12 : 0;
  shadow(ctx, 110, 478, 34); shadow(ctx, 270, 478, 20);
  em(ctx, '🐀', 270, 450, 44, { fx: true });
  if (t > 2.6) em(ctx, '😂', 270, 400 - Math.sin(t * 14) * 3, 28);
  const hop = t > 2.0 && t < 4.4 ? Math.abs(Math.sin(t * 7)) * 30 : 0;
  em(ctx, '🤺', 110, 440 - hop, 70, { r: wob });
  // zwaard-boog
  if (t < 2.2) {
    const a = lerp(-2.4, 2.0, E.io(swing));
    ctx.save(); ctx.translate(110, 430); ctx.rotate(a);
    em(ctx, '🗡️', 0, -52, 52, { r: 0.8 });
    ctx.restore();
  } else {
    em(ctx, '🗡️', 130, 470, 48, { r: 2.2 });
  }
  if (t > 2.0 && t < 2.4) { parts(ctx, t, 2.0, 120, 470, 8, { ch: '⭐', size: 22, life: 0.8, v: 120, g: 100 }); }
  if (t > 2.0) txt(ctx, '-100 HP', 110, 360 - P(t, 2.0, 4) * 60, 30, '#ff3b3b', 1 - P(t, 3.6, 4.4));
  if (t > 4.6) txt(ctx, 'GG', 270, 360, 34, '#fff', P(t, 4.6, 4.9));
  end(ctx);
});

add('e06', 'Rage quit', 'De controller was draadloos.', 6, (ctx, t, w, h) => {
  const hitT = 2.2;
  begin(ctx, w, h, { top: '#3a3550', bot: '#5b5276', gy: 500, gc: '#4a3b2f', sh: t > hitT && t < hitT + 0.4 ? shk(t, 8) : [0, 0] });
  const tilt = t > hitT ? -0.35 * E.out(P(t, hitT, hitT + 0.5)) : 0;
  ctx.save(); ctx.translate(270, 470); ctx.rotate(tilt);
  em(ctx, '📺', 0, -90, 150);
  if (t > hitT) {
    const ox = 0, oy = -90;
    line(ctx, ox - 10, oy - 30, ox + 20, oy + 5, '#fff', 3); line(ctx, ox + 20, oy + 5, ox + 4, oy + 28, '#fff', 3); line(ctx, ox + 20, oy + 5, ox + 40, oy - 8, '#fff', 3);
  }
  if (t > hitT + 1.0) {
    const k = 1 + Math.sin(t * 10) * 0.05;
    em(ctx, '🏆', 6, -90, 42 * k);
  }
  ctx.restore();
  const face = t < 1.2 ? '😡' : t < hitT + 0.2 ? '🤬' : t < hitT + 1.2 ? '😳' : '😎';
  shadow(ctx, 80, 508, 36);
  em(ctx, face, 80, 450, 72);
  em(ctx, '🪑', 80, 500, 60, { a: 0 });
  if (t < 1.4) em(ctx, '🎮', 120, 470, 40, { r: Math.sin(t * 30) * 0.2 });
  else if (t < hitT) {
    const k = P(t, 1.4, hitT);
    em(ctx, '🎮', lerp(120, 245, k), lerp(470, 380, k) - arc(k, 100), 40, { r: k * 14 });
  } else if (t < hitT + 0.9) {
    const k = P(t, hitT, hitT + 0.9);
    em(ctx, '🎮', lerp(245, 200, k), 380 + E.in(k) * 110, 40, { r: 14 + k * 5 });
  } else em(ctx, '🎮', 200, 490, 40, { r: 3 });
  if (t > hitT + 1.0) txt(ctx, 'PLAYER 2 WINS', 170, 150, 26, '#ffd24a', P(t, hitT + 1, hitT + 1.3));
  end(ctx);
});

add('e07', 'Respawn', 'Leren van fouten kost hier drie levens.', 6.5, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#2a0d0d', bot: '#6e1d12' });
  // lava
  rect(ctx, -30, 520, w + 60, 140, '#ff6a1a');
  for (let x = -20; x < w + 20; x += 40) circle(ctx, x + Math.sin(t * 3 + x) * 6, 520 + Math.sin(t * 4 + x * 0.3) * 4, 22, '#ffb02e');
  rect(ctx, -30, 440, 150, 220, '#555'); rect(ctx, 245, 440, 150, 220, '#555');
  em(ctx, '🪧', 100, 410, 44);
  const L = 1.6;
  const lives = t < L ? 3 : t < 2 * L ? 2 : t < 3 * L ? 1 : 0;
  let u = (t % L) / L, cyc = Math.floor(t / L);
  if (cyc < 3) {
    let x, y;
    if (u < 0.5) { x = lerp(30, 130 - cyc * 6, u / 0.5); y = 410; }
    else { const k = (u - 0.5) / 0.5; x = lerp(130, 200 + cyc * 20, k); y = 410 - arc(Math.min(1, k * 1.3), 50) + E.in(k) * 220; }
    em(ctx, '🧍', x, y, 56, { a: u > 0.97 ? 0 : 1 });
    if (u > 0.58 && u < 0.8) parts(ctx, u, 0.58, x, 520, 6, { cols: ['#ffb02e', '#ff6a1a'], g: 500, v: 220, life: 0.5, a0: -2.6, a1: -0.5 });
    if (u < 0.2) parts(ctx, u, 0, 30, 410, 8, { ch: '✨', size: 20, life: 0.3, v: 120, g: 0 });
  } else {
    em(ctx, '💀', 30, 405, 52, { a: 1 });
    txt(ctx, 'Level geskipt?', 180, 250, 28, '#fff', P(t, 3 * L, 3 * L + 0.4));
    em(ctx, '🐢', lerp(-30, 390, P(t, 3 * L, 6.5)), 420, 44);
  }
  for (let i = 0; i < 3; i++) em(ctx, i < lives ? '❤️' : '🖤', 30 + i * 34, 36, 28);
  end(ctx);
});

add('e08', 'Cheatcode', 'Hij heeft de code een beetje overdreven.', 6.5, (ctx, t, w, h) => {
  const burst = 3.6;
  const bg = t > burst ? 1 : 0;
  begin(ctx, w, h, { top: bg ? '#6fc3ff' : '#2a2a40', bot: bg ? '#d9f1ff' : '#44446a', gy: 520, gc: '#555', sh: t > 2.6 && t < burst + 0.6 ? shk(t, 2 + (t - 2.6) * 5) : [0, 0] });
  const arrows = ['↑', '↑', '↓', '↓', '←', '→', 'B', 'A'];
  const n = Math.floor(P(t, 0.2, 2.2) * 8);
  for (let i = 0; i < 8; i++) if (i < n) txt(ctx, arrows[i], 50 + i * 38, 60, 30, '#ffd24a');
  if (t > 2.2 && t < 3.4) txt(ctx, 'CHEAT ACTIVATED', 180, 110, 22, '#7ff0a0', 1);
  if (t < burst + 0.1) {
    rect(ctx, -30, 130, w + 60, 80, '#8a4b3a');
    for (let x = -20; x < w + 20; x += 60) { line(ctx, x, 130, x, 210, '#5e2f22', 3); }
    line(ctx, -30, 170, w + 30, 170, '#5e2f22', 3);
  } else parts(ctx, t, burst, 180, 170, 22, { rect: true, size: 26, col: '#8a4b3a', v: 320, g: 600, life: 1.6, a0: -3.3, a1: 0.1 });
  const s = lerp(60, 640, E.io(P(t, 2.2, burst + 0.3)));
  const sy = 500 - s * 0.45;
  em(ctx, t > burst + 1.2 ? '😎' : '🧍', 180, Math.min(500 - s * 0.5, 480), s, { a: 1 });
  if (t > burst + 0.2) txt(ctx, 'MEGA', 180, 560, 54, '#ff4d4d', P(t, burst + 0.2, burst + 0.6), -0.1);
  end(ctx);
});

// ---------- SOCIAAL EN TELEFOON ----------
add('e09', 'Selfie', 'Mooie achtergrond, wel.', 6, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#ff9a5a', bot: '#ffe0a8' });
  circle(ctx, 250, 220, 60, '#fff3b0');
  rect(ctx, 150, 440, 260, 220, '#8a6a4a'); rect(ctx, 150, 440, 260, 12, '#6cc060');
  rect(ctx, -30, 560, 160, 120, '#3a3a5a', 0.8);
  let x = 290, y = 410;
  if (t < 3) x = lerp(290, 158, E.io(P(t, 0.5, 3)));
  const fallT = 3.1;
  if (t > fallT) { const u = t - fallT; x = 158 - u * 30; y = 410 + u * u * 300; }
  const sc = t > fallT ? Math.max(0.25, 1 - (t - fallT) * 0.35) : 1;
  em(ctx, '🤳', x - 30, y - 6, 54 * sc, { r: -0.3 });
  em(ctx, t > fallT ? '😱' : '😎', x, y, 62 * sc);
  if (t > 2.9 && t < 3.2) flash(ctx, w, h, 1 - P(t, 2.9, 3.2));
  if (t > 3.3) txt(ctx, 'AAAAH', 120, 300 + (t - 3.3) * 80, 30, '#fff', 1 - P(t, 4.8, 5.4));
  if (t > 4.7) {
    const k = E.back(P(t, 4.7, 5.2));
    ctx.save(); ctx.translate(250, 360); ctx.scale(k, k); ctx.rotate(0.1);
    rect(ctx, -60, -50, 120, 100, '#fff', 1, 6); rect(ctx, -52, -42, 104, 70, '#68b5e8');
    em(ctx, '🌄', 0, -8, 50);
    txt(ctx, '1 like', 0, 38, 16, '#222');
    ctx.restore();
  }
  end(ctx);
});

add('e10', 'Eén like', 'Oma vindt het mooi.', 6, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#e8e4ff', bot: '#fdfcff' });
  rect(ctx, 50, 90, 260, 400, '#fff', 1, 24);
  rect(ctx, 56, 96, 248, 388, '#f2f2f7', 1, 20);
  em(ctx, '🍕', 180, 230, 130);
  const likes = t > 4 ? 1 : 0;
  em(ctx, likes ? '❤️' : '🤍', 90, 400, 36, { sx: likes ? 1 + Math.sin(P(t, 4, 4.6) * 9) * 0.3 : 1 });
  txt(ctx, String(likes), 140, 402, 32, '#333');
  txt(ctx, 'Geplaatst: 3 uur geleden', 180, 440, 16, '#888', t > 1.5 ? 1 : 0);
  if (t > 1.2 && t < 3.8) {
    ctx.save(); ctx.translate(310, 90); em(ctx, '⏰', 0, 0, 40, { r: Math.sin(t * 40) * 0.15 }); ctx.restore();
    ctx.save(); ctx.translate(180, 560);
    for (let i = 0; i < 12; i++) { const a = (t - 1.2) * 8 + i; circle(ctx, Math.cos(a) * 0, 0, 0, '#000'); }
    ctx.restore();
    txt(ctx, '...', 140 + Math.sin(t * 5) * 3, 400, 26, '#aaa');
  }
  if (t > 3.6) {
    const k = P(t, 3.6, 4.1);
    em(ctx, '👵', lerp(380, 300, E.out(k)), 560, 74);
    if (t < 4.1) em(ctx, '❤️', lerp(300, 90, k), lerp(540, 400, k) - arc(k, 60), 28);
    if (t > 4.4) txt(ctx, 'Mooie pizza schat!', 230, 500, 17, '#222', P(t, 4.4, 4.7));
    parts(ctx, t, 4.0, 90, 400, 14, { ch: '✨', size: 18, life: 1, v: 130, g: 0 });
  }
  end(ctx);
});

add('e11', 'Nog 1 procent', 'Net te kort voor de laadkabel.', 6.5, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#e9dcc9', bot: '#f6eee2', gy: 480, gc: '#b08a5c' });
  rect(ctx, 330, 340, 30, 130, '#fff', 1, 4); rect(ctx, 334, 400, 10, 6, '#555');
  const x0 = 40, endx = 270;
  let x = lerp(x0, endx, E.out(P(t, 0.4, 4.5)));
  const dead = t > 4.5;
  if (!dead) x += Math.sin(t * 20) * 1.5;
  const y = 440 - (dead ? 0 : Math.abs(Math.sin(t * 8)) * 22);
  // kabel
  ctx.save(); ctx.strokeStyle = '#333'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(336, 403);
  ctx.quadraticCurveTo(310, 470, 292, 466 + Math.sin(t * 3) * 2); ctx.stroke(); ctx.restore();
  em(ctx, '🔌', 292, 465, 28, { r: -1.7 });
  shadow(ctx, x, 480, 22);
  em(ctx, '📱', x, y, 56);
  if (!dead) {
    rect(ctx, x - 14, y - 16, 28, 14, '#000', 0.0);
    txt(ctx, '1%', x, y - 52, 22, Math.sin(t * 12) > 0 ? '#ff4d4d' : '#fff');
    parts(ctx, t, 0, x - 20, y + 20, 0, {});
  } else {
    const k = P(t, 4.5, 5.3);
    txt(ctx, '0%', x, y - 52, 22, '#444', 1 - k);
    em(ctx, '💀', x, y - 50 - k * 40, 28, { a: k });
    txt(ctx, '1 cm', (x + 292) / 2, 440, 14, '#d33', P(t, 4.9, 5.3));
    line(ctx, x + 18, 452, 280, 452, '#d33', 2);
  }
  end(ctx);
});

add('e12', 'Meldingen', 'Stilte. Eindelijk.', 6.5, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#2b2f4a', bot: '#4a5078' });
  const exit = P(t, 4.6, 5.6);
  em(ctx, '📱', 180, 330, 190);
  const icons = ['💬', '📧', '❤️', '📞', '🛒', '🎮', '📰', '🔔'];
  const cols = ['#fff', '#ffe9a8', '#ffd1d9', '#d6f2ff'];
  const N = 30;
  for (let i = 0; i < N; i++) {
    const ts = 0.3 + 4 * Math.pow(i / N, 1.8);
    if (t < ts) continue;
    const k = E.back(P(t, ts, ts + 0.25));
    const cx = 180 + (rnd(i) - 0.5) * 220, cy = 150 + rnd(i + 7) * 360;
    const fall = exit * exit * (500 + rnd(i) * 400);
    ctx.save(); ctx.translate(cx, cy + fall); ctx.scale(k, k); ctx.rotate((rnd(i + 3) - 0.5) * 0.3 + exit * (rnd(i) - 0.5) * 3);
    rect(ctx, -90, -22, 180, 44, cols[i % 4], 1, 10);
    ctx.restore();
    em(ctx, icons[i % 8], cx - 68, cy + fall, 24 * k, { r: exit * (rnd(i) - 0.5) * 3 });
    rect(ctx, cx - 40 + 0, cy - 8 + fall, 100 * k, 6 * k, '#999', 0.8);
    rect(ctx, cx - 40, cy + 6 + fall, 60 * k, 5 * k, '#bbb', 0.8);
  }
  if (t > 4.6) {
    em(ctx, '🔕', 180, 330, 70 * E.back(P(t, 5, 5.6)), { a: P(t, 4.9, 5.2) });
  }
  end(ctx);
});

add('e13', 'Scherm kapot', 'De val was prima. De schoen niet.', 5.5, (ctx, t, w, h) => {
  const stomp = 3.6;
  begin(ctx, w, h, { top: '#cfd8e8', bot: '#eef2f8', gy: 500, gc: '#8c8c9a', sh: t > stomp && t < stomp + 0.3 ? shk(t, 8) : [0, 0] });
  let y;
  if (t < 1.8) y = lerp(-40, 470, E.bounce(P(t, 0, 1.8)));
  else y = 470;
  const rot = t < 1.8 ? P(t, 0, 1.2) * 0.4 : 0.4;
  shadow(ctx, 160, 502, 34);
  em(ctx, '📱', 160, y, 76, { r: rot * (t < 1.8 ? 1 : 1), sy: t > stomp ? 0.5 : 1 });
  if (t > 1.8 && t < stomp) { em(ctx, '😅', 280, 400, 64); txt(ctx, 'Pfff, heel', 280, 350, 18, '#333'); }
  if (t > 2.6) {
    const k = t < stomp ? E.in(P(t, 2.6, stomp)) : 1;
    const sh = lerp(-150, 455, k);
    em(ctx, '👟', 160, sh, 100, { r: 0.4 });
  }
  if (t > stomp) {
    for (let i = 0; i < 8; i++) { const a = i * 0.8 + 0.2; line(ctx, 160, 475, 160 + Math.cos(a) * 40, 475 + Math.sin(a) * 18, '#fff', 3); }
    txt(ctx, 'KRAK', 160, 410, 36, '#ff4d4d', P(t, stomp, stomp + 0.2), -0.2);
    em(ctx, '😬', 280, 400, 64, { a: P(t, stomp, stomp + 0.3) });
  }
  end(ctx);
});

add('e14', 'Autocorrect', 'Dat bedoelde hij net niet.', 7, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#dfeaf5', bot: '#f4f9fd' });
  const base = 'Ik ben er over 5 minuten';
  const n = Math.floor(P(t, 0.3, 3.0) * base.length);
  rect(ctx, 20, 520, 320, 54, '#fff', 1, 27);
  let s = base.slice(0, n);
  if (t > 3.4) s = 'Ik ben er over 5 dagen';
  const fl = t > 3.1 && t < 3.4 && Math.floor(t * 20) % 2 === 0;
  ctx.save(); ctx.font = '19px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = fl ? '#e22' : '#222';
  if (t < 4.4) ctx.fillText(s + (Math.floor(t * 3) % 2 === 0 && t < 3.1 ? '|' : ''), 38, 547);
  ctx.restore();
  if (t > 3.1 && t < 4.4) {
    const k = E.back(P(t, 3.1, 3.4));
    rect(ctx, 220, 480, 100, 34, '#555', 1, 8);
    txt(ctx, 'dagen', 270, 497, 18, '#fff', k);
    em(ctx, '😬', 180, 430, 54 * k);
  }
  const send = P(t, 4.3, 5.0);
  if (t >= 4.3) {
    const by = lerp(547, 330, E.out(send));
    rect(ctx, 100, by - 26, 240, 52, '#2b8cff', 1, 20);
    txt(ctx, 'Ik ben er over 5 dagen', 220, by, 17, '#fff');
  }
  if (t > 5.2) {
    const k = E.back(P(t, 5.2, 5.6));
    rect(ctx, 20, 220, 150 * k, 52 * k, '#e5e5ea', 1, 20);
    txt(ctx, 'Wat??', 95, 246, 24 * k, '#222');
    em(ctx, '😳', 70, 160, 60 * k);
  }
  end(ctx);
});

// ---------- THUISWERKEN ----------
add('e15', 'Videocall', 'Alleen de bovenste helft telt.', 7, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#2b2b33', bot: '#3a3a46' });
  const z = lerp(2.3, 1, E.io(P(t, 2.0, 4.4)));
  rect(ctx, 24, 80, 312, 470, '#e8eef5', 1, 14);
  ctx.save();
  ctx.beginPath(); ctx.rect(24, 80, 312, 470); ctx.clip();
  ctx.translate(180, 270); ctx.scale(z, z); ctx.translate(-180, -270);
  rect(ctx, -60, 80, 480, 520, '#cfe0ec');
  rect(ctx, 130, 290, 100, 90, '#3a6fd8', 1, 18); // overhemd
  rect(ctx, 168, 290, 24, 30, '#fff'); rect(ctx, 175, 296, 10, 60, '#c0392b', 1, 3);
  em(ctx, '🙂', 180, 235, 90);
  // pyjamabroek
  rect(ctx, 138, 378, 84, 120, '#8fd0ff', 1, 6);
  for (let i = 0; i < 6; i++) em(ctx, '⭐', 150 + (i % 2) * 40, 395 + Math.floor(i / 2) * 36, 14);
  em(ctx, '🐰', 150, 515, 40); em(ctx, '🐰', 210, 515, 40);
  rect(ctx, 100, 345, 160, 26, '#7a5230', 1, 5);
  em(ctx, '☕', 230, 336, 36);
  ctx.restore();
  rect(ctx, 24, 80, 312, 28, '#444', 1, 8);
  circle(ctx, 40, 94, 5, '#ff4d4d', 0.6 + 0.4 * Math.sin(t * 6));
  txt(ctx, 'Teams: Stand-up', 190, 94, 14, '#fff');
  if (t > 4.6) {
    em(ctx, '😱', 80, 590, 50 * E.back(P(t, 4.6, 5)));
    txt(ctx, 'Camera staat aan!', 230, 590, 20, '#ffd24a', P(t, 4.6, 5));
  }
  if (t > 5.6) em(ctx, '🙈', 180, 400, 80 * E.back(P(t, 5.6, 6)), { a: 1 });
  end(ctx);
});

add('e16', 'Kat op toetsenbord', 'Verzonden naar de directie.', 6.5, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#dbe3ee', bot: '#f2f5fa' });
  rect(ctx, 20, 70, 320, 190, '#fff', 1, 10);
  rect(ctx, 20, 70, 320, 24, '#4a6fa5', 1, 10);
  txt(ctx, 'Nieuw bericht aan: Directie', 180, 82, 13, '#fff');
  const rows = ['qqwweerrttyy', 'asdfghjkl;', 'zxcvbnm,.'];
  const cx = lerp(-40, 400, E.lin(P(t, 0.5, 3.8)));
  for (let r = 0; r < 3; r++) for (let i = 0; i < 12 - r; i++) {
    const kx = 36 + i * 24 + r * 8, ky = 340 + r * 36;
    const down = Math.abs(cx - kx) < 40 && t > 0.5 && t < 4.2 ? 3 : 0;
    rect(ctx, kx, ky + down, 21, 28, '#fff', 1, 4); rect(ctx, kx, ky + 22 + down, 21, 6, '#b9c2cf', 1, 3);
  }
  rect(ctx, 20, 320, 320, 130, '#8a94a4', 0.4, 12);
  const chars = 'asdfjkqwoeirutyqpzmx;;;kkjhjhjh';
  const n = Math.floor(P(t, 0.8, 4.0) * 30);
  ctx.save(); ctx.font = '20px monospace'; ctx.fillStyle = '#222'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(chars.slice(0, Math.min(15, n)), 32, 125);
  ctx.fillText(chars.slice(15, Math.max(15, n)), 32, 150);
  ctx.restore();
  if (t < 4.2) em(ctx, '🐈', cx, 330 + Math.abs(Math.sin(t * 9)) * -8, 70, { fx: true });
  else {
    const k = E.bounce(P(t, 4.2, 4.8));
    em(ctx, '🐈', 180, lerp(250, 345, k), 100, { sx: 1, sy: 0.85 + 0.15 * k });
    if (t > 4.8) em(ctx, '😼', 250, 300, 0);
  }
  if (t > 4.4) {
    const k = E.back(P(t, 4.4, 4.9));
    rect(ctx, 80, 170, 200 * k, 60 * k, '#2e9e4f', 1, 12);
    txt(ctx, 'Verzonden!', 180, 200, 28 * k, '#fff');
  }
  if (t > 5.3) em(ctx, '😨', 300, 120 + (1 - E.back(P(t, 5.3, 5.8))) * 80, 56);
  end(ctx);
});

add('e17', 'Zesde koffie', 'Productiviteit op lichtsnelheid.', 6, (ctx, t, w, h) => {
  const launch = 4.2;
  const amp = t < launch ? Math.min(9, t * 1.6) : 0;
  begin(ctx, w, h, { top: '#f6e8d2', bot: '#fff8ee', gy: 500, gc: '#a3764a', sh: t < launch ? shk(t, amp * 0.4) : [0, 0] });
  const cups = Math.min(6, Math.floor(t / 0.65) + 1);
  for (let i = 0; i < cups && i < 6; i++) {
    const age = t - i * 0.65;
    em(ctx, '☕', 250 + (i % 2) * 6, 470 - i * 42, 40 * E.back(P(age, 0, 0.3)));
  }
  const face = t < 1.3 ? '😐' : t < 2.6 ? '🙂' : t < 3.6 ? '😳' : t < launch ? '🤪' : '🚀';
  const sh = shk(t * 2, amp);
  let y = 440;
  if (t > launch) { const u = t - launch; y = 440 - u * u * 320; }
  if (t > launch) {
    for (let i = 0; i < 6; i++) line(ctx, 120 + i * 24 + rnd(i) * 10, y + 70, 120 + i * 24, y + 70 + 80 + rnd(i) * 60, '#ffb347', 4);
    em(ctx, '🔥', 180, y + 70, 56, { r: 3.14 });
  }
  shadow(ctx, 150, 508, 40 * (t > launch ? Math.max(0.2, 1 - (t - launch)) : 1), 0.25);
  em(ctx, face, 150 + (t < launch ? sh[0] : 0), y + (t < launch ? sh[1] : 0), 90);
  rect(ctx, 120, 480 + (t > launch ? 0 : 0), 60, 20, '#3a6fd8', 1, 5);
  if (t > launch + 0.3) txt(ctx, 'WHOOSH', 150, 540, 34, '#ff7a1a', 1 - P(t, launch + 0.3, 5.5), 0.15);
  if (t > launch + 0.6) em(ctx, '☕', 250, 220, 0);
  end(ctx);
});

add('e18', 'Dit was een mail', 'Vergadering van drie dagen.', 7.5, (ctx, t, w, h) => {
  const night = Math.sin(P(t, 0.5, 6) * TAU * 1.2 - 1.2) * 0.5 + 0.5;
  begin(ctx, w, h, { top: night > 0.5 ? '#1b1f3a' : '#bfe4ff', bot: night > 0.5 ? '#2c3260' : '#f0faff' });
  // klok
  ctx.save(); ctx.translate(180, 120);
  circle(ctx, 0, 0, 52, '#fff'); circle(ctx, 0, 0, 46, '#f6f6f6');
  const a = t * 6;
  line(ctx, 0, 0, Math.sin(a) * 38, -Math.cos(a) * 38, '#222', 4);
  line(ctx, 0, 0, Math.sin(a / 12) * 24, -Math.cos(a / 12) * 24, '#222', 6);
  circle(ctx, 0, 0, 5, '#c33');
  ctx.restore();
  rect(ctx, 30, 400, 300, 36, '#8a5a34', 1, 8);
  const faces = (i) => {
    const th = 1.2 + i * 0.5;
    if (t < th) return '😐';
    if (t < th + 1.5) return '😴';
    if (t < th + 3.0 + i * 0.2) return '🥱';
    return '💀';
  };
  for (let i = 0; i < 4; i++) {
    const x = 70 + i * 73;
    const f = faces(i);
    em(ctx, f, x, 370 + (f === '💀' ? 8 : 0) + Math.sin(t * 2 + i) * (f === '😴' ? 4 : 0), 62);
    if (f === '💀') em(ctx, '🕸️', x + 22, 336, 24);
    if (f === '😴') txt(ctx, 'z', x + 28, 328 - (t * 20 % 18), 16, '#445');
  }
  const k = P(t, 6.0, 6.5);
  if (t > 5.8) {
    em(ctx, '🙋', 180, lerp(520, 460, E.back(k)), 70);
    txt(ctx, 'Punt 2!', 250, 480, 22, '#ffd24a', k);
  }
  if (t > 6.6) {
    const m = E.back(P(t, 6.6, 7.2));
    em(ctx, '📧', 180, 260, 110 * m);
    txt(ctx, 'Had een mail kunnen zijn', 180, 330, 18, '#fff', P(t, 6.8, 7.2));
  }
  end(ctx);
});

add('e19', 'Printer', 'Hij deed het eerst gewoon niet.', 6.5, (ctx, t, w, h) => {
  const kick = 2.2;
  begin(ctx, w, h, { top: '#dde4ec', bot: '#f3f6f9', gy: 520, gc: '#9aa3ad', sh: t > kick && t < kick + 0.4 ? shk(t, 7) : [0, 0] });
  const wob = t > kick && t < kick + 0.7 ? Math.sin(t * 60) * 0.06 : 0;
  em(ctx, '🖨️', 250, 440, 130, { r: wob });
  if (t < kick) {
    txt(ctx, 'Papier vastgelopen', 250, 350, 16, '#e22', Math.floor(t * 3) % 2 ? 1 : 0.4);
    em(ctx, '😤', 80, 440, 70, { sx: 1 + Math.sin(t * 8) * 0.04 });
    em(ctx, '🖐️', 126, 450 - P(t, 0.5, 1.8) * 0, 36, { r: 0, a: 0 });
  } else {
    const k = E.out(P(t, kick - 0.3, kick));
    em(ctx, '😤', 80 + (t < kick + 0.3 ? P(t, kick - 0.3, kick) * 60 : 60 - P(t, kick + 0.3, kick + 1) * 30), 440, 70);
    em(ctx, '🦶', 150 - (t < kick + 0.3 ? 0 : 0), 460, 40, { a: t < kick + 0.3 ? 1 : 0, r: 0.5 });
  }
  if (t > kick + 0.5) {
    const n = Math.floor(Math.pow(P(t, kick + 0.5, 5.4), 1.4) * 70);
    for (let i = 0; i < n; i++) {
      const ts = kick + 0.5 + Math.pow(i / 70, 1 / 1.4) * (5.4 - kick - 0.5);
      const u = t - ts;
      const ang = -2.9 + rnd(i) * 1.2;
      const sp = 260 + rnd(i + 3) * 160;
      let x = 230 + Math.cos(ang) * sp * u;
      let y = 410 + Math.sin(ang) * sp * u + 450 * u * u;
      if (y > 515 - rnd(i + 8) * 10) y = 515 - rnd(i + 8) * 10;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rnd(i + 5) * 3 + (y > 500 ? 0 : u * 6));
      rect(ctx, -14, -9, 28, 18, '#fff', 1); line(ctx, -9, -3, 9, -3, '#bbb', 1);
      ctx.restore();
    }
  }
  if (t > 5.2) {
    const k = P(t, 5.2, 6.0);
    rect(ctx, -30, 540 - k * 330, w + 60, 400, '#fff', 1);
    for (let y = 560 - k * 330; y < 640; y += 24) line(ctx, 10, y, 350, y, '#e0e0e0', 1);
    em(ctx, '👀', 180, 500 - k * 330 + 0, 60, { a: 1 });
    txt(ctx, '1 van 4000', 180, 570 - k * 330, 22, '#999');
  }
  end(ctx);
});

// ---------- ROBOTS EN AI ----------
add('e20', 'Stofzuigerrobot', 'Die sok was toch van hem.', 7, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#e9d9c1', bot: '#f4ead9', gy: 380, gc: '#b78a5e' });
  rect(ctx, -30, 330, w + 60, 50, '#d8c4a6');
  let vx, vy = 500;
  if (t < 3.2) { vx = lerp(-40, 190, E.io(P(t, 0, 3.2))); vy = 500 + Math.sin(t * 3) * 20; }
  else if (t < 5.6) { const a = (t - 3.2) * 1.8; vx = 190 + Math.cos(a * 2) * 90 - 90 * (a > 0 ? 1 : 0) + 90 * 0; vy = 500 + Math.sin(a * 2) * 40; vx = 190 + Math.sin(a * 2.2) * 120; }
  else { vx = 190 + Math.sin(5.6 * 0 + (5.6 - 3.2) * 1.8 * 2.2) * 120; vx = lerp(vx, 420, E.in(P(t, 5.6, 6.2))); }
  const sockK = P(t, 1.8, 2.6);
  if (sockK < 1) em(ctx, '🧦', 190 - sockK * 5, 515, 36 * (1 - sockK * 0.9), { r: sockK * 5 });
  shadow(ctx, vx, vy + 28, 40);
  em(ctx, '🤖', vx, vy, 64);
  if (t > 2.6 && t < 3.4) txt(ctx, 'NOM', vx, vy - 52, 22, '#fff', 1 - P(t, 2.8, 3.4));
  if (t > 3.4) {
    const k = P(t, 3.4, 3.9);
    const cy = lerp(vy - 150, vy - 52, E.in(k)) ;
    const ride = t < 6.2 ? 0 : 1;
    em(ctx, '🐈', vx, t < 3.9 ? cy - arc(k, 40) : vy - 52 + Math.sin(t * 6) * 2, 54, { fx: Math.cos((t - 3.2) * 1.8 * 2.2) < 0 });
    if (t > 3.9 && t < 6.2) em(ctx, '😎', vx, vy - 98, 24);
  }
  if (t > 6.2) txt(ctx, 'MIAUW', 330, 300 + (t - 6.2) * -40, 24, '#fff', 1 - P(t, 6.2, 7));
  end(ctx);
});

add('e21', 'AI-foto', 'Tel de vingers maar eens.', 6.5, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#5b2d8f', bot: '#a9529f' });
  rect(ctx, 30, 80, 300, 440, '#fff', 1, 14);
  rect(ctx, 40, 90, 280, 380, '#9bd6ff', 1, 8);
  circle(ctx, 280, 140, 30, '#fff3b0');
  em(ctx, '😁', 180, 270, 130);
  rect(ctx, 130, 330, 100, 110, '#e8553c', 1, 20);
  const n = 5 + Math.floor(E.in(P(t, 1.2, 5)) * 9);
  const spinR = t > 4.8 ? (t - 4.8) * 9 : 0;
  ctx.save(); ctx.translate(180, 420); ctx.rotate(spinR);
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * (t > 4.8 ? TAU / n : 0.32 * Math.min(1, 5 / n * 1.6));
    ctx.save(); ctx.rotate(a + Math.PI / 2 - Math.PI / 2 + Math.PI / 2); ctx.translate(0, -52);
    em(ctx, '☝️', 0, 0, 40, { r: 0 });
    ctx.restore();
  }
  ctx.restore();
  txt(ctx, '✨ AI-FOTO ✨', 180, 495, 20, '#7a3dbf');
  if (t > 1.2) txt(ctx, 'Vingers: ' + n, 180, 560, 26, '#fff');
  if (t > 5.2) em(ctx, '😵‍💫', 300, 560, 56 * E.back(P(t, 5.2, 5.6)));
  end(ctx);
});

add('e22', 'Dansrobot', 'Foutmelding: te veel moves.', 6.5, (ctx, t, w, h) => {
  const up = P(t, 3.6, 5.2);
  begin(ctx, w, h, { top: '#2a1f4e', bot: '#5a3d9a', gy: 520, gc: '#2a2a3a', sh: t > 5.2 && t < 5.5 ? shk(t, 8) : [0, 0] });
  for (let i = 0; i < 6; i++) { const c = ['#ff4d9a', '#4dd2ff', '#ffd24a'][i % 3]; circle(ctx, 30 + i * 60, 40 + Math.sin(t * 5 + i) * 10, 12, c, 0.7); }
  const spd = lerp(5, 18, E.in(P(t, 0, 3.6)));
  const ph = t * spd;
  let x = 180 + Math.sin(ph * 0.5) * 50, y = 440 - Math.abs(Math.sin(ph)) * 40, r = Math.sin(ph) * 0.3;
  if (t >= 3.6) { x = 180 + Math.sin(ph * 0.5) * 50 * (1 - up); y = lerp(440, 40, E.in(up)); r = (t - 3.6) * 25; }
  if (t < 5.2) {
    shadow(ctx, x, 524, 40 * (1 - up));
    em(ctx, '🤖', x, y, 110, { r });
    if (t > 2.4 && t < 3.6) parts(ctx, t % 0.4, 0, x, y, 6, { ch: '⚡', size: 20, life: 0.4, v: 100, g: 0, seed: Math.floor(t / 0.4) });
    if (t > 2.4 && t < 4.4) txt(ctx, 'ERROR 404: MOVES', 180, 110, 22, '#ff5252', Math.floor(t * 8) % 2 ? 1 : 0.5);
    if (t < 2.4) em(ctx, '🎵', 40 + (t * 40) % 280, 200 - ((t * 50) % 100), 28, { a: 0.8 });
  } else {
    const k = P(t, 5.2, 6.5);
    em(ctx, '🤖', 180, 50 + Math.sin(t * 8) * 2, 110, { r: 3.14159 + Math.sin(t * 6) * 0.1 });
    parts(ctx, t, 5.2, 180, 60, 14, { rect: true, size: 12, col: '#aaa', v: 200, g: 500, life: 1.2, a0: 0, a1: 3.1 });
    txt(ctx, 'Eh... ik blijf hier', 180, 240, 20, '#fff', P(t, 5.7, 6));
  }
  end(ctx);
});

add('e23', 'Captcha', 'Dat is net een beetje te eerlijk.', 6.5, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#e8eef6', bot: '#f8fafc' });
  rect(ctx, 40, 160, 280, 80, '#fff', 1, 8);
  rect(ctx, 56, 182, 36, 36, '#fff', 1, 4);
  ctx.save(); ctx.strokeStyle = '#777'; ctx.lineWidth = 3; ctx.strokeRect(56, 182, 36, 36); ctx.restore();
  txt(ctx, 'Ik ben geen robot', 200, 200, 18, '#333');
  const peek = E.back(P(t, 0.3, 1.2));
  if (t < 4.2) {
    em(ctx, '🤖', 74, lerp(420, 300, peek), 70, { r: Math.sin(t * 25) * 0.05 * (t > 1.2 ? 1 : 0) });
    if (t > 1.3 && t < 2.2) txt(ctx, '*zweet*', 140, 290, 14, '#5a8', 1);
    if (t > 1.3 && t < 4.2) em(ctx, '💧', 100, 270 + (t * 60) % 20, 18);
  }
  if (t > 2.2 && t < 3.2) spin(ctx, 74, 200, 12, t, '#4a90e2');
  if (t > 3.2) {
    line(ctx, 62, 200, 71, 210, '#2e9e4f', 6); line(ctx, 71, 210, 88, 188, '#2e9e4f', 6);
  }
  if (t > 3.4) {
    const k = E.back(P(t, 3.4, 3.9));
    ctx.save(); ctx.translate(180, 400); ctx.scale(k, k);
    rect(ctx, -140, -100, 280, 200, '#fff', 1, 8);
    txt(ctx, 'Kies alle robots', 0, -78, 18, '#333');
    for (let i = 0; i < 9; i++) {
      const gx = -105 + (i % 3) * 70, gy = -40 + Math.floor(i / 3) * 52;
      em(ctx, i === 4 ? '🤖' : ['🐱', '🌳', '🚗', '🍕'][i % 4], gx + 12, gy + 14, 38);
      if (t > 4.6 && i === 4) { ctx.save(); ctx.strokeStyle = '#4a90e2'; ctx.lineWidth = 4; ctx.strokeRect(gx - 14, gy - 12, 52, 52); ctx.restore(); }
    }
    ctx.restore();
  }
  if (t > 5.2) { txt(ctx, 'Geverifieerd: robot', 180, 540, 24, '#2e9e4f', P(t, 5.2, 5.5)); em(ctx, '😎', 180, 590, 44); }
  end(ctx);
});

add('e24', 'Navigatie', 'Route herberekend.', 7, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#9fdcff', bot: '#e9f8ff' });
  const sea = 250;
  rect(ctx, -30, 420, sea + 30, 240, '#7a7f87');
  rect(ctx, -30, 440, sea + 30, 6, '#fff', 0.7);
  rect(ctx, sea, 430, 200, 230, '#2e8be8');
  for (let x = sea; x < 400; x += 30) circle(ctx, x + Math.sin(t * 3 + x) * 4, 430 + Math.sin(t * 2 + x) * 3, 14, '#4aa5f5');
  let x = lerp(-30, 330, E.in(P(t, 0.2, 4.6)) * 0.6 + P(t, 0.2, 4.6) * 0.4);
  if (t > 4.6) x = lerp(330, 330, 1);
  const inSea = x > sea;
  const y = inSea ? 400 + Math.min(1, (x - sea) / 60) * 24 + Math.sin(t * 8) * 3 : 400;
  const ch = t > 4.0 ? '🚤' : '🚗';
  if (t < 6.0) em(ctx, ch, x, y, 64, { fx: true });
  if (inSea) rect(ctx, sea, y + 14, 200, 240, '#2e8be8', 0.7);
  if (x > sea - 10 && t < 3.8) parts(ctx, t, 2.9, sea + 20, 430, 14, { cols: ['#fff', '#bfe6ff'], g: 500, v: 220, life: 0.8, a0: -2.8, a1: -0.4 });
  rect(ctx, 20, 20, 320, 56, '#222', 1, 10);
  const msg = t < 2.0 ? 'Over 200 m: rechtdoor' : t < 3.6 ? 'Rechtdoor... rechtdoor...' : 'Route wordt herberekend';
  txt(ctx, msg, 180, 48, 17, '#fff');
  em(ctx, '🧍', x - 14, y - 16, 0);
  if (t > 4.0 && t < 6.0) txt(ctx, 'Zee?', x, y - 56, 20, '#fff');
  if (t > 5.2) { const k = P(t, 5.2, 6.6); em(ctx, '🚤', lerp(330, 460, k), y, 64, { fx: true, a: 1 }); }
  if (t > 5.6) txt(ctx, 'U bent gearriveerd', 180, 560, 24, '#fff', P(t, 5.6, 6));
  end(ctx);
});

// ---------- KOKEN ----------
add('e25', 'Pannenkoek', 'Plafondpannenkoek: een klassieker.', 7, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#f1e6d0', bot: '#f9f3e6', gy: 520, gc: '#9a7a55' });
  rect(ctx, -30, -30, w + 60, 50, '#fff', 1);
  const flip = P(t, 1.5, 2.6);
  em(ctx, '🍳', 100, 480 - (t > 1.4 && t < 1.7 ? 12 : 0), 80, { r: -0.4 });
  em(ctx, '🧑‍🍳', 80, 420, 70);
  let px = 130, py = 460, sx = 1, sy = 0.35, rot = 0;
  if (t < 1.5) { py = 458; }
  else if (t < 2.6) { py = lerp(458, 38, E.out(flip)); px = 130 + flip * 50; rot = flip * 10; sy = 0.35 * Math.abs(Math.cos(flip * 9)) + 0.05; }
  else if (t < 5) { px = 180; py = 34 + Math.sin(t * 2) * 1.5; sy = 0.3; }
  else { const k = P(t, 5, 5.9); px = 180 + k * 0; py = lerp(34, 400, E.in(k)); sy = 0.3 + 0.0; rot = k * 0.4; }
  ctx.save(); ctx.translate(px, py); ctx.rotate(rot);
  ctx.fillStyle = '#e8b25a'; ctx.beginPath(); ctx.ellipse(0, 0, 50, 50 * sy, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c98a35'; ctx.beginPath(); ctx.ellipse(0, 2, 50, 50 * sy * 0.8, 0, 0, Math.PI); ctx.fill();
  ctx.restore();
  em(ctx, t < 2.6 ? '😀' : t < 5.9 ? '😳' : '😑', 80, 420, 0);
  if (t > 2.6 && t < 5.9) {
    em(ctx, '😳', 80, 420, 70);
    txt(ctx, 'Hmm...', 100, 350, 18, '#444');
  }
  if (t > 5.9) { txt(ctx, 'PLOF', 180, 340, 32, '#c33', 1 - P(t, 5.9, 6.7)); }
  if (t > 5.9) em(ctx, '😑', 180, 440, 60, { a: 1 });
  end(ctx);
});

add('e26', 'Overkokende pasta', 'Alleen de koksmuts dreef nog.', 7, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#fbe9d0', bot: '#fff6e8', gy: 540, gc: '#c4a77d' });
  rect(ctx, 100, 380, 160, 140, '#7a828c', 1, 10);
  rect(ctx, 90, 372, 180, 14, '#8f98a3', 1, 6);
  rect(ctx, 70, 520, 220, 22, '#333', 1, 6);
  const fm = E.in(P(t, 0.5, 4.2));
  const n = Math.floor(fm * 40);
  for (let i = 0; i < n; i++) {
    const a = rnd(i) * TAU, r = rnd(i + 4) * 70 * (0.3 + fm);
    circle(ctx, 180 + Math.cos(a) * r * 1.2, 372 - rnd(i + 2) * 110 * fm - Math.abs(Math.sin(a)) * 10, 14 + rnd(i + 8) * 14 + fm * 12, '#fff');
  }
  for (let i = 0; i < n; i++) {
    const a = rnd(i + 20) * TAU;
    ctx.save(); ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(180 + Math.cos(a) * 60 * fm, 372 - rnd(i + 3) * 80 * fm, 10, 0, TAU); ctx.stroke(); ctx.restore();
  }
  const fill = E.in(P(t, 3.6, 5.8));
  rect(ctx, -30, 640 - fill * 700, w + 60, 700, '#fff', 1);
  for (let i = 0; i < 12; i++) circle(ctx, i * 34 - 10, 640 - fill * 700, 24 + rnd(i) * 10, '#fff');
  if (t < 5.0) {
    const hop = t > 3 ? Math.abs(Math.sin(t * 12)) * 8 : 0;
    em(ctx, t < 2.2 ? '🧑‍🍳' : '😱', 310 - fill * 40, 470 - fill * 10 - hop, 56);
  }
  if (t > 5.4) em(ctx, '👨‍🍳', 180, 330, 80 * E.back(P(t, 5.4, 5.9)) , { r: 0 });
  if (t > 5.4) em(ctx, '🍝', 100, 300, 40, { a: 0 });
  if (t > 5.8) txt(ctx, 'Pasta klaar!', 180, 440, 26, '#c97a1a', P(t, 5.8, 6.2));
  end(ctx);
});

add('e27', 'Rookmelder', 'Pas daarna was de toast klaar.', 6.5, (ctx, t, w, h) => {
  const al = t > 1.4 && t < 5.0;
  begin(ctx, w, h, { top: al && Math.floor(t * 6) % 2 ? '#ffd0cc' : '#f4ead6', bot: '#fff7ea', gy: 520, gc: '#b89a72', sh: al ? shk(t, 1.5) : [0, 0] });
  em(ctx, '🚨', 180, 50, 56, { a: t < 5 ? 1 : 0 });
  if (t > 5.0) {
    const k = P(t, 5.0, 5.5);
    em(ctx, '🚨', 80, 50 + E.in(k) * 360, 56);
  }
  rect(ctx, 220, 450, 90, 70, '#9aa2ab', 1, 10);
  em(ctx, '🍞', 255, 440, t > 5.6 ? 0 : 40);
  if (t > 5.6) em(ctx, '🍞', 255, 420 - E.back(P(t, 5.6, 6)) * 20, 44);
  const n = Math.floor(P(t, 0.3, 3) * 14);
  for (let i = 0; i < n + 6; i++) {
    const u = ((t * 0.6 + rnd(i)) % 1);
    circle(ctx, 255 + Math.sin(u * 8 + i) * 30 * u, 440 - u * 380, 12 + u * 40, '#666', Math.min(1, 0.6 - u * 0.5) * (t < 0.3 ? 0 : 1) * (t > 5.2 ? 1 - P(t, 5.2, 5.5) : 1));
  }
  const wave = Math.sin(t * 14);
  em(ctx, t < 5 ? '😰' : '😐', 90, 450, 76);
  if (t < 5.0 && t > 1.4) em(ctx, '🧻', 90 + wave * 22, 380 - Math.abs(wave) * 20, 40, { r: wave });
  if (t > 5.4) txt(ctx, 'KLAAR', 255, 360, 24, '#2e9e4f', P(t, 5.6, 5.9));
  end(ctx);
});

add('e28', 'Ei met opvoeding', 'Hij was al snel groter dan de pan.', 6, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#fbeed8', bot: '#fff8ea', gy: 520, gc: '#b9996c' });
  rect(ctx, 130, 440, 140, 24, '#444', 1, 8); rect(ctx, 260, 446, 80, 12, '#444', 1, 6);
  circle(ctx, 200, 435, 54, '#fff', 0.0);
  const chef = t < 4.2 ? 70 : 70;
  let cx = 70;
  if (t > 4.0) cx = lerp(70, -60, E.in(P(t, 4.0, 5)));
  em(ctx, t < 3 ? '🧑‍🍳' : '😱', cx, 440, chef, { fx: false });
  if (t < 3.2) {
    const wob = t > 1.2 ? Math.sin(t * 30) * 0.2 * P(t, 1.2, 3) : 0;
    em(ctx, '🥚', 200, 410, 60, { r: wob });
    if (t > 2) line(ctx, 190, 400, 200, 410, '#5a4020', 2), line(ctx, 200, 410, 192, 420, '#5a4020', 2);
  } else {
    const k = P(t, 3.2, 4.4);
    const sz = lerp(50, 320, E.in(P(t, 3.7, 5.2)));
    const bounce = arc(P(t, 3.2, 3.8), 30);
    parts(ctx, t, 3.2, 200, 410, 8, { ch: '🥚', size: 16, life: 0.9, v: 160, g: 500, a0: -2.8, a1: -0.4 });
    em(ctx, t < 4.1 ? '🐥' : '🐔', 200 + (t > 4 ? P(t, 4, 5.4) * 40 : 0), (t < 4.1 ? 410 - bounce : 500 - sz * 0.5), sz, { fx: true });
    if (t > 4.2) txt(ctx, 'KOKKODAK', 200, 90, 30, '#c33', P(t, 4.2, 4.5), 0.1);
  }
  end(ctx);
});

// ---------- FEEST ----------
add('e29', 'Trukkaars', 'Elk jaar dezelfde ellende.', 7, (ctx, t, w, h) => {
  const splash = 5.3;
  begin(ctx, w, h, { top: '#2a2540', bot: '#4a3f70', gy: 520, gc: '#6b4f3a', sh: t > splash && t < splash + 0.3 ? shk(t, 6) : [0, 0] });
  em(ctx, '🎂', 220, 470, 150);
  rect(ctx, 214, 372, 12, 40, '#ff7aa8', 1, 3);
  // vlam: uit na blazen, terug aan
  const blows = [1.2, 2.4, 3.4, 4.2];
  let fl = 1;
  for (const b of blows) if (t > b && t < b + 0.6) fl = t < b + 0.15 ? 0.1 : 0.0;
  if (t > splash) fl = 0.35;
  for (const b of blows) if (t > b + 0.6 && t < b + 0.75) fl = P(t, b + 0.6, b + 0.75) * 1.3;
  em(ctx, '🔥', 220, 355, 44 * fl * (1 + Math.sin(t * 20) * 0.08));
  if (fl < 0.2) for (let i = 0; i < 5; i++) { const u = (t * 2 + i * 0.2) % 1; circle(ctx, 220 + Math.sin(u * 9 + i) * 8, 360 - u * 60, 5 + u * 8, '#aaa', 1 - u); }
  let blowing = false;
  for (const b of blows) if (t > b - 0.4 && t < b + 0.3) blowing = true;
  const face = t < 5.3 ? (blowing ? '😮‍💨' : (t > 3.5 ? '😤' : '🙂')) : '😑';
  em(ctx, face, 80, 430, 90, { sx: 1, sy: t > 4.6 && t < 5.3 ? 1 + Math.sin(t * 30) * 0.03 : 1 });
  if (blowing) { em(ctx, '💨', 140, 420, 36, { a: 0.8 }); em(ctx, '💨', 160, 405, 26, { a: 0.5 }); }
  if (t > 4.7 && t < splash) { em(ctx, '🫗', 220, 250, 0); }
  if (t > 4.6) {
    const k = E.in(P(t, 4.6, splash));
    if (t < splash) { em(ctx, '🪣', 220, lerp(-40, 300, k), 70, { r: 0.4 }); }
    else {
      parts(ctx, t, splash, 220, 400, 24, { cols: ['#6cc4ff', '#bfe6ff'], g: 500, v: 280, life: 1.1, a0: -3, a1: 0 });
      em(ctx, '🪣', 250, 440 + P(t, splash, 6.5) * 60, 70, { r: 1.8 });
    }
  }
  if (t > 5.8) txt(ctx, 'Hij brandt nog', 220, 280, 22, '#ffd24a', P(t, 5.8, 6.1));
  end(ctx);
});

add('e30', 'Ballon', 'Pffffrrrt.', 6, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#ffe0f0', bot: '#fff5fa', gy: 520, gc: '#e9b5d0' });
  const inflate = P(t, 0.4, 3.2);
  const rel = 3.4;
  const faceCol = t < rel ? '😤' : '😮';
  em(ctx, faceCol, 80, 440, 100, { sx: 1 + (t < rel ? inflate * 0.06 : 0) });
  let bx, by, bs, br = 0;
  if (t < rel) { bs = lerp(10, 150, E.io(inflate)); bx = 140 + bs * 0.4; by = 430 - bs * 0.1; bs *= 1; br = Math.sin(t * 40) * 0.03 * inflate; }
  else {
    const u = t - rel;
    bs = Math.max(30, 150 - u * 90);
    const tt = u * 3.2;
    bx = 180 + Math.sin(tt * 1.7) * 140 * Math.min(1, 0.5 + u);
    by = 330 + Math.sin(tt * 2.3 + 1) * 130 + u * 30;
    br = tt * 2;
    for (let i = 1; i < 6; i++) {
      const tp = tt - i * 0.12;
      circle(ctx, 180 + Math.sin(tp * 1.7) * 140 * Math.min(1, 0.5 + u), 330 + Math.sin(tp * 2.3 + 1) * 130 + u * 30, 5, '#fff', 0.5 - i * 0.07);
    }
    if (by > 470 || u > 2.2) { by = 490; bx = 230; br = 1.2; bs = 36; }
  }
  em(ctx, '🎈', bx, by, bs, { r: br, sy: t > rel && t < rel + 2.2 ? 1 : 0.6 });
  if (t >= rel && t < rel + 2.2) txt(ctx, 'PFFFRRRT', 180, 120, 30, '#e0448a', 1, Math.sin(t * 20) * 0.1);
  if (t > 5.4) txt(ctx, '😮', 80, 440, 0);
  if (t > 5.0) txt(ctx, 'Nog eens?', 80, 360, 20, '#c0397a', P(t, 5, 5.4));
  end(ctx);
});

add('e31', 'Piñata', 'Hij had het ook echt goed bedoeld.', 7.5, (ctx, t, w, h) => {
  const boom = 5.6;
  begin(ctx, w, h, { top: '#ffd7a8', bot: '#fff1dc', gy: 520, gc: '#8bc468', sh: t > boom && t < boom + 0.3 ? shk(t, 8) : [0, 0] });
  line(ctx, 180, -20, 180 + Math.sin(t * 2) * 20, 150, '#8a5a34', 3);
  em(ctx, '🪅', 180 + Math.sin(t * 2) * 20, 180, 80, { r: Math.sin(t * 2) * 0.2 });
  // zwaaien: 4 slagen
  const sw = (i) => P(t, 0.8 + i * 1.1, 1.3 + i * 1.1);
  let idx = Math.min(3, Math.floor((t - 0.8) / 1.1));
  const k = idx >= 0 ? sw(idx) : 0;
  const reach = idx === 3 ? 1 : 0;
  em(ctx, '🧒', 130, 440, 76);
  const ang = lerp(-1.2, 0.9, E.io(k));
  ctx.save(); ctx.translate(142, 420); ctx.rotate(t < 0.8 ? -1.2 : (t > 5 ? 0.9 : ang));
  em(ctx, '🏏', 0, -42, 56);
  ctx.restore();
  const vic = t < 4.5 ? 1 : 0;
  let vx = 255, vy = 440;
  if (t > 4.5) { const u = t - 4.5; vx = 255 + u * 10 - 0; }
  if (t < 4.55) em(ctx, '🧔', vx, vy, 76);
  else if (t < boom) {
    const u = P(t, 4.55, boom);
    em(ctx, '🧔', lerp(255, 190, u), lerp(440, 190, E.out(u)), 76, { r: u * 8 });
  } else {
    em(ctx, '🧔', 220 + P(t, boom, boom + 1.5) * 40, 190 + E.in(P(t, boom, boom + 1.6)) * 250, 76, { r: 8 });
  }
  if (t > 4.5 && t < 4.9) txt(ctx, 'BONK', 230, 380, 30, '#e33', 1);
  if (t > boom) {
    parts(ctx, t, boom, 190, 190, 40, { ch: '🍬', size: 22, life: 2, v: 260, g: 420, a0: -3.2, a1: 0.1 });
    parts(ctx, t, boom, 190, 190, 25, { rect: true, size: 12, cols: ['#ff5a8a', '#ffd24a', '#4dd2ff', '#7ae35a'], life: 2, v: 260, g: 380, a0: -3.2, a1: 0.1, seed: 5 });
    if (t > boom) em(ctx, '💥', 190, 190, 80 * (1 - P(t, boom, boom + 0.4)));
    if (t > boom + 0.2) em(ctx, '🧒', 130, 440, 0);
  }
  end(ctx);
});

add('e32', 'Cadeau', 'Dankjewel, eh, wat attent.', 8, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#fff0f6', bot: '#ffe0ee' });
  const T = 1.5;
  const stage = Math.min(4, Math.floor(t / T));
  const lt = t - stage * T;
  for (let s = 0; s <= stage && s < 4; s++) {
    const size = 260 * Math.pow(0.58, s);
    const u = s === stage ? lt : T;
    if (s < stage) continue;
    const pop = E.back(P(u, 0, 0.3));
    const shake = u > 0.4 && u < 1.1 ? Math.sin(u * 60) * 0.1 : 0;
    const lid = P(u, 1.1, 1.5);
    em(ctx, '🎁', 180, 330, size * pop, { r: shake });
    if (u > 1.1) {
      rect(ctx, 180 - size * 0.4 - lid * 100, 330 - size * 0.4 - lid * 220, size * 0.8, size * 0.15, '#e63946', 1 - lid, 4);
      parts(ctx, u, 1.1, 180, 330, 10, { ch: '✨', size: 16, life: 0.6, v: 150, g: 0 });
    }
  }
  if (t >= 4 * T) {
    const u = t - 4 * T;
    em(ctx, '🧦', 180, 330, 60 * E.back(P(u, 0, 0.4)), { r: Math.sin(u * 3) * 0.1 });
    em(ctx, '😑', 180, 480, 80 * P(u, 0.5, 0.8));
    txt(ctx, 'Sokken.', 180, 560, 30, '#c0397a', P(u, 0.9, 1.2));
  } else {
    txt(ctx, 'Pakje ' + (stage + 1) + ' van 4', 180, 540, 22, '#c0397a');
  }
  end(ctx);
});

// ---------- DIEREN EN NATUUR ----------
add('e33', 'Pinguïnglijbaan', 'Het spel heet eigenlijk pingpong.', 7, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#bfe9ff', bot: '#effaff' });
  rect(ctx, -30, 520, w + 60, 140, '#2e86d6');
  for (let x = -20; x < 400; x += 36) circle(ctx, x + Math.sin(t * 2 + x) * 5, 520, 18, '#4fa5ee');
  // ijsbaan
  ctx.save(); ctx.fillStyle = '#e6f6ff'; ctx.beginPath(); ctx.moveTo(-30, 180); ctx.lineTo(130, 180); ctx.lineTo(250, 400); ctx.lineTo(250, 520); ctx.lineTo(-30, 520); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#a9d4ee'; ctx.lineWidth = 5; ctx.stroke(); ctx.restore();
  const sealY = 470 + Math.sin(t * 4) * 3;
  em(ctx, '🦭', 300, sealY, 80);
  const L = 7;
  let x, y, r;
  const sx0 = 40, sy0 = 150;
  if (t < 1.6) { const k = E.in(P(t, 0, 1.6)); x = 40 + k * 0; x = lerp(sx0, 250, k); y = lerp(150, 380, E.in(k)); if (k < 0.3) y = lerp(150, 175, k / 0.3); else { const kk = (k - 0.3) / 0.7; x = lerp(130, 250, kk); y = lerp(175, 385, kk); } if (k < 0.3) x = lerp(40, 130, k / 0.3); r = k < 0.3 ? 1.57 : 2.3; }
  else if (t < 3.2) { const k = P(t, 1.6, 3.2); x = lerp(250, 292, k); y = 385 + (-arc(k, 90)) + k * 50; r = 2.3 - k * 3; }
  else if (t < 3.5) { x = 292; y = 405 + (t - 3.2) * 60; r = 0; }
  else if (t < 5.4) { const k = P(t, 3.5, 5.4); x = lerp(292, 40, k); y = lerp(420, 150, k) - arc(k, 210); r = k * 12.5; }
  else { x = 40; y = 150; r = 0; }
  if (t > 3.2 && t < 3.6) txt(ctx, 'BOING', 300, 360, 24, '#fff', 1);
  shadow(ctx, x, 530, 16, 0.2 * (y < 500 ? 1 : 0));
  em(ctx, '🐧', x, y - 14, 48, { r });
  if (t > 5.4) txt(ctx, 'Nog een keer!', 130, 110, 22, '#2b6cb0', P(t, 5.4, 5.8));
  end(ctx);
});

add('e34', 'Wifi-giraf', 'Alleen bovenin heeft hij bereik.', 7, (ctx, t, w, h) => {
  const stretch = E.io(P(t, 1.2, 4.2));
  const roof = 5.3;
  begin(ctx, w, h, { top: '#9ad8ff', bot: '#e6f7ff', gy: 540, gc: '#7ec06a', sh: t > 3.6 && t < 4.4 ? shk(t, 5) : [0, 0] });
  // schuur
  rect(ctx, 20, 280, 320, 260, '#b5472f', 1, 4);
  for (let x = 40; x < 340; x += 40) line(ctx, x, 280, x, 540, '#8d3321', 2);
  if (t < 3.7) {
    ctx.save(); ctx.fillStyle = '#6e2b1e'; ctx.beginPath(); ctx.moveTo(0, 290); ctx.lineTo(180, 180); ctx.lineTo(360, 290); ctx.closePath(); ctx.fill(); ctx.restore();
  } else {
    ctx.save(); ctx.fillStyle = '#6e2b1e'; ctx.beginPath(); ctx.moveTo(0, 290); ctx.lineTo(120, 215); ctx.lineTo(150, 255); ctx.lineTo(0, 290); ctx.fill();
    ctx.beginPath(); ctx.moveTo(360, 290); ctx.lineTo(240, 215); ctx.lineTo(210, 255); ctx.fill(); ctx.restore();
    parts(ctx, t, 3.7, 180, 220, 14, { rect: true, size: 18, col: '#6e2b1e', v: 240, g: 500, life: 1.4, a0: -2.9, a1: -0.2 });
  }
  const sy = lerp(1, 2.8, stretch);
  ctx.save(); ctx.translate(180, 540); ctx.scale(1, sy);
  em(ctx, '🦒', 0, -60, 120);
  ctx.restore();
  const headY = 540 - 120 * sy;
  const bars = Math.min(4, Math.floor(stretch * 4.99));
  rect(ctx, 250, 40, 100, 52, 'rgba(0,0,0,0.5)', 1, 10);
  for (let i = 0; i < 4; i++) rect(ctx, 264 + i * 18, 78 - (i + 1) * 9, 12, (i + 1) * 9, i < bars ? '#4cff7a' : '#777', 1, 2);
  if (stretch > 0.95 && t > 4.4) {
    em(ctx, '📶', 80, 70, 40);
    txt(ctx, 'Eindelijk 5G', 90, 120, 22, '#fff', P(t, 4.4, 4.8));
    em(ctx, '📱', 220, 40, 0);
  }
  if (t > 5.4) {
    const k = P(t, 5.4, 6.2);
    em(ctx, '🦒', 180, 540 - 0, 0);
    txt(ctx, 'Uploaden...', 180, headY - 20, 18, '#222', k);
  }
  end(ctx);
});

add('e35', 'Hoedvangst', 'Dat ging niet over de vis.', 7, (ctx, t, w, h) => {
  begin(ctx, w, h, { top: '#bfe8ff', bot: '#f2fbff' });
  rect(ctx, -30, 330, w + 60, 340, '#2e86d6');
  const bob = Math.sin(t * 2) * 4;
  // wolk en zon
  circle(ctx, 300, 90, 40, '#ffe27a');
  em(ctx, '☁️', 90, 100, 70);
  // boot
  em(ctx, '🛶', 180, 330 + bob, 190);
  const hat = t < 4.1 ? 1 : 0;
  em(ctx, t < 2.2 ? '🧔' : t < 4.0 ? '😞' : '😮', 180, 270 + bob, 74);
  em(ctx, '🎣', 215, 250 + bob, 60, { r: 0.1 });
  const boot = P(t, 1.4, 2.4);
  if (t > 1.4 && t < 4.4) line(ctx, 242, 232 + bob, 270, 232 + bob + 50 + (1 - boot) * 120, '#333', 1.5);
  if (t > 1.4 && t < 4.4) em(ctx, '👢', 270, 290 + bob + (1 - E.out(boot)) * 150, 38, { r: 0.4 });
  if (t > 2.8 && t < 4.0) txt(ctx, 'Een laars...', 270, 220, 16, '#333', 1);
  if (t < 4.1) em(ctx, '🎩', 180, 225 + bob, 46);
  // vis springt en pakt de hoed
  if (t >= 3.8) {
    const k = P(t, 3.8, 5.6);
    const fx = lerp(40, 330, k), fy = 330 - arc(k, 220) * 1 + 0;
    const hk = P(t, 4.1, 4.8);
    em(ctx, '🐟', fx, fy, 56, { r: lerp(-0.9, 0.9, k), fx: true });
    if (t >= 4.1) em(ctx, '🎩', lerp(180, fx - 0, hk), lerp(225 + bob, fy - 26, hk), 38, { r: hk * 3 });
    if (t > 5.5 && t < 6.2) em(ctx, '🎩', 360, 330, 0);
    if (k > 0.97) parts(ctx, t, 5.6, 330, 330, 0, {});
  }
  if (t > 3.8 && t < 4.3) parts(ctx, t, 3.8, 40, 335, 12, { cols: ['#fff', '#bfe6ff'], g: 500, v: 200, life: 0.7, a0: -2.2, a1: -0.8 });
  if (t > 5.6) parts(ctx, t, 5.6, 330, 335, 12, { cols: ['#fff', '#bfe6ff'], g: 500, v: 200, life: 0.7, a0: -2.2, a1: -0.8 });
  if (t > 5.8) txt(ctx, '😎', 335, 300, 0);
  if (t > 5.7) { em(ctx, '😎', 262, 395, 40 * P(t, 5.7, 6)); em(ctx, '🎩', 262, 365, 34 * P(t, 5.7, 6)); }
  end(ctx);
});

add('e36', 'Eikel', 'Tien jaar later, een kwestie van geduld.', 7.5, (ctx, t, w, h) => {
  const tl = P(t, 1.8, 5.2);
  const day = Math.floor(t * 5) % 2;
  const night = t > 1.8 && t < 5.2 ? (Math.sin(t * 14) > 0 ? 1 : 0) : 0;
  begin(ctx, w, h, { top: night ? '#1b2250' : '#9ad8ff', bot: night ? '#34408a' : '#eaf8ff', gy: 520, gc: night ? '#2c5a35' : '#6cbf59' });
  if (night) em(ctx, '🌙', 290, 80, 60); else em(ctx, '☀️', 290, 80, 60 + (t > 1.8 && t < 5.2 ? 8 : 0));
  // boom
  const gh = E.io(tl);
  const trunkH = gh * 300;
  if (t > 2.8) {
    const sp = P(t, 2.4, 3.0);
    rect(ctx, 168, 520 - trunkH, 24, trunkH + 2, '#7a4a28', 1, 4);
    const cr = E.io(P(t, 3.4, 5.2)) * 110;
    circle(ctx, 180, 520 - trunkH - cr * 0.3, cr, '#3e9a40');
    circle(ctx, 140, 520 - trunkH + cr * 0.1, cr * 0.7, '#4aae4c');
    circle(ctx, 225, 520 - trunkH + cr * 0.1, cr * 0.7, '#4aae4c');
  }
  if (t < 1.4) em(ctx, '🌰', 180, 508, 28);
  else if (t < 2.4) { const k = P(t, 1.4, 2.4); em(ctx, '🌰', 180, 508 + k * 8, 28 * (1 - k * 0.5), { a: 1 - k }); }
  // eekhoorn
  let sqy = 500, sqx = 90;
  if (t < 1.3) { sqx = lerp(30, 150, E.io(P(t, 0, 1.3))); }
  else if (t < 2.4) { sqx = 150; }
  else { sqx = lerp(150, 180, P(t, 2.4, 3.0)); sqy = 500 - trunkH * (t > 2.8 ? 1 : 0) ; }
  if (t > 2.0 && t < 5.4) sqy = 500 - trunkH - (t > 5.2 ? 0 : 0);
  if (t >= 5.4) sqy = 500 - trunkH;
  const sqEm = (t > 3 && t < 7) ? '🐿️' : '🐿️';
  em(ctx, sqEm, sqx, sqy - (t > 2 && t < 5.4 ? 0 : 0), 54, { fx: t < 2.4 });
  if (t > 5.4) txt(ctx, '10 jaar later', 180, 590, 24, '#fff', P(t, 5.4, 5.8));
  if (t > 6.3) {
    const k = P(t, 6.3, 6.8);
    em(ctx, '🌰', 180, 520 - trunkH - 150 + E.in(k) * 150, 26, { a: k < 1 ? 1 : 0 });
    if (t > 6.8) { txt(ctx, 'AU', 200, 520 - trunkH - 30, 24, '#e33', 1 - P(t, 6.8, 7.4)); }
  }
  end(ctx);
});

// ---------- FEESTDAGEN ----------
add('e37', 'Schoen zetten', 'Pepernoten zijn het niet.', 8, (ctx, t, w, h) => {
  const morning = t > 5.0;
  begin(ctx, w, h, { top: morning ? '#ffe9b0' : '#0f1530', bot: morning ? '#fff5da' : '#26305e', gy: 520, gc: morning ? '#c49a6c' : '#3a2a22' });
  if (!morning) { em(ctx, '🌙', 290, 80, 56); for (let i = 0; i < 10; i++) circle(ctx, rnd(i) * 360, rnd(i + 3) * 220, 1.5 + Math.sin(t * 3 + i), '#fff'); }
  else em(ctx, '☀️', 290, 80, 60);
  em(ctx, '👞', 100, 495, 56, { r: 0 });
  const carrot = t < 2.2 ? 1 : 0;
  if (t < 2.2) em(ctx, '🥕', 100, 462 + (t < 0.4 ? (0.4 - t) * -200 : 0), 28);
  // paard
  const hx = lerp(420, 230, E.out(P(t, 0.8, 2.0)));
  if (t > 0.8 && t < 4.6) {
    const eat = t > 2 && t < 3.2 ? Math.sin(t * 20) * 0.06 : 0;
    em(ctx, '🐴', t < 2.0 ? hx : (t < 4.0 ? 230 : lerp(230, 430, E.in(P(t, 4.0, 4.7)))), 450, 120, { r: eat, fx: false });
    if (t > 2.0 && t < 3.2) em(ctx, '🥕', 160, 470, 0);
    if (t > 2.0 && t < 3.2) txt(ctx, 'nom nom', 220, 370, 18, '#fff');
  }
  if (t > 3.4 && t < 4.4) for (let i = 0; i < 5; i++) {
    const k = P(t, 3.5 + i * 0.1, 4.0 + i * 0.1);
    circle(ctx, lerp(300, 100, k) + i, lerp(460, 495, E.in(k)) - arc(k, 40), 7, '#6b4a2a', k > 0 ? 1 : 0);
  }
  if (t > 4.5 && t < 5.0) { rect(ctx, -30, -30, w + 60, h + 60, '#fff', P(t, 4.5, 5.0)); }
  if (morning) {
    for (let i = 0; i < 5; i++) circle(ctx, 80 + i * 10 + (i % 2) * 5, 500 - (i % 2) * 6, 7, '#6b4a2a');
    em(ctx, '👞', 100, 495, 0);
    const u = t - 5.0;
    const k1 = u > 1 ? 1 : 0;
    em(ctx, u < 1.2 ? '😍' : u < 2.2 ? '😋' : '🤢', 240, 440, 100);
    if (u > 1.2 && u < 2.2) em(ctx, '🤤', 240, 0, 0);
    if (u > 2.2) txt(ctx, 'Paardenkeutels!', 180, 300, 28, '#8a4b1a', P(u, 2.2, 2.5));
    if (u > 2.4) parts(ctx, u, 2.4, 240, 420, 8, { ch: '💢', size: 20, life: 0.8, v: 100, g: 0 });
  }
  end(ctx);
});

add('e38', 'Kerstboom', 'Dit werd zijn mooiste kerst. Even.', 8, (ctx, t, w, h) => {
  const fall = 5.0;
  begin(ctx, w, h, { top: '#10302a', bot: '#1e5a46', gy: 540, gc: '#f1f6fa', sh: t > fall + 0.6 && t < fall + 0.9 ? shk(t, 8) : [0, 0] });
  for (let i = 0; i < 14; i++) circle(ctx, (rnd(i) * 360 + t * 8) % 360, (rnd(i + 5) * 600 + t * 20) % 540, 2, '#fff', 0.7);
  const tilt = t > fall ? E.in(P(t, fall, fall + 0.8)) * 1.45 : 0;
  ctx.save(); ctx.translate(200, 540); ctx.rotate(tilt);
  em(ctx, '🎄', 0, -150, 300);
  // lampjes
  const wrap = P(t, 0.4, 3.0);
  for (let i = 0; i < 16 * wrap; i++) {
    const yy = -40 - i * 14, xx = Math.sin(i * 1.3) * (90 - i * 4.8);
    circle(ctx, xx, yy - 10, 5, ['#ff4d4d', '#ffd24a', '#4dd2ff'][(i + Math.floor(t * 3)) % 3], t > 3.0 ? (Math.sin(t * 8 + i) > -0.3 ? 1 : 0.4) : 1);
  }
  const starFall = t > fall + 0.6;
  if (!starFall) em(ctx, '⭐', 0, -296, 40);
  ctx.restore();
  if (starFall) { const u = t - fall - 0.6; em(ctx, '⭐', 200 + Math.sin(tilt) * 296 + u * 60, Math.min(520, 540 - Math.cos(tilt) * 296 + E.in(P(u, 0, 0.5)) * 100) , 40, { r: u * 8 }); }
  // persoon
  const px = 60;
  em(ctx, t < 3.0 ? '🧑' : t < fall + 0.5 ? '😊' : '😳', px, 495, 70);
  if (t > 0.4 && t < 3.0) em(ctx, '🧶', 100 + wrap * 40 - 40, 500, 0);
  // kat
  if (t > 3.2) {
    const k = P(t, 3.2, fall);
    let cx = lerp(340, 220, E.out(P(t, 3.2, 3.8)));
    let cy = 505;
    if (t > 3.8 && t < fall) { cy = lerp(505, 330, E.io(P(t, 3.8, fall))); cx = 220 - (505 - cy) * 0.1; }
    if (t > fall) { cx = 200 + Math.sin(tilt) * 180; cy = 540 - Math.cos(tilt) * 180 ; cy = Math.min(cy, 500); cx = Math.min(cx, 330); }
    em(ctx, t > fall + 0.7 ? '😼' : '🐈', cx, cy, 52);
    if (t > fall + 0.7) txt(ctx, 'Mission accomplished', 190, 590, 18, '#fff', P(t, fall + 0.7, fall + 1.1));
  }
  if (t > fall) txt(ctx, 'KRAAAK', 200, 140, 36, '#ff7a5a', P(t, fall, fall + 0.2) * (1 - P(t, fall + 0.9, fall + 1.4)), -0.1);
  end(ctx);
});

add('e39', 'Vuurwerk', 'Een raket met eigen plannen.', 8, (ctx, t, w, h) => {
  const boom = 6.0;
  begin(ctx, w, h, { top: '#05061a', bot: '#161a44', gy: 520, gc: '#2a2a35', sh: t > boom && t < boom + 0.5 ? shk(t, 10) : [0, 0] });
  for (let i = 0; i < 25; i++) circle(ctx, rnd(i) * 360, rnd(i + 2) * 400, 1.2, '#fff', 0.6 + 0.4 * Math.sin(t * 3 + i));
  txt(ctx, '23:59:' + String(Math.min(59, 50 + Math.floor(t * 1.5))).padStart(2, '0'), 180, 40, 22, '#ffd24a');
  em(ctx, '🏠', 300, 470, 110);
  // man
  let mx = 40;
  if (t > 1.4) mx = lerp(40, 160, E.out(P(t, 1.4, 2.0)));
  if (t > 3.4) mx = lerp(160, 70, E.io(P(t, 3.4, 4.6)));
  em(ctx, t < 1.4 ? '🧍' : (t < 3.4 ? '😬' : (t < boom ? '😱' : '😎')), mx, 480, 56);
  if (t < 1.4) em(ctx, '🔥', mx + 28, 480, 18);
  // raket
  let rx = 120, ry = 480, rr = 0;
  if (t < 1.8) { rx = 120; ry = 480; rr = 0; }
  else if (t < 2.6) { rx = 120; ry = 480; rr = P(t, 1.8, 2.6) * 1.57; }
  else if (t < 4.6) { const k = P(t, 2.6, 4.6); rr = 1.57; rx = 120 + k * 0 + Math.sin(k * 6) * 10 + k * 210; ry = 495 - Math.abs(Math.sin(k * 14)) * 24; if (k > 0.5) ry = 495 - Math.sin(k * 9) * 36; }
  else { rr = 1.57; rx = 330; ry = 495; }
  if (t < boom) {
    ctx.save(); ctx.translate(rx, ry); ctx.rotate(rr);
    rect(ctx, -4, -26, 8, 40, '#e63946', 1, 3); rect(ctx, -2, 12, 4, 30, '#b88a5a', 1);
    ctx.restore();
    if (t > 1.8) parts(ctx, (t * 3) % 1, 0, rx - Math.sin(rr) * -0 - 22 * (rr > 1 ? 1 : 0), ry + 14, 0, {});
    if (t > 1.8) for (let i = 0; i < 6; i++) { const u = (t * 4 + i * 0.17) % 1; circle(ctx, rx - 24 * Math.sin(rr) - u * 40 * Math.sin(rr), ry + 24 * Math.cos(rr) * 0 + 8 - u * 6, 4 * (1 - u), i % 2 ? '#ffd24a' : '#ff7a1a', 1 - u); }
  }
  if (t > boom) {
    const cols = ['#ff4d6d', '#ffd24a', '#4dd2ff', '#7ae35a', '#d17aff'];
    parts(ctx, t, boom, 320, 440, 40, { cols, size: 6, v: 420, g: 150, life: 1.8 });
    parts(ctx, t, boom + 0.3, 320, 440, 30, { cols, size: 5, v: 300, g: 150, life: 1.6, seed: 4 });
    flash(ctx, w, h, 0.8 * (1 - P(t, boom, boom + 0.3)), '#ffe9b0');
    em(ctx, '🏚️', 300, 470, 110);
    txt(ctx, 'GELUKKIG NIEUWJAAR', 180, 200, 24, '#ffd24a', P(t, boom + 0.5, boom + 0.9));
    em(ctx, '😎', 60, 480, 0);
  }
  end(ctx);
});

add('e40', 'Sneeuwpop in april', 'Alleen de wortel overleefde de lente.', 7.5, (ctx, t, w, h) => {
  const melt = E.io(P(t, 1.0, 4.0));
  begin(ctx, w, h, { top: lerp(0, 1, melt) > 0.5 ? '#8fd8ff' : '#c8d8ea', bot: '#f2fbff', gy: 500, gc: melt > 0.7 ? '#7ec06a' : '#f1f6fa' });
  const sunS = 50 + melt * 60;
  em(ctx, '☀️', 290, 80, sunS);
  // plas
  ctx.save(); ctx.fillStyle = '#8bd0ff'; ctx.beginPath(); ctx.ellipse(160, 505, 20 + melt * 70, 5 + melt * 12, 0, 0, TAU); ctx.fill(); ctx.restore();
  if (melt < 0.98) em(ctx, '⛄', 160, 500 - 70 * (1 - melt) * 1, 150, { sx: 1 + melt * 0.5, sy: 0.12 + 0.88 * (1 - melt) });
  // wortel
  const carrotUp = t < 4.4;
  if (t < 5.2) em(ctx, '🥕', 160, lerp(440, 498, melt), 30, { r: lerp(-1.57, 0.4, melt) });
  // bloemen
  const fl = E.back(P(t, 4.0, 5.0));
  if (t > 4.0) { for (let i = 0; i < 5; i++) em(ctx, '🌷', 40 + i * 70, 520, 36 * fl); }
  // konijn
  if (t > 4.4) {
    const k = P(t, 4.4, 5.6);
    const hop = k < 1 ? Math.abs(Math.sin(k * 9)) * 18 : 0;
    const rx = lerp(-40, 190, E.out(k));
    if (t < 6.0) em(ctx, '🐇', rx, 480 - hop, 70, { fx: true });
    if (t >= 5.2) em(ctx, '🥕', rx - 20, 468 - hop, 28, { r: 0.8 });
  }
  if (t > 5.6) {
    const k = P(t, 5.6, 7.4);
    em(ctx, '🐇', lerp(190, 440, E.in(k)), 480 - Math.abs(Math.sin(k * 14)) * 18, 70, { fx: true });
    em(ctx, '🥕', lerp(170, 420, E.in(k)), 468 - Math.abs(Math.sin(k * 14)) * 18, 28, { r: 0.8 });
    if (k < 0.4) txt(ctx, 'Bedankt!', 190, 400, 22, '#fff', 1 - k * 2.5);
  }
  if (t > 1.0 && t < 4.0) txt(ctx, 'Plop... plop...', 160, 380, 20, '#2b6cb0', 0.6 + 0.4 * Math.sin(t * 8));
  end(ctx);
});
