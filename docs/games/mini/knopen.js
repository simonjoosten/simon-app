// Knopen ontwarren: sleep de knopen zodat geen enkele lijn een andere kruist.
// Levels worden gebouwd uit een vlakke (planaire) graaf en daarna door elkaar geschud:
// de oorspronkelijke plaatsing is dus altijd een geldige oplossing (bewijs door constructie).

export const WORLD_W = 300;
export const WORLD_H = 420;
export const PAD = 26;
export const NODE_R = 14;
const CLEAR = 20;        // minimale afstand knoop-tot-lijn in het spel
const CLEAR_GEN = 30;    // ruimere marge in de oplossing
const SIN_MIN = 0.03;    // minimale hoek tussen lijnen vanuit dezelfde knoop (spel)
const SIN_GEN = 0.2;     // ruimere marge in de oplossing
export const TOTAL_FIXED = 300;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const orient = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
function onSeg(a, b, c) {
  return Math.min(a.x, b.x) <= c.x && c.x <= Math.max(a.x, b.x) && Math.min(a.y, b.y) <= c.y && c.y <= Math.max(a.y, b.y);
}
function segInter(a, b, c, d) {
  const o1 = orient(a, b, c), o2 = orient(a, b, d), o3 = orient(c, d, a), o4 = orient(c, d, b);
  if (((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) && ((o3 > 0 && o4 < 0) || (o3 < 0 && o4 > 0))) return true;
  if (o1 === 0 && onSeg(a, b, c)) return true;
  if (o2 === 0 && onSeg(a, b, d)) return true;
  if (o3 === 0 && onSeg(c, d, a)) return true;
  if (o4 === 0 && onSeg(c, d, b)) return true;
  return false;
}
function distSeg(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
// Botsen twee lijnen (kruising of bijna over elkaar heen vanuit dezelfde knoop)?
function badPair(P, e, f, sinMin) {
  const [a, b] = e, [c, d] = f;
  let shared = -1, o1 = -1, o2 = -1;
  if (a === c) { shared = a; o1 = b; o2 = d; }
  else if (a === d) { shared = a; o1 = b; o2 = c; }
  else if (b === c) { shared = b; o1 = a; o2 = d; }
  else if (b === d) { shared = b; o1 = a; o2 = c; }
  if (shared >= 0) {
    const v1x = P[o1].x - P[shared].x, v1y = P[o1].y - P[shared].y;
    const v2x = P[o2].x - P[shared].x, v2y = P[o2].y - P[shared].y;
    const l = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
    if (!l) return true;
    const cr = Math.abs(v1x * v2y - v1y * v2x) / l;
    const dot = v1x * v2x + v1y * v2y;
    return dot > 0 && cr < sinMin;
  }
  return segInter(P[a], P[b], P[c], P[d]);
}
function nodeNear(P, e, clear) {
  for (let w = 0; w < P.length; w++) {
    if (w === e[0] || w === e[1]) continue;
    if (distSeg(P[w], P[e[0]], P[e[1]]) < clear) return true;
  }
  return false;
}

// Geeft per lijn terug of die "rood" is (kruist een andere lijn of raakt een knoop).
export function findCrossings(P, E) {
  const red = E.map(() => false);
  for (let i = 0; i < E.length; i++) {
    for (let j = i + 1; j < E.length; j++) {
      if (badPair(P, E[i], E[j], SIN_MIN)) { red[i] = true; red[j] = true; }
    }
    if (!red[i] && nodeNear(P, E[i], CLEAR)) red[i] = true;
  }
  return red;
}

// ---------- werelden ----------
export const WORLD_SIZE = 30;
export const WORLDS = [
  { name: 'Lentetuin', emoji: '🌸', bg: ['#0f2a1d', '#1c3b2a'], acc: '#86efac', cols: ['#4ade80', '#f9a8d4', '#fde047', '#86efac', '#fda4af', '#a3e635'], shapes: ['rand'], pins: false },
  { name: 'Speelplaats', emoji: '🎈', bg: ['#1e1b4b', '#3b1d5a'], acc: '#fbbf24', cols: ['#f87171', '#fbbf24', '#60a5fa', '#34d399', '#c084fc', '#fb923c'], shapes: ['grid', 'rand'], pins: true },
  { name: 'Spinnenweb', emoji: '🕸️', bg: ['#111827', '#27272a'], acc: '#d4d4d8', cols: ['#e5e7eb', '#a1a1aa', '#c084fc', '#fca5a5', '#93c5fd', '#d4d4d8'], shapes: ['wheel', 'rand'], pins: false },
  { name: 'Woestijn', emoji: '🌵', bg: ['#3b2410', '#5a3414'], acc: '#fdba74', cols: ['#fbbf24', '#fb923c', '#a3e635', '#f87171', '#fde68a', '#facc15'], shapes: ['grid', 'rand', 'wheel'], pins: true },
  { name: 'Onderzee', emoji: '🐙', bg: ['#04223a', '#0a3d5c'], acc: '#67e8f9', cols: ['#22d3ee', '#38bdf8', '#f472b6', '#34d399', '#a78bfa', '#fb7185'], shapes: ['rings', 'rand'], pins: false },
  { name: 'IJsgrot', emoji: '❄️', bg: ['#0c2d48', '#1e3a5f'], acc: '#bae6fd', cols: ['#e0f2fe', '#7dd3fc', '#a5b4fc', '#99f6e4', '#f0abfc', '#bfdbfe'], shapes: ['grid', 'wheel', 'rand', 'rings'], pins: false },
  { name: 'Vulkaan', emoji: '🌋', bg: ['#3b0a0a', '#5c1a0a'], acc: '#fca5a5', cols: ['#f87171', '#fb923c', '#fbbf24', '#fca5a5', '#ef4444', '#fde047'], shapes: ['rings', 'grid', 'rand'], pins: true },
  { name: 'Sterrennevel', emoji: '🌌', bg: ['#0b0b2e', '#2a0f4a'], acc: '#c4b5fd', cols: ['#a78bfa', '#818cf8', '#f0abfc', '#67e8f9', '#fde68a', '#f9a8d4'], shapes: ['wheel', 'rings', 'rand', 'grid'], pins: false },
  { name: 'Kristalpaleis', emoji: '💎', bg: ['#0f2a35', '#2a1f4a'], acc: '#5eead4', cols: ['#2dd4bf', '#a78bfa', '#38bdf8', '#f472b6', '#fde047', '#4ade80'], shapes: ['rings', 'grid', 'wheel', 'rand'], pins: true },
  { name: 'Knopenmeester', emoji: '👑', bg: ['#2a1a05', '#3b0f2a'], acc: '#fde047', cols: ['#fde047', '#f472b6', '#38bdf8', '#4ade80', '#fb923c', '#c084fc'], shapes: ['rand', 'rings', 'grid', 'wheel'], pins: true },
];
export const ENDLESS_WORLD = { name: 'Eindeloos', emoji: '🌀', bg: ['#0f172a', '#1e1b4b'], acc: '#93c5fd', cols: ['#38bdf8', '#fbbf24', '#c084fc', '#f472b6', '#34d399', '#fb923c', '#60a5fa', '#a3e635'] };
export const worldIndex = (L) => Math.min(WORLDS.length - 1, Math.floor((L - 1) / WORLD_SIZE));
export const worldOf = (L) => (L > TOTAL_FIXED ? ENDLESS_WORLD : WORLDS[worldIndex(L)]);

const ENDLESS_SHAPES = ['rand', 'rings', 'grid', 'wheel'];
function fitShape(shape, n) {
  if (shape === 'wheel' && (n < 6 || n - 1 > 14)) return 'rand';
  if (shape === 'rings' && n < 8) return 'rand';
  return shape;
}

export function levelParams(L) {
  if (L <= TOTAL_FIXED) {
    const w = worldIndex(L), p = (L - 1) % WORLD_SIZE, s = p / (WORLD_SIZE - 1);
    const t = (L - 1) / (TOTAL_FIXED - 1);
    const W = WORLDS[w];
    const n = Math.round(5 + 14 * Math.pow(t, 0.75));
    let d = 0.65 * t + 0.35 * s;
    if (p === 0) d *= 0.55;            // ademhaling bij een nieuwe wereld
    if (p === WORLD_SIZE - 1) d = Math.min(1, d + 0.12); // eindbaas van de wereld
    const shape = fitShape(W.shapes[p % W.shapes.length], n);
    const pins = W.pins && p % 3 === 1 ? Math.round(n * 0.3) : 0;
    return {
      n, shape, pins, world: w, p,
      f: 0.2 + 0.65 * d,
      target: 2 + Math.round(d * 0.6 * (2 * n - 5)),
      frac: Math.min(1, 0.3 + 0.7 * (L - 1) / 90),
    };
  }
  const k = L - TOTAL_FIXED;
  const n = 15 + (k % 5);
  return { n, shape: fitShape(ENDLESS_SHAPES[k % 4], n), pins: 0, world: -1, p: k, f: 0.85 + 0.03 * (k % 4), target: 14 + (k % 7), frac: 1 };
}

function connected(n, E) {
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of E) { adj[a].push(b); adj[b].push(a); }
  const seen = new Array(n).fill(false);
  const st = [0]; seen[0] = true; let c = 1;
  while (st.length) {
    const u = st.pop();
    for (const v of adj[u]) if (!seen[v]) { seen[v] = true; c++; st.push(v); }
  }
  return c === n;
}

function buildRand(rnd, n, f) {
  // 1. punten met minimale onderlinge afstand
  let dmin = 70;
  const P = [];
  let guard = 0;
  while (P.length < n) {
    const p = { x: PAD + rnd() * (WORLD_W - 2 * PAD), y: PAD + rnd() * (WORLD_H - 2 * PAD) };
    if (P.every((q) => Math.hypot(p.x - q.x, p.y - q.y) >= dmin)) P.push(p);
    if (++guard > 400) { guard = 0; P.length = 0; dmin = Math.max(48, dmin - 3); }
  }
  // 2. hebzuchtige vlakke graaf: korte lijnen eerst, alleen als ze niets kruisen
  const cand = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    cand.push({ e: [i, j], w: Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y) * (0.8 + 0.4 * rnd()) });
  }
  cand.sort((a, b) => a.w - b.w);
  const all = [];
  for (const c of cand) {
    if (nodeNear(P, c.e, CLEAR_GEN)) continue;
    let ok = true;
    for (const g of all) if (badPair(P, c.e, g, SIN_GEN)) { ok = false; break; }
    if (ok) all.push(c.e);
  }
  if (!connected(n, all)) return null;
  // 3. willekeurige opspannende boom + extra lijnen
  const order = all.map((e, i) => ({ i, r: rnd() })).sort((a, b) => a.r - b.r).map((o) => o.i);
  const par = Array.from({ length: n }, (_, i) => i);
  const find = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  const chosen = new Set();
  for (const i of order) {
    const [a, b] = all[i];
    const ra = find(a), rb = find(b);
    if (ra !== rb) { par[ra] = rb; chosen.add(i); }
  }
  const rest = order.filter((i) => !chosen.has(i));
  const extra = Math.min(rest.length, Math.round(f * (2 * n - 5)));
  for (let k = 0; k < extra; k++) chosen.add(rest[k]);
  const E = [...chosen].sort((a, b) => a - b).map((i) => all[i]);
  return { P, E };
}

