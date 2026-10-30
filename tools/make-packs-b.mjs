// Genereert docs/learn/packs/<id>.js voor de PACKS-B kits (Rekenen, Wereld, Natuur, Mens, Geschiedenis, Technologie, Creatief).
// Gebruik:  node tools/make-packs-b.mjs      (schrijft de pack-bestanden; draai daarna python3 tools/make-learn-packs.py voor index.js)
// De bronnen staan in tools/packs-b/*.mjs. Alles is deterministisch (seed = pack-id).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, '..', 'docs', 'learn', 'packs');

export async function buildAll() {
  const mods = await Promise.all(['rekenen-1', 'rekenen-2', 'wereld', 'natuur', 'mens-gesch', 'tech-creatief'].map((n) => import(`./packs-b/${n}.mjs`)));
  const kits = [];
  for (const m of mods) for (const b of m.builders) kits.push(b());
  return kits;
}

function emit(k) {
  const m = k.meta;
  const lines = k.qs.map((q) => '  ' + JSON.stringify(q)).join(',\n');
  return `// GEGENEREERD door tools/make-packs-b.mjs (bronnen: tools/packs-b/). Niet met de hand aanpassen.
const QS = [
${lines},
];
export default {
  id: ${JSON.stringify(m.id)}, name: ${JSON.stringify(m.name)}, emoji: ${JSON.stringify(m.emoji)}, group: ${JSON.stringify(m.group)}, desc: ${JSON.stringify(m.desc)}, lang: ${JSON.stringify(m.lang || 'nl')},
  build() {
    return { id: ${JSON.stringify(m.id)}, name: ${JSON.stringify(m.name)}, emoji: ${JSON.stringify(m.emoji)}, desc: ${JSON.stringify(m.desc)}, lang: ${JSON.stringify(m.lang || 'nl')}, group: ${JSON.stringify(m.group)}, src: 'pack', qs: QS.map((q) => JSON.parse(JSON.stringify(q))) };
  },
};
`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const kits = await buildAll();
  fs.mkdirSync(OUT, { recursive: true });
  let total = 0;
  const list = [];
  for (const k of kits) {
    fs.writeFileSync(path.join(OUT, k.meta.id + '.js'), emit(k));
    total += k.qs.length;
    list.push({ id: k.meta.id, name: k.meta.name, emoji: k.meta.emoji, group: k.meta.group, desc: k.meta.desc, n: k.qs.length });
    if (k.warn.length) console.error('WAARSCHUWING', k.meta.id, k.warn.slice(0, 3));
  }
  console.log(`${kits.length} packs, ${total} vragen`);
  fs.writeFileSync(path.join(here, 'packs-b', 'LIJST.json'), JSON.stringify(list, null, 1));
}
