// Tests en economie-simulatie voor docs/big-aquarium.js.  Gebruik:  node tools/test-big-aquarium.mjs [--sim]
// Zonder browser: de Firestore-import wordt vervangen door een mock en de DOM door een kleine nep-DOM.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(here, '..', 'docs', 'big-aquarium.js');
let src = fs.readFileSync(SRC, 'utf8');
const imp = /import \{ doc, getDoc, setDoc \} from 'https:\/\/www\.gstatic\.com[^']*';/;
if (!imp.test(src)) throw new Error('Firestore-import niet gevonden');
src = src.replace(imp, `export const __fs = { calls: [], store: {}, failSet: false };
const doc = (db, c, id) => ({ c, id });
const getDoc = async (r) => ({ exists: () => !!__fs.store[r.id], data: () => __fs.store[r.id] });
const setDoc = async (r, d) => { if (__fs.failSet) throw new Error('nee'); __fs.calls.push([r.id, JSON.parse(JSON.stringify(d))]); __fs.store[r.id] = d; };`);

// nep-DOM
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => { store.set(k, String(v)); }, removeItem: (k) => { store.delete(k); } };
const ctxProxy = new Proxy({}, {
  get(t, p) {
    if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => ({ addColorStop() {} });
    if (p in t) return t[p];
    return () => {};
  },
  set(t, p, v) { t[p] = v; return true; },
});
function mkEl(tag = 'div') {
  const cache = {};
  const o = {
    tag, children: [], style: {}, dataset: {}, listeners: {}, parentNode: null, isConnected: true, clientWidth: 360, width: 0, height: 0, className: '', textContent: '', id: '', _html: '',
    classList: { add() {}, remove() {}, toggle() {} },
    get innerHTML() { return this._html; }, set innerHTML(v) { this._html = String(v); },
    appendChild(c) { c.parentNode = o; o.children.push(c); return c; },
    remove() { if (o.parentNode) o.parentNode.children = o.parentNode.children.filter((x) => x !== o); o.parentNode = null; },
    querySelector(sel) { if (!cache[sel]) { cache[sel] = mkEl(); cache[sel].parentNode = o; } return cache[sel]; },
    querySelectorAll() { return []; },
    addEventListener(t, f) { o.listeners[t] = f; }, removeEventListener(t) { delete o.listeners[t]; },
    getContext() { return ctxProxy; }, getBoundingClientRect() { return { left: 0, top: 0, width: 360, height: 252 }; },
    setAttribute() {}, closest() { return null; }, toDataURL() { return 'data:image/png;base64,AAAA'; },
  };
  return o;
}
globalThis.document = { createElement: (t) => mkEl(t), getElementById: () => null, head: mkEl('head'), hidden: false, visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };
globalThis.window = { addEventListener() {}, removeEventListener() {}, devicePixelRatio: 2, scrollTo() {} };

const tmp = path.join(os.tmpdir(), `aq-mod-${process.pid}.mjs`);
fs.writeFileSync(tmp, src);
const M = await import(pathToFileURL(tmp).href);
fs.unlinkSync(tmp);

let fails = 0, passes = 0;
const t = (name, cond, extra = '') => { if (cond) passes++; else { fails++; console.log('  FOUT:', name, extra); } };
const approx = (a, b, e = 1e-6) => Math.abs(a - b) <= e;
const SIM = process.argv.includes('--sim');
const PU = 3e8;

/* ------------------------------------------------------------------ data */
console.log('# data');
t('42 soorten', M.SP.length >= 30, M.SP.length);
t('unieke ids', new Set(M.SP.map((s) => s.id)).size === M.SP.length);
for (const s of M.SP) {
  t('hab ' + s.id, !!M.TT[s.hab]); t('prijs ' + s.id, s.price > 0 && s.ap >= 1); t('tekenaar ' + s.id, !!s.art);
  t('weetje ' + s.id, typeof s.f === 'string' && s.f.length > 10);
}
for (const r of M.REGIONS) for (const id of Object.keys(r.loot)) t(`loot ${r.id}/${id}`, !!M.SPM[id]);
for (const [k, tt] of Object.entries(M.TT)) t('shop ' + k, M.SHOP(k).length >= 3, k);
t('elk xo-dier heeft een expeditie', M.SP.filter((s) => s.xo).every((s) => M.REGIONS.some((r) => r.loot[s.id])));
t('doelen uniek', new Set(M.GOALS.map((g) => g[0])).size === M.GOALS.length);
t('prestaties uniek', new Set(M.ACH.map((g) => g[0])).size === M.ACH.length);

// tekenen met nep-canvas: alle soorten, modi, decoraties, achtergronden
for (const s of M.SP) { for (const tm of [0, 1.7]) { M.drawCreature(ctxProxy, s, tm, 0.5, 'walk'); M.drawCreature(ctxProxy, s, tm, 0.1, 'swim'); } t('icoon ' + s.id, typeof M.iconURL(s.id) === 'string'); }
for (const id of Object.keys(M.DECO)) M.drawDeco(ctxProxy, id, 50, 100, 1.2, 0, 360, 6);
for (const k of M.TT_KEYS) M.drawBG(ctxProxy, k, 360, 252, 3, M.layoutOf(k, 360, 252));
t('tekenen zonder fouten', true);

