// Test voor docs/games/mini/pinnen.js: ALLE vaste levels (constructiebewijs of opgeslagen oplossing herspelen
// + onafhankelijke oplosser met tijdsbudget per level) en een rapport van de moeilijkheidscurve per wereld.
// Budget per level: PIN_MS (standaard 400 ms). Voorbeeld: PIN_MS=5000 node tools/test-mini-pinnen.mjs
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const M = await import(pathToFileURL(path.join(here, '..', 'docs', 'games', 'mini', 'pinnen.js')).href);
const { makeLevel, solve, LEVEL_COUNT, SPECS, buildBoard, WORLDS, WORLD_SIZE, SOLS, worldOf } = M._logic;
const MS = +process.env.PIN_MS || 400;

assert.equal(M.default.id, 'pinnen');
assert.equal(M.default.save, 'forever');
assert.equal(typeof M.default.create, 'function');
assert.ok(LEVEL_COUNT >= 300, 'minstens 300 levels');
assert.equal(LEVEL_COUNT, WORLDS.length * WORLD_SIZE);
assert.equal(M.themeOf(0).name, WORLDS[0].name);
assert.equal(M.themeOf(LEVEL_COUNT).name, 'Eindeloos');

function replay(lv, sol) {
  const st = lv.start.slice();
  for (const [a, o, t] of sol) {
    assert.ok(st[a] && st[o] && !st[t], 'ongeldige zet in oplossing');
    assert.ok(lv.board.moves.some((m) => m[0] === a && m[1] === o && m[2] === t), 'zet bestaat niet op bord');
    st[a] = 0; st[o] = 0; st[t] = 1;
  }
  assert.equal(st.reduce((x, y) => x + y, 0), 1, 'moet 1 pin overhouden');
  if (lv.goal >= 0) assert.ok(st[lv.goal], 'laatste pin moet in doel');
}

// borden zijn geldig
for (const id of Object.keys(M._logic.BOARD_DEFS)) {
  const b = buildBoard(id);
  assert.ok(b.n >= 5 && b.moves.length > 0, id);
}

const t0 = Date.now();
const stats = WORLDS.map(() => ({ len: [], proof: 0, solver: 0, goal: 0, boards: new Set(), open: [] }));
let unverified = 0;
for (let n = 0; n < LEVEL_COUNT + 60; n++) {
  const lv = makeLevel(n);
  assert.equal(lv, makeLevel(n), 'cache');
  const pegsN = lv.start.reduce((x, y) => x + y, 0);
  assert.ok(pegsN >= 2, 'level ' + n + ' te simpel');
  assert.equal(pegsN, lv.k);
  const spec = n < LEVEL_COUNT ? SPECS[n] : null;
  if (spec && spec.k) assert.equal(lv.k, spec.k, 'level ' + (n + 1) + ' haalt doel-aantal pinnen niet (' + spec.board + ')');
  let proven = false;
  if (lv.sol) {
    assert.equal(lv.sol.length, pegsN - 1);
    replay(lv, lv.sol);
    proven = true;
  } else assert.ok(!spec || !spec.hole, 'klassiek level ' + (n + 1) + ' mist opgeslagen oplossing');
  // onafhankelijke oplosser met tijdsbudget (voor het bewijs niet nodig, wel een extra controle)
  const r = solve(lv.board, lv.start, lv.goal, 3e7, MS);
  if (r.sol) replay(lv, r.sol);
  else assert.ok(r.aborted && proven, 'level ' + (n + 1) + ': oplosser vindt niets terwijl het niet bewezen is');
  if (!r.sol) unverified++;
  if (n < LEVEL_COUNT) {
    const s = stats[worldOf(n)];
    s.len.push(pegsN - 1);
    if (r.sol) s.solver++;
    s.proof++;
    if (lv.goal >= 0) s.goal++;
    s.boards.add(lv.board.id);
    if (lv.open !== undefined) s.open.push(lv.open);
  }
}
// opgeslagen oplossingen zijn allemaal in gebruik
for (const key of Object.keys(SOLS)) assert.ok(SPECS.some((sp) => sp.hole && (sp.hole[0] + ':' + sp.hole[1] + (sp.goalHole ? 'g' : '')) === key), 'ongebruikte oplossing ' + key);
console.log('levels ok:', LEVEL_COUNT, '+ 60 eindeloos, tijd', Date.now() - t0, 'ms, door oplosser binnen budget bevestigd:', LEVEL_COUNT + 60 - unverified, '(rest: constructiebewijs)');

// moeilijkheidscurve per wereld (zetten tot de oplossing = pinnen - 1)
console.log('wereld                    levels  zetten min/gem/max   borden  met-doel  oplosser-bevestigd');
let prevAvg = 0;
stats.forEach((s, i) => {
  const min = Math.min(...s.len), max = Math.max(...s.len), avg = s.len.reduce((a, b) => a + b, 0) / s.len.length;
  console.log((WORLDS[i].emoji + ' ' + WORLDS[i].name).padEnd(24), String(s.len.length).padStart(6), ('   ' + min + ' / ' + avg.toFixed(1) + ' / ' + max).padEnd(20), String(s.boards.size).padStart(6), String(s.goal).padStart(9), String(s.solver).padStart(14));
  assert.ok(avg > prevAvg, 'gemiddelde moeilijkheid moet per wereld stijgen');
  prevAvg = avg;
});

// gladde curve: gemiddelde per 10 levels stijgt (grof), geen grote terugval
const ks = []; for (let n = 0; n < LEVEL_COUNT; n++) ks.push(makeLevel(n).k);
const avg10 = []; for (let i = 0; i < LEVEL_COUNT; i += 10) avg10.push(ks.slice(i, i + 10).reduce((a, b) => a + b, 0) / 10);
console.log('gem. pinnen per 10 levels:', avg10.map((v) => v.toFixed(0)).join(' '));
for (let i = 3; i < avg10.length; i++) assert.ok(avg10[i] >= avg10[i - 3] - 1, 'moeilijkheid zakt te sterk rond level ' + (i * 10 + 1));
console.log('alles ok');
