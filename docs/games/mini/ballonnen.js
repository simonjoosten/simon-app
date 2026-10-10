export default {
  id: 'ballonnen', name: 'Ballonnen', emoji: '🎈', hint: 'Tik de ballonnen kapot, goud geeft bonus',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#8fd3ff';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let dead = false, over = false, raf = 0, last = 0, score = 0, esc = 0, t = 0, spawnT = 0.3, msg = '', msgT = 0;
    const MAX = 10, cols = ['#ff5252', '#ff9800', '#ab47bc', '#26c6da', '#66bb6a', '#ec407a', '#5c6bc0'];
    let bl = [], parts = [];
    const clouds = [{ x: 40, y: 90, s: 1 }, { x: 250, y: 220, s: 1.3 }, { x: 120, y: 420, s: 0.9 }];
    function spawn() {
      const r = Math.max(22, 36 - t * 0.12) * (0.85 + Math.random() * 0.3);
      const gold = Math.random() < 0.07;
      bl.push({ x: r + Math.random() * (W - 2 * r), y: H + r * 1.4, r: gold ? Math.max(20, r * 0.8) : r,
        vy: Math.min(60 + t * 2.2, 240) * (0.8 + Math.random() * 0.5) * (gold ? 1.5 : 1), ph: Math.random() * 6, gold,
        c: gold ? '#ffd700' : cols[Math.floor(Math.random() * cols.length)] });
    }
    function pop(b) {
      b.d = true;
      for (let i = 0; i < 12; i++) { const a = Math.random() * 6.28, s = 60 + Math.random() * 160; parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: 0.5, c: b.c }); }
      if (b.gold) { score += 10; esc = Math.max(0, esc - 3); msg = 'Goud! +10'; msgT = 1; } else score += 1;
      api.score(score);
    }
    const down = e => {
      if (over) return; e.preventDefault();
      const bb = cv.getBoundingClientRect(), x = (e.clientX - bb.left) * W / bb.width, y = (e.clientY - bb.top) * H / bb.height;
      for (let i = bl.length - 1; i >= 0; i--) {
        const b = bl[i], dx = x - b.x, dy = y - (b.y - b.r * 0.1);
        if (dx * dx + dy * dy <= (b.r * 1.3) * (b.r * 1.3)) { pop(b); break; }
      }
    };
    host.addEventListener('pointerdown', down);
    function update(dt) {
      t += dt; msgT -= dt;
      spawnT -= dt;
      if (spawnT <= 0) { spawnT = Math.max(0.28, 1.0 - t * 0.014); spawn(); if (t > 25 && Math.random() < 0.4) spawn(); }
      for (const b of bl) {
        b.y -= b.vy * dt; b.x += Math.sin(t * 2 + b.ph) * 20 * dt;
        if (!b.d && b.y < -b.r * 1.6) { b.d = true; if (!b.gold) { esc++; msg = 'Ontsnapt!'; msgT = 0.6; } }
      }
      bl = bl.filter(b => !b.d);
      for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.l -= dt; }
      parts = parts.filter(p => p.l > 0);
      for (const c of clouds) { c.x += 8 * dt; if (c.x > W + 60) c.x = -60; }
      if (esc >= MAX) { over = true; api.end(score); }
    }
    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5fb8f5'); g.addColorStop(1, '#d6f0ff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      for (const c of clouds) { ctx.beginPath(); ctx.arc(c.x, c.y, 20 * c.s, 0, 7); ctx.arc(c.x + 22 * c.s, c.y - 8 * c.s, 26 * c.s, 0, 7); ctx.arc(c.x + 48 * c.s, c.y, 20 * c.s, 0, 7); ctx.fill(); }
      for (const b of bl) {
        ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(b.x, b.y + b.r * 1.15); ctx.quadraticCurveTo(b.x + 8 * Math.sin(t * 3 + b.ph), b.y + b.r * 1.7, b.x, b.y + b.r * 2.2); ctx.stroke();
        ctx.fillStyle = b.c; ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r * 0.85, b.r * 1.1, 0, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.ellipse(b.x - b.r * 0.3, b.y - b.r * 0.4, b.r * 0.2, b.r * 0.32, 0.5, 0, 7); ctx.fill();
        if (b.gold) { ctx.fillStyle = '#fff'; ctx.font = '16px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⭐', b.x, b.y + 2); }
      }
      for (const p of parts) { ctx.globalAlpha = Math.max(0, p.l * 2); ctx.fillStyle = p.c; ctx.fillRect(p.x - 3, p.y - 3, 6, 6); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#12304a'; ctx.font = 'bold 20px sans-serif'; ctx.textBaseline = 'middle';
      ctx.textAlign = 'left'; ctx.fillText('🎈 ' + score, 12, 26);
      ctx.textAlign = 'right'; ctx.fillText('💨 ' + esc + '/' + MAX, W - 12, 26);
      if (msgT > 0) { ctx.textAlign = 'center'; ctx.font = 'bold 26px sans-serif'; ctx.globalAlpha = Math.min(1, msgT * 2); ctx.fillText(msg, W / 2, 80); ctx.globalAlpha = 1; }
    }
    function frame(ts) {
      if (dead) return; raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
      if (!over) update(dt);
      draw();
    }
    raf = requestAnimationFrame(frame);
    return { destroy() {
      dead = true; cancelAnimationFrame(raf);
      host.removeEventListener('pointerdown', down);
      if (cv.parentNode) cv.parentNode.removeChild(cv);
    } };
  },
};
