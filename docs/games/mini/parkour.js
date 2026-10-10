// Parkour: ren over de daken, spring, glij en klim
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
  id: 'parkour',
  name: 'Parkour',
  emoji: '🏃',
  hint: 'Tik = springen, veeg omlaag = glijden, veeg omhoog = klimmen',
  create(host, api) {
    const { c, g, W, H } = setup(host, api);
    const PX = 84, GR = 1750, JV = 640, HW = 10;
    const baseTop = Math.round(H * 0.7);
    let dist = 0, speed = 250, fy = baseTop, vy = 0, ground = true, slide = 0, climb = 0;
    let roofs = [{ x0: -300, x1: 520, top: baseTop }], obs = [], bonus = 0, score = 0, t = 0;
    let over = false, dead = false, raf = 0, last = 0, msg = '', msgT = 0;
    let down = null;
    const solids = () => roofs.concat(obs.filter((o) => o.t !== 'bar'));

    const finish = () => { if (over) return; over = true; api.end(score); };
    const say = (s) => { msg = s; msgT = 0.8; };

    const jump = () => { if (ground && !over) { vy = -JV; ground = false; slide = 0; } };
    const doClimb = () => {
      if (over) return;
      if (!ground) { vy = Math.max(vy, 700); return; }
      const near = solids().find((s) => s.x0 - dist > -4 && s.x0 - dist < 75 && s.top < fy - 12);
      if (near) {
        const hh = Math.min(280, fy - near.top + 16);
        vy = -Math.sqrt(2 * GR * hh); ground = false; climb = 0.45; slide = 0;
        bonus += 3; say('Klim!');
      } else jump();
    };
    const doSlide = () => {
      if (over) return;
      if (!ground) { vy = Math.max(vy, 900); return; }
      slide = 0.6;
    };
    const pd = (e) => { down = { x: e.clientX, y: e.clientY, done: false }; };
    const pm = (e) => {
      if (!down || down.done) return;
      const dy = e.clientY - down.y;
      if (Math.abs(dy) > 28 && Math.abs(dy) > Math.abs(e.clientX - down.x)) { down.done = true; if (dy < 0) doClimb(); else doSlide(); }
    };
    const pu = () => { if (down && !down.done) jump(); down = null; };
    const kd = (e) => {
      if (e.code === 'Space') { jump(); e.preventDefault(); }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { doClimb(); e.preventDefault(); }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { doSlide(); e.preventDefault(); }
    };
    host.addEventListener('pointerdown', pd);
    window.addEventListener('pointermove', pm);
    window.addEventListener('pointerup', pu);
    window.addEventListener('keydown', kd);

    const gen = () => {
      while (roofs[roofs.length - 1].x1 < dist + W + 400) {
        const p = roofs[roofs.length - 1];
        const gap = 70 + Math.random() * Math.min(speed * 0.36, 160);
        const w = 300 + Math.random() * 220 + speed * 0.45;
        let top = p.top + (Math.random() - 0.5) * 120;
        top = Math.max(p.top - 62, Math.min(p.top + 100, top));
        top = Math.max(H * 0.5, Math.min(H * 0.82, top));
        const r = { x0: p.x1 + gap, x1: p.x1 + gap + w, top };
        roofs.push(r);
        const n = w > 420 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          if (Math.random() < 0.15) continue;
          const lo = r.x0 + 170 + i * (w / 2 - 40), hi = Math.min(r.x1 - 130, lo + w / 2 - 130);
          if (hi <= lo) continue;
          const x = lo + Math.random() * (hi - lo);
          const k = Math.random();
          if (dist > 900 && k < 0.3) obs.push({ t: 'wall', x0: x, x1: x + 30, top: top - 140 });
          else if (dist > 400 && k < 0.6) obs.push({ t: 'bar', x0: x, x1: x + 46, y0: top - 58, y1: top - 28 });
          else obs.push({ t: 'box', x0: x, x1: x + 38, top: top - 34 });
        }
      }
    };

    const step = (dt) => {
      t += dt; msgT = Math.max(0, msgT - dt);
      if (over) return;
      speed = Math.min(520, 250 + dist / 22);
      dist += speed * dt;
      slide = Math.max(0, slide - dt); climb = Math.max(0, climb - dt);
      const prev = fy;
      vy += GR * dt; fy += vy * dt;
      ground = false;
      const l = dist - HW, r = dist + HW;
      for (const s of solids()) {
        if (r > s.x0 && l < s.x1 && vy >= 0 && prev <= s.top + 8 && fy >= s.top) { fy = s.top; vy = 0; ground = true; }
      }
      for (const s of solids()) {
        if (r > s.x0 + 2 && l < s.x1 - 2 && fy > s.top + 8) { finish(); return; }
      }
      const hh = slide > 0 ? 22 : 46;
      for (const o of obs) {
        if (o.t === 'bar' && r > o.x0 && l < o.x1 && fy > o.y0 && fy - hh < o.y1) { finish(); return; }
        if (!o.done && o.x1 < l) { o.done = true; bonus += 5; }
      }
      if (fy > H + 80) { finish(); return; }
      gen();
      roofs = roofs.filter((s) => s.x1 > dist - 200);
      obs = obs.filter((s) => s.x1 > dist - 200);
      score = Math.floor(dist / 10) + bonus;
      api.score(score);
    };

    const sx = (x) => PX + x - dist;

    const person = () => {
      const x = PX, y = fy;
      g.save(); g.translate(x, y);
      g.strokeStyle = '#222'; g.lineWidth = 5; g.lineCap = 'round';
      const ph = t * 16;
      if (slide > 0) {
        g.fillStyle = '#e8453c'; g.beginPath(); g.ellipse(-2, -9, 18, 8, -0.1, 0, 7); g.fill();
        g.fillStyle = '#f2c9a0'; g.beginPath(); g.arc(15, -14, 7, 0, 7); g.fill();
        g.beginPath(); g.moveTo(-18, -6); g.lineTo(-30, -4); g.stroke();
      } else if (climb > 0) {
        g.font = '40px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🧗', 0, -24);
      } else {
        const air = !ground;
        g.fillStyle = '#e8453c'; g.fillRect(-6, -36, 12, 20);
        g.fillStyle = '#f2c9a0'; g.beginPath(); g.arc(0, -42, 8, 0, 7); g.fill();
        g.fillStyle = '#222'; g.fillRect(-8, -50, 16, 4);
        const a = air ? 0.9 : Math.sin(ph);
        g.beginPath(); g.moveTo(0, -16); g.lineTo(a * 10 + (air ? 8 : 0), air ? -6 : 0); g.stroke();
        g.beginPath(); g.moveTo(0, -16); g.lineTo(-a * 10 - (air ? 6 : 0), air ? -4 : 0); g.stroke();
        g.strokeStyle = '#f2c9a0'; g.lineWidth = 4;
        g.beginPath(); g.moveTo(0, -32); g.lineTo(-a * 10 + (air ? 12 : 0), -22 - (air ? 14 : 0)); g.stroke();
        g.beginPath(); g.moveTo(0, -32); g.lineTo(a * 10 + (air ? 12 : 0), -22 - (air ? 12 : 0)); g.stroke();
      }
      g.restore();
    };

    const draw = () => {
      const sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#ff9966'); sky.addColorStop(0.6, '#ffd29a'); sky.addColorStop(1, '#ffeccc');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.fillStyle = '#fff6d0'; g.beginPath(); g.arc(W * 0.75, H * 0.2, 36, 0, 7); g.fill();
      // verre skyline
      g.fillStyle = '#c9876a';
      for (let i = -1; i < 12; i++) {
        const bx = i * 70 - (dist * 0.15) % 70, bh = 80 + ((i + 100) * 37 % 90);
        g.fillRect(bx, H * 0.62 - bh, 54, bh + H);
      }
      g.fillStyle = '#a8655a';
      for (let i = -1; i < 8; i++) {
        const bx = i * 110 - (dist * 0.35) % 110, bh = 100 + ((i + 100) * 53 % 120);
        g.fillRect(bx, H * 0.72 - bh, 80, bh + H);
      }
      for (const r of roofs) {
        const x = sx(r.x0), w = r.x1 - r.x0;
        if (x > W || x + w < 0) continue;
        g.fillStyle = '#4a3b52'; g.fillRect(x, r.top, w, H - r.top);
        g.fillStyle = '#2c2233'; g.fillRect(x, r.top, w, 8);
        g.fillStyle = '#ffd966';
        for (let wx = x + 20; wx < x + w - 20; wx += 46) for (let wy = r.top + 30; wy < H; wy += 50) if (((wx * 7 + wy) | 0) % 5 > 1) g.fillRect(wx, wy, 14, 20);
      }
      for (const o of obs) {
        const x = sx(o.x0);
        if (x > W + 50 || x < -80) continue;
        if (o.t === 'box') { g.fillStyle = '#b5834a'; g.fillRect(x, o.top, o.x1 - o.x0, 34); g.strokeStyle = '#6e4d26'; g.lineWidth = 3; g.strokeRect(x, o.top, o.x1 - o.x0, 34); }
        else if (o.t === 'wall') { g.fillStyle = '#8a8f99'; g.fillRect(x, o.top, 30, 140); g.fillStyle = '#6b7079'; for (let k = 0; k < 7; k++) g.fillRect(x, o.top + k * 20, 30, 2); }
        else {
          g.fillStyle = '#333'; g.fillRect(x, o.y0 - 30, 4, 30 + 58 - 30 + 0); g.fillRect(x + 42, o.y0 - 30, 4, 58);
          g.fillStyle = '#e5c22f'; g.fillRect(x - 2, o.y0, 50, 28);
          g.fillStyle = '#222'; g.font = 'bold 10px sans-serif'; g.textAlign = 'center'; g.fillText('BUK', x + 23, o.y0 + 18);
        }
      }
      person();
      g.fillStyle = '#4a3b52'; g.font = 'bold 20px sans-serif'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      g.fillText(score + ' m', 14, 28);
      if (msgT > 0) { g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(msg, PX, fy - 70); }
      if (dist < 700) {
        g.textAlign = 'center'; g.fillStyle = 'rgba(40,20,40,0.7)'; g.font = '14px sans-serif';
        g.fillText('Tik: springen · Omlaag: glijden · Omhoog: klimmen', W / 2, H * 0.33);
      }
    };

    gen();
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