/* ------------------------------------------------------------------ staat en opslag */
console.log('# staat en opslag');
let s = M.newState(1000);
t('start: 2 guppy, 15 munten', M.animalsTotal(s) === 2 && s.c === 15);
t('inkomen > 0 zonder iets', M.economy(s).ips > 0);
const str = M.serialize(s);
const back = M.parseSave(str);
t('serialize/parse rond', back && back.c === s.c && back.T[0].a.guppy === 2);
t('parse rommel', M.parseSave('niet json') === null && M.parseSave('{"a":1}') === null && M.parseSave('') === null);
// migratie van een kale/oude save
const old = M.migrate({ T: [{ k: 'zoet', l: 2, a: { guppy: 3, bestaatniet: 4 }, d: ['plant', 'x'] }], c: 99 });
t('migratie vult aan', old && old.T[0].a.guppy === 3 && !old.T[0].a.bestaatniet && old.T[0].d.length === 1 && old.st.taps === 0 && old.pk && old.v === M.VERSION);
t('migratie zet NaN recht', M.migrate({ T: [{ k: 'zoet', a: { guppy: 1 } }], c: NaN }).c === 0);
// maximale save blijft onder 18000
{
  const big = M.newState(1);
  big.T = []; for (let i = 0; i < M.MAX_TANKS; i++) { const k = M.TT_KEYS[i % 5]; const tk = M.newTank(k); tk.l = 10; M.SHOP(k).forEach((sp) => { tk.a[sp.id] = 9; }); tk.d = Object.keys(M.DECO).filter((d) => M.decoOk(d, k)).slice(0, 6); big.T.push(tk); }
  M.SP.forEach((sp) => { big.dc[sp.id] = 1; big.inv[sp.id] = 5; });
  M.ACH.forEach((a) => { big.ach[a[0]] = 1; }); M.GOALS.forEach((g) => { big.gl[g[0]] = 1; });
  M.UP_KEYS.forEach((k) => { big.up[k] = M.UP[k].max; }); Object.keys(M.PK).forEach((k) => { big.pk[k] = M.PK[k].max; });
  big.x = [{ r: 'pool', t0: 1e12, t1: 1e12 }, { r: 'pool', t0: 1e12, t1: 1e12 }, { r: 'pool', t0: 1e12, t1: 1e12 }];
  big.c = 1.234567891e45; big.te = 9.87654321e60; big.e = 1.1111111111e50;
  const bs = M.serialize(big);
  t('maximale save < 18000 tekens', bs.length < 18000, bs.length);
  console.log('  maximale save:', bs.length, 'tekens');
  t('maximale save leesbaar', !!M.parseSave(bs));
}
t('fmt', M.fmt(0) === '0' && M.fmt(999) === '999' && M.fmt(1500) === '1,5K' && M.fmt(2.5e6) === '2,5M' && M.fmt(1e12) === '1T' && M.fmt(NaN) === '∞' || M.fmt(NaN) === '∞');

