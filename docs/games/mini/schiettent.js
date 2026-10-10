export default {
  id: 'schiettent', name: 'Schiettent', emoji: '🎪', hint: 'Tik op de doelen! Raak de ster voor extra kogels, spaar de teddy',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#6a040f';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let dead = false, over = false, raf = 0, last = 0, score = 0;
    const ROWS = [H * 0.28, H * 0.43, H * 0.58], COUNTER = H * 0.74;
    const TYPES = {
      eend: { e: '🦆', r: 21, pts: 10 }, konijn: { e: '🐰', r: 16, pts: 25 }, ufo: { e: '🛸', r: 13, pts: 40 },
      ster: { e: '⭐', r: 15, pts: 100 }, teddy: { e: '🧸', r: 18, pts: -30 },
    };
    let round = 1, ammo = 0, timeLeft = 0, goal = 0, roundPts = 0, targets = [], flashes = [], spawnT = [0, 0, 0], combo = 0;
    let mode = 'play', wait = 0, outT = 0, cx = W / 2, cy = H * 0.4, msg = '', msgT = 0, time = 0, shotFlash = 0;

    function startRound() {
      targets = []; flashes = []; ammo = 12 + (round >> 1); timeLeft = 28; roundPts = 0; combo = 0;
      goal = 100 + 45 * (round - 1); spawnT = [0.2, 0.6, 1]; mode = 'play'; outT = 0;
      msg = 'Ronde ' + round + ': haal ' + goal + ' punten'; msgT = 2;
    }
    startRound();

    function spawn(row) {
      const dir = row % 2 === 0 ? 1 : -1;
      let t = 'eend';
      const r = Math.random();
      if (row === 1) t = r < 0.7 ? 'konijn' : 'eend';
      if (row === 2) t = r < 0.5 ? 'ufo' : 'eend';
      if (r > 0.9) t = 'ster'; else if (r > 0.8 && round >= 2) t = 'teddy';
      const sp = (60 + row * 35 + round * 12) * (0.85 + Math.random() * 0.4) * (t === 'ster' ? 1.5 : 1);
      const ty = TYPES[t];
      targets.push({ t, ...ty, x: dir > 0 ? -ty.r : W + ty.r, y: ROWS[row], y0: ROWS[row], vx: dir * sp, ph: Math.random() * 6, row });
    }
    function shoot(x, y) {
      if (over || mode !== 'play' || ammo <= 0) return;
      ammo--; shotFlash = 0.1;
      let hit = null;
      for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i];
        if (Math.hypot(t.x - x, t.y - y) <= t.r + 5) { hit = t; break; }
      }
      if (hit) {
        targets.splice(targets.indexOf(hit), 1);
        let p = hit.pts;
        if (p > 0) { combo = Math.min(3, combo + 1); p *= combo; } else combo = 0;
        if (hit.t === 'ster') { ammo += 3; timeLeft += 3; flashes.push({ x: hit.x, y: hit.y, s: '+3 kogels!', t: 1 }); }
        roundPts += p; score = Math.max(0, score + p); api.score(score);
        flashes.push({ x: hit.x, y: hit.y - 20, s: (p > 0 ? '+' : '') + p, t: 1 });
      } else { combo = 0; flashes.push({ x, y, s: '·', t: 0.4 }); }
    }
    const pt = e => { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height }; };
    const down = e => { const p = pt(e); cx = p.x; cy = Math.min(p.y, COUNTER - 10); shoot(cx, cy); };
    const move = e => { const p = pt(e); cx = p.x; cy = p.y; };
    const keys = {};
    const kd = e => {
      keys[e.key] = true;
      if (e.key === ' ' || e.key === 'Enter') { shoot(cx, cy); e.preventDefault(); }
      if (e.key.indexOf('Arrow') === 0) e.preventDefault();
    };
    const ku = e => { keys[e.key] = false; };
    host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move);
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

    function step(dt) {
      if (over) return;
      time += dt; if (msgT > 0) msgT -= dt; if (shotFlash > 0) shotFlash -= dt;
      const kx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), ky = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
      cx = Math.max(0, Math.min(W, cx + kx * 260 * dt)); cy = Math.max(0, Math.min(H, cy + ky * 260 * dt));
      for (const f of flashes) f.t -= dt * 1.2; flashes = flashes.filter(f => f.t > 0);
      if (mode === 'play') {
        timeLeft -= dt;
        for (let r = 0; r < 3; r++) {
          spawnT[r] -= dt;
          if (spawnT[r] <= 0) { spawn(r); spawnT[r] = Math.max(0.5, 1.5 - round * 0.08) + Math.random() * 0.9; }
        }
        for (const t of targets) { t.x += t.vx * dt; t.y = t.y0 + Math.sin(time * 3 + t.ph) * (t.t === 'ufo' ? 10 : 3); }
        targets = targets.filter(t => t.x > -40 && t.x < W + 40);
        if (ammo <= 0) outT += dt;
        if (timeLeft <= 0 || outT > 0.9) {
          mode = 'result'; wait = 2.2;
          if (roundPts >= goal) { const b = Math.max(0, ammo) * 20 + 100; score += b; api.score(score); msg = 'Gehaald! Bonus +' + b; }
          else msg = 'Te weinig punten: ' + roundPts + '/' + goal;
          msgT = 2.2;
        }
      } else if (mode === 'result') {
        wait -= dt;
        if (wait <= 0) {
          if (roundPts >= goal) { round++; startRound(); }
          else { over = true; api.end(score); }
        }
      }
    }
    function draw() {
      ctx.fillStyle = '#6a040f'; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#9d0208' : '#6a040f'; ctx.fillRect(i * W / 12, 0, W / 12, 40); }
      ctx.fillStyle = '#ffba08'; ctx.fillRect(0, 40, W, 6);
      for (let r = 0; r < 3; r++) { ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, ROWS[r] + 22, W, 6); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const t of targets) { ctx.font = (t.r * 2) + 'px sans-serif'; ctx.fillText(t.e, t.x, t.y + 2); }
      ctx.fillStyle = '#5c3d2e'; ctx.fillRect(0, COUNTER, W, H - COUNTER); ctx.fillStyle = '#8b5a2b'; ctx.fillRect(0, COUNTER, W, 10);
      // kogels
      ctx.font = '18px sans-serif'; ctx.textAlign = 'left';
      const shown = Math.min(ammo, 18); for (let i = 0; i < shown; i++) ctx.fillText('🔸', 12 + (i % 9) * 22, COUNTER + 34 + Math.floor(i / 9) * 26);
      if (ammo > 18) { ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('+' + (ammo - 18), 12 + 9 * 22, COUNTER + 60); }
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      ctx.fillText('Ronde ' + round + '  Doel ' + roundPts + '/' + goal, 8, 52); ctx.textAlign = 'right'; ctx.fillText(Math.max(0, Math.ceil(timeLeft)) + ' s', W - 8, 52);
      ctx.textAlign = 'center'; ctx.fillStyle = '#ffba08'; ctx.fillText(combo > 1 ? 'Combo x' + combo : '', W / 2, 52);
      ctx.textBaseline = 'middle'; ctx.font = 'bold 18px sans-serif';
      for (const f of flashes) { ctx.globalAlpha = Math.min(1, f.t); ctx.fillStyle = '#ffd166'; ctx.fillText(f.s, f.x, f.y - (1 - f.t) * 24); ctx.globalAlpha = 1; }
      ctx.strokeStyle = shotFlash > 0 ? '#ffd166' : '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 14, 0, 7); ctx.moveTo(cx - 22, cy); ctx.lineTo(cx + 22, cy); ctx.moveTo(cx, cy - 22); ctx.lineTo(cx, cy + 22); ctx.stroke();
      if (msgT > 0) { ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#ffd166'; ctx.fillText(msg, W / 2, H * 0.12 + 40); }
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
        host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move);
        window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      },
    };
  },
};
