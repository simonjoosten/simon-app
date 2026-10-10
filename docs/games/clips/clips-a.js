// Gamescroller clips A (a01..a40) - pure draw(ctx, t, w, h), w=360 h=640
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
const tri = (x) => 1 - Math.abs(((x % 2) + 2) % 2 - 1); // ping-pong 0..1..0 met periode 2
const shk = (t, a) => [a * Math.sin(t * 91), a * Math.cos(t * 77)];
const arc = (k, h) => 4 * h * k * (1 - k); // parabool 0..h..0

function begin(ctx, w, h, o = {}) {
  const sh = o.sh || [0, 0];
  ctx.save();
  ctx.setTransform && 0;
  ctx.clearRect(0, 0, w, h);
  ctx.translate(sh[0], sh[1]);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, o.top || '#8fd3ff');
  g.addColorStop(1, o.bot || '#e6f7ff');
  ctx.fillStyle = g;
  ctx.fillRect(-30, -30, w + 60, h + 60);
  if (o.gy != null) drawGround(ctx, w, h, o.gy, o.gc || '#6bbf59', o.gl);
}
function end(ctx) { ctx.restore(); }
function drawGround(ctx, w, h, gy, col, line) {
  ctx.fillStyle = col;
  ctx.fillRect(-30, gy, w + 60, h - gy + 30);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(-30, gy, w + 60, 4);
  if (line) { ctx.fillStyle = line; for (let x = -20; x < w + 20; x += 60) ctx.fillRect(x, gy + 40, 34, 6); }
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
  ctx.fillStyle = col;
  ctx.fillText(s, x, y);
  ctx.restore();
}
function shadow(ctx, x, y, r, a = 0.25) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function circle(ctx, x, y, r, col, a = 1) {
  ctx.save(); ctx.globalAlpha = clamp(a); ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function ring(ctx, x, y, r, col, lw = 4, a = 1) {
  ctx.save(); ctx.globalAlpha = clamp(a); ctx.strokeStyle = col; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}
function line(ctx, x1, y1, x2, y2, col, lw = 3) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}
function rect(ctx, x, y, w, h, col, a = 1) {
  ctx.save(); ctx.globalAlpha = clamp(a); ctx.fillStyle = col; ctx.fillRect(x, y, w, h); ctx.restore();
}
// deterministische partikels vanaf t0, 'what' = emoji-tekens of kleur
function particles(ctx, seed, x, y, t0, t, n, o = {}) {
  const age = t - t0, life = o.life || 1;
  if (age < 0 || age > life) return;
  const sp = o.speed || 160, g = o.g == null ? 500 : o.g, s = o.size || 8;
  for (let i = 0; i < n; i++) {
    const ang = o.up ? -Math.PI / 2 + (rnd(seed + i) - 0.5) * (o.spread || 2) : rnd(seed + i) * Math.PI * 2;
    const v = sp * (0.4 + rnd(seed + i + 50) * 0.8);
    const px = x + Math.cos(ang) * v * age, py = y + Math.sin(ang) * v * age + 0.5 * g * age * age;
    const al = 1 - age / life;
    if (o.chars) em(ctx, o.chars[i % o.chars.length], px, py, s * 2, { a: al, r: age * (rnd(seed + i + 9) - 0.5) * 12 });
    else circle(ctx, px, py, s * (0.5 + rnd(seed + i + 3) * 0.7), o.col || '#fff', al);
  }
}
const boom = (ctx, x, y, t0, t, r = 60) => {
  const k = P(t, t0, t0 + 0.5);
  if (k <= 0 || k >= 1) return;
  ring(ctx, x, y, r * E.out(k), '#ffd23f', 8 * (1 - k), 1 - k);
  em(ctx, '💥', x, y, r * (0.5 + k), { a: 1 - k });
};
const sound = (ctx, x, y, t0, t, n = 3, col = '#fff') => {
  for (let i = 0; i < n; i++) {
    const k = ((t - t0) * 1.4 - i * 0.3);
    if (k > 0 && k < 1) ring(ctx, x, y, 20 + 110 * k, col, 4, 1 - k);
  }
};
const cloud = (ctx, x, y, s = 1, a = 0.9) => { circle(ctx, x, y, 22 * s, '#fff', a); circle(ctx, x + 22 * s, y + 5 * s, 18 * s, '#fff', a); circle(ctx, x - 22 * s, y + 6 * s, 16 * s, '#fff', a); };

