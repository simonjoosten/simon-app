export default {
  id: 'mikbalk',
  name: 'Mikbalk',
  emoji: '🎚️',
  hint: 'Tik als de balk in het groene vak zit',
  create(host, api) {
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    host.style.touchAction = 'none';
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'width:100%;height:100%;display:block;touch-action:none';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);

    const X0 = 28, X1 = W - 28, BY = H * 0.5, BH = 70;
    let p = 0, dir = 1, speed = 0.55, zw = 0.3, zc = 0.5, lives = 3, level = 0, score = 0, streak = 0;
    let pause = 0, fb = '', fbCol = '#fff', ended = false, endTimer = 0, raf = 0, alive = true, last = performance.now();
    let hitMark = null;

    function newZone() {
      zw = Math.max(0.045, 0.3 * Math.pow(0.9, level));
      zc = zw / 2 + 0.03 + Math.random() * (1 - zw - 0.06);
      speed = Math.min(2.6, 0.55 * Math.pow(1.09, level));
    }
    newZone();

    function finish() {
      if (ended) return;
      ended = true;
      endTimer = setTimeout(() => { api.end(score); }, 1000);
    }

    function tap() {
      if (ended || pause > 0) return;
      const off = Math.abs(p - zc);
      hitMark = p;
      if (off <= zw / 2) {
        const q = 1 - off / (zw / 2);
        streak++;
        const pts = Math.round((10 + q * 20) * (1 + Math.min(streak, 10) * 0.1));
        score += pts; api.score(score);
        fb = q > 0.85 ? 'BULLSEYE! +' + pts : 'Raak! +' + pts; fbCol = q > 0.85 ? '#ffe066' : '#80ed99';
        level++;
      } else {
        streak = 0; lives--;
        fb = 'Mis!'; fbCol = '#ff6b6b';
        if (lives <= 0) finish();
      }
      pause = 0.6;
    }

    function update(dt) {
      if (pause > 0) {
        pause -= dt;
        if (pause <= 0 && !ended) { hitMark = null; newZone(); }
        return;
      }
      if (ended) return;
      p += dir * speed * dt;
      if (p >= 1) { p = 1; dir = -1; }
      if (p <= 0) { p = 0; dir = 1; }
    }

    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0b132b'); g.addColorStop(1, '#1c2541');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#3a506b';
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(X0, BY - BH / 2, X1 - X0, BH, 14) : ctx.rect(X0, BY - BH / 2, X1 - X0, BH); ctx.fill();
      const zx = X0 + (zc - zw / 2) * (X1 - X0), zwp = zw * (X1 - X0);
      ctx.fillStyle = '#2ecc71'; ctx.fillRect(zx, BY - BH / 2, zwp, BH);
      ctx.fillStyle = '#ffe066'; ctx.fillRect(X0 + zc * (X1 - X0) - 1.5, BY - BH / 2, 3, BH);
      const px = X0 + (hitMark !== null ? hitMark : p) * (X1 - X0);
      ctx.fillStyle = '#fff';
      ctx.fillRect(px - 4, BY - BH / 2 - 14, 8, BH + 28);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Score ' + score, W / 2, 40);
      ctx.font = '22px serif'; ctx.fillText('❤️'.repeat(Math.max(0, lives)), W / 2, 76);
      ctx.font = '15px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('Ronde ' + (level + 1) + '  -  Streak ' + streak, W / 2, 106);
      if (pause > 0) { ctx.fillStyle = fbCol; ctx.font = 'bold 28px sans-serif'; ctx.fillText(fb, W / 2, BY + BH + 50); }
      else if (level === 0 && !ended) { ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.fillText('Tik op het scherm als de balk in het groen zit', W / 2, BY + BH + 50); }
    }

    function frame(now) {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      update(dt); draw();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    function onDown(e) { e.preventDefault(); tap(); }
    function onKey(e) { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) tap(); } }
    cv.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);

    return {
      destroy() {
        alive = false; cancelAnimationFrame(raf); clearTimeout(endTimer);
        cv.removeEventListener('pointerdown', onDown);
        window.removeEventListener('keydown', onKey);
        cv.remove();
      },
    };
  },
};
