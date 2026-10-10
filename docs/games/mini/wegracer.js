export default {
  id: 'wegracer', name: 'Wegracer', emoji: '🏁', hint: 'Sleep om te sturen, houd ⚡ ingedrukt voor nitro',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#000';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    let dead = false, raf = 0, last = 0, ended = false;
    const HOR = Math.round(H * 0.4), R = H - HOR;
    const ctr = new Float32Array(R + 2), hwA = new Float32Array(R + 2);
    let dist = 0, speed = 20, px = 0, lives = 3, nitro = 40, nitroOn = false, t = 0, spawnT = 1, hitT = 0, shake = 0;
    let passed = 0, score = 0, lastLane = 0, endT = 0;
    const cars = [];
    const keys = {};
    const curv = z => { const d = dist + z; return (Math.sin(d * 0.0055) * 0.9 + Math.sin(d * 0.0021 + 2) * 0.8) * Math.min(1, 0.5 + t / 60); };
    const btn = { x: W - 52, y: H - 70, r: 36 };
    const ptrs = new Map();
    const toXY = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
    const pd = e => {
      const [x, y] = toXY(e);
      if (Math.hypot(x - btn.x, y - btn.y) < btn.r + 14) ptrs.set(e.pointerId, { nitro: true });
      else ptrs.set(e.pointerId, { x0: x, px0: px });
      try { host.setPointerCapture(e.pointerId); } catch (_) {}
    };
    const pm = e => { const p = ptrs.get(e.pointerId); if (p && !p.nitro) { const [x] = toXY(e); px = Math.max(-1.4, Math.min(1.4, p.px0 + (x - p.x0) / W * 3.2)); } };
    const pu = e => ptrs.delete(e.pointerId);
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm);
    host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pu);
    const kd = e => { keys[e.key] = true; if (e.key === ' ') e.preventDefault(); }, ku = e => { keys[e.key] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    api.score(0);

    function spawn() {
      const lanes = [-0.66, 0, 0.66];
      let l = lanes[Math.floor(Math.random() * 3)];
      if (l === lastLane && Math.random() < 0.5) l = lanes[Math.floor(Math.random() * 3)];
      lastLane = l;
      const cols = ['#e63946', '#f1c40f', '#2ecc71', '#9b59b6', '#ecf0f1', '#ff8c00'];
      cars.push({ x: l, z: 230, v: 16 + Math.random() * 14, c: cols[Math.floor(Math.random() * cols.length)], done: false });
    }
    function update(dt) {
      t += dt;
      nitroOn = !!keys[' '] || [...ptrs.values()].some(p => p.nitro);
      if (nitroOn && nitro <= 0) nitroOn = false;
      if (nitroOn) nitro = Math.max(0, nitro - 28 * dt);
      const steer = (keys.ArrowLeft || keys.a ? -1 : 0) + (keys.ArrowRight || keys.d ? 1 : 0);
      px += steer * 1.8 * dt;
      px -= curv(10) * (speed / 60) * 0.9 * dt;
      px = Math.max(-1.5, Math.min(1.5, px));
      const off = Math.abs(px) > 1.02;
      let maxV = 46 + Math.min(t * 0.35, 22);
      if (nitroOn) maxV = 88;
      if (off) maxV = 18;
      if (speed < maxV) speed += (nitroOn ? 40 : 14) * dt; else speed -= (off ? 40 : 14) * dt;
      if (hitT > 0) hitT -= dt;
      shake = Math.max(0, shake - dt * 3);
      dist += speed * dt;
      spawnT -= dt;
      if (spawnT <= 0) {
        spawn();
        if (t > 25 && Math.random() < 0.35) spawn();
        spawnT = Math.max(0.45, 1.5 - t * 0.012) * (0.7 + Math.random() * 0.6);
      }
      for (let i = cars.length - 1; i >= 0; i--) {
        const c = cars[i];
        c.z -= (speed - c.v) * dt;
        if (c.z < -3 && !c.done) { c.done = true; passed++; nitro = Math.min(100, nitro + 7); }
        if (c.z < -30 || c.z > 400) { cars.splice(i, 1); continue; }
        if (!c.done && hitT <= 0 && c.z < 4 && c.z > -3 && Math.abs(c.x - px) < 0.36) {
          lives--; hitT = 1.6; shake = 1; speed *= 0.35; c.done = true;
          if (lives <= 0) { ended = true; endT = 0; }
        }
      }
      score = Math.floor(dist / 8) + passed * 25;
      api.score(score);
    }
    function carShape(x, y, w, col, flame) {
      const h = w * 0.62;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x - w * 0.55, y - h * 0.08, w * 1.1, h * 0.14);
      ctx.fillStyle = '#111'; ctx.fillRect(x - w * 0.5, y - h * 0.3, w * 0.18, h * 0.3); ctx.fillRect(x + w * 0.32, y - h * 0.3, w * 0.18, h * 0.3);
      ctx.fillStyle = col; ctx.fillRect(x - w * 0.5, y - h * 0.75, w, h * 0.55);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - w * 0.5, y - h * 0.3, w, h * 0.1);
      ctx.fillStyle = col; ctx.fillRect(x - w * 0.36, y - h, w * 0.72, h * 0.3);
      ctx.fillStyle = '#9fd3ff'; ctx.fillRect(x - w * 0.3, y - h * 0.95, w * 0.6, h * 0.2);
      ctx.fillStyle = '#ff2030'; ctx.fillRect(x - w * 0.46, y - h * 0.6, w * 0.16, h * 0.12); ctx.fillRect(x + w * 0.3, y - h * 0.6, w * 0.16, h * 0.12);
      if (flame) { ctx.fillStyle = '#ffb020'; ctx.beginPath(); ctx.moveTo(x - w * 0.15, y - h * 0.2); ctx.lineTo(x, y + h * (0.3 + Math.random() * 0.5)); ctx.lineTo(x + w * 0.15, y - h * 0.2); ctx.fill(); }
    }
    function draw() {
      const sx = shake ? (Math.random() - 0.5) * 8 * shake : 0;
      ctx.save(); ctx.translate(sx, 0);
      const g = ctx.createLinearGradient(0, 0, 0, HOR);
      g.addColorStop(0, '#2a6fd6'); g.addColorStop(1, '#bfe4ff');
      ctx.fillStyle = g; ctx.fillRect(-10, 0, W + 20, HOR + 1);
      ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(W * 0.72, HOR * 0.55, 26, 0, 7); ctx.fill();
      const hOff = (Math.sin(dist * 0.0006) * 40 + dist * 0.0) ;
      ctx.fillStyle = '#6b86b8'; ctx.beginPath(); ctx.moveTo(-10, HOR);
      for (let x = -10; x <= W + 10; x += 20) ctx.lineTo(x, HOR - 28 - 22 * Math.abs(Math.sin((x + hOff) * 0.02 + 1)));
      ctx.lineTo(W + 10, HOR); ctx.fill();
      // rows
      let cum = 0, off = 0;
      for (let i = R; i >= 1; i--) {
        const p = i / R, z = 8 / Math.max(p, 0.04);
        cum += curv(z) / R * 1.1; off += cum / R;
        hwA[i] = W * (0.012 + 0.505 * p);
        ctr[i] = W / 2 + Math.max(-W, Math.min(W, off * W * 1.5)) * (1 - 0) - px * hwA[i];
      }
      for (let i = 1; i <= R; i++) {
        const p = i / R, z = 8 / Math.max(p, 0.04), y = HOR + i, c = ctr[i], hw = hwA[i];
        const s = Math.floor((dist + z) / 14) % 2;
        ctx.fillStyle = s ? '#2e9e44' : '#35b04e'; ctx.fillRect(-10, y, W + 20, 1.2);
        ctx.fillStyle = s ? '#e8e8e8' : '#d62828'; ctx.fillRect(c - hw * 1.14, y, hw * 2.28, 1.2);
        ctx.fillStyle = s ? '#4b4f5a' : '#51556a'; ctx.fillRect(c - hw, y, hw * 2, 1.2);
        if (Math.floor((dist + z) / 9) % 2 === 0) {
          ctx.fillStyle = '#f2f2f2';
          const lw = Math.max(1, hw * 0.025);
          ctx.fillRect(c - hw * 0.33 - lw, y, lw * 2, 1.2); ctx.fillRect(c + hw * 0.33 - lw, y, lw * 2, 1.2);
        }
      }
      // sprites
      const sp = [];
      const k0 = Math.floor(dist / 32);
      for (let n = 1; n < 8; n++) {
        const k = k0 + n, z = k * 32 - dist;
        if (z < 4 || z > 220) continue;
        sp.push({ z, tree: true, side: k % 2 ? -1 : 1, k });
      }
      for (const c of cars) if (c.z > -2 && c.z < 220) sp.push({ z: c.z, car: c });
      sp.sort((a, b) => b.z - a.z);
      for (const o of sp) {
        const cz = o.z + 8, p = Math.min(1, 8 / cz), i = Math.max(1, Math.min(R, Math.round(p * R)));
        const y = HOR + i, hw = hwA[i], c = ctr[i];
        if (o.tree) {
          const x = c + o.side * hw * (1.45 + (o.k % 3) * 0.25), h = hw * 0.9;
          ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - h * 0.05, y - h * 0.3, h * 0.1, h * 0.3);
          ctx.fillStyle = '#146b32'; ctx.beginPath(); ctx.moveTo(x - h * 0.25, y - h * 0.25); ctx.lineTo(x, y - h); ctx.lineTo(x + h * 0.25, y - h * 0.25); ctx.fill();
        } else {
          const c2 = o.car; carShape(c + c2.x * hw, y, hw * 0.4, c2.c, false);
        }
      }
      // player
      if (!(hitT > 0 && Math.floor(t * 12) % 2)) carShape(W / 2, H - 22, 82, '#00a8ff', nitroOn);
      ctx.restore();
      // HUD
      ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(8, 8, 118, 28);
      ctx.fillStyle = '#fff'; ctx.fillText(Math.round(speed * 3.6) + ' km/u', 14, 14);
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(W - 98, 8, 90, 28);
      ctx.font = '16px serif'; ctx.fillText('❤️'.repeat(Math.max(0, lives)), W - 92, 12);
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(10, H - 30, 150, 14);
      ctx.fillStyle = nitroOn ? '#ffd23f' : '#00d4ff'; ctx.fillRect(12, H - 28, 146 * nitro / 100, 10);
      ctx.beginPath(); ctx.arc(btn.x, btn.y, btn.r, 0, 7);
      ctx.fillStyle = nitroOn ? '#ffb020' : 'rgba(255,255,255,.25)'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.font = '30px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText('⚡', btn.x, btn.y + 1);
      if (ended) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.font = 'bold 34px sans-serif'; ctx.fillText('💥 Crash!', W / 2, H / 2); }
    }
    function frame(ts) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.max(0.001, Math.min((ts - (last || ts)) / 1000, 0.05)); last = ts;
      if (!ended) update(dt);
      else if (ended !== 'done') { endT += dt; speed = Math.max(0, speed - 40 * dt); if (endT > 0.9) { ended = 'done'; api.end(score); } }
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
