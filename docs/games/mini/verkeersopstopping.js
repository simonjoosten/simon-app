export default {
  id: 'verkeersopstopping', name: 'Verkeersopstopping', emoji: '🚗', hint: 'Schuif de autootjes weg en laat de rode auto rechts naar buiten rijden', save: 'day',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#26323d'; host.style.fontFamily = 'system-ui,sans-serif'; host.style.color = '#fff';
    host.style.display = 'flex'; host.style.flexDirection = 'column'; host.style.alignItems = 'center'; host.style.justifyContent = 'center'; host.style.gap = '16px';
    const mk = (tag, css, txt) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; };
    // [minimaal aantal zetten, bord (6x6, rij voor rij); R = rode auto]
    const LEVELS = [
      [4, 'HB..D.HBKJDFRRKJ.F.CCCEE.IIAAAGGG...'],
      [4, 'EE....DD.G...RRGBC....BC....FF..AAA.'],
      [6, '.EE.......CBRR..CB..F.C..DF.AA.D....'],
      [6, '..D..G..D..GRRCBEG..CBE.......AAA.FF'],
      [8, '.G..A..G..A.RRD.AB..DFFB...H...EEHCC'],
      [10, '..EFCC..EFA.H.RRA.HDDDBBH.....GG....'],
      [12, '...DD....CB..RRCBF.AAABF.H.EEF.H.GGG'],
      [12, 'GFF.EEG.HC..RRHCA...H.A.....DBIII.DB'],
      [13, 'IEECC.I.GAB.RRGABDH.FFFDH..JJ.......'],
      [14, '.CFEEE.CFGBARR.GBAHH..D.J.IIDLJ..KKL'],
      [16, '.EE.ABHHFFABC.RRABC.GG....IDD.JJI...'],
      [17, '..IC....ICD.RRFCDEAAFJJEK.GG.HK.BB.H'],
      [18, '.IFFA..IJJADRRH..DK.HC.DK.BCGGK.BEEE'],
      [21, 'BBI..G..IFAG.RRFAGH.DFCCH.D.JJ..EEE.'],
      [24, 'GEE..FGLL.AFRRI.ABJJI..BHHHCDD...CKK'],
      [26, '.EEEKFGGD.KFRRD..AJ..BBAJIIHCC...H..'],
      [27, 'EEEC.A...CFAHRR.FKH.IIFKH.BDDDGGB.JJ'],
      [29, 'IIIGGCBBFKKCRRF...H..EJJHDDEAMLL..AM'],
    ];
    let dead = false, ended = false, ready = false, finished = false, busy = false;
    const timers = [];
    const later = (fn, ms) => { const id = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(id); };
    let lv = 0, cars = [], moves = 0, score = 0, carEls = [];

    const info = mk('div', 'font-size:18px;font-weight:700;text-align:center;min-height:48px;line-height:1.35;white-space:pre-line');
    const bs = Math.floor(Math.min(api.w - 24, api.h - 210) / 6) * 6, cell = bs / 6;
    const wrap = mk('div', 'position:relative;width:' + (bs + 30) + 'px;height:' + bs + 'px');
    const board = mk('div', 'position:absolute;left:0;top:0;width:' + bs + 'px;height:' + bs + 'px;background:#3d4c5a;border-radius:10px;overflow:hidden;box-shadow:0 0 0 4px #5a6b7b');
    for (let i = 0; i < 36; i++) board.appendChild(mk('div', 'position:absolute;left:' + (i % 6) * cell + 'px;top:' + Math.floor(i / 6) * cell + 'px;width:' + cell + 'px;height:' + cell + 'px;box-sizing:border-box;border:1px solid #33414d'));
    const exitMark = mk('div', 'position:absolute;left:' + (bs + 4) + 'px;top:' + (2 * cell) + 'px;height:' + cell + 'px;line-height:' + cell + 'px;font-size:22px;color:#7CFC9a', '➡️');
    wrap.appendChild(board); wrap.appendChild(exitMark);
    const bar = mk('div', 'display:flex;gap:10px');
    const bst = 'padding:10px 14px;border-radius:12px;border:0;background:#4a6178;color:#fff;font-size:15px;font-weight:700;cursor:pointer';
    const resB = mk('button', bst, '↺ Opnieuw'), stopB = mk('button', bst, '🏁 Stop');
    bar.appendChild(resB); bar.appendChild(stopB);
    host.appendChild(info); host.appendChild(wrap); host.appendChild(bar);

    const PAL = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#e84393', '#95a5a6', '#00b894', '#6c5ce7', '#fd79a8', '#b8860b', '#74b9ff', '#a29bfe', '#fab1a0', '#55efc4'];
    function parse(str) {
      const map = {};
      for (let i = 0; i < 36; i++) { const ch = str[i]; if (ch === '.') continue; (map[ch] = map[ch] || []).push(i); }
      const out = [];
      Object.keys(map).forEach(ch => {
        const a = map[ch], hor = a.length > 1 && a[1] === a[0] + 1;
        out.push({ ch, r: Math.floor(a[0] / 6), c: a[0] % 6, len: a.length, hor });
      });
      out.sort((x, y) => (x.ch === 'R' ? -1 : y.ch === 'R' ? 1 : x.ch < y.ch ? -1 : 1));
      return out;
    }
    function serialize() {
      const g = new Array(36).fill('.');
      cars.forEach(k => { for (let j = 0; j < k.len; j++) g[(k.hor ? k.r : k.r + j) * 6 + (k.hor ? k.c + j : k.c)] = k.ch; });
      return g.join('');
    }
    function occupied(skip) {
      const g = new Array(36).fill(false);
      cars.forEach(k => { if (k === skip) return; for (let j = 0; j < k.len; j++) g[(k.hor ? k.r : k.r + j) * 6 + (k.hor ? k.c + j : k.c)] = true; });
      return g;
    }
    function placeEl(k, el) {
      el.style.left = (k.c * cell + 3) + 'px'; el.style.top = (k.r * cell + 3) + 'px';
    }
    function buildCars() {
      carEls.forEach(e => e.remove()); carEls = [];
      cars.forEach((k, idx) => {
        const red = k.ch === 'R';
        const col = red ? PAL[0] : PAL[1 + (k.ch.charCodeAt(0) % (PAL.length - 1))];
        const el = mk('div', 'position:absolute;box-sizing:border-box;border-radius:' + Math.floor(cell * 0.28) + 'px;background:' + col + ';box-shadow:inset 0 -5px 0 rgba(0,0,0,.25),0 2px 4px rgba(0,0,0,.4);width:' + ((k.hor ? k.len : 1) * cell - 6) + 'px;height:' + ((k.hor ? 1 : k.len) * cell - 6) + 'px;cursor:grab;display:flex;align-items:center;justify-content:center;font-size:' + Math.floor(cell * 0.5) + 'px;transition:none', red ? '🚗' : '');
        placeEl(k, el);
        let drag = null;
        el.addEventListener('pointerdown', (e) => {
          if (!ready || ended || busy) return;
          e.preventDefault();
          const occ = occupied(k);
          let mn = k.hor ? k.c : k.r, mx = mn;
          const at = (p) => k.hor ? occ[k.r * 6 + p] : occ[p * 6 + k.c];
          while (mn - 1 >= 0 && !at(mn - 1)) mn--;
          while (mx + k.len < 6 && !at(mx + k.len)) mx++;
          drag = { sx: e.clientX, sy: e.clientY, start: k.hor ? k.c : k.r, mn, mx, cur: k.hor ? k.c : k.r };
          try { el.setPointerCapture(e.pointerId); } catch (_) {}
        });
        el.addEventListener('pointermove', (e) => {
          if (!drag) return;
          const d = (k.hor ? e.clientX - drag.sx : e.clientY - drag.sy) / cell;
          drag.cur = Math.max(drag.mn, Math.min(drag.mx, drag.start + d));
          if (k.hor) el.style.left = (drag.cur * cell + 3) + 'px'; else el.style.top = (drag.cur * cell + 3) + 'px';
        });
        const up = () => {
          if (!drag) return;
          const p = Math.round(drag.cur), changed = p !== drag.start;
          if (k.hor) k.c = p; else k.r = p;
          placeEl(k, el); drag = null;
          if (changed) { moves++; refresh(); persist(); checkWin(); }
        };
        el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
        board.appendChild(el); carEls.push(el);
      });
    }
    function refresh() {
      info.textContent = 'Level ' + (lv + 1) + '/' + LEVELS.length + '   Zetten ' + moves + ' (minimaal ' + LEVELS[lv][0] + ')\nScore ' + score;
    }
    function persist() { if (!ready || ended) return; api.save({ lv, b: serialize(), m: moves, sc: score }); }
    function checkWin() {
      const red = cars[0];
      if (red.ch !== 'R' || red.c + red.len < 6) return;
      busy = true;
      const el = carEls[0]; el.style.transition = 'left .5s ease-in'; el.style.left = (bs + 20) + 'px';
      const gain = 100 + Math.max(0, LEVELS[lv][0] + 8 - moves) * 10 + lv * 10;
      score += gain; api.score(score);
      info.textContent = 'Uit de file! 🎉 +' + gain + '\nScore ' + score;
      if (lv + 1 >= LEVELS.length) { ended = true; ready = false; api.clear(); later(finish, 1200); return; }
      later(() => { lv++; load(LEVELS[lv][1]); moves = 0; busy = false; refresh(); persist(); }, 1200);
    }
    function load(str) { cars = parse(str); buildCars(); }
    function finish() { if (finished) return; finished = true; api.end(score); }
    resB.addEventListener('click', () => { if (!ready || ended || busy) return; load(LEVELS[lv][1]); moves = 0; refresh(); persist(); });
    stopB.addEventListener('click', () => { if (!ready || ended || busy) return; ended = true; ready = false; api.clear(); finish(); });

    function begin(sv) {
      if (dead) return;
      let ok = false;
      if (sv && sv.lv >= 0 && sv.lv < LEVELS.length && typeof sv.b === 'string' && sv.b.length === 36) {
        const t = parse(sv.b);
        if (t.length && t[0].ch === 'R' && t[0].hor && t[0].r === 2 && t[0].c + t[0].len < 6) { lv = sv.lv | 0; cars = t; moves = sv.m | 0; score = sv.sc | 0; buildCars(); ok = true; }
      }
      if (!ok) { lv = 0; score = 0; moves = 0; load(LEVELS[0][1]); }
      ready = true; api.score(score); refresh();
    }
    Promise.resolve().then(() => api.load()).then(begin, () => begin(null));

    return { destroy() { dead = true; timers.forEach(clearTimeout); persist(); } };
  },
};
