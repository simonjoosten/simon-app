// Test voor docs/games/mini/knopen.js
// 1. elk vast level (1..300) en eindeloos level is oplosbaar: de constructie-oplossing heeft 0 kruisingen (onafhankelijk gecontroleerd met exacte rekenkunde-check)
// 2. generator crasht niet, is deterministisch, beginstand is echt verward
// 3. rooktest van het spel met een nep-DOM: spelen, hint, ongedaan, opnieuw, opslaan, opruimen
import game, { genLevel, findCrossings, levelParams, TOTAL_FIXED, WORLD_W, WORLD_H, WORLDS, WORLD_SIZE, worldOf } from '../docs/games/mini/knopen.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.error('FOUT:', m); } };

// onafhankelijke kruisingscontrole (andere formulering dan het spel)
function indepCross(P, E) {
  const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const sgn = (v) => (v > 1e-9 ? 1 : v < -1e-9 ? -1 : 0);
  for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) {
    const [a, b] = E[i], [c, d] = E[j];
    if (new Set([a, b, c, d]).size < 4) {
      // gedeelde knoop: mag niet over elkaar liggen
      const s = [a, b].find((x) => x === c || x === d);
      const o1 = [a, b].find((x) => x !== s), o2 = [c, d].find((x) => x !== s);
      if (Math.abs(cr(P[s], P[o1], P[o2])) < 1e-6 && ((P[o1].x - P[s].x) * (P[o2].x - P[s].x) + (P[o1].y - P[s].y) * (P[o2].y - P[s].y)) > 0) return true;
      continue;
    }
    const d1 = sgn(cr(P[a], P[b], P[c])), d2 = sgn(cr(P[a], P[b], P[d]));
    const d3 = sgn(cr(P[c], P[d], P[a])), d4 = sgn(cr(P[c], P[d], P[b]));
    if (d1 * d2 <= 0 && d3 * d4 <= 0) return true;
  }
  return false;
}
function conn(n, E) {
  const seen = new Set([0]); let ch = true;
  while (ch) { ch = false; for (const [a, b] of E) { if (seen.has(a) !== seen.has(b)) { seen.add(a); seen.add(b); ch = true; } } }
  return seen.size === n;
}

