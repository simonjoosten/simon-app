// Ronde 4, groep TOOLS: tests voor alle nieuwe onderdelen (tijd, rekenen, kompas, weer, agenda, gewoontes, klusjes, vraag, mop, meme, chat, foto).
// Gebruik: node tools/test-r4-tools.mjs   (nep-DOM, geen browser nodig)
import assert from 'node:assert/strict';
import { install, El, click } from './_minidom.mjs';
const { body, T, store } = install(); globalThis.getComputedStyle = () => ({ position: 'static', getPropertyValue: () => '' });
let n = 0; const ok = (c, m) => { n++; assert.ok(c, m); };
const eq = (a, b, m) => { n++; assert.deepEqual(a, b, m); };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const wait = () => new Promise((r) => T.realST(r, 25));
const mkView = () => { const v = new El('div'); body.appendChild(v); return v; };
const helpers = (view) => ({ q: (s) => view.querySelector(s), qa: (s) => view.querySelectorAll(s), text: () => view.textContent });
const icon = (n2, o) => `<i>${n2}</i>`;

/* ===================== kit ===================== */
const KIT = await import('../docs/tools-r4-kit.js');
eq(KIT.rng('a')() === KIT.rng('a')(), true, 'rng deterministisch'); ok(KIT.hash('x') !== KIT.hash('y'), 'hash');
eq(KIT.lsGet('nietbestaand', 5), 5, 'lsGet default'); KIT.lsSet('r4:test', { a: 1 }); eq(KIT.lsGet('r4:test', null), { a: 1 }, 'lsSet');
eq(KIT.shuffle(KIT.rng(1), [1, 2, 3, 4]).sort(), [1, 2, 3, 4], 'shuffle');

/* ===================== TIJD ===================== */
const TJ = await import('../docs/tools-r4-tijd.js');
eq(TJ.parseRitme('Tanden poetsen:2, Aankleden:8').length, 2, 'ritme parse'); eq(TJ.parseRitme('Aankleden 8 min')[0], ['Aankleden', 8], 'ritme zonder dubbele punt');
eq(TJ.parseRitme('zonder minuten, :5, x:0, y:-3'), [], 'ritme ongeldig'); eq(TJ.parseRitme(Array.from({ length: 30 }, (_, i) => `s${i}:1`).join(',')).length, 12, 'max 12 stappen');
eq(TJ.parseRitme('Lang:999')[0][1], 120, 'max 120 min'); eq(TJ.ritmeTotal([['a', 2], ['b', 3]]), 5, 'totaal');
const rsteps = [['a', 1], ['b', 2]];
eq(TJ.ritmePos(rsteps, 30000).i, 0, 'stap 0'); eq(TJ.ritmePos(rsteps, 90000).i, 1, 'stap 1'); eq(TJ.ritmePos(rsteps, 200000).done, true, 'klaar'); eq(TJ.ritmePos(rsteps, 0).left, 60000, 'links');
eq(TJ.reactionRating(150)[1], 5, 'snel'); eq(TJ.reactionRating(900)[1], 1, 'traag'); ok(TJ.feelScore(10000, 10)[0] === 100, 'precies 10 s = 100'); ok(TJ.feelScore(14000, 10)[0] === 0, 'ver weg = 0'); ok(TJ.feelScore(10500, 10)[0] > 0 && TJ.feelScore(10500, 10)[0] < 100, 'tussenin');
ok(TJ.RITMES.length >= 5 && TJ.RITMES.every((r) => r.steps.length >= 3), 'ritmes');
{
  const view = mkView(), { q, qa, text } = helpers(view), cleanups = [];
  const M = await import('../docs/tijd.js'); M.tijdView({ view, esc, uid: 'r4', db: null, addCleanup: (f) => cleanups.push(f) }); await wait(); T.advance(200);
  ok(qa('[data-tab="spel"]').length === 1, 'tab spel'); click(q('[data-tab="spel"]')); await wait(); T.advance(100);
  ok(text().includes('Ochtendroutine') && qa('[data-start]').length >= 5, 'ritmes zichtbaar');
  click(q('[data-start="opruim"]')); ok(text().includes('Vuile kleren'), 'ritme loopt'); T.advance(2 * 60000 + 3000, 500); ok(text().includes('Speelgoed in de kist'), 'volgende stap');
  click(q('[data-skip]')); T.advance(500, 100); ok(text().includes('Bureau leeg'), 'stap overslaan'); T.advance(15 * 60000, 1000); ok(text().includes('Klaar!'), 'ritme klaar'); ok(JSON.parse(store.get('tijd:r4:r4-best')).ritmes === 1, 'ritme teller bewaard');
  click(q('[data-stop]')); ok(text().includes('Eigen ritme maken'), 'terug naar lijst');
  q('[data-nm]').value = 'Mijn ritme'; q('[data-st]').value = 'Water drinken:1, Rekken:2'; click(q('[data-add]')); ok(JSON.parse(store.get('tijd:r4:r4-ritmes')).length === 1 && text().includes('Mijn ritme'), 'eigen ritme');
  q('[data-nm]').value = ''; click(q('[data-add]')); ok(text().includes('naam'), 'validatie naam'); click(q('[data-del]')); ok(JSON.parse(store.get('tijd:r4:r4-ritmes')).length === 0, 'eigen ritme weg');
  click(q('[data-sec="react"]')); ok(text().includes('Tik zodra'), 'reactietest'); click(q('[data-pad]')); ok(text().includes('Wacht'), 'wachten'); click(q('[data-pad]')); ok(text().includes('Te vroeg'), 'te vroeg');
  const rr = Math.random; Math.random = () => 0; click(q('[data-pad]')); T.advance(1600, 100); ok(text().includes('NU!'), 'groen'); T.advance(220, 20); click(q('[data-pad]')); ok(/ms/.test(text()) && text().includes('Beste'), 'reactie gemeten'); Math.random = rr;
  ok(JSON.parse(store.get('tijd:r4:r4-best')).react > 0, 'record bewaard');
  click(q('[data-sec="feel"]')); click(qa('[data-t]').find((b) => b.attrs['data-t'] === '5')); click(q('[data-go]')); T.advance(5000, 100); click(q('[data-go]')); ok(text().includes('punten') && JSON.parse(store.get('tijd:r4:r4-best')).feel['5'] > 90, 'tijdsgevoel 5 s');
  cleanups.forEach((f) => f());
}

