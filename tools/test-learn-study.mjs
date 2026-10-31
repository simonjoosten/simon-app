// Test voor docs/learn/study*.js: pure logica (parsers, generatoren, kit-code, Leitner, cijfers) + rooktest van de hele app met stubs.
// Draaien: node tools/test-learn-study.mjs
import * as NM from 'node:module';
const { register, registerHooks } = NM;
import * as L from '../docs/learn/study-logic.js';

let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.error('FOUT:', m); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}\n  kreeg   ${JSON.stringify(a)}\n  verwacht ${JSON.stringify(b)}`);

/* ---------- basis ---------- */
{
  const r1 = L.mulberry(5), r2 = L.mulberry(5); ok(r1() === r2() && r1() === r2(), 'mulberry deterministisch');
  const a = [1, 2, 3, 4, 5, 6]; const s = L.shuf(a, L.mulberry(1)); eq([...s].sort(), a, 'shuf is permutatie'); eq(a, [1, 2, 3, 4, 5, 6], 'shuf muteert niet');
  eq(L.nl(3.5), '3,5', 'nl komma'); eq(L.nl(0.1 + 0.2), '0,3', 'nl floating'); eq(L.fmtTime(125), '2:05', 'fmtTime');
  ok(L.clip('a'.repeat(500), 400).length === 400, 'clip');
}

/* ---------- cleanQ ---------- */
{
  const C = L.cleanQ;
  ok(C({ t: 'mc', q: 'Q?', a: 'A', o: ['A', 'B', 'C', 'D'] }).o.length === 4, 'mc ok');
  ok(C({ t: 'mc', q: 'Q?', a: 'A', o: ['B', 'C'] }).o.includes('A'), 'mc voegt goede antwoord toe');
  ok(C({ t: 'mc', q: 'Q?', a: 'A', o: [] }) === null, 'mc met 1 optie ongeldig');
  eq(C({ t: 'mc', q: 'Q', a: 'Maandag', o: ['Maandag', 'maandag', 'MAANDAG'] }).o.length, 3, 'mc-opties hoofdlettergevoelig uniek');
  ok(C({ t: 'type', q: 'Q', a: '' }) === null, 'type zonder antwoord');
  eq(C({ t: 'type', q: 'Q', a: 'x', alt: ['x', 'y'] }).alt, ['y'], 'alt zonder duplicaat');
  ok(C({ t: 'fill', q: 'zonder gat', a: 'x' }) === null, 'fill zonder ___');
  ok(C({ t: 'fill', q: 'met ___ gat', a: 'x' }) !== null, 'fill ok');
  eq(C({ t: 'tf', q: 'Q', a: 'waar' }).a, true, 'tf waar'); eq(C({ t: 'tf', q: 'Q', a: 'nee' }).a, false, 'tf nee'); ok(C({ t: 'tf', q: 'Q', a: 'misschien' }) === null, 'tf ongeldig');
  ok(C({ t: 'order', q: 'Q', a: ['a'] }) === null, 'order te kort'); ok(C({ t: 'order', q: 'Q', a: ['a', 'b', 'c'] }) !== null, 'order ok');
  ok(C({ t: 'match', q: 'Q', a: [['a', '1']] }) === null, 'match te kort'); ok(C({ t: 'match', q: 'Q', a: [['a', '1'], ['b', '2'], ['c', '3']] }) !== null, 'match ok');
  eq(C({ t: 'num', q: 'Q', a: '3,5' }).a, 3.5, 'num komma'); ok(C({ t: 'num', q: 'Q', a: 'abc' }) === null, 'num ongeldig');
  ok(C({ t: 'multi', q: 'Q', o: ['a', 'b', 'c'], a: ['a'] }) !== null, 'multi ok'); ok(C({ t: 'multi', q: 'Q', o: ['a', 'b', 'c'], a: ['z'] }) === null, 'multi goed niet in opties');
  ok(C({ t: 'zzz', q: 'Q', a: 'x' }) === null, 'onbekend type'); ok(C(null) === null, 'null'); ok(C({ t: 'type', q: '  ', a: 'x' }) === null, 'lege vraag');
  eq(C({ t: 'type', q: 'Q', a: 'x', d: 9 }).d, 2, 'd buiten bereik -> 2'); eq(C({ t: 'type', q: 'Q', a: 'x', lang: 'xx' }).lang, undefined, 'onbekende taal weg');
  ok(C({ t: 'type', q: 'x'.repeat(900), a: 'y' }).q.length <= 400, 'vraag max 400');
  const big = L.cleanKit({ name: 'k', qs: Array.from({ length: 600 }, (_, i) => ({ t: 'type', q: 'q' + i, a: 'a' })) }); ok(big.kit.qs.length === 500 && big.dropped === 100, 'kit max 500');
}

/* ---------- parsePaste ---------- */
{
  const P = (t, o) => L.parsePaste(t, o);
  let r = P('huis - house\nkat - cat\nhond - dog'); eq(r.format, 'dash', 'dash'); eq(r.pairs.length, 3, 'dash 3 paren'); eq(r.pairs[0], { q: 'huis', a: 'house' }, 'dash paar');
  r = P('huis;house\nkat;cat\nhond;dog'); eq(r.format, 'semi', 'semi'); eq(r.pairs[1].a, 'cat', 'semi paar');
  r = P('huis\thouse\nkat\tcat'); eq(r.format, 'tab', 'tab');
  r = P('Wat is de hoofdstad van Frankrijk? Parijs\nHoeveel poten heeft een spin? 8'); eq(r.format, 'qmark', 'qmark'); eq(r.pairs[0], { q: 'Wat is de hoofdstad van Frankrijk?', a: 'Parijs' }, 'qmark paar'); eq(r.pairs[1].a, '8', 'qmark getal');
  r = P('Hoe heet je? - Ik heet Tom\nHoe gaat het? - Goed'); eq(r.pairs[0].a, 'Ik heet Tom', 'qmark strip streepje');
  r = P('1. appel - apple\n2. peer - pear\n3. kers - cherry'); eq(r.pairs[0], { q: 'appel', a: 'apple' }, 'genummerd'); eq(r.pairs.length, 3, 'genummerd aantal');
  r = P('2 + 3 = 5\n4 + 4 = 8\n9 - 3 = 6'); eq(r.format, 'eq', 'eq voor dash'); eq(r.pairs[2], { q: '9 - 3', a: '6' }, 'eq met min in vraag');
  r = P('huis -> house\nkat -> cat'); eq(r.format, 'arrow', 'arrow');
  r = P('term,definition\nhuis,house\nkat,cat\n"hond, groot",dog'); eq(r.header, true, 'header gedetecteerd'); eq(r.pairs.length, 3, 'csv 3 paren'); eq(r.pairs[2], { q: 'hond, groot', a: 'dog' }, 'csv met quotes');
  r = P('woord;vertaling;uitleg\nhuis;house;een gebouw'); eq(r.pairs[0].x, 'een gebouw', 'derde kolom = uitleg');
  r = P('vraag 1\nantwoord 1\nvraag 2\nantwoord 2'); eq(r.format, 'alternate', 'alternate'); eq(r.pairs.length, 2, 'alternate paren');
  r = P('huis - house / home | hut\nkat - cat'); eq(r.pairs[0].alt, ['home', 'hut'], 'alternatieve antwoorden');
  r = P(''); eq(r.pairs.length, 0, 'leeg'); eq(r.format, 'none', 'leeg formaat');
  r = P('losse tekst zonder structuur'); eq(r.pairs.length, 0, 'geen paren'); eq(r.skipped.length, 1, 'regel overgeslagen');
  r = P('huis - house\nkapotte regel\nkat - cat'); eq(r.pairs.length, 2, 'slechte regel overgeslagen'); eq(r.skipped, ['kapotte regel'], 'skipped inhoud');
  r = P('﻿huis - house\r\nkat - cat\r\n'); eq(r.pairs.length, 2, 'BOM en CRLF');
  r = P('a;b\nc;d', { format: 'semi' }); eq(r.pairs.length, 2, 'format override');
  r = P('Parijs: Frankrijk\nRome: Italië\nMadrid: Spanje'); eq(r.format, 'colon', 'colon');
  ok(P('x - ' + 'y'.repeat(900)).pairs[0].a.length <= 200, 'antwoord geclipt');
}

/* ---------- distractors ---------- */
{
  const d = L.pickDistractors('42', ['56', '63', 'appel', '42'], 3, L.mulberry(2)); eq(d.length, 3, '3 afleiders'); ok(!d.includes('42'), 'afleider ongelijk aan goed'); ok(d.every((x) => /^-?\d/.test(x)), 'getal -> getallen');
  const d2 = L.pickDistractors('house', ['cat', 'dog', 'tree', 'house', 'HOUSE'], 3, L.mulberry(3)); eq(d2.length, 3, 'woord afleiders'); ok(!d2.some((x) => x.toLowerCase() === 'house'), 'geen dubbele van goede');
  ok(L.pickDistractors('x', [], 3).length === 0, 'lege pool, niet-getal'); ok(L.pickDistractors('7', [], 3).length === 3, 'getal zonder pool: numeriek');
  const nd = L.numericDistractors('3,5', L.mulberry(1)); ok(nd.length && nd.every((x) => x.includes(',')), 'komma behouden'); ok(!nd.includes('3,5'), 'niet gelijk');
  ok(L.numericDistractors('0', L.mulberry(1)).every((x) => +x >= 0), 'geen negatieven bij 0');
  const mc = L.makeMc({ t: 'type', q: 'Hoofdstad?', a: 'Parijs' }, [{ t: 'type', q: 'x', a: 'Rome' }, { t: 'type', q: 'y', a: 'Berlijn' }, { t: 'type', q: 'z', a: 'Madrid' }], L.mulberry(1));
  eq(mc.t, 'mc', 'makeMc type'); ok(mc.o.includes('Parijs') && mc.o.length === 4, 'makeMc opties'); eq(L.makeMc({ t: 'order' }, []), null, 'makeMc order -> null');
  ok(L.makeMc({ t: 'type', q: 'a', a: 'b' }, []) === null, 'makeMc zonder pool -> null');
  const mn = L.makeMc({ t: 'num', q: '2x3', a: 6 }, [{ t: 'num', q: '2x4', a: 8 }, { t: 'num', q: '2x5', a: 10 }], L.mulberry(1)); eq(mn.a, '6', 'num -> mc tekst');
}

/* ---------- pairsToQuestions ---------- */
{
  const pairs = L.parsePaste('huis - house\nkat - cat\nhond - dog\nboom - tree\nvriend - friend\nschool - school\nboek - book\nappel - apple').pairs;
  let qs = L.pairsToQuestions(pairs, { types: ['mc', 'type'], lang: 'en', seed: 1 }); eq(qs.length, 16, 'mc+type per paar');
  ok(qs.filter((q) => q.t === 'mc').every((q) => q.o.includes(q.a) && q.o.length === 4), 'mc valid'); ok(qs.every((q) => q.lang === 'en'), 'lang gezet');
  qs = L.pairsToQuestions(pairs, { types: ['type'], dir: 'both', lang: 'en' }); eq(qs.length, 15, 'both = 2x (school=school is dubbel en valt weg)'); ok(qs.some((q) => q.q === 'house' && q.a === 'huis' && q.say === 'house'), 'rev met say');
  qs = L.pairsToQuestions(pairs, { types: ['listen'], lang: 'en' }); eq(qs.length, 8, 'listen'); ok(qs.every((q) => q.say === q.a && q.g === 'luister'), 'listen vorm');
  ok(L.pairsToQuestions(pairs, { types: ['listen'] }).length === 0, 'listen zonder taal niet');
  qs = L.pairsToQuestions(pairs, { types: ['tf'], seed: 1 }); ok(qs.some((q) => q.a === true) && qs.some((q) => q.a === false), 'tf waar en onwaar'); ok(qs.filter((q) => !q.a).every((q) => q.x && q.x.includes('Het goede antwoord')), 'tf onwaar met uitleg');
  qs = L.pairsToQuestions(pairs, { types: ['match'] }); ok(qs.length >= 2 && qs.every((q) => q.a.length >= 3 && q.a.length <= 5), 'match groepen 3-5');
  qs = L.pairsToQuestions(L.parsePaste('2+2 - 4\n3+3 - 6\n4+4 - 8').pairs, { types: ['type'] }); ok(qs.every((q) => q.t === 'num'), 'numeriek -> num');
  qs = L.pairsToQuestions(L.parsePaste('a - b\nc - d').pairs, { types: ['mc'] }); eq(qs.length, 0, 'mc kan niet met 2 paren (te weinig afleiders)');
  qs = L.pairsToQuestions(L.parsePaste('de kat zit op de mat - mat').pairs, { types: ['fill'] }); eq(qs[0] && qs[0].q, 'de kat zit op de ___', 'fill uit paar');
  const many = Array.from({ length: 400 }, (_, i) => ({ q: 'q' + i, a: 'a' + i })); ok(L.pairsToQuestions(many, { types: ['mc', 'type'] }).length === 800, 'veel paren (kit-limiet gebeurt bij toevoegen)');
  ok(L.pairsToQuestions([{ q: 'x', a: 'y' }, { q: 'x', a: 'y' }], { types: ['type'] }).length === 1, 'dubbelen verwijderd');
}

/* ---------- tekst -> vragen ---------- */
{
  const s = L.splitSentences('De pi is 3.14 groot. Zie bijv. dit boek. Wat een dag! Is het waar? Ja.'); eq(s.length, 5, 'zinnen splitsen (decimaal+afkorting)'); ok(s[0].includes('3.14'), 'decimaal intact'); ok(s[1].includes('bijv.'), 'afkorting intact');
  const text = 'De Eiffeltoren staat in Parijs en is 330 meter hoog. Hij werd gebouwd in 1889 door Gustave Eiffel. Elk jaar komen er miljoenen toeristen kijken. Mont Blanc is de hoogste berg van de Alpen met 4808 meter.';
  const r = L.textToQuestions(text, { seed: 3 }); ok(r.cands.length >= 8, 'genoeg kandidaten: ' + r.cands.length);
  ok(r.cands.every((c) => c.keep && L.cleanQ(c.q)), 'kandidaten geldig'); ok(r.cands.filter((c) => c.kind === 'fill').every((c) => c.q.q.includes('___') && !c.q.q.includes(c.q.a)), 'gat en antwoord klopt');
  ok(r.cands.filter((c) => c.kind === 'mc').every((c) => c.q.o.includes(c.q.a) && c.q.q.includes('___')), 'mc heeft gat en goed antwoord');
  const tfs = r.cands.filter((c) => c.kind === 'tf'); ok(tfs.some((c) => c.q.a === false) && tfs.some((c) => c.q.a === true), 'tf beide soorten'); ok(tfs.filter((c) => !c.q.a).every((c) => c.q.q !== c.sentence && c.q.x), 'onware stelling verschilt + uitleg');
  ok(r.cands.some((c) => c.q.a === '1889' || c.q.a === '330'), 'getallen als doel'); ok(r.cands.some((c) => c.q.a === 'Parijs' || c.q.a === 'Gustave Eiffel' || c.q.a === 'Alpen'), 'namen als doel');
  eq(L.textToQuestions('Te kort. Nee.').cands.length, 0, 'te korte zinnen'); eq(L.textToQuestions('').cands.length, 0, 'lege tekst');
  eq(L.textToQuestions(text, { kinds: ['fill'] }).cands.every((c) => c.kind === 'fill'), true, 'kinds filter');
  eq(JSON.stringify(L.textToQuestions(text, { seed: 5 })), JSON.stringify(L.textToQuestions(text, { seed: 5 })), 'deterministisch met seed');
  ok(L.textToQuestions(text.repeat(30), { max: 10 }).cands.length <= 10, 'max');
}

/* ---------- generatoren ---------- */
{
  for (const g of L.GENERATORS) {
    const p = g.kind === 'wordpairs' ? { text: 'huis - house\nkat - cat\nhond - dog\nboom - tree', lang: 'en', dir: 'both' } : {};
    const qs = L.generate(g.kind, p, 30, 11);
    ok(qs.length >= (g.kind === 'caps' ? 10 : 8), `${g.kind}: genoeg vragen (${qs.length})`);
    ok(qs.every((q) => JSON.stringify(L.cleanQ(q)) === JSON.stringify(q)), `${g.kind}: alles geldig en genormaliseerd`);
    eq(L.generate(g.kind, p, 30, 11), qs, `${g.kind}: deterministisch`);
    ok(new Set(qs.map((q) => (g.kind === 'wordpairs' ? q.t : '') + q.q + JSON.stringify(q.a))).size === qs.length, `${g.kind}: geen dubbelen`);
    for (const pp of g.params.filter((x) => x.type === 'select')) for (const o of pp.options) ok(L.generate(g.kind, { ...p, [pp.key]: o.v }, 10, 3).length > 0, `${g.kind}: ${pp.key}=${o.v} geeft vragen`);
  }
  // rekenkundig juist
  for (const q of L.generate('tables', { tables: [3, 7], ops: 'both', mc: 0 }, 40, 2)) { const m = /(\d+) ([×:]) (\d+)/.exec(q.q); ok(!!m, 'tafel patroon ' + q.q); const [, a, op, b] = m; ok(q.a === (op === '×' ? +a * +b : +a / +b), 'tafel antwoord ' + q.q); ok([+a, +b].some((x) => x === 3 || x === 7) || op === ':', 'gekozen tafel'); }
  for (const lv of [1, 2, 3, 4, 5]) for (const q of L.generate('addsub', { level: lv, op: 'both' }, 30, lv)) { const m = /([\d,]+) ([+−]) ([\d,]+)/.exec(q.q); const a = +m[1].replace(',', '.'), b = +m[3].replace(',', '.'); ok(Math.abs(q.a - (m[2] === '+' ? a + b : a - b)) < 1e-9, 'addsub klopt ' + q.q); ok(q.a >= 0, 'niet negatief'); }
  for (const lv of [1, 2, 4, 5]) for (const q of L.generate('divide', { level: lv }, 20, lv)) { const m = /(\d+) : (\d+)/.exec(q.q); ok(q.a * +m[2] === +m[1], 'deling exact ' + q.q); }
  for (const q of L.generate('divide', { level: 3 }, 20, 4)) { const m = /(\d+) : (\d+)/.exec(q.q); ok(q.q.includes('rest') ? q.a === +m[1] % +m[2] : q.a === Math.floor(+m[1] / +m[2]), 'rest-deling ' + q.q); }
  for (const q of L.generate('multiply', { level: 3 }, 20, 4)) { const m = /(\d+) × (\d+)/.exec(q.q); ok(q.a === +m[1] * +m[2], 'maal ' + q.q); }
  for (const q of L.generate('percent', { level: 2 }, 20, 4)) { const m = /(\d+)% van (\d+)/.exec(q.q); ok(Math.abs(q.a - (+m[1] * +m[2]) / 100) < 1e-9, 'procent ' + q.q); }
  for (const q of L.generate('fractions', { level: 2 }, 20, 4)) { const m = /(\d+)\/(\d+) van (\d+)/.exec(q.q); ok(q.a === (+m[3] / +m[2]) * +m[1] && Number.isInteger(q.a), 'breuk ' + q.q); }
  for (const q of L.generate('clock', { level: 3 }, 30, 4)) { ok(q.t === 'type' ? /^\d{1,2}:\d{2}$/.test(q.a) : q.o.includes(q.a), 'klok vorm'); }
  eq(L.timeWords(3, 0), '3 uur', 'tijd hele'); eq(L.timeWords(3, 15), 'kwart over 3', 'kwart over'); eq(L.timeWords(3, 20), 'tien voor half 4', '20'); eq(L.timeWords(3, 30), 'half 4', 'half'); eq(L.timeWords(3, 40), 'tien over half 4', '40'); eq(L.timeWords(3, 45), 'kwart voor 4', 'kwart voor'); eq(L.timeWords(12, 45), 'kwart voor 1', '12:45'); eq(L.timeWords(11, 30), 'half 12', '11:30'); eq(L.timeDigital(15, 15), '3:15', 'digitaal 12-uurs');
  for (const q of L.generate('money', { level: 2 }, 20, 4)) { const m = /€ ([\d,]+) .* € ([\d,]+)/.exec(q.q); ok(Math.abs(q.a - (+m[2].replace(',', '.') - +m[1].replace(',', '.'))) < 1e-9 && q.a > 0, 'wisselgeld ' + q.q); }
  for (const q of L.generate('caps', {}, 30, 4)) { ok(q.t === 'mc' && q.o.length === 4 && new Set(q.o).size === 4 && q.o.includes(q.a), 'caps mc 4 unieke opties'); ok(/^[A-Z]/.test(q.a) && /[.?]$/.test(q.a), 'goede zin begint met hoofdletter, eindigt met leesteken'); ok(!/ (Maandag|Dinsdag|Woensdag|Donderdag|Vrijdag|Zaterdag|Zondag|Januari|Maart|April|Mei|Juni|Juli|Augustus|Oktober)\b/.test(q.a), 'dag/maand klein in goede zin'); }
  const wp = L.generate('wordpairs', { text: 'huis - house\nkat - cat\nhond - dog\nboom - tree', lang: 'en', dir: 'both' }, 100, 1); ok(wp.some((q) => q.t === 'mc') && wp.some((q) => q.t === 'type') && wp.some((q) => q.g === 'luister'), 'wordpairs mc+type+luister');
  eq(L.generate('tables', {}, 5, 1).length, 5, 'count'); ok(L.generate('bestaatniet', {}, 5, 1).length === 0, 'onbekende generator -> leeg');
  ok(L.generate('tables', { tables: [2] }, 500, 1).length <= 40, 'niet meer unieke vragen dan er bestaan');
}

/* ---------- formulier <-> vraag ---------- */
{
  const forms = [
    { t: 'mc', q: 'Welke kleur?', a: 'rood', opts: 'blauw\ngroen\ngeel' }, { t: 'type', q: 'Hoofdstad?', a: 'Parijs', alt: 'Paris, Parijs stad' }, { t: 'fill', q: 'De ___ is rond', a: 'bal', opts: 'kubus\nbol' }, { t: 'tf', q: 'Aarde is rond', a: 'waar' }, { t: 'tf', q: 'Zon is koud', a: 'onwaar' },
    { t: 'num', q: '2+2', a: '4', alt: '4,0; 4.5', tol: '0,5' }, { t: 'order', q: 'Op volgorde', opts: 'a\nb\nc' }, { t: 'match', q: 'Verbind', opts: 'a = 1\nb -> 2\nc: 3' }, { t: 'multi', q: 'Fruit?', opts: '* appel\n* peer\nstoel' },
  ];
  for (const f of forms) {
    const r = L.fieldsToQ(f, L.mulberry(1)); ok(r.q, `fieldsToQ ${f.t}: ${r.error}`); if (!r.q) continue;
    const back = L.fieldsToQ(L.qToFields(r.q), L.mulberry(1)); ok(back.q, `terug ${f.t}: ${back.error}`);
    eq(back.q && { ...back.q, o: back.q.o && [...back.q.o].sort() }, { ...r.q, o: r.q.o && [...r.q.o].sort() }, `roundtrip ${f.t}`);
  }
  ok(L.fieldsToQ({ t: 'mc', q: 'x', a: 'a', opts: '' }).error, 'mc zonder fout antwoord geeft fout'); ok(L.fieldsToQ({ t: 'fill', q: 'geen gat', a: 'a' }).error, 'fill zonder gat'); ok(L.fieldsToQ({ t: 'num', q: 'x', a: 'abc' }).error, 'num NaN'); ok(L.fieldsToQ({ t: 'order', q: 'x', opts: 'a\nb' }).error, 'order te kort'); ok(L.fieldsToQ({ t: 'multi', q: 'x', opts: 'a\nb\nc' }).error, 'multi zonder goede'); ok(L.fieldsToQ({ t: 'type', q: '', a: 'x' }).error, 'lege vraag');
  eq(L.fieldsToQ({ t: 'num', q: 'x', a: '4', alt: '4,5', tol: '0,5' }).q.tol, 0.5, 'tol'); eq(L.qSummary({ t: 'tf', q: 'q', a: true }).a, 'waar', 'summary');
}

/* ---------- kit-code ---------- */
{
  const mk = (n, f) => ({ id: 'x', name: 'Test kit 🚀', emoji: '🚀', desc: 'omschrijving', lang: 'en', qs: Array.from({ length: n }, (_, i) => f(i)) });
  const kit = mk(60, (i) => ({ t: i % 3 === 0 ? 'mc' : i % 3 === 1 ? 'type' : 'tf', q: `Vraag ${i} café ñandú — ‘quote’ “dubbel” 日本語?`, ...(i % 3 === 0 ? { a: 'A' + i, o: ['A' + i, 'B', 'C', 'D'] } : i % 3 === 1 ? { a: 'ant' + i, alt: ['x'] } : { a: i % 2 === 0 }), x: 'uitleg ' + i, e: '🐶' }));
  const code = L.encodeKit(kit); ok(/^LK[12]\.[A-Za-z0-9_-]+$/.test(code), 'code-formaat'); const d = L.decodeKit(code); ok(!d.error, 'decode: ' + d.error);
  eq(d.kit.qs, L.cleanKit(kit).kit.qs, 'vragen identiek na roundtrip'); eq(d.kit.name, 'Test kit 🚀', 'naam'); eq(d.kit.lang, 'en', 'lang'); eq(d.kit.emoji, '🚀', 'emoji');
  ok(code.length < JSON.stringify(kit).length * 1.4, `code redelijk compact: ${code.length} vs ${JSON.stringify(kit).length}`);
  const tab = { name: 'Tafels', emoji: '✖️', qs: L.generate('tables', { tables: [2, 3, 4, 5, 6, 7, 8, 9] }, 100, 1) }; const ct = L.encodeKit(tab); ok(ct.startsWith('LK2.'), 'tafels gebruiken compressie'); ok(ct.length < JSON.stringify(tab).length * 0.75, `compressie werkt: ${ct.length} / ${JSON.stringify(tab).length}`);
  eq(L.decodeKit(ct).kit.qs.length, L.cleanKit(tab).kit.qs.length, 'tafels roundtrip');
  for (const n of [1, 2, 5, 17, 100, 500]) { const k2 = mk(n, (i) => ({ t: 'type', q: 'Vraag ' + i + ' ' + 'ab'.repeat(i % 20), a: 'x' + i })); const r2 = L.decodeKit(L.encodeKit(k2)); eq(r2.kit.qs.length, n, `roundtrip ${n} vragen`); }
  const withNl = L.decodeKit('  ' + code.slice(0, 20) + '\n' + code.slice(20) + '  '); ok(!withNl.error, 'witruimte/regeleinden in code toegestaan');
  ok(L.decodeKit('LK2.!!!').error, 'rommel -> fout'); ok(L.decodeKit('hallo').error, 'geen code'); ok(L.decodeKit('').error, 'leeg'); ok(L.decodeKit(code.slice(0, code.length - 15)).error || true, 'afgekapt crasht niet');
  ok(L.decodeKit('LK1.' + btoa('niet json').replace(/=+$/, '')).error, 'LK1 met rommel');
  ok(L.decodeKit('LK1.' + btoa(JSON.stringify({ q: [] })).replace(/=+$/, '')).error, 'lege kit -> fout');
  const mal = L.decodeKit('LK1.' + btoa(JSON.stringify({ n: 'x', q: [{ t: 'mc', q: 'a', a: 'b' }, { t: 'type', q: 'ok', a: 'ja' }, 'rommel', null] })).replace(/=+$/, '')); eq(mal.kit.qs.length, 1, 'kapotte vragen eruit'); eq(mal.dropped, 3, 'dropped geteld');
  // LZW fuzz
  const rr = L.mulberry(99); for (let t = 0; t < 40; t++) { const len = 1 + Math.floor(rr() * 3000); const name = Array.from({ length: len }, () => String.fromCharCode(32 + Math.floor(rr() * 200))).join(''); const k3 = { name: 'f', qs: [{ t: 'type', q: name.slice(0, 390) || 'q', a: name.slice(0, 150) || 'a' }] }; const r3 = L.decodeKit(L.encodeKit(k3)); ok(!r3.error && r3.kit.qs.length === 1 && r3.kit.qs[0].q === L.cleanKit(k3).kit.qs[0].q, 'lzw fuzz ' + t + ' ' + (r3.error || '')); }
  ok(L.kitToText({ qs: [{ t: 'type', q: 'huis', a: 'house', alt: ['home'] }, { t: 'num', q: '2+2', a: 4 }, { t: 'tf', q: 'x', a: true }] }) === 'huis - house / home\n2+2 = 4', 'kitToText');
  const txt = L.kitToText({ qs: [{ t: 'type', q: 'huis', a: 'house' }, { t: 'type', q: 'kat', a: 'cat' }, { t: 'type', q: 'hond', a: 'dog' }] }); eq(L.parsePaste(txt).pairs.length, 3, 'kitToText -> parsePaste');
}

/* ---------- Leitner-wachtrij ---------- */
{
  const steps = L.stepsFor({ t: 'type' }, 0); eq(steps, ['card', 'mc', 'type'], 'nieuwe type-vraag'); eq(L.stepsFor({ t: 'mc' }, 1), ['mc', 'type'], 'box1'); eq(L.stepsFor({ t: 'type' }, 3), ['type'], 'box3'); eq(L.stepsFor({ t: 'order' }, 0), ['card', 'real'], 'order nieuw'); eq(L.stepsFor({ t: 'tf' }, 2), ['real'], 'tf gevorderd'); eq(L.stepsFor({ t: 'num' }, 0), ['card', 'real'], 'num nieuw');
  // alles goed
  let q = new L.LearnQueue([{ id: 1, steps: ['card', 'mc', 'type'] }, { id: 2, steps: ['type'] }]); const recs = []; let guard = 0;
  while (!q.done && guard++ < 50) { const r = q.advance(true); if (r.record !== null) recs.push(r.record); } eq(recs, [true, true], 'alles goed: 2 keer record(true)'); eq(q.progress(), { done: 2, total: 2 }, 'voortgang');
  // fout: eerst false, daarna opnieuw, geen true meer
  q = new L.LearnQueue([{ id: 1, steps: ['mc', 'type'] }, { id: 2, steps: ['type'] }, { id: 3, steps: ['type'] }]); const log = []; guard = 0; let first = true;
  while (!q.done && guard++ < 50) { const cur = q.current(); const good = !(first && cur.item.id === 1 && cur.step === 'mc'); if (!good) first = false; const r = q.advance(good); log.push([cur.item.id, cur.step, good, r.record]); }
  ok(log.filter((l) => l[3] === false).length === 1, 'één record(false)'); ok(!log.some((l) => l[0] === 1 && l[3] === true), 'gemist item wordt niet alsnog true'); ok(q.done, 'wachtrij klaar'); ok(log.filter((l) => l[0] === 1).length > 2, 'gemist item komt terug');
  // altijd fout: stopt na maxRetries
  q = new L.LearnQueue([{ id: 1, steps: ['type'] }], { maxRetries: 2 }); guard = 0; while (!q.done && guard++ < 50) q.advance(false); ok(q.done && guard <= 10, 'altijd fout eindigt (retries begrensd)'); eq(q.wrong, 3, 'drie pogingen');
  ok(q.advance(true) === null, 'advance op lege wachtrij -> null');
  // card slaat 'ok' over
  q = new L.LearnQueue([{ id: 1, steps: ['card', 'type'] }]); q.advance(false); eq(q.current().step, 'type', 'card negeert ok=false'); eq(q.wrong, 0, 'card telt niet als fout');
  // 'see'
  q = new L.LearnQueue([{ id: 1, steps: ['see', 'choose', 'type'] }]); q.advance(true); eq(q.current().step, 'choose', 'see -> choose');
  // retry-stappen: na fout in type met [card,mc,type] komen laatste 2 stappen terug
  q = new L.LearnQueue([{ id: 1, steps: ['card', 'mc', 'type'] }]); q.advance(true); q.advance(true); q.advance(false); eq(q.current().item.steps, ['mc', 'type'], 'retry zonder card');
}

/* ---------- planSession ---------- */
{
  const items = [...Array.from({ length: 8 }, (_, i) => ({ q: 'L' + i, box: 2 })), ...Array.from({ length: 20 }, (_, i) => ({ q: 'N' + i, box: 0 }))];
  let p = L.planSession(items, 10); eq(p.length, 10, '10 items'); eq(p.filter((x) => x.box === 0).length, 5, 'max 5 nieuw'); eq(p[0].q, 'L0', 'te herhalen eerst');
  p = L.planSession(items.slice(8), 10); eq(p.length, 10, 'alleen nieuw: toch 10'); p = L.planSession(items.slice(0, 3), 10); eq(p.length, 3, 'weinig items'); eq(L.planSession([], 10), [], 'leeg');
  p = L.planSession(items.slice(0, 8), 10); eq(p.length, 8, 'alleen geleerd: 8');
}

/* ---------- levens, cijfers, kaarten, talen ---------- */
{
  const s = new L.LivesState({ lives: 3, shield: 1 }); s.step(true); s.step(false); eq(s.lives, 3, 'schild vangt fout op'); eq(s.saved, 1, 'schild geteld'); s.step(false); s.step(false); s.step(false); ok(s.over, 'levens op'); const sc = s.score; s.step(true); eq(s.score, sc, 'niets na game over'); eq(s.streak, 0, 'reeks reset');
  const s2 = new L.LivesState({ lives: 3 }); for (let i = 0; i < 10; i++) s2.step(true); eq(s2.lives, 4, 'extra leven bij 10 op rij'); eq(s2.best, 10, 'beste reeks'); ok(s2.score > 100, 'score groeit met reeks');
  eq(L.gradeFor(0, 10), 1, 'cijfer 0 = 1'); eq(L.gradeFor(10, 10), 10, 'cijfer 100% = 10'); eq(L.gradeFor(5.5, 10), 5.5, '55% = 5,5'); eq(L.gradeFor(0, 0), 1, 'geen vragen'); let prev = 0; for (let i = 0; i <= 20; i++) { const g = L.gradeFor(i, 20); ok(g >= prev, 'cijfer stijgt monotoon'); ok(g >= 1 && g <= 10, 'cijfer 1..10'); prev = g; } eq(L.gradeFor(15, 10), 10, 'score > totaal -> 10'); eq(L.gradeFor(7.5, 10), 7.5, 'gedeeltelijk punt (75%)');
  ok(L.gradeLabel(9.5).includes('Geweldig') && L.gradeLabel(2).includes('oefenen'), 'gradeLabel');
  const r = L.rewardFor({ correct: 10, wrong: 2, mode: 'toets', grade: 8 }); ok(r.xp > 30 && r.coins >= 5, 'beloning toets'); ok(L.rewardFor({ correct: 9999, mode: 'oefen' }).xp <= 400, 'beloning begrensd'); eq(L.rewardFor({}), { xp: 0, coins: 0 }, 'niets gedaan = niets');
  const d = new L.FlashDeck([1, 2, 3, 4], L.mulberry(1)); ok(!d.done && d.left === 4, 'deck start'); d.mark(true); d.mark(false); d.mark(false); d.mark(true); ok(d.done, 'deck klaar'); eq(d.known.length, 2, 'gekend'); ok(d.nextRound() && d.items.length === 2 && d.round === 2, 'ronde 2 met onbekende'); d.mark(true); d.mark(true); ok(!d.nextRound(), 'geen volgende ronde als alles gekend'); ok(d.mark(true) === null, 'mark op leeg deck');
  eq(L.cardText({ t: 'tf', q: 'Zon is heet', a: true }).back, 'Waar', 'kaart tf'); eq(L.cardText({ t: 'num', q: 'x', a: 3.5 }).back, '3,5', 'kaart num'); ok(L.cardText({ t: 'order', q: 'x', a: ['a', 'b', 'c'] }).back.includes('2. b'), 'kaart order'); ok(L.cardText({ t: 'fill', q: 'De ___ is rood', a: 'roos' }).front.includes('＿'), 'kaart fill'); ok(L.cardText({ t: 'type', q: 'huis', a: 'house', alt: ['home'] }).back === 'house / home', 'kaart alt');
  eq(L.phaseStepsForBox(0), ['see', 'choose', 'type'], 'fasen box0'); eq(L.phaseStepsForBox(3), ['listen'], 'fasen box3');
  const kit = { lang: 'en', qs: [{ t: 'type', q: 'huis', a: 'house', lang: 'en' }, { t: 'mc', q: 'kat', a: 'cat', o: ['cat', 'dog', 'rat', 'bat'] }, { t: 'type', q: 'een heel lange zin die geen woordje is maar toch erg lang is en dus niet meetelt hier', a: 'x' }, { t: 'tf', q: 'x', a: true }, { t: 'type', q: 'luister', a: 'x', g: 'luister' }] };
  const w = L.wordsOf(kit); eq(w.length, 2, 'wordsOf filtert'); eq(L.wordsOf({ lang: 'nl', qs: kit.qs.map((q) => ({ ...q, lang: undefined })) }).length, 0, 'nl-kit geen woordjes');
  const pool = [{ nl: 'huis', fo: 'house' }, { nl: 'kat', fo: 'cat' }, { nl: 'hond', fo: 'dog' }, { nl: 'boom', fo: 'tree' }];
  const word = { nl: 'huis', fo: 'house', alt: [], lang: 'en' }; const r1 = L.langQuestion(word, 'choose', 'nl2xx', pool, L.mulberry(1)); eq(r1.t, 'mc', 'choose = mc'); ok(r1.o.includes('house') && r1.q.includes('Engels') && r1.q.includes('huis'), 'choose vorm'); ok(r1.o.every((x) => ['house', 'cat', 'dog', 'tree'].includes(x)), 'opties uit foreign kant');
  const r2 = L.langQuestion(word, 'type', 'xx2nl', pool); eq(r2.a, 'huis', 'xx2nl antwoord NL'); ok(r2.q.includes('Nederlands') && r2.q.includes('house'), 'xx2nl vraag'); const r3 = L.langQuestion(word, 'listen', 'nl2xx', pool); eq(r3.say, 'house', 'listen say'); eq(r3.a, 'house', 'listen antwoord'); eq(r3.lang, 'en', 'listen lang');
  eq(L.langQuestion(word, 'choose', 'nl2xx', [word]).t, 'type', 'te weinig pool -> typen'); ok(['nl2xx', 'xx2nl'].includes(L.dirOf('mix', word)) && L.dirOf('mix', word) === L.dirOf('mix', word), 'mix stabiel');
}

/* ---------- lijsten ---------- */
{
  const list = [{ id: 1, name: 'Tafels', group: 'Rekenen', lang: 'nl', desc: 'maal' }, { id: 2, name: 'Engels 1', group: 'Talen', lang: 'en' }, { id: 3, name: 'Eigen', src: 'user' }, { id: 4, name: 'Dieren', group: 'Natuur' }];
  eq(L.filterKits(list, { q: 'tafel' }).map((k) => k.id), [1], 'zoek'); eq(L.filterKits(list, { lang: 'en' }).map((k) => k.id), [2], 'taal filter'); eq(L.filterKits(list, { q: 'MAAL' }).map((k) => k.id), [1], 'zoek in desc, hoofdletterongevoelig'); eq(L.filterKits(list, { lang: 'nl' }).length, 3, 'nl is standaard');
  eq(L.groupKits(list).map((g) => g.group), ['Talen', 'Rekenen', 'Natuur', 'Overig'], 'groepsvolgorde'); eq(L.pushRecent(['a', 'b', 'c'], 'c'), ['c', 'a', 'b'], 'recent'); eq(L.pushRecent([], 'x', 3), ['x'], 'recent leeg'); eq(L.pushRecent(['1', '2', '3'], '4', 3), ['4', '1', '2'], 'recent max');
  eq(L.givenText({ t: 'tf' }, true), 'Waar', 'givenText'); eq(L.givenText({}, undefined), '—', 'givenText leeg'); eq(L.givenText({}, [['a', 'b']]), 'a → b', 'givenText paren'); eq(L.typesIn([{ t: 'mc' }, { t: 'mc' }, { t: 'tf' }]), { mc: 2, tf: 1 }, 'typesIn');
}

/* ---------- Dagelijkse 10 / Snel-ronde (logica) ---------- */
{
  eq(L.dayKey(new Date(2026, 9, 5)), '2026-10-05', 'dayKey');
  eq(L.dailyAdvance(null, '2026-10-31'), { last: '2026-10-31', streak: 1, best: 1, already: false }, 'daily: eerste keer');
  eq(L.dailyAdvance({ last: '2026-10-30', streak: 3, best: 5 }, '2026-10-31').streak, 4, 'daily: reeks gaat door');
  eq(L.dailyAdvance({ last: '2026-10-30', streak: 5, best: 5 }, '2026-10-31').best, 6, 'daily: beste reeks');
  eq(L.dailyAdvance({ last: '2026-10-20', streak: 9, best: 9 }, '2026-10-31').streak, 1, 'daily: reeks gebroken');
  ok(L.dailyAdvance({ last: '2026-10-31', streak: 2, best: 2 }, '2026-10-31').already === true, 'daily: dezelfde dag telt niet dubbel');
  ok(L.dailyAdvance({ last: '2026-02-28', streak: 2, best: 2 }, '2026-03-01').streak === 3, 'daily: maandwissel');
  ok(L.dailyAlive({ last: '2026-10-30', streak: 2 }, '2026-10-31') && !L.dailyAlive({ last: '2026-10-29', streak: 2 }, '2026-10-31') && !L.dailyAlive(null, '2026-10-31'), 'dailyAlive');
  const items = Array.from({ length: 30 }, (_, i) => ({ q: { t: i < 20 ? 'mc' : 'tf', q: 'v' + i, a: 'x' }, box: i % 4 }));
  const p1 = L.dailyPick(items, 10, 42), p2 = L.dailyPick(items, 10, 42), p3 = L.dailyPick(items, 10, 43);
  eq(p1.length, 10, 'dailyPick: 10 vragen'); eq(p1.map((q) => q.q), p2.map((q) => q.q), 'dailyPick: deterministisch per seed'); ok(new Set(p1.map((q) => q.q)).size === 10, 'dailyPick: geen dubbele'); ok(JSON.stringify(p1) !== JSON.stringify(p3), 'dailyPick: andere dag, andere mix');
  ok(p1.some((q) => q.t === 'tf'), 'dailyPick: mix van soorten'); eq(L.dailyPick(items.slice(0, 4), 10, 1).length, 4, 'dailyPick: kleine kit');
  eq(L.snelScore([true, true, true, true, true, false, true]), { pts: 80, ok: 6, wrong: 1, best: 5 }, 'snelScore met reeksbonus'); eq(L.snelScore([]), { pts: 0, ok: 0, wrong: 0, best: 0 }, 'snelScore leeg');
}

/* ---------- study-art ---------- */
{
  const A = await import('../docs/learn/study-art.js');
  eq(A.iconNameFor('🐶'), 'dog', 'kitIcon: hond'); eq(A.iconNameFor('🚀'), 'rocket', 'kitIcon: raket'); eq(A.iconNameFor('🍎'), 'apple', 'kitIcon: appel'); eq(A.iconNameFor('🌍'), 'earth', 'kitIcon: aarde'); eq(A.iconNameFor('🛡️'), 'shield', 'kitIcon: FE0F wordt genegeerd');
  ok(['dice', 'gear'].includes(A.iconNameFor('🧮')) && ['dice', 'gear'].includes(A.iconNameFor('🔢')), 'kitIcon: rekenen -> dobbelsteen of tandwiel'); eq(A.iconNameFor('🇳🇱'), null, 'vlag blijft emoji'); eq(A.iconNameFor(''), null, 'leeg');
  ok(/<img|<span/.test(A.kitIcon('🐶', 40)) && A.kitIcon('<b>x</b>', 20).includes('&lt;b&gt;') && !A.kitIcon('<b>x</b>', 20).includes('<b>'), 'kitIcon: HTML-string en escaping');
  ok(A.kitIcon('🇳🇱', 30).includes('🇳🇱'), 'kitIcon: vlag als emoji');
  eq(A.kitTheme({ group: 'Talen' }, null).id, 'blauw', 'thema per groep'); eq(A.kitTheme({ group: 'Talen' }, 'roze').id, 'roze', 'gekozen thema wint'); eq(A.kitTheme({ src: 'user' }, null).id, 'indigo', 'eigen kit = indigo'); ok(A.PALETTE.length >= 8, 'palet');
  eq(A.celebrationFor({ pct: 100, perfect: true, q: 1 }), { scene: 'victory', confetti: 70 }, 'feest: perfect');
  eq(A.celebrationFor({ pct: 100, record: true, q: 0 }), { scene: 'new-record', confetti: 0 }, 'feest Normaal: scene wel, confetti niet'); eq(A.celebrationFor({ pct: 100, perfect: true, reduce: true, q: 2 }), { scene: null, confetti: 0 }, 'feest: reduce = niets');
  eq(A.celebrationFor({ pct: 40, q: 2 }), { scene: null, confetti: 0 }, 'feest: laag cijfer geen feest'); eq(A.celebrationFor({ pct: 70, levelUp: true, q: 1 }).scene, 'levelup', 'feest: levelup'); eq(A.celebrationFor({ pct: 80, daily: true, q: 1 }).scene, 'daily-bonus', 'feest: dagelijks');
  ok(A.confetti(null, 10) === null && A.playScene(null, 'victory') === null, 'effecten doen niets zonder canvas');
}

/* ---------- rooktest van de hele app met stubs ---------- */
import * as HK from './learn-stubs/study/hooks.mjs';
if (registerHooks) registerHooks({ resolve: HK.resolve }); else register('./learn-stubs/study/hooks.mjs', import.meta.url);
const { installDom } = await import('./learn-stubs/study/dom.mjs');
const dom = installDom();
const stubCore = await import('./learn-stubs/study/core-stub.mjs');
const mod = await import('../docs/learn/study.js');
const view = document.createElement('div'); document.body.appendChild(view);
const cleanups = []; const errors = [];
process.on('unhandledRejection', (e) => { errors.push(e); console.error('onafgehandelde belofte:', e); });
const tick = (n = 1) => new Promise((r) => setTimeout(r, 12 * n));
const btns = (root, re) => dom.findAll(root, (e) => e.tagName === 'BUTTON' && re.test(e.textContent) && !e.disabled);
const sess = () => document.body.childNodes.find((c) => c.nodeType === 1 && c.classList.contains('ls-sess'));
const click = (root, re) => { const b = btns(root, re)[0]; if (b) b.click(); return !!b; };
async function until(fn, ms = 4000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = fn(); if (v) return v; await tick(); } return null; }
async function drive(re, doneRe, max = 600) { // klik door een sessie heen
  for (let i = 0; i < max; i++) { const s = sess(); if (!s) return 'gesloten'; if (doneRe.test(s.textContent)) return 'klaar'; const b = btns(s, re).filter((x) => !/✕/.test(x.textContent))[0]; if (b) b.click(); await tick(); }
  return 'timeout';
}

ok(typeof mod.learnStudyView === 'function' && mod.default === mod.learnStudyView, 'export learnStudyView');
for (const n of ['parsePaste', 'pairsToQuestions', 'textToQuestions', 'generate', 'encodeKit', 'decodeKit', 'gradeFor']) ok(typeof mod[n] === 'function', 'export ' + n);
const app = mod.learnStudyView({ view, uid: 'u1', me: { uid: 'u1' }, esc: (s) => s, nice: (s) => s, addCleanup: (f) => cleanups.push(f) });
await tick(5);
ok(view.textContent.includes('Learn Study'), 'titel zichtbaar'); ok(btns(view, /Start leren/).length === 1, 'start-kaart met Start leren knop'); ok(view.textContent.includes('Tafels'), 'standaard kit = Tafels (start-kaart)');
ok(dom.findAll(document.head, (e) => e.attrs['data-ls'] === 'study').length === 1, 'CSS geïnjecteerd');
for (const t of ['Kits', 'Leren', 'Toets', 'Talen', 'Voortgang']) ok(dom.findAll(view, (e) => e.classList.contains('ls-tab') && e.textContent.includes(t)).length === 1, 'tab ' + t);

// LEREN
globalThis.__ASK = { mode: 'mix' };
click(view, /Start leren/); await tick(); ok(!!sess(), 'Leren opent sessie-scherm');
const res = await drive(/Snap ik|Doorgaan/, /Sessie klaar/); eq(res, 'klaar', 'Leren-sessie loopt door tot einde'); ok(sess().textContent.includes('XP'), 'beloning getoond');
ok(stubCore.__mem.xp > 0 && stubCore.__mem.coins > 0, 'XP en munten toegekend'); ok([...stubCore.__mem.box.values()].length > 0, 'Prog.record aangeroepen');
click(sess(), /^Klaar/); await tick(3); ok(!sess(), 'sessie sluit'); ok(document.body.childNodes.every((c) => !(c.classList && c.classList.contains('ls-sess'))), 'geen overgebleven overlays');

// OEFENEN met alle vraagsoorten (wereld-mix)
async function openKit(name) { click(view, /^📚/); await tick(2); const kitBtn = btns(view, new RegExp(name))[0]; if (!kitBtn) { ok(false, 'kit niet gevonden: ' + name); return false; } kitBtn.click(); await tick(2); return true; }
// tab Kits: groepen openen
const kitsTab = dom.findAll(view, (e) => e.classList.contains('ls-tab') && e.textContent.includes('Kits'))[0]; kitsTab.click(); await tick(3);
ok(view.textContent.includes('Nieuwe kit') && view.textContent.includes('Kit-code'), 'Kits-tab knoppen');
btns(view, /Wereld/)[0] && btns(view, /Wereld/)[0].click(); await tick(2);
const wk = btns(view, /Wereld mix/)[0]; ok(!!wk, 'Wereld mix zichtbaar na openen groep'); wk.click(); await tick(3);
const sheetEl = document.body.childNodes.find((c) => c.nodeType === 1 && c.classList.contains('ls-sheet')); ok(!!sheetEl, 'kit-sheet opent');
globalThis.__ASK = { mode: 'mix' }; globalThis.__ASKED = [];
click(sheetEl, /Oefenen/); await tick(3); const os = sess(); ok(os && os.textContent.includes('Vraagsoorten'), 'oefen-setup');
click(os, /Start oefenen/); await tick(); const r2 = await drive(/Doorgaan/, /Goed geoefend|Foutloos!/); ok(r2 === 'klaar', 'Oefenen eindigt: ' + r2);
const askedTypes = new Set(globalThis.__ASKED.map((a) => a.q.t)); ok(askedTypes.size >= 3, 'meerdere vraagsoorten gevraagd: ' + [...askedTypes]);
ok(globalThis.__ASKED.every((a) => a.o.feedback === false), 'ask met eigen feedback'); ok(btns(sess(), /Oefen mijn fouten/).length === 1, 'oefen-mijn-fouten knop');
click(sess(), /Oefen mijn fouten/); await tick(3); const r2b = await drive(/Doorgaan/, /Goed geoefend|Foutloos!/); ok(r2b === 'klaar', 'fouten-oefening eindigt'); click(sess(), /^Klaar/); await tick(3);

// TOETS
await (async () => {
  const tt = dom.findAll(view, (e) => e.classList.contains('ls-tab') && e.textContent.includes('Toets'))[0]; tt.click(); await tick(2);
  ok(btns(view, /^✍️ Toets maken/).length === 1, 'Toets-tab'); globalThis.__ASK = { mode: 'mix' }; globalThis.__ASKED = [];
  click(view, /^✍️ Toets maken/); await tick(3); ok(sess().textContent.includes('Geen limiet'), 'toets-setup'); click(sess(), /^10$/); click(sess(), /Start toets/); await tick();
  const r = await drive(/^$/, /Jouw cijfer/, 400); eq(r, 'klaar', 'Toets eindigt');
  const s = sess().textContent; ok(/Jouw cijfer/.test(s) && /Alle vragen/.test(s), 'cijfer en overzicht'); ok(!/Goed zo/.test(s), 'geen feedback tijdens toets');
  ok(globalThis.__ASKED.every((a) => a.o.hints === 0), 'toets: geen hints'); ok(stubCore.Prog.history('p-wereld').length === 1, 'toets in geschiedenis'); ok(btns(sess(), /Oefen mijn fouten/).length === 1, 'toets: oefen fouten');
  click(sess(), /^Klaar/); await tick(3);
})();

// LEVENS
await (async () => {
  const lt = dom.findAll(view, (e) => e.classList.contains('ls-tab') && e.textContent.includes('Leren'))[0]; lt.click(); await tick(2);
  globalThis.__ASK = { mode: 'wrong' }; click(view, /Levens/); await tick(3); ok(sess().textContent.includes('levens'), 'levens-setup'); click(sess(), /^▶ Start$/); await tick();
  const r = await drive(/Doorgaan/, /Alle levens op|Nieuw record/, 300); eq(r, 'klaar', 'Levens-modus eindigt als levens op zijn'); ok(globalThis.__ASKED.length >= 5, 'levens: 3+1 levens + schild = 5 fouten: ' + globalThis.__ASKED.length);
  click(sess(), /^Klaar/); await tick(3);
})();

// FLITSKAARTEN
await (async () => {
  globalThis.__ASK = { mode: 'correct' }; click(view, /Flitskaarten/); await tick(3); click(sess(), /^10$/); click(sess(), /Start/); await tick(2);
  let n = 0; for (let i = 0; i < 40 && sess() && !/gekend/.test(sess().textContent.replace('tik om om te draaien', '')) ; i++) { const flip = dom.findAll(sess(), (e) => e.classList.contains('ls-flip'))[0]; if (flip) { flip.dispatch('pointerdown', { clientX: 0 }); flip.dispatch('pointerup', { clientX: 0 }); ok(flip.classList.contains('f'), 'kaart draait om'); } const y = btns(sess(), /Ik wist het/)[0]; if (y) { n++; y.click(); } await tick(2); if (n >= 10) break; }
  await tick(3); ok(sess() && /Alle kaarten gekend|gekend/.test(sess().textContent), 'flits: einde bereikt'); click(sess(), /^Klaar/); await tick(3);
})();

// TALEN (Engels)
await (async () => {
  const tt = dom.findAll(view, (e) => e.classList.contains('ls-tab') && e.textContent.includes('Talen'))[0]; tt.click(); await tick(4);
  ok(view.textContent.includes('Engels') && view.textContent.includes('Engels woordjes'), 'taalkaart toont Engels'); btns(view, /Engels woordjes/)[0].click(); await tick(3);
  ok(sess() && sess().textContent.includes('Richting'), 'talen-setup'); stubCore.TTS.setOn(true); stubCore.TTS.spoken.length = 0; globalThis.__ASK = { mode: 'correct' }; globalThis.__ASKED = []; click(sess(), /Start/); await tick();
  const r = await drive(/Volgende|Doorgaan/, /woordjes geoefend/, 500); eq(r, 'klaar', 'Talen eindigt'); ok(stubCore.TTS.spoken.length > 0, 'woordjes worden voorgelezen (zien+horen)');
  ok(globalThis.__ASKED.some((a) => a.q.g === 'woord') && globalThis.__ASKED.some((a) => a.q.t === 'mc'), 'talen: kiezen en typen'); click(sess(), /^Klaar/); await tick(3);
})();

// VOORTGANG
await (async () => {
  const pt = dom.findAll(view, (e) => e.classList.contains('ls-tab') && e.textContent.includes('Voortgang'))[0]; pt.click(); await tick(10);
  const t = view.textContent; ok(t.includes('Dagdoel') && t.includes('reeks') && t.includes('Level'), 'voortgang: dagdoel/streak/level'); ok(t.includes('Beheersing per kit') && t.includes('Tafels'), 'voortgang: beheersing per kit'); ok(t.includes('Prestaties (1/2)'), 'voortgang: prestaties'); ok(t.includes('Toets-geschiedenis'), 'voortgang: geschiedenis');
})();

// KIT-MAKER
await (async () => {
  click(view, /Nieuwe kit/) || dom.findAll(view, (e) => e.classList.contains('ls-tab') && e.textContent.includes('Kits'))[0].click();
  const kt = dom.findAll(view, (e) => e.classList.contains('ls-tab') && e.textContent.includes('Kits'))[0]; kt.click(); await tick(2); click(view, /Nieuwe kit/); await tick(2);
  const s = sess(); ok(s && s.textContent.includes('Snel toevoegen'), 'maker opent'); const ins = dom.findAll(s, (e) => e.tagName === 'INPUT');
  const nameIn = ins.find((e) => /Naam van je kit/.test(e.attrs.placeholder || '')); nameIn.value = 'Mijn dieren'; nameIn.dispatch('input');
  const qi = ins.find((e) => e.attrs.placeholder === 'Vraag of woord'), ai = ins.find((e) => e.attrs.placeholder === 'Antwoord');
  qi.value = 'Hond in het Engels'; ai.value = 'dog'; ai.dispatch('keydown', { key: 'Enter' }); await tick(); ok(s.textContent.includes('Hond in het Engels'), 'snel toevoegen werkt'); ok(s.textContent.includes('1 vragen'), 'teller');
  click(s, /Plakken/); await tick(); const ta = dom.findAll(s, (e) => e.tagName === 'TEXTAREA')[0]; ta.value = 'huis - house\nkat - cat\nhond - dog\nboom - tree'; ta.dispatch('input'); await tick(); ok(s.textContent.includes('streepje') && s.textContent.includes('4 paren'), 'plak-import herkent formaat');
  click(s, /vragen toevoegen/); await tick(2); ok(s.textContent.includes('9 vragen') || /\d+ vragen/.test(s.textContent), 'plak-import toegevoegd');
  click(s, /Tekst/); await tick(); const ta2 = dom.findAll(s, (e) => e.tagName === 'TEXTAREA')[0]; click(s, /Voorbeeldtekst/); ta2.value = 'De Eiffeltoren staat in Parijs en is 330 meter hoog. Hij werd gebouwd in 1889 door Gustave Eiffel.'; click(s, /Maak vragen/); await tick(); ok(dom.findAll(s, (e) => e.tagName === 'INPUT' && e.attrs.type === 'checkbox').length >= 3, 'tekst->vragen: aanvinkbare voorstellen'); click(s, /vragen toevoegen/); await tick(2);
  click(s, /Generator/); await tick(); click(s, /Tafels/); await tick(); ok(s.textContent.includes('Voorbeeld'), 'generator-voorbeeld'); click(s, /vragen toevoegen/); await tick(2);
  click(s, /Delen/); await tick(); const code = dom.findAll(s, (e) => e.tagName === 'TEXTAREA')[0].value; ok(code.startsWith('LK'), 'deelcode'); click(s, /Kopieer code/); await tick(2); eq(globalThis.__clip, code, 'code naar klembord');
  click(s, /Opslaan/); await tick(2); const saved = stubCore.Kits.list(); eq(saved.length, 1, 'kit opgeslagen'); eq(saved[0].name, 'Mijn dieren', 'naam opgeslagen'); ok(saved[0].qs.length > 20, 'vragen opgeslagen: ' + saved[0].qs.length); ok(saved[0].qs.every((q) => L.cleanQ(q)), 'opgeslagen vragen geldig'); ok(saved[0].id && saved[0].src === 'user', 'id en src');
  // sluiten zonder wijzigingen werkt direct
  click(s, /✕/); await tick(3); ok(!sess(), 'maker sluit na opslaan');
  // importeren via code in een tweede kit
  click(view, /Kit-code/); await tick(2); const ic = sess(); const ta3 = dom.findAll(ic, (e) => e.tagName === 'TEXTAREA')[0]; ta3.value = code; ta3.dispatch('input'); await tick(); ok(ic.textContent.includes('Mijn dieren'), 'code-import toont kit'); click(ic, /Toevoegen aan mijn kits/); await tick(3); eq(stubCore.Kits.list().length, 2, 'geïmporteerde kit opgeslagen'); ok(!sess(), 'import sluit');
  ta3.value = 'LK2.kapot'; ta3.dispatch('input');
  // niet-opgeslagen waarschuwing
  click(view, /Nieuwe kit/); await tick(2); const s2 = sess(); const n2 = dom.findAll(s2, (e) => e.tagName === 'INPUT' && /Naam/.test(e.attrs.placeholder || ''))[0]; n2.value = 'X'; n2.dispatch('input'); click(s2, /✕/); ok(!!sess(), 'niet-opgeslagen: eerste ✕ waarschuwt'); click(sess(), /✕/); await tick(3); ok(!sess(), 'tweede ✕ sluit');
})();

// DAGELIJKSE 10 en SNEL-RONDE
await (async () => {
  const lt = dom.findAll(view, (e) => e.classList.contains('ls-tab') && e.textContent.includes('Leren'))[0]; lt.click(); await tick(2);
  ok(btns(view, /Dagelijkse 10/).length === 1 && btns(view, /Snel-ronde/).length === 1, 'Leren-tab toont Dagelijkse 10 en Snel-ronde');
  globalThis.__ASK = { mode: 'mix' }; globalThis.__ASKED = [];
  click(view, /Dagelijkse 10/); await tick(3); ok(sess() && sess().textContent.includes('dagen reeks'), 'dagelijks: start-scherm'); click(sess(), /Start de Dagelijkse 10/); await tick();
  const r = await drive(/Doorgaan/, /Dagelijkse 10 klaar|Weer geoefend/, 300); eq(r, 'klaar', 'dagelijks eindigt'); eq(globalThis.__ASKED.length, 10, 'dagelijks: precies 10 vragen');
  const d = JSON.parse(localStorage.getItem('learn:u1:study-daily')); eq(d.streak, 1, 'dagelijks: reeks opgeslagen'); eq(d.last, L.dayKey(), 'dagelijks: datum opgeslagen'); ok(sess().textContent.includes('bonus munten'), 'dagelijks: bonus getoond');
  click(sess(), /^Klaar|Oefen mijn fouten/); await tick(3); for (const x of document.body.childNodes.filter((c) => c.nodeType === 1 && c.classList.contains('ls-sess'))) { click(x, /✕/); } await tick(2);
  click(view, /Dagelijkse 10/); await tick(3); ok(sess().textContent.includes('Vandaag al gedaan'), 'dagelijks: tweede keer zonder bonus'); click(sess(), /✕/); await tick(2);
  globalThis.__ASK = { mode: 'correct' }; globalThis.__ASKED = [];
  click(view, /Snel-ronde/); await tick(3); ok(sess() && sess().textContent.includes('Tijd') && sess().textContent.includes('record'), 'snel: setup'); click(sess(), /30 sec/); click(sess(), /Start de klok/); await tick(3);
  for (let i = 0; i < 8 && sess() && !/Tijd om|Nieuw record/.test(sess().textContent); i++) await tick(10);
  // de klok loopt op echte seconden (setTimeout is versneld in de stub, setInterval niet): sluit af via sluiten als het nog loopt
  if (sess() && !/Tijd om|Nieuw record/.test(sess().textContent)) { ok(globalThis.__ASKED.length > 3, 'snel: veel vragen snel achter elkaar: ' + globalThis.__ASKED.length); click(sess(), /✕/); await tick(3); }
  else { ok(true, 'snel: klaar'); click(sess(), /^Klaar/); await tick(3); }
  ok(!sess(), 'snel: sessie gesloten');
})();

// Voorlezen-instellingen
await (async () => {
  click(view, /Voorlezen/); await tick(2); const sh = document.body.childNodes.find((c) => c.nodeType === 1 && c.classList.contains('ls-sheet')); ok(sh && sh.textContent.includes('Stem per taal'), 'voorlezen-sheet'); click(sh, /🔊 Aan/); await tick(); ok(stubCore.TTS.on === true, 'voorlezen aan'); stubCore.TTS.setOn(false); click(document.body.childNodes.find((c) => c.classList && c.classList.contains('ls-sheet')), /Klaar/); await tick();
  eq(JSON.parse(localStorage.getItem('learn:u1:study-tts')), true, 'voorlezen onthouden');
})();

// opruimen
const cssBefore = dom.findAll(document.head, (e) => e.attrs['data-ls']).length;
dom.findAll(view, (e) => e.classList.contains('ls-tab') && e.textContent.includes('Leren'))[0].click(); await tick(2); click(view, /Start leren/); await tick(3); ok(!!sess(), 'sessie open voor destroy-test');
cleanups.forEach((f) => f()); await tick(3);
ok(!sess(), 'destroy sluit open sessie'); ok(dom.findAll(document.head, (e) => e.attrs['data-ls']).length === cssBefore - 1, 'destroy verwijdert CSS'); ok(view.childNodes.length === 0, 'destroy leegt view');
ok(document.body.childNodes.filter((c) => c.nodeType === 1 && /ls-(sheet|toast|sess)/.test(c.className)).length === 0, 'geen overlays/toasts na destroy');
ok((globalThis.__docListeners.keydown || []).length === 0, 'geen overgebleven keydown-listeners: ' + (globalThis.__docListeners.keydown || []).length);
ok(errors.length === 0, 'geen onafgehandelde fouten');

console.log(fails ? `\n${fails} van ${checks} controles MISLUKT` : `OK: alle ${checks} controles geslaagd`);
process.exit(fails ? 1 : 0);