export const CLIPS = [
  // a01 kip steekt over, springt over de auto (hop-pad, lineair)
  { id: 'a01', title: 'Waarom stak de kip over?', caption: 'Naar de overkant, en de auto mocht ook even meekijken.', dur: 6,
    draw(ctx, t, w, h) {
      const gy = 420;
      begin(ctx, w, h, { top: '#9fdcff', bot: '#fdf4d0', gy, gc: '#555', gl: '#fff' });
      rect(ctx, 0, 330, w, 90, '#7ec850');
      const cx = lerp(-40, 400, E.io(P(t, 0.4, 5.2)));
      const carx = lerp(460, -120, P(t, 1.6, 4.4));
      const jump = arc(P(cx, 130, 250), 90);
      shadow(ctx, cx, gy + 40, 30 - jump * 0.1);
      em(ctx, '🚗', carx, gy + 20, 90);
      em(ctx, '🐔', cx, gy + 14 - jump - Math.abs(Math.sin(t * 9)) * 8 * (jump < 1 ? 1 : 0), 64, { fx: true, r: jump > 5 ? -0.3 : 0 });
      if (jump > 60) em(ctx, '😎', cx, gy - jump - 30, 22);
      particles(ctx, 5, 330, gy + 30, 4.8, t, 6, { chars: ['🥚'], life: 0.8, up: true, speed: 120, size: 14 });
      end(ctx);
    } },
  // a02 kat duwt glas van tafel (duwen, vallen, schermschudden)
  { id: 'a02', title: 'Zwaartekracht-test', caption: 'De kat controleert of het nog steeds werkt.', dur: 6,
    draw(ctx, t, w, h) {
      const gy = 520, sh = t > 3.1 && t < 3.6 ? shk(t, 6) : [0, 0];
      begin(ctx, w, h, { top: '#ffe9c7', bot: '#fff6e6', gy, gc: '#b98a5a', sh });
      rect(ctx, 20, 330, 230, 14, '#7a4b25'); rect(ctx, 40, 344, 12, 186, '#7a4b25'); rect(ctx, 218, 344, 12, 186, '#7a4b25');
      const push = P(t, 1.2, 2.4), gl = t < 2.4 ? 250 + push * 50 : 300;
      const fall = P(t, 2.4, 3.1);
      const gyy = t < 2.4 ? 300 : lerp(300, 505, E.in(fall));
      const cx = lerp(110, 170 + 30 * push, E.io(P(t, 0.3, 1.3)));
      em(ctx, '🐈', cx, 290, 80, { r: Math.sin(t * 3) * 0.05 });
      if (t < 3.1) em(ctx, '🥛', t < 2.4 ? lerp(210, 245, push) : 252 + (t - 2.4) * 20, gyy, 40, { r: t > 2.4 ? (t - 2.4) * 6 : 0 });
      else { particles(ctx, 12, 270, 500, 3.1, t, 12, { chars: ['💧'], life: 1, up: true, size: 8, speed: 180 }); em(ctx, '💦', 270, 515, 50, { a: P(t, 3.1, 3.3) }); }
      if (t > 3.3) em(ctx, '🐈', cx, 290, 80, { sx: 1, a: 0 });
      if (t > 3.4) em(ctx, '😼', cx + 5, 270, 20);
      if (t > 4.2) txt(ctx, 'Nog een keer.', 180, 580, 22, '#7a4b25', P(t, 4.2, 4.6));
      end(ctx);
    } },
  // a03 hond achtervolgt postbode (achtervolging)
  { id: 'a03', title: 'Postbode-sprint', caption: 'Het was geen brief, het was een persoonlijke uitnodiging.', dur: 6,
    draw(ctx, t, w, h) {
      const gy = 450;
      begin(ctx, w, h, { top: '#c8ecff', bot: '#fff', gy, gc: '#8bd36b' });
      const k = P(t, 0.3, 4.6);
      const px = lerp(-60, 330, E.in(k)), dx = px - lerp(120, 40, E.out(P(t, 0.3, 1))) * (t < 3 ? 1 : 1);
      const bob = Math.abs(Math.sin(t * 14)) * 12;
      const dogx = t < 3.2 ? px - 110 + 40 * Math.sin(t * 2) : lerp(px - 70, 330 - 40, P(t, 3.2, 4.4));
      shadow(ctx, px, gy + 28, 30); shadow(ctx, dogx, gy + 28, 30);
      for (let i = 0; i < 5; i++) { const a = P(t, 0.4 + i * 0.1, 3); if (a > 0 && a < 1) em(ctx, '✉️', px + 20 - i * 25, gy - 30 - 40 * a - i * 10, 22, { a: 1 - a, r: i }); }
      em(ctx, '🏃', px, gy - bob, 70);
      em(ctx, '🐕', dogx, gy + 6 - bob, 66, { fx: true });
      if (t > 4.4) {
        const kk = P(t, 4.4, 4.7);
        em(ctx, '🏠', 330, 380, 120, { sx: 1 + 0.1 * kk });
        em(ctx, '🚪', 300, 420, 50);
      }
      if (t > 4.5) txt(ctx, 'Dat was een korte', 180, 150, 24, '#333', P(t, 4.5, 4.9));
      if (t > 4.5) txt(ctx, 'wandeling.', 180, 180, 24, '#333', P(t, 4.8, 5.2));
      end(ctx);
    } },
  // a04 pinguin glijdt van schots naar schots (glijden, ping-pong, plons)
  { id: 'a04', title: 'IJsbaan', caption: 'De pinguin had de remmen thuis laten liggen.', dur: 6,
    draw(ctx, t, w, h) {
      begin(ctx, w, h, { top: '#cdeaff', bot: '#7ec8ff' });
      rect(ctx, 0, 380, w, 260, '#2f8fd8');
      for (let i = 0; i < 6; i++) rect(ctx, 0, 400 + i * 40 + Math.sin(t * 2 + i) * 4, w, 4, 'rgba(255,255,255,0.3)');
      rect(ctx, 0, 330, 140, 60, '#f4fbff'); rect(ctx, 230, 330, 140, 60, '#f4fbff');
      const k = P(t, 0.5, 3.2);
      const x = lerp(40, 300, E.in(k));
      let y = 330 - 30;
      if (x > 140 && x < 230 && t < 4.5) y = 330 - 30 + E.in(P(x, 140, 230)) * 120;
      if (t > 3.2) { const dd = P(t, 3.2, 3.8); y = 400 + 100 * dd; }
      const rot = x > 140 ? 1.2 * P(x, 120, 230) : 0;
      if (t < 3.8) em(ctx, '🐧', x, y, 62, { r: t < 3.2 ? 1.57 * Math.min(1, P(t, 0.4, 0.8)) + rot : 0 });
      boom(ctx, 0, 0, 99, t);
      particles(ctx, 8, 275, 410, 3.2, t, 14, { col: '#bfe7ff', life: 0.9, up: true, size: 7, speed: 200 });
      ring(ctx, 275, 395, 70 * P(t, 3.2, 4), '#fff', 3, 1 - P(t, 3.2, 4));
      if (t > 4.2) {
        const kk = E.back(P(t, 4.2, 5));
        em(ctx, '🐧', 300, lerp(420, 300, kk), 62, { sx: 1 });
        em(ctx, '🐟', 300, lerp(420, 300, kk) + 6, 34, { r: 0.4 });
        em(ctx, '🪣', 100, 280, 1, { a: 0 });
      }
      end(ctx);
    } },
  // a05 eend vs brood (rollen, groeien)
  { id: 'a05', title: 'Brood voor de eend', caption: 'Hoe meer hij at, hoe groter het probleem.', dur: 7,
    draw(ctx, t, w, h) {
      begin(ctx, w, h, { top: '#bfe8ff', bot: '#e9fbff' });
      rect(ctx, 0, 360, w, 280, '#3aa0d8');
      for (let i = 0; i < 7; i++) rect(ctx, (i * 70 + t * 20) % 400 - 30, 380 + (i % 3) * 40, 40, 3, 'rgba(255,255,255,0.5)');
      const eaten = P(t, 1, 5);
      const br = 30 * (1 - E.io(P(t, 1.2, 2.2))) + 6;
      if (t < 2.4) em(ctx, '🍞', lerp(300, 120, E.out(P(t, 0.2, 1.2))), 372 + Math.sin(t * 6) * 4, 18 + br, { r: t * 3 });
      const grow = 1 + 3.2 * E.in(P(t, 2.2, 6.0));
      const wob = Math.sin(t * 8) * 0.06;
      em(ctx, '🦆', 100 + 40 * P(t, 5.6, 7), 380 - 20 * (grow - 1), 70 * grow, { r: wob, fx: true });
      if (t > 3.2) for (let i = 0; i < 4; i++) { const a = P(t, 2.4 + i * 0.7, 3.2 + i * 0.7); em(ctx, '🍞', 250 - i * 3, lerp(100, 500, E.in(a)) , 20, { a: a > 0 && a < 1 ? 1 : 0 }); }
      if (t > 5.6) txt(ctx, 'KWAAK', 180, 120, 36, '#fff', P(t, 5.6, 5.8));
      sound(ctx, 120, 330, 5.6, t, 3, '#fff');
      end(ctx);
    } },
  // a06 hamster in wiel (draaien, wiel vliegt weg)
  { id: 'a06', title: 'Cardio', caption: 'Hij rende zo hard dat de kooi hem niet meer kon bijhouden.', dur: 6,
    draw(ctx, t, w, h) {
      const sh = t > 3.6 ? shk(t, 3 * (1 - P(t, 3.6, 5))) : [0, 0];
      begin(ctx, w, h, { top: '#fff1d6', bot: '#ffe0b2', gy: 520, gc: '#c79a63', sh });
      const spd = 4 + 40 * E.in(P(t, 0, 3.5)); const ang = spd * t * 0.5;
      let wx = 180, wy = 400, hamx = 180;
      if (t > 3.6) { const k = t - 3.6; wx = 180 + 220 * k; wy = 400 + 0; hamx = wx; }
      ring(ctx, wx, wy, 90, '#888', 6);
      for (let i = 0; i < 8; i++) { const a = ang + i * Math.PI / 4; line(ctx, wx, wy, wx + Math.cos(a) * 90, wy + Math.sin(a) * 90, '#aaa', 2); }
      line(ctx, 180, 400, 120, 520, '#888', 5); line(ctx, 180, 400, 240, 520, '#888', 5);
      em(ctx, '🐹', hamx, wy + 30 + Math.abs(Math.sin(t * 12)) * 6 * (t < 3.6 ? 1 : 0), 56, { r: t > 3.6 ? (t - 3.6) * 6 : Math.sin(t * 20) * 0.1 });
      if (t < 3.6) for (let i = 0; i < 3; i++) line(ctx, 80 - i * 14, 380 + i * 20, 40 - i * 14 - 20 * E.in(P(t, 0, 3)), 380 + i * 20, 'rgba(255,255,255,0.8)', 3);
      if (t > 3.6) { txt(ctx, '!', 70, 300, 50, '#e53935'); particles(ctx, 4, 180, 520, 3.6, t, 10, { col: '#c79a63', life: 1, up: true, size: 6 }); }
      end(ctx);
    } },
  // a07 goudvis geheugen (golven, nieuwe kasteel elke ronde)
  { id: 'a07', title: 'Drie seconden geheugen', caption: 'Elke ronde een nieuwe wereld, elke ronde dezelfde verbazing.', dur: 7,
    draw(ctx, t, w, h) {
      begin(ctx, w, h, { top: '#5ec2ff', bot: '#0b5da8' });
      for (let i = 0; i < 18; i++) circle(ctx, rnd(i) * 360, 640 - ((t * (30 + rnd(i + 3) * 40) + rnd(i + 1) * 640) % 640), 3 + rnd(i + 7) * 5, '#fff', 0.35);
      rect(ctx, 0, 560, w, 80, '#e8c97a');
      const lap = t / 1.75; const phase = lap % 1; const idx = Math.floor(lap);
      const dir = idx % 2 === 0 ? 1 : -1;
      const x = dir > 0 ? lerp(50, 310, E.io(phase)) : lerp(310, 50, E.io(phase));
      const castle = ['🏰', '⚓', '🗿', '🏯'][idx % 4];
      em(ctx, castle, 180, 520, 100, { a: 0.9 });
      em(ctx, '🐠', x, 300 + Math.sin(t * 3) * 40, 60, { fx: dir < 0 });
      if (phase > 0.45 && phase < 0.9) txt(ctx, '❗', x, 240 + Math.sin(t * 3) * 40, 34, '#fff', 1 - P(phase, 0.75, 0.9));
      for (let i = 0; i < 5; i++) { const px = 40 + i * 70; em(ctx, '🌿', px, 590, 36, { r: Math.sin(t * 2 + i) * 0.2 }); }
      end(ctx);
    } },
  // a08 koffie morsen (struikelen, boog, kat drinkt)
  { id: 'a08', title: 'Eerste koffie', caption: 'Hij nam geen genoegen met minder dan een perfecte boog.', dur: 6,
    draw(ctx, t, w, h) {
      const gy = 480, sh = t > 2.2 && t < 2.6 ? shk(t, 5) : [0, 0];
      begin(ctx, w, h, { top: '#fff0d8', bot: '#fffaf0', gy, gc: '#d9b38c', sh });
      const wx = lerp(-30, 170, E.io(P(t, 0.2, 2.1)));
      const fallk = P(t, 2.1, 2.8);
      const body = t < 2.1 ? 0 : 1.57 * E.in(fallk);
      em(ctx, '🐈', 230, gy + 4, 54, { fx: true });
      if (t < 2.1) em(ctx, '🚶', wx, gy - 20 - Math.abs(Math.sin(t * 8)) * 6, 76);
      else em(ctx, '🚶', wx + 40 * fallk, gy - 20 + 28 * fallk, 76, { r: body });
      const cupk = P(t, 2.1, 3.6);
      if (t < 2.1) em(ctx, '☕', wx + 30, gy - 60 - Math.abs(Math.sin(t * 8)) * 6, 34);
      else em(ctx, '☕', wx + 30 + 120 * cupk, gy - 60 - arc(cupk, 140) + 90 * cupk, 34, { r: cupk * 9 });
      if (t > 2.2) particles(ctx, 21, wx + 40, gy - 90, 2.1, t, 14, { col: '#6b3e1e', life: 1.2, up: true, speed: 190, size: 6 });
      if (t > 3.6) { em(ctx, '😻', 232, gy - 40, 30); em(ctx, '☕', 230, gy + 30, 34, { a: 1 }); circle(ctx, 250, gy + 40, 20 * P(t, 3.6, 3.9), '#6b3e1e', 0.8); }
      if (t > 4.4) txt(ctx, '*slurp*', 232, gy - 90, 22, '#6b3e1e', P(t, 4.4, 4.7));
      end(ctx);
    } },
  // a09 bus missen (ping-pong, herhaling)
  { id: 'a09', title: 'Net niet', caption: 'De bus kwam precies zo vaak als hij dacht dat hij kwam.', dur: 7,
    draw(ctx, t, w, h) {
      const gy = 470;
      begin(ctx, w, h, { top: '#a9dcff', bot: '#f4fbff', gy, gc: '#666', gl: '#ffe34d' });
      rect(ctx, 0, 380, w, 90, '#b9b9b9');
      em(ctx, '🚏', 290, gy - 30, 70);
      const cyc = 1.9; const k = (t % cyc) / cyc; const n = Math.floor(t / cyc);
      const busx = n < 3 ? lerp(300, -140, E.in(P(k, 0.45, 1))) : 400;
      const manx = n < 3 ? lerp(40, 280, E.out(P(k, 0, 0.55)) ) : 300;
      if (n < 3) { em(ctx, '🚌', k < 0.45 ? lerp(420, 290, E.out(P(k, 0, 0.3))) : busx, gy - 10, 100, { fx: false }); em(ctx, '🏃', manx, gy + 10 - Math.abs(Math.sin(t * 14)) * 8, 66); if (k > 0.55 && k < 0.9) txt(ctx, '😩', manx, gy - 70, 30); }
      else {
        const kk = P(t, 3 * cyc, 7);
        em(ctx, '🚌', 290, gy - 10, 100, { fx: false });
        em(ctx, '🚶', lerp(40, 300, E.out(kk)), gy + 10, 66);
        txt(ctx, 'Staking.', 180, 180, 40, '#d32f2f', P(t, 6.1, 6.4));
      }
      if (n < 3 && k > 0.5) particles(ctx, 40 + n, 290, gy + 20, n * cyc + k * 0 + 0.45 * cyc, t, 5, { col: '#888', life: 0.8, up: true, size: 9, speed: 60, g: -20 });
      end(ctx);
    } },
  // a10 sleutels kwijt (camera-zoom)
  { id: 'a10', title: 'Waar zijn mijn sleutels?', caption: 'Ze zaten er vanaf het begin in. Zo zijn sleutels nou eenmaal.', dur: 7,
    draw(ctx, t, w, h) {
      begin(ctx, w, h, { top: '#e8e0ff', bot: '#f8f4ff', gy: 520, gc: '#bfae9a' });
      const z = 1 + 1.7 * E.io(P(t, 4.6, 6.2));
      ctx.save();
      ctx.translate(180, 330); ctx.scale(z, z); ctx.translate(-180 - (z - 1) * 22, -330 - (z - 1) * 6);
      const pat = Math.sin(t * 7) * 18 * (1 - P(t, 4, 4.6));
      em(ctx, '🧍', 180, 400, 150 + pat * 0.1);
      em(ctx, '🔑', 205 + (t > 4.6 ? 0 : 0), 400, 24 + (t > 4.2 ? 0 : 0), { r: 0.3, a: t > 4.4 ? 1 : 0.0 + 1 });
      if (t < 4.4) {
        em(ctx, '🤚', 140 + Math.sin(t * 7) * 8, 360 + Math.cos(t * 5) * 12, 28);
        em(ctx, '🤚', 220 + Math.sin(t * 6) * 8, 440 + Math.cos(t * 5) * 12, 28);
      }
      txt(ctx, '?', 140 + Math.sin(t * 3) * 10, 290 - arc(P(t % 1, 0, 1), 20), 40, '#7b4bd8', t < 4.4 ? 1 : 0);
      ctx.restore();
      if (t > 5.8) txt(ctx, 'Jep.', 180, 120, 36, '#333', P(t, 5.8, 6.1));
      end(ctx);
    } },
  // a11 wifi valt uit (balken zakken, woede, kat op kabel)
  { id: 'a11', title: 'Geen verbinding', caption: 'De boosdoener zat al de hele tijd op de kabel.', dur: 7,
    draw(ctx, t, w, h) {
      const rage = P(t, 1.5, 4.5), sh = t < 4.5 ? shk(t, 6 * rage) : [0, 0];
      begin(ctx, w, h, { top: '#d8e8f8', bot: '#bcd0e8', gy: 500, gc: '#8aa0b8', sh });
      const bars = t < 1 ? 4 : t < 1.6 ? 3 : t < 2.2 ? 2 : t < 2.8 ? 1 : 0;
      for (let i = 0; i < 4; i++) rect(ctx, 130 + i * 28, 140 - i * 20 + (3 - i) * 0, 20, 30 + i * 20, i < bars ? '#34c759' : '#9aa9b8');
      if (t > 2.8) txt(ctx, '✖', 180, 90, 28, '#e53935', 0.6 + 0.4 * Math.sin(t * 12));
      em(ctx, rage > 0.7 ? '🤬' : rage > 0.2 ? '😠' : '🙂', 180, 360, 70 + rage * 40, { r: Math.sin(t * 20) * 0.15 * rage });
      em(ctx, '💻', 180, 450, 80);
      if (t > 4.5) {
        const k = E.back(P(t, 4.5, 5.2));
        em(ctx, '📡', 290, 440, 60);
        em(ctx, '🐈', 290, lerp(520, 395, k), 54, { sx: 1 });
        txt(ctx, 'miauw', 290, 340, 18, '#333', P(t, 5.3, 5.6));
        if (t > 5.8) { for (let i = 0; i < 4; i++) rect(ctx, 130 + i * 28, 140 - i * 20, 20, 30 + i * 20, '#34c759', P(t, 5.8, 6)); }
      }
      end(ctx);
    } },
  // a12 oplader leeg (krimpen, donker)
  { id: 'a12', title: 'Eén procent', caption: 'De stekker zat erin. Alleen de stroom niet.', dur: 7,
    draw(ctx, t, w, h) {
      const dark = t > 5.4 ? P(t, 5.4, 5.7) : 0;
      begin(ctx, w, h, { top: '#2b2f4a', bot: '#4c5380', gy: 520, gc: '#2a2d44' });
      const pc = Math.max(1, Math.round(lerp(20, 1, P(t, 0, 3.6))));
      const col = pc > 10 ? '#34c759' : '#ff3b30';
      rect(ctx, 100, 230, 160, 90, '#fff', 0.15); rect(ctx, 260, 255, 14, 40, '#fff', 0.5);
      rect(ctx, 106, 236, 148 * pc / 100 * (1 + 0), 78, col, pc <= 5 ? 0.5 + 0.5 * Math.sin(t * 14) : 1);
      txt(ctx, pc + '%', 180, 275, 40, '#fff');
      const k = E.out(P(t, 3.6, 4.4));
      em(ctx, '🔌', lerp(340, 220, k), 420, 70, { r: -0.3 });
      em(ctx, '🔋', 160, 420, 1, { a: 0 });
      em(ctx, '⚡', 180, 400, 60, { a: t > 4.4 && t < 5.4 ? 1 : 0, sy: 1 + 0.2 * Math.sin(t * 20) });
      if (t > 4.4) { rect(ctx, 106, 236, 10, 78, '#ff3b30'); }
      em(ctx, '🕯️', 60, 480, 44, { a: dark });
      if (t > 5.4) { rect(ctx, -10, -10, w + 20, h + 20, '#000', 0.8 * dark); em(ctx, '🕯️', 180, 340, 60, { a: dark }); txt(ctx, 'Stroomstoring.', 180, 430, 22, '#ffd23f', P(t, 5.7, 6.2)); }
      end(ctx);
    } },
  // a13 kat en laserpunt (zigzag achtervolging, kat vs eigen staart)
  { id: 'a13', title: 'Het rode punt', caption: 'Ze won, alleen niet van het punt.', dur: 7,
    draw(ctx, t, w, h) {
      begin(ctx, w, h, { top: '#fdebd0', bot: '#fff7e6', gy: 540, gc: '#e0b98a' });
      const dx = 180 + 130 * Math.sin(t * 2.6), dy = 380 + 90 * Math.sin(t * 3.7 + 1);
      const cx = lerp(60, dx, E.out(P(t, 0, 1))) * (t < 4.5 ? 1 : 0) + (t >= 4.5 ? 180 : 0);
      const cy = t < 4.5 ? lerp(500, dy + 30, E.out(P(t, 0, 1))) : 480;
      if (t < 4.5) {
        circle(ctx, dx, dy, 10, '#ff2a2a'); circle(ctx, dx, dy, 22, '#ff2a2a', 0.2);
        em(ctx, '🐈', lerp(cx, dx, 0.7), Math.min(500, cy), 80, { fx: dx < cx, r: Math.sin(t * 12) * 0.12 });
      } else {
        const sp = (t - 4.5) * 11;
        em(ctx, '🐈‍⬛', 180, 480, 76, { r: sp });
        em(ctx, '🌀', 180, 480, 44 + 5 * Math.sin(t * 15), { r: -sp * 1.3, a: 0.45 });
        circle(ctx, 180 + Math.cos(sp * 1.1) * 54, 480 + Math.sin(sp * 1.1) * 54, 8, '#ff2a2a');
        txt(ctx, '😵', 180, 330, 36, '#000', P(t, 5.6, 6));
      }
      end(ctx);
    } },
  // a14 hond vs stofzuiger (krimpen, zuigen)
  { id: 'a14', title: 'Het monster', caption: 'Het blaffen hielp niet. De zuigkracht wel, helaas.', dur: 6,
    draw(ctx, t, w, h) {
      const gy = 500;
      begin(ctx, w, h, { top: '#ffeaf0', bot: '#fff8fa', gy, gc: '#d9b8a0' });
      const vac = lerp(430, 150, E.out(P(t, 0.4, 3)));
      const suck = E.in(P(t, 3, 4.6));
      const dogx = lerp(100, vac - 40, suck);
      const sc = 1 - 0.95 * suck;
      const bark = t < 3 ? Math.sin(t * 22) * 0.12 : 0;
      shadow(ctx, vac, gy + 30, 50);
      em(ctx, '🐕', dogx, gy - 10 * sc, 90 * sc, { r: bark + suck * 8, fx: true, a: 1 });
      em(ctx, '🧹', vac, gy - 20, 100, { fx: false });
      if (t < 3) { txt(ctx, 'WAF!', 90, 360 - Math.abs(Math.sin(t * 5)) * 12, 26, '#e53935'); }
      if (t > 3) for (let i = 0; i < 6; i++) { const a = (t * 2 + i / 6) % 1; em(ctx, '💨', lerp(dogx + 60, vac - 40, a), gy - 20 - 20 * Math.sin(a * 3), 22, { a: 1 - a }); }
      if (t > 4.6) { const b = P(t, 4.6, 5); em(ctx, '🐕', vac - 20, gy - 40, 24, { a: b > 0 ? 1 : 0, sx: 1 }); em(ctx, '😳', vac, gy - 60, 26, { a: b }); }
      end(ctx);
    } },
  // a15 kat in te kleine doos (squish, vloeien)
  { id: 'a15', title: 'Als ik past, dan zit ik', caption: 'Wetenschappelijk bewijs dat katten een vloeistof zijn.', dur: 6,
    draw(ctx, t, w, h) {
      const gy = 520;
      begin(ctx, w, h, { top: '#e8f4ff', bot: '#fff', gy, gc: '#c9b79c' });
      const k = E.io(P(t, 1, 3.4));
      const sx = lerp(1, 1.3, k), sy = lerp(1, 0.4, k);
      const cx = lerp(80, 220, E.out(P(t, 0, 1)));
      const cy = lerp(gy - 40, gy - 70, E.in(P(t, 3.4, 3.6)) * 0) ;
      const dropk = E.bounce(P(t, 3.2, 4.2));
      if (t < 3.2) em(ctx, '🐈', cx, gy - 50 - arc(P(t, 1, 3.2), 0), 100, { sx, sy });
      else em(ctx, '🐈', 220, lerp(gy - 140, gy - 42, dropk), 100, { sx: 1.3, sy: 0.4 + 0.1 * Math.sin((t - 3.2) * 30) * (1 - P(t, 3.2, 4)) });
      em(ctx, '📦', 220, gy - 30, 90 + 0, { sx: 1.0 + 0.1 * (t > 3.4 ? 1 : 0) });
      if (t < 1) em(ctx, '🐈', cx, gy - 50, 1, { a: 0 });
      if (t > 4.2) { em(ctx, '😌', 238, gy - 74, 26, { a: P(t, 4.2, 4.5) }); txt(ctx, 'prrr', 220, gy - 120, 20, '#555', P(t, 4.5, 4.8)); }
      end(ctx);
    } },
  // a16 hamster wangen groeien -> explosie zaden (groeien, lawine)
  { id: 'a16', title: 'Voorraad', caption: 'Hij zei dat hij maar één zaadje nam.', dur: 7,
    draw(ctx, t, w, h) {
      const boomT = 5.2, sh = t > boomT && t < boomT + 0.4 ? shk(t, 8) : [0, 0];
      begin(ctx, w, h, { top: '#fff1d0', bot: '#ffe7b0', gy: 500, gc: '#d9ad6b', sh });
      const g = E.in(P(t, 0.8, boomT));
      const wob = Math.sin(t * 6) * 0.04;
      if (t < boomT) {
        em(ctx, '🐹', 180, 420, 90 + 150 * g, { sx: 1 + g * 0.1, sy: 1, r: wob });
        for (let i = 0; i < 6; i++) { const a = P(t, 0.5 + i * 0.7, 1.2 + i * 0.7); if (a > 0 && a < 1) em(ctx, '🌻', lerp(330, 180, a), lerp(300, 410, a) - arc(a, 40), 22, { a: 1 - a * 0.2 }); }
      } else {
        boom(ctx, 180, 400, boomT, t, 150);
        particles(ctx, 31, 180, 400, boomT, t, 40, { chars: ['🌻', '🥜', '🌰'], life: 1.8, speed: 420, g: 700, size: 14 });
        em(ctx, '🐹', 180, 470, 70, { a: P(t, boomT + 0.4, boomT + 0.8), sy: 0.9 });
        if (t > boomT + 1.2) txt(ctx, 'Oeps.', 180, 330, 30, '#8a5a1a', P(t, boomT + 1.2, boomT + 1.5));
      }
      end(ctx);
    } },
  // a17 ei -> krokodil (plot twist, scheuren)
  { id: 'a17', title: 'Schattig kuikentje', caption: 'Niemand had gevraagd waar het ei vandaan kwam.', dur: 6,
    draw(ctx, t, w, h) {
      const sh = t > 2.4 && t < 3 ? shk(t, 6) : [0, 0];
      begin(ctx, w, h, { top: '#d6f0c0', bot: '#f4fbe8', gy: 460, gc: '#78b857', sh });
      const wob = t < 2.4 ? Math.sin(t * (6 + t * 4)) * 0.15 * P(t, 0.3, 2.4) : 0;
      if (t < 2.6) { em(ctx, '🥚', 180, 410, 100, { r: wob }); if (t > 1.6) line(ctx, 160, 390, 190, 410, '#8a6a3a', 3); }
      else {
        particles(ctx, 17, 180, 400, 2.6, t, 12, { chars: ['🥚'], life: 1, up: true, size: 8, speed: 220 });
        const k = E.back(P(t, 2.6, 3.3));
        em(ctx, '🐊', 180, lerp(470, 395, k), 130 * k + 10, { fx: false });
        if (t > 3.6) { txt(ctx, '🐥', 90, 380, 1, '#000', 0); const rk = P(t, 3.6, 5.4); em(ctx, '🐥', lerp(230, -60, E.in(rk)), 430 - Math.abs(Math.sin(t * 16)) * 14, 40, { fx: true }); }
        if (t > 3.6) txt(ctx, 'Mama?', 180, 280, 28, '#2e6b2e', P(t, 3.6, 3.9));
      }
      end(ctx);
    } },
  // a18 pinguin in de woestijn (hitte, smelten, ijsje)
  { id: 'a18', title: 'Vakantie', caption: 'De brochure zei "zonnig". Over de rest zweeg hij.', dur: 7,
    draw(ctx, t, w, h) {
      const heat = P(t, 0, 4.5);
      begin(ctx, w, h, { top: `rgb(255,${Math.round(220 - heat * 60)},${Math.round(150 - heat * 80)})`, bot: '#ffe7a0', gy: 470, gc: '#e5b565' });
      circle(ctx, 280, 110, 50 + heat * 70, '#ff9f1c', 0.35); em(ctx, '☀️', 280, 110, 70 + heat * 110);
      const x = lerp(30, 190, E.out(P(t, 0, 3)));
      const melt = E.in(P(t, 3, 5));
      if (t < 5) em(ctx, '🐧', x, 440 + 24 * melt, 80 * (1 - 0.0 * melt), { sy: 1 - 0.55 * melt, sx: 1 + 0.5 * melt });
      if (t > 3) for (let i = 0; i < 4; i++) { const a = (t * 1.5 + i * 0.25) % 1; em(ctx, '💧', x - 20 + i * 14, 400 - a * 40, 14, { a: 1 - a }); }
      if (t > 4.3) em(ctx, '🕶️', x, 430 + 24 * melt, 36, { a: P(t, 4.3, 4.6) });
      if (t > 5) {
        const k = E.back(P(t, 5, 5.7));
        em(ctx, '🐧', x, 440, 80 * k);
        em(ctx, '🕶️', x, 424, 36 * k);
        em(ctx, '🍦', x + 40, 450, 44 * k, { r: 0.2 });
        em(ctx, '🏝️', 70, 380, 1, { a: 0 });
      }
      for (let i = 0; i < 12; i++) rect(ctx, 20 + i * 30, 470 - 4 * Math.sin(t * 4 + i), 18, 2, '#fff', 0.35 * heat);
      end(ctx);
    } },
  // a19 eend kwaakt ruiten kapot (geluidsgolven, verbrijzelen)
  { id: 'a19', title: 'Opera-eend', caption: 'Ze had het concert beter in de tuin kunnen geven.', dur: 6,
    draw(ctx, t, w, h) {
      const q = t > 1.3 ? 1 : 0, sh = t > 2.3 && t < 4 ? shk(t, 4) : [0, 0];
      begin(ctx, w, h, { top: '#cfe8ff', bot: '#eef8ff', gy: 500, gc: '#8ecb6a', sh });
      em(ctx, '🦆', 100, 470, 90, { sy: 1 + 0.1 * Math.sin(t * 20) * q, fx: false });
      sound(ctx, 150, 450, 1.3, t, 4, '#ff9f1c'); sound(ctx, 150, 450, 1.3 + 1.2, t, 4, '#ff9f1c');
      for (let i = 0; i < 2; i++) {
        const wx = 230, wy = 200 + i * 130;
        if (t < 2.3 + i * 0.8) { rect(ctx, wx, wy, 90, 100, '#a9dcff'); rect(ctx, wx, wy, 90, 100, '#fff', 0.2); line(ctx, wx + 45, wy, wx + 45, wy + 100, '#7a5b3a', 4); line(ctx, wx, wy + 50, wx + 90, wy + 50, '#7a5b3a', 4); ring(ctx, wx + 45, wy + 50, 1, '#fff', 1); }
        else { particles(ctx, 60 + i, wx + 45, wy + 50, 2.3 + i * 0.8, t, 16, { col: '#bfe8ff', life: 1.2, speed: 200, size: 6 }); rect(ctx, wx, wy, 90, 100, '#000', 0); }
      }
      if (t > 4.4) { txt(ctx, 'Bis!', 120, 380, 34, '#d84315', P(t, 4.4, 4.7)); em(ctx, '🏠', 300, 100, 1, { a: 0 }); }
      end(ctx);
    } },
  // a20 vis springt van kom naar kom (teleporteren boog)
  { id: 'a20', title: 'Verhuizing', caption: 'Hij had geen offerte nodig.', dur: 7,
    draw(ctx, t, w, h) {
      begin(ctx, w, h, { top: '#f5ecff', bot: '#e8f5ff', gy: 520, gc: '#c9b9a5' });
      const bowls = [[60, 460], [180, 460], [300, 460]];
      bowls.forEach(([x, y], i) => { circle(ctx, x, y, 44, 'rgba(120,200,255,0.65)'); ring(ctx, x, y, 44, '#8ad', 4); rect(ctx, x - 30, y + 36, 60, 20, '#8ad', 0.0); });
      em(ctx, '🍵', 300, 470, 70); em(ctx, '🧼', 60, 440, 0.1);
      const seg = t < 2.4 ? 0 : t < 4.4 ? 1 : 2;
      let fx, fy, r = 0;
      if (t < 1) { fx = 60; fy = 450 + Math.sin(t * 6) * 6; }
      else if (t < 2.0) { const k = P(t, 1, 2); fx = lerp(60, 180, k); fy = 450 - arc(k, 160); r = lerp(-1, 1, k); }
      else if (t < 3.2) { fx = 180; fy = 450 + Math.sin(t * 6) * 6; }
      else if (t < 4.2) { const k = P(t, 3.2, 4.2); fx = lerp(180, 300, k); fy = 450 - arc(k, 180); r = lerp(-1, 1, k); }
      else { fx = 300; fy = 440 + Math.sin(t * 6) * 4; }
      em(ctx, '🐟', fx, fy, 38, { r });
      if (t > 4.2) { for (let i = 0; i < 4; i++) { const a = (t * 1.2 + i * 0.25) % 1; em(ctx, '☁️', 296 + (i - 1.5) * 8, 410 - a * 70, 18, { a: 1 - a }); } txt(ctx, 'Ik kom wel.', 180, 200, 24, '#555', P(t, 5, 5.4)); }
      if (t > 5.6) { em(ctx, '😳', 320, 380, 26, { a: P(t, 5.6, 5.8) }); }
      end(ctx);
    } },
  // a21 wasmachine eet sokken (draaien, teleport)
  { id: 'a21', title: 'De wasmachine-wet', caption: 'Eén sok kwam eruit. De andere ging op reis.', dur: 7,
    draw(ctx, t, w, h) {
      begin(ctx, w, h, { top: '#e6f0ff', bot: '#f8fbff', gy: 560, gc: '#c3cbd6' });
      rect(ctx, 60, 140, 240, 340, '#f5f5f5'); rect(ctx, 60, 140, 240, 340, '#000', 0.04);
      rect(ctx, 70, 150, 220, 40, '#d0d6de');
      ring(ctx, 180, 340, 90, '#6d7a8a', 10); circle(ctx, 180, 340, 84, 'rgba(120,180,240,0.35)');
      const spin = t < 5.3 ? E.in(P(t, 0.6, 1.8)) * 40 + t * 3 : 0;
      for (let i = 0; i < 2; i++) { if (t < 2.4 || i === 0) { const a = spin * (i ? 1 : 1.1) + i * 3; const rr = t < 5.3 ? 45 : 0; const out = i === 0 && t > 4.6; const k = P(t, 4.6, 5.4); em(ctx, '🧦', out ? lerp(180 + Math.cos(a) * rr, 190, E.out(k)) : 180 + Math.cos(a) * rr, out ? lerp(340 + Math.sin(a) * rr, 500, E.in(k)) : 340 + Math.sin(a) * rr, 36, { r: a }); } }
      if (t < 2.4) { }
      if (t >= 2.4 && t < 2.9) particles(ctx, 71, 190, 330, 2.4, t, 10, { col: '#a78bfa', life: 0.6, speed: 100, g: 0, size: 6 });
      if (t >= 2.4 && t < 4.3) { /* de andere sok is weg */ }
      if (t > 4.3) {
        const k = P(t, 4.3, 5);
        rect(ctx, 0, 0, 1, 1, '#000', 0);
        em(ctx, '🏝️', 310, 590, 1, { a: 0 });
        const px = 300, py = 60;
        circle(ctx, px, py, 40 * k, '#7fd6ff', 0.8 * k);
        em(ctx, '🧦', px, py + 4, 44 * k, { r: Math.sin(t * 5) * 0.3 });
        em(ctx, '🕶️', px, py - 6, 20 * k); em(ctx, '🍹', px + 28, py + 8, 22 * k);
        txt(ctx, 'Hoi!', px, py + 54, 16, '#333', k);
      }
      end(ctx);
    } },
  // a22 boterham met boter naar beneden + kat (rotatie, zweven)
  { id: 'a22', title: 'Wet van Murphy', caption: 'Kat met boterham op haar rug: hoppa, eeuwige beweging.', dur: 7,
    draw(ctx, t, w, h) {
      begin(ctx, w, h, { top: '#fff3e0', bot: '#fffaf2', gy: 560, gc: '#d1ae85' });
      const k = P(t, 0.5, 1.6);
      em(ctx, '🐈', 180, lerp(420, 440, 0) + 30, 100, { r: t > 1.6 ? Math.sin(t * 1.5) * 0.1 : 0 });
      if (t < 1.6) {
        em(ctx, '🍞', 180, 400, 50, { a: 1, r: 0 });
        txt(ctx, 'plop', 250, 360, 1, '#000', 0);
      } else {
        const a = t - 1.6;
        const sp = a * 4.2;
        const y = 300 + 24 * Math.sin(a * 1.4) + 0 + (t < 2.4 ? -(1 - P(t, 1.6, 2.4)) * -30 : 0);
        em(ctx, '🐈', 180, 290 + 14 * Math.sin(a * 1.4) + 120, 100, { r: sp * 0 + 3.14 * (0.5 + 0.5 * Math.sin(sp)) * 0 + Math.sin(a * 1.4) * 0.08, sx: 1 });
        em(ctx, '🧈', 180, y - 20, 30, { r: sp });
        em(ctx, '🍞', 180, y - 6, 50, { r: sp });
        if (t > 3) for (let i = 0; i < 3; i++) { const aa = (t * 1.2 + i / 3) % 1; em(ctx, '✨', 150 + i * 30, 330 - aa * 60, 14, { a: 1 - aa }); }
        txt(ctx, 'Zweeft.', 180, 570, 22, '#a07848', P(t, 3, 3.4));
      }
      if (t < 1.6) { /* val uitstel */ }
      end(ctx);
    } },
  // a23 paraplu waait om, man vliegt weg (opstijgen)
  { id: 'a23', title: 'Mary Poppins-effect', caption: 'De weersvoorspelling had "wind" eerlijk genoemd.', dur: 7,
    draw(ctx, t, w, h) {
      begin(ctx, w, h, { top: '#6f7f95', bot: '#b9c6d6', gy: 520, gc: '#667' });
      for (let i = 0; i < 40; i++) { const x = (rnd(i) * 460 + t * 80) % 460 - 50; const y = (rnd(i + 5) * 700 + t * 520) % 700 - 30; line(ctx, x, y, x - 12, y + 30, 'rgba(200,225,255,0.7)', 2); }
      const flip = P(t, 1.6, 2);
      const up = E.in(P(t, 2.4, 5.8));
      const mx = 180 + 30 * Math.sin(t * 2) * up; const my = 470 - 620 * up;
      em(ctx, '🚶', mx, my, 80, { r: Math.sin(t * 10) * 0.05 + up * 0.5 });
      em(ctx, '☂️', mx - 6, my - 60, 70, { sy: 1 - 2 * flip * 0 + 0, r: Math.PI * flip * 0 + Math.sin(t * 14) * 0.2 * (flip > 0 ? 1 : 0), sx: flip > 0.5 ? 1.0 : 1 });
      if (t < 1.6) txt(ctx, '', 0, 0, 1, '#000', 0);
      cloud(ctx, 60, 120 + Math.sin(t) * 6, 1.4, 0.9); cloud(ctx, 300, 60, 1.2, 0.9);
      if (t > 3.2) for (let i = 0; i < 4; i++) em(ctx, '🍃', ((t * 140 + i * 90) % 400) - 20, 180 + i * 90, 18, { r: t * 5 });
      if (t > 5.5) txt(ctx, 'Doei!', 180, 560, 30, '#fff', P(t, 5.5, 5.9));
      shadow(ctx, mx, 540, 30 * (1 - up) + 4, 0.3 * (1 - up));
      end(ctx);
    } },
  // a24 snooze wekker (herhaling, schermschudden, tijd)
  { id: 'a24', title: 'Nog vijf minuutjes', caption: 'De wekker was het niet eens, maar de klok liep gewoon door.', dur: 8,
    draw(ctx, t, w, h) {
      const times = ['07:00', '07:10', '07:25', '08:05', '08:50'];
      const n = Math.min(4, Math.floor(t / 1.5));
      const k = (t % 1.5) / 1.5;
      const wake = t > 6.2;
      const sh = (k < 0.25 && t < 6) ? shk(t, 6) : (wake ? shk(t, 10 * (1 - P(t, 6.2, 7.2))) : [0, 0]);
      begin(ctx, w, h, { top: wake ? '#ffe28a' : '#243b6b', bot: wake ? '#fff1c1' : '#3b5998', gy: 560, gc: wake ? '#d9b97b' : '#1b2a4e', sh });
      rect(ctx, 40, 400, 280, 160, wake ? '#c6a37e' : '#5a4a7a');
      em(ctx, wake ? '😱' : '😴', 120, 430, 70, { r: wake ? Math.sin(t * 30) * 0.2 : -0.1 });
      const rk = (k < 0.25 && t < 6) ? 1 : 0;
      em(ctx, '⏰', 260, 330, 90, { r: rk ? Math.sin(t * 60) * 0.25 : 0 });
      if (k > 0.2 && k < 0.4 && t < 6) { em(ctx, '🤚', lerp(130, 255, P(k, 0.2, 0.3)), 380 - 40 * (1 - P(k, 0.2, 0.3)), 40); }
      txt(ctx, times[n] + (wake ? '' : ''), 260, 230, 36, wake ? '#c62828' : '#9fe3ff');
      if (rk) for (let i = 0; i < 3; i++) txt(ctx, 'RING', 260 + (i - 1) * 50, 270 - i * 8, 14, '#ff6b6b', 1 - k * 3);
      if (wake) { txt(ctx, 'Te laat!', 180, 150, 40, '#c62828', P(t, 6.2, 6.5)); }
      end(ctx);
    } },
  // a25 hond graaft door aarde, komt bovenaan terug (teleporteren)
  { id: 'a25', title: 'Graafwerk', caption: 'Hij zocht een bot en vond de tegenvoeter.', dur: 7,
    draw(ctx, t, w, h) {
      begin(ctx, w, h, { top: '#bfe6ff', bot: '#e8f7ff', gy: 400, gc: '#8a5a2e' });
      rect(ctx, 0, 440, w, 200, '#6e4520');
      const d = E.io(P(t, 0.6, 3.6));
      const holeW = 12 + 50 * P(t, 0.6, 1.5);
      rect(ctx, 150 - holeW / 2 + 30, 400, holeW, 240 * d + 0, '#2d1a0a');
      const dogy = t < 3.6 ? 380 + 220 * d : -60;
      if (t < 3.6) { em(ctx, '🐕', 180, dogy, 68, { r: Math.sin(t * 25) * 0.15, sy: 1 }); particles(ctx, 80, 215, 400, 0.6, t, 8, { col: '#8a5a2e', life: 0.7, up: true, speed: 190, size: 8 }); particles(ctx, 81, 215, 400, 1.3, t, 8, { col: '#8a5a2e', life: 0.7, up: true, speed: 190, size: 8 }); particles(ctx, 82, 215, 400, 2.0, t, 8, { col: '#8a5a2e', life: 0.7, up: true, speed: 190, size: 8 }); particles(ctx, 83, 215, 400, 2.7, t, 8, { col: '#8a5a2e', life: 0.7, up: true, speed: 190, size: 8 }); }
      else {
        const k = P(t, 3.6, 4.7);
        const y = lerp(-60, 392, E.in(k));
        em(ctx, '🐕', 180, y, 68, { r: Math.PI, sx: 1 });
        em(ctx, '🦴', 180, y + 40, 28, { r: 1 });
        em(ctx, '🌍', 300, 80, 56, { a: P(t, 3.6, 3.9), r: t });
        if (t > 4.7) { boom(ctx, 180, 395, 4.7, t, 80); particles(ctx, 90, 180, 395, 4.7, t, 10, { col: '#8a5a2e', life: 1, up: true, size: 7 }); txt(ctx, 'Ni hao.', 180, 300, 28, '#c62828', P(t, 5, 5.3)); }
      }
      end(ctx);
    } },
  // a26 kat en komkommer (schrikspring)
  { id: 'a26', title: 'Komkommer-alarm', caption: 'Sindsdien beschouwt hij groente als een persoonlijke vijand.', dur: 6,
    draw(ctx, t, w, h) {
      const gy = 520;
      begin(ctx, w, h, { top: '#e8fff1', bot: '#fafffb', gy, gc: '#c8b79a' });
      em(ctx, '🪟', 290, 200, 120);
      rect(ctx, 80, gy - 15, 150, 15, '#e53935', 0.5);
      const jump = E.out(P(t, 2.2, 2.7)) - E.in(P(t, 3.2, 3.8)) * 0;
      let cy = gy - 50, rot = 0;
      if (t >= 2.2 && t < 3.2) cy = gy - 50 - 700 * E.out(P(t, 2.2, 3)) * 1;
      else if (t >= 3.2 && t < 3.9) cy = gy - 50 - 700 * (1 - E.in(P(t, 3.2, 3.9)));
      else if (t >= 3.9) cy = gy - 50;
      if (t >= 2.2 && t < 3.9) rot = Math.sin(t * 20) * 0.5;
      em(ctx, '🐈', 180, cy, 90, { r: rot });
      const cuc = P(t, 1.5, 1.7) * (t < 2.2 ? 1 : 1);
      em(ctx, '🥒', 280 - 0, gy - 20, 44 * (cuc > 0 ? 1 : 0.01), { r: 0.3, a: 1 });
      em(ctx, '🥣', 180, gy + 30, 40, { a: t < 1.5 ? 1 : 0.0 });
      if (t >= 1.5 && t < 2.2) txt(ctx, '👀', 180, gy - 110, 40, '#000', 1);
      if (t > 3 && t < 3.9) txt(ctx, 'MIAUW!!', 180, 140, 34, '#e53935', 1);
      if (t > 3.9) { boom(ctx, 180, gy - 20, 3.9, t, 90); particles(ctx, 95, 180, gy, 3.9, t, 10, { col: '#fff', life: 0.8, up: true, size: 7 }); }
      if (t >= 3.9) txt(ctx, '😾', 180, gy - 110, 34, '#000', P(t, 4.1, 4.4));
      end(ctx);
    } },
  // a27 sneeuwbal groeit en jaagt op eekhoorn (groeien, achtervolging)
  { id: 'a27', title: 'Lawine!', caption: 'Het begon als een heel klein sneeuwballetje.', dur: 7,
    draw(ctx, t, w, h) {
      begin(ctx, w, h, { top: '#c7e0f7', bot: '#f4faff', gy: 480, gc: '#fdfdff' });
      const k = P(t, 0.3, 6);
      const r = 8 + 300 * E.in(k);
      const bx = lerp(-r, 260 + r * 0.3, E.in(k)) - 0;
      const sqx = lerp(20, 330, E.in(P(t, 0.3, 6)) * 1.05 + 0.0);
      const shake = k > 0.6 ? shk(t, 3 * (k - 0.6)) : [0, 0];
      ctx.save(); ctx.translate(shake[0], shake[1]);
      circle(ctx, bx, 480 - r, r, '#fff'); ring(ctx, bx, 480 - r, r, '#cfe3f7', 3);
      for (let i = 0; i < 5; i++) { const a = t * 3 + i; circle(ctx, bx + Math.cos(a) * r * 0.5, 480 - r + Math.sin(a) * r * 0.5, r * 0.08, '#cfe3f7'); }
      ctx.restore();
      shadow(ctx, bx, 482, r * 0.9, 0.2);
      if (t < 6.2) em(ctx, '🐿️', sqx, 460 - Math.abs(Math.sin(t * 14)) * 10, 50, { fx: false });
      for (let i = 0; i < 3; i++) em(ctx, '🌲', 80 + i * 110, 440, 70, { a: bx - 60 > 80 + i * 110 ? 0.0 : 1 });
      if (k > 0.9) txt(ctx, 'Tja.', 180, 100, 30, '#345', 1);
      if (t > 6.3) { em(ctx, '🐿️', 330, 440, 44, { r: 0.0 }); em(ctx, '🥜', 300, 440, 30); }
      end(ctx);
    } },
  // a28 kangoeroe zak (stuiteren, voorwerpen uit zak)
  { id: 'a28', title: 'Alles zit erin', caption: 'Een kleine kangoeroe-zak is een grote berging.', dur: 7,
    draw(ctx, t, w, h) {
      const gy = 500;
      begin(ctx, w, h, { top: '#ffe2b8', bot: '#fff1d9', gy, gc: '#d9a56a' });
      const hop = Math.abs(Math.sin(t * 3.2)) * 110 * (t < 4 ? 1 : 0);
      shadow(ctx, 180, gy + 20, 60 - hop * 0.2);
      em(ctx, '🦘', 180, gy - 60 - hop, 130, { fx: true, r: t < 4 ? Math.sin(t * 3.2) * 0.1 : 0 });
      const items = ['🔑', '📱', '🔌', '🧦', '☂️', '🥪', '🪥', '📦'];
      for (let i = 0; i < items.length; i++) {
        const t0 = 4 + i * 0.28; const a = t - t0;
        if (a > 0) {
          const vx = (rnd(i) - 0.5) * 360, vy = -280 - rnd(i + 4) * 120;
          const x = 190 + vx * a, y = gy - 60 + vy * a + 0.5 * 700 * a * a;
          const yy = Math.min(y, gy + 10 + rnd(i) * 20);
          em(ctx, items[i], clamp(x, 20, 340), yy, 36, { r: a * 3 * (y < gy ? 1 : 0) });
        }
      }
      if (t > 6.4) txt(ctx, 'Hmm, mijn sleutels.', 180, 130, 24, '#6b3d12', P(t, 6.4, 6.7));
      end(ctx);
    } },
  // a29 slak race (camera, versnelling)
  { id: 'a29', title: 'Fotofinish', caption: 'Sneller dan verwacht, langzamer dan toegegeven.', dur: 7,
    draw(ctx, t, w, h) {
      const gy = 430;
      begin(ctx, w, h, { top: '#c9e9ff', bot: '#f2fbff', gy, gc: '#7cc563' });
      const fin = 300;
      line(ctx, fin, gy - 140, fin, gy + 40, '#222', 5); rect(ctx, fin, gy - 140, 20, 14, '#000'); rect(ctx, fin + 20, gy - 126, 20, 14, '#000');
      const snail = lerp(30, fin - 10, E.lin(P(t, 0.4, 4.4)) * 0.6 + (t > 4.4 ? E.in(P(t, 4.4, 5.6)) * 0.4 : 0)) ;
      const turtle = lerp(30, fin - 40, E.lin(P(t, 0.4, 4.4)) * 0.65);
      const boost = P(t, 4.4, 5.6);
      em(ctx, '🐢', Math.min(turtle, fin - 24), gy + 60, 60, { fx: false, a: 1 });
      em(ctx, '🐌', Math.min(snail, fin + 10 + boost * 150), gy + 16 - boost * 0, 54);
      if (t > 4.4) { em(ctx, '🚀', snail - 16, gy + 24, 26, { r: -1.57 + 0.3, a: 1 }); particles(ctx, 7, snail - 36, gy + 28, 4.4, t, 8, { col: '#ffb020', life: 0.5, g: 0, speed: 90, size: 7 }); }
      if (t > 5.6) { rect(ctx, -10, -10, w + 20, h + 20, '#fff', 1 - P(t, 5.6, 5.9)); txt(ctx, '📸', 180, 120, 60, '#000', P(t, 5.6, 5.9)); em(ctx, '🏆', 180, 200, 70 * E.back(P(t, 5.9, 6.4))); }
      if (t > 4.4 && t < 5.6) rect(ctx, 0, 0, w, h, '#fff', 0.0);
      end(ctx);
    } },
  // a30 selfie met leeuw (flits, camera zoom-out)
  { id: 'a30', title: 'Selfie', caption: 'Hij stond maar op de achtergrond te posen.', dur: 7,
    draw(ctx, t, w, h) {
      begin(ctx, w, h, { top: '#ffe08a', bot: '#f6c76b', gy: 470, gc: '#d9a354' });
      const z = 1 + 0.9 * (1 - E.io(P(t, 4, 6))) ;
      ctx.save(); ctx.translate(180, 380); ctx.scale(z, z); ctx.translate(-180, -380);
      em(ctx, '🌳', 60, 400, 120); em(ctx, '🌳', 310, 410, 100);
      const lx = lerp(-30, 180, E.out(P(t, 1, 3.5)));
      const ls = 40 + 90 * E.in(P(t, 3, 4.6));
      em(ctx, '🦁', t < 1 ? -100 : 180 + (lx - 180) * 0 + 0, 440 - ls * 0.25 + 30, ls * (t < 1 ? 0.01 : 1), { a: P(t, 1, 1.5) });
      em(ctx, '🤳', 180, 430, 80, { r: Math.sin(t * 3) * 0.1 });
      em(ctx, t > 4.6 ? '😮' : '😁', 160, 360, 36);
      ctx.restore();
      if (t > 4.8 && t < 5.2) rect(ctx, -10, -10, w + 20, h + 20, '#fff', 1 - P(t, 4.8, 5.2));
      if (t > 5.4) txt(ctx, 'Klik.', 180, 100, 32, '#7a4a0c', P(t, 5.4, 5.7));
      end(ctx);
    } },
  // a31 kogelvis (opblazen groeien)
  { id: 'a31', title: 'Kogelvis', caption: 'De kat zei dat hij maar even wilde kijken.', dur: 6,
    draw(ctx, t, w, h) {
      const sh = t > 3.5 ? shk(t, 5 * (1 - P(t, 3.5, 4.5))) : [0, 0];
      begin(ctx, w, h, { top: '#68c9ff', bot: '#0e6fb0', sh });
      rect(ctx, 0, 560, w, 80, '#e6cf8d');
      const poke = P(t, 1.5, 2.2);
      const inf = E.out(P(t, 2.2, 3.4));
      const size = 60 + 260 * inf;
      const cx = t > 3.4 ? lerp(180, 180, 0) : 180;
      em(ctx, '🐡', 180, 340, size, { r: Math.sin(t * 3) * 0.05 });
      const cat = lerp(300, 100, E.out(P(t, 0, 1.4)));
      const catx = t < 2.2 ? cat : lerp(100, -60, E.in(P(t, 2.2, 4)));
      em(ctx, '🐈', catx, t < 2.2 ? 340 : 340 - 40 * P(t, 3.4, 4.6), 70 + 0, { r: t > 2.2 ? (t - 2.2) * 3 : 0 });
      if (t > 2.2 && t < 3.4) for (let i = 0; i < 4; i++) { const a = (t * 3 + i / 4) % 1; line(ctx, 180 + Math.cos(i * 1.6) * (30 + a * 100), 340 + Math.sin(i * 1.6) * (30 + a * 100), 180 + Math.cos(i * 1.6) * (50 + a * 100), 340 + Math.sin(i * 1.6) * (50 + a * 100), '#fff', 3); }
      if (t > 4.2) txt(ctx, 'Prikkeltjes.', 180, 150, 28, '#fff', P(t, 4.2, 4.6));
      for (let i = 0; i < 10; i++) circle(ctx, rnd(i) * 360, 640 - ((t * (40 + rnd(i + 2) * 30) + rnd(i + 3) * 640) % 640), 3 + rnd(i + 7) * 5, '#fff', 0.4);
      end(ctx);
    } },
  // a32 sneeuwpop in sauna (krimpen, verdwijnen)
  { id: 'a32', title: 'Wellness', caption: 'Hij had beter voor de koude kamer kunnen kiezen.', dur: 7,
    draw(ctx, t, w, h) {
      begin(ctx, w, h, { top: '#d9a066', bot: '#a8693a', gy: 520, gc: '#6b3e1e' });
      for (let i = 0; i < 6; i++) rect(ctx, 0, 60 + i * 80, w, 6, '#8a5a30', 0.6);
      em(ctx, '🔥', 60, 480, 70 + Math.sin(t * 12) * 4); em(ctx, '🔥', 300, 480, 66 + Math.sin(t * 10) * 4);
      const m = E.in(P(t, 1.5, 5.2));
      em(ctx, '⛄', 180, 460 + 50 * m, 130 * (1 - 0.85 * m), { sx: 1 + 0.5 * m, sy: 1 });
      circle(ctx, 180, 520, 70 * m, '#6bc6ff', 0.8 * m); ring(ctx, 180, 520, 70 * m, '#fff', 2, 0.6 * m);
      if (t > 4) { em(ctx, '🥕', 180 + 40 * P(t, 4, 5.2), 510, 24 * P(t, 4, 4.6), { r: 1.2 }); em(ctx, '🎩', 150, 500 - 20 * (1 - m) , 36, { r: -0.3, a: P(t, 3.5, 5.5) }); }
      if (t > 0.4) for (let i = 0; i < 6; i++) { const a = (t * 0.8 + i / 6) % 1; em(ctx, '💨', 70 + i * 40, 440 - a * 300, 26, { a: 0.5 * (1 - a) }); }
      if (t < 1.5) txt(ctx, '😎', 180, 380, 30);
      if (t > 5.3) { em(ctx, '😭', 180, 505, 30 * P(t, 5.3, 5.6)); txt(ctx, 'Ahhhh.', 180, 150, 30, '#fff', P(t, 5.6, 5.9)); }
      end(ctx);
    } },
  // a33 mug (zigzag, jezelf slaan)
  { id: 'a33', title: 'Zzzzzz', caption: 'De muskiet won, op punten en op oorlogsmoreel.', dur: 6,
    draw(ctx, t, w, h) {
      const slap = t > 2.8 && t < 3.3;
      const sh = slap ? shk(t, 9) : [0, 0];
      begin(ctx, w, h, { top: '#1a1f3d', bot: '#2e3566', gy: 540, gc: '#2a2a40', sh });
      em(ctx, '🌙', 300, 70, 60);
      em(ctx, t > 3 ? '😵' : t > 1.3 ? '😠' : '😴', 180, 390, 120, { r: t < 1.3 ? -0.1 : 0 });
      const mx = 180 + 130 * Math.sin(t * 5.4) * Math.cos(t * 1.1), my = 270 + 120 * Math.sin(t * 3.7 + 1);
      if (t < 2.8) { em(ctx, '🦟', mx, my, 30, { r: Math.sin(t * 40) * 0.4 }); txt(ctx, 'zzz', mx + 20, my - 24, 14, '#9fe', 1); }
      if (t < 2.8 && t > 1.3) em(ctx, '✋', 180 + (mx - 180) * 0.7, 330 + (my - 330) * 0.5, 40, { a: t > 2.5 ? 1 : 0 });
      if (slap) { em(ctx, '✋', 180, 360, 60); boom(ctx, 180, 340, 2.8, t, 80); }
      if (t > 3.4) { circle(ctx, 180, 340, 0, '#000'); em(ctx, '🦟', 210, 300 - 10 * Math.sin(t * 9), 28, { r: Math.sin(t * 6) * 0.3 }); txt(ctx, '💃', 240, 300, 1, '#fff', 0); em(ctx, '🎶', 240, 270 - 8 * Math.sin(t * 5), 24, { a: P(t, 3.6, 4) }); }
      if (t > 4.6) txt(ctx, 'Hij danst.', 180, 120, 28, '#ffd23f', P(t, 4.6, 4.9));
      end(ctx);
    } },
  // a34 zebra verdwijnt in zebrapad (verdwijnen/camouflage)
  { id: 'a34', title: 'Camouflage', caption: 'Hij stak veilig over. De auto kwam er nooit achter.', dur: 6,
    draw(ctx, t, w, h) {
      const gy = 300;
      begin(ctx, w, h, { top: '#9ad8ff', bot: '#e6f7ff' });
      rect(ctx, 0, 300, w, 340, '#444');
      for (let i = 0; i < 7; i++) rect(ctx, 30 + i * 46, 300, 26, 340, '#fff');
      const zx = lerp(20, 340, E.io(P(t, 0.4, 3.5)));
      const vanish = P(t, 1.2, 2.6);
      em(ctx, '🦓', zx, 360 + Math.abs(Math.sin(t * 7)) * -6, 90, { a: 1 - 0.85 * vanish * (zx > 300 ? 0 : 1) + (zx > 300 ? 0.85 * P(zx, 300, 340) : 0) });
      const carx = lerp(420, 300, E.out(P(t, 0.5, 2.0)));
      const caro = t > 3.8 ? lerp(300, -150, E.in(P(t, 3.8, 5))) : carx;
      em(ctx, '🚗', caro, 520, 100, { r: t > 2 && t < 3.8 ? Math.sin(t * 30) * 0.03 : 0 });
      if (t > 2.2 && t < 3.8) { txt(ctx, '❓', caro, 440, 40, '#fff', 1); }
      if (t > 2.2 && t < 3.8) { txt(ctx, 'Zie je iets?', 190, 200, 24, '#345', 1); }
      if (t > 4.5) txt(ctx, 'Nee.', 180, 200, 30, '#345', P(t, 4.5, 4.8));
      end(ctx);
    } },
  // a35 hond vs spiegel (breken, scherven)
  { id: 'a35', title: 'Andere hond', caption: 'Nu waren het er plotseling honderd.', dur: 7,
    draw(ctx, t, w, h) {
      const gy = 520, br = 4.3;
      const sh = t > br && t < br + 0.4 ? shk(t, 8) : [0, 0];
      begin(ctx, w, h, { top: '#f0e6ff', bot: '#faf6ff', gy, gc: '#c9b79c', sh });
      const mx = 200, my = 330;
      if (t < br) { rect(ctx, mx - 80, my - 140, 160, 280, '#cfeaff'); rect(ctx, mx - 80, my - 140, 160, 280, '#fff', 0.25); ring(ctx, mx, my, 1, '#000', 1); rect(ctx, mx - 84, my - 144, 168, 6, '#8a5a30'); rect(ctx, mx - 84, my + 138, 168, 6, '#8a5a30'); rect(ctx, mx - 84, my - 144, 6, 288, '#8a5a30'); rect(ctx, mx + 78, my - 144, 6, 288, '#8a5a30'); }
      const growl = t > 0.8 && t < br ? Math.sin(t * 24) * 0.1 : 0;
      const hx = t < br ? lerp(60, 90, P(t, 0.5, 1.5)) : 90;
      const bite = t > 3.4 && t < br ? P(t, 3.4, br) : 0;
      if (t < br) { em(ctx, '🐕', lerp(hx, 150, bite), gy - 40, 76, { r: growl }); em(ctx, '🐕', mx - 0 + 20 * (1 - bite) * 0, my + 80, 76, { fx: true, r: -growl, a: 0.6 }); if (t > 0.8) txt(ctx, 'GRRR', 90, 380, 18, '#e53935'); }
      if (t >= br) {
        for (let i = 0; i < 26; i++) {
          const a = t - br; const ang = rnd(i) * 6.28; const v = 90 + rnd(i + 10) * 200;
          const x = mx + (rnd(i + 20) - 0.5) * 140 + Math.cos(ang) * v * a, y = my + (rnd(i + 30) - 0.5) * 260 + Math.sin(ang) * v * a + 350 * a * a;
          em(ctx, '🐕', x, Math.min(y, gy - 5 + rnd(i) * 30), 28, { r: a * 3 * (rnd(i) - 0.5) * 4 * (y < gy ? 1 : 0) });
        }
        em(ctx, '🐕', 120, gy - 30, 76, { a: 1 });
        if (t > br + 1.3) txt(ctx, 'Vrienden!', 180, 130, 30, '#7b4bd8', P(t, br + 1.3, br + 1.6));
      }
      end(ctx);
    } },
  // a36 pannenkoek flip (draaien, plafond, kat hoed)
  { id: 'a36', title: 'Flip', caption: 'Hij landde precies waar niemand hem verwachtte.', dur: 7,
    draw(ctx, t, w, h) {
      const gy = 540;
      begin(ctx, w, h, { top: '#fff4df', bot: '#ffe9c4', gy, gc: '#d6b28a' });
      rect(ctx, 0, 0, w, 20, '#c89d70');
      em(ctx, '🍳', 90, 470, 90, { r: 0.0 });
      const k = P(t, 0.8, 2.3);
      let py = 450 - 400 * E.out(k) * 1; let spin = k * 18;
      if (t >= 2.3 && t < 4) { py = 50; spin = 0; }
      if (t >= 4) { const f = E.in(P(t, 4, 5)); py = lerp(50, 410, f); spin = 0.3 * f; }
      const px = t < 4 ? 90 + 6 * P(t, 0.8, 2.3) : lerp(90, 250, E.out(P(t, 4, 5)));
      if (t < 5) em(ctx, '🥞', px, py, 64, { r: spin, sy: 1 + (t >= 0.8 && t < 2.3 ? Math.abs(Math.sin(spin)) * 0 : 0) });
      if (t >= 2.3 && t < 4) txt(ctx, 'plof', 90, 90, 16, '#7a4b25', 1);
      const cat = lerp(380, 250, E.out(P(t, 2, 3.5)));
      em(ctx, '🐈', cat, 460, 90);
      if (t >= 5) { em(ctx, '🥞', 250, 408, 56, { r: 0.1 }); boom(ctx, 250, 420, 5, t, 60); txt(ctx, 'Mooie hoed.', 180, 200, 28, '#7a4b25', P(t, 5.3, 5.6)); }
      if (t >= 4 && t < 5) em(ctx, '😮', cat, 410, 26);
      end(ctx);
    } },
  // a37 domino lawine (golf, cascade)
  { id: 'a37', title: 'Kettingreactie', caption: 'Eén mier, één duwtje, één heel groot probleem.', dur: 8,
    draw(ctx, t, w, h) {
      const gy = 500;
      const sh = t > 5 ? shk(t, 7 * (1 - P(t, 5, 7))) : [0, 0];
      begin(ctx, w, h, { top: '#e8f0ff', bot: '#f7faff', gy, gc: '#9fb3c8', sh });
      const items = ['🥚', '🍎', '⚽', '🏀', '🛢️', '🚗', '🏠', '🏢'];
      const sizes = [28, 36, 44, 52, 64, 80, 100, 130];
      let x = 30;
      for (let i = 0; i < items.length; i++) {
        const s = sizes[i];
        const t0 = 1 + i * 0.55;
        const fall = E.in(P(t, t0, t0 + 0.5));
        const px = x + s * 0.5;
        const rot = fall * 1.45;
        ctx.save();
        ctx.translate(px + s * 0.4, gy);
        ctx.rotate(rot * 0.7);
        em(ctx, items[i], -s * 0.4 + 0, -s * 0.45, s * 0.9, { r: 0 });
        ctx.restore();
        if (fall > 0.95 && t < t0 + 0.7) boom(ctx, px + s * 0.5, gy - s * 0.4, t0 + 0.5, t, s * 0.6);
        x += s * 0.65 + 6;
      }
      em(ctx, '🐜', 10 + 10 * P(t, 0.3, 1), gy - 6, 24);
      if (t > 6.2) txt(ctx, 'Ik deed niks.', 180, 140, 28, '#345', P(t, 6.2, 6.5));
      end(ctx);
    } },
  // a38 penalty, kat in de goal (ping-pong, terugkaatsen)
  { id: 'a38', title: 'Strafschop', caption: 'De keeper keek de verkeerde kant op. De kat niet.', dur: 7,
    draw(ctx, t, w, h) {
      const gy = 520;
      const sh = t > 4.2 && t < 4.6 ? shk(t, 8) : [0, 0];
      begin(ctx, w, h, { top: '#a6e0ff', bot: '#e8f9ff', gy, gc: '#4caf50', sh });
      rect(ctx, 60, 190, 240, 170, '#fff', 0.15); line(ctx, 60, 190, 60, 360, '#fff', 6); line(ctx, 300, 190, 300, 360, '#fff', 6); line(ctx, 60, 190, 300, 190, '#fff', 6);
      for (let i = 0; i < 8; i++) { line(ctx, 60 + i * 30, 190, 60 + i * 30, 360, '#fff', 1); }
      em(ctx, '🐈', 180, 330, 70, { a: 1 });
      const dive = E.out(P(t, 2.1, 2.8));
      em(ctx, '🧤', 180 - 100 * dive, 300 + 20 * dive, 50, { r: -1.2 * dive });
      const kickx = 180, ky = 560;
      em(ctx, t > 3.6 ? '😵' : '🦵', kickx + 0, ky, 56);
      let bx = 180, by = 520, bs = 40;
      if (t < 1.6) { bx = 180; by = 520; }
      else if (t < 2.7) { const k = P(t, 1.6, 2.7); bx = 180; by = lerp(520, 330, E.in(k)); bs = lerp(40, 22, k); }
      else if (t < 4.1) { const k = P(t, 2.7, 4.1); bx = 180; by = 330; bs = 22; if (t > 3.0) { const q = P(t, 3.0, 4.1); by = lerp(330, 540, E.in(q)); bs = lerp(22, 60, q); bx = 180 + 10 * q; } }
      else { bx = 190; by = 540 + 0; bs = 60 }
      em(ctx, '⚽', bx, by, bs, { r: t * 8 });
      if (t > 4.1) { boom(ctx, 188, 540, 4.1, t, 80); em(ctx, '🤕', 180, 560, 40, { a: P(t, 4.1, 4.3) }); }
      if (t > 3.0 && t < 3.6) txt(ctx, 'Pats!', 220, 300, 30, '#d84315');
      if (t > 4.8) txt(ctx, 'Terug naar afzender.', 180, 120, 26, '#2e7d32', P(t, 4.8, 5.2));
      end(ctx);
    } },
  // a39 hond laat baasje uit (draaien, vlag in de wind)
  { id: 'a39', title: 'Wie liep er met wie?', caption: 'De riem hield stand. De baas niet.', dur: 7,
    draw(ctx, t, w, h) {
      const gy = 480;
      begin(ctx, w, h, { top: '#bfe9ff', bot: '#f4fff0', gy, gc: '#78c46a' });
      const sp = P(t, 0.5, 3);
      const ang = t * 2.2 * (0.3 + 1.3 * E.in(sp));
      const dogx = 180 + Math.cos(ang) * 110, dogy = gy - 10 - Math.abs(Math.sin(t * 12)) * 10;
      const lift = E.io(P(t, 1.2, 3.5));
      const mx = 180 + Math.cos(ang - 0.7 * lift) * (110 + 70 * lift) * 0.7 - 0;
      const my = lerp(gy - 22, gy - 150, lift) + Math.sin(ang * 2) * 12 * lift;
      line(ctx, dogx, dogy - 10, mx, my + 14, '#e53935', 3);
      shadow(ctx, dogx, gy + 20, 30);
      em(ctx, '🐕', dogx, dogy, 62, { fx: Math.sin(ang + 1.57) > 0 });
      em(ctx, '🧍', mx, my, 74, { r: lift * Math.sin(ang * 3) * 0.5 });
      if (lift > 0.5) em(ctx, '😵‍💫', mx, my - 38, 22);
      if (t > 4.6) { txt(ctx, 'Dag!', mx, my - 56, 20, '#333', P(t, 4.6, 4.8)); }
      if (t > 4.8) { const k = P(t, 4.8, 5.8); /* baas vliegt weg */ em(ctx, '🪁', 300 + 0, 100 - 20 * k, 1, { a: 0 }); }
      for (let i = 0; i < 5; i++) em(ctx, '🌼', 40 + i * 70, gy + 40 + (i % 2) * 20, 18);
      end(ctx);
    } },
  // a40 haan en de zon aan een touwtje (plot twist, camera uitzoomen)
  { id: 'a40', title: 'Wie zet de zon aan?', caption: 'Zo klopt het opeens allemaal.', dur: 8,
    draw(ctx, t, w, h) {
      const gy = 470;
      const dawn = E.io(P(t, 1.6, 4.5));
      const z = 1 - 0.28 * E.io(P(t, 4.8, 6.8));
      const r = Math.round(lerp(10, 135, dawn)), g = Math.round(lerp(14, 206, dawn)), b = Math.round(lerp(50, 250, dawn));
      begin(ctx, w, h, { top: `rgb(${r},${g},${b})`, bot: `rgb(${Math.round(lerp(40, 255, dawn))},${Math.round(lerp(40, 230, dawn))},${Math.round(lerp(80, 200, dawn))})`, gy, gc: '#3f7a3b' });
      ctx.save(); ctx.translate(180, gy); ctx.scale(z, z); ctx.translate(-180, -gy);
      for (let i = 0; i < 16; i++) circle(ctx, rnd(i) * 360, rnd(i + 3) * 340, 1.6, '#fff', 1 - dawn);
      const sx = 180 + 90 * (1 - dawn) * 0 + (1 - dawn) * 0, sy = lerp(gy + 100, 130, dawn);
      const sunx = lerp(300, 180, dawn);
      em(ctx, '🌞', sunx, sy, 90);
      const cx = 100;
      em(ctx, '🐓', cx, gy - 10, 80 + 4 * Math.sin(t * 20) * (t > 1 && t < 4.5 ? 1 : 0), { sy: 1 + (t > 1 && t < 4.5 ? 0.04 * Math.sin(t * 20) : 0) });
      if (t > 1 && t < 4.5) sound(ctx, cx + 30, gy - 40, 1, t, 3, '#ffe9a0'), sound(ctx, cx + 30, gy - 40, 2.5, t, 3, '#ffe9a0');
      const k = P(t, 4.8, 5.6);
      if (k > 0) {
        line(ctx, sunx, sy + 40, cx + 30, gy - 30, '#7a4b25', 3 * k);
        const mid = (sunx + cx + 30) / 2, my = (sy + 40 + gy - 30) / 2;
        em(ctx, '🧶', cx + 30, gy - 30, 24 * k);
        txt(ctx, 'Plot twist.', 180, 240, 26, '#2a2a2a', P(t, 5.8, 6.2));
        if (t > 6.6) { em(ctx, '🎣', cx + 50, gy - 60, 60 * P(t, 6.6, 7), { r: -0.3 }); }
      }
      ctx.restore();
      end(ctx);
    } },
];
