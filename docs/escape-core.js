// Escape Room: zuivere logica (geen DOM). Kamer opbouwen uit een seed, puzzels controleren, hints, sterren, opslag, prijzen, dagelijkse mini-kamer.
import { ROOMS, ROOM_BY_ID, NL, GENERIC_CLUE, DECOYS } from './escape-rooms.js?v=1';

export { ROOMS, ROOM_BY_ID, NL };

/* ---------- hulpjes ---------- */
export function hash(str) { let h = 2166136261; str = String(str); for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rng(seed) {
  let a = (seed | 0) ^ 0x9e3779b9;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const ri = (R, n) => Math.floor(R() * n);
export function shuffle(arr, R) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = ri(R, i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export const nl = (icon) => NL[icon] || icon;
export const fmt = (sec) => { sec = Math.max(0, Math.floor(sec)); return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); };
const NUM = ['nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf', 'dertien', 'veertien', 'vijftien', 'zestien', 'zeventien', 'achttien', 'negentien'];
const ORD = ['eerste', 'tweede', 'derde', 'vierde'];
const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/* ---------- moeilijkheden en puzzelsoorten ---------- */
export const DIFFS = [
  { id: 'makkelijk', name: 'Makkelijk', icon: 'clover', puzzles: 3, codeLen: 3, hints: 3, par: 420, limit: 0, scramble: 12, orderN: 3, clueLevel: 0, decoys: 0, presses: 3, seq: 0, desc: '3 puzzels, veel hints, geen tijdsdruk' },
  { id: 'gemiddeld', name: 'Gemiddeld', icon: 'star', puzzles: 4, codeLen: 3, hints: 2, par: 540, limit: 0, scramble: 40, orderN: 4, clueLevel: 1, decoys: 1, presses: 5, seq: 1, desc: '4 puzzels, raadselachtige tips' },
  { id: 'moeilijk', name: 'Moeilijk', icon: 'flame', puzzles: 5, codeLen: 4, hints: 1, par: 660, limit: 0, scramble: 90, orderN: 5, clueLevel: 2, decoys: 2, presses: 7, seq: 2, desc: '5 puzzels, 4-cijferige codes' },
  { id: 'expert', name: 'Expert', icon: 'dragon', puzzles: 5, codeLen: 4, hints: 0, par: 600, limit: 1200, scramble: 140, orderN: 6, clueLevel: 3, decoys: 3, presses: 9, seq: 3, desc: '5 zware puzzels, geen hints en de klok loopt af' },
];
export const DIFF_DAILY = { id: 'dagelijks', name: 'Dagelijks', icon: 'hourglass', puzzles: 2, codeLen: 3, hints: 2, par: 180, limit: 0, scramble: 30, orderN: 4, clueLevel: 1, decoys: 1, presses: 4, seq: 1, desc: 'Elke dag een nieuwe mini-kamer' };
export const DIFF_BY_ID = Object.fromEntries([...DIFFS, DIFF_DAILY].map((d) => [d.id, d]));
export const TYPES = {
  code: { name: 'Codeslot', station: 'lock', label: 'Codeslot' },
  order: { name: 'Volgorde', station: 'bell', label: 'Bellen' },
  combine: { name: 'Combineren', station: 'chest', label: 'Gesloten kist' },
  slide: { name: 'Schuifpuzzel', station: 'puzzle', label: 'Schuifpaneel' },
  pattern: { name: 'Patroon', station: 'lightbulb', label: 'Raadselsteen' },
  lights: { name: 'Lampjes', station: 'bolt', label: 'Lampenpaneel' },
};
export const DAILY_EXTRA = ['order', 'slide', 'pattern', 'lights', 'combine'];

/* ---------- schuifpuzzel (3x3) ---------- */
export const slideDone = (t) => t.length === 9 && t.every((v, i) => (i < 8 ? v === i + 1 : v === 0));
export function slideMove(t, idx) {
  const b = t.indexOf(0), r = Math.floor(idx / 3), c = idx % 3, rb = Math.floor(b / 3), cb = b % 3;
  if (idx === b || Math.abs(r - rb) + Math.abs(c - cb) !== 1) return null;
  const n = t.slice(); n[b] = n[idx]; n[idx] = 0; return n;
}
export function slideScramble(R, steps) {
  let t = [1, 2, 3, 4, 5, 6, 7, 8, 0], prev = -1;
  for (let k = 0; k < steps || slideDone(t); k++) {
    const b = t.indexOf(0), opts = [];
    for (const d of [-3, 3, -1, 1]) { const n = b + d; if (n < 0 || n > 8 || n === prev) continue; if ((d === -1 && b % 3 === 0) || (d === 1 && b % 3 === 2)) continue; opts.push(n); }
    const pick = opts[ri(R, opts.length)]; prev = b; t = slideMove(t, pick);
  }
  return t;
}
const manh = (t) => { let s = 0; for (let i = 0; i < 9; i++) { const v = t[i]; if (v) { const g = v - 1; s += Math.abs(Math.floor(i / 3) - Math.floor(g / 3)) + Math.abs((i % 3) - (g % 3)); } } return s; };
// IDA*: geeft de positie (index) van de tegel die je nu moet schuiven, of null.
export function slideHint(tiles) {
  if (slideDone(tiles)) return null;
  const t = tiles.slice(); let nodes = 0; const path = [];
  const NB = [[1, 3], [0, 2, 4], [1, 5], [0, 4, 6], [1, 3, 5, 7], [2, 4, 8], [3, 7], [4, 6, 8], [5, 7]];
  function search(g, bound, b, prev) {
    const h = manh(t), f = g + h;
    if (f > bound) return f;
    if (h === 0) return -1;
    if (++nodes > 300000) return Infinity;
    let min = Infinity;
    for (const n of NB[b]) {
      if (n === prev) continue;
      [t[b], t[n]] = [t[n], t[b]]; path.push(n);
      const r = search(g + 1, bound, n, b);
      if (r === -1) return -1;
      [t[b], t[n]] = [t[n], t[b]]; path.pop();
      if (r < min) min = r;
    }
    return min;
  }
  let bound = manh(t);
  for (let i = 0; i < 40 && bound < Infinity; i++) { const r = search(0, bound, t.indexOf(0), -1); if (r === -1) return path[0]; bound = r; }
  return null;
}

/* ---------- lampjes (3x3, een tik draait de buren mee) ---------- */
export function lightsPress(s, i) {
  const n = s.slice(), r = Math.floor(i / 3), c = i % 3;
  const flip = (rr, cc) => { if (rr >= 0 && rr < 3 && cc >= 0 && cc < 3) n[rr * 3 + cc] = !n[rr * 3 + cc]; };
  flip(r, c); flip(r - 1, c); flip(r + 1, c); flip(r, c - 1); flip(r, c + 1);
  return n;
}
export const lightsDone = (s) => s.length === 9 && s.every(Boolean);
export function lightsStart(R, k) {
  const cells = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8], R).slice(0, Math.max(1, Math.min(9, k))).sort((a, b) => a - b);
  let s = new Array(9).fill(true);
  for (const c of cells) s = lightsPress(s, c);
  return { start: s, presses: cells };
}
// Welke vakjes moet je nog indrukken? presses = oorspronkelijke oplossing, pressed = hoe vaak de speler elk vakje indrukte.
export function lightsNeeded(p, pressed) {
  const need = [];
  for (let i = 0; i < 9; i++) if ((p.presses.includes(i) ? 1 : 0) !== ((pressed[i] || 0) % 2)) need.push(i);
  return need;
}

