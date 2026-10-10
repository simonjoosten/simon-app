export default {
  id: 'ijshockey', name: 'IJshockey', emoji: '🏒', hint: 'Sleep je stick en schiet de puck in het doel; eerst tot 7',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#0e2a47';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const RL = 16, RR = W - 16, RT = 70, RB = H - 22, cx = W / 2, midY = (RT + RB) / 2;
    const GW = Math.min(120, W * 0.34), MR = 24, PR = 11, GOAL = 7;
    let dead = false, ended = false, raf = 0, last = 0, time = 0;
    let pg = 0, cg = 0, state = 'start', st = 0.9, msg = '', msgT = 0, still = 0;
    const me = { x: cx, y: RB - 80, vx: 0, vy: 0 }, cpu = { x: cx, y: RT + 80, vx: 0, vy: 0 };
    const puck = { x: cx, y: midY + 60, vx: 0, vy: 0 };
    let tx = cx, ty = RB - 80, touch = false;

    function resetRound(towardCpu) {
      me.x = cx; me.y = RB - 80; me.vx = me.vy = 0; cpu.x = cx; cpu.y = RT + 80; cpu.vx = cpu.vy = 0;
      puck.x = cx; puck.y = towardCpu ? midY - 70 : midY + 70; puck.vx = puck.vy = 0; still = 0;
      tx = me.x; ty = me.y;
      state = 'start'; st = 0.9;
    }
    resetRound(false);

    const pos = e => { const b = host.getBoundingClientRect(); return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height }; };
    const pd = e => { const p = pos(e); touch = true; tx = p.x; ty = p.y - 26; try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const pm = e => { if (touch || e.pointerType === 'mouse') { const p = pos(e); tx = p.x; ty = p.y - (e.pointerType === 'mouse' ? 0 : 26); } };
    const pu = () => { touch = false; };
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm);
    host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pu);
    const keys = {};
    const kd = e => { keys[e.key] = true; if (e.key.indexOf('Arrow') === 0) e.preventDefault(); };
    const ku = e => { keys[e.key] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

    function moveMallet(m, gx, gy, speed, dt, yMin, yMax) {
      gx = Math.max(RL + MR, Math.min(RR - MR, gx)); gy = Math.max(yMin, Math.min(yMax, gy));
      const dx = gx - m.x, dy = gy - m.y, d = Math.hypot(dx, dy), mx = speed * dt;
      const ox = m.x, oy = m.y;
      if (d > mx) { m.x += dx / d * mx; m.y += dy / d * mx; } else { m.x += dx; m.y += dy; }
      m.vx = (m.x - ox) / dt; m.vy = (m.y - oy) / dt;
    }

    function hitMallet(m) {
      const dx = puck.x - m.x, dy = puck.y - m.y, d = Math.hypot(dx, dy), R = MR + PR;
      if (d >= R || d < 0.001) return;
      const nx = dx / d, ny = dy / d;
      puck.x = m.x + nx * R; puck.y = m.y + ny * R;
      const vr = (puck.vx - m.vx) * nx + (puck.vy - m.vy) * ny;
      if (vr < 0) { puck.vx -= 1.85 * vr * nx; puck.vy -= 1.85 * vr * ny; }
      const sp = Math.hypot(puck.vx, puck.vy);
      if (sp > 1050) { puck.vx *= 1050 / sp; puck.vy *= 1050 / sp; }
    }

    function goal(who) {
      if (who === 'p') { pg++; msg = 'GOAL! Jij scoort'; } else { cg++; msg = 'Computer scoort'; }
      msgT = 1.4; api.score(pg * 10);
      state = 'goal'; st = 1.4;
      if (pg >= GOAL || cg >= GOAL) {
        state = 'done';
        if (!ended) {
          ended = true; const sc = pg * 10 + (pg > cg ? 30 : 0);
          msg = pg > cg ? 'Gewonnen! ' + pg + '-' + cg : 'Verloren ' + pg + '-' + cg; msgT = 99; api.score(sc);
          setTimeout(() => { if (!dead) api.end(sc); }, 1700);
        }
      }
    }

    function cpuAI(dt) {
      const sp = Math.min(720, 340 + pg * 55), yMin = RT + MR, yMax = midY - MR - 2;
      let gx, gy, boost = 1;
      if (puck.y < midY + 8 && (puck.vy < 120 || puck.y < midY - 60)) {
        let ax = cx - puck.x, ay = RB - puck.y; const al = Math.hypot(ax, ay) || 1; ax /= al; ay /= al;
        const rx = cpu.x - puck.x, ry = cpu.y - puck.y;
        const along = rx * ax + ry * ay, lat = Math.abs(rx * ay - ry * ax);
        if (along < -(MR + PR - 6) && lat < 38) { gx = puck.x + ax * 14; gy = puck.y + ay * 14; boost = 1.3; }
        else { gx = puck.x - ax * (MR + PR + 30); gy = puck.y - ay * (MR + PR + 30); }
      } else {
        let px = puck.x;
        if (puck.vy < -60) { const t = Math.max(0, (puck.y - (RT + 55)) / -puck.vy); px = puck.x + puck.vx * t; if (px < RL) px = 2 * RL - px; if (px > RR) px = 2 * RR - px; }
        gx = cx + (px - cx) * 0.6; gy = RT + 55;
      }
      moveMallet(cpu, gx, gy, sp * boost, dt, yMin, yMax);
    }

    function update(dt) {
      time += dt; if (msgT > 0 && msgT < 90) msgT -= dt;
      const kx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), ky = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
      if (kx || ky) { tx = me.x + kx * 400; ty = me.y + ky * 400; }
      if (state === 'start') { st -= dt; moveMallet(me, tx, ty, 1800, dt, midY + MR + 2, RB - MR); if (st <= 0) state = 'play'; return; }
      if (state === 'goal') {
        st -= dt; puck.x += puck.vx * dt; puck.y += puck.vy * dt; puck.vx *= 0.9; puck.vy *= 0.9;
        if (st <= 0) resetRound(msg.indexOf('Computer') < 0);
        return;
      }
      if (state === 'done') return;
      moveMallet(me, tx, ty, 1800, dt, midY + MR + 2, RB - MR);
      cpuAI(dt);
      const sub = 4, h = dt / sub;
      for (let i = 0; i < sub; i++) {
        puck.x += puck.vx * h; puck.y += puck.vy * h;
        hitMallet(me); hitMallet(cpu);
        if (puck.x < RL + PR) { puck.x = RL + PR; puck.vx = Math.abs(puck.vx) * 0.92; }
        if (puck.x > RR - PR) { puck.x = RR - PR; puck.vx = -Math.abs(puck.vx) * 0.92; }
        const inMouth = Math.abs(puck.x - cx) < GW / 2 - 4;
        if (puck.y < RT + PR && !inMouth) { puck.y = RT + PR; puck.vy = Math.abs(puck.vy) * 0.92; }
        if (puck.y > RB - PR && !inMouth) { puck.y = RB - PR; puck.vy = -Math.abs(puck.vy) * 0.92; }
        if (inMouth && puck.y < RT - 4) { goal('p'); return; }
        if (inMouth && puck.y > RB + 4) { goal('c'); return; }
      }
      const f = Math.exp(-0.5 * dt); puck.vx *= f; puck.vy *= f;
      const sp = Math.hypot(puck.vx, puck.vy);
      if (sp < 14) still += dt; else still = 0;
      if (still > 2.2) {
        still = 0;
        const dir = puck.y < midY ? 1 : -1;
        puck.vy = dir * 120; puck.vx = (Math.random() - 0.5) * 100;
      }
    }

    function T(s, x, y, size, col, al) { ctx.font = '700 ' + size + 'px system-ui,sans-serif'; ctx.textAlign = al || 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(s, x, y); }
    function mallet(m, col) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(m.x + 3, m.y + 4, MR, 0, 7); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(m.x, m.y, MR, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(m.x, m.y, MR * 0.62, 0, 7); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(m.x, m.y, MR * 0.34, 0, 7); ctx.fill();
    }

    function draw() {
      ctx.fillStyle = '#0e2a47'; ctx.fillRect(0, 0, W, H);
      // doelen
      ctx.fillStyle = '#263238';
      ctx.fillRect(cx - GW / 2, RT - 18, GW, 20); ctx.fillRect(cx - GW / 2, RB - 2, GW, 20);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      for (let x = cx - GW / 2; x < cx + GW / 2; x += 8) { ctx.fillRect(x, RT - 18, 1, 18); ctx.fillRect(x, RB, 1, 18); }
      // ijs
      const g = ctx.createLinearGradient(0, RT, 0, RB); g.addColorStop(0, '#e8f6ff'); g.addColorStop(1, '#cfe9f8');
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(RL, RT, RR - RL, RB - RT, 24) : ctx.rect(RL, RT, RR - RL, RB - RT); ctx.fill();
      // doelgebied bij open mond
      ctx.fillStyle = '#e8f6ff'; ctx.fillRect(cx - GW / 2 + 4, RT - 2, GW - 8, 6); ctx.fillRect(cx - GW / 2 + 4, RB - 4, GW - 8, 6);
      ctx.strokeStyle = 'rgba(211,47,47,0.55)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(RL, midY); ctx.lineTo(RR, midY); ctx.stroke();
      ctx.strokeStyle = 'rgba(25,118,210,0.5)'; ctx.beginPath(); ctx.arc(cx, midY, 46, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, RT, GW * 0.7, 0, Math.PI); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, RB, GW * 0.7, Math.PI, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(211,47,47,0.55)'; ctx.beginPath(); ctx.arc(cx, midY, 5, 0, 7); ctx.fill();
      // rand
      ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx - GW / 2, RT); ctx.lineTo(RL + 20, RT); ctx.quadraticCurveTo(RL, RT, RL, RT + 20); ctx.lineTo(RL, RB - 20); ctx.quadraticCurveTo(RL, RB, RL + 20, RB); ctx.lineTo(cx - GW / 2, RB);
      ctx.moveTo(cx + GW / 2, RT); ctx.lineTo(RR - 20, RT); ctx.quadraticCurveTo(RR, RT, RR, RT + 20); ctx.lineTo(RR, RB - 20); ctx.quadraticCurveTo(RR, RB, RR - 20, RB); ctx.lineTo(cx + GW / 2, RB);
      ctx.stroke();
      // puck
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(puck.x + 2, puck.y + 3, PR, 0, 7); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(puck.x, puck.y, PR, 0, 7); ctx.fill();
      ctx.fillStyle = '#455a64'; ctx.beginPath(); ctx.arc(puck.x - 2, puck.y - 2, PR * 0.4, 0, 7); ctx.fill();
      mallet(cpu, '#1976d2'); mallet(me, '#e53935');
      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, W, 52);
      T('Computer ' + cg, W * 0.27, 18, 17, '#90caf9'); T('Jij ' + pg, W * 0.73, 18, 17, '#ff8a80');
      T('Eerst tot ' + GOAL, cx, 18, 13, 'rgba(255,255,255,0.8)');
      T('Sleep je stick (onder), raak de puck hard', cx, 40, 12, 'rgba(255,255,255,0.6)');
      if (msgT > 0) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, midY - 28, W, 56); T(msg, cx, midY, msg.length > 16 ? 24 : 30, '#ffeb3b'); }
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