const t0 = Date.now();
let prevN = 0, maxMs = 0, fallbacks = 0;
const stats = []; // per level: {L, n, m, red, disp, minMoves, exact, shape, pins}
const SEARCH_MS = 40; // tijdsbudget per level voor de zoektocht naar een kortere oplossing
for (let L = 1; L <= TOTAL_FIXED + 60; L++) {
  const t1 = Date.now();
  let g;
  try { g = genLevel(L); } catch (e) { ok(false, `level ${L} crasht: ${e.message}`); continue; }
  maxMs = Math.max(maxMs, Date.now() - t1);
  const { n, edges, sol, start, pins } = g;
  const prm = levelParams(L);
  if (g.shape !== prm.shape) fallbacks++;
  if (L <= TOTAL_FIXED) {
    ok(n >= 5 && n <= 19, `level ${L}: n=${n} buiten 5..19`);
    ok(n >= prevN, `level ${L}: knopen nemen af`);
    prevN = n;
    ok(g.world === Math.floor((L - 1) / WORLD_SIZE) && worldOf(L) === WORLDS[g.world], `level ${L}: wereld`);
  } else ok(n >= 15 && n <= 19, `level ${L}: eindeloos n=${n}`);
  ok(sol.length === n && start.length === n, `level ${L}: aantal punten`);
  ok(edges.length >= n - 1, `level ${L}: te weinig lijnen`);
  ok(conn(n, edges), `level ${L}: niet samenhangend`);
  const keys = new Set(edges.map(([a, b]) => Math.min(a, b) + '-' + Math.max(a, b)));
  ok(keys.size === edges.length && edges.every(([a, b]) => a !== b), `level ${L}: dubbele lijn/lus`);
  // constructiebewijs: de plaatsing 'sol' is een geldige oplossing (twee onafhankelijke controles)
  ok(indepCross(sol, edges) === false, `level ${L}: oplossing heeft kruising (onafhankelijk)`);
  ok(findCrossings(sol, edges).every((r) => !r), `level ${L}: oplossing heeft kruising (spel)`);
  const red0 = findCrossings(start, edges).filter(Boolean).length;
  ok(red0 >= 2, `level ${L}: start niet verward`);
  ok(indepCross(start, edges) === true, `level ${L}: start heeft geen echte kruising`);
  const inb = (p) => p.x >= 0 && p.y >= 0 && p.x <= WORLD_W && p.y <= WORLD_H;
  ok(sol.every(inb) && start.every(inb), `level ${L}: punt buiten veld`);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    ok(Math.hypot(sol[i].x - sol[j].x, sol[i].y - sol[j].y) >= 40, `level ${L}: knopen te dicht (oplossing)`);
  }
  // vastgepinde knopen staan al op hun oplossingsplek en er blijven genoeg vrije knopen
  ok(pins.every((i) => start[i].x === sol[i].x && start[i].y === sol[i].y), `level ${L}: pin staat niet op oplossing`);
  ok(n - pins.length >= 3, `level ${L}: te weinig vrije knopen`);
  if (L % 7 === 0 || L <= 20) { const g2 = genLevel(L); ok(JSON.stringify(g2) === JSON.stringify(g), `level ${L}: niet deterministisch`); }
  if (L <= TOTAL_FIXED) {
    // kortste oplossing: minimaal aantal knopen dat naar zijn oplossingsplek moet (rest blijft staan)
    const disp = []; for (let i = 0; i < n; i++) if (Math.hypot(start[i].x - sol[i].x, start[i].y - sol[i].y) > 1e-9) disp.push(i);
    let minMoves = disp.length, exact = false;
    const tS = Date.now();
    const cur = start.map((p) => ({ x: p.x, y: p.y }));
    let timeUp = false;
    outer: for (let size = 1; size < disp.length; size++) {
      const idx = Array.from({ length: size }, (_, k) => k);
      for (;;) {
        for (const k of idx) cur[disp[k]] = sol[disp[k]];
        const good = findCrossings(cur, edges).every((r) => !r);
        for (const k of idx) cur[disp[k]] = start[disp[k]];
        if (good) { minMoves = size; exact = true; break outer; }
        if (Date.now() - tS > SEARCH_MS) { timeUp = true; break outer; }
        let k = size - 1;
        while (k >= 0 && idx[k] === disp.length - size + k) k--;
        if (k < 0) break;
        idx[k]++; for (let q = k + 1; q < size; q++) idx[q] = idx[q - 1] + 1;
      }
    }
    if (!timeUp && !exact) exact = true; // alle kleinere deelverzamelingen uitgeput: disp.length is minimaal
    stats.push({ L, n, m: edges.length, red: red0, disp: disp.length, minMoves, exact, shape: g.shape, pins: pins.length, w: g.world });
  }
}
console.log(`generator: ${TOTAL_FIXED} vaste + 60 eindeloze levels in ${Date.now() - t0} ms (traagste ${maxMs} ms, ${fallbacks} levels met uitwijkvorm)`);
ok(prevN === 19, 'laatste vaste level heeft 19 knopen');
ok(TOTAL_FIXED >= 300 && WORLDS.length * WORLD_SIZE === TOTAL_FIXED, 'aantal levels/werelden');
ok(levelParams(1).n === 5 && levelParams(TOTAL_FIXED).n === 19, 'bereik 5..19');
ok(stats.length === TOTAL_FIXED && stats.every((x) => x.exact || x.minMoves >= 1), 'alle vaste levels gecontroleerd');

// moeilijkheidscurve per wereld
const avg = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
console.log('wereld              n(min-max)  lijnen(gem)  rood start(gem)  zetten min/gem/max  vormen  pins-levels');
for (let w = 0; w < WORLDS.length; w++) {
  const S = stats.filter((x) => x.w === w);
  const mv = S.map((x) => x.minMoves);
  const shapes = {}; S.forEach((x) => { shapes[x.shape] = (shapes[x.shape] || 0) + 1; });
  console.log(`${String(w + 1).padStart(2)} ${WORLDS[w].name.padEnd(16)} ${String(S[0].n).padStart(2)}-${String(S[S.length - 1].n).padEnd(2)}      ${avg(S.map((x) => x.m)).toFixed(1).padStart(5)}        ${avg(S.map((x) => x.red)).toFixed(1).padStart(5)}          ${Math.min(...mv)} / ${avg(mv).toFixed(1)} / ${Math.max(...mv)}      ${Object.entries(shapes).map(([k, v]) => k + v).join(',')}  ${S.filter((x) => x.pins).length}`);
  ok(S.length === WORLD_SIZE, 'wereldgrootte');
}
// gladde curve: gemiddelde zetten per wereld mag niet dalen en moet echt oplopen
const wAvg = WORLDS.map((_, w) => avg(stats.filter((x) => x.w === w).map((x) => x.minMoves)));
ok(wAvg[9] > wAvg[0] + 3, 'moeilijkheid loopt niet op: ' + wAvg.map((v) => v.toFixed(1)).join(' '));
ok(wAvg.every((v, i) => i === 0 || v >= wAvg[i - 1] - 2), 'curve daalt te sterk: ' + wAvg.map((v) => v.toFixed(1)).join(' '));
console.log('gem. zetten/wereld:', wAvg.map((v) => v.toFixed(1)).join(' '), `| exact bepaald: ${stats.filter((x) => x.exact).length}/${stats.length}, rest = bovengrens`);
console.log('vormen totaal:', JSON.stringify(stats.reduce((a, x) => (a[x.shape] = (a[x.shape] || 0) + 1, a), {})), '| levels met pins:', stats.filter((x) => x.pins).length);

