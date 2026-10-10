export default {
  id: 'ruimteschieter', name: 'Ruimteschieter', emoji: '🚀', hint: 'Sleep om te vliegen, je schiet vanzelf',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#05061a';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let dead = false, over = false, raf = 0, last = 0, score = 0, lives = 3, wave = 0, time = 0;
    let sx = W / 2, tx = null, fireT = 0, inv = 0, banner = 0, eShootT = 1.5;
    const sy = H - 80, keys = {};
    let bullets = [], enemies = [], eBullets = [];
    const stars = []; for (let i = 0; i < 40; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, s: 20 + Math.random() * 60 });
    const faces = ['👾', '👽', '🛸', '🤖'];
    function spawnWave() {
      wave++; banner = 1.8;
      const n = Math.min(5 + wave * 2, 24), per = 6;
      for (let i = 0; i < n; i++) {
        const row = Math.floor(i / per), col = i % per;
        enemies.push({ x0: 40 + col * ((W - 80) / (per - 1)), y: -40 - row * 48, ph: Math.random() * 6, x: 0,
          hp: wave >= 3 && Math.random() < 0.25 ? 2 : 1, f: faces[(wave + row) % faces.length] });
      }
    }
    spawnWave();
    const pos = e => { const b = cv.getBoundingClientRect(); return (e.clientX - b.left) * W / b.width; };
    const down = e => { tx = pos(e); try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const move = e => { if (tx !== null || e.pointerType === 'mouse') tx = pos(e); };
    const kd = e => { keys[e.key] = true; if (e.key.indexOf('Arrow') === 0 || e.key === ' ') e.preventDefault(); };
    const ku = e => { keys[e.key] = false; };
    host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move);
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    function hurt() {
      if (inv > 0) return; lives--; inv = 1.5;
      if (lives <= 0) { over = true; api.end(score); }
    }
    function update(dt) {
      time += dt; inv -= dt; banner -= dt;
      const kv = ((keys.ArrowRight || keys.d) ? 1 : 0) - ((keys.ArrowLeft || keys.a) ? 1 : 0);
      if (kv) { sx += kv * W * 1.2 * dt; tx = null; } else if (tx !== null) sx += (tx - sx) * Math.min(1, dt * 18);
      sx = Math.max(20, Math.min(W - 20, sx));
      fireT -= dt;
      if (fireT <= 0) { fireT = Math.max(0.16, 0.3 - wave * 0.01); bullets.push({ x: sx, y: sy - 24 }); }
      for (const s of stars) { s.y += s.s * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } }
      for (const b of bullets) b.y -= 650 * dt;
      bullets = bullets.filter(b => b.y > -20);
      const vy = 16 + wave * 4;
      for (const en of enemies) {
        en.y += vy * dt * (en.y < 30 ? 3 : 1);
        en.x = en.x0 + Math.sin(time * 1.3 + en.ph * 0.0) * 28 * (1 + Math.min(wave, 5) * 0.1);
        for (const b of bullets) if (!b.d && en.y > -10 && Math.abs(b.x - en.x) < 22 && Math.abs(b.y - en.y) < 22) {
          b.d = true; en.hp--; if (en.hp <= 0) { en.dead = true; score += 10 * wave; api.score(score); }
        }
        if (!en.dead && Math.abs(en.x - sx) < 28 && Math.abs(en.y - sy) < 28) { en.dead = true; hurt(); }
        else if (!en.dead && en.y > sy + 30) { en.dead = true; hurt(); }
      }
      bullets = bullets.filter(b => !b.d);
      enemies = enemies.filter(e => !e.dead);
      if (wave >= 2 && enemies.length) {
        eShootT -= dt;
        if (eShootT <= 0) {
          eShootT = Math.max(0.5, 1.6 - wave * 0.1);
          const vis = enemies.filter(e => e.y > 0);
          if (vis.length) { const e = vis[Math.floor(Math.random() * vis.length)]; eBullets.push({ x: e.x, y: e.y + 16 }); }
        }
      }
      for (const b of eBullets) { b.y += 240 * dt; if (Math.abs(b.x - sx) < 16 && Math.abs(b.y - sy) < 20) { b.d = true; hurt(); } }
      eBullets = eBullets.filter(b => !b.d && b.y < H + 10);
      if (!over && enemies.length === 0) { eBullets = []; spawnWave(); }
    }
    function draw() {
      ctx.fillStyle = '#05061a'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; for (const s of stars) ctx.fillRect(s.x, s.y, 2, 2);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '32px serif';
      for (const e of enemies) { ctx.globalAlpha = e.hp > 1 ? 1 : 0.92; ctx.fillText(e.hp > 1 ? '👹' : e.f, e.x, e.y); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffeb3b'; for (const b of bullets) ctx.fillRect(b.x - 2, b.y - 8, 4, 14);
      ctx.fillStyle = '#ff5252'; for (const b of eBullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, 7); ctx.fill(); }
      if (!(inv > 0 && Math.floor(time * 12) % 2)) { ctx.font = '40px serif'; ctx.fillText('🚀', sx, sy); }
      ctx.font = '16px sans-serif'; ctx.fillStyle = '#fff';
      ctx.textAlign = 'left'; ctx.fillText('❤️'.repeat(Math.max(0, lives)), 10, 24);
      ctx.textAlign = 'right'; ctx.fillText('Golf ' + wave, W - 10, 24);
      if (banner > 0) { ctx.textAlign = 'center'; ctx.font = 'bold 32px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, banner) + ')'; ctx.fillText('Golf ' + wave, W / 2, H / 2 - 60); }
    }
    function frame(t) {
      if (dead) return; raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
      if (!over) update(dt);
      draw();
    }
    raf = requestAnimationFrame(frame);
    return { destroy() {
      dead = true; cancelAnimationFrame(raf);
      host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      if (cv.parentNode) cv.parentNode.removeChild(cv);
    } };
  },
};
