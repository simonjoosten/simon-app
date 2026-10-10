export default {
  id: 'kettingreactie', name: 'Kettingreactie', emoji: '💥', hint: 'Tik één keer: laat een explosie een ketting van ballen laten ontploffen',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#0f1226';
    const W = api.w, H = api.h, dpr = Math.min(2, window.devicePixelRatio || 1);
    const cv = document.createElement('canvas');
    cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
    cv.style.cssText = 'width:' + W + 'px;height:' + H + 'px;display:block;touch-action:none';
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    const MAXL = 15, TOP = 56;
    let dead = false, ended = false, raf = 0, last = 0;
    const timers = [];
    const later = (fn, ms) => { const id = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(id); };
    let level = 1, lives = 3, score = 0, balls = [], tapped = false, chain = 0, goal = 0, R = 50, phase = 'play', msg = '', parts = [];

    function setup() {
      const m = Math.min(40, 10 + level * 2);
      goal = Math.max(2, Math.round(m * Math.min(0.75, 0.18 + level * 0.045)));
      R = Math.max(34, 54 - level * 1.5);
      balls = [];
      for (let i = 0; i < m; i++) {
        const a = Math.random() * 7, sp = 45 + Math.random() * 40 + level * 2;
        balls.push({ x: 20 + Math.random() * (W - 40), y: TOP + 20 + Math.random() * (H - TOP - 40), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 8, hue: Math.floor(Math.random() * 360), ex: -1, t: 0 });
      }
      parts = []; tapped = false; chain = 0; phase = 'play'; msg = '';
    }
    const GROW = 0.35, HOLD = 1.1, SHR = 0.35;
    function radiusAt(t) {
      if (t < GROW) return R * (t / GROW);
      if (t < GROW + HOLD) return R;
      if (t < GROW + HOLD + SHR) return R * (1 - (t - GROW - HOLD) / SHR);
      return 0;
    }
    function explode(b) {
      b.ex = 1; b.t = 0;
      for (let k = 0; k < 8; k++) { const a = Math.random() * 7, s = 40 + Math.random() * 80; parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6, hue: b.hue }); }
    }
    function update(dt) {
      for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
      parts = parts.filter(p => p.life > 0);
      for (const b of balls) {
        if (b.ex < 0) {
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); } else if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx); }
          if (b.y < TOP + b.r) { b.y = TOP + b.r; b.vy = Math.abs(b.vy); } else if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy); }
        } else if (b.ex === 1) {
          b.t += dt;
          if (b.t >= GROW + HOLD + SHR) b.ex = 2;
        }
      }
      if (tapped) {
        for (const b of balls) {
          if (b.ex !== -1) continue;
          for (const e of balls) {
            if (e.ex !== 1) continue;
            const rr = (e.isTap ? radiusAt(e.t) : radiusAt(e.t)) + b.r;
            if ((e.x - b.x) ** 2 + (e.y - b.y) ** 2 < rr * rr) { explode(b); chain++; break; }
          }
        }
        if (phase === 'play' && !balls.some(b => b.ex === 1)) endLevel();
      }
    }
    function endLevel() {
      phase = 'done';
      if (chain >= goal) {
        const gain = chain * 10 * (1 + Math.floor(chain / 5)) + level * 50;
        score += gain; api.score(score); msg = 'Gehaald! +' + gain + ' 🎉';
        if (level >= MAXL) { ended = true; later(() => api.end(score), 1400); return; }
        later(() => { level++; setup(); }, 1500);
      } else {
        lives--;
        if (lives <= 0) { ended = true; msg = 'Mislukt - geen levens meer'; later(() => api.end(score), 1500); return; }
        msg = 'Te weinig! Nog eens...';
        later(() => setup(), 1400);
      }
    }
    function draw() {
      ctx.fillStyle = '#0f1226'; ctx.fillRect(0, 0, W, H);
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff'; ctx.font = '700 17px system-ui,sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Level ' + level, 12, 20); ctx.textAlign = 'right'; ctx.fillText('Score ' + score, W - 12, 20);
      ctx.textAlign = 'center'; ctx.fillText('❤️'.repeat(lives), W / 2, 20);
      ctx.fillStyle = chain >= goal ? '#7CFC9a' : '#ffd54f'; ctx.font = '700 16px system-ui,sans-serif';
      ctx.fillText('Doel: ' + goal + ' ballen   Gevangen: ' + chain + (tapped ? '' : '   (tik ergens)'), W / 2, 42);
      for (const b of balls) {
        if (b.ex === 2) continue;
        if (b.ex === 1) {
          const r = radiusAt(b.t);
          ctx.fillStyle = 'hsla(' + b.hue + ',90%,60%,.35)'; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 7); ctx.fill();
          ctx.strokeStyle = 'hsla(' + b.hue + ',100%,75%,.9)'; ctx.lineWidth = 3; ctx.stroke();
        } else {
          ctx.fillStyle = 'hsl(' + b.hue + ',85%,58%)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(b.x - 2, b.y - 2, 2.5, 0, 7); ctx.fill();
        }
      }
      for (const p of parts) { ctx.fillStyle = 'hsla(' + p.hue + ',90%,70%,' + Math.max(0, p.life / 0.6) + ')'; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }
      if (msg) { ctx.fillStyle = '#fff'; ctx.font = '800 26px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(msg, W / 2, H / 2); }
    }
    function frame(ts) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.04, (ts - (last || ts)) / 1000); last = ts;
      update(dt); draw();
    }
    const onDown = (e) => {
      if (tapped || ended || phase !== 'play') return;
      const r = cv.getBoundingClientRect();
      const x = (e.clientX - r.left) * (W / r.width), y = Math.max(TOP, (e.clientY - r.top) * (H / r.height));
      tapped = true;
      const b = { x, y, vx: 0, vy: 0, r: 0, hue: 50, ex: 1, t: 0, isTap: true };
      balls.push(b);
      for (let k = 0; k < 10; k++) { const a = Math.random() * 7, s = 40 + Math.random() * 90; parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6, hue: 50 }); }
    };
    cv.addEventListener('pointerdown', onDown);
    setup(); api.score(0);
    raf = requestAnimationFrame(frame);
    return { destroy() { dead = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout); cv.removeEventListener('pointerdown', onDown); } };
  },
};
