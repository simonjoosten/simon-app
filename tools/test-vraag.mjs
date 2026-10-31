// Node-test voor docs/vraag-core.js, vraag-games.js en vraag-bank.js. Gebruik: node tools/test-vraag.mjs
import assert from 'node:assert/strict';
import * as V from '../docs/vraag-core.js';
import * as GM from '../docs/vraag-games.js';
import { SECTIONS } from '../docs/vraag-bank.js';
import { ICONS } from '../docs/gfx/icons.js';

// De vraag van een dag vóór de mix-datum blijft gelijk aan de oorspronkelijke bank (150 vragen, zelfde volgorde en formule)
assert.equal(V.BANK.length, 150); assert.equal(V.BANK[0], 'Wat is je favoriete plek om even tot rust te komen?'); assert.equal(V.BANK[149], 'Welke kleine traditie vind je fijn?');
const DAY = 86400000;
const orig = (k) => { const [y, m, d] = k.split('-').map(Number); const n = Math.floor(Date.UTC(y, m - 1, d) / DAY); return V.BANK[((n % 150) + 150) % 150]; };
for (const k of ['2026-10-31', '2026-10-01', '2026-01-15', '2025-12-31']) assert.equal(V.questionFor(k).q, orig(k), k);
assert.equal(V.questionFor('2026-10-31').type, 'open'); assert.equal(V.questionFor('2026-10-31').cat.length > 0, true);
// vanaf MIX_FROM: elke 3e dag een speciale vraagsoort; verder open
let typed = 0; const kinds = new Set();
for (let i = 0; i < 90; i++) { const d = new Date(2026, 10, 2 + i); const q = V.questionFor(V.dayKey(d)); if (q.type !== 'open') { typed++; kinds.add(q.type); assert(V.isChoice(q), q.q); } else assert.equal(q.q, orig(V.dayKey(d))); }
assert.equal(typed, 30); assert(kinds.size >= 4, [...kinds].join());
// alle typed vragen kloppen
for (const t of V.TYPED) { assert(t.q.length > 5 && t.q.length <= 200); assert(t.opts.length >= 2 && t.opts.length <= 10); assert.equal(new Set(t.opts).size, t.opts.length); assert(V.TYPES[t.type]); }
assert(V.TYPED.length >= 60); for (const [n, ic] of Object.entries(V.SECTION_ICON)) assert(ICONS[ic], n); for (const t of Object.values(V.TYPES)) assert(ICONS[t.ic]);
assert.equal(V.SECTION_OF.length, 150); assert.equal(V.SECTION_OF[0], 'Kennismaken'); assert.equal(V.SECTION_OF[149], 'Extra luchtige vragen');
// beheerder-vraag met type
const aq = V.questionFor('2026-11-05', { by: 'admin', q: 'Kies?', type: 'kies', opts: ['A', 'B', 'C'] }); assert.equal(aq.type, 'kies'); assert.equal(aq.from, 'admin'); assert(V.isChoice(aq));
assert.equal(V.questionFor('2026-11-05', { by: 'admin', q: 'Gewoon' }).type, 'open');
assert.equal(V.questionFor('2026-11-05', { by: 'admin', q: 'Slecht', type: 'kies', opts: ['A'] }).type, 'open');
assert.equal(V.questionFor('2026-11-05', { by: 'admin', q: 'S', type: 'schaal' }).opts.length, 10); assert.deepEqual(V.questionFor('2026-11-05', { by: 'admin', q: 'J', type: 'janee' }).opts, ['Ja', 'Nee']);
assert.equal(V.questionFor('2026-11-05', { by: 'iemand', q: 'x' }).from, 'bank');
assert.deepEqual(V.parseOpts('a, b;c\n d ,,'), ['a', 'b', 'c', 'd']); assert.equal(V.parseOpts('1,2,3,4,5,6,7,8').length, 6);
// antwoorden coderen
assert.equal(V.encodeAnswer('Ja', 'Nee'), 'Ja ⟦raad:Nee⟧'); assert.equal(V.encodeAnswer(' Hoi '), 'Hoi');
assert.deepEqual(V.parseAnswer('Ja ⟦raad:Nee⟧'), { main: 'Ja', guess: 'Nee' }); assert.deepEqual(V.parseAnswer('Gewoon een antwoord'), { main: 'Gewoon een antwoord', guess: '' }); assert.deepEqual(V.parseAnswer(null), { main: '', guess: '' });
assert(V.encodeAnswer('x'.repeat(500), 'a').length <= 400);
// uitslag en overeenkomst
const A = { uid: 'a', name: 'Anna', text: 'Ja ⟦raad:Nee⟧' }, B = { uid: 'b', name: 'Bas', text: 'Nee' }, C2 = { uid: 'c', name: 'Cas', text: 'Ja' };
const t = V.tally([A, B, C2], ['Ja', 'Nee']); assert.equal(t[0].n, 2); assert.equal(t[1].names[0], 'Bas');
assert(V.sameChoice(A, C2)); assert(!V.sameChoice(A, B)); assert(!V.sameChoice({ text: '' }, { text: '' }));
assert.deepEqual(V.guessResult(A, [A, B, C2]), { guess: 'Nee', right: 1, total: 2 }); assert.equal(V.guessResult(B, [A, B]), null);
const q = { type: 'janee', opts: ['Ja', 'Nee'] };
const st = V.togetherStats([{ key: 'k1', q, mine: A, all: [A, B] }, { key: 'k2', q, mine: C2, all: [C2, { uid: 'b', text: 'Ja' }] }, { key: 'k3', q, mine: null, all: [] }, { key: 'k4', q: { type: 'open', opts: [] }, mine: A, all: [A] }]);
assert.equal(st.days, 3); assert.equal(st.comparable, 2); assert.equal(st.same, 1); assert.equal(st.pct, 50); assert.equal(st.guesses, 1); assert.equal(st.guessRight, 1);
assert.equal(V.togetherStats([]).pct, null); assert(V.verdict(90).includes('hetzelfde')); assert(V.verdict(null).includes('Nog niet'));
// streak
const today = new Date(2026, 9, 31); const ans = (set) => (k) => set.includes(k);
assert.equal(V.streakFrom(today, ans(['2026-10-31', '2026-10-30', '2026-10-29'])), 3);
assert.equal(V.streakFrom(today, ans(['2026-10-30', '2026-10-29'])), 2); // vandaag nog niet
assert.equal(V.streakFrom(today, ans(['2026-10-31', '2026-10-29'])), 1); assert.equal(V.streakFrom(today, ans([])), 0);
assert.equal(V.streakBadge(7)[1], 'Week vol'); assert.equal(V.streakBadge(2), null); for (const b of V.STREAK_BADGES) assert(ICONS[b[2]]);
// quiz
assert(GM.QUIZ.length >= 60); for (const [c, qq, o, ok] of GM.QUIZ) { assert(GM.QUIZ_CATS.some((x) => x.id === c), c); assert.equal(o.length, 4); assert(ok >= 0 && ok < 4); assert.equal(new Set(o).size, 4, qq); assert(qq.endsWith('?')); }
for (const c of GM.QUIZ_CATS) { assert(ICONS[c.ic], c.ic); assert(GM.QUIZ.filter((x) => x[0] === c.id).length >= 8, c.id); }
const seeded = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
const round = GM.makeRound(null, 10, seeded(7)); assert.equal(round.length, 10); assert(new Set(round.map((r) => r.q)).size === 10);
for (const r of round) { const src = GM.QUIZ.find((x) => x[1] === r.q); assert.equal(r.opts[r.correct], src[2][src[3]]); assert.equal([...r.opts].sort().join(), [...src[2]].sort().join()); }
assert.equal(GM.makeRound('ruimte', 10).every((r) => r.cat === 'ruimte'), true); assert.equal(GM.makeRound('ruimte', 99).length, 8);
assert(GM.isRight({ correct: 2 }, 2) && !GM.isRight({ correct: 2 }, 1));
assert(GM.roundVerdict(10, 10).includes('Foutloos')); assert(GM.roundVerdict(1, 10).includes('Oefening'));
let s = GM.recordRound({}, 'ruimte', 8, 10); s = GM.recordRound(s, 'ruimte', 5, 10); assert.equal(s.plays, 2); assert.equal(s.best, 8); assert.equal(s.byCat.ruimte.r, 13); assert.equal(s.byCat.ruimte.a, 20); assert.equal(s.right, 13);
assert.equal(GM.recordRound(s, null, 3, 5).byCat.alles.a, 5);
// dobbelvraag
assert.equal(SECTIONS.length, 6); for (let f = 1; f <= 6; f++) { const p = GM.dicePick(SECTIONS, f, seeded(f)); assert.equal(p.section, SECTIONS[f - 1][0]); assert(SECTIONS[f - 1][1].includes(p.q)); }
for (let i = 0; i < 200; i++) { const r = GM.rollDie(); assert(r >= 1 && r <= 6); }
assert.equal(GM.shuffle([1, 2, 3, 4, 5], seeded(3)).sort().join(), '1,2,3,4,5');
console.log('vraag: alle tests ok');
