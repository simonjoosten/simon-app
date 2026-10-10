export default {
  id: 'drumpad',
  name: 'Drumpad',
  emoji: '🥁',
  hint: 'Tik de pads in het ritme van de blokjes',
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
    function beep(f, d = 0.08, type = 'sine', v = 0.15) {
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
    const SOUND = [[110, 0.18, 'triangle'], [220, 0.12, 'sawtooth'], [440, 0.08, 'square'], [880, 0.05, 'square']];
    const COLS = ['#ff5d73', '#ffb703', '#4cc9f0', '#80ed99'];
    const KEYS = ['d', 'f', 'j', 'k'];

    const PATS = ['0.1.2.3.', '0.0.1.1.', '0.1.0.1.', '0..1..2.', '0.2.1.3.', '0.12.3.1', '0.0.12.3', '01230123', '0.103.21', '01.23.01'];
    const BARS = 16, LEAD = 2.5, FALL = 1.7;
    const notes = [];
    let t0 = LEAD;
    for (let b = 0; b < BARS; b++) {
      const bpm = 90 + b * 5, bar = 240 / bpm, step = bar / 8;
      const maxP = Math.min(PATS.length, 2 + Math.floor(b / 2));
      const pat = PATS[Math.floor(Math.random() * maxP)];
      const mirror = Math.random() < 0.5;
      for (let s = 0; s < 8; s++) {
        const ch = pat[s];
        if (ch === '.') continue;
        let lane = +ch; if (mirror) lane = 3 - lane;
        notes.push({ lane, t: t0 + s * step, state: 0 });
      }
      t0 += bar;
    }
    const endT = t0 + 0.6;

    let T = 0, score = 0, combo = 0, health = 100, ended = false, endTimer = 0, raf = 0, alive = true, last = performance.now();
    let flash = [0, 0, 0, 0], floats = [];
    const hitY = H - 170, padTop = H - 150;

    function finish() {
      if (ended) return;
      ended = true;
      endTimer = setTimeout(() => { api.end(Math.round(score)); }, 900);
    }

    function press(lane) {
      if (ended) return;
      flash[lane] = 1;
      const s = SOUND[lane]; beep(s[0], s[1], s[2]);
      let bn = null;
      for (const n of notes) {
        if (n.lane !== lane || n.state) continue;
        const d = Math.abs(n.t - T);
        if (d < 0.19 && (!bn || d < Math.abs(bn.t - T))) bn = n;
      }
      const x = (lane + 0.5) * W / 4;
      if (!bn) { combo = 0; health = Math.max(0, health - 3); if (health <= 0) finish(); return; }
      const d = Math.abs(bn.t - T);
      if (d < 0.075) { bn.state = 1; combo++; score += 100 * mult(); health = Math.min(100, health + 2); floats.push({ x, y: hitY - 20, text: 'PERFECT', col: '#ffe066', life: 0.7 }); }
      else { bn.state = 2; combo++; score += 50 * mult(); health = Math.min(100, health + 1); floats.push({ x, y: hitY - 20, text: 'GOED', col: '#80ed99', life: 0.7 }); }
      api.score(Math.round(score));
    }
    function mult() { return 1 + Math.min(4, Math.floor(combo / 8)) * 0.25; }

    function update(dt) {
      T += dt;
      for (let i = 0; i < 4; i++) flash[i] = Math.max(0, flash[i] - dt * 5);
      for (const n of notes) {
        if (!n.state && T > n.t + 0.16) {
          n.state = 3; combo = 0; health -= 12;
          floats.push({ x: (n.lane + 0.5) * W / 4, y: hitY - 20, text: 'MIS', col: '#ff6b6b', life: 0.7 });
          if (health <= 0) { health = 0; finish(); }
        }
      }
      floats.forEach((f) => { f.life -= dt; f.y -= 30 * dt; });
      floats = floats.filter((f) => f.life > 0);
      if (!ended && T > endT) finish();
    }

    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#12141f'); g.addColorStop(1, '#262a44');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const lw = W / 4;
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)';
        ctx.fillRect(i * lw, 0, lw, padTop);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, hitY); ctx.lineTo(W, hitY); ctx.stroke();
      for (const n of notes) {
        const y = hitY - (n.t - T) / FALL * hitY;
        if (y < -30 || y > H) continue;
        if (n.state === 1 || n.state === 2) continue;
        ctx.globalAlpha = n.state === 3 ? 0.3 : 1;
        ctx.fillStyle = COLS[n.lane];
        const x = n.lane * lw + 8;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y - 14, lw - 16, 28, 8) : ctx.rect(x, y - 14, lw - 16, 28); ctx.fill();
        ctx.globalAlpha = 1;
      }
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = COLS[i];
        ctx.globalAlpha = 0.45 + flash[i] * 0.55;
        ctx.beginPath();
        const x = i * lw + 6, y = padTop + 6, w = lw - 12, h = H - padTop - 16;
        ctx.roundRect ? ctx.roundRect(x, y, w, h, 16) : ctx.rect(x, y, w, h);
        ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(KEYS[i].toUpperCase(), i * lw + lw / 2, padTop + (H - padTop) / 2 - 4);
      }
      for (const f of floats) {
        ctx.globalAlpha = Math.min(1, f.life * 2); ctx.fillStyle = f.col; ctx.font = 'bold 16px sans-serif';
        ctx.fillText(f.text, f.x, f.y); ctx.globalAlpha = 1;
      }
      ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif';
      ctx.fillText('Combo ' + combo + '  x' + mult().toFixed(2), 12, 24);
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(12, 38, W - 24, 8);
      ctx.fillStyle = health > 35 ? '#80ed99' : '#ff6b6b'; ctx.fillRect(12, 38, (W - 24) * health / 100, 8);
      if (T < 2) { ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.fillText('Tik de pad als het blokje de lijn raakt', W / 2, H / 2); }
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
      if (y < H * 0.4) return;
      press(Math.max(0, Math.min(3, Math.floor(x / (W / 4)))));
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
