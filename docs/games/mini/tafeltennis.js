export default {
  id: 'tafeltennis', name: 'Tafeltennis', emoji: '🏓', hint: 'Sleep je batje; een snelle zijwaartse beweging geeft spin',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#13203a';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const tl = 30, tr = W - 30, tTop = 74, tBot = H - 44, midY = (tTop + tBot) / 2, cx = W / 2;
    const HW = 36, CW = 34, BRd = 7, cpuY = tTop + 22;
    const PMIN = H * 0.62, PMAX = H - 40;

    let dead = false, ended = false, raf = 0, last = 0, time = 0;
    let ps = 0, cs = 0, rally = 0, best = 0, server = 'c', state = 'serve', st = 1.0, msg = '', msgT = 0;
    const P = { x: cx, y: H - 90, vx: 0, vy: 0, tx: cx, ty: H - 90 };
    const C = { x: cx, tx: cx, err: 0, aim: cx };
    let ball = null, hitter = 'c', trail = [], from = 0, to = 0;
    let touch = false;

    function serve() {
      rally = 0;
      const spd = 300;
      if (server === 'c') {
        ball = { x: C.x, y: cpuY + 20, vx: (Math.random() - 0.5) * 120, vy: spd, ax: 0 }; hitter = 'c'; from = cpuY; to = P.y;
      } else {
        ball = { x: P.x, y: P.y - 20, vx: (Math.random() - 0.5) * 100, vy: -spd, ax: 0 }; hitter = 'p'; from = P.y; to = cpuY;
      }
      trail = []; state = 'play';
    }

    function point(who) {
      if (who === 'p') { ps++; msg = 'Punt voor jou!'; } else { cs++; msg = 'Punt voor de computer'; }
      api.score(ps * 10);
      msgT = 1.1; best = Math.max(best, rally);
      state = 'pause'; st = 1.1; ball = null;
      server = server === 'c' ? 'p' : 'c';
      if (ps >= 11 || cs >= 11) {
        state = 'done';
        if (!ended) {
          ended = true;
          const sc = ps * 10 + (ps > cs ? 30 : 0) + Math.min(20, best);
          msg = ps > cs ? 'Gewonnen! ' + ps + '-' + cs : 'Verloren ' + ps + '-' + cs; msgT = 99;
          api.score(sc);
          setTimeout(() => { if (!dead) api.end(sc); }, 1600);
        }
      }
    }

    const pos = e => { const b = host.getBoundingClientRect(); return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height }; };
    const pd = e => { const p = pos(e); touch = true; P.tx = p.x; P.ty = p.y - 36; try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const pm = e => { if (touch || e.pointerType === 'mouse') { const p = pos(e); P.tx = p.x; P.ty = p.y - (e.pointerType === 'mouse' ? 0 : 36); } };
    const pu = () => { touch = false; };
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm);
    host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pu);
    const keys = {};
    const kd = e => { keys[e.key] = true; if (e.key.indexOf('Arrow') === 0) e.preventDefault(); };
    const ku = e => { keys[e.key] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

    function speedBase() { return Math.min(620, 330 + rally * 14); }

    function update(dt) {
      time += dt; if (msgT > 0 && msgT < 90) msgT -= dt;
      // batje
      const kx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), ky = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
      if (kx || ky) { P.tx = P.x + kx * 300; P.ty = P.y + ky * 300; }
      const ox = P.x, oy = P.y;
      const dx = Math.max(tl + 10, Math.min(tr - 10, P.tx)) - P.x, dy = Math.max(PMIN, Math.min(PMAX, P.ty)) - P.y;
      const mx = 1900 * dt, d = Math.hypot(dx, dy);
      if (d > mx) { P.x += dx / d * mx; P.y += dy / d * mx; } else { P.x += dx; P.y += dy; }
      const nvx = (P.x - ox) / dt, nvy = (P.y - oy) / dt;
      P.vx += (nvx - P.vx) * Math.min(1, dt * 18); P.vy += (nvy - P.vy) * Math.min(1, dt * 18);

      // computer
      const lvl = Math.min(1, ps / 11);
      const cSpeed = 250 + lvl * 170 + (cs > ps ? 0 : 20);
      if (ball && ball.vy < 0) {
        const t = Math.max(0, (ball.y - cpuY) / -ball.vy);
        C.tx = ball.x + ball.vx * t + 0.5 * ball.ax * t * t + C.err;
      } else C.tx = cx + (ball ? (ball.x - cx) * 0.25 : 0);
      C.tx = Math.max(tl + 10, Math.min(tr - 10, C.tx));
      const cd = C.tx - C.x, cm = cSpeed * dt;
      C.x += Math.abs(cd) < cm ? cd : Math.sign(cd) * cm;

      if (state === 'serve') { st -= dt; if (st <= 0) serve(); }
      else if (state === 'pause') { st -= dt; if (st <= 0) { state = 'serve'; st = 0.5; } }
      else if (state === 'play' && ball) {
        const steps = 2, h = dt / steps;
        for (let i = 0; i < steps && ball; i++) {
          ball.vx += ball.ax * h;
          ball.x += ball.vx * h; ball.y += ball.vy * h;
          if (ball.x < tl - 26 || ball.x > tr + 26) { point(hitter === 'p' ? 'c' : 'p'); break; }
          // speler
          if (ball.vy > 0 && ball.y > P.y - 16 && ball.y < P.y + 18 && Math.abs(ball.x - P.x) < HW + 5) {
            const rel = (ball.x - P.x) / HW;
            ball.vy = -(speedBase() + Math.max(0, -P.vy) * 0.18);
            ball.vx = Math.max(-230, Math.min(230, rel * 120 + P.vx * 0.3));
            ball.ax = Math.max(-170, Math.min(170, P.vx * 0.22));
            rally++; hitter = 'p'; from = P.y; to = cpuY;
            // computer maakt fouten
            C.err = (Math.random() < Math.max(0.05, 0.28 - lvl * 0.2)) ? (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 40) : (Math.random() - 0.5) * 24;
            if (ps >= 11 || cs >= 11) break;
          } else if (ball.vy < 0 && ball.y < cpuY + 18 && ball.y > cpuY - 16 && Math.abs(ball.x - C.x) < CW + 4) {
            // terugslag door computer
            const target = tl + 30 + Math.random() * (tr - tl - 60);
            const away = P.x < cx ? 1 : -1;
            const tx = Math.random() < 0.6 ? cx + away * (30 + Math.random() * (tr - cx - 50)) : target;
            const sp = speedBase();
            const flt = (P.y - cpuY) / sp;
            ball.vy = sp;
            ball.vx = Math.max(-230, Math.min(230, (tx - ball.x) / flt));
            ball.ax = (Math.random() - 0.5) * (80 + lvl * 120);
            ball.vx -= ball.ax * flt * 0.5; ball.vx = Math.max(-260, Math.min(260, ball.vx));
            rally++; hitter = 'c'; from = cpuY; to = P.y;
          }
          if (ball.vy < 0 && ball.y < cpuY - 26) { point('p'); break; }
          if (ball.vy > 0 && ball.y > P.y + 34) { point('c'); break; }
        }
        if (ball) { trail.push({ x: ball.x, y: ball.y }); if (trail.length > 9) trail.shift(); }
      }
    }

    function T(s, x, y, size, col, al) { ctx.font = '700 ' + size + 'px system-ui,sans-serif'; ctx.textAlign = al || 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(s, x, y); }
    function paddle(x, y, col, flip) {
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(4, 6, 26, 24, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#c8a064'; ctx.fillRect(-4, flip ? -46 : 18, 8, 28);
      ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(0, 0, 27, 0, 7); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 24, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(-7, -7, 10, 0, 7); ctx.fill();
      ctx.restore();
    }

    function draw() {
      ctx.fillStyle = '#13203a'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#0d47a1'; ctx.fillRect(tl, tTop, tr - tl, tBot - tTop);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(tl + 1.5, tTop + 1.5, tr - tl - 3, tBot - tTop - 3);
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, tTop); ctx.lineTo(cx, tBot); ctx.stroke();
      // net
      ctx.fillStyle = 'rgba(240,240,240,0.55)'; ctx.fillRect(tl - 10, midY - 3, tr - tl + 20, 6);
      ctx.fillStyle = '#ddd'; ctx.fillRect(tl - 12, midY - 7, 5, 14); ctx.fillRect(tr + 7, midY - 7, 5, 14);
      // hint effect
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
      for (let x = tl + 6; x < tr; x += 8) { ctx.beginPath(); ctx.moveTo(x, midY - 3); ctx.lineTo(x, midY + 3); ctx.stroke(); }
      // computer-batje
      paddle(C.x, cpuY, '#1976d2', true);
      // bal
      if (ball) {
        for (let i = 0; i < trail.length; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (i / trail.length * 0.25) + ')'; ctx.beginPath(); ctx.arc(trail[i].x, trail[i].y, BRd * i / trail.length, 0, 7); ctx.fill(); }
        const span = Math.max(1, Math.abs(to - from)), pr = Math.max(0, Math.min(1, (ball.y - Math.min(from, to)) / span));
        const z = 26 * Math.sin(pr * Math.PI);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(ball.x, ball.y, BRd, BRd * 0.6, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y - z * 0.6, BRd + z * 0.03, 0, 7); ctx.fill();
        ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(ball.x - 2, ball.y - z * 0.6 - 2, 2, 0, 7); ctx.fill();
        if (Math.abs(ball.ax) > 40) T(ball.ax > 0 ? '↷' : '↶', ball.x, ball.y - z * 0.6 - 18, 14, 'rgba(255,255,255,0.8)');
      }
      paddle(P.x, P.y, '#e53935', false);
      // HUD
      T('Jij ' + ps + '  -  ' + cs + ' Computer', cx, 20, 18, '#fff');
      T('Eerst tot 11   Rally ' + rally, cx, 46, 13, 'rgba(255,255,255,0.75)');
      if (state === 'serve' && ps + cs === 0) T('Sleep je batje, tik de bal terug', cx, midY + 60, 14, '#fff');
      if (msgT > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, midY - 28, W, 56);
        T(msg, cx, midY, msg.length > 18 ? 22 : 30, '#ffeb3b');
      }
    }

    function frame(t) {
      if (dead) return;
      const dt = Math.min(0.033, (t - last) / 1000 || 0.016); last = t;
      update(dt); draw();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        host.removeEventListener('pointerdown', pd); host.removeEventListener('pointermove', pm);
        host.removeEventListener('pointerup', pu); host.removeEventListener('pointercancel', pu);
        window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      },
    };
  },
};
