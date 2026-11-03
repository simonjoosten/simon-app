// Ronde 4 (Creatief): "Verras me" (willekeurig lied), "Lied van de dag" en een mash-up van twee voorbeelden voor Muziek.
// Puur datamodel (geen DOM, geen audio), dus testbaar met node. Alles geeft een gewone, geldige song terug (sanitizeSong).
import * as M from './music-model.js?v=1';
import { INSTRUMENTS } from './music-synth.js?v=1';

export const dayNumber = (t = Date.now()) => Math.floor(t / 86400000);

const GROUPS = { mel: ['Toetsen', 'Synths', 'Bas', 'Snaren', 'Slagwerk-melodie', 'Blazers'], chord: ['Toetsen', 'Synths', 'Snaren', 'Blazers'] };
const pickInst = (kind, rng, cur) => {
  const list = INSTRUMENTS.filter((i) => GROUPS[kind].includes(i.group) && (kind === 'chord' || i.group !== 'Bas') && i.id !== cur);
  return list[Math.floor(rng() * list.length)].id;
};

// Een willekeurig lied: neem een voorbeeld, wissel instrumenten, toonsoort, tempo en laat de melodie een beetje verschuiven.
export function surpriseSong(seed = Date.now(), keys = M.PRESET_KEYS) {
  const rng = M.makeRng(seed >>> 0 || 1);
  const id = keys[Math.floor(rng() * keys.length)];
  const song = M.buildPreset(id); if (!song) return null;
  song.key = Math.floor(rng() * 12);
  const scales = ['majeur', 'mineur', 'pentatonisch', 'dorisch', 'mixolydisch', 'lydisch', 'frygisch', 'japans'];
  if (rng() < 0.6) song.scale = scales[Math.floor(rng() * scales.length)];
  song.bpm = Math.max(60, Math.min(180, Math.round(song.bpm * (0.85 + rng() * 0.3))));
  song.swing = Math.round(rng() * 4) * 10;
  song.tracks.forEach((t) => {
    if (t.kind === 'drums') return;
    if (t.inst === 'bas' || t.inst === 'acid') return;
    if (rng() < 0.7) t.inst = pickInst(t.kind, rng, t.inst);
  });
  song.fx = { rev: Math.round(rng() * 4) / 10, echo: rng() < 0.4 ? 0.3 : 0, filter: 1 };
  return { song: M.sanitizeSong(song), preset: id };
}

// Lied van de dag: voor iedereen op dezelfde dag hetzelfde (en elke dag anders).
export const dailySong = (day = dayNumber()) => surpriseSong(day * 7919 + 17);

// Mash-up: drums van voorbeeld A, melodieën/akkoorden van voorbeeld B. Tempo ligt tussen de twee in.
export function mashup(a, b) {
  const A = M.buildPreset(a), B = M.buildPreset(b); if (!A || !B) return null;
  const out = M.cloneSong(B);
  const dr = A.tracks.findIndex((t) => t.kind === 'drums'), dB = out.tracks.findIndex((t) => t.kind === 'drums');
  if (dr >= 0) {
    if (dB >= 0) { out.tracks[dB] = { ...A.tracks[dr], id: out.tracks[dB].id }; for (let p = 0; p < M.PAT_COUNT; p++) out.pats[p][dB] = A.pats[p][dr].map((r) => r.slice()); }
    else if (out.tracks.length < M.MAX_TRACKS) { out.tracks.unshift({ ...A.tracks[dr], id: 'tm' }); for (let p = 0; p < M.PAT_COUNT; p++) out.pats[p].unshift(A.pats[p][dr].map((r) => r.slice())); }
  }
  out.bpm = Math.round((A.bpm + B.bpm) / 2); out.swing = Math.round((A.swing + B.swing) / 2);
  return M.sanitizeSong(out);
}

// Loops: een korte "bouwsteen" die je op de huidige melodie/drumspoor legt (alleen patroon A, stappen 0-15).
export const LOOPS = [
  { id: 'vierop', name: 'Vier op de vloer', kind: 'drums', rows: { kick: 'x...x...x...x...', hat: '..x...x...x...x.' } },
  { id: 'boem-tsj', name: 'Boem-tsj', kind: 'drums', rows: { kick: 'x.......x.......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' } },
  { id: 'halftime', name: 'Halve tijd', kind: 'drums', rows: { kick: 'x...............', snare: '........x.......', hat: 'x.x.x.x.x.x.x.x.' } },
  { id: 'breakbeat', name: 'Breakbeat', kind: 'drums', rows: { kick: 'x.....x...x.....', snare: '....x..x....x...', hat: 'x.x.x.x.x.x.x.xx' } },
  { id: 'latin', name: 'Latijns', kind: 'drums', rows: { kick: 'x..x..x...x.x...', rim: '..x..x..x..x..x.', hat: 'x.x.x.x.x.x.x.x.' } },
  { id: 'omhoog', name: 'Trap omhoog', kind: 'mel', rows: { 7: 'x...............', 6: '..x.............', 5: '....x...........', 4: '......x.........', 3: '........x.......', 2: '..........x.....', 1: '............x...', 0: '..............x.' } },
  { id: 'omlaag', name: 'Trap omlaag', kind: 'mel', rows: { 0: 'x...............', 1: '..x.............', 2: '....x...........', 3: '......x.........', 4: '........x.......', 5: '..........x.....', 6: '............x...', 7: '..............x.' } },
  { id: 'pendel', name: 'Heen en weer', kind: 'mel', rows: { 7: 'x...x...x...x...', 4: '..x...x...x...x.' } },
  { id: 'bas-pomp', name: 'Pompende bas', kind: 'mel', rows: { 7: 'x.x.x.x.x.x.x.x.' } },
  { id: 'akkoorden-4', name: 'Vier akkoorden', kind: 'chord', rows: { 0: 'xxxx............', 3: '....xxxx........', 4: '........xxxx....', 5: '............xxxx' } },
];
export const LOOP_BY_ID = Object.fromEntries(LOOPS.map((l) => [l.id, l]));

// Zet een loop op een spoor (index) van patroon `p`. Geeft true als het gelukt is.
export function applyLoop(song, loopId, trackIdx, p = 0) {
  const L = LOOP_BY_ID[loopId], t = song.tracks[trackIdx]; if (!L || !t || t.kind !== L.kind) return false;
  const rows = song.pats[p][trackIdx];
  Object.entries(L.rows).forEach(([key, str]) => {
    const r = L.kind === 'drums' ? t.kit.indexOf(key) : +key; if (r < 0 || !rows[r]) return;
    for (let i = 0; i < 16; i++) rows[r][i] = str[i] === 'x';
  });
  return true;
}
// Welke sporen passen bij een loop?
export const loopTargets = (song, loopId) => { const L = LOOP_BY_ID[loopId]; return L ? song.tracks.map((t, i) => (t.kind === L.kind ? i : -1)).filter((i) => i >= 0) : []; };
