export default {
  id: 'ruimtekoers', name: 'Ruimtekoers', emoji: '🚀', hint: 'Sleep om te sturen: ontwijk asteroïden, vlieg door boost-ringen',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#05060f';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    let dead = false, raf = 0, last = 0, ended = false, endT = 0;
    const CX = W / 2, CY = H * 0.6, FOC = 220, MAXZ = 1800, BX = 230, BY = 250;
    const rnd = (a, b) => a + Math.random() * (b - a);
    let z = 0, speed = 380, boostT = 0, t = 0, px = 0, py = 0, tx = 0, ty = 0, bankX = 0, hull = 3, inv = 0, rings = 0, combo = 0, score = 0, pop = '', popT = 0, shake = 0, flash = 0;
    const objs = [];
    let nextZ = 700;
    function gen() {
      while (nextZ < z + MAXZ + 100) {
        const lv = Math.min(1, nextZ / 60000);
        const n = 1 + Math.floor(lv * 3 + Math.random() * 2);
        for (let i = 0; i < n; i++) {
          const r = rnd(28, 70);
          objs.push({ t: 'a', x: rnd(-BX, BX), y: rnd(-BY * 0.7, BY * 0.7), z: nextZ + rnd(0, 60), r, rot: rnd(0, 6), vr: rnd(-1, 1), hue: Math.floor(rnd(0, 3)) });
        }
        if (Math.random() < 0.28) {
          const x = rnd(-170, 170), y = rnd(-200, 200);
          // clear asteroids near the ring
          for (let k = objs.length - 1; k >= 0; k--) { const o = objs[k]; if (o.t === 'a' && Math.abs(o.z - nextZ) < 100 && Math.hypot(o.x - x, o.y - y) < 120) objs.splice(k, 1); }
          objs.push({ t: 'r', x, y, z: nextZ + 40, r: 62, done: false, ok: false });
        }
        nextZ += Math.max(110, 190 - lv * 60);
      }
    }
    const ptrs = new Map(), keys = {};
    const pd = e => { const r = cv.getBoundingClientRect(); ptrs.set(e.pointerId, { x0: (e.clientX - r.left) * W / r.width, y0: (e.clientY - r.top) * H / r.height, tx, ty }); try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const pm = e => { const p = ptrs.get(e.pointerId); if (p) { const r = cv.getBoundingClientRect(); tx = p.tx + ((e.clientX - r.left) * W / r.width - p.x0) * 1.6; ty = p.ty + ((e.clientY - r.top) * H / r.height - p.y0) * 1.3; } };
    const pu = e => ptrs.delete(e.pointerId);
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm);
    host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pu);
    const kd = e => { keys[e.key] = true; if (e.key.startsWith('Arrow')) e.preventDefault(); }, ku = e => { keys[e.key] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    api.score(0);
    const stars = Array.from({ length: 90 }, () => ({ x: rnd(-600, 600), y: rnd(-700, 700), z: rnd(20, 1400) }));
    const say = s => { pop = s; popT = 1; };
    const sc = dz => FOC / (FOC + dz);
    function update(dt) {
      t += dt;
      boostT = Math.max(0, boostT - dt);
      const base = 380 + Math.min(t * 6, 300);
      const target = base * (boostT > 0 ? 1.7 : 1);
      speed += (target - speed) * Math.min(1, dt * 2.5);
      z += speed * dt;
      if (keys.ArrowLeft || keys.a) tx -= 380 * dt;
      if (keys.ArrowRight || keys.d) tx += 380 * dt;
      if (keys.ArrowUp || keys.w) ty -= 330 * dt;
      if (keys.ArrowDown || keys.s) ty += 330 * dt;
      tx = Math.max(-BX, Math.min(BX, tx)); ty = Math.max(-BY, Math.min(BY, ty));
      const ox = px;
      px += (tx - px) * Math.min(1, dt * 7); py += (ty - py) * Math.min(1, dt * 7);
      bankX += (Math.max(-1, Math.min(1, (px - ox) / dt / 250)) - bankX) * Math.min(1, dt * 8);
      if (inv > 0) inv -= dt;
      shake = Math.max(0, shake - dt * 3); flash = Math.max(0, flash - dt * 2);
      if (popT > 0) popT -= dt;
      gen();
      for (const o of objs) {
        const dz = o.z - z;
        if (o.t === 'r') {
          if (!o.done && dz <= 0) {
            o.done = true;
            if (Math.hypot(px - o.x, py - o.y) < o.r - 4) { o.ok = true; rings++; combo++; boostT = 2.2; flash = 0.6; score += 150 * Math.min(combo, 8); say('Boost!' + (combo > 1 ? ' x' + combo : '')); }
            else { combo = 0; say('Gemist'); }
          }
        } else {
          o.rot += o.vr * dt;
          if (!o.hit && inv <= 0 && dz < o.r * 0.5 + 8 && dz > -o.r * 0.5 - 8 && Math.hypot(px - o.x, py - o.y) < o.r + 12) {
            o.hit = true; hull--; inv = 1.6; shake = 1; combo = 0; speed *= 0.6; say('Raak!');
            if (hull <= 0) { ended = true; endT = 0; }
          }
        }
      }
      while (objs.length && objs[0].z < z - 100) objs.shift();
      for (const s of stars) { if (s.z < z + 20) { s.z += 1400; s.x = rnd(-600, 600); s.y = rnd(-700, 700); } }
      api.score(Math.floor(z / 30) + score);
    }
    function asteroid(o) {
      const dz = o.z - z; if (dz < -o.r * 0.5 || dz > MAXZ) return;
      const s = sc(Math.max(dz, 0)), x = CX + (o.x - px) * s, y = CY + (o.y - py) * s, r = o.r * s;
      if (x < -r - 10 || x > W + r + 10 || y < -r - 10 || y > H + r + 10) return;
      const fog = Math.min(0.85, dz / MAXZ);
      const pal = [['#8c7b6a', '#5a4a3c'], ['#7d8394', '#4a5062'], ['#9a7a5a', '#5f4630']][o.hue];
      const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
      g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]);
      ctx.globalAlpha = 1 - fog;
      ctx.fillStyle = g; ctx.beginPath();
      const n = 9;
      for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2 + o.rot, rr = r * (0.88 + 0.12 * Math.sin(i * 2.3 + o.x)); const xx = x + Math.cos(a) * rr, yy = y + Math.sin(a) * rr; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      for (let i = 0; i < 3; i++) { const a = o.rot + i * 2.1; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.4, y + Math.sin(a) * r * 0.35, r * (0.12 + i * 0.04), 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    function ring(o) {
      const dz = o.z - z; if (dz < -60 || dz > MAXZ) return;
      const s = sc(Math.max(dz, -60)), x = CX + (o.x - px) * s, y = CY + (o.y - py) * s, r = o.r * s;
      ctx.globalAlpha = o.done ? Math.max(0, 0.7 + dz / 100) : 1 - Math.min(0.7, dz / MAXZ);
      ctx.lineWidth = Math.max(2, 10 * s);
      ctx.strokeStyle = o.done ? (o.ok ? '#6bff9b' : '#777') : '#37e0ff';
      ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
      ctx.shadowBlur = 0;
      if (!o.done) { ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, 2.5 * s); ctx.setLineDash([8 * s + 1, 10 * s + 1]); ctx.beginPath(); ctx.arc(x, y, r * 0.8, t * 2, t * 2 + 7); ctx.stroke(); ctx.setLineDash([]); }
      ctx.globalAlpha = 1;
    }
    function draw() {
      ctx.save();
      if (shake) ctx.translate((Math.random() - 0.5) * 12 * shake, (Math.random() - 0.5) * 12 * shake);
      const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#05060f'); bg.addColorStop(1, '#16123a');
      ctx.fillStyle = bg; ctx.fillRect(-20, -20, W + 40, H + 40);
      // planet
      const pxp = W * 0.78 - px * 0.05, pyp = H * 0.2 - py * 0.05;
      const pg = ctx.createRadialGradient(pxp - 14, pyp - 14, 6, pxp, pyp, 60); pg.addColorStop(0, '#ff9a5a'); pg.addColorStop(1, '#6a2a5a');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(pxp, pyp, 52, 0, 7); ctx.fill();
      // stars as streaks
      ctx.lineCap = 'round';
      for (const s of stars) {
        const dz = s.z - z; if (dz < 5) continue;
        const a = sc(dz), b = sc(dz + speed * 0.045);
        const x1 = CX + (s.x - px) * a, y1 = CY + (s.y - py) * a, x2 = CX + (s.x - px) * b, y2 = CY + (s.y - py) * b;
        ctx.strokeStyle = 'rgba(255,255,255,' + Math.min(1, 0.25 + a * 1.4) + ')'; ctx.lineWidth = Math.max(0.8, a * 2.5);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      const list = objs.slice().sort((a, b) => b.z - a.z);
      for (const o of list) if (o.t === 'a') asteroid(o); else ring(o);
      // ship (px,py relative: ship drawn at screen position of its own pos)
      if (!ended) {
        const sx = CX, sy = CY;
        if (!(inv > 0 && Math.floor(t * 14) % 2)) {
          ctx.save(); ctx.translate(sx, sy); ctx.rotate(bankX * 0.5);
          if (boostT > 0 || true) { const fl = (boostT > 0 ? 36 : 16) + Math.random() * 10; ctx.fillStyle = boostT > 0 ? '#7ff' : '#ffb020'; ctx.beginPath(); ctx.moveTo(-7, 14); ctx.lineTo(0, 14 + fl); ctx.lineTo(7, 14); ctx.fill(); }
          ctx.fillStyle = '#d7dbe8'; ctx.beginPath(); ctx.moveTo(0, -28); ctx.lineTo(10, 6); ctx.lineTo(8, 16); ctx.lineTo(-8, 16); ctx.lineTo(-10, 6); ctx.fill();
          ctx.fillStyle = '#e8453c'; ctx.beginPath(); ctx.moveTo(10, 2); ctx.lineTo(30, 18); ctx.lineTo(10, 14); ctx.fill(); ctx.beginPath(); ctx.moveTo(-10, 2); ctx.lineTo(-30, 18); ctx.lineTo(-10, 14); ctx.fill();
          ctx.fillStyle = '#4cc3ff'; ctx.beginPath(); ctx.ellipse(0, -6, 4, 9, 0, 0, 7); ctx.fill();
          ctx.restore();
        }
      }
      ctx.restore();
      if (flash > 0) { ctx.fillStyle = 'rgba(120,230,255,' + flash * 0.35 + ')'; ctx.fillRect(0, 0, W, H); }
      // HUD
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(8, 8, 128, 28); ctx.fillRect(W - 98, 8, 90, 28);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('Ringen ' + rings + '  x' + Math.max(1, combo), 14, 22);
      ctx.font = '16px serif'; ctx.fillText('🛡️'.repeat(Math.max(0, hull)), W - 92, 23);
      ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#9fe'; ctx.fillText(Math.round(speed * 10) + ' km/s', W / 2, H - 16);
      if (popT > 0) { ctx.globalAlpha = Math.min(1, popT * 2); ctx.font = 'bold 26px sans-serif'; ctx.fillStyle = '#7ff'; ctx.fillText(pop, W / 2, 90); ctx.globalAlpha = 1; }
      if (ended) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.font = 'bold 32px sans-serif'; ctx.fillText('Schip vernield!', W / 2, H / 2); }
    }
    function frame(ts) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.max(0.001, Math.min((ts - (last || ts)) / 1000, 0.05)); last = ts;
      if (!ended) update(dt);
      else { endT += dt; if (endT > 1.1 && endT < 50) { endT = 99; api.end(Math.floor(z / 30) + score); } }
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
