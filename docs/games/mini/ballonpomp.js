export default {
  id: 'ballonpomp',
  name: 'Ballonpomp',
  emoji: '🎈',
  hint: 'Pomp de ballon op, bewaar voor hij knapt',
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
    function beep(f, d = 0.06, type = 'sine', v = 0.1) {
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

    const TOTAL = 10;
    const KINDS = [
      { c: '#ef476f', max: 8, v: 5, label: 'rood' },
      { c: '#ffd166', max: 16, v: 8, label: 'geel' },
      { c: '#118ab2', max: 24, v: 12, label: 'blauw' },
    ];
    let n = 0, kind, limit, pumps, bank, score = 0, state = 'play', stateT = 0, T = 0, squeeze = 0;
    let pieces = [], ended = false, endTimer = 0, raf = 0, alive = true, last = performance.now(), msg = '';
    const cx = W / 2, cy = H * 0.38;
    const btnY = H - 130, btnH = 84;
    const pumpB = { x: 16, y: btnY, w: W * 0.58 - 16, h: btnH };
    const keepB = { x: W * 0.58 + 8, y: btnY, w: W * 0.42 - 24, h: btnH };

    function newBalloon() {
      n++;
      kind = KINDS[Math.floor(Math.random() * 3)];
      limit = 1 + Math.floor(Math.random() * kind.max);
      if (limit < 2) limit = 2;
      pumps = 0; bank = 0; state = 'play'; msg = '';
    }
    newBalloon();

    function radius() { return 34 + Math.min(pumps, 24) * 4.4 + squeeze * 6; }

    function finish() {
      if (ended) return;
      ended = true;
      endTimer = setTimeout(() => { api.end(score); }, 1200);
    }

    function pump() {
      if (state !== 'play' || ended) return;
      pumps++; squeeze = 1;
      if (pumps >= limit) {
        state = 'pop'; stateT = 0; msg = 'KNAL! -' + bank; bank = 0;
        beep(90, 0.3, 'sawtooth', 0.2);
        const r = radius();
        for (let i = 0; i < 18; i++) {
          const a = Math.random() * 6.28;
          pieces.push({ x: cx + Math.cos(a) * r * 0.6, y: cy + Math.sin(a) * r * 0.6, vx: Math.cos(a) * (150 + Math.random() * 200), vy: Math.sin(a) * (150 + Math.random() * 200) - 80, life: 1, c: kind.c });
        }
        return;
      }
      bank += kind.v;
      beep(300 + pumps * 25, 0.07, 'triangle');
    }

    function keep() {
      if (state !== 'play' || ended || pumps === 0) return;
      score += bank; api.score(score);
      msg = 'Opgeborgen! +' + bank;
      state = 'kept'; stateT = 0;
      beep(1000, 0.2);
    }

    function update(dt) {
      T += dt; squeeze = Math.max(0, squeeze - dt * 6);
      for (const p of pieces) { p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
      pieces = pieces.filter((p) => p.life > 0);
      if (state === 'pop' || state === 'kept') {
        stateT += dt;
        if (stateT > (state === 'pop' ? 1.0 : 0.8)) {
          if (n >= TOTAL) { state = 'done'; finish(); }
          else newBalloon();
        }
      }
    }

    function rr(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }

    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#a2d2ff'); g.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 3; i++) { const x = (i * 150 + T * 8) % (W + 100) - 50; ctx.beginPath(); ctx.arc(x, 90 + i * 40, 28, 0, 7); ctx.arc(x + 26, 96 + i * 40, 22, 0, 7); ctx.fill(); }
      if (state === 'play' || state === 'kept') {
        const r = radius(), wob = Math.sin(T * 3) * 3;
        const x = cx + wob, y = cy - (state === 'kept' ? stateT * 400 : 0);
        ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y + r); ctx.quadraticCurveTo(x - 12, y + r + 40, x, y + r + 80); ctx.stroke();
        ctx.fillStyle = kind.c;
        ctx.beginPath(); ctx.ellipse(x, y, r * 0.88, r, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x - 8, y + r + 12); ctx.lineTo(x + 8, y + r + 12); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.35, r * 0.15, r * 0.25, 0.5, 0, 7); ctx.fill();
        if (pumps >= 1 && state === 'play') {
          ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String(bank), x, y);
        }
      }
      for (const p of pieces) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 10, 10); ctx.globalAlpha = 1; }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (msg && state !== 'play') { ctx.fillStyle = state === 'pop' ? '#d00000' : '#2b9348'; ctx.font = 'bold 32px sans-serif'; ctx.fillText(msg, W / 2, cy); }
      ctx.fillStyle = '#12355b'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Score ' + score, 14, 26);
      ctx.textAlign = 'right'; ctx.fillText('Ballon ' + Math.min(n, TOTAL) + '/' + TOTAL, W - 14, 26);
      ctx.textAlign = 'center'; ctx.font = '14px sans-serif'; ctx.fillStyle = '#12355b';
      if (state === 'play') ctx.fillText('Deze ballon is ' + kind.label + ': ' + (kind.max <= 8 ? 'klein, veilig, weinig punten' : kind.max <= 16 ? 'gemiddeld' : 'kan groot worden, veel punten per pomp'), W / 2, btnY - 16);
      const act = state === 'play' && !ended;
      ctx.globalAlpha = act ? 1 : 0.5;
      ctx.fillStyle = '#ff7b00'; rr(pumpB.x, pumpB.y, pumpB.w, pumpB.h, 22); ctx.fill();
      ctx.fillStyle = '#2b9348'; rr(keepB.x, keepB.y, keepB.w, keepB.h, 22); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 26px sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      ctx.fillText('POMP', pumpB.x + pumpB.w / 2, pumpB.y + pumpB.h / 2);
      ctx.fillText('BEWAAR', keepB.x + keepB.w / 2, keepB.y + keepB.h / 2);
      ctx.globalAlpha = 1;
    }

    function frame(now) {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      update(dt); draw();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    const inside = (b, x, y) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    function onDown(e) {
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      const x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
      if (inside(keepB, x, y)) keep();
      else if (inside(pumpB, x, y) || (y < btnY - 30 && y > 50)) pump();
    }
    function onKey(e) {
      if (e.code === 'Space' && !e.repeat) { e.preventDefault(); pump(); }
      else if (e.key === 'Enter' || e.key.toLowerCase() === 'b') keep();
    }
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
