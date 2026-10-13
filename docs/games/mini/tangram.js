// Tangram: leg de 7 stukken precies in het silhouet.
// Alle levels leven op een rooster (kleine driehoek = poot 1). Silhouetten worden altijd uit een echte
// legging van de stukken opgebouwd (achteruit gegenereerd) en zijn dus bewezen oplosbaar.

const PI2 = Math.PI / 2;

// ---------------------------------------------------------------- stukken
const TYPES = {
  L: { v: [[0, 0], [2, 0], [0, 2]], q: 8, n: 2, cols: ['#ef4444', '#3b82f6'], label: 'grote driehoek' },
  M: { v: [[0, 0], [2, 0], [1, 1]], q: 4, n: 1, cols: ['#22c55e'], label: 'middelgrote driehoek' },
  S: { v: [[0, 0], [1, 0], [0, 1]], q: 2, n: 2, cols: ['#f59e0b', '#a855f7'], label: 'kleine driehoek' },
  Q: { v: [[0, 0], [1, 0], [1, 1], [0, 1]], q: 4, n: 1, cols: ['#ec4899'], label: 'vierkant' },
  P: { v: [[0, 0], [1, 1], [2, 1], [1, 0]], q: 4, n: 1, cols: ['#14b8a6'], label: 'parallellogram' },
};
for (const t of Object.values(TYPES)) {
  let x = 0, y = 0;
  for (const p of t.v) { x += p[0]; y += p[1]; }
  t.c = [x / t.v.length, y / t.v.length];
}
const POOL = ['L', 'L', 'M', 'S', 'S', 'Q', 'P'];

// ---------------------------------------------------------------- kwartjes (rooster in 4 driehoekjes per cel)
// kwartje = driehoek met top in het midden van een cel; k: 0 boven, 1 rechts, 2 onder, 3 links
const qid = (i, j, k) => ((j + 40) * 160 + (i + 40)) * 4 + k;
function qdec(id) {
  const k = id & 3, c = id >> 2;
  return [c % 160 - 40, Math.floor(c / 160) - 40, k];
}
function qnb(id) {
  const [i, j, k] = qdec(id);
  const out = [[qid(i, j, (k + 1) & 3), 0.707], [qid(i, j, (k + 3) & 3), 0.707]];
  if (k === 0) out.push([qid(i, j - 1, 2), 1]);
  else if (k === 1) out.push([qid(i + 1, j, 3), 1]);
  else if (k === 2) out.push([qid(i, j + 1, 0), 1]);
  else out.push([qid(i - 1, j, 1), 1]);
  return out;
}
function quartersOf(vs) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const p of vs) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const out = [];
  const n = vs.length;
  for (let j = Math.floor(y0 + 1e-9); j < Math.ceil(y1 - 1e-9); j++) {
    for (let i = Math.floor(x0 + 1e-9); i < Math.ceil(x1 - 1e-9); i++) {
      const cs = [[i + 0.5, j + 1 / 6], [i + 5 / 6, j + 0.5], [i + 0.5, j + 5 / 6], [i + 1 / 6, j + 0.5]];
      for (let k = 0; k < 4; k++) {
        const px = cs[k][0], py = cs[k][1];
        let pos = 0, neg = 0;
        for (let a = 0; a < n; a++) {
          const A = vs[a], B = vs[(a + 1) % n];
          const cr = (B[0] - A[0]) * (py - A[1]) - (B[1] - A[1]) * (px - A[0]);
          if (cr > 1e-9) pos++; else if (cr < -1e-9) neg++; else { pos++; neg++; }
        }
        if (pos === n || neg === n) out.push(qid(i, j, k));
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- standen (flip, rot) van een stuk
const ORI = {};
for (const type of Object.keys(TYPES)) {
  const T = TYPES[type];
  ORI[type] = [];
  const seen = new Set();
  for (let f = 0; f < 2; f++) {
    for (let r = 0; r < 4; r++) {
      const pts = T.v.map((p) => {
        let x = p[0] - T.c[0], y = p[1] - T.c[1];
        if (f) x = -x;
        for (let t = 0; t < r; t++) { const nx = -y, ny = x; x = nx; y = ny; }
        return [x, y];
      });
      const off = pts.map((p) => [Math.round(p[0] - pts[0][0]), Math.round(p[1] - pts[0][1])]);
      const key = quartersOf(off).sort((a, b) => a - b).join(',');
      if (seen.has(key)) continue;
      seen.add(key);
      ORI[type].push({ f, r, off });
    }
  }
}
const PL_CACHE = {};
function placements(type, G) {
  const ck = type + G;
  if (PL_CACHE[ck]) return PL_CACHE[ck];
  const out = [];
  for (const o of ORI[type]) {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of o.off) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let tx = -x0; tx <= G - x1; tx++) {
      for (let ty = -y0; ty <= G - y1; ty++) {
        const verts = o.off.map((p) => [p[0] + tx, p[1] + ty]);
        out.push({ type, verts, flip: o.f, rot: o.r, q: quartersOf(verts) });
      }
    }
  }
  PL_CACHE[ck] = out;
  return out;
}

// ---------------------------------------------------------------- rng
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- oplosser (exacte bedekking) voor getekende silhouetten
function solveSil(sil, G = 8) {
  const qs = [...sil].sort((a, b) => a - b);
  const by = new Map();
  for (const type of Object.keys(TYPES)) {
    for (const p of placements(type, G)) {
      if (!p.q.every((q) => sil.has(q))) continue;
      for (const q of p.q) { if (!by.has(q)) by.set(q, []); by.get(q).push(p); }
    }
  }
  const used = { L: 0, M: 0, S: 0, Q: 0, P: 0 };
  const cov = new Set();
  const chosen = [];
  let nodes = 0;
  function dfs() {
    if (++nodes > 400000) return false;
    let first = -1;
    for (const q of qs) if (!cov.has(q)) { first = q; break; }
    if (first < 0) return chosen.length === 7;
    for (const p of by.get(first) || []) {
      if (used[p.type] >= TYPES[p.type].n) continue;
      if (p.q.some((q) => cov.has(q))) continue;
      used[p.type]++;
      p.q.forEach((q) => cov.add(q));
      chosen.push(p);
      if (dfs()) return true;
      chosen.pop();
      p.q.forEach((q) => cov.delete(q));
      used[p.type]--;
    }
    return false;
  }
  return dfs() ? chosen.map((p) => ({ type: p.type, verts: p.verts, flip: p.flip, rot: p.rot })) : null;
}

// '#' vol, 1 = linksboven-helft, 2 = rechtsboven, 3 = rechtsonder, 4 = linksonder, '.' leeg
function parseArt(rows) {
  const sil = new Set();
  rows.forEach((row, j) => {
    [...row].forEach((ch, i) => {
      const ks = ch === '#' ? [0, 1, 2, 3] : ch === '1' ? [0, 3] : ch === '2' ? [0, 1] : ch === '3' ? [2, 1] : ch === '4' ? [2, 3] : [];
      ks.forEach((k) => sil.add(qid(i, j, k)));
    });
  });
  return sil;
}

// ---------------------------------------------------------------- vaste figuren (alleen oplosbare; testscript bewijst dat)
const NAMED = [
  { name: 'Huis', art: ['.34.', '3##4', '####'] },
  { name: 'Kerstboom', art: ['.34.', '3##4', '.##.', '.##.'] },
  { name: 'Diamant', art: ['.34.', '####', '1##2'] },
  { name: 'Trechter', art: ['2##1', '.##.', '.##.', '.21.'] },
  { name: 'Trofee', art: ['#34#', '2##1', '.##.'] },
  { name: 'Vliegtuig', art: ['..#..', '#####', '.2#1.'] },
  { name: 'Ufo', art: ['...#...', '.3###4.', '..###..'] },
  { name: 'Krab', art: ['..#.#..', '.#####.', '.1...2.'] },
];

// ---------------------------------------------------------------- generator
function holes(qset) {
  // heeft de vorm een gat? vloeivul vanaf buiten
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const id of qset) { const [i, j] = qdec(id); x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); }
  x0--; y0--; x1++; y1++;
  const seen = new Set();
  const st = [qid(x0, y0, 0)];
  seen.add(st[0]);
  while (st.length) {
    const cur = st.pop();
    for (const [nb] of qnb(cur)) {
      const [i, j] = qdec(nb);
      if (i < x0 || i > x1 || j < y0 || j > y1 || seen.has(nb) || qset.has(nb)) continue;
      seen.add(nb);
      st.push(nb);
    }
  }
  const total = (x1 - x0 + 1) * (y1 - y0 + 1) * 4;
  return seen.size + qset.size !== total;
}

