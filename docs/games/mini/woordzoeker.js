const THEMAS = [
  { naam: 'Dieren', emoji: '🐾', woorden: ['KAT', 'HOND', 'KONIJN', 'PAARD', 'OLIFANT', 'GIRAFFE', 'LEEUW', 'ZEBRA', 'APEN', 'SLANG', 'UIL', 'EEND'] },
  { naam: 'Fruit en groente', emoji: '🍎', woorden: ['APPEL', 'PEER', 'BANAAN', 'MELOEN', 'SINAASAPPEL', 'WORTEL', 'SLA', 'UI', 'TOMAAT', 'KERS', 'PRUIM', 'BROCCOLI'] },
  { naam: 'Sport', emoji: '⚽', woorden: ['VOETBAL', 'TENNIS', 'ZWEMMEN', 'HOCKEY', 'RENNEN', 'JUDO', 'GOLF', 'SCHAATSEN', 'TURNEN', 'FIETSEN', 'ROEIEN', 'BASKETBAL'] },
  { naam: 'Ruimte', emoji: '🚀', woorden: ['MAAN', 'ZON', 'STER', 'RAKET', 'PLANEET', 'MARS', 'KOMEET', 'KRATER', 'AARDE', 'GALAXY', 'SATURNUS', 'ASTRONAUT'] },
  { naam: 'Eten', emoji: '🍕', woorden: ['PIZZA', 'BROOD', 'KAAS', 'FRIETEN', 'SOEP', 'PASTA', 'PANNENKOEK', 'RIJST', 'KIP', 'TAART', 'KOEK', 'CHOCOLADE'] },
  { naam: 'School', emoji: '🏫', woorden: ['JUF', 'MEESTER', 'BOEK', 'PEN', 'POTLOOD', 'GUM', 'LINIAAL', 'TAAL', 'REKENEN', 'PAUZE', 'KLAS', 'BORD'] },
  { naam: 'Strand', emoji: '🏖️', woorden: ['ZAND', 'ZEE', 'GOLF', 'SCHELP', 'EMMER', 'KRAB', 'ZON', 'HANDDOEK', 'STRAND', 'DUIN', 'MEEUW', 'PARASOL'] },
  { naam: 'Weer', emoji: '⛅', woorden: ['REGEN', 'WIND', 'ZON', 'SNEEUW', 'ONWEER', 'MIST', 'HAGEL', 'WOLK', 'BLIKSEM', 'STORM', 'DONDER', 'REGENBOOG'] },
  { naam: 'Muziek', emoji: '🎵', woorden: ['GITAAR', 'PIANO', 'VIOOL', 'TROMMEL', 'FLUIT', 'ZANG', 'LIED', 'NOOT', 'TROMPET', 'ORGEL', 'DANS', 'KOOR'] },
  { naam: 'Nederland', emoji: '🌷', woorden: ['TULP', 'MOLEN', 'KLOMP', 'FIETS', 'KAAS', 'GRACHT', 'DIJK', 'HAAG', 'ZEELAND', 'BRABANT', 'FRIESLAND', 'STROOPWAFEL'] },
];
const N = 10;
const DIRS1 = [[0, 1], [1, 0]];
const DIRS2 = [[0, 1], [1, 0], [1, 1]];
const DIRS3 = [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1]];
const KLEUREN = ['#ff9f43', '#54a0ff', '#1dd1a1', '#ff6b81', '#feca57', '#a29bfe', '#48dbfb', '#ff7f50', '#badc58', '#e056fd'];

function clean(w) { return w.toUpperCase().replace(/[^A-Z]/g, ''); }
function rnd(n) { return Math.floor(Math.random() * n); }

function makePuzzle(level) {
  const dirs = level <= 1 ? DIRS1 : level === 2 ? DIRS2 : DIRS3;
  const count = Math.min(5 + level, 9);
  for (let attempt = 0; attempt < 30; attempt++) {
    const thema = THEMAS[(level - 1) % THEMAS.length];
    const cand = thema.woorden.map(clean).filter((w) => w.length >= 3 && w.length <= N);
    const picked = cand.slice().sort(() => Math.random() - 0.5).slice(0, count).sort((a, b) => b.length - a.length);
    const grid = [];
    for (let i = 0; i < N * N; i++) grid.push('');
    const placed = [];
    for (const w of picked) {
      let ok = false;
      for (let t = 0; t < 300 && !ok; t++) {
        const d = dirs[rnd(dirs.length)];
        const r0 = rnd(N), c0 = rnd(N);
        const r1 = r0 + d[0] * (w.length - 1), c1 = c0 + d[1] * (w.length - 1);
        if (r1 < 0 || r1 >= N || c1 < 0 || c1 >= N) continue;
        let fits = true;
        for (let k = 0; k < w.length; k++) {
          const v = grid[(r0 + d[0] * k) * N + c0 + d[1] * k];
          if (v && v !== w[k]) { fits = false; break; }
        }
        if (!fits) continue;
        for (let k = 0; k < w.length; k++) grid[(r0 + d[0] * k) * N + c0 + d[1] * k] = w[k];
        placed.push({ w, r: r0, c: c0, dr: d[0], dc: d[1], found: false });
        ok = true;
      }
    }
    if (placed.length >= Math.min(4, count)) {
      const abc = 'ABCDEFGHIJKLMNOPRSTUVWZ';
      for (let i = 0; i < N * N; i++) if (!grid[i]) grid[i] = abc[rnd(abc.length)];
      return { thema: thema.naam, emoji: thema.emoji, grid: grid.join(''), words: placed };
    }
  }
  return null;
}

