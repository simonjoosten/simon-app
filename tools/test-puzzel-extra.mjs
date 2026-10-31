// Test voor docs/puzzel-extra.js: saves per spel, level-herkenning, voortgang, dagelijkse puzzel, en dat de 100 extra levels per spel bestaan en kloppen.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const dir = (f) => pathToFileURL(path.join(here, '..', 'docs', f)).href;
const X = await import(dir('puzzel-extra.js'));
const K = await import(dir('games/mini/kratjes.js'));
const V = await import(dir('games/mini/verbind.js'));
const N = await import(dir('games/mini/knopen.js'));
const P = await import(dir('games/mini/pinnen.js'));
const T = await import(dir('games/mini/tangram.js'));

// aantal vaste levels klopt met de spellen
assert.equal(X.FIXED.kratjes, K.LEVELS.length); assert.equal(X.FIXED.verbind, V.FIXED_LEVELS); assert.equal(X.FIXED.knopen, N.TOTAL_FIXED);
assert.equal(X.FIXED.pinnen, P._logic.LEVEL_COUNT); assert.equal(X.FIXED.tangram, T._core.LEVELS_FIXED);

// saves: omgekeerd herkenbaar en passend bij de load-logica van elk spel
for (const id of Object.keys(X.FIXED)) for (const n of [0, 1, 50, 99]) {
  const s = X.extraSave(id, n);
  assert.ok(s && s.v === 2, id + ' save');
  assert.equal(X.levelOfSave(id, s), n, `${id} ${n}`);
  assert.ok(JSON.stringify(s).length < 18000, 'save past in 18000 tekens');
}
assert.equal(X.levelOfSave('kratjes', { lv: 5 }), null); assert.equal(X.levelOfSave('verbind', null), null);
assert.equal(X.extraSave('onbekend', 1), null);
// verbind: de eigen parser pakt het goede level
{ const sv = V.parseSave(X.extraSave('verbind', 7)); assert.equal(sv.level, 307); assert.equal(sv.maxL, 307); }
// kratjes: firstOpen = lv zodat het spel niet terugvalt (stars-string even lang als lv)
{ const s = X.extraSave('kratjes', 12); assert.equal(s.s.length, s.lv); assert.ok(/^3+$/.test(s.s)); }
// tangram: 150 hex-tekens = 300 levels op 3 sterren
{ const s = X.extraSave('tangram', 3); const arr = T._core.unpackStars(s.p); assert.equal(arr.length, 300); assert.ok(arr.every((v) => v === 3)); assert.equal(s.ec, 3); }

