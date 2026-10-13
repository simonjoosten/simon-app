// Verbind de kleuren - flow-achtig lijnenpuzzelspel.
// Let op: de pure logica (levelgenerator, solver, bord) wordt ook door tools/test-mini-verbind.mjs getest,
// dus bovenin staat GEEN DOM-gebruik.

const FIXED_LEVELS = 60;
const PALETTE = ['#ef4444', '#3b82f6', '#22c55e', '#facc15', '#f97316', '#22d3ee', '#d946ef', '#fb7185', '#a3e635', '#8b5cf6', '#b45309', '#f1f5f9'];
const NOTES = [392, 440, 494, 523, 587, 659, 698, 784, 880];

/* ---------- level-parameters ---------- */
export function levelParams(i) {
  if (i >= FIXED_LEVELS) { const n = 8 + (i % 2); return { n, k: n === 8 ? 10 + (i % 3) : 12 }; }
  if (i < 10) return { n: 5, k: 4 + Math.floor(i / 5) };
  if (i < 24) return { n: 6, k: 6 + Math.floor((i - 10) / 7) };
  if (i < 40) return { n: 7, k: 8 + Math.floor((i - 24) / 8) };
  if (i < 54) return { n: 8, k: 10 + Math.floor((i - 40) / 7) };
  return { n: 9, k: 12 };
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function neighbors(n) {
  const nb = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const a = [];
    if (r > 0) a.push((r - 1) * n + c);
    if (r < n - 1) a.push((r + 1) * n + c);
    if (c > 0) a.push(r * n + c - 1);
    if (c < n - 1) a.push(r * n + c + 1);
    nb.push(a);
  }
  return nb;
}

/* ---------- solver (telt oplossingen tot 'limit') ---------- */
export function solve(n, ends, limit = 2, budget = Infinity) {
  const T = n * n, K = ends.length, nb = neighbors(n);
  const owner = new Int8Array(T).fill(-1);
  const head = new Int16Array(K), tgt = new Int16Array(K), done = new Uint8Array(K);
  const paths = ends.map(([a]) => [a]);
  ends.forEach(([a, b], c) => { head[c] = a; tgt[c] = b; owner[a] = c; owner[b] = c; });
  let empty = T - 2 * K, count = 0, nodes = 0, aborted = false, sol = null;
  const seen = new Int32Array(T); let stamp = 0;
  const queue = new Int16Array(T);

  function prune() {
    for (let e = 0; e < T; e++) {
      if (owner[e] !== -1) continue;
      let open = 0;
      const a = nb[e];
      for (let q = 0; q < a.length; q++) {
        const m = a[q], o = owner[m];
        if (o === -1) open++;
        else if (!done[o] && (head[o] === m || tgt[o] === m)) open++;
      }
      if (open < 2) return false;
    }
    for (let c = 0; c < K; c++) {
      if (done[c]) continue;
      const t = tgt[c];
      let ok = false;
      stamp++;
      let qh = 0, qt = 0;
      const h = head[c];
      for (const m of nb[h]) { if (m === t) ok = true; else if (owner[m] === -1) { seen[m] = stamp; queue[qt++] = m; } }
      while (!ok && qh < qt) {
        const x = queue[qh++];
        for (const m of nb[x]) {
          if (m === t) { ok = true; break; }
          if (owner[m] === -1 && seen[m] !== stamp) { seen[m] = stamp; queue[qt++] = m; }
        }
      }
      if (!ok) return false;
    }
    return true;
  }

  function rec() {
    if (aborted || count >= limit) return;
    if (++nodes > budget) { aborted = true; return; }
    let bc = -1, bn = 99;
    for (let c = 0; c < K; c++) {
      if (done[c]) continue;
      let cnt = 0;
      for (const m of nb[head[c]]) if (owner[m] === -1 || m === tgt[c]) cnt++;
      if (cnt === 0) return;
      if (cnt < bn) { bn = cnt; bc = c; }
    }
    if (bc < 0) {
      if (empty === 0) { count++; if (!sol) sol = paths.map((p) => p.slice()); }
      return;
    }
    const c = bc, h = head[c];
    for (const m of nb[h]) {
      if (m === tgt[c]) {
        done[c] = 1; head[c] = m; paths[c].push(m);
        if (prune()) rec();
        paths[c].pop(); head[c] = h; done[c] = 0;
      } else if (owner[m] === -1) {
        owner[m] = c; head[c] = m; paths[c].push(m); empty--;
        if (prune()) rec();
        empty++; paths[c].pop(); head[c] = h; owner[m] = -1;
      }
      if (aborted || count >= limit) return;
    }
  }
  if (prune()) rec();
  return { count, nodes, aborted, sol };
}

