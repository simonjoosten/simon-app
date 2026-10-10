// Dinorun: spring over cactussen, duik onder vogels, dag/nacht
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
const mix = (a, b, t) => Math.round(a + (b - a) * t);
const rgb = (a, b, t) => `rgb(${mix(a[0], b[0], t)},${mix(a[1], b[1], t)},${mix(a[2], b[2], t)})`;

export default {
  id: 'dinorun',
  name: 'Dinorun',
  emoji: '🦖',
  hint: 'Tik om te springen, houd onderin ingedrukt om te bukken',
  create(host, api) {
    const { c, g, W, H } = setup(host, api);
    const gy = Math.round(H * 0.72);
    const dino = { y: 0, vy: 0, duck: false };
    let speed = 260, dist = 0, obs = [], nextGap = 300, over = false, dead = false;
    let raf = 0, last = 0, score = 0, hold = false, kDown = false, tt = 0;
    const stars = Array.from({ length: 30 }, () => [Math.random() * W, Math.random() * gy * 0.6, Math.random() * 1.5 + 0.5]);
    const clouds = Array.from({ length: 4 }, (_, i) => [i * 120 + Math.random() * 60, 50 + Math.random() * 120]);

    const jump = () => { if (!over && dino.y <= 0.5) dino.vy = 700; };
    const finish = () => { if (over) return; over = true; api.end(score); };

    const down = (e) => {
      const r = c.getBoundingClientRect();
      const y = (e.clientY - r.top) * H / r.height;
      if (y > gy + 20) hold = true; else jump();
    };
    const up = () => { hold = false; };
    const kd = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { jump(); e.preventDefault(); }
      if (e.code === 'ArrowDown') { kDown = true; e.preventDefault(); }
    };
    const ku = (e) => { if (e.code === 'ArrowDown') kDown = false; };
    host.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const spawn = () => {
      const bird = score > 120 && Math.random() < 0.38;
      if (bird) {
        const low = Math.random() < 0.4;
        obs.push({ t: 'bird', x: W + 40, w: 34, h: 20, hy: low ? 10 : 34, ph: Math.random() * 6 });
      } else {
        const k = 1 + (Math.random() < Math.min(0.6, score / 600) ? 1 + (Math.random() < 0.4 ? 1 : 0) : 0);
        obs.push({ t: 'cactus', x: W + 40, w: 22 * k, h: 34 + Math.random() * 18, k });
      }
      nextGap = speed * (0.75 + Math.random() * 0.8) + 120;
    };

    const night = () => 0.5 - 0.5 * Math.cos(score / 250 * Math.PI);

    const step = (dt) => {
      tt += dt;
      if (over) return;
      speed = Math.min(620, 260 + dist / 60);
      dist += speed * dt;
      score = Math.floor(dist / 12);
      api.score(score);
      dino.duck = (hold || kDown) && dino.y <= 0.5;
      const gr = (hold || kDown) && dino.y > 0 ? 3600 : 1900;
      dino.vy -= gr * dt;
      dino.y += dino.vy * dt;
      if (dino.y <= 0) { dino.y = 0; dino.vy = 0; }
      nextGap -= speed * dt;
      if (nextGap <= 0) spawn();
      for (const o of obs) o.x -= speed * dt;
      obs = obs.filter((o) => o.x > -80);
      const dh = dino.duck ? 22 : 42, dw = dino.duck ? 40 : 28;
      const d = { x: 66, y: gy - dino.y - dh, w: dw, h: dh };
      for (const o of obs) {
        const r = o.t === 'bird'
          ? { x: o.x + 3, y: gy - o.hy - o.h, w: o.w - 6, h: o.h }
          : { x: o.x + 3, y: gy - o.h, w: o.w - 6, h: o.h };
        if (d.x < r.x + r.w && d.x + d.w > r.x && d.y < r.y + r.h && d.y + d.h > r.y) finish();
      }
    };

    const draw = () => {
      const n = night();
      g.fillStyle = rgb([250, 236, 200], [18, 26, 58], n);
      g.fillRect(0, 0, W, H);
      if (n > 0.3) {
        g.globalAlpha = Math.min(1, (n - 0.3) * 1.6);
        g.fillStyle = '#fff';
        for (const s of stars) g.fillRect(s[0], s[1], s[2], s[2]);
        g.globalAlpha = 1;
      }
      g.font = '40px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(n > 0.5 ? '🌙' : '☀️', W - 50, 60 + n * 20);
      g.globalAlpha = 0.7;
      for (const cl of clouds) {
        cl[0] -= 0.25; if (cl[0] < -40) cl[0] = W + 40;
        g.fillText('☁️', cl[0], cl[1]);
      }
      g.globalAlpha = 1;
      g.fillStyle = rgb([214, 190, 140], [60, 60, 80], n);
      g.fillRect(0, gy, W, H - gy);
      g.fillStyle = rgb([160, 135, 90], [30, 30, 48], n);
      g.fillRect(0, gy, W, 3);
      const off = dist % 40;
      for (let x = -off; x < W; x += 40) g.fillRect(x + 10, gy + 22, 12, 3);
      for (let x = -(dist * 0.6 % 70); x < W; x += 70) g.fillRect(x, gy + 50, 6, 2);
      for (const o of obs) {
        if (o.t === 'cactus') {
          g.font = `${Math.round(o.h * 1.05)}px serif`;
          for (let i = 0; i < o.k; i++) g.fillText('🌵', o.x + 11 + i * 22, gy - o.h / 2 - 2);
        } else {
          g.font = '34px serif';
          g.save(); g.translate(o.x + 17, gy - o.hy - 10);
          g.scale(-1, 1 + Math.sin(tt * 14 + o.ph) * 0.2);
          g.fillText('🦅', 0, 0); g.restore();
        }
      }
      // dino
      g.save();
      const dh = dino.duck ? 22 : 42;
      g.translate(66 + (dino.duck ? 20 : 14), gy - dino.y - dh / 2);
      const run = dino.y > 0 ? 0 : Math.sin(tt * 22) * 0.1;
      g.rotate(run);
      g.scale(-1, 1);
      g.font = (dino.duck ? 40 : 52) + 'px serif';
      g.fillText('🦖', 0, dino.duck ? 2 : -2);
      g.restore();
      g.fillStyle = rgb([60, 60, 60], [230, 230, 240], n);
      g.font = 'bold 22px monospace'; g.textAlign = 'left';
      g.fillText(String(score).padStart(5, '0'), 14, 28);
      if (score < 20) { g.font = '14px sans-serif'; g.textAlign = 'center'; g.fillText('onderin ingedrukt houden = bukken', W / 2, gy + 90); }
    };

    const loop = (ts) => {
      if (dead) return;
      const dt = Math.min(0.033, (ts - (last || ts)) / 1000);
      last = ts;
      step(dt); draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        host.removeEventListener('pointerdown', down);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        window.removeEventListener('keydown', kd);
        window.removeEventListener('keyup', ku);
        c.remove();
      },
    };
  },
};
