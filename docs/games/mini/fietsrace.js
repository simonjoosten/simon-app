export default {
  id: 'fietsrace', name: 'Fietsrace', emoji: '🚴', hint: 'Tik links en rechts in het ritme van de pedalen. Let op wind en heuvels!',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#8fd0ff';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    let dead = false, raf = 0, last = 0, ended = false, endT = 0;
    const LEN = 1300, TR = 1.25, LY0 = 372, LY1 = H - 96, PXM = 14, GROUND = 232, VS = 5;
    const LX = [W * 0.25, W * 0.75];
    const rnd = (a, b) => a + Math.random() * (b - a);
    const hgt = x => 5 * Math.sin(x / 140) + 2.5 * Math.sin(x / 55 + 1) + 3 * Math.sin(x / 300 + 2);
    const slope = x => (hgt(x + 2) - hgt(x - 2)) / 4;
    const windAt = t => Math.max(-1, Math.min(1, Math.sin(t * 0.17) * 0.9 + Math.sin(t * 0.063 + 2) * 0.5));
    const NAMES = ['Jij', 'Lotte', 'Daan', 'Bas'];
    const COLS = ['#e8453c', '#3b82f6', '#22c55e', '#f59e0b'];
    const riders = [
      { d: 0, v: 0, ph: 0, base: 0 },
      { d: 0, v: 0, ph: 0, base: 9.3, off: rnd(0, 6) },
      { d: 0, v: 0, ph: 0, base: 10.1, off: rnd(0, 6) },
      { d: 0, v: 0, ph: 0, base: 10.9, off: rnd(0, 6) },
    ];
    const me = riders[0];
    let t = 0, power = 0, combo = 0, bestCombo = 0, perfects = 0, goods = 0, misses = 0, notesQ = [], nextNote = 1.8, lane = 0, fb = [], press = [0, 0], finishT = null, finished = [], score = 0, windV = 0, shake = 0;
    function genNotes() {
      while (nextNote < t + TR + 0.5) {
        notesQ.push({ t: nextNote, lane, hit: false, miss: false });
        lane = 1 - lane;
        const prog = Math.min(1, me.d / LEN);
        nextNote += 0.58 - 0.13 * prog;
      }
    }
    function judge(l) {
      press[l] = 0.15;
      let best = null, bd = 9;
      for (const n of notesQ) if (!n.hit && !n.miss && n.lane === l) { const dd = Math.abs(n.t - t); if (dd < bd) { bd = dd; best = n; } }
      if (best && bd <= 0.2) {
        best.hit = true;
        if (bd < 0.07) { perfects++; combo++; power = Math.min(1.25, power + 0.13); fb.push({ s: 'Perfect!', c: '#7dff9a', l: 0.7, x: LX[l] }); }
        else if (bd < 0.13) { goods++; combo++; power = Math.min(1.25, power + 0.09); fb.push({ s: 'Goed', c: '#ffd23f', l: 0.7, x: LX[l] }); }
        else { combo++; power = Math.min(1.25, power + 0.05); fb.push({ s: 'Net', c: '#ffa94d', l: 0.7, x: LX[l] }); }
        bestCombo = Math.max(bestCombo, combo);
      } else {
        combo = 0; power = Math.max(0, power - 0.08); fb.push({ s: 'Te vroeg', c: '#ff7d7d', l: 0.6, x: LX[l] });
      }
    }
    const pd = e => { const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height; if (ended) return; if (y > 300) judge(x < W / 2 ? 0 : 1); };
    host.addEventListener('pointerdown', pd);
    const kd = e => {
      if (e.repeat || ended) return;
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a' || k === 'f' || k === 'z') { e.preventDefault(); judge(0); }
      if (k === 'arrowright' || k === 'd' || k === 'j' || k === '/') { e.preventDefault(); judge(1); }
    };
    window.addEventListener('keydown', kd);
    api.score(0);
    function update(dt) {
      t += dt; shake = Math.max(0, shake - dt * 3);
      windV = windAt(t);
      genNotes();
      for (const n of notesQ) if (!n.hit && !n.miss && t - n.t > 0.2) { n.miss = true; misses++; combo = 0; power = Math.max(0, power - 0.12); fb.push({ s: 'Mis', c: '#ff5b5b', l: 0.7, x: LX[n.lane] }); }
      while (notesQ.length && t - notesQ[0].t > 1) notesQ.shift();
      press[0] = Math.max(0, press[0] - dt); press[1] = Math.max(0, press[1] - dt);
      power = Math.max(0, power - 0.22 * dt);
      for (let i = fb.length - 1; i >= 0; i--) { fb[i].l -= dt; if (fb[i].l <= 0) fb.splice(i, 1); }
      for (let i = 0; i < riders.length; i++) {
        const r = riders[i]; if (r.fin) { r.v = Math.max(0, r.v - 3 * dt); r.d += r.v * dt; continue; }
        const sl = slope(r.d);
        let tv;
        if (i === 0) tv = 2.5 + 11.5 * Math.min(1.25, power) * (combo >= 12 ? 1.1 : 1);
        else {
          const surge = Math.sin(t * 0.3 + r.off) * 0.9 + Math.sin(t * 0.9 + r.off * 2) * 0.4;
          const rub = (me.d - r.d) * 0.004; // light rubber-banding
          tv = r.base + surge + Math.max(-1, Math.min(1, rub));
        }
        tv = tv - sl * 28 - windV * 2.6;
        tv = Math.max(1.5, tv);
        r.v += (tv - r.v) * Math.min(1, dt * 0.9);
        r.d += r.v * dt;
        r.ph += r.v * dt * 1.6;
        if (r.d >= LEN) { r.fin = true; r.t = t - (r.d - LEN) / Math.max(1, r.v); finished.push(i); }
      }
      if (me.fin && finishT === null) { finishT = 0; }
      score = Math.floor(me.d / 10) + perfects * 5;
      if (!ended) api.score(score);
      if (me.fin) {
        finishT += dt;
        if (finishT > 2.6 && !ended) {
          ended = true;
          const rank = finished.indexOf(0) + 1;
          const bonus = [0, 3000, 2000, 1200, 600][rank] + Math.max(0, Math.round((170 - me.t) * 10)) + perfects * 5 + bestCombo * 10;
          score = bonus; api.score(score); api.end(score);
        }
      }
    }
    function bike(x, y, a, col, ph, lean, me2) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.lineWidth = 2;
      for (const wx of [-17, 17]) {
        ctx.strokeStyle = '#222'; ctx.beginPath(); ctx.arc(wx, -11, 11, 0, 7); ctx.stroke();
        ctx.strokeStyle = '#888'; ctx.lineWidth = 1; ctx.beginPath();
        for (let i = 0; i < 4; i++) { const aa = ph + i * Math.PI / 4; ctx.moveTo(wx + Math.cos(aa) * 10, -11 + Math.sin(aa) * 10); ctx.lineTo(wx - Math.cos(aa) * 10, -11 - Math.sin(aa) * 10); }
        ctx.stroke(); ctx.lineWidth = 2;
      }
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-17, -11); ctx.lineTo(-3, -25); ctx.lineTo(10, -25); ctx.lineTo(17, -11); ctx.moveTo(-3, -25); ctx.lineTo(0, -11); ctx.lineTo(-17, -11); ctx.moveTo(0, -11); ctx.lineTo(10, -25); ctx.stroke();
      // rider
      const px = Math.cos(ph) * 6, py = Math.sin(ph) * 6;
      ctx.strokeStyle = '#2a2a55'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(-3, -30); ctx.lineTo(0 + px, -11 + py - 2); ctx.moveTo(-3, -30); ctx.lineTo(0 - px, -11 - py - 2); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-4, -30); ctx.lineTo(7 + lean * 3, -44); ctx.stroke();
      ctx.strokeStyle = '#ffd7b0'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(7 + lean * 3, -43); ctx.lineTo(12, -27); ctx.stroke();
      ctx.fillStyle = '#ffd7b0'; ctx.beginPath(); ctx.arc(11 + lean * 3, -50, 5, 0, 7); ctx.fill();
      ctx.fillStyle = me2 ? '#fff' : col; ctx.beginPath(); ctx.arc(11 + lean * 3, -52, 5.5, Math.PI, 0); ctx.fill();
      ctx.restore();
    }
    function draw() {
      ctx.save();
      const sky = ctx.createLinearGradient(0, 0, 0, GROUND + 40); sky.addColorStop(0, '#5fb0f5'); sky.addColorStop(1, '#dff1ff');
      ctx.fillStyle = sky; ctx.fillRect(-10, 0, W + 20, 330);
      const cam = me.d;
      // clouds
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      for (let i = 0; i < 4; i++) { const cx = ((i * 140 - cam * 3 - t * 6) % (W + 160) + W + 160) % (W + 160) - 60; ctx.beginPath(); ctx.ellipse(cx, 70 + i * 22, 36, 11, 0, 0, 7); ctx.ellipse(cx + 20, 62 + i * 22, 24, 10, 0, 0, 7); ctx.fill(); }
      // far hills
      ctx.fillStyle = '#a8d5a2'; ctx.beginPath(); ctx.moveTo(-10, 330);
      for (let x = -10; x <= W + 10; x += 10) ctx.lineTo(x, GROUND - 40 - 30 * Math.sin((x + cam * 2.5) * 0.012) - 14 * Math.sin((x + cam * 2.5) * 0.04));
      ctx.lineTo(W + 10, 330); ctx.fill();
      // terrain
      const gy = xw => GROUND - (hgt(xw) - hgt(me.d)) * VS;
      ctx.fillStyle = '#58b05a'; ctx.beginPath(); ctx.moveTo(-10, 340);
      for (let x = -10; x <= W + 10; x += 8) ctx.lineTo(x, gy(cam + (x - 130) / PXM));
      ctx.lineTo(W + 10, 340); ctx.fill();
      ctx.strokeStyle = '#6b6f7a'; ctx.lineWidth = 7; ctx.beginPath();
      for (let x = -10; x <= W + 10; x += 8) { const yy = gy(cam + (x - 130) / PXM) + 1; x < -9 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.setLineDash([12, 14]); ctx.lineDashOffset = (cam * PXM) % 26; ctx.beginPath();
      for (let x = -10; x <= W + 10; x += 8) { const yy = gy(cam + (x - 130) / PXM) + 1; x < -9 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
      ctx.stroke(); ctx.setLineDash([]);
      // finish line
      const fx = 130 + (LEN - cam) * PXM;
      if (fx > -20 && fx < W + 20) { const yy = gy(LEN); for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#111'; ctx.fillRect(fx - 4, yy - 60 + i * 10, 8, 10); } ctx.fillStyle = '#e8453c'; ctx.fillRect(fx - 40, yy - 70, 80, 12); ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FINISH', fx, yy - 64); }
      // trees
      ctx.font = '26px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      for (let k = Math.floor(cam / 22) - 2; k < Math.floor(cam / 22) + 24; k++) { const h = (k * 2654435761 >>> 0) % 5; if (h > 1) continue; const wx = k * 22 + 5; const x = 130 + (wx - cam) * PXM; if (x < -20 || x > W + 20) continue; ctx.fillText(h ? '🌳' : '🌲', x, gy(wx) - 8); }
      // wind streaks
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const sx = ((i * 71 + t * windV * -90 * 1 + (windV > 0 ? 0 : 0)) % (W + 60) + W + 60) % (W + 60) - 30; const sy = 100 + (i * 37 % 110); const L2 = 10 + Math.abs(windV) * 40; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (windV > 0 ? -L2 : L2), sy); ctx.stroke(); }
      // riders (far to near)
      const order = [3, 2, 1, 0];
      for (const i of order) {
        const r = riders[i], x = 130 + (r.d - cam) * PXM, yy = gy(r.d), a = Math.atan(slope(r.d) * -0 + (gy(r.d + 0.7) - gy(r.d - 0.7)) / (1.4 * PXM));
        if (x < -40 || x > W + 40) {
          // offscreen arrow
          ctx.fillStyle = COLS[i]; ctx.font = 'bold 11px sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = x < 0 ? 'left' : 'right'; ctx.fillText(x < 0 ? '◀ ' + NAMES[i] : NAMES[i] + ' ▶', x < 0 ? 6 : W - 6, 160 + i * 18);
          continue;
        }
        bike(x, yy, a, COLS[i], r.ph, Math.min(1, r.v / 12), i === 0);
        ctx.fillStyle = COLS[i]; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(NAMES[i], x, yy - 72);
      }
      ctx.restore();
      // HUD
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, W, 44);
      const rank = 1 + riders.filter((r, i) => i > 0 && (r.fin ? (!me.fin || r.t < me.t) : (!me.fin && r.d > me.d))).length;
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(rank + 'e plaats', 10, 14);
      ctx.font = '12px sans-serif'; ctx.fillText(Math.round(me.v * 3.6) + ' km/u', 10, 32);
      ctx.textAlign = 'right'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('Combo ' + combo, W - 10, 14); ctx.font = '12px sans-serif'; ctx.fillText(Math.max(0, Math.round(LEN - me.d)) + ' m te gaan', W - 10, 32);
      // wind & slope
      const sl = slope(me.d);
      ctx.textAlign = 'center'; ctx.font = 'bold 13px sans-serif';
      const wt = Math.abs(windV) < 0.2 ? 'Windstil' : windV > 0 ? 'Tegenwind ' + '◀'.repeat(1 + Math.floor(Math.abs(windV) * 2.5)) : 'Rugwind ' + '▶'.repeat(1 + Math.floor(Math.abs(windV) * 2.5));
      ctx.fillStyle = windV > 0.2 ? '#ffb4b4' : windV < -0.2 ? '#b4ffc8' : '#fff'; ctx.fillText(wt, W / 2, 14);
      ctx.fillStyle = sl > 0.02 ? '#ffb4b4' : sl < -0.02 ? '#b4ffc8' : '#fff'; ctx.fillText(sl > 0.02 ? 'Bergop' : sl < -0.02 ? 'Bergaf' : 'Vlak', W / 2, 32);
      // progress bar
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(10, 48, W - 20, 6);
      for (let i = 3; i >= 0; i--) { ctx.fillStyle = COLS[i]; ctx.beginPath(); ctx.arc(10 + (W - 20) * Math.min(1, riders[i].d / LEN), 51, i === 0 ? 5 : 3.5, 0, 7); ctx.fill(); }
      // rhythm area
      ctx.fillStyle = '#1b2240'; ctx.fillRect(0, 330, W, H - 330);
      for (let l = 0; l < 2; l++) {
        ctx.fillStyle = l ? 'rgba(80,140,255,.16)' : 'rgba(255,100,100,.16)'; ctx.fillRect(l * W / 2 + 6, 340, W / 2 - 12, H - 350);
      }
      // hit line
      for (let l = 0; l < 2; l++) {
        const p = press[l] > 0;
        ctx.lineWidth = 5; ctx.strokeStyle = p ? '#fff' : (l ? '#6fa0ff' : '#ff7d7d');
        ctx.beginPath(); ctx.arc(LX[l], LY1, 30, 0, 7); ctx.stroke();
        if (p) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill(); }
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(l ? 'R' : 'L', LX[l], LY1);
      }
      for (const n of notesQ) {
        if (n.hit) continue;
        const f = 1 - (n.t - t) / TR; if (f < 0) continue;
        const y = LY0 + (LY1 - LY0) * f;
        ctx.globalAlpha = n.miss ? 0.3 : Math.min(1, f * 3);
        ctx.fillStyle = n.lane ? '#6fa0ff' : '#ff7d7d'; ctx.beginPath(); ctx.arc(LX[n.lane], y, 24, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(LX[n.lane] - 7, y - 8, 7, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
      }
      for (const f of fb) { ctx.globalAlpha = Math.min(1, f.l * 2); ctx.fillStyle = f.c; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(f.s, f.x, LY1 - 46 - (0.7 - f.l) * 30); ctx.globalAlpha = 1; }
      // power meter
      ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(W / 2 - 60, 346, 120, 8);
      ctx.fillStyle = power > 0.9 ? '#7dff9a' : '#ffd23f'; ctx.fillRect(W / 2 - 60, 346, 120 * Math.min(1, power / 1.25), 8);
      ctx.fillStyle = '#9ab'; ctx.font = '10px sans-serif'; ctx.fillText('kracht', W / 2, 364);
      if (t < 2) { ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.fillText('Tik links, rechts, links, rechts...', W / 2, 300); }
      if (me.fin) {
        ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(20, 120, W - 40, 130);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center';
        const rk = finished.indexOf(0) + 1; ctx.fillText('Finish! ' + rk + 'e plaats', W / 2, 155);
        ctx.font = '14px sans-serif'; ctx.fillText('Tijd ' + me.t.toFixed(1) + ' s  |  Perfect ' + perfects + '  |  Beste combo ' + bestCombo, W / 2, 190);
        for (let i = 0; i < finished.length && i < 4; i++) { ctx.fillStyle = COLS[finished[i]]; ctx.fillText((i + 1) + '. ' + NAMES[finished[i]], W / 2, 212 + i * 0); }
      }
    }
    function frame(ts) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.max(0.001, Math.min((ts - (last || ts)) / 1000, 0.05)); last = ts;
      if (!ended) update(dt);
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
