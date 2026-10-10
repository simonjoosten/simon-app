export default {
  id: 'mikspel',
  name: 'Mikspel',
  emoji: '🎯',
  hint: 'Tik de doelen voor ze verdwijnen - 30 seconden',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#1d2b53';
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const TOTAL = 30, TOP = 64;
    let dead = false, done = false, raf = 0, last = 0, el = 0, over = false, overT = 0;
    let targets = [], pops = [], score = 0, combo = 0, hits = 0, misses = 0, spawnT = 0.3;
    let flash = 0;

    function lifetime() { return Math.max(0.55, 1.5 - el * 0.03); }
    function radius() { return Math.max(22, 38 - el * 0.5); }
    function spawn() {
      const r = radius();
      for (let tries = 0; tries < 20; tries++) {
        const x = r + 8 + Math.random() * (W - 2 * r - 16);
        const y = TOP + r + Math.random() * (H - TOP - 2 * r - 16);
        if (targets.every(t => Math.hypot(t.x - x, t.y - y) > t.r + r + 6)) {
          targets.push({ x, y, r, age: 0, life: lifetime() });
          return;
        }
      }
    }
    function point(e) {
      const b = host.getBoundingClientRect();
      return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height };
    }
    const onDown = e => {
      e.preventDefault();
      if (over) return;
      const p = point(e);
      let best = null, bd = 1e9;
      for (const t of targets) {
        const d = Math.hypot(t.x - p.x, t.y - p.y);
        if (d < t.r + 10 && d < bd) { bd = d; best = t; }
      }
      if (best) {
        targets.splice(targets.indexOf(best), 1);
        combo++; hits++;
        const speedBonus = Math.round((1 - best.age / best.life) * 5);
        const pts = 10 + Math.min(combo - 1, 10) + speedBonus;
        score += pts; api.score(score);
        pops.push({ x: best.x, y: best.y, t: 0, txt: '+' + pts });
      } else {
        combo = 0; misses++; flash = 0.2;
      }
    };
    host.addEventListener('pointerdown', onDown);

    function update(dt) {
      el += dt;
      if (el >= TOTAL) { over = true; el = TOTAL; return; }
      spawnT -= dt;
      const want = el < 10 ? 1 : el < 20 ? 2 : 3;
      if (spawnT <= 0 && targets.length < want + 1) {
        spawn();
        spawnT = Math.max(0.28, 0.75 - el * 0.015);
      }
      for (const t of targets) t.age += dt;
      const before = targets.length;
      targets = targets.filter(t => t.age < t.life);
      if (targets.length < before) combo = 0;
      for (const p of pops) p.t += dt;
      pops = pops.filter(p => p.t < 0.6);
      flash = Math.max(0, flash - dt);
    }
    function draw() {
      ctx.fillStyle = flash > 0 ? '#3a2150' : '#1d2b53'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 36) { ctx.beginPath(); ctx.moveTo(x, TOP); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = TOP; y < H; y += 36) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      for (const t of targets) {
        const k = 1 - t.age / t.life;
        const sc = Math.min(1, t.age / 0.08 + 0.3);
        const r = t.r * sc;
        const cols = ['#ff3b3b', '#ffffff', '#ff3b3b', '#ffffff', '#ff3b3b'];
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = cols[i];
          ctx.beginPath(); ctx.arc(t.x, t.y, r * (1 - i * 0.2), 0, 7); ctx.fill();
        }
        ctx.strokeStyle = k < 0.35 ? '#ffd23a' : 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(t.x, t.y, r + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke();
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const p of pops) {
        ctx.globalAlpha = 1 - p.t / 0.6; ctx.fillStyle = '#ffe14a'; ctx.font = 'bold 22px sans-serif';
        ctx.fillText(p.txt, p.x, p.y - 20 - p.t * 50);
      }
      ctx.globalAlpha = 1;
      // HUD
      const left = Math.max(0, TOTAL - el);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, TOP - 14);
      ctx.fillStyle = left < 6 ? '#ff6b6b' : '#fff'; ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'left'; ctx.fillText('⏱ ' + Math.ceil(left), 14, 24);
      ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.fillText(String(score), W - 14, 24);
      if (combo >= 3) { ctx.textAlign = 'center'; ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 18px sans-serif'; ctx.fillText('Combo x' + combo, W / 2, 24); }
      ctx.fillStyle = '#4ad66d'; ctx.fillRect(0, TOP - 18, W * (left / TOTAL), 4);
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
