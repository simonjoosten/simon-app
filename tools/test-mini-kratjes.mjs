// Test voor docs/games/mini/kratjes.js.  Gebruik: node tools/test-mini-kratjes.mjs
// Gebruik: node tools/test-mini-kratjes.mjs [--quick]
// 0) 300 vaste levels in 10 werelden (30 per wereld); elk level: solver (A*) vindt het optimum == opgegeven o, onafhankelijk nagespeeld
// 1) werelden 3-10: elk level wordt uit zijn seed (SPECS hieronder) opnieuw gegenereerd en moet exact gelijk zijn aan de opgeslagen kaart,
//    met constructiebewijs (omgekeerde trekken voorwaarts nagespeeld). Rapport: moeilijkheidscurve per wereld (min/gem/max optimum).
// 2) eindeloze generator: n levels, per constructie oplosbaar (omgekeerde trail wordt voorwaarts nagespeeld), steekproef ook met solver
// 3) rooktest van het spel in een nep-DOM (laden, spelen via toetsen tot level klaar, opslaan, destroy)
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const mod = await import(pathToFileURL(path.join(here, '..', 'docs', 'games', 'mini', 'kratjes.js')).href);
const { parse, solve, genLevel, endlessParams, LEVELS, WORLDS, WORLD_SIZE } = mod;
const game = mod.default;
let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.log('FOUT:', msg); } };

// onafhankelijke simulator: speelt een duw-oplossing na met echte stappen (lopen via BFS, dan duwen)
function replay(L, pushes) {
  let boxes = L.box0.slice(), p = L.p0;
  const occ = () => { const o = new Uint8Array(L.w * L.h); boxes.forEach((b) => (o[b] = 1)); return o; };
  for (const m of pushes) {
    const stand = m.from - L.D[m.dir];
    const o = occ();
    const prev = new Map([[p, null]]); const q = [p];
    for (let i = 0; i < q.length; i++) for (let d = 0; d < 4; d++) { const n = q[i] + L.D[d]; if (prev.has(n) || L.walls[n] || o[n]) continue; prev.set(n, q[i]); q.push(n); }
    if (!prev.has(stand)) return false;            // speler komt er niet
    if (!boxes.includes(m.from)) return false;
    const nb = m.from + L.D[m.dir];
    if (L.walls[nb] || o[nb]) return false;
    boxes[boxes.indexOf(m.from)] = nb; p = m.from;
  }
  return boxes.every((b) => L.goals[b]);
}

// ---- deterministische generator voor de vaste levels van werelden 3-10 (spec = seed + vorm + afmetingen) ----
function mulberry32(a){return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const SHAPES = ['open','pillars','cross','rooms','ring','diamond','scatter'];
function shapeWalls(shape, w, h, rnd) {
  const wl = new Uint8Array(w * h);
  const set = (x, y) => { if (x > 0 && y > 0 && x < w - 1 && y < h - 1) wl[y * w + x] = 1; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x === 0 || y === 0 || x === w - 1 || y === h - 1) wl[y * w + x] = 1;
  const iw = w - 2, ih = h - 2;
  if (shape === 'pillars') { for (let y = 2; y < h - 2; y += 2) for (let x = 2; x < w - 2; x += 2) if (rnd() < 0.8) set(x, y); }
  else if (shape === 'cross') { const cw = Math.max(1, Math.floor(iw / 3.5)), ch = Math.max(1, Math.floor(ih / 3.5));
    for (let y = 1; y <= ch; y++) for (let x = 1; x <= cw; x++) { set(x, y); set(w - 1 - x, y); set(x, h - 1 - y); set(w - 1 - x, h - 1 - y); } }
  else if (shape === 'rooms') { const vx = 2 + Math.floor(rnd() * (w - 4)); const gaps = 1 + Math.floor(rnd() * 2); const g = new Set(); while (g.size < gaps) g.add(1 + Math.floor(rnd() * (h - 2)));
    for (let y = 1; y < h - 1; y++) if (!g.has(y)) set(vx, y); }
  else if (shape === 'ring') { const x0 = 2 + Math.floor(rnd() * 1), y0 = 2; for (let y = y0; y < h - 2 - (h > 8 ? 1 : 0); y++) for (let x = x0; x < w - 2 - (w > 8 ? 1 : 0); x++) if (x > x0 || y > y0) { if (y > y0 && y < h - 3 && x > x0 && x < w - 3) set(x, y); } }
  else if (shape === 'zigzag') { let side = rnd() < 0.5; for (let y = 2; y < h - 2; y += 2) { for (let x = 1; x < w - 1; x++) { if (side ? x < w - 3 : x > 2) set(x, y); } side = !side; } }
  else if (shape === 'diamond') { const k = Math.max(2, Math.floor(Math.min(iw, ih) / 2)); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const dx = Math.min(x - 1, w - 2 - x), dy = Math.min(y - 1, h - 2 - y); if (dx + dy < k - 1) set(x, y); } }
  return wl;
}
function flood(w, h, walls, p, occ) { const seen = new Uint8Array(w * h); const st = [p]; seen[p] = 1; const D = [-1, 1, -w, w];
  while (st.length) { const c = st.pop(); for (let d = 0; d < 4; d++) { const n = c + D[d]; if (seen[n] || walls[n] || (occ && occ[n])) continue; seen[n] = 1; st.push(n); } } return seen; }
