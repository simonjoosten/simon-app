// Rolbal: sleep om de zwaartekracht te draaien en rol de bal door het doolhof
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
  id: 'rolbal',
  name: 'Rolbal',
  emoji: '🔮',
  hint: 'Sleep om de zwaartekracht te draaien, rol naar de ster',
  create(host, api) {
    const { c, g, W, H } = setup(host, api);
    const TOP = 46, T = 6, GR = 950;
    let level = 0, cols = 4, rows = 6, cs = 60, ox = 0, oy = 0, walls = [], holes = [];
    let bx = 0, by = 0, vx = 0, vy = 0, br = 10, gx = 0, gy = 0;
    let timeLeft = 40, score = 0, over = false, dead = false, raf = 0, last = 0, t = 0, fall = 0, msg = '', msgT = 0;
    let drag = null;

    const build = () => {
      level++;
      cols = Math.min(8, 4 + Math.floor(level / 2));
      rows = Math.min(12, 6 + Math.floor(level * 0.8));
      cs = Math.min(W / cols, (H - TOP - 10) / rows);
      ox = (W - cs * cols) / 2; oy = TOP + (H - TOP - 10 - cs * rows) / 2;
      br = cs * 0.24;
      const open = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ r: false, d: false, v: false })));
      const stack = [[0, 0]]; open[0][0].v = true;
      while (stack.length) {
        const [cx, cy] = stack[stack.length - 1];
        const nb = [];
        if (cx + 1 < cols && !open[cy][cx + 1].v) nb.push([cx + 1, cy, 'r']);
        if (cx > 0 && !open[cy][cx - 1].v) nb.push([cx - 1, cy, 'l']);
        if (cy + 1 < rows && !open[cy + 1][cx].v) nb.push([cx, cy + 1, 'd']);
        if (cy > 0 && !open[cy - 1][cx].v) nb.push([cx, cy - 1, 'u']);
        if (!nb.length) { stack.pop(); continue; }
        const [nx, ny, dr] = nb[Math.floor(Math.random() * nb.length)];
        if (dr === 'r') open[cy][cx].r = true;
        if (dr === 'l') open[ny][nx].r = true;
        if (dr === 'd') open[cy][cx].d = true;
        if (dr === 'u') open[ny][nx].d = true;
        open[ny][nx].v = true;
        stack.push([nx, ny]);
      }
      // extra doorgangen zodat het niet te saai wordt
      for (let i = 0; i < Math.floor(cols * rows * 0.12); i++) {
        const cx = Math.floor(Math.random() * (cols - 1)), cy = Math.floor(Math.random() * (rows - 1));
        if (Math.random() < 0.5) open[cy][cx].r = true; else open[cy][cx].d = true;
      }
      walls = [];
      const W_ = (x, y, w, h) => walls.push({ x: ox + x, y: oy + y, w, h });
      W_(-T / 2, -T / 2, cols * cs + T, T); W_(-T / 2, rows * cs - T / 2, cols * cs + T, T);
      W_(-T / 2, -T / 2, T, rows * cs + T); W_(cols * cs - T / 2, -T / 2, T, rows * cs + T);
      holes = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        if (x < cols - 1 && !open[y][x].r) W_((x + 1) * cs - T / 2, y * cs - T / 2, T, cs + T);
        if (y < rows - 1 && !open[y][x].d) W_(x * cs - T / 2, (y + 1) * cs - T / 2, cs + T, T);
        if (level >= 2 && !(x === 0 && y === 0) && !(x === cols - 1 && y === rows - 1)) {
          let n = 0;
          if (open[y][x].r) n++; if (open[y][x].d) n++;
          if (x > 0 && open[y][x - 1].r) n++; if (y > 0 && open[y - 1][x].d) n++;
          if (n === 1 && Math.random() < Math.min(0.7, 0.2 + level * 0.07)) holes.push({ x: ox + (x + 0.5) * cs, y: oy + (y + 0.5) * cs });
        }
      }
      bx = ox + cs / 2; by = oy + cs / 2; vx = vy = 0; gx = gy = 0;
      timeLeft = 20 + cols * rows * 0.9;
    };

    const finish = () => { if (over) return; over = true; api.end(score); };
    const say = (s) => { msg = s; msgT = 1.4; };
    const pos = (e) => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
    const setG = (dx, dy) => {
      const l = Math.hypot(dx, dy);
      if (l < 8) return;
      const k = Math.min(1, l / 50) / l;
      gx = dx * k; gy = dy * k;
    };
    const pd = (e) => { drag = { id: e.pointerId, p: pos(e) }; };
    const pm = (e) => { if (drag && drag.id === e.pointerId) { const p = pos(e); setG(p[0] - drag.p[0], p[1] - drag.p[1]); } };
    const pu = (e) => { if (drag && drag.id === e.pointerId) drag = null; };
    const kd = (e) => {
      const m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.code];
      if (m) { gx = m[0]; gy = m[1]; e.preventDefault(); }
      if (e.code === 'Space') { gx = gy = 0; e.preventDefault(); }
    };
    host.addEventListener('pointerdown', pd);
    window.addEventListener('pointermove', pm);
    window.addEventListener('pointerup', pu);
    window.addEventListener('pointercancel', pu);
    window.addEventListener('keydown', kd);

    const collide = () => {
      for (const w of walls) {
        const cx = Math.max(w.x, Math.min(w.x + w.w, bx)), cy = Math.max(w.y, Math.min(w.y + w.h, by));
        let dx = bx - cx, dy = by - cy, d2 = dx * dx + dy * dy;
        if (d2 >= br * br) continue;
        let d = Math.sqrt(d2), nx, ny;
        if (d < 0.0001) {
          const l = bx - w.x, r = w.x + w.w - bx, tp = by - w.y, bt = w.y + w.h - by;
          const m = Math.min(l, r, tp, bt);
          nx = m === l ? -1 : m === r ? 1 : 0; ny = m === tp ? -1 : m === bt ? 1 : 0;
          if (nx && ny) ny = 0;
          d = -m;
        } else { nx = dx / d; ny = dy / d; }
        bx += nx * (br - d); by += ny * (br - d);
        const vn = vx * nx + vy * ny;
        if (vn < 0) { vx -= (1 + 0.3) * vn * nx; vy -= (1 + 0.3) * vn * ny; }
      }
    };

    const step = (dt) => {
      t += dt; msgT = Math.max(0, msgT - dt);
      if (over) return;
      if (fall > 0) { fall -= dt; return; }
      timeLeft -= dt;
      if (timeLeft <= 0) { timeLeft = 0; finish(); return; }
      const n = 4, h = dt / n;
      for (let i = 0; i < n; i++) {
        vx += gx * GR * h; vy += gy * GR * h;
        const f = 1 - Math.min(1, 0.9 * h); vx *= f; vy *= f;
        const sp = Math.hypot(vx, vy);
        if (sp > 480) { vx *= 480 / sp; vy *= 480 / sp; }
        bx += vx * h; by += vy * h;
        collide();
      }
      for (const ho of holes) {
        if (Math.hypot(ho.x - bx, ho.y - by) < cs * 0.2) {
          timeLeft = Math.max(1, timeLeft - 5);
          bx = ox + cs / 2; by = oy + cs / 2; vx = vy = 0; fall = 0.5;
          say('Gevallen! -5 sec');
        }
      }
      const gxp = ox + (cols - 0.5) * cs, gyp = oy + (rows - 0.5) * cs;
      if (Math.hypot(gxp - bx, gyp - by) < cs * 0.32) {
        score += level * 100 + Math.ceil(timeLeft) * 3;
        api.score(score);
        say('Level ' + level + ' klaar!');
        build();
      }
    };

    const draw = () => {
      g.fillStyle = '#14172e'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#1d2245'; g.fillRect(ox, oy, cols * cs, rows * cs);
      g.fillStyle = 'rgba(255,255,255,0.04)';
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if ((x + y) % 2) g.fillRect(ox + x * cs, oy + y * cs, cs, cs);
      for (const ho of holes) {
        g.fillStyle = '#000'; g.beginPath(); g.arc(ho.x, ho.y, cs * 0.2, 0, 7); g.fill();
        g.strokeStyle = '#6d4bd8'; g.lineWidth = 2; g.stroke();
      }
      g.fillStyle = '#7ee0ff';
      for (const w of walls) g.fillRect(w.x, w.y, w.w, w.h);
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = Math.round(cs * 0.6) + 'px serif';
      g.fillText('⭐', ox + (cols - 0.5) * cs, oy + (rows - 0.5) * cs + Math.sin(t * 4) * 2);
      // bal
      const gr = g.createRadialGradient(bx - br * 0.3, by - br * 0.3, 1, bx, by, br);
      gr.addColorStop(0, '#ffd1ff'); gr.addColorStop(1, '#a23bd8');
      g.fillStyle = gr; g.beginPath(); g.arc(bx, by, br, 0, 7); g.fill();
      // zwaartekrachtpijl
      const gl = Math.hypot(gx, gy);
      if (gl > 0.05) {
        g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3;
        const ex = bx + gx * 28, ey = by + gy * 28;
        g.beginPath(); g.moveTo(bx + gx * br, by + gy * br); g.lineTo(ex, ey); g.stroke();
      }
      g.fillStyle = '#fff'; g.font = 'bold 18px sans-serif'; g.textAlign = 'left';
      g.fillText('Level ' + level, 14, 22);
      g.textAlign = 'right';
      g.fillStyle = timeLeft < 8 ? '#ff6b6b' : '#fff';
      g.fillText(Math.ceil(timeLeft) + ' s', W - 14, 22);
      if (msgT > 0) { g.textAlign = 'center'; g.fillStyle = '#ffe66b'; g.font = 'bold 24px sans-serif'; g.fillText(msg, W / 2, TOP + 24); }
      if (level === 1 && t < 5) { g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,0.8)'; g.font = '14px sans-serif'; g.fillText('Sleep een kant op: de bal rolt die kant op', W / 2, H - 12); }
    };

    build();
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
        window.removeEventListener('pointercancel', pu);
        window.removeEventListener('keydown', kd);
        c.remove();
      },
    };
  },
};
