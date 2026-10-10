export default {
  id: 'katapult', name: 'Katapult', emoji: '🏹', hint: 'Trek de vogel terug en laat los: raak alle kikkers!',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#8fd3ff';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let dead = false, over = false, raf = 0, last = 0, score = 0;
    const G = 1400, gy = H - 90, ax = W * 0.17, ay = gy - 85, MAXD = 70, K = 11;
    const ground = { s: true, x: W / 2, y: gy + 60, w: W * 3, h: 120, vx: 0, vy: 0, m: 1 };
    let bodies = [], level = 1, birdsLeft = 0, bird = null, mode = 'aim', drag = false, px = ax, py = ay;
    let flightT = 0, still = 0, wait = 0, msg = '', msgT = 0;

    function contact(a, b) {
      if (a.r && b.r) {
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001, pen = a.r + b.r - d;
        return pen > 0 ? { nx: dx / d, ny: dy / d, pen } : null;
      }
      if (a.r || b.r) {
        const c = a.r ? a : b, k = a.r ? b : a, hx = k.w / 2, hy = k.h / 2, dx = c.x - k.x, dy = c.y - k.y;
        const qx = Math.max(-hx, Math.min(hx, dx)), qy = Math.max(-hy, Math.min(hy, dy));
        const ex = dx - qx, ey = dy - qy, d2 = ex * ex + ey * ey;
        if (d2 > c.r * c.r) return null;
        let nx, ny, pen;
        if (d2 > 1e-6) { const d = Math.sqrt(d2); nx = ex / d; ny = ey / d; pen = c.r - d; }
        else {
          const ox = hx - Math.abs(dx), oy = hy - Math.abs(dy);
          if (ox < oy) { nx = dx < 0 ? -1 : 1; ny = 0; pen = ox + c.r; } else { nx = 0; ny = dy < 0 ? -1 : 1; pen = oy + c.r; }
        }
        return c === a ? { nx: -nx, ny: -ny, pen } : { nx, ny, pen };
      }
      const ox = (a.w + b.w) / 2 - Math.abs(b.x - a.x), oy = (a.h + b.h) / 2 - Math.abs(b.y - a.y);
      if (ox <= 0 || oy <= 0) return null;
      return ox < oy ? { nx: b.x < a.x ? -1 : 1, ny: 0, pen: ox } : { nx: 0, ny: b.y < a.y ? -1 : 1, pen: oy };
    }
    function hurt(o, j) { if (!o.s && o.hp !== undefined && j > o.thr) o.hp -= (j - o.thr) / o.dm; }
    function solve(a, b) {
      const c = contact(a, b); if (!c) return;
      const ia = a.s ? 0 : 1 / a.m, ib = b.s ? 0 : 1 / b.m, t = ia + ib; if (!t) return;
      const corr = Math.max(c.pen - 0.3, 0) * 0.6 / t;
      a.x -= c.nx * corr * ia; a.y -= c.ny * corr * ia; b.x += c.nx * corr * ib; b.y += c.ny * corr * ib;
      const rx = b.vx - a.vx, ry = b.vy - a.vy, vn = rx * c.nx + ry * c.ny;
      if (vn >= 0) return;
      const e = vn < -200 ? 0.2 : 0, j = -(1 + e) * vn / t;
      a.vx -= c.nx * j * ia; a.vy -= c.ny * j * ia; b.vx += c.nx * j * ib; b.vy += c.ny * j * ib;
      const tx = -c.ny, ty = c.nx, vt = rx * tx + ry * ty, mx = 0.5 * j;
      const jt = Math.max(-mx, Math.min(mx, -vt / t));
      a.vx -= tx * jt * ia; a.vy -= ty * jt * ia; b.vx += tx * jt * ib; b.vy += ty * jt * ib;
      hurt(a, j); hurt(b, j);
    }
    function box(x, y, w, h, stone) {
      bodies.push({ x, y, w, h, vx: 0, vy: 0, m: w * h / 60, hp: 100, thr: stone ? 900 : 350, dm: stone ? 40 : 20, stone: !!stone });
    }
    function frog(x, y) { bodies.push({ x, y, r: 8, vx: 0, vy: 0, m: 3, hp: 1, thr: 450, dm: 1, frog: true }); }
    function build(n) {
      bodies = [ground];
      const houses = 1 + (n >= 3 ? 1 : 0) + (n >= 6 ? 1 : 0), floors = 1 + (n >= 2 ? 1 : 0) + (n >= 5 ? 1 : 0), hw = 54;
      const x0 = Math.min(W * 0.5, W - 8 - houses * (hw + 6));
      for (let i = 0; i < houses; i++) {
        const left = x0 + i * (hw + 6), st = n >= 3 && i % 2 === 1;
        for (let f = 0; f < floors; f++) {
          const base = gy - f * 48 - 0.5;
          box(left + 6, base - 19, 12, 38, st); box(left + hw - 6, base - 19, 12, 38, st);
          box(left + hw / 2, base - 43, hw, 10, st && f > 0);
          frog(left + hw / 2, base - 9);
        }
        if (i % 2 === 0) frog(left + hw / 2, gy - floors * 48 - 9.5);
      }
      birdsLeft = 3 + (n >= 4 ? 1 : 0) + (n >= 7 ? 1 : 0) + (n >= 10 ? 1 : 0);
    }
    function frogs() { let c = 0; for (const b of bodies) if (b.frog) c++; return c; }
    function nextBird() { birdsLeft--; bird = null; px = ax; py = ay; mode = 'aim'; drag = false; }
    function say(s) { msg = s; msgT = 1.6; }
    build(level); nextBird();

    function setpos(p) {
      let dx = p.x - ax, dy = p.y - ay; const d = Math.hypot(dx, dy);
      if (d > MAXD) { dx *= MAXD / d; dy *= MAXD / d; }
      px = ax + dx; py = Math.min(ay + dy, gy - 12);
    }
    const pt = e => { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height }; };
    const down = e => { if (mode !== 'aim' || over) return; drag = true; setpos(pt(e)); try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const move = e => { if (drag) setpos(pt(e)); };
    const up = () => {
      if (!drag) return; drag = false;
      const d = Math.hypot(ax - px, ay - py);
      if (d < 15) { px = ax; py = ay; return; }
      bird = { x: px, y: py, r: 10, vx: (ax - px) * K, vy: (ay - py) * K, m: 14, bird: true };
      bodies.push(bird); mode = 'fly'; flightT = 0; still = 0;
    };
    host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move);
    host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);

    function physics(dt) {
      const sub = 4, h = dt / sub;
      for (let s = 0; s < sub; s++) {
        for (const b of bodies) if (!b.s) { b.vy += G * h; b.x += b.vx * h; b.y += b.vy * h; }
        for (let it = 0; it < 3; it++)
          for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
            const a = bodies[i], b = bodies[j];
            if (a.s && b.s) continue;
            if (Math.abs(a.x - b.x) > 140 || Math.abs(a.y - b.y) > 140) continue;
            solve(a, b);
          }
      }
      for (const b of bodies) if (!b.s && b.vy === b.vy) { if (b.bird && b.y > gy - 12) b.vx *= 0.995; else if (!b.bird) { b.vx *= 0.998; } }
      const keep = [];
      for (const b of bodies) {
        if (b.hp !== undefined && b.hp <= 0) { score += b.frog ? 500 : 50; api.score(score); continue; }
        if (!b.s && !b.bird && (b.y > H + 100 || b.x < -100 || b.x > W + 100)) continue;
        keep.push(b);
      }
      bodies = keep;
    }
    function step(dt) {
      if (over) return;
      if (msgT > 0) msgT -= dt;
      physics(dt);
      if (mode === 'fly') {
        flightT += dt;
        still = Math.hypot(bird.vx, bird.vy) < 30 ? still + dt : 0;
        if (frogs() === 0) { mode = 'settle'; wait = 1.2; }
        else if (still > 0.7 || flightT > 8 || bird.x > W + 60 || bird.x < -60 || bird.y > H + 60) {
          bodies = bodies.filter(b => b !== bird); mode = 'settle'; wait = 1.2;
        }
      } else if (mode === 'settle') {
        wait -= dt;
        if (wait <= 0) {
          if (frogs() === 0) {
            const bonus = birdsLeft * 1000 + level * 500; score += bonus; api.score(score);
            say('Level ' + level + ' klaar! +' + bonus); level++; build(level); nextBird();
          } else if (birdsLeft > 0) { bodies = bodies.filter(b => !b.bird); nextBird(); }
          else { over = true; api.end(score); }
        }
      }
    }
    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8fd3ff'); g.addColorStop(1, '#d9f3ff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#5fb34a'; ctx.fillRect(0, gy, W, H - gy); ctx.fillStyle = '#8b5a2b'; ctx.fillRect(0, gy + 14, W, H - gy);
      // katapult
      ctx.strokeStyle = '#6b3f1d'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ax, gy); ctx.lineTo(ax, ay + 10); ctx.moveTo(ax, ay + 25); ctx.lineTo(ax - 12, ay - 5); ctx.moveTo(ax, ay + 25); ctx.lineTo(ax + 12, ay - 5); ctx.stroke();
      if (mode === 'aim') {
        ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ax - 12, ay - 5); ctx.lineTo(px, py); ctx.lineTo(ax + 12, ay - 5); ctx.stroke();
        if (drag) {
          const vx = (ax - px) * K, vy = (ay - py) * K; ctx.fillStyle = 'rgba(255,255,255,.8)';
          for (let i = 1; i < 16; i++) { const t = i * 0.07; ctx.beginPath(); ctx.arc(px + vx * t, py + vy * t + 0.5 * G * t * t, 2.5, 0, 7); ctx.fill(); }
        }
        ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🐦', px, py);
      }
      for (const b of bodies) {
        if (b.s) continue;
        if (b.frog) { ctx.font = '19px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🐸', b.x, b.y + 1); }
        else if (b.bird) { ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🐦', b.x, b.y); }
        else {
          const f = Math.max(0, b.hp / 100);
          ctx.fillStyle = b.stone ? 'hsl(215,8%,' + (45 + f * 20) + '%)' : 'hsl(30,55%,' + (30 + f * 22) + '%)';
          ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
          ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1.5; ctx.strokeRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
        }
      }
      ctx.fillStyle = '#222'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('Level ' + level + '   🐸 ' + frogs(), 10, 10);
      ctx.textAlign = 'right'; ctx.fillText('🐦 x ' + (birdsLeft + (mode === 'aim' ? 1 : 0)), W - 10, 10);
      if (msgT > 0) { ctx.textAlign = 'center'; ctx.font = 'bold 26px sans-serif'; ctx.fillStyle = '#c0392b'; ctx.fillText(msg, W / 2, H * 0.25); }
    }
    function frame(t) {
      if (dead) return; raf = requestAnimationFrame(frame);
      const dt = Math.min(0.033, (t - (last || t)) / 1000); last = t;
      step(dt); draw();
    }
    raf = requestAnimationFrame(frame);
    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move);
        host.removeEventListener('pointerup', up); host.removeEventListener('pointercancel', up);
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      },
    };
  },
};
