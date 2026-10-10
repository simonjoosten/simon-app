export default {
  id: 'tegelmatch', name: 'Tegelmatch', emoji: '🍓', hint: 'Wissel twee buur-tegels (tik of veeg) en maak rijen van 3 of meer',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#2a1b3d'; host.style.fontFamily = 'system-ui,sans-serif'; host.style.color = '#fff';
    host.style.display = 'flex'; host.style.flexDirection = 'column'; host.style.alignItems = 'center'; host.style.justifyContent = 'center'; host.style.gap = '12px';
    const mk = (tag, css, txt) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; };
    const st = mk('style', '', '@keyframes tmpop{0%{transform:scale(1);opacity:1}100%{transform:scale(0);opacity:0}}@keyframes tmdrop{0%{transform:translateY(-30px);opacity:.3}100%{transform:none;opacity:1}}');
    host.appendChild(st);
    const EMO = ['🍎', '🍋', '🍇', '🍓', '🍊', '🥝'];
    const COLS = 7, ROWS = 8, MAXL = 12;
    let dead = false, ended = false, busy = false, finished = false;
    const timers = [];
    const later = (fn, ms) => { const id = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(id); };
    let level = 1, moves = 20, total = 0, lvScore = 0, target = 300, types = 5, b = [], sel = -1, msg = '', popping = {}, dropping = {};
    const target_for = (l) => 300 + 180 * (l - 1);

    const info = mk('div', 'font-size:17px;font-weight:700;text-align:center;min-height:46px;line-height:1.35;white-space:pre-line');
    const cs = Math.floor(Math.min((api.w - 16) / COLS, (api.h - 140) / ROWS));
    const board = mk('div', 'display:grid;grid-template-columns:repeat(' + COLS + ',' + cs + 'px);grid-template-rows:repeat(' + ROWS + ',' + cs + 'px);gap:0;background:#3b2a55;border-radius:12px;padding:4px;touch-action:none');
    const els = [];
    for (let i = 0; i < COLS * ROWS; i++) {
      const d = mk('div', 'display:flex;align-items:center;justify-content:center;font-size:' + Math.floor(cs * 0.68) + 'px;border-radius:10px;cursor:pointer;user-select:none;-webkit-user-select:none;box-sizing:border-box;border:2px solid transparent;-webkit-tap-highlight-color:transparent');
      let dx = 0, dy = 0;
      d.addEventListener('pointerdown', (e) => { e.preventDefault(); dx = e.clientX; dy = e.clientY; d.dataset.down = '1'; });
      d.addEventListener('pointerup', (e) => {
        if (d.dataset.down !== '1') return; d.dataset.down = '';
        const mx = e.clientX - dx, my = e.clientY - dy;
        if (Math.max(Math.abs(mx), Math.abs(my)) > cs * 0.35) {
          const horiz = Math.abs(mx) > Math.abs(my), r = Math.floor(i / COLS), c = i % COLS;
          const nr = r + (horiz ? 0 : (my > 0 ? 1 : -1)), nc = c + (horiz ? (mx > 0 ? 1 : -1) : 0);
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) { sel = -1; trySwap(i, nr * COLS + nc); return; }
        }
        tapCell(i);
      });
      d.addEventListener('pointerleave', () => { d.dataset.down = ''; });
      board.appendChild(d); els.push(d);
    }
    host.appendChild(info); host.appendChild(board);

    function rnd() { return Math.floor(Math.random() * types); }
    function findMatches() {
      const set = new Set();
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS - 2; c++) {
        const v = b[r * COLS + c]; if (v < 0) continue;
        if (b[r * COLS + c + 1] === v && b[r * COLS + c + 2] === v) { set.add(r * COLS + c); set.add(r * COLS + c + 1); set.add(r * COLS + c + 2); }
      }
      for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS - 2; r++) {
        const v = b[r * COLS + c]; if (v < 0) continue;
        if (b[(r + 1) * COLS + c] === v && b[(r + 2) * COLS + c] === v) { set.add(r * COLS + c); set.add((r + 1) * COLS + c); set.add((r + 2) * COLS + c); }
      }
      return set;
    }
    function hasMove() {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        for (const j of [c + 1 < COLS ? i + 1 : -1, r + 1 < ROWS ? i + COLS : -1]) {
          if (j < 0) continue;
          [b[i], b[j]] = [b[j], b[i]];
          const ok = findMatches().size > 0;
          [b[i], b[j]] = [b[j], b[i]];
          if (ok) return true;
        }
      }
      return false;
    }
    function fresh() {
      do {
        b = new Array(COLS * ROWS).fill(-1);
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          let v;
          do { v = rnd(); } while ((c >= 2 && b[r * COLS + c - 1] === v && b[r * COLS + c - 2] === v) || (r >= 2 && b[(r - 1) * COLS + c] === v && b[(r - 2) * COLS + c] === v));
          b[r * COLS + c] = v;
        }
      } while (!hasMove());
    }
    function startLevel() {
      types = level >= 4 ? 6 : 5; target = target_for(level); moves = 20; lvScore = 0; sel = -1; popping = {}; dropping = {}; msg = '';
      fresh(); render();
    }
    function render() {
      info.textContent = 'Level ' + level + '/' + MAXL + '   Zetten ' + moves + '\nPunten ' + lvScore + ' / ' + target + '   Totaal ' + total + (msg ? '\n' + msg : '');
      for (let i = 0; i < COLS * ROWS; i++) {
        const d = els[i], v = b[i];
        d.textContent = v >= 0 ? EMO[v] : '';
        d.style.background = i === sel ? '#6a4aa0' : 'transparent';
        d.style.borderColor = i === sel ? '#fff' : 'transparent';
        d.style.animation = popping[i] ? 'tmpop .22s forwards' : (dropping[i] ? 'tmdrop .22s' : 'none');
      }
    }
    function tapCell(i) {
      if (busy || ended) return;
      if (sel < 0) { sel = i; render(); return; }
      if (sel === i) { sel = -1; render(); return; }
      const dr = Math.abs(Math.floor(sel / COLS) - Math.floor(i / COLS)), dc = Math.abs(sel % COLS - i % COLS);
      if (dr + dc === 1) { const a = sel; sel = -1; trySwap(a, i); } else { sel = i; render(); }
    }
    function trySwap(i, j) {
      if (busy || ended) return;
      busy = true; msg = '';
      [b[i], b[j]] = [b[j], b[i]];
      if (findMatches().size === 0) {
        render();
        later(() => { [b[i], b[j]] = [b[j], b[i]]; busy = false; render(); }, 220);
        return;
      }
      moves--; cascade = 0; render();
      later(step, 120);
    }
    let cascade = 0;
    function step() {
      const m = findMatches();
      if (m.size === 0) { settle(); return; }
      cascade++;
      const gain = (m.size * 10 + Math.max(0, m.size - 3) * 5) * cascade;
      lvScore += gain; total += gain; api.score(total);
      if (cascade > 1) msg = 'Combo x' + cascade + '! 🔥'; popping = {}; m.forEach(i => { popping[i] = true; });
      render();
      later(() => {
        m.forEach(i => { b[i] = -1; });
        popping = {}; dropping = {};
        for (let c = 0; c < COLS; c++) {
          let w = ROWS - 1;
          for (let r = ROWS - 1; r >= 0; r--) { if (b[r * COLS + c] >= 0) { if (w !== r) { b[w * COLS + c] = b[r * COLS + c]; b[r * COLS + c] = -1; dropping[w * COLS + c] = true; } w--; } }
          for (let r = w; r >= 0; r--) { b[r * COLS + c] = rnd(); dropping[r * COLS + c] = true; }
        }
        render();
        later(step, 260);
      }, 240);
    }
    function settle() {
      dropping = {};
      if (lvScore >= target) {
        const bonus = moves * 25; total += bonus; api.score(total);
        msg = 'Level gehaald! Bonus +' + bonus + ' 🎉'; render();
        if (level >= MAXL) { ended = true; later(fin, 1300); return; }
        later(() => { level++; busy = false; startLevel(); }, 1500);
        return;
      }
      if (moves <= 0) { ended = true; msg = 'Geen zetten meer!'; render(); later(fin, 1300); return; }
      if (!hasMove()) { msg = 'Geen zetten mogelijk: husselen!'; fresh(); }
      busy = false; render();
    }
    function fin() { if (finished) return; finished = true; api.end(total); }
    api.score(0); startLevel();
    return { destroy() { dead = true; timers.forEach(clearTimeout); } };
  },
};