/* ---------- patroon: wat komt er daarna? ---------- */
function genPattern(R, diff, pool) {
  const icons = shuffle(pool, R);
  const kinds = diff.seq === 0 ? ['cycle'] : diff.seq === 1 ? ['cycle', 'grow'] : ['cycle', 'grow', 'mirror'];
  const kind = kinds[ri(R, kinds.length)];
  let tokens, answer, rule;
  if (kind === 'cycle') {
    const per = [2, 3, 3, 4][diff.seq] || 3, base = icons.slice(0, per), len = per * 2 + 1;
    tokens = Array.from({ length: len }, (_, i) => ({ icon: base[i % per], n: 1 }));
    answer = { icon: base[len % per], n: 1 };
    rule = `Elke ${per} plaatjes begint de reeks opnieuw.`;
  } else if (kind === 'grow') {
    const step = diff.seq >= 2 ? 2 : 1, ic = icons[0], len = diff.seq >= 3 ? 5 : 4;
    tokens = Array.from({ length: len }, (_, i) => ({ icon: ic, n: step * (i + 1) }));
    answer = { icon: ic, n: step * (len + 1) };
    rule = `Elke keer komen er ${step} bij.`;
  } else {
    const per = diff.seq >= 3 ? 4 : 3, base = icons.slice(0, per), seqm = [...base, ...base.slice().reverse()];
    tokens = seqm.slice(0, seqm.length - 1).map((icon) => ({ icon, n: 1 }));
    answer = { icon: seqm[seqm.length - 1], n: 1 };
    rule = 'De reeks loopt heen en dan weer terug, als een spiegel.';
  }
  let options;
  if (kind === 'grow') {
    const set = new Set([answer.n]); let d = 1;
    while (set.size < 4) { for (const c of [answer.n - d, answer.n + d]) if (c > 0 && set.size < 4) set.add(c); d++; }
    options = [...set].map((n) => ({ icon: answer.icon, n }));
  } else {
    const others = icons.filter((i) => i !== answer.icon).slice(0, 3);
    options = [answer, ...others.map((icon) => ({ icon, n: 1 }))];
  }
  options = shuffle(options, R);
  const idx = options.findIndex((o) => o.icon === answer.icon && o.n === answer.n);
  return { kind, tokens, options, answer: idx, rule };
}

