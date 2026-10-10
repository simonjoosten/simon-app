export default {
  id: 'stuiterlaser', name: 'Stuiterlaser', emoji: '🔦', hint: 'Sleep om te richten, tik spiegels om te draaien, druk op Vuur',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#0b132b';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let dead = false, over = false, raf = 0, last = 0, score = 0;
    const E = { x: W / 2, y: H - 70 }, D2R = Math.PI / 180, TR = 16;
    const BTN = { x: W - 104, y: H - 54, w: 92, h: 40 };
    let level = 1, mirrors = [], targets = [], shots = 0, aim = -90 * D2R, aiming = false, beam = null, beamT = 0, wait = 0, mode = 'play', msg = '', msgT = 0;
    let seed = 3;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    function trace(a, tg) {
      let x = E.x, y = E.y, dx = Math.cos(a), dy = Math.sin(a), skip = -1;
      const pts = [{ x, y }], hit = [];
      for (let r = 0; r < 12; r++) {
        let bt = 1e9, bi = -1, bn = null;
        for (let i = 0; i < mirrors.length; i++) {
          if (i === skip) continue;
          const m = mirrors[i], ex = Math.cos(m.ang) * m.len, ey = Math.sin(m.ang) * m.len;
          const ax = m.x - ex / 2, ay = m.y - ey / 2, den = dx * ey - dy * ex;
          if (Math.abs(den) < 1e-9) continue;
          const t = ((ax - x) * ey - (ay - y) * ex) / den, s = ((ax - x) * dy - (ay - y) * dx) / den;
          if (t > 1e-3 && s >= 0 && s <= 1 && t < bt) { bt = t; bi = i; const l = Math.hypot(ex, ey); bn = { x: -ey / l, y: ex / l }; }
        }
        // muren
        let tw = 1e9;
        if (dx > 1e-9) tw = Math.min(tw, (W - x) / dx); else if (dx < -1e-9) tw = Math.min(tw, (0 - x) / dx);
        if (dy > 1e-9) tw = Math.min(tw, (H - y) / dy); else if (dy < -1e-9) tw = Math.min(tw, (40 - y) / dy);
        const wall = tw < bt, t = wall ? tw : bt;
        for (let k = 0; k < tg.length; k++) {
          const u = Math.max(0, Math.min(t, (tg[k].x - x) * dx + (tg[k].y - y) * dy));
          if (Math.hypot(x + dx * u - tg[k].x, y + dy * u - tg[k].y) <= TR && hit.indexOf(k) < 0) hit.push(k);
        }
        x += dx * t; y += dy * t; pts.push({ x, y });
        if (wall) break;
        const dn = dx * bn.x + dy * bn.y; dx -= 2 * dn * bn.x; dy -= 2 * dn * bn.y; skip = bi;
      }
      return { pts, hit };
    }
    function build() {
      seed = level * 7919 + 17;
      for (let tries = 0; tries < 200; tries++) {
        mirrors = []; targets = [];
        const legs = Math.min(5, 1 + Math.ceil((level + 1) / 2)), path = [];
        const dirs = [-30, -60, -90, -120, -150];
        let a = dirs[Math.floor(rnd() * 5)], p = { x: E.x, y: E.y }, ok = true; const a0 = a;
        for (let i = 0; i < legs && ok; i++) {
          const len = 100 + rnd() * 90, q = { x: p.x + Math.cos(a * D2R) * len, y: p.y + Math.sin(a * D2R) * len };
          if (q.x < 30 || q.x > W - 30 || q.y < 70 || q.y > H - 120) { ok = false; break; }
          if (i < legs - 1) {
            const f = 0.35 + rnd() * 0.3;
            targets.push({ x: p.x + (q.x - p.x) * f, y: p.y + (q.y - p.y) * f, lit: false });
            let b; do { b = Math.floor(rnd() * 12) * 30 - 180; const df = ((b - a) % 360 + 360) % 360; if (df !== 0 && df !== 180) break; } while (true);
            mirrors.push({ x: q.x, y: q.y, len: 76, ang: ((a + b) / 2) * D2R, path: true });
            a = b;
          } else {
            targets.push({ x: q.x, y: q.y, lit: false });
            if (level >= 3) { const f = 0.45; targets.push({ x: p.x + (q.x - p.x) * f, y: p.y + (q.y - p.y) * f, lit: false }); }
          }
          p = q;
        }
        if (!ok) continue;
        if (trace(a0 * D2R, targets).hit.length !== targets.length) continue;
        const nd = Math.floor(level / 2);
        for (let d = 0; d < nd; d++) {
          for (let k = 0; k < 10; k++) {
            const m = { x: 40 + rnd() * (W - 80), y: 90 + rnd() * (H - 260), len: 60, ang: Math.floor(rnd() * 12) * 15 * D2R, path: false };
            mirrors.push(m);
            if (trace(a0 * D2R, targets).hit.length === targets.length) break;
            mirrors.pop();
          }
        }
        if (level > 1) for (const m of mirrors) if (m.path) m.ang += Math.floor(1 + rnd() * 11) * 15 * D2R;
        if (trace(a0 * D2R, targets).hit.length === targets.length) mirrors[0].ang += 15 * D2R * 2;
        shots = 3 + (level >= 3 ? 1 : 0) + (level >= 6 ? 1 : 0);
        aim = -90 * D2R; beam = null; mode = 'play';
        return;
      }
      // reserve: eenvoudig level
      mirrors = []; targets = [{ x: W / 2, y: 200, lit: false }]; shots = 3; aim = -90 * D2R; mode = 'play';
    }
    build();

    const pt = e => { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height }; };
    function setAim(p) {
      let a = Math.atan2(p.y - E.y, p.x - E.x) / D2R;
      if (a > -5) a = a > 90 ? -175 : -5; if (a < -175) a = -175;
      const sn = Math.round(a / 30) * 30; if (Math.abs(a - sn) < 4) a = sn;
      aim = a * D2R;
    }
    function segDist(p, m) {
      const ex = Math.cos(m.ang) * m.len / 2, ey = Math.sin(m.ang) * m.len / 2;
      const ax = m.x - ex, ay = m.y - ey, bx = m.x + ex, by = m.y + ey, vx = bx - ax, vy = by - ay;
      const u = Math.max(0, Math.min(1, ((p.x - ax) * vx + (p.y - ay) * vy) / (vx * vx + vy * vy)));
      return Math.hypot(p.x - (ax + vx * u), p.y - (ay + vy * u));
    }
    function fire() {
      if (mode !== 'play' || shots <= 0 || over) return;
      shots--; const r = trace(aim, targets); beam = r.pts; beamT = 0.7;
      let n = 0; for (const k of r.hit) if (!targets[k].lit) { targets[k].lit = true; n++; }
      if (n) { score += 100 * n * n; api.score(score); }
      mode = 'fired'; wait = 1;
    }
    const down = e => {
      if (over || mode !== 'play') return;
      const p = pt(e);
      if (p.x >= BTN.x && p.x <= BTN.x + BTN.w && p.y >= BTN.y && p.y <= BTN.y + BTN.h) { fire(); return; }
      let bi = -1, bd = 26;
      for (let i = 0; i < mirrors.length; i++) { const d = segDist(p, mirrors[i]); if (d < bd) { bd = d; bi = i; } }
      if (bi >= 0) { mirrors[bi].ang += 15 * D2R; return; }
      aiming = true; setAim(p); try { host.setPointerCapture(e.pointerId); } catch (_) {}
    };
    const move = e => { if (aiming) setAim(pt(e)); };
    const up = () => { aiming = false; };
    const kd = e => {
      if (e.key === 'ArrowLeft') { aim = Math.max(-175 * D2R, aim - 2 * D2R); e.preventDefault(); }
      if (e.key === 'ArrowRight') { aim = Math.min(-5 * D2R, aim + 2 * D2R); e.preventDefault(); }
      if (e.key === ' ' || e.key === 'Enter') { fire(); e.preventDefault(); }
    };
    host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move);
    host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
    window.addEventListener('keydown', kd);

    function step(dt) {
      if (over) return;
      if (msgT > 0) msgT -= dt; if (beamT > 0) beamT -= dt;
      if (mode === 'fired') {
        wait -= dt;
        if (wait <= 0) {
          if (targets.every(t => t.lit)) {
            const b = 200 + shots * 150; score += b; api.score(score);
            msg = 'Alles geraakt! +' + b; msgT = 1.6; mode = 'next'; wait = 1.5;
          } else if (shots <= 0) { over = true; api.end(score); }
          else mode = 'play';
        }
      } else if (mode === 'next') { wait -= dt; if (wait <= 0) { level++; build(); } }
    }
    function draw() {
      ctx.fillStyle = '#0b132b'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 40; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      if (mode === 'play') {
        const r = trace(aim, targets); ctx.strokeStyle = 'rgba(255,80,80,.35)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
        ctx.beginPath(); r.pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.setLineDash([]);
      }
      if (beam && beamT > 0) {
        ctx.strokeStyle = 'rgba(255,60,60,' + Math.min(1, beamT * 2) + ')'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); beam.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
      }
      for (const m of mirrors) {
        const ex = Math.cos(m.ang) * m.len / 2, ey = Math.sin(m.ang) * m.len / 2;
        ctx.strokeStyle = '#7fdbff'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(m.x - ex, m.y - ey); ctx.lineTo(m.x + ex, m.y + ey); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      }
      for (const t of targets) {
        ctx.fillStyle = t.lit ? '#2ecc40' : '#ffdc00'; ctx.beginPath(); ctx.arc(t.x, t.y, TR - 3, 0, 7); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(t.x, t.y, TR, 0, 7); ctx.stroke();
      }
      ctx.save(); ctx.translate(E.x, E.y); ctx.rotate(aim); ctx.fillStyle = '#aaa'; ctx.fillRect(0, -7, 30, 14); ctx.restore();
      ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(E.x, E.y, 16, 0, 7); ctx.fill();
      ctx.fillStyle = shots > 0 && mode === 'play' ? '#e63946' : '#6c757d'; ctx.fillRect(BTN.x, BTN.y, BTN.w, BTN.h);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🔥 Vuur', BTN.x + BTN.w / 2, BTN.y + BTN.h / 2);
      ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('Level ' + level, 10, 10); ctx.textAlign = 'right'; ctx.fillText('Schoten: ' + shots, W - 10, 10);
      ctx.textAlign = 'left'; ctx.font = '13px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillText('Tik een spiegel om te draaien', 10, H - 20);
      if (msgT > 0) { ctx.textAlign = 'center'; ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = '#ffdc00'; ctx.fillText(msg, W / 2, H * 0.12); }
    }
    function frame(t) {
      if (dead) return; raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
      step(dt); draw();
    }
    raf = requestAnimationFrame(frame);
    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move);
        host.removeEventListener('pointerup', up); host.removeEventListener('pointercancel', up);
        window.removeEventListener('keydown', kd);
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      },
    };
  },
};
