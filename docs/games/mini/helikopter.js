export default {
  id: 'helikopter', name: 'Helikopter', emoji: '🚁', hint: 'Houd ingedrukt om te stijgen, laat los om te dalen',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#0b1020';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    let dead = false, raf = 0, last = 0, ended = false, endT = 0;
    const HX = 90;
    let dist = 0, speed = 150, t = 0, hy = H / 2, vy = 0, up = false, rot = 0, score = 0, coinsGot = 0;
    const keys = {};
    const rnd = (a, b) => a + Math.random() * (b - a);
    // cave generated in world-x (dist-based) via smooth function with random phases
    const ph = [rnd(0, 6), rnd(0, 6), rnd(0, 6)];
    function caveAt(x) {
      const d = Math.max(0, x);
      const lvl = Math.min(1, d / 14000);
      const gap = Math.max(H * 0.27, H * 0.58 - lvl * H * 0.31);
      const amp = H * (0.1 + lvl * 0.12);
      const c = H / 2 + Math.sin(d * 0.0042 + ph[0]) * amp + Math.sin(d * 0.0101 + ph[1]) * amp * 0.45;
      const cc = Math.max(gap / 2 + 20, Math.min(H - gap / 2 - 20, c));
      return [cc - gap / 2, cc + gap / 2];
    }
    const obs = []; const coins = [];
    let nextObs = 700, nextCoin = 500;
    function genAhead() {
      const lim = dist + W + 200;
      while (nextObs < lim) {
        const [top, bot] = caveAt(nextObs);
        const gap = bot - top, h = Math.max(36, gap * rnd(0.28, 0.42)), w = rnd(22, 34);
        const fromTop = Math.random() < 0.5;
        obs.push({ x: nextObs, w, y: fromTop ? top : bot - h, h, tri: Math.random() < 0.5 });
        nextObs += rnd(260, 430) - Math.min(120, dist * 0.004);
      }
      while (nextCoin < lim) {
        const [top, bot] = caveAt(nextCoin);
        coins.push({ x: nextCoin, y: (top + bot) / 2 + rnd(-0.25, 0.25) * (bot - top), got: false });
        nextCoin += rnd(160, 320);
      }
    }
    const setUp = v => () => { up = v; };
    const pd = e => { up = true; try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const pu = () => { up = false; };
    host.addEventListener('pointerdown', pd); host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pu);
    const kd = e => { if (e.key === ' ' || e.key === 'ArrowUp') { up = true; e.preventDefault(); } };
    const ku = e => { if (e.key === ' ' || e.key === 'ArrowUp') up = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    api.score(0);
    const stars = Array.from({ length: 40 }, () => [Math.random() * W, Math.random() * H, Math.random() * 1.5 + 0.5]);
    const parts = [];
    function die() { if (ended) return; ended = true; endT = 0; for (let i = 0; i < 24; i++) parts.push({ x: HX, y: hy, vx: rnd(-160, 160), vy: rnd(-200, 120), l: rnd(0.4, 1) }); }
    function update(dt) {
      t += dt;
      speed = 150 + Math.min(t * 3.2, 170);
      dist += speed * dt;
      vy += (up ? -900 : 750) * dt;
      vy = Math.max(-330, Math.min(380, vy));
      hy += vy * dt;
      rot += (vy * 0.0016 - rot) * Math.min(1, dt * 8);
      genAhead();
      const [top, bot] = caveAt(dist + HX);
      const hr = 11;
      if (hy - hr < top + 2 || hy + hr > bot - 2) die();
      for (const o of obs) {
        const ox = o.x - dist;
        if (ox < HX + hr + 2 && ox + o.w > HX - hr - 2 && hy + hr - 3 > o.y && hy - hr + 3 < o.y + o.h) die();
      }
      for (const c of coins) if (!c.got && Math.hypot(c.x - dist - HX, c.y - hy) < 22) { c.got = true; coinsGot++; }
      while (obs.length && obs[0].x - dist < -80) obs.shift();
      while (coins.length && coins[0].x - dist < -80) coins.shift();
      score = Math.floor(dist / 12) + coinsGot * 25;
      api.score(score);
    }
    function heli(x, y, r) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(r);
      ctx.fillStyle = '#e8453c'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 10, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#bfe6ff'; ctx.beginPath(); ctx.ellipse(7, -2, 7, 5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#e8453c'; ctx.fillRect(-32, -3, 18, 5);
      ctx.fillStyle = '#c0302a'; ctx.fillRect(-35, -10, 4, 12);
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, 12); ctx.lineTo(12, 12); ctx.moveTo(-4, 9); ctx.lineTo(-4, 12); ctx.moveTo(6, 9); ctx.lineTo(6, 12); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; const a = Math.sin(t * 60) * 26;
      ctx.beginPath(); ctx.moveTo(-a, -12); ctx.lineTo(a, -12); ctx.stroke();
      ctx.fillStyle = '#999'; ctx.fillRect(-1, -12, 2, 4);
      ctx.restore();
    }
    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a1f3d'); g.addColorStop(1, '#2a1b3d');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // cave
      const STEP = 6;
      ctx.fillStyle = '#3a3552';
      ctx.beginPath(); ctx.moveTo(0, 0);
      for (let x = 0; x <= W + STEP; x += STEP) ctx.lineTo(x, caveAt(dist + x)[0]);
      ctx.lineTo(W + STEP, 0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W + STEP; x += STEP) ctx.lineTo(x, caveAt(dist + x)[1]);
      ctx.lineTo(W + STEP, H); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#8d7fc7';
      ctx.beginPath(); for (let x = 0; x <= W + STEP; x += STEP) { const y = caveAt(dist + x)[0]; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      ctx.beginPath(); for (let x = 0; x <= W + STEP; x += STEP) { const y = caveAt(dist + x)[1]; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      // obstacles
      for (const o of obs) {
        const ox = o.x - dist; if (ox > W + 50) continue;
        ctx.fillStyle = '#6d5fa8';
        if (o.tri) {
          ctx.beginPath();
          const [top] = caveAt(o.x);
          if (Math.abs(o.y - top) < 1) { ctx.moveTo(ox, o.y); ctx.lineTo(ox + o.w, o.y); ctx.lineTo(ox + o.w / 2, o.y + o.h); }
          else { ctx.moveTo(ox, o.y + o.h); ctx.lineTo(ox + o.w, o.y + o.h); ctx.lineTo(ox + o.w / 2, o.y); }
          ctx.fill();
        } else { ctx.fillRect(ox, o.y, o.w, o.h); ctx.fillStyle = '#9b8de0'; ctx.fillRect(ox, o.y, 4, o.h); }
      }
      // coins
      ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const c of coins) if (!c.got) { const cx = c.x - dist; if (cx < W + 20) ctx.fillText('💎', cx, c.y); }
      // stars decor
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      for (const s of stars) { const x = ((s[0] - dist * 0.05 * s[2]) % W + W) % W; ctx.fillRect(x, s[1], s[2], s[2]); }
      if (!ended) heli(HX, hy, rot);
      for (const p of parts) { ctx.globalAlpha = Math.max(0, p.l); ctx.fillStyle = Math.random() < 0.5 ? '#ffb020' : '#e8453c'; ctx.fillRect(p.x - 3, p.y - 3, 6, 6); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(score + '  💎 ' + coinsGot, 10, 10);
      if (t < 3 && !ended) { ctx.textAlign = 'center'; ctx.font = '16px sans-serif'; ctx.fillText('Houd ingedrukt om te stijgen', W / 2, H - 40); }
    }
    function frame(ts) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.max(0.001, Math.min((ts - (last || ts)) / 1000, 0.05)); last = ts;
      if (!ended) update(dt);
      else {
        endT += dt;
        for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt; p.l -= dt * 0.8; }
        if (endT > 0.9 && endT < 50) { endT = 99; api.end(score); }
      }
      draw();
    }
    raf = requestAnimationFrame(frame);
    return { destroy() {
      dead = true; cancelAnimationFrame(raf);
      host.removeEventListener('pointerdown', pd); host.removeEventListener('pointerup', pu); host.removeEventListener('pointercancel', pu);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      cv.remove();
    } };
  },
};
