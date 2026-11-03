// Test voor ronde 4 van de tycoons: docs/big-r4-core.js (engine) + de vijf big-r4-<spel>.js configs + nieuwe inhoud via r4Metrics van elk spel.
//   node tools/test-r4-tycoons.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const D = (f) => path.join(here, '..', 'docs', f);
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FOUT: ' + m); } };

globalThis.__BIG_NOSCENES = true;
const mem = new Map();
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { mem.set(k, String(v)); }, removeItem: (k) => { mem.delete(k); } };

const C = await import(pathToFileURL(D('big-r4-core.js')).href);

/* ---------- 1. seizoenen: elke dag van het jaar valt in precies een seizoen ---------- */
{
  const seen = new Set();
  for (let m = 0; m < 12; m++) for (let d = 1; d <= new Date(2027, m + 1, 0).getDate(); d++) { const s = C.seasonAt(new Date(2027, m, d)); ok(!!s && s.mult > 1, `dag ${m + 1}/${d} heeft seizoen`); seen.add(s.id); }
  ok(seen.size === C.SEASONS.length, `alle ${C.SEASONS.length} seizoenen komen voor (${seen.size})`);
  ok(C.seasonAt(new Date(2026, 9, 31)).id === 'halloween' && C.seasonAt(new Date(2026, 11, 25)).id === 'kerst' && C.seasonAt(new Date(2027, 3, 27)).id === 'koning' && C.seasonAt(new Date(2026, 10, 20)).id === 'sint', 'bekende data');
  ok(C.SEASONS.length >= 12, 'minstens 12 seizoenen');
}

