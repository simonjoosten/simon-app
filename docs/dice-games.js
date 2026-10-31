// Dobbel & kies: logica van de spellen en hulpjes (zonder DOM; getest in tools/test-dice.mjs).
// Alle functies die willekeur nodig hebben nemen `rand(n)` (geeft 0..n-1); standaard is dat een eerlijke crypto-worp.

export const rand = (n) => { const a = new Uint32Array(1); const lim = Math.floor(0x100000000 / n) * n; do { globalThis.crypto.getRandomValues(a); } while (a[0] >= lim); return a[0] % n; };
export function shuffle(arr, r = rand) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = r(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function makeTeams(names, n, r = rand) {
  const list = shuffle(names.map((x) => String(x).trim()).filter(Boolean), r), k = Math.max(1, Math.min(n | 0 || 2, list.length || 1)), teams = Array.from({ length: k }, () => []);
  list.forEach((nm, i) => teams[i % k].push(nm)); return teams;
}
export function randomInts(min, max, count, unique, r = rand) {
  min = Math.round(+min); max = Math.round(+max); if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (min > max) [min, max] = [max, min]; const span = max - min + 1; count = Math.max(1, Math.min(100, count | 0 || 1));
  if (unique) { if (count > span) count = span; const pool = Array.from({ length: Math.min(span, 5000) }, (_, i) => min + i); if (span > 5000) { const s = new Set(); while (s.size < count) s.add(min + r(span)); return [...s]; } return shuffle(pool, r).slice(0, count); }
  return Array.from({ length: count }, () => min + r(span));
}

// ---- werpen ----
export const SIDES = [4, 6, 8, 10, 12, 20, 100];
export function rollOne(sides, r = rand) { return 1 + r(sides); }
// pool = { sides, count, mod, adv: 'geen'|'voordeel'|'nadeel' }; adv geldt alleen bij 1 steen
export function rollPool(pool, r = rand) {
  const sides = SIDES.includes(pool.sides) ? pool.sides : 6, count = Math.max(1, Math.min(6, pool.count | 0 || 1)), mod = Math.max(-99, Math.min(99, pool.mod | 0));
  let vals = Array.from({ length: count }, () => rollOne(sides, r)), kept = vals.slice(), alt = null;
  if (count === 1 && (pool.adv === 'voordeel' || pool.adv === 'nadeel')) { alt = rollOne(sides, r); vals = [vals[0], alt]; kept = [pool.adv === 'voordeel' ? Math.max(vals[0], alt) : Math.min(vals[0], alt)]; }
  const sum = kept.reduce((a, b) => a + b, 0);
  return { sides, vals, kept, mod, total: sum + mod, crit: sides === 20 && kept.length === 1 ? (kept[0] === 20 ? 'nat20' : kept[0] === 1 ? 'nat1' : null) : null };
}
export function rollStats(history, sides) {
  const faces = sides === 100 ? 10 : sides, counts = new Array(faces).fill(0); let n = 0, sum = 0;
  history.forEach((h) => { if (h.s !== sides) return; h.k.forEach((v) => { n++; sum += v; const i = sides === 100 ? Math.min(9, Math.floor((v - 1) / 10)) : v - 1; if (counts[i] != null) counts[i]++; }); });
  return { counts, n, avg: n ? sum / n : 0, max: Math.max(1, ...counts) };
}
export function cleanHistory(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, 100).filter((h) => h && SIDES.includes(h.s) && Array.isArray(h.k) && h.k.every((v) => Number.isInteger(v) && v >= 1 && v <= h.s)).map((h) => ({ s: h.s, k: h.k.slice(0, 6), m: h.m | 0, t: +h.t || 0 }));
}

