// Muziekmaker: datamodel en logica (zonder DOM of audio, dus testbaar met node).
// Song = { v:2, bpm, swing, key, scale, len, fx, vol, tracks[], pats[4][track][rij][stap], chain[] }

import { NOTE_NAMES, DRUM_IDS, INST_IDS, midiFreq, playNote, playDrum } from './music-synth.js';

export const MAXSTEPS = 32, PAT_COUNT = 4, MAX_TRACKS = 8, MAX_CHAIN = 16, MEL_ROWS = 8, CHORD_ROWS = 7, KIT_ROWS = 8;
export const PAT_NAMES = ['A', 'B', 'C', 'D'];
export const LENGTHS = [8, 16, 32];
export const KIT_DEFAULT = ['kick', 'snare', 'hat', 'open', 'clap', 'tom', 'rim', 'cowbell'];

export const SCALES = {
  pentatonisch: { label: 'Pentatonisch (altijd mooi)', semis: [0, 2, 4, 7, 9] },
  majeur: { label: 'Majeur (vrolijk)', semis: [0, 2, 4, 5, 7, 9, 11] },
  mineur: { label: 'Mineur (stoer / sip)', semis: [0, 2, 3, 5, 7, 8, 10] },
  blues: { label: 'Blues', semis: [0, 3, 5, 6, 7, 10] },
  dorisch: { label: 'Dorisch (cool)', semis: [0, 2, 3, 5, 7, 9, 10] },
  mixolydisch: { label: 'Mixolydisch (funky)', semis: [0, 2, 4, 5, 7, 9, 10] },
  harmmineur: { label: 'Harmonisch mineur (spannend)', semis: [0, 2, 3, 5, 7, 8, 11] },
  heletoon: { label: 'Hele toon (dromerig)', semis: [0, 2, 4, 6, 8, 10] },
  japans: { label: 'Japans', semis: [0, 2, 3, 7, 8] },
};
export const SCALE_KEYS = Object.keys(SCALES);

export const rootMidi = (key) => 60 + (key | 0) - ((key | 0) > 6 ? 12 : 0);   // C4..F#4 / G3..B3
const clampInt = (v, a, b, d) => { v = Math.round(+v); return Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : d; };

// midi-noot voor melodierij r (0 = bovenste = hoogste)
export function rowMidi(r, key, scaleKey, oct = 0) {
  const semis = (SCALES[scaleKey] || SCALES.pentatonisch).semis;
  const deg = (MEL_ROWS - 1) - r;
  return rootMidi(key) + semis[deg % semis.length] + 12 * Math.floor(deg / semis.length) + 12 * oct;
}

// ---- akkoorden uit de toonladder (stapel van tertsen) ----
export function chordScale(scaleKey) {
  const s = (SCALES[scaleKey] || SCALES.majeur).semis;
  if (s.length === 7) return s;
  return (scaleKey === 'blues' || scaleKey === 'japans') ? SCALES.mineur.semis : SCALES.majeur.semis;
}
export function chordMidis(deg, key, scaleKey, oct = 0, seventh = false) {
  const s = chordScale(scaleKey), root = rootMidi(key) - 12 + 12 * oct;
  return (seventh ? [0, 2, 4, 6] : [0, 2, 4]).map((k) => { const i = deg + k; return root + s[i % 7] + 12 * Math.floor(i / 7); });
}
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
export function chordName(deg, key, scaleKey) {
  const m = chordMidis(deg, key, scaleKey), a = m[1] - m[0], b = m[2] - m[1];
  const q = a === 4 && b === 3 ? '' : a === 3 && b === 4 ? 'm' : a === 3 && b === 3 ? 'dim' : a === 4 && b === 4 ? 'aug' : '?';
  return NOTE_NAMES[((m[0] % 12) + 12) % 12] + q;
}
export const chordRoman = (deg, key, scaleKey) => { const n = chordName(deg, key, scaleKey); return /m|dim/.test(n.slice(1)) ? ROMAN[deg].toLowerCase() : ROMAN[deg]; };

