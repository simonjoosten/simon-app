// Node-test voor docs/kompas-core.js. Gebruik: node tools/test-kompas.mjs
import assert from 'node:assert/strict';
import * as K from '../docs/kompas-core.js';
let n = 0; const ok = (c, m) => { n++; assert.ok(c, m); }; const eq = (a, b, m) => { n++; assert.deepEqual(a, b, m); }; const near = (a, b, e, m) => ok(Math.abs(a - b) <= e, `${m}: ${a} <> ${b}`);

// windstreken
eq(K.dir(0), 'N'); eq(K.dir(359), 'N'); eq(K.dir(90), 'O'); eq(K.dir(225), 'ZW'); eq(K.dir(-45), 'NW'); eq(K.dir(11.2), 'N'); eq(K.dir(11.3), 'NNO'); eq(K.dirName(180), 'Zuid');
eq(K.angleDiff(350, 10), 20); eq(K.angleDiff(10, 350), -20); eq(K.angleDiff(90, 90), 0); eq(Math.abs(K.angleDiff(0, 180)), 180); eq(K.norm360(-90), 270);
// afstanden: Amsterdam - Utrecht ~ 35 km; Amsterdam - New York ~ 5860 km
near(K.distance(52.3702, 4.8952, 52.0907, 5.1214), 35000, 1500, 'A-U'); near(K.distance(52.3702, 4.8952, 40.7128, -74.006), 5860000, 40000, 'A-NY'); eq(K.distance(10, 10, 10, 10), 0);
near(K.bearing(52.37, 4.89, 52.09, 5.12), 150, 15, 'peiling A-U (zuidoost)'); near(K.bearing(0, 0, 1, 0), 0, 1e-9, 'noord'); near(K.bearing(0, 0, 0, 1), 90, 1e-6, 'oost'); near(K.bearing(0, 0, -1, 0), 180, 1e-6, 'zuid'); near(K.bearing(0, 0, 0, -1), 270, 1e-6, 'west');
for (let i = 0; i < 200; i++) { const lat = Math.random() * 140 - 70, lon = Math.random() * 360 - 180, b = Math.random() * 360, d = 10 + Math.random() * 5000, p = K.destination(lat, lon, b, d); near(K.distance(lat, lon, p.lat, p.lon), d, 0.5, 'destination afstand'); near(Math.abs(K.angleDiff(K.bearing(lat, lon, p.lat, p.lon), b)), 0, 0.2, 'destination koers'); }
eq(K.fmtDist(42.4), '42 m'); eq(K.fmtDist(1500), '1,50 km'); eq(K.fmtDist(25000), '25.0 km'.replace('.', ',')); eq(K.dms(52.3702, true), "52° 22' 12.7\" N"); eq(K.dms(-4.5, false), "4° 30' 0.0\" W");
eq(K.parseCoord('52,3702 4,8952'), { lat: 52.3702, lon: 4.8952 }); eq(K.parseCoord('52.37, -4.89'), { lat: 52.37, lon: -4.89 }); eq(K.parseCoord('95, 4'), null); eq(K.parseCoord('kaas'), null); eq(K.fmtCoord(52.37021, 4.89), '52,37021, 4,89000');
// zon: Amsterdam 21 juni 2026 12:00 UTC (zonne-hoogte ~ 61°, azimut ~ zuid); 21 dec ~ 14°; middernacht negatief
{ const s = K.sunPosition(new Date(Date.UTC(2026, 5, 21, 11, 40)), 52.37, 4.9); near(s.altitude, 61, 1.5, 'zon zomer'); near(s.azimuth, 180, 6, 'zon zuid');
  const w = K.sunPosition(new Date(Date.UTC(2026, 11, 21, 11, 30)), 52.37, 4.9); near(w.altitude, 14.2, 2.5, 'zon winter');
  ok(K.sunPosition(new Date(Date.UTC(2026, 5, 21, 0, 0)), 52.37, 4.9).altitude < 0, 'nacht');
  const e = K.sunPosition(new Date(Date.UTC(2026, 5, 21, 3, 0)), 52.37, 4.9); ok(e.azimuth > 40 && e.azimuth < 100, 'ochtend oost ' + e.azimuth);
  const a = K.sunPosition(new Date(Date.UTC(2026, 5, 21, 18, 0)), 52.37, 4.9); ok(a.azimuth > 250 && a.azimuth < 310, 'avond west ' + a.azimuth); }
