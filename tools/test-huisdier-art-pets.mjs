// Node-test voor docs/huisdier-art-pets.js  (node tools/test-huisdier-art-pets.mjs)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, '..', 'docs', 'huisdier-art-pets.js');
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pets-')), 'pets.mjs');
fs.copyFileSync(src, tmp);
const M = await import(pathToFileURL(tmp).href);

let checks = 0;
function fail(msg) { console.error('FAIL:', msg); process.exitCode = 1; throw new Error(msg); }

// eenvoudige XML tag-balans + attribuut + id-controle
function checkXml(svg, label) {
  checks++;
  if (!svg.startsWith('<svg') || !svg.endsWith('</svg>')) fail(`${label}: geen svg-wortel`);
  if (/NaN|undefined|\[object/.test(svg)) fail(`${label}: NaN/undefined in output`);
  const re = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+(?:="[^"]*")?)*)\s*(\/?)>/g;
  const stack = []; let m, last = 0;
  while ((m = re.exec(svg))) {
    const between = svg.slice(last, m.index);
    if (/[<>]/.test(between)) fail(`${label}: losse < of > bij ${m.index}`);
    last = re.lastIndex;
    const [, close, name, attrs, selfc] = m;
    if (close) { const top = stack.pop(); if (top !== name) fail(`${label}: </${name}> maar open was <${top}>`); }
    else {
      const names = [...attrs.matchAll(/\s([\w:-]+)=/g)].map((x) => x[1]);
      if (new Set(names).size !== names.length) fail(`${label}: dubbel attribuut in <${name}${attrs}>`);
      if (!selfc) stack.push(name);
    }
  }
  if (svg.slice(last).trim()) fail(`${label}: rest na laatste tag`);
  if (stack.length) fail(`${label}: onbalans, nog open: ${stack.join(',')}`);
  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]);
  if (new Set(ids).size !== ids.length) fail(`${label}: dubbele id's`);
  for (const r of svg.matchAll(/url\(#([^)]+)\)/g)) if (!ids.includes(r[1])) fail(`${label}: url(#${r[1]}) niet gedefinieerd`);
}

// exports
if (M.SPECIES.length !== 8) fail('8 soorten');
if (M.MOODS.length !== 10) fail('10 stemmingen');
if (JSON.stringify(M.SLOTS) !== JSON.stringify(['hat', 'glasses', 'neck', 'body'])) fail('SLOTS');
for (const sp of M.SPECIES) if (sp.palettes.length !== 6 || sp.palettes.some((p) => !p.id || !p.name || !p.main || !p.accent || !p.belly)) fail(`paletten ${sp.id}`);
const min = { hat: 16, glasses: 10, neck: 12, body: 12 };
for (const slot of M.SLOTS) {
  const list = M.ACCESSORIES[slot];
  if (list.length < min[slot]) fail(`te weinig ${slot}: ${list.length}`);
  let prev = 0;
  for (const it of list) {
    if (!it.id || !it.name || it.price < 15 || it.price > 250 || it.minLevel < 1 || it.minLevel > 12) fail(`item ${slot}/${it.id}`);
    if (it.price < prev) fail(`prijzen niet oplopend bij ${slot}/${it.id}`);
    prev = it.price;
  }
  if (new Set(list.map((x) => x.id)).size !== list.length) fail(`dubbele id ${slot}`);
}

// accessoire-previews
let nAcc = 0;
for (const slot of M.SLOTS) for (const it of M.ACCESSORIES[slot]) { checkXml(M.accessorySVG(slot, it.id, 96), `accessorySVG ${slot}/${it.id}`); nAcc++; }
checkXml(M.eggSVG(120, 0), 'ei 0'); checkXml(M.eggSVG(120, 0.5), 'ei .5'); checkXml(M.eggSVG(120, 1), 'ei 1');

// huisdieren: soorten x stemmingen x stages x outfits
const stages = ['ei', 'baby', 'kind', 'tiener', 'volwassen'];
const mk = (i) => {
  const o = {};
  for (const slot of M.SLOTS) { const l = M.ACCESSORIES[slot]; o[slot] = l[i % l.length].id; }
  return o;
};
let n = 0;
for (const sp of M.SPECIES) {
  for (const mood of M.MOODS) for (const stage of stages) for (let k = 0; k < 4; k++) {
    const outfit = k === 0 ? {} : k === 1 ? mk(n) : k === 2 ? { hat: M.ACCESSORIES.hat[n % 17].id, glasses: null } : mk(n * 3 + 1);
    const svg = M.petSVG(sp.id, { palette: k % 6, mood, stage, outfit, blink: k % 2 === 0, idleClass: 'pet-idle', size: 160 });
    checkXml(svg, `${sp.id}/${mood}/${stage}/${k}`);
    if (stage !== 'ei' && !svg.includes('pet-body')) fail('pet-body class ontbreekt');
    n++;
  }
  // elke accessoire op elk dier (alleen volwassen/baby)
  for (const slot of M.SLOTS) for (const it of M.ACCESSORIES[slot]) for (const stage of ['baby', 'volwassen']) {
    checkXml(M.petSVG(sp.id, { palette: { main: '#ffcc88', accent: '#ff8844', belly: '#fff' }, mood: 'blij', stage, outfit: { [slot]: it.id } }), `${sp.id}/${slot}/${it.id}/${stage}`);
    n++;
  }
}
// unieke id's tussen aanroepen
const a = M.petSVG('kat', { mood: 'liefde' }), b = M.petSVG('kat', { mood: 'liefde' });
const ia = new Set([...a.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]));
for (const x of b.matchAll(/\sid="([^"]+)"/g)) if (ia.has(x[1])) fail('id-botsing tussen twee SVG-aanroepen');
console.log(`OK: ${n} huisdier-SVG's + ${nAcc} accessoire-previews + eieren gecontroleerd (${checks} XML-checks)`);
