// Tests + economie-simulatie voor Ruimtebasis. Gebruik: node tools/test-big-ruimtebasis.mjs [--sim]
import assert from 'node:assert/strict';
import * as G from '../docs/big-ruimtebasis.js';

let n = 0;
const t = (name, f) => { try { f(); n++; } catch (e) { console.error('FAAL:', name, '\n', e); process.exitCode = 1; } };
const ta = async (name, f) => { try { await f(); n++; } catch (e) { console.error('FAAL:', name, '\n', e); process.exitCode = 1; } };
const NOW = 1.8e12;

t('nieuwe staat heeft inkomen > 0', () => { const s = G.newState(NOW); const R = G.rates(s, NOW); assert.ok(R.erts > 0 && R.kennis > 0 && R.cred > 0); });
t('kosten stijgen en bulk = som', () => {
  const m = G.MOD.mijn; const a = G.modCost(m, 0, 1).erts, b = G.modCost(m, 1, 1).erts;
  assert.ok(b > a);
  const sum = G.modCost(m, 0, 3).erts; assert.ok(Math.abs(sum - (a + b + G.modCost(m, 2, 1).erts)) <= 3);
});
t('bouwen trekt af en telt', () => {
  const s = G.newState(NOW); s.r.erts = 100;
  assert.equal(G.buy(s, 'mijn', 1), true); assert.equal(s.b.mijn, 1); assert.ok(s.r.erts < 100 && s.st.bld === 1);
  assert.equal(G.buy(s, 'hangaar', 1), false); // vergrendeld
  assert.equal(G.buy(s, 'solar', 1000), false);
});
t('energietekort remt maar nooit tot 0', () => {
  const s = G.newState(NOW); s.b.mijn = 50; const R = G.rates(s, NOW); assert.ok(R.pe < 1 && R.pe >= 0.2 && R.erts > 0);
});
t('bewoners groeien tot huisvesting', () => {
  const s = G.newState(NOW); G.advance(s, 600, 1, NOW); assert.equal(Math.floor(s.pop), 3);
  s.b.wonen = 2; s.b.oxy = 3; s.b.kas = 3; s.b.solar = 5; G.advance(s, 3600, 1, NOW); assert.ok(Math.floor(s.pop) >= 11);
});
t('werkers worden begrensd', () => {
  const s = G.newState(NOW); assert.equal(G.assign(s, 'del', 1), true); assert.equal(G.assign(s, 'del', 1), true); assert.equal(G.assign(s, 'del', 1), false);
  s.w.del = 99; G.advance(s, 1, 1, NOW); assert.ok(s.w.del <= 2);
});
t('offline: lineair, max 8 uur, efficientie', () => {
  const a = G.newState(NOW), b = G.newState(NOW), c = G.newState(NOW);
  a.b.mijn = 5; a.b.solar = 3; b.b = { ...a.b }; c.b = { ...a.b };
  G.advance(a, 8 * 3600, 1, NOW); G.advance(b, 48 * 3600, 1, NOW); assert.ok(Math.abs(a.r.erts - b.r.erts) < 1e-6); // gecapt op 8 u
  G.advance(c, 8 * 3600, G.offlineEff(c), NOW); assert.ok(Math.abs(c.r.erts / a.r.erts - 0.75) < 0.01);
});
t('onderzoek met kosten en voorwaarden', () => {
  const s = G.newState(NOW); assert.equal(G.doResearch(s, 'r_hand'), false); s.r.kennis = 100;
  assert.equal(G.doResearch(s, 'r_hand'), true); assert.equal(G.doResearch(s, 'r_hand'), false);
  assert.equal(G.doResearch(s, 'r_motor'), false); // heeft r_hangaar nodig
  assert.equal(G.doResearch(s, 'r_boor'), true);
});
t('missie: lanceren, wachten, ophalen, ontdekken', () => {
  const s = G.newState(NOW); s.res.push('r_hangaar'); s.b.hangaar = 1; s.r.erts = 500;
  assert.equal(G.launch(s, 0, NOW, () => 0.9), true); assert.equal(G.launch(s, 0, NOW, () => 0.9), false); // 1 plek
  assert.equal(G.collect(s, 0, NOW + 1000), null);
  const r = G.collect(s, 0, NOW + 60000, () => 0.5);
  assert.ok(r.first && r.qty >= 1 && s.r.ijzer === r.qty && s.wd.includes('mars') && s.mis.length === 0);
  assert.equal(G.launch(s, 3, NOW, () => 0.9), false); // ceres vergrendeld
});
t('rampje halveert lading', () => {
  const a = G.newState(NOW), b = G.newState(NOW);
  for (const s of [a, b]) { s.res.push('r_hangaar'); s.b.hangaar = 1; s.r.erts = 500; }
  G.launch(a, 0, NOW, () => 0.99); G.launch(b, 0, NOW, () => 0.0);
  const ra = G.collect(a, 0, NOW + 1e6, () => 0.5), rb = G.collect(b, 0, NOW + 1e6, () => 0.5);
  assert.ok(rb.hz === 1 && ra.hz === 0 && rb.qty <= Math.ceil(ra.qty / 2) + 1);
});
t('markt verkoopt', () => {
  const s = G.newState(NOW); s.r.erts = 100; const g = G.sell(s, 'erts', 'all', NOW);
  assert.ok(g > 10 && s.r.erts === 0 && s.r.cred === g); assert.equal(G.sell(s, 'erts', 1, NOW), 0); assert.equal(G.sell(s, 'kennis', 1, NOW), 0);
});
t('prestige reset en behoud', () => {
  const s = G.newState(NOW); s.st.run = 1e9; s.st.all = 1e9; s.b.mijn = 9; s.res.push('r_hand'); s.wd.push('mars'); s.ach.push('tap50'); s.q = 5;
  const g = G.prestigeGain(s); assert.ok(g >= 5);
  assert.equal(G.prestige(s, NOW), g);
  assert.deepEqual(s.b, {}); assert.deepEqual(s.res, []); assert.equal(s.sd, g); assert.equal(s.np, 1); assert.deepEqual(s.wd, ['mars']); assert.equal(s.q, 5); assert.equal(s.st.run, 0); assert.equal(s.st.all, 1e9);
  assert.ok(G.gMult(s) > 1.2);
  assert.equal(G.prestige(s, NOW), 0); // te weinig
  s.sd = 5; assert.equal(G.buyPU(s, 'tap'), true); assert.equal(s.sd, 4); assert.equal(G.buyPU(s, 'bestaatniet'), false);
});
t('dagelijkse beloning en streak', () => {
  const s = G.newState(NOW); const R = G.rates(s, NOW);
  const r1 = G.claimDaily(s, NOW, R); assert.equal(r1.streak, 1); assert.equal(G.claimDaily(s, NOW, R), null);
  const r2 = G.claimDaily(s, NOW + 86400000, R); assert.equal(r2.streak, 2);
  const r3 = G.claimDaily(s, NOW + 5 * 86400000, R); assert.equal(r3.streak, 1);
});
t('verbeteringen', () => {
  const s = G.newState(NOW); const base = G.rates(s, NOW).erts; s.b.mijn = 1;
  assert.equal(G.upgrade(s, 'mijn'), false);
  s.r.erts = 1e6; s.r.cred = 1e4; s.r.ijzer = 20; const before = G.rates(s, NOW).erts;
  assert.equal(G.upgrade(s, 'mijn'), true); assert.equal(s.up.mijn, 1); assert.ok(G.rates(s, NOW).erts > before);
  assert.equal(G.upgrade(s, 'fout'), false); assert.ok(base > 0);
});
t('doelen ketenen en geven beloning', () => {
  const s = G.newState(NOW); s.st.tap = 10; const d = G.checkProgress(s, NOW); assert.ok(d.some((x) => x.kind === 'q') && s.q === 1 && s.r.erts >= 10);
});
t('opslag: pack/unpack rond en klein', () => {
  const s = G.newState(NOW); s.r.erts = 12345.6789; s.b = { mijn: 40, solar: 30, kas: 20 }; s.res = G.RESEARCH.map((r) => r.id); s.ach = G.ACHS.map((a) => a.id); s.wd = G.WORLDS.map((w) => w.id);
  for (let i = 0; i < 6; i++) s.mis.push({ w: i, s: NOW, e: NOW + 1e5, hz: 0, n: 1 });
  G.WORLDS.forEach((w) => { s.r[w.rare] = 123456.789; });
  const str = G.pack(s); assert.ok(str.length < 18000 && str.length < 4000, 'lengte ' + str.length);
  const b = G.unpack(str, NOW); assert.equal(b.r.erts, 12345.679); assert.deepEqual(b.b, s.b); assert.equal(b.res.length, G.RESEARCH.length);
});
t('migreren herstelt kapotte data', () => {
  assert.equal(G.unpack('nonsens'), null); assert.equal(G.unpack('null'), null);
  const b = G.unpack(JSON.stringify({ v: 0, r: { erts: -5, kennis: 'x' }, b: { mijn: 3, spook: 9 }, res: ['r_hand', 'weg'], w: { del: 99 }, mis: [null, { w: 99 }], pop: 'a' }), NOW);
  assert.equal(b.r.erts, 0); assert.equal(b.r.kennis, 0); assert.equal(b.b.spook, undefined); assert.deepEqual(b.res, ['r_hand']); assert.equal(b.mis.length, 0); assert.equal(b.pop, 2); assert.ok(b.w.del <= 2);
  assert.ok(G.rates(b, NOW).erts > 0);
});

