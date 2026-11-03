// Test voor huisdier-more.js (inhoud, seizoenen, evenementen), huisdier-minigames.js (spelregels + rooktest) en de koppeling met huisdier.js.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const dir = (f) => pathToFileURL(path.join(here, '..', 'docs', f)).href;
const M = await import(dir('huisdier-more.js'));
const G = await import(dir('huisdier-minigames.js'));
const R = await import(dir('huisdier-art-rooms.js'));
const { ICONS } = await import(dir('gfx/icons.js'));

// ---- inhoud: minstens +40 nieuwe dingen
const total = M.MORE_FOODS.length + M.MORE_TOYS.length + M.MORE_FURN.length + G.GAMES2.length;
assert.ok(total >= 40, 'minstens 40 nieuwe items: ' + total);
const RID = /^[a-z0-9-]{1,24}$/;
const oldFurn = new Set(R.FURNITURE.map((f) => f.id));
for (const [id, name, room, price, lv, ic] of M.MORE_FURN) {
  assert.ok(RID.test(id), 'veilig id ' + id); assert.ok(!oldFurn.has(id), 'nieuw id ' + id);
  assert.ok(R.ROOMS.some((r) => r.id === room) || ['woonkamer', 'keuken', 'slaapkamer', 'badkamer', 'tuin', 'speelkamer'].includes(room), 'kamer ' + room);
  assert.ok(price > 0 && lv >= 1 && name, 'velden ' + id); assert.ok(ICONS[ic], 'bestaand icoon ' + ic);
}
assert.equal(new Set(M.MORE_FURN.map((f) => f[0])).size, M.MORE_FURN.length, 'unieke meubel-id');
const src = fs.readFileSync(path.join(here, '..', 'docs', 'huisdier.js'), 'utf8');
const oldFoodIds = new Set([...src.matchAll(/\{ id: '([a-z0-9]+)', e: '[^']+', n: '/g)].map((m) => m[1]));
for (const f of M.MORE_FOODS) { assert.ok(RID.test(f.id)); assert.ok(!oldFoodIds.has(f.id), 'eten-id is nieuw ' + f.id); assert.ok(f.p > 0 && f.sv > 0 && f.f.length === 4 && f.lv >= 1, 'eten ' + f.id); if (f.ic) assert.ok(ICONS[f.ic], 'icoon ' + f.ic); }
assert.equal(new Set(M.MORE_FOODS.map((f) => f.id)).size, M.MORE_FOODS.length);
for (const t of M.MORE_TOYS) assert.ok(t.length === 4 && ICONS[t[3]]);

// ---- meubels: SVG, uitbreiding van de kamer-module, overlay-posities
const urlOf = (n) => 'art/3d/' + n + '.png';
const svg = M.furnitureSvg('i-trofee', 64, urlOf);
assert.ok(svg.startsWith('<svg') && svg.includes('art/3d/trophy.png') && svg.includes('width="64"'));
assert.ok(!M.furnitureSvg('i-trofee', 0, urlOf).includes('width="0"') && M.furnitureSvg('i-trofee', 0, null).includes('<text'), 'emoji-terugval en geen breedte bij 0');
assert.equal(M.furnitureSvg('bestaat-niet', 10, urlOf), '');
const ext = M.extendRooms(R, urlOf);
assert.equal(ext.FURNITURE.length, R.FURNITURE.length + 24);
assert.ok(ext.furnitureSVG('i-boom', 40).includes('tree.png') && ext.furnitureSVG('bank', 40).startsWith('<svg') && !ext.furnitureSVG('bank', 40).includes('<image'), 'oude meubels ongewijzigd');
assert.equal(ext.roomSVG, R.roomSVG); assert.ok(ext.SLOT_POS && ext.HOUSES && ext.INTERACT, 'overige exports blijven');
const sp = M.overlaySpots(['i-boom', 'bank', 0, 'i-trofee'], R.SLOT_POS.tuin, 'tuin');
assert.deepEqual(sp.map((p) => p.id), ['i-boom'], 'alleen extra meubels van deze kamer'); assert.ok(sp[0].w > 10 && sp[0].x > 0);
// de kamer-SVG negeert onbekende meubels netjes
assert.doesNotThrow(() => R.roomSVG('huisje', 'tuin', { furniture: ['i-boom', 0, 'bloembed'] }));

