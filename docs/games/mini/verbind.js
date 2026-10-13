// Verbind de kleuren - flow-achtig lijnenpuzzelspel.
// Let op: de pure logica (levelgenerator, solver, bord) wordt ook door tools/test-mini-verbind.mjs getest,
// dus bovenin staat GEEN DOM-gebruik.

export const FIXED_LEVELS = 300;
export const WORLD_SIZE = 30;
const PALETTE = ['#ef4444', '#3b82f6', '#22c55e', '#facc15', '#f97316', '#22d3ee', '#d946ef', '#fb7185', '#a3e635', '#8b5cf6', '#b45309', '#f1f5f9', '#14b8a6', '#9ca3af', '#7dd3fc', '#e11d48'];
const NOTES = [392, 440, 494, 523, 587, 659, 698, 784, 880];

/* ---------- werelden: elk 30 levels met eigen titel + kleurthema ----------
   segs: [vanaf j, t/m j, bordgrootte n, k begin, k eind] (j = positie in de wereld) */
export const WORLDS = [
  { name: 'Groene Weide', emoji: '🌿', bg: 'linear-gradient(160deg,#052e16,#14532d 60%,#166534)', cell: '#1f3a2c', back: 'rgba(2,20,10,.6)', segs: [[0, 7, 4, 3, 4], [8, 29, 5, 4, 5]] },
  { name: 'Zandstrand', emoji: '🏖️', bg: 'linear-gradient(160deg,#422006,#78350f 60%,#92400e)', cell: '#4a3520', back: 'rgba(30,15,3,.6)', segs: [[0, 9, 5, 5, 6], [10, 29, 6, 6, 7]] },
  { name: 'Bosmeer', emoji: '🌲', bg: 'linear-gradient(160deg,#042f2e,#134e4a 60%,#115e59)', cell: '#1c3d3b', back: 'rgba(1,20,20,.6)', segs: [[0, 14, 6, 7, 8], [15, 29, 7, 7, 8]] },
  { name: 'Koraalrif', emoji: '🪸', bg: 'linear-gradient(160deg,#4a044e,#831843 60%,#9d174d)', cell: '#4a2142', back: 'rgba(30,2,25,.6)', segs: [[0, 29, 7, 8, 10]] },
  { name: 'Woestijn', emoji: '🏜️', bg: 'linear-gradient(160deg,#431407,#7c2d12 60%,#b45309)', cell: '#4e2c1c', back: 'rgba(30,10,3,.6)', segs: [[0, 9, 7, 10, 10], [10, 29, 8, 9, 10]] },
  { name: 'IJsland', emoji: '❄️', bg: 'linear-gradient(160deg,#082f49,#0c4a6e 60%,#0369a1)', cell: '#1e3a52', back: 'rgba(2,15,30,.6)', segs: [[0, 29, 8, 10, 11]] },
  { name: 'Vulkaan', emoji: '🌋', bg: 'linear-gradient(160deg,#1c0a0a,#7f1d1d 60%,#991b1b)', cell: '#3b1f1f', back: 'rgba(20,3,3,.65)', segs: [[0, 9, 8, 12, 12], [10, 29, 9, 13, 14]] },
  { name: 'Nachtstad', emoji: '🌃', bg: 'linear-gradient(160deg,#020617,#1e1b4b 60%,#3b0764)', cell: '#1e1b3a', back: 'rgba(2,2,20,.65)', segs: [[0, 29, 9, 14, 15]] },
  { name: 'Ruimtestation', emoji: '🚀', bg: 'linear-gradient(160deg,#0f172a,#312e81 60%,#4c1d95)', cell: '#25264a', back: 'rgba(5,5,25,.65)', segs: [[0, 29, 9, 15, 16]] },
  { name: 'Kosmos', emoji: '🌌', bg: 'linear-gradient(160deg,#000000,#3b0764 55%,#831843)', cell: '#2a1740', back: 'rgba(8,0,20,.7)', segs: [[0, 14, 9, 16, 16], [15, 29, 10, 16, 16]] },
];
const ENDLESS_THEME = { name: 'Eindeloos', emoji: '∞', bg: 'linear-gradient(160deg,#0b1020,#1e1b4b 60%,#312e81)', cell: '#1e293b', back: 'rgba(2,6,23,.55)' };

