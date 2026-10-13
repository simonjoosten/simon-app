// Pinnenspel: peg solitaire. Spring met een pin over een andere pin in een leeg gat; de overgesprongen pin verdwijnt.
// Doel per level: precies 1 pin overhouden (soms moet die in het sterretje-gat eindigen).

const SQ = [[0, 1], [0, -1], [1, 0], [-1, 0]];
const TRI = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1]];

const BOARD_DEFS = {
  rij: { name: 'Rijtje', type: 'sq', rows: ['#######'] },
  plus: { name: 'Plusje', type: 'sq', rows: ['..#..', '..#..', '#####', '..#..', '..#..'] },
  vier3: { name: 'Vierkantje', type: 'sq', rows: ['###', '###', '###'] },
  vier4: { name: 'Raster', type: 'sq', rows: ['####', '####', '####', '####'] },
  drie5: { name: 'Driehoek', type: 'tri', rows: ['#', '##', '###', '####', '#####'] },
  drie6: { name: 'Grote driehoek', type: 'tri', rows: ['#', '##', '###', '####', '#####', '######'] },
  dia13: { name: 'Diamantje', type: 'sq', rows: ['..#..', '.###.', '#####', '.###.', '..#..'] },
  dia25: { name: 'Diamant', type: 'sq', rows: ['...#...', '..###..', '.#####.', '#######', '.#####.', '..###..', '...#...'] },
  pijl: { name: 'Pijl', type: 'sq', rows: ['...#...', '..###..', '.#####.', '...#...', '...#...', '...#...'] },
  kruis: { name: 'Kruis', type: 'sq', rows: ['..###..', '..###..', '#######', '#######', '#######', '..###..', '..###..'] },
  tri4: { name: 'Kleine driehoek', type: 'tri', rows: ['#', '##', '###', '####'] },
  tri7: { name: 'Reuzendriehoek', type: 'tri', rows: ['#', '##', '###', '####', '#####', '######', '#######'] },
  hex19: { name: 'Zeshoek', type: 'tri', rows: ['###', '####', '#####', '.####', '..###'] },
  hex37: { name: 'Grote zeshoek', type: 'tri', rows: ['####', '#####', '######', '#######', '.######', '..#####', '...####'] },
  ruit: { name: 'Ruit', type: 'tri', rows: ['#####', '#####', '#####', '#####', '#####'] },
  ruit4: { name: 'Kleine ruit', type: 'tri', rows: ['####', '####', '####', '####'] },
  l: { name: 'Hoek', type: 'sq', rows: ['#...', '#...', '#...', '####'] },
  trap: { name: 'Trap', type: 'sq', rows: ['#....', '##...', '###..', '####.', '#####'] },
  ring: { name: 'Ring', type: 'sq', rows: ['#####', '#...#', '#...#', '#...#', '#####'] },
  hoef: { name: 'Hoefijzer', type: 'sq', rows: ['#...#', '#...#', '#...#', '#####'] },
  hh: { name: 'H-vorm', type: 'sq', rows: ['#...#', '#...#', '#####', '#...#', '#...#'] },
  vier5: { name: 'Groot raster', type: 'sq', rows: ['#####', '#####', '#####', '#####', '#####'] },
  blok: { name: 'Blok', type: 'sq', rows: ['#####', '#####', '#####', '#####'] },
  dik: { name: 'Dik plusje', type: 'sq', rows: ['.##.', '.##.', '####', '####', '.##.', '.##.'] },
  frans: { name: 'Frans bord', type: 'sq', rows: ['..###..', '.#####.', '#######', '#######', '#######', '.#####.', '..###..'] },
  vlinder: { name: 'Vlinder', type: 'sq', rows: ['#...#', '##.##', '#####', '##.##', '#...#'] },
  brug: { name: 'Brug', type: 'sq', rows: ['.###.', '#####', '#...#', '#...#'] },
};

const boardCache = {};
export function buildBoard(id) {
  if (boardCache[id]) return boardCache[id];
  const def = BOARD_DEFS[id];
  const dirs = def.type === 'tri' ? TRI : SQ;
  const cells = [];
  const map = new Map();
  def.rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] !== '#') continue;
      const x = def.type === 'tri' ? c - r / 2 : c;
      const y = def.type === 'tri' ? r * 0.866 : r;
      map.set(r + ',' + c, cells.length);
      cells.push({ r, c, x, y });
    }
  });
  const moves = [];
  const links = [];
  cells.forEach((cl, i) => {
    dirs.forEach(([dr, dc], di) => {
      const o = map.get((cl.r + dr) + ',' + (cl.c + dc));
      if (o === undefined) return;
      if (di % 2 === 0) links.push([i, o]);
      const t = map.get((cl.r + 2 * dr) + ',' + (cl.c + 2 * dc));
      if (t !== undefined) moves.push([i, o, t]);
    });
  });
  const b = { id, name: def.name, type: def.type, cells, n: cells.length, moves, links, map };
  boardCache[id] = b;
  return b;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Oplosser: diepte-eerst met geheugen van dode standen. Geeft {sol, aborted}.
export function solve(b, start, goal = -1, maxNodes = 2e6, maxMs = Infinity) {
  const st = Uint8Array.from(start);
  const w = [];
  let key = 0, cnt = 0;
  for (let i = 0; i < b.n; i++) { w.push(Math.pow(2, i)); if (st[i]) { key += w[i]; cnt++; } }
  const dead = new Set();
  const path = [];
  let nodes = 0, aborted = false;
  const t0 = Date.now();
  function rec() {
    if (cnt === 1 && (goal < 0 || st[goal])) return true;
    if (cnt === 1) return false;
    if (dead.has(key)) return false;
    nodes++;
    if (nodes > maxNodes || ((nodes & 1023) === 0 && Date.now() - t0 > maxMs)) { aborted = true; return false; }
    for (const m of b.moves) {
      if (st[m[0]] && st[m[1]] && !st[m[2]]) {
        st[m[0]] = 0; st[m[1]] = 0; st[m[2]] = 1;
        key += w[m[2]] - w[m[0]] - w[m[1]]; cnt--;
        path.push(m);
        if (rec()) return true;
        path.pop();
        st[m[0]] = 1; st[m[1]] = 1; st[m[2]] = 0;
        key -= w[m[2]] - w[m[0]] - w[m[1]]; cnt++;
        if (aborted) return false;
      }
    }
    dead.add(key);
    return false;
  }
  const ok = rec();
  return { sol: ok ? path.slice() : null, aborted };
}