/* ---------- mock opslag ---------- */
function mockFs() {
  const dbm = new Map(); const calls = { set: 0, get: 0 };
  return { calls, dbm, doc: (db, c, id) => ({ c, id }), setDoc: async (ref, data) => { calls.set++; if (fs.fail) throw new Error('x'); dbm.set(ref.c + '/' + ref.id, data); }, getDoc: async (ref) => { calls.get++; if (fs.fail) throw new Error('x'); const v = dbm.get(ref.c + '/' + ref.id); return { exists: () => !!v, data: () => v }; } };
}
let fs;
const mkStorage = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), m }; };

await ta('store: lokaal + cloud, velden, nieuwste wint, 60s throttle', async () => {
  fs = mockFs(); const stor = mkStorage(); let clock = NOW;
  const store = G.makeStore({ uid: 'u1', db: {}, fs, storage: stor, now: () => clock });
  assert.equal(await store.load(), null);
  const s = G.newState(NOW); s.r.erts = 777; assert.ok(store.saveLocal(s));
  assert.ok(stor.m.has('big:ruimtebasis:u1'));
  assert.equal(await store.saveCloud(s), true); assert.equal(await store.saveCloud(s), false); assert.equal(fs.calls.set, 1);
  clock += 61000; assert.equal(await store.saveCloud(s), true);
  const d = fs.dbm.get('gamesaves/big-ruimtebasis__u1');
  assert.deepEqual(Object.keys(d).sort(), ['data', 'game', 'uid', 'updated']); assert.equal(d.game, 'big-ruimtebasis'); assert.equal(d.uid, 'u1'); assert.ok(d.data.length <= 18000 && typeof d.updated === 'number');
  // cloud nieuwer dan lokaal
  const s2 = G.newState(NOW); s2.r.erts = 9999; clock += 1000; s2.upd = clock;
  fs.dbm.set('gamesaves/big-ruimtebasis__u1', { game: 'big-ruimtebasis', uid: 'u1', data: G.pack(s2), updated: clock + 5000 });
  const l = await store.load(); assert.equal(l.r.erts, 9999);
  // lokaal nieuwer
  const s3 = G.newState(NOW); s3.r.erts = 5; clock += 100000; store.saveLocal(s3);
  assert.equal((await store.load()).r.erts, 5);
  // fouten stil
  fs.fail = true; assert.equal(await store.saveCloud(s3, true), false); assert.equal((await store.load()).r.erts, 5);
  // zonder fs
  const st2 = G.makeStore({ uid: 'u1', db: null, fs: null, storage: stor, now: () => clock }); assert.equal((await st2.load()).r.erts, 5);
});

