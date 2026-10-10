export default {
  id: 'pianotegels', name: 'Pianotegels', emoji: '🎹', hint: 'Tik alleen de zwarte tegels, niet missen!',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#fff';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let dead = false, over = false, raf = 0, last = 0, score = 0, flashCol = -1, flashT = 0, endT = 0;
    const cw = W / 4, rh = H / 4;
    let rows = [], lastCol = -1;
    function newCol() { let c; do { c = Math.floor(Math.random() * 4); } while (c === lastCol && Math.random() < 0.5); lastCol = c; return c; }
    for (let i = 0; i < 6; i++) rows.push({ y: H - rh * (i + 2), col: newCol(), done: false });
    function fail(col) {
      if (over) return; over = true; flashCol = col; flashT = 1; endT = 0.7;
    }
    function tap(c) {
      if (over || dead) return;
      let act = null;
      for (const r of rows) if (!r.done && (!act || r.y > act.y)) act = r;
      if (!act) return;
      if (act.col === c) { act.done = true; score++; api.score(score); }
      else fail(c);
    }
    const down = e => { const b = cv.getBoundingClientRect(); const x = (e.clientX - b.left) * W / b.width; e.preventDefault(); tap(Math.max(0, Math.min(3, Math.floor(x / cw)))); };
    const kmap = { d: 0, f: 1, j: 2, k: 3, '1': 0, '2': 1, '3': 2, '4': 3, a: 0, s: 1, ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3 };
    const kd = e => { if (e.repeat) return; const c = kmap[e.key]; if (c !== undefined) { e.preventDefault(); tap(c); } };
    host.addEventListener('pointerdown', down); window.addEventListener('keydown', kd);
    function update(dt) {
      if (over) { endT -= dt; flashT -= dt; if (endT <= 0 && !dead && !update.ended) { update.ended = true; api.end(score); } return; }
      const speed = Math.min(220 + score * 9, 900);
      for (const r of rows) r.y += speed * dt;
      for (const r of rows) if (!r.done && r.y >= H) { fail(r.col); r.y = H - 1; return; }
      rows = rows.filter(r => r.y < H + rh);
      let topY = Infinity; for (const r of rows) if (r.y < topY) topY = r.y;
      while (topY > -rh) { topY -= rh; rows.push({ y: topY, col: newCol(), done: false }); }
    }
    function draw() {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      for (const r of rows) {
        ctx.fillStyle = r.done ? '#cfd8dc' : '#111';
        ctx.fillRect(r.col * cw + 1, r.y + 1, cw - 2, rh - 2);
        if (!r.done) { ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(r.col * cw + 1, r.y + 1, cw - 2, 10); }
      }
      ctx.strokeStyle = '#d0d0d0'; ctx.lineWidth = 1;
      ctx.beginPath(); for (let i = 1; i < 4; i++) { ctx.moveTo(i * cw, 0); ctx.lineTo(i * cw, H); } ctx.stroke();
      if (over && flashCol >= 0) { ctx.fillStyle = 'rgba(255,0,0,' + Math.max(0, Math.min(.6, flashT)) + ')'; ctx.fillRect(flashCol * cw, 0, cw, H); }
      ctx.fillStyle = '#e91e63'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(String(score), W / 2, 16);
    }
    function frame(t) {
      if (dead) return; raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
      update(dt); draw();
    }
    raf = requestAnimationFrame(frame);
    return { destroy() {
      dead = true; cancelAnimationFrame(raf);
      host.removeEventListener('pointerdown', down); window.removeEventListener('keydown', kd);
      if (cv.parentNode) cv.parentNode.removeChild(cv);
    } };
  },
};
