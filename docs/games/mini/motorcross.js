export default {
  id: 'motorcross', name: 'Motorcross', emoji: '🏍️', hint: 'Rechts = gas / voorover, links = rem / achterover. Land op je wielen!',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#8fd0ff';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    let dead = false, raf = 0, last = 0, ended = false, endT = 0, t = 0;
    const BASE = H * 0.62, R = 12, G = 900, TAU = Math.PI * 2;
    const smooth = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
    // terrain height (up is positive) at world x
    function hgt(x) {
      const d = Math.max(0, x), lv = Math.min(1, d / 16000);
      let h = 0;
      h += (38 + lv * 40) * Math.sin(d * 0.0065) + (20 + lv * 20) * Math.sin(d * 0.0161 + 1.3);
      // kickers every ~700px
      const k = Math.floor((d - 500) / 650);
      if (d > 500) {
        const sx = 500 + k * 650 + 330, u = (d - sx) / 130; // ramp up over 130px then abrupt drop
        const sz = 50 + lv * 55 + (k % 3) * 12;
        if (k >= 0 && u > 0 && u < 1.25) h += sz * smooth(u) * (u > 1 ? Math.max(0, 1 - (u - 1) * 4) : 1);
      }
      return h * smooth((d - 100) / 500);
    }
    const gy = x => BASE - hgt(x);
    let x = 80, y = gy(80) - R, vx = 0, vy = 0, ang = 0, av = 0, q = 0, air = false, airRot = 0, airT = 0;
    let gasOn = false, leanOn = false, camX = 0;
    let score = 0, tricks = 0, trickPts = 0, wheelie = 0, popup = '', popT = 0, stuckT = 0, best = 80;
    const keys = {};
    const ptrs = new Map();
    const pd = e => { const r = cv.getBoundingClientRect(); ptrs.set(e.pointerId, (e.clientX - r.left) * W / r.width > W / 2 ? 'g' : 'l'); try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const pu = e => ptrs.delete(e.pointerId);
    host.addEventListener('pointerdown', pd); host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pu);
    const kd = e => { keys[e.key] = true; if (e.key.startsWith('Arrow')) e.preventDefault(); }, ku = e => { keys[e.key] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    api.score(0);
    const parts = [];
    function pop(s) { popup = s; popT = 1.4; }
    function crash() {
      if (ended) return; ended = true; endT = 0;
      for (let i = 0; i < 20; i++) parts.push({ x, y, vx: vx * 0.3 + (Math.random() - 0.5) * 200, vy: -Math.random() * 250, l: 1 });
    }
    function slopeAt(px) { return Math.atan2(gy(px + 4) - gy(px - 4), 8); }
    function step(dt) {
      const gas = gasOn, lean = leanOn;
      const sl = slopeAt(x);
      if (!air) {
        // wheel contact: follow terrain
        let sp = vx * Math.cos(sl) + vy * Math.sin(sl);
        sp += Math.sin(sl) * G * 0.4 * dt;
        if (gas) sp += (270 - Math.min(sp, 400) * 0.5) * dt;
        if (lean) sp -= 260 * dt;
        sp -= sp * 0.25 * dt;
        sp = Math.max(-80, sp);
        vx = sp * Math.cos(sl); vy = sp * Math.sin(sl);
        const tq = gas ? -0.42 : lean ? 0.12 : 0;
        q += (tq - q) * Math.min(1, dt * 3.5);
        if (gas && sp < 120) q += (tq * 0.5 - q) * dt;
        ang = sl + q;
        if (q < -0.38 && gas && sp > 60) wheelie += dt;
        else if (wheelie > 0.6) { trickPts += Math.floor(wheelie * 60); pop('Wheelie +' + Math.floor(wheelie * 60)); wheelie = 0; } else wheelie = 0;
        if (q < -1.0) { crash(); return; }
      } else {
        vy += G * dt;
        av += ((gas ? -1 : 0) + (lean ? 1 : 0)) * 11 * dt;
        av *= 1 - 0.6 * dt;
        ang += av * dt; airRot += av * dt; airT += dt;
        const f = Math.floor(Math.abs(airRot) / (TAU * 0.92));
        if (f > tricks) { tricks = f; }
      }
      x += vx * dt; y += vy * dt;
      const g0 = gy(x) - R;
      if (y >= g0 - 0.5) {
        if (air) {
          // landing
          const s2 = slopeAt(x);
          let diff = ang - s2; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          if (Math.abs(diff) > 0.85 && airT > 0.05) { y = g0; crash(); return; }
          const flips = Math.round(Math.abs(airRot) / TAU);
          if (flips >= 1 && Math.abs(diff) <= 0.85) { const pts = flips * 400; trickPts += pts; pop((airRot < 0 ? 'Backflip' : 'Frontflip') + (flips > 1 ? ' x' + flips : '') + '! +' + pts); }
          else if (airT > 0.9) { trickPts += 50; pop('Mooie sprong +50'); }
          q = Math.max(-0.5, Math.min(0.5, diff)); air = false; airRot = 0; tricks = 0; av = 0;
          const sp = vx * Math.cos(s2) + vy * Math.sin(s2);
          vx = sp * Math.cos(s2) * 0.97; vy = sp * Math.sin(s2) * 0.97;
        }
        y = g0;
      } else if (!air && y < g0 - 1.2) { air = true; airRot = 0; airT = 0; av = 0; ang = sl + q; av = (q - 0) * 0.3; }
    }
    function update(dt) {
      t += dt;
      gasOn = !!(keys.ArrowRight || keys.d || keys.ArrowUp || [...ptrs.values()].includes('g'));
      leanOn = !!(keys.ArrowLeft || keys.a || keys.ArrowDown || [...ptrs.values()].includes('l'));
      const n = 3;
      for (let i = 0; i < n && !ended; i++) step(dt / n);
      if (popT > 0) popT -= dt;
      camX += ((x - W * 0.3) - camX) * Math.min(1, dt * 6);
      if (x > best) { best = x; stuckT = 0; } else stuckT += dt;
      if (t > 3 && vx < 25 && !air) { stuckT += dt; }
      if (stuckT > 4 && !ended) crash();
      if (y > H + 100 && !ended) crash();
      score = Math.floor((x - 80) / 10) + trickPts;
      api.score(score);
    }
    function bike(px, py, a) {
      ctx.save(); ctx.translate(px, py); ctx.rotate(a);
      const wr = R;
      ctx.lineWidth = 4;
      for (const wx of [-19, 19]) {
        ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.arc(wx, 0, wr, 0, 7); ctx.stroke();
        ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(wx - wr + 2, 0); ctx.lineTo(wx + wr - 2, 0); ctx.moveTo(wx, -wr + 2); ctx.lineTo(wx, wr - 2); ctx.stroke(); ctx.lineWidth = 4;
      }
      ctx.strokeStyle = '#e8453c'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-19, 0); ctx.lineTo(-4, -12); ctx.lineTo(12, -12); ctx.lineTo(19, 0); ctx.moveTo(12, -12); ctx.lineTo(17, -22); ctx.stroke();
      ctx.fillStyle = '#ffcc33'; ctx.fillRect(-8, -16, 18, 6);
      ctx.fillStyle = '#2a2a55'; ctx.beginPath(); ctx.moveTo(-6, -16); ctx.lineTo(2, -30); ctx.lineTo(9, -29); ctx.lineTo(8, -16); ctx.fill();
      ctx.fillStyle = '#ffd7b0'; ctx.beginPath(); ctx.arc(8, -36, 6, 0, 7); ctx.fill();
      ctx.fillStyle = '#e8453c'; ctx.beginPath(); ctx.arc(8, -38, 6.5, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#2a2a55'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(6, -28); ctx.lineTo(15, -23); ctx.stroke();
      ctx.restore();
    }
    function draw() {
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#6ec0ff'); sky.addColorStop(0.7, '#d6efff');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      // far hills
      ctx.fillStyle = '#9fc6a8'; ctx.beginPath(); ctx.moveTo(0, H);
      for (let sx = 0; sx <= W + 10; sx += 10) ctx.lineTo(sx, H * 0.5 - 30 * Math.sin((sx + camX * 0.2) * 0.012) - 15 * Math.sin((sx + camX * 0.2) * 0.031));
      ctx.lineTo(W + 10, H); ctx.fill();
      ctx.fillStyle = '#7fb27f'; ctx.beginPath(); ctx.moveTo(0, H);
      for (let sx = 0; sx <= W + 10; sx += 10) ctx.lineTo(sx, H * 0.58 - 24 * Math.sin((sx + camX * 0.5) * 0.02 + 1));
      ctx.lineTo(W + 10, H); ctx.fill();
      // ground
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let sx = 0; sx <= W + 6; sx += 6) ctx.lineTo(sx, gy(camX + sx));
      ctx.lineTo(W + 6, H); ctx.closePath();
      ctx.fillStyle = '#9b6a3b'; ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = '#3f9a3f';
      ctx.beginPath(); for (let sx = 0; sx <= W + 6; sx += 6) { const yy = gy(camX + sx); sx ? ctx.lineTo(sx, yy) : ctx.moveTo(sx, yy); } ctx.stroke();
      // finish-ish markers every 1000px
      ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      const m0 = Math.ceil(camX / 500) * 500;
      for (let m = m0; m < camX + W + 10; m += 500) { if (m < 100) continue; const sx = m - camX, yy = gy(m); ctx.fillStyle = '#fff'; ctx.fillRect(sx - 1, yy - 34, 2, 34); ctx.fillRect(sx - 14, yy - 36, 28, 14); ctx.fillStyle = '#333'; ctx.fillText(Math.floor(m / 10) + 'm', sx, yy - 25); }
      if (!ended) bike(x - camX, y, ang);
      for (const p of parts) { ctx.globalAlpha = Math.max(0, p.l); ctx.fillStyle = '#ff9a20'; ctx.fillRect(p.x - camX - 3, p.y - 3, 6, 6); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#12233a'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(score + ' punten', 10, 10);
      ctx.font = '13px sans-serif'; ctx.fillText(Math.round(Math.hypot(vx, vy) * 0.25) + ' km/u', 10, 34);
      if (popT > 0) { ctx.globalAlpha = Math.min(1, popT); ctx.textAlign = 'center'; ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = '#c4183c'; ctx.fillText(popup, W / 2, 80); ctx.globalAlpha = 1; }
      if (wheelie > 0.3) { ctx.textAlign = 'center'; ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = '#c4183c'; ctx.fillText('Wheelie ' + wheelie.toFixed(1) + 's', W / 2, 110); }
      // control hints
      ctx.globalAlpha = 0.25; ctx.fillStyle = '#000'; ctx.fillRect(0, H - 56, W / 2 - 4, 46); ctx.fillRect(W / 2 + 4, H - 56, W / 2 - 4, 46); ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('REM / ACHTEROVER', W / 4, H - 33); ctx.fillText('GAS / VOOROVER', W * 3 / 4, H - 33);
    }
    function frame(ts) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.max(0.001, Math.min((ts - (last || ts)) / 1000, 0.05)); last = ts;
      if (!ended) update(dt);
      else {
        endT += dt;
        for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; p.l -= dt; }
        if (endT > 1 && endT < 50) { endT = 99; api.end(score); }
      }
      draw();
    }
    raf = requestAnimationFrame(frame);
    return { destroy() {
      dead = true; cancelAnimationFrame(raf);
      host.removeEventListener('pointerdown', pd); host.removeEventListener('pointerup', pu); host.removeEventListener('pointercancel', pu);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      cv.remove();
    } };
  },
};