function genShape(k, rng, idx) {
  const G = 6;
  let best = null, bestScore = -1e9;
  const tries = k <= 3 ? 3 : 5;
  for (let cand = 0, att = 0; cand < tries && att < 600; att++) {
    // kies stukken
    const pool = POOL.slice();
    const types = [];
    while (types.length < k) types.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    types.sort((a, b) => TYPES[b].q - TYPES[a].q);
    const occ = new Set();
    const sol = [];
    let ok = true;
    for (const t of types) {
      const all = placements(t, G);
      const opts = [];
      for (const p of all) {
        if (p.q.some((q) => occ.has(q))) continue;
        if (sol.length) {
          let c = 0;
          for (const q of p.q) for (const [nb, w] of qnb(q)) if (occ.has(nb)) c += w;
          if (c < 0.99) continue;
          opts.push([p, c]);
        } else {
          // eerste stuk: liefst niet in een hoek
          const [bx, by] = [p.verts[0][0], p.verts[0][1]];
          if (bx >= 1 && bx <= G - 3 && by >= 1 && by <= G - 3) opts.push([p, 1]);
        }
      }
      if (!opts.length) { ok = false; break; }
      const pick = opts[Math.floor(rng() * opts.length)][0];
      sol.push(pick);
      pick.q.forEach((q) => occ.add(q));
    }
    if (!ok) continue;
    if (holes(occ)) continue;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of sol) for (const v of p.verts) { x0 = Math.min(x0, v[0]); x1 = Math.max(x1, v[0]); y0 = Math.min(y0, v[1]); y1 = Math.max(y1, v[1]); }
    const area = occ.size / 4;
    const compact = area / ((x1 - x0) * (y1 - y0));
    // vroeg: compacte, simpele vormen; laat: langgerekte, grillige vormen
    const want = idx < 20 ? compact : idx < 44 ? 0.1 * (rng() - 0.5) : -compact;
    cand++;
    if (want > bestScore) {
      bestScore = want;
      best = sol.map((p) => ({ type: p.type, verts: p.verts.map((v) => [v[0] - x0, v[1] - y0]), flip: p.flip, rot: p.rot }));
    }
  }
  return best;
}