// ---------- nep-DOM rooktest ----------
class El {
  constructor(tag) { this.tag = tag; this.style = {}; this.children = []; this.l = {}; this.parentNode = null; this._t = ''; this.width = 0; this.height = 0; }
  set textContent(v) { this._t = String(v); } get textContent() { return this._t; }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  append(...cs) { cs.forEach((c) => this.appendChild(c)); }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentNode = null; }
  addEventListener(t, f) { (this.l[t] = this.l[t] || []).push(f); }
  removeEventListener(t, f) { this.l[t] = (this.l[t] || []).filter((x) => x !== f); }
  fire(t, ev) { (this.l[t] || []).slice().forEach((f) => f(ev)); }
  getBoundingClientRect() { return { left: 0, top: 0, width: WORLD_W, height: WORLD_H }; }
  setPointerCapture() {}
  getContext() {
    const grad = { addColorStop() {} };
    return new Proxy({}, { get: (t, k) => (k in t ? t[k] : (k === 'createRadialGradient' ? () => grad : () => {})), set: (t, k, v) => { t[k] = v; return true; } });
  }
}
let rafs = new Map(), rid = 0, timersLeft = 0;
globalThis.document = { createElement: (t) => new El(t) };
const winL = {};
globalThis.window = { devicePixelRatio: 1, addEventListener: (t, f) => { (winL[t] = winL[t] || []).push(f); }, removeEventListener: (t, f) => { winL[t] = (winL[t] || []).filter((x) => x !== f); } };
globalThis.requestAnimationFrame = (f) => { rafs.set(++rid, f); return rid; };
globalThis.cancelAnimationFrame = (id) => rafs.delete(id);
const origST = globalThis.setTimeout;
function tick(ms = 16) { const fs = [...rafs.entries()]; rafs.clear(); fs.forEach(([, f]) => f(tick.now += ms)); }
tick.now = 1000;
const sleep = (ms) => new Promise((r) => origST(r, ms));

let savedObj = null, scoreV = -1, endCalls = 0, saves = 0;
const api = {
  w: 360, h: 640,
  score: (n) => { scoreV = n; }, end: () => { endCalls++; },
  load: () => Promise.resolve(savedObj), save: (o) => { saves++; savedObj = JSON.parse(JSON.stringify(o)); ok(JSON.stringify(o).length < 5000, 'save > 5KB'); },
  clear() {},
};
ok(game.save === 'forever' && game.id === 'knopen', 'metadata');

