export default {
  id: 'penalty', name: 'Penalty', emoji: '⚽', hint: 'Veeg omhoog naar het doel: richting en snelheid bepalen je schot',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#2e7d32';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let dead = false, ended = false, raf = 0, last = 0, time = 0;
    const gl = W * 0.14, gr = W * 0.86, gt = H * 0.2, gb = H * 0.4, cx = W / 2;
    const bx = W / 2, by = H * 0.82;

    let round = 1, pg = 0, cg = 0, sudden = false;
    const hist = []; // {p:'g'|'m', c:'g'|'m'}
    let phase = 'aim', pt = 0, msg = '', msgCol = '#fff', cpuMsg = '';
    let shot = null, keeper = { x: cx, y: gb - 35, tx: cx, ty: gb - 35, dive: 0 };
    let cur = null; // huidig record
    let down = null, swipeHint = 0;

    function skill() { return Math.min(0.85, 0.22 + 0.11 * (round - 1)); }
    function reach() { return Math.min(105, 66 + round * 5); }

    function startAim() {
      phase = 'aim'; shot = null; msg = ''; pt = 0;
      keeper = { x: cx, y: gb - 35, tx: cx, ty: gb - 35, dive: 0 };
      cur = { p: null, c: null };
    }
    startAim();

    function launch(tx, ty) {
      const out = tx < gl - 6 || tx > gr + 6 || ty < gt - 4;
      const post = !out && (Math.abs(tx - gl) < 7 || Math.abs(tx - gr) < 7 || Math.abs(ty - gt) < 6);
      // keeper beslist
      let kx, ky;
      if (Math.random() < skill()) {
        const rc = reach();
        kx = Math.max(cx - rc, Math.min(cx + rc, tx));
        ky = Math.max(gt + 18, Math.min(gb - 18, ty));
      } else {
        kx = cx + (Math.random() < 0.5 ? -1 : 1) * (20 + Math.random() * reach());
        ky = gb - 20 - Math.random() * 70;
      }
      keeper.tx = kx; keeper.ty = ky;
      let res = 'goal';
      if (tx < gl - 6 || tx > gr + 6) res = 'wide';
      else if (ty < gt - 6) res = 'over';
      else if (post) res = 'post';
      else if (Math.hypot(tx - kx, (ty - ky) * 0.9) < 44) res = 'save';
      shot = { sx: bx, sy: by, tx: Math.max(-40, Math.min(W + 40, tx)), ty: Math.max(gt - 80, ty), res, t: 0 };
      phase = 'shot'; pt = 0;
    }

    function resolve() {
      const r = shot.res;
      if (r === 'goal') { pg++; msg = 'GOAL!'; msgCol = '#ffeb3b'; cur.p = 'g'; }
      else { cur.p = 'm'; msgCol = '#ff8a80'; msg = r === 'save' ? 'GEKEEPT!' : r === 'wide' ? 'NAAST!' : r === 'over' ? 'OVER!' : 'PAAL!'; }
      api.score(pg * 10);
      phase = 'result'; pt = 0;
    }

    function cpuTurn() {
      phase = 'cpu'; pt = 0;
      const sc = Math.random() < (0.62 + Math.min(0.15, round * 0.02));
      if (sc) { cg++; cur.c = 'g'; cpuMsg = 'Computer scoort'; } else { cur.c = 'm'; cpuMsg = Math.random() < 0.5 ? 'Computer mist!' : 'Computer geraakt, maar jij houdt hem!'; }
    }

    function afterRound() {
      hist.push(cur);
      if (round >= 5 && pg !== cg) { finish(); return; }
      if (round >= 5) sudden = true;
      if (round >= 5 && hist.length > 12) { finish(); return; }
      round++; startAim();
    }
    function finish() {
      if (ended) return; ended = true; phase = 'done';
      const win = pg > cg;
      msg = win ? 'Gewonnen!' : pg === cg ? 'Gelijk!' : 'Verloren'; msgCol = win ? '#ffeb3b' : '#fff';
      const sc = pg * 10 + (win ? 20 : 0);
      api.score(sc);
      setTimeout(() => { if (!dead) api.end(sc); }, 1300);
    }

    const pos = e => { const b = host.getBoundingClientRect(); return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height }; };
    const pd = e => {
      if (phase !== 'aim') return;
      const p = pos(e); down = { x: p.x, y: p.y, t: performance.now(), cx: p.x, cy: p.y };
      try { host.setPointerCapture(e.pointerId); } catch (_) {}
    };
    const pm = e => { if (down) { const p = pos(e); down.cx = p.x; down.cy = p.y; } };
    const pu = e => {
      if (!down) return;
      const p = pos(e), d = down; down = null;
      if (phase !== 'aim') return;
      const dx = p.x - d.x, dy = p.y - d.y, dist = Math.hypot(dx, dy);
      const dur = Math.max(0.05, (performance.now() - d.t) / 1000);
      if (dy > -30 || dist < 35) { swipeHint = 1.2; return; }
      const dir = dx / -dy;
      const dd = by - (gt + gb) / 2;
      let tx = bx + Math.max(-1.6, Math.min(1.6, dir)) * dd + (Math.random() - 0.5) * 12;
      const v = dist / dur;
      const h = Math.max(0.04, Math.min(1.4, (v - 450) / 1500)) + (Math.random() - 0.5) * 0.06;
      const ty = gb - h * (gb - gt);
      launch(tx, ty);
    };
    const pc = () => { down = null; };
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm);
    host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pc);

    function update(dt) {
      time += dt; pt += dt;
      if (swipeHint > 0) swipeHint -= dt;
      if (phase === 'shot') {
        shot.t += dt;
        const k = Math.min(1, shot.t / 0.55);
        // keeper duikt
        const kk = Math.min(1, shot.t / 0.5);
        keeper.x = cx + (keeper.tx - cx) * kk; keeper.y = (gb - 35) + (keeper.ty - (gb - 35)) * kk;
        keeper.dive = (keeper.tx - cx) / 100 * kk;
        if (k >= 1) resolve();
      } else if (phase === 'result') {
        if (pt > 1.0) cpuTurn();
      } else if (phase === 'cpu') {
        if (pt > 1.5) afterRound();
      }
    }

    function ball(x, y, r) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.9, r, r * 0.35, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.strokeStyle = '#222'; ctx.lineWidth = Math.max(1, r * 0.1); ctx.stroke();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(x, y, r * 0.38, 0, 7); ctx.fill();
      for (let i = 0; i < 5; i++) { const a = i * 1.2566 + 0.3; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, r * 0.18, 0, 7); ctx.fill(); }
    }
    function T(s, x, y, size, col, al) { ctx.font = '700 ' + size + 'px system-ui,sans-serif'; ctx.textAlign = al || 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(s, x, y); }

    function draw() {
      // gras strepen
      for (let i = 0; i < 14; i++) { ctx.fillStyle = i % 2 ? '#2e7d32' : '#388e3c'; ctx.fillRect(0, i * H / 14, W, H / 14 + 1); }
      // doel
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(gl, gt, gr - gl, gb - gt);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
      for (let x = gl; x <= gr; x += 14) { ctx.beginPath(); ctx.moveTo(x, gt); ctx.lineTo(x, gb); ctx.stroke(); }
      for (let y = gt; y <= gb; y += 14) { ctx.beginPath(); ctx.moveTo(gl, y); ctx.lineTo(gr, y); ctx.stroke(); }
      // strafschopgebied
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, gb); ctx.lineTo(W, gb); ctx.stroke();
      ctx.beginPath(); ctx.arc(bx, by, 4, 0, 7); ctx.stroke();
      // keeper
      ctx.save(); ctx.translate(keeper.x, keeper.y); ctx.rotate(keeper.dive);
      ctx.fillStyle = '#ffb300'; ctx.fillRect(-13, -4, 26, 34);
      ctx.fillStyle = '#f5cba7'; ctx.beginPath(); ctx.arc(0, -14, 11, 0, 7); ctx.fill();
      ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(0, -17, 11, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#ffb300'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      const up = Math.min(1, Math.abs(keeper.dive) * 1.5);
      ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-30 - up * 4, 10 - up * 26); ctx.moveTo(12, 0); ctx.lineTo(30 + up * 4, 10 - up * 26); ctx.stroke();
      ctx.fillStyle = '#ff5252'; ctx.beginPath(); ctx.arc(-30 - up * 4, 10 - up * 26, 7, 0, 7); ctx.arc(30 + up * 4, 10 - up * 26, 7, 0, 7); ctx.fill();
      ctx.fillStyle = '#1565c0'; ctx.fillRect(-12, 30, 10, 14); ctx.fillRect(2, 30, 10, 14);
      ctx.restore();
      // palen
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.lineCap = 'square';
      ctx.beginPath(); ctx.moveTo(gl, gb); ctx.lineTo(gl, gt); ctx.lineTo(gr, gt); ctx.lineTo(gr, gb); ctx.stroke();
      // bal
      if (phase === 'shot' && shot) {
        const k = Math.min(1, shot.t / 0.55), e = 1 - (1 - k) * (1 - k);
        const x = shot.sx + (shot.tx - shot.sx) * e, y = shot.sy + (shot.ty - shot.sy) * e - Math.sin(k * Math.PI) * 14;
        ball(x, y, 15 - 9 * e);
      } else if (phase === 'aim') {
        ball(bx, by, 15);
        if (down) {
          ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]);
          ctx.beginPath(); ctx.moveTo(down.x, down.y); ctx.lineTo(down.cx, down.cy); ctx.stroke(); ctx.setLineDash([]);
        }
      } else if (shot) {
        const r = shot.res;
        if (r === 'goal' || r === 'save' || r === 'post') ball(Math.max(8, Math.min(W - 8, shot.tx)), Math.min(gb + 6, shot.ty), 6);
      }
      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, 54);
      T('Jij ' + pg + ' - ' + cg + ' Computer', cx, 16, 18, '#fff');
      const n = Math.max(5, hist.length + (phase === 'done' ? 0 : 1));
      const sx0 = cx - (n - 1) * 11;
      for (let i = 0; i < n; i++) {
        const rec = i < hist.length ? hist[i] : (i === hist.length ? cur : null);
        const x = sx0 + i * 22;
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(x, 38, 6, 0, 7); ctx.fill();
        if (rec && rec.p) { ctx.fillStyle = rec.p === 'g' ? '#66bb6a' : '#ef5350'; ctx.beginPath(); ctx.arc(x, 35, 4, 0, 7); ctx.fill(); }
        if (rec && rec.c) { ctx.fillStyle = rec.c === 'g' ? '#66bb6a' : '#ef5350'; ctx.beginPath(); ctx.arc(x, 43, 3, 0, 7); ctx.fill(); }
      }
      // teksten
      if (phase === 'aim') {
        T(sudden ? 'Sudden death!' : 'Ronde ' + round + ' van 5', cx, H * 0.58, 18, '#fff');
        T(swipeHint > 0 ? 'Veeg omhoog, richting het doel!' : 'Veeg vanaf de bal omhoog. Snel = hoog.', cx, H * 0.93, 15, swipeHint > 0 ? '#ffeb3b' : 'rgba(255,255,255,0.9)');
      }
      if (phase === 'result' || phase === 'done') {
        const s = 1 + Math.max(0, 0.3 - pt) * 2;
        T(msg, cx, H * 0.55, 46 * s, msgCol);
      }
      if (phase === 'cpu') {
        T(cpuMsg, cx, H * 0.6, 22, cur.c === 'g' ? '#ff8a80' : '#b9f6ca');
        T('Computer neemt zijn strafschop...', cx, H * 0.67, 14, 'rgba(255,255,255,0.8)');
      }
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
