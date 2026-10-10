export default {
  id: 'kartslinger', name: 'Kartslinger', emoji: '🏎️', hint: 'Links/rechts sturen, houd DRIFT vast in bochten en laat los voor turbo',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#2c8a3e';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    let dead = false, raf = 0, last = 0, ended = false, endT = 0;
    const LAPS = 3, TW = 88;
    // --- track ---
    const CP = [[0, 0], [420, -50], [820, 40], [1010, 330], [800, 600], [470, 520], [330, 800], [-40, 930], [-420, 720], [-320, 420], [-560, 150], [-330, -130]];
    const pts = [];
    for (let i = 0; i < CP.length; i++) {
      const p0 = CP[(i + CP.length - 1) % CP.length], p1 = CP[i], p2 = CP[(i + 1) % CP.length], p3 = CP[(i + 2) % CP.length];
      for (let s = 0; s < 40; s++) {
        const u = s / 40, u2 = u * u, u3 = u2 * u;
        const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
        pts.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    const N = pts.length;
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (const p of pts) { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
    const pads = [60, 190, 300, 400].map(i => i % N);
    // --- state ---
    const k = { x: pts[3][0], y: pts[3][1], h: Math.atan2(pts[6][1] - pts[3][1], pts[6][0] - pts[3][0]), vx: 0, vy: 0 };
    let idx = 3, lap = 1, lapT = 0, totalT = 0, bestLap = Infinity, cpMask = 0, countdown = 3.2, steer = 0, drifting = false, charge = 0, boost = 0, hitMsg = '', msgT = 0, skid = [], rec = [], recT = 0, ghost = null, shake = 0, offT = 0, finishedT = 0, score = 0, lapFlash = '';
    const keys = {}, ptrs = new Map();
    const dz = { x0: W * 0.3, x1: W * 0.7, y0: H - 120 };
    const toXY = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
    const zone = (x, y) => (x > dz.x0 && x < dz.x1 && y > dz.y0) ? 'd' : x < W * 0.5 ? 'l' : 'r';
    const pd = e => { const [x, y] = toXY(e); ptrs.set(e.pointerId, zone(x, y)); try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const pm = e => { if (ptrs.has(e.pointerId)) { const [x, y] = toXY(e); ptrs.set(e.pointerId, zone(x, y)); } };
    const pu = e => ptrs.delete(e.pointerId);
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm);
    host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pu);
    const kd = e => { keys[e.key] = true; if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault(); }, ku = e => { keys[e.key] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    api.score(0);
    const say = s => { hitMsg = s; msgT = 1.4; };
    const fmt = s => { const m = Math.floor(s / 60); return m + ':' + (s % 60 < 10 ? '0' : '') + (s % 60).toFixed(2); };
    function nearest() {
      let best = 1e12, bi = idx;
      for (let d = -30; d <= 30; d++) {
        const i = (idx + d + N) % N, dx = pts[i][0] - k.x, dy = pts[i][1] - k.y, q = dx * dx + dy * dy;
        if (q < best) { best = q; bi = i; }
      }
      return [bi, Math.sqrt(best)];
    }
    function update(dt) {
      if (countdown > 0) { countdown -= dt; return; }
      lapT += dt; totalT += dt; msgT = Math.max(0, msgT - dt); shake = Math.max(0, shake - dt * 3);
      const vals = [...ptrs.values()];
      const L = keys.ArrowLeft || keys.a || vals.includes('l'), R = keys.ArrowRight || keys.d || vals.includes('r');
      const D = !!(keys[' '] || keys.Shift || vals.includes('d'));
      const st = (R ? 1 : 0) - (L ? 1 : 0);
      steer += (st - steer) * Math.min(1, dt * 10);
      const sp = Math.hypot(k.vx, k.vy);
      const canDrift = D && sp > 120 && Math.abs(steer) > 0.2;
      if (canDrift) { if (!drifting) { drifting = true; charge = 0; } charge += dt; }
      else if (drifting) {
        if (charge > 1.6) { boost = 1.5; say('Mega turbo!'); } else if (charge > 0.8) { boost = 0.9; say('Turbo!'); }
        drifting = false; charge = 0;
      }
      if (!D && drifting) drifting = false;
      const turn = (drifting ? 2.9 : 2.1) * Math.min(1, sp / 90) * (drifting ? (0.55 + 0.45 * Math.abs(steer)) * Math.sign(steer || 1) : steer);
      k.h += turn * dt;
      const dirx = Math.cos(k.h), diry = Math.sin(k.h);
      let f = k.vx * dirx + k.vy * diry, l = -k.vx * diry + k.vy * dirx;
      const [ni, dist] = nearest();
      // progress
      const diffIdx = ((ni - idx + N + N / 2) % N) - N / 2;
      if (Math.abs(diffIdx) < 40) {
        const prev = idx; idx = ni;
        const q = Math.floor(idx / N * 4); if (q >= 1) cpMask |= (1 << q);
        if (prev > N * 0.85 && idx < N * 0.15 && diffIdx > 0) {
          if ((cpMask & 14) === 14) lapDone();
          cpMask = 0;
        }
      }
      const onTrack = dist < TW / 2 + 4;
      for (const pi of pads) { const dd = ((idx - pi + N * 1.5) % N) - N / 2; if (Math.abs(dd) < 4 && dist < TW / 2) { if (boost < 0.7) boost = 0.7; } }
      if (boost > 0) boost -= dt;
      let vmax = (onTrack ? 235 : 120) * (boost > 0 ? 1.45 : 1);
      const accel = boost > 0 ? 500 : 190;
      f += (f < vmax ? accel : -260) * dt;
      f = Math.min(f, vmax * 1.05);
      if (!onTrack) f -= f * 0.8 * dt;
      const grip = drifting ? 1.7 : (onTrack ? 9 : 5);
      l *= Math.exp(-grip * dt);
      const dx2 = dirx, dy2 = diry;
      k.vx = dirx * f - diry * l; k.vy = diry * f + dirx * l;
      k.x += k.vx * dt; k.y += k.vy * dt;
      if (drifting && sp > 100) { skid.push([k.x - dx2 * 8 + dy2 * 7, k.y - dy2 * 8 - dx2 * 7], [k.x - dx2 * 8 - dy2 * 7, k.y - dy2 * 8 + dx2 * 7]); if (skid.length > 260) skid.splice(0, 2); }
      if (dist > TW / 2 + 260) { // lost: put back
        const p = pts[idx]; k.x = p[0]; k.y = p[1]; k.vx = k.vy = 0; const q = pts[(idx + 3) % N]; k.h = Math.atan2(q[1] - p[1], q[0] - p[0]); say('Terug op de baan'); lapT += 3; totalT += 3;
      }
      recT += dt;
      while (recT >= 0.05) { recT -= 0.05; rec.push([k.x, k.y, k.h]); }
      if (!ended) { score = Math.round(((lap - 1) + idx / N) / LAPS * 3000); api.score(score); }
    }
    function lapDone() {
      const lt = lapT;
      if (lt < bestLap) { bestLap = lt; ghost = rec.slice(); say('Beste ronde! ' + fmt(lt)); } else say('Ronde ' + fmt(lt));
      lapFlash = fmt(lt);
      rec = []; recT = 0;
      if (lap >= LAPS) {
        ended = true; endT = 0;
        score = 3000 + Math.max(0, Math.round(14000 - totalT * 120));
        api.score(score);
      } else { lap++; lapT = 0; }
    }
    function drawKart(x, y, h, body, a) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(h); ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-14, -9, 30, 20);
      ctx.fillStyle = '#222'; ctx.fillRect(-14, -12, 10, 6); ctx.fillRect(-14, 6, 10, 6); ctx.fillRect(7, -12, 9, 6); ctx.fillRect(7, 6, 9, 6);
      ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(-14, -7); ctx.lineTo(10, -6); ctx.lineTo(19, -2); ctx.lineTo(19, 2); ctx.lineTo(10, 6); ctx.lineTo(-14, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(-4, -1.5, 12, 3);
      ctx.fillStyle = '#ffd7b0'; ctx.beginPath(); ctx.arc(-2, 0, 5, 0, 7); ctx.fill();
      ctx.fillStyle = '#1e47c4'; ctx.beginPath(); ctx.arc(-2, 0, 5.5, Math.PI * 0.6, Math.PI * 1.9); ctx.fill();
      ctx.restore(); ctx.globalAlpha = 1;
    }
    function draw() {
      ctx.save();
      if (shake) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
      ctx.fillStyle = '#2f9444'; ctx.fillRect(-10, -10, W + 20, H + 20);
      const camx = k.x + k.vx * 0.25, camy = k.y + k.vy * 0.25 - 40;
      ctx.translate(W / 2 - camx, H / 2 - camy);
      // grass squares
      const gs = 90, gx0 = Math.floor((camx - W / 2) / gs) * gs, gy0 = Math.floor((camy - H / 2) / gs) * gs;
      ctx.fillStyle = '#2a8a3e';
      for (let gx = gx0; gx < camx + W / 2 + gs; gx += gs) for (let gy = gy0; gy < camy + H / 2 + gs; gy += gs) if (((gx / gs) + (gy / gs)) & 1) ctx.fillRect(gx, gy, gs, gs);
      const path = () => { ctx.beginPath(); for (let i = 0; i <= N; i++) { const p = pts[i % N]; i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } };
      ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
      path(); ctx.lineWidth = TW + 20; ctx.strokeStyle = '#e8e8e8'; ctx.stroke();
      path(); ctx.lineWidth = TW + 20; ctx.strokeStyle = '#d63030'; ctx.setLineDash([22, 22]); ctx.stroke(); ctx.setLineDash([]);
      path(); ctx.lineWidth = TW; ctx.strokeStyle = '#4a4d57'; ctx.stroke();
      path(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.setLineDash([16, 18]); ctx.stroke(); ctx.setLineDash([]);
      // pads
      for (const pi of pads) {
        const p = pts[pi], q = pts[(pi + 1) % N], a = Math.atan2(q[1] - p[1], q[0] - p[0]);
        ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(a); ctx.fillStyle = 'rgba(255,200,0,.9)'; ctx.fillRect(-14, -22, 28, 44);
        ctx.strokeStyle = '#7a4a00'; ctx.lineWidth = 3; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 8 - 4, -10); ctx.lineTo(i * 8 + 4, 0); ctx.lineTo(i * 8 - 4, 10); ctx.stroke(); }
        ctx.restore();
      }
      // start line
      { const p = pts[0], q = pts[1], a = Math.atan2(q[1] - p[1], q[0] - p[0]);
        ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(a);
        for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) & 1 ? '#fff' : '#111'; ctx.fillRect(j * 8 - 8, -TW / 2 + i * (TW / 8), 8, TW / 8); }
        ctx.restore(); }
      // skid marks
      ctx.fillStyle = 'rgba(20,20,25,.45)';
      for (const s of skid) ctx.fillRect(s[0] - 1.5, s[1] - 1.5, 3, 3);
      // ghost
      if (ghost && !ended) { const gi = Math.floor(lapT / 0.05); if (gi < ghost.length) { const g = ghost[gi]; drawKart(g[0], g[1], g[2], '#9ad7ff', 0.5); } }
      // sparks
      const dx2 = Math.cos(k.h), dy2 = Math.sin(k.h);
      if (drifting) {
        ctx.fillStyle = charge > 1.6 ? '#ff5be0' : charge > 0.8 ? '#ffb020' : '#7fd6ff';
        for (let i = 0; i < 6; i++) { const sx = k.x - dx2 * 12 + (Math.random() - 0.5) * 18, sy = k.y - dy2 * 12 + (Math.random() - 0.5) * 18; ctx.fillRect(sx, sy, 3, 3); }
      }
      if (boost > 0) { ctx.fillStyle = '#ffb020'; ctx.beginPath(); ctx.moveTo(k.x - dx2 * 14 - dy2 * 4, k.y - dy2 * 14 + dx2 * 4); ctx.lineTo(k.x - dx2 * (26 + Math.random() * 16), k.y - dy2 * (26 + Math.random() * 16)); ctx.lineTo(k.x - dx2 * 14 + dy2 * 4, k.y - dy2 * 14 - dx2 * 4); ctx.fill(); }
      drawKart(k.x, k.y, k.h, '#e8453c', 1);
      ctx.restore();
      // minimap
      const mw = 78, ms = Math.min(mw / (maxX - minX), 100 / (maxY - minY)), mx0 = W - mw - 10, my0 = 58;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(mx0 - 4, my0 - 4, mw + 8, (maxY - minY) * ms + 8);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= N; i += 4) { const p = pts[i % N], X = mx0 + (p[0] - minX) * ms, Y = my0 + (p[1] - minY) * ms; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.stroke();
      ctx.fillStyle = '#ff3b30'; ctx.beginPath(); ctx.arc(mx0 + (k.x - minX) * ms, my0 + (k.y - minY) * ms, 4, 0, 7); ctx.fill();
      // HUD
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(8, 8, 150, 62);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('Ronde ' + Math.min(lap, LAPS) + '/' + LAPS, 14, 22);
      ctx.fillText(fmt(lapT), 14, 40);
      ctx.font = '12px sans-serif'; ctx.fillStyle = '#ffd23f'; ctx.fillText('Beste: ' + (bestLap < 1e8 ? fmt(bestLap) : '--'), 14, 58);
      ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(dz.x0, dz.y0 + 20, dz.x1 - dz.x0, H - dz.y0 - 30);
      ctx.fillStyle = drifting ? (charge > 1.6 ? '#ff5be0' : charge > 0.8 ? '#ffb020' : '#7fd6ff') : '#fff';
      ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('DRIFT', W / 2, H - 60);
      if (drifting) { ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(dz.x0 + 10, H - 42, dz.x1 - dz.x0 - 20, 8); ctx.fillStyle = '#ffb020'; ctx.fillRect(dz.x0 + 10, H - 42, (dz.x1 - dz.x0 - 20) * Math.min(1, charge / 1.6), 8); }
      ctx.globalAlpha = 0.5; ctx.fillStyle = '#fff'; ctx.font = 'bold 30px sans-serif'; ctx.fillText('◀', 36, H - 50); ctx.fillText('▶', W - 36, H - 50); ctx.globalAlpha = 1;
      if (msgT > 0) { ctx.globalAlpha = Math.min(1, msgT * 2); ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.strokeText(hitMsg, W / 2, 120); ctx.fillText(hitMsg, W / 2, 120); ctx.globalAlpha = 1; }
      if (countdown > 0) { ctx.font = 'bold 80px sans-serif'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 6; const c = countdown > 0.2 ? String(Math.ceil(Math.min(3, countdown))) : 'GO'; ctx.strokeText(c, W / 2, H * 0.4); ctx.fillText(c, W / 2, H * 0.4); }
      if (ended) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, H / 2 - 70, W, 140); ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('Finish!', W / 2, H / 2 - 30); ctx.font = '18px sans-serif'; ctx.fillText('Totaal ' + fmt(totalT), W / 2, H / 2 + 4); ctx.fillText('Beste ronde ' + fmt(bestLap), W / 2, H / 2 + 32); }
    }
    function frame(ts) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.max(0.001, Math.min((ts - (last || ts)) / 1000, 0.05)); last = ts;
      if (!ended) update(dt);
      else { endT += dt; k.vx *= 0.98; k.vy *= 0.98; k.x += k.vx * dt; k.y += k.vy * dt; if (endT > 2.4 && endT < 50) { endT = 99; api.end(score); } }
      draw();
    }
    raf = requestAnimationFrame(frame);
    return { destroy() {
      dead = true; cancelAnimationFrame(raf);
      host.removeEventListener('pointerdown', pd); host.removeEventListener('pointermove', pm);
      host.removeEventListener('pointerup', pu); host.removeEventListener('pointercancel', pu);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      cv.remove();
    } };
  },
};
