export default {
  id: 'skieen', name: 'Skiën', emoji: '⛷️', hint: 'Sleep links/rechts: slalom door de poortjes, vermijd bomen',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#cfe8ff';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    let dead = false, raf = 0, last = 0, ended = false, endT = 0;
    const HOR = Math.round(H * 0.34), SY = Math.round(H * 0.8), LIM = 270;
    const rnd = (a, b) => a + Math.random() * (b - a);
    let dist = 0, px = 0, tx = 0, speed = 120, timeLeft = 35, t = 0, gates = 0, combo = 0, bestCombo = 0, tumble = 0, score = 0, pop = '', popT = 0, lean = 0, shake = 0;
    const objs = [];
    let nextZ = 160, nextGate = 380, gateSide = 0, gx = 0;
    function gen() {
      while (nextZ < dist + 800) {
        const n = Math.random() < 0.6 ? 1 : 2;
        for (let i = 0; i < n; i++) {
          const x = rnd(-LIM - 60, LIM + 60);
          const nearGate = objs.some(o => o.type === 'gate' && Math.abs(o.z - nextZ) < 30 && Math.abs(o.x - x) < 80);
          if (nearGate) continue;
          objs.push({ type: Math.random() < 0.8 ? 'tree' : 'rock', z: nextZ + rnd(0, 20), x, hit: false });
        }
        nextZ += Math.max(28, 60 - dist * 0.004);
      }
      while (nextGate < dist + 800) {
        const prev = gx;
        gx = Math.max(-190, Math.min(190, prev + rnd(-150, 150)));
        objs.push({ type: 'gate', z: nextGate, x: gx, w: Math.max(60, 105 - nextGate * 0.004), done: false, col: gateSide++ % 2 });
        nextGate += Math.max(210, 330 - nextGate * 0.01);
      }
    }
    const ptrs = new Map(), keys = {};
    const pd = e => { const r = cv.getBoundingClientRect(); ptrs.set(e.pointerId, { x0: (e.clientX - r.left) * W / r.width, t0: tx }); try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const pm = e => { const p = ptrs.get(e.pointerId); if (p) { const r = cv.getBoundingClientRect(); tx = p.t0 + ((e.clientX - r.left) * W / r.width - p.x0) * 1.8; } };
    const pu = e => ptrs.delete(e.pointerId);
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm);
    host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pu);
    const kd = e => { keys[e.key] = true; if (e.key.startsWith('Arrow')) e.preventDefault(); }, ku = e => { keys[e.key] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    api.score(0);
    const spray = [];
    const say = s => { pop = s; popT = 1; };
    function update(dt) {
      t += dt;
      timeLeft -= dt;
      if (timeLeft <= 0) { timeLeft = 0; ended = true; endT = 0; return; }
      if (keys.ArrowLeft || keys.a) tx -= 330 * dt;
      if (keys.ArrowRight || keys.d) tx += 330 * dt;
      tx = Math.max(-LIM, Math.min(LIM, tx));
      const old = px;
      const mv = Math.max(-1, Math.min(1, (tx - px) * 0.08)) * (290 + speed * 0.3) * dt;
      px += mv; px = Math.max(-LIM - 10, Math.min(LIM + 10, px));
      const turn = Math.abs(mv / dt) / 400;
      lean += (Math.max(-1, Math.min(1, mv / dt / 250)) - lean) * Math.min(1, dt * 10);
      const vmax = 240 + Math.min(t * 4.5, 220);
      if (tumble > 0) { tumble -= dt; speed += (40 - speed) * Math.min(1, dt * 5); }
      else speed += ((vmax * (1 - turn * 0.28)) - speed) * Math.min(1, dt * 0.9);
      dist += speed * dt;
      shake = Math.max(0, shake - dt * 3);
      gen();
      for (const o of objs) {
        const dz = o.z - dist;
        if (o.type === 'gate') {
          if (!o.done && dz <= 0) {
            o.done = true;
            if (Math.abs(px - o.x) < o.w / 2) {
              gates++; combo++; bestCombo = Math.max(bestCombo, combo);
              const perfect = Math.abs(px - o.x) < o.w * 0.18;
              timeLeft = Math.min(60, timeLeft + (perfect ? 3 : 2));
              say(perfect ? 'Perfect! +3s' : 'Poort! +2s');
              o.ok = true;
            } else { combo = 0; timeLeft = Math.max(0, timeLeft - 3); say('Gemist! -3s'); o.ok = false; }
          }
        } else if (!o.hit && dz < 8 && dz > -10 && Math.abs(o.x - px) < (o.type === 'tree' ? 22 : 20) && tumble <= 0) {
          o.hit = true; tumble = 0.9; speed *= 0.3; combo = 0; timeLeft = Math.max(0, timeLeft - 2); shake = 1; say(o.type === 'tree' ? 'Boem! -2s' : 'Au! -2s');
          for (let i = 0; i < 14; i++) spray.push({ x: px, y: 0, vx: rnd(-120, 120), vy: rnd(-200, -40), l: 1 });
        }
      }
      while (objs.length && objs[0].z < dist - 60) objs.shift();
      if (speed > 100 && Math.random() < dt * 20) spray.push({ x: px + rnd(-6, 6), y: 0, vx: -lean * 60 + rnd(-30, 30), vy: rnd(-60, -10), l: 0.6 });
      for (let i = spray.length - 1; i >= 0; i--) { const s = spray[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 400 * dt; s.l -= dt * 1.6; if (s.l <= 0) spray.splice(i, 1); }
      if (popT > 0) popT -= dt;
      score = gates * 100 + bestCombo * 20 + Math.floor(dist / 25);
      api.score(score);
      void old;
    }
    const proj = (dz) => 1 / (1 + dz / 130);
    function drawObj(o) {
      const dz = o.z - dist; if (dz < -20 || dz > 780) return;
      const sc = proj(Math.max(dz, -15)), y = HOR + (SY - HOR) * sc, x = W / 2 + (o.x - px) * sc;
      if (o.type === 'tree') {
        const h = 110 * sc, w = 44 * sc;
        ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - w * 0.07, y - h * 0.2, w * 0.14, h * 0.2);
        for (let k = 0; k < 3; k++) {
          ctx.fillStyle = k % 2 ? '#1c7a3c' : '#14632f';
          const by = y - h * 0.15 - k * h * 0.27, ww = w * (1 - k * 0.22);
          ctx.beginPath(); ctx.moveTo(x - ww / 2, by); ctx.lineTo(x, by - h * 0.42); ctx.lineTo(x + ww / 2, by); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.moveTo(x - ww * 0.18, by - h * 0.27); ctx.lineTo(x, by - h * 0.42); ctx.lineTo(x + ww * 0.18, by - h * 0.27); ctx.fill();
        }
      } else if (o.type === 'rock') {
        const r = 18 * sc;
        ctx.fillStyle = '#6b6f7a'; ctx.beginPath(); ctx.ellipse(x, y - r * 0.5, r, r * 0.7, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#9aa0ad'; ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.8, r * 0.5, r * 0.3, 0, 0, 7); ctx.fill();
      } else {
        const wl = (o.x - o.w / 2 - px) * sc + W / 2, wr = (o.x + o.w / 2 - px) * sc + W / 2, h = 70 * sc;
        const col = o.done ? (o.ok ? '#2fd45a' : '#999') : (o.col ? '#2f6bff' : '#ff3b30');
        for (const fx of [wl, wr]) {
          ctx.fillStyle = '#444'; ctx.fillRect(fx - 1.5 * sc, y - h, 3 * sc, h);
          ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(fx, y - h); ctx.lineTo(fx + (fx === wl ? 1 : -1) * 26 * sc, y - h * 0.85); ctx.lineTo(fx, y - h * 0.7); ctx.fill();
        }
        if (!o.done) { ctx.fillStyle = 'rgba(255,60,60,.0)'; }
      }
    }
    function draw() {
      ctx.save();
      if (shake) ctx.translate((Math.random() - 0.5) * 8 * shake, (Math.random() - 0.5) * 8 * shake);
      const sk = ctx.createLinearGradient(0, 0, 0, HOR); sk.addColorStop(0, '#6aa9ee'); sk.addColorStop(1, '#dff0ff');
      ctx.fillStyle = sk; ctx.fillRect(-10, -10, W + 20, HOR + 10);
      ctx.fillStyle = '#9db4d6'; ctx.beginPath(); ctx.moveTo(-10, HOR);
      for (let x = -10; x <= W + 10; x += 15) ctx.lineTo(x, HOR - 34 - 30 * Math.abs(Math.sin((x - px * 0.15) * 0.016 + 0.5)));
      ctx.lineTo(W + 10, HOR); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-10, HOR);
      for (let x = -10; x <= W + 10; x += 15) ctx.lineTo(x, HOR - 14 - 12 * Math.abs(Math.sin((x - px * 0.3) * 0.03 + 2)));
      ctx.lineTo(W + 10, HOR); ctx.fill();
      // snow
      const sg = ctx.createLinearGradient(0, HOR, 0, H); sg.addColorStop(0, '#eef6ff'); sg.addColorStop(1, '#ffffff');
      ctx.fillStyle = sg; ctx.fillRect(-10, HOR, W + 20, H - HOR + 10);
      const base = Math.floor(dist / 50) * 50;
      for (let k = 12; k >= 0; k--) {
        const z = base + k * 50, sc = proj(z - dist), y = HOR + (SY - HOR) * sc;
        if (y < HOR) continue;
        ctx.fillStyle = (Math.floor(z / 50) % 2) ? 'rgba(160,190,230,.18)' : 'rgba(255,255,255,0)';
        const y2 = HOR + (SY - HOR) * proj(z + 50 - dist);
        ctx.fillRect(-10, y2, W + 20, y - y2);
      }
      // slope edges / ski tracks
      ctx.strokeStyle = 'rgba(120,150,200,.35)'; ctx.lineWidth = 2;
      for (const ex of [-LIM - 40, LIM + 40]) { ctx.beginPath(); ctx.moveTo(W / 2 + (ex - px) * 0.0, HOR); ctx.lineTo(W / 2 + (ex - px) * 1, SY); ctx.lineTo(W / 2 + (ex - px) * 1.6, H); ctx.stroke(); }
      const list = objs.slice().sort((a, b) => b.z - a.z);
      for (const o of list) if (o.z - dist > 12) drawObj(o);
      // skier
      const sx = W / 2;
      ctx.save(); ctx.translate(sx, SY);
      if (tumble > 0) ctx.rotate(Math.sin(tumble * 20) * 0.6);
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(0, 4, 18, 6, 0, 0, 7); ctx.fill();
      ctx.rotate(lean * 0.35);
      ctx.strokeStyle = '#d33'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-9, 6); ctx.lineTo(-9, -26); ctx.moveTo(9, 6); ctx.lineTo(9, -26); ctx.stroke();
      ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.moveTo(-9, -10); ctx.lineTo(9, -10); ctx.lineTo(7, -36); ctx.lineTo(-7, -36); ctx.fill();
      ctx.fillStyle = '#ffd7b0'; ctx.beginPath(); ctx.arc(0, -43, 7, 0, 7); ctx.fill();
      ctx.fillStyle = '#2b5fd9'; ctx.beginPath(); ctx.arc(0, -45, 8, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#222'; ctx.fillRect(-6, -46, 12, 3);
      ctx.restore();
      for (const s of spray) { ctx.globalAlpha = Math.max(0, s.l); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx + (s.x - px), SY + s.y, 3, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
      ctx.restore();
      // HUD
      ctx.fillStyle = 'rgba(0,30,70,.55)'; ctx.fillRect(8, 8, 110, 46); ctx.fillRect(W - 118, 8, 110, 46);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(speed * 0.25) + ' km/u', 14, 22); ctx.fillText('Poorten ' + gates, 14, 42);
      ctx.textAlign = 'right'; ctx.fillStyle = timeLeft < 8 && Math.floor(t * 4) % 2 ? '#ff6b6b' : '#fff';
      ctx.fillText('Tijd ' + timeLeft.toFixed(1), W - 14, 22); ctx.fillStyle = '#ffd23f'; ctx.fillText('Combo x' + combo, W - 14, 42);
      if (popT > 0) { ctx.globalAlpha = Math.min(1, popT * 2); ctx.textAlign = 'center'; ctx.font = 'bold 26px sans-serif'; ctx.fillStyle = '#1b3f8f'; ctx.fillText(pop, W / 2, 100); ctx.globalAlpha = 1; }
      if (ended) { ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 32px sans-serif'; ctx.fillText('Tijd is om!', W / 2, H / 2); }
    }
    function frame(ts) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.max(0.001, Math.min((ts - (last || ts)) / 1000, 0.05)); last = ts;
      if (!ended) update(dt);
      else { endT += dt; if (endT > 1.1 && endT < 50) { endT = 99; api.end(score); } }
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
