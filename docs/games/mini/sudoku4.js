export default {
  id: 'sudoku4', name: 'Sudoku 4x4', emoji: '🔢', hint: 'Vul 1-4 in: elke rij, kolom en vak één keer', save: 'day',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#101a2b'; host.style.fontFamily = 'system-ui,sans-serif'; host.style.color = '#fff';
    host.style.display = 'flex'; host.style.flexDirection = 'column'; host.style.alignItems = 'center'; host.style.justifyContent = 'center'; host.style.gap = '14px';
    const mk = (tag, css, txt) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; };
    const TOTAL = 15;
    let dead = false, ended = false, ready = false;
    const timers = [];
    const later = (fn, ms) => { const id = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(id); };
    let puz = [], sol = [], cur = [], n = 0, hearts = 3, score = 0, sel = -1, wrong = -1;

    function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    function solvedGrid() {
      const d = shuffle([1, 2, 3, 4]);
      const rows = shuffle([0, 1]).flatMap(b => shuffle([0, 1]).map(x => b * 2 + x));
      const cols = shuffle([0, 1]).flatMap(b => shuffle([0, 1]).map(x => b * 2 + x));
      const g = [];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) g.push(d[(2 * (rows[r] % 2) + Math.floor(rows[r] / 2) + cols[c]) % 4]);
      return g;
    }
    function canPut(g, i, v) {
      const r = i >> 2, c = i & 3;
      for (let k = 0; k < 4; k++) { if (g[r * 4 + k] === v || g[k * 4 + c] === v) return false; }
      const br = r & 2, bc = c & 2;
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) if (g[(br + a) * 4 + bc + b] === v) return false;
      return true;
    }
    function count(g, lim) {
      const i = g.indexOf(0); if (i < 0) return 1;
      let k = 0;
      for (let v = 1; v <= 4; v++) {
        if (canPut(g, i, v)) { g[i] = v; k += count(g, lim - k); g[i] = 0; if (k >= lim) return k; }
      }
      return k;
    }
    function makePuzzle(level) {
      const s = solvedGrid(); const p = s.slice();
      const goal = Math.max(4, 10 - Math.floor(level / 2));
      let given = 16;
      for (const i of shuffle([...Array(16).keys()])) {
        if (given <= goal) break;
        const old = p[i]; p[i] = 0;
        if (count(p.slice(), 2) !== 1) p[i] = old; else given--;
      }
      return { p, s };
    }
    function newPuzzle() {
      const q = makePuzzle(n); puz = q.p; sol = q.s; cur = q.p.slice(); sel = -1; wrong = -1;
    }

    const info = mk('div', 'font-size:18px;font-weight:700;text-align:center;min-height:50px;line-height:1.3');
    const size = Math.floor(Math.min(api.w - 32, api.h * 0.5) / 4) * 4, cs = size / 4;
    const grid = mk('div', 'display:grid;grid-template-columns:repeat(4,1fr);width:' + size + 'px;height:' + size + 'px;border:3px solid #8ab4ff;border-radius:8px;overflow:hidden;box-sizing:content-box');
    const cells = [];
    for (let i = 0; i < 16; i++) {
      const r = i >> 2, c = i & 3;
      const d = mk('div', 'display:flex;align-items:center;justify-content:center;font-size:' + Math.floor(cs * 0.55) + 'px;font-weight:700;box-sizing:border-box;border:1px solid #2c3e63;cursor:pointer;' +
        (c === 1 ? 'border-right:3px solid #8ab4ff;' : '') + (r === 1 ? 'border-bottom:3px solid #8ab4ff;' : ''));
      d.addEventListener('pointerdown', () => { if (!ready || ended) return; sel = i; render(); });
      grid.appendChild(d); cells.push(d);
    }
    const pad = mk('div', 'display:flex;gap:10px');
    const bsz = Math.floor(Math.min(64, (api.w - 32 - 40) / 5));
    for (let v = 1; v <= 5; v++) {
      const b = mk('button', 'width:' + bsz + 'px;height:' + bsz + 'px;border-radius:12px;border:0;background:' + (v === 5 ? '#b3402f' : '#2f6fdb') + ';color:#fff;font-size:' + Math.floor(bsz * 0.5) + 'px;font-weight:700;cursor:pointer', v === 5 ? '⌫' : String(v));
      b.addEventListener('click', () => put(v === 5 ? 0 : v));
      pad.appendChild(b);
    }
    host.appendChild(info); host.appendChild(grid); host.appendChild(pad);

    function render() {
      if (!ready) return;
      info.textContent = 'Puzzel ' + (n + 1) + '/' + TOTAL + '   ' + '❤️'.repeat(hearts) + '🖤'.repeat(3 - hearts) + '   Score ' + score;
      for (let i = 0; i < 16; i++) {
        const d = cells[i];
        d.textContent = cur[i] ? String(cur[i]) : '';
        d.style.color = puz[i] ? '#ffffff' : '#7fd1ff';
        let bg = '#16213a';
        if (sel >= 0) {
          if (i === sel) bg = '#2d4a85';
          else if ((i >> 2) === (sel >> 2) || (i & 3) === (sel & 3)) bg = '#1c2c4d';
        }
        if (i === wrong) bg = '#8a2b2b';
        d.style.background = bg;
      }
    }
    function persist() {
      if (!ready || ended) return;
      api.save({ p: puz.join(''), s: sol.join(''), c: cur.join(''), n, h: hearts, sc: score });
    }
    function put(v) {
      if (!ready || ended || sel < 0 || puz[sel]) return;
      if (v === 0) { cur[sel] = 0; render(); persist(); return; }
      if (v !== sol[sel]) {
        hearts--; wrong = sel; render();
        later(() => { wrong = -1; render(); }, 450);
        if (hearts <= 0) { later(finish, 600); ended = true; api.clear(); return; }
        persist(); return;
      }
      cur[sel] = v; render();
      if (cur.every(x => x)) {
        score += 100 + 10 * n; n++; api.score(score); render();
        if (n >= TOTAL) { ended = true; api.clear(); later(finish, 500); return; }
        info.textContent = 'Opgelost! 🎉';
        ready = false;
        later(() => { newPuzzle(); ready = true; render(); persist(); }, 700);
        return;
      }
      persist();
    }
    let finished = false;
    function finish() { if (finished) return; finished = true; api.end(score); }
    function onKey(e) {
      if (!ready || ended) return;
      const k = e.key;
      if (k >= '1' && k <= '4') put(+k);
      else if (k === 'Backspace' || k === 'Delete' || k === '0') put(0);
      else if (k.startsWith('Arrow')) {
        e.preventDefault();
        let s = sel < 0 ? 0 : sel;
        if (k === 'ArrowLeft' && (s & 3) > 0) s--; else if (k === 'ArrowRight' && (s & 3) < 3) s++;
        else if (k === 'ArrowUp' && s > 3) s -= 4; else if (k === 'ArrowDown' && s < 12) s += 4;
        sel = s; render();
      }
    }
    window.addEventListener('keydown', onKey);

    function start(sv) {
      if (dead) return;
      let ok = false;
      if (sv && typeof sv.p === 'string' && sv.p.length === 16 && sv.s.length === 16 && sv.c.length === 16) {
        puz = sv.p.split('').map(Number); sol = sv.s.split('').map(Number); cur = sv.c.split('').map(Number);
        n = sv.n | 0; hearts = Math.max(1, Math.min(3, sv.h | 0)); score = sv.sc | 0; ok = true;
      }
      if (!ok) { n = 0; hearts = 3; score = 0; newPuzzle(); }
      ready = true; api.score(score); render();
    }
    Promise.resolve().then(() => api.load()).then(start, () => start(null));

    return {
      destroy() { dead = true; timers.forEach(clearTimeout); window.removeEventListener('keydown', onKey); persist(); },
    };
  },
};
