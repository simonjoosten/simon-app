// Node-test voor docs/klusjes-core.js. Gebruik: node tools/test-klusjes.mjs
import assert from 'node:assert/strict';
import * as K from '../docs/klusjes-core.js';
import { ICONS } from '../docs/gfx/icons.js';

// weken
assert.equal(K.weekKey(new Date(2026, 0, 1)), '2026-W01'); assert.equal(K.weekKey(new Date(2026, 11, 31)), '2026-W53');
const sat = new Date(2026, 9, 31, 10).getTime(); // za 31 okt 2026
assert.equal(new Date(K.mondayOf(sat)).getDate(), 26);
const nd = new Date(K.nextWeekday(0, sat)); assert.equal(nd.getDay(), 1); assert.equal(nd.getDate(), 2); assert.equal(nd.getHours(), 23);
assert.equal(new Date(K.nextWeekday(5, sat)).getDate(), 31); // zaterdag = vandaag
// deadline-status
const mk = (o) => ({ status: 'open', points: 5, title: 't', ...o });
assert.equal(K.dueState(mk({}), sat), 'none');
assert.equal(K.dueState(mk({ due: sat - 3600e3 }), sat), 'late');
assert.equal(K.dueState(mk({ due: new Date(2026, 9, 31, 23, 59).getTime() }), sat), 'today');
assert.equal(K.dueState(mk({ due: sat + DAY() }), sat), 'soon');
assert.equal(K.dueState(mk({ due: sat + 10 * DAY() }), sat), 'later');
function DAY() { return 86400000; }
// weekplanning
const plan = K.weekPlan([mk({ id: 'a', due: new Date(2026, 9, 27, 23, 59).getTime() }), mk({ id: 'b', due: new Date(2026, 9, 31, 23, 59).getTime() }), mk({ id: 'c' }), mk({ id: 'd', due: new Date(2026, 10, 10).getTime() }), mk({ id: 'e', due: new Date(2026, 9, 20).getTime() }), mk({ id: 'f', status: 'done', due: sat })], sat);
assert.equal(plan.late.length, 2); assert.equal(plan.days[1].items.length, 0); assert.equal(plan.days[5].items[0].id, 'b'); assert.equal(plan.none[0].id, 'c'); assert.equal(plan.later[0].id, 'd'); assert(plan.late.some((x) => x.id === 'e'));
assert.equal(plan.days.flatMap((d) => d.items).length, 1);
const p2 = K.weekPlan([mk({ id: 'z', due: new Date(2026, 10, 2, 23, 59).getTime() })], new Date(2026, 10, 2, 8).getTime()); assert.equal(p2.days[0].items[0].id, 'z');
// niveaus
assert.equal(K.levelOf(0), 1); assert.equal(K.levelOf(49), 1); assert.equal(K.levelOf(50), 2); assert.equal(K.levelOf(150), 3);
assert.deepEqual(K.levelProgress(75), { level: 2, into: 25, need: 100, pct: 25 });
assert.equal(K.levelTitle(50), 'Klus-koning');
for (let L = 1; L <= 12; L++) assert(ICONS[K.levelIcon(L)]);
// prijzen
const e = K.earned({ total: 120, streak: 4, weekKey: '2026-W44', weekPoints: 40 }, '2026-W44');
for (const id of ['p1', 'p50', 'p100', 'st3', 'wk30']) assert(e.includes(id), id);
assert(!e.includes('p250') && !e.includes('st7') && !e.includes('wk75'));
assert(!K.earned({ total: 5, weekKey: 'oud', weekPoints: 99 }, '2026-W44').includes('wk30'));
assert.deepEqual(K.earned(null, 'x'), []);
for (const b of K.BADGES) assert(ICONS[b.ic], b.ic);
// iconen en sjablonen
assert.equal(K.choreIcon({ title: 'Hond uitlaten' }), 'dog'); assert.equal(K.choreIcon({ title: 'Vaatwasser uitruimen' }), 'cookie'); assert.equal(K.choreIcon({ title: 'Iets anders' }), 'hammer'); assert.equal(K.choreIcon({ title: 'x', icon: 'star' }), 'star');
for (const g of K.CHORE_TEMPLATES) { assert(ICONS[g.ic]); for (const it of g.items) { assert(ICONS[it[2]], it[2]); assert(it[1] >= 1 && it[1] <= 1000); assert(K.REPEAT[it[3]]); } }
for (const n of [...K.ICON_PICK, ...K.MILE_ICONS]) assert(ICONS[n], n);
// scorebord en beloningen
const rk = K.ranking([{ id: 'a', name: 'Anna', total: 10, weekKey: 'w', weekPoints: 9 }, { id: 'b', name: 'Bas', total: 30, weekKey: 'oud', weekPoints: 99 }], 'w', 'wp'); assert.equal(rk[0].id, 'a'); assert.equal(rk[1].wp, 0);
assert.equal(K.ranking([{ id: 'a', name: 'A', total: 1 }, { id: 'b', name: 'B', total: 5 }], 'w', 'total')[0].id, 'b');
const miles = [{ id: 'm1', need: 50 }, { id: 'm2', need: 100 }, { id: 'm3', need: 200 }];
assert.equal(K.nextMilestone(miles, [], 60).id, 'm2'); assert.equal(K.nextMilestone(miles, [{ milestone: 'm2' }], 60).id, 'm3'); assert.equal(K.nextMilestone(miles, [], 999), null);
assert.deepEqual(K.claimable(miles, [{ milestone: 'm1' }], 120).map((m) => m.id), ['m2']);
assert(K.cheerKid(0, 0).includes('rustig')); assert(K.cheerKid(3, 0).includes('3'));
console.log('klusjes: alle tests ok');
