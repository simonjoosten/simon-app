// Test voor docs/games/mini/pinnen.js: elk level oplosbaar (constructiebewijs + eigen oplosser).
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const M = await import(pathToFileURL(path.join(here, '..', 'docs', 'games', 'mini', 'pinnen.js')).href);
const { makeLevel, solve, LEVEL_COUNT, SPECS, buildBoard } = M._logic;

assert.equal(M.default.id, 'pinnen');
assert.equal(M.default.save, 'forever');
assert.equal(typeof M.default.create, 'function');
assert.ok(LEVEL_COUNT >= 60, 'minstens 60 levels');

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

let t0 = Date.now();
for (let n = 0; n < LEVEL_COUNT + 200; n++) {
  const lv = makeLevel(n);
  const again = makeLevel(n);
  assert.equal(lv, again);
  const pegsN = lv.start.reduce((x, y) => x + y, 0);
  assert.ok(pegsN >= 2, 'level ' + n + ' te simpel');
  assert.equal(pegsN, lv.k);
  if (n < LEVEL_COUNT && SPECS[n].k) assert.equal(lv.k, SPECS[n].k, 'level ' + n + ' haalt doel-aantal pinnen niet');
  if (lv.sol) {
    assert.equal(lv.sol.length, pegsN - 1);
    replay(lv, lv.sol);
  }
  // onafhankelijke oplosser (klassieke borden: ruim budget; rest: alles ook)
  if (n < LEVEL_COUNT || n < LEVEL_COUNT + 40) {
    const r = solve(lv.board, lv.start, lv.goal, 3e7, 60000);
    assert.ok(r.sol, 'oplosser vindt geen oplossing voor level ' + n + (r.aborted ? ' (budget op)' : ''));
    replay(lv, r.sol);
  }
}
console.log('levels ok:', LEVEL_COUNT, '+ 200 eindeloos, tijd', Date.now() - t0, 'ms');

// moeilijkheid loopt zacht op (pinnen per level, grof)
const ks = []; for (let n = 0; n < LEVEL_COUNT; n++) ks.push(SPECS[n].classic ? 8 : makeLevel(n).k);
console.log('pinnen per level (klassiek=8):', ks.join(' '));
for (let i = 0; i + 5 < LEVEL_COUNT - 1; i += 5) {
  const a = Math.max(...ks.slice(i, i + 5)), b = Math.max(...ks.slice(i + 5, i + 10));
  assert.ok(b >= a - 3, 'moeilijkheid zakt te sterk rond level ' + (i + 5));
}

// borden zijn geldig
for (const id of Object.keys(M._logic.BOARD_DEFS)) {
  const b = buildBoard(id);
  assert.ok(b.n >= 5 && b.moves.length > 0, id);
}
console.log('alles ok');
