export default {
  id: 'knikkerkoning', name: 'Knikkerkoning', emoji: '🔮', hint: 'Trek achteruit en laat los: schiet knikkers uit de cirkel',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#2d6a4f';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let dead = false, over = false, raf = 0, last = 0, score = 0;
    const RC = Math.min(W * 0.4, 140), CX = W / 2, CY = Math.max(RC + 70, H * 0.4), MR = 11, SR = 12, FR = 1.6;
    const COLS = ['#e63946', '#f1c40f', '#3498db', '#9b59b6', '#ff8c42', '#1abc9c', '#ec407a'];
    let level = 1, marbles = [], shooter = null, turn = 'player', phase = 'aim', wait = 0, got = [0, 0], msg = '', msgT = 0;
    let pull = null, capThisTurn = 0, roundWon = 0;

    function setup() {
      marbles = []; got = [0, 0]; shooter = null;
      const n = Math.min(17, 7 + level * 2);
      const pos = [{ x: 0, y: 0 }];
      for (let ring = 1; pos.length < n; ring++) {
        const cnt = ring * 6;
        for (let i = 0; i < cnt && pos.length < n; i++) {
          const a = i / cnt * Math.PI * 2 + ring;
          pos.push({ x: Math.cos(a) * ring * (MR * 2.1), y: Math.sin(a) * ring * (MR * 2.1) });
        }
      }
      pos.forEach((p, i) => marbles.push({ x: CX + p.x, y: CY + p.y, vx: 0, vy: 0, r: MR, m: 1, c: COLS[i % COLS.length], tgt: true, out: false }));
      turn = 'player'; phase = 'aim'; say('Jouw beurt!');
    }
    function say(s) { msg = s; msgT = 1.4; }
    setup();

    const pt = e => { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height }; };
    const spx = () => W / 2, spy = () => CY + RC + 55;
    const down = e => { if (over || turn !== 'player' || phase !== 'aim') return; pull = pt(e); try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const move = e => { if (pull) pull = pt(e); };
    const up = () => {
      if (!pull) return;
      const dx = spx() - pull.x, dy = spy() - pull.y, d = Math.hypot(dx, dy); pull = null;
      if (d < 14) return;
      const pw = Math.min(1, d / 130);
      fire(spx(), spy(), dx / d, dy / d, 120 + 650 * pw);
    };
    host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move);
    host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);

    function fire(x, y, dx, dy, v) {
      shooter = { x, y, vx: dx * v, vy: dy * v, r: SR, m: 1.4, c: '#ffffff', tgt: false, shooter: true };
      marbles.push(shooter); phase = 'roll'; capThisTurn = 0;
    }
    function aiShot() {
      const cand = marbles.filter(m => m.tgt && !m.out);
      if (!cand.length) return;
      cand.sort((a, b) => Math.hypot(b.x - CX, b.y - CY) - Math.hypot(a.x - CX, a.y - CY));
      const t = cand[Math.floor(Math.random() * Math.min(3, cand.length))];
      const sx = CX + (Math.random() - 0.5) * RC * 1.4, sy = CY - RC - 50;
      const sig = Math.max(0.03, 0.3 - level * 0.035);
      const g = (Math.random() + Math.random() + Math.random() - 1.5) * 1.15 * sig * 2;
      const a = Math.atan2(t.y - sy, t.x - sx) + g, dist = Math.hypot(t.x - sx, t.y - sy);
      fire(sx, sy, Math.cos(a), Math.sin(a), Math.min(780, FR * dist + 170 + Math.random() * 90));
    }
    function stepPhys(dt) {
      const n = 3, h = dt / n;
      for (let s = 0; s < n; s++) {
        for (const m of marbles) {
          const k = Math.exp(-FR * h); m.vx *= k; m.vy *= k;
          if (Math.hypot(m.vx, m.vy) < 6) { m.vx = 0; m.vy = 0; }
          m.x += m.vx * h; m.y += m.vy * h;
          if (m.x < m.r) { m.x = m.r; m.vx = Math.abs(m.vx) * 0.8; }
          if (m.x > W - m.r) { m.x = W - m.r; m.vx = -Math.abs(m.vx) * 0.8; }
          if (m.y < 40 + m.r) { m.y = 40 + m.r; m.vy = Math.abs(m.vy) * 0.8; }
          if (m.y > H - m.r) { m.y = H - m.r; m.vy = -Math.abs(m.vy) * 0.8; }
        }
        for (let i = 0; i < marbles.length; i++) for (let j = i + 1; j < marbles.length; j++) {
          const a = marbles[i], b = marbles[j];
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), rr = a.r + b.r;
          if (d >= rr || d === 0) continue;
          const nx = dx / d, ny = dy / d, pen = rr - d, t = 1 / a.m + 1 / b.m;
          a.x -= nx * pen / a.m / t; a.y -= ny * pen / a.m / t; b.x += nx * pen / b.m / t; b.y += ny * pen / b.m / t;
          const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (vn < 0) {
            const j2 = -(1.9) * vn / t;
            a.vx -= nx * j2 / a.m; a.vy -= ny * j2 / a.m; b.vx += nx * j2 / b.m; b.vy += ny * j2 / b.m;
          }
        }
      }
    }
    function step(dt) {
      if (over) return;
      if (msgT > 0) msgT -= dt;
      if (phase === 'roll') {
        stepPhys(dt);
        const who = turn === 'player' ? 0 : 1;
        for (const m of marbles) if (m.tgt && !m.out && Math.hypot(m.x - CX, m.y - CY) > RC + m.r * 0.6) {
          m.out = true; got[who]++; capThisTurn++;
          if (who === 0) { score += 100; api.score(score); }
        }
        let moving = false;
        for (const m of marbles) if (m.vx || m.vy) moving = true;
        if (!moving) {
          marbles = marbles.filter(m => !m.shooter); shooter = null;
          const left = marbles.filter(m => m.tgt && !m.out).length;
          if (left === 0) {
            marbles = marbles.filter(m => !m.out);
            if (got[0] > got[1]) {
              score += 300 + level * 100; api.score(score); level++; say('Gewonnen! Volgende ronde'); setup();
            } else { over = true; api.end(score); }
            return;
          }
          if (capThisTurn === 0) { turn = turn === 'player' ? 'pc' : 'player'; }
          phase = 'aim'; wait = 0.9;
          if (turn === 'player') say('Jouw beurt!');
        }
      } else if (phase === 'aim' && turn === 'pc') {
        wait -= dt; if (wait <= 0) aiShot();
      }
    }
    function draw() {
      ctx.fillStyle = '#2d6a4f'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#40916c'; ctx.beginPath(); ctx.arc(CX, CY, RC, 0, 7); ctx.fill();
      ctx.strokeStyle = '#d8f3dc'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.stroke(); ctx.setLineDash([]);
      for (const m of marbles) {
        ctx.globalAlpha = m.out ? 0.55 : 1;
        ctx.fillStyle = m.c; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(m.x - m.r * 0.3, m.y - m.r * 0.3, m.r * 0.25, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (turn === 'player' && phase === 'aim') {
        const x = spx(), y = spy();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, SR, 0, 7); ctx.fill();
        if (pull) {
          const dx = x - pull.x, dy = y - pull.y, d = Math.hypot(dx, dy) || 1, pw = Math.min(1, d / 130);
          ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.setLineDash([4, 6]);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx / d * (60 + 260 * pw), y + dy / d * (60 + 260 * pw)); ctx.stroke(); ctx.setLineDash([]);
        }
      }
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, 40);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillText('Jij ' + got[0], 10, 20); ctx.textAlign = 'center'; ctx.fillText('Ronde ' + level, W / 2, 20);
      ctx.textAlign = 'right'; ctx.fillText('PC ' + got[1], W - 10, 20);
      if (msgT > 0) { ctx.textAlign = 'center'; ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(msg, W / 2, H - 40); }
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