// raster (met diagonalen en ontbrekende lijnen)
function buildGrid(rnd, n, f) {
  const c = n <= 6 ? 2 : n <= 12 ? 3 : 4, rows = Math.ceil(n / c);
  const x0 = PAD + 8, y0 = PAD + 8, dx = (WORLD_W - 2 * x0) / (c - 1), dy = (WORLD_H - 2 * y0) / (rows - 1);
  const P = [];
  for (let i = 0; i < n; i++) P.push({ x: x0 + (i % c) * dx + (rnd() - 0.5) * 16, y: y0 + Math.floor(i / c) * dy + (rnd() - 0.5) * 16 });
  let E = [];
  for (let i = 0; i < n; i++) {
    if (i % c < c - 1 && i + 1 < n) E.push([i, i + 1]);
    if (i + c < n) E.push([i, i + c]);
    if (i % c < c - 1 && i + c + 1 < n && rnd() < f * 0.8) E.push(rnd() < 0.5 ? [i, i + c + 1] : [i + 1, i + c]);
  }
  const pDrop = 0.3 * (1 - f);
  for (const e of E.slice()) {
    if (rnd() < pDrop) {
      const rest = E.filter((x) => x !== e);
      if (connected(n, rest)) E = rest;
    }
  }
  return { P, E };
}