export default {
  id: 'woordzoeker',
  name: 'Woordzoeker',
  emoji: '🔎',
  hint: 'Veeg over de letters om de verborgen woorden te vinden',
  save: 'day',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#1e3a4c';
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;font-family:system-ui,sans-serif;color:#fff;padding:8px 8px 10px;box-sizing:border-box;user-select:none;-webkit-user-select:none;overflow:hidden;touch-action:none';
    root.innerHTML =
      '<div style="width:100%;display:flex;justify-content:space-between;font-weight:700;font-size:15px"><span data-r="lvl"></span><span data-r="time"></span><span data-r="score"></span></div>' +
      '<div data-r="msg" style="min-height:22px;margin:4px 0;font-size:15px;font-weight:700;text-align:center"></div>' +
      '<div data-r="grid" style="display:grid;gap:2px;touch-action:none;background:rgba(255,255,255,.08);padding:3px;border-radius:10px"></div>' +
      '<div data-r="words" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:10px;width:100%;max-width:420px"></div>';
    host.appendChild(root);
    const q = (n) => root.querySelector('[data-r="' + n + '"]');
    const elLvl = q('lvl'), elTime = q('time'), elScore = q('score'), elMsg = q('msg'), elGrid = q('grid'), elWords = q('words');

    let dead = false, done = false, started = false, timer = 0, ticker = 0;
    let level = 1, score = 0, timeLeft = 150, puz = null;
    let cells = [];
    let sel = [], dragging = false, startCell = -1;
    const cellSize = Math.max(24, Math.min(38, Math.floor(Math.min(api.w - 30, api.h * 0.5) / N) - 2));

    function setT(fn, ms) { clearTimeout(timer); timer = setTimeout(() => { if (!dead) fn(); }, ms); }
    function hud() {
      elLvl.textContent = (puz ? puz.emoji + ' ' + puz.thema : '') + ' · Niveau ' + level;
      elTime.textContent = '⏱ ' + Math.max(0, Math.ceil(timeLeft));
      elScore.textContent = '⭐ ' + score;
      api.score(score);
    }
    function save() {
      if (!started || done || !puz || puz.words.every((x) => x.found)) return;
      api.save({
        l: level, s: score, t: Math.round(timeLeft), th: puz.thema, em: puz.emoji, g: puz.grid,
        w: puz.words.map((x) => [x.w, x.r, x.c, x.dr, x.dc, x.found ? 1 : 0]),
      });
    }
    function validSaved(s) {
      return s && typeof s.g === 'string' && s.g.length === N * N && Array.isArray(s.w) && s.w.length > 0 && s.t > 0 &&
        s.w.every((x) => Array.isArray(x) && typeof x[0] === 'string' && x.length >= 6) && s.w.some((x) => !x[5]) &&
        Number.isInteger(s.l) && s.l >= 1;
    }
    function build() {
      elGrid.style.gridTemplateColumns = 'repeat(' + N + ',' + cellSize + 'px)';
      elGrid.innerHTML = '';
      cells = [];
      for (let i = 0; i < N * N; i++) {
        const d = document.createElement('div');
        d.textContent = puz.grid[i];
        d.style.cssText = 'width:' + cellSize + 'px;height:' + cellSize + 'px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:' + Math.round(cellSize * 0.55) + 'px;border-radius:8px;background:rgba(255,255,255,.14);pointer-events:none';
        elGrid.appendChild(d);
        cells.push(d);
      }
      paint();
      renderWords();
      hud();
    }
    function paint() {
      cells.forEach((c) => { c.style.background = 'rgba(255,255,255,.14)'; c.style.color = '#fff'; });
      puz.words.forEach((wd, idx) => {
        if (!wd.found) return;
        for (let k = 0; k < wd.w.length; k++) {
          const c = cells[(wd.r + wd.dr * k) * N + wd.c + wd.dc * k];
          c.style.background = KLEUREN[idx % KLEUREN.length];
          c.style.color = '#10202a';
        }
      });
      sel.forEach((i) => { cells[i].style.background = '#ffe066'; cells[i].style.color = '#10202a'; });
    }
    function renderWords() {
      elWords.innerHTML = '';
      puz.words.forEach((wd, idx) => {
        const s = document.createElement('span');
        s.textContent = wd.w;
        s.style.cssText = 'padding:3px 9px;border-radius:12px;font-size:13px;font-weight:700;' +
          (wd.found ? 'background:' + KLEUREN[idx % KLEUREN.length] + ';color:#10202a;text-decoration:line-through;opacity:.85' : 'background:rgba(255,255,255,.15)');
        elWords.appendChild(s);
      });
    }
    function newLevel() {
      let p = null;
      for (let i = 0; i < 5 && !p; i++) p = makePuzzle(level);
      puz = p;
      sel = [];
      elMsg.textContent = 'Zoek de woorden!';
      build();
      save();
    }
    function cellAt(e) {
      const r = elGrid.getBoundingClientRect();
      const pad = 3, gap = 2;
      const x = e.clientX - r.left - pad, y = e.clientY - r.top - pad;
      const step = cellSize + gap;
      const c = Math.floor(x / step), rr = Math.floor(y / step);
      if (c < 0 || rr < 0 || c >= N || rr >= N) return -1;
      return rr * N + c;
    }
    function lineTo(from, to) {
      const r0 = Math.floor(from / N), c0 = from % N, r1 = Math.floor(to / N), c1 = to % N;
      let dr = r1 - r0, dc = c1 - c0;
      const ar = Math.abs(dr), ac = Math.abs(dc);
      if (ar === 0 && ac === 0) return [from];
      if (ar >= 2 * ac) dc = 0;
      else if (ac >= 2 * ar) dr = 0;
      else { const m = Math.max(ar, ac); dr = Math.sign(dr) * m; dc = Math.sign(dc) * m; }
      const len = Math.max(Math.abs(dr), Math.abs(dc));
      const sr = Math.sign(dr), sc = Math.sign(dc);
      const out = [];
      for (let k = 0; k <= len; k++) {
        const rr = r0 + sr * k, cc = c0 + sc * k;
        if (rr < 0 || rr >= N || cc < 0 || cc >= N) break;
        out.push(rr * N + cc);
      }
      return out;
    }
    function onDown(e) {
      if (done || !puz) return;
      const c = cellAt(e);
      if (c < 0) return;
      e.preventDefault();
      dragging = true;
      startCell = c;
      sel = [c];
      try { elGrid.setPointerCapture(e.pointerId); } catch (err) { /* geen capture */ }
      paint();
    }
    function onMove(e) {
      if (!dragging) return;
      const c = cellAt(e);
      if (c < 0) return;
      sel = lineTo(startCell, c);
      paint();
    }
    function onUp() {
      if (!dragging) return;
      dragging = false;
      const str = sel.map((i) => puz.grid[i]).join('');
      const rev = str.split('').reverse().join('');
      let hit = null;
      if (sel.length > 1) puz.words.forEach((wd) => { if (!wd.found && (wd.w === str || wd.w === rev)) hit = wd; });
      sel = [];
      if (hit) {
        hit.found = true;
        const gain = hit.w.length * 10;
        score += gain;
        elMsg.textContent = '✅ ' + hit.w + '! +' + gain;
        paint(); renderWords(); hud(); save();
        if (puz.words.every((x) => x.found)) {
          const bonus = Math.round(timeLeft) + level * 20;
          score += bonus;
          timeLeft += 40;
          elMsg.textContent = '🎉 Niveau klaar! Bonus +' + bonus;
          level++;
          hud();
          setT(newLevel, 1400);
        }
      } else {
        if (str.length > 1) elMsg.textContent = 'Dat is geen woord uit de lijst';
        paint();
      }
    }
    elGrid.addEventListener('pointerdown', onDown);
    elGrid.addEventListener('pointermove', onMove);
    elGrid.addEventListener('pointerup', onUp);
    elGrid.addEventListener('pointercancel', onUp);

    function finish() {
      if (done) return;
      done = true;
      clearInterval(ticker); clearTimeout(timer);
      api.clear();
      api.score(score);
      api.end(score);
    }
    function begin(s) {
      started = true;
      if (validSaved(s)) {
        level = s.l; score = Number(s.s) || 0; timeLeft = s.t;
        puz = {
          thema: String(s.th || ''), emoji: String(s.em || ''), grid: s.g,
          words: s.w.map((x) => ({ w: x[0], r: x[1], c: x[2], dr: x[3], dc: x[4], found: !!x[5] })),
        };
        elMsg.textContent = 'Verder waar je was gebleven';
        build();
      } else newLevel();
      let n = 0;
      ticker = setInterval(() => {
        if (dead || done) return;
        timeLeft -= 0.25;
        n++;
        if (timeLeft <= 0) { timeLeft = 0; hud(); elMsg.textContent = 'De tijd is om!'; finish(); return; }
        if (n % 4 === 0) { hud(); }
        if (n % 20 === 0) save();
      }, 250);
    }
    let p;
    try { p = api.load(); } catch (e) { p = Promise.resolve(null); }
    Promise.resolve(p).then((s) => { if (!dead) begin(s); }, () => { if (!dead) begin(null); });

    return {
      destroy() {
        save();
        dead = true;
        clearTimeout(timer); clearInterval(ticker);
        elGrid.removeEventListener('pointerdown', onDown);
        elGrid.removeEventListener('pointermove', onMove);
        elGrid.removeEventListener('pointerup', onUp);
        elGrid.removeEventListener('pointercancel', onUp);
        if (root.parentNode) root.parentNode.removeChild(root);
      },
    };
  },
};
