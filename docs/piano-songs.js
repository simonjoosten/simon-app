// Piano: liedjes, spel-logica (vallende noten), akkoordherkenning en opnames. Geen DOM of audio, dus testbaar met node.

import { NOTE_NAMES, SOLFEGE, pitchClass } from './music-synth.js';
import { b64e, b64d } from './music-model.js';

// ---- noten lezen: "C4 D#4:2 r:1 Bb3:0.5" (lengte in tellen, kwartnoot = 1) ----
const BASE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function parseNote(tok) {
  const m = /^([A-Ga-g])([#b]?)(-?\d)(?::(\d*\.?\d+))?$/.exec(tok);
  if (m) { const midi = 12 * (+m[3] + 1) + BASE[m[1].toUpperCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); return { midi, len: m[4] ? +m[4] : 1 }; }
  const r = /^[rR](?::(\d*\.?\d+))?$/.exec(tok);
  if (r) return { midi: null, len: r[1] ? +r[1] : 1 };
  return null;
}
export function parseSong(str) { return String(str || '').split(/[\s|]+/).filter(Boolean).map(parseNote).filter(Boolean); }

export const SONGS = [
  { id: 'hot', name: 'Hot cross buns', level: 1, bpm: 100, icon: 'bread', notes: 'E4 D4 C4:2 E4 D4 C4:2 C4:.5 C4:.5 C4:.5 C4:.5 D4:.5 D4:.5 D4:.5 D4:.5 E4 D4 C4:2' },
  { id: 'kortjakje', name: 'Altijd is Kortjakje ziek', level: 1, bpm: 110, icon: 'monkey', notes: 'E4 D4 C4 D4 E4 E4 E4:2 D4 D4 D4:2 E4 G4 G4:2 E4 D4 C4 D4 E4 E4 E4 E4 D4 D4 E4 D4 C4:3' },
  { id: 'jacob', name: 'Vader Jacob', level: 1, bpm: 110, icon: 'bell', notes: 'C4 D4 E4 C4 C4 D4 E4 C4 E4 F4 G4:2 E4 F4 G4:2 G4 A4 G4 F4 E4 C4 G4 A4 G4 F4 E4 C4 C4 C4 C4:2' },
  { id: 'slaap', name: 'Slaap kindje slaap', level: 1, bpm: 90, icon: 'moon', notes: 'E4:2 D4 C4 D4:2 E4:2 G4:2 E4 D4 C4:3' },
  { id: 'mary', name: 'Mary had a little lamb', level: 1, bpm: 110, icon: 'sheep', notes: 'E4 D4 C4 D4 E4 E4 E4:2 D4 D4 D4:2 E4 G4 G4:2 E4 D4 C4 D4 E4 E4 E4 E4 D4 D4 E4 D4 C4:4' },
  { id: 'clair', name: 'Au clair de la lune', level: 1, bpm: 100, icon: 'moon', notes: 'C4 C4 C4 D4 E4:2 D4:2 C4 E4 D4 D4 C4:4' },
  { id: 'eendjes', name: 'Alle eendjes', level: 1, bpm: 110, icon: 'duck', notes: 'C4 D4 E4 F4 G4:2 G4:2 A4 A4 A4 A4 G4:4 A4 A4 A4 A4 G4:4 F4 F4 F4 F4 E4:2 E4:2 D4 D4 D4 D4 C4:4' },
  { id: 'twinkel', name: 'Twinkel twinkel kleine ster', level: 2, bpm: 110, icon: 'star', notes: 'C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2 G4 G4 F4 F4 E4 E4 D4:2 G4 G4 F4 F4 E4 E4 D4:2 C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2' },
  { id: 'ode', name: 'Ode aan de vreugde', level: 2, bpm: 110, icon: 'trophy', notes: 'E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:.5 D4:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:.5 C4:2' },
  { id: 'verjaardag', name: 'Lang zal hij leven', level: 2, bpm: 100, icon: 'cake', notes: 'G4:.75 G4:.25 A4 G4 C5 B4:2 G4:.75 G4:.25 A4 G4 D5 C5:2 G4:.75 G4:.25 G5 E5 C5 B4 A4 F5:.75 F5:.25 E5 C5 D5 C5:2' },
  { id: 'jingle', name: 'Jingle bells', level: 2, bpm: 120, icon: 'bell', notes: 'E4 E4 E4:2 E4 E4 E4:2 E4 G4 C4:1.5 D4:.5 E4:4 F4 F4 F4:1.5 F4:.5 F4 E4 E4 E4:.5 E4:.5 E4 D4 D4 E4 D4:2 G4:2' },
  { id: 'susanna', name: 'Oh Susanna', level: 2, bpm: 115, icon: 'sun', notes: 'C4 D4 E4 G4 G4:1.5 A4:.5 G4 E4 C4 D4 E4 E4 D4 C4 D4:3 C4 D4 E4 G4 G4:1.5 A4:.5 G4 E4 C4 D4 E4 E4 D4 D4 C4:3' },
  { id: 'row', name: 'Row, row, row your boat', level: 2, bpm: 100, icon: 'boat', notes: 'C4:1.5 C4:1.5 C4 D4:.5 E4:1.5 E4 D4:.5 E4 F4:.5 G4:3 C5:.5 C5:.5 C5:.5 G4:.5 G4:.5 G4:.5 E4:.5 E4:.5 E4:.5 C4:.5 C4:.5 C4:.5 G4 F4:.5 E4 D4:.5 C4:3' },
  { id: 'saints', name: 'When the saints (makkelijk)', level: 2, bpm: 120, icon: 'trophy', notes: 'C4 E4 F4 G4:4 C4 E4 F4 G4:4 C4 E4 F4 G4:2 E4:2 C4:2 E4:2 D4:6' },
  { id: 'minuet', name: 'Menuet in G (Bach)', level: 3, bpm: 110, icon: 'crown', notes: 'D5:2 G4 A4 B4 C5 D5:2 G4:2 G4:2 E5:2 C5 D5 E5 F#5 G5:2 G4:2 G4:2' },
  { id: 'canon', name: 'Canon (Pachelbel, makkelijk)', level: 3, bpm: 90, icon: 'heart', notes: 'E5:2 D5:2 C5:2 B4:2 A4:2 G4:2 A4:2 B4:2 C5:2 B4:2 A4:2 G4:2 F4:2 E4:2 F4:2 G4:2' },
  { id: 'grace', name: 'Amazing Grace', level: 3, bpm: 80, icon: 'fairy', notes: 'G4 C5:2 E5:.5 C5:.5 E5:2 D5 C5:2 A4 G4:2 G4 C5:2 E5:.5 C5:.5 E5:2 D5 G5:3' },
  { id: 'beethoven', name: 'Het lot klopt aan (Beethoven)', level: 3, bpm: 120, icon: 'bolt', notes: 'G4:.5 G4:.5 G4:.5 D#4:3 r:.5 F4:.5 F4:.5 F4:.5 D4:3' },
  { id: 'elise', name: 'Für Elise', level: 3, bpm: 120, icon: 'piano', notes: 'E5:.5 D#5:.5 E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 A4:1.5 r:.5 C4:.5 E4:.5 A4:.5 B4:1.5 r:.5 E4:.5 G#4:.5 B4:.5 C5:2' },
  { id: 'riff', name: 'Rock-riff (op de lage toetsen)', level: 3, bpm: 110, icon: 'guitar', notes: 'G3 A#3 C4:1.5 G3 A#3 C#4 C4:2 G3 A#3 C4:1.5 A#3 G3:2' },
];
export const SONG_BY_ID = Object.fromEntries(SONGS.map((s) => [s.id, s]));
export const songNotes = (s) => parseSong(s.notes);

// ---- tijdlijn in ms (rusten tellen mee) ----
export function songTimeline(song, speed = 1) {
  const beat = 60000 / (song.bpm * speed), out = []; let t = 0;
  parseSong(song.notes).forEach((n) => { if (n.midi != null) out.push({ midi: n.midi, t: t * beat, d: Math.max(60, n.len * beat * 0.92) }); t += n.len; });
  return out;
}
export const songRange = (tl) => (tl.length ? { lo: Math.min(...tl.map((n) => n.midi)), hi: Math.max(...tl.map((n) => n.midi)) } : { lo: 60, hi: 72 });
export function songSeconds(song, speed = 1) { const beat = 60 / (song.bpm * speed); return parseSong(song.notes).reduce((a, n) => a + n.len * beat, 0); }

// ---- toetsenbord-indeling ----
export const KEY_MIN = 36, KEY_MAX = 96;   // C2 .. C7
export const isBlackKey = (m) => [1, 3, 6, 8, 10].includes(pitchClass(m));
// indeling van `octaves` octaven vanaf start (een C). Geeft {keys:[{midi,black,x,w}], whites}
export function keyLayout(start, octaves) {
  const end = start + octaves * 12;   // inclusief de laatste C
  const keys = [], whites = []; for (let m = start; m <= end; m++) if (!isBlackKey(m)) whites.push(m);
  const W = 100 / whites.length; let wi = 0;
  for (let m = start; m <= end; m++) {
    if (!isBlackKey(m)) { keys.push({ midi: m, black: false, x: wi * W, w: W }); wi++; }
    else keys.push({ midi: m, black: true, x: wi * W - W * 0.3, w: W * 0.6 });
  }
  return { keys, whites: whites.length, W, start, end };
}
export function fitStart(lo, hi, octaves) {   // kies een beginnoot (C) zodat lo..hi in beeld past
  let start = Math.floor(lo / 12) * 12;
  while (start + octaves * 12 < hi && start + 12 <= KEY_MAX - octaves * 12) start += 12;
  return Math.max(KEY_MIN, Math.min(KEY_MAX - octaves * 12, start));
}
// computertoetsen: home-rij = witte, bovenrij = zwarte, relatief aan de eerste C
export const KEYMAP = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ';': 16, "'": 17 };
export const keyLetterFor = (midi, start) => Object.keys(KEYMAP).find((k) => start + KEYMAP[k] === midi) || '';
export const labelFor = (midi, mode) => (mode === 'noten' ? NOTE_NAMES[pitchClass(midi)] : mode === 'dore' ? SOLFEGE[pitchClass(midi)] : '');

// ---- akkoorden ----
export const CHORD_TYPES = [
  { id: 'maj', name: 'Majeur', suffix: '', iv: [0, 4, 7] },
  { id: 'min', name: 'Mineur', suffix: 'm', iv: [0, 3, 7] },
  { id: '7', name: 'Dominant 7', suffix: '7', iv: [0, 4, 7, 10] },
  { id: 'maj7', name: 'Majeur 7', suffix: 'maj7', iv: [0, 4, 7, 11] },
  { id: 'm7', name: 'Mineur 7', suffix: 'm7', iv: [0, 3, 7, 10] },
  { id: 'sus4', name: 'Sus4', suffix: 'sus4', iv: [0, 5, 7] },
  { id: 'dim', name: 'Verminderd', suffix: 'dim', iv: [0, 3, 6] },
  { id: 'aug', name: 'Overmatig', suffix: 'aug', iv: [0, 4, 8] },
  { id: 'pow', name: 'Powerchord', suffix: '5', iv: [0, 7] },
];
export const chordNotes = (root, typeId) => { const t = CHORD_TYPES.find((x) => x.id === typeId) || CHORD_TYPES[0]; return t.iv.map((i) => root + i); };
export function detectChord(midis) {
  const set = [...new Set(midis.map(pitchClass))]; if (set.length < 2) return null;
  const bass = pitchClass(Math.min(...midis)); let best = null;
  for (const r of set) {
    const rel = set.map((p) => (p - r + 12) % 12).sort((a, b) => a - b);
    for (const t of CHORD_TYPES) {
      if (rel.length === t.iv.length && rel.every((v, i) => v === t.iv[i])) {
        const score = t.iv.length * 10 + (r === bass ? 5 : 0) - CHORD_TYPES.indexOf(t) * 0.1;
        if (!best || score > best.score) best = { score, name: NOTE_NAMES[r] + t.suffix + (r !== bass ? '/' + NOTE_NAMES[bass] : ''), root: r, type: t.id };
      }
    }
  }
  return best ? best.name : null;
}
// de 7 akkoorden van een majeur-toonsoort (voor de akkoordenkaart)
export function keyChords(rootPc) {
  const maj = [0, 2, 4, 5, 7, 9, 11], q = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'], rom = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
  return maj.map((s, i) => { const root = 48 + ((rootPc + s) % 12); return { roman: rom[i], type: q[i], root, name: NOTE_NAMES[(rootPc + s) % 12] + (q[i] === 'min' ? 'm' : q[i] === 'dim' ? 'dim' : ''), notes: chordNotes(root, q[i]) }; });
}

// ---- vallende-noten-spel ----
export const HIT = { perfect: 70, goed: 130, ok: 210 };
export function newGame(timeline) { return { notes: timeline.map((n) => ({ ...n, state: 'wacht' })), score: 0, combo: 0, best: 0, counts: { perfect: 0, goed: 0, ok: 0, mis: 0 }, points: 0, total: timeline.length }; }
// speler drukt `midi` op tijd `now` (ms vanaf start). Geeft {grade, idx} of null (verkeerde/te vroege toets).
export function press(g, midi, now) {
  let bi = -1, bd = Infinity;
  g.notes.forEach((n, i) => { if (n.state === 'wacht' && n.midi === midi) { const d = Math.abs(n.t - now); if (d < bd) { bd = d; bi = i; } } });
  if (bi < 0 || bd > HIT.ok) { return null; }
  const grade = bd <= HIT.perfect ? 'perfect' : bd <= HIT.goed ? 'goed' : 'ok', n = g.notes[bi];
  n.state = grade; g.counts[grade]++; g.combo++; g.best = Math.max(g.best, g.combo);
  const base = { perfect: 100, goed: 70, ok: 40 }[grade], mult = 1 + Math.min(3, Math.floor(g.combo / 8));
  g.points += base; g.score += base * mult;
  return { grade, idx: bi, err: now - n.t };
}
// noten die te laat zijn tellen als gemist; geeft het aantal nieuwe missers
export function sweep(g, now) { let k = 0; g.notes.forEach((n) => { if (n.state === 'wacht' && now - n.t > HIT.ok) { n.state = 'mis'; g.counts.mis++; g.combo = 0; k++; } }); return k; }
export const gameDone = (g) => g.notes.every((n) => n.state !== 'wacht');
export function gameResult(g) {
  const acc = g.total ? g.points / (g.total * 100) : 0;
  return { accuracy: Math.round(acc * 100), stars: acc >= 0.88 ? 3 : acc >= 0.68 ? 2 : acc >= 0.4 ? 1 : 0, score: g.score, bestCombo: g.best, counts: { ...g.counts } };
}

// ---- opnames ----
// events [{midi,on,t}] -> noten [[midi, start, duur]] (ms), gesorteerd
export function eventsToNotes(events) {
  const open = new Map(), out = [];
  [...events].sort((a, b) => a.t - b.t).forEach((e) => {
    if (e.on) { if (!open.has(e.midi)) open.set(e.midi, e.t); }
    else if (open.has(e.midi)) { out.push([e.midi, Math.round(open.get(e.midi)), Math.max(30, Math.round(e.t - open.get(e.midi)))]); open.delete(e.midi); }
  });
  open.forEach((t, midi) => out.push([midi, Math.round(t), 300]));
  out.sort((a, b) => a[1] - b[1]);
  if (out.length) { const t0 = out[0][1]; out.forEach((n) => { n[1] -= t0; }); }
  return out;
}
export const tapeSeconds = (notes) => (notes.length ? Math.max(...notes.map((n) => n[1] + n[2])) / 1000 : 0);
export function cleanNotes(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, 2000).filter((n) => Array.isArray(n) && n.length >= 3 && Number.isFinite(+n[0]) && Number.isFinite(+n[1]) && Number.isFinite(+n[2]))
    .map((n) => [Math.max(21, Math.min(108, Math.round(+n[0]))), Math.max(0, Math.round(+n[1])), Math.max(20, Math.min(10000, Math.round(+n[2])))]);
}
export function tapeToCode(tape) { return 'PN1:' + b64e(JSON.stringify({ n: String(tape.name || '').slice(0, 30), i: tape.inst, a: tape.notes })); }
export function codeToTape(code) {
  try {
    const m = /PN1:([A-Za-z0-9_\-]+)/.exec(String(code || '').replace(/\s+/g, '')); if (!m) return null;
    const o = JSON.parse(b64d(m[1])), notes = cleanNotes(o.a); if (!notes.length) return null;
    return { name: typeof o.n === 'string' ? o.n.slice(0, 30) : '', inst: typeof o.i === 'string' ? o.i.slice(0, 20) : 'piano', notes };
  } catch { return null; }
}
export const TAPE_MAX = 8;
export function sanitizeTapes(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, TAPE_MAX).map((t) => (t && typeof t === 'object' ? { name: String(t.name || 'Opname').slice(0, 30), inst: String(t.inst || 'piano').slice(0, 20), notes: cleanNotes(t.notes) } : null)).filter((t) => t && t.notes.length);
}
