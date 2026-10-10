export default {
  id: 'piratenkanon',
  name: 'Piratenkanon',
  emoji: '🏴‍☠️',
  hint: 'Sleep om te richten, laat los om te schieten',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#8fd3ff';
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const CX = 46, CY = H * 0.84, G = 520, MAXP = 130;
    let aim = null, ang = -0.9, pow = 0.6;
    let balls = [], ships = [], fx = [], texts = [];
    let wind = 0, windTarget = 0, windT = 3, cd = 0;
    let lives = 3, score = 0, time = 0, spawnT = 1, sunk = 0, recoil = 0;
    let dead = false, over = false, raf = 0, last = 0;
    const keys = {};

    function pt(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / (r.width || W), (e.clientY - r.top) * H / (r.height || H)]; }
    function setAim(x, y) {
      const dx = x - CX, dy = y - CY;
      let a = Math.atan2(-dy, dx);
      a = Math.max(0.12, Math.min(1.45, a)); // omhoog
      ang = -a;
      pow = Math.max(0.25, Math.min(1, Math.hypot(dx, dy) / MAXP));
    }
    function onDown(e) { const [x, y] = pt(e); aim = true; setAim(x, y); try { cv.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); }
    function onMove(e) { if (!aim) return; const [x, y] = pt(e); setAim(x, y); }
    function onUp() { if (aim) { aim = null; shoot(); } }
    function onKey(e) {
      if (e.key === 'ArrowUp') ang = Math.max(-1.45, ang - 0.05);
      else if (e.key === 'ArrowDown') ang = Math.min(-0.12, ang + 0.05);
      else if (e.key === 'ArrowRight') pow = Math.min(1, pow + 0.04);
      else if (e.key === 'ArrowLeft') pow = Math.max(0.25, pow - 0.04);
      else if (e.key === ' ' || e.key === 'Enter') { shoot(); e.preventDefault(); }
      if (e.key.startsWith('Arrow')) e.preventDefault();
    }
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey);

    function vel() { const s = 260 + pow * 330; return [Math.cos(ang) * s, Math.sin(ang) * s]; }
    function shoot() {
      if (over || cd > 0) return;
      cd = 0.55; recoil = 1;
      const [vx, vy] = vel();
      balls.push({ x: CX + Math.cos(ang) * 30, y: CY + Math.sin(ang) * 30, vx, vy, hit: false });
      for (let i = 0; i < 8; i++) fx.push({ x: CX + Math.cos(ang) * 32, y: CY + Math.sin(ang) * 32, vx: Math.random() * 60 - 20, vy: -Math.random() * 40, t: 0.6, c: '#ddd', r: 5 });
    }
    function spawnShip() {
      const big = Math.random() < Math.min(0.45, 0.1 + sunk * 0.02);
      const speedy = Math.random() < 0.25;
      const y = H * 0.16 + Math.random() * H * 0.46;
      ships.push({ x: W + 40, y, hp: big ? 2 : 1, big, v: (22 + Math.min(40, sunk * 1.2)) * (speedy ? 1.6 : 1) * (big ? 0.7 : 1), ph: Math.random() * 6 });
    }
    function splash(x, y) { for (let i = 0; i < 10; i++) fx.push({ x, y, vx: Math.random() * 80 - 40, vy: -Math.random() * 120, t: 0.7, c: '#fff', r: 3, g: true }); }
    function update(dt) {
      time += dt; cd -= dt; recoil = Math.max(0, recoil - dt * 5);
      if (keys.x) return;
      windT -= dt;
      if (windT <= 0) { windT = 3 + Math.random() * 3; windTarget = (Math.random() * 2 - 1) * Math.min(160, 40 + sunk * 6); }
      wind += (windTarget - wind) * Math.min(1, dt);
      spawnT -= dt;
      if (spawnT <= 0) { spawnShip(); spawnT = Math.max(0.9, 3 - sunk * 0.08) + Math.random(); }
      for (const s of ships) {
        s.x -= s.v * dt;
        if (s.x < -30 && !s.gone) { s.gone = true; lives--; texts.push({ x: 40, y: s.y, s: 'Door!', t: 1 });
          if (lives <= 0 && !over) { over = true; api.end(Math.floor(score)); } }
      }
      for (const b of balls) {
        b.vx += wind * dt; b.vy += G * dt; b.x += b.vx * dt; b.y += b.vy * dt;
        for (const s of ships) {
          const r = s.big ? 30 : 22;
          if (!s.gone && Math.abs(b.x - s.x) < r && Math.abs(b.y - s.y) < r * 0.8) {
            b.hit = true; s.hp--;
            for (let i = 0; i < 10; i++) fx.push({ x: b.x, y: b.y, vx: Math.random() * 200 - 100, vy: Math.random() * 200 - 100, t: 0.5, c: '#ffb703', r: 3 });
            if (s.hp <= 0) { s.gone = true; sunk++; const pts = s.big ? 30 : 15; score += pts; texts.push({ x: s.x, y: s.y - 20, s: '+' + pts, t: 1 }); splash(s.x, s.y + 10); }
            break;
          }
        }
        if (b.y > H * 0.88 && b.vy > 0 && !b.hit) { b.hit = true; splash(b.x, H * 0.88); }
        if (b.x > W + 40 || b.x < -40) b.hit = true;
      }
      balls = balls.filter((b) => !b.hit); ships = ships.filter((s) => !s.gone);
      for (const f of fx) { f.x += f.vx * dt; f.y += f.vy * dt; if (f.g) f.vy += 300 * dt; f.t -= dt; }
      fx = fx.filter((f) => f.t > 0);
      for (const t of texts) { t.y -= 25 * dt; t.t -= dt; }
      texts = texts.filter((t) => t.t > 0);
      api.score(Math.floor(score));
    }
    function draw() {
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.3);
      sky.addColorStop(0, '#6cc4ff'); sky.addColorStop(1, '#cdeeff');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * 0.3);
      const sea = ctx.createLinearGradient(0, H * 0.1, 0, H);
      sea.addColorStop(0, '#2aa2c8'); sea.addColorStop(1, '#0b4f7a');
      ctx.fillStyle = sea; ctx.fillRect(0, H * 0.1, W, H * 0.9);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2;
      for (let r = 0; r < 12; r++) {
        const y = H * 0.12 + r * H * 0.07; ctx.beginPath();
        for (let x = 0; x <= W; x += 12) ctx.lineTo(x, y + Math.sin(x * 0.05 + time * 1.5 + r) * 3);
        ctx.stroke();
      }
      ctx.font = '40px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('☀️', W - 40, 40);
      for (const s of ships) {
        const bob = Math.sin(time * 2 + s.ph) * 3;
        ctx.font = (s.big ? 58 : 42) + 'px serif'; ctx.fillText(s.big ? '🚢' : '⛵', s.x, s.y + bob);
        if (s.big && s.hp === 1) { ctx.font = '14px serif'; ctx.fillText('💥', s.x, s.y - 28); }
      }
      // klif en kanon
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(0, CY + 16, 90, H - CY);
      ctx.fillStyle = '#6a8f3a'; ctx.fillRect(0, CY + 12, 90, 8);
      ctx.save(); ctx.translate(CX, CY); ctx.rotate(ang);
      ctx.fillStyle = '#2b2b2b'; ctx.fillRect(-14 - recoil * 6, -7, 44, 14);
      ctx.fillStyle = '#444'; ctx.fillRect(24 - recoil * 6, -9, 8, 18);
      ctx.restore();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(CX, CY + 4, 13, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#6b3d14'; ctx.beginPath(); ctx.arc(CX, CY + 4, 5, 0, 6.283); ctx.fill();
      // richthulp
      if (aim && !over) {
        let [vx, vy] = vel(); let x = CX + Math.cos(ang) * 30, y = CY + Math.sin(ang) * 30;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        for (let i = 0; i < 40; i++) {
          vx += wind * 0.03; vy += G * 0.03; x += vx * 0.03; y += vy * 0.03;
          if (i % 2 === 0 && i < 22) { ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 6.283); ctx.fill(); }
        }
      }
      ctx.fillStyle = '#111';
      for (const b of balls) { ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, 6.283); ctx.fill(); }
      for (const f of fx) { ctx.globalAlpha = Math.min(1, f.t * 2); ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill(); }
      ctx.globalAlpha = 1;
      ctx.font = 'bold 18px sans-serif';
      for (const t of texts) { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0b4f7a'; ctx.lineWidth = 3; ctx.strokeText(t.s, t.x, t.y); ctx.fillText(t.s, t.x, t.y); }
      // wind en levens
      ctx.textAlign = 'left'; ctx.font = '16px serif'; ctx.fillStyle = '#000';
      ctx.fillText('❤️'.repeat(Math.max(0, lives)), 8, 18);
      ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#fff';
      const wl = Math.abs(wind) / 160;
      ctx.fillText('Wind', 8, 42);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(48, 36, 70, 10);
      ctx.fillStyle = '#ffd166'; ctx.fillRect(83, 36, Math.sign(wind) * 35 * Math.min(1, wl * 2), 10);
      ctx.fillStyle = '#fff'; ctx.fillRect(82, 33, 2, 16);
      ctx.fillText(wind > 8 ? '💨 →' : wind < -8 ? '← 💨' : 'stil', 124, 42);
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
        cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointermove', onMove);
        cv.removeEventListener('pointerup', onUp); cv.removeEventListener('pointercancel', onUp);
        window.removeEventListener('keydown', onKey);
        cv.remove();
      },
    };
  },
};
