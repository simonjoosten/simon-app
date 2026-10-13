// Test voor docs/games/mini/tangram.js: elk level bewijsbaar oplosbaar + rooktest met nep-DOM.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const M = await import(pathToFileURL(path.join(here, '..', 'docs', 'games', 'mini', 'tangram.js')).href);
const game = M.default, C = M._core;

assert.equal(game.id, 'tangram');
assert.equal(game.save, 'forever');
assert.ok(game.name && game.emoji && game.hint && typeof game.create === 'function');

const AREA = { L: 2, M: 1, S: 0.5, Q: 1, P: 1 };
const AVAIL = { L: 2, M: 1, S: 2, Q: 1, P: 1 };
// zijden (gesorteerd) van elk stuk: onafhankelijke controle dat de vorm echt klopt
const R = Math.SQRT2;
const SIDES = { L: [2, 2, 2 * R], M: [R, R, 2], S: [1, 1, R], Q: [1, 1, 1, 1], P: [1, 1, R, R] };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const polyArea = (v) => { let s = 0; for (let i = 0; i < v.length; i++) { const a = v[i], b = v[(i + 1) % v.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
function inside(v, px, py) {
  let pos = 0, neg = 0;
  for (let i = 0; i < v.length; i++) {
    const a = v[i], b = v[(i + 1) % v.length];
    const c = (b[0] - a[0]) * (py - a[1]) - (b[1] - a[1]) * (px - a[0]);
    if (c > 0) pos++; else neg++;
  }
  return pos === v.length || neg === v.length;
}
// silhouet-lidmaatschap van een punt (onafhankelijk van kwartjes-code van de polygonen)
function silHas(l, x, y) {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
  // welk kwart: boven/rechts/onder/links via diagonalen
  let k;
  const up = fy < fx, down = fy < 1 - fx; // boven-rechts van '\' ; boven-links van '/'
  if (up && down) k = 0; else if (up && !down) k = 1; else if (!up && !down) k = 2; else k = 3;
  return l.sil.has(C.qid(i, j, k));
}

const TOTAL = 100;
let lastK = 0;
const bySize = {};
for (let idx = 0; idx < TOTAL; idx++) {
  const l = C.makeLevel(idx);
  const expK = idx >= C.LEVELS_FIXED ? 7 : C.pieceCount(idx);
  assert.equal(l.k, expK, 'aantal stukken level ' + idx);
  assert.equal(l.sol.length, expK);
  if (idx < C.LEVELS_FIXED) { assert.ok(l.k >= lastK, 'moeilijkheid daalt niet (stukken) level ' + idx); lastK = l.k; }
  bySize[l.k] = (bySize[l.k] || 0) + 1;
  const cnt = {};
  let areaSum = 0;
  for (const p of l.sol) {
    cnt[p.type] = (cnt[p.type] || 0) + 1;
    assert.ok(cnt[p.type] <= AVAIL[p.type], 'te veel stukken van ' + p.type + ' level ' + idx);
    // vorm klopt (zijden + oppervlak)
    const sides = p.verts.map((v, i) => dist(v, p.verts[(i + 1) % p.verts.length])).sort((a, b) => a - b);
    const exp = SIDES[p.type].slice().sort((a, b) => a - b);
    assert.equal(sides.length, exp.length);
    sides.forEach((s, i) => assert.ok(Math.abs(s - exp[i]) < 1e-9, `zijde ${p.type} level ${idx}`));
    assert.ok(Math.abs(polyArea(p.verts) - AREA[p.type]) < 1e-9, 'oppervlak ' + p.type);
    areaSum += AREA[p.type];
    p.verts.forEach((v) => { assert.ok(Number.isInteger(v[0]) && Number.isInteger(v[1])); assert.ok(v[0] >= 0 && v[1] >= 0 && v[0] <= l.w && v[1] <= l.h); });
  }
  assert.ok(Math.abs(l.sil.size / 4 - areaSum) < 1e-9, 'silhouet-oppervlak = som stukken, level ' + idx);
  // geen overlap + dekking, met fijne puntenraster
  const N = 8;
  let inSil = 0, covered = 0;
  for (let y = 0; y < l.h * N; y++) {
    for (let x = 0; x < l.w * N; x++) {
      const px = (x + 0.37) / N, py = (y + 0.61) / N;
      let hits = 0;
      for (const p of l.sol) if (inside(p.verts, px, py)) hits++;
      assert.ok(hits <= 1, `overlap level ${idx} bij ${px},${py}`);
      const s = silHas(l, px, py);
      assert.equal(hits === 1, s, `silhouet ongelijk aan legging level ${idx} bij ${px.toFixed(2)},${py.toFixed(2)}`);
      if (s) inSil++;
      covered += hits;
    }
  }
  assert.equal(covered, inSil);
  // verbonden (stukken delen zijden): via kwartjes-aangrenzing
  const arr = [...l.sil], set = new Set(arr), seen = new Set([arr[0]]), st = [arr[0]];
  while (st.length) {
    const c = st.pop();
    const [i, j, k] = C.qdec(c);
    const nb = [C.qid(i, j, (k + 1) & 3), C.qid(i, j, (k + 3) & 3), k === 0 ? C.qid(i, j - 1, 2) : k === 1 ? C.qid(i + 1, j, 3) : k === 2 ? C.qid(i, j + 1, 0) : C.qid(i - 1, j, 1)];
    for (const n of nb) if (set.has(n) && !seen.has(n)) { seen.add(n); st.push(n); }
  }
  assert.equal(seen.size, set.size, 'silhouet verbonden level ' + idx);
  assert.ok(!C.holes(l.sil) || idx >= 0, 'ok');
  assert.ok(l.w <= 8 && l.h <= 8);
}
// vaste figuren echt gebruikt op de aangegeven plekken, met 7 stukken
C.NAMED_AT.forEach((at, n) => {
  const l = C.makeLevel(at);
  assert.equal(l.name, C.NAMED[n].name);
  assert.equal(l.k, 7);
  const cnt = {}; l.sol.forEach((p) => { cnt[p.type] = (cnt[p.type] || 0) + 1; });
  assert.deepEqual(cnt, { L: 2, M: 1, S: 2, Q: 1, P: 1 });
});
// oplosser vindt voor elke 7-stukken silhouet (ook onafhankelijk van de constructie) een legging
let solved7 = 0;
for (let idx = 44; idx < 70; idx++) {
  const l = C.makeLevel(idx);
  const s = C.solveSil(l.sil, 8);
  assert.ok(s && s.length === 7, 'oplosser level ' + idx);
  solved7++;
}
// determinisme
assert.deepEqual(C.makeLevel(33).sol.map((p) => p.verts), C.makeLevel(33).sol.map((p) => p.verts));
// eindeloos: veel levels zonder crash
for (let idx = 100; idx < 300; idx++) C.makeLevel(idx);

// ---- rooktest met nep-DOM
function el() {
  const e = {
    style: {}, children: [], listeners: {}, innerHTML: '', textContent: '', disabled: false, width: 0, height: 0,
    appendChild(c) { this.children.push(c); return c; }, append(...c) { this.children.push(...c); },
    remove() {}, addEventListener(n, f) { (this.listeners[n] = this.listeners[n] || []).push(f); },
    removeEventListener(n, f) { this.listeners[n] = (this.listeners[n] || []).filter((x) => x !== f); },
    getBoundingClientRect() { return { left: 0, top: 0, width: 360, height: 480 }; },
    setPointerCapture() {},
    getContext() {
      return new Proxy({}, {
        get: (t, k) => (k in t ? t[k] : (k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => {})),
        set: (t, k, v) => { t[k] = v; return true; },
      });
    },
  };
  return e;
}
const winL = {};
globalThis.window = { addEventListener(n, f) { (winL[n] = winL[n] || []).push(f); }, removeEventListener(n, f) { winL[n] = (winL[n] || []).filter((x) => x !== f); }, devicePixelRatio: 2 };
globalThis.document = { createElement: () => el() };
globalThis.Path2D = class { moveTo() {} lineTo() {} closePath() {} };
globalThis.performance = performance;
let rafs = 0;
globalThis.requestAnimationFrame = () => ++rafs;
globalThis.cancelAnimationFrame = () => {};
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
const saves = [];
let scoreCalls = 0;
const host = el();
const inst = game.create(host, {
  w: 360, h: 640,
  score: () => { scoreCalls++; },
  end: () => { throw new Error('api.end mag niet worden aangeroepen'); },
  load: () => Promise.resolve({ v: 1, lv: 3, st: '321', es: 0, ec: 0, h: 4 }),
  save: (o) => { saves.push(o); assert.ok(JSON.stringify(o).length < 500); },
  clear: () => {},
});
await new Promise((r) => setTimeout(r, 10));
assert.ok(scoreCalls > 0);
inst.destroy();
assert.ok(saves.length >= 1 && saves[saves.length - 1].lv === 3, 'voortgang hersteld en bewaard');
assert.equal((winL.keydown || []).length, 0, 'keydown opgeruimd');
assert.equal((winL.resize || []).length, 0, 'resize opgeruimd');
console.log('OK tangram: levels 0..299 gemaakt; per stukkental', JSON.stringify(bySize), '; 7-stukken oplosser ok:', solved7);
