// Pinnenspel: peg solitaire. Spring met een pin over een andere pin in een leeg gat; de overgesprongen pin verdwijnt.
// Doel per level: precies 1 pin overhouden (soms moet die in het sterretje-gat eindigen).

const SQ = [[0, 1], [0, -1], [1, 0], [-1, 0]];
const TRI = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1]];

const BOARD_DEFS = {
  rij: { name: 'Rijtje', type: 'sq', rows: ['#######'] },
  plus: { name: 'Plusje', type: 'sq', rows: ['..#..', '..#..', '#####', '..#..', '..#..'] },
  vier3: { name: 'Vierkantje', type: 'sq', rows: ['###', '###', '###'] },
  vier4: { name: 'Raster', type: 'sq', rows: ['####', '####', '####', '####'] },
  drie5: { name: 'Driehoek', type: 'tri', rows: ['#', '##', '###', '####', '#####'] },
  drie6: { name: 'Grote driehoek', type: 'tri', rows: ['#', '##', '###', '####', '#####', '######'] },
  dia13: { name: 'Diamantje', type: 'sq', rows: ['..#..', '.###.', '#####', '.###.', '..#..'] },
  dia25: { name: 'Diamant', type: 'sq', rows: ['...#...', '..###..', '.#####.', '#######', '.#####.', '..###..', '...#...'] },
  pijl: { name: 'Pijl', type: 'sq', rows: ['...#...', '..###..', '.#####.', '...#...', '...#...', '...#...'] },
  kruis: { name: 'Kruis', type: 'sq', rows: ['..###..', '..###..', '#######', '#######', '#######', '..###..', '..###..'] },
};

const boardCache = {};
export function buildBoard(id) {
  if (boardCache[id]) return boardCache[id];
  const def = BOARD_DEFS[id];
  const dirs = def.type === 'tri' ? TRI : SQ;
  const cells = [];
  const map = new Map();
  def.rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] !== '#') continue;
      const x = def.type === 'tri' ? c - r / 2 : c;
      const y = def.type === 'tri' ? r * 0.866 : r;
      map.set(r + ',' + c, cells.length);
      cells.push({ r, c, x, y });
    }
  });
  const moves = [];
  const links = [];
  cells.forEach((cl, i) => {
    dirs.forEach(([dr, dc], di) => {
      const o = map.get((cl.r + dr) + ',' + (cl.c + dc));
      if (o === undefined) return;
      if (di % 2 === 0) links.push([i, o]);
      const t = map.get((cl.r + 2 * dr) + ',' + (cl.c + 2 * dc));
      if (t !== undefined) moves.push([i, o, t]);
    });
  });
  const b = { id, name: def.name, type: def.type, cells, n: cells.length, moves, links, map };
  boardCache[id] = b;
  return b;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Oplosser: diepte-eerst met geheugen van dode standen. Geeft {sol, aborted}.
export function solve(b, start, goal = -1, maxNodes = 2e6, maxMs = Infinity) {
  const st = Uint8Array.from(start);
  const w = [];
  let key = 0, cnt = 0;
  for (let i = 0; i < b.n; i++) { w.push(Math.pow(2, i)); if (st[i]) { key += w[i]; cnt++; } }
  const dead = new Set();
  const path = [];
  let nodes = 0, aborted = false;
  const t0 = Date.now();
  function rec() {
    if (cnt === 1 && (goal < 0 || st[goal])) return true;
    if (cnt === 1) return false;
    if (dead.has(key)) return false;
    nodes++;
    if (nodes > maxNodes || ((nodes & 1023) === 0 && Date.now() - t0 > maxMs)) { aborted = true; return false; }
    for (const m of b.moves) {
      if (st[m[0]] && st[m[1]] && !st[m[2]]) {
        st[m[0]] = 0; st[m[1]] = 0; st[m[2]] = 1;
        key += w[m[2]] - w[m[0]] - w[m[1]]; cnt--;
        path.push(m);
        if (rec()) return true;
        path.pop();
        st[m[0]] = 1; st[m[1]] = 1; st[m[2]] = 0;
        key -= w[m[2]] - w[m[0]] - w[m[1]]; cnt++;
        if (aborted) return false;
      }
    }
    dead.add(key);
    return false;
  }
  const ok = rec();
  return { sol: ok ? path.slice() : null, aborted };
}