// ---- Yathzee ----
export const CATS = [
  { id: '1', name: 'Enen', face: 1, upper: true }, { id: '2', name: 'Tweeën', face: 2, upper: true }, { id: '3', name: 'Drieën', face: 3, upper: true },
  { id: '4', name: 'Vieren', face: 4, upper: true }, { id: '5', name: 'Vijven', face: 5, upper: true }, { id: '6', name: 'Zessen', face: 6, upper: true },
  { id: '3k', name: 'Drie gelijk', hint: 'Som van alle ogen' }, { id: '4k', name: 'Vier gelijk', hint: 'Som van alle ogen' }, { id: 'fh', name: 'Full house', hint: '25 punten' },
  { id: 'ks', name: 'Kleine straat', hint: '30 punten (4 achter elkaar)' }, { id: 'gs', name: 'Grote straat', hint: '40 punten (5 achter elkaar)' },
  { id: 'yz', name: 'Yathzee!', hint: '50 punten (5 gelijk)' }, { id: 'ch', name: 'Kans', hint: 'Som van alle ogen' },
];
export const UPPER_BONUS_AT = 63, UPPER_BONUS = 35;
const counts = (d) => { const c = [0, 0, 0, 0, 0, 0, 0]; d.forEach((v) => c[v]++); return c; };
const sumd = (d) => d.reduce((a, b) => a + b, 0);
const hasRun = (d, n) => { const s = new Set(d); for (let a = 1; a + n - 1 <= 6; a++) { let ok = true; for (let k = 0; k < n; k++) if (!s.has(a + k)) ok = false; if (ok) return true; } return false; };
export function scoreCat(id, dice) {
  const c = counts(dice), mx = Math.max(...c);
  const cat = CATS.find((x) => x.id === id); if (!cat) return 0;
  if (cat.upper) return c[cat.face] * cat.face;
  switch (id) {
    case '3k': return mx >= 3 ? sumd(dice) : 0;
    case '4k': return mx >= 4 ? sumd(dice) : 0;
    case 'fh': return (c.includes(3) && c.includes(2)) || mx === 5 ? 25 : 0;
    case 'ks': return hasRun(dice, 4) ? 30 : 0;
    case 'gs': return hasRun(dice, 5) ? 40 : 0;
    case 'yz': return mx === 5 ? 50 : 0;
    default: return sumd(dice);
  }
}
export const newSheet = () => Object.fromEntries(CATS.map((c) => [c.id, null]));
export const upperSum = (sh) => CATS.filter((c) => c.upper).reduce((a, c) => a + (sh[c.id] || 0), 0);
export const bonusOf = (sh) => (upperSum(sh) >= UPPER_BONUS_AT ? UPPER_BONUS : 0);
export const sheetTotal = (sh) => CATS.reduce((a, c) => a + (sh[c.id] || 0), 0) + bonusOf(sh);
export const freeCats = (sh) => CATS.filter((c) => sh[c.id] == null).map((c) => c.id);
export const potentials = (sh, dice) => Object.fromEntries(freeCats(sh).map((id) => [id, scoreCat(id, dice)]));

export function newY(players) {
  return { players: players.map((p) => ({ name: p.name, ai: !!p.ai, sheet: newSheet() })), turn: 0, rolls: 0, dice: [1, 1, 1, 1, 1], held: [false, false, false, false, false], done: false, round: 1 };
}
export function yRoll(g, r = rand) {
  if (g.done || g.rolls >= 3) return false;
  g.dice = g.dice.map((v, i) => (g.held[i] && g.rolls > 0 ? v : rollOne(6, r))); g.rolls++; return true;
}
export function yToggle(g, i) { if (g.rolls === 0 || g.rolls >= 3 || g.done) return false; g.held[i] = !g.held[i]; return true; }
export function yScore(g, id) {
  const p = g.players[g.turn]; if (g.done || g.rolls === 0 || p.sheet[id] !== null || !(id in p.sheet)) return false;
  p.sheet[id] = scoreCat(id, g.dice);
  g.held = [false, false, false, false, false]; g.rolls = 0;
  g.turn = (g.turn + 1) % g.players.length; if (g.turn === 0) g.round++;
  if (g.players.every((q) => freeCats(q.sheet).length === 0)) g.done = true;
  return true;
}
export function yWinner(g) { const t = g.players.map((p) => sheetTotal(p.sheet)), m = Math.max(...t); return { totals: t, winners: t.map((v, i) => (v === m ? i : -1)).filter((i) => i >= 0) }; }
// computer
export function aiHold(dice, sheet) {
  const c = counts(dice), held = [false, false, false, false, false], free = new Set(freeCats(sheet));
  let bestV = 1; for (let v = 1; v <= 6; v++) if (c[v] >= c[bestV]) bestV = v;
  const keepVal = (val) => { dice.forEach((v, i) => { held[i] = v === val; }); return held; };
  if (c[bestV] >= 3) return keepVal(bestV);
  if ((free.has('ks') || free.has('gs')) && hasRun(dice, 3)) {
    for (let a = 1; a <= 4; a++) if ([a, a + 1, a + 2].every((x) => dice.includes(x))) { const used = new Set(); dice.forEach((v, i) => { if (v >= a && v <= a + 3 && !used.has(v)) { used.add(v); held[i] = true; } }); return held; }
  }
  if (c[bestV] === 2) return keepVal(bestV);
  dice.forEach((v, i) => { held[i] = v >= 5; });
  if (!held.some(Boolean)) held[dice.indexOf(Math.max(...dice))] = true;
  return held;
}
const PAR = { '3k': 20, '4k': 18, fh: 18, ks: 22, gs: 20, yz: 12, ch: 22 };
export function aiPick(dice, sheet) {
  let best = null, bv = -Infinity;
  freeCats(sheet).forEach((id) => {
    const cat = CATS.find((x) => x.id === id), s = scoreCat(id, dice), par = cat.upper ? cat.face * 3 : PAR[id], v = s - par + (s === 0 ? -8 : 0) + (s > 0 && !cat.upper ? 4 : 0);
    if (v > bv) { bv = v; best = id; }
  });
  return best;
}

