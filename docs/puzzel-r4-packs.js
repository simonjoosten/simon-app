// puzzel-r4-packs.js - pure logica (ronde 4) voor de puzzel-apps: 4 level-packs van elk 100 extra levels (400 per spel),
// tijdrace (gewoon en dagelijks), huisstijlen (3D-skins), rangen en uitgebreide voortgang.
// Alle levels komen uit de eindeloze generators van de spellen (deterministisch, per constructie oplosbaar; bewezen in tools/test-r4-puzzel.mjs).
// Opslag: dezelfde JSON als voorheen ({x,d}) met extra velden (y,t,td,sk); oude saves blijven werken.
import * as PX from './puzzel-extra.js?v=1';

export const PACK_SIZE = 100;
export const PACKS = [
  { id: 'p1', name: 'Pak 1 · Startpakket', icon: 'gem', sub: 'De eerste 100 extra levels' },
  { id: 'p2', name: 'Pak 2 · Kristalgrot', icon: 'crystal', sub: '100 nieuwe, slimmere levels' },
  { id: 'p3', name: 'Pak 3 · Vulkaaneiland', icon: 'volcano', sub: '100 pittige levels' },
  { id: 'p4', name: 'Pak 4 · Sterrenstelsel', icon: 'planet', sub: '100 meesterlevels' },
];
export const TOTAL_X = PACK_SIZE * PACKS.length;            // 400 extra levels per spel
export const packOf = (n) => Math.max(0, Math.min(PACKS.length - 1, Math.floor(n / PACK_SIZE)));

// ---- saves voor extra level n (0..399): zelfde vorm als puzzel-extra.extraSave, maar zonder grens van 100 ----
export function extraSaveAt(id, n) {
  n = Math.max(0, Math.min(TOTAL_X - 1, n | 0));
  const F = PX.FIXED[id], L = F + n;
  switch (id) {
    case 'kratjes': return { v: 2, lv: L, s: '3'.repeat(L) };
    case 'verbind': return { v: 2, l: L, m: L, b: '3'.repeat(F), h: 6 };
    case 'knopen': return { v: 2, l: L + 1, m: L + 1, s: '3'.repeat(F) };
    case 'pinnen': return { v: 2, l: L, m: L, s: '3'.repeat(F), e: 0, h: 8 };
    case 'tangram': return { v: 2, lv: L, p: 'f'.repeat(Math.ceil(F / 2)), es: 0, ec: n, h: 8 };
    default: return null;
  }
}
export const levelOfSave = (id, o) => { const n = PX.levelOfSave(id, o); return n != null && n < TOTAL_X ? n : null; };

// ---- hulpjes ----
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const clampStar = (s) => Math.max(1, Math.min(3, s | 0 || 1));

// ---- voortgang ----
// x: pak 1 (100 tekens, 0-3 sterren) · y: pakken 2-4 (300 tekens) · d: dagelijkse puzzel {datum: sterren}
// t: beste tijdrace {b: beste score, r: aantal runs} · td: dagelijkse tijdrace {datum: score} · sk: gekozen skin
export function emptyProgress() { return { ...PX.emptyProgress(), y: '0'.repeat(TOTAL_X - PACK_SIZE), t: { b: 0, r: 0 }, td: {}, sk: 'glas' }; }
export function cleanProgress(o) {
  const base = PX.cleanProgress(o), p = { ...base, y: '0'.repeat(TOTAL_X - PACK_SIZE), t: { b: 0, r: 0 }, td: {}, sk: 'glas' };
  if (!o || typeof o !== 'object') return p;
  if (typeof o.y === 'string') p.y = (o.y.replace(/[^0-3]/g, '') + p.y).slice(0, TOTAL_X - PACK_SIZE);
  if (o.t && typeof o.t === 'object') p.t = { b: Math.max(0, Math.min(99999, o.t.b | 0)), r: Math.max(0, Math.min(99999, o.t.r | 0)) };
  if (o.td && typeof o.td === 'object') {
    const keys = Object.keys(o.td).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort().slice(-30);
    for (const k of keys) p.td[k] = Math.max(0, Math.min(99999, o.td[k] | 0));
  }
  if (typeof o.sk === 'string' && SKINS.some((s) => s.id === o.sk)) p.sk = o.sk;
  return p;
}
const starAt = (p, n) => (n < PACK_SIZE ? +p.x[n] || 0 : +p.y[n - PACK_SIZE] || 0);
export const starsOf = starAt;
export function recordLevel(p, n, stars) {
  if (!(n >= 0 && n < TOTAL_X)) return p;
  if (n < PACK_SIZE) return PX.recordExtra(p, n, stars);
  const i = n - PACK_SIZE, cur = +p.y[i] || 0, s = clampStar(stars);
  if (s > cur) p.y = p.y.slice(0, i) + s + p.y.slice(i + 1);
  return p;
}
export function packStats(p, k) {
  let done = 0, stars = 0;
  for (let i = k * PACK_SIZE; i < (k + 1) * PACK_SIZE; i++) { const s = starAt(p, i); if (s) { done++; stars += s; } }
  return { done, stars, max: PACK_SIZE * 3, perfect: done === PACK_SIZE && stars === PACK_SIZE * 3 };
}
export function totalStats(p) {
  let done = 0, stars = 0;
  for (let k = 0; k < PACKS.length; k++) { const s = packStats(p, k); done += s.done; stars += s.stars; }
  return { done, stars, max: TOTAL_X * 3 };
}
// pak k is open als het vorige pak minstens 30 levels heeft (pak 1 is altijd open): niet te streng voor kinderen
export const PACK_UNLOCK = 30;
export const packOpen = (p, k) => k <= 0 || packStats(p, k - 1).done >= PACK_UNLOCK;

