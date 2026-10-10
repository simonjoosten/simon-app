// Ijsglijder: glij over het ijs, ontwijk ijsberen, verzamel vis
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
  id: 'ijsglijder',
  name: 'Ijsglijder',
  emoji: '🐧',
  hint: 'Sleep om te sturen, houd de REM-knop ingedrukt om te remmen',
  create(host, api) {
    const { c, g, W, H } = setup(host, api);
    const py = H * 0.28, brake = { x: W / 2 - 55, y: H - 62, w: 110, h: 46 };
    let x = W / 2, vx = 0, tgt = W / 2, steer = false, braking = false, kBrake = false;
    let dist = 0, fish = 0, lives = 3, inv = 0, spd = 200, things = [], nextY = 400, t = 0;
    let over = false, dead = false, raf = 0, last = 0, score = 0, flash = 0;
    const keys = {};

    const inRect = (px, py2, r) => px >= r.x && px <= r.x + r.w && py2 >= r.y && py2 <= r.y + r.h;
    const pos = (e) => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
    let ptr = null;
    const pd = (e) => {
      const [a, b] = pos(e);
      if (inRect(a, b, brake)) { braking = true; ptr = { id: e.pointerId, brake: true }; }
      else { steer = true; tgt = a; ptr = { id: e.pointerId, brake: false }; }
    };
    const pm = (e) => { if (ptr && ptr.id === e.pointerId && !ptr.brake) tgt = pos(e)[0]; };
    const pu = (e) => {
      if (ptr && ptr.id === e.pointerId) { braking = false; steer = false; ptr = null; }
    };
    const kd = (e) => { keys[e.code] = true; if (e.code === 'ArrowDown' || e.code === 'Space') kBrake = true; if (e.code.startsWith('Arrow')) e.preventDefault(); };
    const ku = (e) => { keys[e.code] = false; if (e.code === 'ArrowDown' || e.code === 'Space') kBrake = false; };
    host.addEventListener('pointerdown', pd);
    window.addEventListener('pointermove', pm);
    window.addEventListener('pointerup', pu);
    window.addEventListener('pointercancel', pu);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const finish = () => { if (over) return; over = true; api.end(score); };

    const spawn = () => {
      const r = Math.random();
      const y = nextY;
      if (r < 0.4) things.push({ t: 'bear', x: 50 + Math.random() * (W - 100), y, vx: (Math.random() < 0.5 ? -1 : 1) * (20 + Math.random() * 40 + dist / 400), ph: Math.random() * 6 });
      else if (r < 0.75) {
        const cx = 40 + Math.random() * (W - 80), n = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) things.push({ t: 'fish', x: cx + Math.sin(i * 0.9) * 30, y: y + i * 40 });
      } else if (r < 0.9) things.push({ t: 'hole', x: 40 + Math.random() * (W - 80), y, r: 22 });
      nextY += 130 + Math.random() * 90 - Math.min(60, dist / 300);
    };

    const step = (dt) => {
      t += dt;
      inv = Math.max(0, inv - dt); flash = Math.max(0, flash - dt);
      if (over) return;
      const br = braking || kBrake;
      const base = Math.min(520, 200 + dist / 40);
      spd += ((br ? base * 0.35 : base) - spd) * Math.min(1, dt * 3);
      let ax = 0;
      if (steer) ax = Math.max(-1, Math.min(1, (tgt - x) / 60)) * 900;
      if (keys.ArrowLeft) ax = -900;
      if (keys.ArrowRight) ax = 900;
      vx += ax * dt;
      vx -= vx * (br ? 4.5 : 0.7) * dt; // ijs: weinig wrijving, remmen helpt
      vx = Math.max(-420, Math.min(420, vx));
      x += vx * dt;
      if (x < 22) { x = 22; vx = Math.abs(vx) * 0.5; }
      if (x > W - 22) { x = W - 22; vx = -Math.abs(vx) * 0.5; }
      dist += spd * dt;
      score = Math.floor(dist / 10) + fish * 10;
      api.score(score);
      while (nextY < dist + H + 100) spawn();
      for (const o of things) {
        if (o.t === 'bear') {
          o.x += o.vx * dt;
          if (o.x < 30 || o.x > W - 30) o.vx = -o.vx;
        }
        const sy = py + (o.y - dist);
        if (sy < py - 40 || sy > py + 40) continue;
        const dx = o.x - x, dy = sy - py;
        if (o.t === 'fish' && !o.got && dx * dx + dy * dy < 30 * 30) { o.got = true; fish++; }
        if ((o.t === 'bear' && dx * dx + dy * dy < 30 * 30) || (o.t === 'hole' && dx * dx + dy * dy < 14 * 14 + 100 && Math.abs(dx) < 18 && Math.abs(dy) < 18)) {
          if (inv <= 0) { lives--; inv = 1.6; flash = 0.3; vx = (dx > 0 ? -1 : 1) * 200; if (lives <= 0) finish(); }
        }
      }
      things = things.filter((o) => !o.got && o.y > dist - 100);
    };

    const draw = () => {
      g.fillStyle = '#d8f2ff'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2;
      for (let i = 0; i < 9; i++) {
        const yy = ((i * 90 - dist * 0.9) % (H + 90) + H + 90) % (H + 90) - 40;
        g.beginPath(); g.moveTo(((i * 77) % W), yy); g.lineTo(((i * 77) % W) + 60, yy + 12); g.stroke();
      }
      g.fillStyle = '#b6e4f7';
      for (let i = 0; i < 6; i++) { const yy = (((i * 130 - dist * 0.5) % H) + H) % H; g.fillRect(((i * 131) % W), yy, 3, 24); }
      // rand
      g.fillStyle = '#eef9ff'; g.fillRect(0, 0, 12, H); g.fillRect(W - 12, 0, 12, H);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      for (const o of things) {
        const sy = py + (o.y - dist);
        if (sy < -50 || sy > H + 50) continue;
        if (o.t === 'hole') {
          g.fillStyle = '#1e5a8a'; g.beginPath(); g.ellipse(o.x, sy, o.r, o.r * 0.7, 0, 0, 7); g.fill();
          g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
        } else if (o.t === 'fish') { g.font = '26px serif'; g.fillText('🐟', o.x, sy); }
        else { g.font = '44px serif'; g.save(); g.translate(o.x, sy); g.scale(o.vx > 0 ? -1 : 1, 1); g.fillText('🐻‍❄️', 0, Math.sin(t * 5 + o.ph) * 2); g.restore(); }
      }
      if (inv <= 0 || Math.floor(t * 12) % 2) {
        g.save(); g.translate(x, py); g.rotate(vx / 700);
        g.font = '44px serif'; g.fillText('🐧', 0, 0); g.restore();
      }
      // snelheidslijnen
      g.strokeStyle = 'rgba(120,180,220,0.5)';
      g.beginPath(); g.moveTo(x - 10 - vx * 0.05, py - 28); g.lineTo(x - 10, py - 60 - spd * 0.05); g.stroke();
      // hud
      g.fillStyle = '#1b4a6b'; g.font = 'bold 16px sans-serif'; g.textAlign = 'left';
      g.fillText('🐟 ' + fish + '   ' + '❤️'.repeat(Math.max(0, lives)), 16, 22);
      const br = braking || kBrake;
      g.fillStyle = br ? '#e0453a' : 'rgba(224,69,58,0.75)';
      g.beginPath(); g.roundRect(brake.x, brake.y, brake.w, brake.h, 14); g.fill();
      g.fillStyle = '#fff'; g.font = 'bold 18px sans-serif'; g.textAlign = 'center';
      g.fillText('REM', W / 2, brake.y + brake.h / 2);
      if (flash > 0) { g.fillStyle = `rgba(255,0,0,${flash})`; g.fillRect(0, 0, W, H); }
      if (dist < 500) { g.fillStyle = 'rgba(27,74,107,0.7)'; g.font = '13px sans-serif'; g.fillText('Sleep links/rechts: je glijdt door!', W / 2, H * 0.55); }
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
        window.removeEventListener('pointercancel', pu);
        window.removeEventListener('keydown', kd);
        window.removeEventListener('keyup', ku);
        c.remove();
      },
    };
  },
};