// ---- tracks en patronen ----
export const rowsFor = (t) => (t.kind === 'drums' ? KIT_ROWS : t.kind === 'chord' ? CHORD_ROWS : MEL_ROWS);
export const blankRows = (n) => Array.from({ length: n }, () => new Array(MAXSTEPS).fill(false));
const copyRows = (rows) => rows.map((r) => r.slice());

export function newTrack(kind, o = {}) {
  const t = { id: o.id || 't' + Math.random().toString(36).slice(2, 7), kind, vol: 0.8, mute: false, solo: false, oct: 0 };
  if (kind === 'drums') t.kit = (o.kit || KIT_DEFAULT).slice(0, KIT_ROWS);
  else t.inst = INST_IDS.includes(o.inst) ? o.inst : (kind === 'chord' ? 'epiano' : 'synth');
  if (o.vol != null) t.vol = o.vol;
  if (o.oct != null) t.oct = clampInt(o.oct, -3, 3, 0);
  return t;
}
export const trackLabel = (t) => (t.kind === 'drums' ? 'Drums' : t.kind === 'chord' ? 'Akkoorden' : 'Melodie');

export function newSong() {
  const song = { v: 2, bpm: 100, swing: 0, key: 0, scale: 'pentatonisch', len: 16, fx: { rev: 0.15, echo: 0, filter: 1 }, vol: 0.8, tracks: [], pats: [], chain: [0] };
  song.tracks.push(newTrack('drums', { id: 't1' }), newTrack('mel', { id: 't2', inst: 'synth' }));
  for (let p = 0; p < PAT_COUNT; p++) song.pats.push(song.tracks.map((t) => blankRows(rowsFor(t))));
  return song;
}
export function addTrack(song, kind, inst) {
  if (song.tracks.length >= MAX_TRACKS) return null;
  const t = newTrack(kind, { inst });
  let n = 1; while (song.tracks.some((x) => x.id === t.id)) t.id = 't' + (++n) + Math.random().toString(36).slice(2, 4);
  song.tracks.push(t); song.pats.forEach((p) => p.push(blankRows(rowsFor(t))));
  return t;
}
export function removeTrack(song, idx) {
  if (song.tracks.length <= 1 || idx < 0 || idx >= song.tracks.length) return false;
  song.tracks.splice(idx, 1); song.pats.forEach((p) => p.splice(idx, 1)); return true;
}
export function clearTrack(song, p, idx) { song.pats[p][idx] = blankRows(rowsFor(song.tracks[idx])); }
export function copyPattern(song, from, to) { if (from === to) return; song.pats[to] = song.pats[from].map(copyRows); }
export function clearPattern(song, p) { song.pats[p] = song.tracks.map((t) => blankRows(rowsFor(t))); }
export const patternHasNotes = (song, p) => song.pats[p].some((tr) => tr.some((row) => row.some(Boolean)));
export const songHasNotes = (song) => song.pats.some((_, p) => patternHasNotes(song, p));

// ---- welke klanken horen bij stap `step` van patroon `p` ----
export function audibleTracks(song) {
  const anySolo = song.tracks.some((t) => t.solo);
  return song.tracks.map((t) => (anySolo ? !!t.solo : !t.mute));
}
export function stepEvents(song, p, step, aud = audibleTracks(song)) {
  const ev = [], len = song.len;
  song.tracks.forEach((t, ti) => {
    if (!aud[ti]) return;
    const rows = song.pats[p][ti]; if (!rows) return;
    rows.forEach((row, r) => {
      if (!row[step]) return;
      if (t.kind === 'drums') { if (t.kit[r]) ev.push({ ti, type: 'drum', id: t.kit[r], vol: t.vol }); }
      else if (t.kind === 'mel') ev.push({ ti, type: 'note', inst: t.inst, midi: rowMidi(r, song.key, song.scale, t.oct), vol: t.vol, steps: 0.9 });
      else if (step === 0 || !row[step - 1]) { // akkoord: aaneengesloten vakjes = één lang akkoord
        let n = 1; while (step + n < len && row[step + n]) n++;
        ev.push({ ti, type: 'chord', inst: t.inst, midis: chordMidis(r, song.key, song.scale, t.oct), vol: t.vol * 0.7, steps: n * 0.97 });
      }
    });
  });
  return ev;
}
export const swingOffset = (step, swing, stepDur) => (step % 2 === 1 ? (swing / 100) * 0.4 * stepDur : 0);
export const stepDur = (bpm) => 60 / bpm / 4;
// patroonvolgorde bij afspelen: 'pattern' = alleen het gekozen patroon, 'song' = de hele keten
export function playOrder(song, mode, cur) { return mode === 'song' && song.chain.length ? song.chain.slice() : [cur]; }
export function songSeconds(song, mode, cur) { return playOrder(song, mode, cur).length * song.len * stepDur(song.bpm); }

