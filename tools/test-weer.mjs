// Node-test voor docs/weer-core.js. Gebruik: node tools/test-weer.mjs
import assert from 'node:assert/strict';
import * as W from '../docs/weer-core.js';
let n = 0; const ok = (c, m) => { n++; assert.ok(c, m); }; const eq = (a, b, m) => { n++; assert.deepEqual(a, b, m); };

// weercodes
eq(W.wmoInfo(0).text, 'Onbewolkt'); eq(W.wmoInfo(0, true).text, 'Helder'); eq(W.wmoInfo(0, true).icons, ['moon']); eq(W.wmoInfo(2, true).icons, ['cloud', 'moon']); eq(W.wmoInfo(63).kind, 'rain'); eq(W.wmoInfo(95).kind, 'storm'); eq(W.wmoInfo(999).text, 'Onbekend');
for (const c of Object.keys(W.WMO)) { const i = W.wmoInfo(+c); ok(i.text && i.icons.length && i.kind && i.emoji, 'code ' + c); const s = W.sceneParams(+c, { night: +c % 2 === 0 }); ok(s.clouds >= 0 && s.clouds <= 1 && s.precip >= 0 && s.precip <= 1, 'scene ' + c); }
{ const s = W.sceneParams(75); ok(s.flakes && s.precip >= 0.9, 'zware sneeuw'); ok(W.sceneParams(99).hail && W.sceneParams(99).thunder, 'hagel'); ok(W.sceneParams(0, { clouds: 80 }).clouds >= 0.8, 'echte bewolking'); ok(W.sceneParams(0).precip === 0, 'geen regen'); ok(W.sceneParams(45).fog, 'mist'); }
// wind
eq(W.bft(0), 0); eq(W.bft(1), 1); eq(W.bft(19), 4); eq(W.bft(38), 6); eq(W.bft(118), 12); eq(W.bft(60), 7); ok(W.BEAUFORT.length === 13 && W.BEAUFORT.every((b, i) => b.n === i && b.land && b.sea), 'beaufort');
eq(W.windFrom(0), 'noorden'); eq(W.windFrom(225), 'zuidwesten'); eq(W.windFrom(359), 'noorden'); eq(W.windFrom(-90), 'westen'); eq(W.windFromShort(135), 'ZO');
// uv / aqi / maan
eq(W.uvInfo(1).level, 'Laag'); eq(W.uvInfo(3).level, 'Matig'); eq(W.uvInfo(6).level, 'Hoog'); eq(W.uvInfo(9).level, 'Zeer hoog'); eq(W.uvInfo(12).level, 'Extreem'); eq(W.uvInfo(null).level, 'Laag');
eq(W.aqiInfo(10).text, 'Goed'); eq(W.aqiInfo(45).text, 'Matig'); eq(W.aqiInfo(150).text, 'Extreem slecht'); eq(W.aqiInfo(null), null); eq(W.pollenLevel(5), 'laag'); eq(W.pollenLevel(300), 'zeer hoog');
{ const nm = W.moonPhase(new Date(Date.UTC(2000, 0, 6, 18, 14))); ok(nm.phase < 0.001 && nm.illum < 0.001 && nm.name === 'Nieuwe maan', 'nieuwe maan');
  // bekende volle maan: 2026-10-26 04:12 UTC
  const full = W.moonPhase(new Date(Date.UTC(2026, 9, 26, 4, 12))); ok(Math.abs(full.phase - 0.5) < 0.02 && full.illum > 0.98 && full.name === 'Volle maan', 'volle maan ' + JSON.stringify(full));
  const nm2 = W.moonPhase(new Date(Date.UTC(2026, 10, 9, 21, 0))); ok(nm2.illum < 0.05, 'nieuwe maan 9 nov 2026 ' + nm2.illum);
  const nf = W.nextFullMoon(new Date(Date.UTC(2026, 9, 28))); ok(nf && nf.getUTCMonth() === 10 && nf.getUTCDate() >= 23 && nf.getUTCDate() <= 25, 'volgende volle maan ' + nf); }
