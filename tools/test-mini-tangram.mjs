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

const FIXED = C.LEVELS_FIXED;
const TOTAL = FIXED + 25; // alle vaste levels + een stukje eindeloos
assert.ok(FIXED >= 300, 'minstens 300 vaste levels');
// werelden: aaneensluitend, 25-50 levels, eigen titel en kleurthema
{
  let at = 0; const names = new Set(), themes = new Set();
  for (const w of C.WORLDS) {
    assert.equal(w.from, at); assert.ok(w.n >= 25 && w.n <= 50, 'wereldgrootte ' + w.name);
    assert.ok(w.name && w.emoji && w.bg.length === 3 && w.sa && w.sb);
    names.add(w.name); themes.add(w.bg.join());
    at += w.n;
  }
  assert.equal(at, FIXED); assert.equal(names.size, C.WORLDS.length); assert.equal(themes.size, C.WORLDS.length);
  assert.equal(C.worldOf(0), C.WORLDS[0]); assert.equal(C.worldOf(FIXED - 1), C.WORLDS[C.WORLDS.length - 1]); assert.equal(C.worldOf(FIXED), C.ENDLESS);
}
const bySize = {};
const sigs = new Map();
const stat = C.WORLDS.map((w) => ({ w, ks: [], comp: [], nodes: [], ms: [], solved: 0, construct: 0, named: 0 }));
const t00 = Date.now();
let maxGenMs = 0;
for (let idx = 0; idx < TOTAL; idx++) {
  const tg = Date.now();
  const l = C.makeLevel(idx);
  maxGenMs = Math.max(maxGenMs, Date.now() - tg);
  const isNamed = C.NAMED_AT.includes(idx);
  if (!isNamed) assert.equal(l.k, idx >= FIXED ? 7 : C.pieceCount(idx), 'aantal stukken level ' + idx);
  else assert.equal(l.k, C.NAMED[C.NAMED_AT.indexOf(idx)].k);
  assert.equal(l.sol.length, l.k);
  assert.ok(l.k >= 2 && l.k <= 7);
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
  assert.ok(!C.holes(l.sil), 'geen gat in silhouet level ' + idx);
  assert.ok(l.w <= 8 && l.h <= 8);
  // uniek (ook gedraaid/gespiegeld) binnen de vaste levels
  if (idx < FIXED) {
    const sg = C.sigOf(l.sil);
    assert.ok(!sigs.has(sg), `level ${idx} lijkt op level ${sigs.get(sg)} (voeg SALT[${idx}] toe)`);
    sigs.set(sg, idx);
  }
  // onafhankelijke oplosser binnen tijdsbudget; anders geldt het constructiebewijs (legging hierboven geometrisch gecontroleerd)
  if (idx < FIXED) {
    const S = stat[C.worldOf(idx).i];
    S.ks.push(l.k);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of l.sol) for (const v of p.verts) { x0 = Math.min(x0, v[0]); x1 = Math.max(x1, v[0]); y0 = Math.min(y0, v[1]); y1 = Math.max(y1, v[1]); }
    S.comp.push(l.sil.size / 4 / ((x1 - x0) * (y1 - y0)));
    if (isNamed) S.named++;
    const t0 = Date.now();
    const sol = C.solveSil(l.sil, 8, { avail: cnt, k: l.k, nodes: 60000 });
    S.ms.push(Date.now() - t0);
    if (sol) {
      assert.equal(sol.length, l.k, 'oplosser level ' + idx);
      S.solved++; S.nodes.push(C.solveSil.nodes);
    } else { S.construct++; S.nodes.push(60000); }
    assert.ok(Date.now() - t0 < 4000, 'oplosser te traag op level ' + idx);
  }
}
const tTotal = Date.now() - t00;
// vaste figuren staan op de aangegeven plekken
assert.equal(C.NAMED.length, C.NAMED_AT.length);
assert.equal(new Set(C.NAMED_AT).size, C.NAMED_AT.length);
assert.equal(new Set(C.NAMED.map((n) => n.name)).size, C.NAMED.length, 'unieke namen');
C.NAMED_AT.forEach((at, n) => {
  const l = C.makeLevel(at);
  assert.equal(l.name, C.NAMED[n].name);
  assert.equal(C.worldOf(at).i, C.NAMED[n].w, 'figuur in juiste wereld');
  assert.equal(l.k, C.NAMED[n].k);
});
// moeilijkheidscurve: stukken en gemiddelde wereld nemen toe (geen dalingen tussen werelden)
let prevAvg = 0, prevComp = 2;
for (const S of stat) {
  const avg = S.ks.reduce((a, b) => a + b, 0) / S.ks.length;
  assert.ok(avg >= prevAvg - 1e-9, 'gem. stukken daalt niet tussen werelden: ' + S.w.name);
  prevAvg = avg;
  const ca = S.comp.reduce((a, b) => a + b, 0) / S.comp.length;
  assert.ok(ca <= prevComp + 0.02, 'vorm wordt niet compacter tussen werelden: ' + S.w.name);
  prevComp = ca;
}
// determinisme (twee keer bouwen na lege cache is hetzelfde)
assert.deepEqual(C.makeLevel(33).sol.map((p) => p.verts), C.makeLevel(33).sol.map((p) => p.verts));
assert.equal(C.sigOf(C.makeLevel(250).sil), C.sigOf(C.makeLevel(250).sil));
// opslag: sterren compact en migratie
{
  const arr = Array.from({ length: FIXED }, (_, i) => (i * 7) % 4);
  const pk = C.packStars(arr);
  assert.ok(pk.length <= FIXED / 2 + 1 && pk.length < 200);
  assert.deepEqual(C.unpackStars(pk), arr);
  const old = C.unpackOld('321' + '0'.repeat(57) + '3');
  assert.equal(old.length, FIXED); assert.deepEqual(old.slice(0, 3), [3, 2, 1]); assert.equal(old[59], 0); assert.equal(old[60], 3); assert.equal(old[61], 0);
  assert.deepEqual(C.unpackStars('').slice(0, 5), [0, 0, 0, 0, 0]);
  assert.deepEqual(C.unpackStars('zz!').length, FIXED);
}