/* ---------- level-generator: Hamiltonpad (backbite) in k stukken knippen ---------- */
function hamPath(n, rnd) {
  const T = n * n, p = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) p.push(r * n + (r % 2 ? n - 1 - c : c));
  const pos = new Int16Array(T);
  p.forEach((v, i) => { pos[v] = i; });
  const nb = neighbors(n);
  const rev = (a, b) => {
    while (a < b) { const t = p[a]; p[a] = p[b]; p[b] = t; pos[p[a]] = a; pos[p[b]] = b; a++; b--; }
  };
  for (let it = 0; it < T * 40; it++) {
    if (rnd() < 0.5) {
      const nbs = nb[p[T - 1]], m = nbs[Math.floor(rnd() * nbs.length)], j = pos[m];
      if (j === T - 2) continue;
      rev(j + 1, T - 1);
    } else {
      const nbs = nb[p[0]], m = nbs[Math.floor(rnd() * nbs.length)], j = pos[m];
      if (j === 1) continue;
      rev(0, j - 1);
    }
  }
  return p;
}

function candidate(n, k, rnd) {
  const T = n * n, minL = n >= 6 ? 3 : 2;
  const p = hamPath(n, rnd);
  const lens = new Array(k).fill(minL);
  for (let r = T - k * minL; r > 0; r--) lens[Math.floor(rnd() * k)]++;
  const sol = [];
  let at = 0;
  for (let c = 0; c < k; c++) { sol.push(p.slice(at, at + lens[c])); at += lens[c]; }
  // kleur-volgorde door elkaar
  for (let i = sol.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [sol[i], sol[j]] = [sol[j], sol[i]]; }
  for (const s of sol) if (rnd() < 0.5) s.reverse();
  return { n, ends: sol.map((s) => [s[0], s[s.length - 1]]), sol };
}

// Vooraf (offline) gezochte pogingnummers waarvoor het level bewezen EEN unieke oplossing heeft.
const SEEDS = [39,  28,  6,  0,  2,  3,  3,  0,  8,  6,  16,  3,  13,  6,  63,  6,  6,  5,  8,  8,  6,  6,  13,  5,  24,  68,  200,  157,  23,  25,  45,  6,  31,  68,  12,  19,  37,  41,  13,  60,  476,  494,  2017,  424,  309,  231,  787,  132,  65,  43,  55,  153,  352,  207,  7103,  9476,  22370,  3365,  11914,  1978,  1693,  -1,  19,  21482,  49,  277,  115,  9114,  60,  7923,  487,  7274,  474,  1707,  123,  696,  563,  5543,  105,  28938,  122,  19026,  152,  12671,  349,  16547,  81,  12015,  401,  8552,  2030,  2032,  164,  10070,  297,  20549,  28,  18227,  146,  10763];

function build(i, a) {
  const P = levelParams(i);
  return candidate(P.n, P.k, mulberry32(i * 7919 + a * 104729 + 12345));
}

export function genLevel(i, opts = {}) {
  if (!opts.search && SEEDS[i] >= 0) { const lv = build(i, SEEDS[i]); lv.unique = true; lv.attempts = SEEDS[i] + 1; return lv; }
  const maxAttempts = opts.maxAttempts || 40, budget = opts.budget || 3000;
  let fallback = null;
  for (let a = 0; a < maxAttempts; a++) {
    const lv = build(i, a);
    if (!fallback) fallback = lv;
    const res = solve(lv.n, lv.ends, 2, budget);
    if (!res.aborted && res.count === 1) { lv.unique = true; lv.attempts = a + 1; return lv; }
    if (opts.stopAfter && Date.now() > opts.stopAfter) break;
  }
  fallback.unique = false; fallback.attempts = maxAttempts;
  return fallback;
}