// ---------------------------------------------------------------- levels
const LEVELS_FIXED = 60;
function pieceCount(idx) {
  if (idx < 4) return 2;
  if (idx < 10) return 3;
  if (idx < 20) return 4;
  if (idx < 32) return 5;
  if (idx < 44) return 6;
  return 7;
}
const NAMED_AT = [45, 47, 49, 51, 53, 55, 57, 59];
const named_cache = {};
function finishLevel(idx, name, sol) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const p of sol) for (const v of p.verts) { x0 = Math.min(x0, v[0]); x1 = Math.max(x1, v[0]); y0 = Math.min(y0, v[1]); y1 = Math.max(y1, v[1]); }
  const out = sol.map((p) => {
    const verts = p.verts.map((v) => [v[0] - x0, v[1] - y0]);
    return { type: p.type, verts, flip: p.flip, rot: p.rot, q: quartersOf(verts) };
  });
  const sil = new Set();
  out.forEach((p) => p.q.forEach((q) => sil.add(q)));
  return { idx, name, sol: out, sil, w: x1 - x0, h: y1 - y0, k: out.length };
}
function makeLevel(idx) {
  const ni = NAMED_AT.indexOf(idx);
  if (ni >= 0 && NAMED[ni]) {
    const nm = NAMED[ni];
    if (!named_cache[ni]) named_cache[ni] = solveSil(parseArt(nm.art), 8);
    if (named_cache[ni]) return finishLevel(idx, nm.name, named_cache[ni]);
  }
  const k = idx >= LEVELS_FIXED ? 7 : pieceCount(idx);
  for (let t = 0; t < 50; t++) {
    const rng = mulberry(idx * 7919 + 13 + t * 104729);
    const sol = genShape(k, rng, Math.min(idx, 59));
    if (sol) return finishLevel(idx, idx >= LEVELS_FIXED ? 'Eindeloos ' + (idx - LEVELS_FIXED + 1) : 'Vorm ' + (idx + 1), sol);
  }
  throw new Error('level ' + idx + ' kon niet gemaakt worden');
}

export const _core = { TYPES, NAMED, NAMED_AT, makeLevel, solveSil, parseArt, quartersOf, qdec, qid, pieceCount, LEVELS_FIXED, holes };

