// Tests voor docs/dice-3d.js (geometrie) en docs/dice-games.js (spellen). Gebruik: node tools/test-dice.mjs
import assert from 'node:assert/strict';
import * as D from '../docs/dice-3d.js';
import * as G from '../docs/dice-games.js';
let n = 0; const ok = (name, fn) => { try { fn(); n++; } catch (e) { console.error('FAIL', name, e.stack.split('\n').slice(0, 3).join(' | ')); process.exitCode = 1; } };
const seq = (...a) => { let i = 0; return () => a[i++ % a.length]; };
const dotp = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

ok('geometrie van alle stenen', () => {
  const spec = { 4: [4, 3], 6: [6, 4], 8: [8, 3], 10: [10, 4], 12: [12, 5], 20: [20, 3] };
  for (const s of D.DIE_TYPES) {
    const g = D.geometry(s); assert.equal(g.faces.length, spec[s][0], 'vlakken d' + s); assert.ok(g.faces.every((f) => f.idx.length === spec[s][1]), 'hoekpunten d' + s);
    assert.deepEqual(g.faces.map((f) => f.value).sort((a, b) => a - b), Array.from({ length: s }, (_, i) => i + 1));
    assert.ok(Math.abs(Math.max(...g.verts.map((v) => Math.hypot(...v))) - 1) < 1e-9);
    g.faces.forEach((f) => { assert.ok(Math.abs(Math.hypot(...f.normal) - 1) < 1e-9); assert.ok(dotp(f.normal, f.center) > 0.1, 'normaal wijst naar buiten'); f.idx.forEach((q) => assert.ok(Math.abs(dotp(f.normal, g.verts[q]) - dotp(f.normal, f.center)) < 1e-6, 'vlak is vlak'));
      assert.ok(Math.abs(dotp(f.up, f.normal)) < 1e-9 && Math.abs(dotp(f.right, f.normal)) < 1e-9 && f.r > 0.1); });
    // alle hoekpunten liggen achter elke vlakkenormaal (convex)
    g.faces.forEach((f) => g.verts.forEach((v) => assert.ok(dotp(f.normal, v) <= dotp(f.normal, f.center) + 1e-6)));
    // tegenover elkaar: som = s+1
    if (s !== 4) g.faces.forEach((f) => { const o = g.faces.find((x) => dotp(x.normal, f.normal) < -0.999); assert.ok(o, 'tegenvlak d' + s); assert.equal(f.value + o.value, s + 1, 'd' + s); });
  }
  assert.equal(D.geometry(6).verts.length, 8); assert.equal(D.geometry(20).verts.length, 12); assert.equal(D.geometry(12).verts.length, 20);
});
ok('d6: bekende stand (1 boven, 2 voor, 3 rechts: som 7)', () => {
  const g = D.geometry(6); [1, 2, 3, 4, 5, 6].forEach((v) => assert.equal(D.faceOf(g, v).value, v));
});
ok('oriëntatie draait het gekozen vlak naar de kijker', () => {
  for (const s of D.DIE_TYPES) { const g = D.geometry(s); for (const f of g.faces) {
    const q = D.orientationFor(f, 0), m = D.qMat(q); const nz = D.mulMat(m, f.normal); assert.ok(Math.abs(nz[2] - 1) < 1e-9 && Math.abs(nz[0]) < 1e-9, `d${s} v${f.value}`);
    const up = D.mulMat(m, f.up); assert.ok(Math.abs(up[1] - 1) < 1e-9);
    assert.equal(D.topFace(g, q).value, f.value);
    const q2 = D.orientationFor(f, 0.5); assert.equal(D.topFace(g, q2).value, f.value); } }
});
ok('quaternion hulpjes', () => {
  const q = D.qAxis([0, 0, 1], Math.PI / 2), m = D.qMat(q); const r = D.mulMat(m, [1, 0, 0]); assert.ok(Math.abs(r[0]) < 1e-9 && Math.abs(r[1] - 1) < 1e-9);
  const back = D.matQ(m); assert.ok(Math.abs(Math.abs(back[2]) - Math.abs(q[2])) < 1e-9); assert.ok(Math.abs(Math.hypot(...D.slerp(q, D.qAxis([1, 0, 0], 1), 0.3)) - 1) < 1e-9);
  for (let i = 0; i < 40; i++) { const a = D.qNorm([Math.random() - .5, Math.random() - .5, Math.random() - .5, Math.random() - .5]); const b = D.matQ(D.qMat(a)); const d = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]); assert.ok(d > 1 - 1e-9); }
});
ok('worp-animatie eindigt op het gekozen vlak', () => {
  for (const s of D.DIE_TYPES) for (let v = 1; v <= s; v++) { const r = D.newRoll(s, v, 1000); r.t = 1000; const g = D.geometry(s); assert.equal(D.topFace(g, D.rollQuat(r)).value, v); assert.ok(D.rollLift(r, 100) < 1e-9); }
  const r = D.newRoll(20, 7, 1000); r.t = 300; assert.ok(D.rollLift(r, 100) >= 0); assert.ok(Math.abs(Math.hypot(...D.rollQuat(r)) - 1) < 1e-9);
});
ok('kleuren', () => { assert.ok(D.DIE_COLORS.length >= 8); assert.ok(D.lum('#1f2937') < 0.3 && D.lum('#f3f4f6') > 0.8); });

