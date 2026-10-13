// Test voor docs/games/mini/verbind.js: genereert ALLE 300 vaste levels (10 werelden x 30) + 30 eindeloze levels,
// controleert met een onafhankelijke solver dat elk level oplosbaar is (en uniek waar dat is beloofd), speelt de oplossing na
// via het bord-model, test voortgangsopslag/migratie en rookt de UI met een nep-DOM. Rapporteert de moeilijkheidscurve per wereld.
import mod, { genLevel, solve, makeBoard, levelParams, starsFor, FIXED_LEVELS, WORLD_SIZE, WORLDS, worldOf, packBests, parseSave, nextOpen } from '../docs/games/mini/verbind.js';

let fails = 0;
const fail = (m) => { fails++; console.log('FOUT:', m); };
if (mod.id !== 'verbind' || mod.save !== 'forever' || typeof mod.create !== 'function') fail('spelcontract');
if (FIXED_LEVELS < 300 || WORLDS.length * WORLD_SIZE !== FIXED_LEVELS) fail('aantal vaste levels / werelden');

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
  const b = makeBoard(lv);
  for (let c = 0; c < lv.sol.length; c++) {
    const p = lv.sol[c];
    if (!b.start(p[0])) return 'start mislukt';
    for (let i = 1; i < p.length; i++) if (!b.step(p[i])) return 'step mislukt';
    b.release();
  }
  return b.won() ? null : 'niet gewonnen na afspelen';
}

const SOLVE_BUDGET = 4e6;           // knopen per level voor de onafhankelijke solver
const stat = WORLDS.map(() => ({ n: [], k: [], nodes: [], avgLen: [], uniq: 0, proven: 0, cons: 0, ms: 0, cells: [] }));
let totalMs = 0, maxMs = 0, uniq = 0, proven = 0, constructionOnly = 0, prevN = 0;
const TOTAL = FIXED_LEVELS + 30;
for (let i = 0; i < TOTAL; i++) {
  const t0 = Date.now();
  let lv;
  try { lv = genLevel(i); } catch (e) { fail(`level ${i + 1} crash: ${e.stack}`); continue; }
  const gms = Date.now() - t0; maxMs = Math.max(maxMs, gms); totalMs += gms;
  const p = levelParams(i);
  if (lv.n !== p.n || lv.ends.length !== p.k) fail(`level ${i + 1} parameters`);
  if (!validSolution(lv.n, lv.ends, lv.sol)) { fail(`level ${i + 1} constructie-oplossing ongeldig`); continue; }
  if (i < FIXED_LEVELS && lv.n < prevN) fail(`level ${i + 1}: bord wordt kleiner (${prevN} -> ${lv.n})`);
  prevN = lv.n;
  const e = playSolution(lv);
  if (e) fail(`level ${i + 1} bord: ${e}`);
  if (JSON.stringify(genLevel(i).ends) !== JSON.stringify(lv.ends) && i < FIXED_LEVELS) fail(`level ${i + 1} niet deterministisch`);
  // onafhankelijke solver (met knopenbudget; constructie bewijst oplosbaarheid altijd)
  const t1 = Date.now();
  const r = solve(lv.n, lv.ends, 2, SOLVE_BUDGET);
  const sms = Date.now() - t1;
  const w = worldOf(i);
  if (r.sol && !validSolution(lv.n, lv.ends, r.sol)) fail(`level ${i + 1} solver-oplossing ongeldig`);
  if (r.aborted) { constructionOnly++; if (w >= 0) stat[w].cons++; }
  else {
    proven++;
    if (r.count < 1) fail(`level ${i + 1} niet oplosbaar volgens solver`);
    if (lv.unique && r.count !== 1) fail(`level ${i + 1} gemarkeerd uniek maar ${r.count} oplossingen`);
    if (w >= 0) stat[w].proven++;
  }
  if (lv.unique) { uniq++; if (w >= 0) stat[w].uniq++; }
  if (w >= 0) {
    const s = stat[w];
    s.n.push(lv.n); s.k.push(lv.ends.length); s.cells.push(lv.n * lv.n); s.avgLen.push((lv.n * lv.n) / lv.ends.length);
    s.nodes.push(r.nodes); s.ms += sms + gms;
  }
}

