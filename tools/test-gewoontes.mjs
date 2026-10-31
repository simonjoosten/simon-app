// Node-test voor docs/gewoontes-core.js. Gebruik: node tools/test-gewoontes.mjs
import assert from 'node:assert/strict';
import * as G from '../docs/gewoontes-core.js';
import { ICONS } from '../docs/gfx/icons.js';

const T = '2026-10-31'; // zaterdag
const mk = (days, extra = {}) => ({ id: 'h', name: 'x', days: Object.fromEntries(days.map((d) => [d, 1])), created: new Date(2026, 0, 1).getTime(), sched: [], ...extra });
// oude streak-functies blijven werken
assert.equal(G.streakOf({ '2026-10-31': 1, '2026-10-30': 1, '2026-10-29': 1 }, T), 3);
assert.equal(G.streakOf({ '2026-10-30': 1 }, T), 1); assert.equal(G.streakOf({}, T), 0);
assert.equal(G.bestStreak({ '2026-10-01': 1, '2026-10-02': 1, '2026-10-04': 1 }), 2);
assert.equal(G.dow('2026-10-26'), 0); assert.equal(G.dow('2026-11-01'), 6);
// streak met schema (alleen schooldagen ma-vr): vr 30, do 29, wo 28 -> weekend telt niet
const school = mk(['2026-10-30', '2026-10-29', '2026-10-28', '2026-10-27'], { sched: [0, 1, 2, 3, 4] });
assert.equal(G.streakSched(school, T), 4); // za is rustdag
assert.equal(G.streakSched(mk(['2026-10-30'], { sched: [] }), T), 1);
assert.equal(G.streakSched(mk(['2026-10-29']), T), 0); // gisteren gemist
assert.equal(G.bestSched(mk(['2026-10-23', '2026-10-26'], { sched: [0, 1, 2, 3, 4] })), 2); // vr -> ma
assert.equal(G.bestSched(mk(['2026-10-23', '2026-10-27'], { sched: [0, 1, 2, 3, 4] })), 1); // ma gemist
assert.equal(G.isDue({ sched: [5, 6] }, T), true); assert.equal(G.isDue({ sched: [0] }, T), false);
assert.equal(G.schedText({ sched: [0, 1, 2, 3, 4] }), 'op schooldagen'); assert.equal(G.schedText({ sched: [] }), 'elke dag'); assert.equal(G.schedText({ sched: [0, 2] }), 'ma · wo');
// rate
const r = mk(['2026-10-31', '2026-10-30', '2026-10-29', '2026-10-28', '2026-10-27', '2026-10-26', '2026-10-25']);
assert.equal(G.rate(r, T, 7), 100); assert.equal(G.rate(mk([]), T, 7), 0);
// XP en niveaus
assert.equal(G.levelOf(0), 1); assert.equal(G.levelOf(99), 1); assert.equal(G.levelOf(100), 2); assert.equal(G.levelOf(300), 3); assert.equal(G.levelOf(299), 2);
const lp = G.levelProgress(150); assert.equal(lp.level, 2); assert.equal(lp.into, 50); assert.equal(lp.need, 200); assert.equal(lp.pct, 25);
assert.equal(G.xpGain(1), 11); assert.equal(G.xpGain(50), 20); assert.equal(G.levelTitle(99), 'Superster');
for (let L = 1; L < 14; L++) assert(ICONS[G.levelIcon(L)], 'level icon ' + L);
// perfecte dagen
const a = mk(['2026-10-31', '2026-10-30']), b = mk(['2026-10-31']);
assert(G.isPerfect([a, b], '2026-10-31')); assert(!G.isPerfect([a, b], '2026-10-30')); assert(!G.isPerfect([a], '2026-10-31'));
assert.equal(G.dayStatus([a, b], '2026-10-30').done, 1);
const days7 = ['31', '30', '29', '28', '27', '26', '25'].map((d) => `2026-10-${d}`);
assert.equal(G.perfectRun([mk(days7), mk(days7)], T), 7);
// prijzen
let e = G.earnedBadges([mk(days7), mk(days7)], { xp: 0, checks: 14 }, T);
for (const id of ['first', 's3', 's7', 'perfect', 'perfect7']) assert(e.includes(id), id);
assert(!e.includes('s14')); assert(!e.includes('five'));
assert(G.earnedBadges([], { xp: 100000, checks: 2000 }, T).includes('c1000'));
assert(G.earnedBadges([], { xp: 100000 }, T).includes('l10'));
for (const b of G.BADGES) assert(ICONS[b.ic], 'badge icon ' + b.ic);
// sjablonen
for (const g of G.TEMPLATE_GROUPS) { assert(ICONS[g.ic]); for (const it of g.items) { assert(ICONS[it[1]], it[1]); assert(G.COLORS[it[2]]); assert(it[3].every((d) => d >= 0 && d <= 6)); } }
for (const n of G.ICON_CHOICES) assert(ICONS[n], 'choice ' + n);
assert.equal(G.STARTERS.length, 6);
// heatmap + weekdagen
const hm = G.heatmap([mk(days7)], T, 4); assert.equal(hm.length, 4); assert(hm.every((c) => c.length === 7)); assert.equal(hm[3][5], 1); assert.equal(hm[3][6], -1); // zondag 1 nov is toekomst
assert.equal(G.weekdayCounts([mk(days7)], T, 2).reduce((x, y) => x + y, 0), 7);
// opslag: oude formaat laadt, nieuw formaat rondje
const old = JSON.stringify({ habits: [{ id: 'a', name: 'Water', emoji: '💧', color: '#8fc9a9', days: { '2026-10-30': 1 }, created: 5 }] });
const p = G.parseAll(old); assert.equal(p.habits[0].name, 'Water'); assert.deepEqual(p.habits[0].sched, []); assert.equal(p.meta.xp, 0); assert.equal(G.parse(old).length, 1);
const ser = G.serialize(p.habits, { ...p.meta, xp: 40 }); assert(ser.length < G.MAX_JSON); assert.equal(G.parseAll(ser).meta.xp, 40);
assert.equal(G.parseAll('rommel'), null);
// grote data wordt ingekort
const many = Array.from({ length: 24 }, (_, i) => ({ id: 'h' + i, name: 'Gewoonte ' + i, emoji: '⭐', icon: 'star', color: '#fff', sched: [], note: '', created: 1, days: Object.fromEntries(Array.from({ length: 200 }, (_, d) => [G.shiftKey('2026-10-31', -d), 1])) }));
assert(G.serialize(many, G.defaultMeta()).length < G.MAX_JSON);
assert(G.milestoneHit(7) && !G.milestoneHit(8));
console.log('gewoontes: alle tests ok');
