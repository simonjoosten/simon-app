export default {
  id: 'ninjasprong',
  name: 'Ninjasprong',
  emoji: '🥷',
  hint: 'Tik om naar de andere muur te springen',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#1b1026';
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const WT = 34, LX = WT, RX = W - WT, NY = H * 0.68;
    let side = 0, jump = -1, jumpFrom = 0; // jump: -1 = op muur, anders 0..1
    const JD = 0.3;
    let spikes = [], stars = [], fx = [], stone = [], texts = [];
    let height = 0, speed = 150, time = 0, nextSpike = -100, shurT = 2, near = 0, bonus = 0;
    for (let i = 0; i < 30; i++) stars.push({ x: WT + Math.random() * (W - 2 * WT), y: Math.random() * H, s: Math.random() * 1.5 + 0.3 });
    for (let i = 0; i < 12; i++) stone.push(i * 60);
    let shur = [];
    let dead = false, over = false, raf = 0, last = 0, tilt = 0;

    function nx() {
      if (jump < 0) return side === 0 ? LX + 8 : RX - 8;
      const e = jump < 0.5 ? 2 * jump * jump : 1 - Math.pow(-2 * jump + 2, 2) / 2;
      const a = jumpFrom === 0 ? LX + 8 : RX - 8, b = jumpFrom === 0 ? RX - 8 : LX + 8;
      return a + (b - a) * e;
    }
    function ny() { return NY - (jump < 0 ? 0 : Math.sin(jump * Math.PI) * 50); }
    function doJump() {
      if (over || jump >= 0) return;
      jump = 0; jumpFrom = side;
      for (let i = 0; i < 6; i++) fx.push({ x: nx(), y: ny(), vx: (Math.random() - 0.5) * 80, vy: Math.random() * 60, t: 0.4, c: '#ddd' });
    }
    function onDown(e) { doJump(); e.preventDefault(); }
    function onKey(e) {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Enter') {
        if (!e.repeat) { if (e.key === 'ArrowLeft' && side === 0) return; if (e.key === 'ArrowRight' && side === 1) return; doJump(); }
        e.preventDefault();
      }
    }
    cv.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);

    function die(why) {
      if (over) return;
      over = true;
      for (let i = 0; i < 28; i++) { const a = Math.random() * 6.28, s = 60 + Math.random() * 200; fx.push({ x: nx(), y: ny(), vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.8, c: '#ff4d6d' }); }
      api.end(Math.floor(height / 10) + bonus);
    }
    function spawnSpike() {
      const sd = Math.random() < 0.5 ? 0 : 1;
      const len = 70 + Math.random() * 40;
      spikes.push({ side: sd, y: -len, h: len });
      if (height > 2500 && Math.random() < 0.3) spikes.push({ side: 1 - sd, y: -len - 190, h: 60 });
    }

    function update(dt) {
      time += dt;
      speed = Math.min(330, 150 + height / 60);
      height += speed * dt;
      if (jump >= 0) {
        jump += dt / JD;
        if (jump >= 1) { jump = -1; side = 1 - jumpFrom; }
      }
      const mv = speed * dt;
      nextSpike += mv;
      if (nextSpike > 0) { spawnSpike(); nextSpike = -(210 + Math.random() * 130 + Math.max(0, 110 - height / 100)); }
      for (const s of spikes) s.y += mv;
      spikes = spikes.filter((s) => s.y < H + 50);
      for (let i = 0; i < stone.length; i++) { stone[i] += mv; if (stone[i] > H + 20) stone[i] -= 720; }
      for (const s of stars) { s.y += mv * 0.2 * s.s; if (s.y > H) { s.y = 0; s.x = WT + Math.random() * (W - 2 * WT); } }
      // spikes botsen
      const px = nx(), py = ny();
      const phase = jump < 0 ? 0 : jump;
      const onWall = jump < 0 || phase < 0.12 || phase > 0.88;
      if (onWall) {
        const sd = jump < 0 ? side : (phase < 0.12 ? jumpFrom : 1 - jumpFrom);
        for (const s of spikes) if (s.side === sd && py + 14 > s.y && py - 14 < s.y + s.h) die();
      }
      // shuriken
      shurT -= dt;
      if (shurT <= 0) {
        const lv = Math.min(1, height / 8000);
        shurT = Math.max(0.55, 1.9 - lv * 1.4) + Math.random() * 0.8;
        const n = height > 3500 && Math.random() < 0.35 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const fromL = Math.random() < 0.5;
          const ty = NY - 40 + Math.random() * 180;
          const vx = (fromL ? 1 : -1) * (150 + lv * 130);
          const t = (W - 2 * WT) / Math.abs(vx);
          shur.push({ x: fromL ? WT : W - WT, y: -20 - i * 60, vx, vy: (ty + 20) / t * 0.5 + 70, ang: 0, warn: 0.5 });
        }
      }
      for (const s of shur) {
        s.warn -= dt; s.x += s.vx * dt; s.y += (s.vy + speed * 0.5) * dt; s.ang += dt * 14;
        if (Math.hypot(s.x - px, s.y - py) < 20 && !over) die();
        if (!s.passed && ((s.vx > 0 && s.x > px + 20) || (s.vx < 0 && s.x < px - 20)) && s.y > py - 60 && s.y < py + 60) {
          s.passed = true; bonus += 5; near++; texts.push({ x: px, y: py - 30, s: 'Net!', t: 0.6 });
        }
      }
      shur = shur.filter((s) => s.x > -30 && s.x < W + 30 && s.y < H + 30);
      for (const f of fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.t -= dt; }
      fx = fx.filter((f) => f.t > 0);
      for (const t of texts) { t.y -= 30 * dt; t.t -= dt; }
      texts = texts.filter((t) => t.t > 0);
      tilt += (((jump < 0 ? 0 : (jumpFrom === 0 ? 1 : -1)) * 0.5) - tilt) * 0.3;
      api.score(Math.floor(height / 10) + bonus);
    }

    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#2a0f3d'); g.addColorStop(1, '#5a2a54');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(W / 2, H * 0.2, 36, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (const s of stars) ctx.fillRect(s.x, s.y, s.s, s.s);
      for (const [x0, x1] of [[0, WT], [W - WT, W]]) {
        ctx.fillStyle = '#3b2a2a'; ctx.fillRect(x0, 0, x1 - x0, H);
        ctx.fillStyle = '#5a4040';
        for (const y of stone) { ctx.fillRect(x0 + 2, y, x1 - x0 - 4, 28); ctx.fillStyle = '#4a3434'; ctx.fillRect(x0 + 2, y + 28, x1 - x0 - 4, 2); ctx.fillStyle = '#5a4040'; }
      }
      ctx.fillStyle = '#c9c9d4';
      for (const s of spikes) {
        const n = Math.max(2, Math.round(s.h / 24)), step = s.h / n;
        for (let i = 0; i < n; i++) {
          ctx.beginPath();
          if (s.side === 0) { ctx.moveTo(WT, s.y + i * step); ctx.lineTo(WT + 24, s.y + i * step + step / 2); ctx.lineTo(WT, s.y + (i + 1) * step); }
          else { ctx.moveTo(W - WT, s.y + i * step); ctx.lineTo(W - WT - 24, s.y + i * step + step / 2); ctx.lineTo(W - WT, s.y + (i + 1) * step); }
          ctx.fill();
        }
      }
      for (const s of shur) {
        if (s.warn > 0) { ctx.fillStyle = 'rgba(255,80,80,0.6)'; ctx.fillRect(s.vx > 0 ? WT : W - WT - 8, s.y - 8, 8, 16); }
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.ang);
        ctx.fillStyle = '#e0e0ea'; ctx.beginPath();
        for (let i = 0; i < 8; i++) { const r = i % 2 ? 5 : 14, a = i * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, 6.283); ctx.fill();
        ctx.restore();
      }
      if (!over) {
        ctx.save(); ctx.translate(nx(), ny());
        ctx.rotate(jump < 0 ? 0 : jump * Math.PI * 2 * (jumpFrom === 0 ? 1 : -1));
        ctx.font = '34px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (jump < 0 && side === 1) ctx.scale(-1, 1);
        ctx.fillText('🥷', 0, 0);
        ctx.restore();
      }
      for (const f of fx) { ctx.globalAlpha = Math.min(1, f.t * 2); ctx.fillStyle = f.c; ctx.fillRect(f.x, f.y, 4, 4); }
      ctx.globalAlpha = 1;
      ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd166';
      for (const t of texts) { ctx.globalAlpha = Math.min(1, t.t * 2); ctx.fillText(t.s, t.x, t.y); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText(Math.floor(height / 10) + ' m', WT + 8, 22);
    }
    function loop(t) {
      if (dead) return;
      const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
      if (!over) update(dt); else { for (const f of fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.t -= dt; } fx = fx.filter((f) => f.t > 0); }
      draw();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        cv.removeEventListener('pointerdown', onDown);
        window.removeEventListener('keydown', onKey);
        cv.remove();
      },
    };
  },
};
