export default {
  id: 'tunnelracer', name: 'Tunnelracer', emoji: '🏎️', hint: 'Sleep links/rechts om door de tunnel te sturen',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#101426';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    let dead = false, raf = 0, last = 0, ended = false;
    const STEP = 8, N = Math.ceil(H / STEP) + 4;
    // tunnel rows: center & width, rows[0] is top
    let phase = 0, dist = 0, scroll = 0, speed = 140, score = 0, tt = 0;
    function tunnelAt(d) { // d = distance along the track
      const amp = Math.min(40 + d * 0.012, 100);
      const c = W / 2 + Math.sin(d * 0.012) * amp + Math.sin(d * 0.0053 + 1) * amp * 0.8;
      const w = Math.max(70, 210 - d * 0.02);
      return { c: Math.max(w / 2 + 6, Math.min(W - w / 2 - 6, c)), w };
    }
    const py = H - 110;
    let px = W / 2, tx = W / 2, down = false;
    const keys = {};
    function toX(e) { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) * W / r.width; }
    const pd = e => { down = true; tx = toX(e); try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const pm = e => { if (down || e.pointerType === 'mouse') tx = toX(e); };
    const pu = () => { down = false; };
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm);
    host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pu);
    const kd = e => { keys[e.key] = true; }, ku = e => { keys[e.key] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    api.score(0);
    function frame(ts) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min((ts - (last || ts)) / 1000, 0.05); last = ts;
      if (!ended) {
        tt += dt;
        speed = 140 + Math.min(tt * 5, 220);
        dist += speed * dt;
        if (keys.ArrowLeft || keys.a) tx -= 400 * dt;
        if (keys.ArrowRight || keys.d) tx += 400 * dt;
        tx = Math.max(8, Math.min(W - 8, tx));
        px += (tx - px) * Math.min(1, dt * 14);
        score = Math.floor(dist / 10);
        api.score(score);
        // collision: the tunnel at player's row; row y -> distance = dist + (py - y) ... top is farther ahead
        const tn = tunnelAt(dist + (H - py));
        if (Math.abs(px - tn.c) > tn.w / 2 - 9) { ended = true; api.end(score); }
      }
      draw();
    }
    function draw() {
      ctx.fillStyle = '#101426'; ctx.fillRect(0, 0, W, H);
      // walls
      const left = [], right = [];
      for (let y = H; y >= -STEP; y -= STEP) {
        const tn = tunnelAt(dist + (H - y));
        left.push([tn.c - tn.w / 2, y]); right.push([tn.c + tn.w / 2, y]);
      }
      ctx.beginPath();
      left.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
      ctx.closePath();
      ctx.fillStyle = '#2b3a67'; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = '#6cf';
      ctx.beginPath(); left.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
      ctx.strokeStyle = '#f6c'; ctx.beginPath(); right.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
      // dashes
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      for (let y = H; y > 0; y -= STEP) {
        if (Math.floor((dist + (H - y)) / 40) % 2 === 0) { const tn = tunnelAt(dist + (H - y)); ctx.fillRect(tn.c - 2, y, 4, STEP); }
      }
      ctx.font = '34px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(ended ? '💥' : '🏎️', px, py);
    }
    raf = requestAnimationFrame(frame);
    return { destroy() {
      dead = true; cancelAnimationFrame(raf);
      host.removeEventListener('pointerdown', pd); host.removeEventListener('pointermove', pm);
      host.removeEventListener('pointerup', pu); host.removeEventListener('pointercancel', pu);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      cv.remove();
    } };
  },
};
