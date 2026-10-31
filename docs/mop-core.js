// Mop-kern: categorieën, indeling, mop van de dag, quiz, eigen moppen en deelcodes (zonder DOM).

export const CATS = [
  { id: 'dieren', name: 'Dieren', icon: 'cow' }, { id: 'zegt', name: 'Zegt de...', icon: 'bell' }, { id: 'eten', name: 'Eten', icon: 'pizza' },
  { id: 'school', name: 'School', icon: 'book' }, { id: 'techniek', name: 'Techniek', icon: 'robot' }, { id: 'sport', name: 'Sport', icon: 'target' },
  { id: 'raadsels', name: 'Raadsels', icon: 'puzzle' }, { id: 'flauw', name: 'Flauw', icon: 'balloon' }, { id: 'familie', name: 'Familie', icon: 'house' },
  { id: 'fantasie', name: 'Fantasie', icon: 'dragon' }, { id: 'natuur', name: 'Natuur', icon: 'rainbow' }, { id: 'ober', name: 'Ober!', icon: 'coffee' },
  { id: 'dokter', name: 'Dokter', icon: 'potion' }, { id: 'jantje', name: 'Jantje', icon: 'pencil' },
];
export const catById = (id) => CATS.find((c) => c.id === id) || CATS[7];

// Oude moppen (jokes.js) hebben vaste indexen; hun groep volgt uit de commentaarregels in dat bestand.
export const OLD_RANGES = [[25, 'dieren'], [36, 'zegt'], [48, 'eten'], [56, 'school'], [66, 'techniek'], [71, 'sport'], [85, 'raadsels'], [97, 'flauw']];
const WORDS = [
  ['dieren', /\b(koe|kat|hond|vis|kip|eend|paard|schaap|konijn|vogel|beer|leeuw|olifant|giraf|zebra|aap|slak|spin|mier|egel|uil|kikker|muis|haai|walvis|pinguïn|dier|slang|mol|bij)\b/i],
  ['eten', /\b(pizza|brood|kaas|friet|patat|ei|soep|koek|taart|appel|banaan|snoep|ijs|chocola|worst|pannenkoek|saus|tomaat|aardappel)\b/i],
  ['school', /\b(juf|meester|school|klas|leraar|les|huiswerk|rekenen|schrift|pen)\b/i],
  ['techniek', /\b(computer|wifi|robot|telefoon|internet|laptop|game|app|printer)\b/i],
  ['sport', /\b(voetbal|zwem|sport|fiets|tennis|hardlop|gym|doelpunt)\b/i],
];
export function categorize(q, a) {
  const t = q + ' ' + a;
  for (const [cat, re] of WORDS) if (re.test(t)) return cat;
  return /^(Welk|Welke|Hoe heet|Wat is|Wat heeft|Wat gaat|Wat kun)/.test(q) ? 'raadsels' : 'flauw';
}
// Alle ingebouwde moppen met stabiele id (= positie). Oude eerst, dan de nieuwe.
export function buildAll(OLD, MORE) {
  const out = OLD.map(([q, a], i) => { const r = OLD_RANGES.find(([end]) => i < end); return { id: i, q, a, cat: r ? r[1] : categorize(q, a) }; });
  MORE.forEach(([cat, q, a]) => out.push({ id: out.length, q, a, cat }));
  return out;
}
export const dayNumber = (d = new Date()) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
export const dayPick = (day, n) => (((day * 7919) % n) + n) % n;

// Moppen ranken op hoeveel je er hebt gelezen.
export const RANKS = [[0, 'Beginner'], [10, 'Grapjas'], [30, 'Mopkenner'], [75, 'Mopkampioen'], [150, 'Komiek'], [300, 'Koning van de lach']];
export function rankFor(n) {
  let i = 0; RANKS.forEach(([m], k) => { if (n >= m) i = k; });
  const next = RANKS[i + 1] || null; return { name: RANKS[i][1], level: i, next: next ? { at: next[0], name: next[1], left: next[0] - n } : null };
}