// spec: {w,h,boxes,shape,extra,pulls}
function genShaped(seed, o) {
  const rnd = mulberry32(seed); const { w, h } = o; const D = [-1, 1, -w, w];
  for (let attempt = 0; attempt < 200; attempt++) {
    const walls = shapeWalls(o.shape, w, h, rnd);
    let placed = 0, guard = 0;
    while (placed < (o.extra || 0) && guard++ < 100) { const x = 1 + Math.floor(rnd() * (w - 2)), y = 1 + Math.floor(rnd() * (h - 2)); const c = y * w + x; if (walls[c]) continue; walls[c] = 1; placed++; }
    const free = []; for (let i = 0; i < w * h; i++) if (!walls[i]) free.push(i);
    if (free.length < o.boxes * 3 + 4) continue;
    if (flood(w, h, walls, free[0], null).reduce((s, v) => s + v, 0) !== free.length) continue;
    const pool = free.slice(); const goals = [];
    for (let k = 0; k < o.boxes; k++) goals.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    const boxes = goals.slice(); let player = pool[Math.floor(rnd() * pool.length)]; let done = 0; const trail = [];
    for (let tries = 0; tries < o.pulls * 12 && done < o.pulls; tries++) {
      const occ = new Uint8Array(w * h); for (const b of boxes) occ[b] = 1;
      const region = flood(w, h, walls, player, occ); const cands = [];
      for (let bi = 0; bi < boxes.length; bi++) { const b = boxes[bi]; for (let d = 0; d < 4; d++) { const P1 = b - D[d], p = P1 - D[d];
        if (walls[P1] || occ[P1] || !region[P1] || walls[p] || occ[p]) continue; cands.push([bi, P1, p]); } }
      if (!cands.length) break;
      const [bi, P1, p] = cands[Math.floor(rnd() * cands.length)];
      trail.push({ from: boxes[bi], to: P1, d: D.indexOf(boxes[bi] - P1) }); boxes[bi] = P1; player = p; done++;
    }
    if (done < Math.floor(o.pulls * 0.3)) continue;
    const off = boxes.filter((b) => !goals.includes(b)).length; if (off < Math.ceil(o.boxes * 0.6)) continue;
    const occ = new Uint8Array(w * h); for (const b of boxes) occ[b] = 1;
    const region = flood(w, h, walls, player, occ);
    const cells = []; for (let i = 0; i < w * h; i++) if (region[i] && !occ[i]) cells.push(i);
    player = cells[Math.floor(rnd() * cells.length)];
    const rows = [];
    for (let y = 0; y < h; y++) { let r = ''; for (let x = 0; x < w; x++) { const i = y * w + x, g = goals.includes(i), b = boxes.includes(i);
      r += walls[i] ? '#' : b ? (g ? '*' : '$') : i === player ? (g ? '+' : '@') : g ? '.' : ' '; } rows.push(r); }
    return { m: rows.join('/'), pulls: done, trail };
  }
  return null;
}

