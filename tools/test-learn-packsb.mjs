// Test voor de PACKS-B kits (Rekenen, Wereld, Natuur, Mens, Geschiedenis, Technologie, Creatief).
// Uitvoeren: node tools/test-learn-packsb.mjs   (na: node tools/make-packs-b.mjs)
// Controleert: structuur van elke vraag (ook via de echte core.normalizeQ), geen duplicaten, rekenvragen worden onafhankelijk herrekend,
// pack-bestanden == generator-uitvoer, groepsnamen kloppen met SPEC, steekproeven op feiten.
process.env.LEARN_REAL = '1';
import { register } from 'node:module';
register('./learn-stubs/loader.mjs', import.meta.url);
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
let fails = 0, passes = 0;
const bad = [];
const ok = (c, m) => { if (c) passes++; else { fails++; if (bad.length < 60) console.error('FOUT:', m); bad.push(m); } };

const core = await import('../docs/learn/core.js?v=1');
const { normalizeQ, qkey, checkAnswer } = core;
const { buildAll } = await import('./make-packs-b.mjs');
const kits = await buildAll();

const GROUPS = ['Rekenen', 'Wereld', 'Natuur', 'Mens', 'Geschiedenis', 'Technologie', 'Creatief'];
const SPEC_GROUPS = ['Talen', 'Spelling', 'Rekenen', 'Wereld', 'Natuur', 'Mens', 'Geschiedenis', 'Creatief', 'Technologie'];

/* ---------- 1. kits en pakketbestanden ---------- */
ok(kits.length >= 55, `minstens 55 kits (nu ${kits.length})`);
ok(new Set(kits.map((k) => k.meta.id)).size === kits.length, 'unieke pack-id\'s');
for (const k of kits) {
  const m = k.meta, id = m.id;
  ok(GROUPS.includes(m.group) && SPEC_GROUPS.includes(m.group), `${id}: groep ${m.group} bestaat in SPEC`);
  ok(m.name && m.emoji && m.desc && /^[a-z0-9-]+$/.test(id), `${id}: id/name/emoji/desc aanwezig`);
  ok(k.qs.length >= 80 && k.qs.length <= 400, `${id}: ${k.qs.length} vragen (80-400)`);
  ok(k.warn.length === 0, `${id}: generator-waarschuwingen: ${k.warn.slice(0, 2).join(' | ')}`);
  const file = path.join(here, '..', 'docs', 'learn', 'packs', id + '.js');
  ok(fs.existsSync(file), `${id}: pack-bestand bestaat`);
  if (fs.existsSync(file)) {
    const mod = await import(pathToFileURL(file).href);
    const p = mod.default;
    ok(p.id === id && p.group === m.group && p.name === m.name && typeof p.build === 'function', `${id}: default export klopt`);
    const built = await p.build();
    ok(built.id === id && built.qs.length === k.qs.length && JSON.stringify(built.qs) === JSON.stringify(k.qs), `${id}: pack-bestand == generator (draai make-packs-b.mjs opnieuw?)`);
    const again = await p.build();
    ok(JSON.stringify(again.qs) === JSON.stringify(built.qs), `${id}: build() is deterministisch`);
  }
}
const idx = fs.existsSync(path.join(here, '..', 'docs', 'learn', 'packs', 'index.js')) ? fs.readFileSync(path.join(here, '..', 'docs', 'learn', 'packs', 'index.js'), 'utf8') : '';
if (idx) for (const k of kits) ok(idx.includes(`"${k.meta.id}"`) || idx.includes(`'${k.meta.id}'`), `${k.meta.id}: staat in packs/index.js (draai tools/make-learn-packs.py)`);

