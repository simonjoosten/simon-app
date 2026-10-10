// Raketpak: houd ingedrukt voor stuwkracht, let op je brandstof
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
  if (!g.roundRect) g.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); };
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { c, g, W, H };
};

export default {
  id: 'raketpak',
  name: 'Raketpak',
  emoji: '🚀',
  hint: 'Houd ingedrukt om te stijgen, laat los om te dalen',
  create(host, api) {
    const { c, g, W, H } = setup(host, api);
    const PX = 90, GY = H - 56, CY = 34, R = 15;
    let y = GY, vy = 0, fuel = 100, holding = false, dist = 0, coins = 0, sc = 170, t = 0;
    let items = [], birds = [], parts = [], coinT = 1, fuelT = 4, birdT = 3, score = 0, flash = 0;
    let over = false, dead = false, raf = 0, last = 0;

    const finish = () => { if (over) return; over = true; api.end(score); };
    const pd = () => { holding = true; };
    const pu = () => { holding = false; };
    const kd = (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') { holding = true; e.preventDefault(); } };
    const ku = (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') holding = false; };
    host.addEventListener('pointerdown', pd);
    window.addEventListener('pointerup', pu);
    window.addEventListener('pointercancel', pu);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const step = (dt) => {
      t += dt; flash = Math.max(0, flash - dt);
      for (const p of parts) { p.x -= sc * dt; p.y += p.vy * dt; p.l -= dt; }
      parts = parts.filter((p) => p.l > 0);
      if (over) return;
      sc = Math.min(340, 170 + dist / 90);
      dist += sc * dt;
      const thrust = holding && fuel > 0;
      vy += (900 - (thrust ? 2100 : 0)) * dt;
      vy = Math.max(-380, Math.min(520, vy));
      y += vy * dt;
      if (thrust) {
        fuel = Math.max(0, fuel - 22 * dt);
        if (Math.random() < 0.8) parts.push({ x: PX - 8, y: y + 26, vy: 120 + Math.random() * 80, l: 0.5 });
      }
      if (y >= GY) { y = GY; if (vy > 0) vy = 0; if (fuel <= 0 && !thrust) { finish(); } }
      if (y <= CY) { y = CY; if (vy < 0) vy = 0; }
      // spawns
      coinT -= dt; fuelT -= dt; birdT -= dt;
      if (coinT <= 0) {
        const cy = 90 + Math.random() * (GY - 170), shape = Math.floor(Math.random() * 3), n = 5;
        for (let i = 0; i < n; i++) items.push({ k: 'coin', x: W + 20 + i * 34, y: cy + (shape === 0 ? 0 : shape === 1 ? Math.sin(i * 0.9) * 40 : (i - 2) * 16) });
        coinT = 1.4 + Math.random() * 1.2;
      }
      if (fuelT <= 0) { items.push({ k: 'fuel', x: W + 20, y: 90 + Math.random() * (GY - 150) }); fuelT = 5 + Math.min(4, dist / 3000) + Math.random() * 2; }
      if (birdT <= 0) {
        birds.push({ x: W + 30, y: 70 + Math.random() * (GY - 110), v: 60 + Math.random() * 100 + dist / 120, w: Math.random() < 0.4 ? 1 : 0, y0: 0, ph: Math.random() * 6 });
        birds[birds.length - 1].y0 = birds[birds.length - 1].y;
        birdT = Math.max(0.7, 2.2 - dist / 2400) * (0.7 + Math.random() * 0.6);
      }
      for (const it of items) {
        it.x -= sc * dt;
        if (!it.got && Math.hypot(it.x - PX, it.y - y) < R + 14) {
          it.got = true;
          if (it.k === 'coin') coins++; else fuel = Math.min(100, fuel + 40);
        }
      }
      items = items.filter((i) => !i.got && i.x > -30);
      for (const b of birds) {
        b.x -= (sc + b.v) * dt;
        if (b.w) b.y = Math.max(50, Math.min(GY - 20, b.y0 + Math.sin(t * 3 + b.ph) * 60));
        if (Math.hypot(b.x - PX, b.y - y) < R + 12) { flash = 0.3; finish(); }
      }
      birds = birds.filter((b) => b.x > -40);
      score = Math.floor(dist / 12) + coins * 10;
      api.score(score);
    };

    const draw = () => {
      const sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#2d7bd8'); sky.addColorStop(1, '#a9dcff');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '50px serif'; g.globalAlpha = 0.85;
      for (let i = 0; i < 4; i++) g.fillText('☁️', ((i * 140 - dist * 0.2) % (W + 120) + W + 120) % (W + 120) - 60, 70 + (i * 83) % 260);
      g.globalAlpha = 1;
      g.fillStyle = '#5aa86a';
      g.beginPath(); g.moveTo(0, GY);
      for (let x = 0; x <= W; x += 20) g.lineTo(x, GY - 30 - 24 * Math.sin((x + dist * 0.4) / 60));
      g.lineTo(W, GY); g.fill();
      g.fillStyle = '#3d8a4c'; g.fillRect(0, GY + 20, W, H);
      g.fillStyle = '#2e6f3c';
      for (let x = -((dist) % 40); x < W; x += 40) g.fillRect(x, GY + 20, 18, 5);
      for (const p of parts) { g.fillStyle = `rgba(255,${Math.round(150 + p.l * 200)},60,${p.l * 1.6})`; g.beginPath(); g.arc(p.x, p.y, 3 + p.l * 6, 0, 7); g.fill(); }
      for (const it of items) { g.font = '28px serif'; g.fillText(it.k === 'coin' ? '🪙' : '⛽', it.x, it.y + Math.sin(t * 6 + it.x) * 2); }
      for (const b of birds) { g.save(); g.translate(b.x, b.y); g.font = '34px serif'; g.rotate(Math.sin(t * 14) * 0.15); g.fillText('🦅', 0, 0); g.restore(); }
      // raketpakman
      const th = holding && fuel > 0 && !over;
      g.save(); g.translate(PX, y);
      g.rotate(Math.max(-0.3, Math.min(0.4, vy / 1300)));
      g.fillStyle = '#c33'; g.fillRect(-16, -8, 10, 24);
      g.fillStyle = '#eee'; g.fillRect(-14, -12, 6, 5);
      if (th) {
        g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(-15, 16); g.lineTo(-11, 16 + 20 + Math.random() * 12); g.lineTo(-7, 16); g.fill();
        g.fillStyle = '#ff6b2c'; g.beginPath(); g.moveTo(-14, 16); g.lineTo(-11, 16 + 10 + Math.random() * 8); g.lineTo(-8, 16); g.fill();
      }
      g.fillStyle = '#3b6fd8'; g.beginPath(); g.roundRect(-8, -6, 18, 22, 5); g.fill();
      g.fillStyle = '#f2c9a0'; g.beginPath(); g.arc(4, -14, 9, 0, 7); g.fill();
      g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(4, -15, 10, Math.PI, 0); g.fill();
      g.fillStyle = '#222'; g.fillRect(8, -16, 5, 3);
      g.restore();
      // hud
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(14, 14, 120, 14);
      g.fillStyle = fuel > 30 ? '#ffd23f' : '#ff5a4a'; g.fillRect(14, 14, 120 * fuel / 100, 14);
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(14, 14, 120, 14);
      g.fillStyle = '#fff'; g.font = 'bold 15px sans-serif'; g.textAlign = 'left';
      g.fillText('⛽', 140, 22); g.fillText('🪙 ' + coins, 14, 46);
      if (fuel <= 0 && !over) { g.textAlign = 'center'; g.fillStyle = '#ffe66b'; g.font = 'bold 20px sans-serif'; g.fillText('Brandstof op!', W / 2, H * 0.3); }
      if (dist < 500) { g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,0.6)'; g.font = '14px sans-serif'; g.fillText('Houd ingedrukt = stuwkracht', W / 2, H * 0.45); }
      if (flash > 0) { g.fillStyle = `rgba(255,255,255,${flash * 2})`; g.fillRect(0, 0, W, H); }
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
        window.removeEventListener('pointerup', pu);
        window.removeEventListener('pointercancel', pu);
        window.removeEventListener('keydown', kd);
        window.removeEventListener('keyup', ku);
        c.remove();
      },
    };
  },
};