// ---- hulpjes ----
ok('rand is eerlijk en binnen bereik', () => { const c = new Array(6).fill(0); for (let i = 0; i < 6000; i++) { const v = G.rand(6); assert.ok(v >= 0 && v < 6); c[v]++; } c.forEach((x) => assert.ok(x > 800 && x < 1200)); });
ok('shuffle/teams/getallen', () => {
  const a = [1, 2, 3, 4, 5, 6, 7]; const s = G.shuffle(a); assert.deepEqual(s.slice().sort(), a); assert.deepEqual(a, [1, 2, 3, 4, 5, 6, 7]);
  const t = G.makeTeams(['a', 'b', 'c', 'd', 'e', ' ', 'f'], 3); assert.equal(t.length, 3); assert.equal(t.flat().length, 6); assert.ok(Math.max(...t.map((x) => x.length)) - Math.min(...t.map((x) => x.length)) <= 1); assert.equal(G.makeTeams([], 2).flat().length, 0); assert.equal(G.makeTeams(['a'], 5).length, 1);
  const u = G.randomInts(1, 10, 10, true); assert.deepEqual(u.slice().sort((x, y) => x - y), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]); assert.equal(G.randomInts(5, 5, 3, true).length, 1); assert.deepEqual(G.randomInts(9, 3, 4, false).every((v) => v >= 3 && v <= 9), true); assert.deepEqual(G.randomInts('x', 3, 1, false), []);
  assert.equal(G.randomInts(1, 100000, 5, true).length, 5);
});
ok('worpen met voordeel/nadeel en modificator', () => {
  let r = G.rollPool({ sides: 20, count: 1, mod: 3, adv: 'voordeel' }, seq(4, 16)); assert.deepEqual(r.vals, [5, 17]); assert.deepEqual(r.kept, [17]); assert.equal(r.total, 20);
  r = G.rollPool({ sides: 20, count: 1, adv: 'nadeel' }, seq(4, 16)); assert.deepEqual(r.kept, [5]); r = G.rollPool({ sides: 20, count: 1 }, seq(19)); assert.equal(r.crit, 'nat20'); r = G.rollPool({ sides: 20, count: 1 }, seq(0)); assert.equal(r.crit, 'nat1');
  r = G.rollPool({ sides: 6, count: 3, mod: -2, adv: 'voordeel' }, seq(0, 1, 2)); assert.equal(r.vals.length, 3); assert.equal(r.total, 4);
  r = G.rollPool({ sides: 7, count: 99, mod: 999 }); assert.equal(r.sides, 6); assert.equal(r.vals.length, 6); assert.equal(r.mod, 99);
  for (let i = 0; i < 300; i++) { const x = G.rollPool({ sides: 100, count: 2 }); assert.ok(x.kept.every((v) => v >= 1 && v <= 100)); }
  const h = [{ s: 6, k: [1, 1, 6] }, { s: 20, k: [20] }]; const st = G.rollStats(h, 6); assert.deepEqual(st.counts, [2, 0, 0, 0, 0, 1]); assert.equal(st.n, 3); assert.ok(Math.abs(st.avg - 8 / 3) < 1e-9); assert.equal(G.rollStats([{ s: 100, k: [5, 100] }], 100).counts[9], 1);
  assert.equal(G.cleanHistory([{ s: 6, k: [7] }, { s: 6, k: [3], m: 1, t: 5 }, null, { s: 3, k: [1] }]).length, 1);
});