// ---- seizoenen en evenementen
const D = (y, m, d) => new Date(y, m - 1, d, 12);
assert.equal(M.seasonOf(D(2026, 1, 10)).id, 'winter'); assert.equal(M.seasonOf(D(2026, 4, 1)).id, 'lente'); assert.equal(M.seasonOf(D(2026, 7, 1)).id, 'zomer'); assert.equal(M.seasonOf(D(2026, 10, 31)).id, 'herfst'); assert.equal(M.seasonOf(D(2026, 12, 31)).id, 'winter');
assert.deepEqual(M.easterDate(2026), [4, 5]); assert.deepEqual(M.easterDate(2025), [4, 20]); assert.deepEqual(M.easterDate(2024), [3, 31]);
assert.deepEqual(M.eventsOn(D(2026, 10, 31)).map((e) => e.id), ['halloween']);
assert.deepEqual(M.eventsOn(D(2026, 12, 25)).map((e) => e.id), ['kerst']); assert.deepEqual(M.eventsOn(D(2026, 12, 5)).map((e) => e.id), ['sint']);
assert.deepEqual(M.eventsOn(D(2026, 4, 5)).map((e) => e.id), ['pasen']); assert.deepEqual(M.eventsOn(D(2026, 4, 6)).map((e) => e.id), ['pasen']); assert.deepEqual(M.eventsOn(D(2026, 4, 7)), []);
assert.deepEqual(M.eventsOn(D(2026, 6, 9)), []);
const born = new Date(2025, 5, 9, 10).getTime();
assert.deepEqual(M.eventsOn(D(2026, 6, 9), born).map((e) => e.id), ['verjaardag']); assert.equal(M.eventsOn(D(2026, 6, 9), born)[0].age, 1);
assert.deepEqual(M.eventsOn(D(2025, 6, 9), born), [], 'niet op de dag zelf van het geboortejaar');
let claims = []; const hw = M.eventsOn(D(2026, 10, 31))[0];
assert.equal(M.claimable([hw], claims, D(2026, 10, 31)).length, 1);
claims = M.addClaim(claims, hw, D(2026, 10, 31)); assert.deepEqual(claims, ['halloween:2026']);
assert.equal(M.claimable([hw], claims, D(2026, 10, 31)).length, 0); assert.equal(M.claimable([hw], claims, D(2027, 10, 31)).length, 1, 'volgend jaar weer');
assert.deepEqual(M.cleanClaims(['x', 'halloween:2026', 5, 'kerst:20']), ['halloween:2026']); assert.deepEqual(M.cleanClaims(null), []);
assert.equal(M.addClaim(claims, hw, D(2026, 10, 31)).length, 1);
// deeltjes: kwaliteit-bewust, niets bij reduce
const season = M.seasonOf(D(2026, 12, 1));
assert.equal(M.particlePlan(season, [], 0, false).length, 3); assert.equal(M.particlePlan(season, [], 1, false).length, 6); assert.equal(M.particlePlan(season, [], 2, false).length, 10); assert.equal(M.particlePlan(season, [], 2, true).length, 0);
for (const p of M.particlePlan(season, [hw], 2, false)) { assert.ok(ICONS[p.ic], 'deeltje-icoon ' + p.ic); assert.ok(p.left >= 0 && p.left <= 92 && p.dur > 5); }

// ---- minigames: spelregels
assert.equal(G.scale100(50, 100), 50); assert.equal(G.scale100(-5, 100), 0); assert.equal(G.scale100(500, 100), 100); assert.equal(G.scale100(1, 0), 0);
const seen = new Set(); for (let i = 0; i < 200; i++) seen.add(G.rainKind(i / 200)[0]); assert.deepEqual([...seen].sort(), ['bomb', 'coin', 'gem', 'star']);
assert.ok(G.rainDelay(0) > G.rainDelay(25) && G.rainDelay(1000) >= 0.28);
const rounds = G.foodRounds(14); assert.equal(rounds.length, 14); for (const r of rounds) { assert.ok(ICONS[r.n], r.n); assert.equal(G.FOOD_OK.includes(r.n), r.good); }
for (const n of [...G.FOOD_OK, ...G.FOOD_BAD, ...G.PAIR_ICONS]) assert.ok(ICONS[n], 'icoon bestaat ' + n);
const deck = G.memoryDeck(6); assert.equal(deck.length, 12); const cnt = {}; deck.forEach((d) => { cnt[d] = (cnt[d] || 0) + 1; }); assert.ok(Object.values(cnt).every((v) => v === 2) && Object.keys(cnt).length === 6);
assert.equal(G.memoryScore(6), 100); assert.ok(G.memoryScore(12) < G.memoryScore(8)); assert.equal(G.memoryScore(99), 20);
assert.ok(G.tapWindow(0) > G.tapWindow(14) && G.tapWindow(500) === 650);
assert.equal(G.tapPoints(false, 100, 1000), 0); assert.equal(G.tapPoints(true, 10, 1000), 3); assert.equal(G.tapPoints(true, 1000, 1000), 1);
assert.deepEqual(G.GAMES2.map((g) => g.id), M.MORE_GAME_IDS);
for (const g of G.GAMES2) assert.ok(/^[a-z]+$/.test(g.id) && g.name && g.desc && typeof g.create === 'function');

