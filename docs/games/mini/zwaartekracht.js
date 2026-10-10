export default {
  id: 'zwaartekracht',
  name: 'Zwaartekracht',
  emoji: '🌀',
  hint: 'Tik om de zwaartekracht om te draaien',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#0d0b2e';
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const CEIL = H * 0.27, FLOOR = H * 0.73, R = 14, PX = W * 0.27;
    let y = FLOOR - R, vy = 0, g = 1, rot = 0;
    let speed = 210, dist = 0, crystals = 0, nextX = W + 150, time = 0;
    let obs = [], gems = [], fx = [], stars = [];
    for (let i = 0; i < 50; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 1.6 + 0.4 });
    let dead = false, over = false, raf = 0, last = 0, msg = '', msgT = 0, deathT = 0;

    function flip() {
      if (over) return;
      g = -g; vy *= 0.2;
      for (let i = 0; i < 6; i++) fx.push({ x: PX, y, vx: -60 - Math.random() * 100, vy: (Math.random() - 0.5) * 80, t: 0.4, c: '#9d4edd' });
    }
    function onDown(e) { flip(); e.preventDefault(); }
    function onKey(e) { if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter') { if (!e.repeat) flip(); e.preventDefault(); } }
    cv.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);

    function spawn() {
      const lvl = Math.floor(dist / 1500);
      const gap = speed * 0.85 + 150 + Math.random() * 80;
      const side = Math.random() < 0.5 ? 'floor' : 'ceil';
      const n = 1 + Math.floor(Math.random() * Math.min(4, 2 + lvl));
      const w = n * 22;
      const roll = Math.random();
      if (lvl >= 2 && roll < 0.25) {
        const my = CEIL + 70 + Math.random() * (FLOOR - CEIL - 140);
        obs.push({ k: 'block', x: nextX, y: my - 18, w: 40, h: 36 });
        gems.push({ x: nextX + 120, y: side === 'floor' ? FLOOR - 30 : CEIL + 30, got: false });
      } else {
        obs.push({ k: 'spike', x: nextX, w, side });
        // kristallen: op de veilige kant of boven de spikes
        const safeY = side === 'floor' ? CEIL + 30 : FLOOR - 30;
        const gc = Math.random();
        if (gc < 0.7) for (let i = 0; i < 3; i++) gems.push({ x: nextX + w / 2 - 40 + i * 40, y: gc < 0.35 ? safeY : (CEIL + FLOOR) / 2, got: false });
      }
      nextX += gap + w;
    }

    function die() {
      if (over) return;
      over = true; deathT = 0.8;
      for (let i = 0; i < 30; i++) { const a = Math.random() * 6.28, s = 60 + Math.random() * 220; fx.push({ x: PX, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.8, c: '#ff4d6d' }); }
      api.end(Math.floor(dist / 10) + crystals * 25);
    }
    function update(dt) {
      time += dt;
      speed = Math.min(430, 210 + dist / 40);
      dist += speed * dt;
      vy += g * 2000 * dt; vy = Math.max(-900, Math.min(900, vy));
      y += vy * dt;
      if (y > FLOOR - R) { y = FLOOR - R; vy = 0; }
      if (y < CEIL + R) { y = CEIL + R; vy = 0; }
      rot += (g > 0 ? 1 : -1) * speed * dt / R * 0.5;
      while (nextX < W + 400) spawn();
      const dx = speed * dt;
      nextX -= dx;
      for (const o of obs) o.x -= dx;
      for (const c of gems) c.x -= dx;
      for (const s of stars) { s.x -= dx * 0.1 * s.s; if (s.x < 0) s.x += W; }
      for (const o of obs) {
        if (o.k === 'spike') {
          if (PX + R - 4 > o.x + 3 && PX - R + 4 < o.x + o.w - 3) {
            const h = 24;
            if (o.side === 'floor' && y + R - 3 > FLOOR - h + 6) die();
            if (o.side === 'ceil' && y - R + 3 < CEIL + h - 6) die();
          }
        } else if (PX + R - 3 > o.x && PX - R + 3 < o.x + o.w && y + R - 3 > o.y && y - R + 3 < o.y + o.h) die();
      }
      for (const c of gems) {
        if (!c.got && Math.abs(c.x - PX) < R + 12 && Math.abs(c.y - y) < R + 12) {
          c.got = true; crystals++; msg = '+25'; msgT = 0.5;
          for (let i = 0; i < 8; i++) fx.push({ x: c.x, y: c.y, vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200, t: 0.4, c: '#7df9ff' });
        }
      }
      obs = obs.filter((o) => o.x + (o.w || 0) > -40);
      gems = gems.filter((c) => c.x > -30 && !c.got);
      msgT -= dt;
      api.score(Math.floor(dist / 10) + crystals * 25);
    }

    function draw() {
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#1a0b3d'); bg.addColorStop(0.5, '#0d0b2e'); bg.addColorStop(1, '#1a0b3d');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (const s of stars) ctx.fillRect(s.x, s.y, s.s, s.s);
      // vlak
      ctx.fillStyle = '#2b1b5c'; ctx.fillRect(0, 0, W, CEIL); ctx.fillRect(0, FLOOR, W, H - FLOOR);
      ctx.fillStyle = '#7b2ff7'; ctx.fillRect(0, CEIL - 3, W, 3); ctx.fillRect(0, FLOOR, W, 3);
      ctx.fillStyle = 'rgba(123,47,247,0.25)';
      for (let x = -((dist * 0.6) % 40); x < W; x += 40) { ctx.fillRect(x, 0, 2, CEIL); ctx.fillRect(x, FLOOR + 3, 2, H - FLOOR); }
      // pijl voor zwaartekracht
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '26px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(g > 0 ? '⬇' : '⬆', W / 2, g > 0 ? FLOOR + 40 : CEIL - 25);
      for (const o of obs) {
        if (o.k === 'spike') {
          ctx.fillStyle = '#ff4d6d'; const n = Math.round(o.w / 22);
          for (let i = 0; i < n; i++) {
            const sx = o.x + i * 22; ctx.beginPath();
            if (o.side === 'floor') { ctx.moveTo(sx, FLOOR); ctx.lineTo(sx + 11, FLOOR - 26); ctx.lineTo(sx + 22, FLOOR); }
            else { ctx.moveTo(sx, CEIL); ctx.lineTo(sx + 11, CEIL + 26); ctx.lineTo(sx + 22, CEIL); }
            ctx.fill();
          }
        } else {
          ctx.fillStyle = '#ff4d6d'; ctx.fillRect(o.x, o.y, o.w, o.h);
          ctx.fillStyle = '#fff'; ctx.fillRect(o.x + 4, o.y + 4, o.w - 8, 4);
        }
      }
      for (const c of gems) {
        const bob = Math.sin(time * 4 + c.x * 0.05) * 3;
        ctx.save(); ctx.translate(c.x, c.y + bob);
        ctx.shadowColor = '#7df9ff'; ctx.shadowBlur = 12;
        ctx.fillStyle = '#7df9ff'; ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(9, 0); ctx.lineTo(0, 11); ctx.lineTo(-9, 0); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.shadowBlur = 0;
      for (const f of fx) { ctx.globalAlpha = Math.max(0, Math.min(1, f.t * 2)); ctx.fillStyle = f.c; ctx.fillRect(f.x, f.y, 4, 4); }
      ctx.globalAlpha = 1;
      if (!over) {
        ctx.save(); ctx.translate(PX, y); ctx.rotate(rot);
        ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#e09f3e'; ctx.fillRect(-R, -2, R * 2, 4);
        ctx.restore();
        ctx.fillStyle = '#111'; const ey = g > 0 ? 1 : -1;
        ctx.beginPath(); ctx.arc(PX + 4, y - 3 * ey, 2.5, 0, 6.283); ctx.arc(PX - 3, y - 3 * ey, 2.5, 0, 6.283); ctx.fill();
      }
      ctx.fillStyle = '#7df9ff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('💎 ' + crystals, 10, 24);
      if (msgT > 0) { ctx.globalAlpha = msgT * 2; ctx.fillStyle = '#7df9ff'; ctx.fillText(msg, PX + 20, y - 24); ctx.globalAlpha = 1; }
    }
    function loop(t) {
      if (dead) return;
      const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
      if (!over) update(dt); else { for (const f of fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.t -= dt; } fx = fx.filter((f) => f.t > 0); }
      draw();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        cv.removeEventListener('pointerdown', onDown);
        window.removeEventListener('keydown', onKey);
        cv.remove();
      },
    };
  },
};