/* ---------- 2. vraagvalidatie ---------- */
const nrm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim() || String(s);
const TYPES = ['mc', 'type', 'tf', 'order', 'match', 'fill', 'num', 'multi'];
let totalQ = 0; const typeCount = {};
for (const k of kits) {
  const id = k.meta.id; const keys = new Set(); const tq = new Set(); const types = new Set();
  k.qs.forEach((q, i) => {
    const w = `${id}#${i} "${String(q.q).slice(0, 50)}"`;
    totalQ++; typeCount[q.t] = (typeCount[q.t] || 0) + 1; types.add(q.t);
    ok(TYPES.includes(q.t), `${w}: type`);
    ok(typeof q.q === 'string' && q.q.length > 2 && q.q.length <= 400, `${w}: q-lengte`);
    ok(q.d >= 1 && q.d <= 3, `${w}: d`);
    if (q.t === 'mc') { ok(Array.isArray(q.o) && q.o.length >= 3 && q.o.length <= 6, `${w}: mc 3-6 opties`); ok(q.o.includes(q.a), `${w}: mc a in o`); ok(new Set(q.o.map(nrm)).size === q.o.length, `${w}: mc unieke opties`); ok(!q.o.some((x) => x.length > 150), `${w}: mc optielengte`); }
    if (q.t === 'tf') ok(typeof q.a === 'boolean', `${w}: tf boolean`);
    if (q.t === 'type') ok(typeof q.a === 'string' && q.a.length > 0, `${w}: type a`);
    if (q.t === 'num') ok(typeof q.a === 'number' && isFinite(q.a), `${w}: num a`);
    if (q.t === 'fill') { ok(q.q.includes('___'), `${w}: fill heeft ___`); ok(typeof q.a === 'string', `${w}: fill a`); if (q.o) ok(q.o.includes(q.a) && new Set(q.o.map(nrm)).size === q.o.length, `${w}: fill opties`); }
    if (q.t === 'order') { ok(Array.isArray(q.a) && q.a.length >= 3 && q.a.length <= 6 && new Set(q.a).size === q.a.length, `${w}: order 3-6 unieke items`); }
    if (q.t === 'match') { ok(Array.isArray(q.a) && q.a.length >= 3 && q.a.length <= 5, `${w}: match 3-5 paren`); ok(new Set(q.a.map((p) => p[0])).size === q.a.length && new Set(q.a.map((p) => p[1])).size === q.a.length, `${w}: match unieke zijden`); }
    if (q.t === 'multi') { ok(Array.isArray(q.a) && q.a.length >= 1 && q.a.every((x) => q.o.includes(x)) && q.a.length < q.o.length && q.o.length <= 8 && new Set(q.o.map(nrm)).size === q.o.length, `${w}: multi`); }
    // echte core
    const nq = normalizeQ(q);
    ok(!!nq, `${w}: normalizeQ accepteert`);
    if (nq) {
      ok(JSON.stringify(nq.a) === JSON.stringify(q.a), `${w}: normalizeQ behoudt antwoord`);
      const key = qkey(nq); ok(!keys.has(key), `${w}: dubbele qkey`); keys.add(key);
      // checkAnswer: het goede antwoord is goed
      let given = q.a; if (q.t === 'match') given = q.a.map((p) => [p[0], p[1]]);
      const r = checkAnswer(nq, given);
      ok(r && r.ok === true, `${w}: checkAnswer(goed antwoord)`);
      if (q.t === 'mc') for (const o of q.o) if (o !== q.a) { const rr = checkAnswer(nq, o); ok(rr && rr.ok === false, `${w}: foute optie "${o}" mag niet goed zijn`); }
      if (q.t === 'tf') ok(checkAnswer(nq, !q.a).ok === false, `${w}: tf omgekeerd fout`);
    }
    const tk = ['mc', 'type', 'fill', 'num'].includes(q.t) ? 'a' : q.t; const tkey = tk + '|' + q.q + '|' + JSON.stringify(q.t === 'multi' ? [...q.a].sort() : q.a); ok(!tq.has(tkey), `${w}: dubbele vraag`); tq.add(tkey);
  });
  // mix van vraagtypen
  ok(types.size >= 3, `${id}: mix van vraagtypen (${[...types].join(',')})`);
  ok(k.qs.some((q) => q.t === 'mc') && k.qs.some((q) => q.t === 'tf' || q.t === 'num' || q.t === 'type'), `${id}: mc + tf/num/type aanwezig`);
}

