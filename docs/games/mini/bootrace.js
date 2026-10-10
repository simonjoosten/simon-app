export default {
  id: 'bootrace', name: 'Bootrace', emoji: '🚤', hint: 'Sleep om te sturen, houd ⚡ ingedrukt voor boost',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#1a6aa8';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    let dead = false, raf = 0, last = 0, ended = false, endT = 0;
    const BY = H * 0.74;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const ph = [rnd(0, 6), rnd(0, 6)];
    let dist = 0, t = 0, speed = 170, bx = W / 2, bvx = 0, tilt = 0, lives = 3, boost = 30, boostOn = false, hitT = 0, score = 0, gates = 0, shake = 0;
    function river(d) {
      const lv = Math.min(1, d / 9000);
      const hw = Math.max(62, 120 - lv * 50);
      const amp = W * (0.2 + lv * 0.12);
      let c = W / 2 + Math.sin(d * 0.0034 + ph[0]) * amp + Math.sin(d * 0.0089 + ph[1]) * amp * 0.4;
      c = Math.max(hw + 12, Math.min(W - hw - 12, c));
      return [c, hw];
    }
    const rocks = [], pick = [], gatesL = [];
    let nextRock = 600, nextPick = 450, nextGate = 900;
    function gen() {
      const lim = dist + H + 100;
      while (nextRock < lim) {
        const [c, hw] = river(nextRock);
        const n = 1 + (Math.random() < Math.min(0.5, nextRock / 12000) ? 1 : 0);
        let used = -9;
        for (let i = 0; i < n; i++) {
          const x = c + rnd(-hw * 0.7, hw * 0.7);
          if (Math.abs(x - used) < 70) continue; used = x;
          rocks.push({ d: nextRock + i * 10, x, r: rnd(13, 20) , k: Math.floor(rnd(0, 3))});
        }
        nextRock += Math.max(120, rnd(150, 260) - nextRock * 0.006);
      }
      while (nextPick < lim) { const [c, hw] = river(nextPick); pick.push({ d: nextPick, x: c + rnd(-hw * 0.6, hw * 0.6), got: false }); nextPick += rnd(500, 900); }
      while (nextGate < lim) { const [c, hw] = river(nextGate); const gx = c + rnd(-hw * 0.4, hw * 0.4); gatesL.push({ d: nextGate, x: gx, w: 64, done: false }); nextGate += rnd(700, 1100); }
    }
    const ptrs = new Map(), keys = {};
    const btn = { x: W - 50, y: H - 56, r: 34 };
    let tx = river(0)[0]; bx = tx;
    const toXY = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
    const pd = e => { const [x, y] = toXY(e); if (Math.hypot(x - btn.x, y - btn.y) < btn.r + 14) ptrs.set(e.pointerId, { b: true }); else ptrs.set(e.pointerId, { x0: x, t0: tx }); try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const pm = e => { const p = ptrs.get(e.pointerId); if (p && !p.b) { const [x] = toXY(e); tx = p.t0 + (x - p.x0) * 1.4; } };
    const pu = e => ptrs.delete(e.pointerId);
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm);
    host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pu);
    const kd = e => { keys[e.key] = true; if (e.key === ' ') e.preventDefault(); }, ku = e => { keys[e.key] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    api.score(0);
    const wake = [];
    const sy = d => BY - (d - dist);
    function hurt(msg) {
      if (hitT > 0) return;
      lives--; hitT = 1.4; shake = 1; speed *= 0.5;
      if (lives <= 0) { ended = true; endT = 0; }
    }
    function update(dt) {
      t += dt;
      boostOn = (!!keys[' '] || [...ptrs.values()].some(p => p.b)) && boost > 0;
      if (boostOn) boost = Math.max(0, boost - 30 * dt);
      const maxV = (200 + Math.min(t * 3.2, 140)) * (boostOn ? 1.5 : 1);
      speed += (maxV - speed) * Math.min(1, dt * (boostOn ? 3 : 0.9));
      dist += speed * dt;
      if (keys.ArrowLeft || keys.a) tx -= 420 * dt;
      if (keys.ArrowRight || keys.d) tx += 420 * dt;
      tx = Math.max(10, Math.min(W - 10, tx));
      const old = bx;
      bx += (tx - bx) * Math.min(1, dt * 7);
      bvx = (bx - old) / dt;
      tilt += (Math.max(-0.5, Math.min(0.5, bvx / 300)) - tilt) * Math.min(1, dt * 10);
      if (hitT > 0) hitT -= dt;
      shake = Math.max(0, shake - dt * 3);
      gen();
      const [c, hw] = river(dist);
      if (bx < c - hw + 12 || bx > c + hw - 12) {
        if (hitT <= 0) { hurt(); }
        bx = Math.max(c - hw + 14, Math.min(c + hw - 14, bx)); tx = bx;
      }
      for (const r of rocks) if (!r.hit && Math.abs(r.d - dist) < r.r + 14 && Math.hypot(r.x - bx, r.d - dist) < r.r + 11) { r.hit = true; hurt(); }
      for (const p of pick) if (!p.got && Math.hypot(p.x - bx, p.d - dist) < 26) { p.got = true; boost = Math.min(100, boost + 35); }
      for (const g of gatesL) if (!g.done && g.d <= dist) { g.done = true; if (Math.abs(bx - g.x) < g.w / 2) { gates++; boost = Math.min(100, boost + 10); } }
      while (rocks.length && rocks[0].d < dist - 100) rocks.shift();
      while (pick.length && pick[0].d < dist - 100) pick.shift();
      while (gatesL.length && gatesL[0].d < dist - 100) gatesL.shift();
      wake.push({ x: bx, y: BY + 22, l: 1 });
      for (let i = wake.length - 1; i >= 0; i--) { wake[i].l -= dt * 1.6; wake[i].y += speed * dt; if (wake[i].l <= 0) wake.splice(i, 1); }
      score = Math.floor(dist / 8) + gates * 75;
      api.score(score);
    }
    function boat(x, y, a) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = '#f2f2f2'; ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(15, -8, 13, 26); ctx.lineTo(-13, 26); ctx.quadraticCurveTo(-15, -8, 0, -30); ctx.fill();
      ctx.fillStyle = '#e8453c'; ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(8, -18, 9, -8); ctx.lineTo(-9, -8); ctx.quadraticCurveTo(-8, -18, 0, -30); ctx.fill();
      ctx.fillStyle = '#2a4a7a'; ctx.beginPath(); ctx.ellipse(0, 4, 7, 9, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffd7b0'; ctx.beginPath(); ctx.arc(0, 2, 4, 0, 7); ctx.fill();
      ctx.fillStyle = '#333'; ctx.fillRect(-5, 24, 10, 6);
      if (boostOn) { ctx.fillStyle = '#ffb020'; ctx.beginPath(); ctx.moveTo(-5, 30); ctx.lineTo(0, 30 + 16 + Math.random() * 14); ctx.lineTo(5, 30); ctx.fill(); }
      ctx.restore();
    }
    function draw() {
      ctx.save();
      if (shake) ctx.translate((Math.random() - 0.5) * 8 * shake, (Math.random() - 0.5) * 8 * shake);
      ctx.fillStyle = '#c9b27a'; ctx.fillRect(-10, -10, W + 20, H + 20);
      // banks + water by rows
      const STEP = 8;
      ctx.fillStyle = '#3a9c4a';
      for (let y = -STEP; y < H + STEP; y += STEP) {
        const [c, hw] = river(dist + (BY - y));
        ctx.fillRect(0, y, c - hw - 14, STEP + 1); ctx.fillRect(c + hw + 14, y, W - (c + hw + 14), STEP + 1);
      }
      for (let y = -STEP; y < H + STEP; y += STEP) {
        const [c, hw] = river(dist + (BY - y));
        const g = Math.floor((dist + BY - y) / 40) % 2;
        ctx.fillStyle = g ? '#2a86c8' : '#2f8fd0'; ctx.fillRect(c - hw, y, hw * 2, STEP + 1);
        ctx.fillStyle = '#e7d9a5'; ctx.fillRect(c - hw - 14, y, 14, STEP + 1); ctx.fillRect(c + hw, y, 14, STEP + 1);
      }
      // waves
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2;
      for (let y = 0; y < H; y += 46) {
        const d = dist + (BY - y), [c, hw] = river(d); const off = ((d * 1.0) % 46);
        const yy = y + off - 23;
        const [c2, hw2] = river(dist + (BY - yy));
        ctx.beginPath(); ctx.moveTo(c2 - hw2 * 0.5, yy); ctx.quadraticCurveTo(c2 - hw2 * 0.4, yy - 5, c2 - hw2 * 0.3, yy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(c2 + hw2 * 0.3, yy + 20); ctx.quadraticCurveTo(c2 + hw2 * 0.4, yy + 15, c2 + hw2 * 0.5, yy + 20); ctx.stroke();
      }
      // trees on banks
      ctx.font = '26px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const k0 = Math.floor((dist - (H - BY)) / 70);
      for (let k = k0; k < k0 + H / 70 + 3; k++) {
        const d = k * 70 + 35, y = sy(d); if (y < -30 || y > H + 30) continue;
        const [c, hw] = river(d);
        const h = (k * 2654435761 >>> 0) % 100;
        if (c - hw - 40 > 14) ctx.fillText(h % 3 ? '🌲' : '🌴', Math.max(16, c - hw - 40 - (h % 30)), y);
        if (c + hw + 40 < W - 14) ctx.fillText(h % 2 ? '🌲' : '🌳', Math.min(W - 16, c + hw + 40 + (h % 30)), y);
      }
      // gates
      for (const g of gatesL) {
        const y = sy(g.d); if (y < -20 || y > H + 20) continue;
        ctx.fillStyle = g.done ? 'rgba(255,255,255,.4)' : '#ff3b30'; ctx.beginPath(); ctx.arc(g.x - g.w / 2, y, 8, 0, 7); ctx.fill();
        ctx.fillStyle = g.done ? 'rgba(255,255,255,.4)' : '#2fd45a'; ctx.beginPath(); ctx.arc(g.x + g.w / 2, y, 8, 0, 7); ctx.fill();
      }
      for (const p of wake) { ctx.globalAlpha = Math.max(0, p.l) * 0.5; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x + (1 - p.l) * (p.x < W / 2 ? -1 : 1) * 0, p.y, 4 + (1 - p.l) * 10, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
      for (const r of rocks) {
        const y = sy(r.d); if (y < -30 || y > H + 30 || r.hit) continue;
        ctx.fillStyle = '#5b5b6b'; ctx.beginPath(); ctx.ellipse(r.x, y, r.r, r.r * 0.85, 0.3 * r.k, 0, 7); ctx.fill();
        ctx.fillStyle = '#8a8a9c'; ctx.beginPath(); ctx.ellipse(r.x - r.r * 0.25, y - r.r * 0.25, r.r * 0.5, r.r * 0.35, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(r.x, y + 3, r.r + 5, r.r * 0.9, 0, 0.3, 2.8); ctx.stroke();
      }
      ctx.font = '26px serif';
      for (const p of pick) { const y = sy(p.d); if (!p.got && y > -30 && y < H + 30) ctx.fillText('⚡', p.x, y + Math.sin(t * 5 + p.d) * 3); }
      if (!(hitT > 0 && Math.floor(t * 14) % 2)) boat(bx, BY, tilt);
      ctx.restore();
      // HUD
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(8, 8, 100, 26); ctx.fillRect(W - 98, 8, 90, 26);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(speed * 0.2) + ' knopen', 14, 21);
      ctx.font = '16px serif'; ctx.fillText('❤️'.repeat(Math.max(0, lives)), W - 92, 22);
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(10, H - 30, 150, 14);
      ctx.fillStyle = boostOn ? '#ffd23f' : '#00e0ff'; ctx.fillRect(12, H - 28, 146 * boost / 100, 10);
      ctx.beginPath(); ctx.arc(btn.x, btn.y, btn.r, 0, 7); ctx.fillStyle = boostOn ? '#ffb020' : 'rgba(255,255,255,.3)'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.font = '28px serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('⚡', btn.x, btn.y + 1);
      if (ended) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.font = 'bold 32px sans-serif'; ctx.fillText('Schipbreuk!', W / 2, H / 2); }
    }
    function frame(ts) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.max(0.001, Math.min((ts - (last || ts)) / 1000, 0.05)); last = ts;
      if (!ended) update(dt);
      else { endT += dt; if (endT > 1 && endT < 50) { endT = 99; api.end(score); } }
      draw();
    }
    raf = requestAnimationFrame(frame);
    return { destroy() {
      dead = true; cancelAnimationFrame(raf);
      host.removeEventListener('pointerdown', pd); host.removeEventListener('pointermove', pm);
      host.removeEventListener('pointerup', pu); host.removeEventListener('pointercancel', pu);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      cv.remove();
    } };
  },
};