/* ---------- bord-model (invoer + regels) ---------- */
export function makeBoard(lv) {
  const N = lv.n, T = N * N, K = lv.ends.length;
  const endOf = new Int8Array(T).fill(-1);
  lv.ends.forEach(([a, b], c) => { endOf[a] = c; endOf[b] = c; });
  let paths = lv.ends.map(() => []);
  const owner = new Int8Array(T).fill(-1);
  let active = -1;
  const adj = (a, b) => { const d = Math.abs(a - b); return (d === 1 && Math.floor(a / N) === Math.floor(b / N)) || d === N; };
  const truncate = (c, len) => { const p = paths[c]; while (p.length > len) owner[p.pop()] = -1; };
  const complete = (c) => { const p = paths[c]; return p.length >= 2 && p[0] !== p[p.length - 1] && endOf[p[p.length - 1]] === c; };
  const b = {
    N, T, K, ends: lv.ends,
    get paths() { return paths; },
    owner, endOf,
    complete,
    head() { return active >= 0 ? paths[active][paths[active].length - 1] : -1; },
    get active() { return active; },
    release() { active = -1; },
    start(cell) {
      const c = endOf[cell];
      if (c >= 0) {
        const p = paths[c];
        if (!(complete(c) && p[p.length - 1] === cell)) { truncate(c, 0); p.push(cell); owner[cell] = c; }
        active = c; return true;
      }
      const o = owner[cell];
      if (o >= 0) { truncate(o, paths[o].indexOf(cell) + 1); active = o; return true; }
      return false;
    },
    // 0 = niets, 1 = gezet/teruggetrokken, 2 = gezet en andere lijn afgesneden
    step(cell) {
      const c = active; if (c < 0) return 0;
      const p = paths[c], h = p[p.length - 1];
      if (!adj(h, cell)) return 0;
      if (p.length >= 2 && cell === p[p.length - 2]) { owner[p.pop()] = -1; return 1; }
      if (owner[cell] === c) { truncate(c, p.indexOf(cell) + 1); return 1; }
      if (complete(c)) return 0;
      if (endOf[cell] >= 0 && endOf[cell] !== c) return 0;
      let res = 1;
      const o = owner[cell];
      if (o >= 0 && o !== c) { truncate(o, paths[o].indexOf(cell)); res = 2; }
      p.push(cell); owner[cell] = c;
      return res;
    },
    forcePath(c, arr) {
      truncate(c, 0);
      for (const cell of arr) {
        const o = owner[cell];
        if (o >= 0 && o !== c) truncate(o, paths[o].indexOf(cell));
        paths[c].push(cell); owner[cell] = c;
      }
    },
    filled() { let s = 0; for (const p of paths) s += p.length; return s; },
    connected() { let s = 0; for (let c = 0; c < K; c++) if (complete(c)) s++; return s; },
    won() { return b.connected() === K && b.filled() === T; },
    snapshot() { return paths.map((p) => p.slice()); },
    restore(s) {
      owner.fill(-1);
      paths = s.map((p) => p.slice());
      paths.forEach((p, c) => p.forEach((x) => { owner[x] = c; }));
      active = -1;
    },
    reset() { b.restore(lv.ends.map(() => [])); },
  };
  return b;
}

export function starsFor(K, moves, hintUsed) {
  let s = moves <= Math.ceil(K * 1.6) + 1 ? 3 : moves <= K * 3 + 2 ? 2 : 1;
  if (hintUsed) s = Math.min(s, 2);
  return s;
}