// extra levels bestaan, zijn deterministisch en oplosbaar per constructie (steekproef over het hele bereik)
const sample = [0, 1, 13, 37, 64, 99];
{ // pinnen: bewaarde constructie-oplossing herspelen
  for (const n of sample) {
    const lv = P._logic.makeLevel(300 + n); const lv2 = P._logic.makeLevel(300 + n);
    assert.deepEqual(lv.start, lv2.start);
    const st = lv.start.slice();
    for (const [a, o, t] of lv.sol) { assert.ok(st[a] && st[o] && !st[t]); assert.ok(lv.board.moves.some((m) => m[0] === a && m[1] === o && m[2] === t)); st[a] = 0; st[o] = 0; st[t] = 1; }
    assert.equal(st.reduce((x, y) => x + y, 0), 1, 'pinnen extra ' + n + ' laat 1 pin over');
    if (lv.goal >= 0) assert.ok(st[lv.goal]);
  }
}
{ // knopen: de oorspronkelijke plaatsing (sol) heeft geen kruisingen
  for (const n of sample) {
    const lv = N.genLevel(300 + n + 1); const lv2 = N.genLevel(300 + n + 1);
    assert.deepEqual(lv.edges, lv2.edges);
    assert.ok(N.findCrossings(lv.sol, lv.edges).every((r) => !r), 'knopen extra ' + n + ' oplossing zonder kruisingen');
    assert.ok(N.findCrossings(lv.start, lv.edges).some(Boolean), 'knopen extra ' + n + ' begint verward');
  }
}
{ // verbind: gebouwd uit een echte leg-oplossing; opnieuw bouwen geeft hetzelfde
  for (const n of [0, 50]) {
    const lv = V.genLevel(300 + n, { search: false }); const lv2 = V.genLevel(300 + n, { search: false });
    assert.deepEqual(lv.ends, lv2.ends); assert.ok(lv.n >= 9 && lv.ends.length >= 14); assert.equal(lv.sol.reduce((a, s) => a + s.length, 0), lv.n * lv.n, 'oplossing vult het hele bord');
  }
}
{ // kratjes: parse + het gebouwde level heeft evenveel kratten als doelen
  for (const n of sample) {
    const g = K.genLevel(n * 131 + 7, K.endlessParams(n));
    if (!g) continue; // genLevel mag null geven; het spel probeert dan een nieuwe seed
    const L = K.parse(g.m); assert.equal(L.box0.length, L.goals.reduce((a, b) => a + b, 0));
  }
}
{ // tangram: levels bestaan met een bijbehorende leg-oplossing
  for (const n of [0, 40, 99]) {
    const lv = T._core.makeLevel(300 + n); assert.ok(lv.sol.length >= 2 && lv.sil.size > 0);
    const lv2 = T._core.makeLevel(300 + n); assert.equal(lv.sil.size, lv2.sil.size);
  }
}

// dagelijkse puzzel: stabiel per dag, verschilt per spel/dag, binnen bereik
assert.equal(X.dailyIndex('pinnen', '2026-10-31'), X.dailyIndex('pinnen', '2026-10-31'));
const seen = new Set(); for (let d = 1; d <= 28; d++) seen.add(X.dailyIndex('tangram', '2026-02-' + String(d).padStart(2, '0')));
assert.ok(seen.size > 15, 'dagelijkse puzzel varieert ' + seen.size);
for (const id of Object.keys(X.FIXED)) { const i = X.dailyIndex(id, '2027-01-01'); assert.ok(i >= 0 && i < 100); }
assert.equal(X.prevDateKey('2026-03-01'), '2026-02-28'); assert.equal(X.prevDateKey('2026-01-01'), '2025-12-31');

// voortgang
{
  let p = X.cleanProgress({ x: '12', d: { '2026-10-30': 2, kapot: 1, '2026-10-31': 9 } });
  assert.equal(p.x.length, 100); assert.equal(p.x[0], '1'); assert.equal(p.x[1], '2'); assert.equal(p.d.kapot, undefined); assert.equal(p.d['2026-10-31'], 3);
  X.recordExtra(p, 5, 2); X.recordExtra(p, 5, 1); assert.equal(p.x[5], '2'); X.recordExtra(p, 500, 3); assert.equal(p.x.length, 100);
  assert.deepEqual(X.extraStats(p), { done: 3, stars: 5, max: 300 });
  assert.equal(X.dailyStreak(p, '2026-10-31'), 2); assert.equal(X.dailyStreak(p, '2026-11-01'), 2); assert.equal(X.dailyStreak(p, '2026-11-02'), 0);
  for (let d = 0; d < 80; d++) X.recordDaily(p, X.dateKey(new Date(2026, 0, 1 + d, 12)), 1);
  assert.ok(Object.keys(p.d).length <= 60);
  assert.deepEqual(X.cleanProgress(null), X.emptyProgress());
}
assert.equal(X.starsFromScoreDelta(10, 12), 2); assert.equal(X.starsFromScoreDelta(10, 10), 0); assert.equal(X.starsFromScoreDelta(0, 9), 3);
assert.equal(X.milestone(28, 31), 'mijlpaal'); assert.equal(X.milestone(88, 91), 'wereld'); assert.equal(X.milestone(31, 32), null);
console.log('puzzel-extra OK');