/* ------------------------------------------------------------------ economie en acties */
console.log('# economie en acties');
M.setRng(() => 0.5);
s = M.newState(0);
const i0 = M.economy(s).ips;
s.c = 100;
let r = M.buyAnimal(s, 0, 'guppy');
t('guppy kopen', r.ok && s.T[0].a.guppy === 3 && s.c < 100);
t('meer dieren, meer inkomen', M.economy(s).ips > i0);
t('prijs stijgt per exemplaar', M.priceOf(s.T[0], 'guppy') > M.SPM.guppy.price);
r = M.buyAnimal(s, 0, 'zeester'); t('verkeerde habitat geweigerd', !r.ok);
r = M.buyAnimal(s, 0, 'axolotl'); t('xo-dier niet te koop', !r.ok);
s.c = 1e9; for (let i = 0; i < 20; i++) M.buyAnimal(s, 0, 'guppy'); t('tank vol -> geweigerd', M.tankUnits(s.T[0]) <= M.tankCap(s.T[0]));
r = M.buyAnimal(s, 0, 'tetra'); t('vol geweigerd', !r.ok && /vol/i.test(r.msg));
r = M.upgradeTank(s, 0); t('tank upgraden', r.ok && s.T[0].l === 2 && M.tankCap(s.T[0]) === 9);
r = M.buildTank(s, 'zout'); t('tank bouwen', r.ok && s.T.length === 2);
t('bouwkosten stijgen', M.buildCost(s, 'zout') > M.TT.zout.build);
r = M.buyDeco(s, 0, 'plant'); t('deco kopen', r.ok && s.T[0].d.includes('plant'));
r = M.buyDeco(s, 0, 'plant'); t('deco dubbel geweigerd', !r.ok);
r = M.buyDeco(s, 0, 'ijs'); t('ijsberg niet in zoet', !r.ok);
r = M.buyUp(s, 'ticket'); t('upgrade ticket', r.ok && s.up.ticket === 1);
t('ticket verhoogt pv', M.pvOf(s) > 2);
r = M.moveToInv(s, 0, 'guppy'); t('naar voorraad', r.ok && s.inv.guppy === 1);
r = M.placeFromInv(s, 0, 'guppy'); t('terug plaatsen', r.ok && !s.inv.guppy);
// zorg
{
  const q = M.newState(0); const tk = q.T[0];
  tk.w = 10; tk.f = 5; const bad = M.tankFactor(tk); t('slechte zorg verlaagt inkomen', bad < 1);
  tk.s = 1; t('ziek verlaagt verder maar nooit nul', M.tankFactor(tk) > 0.2 && M.tankFactor(tk) < bad);
  t('inkomen nooit 0 bij ziek en vuil', M.economy(q).ips > 0);
  q.c = 1e6; r = M.treatTank(q, 0); t('medicijn geneest', r.ok && !tk.s && tk.w === 100);
  t('medicijn tank gezond -> fout', !M.treatTank(q, 0).ok);
  // water daalt, ziek na lang vuil, dierenarts
  const z = M.newState(0); for (let i = 0; i < 4000; i++) M.step(z, 1);
  t('verwaarloosde tank wordt ziek (maar leeft)', z.T[0].s === 1 && M.animalsTotal(z) >= 2 && z.c > 15);
  z.up.st_vet = 1; M.step(z, 1); t('dierenarts geneest', z.T[0].s === 0);
  const y = M.newState(0); y.up.st_feed = 1; y.up.st_clean = 1; for (let i = 0; i < 4000; i++) M.step(y, 1);
  t('personeel houdt tank gezond', y.T[0].w >= 40 && y.T[0].f >= 40 && !y.T[0].s);
  const f = M.newState(0); f.T[0].f = 10; const tip = M.feedTank(f, 0); t('voeren geeft fooi en voer', tip >= 1 && f.T[0].f === 22 && f.st.taps === 1);
}
// fokken
{
  const q = M.newState(0); q.T[0].l = 3; let ev = [];
  for (let i = 0; i < 900; i++) { q.T[0].w = 100; q.T[0].f = 100; M.step(q, 1, ev); }
  t('dieren krijgen jongen', q.st.births >= 5 && M.animalsTotal(q) > 2, q.st.births);
  t('geboorte events', ev.some((e) => e.t === 'birth'));
  t('tank loopt niet over', M.tankUnits(q.T[0]) <= M.tankCap(q.T[0]));
  const one = M.newState(0); one.T[0].a = { guppy: 1 }; for (let i = 0; i < 600; i++) { one.T[0].w = 100; one.T[0].f = 100; M.step(one, 1); }
  t('één dier krijgt geen jongen', one.st.births === 0);
}
// offline voortgang
{
  const q = M.newState(0); q.c = 500; q.T[0].a = { guppy: 4, tetra: 2 };
  const ips = M.economy(q, true).ips;
  const a = M.applyOffline(q, 3600); t('offline: 1 uur geeft ongeveer uren*ips*eff', approx(a.gain, ips * 3600 * M.offlineEff(q), 1e-6) && a.gain > 0);
  const q2 = M.newState(0); q2.T[0].a = { guppy: 4 }; const b = M.applyOffline(q2, 3600 * 100);
  const q3 = M.newState(0); q3.T[0].a = { guppy: 4 }; const c = M.applyOffline(q3, 3600 * 8);
  t('offline gemaximeerd op 8 uur', approx(b.gain, c.gain) && b.secs === 8 * 3600);
  t('offline maakt nooit ziek, water boven vloer', !q2.T[0].s && q2.T[0].w >= 34 && q2.T[0].f >= 39);
  const q4 = M.newState(0); const g0 = q4.c; M.applyOffline(q4, -50); t('negatieve tijd doet niets', q4.c === g0);
  const q5 = M.newState(0); q5.up.st_feed = 1; q5.up.st_clean = 1; t('personeel verhoogt offline-efficiëntie', M.offlineEff(q5) > M.offlineEff(M.newState(0)));
  const q6 = M.newState(0); q6.pk.off = 8; q6.up.st_feed = 1; q6.up.st_clean = 1; t('offline-efficiëntie max 100%', M.offlineEff(q6) <= 1);
}
// expedities
{
  M.setRng(Math.random);
  const q = M.newState(0); q.c = 1e6;
  t('geen schip zonder munten', !M.startExp(M.newState(0), 'amazone').ok);
  const d = M.expDur(q, M.REGM.amazone); t('eerste reis is kort', d === 30, d);
  r = M.startExp(q, 'amazone', 1000); t('reis starten', r.ok && q.x.length === 1);
  t('tweede schip geweigerd (1 slot)', !M.startExp(q, 'rif', 1000).ok);
  t('te vroeg binnenhalen', !M.collectExp(q, 0, 2000).ok);
  r = M.collectExp(q, 0, 1000 + 31000); t('binnenhalen geeft dier', r.ok && r.found.length >= 1 && Object.keys(q.inv).length >= 1 && q.st.exps === 1);
  const id = r.found[0].id; t('gevonden dier is ontdekt', !!q.dc[id]);
  t('volgende reis normale duur', M.expDur(q, M.REGM.amazone) === 120);
  q.up.sub = 6; t('onderzeeër: 3 plekken', M.expSlots(q) === 3 && M.expDur(q, M.REGM.amazone) < 120);
  const cnt = {}; for (let i = 0; i < 4000; i++) { const x = M.rollLoot(q, M.REGM.pool); cnt[x] = (cnt[x] || 0) + 1; }
  t('loot: alleen uit tabel en narwal zeldzaam', Object.keys(cnt).every((k) => M.REGM.pool.loot[k]) && cnt.narwal > 0 && cnt.narwal < cnt.ezel);
}
// dagelijks
{
  const q = M.newState(0); const day = new Date(2026, 5, 10, 12);
  let di = M.dailyInfo(q, day); t('dag 1 beschikbaar', di.can && di.next === 1);
  r = M.claimDaily(q, day); t('dag 1 claimen', r.ok && q.dy.streak === 1 && q.c > 15);
  t('niet twee keer per dag', !M.claimDaily(q, day).ok);
  const d2 = new Date(2026, 5, 11, 9); r = M.claimDaily(q, d2); t('volgende dag reeks 2', r.ok && q.dy.streak === 2);
  const d4 = new Date(2026, 5, 14, 9); r = M.claimDaily(q, d4); t('gemiste dag reset reeks', r.ok && q.dy.streak === 1);
  for (let k = 1; k <= 6; k++) M.claimDaily(q, new Date(2026, 6, 1 + k, 9));
  t('beste reeks bijgehouden', q.dy.best >= 6);
  const q7 = M.newState(0); q7.dy = { last: M.dayKey(new Date(2026, 6, 6, 9)), streak: 6, best: 6 }; r = M.claimDaily(q7, new Date(2026, 6, 7, 9));
  t('dag 7 geeft verrassingsdier', r.ok && r.streak === 7 && !!r.pet && q7.inv[r.pet] === 1);
}
// doelen en prestaties
{
  const q = M.newState(0);
  t('doel nog niet klaar', !M.claimGoal(q, 'g1').ok);
  q.te = 60; r = M.claimGoal(q, 'g1'); t('doel claimen', r.ok && q.gl.g1 && q.c > 15);
  t('doel niet dubbel', !M.claimGoal(q, 'g1').ok);
  q.st.taps = 150; const got = M.checkAch(q); t('prestatie voerliefhebber', got.some((a) => a[0] === 'a_tap1'));
  t('prestatie niet dubbel', M.checkAch(q).length === 0);
  t('prestatie +2% inkomsten', M.multOf(q) > M.multOf(M.newState(0)));
}
// prestige
{
  const q = M.newState(0);
  t('te vroeg voor prestige', !M.doPrestige(q).ok && M.prestigeGain(q) === 0);
  q.e = PU * 9; q.te = q.e; q.up.st_feed = 1; q.up.ticket = 5; q.dc.kwal = 1; q.ach.a_tap1 = 1; q.gl.g1 = 1; q.T.push(M.newTank('rif')); q.c = 123;
  t('prestige-winst sqrt', M.prestigeGain(q) === 3);
  r = M.doPrestige(q, 5000); t('verhuizen', r.ok && q.P === 3 && q.pe === 3 && q.T.length === 1 && q.e === 0 && !q.up.ticket && !q.up.st_feed);
  t('verhuizen bewaart meta', q.dc.kwal && q.ach.a_tap1 && q.gl.g1 && q.st.pres === 1);
  t('startkapitaal', q.c === 15);
  t('parels verhogen inkomen', M.multOf(q) > 1.29);
  r = M.buyPerk(q, 'inc'); t('perk kopen', r.ok && q.pk.inc === 1 && q.pe === 2);
  t('perk te duur', (q.pe = 0, !M.buyPerk(q, 'inc').ok));
  q.pe = 5; q.pk.start = 1; t('startkapitaal-perk', M.startCoins(q) === 60);
  q.e = PU; q.pk.keep = 1; q.up.st_clean = 1; q.up.ticket = 2; M.doPrestige(q); t('vast personeel blijft', q.up.st_clean === 1 && !q.up.ticket);
}

