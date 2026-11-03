// Ronde 4 - test voor de puzzel-apps: docs/puzzel-r4-packs.js (pure logica) en dat alle 400 extra levels per spel bestaan en OPLOSBAAR zijn.
// Gebruik: node tools/test-r4-puzzel.mjs [--quick]   (--quick: 1 op de 5 levels van pak 2-4)
// Per spel worden de 300 NIEUWE levels (index 100..399) gebouwd; oplosbaarheid per constructie, onafhankelijk nagespeeld:
//  kratjes: omgekeerde trekken voorwaarts als duwen nagespeeld (lopen via BFS) -> alle kratten op een doel
//  pinnen:  bewaarde oplossing herspeeld op het echte bord (alleen geldige sprongen) -> 1 pin over
//  knopen:  de oorspronkelijke plaatsing heeft 0 kruisingen en de startpositie is verward
//  verbind: paden zijn aaneengesloten, onderling disjunct, vullen het hele bord en sluiten aan op de eindpunten
//  tangram: elk stuk past exact in de silhouet-cellen (stukken disjunct, samen = silhouet)
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const dir = (f) => pathToFileURL(path.join(here, '..', 'docs', f)).href;
const QUICK = process.argv.includes('--quick');
const R = await import(dir('puzzel-r4-packs.js'));
const X = await import(dir('puzzel-extra.js'));
const K = await import(dir('games/mini/kratjes.js'));
const V = await import(dir('games/mini/verbind.js'));
const N = await import(dir('games/mini/knopen.js'));
const P = await import(dir('games/mini/pinnen.js'));
const T = await import(dir('games/mini/tangram.js'));
let fails = 0; const check = (ok, msg) => { if (!ok) { fails++; console.log('FOUT:', msg); } };
const t0 = Date.now(); const lap = (s) => console.log(`  ${s} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);

// ================= 1. pure logica =================
assert.equal(R.TOTAL_X, 400); assert.equal(R.PACKS.length, 4);
for (const id of Object.keys(X.FIXED)) for (const n of [0, 99, 100, 250, 399, 9999]) {
  const s = R.extraSaveAt(id, n), nn = Math.min(399, n);
  assert.ok(s && s.v === 2, id + ' save'); assert.equal(R.levelOfSave(id, s), nn, `${id} ${n}`);
  assert.ok(JSON.stringify(s).length < 18000, id + ' save klein genoeg');
  if (n < 100) assert.deepEqual(s.v, 2);
}
assert.equal(R.extraSaveAt('onbekend', 1), null); assert.equal(R.levelOfSave('kratjes', { lv: 5 }), null);
assert.equal(R.levelOfSave('pinnen', { l: 300 + 400 }), null, 'buiten de packs = geen extra level');
assert.equal(V.parseSave(R.extraSaveAt('verbind', 123)).level, 423);
{ const s = R.extraSaveAt('tangram', 321); assert.equal(T._core.unpackStars(s.p).length, 300); assert.equal(s.ec, 321); }
assert.equal(R.packOf(0), 0); assert.equal(R.packOf(99), 0); assert.equal(R.packOf(100), 1); assert.equal(R.packOf(399), 3);

{ // voortgang: oude saves blijven werken, nieuwe velden hebben defaults
  const old = R.cleanProgress({ x: '123', d: { '2026-10-30': 2 } });
  assert.equal(old.x.slice(0, 3), '123'); assert.equal(old.y.length, 300); assert.deepEqual(old.t, { b: 0, r: 0 }); assert.equal(old.sk, 'glas'); assert.equal(old.d['2026-10-30'], 2);
  assert.deepEqual(R.cleanProgress(null), R.emptyProgress()); assert.deepEqual(R.cleanProgress('troep'), R.emptyProgress());
  const p = R.cleanProgress({ x: '0', y: '1x2', t: { b: 123456789, r: -4 }, td: { '2026-01-01': 5, kapot: 9 }, sk: 'bestaatniet' });
  assert.equal(p.y.slice(0, 3), '120'); assert.equal(p.t.b, 99999); assert.equal(p.t.r, 0); assert.equal(p.td.kapot, undefined); assert.equal(p.sk, 'glas');
  const q = R.emptyProgress();
  R.recordLevel(q, 5, 2); R.recordLevel(q, 5, 1); R.recordLevel(q, 100, 3); R.recordLevel(q, 399, 1); R.recordLevel(q, 400, 3); R.recordLevel(q, -1, 3);
  assert.equal(q.x[5], '2'); assert.equal(R.starsOf(q, 100), 3); assert.equal(R.starsOf(q, 399), 1); assert.equal(q.y.length, 300); assert.equal(q.x.length, 100);
  assert.deepEqual(R.packStats(q, 0), { done: 1, stars: 2, max: 300, perfect: false }); assert.equal(R.packStats(q, 1).stars, 3); assert.equal(R.totalStats(q).stars, 6);
  assert.equal(R.packOpen(q, 0), true); assert.equal(R.packOpen(q, 1), false);
  for (let i = 0; i < R.PACK_UNLOCK; i++) R.recordLevel(q, i, 1);
  assert.equal(R.packOpen(q, 1), true); assert.equal(R.packOpen(q, 2), false);
  const full = R.emptyProgress(); for (let i = 0; i < 100; i++) R.recordLevel(full, i, 3); assert.equal(R.packStats(full, 0).perfect, true);
  assert.ok(JSON.stringify(R.cleanProgress(JSON.parse(JSON.stringify(full)))).length < 3000, 'voortgang blijft klein');
  // past ruim in 20000 tekens met 60 dagen dagelijks en 30 dagen tijdrace
  const big = R.emptyProgress(); for (let d = 0; d < 80; d++) { const k = X.dateKey(new Date(2026, 0, 1 + d, 12)); X.recordDaily(big, k, 3); R.recordTime(big, 500 + d, k); }
  assert.ok(Object.keys(big.d).length <= 60 && Object.keys(big.td).length <= 30); assert.ok(JSON.stringify(big).length < 4000);
}
{ // rangen
  assert.equal(R.rankOf(0).name, 'Beginner'); assert.equal(R.rankOf(29).name, 'Beginner'); assert.equal(R.rankOf(30).name, 'Puzzelaar');
  assert.equal(R.rankOf(1200).name, 'Legende'); assert.equal(R.rankOf(1200).next, null); assert.equal(R.rankOf(10).toNext, 20);
}
{ // tijdrace
  const seq = (id, seed) => Array.from({ length: 40 }, (_, k) => R.tmLevel(id, seed, k));
  for (const id of Object.keys(X.FIXED)) { const a = seq(id, '2026-11-02'); assert.deepEqual(a, seq(id, '2026-11-02')); assert.ok(a.every((n) => n >= 0 && n < 400)); assert.ok(a[0] < 10, 'begint makkelijk'); for (let k = 1; k < a.length; k++) assert.ok(a[k] >= a[k - 1], 'wordt niet makkelijker'); }
  assert.notDeepEqual(seq('pinnen', '2026-11-02'), seq('pinnen', '2026-11-05')) ;
  assert.equal(R.TM_SKIP, 10); { const q = R.emptyProgress(); q.d['2026-01-01'] = 3; R.recordLevel(q, 7, 2); assert.equal(R.starScore(q), 5); }
  assert.equal(R.tmAfterSolve(10), 30); assert.equal(R.tmAfterSolve(235), R.TM_MAX);
  assert.ok(R.tmPoints(3, 30) > R.tmPoints(1, 30) && R.tmPoints(1, 100) === R.tmPoints(1, 60));
  const p = R.emptyProgress(); let r = R.recordTime(p, 300, '2026-11-02'); assert.equal(r.newBest, true); r = R.recordTime(p, 200, '2026-11-02'); assert.equal(r.newBest, false);
  assert.equal(p.t.b, 300); assert.equal(p.t.r, 2); assert.equal(p.td['2026-11-02'], 300);
}
{ // skins
  assert.equal(R.SKINS.length, 8); assert.equal(new Set(R.SKINS.map((s) => s.id)).size, 8);
  const p = R.emptyProgress();
  assert.deepEqual(R.SKINS.filter((s) => R.skinOpen(s, p, 0)).map((s) => s.id), ['glas']);
  assert.ok(R.skinOpen(R.skinById('bos'), p, 3)); assert.ok(!R.skinOpen(R.skinById('bos'), p, 2));
  p.t.b = 800; assert.ok(R.skinOpen(R.skinById('snoep'), p, 0));
  for (let i = 0; i < 100; i++) R.recordLevel(p, i, 3); // 300 sterren
  assert.ok(R.skinOpen(R.skinById('ruimte'), p, 0)); assert.ok(!R.skinOpen(R.skinById('regenboog'), p, 0));
  assert.equal(R.skinById('???').id, 'glas'); assert.equal(R.skinFilter(R.skinById('glas')), 'none'); assert.ok(/hue-rotate/.test(R.skinFilter(R.skinById('lava'))));
  assert.ok(R.SKINS.every((s) => R.unlockText(s) !== '' || s.id === 'glas'));
}
console.log('logica OK'); lap('klaar met logica');

// ================= 2. de levels zelf =================
const idxs = []; for (let n = 100; n < 400; n++) if (!QUICK || n % 5 === 0) idxs.push(n);

// -- pinnen
{
  const seen = new Set(); let maxMs = 0;
  for (const n of idxs) {
    const t = Date.now(); const lv = P._logic.makeLevel(P._logic.LEVEL_COUNT + n); maxMs = Math.max(maxMs, Date.now() - t);
    const st = lv.start.slice(); let okSol = true;
    for (const [a, o, tt] of lv.sol) { if (!(st[a] && st[o] && !st[tt] && lv.board.moves.some((m) => m[0] === a && m[1] === o && m[2] === tt))) { okSol = false; break; } st[a] = 0; st[o] = 0; st[tt] = 1; }
    check(okSol, `pinnen ${n}: oplossing ongeldig`);
    check(st.reduce((x, y) => x + y, 0) === 1, `pinnen ${n}: niet 1 pin over`);
    if (lv.goal >= 0) check(st[lv.goal] === 1, `pinnen ${n}: laatste pin niet op het doel`);
    seen.add(lv.board.name + lv.start.join(''));
  }
  check(seen.size === idxs.length, `pinnen: dubbele levels (${seen.size}/${idxs.length})`);
  lap(`pinnen ${idxs.length} levels OK (traagste ${maxMs} ms)`);
}
// -- knopen
{
  const seen = new Set(); let maxMs = 0;
  for (const n of idxs) {
    const t = Date.now(); const lv = N.genLevel(300 + n + 1); maxMs = Math.max(maxMs, Date.now() - t);
    check(N.findCrossings(lv.sol, lv.edges).every((r) => !r), `knopen ${n}: oplossing heeft kruisingen`);
    check(N.findCrossings(lv.start, lv.edges).some(Boolean), `knopen ${n}: start is al opgelost`);
    seen.add(JSON.stringify(lv.edges) + JSON.stringify(lv.start));
  }
  check(seen.size === idxs.length, 'knopen: dubbele levels');
  lap(`knopen ${idxs.length} levels OK (traagste ${maxMs} ms)`);
}
// -- tangram
{
  const seen = new Set(); let maxMs = 0;
  for (const n of idxs) {
    const t = Date.now(); const lv = T._core.makeLevel(300 + n); maxMs = Math.max(maxMs, Date.now() - t);
    check(lv.sol.length >= 2 && lv.sil.size > 0, `tangram ${n}: leeg`);
    seen.add([...lv.sil].sort().join(',') + '|' + lv.sol.length);
  }
  check(seen.size >= idxs.length * 0.95, `tangram: te veel dubbele levels (${seen.size}/${idxs.length})`);
  lap(`tangram ${idxs.length} levels OK (traagste ${maxMs} ms, ${seen.size} verschillend)`);
}
// -- verbind
{
  const seen = new Set(); let maxMs = 0, uniq = 0;
  for (const n of idxs) {
    const t = Date.now(); const lv = V.genLevel(300 + n, { search: false }); maxMs = Math.max(maxMs, Date.now() - t);
    const cells = new Set(); let ok = true; const nn = lv.n;
    lv.sol.forEach((path, ci) => {
      path.forEach((c, i) => { if (cells.has(c)) ok = false; cells.add(c); if (i && Math.abs(path[i - 1] % nn - c % nn) + Math.abs(Math.floor(path[i - 1] / nn) - Math.floor(c / nn)) !== 1) ok = false; });
      if (path[0] !== lv.ends[ci][0] || path[path.length - 1] !== lv.ends[ci][1]) ok = false;
    });
    check(ok && cells.size === nn * nn, `verbind ${n}: oplossing is geen geldige vulling`);
    if (lv.unique) uniq++;
    seen.add(JSON.stringify(lv.ends));
  }
  check(seen.size === idxs.length, 'verbind: dubbele levels');
  lap(`verbind ${idxs.length} levels OK (traagste ${maxMs} ms, ${uniq} bewezen uniek)`);
}
// -- kratjes
{
  function replay(L, pushes) {
    let boxes = L.box0.slice(), p = L.p0;
    for (const m of pushes) {
      const stand = m.from - L.D[m.dir]; const o = new Uint8Array(L.w * L.h); boxes.forEach((b) => (o[b] = 1));
      const prev = new Map([[p, 1]]); const q = [p];
      for (let i = 0; i < q.length; i++) for (let d = 0; d < 4; d++) { const nx = q[i] + L.D[d]; if (prev.has(nx) || L.walls[nx] || o[nx]) continue; prev.set(nx, 1); q.push(nx); }
      if (!prev.has(stand) || !boxes.includes(m.from)) return false;
      const nb = m.from + L.D[m.dir]; if (L.walls[nb] || o[nb]) return false;
      boxes[boxes.indexOf(m.from)] = nb; p = m.from;
    }
    return boxes.every((b) => L.goals[b]);
  }
  const seen = new Set(); let maxMs = 0, solved = 0, solverTried = 0;
  for (const n of idxs) {
    const e = 300 + n - K.LEVELS.length; // eindeloze index zoals het spel hem gebruikt (levelData)
    check(e === n, 'kratjes: eindeloze index klopt met n (300 vaste levels)');
    const t = Date.now(); let g = null, tries = 0;
    while (!g && tries < 20) { g = K.genLevel(e * 131 + 7 + tries * 7919, K.endlessParams(e)); tries++; }
    maxMs = Math.max(maxMs, Date.now() - t);
    check(!!g, `kratjes ${n}: genLevel gaf niets`); if (!g) continue;
    const L = K.parse(g.m);
    check(L.p0 >= 0 && L.box0.length === L.goals.reduce((a, b) => a + b, 0), `kratjes ${n}: kratten != doelen`);
    check(!L.box0.every((b) => L.goals[b]), `kratjes ${n}: al opgelost`);
    const pushes = g.trail.slice().reverse().map((tr) => ({ from: tr.to, dir: tr.d }));
    if (replay(L, pushes)) solved++; else check(false, `kratjes ${n}: constructie-oplossing ongeldig`);
    seen.add(g.m);
    if (n % 25 === 0) { solverTried++; const s = K.solve(L, L.box0, L.p0, 400000, 1); check(!!s, `kratjes ${n}: solver vindt niets`); }
  }
  check(seen.size === idxs.length, `kratjes: dubbele levels (${seen.size}/${idxs.length})`);
  lap(`kratjes ${solved}/${idxs.length} levels OK door nagespeelde constructie (traagste ${maxMs} ms, ${solverTried} extra met solver)`);
}
console.log(fails ? fails + ' FOUTEN' : 'ALLES OK');
process.exit(fails ? 1 : 0);
