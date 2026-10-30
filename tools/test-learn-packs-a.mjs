// Test voor PACKS-A (talen & spelling): node tools/test-learn-packs-a.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'learn');
const GROUPS = ['Talen', 'Spelling', 'Rekenen', 'Wereld', 'Natuur', 'Mens', 'Geschiedenis', 'Creatief', 'Technologie'];
const LANGS = ['nl', 'en', 'de', 'fr', 'es'];
const TYPES = ['mc', 'type', 'tf', 'order', 'match', 'fill', 'num', 'multi'];
let normalizeQ = null;
try { normalizeQ = (await import(pathToFileURL(path.join(root, 'core.js')).href)).normalizeQ; } catch (e) { /* core niet te laden in node: sla over */ }

const MINE = fs.readdirSync(path.join(root, 'packs')).filter((f) => f.endsWith('.js') && f !== 'index.js' && /^(en|de|fr|es|nl)-/.test(f) || f === 'nl-rijmen.js');
const files = [...new Set(MINE)].sort();
let fails = 0, total = 0;
const fail = (m) => { fails++; if (fails < 60) console.log('FOUT', m); };
const emptyStr = (s) => typeof s !== 'string' || !s.trim();
const lc = (s) => String(s).trim().toLowerCase();

if (files.length < 45) fail('minder dan 45 packs: ' + files.length);
const ids = new Set();
for (const f of files) {
  const m = await import(pathToFileURL(path.join(root, 'packs', f)).href + '?t=' + Math.random());
  const p = m.default; const tag = f;
  if (!p || p.id !== f.replace(/\.js$/, '')) { fail(tag + ': id komt niet overeen met bestandsnaam'); continue; }
  if (ids.has(p.id)) fail(tag + ': dubbele id'); ids.add(p.id);
  for (const k of ['name', 'emoji', 'group', 'desc']) if (emptyStr(p[k])) fail(tag + ': ' + k + ' leeg');
  if (!GROUPS.includes(p.group)) fail(tag + ': groep ' + p.group);
  if (p.lang && !LANGS.includes(p.lang)) fail(tag + ': taal');
  const kit = await p.build();
  const qs = kit.qs;
  if (kit.id !== p.id || !Array.isArray(qs)) { fail(tag + ': build() ongeldig'); continue; }
  if (qs.length < 100 || qs.length > 400) fail(`${tag}: ${qs.length} vragen (moet 100-400)`);
  const again = await p.build();
  if (JSON.stringify(again.qs) !== JSON.stringify(qs)) fail(tag + ': build() niet deterministisch');
  const seen = new Set(); const types = new Set(); let withLang = 0;
  qs.forEach((q, i) => {
    total++;
    const w = `${tag}#${i} [${q.t}] ${String(q.q).slice(0, 50)}`;
    if (!TYPES.includes(q.t)) return fail(w + ': type');
    types.add(q.t);
    if (emptyStr(q.q) || q.q.length > 400) fail(w + ': q leeg/te lang');
    if (q.d !== undefined && ![1, 2, 3].includes(q.d)) fail(w + ': d');
    if (q.lang !== undefined && !LANGS.includes(q.lang)) fail(w + ': lang');
    if (q.lang) withLang++;
    for (const k of ['x', 'say', 'e', 'g']) if (q[k] !== undefined && emptyStr(q[k])) fail(w + ': ' + k + ' leeg');
    const key = q.t + '|' + q.q + '|' + JSON.stringify(q.a);
    if (seen.has(key)) fail(w + ': duplicaat'); seen.add(key);
    if (q.t === 'mc') {
      if (!Array.isArray(q.o) || q.o.length < 2 || q.o.length > 6) fail(w + ': aantal opties ' + (q.o && q.o.length));
      else {
        if (!q.o.includes(q.a)) fail(w + ': antwoord niet in o');
        if (q.o.some(emptyStr)) fail(w + ': lege optie');
        if (new Set(q.o.map(lc)).size !== q.o.length) fail(w + ': dubbele opties ' + q.o.join('/'));
      }
    } else if (q.t === 'type') {
      if (emptyStr(q.a)) fail(w + ': a leeg');
      if (q.alt && (!Array.isArray(q.alt) || q.alt.some(emptyStr) || q.alt.includes(q.a))) fail(w + ': alt');
    } else if (q.t === 'tf') {
      if (typeof q.a !== 'boolean') fail(w + ': tf a');
    } else if (q.t === 'order') {
      if (!Array.isArray(q.a) || q.a.length < 3 || q.a.length > 6 || q.a.some(emptyStr) || new Set(q.a.map(lc)).size !== q.a.length) fail(w + ': order');
    } else if (q.t === 'match') {
      if (!Array.isArray(q.a) || q.a.length < 3 || q.a.length > 5) return fail(w + ': match aantal');
      if (q.a.some((x) => !Array.isArray(x) || x.length !== 2 || emptyStr(x[0]) || emptyStr(x[1]))) fail(w + ': match paar');
      if (new Set(q.a.map((x) => lc(x[0]))).size !== q.a.length || new Set(q.a.map((x) => lc(x[1]))).size !== q.a.length) fail(w + ': match dubbel');
    } else if (q.t === 'fill') {
      if (!q.q.includes('___')) fail(w + ': geen gat');
      if (emptyStr(q.a)) fail(w + ': a leeg');
      if (q.o) { if (!q.o.includes(q.a) || new Set(q.o.map(lc)).size !== q.o.length || q.o.length < 2) fail(w + ': fill opties ' + q.o.join('/')); }
    } else if (q.t === 'multi') {
      if (!Array.isArray(q.o) || !Array.isArray(q.a) || !q.a.length || q.a.some((x) => !q.o.includes(x)) || new Set(q.o.map(lc)).size !== q.o.length || q.a.length >= q.o.length) fail(w + ': multi');
    }
    if (normalizeQ) {
      const n = normalizeQ(JSON.parse(JSON.stringify(q)));
      if (!n) fail(w + ': normalizeQ geeft null');
      else if (JSON.stringify(n.a) !== JSON.stringify(q.a) && q.t !== 'mc' && q.t !== 'fill') fail(w + ': normalizeQ wijzigt antwoord');
    }
  });
  if (p.group === 'Talen' && withLang < qs.length * 0.5) fail(tag + ': te weinig lang');
  if (types.size < 3) fail(tag + ': te weinig vraagtypen (' + [...types] + ')');
  // vocab: unieke "Typ het ..." vragen, geen dubbele vertalingen
  const typ = qs.filter((q) => q.t === 'type' && /^Typ het /.test(q.q));
  if (new Set(typ.map((q) => lc(q.a))).size !== typ.length) fail(tag + ': dubbele doelwoorden');
  console.log(`ok ${p.id.padEnd(28)} ${String(qs.length).padStart(3)} vragen  ${[...types].sort().join(',')}`);
}
console.log(`\n${files.length} packs, ${total} vragen, ${fails} fouten`);
process.exit(fails ? 1 : 0);