/* ---------- kamer opbouwen ---------- */
function digitClue(d, level, R) {
  if (level <= 0) return `het cijfer ${d}`;
  const kinds = level === 1 ? ['plus'] : level === 2 ? ['plus', 'min'] : ['plus', 'min', 'keer'];
  let k = kinds[ri(R, kinds.length)];
  if (k === 'keer') { const f = []; for (let a = 2; a <= 9; a++) if (d % a === 0 && d / a >= 1 && d / a <= 9) f.push(a); if (!f.length) k = 'plus'; else { const a = f[ri(R, f.length)]; return `${NUM[a]} keer ${NUM[d / a]}`; } }
  if (k === 'min') { const b = 1 + ri(R, 9); return `${NUM[d + b]} min ${NUM[b]}`; }
  const a = ri(R, d + 1); return `${NUM[a]} plus ${NUM[d - a]}`;
}

export function buildRun(roomId, diffId, seed, opts = {}) {
  const room = ROOM_BY_ID[roomId] || ROOMS[0], diff = DIFF_BY_ID[diffId] || DIFFS[0];
  const R = rng((seed >>> 0) ^ hash(room.id + diff.id));
  const plan = opts.plan || room.plan.slice(0, diff.puzzles);
  const stationIcons = new Set(plan.map((t) => TYPES[t].station));
  const taken = new Set([...stationIcons, room.recipe.a, room.recipe.b, room.recipe.r]);
  const decoyPick = plan.includes('combine') ? shuffle(DECOYS.filter((d) => !taken.has(d)), R).slice(0, diff.decoys) : [];
  decoyPick.forEach((d) => taken.add(d));
  const clueIcons = shuffle([...room.props, ...GENERIC_CLUE], R).filter((i, k, a) => a.indexOf(i) === k && !taken.has(i));
  const nextIcon = () => { const i = clueIcons.shift() || 'star'; taken.add(i); return i; };
  const puzzles = [], objects = [];
  plan.forEach((type, k) => {
    const pid = 'p' + k, p = { id: pid, type, sid: 's' + k };
    objects.push({ id: p.sid, kind: 'station', icon: TYPES[type].station, name: TYPES[type].label, pid });
    if (type === 'code') {
      const len = opts.codeLen || diff.codeLen;
      const digits = Array.from({ length: len }, () => ri(R, 10));
      p.answer = digits.join(''); p.len = len;
      digits.forEach((d, i) => {
        const ic = nextIcon(), note = `Cijfer ${i + 1} van het slot: ${digitClue(d, diff.clueLevel, R)}.`;
        objects.push({ id: `c${k}_${i}`, kind: 'clue', icon: ic, name: nl(ic), pid, note, text: `Onder de ${nl(ic)} ligt een briefje. ${note}` });
      });
    } else if (type === 'order') {
      const pool = room.props.filter((i) => !stationIcons.has(i));
      const items = shuffle(pool, R).slice(0, Math.min(diff.orderN, pool.length));
      p.solution = items; p.items = shuffle(items, R);
      if (eq(p.items, p.solution)) p.items.push(p.items.shift());
      let notes;
      if (diff.clueLevel === 0) notes = [`De goede volgorde, van links naar rechts: ${items.map(nl).join(', dan ')}.`];
      else {
        const st = shuffle(items.slice(0, -1).map((a, i) => `De ${nl(a)} staat vlak vóór de ${nl(items[i + 1])}.`), R);
        const half = Math.ceil(st.length / 2); notes = [st.slice(0, half).join(' '), st.slice(half).join(' ')].filter(Boolean);
      }
      notes.forEach((n, i) => {
        const ic = nextIcon(), note = `Volgorde-tip${notes.length > 1 ? ' ' + (i + 1) : ''}: ${n}`;
        objects.push({ id: `o${k}_${i}`, kind: 'clue', icon: ic, name: nl(ic), pid, note, text: `Achter de ${nl(ic)} zit een rolletje. ${note}` });
      });
    } else if (type === 'combine') {
      const rc = room.recipe; p.a = rc.a; p.b = rc.b; p.r = rc.r; p.msg = rc.msg;
      objects.push({ id: `i${k}a`, kind: 'item', icon: rc.a, name: nl(rc.a), pid, item: `${pid}a`, text: `Je pakt de ${nl(rc.a)} en stopt hem in je rugzak.` });
      objects.push({ id: `i${k}b`, kind: 'item', icon: rc.b, name: nl(rc.b), pid, item: `${pid}b`, text: `Je pakt de ${nl(rc.b)} en stopt hem in je rugzak.` });
      decoyPick.forEach((d, i) => { objects.push({ id: `d${k}_${i}`, kind: 'item', icon: d, name: nl(d), pid, item: `${pid}d${i}`, decoy: true, text: `Een ${nl(d)}. Misschien handig? Je pakt hem mee.` }); });
    } else if (type === 'slide') {
      p.start = slideScramble(R, diff.scramble);
    } else if (type === 'pattern') {
      Object.assign(p, genPattern(R, diff, room.props.filter((i) => !stationIcons.has(i))));
    } else if (type === 'lights') {
      Object.assign(p, lightsStart(R, diff.presses));
    }
    puzzles.push(p);
  });
  // rooster van 4 kolommen met een beetje wiebel
  const order = shuffle(objects, R), cols = 4, rows = Math.max(3, Math.ceil(order.length / cols));
  order.forEach((o, i) => {
    const c = i % cols, r = Math.floor(i / cols), rowCount = Math.min(cols, order.length - r * cols);
    const off = (cols - rowCount) / 2;
    o.x = Math.round(((c + off + 0.5) / cols) * 100 + (R() - 0.5) * 5);
    o.y = Math.round(((r + 0.5) / rows) * 100 + (R() - 0.5) * 6);
  });
  return { room: room.id, diff: diff.id, seed: seed >>> 0, daily: opts.daily || '', puzzles, objects, rows };
}

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function dailySpec(key) {
  const h = hash('escape-daily-' + key), R = rng(h);
  const room = ROOMS[h % ROOMS.length];
  return { key, room: room.id, seed: h, plan: ['code', DAILY_EXTRA[ri(R, DAILY_EXTRA.length)]] };
}
export const buildDaily = (key) => { const s = dailySpec(key); return buildRun(s.room, 'dagelijks', s.seed, { plan: s.plan, daily: key }); };

