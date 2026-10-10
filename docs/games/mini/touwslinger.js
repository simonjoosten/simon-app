export default {
  id: 'touwslinger', name: 'Touwslinger', emoji: '🪢', hint: 'Tik om los te laten: zwaai van touw naar touw over de kloof',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#a8dadc';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let dead = false, over = false, raf = 0, last = 0, score = 0;
    const G = 1600, HY = 60, YP = H * 0.62, LEFT = 60;
    let level = 1, ropes = [], endX = 0, lives = 3, mode = 'rope', ri = 0, th = -0.7, om = 0, rl = 200;
    let px = 0, py = 0, vx = 0, vy = 0, cd = 0, camX = -40, lvT = 0, wait = 0, msg = '', msgT = 0, lastRope = 0, seed = 5;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    function build() {
      seed = level * 313 + 7; ropes = [];
      const n = Math.min(5, 1 + Math.floor((level + 1) / 2)), sp = Math.min(190, 120 + level * 8);
      for (let i = 0; i < n; i++) {
        const L = 170 + rnd() * 90;
        ropes.push({ x: i === 0 ? 30 + Math.sin(0.7) * L : ropes[i - 1].x + sp, L });
      }
      endX = ropes[n - 1].x + 125 + Math.min(40, level * 4);
      lvT = 0; lastRope = 0; attachStart(0);
    }
    function attachStart(i) { mode = 'rope'; ri = i; th = i === 0 ? -0.7 : -0.5; om = 0; rl = ropes[i].L; cd = 0.2; lastRope = i; }
    function say(s) { msg = s; msgT = 1.4; }
    build();

    function release() {
      if (over || mode !== 'rope') return;
      const h = ropes[ri];
      px = h.x + Math.sin(th) * rl; py = HY + Math.cos(th) * rl;
      vx = Math.cos(th) * om * rl; vy = -Math.sin(th) * om * rl;
      mode = 'fly'; cd = 0.4;
    }
    const down = e => { if (e.preventDefault) e.preventDefault(); release(); };
    const kd = e => { if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 'Enter') { release(); e.preventDefault(); } };
    host.addEventListener('pointerdown', down); window.addEventListener('keydown', kd);

    function fall() {
      lives--;
      if (lives <= 0) { over = true; api.end(score); return; }
      say('Au! Nog ' + lives + ' levens'); attachStart(lastRope);
    }
    function step(dt) {
      if (over) return;
      if (msgT > 0) msgT -= dt; if (cd > 0) cd -= dt;
      if (mode === 'rope') {
        lvT += dt;
        om += (-(G / rl) * Math.sin(th)) * dt;
        if (Math.abs(th) < 1.15) om += Math.sign(om || 1) * 0.9 * dt;
        om *= 1 - 0.02 * dt;
        th += om * dt;
        if (th > 1.35) { th = 1.35; om = Math.min(om, 0); } if (th < -1.35) { th = -1.35; om = Math.max(om, 0); }
      } else if (mode === 'fly') {
        lvT += dt;
        vy += G * dt; px += vx * dt; py += vy * dt;
        for (let i = 0; i < ropes.length; i++) {
          const r = ropes[i];
          if (cd > 0 && i === lastRope) continue;
          if (Math.abs(px - r.x) < 22 && py > HY + 50 && py < HY + r.L + 12) {
            const dx = px - r.x, dy = py - HY, L = Math.hypot(dx, dy);
            if (L < 60) continue;
            th = Math.atan2(dx, dy); rl = L; om = (vx * Math.cos(th) - vy * Math.sin(th)) / L;
            if (Math.abs(om) > 6) om = Math.sign(om) * 6;
            mode = 'rope'; ri = i; if (i !== lastRope) { score += 10; api.score(score); } lastRope = i; cd = 0.1;
            break;
          }
        }
        if (mode === 'fly') {
          if (py >= YP - 12 && vy > 0) {
            if (px >= endX) {
              const b = 100 * level + Math.max(0, Math.round(60 - lvT)) * 2; score += b; api.score(score);
              say('Gehaald! +' + b); mode = 'won'; wait = 1.6; vx = 0; vy = 0; py = YP - 12;
            } else if (px < LEFT) { say('Opnieuw proberen'); attachStart(0); }
            else if (py > YP + 60) fall();
          }
          if (mode === 'fly' && py > H + 40) fall();
        }
      } else if (mode === 'won') {
        wait -= dt; if (wait <= 0) { level++; build(); }
      }
      let cx = mode === 'rope' ? ropes[ri].x + Math.sin(th) * rl : px;
      camX += (Math.max(-40, Math.min(endX + 260 - W, cx - W * 0.4)) - camX) * Math.min(1, dt * 5);
    }
    function pos() { return mode === 'rope' ? { x: ropes[ri].x + Math.sin(th) * rl, y: HY + Math.cos(th) * rl } : { x: px, y: py }; }
    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#a8dadc'); g.addColorStop(1, '#f1faee');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(-camX, 0);
      ctx.fillStyle = '#3d2c1e'; ctx.fillRect(camX - 10, YP + 30, W + 20, H);
      ctx.fillStyle = '#7f5539'; ctx.fillRect(camX - 10, YP, LEFT - camX + 10, H);
      ctx.fillStyle = '#4c9a2a'; ctx.fillRect(camX - 10, YP, LEFT - camX + 10, 10);
      ctx.fillStyle = '#7f5539'; ctx.fillRect(endX, YP, 400, H); ctx.fillStyle = '#4c9a2a'; ctx.fillRect(endX, YP, 400, 10);
      ctx.fillStyle = '#e63946'; ctx.fillRect(endX + 40, YP - 40, 4, 40); ctx.fillRect(endX + 40, YP - 40, 26, 14);
      ctx.fillStyle = '#5a3d2b'; ctx.fillRect(camX - 10, HY - 12, W + 20, 12);
      ctx.strokeStyle = '#8d6e4b'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < ropes.length; i++) {
        const r = ropes[i]; ctx.beginPath(); ctx.moveTo(r.x, HY);
        if (mode === 'rope' && ri === i) ctx.lineTo(r.x + Math.sin(th) * rl, HY + Math.cos(th) * rl); else ctx.lineTo(r.x, HY + r.L);
        ctx.stroke(); ctx.fillStyle = '#444'; ctx.beginPath(); ctx.arc(r.x, HY, 6, 0, 7); ctx.fill();
      }
      const p = pos(); ctx.font = '30px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
      ctx.fillText('🤠', p.x, p.y);
      ctx.restore();
      ctx.fillStyle = '#222'; ctx.font = 'bold 16px sans-serif'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      ctx.fillText('Level ' + level + '  ' + '❤️'.repeat(Math.max(0, lives)), 10, 10);
      ctx.textAlign = 'right'; ctx.fillText(Math.round(lvT) + ' s', W - 10, 10);
      if (mode === 'rope' && lvT < 4 && level === 1) { ctx.textAlign = 'center'; ctx.fillStyle = '#1d3557'; ctx.fillText('Tik als je ver genoeg zwaait!', W / 2, H * 0.8); }
      if (msgT > 0) { ctx.textAlign = 'center'; ctx.font = 'bold 26px sans-serif'; ctx.fillStyle = '#d00000'; ctx.fillText(msg, W / 2, H * 0.25); }
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