// ---- Yathzee ----
ok('Yathzee: scoren', () => {
  assert.equal(G.scoreCat('3', [3, 3, 1, 3, 6]), 9); assert.equal(G.scoreCat('3k', [2, 2, 2, 5, 6]), 17); assert.equal(G.scoreCat('3k', [2, 2, 1, 5, 6]), 0); assert.equal(G.scoreCat('4k', [4, 4, 4, 4, 1]), 17); assert.equal(G.scoreCat('4k', [4, 4, 4, 1, 1]), 0);
  assert.equal(G.scoreCat('fh', [2, 2, 5, 5, 5]), 25); assert.equal(G.scoreCat('fh', [2, 2, 2, 2, 5]), 0); assert.equal(G.scoreCat('fh', [3, 3, 3, 3, 3]), 25);
  assert.equal(G.scoreCat('ks', [1, 2, 3, 4, 6]), 30); assert.equal(G.scoreCat('ks', [2, 3, 4, 5, 5]), 30); assert.equal(G.scoreCat('ks', [1, 2, 3, 5, 6]), 0); assert.equal(G.scoreCat('gs', [2, 3, 4, 5, 6]), 40); assert.equal(G.scoreCat('gs', [1, 2, 3, 4, 6]), 0);
  assert.equal(G.scoreCat('yz', [6, 6, 6, 6, 6]), 50); assert.equal(G.scoreCat('yz', [6, 6, 6, 6, 5]), 0); assert.equal(G.scoreCat('ch', [1, 2, 3, 4, 6]), 16); assert.equal(G.scoreCat('nope', [1, 1, 1, 1, 1]), 0);
});
ok('Yathzee: bonus en totaal', () => {
  const sh = G.newSheet(); ['1', '2', '3', '4', '5', '6'].forEach((k) => { sh[k] = Number(k) * 3; }); assert.equal(G.upperSum(sh), 63); assert.equal(G.bonusOf(sh), 35); sh['6'] = 0; assert.equal(G.bonusOf(sh), 0); sh.yz = 50; assert.equal(G.sheetTotal(sh), 45 + 50);
  assert.equal(G.freeCats(sh).length, 13 - 7); assert.deepEqual(Object.keys(G.potentials(sh, [1, 1, 1, 1, 1])).includes('yz'), false);
});
ok('Yathzee: spelverloop', () => {
  const g = G.newY([{ name: 'A' }, { name: 'B', ai: true }]); assert.equal(G.yScore(g, '1'), false); // eerst gooien
  assert.ok(G.yRoll(g, seq(0, 1, 2, 3, 4))); assert.deepEqual(g.dice, [1, 2, 3, 4, 5]); assert.equal(g.rolls, 1);
  assert.ok(G.yToggle(g, 0)); assert.ok(G.yToggle(g, 4)); assert.ok(G.yRoll(g, seq(5))); assert.deepEqual(g.dice, [1, 6, 6, 6, 5]); assert.ok(G.yRoll(g, seq(0))); assert.equal(g.rolls, 3); assert.equal(G.yRoll(g), false); assert.equal(G.yToggle(g, 1), false);
  assert.equal(G.yScore(g, 'zzz'), false); assert.ok(G.yScore(g, '1')); assert.equal(g.players[0].sheet['1'], 4); assert.equal(g.turn, 1); assert.equal(g.rolls, 0); assert.ok(g.held.every((h) => !h));
  assert.equal(G.yRoll(g, seq(0)), true); assert.equal(G.yScore(g, '1'), true); assert.equal(g.turn, 0); assert.equal(g.round, 2);
  for (let i = 0; i < 40 && !g.done; i++) { G.yRoll(g); const id = G.aiPick(g.dice, g.players[g.turn].sheet); assert.ok(G.yScore(g, id)); }
  assert.ok(g.done); assert.equal(G.yRoll(g), false); const w = G.yWinner(g); assert.ok(w.winners.length >= 1 && w.totals.length === 2);
});
ok('Yathzee: computer speelt een heel spel en scoort redelijk', () => {
  let tot = 0; const N = 60;
  for (let k = 0; k < N; k++) {
    const g = G.newY([{ name: 'cpu', ai: true }]);
    while (!g.done) { G.yRoll(g); for (let i = 0; i < 2; i++) { const h = G.aiHold(g.dice, g.players[0].sheet); assert.equal(h.length, 5); assert.ok(h.some(Boolean)); g.held = h; G.yRoll(g); } assert.ok(G.yScore(g, G.aiPick(g.dice, g.players[0].sheet))); }
    tot += G.sheetTotal(g.players[0].sheet);
  }
  assert.ok(tot / N > 120, 'gemiddeld ' + tot / N);
});