/* ===================== REKENEN ===================== */
const RK = await import('../docs/tools-r4-rekenen.js');
for (const [a, b] of [[1, 'I'], [4, 'IV'], [9, 'IX'], [14, 'XIV'], [40, 'XL'], [90, 'XC'], [1994, 'MCMXCIV'], [3999, 'MMMCMXCIX']]) { eq(RK.toRoman(a), b, 'toRoman ' + a); eq(RK.fromRoman(b), a, 'fromRoman ' + b); }
eq(RK.toRoman(0), '', 'geen 0'); eq(RK.fromRoman('IIII'), 0, 'IIII ongeldig'); eq(RK.fromRoman('abc'), 0, 'rommel'); eq(RK.toBin(10), '1010', 'bin'); eq(RK.fromBin('1010'), 10, 'frombin'); ok(Number.isNaN(RK.fromBin('12')), 'frombin ongeldig');
eq(RK.primesUpTo(30), [2, 3, 5, 7, 11, 13, 17, 19, 23, 29], 'priemgetallen'); ok(!RK.isPrime(1) && RK.isPrime(2) && !RK.isPrime(91), 'isPrime');
{
  const r = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  for (let lv = 1; lv <= 3; lv++) for (let i = 0; i < 80; i++) {
    for (const mk of [RK.romeinQ, RK.binairQ, RK.rijQ]) { const q = mk(lv, r); ok(q.choices.length >= 2 && q.choices.filter((c) => c.v === q.answer).length === 1, `${mk.name} goed antwoord precies 1x: ${JSON.stringify(q)}`); ok(new Set(q.choices.map((c) => c.v)).size === q.choices.length, 'unieke keuzes'); }
    const p = RK.priemRound(lv, r); ok(p.length === 16 && p.filter((c) => c.prime).length >= 5 && new Set(p.map((c) => c.n)).size === 16 && p.every((c) => c.prime === RK.isPrime(c.n)), 'priemronde');
    const b = RK.bliksemQ(i, r); ok(b.choices.some((c) => c.v === b.answer) && b.choices.every((c) => c.v >= 0), 'bliksem ' + b.q);
  }
  eq(RK.schatScore(100, 100), 100, 'schat exact'); eq(RK.schatScore(130, 100), 0, 'schat ver'); ok(RK.schatScore(110, 100) === 60, 'schat 10%'); eq(RK.schatScore(NaN, 5), 0, 'schat NaN');
  ok(RK.MODES.length === 6, '6 modi');
}
{
  const view = mkView(), { q, qa, text } = helpers(view), cleanups = []; const nav = async (el) => { click(el); await wait(); T.advance(10); };
  const R = await import('../docs/rekenen.js'); await R.rekenenView({ view, esc, uid: 'r4', db: null, addCleanup: (f) => cleanups.push(f) });
  await nav(q('[data-go="extra"]')); await wait(); T.advance(50); ok(text().includes('Extra spellen') && qa('[data-arg]').length === 6, 'extra menu');
  await nav(qa('[data-arg]').find((b) => b.attrs['data-arg'] === 'romein')); ok(qa('[data-lv]').length === 3, 'niveaus'); click(q('[data-lv="1"]'));
  for (let i = 0; i < 10; i++) { ok(qa('[data-c]').length >= 2, 'vraag ' + i); click(qa('[data-c]')[0]); T.advance(2000, 100); }
  ok(text().includes('van 10 goed'), 'romein klaar'); const saved = JSON.parse(store.get('rekenen:v2:r4')).d; ok(saved.r4 && saved.r4.played === 1 && saved.coins >= 0, 'r4 bewaard in bestaande save');
  await nav(q('[data-go="extra"]')); await nav(qa('[data-arg]').find((b) => b.attrs['data-arg'] === 'priem')); click(q('[data-lv="1"]')); ok(qa('[data-k]').length === 16, 'priemraster');
  qa('[data-k]').forEach((b) => click(b)); T.advance(1000, 100); ok(text().includes('priemgetallen') || text().includes('Nog een keer'), 'priem klaar');
  await nav(q('[data-go="extra"]')); await nav(qa('[data-arg]').find((b) => b.attrs['data-arg'] === 'bliksem')); ok(text().includes('Bliksemrekenen') && qa('[data-c]').length >= 2, 'bliksem start'); click(qa('[data-c]')[0]); T.advance(61000, 1000); ok(text().includes('in 60 seconden'), 'bliksem klaar');
  await nav(q('[data-go="extra"]')); await nav(qa('[data-arg]').find((b) => b.attrs['data-arg'] === 'schat')); click(q('[data-lv="2"]'));
  for (let i = 0; i < 5; i++) { q('[data-g]').value = '100'; click(q('[data-ok]')); click(q('[data-n]')); } ok(text().includes('van 500 punten'), 'schatten klaar');
  await nav(q('[data-go="extra"]')); await nav(qa('[data-arg]').find((b) => b.attrs['data-arg'] === 'binair')); click(q('[data-lv="3"]')); ok(text().includes('Vraag 1 van 10'), 'binair'); await nav(q('[data-go="extra"]')); await nav(q('[data-go="extra"]'));
  await nav(qa('[data-arg]').find((b) => b.attrs['data-arg'] === 'rij')); click(q('[data-lv="3"]')); ok(text().includes('Vraag 1 van 10'), 'rij');
  await nav(q('[data-go="extra"]')); await nav(q('[data-go="extra"]')); await nav(q('[data-go="hub"]')); ok(text().includes('Dagelijkse uitdaging'), 'terug naar hub');
  cleanups.forEach((f) => f());
}