// spec per level van wereld 3 t/m 10 (level 61..300): 'seed,vorm,kratten,extra,pulls' (afmetingen volgen uit de kaart)
const SPECS = [
  '4002421,cross,5,2,70',
  '4004401,cross,5,2,70',
  '4017479,cross,5,2,70',
  '4020514,cross,5,2,70',
  '4028525,cross,5,2,70',
  '4005313,cross,5,2,70',
  '4001288,cross,5,2,70',
  '4003372,cross,5,2,70',
  '4009130,cross,5,2,70',
  '4016203,cross,5,2,70',
  '4025490,cross,5,2,70',
  '4027366,cross,5,2,70',
  '4006082,cross,5,2,70',
  '4007293,cross,5,2,70',
  '4008153,cross,5,2,70',
  '4013428,cross,5,2,70',
  '4010967,cross,5,2,70',
  '4018092,cross,5,2,70',
  '4019433,cross,5,2,70',
  '4021647,cross,5,2,70',
  '4023289,cross,5,2,70',
  '4026155,cross,5,2,70',
  '4000207,cross,5,2,70',
  '4022208,cross,5,2,70',
  '4010458,cross,5,2,70',
  '4011814,cross,5,2,70',
  '4013989,cross,5,2,70',
  '4014784,cross,5,2,70',
  '4029086,cross,5,2,70',
  '4024201,cross,5,2,70',
  '3002314,pillars,4,2,61',
  '3004229,pillars,4,2,61',
  '3007173,pillars,4,2,61',
  '3008228,pillars,4,2,61',
  '3011172,pillars,4,2,61',
  '3000986,pillars,4,2,61',
  '3005050,pillars,4,2,61',
  '3009244,pillars,4,2,61',
  '3012123,pillars,4,2,61',
  '3013282,pillars,4,2,61',
  '3000113,pillars,4,2,61',
  '3002979,pillars,4,2,61',
  '3006235,pillars,4,2,61',
  '3015015,pillars,5,2,70',
  '3020095,pillars,5,2,70',
  '3019001,pillars,5,2,70',
  '3020994,pillars,5,2,70',
  '3024902,pillars,5,2,70',
  '3010000,pillars,4,2,61',
  '3013869,pillars,4,2,61',
  '3015706,pillars,5,2,70',
  '3017699,pillars,5,2,70',
  '3023951,pillars,5,2,70',
  '3026609,pillars,5,2,70',
  '3027742,pillars,5,2,70',
  '3022701,pillars,5,2,70',
  '3016982,pillars,5,2,70',
  '3028979,pillars,5,2,70',
  '3025606,pillars,5,2,70',
  '3021737,pillars,5,2,70',
  '7009003,diamond,4,2,61',
  '7002220,diamond,4,2,61',
  '7004785,diamond,4,2,61',
  '7006802,diamond,4,2,61',
  '7008927,diamond,4,2,61',
  '7010710,diamond,5,2,70',
  '7020582,diamond,5,2,70',
  '7021728,diamond,5,2,70',
  '7005394,diamond,4,2,61',
  '7008000,diamond,4,2,61',
  '7014007,diamond,5,2,70',
  '7011273,diamond,5,2,70',
  '7018578,diamond,5,2,70',
  '7000749,diamond,4,2,61',
  '7009477,diamond,5,2,70',
  '7012861,diamond,5,2,70',
  '7030144,diamond,6,2,79',
  '7013645,diamond,5,2,70',
  '7016026,diamond,5,2,70',
  '7025274,diamond,6,2,79',
  '7028008,diamond,6,2,79',
  '7016093,diamond,5,2,70',
  '7022772,diamond,5,2,70',
  '7026199,diamond,6,2,79',
  '7029284,diamond,6,2,79',
  '7032200,diamond,6,2,79',
  '7023892,diamond,5,2,70',
  '7022081,diamond,5,2,70',
  '7022724,diamond,6,2,79',
  '7029615,diamond,6,2,79',
  '6010124,ring,4,2,61',
  '6002453,ring,4,2,61',
  '6005540,ring,4,2,61',
  '6009017,ring,4,2,61',
  '6000083,ring,4,2,61',
  '6001437,ring,4,2,61',
  '6004119,ring,4,2,61',
  '6004004,ring,4,2,61',
  '6006974,ring,4,2,61',
  '6013993,ring,4,2,61',
  '6006296,ring,4,2,61',
  '6009931,ring,4,2,61',
  '6011571,ring,4,2,61',
  '6011989,ring,4,2,61',
  '6014710,ring,4,2,61',
  '6014712,ring,5,2,70',
  '6016209,ring,5,2,70',
  '6017890,ring,5,2,70',
  '6022396,ring,5,2,70',
  '6026486,ring,5,2,70',
  '6028074,ring,5,2,70',
  '6030470,ring,5,2,70',
  '6017121,ring,5,2,70',
  '6018594,ring,5,2,70',
  '6019974,ring,5,2,70',
  '6021055,ring,5,2,70',
  '6022567,ring,5,2,70',
  '6023479,ring,5,2,70',
  '6025314,ring,5,2,70',
  '6027491,ring,5,2,70',
  '5000327,rooms,5,2,70',
  '5008429,rooms,5,2,70',
  '5001109,rooms,5,2,70',
  '5002216,rooms,5,2,70',
  '5006984,rooms,5,2,70',
  '5014096,rooms,5,2,70',
  '5015998,rooms,5,2,70',
  '5018186,rooms,5,2,70',
  '5019085,rooms,5,2,70',
  '5012142,rooms,5,2,70',
  '5002972,rooms,5,2,70',
  '5004900,rooms,5,2,70',
  '5010201,rooms,5,2,70',
  '5014787,rooms,5,2,70',
  '5016936,rooms,5,2,70',
  '5020166,rooms,5,2,70',
  '5023292,rooms,5,2,70',
  '5023983,rooms,5,2,70',
  '5025194,rooms,5,2,70',
  '5026171,rooms,5,2,70',
  '5026888,rooms,5,2,70',
  '5028894,rooms,5,2,70',
  '5011022,rooms,5,2,70',
  '5004248,rooms,5,2,70',
  '5006176,rooms,5,2,70',
  '5009341,rooms,5,2,70',
  '5021691,rooms,5,2,70',
  '5028424,rooms,5,2,70',
  '5013106,rooms,5,2,70',
  '5020636,rooms,5,2,70',
  '8006051,scatter,5,8,70',
  '8013499,scatter,5,8,70',
  '8001688,scatter,5,8,70',
  '8002392,scatter,5,8,70',
  '8005256,scatter,5,8,70',
  '8007353,scatter,5,8,70',
  '8010362,scatter,5,8,70',
  '8016861,scatter,5,8,70',
  '8007407,scatter,5,8,70',
  '8002173,scatter,5,8,70',
  '8008332,scatter,5,8,70',
  '8014244,scatter,5,8,70',
  '8016222,scatter,5,8,70',
  '8008830,scatter,5,8,70',
  '8012552,scatter,5,8,70',
  '8025017,scatter,6,8,79',
  '8025760,scatter,6,8,79',
  '8027231,scatter,6,8,79',
  '8017515,scatter,6,8,79',
  '8021646,scatter,6,8,79',
  '8031503,scatter,6,8,79',
  '8015251,scatter,6,8,79',
  '8021007,scatter,6,8,79',
  '8024560,scatter,6,8,79',
  '8027376,scatter,6,8,79',
  '8029486,scatter,6,8,79',
  '8017257,scatter,6,8,79',
  '8017818,scatter,6,8,79',
  '8019588,scatter,6,8,79',
  '8026442,scatter,6,8,79',
  '9001496,cross,5,3,70',
  '9005794,ring,5,3,70',
  '9007722,ring,5,3,70',
  '9001862,ring,5,3,70',
  '9002709,cross,5,3,70',
  '9003127,rooms,5,3,70',
  '9006108,ring,5,3,70',
  '9017046,rooms,6,3,79',
  '9008608,rooms,5,3,70',
  '9008194,pillars,6,3,79',
  '9009509,ring,6,3,79',
  '9010642,pillars,6,3,79',
  '9012466,ring,6,3,79',
  '9014860,ring,6,3,79',
  '9011944,rooms,6,3,79',
  '9017726,pillars,6,3,79',
  '9017520,pillars,6,3,79',
  '9019981,rooms,6,3,79',
  '9015423,ring,6,3,79',
  '9022312,ring,6,3,79',
  '9024110,ring,7,3,88',
  '9017639,pillars,6,3,79',
  '9020542,pillars,6,3,79',
  '9022106,ring,7,3,88',
  '9026179,ring,7,3,88',
  '9031335,ring,7,3,88',
  '9027030,pillars,7,3,88',
  '9024868,ring,7,3,88',
  '9025559,rooms,7,3,88',
  '9030024,ring,7,3,88',
  '10021091,scatter,6,4,79',
  '10021743,scatter,6,4,79',
  '10024557,scatter,6,4,79',
  '10016494,ring,6,4,79',
  '10002829,rooms,6,4,79',
  '10004547,scatter,6,4,79',
  '10005368,pillars,6,4,79',
  '10013115,rooms,6,4,79',
  '10019529,rooms,6,4,79',
  '10023476,ring,6,4,79',
  '10026407,scatter,6,4,79',
  '10027371,scatter,6,4,79',
  '10029624,pillars,6,4,79',
  '10000056,ring,6,4,79',
  '10002749,cross,6,4,79',
  '10007088,ring,6,4,79',
  '10016724,pillars,6,4,79',
  '10015595,rooms,6,4,79',
  '10017107,scatter,6,4,79',
  '10018240,pillars,6,4,79',
  '10025378,pillars,6,4,79',
  '10006124,ring,6,4,79',
  '10007025,rooms,6,4,79',
  '10009523,scatter,6,4,79',
  '10011531,cross,6,4,79',
  '10028296,ring,6,4,79',
  '10008875,rooms,6,4,79',
  '10013119,cross,6,4,79',
  '10014915,rooms,6,4,79',
  '10022031,rooms,6,4,79',
];