// tijd
eq(W.epoch('2026-10-31T14:00', 3600), Date.UTC(2026, 9, 31, 13, 0)); eq(W.hhmm(Date.UTC(2026, 9, 31, 13, 0), 3600), '14:00'); eq(W.hhmm(Date.UTC(2026, 9, 31, 23, 30), 9 * 3600), '08:30'); eq(W.placeParts(Date.UTC(2026, 9, 31, 23, 30), 3600).d, 1); eq(W.dayLength(30600), '8 u 30 min');
eq(W.sunFraction(5, 0, 10), 0.5); eq(W.sunFraction(11, 0, 10), null); eq(W.sunFraction(-1, 0, 10), null);
// normalize
{
  const j = { utc_offset_seconds: 3600, timezone: 'Europe/Amsterdam', current: { time: '2026-10-31T14:00', temperature_2m: 12, apparent_temperature: 10, relative_humidity_2m: 80, weather_code: 3, wind_speed_10m: 20, wind_direction_10m: 225, wind_gusts_10m: 40, precipitation: 0, is_day: 1, cloud_cover: 90, pressure_msl: 1010, surface_pressure: 1009 },
    hourly: { time: ['2026-10-31T13:00', '2026-10-31T14:00', '2026-10-31T15:00'], temperature_2m: [11, 12, 12.5], apparent_temperature: [9, 10, 10], precipitation_probability: [0, 20, null], precipitation: [0, 0, 0.2], weather_code: [3, 3, 61], wind_speed_10m: [18, 20, 22], wind_direction_10m: [220, 225, 230], uv_index: [1, 1.2, 0.8], cloud_cover: [80, 90, 100], is_day: [1, 1, 1] },
    daily: { time: ['2026-10-31', '2026-11-01'], weather_code: [3, 61], temperature_2m_max: [13, 11], temperature_2m_min: [6, 5], precipitation_sum: [0.2, 5], precipitation_probability_max: [30, 80], sunrise: ['2026-10-31T07:45', '2026-11-01T07:47'], sunset: ['2026-10-31T17:05', '2026-11-01T17:03'], uv_index_max: [1.5, 1], wind_speed_10m_max: [25, 30], wind_gusts_10m_max: [50, 60], sunshine_duration: [3600, 0], daylight_duration: [33600, 33300] },
    minutely_15: { time: ['2026-10-31T14:00', '2026-10-31T14:15', '2026-10-31T14:30'], precipitation: [0, 0.3, 0] } };
  const d = W.normalize(j); eq(d.hours.length, 3); eq(d.hours[2].pop, 0); eq(d.hours[1].t, Date.UTC(2026, 9, 31, 13, 0)); eq(d.days[0].sunrise, Date.UTC(2026, 9, 31, 6, 45)); eq(d.days[0].wd, 6); eq(d.days[1].sunHours, 0); eq(d.current.t, Date.UTC(2026, 9, 31, 13, 0)); eq(d.current.day, true);
  eq(W.currentHourIndex(d.hours, Date.UTC(2026, 9, 31, 13, 20)), 1); eq(W.currentHourIndex(d.hours, 0), 0); eq(W.currentHourIndex(d.hours, Date.UTC(2030, 0, 1)), 2);
  const now = Date.UTC(2026, 9, 31, 13, 5); const rs = W.rainSummary(d.rain15, now); eq(rs.state, 'soon'); eq(rs.minutes, 10); ok(/10 minuten/.test(rs.text), rs.text);
  eq(W.rainSummary(d.rain15, Date.UTC(2026, 9, 31, 13, 20)).state, 'now'); eq(W.rainSummary(d.rain15, Date.UTC(2026, 9, 31, 13, 40)).state, 'none'); eq(W.rainSummary([], 0).state, 'none');
  // minimale data (geen optionele velden) crasht niet
  const m = W.normalize({ current: { temperature_2m: 1, weather_code: 0, is_day: 0 }, hourly: { time: ['2026-01-01T00:00'], temperature_2m: [1], weather_code: [0] }, daily: { time: ['2026-01-01'], weather_code: [0], temperature_2m_max: [2], temperature_2m_min: [0], precipitation_sum: [null], sunrise: ['2026-01-01T08:00'], sunset: ['2026-01-01T16:00'] } }); eq(m.hours[0].uv, 0); eq(m.days[0].rain, 0); eq(m.days[0].sunHours, null);
  // activiteiten en advies
  const dry = { code: 1, max: 20, min: 10, rain: 0, pop: 5, wind: 18, sunHours: 8 }, wet = { code: 65, max: 9, min: 6, rain: 15, pop: 95, wind: 45, sunHours: 0 }, hot = { code: 0, max: 31, min: 20, rain: 0, pop: 0, wind: 12, sunHours: 13 }, windy = { code: 2, max: 16, min: 9, rain: 0, pop: 10, wind: 25, sunHours: 6 };
  const sc = (day, id) => W.activityScores(day).find((a) => a.id === id).score;
  ok(sc(dry, 'fietsen') > 70 && sc(wet, 'fietsen') < 30, 'fietsen'); ok(sc(hot, 'strand') > 80 && sc(wet, 'strand') < 15 && sc(dry, 'strand') < sc(hot, 'strand'), 'strand'); ok(sc(windy, 'vlieger') > sc(dry, 'vlieger') && sc(wet, 'vlieger') < 40, 'vlieger'); ok(sc({ ...dry, code: 95 }, 'buiten') < 40, 'onweer');
  ok(W.activityScores(dry).every((a) => a.score >= 0 && a.score <= 100 && a.name && a.icon), 'bereik'); eq(W.bestDayFor([wet, dry, hot], 'strand').i, 2); eq(W.scoreWord(90), 'Top'); eq(W.scoreWord(5), 'Slecht');
  ok(/regen/.test(W.daySummary(wet)) && /wind tot 45/.test(W.daySummary(wet)), W.daySummary(wet));
  const cl = (o) => W.clothing({ feels: 15, rain: 0, pop: 0, wind: 10, uv: 0, code: 1, ...o }).map((x) => x.text).join('|');
  ok(/vriest/.test(cl({ feels: -3 })) && /Koud/.test(cl({ feels: 5 })) && /Heet/.test(cl({ feels: 30 })) && /paraplu/.test(cl({ pop: 80, code: 61 })) && /zonnebrand/.test(cl({ uv: 6 })) && /Onweer/.test(cl({ code: 95 })) && /hard/.test(cl({ wind: 50 })) && /sneeuwt/.test(cl({ code: 73 })), 'kleding'); }
// quiz
for (let i = 0; i < 400; i++) { const q = W.makeWeatherQuiz(); ok(q.choices.includes(q.answer) && new Set(q.choices).size === q.choices.length && q.choices.length >= 2, JSON.stringify(q)); }
ok(W.CLOUDS.length >= 6, 'wolken');
console.log(`test-weer: ${n} controles OK`);