// ---------- levels ----------
const CHUNKS = [
  ['rij', [2, 2, 3, 3, 4]],
  ['plus', [3, 3, 4, 4, 5]],
  ['vier3', [3, 4, 4, 5, 5]],
  ['drie5', [4, 4, 5, 5, 6]],
  ['dia13', [4, 5, 5, 6, 6]],
  ['pijl', [5, 5, 6, 6, 7]],
  'KLASSIEK_DRIEHOEK',
  ['drie5', [7, 7, 8, 8, 9]],
  ['dia25', [6, 7, 8, 8, 9]],
  ['kruis', [7, 8, 8, 9, 10]],
  ['drie6', [8, 9, 10, 10, 11]],
  ['vier4', [8, 9, 10, 10, 11]],
  ['kruis', [10, 11, 12, 13, 14]],
  'KLASSIEK_KRUIS',
];
const SPECS = [];
CHUNKS.forEach((ch) => {
  if (typeof ch === 'string') SPECS.push({ classic: ch });
  else ch[1].forEach((k) => SPECS.push({ board: ch[0], k }));
});
export const LEVEL_COUNT = SPECS.length; // 62
const ENDLESS_BOARDS = ['drie6', 'kruis', 'dia25', 'vier4', 'pijl', 'drie5'];

function generate(boardId, k, seed) {
  const b = buildBoard(boardId);
  const rnd = mulberry32(seed);
  let best = null;
  for (let attempt = 0; attempt < 400; attempt++) {
    const cur = new Uint8Array(b.n);
    const goal = Math.floor(rnd() * b.n);
    cur[goal] = 1;
    let cnt = 1;
    const rev = [];
    while (cnt < k) {
      const cand = b.moves.filter((m) => cur[m[2]] && !cur[m[0]] && !cur[m[1]]);
      if (!cand.length) break;
      const m = cand[Math.floor(rnd() * cand.length)];
      cur[m[2]] = 0; cur[m[0]] = 1; cur[m[1]] = 1; cnt++;
      rev.push(m);
    }
    if (!best || cnt > best.cnt) best = { cnt, start: Array.from(cur), sol: rev.reverse() };
    if (cnt >= k) break;
  }
  return best;
}

const levelCache = new Map();
export function makeLevel(n) {
  if (levelCache.has(n)) return levelCache.get(n);
  let lv;
  const spec = n < LEVEL_COUNT ? SPECS[n] : null;
  if (spec && spec.classic === 'KLASSIEK_DRIEHOEK') {
    const b = buildBoard('drie5');
    const start = new Array(b.n).fill(1); start[0] = 0;
    lv = { n, board: b, start, goal: -1, sol: null, k: b.n - 1, title: 'Klassieke driehoek' };
  } else if (spec && spec.classic === 'KLASSIEK_KRUIS') {
    const b = buildBoard('kruis');
    const centre = b.map.get('3,3');
    const start = new Array(b.n).fill(1); start[centre] = 0;
    lv = { n, board: b, start, goal: centre, sol: null, k: b.n - 1, title: 'Klassiek kruis' };
  } else {
    let id, k, title;
    if (spec) { id = spec.board; k = spec.k; title = buildBoard(id).name; }
    else {
      const e = n - LEVEL_COUNT;
      id = ENDLESS_BOARDS[(e * 7 + Math.floor(e / 6)) % ENDLESS_BOARDS.length];
      k = Math.min(12 + Math.floor(e / 3), 18, buildBoard(id).n - 3);
      title = 'Eindeloos · ' + buildBoard(id).name;
    }
    const g = generate(id, k, n * 7919 + 13);
    lv = { n, board: buildBoard(id), start: g.start, goal: -1, sol: g.sol, k: g.cnt, title };
  }
  levelCache.set(n, lv);
  return lv;
}

export const _logic = { BOARD_DEFS, buildBoard, makeLevel, solve, LEVEL_COUNT, SPECS };