/* ---------- voortgang van een poging (st) ---------- */
export const newState = () => ({ t: 0, hints: 0, hl: {}, solved: [], found: [], inv: [] });
export const puzzleOf = (run, pid) => run.puzzles.find((p) => p.id === pid);
export const isSolved = (st, pid) => st.solved.includes(pid);
export const allSolved = (run, st) => run.puzzles.every((p) => st.solved.includes(p.id));
export function itemInfo(run, id) {
  for (const o of run.objects) if (o.item === id) return { id, icon: o.icon, name: o.name };
  const m = /^(p\d+)r$/.exec(id); const p = m && puzzleOf(run, m[1]);
  if (p) return { id, icon: p.r, name: nl(p.r) };
  return { id, icon: 'star', name: '?' };
}
export function tapObject(run, st, objId) {
  const o = run.objects.find((x) => x.id === objId);
  if (!o) return { kind: 'none' };
  if (o.kind === 'station') return { kind: 'station', pid: o.pid, solved: isSolved(st, o.pid) };
  const first = !st.found.includes(o.id);
  if (first) st.found.push(o.id);
  if (o.kind === 'item') { if (first && !st.inv.includes(o.item)) st.inv.push(o.item); return { kind: 'item', first, text: first ? o.text : `De ${o.name} heb je al.`, obj: o }; }
  return { kind: 'clue', first, text: o.text, obj: o };
}
export function notesOf(run, st) {
  return run.objects.filter((o) => o.kind === 'clue' && st.found.includes(o.id)).map((o) => ({ pid: o.pid, text: o.note, icon: o.icon })).sort((a, b) => (a.text < b.text ? -1 : 1));
}
export function combineItems(run, st, x, y) {
  for (const p of run.puzzles) {
    if (p.type !== 'combine' || isSolved(st, p.id)) continue;
    const ia = `${p.id}a`, ib = `${p.id}b`, ir = `${p.id}r`;
    if (((x === ia && y === ib) || (x === ib && y === ia)) && st.inv.includes(ia) && st.inv.includes(ib)) {
      st.inv = st.inv.filter((i) => i !== ia && i !== ib); st.inv.push(ir);
      return { ok: true, msg: p.msg, made: ir };
    }
  }
  return { ok: false, msg: 'Dat past niet bij elkaar. Probeer iets anders!' };
}
export function useItem(run, st, pid, itemId) {
  const p = puzzleOf(run, pid);
  if (!p || p.type !== 'combine' || !st.inv.includes(itemId)) return { ok: false, msg: 'Dat heb je niet.' };
  if (itemId === `${pid}r`) { st.inv = st.inv.filter((i) => i !== itemId); return { ok: true }; }
  return { ok: false, msg: 'Dat past niet in de kist. Misschien kun je eerst iets maken?' };
}
export function solvePuzzle(run, st, pid) {
  if (!st.solved.includes(pid)) st.solved.push(pid);
  const idx = run.puzzles.findIndex((p) => p.id === pid);
  return ROOM_BY_ID[run.room].rewards[idx % ROOM_BY_ID[run.room].rewards.length];
}
export const checkCode = (p, s) => p.type === 'code' && String(s) === p.answer;
export const checkOrder = (p, arr) => p.type === 'order' && eq(arr, p.solution);
export const checkPattern = (p, i) => p.type === 'pattern' && i === p.answer;

