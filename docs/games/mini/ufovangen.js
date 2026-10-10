export default {
  id: 'ufovangen',
  name: 'UFO vangen',
  emoji: '🛸',
  hint: 'Sleep het UFO, houd vast om koeien op te zuigen',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#14123a';
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const GY = H * 0.86, UY = H * 0.24;
    const u = { x: W / 2, hp: 3, inv: 0, en: 100, beam: false };
    let tx = u.x, holding = false, keyBeam = false;
    let cows = [], army = [], shots = [], fx = [], texts = [], stars = [];
    for (let i = 0; i < 40; i++) stars.push({ x: Math.random() * W, y: Math.random() * GY * 0.8, s: Math.random() * 1.5 + 0.3 });
    let score = 0, time = 0, cowT = 0.5, armyT = 6, caught = 0, tired = false;
    let dead = false, over = false, raf = 0, last = 0;
    const keys = {};

    function pt(e) { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) * W / (r.width || W); }
    function onDown(e) { holding = true; tx = pt(e); try { cv.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); }
    function onMove(e) { if (holding) tx = pt(e); }
    function onUp() { holding = false; }
    function onKey(e) {
      keys[e.key] = e.type === 'keydown';
      if (e.key === ' ') { keyBeam = e.type === 'keydown'; e.preventDefault(); }
      if (e.key.startsWith('Arrow')) e.preventDefault();
    }
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);

    function spawnCow() {
      const l = Math.random() < 0.5;
      cows.push({ x: l ? -20 : W + 20, y: GY, v: (l ? 1 : -1) * (20 + Math.random() * 25), lift: 0, state: 'walk', fall: 0, e: '🐄' });
    }
    function spawnArmy() {
      const tank = Math.random() < 0.35 + Math.min(0.3, time / 200);
      const l = Math.random() < 0.5;
      army.push({ x: l ? -20 : W + 20, y: GY, v: (l ? 1 : -1) * (30 + Math.random() * 20), tank, cd: 1 + Math.random(), life: 14, state: 'walk', lift: 0, e: tank ? '🚙' : '💂' });
    }
    function fireAt(a) {
      const dx = u.x - a.x, dy = UY - a.y, d = Math.hypot(dx, dy) || 1;
      const sp = Math.min(300, 150 + time * 1.5);
      shots.push({ x: a.x, y: a.y - 14, vx: dx / d * sp, vy: dy / d * sp, big: a.tank });
    }
    function hit() {
      if (u.inv > 0 || over) return;
      u.hp--; u.inv = 1.4;
      for (let i = 0; i < 14; i++) fx.push({ x: u.x, y: UY, vx: (Math.random() - 0.5) * 240, vy: (Math.random() - 0.5) * 240, t: 0.6, c: '#ffb703' });
      if (u.hp <= 0) { over = true; api.end(Math.floor(score)); }
    }
    function inBeam(x, y) {
      const f = (y - UY) / (GY - UY);
      const half = 18 + 40 * f;
      return Math.abs(x - u.x) < half;
    }

    function update(dt) {
      time += dt; u.inv = Math.max(0, u.inv - dt);
      const kd = 300 * dt;
      if (keys.ArrowLeft) tx -= kd; if (keys.ArrowRight) tx += kd;
      tx = Math.max(30, Math.min(W - 30, tx));
      u.x += (tx - u.x) * (1 - Math.pow(0.0008, dt));
      const want = holding || keyBeam || keys.ArrowDown;
      if (tired && u.en > 35) tired = false;
      if (u.en <= 0) tired = true;
      u.beam = want && !tired;
      u.en = Math.max(0, Math.min(100, u.en + (u.beam ? -34 : 22) * dt));
      cowT -= dt; if (cowT <= 0) { if (cows.length < 6) spawnCow(); cowT = Math.max(0.9, 2.6 - time / 40); }
      armyT -= dt;
      if (armyT <= 0) { if (army.length < 2 + Math.floor(time / 25)) spawnArmy(); armyT = Math.max(2.5, 7 - time / 12); }
      const rise = 150 + Math.min(80, time);
      for (const c of cows) {
        if (c.state === 'walk') {
          c.x += c.v * dt;
          if (c.x < -30 || c.x > W + 30) { if (c.x < -30 && c.v > 0 || c.x > W + 30 && c.v < 0) c.gone = true; }
          if (u.beam && inBeam(c.x, c.y) && Math.abs(c.x - u.x) < 22) { c.state = 'up'; }
        } else if (c.state === 'up') {
          if (u.beam && inBeam(c.x + 0, c.y) ) {
            c.y -= rise * dt; c.x += (u.x - c.x) * Math.min(1, dt * 4);
            if (c.y <= UY + 10) {
              c.gone = true; caught++; const p = 10 + Math.min(10, caught - 1) ; score += p;
              texts.push({ x: u.x, y: UY - 20, s: '+' + p + ' 🐄', t: 0.9 });
              for (let i = 0; i < 8; i++) fx.push({ x: u.x, y: UY, vx: (Math.random() - 0.5) * 160, vy: Math.random() * 100, t: 0.5, c: '#9bf6ff' });
            }
          } else { c.state = 'fall'; c.fall = 0; }
        } else {
          c.fall += 500 * dt; c.y += c.fall * dt;
          if (c.y >= GY) { c.y = GY; c.state = 'walk'; }
        }
      }
      for (const a of army) {
        if (a.state === 'walk') {
          a.x += a.v * dt; a.life -= dt;
          if (a.x < 20 && a.v < 0 || a.x > W - 20 && a.v > 0) a.v = -a.v;
          a.cd -= dt;
          if (a.cd <= 0) { fireAt(a); a.cd = Math.max(0.9, (a.tank ? 2.2 : 1.6) - time / 90); }
          if (a.life <= 0) a.gone = true;
          if (u.beam && Math.abs(a.x - u.x) < 20) a.state = 'up';
        } else {
          if (u.beam && inBeam(a.x, a.y)) {
            a.y -= rise * dt; a.x += (u.x - a.x) * Math.min(1, dt * 4);
            if (a.y <= UY + 10) { a.gone = true; score += a.tank ? 25 : 15; texts.push({ x: u.x, y: UY - 20, s: '+' + (a.tank ? 25 : 15), t: 0.9 }); }
          } else { a.y = Math.min(GY, a.y + 300 * dt); if (a.y >= GY) a.state = 'walk'; }
        }
      }
      cows = cows.filter((c) => !c.gone); army = army.filter((a) => !a.gone);
      for (const s of shots) {
        s.x += s.vx * dt; s.y += s.vy * dt;
        if (Math.hypot(s.x - u.x, s.y - UY) < 26) { s.dead = true; hit(); }
      }
      shots = shots.filter((s) => !s.dead && s.y > -20 && s.y < H + 20 && s.x > -20 && s.x < W + 20);
      for (const f of fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.t -= dt; }
      fx = fx.filter((f) => f.t > 0);
      for (const t of texts) { t.y -= 30 * dt; t.t -= dt; }
      texts = texts.filter((t) => t.t > 0);
      api.score(Math.floor(score));
    }

    function draw() {
      const bg = ctx.createLinearGradient(0, 0, 0, GY);
      bg.addColorStop(0, '#0b0930'); bg.addColorStop(1, '#3b2a7a');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      for (const s of stars) ctx.fillRect(s.x, s.y, s.s, s.s);
      ctx.font = '36px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🌙', W - 50, 50);
      ctx.fillStyle = '#2f6b2f'; ctx.fillRect(0, GY, W, H - GY);
      ctx.fillStyle = '#3d8a3d'; ctx.fillRect(0, GY, W, 6);
      if (u.beam) {
        const g = ctx.createLinearGradient(0, UY, 0, GY);
        g.addColorStop(0, 'rgba(160,255,200,0.7)'); g.addColorStop(1, 'rgba(160,255,200,0.15)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(u.x - 18, UY + 8); ctx.lineTo(u.x + 18, UY + 8); ctx.lineTo(u.x + 58, GY); ctx.lineTo(u.x - 58, GY); ctx.closePath(); ctx.fill();
      }
      ctx.font = '34px serif';
      for (const c of cows) {
        ctx.save(); ctx.translate(c.x, c.y - 14); if (c.v < 0) ctx.scale(-1, 1); if (c.state !== 'walk') ctx.rotate(Math.sin(time * 8) * 0.3);
        ctx.fillText(c.e, 0, 0); ctx.restore();
      }
      for (const a of army) {
        ctx.font = (a.tank ? 38 : 30) + 'px serif'; ctx.fillText(a.tank ? '🚙' : '💂', a.x, a.y - 14);
      }
      for (const s of shots) { ctx.fillStyle = s.big ? '#ff4d4d' : '#ffd166'; ctx.beginPath(); ctx.arc(s.x, s.y, s.big ? 6 : 4, 0, 6.283); ctx.fill(); }
      if (!over) {
        if (u.inv <= 0 || Math.floor(time * 14) % 2) {
          ctx.font = '60px serif';
          ctx.save(); ctx.translate(u.x, UY + Math.sin(time * 3) * 3); ctx.rotate((tx - u.x) / 400);
          ctx.fillText('🛸', 0, 0); ctx.restore();
        }
      }
      for (const f of fx) { ctx.globalAlpha = Math.min(1, f.t * 2); ctx.fillStyle = f.c; ctx.fillRect(f.x, f.y, 4, 4); }
      ctx.globalAlpha = 1;
      ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = '#fff';
      for (const t of texts) { ctx.globalAlpha = Math.min(1, t.t * 2); ctx.fillText(t.s, t.x, t.y); }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left'; ctx.font = '16px serif'; ctx.fillText('❤️'.repeat(Math.max(0, u.hp)), 8, 20);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(8, 36, 90, 10);
      ctx.fillStyle = tired ? '#ff6b6b' : '#80ed99'; ctx.fillRect(8, 36, 90 * u.en / 100, 10);
      ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.fillText(tired ? 'Opladen…' : 'Straal', 104, 42);
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
        window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey);
        cv.remove();
      },
    };
  },
};
