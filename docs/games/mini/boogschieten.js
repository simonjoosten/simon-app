export default {
  id: 'boogschieten', name: 'Boogschieten', emoji: '🏹', hint: 'Trek omlaag om te spannen, richt met het kruisje, laat los',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#6ec6ff';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = W / 2, TY = H * 0.32, R = Math.min(52, W * 0.15), bowY = H * 0.86;
    let dead = false, ended = false, raf = 0, last = 0, time = 0;
    let n = 0, total = 0, wind = 0, phase = 'aim', pt = 0, msg = '', msgT = 0;
    const stuck = []; // {rx,ry} t.o.v. doel
    const missed = []; // {x,y}
    let pull = null, flight = null;
    const trophy = [];

    function newWind() { wind = Math.round((Math.random() * 2 - 1) * 10) / 10; if (n >= 3 && Math.abs(wind) < 0.3) wind = wind < 0 ? -0.5 : 0.5; }
    newWind();

    let tp = 0;
    function tgtX() { return cx + W * 0.27 * Math.sin(tp); }

    function crosshair() {
      const dx = pull.x - pull.x0, dy = Math.max(0, pull.y - pull.y0);
      const hold = pull.t;
      const w = 4 + Math.min(16, Math.max(0, hold - 1.0) * 5);
      return {
        x: cx - dx * 1.1 + Math.sin(time * 4.7) * w * 0.8 + Math.sin(time * 2.1) * w * 0.5,
        y: TY - 10 + (130 - Math.min(dy, 150)) * 0.9 + Math.cos(time * 3.9) * w * 0.8 + Math.sin(time * 1.7) * w * 0.5,
        pw: Math.min(1, dy / 130), w, dy,
      };
    }

    const pos = e => { const b = host.getBoundingClientRect(); return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height }; };
    const pd = e => {
      if (phase !== 'aim') return;
      const p = pos(e); pull = { x0: p.x, y0: p.y, x: p.x, y: p.y, t: 0 };
      try { host.setPointerCapture(e.pointerId); } catch (_) {}
    };
    const pm = e => { if (pull) { const p = pos(e); pull.x = p.x; pull.y = p.y; } };
    const pu = () => {
      if (!pull) return;
      const c = crosshair(), ok = c.dy > 28; pull = null;
      if (!ok || phase !== 'aim') return;
      const lx = c.x + wind * 38, ly = c.y + (1 - c.pw) * 20;
      flight = { x0: cx, y0: bowY - 20, x1: lx, y1: ly, t: 0, pw: c.pw };
      phase = 'fly'; pt = 0;
    };
    const pc = () => { pull = null; };
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm);
    host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pc);

    function land() {
      const tx = tgtX(), dx = flight.x1 - tx, dy = flight.y1 - TY, d = Math.hypot(dx, dy);
      let val = 0;
      if (d <= R) { val = Math.max(1, 10 - Math.floor(d / (R / 10))); stuck.push({ rx: dx, ry: dy }); }
      else missed.push({ x: flight.x1, y: flight.y1 });
      total += val; n++;
      api.score(total);
      msg = val === 10 ? 'Roos! 10' : val ? val + ' punten' : 'Misser!'; msgT = 1.1;
      phase = 'land'; pt = 0; flight = null;
    }

    function update(dt) {
      time += dt; tp += dt * (0.8 + 0.13 * n); pt += dt;
      if (msgT > 0) msgT -= dt;
      if (pull) pull.t += dt;
      if (phase === 'fly') {
        flight.t += dt; if (flight.t >= 0.5) land();
      } else if (phase === 'land') {
        if (pt > 1.0) {
          if (n >= 10) {
            phase = 'done';
            if (!ended) { ended = true; msg = 'Totaal: ' + total; msgT = 99; setTimeout(() => { if (!dead) api.end(total); }, 1500); }
          } else { newWind(); phase = 'aim'; }
        }
      }
    }

    function T(s, x, y, size, col, al) { ctx.font = '700 ' + size + 'px system-ui,sans-serif'; ctx.textAlign = al || 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(s, x, y); }

    function arrow(x, y, ang, len, thick) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = thick; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, len); ctx.stroke();
      ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.moveTo(0, -thick * 2.2); ctx.lineTo(-thick * 1.2, 0); ctx.lineTo(thick * 1.2, 0); ctx.fill();
      ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.moveTo(0, len); ctx.lineTo(-thick * 1.8, len + thick * 3.2); ctx.lineTo(0, len + thick * 2); ctx.lineTo(thick * 1.8, len + thick * 3.2); ctx.fill();
      ctx.restore();
    }

    function drawTarget(x) {
      // standaard
      ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 14, TY + R + 40); ctx.lineTo(x, TY + R - 4); ctx.lineTo(x + 14, TY + R + 40); ctx.stroke();
      const cols = ['#f5f5f5', '#212121', '#1e88e5', '#e53935', '#fdd835'];
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.arc(x, TY, R * (1 - i * 0.2), 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, TY, R + 1, 0, 7); ctx.stroke();
      for (const s of stuck) arrow(x + s.rx, TY + s.ry, 0.0, 20, 2);
    }

    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.6); g.addColorStop(0, '#4fa3e8'); g.addColorStop(1, '#bde6ff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // wolken
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 3; i++) { const x = ((time * (6 + i * 3) + i * 140) % (W + 120)) - 60, y = 70 + i * 36; ctx.beginPath(); ctx.arc(x, y, 18, 0, 7); ctx.arc(x + 20, y + 4, 14, 0, 7); ctx.arc(x - 18, y + 5, 13, 0, 7); ctx.fill(); }
      // heuvels en gras
      ctx.fillStyle = '#7cb342'; ctx.beginPath(); ctx.moveTo(0, H * 0.5); ctx.quadraticCurveTo(W * 0.3, H * 0.4, W * 0.6, H * 0.5); ctx.quadraticCurveTo(W * 0.85, H * 0.44, W, H * 0.5); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      ctx.fillStyle = '#558b2f'; ctx.fillRect(0, H * 0.55, W, H * 0.45);
      ctx.fillStyle = '#689f38'; ctx.fillRect(0, H * 0.7, W, H * 0.3);
      const tx = tgtX();
      drawTarget(tx);
      for (const m of missed) { ctx.globalAlpha = 0.9; arrow(m.x, m.y, 0, 18, 2); ctx.globalAlpha = 1; }
      // wind
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, 34);
      T('Pijl ' + Math.min(n + 1, 10) + '/10', 52, 17, 15, '#fff');
      T('Score ' + total, W - 54, 17, 15, '#ffeb3b');
      const wl = Math.abs(wind) * 26;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - wind * 13, 17); ctx.lineTo(cx + wind * 13, 17); ctx.stroke();
      const dir = wind >= 0 ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(cx + dir * wl / 2, 17); ctx.lineTo(cx + dir * (wl / 2 - 6), 11); ctx.moveTo(cx + dir * wl / 2, 17); ctx.lineTo(cx + dir * (wl / 2 - 6), 23); ctx.stroke();
      T(Math.abs(wind).toFixed(1) + ' m/s', cx, 30, 9, '#fff');
      // vlucht
      if (phase === 'fly' && flight) {
        const k = flight.t / 0.5, e = 1 - (1 - k) * (1 - k);
        const x = flight.x0 + (flight.x1 - flight.x0) * e, y = flight.y0 + (flight.y1 - flight.y0) * e - Math.sin(k * Math.PI) * 40;
        const s = 1 - 0.6 * e;
        const nx = flight.x0 + (flight.x1 - flight.x0) * Math.min(1, e + 0.02), ny = flight.y0 + (flight.y1 - flight.y0) * Math.min(1, e + 0.02) - Math.sin(Math.min(1, k + 0.02) * Math.PI) * 40;
        const ang = Math.atan2(nx - x, -(ny - y)) * -1 + Math.PI;
        void ang;
        arrow(x, y, Math.atan2(x - nx, ny - y) + Math.PI, 26 * s + 4, 2.4 * s + 0.4);
      }
      // boog
      let nockX = cx, nockY = bowY + 6;
      let c = null;
      if (pull && phase === 'aim') {
        c = crosshair();
        nockX = cx - (pull.x - pull.x0) * 0.3; nockY = bowY + 6 + Math.min(70, c.dy * 0.5);
      }
      ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - 54, bowY + 14); ctx.quadraticCurveTo(cx, bowY - 34, cx + 54, bowY + 14); ctx.stroke();
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(cx - 54, bowY + 14); ctx.lineTo(nockX, nockY); ctx.lineTo(cx + 54, bowY + 14); ctx.stroke();
      if (phase === 'aim') arrow(nockX, nockY - 34 - (c ? c.pw * 6 : 0), 0, 46, 2.6);
      if (c) {
        const p = c.pw;
        ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(c.x, c.y, 15, 0, 7); ctx.moveTo(c.x - 22, c.y); ctx.lineTo(c.x - 6, c.y); ctx.moveTo(c.x + 6, c.y); ctx.lineTo(c.x + 22, c.y);
        ctx.moveTo(c.x, c.y - 22); ctx.lineTo(c.x, c.y - 6); ctx.moveTo(c.x, c.y + 6); ctx.lineTo(c.x, c.y + 22); ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(W - 24, H * 0.55, 10, 130);
        ctx.fillStyle = 'hsl(' + (p * 120) + ',80%,50%)'; ctx.fillRect(W - 24, H * 0.55 + 130 * (1 - p), 10, 130 * p);
        if (c.w > 6) T('Rustig!', cx, H * 0.6, 13, '#fff');
      } else if (phase === 'aim') T(n === 0 ? 'Trek omlaag, sleep opzij om te richten' : 'Mik voor de beweging uit en let op de wind', cx, H * 0.96, 13, '#fff');
      if (msgT > 0) { T(msg, cx, H * 0.58, msg.length > 10 ? 28 : 38, '#fff'); }
    }

    function frame(t) {
      if (dead) return;
      const dt = Math.min(0.033, (t - last) / 1000 || 0.016); last = t;
      update(dt); draw();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    void trophy;

    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        host.removeEventListener('pointerdown', pd); host.removeEventListener('pointermove', pm);
        host.removeEventListener('pointerup', pu); host.removeEventListener('pointercancel', pc);
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      },
    };
  },
};
