// Test voor de PACKS-C kits (fase 2: EHBO, muziektheorie, religies, sterrenbeelden, beroepen, verkeersborden, dialecten, gezegden, vulkanen, Olympische sporten,
// feestdagen, dagen/maanden, water/klimaat, dieren NL, beroemde Nederlanders, Griekse mythologie, ontdekkers, robots/AI, gesteenten, rekentaal, eten, fruit/groente).
// Uitvoeren: node tools/test-learn-packsc.mjs   (na: node tools/make-packs-c.mjs en python3 tools/make-learn-packs.py)
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
const { buildAll } = await import('./make-packs-c.mjs');
const kits = await buildAll();

const GROUPS = ['Rekenen', 'Wereld', 'Natuur', 'Mens', 'Geschiedenis', 'Technologie', 'Creatief', 'Spelling'];
const SPEC_GROUPS = ['Talen', 'Spelling', 'Rekenen', 'Wereld', 'Natuur', 'Mens', 'Geschiedenis', 'Creatief', 'Technologie'];

/* ---------- 1. kits en pakketbestanden ---------- */
ok(kits.length >= 20, `minstens 20 nieuwe kits (nu ${kits.length})`);
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
    ok(built.id === id && built.qs.length === k.qs.length && JSON.stringify(built.qs) === JSON.stringify(k.qs), `${id}: pack-bestand == generator (draai make-packs-c.mjs opnieuw?)`);
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

/* ---------- 3. extra: feiten-steekproeven ---------- */
const byId = Object.fromEntries(kits.map((k) => [k.meta.id, k]));
const has = (id, pred, m) => ok(byId[id] && byId[id].qs.some(pred), m);
has('sterrenbeelden', (q) => q.t === 'mc' && /5 mei/.test(q.q) && q.a === 'de Stier', 'jarig 5 mei = Stier');
has('sterrenbeelden', (q) => q.t === 'mc' && /10 december/.test(q.q) && q.a === 'de Boogschutter', 'jarig 10 december = Boogschutter');
has('sterrenbeelden', (q) => q.t === 'mc' && /5 januari/.test(q.q) && q.a === 'de Steenbok', 'jarig 5 januari = Steenbok');
has('dagen-maanden', (q) => q.t === 'num' && /februari/.test(q.q) && q.a === 28, 'februari 28 dagen');
has('dagen-maanden', (q) => q.t === 'num' && /Hoeveel dagen heeft juli/.test(q.q) && q.a === 31, 'juli 31 dagen');
has('ehbo', (q) => q.t === 'mc' && /alarmnummer/.test(q.q) && q.a === '112', '112');
has('nl-feestdagen', (q) => q.t === 'mc' && /Wanneer is Koningsdag/.test(q.q) && q.a === '27 april', 'Koningsdag 27 april');
has('ontdekkingsreizigers', (q) => q.t === 'mc' && /1492/.test(q.a + q.q), 'Columbus 1492');
has('griekse-mythologie', (q) => q.t === 'mc' && /Hoe heet de Griekse god Zeus/.test(q.q) && q.a === 'Jupiter', 'Zeus = Jupiter');
// maanden met 31 dagen kloppen met een onafhankelijke tabel
const dim = { januari: 31, februari: 28, maart: 31, april: 30, mei: 31, juni: 30, juli: 31, augustus: 31, september: 30, oktober: 31, november: 30, december: 31 };
for (const q of byId['dagen-maanden'].qs) { const m = /^Hoeveel dagen heeft (\w+) \(in een gewoon jaar\)\?$/.exec(q.q); if (m) ok(dim[m[1]] === q.a, `maand ${m[1]} dagen`); const t = /^(\w+) heeft (\d+) dagen\.$/.exec(q.q); if (t && q.t === 'tf') ok((dim[t[1].toLowerCase()] === Number(t[2])) === q.a, `tf ${q.q}`); }
// rekentaal: getallen herrekend
for (const k of byId['rekentaal'].chk) { const q = byId['rekentaal'].qs[k.i]; ok(Math.abs(Number(new Function(`return (${k.c});`)()) - q.a) < 1e-9, `rekentaal ${q.q}`); }
// elke kit staat in de index met dezelfde vraagtelling
for (const k of kits) { const m = new RegExp(`"id": "${k.meta.id}"[^\\n]*?"count": (\\d+)`).exec(idx); ok(!idx || (m && Number(m[1]) === k.qs.length), `${k.meta.id}: index-telling ${m && m[1]} == ${k.qs.length}`); }
// mc: het goede antwoord staat niet als zelfstandig foute optie in de vraag zelf (geen weggever)
for (const k of kits) for (const q of k.qs) if (q.t === 'mc') ok(!q.q.toLowerCase().includes(String(q.a).toLowerCase()) || String(q.a).length < 4, `${k.meta.id}: antwoord staat in de vraag: ${q.q}`);

console.log(`packs-c: ${kits.length} kits, ${totalQ} vragen, ${passes} controles ok, ${fails} fout`);
if (fails) { console.error(bad.slice(0, 20).join('\n')); process.exit(1); }
