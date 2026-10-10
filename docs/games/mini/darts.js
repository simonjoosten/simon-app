export default {
  id: 'darts', name: 'Darts', emoji: '🎯', hint: 'Sleep het kruisje over het bord en laat los om te gooien',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#1a1f2b';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
    cv.width = W * dpr; cv.height = H * dpr; host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const NUM = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
    const BX = W / 2, BY = Math.max(190, H * 0.36), BR = Math.min(W * 0.4, 150), K = BR / 170;
    let dead = false, ended = false, raf = 0, last = 0, time = 0;
    let remaining = 301, turnStart = 301, round = 1, dartNo = 0;
    const darts = []; // op bord in huidige beurt
    const throwsLog = [];
    let aim = null; // {fx,fy,t}
    let flying = null, msg = '', msgT = 0, wait = 0, over = false;

    function T(s, x, y, size, col, al) { ctx.font = '700 ' + size + 'px system-ui,sans-serif'; ctx.textAlign = al || 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(s, x, y); }

    function hitInfo(x, y) {
      const dx = x - BX, dy = y - BY, r = Math.hypot(dx, dy) / K;
      if (r > 170) return { pts: 0, mult: 0, label: 'Mis' };
      if (r < 6.35) return { pts: 50, mult: 2, label: 'Bull 50' };
      if (r < 15.9) return { pts: 25, mult: 1, label: '25' };
      let ang = Math.atan2(dx, -dy); if (ang < 0) ang += Math.PI * 2;
      const idx = Math.floor(((ang + Math.PI / 20) % (Math.PI * 2)) / (Math.PI / 10));
      const n = NUM[idx];
      if (r >= 99 && r <= 107) return { pts: n * 3, mult: 3, label: 'T' + n };
      if (r >= 162) return { pts: n * 2, mult: 2, label: 'D' + n };
      return { pts: n, mult: 1, label: '' + n };
    }

    function scoreNow() {
      // levend scoreboard
      if (remaining === 0) return 301 + (11 - round) * 20;
      return 301 - remaining;
    }

    function endGame(win) {
      if (ended) return; ended = true; over = true;
      const sc = win ? 301 + (11 - round) * 20 : 301 - remaining;
      api.score(sc);
      msg = win ? 'UITGEGOOID!' : 'Einde: nog ' + remaining; msgT = 99;
      setTimeout(() => { if (!dead) api.end(sc); }, 1500);
    }

    function throwDart(x, y) {
      flying = { tx: x, ty: y, t: 0 };
    }
    function land(x, y) {
      const h = hitInfo(x, y);
      darts.push({ x, y, label: h.label, pts: h.pts });
      dartNo++;
      const before = remaining;
      const after = remaining - h.pts;
      let bust = false;
      if (after < 0 || after === 1 || (after === 0 && h.mult !== 2)) bust = true;
      if (bust) {
        remaining = turnStart; msg = 'BUST!'; msgT = 1.4; wait = 1.4;
        dartNo = 3;
      } else {
        remaining = after;
        msg = h.pts ? (h.label + ' = ' + h.pts) : 'Mis'; msgT = 0.9;
        if (after === 0) { api.score(scoreNow()); endGame(true); return; }
      }
      api.score(Math.max(0, 301 - remaining));
      if (dartNo >= 3) { wait = Math.max(wait, 1.1); }
      void before;
    }

    function nextTurn() {
      darts.length = 0; dartNo = 0; turnStart = remaining; round++;
      if (round > 10) { endGame(false); }
    }

    const pos = e => { const b = host.getBoundingClientRect(); return { x: (e.clientX - b.left) * W / b.width, y: (e.clientY - b.top) * H / b.height }; };
    const pd = e => {
      if (over || flying || wait > 0) return;
      const p = pos(e); aim = { fx: p.x, fy: p.y, t: 0 };
      try { host.setPointerCapture(e.pointerId); } catch (_) {}
    };
    const pm = e => { if (aim) { const p = pos(e); aim.fx = p.x; aim.fy = p.y; } };
    const cross = () => {
      const wob = 3 + Math.min(10, Math.max(0, aim.t - 1.2) * 3);
      return {
        x: aim.fx + Math.sin(time * 5.1) * wob + Math.sin(time * 2.3) * wob * 0.6,
        y: aim.fy - 64 + Math.cos(time * 4.3) * wob + Math.sin(time * 1.9) * wob * 0.6,
      };
    };
    const pu = () => {
      if (!aim) return;
      const c = cross(); aim = null;
      if (over || flying || wait > 0) return;
      throwDart(c.x + (Math.random() - 0.5) * 3, c.y + (Math.random() - 0.5) * 3);
    };
    const pc = () => { aim = null; };
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm);
    host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pc);

    function update(dt) {
      time += dt;
      if (aim) aim.t += dt;
      if (msgT > 0 && msgT < 90) msgT -= dt;
      if (flying) {
        flying.t += dt;
        if (flying.t >= 0.22) { const f = flying; flying = null; land(f.tx, f.ty); }
      } else if (wait > 0 || (dartNo >= 3 && !over)) {
        if (wait <= 0) wait = 0.8;
        wait -= dt;
        if (wait <= 0 && !over) nextTurn();
      }
    }

    function wedge(r0, r1, a0, a1, col) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(BX, BY, r1 * K, a0, a1); ctx.arc(BX, BY, r0 * K, a1, a0, true); ctx.closePath(); ctx.fill();
    }
    function drawBoard() {
      ctx.fillStyle = '#0d0d10'; ctx.beginPath(); ctx.arc(BX, BY, BR + 26, 0, 7); ctx.fill();
      ctx.fillStyle = '#3e2723'; ctx.beginPath(); ctx.arc(BX, BY, BR + 26, 0, 7); ctx.lineWidth = 3; ctx.strokeStyle = '#6d4c41'; ctx.stroke();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(BX, BY, BR + 24, 0, 7); ctx.fill();
      for (let i = 0; i < 20; i++) {
        const a0 = -Math.PI / 2 + i * Math.PI / 10 - Math.PI / 20, a1 = a0 + Math.PI / 10;
        const even = i % 2 === 0;
        const single = even ? '#14110f' : '#f2e6c4', ring = even ? '#c62828' : '#2e7d32';
        wedge(15.9, 99, a0, a1, single); wedge(99, 107, a0, a1, ring);
        wedge(107, 162, a0, a1, single); wedge(162, 170, a0, a1, ring);
        const am = (a0 + a1) / 2;
        ctx.save(); ctx.translate(BX + Math.cos(am) * (BR + 13), BY + Math.sin(am) * (BR + 13));
        T('' + NUM[i], 0, 0, 14, '#f5f5f5'); ctx.restore();
      }
      ctx.fillStyle = '#2e7d32'; ctx.beginPath(); ctx.arc(BX, BY, 15.9 * K, 0, 7); ctx.fill();
      ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.arc(BX, BY, 6.35 * K, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(200,200,200,0.45)'; ctx.lineWidth = 1;
      for (let i = 0; i < 20; i++) { const a = -Math.PI / 2 + i * Math.PI / 10 - Math.PI / 20; ctx.beginPath(); ctx.moveTo(BX + Math.cos(a) * 15.9 * K, BY + Math.sin(a) * 15.9 * K); ctx.lineTo(BX + Math.cos(a) * 170 * K, BY + Math.sin(a) * 170 * K); ctx.stroke(); }
      for (const r of [6.35, 15.9, 99, 107, 162, 170]) { ctx.beginPath(); ctx.arc(BX, BY, r * K, 0, 7); ctx.stroke(); }
    }
    function dart(x, y, s) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(6, 20); ctx.stroke();
      ctx.strokeStyle = '#e53935'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(6, 20); ctx.lineTo(10, 30); ctx.stroke();
      ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); ctx.moveTo(9, 26); ctx.lineTo(17, 38); ctx.lineTo(8, 34); ctx.lineTo(3, 38); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, 7); ctx.fill();
      ctx.restore();
    }

    function draw() {
      ctx.fillStyle = '#1a1f2b'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let i = 0; i < 16; i++) ctx.fillRect(i * W / 16, 0, 2, H);
      drawBoard();
      for (const d of darts) dart(d.x, d.y, 0.8);
      if (flying) {
        const k = flying.t / 0.22, s = 2.2 - 1.4 * k;
        dart(flying.tx + (1 - k) * 8, flying.ty + (1 - k) * 80, s);
      }
      // kruisje
      if (aim && !flying) {
        const c = cross();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(aim.fx, aim.fy); ctx.lineTo(c.x, c.y + 8); ctx.stroke();
        ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(c.x, c.y, 11, 0, 7); ctx.moveTo(c.x - 17, c.y); ctx.lineTo(c.x - 5, c.y); ctx.moveTo(c.x + 5, c.y); ctx.lineTo(c.x + 17, c.y);
        ctx.moveTo(c.x, c.y - 17); ctx.lineTo(c.x, c.y - 5); ctx.moveTo(c.x, c.y + 5); ctx.lineTo(c.x, c.y + 17); ctx.stroke();
      }
      // paneel
      const py = BY + BR + 44;
      ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(14, py, W - 28, Math.min(H - py - 12, 170));
      T('' + remaining, W / 2, py + 44, 56, remaining <= 170 ? '#ffeb3b' : '#fff');
      T('nog te gooien', W / 2, py + 82, 13, 'rgba(255,255,255,0.7)');
      T('Ronde ' + Math.min(round, 10) + ' / 10', 70, py + 20, 14, '#fff');
      for (let i = 0; i < 3; i++) {
        const x = W - 80 + i * 22;
        if (i < 3 - dartNo) dart(x, py + 8, 0.45);
      }
      for (let i = 0; i < 3; i++) {
        const d = darts[i];
        T(d ? (d.label || 'Mis') : '-', W / 2 - 60 + i * 60, py + 112, 18, d ? '#80deea' : 'rgba(255,255,255,0.3)');
      }
      T(aim ? 'Laat los om te gooien' : 'Houd vast en sleep, laat los = gooi', W / 2, py + 142, 13, 'rgba(255,255,255,0.75)');
      T('Uitgooien moet met een dubbel', W / 2, 18, 13, 'rgba(255,255,255,0.6)');
      if (msgT > 0) {
        const s = msg === 'BUST!' || over ? 40 : 28;
        T(msg, W / 2, BY, s, msg === 'BUST!' ? '#ff5252' : '#ffeb3b');
        ctx.strokeStyle = 'rgba(0,0,0,0)';
      }
    }

    function frame(t) {
      if (dead) return;
      const dt = Math.min(0.033, (t - last) / 1000 || 0.016); last = t;
      update(dt); draw();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    void throwsLog;

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