// ---------- levels ----------
// 10 werelden van 30 vaste levels = 300. Per wereld: 14 gegenereerde levels, 1 klassieke 'gat'-puzzel in het midden,
// 14 gegenereerde levels en een eindbaas (klassiek bord). Gegenereerde levels worden achterwaarts opgebouwd uit een
// eindstand (dus bewezen oplosbaar) met vaste seed: level N is altijd hetzelfde. Alles wordt lui gemaakt en gecached.
export const WORLD_SIZE = 30;
const WORLDS = [
  { name: 'Startveld', emoji: '🌱', bg: ['#2f7a4a', '#0f2b1c'], wood: ['#8a5a2b', '#b98445'], tries: 1,
    segs: [['rij', 2, 4, 4], ['plus', 3, 6, 4], ['vier3', 3, 5, 3], ['l', 3, 5, 3], ['tri4', 3, 8, 4], ['hoef', 4, 7, 3], ['hh', 4, 8, 3], ['brug', 3, 5, 2], ['ring', 4, 8, 2]],
    special: ['tri4', 2], boss: ['tri4', 1] },
  { name: 'Bosrand', emoji: '🌲', bg: ['#1f6b5c', '#0a2420'], wood: ['#7a4a22', '#a9743c'], tries: 2,
    segs: [['ring', 5, 9, 3], ['dia13', 5, 8, 4], ['drie5', 5, 10, 5], ['pijl', 6, 10, 4], ['vlinder', 5, 9, 3], ['trap', 6, 10, 4], ['vier4', 7, 11, 5]],
    special: ['drie5', 4], boss: ['drie5', 0] },
  { name: 'Woestijn', emoji: '🏜️', bg: ['#b9742c', '#4a2a10'], wood: ['#6f4a2a', '#d3a566'], tries: 3,
    segs: [['hex19', 8, 13, 4], ['trap', 9, 12, 3], ['vier4', 10, 14, 4], ['ruit4', 9, 13, 4], ['dik', 8, 13, 4], ['pijl', 8, 10, 2], ['drie5', 10, 13, 4], ['blok', 8, 12, 3]],
    special: ['dik', 0], boss: ['vier4', 1] },
  { name: 'IJsvlakte', emoji: '❄️', bg: ['#3b7fb8', '#10284a'], wood: ['#5b6f8c', '#a9c4e0'], tries: 3,
    segs: [['blok', 11, 16, 4], ['drie6', 12, 17, 5], ['ruit4', 12, 15, 3], ['hex19', 13, 16, 4], ['dia25', 12, 17, 5], ['dik', 12, 15, 3], ['kruis', 12, 17, 4]],
    special: ['blok', 12], boss: ['blok', 0] },
  { name: 'Vulkaan', emoji: '🌋', bg: ['#b8381f', '#2a0c0a'], wood: ['#4a2a22', '#8f5a45'], tries: 4,
    segs: [['tri7', 14, 21, 5], ['dia25', 15, 19, 4], ['vier5', 14, 19, 4], ['ruit', 14, 20, 5], ['drie6', 15, 20, 4], ['kruis', 15, 21, 4], ['hex19', 15, 17, 2]],
    special: ['drie6', 20], boss: ['drie6', 0] },
  { name: 'Kristalgrot', emoji: '💎', bg: ['#6a3fb8', '#1a0f3a'], wood: ['#5a4a8a', '#a592e0'], tries: 5,
    segs: [['hex37', 18, 24, 5], ['vier5', 17, 22, 4], ['kruis', 18, 24, 5], ['blok', 16, 19, 3], ['tri7', 18, 23, 4], ['ruit', 18, 22, 4], ['frans', 19, 24, 3]],
    special: ['ruit', 6], boss: ['ruit', 0] },
  { name: 'Sterrenhemel', emoji: '✨', bg: ['#2a2f8f', '#080a24'], wood: ['#4a4a6a', '#9a9ac4'], tries: 5,
    segs: [['frans', 20, 27, 5], ['hex37', 22, 28, 5], ['kruis', 22, 27, 4], ['dia25', 16, 18, 3], ['tri7', 21, 25, 4], ['ruit', 20, 22, 3], ['vier5', 19, 22, 4]],
    special: ['kruis', 1], boss: ['kruis', 16, true] },
  { name: 'Diepzee', emoji: '🌊', bg: ['#0f7a8f', '#041e2a'], wood: ['#3a5a5a', '#78b0a8'], tries: 6,
    segs: [['hex37', 25, 32, 6], ['frans', 25, 30, 5], ['tri7', 22, 26, 4], ['kruis', 24, 28, 4], ['vier5', 20, 22, 3], ['ruit', 21, 22, 3], ['dia25', 16, 18, 3]],
    special: ['kruis', 8], boss: ['tri7', 1] },
  { name: 'Spookslot', emoji: '👻', bg: ['#5a5a7a', '#14141f'], wood: ['#3a3a4a', '#8a8aa0'], tries: 7,
    segs: [['hex37', 28, 33, 7], ['frans', 27, 31, 6], ['kruis', 26, 29, 5], ['tri7', 24, 25, 4], ['ruit', 21, 22, 2], ['vier5', 21, 22, 2], ['dia25', 17, 18, 2]],
    special: ['hex37', 4], boss: ['hex37', 1] },
  { name: 'Meesterberg', emoji: '👑', bg: ['#b8962f', '#2a200a'], wood: ['#6a4a1a', '#d8b05a'], tries: 8,
    segs: [['hex37', 31, 34, 9], ['frans', 29, 31, 7], ['kruis', 28, 29, 5], ['tri7', 25, 25, 3], ['vier5', 22, 22, 2], ['ruit', 22, 22, 2]],
    special: ['kruis', 4], boss: ['frans', 8] },
];
const ENDLESS_WORLD = { name: 'Eindeloos', emoji: '♾️', bg: ['#3b2a7a', '#161033'], wood: ['#a8703a', '#c28a50'] };

