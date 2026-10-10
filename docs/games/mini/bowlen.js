export default {
  id: 'bowlen', name: 'Bowlen', emoji: '🎳', hint: 'Veeg omhoog; buig je veeg voor effect',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#1b1226';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = W / 2, LH = Math.min(88, (W - 80) / 2), GUT = 22;
    const SBH = 92, laneTop = 40, laneBot = H - SBH - 6;
    const PR = 6.5, BRr = 11.5, backY = laneTop + 26, pinY0 = laneTop + 130;
    const startY = laneBot - 40;

    let dead = false, raf = 0, last = 0, time = 0, ended = false;
    const rolls = []; // rolls[f] = [..]
    let f = 0, standing = new Array(10).fill(true);
    let phase = 'ready'; // ready, roll, settle, wait, done
    let ball = null, pins = [], rt = 0, waitT = 0, msg = '', msgT = 0, trail = null, lastSettleKnocked = 0;
    rolls[0] = [];

    function makePins() {
      pins = [];
      let idx = 0;
      for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) {
        const x = cx + (i - r / 2) * 27, y = pinY0 - r * 24;
        if (standing[idx]) pins.push({ id: idx, x, y, ox: x, oy: y, vx: 0, vy: 0, fallen: false, gone: false, a: 0 });
        idx++;
      }
    }
    makePins();

    function calc() {
      const res = []; let cum = 0, ok = true;
      const nextRolls = (fi, n) => { const o = []; for (let g = fi + 1; g < 10 && o.length < n; g++) if (rolls[g]) for (const v of rolls[g]) o.push(v); return o.slice(0, n); };
      for (let g = 0; g < 10; g++) {
        const r = rolls[g];
        if (!ok || !r || !r.length) { res.push(null); ok = false; continue; }
        if (g < 9) {
          if (r[0] === 10) { const nx = nextRolls(g, 2); if (nx.length < 2) { res.push(null); ok = false; continue; } cum += 10 + nx[0] + nx[1]; }
          else if (r.length === 2) {
            if (r[0] + r[1] === 10) { const nx = nextRolls(g, 1); if (nx.length < 1) { res.push(null); ok = false; continue; } cum += 10 + nx[0]; } else cum += r[0] + r[1];
          } else { res.push(null); ok = false; continue; }
        } else {
          const full = r.length === 3 || (r.length === 2 && r[0] + r[1] < 10);
          if (!full) { res.push(null); ok = false; continue; }
          cum += r.reduce((a, b) => a + b, 0);
        }
        res.push(cum);
      }
      let latest = 0; for (const v of res) if (v !== null) latest = v;
      return { res, latest };
    }
    function symbols(r, g) {
      const out = []; let rem = 10;
      for (const v of r) {
        if (v === rem) { out.push(rem === 10 ? 'X' : '/'); rem = 10; } else { out.push(v === 0 ? '-' : '' + v); rem -= v; }
      }
      void g; return out;
    }

    function startBall(x, v, th0, dth) {
      ball = { x, y: startY, v, th: th0, dth, el: 0, gut: 0, gone: false };
      phase = 'roll'; rt = 0; trail = null;
    }

    function finishRoll() {
      // tel omgevallen pinnen
      let k = 0;
      for (const p of pins) if (p.fallen || p.gone) { standing[p.id] = false; k++; }
      const r = rolls[f];
      r.push(k);
      let resetPins = false, nextFrame = false, over = false;
      if (f < 9) {
        if (r.length === 1 && k === 10) { nextFrame = true; resetPins = true; msg = 'STRIKE!'; }
        else if (r.length === 2) { nextFrame = true; resetPins = true; if (r[0] + r[1] === 10) msg = 'SPARE!'; else msg = k ? '' + (r[0] + r[1]) + ' pinnen' : ''; }
        else msg = k === 0 ? 'Goot!' : k + ' pinnen';
      } else {
        if (r.length === 1) { if (k === 10) { resetPins = true; msg = 'STRIKE!'; } else msg = k === 0 ? 'Goot!' : k + ' pinnen'; }
        else if (r.length === 2) {
          if (r[0] === 10) { if (k === 10) { resetPins = true; msg = 'STRIKE!'; } else msg = k + ' pinnen'; }
          else if (r[0] + r[1] === 10) { resetPins = true; msg = 'SPARE!'; }
          else { over = true; msg = r[0] + r[1] + ' pinnen'; }
        } else over = true;
      }
      if (k === 0 && !over) msg = msg || 'Goot!';
      msgT = 1.3;
      if (resetPins) standing = new Array(10).fill(true);
      const c = calc(); api.score(c.latest);
      if (over) {
        phase = 'done';
        if (!ended) { ended = true; msg = 'Totaal: ' + c.latest; msgT = 99; setTimeout(() => { if (!dead) api.end(c.latest); }, 1700); }
        return;
      }
      if (nextFrame) { f++; rolls[f] = []; }
      phase = 'wait'; waitT = 1.2;
    }

    function physics(dt) {
      rt += dt;
      const sub = 3, h = dt / sub;
      for (let s = 0; s < sub; s++) {
        if (ball && !ball.gone) {
          ball.el += h;
          if (ball.el < 0.9) ball.th += ball.dth / 0.9 * h;
          if (!ball.gut && Math.abs(ball.x - cx) > LH + 4) ball.gut = ball.x > cx ? 1 : -1;
          if (ball.gut) { ball.th *= 0.9; ball.x += (cx + ball.gut * (LH + GUT / 2) - ball.x) * Math.min(1, h * 14); }
          ball.x += Math.sin(ball.th) * ball.v * h; ball.y -= Math.cos(ball.th) * ball.v * h;
          if (ball.y < backY - 20 || ball.x < cx - LH - GUT - 4 || ball.x > cx + LH + GUT + 4) ball.gone = true;
          if (!ball.gone) for (const p of pins) {
            const dx = p.x - ball.x, dy = p.y - ball.y, d = Math.hypot(dx, dy), R = BRr + PR;
            if (d < R && d > 0.001) {
              const nx = dx / d, ny = dy / d;
              const bvx = Math.sin(ball.th) * ball.v, bvy = -Math.cos(ball.th) * ball.v;
              const rel = (bvx - p.vx) * nx + (bvy - p.vy) * ny;
              if (rel > 0) {
                p.vx += nx * rel * 1.15 + bvx * 0.1; p.vy += ny * rel * 1.15 + bvy * 0.1;
                ball.v *= 0.985;
                ball.th += -nx * 0.012;
              }
              p.x = ball.x + nx * R; p.y = ball.y + ny * R;
              if (ball.gut) { /* in de goot kan de bal toch een pin raken */ }
            }
          }
        }
        // pinnen
        for (let i = 0; i < pins.length; i++) {
          const p = pins[i]; if (p.gone) continue;
          p.x += p.vx * h; p.y += p.vy * h;
          const sp = Math.hypot(p.vx, p.vy);
          if (sp > 60) p.fallen = true;
          if (p.y < backY) { p.y = backY; p.vy = Math.abs(p.vy) * 0.35; }
          if (Math.abs(p.x - cx) > LH + GUT) { p.gone = true; p.fallen = true; }
          if (p.y > laneBot - 30) { p.gone = true; p.fallen = true; }
          for (let j = i + 1; j < pins.length; j++) {
            const q = pins[j]; if (q.gone) continue;
            const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
            if (d < PR * 2 && d > 0.001) {
              const nx = dx / d, ny = dy / d, ov = (PR * 2 - d) / 2;
              p.x -= nx * ov; p.y -= ny * ov; q.x += nx * ov; q.y += ny * ov;
              const rel = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny;
              if (rel > 0) { p.vx -= nx * rel * 0.95; p.vy -= ny * rel * 0.95; q.vx += nx * rel * 0.95; q.vy += ny * rel * 0.95; }
            }
          }
          const fr = Math.exp(-2.4 * h); p.vx *= fr; p.vy *= fr;
          if (Math.hypot(p.vx, p.vy) < 3) { p.vx = p.vy = 0; }
          if (!p.fallen && Math.hypot(p.x - p.ox, p.y - p.oy) > 13) p.fallen = true;
        }
      }
      let moving = false;
      for (const p of pins) if (!p.gone && (p.vx || p.vy)) moving = true;
      const ballActive = ball && !ball.gone;
      if (ballActive && ball.y < pinY0 - 100) { /* bal voorbij de pinnen */ }
      if (!ballActive && !moving && rt > 0.6) { phase = 'settle'; waitT = 0.5; }
      if (rt > 7) { phase = 'settle'; waitT = 0.1; if (ball) ball.gone = true; }
    }

    function update(dt) {
      time += dt; if (msgT > 0 && msgT < 90) msgT -= dt;
      if (phase === 'roll') physics(dt);
      else if (phase === 'settle') { waitT -= dt; if (waitT <= 0) finishRoll(); }
      else if (phase === 'wait') {
        waitT -= dt;
        if (waitT <= 0) { ball = null; makePins(); phase = 'ready'; }
      }
    }

    const pos = e => { const b = host.getBoundingClientRect(); return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height, t: performance.now() }; };
    const pd = e => {
      if (phase !== 'ready') return;
      trail = [pos(e)];
      try { host.setPointerCapture(e.pointerId); } catch (_) {}
    };
    const pm = e => { if (trail) trail.push(pos(e)); };
    const pu = e => {
      if (!trail) return;
      trail.push(pos(e)); const tr = trail; trail = null;
      if (phase !== 'ready') return;
      const a = tr[0], b = tr[tr.length - 1];
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), dur = Math.max(0.05, (b.t - a.t) / 1000);
      if (dy > -35 || len < 45) { msg = 'Veeg omhoog!'; msgT = 1; return; }
      const n = tr.length - 1;
      const p1 = tr[Math.floor(n * 0.4)], p2 = tr[Math.floor(n * 0.6)];
      let th0 = Math.atan2(p1.x - a.x, -(p1.y - a.y));
      let th1 = Math.atan2(b.x - p2.x, -(b.y - p2.y));
      if (!isFinite(th0)) th0 = 0; if (!isFinite(th1)) th1 = th0;
      let dth = Math.max(-0.7, Math.min(0.7, th1 - th0));
      th0 = Math.max(-0.4, Math.min(0.4, th0));
      const v = Math.max(300, Math.min(620, len / dur * 0.42));
      const x = Math.max(cx - LH + BRr, Math.min(cx + LH - BRr, a.x));
      startBall(x, v, th0, dth);
    };
    const pc = () => { trail = null; };
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm);
    host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pc);

    function T(s, x, y, size, col, al) { ctx.font = '700 ' + size + 'px system-ui,sans-serif'; ctx.textAlign = al || 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(s, x, y); }

    function drawBall(x, y) {
      const g = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, BRr);
      g.addColorStop(0, '#5c6bc0'); g.addColorStop(1, '#1a237e');
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(x + 2, y + 3, BRr, 0, 7); ctx.fill();
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, BRr, 0, 7); ctx.fill();
      ctx.fillStyle = '#0d1257'; for (const [ox, oy] of [[-3, -3], [3, -4], [0, 2]]) { ctx.beginPath(); ctx.arc(x + ox, y + oy, 1.8, 0, 7); ctx.fill(); }
    }

    function draw() {
      ctx.fillStyle = '#1b1226'; ctx.fillRect(0, 0, W, H);
      // goten
      ctx.fillStyle = '#0b0710'; ctx.fillRect(cx - LH - GUT, laneTop, GUT, laneBot - laneTop); ctx.fillRect(cx + LH, laneTop, GUT, laneBot - laneTop);
      // baan
      const g = ctx.createLinearGradient(cx - LH, 0, cx + LH, 0); g.addColorStop(0, '#d9a45b'); g.addColorStop(0.5, '#e8b972'); g.addColorStop(1, '#d9a45b');
      ctx.fillStyle = g; ctx.fillRect(cx - LH, laneTop, LH * 2, laneBot - laneTop);
      ctx.strokeStyle = 'rgba(120,70,20,0.25)'; ctx.lineWidth = 1;
      for (let i = 1; i < 8; i++) { const x = cx - LH + i * LH * 2 / 8; ctx.beginPath(); ctx.moveTo(x, laneTop); ctx.lineTo(x, laneBot); ctx.stroke(); }
      ctx.fillStyle = 'rgba(120,60,10,0.35)';
      for (let i = -3; i <= 3; i++) { const x = cx + i * 22, y = pinY0 + 130 + Math.abs(i) * 16; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 12); ctx.lineTo(x + 4, y + 12); ctx.fill(); }
      ctx.fillStyle = '#3a2a45'; ctx.fillRect(cx - LH - GUT, laneTop - 4, (LH + GUT) * 2, backY - laneTop + 4 - 20 + 20);
      ctx.fillStyle = '#6a4c7a'; ctx.fillRect(cx - LH - GUT, backY - 8, (LH + GUT) * 2, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(cx - LH, startY + 26, LH * 2, 3);
      // pinnen
      for (const p of pins) {
        if (p.gone && Math.abs(p.x - cx) > LH + GUT) continue;
        ctx.save(); ctx.translate(p.x, p.y);
        if (p.fallen) { ctx.globalAlpha = 0.5; ctx.rotate(Math.atan2(p.vx || (p.x - p.ox) || 1, -(p.vy || 0.01))); ctx.scale(0.8, 1.6); }
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(1.5, 2, PR, 0, 7); ctx.fill();
        ctx.fillStyle = '#fafafa'; ctx.beginPath(); ctx.arc(0, 0, PR, 0, 7); ctx.fill();
        ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(0, 0, PR * 0.55, 0, 7); ctx.stroke();
        ctx.restore();
      }
      // bal of voorbeeld
      if (ball && !ball.gone) drawBall(ball.x, ball.y);
      else if (phase === 'ready') {
        const bx = trail ? Math.max(cx - LH + BRr, Math.min(cx + LH - BRr, trail[0].x)) : cx;
        drawBall(bx, startY);
      }
      if (trail && trail.length > 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y); for (const p of trail) ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      // HUD
      const c = calc();
      T('Frame ' + Math.min(f + 1, 10) + '/10', 56, 18, 15, '#fff');
      T('Score ' + c.latest, W - 56, 18, 15, '#ffeb3b');
      if (phase === 'ready' && rolls[0].length === 0 && f === 0) T('Veeg omhoog. Buig je veeg voor effect.', cx, laneBot - 8, 13, 'rgba(60,30,10,0.85)');
      // scorebord
      const sy = H - SBH, bw = (W - 16) / 5;
      for (let g2 = 0; g2 < 10; g2++) {
        const col = g2 % 5, row = Math.floor(g2 / 5);
        const x = 8 + col * bw, y = sy + row * 44;
        ctx.fillStyle = g2 === f && phase !== 'done' ? '#4a2d63' : '#2c1c3d'; ctx.fillRect(x + 1, y + 1, bw - 2, 41);
        ctx.strokeStyle = '#6a4c7a'; ctx.lineWidth = 1; ctx.strokeRect(x + 1.5, y + 1.5, bw - 3, 40);
        T('' + (g2 + 1), x + 8, y + 9, 9, 'rgba(255,255,255,0.5)');
        const r = rolls[g2];
        if (r) {
          const sy2 = symbols(r, g2);
          for (let j = 0; j < sy2.length; j++) T(sy2[j], x + bw - 12 - (sy2.length - 1 - j) * 15, y + 12, 13, sy2[j] === 'X' || sy2[j] === '/' ? '#ffeb3b' : '#fff');
        }
        if (c.res[g2] !== null && c.res[g2] !== undefined) T('' + c.res[g2], x + bw / 2, y + 30, 15, '#80deea');
      }
      if (msgT > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, H * 0.4 - 28, W, 56);
        T(msg, cx, H * 0.4, msg.length > 9 ? 26 : 36, msg === 'STRIKE!' || msg === 'SPARE!' ? '#ffeb3b' : '#fff');
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
        host.removeEventListener('pointerup', pu); host.removeEventListener('pointercancel', pc);
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      },
    };
  },
};