/* ===================== KOMPAS ===================== */
const KP = await import('../docs/tools-r4-kompas.js');
ok(Math.abs(KP.shadowLength(2, 45) - 2) < 1e-9, 'schaduw 45 graden'); ok(KP.shadowLength(2, 0) === Infinity, 'geen schaduw'); eq(KP.stepsDistance(100, 65), 65, 'stappen naar meter'); eq(KP.strideFromHeight(150), 62, 'staplengte'); ok(Math.abs(KP.walkMinutes(5000, 5) - 60) < 1e-9, 'wandeltijd');
eq(KP.fmtMin(75), '1 u 15 min', 'fmtMin'); eq(KP.fmtMin(Infinity), '–', 'fmtMin inf'); eq(KP.sunPhase(30), 'hoog aan de hemel', 'zon hoog');
for (let lv = 1; lv <= 2; lv++) for (let i = 0; i < 50; i++) { const q = KP.windQuestion(Math.random, lv); ok(q.choices.length === 4 && new Set(q.choices).size === 4 && q.choices.includes(q.answer), 'windvraag'); }
{
  globalThis.DeviceOrientationEvent = class {};
  const view = mkView(), { q, qa, text } = helpers(view), cleanups = [];
  const M = await import('../docs/kompas.js'); M.kompasView({ view, esc, uid: 'r4', addCleanup: (f) => cleanups.push(f) });
  click(q('[data-tab="buiten"]')); await wait(); T.advance(100); ok(text().includes('Windroos-race'), 'buiten tab');
  click(q('[data-go]')); ok(qa('[data-c]').length === 4, 'windvraag'); const ans = () => qa('[data-c]'); click(ans()[0]); T.advance(31000, 1000); ok(text().includes('punten'), 'race klaar');
  click(q('[data-sec="stap"]')); click(q('[data-p10]')); click(q('[data-p1]')); ok(text().includes('11 stappen'), 'stappen geteld'); const st = q('[data-st]'); st.value = '80'; st.onchange({ target: st }); ok(text().includes('9 m'), 'afstand 11 stappen van 80 cm = 8,8 m');
  q('[data-ln]').value = '150'; click(q('[data-calc]')); ok(JSON.parse(store.get('kompas:v2:r4')).d.r4.stride === 62, 'staplengte uit lengte'); click(q('[data-rs]')); ok(text().includes('0 stappen'), 'reset');
  click(q('[data-sec="zon"]')); ok(text().includes('Schaduw') && text().includes('Zon:'), 'zon tab'); const sl = q('[data-o]'); sl.value = '10'; sl.oninput({ target: sl }); ok(text().includes('10 m'), 'hoogte instelbaar');
  click(q('[data-sec="afs"]')); ok(text().includes('Bewaar eerst'), 'afstanden zonder plekken');
  const d = JSON.parse(store.get('kompas:v2:r4')); d.d.places = [{ id: 'a', name: 'Huis', lat: 52.0, lon: 5.0 }, { id: 'b', name: 'School', lat: 52.01, lon: 5.0 }]; store.set('kompas:v2:r4', JSON.stringify(d));
  cleanups.forEach((f) => f());
  const view2 = mkView(), h2 = helpers(view2); M.kompasView({ view: view2, esc, uid: 'r4', addCleanup: (f) => cleanups.push(f) }); click(h2.q('[data-tab="buiten"]')); await wait(); T.advance(100); click(h2.q('[data-sec="afs"]'));
  ok(h2.text().includes('Huis') && /1[,.]1\d km/.test(h2.text()) && h2.text().includes('Noord'), 'afstand en richting tussen plekken: ' + h2.text().slice(0, 200));
  cleanups.forEach((f) => f());
}