/* ---------- 2. engine ---------- */
function mkCfg(extra = {}) {
  const st = { coins: 0, m: { a: 0, b: 0 } };
  const cfg = {
    game: 'test', name: 'Test', minGift: 10, metrics: () => st.m, rate: () => 100, add: (v) => { st.coins += v; },
    dailies: [
      { id: 'd1', e: '1', metric: 'a', g: [5, 10, 20], t: (g) => 'a ' + g }, { id: 'd2', e: '2', metric: 'b', g: [5, 10, 20], t: (g) => 'b ' + g },
      { id: 'd3', e: '3', metric: 'a', secs: [60, 120, 240], g: [10, 20, 40], t: (g) => 'c ' + g }, { id: 'd4', e: '4', metric: 'b', g: [1, 2, 3], noscale: 1, t: (g) => 'd ' + g },
    ],
    achs: [{ id: 'x1', n: 'X1', e: '1', d: 'a>=10', pts: 2, test: (m) => m.a >= 10, prog: (m) => [m.a, 10] }],
    ng: { count: () => st.ng || 0, can: () => false }, ...extra,
  };
  return { st, cfg };
}
{
  let date = new Date(2026, 9, 28, 12);
  const { st, cfg } = mkCfg();
  let r = 0.5; const E = C.createEngine(cfg, { now: () => date, rng: () => r });
  E.start();
  ok(E.season.id === 'halloween', 'seizoen halloween');
  ok(E.R.dq.list.length === 3 && new Set(E.R.dq.list.map((q) => q.id)).size === 3, 'drie verschillende dagopdrachten');
  const list1 = JSON.stringify(E.R.dq.list.map((q) => q.id));
  const E2 = C.createEngine(cfg, { now: () => date }); E2.start(); ok(JSON.stringify(E2.R.dq.list.map((q) => q.id)) === list1, 'dagopdrachten zijn per dag/spel vast');
  // multiplier en bonusinkomen
  const mult = E.multiplier(); ok(Math.abs(mult - 1.2 * 1) < 1e-9, 'multiplier = seizoen 1,20 (' + mult + ')');
  E.step(2); ok(Math.abs(st.coins - 100 * 0.2 * 2) < 1e-6, 'bonusinkomen = rate*(mult-1)*dt: ' + st.coins);
  // dt wordt begrensd
  const c0 = st.coins; E.step(1000); ok(st.coins - c0 <= 100 * 0.2 * 5 + 1e-6, 'dt begrensd op 5 s');
  const ds0 = E.dailyState(); ok(ds0.every((d) => !d.done), 'dagopdrachten nog niet klaar (basis = start)');
  // prestaties
  st.m.a = 9; E.checkAch(); ok(!E.R.ach.x1, 'prestatie nog niet');
  st.m.a = 10; const before = E.R.pts; const got = E.checkAch(); ok(E.R.ach.x1 && got.length >= 1 && E.R.pts === before + 2 + (got.length - 1) * 0 || E.R.pts >= before + 2, 'prestatie behaald geeft sterren');
  ok(E.checkAch().length === 0, 'prestatie maar een keer');
  // dagopdracht voortgang en claimen
  st.m.a += 1e6; st.m.b += 1e6; const ds1 = E.dailyState(); ok(ds1.every((d) => d.done), 'dagopdrachten klaar na voortgang');
  const gold0 = st.coins; const o = E.claimDaily(0); ok(o && o.gold > 0 && st.coins > gold0, 'claim geeft geld'); ok(E.claimDaily(0) === null, 'niet dubbel claimen');
  E.claimDaily(1); const o3 = E.claimDaily(2); ok(o3 && o3.bonus === 2, 'bonus bij alle drie'); ok(E.R.dq.streak === 1, 'reeks 1');
  // volgende dag: reeks loopt door
  date = new Date(2026, 9, 29, 12); E.ensureDaily(); ok(E.R.dq.day === '2026-10-29' && E.R.dq.list.every((q) => !q.cl), 'nieuwe dag nieuwe opdrachten');
  st.m.a += 1e6; st.m.b += 1e6; E.claimDaily(0); ok(E.R.dq.streak === 2 && E.R.dq.best === 2, 'reeks 2');
  date = new Date(2026, 10, 5, 12); E.ensureDaily(); st.m.a += 1e6; st.m.b += 1e6; E.claimDaily(0); ok(E.R.dq.streak === 1, 'reeks breekt na gemiste dagen');
  // spel opnieuw begonnen: tellers lager dan basis
  date = new Date(2026, 10, 6, 12); E.ensureDaily(); st.m.a = 0; st.m.b = 0; ok(E.dailyState().every((d) => d.cur === 0 && !d.done), 'tellers die resetten geven geen negatieve voortgang');
  // evenementen
  E.pending = null; E.active = null; const sp = E.spawn('gift'); ok(sp && E.pending, 'evenement verschijnt'); const cc = st.coins; const t = E.takeEvent(); ok(t && t.gold > 0 && st.coins > cc && !E.pending, 'cadeau-evenement pakken');
  E.spawn('gold'); E.takeEvent(); ok(E.active && E.active.mult === 2 && Math.abs(E.multiplier() - E.baseMult() * 2) < 1e-9, 'gouden kwartier verdubbelt');
  E.step(5); E.active.left = 1; E.step(2); ok(!E.active, 'bonus loopt af');
  E.spawn('star'); const p0 = E.R.pts; E.takeEvent(); ok(E.R.pts >= p0 + 1, 'ster-evenement geeft ster');
  E.spawn('rush'); E.step(5); E.step(5); E.step(5); E.step(5); E.step(5); E.step(5); E.step(5); E.step(5); E.step(5); ok(E.pending === null, 'gemist evenement verdwijnt na 40 s');
  // spontaan verschijnen
  const E3 = C.createEngine(cfg, { now: () => date, rng: () => 0.3 }); E3.start(); let spawned = false; E3.on('event', (x) => { if (x.spawn) spawned = true; }); for (let i = 0; i < 100; i++) E3.step(5); ok(spawned, 'evenement verschijnt vanzelf binnen 500 s');
  // perks en rang
  E.R.pts = 100; E.R.tot = 0; ok(E.buyPerk('inc') && E.perkLvl('inc') === 1 && E.R.pts === 98, 'perk kopen kost sterren'); for (let i = 0; i < 20; i++) E.buyPerk('inc'); ok(E.perkLvl('inc') === C.PERKS.inc.max, 'perk max');
  ok(!E.buyPerk('bestaatniet'), 'onbekende perk'); E.R.pts = 0; ok(!E.buyPerk('evt'), 'te weinig sterren');
  const rk = []; E.on('rank', (x) => rk.push(x.rank)); E.R.tot = 0; E.addStars(5); ok(rk.length === 1 && E.rank() === 1, 'rang omhoog bij 4 sterren'); E.addStars(400); ok(E.rank() === C.RANKS.length - 1, 'hoogste rang');
  ok(C.RANKS.every((x, i) => i === 0 || x.at > C.RANKS[i - 1].at), 'rangdrempels stijgen');
  // nieuw spel+
  const ng0 = E.R.pts; st.ng = 2; E.checkNg(); ok(E.R.ngSeen === 2 && E.R.pts === ng0 + 6, 'nieuw spel+ geeft 3 sterren per keer'); ok(E.ngCount() === 2 && E.baseMult() > 1.06 * 1.2, 'nieuw spel+ verhoogt bonus');
  // opslag
  const str = E.serialize(); ok(str.length < 2000, 'opslag klein: ' + str.length); const E4 = C.createEngine(cfg, { now: () => date }); ok(E4.load(str) && E4.R.tot === E.R.tot && E4.R.ach.x1 && E4.R.perks.inc === E.R.perks.inc, 'opslag round-trip');
  ok(!C.createEngine(cfg).load('{kapot'), 'kapotte opslag wordt genegeerd');
  const bad = C.sanitize({ pts: -5, tot: 'x', perks: { inc: 999, nep: 3 }, seen: ['nep', 'kerst'], dq: { list: [{ id: 'a', goal: -3, tier: 9 }] } });
  ok(bad.pts === 0 && bad.tot === 0 && bad.perks.inc === C.PERKS.inc.max && !bad.perks.nep && bad.seen.length === 1 && bad.dq.list[0].goal === 1 && bad.dq.list[0].tier === 2, 'sanitize repareert rommel');
  const A = C.createEngine(cfg).serialize(); const B2 = E.serialize(); ok(C.pickBetter(A, B2) === B2 && C.pickBetter(B2, A) === B2 && C.pickBetter(null, A) === A, 'pickBetter kiest de verste voortgang');
  ok(C.fmtNum(12345) === '12,3K' && C.fmtNum(5) === '5', 'fmtNum');
  // seizoenswissel
  const E5 = C.createEngine(cfg, { now: () => date }); const ev = []; E5.on('season', (x) => ev.push(x)); E5.checkSeason(); date = new Date(2026, 11, 10, 12); E5.checkSeason(); ok(ev.some((x) => x.changed) && E5.season.id === 'kerst', 'seizoen wisselt');
}

