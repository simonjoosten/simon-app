// Chat: zuivere logica. Stickers, reacties en antwoorden reizen als gewone tekstberichten met een verborgen opmaak
import { R4_PACKS, R4_THEMES, R4_REACTIONS, QUICK_PHRASES, fillPhrase } from './tools-r4-chat.js?v=1';
export { QUICK_PHRASES, fillPhrase };
// (de Firestore-regels laten alleen de typen text/image/gif/video toe). Spraakberichten zijn type 'video' met een audio-mime.
export const pairId = (a, b) => [a, b].sort().join('_');
export const CHUNK = 450000;
export const MAX_VIDEO = 8 * 1024 * 1024;
export const MAX_PARTS = 24;
export const MAX_VOICE_SEC = 120;

/* ---------- opmaak in tekstberichten ---------- */
const ST_RE = /^⟦st:([a-z0-9-]{1,30})⟧$/, RE_RE = /^⟦re:([A-Za-z0-9]{6,40}):(.{0,12})⟧$/, Q_RE = /^⟦q:([A-Za-z0-9]{6,40})⟧\s*/;
export const stickerText = (name) => `⟦st:${name}⟧`;
export const reactionText = (mid, emoji) => `⟦re:${mid}:${emoji || ''}⟧`;
export const replyText = (mid, text) => `⟦q:${mid}⟧ ${text}`.slice(0, 2000);
export const isVoice = (m) => m && m.type === 'video' && /^audio\//.test(m.mime || '');

// Geeft altijd { kind, ... } terug: text | sticker | reaction | image | gif | video | voice
export function parseMsg(m) {
  if (!m) return { kind: 'text', text: '' };
  if (m.type === 'text') {
    const t = String(m.text || '');
    let x = ST_RE.exec(t); if (x) return { kind: 'sticker', name: x[1] };
    x = RE_RE.exec(t); if (x) return { kind: 'reaction', target: x[1], emoji: x[2] };
    x = Q_RE.exec(t); if (x) return { kind: 'text', text: t.replace(Q_RE, ''), quote: x[1] };
    return { kind: 'text', text: t };
  }
  if (isVoice(m)) return { kind: 'voice', parts: m.parts, mime: m.mime };
  return { kind: m.type };
}
// Berichten die je ziet (reacties zitten verstopt bij het bericht zelf)
export const visibleMessages = (list) => list.filter((m) => parseMsg(m).kind !== 'reaction');
// Per bericht: [{emoji, uids:[...] }] — het laatste bericht van iemand telt; lege emoji haalt de reactie weg.
export function reactionsMap(list) {
  const latest = new Map(); // `${mid}|${uid}` -> {emoji, created}
  for (const m of [...list].sort((a, b) => (a.created || 0) - (b.created || 0))) {
    const p = parseMsg(m); if (p.kind !== 'reaction') continue;
    latest.set(`${p.target}|${m.from}`, { emoji: p.emoji, uid: m.from, target: p.target });
  }
  const out = new Map();
  for (const r of latest.values()) {
    if (!r.emoji) continue;
    const arr = out.get(r.target) || []; let row = arr.find((x) => x.emoji === r.emoji);
    if (!row) { row = { emoji: r.emoji, uids: [] }; arr.push(row); }
    row.uids.push(r.uid); out.set(r.target, arr);
  }
  return out;
}
export const myReaction = (map, mid, uid) => ((map.get(mid) || []).find((r) => r.uids.includes(uid)) || {}).emoji || '';
export const REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥', ...R4_REACTIONS];

// Korte tekst voor de gespreklijst en antwoorden
export function previewOf(m) {
  const p = parseMsg(m);
  switch (p.kind) {
    case 'sticker': return 'Sticker'; case 'reaction': return `${p.emoji || '·'} reactie`; case 'image': return '📷 Foto'; case 'gif': return 'GIF'; case 'voice': return '🎤 Spraakbericht'; case 'video': return '🎬 Filmpje';
    default: return String(p.text || '').replace(/\s+/g, ' ').slice(0, 80);
  }
}
// Ruwe "last" uit de vriendschap (kan opmaak bevatten) opschonen voor de lijst
export function cleanLast(s) {
  const t = String(s || ''); if (ST_RE.test(t)) return 'Sticker'; if (RE_RE.test(t)) return 'Reactie'; return t.replace(Q_RE, '');
}

