export default {
  id: 'waterkleuren', name: 'Waterkleuren', emoji: '🧪', hint: 'Tik een buis, tik een andere om te gieten. Elke buis één kleur', save: 'day',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#12263a'; host.style.fontFamily = 'system-ui,sans-serif'; host.style.color = '#fff';
    host.style.display = 'flex'; host.style.flexDirection = 'column'; host.style.alignItems = 'center'; host.style.justifyContent = 'center'; host.style.gap = '16px';
    const mk = (tag, css, txt) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; };
    const COLS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00', '#00acc1', '#ec407a', '#8d6e63', '#c0ca33'];
    const NCOL = [3, 4, 4, 5, 6, 6, 7, 8, 9, 10];
    const CAP = 4;
    let dead = false, ended = false, ready = false, finished = false;
    const timers = [];
    const later = (fn, ms) => { const id = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(id); };
    let level = 1, tubes = [], sel = -1, moves = 0, score = 0, hist = [], start0 = [], msg = '';

    const info = mk('div', 'font-size:18px;font-weight:700;text-align:center;min-height:46px;line-height:1.3');
    const area = mk('div', 'display:flex;flex-wrap:wrap;justify-content:center;align-content:center;gap:18px 12px;padding:0 8px;box-sizing:border-box;width:100%');
    const bar = mk('div', 'display:flex;gap:10px');
    const bs = 'padding:10px 14px;border-radius:12px;border:0;background:#2f4f73;color:#fff;font-size:15px;font-weight:700;cursor:pointer';
    const undoB = mk('button', bs, '↩ Terug'), resB = mk('button', bs, '🔄 Opnieuw'), stopB = mk('button', bs, '🏁 Stop');
    bar.appendChild(undoB); bar.appendChild(resB); bar.appendChild(stopB);
    host.appendChild(info); host.appendChild(area); host.appendChild(bar);

    function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    function makeLevel() {
      const n = NCOL[level - 1];
      let t;
      do {
        const segs = []; for (let c = 0; c < n; c++) for (let k = 0; k < CAP; k++) segs.push(c);
        shuffle(segs);
        t = []; for (let i = 0; i < n; i++) t.push(segs.slice(i * CAP, i * CAP + CAP));
        t.push([]); t.push([]);
      } while (isSolved(t) || t.some(x => x.length === CAP && x.every(v => v === x[0])));
      tubes = t; start0 = JSON.parse(JSON.stringify(t)); sel = -1; moves = 0; hist = []; msg = '';
    }
    function isSolved(t) { return t.every(x => x.length === 0 || (x.length === CAP && x.every(v => v === x[0]))); }
    function topRun(t) { let k = 0; const c = t[t.length - 1]; while (k < t.length && t[t.length - 1 - k] === c) k++; return k; }
    function canPour(f, g) {
      if (f === g) return 0;
      const a = tubes[f], b = tubes[g];
      if (!a.length || b.length >= CAP) return 0;
      if (b.length && b[b.length - 1] !== a[a.length - 1]) return 0;
      return Math.min(topRun(a), CAP - b.length);
    }
    function anyMove() {
      for (let i = 0; i < tubes.length; i++) for (let j = 0; j < tubes.length; j++) {
        const m = canPour(i, j);
        if (m && !(tubes[i].length === m && tubes[j].length === 0)) return true;
      }
      return false;
    }
    function render() {
      info.textContent = 'Level ' + level + '/' + NCOL.length + '   Zetten ' + moves + '   Score ' + score + (msg ? '\n' + msg : '');
      info.style.whiteSpace = 'pre-line';
      area.textContent = '';
      const total = tubes.length, perRow = total > 6 ? Math.ceil(total / 2) : total;
      const tw = Math.max(28, Math.min(54, Math.floor((api.w - 24) / perRow) - 14));
      const seg = Math.max(22, Math.min(36, Math.floor((api.h - 260) / 2 / CAP)));
      tubes.forEach((t, i) => {
        const d = mk('div', 'width:' + tw + 'px;height:' + (seg * CAP + 8) + 'px;border:3px solid ' + (i === sel ? '#fff' : '#9fb7cf') + ';border-top-color:transparent;border-radius:0 0 ' + Math.floor(tw / 2) + 'px ' + Math.floor(tw / 2) + 'px;display:flex;flex-direction:column-reverse;padding:2px;box-sizing:border-box;cursor:pointer;transition:transform .12s;overflow:hidden;' +
          (i === sel ? 'transform:translateY(-12px);box-shadow:0 0 14px #fff8;' : ''));
        t.forEach(c => d.appendChild(mk('div', 'height:' + seg + 'px;background:' + COLS[c] + ';border-radius:3px;margin-top:0')));
        d.addEventListener('pointerdown', () => tap(i));
        area.appendChild(d);
      });
    }
    function persist() { if (!ready || ended) return; api.save({ l: level, t: tubes.map(x => x.join('')), m: moves, sc: score, s0: start0.map(x => x.join('')) }); }
    function tap(i) {
      if (!ready || ended) return;
      if (sel < 0) { if (tubes[i].length) sel = i; render(); return; }
      if (sel === i) { sel = -1; render(); return; }
      const m = canPour(sel, i);
      if (!m) { sel = tubes[i].length ? i : -1; render(); return; }
      hist.push(JSON.stringify(tubes)); if (hist.length > 60) hist.shift();
      const c = tubes[sel][tubes[sel].length - 1];
      for (let k = 0; k < m; k++) { tubes[sel].pop(); tubes[i].push(c); }
      sel = -1; moves++; msg = '';
      if (isSolved(tubes)) { levelDone(); return; }
      if (!anyMove()) msg = 'Vast! Gebruik Terug of Opnieuw';
      render(); persist();
    }
    function levelDone() {
      const n = NCOL[level - 1];
      score += 100 + Math.max(0, n * 10 - moves) * 2; api.score(score);
      ready = false; render();
      info.textContent = 'Level ' + level + ' gehaald! 🎉  Score ' + score;
      if (level >= NCOL.length) { ended = true; api.clear(); later(finish, 1000); return; }
      later(() => { level++; makeLevel(); ready = true; render(); persist(); }, 1100);
    }
    function finish() { if (finished) return; finished = true; api.end(score); }
    undoB.addEventListener('click', () => { if (!ready || ended || !hist.length) return; tubes = JSON.parse(hist.pop()); sel = -1; if (moves > 0) moves--; msg = ''; render(); persist(); });
    resB.addEventListener('click', () => { if (!ready || ended) return; tubes = JSON.parse(JSON.stringify(start0)); sel = -1; moves = 0; hist = []; msg = ''; render(); persist(); });
    stopB.addEventListener('click', () => { if (!ready || ended) return; ended = true; ready = false; api.clear(); finish(); });

    function begin(sv) {
      if (dead) return;
      let ok = false;
      try {
        if (sv && sv.l >= 1 && sv.l <= NCOL.length && Array.isArray(sv.t) && Array.isArray(sv.s0)) {
          const t = sv.t.map(s => s.split('').map(Number)), s0 = sv.s0.map(s => s.split('').map(Number));
          if (t.length === NCOL[sv.l - 1] + 2 && t.every(x => x.length <= CAP && x.every(v => v >= 0 && v < NCOL[sv.l - 1]))) {
            level = sv.l | 0; tubes = t; start0 = s0; moves = sv.m | 0; score = sv.sc | 0; sel = -1; hist = []; msg = ''; ok = true;
          }
        }
      } catch (_) { ok = false; }
      if (!ok) { level = 1; score = 0; makeLevel(); }
      ready = true; api.score(score); render();
    }
    Promise.resolve().then(() => api.load()).then(begin, () => begin(null));

    return { destroy() { dead = true; timers.forEach(clearTimeout); persist(); } };
  },
};