// ---- Slangen en ladders (10x10) ----
export const SNAKES = { 98: 79, 95: 75, 93: 73, 87: 36, 64: 60, 62: 19, 56: 53, 49: 11, 47: 26, 16: 6 };
export const LADDERS = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };
export function cellRC(n) { const i = n - 1, row = Math.floor(i / 10), k = i % 10; return { row, col: row % 2 === 0 ? k : 9 - k }; }   // row 0 = onderaan
export function moveSL(pos, roll) {
  const path = []; let p = pos, dir = 1;
  for (let s = 0; s < roll; s++) { if (p + dir > 100) dir = -1; p += dir; path.push(p); }
  let jump = null; if (LADDERS[p]) { jump = { kind: 'ladder', from: p, to: LADDERS[p] }; p = LADDERS[p]; } else if (SNAKES[p]) { jump = { kind: 'slang', from: p, to: SNAKES[p] }; p = SNAKES[p]; }
  return { path, to: p, jump, won: p === 100 };
}

// ---- Boter-kaas-en-eieren ----
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
export function ttResult(b) {
  for (const l of LINES) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]]) return { winner: b[l[0]], line: l };
  return b.every(Boolean) ? { winner: null, line: null, draw: true } : null;
}
function minimax(b, me, turn, depth) {
  const r = ttResult(b); if (r) return r.winner === me ? 10 - depth : r.winner ? depth - 10 : 0;
  const other = me === 'X' ? 'O' : 'X'; let best = turn === me ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) if (!b[i]) { b[i] = turn; const v = minimax(b, me, turn === me ? other : me, depth + 1); b[i] = null; best = turn === me ? Math.max(best, v) : Math.min(best, v); }
  return best;
}
// level 0 = willekeurig, 1 = wint/blokkeert, 2 = perfect
export function ttMove(board, me, level = 2, r = rand) {
  const empty = board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0); if (!empty.length) return -1;
  const other = me === 'X' ? 'O' : 'X';
  if (level === 0) return empty[r(empty.length)];
  const tryWin = (who) => { for (const i of empty) { const b = board.slice(); b[i] = who; if (ttResult(b) && ttResult(b).winner === who) return i; } return -1; };
  if (level === 1) { let m = tryWin(me); if (m < 0) m = tryWin(other); if (m < 0 && !board[4]) m = 4; return m >= 0 ? m : empty[r(empty.length)]; }
  let best = -Infinity, moves = [];
  for (const i of empty) { const b = board.slice(); b[i] = me; const v = minimax(b, me, other, 1); if (v > best) { best = v; moves = [i]; } else if (v === best) moves.push(i); }
  return moves[r(moves.length)];
}

// ---- Varkentje (Pig) ----
export const PIG_TARGET = 100;
export function pigAiHold(turn, score, opp) {
  if (score + turn >= PIG_TARGET) return true;
  const limit = opp >= 75 ? 30 : score >= 80 ? 15 : 20;
  return turn >= limit;
}

// ---- Draaiwiel ----
// De wijzer staat bovenaan (-90 graden). index van het segment onder de wijzer als het wiel `angle` radialen gedraaid is.
export function wheelIndex(angle, n) {
  const T = Math.PI * 2, seg = T / n; let a = (-Math.PI / 2 - angle) % T; if (a < 0) a += T;
  return Math.min(n - 1, Math.floor(a / seg + 1e-9));
}
// hoek waarbij segment `i` onder de wijzer valt (frac 0..1 = plek binnen het segment), minstens `extra` rondjes verder dan `from`
export function wheelTarget(from, i, n, frac = 0.5, extra = 5) {
  const T = Math.PI * 2, seg = T / n; let target = -Math.PI / 2 - (i + frac) * seg;
  target += Math.ceil((from - target) / T) * T + extra * T; return target;
}
export const EIGHTBALL = ['Ja, zeker!', 'Zonder twijfel.', 'Het ziet er goed uit.', 'Je kunt erop rekenen.', 'Waarschijnlijk wel.', 'Ja.', 'Probeer het later nog eens.', 'Ik weet het nog niet, vraag het straks.', 'Daar zeg ik nu liever niets over.', 'Concentreer je en vraag opnieuw.', 'Ik zou er niet op rekenen.', 'Mijn bronnen zeggen nee.', 'Nee.', 'Het ziet er niet goed uit.', 'Heel twijfelachtig.', 'Absoluut niet!'];
export const WHEEL_PRESETS = {
  'Wat eten we?': ['Pizza', 'Pannenkoeken', 'Friet', 'Pasta', 'Sushi', 'Soep', 'Wraps', 'Rijst met kip'],
  'Wie begint?': ['Speler 1', 'Speler 2', 'Speler 3', 'Speler 4'],
  'Ja of nee': ['Ja!', 'Nee', 'Misschien', 'Vraag het later'],
  'Opdracht': ['Maak een dansje', 'Zing een liedje', 'Doe een dier na', 'Vertel een mop', '10 keer springen', 'Trek een gek gezicht'],
  'Spelletje': ['Verstoppertje', 'Memory', 'Kaarten', 'Bordspel', 'Tekenen', 'Buiten spelen'],
};