/* ---------- ontvangstbevestiging, dagen, groepen ---------- */
export const receipt = (m, otherReadAt) => ((m.created || 0) <= (otherReadAt || 0) ? 'gelezen' : 'verzonden');
export function dayLabel(ts, now = Date.now()) {
  const d = new Date(ts), n = new Date(now); const k = (x) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  if (k(d) === k(n)) return 'Vandaag'; if (k(d) === k(new Date(n.getFullYear(), n.getMonth(), n.getDate() - 1))) return 'Gisteren';
  return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
}
export const clockOf = (ts) => (ts ? new Date(ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : '');
// Zet berichten (oud -> nieuw) om in rijen met scheidingen en groepstekens.
export function layout(list, { me, unreadAfter = null, now = Date.now() } = {}) {
  const rows = []; let lastDay = '', prev = null, dividerDone = false;
  list.forEach((m, i) => {
    const lbl = dayLabel(m.created || 0, now);
    if (lbl !== lastDay) { rows.push({ sep: lbl }); lastDay = lbl; prev = null; }
    if (!dividerDone && unreadAfter != null && m.from !== me && (m.created || 0) > unreadAfter) { rows.push({ sep: 'Nieuw', fresh: true }); dividerDone = true; prev = null; }
    const next = list[i + 1];
    const joinPrev = prev && prev.from === m.from && (m.created || 0) - (prev.created || 0) < 5 * 60000;
    const joinNext = next && next.from === m.from && (next.created || 0) - (m.created || 0) < 5 * 60000 && dayLabel(next.created || 0, now) === lbl;
    rows.push({ m, first: !joinPrev, last: !joinNext, mine: m.from === me }); prev = m;
  });
  return rows;
}
export function searchMessages(list, term) {
  const t = String(term || '').trim().toLowerCase(); if (!t) return list;
  return list.filter((m) => { const p = parseMsg(m); return p.kind === 'text' && String(p.text).toLowerCase().includes(t); });
}
export const highlight = (escaped, term) => {
  const t = String(term || '').trim(); if (!t) return escaped;
  const safe = t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escaped.replace(new RegExp(`(${safe})`, 'gi'), '<mark>$1</mark>');
};
// Alleen-emoji berichten groot tonen
export const emojiOnly = (t) => { const s = String(t || '').trim(); return !!s && s.length <= 16 && /^(\p{Extended_Pictographic}|\p{Emoji_Component}|\s)+$/u.test(s) && !/[0-9a-z]/i.test(s); };

/* ---------- avatars en thema's ---------- */
export function hash(str) { let h = 5381; for (const c of String(str)) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return h; }
export const initial = (name) => (String(name || '?').trim()[0] || '?').toUpperCase();
export const avatarColor = (name) => `hsl(${hash(name) % 360},60%,52%)`;

export const THEMES = [
  { id: 'standaard', n: 'Standaard', ic: 'star', bg: ['#f4f5fb', '#e9ebf7'], mine: ['#6366f1', '#8b5cf6'], mineText: '#fff', theirs: '#ffffff', theirsText: '#1f2330', dark: false },
  { id: 'oceaan', n: 'Oceaan', ic: 'wave', bg: ['#bae6fd', '#38bdf8'], mine: ['#0369a1', '#0ea5e9'], mineText: '#fff', theirs: '#f0f9ff', theirsText: '#0c4a6e', dark: false },
  { id: 'zonsondergang', n: 'Zonsondergang', ic: 'sun', bg: ['#fed7aa', '#f9a8d4'], mine: ['#ea580c', '#db2777'], mineText: '#fff', theirs: '#fff7ed', theirsText: '#431407', dark: false },
  { id: 'bos', n: 'Bos', ic: 'tree', bg: ['#bbf7d0', '#4ade80'], mine: ['#15803d', '#16a34a'], mineText: '#fff', theirs: '#f0fdf4', theirsText: '#14532d', dark: false },
  { id: 'snoep', n: 'Snoepland', ic: 'lollipop', bg: ['#fbcfe8', '#fde68a'], mine: ['#ec4899', '#f472b6'], mineText: '#fff', theirs: '#fff1f2', theirsText: '#831843', dark: false },
  { id: 'ruimte', n: 'Ruimte', ic: 'rocket', bg: ['#1e1b4b', '#4c1d95'], mine: ['#7c3aed', '#a855f7'], mineText: '#fff', theirs: '#312e81', theirsText: '#ede9fe', dark: true },
  { id: 'nacht', n: 'Nacht', ic: 'moon', bg: ['#0f172a', '#1e293b'], mine: ['#2563eb', '#3b82f6'], mineText: '#fff', theirs: '#334155', theirsText: '#f1f5f9', dark: true },
  { id: 'neon', n: 'Neon', ic: 'bolt', bg: ['#0a0014', '#3b0764'], mine: ['#d946ef', '#ec4899'], mineText: '#fff', theirs: '#2e1065', theirsText: '#f5d0fe', dark: true },
  { id: 'woestijn', n: 'Woestijn', ic: 'cactus', bg: ['#fde68a', '#fdba74'], mine: ['#b45309', '#d97706'], mineText: '#fff', theirs: '#fffbeb', theirsText: '#451a03', dark: false },
  { id: 'ijs', n: 'IJs', ic: 'snowflake', bg: ['#e0f2fe', '#bae6fd'], mine: ['#0891b2', '#06b6d4'], mineText: '#fff', theirs: '#ffffff', theirsText: '#164e63', dark: false },
  { id: 'vulkaan', n: 'Vulkaan', ic: 'volcano', bg: ['#450a0a', '#9a3412'], mine: ['#dc2626', '#f97316'], mineText: '#fff', theirs: '#7c2d12', theirsText: '#ffedd5', dark: true },
  { id: 'lavendel', n: 'Lavendel', ic: 'flower', bg: ['#ede9fe', '#ddd6fe'], mine: ['#7c3aed', '#8b5cf6'], mineText: '#fff', theirs: '#faf5ff', theirsText: '#3b0764', dark: false },
  ...R4_THEMES,
];
export const themeOf = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

/* ---------- stickers ---------- */
export const STICKER_PACKS = [
  { id: 'dieren', n: 'Dieren', ic: 'panda', items: ['dog', 'cat', 'rabbit', 'bear', 'panda', 'lion', 'pig', 'cow', 'chicken', 'sheep', 'horse', 'frog', 'duck', 'owl', 'penguin', 'elephant', 'monkey', 'fox', 'bee', 'butterfly', 'turtle', 'snail', 'whale', 'octopus'] },
  { id: 'eten', n: 'Eten', ic: 'pizza', items: ['pizza', 'burger', 'fries', 'hotdog', 'icecream', 'donut', 'cake', 'cookie', 'cupcake', 'candy', 'lollipop', 'cheese', 'bread', 'coffee', 'apple', 'banana', 'strawberry', 'watermelon', 'grapes', 'carrot', 'egg', 'pie'] },
  { id: 'feest', n: 'Feest', ic: 'balloon', items: ['balloon', 'gift', 'trophy', 'crown', 'medal', 'star', 'heart', 'gem', 'coin', 'bell', 'rainbow', 'ticket', 'dice', 'clover', 'ring', 'chest', 'money', 'bolt'] },
  { id: 'fantasie', n: 'Fantasie', ic: 'unicorn', items: ['unicorn', 'dragon', 'wizard', 'fairy', 'ghost', 'robot', 'alien', 'dino', 'mermaid', 'skull', 'slime', 'wand', 'potion', 'sword', 'shield', 'bow'] },
  { id: 'ruimte', n: 'Ruimte', ic: 'rocket', items: ['rocket', 'ufo', 'planet', 'astronaut', 'satellite', 'comet', 'moon', 'sun', 'earth', 'crystal'] },
  { id: 'natuur', n: 'Natuur', ic: 'tree', items: ['sun', 'moon', 'cloud', 'rain', 'snowflake', 'flame', 'volcano', 'wave', 'tree', 'pine', 'palm', 'flower', 'sunflower', 'mushroom', 'leaf', 'cactus', 'rock'] },
  { id: 'vervoer', n: 'Vervoer', ic: 'car', items: ['car', 'truck', 'bus', 'train', 'plane', 'boat', 'ship', 'bike', 'helicopter', 'submarine', 'tractor', 'foodtruck', 'rocket'] },
  { id: 'plekken', n: 'Plekken', ic: 'castle', items: ['house', 'castle', 'tower', 'tent', 'barn', 'windmill', 'lighthouse', 'ferriswheel', 'rollercoaster', 'carousel', 'igloo', 'pyramid', 'fountain', 'bridge'] },
  ...R4_PACKS, // ronde 4: 5 extra pakketten
];
// Recent gebruikte stickers: nieuwste vooraan, geen dubbelen, max 12
export const pushRecent = (list, name, max = 12) => [name, ...(list || []).filter((x) => x !== name)].slice(0, max);

/* ---------- spraakberichten ---------- */
export const VOICE_MIMES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
export const pickVoiceMime = (isSupported) => VOICE_MIMES.find((t) => { try { return isSupported(t); } catch (e) { return false; } }) || '';
export const partsFor = (size) => Math.ceil(size / CHUNK);
export const fitsChat = (size) => size > 0 && partsFor(size) <= MAX_PARTS;
export const fmtDur = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