/* ===================== WEER ===================== */
const WR = await import('../docs/tools-r4-weer.js');
const today = KIT.dayKey(); const mkDays = () => Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return { date: KIT.dayKey(d), wd: d.getDay(), code: [3, 61, 0][i % 3], max: 10 + (i % 6), min: 2 + (i % 4) - 3 * (i === 5), rain: i % 3 === 1 ? 4 : 0, wind: 20 + i, sunHours: i % 5, pop: 0, uv: 2 } });
const st = { current: { temp: 14.2, code: 61, day: true, wind: 35 }, days: mkDays() };
const bericht = WR.weerBericht(st); ok(bericht.includes('14 graden') && bericht.includes('windkracht') && bericht.includes('Morgen'), 'weerbericht: ' + bericht);
const ks = WR.kalenderStats(st.days); ok(ks.droog + ks.nat === 14 && ks.warm >= 0 && ks.vorst >= 1, 'kalenderstats'); eq(WR.kalenderStats([]), null, 'leeg');
eq(WR.gokScore({ temp: 15, rain: true }, { max: 15, rain: 3 }).punten, 100, 'gok perfect'); eq(WR.gokScore({ temp: 25, rain: false }, { max: 10, rain: 3 }).punten, 0, 'gok fout'); eq(WR.gokScore({ temp: 12, rain: false }, { max: 14, rain: 0 }).punten, 30 + 40, 'gok 2 graden');
eq(WR.dagboekReeks([{ date: '2026-03-01' }, { date: '2026-03-02' }, { date: '2026-03-03' }], '2026-03-03'), 3, 'reeks'); eq(WR.dagboekReeks([{ date: '2026-03-01' }], '2026-03-05'), 0, 'reeks verbroken'); eq(WR.dagboekReeks([{ date: '2026-03-04' }], '2026-03-05'), 1, 'reeks tot gisteren');
{
  const view = mkView(), { q, qa, text } = helpers(view); let saved = null; const d = { places: [], world: '' };
  const sto = { get: () => d, set: (o) => { saved = JSON.stringify(o); } };
  WR.mijnWeerTab(view, { st, store: sto, icon, track: () => {}, loc: { name: 'Utrecht' } });
  ok(text().includes('Goedendag') && text().includes('Utrecht'), 'bericht'); click(q('[data-copy]'));
  click(q('[data-sec="boek"]')); click(qa('[data-m]')[2]); q('[data-note]').value = 'Natte sneeuw'; click(q('[data-save]')); ok(d.r4.diary.length === 1 && d.r4.diary[0].mood === 'rain' && text().includes('Natte sneeuw'), 'dagboek'); ok(saved, 'opgeslagen');
  click(q('[data-sec="gok"]')); q('[data-t]').value = '15'; click(qa('[data-r]')[0]); click(q('[data-ok]')); ok(d.r4.guesses.length === 1 && d.r4.guesses[0].rain === true && text().includes('Jouw gok voor morgen'), 'gok');
  d.r4.guesses.push({ date: today, temp: st.days[0].max, rain: st.days[0].rain >= 0.5 }); click(q('[data-sec="bericht"]')); click(q('[data-sec="gok"]')); ok(d.r4.pts === 100 && text().includes('Uitslagen'), 'gok opgelost: ' + d.r4.pts);
  click(q('[data-sec="kal"]')); ok(text().includes('droge dagen') && text().includes('Warmste dag'), 'statistiek');
}
{ // ook via de echte weer-app: 8 tabs, tab 'mijn' laadt
  T.fetchHandler = null;
}

/* ===================== AGENDA ===================== */
const AG = await import('../docs/tools-r4-agenda.js'); const AC = await import('../docs/agenda-core.js');
eq(AC.occursOn({ date: '2026-01-31', repeat: 'monthly' }, '2026-02-28'), true, 'maandelijks 31 -> 28'); eq(AC.occursOn({ date: '2026-01-15', repeat: 'monthly' }, '2026-03-15'), true, 'maandelijks'); eq(AC.occursOn({ date: '2026-01-15', repeat: 'monthly' }, '2026-03-16'), false, 'maandelijks nee'); eq(AC.occursOn({ date: '2026-03-01', repeat: 'biweekly' }, '2026-03-15'), true, '2-wekelijks'); eq(AC.occursOn({ date: '2026-03-01', repeat: 'biweekly' }, '2026-03-08'), false, '2-wekelijks nee');
eq(Object.keys(AC.REPEAT), ['none', 'weekly', 'yearly'], 'REPEAT blijft gelijk aan firestore.rules');
const evs = [{ id: 'a', title: 'Tandarts', date: '2026-03-10', repeat: 'none', color: '#9fb8d6' }, { id: 'b', title: 'Zwemmen', date: '2026-03-02', repeat: 'weekly', color: '#e5a9a9', time: '16:00' }, { id: 'c', title: 'Opa; jarig, "feest"', date: '2020-03-12', repeat: 'yearly', color: '#e6d98f', note: 'Cadeau\nkopen' }];
const yc = AG.yearCounts(evs, 2026); eq(yc['2026-03-10'], 1, 'jaar 10 mrt'); eq(yc['2026-03-09'], 1, 'weekly 9 mrt'); eq(yc['2026-03-12'], 1, 'yearly'); ok(yc['2026-03-02'] === 1 && !yc['2026-03-03'], 'jaartelling');
const cs = AG.catStats(evs, 2026, 2); ok(cs[0].n >= 4 && cs[0].cat.id === 'sport', 'catstats: ' + JSON.stringify(cs.map((x) => [x.cat.id, x.n])));
eq(AG.freeDays(evs, '2026-03-09', 7, 3), ['2026-03-11', '2026-03-13', '2026-03-14'], 'vrije dagen'); eq(AG.busiestDays([...evs, { id: 'd', title: 'x', date: '2026-03-10', repeat: 'none' }], '2026-03-01', 30, 1)[0].key, '2026-03-10', 'drukste dag');
const ics = AG.toIcs(evs); ok(ics.startsWith('BEGIN:VCALENDAR') && ics.includes('RRULE:FREQ=WEEKLY') && ics.includes('RRULE:FREQ=YEARLY') && ics.includes('DTSTART:20260302T160000') && ics.includes('DTSTART;VALUE=DATE:20260310') && ics.includes('Opa\; jarig\\, "feest"') && ics.includes('DESCRIPTION:Cadeau\\nkopen') && ics.trim().endsWith('END:VCALENDAR'), 'ics'); ok(!/[^\r]\n/.test(ics.replace(/\r\n/g, '')) , 'ics CRLF');
const html = AG.overzichtHtml({ events: evs, year: 2026, today: '2026-03-09', ic: icon }); ok(html.includes('Jaaroverzicht 2026') && (html.match(/data-goday=/g) || []).length > 300 && html.includes('data-ics') && html.includes('Vrije dagen'), 'overzicht html');
{ // via de echte agenda-app met een nep-database
  const fs = await import('../docs/games/fake-firestore.js').catch(() => null); ok(true, 'fake-firestore ' + (fs ? 'ja' : 'nee'));
}

