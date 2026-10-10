export default {
  id: 'flappy',
  name: 'Flappy',
  emoji: '🐤',
  hint: 'Tik om te vliegen door de gaten',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#6ec6ff';
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const k = H / 640;
    const groundH = 60 * k, pipeW = 56;
    let dead = false, done = false, raf = 0, last = 0, started = false, over = false, overT = 0;
    let by = H * 0.4, vy = 0, bx = W * 0.28, score = 0, scroll = 0, time = 0;
    const R = 15;
    let pipes = [];
    const clouds = [{ x: 40, y: 90, s: 1 }, { x: 220, y: 160, s: 0.7 }, { x: 330, y: 60, s: 0.9 }];

    function gapSize() { return Math.max(125 * k, (185 - score * 2.5) * k); }
    function speed() { return Math.min(230, 140 + score * 4); }
    function addPipe(x) {
      const g = gapSize();
      const minTop = 70 * k, maxTop = H - groundH - g - 70 * k;
      pipes.push({ x, top: minTop + Math.random() * Math.max(10, maxTop - minTop), gap: g, passed: false });
    }
    addPipe(W + 80);
    function spacing() { return 190 + Math.min(40, score); }

    function flap() {
      if (over) return;
      started = true;
      vy = -420 * k;
    }
    const onDown = e => { e.preventDefault(); flap(); };
    const onKey = e => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); flap(); }
    };
    host.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);

    function update(dt) {
      time += dt;
      if (!started) { by = H * 0.4 + Math.sin(time * 4) * 8; return; }
      const sp = speed();
      vy += 1500 * k * dt;
      by += vy * dt;
      scroll += sp * dt;
      for (const p of pipes) p.x -= sp * dt;
      const lastP = pipes[pipes.length - 1];
      if (lastP.x < W - spacing()) addPipe(lastP.x + spacing());
      pipes = pipes.filter(p => p.x > -pipeW - 10);
      for (const p of pipes) {
        if (!p.passed && p.x + pipeW < bx - R) {
          p.passed = true; score++; api.score(score);
        }
        if (bx + R * 0.8 > p.x && bx - R * 0.8 < p.x + pipeW) {
          if (by - R * 0.8 < p.top || by + R * 0.8 > p.top + p.gap) over = true;
        }
      }
      if (by + R > H - groundH) { by = H - groundH - R; over = true; }
      if (by - R < 0) { by = R; vy = 0; }
    }

    function drawPipe(x, y, h, cap) {
      ctx.fillStyle = '#3fae3f'; ctx.fillRect(x, y, pipeW, h);
      ctx.fillStyle = '#7be07b'; ctx.fillRect(x + 6, y, 8, h);
      ctx.fillStyle = '#2a7d2a'; ctx.fillRect(x + pipeW - 8, y, 8, h);
      ctx.fillStyle = '#3fae3f';
      const cy = cap ? y + h - 22 : y;
      ctx.fillRect(x - 4, cy, pipeW + 8, 22);
      ctx.strokeStyle = '#1f5f1f'; ctx.lineWidth = 2;
      ctx.strokeRect(x - 4, cy, pipeW + 8, 22);
    }
    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#5ab8ff'); g.addColorStop(1, '#bfeaff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.font = '50px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const c of clouds) {
        const x = ((c.x - scroll * 0.2 * c.s) % (W + 80) + W + 80) % (W + 80) - 40;
        ctx.globalAlpha = 0.8; ctx.fillText('☁️', x, c.y); ctx.globalAlpha = 1;
      }
      for (const p of pipes) {
        drawPipe(p.x, 0, p.top, true);
        drawPipe(p.x, p.top + p.gap, H - groundH - p.top - p.gap, false);
      }
      ctx.fillStyle = '#d9b36a'; ctx.fillRect(0, H - groundH, W, groundH);
      ctx.fillStyle = '#6fbf3a'; ctx.fillRect(0, H - groundH, W, 12 * k);
      ctx.fillStyle = '#c29a50';
      for (let x = -((scroll % 30)); x < W; x += 30) ctx.fillRect(x, H - groundH + 24 * k, 14, 6);
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.max(-0.5, Math.min(1.2, vy / (700 * k))));
      ctx.font = '34px serif';
      ctx.fillText('🐤', 0, 2);
      ctx.restore();
      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 5;
      ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeText(String(score), W / 2, 70 * k); ctx.fillText(String(score), W / 2, 70 * k);
      if (!started) {
        ctx.font = 'bold 22px sans-serif';
        ctx.strokeText('Tik om te vliegen!', W / 2, H * 0.58); ctx.fillText('Tik om te vliegen!', W / 2, H * 0.58);
      }
      if (over) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, 0, W, H);
      }
    }
    function frame(t) {
      if (dead) return;
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016);
      last = t;
      if (!over) update(dt);
      else {
        // vogel valt nog even
        vy += 1500 * k * dt; by = Math.min(H - groundH - R, by + vy * dt);
        overT += dt;
        if (overT > 0.7 && !done) { done = true; api.end(score); }
      }
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