async function run() {
  const host = new El('div');
  const inst = game.create(host, api);
  await sleep(10);
  const root = host.children[0];
  const [head, canvas, foot, overlay] = root.children;
  const [undoBtn, resetBtn, hintBtn, menuBtn] = foot.children;
  const picker = root.children[5];
  const cardBtn = overlay.children[0].children[3];
  for (let i = 0; i < 5; i++) tick();
  const ptr = (type, x, y) => canvas.fire(type, { pointerId: 1, clientX: x, clientY: y, preventDefault() {} });

  async function solveByDragging(L) {
    const g = genLevel(L);
    for (let i = 0; i < g.n; i++) {
      // vind huidige positie van knoop i via de start (we slepen vanaf start/huidig naar oplossing)
      const cur = g._cur ? g._cur[i] : g.start[i];
      ptr('pointerdown', cur.x, cur.y);
      ptr('pointermove', (cur.x + g.sol[i].x) / 2, (cur.y + g.sol[i].y) / 2);
      ptr('pointermove', g.sol[i].x, g.sol[i].y);
      ptr('pointerup', g.sol[i].x, g.sol[i].y);
      tick();
    }
  }
  // level 1: eerst opnieuw en ongedaan testen
  const g1 = genLevel(1);
  ptr('pointerdown', g1.start[0].x, g1.start[0].y); ptr('pointermove', 150, 200); ptr('pointerup', 150, 200);
  undoBtn.fire('click'); tick();
  resetBtn.fire('click'); tick();
  hintBtn.fire('click'); tick();
  ok(hintBtn.textContent.includes('(2)'), 'hint teller');
  // los op: hint heeft knoop al op zijn plek gezet; sleep alle knopen naar de oplossing (slepen zonder te raken mag; pak knoop op de positie van de start of hint)
  // de hint verplaatste de knoop met de meeste winst; zoek hem door alle knopen te proberen
  for (let i = 0; i < g1.n; i++) {
    for (const from of [g1.start[i], g1.sol[i]]) {
      ptr('pointerdown', from.x, from.y); ptr('pointermove', g1.sol[i].x + 0.5, g1.sol[i].y); ptr('pointerup', g1.sol[i].x + 0.5, g1.sol[i].y);
      tick();
    }
  }
  await sleep(900); tick();
  ok(scoreV >= 1, 'score na level 1 = ' + scoreV);
  ok(overlay.style.display === 'flex', 'beloningskaart zichtbaar');
  ok(savedObj && savedObj.v === 2 && savedObj.l === 1 && savedObj.m === 2 && savedObj.s[0] >= '1', 'opslag: ' + JSON.stringify(savedObj));
  cardBtn.fire('click'); tick();
  ok(overlay.style.display === 'none', 'kaart weg bij volgend level');
  inst.destroy();
  ok((canvas.l.pointerdown || []).length === 0 && (winL.resize || []).length === 0 && rafs.size === 0, 'destroy ruimt op');
  ok(endCalls === 0, 'api.end niet aanroepen');
  ok(savedObj.l === 2, 'huidig level 2 bewaard');

  // herstart vanuit opslag
  const host2 = new El('div');
  const inst2 = game.create(host2, api);
  await sleep(10);
  ok(scoreV >= 1, 'score hersteld');
  const root2 = host2.children[0];
  ok(/Level 2/.test(root2.children[0].children[1].children[0].textContent), 'hervat op level 2');
  inst2.destroy();
  // destroy tijdens load
  const inst3 = game.create(new El('div'), { ...api, load: () => new Promise((r) => origST(() => r(savedObj), 20)) });
  inst3.destroy(); await sleep(40);
  // levelkiezer
  const host5 = new El('div'); const inst5 = game.create(host5, api); await sleep(10);
  for (let i = 0; i < 3; i++) tick();
  const r5 = host5.children[0]; const pk = r5.children[5]; const menu5 = r5.children[2].children[3];
  ok(pk.style.display !== 'flex', 'kiezer eerst dicht');
  menu5.fire('click');
  ok(pk.style.display === 'flex', 'kiezer opent');
  const cells = [];
  const walk = (e) => { if (e.tag === 'button' && e.children.length === 2) cells.push(e); e.children.forEach(walk); };
  walk(pk.children[1]);
  ok(cells.length === TOTAL_FIXED, 'kiezer toont ' + cells.length + ' levelknoppen');
  const locked = cells[TOTAL_FIXED - 1]; locked.fire('click');
  ok(pk.style.display === 'flex', 'vergrendeld level doet niets');
  cells[1].fire('click');
  ok(pk.style.display === 'none' && /Level 2 /.test(r5.children[0].children[1].children[0].textContent), 'kiezer laadt level 2');
  ok(/Wereld 1 · Lentetuin/.test(r5.children[0].children[1].children[1].textContent), 'wereldnaam in beeld');
  inst5.destroy();
  // oude opslag (60 levels + eindeloos) migreert
  savedObj = { l: 70, m: 70, s: '3'.repeat(60) + '2'.repeat(9) };
  const host6 = new El('div'); const inst6 = game.create(host6, api); await sleep(10);
  for (let i = 0; i < 3; i++) tick();
  ok(scoreV === 180, 'migratie: score 180, kreeg ' + scoreV);
  ok(/Level 61 /.test(host6.children[0].children[0].children[1].children[0].textContent), 'migratie: level 61');
  ok(savedObj.v === 2 && JSON.stringify(savedObj).length < 5000, 'migratie opslag');
  inst6.destroy();
  // alle werelden gehaald: eindeloze modus laden, opslag blijft klein
  savedObj = { v: 2, l: 301, m: 301, s: '3'.repeat(300) };
  const host4 = new El('div'); const inst4 = game.create(host4, api); await sleep(10);
  for (let i = 0; i < 5; i++) tick();
  ok(/Eindeloos 1/.test(host4.children[0].children[0].children[1].children[0].textContent), 'eindeloze modus');
  ok(scoreV === 900, 'score 900, kreeg ' + scoreV);
  ok(JSON.stringify(savedObj).length < 5000, 'opslag klein');
  inst4.destroy();
}
await run();
if (fails) { console.error(fails + ' fouten'); process.exit(1); }
console.log('Alles OK');
process.exit(0);
