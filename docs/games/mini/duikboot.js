export default {
  id: 'duikboot',
  name: 'Duikboot',
  emoji: '🤿',
  hint: 'Sleep je duikboot door de mijnen, pak schatten en zuurstof',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#06304f';
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const sub = { x: W * 0.28, y: H * 0.5, hp: 3, inv: 0, tilt: 0 };
    const tgt = { x: sub.x, y: sub.y };
    const keys = {};
    let dragging = false, offX = 0, offY = 0;
    let mines = [], items = [], bubbles = [], fx = [], texts = [], fish = [], weeds = [];
    for (let i = 0; i < 6; i++) fish.push({ x: Math.random() * W, y: Math.random() * H, v: 20 + Math.random() * 30, s: 0.6 + Math.random() * 0.6 });
    for (let i = 0; i < 8; i++) weeds.push({ x: i * 55 + Math.random() * 30, h: 30 + Math.random() * 40 });
    let oxy = 100, dist = 0, treasure = 0, time = 0, nextX = W + 60, speed = 90;
    let dead = false, over = false, raf = 0, last = 0, warn = 0;

    function pt(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / (r.width || W), (e.clientY - r.top) * H / (r.height || H)]; }
    function onDown(e) { const [x, y] = pt(e); dragging = true; offX = sub.x - x; offY = sub.y - y; try { cv.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); }
    function onMove(e) { if (!dragging) return; const [x, y] = pt(e); tgt.x = x + offX; tgt.y = y + offY; }
    function onUp() { dragging = false; }
    function onKey(e) { keys[e.key] = e.type === 'keydown'; if (e.key.startsWith('Arrow')) e.preventDefault(); }
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);

    const total = () => Math.floor(dist / 12) + treasure;
    function spawn() {
      const lv = Math.min(8, dist / 1200);
      const cnt = 1 + Math.floor(Math.random() * (1 + lv * 0.5));
      for (let i = 0; i < cnt; i++) {
        mines.push({ x: nextX + Math.random() * 60, y: 50 + Math.random() * (H - 100), r: 16, ph: Math.random() * 6, amp: Math.random() < 0.4 + lv * 0.05 ? 25 + Math.random() * 45 : 0, f: 0.8 + Math.random() * 1.2, y0: 0, chain: Math.random() < 0.3 });
        mines[mines.length - 1].y0 = mines[mines.length - 1].y;
      }
      const r = Math.random();
      if (r < 0.5) items.push({ k: 'gem', x: nextX + 30 + Math.random() * 100, y: 60 + Math.random() * (H - 120), ph: 0 });
      else if (r < 0.7 + Math.min(0.15, oxy < 50 ? 0.15 : 0)) items.push({ k: 'o2', x: nextX + 40 + Math.random() * 80, y: 60 + Math.random() * (H - 120), ph: 0 });
      nextX += 120 + Math.random() * 60 - Math.min(50, lv * 6);
    }
    function boom(x, y, n, c) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = 30 + Math.random() * 160; fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.5 + Math.random() * 0.4, c: c || '#ffb703' }); } }
    function hurt() {
      if (sub.inv > 0 || over) return;
      sub.hp--; sub.inv = 1.4; boom(sub.x, sub.y, 25);
      if (sub.hp <= 0) { over = true; finish(); }
    }
    function finish() { api.end(total()); }

    function update(dt) {
      time += dt;
      speed = Math.min(210, 90 + dist / 90);
      dist += speed * dt;
      sub.inv = Math.max(0, sub.inv - dt);
      const kd = 260 * dt;
      if (keys.ArrowLeft) tgt.x -= kd; if (keys.ArrowRight) tgt.x += kd;
      if (keys.ArrowUp) tgt.y -= kd; if (keys.ArrowDown) tgt.y += kd;
      tgt.x = Math.max(30, Math.min(W * 0.62, tgt.x)); tgt.y = Math.max(30, Math.min(H - 40, tgt.y));
      const px = sub.x, py = sub.y;
      const k = 1 - Math.pow(0.002, dt);
      sub.x += (tgt.x - sub.x) * k; sub.y += (tgt.y - sub.y) * k;
      sub.tilt += (((sub.y - py) / Math.max(dt, 0.001)) / 500 - sub.tilt) * 0.15;
      oxy -= dt * (3.5 + Math.min(4, dist / 1500));
      if (oxy <= 0) { oxy = 0; if (!over) { over = true; finish(); } }
      warn = oxy < 25 ? 1 : 0;
      nextX -= speed * dt;
      while (nextX < W + 120) spawn();
      const dx = speed * dt;
      for (const m of mines) { m.x -= dx; m.y = m.amp ? m.y0 + Math.sin(time * m.f + m.ph) * m.amp : m.y; }
      for (const it of items) it.x -= dx;
      for (const f of fish) { f.x -= (dx * 0.5 + f.v * dt); if (f.x < -30) { f.x = W + 30; f.y = Math.random() * H; } }
      for (const w of weeds) { w.x -= dx * 0.8; if (w.x < -20) w.x += 460; }
      if (Math.random() < dt * 4) bubbles.push({ x: sub.x - 24, y: sub.y - 4, t: 1.2 });
      for (const b of bubbles) { b.y -= 40 * dt; b.x -= dx * 0.6; b.t -= dt; }
      bubbles = bubbles.filter((b) => b.t > 0);
      for (const m of mines) {
        if (!m.gone && Math.hypot(m.x - sub.x, m.y - sub.y) < m.r + 15) {
          m.gone = true; hurt();
          if (m.chain) { for (const o of mines) if (!o.gone && Math.hypot(o.x - m.x, o.y - m.y) < 80) o.gone = true; }
        }
      }
      for (const it of items) {
        if (!it.got && Math.hypot(it.x - sub.x, it.y - sub.y) < 28) {
          it.got = true;
          if (it.k === 'gem') { treasure += 25; texts.push({ x: it.x, y: it.y, s: '+25', t: 0.8 }); boom(it.x, it.y, 8, '#ffe066'); }
          else { oxy = Math.min(100, oxy + 30); texts.push({ x: it.x, y: it.y, s: 'O₂', t: 0.8 }); boom(it.x, it.y, 8, '#aef'); }
        }
      }
      mines = mines.filter((m) => !m.gone && m.x > -40);
      items = items.filter((i) => !i.got && i.x > -40);
      for (const f of fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.t -= dt; }
      fx = fx.filter((f) => f.t > 0);
      for (const t of texts) { t.y -= 30 * dt; t.t -= dt; }
      texts = texts.filter((t) => t.t > 0);
      api.score(total());
    }

    function draw() {
      const depth = Math.min(1, dist / 8000);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgb(' + Math.round(30 - 20 * depth) + ',' + Math.round(130 - 80 * depth) + ',' + Math.round(180 - 80 * depth) + ')');
      g.addColorStop(1, 'rgb(' + Math.round(5) + ',' + Math.round(40 - 25 * depth) + ',' + Math.round(80 - 40 * depth) + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < 4; i++) { const x = ((i * 130 - dist * 0.2) % (W + 100) + W + 100) % (W + 100) - 50; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 40, 0); ctx.lineTo(x + 110, H); ctx.lineTo(x + 50, H); ctx.fill(); }
      ctx.fillStyle = '#12503a';
      for (const w of weeds) { ctx.beginPath(); ctx.moveTo(w.x, H); ctx.quadraticCurveTo(w.x + Math.sin(time * 2 + w.x) * 8, H - w.h / 2, w.x + 4, H - w.h); ctx.lineTo(w.x + 10, H - w.h / 2); ctx.lineTo(w.x + 12, H); ctx.fill(); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const f of fish) { ctx.font = 20 * f.s + 'px serif'; ctx.globalAlpha = 0.5; ctx.fillText('🐟', f.x, f.y); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (const b of bubbles) { ctx.beginPath(); ctx.arc(b.x, b.y, 2 + b.t * 2, 0, 6.283); ctx.fill(); }
      for (const m of mines) {
        ctx.save(); ctx.translate(m.x, m.y);
        ctx.fillStyle = '#444';
        for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i * Math.PI / 4); ctx.fillRect(-2.5, -m.r - 7, 5, 9); ctx.restore(); }
        ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.arc(0, 0, m.r, 0, 6.283); ctx.fill();
        ctx.fillStyle = Math.floor(time * 2 + m.ph) % 2 ? '#ff3b3b' : '#771111'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 6.283); ctx.fill();
        if (m.amp) { ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.moveTo(0, m.y0 - m.y + m.amp + 20); ctx.lineTo(0, m.y0 - m.y - m.amp - 20); ctx.stroke(); }
        ctx.restore();
      }
      for (const it of items) {
        ctx.font = '26px serif';
        const b = Math.sin(time * 4 + it.x) * 3;
        if (it.k === 'gem') ctx.fillText('💎', it.x, it.y + b);
        else { ctx.fillStyle = 'rgba(180,240,255,0.8)'; ctx.beginPath(); ctx.arc(it.x, it.y + b, 14, 0, 6.283); ctx.fill(); ctx.fillStyle = '#046'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('O₂', it.x, it.y + b); }
      }
      if (!over && (sub.inv <= 0 || Math.floor(time * 14) % 2)) {
        ctx.save(); ctx.translate(sub.x, sub.y); ctx.rotate(sub.tilt);
        ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 13, 0, 0, 6.283); ctx.fill();
        ctx.fillRect(-4, -20, 10, 9); ctx.fillRect(2, -22, 8, 4);
        ctx.fillStyle = '#c9a000'; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-36, -8); ctx.lineTo(-36, 8); ctx.fill();
        ctx.fillStyle = '#8fd9ff'; ctx.beginPath(); ctx.arc(8, -1, 6, 0, 6.283); ctx.arc(-8, -1, 5, 0, 6.283); ctx.fill();
        ctx.restore();
      }
      for (const f of fx) { ctx.globalAlpha = Math.min(1, f.t * 2); ctx.fillStyle = f.c; ctx.fillRect(f.x, f.y, 4, 4); }
      ctx.globalAlpha = 1;
      ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = '#fff';
      for (const t of texts) { ctx.globalAlpha = Math.min(1, t.t * 2); ctx.fillText(t.s, t.x, t.y); }
      ctx.globalAlpha = 1;
      // zuurstofbalk en levens
      ctx.textAlign = 'left'; ctx.font = '16px serif'; ctx.fillText('❤️'.repeat(Math.max(0, sub.hp)), 8, 20);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(8, 36, 110, 12);
      ctx.fillStyle = warn && Math.floor(time * 4) % 2 ? '#ff4d4d' : '#7ee8fa'; ctx.fillRect(8, 36, 110 * oxy / 100, 12);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('Zuurstof', 124, 43);
      ctx.fillText('💎 ' + treasure, 8, 64);
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
        cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointermove', onMove);
        cv.removeEventListener('pointerup', onUp); cv.removeEventListener('pointercancel', onUp);
        window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey);
        cv.remove();
      },
    };
  },
};