/* ---------- het spel ---------- */
export default {
  id: 'verbind',
  name: 'Verbind de kleuren',
  emoji: '🔗',
  hint: 'Sleep van stip naar stip met dezelfde kleur en vul het hele raster',
  save: 'forever',
  create(host, api) {
    host.style.touchAction = 'none';
    let dead = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); };

    /* DOM */
    const css = (e, s) => { e.style.cssText = s; return e; };
    const root = css(document.createElement('div'), 'position:absolute;left:0;top:0;width:100%;height:100%;background:linear-gradient(160deg,#0b1020,#1e1b4b 60%,#312e81);color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;box-sizing:border-box;user-select:none;-webkit-user-select:none;overflow:hidden');
    const style = document.createElement('style');
    style.textContent = '@keyframes vbpop{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}.vbbtn{border:0;border-radius:14px;color:#fff;font-size:15px;font-weight:700;padding:10px 12px;cursor:pointer;touch-action:manipulation;font-family:inherit;background:rgba(255,255,255,.12);transition:transform .1s,background .15s}.vbbtn:active{transform:scale(.94)}.vbbtn[disabled]{opacity:.35;cursor:default}';
    root.appendChild(style);
    const header = css(document.createElement('div'), 'display:flex;align-items:center;justify-content:space-between;gap:6px;padding:10px 10px 4px;flex:none');
    const bPrev = css(document.createElement('button'), ''); bPrev.className = 'vbbtn'; bPrev.textContent = '◀';
    const bNext = css(document.createElement('button'), ''); bNext.className = 'vbbtn'; bNext.textContent = '▶';
    const titleBox = css(document.createElement('div'), 'text-align:center;flex:1;min-width:0');
    const title = css(document.createElement('div'), 'font-size:19px;font-weight:800;white-space:nowrap');
    const starsEl = css(document.createElement('div'), 'font-size:13px;opacity:.85;height:17px');
    titleBox.append(title, starsEl);
    const bSound = css(document.createElement('button'), ''); bSound.className = 'vbbtn'; bSound.textContent = '🔊';
    header.append(bPrev, titleBox, bNext, bSound);
    const status = css(document.createElement('div'), 'text-align:center;font-size:14px;min-height:20px;padding:0 12px;flex:none;opacity:.92');
    const area = css(document.createElement('div'), 'position:relative;flex:1;min-height:0');
    const canvas = css(document.createElement('canvas'), 'position:absolute;left:0;top:0;width:100%;height:100%;touch-action:none;display:block');
    area.appendChild(canvas);
    const footer = css(document.createElement('div'), 'display:flex;gap:8px;justify-content:center;padding:6px 10px 14px;flex:none');
    const bUndo = css(document.createElement('button'), ''); bUndo.className = 'vbbtn'; bUndo.textContent = '↩️ Ongedaan';
    const bReset = css(document.createElement('button'), ''); bReset.className = 'vbbtn'; bReset.textContent = '🔄 Opnieuw';
    const bHint = css(document.createElement('button'), ''); bHint.className = 'vbbtn'; bHint.textContent = '💡 Hint';
    footer.append(bUndo, bReset, bHint);
    const overlay = css(document.createElement('div'), 'position:absolute;left:0;top:0;width:100%;height:100%;display:none;align-items:center;justify-content:center;pointer-events:none');
    const card = css(document.createElement('div'), 'pointer-events:auto;background:rgba(15,23,42,.94);border:2px solid rgba(255,255,255,.2);border-radius:22px;padding:18px 24px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.5);animation:vbpop .4s ease-out both');
    const cardTitle = css(document.createElement('div'), 'font-size:24px;font-weight:800');
    const cardStars = css(document.createElement('div'), 'font-size:38px;margin:6px 0');
    const cardInfo = css(document.createElement('div'), 'font-size:14px;opacity:.85;margin-bottom:12px');
    const cardBtns = css(document.createElement('div'), 'display:flex;gap:8px;justify-content:center');
    const bAgain = css(document.createElement('button'), ''); bAgain.className = 'vbbtn'; bAgain.textContent = '🔄 Nog eens';
    const bGo = css(document.createElement('button'), 'background:linear-gradient(135deg,#22c55e,#16a34a)'); bGo.className = 'vbbtn'; bGo.textContent = 'Volgende ▶';
    cardBtns.append(bAgain, bGo);
    card.append(cardTitle, cardStars, cardInfo, cardBtns);
    overlay.appendChild(card);
    root.append(header, status, area, footer, overlay);
    host.appendChild(root);
    const ctx = canvas.getContext('2d');

    /* geluid */
    let actx = null, muted = false;
    function audio() {
      if (actx || dead) return actx;
      try { const AC = window.AudioContext || window.webkitAudioContext; if (AC) actx = new AC(); } catch (e) { actx = null; }
      return actx;
    }
    function tone(f, d = 0.12, type = 'sine', vol = 0.05, delay = 0) {
      if (muted || dead) return;
      const a = audio(); if (!a) return;
      try {
        if (a.state === 'suspended') a.resume();
        const o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime + delay;
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
        o.connect(g); g.connect(a.destination);
        o.start(t0); o.stop(t0 + d + 0.03);
      } catch (e) { /* geluid mag falen */ }
    }

    /* spelstaat */
    let level = 0, maxL = 0, hints = 3;
    let bests = [];
    let lv = null, board = null, moves = 0, hintUsed = false, won = false, wonAt = 0;
    let undoStack = [];
    const popAt = [];
    const cache = new Map();
    let particles = [];
    let loaded = false;

    const score = () => bests.reduce((s, v) => s + (v || 0), 0);
    function persist() {
      if (!loaded) return;
      let b = '';
      for (let i = 0; i < Math.min(bests.length, 400); i++) b += String(bests[i] || 0);
      try { api.save({ v: 1, l: level, m: maxL, b, h: hints }); } catch (e) { /* negeren */ }
    }
    function getLevel(i) {
      if (!cache.has(i)) {
        if (cache.size > 6) cache.delete(cache.keys().next().value);
        cache.set(i, genLevel(i));
      }
      return cache.get(i);
    }

    /* layout */
    let cw = 0, ch = 0, dpr = 1, bx = 0, by = 0, bs = 0, cs = 0;
    function layout() {
      const r = area.getBoundingClientRect();
      cw = Math.max(50, r.width || api.w || 360); ch = Math.max(50, r.height || (api.h || 640) - 190);
      dpr = Math.min(2.5, window.devicePixelRatio || 1);
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
      if (!board) return;
      bs = Math.floor(Math.min(cw - 12, ch - 8, 460));
      cs = bs / board.N;
      bx = (cw - bs) / 2; by = (ch - bs) / 2;
    }
    const onResize = () => layout();
    window.addEventListener('resize', onResize);

    function startLevel(i, keepUndo) {
      level = i;
      lv = getLevel(i);
      board = makeBoard(lv);
      moves = 0; hintUsed = false; won = false; undoStack = []; particles = particles.filter((p) => p.keep);
      popAt.length = 0;
      overlay.style.display = 'none';
      layout();
      updateUI();
      persist();
      later(layout, 120);
      later(() => { if (!cache.has(level + 1)) getLevel(level + 1); }, 400);
    }

    function updateUI() {
      const endless = level >= FIXED_LEVELS;
      title.textContent = endless ? `Eindeloos ∞ ${level - FIXED_LEVELS + 1}` : `Level ${level + 1}`;
      const best = bests[level] || 0;
      starsEl.textContent = `${board.N}×${board.N} · ` + (best ? '⭐'.repeat(best) + '☆'.repeat(3 - best) : '☆☆☆');
      bPrev.disabled = level <= 0;
      bNext.disabled = level >= maxL;
      bUndo.disabled = undoStack.length === 0 || won;
      bReset.disabled = won;
      bHint.disabled = won || hints <= 0;
      bHint.textContent = `💡 Hint (${hints})`;
      const pct = Math.round((100 * board.filled()) / board.T);
      if (level === 0 && board.connected() === 0 && !won) status.textContent = 'Sleep van een stip naar de stip met dezelfde kleur';
      else if (level === 1 && !won && board.connected() < board.K) status.textContent = 'Vul alle vakjes! Een lijn over een andere lijn snijdt die af';
      else status.textContent = `Verbonden ${board.connected()}/${board.K} · Gevuld ${pct}%`;
      try { api.score(score()); } catch (e) { /* negeren */ }
    }

    /* invoer */
    let dragging = false, before = null, pid = null, lastTick = 0;
    function cellAt(e) {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (cw / r.width) - bx, y = (e.clientY - r.top) * (ch / r.height) - by;
      let c = Math.floor(x / cs), rr = Math.floor(y / cs);
      c = Math.max(0, Math.min(board.N - 1, c)); rr = Math.max(0, Math.min(board.N - 1, rr));
      return rr * board.N + c;
    }
    function onDown(e) {
      if (!board || won || dragging || !loaded) return;
      audio();
      const cell = cellAt(e);
      const snap = board.snapshot();
      if (board.start(cell)) {
        dragging = true; before = snap; pid = e.pointerId;
        try { canvas.setPointerCapture(e.pointerId); } catch (x) { /* negeren */ }
        tone(NOTES[board.active % NOTES.length] / 2, 0.08, 'sine', 0.035);
        updateUI();
      }
      e.preventDefault();
    }
    function onMove(e) {
      if (!dragging || e.pointerId !== pid) return;
      const target = cellAt(e), N = board.N;
      const wasDone = board.complete(board.active);
      const c = board.active;
      for (let guard = 0; guard < N * 2; guard++) {
        const h = board.head();
        if (h === target) break;
        const hr = Math.floor(h / N), hc = h % N, tr = Math.floor(target / N), tc = target % N;
        const dr = tr - hr, dc = tc - hc;
        let next;
        if (Math.abs(dr) >= Math.abs(dc)) next = (hr + Math.sign(dr)) * N + hc; else next = hr * N + hc + Math.sign(dc);
        const res = board.step(next);
        if (!res) break;
        if (res === 2) tone(180, 0.1, 'triangle', 0.05);
        else {
          const now = performance.now();
          if (now - lastTick > 45) { lastTick = now; tone(300 + (board.paths[c].length % 12) * 22, 0.04, 'sine', 0.018); }
        }
      }
      if (!wasDone && board.complete(c)) {
        popAt[c] = performance.now();
        tone(NOTES[c % NOTES.length], 0.22, 'sine', 0.07);
        tone(NOTES[c % NOTES.length] * 1.5, 0.28, 'sine', 0.04, 0.07);
      }
      updateUI();
    }
    function onUp(e) {
      if (!dragging || (e && e.pointerId !== undefined && e.pointerId !== pid)) return;
      dragging = false;
      try { canvas.releasePointerCapture(pid); } catch (x) { /* negeren */ }
      board.release();
      const now = board.snapshot();
      if (JSON.stringify(now) !== JSON.stringify(before)) {
        undoStack.push(before); if (undoStack.length > 40) undoStack.shift();
        moves++;
      }
      before = null;
      updateUI();
      if (board.won()) onWin();
    }
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    function onWin() {
      if (won) return;
      won = true; wonAt = performance.now();
      const stars = starsFor(board.K, moves, hintUsed);
      const first = !bests[level];
      if (stars > (bests[level] || 0)) bests[level] = stars;
      if (level >= maxL) maxL = level + 1;
      let bonus = '';
      if (first && (level + 1) % 4 === 0 && hints < 6) { hints++; bonus = ' · +1 💡'; }
      persist();
      updateUI();
      bUndo.disabled = true;
      burst(stars);
      [0, 1, 2, 3].forEach((k) => tone(NOTES[k * 2 % NOTES.length] * 1.0, 0.25, 'triangle', 0.06, k * 0.09));
      tone(1046, 0.4, 'sine', 0.05, 0.4);
      later(() => {
        cardTitle.textContent = ['', 'Gelukt!', 'Goed gedaan!', 'Perfect!'][stars];
        cardStars.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        cardInfo.textContent = `${moves} streken${hintUsed ? ' · hint gebruikt' : ''}${bonus}`;
        card.style.animation = 'none'; void card.offsetWidth; card.style.animation = 'vbpop .4s ease-out both';
        overlay.style.display = 'flex';
      }, 650);
    }
    function burst(stars) {
      const cx = bx + bs / 2, cy = by + bs / 2;
      const n = 60 + stars * 25;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, sp = 120 + Math.random() * 330;
        particles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 180, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12, life: 1.6 + Math.random() * 1.2, age: 0, size: 5 + Math.random() * 6, color: PALETTE[i % PALETTE.length], glyph: i < stars * 5 ? '⭐' : null });
      }
    }

    /* knoppen */
    const click = (b, fn) => b.addEventListener('click', () => { audio(); if (board || b === bSound) fn(); });
    click(bPrev, () => { if (level > 0) { tone(440, 0.06); startLevel(level - 1); } });
    click(bNext, () => { if (level < maxL) { tone(520, 0.06); startLevel(level + 1); } });
    click(bSound, () => { muted = !muted; bSound.textContent = muted ? '🔇' : '🔊'; });
    function undo() {
      if (won || !undoStack.length || dragging) return;
      board.restore(undoStack.pop());
      tone(330, 0.07, 'triangle', 0.04);
      updateUI();
    }
    function reset() {
      if (won || dragging) return;
      const snap = board.snapshot();
      if (board.filled() === 0) return;
      undoStack.push(snap);
      board.reset(); moves++;
      tone(260, 0.1, 'triangle', 0.04);
      updateUI();
    }
    function useHint() {
      if (won || dragging || hints <= 0) return;
      const same = (a, b) => a.length === b.length && (a.every((x, i) => x === b[i]) || a.every((x, i) => x === b[b.length - 1 - i]));
      let pick = -1;
      for (let c = 0; c < board.K; c++) if (!same(board.paths[c], lv.sol[c])) { pick = c; break; }
      if (pick < 0) return;
      undoStack.push(board.snapshot());
      board.forcePath(pick, lv.sol[pick]);
      hints--; hintUsed = true; moves++;
      popAt[pick] = performance.now();
      tone(NOTES[pick % NOTES.length], 0.25, 'sine', 0.06);
      persist(); updateUI();
      if (board.won()) onWin();
    }
    click(bUndo, undo); click(bReset, reset); click(bHint, useHint);
    click(bGo, () => startLevel(level + 1));
    click(bAgain, () => startLevel(level));
    const onKey = (e) => {
      if (!board) return;
      const k = e.key.toLowerCase();
      if (k === 'z') undo(); else if (k === 'r') reset(); else if (k === 'h') useHint();
      else if ((k === 'enter' || k === ' ') && won) startLevel(level + 1);
    };
    window.addEventListener('keydown', onKey);

    /* tekenen */
    function rr(c, x, y, w, h, r) {
      c.beginPath();
      if (c.roundRect) c.roundRect(x, y, w, h, r);
      else c.rect(x, y, w, h);
    }
    let raf = 0, lastT = performance.now();
    function frame(now) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      if (board && cs > 0) drawBoard(now);
      // confetti
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age += dt;
        if (p.age > p.life) { particles.splice(i, 1); continue; }
        p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.vx *= 0.99;
        ctx.save();
        ctx.globalAlpha = Math.min(1, (p.life - p.age) * 2);
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        if (p.glyph) { ctx.font = `${p.size * 3}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.glyph, 0, 0); }
        else { ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66); }
        ctx.restore();
      }
    }
    function drawBoard(now) {
      const N = board.N, t = now / 1000;
      ctx.fillStyle = 'rgba(2,6,23,.55)';
      rr(ctx, bx - 5, by - 5, bs + 10, bs + 10, 16); ctx.fill();
      const gap = Math.max(1.5, cs * 0.04);
      for (let i = 0; i < board.T; i++) {
        const r = Math.floor(i / N), c = i % N;
        const x = bx + c * cs + gap / 2, y = by + r * cs + gap / 2;
        ctx.fillStyle = '#1e293b';
        rr(ctx, x, y, cs - gap, cs - gap, cs * 0.16); ctx.fill();
        const o = board.owner[i];
        if (o >= 0) { ctx.globalAlpha = 0.2; ctx.fillStyle = PALETTE[o]; rr(ctx, x, y, cs - gap, cs - gap, cs * 0.16); ctx.fill(); ctx.globalAlpha = 1; }
      }
      const ctr = (i) => [bx + (i % N + 0.5) * cs, by + (Math.floor(i / N) + 0.5) * cs];
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let c = 0; c < board.K; c++) {
        const p = board.paths[c];
        if (p.length < 2) continue;
        ctx.strokeStyle = PALETTE[c];
        ctx.lineWidth = cs * 0.34;
        ctx.globalAlpha = board.complete(c) ? 1 : 0.9;
        if (board.complete(c)) { ctx.shadowColor = PALETTE[c]; ctx.shadowBlur = cs * 0.25; }
        ctx.beginPath();
        p.forEach((cell, k) => { const [x, y] = ctr(cell); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.stroke();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      }
      // actief hoofdje
      if (dragging && board.active >= 0) {
        const hh = board.head();
        if (hh >= 0) { const [x, y] = ctr(hh); ctx.fillStyle = PALETTE[board.active]; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(x, y, cs * 0.42, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
      }
      // stippen
      for (let c = 0; c < board.K; c++) {
        const done = board.complete(c);
        const age = popAt[c] ? (now - popAt[c]) / 1000 : 9;
        const pop = age < 0.5 ? 1 + 0.35 * Math.sin((age / 0.5) * Math.PI) : 1;
        const pulse = done ? 1 : 1 + 0.06 * Math.sin(t * 4 + c);
        for (const e of board.ends[c]) {
          const [x, y] = ctr(e), rad = cs * 0.3 * pop * pulse;
          ctx.fillStyle = PALETTE[c];
          ctx.shadowColor = PALETTE[c]; ctx.shadowBlur = done ? cs * 0.3 : cs * 0.12;
          ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255,255,255,.4)';
          ctx.beginPath(); ctx.arc(x - rad * 0.3, y - rad * 0.3, rad * 0.28, 0, 7); ctx.fill();
        }
      }
      // winst-golf
      if (won) {
        const el = now - wonAt;
        for (let i = 0; i < board.T; i++) {
          const r = Math.floor(i / N), c = i % N, e = el - (r + c) * 45;
          if (e > 0 && e < 500) {
            ctx.globalAlpha = Math.sin((e / 500) * Math.PI) * 0.45; ctx.fillStyle = '#fff';
            rr(ctx, bx + c * cs + gap / 2, by + r * cs + gap / 2, cs - gap, cs - gap, cs * 0.16); ctx.fill(); ctx.globalAlpha = 1;
          }
        }
      }
    }
    raf = requestAnimationFrame(frame);

    /* start: voortgang laden */
    Promise.resolve(api.load()).catch(() => null).then((s) => {
      if (dead) return;
      let start = 0;
      if (s && typeof s === 'object') {
        maxL = Math.max(0, Math.min(400, s.m | 0));
        hints = typeof s.h === 'number' ? Math.max(0, Math.min(6, s.h | 0)) : 3;
        bests = String(s.b || '').split('').map((x) => Math.max(0, Math.min(3, +x || 0)));
        start = Math.max(0, Math.min(maxL, s.l | 0));
      }
      loaded = true;
      startLevel(start);
    });

    return {
      destroy() {
        if (dead) return;
        dead = true;
        if (loaded) persist();
        cancelAnimationFrame(raf);
        timers.forEach(clearTimeout); timers.clear();
        window.removeEventListener('resize', onResize);
        window.removeEventListener('keydown', onKey);
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerup', onUp);
        canvas.removeEventListener('pointercancel', onUp);
        try { if (actx) actx.close(); } catch (e) { /* negeren */ }
        actx = null;
        if (root.parentNode) root.parentNode.removeChild(root);
      },
    };
  },
};
