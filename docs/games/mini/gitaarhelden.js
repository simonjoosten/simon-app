export default {
  id: 'gitaarhelden',
  name: 'Gitaarhelden',
  emoji: '🎸',
  hint: 'Tik de noten of druk A S D F G',
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
    function beep(f, d = 0.15, type = 'sawtooth', v = 0.08) {
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
    const FREQ = [220, 262, 294, 330, 392];
    const COLS = ['#2ecc71', '#e74c3c', '#f1c40f', '#3498db', '#e67e22'];
    const KEYS = ['a', 's', 'd', 'f', 'g'];

    const BARS = 22, LEAD = 2.6, FALL = 1.6;
    const notes = [];
    let t0 = LEAD, lane = 2;
    for (let b = 0; b < BARS; b++) {
      const bpm = 100 + b * 3.2, step = 60 / bpm / 2;
      const dens = Math.min(0.78, 0.4 + b * 0.02);
      for (let s = 0; s < 8; s++) {
        if (Math.random() > dens) continue;
        lane = Math.max(0, Math.min(4, lane + Math.floor(Math.random() * 3) - 1 + (Math.random() < 0.15 ? Math.floor(Math.random() * 5) - 2 : 0)));
        const t = t0 + s * step;
        notes.push({ lane, t, state: 0 });
        if (b >= 6 && Math.random() < Math.min(0.25, (b - 5) * 0.02)) {
          let l2 = Math.floor(Math.random() * 5);
          if (l2 !== lane) notes.push({ lane: l2, t, state: 0 });
        }
      }
      t0 += step * 8;
    }
    const endT = t0 + 0.6;

    const hitY = H - 140, lw = W / 5;
    let T = 0, score = 0, streak = 0, bestStreak = 0, health = 100, ended = false, endTimer = 0, raf = 0, alive = true, last = performance.now();
    let flash = [0, 0, 0, 0, 0], floats = [], shake = 0;
    const mult = () => 1 + Math.min(3, Math.floor(streak / 10));

    function finish() {
      if (ended) return;
      ended = true;
      endTimer = setTimeout(() => { api.end(Math.round(score)); }, 1000);
    }

    function press(l) {
      if (ended) return;
      flash[l] = 1;
      let bn = null;
      for (const n of notes) {
        if (n.lane !== l || n.state) continue;
        const d = Math.abs(n.t - T);
        if (d < 0.19 && (!bn || d < Math.abs(bn.t - T))) bn = n;
      }
      const x = (l + 0.5) * lw;
      if (!bn) {
        beep(90, 0.12, 'square', 0.05);
        streak = 0; health = Math.max(0, health - 3);
        if (health <= 0) finish();
        return;
      }
      const d = Math.abs(bn.t - T);
      beep(FREQ[l] * 2, 0.22);
      if (d < 0.08) { bn.state = 1; score += 100 * mult(); floats.push({ x, y: hitY - 30, text: 'PERFECT', col: '#ffe066', life: 0.7 }); }
      else { bn.state = 2; score += 50 * mult(); floats.push({ x, y: hitY - 30, text: 'GOED', col: '#9bf6a0', life: 0.7 }); }
      streak++; if (streak > bestStreak) bestStreak = streak;
      if (streak % 10 === 0) floats.push({ x: W / 2, y: H * 0.3, text: 'x' + mult() + ' MULTIPLIER!', col: '#ff9f1c', life: 1, big: true });
      health = Math.min(100, health + 1.5);
      api.score(Math.round(score));
    }

    function update(dt) {
      T += dt; shake = Math.max(0, shake - dt * 4);
      for (let i = 0; i < 5; i++) flash[i] = Math.max(0, flash[i] - dt * 5);
      for (const n of notes) {
        if (!n.state && T > n.t + 0.17) {
          n.state = 3; streak = 0; health -= 10; shake = 1;
          beep(70, 0.1, 'square', 0.04);
          if (health <= 0 && !ended) { health = 0; finish(); }
        }
      }
      floats.forEach((f) => { f.life -= dt; f.y -= 30 * dt; });
      floats = floats.filter((f) => f.life > 0);
      if (!ended && T > endT) finish();
    }

    function draw() {
      ctx.save();
      if (shake > 0) ctx.translate((Math.random() - 0.5) * 6 * shake, 0);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0d0221'); g.addColorStop(1, '#2d0b4e');
      ctx.fillStyle = g; ctx.fillRect(-10, 0, W + 20, H);
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.03 + flash[i] * 0.12) + ')';
        ctx.fillRect(i * lw, 0, lw, H);
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo((i + 0.5) * lw, 0); ctx.lineTo((i + 0.5) * lw, H); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, hitY); ctx.lineTo(W, hitY); ctx.stroke();
      for (const n of notes) {
        const y = hitY - (n.t - T) / FALL * hitY;
        if (y < -30 || y > H || n.state === 1 || n.state === 2) continue;
        const x = (n.lane + 0.5) * lw;
        ctx.globalAlpha = n.state === 3 ? 0.25 : 1;
        ctx.fillStyle = COLS[n.lane];
        ctx.shadowColor = COLS[n.lane]; ctx.shadowBlur = n.state ? 0 : 12;
        ctx.beginPath(); ctx.arc(x, y, 20, 0, 7); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
      }
      for (let i = 0; i < 5; i++) {
        const x = (i + 0.5) * lw, y = H - 60;
        ctx.fillStyle = COLS[i]; ctx.globalAlpha = 0.45 + flash[i] * 0.55;
        ctx.beginPath(); ctx.arc(x, y, 28 + flash[i] * 4, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, hitY, 24, 0, 7); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(KEYS[i].toUpperCase(), x, y);
      }
      for (const f of floats) {
        ctx.globalAlpha = Math.min(1, f.life * 2); ctx.fillStyle = f.col; ctx.font = 'bold ' + (f.big ? 24 : 16) + 'px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(f.text, f.x, f.y); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Streak ' + streak, 12, 24);
      ctx.fillStyle = '#ff9f1c'; ctx.textAlign = 'right'; ctx.font = 'bold 22px sans-serif';
      ctx.fillText('x' + mult(), W - 12, 24);
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(12, 38, W - 24, 8);
      ctx.fillStyle = health > 35 ? '#2ecc71' : '#ff6b6b'; ctx.fillRect(12, 38, (W - 24) * health / 100, 8);
      if (T < 2) { ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.fillText('Tik de knop als de noot de lijn raakt', W / 2, H / 2); }
      ctx.restore();
    }

    function frame(now) {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      update(dt); draw();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    function onDown(e) {
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      const x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
      if (y < H * 0.35) return;
      press(Math.max(0, Math.min(4, Math.floor(x / lw))));
    }
    function onKey(e) { const i = KEYS.indexOf(e.key.toLowerCase()); if (i >= 0 && !e.repeat) press(i); }
    cv.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);

    return {
      destroy() {
        alive = false; cancelAnimationFrame(raf); clearTimeout(endTimer);
        cv.removeEventListener('pointerdown', onDown);
        window.removeEventListener('keydown', onKey);
        try { ac && ac.close(); } catch (e) { /* */ }
        cv.remove();
      },
    };
  },
};
