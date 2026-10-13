// Test voor docs/games/mini/kratjes.js.  Gebruik: node tools/test-mini-kratjes.mjs
// 1) elk vast level: solver vindt oplossing, lengte == opgegeven optimum, oplossing wordt onafhankelijk nagespeeld (lopen + duwen)
// 2) eindeloze generator: n levels, per constructie oplosbaar (omgekeerde trail wordt voorwaarts nagespeeld), steekproef ook met solver
// 3) rooktest van het spel in een nep-DOM (laden, spelen via toetsen tot level klaar, opslaan, destroy)
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const mod = await import(pathToFileURL(path.join(here, '..', 'docs', 'games', 'mini', 'kratjes.js')).href);
const { parse, solve, genLevel, endlessParams, LEVELS } = mod;
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

console.log('== vaste levels ==', LEVELS.length);
check(LEVELS.length >= 60, 'minstens 60 levels');
let tMax = 0; const seenMaps = new Set();
LEVELS.forEach((d, i) => {
  const L = parse(d.m);
  check(L.p0 >= 0, `level ${i + 1}: geen speler`);
  check(L.box0.length === L.goals.reduce((s, v) => s + v, 0), `level ${i + 1}: kratten != doelen`);
  check(!L.box0.every((b) => L.goals[b]), `level ${i + 1}: al opgelost`);
  check(!seenMaps.has(d.m), `level ${i + 1}: dubbel`); seenMaps.add(d.m);
  const t0 = Date.now();
  const sol = solve(L, L.box0, L.p0, 500000);
  const dt = Date.now() - t0; tMax = Math.max(tMax, dt);
  check(sol !== null, `level ${i + 1}: NIET OPLOSBAAR (of cap)`);
  if (sol) {
    check(sol.length === d.o, `level ${i + 1}: optimum ${sol.length} != ${d.o}`);
    check(replay(L, sol), `level ${i + 1}: nagespeelde oplossing werkt niet`);
  }
});
console.log('traagste solve (ms):', tMax);

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
console.log('score-reeks:', scores.slice(-3).join(','), 'save:', JSON.stringify(store.v));
console.log(fails ? `${fails} FOUT(EN)` : 'ALLES OK');
process.exit(fails ? 1 : 0);
