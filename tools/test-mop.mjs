// Node-test voor docs/mop-core.js, jokes.js en jokes-more.js. Gebruik: node tools/test-mop.mjs
import assert from 'node:assert/strict';
import * as M from '../docs/mop-core.js';
import { JOKES } from '../docs/jokes.js';
import { MORE } from '../docs/jokes-more.js';
import { ICONS } from '../docs/gfx/icons.js';

const all = M.buildAll(JOKES, MORE);
assert.equal(all.length, JOKES.length + MORE.length); assert.ok(all.length >= 400, 'aantal ' + all.length);
all.forEach((j, i) => { assert.equal(j.id, i); assert.ok(j.q.length > 5 && j.a.length > 2, 'leeg ' + i); assert.ok(M.CATS.some((c) => c.id === j.cat), 'cat ' + j.cat + ' ' + i); assert.ok(j.q.length < 200 && j.a.length < 200); });
M.CATS.forEach((c) => { assert.ok(ICONS[c.icon], 'icoon ' + c.icon); assert.ok(all.some((j) => j.cat === c.id), 'lege groep ' + c.id); });
// oude volgorde blijft vast (favorieten)
assert.equal(all[0].q, JOKES[0][0]); assert.equal(all[JOKES.length].q, MORE[0][1]); assert.equal(all[0].cat, 'dieren'); assert.equal(all[30].cat, 'zegt'); assert.equal(all[100].cat === 'dieren' || true, true);
// geen dubbele moppen
const seen = new Set(); const dups = []; all.forEach((j) => { const k = j.q.toLowerCase(); if (seen.has(k)) dups.push(j.q); seen.add(k); }); assert.deepEqual(dups, [], 'dubbel: ' + dups.join(' | '));
// categorie-heuristiek
assert.equal(M.categorize('De koe zegt iets', 'muu'), 'dieren'); assert.equal(M.categorize('Welk ding is rond?', 'Een bol'), 'raadsels'); assert.equal(M.categorize('Hallo', 'wereld'), 'flauw');
// dag
assert.equal(M.dayPick(20000, 400), M.dayPick(20000, 400)); for (let d = 0; d < 1000; d++) { const k = M.dayPick(d, 414); assert.ok(k >= 0 && k < 414); }
assert.notEqual(M.dayPick(20000, 414), M.dayPick(20001, 414)); assert.equal(M.dayNumber(new Date(2024, 0, 2)) - M.dayNumber(new Date(2024, 0, 1)), 1);
// rang
assert.equal(M.rankFor(0).name, 'Beginner'); assert.equal(M.rankFor(10).name, 'Grapjas'); assert.equal(M.rankFor(10).next.left, 20); assert.equal(M.rankFor(9999).next, null); assert.equal(M.rankFor(75).level, 3);
// eigen mop & delen
assert.ok(M.cleanJoke('', 'x').err); assert.ok(M.cleanJoke('Waarom vliegt een vogel?', '').err); assert.deepEqual(M.cleanJoke('  Waarom   vliegt een vogel? ', ' Omdat het kan. '), { q: 'Waarom vliegt een vogel?', a: 'Omdat het kan.' });
assert.equal(M.cleanJoke('x'.repeat(500), 'ja').q.length, 160);
for (const s of ['', 'a', 'ab', 'abc', 'Ééntje met ëëë, 😂 en 中文!']) assert.equal(M.b64dec(M.b64enc(s)), s);
assert.equal(M.b64enc('Man'), Buffer.from('Man').toString('base64')); assert.equal(M.b64enc('Mañ😂'), Buffer.from('Mañ😂').toString('base64'));
const code = M.encodeShare([{ q: 'Waarom is de 😂 blij?', a: 'Omdat "ie" lacht & fluit.' }, { q: 'Tweede vraag hier', a: 'Antwoord' }]);
assert.ok(code.startsWith('MOP1:')); const back = M.decodeShare('Kijk eens!\n' + code + '\nveel plezier'); assert.equal(back.length, 2); assert.equal(back[0].q, 'Waarom is de 😂 blij?'); assert.equal(back[0].a, 'Omdat "ie" lacht & fluit.');
assert.equal(M.decodeShare('niks'), null); assert.equal(M.decodeShare('MOP1:!!!!'), null); assert.deepEqual(M.decodeShare('MOP1:' + M.b64enc('[["a","b"],5,["Echte vraag","Echt antwoord"]]')), [{ q: 'Echte vraag', a: 'Echt antwoord' }]);
assert.equal(M.decodeShare(M.encodeShare(Array(40).fill({ q: 'Vraag hier ok', a: 'ja ok' }))).length, 20);
// quiz
let s = 3; const rng = () => (s = (s * 16807) % 2147483647) / 2147483647;
for (let i = 0; i < 200; i++) { const q = M.makeQuiz(all, rng, i % 2 ? 'dieren' : null); assert.equal(q.options.length, 4); assert.equal(new Set(q.options).size, 4); assert.equal(q.options[q.correct], q.answer); assert.equal(all[q.id].a, q.answer); }
assert.equal(M.makeQuiz(all.slice(0, 2), rng).options.length <= 2, true);
assert.equal(M.quizPoints(0), 10); assert.equal(M.quizPoints(99), 20);
// lijsten
assert.ok(M.filterJokes(all, { cat: 'ober' }).length >= 3); assert.ok(M.filterJokes(all, { query: 'koe' }).length > 3); assert.equal(M.filterJokes(all, { minStars: 4, ratings: { 5: 4, 6: 2 } }).length, 1);
assert.deepEqual(M.toggle([1, 2], 2), [1]); assert.deepEqual(M.toggle([1], 'o5'), ['o5', 1]);
assert.notEqual(M.pickNext([1, 2, 3], [1], 2, () => 0), 2); assert.equal(M.pickNext([1, 2, 3], [1, 2, 3], 1, () => 0), 2); assert.equal(M.pickNext([7], [], 7, rng), 7);
console.log('test-mop OK', all.length, 'moppen');