// Vaste oplossingen van de klassieke 'gat'-puzzels (hint is dan direct), "van.over.naar" per zet; de test controleert ze.
const SOLS = {
  'tri4:2': '9.5.2;0.2.5;3.1.0;5.4.3;6.3.1;0.1.3;8.7.6;6.3.1',
  'tri4:1': '6.3.1;0.1.3;5.2.0;3.4.5;9.5.2;0.2.5;7.8.9;9.5.2',
  'drie5:4': '11.7.4;9.8.7;1.4.8;2.5.9;6.3.1;0.1.3;13.12.11;3.7.12;11.12.13;14.9.5;5.8.12;13.12.11;10.11.12',
  'drie5:0': '3.1.0;5.4.3;0.2.5;6.3.1;9.5.2;11.7.4;12.8.5;1.4.8;2.5.9;14.9.5;5.8.12;13.12.11;10.11.12',
  'dik:0': '5.2.0;7.6.5;1.3.6;5.6.7;13.10.6;7.6.5;8.9.10;14.12.9;9.5.2;0.2.5;4.5.6;6.10.13;15.13.10;11.10.9',
  'vier4:1': '3.2.1;0.1.2;8.4.0;6.5.4;0.4.8;11.7.3;3.2.1;12.8.4;13.9.5;1.5.9;10.9.8;4.8.12;15.14.13;12.13.14',
  'blok:12': '2.7.12;0.1.2;3.2.1;5.6.7;8.7.6;15.10.5;5.6.7;12.7.2;1.2.3;4.3.2;14.13.12;11.12.13;18.13.8;9.8.7;2.7.12;16.17.18;19.18.17;17.12.7',
  'blok:0': '2.1.0;4.3.2;11.6.1;1.2.3;8.7.6;5.6.7;13.12.11;14.9.4;4.3.2;2.7.12;15.10.5;0.5.10;17.12.7;10.11.12;19.18.17;16.17.18;7.12.17;17.18.19',
  'drie6:20': '9.14.20;2.5.9;3.4.5;0.1.3;5.9.14;6.3.1;7.8.9;14.9.5;15.10.6;16.11.7;6.7.8;13.8.4;1.4.8;18.12.7;5.8.12;20.19.18;17.18.19;7.12.18;18.19.20',
  'drie6:0': '3.1.0;5.4.3;0.2.5;6.3.1;8.7.6;9.5.2;10.6.3;1.3.6;16.11.7;6.7.8;12.8.5;2.5.9;14.9.5;18.17.16;15.16.17;20.19.18;17.18.19;19.13.8;5.8.12',
  'ruit:6': '8.7.6;5.6.7;15.10.5;0.5.10;2.1.0;4.3.2;16.11.6;13.12.11;0.6.12;11.12.13;2.7.12;13.12.11;10.11.12;23.17.11;11.12.13;14.13.12;21.22.23;24.19.14;9.14.19;19.18.17;12.17.22;23.22.21;20.21.22',
  'ruit:0': '2.1.0;4.3.2;11.6.1;1.2.3;8.7.6;5.6.7;12.7.2;3.2.1;0.1.2;14.13.12;15.10.5;17.12.7;2.7.12;18.12.6;21.16.11;5.11.17;23.22.21;20.21.22;22.17.12;6.12.18;24.19.14;9.14.19;19.18.17',
  'kruis:1': '9.4.1;7.8.9;0.3.8;2.1.0;9.8.7;6.7.8;10.5.2;12.11.10;15.8.3;0.3.8;13.14.15;15.8.3;17.16.15;19.18.17;17.10.5;2.5.10;22.15.8;3.8.15;20.21.22;23.22.21;29.24.17;26.25.24;30.27.22;15.22.27;32.31.30;30.27.22;21.22.23;23.24.25;10.17.24;25.24.23;23.28.31',
  'kruis:16g': '4.9.16;7.8.9;0.3.8;2.1.0;9.8.7;6.7.8;10.5.2;12.11.10;15.8.3;0.3.8;13.14.15;15.8.3;17.16.15;19.18.17;17.10.5;2.5.10;22.15.8;3.8.15;20.21.22;23.22.21;29.24.17;26.25.24;30.27.22;15.22.27;32.31.30;30.27.22;21.22.23;23.24.25;10.17.24;25.24.23;28.23.16',
  'kruis:8': '0.3.8;2.1.0;5.4.3;16.9.4;3.4.5;7.8.9;10.9.8;12.11.10;10.5.2;15.8.3;0.3.8;21.14.7;7.8.9;23.22.21;20.21.22;6.13.20;25.24.23;23.22.21;20.21.22;26.19.12;31.28.23;23.22.21;30.27.22;21.22.23;32.29.24;23.24.25;25.18.11;12.11.10;17.10.5;2.5.10;9.10.11',
  'tri7:1': '6.3.1;0.1.3;5.2.0;3.4.5;8.7.6;9.5.2;0.2.5;10.6.3;12.11.10;14.13.12;15.10.6;3.6.10;17.12.8;5.8.12;18.12.7;20.19.18;22.16.11;25.18.12;7.12.18;10.11.12;27.26.25;24.25.26;12.18.25;26.25.24;24.23.22;21.22.23',
  'hex37:4': '6.5.4;8.7.6;16.10.5;1.5.10;3.2.1;0.1.2;9.4.0;11.10.9;2.6.11;12.11.10;9.10.11;14.13.12;11.12.13;18.17.16;15.16.17;19.13.8;21.20.19;23.17.11;25.24.23;22.23.24;26.19.12;11.12.13;8.13.19;30.24.17;34.29.23;36.35.34;27.32.36;33.34.35;36.31.25;19.25.30;35.30.24;24.17.10;28.23.17;17.10.4;0.4.9',
  'hex37:1': '3.2.1;0.1.2;9.4.0;6.5.4;0.4.9;8.7.6;12.6.1;1.2.3;10.11.12;13.12.11;15.9.4;17.16.15;18.11.5;4.5.6;20.19.18;21.14.8;3.8.14;24.18.12;6.12.19;22.23.24;25.24.23;26.19.12;28.23.17;34.30.25;31.25.18;18.17.16;15.16.17;36.35.34;27.32.36;33.34.35;36.35.34;34.29.23;23.17.11;11.12.13;14.13.12',
  'kruis:4': '16.9.4;1.4.9;14.15.16;3.8.15;6.7.8;9.8.7;11.10.9;2.5.10;9.10.11;12.11.10;16.15.14;13.14.15;17.10.5;19.18.17;22.15.8;20.21.22;24.17.10;5.10.17;26.25.24;23.24.25;27.22.15;15.8.3;0.3.8;7.8.9;32.29.24;17.24.29;30.31.32;32.29.24;25.24.23;28.23.16;9.16.23',
  'frans:8': '10.9.8;0.4.10;2.1.0;6.5.4;3.4.5;11.10.9;8.9.10;13.12.11;10.11.12;19.12.6;6.5.4;0.4.10;17.18.19;15.16.17;17.10.4;27.20.13;7.13.20;25.26.27;28.27.26;30.24.17;22.23.24;24.17.10;4.10.17;32.31.30;19.26.32;21.20.19;34.30.24;17.24.30;29.30.31;35.31.25;36.32.26;25.26.27;33.27.20;19.20.21;14.21.28',
};

const SPECS = [];
WORLDS.forEach((w, wi) => {
  const gen = [];
  w.segs.forEach(([board, k0, k1, count]) => {
    for (let i = 0; i < count; i++) gen.push({ board, k: count > 1 ? Math.round(k0 + (k1 - k0) * i / (count - 1)) : k0, tries: w.tries });
  });
  gen.sort((a, b) => a.k - b.k); // stabiel: oplopend per wereld, borden wisselen elkaar af
  if (gen.length !== WORLD_SIZE - 2) throw new Error('wereld ' + wi + ' heeft ' + gen.length + ' gegenereerde levels');
  const list = gen.slice(0, 14).concat([{ hole: w.special, special: true }], gen.slice(14), [{ hole: w.boss, boss: true, goalHole: !!w.boss[2] }]);
  list.forEach((sp, i) => {
    sp.world = wi;
    if (!sp.hole && wi > 0 && i % 4 === 3) sp.goalMode = true;
    SPECS.push(sp);
  });
});
export const LEVEL_COUNT = SPECS.length; // 300
const ENDLESS_BOARDS = ['drie6', 'kruis', 'hex37', 'dia25', 'frans', 'vier5', 'tri7', 'ruit', 'blok', 'hex19'];

const WORLDS_VIEW = WORLDS;
export function worldOf(n) { return Math.min(WORLDS.length - 1, Math.floor(n / WORLD_SIZE)); }
export function themeOf(n) { return n >= LEVEL_COUNT ? ENDLESS_WORLD : WORLDS[worldOf(n)]; }

