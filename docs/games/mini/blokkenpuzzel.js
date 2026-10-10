export default {
  id: 'blokkenpuzzel', name: 'Blokkenpuzzel', emoji: '🧩', hint: 'Sleep stukken in het raster. Volle lijnen verdwijnen',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#1a1f33'; host.style.fontFamily = 'system-ui,sans-serif';
    const W = api.w, H = api.h, dpr = Math.min(2, window.devicePixelRatio || 1);
    const cv = document.createElement('canvas');
    cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
    cv.style.cssText = 'width:' + W + 'px;height:' + H + 'px;display:block;touch-action:none';
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    const N = 8;
    const gs = Math.min(W - 16, H * 0.56), cell = Math.floor(gs / N), gx = Math.floor((W - cell * N) / 2), gy = 64;
    const trayY = gy + cell * N + 18, trayH = H - trayY - 8;
    const COLORS = ['#ef5350', '#42a5f5', '#66bb6a', '#ffca28', '#ab47bc', '#ff7043', '#26c6da'];
    // vormen
    const SH = [];
    const add = (cells) => SH.push(cells);
    const rect = (w, h) => { const c = []; for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) c.push([r, q]); return c; };
    add(rect(1, 1)); add(rect(2, 1)); add(rect(1, 2)); add(rect(3, 1)); add(rect(1, 3)); add(rect(4, 1)); add(rect(1, 4)); add(rect(5, 1)); add(rect(1, 5));
    add(rect(2, 2)); add(rect(3, 3)); add(rect(2, 3)); add(rect(3, 2));
    const L3 = [[0, 0], [1, 0], [1, 1]];
    const L5 = [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]];
    const rot = (cells) => { const m = cells.map(([r, c]) => [c, -r]); const mr = Math.min(...m.map(x => x[0])), mc = Math.min(...m.map(x => x[1])); return m.map(([r, c]) => [r - mr, c - mc]); };
    for (const base of [L3, L5, [[0, 0], [0, 1], [0, 2], [1, 1]], [[0, 0], [0, 1], [1, 1], [1, 2]], [[0, 1], [0, 2], [1, 0], [1, 1]], [[0, 0], [1, 0], [2, 0], [2, 1]], [[0, 1], [1, 1], [2, 1], [2, 0]]]) {
      let c = base; for (let k = 0; k < (base === L3 || base === L5 ? 4 : 4); k++) { add(c); c = rot(c); }
    }
    let dead = false, ended = false;
    const timers = [];
    let grid = new Array(N * N).fill(0), score = 0, lines = 0, level = 1;
    let pieces = [null, null, null], drag = null, flash = [], over = false;
    const size = (p) => { let h = 0, w = 0; p.cells.forEach(([r, c]) => { h = Math.max(h, r + 1); w = Math.max(w, c + 1); }); return { w, h }; };

    function pick() {
      const ws = SH.map(s => {
        const n = s.length; let w = 3;
        if (n === 1) w = Math.max(0.5, 3 - level * 0.7);
        else if (n === 2) w = Math.max(1, 3.5 - level * 0.5);
        else if (n >= 5) w = 1.5 + level * 0.4;
        return w;
      });
      let t = ws.reduce((a, b) => a + b, 0) * Math.random(), i = 0;
      for (; i < ws.length; i++) { t -= ws[i]; if (t <= 0) break; }
      return { cells: SH[Math.min(i, SH.length - 1)], color: 1 + Math.floor(Math.random() * COLORS.length) };
    }
    function refill() { pieces = [pick(), pick(), pick()]; }
    function fits(p, r0, c0) {
      for (const [r, c] of p.cells) {
        const rr = r0 + r, cc = c0 + c;
        if (rr < 0 || cc < 0 || rr >= N || cc >= N || grid[rr * N + cc]) return false;
      }
      return true;
    }
    function anyFit(p) { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (fits(p, r, c)) return true; return false; }
    function place(p, r0, c0) {
      p.cells.forEach(([r, c]) => { grid[(r0 + r) * N + c0 + c] = p.color; });
      let gain = p.cells.length;
      const rows = [], cols = [];
      for (let r = 0; r < N; r++) { let f = true; for (let c = 0; c < N; c++) if (!grid[r * N + c]) f = false; if (f) rows.push(r); }
      for (let c = 0; c < N; c++) { let f = true; for (let r = 0; r < N; r++) if (!grid[r * N + c]) f = false; if (f) cols.push(c); }
      const k = rows.length + cols.length;
      if (k) {
        const idx = new Set();
        rows.forEach(r => { for (let c = 0; c < N; c++) idx.add(r * N + c); });
        cols.forEach(c => { for (let r = 0; r < N; r++) idx.add(r * N + c); });
        flash = [...idx].map(i => ({ i, col: grid[i] }));
        idx.forEach(i => { grid[i] = 0; });
        gain += k * 10 * k; lines += k;
        const t = setTimeout(() => { flash = []; draw(); }, 280); timers.push(t);
      }
      score += gain; level = 1 + Math.floor(score / 250);
      api.score(score);
    }
    function after() {
      if (pieces.every(p => !p)) refill();
      if (!pieces.some(p => p && anyFit(p))) {
        over = true; ended = true; draw();
        const t = setTimeout(() => { if (!dead) api.end(score); }, 900); timers.push(t);
      }
    }
    // tray posities
    const slotCx = (i) => (W / 3) * (i + 0.5), slotCy = () => trayY + trayH / 2;
    const tcell = () => Math.min(cell * 0.62, (W / 3 - 14) / 5, trayH / 5);
    function pieceRect(i) {
      const p = pieces[i]; if (!p) return null;
      const s = size(p), tc = tcell();
      return { x: slotCx(i) - s.w * tc / 2, y: slotCy() - s.h * tc / 2, w: s.w * tc, h: s.h * tc };
    }
    function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function block(x, y, s, col) {
      ctx.fillStyle = COLORS[col - 1]; roundRect(x + 1, y + 1, s - 2, s - 2, s * 0.2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.28)'; roundRect(x + 3, y + 3, s - 6, (s - 6) * 0.35, s * 0.12); ctx.fill();
    }
    function dragTarget() {
      if (!drag) return null;
      const p = pieces[drag.i], s = size(p);
      const left = drag.x - s.w * cell / 2, top = drag.y - drag.lift - s.h * cell / 2;
      return { r: Math.round((top - gy) / cell), c: Math.round((left - gx) / cell), left, top };
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#1a1f33'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.font = '700 20px system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('Score ' + score, 14, 24);
      ctx.textAlign = 'right'; ctx.fillText('Level ' + level, W - 14, 24);
      ctx.textAlign = 'center'; ctx.font = '600 13px system-ui,sans-serif'; ctx.fillStyle = '#9aa7d1';
      ctx.fillText('Lijnen: ' + lines, W / 2, 46);
      ctx.fillStyle = '#262d4a'; roundRect(gx - 4, gy - 4, cell * N + 8, cell * N + 8, 10); ctx.fill();
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const v = grid[r * N + c];
        if (v) block(gx + c * cell, gy + r * cell, cell, v);
        else { ctx.fillStyle = (Math.floor(r / 4) + Math.floor(c / 4)) % 2 ? '#2d3558' : '#313a60'; roundRect(gx + c * cell + 1, gy + r * cell + 1, cell - 2, cell - 2, 5); ctx.fill(); }
      }
      flash.forEach(f => { const r = Math.floor(f.i / N), c = f.i % N; ctx.fillStyle = 'rgba(255,255,255,.75)'; roundRect(gx + c * cell + 1, gy + r * cell + 1, cell - 2, cell - 2, 5); ctx.fill(); });
      const tg = dragTarget();
      if (tg) {
        const p = pieces[drag.i], ok = fits(p, tg.r, tg.c);
        ctx.globalAlpha = 0.35; ctx.fillStyle = ok ? '#ffffff' : '#ff5252';
        p.cells.forEach(([r, c]) => {
          const rr = tg.r + r, cc = tg.c + c;
          if (rr >= 0 && cc >= 0 && rr < N && cc < N) { roundRect(gx + cc * cell + 1, gy + rr * cell + 1, cell - 2, cell - 2, 5); ctx.fill(); }
        });
        ctx.globalAlpha = 1;
      }
      for (let i = 0; i < 3; i++) {
        const p = pieces[i]; if (!p || (drag && drag.i === i)) continue;
        const rc = pieceRect(i), tc = tcell(), playable = anyFit(p);
        ctx.globalAlpha = playable ? 1 : 0.35;
        p.cells.forEach(([r, c]) => block(rc.x + c * tc, rc.y + r * tc, tc, p.color));
        ctx.globalAlpha = 1;
      }
      if (drag) {
        const p = pieces[drag.i], s = size(p), tg = dragTarget();
        p.cells.forEach(([r, c]) => block(tg.left + c * cell, tg.top + r * cell, cell, p.color));
      }
      if (over) {
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = '800 30px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Geen ruimte meer!', W / 2, H / 2);
      }
    }
    function pos(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; }
    const onDown = (e) => {
      if (ended) return;
      const p = pos(e);
      for (let i = 0; i < 3; i++) {
        const rc = pieceRect(i); if (!rc) continue;
        const pad = 14;
        if (p.x >= rc.x - pad && p.x <= rc.x + rc.w + pad && p.y >= rc.y - pad && p.y <= rc.y + rc.h + pad) {
          drag = { i, x: p.x, y: p.y, lift: cell * 2 + 10 };
          try { cv.setPointerCapture(e.pointerId); } catch (_) {}
          draw(); return;
        }
      }
    };
    const onMove = (e) => { if (!drag) return; const p = pos(e); drag.x = p.x; drag.y = p.y; draw(); };
    const onUp = () => {
      if (!drag) return;
      const tg = dragTarget(), p = pieces[drag.i];
      if (fits(p, tg.r, tg.c)) { place(p, tg.r, tg.c); pieces[drag.i] = null; drag = null; after(); }
      else drag = null;
      draw();
    };
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    refill(); api.score(0); draw();
    return {
      destroy() {
        dead = true; timers.forEach(clearTimeout);
        cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointermove', onMove);
        cv.removeEventListener('pointerup', onUp); cv.removeEventListener('pointercancel', onUp);
      },
    };
  },
};
