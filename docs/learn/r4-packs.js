// Ronde 4 – extra kits (vraagsets). Registreert zich NIET in packs/index.js (dat bestand is gegenereerd); study.js en games.js voegen R4_PACKS zelf toe
// via withR4(allKits) en r4Kit(id). Elk kit laadt lui uit r4-packs-a.js / r4-packs-b.js.
// Korte vraag-bouwers (zelfde vraag-model als SPEC §1):
export const Q = {
  mc(q, a, w1, w2, w3, x, e) { const o = [a, w1, w2, w3]; const k = (q.length + a.length) % 4; const r = o.slice(); r.unshift(...r.splice(k, r.length - k)); const out = { t: 'mc', q, a, o: r }; if (x) out.x = x; if (e) out.e = e; return out; },
  tf(q, a, x, e) { const out = { t: 'tf', q, a: !!a }; if (x) out.x = x; if (e) out.e = e; return out; },
  num(q, a, x, tol) { const out = { t: 'num', q, a }; if (x) out.x = x; if (tol) out.tol = tol; return out; },
  ty(q, a, alt, x) { const out = { t: 'type', q, a }; if (alt) out.alt = alt; if (x) out.x = x; return out; },
  fill(q, a, o, x) { const out = { t: 'fill', q, a, o }; if (x) out.x = x; return out; },
  ord(q, a, x) { const out = { t: 'order', q, a }; if (x) out.x = x; return out; },
  mt(q, a, x) { const out = { t: 'match', q, a }; if (x) out.x = x; return out; },
};

const INFO = [
  { id: 'r4-vikingen', name: 'Vikingen', emoji: '⚔️', group: 'Geschiedenis', desc: 'Langschepen, runen, Odin en Thor: alles over de Vikingen.', lang: 'nl', file: 'a', key: 'vikingen' },
  { id: 'r4-techniek', name: 'Hoe werkt het? Techniek', emoji: '⚙️', group: 'Natuur', desc: 'Stroom, magneten, hefbomen en machines.', lang: 'nl', file: 'a', key: 'techniek' },
  { id: 'r4-nl-water', name: 'Nederland en het water', emoji: '🌊', group: 'Wereld', desc: 'Polders, dijken, Deltawerken en de Waddeneilanden.', lang: 'nl', file: 'a', key: 'water' },
  { id: 'r4-woorden', name: 'Moeilijke woorden', emoji: '📖', group: 'Taal', desc: 'Wat betekenen woorden als minuscuul, schaars en sluw?', lang: 'nl', file: 'a', key: 'woorden' },
  { id: 'r4-keuken', name: 'In de keuken', emoji: '🍳', group: 'Mens', desc: 'Maten, kooktechnieken, hygiëne en gerechten uit de hele wereld.', lang: 'nl', file: 'a', key: 'keuken' },
  { id: 'r4-records', name: 'Dierenrecords', emoji: '🏆', group: 'Natuur', desc: 'Het snelste, grootste en langzaamste dier.', lang: 'nl', file: 'b', key: 'records' },
  { id: 'r4-wereldwonderen', name: 'Wereldwonderen en bouwwerken', emoji: '🗽', group: 'Wereld', desc: 'Eiffeltoren, Taj Mahal, Machu Picchu en meer.', lang: 'nl', file: 'b', key: 'wonderen' },
  { id: 'r4-es-huis-school', name: 'Spaans: huis en school', emoji: '🏠', group: 'Talen', desc: 'Woordjes Spaans voor het huis en de klas.', lang: 'es', file: 'b', key: 'spaans' },
  { id: 'r4-logica', name: 'Raadsels en rijtjes', emoji: '🧩', group: 'Rekenen', desc: 'Getallenrijen, raadsels en slimme denkvragen.', lang: 'nl', file: 'b', key: 'logica' },
  { id: 'r4-afronden', name: 'Afronden en schatten', emoji: '🎯', group: 'Rekenen', desc: 'Afronden op tientallen en honderdtallen, helft, dubbel en procent.', lang: 'nl', file: 'b', key: 'afronden' },
];

const cache = new Map();
async function build(info) {
  if (cache.has(info.id)) return cache.get(info.id);
  const m = info.file === 'a' ? await import('./r4-packs-a.js?v=1') : await import('./r4-packs-b.js?v=1');
  const qs = (m.default[info.key] || []).map((q, i) => ({ ...q, g: q.g || info.name, d: q.d || (1 + (i % 3)) }));
  const kit = { id: info.id, name: info.name, emoji: info.emoji, desc: info.desc, lang: info.lang, group: info.group, qs, src: 'pack' };
  cache.set(info.id, kit);
  return kit;
}
export const R4_COUNT = 288;   // richtgetal; de test telt de echte vragen
// Lijstvorm zoals core.allKits() hem geeft: { id, name, emoji, group, count, lang, src:'pack', load }
export const R4_PACKS = INFO.map((p) => ({ id: p.id, name: p.name, emoji: p.emoji, group: p.group, desc: p.desc, count: 0, lang: p.lang, src: 'pack', load: () => build(p) }));
export const isR4 = (id) => typeof id === 'string' && INFO.some((p) => p.id === id);
export async function r4Kit(id, normalize) {
  const info = INFO.find((p) => p.id === id); if (!info) return null;
  const kit = await build(info);
  if (normalize) { const qs = []; for (const q of kit.qs) { const n = normalize(q); if (n) qs.push(n); } return { ...kit, qs }; }
  return kit;
}
// Voegt de R4-kits (zonder dubbelen) toe aan een lijst van allKits()
export function mergeR4(list, counts) {
  const have = new Set((list || []).map((k) => k.id)); const out = (list || []).slice();
  for (const p of R4_PACKS) if (!have.has(p.id)) out.push({ ...p, count: (counts && counts[p.id]) || 0 });
  return out;
}
