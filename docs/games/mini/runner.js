export default {
  id: 'runner',
  name: 'Runner',
  emoji: '🏃',
  hint: 'Tik om te springen over de obstakels',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#ffd9a0';
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const groundY = H * 0.72, px = W * 0.2, PS = 40;
    let dead = false, done = false, raf = 0, last = 0, over = false, overT = 0;
    let y = 0, vy = 0, onGround = true; // y = hoogte boven de grond
    let dist = 0, score = 0, time = 0, nextObs = 300;
    let obs = [];
    const items = ['🌵', '🪨', '🪵', '🌵'];

    function speed() { return Math.min(540, 250 + dist / 40); }
    function jump() {
      if (over) return;
      if (onGround) { vy = 740; onGround = false; }
    }
    const onDown = e => { e.preventDefault(); jump(); };
    const onKey = e => { if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); jump(); } };
    host.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);

    function spawn(x) {
      const n = Math.random() < 0.25 + Math.min(0.3, dist / 8000) ? 2 : 1;
      const size = 34 + Math.random() * 18;
      obs.push({ x, n, size, e: items[Math.floor(Math.random() * items.length)] });
    }
    function update(dt) {
      time += dt;
      const sp = speed();
      dist += sp * dt;
      if (!onGround) {
        vy -= 2000 * dt; y += vy * dt;
        if (y <= 0) { y = 0; vy = 0; onGround = true; }
      }
      for (const o of obs) o.x -= sp * dt;
      obs = obs.filter(o => o.x > -120);
      nextObs -= sp * dt;
      if (nextObs <= 0) {
        spawn(W + 40);
        // minimaal ruimte voor sprong: ~ 0.72s * speed + marge
        const minGap = sp * 0.85 + 90;
        nextObs = minGap + Math.random() * (160 + 120 * Math.max(0, 1 - dist / 6000));
      }
      // botsing (kleinere hitbox)
      const pl = px - PS * 0.3, pr = px + PS * 0.3, pb = y, pt = y + PS * 0.75;
      for (const o of obs) {
        const w = o.size * 0.55 * o.n, h = o.size * 0.8;
        const ol = o.x - w / 2, or = o.x + w / 2;
        if (pr > ol && pl < or && pb < h) over = true;
      }
      const ns = Math.floor(dist / 10);
      if (ns !== score) { score = ns; api.score(score); }
    }
    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, groundY);
      g.addColorStop(0, '#ff9a5a'); g.addColorStop(1, '#ffe2a8');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '60px serif'; ctx.globalAlpha = 0.9;
      ctx.fillText('☀️', W * 0.78, H * 0.14); ctx.globalAlpha = 1;
      // heuvels
      ctx.fillStyle = '#e08a4a';
      for (let i = -1; i < 4; i++) {
        const bx = i * 200 - (dist * 0.1) % 200;
        ctx.beginPath(); ctx.moveTo(bx, groundY); ctx.lineTo(bx + 100, groundY - 90); ctx.lineTo(bx + 200, groundY); ctx.fill();
      }
      ctx.fillStyle = '#c9803f'; ctx.fillRect(0, groundY, W, H - groundY);
      ctx.fillStyle = '#a8662f';
      for (let x = -((dist * 1) % 50); x < W; x += 50) ctx.fillRect(x, groundY + 14, 22, 4);
      for (let x = -((dist * 0.7) % 80); x < W; x += 80) ctx.fillRect(x + 20, groundY + 44, 30, 4);
      ctx.fillStyle = '#7c4a1e'; ctx.fillRect(0, groundY, W, 5);
      for (const o of obs) {
        ctx.font = o.size + 'px serif';
        for (let i = 0; i < o.n; i++) ctx.fillText(o.e, o.x + (i - (o.n - 1) / 2) * o.size * 0.6, groundY - o.size * 0.4);
      }
      // schaduw + speler
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.ellipse(px, groundY + 2, 18 - Math.min(10, y / 12), 5, 0, 0, 7); ctx.fill();
      ctx.save();
      ctx.translate(px, groundY - y - PS * 0.5);
      if (!onGround) ctx.rotate(-0.2);
      else ctx.translate(0, Math.abs(Math.sin(time * 14)) * -4);
      ctx.font = PS + 'px serif';
      ctx.scale(-1, 1); // kijkt naar rechts
      ctx.fillText(over ? '😵' : '🏃', 0, 0);
      ctx.restore();
      ctx.fillStyle = '#5a2d0c'; ctx.font = 'bold 30px sans-serif';
      ctx.fillText(String(score), W / 2, 50);
      if (score < 3 && !over) {
        ctx.font = '18px sans-serif'; ctx.fillText('Tik om te springen!', W / 2, H * 0.3);
      }
    }
    function frame(t) {
      if (dead) return;
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016);
      last = t;
      if (!over) update(dt);
      else { overT += dt; if (overT > 0.8 && !done) { done = true; api.end(score); } }
      draw();
      if (!done) raf = requestAnimationFrame(frame);
    }
    api.score(0);
    raf = requestAnimationFrame(frame);
    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        host.removeEventListener('pointerdown', onDown);
        window.removeEventListener('keydown', onKey);
        if (cv.parentNode === host) host.removeChild(cv);
      },
    };
  },
};
