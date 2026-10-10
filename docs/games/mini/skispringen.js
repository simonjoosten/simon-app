export default {
  id: 'skispringen', name: 'Skispringen', emoji: '🎿', hint: 'Tik bij de rode lijn om af te zetten, houd vast om voorover te leunen',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#7fb8e8';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const SX = W * 0.3, SY = H * 0.4, K = 3.2, NJ = 5, RAMP = 40, TIN = 2.6;
    function G(x) {
      if (x <= 0) return -0.5 * x;
      if (x <= 150) return -3 - 0.4 * x;
      return -63 + (x - 150) * 0.25;
    }

    let dead = false, ended = false, raf = 0, last = 0, time = 0;
    let jn = 0, total = 0, phase = 'intro', pt = 0, msg = '', msgT = 0, res = null;
    let sk = { x: -RAMP, y: G(-RAMP), vx: 0, vy: 0 }, theta = 40, hold = false, tin = 0;
    let q = 0, takeMsg = '', airT = 0, matchSum = 0, landPre = 0, tapAge = 9, landInfo = null, tumble = 0, ph0 = 0;
    let center = 30;

    function reset() {
      sk = { x: -RAMP, y: G(-RAMP), vx: 0, vy: 0 }; theta = 20; tin = 0; phase = 'intro'; pt = 0;
      msg = 'Sprong ' + (jn + 1) + ' van ' + NJ; msgT = 1.3; res = null; landInfo = null; tumble = 0; ph0 = Math.random() * 6;
    }
    reset();

    function takeoff(xTap, auto) {
      if (auto) { q = 0.1; takeMsg = 'Te laat!'; }
      else {
        q = Math.max(0, 1 - Math.abs(xTap + 2) / 12);
        takeMsg = q > 0.85 ? 'Perfecte afzet!' : q > 0.6 ? 'Goede afzet' : xTap < -2 ? 'Te vroeg' : 'Te laat';
      }
      sk.vx = 20 + 5 * q; sk.vy = 3 * q - 0.8;
      if (auto) sk.x = 0, sk.y = 0;
      theta = 40; hold = false; airT = 0; matchSum = 0; tapAge = 9;
      phase = 'air'; msg = takeMsg; msgT = 1.0;
    }

    function touchdown() {
      const diff = Math.abs(theta - 25);
      let kind;
      const tele = tapAge < 0.5;
      if (diff < 9) kind = tele ? 'telemark' : 'clean';
      else if (diff < 18) kind = tele ? 'clean' : 'wobble';
      else kind = 'crash';
      const dist = Math.max(0, sk.x);
      const avg = airT > 0 ? matchSum / airT : 0;
      let style = Math.round(avg * 12) + (q > 0.85 ? 4 : 0) + (kind === 'telemark' ? 8 : kind === 'clean' ? 4 : kind === 'wobble' ? 2 : 0);
      let points = dist + style;
      if (kind === 'crash') { points = dist * 0.7; style = 0; }
      points = Math.round(points * 10) / 10;
      total += points;
      api.score(Math.round(total));
      landInfo = { kind, dist, style, points };
      phase = 'land'; pt = 0;
      sk.y = G(sk.x);
      const sp = Math.hypot(sk.vx, sk.vy);
      sk.vx = Math.max(12, sp * 0.8 * Math.cos(Math.atan(-0.4))); sk.vy = 0;
      msg = kind === 'telemark' ? 'Telemark!' : kind === 'clean' ? 'Mooie landing' : kind === 'wobble' ? 'Wankelige landing' : 'Valpartij!';
      msgT = 1.6;
    }

    function update(dt) {
      time += dt; pt += dt; tapAge += dt; if (msgT > 0) msgT -= dt;
      if (phase === 'intro') { if (pt > 1.1) { phase = 'inrun'; pt = 0; tin = 0; } }
      else if (phase === 'inrun') {
        tin += dt;
        const u = Math.min(1, tin / TIN);
        sk.x = -RAMP + RAMP * Math.pow(u, 1.3); sk.y = G(sk.x);
        if (tin >= TIN) takeoff(0, true);
      } else if (phase === 'air') {
        airT += dt;
        theta += (hold ? -50 : 38) * dt; theta = Math.max(4, Math.min(70, theta));
        center = 30 + 14 * Math.sin(0.8 * airT + ph0);
        const match = Math.max(0, Math.min(1, 1 - Math.max(0, Math.abs(theta - center) - 4) / 18));
        matchSum += match * dt;
        const g = 9.8 * (1 - 0.5 * match);
        sk.vy -= g * dt;
        sk.x += sk.vx * dt; sk.y += sk.vy * dt;
        const above = sk.y - G(sk.x);
        landPre = above;
        if (above <= 0 || sk.x > 195) touchdown();
      } else if (phase === 'land') {
        const crash = landInfo.kind === 'crash';
        sk.vx *= Math.exp(-(crash ? 3.5 : 0.9) * dt);
        sk.x += sk.vx * dt; sk.y = G(sk.x);
        if (crash) tumble += dt * 9 * Math.min(1, sk.vx / 8);
        if (pt > 1.6) { phase = 'result'; pt = 0; }
      } else if (phase === 'result') {
        if (pt > 2.0) {
          jn++;
          if (jn >= NJ) {
            phase = 'done';
            if (!ended) { ended = true; const sc = Math.round(total); msg = 'Totaal: ' + sc + ' punten'; msgT = 99; api.score(sc); setTimeout(() => { if (!dead) api.end(sc); }, 1600); }
          } else reset();
        }
      }
    }

    const pd = e => {
      void e;
      if (phase === 'inrun' && tin > 0.5) takeoff(sk.x, false);
      else if (phase === 'air') { hold = true; tapAge = 0; }
      try { host.setPointerCapture(e.pointerId); } catch (_) {}
    };
    const pu = () => { hold = false; };
    host.addEventListener('pointerdown', pd); host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pu);
    const kd = e => { if (e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); if (!e.repeat) pd({ pointerId: -1 }); } };
    const ku = e => { if (e.key === ' ' || e.key === 'ArrowDown') pu(); };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

    function T(s, x, y, size, col, al) { ctx.font = '700 ' + size + 'px system-ui,sans-serif'; ctx.textAlign = al || 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(s, x, y); }
    const scrX = x => SX + (x - sk.x) * K;
    const scrY = y => SY - (y - sk.y) * K;

    function drawSkier(px, py, ang, th, crash) {
      ctx.save(); ctx.translate(px, py); ctx.rotate(ang + (crash ? tumble : 0));
      ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-15, 2); ctx.lineTo(16, 2); ctx.stroke();
      const t = th * Math.PI / 180, hx = -6, hy = -3, L = 17;
      const ex = hx + Math.cos(t) * L, ey = hy - Math.sin(t) * L;
      ctx.strokeStyle = '#1565c0'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = '#fdd835'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(ex - 1, ey + 1); ctx.lineTo(ex + 8, ey + 6 - Math.min(10, th * 0.12)); ctx.stroke();
      ctx.fillStyle = '#f5cba7'; ctx.beginPath(); ctx.arc(ex + Math.cos(t) * 5, ey - Math.sin(t) * 5, 5, 0, 7); ctx.fill();
      ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(ex + Math.cos(t) * 5, ey - Math.sin(t) * 5 - 1.5, 5, Math.PI, 0); ctx.fill();
      ctx.restore();
    }

    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#4f9be0'); g.addColorStop(0.7, '#cfe9fb'); g.addColorStop(1, '#eef7ff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // bergen
      ctx.fillStyle = '#9db8cf';
      const off = (sk.x * 0.15) % 200;
      for (let i = -1; i < 4; i++) { const bx = i * 200 - off; ctx.beginPath(); ctx.moveTo(bx, H * 0.62); ctx.lineTo(bx + 90, H * 0.34 + (i % 2) * 28); ctx.lineTo(bx + 200, H * 0.62); ctx.fill(); }
      // sneeuw/terrein
      ctx.fillStyle = '#fafdff'; ctx.beginPath(); ctx.moveTo(0, H);
      for (let sx = -4; sx <= W + 8; sx += 4) { const wx = sk.x + (sx - SX) / K; ctx.lineTo(sx, scrY(G(wx))); }
      ctx.lineTo(W + 8, H); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#90a4b8'; ctx.lineWidth = 2; ctx.beginPath();
      for (let sx = -4; sx <= W + 8; sx += 4) { const wx = sk.x + (sx - SX) / K; const y = scrY(G(wx)); if (sx === -4) ctx.moveTo(sx, y); else ctx.lineTo(sx, y); }
      ctx.stroke();
      // schans
      const sx0 = scrX(-RAMP - 6), sx1 = scrX(0);
      ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 2;
      for (let x = -RAMP; x < 0; x += 5) { const a = scrX(x), b = scrY(G(x)); if (a > -10 && a < W + 10) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(a, b + 60); ctx.stroke(); } }
      ctx.strokeStyle = '#26c6da'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx0, scrY(G(-RAMP - 6))); ctx.lineTo(sx1, scrY(0)); ctx.stroke();
      // afzetlijn
      if (phase === 'intro' || phase === 'inrun') {
        ctx.strokeStyle = 'rgba(229,57,53,0.9)'; ctx.lineWidth = 5;
        const a = scrX(-5), b = scrX(0);
        ctx.beginPath(); ctx.moveTo(a, scrY(G(-5)) - 12); ctx.lineTo(a, scrY(G(-5)) + 6); ctx.moveTo(b, scrY(0) - 12); ctx.lineTo(b, scrY(0) + 6); ctx.stroke();
        ctx.fillStyle = 'rgba(229,57,53,0.25)'; ctx.fillRect(a, Math.min(scrY(G(-5)), scrY(0)) - 12, b - a, 20);
      }
      // afstandsborden
      for (let m = 20; m <= 180; m += 20) {
        const px = scrX(m); if (px < -20 || px > W + 20) continue;
        const py = scrY(G(m));
        ctx.strokeStyle = m === 100 ? '#e53935' : '#455a64'; ctx.lineWidth = m === 100 ? 3 : 1.5;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - 14); ctx.stroke();
        T(m + '', px, py - 22, 10, m === 100 ? '#e53935' : '#455a64');
      }
      // springer
      const ang = phase === 'air' ? Math.atan2(-sk.vy, sk.vx) : (phase === 'inrun' || phase === 'intro') ? Math.atan(0.5) : Math.atan(0.4);
      const th = phase === 'air' ? theta : phase === 'land' ? (landInfo && landInfo.kind === 'crash' ? 60 : 72) : phase === 'result' ? 72 : 20;
      drawSkier(SX, SY - 4, ang, th, phase === 'land' && landInfo && landInfo.kind === 'crash');
      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, 34);
      T('Sprong ' + Math.min(jn + 1, NJ) + '/' + NJ, 56, 17, 15, '#fff');
      T('Punten ' + Math.round(total), W - 60, 17, 15, '#ffeb3b');
      if (phase === 'air') {
        T(Math.max(0, sk.x).toFixed(1) + ' m', W / 2, 17, 18, '#fff');
        // houdingsmeter
        const gx = W - 34, gy0 = 80, gh = 220;
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(gx - 10, gy0, 20, gh);
        const yy = a => gy0 + gh - (a / 70) * gh;
        ctx.fillStyle = 'rgba(76,175,80,0.9)'; ctx.fillRect(gx - 10, yy(center + 9), 20, yy(center - 9) - yy(center + 9));
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(gx - 16, yy(theta)); ctx.lineTo(gx - 6, yy(theta) - 6); ctx.lineTo(gx - 6, yy(theta) + 6); ctx.fill();
        T('hoek', gx, gy0 - 10, 11, '#fff');
        T('vast', gx, gy0 + gh + 12, 10, '#fff');
        const above = landPre;
        if (above < 9 && airT > 0.8) T('LANDEN: tik!', W / 2, H * 0.62, 20, '#e53935');
        else T('Houd vast = voorover, los = omhoog. Blijf in het groen', W / 2, H * 0.9, 12, '#0d47a1');
      }
      if (phase === 'inrun') T('TIK in het rode vak!', W / 2, H * 0.8, 20, '#e53935');
      if (phase === 'result' && landInfo) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(30, H * 0.3, W - 60, 130);
        T(landInfo.dist.toFixed(1) + ' m', W / 2, H * 0.3 + 32, 34, '#fff');
        T('Stijl +' + landInfo.style, W / 2, H * 0.3 + 70, 16, '#80deea');
        T('= ' + landInfo.points.toFixed(1) + ' punten', W / 2, H * 0.3 + 100, 20, '#ffeb3b');
      }
      if (msgT > 0 && phase !== 'result') T(msg, W / 2, H * 0.22, msg.length > 16 ? 24 : 30, '#fff');
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
        host.removeEventListener('pointerdown', pd); host.removeEventListener('pointerup', pu); host.removeEventListener('pointercancel', pu);
        window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      },
    };
  },
};
