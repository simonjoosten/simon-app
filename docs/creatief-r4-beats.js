// Ronde 4 (Creatief): 14 extra voorbeeld-liedjes/loops voor Muziek, in dezelfde vorm als PRESETS in music-model.js.
// tr: [soort, instrument, octaaf, rijen]; drums mogen een eigen `kit` hebben (8 geluiden, rij voor rij).
// Rijen zijn strings van 'x' (aan) en '.' (uit); lege rijen mogen weggelaten worden. Drum-rijen volgen de kit; melodie: rij 7 = grondtoon, rij 0 = hoogste; akkoorden: rij = trap van de toonladder (0 = I).

const MAXSTEPS = 32, KIT_ROWS = 8, MEL_ROWS = 8, CHORD_ROWS = 7;

const bits = (s) => { const r = new Array(MAXSTEPS).fill(false); for (let i = 0; i < s.length && i < MAXSTEPS; i++) r[i] = s[i] === 'x'; return r; };
const D = (rows) => Array.from({ length: KIT_ROWS }, (_, i) => bits(rows[i] || ''));
const M = (rows) => Array.from({ length: MEL_ROWS }, (_, i) => bits(rows[i] || ''));
const C = (rows) => Array.from({ length: CHORD_ROWS }, (_, i) => bits(rows[i] || ''));

const DEFAULT_KIT = ['kick', 'snare', 'hat', 'open', 'clap', 'tom', 'rim', 'cowbell'];

