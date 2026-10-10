export default {
  id: 'tweeduizend48', name: '2048', emoji: '🔶', hint: 'Veeg of gebruik pijltjes: gelijke tegels smelten samen', save: 'day',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#faf8ef'; host.style.fontFamily = 'system-ui,sans-serif';
    host.style.display = 'flex'; host.style.flexDirection = 'column'; host.style.alignItems = 'center'; host.style.justifyContent = 'center'; host.style.gap = '14px';
    const mk = (tag, css, txt) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; };
    const st = mk('style', '', '@keyframes t48pop{0%{transform:scale(.3)}100%{transform:scale(1)}}@keyframes t48mrg{0%{transform:scale(1.25)}100%{transform:scale(1)}}');
    host.appendChild(st);
    let dead = false, ended = false, ready = false, finished = false, won = false;
    let b = new Array(16).fill(0), score = 0, newIdx = -1, mergedIdx = {};
    const timers = [];
    const later = (fn, ms) => { const id = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(id); };

    const head = mk('div', 'font-size:22px;font-weight:800;color:#776e65;text-align:center;min-height:60px');
    const size = Math.floor(Math.min(api.w - 24, api.h - 170)), gap = 8, cs = Math.floor((size - gap * 5) / 4);
    const board = mk('div', 'position:relative;width:' + size + 'px;height:' + size + 'px;background:#bbada0;border-radius:12px;display:grid;grid-template-columns:repeat(4,' + cs + 'px);grid-template-rows:repeat(4,' + cs + 'px);gap:' + gap + 'px;padding:' + gap + 'px;box-sizing:border-box');
    const tiles = [];
    for (let i = 0; i < 16; i++) { const d = mk('div', 'border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800'); board.appendChild(d); tiles.push(d); }
    const btn = mk('button', 'padding:10px 18px;border-radius:10px;border:0;background:#8f7a66;color:#fff;font-weight:700;font-size:15px;cursor:pointer', 'Nieuw spel');
    host.appendChild(head); host.appendChild(board); host.appendChild(btn);
    const COL = { 0: ['#cdc1b4', '#776e65'], 2: ['#eee4da', '#776e65'], 4: ['#ede0c8', '#776e65'], 8: ['#f2b179', '#fff'], 16: ['#f59563', '#fff'], 32: ['#f67c5f', '#fff'], 64: ['#f65e3b', '#fff'], 128: ['#edcf72', '#fff'], 256: ['#edcc61', '#fff'], 512: ['#edc850', '#fff'], 1024: ['#edc53f', '#fff'], 2048: ['#edc22e', '#fff'] };

    function render() {
      head.textContent = 'Score ' + score;
      for (let i = 0; i < 16; i++) {
        const v = b[i], t = tiles[i], c = COL[v] || ['#3c3a32', '#fff'];
        t.textContent = v ? String(v) : '';
        t.style.background = c[0]; t.style.color = c[1];
        const len = String(v).length;
        t.style.fontSize = Math.floor(cs * (len <= 2 ? 0.5 : len === 3 ? 0.4 : len === 4 ? 0.32 : 0.26)) + 'px';
        t.style.animation = i === newIdx ? 't48pop .15s' : (mergedIdx[i] ? 't48mrg .15s' : 'none');
      }
    }
    function slide(line) {
      const a = line.filter(x => x); const out = []; let gain = 0; const mg = [];
      for (let i = 0; i < a.length; i++) {
        if (i + 1 < a.length && a[i] === a[i + 1]) { out.push(a[i] * 2); gain += a[i] * 2; mg.push(out.length - 1); i++; }
        else out.push(a[i]);
      }
      while (out.length < 4) out.push(0);
      return { out, gain, mg };
    }
    // dir: 0 links, 1 rechts, 2 omhoog, 3 omlaag
    function move(dir) {
      if (!ready || ended) return;
      let moved = false, gainTotal = 0; const nb = b.slice(); mergedIdx = {};
      for (let k = 0; k < 4; k++) {
        const idx = [];
        for (let j = 0; j < 4; j++) {
          if (dir === 0) idx.push(k * 4 + j); else if (dir === 1) idx.push(k * 4 + 3 - j);
          else if (dir === 2) idx.push(j * 4 + k); else idx.push((3 - j) * 4 + k);
        }
        const r = slide(idx.map(i => b[i]));
        idx.forEach((i, j) => { if (nb[i] !== r.out[j]) moved = true; nb[i] = r.out[j]; });
        r.mg.forEach(j => { mergedIdx[idx[j]] = true; });
        gainTotal += r.gain;
      }
      if (!moved) return;
      b = nb; score += gainTotal;
      const empty = []; b.forEach((v, i) => { if (!v) empty.push(i); });
      newIdx = empty[Math.floor(Math.random() * empty.length)];
      b[newIdx] = Math.random() < 0.9 ? 2 : 4;
      api.score(score); render();
      if (!won && b.includes(2048)) { won = true; head.textContent = '2048 bereikt! 🎉 Ga maar door - Score ' + score; }
      if (!canMove()) {
        ended = true; api.clear(); head.textContent = 'Geen zetten meer! Score ' + score;
        later(() => { if (!finished) { finished = true; api.end(score); } }, 900);
        return;
      }
      persist();
    }
    function canMove() {
      for (let i = 0; i < 16; i++) {
        if (!b[i]) return true;
        if ((i & 3) < 3 && b[i] === b[i + 1]) return true;
        if (i < 12 && b[i] === b[i + 4]) return true;
      }
      return false;
    }
    function persist() { if (!ready || ended) return; api.save({ b: b.join(','), s: score }); }
    function fresh() {
      b = new Array(16).fill(0); score = 0; won = false; mergedIdx = {};
      for (let k = 0; k < 2; k++) { const e = []; b.forEach((v, i) => { if (!v) e.push(i); }); b[e[Math.floor(Math.random() * e.length)]] = Math.random() < 0.9 ? 2 : 4; }
      newIdx = -1; api.score(0); render(); persist();
    }
    btn.addEventListener('click', () => { if (!ready || ended) return; fresh(); });

    const onKey = (e) => {
      const m = { ArrowLeft: 0, ArrowRight: 1, ArrowUp: 2, ArrowDown: 3, a: 0, d: 1, w: 2, s: 3 }[e.key];
      if (m === undefined) return;
      e.preventDefault(); move(m);
    };
    window.addEventListener('keydown', onKey);
    let sx = 0, sy = 0, tracking = false;
    const onDown = (e) => { sx = e.clientX; sy = e.clientY; tracking = true; };
    const onUp = (e) => {
      if (!tracking) return; tracking = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 0 : 1); else move(dy < 0 ? 2 : 3);
    };
    host.addEventListener('pointerdown', onDown); host.addEventListener('pointerup', onUp);

    function start(sv) {
      if (dead) return;
      if (sv && typeof sv.b === 'string') {
        const a = sv.b.split(',').map(Number);
        if (a.length === 16 && a.every(x => x >= 0 && (x === 0 || (x & (x - 1)) === 0))) {
          b = a; score = sv.s | 0; won = b.includes(2048); ready = true; api.score(score); render();
          if (!canMove()) { ready = true; fresh(); }
          return;
        }
      }
      ready = true; fresh();
    }
    Promise.resolve().then(() => api.load()).then(start, () => start(null));

    return {
      destroy() {
        dead = true; timers.forEach(clearTimeout);
        window.removeEventListener('keydown', onKey); host.removeEventListener('pointerdown', onDown); host.removeEventListener('pointerup', onUp);
        persist();
      },
    };
  },
};