// ---- minigames: rooktest met nep-DOM (maken, tikken, opruimen)
class El {
  constructor(t) { this.tag = t; this.style = {}; this.children = []; this.listeners = {}; this.parentNode = null; this._html = ''; this.textContent = ''; this.offsetWidth = 1; }
  set innerHTML(v) { this._html = v; } get innerHTML() { return this._html; }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentNode = null; return c; }
  addEventListener(t, f) { (this.listeners[t] ||= []).push(f); } removeEventListener(t, f) { this.listeners[t] = (this.listeners[t] || []).filter((x) => x !== f); }
  fire(t) { (this.listeners[t] || []).slice().forEach((f) => f({ preventDefault() {}, clientX: 5, clientY: 5 })); }
  all() { return this.children.flatMap((c) => [c, ...c.all()]); }
}
globalThis.document = { createElement: (t) => new El(t) };
let rafQ = []; globalThis.requestAnimationFrame = (f) => { rafQ.push(f); return rafQ.length; }; globalThis.cancelAnimationFrame = () => {};
const step = (n, t0 = 0) => { for (let i = 0; i < n; i++) { const q = rafQ; rafQ = []; q.forEach((f) => f(t0 + (i + 1) * 40)); } };
for (const g of G.GAMES2) {
  const host = new El('div'); const log = { score: [], end: null };
  const api = { w: 360, h: 560, score: (n) => log.score.push(n), end: (n) => { log.end = n; }, pet: null, gfx: { iconSrc: (n) => 'art/3d/' + n + '.png', emoji: (n) => ICONS[n] } };
  const inst = g.create(host, api); assert.ok(inst && typeof inst.destroy === 'function', g.id);
  step(30);
  // tik alles aan wat tikbaar is
  for (const e of host.all()) if (e.listeners.pointerdown) e.fire('pointerdown');
  step(30);
  inst.destroy(); inst.destroy();
  assert.equal(host.children.length, 0, g.id + ' ruimt zijn DOM op');
  assert.ok(log.score.every((s) => s >= 0 && s <= 100 && Number.isInteger(s)), g.id + ' scores 0-100: ' + log.score.slice(0, 5));
}
// geen gfx meegegeven: emoji-terugval, geen crash
{ const host = new El('div'); const inst = G.GAMES2[0].create(host, { w: 300, h: 400, score() {}, end() {} }); step(10); inst.destroy(); }

// ---- koppeling in huisdier.js
for (const needle of ["from './huisdier-more.js?v=1'", "import('./huisdier-gfx.js?v=1')", "import('./huisdier-minigames.js?v=2')", 'data-do="gear"', 'evclaim(el)', "playScene('levelup'", "playScene('daily-bonus'", "playScene('new-record'", "playScene('chest-open'", 'extendRooms(m', 'evclaim(el)', 'hworld(el)', 'worldFrameHTML'])
  assert.ok(src.includes(needle), 'huisdier.js bevat ' + needle);
console.log('huisdier-more OK');
// ---- huisdier-gfx.js (brug naar gfx): thema-rand, seizoenslaag, iconen
{
  const store = new Map(); globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  globalThis.window = globalThis; globalThis.matchMedia = () => ({ matches: false });
  const H = await import(dir('huisdier-gfx.js'));
  assert.ok(H.worldList().length >= 18);
  const html = H.worldFrameHTML('ruimte'); assert.ok(html.includes('hd-wd') && html.includes('<img') || html.includes('gfx-emoji'), 'wereldrand heeft iconen');
  assert.equal(H.worldFrameHTML('bestaat-niet'), '');
  const lay = H.seasonLayerHTML(M.seasonOf(new Date(2026, 11, 1)), []); assert.ok(lay === '' || lay.includes('hd-season'));
  assert.ok(H.iconHtml('coin', 20).includes('coin'));
  assert.ok(H.gfxApi.iconSrc('coin') && H.gfxApi.emoji('coin'));
  console.log('huisdier-gfx OK');
}