/* ---------- hints (3 niveaus, steeds duidelijker) ---------- */
export function hintText(run, st, p, lvl) {
  lvl = Math.max(0, Math.min(2, lvl | 0));
  const foundOf = (pre) => run.objects.filter((o) => o.pid === p.id && o.kind === 'clue' && st.found.includes(o.id)).length;
  if (p.type === 'code') {
    const need = p.len, have = foundOf();
    if (lvl === 0) return have < need ? `Zoek de briefjes onder de voorwerpen in de kamer. Je hebt er ${have} van de ${need}.` : 'Je hebt alle briefjes. Kijk in je notitieboekje en rekenen maar!';
    if (lvl === 1) return `Het eerste cijfer is ${p.answer[0]}.`;
    return `De code begint met ${p.answer.slice(0, p.len - 1)}. Alleen het laatste cijfer moet je zelf vinden.`;
  }
  if (p.type === 'order') {
    if (lvl === 0) return 'Zoek de rolletjes achter de voorwerpen. Daar staat in welke volgorde het moet.';
    if (lvl === 1) return `Helemaal vooraan komt de ${nl(p.solution[0])}.`;
    return `De eerste twee zijn: ${nl(p.solution[0])} en dan ${nl(p.solution[1])}.`;
  }
  if (p.type === 'combine') {
    if (lvl === 0) return 'Zoek twee voorwerpen die bij elkaar horen. Pak ze en kijk in je rugzak.';
    if (lvl === 1) return `Je hebt een ${nl(p.a)} en een ${nl(p.b)} nodig.`;
    return `Open je rugzak, kies de ${nl(p.a)} en de ${nl(p.b)} en druk op Combineer. Gebruik het resultaat bij de kist.`;
  }
  if (p.type === 'slide') return lvl === 0 ? 'Los eerst de bovenste rij op: 1, 2, 3.' : lvl === 1 ? 'Daarna de middelste rij: 4, 5, 6. De laatste rij gaat vanzelf.' : 'Tik op de gloeiende tegel: dat is een goede zet!';
  if (p.type === 'pattern') return lvl === 0 ? 'Kijk goed welk stukje zich steeds herhaalt.' : lvl === 1 ? p.rule : `Het antwoord is: ${p.options[p.answer].n > 1 ? p.options[p.answer].n + ' keer ' : ''}${nl(p.options[p.answer].icon)}.`;
  if (p.type === 'lights') return lvl === 0 ? 'Een tik draait het lampje zelf en zijn buren om. Je wilt dat alle lampjes aan zijn.' : lvl === 1 ? 'Je hoeft nooit twee keer op hetzelfde lampje te tikken.' : 'Tik op het gloeiende lampje: dat hoort bij de oplossing.';
  return '';
}

