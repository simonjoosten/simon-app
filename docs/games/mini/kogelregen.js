export default {
  id: 'kogelregen',
  name: 'Kogelregen',
  emoji: '🔴',
  hint: 'Sleep je bolletje door de kogels heen',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#0a0420';
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const P = { x: W / 2, y: H * 0.78 };
    const me = { x: W / 2, y: H * 0.78 };
    const keys = {};
    let dragging = false, offX = 0, offY = 0;
    let bullets = [], sparks = [], stars = [];
    for (let i = 0; i < 40; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 1.5 + 0.3 });
    let time = 0, score = 0, nextPat = 1.2, patCount = 0, spin = 0;
    let dead = false, over = false, raf = 0, last = 0, flash = 0, shake = 0;
    let announce = '', announceT = 0;
    const queue = [];

    function pt(e) {
      const r = cv.getBoundingClientRect();
      return [(e.clientX - r.left) * W / (r.width || W), (e.clientY - r.top) * H / (r.height || H)];
    }
    function onDown(e) {
      const [x, y] = pt(e);
      dragging = true; offX = me.x - x; offY = me.y - y;
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    }
    function onMove(e) {
      if (!dragging) return;
      const [x, y] = pt(e);
      P.x = x + offX; P.y = y + offY;
    }
    function onUp() { dragging = false; }
    function onKey(e) { keys[e.key] = e.type === 'keydown'; if (e.key.startsWith('Arrow')) e.preventDefault(); }
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);

    const lvl = () => 1 + Math.floor(time / 12);
    const spd = () => Math.min(2.2, 1 + time / 70);
    function add(x, y, vx, vy, r, col) { bullets.push({ x, y, vx: vx * spd(), vy: vy * spd(), r: r || 6, col: col || '#ff3d6e' }); }

    const patterns = [
      function rain() { // vallende kogels
        const n = 6 + lvl();
        for (let i = 0; i < n; i++) add(Math.random() * W, -10 - Math.random() * 120, 0, 130 + Math.random() * 70);
      },
      function aimed() { // gericht schot
        const n = 3 + Math.min(4, lvl());
        for (let i = 0; i < n; i++) {
          const sx = Math.random() * W;
          const a = Math.atan2(me.y - -10, me.x - sx);
          add(sx, -10 - i * 50, Math.cos(a) * 190, Math.sin(a) * 190, 6, '#ffb703');
        }
      },
      function ring() { // ring vanuit een punt
        const cx = 40 + Math.random() * (W - 80), cy = 60 + Math.random() * H * 0.3;
        const n = 12 + lvl() * 2, off = Math.random() * 6;
        for (let i = 0; i < n; i++) { const a = off + i / n * Math.PI * 2; add(cx, cy, Math.cos(a) * 120, Math.sin(a) * 120, 6, '#4cc9f0'); }
      },
      function wall() { // muur met gat
        const gaps = 56, gx = Math.random() * (W - gaps - 20) + 10;
        for (let x = 0; x < W; x += 22) if (x < gx || x > gx + gaps) add(x + 11, -10, 0, 150, 7, '#c77dff');
      },
      function side() { // van links/rechts
        const n = 4 + lvl();
        const fromL = Math.random() < 0.5;
        for (let i = 0; i < n; i++) add(fromL ? -10 - i * 40 : W + 10 + i * 40, 60 + Math.random() * (H - 200), fromL ? 170 : -170, 0, 6, '#80ed99');
      },
      function spiral() { // spiraal
        const cx = W / 2, cy = 90;
        for (let i = 0; i < 18; i++) {
          queue.push({ t: i * 0.09, fn: () => {
            const a = spin + i * 0.55; spin += 0.0;
            add(cx, cy, Math.cos(a) * 130, Math.sin(a) * 130 + 40, 6, '#ff70a6');
            add(cx, cy, Math.cos(a + Math.PI) * 130, Math.sin(a + Math.PI) * 130 + 40, 6, '#ff70a6');
          } });
        }
      },
      function cross() { // kruisende diagonalen
        const n = 8;
        for (let i = 0; i < n; i++) {
          add(-10, 20 + i * 40, 150, 90, 6, '#ffd166');
          add(W + 10, 20 + i * 40 + 20, -150, 90, 6, '#ffd166');
        }
      },
    ];
    const names = ['Regen!', 'Zoeker!', 'Ring!', 'Muur!', 'Zijwind!', 'Spiraal!', 'Kruisvuur!'];

    function launch() {
      patCount++;
      const avail = Math.min(patterns.length, 2 + Math.floor(patCount / 2));
      const i = Math.floor(Math.random() * avail);
      patterns[i]();
      if (lvl() >= 3 && Math.random() < 0.4) patterns[Math.floor(Math.random() * avail)]();
      announce = names[i]; announceT = 0.9;
      nextPat = Math.max(0.7, 2.1 - time / 40);
    }

    function burst(x, y, col) {
      for (let i = 0; i < 24; i++) {
        const a = Math.random() * 6.28, s = 60 + Math.random() * 200;
        sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.7, col });
      }
    }

    function update(dt) {
      time += dt;
      const kd = 260 * dt;
      if (keys.ArrowLeft) P.x -= kd; if (keys.ArrowRight) P.x += kd;
      if (keys.ArrowUp) P.y -= kd; if (keys.ArrowDown) P.y += kd;
      P.x = Math.max(10, Math.min(W - 10, P.x)); P.y = Math.max(10, Math.min(H - 10, P.y));
      const k = 1 - Math.pow(0.0005, dt);
      me.x += (P.x - me.x) * k; me.y += (P.y - me.y) * k;
      nextPat -= dt;
      for (const q of queue) { q.t -= dt; if (q.t <= 0 && !q.done) { q.done = true; q.fn(); } }
      for (let i = queue.length - 1; i >= 0; i--) if (queue[i].done) queue.splice(i, 1);
      if (nextPat <= 0) launch();
      for (const b of bullets) { b.x += b.vx * dt; b.y += b.vy * dt; }
      for (const b of bullets) {
        const dx = b.x - me.x, dy = b.y - me.y, rr = b.r + 5;
        if (dx * dx + dy * dy < rr * rr) { die(); break; }
      }
      bullets = bullets.filter((b) => b.x > -40 && b.x < W + 40 && b.y > -140 && b.y < H + 40);
      for (const s of sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.t -= dt; }
      sparks = sparks.filter((s) => s.t > 0);
      score += dt * 10;
      announceT -= dt;
      api.score(Math.floor(score));
    }
    function die() {
      if (over) return;
      over = true; shake = 0.4;
      burst(me.x, me.y, '#fff');
      api.end(Math.floor(score));
    }

    function draw() {
      ctx.save();
      if (shake > 0) ctx.translate((Math.random() - 0.5) * 10 * shake, (Math.random() - 0.5) * 10 * shake);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#12062e'); g.addColorStop(1, '#2a0a3c');
      ctx.fillStyle = g; ctx.fillRect(-10, -10, W + 20, H + 20);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (const s of stars) { const y = (s.y + time * 20 * s.s) % H; ctx.fillRect(s.x, y, s.s, s.s); }
      for (const b of bullets) {
        ctx.shadowColor = b.col; ctx.shadowBlur = 12;
        ctx.fillStyle = b.col; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.4, 0, 6.283); ctx.fill();
      }
      for (const s of sparks) { ctx.globalAlpha = Math.max(0, s.t); ctx.fillStyle = s.col; ctx.fillRect(s.x, s.y, 3, 3); }
      ctx.globalAlpha = 1;
      if (!over) {
        ctx.shadowColor = '#00f5d4'; ctx.shadowBlur = 16;
        ctx.fillStyle = '#00f5d4'; ctx.beginPath(); ctx.arc(me.x, me.y, 6, 0, 6.283); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(0,245,212,0.4)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(me.x, me.y, 11 + Math.sin(time * 6) * 1.5, 0, 6.283); ctx.stroke();
      }
      if (announceT > 0 && !over) {
        ctx.globalAlpha = Math.min(1, announceT * 1.5);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(announce, W / 2, H * 0.4);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Niveau ' + lvl(), 10, H - 10);
      ctx.restore();
    }

    function loop(t) {
      if (dead) return;
      const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
      if (!over) update(dt);
      else { for (const s of sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.t -= dt; } sparks = sparks.filter((s) => s.t > 0); shake -= dt; }
      draw();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        cv.removeEventListener('pointerdown', onDown);
        cv.removeEventListener('pointermove', onMove);
        cv.removeEventListener('pointerup', onUp);
        cv.removeEventListener('pointercancel', onUp);
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('keyup', onKey);
        cv.remove();
      },
    };
  },
};
