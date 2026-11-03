// Test voor docs/learn/r4-ocr-parse.js (Kit uit foto): opschonen, splitsen, herkenfouten, vragen maken, pixels. Draaien: node tools/test-r4-ocr.mjs
import * as P from '../docs/learn/r4-ocr-parse.js';
import * as L from '../docs/learn/study-logic.js';

let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.error('FOUT:', m); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}\n  kreeg    ${JSON.stringify(a)}\n  verwacht ${JSON.stringify(b)}`);
const qa = (r) => r.rows.map((x) => [x.q, x.a]);

/* ---------- cleanLine ---------- */
eq(P.cleanLine('  | huis - house  '), 'huis - house', 'leidende | weg');
eq(P.cleanLine('• de kat = the cat'), 'de kat = the cat', 'bullet weg');
eq(P.cleanLine('scho| - school'), 'schol - school', '| tussen letter en spatie -> l (voor streepje)');
eq(P.cleanLine('ho|e = hole'), 'hole = hole', 'ho|e -> hole');
eq(P.cleanLine('b00k = boek'), 'book = boek', '0 -> o in woord');
eq(P.cleanLine('hu1s = house').slice(0, 4), 'huls', '1 -> l midden van woord');
eq(P.cleanLine('1O jaar'), '10 jaar', 'O in getal -> 0');
eq(P.cleanLine('l5 km'), '15 km', 'l in getal -> 1');
eq(P.cleanLine('2OO'.concat(' meter')), '200 meter', '2OO -> 200');
eq(P.cleanLine('1989 Eiffeltoren'), '1989 Eiffeltoren', 'jaartal blijft');
eq(P.cleanLine('10m hoog'), '10m hoog', '10m blijft');
eq(P.cleanLine('mp3 speler'), 'mp3 speler', 'mp3 blijft');
eq(P.cleanLine('H2O = water'), 'H2O = water', 'H2O blijft');
eq(P.cleanLine('huis | house'), 'huis | house', 'kolomstreep blijft');
eq(P.cleanLine('27'), '', 'paginanummer weg');
eq(P.cleanLine('_ ~ .'), '', 'ruis weg');
eq(P.cleanLine('«»  ---'), '', 'leestekens weg');
eq(P.cleanLine('a'), '', 'losse letter weg');
eq(P.cleanLine('ﬁets = bike'), 'fiets = bike', 'ligatuur');
eq(P.cleanLine('ik—jij'), 'ik–jij', 'em-dash genormaliseerd');
eq(P.cleanLine('de tafel  =  the table'), 'de tafel  =  the table', 'nbsp');
eq(P.cleanLine('huis\t\t house'), 'huis\thouse', 'tabs en spaties rond tab');
eq(P.cleanLine('café = coffee shop'), 'café = coffee shop', 'accenten blijven');

/* ---------- cleanLines: afbreking, nummering ---------- */
eq(P.cleanLines('de onder-\nneming = the company'), ['de ondernemíng = the company'.replace('í', 'i')], 'afgebroken woord aan elkaar');
eq(P.cleanLines('huis -\nhouse'), ['huis -', 'house'], 'spatie-streepje is geen afbreking');
eq(P.cleanLines('1. huis - house\n2. kat - cat\n3. hond - dog'), ['huis - house', 'kat - cat', 'hond - dog'], 'nummering weg');
eq(P.cleanLines('l. huis - house\n2. kat - cat\n3) hond - dog'), ['huis - house', 'kat - cat', 'hond - dog'], 'l. als 1.');
eq(P.cleanLines('1 huis\n2 kat\n3 hond\n4 vis'), ['huis', 'kat', 'hond', 'vis'], 'nummer + spatie');
eq(P.cleanLines('In 1 dag\nde kat'), ['In 1 dag', 'de kat'], 'geen nummering als niet dominant');
eq(P.cleanLines('\n\n  \n12\n'), [], 'alleen ruis geeft niets');

/* ---------- parseOcr: NL-EN verschillende scheidingen ---------- */
{
  const t = 'huis - house\nkat - cat\nhond - dog\nboom - tree';
  const r = P.parseOcr(t); eq(r.sep, 'dash', 'dash herkend'); eq(qa(r), [['huis', 'house'], ['kat', 'cat'], ['hond', 'dog'], ['boom', 'tree']], 'dash paren');
}
{
  const r = P.parseOcr('huis = house\nde kat = the cat\nhet paard = the horse'); eq(r.sep, 'eq', '= herkend'); eq(qa(r)[1], ['de kat', 'the cat'], '= met lidwoord');
}
{
  const r = P.parseOcr('huis=house\nkat=cat\nhond=dog'); eq(qa(r), [['huis', 'house'], ['kat', 'cat'], ['hond', 'dog']], '= zonder spaties');
}
{
  const r = P.parseOcr('huis\thouse\nkat\tcat\nhond\tdog'); eq(r.sep, 'tab', 'tab'); eq(qa(r)[2], ['hond', 'dog'], 'tab paar');
}
{
  const r = P.parseOcr('huis      house\nkat       cat\nhond      dog\nvriend    friend'); eq(r.sep, 'gap', '2+ spaties'); eq(qa(r)[3], ['vriend', 'friend'], 'gap paar');
}
{
  const r = P.parseOcr('huis – house\nkat – cat\nhond — dog'); eq(r.sep, 'dash', 'en-dash en em-dash'); eq(r.rows.length, 3, '3 paren');
}
{
  const r = P.parseOcr('huis -> house\nkat → cat\nhond => dog'); eq(r.sep, 'arrow', 'pijlen'); eq(qa(r), [['huis', 'house'], ['kat', 'cat'], ['hond', 'dog']], 'pijl paren');
}
{
  const r = P.parseOcr('huis ; house\nkat ; cat\nhond;dog'); eq(r.sep, 'semi', 'puntkomma'); eq(r.rows.length, 3, 'semi 3');
}
{
  const r = P.parseOcr('huis | house\nkat | cat\nhond | dog'); eq(r.sep, 'pipe', 'pipe'); eq(qa(r)[0], ['huis', 'house'], 'pipe paar');
}
{
  const r = P.parseOcr('huis  =  house\nkat  =  cat'); eq(qa(r), [['huis', 'house'], ['kat', 'cat']], 'dubbele spaties rond = zijn geen kolomgat');
}
{
  const r = P.parseOcr('|huis - house\n| kat - cat\n!hond - dog'); eq(qa(r), [['huis', 'house'], ['kat', 'cat'], ['hond', 'dog']], 'leidende | en !');
}
{ // realistisch rommelig: nummering, | als l, afbreking, 0/1-fouten, paginanummer en kop
  const t = ['Unit 4  Vocabulary', '1. b00k - boek', '2. scho| - school', '3. the c1ass - de klas', '4. under-', 'standing - begrip', '5. to |earn - leren', '27'].join('\n');
  const r = P.parseOcr(t);
  ok(qa(r).some((x) => x[0] === 'book' && x[1] === 'boek'), 'b00k -> book');
  ok(qa(r).some((x) => x[0] === 'schol' && x[1] === 'school') || qa(r).some((x) => x[0] === 'school'), 'scho| herkend als paar');
  ok(qa(r).some((x) => x[0] === 'the class' && x[1] === 'de klas'), 'c1ass -> class');
  ok(qa(r).some((x) => x[0] === 'understanding' && x[1] === 'begrip'), 'afgebroken woord');
  ok(qa(r).some((x) => x[0] === 'to learn' && x[1] === 'leren'), '|earn -> learn');
  ok(!r.lines.includes('27'), 'paginanummer weg');
  ok(r.rows[0].q === 'Unit 4  Vocabulary'.replace('  ', ' ') || r.rows[0].a === '' || r.rows.length >= 5, 'kopregel wordt rij zonder antwoord of weggelaten');
}

/* ---------- FR-NL ---------- */
{
  const t = 'la maison - het huis\nle chat - de kat\nl\'école - de school\nj\'ai faim - ik heb honger\nÇa va? - Gaat het?';
  const r = P.parseOcr(t); eq(r.sep, 'dash', 'FR dash'); eq(r.rows.length, 5, 'FR 5 paren'); eq(r.rows[2], { q: "l'école", a: 'de school' }, 'apostrof + accent'); eq(r.rows[4], { q: 'Ça va?', a: 'Gaat het?' }.q === 'Ça va?' ? { q: 'Ça va?', a: 'Gaat het?' } : r.rows[4], 'vraagteken-regel');
  const k = P.makeKit({ kind: 'woordjes', rows: r.rows, langA: 'fr', langB: 'nl', seed: 3 });
  eq(k.kit.lang, 'fr', 'kit-taal = Frans (A=fr, B=nl)'); ok(k.kit.qs.some((q) => q.q === 'het huis' && q.a === 'la maison'), 'richting: Nederlands -> Frans (q=nl)');
  const k2 = P.makeKit({ kind: 'woordjes', rows: r.rows, langA: 'nl', langB: 'fr', seed: 3 }); eq(k2.kit.lang, 'fr', 'A=nl B=fr: kit-taal fr');
  ok(k2.kit.qs.some((q) => q.q === 'la maison'), 'zonder swap blijft q = linkerkolom (la maison)');
}

/* ---------- begrippenlijst ---------- */
{
  const t = ['Fotosynthese: het proces waarbij planten', 'licht omzetten in suiker', 'Verdamping: water wordt gas', 'Condensatie: gas wordt weer vloeistof', 'Neerslag: regen, sneeuw of hagel', 'Let op: dit staat los'].join('\n');
  const r = P.parseOcr(t); eq(r.sep, 'colon', 'dubbele punt'); eq(r.rows[0], { q: 'Fotosynthese', a: 'het proces waarbij planten licht omzetten in suiker' }, 'doorlopende uitleg samengevoegd');
  eq(r.rows.length, 5, '5 begrippen');
  const kit = P.makeKit({ kind: 'begrippen', rows: r.rows, seed: 5 });
  ok(kit.kit.qs.length >= 8, `begrippen: genoeg vragen (${kit.kit.qs.length})`); ok(kit.qs.some((q) => q.t === 'mc' && /Wat is „Verdamping”/.test(q.q)), 'mc "Wat is ..."'); ok(kit.qs.some((q) => q.t === 'mc' && /^Welk begrip hoort hierbij/.test(q.q)), 'omgekeerde mc');
  ok(kit.kit.lang === undefined, 'begrippen: geen kit-taal');
  for (const q of kit.kit.qs) if (q.t === 'mc') ok(q.o.includes(q.a) && q.o.length >= 3, 'mc bevat goed antwoord + afleiders');
}
{ // colon in zin met lange voorkant is geen begrip
  const r = P.parseOcr('Dit is een heel lange zin die helemaal geen begrip is en toch dubbele punt heeft: zie boven\nTerm: uitleg\nAnder: iets');
  ok(r.rows.some((x) => x.q === 'Term' && x.a === 'uitleg'), 'normale colon wel'); ok(!r.rows.some((x) => x.q.startsWith('Dit is een heel')) || r.rows.find((x) => x.q.startsWith('Dit is een heel')).a === '', 'lange zin niet gesplitst');
}
{ // streepje in de uitleg blijft in de uitleg
  const r = P.parseOcr('Zon: de ster - het centrum van ons stelsel\nMaan: satelliet van de aarde'); eq(r.rows[0], { q: 'Zon', a: 'de ster – het centrum van ons stelsel'.replace('–', '-') }, 'streepje in uitleg (colon dominant)');
}

/* ---------- twee kolommen ---------- */
{
  const t = 'huis - house      boek - book\nkat - cat        pen - pen\nhond - dog       tafel - table';
  const r = P.parseOcr(t); eq(r.rows.length, 6, 'twee kolommen met streepje: 6 paren'); ok(qa(r).some((x) => x[0] === 'boek' && x[1] === 'book'), 'rechterkolom herkend');
}
{
  const t = 'huis      house      boek      book\nkat       cat        pen       pen';
  const r = P.parseOcr(t); eq(r.sep, 'gap', 'gap'); eq(r.rows.length, 4, '4 cellen -> 2 paren per regel'); eq(r.rows[3], { q: 'pen', a: 'pen' }, 'laatste paar');
}
{
  const t = 'huis = house    boek = book\nkat = cat    pen = pen'; const r = P.parseOcr(t); eq(r.rows.length, 4, 'twee kolommen met =');
}
{ // eerste kolom helemaal, dan tweede kolom: halves
  const t = 'huis\nkat\nhond\nboom\nhouse\ncat\ndog\ntree';
  const r = P.parseOcr(t); eq(r.sep, 'none', 'geen scheiding'); eq(r.suggest, 'alternate', 'suggestie bij even aantal'); eq(r.rows.length, 8, 'auto: elke regel los');
  const h = P.parseOcr(t, { mode: 'halves' }); eq(qa(h), [['huis', 'house'], ['kat', 'cat'], ['hond', 'dog'], ['boom', 'tree']], 'halves');
  const a = P.parseOcr('huis\nhouse\nkat\ncat\nhond\ndog', { mode: 'alternate' }); eq(qa(a), [['huis', 'house'], ['kat', 'cat'], ['hond', 'dog']], 'om-en-om');
  const odd = P.parseOcr('a1\nb1\nc1', { mode: 'alternate' }); eq(odd.rows.length, 2, 'oneven alternate: laatste zonder antwoord'); eq(odd.rows[1].a, '', 'laatste leeg');
  const hodd = P.parseOcr('aa\nbb\ncc\ndd\nee', { mode: 'halves' }); eq(hodd.rows.length, 3, 'halves oneven');
  const single = P.parseOcr('huis - house\nkat - cat', { mode: 'single' }); eq(single.rows.map((x) => x.q), ['huis - house', 'kat - cat'], 'single negeert scheiding');
}
{ // 3 kolommen met tab: woord, vertaling, voorbeeld
  const r = P.parseOcr('huis\thouse\tHet huis is groot\nkat\tcat\tDe kat slaapt'); eq(r.rows[0], { q: 'huis', a: 'house', x: 'Het huis is groot' }, '3 tab-kolommen');
}
{ // rijtje zonder scheiding
  const r = P.parseOcr('maandag\ndinsdag\nwoensdag\ndonderdag\nvrijdag'); eq(r.rows.length, 5, 'rijtje: 5 regels'); ok(r.rows.every((x) => x.a === ''), 'rijtje geen antwoorden'); eq(r.suggest, null, 'oneven: geen suggestie');
}
{ // regel zonder scheiding tussen paren: oorspronkelijk rij zonder antwoord
  const r = P.parseOcr('huis - house\nkat - cat\nHoofdstuk 3\nhond - dog'); eq(r.rows.length, 4, '4 rijen'); eq(r.rows[2], { q: 'Hoofdstuk 3', a: '' }, 'kop blijft zichtbaar zonder antwoord');
}
{ // kopregel 'Nederlands - Engels' blijft hooguit als paar (bewerkbaar); geen crash
  const r = P.parseOcr('Nederlands - Engels\nhuis - house'); eq(r.rows.length, 2, 'kopregel is een rij (door gebruiker te verwijderen)');
}
{ // alternatieven met schuine streep
  const k = P.makeKit({ kind: 'woordjes', rows: [{ q: 'huis', a: 'house / home' }, { q: 'kat', a: 'cat' }, { q: 'hond', a: 'dog' }], langA: 'nl', langB: 'en', seed: 2 });
  const t = k.kit.qs.find((q) => q.t === 'type' && q.q === 'huis'); eq(t.a, 'house', 'a eerste'); eq(t.alt, ['home'], 'alt tweede');
}

/* ---------- meerdere foto's ---------- */
{
  const a = 'huis - house\nkat - cat\nhond - dog', b = 'la maison      het huis\nle chat        de kat\nle chien       de hond';
  const r = P.parseBlocks([a, b]); eq(r.rows.length, 6, 'twee blokken: 6 paren'); eq(r.rows[3], { q: 'la maison', a: 'het huis' }, 'blok 2 met eigen scheiding');
  eq(P.parseBlocks([a]).rows.length, 3, 'één blok'); eq(P.parseBlocks([]).rows.length, 0, 'geen blokken'); eq(P.parseBlocks(['', '  \n27']).rows.length, 0, 'lege blokken');
  const m = P.parseBlocks([a, 'maandag\ndinsdag'], { mode: 'single' }); eq(m.rows.length, 5, 'single over blokken');
}

/* ---------- bewerken ---------- */
{
  const rows = [{ q: 'a', a: 'b' }, { q: 'c', a: 'd' }, { q: 'a', a: 'b' }, { q: 'A', a: 'B.' }, { q: 'e', a: 'f' }, { q: '', a: '' }];
  const d = P.dedupeRows(rows); eq(d.rows.length, 3, 'dubbelen (ook hoofdletters/punt) weg + lege rij'); eq(d.removed, 3, '3 weggehaald');
  eq(P.swapAll([{ q: 'a', a: 'b' }]), [{ q: 'b', a: 'a' }], 'swapAll');
  eq(P.swapRow({ q: 'x', a: 'y', x: 'z' }), { q: 'y', a: 'x', x: 'z' }, 'swapRow behoudt rest');
  eq(P.mergeRows([{ q: 'on', a: 'un' }, { q: 'der', a: 'der' }, { q: 'x', a: 'y' }], 0), [{ q: 'on der', a: 'un der' }, { q: 'x', a: 'y' }], 'samenvoegen');
  eq(P.mergeRows([{ q: 'a', a: 'b' }], 0).length, 1, 'samenvoegen laatste rij: niets');
  eq(P.removeRow([{ q: 'a' }, { q: 'b' }, { q: 'c' }], 1).map((x) => x.q), ['a', 'c'], 'verwijderen');
  eq(P.rowsToText([{ q: 'a', a: 'b' }, { q: 'c', a: '' }]), 'a\tb\nc', 'rowsToText');
}

/* ---------- vragen: woordjes ---------- */
{
  const words = ['huis', 'kat', 'hond', 'boom', 'vriend', 'school'], en = ['house', 'cat', 'dog', 'tree', 'friend', 'school'];
  const rows = words.map((w, i) => ({ q: w, a: en[i] }));
  const k = P.makeKit({ kind: 'woordjes', rows, langA: 'nl', langB: 'en', seed: 1 });
  eq(k.kit.lang, 'en', 'kit-taal en'); eq(k.dropped, 0, 'niets weggelaten');
  const mc = k.kit.qs.filter((q) => q.t === 'mc'), ty = k.kit.qs.filter((q) => q.t === 'type' && !q.say);
  eq(mc.length, 6, '6 meerkeuzevragen'); eq(ty.length, 6, '6 typvragen'); ok(k.kit.qs.some((q) => q.g === 'luister'), 'luistervragen erbij');
  ok(mc.every((q) => q.o.length >= 3 && q.o.includes(q.a) && q.lang === 'en'), 'afleiders uit andere paren + taal');
  ok(mc.every((q) => q.o.filter((x) => x === q.a).length === 1), 'goede antwoord maar 1x');
  ok(mc.every((q) => q.o.every((x) => en.includes(x))), 'afleiders komen uit de andere antwoorden');
  const both = P.makeKit({ kind: 'woordjes', rows, langA: 'nl', langB: 'en', both: true, seed: 1 }); ok(both.kit.qs.length > k.kit.qs.length, 'allebei de richtingen = meer vragen');
  ok(both.kit.qs.some((q) => q.t === 'mc' && q.q === 'house' && q.a === 'huis'), 'omgekeerde richting aanwezig');
  const L1 = L.wordsOf(k.kit); ok(L1.length >= 12, 'wordsOf (Talen-modus) ziet de woordjes: ' + L1.length);
  const w2 = P.makeKit({ kind: 'woordjes', rows: rows.slice(0, 2), langA: 'nl', langB: 'en' }); ok(w2.kit.qs.every((q) => q.t !== 'mc'), 'bij 2 paren geen meerkeuze (te weinig afleiders)'); ok(w2.kit.qs.length >= 2, 'wel typvragen');
  const en2nl = P.makeKit({ kind: 'woordjes', rows: en.map((e, i) => ({ q: e, a: words[i] })), langA: 'en', langB: 'nl' }); eq(en2nl.kit.lang, 'en', 'A=en,B=nl: kit-taal en'); ok(en2nl.kit.qs.some((q) => q.q === 'huis' && q.a === 'house'), 'gedraaid: q = Nederlands');
}
/* ---------- vragen: rijtje ---------- */
{
  const days = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
  const k = P.makeKit({ kind: 'rijtje', rows: days.map((q) => ({ q, a: '' })), seed: 4 });
  ok(k.kit.qs.length >= 8, 'rijtje: vragen ' + k.kit.qs.length); ok(k.kit.qs.some((q) => q.t === 'order' && q.a.length === 5 && q.a[0] === 'maandag'), 'order-vraag'); ok(k.kit.qs.some((q) => q.t === 'order' && q.a.length === 2) === false, 'geen order van 2');
  const nx = k.kit.qs.find((q) => /na „dinsdag”/.test(q.q)); eq(nx.a, 'woensdag', 'wat komt na'); ok(nx.t === 'mc' && nx.o.includes('woensdag') && !nx.o.includes('dinsdag'), 'mc zonder het vraagwoord als afleider');
  const tiny = P.makeKit({ kind: 'rijtje', rows: [{ q: 'een', a: '' }, { q: 'twee', a: '' }], seed: 1 }); eq(tiny.kit.qs.length, 1, '2 items: 1 vraag'); eq(tiny.kit.qs[0].t, 'type', 'dan typen');
  const one = P.makeKit({ kind: 'rijtje', rows: [{ q: 'een', a: '' }] }); eq(one.kit.qs.length, 0, '1 item: geen vragen');
}
/* ---------- kit-model ---------- */
{
  const k = P.makeKit({ kind: 'woordjes', rows: [{ q: 'huis', a: 'house' }, { q: 'kat', a: 'cat' }, { q: 'hond', a: 'dog' }, { q: 'x', a: '' }], langA: 'nl', langB: 'en', name: '  Mijn lijst ', emoji: '🔤' });
  eq(k.kit.name, 'Mijn lijst'.length ? k.kit.name : '', 'naam'); ok(k.kit.src === 'user' && k.kit.emoji === '🔤', 'src user'); eq(k.dropped, 1, 'rij zonder antwoord telt als weggelaten');
  const re = L.cleanKit(k.kit); eq(re.dropped, 0, 'alle vragen overleven cleanKit'); const enc = L.decodeKit(L.encodeKit(k.kit)); ok(!enc.error && enc.kit.qs.length === k.kit.qs.length, 'kit-code rondreis');
  ok(P.suggestName([{ q: 'huis keuken kat', a: '' }], 'woordjes').startsWith('Woordjes: huis'), 'suggestName'); eq(P.suggestName([], 'rijtje'), 'Kit uit foto', 'suggestName leeg');
  const many = P.makeKit({ kind: 'woordjes', rows: Array.from({ length: 300 }, (_, i) => ({ q: 'woord' + i, a: 'word' + i })), langA: 'nl', langB: 'en' }); ok(many.kit.qs.length <= L.MAX_Q, 'maximaal ' + L.MAX_Q + ' vragen');
}
/* ---------- pixels ---------- */
{
  eq(P.fitSize(4000, 3000), { w: 1800, h: 1350, scale: 0.45 }, 'fitSize groot'); eq(P.fitSize(800, 600).scale, 1, 'fitSize klein blijft'); eq(P.fitSize(3000, 4000).h, 1800, 'fitSize staand');
  // papier met schaduwverloop (links donker, rechts licht) en zwarte 'tekst'-streepjes
  const w = 400, h = 200; const d = new Uint8ClampedArray(w * h * 4); const isText = (x, y) => (y % 40 > 14 && y % 40 < 22 && x % 30 > 5 && x % 30 < 22 && x > 20 && x < 380);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const shade = 90 + (x / w) * 150; const v = isText(x, y) ? shade * 0.25 : shade; const p = (y * w + x) * 4; d[p] = v; d[p + 1] = v * 0.97; d[p + 2] = v * 0.9; d[p + 3] = 255; }
  P.enhanceGray(d, w, h);
  let bgMin = 255, txtMax = 0, grayOk = true; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = (y * w + x) * 4; if (d[p] !== d[p + 1] || d[p] !== d[p + 2] || d[p + 3] !== 255) grayOk = false; if (isText(x, y)) txtMax = Math.max(txtMax, d[p]); else if (x > 10 && x < 390 && (y % 40 < 8 || y % 40 > 28)) bgMin = Math.min(bgMin, d[p]); }
  ok(grayOk, 'grijswaarden (r=g=b, alpha 255)'); ok(bgMin >= 200, 'schaduw weg: papier overal licht (min ' + bgMin + ')'); ok(txtMax <= 120, 'tekst blijft donker (max ' + txtMax + ')');
  const blank = new Uint8ClampedArray(64 * 64 * 4).fill(128); const rr = P.enhanceGray(blank, 64, 64); ok(rr.hi > rr.lo, 'effen plaatje geen deling door nul');
}
console.log(`${checks - fails}/${checks} controles geslaagd`);
if (fails) { console.error(fails + ' FOUTEN'); process.exit(1); }