// ---- variatie voor patroon B/C/D uit patroon A (deterministisch) ----
export function makeVariation(song, from, kind) {
  const len = song.len;
  return song.pats[from].map((rows, ti) => {
    const t = song.tracks[ti], out = copyRows(rows);
    if (t.kind === 'drums') {
      const hat = t.kit.indexOf('hat'), sn = t.kit.indexOf('snare'), kk = t.kit.indexOf('kick'), tom = t.kit.indexOf('tom');
      if (kind === 'break') { if (kk >= 0) out[kk].fill(false); if (hat >= 0) for (let s = 0; s < len; s += 2) out[hat][s] = true; }
      else {
        if (sn >= 0) for (let s = len - 4; s < len; s++) if (s >= 0) out[sn][s] = s % 2 === 0 || s === len - 1;
        if (hat >= 0) for (let s = len - 4; s < len; s++) if (s >= 0) out[hat][s] = true;
        if (tom >= 0) out[tom][len - 1] = true;
      }
    } else if (t.kind === 'mel') {
      const half = len / 2;
      for (let r = 1; r < MEL_ROWS; r++) for (let s = half; s < len; s++) { if (rows[r][s]) { out[r][s] = false; out[r - 1][s] = true; } }
    } else {
      for (let r = 0; r < CHORD_ROWS; r++) for (let s = 0; s < len; s++) if (rows[r][s] && kind !== 'break') { out[r][s] = false; out[(r + 3) % CHORD_ROWS][s] = true; }
    }
    return out;
  });
}

