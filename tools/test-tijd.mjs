// Node-test voor docs/tijd-core.js. Gebruik: node tools/test-tijd.mjs
import assert from 'node:assert/strict';
import * as T from '../docs/tijd-core.js';
let n = 0; const ok = (c, m) => { n++; assert.ok(c, m); }; const eq = (a, b, m) => { n++; assert.deepEqual(a, b, m); };

// opmaak
eq(T.fmt(65000), '01:05'); eq(T.fmt(3600000), '01:00:00'); eq(T.fmt(-5), '00:00'); eq(T.fmtCs(61230), '01:01.23'); eq(T.fmtCs(3600000), '01:00:00.00');
// wekker
{ const now = new Date(2026, 9, 31, 10, 0, 0); // za 31 okt 2026
  eq(T.nextAlarmTime({ time: '11:30', days: [] }, now).getHours(), 11);
  eq(T.nextAlarmTime({ time: '09:00', days: [] }, now).getDate(), 1);
  const ma = T.nextAlarmTime({ time: '07:00', days: [1] }, now); eq([ma.getDay(), ma.getDate()], [1, 2]);
  eq(T.nextAlarmTime({ time: '25:00' }, now), null); eq(T.nextAlarmTime({ time: '10:00', days: [] }, now).getDate(), 1, 'strikt na nu'); }