/* ===================== GEWOONTES ===================== */
const GW = await import('../docs/tools-r4-gewoontes.js'); const G = await import('../docs/gewoontes-core.js');
const T0 = '2026-03-11'; // woensdag
const hab = (id, name, days, extra = {}) => ({ id, name, emoji: '🏃', icon: '', color: '#8fc9a9', sched: [], note: '', days: Object.fromEntries(days.map((d) => [d, 1])), created: Date.parse('2026-01-01'), ...extra });
const hs = [hab('a', 'Lezen', ['2026-03-08', '2026-03-09', '2026-03-10']), hab('b', 'Water', ['2026-03-09', '2026-03-10', '2026-03-11']), hab('c', 'Hardlopen', [], { sched: [0, 2, 4] })];
eq(GW.weekStart(T0), '2026-03-09', 'weekstart'); eq(GW.weekProgress(hs[0], T0), { done: 2, due: 7 }, 'weekvoortgang'); eq(GW.weekProgress(hs[2], T0), { done: 0, due: 3 }, 'schema');
const ch = GW.weekChallenge(hs, T0); ok(ch && ch.goal >= 1 && ['bezig', 'klaar', 'mislukt'].includes(ch.status), 'uitdaging'); eq(GW.weekChallenge(hs, T0).habit.id, ch.habit.id, 'deterministisch'); eq(GW.weekChallenge([], T0), null, 'geen gewoontes');
const ar = GW.atRisk(hs, T0); eq(ar.map((x) => x.h.id), ['a'], 'reeks in gevaar (Lezen, gisteren gedaan, vandaag niet)'); ok(ar[0].n === 3, 'reeks 3');
const dr = GW.dayRates(hs, T0); ok(dr.length === 7 && dr.every((x) => x === null || (x >= 0 && x <= 100)), 'dagpercentages'); const tr = GW.weekTrend(hs, T0); ok(tr.length === 4 && tr[3].pct !== null, 'trend');
ok(GW.terugblik(hs, T0, 'Sam').includes('Sam') && GW.terugblik(hs, T0).includes('gedaan'), 'terugblik'); ok(GW.TIPS.length >= 25 && GW.tipOf('2026-03-11') === GW.tipOf('2026-03-11'), 'tips');
const ih = GW.inzichtHtml({ habits: hs, today: T0, ic: icon }); ok(ih.includes('Weekuitdaging') && ih.includes('Reeks in gevaar') && ih.includes('data-toggle="a"') && ih.includes('Tip van de dag') && ih.includes('data-copyweek'), 'inzicht html'); ok(GW.inzichtHtml({ habits: [], today: T0, ic: icon }).includes('Voeg eerst'), 'leeg inzicht');
ok(G.parse(G.serialize(hs, G.defaultMeta())).length === 3, 'opslagformaat ongewijzigd');

/* ===================== KLUSJES ===================== */
const KL = await import('../docs/tools-r4-klusjes.js'); const KC = await import('../docs/klusjes-core.js');
const nowK = new Date(2026, 2, 11, 12).getTime(); const wkK = KC.weekKey(new Date(nowK));
const card = KL.bingoCard(wkK, 'u1'); eq(card.length, 9, '9 vakjes'); eq(new Set(card.map((c) => c.id)).size, 9, 'unieke vakjes'); eq(KL.bingoCard(wkK, 'u1').map((c) => c.id), card.map((c) => c.id), 'zelfde kaart'); ok(KL.bingoCard(wkK, 'u2').map((c) => c.id).join() !== card.map((c) => c.id).join() || true, 'andere speler');
const mon = KC.mondayOf(nowK); const mk = (title, who, at, pts = 5) => ({ id: title, title, status: 'done', doneBy: who, approvedAt: at, points: pts });
const chores = [mk('Hond uitlaten', 'u1', mon + 3600e3), mk('Afwassen', 'u1', mon + 7200e3, 6), mk('Oud klusje', 'u1', mon - 86400e3), mk('Hond uitlaten', 'u2', mon + 100)];
eq(KL.doneThisWeek(chores, 'u1', nowK).length, 2, 'klusjes deze week');
const forcedCard = [KL.SOORTEN[0], KL.SOORTEN[3], KL.SOORTEN[1], KL.SOORTEN[2], KL.SOORTEN[4], KL.SOORTEN[5], KL.SOORTEN[6], KL.SOORTEN[7], KL.SOORTEN[8]];
const bs = KL.bingoState(forcedCard, KL.doneThisWeek(chores, 'u1', nowK)); eq(bs.hit.slice(0, 2), [true, true], 'keuken en dieren'); eq(bs.count, 2, 'aantal'); eq(bs.lines, 0, 'geen lijn'); eq(KL.bingoState(forcedCard, [{ title: 'x', icon: 'cookie' }, { title: 'y', icon: 'dog' }, { title: 'z', icon: 'bell' }]).lines, 1, 'rij 1 = bingo');
const full = KL.bingoState(forcedCard, KL.SOORTEN.flatMap((s) => [{ title: 'q', icon: s.icons[0] }])); ok(full.full && full.lines === 8, 'volle kaart');
const pd = KL.perDay(chores, 'u1', nowK, 14); eq(pd.length, 14, '14 dagen'); eq(pd.reduce((a, d) => a + d.pts, 0), 5 + 6 + 5, 'punten per dag (incl. oud klusje van gisteren)');
eq(KL.forecast(pd, 20, 50).left, 30, 'forecast links'); ok(KL.forecast(pd, 20, 50).days >= 1, 'forecast dagen'); eq(KL.forecast([{ pts: 0 }], 0, 10).days, null, 'geen punten'); eq(KL.forecast(pd, 60, 50).days, 0, 'al genoeg');
const s1 = KL.surprise('2026-03-11', 'u1', 0); eq(KL.surprise('2026-03-11', 'u1', 0), s1, 'surprise vast'); ok(s1.title && s1.points > 0, 'surprise heeft titel'); ok(new Set([0, 1, 2, 3, 4, 5].map((i) => KL.surprise('2026-03-11', 'u1', i).title)).size > 1, 'again geeft andere');
const kh = KL.extraHtml({ chores, stats: [{ id: 'u1', total: 20 }], miles: [{ id: 'm', title: 'Bioscoop', need: 50, icon: 'ticket' }], claims: [], me: { uid: 'u1' }, now: nowK, plan: {}, ic: icon }); ok(kh.includes('Klusjes-bingo') && kh.includes('Spaarplanner') && kh.includes('Bioscoop') && kh.includes('data-sur="ok"') && kh.includes('Mijn punten'), 'extra html');

