export default {
  id: 'dominostenen', name: 'Dominostenen', emoji: '🁢', hint: 'Tik om stenen te zetten, duw de eerste om: alle stenen moeten vallen',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#264653';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let dead = false, over = false, raf = 0, last = 0, score = 0;
    const GY = H * 0.55, DW = 9, XS = 30, XB = W - 28, BTN = { x: W / 2 - 60, y: H - 80, w: 120, h: 46 };
    let level = 1, dh = 44, doms = [], pits = [], maxN = 0, mode = 'place', lives = 3, bellHit = false, wait = 0, msg = '', msgT = 0, ghost = null, seed = 9, stillT = 0;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const reach = () => dh * 0.85;

    function blocked(x) {
      for (const p of pits) if (x + DW / 2 > p.a && x - DW / 2 < p.b) return true;
      return false;
    }
    function build() {
      seed = level * 1237 + 5; dh = Math.max(30, 44 - 1.5 * (level - 1)); pits = [];
      const R = reach(), np = Math.min(3, Math.floor(level / 2));
      for (let i = 0; i < np; i++) {
        const w = 12 + rnd() * Math.max(2, R - DW - 16), a = 80 + rnd() * (XB - 140 - w);
        let ok = true; for (const p of pits) if (a < p.b + 40 && a + w > p.a - 40) ok = false;
        if (ok) pits.push({ a, b: a + w });
      }
      // greedy minimum
      let x = XS, n = 0, guard = 0;
      while (XB - (x + DW / 2) > R && guard++ < 60) {
        let nx = x + DW + R - 2;
        while (blocked(nx) && nx > x + DW + 3) nx -= 1;
        x = nx; n++;
      }
      maxN = n + Math.max(1, 3 - Math.floor(level / 2));
      doms = [{ x: XS, th: 0, w: 0, fixed: true, hit: false }];
      mode = 'place'; bellHit = false; ghost = null;
      msg = 'Level ' + level + ': max ' + maxN + ' stenen'; msgT = 2;
    }
    build();

    function placed() { return doms.length - 1; }
    const pt = e => { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height }; };
    function push() {
      if (mode !== 'place' || over) return;
      mode = 'run'; doms[0].w = 1.3; stillT = 0;
    }
    const down = e => {
      if (over || mode !== 'place') return;
      const p = pt(e);
      if (p.x >= BTN.x && p.x <= BTN.x + BTN.w && p.y >= BTN.y && p.y <= BTN.y + BTN.h) { push(); return; }
      if (Math.abs(p.x - XS) < 16 && Math.abs(p.y - (GY - dh / 2)) < dh) { push(); return; }
      if (p.y < 60 || p.y > BTN.y - 4) return;
      for (let i = 1; i < doms.length; i++) if (Math.abs(doms[i].x - p.x) < DW / 2 + 5) { doms.splice(i, 1); return; }
      if (placed() >= maxN) { msg = 'Geen stenen meer! Tik een steen om weg te halen'; msgT = 1.5; return; }
      const x = Math.round(p.x);
      if (x < XS + DW + 3 || x > XB - 4 || blocked(x)) return;
      for (const d of doms) if (Math.abs(d.x - x) < DW + 3) return;
      doms.push({ x, th: 0, w: 0, hit: false }); doms.sort((a, b) => a.x - b.x);
    };
    const move = e => { const p = pt(e); ghost = p.x; };
    const kd = e => { if (e.key === ' ' || e.key === 'Enter') { push(); e.preventDefault(); } };
    host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move); window.addEventListener('keydown', kd);

    function reset() { for (const d of doms) { d.th = 0; d.w = 0; d.hit = false; } bellHit = false; mode = 'place'; }
    function step(dt) {
      if (over) return;
      if (msgT > 0) msgT -= dt;
      if (mode === 'run') {
        const n = 4, h = dt / n; let moving = false;
        for (let s = 0; s < n; s++) {
          for (let i = 0; i < doms.length; i++) {
            const d = doms[i];
            if (d.w > 0 || d.th > 0.01) {
              d.w += 37.5 * Math.sin(d.th) * h * (1000 / (dh * 25)) ; d.th += d.w * h;
              if (d.th >= 1.5) { d.th = 1.5; d.w = 0; }
              if (!d.hit) {
                const nx = doms[i + 1];
                if (nx) {
                  const dist = nx.x - d.x - DW;
                  if (dh * Math.sin(d.th) >= dist) { d.hit = true; if (nx.th < 0.06 && nx.w <= 0) nx.w = Math.max(0.8, d.w * 0.9 + 0.5); d.w *= 0.6; }
                } else if (dh * Math.sin(d.th) >= XB - d.x - DW / 2) { d.hit = true; bellHit = true; }
              }
            }
          }
        }
        for (const d of doms) if (d.w > 0.02 && d.th < 1.5) moving = true;
        stillT = moving ? 0 : stillT + dt;
        if (stillT > 0.5) {
          const standing = doms.filter(d => d.th < 0.4).length;
          if (bellHit && standing === 0) {
            const b = 150 + (maxN - placed()) * 40 + level * 50; score += b; api.score(score);
            msg = 'Alles gevallen! +' + b; msgT = 1.8; mode = 'next'; wait = 1.8;
          } else {
            lives--;
            if (lives <= 0) { over = true; api.end(score); return; }
            msg = (bellHit ? 'Niet alle stenen vielen' : 'De ketting brak') + '. Nog ' + lives + ' kansen'; msgT = 2;
            reset();
          }
        }
      } else if (mode === 'next') { wait -= dt; if (wait <= 0) { level++; build(); } }
    }
    function drawDom(d, col) {
      ctx.save(); ctx.translate(d.x + DW / 2, GY); ctx.rotate(d.th);
      ctx.fillStyle = col; ctx.fillRect(-DW, -dh, DW, dh); ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5; ctx.strokeRect(-DW, -dh, DW, dh);
      ctx.fillStyle = '#222'; ctx.fillRect(-DW + 2, -dh * 0.7, DW - 4, 2); ctx.fillRect(-DW + 2, -dh * 0.4, DW - 4, 2);
      ctx.restore();
    }
    function draw() {
      ctx.fillStyle = '#264653'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#e9c46a'; ctx.fillRect(0, GY, W, 24);
      ctx.fillStyle = '#264653'; for (const p of pits) ctx.fillRect(p.a, GY, p.b - p.a, 40);
      ctx.fillStyle = '#2a9d8f'; for (const p of pits) ctx.fillRect(p.a, GY + 8, p.b - p.a, 32);
      ctx.fillStyle = '#1d3a44'; ctx.fillRect(0, GY + 24, W, H);
      ctx.font = '26px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('🔔', XB + 8, GY - dh * 0.6 + 6);
      for (let i = 0; i < doms.length; i++) drawDom(doms[i], i === 0 ? '#e76f51' : '#f4f1de');
      if (mode === 'place' && ghost !== null && placed() < maxN) {
        const gx = Math.round(ghost); ctx.globalAlpha = 0.35; ctx.fillStyle = '#f4f1de'; ctx.fillRect(gx - DW / 2, GY - dh, DW, dh); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      ctx.fillText('Level ' + level + '   ' + '❤️'.repeat(Math.max(0, lives)), 10, 10);
      ctx.textAlign = 'right'; ctx.fillText('Stenen: ' + (maxN - placed()), W - 10, 10);
      ctx.textAlign = 'center'; ctx.font = '13px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.7)';
      ctx.fillText('Rood = startsteen. Tik op een witte steen om hem weg te halen', W / 2, 36);
      ctx.fillStyle = mode === 'place' ? '#e63946' : '#6c757d'; ctx.fillRect(BTN.x, BTN.y, BTN.w, BTN.h);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.textBaseline = 'middle'; ctx.fillText('Duw!', BTN.x + BTN.w / 2, BTN.y + BTN.h / 2);
      if (msgT > 0) { ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#ffd166'; ctx.fillText(msg, W / 2, H * 0.3); }
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
        host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move); window.removeEventListener('keydown', kd);
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      },
    };
  },
};
