export default {
  id: 'meteorenregen', name: 'Meteorenregen', emoji: '☄️', hint: 'Sleep naar links/rechts en ontwijk de meteoren',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#0b0d24';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let dead = false, over = false, raf = 0, last = 0, t = 0, shown = 0, spawnT = 0.5, boom = 0;
    let px = W / 2, tx = null, rocks = [];
    const py = H - 70, keys = {};
    const stars = []; for (let i = 0; i < 40; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, s: 30 + Math.random() * 80 });
    const pos = e => { const b = cv.getBoundingClientRect(); return (e.clientX - b.left) * W / b.width; };
    const down = e => { tx = pos(e); try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const move = e => { if (tx !== null || e.pointerType === 'mouse') tx = pos(e); };
    const kd = e => { keys[e.key] = true; if (e.key.indexOf('Arrow') === 0) e.preventDefault(); };
    const ku = e => { keys[e.key] = false; };
    host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move);
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    function update(dt) {
      t += dt;
      const kv = ((keys.ArrowRight || keys.d) ? 1 : 0) - ((keys.ArrowLeft || keys.a) ? 1 : 0);
      if (kv) { px += kv * W * 1.2 * dt; tx = null; } else if (tx !== null) px += (tx - px) * Math.min(1, dt * 20);
      px = Math.max(18, Math.min(W - 18, px));
      for (const s of stars) { s.y += s.s * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } }
      spawnT -= dt;
      if (spawnT <= 0) {
        spawnT = Math.max(0.16, 0.75 - t * 0.011);
        const rad = 12 + Math.random() * 22;
        const aim = Math.random() < 0.3 + Math.min(0.3, t * 0.005);
        const x = Math.random() * W, sp = 170 + t * 5 + Math.random() * 90;
        const vx = aim ? Math.max(-120, Math.min(120, (px - x) * 0.35)) : (Math.random() - 0.5) * 60;
        rocks.push({ x, y: -rad, r: rad, vy: Math.min(sp, 700), vx, rot: 0, vr: (Math.random() - 0.5) * 4 });
      }
      for (const m of rocks) {
        m.x += m.vx * dt; m.y += m.vy * dt; m.rot += m.vr * dt;
        const dx = m.x - px, dy = m.y - py;
        if (dx * dx + dy * dy < (m.r * 0.85 + 13) * (m.r * 0.85 + 13)) { over = true; boom = 1; break; }
      }
      rocks = rocks.filter(m => m.y < H + 60);
      const sc = Math.floor(t) * 10;
      if (sc !== shown) { shown = sc; api.score(sc); }
      if (over) api.end(Math.floor(t) * 10);
    }
    function draw() {
      ctx.fillStyle = '#0b0d24'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; for (const s of stars) ctx.fillRect(s.x, s.y, 2, 2);
      for (const m of rocks) {
        ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.rot);
        ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.arc(0, -m.r * 0.9, m.r * 0.5, 0, 7); ctx.fill();
        const g = ctx.createRadialGradient(-m.r * 0.3, -m.r * 0.3, 2, 0, 0, m.r);
        g.addColorStop(0, '#a1887f'); g.addColorStop(1, '#4e342e');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, m.r, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.arc(m.r * 0.3, m.r * 0.2, m.r * 0.22, 0, 7); ctx.arc(-m.r * 0.35, m.r * 0.35, m.r * 0.15, 0, 7); ctx.fill();
        ctx.restore();
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '36px serif'; ctx.fillText(boom ? '💥' : '🧑‍🚀', px, py);
      ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
      ctx.fillText('⏱ ' + Math.floor(t) + ' s', 12, 26);
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
      host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      if (cv.parentNode) cv.parentNode.removeChild(cv);
    } };
  },
};
