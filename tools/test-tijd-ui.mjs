// Rooktest van de Tijd-schermen met een minimale nep-DOM. Gebruik: node tools/test-tijd-ui.mjs
import assert from 'node:assert/strict';
import { install, El, click } from './_minidom.mjs';
const { body, T, store } = install();
const view = new El('div'); view.id = 'view'; body.appendChild(view);
const cleanups = []; const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const M = await import('../docs/tijd.js');
assert.equal(M.fmt(65000), '01:05'); assert.ok(M.nextAlarmTime({ time: '07:00', days: [] }, new Date()) instanceof Date);
let n = 0; const ok = (c, m) => { n++; assert.ok(c, m); };
const q = (s) => view.querySelector(s), qa = (s) => view.querySelectorAll(s), text = () => view.textContent;
const wait = () => new Promise((r) => T.realST(r, 25));
M.tijdView({ view, esc, uid: 't1', db: null, addCleanup: (f) => cleanups.push(f) });
await wait(); T.advance(200);
ok(q('[data-clockhost]') && text().includes('Week'), 'klok-tab'); ok(qa('.tu-tab').length === 11, '11 tabs'); ok(q('[data-gear]'), 'gear');
const tab = async (k) => { click(q(`[data-tab="${k}"]`)); await wait(); T.advance(100); };

// wekker
await tab('wekker'); ok(text().includes('Nieuwe wekker'), 'wekker');
click(q('#w-add')); ok(JSON.parse(store.get('tijd:t1:wekkers')).length === 1, 'wekker opgeslagen');
click(q('[data-snd="bel"]')); ok(JSON.parse(store.get('tijd:t1:geluid')) === 'bel', 'geluid');
click(q('[data-tg]')); ok(JSON.parse(store.get('tijd:t1:wekkers'))[0].on === false, 'uit'); click(q('[data-rm]')); ok(JSON.parse(store.get('tijd:t1:wekkers')).length === 0, 'weg');
// kookwekker
await tab('kook'); ok(qa('[data-q]').length >= 14, 'presets'); click(qa('[data-qn]').find((b) => b.attrs['data-qn'] === 'Ei zacht')); ok(text().includes('Ei zacht') && text().includes('04:00'), 'timer gestart');
T.advance(5 * 60 * 1000, 500); ok(text().includes('Klaar'), 'timer klaar');
// stopwatch
await tab('stop'); click(q('#s-go')); T.advance(1500, 100); click(q('#s-lap')); ok(text().includes('Ronde 1'), 'ronde'); click(q('#s-go'));
// focus
await tab('focus'); click(q('#f-go')); T.advance(25 * 60000 + 2000, 1000); ok(JSON.parse(store.get('tijd:t1:focus-teller')).n === 1 && text().includes('Korte pauze'), 'focus ronde'); ok(text().includes('Laatste 7 dagen'), 'week');
// interval
await tab('interval'); ok(text().includes('Tabata'), 'interval'); click(q('[data-pre="tabata"]')); click(q('[data-go]')); T.advance(12000, 200); ok(text().includes('Doe!') && text().includes('Ronde 1 van 8'), 'interval loopt: ' + text().slice(0, 100));
T.advance(300000, 500); ok(text().includes('Klaar!'), 'interval klaar'); click(q('[data-again]'));
// beurtklok
await tab('beurt'); click(q('[data-m="1"]')); click(q('[data-go]')); click(q('[data-p="0"]')); T.advance(2000, 100); ok(text().includes('Jouw beurt'), 'beurt'); click(q('[data-p="1"]')); T.advance(70000, 1000); ok(text().includes('Tijd is om'), 'tijd om');
// wereld
await tab('wereld'); ok(q('[data-globe]') && qa('[data-city]').length === 4, 'steden'); T.frames(3);
click(q('[data-city="tok"]')); const add = q('[data-add]'); add.value = 'syd'; click(q('[data-addb]'));
click(q('[data-addb]')); const sl = q('[data-off]'); sl.value = '120'; sl.oninput(); ok(text().includes('+2 u'), 'verschuiven');
click(q('[data-rm]')); ok(JSON.parse(store.get('tijd:t1:wereld-steden')).length >= 2, 'stad weg');
click(q('[data-sec="reken"]')); ok(q('[data-out]').textContent.includes('is'), 'reken'); click(q('[data-sw]'));
click(q('[data-sec="plan"]')); ok(text().includes('Wanneer kan iedereen bellen'), 'plan'); click(q('[data-ch="lon"]'));
click(q('[data-sec="quiz"]')); for (let i = 0; i < 8; i++) { click(qa('[data-o]')[0]); T.advance(2000, 100); } ok(text().includes('van 8 goed'), 'quiz klaar');
// aftellen
await tab('aftellen'); ok(qa('[data-ev]').length === 2, 'standaard events'); T.advance(1000, 250); ok(/dagen|dag/.test(q('[data-big]').textContent), 'telt af');
click(q('[data-pre="koningsdag"]')); ok(qa('[data-ev]').length === 3, 'preset'); q('[data-n]').value = 'Vakantie'; q('[data-d]').value = '2030-07-01'; click(q('[data-add]')); ok(qa('[data-ev]').length === 4, 'eigen event'); ok(JSON.parse(store.get('tijd:t1:aftellen')).length === 4, 'bewaard');
q('[data-n]').value = ''; click(q('[data-add]')); ok(text().includes('naam'), 'validatie');
click(q('[data-rm]')); ok(qa('[data-ev]').length === 3, 'weg');
// leren
await tab('leren'); ok(qa('[data-lv]').length === 5, 'niveaus');
click(q('[data-lv="1"]'));
for (let i = 0; i < 10; i++) { if (q('[data-chk]')) click(q('[data-chk]')); else click(qa('[data-c]')[0]); T.advance(2200, 100); }
ok(text().includes('Ronde klaar'), 'ronde klaar'); click(q('[data-menu]')); ok(JSON.parse(store.get('tijd:t1:klok-leren')).total === 10, 'klok-stats');
// globe-wiskunde
{ const W = await import('../docs/tijd-world.js'); for (const [lo, la] of [[4.9, 52.37], [139.7, 35.68], [-74, 40.7], [18.4, -33.9]]) { const p = W.project(lo, la, lo, la); ok(Math.abs(p.x) < 1e-9 && Math.abs(p.y) < 1e-9 && Math.abs(p.z - 1) < 1e-9, 'midden'); }
  const back = W.unproject(...(({ x, y }) => [x, y])(W.project(10, 40, 0, 20)), 0, 20); ok(Math.abs(back.lon - 10) < 1e-6 && Math.abs(back.lat - 40) < 1e-6, 'unproject'); ok(W.project(180, 0, 0, 0).z < 0 && W.unproject(1.1, 0, 0, 0) === null, 'achterkant');
  ok(W.LAND.length >= 15 && W.LAND.every((poly) => poly.length >= 4 && poly.every(([lo, la]) => Math.abs(lo) <= 180 && Math.abs(la) <= 90)), 'land'); }
// terug naar klok zonder fouten, opruimen
await tab('nu'); ok(T.errors.length === 0, 'geen fouten in timers');
cleanups.forEach((f) => f());
console.log(`test-tijd-ui: ${n} controles OK`); process.exit(0);
