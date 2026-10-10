export default {
  id: 'minigolf', name: 'Minigolf', emoji: '⛳', hint: 'Sleep achteruit en laat los: 9 banen, weinig slagen',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#1b5e20';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // wereld is 100 x 160 eenheden
    const WW = 100, WH = 160;
    const fieldTop = 64, fieldBot = H - 14;
    const S = Math.min((W - 24) / WW, (fieldBot - fieldTop) / WH);
    const OX = (W - WW * S) / 2, OY = fieldTop + ((fieldBot - fieldTop) - WH * S) / 2;
    const BR = 2.3, HR = 4.2, MAXV = 210;

    // walls [x,y,w,h]; sand/water [x,y,w,h]
    const LEVELS = [
      { par: 2, tee: [50, 140], hole: [50, 24], walls: [], sand: [], water: [], movers: [], mills: [] },
      { par: 3, tee: [22, 140], hole: [78, 24], walls: [[0, 78, 66, 6]], sand: [], water: [], movers: [], mills: [] },
      { par: 3, tee: [86, 142], hole: [14, 22], walls: [[0, 95, 70, 6], [30, 52, 70, 6]], sand: [], water: [], movers: [], mills: [] },
      { par: 3, tee: [50, 142], hole: [50, 22], walls: [[44, 72, 12, 12]], sand: [[14, 92, 72, 26]], water: [], movers: [], mills: [] },
      { par: 3, tee: [50, 142], hole: [50, 22], walls: [], sand: [], water: [[0, 66, 36, 30], [64, 66, 36, 30]], movers: [], mills: [] },
      { par: 4, tee: [50, 142], hole: [50, 22], walls: [], sand: [], water: [], movers: [{ x: 0, y: 80, w: 34, h: 6, amp: 66, sp: 1.6 }], mills: [] },
      { par: 4, tee: [50, 142], hole: [50, 22], walls: [[0, 70, 20, 20], [80, 70, 20, 20]], sand: [], water: [], movers: [], mills: [{ x: 50, y: 80, len: 26, sp: 2.0 }] },
      { par: 5, tee: [88, 146], hole: [50, 14], walls: [[18, 112, 82, 5], [0, 70, 82, 5], [18, 30, 82, 5]], sand: [[40, 118, 30, 20]], water: [], movers: [], mills: [] },
      { par: 4, tee: [50, 146], hole: [50, 16], walls: [], sand: [[34, 116, 32, 14]], water: [[0, 98, 28, 20], [72, 98, 28, 20]], movers: [], mills: [{ x: 50, y: 56, len: 24, sp: -2.4 }] },
    ];

    let dead = false, raf = 0, last = 0, time = 0, ended = false;
    let hi = 0, strokes = 0, total = 0, pts = 0;
    let ball = { x: 0, y: 0, vx: 0, vy: 0 }, lastPos = { x: 0, y: 0 };
    let state = 'ready'; // ready, roll, sink, done
    let msg = '', msgT = 0, sinkT = 0, pull = null;
    const lv = () => LEVELS[Math.min(hi, LEVELS.length - 1)];
    const strokesArr = [];

    function startHole() {
      const L = lv();
      ball = { x: L.tee[0], y: L.tee[1], vx: 0, vy: 0 }; lastPos = { x: ball.x, y: ball.y };
      strokes = 0; state = 'ready'; msg = 'Baan ' + (hi + 1) + ' - par ' + L.par; msgT = 1.6; pull = null;
    }
    startHole();

    function obstacles() {
      const L = lv(), out = L.walls.slice();
      for (const m of L.movers) {
        const px = m.x + (0.5 + 0.5 * Math.sin(time * m.sp)) * m.amp;
        out.push([px, m.y, m.w, m.h]);
      }
      return out;
    }
    function millSeg(m) {
      const a = time * m.sp;
      return [m.x + Math.cos(a) * m.len, m.y + Math.sin(a) * m.len, m.x - Math.cos(a) * m.len, m.y - Math.sin(a) * m.len];
    }
    function inRect(r, x, y) { return x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3]; }

    function collideRect(r) {
      const cx = Math.max(r[0], Math.min(ball.x, r[0] + r[2])), cy = Math.max(r[1], Math.min(ball.y, r[1] + r[3]));
      let dx = ball.x - cx, dy = ball.y - cy, d = Math.hypot(dx, dy);
      if (d >= BR) return;
      let nx, ny;
      if (d < 1e-6) {
        // middelpunt in blok: duw uit via kleinste overlap
        const l = ball.x - r[0], rr = r[0] + r[2] - ball.x, t = ball.y - r[1], b = r[1] + r[3] - ball.y;
        const m = Math.min(l, rr, t, b);
        if (m === l) { nx = -1; ny = 0; ball.x = r[0] - BR; } else if (m === rr) { nx = 1; ny = 0; ball.x = r[0] + r[2] + BR; }
        else if (m === t) { nx = 0; ny = -1; ball.y = r[1] - BR; } else { nx = 0; ny = 1; ball.y = r[1] + r[3] + BR; }
      } else { nx = dx / d; ny = dy / d; ball.x = cx + nx * BR; ball.y = cy + ny * BR; }
      const vn = ball.vx * nx + ball.vy * ny;
      if (vn < 0) { ball.vx -= 1.85 * vn * nx; ball.vy -= 1.85 * vn * ny; }
    }
    function collideSeg(s, thick) {
      const ax = s[0], ay = s[1], bx = s[2], by = s[3], abx = bx - ax, aby = by - ay;
      let u = ((ball.x - ax) * abx + (ball.y - ay) * aby) / (abx * abx + aby * aby);
      u = Math.max(0, Math.min(1, u));
      const px = ax + abx * u, py = ay + aby * u;
      let dx = ball.x - px, dy = ball.y - py, d = Math.hypot(dx, dy);
      const R = BR + thick;
      if (d >= R) return;
      if (d < 1e-6) { dx = 1; dy = 0; d = 1; }
      const nx = dx / d, ny = dy / d;
      ball.x = px + nx * R; ball.y = py + ny * R;
      const vn = ball.vx * nx + ball.vy * ny;
      if (vn < 0) { ball.vx -= 1.9 * vn * nx; ball.vy -= 1.9 * vn * ny; }
      // beetje meenemen
      ball.vx += ny * 6; ball.vy -= nx * 6;
    }

    function nextHole(p) {
      pts += p; api.score(pts);
      strokesArr.push(strokes); total += strokes;
      hi++;
      if (hi >= LEVELS.length) {
        state = 'done';
        if (!ended) { ended = true; msg = 'Klaar! ' + total + ' slagen'; msgT = 5; setTimeout(() => { if (!dead) api.end(pts); }, 1400); }
      } else startHole();
    }

    function stepPhysics(dt) {
      const L = lv();
      const sp = Math.hypot(ball.vx, ball.vy);
      const n = Math.max(1, Math.ceil(sp * dt / 0.8));
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        ball.x += ball.vx * h; ball.y += ball.vy * h;
        if (ball.x < BR) { ball.x = BR; ball.vx = Math.abs(ball.vx) * 0.9; }
        if (ball.x > WW - BR) { ball.x = WW - BR; ball.vx = -Math.abs(ball.vx) * 0.9; }
        if (ball.y < BR) { ball.y = BR; ball.vy = Math.abs(ball.vy) * 0.9; }
        if (ball.y > WH - BR) { ball.y = WH - BR; ball.vy = -Math.abs(ball.vy) * 0.9; }
        for (const r of obstacles()) collideRect(r);
        for (const m of L.mills) collideSeg(millSeg(m), 1.1);
        // gat
        const dx = L.hole[0] - ball.x, dy = L.hole[1] - ball.y, d = Math.hypot(dx, dy), v = Math.hypot(ball.vx, ball.vy);
        if (d < HR && v < 125) { state = 'sink'; sinkT = 0; ball.vx = ball.vy = 0; return; }
        if (d < HR * 1.6 && v < 70 && v > 0) { ball.vx += dx / d * 90 * h; ball.vy += dy / d * 90 * h; }
      }
      // wrijving
      let dec = 34;
      for (const s of L.sand) if (inRect(s, ball.x, ball.y)) dec = 190;
      const v = Math.hypot(ball.vx, ball.vy);
      if (v > 0) {
        const nv = v - dec * dt;
        if (nv < 4) { ball.vx = ball.vy = 0; } else { ball.vx *= nv / v; ball.vy *= nv / v; }
      }
      // water
      for (const w of L.water) if (inRect(w, ball.x, ball.y)) {
        ball.x = lastPos.x; ball.y = lastPos.y; ball.vx = ball.vy = 0; strokes++; msg = 'Plons! +1 slag'; msgT = 1.2;
        break;
      }
      if (ball.vx === 0 && ball.vy === 0) {
        state = 'ready';
        if (strokes >= 8) { msg = 'Maximaal aantal slagen'; msgT = 1.2; state = 'sink'; sinkT = 0.5; ball.x = -50; }
      }
    }

    function update(dt) {
      time += dt; if (msgT > 0) msgT -= dt;
      if (state === 'roll') stepPhysics(dt);
      else if (state === 'sink') {
        sinkT += dt;
        const L = lv();
        if (ball.x > 0) { ball.x += (L.hole[0] - ball.x) * Math.min(1, dt * 12); ball.y += (L.hole[1] - ball.y) * Math.min(1, dt * 12); }
        if (sinkT > 0.7) {
          const p = strokes >= 8 ? 0 : Math.max(1, 25 - 4 * strokes);
          const d = strokes - lv().par;
          if (strokes < 8) msg = strokes === 1 ? 'HOLE IN ONE!' : d <= -2 ? 'Eagle!' : d === -1 ? 'Birdie!' : d === 0 ? 'Par' : d === 1 ? 'Bogey' : '+' + d;
          msgT = 1.2;
          state = 'next'; sinkT = 0; nextHole.p = p;
        }
      } else if (state === 'next') {
        sinkT += dt;
        if (sinkT > 1.0) { state = 'x'; nextHole(nextHole.p); }
      }
    }

    // invoer
    const pos = e => { const b = host.getBoundingClientRect(); return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height }; };
    const pd = e => {
      if (state !== 'ready') return;
      const p = pos(e); pull = { x0: p.x, y0: p.y, x: p.x, y: p.y };
      try { host.setPointerCapture(e.pointerId); } catch (_) {}
    };
    const pm = e => { if (pull) { const p = pos(e); pull.x = p.x; pull.y = p.y; } };
    const pu = () => {
      if (!pull) return;
      const dx = pull.x0 - pull.x, dy = pull.y0 - pull.y, d = Math.hypot(dx, dy); pull = null;
      if (state !== 'ready' || d < 12) return;
      const pw = Math.min(1, d / 130);
      ball.vx = dx / d * pw * MAXV; ball.vy = dy / d * pw * MAXV;
      lastPos = { x: ball.x, y: ball.y }; strokes++; state = 'roll';
    };
    const pc = () => { pull = null; };
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm);
    host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pc);

    function T(s, x, y, size, col, al) { ctx.font = '700 ' + size + 'px system-ui,sans-serif'; ctx.textAlign = al || 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(s, x, y); }
    const X = x => OX + x * S, Y = y => OY + y * S;
    function rect(r, col) { ctx.fillStyle = col; ctx.fillRect(X(r[0]), Y(r[1]), r[2] * S, r[3] * S); }

    function draw() {
      ctx.fillStyle = '#1b5e20'; ctx.fillRect(0, 0, W, H);
      const L = lv() || LEVELS[LEVELS.length - 1];
      // baan
      ctx.fillStyle = '#5d4037'; ctx.fillRect(X(0) - 6, Y(0) - 6, WW * S + 12, WH * S + 12);
      const g = ctx.createLinearGradient(0, Y(0), 0, Y(WH)); g.addColorStop(0, '#66bb6a'); g.addColorStop(1, '#43a047');
      ctx.fillStyle = g; ctx.fillRect(X(0), Y(0), WW * S, WH * S);
      for (const s of L.sand) rect(s, '#e6cf8a');
      for (const w of L.water) { rect(w, '#29b6f6'); ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = 0; k < 4; k++) ctx.fillRect(X(w[0]) + 6 + ((time * 20 + k * 17) % (w[2] * S - 12)), Y(w[1]) + 6 + k * (w[3] * S / 4), 10, 2); }
      // gat
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(X(L.hole[0]), Y(L.hole[1]), HR * S, 0, 7); ctx.fill();
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(L.hole[0]), Y(L.hole[1])); ctx.lineTo(X(L.hole[0]), Y(L.hole[1]) - 34); ctx.stroke();
      ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.moveTo(X(L.hole[0]), Y(L.hole[1]) - 34); ctx.lineTo(X(L.hole[0]) + 18, Y(L.hole[1]) - 28); ctx.lineTo(X(L.hole[0]), Y(L.hole[1]) - 22); ctx.fill();
      // tee
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.arc(X(L.tee[0]), Y(L.tee[1]), 8, 0, 7); ctx.fill();
      // obstakels
      for (const w of obstacles()) { rect(w, '#8d6e63'); ctx.fillStyle = '#a1887f'; ctx.fillRect(X(w[0]), Y(w[1]), w[2] * S, Math.min(3, w[3] * S)); }
      for (const m of L.mills) {
        const s = millSeg(m);
        ctx.strokeStyle = '#ef6c00'; ctx.lineWidth = 2.2 * S; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(X(s[0]), Y(s[1])); ctx.lineTo(X(s[2]), Y(s[3])); ctx.stroke();
        ctx.fillStyle = '#4e342e'; ctx.beginPath(); ctx.arc(X(m.x), Y(m.y), 3.4 * S, 0, 7); ctx.fill();
      }
      // richtlijn
      if (pull && state === 'ready') {
        const dx = pull.x0 - pull.x, dy = pull.y0 - pull.y, d = Math.hypot(dx, dy);
        if (d > 4) {
          const pw = Math.min(1, d / 130), ux = dx / d, uy = dy / d;
          const bx = X(ball.x), by = Y(ball.y), len = 30 + pw * 90;
          ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3; ctx.setLineDash([7, 6]);
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + ux * len, by + uy * len); ctx.stroke(); ctx.setLineDash([]);
          ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - ux * pw * 50, by - uy * pw * 50); ctx.stroke();
          ctx.fillStyle = 'hsl(' + (120 - pw * 120) + ',80%,50%)'; ctx.fillRect(W / 2 - 60, H - 12, 120 * pw, 5);
        }
      }
      // bal
      if (ball.x > 0) {
        let rr = BR * S;
        if (state === 'sink' || state === 'next') rr *= Math.max(0.2, 1 - sinkT * 1.2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(X(ball.x) + 1.5, Y(ball.y) + 2, rr, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(ball.x), Y(ball.y), rr, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.arc(X(ball.x) + rr * 0.25, Y(ball.y) + rr * 0.25, rr * 0.55, 0, 7); ctx.fill();
      }
      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, W, 54);
      T('Baan ' + Math.min(hi + 1, 9) + '/9', 56, 18, 16, '#fff');
      T('Par ' + L.par, W / 2, 18, 16, '#fff');
      T('Slagen ' + strokes, W - 56, 18, 16, '#fff');
      T('Totaal ' + (total + (state === 'done' ? 0 : strokes)) + ' slagen', W / 2, 40, 13, 'rgba(255,255,255,0.85)');
      if (state === 'ready' && !pull && hi === 0 && strokes === 0) T('Sleep achteruit, laat los', W / 2, H - 30, 15, 'rgba(255,255,255,0.9)');
      if (msgT > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, H / 2 - 30, W, 60);
        T(msg, W / 2, H / 2, 28, '#ffeb3b');
      }
    }

    function frame(t) {
      if (dead) return;
      const dt = Math.min(0.033, (t - last) / 1000 || 0.016); last = t;
      update(dt); draw();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        host.removeEventListener('pointerdown', pd); host.removeEventListener('pointermove', pm);
        host.removeEventListener('pointerup', pu); host.removeEventListener('pointercancel', pc);
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      },
    };
  },
};