// ---------------------------------------------------------------- het spel
export default {
  id: 'tangram',
  name: 'Tangram',
  emoji: '🔷',
  hint: 'Sleep de stukken in de schaduw. Tik om te draaien, het parallellogram kun je spiegelen.',
  save: 'forever',
  create(host, api) {
    host.style.touchAction = 'none';
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;background:linear-gradient(165deg,#3730a3 0%,#1e1b4b 55%,#0f172a 100%);color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;box-sizing:border-box;user-select:none;-webkit-user-select:none;overflow:hidden';
    host.appendChild(root);
    let dead = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); };

    const BTN = 'border:0;border-radius:12px;background:rgba(255,255,255,.14);color:#fff;font-size:13px;font-weight:600;cursor:pointer;touch-action:manipulation;font-family:inherit;';
    // kop
    const head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;gap:6px;padding:8px 10px 2px;flex:none';
    const prevB = document.createElement('button');
    prevB.textContent = '◀';
    prevB.style.cssText = BTN + 'width:44px;height:44px;font-size:16px;flex:none';
    const nextB = document.createElement('button');
    nextB.textContent = '▶';
    nextB.style.cssText = BTN + 'width:44px;height:44px;font-size:16px;flex:none';
    const titleBox = document.createElement('div');
    titleBox.style.cssText = 'flex:1;text-align:center;line-height:1.15;min-width:0';
    const titleEl = document.createElement('div');
    titleEl.style.cssText = 'font-size:17px;font-weight:800';
    const subEl = document.createElement('div');
    subEl.style.cssText = 'font-size:12px;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
    titleBox.append(titleEl, subEl);
    const starEl = document.createElement('div');
    starEl.style.cssText = 'font-size:15px;font-weight:800;min-width:54px;text-align:right;flex:none';
    head.append(prevB, titleBox, nextB, starEl);

    // speelveld
    const stage = document.createElement('div');
    stage.style.cssText = 'position:relative;flex:1;min-height:0;overflow:hidden';
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;touch-action:none;display:block';
    stage.appendChild(cv);
    const toast = document.createElement('div');
    toast.style.cssText = 'position:absolute;left:50%;top:44%;transform:translate(-50%,0);background:rgba(15,23,42,.88);padding:8px 14px;border-radius:14px;font-size:14px;font-weight:600;pointer-events:none;opacity:0;transition:opacity .25s;text-align:center;max-width:86%';
    stage.appendChild(toast);
    const card = document.createElement('div');
    card.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(.6);background:linear-gradient(#fef3c7,#fcd34d);color:#422006;padding:18px 24px;border-radius:22px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.45);opacity:0;pointer-events:none;transition:opacity .25s,transform .35s cubic-bezier(.3,1.6,.5,1);min-width:210px';
    const cardTitle = document.createElement('div');
    cardTitle.style.cssText = 'font-size:22px;font-weight:900';
    const cardStars = document.createElement('div');
    cardStars.style.cssText = 'font-size:38px;margin:6px 0 10px;letter-spacing:4px';
    const cardNext = document.createElement('button');
    cardNext.textContent = 'Volgende ▶';
    cardNext.style.cssText = 'border:0;border-radius:14px;background:#7c3aed;color:#fff;font-size:17px;font-weight:800;padding:12px 22px;min-height:46px;cursor:pointer;touch-action:manipulation;font-family:inherit';
    card.append(cardTitle, cardStars, cardNext);
    stage.appendChild(card);

    // knoppen onder
    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:6px;padding:4px 8px 10px;flex:none';
    const mk = (txt) => {
      const b = document.createElement('button');
      b.innerHTML = txt;
      b.style.cssText = BTN + 'flex:1;min-height:48px;padding:2px;line-height:1.2';
      bar.appendChild(b);
      return b;
    };
    const undoB = mk('↩<br>Terug');
    const resetB = mk('🔄<br>Opnieuw');
    const hintB = mk('💡<br>Hint');
    const rotB = mk('↻<br>Draai');
    const flipB = mk('⇋<br>Spiegel');
    root.append(head, stage, bar);

    // ---------------------------------------------------------- geluid
    let ac = null;
    function audio() {
      if (ac || dead) return ac;
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; }
      return ac;
    }
    function tone(f, d, type, v, delay) {
      try {
        const a = audio();
        if (!a) return;
        if (a.state === 'suspended') a.resume();
        const t = a.currentTime + (delay || 0);
        const o = a.createOscillator(), g = a.createGain();
        o.type = type || 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(v || 0.05, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g);
        g.connect(a.destination);
        o.start(t);
        o.stop(t + d + 0.03);
      } catch (e) { /* geluid is bijzaak */ }
    }
    const sPick = () => tone(520, 0.07, 'triangle', 0.04);
    const sRot = () => tone(660, 0.06, 'square', 0.025);
    const sSnap = () => { tone(784, 0.09, 'sine', 0.06); tone(1175, 0.14, 'sine', 0.05, 0.07); };
    const sBack = () => tone(330, 0.08, 'triangle', 0.04);
    const sHint = () => { tone(880, 0.12, 'sine', 0.05); tone(1320, 0.2, 'sine', 0.04, 0.1); };
    const sWin = () => [523, 659, 784, 1047, 1319].forEach((f, n) => tone(f, 0.22, 'triangle', 0.06, n * 0.1));

    // ---------------------------------------------------------- staat
    let st = { lv: 0, stars: new Array(LEVELS_FIXED).fill(0), es: 0, ec: 0, hints: 5 };
    let loaded = false;
    let lvl = null, idx = 0;
    let pieces = [], occ = new Set();
    let cw = 360, ch = 500, dpr = 1, s = 40, ox = 0, oy = 0, silH = 200, trayY = 220, trayH = 200;
    let sel = null, drag = null, ghost = null;
    let undo = [], hintsUsed = 0, drops = 0, locked = false, hintSlot = null, hintPiece = null, hintBad = null, hintUntil = 0;
    let parts = [], winFlash = 0;
    let raf = 0, lastT = 0;
    const ptrs = new Map();
    const ctx = cv.getContext('2d');

    const reach = () => {
      for (let i = 0; i < LEVELS_FIXED; i++) if (!st.stars[i]) return i;
      return LEVELS_FIXED + st.ec;
    };
    const total = () => st.stars.reduce((a, b) => a + b, 0) + st.es;
    function persist() {
      try {
        if (!loaded) return;
        api.save({ v: 1, lv: idx, st: st.stars.join(''), es: st.es, ec: st.ec, h: st.hints });
      } catch (e) { /* ok */ }
    }
    const rotOf = (pc) => ((Math.round(pc.angG / PI2) % 4) + 4) % 4;

    function say(txt, ms) {
      toast.textContent = txt;
      toast.style.opacity = '1';
      later(() => { toast.style.opacity = '0'; }, ms || 1800);
    }

    // ---------------------------------------------------------- geometrie
    const toW = (px, py) => [(px - ox) / s, (py - oy) / s];
    function worldVerts(pc, x, y) {
      const T = TYPES[pc.type];
      const r = rotOf(pc);
      return T.v.map((p) => {
        let a = p[0] - T.c[0], b = p[1] - T.c[1];
        if (pc.flipG) a = -a;
        for (let t = 0; t < r; t++) { const na = -b, nb = a; a = na; b = nb; }
        return [x + a, y + b];
      });
    }
    function screenVerts(pc) {
      const T = TYPES[pc.type];
      const ca = Math.cos(pc.ang), sa = Math.sin(pc.ang);
      return T.v.map((p) => {
        const a = (p[0] - T.c[0]) * pc.fx, b = p[1] - T.c[1];
        return [ox + (pc.x + a * ca - b * sa) * s, oy + (pc.y + a * sa + b * ca) * s];
      });
    }
    function inPoly(vs, px, py) {
      let pos = 0, neg = 0;
      for (let a = 0; a < vs.length; a++) {
        const A = vs[a], B = vs[(a + 1) % vs.length];
        const cr = (B[0] - A[0]) * (py - A[1]) - (B[1] - A[1]) * (px - A[0]);
        if (cr >= 0) pos++; else neg++;
      }
      return pos === vs.length || neg === vs.length;
    }
    function computeOcc() {
      occ = new Set();
      for (const pc of pieces) if (pc.placed) pc.q.forEach((q) => occ.add(q));
    }
    function trySnap(pc) {
      const vs = worldVerts(pc, pc.gx, pc.gy);
      const bx = Math.round(vs[0][0]) - vs[0][0], by = Math.round(vs[0][1]) - vs[0][1];
      let best = null;
      for (let a = -1; a <= 1; a++) {
        for (let b = -1; b <= 1; b++) {
          const sx = bx + a, sy = by + b;
          const d = Math.hypot(sx, sy);
          if (d > 1.0 || (best && d >= best.d)) continue;
          const verts = vs.map((p) => [Math.round(p[0] + sx), Math.round(p[1] + sy)]);
          const q = quartersOf(verts);
          if (q.length !== TYPES[pc.type].q) continue;
          let good = true;
          for (const id of q) if (!lvl.sil.has(id) || occ.has(id)) { good = false; break; }
          if (!good) continue;
          best = { d, verts, q, sx, sy };
        }
      }
      return best;
    }

    // ---------------------------------------------------------- opmaak
    function layout() {
      const r = stage.getBoundingClientRect();
      cw = Math.max(220, Math.round(r.width || api.w || 360));
      ch = Math.max(240, Math.round(r.height || (api.h ? api.h - 130 : 500)));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(cw * dpr);
      cv.height = Math.round(ch * dpr);
      cv.style.width = cw + 'px';
      cv.style.height = ch + 'px';
      if (!lvl) return;
      silH = ch * 0.46;
      s = Math.max(16, Math.min((cw - 28) / lvl.w, (silH - 18) / lvl.h, 40));
      ox = (cw - lvl.w * s) / 2;
      oy = 6 + (silH - 6 - lvl.h * s) / 2;
      trayY = silH + 6;
      trayH = ch - trayY - 6;
    }
    function trayLayout(all) {
      const list = pieces.filter((p) => !p.placed);
      const n = list.length;
      if (!n) return;
      const cols = Math.min(n, n > 6 ? 4 : 3);
      const rows = Math.ceil(n / cols);
      const cwid = (cw - 12) / cols, chei = trayH / rows;
      list.forEach((pc, n2) => {
        const c = n2 % cols, r = Math.floor(n2 / cols);
        const inRow = r === rows - 1 ? n - r * cols : cols;
        const off = (cols - inRow) * cwid / 2;
        const px = 6 + off + (c + 0.5) * cwid, py = trayY + (r + 0.5) * chei;
        const [wx, wy] = toW(px, py);
        pc.x = pc.gx = wx;
        pc.y = pc.gy = wy;
        if (all) { /* positie volledig nieuw */ }
      });
    }

    // ---------------------------------------------------------- level starten
    function startLevel(i, keepToast) {
      idx = Math.max(0, i);
      try { lvl = makeLevel(idx); } catch (e) { idx = 0; lvl = makeLevel(0); }
      locked = false; drag = null; sel = null; ghost = null; ptrs.clear();
      undo = []; hintsUsed = 0; drops = 0; hintSlot = hintPiece = hintBad = null; hintUntil = 0; parts = []; winFlash = 0;
      card.style.opacity = '0'; card.style.transform = 'translate(-50%,-50%) scale(.6)'; card.style.pointerEvents = 'none';
      layout();
      const rng = mulberry(idx * 31 + 5);
      const used = {};
      pieces = lvl.sol.map((sl, n) => {
        const T = TYPES[sl.type];
        used[sl.type] = (used[sl.type] || 0) + 1;
        const rot = idx < 8 ? sl.rot : (sl.rot + Math.floor(rng() * 4)) % 4;
        let flip = sl.flip;
        if (sl.type === 'P' && idx >= 20 && rng() < 0.5) flip = 1 - flip;
        return {
          id: n, type: sl.type, color: T.cols[used[sl.type] - 1],
          x: 0, y: 0, gx: 0, gy: 0, ang: rot * PI2, angG: rot * PI2, fx: flip ? -1 : 1, flipG: flip,
          placed: false, q: null, pop: 0,
        };
      });
      // schud volgorde in de lade
      for (let a = pieces.length - 1; a > 0; a--) { const b = Math.floor(rng() * (a + 1)); [pieces[a], pieces[b]] = [pieces[b], pieces[a]]; }
      occ = new Set();
      trayLayout();
      updateHead();
      if (idx < 2 && !keepToast) say('Sleep de stukken in de schaduw. Tik op een stuk om te draaien.', 3600);
      else if (idx === 12 && !keepToast) say('Het parallellogram kun je spiegelen met ⇋', 3000);
      kick();
    }
    function updateHead() {
      titleEl.textContent = idx < LEVELS_FIXED ? `Level ${idx + 1} / ${LEVELS_FIXED}` : `Level ${idx + 1} ∞`;
      subEl.textContent = `${lvl.name} · ${lvl.k} stukken`;
      starEl.textContent = '⭐ ' + total();
      prevB.disabled = idx <= 0;
      prevB.style.opacity = idx <= 0 ? '.35' : '1';
      const canNext = idx < reach();
      nextB.disabled = !canNext;
      nextB.style.opacity = canNext ? '1' : '.35';
      hintB.innerHTML = `💡<br>Hint ${st.hints}`;
      hintB.style.opacity = st.hints > 0 ? '1' : '.5';
      const pc = sel && pieces.includes(sel) ? sel : null;
      flipB.style.opacity = pc && pc.type === 'P' ? '1' : '.4';
      rotB.style.opacity = pc ? '1' : '.6';
      undoB.style.opacity = undo.length ? '1' : '.4';
      api.score(total());
    }

    // ---------------------------------------------------------- ongedaan
    function snapshot() {
      return pieces.map((p) => ({ id: p.id, gx: p.gx, gy: p.gy, angG: p.angG, flipG: p.flipG, placed: p.placed, q: p.q }));
    }
    function pushUndo(sn) {
      undo.push(sn);
      if (undo.length > 60) undo.shift();
    }
    function doUndo() {
      if (locked || !undo.length) return;
      const sn = undo.pop();
      for (const e of sn) {
        const pc = pieces.find((p) => p.id === e.id);
        if (!pc) continue;
        pc.gx = e.gx; pc.gy = e.gy; pc.angG = e.angG; pc.flipG = e.flipG; pc.placed = e.placed; pc.q = e.q;
      }
      computeOcc();
      clearHint();
      sBack();
      updateHead();
      kick();
    }
    function clearHint() { hintSlot = hintPiece = hintBad = null; hintUntil = 0; }

    // ---------------------------------------------------------- invoer
    function pt(e) {
      const r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function hit(p) {
      for (let a = pieces.length - 1; a >= 0; a--) {
        const pc = pieces[a];
        if (inPoly(screenVerts(pc), p.x, p.y)) return pc;
      }
      let best = null, bd = 30;
      for (const pc of pieces) {
        const d = Math.hypot(ox + pc.x * s - p.x, oy + pc.y * s - p.y);
        if (d < bd) { bd = d; best = pc; }
      }
      return best;
    }
    function toFront(pc) {
      const i = pieces.indexOf(pc);
      if (i >= 0) { pieces.splice(i, 1); pieces.push(pc); }
    }
    const onDown = (e) => {
      if (dead) return;
      audio();
      const p = pt(e);
      if (locked) return;
      ptrs.set(e.pointerId, p);
      try { cv.setPointerCapture(e.pointerId); } catch (er) { /* ok */ }
      if (drag && drag.pid !== e.pointerId && !drag.rot && ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        drag.rot = true;
        drag.a0 = Math.atan2(b.y - a.y, b.x - a.x);
        drag.base = drag.pc.angG;
        return;
      }
      if (drag) return;
      const pc = hit(p);
      if (!pc) { sel = null; updateHead(); return; }
      sel = pc;
      toFront(pc);
      clearHint();
      drag = {
        pid: e.pointerId, pc, sx: p.x, sy: p.y, ox: pc.x - toW(p.x, p.y)[0], oy: pc.y - toW(p.x, p.y)[1],
        moved: false, rot: false, snap: snapshot(), t0: performance.now(), wasPlaced: pc.placed,
      };
      sPick();
      updateHead();
      kick();
    };
    const onMove = (e) => {
      if (dead) return;
      if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, pt(e));
      if (!drag) return;
      const pc = drag.pc;
      if (drag.rot) {
        const v = [...ptrs.values()];
        if (v.length >= 2) {
          const cur = Math.atan2(v[1].y - v[0].y, v[1].x - v[0].x);
          pc.angG = pc.ang = drag.base + (cur - drag.a0);
          drag.moved = true;
          kick();
        }
        return;
      }
      if (e.pointerId !== drag.pid) return;
      const p = pt(e);
      if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) < 7) return;
      if (!drag.moved) {
        drag.moved = true;
        if (pc.placed) { pc.placed = false; pc.q = null; computeOcc(); }
      }
      const cx = Math.max(14, Math.min(cw - 14, p.x)), cy = Math.max(14, Math.min(ch - 14, p.y));
      const [wx, wy] = toW(cx, cy);
      pc.x = pc.gx = wx + drag.ox;
      pc.y = pc.gy = wy + drag.oy;
      ghost = trySnap(pc);
      kick();
    };
    const onUp = (e) => {
      if (dead) return;
      const had = ptrs.delete(e.pointerId);
      if (!drag || !had) return;
      if (!drag.rot && e.pointerId !== drag.pid) return;
      const d = drag, pc = d.pc;
      if (d.rot) {
        pc.angG = Math.round(pc.angG / PI2) * PI2;
        drag = null;
        ptrs.clear();
        finishDrop(d);
        return;
      }
      drag = null;
      ghost = null;
      if (!d.moved) {
        // tik
        if (pc.placed) {
          pc.placed = false; pc.q = null; computeOcc();
          pushUndo(d.snap);
          sBack();
        } else {
          pc.angG += PI2;
          pushUndo(d.snap);
          sRot();
        }
        updateHead();
        kick();
        return;
      }
      finishDrop(d);
    };
    function finishDrop(d) {
      const pc = d.pc;
      computeOcc();
      const sn = trySnap(pc);
      if (sn) {
        const c = [0, 0];
        sn.verts.forEach((v) => { c[0] += v[0]; c[1] += v[1]; });
        pc.gx = c[0] / sn.verts.length;
        pc.gy = c[1] / sn.verts.length;
        pc.placed = true;
        pc.q = sn.q;
        pc.pop = 1;
        drops++;
        computeOcc();
        sSnap();
        burst(ox + pc.gx * s, oy + pc.gy * s, 8, pc.color);
      } else {
        const cx = Math.max(20, Math.min(cw - 20, ox + pc.gx * s)), cy = Math.max(20, Math.min(ch - 20, oy + pc.gy * s));
        const w = toW(cx, cy);
        pc.gx = w[0]; pc.gy = w[1];
        pc.placed = false; pc.q = null;
        tone(300, 0.06, 'triangle', 0.03);
      }
      pushUndo(d.snap);
      ghost = null;
      updateHead();
      kick();
      if (occ.size === lvl.sil.size) win();
    }
    const onCancel = (e) => {
      ptrs.delete(e.pointerId);
      if (drag && (e.pointerId === drag.pid)) { const d = drag; drag = null; ptrs.clear(); finishDrop(d); }
    };
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onCancel);
    const onWheel = (e) => {
      if (!sel || locked) return;
      e.preventDefault();
      doRotate(e.deltaY > 0 ? 1 : -1);
    };
    cv.addEventListener('wheel', onWheel, { passive: false });

    function doRotate(dir) {
      if (locked) return;
      const pc = sel && pieces.includes(sel) ? sel : null;
      if (!pc) { say('Tik eerst op een stuk', 1200); return; }
      pushUndo(snapshot());
      if (pc.placed) { pc.placed = false; pc.q = null; computeOcc(); }
      pc.angG += dir * PI2;
      sRot();
      updateHead();
      kick();
    }
    function doFlip() {
      if (locked) return;
      const pc = sel && pieces.includes(sel) ? sel : null;
      if (!pc) { say('Tik eerst op het parallellogram', 1400); return; }
      if (pc.type !== 'P') { say('Alleen het parallellogram kun je spiegelen', 1600); return; }
      pushUndo(snapshot());
      if (pc.placed) { pc.placed = false; pc.q = null; computeOcc(); }
      pc.flipG = 1 - pc.flipG;
      sRot();
      updateHead();
      kick();
    }
    function doHint() {
      if (locked) return;
      if (st.hints <= 0) { say('Geen hints meer. Rond levels af voor nieuwe!', 2200); return; }
      computeOcc();
      const placedQs = pieces.filter((p) => p.placed).map((p) => ({ p, k: p.type + [...p.q].sort((a, b) => a - b).join(',') }));
      const solKey = lvl.sol.map((sl) => ({ sl, k: sl.type + [...sl.q].sort((a, b) => a - b).join(',') }));
      // eerst: klopt alles wat al ligt?
      const bad = placedQs.find((e) => !solKey.some((s2) => s2.k === e.k));
      if (bad) {
        hintBad = bad.p; hintSlot = null; hintPiece = null;
        say('Dit stuk zit nog niet goed. Haal het weg.', 2400);
      } else {
        const taken = new Set(placedQs.map((e) => e.k));
        const free = solKey.filter((e) => {
          if (taken.has(e.k)) { taken.delete(e.k); return false; }
          return true;
        });
        const loose = pieces.filter((p) => !p.placed);
        let pickP = null, pickS = null;
        for (const sl of free.sort((a, b) => TYPES[b.sl.type].q - TYPES[a.sl.type].q)) {
          const pc = loose.find((p) => p.type === sl.sl.type);
          if (pc) { pickP = pc; pickS = sl.sl; break; }
        }
        if (!pickP) { say('Probeer een stuk weg te halen', 2000); return; }
        hintPiece = pickP; hintSlot = pickS; hintBad = null;
        // draai het stuk alvast goed
        pickP.flipG = pickS.flip;
        pickP.angG += ((pickS.rot - rotOf(pickP) + 4) % 4) * PI2;
        toFront(pickP);
        sel = pickP;
        say('Dit stuk hoort daar 👆', 2400);
      }
      st.hints--;
      hintsUsed++;
      hintUntil = performance.now() + 6000;
      sHint();
      persist();
      updateHead();
      kick();
    }
    function doReset() {
      if (locked) return;
      startLevel(idx, true);
      sBack();
    }
    undoB.addEventListener('click', doUndo);
    resetB.addEventListener('click', doReset);
    hintB.addEventListener('click', doHint);
    rotB.addEventListener('click', () => doRotate(1));
    flipB.addEventListener('click', doFlip);
    prevB.addEventListener('click', () => { if (idx > 0) { startLevel(idx - 1); persist(); } });
    nextB.addEventListener('click', () => { if (idx < reach()) { startLevel(idx + 1); persist(); } });
    cardNext.addEventListener('click', () => { startLevel(idx + 1); persist(); });
    const onKey = (e) => {
      const k = e.key;
      if (k === 'r' || k === 'R') doRotate(e.shiftKey ? -1 : 1);
      else if (k === 'f' || k === 'F') doFlip();
      else if (k === 'z' || k === 'Z') doUndo();
      else if (k === 'h' || k === 'H') doHint();
      else if ((k === 'Enter' || k === 'n' || k === 'N') && locked && card.style.opacity === '1') { startLevel(idx + 1); persist(); }
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);

    // ---------------------------------------------------------- winnen
    function burst(x, y, n, col) {
      const cols = col ? [col, '#fff'] : ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#c084fc', '#f472b6'];
      for (let a = 0; a < n; a++) {
        const an = Math.random() * Math.PI * 2, sp = 80 + Math.random() * 260;
        parts.push({ x, y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 120, r: Math.random() * 6, vr: (Math.random() - 0.5) * 12, life: 1.1 + Math.random() * 0.9, w: 5 + Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)], star: Math.random() < 0.18 });
      }
    }
    function win() {
      locked = true;
      sel = null;
      clearHint();
      const n = lvl.k;
      let stars = 3 - Math.min(2, hintsUsed);
      if (drops > n * 2 + 2) stars = Math.min(stars, 2);
      stars = Math.max(1, stars);
      let first = false;
      if (idx < LEVELS_FIXED) {
        if (!st.stars[idx]) first = true;
        if (stars > st.stars[idx]) st.stars[idx] = stars;
      } else if (idx === LEVELS_FIXED + st.ec) {
        first = true; st.ec++; st.es += stars;
      }
      if (first) {
        const done = st.stars.filter(Boolean).length + st.ec;
        if (done % 3 === 0 && st.hints < 9) { st.hints++; }
      }
      winFlash = 1;
      later(() => {
        sWin();
        burst(cw / 2, silH * 0.5, 70);
        later(() => burst(cw * 0.25, silH * 0.4, 30), 250);
        later(() => burst(cw * 0.75, silH * 0.4, 30), 450);
        kick();
      }, 350);
      cardTitle.textContent = ['', 'Goed zo!', 'Mooi gelegd!', 'Perfect!'][stars];
      cardStars.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
      later(() => {
        card.style.opacity = '1';
        card.style.transform = 'translate(-50%,-50%) scale(1)';
        card.style.pointerEvents = 'auto';
      }, 1000);
      persist();
      updateHead();
      kick();
    }

    // ---------------------------------------------------------- tekenen
    function kick() {
      if (!raf && !dead) { lastT = performance.now(); raf = requestAnimationFrame(tick); }
    }
    function tick(ts) {
      raf = 0;
      if (dead) return;
      const dt = Math.min(0.05, Math.max(0.001, (ts - lastT) / 1000));
      lastT = ts;
      let busy = false;
      const k = 1 - Math.exp(-dt * 18);
      for (const pc of pieces) {
        const dragging = drag && drag.pc === pc && !drag.rot;
        if (!dragging) {
          const dx = pc.gx - pc.x, dy = pc.gy - pc.y;
          if (Math.abs(dx) + Math.abs(dy) > 0.002) { pc.x += dx * k; pc.y += dy * k; busy = true; } else { pc.x = pc.gx; pc.y = pc.gy; }
        }
        if (!(drag && drag.pc === pc && drag.rot)) {
          const da = pc.angG - pc.ang;
          if (Math.abs(da) > 0.003) { pc.ang += da * k; busy = true; } else pc.ang = pc.angG;
        }
        const tf = pc.flipG ? -1 : 1;
        if (Math.abs(tf - pc.fx) > 0.01) { pc.fx += (tf - pc.fx) * k; busy = true; } else pc.fx = tf;
        if (pc.pop > 0) { pc.pop = Math.max(0, pc.pop - dt * 4); busy = true; }
      }
      if (parts.length) {
        busy = true;
        for (const p of parts) {
          p.vy += 520 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.life -= dt;
        }
        parts = parts.filter((p) => p.life > 0 && p.y < ch + 30);
      }
      if (winFlash > 0) { winFlash = Math.max(0, winFlash - dt * 0.8); busy = true; }
      if (hintUntil) {
        if (performance.now() > hintUntil) clearHint(); else busy = true;
      }
      if (drag) busy = true;
      draw();
      if (busy) raf = requestAnimationFrame(tick);
    }
    function silPath() {
      const p = new Path2D();
      for (const id of lvl.sil) {
        const [i, j, k] = qdec(id);
        const X = ox + i * s, Y = oy + j * s, c = [X + s / 2, Y + s / 2];
        const cs = [[X, Y], [X + s, Y], [X + s, Y + s], [X, Y + s]];
        const a = cs[k], b = cs[(k + 1) & 3];
        p.moveTo(a[0], a[1]); p.lineTo(b[0], b[1]); p.lineTo(c[0], c[1]); p.closePath();
      }
      return p;
    }
    function polyPath(vs) {
      ctx.beginPath();
      vs.forEach((v, n) => (n ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1])));
      ctx.closePath();
    }
    function draw() {
      if (!lvl) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      // lade
      ctx.fillStyle = 'rgba(255,255,255,.06)';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(6, trayY - 2, cw - 12, trayH + 4, 18) : ctx.rect(6, trayY - 2, cw - 12, trayH + 4);
      ctx.fill();
      // silhouet
      const sp = silPath();
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.5)';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#c7d2fe';
      ctx.fill(sp);
      ctx.restore();
      ctx.fillStyle = 'rgba(99,102,241,.35)';
      ctx.fill(sp);
      // hint-slot
      const now = performance.now();
      if (hintSlot) {
        const pulse = 0.5 + 0.5 * Math.sin(now / 150);
        const vs = hintSlot.verts.map((v) => [ox + v[0] * s, oy + v[1] * s]);
        polyPath(vs);
        ctx.fillStyle = `rgba(253,224,71,${0.25 + 0.35 * pulse})`;
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      // ghost
      if (ghost) {
        polyPath(ghost.verts.map((v) => [ox + v[0] * s, oy + v[1] * s]));
        ctx.fillStyle = 'rgba(255,255,255,.28)';
        ctx.fill();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // stukken
      for (const pc of pieces) {
        const vs = screenVerts(pc);
        const dragging = drag && drag.pc === pc && drag.moved;
        const sc = 1 + pc.pop * 0.12 + (dragging ? 0.06 : 0);
        let cx = 0, cy = 0;
        vs.forEach((v) => { cx += v[0]; cy += v[1]; });
        cx /= vs.length; cy /= vs.length;
        const sv = sc === 1 ? vs : vs.map((v) => [cx + (v[0] - cx) * sc, cy + (v[1] - cy) * sc]);
        ctx.save();
        if (!pc.placed) {
          ctx.shadowColor = 'rgba(0,0,0,.45)';
          ctx.shadowBlur = dragging ? 16 : 7;
          ctx.shadowOffsetY = dragging ? 6 : 3;
        }
        polyPath(sv);
        ctx.fillStyle = pc.color;
        ctx.fill();
        ctx.restore();
        // lichte glans
        polyPath(sv);
        const g = ctx.createLinearGradient(cx - s, cy - s, cx + s, cy + s);
        g.addColorStop(0, 'rgba(255,255,255,.35)');
        g.addColorStop(1, 'rgba(0,0,0,.18)');
        ctx.fillStyle = g;
        ctx.fill();
        ctx.lineJoin = 'round';
        ctx.lineWidth = pc === sel ? 3.5 : 2;
        ctx.strokeStyle = pc === sel ? '#fff' : 'rgba(255,255,255,.7)';
        ctx.stroke();
        if (winFlash > 0 && pc.placed) {
          polyPath(sv);
          ctx.fillStyle = `rgba(255,255,255,${winFlash * 0.7 * (0.5 + 0.5 * Math.sin(now / 60))})`;
          ctx.fill();
        }
        if ((pc === hintPiece || pc === hintBad) && hintUntil) {
          const pulse = 0.5 + 0.5 * Math.sin(now / 130);
          polyPath(sv);
          ctx.lineWidth = 4 + pulse * 3;
          ctx.strokeStyle = pc === hintBad ? '#f87171' : '#fde047';
          ctx.stroke();
        }
      }
      // confetti
      for (const p of parts) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        if (p.star) {
          ctx.font = '18px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⭐', 0, 0);
        } else {
          ctx.fillStyle = p.c;
          ctx.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2);
        }
        ctx.restore();
      }
    }

    // ---------------------------------------------------------- start
    let ro = null;
    const onResize = () => {
      if (dead || !lvl) return;
      layout();
      trayLayout();
      kick();
    };
    window.addEventListener('resize', onResize);
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        const r = stage.getBoundingClientRect();
        if (Math.abs(Math.round(r.width) - cw) > 1 || Math.abs(Math.round(r.height) - ch) > 1) onResize();
      });
      ro.observe(stage);
    }

    startLevel(0, true);
    api.score(0);
    api.load().then((saved) => {
      if (dead) return;
      loaded = true;
      if (saved && saved.v === 1) {
        const arr = String(saved.st || '').split('').map((c) => Math.max(0, Math.min(3, parseInt(c, 10) || 0)));
        while (arr.length < LEVELS_FIXED) arr.push(0);
        st.stars = arr.slice(0, LEVELS_FIXED);
        st.es = Math.max(0, saved.es | 0);
        st.ec = Math.max(0, saved.ec | 0);
        st.hints = Math.max(0, Math.min(9, saved.h == null ? 5 : saved.h | 0));
        const lv = Math.max(0, Math.min(reach(), saved.lv | 0));
        startLevel(lv, true);
      } else {
        updateHead();
      }
    }).catch(() => { loaded = true; });

    return {
      destroy() {
        dead = true;
        try { persist(); } catch (e) { /* ok */ }
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        timers.forEach(clearTimeout);
        timers.clear();
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('resize', onResize);
        if (ro) ro.disconnect();
        cv.removeEventListener('pointerdown', onDown);
        cv.removeEventListener('pointermove', onMove);
        cv.removeEventListener('pointerup', onUp);
        cv.removeEventListener('pointercancel', onCancel);
        cv.removeEventListener('wheel', onWheel);
        try { if (ac) ac.close(); } catch (e) { /* ok */ }
        ac = null;
        root.remove();
      },
    };
  },
};