/* ---------- sterren en tijd ---------- */
export const diffOf = (run) => DIFF_BY_ID[run.diff] || DIFFS[0];
export function starsFor(run, st) {
  const d = diffOf(run);
  return 1 + (st.hints <= d.hints ? 1 : 0) + (st.t <= d.par ? 1 : 0);
}
export const timeLeft = (run, st) => { const d = diffOf(run); return d.limit ? Math.max(0, d.limit - st.t) : null; };
export const timedOut = (run, st) => { const d = diffOf(run); return !!d.limit && st.t >= d.limit; };

/* ---------- opslag ---------- */
export const defaults = () => ({ v: 1, rec: {}, plays: 0, solved: 0, hints: 0, noh: 0, fast: 0, rooms: [], daily: {}, dstreak: 0, dlast: '', dcount: 0, ach: [], cur: null, pt: {}, lastRoom: 'spook', lastDiff: 'makkelijk' });
export const recKey = (room, diff) => `${room}.${diff}`;
export const totalStars = (s) => Object.values(s.rec || {}).reduce((a, r) => a + ((r && r.s) || 0), 0);
export const bestStars = (s, room, diff) => ((s.rec || {})[recKey(room, diff)] || {}).s || 0;
export const roomStars = (s, room) => Math.max(0, ...DIFFS.map((d) => bestStars(s, room, d.id)));

export const ACH = [
  { id: 'first', name: 'Eerste ontsnapping', icon: 'key', desc: 'Ontsnap uit je eerste kamer', test: (s) => s.plays >= 1 },
  { id: 'three', name: 'Drie kamers', icon: 'castle', desc: 'Ontsnap uit 3 verschillende kamers', test: (s) => s.rooms.length >= 3 },
  { id: 'all', name: 'Meester-ontsnapper', icon: 'trophy', desc: 'Ontsnap uit alle 8 kamers', test: (s) => ROOMS.every((r) => s.rooms.includes(r.id)) },
  { id: 'star3', name: 'Driesterren', icon: 'star', desc: 'Haal 3 sterren in een kamer', test: (s) => Object.values(s.rec).some((r) => r.s >= 3) },
  { id: 'perfect', name: 'Alle kamers perfect', icon: 'crown', desc: '3 sterren in elke kamer', test: (s) => ROOMS.every((r) => roomStars(s, r.id) >= 3) },
  { id: 'nohint', name: 'Zonder hulp', icon: 'lightbulb', desc: 'Ontsnap zonder hints', test: (s) => s.noh >= 1 },
  { id: 'fast', name: 'Bliksemsnel', icon: 'bolt', desc: 'Ontsnap in de helft van de tijd', test: (s) => s.fast >= 1 },
  { id: 'hard', name: 'Zware klus', icon: 'flame', desc: 'Ontsnap op Moeilijk', test: (s) => ROOMS.some((r) => bestStars(s, r.id, 'moeilijk') > 0) },
  { id: 'expert', name: 'Expert', icon: 'dragon', desc: 'Ontsnap op Expert', test: (s) => ROOMS.some((r) => bestStars(s, r.id, 'expert') > 0) },
  { id: 'daily3', name: 'Dagelijkse fan', icon: 'hourglass', desc: 'Doe 3 dagelijkse kamers', test: (s) => s.dcount >= 3 },
  { id: 'daily7', name: 'Week-reeks', icon: 'rainbow', desc: '7 dagen op rij de dagelijkse kamer', test: (s) => s.dstreak >= 7 },
  { id: 'p25', name: 'Puzzelaar', icon: 'puzzle', desc: 'Los 25 puzzels op', test: (s) => s.solved >= 25 },
  { id: 'p100', name: 'Puzzelkampioen', icon: 'medal', desc: 'Los 100 puzzels op', test: (s) => s.solved >= 100 },
  { id: 'stars30', name: 'Sterrenregen', icon: 'comet', desc: 'Verzamel 30 sterren', test: (s) => totalStars(s) >= 30 },
];
export const earnedAch = (s) => ACH.filter((a) => a.test(s)).map((a) => a.id);

