export default {
  id: 'vis',
  name: 'Vissenspel',
  emoji: '🐠',
  hint: 'Sleep om te zwemmen: eet kleinere vissen, ontwijk grotere',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#0a3d6b';
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const WORLD = 3200, R0 = 14;
    const rnd = (a, b) => a + Math.random() * (b - a);
    let dead = false, done = false, raf = 0, last = 0, time = 0, over = false, overT = 0;

    const me = { x: WORLD / 2, y: WORLD * 0.35, vx: 0, vy: 0, r: R0, dir: 1, wig: 0 };
    let eaten = 0, level = 1, zoom = 1.6, levelFlash = 0, shake = 0;
    let fishes = [], bubbles = [], parts = [];
    const weeds = [];
    for (let i = 0; i < 70; i++) weeds.push({ x: rnd(0, WORLD), h: rnd(60, 160), ph: rnd(0, 7), hue: rnd(95, 150) });
    const ambient = [];
    for (let i = 0; i < 45; i++) ambient.push({ x: Math.random(), y: Math.random(), s: rnd(2, 6), v: rnd(10, 30), ph: rnd(0, 7) });

    function pspeed(r) { return 150 * Math.pow(r / R0, 0.4); }
    function zoomFor(r) { return 1.6 * Math.pow(R0 / r, 0.7); }
    function lvlFor(r) { return 1 + Math.floor(Math.log(r / R0) / Math.log(1.35)); }
    function sizeScore() { return Math.round((me.r - R0) * 2); }
    function curScore() { return sizeScore() + eaten; }

    function spawnFish(near) {
      let r, kind;
      const bigChance = Math.min(0.32, 0.14 + level * 0.02);
      const t = Math.random();
      if (t < bigChance) { r = me.r * rnd(1.3, 2.4); kind = 'big'; }
      else if (t < bigChance + 0.2) { r = me.r * rnd(0.9, 1.2); kind = 'same'; }
      else { r = me.r * rnd(0.35, 0.9); kind = 'small'; }
      r = Math.max(5, Math.min(700, r));
      const reach = Math.hypot(W, H) / 2 / zoom;
      let x, y, tries = 0;
      do {
        const a = Math.random() * 7;
        const d = near ? rnd(r * 3 + 60, reach + 500) : rnd(reach + 40, reach + 600);
        x = me.x + Math.cos(a) * d; y = me.y + Math.sin(a) * d;
        tries++;
      } while ((x < 60 || x > WORLD - 60 || y < 120 || y > WORLD - 120) && tries < 12);
      x = Math.max(60, Math.min(WORLD - 60, x)); y = Math.max(120, Math.min(WORLD - 120, y));
      const a = Math.random() * 7;
      fishes.push({ x, y, r, vx: Math.cos(a), vy: Math.sin(a), dir: Math.cos(a) >= 0 ? 1 : -1, hue: Math.floor(rnd(0, 360)), wig: rnd(0, 7), wander: rnd(0, 7), kind, st: 0 });
    }
    for (let i = 0; i < 34; i++) spawnFish(true);
    for (let i = 0; i < 30; i++) bubbles.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(1.5, 5), v: rnd(15, 45), ph: rnd(0, 7) });

    // invoer
    let target = null, pressed = false, keys = {};
    function point(e) {
      const b = host.getBoundingClientRect();
      return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height };
    }
    const onDown = e => { e.preventDefault(); pressed = true; target = point(e); try { host.setPointerCapture(e.pointerId); } catch (_) { /* negeren */ } };
    const onMove = e => { if (pressed || e.pointerType === 'mouse') target = point(e); };
    const onUp = e => { if (e.pointerType !== 'mouse') target = null; pressed = false; };
    const onLeave = e => { if (e.pointerType === 'mouse' && !pressed) target = null; };
    const onKeyDown = e => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].indexOf(k) >= 0) { keys[k] = true; e.preventDefault(); }
    };
    const onKeyUp = e => { delete keys[e.key.toLowerCase()]; };
    host.addEventListener('pointerdown', onDown);
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerup', onUp);
    host.addEventListener('pointercancel', onUp);
    host.addEventListener('pointerleave', onLeave);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    function burst(x, y, hue, n) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 7, s = rnd(30, 120);
        parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: 0, max: rnd(0.5, 1), r: rnd(2, 5), hue });
      }
    }
    function update(dt) {
      time += dt;
      // speler besturen
      let tx = 0, ty = 0;
      if (keys.arrowleft || keys.a) tx -= 1;
      if (keys.arrowright || keys.d) tx += 1;
      if (keys.arrowup || keys.w) ty -= 1;
      if (keys.arrowdown || keys.s) ty += 1;
      if (tx || ty) { const l = Math.hypot(tx, ty); tx /= l; ty /= l; }
      else if (target) {
        // doel in scherm-coordinaten ten opzichte van de vis (camera staat op vis)
        const px = (me.x - camX) * zoom, py = (me.y - camY) * zoom;
        const ddx = target.x - (W / 2 + px), ddy = target.y - (H / 2 + py);
        const d = Math.hypot(ddx, ddy);
        const full = 70;
        if (d > 6) { const f = Math.min(1, d / full); tx = ddx / d * f; ty = ddy / d * f; }
      }
      const sp = pspeed(me.r);
      me.vx += (tx * sp - me.vx) * Math.min(1, dt * 4);
      me.vy += (ty * sp - me.vy) * Math.min(1, dt * 4);
      me.x += me.vx * dt; me.y += me.vy * dt;
      me.x = Math.max(me.r, Math.min(WORLD - me.r, me.x));
      me.y = Math.max(me.r, Math.min(WORLD - me.r - 10, me.y));
      if (Math.abs(me.vx) > 8) me.dir += ((me.vx > 0 ? 1 : -1) - me.dir) * Math.min(1, dt * 10);
      me.wig += dt * (4 + Math.hypot(me.vx, me.vy) / 25);

      // vissen
      const reach = Math.hypot(W, H) / 2 / zoom;
      for (const f of fishes) {
        const dx = me.x - f.x, dy = me.y - f.y, d = Math.hypot(dx, dy) || 1;
        f.wander += dt * rnd(0.5, 1.5);
        let ax = Math.cos(f.wander * 0.9 + f.hue), ay = Math.sin(f.wander * 0.7 + f.hue);
        let spd = pspeed(f.r) * 0.35;
        if (f.r > me.r * 1.1 && d < f.r * 5 + 260) { ax = dx / d; ay = dy / d; spd = pspeed(f.r) * 0.6; f.st = 1; }
        else if (f.r < me.r * 0.9 && d < me.r * 3 + 160) { ax = -dx / d; ay = -dy / d; spd = pspeed(f.r) * 0.6; f.st = 2; }
        else f.st = 0;
        f.vx += (ax * spd - f.vx) * Math.min(1, dt * 2.5);
        f.vy += (ay * spd - f.vy) * Math.min(1, dt * 2.5);
        f.x += f.vx * dt; f.y += f.vy * dt;
        if (f.x < 40 || f.x > WORLD - 40) { f.vx *= -1; f.x = Math.max(40, Math.min(WORLD - 40, f.x)); f.wander += 3; }
        if (f.y < 100 || f.y > WORLD - 100) { f.vy *= -1; f.y = Math.max(100, Math.min(WORLD - 100, f.y)); f.wander += 3; }
        if (Math.abs(f.vx) > 5) f.dir += ((f.vx > 0 ? 1 : -1) - f.dir) * Math.min(1, dt * 8);
        f.wig += dt * 5;
      }
      // eten
      if (!over) {
        for (let i = fishes.length - 1; i >= 0; i--) {
          const f = fishes[i];
          const d = Math.hypot(f.x - me.x, f.y - me.y);
          if (f.r > me.r * 1.1 && d < f.r * 0.85 + me.r * 0.2) {
            over = true; shake = 0.5;
            burst(me.x, me.y, 30, 22);
            break;
          }
          if (me.r > f.r * 1.1 && d < me.r * 0.9) {
            fishes.splice(i, 1);
            eaten++;
            me.r = Math.sqrt(me.r * me.r + 0.35 * f.r * f.r);
            burst(f.x, f.y, f.hue, 8);
            for (let b = 0; b < 4; b++) bubbles.push({ x: W / 2 + (f.x - camX) * zoom + rnd(-8, 8), y: H / 2 + (f.y - camY) * zoom, r: rnd(2, 5), v: rnd(30, 60), ph: rnd(0, 7) });
            api.score(curScore());
            const nl = lvlFor(me.r);
            if (nl > level) { level = nl; levelFlash = 2; }
          }
        }
      }
      // spawn en opruimen
      fishes = fishes.filter(f => Math.hypot(f.x - me.x, f.y - me.y) < reach + 1400);
      let guard = 0;
      while (fishes.length < 38 && guard++ < 6) spawnFish(false);
      // te kleine vissen vervangen door passende (houd de wereld interessant)
      for (let i = fishes.length - 1; i >= 0; i--) {
        const f = fishes[i];
        if (f.r < me.r * 0.18 && Math.hypot(f.x - me.x, f.y - me.y) > reach + 100) fishes.splice(i, 1);
      }
      // zoom
      const zt = zoomFor(me.r);
      zoom += (zt - zoom) * Math.min(1, dt * 1.5);
      levelFlash = Math.max(0, levelFlash - dt);
      shake = Math.max(0, shake - dt);
      for (const b of bubbles) { b.y -= b.v * dt; b.x += Math.sin(time * 2 + b.ph) * 10 * dt; }
      bubbles = bubbles.filter(b => b.y > -10);
      while (bubbles.length < 30) bubbles.push({ x: rnd(0, W), y: H + 10, r: rnd(1.5, 5), v: rnd(15, 45), ph: rnd(0, 7) });
      for (const p of parts) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; }
      parts = parts.filter(p => p.life < p.max);
      // ambient: wereld-bubbels vanaf zeebodem bewegen mee
      for (const a of ambient) { a.y -= a.v * dt / H; if (a.y < -0.02) { a.y = 1.02; a.x = Math.random(); } }
    }

    let camX = me.x, camY = me.y;

    function drawFish(x, y, r, dir, hue, wig, opts) {
      opts = opts || {};
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir >= 0 ? Math.max(0.15, dir) : Math.min(-0.15, dir), 1);
      const sw = Math.sin(wig) * r * 0.25;
      const body = `hsl(${hue},80%,58%)`, dark = `hsl(${hue},70%,38%)`, light = `hsl(${hue},90%,80%)`;
      if (opts.danger) {
        ctx.shadowColor = 'rgba(255,60,60,0.9)'; ctx.shadowBlur = Math.max(6, r * 0.4);
      } else if (opts.me) {
        ctx.shadowColor = 'rgba(255,255,160,0.8)'; ctx.shadowBlur = r * 0.5;
      }
      // staart
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(-r * 0.75, 0);
      ctx.quadraticCurveTo(-r * 1.2, sw, -r * 1.65, -r * 0.55 + sw);
      ctx.quadraticCurveTo(-r * 1.4, sw * 0.5, -r * 1.65, r * 0.55 + sw);
      ctx.quadraticCurveTo(-r * 1.2, sw, -r * 0.75, 0);
      ctx.fill();
      // rugvin
      ctx.beginPath();
      ctx.moveTo(-r * 0.3, -r * 0.55); ctx.quadraticCurveTo(0, -r * 1.15 + sw * 0.3, r * 0.35, -r * 0.55); ctx.fill();
      // lichaam
      const g = ctx.createLinearGradient(0, -r * 0.7, 0, r * 0.7);
      g.addColorStop(0, body); g.addColorStop(1, light);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.66, 0, 0, 7); ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
      // streep
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = Math.max(1, r * 0.1);
      ctx.beginPath(); ctx.moveTo(-r * 0.15, -r * 0.6); ctx.quadraticCurveTo(-r * 0.35, 0, -r * 0.15, r * 0.6); ctx.stroke();
      // zijvin
      ctx.fillStyle = dark; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.ellipse(-r * 0.05, r * 0.15, r * 0.28, r * 0.13, 0.4 + sw / r, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
      // oog
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(r * 0.5, -r * 0.14, r * 0.2, 0, 7); ctx.fill();
      ctx.fillStyle = opts.danger ? '#b00000' : '#111';
      ctx.beginPath(); ctx.arc(r * 0.56, -r * 0.14, r * 0.1, 0, 7); ctx.fill();
      if (opts.danger) {
        ctx.strokeStyle = '#220000'; ctx.lineWidth = Math.max(1, r * 0.07);
        ctx.beginPath(); ctx.moveTo(r * 0.3, -r * 0.42); ctx.lineTo(r * 0.72, -r * 0.24); ctx.stroke();
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath(); ctx.moveTo(r * (0.74 + i * 0.0), r * (0.12 + i * 0.1)); ctx.lineTo(r * 0.86, r * (0.2 + i * 0.1)); ctx.lineTo(r * 0.7, r * (0.26 + i * 0.1)); ctx.fill();
        }
      } else {
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = Math.max(1, r * 0.06);
        ctx.beginPath(); ctx.arc(r * 0.62, r * 0.12, r * 0.18, 0.2, 1.5); ctx.stroke();
      }
      ctx.restore();
    }

    function drawBackground() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      // diepte-afhankelijk: dieper = donkerder
      const depth = Math.max(0, Math.min(1, camY / WORLD));
      const topL = 52 - depth * 32, botL = 30 - depth * 20;
      g.addColorStop(0, `hsl(${200 + depth * 15},80%,${topL}%)`);
      g.addColorStop(1, `hsl(${215 + depth * 20},85%,${botL}%)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // lichtstralen
      ctx.save();
      ctx.globalAlpha = 0.07 * (1 - depth);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 5; i++) {
        const x = ((i * 190 - camX * 0.15 * zoom + Math.sin(time * 0.3 + i) * 30) % (W + 300) + W + 300) % (W + 300) - 150;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 50, 0); ctx.lineTo(x + 160, H); ctx.lineTo(x + 40, H); ctx.fill();
      }
      ctx.restore();
      // golvende banden
      for (let b = 0; b < 5; b++) {
        ctx.beginPath();
        const base = H * (0.12 + b * 0.2) - ((camY * 0.05 * (b + 1)) % 40);
        const amp = 14 + b * 5, len = 90 + b * 30;
        ctx.moveTo(0, H);
        for (let x = 0; x <= W + 10; x += 10) {
          ctx.lineTo(x, base + Math.sin((x + camX * 0.3 * (b + 1)) / len + time * (0.6 + b * 0.15) + b) * amp);
        }
        ctx.lineTo(W, H); ctx.closePath();
        ctx.fillStyle = `rgba(255,255,255,${0.025 + b * 0.004})`;
        ctx.fill();
      }
      // zwevend stof
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (const a of ambient) {
        const x = ((a.x * W - camX * 0.1 * zoom) % W + W) % W;
        ctx.beginPath(); ctx.arc(x, a.y * H, a.s * 0.4, 0, 7); ctx.fill();
      }
    }
    function w2s(x, y) { return [W / 2 + (x - camX) * zoom, H / 2 + (y - camY) * zoom]; }

    function drawWorld() {
      // oppervlak
      const [, sy] = w2s(0, 0);
      if (sy > -40) {
        ctx.fillStyle = 'rgba(190,235,255,0.35)';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, sy);
        for (let x = W; x >= 0; x -= 10) ctx.lineTo(x, sy + Math.sin(x / 20 + time * 2) * 5);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        for (let x = 0; x <= W; x += 10) ctx.lineTo(x, sy + Math.sin(x / 20 + time * 2) * 5);
        for (let x = W; x >= 0; x -= 10) ctx.lineTo(x, sy + 3 + Math.sin(x / 20 + time * 2) * 5);
        ctx.fill();
      }
      // zeebodem
      const [, by] = w2s(0, WORLD);
      if (by < H + 100) {
        ctx.fillStyle = '#c9a96a';
        ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, by);
        for (let x = 0; x <= W; x += 12) ctx.lineTo(x, by + Math.sin((x + camX * zoom) / 40) * 6 * zoom);
        ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
        for (const w of weeds) {
          const [sx, sy2] = w2s(w.x, WORLD);
          if (sx < -40 || sx > W + 40) continue;
          const h = w.h * zoom;
          ctx.strokeStyle = `hsl(${w.hue},55%,38%)`; ctx.lineWidth = Math.max(3, 8 * zoom); ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(sx, sy2);
          ctx.quadraticCurveTo(sx + Math.sin(time * 1.5 + w.ph) * 14 * zoom, sy2 - h * 0.5, sx + Math.sin(time * 1.5 + w.ph + 1) * 18 * zoom, sy2 - h);
          ctx.stroke();
        }
      }
      // wereldgrenzen (links/rechts)
      const [lx] = w2s(0, 0), [rx] = w2s(WORLD, 0);
      ctx.fillStyle = 'rgba(0,10,30,0.55)';
      if (lx > 0) ctx.fillRect(0, 0, lx, H);
      if (rx < W) ctx.fillRect(rx, 0, W - rx, H);
    }

    function draw() {
      camX = me.x; camY = me.y;
      ctx.save();
      if (shake > 0) ctx.translate(rnd(-6, 6) * shake * 2, rnd(-6, 6) * shake * 2);
      drawBackground();
      drawWorld();
      // vissen (kleinste eerst, dan groter bovenop)
      const list = fishes.slice().sort((a, b) => a.r - b.r);
      for (const f of list) {
        const [sx, sy] = w2s(f.x, f.y), sr = f.r * zoom;
        if (sx < -sr * 2 - 20 || sx > W + sr * 2 + 20 || sy < -sr * 2 - 20 || sy > H + sr * 2 + 20) continue;
        drawFish(sx, sy, sr, f.dir, f.hue, f.wig, { danger: f.r > me.r * 1.1 });
      }
      if (!over) {
        const [mx, my] = w2s(me.x, me.y);
        drawFish(mx, my, me.r * zoom, me.dir, 38, me.wig, { me: true });
      }
      // deeltjes
      for (const p of parts) {
        ctx.globalAlpha = 1 - p.life / p.max;
        ctx.fillStyle = `hsl(${p.hue},90%,70%)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // bubbels
      for (const b of bubbles) {
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.25, 0, 7); ctx.fill();
      }
      ctx.restore();
      // vignet
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.8);
      vg.addColorStop(0, 'rgba(0,0,30,0)'); vg.addColorStop(1, 'rgba(0,0,30,0.35)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      // HUD
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,20,50,0.4)'; ctx.fillRect(0, 0, W, 40);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'left'; ctx.fillText('Niveau ' + level, 12, 20);
      ctx.textAlign = 'center'; ctx.fillText('🐟 ' + eaten, W / 2, 20);
      ctx.textAlign = 'right'; ctx.fillText('Score ' + curScore(), W - 12, 20);
      if (time < 5 && !over) {
        ctx.textAlign = 'center'; ctx.font = 'bold 16px sans-serif'; ctx.globalAlpha = Math.min(1, 5 - time);
        ctx.fillStyle = '#fff';
        ctx.fillText('Sleep om te zwemmen. Eet kleinere vissen!', W / 2, H - 40);
        ctx.fillStyle = '#ff9a9a';
        ctx.fillText('Pas op voor vissen met rode gloed', W / 2, H - 18);
        ctx.globalAlpha = 1;
      }
      if (levelFlash > 0) {
        ctx.globalAlpha = Math.min(1, levelFlash);
        ctx.textAlign = 'center'; ctx.font = 'bold 40px sans-serif';
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 6; ctx.fillStyle = '#ffe14a';
        const yy = H * 0.3 - (2 - levelFlash) * 10;
        ctx.strokeText('Niveau ' + level + '!', W / 2, yy); ctx.fillText('Niveau ' + level + '!', W / 2, yy);
        ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = '#fff';
        ctx.fillText('De wereld wordt groter', W / 2, yy + 34);
        ctx.globalAlpha = 1;
      }
      if (over) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 34px sans-serif';
        ctx.fillText('Gegeten! 🦈', W / 2, H / 2);
      }
    }

    function frame(t) {
      if (dead) return;
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016);
      last = t;
      update(dt);
      if (over) { overT += dt; if (overT > 1.2 && !done) { done = true; api.end(curScore()); } }
      draw();
      if (!done) raf = requestAnimationFrame(frame);
    }
    zoom = zoomFor(me.r);
    api.score(0);
    raf = requestAnimationFrame(frame);

    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        host.removeEventListener('pointerdown', onDown);
        host.removeEventListener('pointermove', onMove);
        host.removeEventListener('pointerup', onUp);
        host.removeEventListener('pointercancel', onUp);
        host.removeEventListener('pointerleave', onLeave);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        if (cv.parentNode === host) host.removeChild(cv);
      },
    };
  },
};
