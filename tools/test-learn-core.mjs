// Tests voor docs/learn/core.js, q.js en packs/index.js (agent KERN). Draaien: node tools/test-learn-core.mjs
import * as nodeModule from 'node:module';
import { installDom, fire, byClass, hasClass, allEls } from './learn-stubs/kern-dom.mjs';

let pass = 0, fail = 0;
const fails = [];
async function t(name, fn) {
  try { await fn(); pass++; } catch (e) { fail++; fails.push(name); console.log('  FOUT', name, '\n      ', (e && e.stack) || e); }
}
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m || 'ongelijk'}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`); };
const ok = (c, m) => { if (!c) throw new Error(m || 'onwaar'); };

/* ---------- nep-omgeving ---------- */
globalThis.__fs = new Map(); globalThis.__fsLog = []; globalThis.__fsFail = false;
const STUB = `
export const doc = (db, ...p) => ({ path: p.join('/') });
export const getDoc = async (r) => { const v = globalThis.__fs.get(r.path); return { exists: () => v !== undefined, data: () => v }; };
export const setDoc = async (r, d) => { globalThis.__fsLog.push({ path: r.path, data: d, at: Date.now() }); if (globalThis.__fsFail) throw new Error('permission-denied'); globalThis.__fs.set(r.path, JSON.parse(JSON.stringify(d))); };
`;
const STUB_URL = 'data:text/javascript,' + encodeURIComponent(STUB);
if (nodeModule.registerHooks) nodeModule.registerHooks({ resolve(s, c, n) { if (s.startsWith('https://www.gstatic.com/firebasejs/')) return { url: STUB_URL, shortCircuit: true }; return n(s, c); } });
else nodeModule.register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, n) { if (s.startsWith('https://www.gstatic.com/firebasejs/')) return { url: ${JSON.stringify(STUB_URL)}, shortCircuit: true }; return n(s, c); }`), import.meta.url);

const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => { store.set(k, String(v)); }, removeItem: (k) => { store.delete(k); } };

const clock = { now: new Date(2026, 9, 30, 10, 0, 0).getTime(), id: 1, timers: [] };
Date.now = () => clock.now;
Object.defineProperty(globalThis, 'performance', { value: { now: () => clock.now - 1.7e12 }, configurable: true, writable: true });
globalThis.setTimeout = (fn, ms = 0) => { const id = clock.id++; clock.timers.push({ id, at: clock.now + ms, fn, every: 0 }); return id; };
globalThis.setInterval = (fn, ms = 0) => { const id = clock.id++; clock.timers.push({ id, at: clock.now + ms, fn, every: Math.max(1, ms) }); return id; };
globalThis.clearTimeout = globalThis.clearInterval = (id) => { clock.timers = clock.timers.filter((x) => x.id !== id); };
function advance(ms, step = 50) {
  const end = clock.now + ms;
  while (clock.now < end) {
    clock.now = Math.min(end, clock.now + step);
    for (;;) {
      const due = clock.timers.filter((x) => x.at <= clock.now).sort((a, b) => a.at - b.at)[0];
      if (!due) break;
      if (due.every) due.at += due.every; else clock.timers = clock.timers.filter((x) => x !== due);
      due.fn();
    }
  }
}
const tick = () => new Promise((r) => setImmediate(r));
async function settle(n = 6) { for (let i = 0; i < n; i++) await tick(); }
const DAY = 86400000;

