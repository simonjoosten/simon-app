export default {
  id: 'lasergrid',
  name: 'Lasergrid',
  emoji: '🟥',
  hint: 'Sleep naar een veilig vak, ontwijk de lasers op de maat',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#05010f';
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const N = 4;
    const gs = Math.min(W - 40, H * 0.55);
    const cs = gs / N, gx = (W - gs) / 2, gy = (H - gs) / 2 + 10;
    let pc = 1, pr = 1, tc = 1, tr = 1, moveCd = 0;
    let bpm = 80, beatT = 0, beat = 0, pulse = 0;
    let warn = null, firing = null, fireT = 0;
    let hp = 3, inv = 0, score = 0, volleys = 0, time = 0, msg = '', msgT = 0, flash = 0;
    let dead = false, over = false, raf = 0, last = 0;
    const parts = [];

    function cellAt(e) {
      const r = cv.getBoundingClientRect();
      const x = (e.clientX - r.left) * W / (r.width || W), y = (e.clientY - r.top) * H / (r.height || H);
      tc = Math.max(0, Math.min(N - 1, Math.floor((x - gx) / cs)));
      tr = Math.max(0, Math.min(N - 1, Math.floor((y - gy) / cs)));
    }
    let drag = false;
    function onDown(e) { drag = true; cellAt(e); try { cv.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); }
    function onMove(e) { if (drag) cellAt(e); }
    function onUp() { drag = false; }
    function onKey(e) {
      if (e.key === 'ArrowLeft') tc = Math.max(0, tc - 1);
      else if (e.key === 'ArrowRight') tc = Math.min(N - 1, tc + 1);
      else if (e.key === 'ArrowUp') tr = Math.max(0, tr - 1);
      else if (e.key === 'ArrowDown') tr = Math.min(N - 1, tr + 1);
      if (e.key.startsWith('Arrow')) e.preventDefault();
    }
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey);

    function pick(k, n) {
      const a = [0, 1, 2, 3]; const out = [];
      while (out.length < k) out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
      return out;
    }
    function makeVolley() {
      const lv = Math.floor(volleys / 5);
      const total = Math.min(5, 1 + Math.floor(lv * 0.8) + (Math.random() < 0.5 ? 1 : 0));
      let nr = Math.min(3, Math.floor(Math.random() * (total + 1)));
      let nc = Math.min(3, total - nr);
      if (nc < 0) nc = 0;
      const diag = lv >= 3 && Math.random() < 0.3;
      return { rows: pick(nr), cols: pick(nc), diag };
    }
    function hits(v, c, r) {
      return v.rows.includes(r) || v.cols.includes(c) || (v.diag && (c === r));
    }
    function beatTick() {
      beat++; pulse = 1;
      bpm = Math.min(170, 80 + volleys * 1.6);
      if (firing) firing = null;
      if (warn) { // wordt vuur
        firing = warn; warn = null; fireT = 0.28;
        if (hits(firing, pc, pr) && inv <= 0) damage();
        else if (!over) { volleys++; score += 10; if (volleys % 5 === 0) { msg = 'Sneller!'; msgT = 1; } }
      } else if (beat % 2 === 0) {
        warn = makeVolley();
      }
    }
    function damage() {
      hp--; inv = 0.9; flash = 1;
      for (let i = 0; i < 20; i++) { const a = Math.random() * 6.28; parts.push({ x: gx + (pc + 0.5) * cs, y: gy + (pr + 0.5) * cs, vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, t: 0.6 }); }
      if (hp <= 0 && !over) { over = true; api.end(Math.floor(score)); }
    }

    function update(dt) {
      time += dt; inv -= dt; msgT -= dt; flash = Math.max(0, flash - dt * 3); pulse = Math.max(0, pulse - dt * 4);
      moveCd -= dt;
      if (moveCd <= 0 && (tc !== pc || tr !== pr)) {
        moveCd = 0.1;
        if (tc !== pc) pc += Math.sign(tc - pc); else pr += Math.sign(tr - pr);
      }
      beatT += dt;
      const bl = 60 / bpm;
      if (beatT >= bl) { beatT -= bl; beatTick(); }
      if (firing) { fireT -= dt; }
      for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt; }
      for (let i = parts.length - 1; i >= 0; i--) if (parts[i].t <= 0) parts.splice(i, 1);
      api.score(Math.floor(score));
    }

    function lines(v, col, alpha, thick) {
      ctx.fillStyle = col; ctx.globalAlpha = alpha;
      for (const r of v.rows) ctx.fillRect(gx - 10, gy + r * cs + cs / 2 - thick / 2, gs + 20, thick);
      for (const c of v.cols) ctx.fillRect(gx + c * cs + cs / 2 - thick / 2, gy - 10, thick, gs + 20);
      if (v.diag) { ctx.save(); ctx.translate(gx, gy); ctx.rotate(Math.PI / 4); ctx.fillRect(-20, -thick / 2, gs * 1.42 + 40, thick); ctx.restore(); }
      ctx.globalAlpha = 1;
    }
    function draw() {
      const b = 5 + pulse * 18;
      ctx.fillStyle = 'rgb(' + (5 + b) + ',' + (1 + b * 0.2) + ',' + (15 + b * 1.4) + ')';
      ctx.fillRect(0, 0, W, H);
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        ctx.fillStyle = (r + c) % 2 ? '#1a0f33' : '#241345';
        ctx.fillRect(gx + c * cs + 2, gy + r * cs + 2, cs - 4, cs - 4);
        ctx.strokeStyle = 'rgba(160,100,255,' + (0.3 + pulse * 0.5) + ')'; ctx.lineWidth = 2;
        ctx.strokeRect(gx + c * cs + 2, gy + r * cs + 2, cs - 4, cs - 4);
      }
      if (warn) {
        const bl = 60 / bpm, f = beatT / bl;
        lines(warn, '#ff3355', 0.25 + 0.4 * Math.abs(Math.sin(f * Math.PI * 4)), 6);
        ctx.fillStyle = '#ff3355'; ctx.globalAlpha = 0.18 + 0.2 * f;
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (hits(warn, c, r)) ctx.fillRect(gx + c * cs + 3, gy + r * cs + 3, cs - 6, cs - 6);
        ctx.globalAlpha = 1;
      }
      if (firing) {
        ctx.shadowColor = '#ff2244'; ctx.shadowBlur = 25;
        lines(firing, '#ffffff', 1, cs * 0.5); lines(firing, '#ff1744', 0.8, cs * 0.8);
        ctx.shadowBlur = 0;
      }
      // speler
      const px = gx + (pc + 0.5) * cs, py = gy + (pr + 0.5) * cs;
      if (!over && (inv <= 0 || Math.floor(time * 16) % 2)) {
        ctx.shadowColor = '#00f5d4'; ctx.shadowBlur = 18;
        ctx.fillStyle = '#00f5d4'; ctx.beginPath(); ctx.arc(px, py, cs * 0.26, 0, 6.283); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = '#05010f'; ctx.beginPath(); ctx.arc(px, py, cs * 0.12, 0, 6.283); ctx.fill();
      }
      // doelmarkering
      if (tc !== pc || tr !== pr) { ctx.strokeStyle = 'rgba(0,245,212,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(gx + tc * cs + 6, gy + tr * cs + 6, cs - 12, cs - 12); }
      ctx.fillStyle = '#fff';
      for (const p of parts) { ctx.globalAlpha = Math.max(0, p.t); ctx.fillRect(p.x, p.y, 4, 4); }
      ctx.globalAlpha = 1;
      if (flash > 0) { ctx.fillStyle = 'rgba(255,0,60,' + flash * 0.4 + ')'; ctx.fillRect(0, 0, W, H); }
      ctx.textAlign = 'center'; ctx.font = '22px serif'; ctx.fillText('❤️'.repeat(Math.max(0, hp)), W / 2, 50);
      ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillText(Math.round(bpm) + ' BPM', W / 2, H - 40);
      if (msgT > 0 && !over) { ctx.globalAlpha = Math.min(1, msgT); ctx.font = 'bold 28px sans-serif'; ctx.fillStyle = '#ffd166'; ctx.fillText(msg, W / 2, gy - 30); ctx.globalAlpha = 1; }
    }
    function loop(t) {
      if (dead) return;
      const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
      if (!over) update(dt); else { pulse = Math.max(0, pulse - dt * 4); flash = Math.max(0, flash - dt * 3); for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt; } }
      draw();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointermove', onMove);
        cv.removeEventListener('pointerup', onUp); cv.removeEventListener('pointercancel', onUp);
        window.removeEventListener('keydown', onKey);
        cv.remove();
      },
    };
  },
};