// ---- eigen moppen & delen ----
export function cleanJoke(q, a) {
  q = String(q || '').replace(/\s+/g, ' ').trim().slice(0, 160); a = String(a || '').replace(/\s+/g, ' ').trim().slice(0, 160);
  if (q.length < 4) return { err: 'Typ eerst de vraag of het begin van je mop.' }; if (a.length < 2) return { err: 'Typ ook het antwoord (de clou).' };
  return { q, a };
}
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function utf8(s) { const out = []; for (const ch of s) { let c = ch.codePointAt(0); if (c < 0x80) out.push(c); else if (c < 0x800) out.push(0xc0 | c >> 6, 0x80 | c & 63); else if (c < 0x10000) out.push(0xe0 | c >> 12, 0x80 | c >> 6 & 63, 0x80 | c & 63); else out.push(0xf0 | c >> 18, 0x80 | c >> 12 & 63, 0x80 | c >> 6 & 63, 0x80 | c & 63); } return out; }
function unutf8(b) { let s = ''; for (let i = 0; i < b.length;) { const c = b[i++]; let cp; if (c < 0x80) cp = c; else if (c < 0xe0) cp = (c & 31) << 6 | b[i++] & 63; else if (c < 0xf0) { cp = (c & 15) << 12 | (b[i++] & 63) << 6; cp |= b[i++] & 63; } else { cp = (c & 7) << 18 | (b[i++] & 63) << 12; cp |= (b[i++] & 63) << 6; cp |= b[i++] & 63; } s += String.fromCodePoint(cp); } return s; }
export function b64enc(str) { const b = utf8(str); let o = ''; for (let i = 0; i < b.length; i += 3) { const n = b[i] << 16 | (b[i + 1] || 0) << 8 | (b[i + 2] || 0); o += B64[n >> 18 & 63] + B64[n >> 12 & 63] + (i + 1 < b.length ? B64[n >> 6 & 63] : '=') + (i + 2 < b.length ? B64[n & 63] : '='); } return o; }
export function b64dec(s) { s = s.replace(/[^A-Za-z0-9+/]/g, ''); const b = []; for (let i = 0; i < s.length; i += 4) { const c = [0, 1, 2, 3].map((k) => (i + k < s.length ? B64.indexOf(s[i + k]) : -1)); const n = c[0] << 18 | (c[1] < 0 ? 0 : c[1]) << 12 | (c[2] < 0 ? 0 : c[2]) << 6 | (c[3] < 0 ? 0 : c[3]); b.push(n >> 16 & 255); if (c[2] >= 0) b.push(n >> 8 & 255); if (c[3] >= 0) b.push(n & 255); } return unutf8(b); }
export function encodeShare(list) { return 'MOP1:' + b64enc(JSON.stringify(list.slice(0, 20).map((j) => [j.q, j.a]))); }
export function decodeShare(text) {
  const m = /MOP1:([A-Za-z0-9+/=]+)/.exec(String(text || '')); if (!m) return null;
  try { const arr = JSON.parse(b64dec(m[1])); if (!Array.isArray(arr)) return null; return arr.slice(0, 20).map((x) => (Array.isArray(x) ? cleanJoke(x[0], x[1]) : { err: 1 })).filter((j) => !j.err); } catch { return null; }
}
export const shareText = (j) => `${j.q}\n${j.a}`;

// ---- raad-de-grap ----
// Kiest een mop en 3 verkeerde antwoorden (liefst uit dezelfde groep). rng() -> [0,1).
export function makeQuiz(pool, rng, cat) {
  const base = cat ? pool.filter((j) => j.cat === cat) : pool; const src = base.length >= 4 ? base : pool;
  const pick = src[Math.floor(rng() * src.length)];
  const others = src.filter((j) => j.id !== pick.id && j.a !== pick.a);
  const wrong = []; const used = new Set([pick.a]);
  while (wrong.length < 3 && others.length) { const k = Math.floor(rng() * others.length), [o] = others.splice(k, 1); if (!used.has(o.a)) { used.add(o.a); wrong.push(o.a); } }
  const options = [pick.a, ...wrong]; for (let i = options.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [options[i], options[j]] = [options[j], options[i]]; }
  return { id: pick.id, q: pick.q, options, correct: options.indexOf(pick.a), answer: pick.a };
}
export const quizPoints = (streak) => 10 + Math.min(streak, 5) * 2;

// ---- lijsten ----
export function filterJokes(all, { cat, query, ratings = {}, minStars = 0 } = {}) {
  const q = (query || '').toLowerCase().trim();
  return all.filter((j) => (!cat || j.cat === cat) && (!q || (j.q + ' ' + j.a).toLowerCase().includes(q)) && (!minStars || (ratings[j.id] || 0) >= minStars));
}
export const toggle = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [id, ...list]);
// Willekeurig uit wat je nog niet gezien hebt (en niet de huidige).
export function pickNext(ids, seen, current, rng) {
  const unseen = ids.filter((i) => !seen.includes(i) && i !== current); const pool = unseen.length ? unseen : ids.filter((i) => i !== current);
  return pool.length ? pool[Math.floor(rng() * pool.length)] : current;
}
