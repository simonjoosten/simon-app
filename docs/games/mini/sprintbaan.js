// Sprintbaan: hordenloop, tik in het ritme, goede timing geeft snelheid
const setup = (host, api) => {
  host.style.touchAction = 'none';
  host.style.userSelect = 'none';
  const W = api.w || 360, H = api.h || 640;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const c = document.createElement('canvas');
  c.width = W * dpr; c.height = H * dpr;
  c.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
  host.appendChild(c);
  const g = c.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { c, g, W, H };
};

export default {
  id: 'sprintbaan',
  name: 'Sprintbaan',
  emoji: '🏅',
  hint: 'Tik als je bij de gouden streep bent: perfecte timing = sneller',
  create(host, api) {
    const { c, g, W, H } = setup(host, api);
    const PXM = 30, PX = 100, AIR = 0.52, HMAX = 74, HH = 34, MID = AIR / 2;
    const gy = Math.round(H * 0.58);
    let x = 0, v = 6.5, tj = null, stumble = 0, lives = 3, hurdles = [], nextH = 12, t = 0;
    let perfects = 0, cleared = 0, combo = 0, score = 0, msg = '', msgT = 0, msgC = '#fff', flash = 0;
    let over = false, dead = false, raf = 0, last = 0;

    const finish = () => { if (over) return; over = true; api.end(score); };
    const say = (s, col) => { msg = s; msgC = col || '#fff'; msgT = 0.8; };
    const tap = () => {
      if (over || tj !== null || stumble > 0) return;
      tj = 0;
    };
    const pd = () => tap();
    const kd = (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') { tap(); e.preventDefault(); } };
    host.addEventListener('pointerdown', pd);
    window.addEventListener('keydown', kd);

    const hgt = () => { if (tj === null) return 0; const k = tj / AIR; return HMAX * 4 * k * (1 - k); };

    const step = (dt) => {
      t += dt; msgT = Math.max(0, msgT - dt); flash = Math.max(0, flash - dt);
      if (over) return;
      stumble = Math.max(0, stumble - dt);
      v = Math.max(4.5, Math.min(11.5, v - 0.1 * dt));
      x += v * dt;
      if (tj !== null) { tj += dt; if (tj >= AIR) tj = null; }
      while (nextH < x + W / PXM + 6) {
        hurdles.push({ x: nextH, passed: false, down: 0 });
        nextH += 7 + v * 0.12 + Math.random() * 0.4;
      }
      for (const h of hurdles) {
        if (!h.passed && x >= h.x) {
          h.passed = true;
          const hi = hgt();
          if (tj !== null && hi > HH + 4) {
            const err = Math.abs(tj - MID);
            cleared++;
            if (err < 0.045) { v = Math.min(11.5, v + 0.55); perfects++; combo++; say('PERFECT!', '#ffe66b'); }
            else if (err < 0.09) { v = Math.min(11.5, v + 0.22); combo++; say('Goed', '#9fe58f'); }
            else { combo = 0; v = Math.max(4.5, v - 0.15); say(tj < MID ? 'Te vroeg' : 'Te laat', '#ddd'); }
          } else {
            h.down = 1; combo = 0; lives--; stumble = 0.5; v = Math.max(4.5, v * 0.6); flash = 0.3; tj = null;
            say('Omver!', '#ff6b6b');
            if (lives <= 0) { score = Math.floor(x) + cleared * 10 + perfects * 5; api.score(score); finish(); return; }
          }
        }
      }
      hurdles = hurdles.filter((h) => h.x > x - 6);
      score = Math.floor(x) + cleared * 10 + perfects * 5;
      api.score(score);
    };

    const sxm = (m) => PX + (m - x) * PXM;

    const runner = (px, py, col, ph, jumpH, stum) => {
      g.save(); g.translate(px, py - jumpH);
      g.strokeStyle = '#222'; g.lineWidth = 5; g.lineCap = 'round';
      const air = jumpH > 1 || stum;
      const a = air ? 0 : Math.sin(ph);
      // benen
      g.beginPath(); g.moveTo(0, -18);
      g.lineTo(air ? 18 : a * 12, air ? -2 : 0); g.stroke();
      g.beginPath(); g.moveTo(0, -18);
      g.lineTo(air ? -14 : -a * 12, air ? -8 : 0); g.stroke();
      g.save(); if (air) g.rotate(0.25);
      g.fillStyle = col; g.fillRect(-7, -42, 14, 26);
      g.fillStyle = '#f2c9a0'; g.beginPath(); g.arc(2, -48, 8, 0, 7); g.fill();
      g.strokeStyle = '#f2c9a0'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(0, -38); g.lineTo(air ? 18 : -a * 10 + 8, air ? -44 : -26); g.stroke();
      g.beginPath(); g.moveTo(0, -38); g.lineTo(air ? -14 : a * 10 - 4, air ? -30 : -26); g.stroke();
      g.restore();
      g.restore();
    };

    const draw = () => {
      // lucht + stadion
      const sky = g.createLinearGradient(0, 0, 0, gy);
      sky.addColorStop(0, '#6ec0ff'); sky.addColorStop(1, '#d6efff');
      g.fillStyle = sky; g.fillRect(0, 0, W, gy);
      g.fillStyle = '#8b93a8'; g.fillRect(0, gy - 150, W, 150);
      g.fillStyle = '#6c7489'; g.fillRect(0, gy - 150, W, 10);
      const cols = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#fff'];
      for (let r = 0; r < 4; r++) for (let i = 0; i < 40; i++) {
        const cx = ((i * 14 - x * PXM * 0.3 + r * 6) % (W + 20) + W + 20) % (W + 20) - 10;
        g.fillStyle = cols[(i * 7 + r * 3) % 5];
        g.beginPath(); g.arc(cx, gy - 130 + r * 28 + Math.sin(t * 6 + i) * (combo > 1 ? 3 : 1), 5, 0, 7); g.fill();
      }
      // baan
      g.fillStyle = '#c4533a'; g.fillRect(0, gy, W, 200);
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 3;
      for (const ly of [gy + 40, gy + 100, gy + 160]) { g.beginPath(); g.moveTo(0, ly); g.lineTo(W, ly); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,0.5)';
      for (let m = Math.floor(x) - 2; m < x + 14; m++) if (m % 10 === 0) g.fillRect(sxm(m), gy, 3, 200);
      g.fillStyle = '#3f8f46'; g.fillRect(0, gy + 200, W, H);
      // rivalen (alleen decor)
      const rv = (t * 8.4 + 3);
      runner(PX + (rv - x) * PXM, gy + 150, '#4d96ff', t * 14, 0, false);
      runner(PX + (t * 7.6 + 6 - x) * PXM, gy + 195, '#6bcb77', t * 13 + 1, 0, false);
      // gouden richtlijn voor de volgende horde
      const nh = hurdles.find((h) => !h.passed);
      if (nh && tj === null && stumble <= 0) {
        const ix = nh.x - v * MID;
        const dist = ix - x;
        const px = sxm(ix);
        const near = Math.max(0, 1 - Math.abs(dist) / 1.2);
        g.fillStyle = `rgba(255,214,64,${0.35 + near * 0.6})`;
        g.fillRect(px - 3, gy + 8, 6, 62);
        g.beginPath(); g.moveTo(px - 12, gy - 8); g.lineTo(px + 12, gy - 8); g.lineTo(px, gy + 8); g.fill();
        if (near > 0.5) { g.fillStyle = '#fff'; g.font = 'bold 18px sans-serif'; g.textAlign = 'center'; g.fillText('TIK!', px, gy - 18); }
      }
      // hordes
      for (const h of hurdles) {
        const hx = sxm(h.x);
        if (hx < -40 || hx > W + 40) continue;
        g.save(); g.translate(hx, gy + 70);
        if (h.down) { g.rotate(-h.down * 0.0); g.translate(Math.min(40, (1 - h.down) * 0 + 20), -4); g.rotate(1.2); }
        g.fillStyle = '#eee'; g.fillRect(-3, -HH, 6, HH);
        g.fillStyle = '#ff9f1c'; g.fillRect(-26, -HH, 52, 8);
        g.fillStyle = '#fff'; g.fillRect(-26, -HH + 3, 52, 2);
        g.restore();
      }
      // speler
      if (flash <= 0 || Math.floor(t * 20) % 2) runner(PX, gy + 70, '#ff4d4d', t * (8 + v), hgt(), stumble > 0);
      // hud
      g.fillStyle = '#fff'; g.font = 'bold 20px sans-serif'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      g.fillText(Math.floor(x) + ' m', 14, 30);
      g.font = 'bold 14px sans-serif';
      g.fillText(v.toFixed(1) + ' m/s   ' + '❤️'.repeat(Math.max(0, lives)), 14, 52);
      const bw = 150;
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(W - bw - 14, 16, bw, 12);
      g.fillStyle = '#ffd93d'; g.fillRect(W - bw - 14, 16, bw * (v - 4.5) / 7, 12);
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(W - bw - 14, 16, bw, 12);
      if (combo > 1) { g.textAlign = 'right'; g.fillStyle = '#ffe66b'; g.fillText('Reeks x' + combo, W - 14, 50); }
      if (msgT > 0) { g.textAlign = 'center'; g.globalAlpha = Math.min(1, msgT * 2); g.fillStyle = msgC; g.font = 'bold 28px sans-serif'; g.fillText(msg, W / 2, gy + 260 - (0.8 - msgT) * 30); g.globalAlpha = 1; }
      if (x < 40) { g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,0.65)'; g.font = '14px sans-serif'; g.fillText('Tik zodra de gouden streep jouw positie raakt', W / 2, gy + 300); }
      if (flash > 0) { g.fillStyle = `rgba(255,0,0,${flash})`; g.fillRect(0, 0, W, H); }
    };

    const loop = (ts) => {
      if (dead) return;
      const dt = Math.min(0.033, (ts - (last || ts)) / 1000);
      last = ts; step(dt); draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        host.removeEventListener('pointerdown', pd);
        window.removeEventListener('keydown', kd);
        c.remove();
      },
    };
  },
};
