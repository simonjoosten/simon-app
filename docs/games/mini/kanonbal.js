export default {
  id: 'kanonbal', name: 'Kanonbal', emoji: '💣', hint: 'Sleep om te richten, laat los om te schieten. Raak alle doelen!',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#1c2541';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let dead = false, over = false, raf = 0, last = 0, score = 0;
    const G = 700, R = 8, floorY = H - 30, cx = W / 2, cy = H - 52, VMAX = 950, REST = 0.82;
    let level = 1, ballsLeft = 0, ball = null, targets = [], obst = [], aiming = false, aim = null;
    let life = 0, still = 0, combo = 0, wait = 0, msg = '', msgT = 0, time = 0, mode = 'aim';
    let seed = 1;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    function build(n) {
      seed = n * 977 + 13; targets = []; obst = [];
      const no = Math.min(5, Math.floor(n / 1.5)), nt = Math.min(9, 3 + n);
      for (let i = 0; i < no; i++) {
        const w = 50 + rnd() * 60, h = 12;
        obst.push({ x: 40 + rnd() * (W - 80), y: 150 + rnd() * (H - 420), w, h });
      }
      for (let i = 0, tries = 0; i < nt && tries < 300; tries++) {
        const x = 30 + rnd() * (W - 60), y = 70 + rnd() * (H - 300);
        let ok = true;
        for (const o of obst) if (Math.abs(x - o.x) < o.w / 2 + 26 && Math.abs(y - o.y) < o.h / 2 + 26) ok = false;
        for (const t of targets) if (Math.hypot(t.x0 - x, t.y - y) < 46) ok = false;
        if (!ok) continue;
        const mv = n >= 4 && rnd() < 0.5 ? 1 : 0;
        targets.push({ x0: x, x: x, y, r: 15, mv, amp: mv ? Math.min(40, x - 20, W - 20 - x) : 0, ph: rnd() * 6 });
        i++;
      }
      ballsLeft = Math.max(4, targets.length + 2 - Math.floor(n / 3));
      mode = 'aim'; ball = null; aim = null;
    }
    function say(s) { msg = s; msgT = 1.6; }
    build(level);

    const pt = e => { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height }; };
    function setAim(p) {
      let dx = p.x - cx, dy = Math.min(p.y - cy, -12);
      const d = Math.hypot(dx, dy); const pw = Math.max(0.25, Math.min(1, d / 170));
      aim = { a: Math.atan2(dy, dx), pw };
    }
    const down = e => { if (mode !== 'aim' || over) return; aiming = true; setAim(pt(e)); try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const move = e => { if (aiming) setAim(pt(e)); };
    const up = () => {
      if (!aiming) return; aiming = false;
      if (!aim || mode !== 'aim') return;
      const v = VMAX * aim.pw;
      ball = { x: cx + Math.cos(aim.a) * 34, y: cy + Math.sin(aim.a) * 34, vx: Math.cos(aim.a) * v, vy: Math.sin(aim.a) * v };
      ballsLeft--; mode = 'fly'; life = 0; still = 0; combo = 0;
    };
    host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move);
    host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);

    function hitRect(o) {
      const hx = o.w / 2, hy = o.h / 2, dx = ball.x - o.x, dy = ball.y - o.y;
      const qx = Math.max(-hx, Math.min(hx, dx)), qy = Math.max(-hy, Math.min(hy, dy));
      let ex = dx - qx, ey = dy - qy, d = Math.hypot(ex, ey);
      if (d >= R) return;
      let nx, ny;
      if (d > 1e-6) { nx = ex / d; ny = ey / d; ball.x += nx * (R - d); ball.y += ny * (R - d); }
      else { nx = 0; ny = dy < 0 ? -1 : 1; ball.y = o.y + ny * (hy + R); }
      const vn = ball.vx * nx + ball.vy * ny;
      if (vn < 0) { ball.vx -= (1 + REST) * vn * nx; ball.vy -= (1 + REST) * vn * ny; }
    }
    function step(dt) {
      if (over) return;
      time += dt; if (msgT > 0) msgT -= dt;
      for (const t of targets) if (t.mv) t.x = t.x0 + Math.sin(time * 1.3 + t.ph) * t.amp;
      if (mode === 'fly') {
        life += dt;
        const n = Math.max(1, Math.ceil(Math.hypot(ball.vx, ball.vy) * dt / 5)), h = dt / n;
        for (let s = 0; s < n; s++) {
          ball.vy += G * h; ball.x += ball.vx * h; ball.y += ball.vy * h;
          if (ball.x < R) { ball.x = R; ball.vx = Math.abs(ball.vx) * REST; }
          if (ball.x > W - R) { ball.x = W - R; ball.vx = -Math.abs(ball.vx) * REST; }
          if (ball.y < R) { ball.y = R; ball.vy = Math.abs(ball.vy) * REST; }
          if (ball.y > floorY - R) { ball.y = floorY - R; if (ball.vy > 0) ball.vy = -ball.vy * REST; ball.vx *= 0.99; }
          for (const o of obst) hitRect(o);
          for (let i = targets.length - 1; i >= 0; i--) {
            const t = targets[i];
            if (Math.hypot(t.x - ball.x, t.y - ball.y) < t.r + R) {
              targets.splice(i, 1); combo++; score += 100 * combo; api.score(score);
              if (combo > 1) say('Combo x' + combo + '!');
            }
          }
        }
        const onFloor = ball.y > floorY - R - 1 && Math.abs(ball.vy) < 60;
        still = onFloor && Math.abs(ball.vx) < 40 ? still + dt : 0;
        if (still > 0.5 || life > 8 || targets.length === 0) { ball = null; mode = 'wait'; wait = 0.8; }
      } else if (mode === 'wait') {
        wait -= dt;
        if (wait <= 0) {
          if (targets.length === 0) {
            const b = ballsLeft * 200 + level * 100; score += b; api.score(score);
            say('Level ' + level + ' klaar! +' + b); level++; build(level);
          } else if (ballsLeft > 0) mode = 'aim';
          else { over = true; api.end(score); }
        }
      }
    }
    function draw() {
      ctx.fillStyle = '#1c2541'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#3a506b'; ctx.fillRect(0, floorY, W, H - floorY);
      ctx.fillStyle = '#e0a458';
      for (const o of obst) ctx.fillRect(o.x - o.w / 2, o.y - o.h / 2, o.w, o.h);
      ctx.font = '30px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const t of targets) ctx.fillText('🎯', t.x, t.y + 1);
      if (aiming && aim && mode === 'aim') {
        const v = VMAX * aim.pw; let x = cx + Math.cos(aim.a) * 34, y = cy + Math.sin(aim.a) * 34;
        const vx = Math.cos(aim.a) * v, vy = Math.sin(aim.a) * v; ctx.fillStyle = 'rgba(255,255,255,.7)';
        for (let i = 1; i < 14; i++) { const t = i * 0.05; ctx.beginPath(); ctx.arc(x + vx * t, y + vy * t + 0.5 * G * t * t, 2.5, 0, 7); ctx.fill(); }
      }
      const ang = aim ? aim.a : -Math.PI / 2;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
      ctx.fillStyle = '#555'; ctx.fillRect(0, -9, 36, 18); ctx.restore();
      ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, 7); ctx.fill();
      if (ball) { ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(ball.x, ball.y, R, 0, 7); ctx.fill(); ctx.strokeStyle = '#7a5c00'; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('Level ' + level + '   🎯 ' + targets.length, 10, 10);
      ctx.textAlign = 'right'; ctx.fillText('⚫ x ' + ballsLeft, W - 10, 10);
      if (msgT > 0) { ctx.textAlign = 'center'; ctx.font = 'bold 26px sans-serif'; ctx.fillStyle = '#ffd166'; ctx.fillText(msg, W / 2, H * 0.4); }
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
        host.removeEventListener('pointerup', up); host.removeEventListener('pointercancel', up);
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      },
    };
  },
};