export const R4_PRESETS = {
  trap: { label: 'Trap', icon: 'bomb', bpm: 140, swing: 0, key: 5, scale: 'mineur', tr: [
    ['drums', null, 0, D(['x.......x.x.....', '........x.......', 'x.x.x.xxx.x.xxxx', '..............x.', '........x.......'])],
    ['mel', 'bas', -2, M(['', '', '', '', '', '', '', 'x.......x.x.....'])],
    ['mel', 'bel', 1, M(['', 'x.......', '....x...', '', '..x...x.', '', '', ''])]] },
  dnb: { label: 'Drum & bass', icon: 'rocket', bpm: 170, swing: 0, key: 4, scale: 'mineur', tr: [
    ['drums', null, 0, D(['x.........x.....', '....x.......x...', 'x.x.x.x.x.x.x.x.', '', '', '', '...x......x..x..'])],
    ['mel', 'acid', -2, M(['', '', '', '', '', 'x.....x.....x...', '..x.....x.......', 'x..x..x..x..x.x.'])],
    ['chord', 'pad', 0, C(['xxxxxxxx........', '', '', '', '........xxxxxxxx', '', ''])]] },
  salsa: { label: 'Salsa', icon: 'sun', bpm: 100, swing: 0, key: 2, scale: 'mixolydisch', kit: ['kick', 'conga', 'bongo', 'tamb', 'wood', 'cowbell', 'shaker', 'tri'], tr: [
    ['drums', null, 0, D(['x.....x.x.....x.', '..x.x...x.x.x...', 'x..x..x...x.x...', '', 'x..x..x...x.x...', 'x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.x.x.'])],
    ['mel', 'bas', -2, M(['', '', '', '', '', '', 'x.....x.', 'x..x..x...x.x...'])],
    ['chord', 'koper', 0, C(['x..x..x...x.x...', '', '', '', 'x...............', '', ''])]] },
  samba: { label: 'Samba', icon: 'star', bpm: 104, swing: 5, key: 7, scale: 'majeur', kit: ['boem', 'bongo', 'shaker', 'tamb', 'snap', 'conga', 'tom', 'tri'], tr: [
    ['drums', null, 0, D(['x..x..x.x..x..x.', 'x.x..x.x..x.x...', 'x.x.x.x.x.x.x.x.', 'x...x...x...x...', '', '', '', '..x...x...x...x.'])],
    ['mel', 'gitaar', 0, M(['', '', '', 'x.x.x.x.x.x.x.x.', '', 'x..x..x.x..x..x.', '', ''])],
    ['mel', 'bas', -2, M(['', '', '', '', '', '', '', 'x..x..x.x..x..x.'])]] },
  jazz: { label: 'Jazz-café', icon: 'microphone', bpm: 120, swing: 55, key: 3, scale: 'dorisch', tr: [
    ['drums', null, 0, D(['x.......x.......', '..........x.....', 'x..xx..xx..xx..x', '', '', '', ''])],
    ['chord', 'epiano', 0, C(['', '..x.....x.......', '', '........x...x...', '', 'x.......', ''])],
    ['mel', 'sax', 0, M(['', '', 'x...........x...', '..x.....x.x.....', '', '', '', ''])],
    ['mel', 'bas', -2, M(['', '', '', '', '', 'x...x...x...x...', '', 'x.x.x.x.x.x.x.x.'])]] },
  ballad: { label: 'Zachte ballade', icon: 'heart', bpm: 68, swing: 0, key: 7, scale: 'majeur', tr: [
    ['drums', null, 0, D(['x...............', '........x.......', '..x...x...x...x.'])],
    ['chord', 'strijkers', 0, C(['xxxxxxxx........', '', '', '', '........xxxxxxxx', 'xxxxxxxx........', ''])],
    ['mel', 'piano', 0, M(['', 'x...........x...', '..x.....x.......', '', 'x.......', '', '', ''])]] },
  circus: { label: 'Circus', icon: 'carousel', bpm: 132, swing: 0, key: 5, scale: 'majeur', tr: [
    ['drums', null, 0, D(['x...x...x...x...', '..x...x...x...x.', '', '', '', 'x.....x.x.....x.'])],
    ['mel', 'accordeon', 0, M(['x.x.x.x.........', '..x..x.x.x.x.x..', '', 'x...x...x...x...', '', '', '', ''])],
    ['mel', 'koper', -2, M(['', '', '', '', '', '', 'x.x.x.x.x.x.x.x.', 'x...x...x...x...'])]] },
  spookhuis: { label: 'Spookhuis', icon: 'ghost', bpm: 84, swing: 0, key: 9, scale: 'harmmineur', tr: [
    ['drums', null, 0, D(['x.......x.......', '', '', '', '', 'x...x...........', '......x.....x...'])],
    ['mel', 'vibrafoon', 1, M(['', 'x.......', '..x...x.', '', 'x.......x.x.....', '', '', ''])],
    ['chord', 'pad', -1, C(['xxxxxxxxxxxxxxxx', '', '', '', '', '', ''])]] },
  kerst: { label: 'Kerstfeest', icon: 'snowflake', bpm: 112, swing: 0, key: 0, scale: 'majeur', tr: [
    ['drums', null, 0, D(['x.......x.......', '....x.......x...', 'x.x.x.x.x.x.x.x.'])],
    ['mel', 'bel', 1, M(['x.x.x.x.x.x.x.x.', '', 'x...x...x...x...', '', '', '', '', ''])],
    ['chord', 'orgel', 0, C(['xxxxxxxx........', '', '', 'xxxxxxxx........', '........xxxxxxxx', '', ''])]] },
  ruimte: { label: 'Ruimtereis', icon: 'planet', bpm: 96, swing: 0, key: 2, scale: 'heletoon', tr: [
    ['drums', null, 0, D(['x...............', '', '..x...x...x...x.', '', '', 'x.......x.......', ''])],
    ['mel', 'laser', 0, M(['', 'x.....x...x.....', '..x.....x.....x.', '', 'x.......', '', '', ''])],
    ['chord', 'pad', 0, C(['xxxxxxxx........', '', '', '', '........xxxxxxxx', '', ''])]] },
  calypso: { label: 'Strand-feest', icon: 'palm', bpm: 108, swing: 10, key: 4, scale: 'majeur', kit: ['kick', 'snare', 'shaker', 'wood', 'tamb', 'conga', 'bongo', 'tri'], tr: [
    ['drums', null, 0, D(['x.....x.x.....x.', '....x.......x...', 'x.x.x.x.x.x.x.x.', '..x..x..x..x..x.', '', '', '', ''])],
    ['mel', 'steeldrum', 0, M(['', 'x..x..x.x..x....', '..x..x..', '', 'x.......x..x.x..', '', '', ''])],
    ['mel', 'bas', -2, M(['', '', '', '', '', '', '', 'x..x..x.x..x..x.'])]] },
  cowboy: { label: 'Cowboy', icon: 'horse', bpm: 126, swing: 0, key: 7, scale: 'pentatonisch', tr: [
    ['drums', null, 0, D(['x.......x.......', '....x.......x...', '', '', '', '', 'x.x.x.x.x.x.x.x.'])],
    ['mel', 'banjo', 0, M(['', 'x.x.x.x.x.x.x.x.', '', 'x...x...x...x...', '', 'x.......', '', ''])],
    ['mel', 'bas', -2, M(['', '', '', '', '', '', '', 'x...x...x...x...'])]] },
  speeltuin: { label: 'Speeltuin', icon: 'balloon', bpm: 118, swing: 0, key: 0, scale: 'pentatonisch', tr: [
    ['drums', null, 0, D(['x.....x.x.....x.', '....x.......x...', 'x.x.x.x.x.x.x.x.', '', 'x...............'])],
    ['mel', 'xylofoon', 1, M(['x.x...x.x.x...x.', '..x.x.....x.x...', 'x...x...x...x...', '', '', '', '', ''])],
    ['mel', 'kalimba', 0, M(['', '', '', 'x...x...x...x...', '', 'x.......x.......', '', 'x.......'])]] },
  ninja: { label: 'Ninja-training', icon: 'sword', bpm: 150, swing: 0, key: 9, scale: 'japans', tr: [
    ['drums', null, 0, D(['x.....x.x.....x.', '........x.......', 'x.x.x.x.x.x.x.x.', '', '', 'x...x...x...x.xx', ''])],
    ['mel', 'dudelzak', 0, M(['', '', 'x...........x...', '..x.x...x.x.....', '', 'x.......x.......', '', ''])],
    ['mel', 'pizzicato', -1, M(['', '', '', '', '', '', 'x.x.x.x.x.x.x.x.', 'x.......x.......'])]] },
};
export const R4_KIT_OF = (id) => (R4_PRESETS[id] && R4_PRESETS[id].kit) || DEFAULT_KIT;