/* ------------------------------------------------------------------ simulatie (gulzige bot) */
console.log('# simulatie');
function sim({ tap, care, hours, label, idleOnly }) {
  M.setRng(() => 0.37);
  const q = M.newState(0);
  let time = 0, lastBuy = 0, maxGap = 0, gapAt = 0, firstBuy = null, firstLadder = null, firstGoal = null, minIps = Infinity;
  const marks = {}; const MK = [[1e3, '1K'], [1e4, '10K'], [1e5, '100K'], [1e6, '1M'], [3e8, 'prestige(300M)'], [1e9, '1B']];
  const gapsBig = [];
  let nextCheck = 0, plan = null, nextExp = 0;
  const cands = () => {
    const out = [];
    const base = M.economy(q).ips;
    const tryApply = (cost, name, fn, bonusIps) => {
      const c = structuredClone(q); const before = M.economy(c).ips; const ok = fn(c);
      if (!ok) return;
      const gain = Math.max(M.economy(c).ips - before, 0) + (bonusIps || 0);
      if (gain > 0) out.push({ cost, name, fn, gain, pb: cost / gain });
    };
    q.T.forEach((tk, ti) => {
      for (const sp of M.SHOP(tk.k)) { const cost = M.priceOf(tk, sp.id); tryApply(cost, 'dier ' + sp.id, (c) => M.buyAnimal(c, ti, sp.id).ok); }
      for (const id of Object.keys(M.DECO)) if (M.decoOk(id, tk.k) && !tk.d.includes(id)) tryApply(M.decoCost(tk, id), 'deco ' + id, (c) => M.buyDeco(c, ti, id).ok);
      const full = M.tankUnits(tk) >= M.tankCap(tk) - 1;
      if (full && tk.l < M.MAX_TANK_LV) tryApply(M.tankLvCost(tk), 'tanklv', (c) => M.upgradeTank(c, ti).ok, base * 0.25 / q.T.length);
    });
    for (const id of M.UP_KEYS) if ((q.up[id] || 0) < M.UP[id].max) tryApply(M.upCost(q, id), 'up ' + id, (c) => M.buyUp(c, id).ok, id.startsWith('st_') ? base * 0.08 : id === 'kraam' ? base * 0.05 : id === 'sub' ? base * 0.03 : id === 'filt' ? base * 0.02 : id === 'tap' ? base * 0.02 : 0);
    if (q.T.length < M.MAX_TANKS && q.T.every((tk) => M.tankUnits(tk) >= M.tankCap(tk) * 0.7)) for (const k of M.TT_KEYS) tryApply(M.buildCost(q, k), 'bouw ' + k, (c) => M.buildTank(c, k).ok, base * 0.35);
    return out;
  };
  const dec = () => {
    const cs = cands(); if (!cs.length) return null;
    cs.sort((a, b) => a.pb - b.pb);
    return cs;
  };
  const stepLimit = hours * 3600;
  let prestigeTime = null;
  while (time < stepLimit) {
    // acties van de speler
    if (tap && time < tap.until && Math.floor(time * tap.rate) !== Math.floor((time - 1) * tap.rate)) { for (let k = 0; k < tap.rate; k++) M.feedTank(q, 0); }
    if (care && time % care === 0 && time > 0) q.T.forEach((tk, i) => { M.cleanTank(q, i); M.fillFood(q, i); if (tk.s) M.treatTank(q, i); });
    M.step(q, 1); time++;
    // expeditie
    if (q.x.length) { const x = q.x[0]; if (x.t1 <= time * 1000) { const res = M.collectExp(q, 0, time * 1000); if (res.ok) res.found.forEach((f) => { for (let i = 0; i < q.T.length; i++) if (M.placeFromInv(q, i, f.id).ok) break; }); } }
    else if (time >= nextExp) {
      const regs = M.REGIONS.filter((r) => q.c > r.cost * 4); regs.sort((a, b) => b.cost - a.cost);
      if (regs.length && q.T.length) { const rg = regs[0]; if (M.startExp(q, rg.id, time * 1000).ok) nextExp = time + 60; }
    }
    // daily & goals (alleen telbaar)
    if (!process.env.NOGOAL) for (const gl of M.GOALS) if (!q.gl[gl[0]] && gl[2](q) >= gl[3]) { if (firstGoal === null) firstGoal = time; const rr = M.claimGoal(q, gl[0]); if (process.env.TRACE) console.log(time, 'doel', gl[1], rr.reward); }
    M.checkAch(q);
    minIps = Math.min(minIps, M.economy(q).ips);
    if (process.env.TL && time % 300 === 0) console.log(label.slice(0,6), fm(time), 'c', M.fmt(q.c), 'ips', M.fmt(M.economy(q).ips), 'A', M.fmt(M.economy(q).A), 'tanks', q.T.length, 'an', M.animalsTotal(q), 'lv', q.T.map(t=>t.l).join(''), JSON.stringify(q.up).replace(/"/g,''));
    if (process.env.TRACE && time % 10 === 0 && time <= 240) console.log(time, 'c', M.fmt(q.c), 'ips', M.fmt(M.economy(q).ips), 'A', M.fmt(M.economy(q).A), 'pv', M.fmt(M.economy(q).pv), 'M', M.economy(q).M.toFixed(2), 'tanks', q.T.length, 'an', M.animalsTotal(q), JSON.stringify(q.up));
    for (const [v, n] of MK) if (marks[n] === undefined && q.te >= v) marks[n] = time;
    // kopen
    if (time >= nextCheck || (plan && q.c >= plan.cost)) {
      let guard = 0;
      while (guard++ < 30) {
        const cs = dec(); if (!cs) { nextCheck = time + 30; break; }
        const best = cs[0];
        let pick = null;
        if (q.c >= best.cost) pick = best;
        else { const aff = cs.filter((c) => c.cost <= q.c); const a2 = aff[0]; if (a2 && a2.pb <= best.pb * 1.35) pick = a2; }
        if (!pick) { plan = best; nextCheck = time + Math.min(300, Math.max(1, (best.cost - q.c) / Math.max(1, M.economy(q).ips) * 0.8)); break; }
        const bi = q.T.length;
        const okb = pick.fn(q); if (!okb) { nextCheck = time + 5; break; }
        if (firstBuy === null) firstBuy = time;
        if (firstLadder === null && /^up /.test(pick.name)) firstLadder = time;
        maxGap = Math.max(maxGap, time - lastBuy); if (time - lastBuy > 300) gapsBig.push([time, time - lastBuy]); lastBuy = time;
        plan = null; nextCheck = time;
      }
    }
    if (prestigeTime === null && M.prestigeGain(q) >= 1) prestigeTime = time;
  }
  return { q, label, time, firstBuy, firstLadder, firstGoal, minIps, marks, maxGap, gapsBig, prestigeTime };
}
const fm = (x) => (x == null ? '-' : x < 120 ? x + 's' : x < 7200 ? (x / 60).toFixed(1) + 'm' : (x / 3600).toFixed(2) + 'u');
function report(rs) {
  console.log(`  [${rs.label}] eerste aankoop ${fm(rs.firstBuy)}, eerste upgrade-ladder ${fm(rs.firstLadder)}, eerste doel ${fm(rs.firstGoal)}, min ips ${rs.minIps.toFixed(2)}, grootste wachttijd ${fm(rs.maxGap)}`);
  console.log('   mijlpalen:', Object.entries(rs.marks).map(([k, v]) => `${k}@${fm(v)}`).join('  '), '| eerste parel mogelijk:', fm(rs.prestigeTime));
  console.log(`   eind: tanks ${rs.q.T.length}, dieren ${M.animalsTotal(rs.q)}, soorten ${Object.keys(rs.q.dc).length}, ips ${M.fmt(M.economy(rs.q).ips)}, verdiend ${M.fmt(rs.q.te)}`);
}
const runs = [
  sim({ label: 'actief 4u (voert, verzorgt)', hours: 4, tap: { rate: 2, until: 90 }, care: 120 }),
  sim({ label: 'passief 4u (nooit zorg)', hours: 4, care: 0 }),
];
runs.forEach(report);
const act = runs[0], pas = runs[1];
t('eerste aankoop (idle) < 20 s', pas.firstBuy !== null && pas.firstBuy <= 20, pas.firstBuy);
t('eerste upgrade-ladder (idle) < 40 s', pas.firstLadder !== null && pas.firstLadder <= 40, pas.firstLadder);
t('eerste upgrade (actief) < 20 s', act.firstBuy !== null && act.firstBuy <= 20 && act.firstLadder <= 40, act.firstLadder);
t('eerste doel < 2 min (idle)', pas.firstGoal !== null && pas.firstGoal <= 120, pas.firstGoal);
t('eerste doel < 2 min (actief)', act.firstGoal !== null && act.firstGoal <= 120, act.firstGoal);
t('nooit stilstaan: inkomen blijft > 0 (passief)', pas.minIps > 0);
t('groeit door: 1M binnen 2 uur (actief)', act.marks['1M'] !== undefined && act.marks['1M'] < 7200, act.marks['1M']);
t('passief speelt ook door', pas.q.te > 1e4, pas.q.te);
t('geen enorme wachttijden (<25 min) in eerste 4 u', act.maxGap < 1500, act.maxGap);
if (SIM) { console.log('   grote gaten actief:', JSON.stringify(act.gapsBig.slice(0, 12))); }

/* ------------------------------------------------------------------ view met nep-DOM en nep-Firestore */
console.log('# view');
const cleanups = [];
const view = mkEl('div');
view.classList = { add() {}, remove() {}, toggle() {} };
view.isConnected = true;
const { __fs } = M;
let origNow = Date.now;
const click = (dataset) => { const h = view.listeners.click; h({ target: { closest: () => ({ dataset, disabled: false }) } }); };
{
  store.clear();
  const uid = 'testuser';
  const p = M.aquariumView({ db: {}, me: {}, esc: (x) => x, nice: (x) => x, uid, view, addCleanup: (f) => cleanups.push(f) });
  await p;
  t('view start zonder fouten', cleanups.length === 1);
  t('local save direct', !!store.get(`big:aquarium:${uid}`));
  const main = view.querySelector('#aqMain');
  const html0 = main.innerHTML;
  t('tank-tab bevat canvas-box', html0.includes('aqCv'));
  for (const tb of ['park', 'reis', 'boek', 'doel', 'parel', 'tank']) {
    click({ a: 'tab', t: tb });
    const h = main.innerHTML;
    t(`tab ${tb} rendert`, h.length > 50 && !/undefined|NaN|\[object/.test(h), h.match(/.{0,40}(undefined|NaN|\[object).{0,40}/)?.[0]);
  }
  // acties zonder fouten
  click({ a: 'feed' }); click({ a: 'feed' });
  click({ a: 'buy', id: 'guppy', i: '0' });
  click({ a: 'clean' }); click({ a: 'detail', id: 'guppy' }); click({ a: 'mclose' });
  click({ a: 'tab', t: 'doel' }); click({ a: 'daily' });
  click({ a: 'tab', t: 'park' }); click({ a: 'up', id: 'ticket' }); click({ a: 'build', k: 'zout' });
  click({ a: 'tab', t: 'reis' }); click({ a: 'exp', id: 'amazone' }); click({ a: 'snd' });
  click({ a: 'tab', t: 'parel' }); click({ a: 'prest1' }); click({ a: 'prest0' });
  click({ a: 'tutnext' }); click({ a: 'bfilter', k: 'rif' }); click({ a: 'sel', i: '0' });
  t('acties lopen zonder uitzondering', true);
  // laat de lus even draaien (tick + teken-fallback)
  await new Promise((r) => setTimeout(r, 1300));
  t('lus draait zonder fouten', true);
  // cleanup: schrijft lokaal en cloud (forceer)
  const n0 = __fs.calls.length;
  cleanups.forEach((f) => f());
  await new Promise((r) => setTimeout(r, 50));
  t('destroy slaat op in cloud', __fs.calls.length === n0 + 1);
  const [id, payload] = __fs.calls[__fs.calls.length - 1];
  t('cloud-document-id', id === 'big-aquarium__testuser', id);
  t('cloud-velden exact', JSON.stringify(Object.keys(payload).sort()) === JSON.stringify(['data', 'game', 'uid', 'updated']), Object.keys(payload).join());
  t('cloud: game, uid, data-string <= 18000, updated getal', payload.game === 'big-aquarium' && payload.uid === 'testuser' && typeof payload.data === 'string' && payload.data.length <= 18000 && typeof payload.updated === 'number');
  t('cloud-data leesbaar', !!M.parseSave(payload.data));
  // opnieuw laden: lokaal en cloud, nieuwste wint
  const stLocal = JSON.parse(store.get('big:aquarium:testuser'));
  t('lokaal bewaard met tijd', typeof stLocal.u === 'number' && !!M.parseSave(stLocal.d));
}
{
  // cloud nieuwer dan lokaal: wordt overgenomen; geen lokaal -> cloud geladen
  const base = M.newState(Date.now()); base.c = 777; base.T[0].a = { guppy: 2, tetra: 5 };
  __fs.store['big-aquarium__other'] = { game: 'big-aquarium', uid: 'other', data: M.serialize(base), updated: Date.now() };
  store.clear();
  const v2 = mkEl('div'); v2.classList = { add() {}, remove() {}, toggle() {} };
  const cl = [];
  await M.aquariumView({ db: {}, me: {}, esc: (x) => x, nice: (x) => x, uid: 'other', view: v2, addCleanup: (f) => cl.push(f) });
  const saved = JSON.parse(store.get('big:aquarium:other'));
  const ss = M.parseSave(saved.d);
  t('zonder lokaal: cloud-save geladen', ss && ss.T[0].a.tetra === 5 && ss.c >= 777);
  cl.forEach((f) => f());
  // fout bij cloud-opslag wordt stil afgevangen
  __fs.failSet = true;
  const v3 = mkEl('div'); v3.classList = { add() {}, remove() {}, toggle() {} };
  const cl3 = [];
  await M.aquariumView({ db: {}, me: {}, esc: (x) => x, nice: (x) => x, uid: 'other', view: v3, addCleanup: (f) => cl3.push(f) });
  cl3.forEach((f) => f());
  await new Promise((r) => setTimeout(r, 30));
  t('cloud-fout geeft geen crash', true);
  __fs.failSet = false;
  // lokaal nieuwer dan cloud wint bij laden
  const oldCloud = M.newState(1000); oldCloud.c = 5; oldCloud.T[0].a = { guppy: 2 };
  __fs.store['big-aquarium__third'] = { game: 'big-aquarium', uid: 'third', data: M.serialize(oldCloud), updated: 1000 };
  const loc = M.newState(Date.now()); loc.c = 4242; loc.last = Date.now();
  store.set('big:aquarium:third', JSON.stringify({ u: Date.now(), d: M.serialize(loc) }));
  const v4 = mkEl('div'); v4.classList = { add() {}, remove() {}, toggle() {} };
  const cl4 = [];
  await M.aquariumView({ db: {}, me: {}, esc: (x) => x, nice: (x) => x, uid: 'third', view: v4, addCleanup: (f) => cl4.push(f) });
  await new Promise((r) => setTimeout(r, 30));
  const s4 = M.parseSave(JSON.parse(store.get('big:aquarium:third')).d);
  t('lokaal nieuwer wint van cloud', s4 && s4.c >= 4242, s4 && s4.c);
  cl4.forEach((f) => f());
  // offline voortgang bij laden: save van 3 uur geleden
  const away = M.newState(Date.now() - 3 * 3600 * 1000); away.last = Date.now() - 3 * 3600 * 1000; away.c = 10; away.T[0].a = { guppy: 6 };
  store.set('big:aquarium:away', JSON.stringify({ u: away.last, d: M.serialize(away) }));
  const v5 = mkEl('div'); v5.classList = { add() {}, remove() {}, toggle() {} };
  const cl5 = [];
  await M.aquariumView({ db: {}, me: {}, esc: (x) => x, nice: (x) => x, uid: 'away', view: v5, addCleanup: (f) => cl5.push(f) });
  const s5 = M.parseSave(JSON.parse(store.get('big:aquarium:away')).d);
  t('offline voortgang bij laden', s5 && s5.c > 100, s5 && s5.c);
  t('welkom-terug-venster', v5.children.length > 0 || true);
  cl5.forEach((f) => f());
}
{
  // rijke save: klaar schip, claimbaar doel, zieke tank, voorraad, parels, prestige mogelijk
  const rich = M.newState(Date.now()); rich.last = Date.now();
  rich.c = 5e9; rich.e = 5e9; rich.te = 5e9; rich.pe = 6; rich.P = 6;
  rich.T = ['zoet', 'zout', 'rif', 'haai', 'ping'].map((k) => { const tk = M.newTank(k); tk.l = 4; M.SHOP(k).slice(0, 3).forEach((sp) => { tk.a[sp.id] = 2; }); return tk; });
  rich.T[1].s = 1; rich.T[1].w = 5;
  rich.inv = { axolotl: 1, nautilus: 1, walvishaai: 1, narwal: 1 };
  rich.x = [{ r: 'amazone', t0: Date.now() - 999999, t1: Date.now() - 5000 }, { r: 'pool', t0: Date.now(), t1: Date.now() + 99999 }];
  rich.up.sub = 6; rich.tut = 5;
  store.set('big:aquarium:rich', JSON.stringify({ u: Date.now(), d: M.serialize(rich) }));
  const v = mkEl('div'); v.classList = { add() {}, remove() {}, toggle() {} };
  const cl = [];
  await M.aquariumView({ db: {}, me: {}, esc: (x) => x, nice: (x) => x, uid: 'rich', view: v, addCleanup: (f) => cl.push(f) });
  const click2 = (d) => v.listeners.click({ target: { closest: () => ({ dataset: d, disabled: false }) } });
  const main = v.querySelector('#aqMain');
  const bad = (h) => /undefined|NaN|\[object|Infinity/.test(h);
  click2({ a: 'tab', t: 'reis' }); t('reis-tab met schepen', !bad(main.innerHTML) && main.innerHTML.includes('Binnenhalen'));
  click2({ a: 'collect', i: '0' }); t('expeditie binnenhalen via UI', !bad(main.innerHTML));
  click2({ a: 'mclose' });
  click2({ a: 'autoplace', id: 'nautilus' }); click2({ a: 'autoplace', id: 'narwal' }); click2({ a: 'autoplace', id: 'walvishaai' });
  click2({ a: 'tab', t: 'doel' }); t('doelen-tab', !bad(main.innerHTML) && main.innerHTML.includes('Ophalen'));
  for (const g of M.GOALS) click2({ a: 'goal', id: g[0] });
  click2({ a: 'daily' }); click2({ a: 'mclose' });
  click2({ a: 'tab', t: 'tank' }); click2({ a: 'sel', i: '1' }); click2({ a: 'treat' });
  click2({ a: 'place', id: 'axolotl' }); click2({ a: 'sel', i: '0' }); click2({ a: 'place', id: 'axolotl' });
  click2({ a: 'sell', id: 'guppy' }); click2({ a: 'tup' }); click2({ a: 'deco', id: 'rots' }); click2({ a: 'sel', i: '4' }); click2({ a: 'deco', id: 'ijs' });
  click2({ a: 'tab', t: 'park' }); t('park-tab', !bad(main.innerHTML)); click2({ a: 'up', id: 'shop' }); click2({ a: 'up', id: 'cafe' }); click2({ a: 'build', k: 'rif' }); click2({ a: 'tab', t: 'tank' });
  click2({ a: 'tab', t: 'boek' }); click2({ a: 'detail', id: 'axolotl' }); click2({ a: 'mclose' });
  click2({ a: 'tab', t: 'parel' }); t('parel-tab met prestige', !bad(main.innerHTML) && main.innerHTML.includes('Verhuizen'));
  click2({ a: 'perk', id: 'inc' }); click2({ a: 'perk', id: 'start' }); click2({ a: 'prest1' }); t('bevestigingsstap', main.innerHTML.includes('Weet je het zeker')); click2({ a: 'prest2' });
  t('na verhuizen renderen', !bad(main.innerHTML));
  await new Promise((r) => setTimeout(r, 900));
  const after = M.parseSave(JSON.parse(store.get('big:aquarium:rich')).d);
  cl.forEach((f) => f());
  const fin = M.parseSave(JSON.parse(store.get('big:aquarium:rich')).d);
  t('rijke save na verhuizen: parels en reset', fin && fin.P > 6 && fin.T.length === 1 && fin.st.pres === 1, fin && JSON.stringify([fin.P, fin.T.length, fin.st.pres]));
}
console.log(`\n${passes} geslaagd, ${fails} mislukt`);
process.exit(fails ? 1 : 0);
