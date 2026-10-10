export default {
  id: 'fruitsnijder',
  name: 'Fruitsnijder',
  emoji: '🍉',
  hint: 'Veeg door het fruit, mijd de bommen',
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

    const FRUIT = ['🍉', '🍎', '🍊', '🍋', '🍓', '🍍', '🥝', '🍑', '🍇'];
    const G = 520, RAD = 30;
    let items = [], halves = [], trail = [], splashes = [], floats = [];
    let T = 0, score = 0, lives = 3, down = false, lx = 0, ly = 0, spawnT = 0.6;
    let swipeHits = 0, swipeT = 0;
    let ended = false, endTimer = 0, raf = 0, alive = true, last = performance.now(), bombFlash = 0;

    function launch() {
      const lvl = Math.min(1, T / 90);
      const bomb = Math.random() < 0.12 + lvl * 0.14;
      const x = 40 + Math.random() * (W - 80);
      const vy = -(Math.sqrt(2 * G * (H * (0.55 + Math.random() * 0.3))));
      const vx = (W / 2 - x) * (0.2 + Math.random() * 0.4);
      items.push({ x, y: H + RAD, vx, vy, bomb, e: bomb ? '💣' : FRUIT[Math.floor(Math.random() * FRUIT.length)], rot: 0, vr: (Math.random() - 0.5) * 6, cut: false, seen: false });
    }

    function finish() {
      if (ended) return;
      ended = true;
      endTimer = setTimeout(() => { api.end(Math.round(score)); }, 1000);
    }

    function segHit(it, x1, y1, x2, y2) {
      const dx = x2 - x1, dy = y2 - y1;
      const l2 = dx * dx + dy * dy;
      let t = l2 ? ((it.x - x1) * dx + (it.y - y1) * dy) / l2 : 0;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(it.x - (x1 + t * dx), it.y - (y1 + t * dy)) < RAD + 4;
    }

    function slice(it, x1, y1, x2, y2) {
      it.cut = true;
      if (it.bomb) {
        bombFlash = 1; lives = 0;
        for (let i = 0; i < 14; i++) splashes.push({ x: it.x, y: it.y, vx: (Math.random() - 0.5) * 400, vy: (Math.random() - 0.5) * 400, life: 0.7, c: '#ffb703' });
        finish();
        return;
      }
      const ang = Math.atan2(y2 - y1, x2 - x1);
      halves.push({ e: it.e, x: it.x, y: it.y, vx: it.vx + Math.cos(ang + 1.57) * 90, vy: it.vy * 0.3, rot: it.rot, vr: -3, side: 1, life: 1.2 });
      halves.push({ e: it.e, x: it.x, y: it.y, vx: it.vx - Math.cos(ang + 1.57) * 90, vy: it.vy * 0.3, rot: it.rot, vr: 3, side: -1, life: 1.2 });
      for (let i = 0; i < 6; i++) splashes.push({ x: it.x, y: it.y, vx: (Math.random() - 0.5) * 260, vy: (Math.random() - 0.5) * 260, life: 0.5, c: '#ff6b81' });
      swipeHits++; swipeT = T;
      score += 1;
      floats.push({ x: it.x, y: it.y, text: '+1', life: 0.6 });
      api.score(score);
    }

    function pt(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
    function onDown(e) { e.preventDefault(); const p = pt(e); down = true; lx = p.x; ly = p.y; trail = [{ x: p.x, y: p.y, t: T }]; swipeHits = 0; }
    function onMove(e) {
      if (!down || ended) return;
      const p = pt(e);
      for (const it of items) if (!it.cut && segHit(it, lx, ly, p.x, p.y)) slice(it, lx, ly, p.x, p.y);
      trail.push({ x: p.x, y: p.y, t: T });
      lx = p.x; ly = p.y;
    }
    function onUp() {
      down = false;
      if (swipeHits >= 3) {
        score += swipeHits * 2;
        floats.push({ x: lx, y: ly - 20, text: 'COMBO x' + swipeHits + '! +' + swipeHits * 2, life: 1.1, big: true });
        api.score(score);
      }
      swipeHits = 0;
    }
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    function update(dt) {
      T += dt;
      bombFlash = Math.max(0, bombFlash - dt * 2);
      if (!ended) {
        spawnT -= dt;
        if (spawnT <= 0) {
          const lvl = Math.min(1, T / 90);
          const n = Math.random() < 0.25 + lvl * 0.4 ? 2 + Math.floor(Math.random() * 2) : 1;
          for (let i = 0; i < n; i++) launch();
          spawnT = 1.25 - lvl * 0.7 + Math.random() * 0.4;
        }
      }
      for (const it of items) {
        it.vy += G * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.rot += it.vr * dt;
        if (it.y < H) it.seen = true;
      }
      for (const it of items) {
        if (!it.cut && it.seen && it.y > H + RAD && it.vy > 0) {
          it.cut = true;
          if (!it.bomb && !ended) {
            lives--;
            floats.push({ x: Math.max(30, Math.min(W - 30, it.x)), y: H - 30, text: 'MIS', life: 0.8 });
            if (lives <= 0) finish();
          }
        }
      }
      items = items.filter((it) => !(it.cut && (it.y > H + 60 || it.vy === 0)) && it.y < H + 120);
      for (const h of halves) { h.vy += G * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.rot += h.vr * dt; h.life -= dt; }
      halves = halves.filter((h) => h.life > 0 && h.y < H + 60);
      for (const s of splashes) { s.vy += 300 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; }
      splashes = splashes.filter((s) => s.life > 0);
      for (const f of floats) { f.life -= dt; f.y -= 40 * dt; }
      floats = floats.filter((f) => f.life > 0);
      trail = trail.filter((p) => T - p.t < 0.22);
    }

    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#5d3a1a'); g.addColorStop(1, '#2b1a0c');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let i = 0; i < 8; i++) ctx.fillRect(0, i * 90 + 10, W, 3);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '56px serif';
      for (const it of items) {
        if (it.cut) continue;
        ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.rot); ctx.fillText(it.e, 0, 0); ctx.restore();
      }
      for (const h of halves) {
        ctx.save(); ctx.globalAlpha = Math.min(1, h.life * 2);
        ctx.translate(h.x, h.y); ctx.rotate(h.rot);
        ctx.beginPath(); ctx.rect(h.side > 0 ? 0 : -40, -40, 40, 80); ctx.clip();
        ctx.fillText(h.e, 0, 0); ctx.restore();
      }
      for (const s of splashes) { ctx.globalAlpha = Math.max(0, s.life * 1.5); ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(s.x, s.y, 4, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
      if (trail.length > 1) {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (let i = 1; i < trail.length; i++) {
          const a = 1 - (T - trail[i].t) / 0.22;
          ctx.strokeStyle = 'rgba(255,255,255,' + Math.max(0, a) + ')'; ctx.lineWidth = 3 + 6 * a;
          ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke();
        }
      }
      for (const f of floats) {
        ctx.globalAlpha = Math.min(1, f.life * 2); ctx.fillStyle = f.big ? '#ffe066' : '#fff';
        ctx.font = 'bold ' + (f.big ? 24 : 18) + 'px sans-serif'; ctx.fillText(f.text, f.x, f.y); ctx.globalAlpha = 1;
      }
      ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
      ctx.fillText('🍉 ' + score, 12, 26);
      ctx.textAlign = 'right'; ctx.font = '20px serif';
      ctx.fillText('❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(Math.max(0, 3 - lives)), W - 12, 26);
      if (bombFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + bombFlash + ')'; ctx.fillRect(0, 0, W, H); }
      if (T < 2.5) { ctx.textAlign = 'center'; ctx.font = '16px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('Veeg door het fruit - niet door de bom!', W / 2, H - 30); }
    }

    function frame(now) {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      update(dt); draw();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return {
      destroy() {
        alive = false; cancelAnimationFrame(raf); clearTimeout(endTimer);
        cv.removeEventListener('pointerdown', onDown);
        cv.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        cv.remove();
      },
    };
  },
};
