export default {
  id: 'omhoog', name: 'Omhoog', emoji: '🐸', hint: 'Sleep of neig links-rechts, stuiter omhoog',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#bfeaff';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let dead = false, over = false, raf = 0, last = 0, shown = 0, time = 0;
    const G = 1500, JUMP = 800, PH = 12;
    const startY = H - 120;
    const p = { x: W / 2, y: startY, vy: -JUMP, vx: 0 };
    let camY = p.y - H * 0.6, plats = [], topY = H - 60, tx = null, tilt = 0, prevTop = 0, dir = 1;
    const keys = {};
    function height() { return Math.max(0, Math.floor((startY - p.minY) / 10)); }
    p.minY = startY;
    function addPlat(y, type) {
      const d = Math.min(1, (startY - p.minY) / 30000);
      const w = 70 - d * 22;
      plats.push({ x: Math.random() * (W - w), y, w, type, vx: type === 'move' ? (60 + Math.random() * 60) * (Math.random() < 0.5 ? -1 : 1) : 0, gone: false });
    }
    plats.push({ x: W / 2 - 40, y: H - 60, w: 80, type: 'normal', vx: 0, gone: false });
    function fill() {
      while (topY > camY - 140) {
        const hh = (startY - topY) / 10, d = Math.min(1, hh / 3000);
        topY -= 55 + Math.random() * (40 + d * 60);
        const r = Math.random();
        const type = hh > 150 && r < 0.12 + d * 0.15 ? 'move' : 'normal';
        addPlat(topY, type);
        if (hh > 100 && Math.random() < 0.15 + d * 0.2) addPlat(topY + 20 + Math.random() * 30, 'break');
      }
    }
    fill();
    const pos = e => { const b = cv.getBoundingClientRect(); return (e.clientX - b.left) * W / b.width; };
    const down = e => { tx = pos(e); try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const move = e => { if (tx !== null || e.pointerType === 'mouse') tx = pos(e); };
    const kd = e => { keys[e.key] = true; if (e.key.indexOf('Arrow') === 0) e.preventDefault(); };
    const ku = e => { keys[e.key] = false; };
    const ori = e => { if (typeof e.gamma === 'number') tilt = Math.max(-35, Math.min(35, e.gamma)); };
    host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move);
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    try { window.addEventListener('deviceorientation', ori); } catch (_) {}
    function update(dt) {
      time += dt;
      const kv = ((keys.ArrowRight || keys.d) ? 1 : 0) - ((keys.ArrowLeft || keys.a) ? 1 : 0);
      if (kv) { p.vx = kv * 300; tx = null; dir = kv; }
      else if (tx !== null) { p.vx = Math.max(-500, Math.min(500, (tx - p.x) * 9)); }
      else if (Math.abs(tilt) > 3) p.vx = tilt * 12;
      else p.vx = 0;
      if (p.vx) dir = p.vx > 0 ? 1 : -1;
      p.x += p.vx * dt;
      if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
      prevTop = p.y + 18;
      p.vy += G * dt; p.y += p.vy * dt;
      if (p.y < p.minY) p.minY = p.y;
      for (const pl of plats) {
        if (pl.type === 'move') { pl.x += pl.vx * dt; if (pl.x < 0 || pl.x + pl.w > W) pl.vx = -pl.vx; }
        if (pl.gone) continue;
        if (p.vy > 0 && prevTop <= pl.y + 2 && p.y + 18 >= pl.y && p.x + 14 > pl.x && p.x - 14 < pl.x + pl.w) {
          if (pl.type === 'break') pl.gone = true; else { p.vy = -JUMP; p.y = pl.y - 18; }
        }
      }
      if (p.y - H * 0.4 < camY) camY = p.y - H * 0.4;
      fill();
      plats = plats.filter(pl => !pl.gone && pl.y < camY + H + 60);
      const sc = height();
      if (sc !== shown) { shown = sc; api.score(sc); }
      if (p.y > camY + H + 40) { over = true; api.end(sc); }
    }
    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      const k = Math.min(1, (startY - camY) / 20000);
      g.addColorStop(0, k > 0.5 ? '#1a1a4a' : '#7ec8ff'); g.addColorStop(1, '#d6f2ff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (const pl of plats) {
        const y = pl.y - camY;
        ctx.fillStyle = pl.type === 'move' ? '#42a5f5' : pl.type === 'break' ? '#a1887f' : '#66bb6a';
        ctx.fillRect(pl.x, y, pl.w, PH);
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(pl.x, y, pl.w, 3);
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '36px serif';
      ctx.save(); ctx.translate(p.x, p.y - camY); if (dir < 0) ctx.scale(-1, 1); ctx.fillText('🐸', 0, 0); ctx.restore();
      ctx.fillStyle = '#12304a'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(shown + ' m', 12, 26);
    }
    function frame(t) {
      if (dead) return; raf = requestAnimationFrame(frame);
      const dt = Math.min(0.033, (t - (last || t)) / 1000); last = t;
      if (!over) update(dt);
      draw();
    }
    raf = requestAnimationFrame(frame);
    return { destroy() {
      dead = true; cancelAnimationFrame(raf);
      host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      try { window.removeEventListener('deviceorientation', ori); } catch (_) {}
      if (cv.parentNode) cv.parentNode.removeChild(cv);
    } };
  },
};