// wiel: een naaf in het midden, een ring eromheen en spaken
function buildWheel(rnd, n, f) {
  const m = n - 1, ph = rnd() * 6.283;
  const cx = WORLD_W / 2 + (rnd() - 0.5) * 10, cy = WORLD_H / 2 + (rnd() - 0.5) * 10;
  const rx = 108 + rnd() * 6, ry = 165 + rnd() * 8;
  const P = [{ x: cx, y: cy }], E = [];
  for (let k = 0; k < m; k++) {
    const a = ph + (6.283 * k) / m + (rnd() - 0.5) * 0.12 * (6.283 / m);
    P.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
  }
  for (let k = 0; k < m; k++) E.push([1 + k, 1 + ((k + 1) % m)]);
  const pS = 0.35 + 0.65 * f;
  let cnt = 0;
  for (let k = 0; k < m; k++) if (rnd() < pS) { E.push([0, 1 + k]); cnt++; }
  for (let k = 0; cnt < 3 && k < m; k += 3) if (!E.some((e) => e[0] === 0 && e[1] === 1 + k)) { E.push([0, 1 + k]); cnt++; }
  return { P, E };
}

// twee ringen (buiten en binnen) met verbindingen ertussen
function buildRings(rnd, n, f) {
  const a = Math.ceil(n * 0.6), b = n - a, ph = rnd() * 6.283;
  const P = [], E = [];
  for (let k = 0; k < a; k++) {
    const t = ph + (6.283 * k) / a;
    P.push({ x: WORLD_W / 2 + 116 * Math.cos(t) + (rnd() - 0.5) * 8, y: WORLD_H / 2 + 176 * Math.sin(t) + (rnd() - 0.5) * 8 });
  }
  for (let j = 0; j < b; j++) {
    const t = ph + (6.283 * j) / b;
    P.push({ x: WORLD_W / 2 + 54 * Math.cos(t) + (rnd() - 0.5) * 6, y: WORLD_H / 2 + 84 * Math.sin(t) + (rnd() - 0.5) * 6 });
  }
  for (let k = 0; k < a; k++) E.push([k, (k + 1) % a]);
  for (let j = 0; j < b; j++) E.push([a + j, a + ((j + 1) % b)]);
  for (let j = 0; j < b; j++) {
    const o = Math.round((j * a) / b) % a;
    E.push([a + j, o]);
    if (rnd() < f) E.push([a + j, (o + 1) % a]);
  }
  return { P, E };
}

const BUILDERS = { rand: buildRand, grid: buildGrid, wheel: buildWheel, rings: buildRings };

function solidOk(P, E, n) {
  if (E.length < n - 1 || !connected(n, E)) return false;
  const keys = new Set(E.map(([a, b]) => Math.min(a, b) + '-' + Math.max(a, b)));
  if (keys.size !== E.length || E.some(([a, b]) => a === b)) return false;
  for (let i = 0; i < n; i++) {
    if (P[i].x < PAD - 1 || P[i].y < PAD - 1 || P[i].x > WORLD_W - PAD + 1 || P[i].y > WORLD_H - PAD + 1) return false;
    for (let j = i + 1; j < n; j++) if (Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y) < 46) return false;
  }
  for (let i = 0; i < E.length; i++) {
    if (nodeNear(P, E[i], CLEAR_GEN * 0.8)) return false;
    for (let j = i + 1; j < E.length; j++) if (badPair(P, E[i], E[j], SIN_GEN * 0.6)) return false;
  }
  return !findCrossings(P, E).some(Boolean);
}

// Schud de oplossing: verplaats een deel (frac) van de vrije knopen naar willekeurige plekken.
function scramble(rnd, n, E, target, sol, pinned, frac) {
  const free = [];
  for (let i = 0; i < n; i++) if (!pinned.has(i)) free.push(i);
  const k = frac >= 1 ? free.length : Math.max(2, Math.min(free.length, Math.ceil(free.length * frac)));
  let best = null, bestScore = 1e9;
  for (let t = 0; t < 150; t++) {
    const S = sol.map((p) => ({ x: p.x, y: p.y }));
    const ord = free.slice();
    for (let i = ord.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ord[i], ord[j]] = [ord[j], ord[i]]; }
    let fail = false;
    for (const i of ord.slice(0, k)) {
      let placed = false;
      for (let g = 0; g < 80 && !placed; g++) {
        const p = { x: PAD + rnd() * (WORLD_W - 2 * PAD), y: PAD + rnd() * (WORLD_H - 2 * PAD) };
        if (S.every((q, j) => j === i || Math.hypot(p.x - q.x, p.y - q.y) >= 42)) { S[i] = p; placed = true; }
      }
      if (!placed) { fail = true; break; }
    }
    if (fail) continue;
    const r = findCrossings(S, E).filter(Boolean).length;
    if (r < 2) continue;
    let real = false;
    for (let i = 0; i < E.length && !real; i++) for (let j = i + 1; j < E.length; j++) {
      if (E[i].some((x) => E[j].includes(x))) continue;
      if (segInter(S[E[i][0]], S[E[i][1]], S[E[j][0]], S[E[j][1]])) { real = true; break; }
    }
    if (!real) continue;
    const sc = Math.abs(r - target);
    if (sc < bestScore) { bestScore = sc; best = S; if (sc === 0) break; }
  }
  if (!best && frac < 1) return scramble(rnd, n, E, target, sol, pinned, 1);
  return best;
}