// kalender
eq(T.isoWeek(new Date(2026, 0, 1)), { week: 1, year: 2026 }); eq(T.isoWeek(new Date(2021, 0, 3)), { week: 53, year: 2020 }); eq(T.dayOfYear(new Date(2026, 11, 31)), 365);
eq(T.easter(2026).toDateString(), new Date(2026, 3, 5).toDateString()); eq(T.easter(2025).toDateString(), new Date(2025, 3, 20).toDateString());
// Nederlandse tijd
eq(T.dutchTime(3, 0), 'drie uur'); eq(T.dutchTime(15, 15), 'kwart over drie'); eq(T.dutchTime(3, 30), 'half vier'); eq(T.dutchTime(3, 45), 'kwart voor vier'); eq(T.dutchTime(3, 20), 'tien voor half vier');
eq(T.dutchTime(3, 35), 'vijf over half vier'); eq(T.dutchTime(3, 55), 'vijf voor vier'); eq(T.dutchTime(12, 50), 'tien voor een'); eq(T.dutchTime(0, 5), 'vijf over twaalf'); eq(T.dutchTime(11, 40), 'tien over half twaalf'); eq(T.dutchTime(23, 52), 'acht voor twaalf'); eq(T.dutchTime(6, 7), 'zeven over zes');
eq(T.handAngles(3, 0), { hour: 90, minute: 0, second: 0 }); eq(T.handAngles(6, 30).hour, 195); eq(T.angleToMinute(90), 15); eq(T.angleToMinute(359), 0); eq(T.angleToMinute(92, 5), 15); eq(T.angleToMinute(-90), 45);
// klokvragen
for (let L = 1; L <= 5; L++) { const r = (() => { let s = L * 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })(); const seen = new Set();
  for (let i = 0; i < 200; i++) { const q = T.makeClockQuestion(L, r); seen.add(q.type); ok(q.prompt && !/undefined|NaN/.test(q.prompt), 'prompt ' + q.prompt);
    if (q.type !== 'zet') { ok(q.choices.length === 4 && new Set(q.choices).size === 4 && q.choices.includes(q.answer), `keuzes ${q.type} ${JSON.stringify(q)}`); ok(T.checkClockAnswer(q, q.answer) && !T.checkClockAnswer(q, q.choices.find((c) => c !== q.answer)), 'check'); }
    else { ok(T.checkClockAnswer(q, { h: q.h, m: q.m }) && T.checkClockAnswer(q, { h: q.h % 12 + 12, m: q.m }) && !T.checkClockAnswer(q, { h: (q.h + 1) % 12, m: q.m }), 'zet'); if (L === 1) ok(q.m === 0, 'niveau 1 hele uren'); if (L === 2) ok(q.m % 15 === 0, 'niveau 2 kwartieren'); if (L === 3) ok(q.m % 5 === 0, 'niveau 3 vijf'); } }
  ok(seen.size >= 3, 'variatie niveau ' + L); }
{ const q = T.makeClockQuestion(5, Math.random, 'duur'); ok(q.type === 'duur' && q.choices.includes(q.answer), 'duur'); }
// tijdzones
{ const d = new Date(Date.UTC(2026, 6, 1, 12, 0)); // zomer
  eq(T.tzOffsetMin(d, 'Europe/Amsterdam'), 120); eq(T.tzOffsetMin(d, 'Asia/Kolkata'), 330); eq(T.tzOffsetMin(d, 'America/New_York'), -240); eq(T.formatOffset(330), 'UTC+5:30'); eq(T.formatOffset(-240), 'UTC−4'); eq(T.formatOffset(0), 'UTC+0');
  const w = new Date(Date.UTC(2026, 0, 15, 12, 0)); eq(T.tzOffsetMin(w, 'Europe/Amsterdam'), 60); eq(T.hoursAhead('Europe/Amsterdam', 'Asia/Tokyo', w), 8); eq(T.hoursAhead('Europe/Amsterdam', 'America/New_York', w), -6); eq(T.hoursAhead('Europe/Amsterdam', 'Asia/Kolkata', w), 4.5);
  // zomertijd-verschil NL/VS in de gaten maart: 15 maart is NL nog wintertijd, VS al zomertijd
  const m = new Date(Date.UTC(2026, 2, 15, 12, 0)); eq(T.hoursAhead('Europe/Amsterdam', 'America/New_York', m), -5);
  const c = T.convertTime(15, 0, 'Europe/Amsterdam', 'Asia/Tokyo', w); eq([c.h, c.mi, c.dayShift], [23, 0, 0]);
  const c2 = T.convertTime(20, 0, 'Europe/Amsterdam', 'Asia/Tokyo', w); eq([c2.h, c2.mi, c2.dayShift], [4, 0, 1]);
  const c3 = T.convertTime(2, 30, 'Europe/Amsterdam', 'America/New_York', w); eq([c3.h, c3.mi, c3.dayShift], [20, 30, -1]);
  const z = T.zonedToDate({ y: 2026, mo: 1, d: 15, h: 12, mi: 0 }, 'Asia/Tokyo'); eq(z.toISOString(), '2026-01-15T03:00:00.000Z');
  // ontbrekend uur bij zomertijd niet crashen
  ok(T.zonedToDate({ y: 2026, mo: 3, d: 29, h: 2, mi: 30 }, 'Europe/Amsterdam') instanceof Date, 'gat zomertijd');
  const mw = T.meetingWindows(['Europe/Amsterdam', 'America/New_York'], w, 8, 20); ok(mw.length === 1 && mw[0].from === 14 && mw[0].to === 20, 'overlap NL-NY ' + JSON.stringify(mw));
  eq(T.meetingWindows(['Europe/Amsterdam', 'Asia/Tokyo'], w, 9, 17), []); eq(T.hhmm(14.5), '14:30');
  ok(T.CITIES.every((c) => { try { T.tzOffsetMin(w, c.tz); return true; } catch { return false; } }), 'alle steden hebben geldige tz');
  ok(T.CITIES.length >= 30 && T.DEFAULT_CITIES.every((id) => T.CITY[id]), 'steden'); }
