// Springkikker: trek terug en laat los om van lelieblad naar lelieblad te springen
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
  id: 'springkikker',
  name: 'Springkikker',
  emoji: '🐸',
  hint: 'Trek terug en laat los: hoe verder je trekt, hoe harder je springt',
  create(host, api) {
    const { c, g, W, H } = setup(host, api);
    const MAXJ = Math.min(300, W * 0.85), DUR = 0.55;
    let pads = [], idx = 0, cam = 0, t = 0, flies = 0, hops = 0, score = 0;
    let frog = { pad: null, ox: 0, oy: 0, x: 0, y: 0 };
    let jump = null, drag = null, splash = null, over = false, dead = false, raf = 0, last = 0, msg = '', msgT = 0;

    const addPad = () => {
      const lp = pads[pads.length - 1];
      const i = idx++;
      const r = Math.max(24, 46 - i * 0.7);
      const y = lp ? lp.y - (95 + Math.random() * 60 + Math.min(30, i * 1.5)) : 0;
      const x = lp ? Math.max(r + 8, Math.min(W - r - 8, lp.x + (Math.random() - 0.5) * 260)) : W / 2;
      const p = { i, bx: x, x, y, r, amp: i > 6 ? Math.min(55, (i - 6) * 5) * (Math.random() < 0.6 ? 1 : 0) : 0, ph: Math.random() * 6, sp: 0.8 + Math.random() * 0.8, sink: null, fly: i > 1 && Math.random() < 0.3, rot: Math.random() * 6 };
      pads.push(p);
      if (lp && Math.random() < 0.35) {
        const r2 = Math.max(22, r - 4);
        pads.push({ i: -1, bx: Math.random() < 0.5 ? r2 + 10 : W - r2 - 10, x: 0, y: y + (Math.random() - 0.5) * 80, r: r2, amp: 0, ph: 0, sp: 1, sink: null, fly: false, rot: Math.random() * 6, decoy: true });
        pads[pads.length - 1].x = pads[pads.length - 1].bx;
      }
    };
    addPad();
    frog.pad = pads[0]; frog.x = pads[0].x; frog.y = pads[0].y;
    while (pads.length < 8) addPad();

    const finish = () => { if (over) return; over = true; api.end(score); };
    const say = (s) => { msg = s; msgT = 0.9; };
    const pos = (e) => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
    const pd = (e) => { if (!jump && !splash && !over) drag = { id: e.pointerId, p0: pos(e), p: pos(e) }; };
    const pm = (e) => { if (drag && drag.id === e.pointerId) drag.p = pos(e); };
    const vec = () => {
      if (!drag) return null;
      let dx = (drag.p0[0] - drag.p[0]) * 1.5, dy = (drag.p0[1] - drag.p[1]) * 1.5;
      const l = Math.hypot(dx, dy);
      if (l > MAXJ) { dx *= MAXJ / l; dy *= MAXJ / l; }
      return [dx, dy, Math.min(l, MAXJ)];
    };
    const pu = (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      const v = vec(); drag = null;
      if (!v || v[2] < 25 || jump || over) return;
      jump = { sx: frog.x, sy: frog.y, tx: frog.x + v[0], ty: frog.y + v[1], p: 0, len: v[2] };
      frog.pad = null;
    };
    host.addEventListener('pointerdown', pd);
    window.addEventListener('pointermove', pm);
    window.addEventListener('pointerup', pu);
    window.addEventListener('pointercancel', pu);

    const step = (dt) => {
      t += dt; msgT = Math.max(0, msgT - dt);
      for (const p of pads) p.x = p.amp ? Math.max(p.r + 6, Math.min(W - p.r - 6, p.bx + Math.sin(t * p.sp + p.ph) * p.amp)) : p.bx;
      if (splash) { splash.t += dt; if (splash.t > 0.8) finish(); }
      if (!over && !splash) {
        if (jump) {
          jump.p += dt / DUR;
          const e = Math.min(1, jump.p);
          frog.x = jump.sx + (jump.tx - jump.sx) * e;
          frog.y = jump.sy + (jump.ty - jump.sy) * e;
          if (jump.p >= 1) {
            const tx = jump.tx, ty = jump.ty;
            let hit = null;
            for (const p of pads) if (Math.hypot(p.x - tx, p.y - ty) <= p.r * 0.92) { hit = p; break; }
            jump = null;
            if (hit) {
              frog.pad = hit; frog.ox = tx - hit.x; frog.oy = ty - hit.y;
              if (hit.i >= 0 && hit.i + 0 > 0 && !hit.done) {
                hit.done = true; hops++;
                if (hit.fly) { flies++; hit.fly = false; say('Lekker, een vlieg!'); }
              }
              hit.sink = hit.i === 0 ? null : Math.max(1.6, 4.2 - hops * 0.07);
              hit.sink0 = hit.sink;
              score = hops * 10 + flies * 5; api.score(score);
              while (pads[pads.length - 1].y > hit.y - 900) addPad();
            } else { splash = { t: 0, x: tx, y: ty }; say('Plons!'); }
          }
        } else if (frog.pad) {
          frog.x = frog.pad.x + frog.ox; frog.y = frog.pad.y + frog.oy;
          const p = frog.pad;
          if (p.sink !== null) {
            p.sink -= dt;
            if (p.sink <= 0) { splash = { t: 0, x: frog.x, y: frog.y }; say('Het blad zonk!'); frog.pad = null; }
          }
        }
      }
      const ty = frog.y - H * 0.66;
      cam += (ty - cam) * Math.min(1, dt * 4);
      pads = pads.filter((p) => p.y < cam + H + 150 || p === frog.pad);
    };

    const sy = (y) => y - cam;
    const drawPad = (p) => {
      const y = sy(p.y);
      if (y < -60 || y > H + 60) return;
      let k = 1;
      if (p.sink !== null && p.sink0) k = 0.55 + 0.45 * Math.max(0, p.sink / p.sink0);
      const r = p.r * k;
      g.fillStyle = 'rgba(0,40,40,0.25)'; g.beginPath(); g.ellipse(p.x + 3, y + 5, r, r * 0.85, 0, 0, 7); g.fill();
      g.fillStyle = p.sink !== null && p.sink0 && p.sink < 1 ? '#c99a3c' : '#3fae4e';
      g.beginPath(); g.moveTo(p.x, y); g.arc(p.x, y, r, p.rot + 0.35, p.rot + Math.PI * 2 - 0.35); g.closePath(); g.fill();
      g.strokeStyle = '#2c8a3a'; g.lineWidth = 2; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.18)';
      g.beginPath(); g.arc(p.x, y, r * 0.55, p.rot + 0.5, p.rot + 5.5); g.stroke();
      if (p.i > 0 && p.i % 4 === 0) { g.font = Math.round(r * 0.5) + 'px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🌸', p.x + r * 0.2, y - r * 0.1); }
      if (p.fly) { g.font = '20px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🪰', p.x + Math.sin(t * 5) * 6, y - r - 8 + Math.cos(t * 7) * 4); }
    };

    const draw = () => {
      const bg = g.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#1d6f78'); bg.addColorStop(1, '#2fa0a0');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const yy = (((i * 97 - cam * 0.6) % (H + 40)) + H + 40) % (H + 40) - 20;
        const xx = (i * 151) % W;
        g.beginPath(); g.ellipse(xx, yy, 26 + Math.sin(t + i) * 4, 8, 0, 0, 7); g.stroke();
      }
      for (const p of pads) drawPad(p);
      // richtlijn
      const v = vec();
      if (v && v[2] > 10) {
        const fx = frog.x, fyy = sy(frog.y);
        const tx = fx + v[0], ty = fyy + v[1];
        g.setLineDash([6, 6]); g.strokeStyle = '#fff'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(fx, fyy); g.lineTo(tx, ty); g.stroke(); g.setLineDash([]);
        g.beginPath(); g.arc(tx, ty, 12, 0, 7); g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.25)'; g.fill();
        g.fillStyle = '#fff'; g.fillRect(W - 24, H - 20 - 120 * v[2] / MAXJ, 10, 120 * v[2] / MAXJ);
        g.strokeRect(W - 24, H - 140, 10, 120);
      }
      // kikker
      if (!splash) {
        let fx = frog.x, fyy = sy(frog.y), lift = 0, sc = 1;
        if (jump) { const p = Math.min(1, jump.p); lift = Math.sin(p * Math.PI) * (45 + jump.len * 0.25); sc = 1 + Math.sin(p * Math.PI) * 0.35;
          g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(fx, fyy + 6, 14, 6, 0, 0, 7); g.fill(); }
        const squash = drag ? 1 - 0.18 * Math.min(1, (vec() || [0, 0, 0])[2] / MAXJ) : 1;
        g.save(); g.translate(fx, fyy - lift - 4); g.scale(sc / squash * 0.95 + 0.05, sc * squash);
        g.font = '40px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🐸', 0, 0); g.restore();
      } else {
        const s = splash, y = sy(s.y);
        g.strokeStyle = '#fff'; g.lineWidth = 3;
        for (let k = 0; k < 3; k++) { g.globalAlpha = Math.max(0, 1 - s.t - k * 0.2); g.beginPath(); g.ellipse(s.x, y, 10 + s.t * 50 + k * 10, 5 + s.t * 25 + k * 5, 0, 0, 7); g.stroke(); }
        g.globalAlpha = 1;
      }
      g.fillStyle = '#fff'; g.font = 'bold 18px sans-serif'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      g.fillText('Bladeren: ' + hops + '   🪰 ' + flies, 14, 26);
      if (msgT > 0) { g.textAlign = 'center'; g.fillStyle = '#ffe66b'; g.font = 'bold 22px sans-serif'; g.fillText(msg, W / 2, 60); }
      if (hops === 0) { g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,0.85)'; g.font = '14px sans-serif'; g.fillText('Trek achteruit en laat los om te springen', W / 2, H - 24); }
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
        c.remove();
      },
    };
  },
};