// moeilijkheidscurve per wereld
const mm = (a) => `${Math.min(...a)}/${Math.round(a.reduce((x, y) => x + y, 0) / a.length * 10) / 10}/${Math.max(...a)}`;
console.log('\nMoeilijkheidscurve per wereld (min/gem/max):');
console.log('wereld'.padEnd(22), 'bord'.padEnd(7), 'kleuren'.padEnd(13), 'vakjes/lijn'.padEnd(17), 'solver-knopen'.padEnd(22), 'uniek', 'tijd');
let prevCells = 0;
WORLDS.forEach((w, wi) => {
  const s = stat[wi];
  if (!s.n.length) return;
  const meanCells = s.cells.reduce((x, y) => x + y, 0) / s.cells.length;
  console.log(`${wi + 1}. ${w.name}`.padEnd(22), `${Math.min(...s.n)}-${Math.max(...s.n)}`.padEnd(7), mm(s.k).padEnd(13), mm(s.avgLen.map((x) => Math.round(x * 10) / 10)).padEnd(17), mm(s.nodes).padEnd(22), `${s.uniq}/${WORLD_SIZE}`, `${s.ms}ms`);
  if (meanCells < prevCells) fail(`wereld ${wi + 1}: gemiddeld bord kleiner dan vorige wereld`);
  prevCells = meanCells;
});
console.log(`\n${FIXED_LEVELS} vaste + ${TOTAL - FIXED_LEVELS} eindeloze levels getest. Bewezen uniek: ${uniq}/${TOTAL}; door solver volledig geverifieerd: ${proven}; alleen constructiebewijs (solver-budget op): ${constructionOnly}`);
console.log(`gem. generatie ${Math.round(totalMs / TOTAL)}ms, max ${maxMs}ms per level (lui, 1 kandidaat)`);