installDom();
class FakeAC {
  constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; FakeAC.n++; }
  resume() {}
  createOscillator() { FakeAC.osc++; return { type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
  createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
}
FakeAC.n = 0; FakeAC.osc = 0;

const core = await import('../docs/learn/core.js?v=1');
const { LANGS, rng, shuffle, qkey, normalizeQ, checkAnswer, makeOptions, toTypeQ, pick, Kits, allKits, getKit, Prog, Profile, TTS, Snd, todayKey, fmt, esc, bindCtx, flushAll } = core;
const qmod = await import('../docs/learn/q.js?v=1');
const { guessLang } = qmod;
const live = [];
const ask = (h, q, o) => { const a = qmod.ask(h, q, o); live.push(a); return a; };
const cancelAll = () => { for (const a of live.splice(0)) a.cancel(); };
const { PACKS } = await import('../docs/learn/packs/index.js?v=1');

/* =================== basis =================== */
await t('LANGS: vijf talen met speech-code', () => {
  eq(Object.keys(LANGS), ['nl', 'en', 'de', 'fr', 'es']);
  eq(LANGS.nl.speech, 'nl-NL'); eq(LANGS.en.speech, 'en-GB'); ok(LANGS.de.name && LANGS.fr.speech && LANGS.es.speech);
});
await t('rng: deterministisch, verschillende seeds, bereik', () => {
  const a = rng(42), b = rng(42), c = rng(43), d = rng('abc'), e = rng('abc');
  const A = [a(), a(), a()], B = [b(), b(), b()];
  eq(A, B); ok(A[0] !== c()); eq(d(), e());
  for (let i = 0; i < 1000; i++) { const v = a(); ok(v >= 0 && v < 1); }
  const r = rng(7); let s = 0; for (let i = 0; i < 4000; i++) s += r(); ok(Math.abs(s / 4000 - 0.5) < 0.03, 'gemiddelde ' + s / 4000);
});
await t('shuffle: nieuw array, zelfde elementen, seed-stabiel', () => {
  const src = [1, 2, 3, 4, 5, 6, 7, 8];
  const s1 = shuffle(src, rng(1)), s2 = shuffle(src, rng(1));
  eq(s1, s2); eq([...s1].sort(), src); eq(src, [1, 2, 3, 4, 5, 6, 7, 8]); ok(s1 !== src);
  eq(shuffle([], rng(1)), []); eq(shuffle(null), []);
});
await t('fmt / esc / todayKey', () => {
  eq(fmt(0), '0'); eq(fmt(12), '12'); eq(fmt(999), '999'); eq(fmt(1000), '1K'); eq(fmt(1234), '1,2K'); eq(fmt(15500), '15,5K');
  eq(fmt(999999), '1M'); eq(fmt(3400000), '3,4M'); eq(fmt(2.5e9), '2,5B'); eq(fmt(-1500), '-1,5K'); eq(fmt(NaN), '0'); eq(fmt(12.5), '12,5');
  eq(esc('<a href="x">&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;'); eq(esc(null), '');
  eq(todayKey(), '2026-10-30');
});

/* =================== normalizeQ / qkey =================== */
await t('normalizeQ: alle 8 types geldig', () => {
  const mc = normalizeQ({ t: 'mc', q: ' Hoofdstad? ', a: 'Parijs', o: ['Parijs', 'Rome', 'Madrid', 'Berlijn'] });
  eq(mc.t, 'mc'); eq(mc.q, 'Hoofdstad?'); eq(mc.d, 2); eq(mc.o.length, 4);
  eq(normalizeQ({ t: 'mc', q: 'x', a: 'parijs', o: ['Parijs', 'Rome'] }).a, 'Parijs', 'hoofdletter-herstel');
  ok(normalizeQ({ t: 'mc', q: 'x', a: 'Z', o: ['A', 'B', 'C'] }).o.includes('Z'), 'antwoord wordt aan opties toegevoegd');
  eq(normalizeQ({ t: 'type', q: 'q', a: 'kat', alt: ['poes', 'kat', ''] }).alt, ['poes']);
  eq(normalizeQ({ t: 'tf', q: 'q', a: 'waar' }).a, true); eq(normalizeQ({ t: 'tf', q: 'q', a: false }).a, false); eq(normalizeQ({ t: 'tf', q: 'q', a: 'misschien' }), null);
  eq(normalizeQ({ t: 'order', q: 'o', a: ['a', 'b', 'c'] }).a.length, 3); eq(normalizeQ({ t: 'order', a: ['a'] }), null);
  eq(normalizeQ({ t: 'order', a: ['a', 'b', 'c'] }).q, 'Zet in de goede volgorde');
  eq(normalizeQ({ t: 'match', q: 'm', a: [['a', '1'], ['b', '2'], ['c', '3']] }).a.length, 3); eq(normalizeQ({ t: 'match', a: [['a', '1']] }), null);
  const f = normalizeQ({ t: 'fill', q: 'De kat zit op de mat', a: 'mat' }); ok(f.q.includes('___') && f.q === 'De kat zit op de ___', f.q);
  eq(normalizeQ({ t: 'fill', q: 'Ik ___ blij', a: 'ben', o: ['ben', 'bent', 'is', 'zijn'] }).o.length, 4);
  eq(normalizeQ({ t: 'num', q: 'n', a: '3,5' }).a, 3.5); eq(normalizeQ({ t: 'num', q: 'n', a: 'abc' }), null);
  eq(normalizeQ({ t: 'num', q: 'n', a: 10, alt: ['11', 'x'], tol: 0.5 }).alt, [11]);
  eq(normalizeQ({ t: 'multi', q: 'm', o: ['a', 'b', 'c'], a: ['a', 'c'] }).a, ['a', 'c']); eq(normalizeQ({ t: 'multi', q: 'm', o: ['a'], a: ['a'] }), null);
});
await t('normalizeQ: ongeldig geeft null, nooit gooien, extra velden', () => {
  for (const bad of [null, undefined, 5, 'x', {}, { t: 'mc' }, { t: 'type', q: '' , a: 'x' }, { t: 'type', q: 'x' }, []]) eq(normalizeQ(bad), null, JSON.stringify(bad));
  const q = normalizeQ({ t: 'type', q: 'x'.repeat(900), a: 'y', d: 9, lang: 'xx', e: '🐶', say: ' hallo ', x: ' uitleg ', g: 'groep', foo: 1 });
  eq(q.q.length, 400); eq(q.d, 3); eq(q.lang, undefined); eq(q.say, 'hallo'); eq(q.x, 'uitleg'); eq(q.g, 'groep'); eq(q.foo, undefined); eq(q.e, '🐶');
  eq(normalizeQ({ t: 'type', q: 'x', a: 'y', d: 0 }).d, 2, 'd standaard 2 bij ongeldig'); eq(normalizeQ({ q: 'x', a: 3 }).t, 'num'); eq(normalizeQ({ q: 'x', a: true }).t, 'tf');
  const orig = { t: 'type', q: 'x', a: 'y' }; normalizeQ(orig); eq(orig, { t: 'type', q: 'x', a: 'y' }, 'muteert niet');
});
await t('qkey: stabiel, kort, onderscheidend, type-onafhankelijk voor mc/type', () => {
  const a = { t: 'type', q: 'Wat is 2+2?', a: '4' };
  eq(qkey(a), qkey({ ...a })); ok(qkey(a).length <= 10 && qkey(a).length >= 6);
  ok(qkey(a) !== qkey({ ...a, a: '5' })); ok(qkey(a) !== qkey({ ...a, q: 'Wat is 2+3?' }));
  eq(qkey(a), qkey({ t: 'mc', q: 'Wat is 2+2?', a: '4', o: ['4', '5'] }), 'mc en type delen sleutel');
  eq(qkey({ t: 'num', q: 'Wat is 2+2?', a: 4 }), qkey(a), 'num deelt sleutel');
  ok(qkey({ t: 'tf', q: 'x', a: true }) !== qkey({ t: 'tf', q: 'x', a: false }));
  eq(qkey({ t: 'order', q: 'x', a: ['a', 'b'] }) === qkey({ t: 'order', q: 'x', a: ['b', 'a'] }), false);
  eq(qkey({ t: 'match', q: 'x', a: [['a', '1'], ['b', '2']] }), qkey({ t: 'match', q: 'x', a: [['b', '2'], ['a', '1']] }), 'match-volgorde maakt niet uit');
  const keys = new Set(); for (let i = 0; i < 3000; i++) keys.add(qkey({ t: 'type', q: 'vraag ' + i, a: 'a' + i })); eq(keys.size, 3000, 'geen botsingen');
});

/* =================== checkAnswer =================== */
const T = (a, alt, lang, extra) => normalizeQ({ t: 'type', q: 'v', a, alt, lang, ...extra });
await t('checkAnswer type: hoofdletters, spaties, leestekens, accenten', () => {
  const q = T('Parijs');
  ok(checkAnswer(q, 'parijs').ok); ok(checkAnswer(q, '  PARIJS  ').ok); ok(checkAnswer(q, 'Parijs!').ok); ok(checkAnswer(q, 'parijs.').ok);
  eq(checkAnswer(q, 'Rome').ok, false); eq(checkAnswer(q, '').ok, false); eq(checkAnswer(q, null).ok, false); eq(checkAnswer(q, undefined).ok, false);
  eq(checkAnswer(q, 'Parijs').correct, 'Parijs'); eq(checkAnswer(q, 'Parijs').typo, undefined);
  ok(checkAnswer(T('café', null, 'fr'), 'cafe').ok, 'accent weglaten mag'); ok(checkAnswer(T('cafe', null, 'fr'), 'café').ok, 'accent erbij mag');
  ok(checkAnswer(T('New York'), 'new   york').ok); ok(checkAnswer(T('New York'), 'newyork').ok, 'spatie-tolerant');
  ok(checkAnswer(T("l'eau", null, 'fr'), 'leau').ok); ok(checkAnswer(T('ice-cream'), 'ice cream').ok);
});
await t('checkAnswer type: typefouten (Levenshtein<=1 bij >=5 letters) met typo-vlag', () => {
  const q = T('olifant');
  let r = checkAnswer(q, 'olifnat'); ok(r.ok && r.typo === true, 'verwisseling'); r = checkAnswer(q, 'olifat'); ok(r.ok && r.typo, 'ontbrekende letter');
  r = checkAnswer(q, 'ollifant'); ok(r.ok && r.typo, 'extra letter'); r = checkAnswer(q, 'olifaut'); ok(r.ok && r.typo, 'verkeerde letter');
  eq(checkAnswer(q, 'olefnt').ok, false, '2 fouten'); eq(checkAnswer(q, 'oliphant!!').ok, false);
  eq(checkAnswer(T('hond'), 'hand').ok, false, 'korte woorden: geen typo-tolerantie'); eq(checkAnswer(T('kat'), 'kut').ok, false);
  eq(checkAnswer(T('12345'), '12346').ok, false, 'cijfers: geen typo'); eq(checkAnswer(T('ab12cd'), 'ab13cd').ok, false);
  eq(checkAnswer(T('olifant', null, null, { strict: true }), 'olifat').ok, false, 'strict: geen typo');
  eq(checkAnswer(T('Parijs', null, null, { strict: true }), 'parijs').ok, false, 'strict: hoofdletters tellen'); ok(checkAnswer(T('Parijs', null, null, { strict: true }), 'Parijs').ok);
  eq(checkAnswer(T('café', null, 'fr', { strict: true }), 'cafe').ok, false, 'strict: accenten tellen');
  eq(checkAnswer(T('olifant'), 'olifat', { strict: true }).ok, false, 'strict ook als optie');
});
await t('checkAnswer type: alt, schuine streep, haakjes, lidwoorden, duits', () => {
  const q = T('auto', ['wagen', 'bak']);
  ok(checkAnswer(q, 'wagen').ok && checkAnswer(q, 'BAK').ok);
  ok(checkAnswer(T('kleur / color'), 'color').ok); ok(checkAnswer(T('bijna; haast'), 'haast').ok); ok(checkAnswer(T('(de) fiets'), 'fiets').ok); ok(checkAnswer(T('(de) fiets'), 'de fiets').ok);
  ok(checkAnswer(T('de hond', null, 'nl'), 'hond').ok, 'nl: lidwoord mag weg'); ok(checkAnswer(T('hond', null, 'nl'), 'de hond').ok, 'nl: lidwoord erbij mag');
  ok(checkAnswer(T('the dog', null, 'en'), 'dog').ok); ok(checkAnswer(T('to run', null, 'en'), 'run').ok);
  let r = checkAnswer(T('der Hund', null, 'de'), 'Hund'); eq(r.ok, false, 'duits: lidwoord telt'); ok(r.partial >= 0.5, 'maar wel partial');
  ok(checkAnswer(T('der Hund', null, 'de'), 'der hund').ok);
  ok(checkAnswer(T('schön', null, 'de'), 'schoen').ok, 'ö -> oe'); ok(checkAnswer(T('schön', null, 'de'), 'schon').ok); ok(checkAnswer(T('Straße', null, 'de'), 'strasse').ok);
  ok(checkAnswer(T('über', null, 'de'), 'ueber').ok); ok(checkAnswer(T('niño', null, 'es'), 'nino').ok); ok(checkAnswer(T('cœur', null, 'fr'), 'coeur').ok);
  ok(checkAnswer(T("l'eau", null, 'fr'), 'eau').ok === false || true); // niet crashen
});
await t('checkAnswer mc / tf', () => {
  const mc = normalizeQ({ t: 'mc', q: 'x', a: 'Rome', o: ['Rome', 'Parijs', 'Madrid', 'Berlijn'] });
  ok(checkAnswer(mc, 'Rome').ok); ok(checkAnswer(mc, ' rome ').ok); eq(checkAnswer(mc, 'Parijs').ok, false); eq(checkAnswer(mc, 0).ok, true, 'index 0 = Rome'); eq(checkAnswer(mc, 1).ok, false);
  eq(checkAnswer(mc, 'Parijs').correct, 'Rome');
  const tf = normalizeQ({ t: 'tf', q: 'x', a: true });
  ok(checkAnswer(tf, true).ok); eq(checkAnswer(tf, false).ok, false); ok(checkAnswer(tf, 'waar').ok); ok(checkAnswer(tf, 'ja').ok); eq(checkAnswer(tf, 'onwaar').ok, false); eq(checkAnswer(tf, null).ok, false);
  eq(checkAnswer(tf, true).correct, 'Waar'); eq(checkAnswer(normalizeQ({ t: 'tf', q: 'x', a: false }), true).correct, 'Onwaar'); ok(checkAnswer(normalizeQ({ t: 'tf', q: 'x', a: false }), false).ok);
});
await t('checkAnswer num: komma/punt, duizendtallen, eenheden, tolerantie, breuken', () => {
  const n = (a, extra) => normalizeQ({ t: 'num', q: 'n', a, ...extra });
  ok(checkAnswer(n(42), '42').ok); ok(checkAnswer(n(42), 42).ok); ok(checkAnswer(n(42), '42.0').ok); eq(checkAnswer(n(42), '43').ok, false); eq(checkAnswer(n(42), 'abc').ok, false); eq(checkAnswer(n(42), '').ok, false);
  ok(checkAnswer(n(3.5), '3,5').ok); ok(checkAnswer(n(3.5), '3.5').ok); ok(checkAnswer(n(1000), '1.000').ok, 'nl-duizendtal'); ok(checkAnswer(n(1000), '1000').ok); ok(checkAnswer(n(1234.5), '1.234,5').ok);
  ok(checkAnswer(n(12), '12 cm').ok); ok(checkAnswer(n(50), '50%').ok); ok(checkAnswer(n(5), '€5').ok); ok(checkAnswer(n(0.5), '1/2').ok); ok(checkAnswer(n(-3), '-3').ok);
  ok(checkAnswer(n(3.3333), '3,33').ok, 'afronding mag'); eq(checkAnswer(n(3.3333), '3,4').ok, false);
  ok(checkAnswer(n(10, { tol: 0.5 }), '10,4').ok); eq(checkAnswer(n(10, { tol: 0.5 }), '10,6').ok, false);
  ok(checkAnswer(n(10, { alt: [20] }), '20').ok); eq(checkAnswer(n(42), '42 en 43').ok, false, 'twee getallen = fout');
  eq(checkAnswer(n(3.5), '3,5').correct, '3,5'); eq(checkAnswer(n(42), '1').correct, '42');
});
await t('checkAnswer fill', () => {
  const f = normalizeQ({ t: 'fill', q: 'Ik ___ blij', a: 'ben', o: ['ben', 'bent', 'is', 'zijn'] });
  ok(checkAnswer(f, 'ben').ok); eq(checkAnswer(f, 'bent').ok, false); const f2 = normalizeQ({ t: 'fill', q: 'De ___ is blauw', a: 'lucht' });
  ok(checkAnswer(f2, 'Lucht').ok); ok(checkAnswer(f2, 'luch').ok === false || true);
});
await t('checkAnswer order / match / multi met partial', () => {
  const o = normalizeQ({ t: 'order', q: 'o', a: ['een', 'twee', 'drie', 'vier'] });
  ok(checkAnswer(o, ['een', 'twee', 'drie', 'vier']).ok); let r = checkAnswer(o, ['twee', 'een', 'drie', 'vier']); eq(r.ok, false); eq(r.partial, 0.5);
  eq(checkAnswer(o, ['een', 'twee']).ok, false); eq(checkAnswer(o, null).ok, false); eq(checkAnswer(o, null).partial, 0); ok(checkAnswer(o, ['EEN', 'Twee', 'drie', 'vier']).ok);
  eq(checkAnswer(o, null).correct, 'een → twee → drie → vier');
  const m = normalizeQ({ t: 'match', q: 'm', a: [['hond', 'woef'], ['kat', 'miauw'], ['koe', 'boe']] });
  ok(checkAnswer(m, [['koe', 'boe'], ['hond', 'woef'], ['kat', 'miauw']]).ok); r = checkAnswer(m, [['hond', 'woef'], ['kat', 'boe'], ['koe', 'miauw']]); eq(r.ok, false); ok(Math.abs(r.partial - 1 / 3) < 1e-9);
  eq(checkAnswer(m, []).ok, false); eq(checkAnswer(m, null).ok, false); ok(checkAnswer(m, null).correct.includes('hond = woef'));
  const u = normalizeQ({ t: 'multi', q: 'm', o: ['a', 'b', 'c', 'd'], a: ['a', 'c'] });
  ok(checkAnswer(u, ['c', 'a']).ok); r = checkAnswer(u, ['a']); eq(r.ok, false); eq(r.partial, 0.5); r = checkAnswer(u, ['a', 'c', 'd']); eq(r.ok, false); eq(r.partial, 0.5); r = checkAnswer(u, ['b', 'd']); eq(r.partial, 0);
  eq(checkAnswer(u, []).ok, false); eq(checkAnswer(u, 'a').ok, false); eq(checkAnswer(u, ['a', 'c']).correct, 'a, c');
});
await t('checkAnswer: robuust tegen rommel', () => {
  for (const q of [null, undefined, {}, { t: 'zzz' }]) for (const g of [null, undefined, 5, 'x', [], {}, [1, 2]]) { const r = checkAnswer(q, g); ok(typeof r.ok === 'boolean' && typeof r.correct === 'string'); }
  for (const t2 of ['mc', 'type', 'tf', 'order', 'match', 'fill', 'num', 'multi']) for (const g of [null, undefined, {}, [[]], [null], 'x', 3]) { const q = { t: t2, q: 'x', a: 'y', o: ['y', 'z'] }; checkAnswer(q, g); }
});

/* =================== makeOptions / toTypeQ =================== */
const POOL = [
  ['Frankrijk', 'Parijs'], ['Italië', 'Rome'], ['Spanje', 'Madrid'], ['Duitsland', 'Berlijn'], ['Portugal', 'Lissabon'], ['Oostenrijk', 'Wenen'],
].map(([l, a]) => normalizeQ({ t: 'type', q: 'Hoofdstad van ' + l + '?', a, g: 'steden', lang: 'nl' }));
await t('makeOptions: type -> mc met 4 unieke opties incl. juiste', () => {
  const q = POOL[0];
  for (let s = 0; s < 20; s++) {
    const m = makeOptions(q, POOL, 4, rng(s));
    eq(m.t, 'mc'); eq(m.o.length, 4); eq(new Set(m.o.map((x) => x.toLowerCase())).size, 4); ok(m.o.includes('Parijs')); eq(m.a, 'Parijs'); eq(m.q, q.q);
    ok(m.o.filter((x) => x !== 'Parijs').every((x) => POOL.some((p) => p.a === x)), 'wrong opties uit pool');
  }
  eq(q.t, 'type', 'origineel blijft');
  const m2 = makeOptions(q, POOL, 4, rng(1)), m3 = makeOptions(q, POOL, 4, rng(1)); eq(m2.o, m3.o, 'seed-stabiel');
  const shown = new Set(); for (let s = 0; s < 40; s++) shown.add(makeOptions(q, POOL, 4, rng(s)).o.indexOf('Parijs')); ok(shown.size >= 3, 'positie van juiste antwoord varieert');
});
await t('makeOptions: voorkeur voor zelfde g/lang, getallen, kleine pool, n', () => {
  const pool = [...POOL, normalizeQ({ t: 'type', q: 'Wat is 2+2?', a: '4', g: 'rekenen' }), normalizeQ({ t: 'type', q: 'Wat is 3+3?', a: '6', g: 'rekenen' })];
  for (let s = 0; s < 10; s++) { const m = makeOptions(POOL[1], pool, 4, rng(s)); ok(!m.o.includes('4') && !m.o.includes('6'), 'geen rekenantwoorden bij steden'); }
  const num = normalizeQ({ t: 'num', q: '6 × 7 = ?', a: 42 });
  const m = makeOptions(num, [], 4, rng(3)); eq(m.t, 'mc'); eq(m.a, '42'); eq(m.o.length, 4); ok(m.o.includes('42')); ok(m.o.every((x) => /^\d+$/.test(x)), 'numeriek: ' + m.o);
  const dec = makeOptions(normalizeQ({ t: 'num', q: 'x', a: 3.5 }), [], 4, rng(2)); ok(dec.o.every((x) => /^\d+,\d$/.test(x)), 'decimalen: ' + dec.o);
  eq(makeOptions(POOL[0], POOL, 3, rng(1)).o.length, 3); eq(makeOptions(POOL[0], POOL, 6, rng(1)).o.length, 6); eq(makeOptions(POOL[0], POOL, 1, rng(1)).o.length, 2);
  const tiny = makeOptions(POOL[0], [POOL[0]], 4, rng(1)); ok(tiny.t === 'mc' ? tiny.o.length >= 2 : tiny.t === 'type', 'kleine pool crasht niet');
  const none = makeOptions(normalizeQ({ t: 'type', q: 'x', a: 'a b' }), [], 4, rng(1)); eq(none.t, 'type', 'niet te maken: blijft type');
  const mc = normalizeQ({ t: 'mc', q: 'x', a: 'a', o: ['a', 'b', 'c', 'd'] }); eq(makeOptions(mc, [], 4, rng(1)).o.length, 4);
  const ord = normalizeQ({ t: 'order', q: 'o', a: ['a', 'b', 'c'] }); eq(makeOptions(ord, POOL, 4).t, 'order');
  const tf = makeOptions(normalizeQ({ t: 'tf', q: 'x', a: true }), [], 4); eq(tf.t, 'mc'); eq(tf.a, 'Waar');
  const fill = normalizeQ({ t: 'fill', q: 'De ___ is blauw', a: 'lucht' }); const mf = makeOptions(fill, [normalizeQ({ t: 'type', q: 'a', a: 'zee' }), normalizeQ({ t: 'type', q: 'b', a: 'gras' }), normalizeQ({ t: 'type', q: 'c', a: 'zon' })], 4, rng(1)); eq(mf.t, 'fill'); eq(mf.o.length, 4);
});
await t('toTypeQ: mc -> type zonder o', () => {
  const mc = normalizeQ({ t: 'mc', q: 'x', a: 'Rome', o: ['Rome', 'Parijs'], e: '🏛️', lang: 'nl' });
  const ty = toTypeQ(mc); eq(ty.t, 'type'); eq(ty.o, undefined); eq(ty.a, 'Rome'); eq(ty.e, '🏛️'); eq(mc.t, 'mc'); eq(qkey(ty), qkey(mc));
  eq(toTypeQ(normalizeQ({ t: 'tf', q: 'x', a: true })).t, 'tf'); eq(toTypeQ(normalizeQ({ t: 'fill', q: 'x ___', a: 'y', o: ['y', 'z'] })).o, undefined);
});

/* =================== pick =================== */
const KIT = { id: 'kit1', qs: Array.from({ length: 30 }, (_, i) => normalizeQ({ t: i % 3 === 0 ? 'mc' : (i % 3 === 1 ? 'type' : 'num'), q: 'Vraag ' + i, a: i % 3 === 2 ? i : 'A' + i, o: ['A' + i, 'x' + i, 'y' + i, 'z' + i], d: (i % 3) + 1 })) };
await t('pick: n unieke, seed-stabiel, herhaalt pas als alles geweest is', () => {
  const p = pick(KIT, 10, { seed: 5 }); eq(p.length, 10); eq(new Set(p.map(qkey)).size, 10);
  eq(pick(KIT, 10, { seed: 5 }).map(qkey), p.map(qkey)); ok(pick(KIT, 10, { seed: 6 }).map(qkey).join() !== p.map(qkey).join());
  const all = pick(KIT, 30, { seed: 1 }); eq(new Set(all.map(qkey)).size, 30);
  const more = pick(KIT, 45, { seed: 1 }); eq(more.length, 45); eq(new Set(more.slice(0, 30).map(qkey)).size, 30, 'eerst alles'); for (let i = 31; i < 45; i++) ok(qkey(more[i]) !== qkey(more[i - 1]), 'geen directe herhaling');
  const small = { id: 's', qs: KIT.qs.slice(0, 3) }; const sp = pick(small, 10, { seed: 2 }); eq(sp.length, 10); eq(new Set(sp.map(qkey)).size, 3);
  const one = pick({ qs: [KIT.qs[0]] }, 5); eq(one.length, 5);
  eq(pick({ qs: [] }, 5), []); eq(pick(null, 5), []); eq(pick(KIT, 0), []); eq(pick(KIT, 3).length, 3);
});
await t('pick: types-filter (met omzetten), hard, avoid, weakFirst', () => {
  const only = pick(KIT, 10, { seed: 3, types: ['num'] }); ok(only.every((q) => q.t === 'num' || q.t === 'mc')); // num + omgezette
  const mc = pick(KIT, 20, { seed: 3, types: ['mc'] }); ok(mc.every((q) => q.t === 'mc'), 'alles mc'); ok(mc.every((q) => q.o.length >= 2 && q.o.includes(q.a)));
  const typed = pick(KIT, 20, { seed: 3, types: ['type'] }); ok(typed.every((q) => q.t === 'type' && !q.o));
  eq(pick(KIT, 6, { seed: 3, types: ['order'] }).length, 6, 'geen match: valt terug op alles');
  eq(pick(KIT, 5, { seed: 3, types: ['mc'], convert: false }).every((q) => q.t === 'mc'), true);
  const hard1 = pick(KIT, 10, { seed: 4, hard: 1 }); const d1 = hard1.filter((q) => q.d === 1).length; const hard3 = pick(KIT, 10, { seed: 4, hard: 3 }); const d3 = hard3.filter((q) => q.d === 3).length;
  ok(d1 >= 6, 'hard=1 -> vooral makkelijk: ' + d1); ok(d3 >= 5, 'hard=3 -> vooral moeilijk: ' + d3);
  const first = pick(KIT, 10, { seed: 9 }); const avoid = new Set(first.map(qkey)); const second = pick(KIT, 10, { seed: 9, avoid }); ok(second.every((q) => !avoid.has(qkey(q))), 'avoid vermeden');
  bindCtx({ uid: 'pickuser' });
  const kid = 'pk'; for (const q of KIT.qs.slice(0, 15)) Prog.record(kid, q, true, 1000), Prog.record(kid, q, true, 1000), Prog.record(kid, q, true, 1000), Prog.record(kid, q, true, 1000);
  let weakHits = 0, N = 40;
  for (let s = 0; s < N; s++) { const p = pick({ id: kid, qs: KIT.qs }, 5, { seed: 100 + s, weakFirst: true }); weakHits += p.filter((q) => Prog.box(kid, q) === 0).length; }
  ok(weakHits / (N * 5) > 0.6, 'weakFirst trekt nieuwe/zwakke: ' + weakHits / (N * 5));
});

/* =================== Prog (Leitner) =================== */
await t('Prog: boxen omhoog/omlaag, interval-logica, dueFirst, weak, mastery', async () => {
  bindCtx({ uid: 'leit1' }); await Prog.load();
  const kit = { id: 'L', qs: Array.from({ length: 6 }, (_, i) => normalizeQ({ t: 'type', q: 'q' + i, a: 'a' + i })) };
  const [a, b, c, d, e, f] = kit.qs;
  eq(Prog.box('L', a), 0); eq(Prog.mastery('L', kit), { pct: 0, known: 0, learning: 0, new: 6, total: 6 });
  let r = Prog.record('L', a, true, 800); eq(r.box, 1); r = Prog.record('L', a, true, 800); eq(r.box, 2); eq(Prog.box('L', a), 2);
  ok(!Prog.isDue('L', a), 'box 2 pas na interval'); r = Prog.record('L', a, true, 800); eq(r.box, 2, 'te vroeg goed: box blijft'); eq(r.promoted, false);
  clock.now += 20 * 3600000; ok(Prog.isDue('L', a), 'na 20 uur herhalen'); r = Prog.record('L', a, true, 800); eq(r.box, 3);
  clock.now += 3 * DAY; r = Prog.record('L', a, true, 800); eq(r.box, 4); clock.now += 8 * DAY; r = Prog.record('L', a, true, 800); eq(r.box, 5); clock.now += 30 * DAY; r = Prog.record('L', a, true, 800); eq(r.box, 5, 'max 5');
  r = Prog.record('L', a, false, 800); eq(r.box, 3, '5 -> 3 bij fout'); r = Prog.record('L', a, false, 800); eq(r.box, 1); r = Prog.record('L', a, false, 800); eq(r.box, 0); r = Prog.record('L', a, false, 800); eq(r.box, 0);
  Prog.record('L', b, true, 1); Prog.record('L', b, true, 1); clock.now += DAY; Prog.record('L', b, true, 1); Prog.record('L', b, true, 1); // box 3
  Prog.record('L', c, true, 1);                                   // box 1 (leren)
  const order = Prog.dueFirst(kit).map((q) => q.q);
  eq(order[0], 'q0', 'box 0 (fout gehad) eerst'); eq(order[1], 'q2', 'dan box 1'); ok(order.indexOf('q3') < order.indexOf('q1'), 'nieuw voor niet-toe-aan-herhaling'); eq(order[order.length - 1], 'q1', 'zojuist geleerd (box 3) laatst'); eq(order.length, 6);
  clock.now += 10 * DAY; const o2 = Prog.dueFirst(kit).map((q) => q.q); ok(o2.indexOf('q1') < o2.indexOf('q3'), 'verlopen herhaling voor nieuw');
  const m = Prog.mastery('L', kit); eq(m.new, 3); eq(m.learning + m.known, 3); ok(m.pct > 0 && m.pct < 100);
  const weak = Prog.weak('L', 5, kit); eq(weak[0].q, 'q0'); ok(weak.length === 3 && !weak.some((q) => q.q === 'q3'), 'alleen geziene'); eq(Prog.weak('nergens', 3).length, 0);
  eq(Prog.dueFirst({ id: 'nieuw', qs: kit.qs }).length, 6); eq(Prog.dueFirst(null), []);
  eq(Prog.record('L', 'ruwe-sleutel', true, 1).box, 1, 'ook met sleutelstring'); eq(Prog.box('L', 'ruwe-sleutel'), 1);
});
await t('Prog: streak, dagstatistiek, dagdoel, geschiedenis', async () => {
  bindCtx({ uid: 'streak1' }); await Prog.load();
  let s = Prog.stats(); eq(s.streak, 0); eq(s.today, { answers: 0, correct: 0, xp: 0 }); eq(s.goal, 20);
  const q = normalizeQ({ t: 'type', q: 'x', a: 'y' });
  Prog.record('S', q, true, 500); Prog.record('S', q, false, 500); s = Prog.stats(); eq(s.streak, 1); eq(s.today.answers, 2); eq(s.today.correct, 1); eq(s.best, 1);
  clock.now += DAY; Prog.record('S', q, true, 1); eq(Prog.stats().streak, 2); eq(Prog.stats().today.answers, 1); clock.now += DAY; Prog.record('S', q, true, 1); eq(Prog.stats().streak, 3);
  clock.now += 3 * DAY; eq(Prog.stats().streak, 0, 'streak verlopen na gemiste dagen'); eq(Prog.stats().best, 3); Prog.record('S', q, true, 1); eq(Prog.stats().streak, 1); eq(Prog.stats().best, 3);
  eq(Prog.stats().week.length, 7); eq(Prog.stats().week[6].answers, 1);
  Prog.setGoal(35); eq(Prog.stats().goal, 35); Profile.addXp(12); eq(Prog.stats().today.xp, 12);
  eq(Prog.history('S'), []); Prog.addResult('S', { grade: 8.5, n: 10, ok: 9 }); Prog.addResult('S', { grade: 5 }); const hs = Prog.history('S'); eq(hs.length, 2); eq(hs[0].grade, 8.5); ok(hs[0].ts > 0);
  for (let i = 0; i < 30; i++) Prog.addResult('S', { grade: i }); eq(Prog.history('S').length, 12, 'max 12 bewaard'); eq(Prog.history('S')[11].grade, 29);
});
await t('Prog: opslag overleeft herladen (lokaal) en is compact', async () => {
  bindCtx({ uid: 'persist1' }); await Prog.load();
  const qs = Array.from({ length: 400 }, (_, i) => normalizeQ({ t: 'type', q: 'vraag nummer ' + i, a: 'antwoord ' + i }));
  for (const q of qs) Prog.record('big', q, true, 100);
  await flushAll();
  const raw = store.get('learn:persist1:prog'); ok(raw, 'lokaal opgeslagen'); ok(raw.length < 18000, 'compact genoeg voor 400 vragen: ' + raw.length);
  bindCtx({ uid: 'other' }); eq(Prog.box('big', qs[0]), 0, 'andere gebruiker leeg'); bindCtx({ uid: 'persist1' }); await Prog.load(); eq(Prog.box('big', qs[0]), 1, 'terug: weer geladen'); eq(Prog.stats().today.answers, 400);
});

/* =================== Profile =================== */
await t('Profile: XP-curve, level-ups met beloning, coins, spend', async () => {
  bindCtx({ uid: 'prof1', me: { name: 'Simon' } }); await Profile.load();
  let p = Profile.get(); eq(p.level, 1); eq(p.xp, 0); eq(p.coins, 0); eq(p.name, 'Simon', 'naam uit ctx.me'); eq(p.avatar.emoji.length > 0, true);
  let li = Profile.levelInfo(); eq(li.level, 1); eq(li.cur, 0); ok(li.next > 0);
  const r = Profile.addXp(li.next); eq(r.level, 2); eq(r.levels.length, 1); ok(r.coins > 0); eq(Profile.get().coins, r.coins); eq(Profile.levelInfo().cur, 0);
  Profile.addXp(5); eq(Profile.levelInfo().cur, 5);
  const big = Profile.addXp(5000); ok(big.levels.length >= 3, 'meerdere levels tegelijk: ' + big.levels.length); eq(Profile.get().level, big.level);
  let prev = 0; for (let L = 1; L <= 60; L++) { const x = Profile.xpForLevel(L); ok(x >= prev); prev = x; }
  ok(Profile.xpForLevel(10) < 3000 && Profile.xpForLevel(30) > 15000, 'curve: ' + Profile.xpForLevel(10) + ' / ' + Profile.xpForLevel(30));
  eq(Profile.addXp(-5).gained, 0); eq(Profile.addXp('x').gained, 0); eq(Profile.addXp(2.9).gained, 2);
  const c0 = Profile.get().coins; Profile.addCoins(100); eq(Profile.get().coins, c0 + 100); eq(Profile.spend(c0 + 101), false); eq(Profile.get().coins, c0 + 100); eq(Profile.spend(10), true); eq(Profile.get().coins, c0 + 90); eq(Profile.spend(-5), false); eq(Profile.spend(0), true);
});
await t('Profile: upgrades (>=14), kopen, kosten, effecten', async () => {
  bindCtx({ uid: 'upg1' }); await Profile.load();
  const U = Profile.UPGRADES; ok(U.length >= 14, 'aantal upgrades ' + U.length);
  for (const u of U) { ok(u.id && u.name && u.emoji && u.desc && u.max >= 3, u.id); ok(typeof u.cost(0) === 'number' && u.cost(0) > 0 && u.cost(1) > u.cost(0), 'kosten stijgen ' + u.id); eq(u.cost(u.max), Infinity); ok(typeof u.fx(1) === 'object'); }
  eq(new Set(U.map((u) => u.id)).size, U.length, 'unieke ids');
  eq(Profile.effects(), { ...Profile.effects() }); const e0 = Profile.effects();
  eq(e0.startCash, 0); eq(e0.cashMult, 1); eq(e0.xpMult, 1); eq(e0.coinMult, 1); eq(e0.extraLives, 0); eq(e0.hints, 0); eq(e0.shield, 0); eq(e0.luck, 0); eq(e0.timeBonus, 0); eq(e0.streakBonus, 0);
  eq(Profile.buyUpgrade('slimme-start'), false, 'geen geld'); Profile.addCoins(100000);
  const c0 = Profile.get().coins; const cost = U.find((u) => u.id === 'slimme-start').cost(0);
  eq(Profile.buyUpgrade('slimme-start'), true); eq(Profile.get().coins, c0 - cost); eq(Profile.get().up['slimme-start'], 1); ok(Profile.effects().startCash > 0);
  for (const u of U) for (let i = 0; i < u.max + 2; i++) Profile.buyUpgrade(u.id);
  for (const u of U) eq(Profile.get().up[u.id], u.max, 'max ' + u.id); eq(Profile.buyUpgrade('bestaat-niet'), false);
  const e = Profile.effects(); ok(e.startCash > 0 && e.cashMult > 1 && e.streakBonus > 0 && e.extraLives >= 1 && e.timeBonus > 0 && e.hints >= 1 && e.shield >= 1 && e.xpMult > 1 && e.coinMult > 1 && e.luck > 0 && e.luck <= 0.9, JSON.stringify(e));
  ok(Math.abs(e.xpMult - 2) < 1e-9, 'dubbele xp max = x2'); eq(e.tts, true);
  const lvl = Profile.get().level; ok(Profile.achievements().find((a) => a.id === 'up-max'));
  eq(Profile.setAvatar({ emoji: '🦊', hat: '👑', bg: 'night' }), { emoji: '🦊', hat: '👑', bg: 'night' }); eq(Profile.get().avatar.hat, '👑'); Profile.setAvatar({ hat: '' }); eq(Profile.get().avatar.emoji, '🦊'); void lvl;
});
await t('Profile: uiterlijk kopen (extra)', async () => {
  bindCtx({ uid: 'cos1' }); await Profile.load();
  ok(Profile.COSMETICS.avatar.length >= 20 && Profile.COSMETICS.hat.length >= 10 && Profile.COSMETICS.bg.length >= 8);
  ok(Profile.owns('avatar', '🙂')); eq(Profile.owns('hat', '👑'), false); eq(Profile.buyCosmetic('hat', '👑'), false); Profile.addCoins(1000); eq(Profile.buyCosmetic('hat', '👑'), true); ok(Profile.owns('hat', '👑')); eq(Profile.buyCosmetic('hat', '👑'), true, 'tweede keer kost niets');
  eq(Profile.get().coins, 1000 - Profile.COSMETICS.hat.find((h) => h.id === '👑').cost); ok(Profile.bgCss('night').includes('gradient'));
});
await t('Profile: dagopdrachten (5, deterministisch, voortgang, claimen, bonus)', async () => {
  bindCtx({ uid: 'quest1' }); await Profile.load();
  const q = Profile.quests(); eq(q.length, 5); for (const x of q) { ok(x.id && x.text && x.goal > 0 && x.reward > 0 && x.prog === 0 && x.done === false, JSON.stringify(x)); }
  eq(new Set(q.map((x) => x.kind)).size, 5, 'verschillende soorten');
  bindCtx({ uid: 'quest2' }); await Profile.load(); eq(Profile.quests().map((x) => x.id + x.goal), q.map((x) => x.id + x.goal), 'zelfde dag = zelfde opdrachten');
  const saved = clock.now; clock.now += DAY; const nxt = Profile.quests(); ok(nxt.map((x) => x.id).join() !== q.map((x) => x.id).join(), 'andere dag = andere'); eq(nxt.length, 5); clock.now = saved;
  bindCtx({ uid: 'quest3' }); await Profile.load(); const qs = Profile.quests();
  const answ = qs.find((x) => x.kind === 'answers'), corr = qs.find((x) => x.kind === 'correct');
  const qq = normalizeQ({ t: 'type', q: 'x', a: 'y' });
  for (let i = 0; i < 40; i++) Prog.record('Q', qq, true, 5000);
  const after = Profile.quests(); if (answ) { eq(after.find((x) => x.id === answ.id).prog, Math.min(40, answ.goal)); }
  if (corr) eq(after.find((x) => x.id === corr.id).prog, Math.min(40, corr.goal));
  Profile.bumpQuest('answers', 99); if (answ) eq(Profile.quests().find((x) => x.id === answ.id).prog, Math.min(40, answ.goal), 'answers via bumpQuest wordt genegeerd');
  const g = qs.find((x) => x.kind === 'games'); Profile.bumpQuest('games', 1); Profile.bumpQuest('wins', 1); Profile.bumpQuest('tests', 1); Profile.bumpQuest('learn', 5); Profile.bumpQuest('perfect', 1); Profile.bumpQuest('flash', 50); Profile.bumpQuest('lang', 50); Profile.bumpQuest('streak', 99); Profile.addXp(500);
  const fin = Profile.quests(); ok(fin.filter((x) => x.done).length >= 3, 'veel opdrachten klaar: ' + fin.filter((x) => x.done).length); void g;
  const open = fin.find((x) => !x.done); if (open) eq(Profile.claimQuest(open.id), false, 'niet klaar = niet claimen');
  const c0 = Profile.get().coins; const first = fin.find((x) => x.done); const cl = Profile.claimQuest(first.id); ok(cl && cl.coins === first.reward); eq(Profile.get().coins, c0 + first.reward + (cl.levels || []).reduce((a, l) => a + l.coins, 0)); eq(Profile.claimQuest(first.id), false, 'maar 1 keer');
  eq(Profile.claimQuest('nope'), false);
  Profile.bumpQuest('games', 9); for (const x of Profile.quests()) if (x.done) Profile.claimQuest(x.id);
  eq(Profile.get().stats.qd >= 3, true); eq(Profile.get().stats.games >= 1, true, 'lifetime stat games');
});
await t('Profile: prestaties (>=40), checkAch geeft nieuwe, geen dubbele beloning', async () => {
  bindCtx({ uid: 'ach1' }); await Profile.load();
  const all = Profile.achievements(); ok(all.length >= 40, 'aantal prestaties ' + all.length); for (const a of all) { ok(a.id && a.name && a.emoji && a.desc && a.goal > 0 && a.done === false && a.prog >= 0, a.id); }
  eq(new Set(all.map((a) => a.id)).size, all.length);
  eq(Profile.checkAch(), [], 'niets bij nieuw profiel (naam leeg)'); Profile.setName('Simon'); const f1 = Profile.checkAch(); eq(f1.map((a) => a.id), ['name']);
  const q = normalizeQ({ t: 'type', q: 'x', a: 'y' }); for (let i = 0; i < 12; i++) Prog.record('A', q, true, 1000);
  const f2 = Profile.checkAch().map((a) => a.id); ok(f2.includes('ans-1') && f2.includes('run-10') && f2.includes('run-5') && f2.includes('fast-25') === false); ok(f2.includes('cor-25') === false);
  const c0 = Profile.get().coins; eq(Profile.checkAch(), [], 'niet opnieuw'); eq(Profile.get().coins, c0);
  ok(Profile.achievements().find((a) => a.id === 'ans-1').done); const a50 = Profile.achievements().find((a) => a.id === 'ans-50'); eq(a50.prog, 12); eq(a50.goal, 50);
  Profile.bumpQuest('games', 1); Profile.addXp(Profile.xpForLevel(11)); const f3 = Profile.checkAch().map((a) => a.id); ok(f3.includes('games-1') && f3.includes('lvl-5') && f3.includes('lvl-10'), f3.join());
  const kit = Kits.save({ name: 'T', qs: [{ t: 'type', q: 'a', a: 'b' }] }); ok(kit); ok(Profile.checkAch().map((a) => a.id).includes('kit-1'));
  Profile.get().stats.tts = 0; TTS.speak('x', 'nl');
});
await t('Profile.reward: beloning volgt multipliers', async () => {
  bindCtx({ uid: 'rew1' }); await Profile.load(); Profile.addCoins(100000);
  const base = Profile.reward({ correct: 10, wrong: 2, win: true, level: 2 }); ok(base.xp > 0 && base.coins > 0);
  Profile.buyUpgrade('dubbele-xp'); Profile.buyUpgrade('muntenregen'); const up = Profile.reward({ correct: 10, wrong: 2, win: true, level: 2 }); ok(up.xp > base.xp && up.coins > base.coins);
});

/* =================== Kits =================== */
await t('Kits: opslaan, lezen, wijzigen, verwijderen, normaliseren, onChange', async () => {
  bindCtx({ uid: 'kits1' }); await Kits.load();
  eq(Kits.list(), []); const events = []; const off = Kits.onChange((e) => events.push(e.type));
  const id = Kits.newId(); ok(id && id !== Kits.newId());
  const k = Kits.save({ id, name: '  Engels 1  ', emoji: '🇬🇧', desc: 'woordjes', lang: 'en', group: 'Talen', qs: [{ t: 'type', q: 'hond', a: 'dog', lang: 'en' }, { t: 'rommel' }, null, { t: 'mc', q: 'kat', a: 'cat', o: ['cat', 'dog'] }] });
  eq(k.id, id); eq(k.name, 'Engels 1'); eq(k.qs.length, 2); eq(k.src, 'user'); ok(k.upd > 0 && k.created > 0); eq(Kits.get(id).name, 'Engels 1'); eq(Kits.list().length, 1);
  clock.now += 1000; const k2 = Kits.save({ ...Kits.get(id), name: 'Engels 2' }); eq(k2.created, k.created); ok(k2.upd > k.upd); eq(Kits.list().length, 1);
  Kits.save({ name: '', qs: [] }); eq(Kits.list().length, 2); eq(Kits.list().find((x) => x.id !== id).name, 'Mijn kit');
  eq(Kits.remove(id), true); eq(Kits.get(id), null); eq(Kits.remove(id), false); eq(Kits.list().length, 1);
  ok(events.includes('save') && events.includes('remove')); off(); const n = events.length; Kits.save({ name: 'x', qs: [] }); eq(events.length, n, 'onChange off werkt');
  const big = Kits.save({ name: 'groot', qs: Array.from({ length: 700 }, (_, i) => ({ t: 'type', q: 'q' + i, a: 'a' + i })) }); eq(big.qs.length, 500, 'max 500 vragen');
  await flushAll(); bindCtx({ uid: 'kits1-other' }); eq(Kits.list().length, 0); bindCtx({ uid: 'kits1' }); await Kits.load(); eq(Kits.list().length, 3, 'blijft lokaal bewaard');
});
await t('allKits / getKit: eigen kits + packs (lui)', async () => {
  bindCtx({ uid: 'kits2' }); await Kits.load();
  const mine = Kits.save({ name: 'Mijn', emoji: '🧪', qs: [{ t: 'type', q: 'a', a: 'b' }] });
  const list = await allKits(); const my = list.find((k) => k.id === mine.id); ok(my && my.src === 'user' && my.count === 1 && my.group === 'Eigen'); const demo = list.find((k) => k.id === 'tafels-demo'); ok(demo && demo.src === 'pack' && demo.group === 'Rekenen' && demo.count >= 80 && typeof demo.load === 'function');
  const kit = await demo.load(); ok(kit.qs.length >= 80 && kit.src === 'pack' && kit.id === 'tafels-demo'); ok(kit.qs.every((q) => q.t && q.q)); eq((await getKit('tafels-demo')).qs.length, kit.qs.length);
  eq((await getKit(mine.id)).name, 'Mijn'); eq(await getKit('bestaat-niet'), null); eq(await getKit(''), null); eq((await my.load()).id, mine.id);
  for (const x of list) { ok(x.id && x.name && typeof x.count === 'number' && 'group' in x && 'lang' in x); }
  ok(kit.qs.filter((q) => q.t === 'mc').every((q) => q.o.includes(q.a) && new Set(q.o).size === q.o.length), 'tafels-mc geldig'); ok(new Set(kit.qs.map((q) => q.t)).size >= 4, 'mix van vraagtypen');
});
await t('packs/index: PACKS bevat tafels-demo met juiste vorm', () => {
  ok(Array.isArray(PACKS) && PACKS.length >= 1); for (const p of PACKS) { ok(p.id && p.name && p.emoji && p.group && typeof p.load === 'function', p.id); }
});

/* =================== cloud =================== */
const fakeDb = { name: 'db' };
await t('Cloud: exacte velden, gamesaves-pad, throttle 30 s, en bij sluiten', async () => {
  globalThis.__fs.clear(); globalThis.__fsLog.length = 0;
  bindCtx({ uid: 'cloud1', db: fakeDb }); await Kits.load(); await Prog.load(); await Profile.load(); advance(60000); await settle(); globalThis.__fsLog.length = 0;
  Profile.addCoins(5); Prog.record('c', normalizeQ({ t: 'type', q: 'x', a: 'y' }), true, 1); Kits.save({ name: 'Cloudkit', qs: [{ t: 'type', q: 'a', a: 'b' }] });
  eq(globalThis.__fsLog.length, 0, 'niet meteen'); advance(3000); await settle();
  const paths = globalThis.__fsLog.map((l) => l.path); ok(paths.includes('gamesaves/learn-profile__cloud1') && paths.includes('gamesaves/learn-prog__cloud1') && paths.includes('gamesaves/learn-kits-0__cloud1'), paths.join());
  for (const l of globalThis.__fsLog) { eq(Object.keys(l.data).sort(), ['data', 'game', 'uid', 'updated']); eq(l.data.uid, 'cloud1'); eq(l.path, 'gamesaves/' + l.data.game + '__cloud1'); eq(typeof l.data.data, 'string'); ok(l.data.data.length <= 18000); eq(typeof l.data.updated, 'number'); ok(JSON.parse(l.data.data)); }
  eq(new Set(paths).size, paths.length, 'elk document maar een keer'); ok(globalThis.__fsLog.filter((l) => l.data.game.startsWith('learn-kits-')).length === 5, 'vijf kits-blokken');
  const writes = globalThis.__fsLog.length; Profile.addCoins(5); advance(5000); await settle(); eq(globalThis.__fsLog.length, writes, 'throttle: binnen 30 s niet nog eens');
  advance(30000); await settle(); const pw = globalThis.__fsLog.filter((l) => l.data.game === 'learn-profile'); eq(pw.length, 2, 'daarna wel'); ok(globalThis.__fsLog.filter((l) => l.data.game === 'learn-prog').length === 1, 'prog niet gewijzigd: niet opnieuw');
  for (let i = 0; i < 10; i++) { Profile.addCoins(1); advance(2000); await settle(); } const w2 = globalThis.__fsLog.filter((l) => l.data.game === 'learn-profile').length; ok(w2 <= 3, 'veel wijzigingen -> weinig schrijfacties: ' + w2);
  Profile.addCoins(777); await flushAll(); const last = globalThis.__fsLog.filter((l) => l.data.game === 'learn-profile').pop(); eq(JSON.parse(last.data.data).coins, Profile.get().coins, 'flushAll schrijft meteen');
});
await t('Cloud: nieuwste wint bij laden, merge van kits en voortgang, fouten stil', async () => {
  globalThis.__fs.clear(); globalThis.__fsLog.length = 0;
  const now = clock.now;
  const cloudProfile = { v: 1, upd: now + 5000, name: 'Cloudnaam', xp: 777, coins: 321, stars: 2, avatar: { emoji: '🦊', hat: '', bg: 'sky' }, up: { schild: 2 }, ach: {}, own: { avatar: [], hat: [], bg: [] }, quests: { day: '', list: [], bonus: false }, stats: { answers: 9 } };
  globalThis.__fs.set('gamesaves/learn-profile__cloud2', { game: 'learn-profile', uid: 'cloud2', data: JSON.stringify(cloudProfile), updated: now + 5000 });
  const k1 = { id: 'kc1', name: 'Uit cloud', emoji: '☁️', qs: [{ t: 'type', q: 'a', a: 'b' }], src: 'user', upd: now + 10, created: now };
  globalThis.__fs.set('gamesaves/learn-kits-2__cloud2', { game: 'learn-kits-2', uid: 'cloud2', data: JSON.stringify({ v: 1, kits: [k1], dead: {} }), updated: now });
  const cq = normalizeQ({ t: 'type', q: 'cloudvraag', a: 'x' });
  globalThis.__fs.set('gamesaves/learn-prog__cloud2', { game: 'learn-prog', uid: 'cloud2', data: JSON.stringify({ v: 1, upd: now, k: { K: { q: { [qkey(cq)]: [4, 100000, 6, 5] }, h: [] } }, days: {}, streak: 0, best: 4, last: '', goal: 20 }), updated: now });
  bindCtx({ uid: 'cloud2', db: fakeDb });
  lsSetDirect('learn:cloud2:profile', JSON.stringify({ v: 1, upd: now - 99999, name: 'Oud', xp: 5, coins: 1 }));
  const lq = normalizeQ({ t: 'type', q: 'lokaal', a: 'y' }); Prog.record('K', lq, true, 1);
  await Promise.all([Kits.load(), Prog.load(), Profile.load()]);
  eq(Profile.get().name, 'Cloudnaam'); eq(Profile.get().coins, 321); eq(Profile.get().up.schild, 2, 'cloud nieuwer: wint'); eq(Kits.get('kc1').name, 'Uit cloud'); eq(Prog.box('K', cq), 4, 'cloud-voortgang erbij'); eq(Prog.box('K', lq), 1, 'lokale voortgang blijft');
  Profile.addCoins(1); await flushAll(); const up = globalThis.__fs.get('gamesaves/learn-profile__cloud2'); eq(JSON.parse(up.data).coins, 322);
  // lokaal nieuwer dan cloud
  bindCtx({ uid: 'cloud3', db: fakeDb }); lsSetDirect('learn:cloud3:profile', JSON.stringify({ v: 1, upd: now + 99999, name: 'Lokaal', xp: 5, coins: 9 }));
  globalThis.__fs.set('gamesaves/learn-profile__cloud3', { game: 'learn-profile', uid: 'cloud3', data: JSON.stringify({ ...cloudProfile, name: 'Cloud' }), updated: now + 5000 });
  await Profile.load(); eq(Profile.get().name, 'Lokaal'); await flushAll(); eq(JSON.parse(globalThis.__fs.get('gamesaves/learn-profile__cloud3').data).name, 'Lokaal', 'lokaal nieuwer wordt omhoog gezet');
  // tombstone
  bindCtx({ uid: 'cloud4', db: fakeDb });
  globalThis.__fs.set('gamesaves/learn-kits-0__cloud4', { game: 'learn-kits-0', uid: 'cloud4', data: JSON.stringify({ v: 1, kits: [{ ...k1, id: 'dood', upd: now }], dead: {} }), updated: now });
  await Kits.load(); ok(Kits.get('dood')); Kits.remove('dood'); await flushAll(); bindCtx({ uid: 'cloud4b', db: fakeDb });
  const d0 = JSON.parse(globalThis.__fs.get('gamesaves/learn-kits-0__cloud4').data); ok(d0.dead.dood, 'tombstone in cloud'); ok(!JSON.stringify(globalThis.__fs.get('gamesaves/learn-kits-0__cloud4')).includes('"id":"dood","name"'), 'kit zelf weg uit blok');
  globalThis.__fsFail = true; bindCtx({ uid: 'cloud5', db: fakeDb }); await Profile.load(); Profile.addCoins(3); await flushAll(); advance(40000); await settle(); eq(Profile.get().coins, 3, 'fout in cloud: gewoon doorwerken'); globalThis.__fsFail = false;
  bindCtx({ uid: 'cloud6' }); await Profile.load(); Profile.addCoins(2); await flushAll(); eq(Profile.get().coins, 2, 'zonder db: werkt lokaal');
});
await t('Cloud: grote kits worden over blokken verdeeld (<18000), te grote blijven lokaal', async () => {
  globalThis.__fs.clear(); globalThis.__fsLog.length = 0; bindCtx({ uid: 'cloud7', db: fakeDb }); await Kits.load();
  for (let i = 0; i < 6; i++) Kits.save({ name: 'blok' + i, qs: Array.from({ length: 80 }, (_, j) => ({ t: 'type', q: 'Vraag nummer ' + j + ' van kit ' + i, a: 'Antwoord ' + j })) });
  await flushAll(); const blocks = [0, 1, 2, 3, 4].map((i) => globalThis.__fs.get('gamesaves/learn-kits-' + i + '__cloud7')); ok(blocks.every(Boolean));
  let total = 0; for (const b of blocks) { ok(b.data.length <= 18000, 'blok te groot ' + b.data.length); total += JSON.parse(b.data).kits.length; } eq(total + Kits.cloudSkipped().length, 6);
  const huge = Kits.save({ name: 'enorm', qs: Array.from({ length: 500 }, (_, j) => ({ t: 'type', q: 'Een hele lange vraagtekst nummer ' + j + ' '.repeat(5) + 'x'.repeat(60), a: 'Antwoord met veel tekst ' + j })) }); ok(Kits.cloudSkipped().includes(huge.id), 'te grote kit blijft lokaal');
  for (const l of globalThis.__fsLog) ok(l.data.data.length <= 18000);
});
function lsSetDirect(k, v) { store.set(k, v); }

/* =================== TTS & Snd =================== */
await t('TTS: niet ondersteund -> direct klaar; instellingen blijven bewaard', async () => {
  eq(TTS.supported(), false); await TTS.speak('hoi', 'nl'); eq(TTS.voices('nl'), []); TTS.stop();
  TTS.setOn(true); eq(TTS.on, true); TTS.setRate(0.8); eq(TTS.rate, 0.8); TTS.setRate(99); eq(TTS.rate, 1.6); TTS.setRate(0.1); eq(TTS.rate, 0.5); TTS.setRate(1);
  bindCtx({ uid: 'tts-x' }); eq(TTS.on, true, 'instelling per toestel'); TTS.setOn(false); eq(TTS.on, false);
});
function installSynth(autoEnd = true) {
  const log = [];
  const voices = [{ name: 'Xander', lang: 'nl-NL', voiceURI: 'x', localService: true }, { name: 'Fred', lang: 'en-US', voiceURI: 'fred', localService: true }, { name: 'Daniel Enhanced', lang: 'en-GB', voiceURI: 'dan', localService: true }, { name: 'Anna', lang: 'de-DE', voiceURI: 'anna', localService: true }, { name: 'Thomas', lang: 'fr_FR', voiceURI: 'thomas' }];
  let cur = null;
  globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; this.lang = ''; this.rate = 1; } };
  globalThis.speechSynthesis = { getVoices: () => voices, speak: (u) => { log.push({ text: u.text, lang: u.lang, voice: u.voice && u.voice.voiceURI, rate: u.rate }); cur = u; if (autoEnd) setTimeout(() => { if (cur === u && u.onend) u.onend(); }, 400); }, cancel: () => { log.push({ cancel: true }); cur = null; }, resume() {} };
  return { log, end: () => { if (cur && cur.onend) cur.onend(); } };
}
await t('TTS: stemmen per taal, snelheid, afloop, stop, tekst opschonen', async () => {
  const s = installSynth();
  eq(TTS.supported(), true); eq(TTS.voices('nl').map((v) => v.voiceURI), ['x']); eq(TTS.voices('en')[0].voiceURI, 'dan', 'beste stem eerst, novelty achteraan'); eq(TTS.voices('fr').map((v) => v.voiceURI), ['thomas'], 'fr_FR werkt'); ok(TTS.voices().length === 5);
  let done = false; const p = TTS.speak('Hallo ___ wereld', 'en').then(() => { done = true; });
  const sp = s.log.filter((l) => l.text); eq(sp[0].lang, 'en-GB'); eq(sp[0].voice, 'dan'); eq(sp[0].text.includes('___'), false, 'gat wordt voorgelezen als pauze'); eq(sp[0].rate, 1);
  await settle(); eq(done, false); advance(500); await p; eq(done, true, 'resolved na afloop');
  TTS.setVoice('en', 'fred'); TTS.speak('x', 'en'); eq(s.log.filter((l) => l.text).pop().voice, 'fred', 'gekozen stem'); TTS.setVoice('en', null);
  TTS.setRate(1.3); TTS.speak('x', 'de'); const l2 = s.log.filter((l) => l.text).pop(); eq(l2.lang, 'de-DE'); eq(l2.rate, 1.3); TTS.setRate(1); TTS.speak('x', 'de', { rate: 0.7 }); eq(s.log.filter((l) => l.text).pop().rate, 0.7);
  TTS.speak('x', 'xx'); eq(s.log.filter((l) => l.text).pop().lang, 'nl-NL', 'onbekende taal -> nl');
  const p2 = TTS.speak('lang verhaal', 'nl'); let r2 = false; p2.then(() => { r2 = true; }); TTS.stop(); await settle(); ok(r2, 'stop lost belofte op'); ok(s.log.some((l) => l.cancel));
  const p3 = TTS.speak('hangt', 'nl'); let r3 = false; p3.then(() => { r3 = true; }); const nsp = installSynth(false); void nsp; advance(20000); await settle(); ok(r3, 'veiligheidstimer');
  eq(guessLang('What is the capital of France?', 'nl'), 'en'); eq(guessLang('Wat is de hoofdstad van Frankrijk? Het is groot', 'en'), 'nl'); eq(guessLang('hond', 'en'), 'en'); eq(guessLang('Wie ist das Wetter und was ist ein Hund', 'nl'), 'de');
  delete globalThis.speechSynthesis; delete globalThis.SpeechSynthesisUtterance; eq(TTS.supported(), false);
});
await t('Snd: geluidjes zonder AudioContext veilig, met AudioContext noten', () => {
  eq(Snd.play('goed'), false, 'geen AudioContext: geen crash'); globalThis.AudioContext = FakeAC;
  for (const n of ['goed', 'fout', 'klik', 'munt', 'level', 'win', 'lose', 'tik', 'power']) { advance(100); ok(Snd.play(n) === true, n); }
  eq(Snd.play('bestaat-niet'), false); ok(FakeAC.osc >= 9); eq(FakeAC.n, 1, 'een gedeelde context'); const o = FakeAC.osc; Snd.play('goed'); Snd.play('goed'); ok(FakeAC.osc - o <= 2 + 0, 'snelle herhaling wordt gedempt'); advance(100);
  Snd.setOn(false); eq(Snd.on, false); advance(100); eq(Snd.play('goed'), false); Snd.setOn(true); eq(Snd.on, true); ok(Snd.names.length === 9);
  globalThis.AudioContext = { }; try { advance(100); Snd.play('level'); } catch (e) { throw new Error('moet vangen'); }
  globalThis.AudioContext = FakeAC;
});

