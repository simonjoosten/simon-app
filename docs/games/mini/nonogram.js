export default {
  id: 'nonogram', name: 'Nonogram', emoji: '🖼️', hint: 'Tik = vullen, lang indrukken = kruisje. Cijfers tonen de blokken', save: 'day',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#1b1f2a'; host.style.fontFamily = 'system-ui,sans-serif'; host.style.color = '#fff';
    host.style.display = 'flex'; host.style.flexDirection = 'column'; host.style.alignItems = 'center'; host.style.justifyContent = 'center'; host.style.gap = '12px';
    const mk = (tag, css, txt) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; };
    const SIZES = [5, 5, 5, 7, 7, 7];
    let dead = false, ended = false, ready = false, finished = false;
    const timers = [];
    const later = (fn, ms) => { const id = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(id); };
    let lv = 0, N = 5, sol = [], cur = [], score = 0, elapsed = 0, mode = 0, rowC = [], colC = [], cells = [], solved = false;
    let boardEl = null;

    const info = mk('div', 'font-size:17px;font-weight:700;text-align:center');
    const area = mk('div', 'display:flex;justify-content:center');
    const bar = mk('div', 'display:flex;gap:10px');
    const bStyle = 'padding:10px 14px;border-radius:12px;border:0;background:#33425f;color:#fff;font-size:15px;font-weight:700;cursor:pointer';
    const modeBtn = mk('button', bStyle); const resetBtn = mk('button', bStyle, '↺ Wissen');
    bar.appendChild(modeBtn); bar.appendChild(resetBtn);
    host.appendChild(info); host.appendChild(area); host.appendChild(bar);
    modeBtn.addEventListener('click', () => { mode = 1 - mode; renderMode(); });
    resetBtn.addEventListener('click', () => { if (!ready || ended || solved) return; cur = cur.map(() => 0); renderBoard(); persist(); });
    function renderMode() { modeBtn.textContent = mode === 0 ? '⬛ Vullen (tik)' : '✖ Kruisje (tik)'; }

    function runs(line) {
      const r = []; let k = 0;
      for (const v of line) { if (v === 1) k++; else if (k) { r.push(k); k = 0; } }
      if (k) r.push(k);
      return r.length ? r : [0];
    }
    function compute() {
      rowC = []; colC = [];
      for (let i = 0; i < N; i++) {
        rowC.push(runs(sol.slice(i * N, i * N + N)));
        const col = []; for (let j = 0; j < N; j++) col.push(sol[j * N + i]);
        colC.push(runs(col));
      }
    }
    function newPuzzle() {
      N = SIZES[lv]; const p = N === 5 ? 0.55 : 0.6;
      do {
        sol = []; for (let i = 0; i < N * N; i++) sol.push(Math.random() < p ? 1 : 0);
      } while (sol.reduce((a, b) => a + b, 0) < N * 2);
      cur = sol.map(() => 0); elapsed = 0; solved = false;
      compute();
    }
    function same(a, b) { return a.length === b.length && a.every((x, i) => x === b[i]); }
    function check() {
      for (let i = 0; i < N; i++) {
        if (!same(runs(cur.slice(i * N, i * N + N).map(v => v === 1 ? 1 : 0)), rowC[i])) return false;
        const col = []; for (let j = 0; j < N; j++) col.push(cur[j * N + i] === 1 ? 1 : 0);
        if (!same(runs(col), colC[i])) return false;
      }
      return true;
    }
    function updateInfo() {
      info.textContent = 'Puzzel ' + (lv + 1) + '/' + SIZES.length + ' (' + N + 'x' + N + ')  ⏱ ' + Math.floor(elapsed) + 's  Score ' + score;
    }
    function renderBoard() {
      if (!boardEl) return;
      for (let i = 0; i < N * N; i++) {
        const d = cells[i], v = cur[i];
        d.style.background = v === 1 ? (solved ? '#4caf50' : '#4da3ff') : '#2a3347';
        d.textContent = v === 2 ? '✕' : '';
      }
    }
    function buildBoard() {
      area.textContent = ''; cells = [];
      const maxRun = Math.ceil(N / 2);
      const cell = Math.floor(Math.min((api.w - 20) / (N + maxRun * 0.75), (api.h - 190) / (N + maxRun * 0.75)));
      const cw = Math.floor(cell * 0.75 * maxRun);
      const fs = Math.max(11, Math.floor(cell * 0.38));
      boardEl = mk('div', 'display:grid;gap:2px;grid-template-columns:' + cw + 'px repeat(' + N + ',' + cell + 'px);grid-template-rows:' + cw + 'px repeat(' + N + ',' + cell + 'px)');
      boardEl.appendChild(mk('div'));
      for (let c = 0; c < N; c++) {
        const d = mk('div', 'display:flex;flex-direction:column;justify-content:flex-end;align-items:center;font-size:' + fs + 'px;font-weight:700;color:#bcd2ff;line-height:1.15');
        colC[c].forEach(x => d.appendChild(mk('div', '', String(x)))); boardEl.appendChild(d);
      }
      for (let r = 0; r < N; r++) {
        const d = mk('div', 'display:flex;justify-content:flex-end;align-items:center;gap:' + Math.floor(fs * 0.4) + 'px;padding-right:4px;font-size:' + fs + 'px;font-weight:700;color:#bcd2ff');
        rowC[r].forEach(x => d.appendChild(mk('div', '', String(x)))); boardEl.appendChild(d);
        for (let c = 0; c < N; c++) {
          const i = r * N + c;
          const e = mk('div', 'display:flex;align-items:center;justify-content:center;border-radius:5px;font-size:' + Math.floor(cell * 0.55) + 'px;color:#ff8a80;cursor:pointer;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent' +
            (c === 4 && N === 7 ? '' : ''));
          let tm = null, longDone = false;
          e.addEventListener('pointerdown', (ev) => {
            ev.preventDefault();
            longDone = false;
            tm = setTimeout(() => { tm = null; longDone = true; tap(i, 1 - mode); }, 380);
          });
          e.addEventListener('pointerup', () => { if (tm !== null) { clearTimeout(tm); tm = null; if (!longDone) tap(i, mode); } });
          const cancel = () => { if (tm !== null) { clearTimeout(tm); tm = null; } };
          e.addEventListener('pointerleave', cancel); e.addEventListener('pointercancel', cancel);
          e.addEventListener('contextmenu', (ev) => ev.preventDefault());
          boardEl.appendChild(e); cells.push(e);
        }
      }
      area.appendChild(boardEl);
      renderBoard(); renderMode(); updateInfo();
    }
    function tap(i, m) {
      if (!ready || ended || solved) return;
      const v = cur[i];
      if (m === 0) cur[i] = v === 1 ? 0 : 1; else cur[i] = v === 2 ? 0 : 2;
      renderBoard();
      if (check()) {
        solved = true; renderBoard();
        score += 100 + Math.max(0, 100 - Math.floor(elapsed)) + lv * 20; api.score(score);
        info.textContent = 'Opgelost! 🎉 Score ' + score;
        ready = false;
        if (lv + 1 >= SIZES.length) { ended = true; api.clear(); later(finish, 900); return; }
        later(() => { lv++; newPuzzle(); buildBoard(); ready = true; persist(); }, 1000);
        return;
      }
      persist();
    }
    function finish() { if (finished) return; finished = true; api.end(score); }
    function persist() {
      if (!ready || ended) return;
      api.save({ lv, s: sol.join(''), c: cur.join(''), el: Math.floor(elapsed), sc: score });
    }
    const tick = setInterval(() => { if (dead || !ready || ended || solved) return; elapsed += 1; updateInfo(); if (elapsed % 10 === 0) persist(); }, 1000);

    function start(sv) {
      if (dead) return;
      let ok = false;
      if (sv && typeof sv.s === 'string' && typeof sv.c === 'string' && sv.lv >= 0 && sv.lv < SIZES.length && sv.s.length === SIZES[sv.lv | 0] ** 2 && sv.c.length === sv.s.length) {
        lv = sv.lv | 0; N = SIZES[lv]; sol = sv.s.split('').map(Number); cur = sv.c.split('').map(Number);
        elapsed = sv.el | 0; score = sv.sc | 0; solved = false; compute(); ok = true;
      }
      if (!ok) { lv = 0; score = 0; newPuzzle(); }
      api.score(score); buildBoard(); ready = true;
    }
    Promise.resolve().then(() => api.load()).then(start, () => start(null));

    return { destroy() { dead = true; clearInterval(tick); timers.forEach(clearTimeout); persist(); } };
  },
};