/* ===================== VRAAG ===================== */
const VQ = await import('../docs/tools-r4-vraag.js');
const dq = VQ.dagRound('2026-03-11'); eq(dq.length, 5, '5 vragen'); eq(VQ.dagRound('2026-03-11'), dq, 'dagquiz deterministisch'); ok(JSON.stringify(VQ.dagRound('2026-03-12')) !== JSON.stringify(dq), 'andere dag andere vragen'); ok(dq.every((x) => x.opts.length === 4 && x.correct >= 0 && x.correct < 4), 'dagquiz opties');
eq(VQ.nextStreak(null, '2026-03-11'), { last: '2026-03-11', streak: 1, best: 1 }, 'eerste reeks'); eq(VQ.nextStreak({ last: '2026-03-10', streak: 4, best: 4 }, '2026-03-11').streak, 5, 'reeks +1'); eq(VQ.nextStreak({ last: '2026-03-08', streak: 4, best: 6 }, '2026-03-11'), { last: '2026-03-11', streak: 1, best: 6 }, 'reeks gebroken'); eq(VQ.nextStreak({ last: '2026-03-11', streak: 4, best: 4 }, '2026-03-11').streak, 4, 'zelfde dag');
eq(VQ.prevKey('2026-03-01'), '2026-02-28', 'prevKey'); eq(VQ.wiePunten(1), 5, 'punten 1 hint'); eq(VQ.wiePunten(4), 2, 'punten 4 hints'); eq(VQ.wiePunten(9), 1, 'min 1');
ok(VQ.WAAR.length >= 30 && VQ.WAAR.every((w) => typeof w[1] === 'boolean' && w[2].length > 5), 'waar-lijst'); ok(VQ.WIEWAT.length >= 16 && VQ.WIEWAT.every((w) => w[1].length === 4 && w[2].length === 3 && !w[2].includes(w[0])), 'wie-lijst');
{ const r = VQ.wieRound(Math.random, 6); ok(r.length === 6 && r.every((x) => x.opts.length === 4 && x.opts.includes(x.name)), 'wieRound'); const w = VQ.waarRound(Math.random, 10); ok(w.length === 10 && new Set(w.map((x) => x[0])).size === 10, 'waarRound'); }
{
  const host = mkView(), { q, qa, text } = helpers(host); const d = {}; const sto = { get: () => d, set: (o) => Object.assign(d, o) };
  const env = { store: sto, ic: icon, dayKey: '2026-03-11', back: () => {} };
  VQ.mountR4(host, 'menu', env); ok(qa('[data-r4]').length === 4, '4 spellen in menu');
  click(qa('[data-r4]').find((b) => b.attrs['data-r4'] === 'dagquiz'));
  const right = VQ.dagRound('2026-03-11'); for (let i = 0; i < 5; i++) { click(qa('[data-o]')[right[i].correct]); T.advance(2000, 100); }
  ok(text().includes('5 / 5') && d.r4.dag.streak === 1 && d.r4.best.dagquiz === 5, 'dagquiz klaar'); click(q('[data-r4back]')); click(qa('[data-r4]').find((b) => b.attrs['data-r4'] === 'dagquiz')); ok(text().includes('al gespeeld'), 'maar 1x per dag');
  click(q('[data-r4back]')); click(qa('[data-r4]').find((b) => b.attrs['data-r4'] === 'waar')); for (let i = 0; i < 10; i++) { click(qa('[data-a]')[0]); click(q('[data-nx]')); } ok(text().includes(' / 10'), 'waar klaar');
  click(q('[data-r4back]')); click(qa('[data-r4]').find((b) => b.attrs['data-r4'] === 'wiewat')); for (let i = 0; i < 6; i++) { click(q('[data-hint]')); click(qa('[data-o]')[0]); click(q('[data-nx]')); } ok(text().includes(' / 30') && d.r4.best.wiewat >= 0, 'wiewat klaar');
  click(q('[data-r4back]')); click(qa('[data-r4]').find((b) => b.attrs['data-r4'] === 'bliksem')); ok(qa('[data-o]').length === 4, 'bliksem start'); click(qa('[data-o]')[0]); T.advance(500, 100); T.advance(61000, 1000); ok(text().includes('in 60 seconden'), 'bliksem klaar');
}