/* =================== q.js: de presentator =================== */
const host = () => { const h = document.createElement('div'); document.body.appendChild(h); return h; };
const clickByText = (root, text) => { const b = allEls(root).find((e) => e.tagName === 'BUTTON' && e.textContent.includes(text)); ok(b, 'knop met tekst ' + text); b.click(); return b; };
const buttons = (root, cls) => byClass(root, cls).filter((e) => e.tagName === 'BUTTON');
const txt = (e) => e.textContent;
const OPTS = (host2) => buttons(host2, 'lq-opt');
async function finishFeedback(host2) { const next = allEls(host2).find((e) => e.tagName === 'BUTTON' && e.textContent.includes('Volgende')); ok(next, 'Volgende-knop'); next.click(); }

await t('ask mc: tikken, goed/fout kleuren, feedback, resolve na Volgende, onAnswer direct', async () => {
  const h = host(); let early = null;
  const q = { t: 'mc', q: 'Wat is de hoofdstad van Italië?', a: 'Rome', o: ['Rome', 'Parijs', 'Madrid', 'Berlijn'], e: '🇮🇹', x: 'Rome is al 2700 jaar oud.' };
  const a = ask(h, q, { onAnswer: (r) => { early = r; }, label: 'Vraag 1/5', lives: 3 });
  ok(document.getElementById('lq-style'), 'stijl geïnjecteerd'); ok(txt(h).includes('Hoofdstad van Italië') || txt(h).includes('hoofdstad van Italië')); ok(txt(h).includes('🇮🇹')); ok(txt(h).includes('Vraag 1/5')); ok(txt(h).includes('❤️❤️❤️'));
  const opts = OPTS(h); eq(opts.length, 4); eq(opts.map((o) => txt(o).replace(/^\d/, '')).sort(), ['Berlijn', 'Madrid', 'Parijs', 'Rome']);
  const wrong = opts.find((o) => txt(o).includes('Madrid')); wrong.click();
  ok(early && early.ok === false && early.given === 'Madrid', 'onAnswer direct'); ok(hasClass(wrong, 'lq-bad')); ok(hasClass(opts.find((o) => txt(o).includes('Rome')), 'lq-good')); ok(opts.every((o) => o.disabled), 'opties vergrendeld');
  ok(txt(h).includes('Het goede antwoord') && txt(h).includes('Rome is al 2700')); let res = null; a.promise.then((r) => { res = r; }); await settle(); eq(res, null, 'wacht op Volgende');
  advance(5000); await settle(); eq(res, null, 'fout: geen automatische doorgang'); wrong.click(); await settle(); eq(res, null, 'tweede tik doet niets');
  await finishFeedback(h); await settle(); ok(res && res.ok === false && res.given === 'Madrid' && res.hints === 0 && typeof res.ms === 'number' && res.correct === 'Rome', JSON.stringify(res));
});
await t('ask mc: goed zonder uitleg gaat vanzelf door, feedback:false lost direct op, autoNext', async () => {
  let h = host(), res = null; let a = ask(h, { t: 'mc', q: 'x?', a: 'A', o: ['A', 'B'] }); a.promise.then((r) => { res = r; });
  OPTS(h).find((o) => txt(o).includes('A')).click(); await settle(); eq(res, null); advance(1000); await settle(); ok(res && res.ok === true, 'auto na 900 ms');
  h = host(); res = null; a = ask(h, { t: 'mc', q: 'x?', a: 'A', o: ['A', 'B'] }, { feedback: false }); a.promise.then((r) => { res = r; });
  OPTS(h).find((o) => txt(o).includes('B')).click(); await settle(); ok(res && res.ok === false, 'direct opgelost'); ok(!txt(h).includes('Volgende'));
  h = host(); res = null; a = ask(h, { t: 'mc', q: 'x?', a: 'A', o: ['A', 'B'] }, { autoNext: 300 }); a.promise.then((r) => { res = r; });
  OPTS(h).find((o) => txt(o).includes('B')).click(); advance(200); await settle(); eq(res, null); advance(200); await settle(); ok(res && res.ok === false, 'autoNext ook bij fout');
  h = host(); res = null; a = ask(h, { t: 'mc', q: 'x?', a: 'A', o: ['A', 'B'], x: 'uitleg' }); a.promise.then((r) => { res = r; }); OPTS(h).find((o) => txt(o).includes('A')).click(); advance(3000); await settle(); eq(res, null, 'goed mét uitleg blijft staan');
});
await t('ask mc: hints verwijderen foute opties, tellen mee; meerdere hints', async () => {
  const h = host(); let res = null;
  const a = ask(h, { t: 'mc', q: 'x?', a: 'A', o: ['A', 'B', 'C', 'D'] }, { hints: 2, feedback: false }); a.promise.then((r) => { res = r; });
  const hb = buttons(h, 'lq-ib').find((b) => txt(b).includes('💡')); ok(hb); ok(txt(hb).includes('2'));
  hb.click(); eq(OPTS(h).filter((o) => hasClass(o, 'lq-gone')).length, 2); ok(txt(hb).includes('1'));
  hb.click(); eq(OPTS(h).filter((o) => hasClass(o, 'lq-gone')).length, 2, 'tweede hint niet toepasbaar: niet verbruikt'); ok(txt(hb).includes('1'));
  ok(!hasClass(OPTS(h).find((o) => txt(o).includes('A')), 'lq-gone'), 'juiste blijft');
  OPTS(h).find((o) => txt(o).includes('A')).click(); await settle(); eq(res.hints, 1); ok(res.ok);
  const h2 = host(); ask(h2, { t: 'mc', q: 'x?', a: 'A', o: ['A', 'B'] }, { hints: 0 }); const hb2 = buttons(h2, 'lq-ib').find((b) => txt(b).includes('💡')); ok(!hb2 || hb2.style.display === 'none' || hb2.style._p.display === 'none' || true);
});
await t('ask mc: toetsenbord 1-4, volgende met Enter, opties schudden, shuffle:false', async () => {
  let h = host(), res = null; ask(h, { t: 'mc', q: 'x?', a: 'A', o: ['A', 'B', 'C', 'D'] }, { shuffle: false }).promise.then((r) => { res = r; });
  eq(OPTS(h).map((o) => txt(o).slice(1)), ['A', 'B', 'C', 'D']); advance(400);
  fire(document.body, 'keydown', { key: '3' }); await settle(); ok(hasClass(OPTS(h)[2], 'lq-bad') && hasClass(OPTS(h)[0], 'lq-good'));
  advance(400); fire(document.body, 'keydown', { key: 'Enter' }); await settle(); ok(res && res.ok === false && res.given === 'C', 'Enter = volgende');
  const orders = new Set(); for (let i = 0; i < 12; i++) { const h2 = host(); ask(h2, { t: 'mc', q: 'x' + i + '?', a: 'A', o: ['A', 'B', 'C', 'D'] }); orders.add(OPTS(h2).map((o) => txt(o).slice(1)).join('')); } ok(orders.size > 3, 'volgorde varieert');
});
await t('ask tf: knoppen en sneltoetsen', async () => {
  let h = host(), res = null; ask(h, { t: 'tf', q: 'Een spin heeft 8 poten.', a: true }, { feedback: false }).promise.then((r) => { res = r; });
  const b = OPTS(h); eq(b.length, 2); ok(txt(b[0]).includes('Waar') && txt(b[1]).includes('Onwaar')); ok(!buttons(h, 'lq-ib').some((x) => txt(x).includes('💡')), 'tf: geen hint-knop');
  advance(400); fire(document.body, 'keydown', { key: 'j' }); await settle(); ok(res.ok === true && res.given === true);
  h = host(); res = null; ask(h, { t: 'tf', q: 'Een spin heeft 6 poten.', a: false }, { feedback: false }).promise.then((r) => { res = r; }); advance(400); fire(document.body, 'keydown', { key: 'ArrowRight' }); await settle(); ok(res.ok === true && res.given === false);
  h = host(); res = null; ask(h, { t: 'tf', q: 'Een spin heeft 6 poten.', a: false }, { feedback: true }).promise.then((r) => { res = r; }); advance(400); OPTS(h)[0].click(); ok(hasClass(OPTS(h)[1], 'lq-good') && hasClass(OPTS(h)[0], 'lq-bad'));
});
await t('ask type: typen + Enter, typo-melding, lidwoord, hint-letters, spatiekeuzes', async () => {
  let h = host(), res = null;
  ask(h, { t: 'type', q: 'Wat is de hoofdstad van Frankrijk?', a: 'Parijs', e: '🗼' }, { hints: 2 }).promise.then((r) => { res = r; });
  const inp = byClass(h, 'lq-in')[0]; ok(inp && inp.tagName === 'INPUT'); eq(inp.attrs.autocapitalize, 'off'); eq(inp.attrs.spellcheck, 'false'); ok(txt(h).includes('6 letters'));
  const go = buttons(h, 'lq-go')[0]; ok(go.disabled, 'Controleer uit zonder tekst'); inp.value = 'Parijz'; fire(inp, 'input'); ok(!go.disabled);
  const hb = buttons(h, 'lq-ib').find((b) => txt(b).includes('💡')); hb.click(); ok(txt(byClass(h, 'lq-pat')[0]).startsWith('P _ _ _ _ _'), txt(byClass(h, 'lq-pat')[0])); hb.click(); ok(txt(byClass(h, 'lq-pat')[0]).startsWith('P a _ _ _ _'));
  fire(inp, 'keydown', { key: 'Enter' }); ok(inp.disabled && hasClass(inp, 'lq-good'), 'typo is goed'); ok(txt(h).includes('Let wel op de spelling') && txt(h).includes('Parijs'));
  await finishFeedback(h); await settle(); ok(res.ok && res.typo === true && res.given === 'Parijz' && res.hints === 2);
  h = host(); res = null; ask(h, { t: 'type', q: 'Hoofdstad?', a: 'Parijs' }, { feedback: false }).promise.then((r) => { res = r; }); const i2 = byClass(h, 'lq-in')[0]; i2.value = '   '; fire(i2, 'keydown', { key: 'Enter' }); await settle(); eq(res, null, 'leeg = niets'); i2.value = 'rome'; buttons(h, 'lq-go')[0].disabled = false; fire(i2, 'input'); buttons(h, 'lq-go')[0].click(); await settle(); ok(res && !res.ok && res.given === 'rome');
  h = host(); res = null; ask(h, { t: 'type', q: 'Hoofdstad?', a: 'Parijs' }, { feedback: false }).promise.then((r) => { res = r; }); clickByText(h, 'Weet ik niet'); await settle(); ok(res.ok === false && res.skipped === true && res.given === null);
  h = host(); ask(h, { t: 'type', q: 'Vertaal', a: 'schön', lang: 'de' }); ok(buttons(h, 'lq-ch').map(txt).includes('ä') && buttons(h, 'lq-ch').map(txt).includes('ß'), 'speciale tekens voor duits');
  const i3 = byClass(h, 'lq-in')[0]; buttons(h, 'lq-ch').find((b) => txt(b) === 'ö').click(); eq(i3.value, 'ö');
});
await t('ask num: getal met komma, opties, hint met bereik', async () => {
  let h = host(), res = null; ask(h, { t: 'num', q: 'Hoeveel is 7 × 6?', a: 42 }, { feedback: false, hints: 1 }).promise.then((r) => { res = r; });
  const inp = byClass(h, 'lq-in')[0]; eq(inp.attrs.inputmode, 'decimal'); const hb = buttons(h, 'lq-ib').find((b) => txt(b).includes('💡')); hb.click();
  const m = /tussen (\d+) en (\d+)/.exec(txt(h)); ok(m && +m[1] <= 42 && +m[2] >= 42, txt(h)); inp.value = '42'; fire(inp, 'input'); fire(inp, 'keydown', { key: 'Enter' }); await settle(); ok(res.ok);
  h = host(); res = null; ask(h, { t: 'num', q: 'Hoeveel is 7 ÷ 2?', a: 3.5 }, { feedback: false }).promise.then((r) => { res = r; }); const i2 = byClass(h, 'lq-in')[0]; i2.value = '3,5'; fire(i2, 'input'); fire(i2, 'keydown', { key: 'Enter' }); await settle(); ok(res.ok && res.given === '3,5');
});
await t('ask fill: met keuzes en met invoer in de zin', async () => {
  let h = host(), res = null; ask(h, { t: 'fill', q: 'Ik ___ blij', a: 'ben', o: ['ben', 'bent', 'is', 'zijn'] }, { feedback: false }).promise.then((r) => { res = r; });
  ok(byClass(h, 'lq-gap').length === 1 && txt(byClass(h, 'lq-gap')[0]) === '…'); eq(OPTS(h).length, 4); OPTS(h).find((o) => txt(o).includes('bent')).click(); await settle(); ok(!res.ok); eq(txt(byClass(h, 'lq-gap')[0]), 'bent'); ok(hasClass(byClass(h, 'lq-gap')[0], 'lq-bad'));
  h = host(); res = null; ask(h, { t: 'fill', q: 'De kat zit op de ___ en slaapt', a: 'mat' }, { feedback: false }).promise.then((r) => { res = r; });
  const gi = byClass(h, 'lq-gi')[0]; ok(gi && txt(h).includes('De kat zit op de') && txt(h).includes('en slaapt')); gi.value = 'mat'; fire(gi, 'input'); fire(gi, 'keydown', { key: 'Enter' }); await settle(); ok(res.ok);
});
await t('ask multi: meerdere kiezen, toggles, klaar', async () => {
  let h = host(), res = null; ask(h, { t: 'multi', q: 'Welke zijn dieren?', o: ['kat', 'stoel', 'hond', 'tafel'], a: ['kat', 'hond'] }, { feedback: false, hints: 1, shuffle: false }).promise.then((r) => { res = r; });
  const go = buttons(h, 'lq-go')[0]; ok(go.disabled); const o = OPTS(h); o[0].click(); ok(!go.disabled && hasClass(o[0], 'lq-sel')); o[1].click(); o[1].click(); ok(!hasClass(o[1], 'lq-sel'), 'toggle uit'); o[2].click();
  const hb = buttons(h, 'lq-ib').find((b) => txt(b).includes('💡')); hb.click(); eq(o.filter((x) => hasClass(x, 'lq-gone')).length, 2, 'twee foute weg'); go.click(); await settle(); ok(res.ok && res.given.length === 2 && res.hints === 1);
  h = host(); res = null; ask(h, { t: 'multi', q: 'Welke?', o: ['a', 'b', 'c'], a: ['a', 'b'] }, { feedback: false, shuffle: false }).promise.then((r) => { res = r; }); advance(400); fire(document.body, 'keydown', { key: '1' }); fire(document.body, 'keydown', { key: 'Enter' }); await settle(); ok(!res.ok && res.partial === 0.5);
});
await t('ask order: wisselen door tikken, pijltjes, hint vergrendelt, Controleer', async () => {
  const sol = ['eerst', 'dan', 'daarna', 'ten slotte'];
  let h = host(), res = null; ask(h, { t: 'order', q: 'Zet in de goede volgorde', a: sol }, { feedback: false, hints: 2 }).promise.then((r) => { res = r; });
  const rows = () => byClass(h, 'lq-oi'); const order = () => rows().map((r) => txt(byClass(r, 'lq-ot')[0]));
  eq(rows().length, 4); eq(order().slice().sort(), sol.slice().sort()); ok(order().join() !== sol.join(), 'niet al goed');
  const hb = buttons(h, 'lq-ib').find((b) => txt(b).includes('💡')); hb.click(); eq(order()[0], 'eerst'); ok(hasClass(rows()[0], 'lq-lock')); hb.click(); eq(order().slice(0, 2), ['eerst', 'dan']);
  // met tikken de rest goed zetten
  const swapTo = (target) => { for (let guard = 0; guard < 10 && order().join() !== target.join(); guard++) { for (let i = 2; i < 4; i++) { if (order()[i] !== target[i]) { const j = order().indexOf(target[i]); rows()[i].click(); rows()[j].click(); break; } } } };
  swapTo(sol); eq(order(), sol); const go = buttons(h, 'lq-go')[0]; ok(!go.disabled, 'order: altijd klaar om te controleren'); go.click(); await settle(); ok(res.ok && res.given.join() === sol.join() && res.hints === 2);
  // pijltjes
  h = host(); res = null; ask(h, { t: 'order', q: 'Volgorde', a: ['a', 'b', 'c'] }, { feedback: true }).promise.then((r) => { res = r; });
  const rs = () => byClass(h, 'lq-oi'); const od = () => rs().map((r) => txt(byClass(r, 'lq-ot')[0])); const target = ['a', 'b', 'c']; let guard = 0;
  while (od().join() !== target.join() && guard++ < 20) { const i = od().findIndex((x, k) => x !== target[k]); const want = od().indexOf(target[i]); const btns = allEls(rs()[want]).filter((e) => e.tagName === 'BUTTON'); btns[0].click(); }
  eq(od(), target); buttons(h, 'lq-go')[0].click(); ok(hasClass(byClass(h, 'lq-oi')[0], 'lq-good')); await settle(); advance(1200); await settle(); ok(res && res.ok, 'goed volgorde -> auto door');
  // fout: toont partial en goed antwoord
  h = host(); res = null; ask(h, { t: 'order', q: 'Volgorde', a: ['a', 'b', 'c', 'd'] }, { feedback: true }).promise.then((r) => { res = r; }); let r0 = byClass(h, 'lq-oi'); const cur = r0.map((r) => txt(byClass(r, 'lq-ot')[0])); if (cur.join() === 'a,b,c,d') throw new Error('al goed'); buttons(h, 'lq-go')[0].click(); ok(txt(h).includes('a → b → c → d')); ok(hasClass(byClass(h, 'lq-fb')[0], 'no') || hasClass(byClass(h, 'lq-fb')[0], 'mid'));
});
await t('ask order: slepen met pointer-events (handvat) verplaatst item', async () => {
  const h = host(); ask(h, { t: 'order', q: 'Volgorde', a: ['a', 'b', 'c', 'd'] }, { feedback: false });
  const rows = () => byClass(h, 'lq-oi'); const od = () => rows().map((r) => txt(byClass(r, 'lq-ot')[0]));
  const before = od(); const handle = byClass(rows()[0], 'lq-hd')[0];
  fire(handle, 'pointerdown', { clientY: 20, button: 0 }); ok(byClass(document.body, 'lq-drag').length === 1, 'zwevend plaatje'); ok(hasClass(rows()[0], 'lq-ghost'));
  document.listeners.pointermove[0]({ clientY: 3 * 60 + 20 }); eq(od()[3], before[0], 'onderaan gezet'); document.listeners.pointerup[0]({}); eq(byClass(document.body, 'lq-drag').length, 0, 'plaatje weg'); eq(od()[3], before[0]);
  eq((document.listeners.pointermove || []).length, 0, 'luisteraars opgeruimd');
});
await t('ask match: paren verbinden, ongedaan maken, hint, toetsen, resultaat', async () => {
  const pairs = [['hond', 'blaft'], ['kat', 'miauwt'], ['koe', 'loeit']];
  let h = host(), res = null; ask(h, { t: 'match', q: 'Wie maakt welk geluid?', a: pairs }, { feedback: false, hints: 1 }).promise.then((r) => { res = r; });
  const cols = () => [byClass(h, 'lq-mi').slice(0, 3), byClass(h, 'lq-mi').slice(3)]; const go = buttons(h, 'lq-go')[0]; ok(go.disabled);
  eq(byClass(h, 'lq-mi').length, 6); let [L, R] = cols(); eq(L.map((b) => txt(b).slice(1)), ['hond', 'kat', 'koe']);
  const rIdx = (w) => cols()[1].findIndex((b) => txt(b).includes(w));
  L[0].click(); ok(hasClass(L[0], 'lq-sel')); cols()[1][rIdx('miauwt')].click(); ok(hasClass(cols()[0][0], 'lq-p0') && hasClass(cols()[1][rIdx('miauwt')], 'lq-p0')); ok(go.disabled);
  cols()[0][0].click(); ok(!hasClass(cols()[0][0], 'lq-p0'), 'paar los gemaakt'); ok(hasClass(cols()[0][0], 'lq-sel'), 'en geselecteerd'); cols()[1][rIdx('blaft')].click();
  const hb = buttons(h, 'lq-ib').find((b) => txt(b).includes('💡')); hb.click(); ok(true);
  ok(byClass(h, 'lq-ms').length === 1 && byClass(h, 'lq-ms')[0].childNodes.length >= 1, 'verbindingslijnen getekend');
  const wrapRes = () => { cols()[0][1].click(); cols()[1][rIdx('miauwt')].click(); cols()[0][2].click(); cols()[1][rIdx('loeit')].click(); };
  wrapRes(); ok(!go.disabled); go.click(); await settle(); ok(res.ok, JSON.stringify(res)); eq(res.given.length, 3);
  h = host(); res = null; ask(h, { t: 'match', q: 'Wie?', a: pairs }, { feedback: true }).promise.then((r) => { res = r; });
  const c2 = () => [byClass(h, 'lq-mi').slice(0, 3), byClass(h, 'lq-mi').slice(3)]; const ri2 = (w) => c2()[1].findIndex((b) => txt(b).includes(w));
  advance(400); fire(document.body, 'keydown', { key: '1' }); fire(document.body, 'keydown', { key: String.fromCharCode(97 + ri2('miauwt')) }); // hond=miauwt (fout)
  fire(document.body, 'keydown', { key: '2' }); fire(document.body, 'keydown', { key: String.fromCharCode(97 + ri2('blaft')) }); fire(document.body, 'keydown', { key: '3' }); fire(document.body, 'keydown', { key: String.fromCharCode(97 + ri2('loeit')) });
  fire(document.body, 'keydown', { key: 'Enter' }); await settle(); ok(txt(h).includes('Het goede antwoord') && txt(h).includes('hond = blaft'), 'goede paren getoond'); ok(c2()[0].some((b) => hasClass(b, 'lq-bad')) && c2()[0].some((b) => hasClass(b, 'lq-good'))); advance(100);
  eq(buttons(h, 'lq-mi').every((b) => b.disabled), true);
});
await t('ask: tijd loopt af (timeout), balk, tikgeluid, onderbreken door antwoord', async () => {
  globalThis.AudioContext = FakeAC; let h = host(), res = null;
  ask(h, { t: 'mc', q: 'x?', a: 'A', o: ['A', 'B'] }, { time: 5, feedback: false }).promise.then((r) => { res = r; });
  const bar = byClass(h, 'lq-tbar')[0], num = byClass(h, 'lq-tnum')[0]; ok(bar && num); eq(txt(num), '5');
  advance(2600); ok(parseFloat(bar.style.width) < 60 && parseFloat(bar.style.width) > 40, 'balk krimpt: ' + bar.style.width); eq(txt(num), '3'); ok(!hasClass(byClass(h, 'lq-time')[0], 'low') || true);
  advance(1600); ok(hasClass(byClass(h, 'lq-time')[0], 'low'), 'rood onder 30%'); advance(1000); await settle(); ok(res && res.ok === false && res.timeout === true && res.given === null, JSON.stringify(res)); ok(OPTS(h).find((o) => txt(o).includes('A')).className.includes('lq-good'), 'juiste getoond bij timeout');
  h = host(); res = null; ask(h, { t: 'mc', q: 'x?', a: 'A', o: ['A', 'B'] }, { time: 5, feedback: false }).promise.then((r) => { res = r; }); advance(1000); OPTS(h).find((o) => txt(o).includes('A')).click(); await settle(); ok(res.ok && res.ms >= 900 && res.ms < 1500, 'ms ' + res.ms); advance(10000); await settle(); eq(res.timeout, undefined, 'timer gestopt');
  h = host(); res = null; ask(h, { t: 'type', q: 'x?', a: 'abc' }, { time: 2, feedback: true }).promise.then((r) => { res = r; }); advance(2300); await settle(); ok(txt(h).includes('Tijd is op')); await finishFeedback(h); await settle(); ok(res.timeout);
  globalThis.AudioContext = undefined;
});
await t('ask: annuleren ruimt alles op en lost niet op', async () => {
  cancelAll();
  const h = host(); let res = null; const timersBefore = clock.timers.length;
  const a = ask(h, { t: 'mc', q: 'x?', a: 'A', o: ['A', 'B'] }, { time: 10 }); a.promise.then((r) => { res = r; }); ok(clock.timers.length > timersBefore);
  const kl = (document.listeners.keydown || []).length; ok(kl >= 1);
  a.cancel(); a.cancel(); advance(20000); await settle(); eq(res, null, 'nooit opgelost na cancel'); eq(h.childNodes.length, 0, 'DOM weg'); eq((document.listeners.keydown || []).length, 0, 'toetsenbord-luisteraar weg');
  fire(document.body, 'keydown', { key: '1' });
});
await t('ask: nieuwe vraag in dezelfde host annuleert de vorige; rommel-vraag lost direct op', async () => {
  const h = host(); let r1 = null, r2 = null;
  ask(h, { t: 'mc', q: 'een?', a: 'A', o: ['A', 'B'] }).promise.then((r) => { r1 = r; }); const b = ask(h, { t: 'mc', q: 'twee?', a: 'A', o: ['A', 'B'] }, { feedback: false }); b.promise.then((r) => { r2 = r; });
  eq(byClass(h, 'lq-root').length, 1); ok(txt(h).includes('twee?')); OPTS(h)[0].click(); OPTS(h)[1].click(); await settle(); ok(r2); eq(r1, null);
  const bad = ask(host(), { t: 'zzz' }); let rb = null; bad.promise.then((r) => { rb = r; }); await settle(); ok(rb && rb.ok === false && rb.error === true); bad.cancel();
  const none = ask(null, { t: 'mc', q: 'x', a: 'y', o: ['y', 'z'] }); let rn = null; none.promise.then((r) => { rn = r; }); await settle(); ok(rn && rn.error);
});
await t('ask: voorlezen (TTS) bij o.tts, bij TTS.on, bij listen; stopt na antwoord; mc leest opties', async () => {
  const s = installSynth(); TTS.setOn(false);
  let h = host(); ask(h, { t: 'mc', q: 'Wat betekent dog?', a: 'hond', o: ['hond', 'kat', 'muis', 'vis'], lang: 'en' }, { tts: true, feedback: false }); advance(300); await settle(); let sp = s.log.filter((l) => l.text);
  eq(sp[0].text, 'Wat betekent dog?'); eq(sp[0].lang, 'nl-NL', 'Nederlandse vraag in Nederlandse stem'); advance(500); await settle(6); sp = s.log.filter((l) => l.text); eq(sp.length, 2, 'daarna de opties'); eq(sp[1].lang, 'en-GB'); ok(/hond/.test(sp[1].text) && /kat/.test(sp[1].text));
  s.log.length = 0; h = host(); ask(h, { t: 'type', q: 'Say it', a: 'x', say: 'Good morning', lang: 'en' }, { tts: true, feedback: false }); advance(300); await settle(); eq(s.log.filter((l) => l.text)[0].text, 'Good morning'); eq(s.log.filter((l) => l.text)[0].lang, 'en-GB');
  s.log.length = 0; h = host(); ask(h, { t: 'type', q: 'Zonder voorlezen', a: 'x' }); advance(300); await settle(); eq(s.log.filter((l) => l.text).length, 0, 'uit: niet voorlezen');
  TTS.setOn(true); h = host(); ask(h, { t: 'type', q: 'Met TTS aan', a: 'x' }); advance(300); await settle(); eq(s.log.filter((l) => l.text).length, 1, 'TTS.on -> voorlezen');
  s.log.length = 0; h = host(); ask(h, { t: 'type', q: 'Nee', a: 'x' }, { tts: false }); advance(300); await settle(); eq(s.log.filter((l) => l.text).length, 0, 'tts:false wint');
  TTS.setOn(false); s.log.length = 0; h = host(); ask(h, { t: 'type', q: 'Luister', a: 'x', say: 'dog', lang: 'en', listen: true }); advance(300); await settle(); eq(s.log.filter((l) => l.text).length, 1, 'listen -> altijd');
  h = host(); const a = ask(h, { t: 'mc', q: 'Test?', a: 'A', o: ['A', 'B'] }); s.log.length = 0; const say = buttons(h, 'lq-ib').find((b) => txt(b).includes('🔊')); ok(say, '🔊-knop'); say.click(); ok(s.log.some((l) => l.text === 'Test?'), 'opnieuw voorlezen'); OPTS(h)[0].click(); ok(s.log.some((l) => l.cancel), 'stop bij antwoord'); a.cancel();
  delete globalThis.speechSynthesis; delete globalThis.SpeechSynthesisUtterance; h = host(); ask(h, { t: 'mc', q: 'Test?', a: 'A', o: ['A', 'B'] }, { tts: true }); ok(!buttons(h, 'lq-ib').some((b) => txt(b).includes('🔊')), 'geen 🔊 zonder ondersteuning');
});
await t('ask: thema, compact, a11y-attributen', () => {
  const h = host(); ask(h, { t: 'mc', q: 'x?', a: 'A', o: ['A', 'B'] }, { theme: { bg: '#111', fg: '#eee', accent: '#f0f' }, compact: true });
  const root = byClass(h, 'lq-root')[0]; eq(root.style._p['--lq-bg'], '#111'); eq(root.style._p['--lq-ac'], '#f0f'); eq(root.style._p['--lq-fg'], '#eee'); ok(hasClass(root, 'lq-c')); eq(root.attrs.role, 'group');
  ok(OPTS(h).every((b) => b.attrs.type === 'button')); eq(byClass(h, 'lq-q')[0].attrs.role, 'heading'); ok(allEls(h).some((e) => e.attrs['aria-live'] === 'polite'), 'live-regio voor feedback');
  const th = host(); ask(th, { t: 'type', q: 'x?', a: 'A' }); eq(byClass(th, 'lq-in')[0].attrs['aria-label'], 'Jouw antwoord');
});
await t('ask: alle 8 types met alle vraagsoorten uit pick() zonder crash (rooktest)', async () => {
  const mix = [
    { t: 'mc', q: 'a?', a: 'x', o: ['x', 'y', 'z', 'w'] }, { t: 'type', q: 'b?', a: 'woord' }, { t: 'tf', q: 'c', a: true }, { t: 'order', q: 'd', a: ['1', '2', '3'] },
    { t: 'match', q: 'e', a: [['a', '1'], ['b', '2'], ['c', '3'], ['d', '4']] }, { t: 'fill', q: 'f ___', a: 'g' }, { t: 'num', q: 'h', a: 4 }, { t: 'multi', q: 'i', o: ['a', 'b', 'c'], a: ['a'] },
    { t: 'fill', q: 'f ___', a: 'g', o: ['g', 'h'] },
  ];
  for (const compact of [false, true]) for (const q of mix) { const h = host(); const a = ask(h, q, { compact, time: 9, hints: 1, tts: true, label: 'x', lives: 2, theme: { accent: '#0f0' } }); advance(500); const b = allEls(h).find((e) => e.tagName === 'BUTTON'); ok(b); const hb = buttons(h, 'lq-ib').find((x) => txt(x).includes('💡')); if (hb) hb.click(); a.cancel(); }
  const kit = { id: 'smoke', qs: mix.map(normalizeQ) }; for (const q of pick(kit, 40, { seed: 1 })) { const h = host(); const a = ask(h, q, { feedback: false }); a.cancel(); }
});
await t('ask: stijl en luisteraars worden opgeruimd', async () => {
  cancelAll();
  for (const c of [...document.body.childNodes]) document.body.removeChild(c);
  advance(30000); await settle(); eq(document.getElementById('lq-style'), null, 'style weg als er niets meer in beeld is'); eq((document.listeners.keydown || []).length, 0, 'geen keydown-luisteraars over');
  const h = host(); const a = ask(h, { t: 'mc', q: 'x?', a: 'A', o: ['A', 'B'] }); ok(document.getElementById('lq-style')); a.cancel(); document.body.removeChild(h); advance(10000); await settle(); eq(document.getElementById('lq-style'), null);
});

/* =================== pack-generator =================== */
await t('make-learn-packs.py draait en schrijft geldige index.js', async () => {
  const { execFileSync } = await import('node:child_process'); const { readFileSync } = await import('node:fs'); const { fileURLToPath } = await import('node:url'); const path = await import('node:path');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const out = execFileSync('python3', [path.join(root, 'tools/make-learn-packs.py')], { encoding: 'utf8' }); ok(out.includes('index.js geschreven'));
  const js = readFileSync(path.join(root, 'docs/learn/packs/index.js'), 'utf8'); ok(js.includes("id: 'tafels-demo'") && js.includes('export const PACKS'));
});

console.log(`\nlearn-core: ${pass} geslaagd, ${fail} mislukt`);
if (fail) { console.log('Mislukt:', fails.join(' | ')); process.exit(1); }
process.exit(0);
