export default {
  id: 'vliegtuigjager',
  name: 'Vliegtuigjager',
  emoji: '✈️',
  hint: 'Sleep om te vliegen, je schiet vanzelf',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#3a8fd8';
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const me = { x: W / 2, y: H * 0.8, hp: 3, cd: 0, inv: 0, tilt: 0 };
    const tgt = { x: me.x, y: me.y };
    const keys = {};
    let dragging = false, offX = 0, offY = 0;
    let shots = [], eshots = [], enemies = [], fx = [], clouds = [], boss = null;
    for (let i = 0; i < 7; i++) clouds.push({ x: Math.random() * W, y: Math.random() * H, s: 0.6 + Math.random(), v: 15 + Math.random() * 25 });
    let wave = 0, phase = 'break', phaseT = 1.2, spawnLeft = 0, spawnT = 0, score = 0, time = 0, banner = 0;
    let dead = false, over = false, raf = 0, last = 0, bossName = '';

    function pt(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / (r.width || W), (e.clientY - r.top) * H / (r.height || H)]; }
    function onDown(e) { const [x, y] = pt(e); dragging = true; offX = me.x - x; offY = me.y - y; try { cv.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); }
    function onMove(e) { if (!dragging) return; const [x, y] = pt(e); tgt.x = x + offX; tgt.y = y + offY; }
    function onUp() { dragging = false; }
    function onKey(e) { keys[e.key] = e.type === 'keydown'; if (e.key.startsWith('Arrow')) e.preventDefault(); }
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);

    function boom(x, y, n, col) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = 40 + Math.random() * 180; fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.4 + Math.random() * 0.4, c: col || (Math.random() < 0.5 ? '#ffb703' : '#ff5c33') }); } }
    function spawnEnemy() {
      const kind = Math.random() < Math.min(0.4, wave * 0.07) ? 'zig' : 'straight';
      const x = 30 + Math.random() * (W - 60);
      enemies.push({ x, x0: x, y: -30, hp: kind === 'zig' ? 2 : 1, kind, ph: Math.random() * 6, v: 70 + wave * 8 + Math.random() * 40, cd: 1 + Math.random() * 2 });
    }
    function startWave() {
      wave++; banner = 1.6; phase = 'fight';
      spawnLeft = 5 + wave * 3; spawnT = 0.3;
    }
    function startBoss() {
      phase = 'boss'; banner = 1.8;
      const names = ['Grote Bromvlieg', 'Kapitein Wolk', 'Baron Donder', 'De Gouden Havik'];
      bossName = names[(wave - 1) % names.length];
      boss = { x: W / 2, y: -60, hp: 25 + wave * 12, max: 25 + wave * 12, dir: 1, cd: 1.5, t: 0, enter: true };
    }
    function hurt() {
      if (me.inv > 0 || over) return;
      me.hp--; me.inv = 1.5; boom(me.x, me.y, 20, '#ff4d4d');
      if (me.hp <= 0) { over = true; boom(me.x, me.y, 50); api.end(Math.floor(score)); }
    }
    function shootAt(x, y, sp) {
      const a = Math.atan2(me.y - y, me.x - x);
      eshots.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp });
    }

    function update(dt) {
      time += dt; banner -= dt; me.inv = Math.max(0, me.inv - dt);
      const kd = 260 * dt;
      if (keys.ArrowLeft) tgt.x -= kd; if (keys.ArrowRight) tgt.x += kd;
      if (keys.ArrowUp) tgt.y -= kd; if (keys.ArrowDown) tgt.y += kd;
      tgt.x = Math.max(20, Math.min(W - 20, tgt.x)); tgt.y = Math.max(H * 0.25, Math.min(H - 30, tgt.y));
      const px = me.x;
      const k = 1 - Math.pow(0.0001, dt);
      me.x += (tgt.x - me.x) * k; me.y += (tgt.y - me.y) * k;
      me.tilt += ((me.x - px) / Math.max(dt, 0.001) / 400 - me.tilt) * 0.2;
      for (const c of clouds) { c.y += c.v * dt; if (c.y > H + 40) { c.y = -40; c.x = Math.random() * W; } }
      me.cd -= dt;
      if (me.cd <= 0) {
        me.cd = 0.17;
        const tw = wave >= 3;
        if (tw) { shots.push({ x: me.x - 10, y: me.y - 14 }); shots.push({ x: me.x + 10, y: me.y - 14 }); }
        else shots.push({ x: me.x, y: me.y - 18 });
      }
      if (phase === 'break') { phaseT -= dt; if (phaseT <= 0) startWave(); }
      else if (phase === 'fight') {
        if (spawnLeft > 0) { spawnT -= dt; if (spawnT <= 0) { spawnEnemy(); spawnLeft--; spawnT = Math.max(0.35, 1 - wave * 0.05); } }
        else if (enemies.length === 0) startBoss();
      }
      for (const s of shots) s.y -= 560 * dt;
      shots = shots.filter((s) => s.y > -20 && !s.dead);
      for (const e of enemies) {
        e.y += e.v * dt;
        e.x = e.kind === 'zig' ? e.x0 + Math.sin(time * 2.2 + e.ph) * 60 : e.x;
        e.cd -= dt;
        if (e.cd <= 0 && e.y > 0 && e.y < H * 0.6) { e.cd = Math.max(1.1, 3 - wave * 0.2) + Math.random(); shootAt(e.x, e.y + 12, 120 + wave * 10); }
        for (const s of shots) if (!s.dead && Math.abs(s.x - e.x) < 20 && Math.abs(s.y - e.y) < 18) { s.dead = true; e.hp--; boom(s.x, s.y, 3, '#fff'); }
        if (e.hp <= 0) { e.gone = true; score += 10; boom(e.x, e.y, 14); }
        else if (Math.abs(e.x - me.x) < 22 && Math.abs(e.y - me.y) < 20) { e.gone = true; boom(e.x, e.y, 14); hurt(); }
        else if (e.y > H + 30) e.gone = true;
      }
      enemies = enemies.filter((e) => !e.gone);
      if (boss) {
        boss.t += dt;
        if (boss.enter) { boss.y += 60 * dt; if (boss.y > 90) boss.enter = false; }
        else {
          boss.x += boss.dir * (60 + wave * 8) * dt;
          if (boss.x > W - 50) boss.dir = -1; if (boss.x < 50) boss.dir = 1;
          boss.cd -= dt;
          if (boss.cd <= 0) {
            boss.cd = Math.max(0.7, 1.6 - wave * 0.1);
            const n = 3 + Math.min(4, wave);
            for (let i = 0; i < n; i++) {
              const a = Math.PI / 2 + (i - (n - 1) / 2) * 0.28;
              eshots.push({ x: boss.x, y: boss.y + 30, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150 });
            }
            if (wave >= 2) shootAt(boss.x, boss.y + 30, 190);
          }
        }
        for (const s of shots) if (!s.dead && Math.abs(s.x - boss.x) < 48 && Math.abs(s.y - boss.y) < 34) { s.dead = true; boss.hp--; boom(s.x, s.y, 2, '#fff'); }
        if (Math.abs(boss.x - me.x) < 40 && Math.abs(boss.y - me.y) < 30) hurt();
        if (boss.hp <= 0) { score += 100 + wave * 20; boom(boss.x, boss.y, 80); boss = null; phase = 'break'; phaseT = 1.5; eshots = []; if (me.hp < 5) me.hp++; }
      }
      shots = shots.filter((s) => !s.dead);
      for (const s of eshots) {
        s.x += s.vx * dt; s.y += s.vy * dt;
        if (Math.abs(s.x - me.x) < 12 && Math.abs(s.y - me.y) < 12) { s.dead = true; hurt(); }
      }
      eshots = eshots.filter((s) => !s.dead && s.x > -20 && s.x < W + 20 && s.y > -20 && s.y < H + 20);
      for (const f of fx) { f.x += f.vx * dt; f.y += f.vy * dt; f.t -= dt; }
      fx = fx.filter((f) => f.t > 0);
      api.score(Math.floor(score));
    }

    function plane(x, y, flip, col, s, tilt) {
      ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(1, -1); ctx.rotate(tilt || 0); ctx.scale(s, s);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(6, -6); ctx.lineTo(26, 6); ctx.lineTo(26, 12); ctx.lineTo(6, 8); ctx.lineTo(4, 18); ctx.lineTo(12, 24); ctx.lineTo(12, 28); ctx.lineTo(0, 25); ctx.lineTo(-12, 28); ctx.lineTo(-12, 24); ctx.lineTo(-4, 18); ctx.lineTo(-6, 8); ctx.lineTo(-26, 12); ctx.lineTo(-26, 6); ctx.lineTo(-6, -6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(0, -4, 3.5, 7, 0, 0, 6.283); ctx.fill();
      ctx.restore();
    }
    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#2a78c8'); g.addColorStop(1, '#a8dcff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (const c of clouds) { ctx.beginPath(); ctx.ellipse(c.x, c.y, 40 * c.s, 14 * c.s, 0, 0, 6.283); ctx.ellipse(c.x - 20 * c.s, c.y + 4, 24 * c.s, 11 * c.s, 0, 0, 6.283); ctx.ellipse(c.x + 22 * c.s, c.y + 3, 26 * c.s, 12 * c.s, 0, 0, 6.283); ctx.fill(); }
      ctx.fillStyle = '#fff6a0';
      for (const s of shots) ctx.fillRect(s.x - 2, s.y - 8, 4, 14);
      ctx.fillStyle = '#ff4d4d';
      for (const s of eshots) { ctx.beginPath(); ctx.arc(s.x, s.y, 5, 0, 6.283); ctx.fill(); }
      for (const e of enemies) plane(e.x, e.y, true, e.kind === 'zig' ? '#7b2d8e' : '#c0392b', 0.8, 0);
      if (boss) {
        plane(boss.x, boss.y, true, '#2d3436', 2.1, 0);
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(W / 2 - 70, 12, 140, 10);
        ctx.fillStyle = '#ff5c5c'; ctx.fillRect(W / 2 - 70, 12, 140 * Math.max(0, boss.hp / boss.max), 10);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(bossName, W / 2, 36);
      }
      if (!over && (me.inv <= 0 || Math.floor(time * 14) % 2)) plane(me.x, me.y, false, '#f5f5f5', 0.9, me.tilt);
      for (const f of fx) { ctx.globalAlpha = Math.min(1, f.t * 2); ctx.fillStyle = f.c; ctx.fillRect(f.x, f.y, 4, 4); }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left'; ctx.font = '16px serif'; ctx.fillStyle = '#000';
      ctx.fillText('❤️'.repeat(Math.max(0, me.hp)), 8, 20);
      ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('Golf ' + Math.max(1, wave), 8, 42);
      if (banner > 0 && !over) {
        ctx.globalAlpha = Math.min(1, banner); ctx.textAlign = 'center'; ctx.font = 'bold 30px sans-serif'; ctx.fillStyle = '#fff';
        ctx.fillText(phase === 'boss' ? 'BAAS: ' + bossName : 'Golf ' + wave, W / 2, H * 0.35); ctx.globalAlpha = 1;
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
