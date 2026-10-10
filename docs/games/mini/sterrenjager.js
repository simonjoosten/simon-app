export default {
  id: 'sterrenjager',
  name: 'Sterrenjager',
  emoji: '⭐',
  hint: 'Sleep om sterren te pakken, mijd de zwarte gaten',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#05031a';
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const s = { x: W / 2, y: H * 0.75, vx: 0, vy: 0 };
    const tgt = { x: s.x, y: s.y };
    const keys = {};
    let dragging = false, offX = 0, offY = 0;
    let holes = [], stars = [], bg = [], trail = [], fx = [], texts = [];
    for (let i = 0; i < 60; i++) bg.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + 0.3, a: Math.random() });
    let score = 0, time = 0, left = 25, combo = 0, comboT = 0, holeT = 10, starT = 0;
    let dead = false, over = false, raf = 0, last = 0;

    function pt(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / (r.width || W), (e.clientY - r.top) * H / (r.height || H)]; }
    function onDown(e) { const [x, y] = pt(e); dragging = true; offX = s.x - x; offY = s.y - y; tgt.x = s.x; tgt.y = s.y; try { cv.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); }
    function onMove(e) { if (!dragging) return; const [x, y] = pt(e); tgt.x = x + offX; tgt.y = y + offY; }
    function onUp() { dragging = false; }
    function onKey(e) { keys[e.key] = e.type === 'keydown'; if (e.key.startsWith('Arrow')) e.preventDefault(); }
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);

    function addHole() {
      let x, y, tries = 0;
      do { x = 40 + Math.random() * (W - 80); y = 60 + Math.random() * (H - 200); tries++; } while (tries < 20 && Math.hypot(x - s.x, y - s.y) < 130);
      const a = Math.random() * 6.28, v = 8 + Math.random() * 14 + time / 20;
      holes.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, m: 0.9 + Math.random() * 0.5, born: 0 });
    }
    function addStar() {
      let x, y, tries = 0, ok;
      do {
        x = 24 + Math.random() * (W - 48); y = 50 + Math.random() * (H - 100); ok = true;
        for (const h of holes) if (Math.hypot(h.x - x, h.y - y) < 45) ok = false;
        tries++;
      } while (!ok && tries < 30);
      stars.push({ x, y, t: 0, life: 10 });
    }
    addHole(); addStar(); addStar(); addStar();

    function die() {
      if (over) return;
      over = true;
      for (let i = 0; i < 24; i++) { const a = Math.random() * 6.28; fx.push({ x: s.x, y: s.y, vx: -Math.cos(a) * 60, vy: -Math.sin(a) * 60, t: 0.8, c: '#ffd166', sink: true }); }
      api.end(Math.floor(score));
    }
    function update(dt) {
      time += dt; left -= dt; comboT -= dt; if (comboT <= 0) combo = 0;
      if (left <= 0) { left = 0; die(); return; }
      const kd = 300 * dt;
      if (keys.ArrowLeft) tgt.x -= kd; if (keys.ArrowRight) tgt.x += kd;
      if (keys.ArrowUp) tgt.y -= kd; if (keys.ArrowDown) tgt.y += kd;
      tgt.x = Math.max(10, Math.min(W - 10, tgt.x)); tgt.y = Math.max(10, Math.min(H - 10, tgt.y));
      let ax = (tgt.x - s.x) * 14, ay = (tgt.y - s.y) * 14;
      const al = Math.hypot(ax, ay); if (al > 900) { ax *= 900 / al; ay *= 900 / al; }
      ax -= s.vx * 5; ay -= s.vy * 5;
      for (const h of holes) {
        h.born = Math.min(1, h.born + dt);
        const dx = h.x - s.x, dy = h.y - s.y, d2 = dx * dx + dy * dy, d = Math.sqrt(d2) || 1;
        if (d < 200) {
          const f = Math.min(1800, 70000 * h.m * h.born / (d2 + 1500));
          ax += dx / d * f; ay += dy / d * f;
        }
        if (d < 13 && h.born > 0.6) die();
        h.x += h.vx * dt; h.y += h.vy * dt;
        if (h.x < 30 || h.x > W - 30) h.vx = -h.vx; if (h.y < 50 || h.y > H - 40) h.vy = -h.vy;
      }
      s.vx += ax * dt; s.vy += ay * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.x < 8) { s.x = 8; s.vx = Math.abs(s.vx) * 0.5; } if (s.x > W - 8) { s.x = W - 8; s.vx = -Math.abs(s.vx) * 0.5; }
      if (s.y < 8) { s.y = 8; s.vy = Math.abs(s.vy) * 0.5; } if (s.y > H - 8) { s.y = H - 8; s.vy = -Math.abs(s.vy) * 0.5; }
      trail.push({ x: s.x, y: s.y, t: 0.5 });
      for (const t of trail) t.t -= dt;
      trail = trail.filter((t) => t.t > 0);
      holeT -= dt;
      const maxH = Math.min(6, 1 + Math.floor(time / 14));
      if (holeT <= 0) { if (holes.length < maxH) addHole(); holeT = 9; }
      starT -= dt;
      for (const st of stars) {
        st.t += dt;
        if (Math.hypot(st.x - s.x, st.y - s.y) < 20) {
          st.got = true; combo = comboT > 0 ? Math.min(combo + 1, 8) : 1; comboT = 2.5;
          const p = 10 * combo; score += p; left = Math.min(30, left + 2.2 - Math.min(1, time / 90));
          texts.push({ x: st.x, y: st.y, s: '+' + p, t: 0.8 });
          for (let i = 0; i < 10; i++) { const a = Math.random() * 6.28; fx.push({ x: st.x, y: st.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, t: 0.5, c: '#ffe066' }); }
        } else if (st.t > st.life) st.got = true;
      }
      stars = stars.filter((st) => !st.got);
      const want = Math.min(6, 3 + Math.floor(time / 30));
      while (stars.length < want) addStar();
      for (const f of fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.t -= dt; }
      fx = fx.filter((f) => f.t > 0);
      for (const t of texts) { t.y -= 30 * dt; t.t -= dt; }
      texts = texts.filter((t) => t.t > 0);
      api.score(Math.floor(score));
    }

    function star(x, y, r, rot) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r, a = rot + i * Math.PI / 5 - Math.PI / 2; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      ctx.closePath(); ctx.fill();
    }
    function draw() {
      ctx.fillStyle = '#05031a'; ctx.fillRect(0, 0, W, H);
      for (const b of bg) { ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.4 * Math.abs(Math.sin(time + b.a * 6))) + ')'; ctx.fillRect(b.x, b.y, b.r, b.r); }
      for (const h of holes) {
        const R = 14 * (0.5 + 0.5 * h.born);
        for (let i = 0; i < 3; i++) {
          ctx.strokeStyle = 'rgba(160,90,255,' + (0.35 - i * 0.1) + ')'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(h.x, h.y, R + 10 + i * 16 + Math.sin(time * 2 + i) * 3, time * (1 + i) + i, time * (1 + i) + i + 4); ctx.stroke();
        }
        const g = ctx.createRadialGradient(h.x, h.y, 2, h.x, h.y, R + 14);
        g.addColorStop(0, '#000'); g.addColorStop(0.65, '#000'); g.addColorStop(1, 'rgba(120,40,200,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(h.x, h.y, R + 14, 0, 6.283); ctx.fill();
        ctx.strokeStyle = '#b57bff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(h.x, h.y, R, 0, 6.283); ctx.stroke();
      }
      ctx.fillStyle = '#ffd166';
      for (const st of stars) {
        const fade = st.t > st.life - 2 ? (Math.floor(st.t * 8) % 2 ? 0.3 : 1) : 1;
        ctx.globalAlpha = fade; ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 12;
        star(st.x, st.y, 12 + Math.sin(time * 4 + st.x) * 1.5, time);
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      for (const t of trail) { ctx.globalAlpha = t.t; ctx.fillStyle = '#7df9ff'; ctx.beginPath(); ctx.arc(t.x, t.y, 4 * t.t * 2, 0, 6.283); ctx.fill(); }
      ctx.globalAlpha = 1;
      if (!over) {
        ctx.shadowColor = '#7df9ff'; ctx.shadowBlur = 14;
        ctx.fillStyle = '#e8fdff'; ctx.beginPath(); ctx.arc(s.x, s.y, 7, 0, 6.283); ctx.fill();
        ctx.shadowBlur = 0;
        if (dragging) { ctx.strokeStyle = 'rgba(125,249,255,0.3)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tgt.x, tgt.y); ctx.stroke(); ctx.setLineDash([]); }
      }
      for (const f of fx) { ctx.globalAlpha = Math.min(1, f.t * 2); ctx.fillStyle = f.c; ctx.fillRect(f.x, f.y, 4, 4); }
      ctx.globalAlpha = 1;
      ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      for (const t of texts) { ctx.globalAlpha = Math.min(1, t.t * 2); ctx.fillText(t.s, t.x, t.y); }
      ctx.globalAlpha = 1;
      // tijd
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(10, 10, W - 20, 8);
      ctx.fillStyle = left < 6 ? '#ff6b6b' : '#ffd166'; ctx.fillRect(10, 10, (W - 20) * left / 30, 8);
      if (combo > 1) { ctx.fillStyle = '#ffd166'; ctx.textAlign = 'left'; ctx.fillText('x' + combo, 12, 38); }
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
