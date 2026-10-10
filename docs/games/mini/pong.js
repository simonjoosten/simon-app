export default {
  id: 'pong', name: 'Pong', emoji: '🏓', hint: 'Sleep om je batje te bewegen',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#101a2e';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let dead = false, over = false, raf = 0, last = 0, score = 0;
    const pw = Math.max(70, W * 0.24), ph = 12, r = 8, py = H - 50, ay = 50;
    const P = { x: W / 2 }, A = { x: W / 2, err: 0 };
    const keys = {};
    let tx = null;
    let ball, speed = 300, serveT = 0.8;
    function serve(dir) {
      const a = (Math.random() - 0.5) * 0.9;
      ball = { x: W / 2, y: H / 2, vx: speed * Math.sin(a), vy: dir * speed * Math.cos(a) };
      serveT = 0.7;
    }
    serve(1);
    const pos = e => { const b = cv.getBoundingClientRect(); return (e.clientX - b.left) * W / b.width; };
    const down = e => { tx = pos(e); try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const move = e => { if (tx !== null || e.pointerType === 'mouse') tx = pos(e); };
    const up = () => { };
    const kd = e => { keys[e.key] = true; if (e.key.indexOf('Arrow') === 0) e.preventDefault(); };
    const ku = e => { keys[e.key] = false; };
    host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move); host.addEventListener('pointerup', up);
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

    function update(dt) {
      // speler
      const kv = ((keys.ArrowRight || keys.d || keys.D) ? 1 : 0) - ((keys.ArrowLeft || keys.a || keys.A) ? 1 : 0);
      if (kv) { P.x += kv * W * 1.3 * dt; tx = null; }
      else if (tx !== null) P.x = tx;
      P.x = Math.max(pw / 2, Math.min(W - pw / 2, P.x));
      // computer
      const aiSpeed = Math.min(W * 1.7, 150 + score * 16);
      let target = W / 2;
      if (ball.vy < 0) target = ball.x + A.err;
      const d = target - A.x, m = aiSpeed * dt;
      A.x += Math.abs(d) < m ? d : Math.sign(d) * m;
      A.x = Math.max(pw / 2, Math.min(W - pw / 2, A.x));
      if (serveT > 0) { serveT -= dt; return; }
      const steps = Math.max(1, Math.ceil(Math.hypot(ball.vx, ball.vy) * dt / 6));
      const sd = dt / steps;
      for (let s = 0; s < steps && !over; s++) {
        ball.x += ball.vx * sd; ball.y += ball.vy * sd;
        if (ball.x < r) { ball.x = r; ball.vx = Math.abs(ball.vx); }
        if (ball.x > W - r) { ball.x = W - r; ball.vx = -Math.abs(ball.vx); }
        if (ball.vy > 0 && ball.y + r >= py && ball.y + r <= py + ph + 14 && Math.abs(ball.x - P.x) <= pw / 2 + r) {
          score++; api.score(score);
          speed = Math.min(300 + score * 14, 720);
          const rel = Math.max(-1, Math.min(1, (ball.x - P.x) / (pw / 2)));
          const a = rel * 1.05;
          ball.vx = speed * Math.sin(a); ball.vy = -speed * Math.cos(a); ball.y = py - r;
          A.err = (Math.random() - 0.5) * Math.max(0, pw * 1.6 - score * 6);
        } else if (ball.vy < 0 && ball.y - r <= ay + ph && ball.y - r >= ay - 14 && Math.abs(ball.x - A.x) <= pw / 2 + r) {
          const rel = Math.max(-1, Math.min(1, (ball.x - A.x) / (pw / 2)));
          const a = rel * 1.0;
          ball.vx = speed * Math.sin(a); ball.vy = speed * Math.cos(a); ball.y = ay + ph + r;
        }
        if (ball.y < -r * 2) { A.err = 0; serve(1); break; }
        if (ball.y > H + r * 2) { over = true; api.end(score); break; }
      }
    }
    function rr(x, y, w, h, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x + 6, y); ctx.arcTo(x + w, y, x + w, y + h, 6); ctx.arcTo(x + w, y + h, x, y + h, 6); ctx.arcTo(x, y + h, x, y, 6); ctx.arcTo(x, y, x + w, y, 6); ctx.fill(); }
    function draw() {
      ctx.fillStyle = '#101a2e'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.setLineDash([10, 10]); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.font = 'bold 120px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(score), W / 2, H / 2);
      rr(A.x - pw / 2, ay, pw, ph, '#ff6b6b'); rr(P.x - pw / 2, py, pw, ph, '#4dd0e1');
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, r, 0, 7); ctx.fill();
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
      host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move); host.removeEventListener('pointerup', up);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      if (cv.parentNode) cv.parentNode.removeChild(cv);
    } };
  },
};