t('opmaak', () => { assert.equal(G.fmt(0), '0'); assert.equal(G.fmt(1234), '1,23k'); assert.equal(G.fmt(2.5e6), '2,5M'); assert.equal(G.fmtT(3700), '1u 01m'); assert.equal(G.fmtT(75), '1m 15s'); });


/* ---------- rooktest van de hele view met een nep-DOM (geen echte browser nodig) ---------- */
await ta('view: draait met nep-DOM, alle tabs en acties zonder fouten', async () => {
  const ctxProxy = () => new Proxy(function () {}, { get: (t, p) => (p === 'createLinearGradient' || p === 'createRadialGradient' ? () => ({ addColorStop() {} }) : p === Symbol.toPrimitive ? () => 0 : () => {}), set: () => true });
  class El {
    constructor(tag) { this.tag = tag; this.dataset = {}; this.children = []; this.style = {}; this.classList = { toggle() {}, add() {}, remove() {} }; this._html = ''; this.listeners = {}; this.clientWidth = 360; this.clientHeight = 200; this.width = 0; this.height = 0; this.scrollTop = 0; this.hidden = false; this.textContent = ''; this.className = ''; this.isConnected = true; this.parentNode = null; this.firstChild = null; }
    set innerHTML(v) { this._html = v; this.kids = []; for (const m of v.matchAll(/data-k="(\w+)"/g)) { const e = new El('div'); e.dataset.k = m[1]; this.kids.push(e); } for (const m of v.matchAll(/data-t="(\w+)"/g)) { const e = new El('button'); e.dataset.t = m[1]; this.kids.push(e); } }
    get innerHTML() { return this._html; }
    appendChild(c) { c.parentNode = this; this.children.push(c); this.firstChild = this.children[0]; return c; }
    removeChild(c) { this.children = this.children.filter((x) => x !== c); this.firstChild = this.children[0] || null; }
    remove() {}
    querySelector(sel) { if (sel === 'canvas') return this.canvas || (this.canvas = Object.assign(new El('canvas'), { getContext: () => ctxProxy(), getBoundingClientRect: () => ({ left: 0, top: 0 }) })); if (sel === '.rb-badge') return null; this.subs = this.subs || {}; return this.subs[sel] || (this.subs[sel] = new El('div')); }
    querySelectorAll(sel) { return (this.kids || []).filter((k) => (sel === '[data-k]' ? k.dataset.k : k.dataset.t)); }
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }
    contains() { return true; }
  }
  const intervals = []; const rafs = []; const store = new Map();
  Object.assign(globalThis, {
    document: { createElement: (t) => new El(t), hidden: false, addEventListener() {}, removeEventListener() {} },
    window: { addEventListener() {}, removeEventListener() {}, devicePixelRatio: 1, localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) } },
    requestAnimationFrame: (f) => { rafs.push(f); return rafs.length; }, cancelAnimationFrame() {},
  });
  const realSI = globalThis.setInterval, realClear = globalThis.clearInterval;
  globalThis.setInterval = (f) => { intervals.push(f); return intervals.length; }; globalThis.clearInterval = () => {};
  const cleanups = []; const view = new El('div');
  let off = 0; const realNow = Date.now; Date.now = () => realNow() + off;
  try {
    await G.ruimtebasisView({ db: {}, me: { uid: 'tester' }, esc: (x) => x, nice: (x) => x, uid: 'tester', view, addCleanup: (f) => cleanups.push(f) });
    const root = view.children.find((c) => c.tag === 'div');
    assert.ok(root, 'root gemaakt');
    const click = (a) => { root.listeners.click[0]({ target: { closest: () => ({ dataset: { a } }) } }); };
    const run = (k = 1, adv = 5000) => { for (let i = 0; i < k; i++) { off += adv; intervals.forEach((f) => f()); const fr = rafs.shift(); if (fr) fr(1000 * (i + 1) + 16); } };
    run(3);
    const cvEl = root.querySelector('canvas');
    for (let i = 0; i < 12; i++) cvEl.listeners.pointerdown[0]({ clientX: 100 + i, clientY: 150 });
    for (const tb of ['bouw', 'team', 'lab', 'mis', 'han', 'doel', 'meer']) { click('tab:' + tb); run(1); }
    click('tab:bouw'); click('buy:mijn:1'); click('buy:solar:1'); click('bulk:max'); click('buy:mijn:1'); click('asg:del:1'); click('auto'); click('res:r_hand'); click('daily'); click('close');
    click('tab:han'); click('sell:erts:all'); click('ore:1'); click('tab:mis'); click('go:0'); click('col:0'); click('tab:lab'); click('res:r_zon');
    click('tab:meer'); click('snd'); click('snd'); click('tut'); click('close'); click('prest'); click('close'); click('pu:tap'); click('up:mijn'); click('robot');
    run(5); run(1, 3 * 3600 * 1000); click('close'); run(3); click('tab:mis'); click('col:0'); click('tab:doel'); click('daily');
    cleanups.forEach((f) => f());
    const saved = JSON.parse(store.get('big:ruimtebasis:tester')); assert.ok(saved.data.length < 18000 && saved.updated > 0);
    const s2 = G.unpack(saved.data); assert.ok(s2.st.tap >= 12 && (s2.b.mijn || 0) >= 1);
    // tweede keer openen na 5 uur: offline-voortgang + welkom-terug
    off += 5 * 3600 * 1000; const before = s2.r.erts;
    const view2 = new El('div'); const cl2 = [];
    await G.ruimtebasisView({ db: {}, me: { uid: 'tester' }, esc: (x) => x, nice: (x) => x, uid: 'tester', view: view2, addCleanup: (f) => cl2.push(f) });
    const root2 = view2.children.find((c) => c.tag === 'div');
    assert.ok(root2.querySelector('.rb-modal').innerHTML.includes('Welkom terug'), 'welkom terug getoond');
    cl2.forEach((f) => f());
    const s3 = G.unpack(JSON.parse(store.get('big:ruimtebasis:tester')).data); assert.ok(s3.r.erts > before, 'offline erts erbij');
  } finally { Date.now = realNow; globalThis.setInterval = realSI; globalThis.clearInterval = realClear; }
});

