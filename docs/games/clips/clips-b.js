// Gamescroller – clips B (b01..b40). Alle draw()-functies zijn pure functies van t.
const PI = Math.PI;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, p) => a + (b - a) * p;
const pr = (t, a, b) => clamp((t - a) / (b - a));
const eo = p => 1 - Math.pow(1 - p, 3);
const ei = p => p * p * p;
const eio = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const bounceE = p => {
  const n = 7.5625, d = 2.75;
  if (p < 1 / d) return n * p * p;
  if (p < 2 / d) { p -= 1.5 / d; return n * p * p + 0.75; }
  if (p < 2.5 / d) { p -= 2.25 / d; return n * p * p + 0.9375; }
  p -= 2.625 / d; return n * p * p + 0.984375;
};
const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const tri = x => { const f = x - Math.floor(x); return f < 0.5 ? f * 2 : 2 - f * 2; };
const arc = (u, h) => 4 * h * u * (1 - u); // parabool 0..1 -> hoogte h

function sky(c, w, h, a, b) {
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, a); g.addColorStop(1, b);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
}
function ground(c, w, h, y, col, line) {
  c.fillStyle = col; c.fillRect(0, y, w, h - y);
  c.fillStyle = line || 'rgba(0,0,0,.25)'; c.fillRect(0, y, w, 3);
}
function E(c, ch, x, y, s = 64, r = 0, a = 1, fx = 1, fy = 1) {
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(r); c.scale(fx, fy);
  c.font = s + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(ch, 0, 0); c.restore();
}
function T(c, s, x, y, sz = 28, col = '#fff', r = 0, a = 1) {
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(r);
  c.font = 'bold ' + sz + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineWidth = 5; c.lineJoin = 'round'; c.strokeStyle = 'rgba(0,0,0,.65)'; c.strokeText(s, 0, 0);
  c.fillStyle = col; c.fillText(s, 0, 0); c.restore();
}
function sh(c, x, y, rw, a = 0.3) {
  c.save(); c.fillStyle = 'rgba(0,0,0,' + a + ')'; c.beginPath();
  c.ellipse(x, y, Math.max(1, rw), Math.max(1, rw * 0.25), 0, 0, 7); c.fill(); c.restore();
}
function shake(c, amt, t) { c.translate(Math.sin(t * 91) * amt, Math.cos(t * 77) * amt); }
function burst(c, x, y, t0, t, n, col, spd = 160, life = 0.8, g = 300, sz = 6) {
  const p = t - t0;
  if (p < 0 || p > life) return;
  c.save();
  for (let i = 0; i < n; i++) {
    const a = rnd(i + 1) * 6.283, v = spd * (0.4 + rnd(i + 50));
    c.globalAlpha = 1 - p / life;
    c.fillStyle = Array.isArray(col) ? col[i % col.length] : col;
    c.beginPath();
    c.arc(x + Math.cos(a) * v * p, y + Math.sin(a) * v * p + 0.5 * g * p * p, Math.max(0.5, sz * (1 - (p / life) * 0.5)), 0, 7);
    c.fill();
  }
  c.restore();
}
function flash(c, w, h, t, t0, len = 0.25, col = '#fff') {
  const p = (t - t0) / len;
  if (p < 0 || p > 1) return;
  c.save(); c.globalAlpha = 1 - p; c.fillStyle = col; c.fillRect(0, 0, w, h); c.restore();
}
function stars(c, w, h, t, n = 40) {
  c.save(); c.fillStyle = '#fff';
  for (let i = 0; i < n; i++) {
    c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i));
    c.fillRect(rnd(i) * w, rnd(i + 99) * h * 0.8, 2, 2);
  }
  c.restore();
}
function lines(c, w, h, t, n, col, len, spd, dir = -1) {
  c.save(); c.strokeStyle = col; c.lineWidth = 2;
  for (let i = 0; i < n; i++) {
    const y = rnd(i + 3) * h, x = (((rnd(i + 7) * w + dir * spd * t) % (w + len)) + (w + len)) % (w + len) - len;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + len, y); c.stroke();
  }
  c.restore();
}
const K = (id, title, caption, dur, fn) => ({
  id, title, caption, dur,
  draw(ctx, t, w, h) {
    t = ((t % dur) + dur) % dur;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    fn(ctx, t, w, h);
    ctx.restore();
  },
});

