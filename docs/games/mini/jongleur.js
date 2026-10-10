export default {
  id: 'jongleur',
  name: 'Jongleur',
  emoji: '🤹',
  hint: 'Tik de ballen omhoog voor ze de grond raken',
  create(host, api) {
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    host.style.touchAction = 'none';
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'width:100%;height:100%;display:block;touch-action:none';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);

    const COLS = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff924c', '#4cc9f0', '#f72585'];
    const G = 700, R = 26, FLOOR = H - 24;
    let balls = [], taps = 0, score = 0, T = 0, ended = false, endTimer = 0, raf = 0, alive = true, last = performance.now();
    let pops = [], dropped = null;

    function addBall() {
      const i = balls.length;
      balls.push({ x: 50 + Math.random() * (W - 100), y: -R - 10, vx: (Math.random() - 0.5) * 60, vy: 40, c: COLS[i % COLS.length], n: i + 1 });
    }
    addBall();

    function finish() {
      if (ended) return;
      ended = true;
      endTimer = setTimeout(() => { api.end(score); }, 1000);
    }

    function tap(px, py) {
      if (ended) return;
      let b = null, bd = 1e9;
      for (const o of balls) {
        const d = Math.hypot(o.x - px, o.y - py);
        if (d < 62 && d < bd) { bd = d; b = o; }
      }
      if (!b) return;
      const h = H * (0.5 + Math.random() * 0.12);
      b.vy = -Math.sqrt(2 * G * h);
      b.vx = Math.max(-170, Math.min(170, (b.x - px) * 5 + (W / 2 - b.x) * 0.5 + (Math.random() - 0.5) * 60));
      taps++;
      score += balls.length;
      api.score(score);
      pops.push({ x: b.x, y: b.y, life: 0.35 });
      if (taps % 8 === 0 && balls.length < 8) addBall();
    }

    function update(dt) {
      T += dt;
      for (const p of pops) p.life -= dt;
      pops = pops.filter((p) => p.life > 0);
      if (ended) return;
      for (const b of balls) {
        b.vy += G * dt; b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx); }
        if (b.x > W - R) { b.x = W - R; b.vx = -Math.abs(b.vx); }
        if (b.y > FLOOR - R) { dropped = b; b.y = FLOOR - R; finish(); return; }
      }
    }

    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#2b0f54'); g.addColorStop(1, '#6a2c91');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#c77dff'; ctx.fillRect(0, FLOOR, W, H - FLOOR);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (const b of balls) {
        const s = Math.max(0.3, 1 - Math.max(0, FLOOR - b.y) / H);
        ctx.beginPath(); ctx.ellipse(b.x, FLOOR + 6, R * s, 5 * s, 0, 0, 7); ctx.fill();
      }
      for (const b of balls) {
        ctx.fillStyle = b.c;
        ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath(); ctx.arc(b.x - 8, b.y - 9, 8, 0, 7); ctx.fill();
        if (b === dropped) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(b.x, b.y, R + 6, 0, 7); ctx.stroke(); }
      }
      for (const p of pops) {
        ctx.strokeStyle = 'rgba(255,255,255,' + (p.life / 0.35) + ')'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x, p.y, R + (0.35 - p.life) * 120, 0, 7); ctx.stroke();
      }
      ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = 'bold 20px sans-serif';
      ctx.fillText('Score ' + score, 12, 28);
      ctx.textAlign = 'right'; ctx.fillText('🤹 ' + balls.length + ' ballen', W - 12, 28);
      if (T < 3) { ctx.textAlign = 'center'; ctx.font = '16px sans-serif'; ctx.fillText('Tik op de bal om hem omhoog te slaan', W / 2, H / 2 + 120); }
    }

    function frame(now) {
      if (!alive) return;
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      update(dt); draw();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    function onDown(e) {
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      tap((e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height);
    }
    cv.addEventListener('pointerdown', onDown);

    return {
      destroy() {
        alive = false; cancelAnimationFrame(raf); clearTimeout(endTimer);
        cv.removeEventListener('pointerdown', onDown);
        cv.remove();
      },
    };
  },
};
