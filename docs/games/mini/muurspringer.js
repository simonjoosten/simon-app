// Muurspringer: spring van muur naar muur omhoog
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
  id: 'muurspringer',
  name: 'Muurspringer',
  emoji: '🧗',
  hint: 'Tik om naar de andere muur te springen, ontwijk de stekels',
  create(host, api) {
    const { c, g, W, H } = setup(host, api);
    const WALL = 34, R = 13, JT = 0.27, py0 = H * 0.7;
    const xL = WALL + R, xR = W - WALL - R;
    let side = 0, jumping = false, jt = 0, fromX = xL, x = xL, wy = 0; // wy = hoogte in wereld
    let spikes = [], stars = [], nextY = 300, over = false, dead = false, raf = 0, last = 0;
    let score = 0, got = 0, buffered = false, t = 0;

    const finish = () => { if (over) return; over = true; api.end(score); };
    const tap = () => {
      if (over) return;
      if (jumping) { buffered = true; return; }
      jumping = true; jt = 0; fromX = x; side = 1 - side;
    };
    const pd = () => tap();
    const kd = (e) => { if (['Space', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.code)) { tap(); e.preventDefault(); } };
    host.addEventListener('pointerdown', pd);
    window.addEventListener('keydown', kd);

    const gen = () => {
      while (nextY < wy + H + 200) {
        const s = Math.random() < 0.5 ? 0 : 1;
        const h = 60 + Math.random() * 60;
        spikes.push({ s, y: nextY, h });
        if (Math.random() < 0.35) stars.push({ x: W / 2, y: nextY + 60 + Math.random() * 60, taken: false });
        nextY += 150 + Math.random() * 110 + Math.min(80, wy / 80) * 0.5 + (spd() * 0.35);
      }
    };
    const spd = () => Math.min(300, 120 + wy / 25);

    const step = (dt) => {
      t += dt;
      if (over) return;
      wy += spd() * dt;
      const target = side === 0 ? xL : xR;
      if (jumping) {
        jt += dt / JT;
        if (jt >= 1) { jumping = false; x = target; if (buffered) { buffered = false; tap(); } }
        else { const e = jt * jt * (3 - 2 * jt); x = fromX + (target - fromX) * e; }
      } else x = target;
      gen();
      score = Math.floor(wy / 10) + got * 5;
      api.score(score);
      for (const sp of spikes) {
        // stekel: rechthoek aan de muur, breedte 24
        const rx = sp.s === 0 ? WALL : W - WALL - 24, ry0 = sp.y, ry1 = sp.y + sp.h;
        const cx = Math.max(rx, Math.min(rx + 24, x)), cy = Math.max(ry0, Math.min(ry1, wy));
        if ((x - cx) ** 2 + (wy - cy) ** 2 < (R - 2) ** 2) finish();
      }
      for (const st of stars) {
        if (!st.taken && Math.abs(st.y - wy) < 28 && Math.abs(st.x - x) < 50) { st.taken = true; got++; }
      }
      spikes = spikes.filter((s) => s.y + s.h > wy - 200);
      stars = stars.filter((s) => s.y > wy - 200 && !s.taken);
    };

    const sy = (y) => py0 - (y - wy);

    const draw = () => {
      const h = Math.min(1, wy / 8000);
      g.fillStyle = `rgb(${Math.round(40 - h * 30)},${Math.round(30 + h * 0)},${Math.round(70 + h * 10)})`;
      g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,0.15)';
      for (let i = 0; i < 20; i++) g.fillRect((i * 97) % W, ((i * 211 + wy * 0.2) % H), 2, 2);
      // muren met stenen
      for (const sd of [0, 1]) {
        const x0 = sd === 0 ? 0 : W - WALL;
        g.fillStyle = '#6b5a4a'; g.fillRect(x0, 0, WALL, H);
        g.fillStyle = '#54463a';
        for (let yy = -(wy % 40); yy < H; yy += 40) { g.fillRect(x0, yy, WALL, 3); g.fillRect(x0 + (Math.floor((yy + wy) / 40) % 2 ? 10 : 22), yy, 3, 40); }
      }
      // stekels
      for (const sp of spikes) {
        const top = sy(sp.y + sp.h), bot = sy(sp.y);
        if (bot < -10 || top > H + 10) continue;
        g.fillStyle = '#d0d4dc';
        const n = Math.max(2, Math.round(sp.h / 22));
        const step2 = sp.h / n;
        for (let i = 0; i < n; i++) {
          g.beginPath();
          if (sp.s === 0) { g.moveTo(WALL, bot - i * step2); g.lineTo(WALL + 24, bot - (i + 0.5) * step2); g.lineTo(WALL, bot - (i + 1) * step2); }
          else { g.moveTo(W - WALL, bot - i * step2); g.lineTo(W - WALL - 24, bot - (i + 0.5) * step2); g.lineTo(W - WALL, bot - (i + 1) * step2); }
          g.closePath(); g.fill();
        }
      }
      g.font = '26px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (const st of stars) g.fillText('⭐', st.x, sy(st.y));
      // speler
      g.save();
      g.translate(x, py0);
      const lean = jumping ? (side === 1 ? 0.5 : -0.5) : 0;
      g.rotate(lean);
      g.font = '32px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      if (!jumping) g.scale(side === 0 ? -1 : 1, 1);
      g.fillText('🧗', 0, 0);
      g.restore();
      g.fillStyle = '#fff'; g.font = 'bold 18px sans-serif'; g.textAlign = 'center';
      g.fillText(Math.floor(wy / 10) + ' m', W / 2, 26);
      if (wy < 400) { g.font = '14px sans-serif'; g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillText('Tik om te springen', W / 2, H * 0.4); }
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
