export default {
  id: 'blokkenbreker', name: 'Blokkenbreker', emoji: '🧱', hint: 'Sleep het batje, tik om te lanceren',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#1b1030';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let dead = false, over = false, raf = 0, last = 0, score = 0, lives = 3, level = 1;
    const COLS = 8, ROWS = 6, gap = 3, bw = (W - 20 - gap * (COLS - 1)) / COLS, bh = 20, top = 70;
    const colors = ['#ff5252', '#ff9800', '#ffeb3b', '#66bb6a', '#29b6f6', '#ab47bc'];
    const pw = Math.max(64, W * 0.22), ph = 12, py = H - 50, r = 7;
    let px = W / 2, tx = null, bricks = [], sp = 330, stuck = true, stuckT = 2.5, vx = 0, vy = 0, bx = 0, by = 0;
    const keys = {};
    function build() {
      bricks = [];
      for (let rw = 0; rw < ROWS; rw++) for (let c = 0; c < COLS; c++)
        bricks.push({ x: 10 + c * (bw + gap), y: top + rw * (bh + gap), row: rw, alive: true });
    }
    build();
    function reset() { stuck = true; stuckT = 2.5; }
    function launch() {
      if (!stuck) return; stuck = false;
      const a = (Math.random() - 0.5) * 0.8; vx = sp * Math.sin(a); vy = -sp * Math.cos(a);
    }
    const pos = e => { const b = cv.getBoundingClientRect(); return (e.clientX - b.left) * W / b.width; };
    const down = e => { tx = pos(e); try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const move = e => { if (tx !== null || e.pointerType === 'mouse') tx = pos(e); };
    const up = () => { launch(); };
    const kd = e => { keys[e.key] = true; if (e.key === ' ') { launch(); e.preventDefault(); } if (e.key.indexOf('Arrow') === 0) e.preventDefault(); };
    const ku = e => { keys[e.key] = false; };
    host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move); host.addEventListener('pointerup', up);
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    function setSpeed() { const k = Math.hypot(vx, vy) || 1; vx = vx / k * sp; vy = vy / k * sp; }
    function update(dt) {
      const kv = ((keys.ArrowRight || keys.d) ? 1 : 0) - ((keys.ArrowLeft || keys.a) ? 1 : 0);
      if (kv) { px += kv * W * 1.2 * dt; tx = null; } else if (tx !== null) px = tx;
      px = Math.max(pw / 2, Math.min(W - pw / 2, px));
      if (stuck) { bx = px; by = py - r - 1; stuckT -= dt; if (stuckT <= 0) launch(); return; }
      const steps = Math.max(1, Math.ceil(sp * dt / 4)), sd = dt / steps;
      for (let s = 0; s < steps && !over; s++) {
        bx += vx * sd; by += vy * sd;
        if (bx < r) { bx = r; vx = Math.abs(vx); }
        if (bx > W - r) { bx = W - r; vx = -Math.abs(vx); }
        if (by < r) { by = r; vy = Math.abs(vy); }
        if (vy > 0 && by + r >= py && by + r <= py + ph + 10 && Math.abs(bx - px) <= pw / 2 + r) {
          const rel = Math.max(-1, Math.min(1, (bx - px) / (pw / 2)));
          const a = rel * 1.1; vx = sp * Math.sin(a); vy = -sp * Math.cos(a); by = py - r;
        }
        for (const b of bricks) {
          if (!b.alive) continue;
          const cx = Math.max(b.x, Math.min(bx, b.x + bw)), cy = Math.max(b.y, Math.min(by, b.y + bh));
          if ((bx - cx) * (bx - cx) + (by - cy) * (by - cy) < r * r) {
            b.alive = false; score += (ROWS - b.row) * 10 * level; api.score(score);
            const ex = Math.abs(bx - (b.x + bw / 2)) / (bw / 2), ey = Math.abs(by - (b.y + bh / 2)) / (bh / 2);
            if (ex > ey) vx = -vx; else vy = -vy;
            sp = Math.min(sp + 4, 720); setSpeed();
            break;
          }
        }
        if (by > H + r) {
          lives--;
          if (lives <= 0) { over = true; api.end(score); } else reset();
          break;
        }
      }
      if (!over && !bricks.some(b => b.alive)) { level++; sp = Math.min(330 + level * 30, 600); build(); reset(); }
    }
    function draw() {
      ctx.fillStyle = '#1b1030'; ctx.fillRect(0, 0, W, H);
      for (const b of bricks) if (b.alive) { ctx.fillStyle = colors[b.row % colors.length]; ctx.fillRect(b.x, b.y, bw, bh); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(b.x, b.y, bw, 4); }
      ctx.fillStyle = '#4dd0e1'; ctx.fillRect(px - pw / 2, py, pw, ph);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.textBaseline = 'middle';
      ctx.textAlign = 'left'; ctx.fillText('❤️'.repeat(Math.max(0, lives)), 10, 30);
      ctx.textAlign = 'right'; ctx.fillText('Level ' + level, W - 10, 30);
      if (stuck && !over) { ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText('Tik om te lanceren', W / 2, H - 100); }
    }
    bx = px; by = py - r - 1;
    function frame(t) {
      if (dead) return; raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
      if (!over) update(dt);
      draw();
    }
    raf = requestAnimationFrame(frame);
    return { destroy() {
      dead = true; cancelAnimationFrame(raf);
      host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move); host.removeEventListener('pointerup', up);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      if (cv.parentNode) cv.parentNode.removeChild(cv);
    } };
  },
};