// hoogte
near(K.heightFromAngle(20, 45, 1.5), 21.5, 1e-9, 'boom 45'); near(K.heightFromAngle(10, 30, 1.6), 7.37, 0.01, 'boom 30'); eq(K.heightFromAngle(10, -5, 1.5), 11.5 - 10 + 0 + 0 || 1.5); near(K.slopePercent(45), 100, 1e-9, 'helling'); near(K.slopePercent(5.71), 10, 0.05, '10%');
near(K.altitudeFromPressure(1013.25), 0, 1e-9, 'zeeniveau'); near(K.altitudeFromPressure(899), 1000, 12, '1000 m'); near(K.pressureAtAltitude(0), 1013.25, 1e-9, 'p0'); near(K.altitudeFromPressure(K.pressureAtAltitude(250)), 250, 1e-6, 'rond'); ok(K.pressureWord(995).includes('laag') && K.pressureWord(1040).includes('zeer'), 'woord');
// schatcodes
for (let i = 0; i < 300; i++) { const lat = Math.random() * 180 - 90, lon = Math.random() * 360 - 180, c = K.encodeSpot(lat, lon); ok(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(c), 'formaat ' + c); const d = K.decodeSpot(c); ok(d && Math.abs(d.lat - lat) < 6e-6 && Math.abs(d.lon - lon) < 6e-6, 'decode ' + c); ok(K.decodeSpot(c.toLowerCase().replace(/-/g, ' ')), 'losse notatie'); }
{ const c = K.encodeSpot(52.3702, 4.8952); const bad = c.slice(0, 5) + (c[5] === '0' ? '1' : '0') + c.slice(6); eq(K.decodeSpot(bad), null, 'checksum'); eq(K.decodeSpot('kort'), null); eq(K.decodeSpot(''), null); }
// schatzoek
for (const L of [1, 2, 3]) for (let i = 0; i < 100; i++) { const t = K.makeTreasure({ lat: 52, lon: 5 }, L), lv = K.HUNT_LEVELS[L - 1]; ok(t.dist >= lv.min && t.dist <= lv.max, 'afstand schat'); near(K.distance(52, 5, t.lat, t.lon), t.dist, 0.5, 'schat afstand klopt'); }
eq(K.hotCold(1000, 1000).text, 'IJskoud'); eq(K.hotCold(800, 1000).text, 'Koud'); eq(K.hotCold(600, 1000).text, 'Lauw'); eq(K.hotCold(300, 1000).text, 'Warm'); eq(K.hotCold(100, 1000).text, 'Heet'); eq(K.hotCold(15, 1000).text, 'Kokend heet!'); eq(K.hotCold(25, 100).id, 3);
eq(K.foundRadius(5), 10); eq(K.foundRadius(20), 24); eq(K.foundRadius(100), 30); eq(K.foundRadius(undefined), 12); eq(K.huntReward(2, 3), 33);
{ const t = { lat: 52.001, lon: 5 }; ok(/110 meter naar het noord/.test(K.clueText(t, { lat: 52, lon: 5 })), K.clueText(t, { lat: 52, lon: 5 })); }
// virtueel lopen
{ let p = { lat: K.VIRTUAL_START.lat, lon: K.VIRTUAL_START.lon, acc: 5 }; const t = K.destination(p.lat, p.lon, 90, 100); for (let i = 0; i < 10; i++) p = K.stepVirtual(p, 90, 10); near(K.distance(p.lat, p.lon, t.lat, t.lon), 0, 0.5, '10 stappen oost'); eq(p.acc, 5); }
// quiz
{ for (let L = 1; L <= 2; L++) for (let i = 0; i < 300; i++) { const q = K.makeDirQuestion(L); ok(q.choices.length === 4 && new Set(q.choices).size === 4 && q.choices.includes(q.answer), JSON.stringify(q)); if (L === 1) ok(!/Noordoost|Zuidoost|Zuidwest|Noordwest/.test(q.q), 'niveau 1 hoofdwindstreken ' + q.q); }
  const r = () => 0; const q0 = K.makeDirQuestion(1, r); ok(q0.answer === 'Zuid' && /tegenover Noord/.test(q0.q), JSON.stringify(q0)); }
// vasthouden
{ const st = {}; eq(K.holdProgress(st, 80, 90, 1000), 0); ok(K.holdProgress(st, 88, 90, 1900) > 0.4, 'start'); eq(K.holdProgress(st, 88, 90, 3000), 1); eq(K.holdProgress(st, 200, 90, 3100), 0); eq(st.since, 0); }
console.log(`test-kompas: ${n} controles OK`);