const prevDay = (key) => { const [y, m, d] = key.split('-').map(Number); return dayKey(new Date(y, m - 1, d - 1)); };

// Verwerk een gelukte ontsnapping. Geeft {patch, stars, newBest, newAch, firstDaily}.
export function finishRun(save, run, st) {
  const s = { ...defaults(), ...save };
  const d = diffOf(run), stars = starsFor(run, st), t = Math.round(st.t);
  const rec = { ...s.rec }; let newBest = false;
  if (run.daily) {
    const had = s.daily[run.daily];
    s.daily = { ...s.daily, [run.daily]: { s: Math.max(stars, had ? had.s : 0), t: had ? Math.min(had.t, t) : t } };
    const keys = Object.keys(s.daily).sort(); while (keys.length > 14) delete s.daily[keys.shift()];
    if (!had) { s.dcount += 1; s.dstreak = s.dlast === prevDay(run.daily) ? s.dstreak + 1 : 1; s.dlast = run.daily; }
  } else {
    const k = recKey(run.room, run.diff), old = rec[k];
    if (!old || stars > old.s || (stars === old.s && t < old.t)) { rec[k] = { s: stars, t }; newBest = !old || t < old.t || stars > old.s; }
    if (!s.rooms.includes(run.room)) s.rooms = [...s.rooms, run.room];
  }
  s.rec = rec; s.plays += 1; s.solved += run.puzzles.length; s.hints += st.hints;
  if (st.hints === 0) s.noh += 1;
  if (st.t <= d.par / 2) s.fast += 1;
  const pt = { ...s.pt }; for (const p of run.puzzles) pt[p.type] = (pt[p.type] || 0) + 1; s.pt = pt;
  const before = new Set(s.ach), now = earnedAch(s), newAch = now.filter((a) => !before.has(a));
  s.ach = now; s.cur = null;
  const patch = { rec: s.rec, plays: s.plays, solved: s.solved, hints: s.hints, noh: s.noh, fast: s.fast, rooms: s.rooms, daily: s.daily, dstreak: s.dstreak, dlast: s.dlast, dcount: s.dcount, ach: s.ach, cur: null, pt: s.pt };
  return { patch, stars, newBest, newAch };
}

// Bewaar een lopende poging klein (alleen wat nodig is om verder te gaan).
export function packCur(run, st) { return { r: run.room, d: run.diff, s: run.seed, y: run.daily, t: Math.round(st.t), h: st.hints, hl: st.hl, so: st.solved, f: st.found, i: st.inv }; }
export function unpackCur(c) {
  if (!c || typeof c !== 'object' || !ROOM_BY_ID[c.r] || !DIFF_BY_ID[c.d]) return null;
  const run = c.y ? buildDaily(c.y) : buildRun(c.r, c.d, c.s);
  if (c.y && (run.room !== c.r)) return null;
  const arr = (x) => (Array.isArray(x) ? x.filter((v) => typeof v === 'string') : []);
  return { run, st: { t: +c.t || 0, hints: +c.h || 0, hl: c.hl && typeof c.hl === 'object' ? c.hl : {}, solved: arr(c.so), found: arr(c.f), inv: arr(c.i) } };
}
