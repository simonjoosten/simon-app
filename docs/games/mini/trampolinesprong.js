// Trampolinesprong: stuiter hoger, doe trucs, ontwijk vogels
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
  id: 'trampolinesprong',
  name: 'Trampolinesprong',
  emoji: '🤸',
  hint: 'Sleep om te sturen, tik voor een salto, ontwijk vogels',
  create(host, api) {
    const { c, g, W, H } = setup(host, api);
    const G = 1400, baseY = H * 0.88;
    let px = W / 2, tx = W / 2, y = 0, vy = Math.sqrt(2 * G * 160), bh = 160;
    let rot = 0, flipping = false, flips = 0, peak = 0, scale = 1, bonus = 0, combo = 0;
    let birds = [], birdT = 3, t = 0, over = false, dead = false, raf = 0, last = 0, score = 0;
    let msg = '', msgT = 0, squash = 0;
    let down = null;
    const clouds = Array.from({ length: 8 }, () => [Math.random() * W, Math.random() * 3000, 0.5 + Math.random()]);

    const say = (s) => { msg = s; msgT = 1; };
    const finish = () => { if (over) return; over = true; api.end(score); };
    const flip = () => { if (!flipping && y > 20 && !over) { flipping = true; rot = 0; } };

    const toX = (e) => { const r = c.getBoundingClientRect(); return (e.clientX - r.left) * W / r.width; };
    const pd = (e) => { down = { x: e.clientX, moved: false }; tx = toX(e); };
    const pm = (e) => {
      if (!down) return;
      if (Math.abs(e.clientX - down.x) > 10) down.moved = true;
      tx = toX(e);
    };
    const pu = () => { if (down && !down.moved) flip(); down = null; };
    const kd = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { flip(); e.preventDefault(); }
      if (e.code === 'ArrowLeft') tx = Math.max(24, tx - 70);
      if (e.code === 'ArrowRight') tx = Math.min(W - 24, tx + 70);
    };
    host.addEventListener('pointerdown', pd);
    window.addEventListener('pointermove', pm);
    window.addEventListener('pointerup', pu);
    window.addEventListener('keydown', kd);

    const land = () => {
      y = 0;
      squash = 1;
      if (flipping) {
        // salto niet af
        flipping = false; rot = 0; combo = 0; flips = 0;
        bh = Math.max(120, bh * 0.82);
        say('Oeps, mislukt!');
      } else if (flips > 0) {
        combo += flips;
        bonus += flips * 10 * combo;
        bh = Math.min(1000, bh * (1 + 0.1 * flips) + 10);
        say(flips + 'x salto! combo ' + combo);
        flips = 0;
      } else {
        combo = 0;
        bh = Math.max(130, bh * 0.94);
      }
      vy = Math.sqrt(2 * G * bh);
    };

    const step = (dt) => {
      t += dt;
      msgT = Math.max(0, msgT - dt);
      squash = Math.max(0, squash - dt * 5);
      if (over) return;
      px += (tx - px) * Math.min(1, dt * 9);
      px = Math.max(24, Math.min(W - 24, px));
      vy -= G * dt;
      y += vy * dt;
      if (flipping) {
        rot += dt * 12.6;
        if (rot >= Math.PI * 2) { rot -= Math.PI * 2; flips++; flipping = false; rot = 0; }
      }
      if (y <= 0 && vy < 0) land();
      peak = Math.max(peak, y);
      score = Math.floor(peak / 8) + bonus;
      api.score(score);
      const ts = Math.min(1, 0.72 * H / (Math.max(y, bh) + 90));
      scale += (ts - scale) * Math.min(1, dt * 3);
      birdT -= dt;
      if (birdT <= 0 && peak > 150) {
        const fromL = Math.random() < 0.5;
        const by = Math.max(80, y + (Math.random() - 0.35) * 260);
        const sp = 90 + Math.min(200, peak / 8) + Math.random() * 50;
        birds.push({ x: fromL ? -30 : W + 30, y: by, vx: fromL ? sp : -sp, ph: Math.random() * 6 });
        birdT = Math.max(0.7, 2.6 - peak / 900) * (0.7 + Math.random() * 0.6);
      }
      for (const b of birds) {
        b.x += b.vx * dt;
        if (Math.abs(b.x - px) < 26 && Math.abs(b.y - (y + 20)) < 28) finish();
      }
      birds = birds.filter((b) => b.x > -60 && b.x < W + 60);
    };

    const sy = (wy) => baseY - wy * scale;

    const draw = () => {
      const alt = Math.min(1, peak / 1500);
      const grd = g.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, `rgb(${Math.round(80 - alt * 60)},${Math.round(170 - alt * 120)},${Math.round(240 - alt * 100)})`);
      grd.addColorStop(1, '#bfe8ff');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      g.font = '46px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.globalAlpha = 0.8;
      for (const cl of clouds) g.fillText('☁️', (cl[0] + t * 8 * cl[2]) % (W + 80) - 40, sy(cl[1] + 120));
      g.globalAlpha = 1;
      // grond
      g.fillStyle = '#6cc04a'; g.fillRect(0, sy(0) + 10, W, H);
      // trampoline
      const ty = sy(0), sq = squash * 8;
      g.fillStyle = '#333'; g.fillRect(10, ty + 10, 6, 40); g.fillRect(W - 16, ty + 10, 6, 40);
      g.fillStyle = '#ff5a5f'; g.fillRect(0, ty + sq, W, 10);
      g.fillStyle = '#222'; g.fillRect(0, ty + sq + 10, W, 3);
      // vogels
      for (const b of birds) {
        g.save(); g.translate(b.x, sy(b.y)); g.scale((b.vx > 0 ? -1 : 1) * Math.max(0.7, scale), Math.max(0.7, scale));
        g.rotate(Math.sin(t * 12 + b.ph) * 0.15);
        g.font = '36px serif'; g.fillText('🐦', 0, 0); g.restore();
      }
      // speler
      const s = Math.max(0.75, scale);
      g.save();
      g.translate(px, sy(y + 22 * s / scale));
      g.rotate(-rot);
      g.scale(s, s * (1 - squash * 0.15));
      g.font = '44px serif';
      g.fillText(flipping ? '🤸' : '🧍', 0, 0);
      g.restore();
      // schaduw
      g.fillStyle = 'rgba(0,0,0,0.2)';
      g.beginPath(); g.ellipse(px, ty + 14, 20 * Math.max(0.5, 1 - y / 1500), 4, 0, 0, 7); g.fill();
      // HUD
      g.fillStyle = '#fff'; g.font = 'bold 16px sans-serif'; g.textAlign = 'left';
      g.fillText('Hoogte ' + Math.floor(y / 8) + ' m   Combo x' + combo, 12, 22);
      if (msgT > 0) {
        g.globalAlpha = Math.min(1, msgT * 2); g.textAlign = 'center';
        g.font = 'bold 26px sans-serif'; g.fillStyle = '#fff200';
        g.fillText(msg, W / 2, H * 0.3 - (1 - msgT) * 30); g.globalAlpha = 1;
      }
      if (peak < 100) {
        g.fillStyle = 'rgba(0,0,0,0.5)'; g.font = '14px sans-serif'; g.textAlign = 'center';
        g.fillText('Tik in de lucht voor een salto, land als hij af is!', W / 2, H * 0.45);
      }
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
        window.removeEventListener('pointermove', pm);
        window.removeEventListener('pointerup', pu);
        window.removeEventListener('keydown', kd);
        c.remove();
      },
    };
  },
};
