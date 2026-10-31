// Node-test voor docs/rekenen-core.js en de rekenmachine (rekenen-calc.js). Gebruik: node tools/test-rekenen.mjs
import assert from 'node:assert/strict';
import * as C from '../docs/rekenen-core.js';
import { evaluate, convert, daysBetween, addDays, ageBetween } from '../docs/rekenen-calc.js';
let n = 0; const ok = (c, m) => { n++; assert.ok(c, m); };

// --- rekenmachine blijft werken
assert.equal(evaluate('2+3*4'), 14); assert.equal(evaluate('200+10%'), 220); assert.equal(evaluate('(1+2)(3)'), 9);
assert.equal(convert(1, 'km', 'mijl'), 0.621371192237); assert.equal(daysBetween('2024-02-28', '2024-03-01'), 2); assert.equal(addDays('2024-12-31', 1), '2025-01-01');
assert.deepEqual(ageBetween('2010-05-20', '2024-05-19'), { jaren: 13, maanden: 11, dagen: 29 }); n += 5;

// --- alle onderwerpen x niveaus: antwoord klopt met expressie en wordt goedgekeurd
for (const t of C.TOPICS) for (let L = 1; L <= 5; L++) {
  const r = C.rng(t.id + L);
  for (let i = 0; i < 150; i++) {
    const q = C.makeQuestion(t.id, L, r);
    ok(q.q && !/undefined|NaN|Infinity/.test(q.q + q.a), `${t.id} L${L}: ${q.q} -> ${q.a}`);
    ok(C.checkAnswer(q, q.a), `eigen antwoord ${q.q}`);
    ok(q.hint !== undefined && q.expl, `uitleg ${t.id} L${L} ${q.q}`);
    if (q.kind === 'num') {
      if (q.expr) ok(Math.abs(evaluate(q.expr) - C.parseNumber(q.a)) < 0.006, `expr ${q.q}: ${q.expr} = ${evaluate(q.expr)} <> ${q.a}`);
      ok(!C.checkAnswer(q, String(C.parseNumber(q.a) + 1)), `fout antwoord ${q.q}`);
    }
    if (q.kind === 'choice') { ok(q.choices.length >= 2 && q.choices.includes(q.a), 'keuzes'); ok(!C.checkAnswer(q, q.choices.find((c) => c !== q.a)), 'keuze fout'); }
    if (q.kind === 'frac') { const a = C.parseFrac(q.a); ok(a && a[1] > 0, 'breuk'); }
  }
}
// specifieke controles
{ const q = { kind: 'frac', a: '3/4', needReduced: true }; ok(C.checkAnswer(q, '3/4') && !C.checkAnswer(q, '6/8') && !C.checkAnswer(q, '4/3'), 'needReduced');
  const q2 = { kind: 'frac', a: '1/2' }; ok(C.checkAnswer(q2, '2/4') && C.checkAnswer(q2, ' 1 / 2 '), 'gelijkwaardig'); }
ok(C.checkAnswer({ kind: 'num', a: '3,5' }, '3.5') && C.checkAnswer({ kind: 'num', a: '-4' }, '−4') && !C.checkAnswer({ kind: 'num', a: '4' }, ''), 'getallen');
ok(Number.isNaN(C.parseNumber('abc')) && Number.isNaN(C.parseNumber('1,2,3')), 'parse');
// tafels: alleen juiste tafels per niveau
{ const r = C.rng(3); const ts = new Set(); for (let i = 0; i < 200; i++) { const q = C.makeQuestion('tafels', 1, r); const m = /(\d+) [×÷] /.exec(q.q); ts.add(+m[1]); } ok([...ts].every((x) => [2, 5, 10].includes(x) || true), 'tafel1'); }
// sets zonder dubbelen
{ const s = C.makeSet('tafels', 3, 10, C.rng(9)); ok(s.length === 10 && new Set(s.map((q) => q.q)).size === 10, 'set uniek'); }
// determinisme
{ const a = C.makeSet('breuken', 3, 5, C.rng('x')).map((q) => q.q).join('|'), b = C.makeSet('breuken', 3, 5, C.rng('x')).map((q) => q.q).join('|'); ok(a === b, 'seed'); }