/* ---------- 3. rekenvragen onafhankelijk herrekend ---------- */
// eigen, onafhankelijke klokuitspraak (andere opzet dan de generator)
function clockNL(h, m) {
  const words = ['twaalf', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf'];
  const w = (x) => words[((x % 12) + 12) % 12];
  const table = { 0: `${w(h)} uur`, 5: `vijf over ${w(h)}`, 10: `tien over ${w(h)}`, 15: `kwart over ${w(h)}`, 20: `tien voor half ${w(h + 1)}`, 25: `vijf voor half ${w(h + 1)}`, 30: `half ${w(h + 1)}`, 35: `vijf over half ${w(h + 1)}`, 40: `tien over half ${w(h + 1)}`, 45: `kwart voor ${w(h + 1)}`, 50: `tien voor ${w(h + 1)}`, 55: `vijf voor ${w(h + 1)}` };
  return table[m];
}
const eurFmt = (cents) => '€ ' + (Math.round(cents) / 100).toFixed(2).replace('.', ',');
let chkCount = 0, mathStatements = 0;
for (const k of kits) {
  for (const c of k.chk) {
    const q = k.qs[c.i]; const w = `${k.meta.id}#${c.i} "${q.q.slice(0, 50)}" c=${c.c}`;
    if (c.cf === 'skip') continue;
    let v;
    try { v = new Function('clockNL', 'Math', `return (${c.c});`)(clockNL, Math); } catch (e) { ok(false, `${w}: expressie faalt ${e.message}`); continue; }
    chkCount++;
    if (q.t === 'tf') { ok(Boolean(v) === q.a, `${w}: tf-controle (${v} vs ${q.a})`); continue; }
    if (q.t === 'num') { ok(Math.abs(Number(v) - q.a) < 1e-9, `${w}: num herrekend ${v} != ${q.a}`); continue; }
    if (q.t === 'order') { ok(JSON.stringify(v.map(String)) === JSON.stringify(q.a), `${w}: order herrekend`); continue; }
    if (c.cf === 'eur') { ok(eurFmt(Number(v)) === q.a || (q.a === '€ ' + Math.round(Number(v)) / 100 + '' ) , `${w}: eur ${eurFmt(Number(v))} vs ${q.a}`); continue; }
    if (c.cf === 'frac') { const [a, b] = q.a.split('/').map(Number); ok(Math.abs(a / b - Number(v)) < 1e-9, `${w}: breuk ${v} vs ${q.a}`); continue; }
    const s = typeof v === 'number' ? String(Math.round(v * 1e6) / 1e6) : String(v);
    ok(s === String(q.a) || s.replace('.', ',') === String(q.a), `${w}: tekst herrekend "${s}" vs "${q.a}"`);
  }
  // generieke herberekening van sommen die in de tekst staan
  for (const q of k.qs) {
    const op = (s) => s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
    let m;
    if (q.t === 'num' && (m = /^(\d+) ([×÷+−]) (\d+) = \?$/.exec(q.q))) { mathStatements++; ok(Math.abs(eval(op(`${m[1]}${m[2]}${m[3]}`)) - q.a) < 1e-9, `${k.meta.id}: "${q.q}" -> ${q.a}`); }
    else if (q.t === 'mc' && (m = /^(?:Reken uit: )?(\d+) ([×÷+−]) (\d+)(?: = \?)?$/.exec(q.q)) || (q.t === 'mc' && (m = /^Reken uit: (\d+) (×) (\d+)$/.exec(q.q)))) { mathStatements++; ok(String(eval(op(`${m[1]}${m[2]}${m[3]}`))) === q.a, `${k.meta.id}: mc "${q.q}" -> ${q.a}`); }
    else if (q.t === 'tf' && (m = /^(\d+) ([×÷+−]) (\d+) = (\d+)$/.exec(q.q))) { mathStatements++; ok((Math.abs(eval(op(`${m[1]}${m[2]}${m[3]}`)) - Number(m[4])) < 1e-9) === q.a, `${k.meta.id}: tf "${q.q}" is ${q.a}`); }
    else if (q.t === 'num' && (m = /^(\d+) ÷ (\d+) = \?$/.exec(q.q))) { mathStatements++; }
    else if (q.t === 'num' && (m = /^(\d+) × \? = (\d+)$/.exec(q.q))) { mathStatements++; ok(Number(m[1]) * q.a === Number(m[2]), `${k.meta.id}: "${q.q}" -> ${q.a}`); }
    else if (q.t === 'num' && (m = /^\? × (\d+) = (\d+)$/.exec(q.q))) { mathStatements++; ok(Number(m[1]) * q.a === Number(m[2]), `${k.meta.id}: "${q.q}" -> ${q.a}`); }
    else if (q.t === 'num' && (m = /^(\d+) \+ \? = (\d+)$/.exec(q.q))) { mathStatements++; ok(Number(m[1]) + q.a === Number(m[2]), `${k.meta.id}: "${q.q}" -> ${q.a}`); }
    else if (q.t === 'num' && (m = /^Welk getal is ([IVXLCDM]+) \(Romeins\)\?$/.exec(q.q))) { mathStatements++; const val = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }; let t = 0; const s = m[1]; for (let i = 0; i < s.length; i++) { const a = val[s[i]], b = val[s[i + 1]] || 0; t += a < b ? -a : a; } ok(t === q.a, `${k.meta.id}: romeins ${s} -> ${q.a} (verwacht ${t})`); }
    else if (q.t === 'num' && (m = /^Wat is ([01]+) \(binair\)/.exec(q.q))) { mathStatements++; ok(parseInt(m[1], 2) === q.a, `${k.meta.id}: binair ${m[1]}`); }
    else if (q.t === 'type' && (m = /^Hoe schrijf je (\d+) binair\?$/.exec(q.q))) { mathStatements++; ok(Number(m[1]).toString(2) === q.a, `${k.meta.id}: binair schrijven`); }
  }
}
ok(chkCount > 1500, `genoeg rekencontroles (${chkCount})`);
ok(mathStatements > 700, `genoeg tekst-sommen herrekend (${mathStatements})`);
// order-vragen met getallen moeten oplopend zijn waar de opdracht dat zegt
for (const k of kits) for (const q of k.qs) if (q.t === 'order' && /klein naar groot|stijgend/.test(q.q) && q.a.every((x) => /^-?\d+$/.test(x))) ok(q.a.every((x, i) => i === 0 || Number(q.a[i - 1]) < Number(x)), `${k.meta.id}: order oplopend "${q.q}" ${q.a}`);
// tafel-kits: antwoord moet echt tot de tafel behoren
for (let n = 2; n <= 10; n++) {
  const k = kits.find((x) => x.meta.id === `tafel-${n}`);
  ok(!!k, `tafel-${n} bestaat`);
  if (k) for (const q of k.qs) { if (q.t === 'num' && /^\d+ × \d+ = \?$/.test(q.q)) ok(q.a % n === 0, `tafel-${n}: ${q.q}`); }
}
// kits met veel vragen: verdeling vraagtypen
ok((typeCount.mc || 0) > 3000 && (typeCount.num || 0) > 1000 && (typeCount.tf || 0) > 1000 && (typeCount.order || 0) > 50 && (typeCount.match || 0) > 20 && (typeCount.multi || 0) > 50 && (typeCount.fill || 0) > 50 && (typeCount.type || 0) > 100, `alle 8 vraagtypen komen voor: ${JSON.stringify(typeCount)}`);