// Deterministisch level bouwen. Geeft {n, edges, sol, start, pins, shape, world, p}.
export function genLevel(L) {
  const prm = levelParams(L);
  const { n } = prm;
  for (let attempt = 0; attempt < 400; attempt++) {
    const rnd = mulberry32(L * 7919 + 13 + attempt * 104729);
    const shape = attempt < 25 ? prm.shape : 'rand';
    const b = BUILDERS[shape](rnd, n, prm.f);
    if (!b || !solidOk(b.P, b.E, n)) continue;
    const m = b.E.length;
    const idx = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    const pins = prm.pins ? idx.slice(0, Math.min(prm.pins, n - 3)).sort((x, y) => x - y) : [];
    const start = scramble(rnd, n, b.E, Math.min(prm.target, Math.max(2, m - 1)), b.P, new Set(pins), prm.frac);
    if (!start) continue;
    return { n, edges: b.E, sol: b.P, start, pins, shape, world: prm.world, p: prm.p };
  }
  throw new Error('level ' + L + ' niet te genereren');
}

export default {
  id: 'knopen',
  name: 'Knopen ontwarren',
  emoji: '🪢',
  hint: 'Sleep de knopen tot geen lijn meer kruist: alles groen!',
  save: 'forever',
  create(host, api) {
    host.style.touchAction = 'none';
    let dead = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); };

    // ---------- DOM ----------
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;background:linear-gradient(170deg,#0f172a,#1e1b4b);color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;box-sizing:border-box;user-select:none;-webkit-user-select:none;touch-action:none';
    host.appendChild(root);

    const mkBtn = (txt, extra) => {
      const b = document.createElement('button');
      b.textContent = txt;
      b.style.cssText = 'border:0;border-radius:14px;background:rgba(255,255,255,.14);color:#fff;font-size:16px;font-weight:600;padding:10px 12px;cursor:pointer;touch-action:manipulation;font-family:inherit;' + (extra || '');
      return b;
    };
    const head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 10px 4px;flex:0 0 auto';
    const prevBtn = mkBtn('◀', 'width:44px;height:44px;padding:0');
    const nextBtn = mkBtn('▶', 'width:44px;height:44px;padding:0');
    const mid = document.createElement('div');
    mid.style.cssText = 'flex:1;text-align:center;min-width:0';
    const title = document.createElement('div');
    title.style.cssText = 'font-size:19px;font-weight:800';
    const sub = document.createElement('div');
    sub.style.cssText = 'font-size:14px;opacity:.85;min-height:18px;margin-top:2px';
    const worldLine = document.createElement('div');
    worldLine.style.cssText = 'font-size:13px;font-weight:700;letter-spacing:.3px;margin-top:1px';
    mid.style.cursor = 'pointer';
    mid.append(title, worldLine, sub);
    head.append(prevBtn, mid, nextBtn);

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'flex:1 1 auto;min-height:0;width:100%;display:block;touch-action:none';
    const foot = document.createElement('div');
    foot.style.cssText = 'display:flex;gap:8px;padding:6px 10px 12px;flex:0 0 auto';
    const undoBtn = mkBtn('↶ Terug', 'flex:1');
    const resetBtn = mkBtn('🔄 Opnieuw', 'flex:1');
    const hintBtn = mkBtn('💡 Hint', 'flex:1');
    const menuBtn = mkBtn('🗺️ Levels', 'flex:1');
    foot.append(undoBtn, resetBtn, hintBtn, menuBtn);

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:none;align-items:center;justify-content:center;pointer-events:none';
    const card = document.createElement('div');
    card.style.cssText = 'background:rgba(15,23,42,.92);border:2px solid #4ade80;border-radius:22px;padding:18px 26px;text-align:center;pointer-events:auto;box-shadow:0 10px 40px rgba(0,0,0,.5);transform:scale(.6);opacity:0;transition:transform .35s cubic-bezier(.2,1.6,.4,1),opacity .25s';
    const cardTitle = document.createElement('div');
    cardTitle.style.cssText = 'font-size:24px;font-weight:800';
    const cardStars = document.createElement('div');
    cardStars.style.cssText = 'font-size:38px;margin:6px 0;letter-spacing:4px';
    const cardInfo = document.createElement('div');
    cardInfo.style.cssText = 'font-size:15px;opacity:.85;margin-bottom:12px';
    const cardBtn = mkBtn('Volgende ▶', 'background:#22c55e;color:#052e16;font-size:18px;font-weight:800;padding:12px 24px');
    card.append(cardTitle, cardStars, cardInfo, cardBtn);
    overlay.appendChild(card);
    // wereld-banner (korte aankondiging bij een nieuwe wereld)
    const banner = document.createElement('div');
    banner.style.cssText = 'position:absolute;left:0;top:22%;width:100%;display:none;flex-direction:column;align-items:center;pointer-events:none;text-shadow:0 3px 14px rgba(0,0,0,.7);transition:opacity .6s;opacity:1';
    const bannerSub = document.createElement('div');
    bannerSub.style.cssText = 'font-size:15px;font-weight:700;opacity:.9;letter-spacing:2px;text-transform:uppercase';
    const bannerName = document.createElement('div');
    bannerName.style.cssText = 'font-size:34px;font-weight:900;margin-top:4px';
    banner.append(bannerSub, bannerName);
    // levelkiezer
    const picker = document.createElement('div');
    picker.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:none;flex-direction:column;background:rgba(10,14,30,.97);z-index:5;touch-action:pan-y';
    const pickBar = document.createElement('div');
    pickBar.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px;flex:0 0 auto';
    const pickTitle = document.createElement('div');
    pickTitle.style.cssText = 'flex:1;font-size:18px;font-weight:800';
    const pickGo = mkBtn('Verder ▶', 'background:#22c55e;color:#052e16;font-weight:800');
    const pickClose = mkBtn('✕', 'width:44px;padding:10px 0');
    pickBar.append(pickTitle, pickGo, pickClose);
    const pickList = document.createElement('div');
    pickList.style.cssText = 'flex:1 1 auto;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 10px 16px;touch-action:pan-y';
    picker.append(pickBar, pickList);
    root.append(head, canvas, foot, overlay, banner, picker);
    const ctx = canvas.getContext('2d');

    // ---------- geluid ----------
    let ac = null;
    function audio() {
      if (ac || dead) return ac;
      try { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ac = new AC(); } catch (e) { ac = null; }
      return ac;
    }
    function tone(freq, dur, type, vol, delay) {
      const a = ac; if (!a || dead) return;
      try {
        const t0 = a.currentTime + (delay || 0);
        const o = a.createOscillator(), g = a.createGain();
        o.type = type || 'sine'; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol || 0.05, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(a.destination);
        o.start(t0); o.stop(t0 + dur + 0.03);
      } catch (e) { /* geluid is bijzaak */ }
    }

    // ---------- staat ----------
    let level = 1, maxL = 1, stars = [], pinSet = new Set(), theme = WORLDS[0], pickerOpen = false, bannerTok = 0;
    const cache = new Map();
    let lv = null, pos = [], disp = [], red = [], inc = [];
    let moves = 0, undo = [], hintsLeft = 3, hintUsed = false, solved = false;
    let hintNode = -1, hintT = 0, drag = null, parts = [], winT = 0, ready = false, popT = 0;
    let cw = 300, ch = 400, dpr = 1, sc = 1, ox = 0, oy = 0, rectL = 0, rectT = 0;

    const total = () => stars.reduce((s, v) => s + (v || 0), 0);
    const clampP = (p) => ({ x: Math.max(PAD, Math.min(WORLD_W - PAD, p.x)), y: Math.max(PAD, Math.min(WORLD_H - PAD, p.y)) });
    function persist() {
      if (dead || !ready) return;
      try { api.save({ l: level, m: maxL, v: 2, s: stars.slice(0, 1500).map((v) => v || 0).join('') }); } catch (e) { /* ignore */ }
    }

    function recompute() {
      red = findCrossings(pos, lv.edges);
    }
    function redCount() { return red.filter(Boolean).length; }

    function updateUI() {
      const fixed = level <= TOTAL_FIXED;
      title.textContent = fixed ? `Level ${level} / ${TOTAL_FIXED}` : `🌀 Eindeloos ${level - TOTAL_FIXED}`;
      worldLine.textContent = fixed ? `${theme.emoji} Wereld ${worldIndex(level) + 1} · ${theme.name}` : '🌀 Eindeloze modus';
      worldLine.style.color = theme.acc;
      let s;
      if (level <= 2 && moves === 0 && !solved) s = 'Sleep de knopen: maak alle lijnen groen!';
      else if (pinSet.size && moves === 0 && !solved) s = `📌 ${pinSet.size} knopen zitten vast, de rest sleep je!`;
      else s = `⭐ ${total()} · rode lijnen: ${redCount()} · zetten: ${moves}`;
      sub.textContent = s;
      prevBtn.style.opacity = level > 1 ? '1' : '.3';
      nextBtn.style.opacity = level < maxL ? '1' : '.3';
      undoBtn.style.opacity = undo.length && !solved ? '1' : '.4';
      hintBtn.textContent = `💡 Hint (${hintsLeft})`;
      hintBtn.style.opacity = hintsLeft > 0 && !solved ? '1' : '.4';
    }

    function loadLevel(L, animate) {
      level = Math.max(1, L);
      if (level > maxL) maxL = level;
      lv = getLevel(level);
      pinSet = new Set(lv.pins);
      const nt = worldOf(level);
      if (nt !== theme) { theme = nt; }
      root.style.background = `linear-gradient(170deg,${theme.bg[0]},${theme.bg[1]})`;
      pos = lv.start.map((p) => ({ x: p.x, y: p.y }));
      disp = animate === false ? pos.map((p) => ({ x: p.x, y: p.y })) : pos.map(() => ({ x: WORLD_W / 2, y: WORLD_H / 2 }));
      inc = Array.from({ length: lv.n }, () => []);
      lv.edges.forEach((e, i) => { inc[e[0]].push(i); inc[e[1]].push(i); });
      moves = 0; undo = []; hintsLeft = 3; hintUsed = false; solved = false;
      hintNode = -1; drag = null; parts = []; popT = 0;
      overlay.style.display = 'none';
      card.style.opacity = '0'; card.style.transform = 'scale(.6)';
      recompute();
      updateUI();
      persist();
      if (level === TOTAL_FIXED + 1 || (level <= TOTAL_FIXED && (level - 1) % WORLD_SIZE === 0)) showBanner();
    }
    function getLevel(L) {
      let g = cache.get(L);
      if (!g) {
        g = genLevel(L);
        cache.set(L, g);
        if (cache.size > 24) cache.delete(cache.keys().next().value);
      }
      return g;
    }
    function showBanner() {
      const tok = ++bannerTok;
      bannerSub.textContent = level > TOTAL_FIXED ? 'Alle werelden gehaald!' : `Wereld ${worldIndex(level) + 1}`;
      bannerName.textContent = `${theme.emoji} ${theme.name}`;
      bannerName.style.color = theme.acc;
      banner.style.transition = 'none'; banner.style.opacity = '1'; banner.style.display = 'flex';
      later(() => { if (tok === bannerTok) { banner.style.transition = 'opacity .6s'; banner.style.opacity = '0'; } }, 1700);
      later(() => { if (tok === bannerTok) banner.style.display = 'none'; }, 2400);
    }
    function firstUnsolved() {
      for (let l = 1; l <= TOTAL_FIXED; l++) if (!(stars[l - 1] > 0)) return Math.min(l, maxL);
      return Math.min(maxL, Math.max(TOTAL_FIXED + 1, level));
    }
    function nextUnsolved() {
      for (let l = level + 1; l <= TOTAL_FIXED; l++) if (!(stars[l - 1] > 0)) return l;
      for (let l = 1; l < level && l <= TOTAL_FIXED; l++) if (!(stars[l - 1] > 0)) return l;
      return level + 1;
    }

    // ---------- levelkiezer ----------
    function clearEl(el) { [...el.children].forEach((c) => el.removeChild(c)); }
    function buildPicker() {
      clearEl(pickList);
      let all = 0;
      for (let i = 0; i < TOTAL_FIXED; i++) all += stars[i] || 0;
      pickTitle.textContent = `Kies een level · ⭐ ${all}/${TOTAL_FIXED * 3}`;
      let curEl = null;
      for (let w = 0; w <= WORLDS.length; w++) {
        const W = w < WORLDS.length ? WORLDS[w] : ENDLESS_WORLD;
        const first = w * WORLD_SIZE + 1;
        const head2 = document.createElement('div');
        let got = 0;
        if (w < WORLDS.length) for (let l = first; l < first + WORLD_SIZE; l++) got += stars[l - 1] || 0;
        head2.textContent = w < WORLDS.length ? `${W.emoji} Wereld ${w + 1} · ${W.name}   ⭐ ${got}/${WORLD_SIZE * 3}` : `${W.emoji} ${W.name}`;
        head2.style.cssText = `margin:14px 0 6px;font-size:15px;font-weight:800;color:${W.acc}`;
        pickList.appendChild(head2);
        if (w === WORLDS.length) {
          const b = mkBtn(maxL > TOTAL_FIXED ? 'Eindeloos spelen ▶' : '🔒 Haal eerst alle 300 levels', 'width:100%;opacity:' + (maxL > TOTAL_FIXED ? '1' : '.4'));
          b.addEventListener('click', () => { if (maxL > TOTAL_FIXED) go(Math.max(TOTAL_FIXED + 1, level > TOTAL_FIXED ? level : TOTAL_FIXED + 1)); });
          pickList.appendChild(b);
          break;
        }
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(6,1fr);gap:6px';
        for (let l = first; l < first + WORLD_SIZE; l++) {
          const open = l <= maxL, st = stars[l - 1] || 0;
          const c = mkBtn('', `padding:5px 0;border-radius:10px;font-size:15px;line-height:1.15;background:${st ? 'rgba(74,222,128,.22)' : 'rgba(255,255,255,.1)'};opacity:${open ? 1 : 0.3};${l === level ? 'outline:2px solid ' + W.acc + ';' : ''}`);
          const num = document.createElement('div'); num.textContent = String(l);
          const sl = document.createElement('div'); sl.textContent = open ? (st ? '★'.repeat(st) + '☆'.repeat(3 - st) : '·') : '🔒'; sl.style.cssText = 'font-size:9px;opacity:.9;min-height:11px;color:#fde047';
          c.append(num, sl);
          if (open) c.addEventListener('click', () => go(l));
          if (l === level) curEl = c;
          grid.appendChild(c);
        }
        pickList.appendChild(grid);
      }
      return curEl;
    }
    function go(L) {
      closePicker();
      audio();
      if (L !== level || solved) loadLevel(L);
    }
    function openPicker() {
      if (!ready || pickerOpen) return;
      audio();
      drag = null;
      const cur = buildPicker();
      picker.style.display = 'flex'; pickerOpen = true;
      try { cur.scrollIntoView({ block: 'center' }); } catch (e) { /* ignore */ }
    }
    function closePicker() { picker.style.display = 'none'; pickerOpen = false; }

    // ---------- beloning ----------
    function confetti() {
      const cols = ['#f87171', '#fbbf24', '#4ade80', '#38bdf8', '#c084fc', '#f472b6'];
      for (let i = 0; i < 70; i++) {
        const ang = Math.random() * Math.PI * 2, sp = 120 + Math.random() * 380;
        parts.push({
          x: cw / 2, y: ch * 0.45, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 160,
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12, c: cols[i % cols.length],
          star: i % 7 === 0, life: 1.6 + Math.random() * 0.8,
        });
      }
    }
    function onSolved() {
      solved = true; winT = 0; drag = null; hintNode = -1;
      const n = lv.n;
      let st = moves <= n + 2 ? 3 : moves <= 2 * n + 4 ? 2 : 1;
      if (hintUsed) st = Math.min(st, 2);
      const idx = level - 1;
      const prev = stars[idx] || 0;
      if (idx < 1500) { while (stars.length < idx) stars.push(0); stars[idx] = Math.max(prev, st); }
      if (level + 1 > maxL) maxL = level + 1;
      try { api.score(total()); } catch (e) { /* ignore */ }
      persist();
      confetti();
      tone(523, 0.18, 'triangle', 0.06, 0); tone(659, 0.18, 'triangle', 0.06, 0.1);
      tone(784, 0.18, 'triangle', 0.06, 0.2); tone(1047, 0.35, 'triangle', 0.06, 0.3);
      cardTitle.textContent = ['', 'Ontward! 🪢', 'Mooi gedaan! 🎉', 'Supergoed! 🌟'][st];
      const wd = level <= TOTAL_FIXED && level % WORLD_SIZE === 0;
      if (wd) cardTitle.textContent = `${theme.emoji} Wereld ${worldIndex(level) + 1} klaar!`;
      const nx = nextUnsolved();
      cardBtn.textContent = nx <= TOTAL_FIXED && (nx - 1) % WORLD_SIZE === 0 ? `${WORLDS[worldIndex(nx)].emoji} ${WORLDS[worldIndex(nx)].name} ▶` : nx === TOTAL_FIXED + 1 ? '🌀 Eindeloos ▶' : 'Volgende ▶';
      cardStars.textContent = '⭐'.repeat(st) + '☆'.repeat(3 - st);
      cardInfo.textContent = `${moves} zetten${hintUsed ? ' · met hint' : ''}${prev > st ? ` · record ${prev}⭐` : ''}`;
      updateUI();
      later(() => {
        overlay.style.display = 'flex';
        later(() => { card.style.opacity = '1'; card.style.transform = 'scale(1)'; }, 20);
      }, 650);
    }

    function afterMove(improved) {
      recompute();
      if (improved) tone(660, 0.12, 'sine', 0.05);
      if (!solved && !red.some(Boolean)) onSolved();
      else updateUI();
      persist();
    }

    // ---------- invoer ----------
    function toWorld(e) {
      return { x: (e.clientX - rectL - ox) / sc, y: (e.clientY - rectT - oy) / sc };
    }
    function pickNode(w) {
      let bi = -1, bd = 34;
      for (let i = 0; i < pos.length; i++) {
        if (pinSet.has(i)) continue;
        const d = Math.hypot(pos[i].x - w.x, pos[i].y - w.y);
        if (d <= bd) { bd = d; bi = i; }
      }
      return bi;
    }
    function measure() {
      const r = canvas.getBoundingClientRect();
      rectL = r.left; rectT = r.top;
      cw = Math.max(50, r.width || api.w); ch = Math.max(50, r.height || api.h * 0.7);
      dpr = Math.min(3, window.devicePixelRatio || 1);
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
      sc = Math.min((cw - 8) / WORLD_W, (ch - 8) / WORLD_H);
      ox = (cw - WORLD_W * sc) / 2; oy = (ch - WORLD_H * sc) / 2;
    }
    function onDown(e) {
      if (dead || !ready || solved) return;
      audio(); if (ac && ac.state === 'suspended') { try { ac.resume(); } catch (er) { /* ignore */ } }
      rectL = canvas.getBoundingClientRect().left; rectT = canvas.getBoundingClientRect().top;
      const w = toWorld(e);
      const i = pickNode(w);
      if (i < 0) return;
      try { canvas.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
      drag = { i, id: e.pointerId, dx: pos[i].x - w.x, dy: pos[i].y - w.y, from: { x: pos[i].x, y: pos[i].y }, before: redCount() };
      hintNode = -1;
      tone(520, 0.06, 'sine', 0.04);
      if (e.preventDefault) e.preventDefault();
    }
    function onMove(e) {
      if (!drag || e.pointerId !== drag.id) return;
      const w = toWorld(e);
      const p = clampP({ x: w.x + drag.dx, y: w.y + drag.dy });
      pos[drag.i] = p;
      disp[drag.i] = { x: p.x, y: p.y };
      recompute();
      updateUI();
    }
    function onUp(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      const d = drag; drag = null;
      let p = pos[d.i];
      for (let it = 0; it < 4; it++) {
        for (let j = 0; j < pos.length; j++) {
          if (j === d.i) continue;
          let vx = p.x - pos[j].x, vy = p.y - pos[j].y;
          let dist = Math.hypot(vx, vy);
          if (dist < 38) {
            if (dist < 0.01) { const a = Math.random() * 6.28; vx = Math.cos(a); vy = Math.sin(a); dist = 1; }
            p = clampP({ x: pos[j].x + (vx / dist) * 38, y: pos[j].y + (vy / dist) * 38 });
          }
        }
      }
      pos[d.i] = p;
      if (Math.hypot(p.x - d.from.x, p.y - d.from.y) > 4) {
        undo.push({ i: d.i, x: d.from.x, y: d.from.y });
        if (undo.length > 200) undo.shift();
        moves++;
        recompute();
        afterMove(redCount() < d.before);
        if (!(redCount() < d.before)) tone(330, 0.07, 'sine', 0.035);
      } else { recompute(); updateUI(); }
    }
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    const onUndo = () => {
      if (solved || !ready || !undo.length) return;
      audio();
      const u = undo.pop();
      pos[u.i] = { x: u.x, y: u.y };
      moves = Math.max(0, moves - 1);
      tone(400, 0.08, 'sine', 0.04);
      afterMove(false);
    };
    const onReset = () => {
      if (solved || !ready) return;
      audio();
      pos = lv.start.map((p) => ({ x: p.x, y: p.y }));
      moves = 0; undo = []; hintNode = -1;
      tone(300, 0.1, 'triangle', 0.04);
      recompute(); updateUI(); persist();
    };
    const onHint = () => {
      if (solved || !ready || hintsLeft <= 0) return;
      audio();
      // kies de knoop die, naar zijn oplossingsplek verplaatst, de meeste rode lijnen oplost
      let bi = -1, bs = 1e9, bd = -1;
      for (let i = 0; i < pos.length; i++) {
        if (pinSet.has(i)) continue;
        const d = Math.hypot(pos[i].x - lv.sol[i].x, pos[i].y - lv.sol[i].y);
        if (d < 6) continue;
        const keep = pos[i];
        pos[i] = lv.sol[i];
        const r = findCrossings(pos, lv.edges).filter(Boolean).length;
        pos[i] = keep;
        if (r < bs || (r === bs && d > bd)) { bs = r; bd = d; bi = i; }
      }
      if (bi < 0) return;
      undo.push({ i: bi, x: pos[bi].x, y: pos[bi].y });
      pos[bi] = { x: lv.sol[bi].x, y: lv.sol[bi].y };
      hintsLeft--; hintUsed = true; hintNode = bi; hintT = 1.6;
      tone(880, 0.1, 'triangle', 0.05); tone(1175, 0.14, 'triangle', 0.05, 0.08);
      afterMove(false);
    };
    const onPrev = () => { if (level > 1) { audio(); loadLevel(level - 1); } };
    const onNext = () => { if (level < maxL) { audio(); loadLevel(level + 1); } };
    const onCard = () => { audio(); loadLevel(nextUnsolved()); };
    const onMenu = () => { if (pickerOpen) closePicker(); else openPicker(); };
    const onGo = () => go(firstUnsolved());
    menuBtn.addEventListener('click', onMenu);
    mid.addEventListener('click', onMenu);
    pickClose.addEventListener('click', closePicker);
    pickGo.addEventListener('click', onGo);
    undoBtn.addEventListener('click', onUndo);
    resetBtn.addEventListener('click', onReset);
    hintBtn.addEventListener('click', onHint);
    prevBtn.addEventListener('click', onPrev);
    nextBtn.addEventListener('click', onNext);
    cardBtn.addEventListener('click', onCard);

    // ---------- tekenen ----------
    function drawNode(i, t) {
      const p = disp[i];
      const okNode = inc[i].every((k) => !red[k]);
      let r = NODE_R;
      if (drag && drag.i === i) r *= 1.25;
      if (solved) r *= 1 + 0.12 * Math.sin(winT * 9 - i * 0.7);
      else if (popT < 1) r *= Math.min(1, popT * 2 + 0.2);
      // schaduw
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.beginPath(); ctx.ellipse(p.x + 1, p.y + r * 0.9, r * 0.9, r * 0.4, 0, 0, 6.3); ctx.fill();
      if (hintNode === i) {
        ctx.strokeStyle = `rgba(253,224,71,${0.5 + 0.5 * Math.sin(t * 10)})`;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(p.x, p.y, r + 7 + 2 * Math.sin(t * 10), 0, 6.3); ctx.stroke();
      }
      const g = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.4, r * 0.1, p.x, p.y, r);
      const cols = theme.cols, col = cols[i % cols.length];
      if (pinSet.has(i)) {
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.arc(p.x, p.y, r + 4.5, 0, 6.3); ctx.stroke(); ctx.setLineDash([]);
      }
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, col); g.addColorStop(1, col);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.3); ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = okNode ? '#bbf7d0' : '#fecaca';
      ctx.stroke();
      // gezichtje
      const lx = drag && drag.i !== i ? 0 : 0;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(p.x - r * 0.33, p.y - r * 0.18, r * 0.24, 0, 6.3); ctx.arc(p.x + r * 0.33, p.y - r * 0.18, r * 0.24, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#0f172a';
      const py = okNode ? 0 : r * 0.05;
      ctx.beginPath(); ctx.arc(p.x - r * 0.33 + lx, p.y - r * 0.15 + py, r * 0.11, 0, 6.3); ctx.arc(p.x + r * 0.33 + lx, p.y - r * 0.15 + py, r * 0.11, 0, 6.3); ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
      ctx.beginPath();
      if (okNode) ctx.arc(p.x, p.y + r * 0.1, r * 0.38, 0.15 * Math.PI, 0.85 * Math.PI);
      else ctx.arc(p.x, p.y + r * 0.45, r * 0.16, 0, 6.3);
      ctx.stroke();
      if (pinSet.has(i)) { ctx.font = '13px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText('📌', p.x + r * 0.75, p.y - r * 1.05); }
    }
    function draw(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      // stippen
      ctx.fillStyle = 'rgba(255,255,255,.06)';
      for (let x = 12; x < cw; x += 28) for (let y = 12; y < ch; y += 28) ctx.fillRect(x, y, 2, 2);
      ctx.setTransform(dpr * sc, 0, 0, dpr * sc, dpr * ox, dpr * oy);
      // speelveld
      ctx.fillStyle = 'rgba(255,255,255,.04)';
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(4, 4, WORLD_W - 8, WORLD_H - 8, 18); else ctx.rect(4, 4, WORLD_W - 8, WORLD_H - 8);
      ctx.fill(); ctx.stroke();
      ctx.lineCap = 'round';
      const pulse = 0.75 + 0.25 * Math.sin(t * 7);
      lv.edges.forEach((e, k) => {
        const a = disp[e[0]], b = disp[e[1]];
        ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.strokeStyle = red[k] ? `rgba(248,113,113,${pulse})` : '#4ade80';
        ctx.lineWidth = red[k] ? 5 : 4.5;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
      for (let i = 0; i < lv.n; i++) if (!(drag && drag.i === i)) drawNode(i, t);
      if (drag) drawNode(drag.i, t);
      // confetti (schermcoordinaten)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const p of parts) {
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        if (p.star) { ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⭐', p.x, p.y); }
        else {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.fillRect(-4, -2.5, 8, 5); ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    }

    let raf = 0, last = 0;
    function frame(now) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      if (!ready || !lv) return;
      const k = 1 - Math.exp(-dt * 14);
      for (let i = 0; i < pos.length; i++) {
        if (drag && drag.i === i) { disp[i].x = pos[i].x; disp[i].y = pos[i].y; continue; }
        disp[i].x += (pos[i].x - disp[i].x) * k;
        disp[i].y += (pos[i].y - disp[i].y) * k;
      }
      if (popT < 1) popT = Math.min(1, popT + dt * 2.5);
      if (hintT > 0) { hintT -= dt; if (hintT <= 0) hintNode = -1; }
      if (solved) winT += dt;
      for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; p.vx *= 0.99; p.rot += p.vr * dt; p.life -= dt; }
      parts = parts.filter((p) => p.life > 0 && p.y < ch + 40);
      draw(now / 1000);
    }

    // ---------- start ----------
    let ro = null;
    const onResize = () => { measure(); };
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(onResize); ro.observe(canvas); }
    window.addEventListener('resize', onResize);
    measure();
    later(measure, 50);

    function start(saved) {
      if (dead) return;
      if (saved && typeof saved === 'object') {
        let s = typeof saved.s === 'string' ? saved.s : '';
        maxL = Math.max(1, Math.min(100000, saved.m | 0 || 1));
        // oude opslag (60 levels + eindeloos): sterren van level 61+ waren eindeloos en tellen niet mee
        if (saved.v !== 2) { s = s.slice(0, 60); maxL = Math.min(maxL, 61); }
        stars = [...s].map((c) => (c >= '0' && c <= '3' ? +c : 0));
        level = Math.max(1, Math.min(maxL, saved.l | 0 || 1));
      }
      ready = true;
      try { api.score(total()); } catch (e) { /* ignore */ }
      loadLevel(level);
      measure();
      raf = requestAnimationFrame(frame);
    }
    let p;
    try { p = api.load(); } catch (e) { p = null; }
    if (p && typeof p.then === 'function') p.then((s) => start(s), () => start(null));
    else start(null);

    return {
      destroy() {
        if (dead) return;
        persist();
        dead = true;
        cancelAnimationFrame(raf);
        timers.forEach((t) => clearTimeout(t)); timers.clear();
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerup', onUp);
        canvas.removeEventListener('pointercancel', onUp);
        undoBtn.removeEventListener('click', onUndo);
        resetBtn.removeEventListener('click', onReset);
        hintBtn.removeEventListener('click', onHint);
        prevBtn.removeEventListener('click', onPrev);
        nextBtn.removeEventListener('click', onNext);
        cardBtn.removeEventListener('click', onCard);
        menuBtn.removeEventListener('click', onMenu);
        mid.removeEventListener('click', onMenu);
        pickClose.removeEventListener('click', closePicker);
        pickGo.removeEventListener('click', onGo);
        window.removeEventListener('resize', onResize);
        if (ro) ro.disconnect();
        if (ac) { try { ac.close(); } catch (e) { /* ignore */ } ac = null; }
        if (root.parentNode) root.parentNode.removeChild(root);
      },
    };
  },
};