function generate(boardId, k, seed, tries) {
  const b = buildBoard(boardId);
  const rnd = mulberry32(seed);
  let best = null, found = 0;
  for (let attempt = 0; attempt < 1500; attempt++) {
    const cur = new Uint8Array(b.n);
    const goal = Math.floor(rnd() * b.n);
    cur[goal] = 1;
    let cnt = 1;
    const rev = [];
    while (cnt < k) {
      const cand = b.moves.filter((m) => cur[m[2]] && !cur[m[0]] && !cur[m[1]]);
      if (!cand.length) break;
      const m = cand[Math.floor(rnd() * cand.length)];
      cur[m[2]] = 0; cur[m[0]] = 1; cur[m[1]] = 1; cnt++;
      rev.push(m);
    }
    if (cnt < k) { if (!best || cnt > best.cnt) best = { cnt, start: Array.from(cur), sol: rev.reverse(), goal, open: 0 }; continue; }
    // meerdere kandidaten: kies die met de meeste startzetten (meer valkuilen = lastiger)
    const open = b.moves.reduce((a, m) => a + (cur[m[0]] && cur[m[1]] && !cur[m[2]] ? 1 : 0), 0);
    if (!best || best.cnt < k || open > best.open) best = { cnt, start: Array.from(cur), sol: rev.reverse(), goal, open };
    if (++found >= tries) break;
  }
  return best;
}

function parseSol(str) { return str ? str.split(';').map((t) => t.split('.').map(Number)) : null; }

const levelCache = new Map();
export function makeLevel(n) {
  if (levelCache.has(n)) return levelCache.get(n);
  let lv;
  const spec = n < LEVEL_COUNT ? SPECS[n] : null;
  if (spec && spec.hole) {
    const [bid, hole] = spec.hole;
    const b = buildBoard(bid);
    const start = new Array(b.n).fill(1); start[hole] = 0;
    const goal = spec.goalHole ? hole : -1;
    const title = (spec.boss ? 'Baas: ' : 'Klassiek: ') + b.name + (goal >= 0 ? ' (laatste pin in ⭐)' : '');
    lv = { n, board: b, start, goal, sol: parseSol(SOLS[bid + ':' + hole + (goal >= 0 ? 'g' : '')]), k: b.n - 1, title, boss: !!spec.boss, hole };
  } else {
    let id, k, title, tries, goalMode = false;
    if (spec) { id = spec.board; k = spec.k; tries = spec.tries; goalMode = !!spec.goalMode; title = buildBoard(id).name; }
    else {
      const e = n - LEVEL_COUNT;
      id = ENDLESS_BOARDS[(e * 7 + Math.floor(e / 6)) % ENDLESS_BOARDS.length];
      k = Math.min(14 + Math.floor(e / 3), 22, buildBoard(id).n - 4);
      tries = 4; goalMode = e % 3 === 2;
      title = 'Eindeloos · ' + buildBoard(id).name;
    }
    const g = generate(id, k, n * 7919 + 13, tries);
    lv = { n, board: buildBoard(id), start: g.start, goal: goalMode ? g.goal : -1, sol: g.sol, k: g.cnt, title, open: g.open };
  }
  levelCache.set(n, lv);
  return lv;
}

export const _logic = { BOARD_DEFS, buildBoard, makeLevel, solve, LEVEL_COUNT, SPECS, WORLDS, WORLD_SIZE, SOLS, worldOf };

