export default {
  id: 'plinko', name: 'Plinko', emoji: '🎰', hint: 'Kies waar je het schijfje laat vallen en haal genoeg punten',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#14213d';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let dead = false, over = false, raf = 0, last = 0, score = 0;
    const G = 900, DR = 7, PR = 4, NS = 7, slotTop = H - 110, floorY = H - 40, sw = W / NS;
    const VALS = [200, 50, 20, 10, 20, 50, 200];
    let round = 1, discsLeft = 0, roundScore = 0, goal = 0, pins = [], discs = [], pops = [], px = W / 2, cool = 0, wait = 0, mode = 'play', msg = '', msgT = 0;
    const keys = {};

    function build() {
      pins = []; discs = [];
      const rows = Math.min(13, 9 + Math.floor(round / 2)), y0 = 120, yb = slotTop - 40, dy = (yb - y0) / (rows - 1);
      const cols = Math.max(6, 8 - Math.floor(round / 4)), dx = W / cols;
      for (let r = 0; r < rows; r++) {
        const off = r % 2 ? dx / 2 : 0;
        for (let c = 0; c <= cols; c++) {
          const x = off + c * dx - (r % 2 ? 0 : 0);
          if (x < PR || x > W - PR) continue;
          pins.push({ x, y: y0 + r * dy });
        }
      }
      discsLeft = 8 + Math.floor((round - 1) / 2); roundScore = 0; goal = 260 + (round - 1) * 70; mode = 'play';
      msg = 'Ronde ' + round + ': haal ' + goal + ' punten'; msgT = 2;
    }
    build();

    const pt = e => { const b = cv.getBoundingClientRect(); return (e.clientX - b.left) * W / b.width; };
    function drop() {
      if (mode !== 'play' || discsLeft <= 0 || cool > 0) return;
      discsLeft--; cool = 0.35;
      discs.push({ x: px, y: 62, vx: (Math.random() - 0.5) * 12, vy: 0, t: 0 });
    }
    const down = e => { px = Math.max(DR, Math.min(W - DR, pt(e))); try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const move = e => { if (e.buttons || e.pointerType !== 'mouse') px = Math.max(DR, Math.min(W - DR, pt(e))); else px = Math.max(DR, Math.min(W - DR, pt(e))); };
    const up = e => { px = Math.max(DR, Math.min(W - DR, pt(e))); drop(); };
    const kd = e => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { keys[e.key] = true; e.preventDefault(); }
      if (e.key === ' ' || e.key === 'ArrowDown') { drop(); e.preventDefault(); }
    };
    const ku = e => { keys[e.key] = false; };
    host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move); host.addEventListener('pointerup', up);
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

    function bumpCircle(d, cx, cy, cr) {
      const dx = d.x - cx, dy = d.y - cy, dist = Math.hypot(dx, dy), rr = DR + cr;
      if (dist >= rr || dist === 0) return;
      const nx = dx / dist, ny = dy / dist; d.x = cx + nx * rr; d.y = cy + ny * rr;
      const vn = d.vx * nx + d.vy * ny;
      if (vn < 0) { d.vx -= 1.5 * vn * nx; d.vy -= 1.5 * vn * ny; d.vx += (Math.random() - 0.5) * 6; }
    }
    function settle(d) {
      const k = Math.max(0, Math.min(NS - 1, Math.floor(d.x / sw))), v = VALS[k];
      score += v; roundScore += v; api.score(score); d.done = true;
      pops.push({ x: (k + 0.5) * sw, y: slotTop - 10, v, t: 1 });
    }
    function step(dt) {
      if (over) return;
      if (msgT > 0) msgT -= dt; if (cool > 0) cool -= dt;
      const kv = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
      if (kv) px = Math.max(DR, Math.min(W - DR, px + kv * W * 0.8 * dt));
      for (const p of pops) p.t -= dt * 0.8; pops = pops.filter(p => p.t > 0);
      const n = 4, h = dt / n;
      for (const d of discs) {
        d.t += dt;
        for (let s = 0; s < n && !d.done; s++) {
          d.vy += G * h; d.x += d.vx * h; d.y += d.vy * h;
          if (d.x < DR) { d.x = DR; d.vx = Math.abs(d.vx) * 0.5; }
          if (d.x > W - DR) { d.x = W - DR; d.vx = -Math.abs(d.vx) * 0.5; }
          for (const p of pins) { if (Math.abs(p.y - d.y) < 14 && Math.abs(p.x - d.x) < 14) bumpCircle(d, p.x, p.y, PR); }
          if (d.y > slotTop - DR) {
            for (let k = 1; k < NS; k++) {
              const dx = d.x - k * sw;
              if (Math.abs(dx) < DR + 2) { d.x = k * sw + Math.sign(dx || 1) * (DR + 2); d.vx = Math.sign(dx || 1) * Math.abs(d.vx) * 0.3; }
            }
          }
          if (d.y > floorY - DR) { d.y = floorY - DR; d.vy = -Math.abs(d.vy) * 0.25; d.vx *= 0.8; }
        }
        if (!d.done && d.y > floorY - DR - 1 && Math.abs(d.vy) < 40) settle(d);
        else if (!d.done && d.t > 14) settle(d);
        else if (!d.done && d.y < slotTop - DR && Math.hypot(d.vx, d.vy) < 4) d.vx += (Math.random() - 0.5) * 80;
      }
      discs = discs.filter(d => !d.done);
      if (mode === 'play' && discsLeft === 0 && discs.length === 0) {
        if (roundScore >= goal) {
          const b = 100 * round; score += b; api.score(score);
          mode = 'next'; wait = 1.6; msg = 'Gehaald! Bonus +' + b; msgT = 1.6;
        } else { over = true; api.end(score); }
      } else if (mode === 'next') { wait -= dt; if (wait <= 0) { round++; build(); } }
    }
    function draw() {
      ctx.fillStyle = '#14213d'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fca311';
      for (const p of pins) { ctx.beginPath(); ctx.arc(p.x, p.y, PR, 0, 7); ctx.fill(); }
      for (let k = 0; k < NS; k++) {
        ctx.fillStyle = VALS[k] >= 200 ? '#e63946' : VALS[k] >= 50 ? '#f4a261' : '#2a9d8f';
        ctx.globalAlpha = 0.35; ctx.fillRect(k * sw, slotTop, sw, floorY - slotTop); ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(VALS[k]), (k + 0.5) * sw, slotTop + 24);
      }
      ctx.fillStyle = '#e5e5e5';
      for (let k = 1; k < NS; k++) ctx.fillRect(k * sw - 2, slotTop, 4, floorY - slotTop);
      ctx.fillRect(0, floorY, W, H - floorY);
      for (const d of discs) { ctx.fillStyle = '#4cc9f0'; ctx.beginPath(); ctx.arc(d.x, d.y, DR, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
      if (mode === 'play' && discsLeft > 0) {
        ctx.fillStyle = 'rgba(76,201,240,.6)'; ctx.beginPath(); ctx.arc(px, 62, DR, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(px, 70); ctx.lineTo(px, 110); ctx.stroke(); ctx.setLineDash([]);
      }
      for (const p of pops) { ctx.globalAlpha = Math.max(0, p.t); ctx.fillStyle = '#ffd166'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('+' + p.v, p.x, p.y - (1 - p.t) * 40); ctx.globalAlpha = 1; }
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      ctx.fillText('Ronde ' + round + '  Doel ' + roundScore + '/' + goal, 10, 10);
      ctx.textAlign = 'right'; ctx.fillText('Schijfjes: ' + discsLeft, W - 10, 10);
      if (msgT > 0) { ctx.textAlign = 'center'; ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#ffd166'; ctx.fillText(msg, W / 2, 34); }
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
        host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move); host.removeEventListener('pointerup', up);
        window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      },
    };
  },
};