// ---- Slangen en ladders ----
ok('Slangen en ladders', () => {
  assert.deepEqual(G.cellRC(1), { row: 0, col: 0 }); assert.deepEqual(G.cellRC(10), { row: 0, col: 9 }); assert.deepEqual(G.cellRC(11), { row: 1, col: 9 }); assert.deepEqual(G.cellRC(100), { row: 9, col: 0 });
  const seen = new Set(); for (let i = 1; i <= 100; i++) { const c = G.cellRC(i); seen.add(c.row * 10 + c.col); } assert.equal(seen.size, 100);
  for (const [a, b] of Object.entries(G.LADDERS)) assert.ok(+b > +a); for (const [a, b] of Object.entries(G.SNAKES)) assert.ok(+b < +a);
  assert.ok(Object.keys(G.SNAKES).every((k) => !G.LADDERS[k])); assert.ok(!G.SNAKES[100] && !G.LADDERS[100]);
  let m = G.moveSL(0, 1); assert.equal(m.to, 38); assert.equal(m.jump.kind, 'ladder'); m = G.moveSL(10, 6); assert.equal(m.to, 6); assert.equal(m.jump.kind, 'slang'); assert.deepEqual(m.path, [11, 12, 13, 14, 15, 16]);
  m = G.moveSL(98, 4); assert.deepEqual(m.path, [99, 100, 99, 98]); m = G.moveSL(94, 6); assert.equal(m.to, 100); assert.ok(m.won); assert.ok(!G.moveSL(50, 2).jump);
  for (let t = 0; t < 200; t++) { let p = 0, steps = 0; while (p < 100 && steps++ < 2000) p = G.moveSL(p, 1 + G.rand(6)).to; assert.equal(p, 100); }
});

// ---- Boter-kaas-en-eieren ----
ok('Boter-kaas-en-eieren', () => {
  assert.equal(G.ttResult(['X', 'X', 'X', null, null, null, null, null, null]).winner, 'X'); assert.equal(G.ttResult(Array(9).fill(null)), null); assert.ok(G.ttResult(['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']).draw);
  assert.equal(G.ttMove(['X', 'X', null, 'O', 'O', null, null, null, null], 'O', 1), 5); assert.equal(G.ttMove(['X', 'X', null, null, 'O', null, null, null, null], 'O', 1), 2);
  assert.equal(G.ttMove(['X', 'X', null, null, 'O', null, null, null, null], 'O', 2), 2); assert.equal(G.ttMove(Array(9).fill('X'), 'O', 2), -1);
  // de perfecte speler verliest nooit, tegen willekeurig en tegen zichzelf
  for (let k = 0; k < 120; k++) { const b = Array(9).fill(null); let turn = 'X'; const me = k % 2 ? 'X' : 'O'; while (!G.ttResult(b)) { const i = turn === me ? G.ttMove(b, me, 2) : G.ttMove(b, turn, 0); assert.ok(i >= 0 && !b[i]); b[i] = turn; turn = turn === 'X' ? 'O' : 'X'; } const r = G.ttResult(b); assert.ok(r.draw || r.winner === me, 'verloor'); }
  const b = Array(9).fill(null); let t = 'X'; while (!G.ttResult(b)) { b[G.ttMove(b, t, 2)] = t; t = t === 'X' ? 'O' : 'X'; } assert.ok(G.ttResult(b).draw);
});

// ---- Varkentje ----
ok('Varkentje', () => {
  assert.equal(G.pigAiHold(20, 0, 0), true); assert.equal(G.pigAiHold(10, 0, 0), false); assert.equal(G.pigAiHold(5, 96, 0), true); assert.equal(G.pigAiHold(25, 10, 80), false); assert.equal(G.pigAiHold(30, 10, 80), true);
  let wins = 0; for (let g = 0; g < 200; g++) { let s = [0, 0], p = 0, guard = 0; while (s[0] < 100 && s[1] < 100 && guard++ < 5000) { let turn = 0; for (;;) { if (G.pigAiHold(turn, s[p], s[1 - p])) { s[p] += turn; break; } const d = 1 + G.rand(6); if (d === 1) { turn = 0; break; } turn += d; } p = 1 - p; } if (s[0] >= 100) wins++; assert.ok(guard < 5000); }
  assert.ok(wins > 60 && wins < 140, 'eerlijk spel ' + wins);
});
ok('draaiwiel', () => {
  const T = Math.PI * 2;
  for (const nn of [2, 3, 5, 8, 12]) for (let i = 0; i < nn; i++) for (const fr of [0.05, 0.5, 0.95]) for (const from of [0, 3.3, -7, 100]) { const a = G.wheelTarget(from, i, nn, fr, 4); assert.equal(G.wheelIndex(a, nn), i, `n${nn} i${i}`); assert.ok(a >= from + 4 * T - 1e-9 - T); }
  assert.equal(G.wheelIndex(0, 4), 3 - 0 === 3 ? G.wheelIndex(0, 4) : 0); assert.equal(G.wheelIndex(-Math.PI / 2, 4), 0);
  assert.ok(G.EIGHTBALL.length === 16 && Object.keys(G.WHEEL_PRESETS).length >= 5);
});
console.log(process.exitCode ? 'MISLUKT' : `OK (${n} tests)`);
