export default {
  id: 'wippen', name: 'Wippen', emoji: '⚖️', hint: 'Tik waar je een gewicht wilt laten vallen: houd de wip in balans',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#fdf0d5';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let dead = false, over = false, raf = 0, last = 0, score = 0;
    const G = 900, PX = W / 2, PY = H * 0.62, LH = Math.min(W * 0.44, 170), I0 = 3 * LH * LH, MAXT = 0.5, BR = 9;
    let phi = 0, omg = 0, balls = [], weights = [], falling = [], lost = 0, time = 0, level = 1, spawnT = 1.5, cool = 0, aimX = PX, caught = 0, msg = '', msgT = 0;
    const MAXLOST = 3;

    const pt = e => { const b = cv.getBoundingClientRect(); return (e.clientX - b.left) * W / b.width; };
    function drop(x) {
      if (over || cool > 0) return;
      cool = 0.55; falling.push({ x, y: 40, vy: 0, kind: 'w', r: 14 });
    }
    const down = e => { aimX = pt(e); try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const move = e => { aimX = pt(e); };
    const up = e => { aimX = pt(e); drop(aimX); };
    const kd = e => {
      if (e.key === 'ArrowLeft') { aimX = Math.max(10, aimX - 25); e.preventDefault(); }
      if (e.key === 'ArrowRight') { aimX = Math.min(W - 10, aimX + 25); e.preventDefault(); }
      if (e.key === ' ' || e.key === 'ArrowDown') { drop(aimX); e.preventDefault(); }
    };
    host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move); host.addEventListener('pointerup', up);
    window.addEventListener('keydown', kd);

    function say(s) { msg = s; msgT = 1.3; }
    function spawnBall() {
      falling.push({ x: PX + (Math.random() - 0.5) * LH * 1.1, y: 30, vy: 0, kind: 'b', r: BR });
    }
    function step(dt) {
      if (over) return;
      time += dt; if (msgT > 0) msgT -= dt; if (cool > 0) cool -= dt;
      const nl = 1 + Math.floor(time / 15);
      if (nl > level) { level = nl; say('Niveau ' + level + '!'); }
      spawnT -= dt;
      if (spawnT <= 0) { spawnBall(); spawnT = Math.max(1.6, 5 - level * 0.6) + Math.random(); }
      // vallende dingen
      const cp = Math.cos(phi), sp = Math.sin(phi);
      for (const f of falling) {
        f.vy += G * dt; const py0 = f.y; f.y += f.vy * dt;
        const s = (f.x - PX) / cp, surf = PY + (f.x - PX) * Math.tan(phi) - 6 - f.r;
        if (Math.abs(s) <= LH && py0 <= surf + 4 && f.y >= surf) {
          f.done = true;
          if (f.kind === 'b') balls.push({ s, v: 0, life: 0 });
          else weights.push({ s, t: 9 });
          omg += (f.kind === 'w' ? 0.4 : 0.1) * Math.sign(s) * Math.min(1, Math.abs(s) / LH) * 0.3;
        } else if (f.y > H + 30) { f.done = true; if (f.kind === 'b') loseBall(); }
      }
      falling = falling.filter(f => !f.done);
      // wip
      let tq = 0, inertia = I0;
      for (const b of balls) { tq += G * b.s * cp; inertia += b.s * b.s; }
      for (const w of weights) { tq += 3 * G * w.s * cp; inertia += 3 * w.s * w.s; }
      omg += (tq / inertia - 1.8 * omg) * dt;
      phi += omg * dt;
      if (phi > MAXT) { phi = MAXT; omg = Math.min(0, omg * -0.2); } if (phi < -MAXT) { phi = -MAXT; omg = Math.max(0, omg * -0.2); }
      for (const w of weights) w.t -= dt; weights = weights.filter(w => w.t > 0);
      for (const b of balls) {
        b.life += dt;
        b.v += (5 / 7) * G * Math.sin(phi) * dt; b.v *= 1 - 0.6 * dt; b.s += b.v * dt;
        if (Math.abs(b.s) > LH) { b.off = true; falling.push({ x: PX + b.s * cp, y: PY + b.s * sp - BR, vy: 0, kind: 'x', r: BR, vx: b.v * cp }); loseBall(); }
      }
      balls = balls.filter(b => !b.off);
      for (const f of falling) if (f.kind === 'x') f.x += (f.vx || 0) * dt;
      score = Math.floor(time) * 5 + caught * 0;
      api.score(score);
    }
    function loseBall() {
      lost++; say('Bal eraf! ' + lost + '/' + MAXLOST);
      if (lost >= MAXLOST && !over) { over = true; api.end(score); }
    }
    function draw() {
      ctx.fillStyle = '#fdf0d5'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#669bbc'; ctx.fillRect(0, H - 40, W, 40);
      ctx.fillStyle = '#780000'; ctx.beginPath(); ctx.moveTo(PX, PY); ctx.lineTo(PX - 30, H - 40); ctx.lineTo(PX + 30, H - 40); ctx.closePath(); ctx.fill();
      const cp = Math.cos(phi), sp = Math.sin(phi);
      ctx.save(); ctx.translate(PX, PY); ctx.rotate(phi); ctx.fillStyle = '#c1121f'; ctx.fillRect(-LH, -6, 2 * LH, 12); ctx.restore();
      ctx.fillStyle = '#003049'; ctx.beginPath(); ctx.arc(PX, PY, 7, 0, 7); ctx.fill();
      ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const w of weights) { ctx.globalAlpha = Math.min(1, w.t); ctx.fillText('🧱', PX + w.s * cp + sp * 20, PY + w.s * sp - cp * 20); ctx.globalAlpha = 1; }
      for (const b of balls) {
        const x = PX + b.s * cp + sp * (6 + BR), y = PY + b.s * sp - cp * (6 + BR);
        ctx.fillStyle = '#2a9d8f'; ctx.beginPath(); ctx.arc(x, y, BR, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      }
      for (const f of falling) {
        if (f.kind === 'w') ctx.fillText('🧱', f.x, f.y);
        else { ctx.fillStyle = '#2a9d8f'; ctx.beginPath(); ctx.arc(f.x, f.y, BR, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
      }
      if (cool <= 0) { ctx.globalAlpha = 0.5; ctx.fillText('🧱', aimX, 40); ctx.globalAlpha = 1; }
      ctx.fillStyle = '#222'; ctx.font = 'bold 16px sans-serif'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      ctx.fillText('Niveau ' + level + '   ' + Math.floor(time) + ' s', 10, 6); ctx.textAlign = 'right';
      ctx.fillText('Kwijt: ' + lost + '/' + MAXLOST, W - 10, 6);
      if (msgT > 0) { ctx.textAlign = 'center'; ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = '#c1121f'; ctx.fillText(msg, W / 2, H * 0.22); }
    }
    function frame(t) {
      if (dead) return; raf = requestAnimationFrame(frame);
      const dt = Math.min(0.033, (t - (last || t)) / 1000); last = t;
      step(dt); draw();
    }
    raf = requestAnimationFrame(frame);
    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move); host.removeEventListener('pointerup', up);
        window.removeEventListener('keydown', kd);
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      },
    };
  },
};