// bord-fuzz: willekeurige invoer mag nooit invarianten breken
let seed = 42;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
for (const i of [0, 12, 60, 130, 200, 299, 310]) {
  const lv = genLevel(i), b = makeBoard(lv), T = b.T;
  for (let it = 0; it < 4000; it++) {
    const x = rnd();
    if (x < 0.2) b.start(Math.floor(rnd() * T));
    else if (x < 0.9) b.step(Math.floor(rnd() * T));
    else if (x < 0.95) b.release();
    else if (x < 0.98) { const cc = Math.floor(rnd() * b.K); b.forcePath(cc, lv.sol[cc]); }
    else b.restore(b.snapshot());
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
{
  const lv = genLevel(5), b = makeBoard(lv);
  b.start(lv.sol[0][0]); b.step(lv.sol[0][1]); b.release();
  lv.sol.forEach((s, c) => b.forcePath(c, s));
  if (!b.won()) fail('forcePath van alle kleuren wint niet');
}
if (starsFor(4, 5, false) !== 3 || starsFor(4, 5, true) !== 2 || starsFor(4, 40, false) !== 1) fail('sterren');

// voortgang: compact + migratie van oude saves (60 levels, eindeloos vanaf index 60)
{
  const full = Array.from({ length: FIXED_LEVELS + 400 }, (_, i) => 1 + (i % 3));
  const packed = packBests(full);
  const bytes = JSON.stringify({ v: 2, l: 299, m: 300, b: packed, h: 6 }).length;
  console.log(`opslag: ${bytes} bytes bij volledig gevulde voortgang (limiet 5000)`);
  if (bytes > 2000) fail('opslag te groot');
  const old = parseSave({ v: 1, l: 75, m: 80, b: '3'.repeat(40) + '2'.repeat(60), h: 2 });
  if (old.bests.length !== 60 || old.maxL !== 60 || old.level !== 60 || old.hints !== 2) fail('migratie van oude save');
  if (old.bests.reduce((a, v) => a + v, 0) !== 3 * 40 + 2 * 20) fail('migratie behoudt sterren niet');
  const nw = parseSave({ v: 2, l: 130, m: 140, b: packed, h: 4 });
  if (nw.maxL !== 140 || nw.level !== 130 || nw.bests.length !== packed.length) fail('nieuwe save lezen');
  const junk = parseSave({ v: 2, l: 'x', m: 99999, b: 'ab9', h: -3 });
  if (junk.maxL > 700 || junk.bests.some((x) => x < 0 || x > 3) || junk.hints < 0) fail('rommelsave niet veilig');
  if (parseSave(null).maxL !== 0) fail('lege save');
  const bs = []; bs[0] = 3; bs[1] = 2; bs[3] = 1;
  if (nextOpen(bs, 0) !== 2 || nextOpen(bs, 2) !== 4 || nextOpen(bs, 299) !== 2) fail('nextOpen');
  const done = Array(FIXED_LEVELS).fill(1);
  if (nextOpen(done, 10) !== FIXED_LEVELS) fail('nextOpen als alles klaar is');
}

// UI-rooktest met nep-DOM: opstarten, levelkiezer, migratie, winnen via hints, opslaan
async function uiSmoke() {
  class El {
    constructor(tag) { this.tag = tag; this.style = {}; this.children = []; this.handlers = {}; this.textContent = ''; this.className = ''; this.parentNode = null; this.disabled = false; this.offsetWidth = 1; this.scrollTop = 0; this.offsetTop = 0; }
    set innerHTML(v) { this.children = []; }
    get innerHTML() { return ''; }
    append(...c) { c.forEach((x) => this.appendChild(x)); }
    appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
    removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentNode = null; }
    addEventListener(t, f) { (this.handlers[t] ||= []).push(f); }
    removeEventListener(t, f) { this.handlers[t] = (this.handlers[t] || []).filter((x) => x !== f); }
    click() { if (!this.disabled) (this.handlers.click || []).forEach((f) => f({})); }
    getBoundingClientRect() { return { left: 0, top: 0, width: 360, height: 480 }; }
    setPointerCapture() {} releasePointerCapture() {}
    getContext() { return new Proxy(function () {}, { get: (t, k) => (k === 'roundRect' ? undefined : (() => {})), set: () => true }); }
  }
  const all = (e, out = []) => { out.push(e); e.children.forEach((c) => all(c, out)); return out; };
  const byText = (root, t) => all(root).find((e) => e.tag === 'button' && e.textContent.startsWith(t));
  globalThis.document = { createElement: (t) => new El(t) };
  globalThis.window = { addEventListener() {}, removeEventListener() {}, devicePixelRatio: 1 };
  globalThis.requestAnimationFrame = () => 1; globalThis.cancelAnimationFrame = () => {};
  const mkApi = (save) => { const a = { saved: null, score: 0, w: 360, h: 640, load: async () => save, save: (v) => { a.saved = v; }, score_: 0 }; a.score = (v) => { a.sc = v; }; return a; };

  // 1) oude save migreert
  let host = new El('div'), api = mkApi({ v: 1, l: 61, m: 70, b: '3'.repeat(75), h: 2 });
  let g = mod.create(host, api);
  await new Promise((r) => setTimeout(r, 30));
  if (api.sc !== 180) fail(`UI: score na migratie ${api.sc} i.p.v. 180`);
  const root = host.children[0];
  const title = all(root).find((e) => /^Level \d+/.test(e.textContent));
  if (!title || title.textContent !== 'Level 61') fail(`UI: titel ${title && title.textContent}`);
  if (!all(root).some((e) => /Wereld 3 · Bosmeer/.test(e.textContent))) fail('UI: wereldnaam niet getoond');
  // levelkiezer
  byText(root, '🗺️').click();
  const grids = all(root).filter((e) => e.style.cssText && /grid-template-columns/.test(e.style.cssText));
  const cells = grids.reduce((s, gr) => s + gr.children.length, 0);
  if (grids.length !== WORLDS.length || cells !== FIXED_LEVELS) fail(`UI: levelkiezer toont ${grids.length} werelden / ${cells} levels`);
  const lockedCells = grids.reduce((s, gr) => s + gr.children.filter((c) => c.disabled).length, 0);
  if (lockedCells !== FIXED_LEVELS - 61) fail(`UI: ${lockedCells} vergrendelde levels, verwacht ${FIXED_LEVELS - 61}`);
  grids[0].children[4].click();
  if (!all(root).some((e) => e.textContent === 'Level 5')) fail('UI: kiezen van level 5 werkt niet');
  g.destroy();

  // 2) nieuw spel: level 1 winnen met hints en opslaan
  host = new El('div'); api = mkApi(null);
  g = mod.create(host, api);
  await new Promise((r) => setTimeout(r, 30));
  const r2 = host.children[0];
  for (let k = 0; k < 3; k++) byText(r2, '💡').click();
  if (!api.saved || api.saved.v !== 2 || !/^[1-3]+$/.test(api.saved.b) || api.saved.m !== 1) fail('UI: winst niet correct opgeslagen ' + JSON.stringify(api.saved));
  g.destroy();
}
try { await uiSmoke(); console.log('UI-rooktest (nep-DOM) uitgevoerd'); } catch (e) { fail('UI-rooktest crash: ' + e.stack); }

if (fails) { console.log(`${fails} fouten`); process.exit(1); }
console.log('OK: alle vaste levels oplosbaar, generator crasht niet');
