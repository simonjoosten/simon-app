export default {
  id: 'ritmetik',
  name: 'Ritmetik',
  emoji: '🎯',
  hint: 'Tik de doelen precies als de ring ze raakt',
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

    let ac = null;
    function beep(f, d = 0.08, type = 'sine', v = 0.12) {
      try {
        if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return; ac = new C(); }
        if (ac.state === 'suspended') ac.resume();
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(v, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d);
        o.connect(g); g.connect(ac.destination);
        o.start(); o.stop(ac.currentTime + d);
      } catch (e) { /* geen geluid */ }
    }

    const TOTAL = 45, R = 34;
    let T = 0, spawned = 0, nextSpawn = 0.8, score = 0, combo = 0, best = 0, lives = 3;
    let targets = [], floats = [], ended = false, endTimer = 0, raf = 0, alive = true, last = performance.now();
    let perfects = 0;
    const cols = ['#ff4d6d', '#ffb703', '#4cc9f0', '#80ed99'];

    function approach() { return Math.max(0.55, 1.25 - spawned * 0.016); }
    function gap() { return Math.max(0.34, 0.95 - spawned * 0.014); }

    function spawn() {
      let x = 0, y = 0;
      for (let k = 0; k < 14; k++) {
        x = 50 + Math.random() * (W - 100);
        y = 130 + Math.random() * (H - 230);
        let ok = true;
        for (const t of targets) if (!t.done && Math.hypot(t.x - x, t.y - y) < R * 2.6) ok = false;
        if (ok) break;
      }
      spawned++;
      targets.push({ x, y, t0: T, A: approach(), hit: T + approach(), done: false, n: ((spawned - 1) % 4) + 1, col: cols[(spawned - 1) % 4] });
    }

    function addFloat(x, y, text, col) { floats.push({ x, y, text, col, life: 0.8 }); }

    function loseLife() {
      lives--; combo = 0;
      if (lives <= 0) finish();
    }

    function finish() {
      if (ended) return;
      ended = true;
      endTimer = setTimeout(() => { api.end(Math.round(score)); }, 900);
    }

    function tap(x, y) {
      if (ended) return;
      let best_ = null, bd = 1e9;
      for (const t of targets) {
        if (t.done) continue;
        if (T < t.hit - 0.32) continue;
        const d = Math.hypot(t.x - x, t.y - y);
        if (d < R + 14 && d < bd) { bd = d; best_ = t; }
      }
      if (!best_) return;
      const dt = Math.abs(T - best_.hit);
      best_.done = true; best_.doneT = T;
      if (dt < 0.075) {
        combo++; perfects++;
        score += 300 * (1 + Math.min(combo, 30) / 10);
        addFloat(best_.x, best_.y, 'PERFECT', '#ffe066'); best_.res = 'p'; beep(988, 0.1);
      } else if (dt < 0.17) {
        combo++;
        score += 100 * (1 + Math.min(combo, 30) / 10);
        addFloat(best_.x, best_.y, 'GOED', '#80ed99'); best_.res = 'g'; beep(660, 0.08);
      } else {
        addFloat(best_.x, best_.y, T < best_.hit ? 'TE VROEG' : 'TE LAAT', '#ff6b6b'); best_.res = 'm'; beep(150, 0.15, 'square', 0.06);
        loseLife();
      }
      if (combo > best) best = combo;
      api.score(Math.round(score));
    }

    function update(dt) {
      T += dt;
      if (!ended && spawned < TOTAL && T >= nextSpawn) { spawn(); nextSpawn = T + gap(); }
      for (const t of targets) {
        if (!t.done && T > t.hit + 0.2) {
          t.done = true; t.doneT = T; t.res = 'm';
          addFloat(t.x, t.y, 'MIS', '#ff6b6b'); beep(120, 0.15, 'square', 0.05);
          loseLife();
        }
      }
      targets = targets.filter((t) => !t.done || T - t.doneT < 0.4);
      floats.forEach((f) => { f.life -= dt; f.y -= 40 * dt; });
      floats = floats.filter((f) => f.life > 0);
      if (!ended && spawned >= TOTAL && targets.every((t) => t.done)) finish();
    }

    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1b1038'); g.addColorStop(1, '#3a1c71');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(W / 2, H / 2, 60 + i * 55 + (T * 20) % 55, 0, 7); ctx.stroke(); }
      for (const t of targets) {
        const k = t.done ? 1 - (T - t.doneT) / 0.4 : Math.min(1, (T - t.t0) / 0.2);
        ctx.globalAlpha = Math.max(0, k);
        ctx.fillStyle = t.col;
        ctx.beginPath(); ctx.arc(t.x, t.y, t.done ? R * (1 + (1 - k) * 0.5) : R, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(t.n), t.x, t.y + 1);
        if (!t.done) {
          const p = Math.max(0, (t.hit - T) / t.A);
          const rr = R + p * 80;
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(t.x, t.y, rr, 0, 7); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      for (const f of floats) {
        ctx.globalAlpha = Math.min(1, f.life * 2);
        ctx.fillStyle = f.col; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(f.text, f.x, f.y - R - 6);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Combo ' + combo, 14, 28);
      ctx.textAlign = 'right';
      ctx.fillText('❤️'.repeat(Math.max(0, lives)), W - 14, 28);
      ctx.textAlign = 'center'; ctx.font = '14px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(Math.min(spawned, TOTAL) + ' / ' + TOTAL, W / 2, 28);
      if (T < 2.5) { ctx.font = '16px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('Tik als de ring het doel raakt!', W / 2, H - 40); }
    }

    function frame(now) {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      update(dt); draw();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    function pt(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
    function onDown(e) { e.preventDefault(); const p = pt(e); tap(p.x, p.y); }
    cv.addEventListener('pointerdown', onDown);

    return {
      destroy() {
        alive = false; cancelAnimationFrame(raf); clearTimeout(endTimer);
        cv.removeEventListener('pointerdown', onDown);
        try { ac && ac.close(); } catch (e) { /* */ }
        cv.remove();
      },
    };
  },
};