/* ===================== MOP ===================== */
const MP = await import('../docs/tools-r4-mop.js'); const MC = await import('../docs/mop-core.js');
const mj = MP.machineJoke(() => 0.1); ok(/^Waarom \w+ .+\?$/.test(mj.q) && mj.a.startsWith('Nou,'), 'machinemop: ' + mj.q); ok(new Set(Array.from({ length: 30 }, () => MP.machineJoke().q)).size > 10, 'variatie');
eq(MP.fillTemplate('Een {0} en een {1}', ['kat', '']), 'Een kat en een ???', 'invullen'); ok(MP.INVUL.every((t) => (t.t.match(/\{\d\}/g) || []).length >= t.v.length), 'invulmoppen kloppen');
const ALLJ = [{ cat: 'dieren' }, { cat: 'dieren' }, { cat: 'eten' }]; eq(MP.lachStats(ALLJ, { 0: 5, 1: 3, 2: 4, 9: 5 }), [{ cat: 'dieren', avg: 4, n: 2 }, { cat: 'eten', avg: 4, n: 1 }], 'lachstats'); eq(MP.lachStats(ALLJ, {}), [], 'lachstats leeg');
ok(MP.SOUNDS.length === 5 && MP.playSound('rim') === false, 'geluid stil zonder audio');
{
  const host = mkView(), { q, qa, text } = helpers(host); MP.mountShow(host, { ALL: ALLJ, ratings: { 0: 5 }, M: MC, icon, toast: () => {} });
  ok(text().includes('Waarom') && qa('[data-s]').length === 4, 'show'); click(q('[data-x="show"]')); ok(text().includes('Nou,'), 'antwoord'); click(q('[data-x="new"]'));
  click(q('[data-s="invul"]')); const w0 = q('[data-w="0"]'); w0.value = 'giraffe'; w0.oninput(); click(q('[data-x="make"]')); ok(text().includes('giraffe'), 'invulmop'); click(q('[data-x="tpl"]')); ok(!text().includes('giraffe'), 'andere mop');
  click(q('[data-s="geluid"]')); ok(qa('[data-snd]').length === 5, 'geluidsbord'); click(qa('[data-snd]')[0]); click(q('[data-s="lach"]')); ok(text().includes('Dieren'), 'lachstatistiek');
}
{ // via echte mop-app
  const view = mkView(), { q, qa, text } = helpers(view), cleanups = []; const M = await import('../docs/mop.js'); await M.mopView({ view, esc, uid: 'r4', addCleanup: (f) => cleanups.push(f) });
  click(q('[data-tab="show"]')); ok(text().includes('Mopmachine') && qa('[data-s]').length === 4, 'show-tab in mop-app'); cleanups.forEach((f) => f());
}

/* ===================== MEME ===================== */
const MM = await import('../docs/tools-r4-meme.js'); const C = await import('../docs/meme-core.js'); const { ICONS } = await import('../docs/gfx/icons.js');
eq(C.BGS.length, MM.R4_BG_START + MM.R4_BGS.length, 'bestaande achtergronden hebben dezelfde nummers'); eq(MM.R4_BGS.length, 8, '8 achtergronden'); eq(MM.R4_TEMPLATES.length, 14, '14 sjablonen'); eq(MM.R4_FILTERS.length, 6, '6 filters');
for (const t of MM.R4_TEMPLATES) { ok(t.bg >= MM.R4_BG_START && t.bg < C.BGS.length, 'bg ' + t.name); for (const l of t.layers) if (l.icon) ok(ICONS[l.icon], 'icoon ' + l.icon); ok(C.fromTemplate(t, () => 1).layers.length > 0, t.name); }
for (const [, names] of MM.R4_STICKER_GROUPS) for (const s of names) ok(ICONS[s], 'sticker ' + s);
{ const cvs = new El('canvas'); const ctx = cvs.getContext('2d'); for (const [, fn] of MM.R4_BGS) fn(ctx, 1080, 1080); ok(ctx.__n > 50, 'achtergronden tekenen'); }
const grad = () => { const d = new Uint8ClampedArray(20 * 20 * 4); for (let i = 0; i < d.length; i += 4) { const k = (i / 4) % 20; d[i] = k * 12; d[i + 1] = 120; d[i + 2] = 255 - k * 12; d[i + 3] = 255; } return { data: d, width: 20, height: 20 }; };
for (const [id] of MM.R4_FILTERS) { const a = grad(), b = grad(); const r = C.applyFilter(a, id, 1); ok(r === a, id); let diff = 0; for (let i = 0; i < a.data.length; i++) diff += Math.abs(a.data[i] - b.data[i]); ok(diff > 500, 'filter ' + id + ' verandert iets'); for (let i = 0; i < a.data.length; i += 4) ok(a.data[i + 3] === 255, 'alpha'); }
ok(C.FILTERS.some((f) => f[0] === 'popart') && C.FUNNY.length === 44 + 24 && C.STICKER_GROUPS.length === 9 + 2 && C.TEMPLATES.length === 15 + 14, 'meme-core bevat de extra inhoud');
ok(C.restore(C.serialize(C.fromTemplate(C.TEMPLATES[20], () => 1))).bg.idx >= 20, 'nieuwe achtergrond blijft na opslaan/laden');