// zon
{ const s = T.subsolar(new Date(Date.UTC(2026, 5, 21, 12, 0))); ok(Math.abs(s.lat - 23.4) < 0.8 && Math.abs(s.lon) < 2.5, 'subsolar zomer ' + JSON.stringify(s));
  const e = T.subsolar(new Date(Date.UTC(2026, 2, 20, 12, 0))); ok(Math.abs(e.lat) < 1, 'equinox ' + e.lat);
  const w = T.subsolar(new Date(Date.UTC(2026, 11, 21, 0, 0))); ok(Math.abs(w.lat + 23.4) < 0.8 && Math.abs(Math.abs(w.lon) - 180) < 3, 'subsolar winter ' + JSON.stringify(w));
  const alt = T.sunAltitude(new Date(Date.UTC(2026, 5, 21, 11, 0)), 52.37, 4.9); ok(alt > 58 && alt < 63, 'zonnehoogte NL zomer ' + alt);
  ok(T.isDaytime(new Date(Date.UTC(2026, 5, 21, 12, 0)), 52.37, 4.9) && !T.isDaytime(new Date(Date.UTC(2026, 5, 21, 0, 0)), 52.37, 4.9), 'dag/nacht'); }
// aftellen
eq(T.countdownParts(90061000), { d: 1, h: 1, m: 1, s: 1, total: 90061 }); eq(T.countdownParts(-5).total, 0);
{ const now = new Date(2026, 9, 31, 10).getTime();
  eq(new Date(T.eventTarget({ preset: 'kerst' }, now)).toDateString(), new Date(2026, 11, 25).toDateString());
  eq(new Date(T.eventTarget({ preset: 'koningsdag' }, now)).getFullYear(), 2027); eq(new Date(T.eventTarget({ preset: 'pasen' }, now)).toDateString(), T.easter(2027).toDateString());
  eq(new Date(T.eventTarget({ preset: 'oudnieuw' }, now)).toDateString(), new Date(2027, 0, 1).toDateString());
  eq(T.eventTarget({ preset: 'bestaatniet' }, now), null);
  eq(new Date(T.eventTarget({ date: '2026-12-01', time: '14:30' }, now)).getHours(), 14); eq(new Date(T.eventTarget({ date: '2010-05-20', yearly: true }, now)).toDateString(), new Date(2027, 4, 20).toDateString());
  eq(new Date(T.eventTarget({ date: '2026-11-05', yearly: true }, now)).getFullYear(), 2026); eq(T.eventTarget({ date: 'kaas' }, now), null); ok(T.EVENT_PRESETS.every((p) => T.eventTarget(p, now) > now), 'presets liggen in de toekomst'); }
// interval
{ const p = T.buildIntervalPlan({ work: 20, rest: 10, rounds: 8, warm: 10, cool: 0 }); eq(p.length, 1 + 8 + 7); eq(T.planTotal(p), 10 + 8 * 20 + 7 * 10);
  eq(T.segmentAt(p, 0).seg.type, 'warm'); eq(T.segmentAt(p, 10).seg, { type: 'work', secs: 20, round: 1 }); eq(T.segmentAt(p, 31).seg.type, 'rest'); eq(T.segmentAt(p, 29.5).left, 0.5); eq(T.segmentAt(p, T.planTotal(p)), null);
  eq(T.buildIntervalPlan({ work: 5, rest: 0, rounds: 1, warm: 0, cool: 3 }).map((s) => s.type), ['work', 'cool']); ok(T.INTERVAL_PRESETS.every((x) => T.planTotal(T.buildIntervalPlan(x)) > 0), 'presets'); }
// schaakklok
{ const c = T.newTurnClock(5, 2); T.turnPress(c, 0, 1000); eq(c.active, 1); T.turnPress(c, 1, 4000); eq(c.t[1], 300000 - 3000 + 2000); eq(c.active, 0); T.turnPress(c, 1, 5000); eq(c.active, 0, 'verkeerde speler negeren');
  T.turnTick(c, 4000 + 400000); eq(c.over, 0); eq(c.t[0], 0); T.turnPress(c, 0, 500000); eq(c.over, 0); }
console.log(`test-tijd: ${n} controles OK`);
