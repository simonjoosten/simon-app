// Genereert docs/learn/packs/<id>.js voor de PACKS-C kits (nieuwe leerthema's, fase 2).
// Gebruik:  node tools/make-packs-c.mjs      (schrijft de pack-bestanden; draai daarna python3 tools/make-learn-packs.py voor index.js)
// Bronnen: tools/packs-c/*.mjs (zelfde bouwstenen als PACKS-B: tools/packs-b/lib.mjs). Deterministisch (seed = pack-id).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, '..', 'docs', 'learn', 'packs');
const FILES = ['a', 'b', 'c'];

export async function buildAll() {
  const mods = await Promise.all(FILES.map((n) => import(`./packs-c/${n}.mjs`).catch((e) => { if (e.code === 'ERR_MODULE_NOT_FOUND') return { builders: [] }; throw e; })));
  const kits = [];
  for (const m of mods) for (const b of m.builders) kits.push(b());
  return kits;
}

function emit(k) {
  const m = k.meta;
  const lines = k.qs.map((q) => '  ' + JSON.stringify(q)).join(',\n');
  return `// GEGENEREERD door tools/make-packs-c.mjs (bronnen: tools/packs-c/). Niet met de hand aanpassen.
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
  for (const k of kits) {
    fs.writeFileSync(path.join(OUT, k.meta.id + '.js'), emit(k));
    total += k.qs.length;
    console.log(String(k.qs.length).padStart(4), k.meta.id, k.warn.length ? 'WAARSCHUWING ' + k.warn.slice(0, 3).join(' | ') : '');
  }
  console.log(`${kits.length} packs, ${total} vragen`);
}
