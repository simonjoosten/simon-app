// Stub van docs/learn/core.js voor de Study-tests (alleen wat Study gebruikt).
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
export const LANGS = { nl: { name: 'Nederlands', speech: 'nl-NL' }, en: { name: 'Engels', speech: 'en-GB' }, de: { name: 'Duits', speech: 'de-DE' }, fr: { name: 'Frans', speech: 'fr-FR' }, es: { name: 'Spaans', speech: 'es-ES' } };
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function shuffle(arr, r = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function qkey(q) { const s = q.t + '|' + q.q + '|' + JSON.stringify(q.a); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
export function normalizeQ(q) { return q; }
export function toTypeQ(q) { if (q.t !== 'mc') return q; const r = { ...q, t: 'type' }; delete r.o; return r; }
export function checkAnswer(q, given) {
  const correct = Array.isArray(q.a) ? (q.t === 'match' ? q.a.map((p) => p.join(' → ')).join(', ') : q.a.join(', ')) : q.t === 'tf' ? (q.a ? 'Waar' : 'Onwaar') : String(q.a);
  let ok = false;
  if (q.t === 'tf') ok = given === q.a; else if (q.t === 'num') ok = Math.abs(Number(given) - q.a) < 1e-9 || (q.alt || []).includes(Number(given));
  else if (Array.isArray(q.a)) ok = JSON.stringify(given) === JSON.stringify(q.a); else ok = norm(given) === norm(q.a) || (q.alt || []).some((x) => norm(x) === norm(given));
  return { ok, correct };
}
export function makeOptions(q) { return q; }
export function pick(kit, n, o = {}) { let qs = kit.qs.filter((q) => !o.types || o.types.includes(q.t)); const out = []; const r = rng(o.seed || 1); const sh = shuffle(qs, r); while (out.length < n && sh.length) out.push(sh[out.length % sh.length]); return out.slice(0, Math.min(n, Math.max(n, 1))); }
const mem = { kits: new Map(), box: new Map(), hist: new Map(), xp: 0, coins: 0, answers: 0, correct: 0 };
let seq = 1; const listeners = new Set();
export const Kits = { async load() {}, list: () => [...mem.kits.values()], get: (id) => mem.kits.get(id) || null, save(k) { mem.kits.set(k.id, JSON.parse(JSON.stringify(k))); listeners.forEach((f) => f()); }, remove(id) { mem.kits.delete(id); listeners.forEach((f) => f()); }, newId: () => 'k' + seq++, onChange(f) { listeners.add(f); return () => listeners.delete(f); } };
const packs = () => {
  const tab = []; for (let a = 2; a <= 6; a++) for (let b = 1; b <= 10; b++) tab.push({ t: 'num', q: `Hoeveel is ${a} × ${b}?`, a: a * b, g: 'tafel ' + a });
  const en = [['huis', 'house'], ['kat', 'cat'], ['hond', 'dog'], ['boom', 'tree'], ['vriend', 'friend'], ['school', 'school'], ['boek', 'book'], ['appel', 'apple'], ['water', 'water'], ['brood', 'bread']].map(([n, e]) => ({ t: 'type', q: n, a: e, lang: 'en' }));
  const wereld = [{ t: 'mc', q: 'Hoofdstad van Frankrijk?', a: 'Parijs', o: ['Parijs', 'Lyon', 'Nice', 'Rome'], x: 'Parijs ligt aan de Seine.' }, { t: 'tf', q: 'De zon is een ster.', a: true }, { t: 'order', q: 'Zet op volgorde', a: ['een', 'twee', 'drie'] }, { t: 'match', q: 'Verbind', a: [['a', '1'], ['b', '2'], ['c', '3']] }, { t: 'fill', q: 'De ___ is rood.', a: 'roos' }, { t: 'multi', q: 'Welke zijn fruit?', o: ['appel', 'peer', 'stoel', 'kast'], a: ['appel', 'peer'] }, { t: 'type', q: 'Hoofdstad van Nederland?', a: 'Amsterdam' }];
  return { tafels: { id: 'p-tafels', name: 'Tafels', emoji: '✖️', group: 'Rekenen', qs: tab, lang: 'nl' }, engels: { id: 'p-engels', name: 'Engels woordjes', emoji: '🇬🇧', group: 'Talen', qs: en, lang: 'en' }, wereld: { id: 'p-wereld', name: 'Wereld mix', emoji: '🌍', group: 'Wereld', qs: wereld, lang: 'nl' } };
};
export async function allKits() { const P = Object.values(packs()); return [...Kits.list().map((k) => ({ id: k.id, name: k.name, emoji: k.emoji, group: k.group, count: k.qs.length, lang: k.lang, src: 'user' })), ...P.map((k) => ({ id: k.id, name: k.name, emoji: k.emoji, group: k.group, count: k.qs.length, lang: k.lang, src: 'pack' }))]; }
export async function getKit(id) { return mem.kits.get(id) || Object.values(packs()).find((p) => p.id === id) || null; }
const bk = (id, q) => id + '|' + qkey(q);
export const Prog = {
  async load() {}, box: (id, q) => mem.box.get(bk(id, q)) || 0,
  record(id, q, ok) { const b = mem.box.get(bk(id, q)) || 0; mem.box.set(bk(id, q), ok ? Math.min(5, b + 1) : 1); mem.answers++; if (ok) mem.correct++; },
  dueFirst: (kit) => kit.qs.slice().sort((a, b) => Prog.box(kit.id, b) - Prog.box(kit.id, a)),
  weak: (id, n) => [...mem.box.entries()].filter(([k, b]) => k.startsWith(id + '|') && b <= 1).slice(0, n).map(() => null).filter(Boolean),
  mastery(id, kit) { let known = 0, learning = 0, nw = 0; for (const q of kit.qs) { const b = Prog.box(id, q); if (b >= 4) known++; else if (b >= 1) learning++; else nw++; } return { pct: (known / kit.qs.length) * 100, known, learning, new: nw }; },
  history: (id) => mem.hist.get(id) || [], addResult(id, r) { mem.hist.set(id, [...(mem.hist.get(id) || []), r]); },
  stats: () => ({ streak: 3, today: { answers: mem.answers, correct: mem.correct, xp: mem.xp }, goal: 20, best: 5 }),
};
export const Profile = { async load() {}, get: () => ({ name: 'T', xp: mem.xp, level: 1, coins: mem.coins }), addXp(n) { mem.xp += n; }, addCoins(n) { mem.coins += n; }, levelInfo: () => ({ level: 1 + Math.floor(mem.xp / 100), cur: mem.xp % 100, next: 100 }), effects: () => ({ extraLives: 1, shield: 1, hints: 1, xpMult: 1, coinMult: 1 }), bumpQuest() {}, checkAch() {}, achievements: () => [{ id: 'a', name: 'Eerste', emoji: '🥇', done: true }, { id: 'b', name: 'Tweede', emoji: '🥈', done: false }] };
export const TTS = { on: false, rate: 1, spoken: [], supported: () => true, speak(t, l) { TTS.spoken.push([t, l]); return Promise.resolve(); }, stop() {}, setOn(b) { TTS.on = !!b; }, setRate(r) { TTS.rate = r; }, voices: () => [{ name: 'Test-stem' }] };
export const Snd = { on: true, play() {}, setOn() {} };
export const todayKey = () => new Date().toISOString().slice(0, 10);
export const fmt = (n) => String(n); export const esc = (s) => String(s);
export function bindCtx() {}
export const __mem = mem;
