export default {
  id: 'prullenbak', name: 'Prullenbak', emoji: '🗑️', hint: 'Veeg omhoog om het propje in de prullenbak te gooien (60 s)',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = 'linear-gradient(#f5e6c8,#d9c19a)';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    let dead = false, raf = 0, last = 0, ended = false;
    let t = 0, score = 0, streak = 0, endDelay = 0;
    const TOTAL = 60, BY = 110, SX = W / 2, SY = H - 90;
    let bin = { x: W / 2, w: 120 };
    let ball = null; // flying
    const pops = [];
    let aim = 0, drag = null;
    const keys = {};
    function pt(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height, t: performance.now() }; }
    const pd = e => { if (ball) return; drag = { pts: [pt(e)] }; try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const pm = e => { if (drag) { drag.pts.push(pt(e)); if (drag.pts.length > 12) drag.pts.shift(); } };
    const pu = e => {
      if (!drag) return;
      const p = pt(e); drag.pts.push(p);
      const now = p.t, arr = drag.pts.filter(q => now - q.t < 150);
      const a = arr[0], b = arr[arr.length - 1];
      drag = null;
      if (!a || ended || ball) return;
      const dtm = Math.max(16, b.t - a.t) / 1000;
      let vx = (b.x - a.x) / dtm, vy = (b.y - a.y) / dtm;
      if (vy > -150) return; // moet omhoog
      const sp = Math.hypot(vx, vy), cap = 900;
      if (sp > cap) { vx *= cap / sp; vy *= cap / sp; }
      if (sp < 400) { vx *= 400 / sp; vy *= 400 / sp; }
      throwBall(vx, vy);
    };
    function throwBall(vx, vy) { ball = { x: SX, y: SY, vx, vy }; }
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm);
    host.addEventListener('pointerup', pu); const pc = () => { drag = null; };
    host.addEventListener('pointercancel', pc);
    const kd = e => {
      keys[e.key] = true;
      if ((e.key === ' ' || e.key === 'ArrowUp') && !ball && !ended) { throwBall(aim * 400, -700); e.preventDefault(); }
    };
    const ku = e => { keys[e.key] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    api.score(0);
    function addPop(x, y, s, c) { pops.push({ x, y, s, c, life: 1 }); }
    function frame(ts) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min((ts - (last || ts)) / 1000, 0.05); last = ts;
      if (!ended) {
        t += dt;
        if (keys.ArrowLeft) aim = Math.max(-1, aim - dt * 1.5);
        if (keys.ArrowRight) aim = Math.min(1, aim + dt * 1.5);
        const k = t / TOTAL;
        bin.w = 120 - 60 * Math.min(1, k);
        const amp = (W / 2 - bin.w / 2 - 10) * Math.min(1, 0.25 + k * 0.9);
        bin.x = W / 2 + Math.sin(t * (1.2 + k * 1.6)) * amp;
        if (ball) {
          ball.x += ball.vx * dt; ball.y += ball.vy * dt;
          if (ball.x < 8 || ball.x > W - 8) { ball.vx = -ball.vx; ball.x = Math.max(8, Math.min(W - 8, ball.x)); }
          if (ball.y <= BY + 20) {
            if (Math.abs(ball.x - bin.x) < bin.w / 2) {
              streak++; const pts = 10 + Math.min(streak - 1, 5) * 5; score += pts; api.score(score);
              addPop(bin.x, BY, '+' + pts, '#1b8a3a');
            } else { streak = 0; addPop(ball.x, BY + 30, 'mis', '#c0392b'); }
            ball = null;
          } else if (ball.y < -20) { ball = null; streak = 0; }
        }
        if (t >= TOTAL) { ended = true; endDelay = 0.8; }
      } else if (endDelay > 0) { endDelay -= dt; if (endDelay <= 0) { endDelay = -1; api.end(score); } }
      for (let i = pops.length - 1; i >= 0; i--) { pops[i].life -= dt * 1.5; pops[i].y -= dt * 40; if (pops[i].life <= 0) pops.splice(i, 1); }
      draw();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      // bin
      ctx.fillStyle = '#5d6d7e';
      const bw = bin.w;
      ctx.beginPath(); ctx.moveTo(bin.x - bw / 2, BY - 20); ctx.lineTo(bin.x + bw / 2, BY - 20);
      ctx.lineTo(bin.x + bw / 2 - 10, BY + 30); ctx.lineTo(bin.x - bw / 2 + 10, BY + 30); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2c3e50'; ctx.fillRect(bin.x - bw / 2 - 4, BY - 26, bw + 8, 10);
      // ball
      if (ball) {
        const prog = Math.max(0, Math.min(1, (SY - ball.y) / (SY - BY)));
        ctx.font = Math.round(34 - prog * 14) + 'px serif'; ctx.fillText('📄', ball.x, ball.y);
      } else if (!ended) { ctx.font = '34px serif'; ctx.fillText('📄', SX, SY); }
      if (!ball && !ended) {
        if (drag && drag.pts.length > 1) {
          const l = drag.pts[drag.pts.length - 1];
          ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]);
          ctx.beginPath(); ctx.moveTo(SX, SY); ctx.lineTo(SX + (l.x - drag.pts[0].x), SY + (l.y - drag.pts[0].y)); ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.font = '14px sans-serif';
        ctx.fillText('veeg omhoog', SX, H - 30);
      }
      ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = '#333'; ctx.textAlign = 'left';
      ctx.fillText('⏱ ' + Math.max(0, Math.ceil(TOTAL - t)) + 's', 10, 20);
      ctx.textAlign = 'right'; ctx.fillText(streak > 1 ? '🔥 ' + streak + 'x' : '', W - 10, 20);
      ctx.textAlign = 'center'; ctx.font = 'bold 22px sans-serif';
      for (const p of pops) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; ctx.fillText(p.s, p.x, p.y); }
      ctx.globalAlpha = 1;
    }
    raf = requestAnimationFrame(frame);
    return { destroy() {
      dead = true; cancelAnimationFrame(raf);
      host.removeEventListener('pointerdown', pd); host.removeEventListener('pointermove', pm);
      host.removeEventListener('pointerup', pu); host.removeEventListener('pointercancel', pc);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      cv.remove();
    } };
  },
};