export const CLIPS = [
  // b01 – achtervolging, omkering
  K('b01', 'Ontsnapte pizza', 'Hij rende niet weg, hij rende ergens naartoe.', 7, (c, t, w, h) => {
    sky(c, w, h, '#ffe8b0', '#ffc27a'); ground(c, w, h, 500, '#b5651d');
    const run = pr(t, 1.3, 4), turn = pr(t, 4, 4.6);
    let px = t < 1.3 ? 250 : lerp(250, 100, run), py = 470;
    if (t < 1.3) py = 440 - (t > 1 ? Math.sin(pr(t, 1, 1.3) * PI) * 50 : 0);
    else if (t < 4.6) py = 470 - Math.abs(Math.sin(t * 14)) * 22;
    else px = 100 + 150 * pr(t, 4.6, 7), py = 470 - Math.abs(Math.sin(t * 16)) * 26;
    const ps = 56 + 110 * eo(turn);
    let cx = t < 4.5 ? px + 110 : 210 + 330 * ei(pr(t, 4.5, 6.2));
    if (t < 1.3) cx = 330;
    else if (t < 4) cx = lerp(330, px + 110, pr(t, 1.3, 2));
    if (t < 1.3) { E(c, '🍽️', 250, 480, 90); }
    sh(c, px, 505, ps * 0.5);
    E(c, '🍕', px, py - (ps - 56) * 0.4, ps, Math.sin(t * 20) * (t > 1 && t < 4 ? 0.2 : 0.05));
    const fl = t > 4.5;
    E(c, fl ? '😱' : (t < 1.3 ? '🤤' : '😠'), cx, 440 - Math.abs(Math.sin(t * 14)) * 18, 64);
    if (t > 4.8) T(c, 'HELP!', cx - 10, 350, 30, '#ff4');
  }),
  // b02 – smelten, krimpen
  K('b02', 'Het smeltende ijsje', 'Zomer. Het ijsje had er maar kort plezier van.', 6.5, (c, t, w, h) => {
    const heat = pr(t, 0, 4);
    sky(c, w, h, `rgb(255,${220 - 60 * heat | 0},${140 - 60 * heat | 0})`, '#ffd9a0'); ground(c, w, h, 520, '#d9b27c');
    E(c, t < 3 ? '🌞' : '😎', 290, 110, 70 + 120 * eo(heat), t * 0.5);
    const k = 1 - 0.9 * eo(pr(t, 0.5, 4));
    E(c, '🧒', 90, 470, 90);
    c.fillStyle = 'rgba(255,170,200,.85)';
    c.beginPath(); c.ellipse(190, 522, 10 + 100 * eo(pr(t, 1, 4.2)) * (1 - pr(t, 5, 6)), 6 + 12 * eo(pr(t, 1, 4.2)) * (1 - pr(t, 5, 6)), 0, 0, 7); c.fill();
    if (t < 4.3) E(c, '🍦', 190, 520 - 45 * k - (t > 4 ? ei(pr(t, 4, 4.3)) * 30 : 0), 90 * k, 0);
    const dx = lerp(420, 240, eo(pr(t, 4, 4.8)));
    if (t > 4) E(c, '🐕', dx + Math.sin(t * 20) * 3, 490, 70, 0, 1 - pr(t, 6, 6.5), -1);
    if (t > 3) E(c, '😭', 90, 470, 0 + 0);
    if (t > 3) { c.save(); E(c, '😭', 90, 440, 52); c.restore(); }
    if (t > 5.4) E(c, '😋', 240, 440, 40);
  }),
  // b03 – cirkelen, duikvlucht, groeien
  K('b03', 'Frietje vs meeuw', 'De meeuw won. Net als altijd.', 7, (c, t, w, h) => {
    sky(c, w, h, '#9fe0ff', '#fff3c4'); ground(c, w, h, 500, '#f2d28b');
    const swoops = [1.4, 3.0, 4.6];
    const taken = swoops.filter(s => t > s).length;
    let gx = 250 + 90 * Math.cos(t * 2), gy = 190 + 60 * Math.sin(t * 3), gs = 56 + 22 * taken;
    swoops.forEach(s => {
      const p = pr(t, s - 0.5, s + 0.5);
      if (p > 0 && p < 1) { const k = Math.sin(p * PI); gx = lerp(gx, 160, k); gy = lerp(gy, 440, k); }
    });
    let fall = 0;
    if (t > 5.3) { const p = pr(t, 5.3, 6); gx = lerp(gx, 250, 0.5); gy = lerp(gy, 470, eo(p) * 0.5 + 0.0); gy = lerp(250, 478, ei(p)); gx = 250; fall = p; }
    E(c, t > 5.3 && fall >= 1 ? '😵' : '🧍', 90, 450, 110);
    for (let i = 0; i < 3 - taken; i++) E(c, '🍟', 150 + i * 14, 430 - i * 4, 40, -0.3 + i * 0.3);
    sh(c, gx, 505, gs * 0.5, 0.25 * (fall || 0.4));
    E(c, '🐦', gx, gy, gs, (t > 5.3 ? fall * 0.8 : Math.sin(t * 6) * 0.3), 1, Math.cos(t * 2) > 0 ? -1 : 1);
    burst(c, 250, 495, 6, t, 14, ['#fff', '#ffe27a'], 140, 0.7);
    if (t > 6.1) T(c, '*plof*', 250, 410, 28, '#fff');
  }),
  // b04 – penalty: heen en terug
  K('b04', 'De penalty', 'De bal had het zich bedacht.', 6.5, (c, t, w, h) => {
    sky(c, w, h, '#7ed0ff', '#c9f0ff'); ground(c, w, h, 500, '#3da646', 'rgba(255,255,255,.7)');
    E(c, '🥅', 295, 440, 120);
    const out = pr(t, 1, 2.2), back = pr(t, 3.4, 4.7);
    let bx = 85, by = 485;
    if (t >= 1 && t < 3.4) { bx = lerp(85, 255, eo(out)); by = 485 - arc(out, 40) * (1 - out); }
    else if (t >= 3.4) { bx = lerp(255, 100, back); by = 485; }
    const dive = pr(t, 1.5, 2.2) * (1 - pr(t, 3.8, 4.4));
    E(c, '🤾', 295 - dive * 45, 450 - dive * 20, 70, -dive * 1.2 + (dive > 0 ? 0 : 0));
    let kx = 60, kr = 0;
    if (t > 4.7) { const p = pr(t, 4.7, 5.6); kx = 60 - 90 * eo(p); kr = -p * 3; }
    E(c, '🧍', kx, 455 - (t > 4.7 ? arc(pr(t, 4.7, 5.6), 70) : 0), 90, kr);
    sh(c, bx, 505, 14);
    E(c, '⚽', bx, by, 36, (t < 3.4 ? bx : -bx) / 14);
    if (t > 2.4 && t < 3.4) T(c, '?', 255, 400, 36, '#fff', Math.sin(t * 8) * 0.2);
    if (t > 4.7) { burst(c, 90, 460, 4.7, t, 10, '#ffe94a', 120, 0.6, 200); T(c, 'AU!', 100, 380, 32, '#ff5', -0.2, 1 - pr(t, 5.5, 6.5)); }
  }),
  // b05 – golven, inhalen
  K('b05', 'Zwemwedstrijd', 'Over de uitslag kan men twisten.', 6.5, (c, t, w, h) => {
    sky(c, w, h, '#2f9bff', '#0b4a9c');
    c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 3;
    for (let y = 250; y < 640; y += 70) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    const sp = pr(t, 0, 4.4), sx = 30 + 270 * (sp + 0.25 * sp * sp) / 1.25;
    const bob = Math.sin(t * 9) * 5;
    const shx = sx - 160 + 230 * eo(pr(t, 0.8, 4.8)) + (t < 0.8 ? 0 : 0);
    c.fillStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i < 40; i++) { const x = (i * 9) % 360; c.fillRect(x, 392 + Math.sin(t * 5 + i) * 4, 6, 3); }
    E(c, '🦈', Math.min(shx, 320), 395 + Math.sin(t * 7) * 5, 74, 0, 1, -1);
    E(c, '🏊', Math.min(sx, 300), 380 + bob, 70, 0, 1, -1);
    if (t > 4.7) {
      const s = bounceE(pr(t, 4.7, 5.5));
      E(c, '🥇', 295, 300, 60 * s); E(c, '🥈', 255, 330, 50 * s);
      T(c, 'Foto-finish', 180, 200, 28, '#fff', 0, pr(t, 5, 5.5));
    }
  }),
  // b06 – camera uitzoomen
  K('b06', 'Hardloper', 'Hij liep al kilometers. Op dezelfde plek.', 7, (c, t, w, h) => {
    sky(c, w, h, '#d9c7f5', '#b9a0e0');
    const s = lerp(2.3, 1, eio(pr(t, 3.8, 5.5)));
    c.translate(180, 340); c.scale(s, s); c.translate(-180, -340);
    ground(c, w, h, 520, '#8a6a4a');
    E(c, '🛋️', 60, 480, 70); E(c, '🪴', 320, 490, 60); E(c, '🐈', 290, 475, 44 + Math.sin(t * 3) * 2);
    c.fillStyle = '#fff'; c.fillRect(24, 140, 312, 330);
    c.fillStyle = '#7ad0ff'; c.fillRect(30, 146, 300, 318);
    c.save(); c.beginPath(); c.rect(30, 146, 300, 318); c.clip();
    c.fillStyle = '#4caf50'; c.fillRect(30, 400, 300, 64);
    for (let i = 0; i < 6; i++) { const x = (((i * 90 - t * 300) % 540) + 540) % 540 - 100; E(c, '🌳', x, 380, 80); }
    c.restore();
    c.fillStyle = '#333'; c.fillRect(70, 462, 220, 16);
    c.fillStyle = '#666'; c.fillRect(70, 478, 220, 6);
    for (let i = 0; i < 8; i++) { c.fillStyle = '#555'; c.fillRect(((i * 30 - t * 150) % 240 + 240) % 240 + 70, 465, 6, 10); }
    E(c, '🏃', 180, 410 + Math.abs(Math.sin(t * 12)) * -10, 90, 0, 1, -1);
    if (t > 5.6) T(c, '10 km', 180, 100, 30, '#fff', 0, pr(t, 5.6, 6));
  }),
  // b07 – dominoval / lawine
  K('b07', 'Bowlen', 'Hij viel pas toen niemand keek.', 7.5, (c, t, w, h) => {
    sky(c, w, h, '#2b1b4d', '#5a3a8a'); ground(c, w, h, 450, '#d8a35a');
    c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(0, 462, w, 4);
    const bx = 20 + 90 * eo(pr(t, 0.5, 2.8));
    E(c, '🎱', bx, 430, 40, bx / 14);
    if (t > 3 && t < 4) { E(c, '🤷', 100, 360, 56); }
    for (let i = 0; i < 8; i++) {
      const x = 200 + i * 18, ts = 4 + i * 0.28;
      let a = 0;
      if (i === 0 && t > 3.3 && t < 4) a = Math.sin(t * 40) * 0.05;
      if (t > ts) a = eo(pr(t, ts, ts + 0.35)) * 1.5;
      c.save(); c.translate(x, 450); c.rotate(a);
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, -28, 7, 22, 0, 0, 7); c.fill();
      c.fillStyle = '#e33'; c.fillRect(-6, -42, 12, 4); c.restore();
    }
    if (t > 6.2) { const s = bounceE(pr(t, 6.2, 6.8)); T(c, 'STRIKE!', 180, 250, 52 * s, '#ffe94a', -0.1); }
    if (t > 6.2) shake(c, 3 * (1 - pr(t, 6.2, 6.8)), t);
  }),
  // b08 – salto en struikelen
  K('b08', 'Skate-trick', 'Hij haalde het obstakel. Het steentje niet.', 6.5, (c, t, w, h) => {
    sky(c, w, h, '#ffc4e1', '#ffe9b5'); ground(c, w, h, 500, '#777', '#555');
    E(c, '🪨', 200, 492, 26);
    let x = 40, y = 470, r = 0, bx = 0, br = 0, face = '🧑';
    if (t < 1.5) x = 40 + 60 * t;
    else if (t < 3) { const u = pr(t, 1.5, 3); x = 100 + 200 * u; y = 470 - arc(u, 190); br = u * 2 * PI * 2; }
    else if (t < 3.5) { x = 300; }
    else if (t < 4.7) { const u = pr(t, 3.5, 4.7); x = lerp(300, 205, eo(u)); face = '😎'; }
    else { const u = pr(t, 4.7, 5.8); x = lerp(205, 70, u); y = 470 - arc(u, 120); r = -u * 7; face = '😵'; }
    if (t >= 3 && t < 3.5) face = '😎';
    if (t > 5.8) { x = 70; y = 490; r = -PI / 2; }
    sh(c, x, 505, 26, 0.3 * (1 - clamp((470 - y) / 200)));
    E(c, '🛹', x, y + 38, 54, br, 1, t > 4.7 ? -1 : 1);
    E(c, face, x, y - 8, 56, r);
    if (t > 3 && t < 3.5) T(c, 'YEAH!', 300, 230, 30, '#fff');
    burst(c, 70, 495, 5.8, t, 12, '#ffffff', 130, 0.6, 250);
    if (t > 5.8) E(c, '💫', 70, 450, 40, t * 5, 1);
  }),
  // b09 – groeiende stapel, instorten
  K('b09', 'Huiswerk', 'Het was maar één opdracht, zei de leraar.', 7, (c, t, w, h) => {
    sky(c, w, h, '#fff2c2', '#ffe08a'); ground(c, w, h, 520, '#c28a4a');
    E(c, '🧒', 80, 470, 80, 0, 1, 1); E(c, t > 3 ? '😩' : '✏️', t > 3 ? 80 : 125, 470, t > 3 ? 70 : 34, Math.sin(t * 16) * 0.3);
    const n = Math.floor(1 + 16 * pr(t, 0.5, 4)), tp = pr(t, 4.9, 5.7);
    for (let i = 0; i < n; i++) {
      let x = 260 + (rnd(i) - 0.5) * 20, y = 505 - i * 22, r = (rnd(i + 20) - 0.5) * 0.3;
      if (tp > 0) { const q = tp * (1 + rnd(i) * 0.4); x += (rnd(i + 5) - 0.7) * 180 * q; y += ei(Math.min(1, q)) * (i * 22) * 0.9 - 0; r += q * (rnd(i + 8) - 0.5) * 6; }
      E(c, '📄', x, Math.min(y, 505), 46, r);
    }
    if (t > 4.1) { const x = lerp(430, 320, eo(pr(t, 4.1, 4.9))); E(c, '👩‍🏫', x, 470, 80); if (t > 5.4) T(c, 'Ook de achterkant!', 200, 300, 22, '#fff', 0, pr(t, 5.4, 5.8)); }
    if (t > 4.9) shake(c, 4 * (1 - tp), t);
  }),
  // b10 – schudden en papier-explosie
  K('b10', 'Printer', 'Toner leeg. Dat vertelde hij pas nu.', 6.5, (c, t, w, h) => {
    sky(c, w, h, '#e6ecf5', '#c5d0e0'); ground(c, w, h, 520, '#8b8f99');
    const amp = t < 2.2 ? 1 + 5 * pr(t, 0, 1.5) : 2;
    c.save(); if (t < 4.6) shake(c, amp, t);
    E(c, '🖨️', 200, 440, 130); c.restore();
    const kick = Math.sin(pr(t, 1.4, 2.2) * PI);
    E(c, t > 2.2 ? '😤' : '🧑‍💼', 70 + 55 * kick, 465, 80, -0.3 * kick);
    if (t < 2.2) { c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 14); T(c, 'PAPER JAM', 180, 280, 30, '#f44'); c.globalAlpha = 1; }
    for (let i = 0; i < 40; i++) {
      const ts = 2.2 + i * 0.05, p = t - ts;
      if (p < 0) continue;
      const x = 200 + (rnd(i) - 0.5) * 300 * Math.min(1, p * 1.3), y = 380 - 260 * Math.sin(Math.min(p * 1.4, PI / 2)) + 360 * Math.max(0, p - 0.8) * Math.max(0, p - 0.8);
      c.save(); c.translate(x, Math.min(y, 515)); c.rotate(p * (rnd(i + 2) - 0.5) * 8); c.fillStyle = '#fff'; c.fillRect(-14, -18, 28, 36); c.fillStyle = '#bbb'; c.fillRect(-9, -10, 18, 3); c.fillRect(-9, -2, 14, 3); c.restore();
    }
    if (t > 4.8) { const s = bounceE(pr(t, 4.8, 5.4)); c.save(); c.translate(180, 300); c.scale(s, s); c.fillStyle = '#fff'; c.fillRect(-120, -60, 240, 120); T(c, 'Toner leeg', 0, 0, 34, '#e22'); c.restore(); }
  }),
  // b11 – vergrijzen en tijd versnellen
  K('b11', 'De vergadering', 'Dit had een mailtje kunnen zijn.', 7.5, (c, t, w, h) => {
    sky(c, w, h, '#cfd8dc', '#90a4ae');
    const age = Math.floor(pr(t, 0.6, 5.6) * 5.99), faces = ['🧑', '👨', '🧔', '👴', '💀', '🪦'];
    c.fillStyle = '#7b4a2a'; c.beginPath(); c.ellipse(180, 400, 140, 70, 0, 0, 7); c.fill();
    const pos = [[90, 330], [180, 305], [270, 330], [90, 470], [180, 495], [270, 470]];
    pos.forEach((p, i) => E(c, i === 1 && t > 6 ? '🫡' : faces[Math.min(5, age + (i % 2 && age > 0 && age < 5 ? 0 : 0))], p[0], p[1], 64, Math.sin(t * 2 + i) * 0.08));
    c.save(); c.translate(180, 130); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 58, 0, 7); c.fill(); c.strokeStyle = '#333'; c.lineWidth = 5; c.stroke();
    const a = (t < 6 ? t : 6) * 40;
    c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(a) * 45, -Math.cos(a) * 45); c.stroke();
    c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(a / 12) * 30, -Math.cos(a / 12) * 30); c.stroke(); c.restore();
    for (let i = 0; i < 6; i++) E(c, '🕸️', 20 + i * 64, 20, 30, 0, pr(t, 3 + i * 0.3, 4 + i * 0.3));
    if (t > 6) { const s = bounceE(pr(t, 6, 6.5)); T(c, 'Dan nu: de rondvraag', 180, 600, 24 * s, '#fff'); }
    if (t > 6) T(c, '1 minuut later', 180, 40, 24, '#ffeb3b');
  }),
  // b12 – optillen en uitspugen
  K('b12', 'Alien-ontvoering', 'Ze zagen er verder niets in.', 6.5, (c, t, w, h) => {
    sky(c, w, h, '#06041a', '#1b2a5c'); stars(c, w, h, t);
    c.fillStyle = '#143d24'; c.beginPath(); c.ellipse(180, 650, 300, 160, 0, 0, 7); c.fill();
    let ux = 180, uy = 160 + Math.sin(t * 3) * 6;
    if (t < 1.2) ux = lerp(-60, 180, eo(t / 1.2));
    if (t > 5) { ux = 180 + 400 * ei(pr(t, 5, 5.8)); uy -= 120 * pr(t, 5, 5.8); }
    const beam = t > 1.2 && t < 4.6;
    if (beam) { c.fillStyle = 'rgba(255,255,120,.3)'; c.beginPath(); c.moveTo(ux - 25, uy + 25); c.lineTo(ux + 25, uy + 25); c.lineTo(ux + 80, 540); c.lineTo(ux - 80, 540); c.fill(); }
    const cy = lerp(540, 215, eo(pr(t, 1.5, 3.6)));
    if (t < 3.6) E(c, '🐄', 180 + Math.sin(t * 5) * 8, cy, 80, Math.sin(t * 3) * 0.4);
    const sx = t > 3.6 && t < 5 ? Math.sin(t * 60) * 4 : 0;
    E(c, '🛸', ux + sx, uy, 100);
    if (t > 3.6) { const p = pr(t, 3.8, 4.8); E(c, '🍔', 180, lerp(240, 520, ei(p)) - (p > 0.99 ? 0 : 0), 60, p * 6); if (p >= 1) burst(c, 180, 520, 4.8, t, 8, '#e8b04a', 100, 0.5); }
    if (t > 4.8 && t < 5.5) T(c, 'Hmm… vegetarisch?', 180, 330, 22, '#9f9');
    if (t > 3.6 && t < 3.9) flash(c, w, h, t, 3.6, 0.3, '#ff8');
  }),
  // b13 – lancering, raket vergeet astronaut
  K('b13', 'Lancering', 'Er was nog één ding vergeten.', 8, (c, t, w, h) => {
    sky(c, w, h, '#0c1d4f', '#f09a4a'); stars(c, w, h, t, 25); ground(c, w, h, 540, '#666');
    const cd = t < 3 ? 3 - Math.floor(t) : 0;
    if (t < 3) T(c, String(cd), 180, 200, 140 - 100 * (t % 1), '#fff', 0, 1 - (t % 1) * 0.6);
    const lift = pr(t, 3, 5.2), back = pr(t, 6.3, 7.4);
    let ry = 480 - 700 * ei(lift) + 700 * (1 - Math.pow(1 - back, 2)) * (t > 6.3 ? 1 : 0);
    if (t > 5.2 && t < 6.3) ry = -300;
    if (t > 6.3) ry = lerp(-300, 480, eo(back));
    c.save(); if (t > 3 && t < 4.5) shake(c, 3, t);
    if (t > 3 && ry > -120) for (let i = 0; i < 14; i++) { const q = (t * 4 + i / 14) % 1; c.fillStyle = `rgba(255,${200 - q * 140 | 0},60,${1 - q})`; c.beginPath(); c.arc(180 + (rnd(i) - 0.5) * 30 * q, ry + 60 + q * 90, 18 * (1 - q) + 4, 0, 7); c.fill(); }
    E(c, '🚀', 180, ry, 100, 0);
    c.restore();
    E(c, t < 5.6 ? '🧑‍🚀' : (t > 6.9 ? '😅' : '😮'), 280, 505, 60, 0, 1, t > 5.5 ? 1 : 1);
    if (t > 5.4 && t < 6.5) T(c, 'Hé!', 280, 440, 28, '#fff', 0.1);
    if (t > 7.4) burst(c, 180, 540, 7.4, t, 18, ['#bbb', '#fff'], 100, 0.6, 50, 9);
  }),
  // b14 – kortsluiting, tol
  K('b14', 'Robot-ober', 'Hij kwam een update tekort.', 6.5, (c, t, w, h) => {
    sky(c, w, h, '#26324d', '#46587e'); ground(c, w, h, 520, '#2a2f40', '#6df');
    let x = lerp(-50, 180, eo(pr(t, 0, 2))), rot = 0, show = '🤖';
    const g = pr(t, 2.4, 4);
    if (t > 2.4 && t < 4) { shake(c, 3 + g * 6, t); rot = ei(g) * 14; }
    if (t > 4) show = '☕';
    const bob = Math.abs(Math.sin(t * 7)) * (t < 2 ? 8 : 0);
    if (t < 4.2) { E(c, show, x, 440 - bob, 110, rot); E(c, '☕', x + 55, 430 - bob - (t > 3 ? 120 * ei(pr(t, 3, 3.7)) : 0), 40, t > 3 ? (t - 3) * 8 : 0, t > 3.8 ? 0 : 1); }
    else { E(c, '☕', x, 450, 130, Math.sin(t * 5) * 0.05); E(c, '👀', x, 440, 44); }
    if (t > 2.4 && t < 4.1) for (let i = 0; i < 4; i++) { const q = (t * 6 + i) % 1; E(c, '⚡', x + (rnd(i + t * 0 + 1) - 0.5) * 120, 400 - q * 40, 30, 0, 1 - q); }
    burst(c, x, 400, 3.2, t, 14, '#5a3216', 150, 0.8, 400);
    if (t > 4.2) T(c, 'Ik ben nu een koffiezetapparaat.', 180, 250, 17, '#fff', 0, pr(t, 4.3, 4.7));
  }),
  // b15 – achtervolgende regenwolk
  K('b15', 'Persoonlijke regenwolk', 'Binnen is het ook gewoon nat.', 8, (c, t, w, h) => {
    sky(c, w, h, '#9aa7b5', '#cfd6dd'); ground(c, w, h, 520, '#6e8b5e');
    E(c, '🏠', 300, 450, 130);
    const pos = u => 40 + 250 * eo(clamp(u / 4));
    let px = pos(t), cloudX = pos(t - 0.7) + 10;
    const into = pr(t, 4.2, 5);
    if (t < 4.2) E(c, '🚶', px, 475, 70, Math.sin(t * 12) * 0.12, 1, 1);
    if (t < 4.2) E(c, '☂️', px, 420, 60);
    if (t >= 4.2) { E(c, '🚶', px, 475, 70 * (1 - into), 0, 1 - into); }
    let cx = cloudX, cy = 200, cs = 100;
    if (t > 4.7) { const q = pr(t, 4.7, 6); cx = lerp(cloudX, 306, eo(q)); cy = lerp(200, 440, eo(q)); cs = lerp(100, 20, eo(q)); }
    const rain = t < 6;
    if (rain) { c.strokeStyle = '#4a8fe0'; c.lineWidth = 2; for (let i = 0; i < 14; i++) { const q = (t * 2 + i * 0.37) % 1; c.beginPath(); const x = cx + (rnd(i) - 0.5) * cs * 0.8; c.moveTo(x, cy + 30 + q * 220 * (cs / 100)); c.lineTo(x - 3, cy + 46 + q * 220 * (cs / 100)); c.stroke(); } }
    if (cs > 21) E(c, '☁️', cx, cy, cs);
    if (t > 6) { c.fillStyle = '#ffeb9a'; c.fillRect(280, 420, 22, 22); E(c, '🌧️', 291, 432 + Math.sin(t * 15) * 2, 26); E(c, '😫', 291, 480, 30, 0, 0.9); }
  }),
  // b16 – stormvoorwerpen, daarna lawine
  K('b16', 'Storm', 'De hoed bleef gewoon zitten.', 8, (c, t, w, h) => {
    const dark = pr(t, 0, 1);
    sky(c, w, h, `rgb(${60 - 20 * dark | 0},${70 - 20 * dark | 0},${90 - 20 * dark | 0})`, '#556'); ground(c, w, h, 520, '#3b4a38');
    const windy = t < 5 ? 1 : 1 - pr(t, 5, 5.4);
    if (windy > 0) { c.globalAlpha = windy; lines(c, w, h, t, 26, 'rgba(255,255,255,.6)', 50, 700); c.globalAlpha = 1; }
    const items = ['🐄', '🛏️', '🚗', '🪑', '🐔', '🚲', '🏠'];
    items.forEach((e, i) => {
      const ts = 0.3 + i * 0.65, u = (t - ts) / 1.3;
      if (t < 5 && u > 0 && u < 1) E(c, e, 420 - 520 * u, 150 + (i % 4) * 90 + Math.sin(t * 8 + i) * 30, 70, t * 6 + i);
      const dt = t - (5 + i * 0.13);
      if (dt > 0) { const y = Math.min(lerp(-60, 480 - i * 14, dt * dt * 2.4), 480 - i * 14); E(c, e, 180 + (i - 3) * 14, y, 64, (y < 470 ? dt * 3 : 0) * 0.2); }
    });
    const crush = clamp(pr(t, 5.1, 6.1));
    E(c, '🧍', 180, 480 + 35 * crush, 90, 0.25 * windy, 1, 1, 1 - 0.7 * crush);
    if (windy > 0.3) E(c, '🎩', 190, 428 + 0, 38, 0.4 + Math.sin(t * 20) * 0.1);
    if (t > 6.5) E(c, '🎩', 180, 300 - 30 * bounceE(pr(t, 6.5, 7.2)) * 0 - 20 * (1 - eo(pr(t, 6.5, 7))), 38 * pr(t, 6.5, 6.8), 0.1);
    flash(c, w, h, t, 2.0, 0.3, '#eef'); flash(c, w, h, t, 3.6, 0.2, '#eef');
    if (t > 5.1 && t < 5.8) shake(c, 5, t);
  }),
  // b17 – smelten, de wortel loopt weg
  K('b17', 'Sneeuwpop', 'De wortel had een plan B.', 7, (c, t, w, h) => {
    sky(c, w, h, '#a5d7ff', '#eaf6ff'); ground(c, w, h, 500, '#f6fbff', '#cde');
    const m = eo(pr(t, 0.8, 3.8));
    E(c, '🌞', 300, 90, 70 + 40 * m, t * 0.6);
    c.fillStyle = 'rgba(120,190,255,.7)'; c.beginPath(); c.ellipse(150, 508, 5 + 90 * m, 3 + 14 * m, 0, 0, 7); c.fill();
    if (t < 4) E(c, '⛄', 150, 500 - 62 * (1 - 0.85 * m), 120 * (1 - 0.85 * m), Math.sin(t * 20) * 0.03 * m);
    if (t > 2.8) E(c, '🎩', 150 + 5 * pr(t, 2.8, 3.6), lerp(430, 495, ei(pr(t, 2.8, 3.6))), 44, pr(t, 2.8, 3.6) * 0.6);
    if (t > 3.8) {
      const u = pr(t, 4.4, 6.5), hop = Math.abs(Math.sin(t * 10)) * 16 * (u > 0 && u < 1 ? 1 : 0);
      const x = 150 + 220 * eo(u);
      E(c, '🥕', x, 495 - hop, 44, -0.6 + Math.sin(t * 10) * 0.1 * (u > 0 ? 1 : 0), 1, 1);
      E(c, '👀', x - 4, 488 - hop, 18);
      if (u > 0 && u < 1) E(c, '💨', x - 30, 495, 24, 0, 0.6);
    }
  }),
  // b18 – dansen en bevriezen
  K('b18', 'Dansvloer', 'De muziek stopte. Eén iemand merkte het niet.', 7.5, (c, t, w, h) => {
    const on = t < 4.8, tt = Math.min(t, 4.8), beat = Math.abs(Math.sin(tt * 6));
    sky(c, w, h, on ? `hsl(${(tt * 80) % 360},70%,30%)` : '#333', on ? `hsl(${(tt * 80 + 90) % 360},70%,45%)` : '#444');
    for (let i = 0; i < 9; i++) { c.fillStyle = on ? `hsla(${(tt * 120 + i * 40) % 360},80%,60%,.5)` : 'rgba(255,255,255,.1)'; c.fillRect(i * 40, 500, 38, 38 + 100); }
    E(c, '🪩', 180 + Math.sin(tt * 2) * 30, 70, 80, Math.sin(tt * 2) * 0.3);
    const em = ['🕺', '💃', '🕺', '💃', '🕺'];
    em.forEach((e, i) => {
      const lone = i === 2, tm = lone ? t : tt;
      E(c, e, 50 + i * 65, 470 - Math.abs(Math.sin(tm * 6 + i)) * 40, 74 + 10 * Math.abs(Math.sin(tm * 6 + i)), Math.sin(tm * 3 + i) * 0.4);
    });
    if (on) for (let i = 0; i < 6; i++) { const q = (tt * 0.8 + i / 6) % 1; E(c, '🎵', 40 + i * 55, 400 - q * 300, 30, Math.sin(q * 9) * 0.5, 1 - q); }
    if (!on) T(c, '…', 180, 260, 60, '#fff', 0, 0.8 + 0.2 * Math.sin(t * 5));
    if (t > 6) T(c, '*ahum*', 180, 330, 24, '#fff', 0, pr(t, 6, 6.4));
  }),
  // b19 – black-out
  K('b19', 'Gitaarsolo', 'Stroomstoring. De solo ging gewoon door.', 7, (c, t, w, h) => {
    sky(c, w, h, '#2a0a4a', '#8a1a6a'); ground(c, w, h, 520, '#222');
    for (let i = 0; i < 8; i++) E(c, '🙌', 25 + i * 44, 565 + Math.sin(t * 6 + i) * 8, 40);
    const jump = pr(t, 2.3, 3.6);
    const y = 440 - arc(jump, 110);
    const dark = t > 4;
    const bx = 180;
    if (!dark) E(c, '🎸', bx + 28, y + 14, 74, -0.5 + Math.sin(t * 14) * 0.08);
    else if (t < 4.4) E(c, '🎸', bx + 28 + 300 * (t - 4), y + 14 - 100 * (t - 4), 74, 8 * (t - 4));
    E(c, '🧑‍🎤', bx, y, 90, Math.sin(t * 10) * (dark ? 0.15 : 0.08));
    if (!dark) for (let i = 0; i < 5; i++) { const q = (t * 0.9 + i / 5) % 1; E(c, i % 2 ? '🎵' : '🎶', 220 + Math.sin(q * 8 + i) * 50, 380 - q * 250, 30, 0, 1 - q); }
    if (dark) {
      const p = pr(t, 4, 4.2);
      c.fillStyle = `rgba(0,0,0,${0.96 * p})`;
      c.beginPath(); c.rect(0, 0, w, h); c.arc(bx, 440, 80, 0, 7, true); c.fill('evenodd');
      T(c, 'Stroomstoring', 180, 120, 26, '#ccc', 0, p);
      if (t > 5) E(c, '🔌', 70, 560, 36, 0, pr(t, 5, 5.3));
    }
  }),
  // b20 – ping-pong, versnelling, door het scherm
  K('b20', 'Tafeltennis', 'Hij sloeg iets te hard.', 6.5, (c, t, w, h) => {
    sky(c, w, h, '#e0f2f1', '#80cbc4'); ground(c, w, h, 520, '#546e7a');
    c.fillStyle = '#1565c0'; c.fillRect(30, 400, 300, 14); c.fillStyle = '#eee'; c.fillRect(178, 360, 4, 40);
    c.fillStyle = '#333'; c.fillRect(50, 414, 8, 100); c.fillRect(302, 414, 8, 100);
    E(c, '🧑', 35, 470, 90); E(c, '🧑‍🦰', 325, 470, 90, 0, 1, -1);
    const ph = t * 1.5 + 0.55 * t * t;
    if (t < 4.5) {
      const u = tri(ph / 1), bx = 70 + 220 * u, f = ph - Math.floor(ph);
      const by = 330 - 70 * Math.sin(f * PI);
      sh(c, bx, 405, 12);
      c.fillStyle = '#fff'; c.beginPath(); c.arc(bx, by, 9, 0, 7); c.fill();
      E(c, '🏓', 70, 440 - (u < 0.1 ? 20 : 0), 40); E(c, '🏓', 290, 440 - (u > 0.9 ? 20 : 0), 40, 0, 1, -1);
      if (t > 3) T(c, '⚡', 180, 250, 30, '#ff0', 0, 0.5);
    } else {
      const p = pr(t, 4.5, 5.4), s = 9 + 400 * ei(p);
      c.fillStyle = '#fff'; c.beginPath(); c.arc(lerp(290, 180, p), lerp(330, 340, p), s, 0, 7); c.fill();
      if (p >= 1) {
        c.fillStyle = '#fff'; c.fillRect(0, 0, w, h);
        c.strokeStyle = '#999'; c.lineWidth = 3;
        for (let i = 0; i < 9; i++) { const a = rnd(i) * 6.283; c.beginPath(); c.moveTo(180, 330); c.lineTo(180 + Math.cos(a) * 300, 330 + Math.sin(a) * 300); c.stroke(); }
        T(c, 'KRAK', 180, 330, 54, '#e33', -0.1);
        shake(c, 6 * (1 - pr(t, 5.4, 6)), t);
      }
    }
  }),
  // b21 – schildpad pakt de bus
  K('b21', 'Haas en schildpad', 'Niemand zei dat je moest rennen.', 7, (c, t, w, h) => {
    sky(c, w, h, '#b9e6ff', '#e9ffd0'); ground(c, w, h, 500, '#6bb24a');
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#fff' : '#111'; c.fillRect(316, 440 + i * 8, 10, 8); }
    E(c, '🚏', 130, 450, 70);
    const hx = t < 1 ? lerp(20, 200, eo(t)) : 200;
    E(c, t < 1 ? '🐇' : '🐇', hx, 470, 60, t > 1 ? 0.5 : 0, 1, -1);
    if (t > 1.1 && t < 5.5) for (let i = 0; i < 3; i++) { const q = (t + i / 3) % 1; T(c, 'z', 215 + i * 12, 450 - q * 50, 18 + i * 6, '#fff', 0, 1 - q); }
    const tx = t < 3 ? lerp(20, 130, t / 3) : 130;
    const bus = t < 3 ? -140 : t < 3.9 ? lerp(-140, 130, eo(pr(t, 3, 3.9))) : lerp(130, 560, ei(pr(t, 4.3, 6)));
    E(c, '🐢', tx, 480, 50, 0, t > 3.9 ? 0 : 1, -1);
    if (t > 3.9 && t < 4.3) { E(c, '🐢', 130, 480 - arc(pr(t, 3.9, 4.3), 60), 50, 0, 1, -1); }
    E(c, '🚌', bus, 450, 100);
    if (t > 4.3 && t < 6) E(c, '🐢', bus, 440, 28, 0, 1, -1);
    if (t > 5.4) { E(c, '🏆', 320, 400, 40 + 30 * bounceE(pr(t, 5.4, 6))); }
    if (t > 6) { E(c, '❗', 200, 405, 40); }
  }),
  // b22 – deur-loop, teleporteren
  K('b22', 'De deur', 'Hij nam gewoon de kortste route.', 8, (c, t, w, h) => {
    sky(c, w, h, '#bfe8ff', '#eaffd8'); ground(c, w, h, 500, '#74b85b');
    const L = 2.6, k = Math.floor(t / L), u = (t % L) / L;
    const glowA = u > 0.45 && u < 0.62, glowB = u < 0.12;
    E(c, '🚪', 55, 440, 120); E(c, '🚪', 305, 440, 120);
    c.save(); c.globalAlpha = 0.5; c.fillStyle = '#ffe94a';
    if (glowA) c.fillRect(30, 380, 50, 120); if (glowB) c.fillRect(280, 380, 50, 120); c.restore();
    const faces = ['🚶', '🚶', '🧓'];
    let x = lerp(300, 85, clamp(u / 0.58));
    const a = u < 0.08 ? u / 0.08 : u > 0.5 ? 1 - (u - 0.5) / 0.08 : 1;
    if (u < 0.6) E(c, faces[k % 3], x, 470 - Math.abs(Math.sin(t * 11)) * 8, 70, 0, clamp(a), -1);
    if (u > 0.62 && k < 2) T(c, '?', 180, 330, 36, '#fff', 0, 1);
    if (k === 2 && u > 0.5) T(c, '…', 180, 330, 44, '#fff');
    T(c, 'Ronde ' + (k + 1), 180, 80, 24, '#fff', 0, 0.7);
  }),
  // b23 – kip over de weg, ei, terug
  K('b23', 'Waarom stak de kip over?', 'Om hier een ei te leggen. Daarna ging het mis.', 8, (c, t, w, h) => {
    sky(c, w, h, '#a8dcff', '#e8f6c8'); ground(c, w, h, 560, '#7cbf5e');
    c.fillStyle = '#555'; c.fillRect(0, 400, w, 150); c.fillStyle = '#ddd';
    for (let i = 0; i < 8; i++) c.fillRect(i * 50 + 10, 473, 28, 5);
    const carX = lerp(-100, 460, pr(t, 1.2, 2.2));
    E(c, '🚗', carX, 440, 80, 0, 1, -1);
    const cross = pr(t, 0, 3.0), back = pr(t, 5.6, 7.8);
    let cx = 40 + 250 * cross;
    if (t > 3) cx = 290;
    if (t > 5.4) cx = lerp(290, 40, back);
    const ey = 470;
    const dir = t > 5.4 ? 1 : -1;
    if (t < 3.2) E(c, '🐔', cx, 470 - Math.abs(Math.sin(t * 9)) * 10, 66, 0, 1, dir);
    else if (t < 4.2) { E(c, '🐔', 290, 470, 66, 0, 1, -1); E(c, '🥚', 255, 500, 30 * bounceE(pr(t, 3.3, 3.7))); }
    else if (t < 5.4) { E(c, '🥚', 255, 500, 30, Math.sin(t * 30) * 0.4 * (1 - pr(t, 4.2, 4.8))); if (t > 4.8) { E(c, '🐣', 255, 495, 40 + 26 * eo(pr(t, 4.8, 5.4)), 0); burst(c, 255, 490, 4.8, t, 8, '#fff', 80, 0.5, 200); } E(c, '🐔', 290, 470, 66, 0, 0.6, -1); }
    else E(c, '🐔', cx, 470 - Math.abs(Math.sin(t * 9)) * 10, 66, 0, 1, 1);
    if (t > 5.4) T(c, 'Wacht, wat?', cx, 400, 20, '#fff', 0, 1);
  }),
  // b24 – ballon prikt cactus, confetti
  K('b24', 'Ballon en cactus', 'Het was geen ongeluk. Het was een verrassingsfeest.', 6, (c, t, w, h) => {
    sky(c, w, h, '#ffd27a', '#ffeebb'); ground(c, w, h, 520, '#e2b15e');
    E(c, '🌞', 60, 80, 60);
    const bx = lerp(30, 213, eo(pr(t, 0, 3))), by = 400 + Math.sin(t * 3) * 25 - 30 * pr(t, 0, 3);
    const pop = t > 3.1;
    const cac = pop ? 1 + 0.15 * Math.abs(Math.sin(t * 10)) : 1;
    E(c, '🌵', 260, 450, 130 * cac, pop ? Math.sin(t * 9) * 0.1 : 0);
    if (!pop) E(c, '🎈', bx, by, 60, Math.sin(t * 2) * 0.15);
    else { E(c, '🥳', 260, 360, 36); }
    if (t > 3.1) { flash(c, w, h, t, 3.1, 0.12); burst(c, 232, 400, 3.1, t, 50, ['#f44', '#4af', '#fd2', '#4d4', '#f6f'], 280, 2.4, 160, 5); T(c, 'POP!', 190, 330, 54 * bounceE(pr(t, 3.1, 3.4)), '#fff', -0.15, 1 - pr(t, 3.8, 4.4)); shake(c, 4 * (1 - pr(t, 3.1, 3.6)), t); }
    if (t > 4.3) for (let i = 0; i < 6; i++) E(c, i % 2 ? '🎉' : '🎊', 40 + i * 60, 560 - 20 * Math.abs(Math.sin(t * 6 + i)), 36);
  }),
  // b25 – banaan: ontwijken, toch uitglijden
  K('b25', 'Bananenschil', 'Hij ontweek de verkeerde banaan.', 7, (c, t, w, h) => {
    sky(c, w, h, '#9fe3ff', '#e5ffe0'); ground(c, w, h, 500, '#c9a15b');
    E(c, '🍌', 190, 492, 34, 0.4);
    let x = 20, y = 460, r = 0, e = '🚶';
    if (t < 1.4) x = lerp(20, 130, t / 1.4);
    else if (t < 2.3) { const u = pr(t, 1.4, 2.3); x = lerp(130, 260, u); y = 460 - arc(u, 90); r = -u * 0.2; }
    else if (t < 3.3) { x = 260; e = '😅'; }
    else if (t < 4.2) { x = lerp(260, 300, pr(t, 3.3, 4.2)); e = '😌'; }
    else { const u = pr(t, 4.2, 5.8); x = 300 + 20 * u; y = 460 - arc(u, 160); r = -u * 2.4 * PI * 0.6 - 0.2; e = '😵'; }
    if (t > 3.1) { const mk = pr(t, 3.1, 3.6); E(c, '🐒', 330, lerp(-40, 90, eo(mk)), 70); }
    if (t > 3.3 && t < 4.2) { const p = pr(t, 3.3, 3.9); E(c, '🍌', lerp(330, 300, p), lerp(110, 492, ei(p)), 34, p * 6); }
    else if (t >= 4.2 && t < 4.4) E(c, '🍌', 300, 492, 34, 0.2);
    else if (t >= 4.4) E(c, '🍌', 300 + (t - 4.4) * 100, 492 - arc(pr(t, 4.4, 6), 40), 34, t * 8, 1);
    sh(c, x, 505, 26, 0.3 * (1 - clamp((460 - y) / 200)));
    E(c, e, x, y, 76, r);
    if (t > 5.8) { burst(c, x, 495, 5.8, t, 10, '#fff', 110, 0.6, 300); E(c, '💫', x, 440, 36, t * 6); T(c, 'Auw.', x, 380, 28, '#fff'); }
    if (t > 5.8) shake(c, 4 * (1 - pr(t, 5.8, 6.2)), t);
  }),
  // b26 – stuiterend ei, kuiken
  K('b26', 'Het ei', 'Ontbijt is voor later. Eerst even sporten.', 7.5, (c, t, w, h) => {
    sky(c, w, h, '#ffe3c2', '#fff6e0'); ground(c, w, h, 520, '#b98551');
    const segs = [[0, 1.1, 0], [1.1, 1.0, 270], [2.1, 0.75, 130], [2.85, 0.5, 50]];
    let y = -60, sq = 0;
    if (t < 3.35) {
      for (const s of segs) {
        if (t >= s[0] && t < s[0] + s[1]) {
          const u = (t - s[0]) / s[1];
          y = s[2] === 0 ? lerp(-60, 490, u * u) : 490 - arc(u, s[2]);
          sq = (u < 0.06 || u > 0.94) ? 1 : 0;
        }
      }
      sh(c, 180, 522, 24 + (490 - y) * 0.02, 0.3);
      E(c, '🥚', 180, y, 56, t * 2, 1, 1 + 0.25 * sq, 1 - 0.25 * sq);
      if (t < 1.1) for (let i = 0; i < 4; i++) c.fillRect(0, 0, 0, 0);
    } else {
      if (t < 3.7) { E(c, '🥚', 180, 490, 56, Math.sin(t * 40) * 0.1); T(c, '*krak*', 180, 420, 24, '#fff', 0, 1); }
      burst(c, 180, 490, 3.7, t, 14, '#fff7e0', 170, 0.9, 500);
      const u = pr(t, 3.7, 4.2);
      const cx = t < 4.7 ? 180 : 180 + 240 * eo(pr(t, 4.7, 6.5));
      if (t >= 3.7) E(c, '🐥', cx, 490 - 16 * bounceE(u) - (t > 4.7 ? Math.abs(Math.sin(t * 12)) * 14 : 0), 60 * bounceE(u), 0, 1, t > 4.7 ? -1 : 1);
      if (t > 4.2 && t < 4.7) T(c, 'Piep.', 180, 420, 24, '#fff');
    }
    if (t > 0 && t < 3.35 && y > 480) shake(c, 2, t);
  }),
  // b27 – grote mond, salade
  K('b27', 'Hamburger', 'Dat was niet wat er op het bord stond.', 6.5, (c, t, w, h) => {
    sky(c, w, h, '#ffd54a', '#ff9a3a');
    const g = eio(pr(t, 0, 3.4));
    const fs = t < 3.5 ? 100 + 420 * g : lerp(520, 120, eo(pr(t, 3.5, 4.5)));
    const face = t < 3.5 ? '😮' : (t < 5.4 ? '🤢' : '😒');
    E(c, face, 180, 340, fs, t > 3.5 && t < 5 ? Math.sin(t * 25) * 0.05 : 0);
    if (t < 3.45) { const x = lerp(430, 190, eo(pr(t, 0.8, 3.3))); const sw = t > 3.0; E(c, sw ? '🥬' : '🍔', x, 340, 70 + (sw ? 0 : 0), t * 3); if (t >= 3 && t < 3.3) T(c, '!', x, 270, 50, '#fff'); }
    if (t > 3.45) shake(c, 6 * (1 - pr(t, 3.45, 4.2)), t);
    if (t > 4.2) { const p = pr(t, 4.2, 5.2); E(c, '🥬', lerp(180, 360, eo(p)), 340 - arc(p, 120), 50, p * 10, 1 - p * 0.3); }
    if (t > 5.2) T(c, 'Salade.', 180, 560, 36, '#fff', 0, pr(t, 5.2, 5.6));
  }),
  // b28 – boemerang-croissant
  K('b28', 'Boemerang-croissant', 'Hij kwam altijd terug. Zoals bakkers dat willen.', 6.5, (c, t, w, h) => {
    sky(c, w, h, '#ffe0c8', '#fff3e0'); ground(c, w, h, 520, '#d7a96b');
    const u = pr(t, 1, 4.4);
    const baker = t > 4.4 ? '😵' : '🧑‍🍳';
    let sx = 0; if (t > 4.4 && t < 5) sx = Math.sin(t * 40) * 4;
    E(c, baker, 80 + sx, 470, 90, t > 4.4 && t < 5.2 ? Math.sin(t * 12) * 0.15 : 0);
    if (t < 1) E(c, '🥐', 125, 440, 40, 0);
    if (t >= 1 && t < 4.4) {
      const a = u * 2 * PI;
      const x = 80 + 130 * (1 - Math.cos(a)), y = 420 - 120 * Math.sin(a * 1) * (1 - u * 0.2);
      for (let i = 1; i < 5; i++) { const ua = Math.max(0, u - i * 0.015) * 2 * PI; E(c, '🥐', 80 + 130 * (1 - Math.cos(ua)), 420 - 120 * Math.sin(ua), 40, 0, 0.12); }
      E(c, '🥐', x, y, 50, t * 18);
    }
    if (t >= 4.4 && t < 5.1) E(c, '🥐', 80 + 20 * (t - 4.4), 420 + 90 * ei(pr(t, 4.4, 5.1)), 50, t * 3);
    if (t >= 4.4 && t < 5.2) { E(c, '💫', 80, 420, 36, t * 6); burst(c, 90, 410, 4.4, t, 8, '#ffe94a', 100, 0.5); }
    if (t > 5.1) { E(c, '🥐', 125, 450, 36 * (1 - 0.8 * pr(t, 5.6, 6.2)), 0); E(c, '😋', 80, 440, 40, 0, pr(t, 5.5, 5.8)); }
    if (t > 4.4 && t < 4.9) shake(c, 4, t);
  }),
  // b29 – pizza in het donker, flikkeren
  K('b29', 'Stroomstoring bij de pizza', 'Niemand zag iets. Iedereen at iets.', 7.5, (c, t, w, h) => {
    sky(c, w, h, '#ffe8b8', '#ffd08a');
    c.fillStyle = '#8d5a2b'; c.beginPath(); c.arc(180, 330, 118, 0, 7); c.fill();
    const darks = [[1, 1.5], [2.5, 3], [4, 4.5], [5.4, 5.9]];
    const gone = darks.filter(d => t > d[0] + 0.12).length * 2;
    c.fillStyle = '#e0a53a'; c.beginPath(); c.arc(180, 330, 78, 0, 7); c.fill();
    for (let i = gone; i < 8; i++) {
      c.fillStyle = '#f3b83c'; c.beginPath(); c.moveTo(180, 330); c.arc(180, 330, 74, i * PI / 4, (i + 1) * PI / 4); c.closePath(); c.fill();
      c.strokeStyle = '#c1432d'; c.lineWidth = 3; c.stroke();
      const a = (i + 0.5) * PI / 4; c.fillStyle = '#c1432d'; c.beginPath(); c.arc(180 + Math.cos(a) * 45, 330 + Math.sin(a) * 45, 7, 0, 7); c.fill();
    }
    const allGone = gone >= 8;
    for (let i = 0; i < 6; i++) {
      const a = i * PI / 3 - PI / 2, x = 180 + Math.cos(a) * 150, y = 330 + Math.sin(a) * 150;
      const fed = allGone && i === 2;
      E(c, allGone ? (fed ? '😋' : '😇') : '🙂', x, y, fed ? 90 : 60, allGone ? 0 : Math.sin(t * 3 + i) * 0.08);
    }
    const isDark = darks.some(d => t > d[0] && t < d[1]);
    if (isDark) { c.fillStyle = 'rgba(0,0,0,.94)'; c.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) { const a = i * PI / 3 - PI / 2; E(c, '👀', 180 + Math.cos(a) * 150, 330 + Math.sin(a) * 150, 30, 0, 0.8); } T(c, '*knisper*', 180, 560, 24, '#ccc'); }
    if (allGone && t > 6) T(c, 'Ik heb niks gezien.', 180, 560, 24, '#fff', 0, pr(t, 6, 6.4));
  }),
  // b30 – geschudde fles, uitgestelde geiser
  K('b30', 'Geschudde cola', 'De verkeerde fles ontplofte.', 7, (c, t, w, h) => {
    sky(c, w, h, '#c8f0ff', '#f0fbff'); ground(c, w, h, 520, '#9cc');
    const sk = t < 3.2 ? 1 + 8 * pr(t, 0, 3) : 0;
    c.save(); c.translate(100, 0); if (t < 3.2) shake(c, sk, t);
    E(c, t > 4.5 ? '😭' : (t > 3.7 ? '😌' : '😬'), 0, 440, 80);
    E(c, '🥤', 38, 410 - (t < 3.2 ? Math.abs(Math.sin(t * 20)) * 14 : 0), 56);
    c.restore();
    c.fillStyle = '#222'; c.fillRect(20, 150, 14, 120);
    const pg = t < 3.2 ? pr(t, 0, 3) : 1 - pr(t, 3.2, 3.6);
    c.fillStyle = `hsl(${120 - 120 * pg},90%,50%)`; c.fillRect(22, 268 - 116 * pg, 10, 116 * pg);
    if (t > 3.2 && t < 3.7) for (let i = 0; i < 6; i++) { const q = (t - 3.2) * 4; E(c, '💧', 150 + i * 4, 380 - q * 20 * (i % 3 + 1), 14, 0, 1 - q * 0.5); }
    if (t > 3.2 && t < 3.8) T(c, 'psst.', 175, 330, 24, '#fff');
    const bx = 280;
    E(c, '🧍', bx, 470, 90);
    E(c, '🥤', bx - 36, 450, 52);
    if (t > 4.5) {
      const p = t - 4.5;
      c.save();
      for (let i = 0; i < 60; i++) {
        const a = -PI / 2 + (rnd(i) - 0.5) * 1.1, v = 330 + rnd(i + 70) * 260, q = p - i * 0.004;
        if (q < 0 || q > 1.8) continue;
        c.globalAlpha = 1 - q / 1.8; c.fillStyle = i % 3 ? '#5a2d12' : '#c9884a';
        c.beginPath(); c.arc(bx - 36 + Math.cos(a) * v * q * 0.6 - 90 * q, 440 + Math.sin(a) * v * q + 280 * q * q, 7, 0, 7); c.fill();
      }
      c.restore();
      T(c, 'PSSSHHH!', 230, 560, 36, '#fff', 0, pr(t, 4.5, 4.7));
      if (p < 1.6) shake(c, 4 * (1 - p / 1.6), t);
    }
  }),
  // b31 – regenboog, pot met aanslag
  K('b31', 'Einde van de regenboog', 'De pot was er wel. De belastingdienst ook.', 8, (c, t, w, h) => {
    sky(c, w, h, '#8ed6ff', '#dff7ff'); ground(c, w, h, 540, '#6dbb4d');
    E(c, '☁️', 70, 120, 90 + Math.sin(t) * 6); E(c, '☁️', 290, 170, 70);
    const cols = ['#e33', '#f93', '#fd2', '#4c4', '#3af', '#53c', '#b4d'];
    const g = eo(pr(t, 0, 2.5)), fade = 1 - pr(t, 6.6, 7.6);
    c.save(); c.globalAlpha = fade; c.lineWidth = 11;
    cols.forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(180, 540, 150 - i * 10, PI, PI + PI * g); c.stroke(); });
    c.restore();
    const u = pr(t, 2.6, 5.2), a = PI + PI * eo(u);
    const rx = 180 + 140 * Math.cos(a), ry = 540 + 140 * Math.sin(a) - 24;
    if (t >= 2.6 && t < 5.4) E(c, '🏃', rx, ry, 56, Math.cos(a) * 0.0, 1, -1);
    E(c, t < 5.4 ? '🍯' : '🍯', 330, 520, 50 + 14 * bounceE(pr(t, 0, 0.5)));
    if (t < 5.2) burst(c, 330, 500, 0, t % 1.2, 3, '#ffe94a', 20, 0.8, -40, 3);
    if (t > 5.4) {
      E(c, '😱', 300, 510, 60, 0, 1);
      const p = pr(t, 5.4, 6.2), s = bounceE(p);
      E(c, '🧾', 330, lerp(500, 380, eo(p)), 56 * s, Math.sin(t * 8) * 0.2);
      T(c, 'Aanslag: € 2.000', 180, 300, 24 * s, '#fff');
    }
  }),
  // b32 – flitser, slak wint
  K('b32', 'Slak vs. auto', 'Hij reed te hard. Zij had alle tijd.', 7, (c, t, w, h) => {
    sky(c, w, h, '#bfe5ff', '#eaf7ff'); ground(c, w, h, 440, '#4a4a4a', '#ddd');
    c.fillStyle = '#6bb24a'; c.fillRect(0, 560, w, 80);
    c.fillStyle = '#fff'; for (let i = 0; i < 7; i++) c.fillRect(i * 56, 500, 30, 6);
    E(c, '📸', 250, 400, 60);
    let cx;
    if (t < 1) cx = lerp(-80, 250, ei(t));
    else cx = lerp(250, 330, eo(pr(t, 1, 3.3)));
    if (t < 1.4) lines(c, w, h, t, 0, '#fff', 1, 1);
    if (t < 1.2) { c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 3; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(cx - 70 - i * 20, 470 + i * 6 - 10); c.lineTo(cx - 20, 470 + i * 6 - 10); c.stroke(); } }
    E(c, '🚗', cx, 490, 90, 0, 1, -1);
    flash(c, w, h, t, 1.0, 0.35);
    if (t > 1.5) { const p = pr(t, 1.5, 2.6); E(c, '🧾', lerp(250, cx, p), lerp(300, 450, eo(p)), 40, Math.sin(t * 6) * 0.3); }
    if (t > 3.3) T(c, 'Boete!', cx, 400, 24, '#fa4', 0, pr(t, 3.3, 3.6));
    const sx = lerp(10, 350, pr(t, 0, 6.5));
    E(c, '🐌', sx, 588, 56, 0, 1, -1);
    E(c, '😎', sx - 8, 565, 22);
    if (t > 4.5) T(c, 'Snel!', sx, 520, 24, '#fff', 0, pr(t, 4.5, 4.8));
    if (t > 3.5 && t < 6) { const q = (t * 2) % 1; E(c, '💨', cx + 40, 460 - q * 40, 30, 0, 1 - q); }
  }),
  // b33 – maan met kaaskant
  K('b33', 'Andere kant van de maan', 'Dus het was toch kaas.', 7, (c, t, w, h) => {
    sky(c, w, h, '#05051a', '#14123a'); stars(c, w, h, t, 60);
    const a = t * 1.3, mx = 180 + 140 * Math.cos(a), my = 320 + 70 * Math.sin(a), front = Math.sin(a) > 0;
    const ms = 56 + 22 * Math.sin(a);
    const flip = Math.cos(t * 2.2), face = flip > 0 ? '🌕' : '🧀';
    if (!front) E(c, face, mx, my, ms, 0, 1, Math.abs(flip) * 0.9 + 0.1);
    E(c, '🌍', 180, 320, 120, t * 0.3);
    E(c, t > 4 ? '😋' : '🙂', 180, 330, 36, 0, 0.0 + 0);
    if (front) E(c, face, mx, my, ms, 0, 1, Math.abs(flip) * 0.9 + 0.1);
    if (flip < 0 && t > 0.5) E(c, '🐭', mx + 25, my - 22, 28, 0.5);
    if (t > 4.2) T(c, 'Mmm.', 180, 560, 34, '#ffeb3b', 0, pr(t, 4.2, 4.6));
    c.save(); c.strokeStyle = 'rgba(255,255,255,.15)'; c.setLineDash([4, 6]); c.beginPath(); c.ellipse(180, 320, 140, 70, 0, 0, 7); c.stroke(); c.restore();
  }),
  // b34 – elastisch touw, ping-pong tegen het ruimteschip
  K('b34', 'Ruimtewandeling', 'Het touwtje was net iets te kort.', 7.5, (c, t, w, h) => {
    sky(c, w, h, '#02020c', '#101a40'); stars(c, w, h, t);
    const out = pr(t, 0, 3), q = Math.max(0, t - 3);
    let x = 120 + 180 * Math.sin(out * PI / 2) * 0.98;
    if (t >= 3) x = 120 + 180 * Math.abs(Math.cos(3 * q)) * Math.exp(-0.45 * q);
    const ay = 320 + Math.sin(t * 2) * 10 + 20 * Math.sin(out * 3);
    const taut = x > 290 || t >= 3;
    c.strokeStyle = '#ddd'; c.lineWidth = taut && t < 3.3 ? 2 : 3; c.beginPath(); c.moveTo(90, 330);
    if (taut && t > 2.8) c.lineTo(x, ay); else for (let i = 1; i <= 12; i++) { const f = i / 12; c.lineTo(lerp(90, x, f), lerp(330, ay, f) + Math.sin(f * PI) * 30); }
    c.stroke();
    E(c, '🛰️', 60, 320, 100);
    E(c, x > 140 ? '🧑‍🚀' : '😵', x, ay, 60, t * 0.6, 1);
    if (t > 2.6 && t < 3.2) T(c, '!', x, ay - 50, 40, '#fff');
    for (let i = 0; i < 20; i++) if (t >= 3) { const k = i * 3.14 / 3; const tk = 3 + k / 3; if (t > tk && t < tk + 0.4 && tk < 6.4) { burst(c, 110, 325, tk, t, 8, '#ffe94a', 90, 0.4, 0, 4); } }
    if (t > 3 && t < 3.3) shake(c, 3, t);
    if (t > 6.5) T(c, '…en weer.', 180, 560, 26, '#fff', 0, pr(t, 6.5, 6.9));
  }),
  // b35 – tijdmachine: dino, kip
  K('b35', 'Tijdmachine', 'Dinosaurussen leven nog. Ze zijn alleen kleiner geworden.', 8, (c, t, w, h) => {
    sky(c, w, h, '#14213d', '#415a77'); ground(c, w, h, 540, '#2b2d42', '#7cf');
    const shk = (t > 1.2 && t < 3.2) || (t > 4.6 && t < 5.6);
    c.save(); if (shk) shake(c, 4, t);
    c.fillStyle = '#1d6fd1'; c.fillRect(120, 300, 120, 240); c.fillStyle = '#0d3a73'; c.fillRect(135, 320, 90, 220);
    const open = (t > 3.2 && t < 4.9) || t > 5.6; c.fillStyle = open ? '#ffe9a0' : '#09284d'; c.fillRect(145, 330, 70, 210);
    c.fillStyle = shk && Math.sin(t * 30) > 0 ? '#ff0' : '#f33'; c.beginPath(); c.arc(180, 285, 12, 0, 7); c.fill();
    c.restore();
    E(c, '⏰', 180, 220, 60, t * 4 * (shk ? 1 : 0.2));
    if (t < 1.4) { const x = lerp(40, 180, pr(t, 0, 1.2)); E(c, '🧑', x, 490, 70, 0, 1 - pr(t, 1.0, 1.3)); }
    flash(c, w, h, t, 3.1, 0.3); flash(c, w, h, t, 5.5, 0.3);
    if (t > 3.2 && t < 4.9) { const x = t < 4.4 ? lerp(180, 270, eo(pr(t, 3.3, 4.2))) : lerp(270, 180, pr(t, 4.4, 4.9)); E(c, '🦖', x, 470, 110, 0, t > 4.7 ? 1 - pr(t, 4.7, 4.9) : 1, -1); if (t > 4.2 && t < 4.5) T(c, '?', 270, 390, 34, '#fff'); }
    if (t > 5.6) { const x = lerp(180, 80, eo(pr(t, 5.7, 7))); E(c, '🐔', x, 500 - Math.abs(Math.sin(t * 10)) * 8, 60); T(c, 'Wacht…', x, 430, 22, '#fff', 0, pr(t, 6.5, 6.8)); }
    for (let i = 0; i < 8; i++) if (shk) { const q = (t * 3 + i / 8) % 1; E(c, '✨', 180 + (rnd(i) - 0.5) * 160, 520 - q * 260, 22, 0, 1 - q); }
  }),
  // b36 – schoolbel, stormloop
  K('b36', 'De schoolbel', 'De juf was de snelste. Altijd.', 6, (c, t, w, h) => {
    sky(c, w, h, '#fdf3d0', '#f2d8a0'); ground(c, w, h, 510, '#b9854e');
    c.fillStyle = '#2f5d3a'; c.fillRect(60, 90, 220, 110); c.strokeStyle = '#8b5a2b'; c.lineWidth = 6; c.strokeRect(60, 90, 220, 110);
    T(c, '1 + 1 = ?', 170, 145, 30, '#fff');
    E(c, '🚪', 330, 450, 110);
    const ring = t > 1.8 && t < 3;
    E(c, '🔔', 330, 80 + 0, 56, ring ? Math.sin(t * 40) * 0.5 : 0);
    if (ring) for (let i = 0; i < 3; i++) T(c, ')', 372 + i * 6, 80, 20 + i * 8, '#fd0', 0, 1 - i * 0.3);
    const kids = ['🧒', '👧', '🧒', '👧', '🧒', '👧', '🧒', '👧'];
    kids.forEach((e, i) => {
      const x0 = 70 + (i % 4) * 55, y0 = i < 4 ? 440 : 490, s0 = 2.0 + i * 0.05;
      const p = pr(t, s0, s0 + 0.95), x = lerp(x0, 345, eo(p));
      const moving = p > 0 && p < 1;
      const dy = moving ? Math.abs(Math.sin(t * 20 + i)) * 16 : 0;
      if (x < 335) E(c, moving ? e : (t < 2 ? '😴' : e), x, y0 - dy, 54, moving ? -0.2 : (t < 2 ? Math.sin(t * 2 + i) * 0.1 : 0));
      if (moving) { c.globalAlpha = 0.5; E(c, '💨', x - 25, y0 + 10, 20); c.globalAlpha = 1; }
    });
    const tp = pr(t, 2.0, 2.65), tx = lerp(60, 345, eo(tp));
    if (tx < 335) E(c, '👩‍🏫', tx, 400 - (tp > 0 && tp < 1 ? Math.abs(Math.sin(t * 22)) * 20 : 0), 76, tp > 0 ? -0.25 : 0);
    if (t > 3.8) { E(c, '🦗', 180, 500, 30, 0, 1); T(c, 'Stilte.', 180, 340, 26, '#654', 0, pr(t, 3.8, 4.2)); E(c, '📄', 150, 520, 26, 0.4); }
    if (ring) shake(c, 1.5, t);
  }),
  // b37 – telefoons vermenigvuldigen
  K('b37', 'Telefoon', 'Eén keer ophangen was niet genoeg.', 6.5, (c, t, w, h) => {
    sky(c, w, h, '#e8eaf6', '#c5cae9'); ground(c, w, h, 520, '#8c93b8');
    c.fillStyle = '#795548'; c.fillRect(30, 470, 300, 14);
    const pers = t > 5 ? lerp(110, -60, ei(pr(t, 5, 6))) : 110;
    const face = t < 1.5 ? '🧑‍💼' : (t < 2.6 ? '🤨' : (t < 3 ? '😠' : '😱'));
    E(c, face, pers, 420, 90, t > 5 ? -0.3 : 0, 1, t > 5 ? -1 : 1);
    const ringing = t < 1.5 || t > 3;
    if (t < 1.5) E(c, '📞', 250, 450, 50, Math.sin(t * 50) * 0.3);
    else if (t < 2.6) E(c, '📞', lerp(250, pers + 22, eo(pr(t, 1.5, 2))), lerp(450, 400, eo(pr(t, 1.5, 2))), 44, -0.4);
    else if (t < 3.4) E(c, '📞', pers + 30, 450 + ei(pr(t, 2.6, 3.4)) * 60, 44, t * 2);
    if (t > 3) {
      const n = Math.floor(1 + 24 * pr(t, 3, 4.8)), em = ['📱', '💻', '⌚', '☎️', '📟'];
      for (let i = 0; i < n; i++) {
        const born = 3 + (i / 25) * 1.8, a = bounceE(clamp((t - born) * 5));
        E(c, em[i % 5], 40 + rnd(i) * 280, 120 + rnd(i + 10) * 380, 36 * a, Math.sin(t * 45 + i) * 0.4);
      }
      shake(c, 2 + n * 0.12, t);
    }
    if (t > 3.2) T(c, 'RING RING', 180, 80, 34, '#f44', Math.sin(t * 30) * 0.05);
  }),
  // b38 – koffie, trillen, wegflitsen
  K('b38', 'Te veel koffie', 'Hij was er niet meer bij, letterlijk.', 7, (c, t, w, h) => {
    sky(c, w, h, '#f3e5d0', '#e0c9a6'); ground(c, w, h, 520, '#9c7b57');
    c.fillStyle = '#6d4c2b'; c.fillRect(30, 460, 300, 14); c.fillRect(50, 474, 8, 46); c.fillRect(302, 474, 8, 46);
    E(c, '💻', 250, 430, 56);
    const n = Math.floor(10 * pr(t, 0.2, 3.5));
    for (let i = 0; i < n; i++) E(c, '☕', 60 + (i % 5) * 30, 442 - Math.floor(i / 5) * 22, 30);
    const vib = 1 + 8 * pr(t, 0, 3.5);
    const gone = pr(t, 3.9, 4.7);
    if (t < 3.9) { c.save(); shake(c, vib, t); E(c, '🧑‍💼', 150, 410, 90); c.restore(); }
    else if (t < 5) { for (let i = 0; i < 4; i++) E(c, '🧑‍💼', 150 + 520 * ei(gone) - i * 30, 410, 90, 0, 0.5 - i * 0.1, -1); lines(c, w, h, t * 3, 14, 'rgba(0,0,0,.4)', 90, 500); }
    if (t > 3.9 && t < 5) { const k = Math.min(1, gone); for (let i = 0; i < 12; i++) E(c, '📄', 150 + (rnd(i) - 0.5) * 260, 300 + ((t * 80 + i * 40) % 200), 26, t * 5 + i, 1 - pr(t, 4.6, 5)); }
    E(c, '🪑', 150, 470, 70, t > 3.9 ? (t - 3.9) * 12 : 0, t > 5.2 ? 0 : 1);
    if (t > 5.2) { const x = lerp(150, 150, 0); E(c, '😴', 150 + 0, lerp(380, 425, eo(pr(t, 5.2, 5.6))), 80 * pr(t, 5.2, 5.4)); T(c, 'zzz', 190, 380 - 10 * Math.sin(t * 3), 26, '#fff', 0, pr(t, 5.5, 5.9)); }
  }),
  // b39 – pendelende magneet, bankpas
  K('b39', 'Magneet', 'Bankpassen zijn ook maar mensen.', 7, (c, t, w, h) => {
    sky(c, w, h, '#fbe9e7', '#ffccbc'); ground(c, w, h, 520, '#a1887f');
    const mpos = tt => ({ x: 180 + 130 * Math.sin(tt * 1.8), y: 90 + 130 * (1 - Math.cos(Math.sin(tt * 1.8) * 0.9)) + 90 });
    const items = [['🔩', 60], ['🪙', 110], ['📎', 235], ['🔑', 290], ['⚙️', 160]];
    const mp = mpos(t);
    c.strokeStyle = '#555'; c.lineWidth = 3; c.beginPath(); c.moveTo(180, 0); c.lineTo(mp.x, mp.y - 22); c.stroke();
    const held = [];
    items.forEach((it, i) => {
      let ta = -1;
      for (let s = 0; s <= t; s += 0.02) { if (Math.abs(mpos(s).x - it[1]) < 40) { ta = s; break; } }
      if (ta < 0) E(c, it[0], it[1], 495, 34, 0.2 * i);
      else { const p = eo(pr(t - ta, 0, 0.4)); held.push(i); const k = held.length; E(c, it[0], lerp(it[1], mp.x + (i - 2) * 8, p), lerp(495, mp.y + 30 + (i % 3) * 14, p), 34, p * 0.5 * i); }
    });
    E(c, '🧲', mp.x, mp.y, 56, -Math.sin(t * 1.8) * 0.6 + PI);
    if (t < 3.6) E(c, '🧑', 310, 470, 80);
    else {
      E(c, t < 4.6 ? '😳' : '😭', 310, 470, 80);
      const p = pr(t, 3.6, 4.6);
      const cx = lerp(310, mp.x, eo(p)), cy = lerp(480, mp.y + 40, eo(p));
      E(c, '💳', cx, cy - arc(p, 120), 40, p * 8);
      if (p >= 1) T(c, 'Bankpas leeg…', 180, 600, 26, '#fff', 0, pr(t, 4.7, 5.1));
    }
  }),
  // b40 – graaf een gat, de aarde is rond (wereld op zijn kop)
  K('b40', 'Dwars door de aarde', 'Hij had gezegd dat hij naar Australië zou graven.', 8, (c, t, w, h) => {
    t *= 1.125;
    const flipped = t >= 5.4;
    if (!flipped) {
      sky(c, w, h, '#8fd8ff', '#d7f3ff'); ground(c, w, h, 420, '#8b5a2b', '#5a3a1b');
      E(c, '☁️', 80 + Math.sin(t) * 10, 120, 80);
      const dig = pr(t, 0.8, 3.6), zoom = pr(t, 3.6, 5.2);
      const sc = 1 + 8 * ei(zoom);
      c.translate(180, 430); c.scale(sc, sc); c.translate(-180, -430);
      c.fillStyle = '#2b1608'; c.beginPath(); c.ellipse(180, 424, 8 + 52 * dig, 3 + 14 * dig, 0, 0, 7); c.fill();
      E(c, t > 3.6 ? '🧑' : '🧑', 90, 392, 80 * (1 - 0.9 * zoom), 0, 1 - pr(t, 3.4, 3.8));
      const sw = Math.sin(t * 12) * 0.5;
      E(c, '⛏️', 125, 380, 50 * (1 - zoom) * (t < 3.6 ? 1 : 0), -0.8 + sw);
      for (let k = 0; k < 4; k++) burst(c, 180, 420, 1 + k * 0.7, t, 8, '#6b4423', 130, 0.5, 400, 4);
      if (t > 3.6) { c.fillStyle = `rgba(20,10,5,${ei(zoom)})`; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.restore(); }
      if (t > 4.4) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(20,10,5,${pr(t, 4.4, 5.2)})`; c.fillRect(0, 0, 2000, 2000); c.restore(); }
    } else {
      const f = pr(t, 5.4, 6);
      c.save();
      c.translate(180, 320); c.rotate(PI); c.translate(-180, -320);
      sky(c, w, h, '#ffb347', '#ffe6a0'); ground(c, w, h, 420, '#c1440e', '#7a2a08');
      E(c, '☀️', 270, 110, 70);
      const up = bounceE(pr(t, 5.6, 6.4));
      c.fillStyle = '#2b1608'; c.beginPath(); c.ellipse(130, 424, 60, 16, 0, 0, 7); c.fill();
      E(c, t > 7 ? '😎' : '😵‍💫', 130, 424 - 70 * up, 80);
      const kx = 400 - 380 * pr(t, 6.6, 8.6);
      if (t > 6.6) E(c, '🦘', kx, 380 - Math.abs(Math.sin(t * 5)) * 40, 70, 0, 1, 1);
      c.fillStyle = `rgba(20,10,5,${1 - f})`; c.fillRect(-50, -50, 500, 800);
      c.restore();
    }
    if (flipped && t > 6.2) T(c, 'G’day.', 180, 240, 40, '#fff', 0, pr(t, 6.2, 6.6));
    if (!flipped && t > 3.8 && t < 4.8) T(c, 'Nog even…', 180, 200, 28, '#fff', 0, 1 - pr(t, 4.4, 4.8));
  }),
];
