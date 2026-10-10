export default {
  id: 'slingeraap', name: 'Slingeraap', emoji: '🐒', hint: 'Tik om los te laten, tik weer om de volgende liaan te grijpen',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#2d6a4f';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let dead = false, over = false, raf = 0, last = 0, score = 0;
    const G = 1500, HY = 40, WATER = H * 0.8;
    let vines = [], bananas = [], mode = 'rope', ri = 0, th = -0.6, om = 0, rl = 200, px = 0, py = 0, vx = 0, vy = 0;
    let grabT = 0, cd = 0, camX = 0, maxX = 0, nb = 0, dist = 0, msg = '', msgT = 0, lastV = 0, seed = 11;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    function addVine() {
      const l = vines[vines.length - 1];
      const sp = 105 + Math.min(85, (l ? l.x : 0) / 70) + rnd() * 30, L = 150 + rnd() * 100;
      const x = l ? l.x + sp : 70 + 0.57 * L;
      vines.push({ x, L, hy: HY + rnd() * 14 });
      if (l && rnd() < 0.85) {
        const n = 1 + Math.floor(rnd() * 3), my = 150 + rnd() * 120;
        for (let i = 0; i < n; i++) bananas.push({ x: l.x + sp * (0.35 + 0.3 * (n === 1 ? 0.5 : i / (n - 1))), y: my + Math.sin(i * 1.2) * 20, got: false });
      }
    }
    for (let i = 0; i < 6; i++) addVine();
    rl = vines[0].L; ri = 0;

    function say(s) { msg = s; msgT = 1; }
    function act() {
      if (over) return;
      if (mode === 'rope') {
        const v = vines[ri];
        px = v.x + Math.sin(th) * rl; py = v.hy + Math.cos(th) * rl;
        vx = Math.cos(th) * om * rl; vy = -Math.sin(th) * om * rl;
        mode = 'fly'; cd = 0.3; lastV = ri; grabT = 0;
      } else if (mode === 'fly') grabT = 0.4;
    }
    const down = e => { if (e.preventDefault) e.preventDefault(); act(); };
    const kd = e => { if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 'Enter') { act(); e.preventDefault(); } };
    host.addEventListener('pointerdown', down); window.addEventListener('keydown', kd);

    function finish() { if (over) return; over = true; api.end(score + dist); }
    function step(dt) {
      if (over) return;
      if (msgT > 0) msgT -= dt; if (cd > 0) cd -= dt;
      while (vines[vines.length - 1].x < camX + W * 2) addVine();
      let cx, cy;
      if (mode === 'rope') {
        const v = vines[ri];
        om += (-(G / rl) * Math.sin(th)) * dt;
        if (Math.abs(th) < 1.1) om += Math.sign(om || 1) * 0.7 * dt;
        th += om * dt;
        if (th > 1.3) { th = 1.3; om = Math.min(om, 0); } if (th < -1.3) { th = -1.3; om = Math.max(om, 0); }
        cx = v.x + Math.sin(th) * rl; cy = v.hy + Math.cos(th) * rl;
      } else {
        grabT -= dt;
        vy += G * dt; px += vx * dt; py += vy * dt; cx = px; cy = py;
        if (grabT > 0) {
          let best = -1, bd = 40;
          for (let i = 0; i < vines.length; i++) {
            const v = vines[i]; if (i === lastV && cd > 0) continue;
            if (py < v.hy + 30 || py > v.hy + v.L + 10) continue;
            const d = Math.abs(px - v.x); if (d < bd) { bd = d; best = i; }
          }
          if (best >= 0) {
            const v = vines[best], dx = px - v.x, dy = py - v.hy, L = Math.hypot(dx, dy);
            th = Math.atan2(dx, dy); rl = L; om = (vx * Math.cos(th) - vy * Math.sin(th)) / L;
            if (Math.abs(om) > 6.5) om = Math.sign(om) * 6.5;
            mode = 'rope'; ri = best; if (best > lastV) { score += 5; say('Mooi!'); } lastV = best;
          }
        }
        if (cy > WATER || cx < camX - 60) { finish(); return; }
      }
      for (const b of bananas) if (!b.got && Math.abs(b.x - cx) < 24 && Math.abs(b.y - cy) < 24) { b.got = true; nb++; score += 10; }
      if (cx > maxX) maxX = cx;
      dist = Math.floor(maxX / 20);
      api.score(score + dist);
      camX += (Math.max(0, cx - W * 0.35) - camX) * Math.min(1, dt * 4);
      bananas = bananas.filter(b => b.x > camX - 100);
      while (vines.length > 3 && vines[1].x < camX - 120 && ri > 1) { vines.shift(); ri--; lastV = Math.max(0, lastV - 1); }
    }
    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1b4332'); g.addColorStop(1, '#74c69d');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(-camX, 0);
      ctx.fillStyle = '#40916c'; ctx.fillRect(camX, 0, W, 30);
      ctx.strokeStyle = '#95d5b2'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < vines.length; i++) {
        const v = vines[i]; ctx.beginPath(); ctx.moveTo(v.x, v.hy);
        if (mode === 'rope' && ri === i) ctx.lineTo(v.x + Math.sin(th) * rl, v.hy + Math.cos(th) * rl); else ctx.lineTo(v.x, v.hy + v.L);
        ctx.stroke();
      }
      ctx.fillStyle = '#0077b6'; ctx.fillRect(camX, WATER, W, H - WATER);
      ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
      for (const b of bananas) if (!b.got) ctx.fillText('🍌', b.x, b.y);
      let mx, my;
      if (mode === 'rope') { const v = vines[ri]; mx = v.x + Math.sin(th) * rl; my = v.hy + Math.cos(th) * rl; } else { mx = px; my = py; }
      ctx.font = '34px sans-serif'; ctx.fillText('🐒', mx, my);
      ctx.restore();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      ctx.fillText('🍌 ' + nb, 10, 40); ctx.textAlign = 'right'; ctx.fillText(dist + ' m', W - 10, 40);
      if (mode === 'rope' && dist < 5) { ctx.textAlign = 'center'; ctx.fillText('Tik = loslaten, tik in de lucht = grijpen', W / 2, H * 0.88); }
      if (msgT > 0) { ctx.textAlign = 'center'; ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#ffe66d'; ctx.fillText(msg, W / 2, H * 0.22); }
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
        host.removeEventListener('pointerdown', down); window.removeEventListener('keydown', kd);
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      },
    };
  },
};