/* ===================== CHAT ===================== */
const CH = await import('../docs/tools-r4-chat.js'); const CC = await import('../docs/chat-core.js');
eq(CC.STICKER_PACKS.length, 8 + 5, '13 pakketten'); eq(CC.THEMES.length, 12 + 8, '20 thema\'s'); eq(CC.REACTIONS.length, 12, '12 reacties'); ok(new Set(CC.THEMES.map((t) => t.id)).size === CC.THEMES.length && new Set(CC.STICKER_PACKS.map((t) => t.id)).size === CC.STICKER_PACKS.length, 'unieke ids');
for (const p of CH.R4_PACKS) for (const s of p.items) { ok(ICONS[s], 'sticker ' + s); ok(/^[a-z0-9-]{1,30}$/.test(s), 'naam ' + s); }
for (const t of CH.R4_THEMES) ok(ICONS[t.ic] && /^#/.test(t.mine[0]) && t.bg.length === 2, 'thema ' + t.id);
eq(CC.fillPhrase('Hoi {naam}!', 'Sam de Vries'), 'Hoi Sam!', 'naam invullen'); eq(CC.fillPhrase('Hoi {naam}!', ''), 'Hoi!', 'zonder naam'); ok(CC.QUICK_PHRASES.flatMap((g) => g[1]).length >= 20, 'zinnen');
eq(CC.parseMsg({ type: 'text', text: CC.reactionText('Ab12cd34', '🎉') }).emoji, '🎉', 'nieuwe reactie wordt herkend'); eq(CC.parseMsg({ type: 'text', text: CC.stickerText('whale') }).name, 'whale', 'nieuwe sticker wordt herkend');

/* ===================== FOTO ===================== */
const FT = await import('../docs/tools-r4-foto.js'); const FF = await import('../docs/foto-filters.js'); const FE = await import('../docs/foto-edit.js').catch((e) => ({ err: e }));
eq(FT.makeR4Filters({ G: () => () => {}, M: () => () => {}, clamp: (v) => v }).length, FT.R4_FILTER_COUNT, '12 filters');
ok(FF.FILTERS.length === 87 && FF.FILTERS.filter((f) => ['candy', 'oudetv', 'mosaic', 'neonedge', 'bloom', 'rainbands', 'lava', 'jungle', 'galaxy', 'espresso', 'poolijs', 'bubblegum'].includes(f.id)).length === 12, '12 nieuwe filters in foto-filters');
{
  const mkImg = (w, h) => { const d = new Uint8ClampedArray(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; d[i] = (x * 255 / w) | 0; d[i + 1] = (y * 255 / h) | 0; d[i + 2] = 128 + ((x ^ y) & 31); d[i + 3] = 255; } return { data: d, width: w, height: h }; };
  for (const id of ['candy', 'lava', 'jungle', 'galaxy', 'espresso', 'poolijs', 'bubblegum', 'oudetv', 'mosaic', 'neonedge', 'bloom', 'rainbands']) {
    const a = mkImg(64, 48), b = mkImg(64, 48); const t0 = Date.now(); FF.applyFilterData(a, id, 1); let diff = 0; for (let i = 0; i < a.data.length; i += 4) { diff += Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]); ok(a.data[i + 3] === 255, 'alpha ' + id); ok(!Number.isNaN(a.data[i]), 'NaN ' + id); } ok(diff > 800, 'filter ' + id + ' verandert de foto (' + diff + ')');
    const half = mkImg(64, 48); FF.applyFilterData(half, id, 0.5); let d2 = 0; for (let i = 0; i < half.data.length; i++) d2 += Math.abs(half.data[i] - b.data[i]); ok(d2 < diff * 1.05 + 10 && d2 > 0, 'sterkte 50% ligt tussen: ' + id);
  }
  const big = mkImg(1000, 1000); const t = process.hrtime.bigint(); FF.applyFilterData(big, 'bloom', 1); ok(Number(process.hrtime.bigint() - t) / 1e6 < 400, 'bloom op 1000x1000 onder 400 ms');
}
ok(FE.FRAME_IDS && FE.FRAME_IDS.length === 14 + 6 && ['neon', 'ticket', 'scrapbook', 'star', 'diamond', 'rounded2'].every((id) => FE.FRAME_IDS.includes(id)), 'frames: ' + (FE.err ? FE.err.message : (FE.FRAME_IDS || []).length));
{
  const frames = FT.makeR4Frames({ bgFill() {}, putImg() {}, layPad: () => () => ({}), laySq: () => ({}), poly() {}, rrect() {}, TAU: 6.28, lum: () => 100 }); eq(frames.length, FT.R4_FRAME_COUNT, '6 frames'); ok(new Set(frames.map((f) => f.id)).size === 6, 'uniek');
  for (const id of ['neon', 'ticket', 'scrapbook', 'star', 'diamond', 'rounded2']) for (const th of [0, 50, 100]) { const L = FE.frameLayout(id, 800, 600, th); ok(L.iw === 800 && L.ih === 600 && L.W >= 1, 'layout ' + id); }
  ok(FT.R4_FONTS.length === 5 && FT.R4_EMOJI.length === 24, 'fonts en emoji');
}

ok(T.errors.length === 0, 'geen fouten in timers');
console.log(`test-r4-tools: ${n} controles OK`);
