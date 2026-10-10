export default {
  id: 'tankduel',
  name: 'Tankduel',
  emoji: '🪖',
  hint: 'Sleep om te rijden, je schiet vanzelf',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#6b7a3a';
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const keys = {};
    const me = { x: W / 2, y: H * 0.8, hp: 3, cd: 0, shield: 0, rapid: 0, ang: 0 };
    const tgt = { x: me.x, y: me.y };
    let dragging = false, offX = 0, offY = 0;
    let shots = [], eshots = [], enemies = [], pows = [], fx = [], rocks = [];
    let wave = 0, score = 0, time = 0, toSpawn = 0, spawnT = 0, breakT = 1.5, banner = 0, hurt = 0;
    let dead = false, over = false, raf = 0, last = 0;
    for (let i = 0; i < 9; i++) rocks.push({ x: Math.random() * W, y: Math.random() * H, r: 6 + Math.random() * 10 });

    function pt(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / (r.width || W), (e.clientY - r.top) * H / (r.height || H)]; }
    function onDown(e) { const [x, y] = pt(e); dragging = true; offX = me.x - x; offY = me.y - y; try { cv.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); }
    function onMove(e) { if (!dragging) return; const [x, y] = pt(e); tgt.x = x + offX; tgt.y = y + offY; }
    function onUp() { dragging = false; }
    function onKey(e) { keys[e.key] = e.type === 'keydown'; if (e.key.startsWith('Arrow')) e.preventDefault(); }
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);

    function startWave() {
      wave++; banner = 1.6;
      toSpawn = 3 + wave * 2; spawnT = 0.5;
    }
    function spawnEnemy() {
      const heavy = wave >= 3 && Math.random() < 0.25;
      enemies.push({
        x: 30 + Math.random() * (W - 60), y: -30, hp: heavy ? 3 : 1, heavy,
        vx: (Math.random() < 0.5 ? -1 : 1) * (30 + wave * 5), ty: 60 + Math.random() * H * 0.3,
        cd: 1 + Math.random() * 1.5, ang: Math.PI / 2,
      });
    }
    function boom(x, y, n, col) {
      for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = 40 + Math.random() * 140; fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.5 + Math.random() * 0.3, col: col || '#ffb703' }); }
    }
    function fire() {
      const sp = me.rapid > 0 ? 0.13 : 0.3;
      me.cd = sp;
      shots.push({ x: me.x, y: me.y - 18, vy: -520 });
      if (me.rapid > 0 && wave > 2) { shots.push({ x: me.x - 12, y: me.y - 14, vy: -500 }); shots.push({ x: me.x + 12, y: me.y - 14, vy: -500 }); }
    }
    function hit() {
      if (me.shield > 0 || hurt > 0) return;
      me.hp--; hurt = 1; boom(me.x, me.y, 18, '#ff4d4d');
      if (me.hp <= 0 && !over) { over = true; boom(me.x, me.y, 40, '#ffb703'); api.end(Math.floor(score)); }
    }

    function update(dt) {
      time += dt; hurt = Math.max(0, hurt - dt); banner -= dt;
      const kd = 230 * dt;
      if (keys.ArrowLeft) tgt.x -= kd; if (keys.ArrowRight) tgt.x += kd;
      if (keys.ArrowUp) tgt.y -= kd; if (keys.ArrowDown) tgt.y += kd;
      tgt.x = Math.max(24, Math.min(W - 24, tgt.x)); tgt.y = Math.max(H * 0.35, Math.min(H - 30, tgt.y));
      const dx = tgt.x - me.x, dy = tgt.y - me.y, d = Math.hypot(dx, dy);
      const mv = Math.min(d, 230 * dt);
      if (d > 1) { me.x += dx / d * mv; me.y += dy / d * mv; }
      me.shield = Math.max(0, me.shield - dt); me.rapid = Math.max(0, me.rapid - dt);
      me.cd -= dt; if (me.cd <= 0) fire();
      // waves
      if (toSpawn > 0) { spawnT -= dt; if (spawnT <= 0) { spawnEnemy(); toSpawn--; spawnT = Math.max(0.4, 1.4 - wave * 0.08); } }
      else if (enemies.length === 0) { breakT -= dt; if (breakT <= 0) { breakT = 1.5; startWave(); } }
      for (const s of shots) s.y += s.vy * dt;
      shots = shots.filter((s) => s.y > -20);
      for (const e of enemies) {
        if (e.y < e.ty) e.y += 70 * dt;
        e.x += e.vx * dt; if (e.x < 24 || e.x > W - 24) e.vx = -e.vx;
        e.ang = Math.atan2(me.y - e.y, me.x - e.x);
        e.cd -= dt;
        if (e.cd <= 0 && e.y > 10) {
          e.cd = Math.max(0.9, 2.4 - wave * 0.12) + Math.random() * 0.8;
          const sp = 150 + wave * 8;
          eshots.push({ x: e.x, y: e.y + 10, vx: Math.cos(e.ang) * sp, vy: Math.sin(e.ang) * sp });
        }
        for (const s of shots) {
          if (!s.dead && Math.abs(s.x - e.x) < 18 && Math.abs(s.y - e.y) < 18) { s.dead = true; e.hp--; boom(s.x, s.y, 4, '#fff'); }
        }
        if (e.hp <= 0) {
          e.gone = true; score += e.heavy ? 30 : 10; boom(e.x, e.y, 20);
          if (Math.random() < 0.22) pows.push({ x: e.x, y: e.y, k: ['shield', 'rapid', 'heal'][Math.floor(Math.random() * 3)] });
        } else if (Math.abs(e.x - me.x) < 22 && Math.abs(e.y - me.y) < 22) { e.hp = 0; e.gone = true; boom(e.x, e.y, 20); hit(); }
      }
      enemies = enemies.filter((e) => !e.gone); shots = shots.filter((s) => !s.dead);
      for (const s of eshots) {
        s.x += s.vx * dt; s.y += s.vy * dt;
        if (Math.abs(s.x - me.x) < 14 && Math.abs(s.y - me.y) < 14) { s.dead = true; hit(); }
      }
      eshots = eshots.filter((s) => !s.dead && s.x > -20 && s.x < W + 20 && s.y > -20 && s.y < H + 20);
      for (const p of pows) {
        p.y += 30 * dt;
        if (Math.hypot(p.x - me.x, p.y - me.y) < 28) {
          p.dead = true; score += 5;
          if (p.k === 'shield') me.shield = 6; else if (p.k === 'rapid') me.rapid = 8; else me.hp = Math.min(5, me.hp + 1);
        }
      }
      pows = pows.filter((p) => !p.dead && p.y < H + 20);
      for (const f of fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.t -= dt; }
      fx = fx.filter((f) => f.t > 0);
      api.score(Math.floor(score));
    }

    function tank(x, y, ang, body, top, s) {
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = '#222'; ctx.fillRect(-16 * s, -14 * s, 7 * s, 28 * s); ctx.fillRect(9 * s, -14 * s, 7 * s, 28 * s);
      ctx.fillStyle = body; ctx.fillRect(-11 * s, -12 * s, 22 * s, 24 * s);
      ctx.rotate(ang - Math.PI / 2);
      ctx.fillStyle = top; ctx.fillRect(-2.5 * s, 0, 5 * s, 22 * s);
      ctx.beginPath(); ctx.arc(0, 0, 8 * s, 0, 6.283); ctx.fill();
      ctx.restore();
    }
    function draw() {
      ctx.fillStyle = '#6b7a3a'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#5d6b30';
      for (const r of rocks) { ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 6.283); ctx.fill(); }
      for (const p of pows) {
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, 15, 0, 6.283); ctx.fill();
        ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.k === 'shield' ? '🛡️' : p.k === 'rapid' ? '⚡' : '❤️', p.x, p.y + 1);
      }
      for (const e of enemies) tank(e.x, e.y, e.ang, e.heavy ? '#7a1f1f' : '#b34747', '#4a1010', e.heavy ? 1.3 : 1);
      ctx.fillStyle = '#ffe066';
      for (const s of shots) ctx.fillRect(s.x - 2, s.y - 8, 4, 12);
      ctx.fillStyle = '#ff5c5c';
      for (const s of eshots) { ctx.beginPath(); ctx.arc(s.x, s.y, 5, 0, 6.283); ctx.fill(); }
      if (!over) {
        if (hurt <= 0 || Math.floor(time * 12) % 2) tank(me.x, me.y, -Math.PI / 2, '#2f6b3a', '#1c4425', 1);
        if (me.shield > 0) { ctx.strokeStyle = 'rgba(80,200,255,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(me.x, me.y, 26, 0, 6.283); ctx.stroke(); }
      }
      for (const f of fx) { ctx.globalAlpha = Math.min(1, f.t * 2); ctx.fillStyle = f.col; ctx.fillRect(f.x, f.y, 4, 4); }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = '16px serif';
      ctx.fillText('❤️'.repeat(Math.max(0, me.hp)), 8, 8);
      ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#fff';
      ctx.fillText('Golf ' + wave, 8, 30);
      if (me.rapid > 0) ctx.fillText('⚡ ' + me.rapid.toFixed(0), 8, 48);
      if (banner > 0 && !over) {
        ctx.globalAlpha = Math.min(1, banner); ctx.textAlign = 'center'; ctx.font = 'bold 32px sans-serif';
        ctx.fillStyle = '#fff'; ctx.fillText('Golf ' + wave, W / 2, H * 0.3); ctx.globalAlpha = 1;
      }
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
