// Test voor docs/games/mini/verbind.js: genereert alle 60 levels + 30 eindeloze levels,
// controleert met een onafhankelijke solver dat elk level oplosbaar is en speelt de oplossing na via het bord-model.
import mod, { genLevel, solve, makeBoard, levelParams, starsFor } from '../docs/games/mini/verbind.js';

let fails = 0;
const fail = (m) => { fails++; console.log('FOUT:', m); };
if (mod.id !== 'verbind' || mod.save !== 'forever' || typeof mod.create !== 'function') fail('spelcontract');

function validSolution(n, ends, sol) {
  const seen = new Set();
  if (sol.length !== ends.length) return false;
  for (let c = 0; c < sol.length; c++) {
    const p = sol[c];
    if (p.length < 2) return false;
    const [a, b] = ends[c];
    if (!((p[0] === a && p[p.length - 1] === b) || (p[0] === b && p[p.length - 1] === a))) return false;
    for (let i = 0; i < p.length; i++) {
      if (seen.has(p[i])) return false;
      seen.add(p[i]);
      if (i) {
        const d = Math.abs(p[i] - p[i - 1]);
        if (!(d === n || (d === 1 && Math.floor(p[i] / n) === Math.floor(p[i - 1] / n)))) return false;
      }
    }
  }
  return seen.size === n * n;
}

function playSolution(lv) {
  const b = makeBoard(lv), N = lv.n;
  const order = lv.sol.map((_, i) => i);
  for (const c of order) {
    const p = lv.sol[c];
    if (!b.start(p[0])) return 'start mislukt';
    for (let i = 1; i < p.length; i++) if (!b.step(p[i])) return 'step mislukt';
    b.release();
  }
  return b.won() ? null : 'niet gewonnen na afspelen';
}

let uniq = 0, totalMs = 0, maxMs = 0;
const sizes = {};
const TOTAL = 105;
for (let i = 0; i < TOTAL; i++) {
  const t0 = Date.now();
  let lv;
  try { lv = genLevel(i); } catch (e) { fail(`level ${i + 1} crash: ${e.stack}`); continue; }
  const ms = Date.now() - t0; totalMs += ms; maxMs = Math.max(maxMs, ms);
  const p = levelParams(i);
  if (lv.n !== p.n || lv.ends.length !== p.k) fail(`level ${i + 1} parameters`);
  if (!validSolution(lv.n, lv.ends, lv.sol)) { fail(`level ${i + 1} constructie-oplossing ongeldig`); continue; }
  // onafhankelijke solver, zonder budget
  const r = solve(lv.n, lv.ends, 2);
  if (r.count < 1 || !r.sol || !validSolution(lv.n, lv.ends, r.sol)) fail(`level ${i + 1} niet oplosbaar volgens solver`);
  if (lv.unique && r.count !== 1) fail(`level ${i + 1} gemarkeerd uniek maar ${r.count} oplossingen`);
  if (lv.unique) uniq++;
  else if (i < 60) fail(`level ${i + 1} (vast) is niet uniek`);
  const e = playSolution(lv);
  if (e) fail(`level ${i + 1} bord: ${e}`);
  // determinisme
  if (i % 15 === 0 && JSON.stringify(genLevel(i).ends) !== JSON.stringify(lv.ends)) fail(`level ${i + 1} niet deterministisch`);
  sizes[lv.n] = (sizes[lv.n] || 0) + 1;
}

// bord-fuzz: willekeurige invoer mag nooit invarianten breken
let seed = 42;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
for (const i of [0, 12, 30, 45, 58, 70]) {
  const lv = genLevel(i), b = makeBoard(lv), T = b.T;
  for (let it = 0; it < 4000; it++) {
    const x = rnd();
    if (x < 0.2) b.start(Math.floor(rnd() * T));
    else if (x < 0.9) b.step(Math.floor(rnd() * T));
    else if (x < 0.95) b.release();
    else if (x < 0.98) { const cc = Math.floor(rnd() * b.K); b.forcePath(cc, lv.sol[cc]); }
    else b.restore(b.snapshot());
    // invarianten
    const cnt = new Int8Array(T);
    b.paths.forEach((p, c) => p.forEach((cell, k) => {
      cnt[cell]++;
      if (b.owner[cell] !== c) fail('owner klopt niet');
      if (b.endOf[cell] >= 0 && b.endOf[cell] !== c) fail('lijn over andermans stip');
      if (k) { const d = Math.abs(cell - p[k - 1]); if (!(d === b.N || (d === 1 && Math.floor(cell / b.N) === Math.floor(p[k - 1] / b.N)))) fail('lijn niet aaneengesloten'); }
    }));
    for (let c = 0; c < T; c++) if (cnt[c] > 1) fail('cel dubbel bezet');
    if (fails > 5) break;
  }
}

// hint-pad: forcePath van elke kleur levert een gewonnen bord
{
  const lv = genLevel(5), b = makeBoard(lv);
  b.start(lv.sol[0][0]); b.step(lv.sol[0][1]); b.release();
  lv.sol.forEach((s, c) => b.forcePath(c, s));
  if (!b.won()) fail('forcePath van alle kleuren wint niet');
}
if (starsFor(4, 5, false) !== 3 || starsFor(4, 5, true) !== 2 || starsFor(4, 40, false) !== 1) fail('sterren');

console.log(`${TOTAL} levels getest (maten: ${JSON.stringify(sizes)}), uniek bewezen: ${uniq}/${TOTAL}, gem. generatie ${Math.round(totalMs / TOTAL)}ms, max ${maxMs}ms`);
if (fails) { console.log(`${fails} fouten`); process.exit(1); }
console.log('OK: alle levels oplosbaar, generator crasht niet');
