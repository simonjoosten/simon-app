const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
// Nederlandse bingokaart: 3 rijen x 9 kolommen, per rij 5 getallen (1-90)
function makeCard() {
  for (let tries = 0; tries < 20000; tries++) {
    const rows = [];
    const cnt = new Array(9).fill(0);
    for (let r = 0; r < 3; r++) {
      const cols = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 5);
      rows.push(cols);
      cols.forEach((c) => cnt[c]++);
    }
    if (cnt.some((x) => x < 1 || x > 3)) continue;
    const card = [[], [], []];
    for (let c = 0; c < 9; c++) {
      const lo = c === 0 ? 1 : c * 10, hi = c === 8 ? 90 : c * 10 + 9;
      const pool = [];
      for (let n = lo; n <= hi; n++) pool.push(n);
      const nums = shuffle(pool).slice(0, cnt[c]).sort((a, b) => a - b);
      let k = 0;
      for (let r = 0; r < 3; r++) card[r][c] = rows[r].includes(c) ? nums[k++] : 0;
    }
    return card;
  }
  return [[1, 0, 21, 0, 41, 0, 61, 0, 81], [0, 12, 0, 32, 0, 52, 0, 72, 0], [3, 0, 0, 33, 0, 53, 0, 73, 90]];
}
export default {
  id: 'bingo',
  name: 'Bingo',
  emoji: '🎱',
  hint: 'Tik de getrokken nummers af op je kaart en roep LIJN of BINGO',
  create(host, api) {
    host.style.touchAction = 'manipulation';
    host.style.background = '#4a1d6b';
    let dead = false, ended = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
    let cards, marks, bot, pool, called, lineWon, over, msg, score = 0, fast = false, drawT = 0, claimT = [0, 0];
    const BOTS = ['Bot Bram', 'Bot Fleur'];
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;font-family:system-ui,sans-serif;color:#fff;padding:8px;box-sizing:border-box;user-select:none;-webkit-user-select:none';
    host.appendChild(root);

    function newRound() {
      cards = [makeCard(), makeCard(), makeCard()];
      marks = [new Set(), new Set(), new Set()]; // 0 = speler (zelf afgetikt), 1,2 = bots (automatisch)
      pool = shuffle(Array.from({ length: 90 }, (_, i) => i + 1));
      called = []; lineWon = false; over = false; msg = 'Nieuwe kaart! Het eerste nummer komt eraan...';
      claimT.forEach(clearTimeout); claimT = [0, 0];
      render();
      schedule(1500);
    }
    function schedule(ms) {
      clearTimeout(drawT);
      drawT = later(drawNext, ms);
    }
    const lineDone = (p) => cards[p].some((row) => row.every((n) => n === 0 || marks[p].has(n)));
    const bingoDone = (p) => cards[p].every((row) => row.every((n) => n === 0 || marks[p].has(n)));
    const remaining = (p) => { let k = 0; cards[p].forEach((row) => row.forEach((n) => { if (n && !marks[p].has(n)) k++; })); return k; };
    const minRowLeft = (p) => Math.min(...cards[p].map((row) => row.filter((n) => n && !marks[p].has(n)).length));
    function drawNext() {
      if (over) return;
      if (!pool.length) { msg = 'Alle nummers zijn geweest!'; render(); return; }
      const n = pool.pop();
      called.push(n);
      for (const p of [1, 2]) {
        // bots tikken altijd correct af
        cards[p].forEach((row) => row.forEach((x) => { if (x === n) marks[p].add(n); }));
      }
      msg = 'Nummer ' + n + '!';
      render();
      // bots claimen na een korte vertraging
      for (const p of [1, 2]) {
        if (!lineWon && lineDone(p) && !claimT[p - 1]) claimT[p - 1] = later(() => { claimT[p - 1] = 0; botClaim(p, 'lijn'); }, 1100 + Math.random() * 1500);
        if (bingoDone(p) && !claimT[p - 1]) claimT[p - 1] = later(() => { claimT[p - 1] = 0; botClaim(p, 'bingo'); }, 900 + Math.random() * 1300);
      }
      schedule(fast ? 1100 : 2600);
    }
    function botClaim(p, kind) {
      if (over) return;
      if (kind === 'lijn') {
        if (lineWon) return;
        lineWon = true; msg = '📣 ' + BOTS[p - 1] + ' roept LIJN!'; render();
      } else {
        over = true; clearTimeout(drawT);
        msg = '📣 ' + BOTS[p - 1] + ' roept BINGO! Jij verliest...'; render();
        later(() => { if (!ended) { ended = true; api.end(score); } }, 1900);
      }
    }
    function claim(kind) {
      if (over || ended) return;
      if (kind === 'lijn') {
        if (lineWon) { msg = 'De lijn is al gewonnen!'; render(); return; }
        if (!lineDone(0)) { msg = 'Nog geen volle rij afgetikt!'; render(); return; }
        lineWon = true; score += 1; api.score(score); msg = '🎉 LIJN! +1 punt'; render();
      } else {
        if (!bingoDone(0)) { msg = 'Je kaart is nog niet vol!'; render(); return; }
        over = true; clearTimeout(drawT); score += 3 + (lineWon ? 0 : 1); api.score(score);
        msg = '🏆 BINGO!! +3 punten'; render();
      }
    }
    function tap(n) {
      if (over || ended) return;
      if (marks[0].has(n)) { marks[0].delete(n); render(); return; }
      if (!called.includes(n)) { msg = n + ' is nog niet getrokken!'; render(); return; }
      marks[0].add(n);
      render();
    }
    function render() {
      let h = '<div style="width:100%;display:flex;justify-content:space-between;font-weight:800;font-size:15px"><span>🎱 Bingo</span><span>⭐ Punten ' + score + '</span></div>';
      const last = called[called.length - 1];
      h += '<div style="display:flex;align-items:center;gap:14px;margin:8px 0">';
      h += '<div style="width:92px;height:92px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#ffd54a 60%,#e0a000);color:#3a1d00;display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:900;box-shadow:0 5px 12px rgba(0,0,0,.5)">' + (last || '?') + '</div>';
      h += '<div style="font-size:13px;max-width:210px"><div style="opacity:.8;margin-bottom:3px">Getrokken (' + called.length + '/90):</div><div style="display:flex;flex-wrap:wrap;gap:3px">';
      called.slice(-12, -1).reverse().forEach((n) => { h += '<span style="background:#ffffff26;border-radius:10px;padding:1px 7px;font-weight:700">' + n + '</span>'; });
      h += '</div></div></div>';
      h += '<div style="min-height:24px;font-size:16px;font-weight:900;text-align:center;margin-bottom:6px">' + msg + '</div>';
      // speler kaart
      const cw = Math.floor(Math.min((api.w - 24) / 9, 42));
      h += '<div style="background:#fff;padding:4px;border-radius:10px;display:grid;grid-template-columns:repeat(9,' + cw + 'px);gap:2px">';
      cards[0].forEach((row) => row.forEach((n) => {
        if (!n) { h += '<div style="height:' + (cw + 8) + 'px;background:#c9b6dd;border-radius:5px"></div>'; return; }
        const m = marks[0].has(n);
        h += '<div data-n="' + n + '" style="height:' + (cw + 8) + 'px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:' + Math.floor(cw * 0.5) + 'px;cursor:pointer;background:' + (m ? '#e03131' : '#f3ecff') + ';color:' + (m ? '#fff' : '#2a1040') + ';border:1px solid #b79bd6">' + n + '</div>';
      }));
      h += '</div>';
      h += '<div style="display:flex;gap:12px;margin:10px 0;font-size:13px">';
      for (const p of [1, 2]) h += '<span style="background:#ffffff1f;border-radius:10px;padding:4px 10px">' + BOTS[p - 1] + ': nog ' + remaining(p) + '</span>';
      h += '</div>';
      h += '<div style="display:flex;gap:10px;width:100%;max-width:360px">';
      if (!over) {
        h += '<button data-a="lijn" style="flex:1;' + bs('#2563eb') + '">LIJN!</button><button data-a="bingo" style="flex:1;' + bs('#dc2626') + '">BINGO!</button>';
        h += '<button data-a="fast" style="' + bs(fast ? '#d97706' : '#555') + ';font-size:14px">' + (fast ? '⏩ Snel' : '▶ Normaal') + '</button>';
      } else if (!ended && msg.indexOf('verliest') < 0) h += '<button data-a="new" style="flex:1;' + bs('#16a34a') + '">Nieuwe kaart ▶</button>';
      h += '</div>';
      root.innerHTML = h;
    }
    function bs(c) { return 'font:inherit;font-weight:900;border:0;border-radius:14px;color:#fff;cursor:pointer;padding:14px 12px;font-size:20px;background:' + c; }
    root.addEventListener('click', (e) => {
      if (ended) return;
      const a = e.target.closest('[data-a]');
      if (a) {
        const k = a.dataset.a;
        if (k === 'lijn' || k === 'bingo') claim(k);
        else if (k === 'fast') { fast = !fast; render(); }
        else if (k === 'new' && over) newRound();
        return;
      }
      const c = e.target.closest('[data-n]');
      if (c) tap(Number(c.dataset.n));
    });
    api.score(0);
    newRound();
    return {
      destroy() {
        dead = true; timers.forEach(clearTimeout); timers.clear();
        if (root.parentNode) root.parentNode.removeChild(root);
      },
    };
  },
};