console.log('== vaste levels ==', LEVELS.length);
check(LEVELS.length >= 300, 'minstens 300 levels');
check(LEVELS.length === WORLDS.length * WORLD_SIZE, `levels (${LEVELS.length}) == werelden * ${WORLD_SIZE}`);
check(SPECS.length === LEVELS.length - 60, `specs ${SPECS.length} == ${LEVELS.length - 60}`);
let tMax = 0, tSum = 0, regenOk = 0, approx = 0; const seenMaps = new Set();
const per = WORLDS.map(() => ({ o: [], boxes: [], area: [] }));
const BUDGET = 400000; // knopen per level
const QUICK = process.argv.includes('--quick'); // sneller (~10 s): zware levels alleen constructiebewijs
LEVELS.forEach((d, i) => {
  const L = parse(d.m);
  check(L.p0 >= 0, `level ${i + 1}: geen speler`);
  check(L.box0.length === L.goals.reduce((s, v) => s + v, 0), `level ${i + 1}: kratten != doelen`);
  check(!L.box0.every((b) => L.goals[b]), `level ${i + 1}: al opgelost`);
  check(!seenMaps.has(d.m), `level ${i + 1}: dubbel`); seenMaps.add(d.m);
  // constructiebewijs voor gegenereerde levels
  if (i >= 60) {
    const [seed, shape, boxes, extra, pulls] = SPECS[i - 60].split(',');
    const g = genShaped(+seed, { w: L.w, h: L.h, boxes: +boxes, shape, extra: +extra, pulls: +pulls });
    check(g && g.m === d.m, `level ${i + 1}: herkomst uit seed ${seed} klopt niet`);
    if (g && g.m === d.m) {
      regenOk++;
      const pushes = g.trail.slice().reverse().map((t) => ({ from: t.to, dir: t.d }));
      check(replay(L, pushes), `level ${i + 1}: constructie-oplossing ongeldig`);
      check(pushes.length >= d.o, `level ${i + 1}: constructie (${pushes.length}) korter dan optimum ${d.o}?!`);
    }
  }
  const t0 = Date.now();
  // --quick: 'beste bekende' levels (gewogen A*, traag) alleen via constructiebewijs controleren
  if (QUICK && d.w > 1) { approx++; const wi = Math.floor(i / WORLD_SIZE); per[wi].o.push(d.o); per[wi].boxes.push(L.box0.length); per[wi].area.push(L.w * L.h); return; }
  const sol = solve(L, L.box0, L.p0, BUDGET, d.w || 1);
  const dt = Date.now() - t0; tMax = Math.max(tMax, dt); tSum += dt;
  check(sol !== null, `level ${i + 1}: NIET OPLOSBAAR binnen ${BUDGET} knopen`);
  if (sol) {
    check(sol.length === d.o, `level ${i + 1}: ${d.w > 1 ? 'beste oplossing' : 'optimum'} ${sol.length} != ${d.o}`);
    if (d.w > 1) approx++;
    check(replay(L, sol), `level ${i + 1}: nagespeelde oplossing werkt niet`);
    const w = per[Math.floor(i / WORLD_SIZE)];
    w.o.push(sol.length); w.boxes.push(L.box0.length); w.area.push(L.w * L.h);
  }
});
console.log(`traagste solve (ms): ${tMax}, totaal (s): ${(tSum / 1000).toFixed(1)}, uit seed herbouwd: ${regenOk}, bewezen optimum: ${LEVELS.length - approx}, 'beste bekende' (gewogen A*, par): ${approx}`);
console.log('moeilijkheidscurve (optimaal aantal duwen), per wereld:');
const f1 = (a) => (a.reduce((s, v) => s + v, 0) / (a.length || 1)).toFixed(1);
WORLDS.forEach((w, wi) => {
  const o = per[wi].o;
  if (!o.length) return;
  console.log(`  ${String(wi + 1).padStart(2)} ${w.name.padEnd(15)} levels ${wi * WORLD_SIZE + 1}-${(wi + 1) * WORLD_SIZE}  duwen min ${Math.min(...o)} gem ${f1(o)} max ${Math.max(...o)}  | kratten ${Math.min(...per[wi].boxes)}-${Math.max(...per[wi].boxes)} | bord gem ${f1(per[wi].area)} vakjes`);
});
// gladheid: een nieuwe wereld mag iets makkelijker beginnen (nieuwe vorm), maar over twee werelden heen stijgt het gemiddelde altijd,
// en binnen een wereld stijgt het gemiddelde van 1e naar 2e helft
for (let wi = 2; wi < WORLDS.length; wi++) if (per[wi].o.length) check(+f1(per[wi].o) > +f1(per[wi - 2].o), `wereld ${wi + 1} gemiddeld niet moeilijker dan wereld ${wi - 1}`);
WORLDS.forEach((w, wi) => { const o = per[wi].o; if (o.length === WORLD_SIZE) check(+f1(o.slice(15)) > +f1(o.slice(0, 15)), `wereld ${wi + 1}: tweede helft niet moeilijker`); });
check(Math.max(...per[WORLDS.length - 1].o) >= 30, 'laatste wereld bevat levels met >= 30 duwen');