console.log(`${n} tests ok`);
if (process.env.FAST) process.exit(process.exitCode || 0);

/* =====================================================================
   Simulatie van een redelijke speler (optioneel: --sim, standaard ook aan)
   ===================================================================== */
function simulate(hours, label, opts = {}) {
  let s = opts.state || G.newState(NOW), time = 0;
  const log = [], miles = {};
  const mark = (k) => { if (!(k in miles)) miles[k] = time; };
  const dtc = 1;
  let maxGap = 0, gapStart = 0;
  let prestiges = [];
  const rng = (() => { let x = 42; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  const tapRate = (tm) => (tm < 300 ? 1.5 : tm < 1200 ? 0.4 : 0.1);
  let tapAcc = 0, lastStat = 0;
  const T = (tm) => NOW + tm * 1000;
  while (time < hours * 3600) {
    const now = T(time);
    G.step(s, dtc, 1, now);
    tapAcc += tapRate(time) * dtc;
    while (tapAcc >= 1) { tapAcc--; const R = G.rates(s, now); s.r.erts += R.tap; s.st.all += R.tap; s.st.run += R.tap; s.st.tap++; }
    time += dtc;
    if (time % 2) continue;
    // missies ophalen
    for (let i = s.mis.length - 1; i >= 0; i--) if (s.mis[i].e <= T(time)) G.collect(s, i, T(time), rng);
    let R = G.rates(s, T(time)), bought = false;
    const B = (id, k = 1) => { const ok = G.buy(s, id, k); if (ok) { bought = true; mark('eerste ' + id + ' @' + s.b[id]); } return ok; };
    // werkers
    if (R.free >= 1) { G.autoAssign(s); }
    // onderzoek
    for (const r of G.RESEARCH) if (G.resAvail(s, r) && !s.res.includes(r.id) && G.canPay(s, r.c)) { if (G.doResearch(s, r.id)) mark('onderzoek ' + r.id); }
    // overleven
    const m = G.MOD, n = (id) => s.b[id] || 0;
    const wantPower = R.pDem + 3 > R.pSup;
    const afford = (id, k = 1) => { const mm = m[id]; return G.unlocked(s, mm) && G.canPay(s, G.modCost(mm, n(id), k)); };
    let guard = 0;
    while (guard++ < 10) {
      R = G.rates(s, T(time));
      let did = false;
      if (R.pe < 0.95 || wantPower) { if (afford('reactor') && n('solar') > 6) did = B('reactor'); else if (afford('solar')) did = B('solar'); }
      if (!did && R.o2E < 1 && afford('oxy')) did = B('oxy');
      if (!did && R.foE < 1 && afford('kas')) did = B('kas');
      if (!did && R.pop >= R.house - 0 && afford('wonen') && R.pe >= 0.9) did = B('wonen');
      if (!did && G.unlocked(s, m.hangaar) && n('hangaar') < 1 + Math.floor(n('mijn') / 12) && afford('hangaar') && n('hangaar') < 6) did = B('hangaar');
      if (!did && n('lab') < Math.ceil(n('mijn') / 4) + 1 && afford('lab')) did = B('lab');
      if (!did && G.unlocked(s, m.handel) && n('handel') < n('mijn') / 6 && afford('handel')) did = B('handel');
      if (!did && G.unlocked(s, m.werk) && n('werk') < 1 + n('mijn') / 15 && afford('werk')) did = B('werk');
      if (!did && G.unlocked(s, m.schild) && n('schild') < 3 && afford('schild')) did = B('schild');
      if (!did && s.bots < R.botCap && G.buyRobot(s)) did = true;
      if (!did && afford('mijn')) did = B('mijn');
      if (!did) break; else bought = true;
    }
    for (const id of G.UPS) if (G.upgrade(s, id)) mark('upgrade ' + id + ' ' + s.up[id]);
    // missies
    if (s.mis.length < n('hangaar')) {
      const open = []; for (let i = 0; i < G.WORLDS.length; i++) if (G.worldOpen(s, G.WORLDS[i]) && s.r.erts >= G.WORLDS[i].cost * 3) open.push(i);
      // eerst onontdekt, anders de wereld waarvan we het minste zeldzame spul hebben
      open.sort((x, y) => (s.wd.includes(G.WORLDS[x].id) - s.wd.includes(G.WORLDS[y].id)) || (s.r[G.WORLDS[x].rare] - s.r[G.WORLDS[y].rare]));
      if (open.length && G.launch(s, open[0], T(time), rng)) mark('lancering ' + G.WORLDS[open[0]].id);
    }
    // verkopen (alles behalve wat nodig is voor bouw): simpel, 1x per 60 s
    if (time % 60 === 0 && s.r.cred > 800) G.buyOre(s, s.r.cred - 500, T(time));
    if (time % 60 === 0) for (const id of Object.keys(s.r)) if (!['kennis', 'cred', 'erts'].includes(id)) { const keep = 150; const amt = Math.floor(s.r[id]) - keep; if (amt > 0) G.sell(s, id, amt, T(time)); }
    G.checkProgress(s, T(time));
    // vastloopcontrole: hoe lang geen aankoop of onderzoek gelukt?
    if (bought) { maxGap = Math.max(maxGap, time - gapStart); gapStart = time; }
    for (let q = 1; q <= s.q; q++) mark('doel ' + q);
    if (G.prestigeGain(s) >= 1) mark('prestige-gain>=1');
    if (G.prestigeGain(s) >= 5) mark('prestige-gain>=5');
    if (opts.autoPrestige && G.prestigeGain(s) >= opts.autoPrestige) {
      const g = G.prestige(s, T(time)); prestiges.push([time, g]);
      // koop leukste upgrades
      for (const id of ['start', 'ert', 'ken', 'tap', 'fast', 'off']) while (G.buyPU(s, id)) { /* */ }
    }
    if (time - lastStat >= (hours > 3 ? 1800 : 600)) {
      lastStat = time; const R2 = G.rates(s, T(time));
      log.push(`${(time / 60).toFixed(0).padStart(5)}m  🪨${G.fmt(s.r.erts).padStart(7)} +${G.fmt(R2.erts).padStart(7)}/s  🔬+${G.fmt(R2.kennis).padStart(6)}/s  🪙${G.fmt(s.r.cred).padStart(7)}  pop ${R2.pop}/${R2.house} bots ${s.bots} mijn ${s.b.mijn||0} lab ${s.b.lab||0} hang ${s.b.hangaar||0} mod ${Object.values(s.b).reduce((a, b) => a + b, 0)} onderz ${s.res.length}/${G.RESEARCH.length} werelden ${s.wd.length} doel ${s.q} pe ${R2.pe.toFixed(2)} gain ${G.prestigeGain(s)}`);
    }
  }
  console.log(`\n== SIMULATIE ${label} (${hours} u) ==`);
  log.forEach((l) => console.log(l));
  return { s, miles, maxGap, prestiges };
}

const sim = simulate(6, 'eerste run');
const M = sim.miles;
console.log('\nMijlpalen (seconden):');
for (const k of ['eerste mijn @1', 'eerste solar @1', 'doel 1', 'doel 2', 'doel 3', 'doel 5', 'onderzoek r_hand', 'onderzoek r_hangaar', 'eerste hangaar @1', 'lancering mars', 'doel 11', 'doel 13', 'eerste lab @1', 'onderzoek r_motor', 'onderzoek r_reactor', 'onderzoek r_ver', 'onderzoek r_warp', 'onderzoek r_terra', 'upgrade mijn 1', 'upgrade mijn 3', 'upgrade mijn 6', 'upgrade lab 3', 'prestige-gain>=1', 'prestige-gain>=5']) console.log('  ' + k.padEnd(26), M[k] === undefined ? '(niet bereikt)' : M[k] + ' s');
console.log('Grootste tijd zonder aankoop/onderzoek-actie:', sim.maxGap, 's');
const firstBuy = Math.min(M['eerste mijn @1'] ?? 1e9, M['eerste solar @1'] ?? 1e9);
assert.ok(firstBuy < 20, 'eerste upgrade < 20 s: ' + firstBuy);
assert.ok(M['doel 1'] < 120, 'eerste doel < 2 min');
assert.ok(sim.s.r.erts >= 0 && G.rates(sim.s, NOW).erts > 0, 'nooit zonder inkomen');
assert.ok(sim.maxGap < 1500, 'nooit vast: grootste gat ' + sim.maxGap);

const sim2 = simulate(48, 'meerdere verhuizingen', { autoPrestige: 3 });
console.log('Verhuizingen (tijd s, ✨):', sim2.prestiges.map((p) => `${(p[0] / 3600).toFixed(1)}u:${p[1]}`).join('  '));
console.log('\nAlle tests en simulaties gedaan.');