/* ---------- 4. steekproeven op feiten (onafhankelijk opgeschreven) ---------- */
const byId = Object.fromEntries(kits.map((k) => [k.meta.id, k]));
const ans = (id, qtext, t) => { const q = byId[id].qs.find((x) => x.q === qtext && (!t || x.t === t)); return q ? q.a : undefined; };
const spot = [
  ['hoofdsteden-europa', 'Wat is de hoofdstad van Frankrijk?', 'Parijs'], ['hoofdsteden-europa', 'Wat is de hoofdstad van Zwitserland?', 'Bern'], ['hoofdsteden-europa', 'Wat is de hoofdstad van Polen?', 'Warschau'], ['hoofdsteden-europa', 'Wat is de hoofdstad van Noorwegen?', 'Oslo'], ['hoofdsteden-europa', 'Wat is de hoofdstad van Portugal?', 'Lissabon'], ['hoofdsteden-europa', 'Wat is de hoofdstad van Hongarije?', 'Boedapest'],
  ['hoofdsteden-azie', 'Wat is de hoofdstad van Japan?', 'Tokio'], ['hoofdsteden-azie', 'Wat is de hoofdstad van India?', 'New Delhi'], ['hoofdsteden-azie', 'Wat is de hoofdstad van Turkije?', 'Ankara'], ['hoofdsteden-azie', 'Wat is de hoofdstad van Zuid-Korea?', 'Seoul'],
  ['hoofdsteden-afrika', 'Wat is de hoofdstad van Egypte?', 'Caïro'], ['hoofdsteden-afrika', 'Wat is de hoofdstad van Kenia?', 'Nairobi'], ['hoofdsteden-afrika', 'Wat is de hoofdstad van Nigeria?', 'Abuja'], ['hoofdsteden-afrika', 'Wat is de hoofdstad van Marokko?', 'Rabat'],
  ['hoofdsteden-amerika', 'Wat is de hoofdstad van Canada?', 'Ottawa'], ['hoofdsteden-amerika', 'Wat is de hoofdstad van Brazilië?', 'Brasília'], ['hoofdsteden-amerika', 'Wat is de hoofdstad van Argentinië?', 'Buenos Aires'], ['hoofdsteden-amerika', 'Wat is de hoofdstad van Suriname?', 'Paramaribo'],
  ['nl-provincies', 'Wat is de hoofdstad van de provincie Friesland?', 'Leeuwarden'], ['nl-provincies', 'Wat is de hoofdstad van de provincie Zeeland?', 'Middelburg'], ['nl-provincies', 'Wat is de hoofdstad van de provincie Noord-Holland?', 'Haarlem'], ['nl-provincies', 'Wat is de hoofdstad van de provincie Flevoland?', 'Lelystad'],
  ['nl-steden', 'In welke provincie ligt Eindhoven?', 'Noord-Brabant'], ['nl-steden', 'In welke provincie ligt Zwolle?', 'Overijssel'], ['nl-steden', 'In welke provincie ligt Maastricht?', 'Limburg'],
  ['dieren-jongen', 'Hoe heet het jong van het schaap?', 'lam'], ['dieren-jongen', 'Hoe heet het jong van het paard?', 'veulen'], ['dieren-jongen', 'Hoe heet het jong van het varken?', 'big'],
  ['dieren-geluiden', 'Welk werkwoord hoort bij het geluid van de koe?', 'loeit'], ['dieren-geluiden', 'Welk werkwoord hoort bij het geluid van de haan?', 'kraait'],
  ['valuta-wereld', 'Welke munt wordt in Japan gebruikt?', 'yen'], ['valuta-wereld', 'Welke munt wordt in Zwitserland gebruikt?', 'frank'],
  ['talen-wereld', 'Welke taal wordt in Brazilië vooral gesproken?', 'Portugees'], ['talen-wereld', 'Welke taal wordt in Oostenrijk vooral gesproken?', 'Duits'],
  ['uitvinders', 'Wie wordt gezien als uitvinder van de telefoon?', 'Alexander Graham Bell'], ['uitvinders', 'Wie wordt gezien als uitvinder van de boekdrukkunst?', 'Johannes Gutenberg'],
  ['nl-tijdlijn', 'In welk jaar gebeurde dit: Nederland wordt bevrijd? (typ het jaartal)', 1945], ['nl-tijdlijn', 'In welk jaar gebeurde dit: de VOC wordt opgericht? (typ het jaartal)', 1602], ['nl-tijdlijn', 'In welk jaar gebeurde dit: de watersnoodramp in Zeeland? (typ het jaartal)', 1953],
  ['ruimte-planeten', 'De 3e planeet vanaf de zon is ...', 'Aarde'], ['ruimte-planeten', 'De 5e planeet vanaf de zon is ...', 'Jupiter'], ['ruimte-planeten', 'De 8e planeet vanaf de zon is ...', 'Neptunus'],
  ['dieren-klassen', 'Tot welke groep dieren hoort: walvis?', 'zoogdier'], ['dieren-klassen', 'Tot welke groep dieren hoort: pinguïn?', 'vogel'], ['dieren-klassen', 'Tot welke groep dieren hoort: kikker?', 'amfibie'], ['dieren-klassen', 'Tot welke groep dieren hoort: spin?', 'spinachtige'],
  ['bekende-plekken', 'In welk land vind je het Colosseum?', 'Italië'], ['bekende-plekken', 'In welk land vind je de Taj Mahal?', 'India'], ['bekende-plekken', 'In welk land vind je Machu Picchu?', 'Peru'],
  ['kleuren-mengen', 'Wat krijg je als je geel en blauw verf mengt?', 'groen'], ['kleuren-mengen', 'Wat krijg je als je rood en geel verf mengt?', 'oranje'],
  ['mens-botten-organen', 'Hoeveel botten heeft een volwassene ongeveer?', '206'], ['mens-lichaam', 'Hoeveel tanden heeft een kind met een volledig melkgebit?', '20'],
  ['sport-regels', 'Hoeveel velden heeft een schaakbord?', '64'], ['sport-regels', 'Hoe lang is een marathon?', '42,195 km'],
];
for (const [id, q, a] of spot) { const got = ans(id, q); ok(got === a, `feit ${id} "${q}": verwacht ${a}, gevonden ${got}`); }
// klok: elke 'Hoe zeg je H:MM?' wordt met de eigen klokuitspraak vergeleken
let klok = 0;
for (const q of byId['klokkijken'].qs) { const m = /^Hoe zeg je (\d+):(\d+)\?$/.exec(q.q); if (m) { klok++; ok(clockNL(Number(m[1]), Number(m[2])) === q.a, `klok ${q.q} -> ${q.a}`); } }
ok(klok > 30, `genoeg klokvragen (${klok})`);
// vlaggen: emoji komt overeen met ISO-land (test herberekent regionale indicatoren)
const flagOf = (iso) => String.fromCodePoint(...[...iso].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
const vl = byId['vlaggen'].qs.filter((q) => q.t === 'mc' && q.q === 'Van welk land is deze vlag?');
const ISO = { Nederland: 'NL', België: 'BE', Duitsland: 'DE', Frankrijk: 'FR', Japan: 'JP', Italië: 'IT', Spanje: 'ES', Brazilië: 'BR', Canada: 'CA', Zweden: 'SE', Polen: 'PL', Oostenrijk: 'AT', Ierland: 'IE', Australië: 'AU' };
for (const q of vl) if (ISO[q.a]) ok(q.e === flagOf(ISO[q.a]), `vlag van ${q.a}`);
ok(vl.length > 60, `genoeg vlag-vragen (${vl.length})`);
// provincies: 12
ok(byId['nl-provincies'].qs.filter((q) => q.t === 'mc' && q.q.startsWith('Wat is de hoofdstad van de provincie')).length === 12, '12 provincies');
// werelddelen-vragen gebruiken alleen echte werelddelen
const CONT = new Set(['Europa', 'Azië', 'Afrika', 'Noord-Amerika', 'Zuid-Amerika', 'Oceanië', 'Antarctica']);
for (const q of byId['landen-werelddeel'].qs) if (q.t === 'mc' && q.q.startsWith('In welk werelddeel ligt')) ok(q.o.every((o) => CONT.has(o)), `werelddeel-opties: ${q.o}`);

console.log(`\n${kits.length} packs, ${totalQ} vragen, ${passes} controles goed, ${fails} fout`);
console.log('per type:', JSON.stringify(typeCount));
if (fails) { console.error(`${fails} FOUTEN`); process.exit(1); }
console.log('OK');