/* ---------- 3. game-configs en echte tellers ---------- */
const STUB_FS = `const doc=(db,...p)=>({path:p.join('/')});const getDoc=async()=>({exists:()=>false,data:()=>null});const setDoc=async()=>{};`;
async function loadGame(file) {
  let src = fs.readFileSync(D(file), 'utf8');
  src = src.replace(/'\.\/big-gfx\.js\?v=1'/g, JSON.stringify(pathToFileURL(D('big-gfx.js')).href));
  src = src.replace(/import \{[^}]*\} from 'https:[^']*';/g, STUB_FS);
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'r4-')), file.replace('.js', '.mjs'));
  fs.writeFileSync(tmp, src);
  return import(pathToFileURL(tmp).href);
}
const GAMES = {
  themapark: (M) => { const G = M.newGame('t'); return () => M.r4Metrics(G); },
  aquarium: (M) => { const S = M.newState(); return () => M.r4Metrics(S); },
  stadbouwer: (M) => { const S = M.newCity(5); return () => M.r4Metrics(S, M.calc(S)); },
  ruimtebasis: (M) => { const S = M.newState(); return () => M.r4Metrics(S); },
  foodtruck: (M) => { const S = M.newState(); return () => M.r4Metrics(S); },
};
let totAch = 0, totDaily = 0, totEv = 0;
for (const [game, mk] of Object.entries(GAMES)) {
  const R = await import(pathToFileURL(D(`big-r4-${game}.js`)).href);
  const M = await loadGame(`big-${game}.js`);
  const metrics = mk(M)(), cfg = R.CONFIG;
  ok(cfg.game === game, `${game}: game-id`);
  ok(cfg.achs.length >= 15, `${game}: minstens 15 eigen prestaties (${cfg.achs.length})`); ok(cfg.dailies.length >= 8, `${game}: minstens 8 soorten dagopdrachten (${cfg.dailies.length})`);
  ok(cfg.events.length >= 4, `${game}: eigen evenementen`); ok(Object.keys(cfg.flavor).length >= 6, `${game}: seizoenstips`); ok(cfg.news.length >= 4, `${game}: nieuws`);
  const ids = [...cfg.achs.map((a) => a.id), ...cfg.dailies.map((d) => d.id), ...cfg.events.map((e) => e.id)]; ok(new Set(ids).size === ids.length, `${game}: unieke id's`);
  for (const a of cfg.achs) { let v; try { v = a.test(metrics); } catch (e) { v = 'fout ' + e.message; } ok(v === false, `${game}: prestatie ${a.id} is op een nieuw spel nog niet behaald (${v})`); if (a.prog) { const p = a.prog(metrics); ok(Array.isArray(p) && p.every(Number.isFinite), `${game}: ${a.id} voortgang is getal`); } }
  for (const d of cfg.dailies) ok(Object.prototype.hasOwnProperty.call(metrics, d.metric) && Number.isFinite(metrics[d.metric]), `${game}: dagopdracht ${d.id} gebruikt bestaande teller ${d.metric}`);
  for (const [k, v] of Object.entries(metrics)) ok(Number.isFinite(v), `${game}: teller ${k} is een getal (${v})`);
  for (const s of C.SEASONS) ok(!!(cfg.flavor[s.id] || s.tip), `${game}: tekst voor ${s.id}`);
  // engine met echte tellers: draait een uur zonder fouten, opslag klein
  let coins = 0; const live = { metrics: mk(M), rate: () => 50, add: (v) => { coins += v; }, ng: { count: () => 0, can: () => false } };
  const E = C.createEngine({ ...cfg, ...live }, { now: () => new Date(2026, 10, 2, 12) }); E.start(); for (let i = 0; i < 720; i++) E.step(5);
  ok(coins > 0 && E.R.play >= 3600 && E.R.ach.g_min60, `${game}: engine draait een uur (bonus ${Math.round(coins)})`); ok(E.serialize().length < 2000, `${game}: opslag klein`);
  ok(E.R.dq.list.length === 3, `${game}: drie dagopdrachten`); ok(E.R.evN === 0 && E.pending !== undefined, `${game}: evenementen gaan niet vanzelf op`);
  totAch += cfg.achs.length; totDaily += cfg.dailies.length; totEv += cfg.events.length;
}
ok(totAch >= 75, `totaal ${totAch} eigen prestaties`);

/* ---------- 4. mount zonder DOM geeft null, geen fout ---------- */
{ const had = globalThis.document; delete globalThis.document; const r = await C.mount({}, { game: 'x', name: 'X' }); ok(r === null, 'mount zonder DOM'); if (had) globalThis.document = had; }

console.log(`${pass} geslaagd, ${fail} mislukt (prestaties ${totAch}, dagopdrachten ${totDaily}, evenementen ${totEv})`);
process.exit(fail ? 1 : 0);
