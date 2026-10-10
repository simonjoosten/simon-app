// Skater: spring, grind op rails en doe trucs voor combo's
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

const TRICKS = {
  kickflip: { name: 'Kickflip', dur: 0.4, pts: 100 },
  shove: { name: 'Shove-it', dur: 0.45, pts: 120 },
  grab: { name: 'Grab', dur: 0.5, pts: 150 },
};

export default {
  id: 'skater',
  name: 'Skater',
  emoji: '🛹',
  hint: 'Tik = ollie, in de lucht: tik of veeg voor trucs, land op rails',
  create(host, api) {
    const { c, g, W, H } = setup(host, api);
    const PX = 92, GR = 1800, JV = 720, gnd = Math.round(H * 0.72);
    let dist = 0, speed = 260, fy = gnd, vy = 0, onG = true, rail = null;
    let trick = null, done = [], comboPts = 0, comboN = 0, bankT = 0, lives = 3, inv = 0;
    let objs = [], nextX = 500, banked = 0, score = 0, t = 0, over = false, dead = false, raf = 0, last = 0;
    let pops = [], down = null, shake = 0;

    const finish = () => { if (over) return; over = true; api.end(score); };
    const pop = (s, col) => pops.push({ s, col: col || '#fff', l: 1.1 });
    const bail = (why) => {
      if (inv > 0) return;
      lives--; inv = 1.6; shake = 0.3; comboPts = 0; comboN = 0; trick = null; done = [];
      pop(why, '#ff6b6b');
      if (lives <= 0) finish();
    };
    const ollie = () => {
      if (over || !(onG || rail)) return;
      vy = -JV; onG = false; rail = null; trick = null; done = []; bankT = 0;
    };
    const doTrick = (k) => {
      if (over || onG || rail || trick) return;
      trick = { k, p: 0 };
    };
    const pd = (e) => { down = { x: e.clientX, y: e.clientY, done: false }; };
    const pm = (e) => {
      if (!down || down.done) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
      down.done = true;
      if (onG || rail) { ollie(); return; }
      if (Math.abs(dx) > Math.abs(dy)) doTrick(dx < 0 ? 'kickflip' : 'shove'); else doTrick('grab');
    };
    const pu = () => {
      if (down && !down.done) { if (onG || rail) ollie(); else doTrick('kickflip'); }
      down = null;
    };
    const kd = (e) => {
      if (e.code === 'Space') { if (onG || rail) ollie(); else doTrick('kickflip'); e.preventDefault(); }
      if (e.code === 'ArrowUp') { if (onG || rail) ollie(); else doTrick('grab'); e.preventDefault(); }
      if (e.code === 'ArrowLeft') { doTrick('kickflip'); e.preventDefault(); }
      if (e.code === 'ArrowRight') { doTrick('shove'); e.preventDefault(); }
    };
    host.addEventListener('pointerdown', pd);
    window.addEventListener('pointermove', pm);
    window.addEventListener('pointerup', pu);
    window.addEventListener('keydown', kd);

    const gen = () => {
      while (nextX < dist + W + 300) {
        const r = Math.random();
        if (r < 0.5) {
          const len = 130 + Math.random() * 100;
          objs.push({ t: 'rail', x0: nextX, x1: nextX + len, top: gnd - 38 });
          nextX += len;
        } else {
          objs.push({ t: 'cone', x0: nextX, x1: nextX + 22 });
          if (r > 0.85) { objs.push({ t: 'cone', x0: nextX + 26, x1: nextX + 48 }); nextX += 26; }
        }
        nextX += 280 + Math.random() * 200 + speed * 0.3;
      }
    };

    const step = (dt) => {
      t += dt; inv = Math.max(0, inv - dt); shake = Math.max(0, shake - dt);
      for (const p of pops) p.l -= dt;
      pops = pops.filter((p) => p.l > 0);
      if (over) return;
      speed = Math.min(470, 260 + dist / 50);
      dist += speed * dt;
      const prev = fy;
      if (rail) {
        fy = rail.top; vy = 0;
        comboPts += 90 * (1 + comboN * 0.15) * dt;
        if (dist - 8 > rail.x1) { rail = null; onG = false; }
      }
      if (!rail) {
        vy += GR * dt; fy += vy * dt;
        if (!onG || fy >= gnd) {
          onG = false;
          for (const o of objs) {
            if (o.t === 'rail' && dist > o.x0 - 6 && dist < o.x1 && vy >= 0 && prev <= o.top + 8 && fy >= o.top) {
              if (trick) { bail('Bail!'); fy = o.top; trick = null; rail = null; onG = false; continue; }
              rail = o; fy = o.top; vy = 0; comboN += 1 + done.length; comboPts += done.reduce((a, k) => a + TRICKS[k].pts, 0) + 60; done = [];
              pop('Grind!', '#7cf');
            }
          }
          if (!rail && fy >= gnd) {
            fy = gnd; vy = 0; onG = true;
            if (trick) bail('Mislukt!');
            else if (done.length) {
              comboN += done.length; comboPts += done.reduce((a, k) => a + TRICKS[k].pts, 0);
              pop(done.map((k) => TRICKS[k].name).join(' + '), '#ffe66b');
            }
            done = []; trick = null;
          }
        }
      }
      if (trick) {
        trick.p += dt / TRICKS[trick.k].dur;
        if (trick.p >= 1) { done.push(trick.k); trick = null; pop('+' + TRICKS[done[done.length - 1]].name, '#9f9'); }
      }
      // combo uitbetalen op de grond
      if (onG && comboN > 0) {
        bankT += dt;
        if (bankT > 1.0) {
          const v = Math.round(comboPts * Math.min(8, comboN) / 10) * 10;
          banked += v; pop(comboN + 'x combo +' + v, '#ffd23f');
          comboPts = 0; comboN = 0; bankT = 0;
        }
      } else if (!onG) bankT = 0;
      // kegels
      for (const o of objs) {
        if (o.t === 'cone' && !o.hit && dist + 10 > o.x0 && dist - 10 < o.x1 && fy > gnd - 24) { o.hit = true; bail('Au!'); }
      }
      gen();
      objs = objs.filter((o) => o.x1 > dist - 300);
      score = Math.floor(dist / 25) + banked;
      api.score(score);
    };

    const sx = (x) => PX + x - dist;
    const skater = () => {
      g.save();
      g.translate(PX, fy);
      if (inv > 0 && Math.floor(t * 14) % 2) g.globalAlpha = 0.4;
      const air = !onG && !rail;
      const p = trick ? trick.p : 0;
      // plank
      g.save();
      g.translate(0, -8);
      if (trick) {
        if (trick.k === 'kickflip') g.rotate(p * Math.PI * 2);
        else if (trick.k === 'shove') g.scale(Math.cos(p * Math.PI * 2), 1);
      }
      g.rotate(air && !trick ? Math.max(-0.4, Math.min(0.4, vy / 1800)) : 0);
      g.fillStyle = '#e8453c'; g.beginPath(); g.roundRect(-24, -4, 48, 6, 3); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(-14, 7, 4, 0, 7); g.arc(14, 7, 4, 0, 7); g.fill();
      g.restore();
      const crouch = trick && trick.k === 'grab' ? 14 : 0;
      g.fillStyle = '#2b4cc4'; g.fillRect(-6, -34 + crouch, 12, 24 - crouch * 0.4);
      g.fillStyle = '#ffd23f'; g.fillRect(-7, -48 + crouch, 14, 16);
      g.fillStyle = '#f2c9a0'; g.beginPath(); g.arc(1, -52 + crouch, 8, 0, 7); g.fill();
      g.fillStyle = '#222'; g.beginPath(); g.arc(-1, -55 + crouch, 8, Math.PI, 0); g.fill();
      g.strokeStyle = '#f2c9a0'; g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, -44 + crouch); g.lineTo(trick && trick.k === 'grab' ? 14 : 16, trick && trick.k === 'grab' ? -14 : -34 + (air ? -6 : 0)); g.stroke();
      g.beginPath(); g.moveTo(0, -44 + crouch); g.lineTo(-16, -36 + (air ? -8 : 0)); g.stroke();
      g.restore();
      g.globalAlpha = 1;
    };

    const draw = () => {
      const sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#3b1d6e'); sky.addColorStop(0.55, '#e0507a'); sky.addColorStop(1, '#ffb06a');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      const sh = shake > 0 ? (Math.random() - 0.5) * 8 : 0;
      g.save(); g.translate(sh, sh);
      g.fillStyle = '#24124a';
      for (let i = -1; i < 7; i++) { const bx = i * 80 - (dist * 0.2) % 80, bh = 120 + ((i + 50) * 41 % 140); g.fillRect(bx, gnd - bh, 64, bh); }
      g.fillStyle = '#ffe9a8';
      for (let i = -1; i < 7; i++) { const bx = i * 80 - (dist * 0.2) % 80, bh = 120 + ((i + 50) * 41 % 140); for (let wy = gnd - bh + 12; wy < gnd - 20; wy += 26) g.fillRect(bx + 10, wy, 8, 10); }
      g.fillStyle = '#5b5368'; g.fillRect(0, gnd + 8, W, H);
      g.fillStyle = '#6d6580'; g.fillRect(0, gnd + 8, W, 6);
      g.fillStyle = '#4c4558';
      for (let x = -(dist % 80); x < W; x += 80) g.fillRect(x, gnd + 40, 50, 3);
      for (const o of objs) {
        const x = sx(o.x0);
        if (x > W + 60 || sx(o.x1) < -60) continue;
        if (o.t === 'rail') {
          g.fillStyle = '#7c8696'; g.fillRect(x + 8, o.top, 5, gnd + 8 - o.top); g.fillRect(sx(o.x1) - 13, o.top, 5, gnd + 8 - o.top);
          g.fillStyle = '#d6dde8'; g.fillRect(x, o.top - 4, o.x1 - o.x0, 6);
        } else if (!o.hit) {
          g.fillStyle = '#ff7a1a'; g.beginPath(); g.moveTo(x, gnd + 8); g.lineTo(x + 11, gnd - 24); g.lineTo(x + 22, gnd + 8); g.fill();
          g.fillStyle = '#fff'; g.fillRect(x + 5, gnd - 8, 12, 4);
        }
      }
      skater();
      if (rail) { g.fillStyle = '#ffd23f'; for (let i = 0; i < 4; i++) g.fillRect(PX - 20 - Math.random() * 14, fy - 2 - Math.random() * 6, 3, 3); }
      g.restore();
      g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      g.fillStyle = '#fff'; g.font = 'bold 18px sans-serif';
      g.fillText('Score ' + score, 14, 26);
      g.fillText('❤️'.repeat(Math.max(0, lives)), 14, 50);
      if (comboN > 0) {
        g.textAlign = 'right'; g.fillStyle = '#ffd23f';
        g.fillText('Combo x' + Math.min(8, comboN), W - 14, 26);
        g.font = '14px sans-serif'; g.fillStyle = '#fff'; g.fillText(Math.round(comboPts) + ' punten', W - 14, 46);
      }
      g.textAlign = 'center'; g.font = 'bold 20px sans-serif';
      pops.forEach((p, i) => { g.globalAlpha = Math.min(1, p.l * 2); g.fillStyle = p.col; g.fillText(p.s, W / 2, H * 0.3 + i * 26 - (1.1 - p.l) * 20); });
      g.globalAlpha = 1;
      if (dist < 600) { g.fillStyle = 'rgba(255,255,255,0.85)'; g.font = '14px sans-serif'; g.fillText('Tik = ollie · in de lucht: tik/veeg = truc · land op rails', W / 2, H * 0.88); }
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
