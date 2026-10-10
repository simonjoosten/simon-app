export default {
  id: 'stapelen',
  name: 'Stapelen',
  emoji: '🧱',
  hint: 'Tik op het juiste moment om het blok neer te zetten',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#1b1f3b';
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const BH = 30, baseY = H - 90;
    let dead = false, done = false, raf = 0, last = 0, over = false, overT = 0;
    let blocks = [{ x: (W - W * 0.55) / 2, w: W * 0.55 }];
    let cur = null, dirn = 1, cam = 0, camT = 0, score = 0, combo = 0;
    const falling = [];
    const stars = [];
    for (let i = 0; i < 40; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.3 });

    function hue(i) { return (200 + i * 14) % 360; }
    function speed() { return Math.min(520, 150 + blocks.length * 11); }
    // dirn is richting van het volgende bewegende blok
    dirn = 1; cur = { x: -blocks[0].w, w: blocks[0].w };

    function place() {
      if (over || !cur) return;
      const top = blocks[blocks.length - 1];
      const l = Math.max(cur.x, top.x), r = Math.min(cur.x + cur.w, top.x + top.w);
      const ov = r - l;
      if (ov <= 0) {
        falling.push({ x: cur.x, w: cur.w, y: baseY - blocks.length * BH, vy: 0, h: blocks.length });
        over = true; cur = null; return;
      }
      let nb;
      if (Math.abs(cur.x - top.x) < 5) {
        nb = { x: top.x, w: top.w }; combo++;
        if (combo >= 3) nb.w = Math.min(W * 0.8, nb.w + 4), nb.x -= 2;
      } else {
        nb = { x: l, w: ov }; combo = 0;
        if (cur.x < top.x) falling.push({ x: cur.x, w: top.x - cur.x, y: baseY - blocks.length * BH, vy: 0, h: blocks.length });
        else falling.push({ x: top.x + top.w, w: cur.x + cur.w - (top.x + top.w), y: baseY - blocks.length * BH, vy: 0, h: blocks.length });
      }
      blocks.push(nb);
      score = blocks.length - 1; api.score(score);
      camT = Math.max(0, (blocks.length - 6) * BH);
      // volgend blok komt van de andere kant
      cur = { x: dirn > 0 ? -nb.w : W, w: nb.w };
      cur.dir = dirn; dirn = -dirn;
    }
    // eerste blok beweegt van links naar rechts
    cur.dir = 1; dirn = -1;

    const onDown = e => { e.preventDefault(); place(); };
    const onKey = e => { if (e.code === 'Space' || e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); place(); } };
    host.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);

    function update(dt) {
      cam += (camT - cam) * Math.min(1, dt * 5);
      if (cur && !over) {
        cur.x += cur.dir * speed() * dt;
        if (cur.dir > 0 && cur.x + cur.w > W + 20) { cur.x = W + 20 - cur.w; cur.dir = -1; }
        if (cur.dir < 0 && cur.x < -20) { cur.x = -20; cur.dir = 1; }
      }
      for (const f of falling) { f.vy += 1400 * dt; f.y += f.vy * dt; }
    }
    function yOf(i) { return baseY - i * BH + cam; }
    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0e1230'); g.addColorStop(1, '#3a2d6b');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (const s of stars) {
        const y = (s.y + cam * 0.2) % H;
        ctx.fillRect(s.x, y, s.r, s.r);
      }
      ctx.fillStyle = '#2d2a4a'; ctx.fillRect(0, yOf(0) + BH, W, H);
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i], y = yOf(i);
        if (y > H || y < -BH) continue;
        ctx.fillStyle = `hsl(${hue(i)},70%,55%)`; ctx.fillRect(b.x, y, b.w, BH - 2);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(b.x, y, b.w, 5);
      }
      if (cur) {
        const y = yOf(blocks.length);
        ctx.fillStyle = `hsl(${hue(blocks.length)},80%,62%)`; ctx.fillRect(cur.x, y, cur.w, BH - 2);
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(cur.x, y, cur.w, 5);
      }
      for (const f of falling) {
        ctx.fillStyle = `hsl(${hue(f.h)},60%,45%)`; ctx.fillRect(f.x, f.y + cam, f.w, BH - 2);
      }
      ctx.fillStyle = '#fff'; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(score), W / 2, 56);
      if (combo >= 2 && !over) {
        ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = '#ffd54a'; ctx.fillText('Perfect x' + combo + '!', W / 2, 96);
      }
      if (score === 0 && !over) {
        ctx.font = '18px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('Tik om het blok neer te zetten', W / 2, H * 0.35);
      }
    }
    function frame(t) {
      if (dead) return;
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016);
      last = t;
      update(dt);
      if (over) { overT += dt; if (overT > 1.1 && !done) { done = true; api.end(score); } }
      draw();
      if (!done) raf = requestAnimationFrame(frame);
    }
    api.score(0);
    raf = requestAnimationFrame(frame);
    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        host.removeEventListener('pointerdown', onDown);
        window.removeEventListener('keydown', onKey);
        if (cv.parentNode === host) host.removeChild(cv);
      },
    };
  },
};
