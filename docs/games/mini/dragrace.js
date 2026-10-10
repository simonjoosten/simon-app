export default {
  id: 'dragrace', name: 'Dragrace', emoji: '🚦', hint: 'Tik snel voor gas en schakel in het groen',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#14172a';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    let dead = false, raf = 0, last = 0, finished = false;
    const VMAX = [24, 40, 57, 75, 95], ACC = [15, 12, 9.5, 8, 6.5], LEN = 400, ROUNDS = 5;
    const OPPN = ['Bram', 'Sanne', 'Joris', 'Femke', 'De Baas'];
    let round = 1, total = 0, phase = 'ready', ph = 0, lights = 0, greenAt = 0, raceT = 0, msg = '', msgT = 0, resT = 0, result = null, wheel = 0;
    let P, O, tmpl;
    const mk = (skill) => ({ d: 0, v: 0, g: 0, thr: 0, boost: 0, stall: 0, t: null, skill: skill || 1, react: 0, shiftAt: 0.9, wait: 0 });
    function newRound() {
      P = mk(); O = mk(Math.min(0.97, 0.52 + round * 0.09));
      O.react = 0.15 + Math.random() * 0.3; O.shiftAt = 0.92;
      phase = 'ready'; ph = 0; lights = 0; greenAt = 1.8 + Math.random() * 1.3; raceT = 0; msg = ''; result = null;
    }
    newRound();
    api.score(0);
    function say(s) { msg = s; msgT = 1.1; }
    function gas() {
      if (phase === 'ready') {
        if (ph < greenAt) { P.stall = 0.9; P.thr = 0; say('Valse start!'); return; }
      }
      P.thr = Math.min(1, P.thr + 0.23);
    }
    function shift() {
      if (phase !== 'race' || finished) return;
      if (P.g >= 4) { say('Hoogste versnelling'); return; }
      const rpm = P.v / VMAX[P.g];
      P.g++;
      if (rpm >= 0.82 && rpm <= 1.001) { P.boost = 1.3; say('PERFECT!'); }
      else if (rpm < 0.6) { P.stall = 0.35; say('Te vroeg'); }
      else if (rpm < 0.82) say('Goed');
    }
    const pd = e => {
      const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
      if (y < 340 && phase !== 'ready' && phase !== 'race') return;
      if (x < W * 0.55) gas(); else shift();
    };
    host.addEventListener('pointerdown', pd);
    const kd = e => {
      if (e.repeat) return;
      if (e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); gas(); }
      if (e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'Shift') { e.preventDefault(); shift(); }
    };
    window.addEventListener('keydown', kd);
    function sim(c, dt, ai) {
      if (c.stall > 0) c.stall -= dt;
      if (c.boost > 0) c.boost -= dt;
      c.thr = Math.max(0, c.thr - 1.1 * dt);
      if (ai) {
        if (raceT < c.react) return;
        c.thr = Math.min(1, c.skill * (0.82 + Math.random() * 0.25));
        const rpm = c.v / VMAX[c.g];
        c.wait -= dt;
        if (rpm >= c.shiftAt && c.g < 4 && c.wait <= 0) {
          c.g++; c.wait = 0.4;
          if (rpm <= 1.001 && rpm >= 0.82) c.boost = 1.3;
          c.shiftAt = 0.84 + Math.random() * 0.16 + (1 - c.skill) * 0.12;
        }
      }
      const rpm = c.v / VMAX[c.g];
      if (rpm < 1) {
        const a = ACC[c.g] * c.thr * (1 - rpm * rpm * 0.5) * (c.boost > 0 ? 1.3 : 1) * (c.stall > 0 ? 0.25 : 1);
        c.v += a * dt;
        if (c.v > VMAX[c.g]) c.v = VMAX[c.g];
      }
      c.v = Math.max(0, c.v - 0.35 * c.v * dt * 0.1);
      c.d += c.v * dt;
    }
    function update(dt) {
      if (msgT > 0) msgT -= dt;
      wheel += P.v * dt * 0.4;
      if (phase === 'ready') {
        ph += dt; lights = Math.min(3, Math.floor(ph / (greenAt / 3.4)) + 1);
        if (P.stall > 0) P.stall -= dt;
        if (ph >= greenAt) { phase = 'race'; raceT = 0; }
      } else if (phase === 'race') {
        raceT += dt;
        sim(P, dt, false); sim(O, dt, true);
        if (P.t === null && P.d >= LEN) P.t = raceT - (P.d - LEN) / Math.max(P.v, 1);
        if (O.t === null && O.d >= LEN) O.t = raceT - (O.d - LEN) / Math.max(O.v, 1);
        if (P.t !== null || O.t !== null) {
          // wait until winner decided; give the other a short moment
          if (P.t !== null && O.t !== null || raceT > Math.min(P.t === null ? 99 : P.t, O.t === null ? 99 : O.t) + 2.5) {
            const pt = P.t === null ? 99 : P.t, ot = O.t === null ? 99 : O.t;
            const win = pt < ot;
            result = { win, pt, ot }; phase = 'result'; resT = 0;
            if (win) { total += 1000 + Math.max(0, Math.round((13 - pt) * 60)); api.score(total); }
          }
        }
      } else if (phase === 'result') {
        resT += dt; P.v = Math.max(0, P.v - 20 * dt); P.d += P.v * dt; O.v = Math.max(0, O.v - 20 * dt); O.d += O.v * dt;
        if (resT > 2.6) {
          if (!result.win) { finished = true; api.end(total); }
          else if (round >= ROUNDS) { finished = true; api.end(total + 2000); }
          else { round++; newRound(); }
        }
      }
    }
    function car(x, y, col, w, rot, flame) {
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(-w * 0.5, 0, w, 6);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(-w * 0.5, -6); ctx.lineTo(-w * 0.5, -w * 0.2); ctx.lineTo(-w * 0.12, -w * 0.24); ctx.lineTo(-w * 0.02, -w * 0.4);
      ctx.lineTo(w * 0.28, -w * 0.4); ctx.lineTo(w * 0.36, -w * 0.24); ctx.lineTo(w * 0.5, -w * 0.18); ctx.lineTo(w * 0.5, -6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#bfe6ff'; ctx.beginPath(); ctx.moveTo(0, -w * 0.25); ctx.lineTo(w * 0.04, -w * 0.36); ctx.lineTo(w * 0.26, -w * 0.36); ctx.lineTo(w * 0.31, -w * 0.25); ctx.fill();
      for (const wx of [-w * 0.3, w * 0.32]) {
        ctx.save(); ctx.translate(wx, -w * 0.09); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, 0, w * 0.1, 0, 7); ctx.fill();
        ctx.rotate(rot); ctx.fillStyle = '#ccc'; ctx.fillRect(-w * 0.07, -2, w * 0.14, 4); ctx.restore();
      }
      if (flame) { ctx.fillStyle = '#ffb020'; ctx.beginPath(); ctx.moveTo(-w * 0.5, -w * 0.12); ctx.lineTo(-w * 0.5 - w * (0.2 + Math.random() * 0.25), -w * 0.1); ctx.lineTo(-w * 0.5, -w * 0.06); ctx.fill(); }
      ctx.restore();
    }
    function draw() {
      ctx.fillStyle = '#1d2a55'; ctx.fillRect(0, 0, W, 72);
      const sk = ctx.createLinearGradient(0, 70, 0, 150); sk.addColorStop(0, '#ff9a4a'); sk.addColorStop(1, '#ffd98a');
      ctx.fillStyle = sk; ctx.fillRect(0, 72, W, 70);
      // crowd / skyline
      const cam = P.d, S = 6;
      ctx.fillStyle = '#3b3f66';
      for (let i = -2; i < 14; i++) {
        const bx = ((i * 55 - (cam * S * 0.3) % 55) + 55 * 20) % (W + 110) - 30;
        ctx.fillRect(bx, 100 + (i * 37 % 5) * 7, 40, 45);
      }
      ctx.fillStyle = '#3a8f44'; ctx.fillRect(0, 142, W, 18);
      // track
      ctx.fillStyle = '#42454f'; ctx.fillRect(0, 160, W, 190);
      ctx.fillStyle = '#e8e8e8'; ctx.fillRect(0, 160, W, 4); ctx.fillRect(0, 346, W, 4);
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      const off = (cam * S) % 60;
      for (let x = -off; x < W; x += 60) ctx.fillRect(x, 253, 30, 3);
      // finish & start
      const fx = 100 + (LEN - cam) * S, sx = 100 - cam * S;
      const strip = (x) => { if (x < -20 || x > W + 20) return; for (let i = 0; i < 12; i++) { ctx.fillStyle = (i % 2) ? '#fff' : '#111'; ctx.fillRect(x, 160 + i * 16, 8, 16); ctx.fillStyle = (i % 2) ? '#111' : '#fff'; ctx.fillRect(x + 8, 160 + i * 16, 8, 16); } };
      strip(fx); if (sx > -20) { ctx.fillStyle = '#fff'; ctx.fillRect(sx + 66, 160, 3, 190); }
      // 100m markers
      ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let m = 100; m < LEN; m += 100) { const mx = 100 + (m - cam) * S; if (mx > 0 && mx < W) { ctx.fillRect(mx, 346, 2, 10); ctx.fillText(m + 'm', mx, 362); } }
      // cars
      const ox = Math.max(-80, Math.min(W + 80, 100 + (O.d - P.d) * S));
      car(ox, 240, '#d94a4a', 92, wheel - O.d * 0.4, O.boost > 0);
      car(100, 335, '#2e9bff', 92, wheel, P.boost > 0);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      if (ox > 20 && ox < W - 20) ctx.fillText(OPPN[round - 1], ox, 196);
      // HUD top
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('Ronde ' + round + '/' + ROUNDS + ' vs ' + OPPN[round - 1], 12, 22);
      ctx.textAlign = 'right'; ctx.fillText(Math.min(LEN, Math.floor(P.d)) + ' / ' + LEN + ' m', W - 12, 22);
      ctx.textAlign = 'left'; ctx.fillStyle = '#ffd23f'; ctx.fillText('Punten ' + total, 12, 48);
      ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.fillText(phase === 'race' || phase === 'result' ? raceT.toFixed(2) + ' s' : '', W - 12, 48);
      // lights
      if (phase === 'ready') {
        ctx.fillStyle = '#111'; ctx.fillRect(W / 2 - 55, 168, 110, 40);
        for (let i = 0; i < 3; i++) {
          const green = ph >= greenAt;
          ctx.fillStyle = green ? '#2f2' : (lights > i ? '#f33' : '#400');
          ctx.beginPath(); ctx.arc(W / 2 - 30 + i * 30, 188, 11, 0, 7); ctx.fill();
        }
      }
      // gauge
      const rpm = Math.min(1.25, P.v / VMAX[P.g]);
      const gx = W / 2, gy = 440, gr = 78;
      ctx.lineWidth = 14; ctx.lineCap = 'butt';
      const a0 = Math.PI * 0.8, a1 = Math.PI * 2.2, an = (v) => a0 + (a1 - a0) * v / 1.25;
      const arc = (v0, v1, col) => { ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(gx, gy, gr, an(v0), an(v1)); ctx.stroke(); };
      arc(0, 0.82, '#3a3f66'); arc(0.82, 1.0, '#2fd45a'); arc(1.0, 1.25, '#e03030');
      const na = an(rpm);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(na) * (gr - 8), gy + Math.sin(na) * (gr - 8)); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 30px sans-serif'; ctx.fillText(String(P.g + 1), gx, gy + 6);
      ctx.font = '12px sans-serif'; ctx.fillText('versnelling', gx, gy + 28);
      ctx.font = 'bold 14px sans-serif'; ctx.fillText(Math.round(P.v * 3.6 * 1.2) + ' km/u', gx, gy + 52);
      if (phase === 'race' && rpm >= 0.82 && rpm < 1.0 && P.g < 4 && Math.floor(performance.now() / 120) % 2) {
        ctx.fillStyle = '#2fd45a'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('SCHAKEL!', gx, gy - 100);
      }
      // gas meter
      ctx.fillStyle = '#2a2f55'; ctx.fillRect(12, 400, 12, 80);
      ctx.fillStyle = '#ffb020'; ctx.fillRect(12, 480 - 80 * P.thr, 12, 80 * P.thr);
      // buttons
      const by = 500, bh = H - by - 10, bw1 = W * 0.55 - 15, bw2 = W - bw1 - 30;
      ctx.fillStyle = '#1f9d55'; ctx.fillRect(10, by, bw1, bh);
      ctx.fillStyle = '#c0392b'; ctx.fillRect(20 + bw1, by, bw2, bh);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 26px sans-serif'; ctx.textBaseline = 'middle';
      ctx.fillText('GAS', 10 + bw1 / 2, by + bh / 2 - 8); ctx.fillText('SCHAKEL', 20 + bw1 + bw2 / 2, by + bh / 2 - 8);
      ctx.font = '12px sans-serif'; ctx.fillText('tik snel', 10 + bw1 / 2, by + bh / 2 + 16); ctx.fillText('in het groen', 20 + bw1 + bw2 / 2, by + bh / 2 + 16);
      if (msgT > 0) { ctx.fillStyle = '#fff'; ctx.font = 'bold 26px sans-serif'; ctx.fillText(msg, W / 2, 300); }
      if (phase === 'result' && result) {
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(30, 250, W - 60, 110);
        ctx.fillStyle = result.win ? '#7dff9a' : '#ff7d7d'; ctx.font = 'bold 28px sans-serif';
        ctx.fillText(result.win ? 'Gewonnen!' : 'Verloren', W / 2, 285);
        ctx.fillStyle = '#fff'; ctx.font = '15px sans-serif';
        ctx.fillText('Jij ' + (result.pt > 90 ? '-' : result.pt.toFixed(2)) + ' s  |  ' + OPPN[round - 1] + ' ' + (result.ot > 90 ? '-' : result.ot.toFixed(2)) + ' s', W / 2, 325);
      }
    }
    function frame(ts) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.max(0.001, Math.min((ts - (last || ts)) / 1000, 0.05)); last = ts;
      if (!finished) update(dt);
      draw();
    }
    raf = requestAnimationFrame(frame);
    return { destroy() {
      dead = true; cancelAnimationFrame(raf);
      host.removeEventListener('pointerdown', pd); window.removeEventListener('keydown', kd);
      cv.remove();
    } };
  },
};