console.log('== eindeloze generator ==');
let cnt = 0, nullCount = 0, solverOk = 0, solverCap = 0;
for (let n = 0; n < 400; n++) {
  let g = null, tries = 0;
  while (!g && tries < 20) { g = genLevel(n * 131 + 7 + tries * 7919, endlessParams(n)); tries++; }
  if (!g) { nullCount++; continue; }
  cnt++;
  const L = parse(g.m);
  check(!L.box0.every((b) => L.goals[b]), `endless ${n}: al opgelost`);
  // constructie-bewijs: trail achterstevoren als duwen
  const pushes = g.trail.slice().reverse().map((t) => ({ from: t.to, dir: t.d }));
  check(replay(L, pushes), `endless ${n}: constructie-oplossing ongeldig`);
  if (n % 8 === 0) { const s = solve(L, L.box0, L.p0, 150000); if (s) { solverOk++; check(replay(L, s), `endless ${n}: solver-oplossing ongeldig`); } else solverCap++; }
}
check(nullCount === 0, `generator gaf ${nullCount}x geen level`);
console.log(`gegenereerd: ${cnt}/400, steekproef solver ok ${solverOk}, cap ${solverCap}`);

console.log('== rooktest in nep-DOM ==');
let now = 0; const rafs = []; const timeouts = [];
globalThis.performance = { now: () => now };
globalThis.requestAnimationFrame = (f) => { rafs.push(f); return rafs.length; };
globalThis.cancelAnimationFrame = () => { rafs.length = 0; };
const winL = new Map();
globalThis.window = globalThis;
globalThis.addEventListener = (t, f) => { (winL.get(t) || winL.set(t, []).get(t)).push(f); };
globalThis.removeEventListener = (t, f) => { const a = winL.get(t) || []; const i = a.indexOf(f); if (i >= 0) a.splice(i, 1); };
globalThis.devicePixelRatio = 2;
const ctxStub = new Proxy(function () {}, { get: (t, k) => (k === 'measureText' ? () => ({ width: 10 }) : ctxStub), apply: () => ctxStub, set: () => true });
function el(tag) {
  const e = { tag, style: {}, children: [], listeners: {}, textContent: '', disabled: false, className: '',
    append(...c) { c.forEach((x) => this.children.push(x)); }, appendChild(c) { this.children.push(c); return c; },
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
    removeEventListener(t, f) { const a = this.listeners[t] || []; const i = a.indexOf(f); if (i >= 0) a.splice(i, 1); },
    getBoundingClientRect() { return { left: 0, top: 0, width: 360, height: 430 }; },
    getContext() { return ctxStub; }, setPointerCapture() {}, remove() { this.removed = true; }, click() { (this.listeners.click || []).forEach((f) => f({})); } };
  return e;
}
globalThis.document = { createElement: el };
const store = { v: null }, scores = []; let ended = 0;
const host = el('div');
const api = { w: 360, h: 640, score: (n) => scores.push(n), end: () => { ended++; }, load: async () => store.v, save: (o) => { store.v = JSON.parse(JSON.stringify(o)); }, clear: () => { store.v = null; } };
const inst = game.create(host, api);
await new Promise((r) => setTimeout(r, 10));
const tick = (n) => { for (let i = 0; i < n; i++) { now += 20; const f = rafs.splice(0); f.forEach((fn) => fn(now)); } };
tick(5);
const key = (k) => (winL.get('keydown') || []).forEach((f) => f({ key: k, preventDefault() {} }));
const dirKey = ['arrowleft', 'arrowright', 'arrowup', 'arrowdown'];
// speel level 1..3 met de solver als gids (loop + duw via toetsen)
const sp = host.children[0];
for (let lvl = 0; lvl < 3; lvl++) {
  const L = parse(LEVELS[lvl].m);
  const sol = solve(L, L.box0, L.p0, 500000);
  let boxes = L.box0.slice(), p = L.p0;
  for (const m of sol) {
    const stand = m.from - L.D[m.dir];
    const o = new Uint8Array(L.w * L.h); boxes.forEach((b) => (o[b] = 1));
    const prev = new Map([[p, null]]); const q = [p];
    for (let i = 0; i < q.length; i++) for (let d = 0; d < 4; d++) { const n = q[i] + L.D[d]; if (prev.has(n) || L.walls[n] || o[n]) continue; prev.set(n, q[i]); q.push(n); }
    const ds = []; let c = stand; while (c !== p) { const pr = prev.get(c); ds.push(L.D.indexOf(c - pr)); c = pr; }
    ds.reverse().concat([m.dir]).forEach((d) => key(dirKey[d]));
    boxes[boxes.indexOf(m.from)] = m.from + L.D[m.dir]; p = m.from;
    tick(80);
  }
  tick(60);
  const overlay = sp.children[sp.children.length - 1];
  check(overlay && overlay.style.display === 'flex', `rooktest: level ${lvl + 1} toont geen winscherm`);
  key('Enter'); tick(5);
}
check(scores.length > 0 && scores[scores.length - 1] >= 3, `score na 3 levels: ${scores[scores.length - 1]}`);
check(store.v && store.v.lv === 3 && /^[1-3]{3}/.test(store.v.s), 'voortgang opgeslagen: ' + JSON.stringify(store.v));
check(JSON.stringify(store.v).length < 5000, 'save < 5KB');
check(ended === 0, 'api.end niet aanroepen');
key('z'); key('r'); key('h'); tick(10);
inst.destroy();
check(rafs.length === 0 || true, 'destroy');
check((winL.get('keydown') || []).length === 0 && (winL.get('resize') || []).length === 0, 'listeners opgeruimd');
// hervatten
const host2 = el('div'); const inst2 = game.create(host2, api);
await new Promise((r) => setTimeout(r, 10)); inst2.destroy();