// ---- opslag: compacte vorm (hex per rij), controle van alles wat binnenkomt ----
const rowHex = (row) => { let s = ''; for (let i = 0; i < MAXSTEPS; i += 4) s += ((row[i] ? 8 : 0) | (row[i + 1] ? 4 : 0) | (row[i + 2] ? 2 : 0) | (row[i + 3] ? 1 : 0)).toString(16); return /^0+$/.test(s) ? '' : s; };
const hexRow = (h) => { const r = new Array(MAXSTEPS).fill(false); if (typeof h !== 'string') return r; for (let i = 0; i < Math.min(8, h.length); i++) { const v = parseInt(h[i], 16); if (Number.isNaN(v)) continue; r[i * 4] = !!(v & 8); r[i * 4 + 1] = !!(v & 4); r[i * 4 + 2] = !!(v & 2); r[i * 4 + 3] = !!(v & 1); } return r; };
export function compactSong(song) {
  return {
    v: 2, b: song.bpm, w: song.swing, k: song.key, s: song.scale, l: song.len, f: [song.fx.rev, song.fx.echo, song.fx.filter], o: song.vol,
    t: song.tracks.map((t) => ({ k: t.kind, i: t.kind === 'drums' ? t.kit.join(',') : t.inst, v: Math.round(t.vol * 100), m: t.mute ? 1 : 0, s: t.solo ? 1 : 0, c: t.oct, id: t.id })),
    p: song.pats.map((pat) => pat.map((rows) => rows.map(rowHex).join(','))),
    c: song.chain,
  };
}
export function fromV1(d) {
  const song = newSong();
  const dr = song.tracks[0], me = song.tracks[1];
  const fix = (rows, n) => Array.from({ length: n }, (_, r) => { const x = new Array(MAXSTEPS).fill(false); for (let s = 0; s < 16; s++) x[s] = !!(rows && rows[r] && rows[r][s]); return x; });
  song.pats[0][0] = fix(d.drums, KIT_ROWS); song.pats[0][1] = fix(d.mel, MEL_ROWS);
  const snd = { synth: 'synth', bas: 'bas', bel: 'bel', orgel: 'orgel' }[d.sound] || 'synth';
  me.inst = snd; me.oct = snd === 'bas' ? -2 : 0;
  if (SCALES[d.scale]) song.scale = d.scale;
  song.bpm = clampInt(d.bpm, 60, 180, 100); song.swing = clampInt(d.swing, 0, 100, 0);
  void dr; return song;
}
// Maakt van ELKE invoer een geldige song (of null).
export function sanitizeSong(d) {
  if (!d || typeof d !== 'object') return null;
  if (!d.v && Array.isArray(d.drums) && Array.isArray(d.mel)) return fromV1(d);
  if (d.v !== 2) return null;
  const song = newSong(); song.tracks = []; song.pats = [];
  const full = Array.isArray(d.tracks);
  const trs = full ? d.tracks : d.t;
  if (!Array.isArray(trs) || !trs.length) return null;
  const seen = new Set();
  trs.slice(0, MAX_TRACKS).forEach((x) => {
    if (!x || typeof x !== 'object') return;
    const kind = full ? x.kind : x.k;
    if (!['drums', 'mel', 'chord'].includes(kind)) return;
    let id = String((full ? x.id : x.id) || '').replace(/[^a-z0-9]/gi, '').slice(0, 8) || 't' + song.tracks.length;
    while (seen.has(id)) id += 'x'; seen.add(id);
    const o = { id };
    if (kind === 'drums') {
      const kit = full ? x.kit : String(x.i || '').split(',');
      o.kit = Array.isArray(kit) ? kit.map((k) => (DRUM_IDS.includes(k) ? k : null)).filter(Boolean).slice(0, KIT_ROWS) : KIT_DEFAULT;
      while (o.kit.length < KIT_ROWS) o.kit.push(KIT_DEFAULT[o.kit.length]);
    } else o.inst = full ? x.inst : x.i;
    const t = newTrack(kind, o);
    const vol = full ? x.vol : (+x.v / 100); t.vol = Number.isFinite(vol) ? Math.max(0, Math.min(1, vol)) : 0.8;
    t.mute = !!(full ? x.mute : x.m); t.solo = !!(full ? x.solo : x.s);
    t.oct = clampInt(full ? x.oct : x.c, -3, 3, 0);
    song.tracks.push(t);
  });
  if (!song.tracks.length) return null;
  song.bpm = clampInt(full ? d.bpm : d.b, 50, 200, 100); song.swing = clampInt(full ? d.swing : d.w, 0, 100, 0);
  song.key = clampInt(full ? d.key : d.k, 0, 11, 0);
  const sc = full ? d.scale : d.s; song.scale = SCALES[sc] ? sc : 'pentatonisch';
  const ln = clampInt(full ? d.len : d.l, 8, 32, 16); song.len = LENGTHS.includes(ln) ? ln : 16;
  const fx = full ? [d.fx && d.fx.rev, d.fx && d.fx.echo, d.fx && d.fx.filter] : d.f;
  const f01 = (v, dflt) => (Number.isFinite(+v) && v !== null ? Math.max(0, Math.min(1, +v)) : dflt);
  song.fx = { rev: f01(fx && fx[0], 0.15), echo: f01(fx && fx[1], 0), filter: f01(fx && fx[2], 1) };
  const vol = full ? d.vol : d.o; song.vol = Number.isFinite(+vol) && vol !== null ? Math.max(0, Math.min(1, +vol)) : 0.8;
  const pats = full ? d.pats : d.p;
  for (let p = 0; p < PAT_COUNT; p++) {
    song.pats.push(song.tracks.map((t, ti) => {
      const src = pats && pats[p] && pats[p][ti];
      const n = rowsFor(t);
      if (full) return Array.from({ length: n }, (_, r) => Array.from({ length: MAXSTEPS }, (_, s) => !!(Array.isArray(src) && src[r] && src[r][s])));
      const parts = typeof src === 'string' ? src.split(',') : [];
      return Array.from({ length: n }, (_, r) => hexRow(parts[r]));
    }));
  }
  const ch = (full ? d.chain : d.c);
  song.chain = Array.isArray(ch) ? ch.map((n) => clampInt(n, 0, PAT_COUNT - 1, 0)).slice(0, MAX_CHAIN) : [0];
  if (!song.chain.length) song.chain = [0];
  return song;
}
export const cloneSong = (song) => sanitizeSong(JSON.parse(JSON.stringify(song)));

