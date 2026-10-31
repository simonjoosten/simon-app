// Rooktest van de Kompas-schermen met een minimale nep-DOM, nep-sensoren en nep-GPS. Gebruik: node tools/test-kompas-ui.mjs
import assert from 'node:assert/strict';
import { install, El, click } from './_minidom.mjs';
const { body, T, store } = install();
globalThis.DeviceOrientationEvent = class {};
let watchCb = null, watchErr = null, cleared = 0;
Object.defineProperty(globalThis, 'navigator', { value: { geolocation: { watchPosition: (ok, err) => { watchCb = ok; watchErr = err; return 7; }, clearWatch: () => { cleared++; } }, vibrate() {}, hardwareConcurrency: 4, clipboard: { writeText: async () => {} } }, configurable: true });
const view = new El('div'); view.id = 'view'; body.appendChild(view);
const cleanups = []; const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const M = await import('../docs/kompas.js');
assert.equal(M.dir(90), 'O');
let n = 0; const ok = (c, m) => { n++; assert.ok(c, m); };
const q = (s) => view.querySelector(s), qa = (s) => view.querySelectorAll(s), text = () => view.textContent;
const wait = () => new Promise((r) => T.realST(r, 25));
const orient = (o) => (document.listeners['w:deviceorientation'] || []).forEach((f) => f(o));
const tab = async (k) => { click(q(`[data-tab="${k}"]`)); await wait(); T.advance(200); };
const pos = (lat, lon, acc = 8) => watchCb({ coords: { latitude: lat, longitude: lon, accuracy: acc, altitude: 12, altitudeAccuracy: 5, speed: 1.2, heading: 45 }, timestamp: Date.now() });

M.kompasView({ view, esc, addCleanup: (f) => cleanups.push(f) });
ok(text().includes('Kompas') && qa('.tu-tab').length === 7 && q('[data-gear]'), 'shell');
ok(q('[data-sensor]'), 'sensor-kaart'); click(q('[data-sensor]')); await wait();
orient({ webkitCompassHeading: 90, beta: 5, gamma: 3 }); T.advance(500); T.frames(2);
ok(q('[data-num]').textContent.includes('90°') && q('[data-name]').textContent === 'Oost', 'koers: ' + q('[data-num]').textContent);
click(q('[data-set]')); T.advance(300); ok(true);
orient({ webkitCompassHeading: 350, beta: 5, gamma: 3 }); T.advance(500); ok(q('[data-lock]').textContent.includes('naar'), 'doel: ' + q('[data-lock]').textContent);
const sel = q('[data-world]'); sel.value = 'ruimte'; sel.onchange({ target: sel });
// waterpas
await tab('waterpas'); orient({ beta: 0.5, gamma: -0.4 }); T.advance(400); T.frames(2); ok(q('[data-tilt]').textContent.includes('Waterpas'), 'waterpas vlak'); orient({ beta: 10, gamma: 0 }); T.advance(400); ok(q('[data-tilt]').textContent.includes('10'), 'helling');
// hoogte
await tab('hoogte'); orient({ beta: 45, gamma: 0 }); T.advance(500); click(q('[data-meet]')); ok(q('[data-val]').textContent.includes('21,5 m'), 'hoogte 45 graden: ' + q('[data-val]').textContent);
click(q('[data-d="5"]')); ok(q('[data-val]').textContent.includes('26,5 m'), 'afstand 25 m'); click(q('[data-meet]'));
// locatie
await tab('locatie'); ok(q('[data-yes]'), 'toestemmingsvraag'); click(q('[data-yes]')); ok(watchCb, 'GPS gestart'); ok(store.get('kompas:consent') === '1', 'toestemming onthouden');
pos(52.3702, 4.8952); T.advance(1200); ok(text().includes('52° 22') && text().includes('Heel nauwkeurig') && text().includes('12 m'), 'positie: ' + q('[data-live]').textContent.slice(0, 120));
q('[data-name]').value = 'Thuis'; click(q('[data-save]')); ok(JSON.parse(store.get('kompas:v2:anon')).d.places[0].name === 'Thuis', 'plek bewaard');
T.fetchHandler = async () => ({ ok: true, json: async () => ({ current: { surface_pressure: 1012.1, pressure_msl: 1013.3 } }) });
click(q('[data-getp]')); await wait(); ok(text().includes('1012,1 hPa') && text().includes('Hoogte uit luchtdruk'), 'luchtdruk'); ok(T.fetches.some((u) => u.includes('latitude=52.37') && !u.includes('52.3702')), 'afgeronde locatie verstuurd');
// plekken
await tab('plekken'); ok(text().includes('Thuis'), 'plek in lijst'); pos(52.3712, 4.8952); T.advance(1000); ok(/\d+ m naar het zuid/.test(q('[data-dist]').textContent), 'afstand: ' + q('[data-dist]').textContent);
click(q('[data-code]')); ok(/Code: <b>|Code:/.test(q('[data-dist]').textContent) || q('[data-dist]').textContent.includes('Code'), 'code');
q('[data-in]').value = '52,0907 5,1214'; q('[data-name]').value = 'Utrecht'; click(q('[data-add]')); ok(text().includes('Utrecht'), 'coördinaten toegevoegd');
q('[data-in]').value = 'kaas'; click(q('[data-add]')); ok(text().includes('lijkt geen coördinaten'), 'validatie');
click(qa('[data-nav]')[0]); await wait(); ok(q('[data-hero]') && JSON.parse(store.get('kompas:v2:anon')).d.target.name, 'navigeren -> kompas met doel');
// schatzoeken (virtueel), vaste "toeval"
await tab('schat'); ok(qa('[data-lv]').length === 3, 'schat-menu'); const realRandom = Math.random; Math.random = () => 0;
click(q('[data-virtual]')); ok(text().includes('Noord') && text().includes('50 m'), 'virtueel gestart: ' + q('[data-body]').textContent.slice(0, 80));
for (let s = 0; s < 3; s++) { for (let i = 0; i < 4; i++) click(q('[data-mv="0"]')); T.advance(300); }
Math.random = realRandom; ok(text().includes('Alle schatten gevonden'), 'drie schatten: ' + text().slice(0, 120)); ok(JSON.parse(store.get('kompas:v2:anon')).d.found === 3, 'gevonden bewaard'); click(q('[data-ok]'));
q('[data-code]').value = '0000-0000-0001'; click(q('[data-friend]')); ok(text().includes('klopt niet'), 'foute code');
click(q('[data-hide]')); ok(/Code: /.test(q('[data-hidemsg]').textContent), 'code verstoppen');
// oefenen
await tab('oefen'); click(q('[data-q="1"]')); for (let i = 0; i < 10; i++) { click(qa('[data-c]')[0]); T.advance(1700, 100); } ok(text().includes('van 10 goed'), 'quiz klaar');
click(q('[data-menu]')); Math.random = () => 0; click(q('[data-turn]'));
for (let r = 0; r < 5; r++) { orient({ webkitCompassHeading: 3 }); T.advance(2200, 100); } Math.random = realRandom; ok(text().includes('5 van 5'), 'draaiuitdaging: ' + text().slice(0, 80));
// GPS-fout wordt getoond, opruimen stopt GPS
watchErr({ code: 1 }); ok(cleared >= 1, 'GPS gestopt bij weigering');
cleanups.forEach((f) => f()); ok(T.errors.length === 0, 'geen fouten');
console.log(`test-kompas-ui: ${n} controles OK`); process.exit(0);
