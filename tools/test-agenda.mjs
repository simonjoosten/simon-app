// Node-test voor docs/agenda-core.js en docs/appstore.js. Gebruik: node tools/test-agenda.mjs
import assert from 'node:assert/strict';
import * as C from '../docs/agenda-core.js';
import { makeStore } from '../docs/appstore.js';

// herhalingen
assert(C.occursOn({ date: '2026-03-02', repeat: 'weekly' }, '2026-03-09'));
assert(!C.occursOn({ date: '2026-03-02', repeat: 'weekly' }, '2026-03-10'));
assert(!C.occursOn({ date: '2026-03-02', repeat: 'weekly' }, '2026-02-23'));
assert(C.occursOn({ date: '2024-02-29', repeat: 'yearly' }, '2025-02-28'));
assert(C.occursOn({ date: '2024-02-29', repeat: 'yearly' }, '2028-02-29'));
assert(!C.occursOn({ date: '2024-02-29', repeat: 'yearly' }, '2025-03-01'));
assert(C.occursOn({ date: '2026-05-01', repeat: 'none' }, '2026-05-01'));
// maandraster
const g = C.monthGrid(2026, 9); assert(g.every((w) => w.length === 7)); assert.equal(g[0][0].key <= '2026-10-01', true);
// pasen en feestdagen
assert.equal(C.easter(2026), '2026-04-05'); assert.equal(C.easter(2025), '2025-04-20'); assert.equal(C.easter(2024), '2024-03-31');
const h26 = C.holidays(2026); const f = (n) => h26.find((x) => x.title === n).date;
assert.equal(f('Koningsdag'), '2026-04-27'); assert.equal(f('Hemelvaartsdag'), '2026-05-14'); assert.equal(f('Eerste Pinksterdag'), '2026-05-24');
assert.equal(f('Moederdag'), '2026-05-10'); assert.equal(f('Vaderdag'), '2026-06-21');
assert.equal(C.holidays(2025).find((x) => x.title === 'Koningsdag').date, '2025-04-26'); // 27 apr 2025 is zondag
assert.equal(C.holidayOn('2026-12-25')[0].title, 'Eerste Kerstdag');
// weken
assert.equal(C.weekStart('2026-10-31'), '2026-10-26'); assert.equal(C.weekDays('2026-10-31')[6], '2026-11-01');
assert.equal(C.weekNr('2026-01-01'), 1); assert.equal(C.weekNr('2026-12-31'), 53);
assert.equal(C.countdownText(0), 'vandaag'); assert.equal(C.countdownText(5), 'over 5 dagen');
// verjaardagen
const evs = [{ id: 'a', title: '🎂 Opa', date: '2000-11-02', repeat: 'yearly', color: '#e6d98f' }, { id: 'b', title: 'Niet', date: '2026-11-01', repeat: 'none' }, { id: 'c', title: 'Sam', date: '2012-02-29', repeat: 'yearly', color: '#e6d98f' }];
const ub = C.upcomingBirthdays(evs, '2026-10-31'); assert.equal(ub[0].name, 'Opa'); assert.equal(ub[0].days, 2); assert.equal(ub[0].turns, 26);
assert.equal(ub[1].name, 'Sam'); assert.equal(ub[1].key, '2027-02-28');
assert.equal(C.nextYearly({ date: '2026-10-31' }, '2026-10-31'), '2026-10-31');
// categorie
assert.equal(C.catOf('#e5a9a9').id, 'sport'); assert.equal(C.catOf('#123456').id, 'afspraak'); assert.equal(C.colorOf('rot'), '#9fb8d6');
// dagindeling
const L = C.dayLayout([{ time: '09:00', title: 'a' }, { time: '09:30', title: 'b' }, { time: '12:00', title: 'c' }, { title: 'hele dag' }]);
assert.equal(L.timed.length, 3); assert.equal(L.untimed.length, 1); assert.equal(L.timed[0].n, 2); assert.equal(L.timed[2].n, 1); assert.notEqual(L.timed[0].col, L.timed[1].col);
assert.equal(C.toMin('07:05'), 425); assert.equal(C.toMin('x'), null); assert.equal(C.fromMin(425), '07:05');
// herinneringen
const e1 = { id: 'e1', title: 'Les', date: '2026-10-31', time: '10:00', repeat: 'none' };
const at = (h, m) => new Date(2026, 9, 31, h, m);
assert.equal(C.dueReminders([e1], at(9, 20), { e1: 30 }, {}).length, 0);
assert.equal(C.dueReminders([e1], at(9, 31), { e1: 30 }, {}).length, 1);
assert.equal(C.dueReminders([e1], at(9, 31), { e1: 30 }, { 'e1|2026-10-31': 1 }).length, 0);
assert.equal(C.dueReminders([e1], at(11, 0), { e1: 30 }, {}).length, 0);
assert.equal(C.dueReminders([{ ...e1, date: '2026-11-01' }], at(10, 5), { e1: 1440 }, {}).length, 1); // 1 dag ervoor
assert.equal(C.dueReminders([e1], at(9, 0), {}, {}).length, 0);
// rooster
const r = C.emptyRooster(); r.days[0][0] = 'wi'; r.days[0][2] = 'ne'; r.days[1][0] = 'zzz';
const cr = C.cleanRooster(r); assert.equal(cr.days[1][0], '');
const mon = new Date(2026, 10, 2, 8, 40); // maandag
assert.equal(C.lessonNow(cr, mon).cur.id, 'wi'); assert.equal(C.lessonNow(cr, mon).next.id, 'ne');
assert.equal(C.lessonNow(cr, new Date(2026, 10, 1, 9, 0)).cur, null); // zondag
assert.equal(C.lessonsLeft(cr, mon), 2);
assert.equal(C.cleanRooster(null).days.length, 5);
// zoeken & lijst
assert.equal(C.searchEvents(evs, 'opa').length, 1); assert.equal(C.searchEvents(evs, '').length, 0);
assert.equal(C.upcomingList([{ id: 'x', date: '2026-11-02', title: 'x', repeat: 'weekly' }], '2026-11-01', 15, 10).length, 2);
assert(C.TEMPLATES.every((t) => C.CATS.some((c) => c.id === t.cat)));

// opslag
const mem = new Map(); const ls = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, v) };
let cloud = null; const sets = [];
const mk = () => makeStore({ game: 'agenda-extra', uid: 'u1', defaults: { rem: {} }, ls, cloudGet: async () => cloud, cloudSet: async (d, u) => { sets.push(d); cloud = { data: d, updated: u }; }, delay: 5 });
const s1 = mk(); await s1.load(); s1.set({ rem: { a: 10 } }); await s1.flush();
assert.equal(sets.length, 1); assert(JSON.parse(cloud.data).rem.a === 10);
const s2 = mk(); const st = await s2.load(); assert.equal(st.rem.a, 10);
cloud = { data: JSON.stringify({ rem: { z: 1 } }), updated: Date.now() + 1e6 }; const s3 = mk(); assert.equal((await s3.load()).rem.z, 1);
const bad = makeStore({ game: 'g', uid: 'u', defaults: { x: 1 }, ls, cloudGet: async () => { throw new Error('offline'); }, cloudSet: async () => { throw new Error('offline'); }, delay: 5 });
await bad.load(); bad.set({ x: 2 }); await bad.flush(); assert(bad.isDirty()); assert.equal(bad.get().x, 2);
console.log('agenda: alle tests ok');
process.exit(0);