// ---------- spel ----------
export default {
  id: 'pinnen',
  name: 'Pinnenspel',
  emoji: '📍',
  hint: 'Spring met een pin over een andere pin: die verdwijnt. Hou er maar 1 over!',
  save: 'forever',
  create(host, api) {
    host.style.touchAction = 'none';
    let dead = false;
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;background:radial-gradient(ellipse at 50% 30%,#3b2a7a,#161033 75%);color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;box-sizing:border-box;user-select:none;-webkit-user-select:none;overflow:hidden';
    host.appendChild(root);

    // ----- DOM -----
    const top = document.createElement('div');
    top.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px 14px 0;gap:8px';
    const titleBox = document.createElement('div');
    const titleEl = document.createElement('div');
    titleEl.style.cssText = 'font-size:20px;font-weight:800;line-height:1.1';
    const subEl = document.createElement('div');
    subEl.style.cssText = 'font-size:13px;opacity:.75;margin-top:2px';
    titleBox.append(titleEl, subEl);
    const starEl = document.createElement('div');
    starEl.style.cssText = 'font-size:17px;font-weight:700;background:rgba(255,255,255,.12);border-radius:14px;padding:6px 12px';
    top.append(titleBox, starEl);
    const infoEl = document.createElement('div');
    infoEl.style.cssText = 'text-align:center;font-size:15px;font-weight:600;padding:6px 14px 0;min-height:22px';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;flex:1;min-height:0';
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;touch-action:none;display:block';
    wrap.appendChild(cv);
    const msgEl = document.createElement('div');
    msgEl.style.cssText = 'position:absolute;left:12px;right:12px;bottom:6px;text-align:center;font-size:15px;font-weight:600;min-height:20px;pointer-events:none;text-shadow:0 1px 3px #000';
    wrap.appendChild(msgEl);
    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:8px;padding:8px 12px 12px;justify-content:center';
    root.append(top, infoEl, wrap, bar);

    function mkBtn(label, fn) {
      const b = document.createElement('button');
      b.style.cssText = 'flex:1;max-width:100px;border:0;border-radius:14px;padding:10px 4px;font-size:15px;font-weight:700;color:#fff;background:linear-gradient(#6d5bd0,#4a3aa8);box-shadow:0 3px 0 #2a2070;cursor:pointer;touch-action:manipulation;font-family:inherit';
      b.textContent = label;
      b.addEventListener('click', () => { if (!dead) fn(); });
      bar.appendChild(b);
      return b;
    }
    const undoBtn = mkBtn('↩️ Terug', () => undo());
    const resetBtn = mkBtn('🔄 Opnieuw', () => resetLevel());
    const hintBtn = mkBtn('💡 5', () => doHint());
    const listBtn = mkBtn('📋 Levels', () => openList());

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:none;align-items:center;justify-content:center;background:rgba(10,6,30,.72);z-index:5';
    root.appendChild(overlay);

    // ----- geluid -----
    let ac = null;
    function audio() {
      if (ac === null) {
        try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = false; }
      }
      if (ac && ac.state === 'suspended') { try { ac.resume(); } catch (e) { /* niets */ } }
      return ac;
    }
    function tone(f, d = 0.12, type = 'sine', vol = 0.05, delay = 0, slide = 0) {
      const a = audio();
      if (!a) return;
      try {
        const t = a.currentTime + delay;
        const o = a.createOscillator(), g = a.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f, t);
        if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g); g.connect(a.destination);
        o.start(t); o.stop(t + d + 0.03);
      } catch (e) { /* niets */ }
    }
    const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
    const noteF = (i) => 330 * Math.pow(2, SCALE[Math.min(i, SCALE.length - 1)] / 12);

    // ----- toestand -----
    let lv = null, board = null, pegs = [], hue = [], hist = [];
    let sel = -1, hintMove = null, hintUntil = 0;
    let usedHint = false, usedUndo = false, won = false, stuck = false;
    let chain = 0, lastPeg = -1;
    let anim = null, drag = null;
    let ready = false;
    let cur = 0, maxL = 0, starsStr = '', extra = 0, hints = 5;
    const fx = [], parts = [];
    let msgTimer = 0;

    const starsOf = (i) => (i < starsStr.length ? +starsStr[i] || 0 : 0);
    const totalStars = () => { let s = extra; for (let i = 0; i < starsStr.length; i++) s += +starsStr[i] || 0; return s; };
    function persist() {
      if (!ready) return;
      try { api.save({ l: cur, m: maxL, s: starsStr, e: extra, h: hints }); } catch (e) { /* niets */ }
    }
    function updateTop() {
      const n = cur + 1;
      titleEl.textContent = 'Level ' + n;
      subEl.textContent = lv ? lv.title : '';
      starEl.textContent = '⭐ ' + totalStars();
      hintBtn.textContent = '💡 ' + hints;
      hintBtn.style.opacity = hints > 0 ? '1' : '.5';
      undoBtn.style.opacity = hist.length && !anim ? '1' : '.5';
      const left = pegs.reduce((a, v) => a + v, 0);
      infoEl.textContent = lv ? ('Pinnen: ' + left + '  ·  ' + (lv.goal >= 0 ? 'Laatste pin in het sterretje ⭐' : 'Hou er 1 over')) : '';
    }
    function say(t, ms = 0) {
      msgEl.textContent = t;
      clearTimeout(msgTimer);
      if (ms) msgTimer = setTimeout(() => { msgEl.textContent = ''; }, ms);
    }

    // ----- level laden -----
    function loadLevel(n) {
      cur = n;
      lv = makeLevel(n);
      board = lv.board;
      pegs = lv.start.slice();
      hue = pegs.map((_, i) => (i * 53 + n * 29) % 360);
      hist = []; sel = -1; hintMove = null; usedHint = false; usedUndo = false;
      won = false; stuck = false; chain = 0; lastPeg = -1; anim = null; drag = null;
      fx.length = 0;
      overlay.style.display = 'none';
      say('', 0);
      layout();
      updateTop();
      api.score(totalStars());
      persist();
      checkStuck(true);
    }
    function resetLevel() {
      if (!lv || anim) return;
      pegs = lv.start.slice();
      hue = pegs.map((_, i) => (i * 53 + cur * 29) % 360);
      hist = []; sel = -1; hintMove = null; won = false; stuck = false; chain = 0; lastPeg = -1;
      overlay.style.display = 'none';
      say('Opnieuw!', 900);
      tone(300, 0.18, 'triangle', 0.04, 0, 1.5);
      updateTop();
    }

    // ----- zetten -----
    const movesFrom = (i) => board.moves.filter((m) => m[0] === i && pegs[m[1]] && !pegs[m[2]] && pegs[i]);
    const anyMove = () => board.moves.some((m) => pegs[m[0]] && pegs[m[1]] && !pegs[m[2]]);

    function jump(m) {
      if (anim || won) return;
      const [a, o, t] = m;
      const now = performance.now();
      const h = hue[a], ho = hue[o];
      pegs[a] = 0; pegs[o] = 0; pegs[t] = 1; hue[t] = h;
      hist.push({ m, h, ho });
      chain = lastPeg === a ? chain + 1 : 0;
      lastPeg = t;
      sel = -1; hintMove = null; stuck = false; say('');
      anim = { from: a, to: t, t0: now, dur: 260, h };
      fx.push({ cell: o, h: ho, t0: now, dur: 320 });
      tone(noteF(chain), 0.14, 'sine', 0.055, 0, 1.15);
      tone(noteF(chain) * 2, 0.08, 'triangle', 0.025, 0.12);
      updateTop();
    }
    function landed() {
      const c = cellXY(anim.to);
      burst(c.x, c.y, anim.h, 8, 0.7);
      const oc = cellXY(fx.length ? fx[fx.length - 1].cell : anim.to);
      burst(oc.x, oc.y, 50, 6, 0.5);
      anim = null;
      updateTop();
      checkEnd();
    }
    function checkEnd() {
      const left = pegs.reduce((a, v) => a + v, 0);
      if (left === 1 && (lv.goal < 0 || pegs[lv.goal])) return win();
      checkStuck(false);
    }
    function checkStuck(silent) {
      const left = pegs.reduce((a, v) => a + v, 0);
      if (left === 1 || !anyMove()) {
        stuck = true;
        if (!silent) tone(200, 0.35, 'sawtooth', 0.03, 0, 0.6);
        say(left === 1 ? 'De laatste pin moet in het sterretje. Probeer het anders!' : 'Vast! ' + left + ' pinnen over. Tik ↩️ of 🔄', 0);
      }
    }
    function undo() {
      if (anim || won || !hist.length) return;
      const e = hist.pop();
      const [a, o, t] = e.m;
      pegs[t] = 0; pegs[a] = 1; pegs[o] = 1; hue[a] = e.h; hue[o] = e.ho;
      usedUndo = true; sel = -1; hintMove = null; stuck = false; chain = 0; lastPeg = -1;
      say('');
      const c = cellXY(o);
      burst(c.x, c.y, e.ho, 6, 0.4);
      tone(420, 0.12, 'triangle', 0.04, 0, 0.7);
      updateTop();
    }

    // ----- hint -----
    function doHint() {
      if (anim || won) return;
      if (hints <= 0) { say('Geen hints meer. Haal een level om er een te verdienen! 💡', 2200); return; }
      let m = null;
      // 1: de bewaarde oplossing, als de stand daarbij past
      if (lv.sol) {
        const st = lv.start.slice();
        const same = () => st.every((v, i) => v === pegs[i]);
        for (let i = 0; i <= lv.sol.length; i++) {
          if (same()) { m = lv.sol[i] || null; break; }
          const s = lv.sol[i]; if (!s) break;
          st[s[0]] = 0; st[s[1]] = 0; st[s[2]] = 1;
        }
      }
      if (!m) {
        const r = solve(board, pegs, lv.goal, 4e5, 900);
        if (r.sol && r.sol.length) m = r.sol[0];
        else {
          say(r.aborted ? 'Hmm, dit is lastig te zien. Probeer ↩️ of 🔄.' : 'Hier kom je niet meer uit. Tik ↩️ of 🔄!', 2800);
          tone(220, 0.2, 'triangle', 0.03);
          return;
        }
      }
      hints--; usedHint = true; hintMove = m; hintUntil = performance.now() + 3500; sel = m[0];
      tone(880, 0.1, 'sine', 0.04); tone(1175, 0.14, 'sine', 0.035, 0.09);
      say('Spring met de oplichtende pin 💡', 2500);
      updateTop(); persist();
    }

    // ----- winnen -----
    function win() {
      won = true;
      const stars = usedHint ? 1 : usedUndo ? 2 : 3;
      if (cur < LEVEL_COUNT) {
        const arr = starsStr.padEnd(cur + 1, '0').split('');
        arr[cur] = String(Math.max(+arr[cur] || 0, stars));
        starsStr = arr.join('');
      } else if (cur === maxL) extra += stars;
      if (cur + 1 > maxL) maxL = cur + 1;
      if (hints < 8) hints++;
      api.score(totalStars());
      updateTop(); persist();
      [0, 4, 7, 12].forEach((s, i) => tone(392 * Math.pow(2, s / 12), 0.22, 'triangle', 0.05, i * 0.1));
      tone(1568, 0.4, 'sine', 0.035, 0.45);
      confetti();
      setTimeout(() => { if (!dead) showWin(stars); }, 650);
    }
    function overlayCard() {
      overlay.textContent = '';
      const card = document.createElement('div');
      card.style.cssText = 'background:linear-gradient(#4b3aa8,#2b1f6e);border-radius:22px;padding:22px 24px;text-align:center;max-width:300px;width:82%;box-shadow:0 10px 40px rgba(0,0,0,.5);max-height:86%;overflow:auto;box-sizing:border-box';
      overlay.appendChild(card);
      overlay.style.display = 'flex';
      return card;
    }
    function ovBtn(parent, label, fn, primary) {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'display:block;width:100%;margin-top:10px;border:0;border-radius:14px;padding:12px;font-size:17px;font-weight:800;color:#fff;font-family:inherit;cursor:pointer;touch-action:manipulation;background:' + (primary ? 'linear-gradient(#34d399,#059669)' : 'rgba(255,255,255,.16)');
      b.addEventListener('click', () => { if (!dead) fn(); });
      parent.appendChild(b);
    }
    function showWin(stars) {
      const card = overlayCard();
      const h = document.createElement('div');
      h.style.cssText = 'font-size:26px;font-weight:900';
      h.textContent = ['', 'Gelukt! 🙂', 'Lekker bezig! 😃', 'Perfect! 🤩'][stars];
      const s = document.createElement('div');
      s.style.cssText = 'font-size:44px;margin:10px 0 2px;letter-spacing:4px';
      s.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
      const t = document.createElement('div');
      t.style.cssText = 'font-size:14px;opacity:.8';
      t.textContent = stars === 3 ? 'Zonder hulp of terugdraaien!' : stars === 2 ? 'Met terugdraaien. Zonder kan 3 ⭐.' : 'Met een hint. Zonder hint kan 3 ⭐.';
      card.append(h, s, t);
      ovBtn(card, 'Volgend level ▶', () => loadLevel(cur + 1), true);
      ovBtn(card, 'Nog eens', () => { overlay.style.display = 'none'; won = false; resetLevel(); }, false);
    }
    function openList() {
      if (anim) return;
      const card = overlayCard();
      const h = document.createElement('div');
      h.style.cssText = 'font-size:20px;font-weight:800;margin-bottom:10px';
      h.textContent = 'Kies een level';
      card.appendChild(h);
      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(5,1fr);gap:6px';
      const upto = Math.min(maxL, LEVEL_COUNT - 1);
      for (let i = 0; i < LEVEL_COUNT; i++) {
        const b = document.createElement('button');
        const open = i <= upto;
        const st = starsOf(i);
        b.style.cssText = 'border:0;border-radius:10px;padding:6px 0;font-size:15px;font-weight:800;color:#fff;font-family:inherit;touch-action:manipulation;cursor:' + (open ? 'pointer' : 'default') + ';background:' + (i === cur ? '#f59e0b' : open ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.06)') + ';opacity:' + (open ? 1 : 0.4);
        const num = document.createElement('div'); num.textContent = open ? String(i + 1) : '🔒';
        const stx = document.createElement('div'); stx.style.cssText = 'font-size:9px;height:11px'; stx.textContent = st ? '⭐'.repeat(st) : '';
        b.append(num, stx);
        if (open) b.addEventListener('click', () => { if (!dead) loadLevel(i); });
        grid.appendChild(b);
      }
      card.appendChild(grid);
      if (maxL >= LEVEL_COUNT) ovBtn(card, '♾️ Eindeloos: level ' + (maxL + 1), () => loadLevel(maxL), true);
      ovBtn(card, 'Terug naar het spel', () => { overlay.style.display = 'none'; }, false);
    }

    // ----- tekenen -----
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, sp = 40, ox = 0, oy = 0, minx = 0, miny = 0;
    function layout() {
      W = wrap.clientWidth || api.w; H = wrap.clientHeight || api.h * 0.7;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      if (!board) return;
      let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
      board.cells.forEach((c) => { mnx = Math.min(mnx, c.x); mxx = Math.max(mxx, c.x); mny = Math.min(mny, c.y); mxy = Math.max(mxy, c.y); });
      const bw = mxx - mnx + 1.3, bh = mxy - mny + 1.3;
      sp = Math.max(20, Math.min((W - 16) / bw, (H - 40) / bh, 70));
      minx = mnx; miny = mny;
      ox = (W - (mxx - mnx) * sp) / 2;
      oy = (H - 26 - (mxy - mny) * sp) / 2 + 4;
    }
    function cellXY(i) {
      const c = board.cells[i];
      return { x: ox + (c.x - minx) * sp, y: oy + (c.y - miny) * sp };
    }
    function cellAt(px, py) {
      let best = -1, bd = sp * 0.62;
      for (let i = 0; i < board.n; i++) {
        const p = cellXY(i);
        const d = Math.hypot(p.x - px, p.y - py);
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    }
    function burst(x, y, h, n, power) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.283, v = (40 + Math.random() * 90) * power * (sp / 50);
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: 0, max: 0.5 + Math.random() * 0.4, col: 'hsl(' + h + ',90%,65%)', size: 2 + Math.random() * 3, txt: null, rot: 0, vr: 0 });
      }
    }
    function confetti() {
      const cols = [0, 40, 120, 190, 270, 320];
      for (let i = 0; i < 70; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = 160 + Math.random() * 320;
        parts.push({ x: W / 2, y: H * 0.55, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 1.4 + Math.random() * 1, col: 'hsl(' + cols[i % cols.length] + ',90%,60%)', size: 4 + Math.random() * 4, txt: i % 7 === 0 ? '⭐' : null, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12 });
      }
    }
    function drawPeg(x, y, r, h, lift, alpha = 1, glow = false) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.beginPath(); ctx.ellipse(x + 2, y + r * 0.55 + 1, r * 0.9, r * 0.45, 0, 0, 6.283); ctx.fill();
      if (glow) { ctx.shadowColor = 'hsl(' + h + ',100%,70%)'; ctx.shadowBlur = 16; }
      const yy = y - lift;
      const g = ctx.createRadialGradient(x - r * 0.35, yy - r * 0.4, r * 0.1, x, yy, r);
      g.addColorStop(0, 'hsl(' + h + ',95%,82%)');
      g.addColorStop(0.55, 'hsl(' + h + ',80%,55%)');
      g.addColorStop(1, 'hsl(' + h + ',75%,35%)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, yy, r, 0, 6.283); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath(); ctx.ellipse(x - r * 0.32, yy - r * 0.38, r * 0.25, r * 0.15, -0.6, 0, 6.283); ctx.fill();
      ctx.restore();
    }
    let lastT = performance.now(), raf = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      if (!board || !W) return;
      if (anim && now - anim.t0 >= anim.dur) landed();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // plaat
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,.35)';
      ctx.lineWidth = sp * 0.95;
      ctx.beginPath();
      board.links.forEach(([a, b]) => { const p = cellXY(a), q = cellXY(b); ctx.moveTo(p.x + 2, p.y + 5); ctx.lineTo(q.x + 2, q.y + 5); });
      board.cells.forEach((_, i) => { const p = cellXY(i); ctx.moveTo(p.x + 2, p.y + 5); ctx.lineTo(p.x + 2.1, p.y + 5); });
      ctx.stroke();
      ctx.strokeStyle = '#a8703a';
      ctx.lineWidth = sp * 0.95;
      ctx.beginPath();
      board.links.forEach(([a, b]) => { const p = cellXY(a), q = cellXY(b); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); });
      board.cells.forEach((_, i) => { const p = cellXY(i); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 0.1, p.y); });
      ctx.stroke();
      ctx.strokeStyle = '#c28a50';
      ctx.lineWidth = sp * 0.86;
      ctx.stroke();
      // gaten
      for (let i = 0; i < board.n; i++) {
        const p = cellXY(i);
        const g = ctx.createRadialGradient(p.x, p.y + 2, 1, p.x, p.y, sp * 0.3);
        g.addColorStop(0, '#2a1608'); g.addColorStop(1, '#5c3a1c');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, sp * 0.29, 0, 6.283); ctx.fill();
        if (i === lv.goal) {
          ctx.fillStyle = '#fde047'; ctx.font = Math.round(sp * 0.4) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('⭐', p.x, p.y + 1);
        }
      }
      // bestemmingen
      const pulse = 0.5 + 0.5 * Math.sin(now / 160);
      let dests = [];
      if (sel >= 0 && !won) dests = movesFrom(sel);
      if (hintMove && now > hintUntil) hintMove = null;
      dests.forEach((m) => {
        const p = cellXY(m[2]);
        const isHint = hintMove && hintMove[0] === m[0] && hintMove[2] === m[2];
        ctx.strokeStyle = isHint ? '#fde047' : '#4ade80';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 + 0.5 * pulse;
        ctx.beginPath(); ctx.arc(p.x, p.y, sp * (0.31 + 0.06 * pulse), 0, 6.283); ctx.stroke();
        ctx.fillStyle = isHint ? 'rgba(253,224,71,.25)' : 'rgba(74,222,128,.22)';
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      // pinnen
      const r = sp * 0.36;
      for (let i = 0; i < board.n; i++) {
        if (!pegs[i]) continue;
        if (anim && anim.to === i) continue;
        if (drag && drag.moved && drag.cell === i) continue;
        const p = cellXY(i);
        const isSel = sel === i;
        const isHintPeg = hintMove && hintMove[0] === i;
        const lift = isSel ? 4 + 2 * pulse : 0;
        drawPeg(p.x, p.y, r, hue[i], lift, 1, isSel || isHintPeg);
      }
      // gepakte pinnen die verdwijnen
      for (let k = fx.length - 1; k >= 0; k--) {
        const f = fx[k];
        const q = (now - f.t0) / f.dur;
        if (q >= 1) { fx.splice(k, 1); continue; }
        const p = cellXY(f.cell);
        ctx.save();
        ctx.translate(p.x, p.y - q * sp * 0.4);
        ctx.rotate(q * 3);
        drawPeg(0, 0, r * (1 - q * 0.8), f.h, 0, 1 - q);
        ctx.restore();
      }
      // springende pin
      if (anim) {
        const q = Math.min(1, (now - anim.t0) / anim.dur);
        const e = q * q * (3 - 2 * q);
        const a = cellXY(anim.from), b = cellXY(anim.to);
        const x = a.x + (b.x - a.x) * e, y = a.y + (b.y - a.y) * e;
        drawPeg(x, y, r * (1 + 0.18 * Math.sin(q * Math.PI)), anim.h, Math.sin(q * Math.PI) * sp * 0.6, 1, true);
      }
      // slepende pin
      if (drag && drag.moved) {
        drawPeg(drag.x, drag.y, r * 1.12, hue[drag.cell], 10, 1, true);
      }
      // deeltjes
      for (let k = parts.length - 1; k >= 0; k--) {
        const pt = parts[k];
        pt.life += dt;
        if (pt.life >= pt.max) { parts.splice(k, 1); continue; }
        pt.vy += 520 * dt;
        pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.rot += pt.vr * dt;
        ctx.globalAlpha = Math.max(0, 1 - pt.life / pt.max);
        if (pt.txt) {
          ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(pt.txt, pt.x, pt.y);
        } else {
          ctx.save(); ctx.translate(pt.x, pt.y); ctx.rotate(pt.rot);
          ctx.fillStyle = pt.col; ctx.fillRect(-pt.size, -pt.size * 0.6, pt.size * 2, pt.size * 1.2);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }
    }

    // ----- invoer -----
    function evPos(e) {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (W / (r.width || W)), y: (e.clientY - r.top) * (H / (r.height || H)) };
    }
    function tryJumpTo(cell) {
      if (sel < 0 || cell < 0) return false;
      const m = movesFrom(sel).find((x) => x[2] === cell);
      if (!m) return false;
      jump(m);
      return true;
    }
    cv.addEventListener('pointerdown', (e) => {
      if (dead || anim || won || !board) return;
      audio();
      const p = evPos(e);
      const c = cellAt(p.x, p.y);
      if (c < 0) { sel = -1; return; }
      if (pegs[c]) {
        if (!movesFrom(c).length) {
          sel = -1; tone(180, 0.12, 'triangle', 0.03);
          say('Deze pin kan nergens heen', 1200);
          return;
        }
        const was = sel === c;
        sel = c;
        drag = { cell: c, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false, was };
        try { cv.setPointerCapture(e.pointerId); } catch (err) { /* niets */ }
        tone(520, 0.05, 'sine', 0.025);
      } else if (!tryJumpTo(c)) {
        sel = -1;
      }
    });
    cv.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const p = evPos(e);
      drag.x = p.x; drag.y = p.y;
      if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) > 8) drag.moved = true;
    });
    function endDrag(e, cancel) {
      if (!drag) return;
      const d = drag; drag = null;
      if (cancel || anim || dead) return;
      const p = evPos(e);
      if (d.moved) {
        tryJumpTo(cellAt(p.x, p.y));
      } else if (d.was) {
        sel = -1;
      }
    }
    cv.addEventListener('pointerup', (e) => endDrag(e, false));
    cv.addEventListener('pointercancel', (e) => endDrag(e, true));

    function onKey(e) {
      if (dead) return;
      if (e.key === 'z' || e.key === 'Backspace') undo();
      else if (e.key === 'r') resetLevel();
      else if (e.key === 'h') doHint();
    }
    window.addEventListener('keydown', onKey);
    let ro = null;
    const onResize = () => layout();
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(onResize); ro.observe(wrap); }
    else window.addEventListener('resize', onResize);

    // ----- start -----
    api.score(0);
    titleEl.textContent = 'Pinnenspel';
    subEl.textContent = 'Laden…';
    function start(saved) {
      if (saved && typeof saved === 'object') {
        maxL = Math.max(0, Math.floor(+saved.m) || 0);
        starsStr = typeof saved.s === 'string' ? saved.s.replace(/[^0-3]/g, '').slice(0, LEVEL_COUNT) : '';
        extra = Math.max(0, Math.floor(+saved.e) || 0);
        hints = Math.min(8, Math.max(0, saved.h === undefined ? 5 : Math.floor(+saved.h) || 0));
        cur = Math.min(Math.max(0, Math.floor(+saved.l) || 0), maxL);
      }
      ready = true;
      layout();
      loadLevel(cur);
    }
    layout();
    let loaded = false;
    const begin = (s) => { if (dead || loaded) return; loaded = true; start(s); };
    try {
      Promise.resolve(api.load()).then(begin, () => begin(null));
    } catch (e) { begin(null); }
    raf = requestAnimationFrame(frame);

    return {
      destroy() {
        dead = true;
        cancelAnimationFrame(raf);
        clearTimeout(msgTimer);
        window.removeEventListener('keydown', onKey);
        if (ro) ro.disconnect(); else window.removeEventListener('resize', onResize);
        persist();
        if (ac) { try { ac.close(); } catch (e) { /* niets */ } }
        parts.length = 0; fx.length = 0;
        root.remove();
      },
    };
  },
};
