export default {
  id: 'draakvuur',
  name: 'Draakvuur',
  emoji: '🐉',
  hint: 'Sleep omhoog/omlaag, houd vast om vuur te spuwen',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#f4a259';
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const GY = H * 0.86, DX = W * 0.24, FL = 200, FA = 0.5;
    const d = { y: H * 0.4, hp: 3, inv: 0, fuel: 100, tired: false, vy: 0 };
    let ty = d.y, breathing = false, keyFire = false;
    let knights = [], arrows = [], fx = [], flames = [], texts = [], clouds = [], hills = [];
    for (let i = 0; i < 5; i++) clouds.push({ x: Math.random() * W, y: 30 + Math.random() * H * 0.3, s: 0.6 + Math.random() });
    for (let i = 0; i < 4; i++) hills.push({ x: i * 120, r: 70 + Math.random() * 60 });
    let score = 0, time = 0, spawnT = 1, dist = 0, kills = 0, wingT = 0;
    let dead = false, over = false, raf = 0, last = 0;
    const keys = {};

    function pt(e) { const r = cv.getBoundingClientRect(); return (e.clientY - r.top) * H / (r.height || H); }
    function onDown(e) { breathing = true; ty = pt(e) - 30; try { cv.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); }
    function onMove(e) { ty = pt(e) - (breathing ? 30 : 0); }
    function onUp() { breathing = false; }
    function onKey(e) {
      keys[e.key] = e.type === 'keydown';
      if (e.key === ' ') { keyFire = e.type === 'keydown'; e.preventDefault(); }
      if (e.key.startsWith('Arrow')) e.preventDefault();
    }
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);

    const lv = () => Math.min(10, time / 15);
    function spawnKnight() {
      const r = Math.random();
      const tower = lv() > 1 && r < 0.3;
      const kind = r > 0.72 - Math.min(0.25, lv() * 0.03) ? 'archer' : (r < 0.2 && lv() > 2 ? 'heavy' : 'sword');
      const th = tower ? 60 + Math.random() * 70 : 0;
      knights.push({ x: W + 30, y: GY - th, th, kind, burn: 0, need: kind === 'heavy' ? 1.6 : 0.7, cd: 1 + Math.random() * 1.5, v: tower ? 0 : 0, burning: 0 });
    }
    function hurt() {
      if (d.inv > 0 || over) return;
      d.hp--; d.inv = 1.4;
      for (let i = 0; i < 12; i++) fx.push({ x: DX, y: d.y, vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200, t: 0.5, c: '#ff4d4d' });
      if (d.hp <= 0) { over = true; api.end(Math.floor(score)); }
    }
    function mouth() { return [DX + 38, d.y + 6]; }

    function update(dt) {
      time += dt; d.inv = Math.max(0, d.inv - dt); wingT += dt * 8;
      const kd = 320 * dt;
      if (keys.ArrowUp) ty -= kd; if (keys.ArrowDown) ty += kd;
      ty = Math.max(40, Math.min(GY - 40, ty));
      const old = d.y;
      d.y += (ty - d.y) * (1 - Math.pow(0.0005, dt));
      d.vy = (d.y - old) / Math.max(dt, 0.001);
      const speed = Math.min(260, 100 + dist / 40);
      dist += speed * dt;
      const want = breathing || keyFire;
      if (d.tired && d.fuel > 35) d.tired = false;
      if (d.fuel <= 0) d.tired = true;
      const fire = want && !d.tired;
      d.fuel = Math.max(0, Math.min(100, d.fuel + (fire ? -42 : 26) * dt));
      for (const c of clouds) { c.x -= speed * 0.15 * dt; if (c.x < -60) { c.x = W + 60; c.y = 30 + Math.random() * H * 0.3; } }
      for (const h of hills) { h.x -= speed * 0.4 * dt; if (h.x < -140) h.x += 520; }
      spawnT -= dt;
      if (spawnT <= 0) { spawnKnight(); spawnT = Math.max(0.55, 1.8 - lv() * 0.13) + Math.random() * 0.8; }
      // vuur
      const [mx, my] = mouth();
      if (fire) {
        for (let i = 0; i < 3; i++) {
          const sp = 260 + Math.random() * 120, a = FA + (Math.random() - 0.5) * 0.25;
          flames.push({ x: mx, y: my, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: FL / sp });
        }
      }
      for (const f of flames) { f.x += f.vx * dt; f.y += f.vy * dt; f.t -= dt; }
      flames = flames.filter((f) => f.t > 0);
      const ex = mx + Math.cos(FA) * FL, ey = my + Math.sin(FA) * FL;
      for (const k of knights) {
        k.x -= speed * dt;
        const cx = k.x, cy = k.y - 18;
        k.burning = 0;
        if (fire) {
          // afstand punt tot lijnstuk
          const sx = ex - mx, sy = ey - my, l2 = sx * sx + sy * sy;
          let tt = ((cx - mx) * sx + (cy - my) * sy) / l2; tt = Math.max(0, Math.min(1, tt));
          const px = mx + sx * tt, py = my + sy * tt;
          if (Math.hypot(cx - px, cy - py) < 24) { k.burn += dt; k.burning = 1; }
        }
        k.cd -= dt;
        if (k.kind === 'archer' && k.cd <= 0 && k.x < W - 20 && k.x > DX + 40) {
          k.cd = Math.max(1.0, 2.6 - lv() * 0.15) + Math.random() * 0.6;
          const dx = DX - k.x, dy = d.y - cy, dd = Math.hypot(dx, dy) || 1, sp = 190 + lv() * 14;
          arrows.push({ x: k.x, y: cy, vx: dx / dd * sp, vy: dy / dd * sp });
        }
        if (k.burn >= k.need) {
          k.gone = true; kills++;
          const p = k.kind === 'heavy' ? 30 : k.kind === 'archer' ? 20 : 10; score += p;
          texts.push({ x: k.x, y: cy - 10, s: '+' + p, t: 0.8 });
          for (let i = 0; i < 12; i++) fx.push({ x: k.x, y: cy, vx: (Math.random() - 0.5) * 140, vy: -Math.random() * 160, t: 0.7, c: Math.random() < 0.5 ? '#ff7b00' : '#ffd23f' });
        }
      }
      knights = knights.filter((k) => !k.gone && k.x > -40);
      for (const a of arrows) {
        a.x += a.vx * dt; a.y += a.vy * dt;
        if (Math.hypot(a.x - (DX + 4), a.y - d.y) < 24) { a.dead = true; hurt(); }
      }
      arrows = arrows.filter((a) => !a.dead && a.x > -30 && a.y > -30 && a.y < H + 30);
      for (const f of fx) { f.x += f.vx * dt; f.y += f.vy * dt; if (f.vy < 400) f.vy += 300 * dt; f.t -= dt; }
      fx = fx.filter((f) => f.t > 0);
      for (const t of texts) { t.y -= 30 * dt; t.t -= dt; }
      texts = texts.filter((t) => t.t > 0);
      api.score(Math.floor(score));
    }

    function drawKnight(k) {
      const x = k.x, y = k.y;
      if (k.th) { ctx.fillStyle = '#8d8d99'; ctx.fillRect(x - 18, y, 36, k.th); ctx.fillStyle = '#777784'; for (let i = 0; i < 3; i++) ctx.fillRect(x - 18 + i * 14, y - 6, 8, 6); }
      ctx.fillStyle = k.kind === 'heavy' ? '#555a66' : k.kind === 'archer' ? '#2d6a4f' : '#9aa0ae';
      ctx.fillRect(x - 8, y - 26, 16, 22);
      ctx.fillStyle = '#c8ccd6'; ctx.beginPath(); ctx.arc(x, y - 32, 8, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#222'; ctx.fillRect(x - 5, y - 33, 10, 3);
      ctx.fillStyle = '#c1121f'; ctx.fillRect(x - 1, y - 44, 2, 6);
      if (k.kind === 'archer') { ctx.strokeStyle = '#5c3b1e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x - 8, y - 18, 11, -1.2, 1.2); ctx.stroke(); }
      else { ctx.fillStyle = '#e0e0e8'; ctx.fillRect(x - 14, y - 36, 2, 20); ctx.fillStyle = k.kind === 'heavy' ? '#e0a100' : '#1d4ed8'; ctx.beginPath(); ctx.arc(x + 9, y - 16, k.kind === 'heavy' ? 11 : 8, 0, 6.283); ctx.fill(); }
      if (k.burn > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x - 12, y - 54, 24, 4);
        ctx.fillStyle = '#ff7b00'; ctx.fillRect(x - 12, y - 54, 24 * Math.min(1, k.burn / k.need), 4);
      }
      if (k.burning) { ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.fillText('🔥', x, y - 30 + Math.sin(time * 20) * 2); }
    }
    function drawDragon() {
      const x = DX, y = d.y, bob = Math.sin(wingT) * 8;
      ctx.save(); ctx.translate(x, y);
      ctx.rotate(Math.max(-0.35, Math.min(0.35, d.vy / 900)));
      ctx.fillStyle = '#2f9e44';
      ctx.beginPath(); ctx.moveTo(-18, 2); ctx.quadraticCurveTo(-50, 6, -66, -8 + Math.sin(wingT * 0.7) * 6); ctx.lineTo(-62, 4); ctx.quadraticCurveTo(-40, 18, -18, 14); ctx.fill();
      ctx.fillStyle = '#e8590c';
      ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(-30, -34 - bob); ctx.lineTo(-10, -26 - bob * 0.5); ctx.lineTo(2, -4); ctx.fill();
      ctx.fillStyle = '#51cf66'; ctx.beginPath(); ctx.ellipse(0, 6, 28, 15, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#d8f5a2'; ctx.beginPath(); ctx.ellipse(2, 13, 20, 6, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#51cf66'; ctx.beginPath(); ctx.ellipse(28, 0, 14, 11, 0.1, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.moveTo(34, -2); ctx.lineTo(46, 2); ctx.lineTo(44, 9); ctx.lineTo(34, 9); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(30, -4, 3.5, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(31, -4, 1.8, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#e8590c'; ctx.beginPath(); ctx.moveTo(24, -10); ctx.lineTo(20, -20); ctx.lineTo(30, -12); ctx.fill();
      ctx.restore();
    }
    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, GY);
      g.addColorStop(0, '#f4845f'); g.addColorStop(0.6, '#f9c784'); g.addColorStop(1, '#ffe8b0');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(W * 0.78, H * 0.55, 40, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (const c of clouds) { ctx.beginPath(); ctx.ellipse(c.x, c.y, 36 * c.s, 12 * c.s, 0, 0, 6.283); ctx.ellipse(c.x + 18 * c.s, c.y + 4, 22 * c.s, 10 * c.s, 0, 0, 6.283); ctx.fill(); }
      ctx.fillStyle = '#7a8f5a';
      for (const h of hills) { ctx.beginPath(); ctx.ellipse(h.x + 60, GY, h.r + 40, h.r, 0, Math.PI, 0); ctx.fill(); }
      ctx.fillStyle = '#4c7a34'; ctx.fillRect(0, GY, W, H - GY);
      ctx.fillStyle = '#5c9a40'; ctx.fillRect(0, GY, W, 6);
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      for (const k of knights) drawKnight(k);
      ctx.strokeStyle = '#5c3b1e'; ctx.lineWidth = 2;
      for (const a of arrows) { const l = Math.hypot(a.vx, a.vy); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x - a.vx / l * 16, a.y - a.vy / l * 16); ctx.stroke(); ctx.fillStyle = '#444'; ctx.beginPath(); ctx.arc(a.x, a.y, 2.5, 0, 6.283); ctx.fill(); }
      for (const f of flames) {
        const k = f.t * 2;
        ctx.globalAlpha = Math.min(1, 0.3 + k); ctx.fillStyle = k > 0.5 ? '#ffd23f' : '#ff6b00';
        ctx.beginPath(); ctx.arc(f.x, f.y, 5 + (1 - Math.min(1, k)) * 9, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!over && (d.inv <= 0 || Math.floor(time * 14) % 2)) drawDragon();
      for (const f of fx) { ctx.globalAlpha = Math.min(1, f.t * 2); ctx.fillStyle = f.c; ctx.fillRect(f.x, f.y, 4, 4); }
      ctx.globalAlpha = 1;
      ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = '#fff';
      for (const t of texts) { ctx.globalAlpha = Math.min(1, t.t * 2); ctx.fillText(t.s, t.x, t.y); }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left'; ctx.font = '16px serif'; ctx.fillStyle = '#000'; ctx.fillText('❤️'.repeat(Math.max(0, d.hp)), 8, 22);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(8, 32, 100, 10);
      ctx.fillStyle = d.tired ? '#999' : '#ff7b00'; ctx.fillRect(8, 32, 100 * d.fuel / 100, 10);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.fillText(d.tired ? 'Hijgen…' : '🔥 Vuur', 114, 41);
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