// ---- delen via code ----
export const b64e = (s) => { const bytes = new TextEncoder().encode(s); let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b); }); return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
export const b64d = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s); const b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return new TextDecoder().decode(b); };
export function songToCode(song, name = '') {
  const o = compactSong(song); if (name) o.n = String(name).slice(0, 30);
  return 'MM2:' + b64e(JSON.stringify(o));
}
export function codeToSong(code) {
  try {
    const m = /MM2:([A-Za-z0-9_\-]+)/.exec(String(code || '').replace(/\s+/g, ''));
    if (!m) return null;
    const o = JSON.parse(b64d(m[1])); const song = sanitizeSong(o);
    return song ? { song, name: typeof o.n === 'string' ? o.n.slice(0, 30) : '' } : null;
  } catch { return null; }
}

// ---- voorbeelden ----
const bits = (s) => { const r = new Array(MAXSTEPS).fill(false); for (let i = 0; i < s.length && i < MAXSTEPS; i++) r[i] = s[i] === 'x'; return r; };
const D = (rows) => Array.from({ length: KIT_ROWS }, (_, i) => bits(rows[i] || ''));
const M = (rows) => Array.from({ length: MEL_ROWS }, (_, i) => bits(rows[i] || ''));
const C = (rows) => Array.from({ length: CHORD_ROWS }, (_, i) => bits(rows[i] || ''));
export const PRESETS = {
  hiphop: { label: 'Hiphop', icon: 'microphone', bpm: 88, swing: 35, key: 0, scale: 'mineur', tr: [
    ['drums', null, 0, D(['x..x..x...x..x..', '....x.......x...', 'x.x.x.x.x.x.x.x.', '......x.......x.'])],
    ['mel', 'bas', -2, M(['', '', '', '', '', 'x.......x.......', '..x.......x.....', 'x..x..x...x..x..'])]] },
  house: { label: 'House', icon: 'headphones', bpm: 124, swing: 10, key: 9, scale: 'mineur', tr: [
    ['drums', null, 0, D(['x...x...x...x...', '', '', '..x...x...x...x.', '....x.......x...'])],
    ['mel', 'synth', 0, M(['', '', '', 'x..x..x...x..x..', '', '..x.......x.....', '', ''])],
    ['chord', 'supersaw', 0, C(['xxxxxxxx........', '', '', '', '........xxxxxxxx', '', ''])]] },
  rock: { label: 'Rock', icon: 'guitar', bpm: 112, swing: 0, key: 4, scale: 'pentatonisch', tr: [
    ['drums', null, 0, D(['x.....x.x.x.....', '....x.......x...', 'x.x.x.x.x.x.x.x.', '', '', '..............x.'])],
    ['mel', 'gitaar', 0, M(['', '', '', '', 'x.......x.......', '', 'x...x...x...x...', ''])],
    ['mel', 'bas', -2, M(['', '', '', '', '', '', '', 'x.x.x.x.x.x.x.x.'])]] },
  chill: { label: 'Chill', icon: 'moon', bpm: 74, swing: 25, key: 0, scale: 'majeur', tr: [
    ['drums', null, 0, D(['x.......x.x.....', '............x...', 'x.x.x.x.x.x.x.x.'])],
    ['mel', 'bel', 0, M(['', 'x...............', '......x.........', '', '........x.......', '', '', 'x.......x.......'])],
    ['chord', 'epiano', 0, C(['xxxxxxxx........', '', '', '', '........xxxxxxxx', '', ''])]] },
  disco: { label: 'Disco', icon: 'star', bpm: 118, swing: 0, key: 7, scale: 'majeur', tr: [
    ['drums', null, 0, D(['x...x...x...x...', '....x.......x...', 'x.x.x.x.x.x.x.x.', '..x...x...x...x.', '....x.......x...'])],
    ['mel', 'bas', -2, M(['', '', '', '', '', '', 'x.x.xx..x.x.xx..', '..x...x...x...x.'])],
    ['chord', 'strijkers', 0, C(['xxxxxxxx........', '', '', '........xxxxxxxx', '', '', ''])]] },
  techno: { label: 'Techno', icon: 'bolt', bpm: 132, swing: 0, key: 2, scale: 'mineur', tr: [
    ['drums', null, 0, D(['x...x...x...x...', '', 'x.x.x.x.x.x.x.x.', '..x...x...x...x.', '....x.......x...'])],
    ['mel', 'acid', -1, M(['', '', '', '', '', 'x...x.....x.....', '..x...x...x...x.', 'x.xx.x.xx.x.xx.x'])]] },
  reggae: { label: 'Reggae', icon: 'sun', bpm: 80, swing: 20, key: 7, scale: 'majeur', tr: [
    ['drums', null, 0, D(['........x.......', '', 'x.x.x.x.x.x.x.x.', '', '', '', '....x.......x...'])],
    ['chord', 'gitaar', 0, C(['..x...x...x...x.', '', '', '', '', '', ''])],
    ['mel', 'bas', -2, M(['', '', '', '', '', '', 'x.....x.x.....x.', 'x.x.......x.x...'])]] },
  lofi: { label: 'Lo-fi', icon: 'cloud', bpm: 70, swing: 40, key: 5, scale: 'dorisch', tr: [
    ['drums', null, 0, D(['x.....x...x.....', '........x.......', 'x.x.x.x.x.x.x.x.', '', '', '', '', ''])],
    ['chord', 'epiano', 0, C(['xxxxxxxx........', '', '', '', '', '........xxxxxxxx', ''])],
    ['mel', 'marimba', 0, M(['', '', '..x.......x.....', '', 'x.....x.........', '', '', ''])]] },
  gamer: { label: '8-bit spel', icon: 'puzzle', bpm: 140, swing: 0, key: 0, scale: 'majeur', tr: [
    ['drums', null, 0, D(['x...x...x...x...', '....x.......x...', 'x.x.x.x.x.x.x.x.'])],
    ['mel', 'chip', 0, M(['x.x...x.x.x...x.', '..x.x.....x.x...', '', 'x...x...', '', '', '', ''])],
    ['mel', 'chip2', -2, M(['', '', '', '', '', '', 'x.x.....x.x.....', '....x.x.....x.x.'])]] },
  funk: { label: 'Funk', icon: 'flame', bpm: 100, swing: 15, key: 4, scale: 'mixolydisch', tr: [
    ['drums', null, 0, D(['x..x..x...x.x...', '....x..x....x...', 'x.xxx.xxx.xxx.xx', '', '', '', '', ''])],
    ['mel', 'acid', -2, M(['', '', '', '', '', '', 'x..x..x...x.x...', 'x.....x.x.....x.'])],
    ['chord', 'gitaar', 0, C(['..x...x...x...x.', '', '', '', '', '', ''])]] },
  pop: { label: 'Pop-akkoorden', icon: 'heart', bpm: 100, swing: 0, key: 0, scale: 'majeur', tr: [
    ['drums', null, 0, D(['x.....x.x.......', '....x.......x...', 'x.x.x.x.x.x.x.x.'])],
    ['chord', 'strijkers', 0, C(['xxxx............', '', '', '............xxxx', '....xxxx........', '........xxxx....', ''])],
    ['mel', 'piano', 0, M(['', '', 'x.x.....x.....x.', '..x.x.x...x.x...', '', '', '', ''])]] },
};
export const PRESET_KEYS = Object.keys(PRESETS);
export function buildPreset(id) {
  const P = PRESETS[id]; if (!P) return null;
  const song = newSong();
  song.bpm = P.bpm; song.swing = P.swing; song.key = P.key; song.scale = P.scale; song.len = 16;
  song.tracks = []; song.pats = [[], [], [], []];
  P.tr.forEach(([kind, inst, oct, rows], i) => {
    song.tracks.push(newTrack(kind, { id: 't' + (i + 1), inst: inst || undefined, oct }));
    song.pats[0].push(rows.map((r) => r.slice()));
    for (let p = 1; p < PAT_COUNT; p++) song.pats[p].push(blankRows(rowsFor(song.tracks[i])));
  });
  song.pats[1] = makeVariation(song, 0, 'fill'); song.pats[2] = makeVariation(song, 0, 'break');
  song.chain = [0, 0, 1, 0, 0, 0, 1, 2];
  return song;
}

