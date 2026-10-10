export default {
  id: 'molmeppen',
  name: 'Molmeppen',
  emoji: '🐹',
  hint: 'Tik de mollen, laat de konijntjes met rust (30 s)',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#5fb35a';
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const TOTAL = 30, TOP = 70;
    const cw = W / 3, gridH = Math.min(H - TOP - 20, cw * 3.1), gy0 = TOP + (H - TOP - gridH) / 2, ch = gridH / 3;
    let dead = false, done = false, raf = 0, last = 0, el = 0, over = false, overT = 0;
    let score = 0, combo = 0, spawnT = 0.5, pops = [];
    const holes = [];
    for (let i = 0; i < 9; i++) holes.push({ state: 'empty', t: 0, life: 1, kind: 'mole' });

    function upTime() { return Math.max(0.5, 1.3 - el * 0.028); }
    function active() { return holes.filter(h => h.state !== 'empty').length; }
    function spawn() {
      const free = [];
      holes.forEach((h, i) => { if (h.state === 'empty') free.push(i); });
      if (!free.length) return;
      const h = holes[free[Math.floor(Math.random() * free.length)]];
      h.state = 'up'; h.t = 0; h.life = upTime();
      h.kind = (el > 6 && Math.random() < 0.12) ? 'bunny' : 'mole';
    }
    function point(e) {
      const b = host.getBoundingClientRect();
      return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height };
    }
    const onDown = e => {
      e.preventDefault();
      if (over) return;
      const p = point(e);
      const c = Math.floor(p.x / cw), r = Math.floor((p.y - gy0) / ch);
      if (c < 0 || c > 2 || r < 0 || r > 2) return;
      const h = holes[r * 3 + c];
      if (h.state !== 'up') { combo = 0; return; }
      if (h.kind === 'bunny') {
        score = Math.max(0, score - 15); combo = 0;
        pops.push({ x: (c + 0.5) * cw, y: gy0 + r * ch + ch * 0.4, t: 0, txt: '-15', col: '#ff5a5a' });
      } else {
        combo++;
        const pts = 10 + Math.min(combo - 1, 10);
        score += pts;
        pops.push({ x: (c + 0.5) * cw, y: gy0 + r * ch + ch * 0.4, t: 0, txt: '+' + pts, col: '#fff3a0' });
      }
      api.score(score);
      h.state = 'hit'; h.t = 0;
    };
    host.addEventListener('pointerdown', onDown);

    function update(dt) {
      el += dt;
      if (el >= TOTAL) { over = true; el = TOTAL; return; }
      spawnT -= dt;
      const maxAct = el < 8 ? 1 : el < 18 ? 2 : 3;
      if (spawnT <= 0) {
        if (active() < maxAct) spawn();
        spawnT = Math.max(0.25, 0.8 - el * 0.018) * (0.7 + Math.random() * 0.6);
      }
      for (const h of holes) {
        if (h.state === 'up') {
          h.t += dt;
          if (h.t >= h.life) { h.state = 'empty'; if (h.kind === 'mole') combo = 0; }
        } else if (h.state === 'hit') {
          h.t += dt;
          if (h.t > 0.3) h.state = 'empty';
        }
      }
      for (const p of pops) p.t += dt;
      pops = pops.filter(p => p.t < 0.6);
    }
    function draw() {
      ctx.fillStyle = '#5fb35a'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      for (let y = 0; y < H; y += 40) ctx.fillRect(0, y, W, 20);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let i = 0; i < 9; i++) {
        const c = i % 3, r = Math.floor(i / 3), h = holes[i];
        const cx = (c + 0.5) * cw, cy = gy0 + (r + 0.62) * ch;
        const hw = cw * 0.36, hh = ch * 0.17;
        ctx.fillStyle = '#3b2a1a';
        ctx.beginPath(); ctx.ellipse(cx, cy, hw, hh, 0, 0, 7); ctx.fill();
        if (h.state !== 'empty') {
          let k = 1;
          if (h.state === 'up') {
            const rise = Math.min(1, h.t / 0.12), fall = Math.min(1, (h.life - h.t) / 0.12);
            k = Math.min(rise, fall);
          } else k = 1 - h.t / 0.3;
          const size = cw * 0.55;
          ctx.save();
          ctx.beginPath();
          ctx.rect(cx - cw / 2, cy - ch, cw, ch + hh * 0.6);
          ctx.clip();
          ctx.font = size + 'px serif';
          const yy = cy + size * 0.35 - k * size * 0.85;
          ctx.fillText(h.state === 'hit' ? '😵' : (h.kind === 'bunny' ? '🐰' : '🐹'), cx, yy);
          ctx.restore();
        }
        ctx.fillStyle = '#4a3320';
        ctx.beginPath(); ctx.ellipse(cx, cy + hh * 0.5, hw, hh * 0.7, 0, 0, Math.PI); ctx.fill();
      }
      for (const p of pops) {
        ctx.globalAlpha = 1 - p.t / 0.6; ctx.fillStyle = p.col; ctx.font = 'bold 26px sans-serif';
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 4;
        ctx.strokeText(p.txt, p.x, p.y - p.t * 60); ctx.fillText(p.txt, p.x, p.y - p.t * 60);
      }
      ctx.globalAlpha = 1;
      const left = Math.max(0, TOTAL - el);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, 52);
      ctx.font = 'bold 26px sans-serif'; ctx.fillStyle = left < 6 ? '#ffb0b0' : '#fff';
      ctx.textAlign = 'left'; ctx.fillText('⏱ ' + Math.ceil(left), 14, 27);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.fillText(String(score), W - 14, 27);
      ctx.fillStyle = '#ffd23a'; ctx.fillRect(0, 48, W * (left / TOTAL), 4);
      if (over) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 34px sans-serif'; ctx.fillText('Tijd is om!', W / 2, H / 2);
      }
    }
    function frame(t) {
      if (dead) return;
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016);
      last = t;
      if (!over) update(dt);
      else { overT += dt; if (overT > 0.9 && !done) { done = true; api.end(score); } }
      draw();
      if (!done) raf = requestAnimationFrame(frame);
    }
    api.score(0);
    raf = requestAnimationFrame(frame);
    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        host.removeEventListener('pointerdown', onDown);
        if (cv.parentNode === host) host.removeChild(cv);
      },
    };
  },
};