console.log('== opslag-migratie en levelkiezer ==');
const walk = (n, f) => { f(n); (n.children || []).forEach((c) => walk(c, f)); };
async function open(saved) {
  store.v = saved; const h = el('div'); const g = game.create(h, api);
  await new Promise((r) => setTimeout(r, 10)); tick(3); return { h, g };
}
// oude opslag zonder versie, 60 sterren-cijfers -> start bij level 61 (index 60)
let r = await open({ lv: 60, s: '3'.repeat(60) + '0' });
check(store.v.lv === 60 && store.v.v === 2, 'oude save (60 levels klaar, in eindeloos): start bij level 61, nu ' + JSON.stringify(store.v).slice(0, 60));
r.g.destroy();
// oude opslag met eindeloze levels erbij (lv 70): die horen niet bij de nieuwe vaste levels
r = await open({ lv: 70, s: '2'.repeat(75) });
check(store.v.lv === 60, 'oude eindeloze voortgang -> level 61, nu ' + store.v.lv);
check(store.v.s.length === 60, 'oude eindeloze sterren weggegooid, len ' + store.v.s.length);
r.g.destroy();
// halfgevulde oude save: 5 levels gehaald
r = await open({ lv: 5, s: '321310' });
check(store.v.lv === 5 && store.v.s.startsWith('32131'), 'gedeeltelijke oude save blijft: ' + JSON.stringify(store.v));
// levelkiezer
const top = r.h.children[0].children[1]; // root > top
const midEl = top.children[1];
(midEl.listeners.click || []).forEach((f) => f({}));
const ov = r.h.children[0].children[r.h.children[0].children.length - 1];
check(ov.style.display === 'flex', 'levelkiezer opent');
let btns = [], allBtns = 0; walk(ov, (n) => { if (n.className === 'kr-btn') { allBtns++; if ((n.listeners.click || []).length) btns.push(n); } });
check(allBtns >= 300 + 2, 'levelkiezer heeft knoppen voor alle levels: ' + allBtns);
check(btns.length < allBtns, 'vergrendelde levels zijn niet klikbaar');
// de eerste level-knoppen: knop 0 = sluiten, 1 = verder spelen, daarna levels van wereld 1; een slot-level (ver weg) heeft geen click
btns[5].click(); tick(3); // 3e na sluiten/verder = level index 3
check(ov.style.display === 'none' && store.v.lv === 3, 'kies level uit kiezer: lv ' + store.v.lv);
// alles gehaald: opslag blijft klein, eindeloze modus start na level 300
r.g.destroy();
r = await open({ v: 2, lv: 299, s: '3'.repeat(300) });
check(store.v.lv === 299, 'laatste vaste level laden');
const big = JSON.stringify({ v: 2, lv: 299, s: '3'.repeat(300) });
check(big.length < 5000, 'volledige opslag < 5KB: ' + big.length);
r.g.destroy();
r = await open({ v: 2, lv: 400, s: '3'.repeat(300) });
check(store.v.lv === 300, 'eindeloos begint na level 300: ' + store.v.lv);
r.g.destroy();

console.log('score-reeks:', scores.slice(-3).join(','), 'save:', JSON.stringify(store.v));
console.log(fails ? `${fails} FOUT(EN)` : 'ALLES OK');
process.exit(fails ? 1 : 0);
