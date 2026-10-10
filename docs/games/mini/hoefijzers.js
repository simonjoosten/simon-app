export default {
  id: 'hoefijzers', name: 'Hoefijzers', emoji: '🧲', hint: 'Sleep omhoog: richting en lengte bepalen waar je hoefijzer landt',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#8bc34a';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = W / 2, PY = H * 0.3, OY = H * 0.86, K = 1.9, MAXN = 10;
    let dead = false, ended = false, raf = 0, last = 0, time = 0;
    let n = 0, total = 0, phase = 'aim', pt = 0, msg = '', msgT = 0;
    const landed = []; // {x,y,a,pts}
    let drag = null, fl = null;

    const pos = e => { const b = host.getBoundingClientRect(); return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height }; };
    const pd = e => {
      if (phase !== 'aim') return;
      const p = pos(e); drag = { x0: p.x, y0: p.y, x: p.x, y: p.y };
      try { host.setPointerCapture(e.pointerId); } catch (_) {}
    };
    const pm = e => { if (drag) { const p = pos(e); drag.x = p.x; drag.y = p.y; } };
    function target() {
      const dx = drag.x - drag.x0, dy = drag.y - drag.y0;
      return { x: cx + dx * K, y: OY + dy * K, len: Math.hypot(dx, dy), dy };
    }
    const pu = () => {
      if (!drag) return;
      const t = target(); drag = null;
      if (phase !== 'aim') return;
      if (t.dy > -25) { msg = 'Sleep omhoog!'; msgT = 0.9; return; }
      const noise = 3 + n * 0.8;
      const x = t.x + (Math.random() - 0.5) * 2 * noise, y = t.y + (Math.random() - 0.5) * 2 * noise;
      fl = { x0: cx, y0: OY, x1: x, y1: y, t: 0, rot: (Math.random() < 0.5 ? -1 : 1) * (Math.PI * 2 + Math.random() * 2), a1: Math.random() * Math.PI * 2 };
      phase = 'fly'; pt = 0;
    };
    const pc = () => { drag = null; };
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm);
    host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pc);

    function land() {
      const d = Math.hypot(fl.x1 - cx, fl.y1 - PY);
      let pts = 0, name = 'Mis';
      if (d < 10) { pts = 50; name = 'Ringer! 5 punten'; }
      else if (d < 26) { pts = 30; name = 'Leaner! 3 punten'; }
      else if (d < 52) { pts = 10; name = 'Dichtbij! 1 punt'; }
      if (pts === 50) { fl.x1 = cx + (Math.random() - 0.5) * 4; fl.y1 = PY + (Math.random() - 0.5) * 4; }
      landed.push({ x: fl.x1, y: fl.y1, a: fl.rot + fl.a1, pts });
      total += pts; n++; api.score(total);
      msg = name; msgT = 1.1; phase = 'land'; pt = 0; fl = null;
    }

    function update(dt) {
      time += dt; pt += dt; if (msgT > 0 && msgT < 90) msgT -= dt;
      if (phase === 'fly') { fl.t += dt; if (fl.t >= 0.75) land(); }
      else if (phase === 'land' && pt > 1.0) {
        if (n >= MAXN) {
          phase = 'done';
          if (!ended) { ended = true; msg = 'Totaal: ' + total; msgT = 99; setTimeout(() => { if (!dead) api.end(total); }, 1500); }
        } else phase = 'aim';
      }
    }

    function T(s, x, y, size, col, al) { ctx.font = '700 ' + size + 'px system-ui,sans-serif'; ctx.textAlign = al || 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(s, x, y); }
    function shoe(x, y, a, s, alpha) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s); ctx.globalAlpha = alpha === undefined ? 1 : alpha;
      ctx.lineCap = 'butt';
      ctx.strokeStyle = '#37474f'; ctx.lineWidth = 8.5; ctx.beginPath(); ctx.arc(0, 0, 12, -Math.PI / 2 + 0.65, -Math.PI / 2 - 0.65 + Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 12, -Math.PI / 2 + 0.65, -Math.PI / 2 - 0.65 + Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#263238';
      for (let i = 0; i < 5; i++) { const an = Math.PI / 2 + (i - 2) * 0.5; ctx.beginPath(); ctx.arc(Math.cos(an) * 12, Math.sin(an) * 12, 1.2, 0, 7); ctx.fill(); }
      ctx.restore();
    }

    function draw() {
      ctx.fillStyle = '#8bc34a'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < 10; i++) ctx.fillRect(0, i * H / 10, W, H / 20);
      // zandbak
      ctx.fillStyle = '#6d4c41'; ctx.beginPath(); ctx.arc(cx, PY, 86, 0, 7); ctx.fill();
      ctx.fillStyle = '#e8d29a'; ctx.beginPath(); ctx.arc(cx, PY, 80, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1;
      for (let r = 20; r < 80; r += 20) { ctx.beginPath(); ctx.arc(cx, PY, r, 0, 7); ctx.stroke(); }
      // werpstrook
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(cx - 34, PY + 90, 68, OY - PY - 70);
      ctx.fillStyle = '#795548'; ctx.fillRect(cx - 40, OY + 20, 80, 8);
      for (const l of landed) if (l.pts < 50) shoe(l.x, l.y, l.a, 1);
      for (const l of landed) if (l.pts === 50) shoe(l.x, l.y, l.a, 1);
      // paal
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(cx + 3, PY + 3, 5, 3, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#b71c1c'; ctx.beginPath(); ctx.arc(cx, PY, 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#ff8a80'; ctx.beginPath(); ctx.arc(cx - 1.2, PY - 1.2, 1.5, 0, 7); ctx.fill();
      // richten
      if (drag && phase === 'aim') {
        const t = target(), noise = 3 + n * 0.8;
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
        ctx.beginPath(); ctx.moveTo(cx, OY); ctx.lineTo(t.x, t.y); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(t.x, t.y, noise + 5, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(t.x - 5, t.y); ctx.lineTo(t.x + 5, t.y); ctx.moveTo(t.x, t.y - 5); ctx.lineTo(t.x, t.y + 5); ctx.stroke();
      }
      if (phase === 'aim') shoe(cx, OY, 0, 1.3);
      if (fl) {
        const k = fl.t / 0.75, e = 1 - (1 - k) * (1 - k);
        const x = fl.x0 + (fl.x1 - fl.x0) * e, y = fl.y0 + (fl.y1 - fl.y0) * e;
        const h = Math.sin(k * Math.PI) * 80;
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y, 11, 6, 0, 0, 7); ctx.fill();
        shoe(x, y - h, fl.rot * k + fl.a1 * k, 1.3 - 0.3 * k);
      }
      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, 0, W, 34);
      T('Worp ' + Math.min(n + 1, MAXN) + '/' + MAXN, 54, 17, 15, '#fff');
      T('Score ' + total, W - 54, 17, 15, '#ffeb3b');
      for (let i = 0; i < MAXN; i++) { ctx.fillStyle = i < n ? 'rgba(255,255,255,0.3)' : '#fff'; ctx.beginPath(); ctx.arc(W / 2 - 4.5 * 12 + i * 12, 17, 3.5, 0, 7); ctx.fill(); }
      if (phase === 'aim' && !drag) T(n === 0 ? 'Sleep omhoog vanaf het hoefijzer, laat los' : 'Mik op de rode paal', cx, H * 0.96, 14, '#1b5e20');
      if (msgT > 0) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, H * 0.55 - 26, W, 52); T(msg, cx, H * 0.55, msg.length > 14 ? 24 : 30, '#fff'); }
    }

    function frame(t) {
      if (dead) return;
      const dt = Math.min(0.033, (t - last) / 1000 || 0.016); last = t;
      update(dt); draw();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

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