// ---- rooktest met nep-DOM
function el() {
  const e = {
    style: {}, children: [], listeners: {}, innerHTML: '', textContent: '', disabled: false, width: 0, height: 0,
    appendChild(c) { c.parent = this; this.children.push(c); return c; }, append(...c) { c.forEach((x) => { x.parent = this; }); this.children.push(...c); },
    remove() { if (this.parent) { const i = this.parent.children.indexOf(this); if (i >= 0) this.parent.children.splice(i, 1); } }, addEventListener(n, f) { (this.listeners[n] = this.listeners[n] || []).push(f); },
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
async function run(saved, check) {
  const saves = [];
  let scoreCalls = 0, lastScore = 0;
  const host = el();
  const inst = game.create(host, {
    w: 360, h: 640,
    score: (v) => { scoreCalls++; lastScore = v; },
    end: () => { throw new Error('api.end mag niet worden aangeroepen'); },
    load: () => Promise.resolve(saved),
    save: (o) => { saves.push(o); assert.ok(JSON.stringify(o).length < 500, 'save klein'); },
    clear: () => {},
  });
  await new Promise((r) => setTimeout(r, 10));
  assert.ok(scoreCalls > 0);
  if (check) check({ host, saves, lastScore, inst });
  inst.destroy();
  assert.ok(saves.length >= 1);
  assert.equal((winL.keydown || []).length, 0, 'keydown opgeruimd');
  assert.equal((winL.resize || []).length, 0, 'resize opgeruimd');
  return { saves, lastScore };
}
// oude save (v1, 60 sterren-formaat): blijft werken
let r = await run({ v: 1, lv: 3, st: '321', es: 0, ec: 0, h: 4 });
assert.equal(r.saves[r.saves.length - 1].lv, 3, 'voortgang hersteld en bewaard');
assert.equal(r.saves[r.saves.length - 1].v, 2, 'gemigreerd naar v2');
assert.deepEqual(C.unpackStars(r.saves[r.saves.length - 1].p).slice(0, 4), [3, 2, 1, 0], 'sterren gemigreerd');
assert.equal(r.lastScore, 6);
// v1 met alle 60 oude levels gehaald en eindeloos-voortgang: mag niet voorbij level 61
r = await run({ v: 1, lv: 70, st: '2'.repeat(60), es: 9, ec: 3, h: 4 });
assert.equal(r.saves[r.saves.length - 1].lv, 60, 'na 60 oude levels is level 61 het eerstvolgende');
assert.equal(r.lastScore, 120 + 9);
// nieuwe save (v2) met veel levels gehaald; levelkiezer opent en toont alle werelden + 300 knoppen
const stars = new Array(FIXED).fill(0); for (let i = 0; i < 150; i++) stars[i] = 1 + (i % 3);
r = await run({ v: 2, lv: 120, p: C.packStars(stars), es: 0, ec: 0, h: 3 }, ({ host, inst }) => {
  const root = host.children[0], head = root.children[0], titleBox = head.children[1];
  assert.ok(titleBox.listeners.click && titleBox.listeners.click.length, 'titel opent levelkiezer');
  titleBox.listeners.click[0]();
  const ov = root.children[root.children.length - 1];
  const sc = ov.children[1];
  const grids = sc.children.filter((c) => c.style.cssText && c.style.cssText.includes('grid-template-columns'));
  assert.equal(grids.length, C.WORLDS.length, 'een raster per wereld');
  assert.equal(grids.reduce((a, g) => a + g.children.length, 0), FIXED, 'knop per level');
  assert.equal(grids[0].children.filter((b) => b.disabled).length, 0);
  assert.equal(grids[grids.length - 1].children.filter((b) => b.disabled).length, grids[grids.length - 1].children.length, 'ontgrendeling volgt voortgang');
  const open = grids.flatMap((g) => g.children).filter((b) => !b.disabled).length;
  assert.equal(open, 151, 'level 1..151 spelbaar');
  grids[1].children[0].listeners.click[0](); // wereld 2, level 26
  assert.equal(root.children.length, 3, 'kiezer gesloten');
  titleBox.listeners.click[0](); // weer open + dicht via titel
  titleBox.listeners.click[0]();
});
assert.equal(r.saves[r.saves.length - 1].lv, C.WORLDS[1].from);
assert.equal(r.lastScore, stars.reduce((a, b) => a + b, 0));
// lege save en kapotte data
await run(null);
await run({ v: 2, lv: 'x', p: 5, es: -3, ec: 'a', h: 99 });

// ---- rapport
const f = (x) => (Math.round(x * 100) / 100).toFixed(2);
console.log(`\nOK tangram: ${FIXED} vaste levels in ${C.WORLDS.length} werelden + eindeloos; ${TOTAL} levels gebouwd+geverifieerd in ${tTotal} ms (traagste levelbouw ${maxGenMs} ms)`);
console.log('stukken per level (totaal):', JSON.stringify(bySize));
console.log('wereld'.padEnd(24), 'levels   stukken min/gem/max  compactheid  oplosser-knopen gem/max  opgelost/constructie  figuren');
for (const S of stat) {
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  console.log(
    `${S.w.i + 1}. ${S.w.name}`.padEnd(24),
    `${S.w.from + 1}-${S.w.to}`.padEnd(8),
    `${Math.min(...S.ks)}/${f(avg(S.ks))}/${Math.max(...S.ks)}`.padEnd(19),
    f(avg(S.comp)).padEnd(12),
    `${Math.round(avg(S.nodes))}/${Math.max(...S.nodes)}`.padEnd(24),
    `${S.solved}/${S.construct}`.padEnd(21),
    S.named,
  );
}
console.log('onafhankelijke oplosser: ' + stat.reduce((a, S) => a + S.solved, 0) + ' van ' + FIXED + ' levels; rest via constructiebewijs (geometrisch gecontroleerd)');