// ---- rangen op basis van alle sterren (van dit spel) ----
export const RANKS = [
  { min: 0, name: 'Beginner', icon: 'egg' },
  { min: 30, name: 'Puzzelaar', icon: 'puzzle' },
  { min: 90, name: 'Slimmerik', icon: 'lightbulb' },
  { min: 200, name: 'Meester', icon: 'medal' },
  { min: 400, name: 'Held', icon: 'shield' },
  { min: 700, name: 'Kampioen', icon: 'trophy' },
  { min: 1000, name: 'Legende', icon: 'crown' },
];
export function rankOf(stars) {
  let i = 0; for (let k = 0; k < RANKS.length; k++) if (stars >= RANKS[k].min) i = k;
  const next = RANKS[i + 1] || null;
  return { ...RANKS[i], index: i, next: next ? next.name : null, toNext: next ? next.min - stars : 0 };
}

// ---- tijdrace ----
export const TM_START = 150;      // seconden aan het begin
export const TM_BONUS = 20;       // seconden erbij per opgelost level
export const TM_MAX = 240;
export const TM_SKIP = 10;        // overslaan kost zoveel seconden        // nooit meer dan dit op de klok
// volgorde van levels in een tijdrace: begint makkelijk (pak 1), wordt langzaam moeilijker; seed bepaalt de start (dagelijks: datum)
export function tmLevel(id, seed, k) {
  return Math.min(TOTAL_X - 1, k * 6 + (hash(id + ':' + seed + ':' + k) % 6) + (k > 3 ? k : 0));
}
export const tmPoints = (stars, secLeft) => 100 + 25 * clampStar(stars) + Math.max(0, Math.min(60, Math.floor(secLeft)));
export function tmAfterSolve(secLeft) { return Math.min(TM_MAX, secLeft + TM_BONUS); }
export function recordTime(p, score, day) {
  p.t.r = Math.min(99999, p.t.r + 1);
  const newBest = score > p.t.b; if (newBest) p.t.b = Math.min(99999, score);
  if (day) {
    const cur = p.td[day] || 0; if (score > cur) p.td[day] = Math.min(99999, score);
    const keys = Object.keys(p.td).sort(); while (keys.length > 30) delete p.td[keys.shift()];
  }
  return { newBest };
}

// ---- huisstijlen (3D-skins) ----
// Een skin kleurt het spel zelf (CSS hue-rotate/saturate, werkt overal) en geeft een eigen rand, 3D-icoon en gloed.
// open: aantal sterren in dit spel, of een dagelijkse reeks, of een tijdrace-score.
export const SKINS = [
  { id: 'glas', name: 'Glas', icon: 'gem', hue: 0, sat: 1, bri: 1, ring: '#6366f1', unlock: { stars: 0 } },
  { id: 'goud', name: 'Goud', icon: 'crown', hue: -35, sat: 1.25, bri: 1.05, ring: '#f59e0b', unlock: { stars: 25 } },
  { id: 'ijs', name: 'IJs', icon: 'snowflake', hue: 150, sat: 0.95, bri: 1.1, ring: '#38bdf8', unlock: { stars: 60 } },
  { id: 'lava', name: 'Lava', icon: 'volcano', hue: -80, sat: 1.4, bri: 1, ring: '#ef4444', unlock: { stars: 120 } },
  { id: 'bos', name: 'Bos', icon: 'tree', hue: 70, sat: 1.1, bri: 1, ring: '#22c55e', unlock: { streak: 3 } },
  { id: 'snoep', name: 'Snoep', icon: 'candy', hue: 300, sat: 1.35, bri: 1.1, ring: '#ec4899', unlock: { tijd: 800 } },
  { id: 'ruimte', name: 'Ruimte', icon: 'rocket', hue: 210, sat: 1.2, bri: 0.95, ring: '#8b5cf6', unlock: { stars: 300 } },
  { id: 'regenboog', name: 'Regenboog', icon: 'rainbow', hue: 0, sat: 1.5, bri: 1.1, ring: '#f472b6', anim: true, unlock: { stars: 600 } },
];
// punten voor rang en skins: alle sterren uit de 4 packs plus de sterren van de dagelijkse puzzels
export const starScore = (p) => totalStats(p).stars + Object.values(p.d).reduce((a, b) => a + (b | 0), 0);
export function skinOpen(sk, p, streak) {
  const u = sk.unlock || {}, st = starScore(p);
  if (u.stars != null && st < u.stars) return false;
  if (u.streak != null && (streak | 0) < u.streak) return false;
  if (u.tijd != null && p.t.b < u.tijd) return false;
  return true;
}
export function unlockText(sk) {
  const u = sk.unlock || {};
  if (u.stars) return `${u.stars} sterren`;
  if (u.streak) return `${u.streak} dagen reeks`;
  if (u.tijd) return `tijdrace ${u.tijd} punten`;
  return '';
}
export const skinById = (id) => SKINS.find((s) => s.id === id) || SKINS[0];
export function skinFilter(sk) { return sk.hue || sk.sat !== 1 || sk.bri !== 1 ? `hue-rotate(${sk.hue}deg) saturate(${sk.sat}) brightness(${sk.bri})` : 'none'; }