// ---------- spel ----------
export default {
  id: 'pinnen',
  name: 'Pinnenspel',
  emoji: '📍',
  hint: 'Spring met een pin over een andere pin: die verdwijnt. Hou er maar 1 over!',
  save: 'forever',
  create(host, api) {
    host.style.touchAction = 'none';
    let dead = false;
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;background:radial-gradient(ellipse at 50% 30%,#3b2a7a,#161033 75%);color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;box-sizing:border-box;user-select:none;-webkit-user-select:none;overflow:hidden';
    host.appendChild(root);

    // ----- DOM -----
    const navStyle = 'border:0;border-radius:12px;width:34px;height:34px;font-size:16px;font-weight:800;color:#fff;background:rgba(255,255,255,.14);cursor:pointer;touch-action:manipulation;flex:none;font-family:inherit';
    const top = document.createElement('div');
    top.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px 14px 0;gap:8px';
    const titleBox = document.createElement('div');
    const titleEl = document.createElement('div');
    titleEl.style.cssText = 'font-size:20px;font-weight:800;line-height:1.1';
    const subEl = document.createElement('div');
    subEl.style.cssText = 'font-size:13px;opacity:.8;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
    titleBox.append(titleEl, subEl);
    const starEl = document.createElement('div');
    starEl.style.cssText = 'font-size:17px;font-weight:700;background:rgba(255,255,255,.12);border-radius:14px;padding:6px 12px';
    const prevBtn = document.createElement('button');
    prevBtn.style.cssText = navStyle; prevBtn.textContent = '◀';
    prevBtn.addEventListener('click', () => { if (!dead && !anim && cur > 0) loadLevel(cur - 1); });
    const nextBtn = document.createElement('button');
    nextBtn.style.cssText = navStyle; nextBtn.textContent = '▶';
    nextBtn.addEventListener('click', () => { if (!dead && !anim && cur + 1 <= maxL) loadLevel(cur + 1); });
    titleBox.style.cssText = 'flex:1;min-width:0';
    top.append(prevBtn, titleBox, nextBtn, starEl);
    const infoEl = document.createElement('div');
    infoEl.style.cssText = 'text-align:center;font-size:15px;font-weight:600;padding:6px 14px 0;min-height:22px';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;flex:1;min-height:0';
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;touch-action:none;display:block';
    wrap.appendChild(cv);
    const msgEl = document.createElement('div');
    msgEl.style.cssText = 'position:absolute;left:12px;right:12px;bottom:6px;text-align:center;font-size:15px;font-weight:600;min-height:20px;pointer-events:none;text-shadow:0 1px 3px #000';
    wrap.appendChild(msgEl);
    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:8px;padding:8px 12px 12px;justify-content:center';
    root.append(top, infoEl, wrap, bar);

    function mkBtn(label, fn) {
      const b = document.createElement('button');
      b.style.cssText = 'flex:1;max-width:100px;border:0;border-radius:14px;padding:10px 4px;font-size:15px;font-weight:700;color:#fff;background:linear-gradient(#6d5bd0,#4a3aa8);box-shadow:0 3px 0 #2a2070;cursor:pointer;touch-action:manipulation;font-family:inherit';
      b.textContent = label;
      b.addEventListener('click', () => { if (!dead) fn(); });
      bar.appendChild(b);
      return b;
    }
    const undoBtn = mkBtn('↩️ Terug', () => undo());
    const resetBtn = mkBtn('🔄 Opnieuw', () => resetLevel());
    const hintBtn = mkBtn('💡 5', () => doHint());
    const listBtn = mkBtn('📋 Levels', () => openList());

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:none;align-items:center;justify-content:center;background:rgba(10,6,30,.72);z-index:5';
    root.appendChild(overlay);

    // ----- geluid -----
    let ac = null;
    function audio() {
      if (ac === null) {
        try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = false; }
      }
      if (ac && ac.state === 'suspended') { try { ac.resume(); } catch (e) { /* niets */ } }
      return ac;
    }
    function tone(f, d = 0.12, type = 'sine', vol = 0.05, delay = 0, slide = 0) {
      const a = audio();
      if (!a) return;
      try {
        const t = a.currentTime + delay;
        const o = a.createOscillator(), g = a.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f, t);
        if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g); g.connect(a.destination);
        o.start(t); o.stop(t + d + 0.03);
      } catch (e) { /* niets */ }
    }
    const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
    const noteF = (i) => 330 * Math.pow(2, SCALE[Math.min(i, SCALE.length - 1)] / 12);

    // ----- toestand -----
    let lv = null, board = null, pegs = [], hue = [], hist = [];
    let sel = -1, hintMove = null, hintUntil = 0;
    let usedHint = false, usedUndo = false, won = false, stuck = false;
    let chain = 0, lastPeg = -1;
    let anim = null, drag = null;
    let ready = false;
    let cur = 0, maxL = 0, starsStr = '', extra = 0, hints = 5, theme = themeOf(0), listWorld = 0;
    const fx = [], parts = [];
    let msgTimer = 0;

    const starsOf = (i) => (i < starsStr.length ? +starsStr[i] || 0 : 0);
    const totalStars = () => { let s = extra; for (let i = 0; i < starsStr.length; i++) s += +starsStr[i] || 0; return s; };
    function persist() {
      if (!ready) return;
      try { api.save({ v: 2, l: cur, m: maxL, s: starsStr.replace(/0+$/, ''), e: extra, h: hints }); } catch (e) { /* niets */ }
    }
    function updateTop() {
      const n = cur + 1;
      titleEl.textContent = 'Level ' + n + (cur < LEVEL_COUNT ? ' / ' + LEVEL_COUNT : '');
      const wi = worldOf(cur);
      subEl.textContent = lv ? (cur < LEVEL_COUNT ? theme.emoji + ' Wereld ' + (wi + 1) + ': ' + theme.name + ' · ' + (cur % WORLD_SIZE + 1) + '/' + WORLD_SIZE : theme.emoji + ' ' + theme.name) : '';
      prevBtn.style.opacity = cur > 0 ? '1' : '.35';
      nextBtn.style.opacity = cur + 1 <= maxL ? '1' : '.35';
      starEl.textContent = '⭐ ' + totalStars();
      hintBtn.textContent = '💡 ' + hints;
      hintBtn.style.opacity = hints > 0 ? '1' : '.5';
      undoBtn.style.opacity = hist.length && !anim ? '1' : '.5';
      const left = pegs.reduce((a, v) => a + v, 0);
      infoEl.textContent = lv ? (lv.title + '  ·  Pinnen: ' + left + '  ·  ' + (lv.goal >= 0 ? 'Laatste pin in het sterretje ⭐' : 'Hou er 1 over')) : '';
    }
    function say(t, ms = 0) {
      msgEl.textContent = t;
      clearTimeout(msgTimer);
      if (ms) msgTimer = setTimeout(() => { msgEl.textContent = ''; }, ms);
    }

    // ----- level laden -----
    function loadLevel(n) {
      cur = n;
      lv = makeLevel(n);
      board = lv.board;
      const newWorld = !theme || theme !== themeOf(n);
      theme = themeOf(n);
      root.style.background = 'radial-gradient(ellipse at 50% 30%,' + theme.bg[0] + ',' + theme.bg[1] + ' 75%)';
      pegs = lv.start.slice();
      hue = pegs.map((_, i) => (i * 53 + n * 29) % 360);
      hist = []; sel = -1; hintMove = null; usedHint = false; usedUndo = false;
      won = false; stuck = false; chain = 0; lastPeg = -1; anim = null; drag = null;
      fx.length = 0;
      overlay.style.display = 'none';
      say('', 0);
      layout();
      updateTop();
      api.score(totalStars());
      persist();
      checkStuck(true);
      if (!msgEl.textContent) {
        if (n === LEVEL_COUNT) say('♾️ Eindeloos: de laatste wereld is gehaald!', 3200);
        else if (n < LEVEL_COUNT && (n % WORLD_SIZE === 0 || newWorld)) say(theme.emoji + ' Wereld ' + (worldOf(n) + 1) + ': ' + theme.name + '!', 3200);
        else if (lv.boss) say('👑 Eindbaas van ' + theme.name + '!', 3000);
      }
    }
    function resetLevel() {
      if (!lv || anim) return;
      pegs = lv.start.slice();
      hue = pegs.map((_, i) => (i * 53 + cur * 29) % 360);
      hist = []; sel = -1; hintMove = null; won = false; stuck = false; chain = 0; lastPeg = -1;
      overlay.style.display = 'none';
      say('Opnieuw!', 900);
      tone(300, 0.18, 'triangle', 0.04, 0, 1.5);
      updateTop();
    }

    // ----- zetten -----
    const movesFrom = (i) => board.moves.filter((m) => m[0] === i && pegs[m[1]] && !pegs[m[2]] && pegs[i]);
    const anyMove = () => board.moves.some((m) => pegs[m[0]] && pegs[m[1]] && !pegs[m[2]]);

    function jump(m) {
      if (anim || won) return;
      const [a, o, t] = m;
      const now = performance.now();
      const h = hue[a], ho = hue[o];
      pegs[a] = 0; pegs[o] = 0; pegs[t] = 1; hue[t] = h;
      hist.push({ m, h, ho });
      chain = lastPeg === a ? chain + 1 : 0;
      lastPeg = t;
      sel = -1; hintMove = null; stuck = false; say('');
      anim = { from: a, to: t, t0: now, dur: 260, h };
      fx.push({ cell: o, h: ho, t0: now, dur: 320 });
      tone(noteF(chain), 0.14, 'sine', 0.055, 0, 1.15);
      tone(noteF(chain) * 2, 0.08, 'triangle', 0.025, 0.12);
      updateTop();
    }
    function landed() {
      const c = cellXY(anim.to);
      burst(c.x, c.y, anim.h, 8, 0.7);
      const oc = cellXY(fx.length ? fx[fx.length - 1].cell : anim.to);
      burst(oc.x, oc.y, 50, 6, 0.5);
      anim = null;
      updateTop();
      checkEnd();
    }
    function checkEnd() {
      const left = pegs.reduce((a, v) => a + v, 0);
      if (left === 1 && (lv.goal < 0 || pegs[lv.goal])) return win();
      checkStuck(false);
    }
    function checkStuck(silent) {
      const left = pegs.reduce((a, v) => a + v, 0);
      if (left === 1 || !anyMove()) {
        stuck = true;
        if (!silent) tone(200, 0.35, 'sawtooth', 0.03, 0, 0.6);
        say(left === 1 ? 'De laatste pin moet in het sterretje. Probeer het anders!' : 'Vast! ' + left + ' pinnen over. Tik ↩️ of 🔄', 0);
      }
    }
    function undo() {
      if (anim || won || !hist.length) return;
      const e = hist.pop();
      const [a, o, t] = e.m;
      pegs[t] = 0; pegs[a] = 1; pegs[o] = 1; hue[a] = e.h; hue[o] = e.ho;
      usedUndo = true; sel = -1; hintMove = null; stuck = false; chain = 0; lastPeg = -1;
      say('');
      const c = cellXY(o);
      burst(c.x, c.y, e.ho, 6, 0.4);
      tone(420, 0.12, 'triangle', 0.04, 0, 0.7);
      updateTop();
    }

    // ----- hint -----
    function doHint() {
      if (anim || won) return;
      if (hints <= 0) { say('Geen hints meer. Haal een level om er een te verdienen! 💡', 2200); return; }
      let m = null;
      // 1: de bewaarde oplossing, als de stand daarbij past
      if (lv.sol) {
        const st = lv.start.slice();
        const same = () => st.every((v, i) => v === pegs[i]);
        for (let i = 0; i <= lv.sol.length; i++) {
          if (same()) { m = lv.sol[i] || null; break; }
          const s = lv.sol[i]; if (!s) break;
          st[s[0]] = 0; st[s[1]] = 0; st[s[2]] = 1;
        }
      }
      if (!m) {
        const r = solve(board, pegs, lv.goal, 4e5, 900);
        if (r.sol && r.sol.length) m = r.sol[0];
        else {
          say(r.aborted ? 'Hmm, dit is lastig te zien. Probeer ↩️ of 🔄.' : 'Hier kom je niet meer uit. Tik ↩️ of 🔄!', 2800);
          tone(220, 0.2, 'triangle', 0.03);
          return;
        }
      }
      hints--; usedHint = true; hintMove = m; hintUntil = performance.now() + 3500; sel = m[0];
      tone(880, 0.1, 'sine', 0.04); tone(1175, 0.14, 'sine', 0.035, 0.09);
      say('Spring met de oplichtende pin 💡', 2500);
      updateTop(); persist();
    }

    // ----- winnen -----
    function win() {
      won = true;
      const stars = usedHint ? 1 : usedUndo ? 2 : 3;
      if (cur < LEVEL_COUNT) {
        const arr = starsStr.padEnd(cur + 1, '0').split('');
        arr[cur] = String(Math.max(+arr[cur] || 0, stars));
        starsStr = arr.join('');
      } else if (cur === maxL) extra += stars;
      if (cur + 1 > maxL) maxL = cur + 1;
      if (hints < 8) hints++;
      api.score(totalStars());
      updateTop(); persist();
      [0, 4, 7, 12].forEach((s, i) => tone(392 * Math.pow(2, s / 12), 0.22, 'triangle', 0.05, i * 0.1));
      tone(1568, 0.4, 'sine', 0.035, 0.45);
      confetti();
      setTimeout(() => { if (!dead) showWin(stars); }, 650);
    }
    function overlayCard() {
      overlay.textContent = '';
      const card = document.createElement('div');
      card.style.cssText = 'background:linear-gradient(#4b3aa8,#2b1f6e);border-radius:22px;padding:22px 24px;text-align:center;max-width:300px;width:82%;box-shadow:0 10px 40px rgba(0,0,0,.5);max-height:86%;overflow:auto;box-sizing:border-box';
      overlay.appendChild(card);
      overlay.style.display = 'flex';
      return card;
    }
    function ovBtn(parent, label, fn, primary) {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'display:block;width:100%;margin-top:10px;border:0;border-radius:14px;padding:12px;font-size:17px;font-weight:800;color:#fff;font-family:inherit;cursor:pointer;touch-action:manipulation;background:' + (primary ? 'linear-gradient(#34d399,#059669)' : 'rgba(255,255,255,.16)');
      b.addEventListener('click', () => { if (!dead) fn(); });
      parent.appendChild(b);
    }
    function nextUnfinished(from) {
      const lim = Math.min(maxL, LEVEL_COUNT - 1);
      for (let i = from + 1; i <= lim; i++) if (!starsOf(i)) return i;
      for (let i = 0; i < from && i <= lim; i++) if (!starsOf(i)) return i;
      return -1;
    }
    function worldStars(w) {
      let t = 0;
      for (let i = w * WORLD_SIZE; i < (w + 1) * WORLD_SIZE; i++) t += starsOf(i);
      return t;
    }
    function showWin(stars) {
      const card = overlayCard();
      const h = document.createElement('div');
      h.style.cssText = 'font-size:26px;font-weight:900';
      h.textContent = ['', 'Gelukt! 🙂', 'Lekker bezig! 😃', 'Perfect! 🤩'][stars];
      const s = document.createElement('div');
      s.style.cssText = 'font-size:44px;margin:10px 0 2px;letter-spacing:4px';
      s.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
      const t = document.createElement('div');
      t.style.cssText = 'font-size:14px;opacity:.8';
      t.textContent = stars === 3 ? 'Zonder hulp of terugdraaien!' : stars === 2 ? 'Met terugdraaien. Zonder kan 3 ⭐.' : 'Met een hint. Zonder hint kan 3 ⭐.';
      card.append(h, s, t);
      const worldDone = cur < LEVEL_COUNT && (cur + 1) % WORLD_SIZE === 0;
      if (worldDone) {
        const wd = document.createElement('div');
        wd.style.cssText = 'font-size:15px;font-weight:800;margin-top:12px;color:#fde047';
        wd.textContent = '🎉 Wereld ' + (worldOf(cur) + 1) + ' (' + theme.name + ') gehaald! ⭐ ' + worldStars(worldOf(cur)) + '/' + (WORLD_SIZE * 3);
        card.appendChild(wd);
      }
      const nx = cur + 1;
      const nextTheme = themeOf(nx);
      ovBtn(card, worldDone ? (nx >= LEVEL_COUNT ? '♾️ Naar eindeloos ▶' : nextTheme.emoji + ' Naar ' + nextTheme.name + ' ▶') : 'Volgend level ▶', () => loadLevel(nx), true);
      const nu = nextUnfinished(cur);
      if (nu >= 0 && nu !== nx) ovBtn(card, '⏭ Volgende niet-gehaalde (' + (nu + 1) + ')', () => loadLevel(nu), false);
      ovBtn(card, 'Nog eens', () => { overlay.style.display = 'none'; won = false; resetLevel(); }, false);
    }
    function openList() {
      if (anim) return;
      if (cur < LEVEL_COUNT) listWorld = worldOf(cur);
      renderList();
    }
    function renderList() {
      const card = overlayCard();
      const wi = listWorld, th = WORLDS_VIEW[wi];
      const head = document.createElement('div');
      head.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px';
      const mk = (label, to) => {
        const b = document.createElement('button');
        b.textContent = label;
        b.style.cssText = navStyle + ';opacity:' + (to >= 0 && to < WORLDS_VIEW.length ? 1 : 0.3);
        b.addEventListener('click', () => { if (!dead && to >= 0 && to < WORLDS_VIEW.length) { listWorld = to; renderList(); } });
        return b;
      };
      const hd = document.createElement('div');
      hd.style.cssText = 'flex:1;min-width:0';
      const h1 = document.createElement('div');
      h1.style.cssText = 'font-size:17px;font-weight:800;line-height:1.15';
      h1.textContent = th.emoji + ' Wereld ' + (wi + 1) + ': ' + th.name;
      const h2 = document.createElement('div');
      h2.style.cssText = 'font-size:12px;opacity:.8';
      h2.textContent = '⭐ ' + worldStars(wi) + ' / ' + (WORLD_SIZE * 3) + ' · levels ' + (wi * WORLD_SIZE + 1) + '–' + ((wi + 1) * WORLD_SIZE);
      hd.append(h1, h2);
      head.append(mk('◀', wi - 1), hd, mk('▶', wi + 1));
      card.appendChild(head);
      const bar2 = document.createElement('div');
      bar2.style.cssText = 'height:6px;border-radius:3px;background:rgba(255,255,255,.15);margin-bottom:10px;overflow:hidden';
      const fill = document.createElement('div');
      fill.style.cssText = 'height:100%;background:linear-gradient(90deg,' + th.bg[0] + ',#fde047);width:' + Math.round(worldStars(wi) / (WORLD_SIZE * 3) * 100) + '%';
      bar2.appendChild(fill);
      card.appendChild(bar2);
      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(6,1fr);gap:5px';
      const upto = Math.min(maxL, LEVEL_COUNT - 1);
      for (let i = wi * WORLD_SIZE; i < (wi + 1) * WORLD_SIZE; i++) {
        const b = document.createElement('button');
        const open = i <= upto;
        const st = starsOf(i);
        const special = i % WORLD_SIZE === WORLD_SIZE - 1 ? '👑' : '';
        b.style.cssText = 'border:0;border-radius:10px;padding:5px 0;font-size:14px;font-weight:800;color:#fff;font-family:inherit;touch-action:manipulation;cursor:' + (open ? 'pointer' : 'default') + ';background:' + (i === cur ? '#f59e0b' : open ? (st ? 'rgba(52,211,153,.35)' : 'rgba(255,255,255,.2)') : 'rgba(255,255,255,.06)') + ';opacity:' + (open ? 1 : 0.4);
        const num = document.createElement('div'); num.textContent = open ? (special || String(i + 1)) : '🔒';
        const stx = document.createElement('div'); stx.style.cssText = 'font-size:9px;height:11px'; stx.textContent = st ? '⭐'.repeat(st) : '';
        b.append(num, stx);
        if (open) b.addEventListener('click', () => { if (!dead) loadLevel(i); });
        grid.appendChild(b);
      }
      card.appendChild(grid);
      const nu = nextUnfinished(Math.min(cur, LEVEL_COUNT - 1));
      if (nu >= 0) ovBtn(card, '⏭ Volgende niet-gehaalde: ' + (nu + 1), () => loadLevel(nu), true);
      if (maxL >= LEVEL_COUNT) ovBtn(card, '♾️ Eindeloos: level ' + (maxL + 1), () => loadLevel(maxL), nu < 0);
      ovBtn(card, 'Terug naar het spel', () => { overlay.style.display = 'none'; }, false);
    }

    // ----- tekenen -----
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, sp = 40, ox = 0, oy = 0, minx = 0, miny = 0;
    function layout() {
      W = wrap.clientWidth || api.w; H = wrap.clientHeight || api.h * 0.7;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      if (!board) return;
      let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
      board.cells.forEach((c) => { mnx = Math.min(mnx, c.x); mxx = Math.max(mxx, c.x); mny = Math.min(mny, c.y); mxy = Math.max(mxy, c.y); });
      const bw = mxx - mnx + 1.3, bh = mxy - mny + 1.3;
      sp = Math.max(20, Math.min((W - 16) / bw, (H - 40) / bh, 70));
      minx = mnx; miny = mny;
      ox = (W - (mxx - mnx) * sp) / 2;
      oy = (H - 26 - (mxy - mny) * sp) / 2 + 4;
    }
    function cellXY(i) {
      const c = board.cells[i];
      return { x: ox + (c.x - minx) * sp, y: oy + (c.y - miny) * sp };
    }
    function cellAt(px, py) {
      let best = -1, bd = sp * 0.62;
      for (let i = 0; i < board.n; i++) {
        const p = cellXY(i);
        const d = Math.hypot(p.x - px, p.y - py);
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    }
    function burst(x, y, h, n, power) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.283, v = (40 + Math.random() * 90) * power * (sp / 50);
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: 0, max: 0.5 + Math.random() * 0.4, col: 'hsl(' + h + ',90%,65%)', size: 2 + Math.random() * 3, txt: null, rot: 0, vr: 0 });
      }
    }
    function confetti() {
      const cols = [0, 40, 120, 190, 270, 320];
      for (let i = 0; i < 70; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = 160 + Math.random() * 320;
        parts.push({ x: W / 2, y: H * 0.55, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 1.4 + Math.random() * 1, col: 'hsl(' + cols[i % cols.length] + ',90%,60%)', size: 4 + Math.random() * 4, txt: i % 7 === 0 ? '⭐' : null, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12 });
      }
    }
    function drawPeg(x, y, r, h, lift, alpha = 1, glow = false) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.beginPath(); ctx.ellipse(x + 2, y + r * 0.55 + 1, r * 0.9, r * 0.45, 0, 0, 6.283); ctx.fill();
      if (glow) { ctx.shadowColor = 'hsl(' + h + ',100%,70%)'; ctx.shadowBlur = 16; }
      const yy = y - lift;
      const g = ctx.createRadialGradient(x - r * 0.35, yy - r * 0.4, r * 0.1, x, yy, r);
      g.addColorStop(0, 'hsl(' + h + ',95%,82%)');
      g.addColorStop(0.55, 'hsl(' + h + ',80%,55%)');
      g.addColorStop(1, 'hsl(' + h + ',75%,35%)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, yy, r, 0, 6.283); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath(); ctx.ellipse(x - r * 0.32, yy - r * 0.38, r * 0.25, r * 0.15, -0.6, 0, 6.283); ctx.fill();
      ctx.restore();
    }
    let lastT = performance.now(), raf = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      if (!board || !W) return;
      if (anim && now - anim.t0 >= anim.dur) landed();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // plaat
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,.35)';
      ctx.lineWidth = sp * 0.95;
      ctx.beginPath();
      board.links.forEach(([a, b]) => { const p = cellXY(a), q = cellXY(b); ctx.moveTo(p.x + 2, p.y + 5); ctx.lineTo(q.x + 2, q.y + 5); });
      board.cells.forEach((_, i) => { const p = cellXY(i); ctx.moveTo(p.x + 2, p.y + 5); ctx.lineTo(p.x + 2.1, p.y + 5); });
      ctx.stroke();
      ctx.strokeStyle = theme.wood[0];
      ctx.lineWidth = sp * 0.95;
      ctx.beginPath();
      board.links.forEach(([a, b]) => { const p = cellXY(a), q = cellXY(b); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); });
      board.cells.forEach((_, i) => { const p = cellXY(i); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 0.1, p.y); });
      ctx.stroke();
      ctx.strokeStyle = theme.wood[1];
      ctx.lineWidth = sp * 0.86;
      ctx.stroke();
      // gaten
      for (let i = 0; i < board.n; i++) {
        const p = cellXY(i);
        const g = ctx.createRadialGradient(p.x, p.y + 2, 1, p.x, p.y, sp * 0.3);
        g.addColorStop(0, '#2a1608'); g.addColorStop(1, '#5c3a1c');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, sp * 0.29, 0, 6.283); ctx.fill();
        if (i === lv.goal) {
          ctx.fillStyle = '#fde047'; ctx.font = Math.round(sp * 0.4) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('⭐', p.x, p.y + 1);
        }
      }
      // bestemmingen
      const pulse = 0.5 + 0.5 * Math.sin(now / 160);
      let dests = [];
      if (sel >= 0 && !won) dests = movesFrom(sel);
      if (hintMove && now > hintUntil) hintMove = null;
      dests.forEach((m) => {
        const p = cellXY(m[2]);
        const isHint = hintMove && hintMove[0] === m[0] && hintMove[2] === m[2];
        ctx.strokeStyle = isHint ? '#fde047' : '#4ade80';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 + 0.5 * pulse;
        ctx.beginPath(); ctx.arc(p.x, p.y, sp * (0.31 + 0.06 * pulse), 0, 6.283); ctx.stroke();
        ctx.fillStyle = isHint ? 'rgba(253,224,71,.25)' : 'rgba(74,222,128,.22)';
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      // pinnen
      const r = sp * 0.36;
      for (let i = 0; i < board.n; i++) {
        if (!pegs[i]) continue;
        if (anim && anim.to === i) continue;
        if (drag && drag.moved && drag.cell === i) continue;
        const p = cellXY(i);
        const isSel = sel === i;
        const isHintPeg = hintMove && hintMove[0] === i;
        const lift = isSel ? 4 + 2 * pulse : 0;
        drawPeg(p.x, p.y, r, hue[i], lift, 1, isSel || isHintPeg);
      }
      // gepakte pinnen die verdwijnen
      for (let k = fx.length - 1; k >= 0; k--) {
        const f = fx[k];
        const q = (now - f.t0) / f.dur;
        if (q >= 1) { fx.splice(k, 1); continue; }
        const p = cellXY(f.cell);
        ctx.save();
        ctx.translate(p.x, p.y - q * sp * 0.4);
        ctx.rotate(q * 3);
        drawPeg(0, 0, r * (1 - q * 0.8), f.h, 0, 1 - q);
        ctx.restore();
      }
      // springende pin
      if (anim) {
        const q = Math.min(1, (now - anim.t0) / anim.dur);
        const e = q * q * (3 - 2 * q);
        const a = cellXY(anim.from), b = cellXY(anim.to);
        const x = a.x + (b.x - a.x) * e, y = a.y + (b.y - a.y) * e;
        drawPeg(x, y, r * (1 + 0.18 * Math.sin(q * Math.PI)), anim.h, Math.sin(q * Math.PI) * sp * 0.6, 1, true);
      }
      // slepende pin
      if (drag && drag.moved) {
        drawPeg(drag.x, drag.y, r * 1.12, hue[drag.cell], 10, 1, true);
      }
      // deeltjes
      for (let k = parts.length - 1; k >= 0; k--) {
        const pt = parts[k];
        pt.life += dt;
        if (pt.life >= pt.max) { parts.splice(k, 1); continue; }
        pt.vy += 520 * dt;
        pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.rot += pt.vr * dt;
        ctx.globalAlpha = Math.max(0, 1 - pt.life / pt.max);
        if (pt.txt) {
          ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(pt.txt, pt.x, pt.y);
        } else {
          ctx.save(); ctx.translate(pt.x, pt.y); ctx.rotate(pt.rot);
          ctx.fillStyle = pt.col; ctx.fillRect(-pt.size, -pt.size * 0.6, pt.size * 2, pt.size * 1.2);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }
    }

    // ----- invoer -----
    function evPos(e) {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (W / (r.width || W)), y: (e.clientY - r.top) * (H / (r.height || H)) };
    }
    function tryJumpTo(cell) {
      if (sel < 0 || cell < 0) return false;
      const m = movesFrom(sel).find((x) => x[2] === cell);
      if (!m) return false;
      jump(m);
      return true;
    }
    cv.addEventListener('pointerdown', (e) => {
      if (dead || anim || won || !board) return;
      audio();
      const p = evPos(e);
      const c = cellAt(p.x, p.y);
      if (c < 0) { sel = -1; return; }
      if (pegs[c]) {
        if (!movesFrom(c).length) {
          sel = -1; tone(180, 0.12, 'triangle', 0.03);
          say('Deze pin kan nergens heen', 1200);
          return;
        }
        const was = sel === c;
        sel = c;
        drag = { cell: c, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false, was };
        try { cv.setPointerCapture(e.pointerId); } catch (err) { /* niets */ }
        tone(520, 0.05, 'sine', 0.025);
      } else if (!tryJumpTo(c)) {
        sel = -1;
      }
    });
    cv.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const p = evPos(e);
      drag.x = p.x; drag.y = p.y;
      if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) > 8) drag.moved = true;
    });
    function endDrag(e, cancel) {
      if (!drag) return;
      const d = drag; drag = null;
      if (cancel || anim || dead) return;
      const p = evPos(e);
      if (d.moved) {
        tryJumpTo(cellAt(p.x, p.y));
      } else if (d.was) {
        sel = -1;
      }
    }
    cv.addEventListener('pointerup', (e) => endDrag(e, false));
    cv.addEventListener('pointercancel', (e) => endDrag(e, true));

    function onKey(e) {
      if (dead) return;
      if (e.key === 'z' || e.key === 'Backspace') undo();
      else if (e.key === 'r') resetLevel();
      else if (e.key === 'h') doHint();
    }
    window.addEventListener('keydown', onKey);
    let ro = null;
    const onResize = () => layout();
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(onResize); ro.observe(wrap); }
    else window.addEventListener('resize', onResize);

    // ----- start -----
    api.score(0);
    titleEl.textContent = 'Pinnenspel';
    subEl.textContent = 'Laden…';
    function start(saved) {
      if (saved && typeof saved === 'object') {
        const oldS = typeof saved.s === 'string' ? saved.s.replace(/[^0-3]/g, '') : '';
        if (saved.v === 2) {
          maxL = Math.max(0, Math.floor(+saved.m) || 0);
          starsStr = oldS.slice(0, LEVEL_COUNT);
          cur = Math.min(Math.max(0, Math.floor(+saved.l) || 0), maxL);
        } else {
          // oude save (62 levels): verspreid over de eerste helft van de nieuwe levels, zodat sterren en voortgang blijven
          const mapIdx = (i) => Math.floor(i * 150 / 62);
          const arr = new Array(LEVEL_COUNT).fill('0');
          for (let i = 0; i < oldS.length && i < 62; i++) if (oldS[i] !== '0') arr[mapIdx(i)] = oldS[i];
          starsStr = arr.join('').replace(/0+$/, '');
          const om = Math.max(0, Math.floor(+saved.m) || 0), ol = Math.max(0, Math.floor(+saved.l) || 0);
          maxL = om >= 62 ? mapIdx(61) + 1 : mapIdx(om);
          cur = Math.min(ol >= 62 ? maxL : mapIdx(ol), maxL);
        }
        maxL = Math.min(maxL, LEVEL_COUNT + 100000);
        extra = Math.max(0, Math.floor(+saved.e) || 0);
        hints = Math.min(8, Math.max(0, saved.h === undefined ? 5 : Math.floor(+saved.h) || 0));
      }
      ready = true;
      layout();
      loadLevel(cur);
    }
    layout();
    let loaded = false;
    const begin = (s) => { if (dead || loaded) return; loaded = true; start(s); };
    try {
      Promise.resolve(api.load()).then(begin, () => begin(null));
    } catch (e) { begin(null); }
    raf = requestAnimationFrame(frame);

    return {
      destroy() {
        dead = true;
        cancelAnimationFrame(raf);
        clearTimeout(msgTimer);
        window.removeEventListener('keydown', onKey);
        if (ro) ro.disconnect(); else window.removeEventListener('resize', onResize);
        persist();
        if (ac) { try { ac.close(); } catch (e) { /* niets */ } }
        parts.length = 0; fx.length = 0;
        root.remove();
      },
    };
  },
};