// ---- tempo tikken ----
export function tapTempo(times) {
  const t = times.slice(-7); if (t.length < 3) return null;
  const iv = []; for (let i = 1; i < t.length; i++) { const d = t[i] - t[i - 1]; if (d >= 200 && d < 1500) iv.push(d); }
  if (iv.length < 2) return null;
  const avg = iv.reduce((a, b) => a + b, 0) / iv.length;
  return Math.max(60, Math.min(180, Math.round(60000 / avg)));
}

// ---- ritmespel ----
export const RHYTHM_LEVELS = 8;
export function makeRng(seed) { let a = (seed >>> 0) || 1; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// 16 stappen (1 maat), moeilijkheid per niveau. Stap 0 is altijd raak.
export function rhythmPattern(level, seed) {
  const L = Math.max(1, Math.min(RHYTHM_LEVELS, level | 0)), rnd = makeRng(seed * 7919 + L), pat = new Array(16).fill(false);
  const grid = L <= 2 ? [0, 4, 8, 12] : L <= 4 ? [0, 2, 4, 6, 8, 10, 12, 14] : Array.from({ length: 16 }, (_, i) => i);
  const want = [3, 4, 4, 5, 5, 6, 7, 8][L - 1];
  pat[0] = true; let n = 1, guard = 0;
  while (n < want && guard++ < 200) { const s = grid[Math.floor(rnd() * grid.length)]; if (!pat[s]) { pat[s] = true; n++; } }
  return pat;
}
export function patternTimes(pat, bpm) { const sd = 60000 / bpm / 4, out = []; pat.forEach((v, i) => { if (v) out.push(i * sd); }); return out; }
export function scoreTaps(targets, taps, tol = 140) {
  const used = new Array(taps.length).fill(false); let hits = 0, errSum = 0; const per = [];
  targets.forEach((t) => {
    let best = -1, bd = Infinity;
    taps.forEach((x, i) => { if (!used[i]) { const d = Math.abs(x - t); if (d < bd) { bd = d; best = i; } } });
    if (best >= 0 && bd <= tol) { used[best] = true; hits++; errSum += bd; per.push({ ok: true, err: taps[best] - t }); } else per.push({ ok: false, err: null });
  });
  const extra = used.filter((u) => !u).length, avg = hits ? errSum / hits : 0;
  const base = targets.length ? hits / targets.length : 0;
  const score = Math.max(0, Math.min(100, Math.round(100 * base * (1 - Math.min(0.35, avg / (tol * 3))) - 9 * extra)));
  return { hits, total: targets.length, extra, avgErr: Math.round(avg), score, stars: score >= 90 ? 3 : score >= 70 ? 2 : score >= 40 ? 1 : 0, per };
}

// ---- events omzetten in geluid (live en offline) ----
export function fireEvent(c, dest, nb, e, t, sd) {
  if (e.type === 'drum') playDrum(c, dest, nb, e.id, t, e.vol);
  else if (e.type === 'note') playNote(c, dest, e.inst, midiFreq(e.midi), t, e.steps * sd, e.vol, nb);
  else e.midis.forEach((m) => playNote(c, dest, e.inst, midiFreq(m), t, e.steps * sd, e.vol * 0.75, nb));
}
// plant het hele lied (volgens `order`) vanaf tijd t0; geeft de eindtijd terug
export function scheduleSong(c, dest, nb, song, order, t0) {
  const sd = stepDur(song.bpm), aud = audibleTracks(song); let i = 0;
  order.forEach((p) => {
    for (let s = 0; s < song.len; s++, i++) stepEvents(song, p, s, aud).forEach((e) => fireEvent(c, dest, nb, e, t0 + i * sd + swingOffset(s, song.swing, sd), sd));
  });
  return t0 + i * sd;
}