export function worldOf(i) { return i >= FIXED_LEVELS ? -1 : Math.floor(i / WORLD_SIZE); }
export function themeOf(i) { return i >= FIXED_LEVELS ? ENDLESS_THEME : WORLDS[worldOf(i)]; }

/* ---------- level-parameters ---------- */
export function levelParams(i) {
  if (i >= FIXED_LEVELS) { const m = i - FIXED_LEVELS, n = 9 + (m % 2); return { n, k: 14 + (m % 3) }; }
  const w = Math.floor(i / WORLD_SIZE), j = i % WORLD_SIZE;
  const seg = WORLDS[w].segs.find((s) => j >= s[0] && j <= s[1]);
  const [from, to, n, k0, k1] = seg;
  let k = Math.round(k0 + ((k1 - k0) * (j - from)) / Math.max(1, to - from));
  if (j === 0 && w > 0) k -= 1;          // zachte start van een nieuwe wereld
  else if (j % 10 === 9) k += 1;         // 'eindbaasje' elke 10 levels
  return { n, k: Math.max(3, Math.min(PALETTE.length, k)) };
}

export function mulberry32(a) {
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

export function candidate(n, k, rnd) {
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

// Vooraf (offline) gezochte pogingnummers: waarde = poging+1 (positief: bewezen EEN unieke oplossing, negatief: niet uniek maar wel oplosbaar door constructie).
// Level N is hierdoor altijd hetzelfde en wordt lui (per level, 1 kandidaat) opgebouwd.
const SEEDS = [5,3,8,5,3,11,3,4,11,12,5,20,16,13,59,62,54,28,5,4,7,10,19,10,6,14,11,9,16,9,13,1,12,15,12,12,9,4,10,5,70,34,86,92,115,124,75,37,57,19,20,25,11,54,36,17,16,56,21,27,7,13,7,35,38,4,24,8,7,9,3,6,9,13,4,1516,114,714,1546,264,1089,1767,208,11,131,329,484,482,71,26,829,192,395,274,346,31,142,107,149,47,78,40,281,109,89,362,58,174,91,19,181,49,37,8,29,43,96,14,70,21,41,37,29,1,73,8,86,5,57,39,2286,1466,4759,2161,1028,444,521,2457,695,951,1923,1635,2286,46,1318,63,1593,2121,4200,270,3374,1522,734,3624,947,3520,3099,3363,1555,580,4360,187,271,1477,1411,437,783,580,1427,753,1151,748,641,1098,594,137,902,699,195,84,89,128,372,203,54,428,286,85,467,17,4237,1680,4897,4306,166,1624,601,2363,2307,641,2759,811,5079,5197,1638,1726,2376,1345,1915,1643,983,743,1572,2710,1667,432,3864,978,1957,1106,1243,2631,2959,271,2799,2271,1028,887,418,785,325,1354,2444,3047,579,1686,67,2246,1476,297,3114,1952,548,976,138,1951,1606,3058,626,1621,47,326,402,1813,1214,201,1023,1098,59,215,908,476,482,150,342,815,1224,588,213,1212,1688,560,1201,486,201,1028,369,9,446,2530,973,963,176,324,514,-7,-24,-20,-17,119,-28,-28,-28,-30,-12,-16,-24,-28,-23,-12];

export function build(i, a) {
  const P = levelParams(i);
  return candidate(P.n, P.k, mulberry32(i * 7919 + a * 104729 + 12345));
}

export function genLevel(i, opts = {}) {
  const sd = SEEDS[i];
  if (!opts.search && sd) { const a = Math.abs(sd) - 1; const lv = build(i, a); lv.unique = sd > 0; lv.attempts = a + 1; return lv; }
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

/* ---------- voortgang (compact opgeslagen: 1 cijfer per level, <1KB) ---------- */
const MAX_SAVED = 700; // 300 vaste + ruim 400 eindeloze levels
export function packBests(bests) {
  let b = '';
  for (let i = 0; i < Math.min(bests.length, MAX_SAVED); i++) b += String(bests[i] || 0);
  return b.replace(/0+$/, '');
}
// v1 (oude spel met 60 vaste levels + eindeloos vanaf index 60) migreert: sterren van level 1-60 blijven, eindeloze sterren vervallen.
export function parseSave(s) {
  const out = { level: 0, maxL: 0, hints: 3, bests: [] };
  if (!s || typeof s !== 'object') return out;
  const old = !(s.v >= 2);
  let b = String(s.b || '').split('').slice(0, MAX_SAVED).map((x) => Math.max(0, Math.min(3, +x || 0)));
  let m = Math.max(0, Math.min(MAX_SAVED, s.m | 0));
  if (old) { b = b.slice(0, 60); m = Math.min(m, 60); }
  out.bests = b; out.maxL = m;
  out.hints = typeof s.h === 'number' ? Math.max(0, Math.min(6, s.h | 0)) : 3;
  out.level = Math.max(0, Math.min(m, s.l | 0));
  return out;
}
// eerstvolgende level na 'from' zonder sterren (alleen vaste levels); anders gewoon het volgende
export function nextOpen(bests, from) {
  for (let i = from + 1; i < FIXED_LEVELS; i++) if (!bests[i]) return i;
  for (let i = 0; i <= from && i < FIXED_LEVELS; i++) if (!bests[i]) return i;
  return Math.max(from + 1, FIXED_LEVELS);
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
    style.textContent = '@keyframes vbpop{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}.vbbtn{border:0;border-radius:14px;color:#fff;font-size:15px;font-weight:700;padding:10px 10px;cursor:pointer;touch-action:manipulation;font-family:inherit;background:rgba(255,255,255,.12);transition:transform .1s,background .15s}.vbbtn:active{transform:scale(.94)}.vbbtn[disabled]{opacity:.35;cursor:default}';
    root.appendChild(style);
    const header = css(document.createElement('div'), 'display:flex;align-items:center;justify-content:space-between;gap:5px;padding:8px 8px 4px;flex:none');
    const bPrev = css(document.createElement('button'), ''); bPrev.className = 'vbbtn'; bPrev.textContent = '◀';
    const bNext = css(document.createElement('button'), ''); bNext.className = 'vbbtn'; bNext.textContent = '▶';
    const titleBox = css(document.createElement('div'), 'text-align:center;flex:1;min-width:0');
    const title = css(document.createElement('div'), 'font-size:18px;font-weight:800;white-space:nowrap');
    const worldEl = css(document.createElement('div'), 'font-size:12px;font-weight:700;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.3px');
    const starsEl = css(document.createElement('div'), 'font-size:13px;opacity:.85;height:17px');
    titleBox.append(title, worldEl, starsEl);
    const bMenu = css(document.createElement('button'), ''); bMenu.className = 'vbbtn'; bMenu.textContent = '🗺️'; bMenu.title = 'Levelkiezer';
    const bSound = css(document.createElement('button'), ''); bSound.className = 'vbbtn'; bSound.textContent = '🔊';
    header.append(bPrev, titleBox, bNext, bMenu, bSound);
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
    const banner = css(document.createElement('div'), 'position:absolute;left:0;right:0;top:18%;text-align:center;pointer-events:none;opacity:0;transition:opacity .5s;z-index:3');
    const bannerBox = css(document.createElement('div'), 'display:inline-block;background:rgba(15,23,42,.88);border:2px solid rgba(255,255,255,.25);border-radius:20px;padding:14px 26px;box-shadow:0 10px 40px rgba(0,0,0,.5)');
    banner.appendChild(bannerBox);
    const chooser = css(document.createElement('div'), 'position:absolute;left:0;top:0;width:100%;height:100%;display:none;flex-direction:column;background:rgba(2,6,23,.97);z-index:5');
    const chHead = css(document.createElement('div'), 'display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;flex:none');
    const chTitle = css(document.createElement('div'), 'font-size:18px;font-weight:800');
    const chOpen = css(document.createElement('button'), ''); chOpen.className = 'vbbtn'; chOpen.textContent = '⏭ Eerste open level';
    const chClose = css(document.createElement('button'), ''); chClose.className = 'vbbtn'; chClose.textContent = '✕';
    chHead.append(chTitle, chOpen, chClose);
    const chBody = css(document.createElement('div'), 'flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 12px 18px');
    chooser.append(chHead, chBody);
    root.append(header, status, area, footer, overlay, banner, chooser);
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
    let th = themeOf(0), lv = null, board = null, moves = 0, hintUsed = false, won = false, wonAt = 0;
    let undoStack = [];
    const popAt = [];
    const cache = new Map();
    let particles = [];
    let loaded = false;

    const score = () => bests.reduce((s, v) => s + (v || 0), 0);
    function persist() {
      if (!loaded) return;
      try { api.save({ v: 2, l: level, m: maxL, b: packBests(bests), h: hints }); } catch (e) { /* negeren */ }
    }
    function getLevel(i) {
      if (!cache.has(i)) {
        if (cache.size > 6) cache.delete(cache.keys().next().value);
        cache.set(i, genLevel(i, i >= FIXED_LEVELS ? { stopAfter: Date.now() + 200 } : {}));
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
      th = themeOf(i);
      root.style.background = th.bg;
      board = makeBoard(lv);
      moves = 0; hintUsed = false; won = false; undoStack = []; particles = particles.filter((p) => p.keep);
      popAt.length = 0;
      overlay.style.display = 'none';
      layout();
      updateUI();
      persist();
      later(layout, 120);
      later(() => { if (!cache.has(level + 1)) getLevel(level + 1); }, 400);
      if (i < FIXED_LEVELS && i % WORLD_SIZE === 0 && !bests[i]) showBanner(`${th.emoji} Wereld ${worldOf(i) + 1}`, th.name);
      else if (i === FIXED_LEVELS) showBanner('∞ Eindeloos', 'Alle werelden voltooid!');
    }

    let bannerT = 0;
    function showBanner(a, b2) {
      bannerBox.innerHTML = '';
      const l1 = css(document.createElement('div'), 'font-size:13px;opacity:.8;letter-spacing:1px;text-transform:uppercase');
      const l2 = css(document.createElement('div'), 'font-size:26px;font-weight:800');
      l1.textContent = a; l2.textContent = b2;
      bannerBox.append(l1, l2);
      banner.style.transition = 'none'; banner.style.opacity = '1';
      clearTimeout(bannerT);
      bannerT = setTimeout(() => { banner.style.transition = 'opacity .6s'; banner.style.opacity = '0'; }, 1700);
      timers.add(bannerT);
    }

    function updateUI() {
      const endless = level >= FIXED_LEVELS;
      title.textContent = endless ? `Eindeloos ∞ ${level - FIXED_LEVELS + 1}` : `Level ${level + 1}`;
      worldEl.textContent = endless ? '∞ Eindeloze modus' : `${th.emoji} Wereld ${worldOf(level) + 1} · ${th.name} · ${(level % WORLD_SIZE) + 1}/${WORLD_SIZE}`;
      const best = bests[level] || 0;
      starsEl.textContent = `${board.N}×${board.N} · ` + (best ? '⭐'.repeat(best) + '☆'.repeat(3 - best) : '☆☆☆');
      bPrev.disabled = level <= 0;
      bNext.disabled = level >= maxL;
      bMenu.disabled = false;
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
        const lastOfWorld = level < FIXED_LEVELS && level % WORLD_SIZE === WORLD_SIZE - 1;
        cardStars.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        cardInfo.textContent = `${moves} streken${hintUsed ? ' · hint gebruikt' : ''}${bonus}` + (lastOfWorld ? `\n${th.emoji} Wereld ${worldOf(level) + 1} voltooid: ${th.name}! ${worldStars(worldOf(level))}/${WORLD_SIZE * 3} ⭐` : '');
        cardInfo.style.whiteSpace = 'pre-line';
        bGo.textContent = level + 1 >= FIXED_LEVELS && level < FIXED_LEVELS ? '∞ Eindeloos ▶' : (lastOfWorld ? `${WORLDS[worldOf(level) + 1].emoji} Volgende wereld ▶` : 'Volgende ▶');
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

    /* levelkiezer */
    const worldStars = (w) => { let t = 0; for (let j = 0; j < WORLD_SIZE; j++) t += bests[w * WORLD_SIZE + j] || 0; return t; };
    function openChooser() {
      if (dragging) return;
      chBody.innerHTML = '';
      const total = bests.reduce((a, v) => a + (v || 0), 0);
      chTitle.textContent = `Levels · ⭐ ${total}/${FIXED_LEVELS * 3}`;
      WORLDS.forEach((w, wi) => {
        const first = wi * WORLD_SIZE, locked = first > maxL;
        const sec = css(document.createElement('div'), `margin-top:14px;opacity:${locked ? 0.4 : 1}`);
        const h = css(document.createElement('div'), 'display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;font-weight:800');
        const hl = document.createElement('span'); hl.textContent = `${w.emoji} ${wi + 1}. ${w.name}`;
        const hr = css(document.createElement('span'), 'font-size:12px;font-weight:600;opacity:.8'); hr.textContent = locked ? '🔒' : `⭐ ${worldStars(wi)}/${WORLD_SIZE * 3}`;
        h.append(hl, hr);
        const grid = css(document.createElement('div'), 'display:grid;grid-template-columns:repeat(6,1fr);gap:6px;padding:8px;border-radius:14px;background:' + w.bg);
        for (let j = 0; j < WORLD_SIZE; j++) {
          const i = first + j, st = bests[i] || 0, lock = i > maxL;
          const b = css(document.createElement('button'), `border:${i === level ? '2px solid #fff' : '2px solid transparent'};border-radius:10px;color:#fff;padding:5px 0 3px;font-family:inherit;font-weight:800;font-size:15px;line-height:1.1;cursor:${lock ? 'default' : 'pointer'};background:${st ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.35)'};opacity:${lock ? 0.35 : 1};touch-action:manipulation`);
          b.disabled = lock;
          const num = document.createElement('div'); num.textContent = lock ? '🔒' : String(i + 1);
          const stz = css(document.createElement('div'), 'font-size:9px;height:11px;letter-spacing:-1px'); stz.textContent = lock ? '' : (st ? '★'.repeat(st) + '☆'.repeat(3 - st) : '☆☆☆');
          stz.style.color = st ? '#fde047' : 'rgba(255,255,255,.5)';
          b.append(num, stz);
          b.addEventListener('click', () => { closeChooser(); tone(520, 0.06); startLevel(i); });
          grid.appendChild(b);
        }
        sec.append(h, grid);
        chBody.appendChild(sec);
      });
      if (maxL >= FIXED_LEVELS) {
        const e = css(document.createElement('button'), 'margin-top:14px;width:100%'); e.className = 'vbbtn'; e.textContent = '∞ Eindeloze modus';
        e.addEventListener('click', () => { closeChooser(); startLevel(Math.max(FIXED_LEVELS, Math.min(maxL, level >= FIXED_LEVELS ? level : FIXED_LEVELS))); });
        chBody.appendChild(e);
      }
      chooser.style.display = 'flex';
      // scroll naar de huidige wereld
      const wi = Math.max(0, worldOf(level));
      later(() => { const el = chBody.children[wi]; if (el) chBody.scrollTop = Math.max(0, el.offsetTop - 8); }, 0);
    }
    function closeChooser() { chooser.style.display = 'none'; }

    /* knoppen */
    const click = (b, fn) => b.addEventListener('click', () => { audio(); if (board || b === bSound) fn(); });
    click(bPrev, () => { if (level > 0) { tone(440, 0.06); startLevel(level - 1); } });
    click(bNext, () => { if (level < maxL) { tone(520, 0.06); startLevel(level + 1); } });
    click(bMenu, () => { tone(440, 0.05); openChooser(); });
    chClose.addEventListener('click', closeChooser);
    chOpen.addEventListener('click', () => {
      closeChooser();
      const n = Math.min(maxL, nextOpen(bests, -1));
      tone(520, 0.06); startLevel(n);
    });
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
    click(bGo, () => startLevel(level < FIXED_LEVELS ? Math.min(level + 1, maxL) : level + 1));
    click(bAgain, () => startLevel(level));
    const onKey = (e) => {
      if (!board) return;
      const k = e.key.toLowerCase();
      if (k === 'escape') closeChooser(); else if (chooser.style.display === 'flex') return; else if (k === 'z') undo(); else if (k === 'r') reset(); else if (k === 'h') useHint();
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
      ctx.fillStyle = th.back;
      rr(ctx, bx - 5, by - 5, bs + 10, bs + 10, 16); ctx.fill();
      const gap = Math.max(1.5, cs * 0.04);
      for (let i = 0; i < board.T; i++) {
        const r = Math.floor(i / N), c = i % N;
        const x = bx + c * cs + gap / 2, y = by + r * cs + gap / 2;
        ctx.fillStyle = th.cell;
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
      const sv = parseSave(s), start = sv.level;
      maxL = sv.maxL; hints = sv.hints; bests = sv.bests;
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
