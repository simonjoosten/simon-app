export default {
  id: 'blokkentoren', name: 'Blokkentoren', emoji: '🧱', hint: 'Tik om het blok te laten vallen en bouw een hoge toren',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#bde0fe';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let dead = false, over = false, raf = 0, last = 0, score = 0;
    const G = 1400, baseY = H - 70, BH = 26;
    const base = { s: true, x: W / 2, y: baseY + 20, w: 130, h: 40, vx: 0, vy: 0, m: 1, c: '#6c757d' };
    let blocks = [base], cur = null, count = 0, level = 1, t = 0, camOff = 0, camT = 0, mode = 'play', wait = 0, still = 0, fallT = 0, flash = 0, msg = '', msgT = 0, hue = 200;

    function spawn() {
      const w = Math.max(44, 100 - (level - 1) * 5) + Math.round((Math.random() - 0.5) * 12);
      hue = (hue + 37) % 360;
      cur = { x: W / 2, y: 80 - camOff, w, h: BH, vx: 0, vy: 0, m: w * BH / 60, c: 'hsl(' + hue + ',65%,60%)', state: 'swing', tilt: 0, tip: 0 };
      t = 0;
    }
    spawn();
    function drop() { if (over || !cur || cur.state !== 'swing') return; cur.state = 'fall'; blocks.push(cur); still = 0; fallT = 0; }
    const down = e => { e.preventDefault && e.preventDefault(); drop(); };
    const kd = e => { if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 'Enter') { drop(); e.preventDefault(); } };
    host.addEventListener('pointerdown', down); window.addEventListener('keydown', kd);

    function solve(a, b) {
      const ox = (a.w + b.w) / 2 - Math.abs(b.x - a.x), oy = (a.h + b.h) / 2 - Math.abs(b.y - a.y);
      if (ox <= 0 || oy <= 0) return;
      let nx = 0, ny = 0, pen;
      if (ox < oy) { nx = b.x < a.x ? -1 : 1; pen = ox; } else { ny = b.y < a.y ? -1 : 1; pen = oy; }
      const ia = a.s ? 0 : 1 / a.m, ib = b.s ? 0 : 1 / b.m, tt = ia + ib; if (!tt) return;
      const corr = Math.max(pen - 0.3, 0) * 0.6 / tt;
      a.x -= nx * corr * ia; a.y -= ny * corr * ia; b.x += nx * corr * ib; b.y += ny * corr * ib;
      const rx = b.vx - a.vx, ry = b.vy - a.vy, vn = rx * nx + ry * ny;
      if (vn >= 0) return;
      const j = -vn / tt;
      a.vx -= nx * j * ia; a.vy -= ny * j * ia; b.vx += nx * j * ib; b.vy += ny * j * ib;
      const tx = -ny, ty = nx, vt = rx * tx + ry * ty, mx = 0.45 * j, jt = Math.max(-mx, Math.min(mx, -vt / tt));
      a.vx -= tx * jt * ia; a.vy -= ty * jt * ia; b.vx += tx * jt * ib; b.vy += ty * jt * ib;
    }
    function physics(dt) {
      const sub = 4, h = dt / sub;
      for (let s = 0; s < sub; s++) {
        for (const b of blocks) if (!b.s) {
          b.vy += G * h; if (b.tip) b.vx += b.tip * 900 * h;
          b.x += b.vx * h; b.y += b.vy * h;
        }
        for (let it = 0; it < 3; it++) for (let i = 0; i < blocks.length; i++) for (let j = i + 1; j < blocks.length; j++) {
          if (blocks[i].s && blocks[j].s) continue; solve(blocks[i], blocks[j]);
        }
      }
      // kantel-regel: zwaartepunt buiten steun -> glijdt/valt eraf
      for (const b of blocks) {
        if (b.s || mode === 'collapse') continue;
        let lo = 1e9, hi = -1e9;
        for (const o of blocks) {
          if (o === b) continue;
          const gap = (b.y + b.h / 2) - (o.y - o.h / 2);
          if (Math.abs(gap) < 3 && Math.abs(o.x - b.x) < (o.w + b.w) / 2 - 0.5) { lo = Math.min(lo, o.x - o.w / 2); hi = Math.max(hi, o.x + o.w / 2); }
        }
        if (hi > lo && (b.x < lo - 0.5 || b.x > hi + 0.5)) b.tip = b.x < lo ? -1 : 1; else b.tip = 0;
        if (b.tip) b.tilt += b.tip * dt * 1.2; else b.tilt *= 0.9;
      }
    }
    function comAbove(k) {
      let sm = 0, sx = 0;
      for (let j = k + 1; j < blocks.length; j++) { sm += blocks[j].m; sx += blocks[j].m * blocks[j].x; }
      return sm ? sx / sm : blocks[k].x;
    }
    function topple() {
      for (let k = 0; k < blocks.length - 1; k++) if (Math.abs(comAbove(k) - blocks[k].x) > blocks[k].w / 2) return k;
      return -1;
    }
    function towerDir(k) { return comAbove(k) < blocks[k].x ? -1 : 1; }
    function say(s) { msg = s; msgT = 1.2; }
    function step(dt) {
      if (over) return;
      if (msgT > 0) msgT -= dt; if (flash > 0) flash -= dt;
      if (mode === 'collapse') {
        physics(dt); wait -= dt;
        if (wait <= 0) { over = true; api.end(score); }
        return;
      }
      t += dt;
      if (cur && cur.state === 'swing') {
        const amp = W / 2 - cur.w / 2 - 8, sp = 1.8 + level * 0.28;
        cur.x = W / 2 + Math.sin(t * sp) * amp; cur.y = 80 - camOff;
      }
      const ox = cur ? cur.x : 0, oy = cur ? cur.y : 0;
      physics(dt);
      const mv = cur && cur.state === 'fall' ? Math.hypot(cur.x - ox, cur.y - oy) / dt : 0;
      for (const b of blocks) if (!b.s && b.y > baseY + 90) { over = true; api.end(score); return; }
      if (cur && cur.state === 'fall') {
        fallT += dt;
        if (mv < 10 && !cur.tip) still += dt; else still = 0;
        if (still > 0.45) {
          const sup = blocks[blocks.length - 2];
          const off = Math.abs(cur.x - sup.x);
          cur.state = 'rest'; cur.s = true; cur.vx = 0; cur.vy = 0; cur.tilt = 0; cur.tip = 0;
          const k = topple();
          if (k >= 0) {
            const dir = towerDir(k);
            for (let j = k + 1; j < blocks.length; j++) { const b = blocks[j]; b.s = false; b.tip = dir; b.vx = dir * 40; }
            mode = 'collapse'; wait = 1.8; say('De toren valt om!'); cur = null; return;
          }
          count++;
          let pts = 10; if (off < 4) { pts += 10; say('Perfect!'); }
          score += pts; api.score(score);
          if (count % 5 === 0) { level++; say('Sneller! Niveau ' + level); }
          cur = null;
          let top = baseY; for (const b of blocks) if (!b.s || b !== base) top = Math.min(top, b.y - b.h / 2);
          camT = Math.max(0, H * 0.55 - top);
          spawn();
        } else if (fallT > 10) { over = true; api.end(score); }
      }
      camOff += (camT - camOff) * Math.min(1, dt * 4);
    }
    function draw() {
      ctx.fillStyle = '#bde0fe'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(0, camOff);
      ctx.fillStyle = '#7bc96f'; ctx.fillRect(-10, baseY + 40, W + 20, 400);
      for (const b of blocks) {
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.tilt || 0);
        ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 2; ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore();
      }
      if (cur && cur.state === 'swing') {
        ctx.fillStyle = cur.c; ctx.fillRect(cur.x - cur.w / 2, cur.y - cur.h / 2, cur.w, cur.h);
        ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 2; ctx.strokeRect(cur.x - cur.w / 2, cur.y - cur.h / 2, cur.w, cur.h);
        ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(cur.x, cur.y + 14); ctx.lineTo(cur.x, baseY - 10); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.restore();
      ctx.fillStyle = '#222'; ctx.font = 'bold 16px sans-serif'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      ctx.fillText('Blokken: ' + count, 10, 10); ctx.textAlign = 'right'; ctx.fillText('Niveau ' + level, W - 10, 10);
      if (msgT > 0) { ctx.textAlign = 'center'; ctx.font = 'bold 26px sans-serif'; ctx.fillStyle = '#d00000'; ctx.fillText(msg, W / 2, H * 0.3); }
    }
    function frame(ts) {
      if (dead) return; raf = requestAnimationFrame(frame);
      const dt = Math.min(0.033, (ts - (last || ts)) / 1000); last = ts;
      step(dt); draw();
    }
    raf = requestAnimationFrame(frame);
    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        host.removeEventListener('pointerdown', down); window.removeEventListener('keydown', kd);
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      },
    };
  },
};