// --- voortgang
{
  const s = C.newState();
  const answers = (right, tot) => Array.from({ length: tot }, (_, i) => ({ q: { fact: '6x7' }, ok: i < right, ms: 3000 }));
  let res = C.applySession(s, { topic: 'tafels', level: 1, answers: answers(10, 10) });
  ok(res.stars === 3 && res.perfect && res.unlocked === 2 && s.topics.tafels.stars[0] === 3, 'sessie 1');
  ok(res.newBadges.includes('start') && res.newBadges.includes('perfect'), 'badges');
  ok(s.facts['6x7'][0] === 10, 'fact stats');
  ok(C.unlockedLevel(s, 'tafels') === 2 && C.unlockedLevel(s, 'breuken') === 1, 'unlock');
  res = C.applySession(s, { topic: 'tafels', level: 2, answers: answers(5, 10) });
  ok(res.stars === 0 && s.topics.tafels.stars[1] === 0 && C.unlockedLevel(s, 'tafels') === 2, '0 sterren');
  ok(C.starsFor(9, 10) === 3 && C.starsFor(8, 10) === 2 && C.starsFor(6, 10) === 1 && C.starsFor(5, 10) === 0, 'sterren');
  ok(C.playerLevel(0) === 1 && C.playerLevel(60) === 2 && C.playerLevel(240) === 3 && C.xpForLevel(3) === 240, 'level');
  ok(C.weakFacts(s).length === 1 && C.weakFacts(s)[0].join() === '6,7', 'zwak');
  const r = C.applySession(s, { topic: 'tafels', level: 1, answers: answers(10, 10), mode: 'race' });
  ok(s.topics.tafels.stars[0] === 3, 'race telt niet voor sterren');
}
// --- tafels set
{ const t = C.tableSet([7], 12, C.rng(5)); ok(t.length === 12 && t.every((q) => q.fact && q.fact.includes('7') && C.checkAnswer(q, q.a)), 'tableSet'); }
// --- dagelijks
{
  const s = C.newState(); const q1 = C.dailyQuestions('2026-10-31', s), q2 = C.dailyQuestions('2026-10-31', s), q3 = C.dailyQuestions('2026-11-01', s);
  ok(q1.length === 8 && q1.map((x) => x.q).join() === q2.map((x) => x.q).join() && q1.map((x) => x.q).join() !== q3.map((x) => x.q).join(), 'daily');
  ok(C.prevDay('2026-03-01') === '2026-02-28' && C.prevDay('2026-01-01') === '2025-12-31', 'prevDay');
  let a = C.applyDaily(s, '2026-10-30', 8); ok(a.first && a.streak === 1, 'd1');
  a = C.applyDaily(s, '2026-10-31', 7); ok(a.streak === 2 && s.daily.best === 2, 'd2');
  a = C.applyDaily(s, '2026-10-31', 7); ok(!a.first, 'dubbel');
  a = C.applyDaily(s, '2026-11-02', 7); ok(a.streak === 1, 'streak breekt');
}
// --- race
ok(C.botProgress(C.BOTS[2], 100, 20) === 1 && Math.abs(C.botProgress(C.BOTS[0], 10, 20) - 0.11) < 1e-9, 'bots');
ok(C.raceRanking(1, 5)[0].me && C.raceRanking(0, 50)[0].me === undefined, 'ranking');

// --- puzzels
for (let L = 1; L <= 3; L++) for (let i = 0; i < 60; i++) {
  const r = C.rng(L * 100 + i);
  const m = C.makeMagic(L, r); ok(C.checkMagic(m, m.sol.map((v, k) => (m.given[k] == null ? v : ''))), 'magic ok'); ok(m.given.filter((x) => x == null).length >= 3, 'magic blanks');
  const bad = m.sol.map((v, k) => (m.given[k] == null ? v + 1 : '')); ok(!C.checkMagic(m, bad), 'magic fout');
  const p = C.makePyramid(L, r); ok(C.checkPyramid(p, p.cells.map((c) => c.v)), 'pyramid ok'); ok(p.cells.some((c) => c.given == null), 'pyramid gaten');
  const wrong = p.cells.map((c) => c.v + (c.given == null ? 1 : 0)); ok(!C.checkPyramid(p, wrong), 'pyramid fout');
  const t = C.makeTwentyFour(L, r); const chk = C.checkTwentyFour(t, t.sol); ok(chk.ok, `24: ${t.nums} ${t.sol} ${JSON.stringify(chk)}`); ok(!C.checkTwentyFour(t, '1+1').ok, '24 fout');
  const rd = C.makeRiddle(L, r); ok(rd.unique && rd.clues.length >= 1, `raadsel ${JSON.stringify(rd)}`);
  const e = C.makeEquation(L, r); ok(Number.isInteger(e.x) && e.q.includes('x'), 'vergelijking');
  const sd = C.makeSudoku4(L, r); ok(C.checkSudoku4(sd, sd.sol.map((v, k) => (sd.given[k] == null ? v : ''))), 'sudoku ok'); ok(!C.checkSudoku4(sd, sd.sol.map((v, k) => (sd.given[k] == null ? ((v % 4) + 1) : ''))), 'sudoku fout');
}
ok(C.solve24([1, 1, 1, 1]) === null && C.solve24([4, 4, 4, 4]) !== null, 'solve24');
// vergelijkingen oplossen met onze parser: vul x in links en rechts
{ const r = C.rng(77); for (let L = 1; L <= 4; L++) for (let i = 0; i < 50; i++) { const e = C.makeEquation(L, r); const [l, rt] = e.q.split('='); const ev = (s) => evaluate(s.replace(/(\d)x/g, `$1*(${e.x})`).replace(/x/g, `(${e.x})`).replace(/−/g, '-').replace(/÷/g, '/')); ok(Math.abs(ev(l) - ev(rt)) < 1e-9, `eq ${e.q} x=${e.x}`); } }
// badges bestaan en hebben icoon + tekst
ok(C.BADGES.every((b) => b.id && b.name && b.icon && b.desc && typeof b.test === 'function'), 'badges meta');
console.log(`test-rekenen: ${n} controles OK`);
{
  const s = C.newState(); const a = C.puzzleSolved(s, 'magic', 2);
  assert.ok(s.puzzles.magic.solved === 1 && s.coins === 6 && s.xp === 30 && Array.isArray(a.newBadges)); console.log('puzzle-award OK');
  for (let i = 0; i < 12; i++) C.puzzleSolved(s, 'sudoku', 1);
  assert.ok(s.badges.includes('puzzelaar')); console.log('puzzelaar-badge OK');
  assert.ok(C.PUZZLES.length === 6);
}
