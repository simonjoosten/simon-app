export default {
  id: 'vliegtuigslalom', name: 'Vliegtuigslalom', emoji: '✈️', hint: 'Sleep om te sturen: vlieg door de ringen, ontwijk de wolkenkrabbers',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#6bb6ff';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    let dead = false, raf = 0, last = 0, ended = false, endT = 0;
    const HZ = H * 0.36, PY0 = H * 0.7, FOC = 170, MAXZ = 1500;
    const rnd = (a, b) => a + Math.random() * (b - a);
    let z = 0, speed = 320, t = 0, px = 0, py = 150, tx = 0, ty = 150, bank = 0, pitch = 0, lives = 3, inv = 0, combo = 0, rings = 0, score = 0, pop = '', popT = 0, shake = 0;
    const objs = [];
    let nextZ = 900, lastGap = 0;
    function gen() {
      while (nextZ < z + MAXZ + 200) {
        const lv = Math.min(1, nextZ / 40000);
        const gapW = 130 - lv * 40;
        let gx = Math.max(-170, Math.min(170, lastGap + rnd(-160, 160))); lastGap = gx;
        const isRing = Math.random() < 0.75;
        // buildings on both sides of gap
        for (let k = 0; k < 4; k++) {
          const lx = gx - gapW / 2 - 35 - k * 70, rx = gx + gapW / 2 + 35 + k * 70;
          if (lx > -330) objs.push({ t: 'b', x: lx, z: nextZ + rnd(-8, 8), w: 62, h: rnd(110, 300), c: Math.floor(rnd(0, 4)) });
          if (rx < 330) objs.push({ t: 'b', x: rx, z: nextZ + rnd(-8, 8), w: 62, h: rnd(110, 300), c: Math.floor(rnd(0, 4)) });
        }
        // some random single towers
        if (Math.random() < 0.5) objs.push({ t: 'b', x: gx + rnd(-30, 30), z: nextZ + 0, w: 40, h: rnd(40, 80), c: 4 });
        if (isRing) objs.push({ t: 'r', x: gx, a: rnd(90, 260), z: nextZ, r: 58 - lv * 14, done: false, ok: false });
        else objs.push({ t: 'r', x: gx, a: rnd(90, 240), z: nextZ + 0, r: 58 - lv * 14, done: false, ok: false });
        nextZ += Math.max(240, 420 - nextZ * 0.004);
      }
    }
    const ptrs = new Map(), keys = {};
    const pd = e => { const r = cv.getBoundingClientRect(); ptrs.set(e.pointerId, { x0: (e.clientX - r.left) * W / r.width, y0: (e.clientY - r.top) * H / r.height, tx: tx, ty: ty }); try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const pm = e => { const p = ptrs.get(e.pointerId); if (p) { const r = cv.getBoundingClientRect(); tx = p.tx + ((e.clientX - r.left) * W / r.width - p.x0) * 1.5; ty = p.ty - ((e.clientY - r.top) * H / r.height - p.y0) * 1.1; } };
    const pu = e => ptrs.delete(e.pointerId);
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm);
    host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pu);
    const kd = e => { keys[e.key] = true; if (e.key.startsWith('Arrow')) e.preventDefault(); }, ku = e => { keys[e.key] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    api.score(0);
    const clouds = Array.from({ length: 8 }, () => ({ x: rnd(-400, 400), a: rnd(250, 500), z: rnd(100, MAXZ) }));
    const say = s => { pop = s; popT = 1; };
    function update(dt) {
      t += dt;
      speed = 320 + Math.min(t * 5, 260);
      z += speed * dt;
      if (keys.ArrowLeft || keys.a) tx -= 300 * dt;
      if (keys.ArrowRight || keys.d) tx += 300 * dt;
      if (keys.ArrowUp || keys.w) ty += 260 * dt;
      if (keys.ArrowDown || keys.s) ty -= 260 * dt;
      tx = Math.max(-230, Math.min(230, tx)); ty = Math.max(25, Math.min(340, ty));
      const ox = px, oy = py;
      px += (tx - px) * Math.min(1, dt * 6); py += (ty - py) * Math.min(1, dt * 6);
      bank += (Math.max(-1, Math.min(1, (px - ox) / dt / 220)) - bank) * Math.min(1, dt * 8);
      pitch += (Math.max(-1, Math.min(1, (py - oy) / dt / 200)) - pitch) * Math.min(1, dt * 8);
      if (inv > 0) inv -= dt;
      shake = Math.max(0, shake - dt * 3);
      if (popT > 0) popT -= dt;
      gen();
      for (const o of objs) {
        const dz = o.z - z;
        if (o.t === 'r') {
          if (!o.done && dz <= 0) {
            o.done = true;
            if (Math.hypot(px - o.x, py - o.a) < o.r - 6) { o.ok = true; rings++; combo++; const pts = 100 * Math.min(combo, 10); score += pts; say(combo > 1 ? 'Ring! x' + combo : 'Ring!'); }
            else { combo = 0; say('Gemist'); }
          }
        } else if (!o.hit && inv <= 0 && dz < 14 && dz > -22 && Math.abs(px - o.x) < o.w / 2 + 12 && py < o.h + 8) {
          o.hit = true; lives--; inv = 1.8; shake = 1; combo = 0; say('Boem!');
          if (lives <= 0) { ended = true; endT = 0; }
        }
      }
      while (objs.length && objs[0].z < z - 80) objs.shift();
      for (const c of clouds) { if (c.z < z) { c.z += MAXZ; c.x = rnd(-400, 400); } }
      const s2 = Math.floor(z / 40) + score;
      api.score(s2);
    }
    const colors = ['#8a97b8', '#6e7fa6', '#a58c8c', '#7ba08f', '#999'];
    function P(ox, a, dz) { const sc = FOC / (FOC + Math.max(dz, -FOC * 0.9)); return [W / 2 + (ox - px) * sc, HZ + (PY0 - HZ) * sc + (py - a) * sc, sc]; }
    function drawBuilding(o) {
      const dz = o.z - z; if (dz < -20 || dz > MAXZ) return;
      const [x1, yg, sc] = P(o.x - o.w / 2, 0, dz), [x2, yt] = P(o.x + o.w / 2, o.h, dz);
      const [fx1, fyg, fsc] = P(o.x - o.w / 2, 0, dz + 70), [fx2, fyt] = P(o.x + o.w / 2, o.h, dz + 70);
      const fog = Math.min(0.85, dz / MAXZ);
      const base = colors[o.c];
      // side face
      ctx.fillStyle = 'rgba(40,50,80,.55)';
      const sideX = (o.x > px) ? [x1, fx1, yg, fyg, yt, fyt] : [x2, fx2, yg, fyg, yt, fyt];
      ctx.fillStyle = base; ctx.fillRect(x1, yt, x2 - x1, yg - yt);
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath();
      ctx.moveTo(sideX[0], sideX[4]); ctx.lineTo(sideX[1], sideX[5]); ctx.lineTo(sideX[1], sideX[3]); ctx.lineTo(sideX[0], sideX[2]); ctx.fill();
      // roof visible if camera above
      if (py > o.h) { ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.moveTo(x1, yt); ctx.lineTo(x2, yt); ctx.lineTo(fx2, fyt); ctx.lineTo(fx1, fyt); ctx.fill(); }
      // windows
      if (sc > 0.18) {
        ctx.fillStyle = 'rgba(255,240,150,.7)';
        const cols = 3, rows = Math.max(2, Math.floor(o.h / 30));
        const ww = (x2 - x1) / (cols * 2 + 1), hh = (yg - yt) / (rows * 2 + 1);
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if ((r * 7 + c * 3 + Math.floor(o.x)) % 3) ctx.fillRect(x1 + ww * (1 + c * 2), yt + hh * (1 + r * 2), ww, hh);
      }
      if (fog > 0) { ctx.fillStyle = 'rgba(190,225,255,' + fog + ')'; ctx.fillRect(x1 - 1, yt - 1, x2 - x1 + 2, yg - yt + 2); }
    }
    function drawRing(o) {
      const dz = o.z - z; if (dz < -FOC * 0.8 || dz > MAXZ) return;
      const [x, y, sc] = P(o.x, o.a, dz), r = o.r * sc;
      const fog = Math.min(0.8, dz / MAXZ);
      ctx.globalAlpha = o.done ? Math.max(0, 0.6 + dz / 120) : 1 - fog * 0.6;
      ctx.lineWidth = Math.max(2, 9 * sc);
      ctx.strokeStyle = o.done ? (o.ok ? '#3cff7a' : '#888') : '#ffd23f';
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
      if (!o.done) { ctx.strokeStyle = '#ff7a1a'; ctx.lineWidth = Math.max(1, 3 * sc); ctx.beginPath(); ctx.arc(x, y, r - 5 * sc, 0, 7); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    function draw() {
      ctx.save();
      if (shake) ctx.translate((Math.random() - 0.5) * 10 * shake, (Math.random() - 0.5) * 10 * shake);
      const sk = ctx.createLinearGradient(0, 0, 0, HZ + 20); sk.addColorStop(0, '#2f7be0'); sk.addColorStop(1, '#cfe9ff');
      ctx.fillStyle = sk; ctx.fillRect(-10, -10, W + 20, HZ + 30);
      // ground
      const gg = ctx.createLinearGradient(0, HZ, 0, H); gg.addColorStop(0, '#9bc7a0'); gg.addColorStop(1, '#4f8a55');
      ctx.fillStyle = gg; ctx.fillRect(-10, HZ, W + 20, H - HZ + 10);
      // road lines
      ctx.strokeStyle = 'rgba(60,70,80,.6)'; ctx.lineWidth = 2;
      for (let k = -3; k <= 3; k++) {
        const wx = k * 120;
        const [fx, fy] = P(wx, 0, 1200), [nx, ny] = P(wx, 0, -FOC * 0.5);
        ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(nx, ny + (nx - fx) * 0); ctx.stroke();
      }
      const zb = Math.floor(z / 120) * 120;
      for (let k = 0; k < 12; k++) { const [, y] = P(0, 0, zb + k * 120 - z); if (y > HZ && y < H + 10) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } }
      // clouds
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      for (const c of clouds) {
        const [x, y, sc] = P(c.x, c.a, c.z - z); if (sc < 0.08 || sc > 1.2) continue;
        ctx.beginPath(); ctx.ellipse(x, y, 60 * sc, 18 * sc, 0, 0, 7); ctx.ellipse(x + 30 * sc, y - 8 * sc, 40 * sc, 16 * sc, 0, 0, 7); ctx.fill();
      }
      const list = objs.slice().sort((a, b) => b.z - a.z);
      for (const o of list) if (o.t === 'b') drawBuilding(o); else drawRing(o);
      // shadow & plane
      if (!ended) {
        const sx = W / 2, sy = PY0;
        const shy = HZ + (PY0 - HZ) + py; // ground shadow at dz=0
        ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(sx, Math.min(H - 6, shy), 28, 6, 0, 0, 7); ctx.fill();
        if (!(inv > 0 && Math.floor(t * 14) % 2)) {
          ctx.save(); ctx.translate(sx, sy); ctx.rotate(bank * 0.6);
          const sq = 1 - Math.abs(pitch) * 0.12;
          ctx.scale(1, sq);
          ctx.fillStyle = '#e8453c'; ctx.beginPath(); ctx.moveTo(-42, 2); ctx.lineTo(0, -10); ctx.lineTo(42, 2); ctx.lineTo(8, 6); ctx.lineTo(-8, 6); ctx.fill();
          ctx.fillStyle = '#f5f5f5'; ctx.beginPath(); ctx.moveTo(-8, 6); ctx.lineTo(0, -14); ctx.lineTo(8, 6); ctx.lineTo(4, 22); ctx.lineTo(-4, 22); ctx.fill();
          ctx.fillStyle = '#e8453c'; ctx.fillRect(-14, 16, 28, 5);
          ctx.fillStyle = '#6cc4ff'; ctx.beginPath(); ctx.ellipse(0, -2, 3.5, 6, 0, 0, 7); ctx.fill();
          ctx.restore();
        }
      }
      ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(8, 8, 120, 28); ctx.fillRect(W - 98, 8, 90, 28);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('Ringen ' + rings + '  x' + Math.max(1, combo), 14, 22);
      ctx.font = '16px serif'; ctx.fillText('❤️'.repeat(Math.max(0, lives)), W - 92, 23);
      if (popT > 0) { ctx.globalAlpha = Math.min(1, popT * 2); ctx.textAlign = 'center'; ctx.font = 'bold 26px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(pop, W / 2, 90); ctx.globalAlpha = 1; }
      if (ended) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 32px sans-serif'; ctx.fillText('Neergestort!', W / 2, H / 2); }
    }
    function frame(ts) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.max(0.001, Math.min((ts - (last || ts)) / 1000, 0.05)); last = ts;
      if (!ended) update(dt);
      else { endT += dt; if (endT > 1.1 && endT < 50) { endT = 99; api.end(Math.floor(z / 40) + score); } }
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
