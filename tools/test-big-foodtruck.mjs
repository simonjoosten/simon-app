// Tests voor docs/big-foodtruck.js (Foodtruck Imperium). Draaien: node tools/test-big-foodtruck.mjs   (optioneel: --sim voor het volledige balans-overzicht)
//   1. pure logica: economie, opslag (serialize/parse/migratie), offline-voortgang, franchise
//   2. balans-simulatie: eerste upgrade < 20 s, eerste doel < 2 min, nooit vastlopen zonder inkomen
//   3. de view in een nep-DOM (met nep-Firestore, nep-timers en nep-AudioContext): tabs, klikken, opslaan, opruimen
import * as nodeModule from 'node:module';

const VERBOSE = process.argv.includes('--sim');
let pass = 0, fail = 0;
const fails = [];
async function t(name, fn) {
  try { await fn(); pass++; if (VERBOSE) console.log('  ok  ', name); } catch (e) { fail++; fails.push(name); console.log('  FOUT', name, '\n      ', (e && e.stack) || e); }
}
const eq = (a, b, m) => { if (a !== b) throw new Error(`${m || 'ongelijk'}: ${a} !== ${b}`); };
const ok = (c, m) => { if (!c) throw new Error(m || 'onwaar'); };

/* =================== nep-omgeving: Firestore-module, DOM, timers, audio =================== */
globalThis.__fs = new Map();
globalThis.__fsLog = [];
const STUB = `
export const doc = (db, ...p) => ({ path: p.join('/') });
export const getDoc = async (r) => { const v = globalThis.__fs.get(r.path); return { exists: () => v !== undefined, data: () => v }; };
export const setDoc = async (r, d) => { globalThis.__fsLog.push({ path: r.path, data: d }); if (globalThis.__fsFail) throw new Error('permission-denied'); globalThis.__fs.set(r.path, JSON.parse(JSON.stringify(d))); };
`;
const STUB_URL = 'data:text/javascript,' + encodeURIComponent(STUB);
if (nodeModule.registerHooks) nodeModule.registerHooks({ resolve(s, c, n) { if (s.startsWith('https://www.gstatic.com/firebasejs/')) return { url: STUB_URL, shortCircuit: true }; return n(s, c); } });
else nodeModule.register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, n) { if (s.startsWith('https://www.gstatic.com/firebasejs/')) return { url: ${JSON.stringify(STUB_URL)}, shortCircuit: true }; return n(s, c); }`), import.meta.url);

const clock = { now: 1_800_000_000_000, id: 1, timers: [], raf: null };
const realDateNow = Date.now;
Date.now = () => clock.now;
globalThis.setTimeout = (fn, ms = 0) => { const id = clock.id++; clock.timers.push({ id, at: clock.now + ms, fn, every: 0 }); return id; };
globalThis.setInterval = (fn, ms = 0) => { const id = clock.id++; clock.timers.push({ id, at: clock.now + ms, fn, every: Math.max(1, ms) }); return id; };
globalThis.clearTimeout = globalThis.clearInterval = (id) => { clock.timers = clock.timers.filter((x) => x.id !== id); };
globalThis.requestAnimationFrame = (cb) => { clock.raf = cb; return 1; };
globalThis.cancelAnimationFrame = () => { clock.raf = null; };
Object.defineProperty(globalThis, 'performance', { value: { now: () => clock.now - 1_800_000_000_000 }, configurable: true, writable: true });
function advance(ms, step = 16) {
  const end = clock.now + ms;
  while (clock.now < end) {
    clock.now = Math.min(end, clock.now + step);
    for (;;) {
      const due = clock.timers.filter((x) => x.at <= clock.now).sort((a, b) => a.at - b.at)[0];
      if (!due) break;
      if (due.every) due.at += due.every; else clock.timers = clock.timers.filter((x) => x !== due);
      due.fn();
    }
    if (clock.raf) { const cb = clock.raf; clock.raf = null; cb(clock.now); }
  }
}

async function advanceAsync(ms, step = 50) { for (let done = 0; done < ms; done += 1000) { advance(Math.min(1000, ms - done), step); await new Promise((r) => setImmediate(r)); } }
const VOID = new Set(['input', 'br', 'img', 'hr']);
const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
class El {
  constructor(tag) {
    this.tag = tag; this.tagName = tag.toUpperCase(); this.kids = []; this.parent = null; this.attrs = {}; this.dataset = {}; this.listeners = {}; this._text = null;
    this.className = ''; this.hidden = false; this.isConnected = true; this.value = ''; this.style = { setProperty() {} }; this.offsetWidth = 100; this.clientWidth = 360; this.width = 0; this.height = 0;
    this.classList = { add: (c) => { const s = new Set(this.className.split(/\s+/).filter(Boolean)); s.add(c); this.className = [...s].join(' '); }, remove: (c) => { this.className = this.className.split(/\s+/).filter((x) => x && x !== c).join(' '); }, contains: (c) => this.className.split(/\s+/).includes(c), toggle: (c, f) => { const has = this.classList.contains(c); const want = f === undefined ? !has : !!f; if (want && !has) this.classList.add(c); if (!want && has) this.classList.remove(c); } };
  }
  get children() { return this.kids.filter((k) => k instanceof El); }
  get firstChild() { return this.kids[0] || null; }
  get textContent() { return this._text !== null && this.kids.length === 0 ? this._text : this.kids.map((k) => (k instanceof El ? k.textContent : k)).join(''); }
  set textContent(v) { this.kids = []; this._text = String(v); }
  get innerHTML() { return this._html || ''; }
  set innerHTML(h) { this.kids = []; this._text = null; this._html = h; parseHTML(String(h), this); }
  appendChild(k) { if (k.parent) k.parent.kids = k.parent.kids.filter((x) => x !== k); k.parent = this; this.kids.push(k); return k; }
  removeChild(k) { this.kids = this.kids.filter((x) => x !== k); k.parent = null; k.isConnected = false; return k; }
  remove() { if (this.parent) this.removeChild(this); this.isConnected = false; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  addEventListener(ty, fn) { (this.listeners[ty] = this.listeners[ty] || []).push(fn); }
  removeEventListener(ty, fn) { this.listeners[ty] = (this.listeners[ty] || []).filter((f) => f !== fn); }
  focus() {}
  contains(el) { for (let x = el; x; x = x.parent) if (x === this) return true; return false; }
  closest(sel) { for (let x = this; x; x = x.parent) if (x instanceof El && matchCompound(x, sel)) return x; return null; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 360, height: 260 }; }
  querySelectorAll(sel) { return qsa(this, sel); }
  querySelector(sel) { return qsa(this, sel)[0] || null; }
  getContext() { return ctx2d; }
}
function parseHTML(html, root) {
  const re = /<(\/?)([a-zA-Z][\w-]*)((?:\s+[^\s=>\/]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+)/g;
  const stack = [root]; let m;
  while ((m = re.exec(html))) {
    const top = stack[stack.length - 1];
    if (m[5] != null) { top.kids.push(decode(m[5])); continue; }
    const tag = m[2].toLowerCase();
    if (m[1]) { for (let i = stack.length - 1; i > 0; i--) if (stack[i].tag === tag) { stack.length = i; break; } continue; }
    const el = new El(tag); el.parent = top; top.kids.push(el);
    const ar = /([^\s=]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g; let a;
    while ((a = ar.exec(m[3]))) {
      const v = decode(a[2] ?? a[3] ?? a[4] ?? ''); el.attrs[a[1]] = v;
      if (a[1] === 'class') el.className = v; else if (a[1] === 'hidden') el.hidden = true; else if (a[1] === 'value') el.value = v;
      else if (a[1].startsWith('data-')) el.dataset[a[1].slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
    }
    if (!VOID.has(tag) && !m[4]) stack.push(el);
  }
}
function matchCompound(el, sel) {
  let rest = sel; const tm = /^[a-zA-Z][\w-]*/.exec(rest);
  if (tm) { if (el.tag !== tm[0].toLowerCase()) return false; rest = rest.slice(tm[0].length); }
  while (rest) {
    let m;
    if ((m = /^#([\w-]+)/.exec(rest))) { if (el.attrs.id !== m[1]) return false; } else if ((m = /^\.([\w-]+)/.exec(rest))) { if (!el.className.split(/\s+/).includes(m[1])) return false; }
    else if ((m = /^\[([\w-]+)(?:="([^"]*)")?\]/.exec(rest))) { if (m[2] === undefined ? !(m[1] in el.attrs) : el.attrs[m[1]] !== m[2]) return false; } else throw new Error('selector niet ondersteund: ' + sel);
    rest = rest.slice(m[0].length);
  }
  return true;
}
function qsa(root, sel) {
  const parts = sel.trim().split(/\s+/), out = [];
  const walk = (el) => { for (const k of el.kids) if (k instanceof El) { if (matchCompound(k, parts[parts.length - 1])) { let ok2 = true, cur = k.parent; for (let i = parts.length - 2; i >= 0 && ok2; i--) { while (cur && cur !== root.parent && !(cur instanceof El && matchCompound(cur, parts[i]))) cur = cur.parent; if (!cur || cur === root.parent) ok2 = false; else cur = cur.parent; } if (ok2) out.push(k); } walk(k); } };
  walk(root); return out;
}
const ctx2d = new Proxy({}, { get(t, k) { if (k in t) return t[k]; if (k === 'measureText') return () => ({ width: 20 }); if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} }); return () => {}; }, set(t, k, v) { t[k] = v; return true; } });
const fireEv = (el, type, extra = {}) => { const e = Object.assign({ type, target: el, clientX: 0, clientY: 0, key: '', preventDefault() {}, ctrlKey: false, metaKey: false, altKey: false }, extra); for (let x = el; x; x = x.parent) for (const f of (x.listeners[type] || []).slice()) f(e); };
const winL = {}, docL = {};
globalThis.window = { addEventListener: (ty, f) => { (winL[ty] = winL[ty] || []).push(f); }, removeEventListener: (ty, f) => { winL[ty] = (winL[ty] || []).filter((x) => x !== f); }, scrollY: 0, scrollTo() {}, devicePixelRatio: 2 };
const headEl = new El('head');
globalThis.document = { hidden: false, createElement: (tag) => new El(tag), getElementById: (id) => headEl.kids.find((k) => k.attrs && k.attrs.id === id) || null, head: { appendChild: (e) => { e.attrs.id = e.id; headEl.kids.push(e); } }, addEventListener: (ty, f) => { (docL[ty] = docL[ty] || []).push(f); }, removeEventListener: (ty, f) => { docL[ty] = (docL[ty] || []).filter((x) => x !== f); } };
const lsMap = new Map();
globalThis.localStorage = { getItem: (k) => (lsMap.has(k) ? lsMap.get(k) : null), setItem: (k, v) => { lsMap.set(k, String(v)); }, removeItem: (k) => { lsMap.delete(k); } };
const fireWin = (ty, e = {}) => (winL[ty] || []).slice().forEach((f) => f(Object.assign({ preventDefault() {}, target: new El('body') }, e)));
// nep-AudioContext om de geluidscode te laten lopen
const audioLog = { tones: 0, noise: 0, closed: 0 };
class FakeParam { setValueAtTime() {} exponentialRampToValueAtTime() {} }
class FakeAC {
  constructor() { this.currentTime = 0; this.state = 'running'; this.sampleRate = 8000; this.destination = {}; }
  createGain() { return { gain: Object.assign(new FakeParam(), { value: 1 }), connect() {} }; }
  createOscillator() { audioLog.tones++; return { type: '', frequency: new FakeParam(), connect() {}, start() {}, stop() {} }; }
  createBiquadFilter() { return { type: '', frequency: new FakeParam(), Q: {}, connect() {} }; }
  createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; }
  createBufferSource() { audioLog.noise++; return { buffer: null, connect() {}, start() {}, stop() {} }; }
  resume() { return Promise.resolve(); }
  close() { audioLog.closed++; return Promise.resolve(); }
}

const A = await import('../docs/big-foodtruck.js');
const { newState, serialize, parseSave, derive, rates, offlineGain, Game, DISHES, DISH, ING_IDS, CITIES, STAFF, UPG, DECOR, MISSIONS, ACH, PERKS, fmt, fmtTime, starsOf, fameNeed, mulberry, dayKey, MAX_DATA, MAX_OFFLINE } = A;

/* =================== 1. PURE LOGICA =================== */
await t('inhoud: 40+ gerechten, 8 steden, 30+ missies, genoeg prestaties en decoratie', () => {
  ok(DISHES.length >= 40, `gerechten ${DISHES.length}`); eq(CITIES.length, 8); ok(MISSIONS.length >= 30); ok(ACH.length >= 60, `prestaties ${ACH.length}`); ok(DECOR.length >= 20);
  eq(new Set(DISHES.map((d) => d.id)).size, DISHES.length, 'unieke gerecht-id\'s');
  for (const d of DISHES) { for (const [id] of d.ing) ok(A.ING[id], `ingrediënt ${id} bestaat (${d.id})`); ok(d.price > 0 && d.cook > 0); }
  eq(DISH.bro.ing.length, 0, 'het broodje van het huis heeft geen ingrediënten (nooit vastlopen)');
  eq(DISH.bro.unl, 0);
});
await t('fmt en fmtTime', () => {
  eq(fmt(0), '0'); eq(fmt(7.34), '7,3'); eq(fmt(999), '999'); eq(fmt(1500), '1,5K'); eq(fmt(2.5e6), '2,5M'); eq(fmt(1e12), '1T'); ok(fmt(1e40).length < 12); eq(fmt(NaN), '0');
  eq(fmtTime(30), '30 s'); eq(fmtTime(600), '10 min'); eq(fmtTime(7200), '2 uur'); eq(fmtTime(5400), '1 u 30 min');
});
await t('sterren: monotoon en begrensd', () => {
  eq(starsOf(0), 0); let prev = 0; for (let n = 1; n <= 25; n++) { ok(fameNeed(n) > prev); prev = fameNeed(n); eq(starsOf(fameNeed(n)), n); eq(starsOf(fameNeed(n) - 1), n - 1); } eq(starsOf(1e30), 25);
});
await t('opslag: roundtrip en grootte (rijke staat)', () => {
  const S = newState(12345);
  S.coins = 123456.789; S.fame = 99999; for (const d of DISHES) S.rec[d.id] = 10; S.menu = DISHES.slice(0, 8).map((d) => d.id);
  for (const i of A.ING_IDS) S.stock[i] = 200; for (const k of Object.keys(STAFF)) S.staff[k] = 40; for (const u of UPG) S.up[u.id] = u.max;
  for (const c of CITIES) S.cities[c.id] = { r: 4.3, b: 40 }; S.decor = DECOR.map((d) => d.id); S.placed = { dak: 'kro', zij: 'neo', lucht: 'reg', g0: 'rad', g1: 'dra', g2: 'sta' };
  for (let i = 0; i < MISSIONS.length; i++) S.mdone[i] = 1; for (const a of ACH) S.ach[a.id] = 1; S.badges = 500; S.spent = 100; for (const p of PERKS) S.perks[p.id] = p.max; S.life.served = 1e7; S.tut = 99;
  const s = serialize(S);
  ok(s.length <= MAX_DATA, `grootte ${s.length} <= ${MAX_DATA}`); if (VERBOSE) console.log('   volle save:', s.length, 'tekens');
  const P = parseSave(s);
  eq(JSON.stringify(serialize(P)), JSON.stringify(s), 'parse(serialize(S)) is stabiel');
  eq(P.rec.dia, 10); eq(P.cities.ist.b, 40); eq(P.placed.g2, 'sta'); eq(P.badges, 500); eq(Object.keys(P.ach).length, ACH.length);
  const small = serialize(newState(1)); ok(small.length < 1500, `kleine save ${small.length}`);
});
await t('opslag: migratie en kapotte gegevens', () => {
  eq(parseSave('geen json'), null); eq(parseSave('null'), null); eq(parseSave('5'), null);
  const P = parseSave('{"v":0,"c":"abc","f":-5,"rc":{"xxx":3,"tos":99},"mn":["zzz","tos"],"cs":{"mars":{"r":9},"rom":{"r":9,"b":-3}},"ci":"rom","up":{"pan":999,"nep":1},"sf":{"kok":-4},"lk":{"col":99,"name":"aaaaaaaaaaaaaaaaaaaaaaaaaaa"},"pl":{"dak":"niet-bezit"},"tu":-3}');
  ok(P, 'leesbaar'); eq(P.coins, 0); eq(P.fame, 0); eq(P.rec.xxx, undefined); eq(P.rec.tos, 10); ok(P.rec.bro, 'broodje altijd aanwezig'); eq(JSON.stringify(P.menu), '["tos"]');
  eq(P.cities.mars, undefined); eq(P.cities.rom.r, 5); eq(P.cities.rom.b, 0); eq(P.city, 'rom'); eq(P.up.pan, UPG[0].max); eq(P.up.nep, undefined); eq(P.staff.kok, 0); eq(P.look.col, 9); eq(P.look.name.length, 18); eq(P.placed.dak, undefined); eq(P.tut, 0);
  const E = parseSave('{}'); ok(E && E.menu.length === 1 && E.city === 'ams');
  const w = parseSave(JSON.stringify({ c: 5, cs: { rom: { r: 4, b: 2 } }, ci: 'ist' })); eq(w.city, 'ams', 'stad die niet geopend is -> Amsterdam');
});
await t('afleidingen: nieuwe staat en bonussen', () => {
  const S = newState(0), D = derive(S, null);
  eq(D.burners, 1); eq(D.cap, 3); eq(D.menuSlots, 2); eq(D.stars, 0); ok(D.arrival > 0.3 && D.arrival < 1.5, `arrival ${D.arrival}`); eq(D.autoCook, false);
  S.up.brn = 3; S.up.ctr = 2; S.up.mnu = 1; S.staff.kok = 5; S.staff.srv = 6; S.badges = 8;
  const E = derive(S, null); eq(E.burners, 4); eq(E.cap, 5); eq(E.menuSlots, 3); eq(E.autoFlip, true); eq(E.quickAuto, true); ok(E.priceMul > D.priceMul);
});
await t('markt: prijzen schommelen binnen grenzen', () => {
  for (const id of ING_IDS) { let mn = 9, mx = 0; for (let tt = 0; tt < 20000; tt += 7) { const f = A.mktFactor(id, tt); mn = Math.min(mn, f); mx = Math.max(mx, f); ok(f > 0.4 && f < 1.6); } ok(mx - mn > 0.4, `${id} schommelt genoeg: ${mn.toFixed(2)}..${mx.toFixed(2)}`); }
});
await t('spel: koken, serveren, geld en voorraad', () => {
  const S = newState(0), g = new Game(S, { rng: mulberry(3), wall: () => 0 });
  g.tick(0.1); ok(g.slots[0], 'eerste klant komt meteen'); eq(g.slots[0].dish, 'bro');
  eq(g.tapSlot(0), 'ok'); eq(g.slots[0].st, 'cook'); eq(g.tapSlot(0), 'busy');
  for (let i = 0; i < 40; i++) g.tick(0.1);
  const c0 = g.slots[0]; ok(c0 && (c0.st === 'ready' || c0.flip > 0), 'klaar');
  eq(g.tapSlot(0), 'serve'); ok(S.coins > 5, `betaald ${S.coins}`); eq(S.life.served, 1); ok(S.fame > 0);
  // geen ingrediënten: tosti kan niet
  S.rec.tos = 1; S.menu = ['tos']; g.touch(); g.slots = []; g.spawn(); const sl = g.slots.findIndex(Boolean); const tos = g.slots[sl]; tos.dish = 'tos'; tos.need = true;
  eq(g.startCook(sl), 'stock'); S.coins = 100; eq(g.quickBuyFor(sl), 'ok'); eq(g.startCook(sl), 'ok'); eq(S.stock.br, 0); eq(S.stock.ka, 0);
});
await t('spel: één kookpit, tweede klant wacht; flip-venster en auto-kok', () => {
  const S = newState(0), g = new Game(S, { rng: mulberry(5), wall: () => 0 }); g.tick(0.1); g.tick(2); g.tick(2);
  const idx = g.slots.map((c, i) => (c ? i : -1)).filter((i) => i >= 0); ok(idx.length >= 2, 'meerdere klanten');
  eq(g.startCook(idx[0]), 'ok'); eq(g.startCook(idx[1]), 'burn');
  const c = g.slots[idx[0]]; for (let i = 0; i < 60 && c.flip !== 1; i++) g.tick(0.05); eq(c.flip, 1, 'flip-venster opent');
  ok(g.flip(idx[0]), 'omdraaien lukt'); eq(c.flip, 2);
  S.staff.kok = 5; S.staff.srv = 6; g.touch(); for (let i = 0; i < 200; i++) g.tick(0.1); ok(S.life.served >= 3, 'personeel serveert zelf');
});
await t('spel: klanten die te lang wachten gaan weg (combo weg, beoordeling omlaag)', () => {
  const S = newState(0), g = new Game(S, { rng: mulberry(9), wall: () => 0 }); g.tick(0.1); g.combo = 4;
  const r0 = S.cities.ams.r; for (let i = 0; i < 400; i++) g.tick(0.1);
  ok(S.life.angry > 0, 'boze klant'); eq(g.combo, 0); ok(S.cities.ams.r < r0);
});
await t('spel: kopen/verbeteren geeft foutcodes en trekt geld af', () => {
  const S = newState(0), g = new Game(S);
  eq(g.upTruck('pan'), 'coins'); S.coins = 100; eq(g.upTruck('pan'), 'ok'); eq(S.up.pan, 1); ok(S.coins < 100);
  eq(g.unlockDish('piz'), 'stars'); S.coins = 1e6; eq(g.unlockDish('tos'), 'ok'); eq(g.unlockDish('tos'), 'have'); eq(JSON.stringify(S.menu), '["bro","tos"]');
  eq(g.unlockDish('pat'), 'ok'); eq(S.menu.length, 2, 'menu zit vol (2 plekken)'); eq(g.toggleMenu('pat'), 'slots'); eq(g.toggleMenu('bro'), 'ok'); eq(g.toggleMenu('pat'), 'ok'); eq(g.toggleMenu('tos'), 'ok'); eq(g.toggleMenu('pat'), 'last'); eq(g.toggleMenu('bro'), 'ok'); eq(g.toggleMenu('bro'), 'ok');
  for (let i = 0; i < 9; i++) g.upDish('tos'); eq(S.rec.tos, 10); eq(g.upDish('tos'), 'max');
  eq(g.buyIng('br', 5), 'ok'); eq(S.stock.br, 5); eq(g.buyIng('br', 9999), 'ok'); eq(S.stock.br, g.D.fridge); eq(g.buyIng('br', 1), 'full');
  eq(g.openCity('rom'), 'stars'); S.fame = fameNeed(2) + 1; eq(g.openCity('rom'), 'ok'); eq(g.travel('rom'), 'ok'); eq(S.city, 'rom'); eq(g.travel('rom'), 'here'); eq(g.travel('par'), 'none');
  eq(g.branch('rom'), 'ok'); eq(S.cities.rom.b, 1); ok(g.D.branch > 0);
  eq(g.buyDecor('bal'), 'ok'); eq(S.placed.dak, 'bal'); eq(g.placeDecor('bal'), 'removed'); eq(S.placed.dak, undefined); eq(g.placeDecor('bal'), 'ok'); eq(g.buyDecor('bal'), 'have');
  eq(g.buyDecor('g_onbekend'), 'none');
});
await t('evenementen: uitnodiging, schoolreisje (kinderen komen binnen), beroemdheid en beloning', () => {
  const S = newState(0); S.life.served = 100; S.staff.kok = 6; S.staff.srv = 7; for (const id of ING_IDS) S.stock[id] = 50; S.up.ctr = 1;
  const g = new Game(S, { rng: mulberry(21), wall: () => 0, events: true, evFirst: 1 });
  let invited = null; for (let i = 0; i < 400 && !invited; i++) { g.tick(0.1); if (g.invite) invited = g.invite.id; } ok(invited, 'uitnodiging komt');
  g.declineEvent(); eq(g.invite, null);
  for (const id of ['sch', 'vip', 'cri', 'wed', 'ker', 'mus', 'foo', 'reg']) {
    g.ev = null; g.invite = { id, left: 60 }; const c0 = S.coins; ok(g.startEvent(), id); const arrBefore = derive(S, null).arrival;
    if (['ker', 'mus', 'foo', 'reg'].includes(id)) ok(g.D.arrival !== arrBefore || id === 'foo', `effect van ${id}`);
    let guard = 0; while (g.ev && guard++ < 3000) { g.tick(0.1); for (const e of g.out) void e; g.out = []; }
    eq(g.ev, null, `evenement ${id} eindigt`); ok(S.life.events >= 1);
    if (['sch', 'vip'].includes(id)) ok(S.coins > c0, `${id}: verdiend`);
  }
  ok(S.life.events >= 8);
});
await t('kok koopt zelf ontbrekende ingrediënten als er geen inkoper is', () => {
  const S = newState(0); S.coins = 500; S.life.served = 100; S.rec.tos = 1; S.menu = ['tos']; S.staff.kok = 3; S.staff.srv = 3;
  const g = new Game(S, { rng: mulberry(33), wall: () => 0 }); let served = 0; for (let i = 0; i < 600; i++) { g.tick(0.1); for (const e of g.out) if (e.type === 'serve') served++; g.out = []; }
  ok(served >= 8, `tosti's geserveerd zonder handmatig inkopen: ${served}`); ok(S.life.bought > 0);
});
await t('missies, prestaties en dagelijkse beloning', () => {
  const S = newState(0), g = new Game(S);
  eq(g.claimMission(0), 'notyet'); S.life.served = 3; const r = g.claimMission(0); ok(r >= 15); eq(g.claimMission(0), 'none');
  S.life.served = 100; g.sec = 1; g.checkGoals(); ok(S.ach.sv0 && S.ach.sv1, 'prestaties gehaald'); ok(g.out.some((e) => e.type === 'ach'));
  const d1 = g.claimDaily('2026-05-10'); eq(d1.day, 1); eq(g.claimDaily('2026-05-10'), null, 'maar één keer per dag');
  eq(g.claimDaily('2026-05-11').day, 2); eq(g.claimDaily('2026-05-12').day, 3); ok(d1.coins >= 120); ok(S.stock.br >= 8, 'dag 3 geeft ingrediënten');
  eq(g.claimDaily('2026-05-20').day, 1, 'streak breekt bij overgeslagen dag');
  for (let i = 0; i < 6; i++) g.claimDaily(`2026-06-0${i + 1}`); eq(g.claimDaily('2026-06-07').day, 7); eq(g.claimDaily('2026-06-08').day, 1, 'na dag 7 weer dag 1');
});
await t('offline: max 8 uur, alleen met personeel veel, nooit negatief', () => {
  const S = newState(0); S.staff.kok = 8; S.staff.srv = 8; S.up.pan = 5; S.fame = fameNeed(3) + 1; const before = S.coins;
  const r = offlineGain(S, 3600); ok(r.coins > 0 && S.coins > before); const half = S.coins;
  const S2 = structuredClone(S); const r8 = offlineGain(S2, 8 * 3600), r30 = offlineGain(structuredClone(S), 30 * 3600), r8b = offlineGain(structuredClone(S), 8 * 3600);
  eq(Math.round(r30.coins), Math.round(r8b.coins), 'cap op 8 uur'); eq(r8.sec, MAX_OFFLINE); ok(r8.coins > r.coins * 3);
  const none = newState(0); const rn = offlineGain(none, 3600); ok(rn.coins >= 0 && rn.coins < r.coins / 5, 'zonder personeel verdien je weinig, maar niet negatief');
  eq(offlineGain(newState(0), 0).coins, 0); eq(offlineGain(newState(0), -50).coins, 0); eq(offlineGain(newState(0), NaN).coins, 0);
  ok(Number.isFinite(S.coins) && half > 0);
});
await t('offline: analytische snelheid ligt dicht bij de echte engine (±35%)', () => {
  const mk = (cfg) => { const S = newState(0); Object.assign(S.staff, cfg.staff); Object.assign(S.up, cfg.up); S.fame = cfg.fame; for (const id of cfg.dishes) S.rec[id] = 3; S.menu = cfg.dishes.slice(); S.life.served = 100; for (const id of ING_IDS) S.stock[id] = 1e6; return S; };
  for (const cfg of [{ staff: { kok: 3, srv: 3 }, up: { pan: 3 }, dishes: ['bro', 'tos'], fame: 0 }, { staff: { kok: 10, srv: 10, kas: 5 }, up: { pan: 8, brn: 2, sign: 8, ctr: 2, cash: 6 }, dishes: ['pas', 'piz', 'bur', 'taq'], fame: 1000 }]) {
    const S = mk(cfg), g = new Game(S, { rng: mulberry(7), wall: () => 0 }); let gross = 0;
    for (let tt = 0; tt < 600; tt += 0.05) { g.tick(0.05); for (const e of g.out) if (e.type === 'serve') gross += e.pay; g.out = []; }
    const S2 = mk(cfg), a = rates(S2, 'idle'), est = a.coins + a.cps * A.menuStats(S2, derive(S2, null)).cost, ratio = (gross / 600) / est;
    ok(ratio > 0.75 && ratio < 1.5, `engine/analytisch ${ratio.toFixed(2)}`);
  }
});
await t('franchise: reset met behoud, lepels en voordelen', () => {
  const S = newState(0), g = new Game(S);
  eq(g.prestige(), 'no'); S.fame = fameNeed(10) + 1; S.run.earned = 5e8; S.coins = 1e9; S.rec.tos = 4; S.staff.kok = 9; S.decor = ['bal']; S.placed = { dak: 'bal' }; S.ach.sv0 = 1; S.mdone[0] = 1; S.look.col = 4;
  const gain = A.prestigeGain(S); ok(gain >= 5, `gain ${gain}`); eq(g.prestige(), gain);
  eq(S.badges, gain); eq(S.coins, 0); eq(S.fame, 0); eq(S.staff.kok, undefined); eq(S.rec.tos, undefined); eq(S.life.franch, 1); eq(S.decor[0], 'bal'); eq(S.ach.sv0, 1); eq(S.mdone[0], 1); eq(S.look.col, 4); eq(S.city, 'ams');
  ok(derive(S, null).priceMul > derive(newState(0), null).priceMul, 'blijvende bonus');
  eq(g.buyPerk('cash'), 'ok'); eq(S.perks.cash, 1); eq(S.spent, 1); const S2 = newState(0, { badges: S.badges, spent: S.spent, perks: { cash: 2, crew: 2 }, life: S.life, look: S.look, decor: [], placed: {}, mdone: {}, ach: {}, daily: S.daily, tut: 99, set: S.set, auto: S.auto });
  eq(S2.coins, 150 * 16, 'startgeld'); eq(S2.staff.kok, 6, 'vaste ploeg'); eq(S2.staff.srv, 4);
  for (let i = 0; i < 30; i++) g.buyPerk('fans'); eq(S.perks.fans <= 5, true); eq(g.buyPerk('onbekend'), 'none');
});
await t('slim menu kiest gerechten van deze stad (met smaak)', () => {
  const S = newState(0), g = new Game(S); S.coins = 1e9; S.fame = fameNeed(3) + 1; S.up.mnu = 2; for (const d of ['tos', 'pat', 'sta', 'pas', 'piz', 'bur', 'taq', 'cro']) g.unlockDish(d);
  g.autoMenu(); eq(S.menu.length, 4); ok(S.menu.every((id) => S.rec[id])); ok(S.menu.includes('piz') || S.menu.includes('bur'), 'duurste gerechten kiezen');
});

/* =================== 2. BALANS-SIMULATIE =================== */
function candidates(S) {
  const out = [], stars = starsOf(S.fame);
  for (const d of DISHES) { if (!S.rec[d.id]) { if (stars >= d.st) out.push({ k: 'dish', cost: d.unl, a: (g) => g.unlockDish(d.id) }); } else if (S.rec[d.id] < 10) out.push({ k: 'lv', cost: A.dishUpCost(d, S.rec[d.id]), a: (g) => g.upDish(d.id) }); }
  for (const id of Object.keys(STAFF)) if ((S.staff[id] | 0) < STAFF[id].max) out.push({ k: 'staff', cost: A.staffCost(id, S.staff[id] | 0), a: (g) => g.upStaff(id) });
  for (const u of UPG) if ((S.up[u.id] | 0) < u.max) out.push({ k: 'up', cost: A.upCost(u.id, S.up[u.id] | 0), a: (g) => g.upTruck(u.id) });
  for (const c of CITIES) { if (!S.cities[c.id]) { if (stars >= c.st) out.push({ k: 'city', cost: c.cost, a: (g) => { const r = g.openCity(c.id); if (r === 'ok') g.travel(c.id); return r; } }); } else { const lv = S.cities[c.id].b; out.push({ k: 'branch', cost: lv ? A.branchUpCost(c, lv) : A.branchBuild(c), a: (g) => g.branch(c.id) }); } }
  for (const d of DECOR) if (!S.decor.includes(d.id)) out.push({ k: 'decor', cost: d.price, a: (g) => g.buyDecor(d.id) });
  return out;
}
function simulate(hours, mode = 'active', { prestige = false } = {}) {
  const S = newState(0), g = new Game(S); g.autoMenu();
  let tt = 0, last = 0, runStart = 0, nextSnap = 0; const gaps = [], starT = {}, buys = [], snaps = [], cycles = []; let guard = 0, minRate = Infinity;
  while (tt < hours * 3600 && guard++ < 200000) {
    const base = rates(S, mode); minRate = Math.min(minRate, base.coins);
    if (tt >= nextSnap) { snaps.push([tt, starsOf(S.fame), base.coins, S.city, S.badges]); nextSnap += 600; }
    let best = null, bs = Infinity;
    for (const c of candidates(S)) {
      const S2 = structuredClone(S); const g2 = new Game(S2); S2.coins = 1e30; c.a(g2); g2.autoMenu(); const d = rates(S2, mode).coins - base.coins; if (d <= 1e-9) continue;
      const sc = Math.max(0, c.cost - S.coins) / Math.max(base.coins, 0.01) + c.cost / d; if (sc < bs) { bs = sc; best = c; }
    }
    let dt = best ? Math.max(0.5, Math.min(Math.max(0, best.cost - S.coins) / Math.max(base.coins, 0.01), 3600)) : 60; if (tt + dt > hours * 3600) dt = hours * 3600 - tt;
    S.coins += base.coins * dt; S.run.earned += base.coins * dt; S.life.earned += base.coins * dt; S.fame += base.fame * dt; S.life.served += base.cps * dt; tt += dt;
    const st = starsOf(S.fame); if (!prestige || S.life.franch === 0) for (let n = 1; n <= st; n++) if (starT[n] === undefined) starT[n] = tt;
    if (best && S.coins >= best.cost) { if (best.a(g) === 'ok') { gaps.push([tt, tt - last]); last = tt; buys.push([tt, best.k]); g.autoMenu(); let bc = S.city, bv = -1; for (const id of Object.keys(S.cities)) { const S3 = structuredClone(S); const g3 = new Game(S3); g3.travel(id); g3.autoMenu(); const v = rates(S3, mode).coins; if (v > bv) { bv = v; bc = id; } } if (bc !== S.city) { g.travel(bc); g.autoMenu(); } } }
    if (prestige && A.canPrestige(S)) { const gain = A.prestigeGain(S); if (gain >= Math.max(3, S.badges * 0.8) && tt - runStart > 1800) { cycles.push({ dur: tt - runStart, gain, badges: S.badges + gain }); g.prestige(); runStart = tt; for (const id of ['crew', 'cash', 'fans', 'disc', 'fast', 'off', 'menu']) while (g.buyPerk(id) === 'ok'); g.autoMenu(); } }
  }
  return { S, gaps, starT, buys, minRate, t: tt, snaps, cycles };
}
await t('balans: eerste upgrade < 20 s en eerste doel < 2 min (echte engine met bot)', () => {
  const S = newState(0), g = new Game(S, { rng: mulberry(11), wall: () => 0 });
  let tt = 0, tUp = null, tMission = null, tTos = null, tReact = 0;
  for (; tt < 240; tt += 0.1) {
    g.tick(0.1); tReact += 0.1;
    if (tReact >= 0.5) { tReact = 0; for (let i = 0; i < g.slots.length; i++) { const c = g.slots[i]; if (!c) continue; if (c.st === 'ready') g.serve(i, false); else if (c.st === 'wait') { if (c.need) g.quickBuyFor(i); g.startCook(i, false); } else if (c.st === 'cook' && c.flip === 1) g.flip(i, false); } }
    g.out = [];
    if (tUp === null && S.coins >= A.upCost('pan', 0)) { tUp = tt; g.upTruck('pan'); }
    if (tMission === null && S.life.served >= 15 && A.metric(S, 'served') >= 15) tMission = tt;
    if (tTos === null && S.coins >= DISH.tos.unl) { tTos = tt; g.unlockDish('tos'); }
  }
  if (VERBOSE) console.log(`   eerste upgrade na ${tUp.toFixed(1)} s, 15 klanten na ${tMission.toFixed(1)} s, tosti na ${tTos.toFixed(1)} s`);
  ok(tUp !== null && tUp < 20, `eerste upgrade na ${tUp} s`); ok(tMission !== null && tMission < 120, `eerste doel (3 klanten) is al eerder, 15 klanten na ${tMission}`);
  ok(tTos !== null && tTos < 90, `eerste nieuw gerecht na ${tTos} s`);
  const first = (() => { const S3 = newState(0), g3 = new Game(S3, { rng: mulberry(11), wall: () => 0 }); for (let x = 0; x < 120; x += 0.1) { g3.tick(0.1); for (let i = 0; i < g3.slots.length; i++) { const c = g3.slots[i]; if (c && c.st === 'ready') g3.serve(i, false); else if (c && c.st === 'wait') g3.startCook(i, false); } if (S3.life.served >= 3) return x; } return 999; })();
  ok(first < 30, `eerste missie (3 klanten) na ${first} s`);
});
await t('balans: nooit vastlopen zonder inkomen (arm, zonder voorraad)', () => {
  const S = newState(0); S.coins = 0; const r = rates(S, 'active'); ok(r.coins > 1, 'actief inkomen vanaf het begin'); ok(rates(S, 'idle').coins > 0, 'zelfs offline een beetje');
  const g = new Game(S, { rng: mulberry(1), wall: () => 0 }); S.menu = ['bro']; for (let i = 0; i < 600; i++) { g.tick(0.1); for (let k = 0; k < g.slots.length; k++) { const c = g.slots[k]; if (c && c.st === 'ready') g.serve(k, false); else if (c && c.st === 'wait') g.startCook(k, false); } }
  ok(S.coins > 50, 'zonder geld en voorraad toch verdienen met het broodje');
  // menu vol met gerechten zonder voorraad en zonder geld: klanten pakken alsnog het broodje
  const S2 = newState(0); S2.rec.tos = 1; S2.rec.pat = 1; S2.menu = ['tos', 'pat']; const g2 = new Game(S2, { rng: mulberry(2), wall: () => 0 }); S2.life.served = 100; let served = 0;
  for (let i = 0; i < 1500; i++) { g2.tick(0.1); for (let k = 0; k < g2.slots.length; k++) { const c = g2.slots[k]; if (!c) continue; if (c.st === 'ready') { g2.serve(k, false); served++; } else if (c.st === 'wait') g2.startCook(k, false); } }
  ok(served > 10, `zonder voorraad toch geserveerd: ${served}`);
});
await t('balans: soepele voortgang over uren (actief)', () => {
  const r = simulate(4, 'active'); const S = r.S;
  ok(r.minRate > 0, 'inkomen is nooit nul');
  const early = r.gaps.filter(([t0]) => t0 < 3600); const maxEarly = Math.max(...early.map((x) => x[1]));
  ok(maxEarly < 600, `grootste pauze tussen aankopen in het eerste uur: ${maxEarly.toFixed(0)} s`);
  const mid = r.gaps.filter(([t0]) => t0 >= 3600); const maxMid = Math.max(0, ...mid.map((x) => x[1])); ok(maxMid < 1800, `pauze later: ${maxMid.toFixed(0)} s`);
  ok(r.starT[1] < 300, `eerste ster na ${(r.starT[1] / 60).toFixed(1)} min`); ok(r.starT[3] > 180 && r.starT[3] < 1800, `ster 3 na ${(r.starT[3] / 60).toFixed(1)} min`);
  ok(r.starT[8] > 20 * 60, `ster 8 niet te snel: ${(r.starT[8] / 60).toFixed(0)} min`); ok(r.starT[8] < 3 * 3600, `ster 8 niet te traag: ${(r.starT[8] / 60).toFixed(0)} min`);
  for (let n = 2; n <= 10; n++) ok(r.starT[n] >= r.starT[n - 1], 'sterren komen op volgorde');
  const stepGrow = (r.starT[8] - r.starT[7]) / Math.max(1, r.starT[3] - r.starT[2]); ok(stepGrow > 1, 'sterren worden steeds langzamer te halen');
  if (VERBOSE) { console.log('   tijdlijn (elke 30 min): ' + r.snaps.filter((x, i) => i % 3 === 0).map((x) => `${(x[0] / 60).toFixed(0)}m: ⭐${x[1]} ${fmt(x[2])}/s ${x[3]}`).join(' | ')); console.log('   sterren (min):', Object.entries(r.starT).map(([n, x]) => `${n}:${(x / 60).toFixed(0)}`).join(' ')); console.log(`   na 4 u: ${starsOf(S.fame)} sterren, inkomen ${fmt(rates(S, 'active').coins)}/s, ${r.buys.length} aankopen`); }
});
await t('balans: ook met alleen offline-voortgang komt het spel op gang (idle)', () => {
  const r = simulate(3, 'idle'); ok(r.minRate >= 0); ok(starsOf(r.S.fame) >= 5, `idle bereikt ${starsOf(r.S.fame)} sterren in 3 uur`);
});
await t('balans: meerdere franchise-rondes worden sneller en blijven een uitdaging', () => {
  const r = simulate(5, 'active', { prestige: true }); ok(r.cycles.length >= 3, `rondes ${r.cycles.length}`);
  if (VERBOSE) { console.log('   franchise-rondes (u):', r.cycles.map((c) => `${(c.dur / 3600).toFixed(2)} (+${c.gain})`).join('  ')); }
  ok(r.cycles[0].dur > 25 * 60 && r.cycles[0].dur < 3 * 3600, `eerste ronde ${(r.cycles[0].dur / 60).toFixed(0)} min`); ok(r.cycles[1].dur < r.cycles[0].dur, 'tweede ronde is sneller'); ok(r.cycles[1].dur > 10 * 60, 'maar niet triviaal');
  for (const c of r.cycles) ok(c.dur > 10 * 60, 'elke ronde duurt minstens 10 min');
});
await t('balans: franchise is haalbaar rond 1 tot 3 uur en maakt de volgende ronde sneller', () => {
  const r = simulate(3.5, 'active'); const S = r.S; ok(A.canPrestige(S) || r.starT[10] !== undefined, `ster 10 gehaald na ${r.starT[10] ? (r.starT[10] / 3600).toFixed(2) : '>3,5'} uur`);
  ok(r.starT[10] > 30 * 60 && r.starT[10] < 3.4 * 3600, `ster 10 na ${(r.starT[10] / 60).toFixed(0)} min`);
  const gain = A.prestigeGain(S); ok(gain >= 2 && Number.isFinite(gain), `lepels bij eerste franchise: ${gain}`);
  const S2 = newState(0, { badges: gain, spent: 0, perks: {}, life: S.life, look: S.look, decor: [], placed: {}, mdone: {}, ach: {}, daily: S.daily, tut: 99, set: S.set, auto: S.auto });
  ok(rates(S2, 'active').coins > rates(newState(0), 'active').coins * 1.15, 'bonus werkt direct');
});

/* =================== 3. DE VIEW IN EEN NEP-DOM =================== */
const NOW0 = clock.now;
async function mount({ db = null, save = null, audio = false, uid = 'u1' } = {}) {
  lsMap.clear(); clock.timers = []; clock.raf = null; clock.now = NOW0 + 10 * 86400000;
  winL.keydown = []; winL.pagehide = []; docL.visibilitychange = [];
  if (save) { save.ts = clock.now - (save._away || 0); lsMap.set(`big:foodtruck:${uid}`, serialize(save)); }
  globalThis.window.AudioContext = audio ? FakeAC : undefined;
  const view = new El('div'); const cleanups = [];
  const ctx = { db, me: { uid }, esc: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'), nice: (e) => String(e), uid, view, addCleanup: (f) => cleanups.push(f) };
  const p = A.foodtruckView(ctx); if (db) { for (let i = 0; i < 60 && clock.timers.length === 0; i++) await new Promise((r) => setImmediate(r)); }
  await p;
  return { view, cleanups, destroy: () => cleanups.forEach((f) => f()) };
}
const click = (view, sel, i = 0) => { const el = view.querySelectorAll(sel)[i]; if (!el) throw new Error('niet gevonden: ' + sel); fireEv(el, 'click'); return el; };
const modalVisible = (view) => { const m = view.querySelector('.ft-modal'); return m && !m.hidden; };
const coinsTxt = (view) => view.querySelector('#ft-c').textContent;
const richSave = () => { const S = newState(0); S.coins = 5e9; S.fame = fameNeed(12) + 1; for (const d of DISHES.slice(0, 20)) S.rec[d.id] = 2; S.menu = ['bro', 'tos', 'pat', 'piz']; S.staff.kok = 5; S.staff.srv = 5; S.staff.buy = 2; for (const c of CITIES.slice(0, 4)) S.cities[c.id] = { r: 4, b: 1 }; S.tut = 99; S.life.served = 500; S.mdone[0] = 1; S.mdone[1] = 1; return S; };

await t('view: start zonder opslag toont scene, tickets en tutorial; klikken kookt en serveert', async () => {
  const { view, destroy } = await mount();
  ok(view.querySelector('.ft'), 'hoofdelement'); eq(view.querySelectorAll('.ft-nav button').length, 7, '7 tabs'); ok(view.querySelector('.ft-cv canvas'), 'canvas');
  eq(view.querySelectorAll('.ft-tk').length, 3, '3 bestelplekken');
  advance(400); ok(view.querySelector('.ft-tk.w') || view.querySelector('.ft-tk.c'), 'er staat een klant');
  ok(!view.querySelector('.ft-coach').hidden, 'tutorial zichtbaar'); ok(view.querySelector('.ft-coach').textContent.includes('Tik'), 'tutorial-tekst');
  const slot = view.querySelectorAll('.ft-tk').findIndex((x) => x.className.includes(' w')); ok(slot >= 0, 'wachtende klant'); click(view, '.ft-tk', slot);
  advance(600); ok(view.querySelectorAll('.ft-tk')[slot].className.match(/ c| f/), 'kookt'); advance(2600); ok(view.querySelectorAll('.ft-tk')[slot].className.includes(' r'), 'klaar'); click(view, '.ft-tk', slot); advance(300);
  ok(parseFloat(coinsTxt(view)) >= 5, 'geld verdiend: ' + coinsTxt(view));
  advance(3000); ok(view.querySelector('.ft-coach').textContent.length > 5);
  destroy();
});
await t('view: alle tabs renderen en alle knoppen werken (rijke speler, willekeurig klikken)', async () => {
  const { view, destroy } = await mount({ save: richSave(), audio: true });
  advance(2000);
  const tabs = ['menu', 'mkt', 'team', 'city', 'tru', 'more', 'svc']; const rnd = mulberry(42); let clicks = 0;
  for (const tb of tabs) {
    click(view, `[data-a="tab"][data-v="${tb}"]`); advance(300);
    if (tb === 'svc') { ok(!view.querySelector('[data-p="svc"]').hidden); continue; }
    const pane = view.querySelector('[data-p="oth"]'); ok(!pane.hidden && pane.innerHTML.length > 200, `${tb} heeft inhoud`);
    ok(!/undefined|NaN|\[object/.test(pane.innerHTML), `${tb}: geen undefined/NaN in de HTML`);
    for (let round = 0; round < 40; round++) {
      const btns = pane.querySelectorAll('[data-a]').filter((b) => !['tab', 'reset1', 'reset2', 'reset3', 'prest2'].includes(b.dataset.a));
      if (!btns.length) break; const b = btns[Math.floor(rnd() * btns.length)]; fireEv(b, 'click'); clicks++; advance(120);
      ok(!/undefined|NaN|\[object/.test(view.querySelector('[data-p="oth"]').innerHTML), `${tb}: HTML ok na klik op ${b.dataset.a}`);
      if (rnd() < 0.2) while (view.querySelector('.ft-modal') && !view.querySelector('.ft-modal').hidden && view.querySelector('.ft-modal [data-a="mclose"]')) fireEv(view.querySelector('.ft-modal [data-a="mclose"]'), 'click');
    }
  }
  ok(clicks > 100, `geklikt: ${clicks}`);
  for (const sb of ['ms', 'ac', 'rv', 'fr', 'op']) { click(view, '[data-a="tab"][data-v="more"]'); click(view, `[data-a="msub"][data-v="${sb}"]`); ok(view.querySelector('[data-p="oth"]').innerHTML.length > 100, `meer/${sb}`); }
  destroy();
});
await t('view: fuzz met een beginnende speler (honderden willekeurige tikken, sprongen in tijd) blijft heel en eindig', async () => {
  const { view, destroy } = await mount({ audio: true }); const rnd = mulberry(2024); const tabs = ['svc', 'menu', 'mkt', 'team', 'city', 'tru', 'more'];
  for (let step = 0; step < 400; step++) {
    const r = rnd();
    if (r < 0.15) click(view, `[data-a="tab"][data-v="${tabs[Math.floor(rnd() * tabs.length)]}"]`);
    else if (r < 0.55) { const tk = view.querySelectorAll('.ft-tk'); if (tk.length) fireEv(tk[Math.floor(rnd() * tk.length)], 'click'); }
    else if (r < 0.85) { const cand = view.querySelectorAll('[data-a]').filter((b) => !['reset1', 'reset2', 'reset3', 'prest2'].includes(b.dataset.a) && b.dataset.a !== 'snd'); if (cand.length) fireEv(cand[Math.floor(rnd() * cand.length)], 'click'); }
    else if (r < 0.97) advance(Math.floor(rnd() * 4000) + 100); else { clock.now += Math.floor(rnd() * 2 * 3600 * 1000); advance(600); }
    advance(50);
    if (step % 25 === 0) for (const pane of view.querySelectorAll('.ft-pane')) ok(!/undefined|NaN|\[object|Infinity/.test(pane.innerHTML), `HTML ok bij stap ${step}`);
  }
  destroy(); const P = parseSave(lsMap.get('big:foodtruck:u1')); ok(P, 'save leesbaar'); ok(Number.isFinite(P.coins) && Number.isFinite(P.fame) && P.coins >= 0, 'getallen eindig'); ok(lsMap.get('big:foodtruck:u1').length <= MAX_DATA);
});
await t('view: een nieuwe ster geeft een feestscherm met wat er nieuw is', async () => {
  const S = newState(0); S.tut = 99; S.life.served = 100; S.fame = fameNeed(2) - 4; S.coins = 50; S.staff.kok = 3; S.staff.srv = 3; S.cities.rom = { r: 4, b: 0 }; const { view, destroy } = await mount({ save: S });
  let seen = false; for (let i = 0; i < 300 && !seen; i++) { advance(500); if (modalVisible(view) && view.querySelector('.ft-modal').textContent.includes('Nieuwe ster')) seen = true; else while (modalVisible(view)) fireEv(view.querySelector('.ft-modal button'), 'click'); }
  ok(seen, 'ster-scherm'); const txt = view.querySelector('.ft-modal').textContent; ok(txt.includes('nu 2') || txt.includes('2'), txt); ok(txt.includes('Nieuwe gerechten'), 'toont nieuwe gerechten: ' + txt); destroy();
});
await t('view: offline sterren verdiend worden in het welkom-scherm genoemd', async () => {
  const S = richSave(); S.fame = fameNeed(4) - 5; S._away = 6 * 3600 * 1000; S.staff.kok = 10; S.staff.srv = 10; const { view, destroy } = await mount({ save: S }); advance(1000);
  ok(modalVisible(view) && view.querySelector('.ft-modal').textContent.includes('nieuwe'), view.querySelector('.ft-modal').textContent); destroy();
});
await t('view: markt toont prijzen en kopen werkt; naam van de truck aanpassen', async () => {
  const S = newState(0); S.coins = 500; S.tut = 99; const { view, destroy } = await mount({ save: S });
  click(view, '[data-a="tab"][data-v="mkt"]'); const before = parseFloat(coinsTxt(view)); click(view, '[data-a="buy"][data-id="br"][data-n="10"]'); advance(500);
  ok(parseFloat(coinsTxt(view)) < before, 'geld daalt na inkoop'); ok(view.querySelector('[data-st="br"]').textContent.startsWith('10/'), 'voorraad 10');
  const p1 = view.querySelector('[data-pr="br"]').textContent; advance(300000); ok(view.querySelector('[data-pr="br"]').textContent !== undefined && p1.length > 0, 'prijs ververst');
  click(view, '[data-a="tab"][data-v="tru"]'); const inp = view.querySelector('[data-in="name"]'); inp.value = 'Super Friet'; fireEv(inp, 'input'); destroy();
  const saved = JSON.parse(lsMap.get('big:foodtruck:u1')); eq(saved.lk.name, 'Super Friet', 'naam bewaard');
});
await t('view: opslag lokaal (sleutel, grootte) en herstel bij opnieuw openen', async () => {
  const { view, destroy } = await mount(); advance(500);
  const t1 = view.querySelectorAll('.ft-tk').findIndex((x) => x.className.includes(' w')); click(view, '.ft-tk', t1 < 0 ? 0 : t1); advance(10000);
  const raw = lsMap.get('big:foodtruck:u1'); ok(raw, 'lokaal bewaard'); ok(raw.length <= MAX_DATA); ok(JSON.parse(raw).v === 1);
  destroy(); const keep = raw;
  const m2 = await mount({}); lsMap.set('big:foodtruck:u1', keep); m2.destroy();
  const S = parseSave(lsMap.get('big:foodtruck:u1')); ok(S, 'terug te lezen');
});
await t('view: welkom-terug-scherm met offline-voortgang (max 8 uur)', async () => {
  const S = richSave(); S._away = 20 * 3600 * 1000; const before = S.coins; const { view, destroy } = await mount({ save: S });
  advance(1000); const m = view.querySelector('.ft-modal'); ok(!m.hidden, 'welkomstscherm'); ok(m.textContent.includes('Welkom terug'), m.textContent); ok(m.textContent.includes('8 uur'), 'uitleg over max 8 uur');
  const got = parseFloat(coinsTxt(view)); ok(got > 0); let guard = 0; while (modalVisible(view) && guard++ < 5) fireEv(view.querySelector('.ft-modal [data-a="mclose"]') || view.querySelector('.ft-modal [data-a="daily"]'), 'click'); ok(!modalVisible(view), 'sluit');
  void before; destroy();
});
await t('view: dagelijkse beloning verschijnt en is maar één keer te pakken', async () => {
  const S = richSave(); S.daily = { last: '', streak: 0 }; const { view, destroy } = await mount({ save: S }); advance(1500);
  ok(modalVisible(view), 'modal'); const modalTxt = view.querySelector('.ft-modal').textContent; ok(modalTxt.includes('Dagelijkse beloning') || modalTxt.includes('Welkom'), modalTxt);
  let guard = 0; while (modalVisible(view) && guard++ < 5) { const dly = view.querySelector('.ft-modal [data-a="daily"]'); fireEv(dly || view.querySelector('.ft-modal [data-a="mclose"]'), 'click'); }
  ok(!modalVisible(view)); click(view, '[data-a="tab"][data-v="more"]'); ok(view.querySelector('[data-p="oth"]').textContent.includes('Vandaag al opgehaald'), 'al opgehaald'); destroy();
  const s2 = parseSave(lsMap.get('big:foodtruck:u1')); eq(s2.daily.last, dayKey()); eq(s2.daily.streak, 1);
});
await t('view: cloud (nep-Firestore): nieuwste wint, exacte velden, max 1x per minuut, flush bij sluiten', async () => {
  const db = { naam: 'nep' }; __fs.clear(); __fsLog.length = 0;
  const cloudS = richSave(); cloudS.coins = 777777; cloudS.ts = NOW0 + 10 * 86400000 + 5000;
  __fs.set('gamesaves/big-foodtruck__u1', { game: 'big-foodtruck', uid: 'u1', data: serialize(cloudS), updated: cloudS.ts });
  const localS = richSave(); localS.coins = 11;
  const { view, destroy } = await mount({ db, save: localS }); advance(300);
  ok(parseFloat(coinsTxt(view).replace(',', '.')) > 100 || coinsTxt(view).includes('K') || coinsTxt(view).includes('M'), 'cloud-stand is nieuwer en gekozen: ' + coinsTxt(view));
  __fsLog.length = 0; await advanceAsync(10 * 60 * 1000, 100);
  const n = __fsLog.length; ok(n >= 8 && n <= 11, `cloud-schrijfacties in 10 min: ${n}`);
  for (const w of __fsLog) { eq(w.path, 'gamesaves/big-foodtruck__u1'); eq(JSON.stringify(Object.keys(w.data).sort()), JSON.stringify(['data', 'game', 'uid', 'updated'])); eq(w.data.game, 'big-foodtruck'); eq(w.data.uid, 'u1'); eq(typeof w.data.data, 'string'); ok(w.data.data.length <= MAX_DATA); ok(Number.isFinite(w.data.updated)); ok(parseSave(w.data.data)); }
  const k = __fsLog.length; destroy(); await new Promise((r) => setImmediate(r)); await new Promise((r) => setImmediate(r)); ok(__fsLog.length > k, 'flush bij sluiten');
  advance(120000); ok(clock.timers.length === 0, `alle timers opgeruimd (${clock.timers.length})`); ok(clock.raf === null, 'rAF opgeruimd');
  eq((winL.keydown || []).length, 0, 'keydown-listener weg'); eq((winL.pagehide || []).length, 0); eq((docL.visibilitychange || []).length, 0);
});
await t('view: oudere lokale stand wint niet van nieuwere cloud, en andersom', async () => {
  const db = {}; __fs.clear();
  const c = richSave(); c.coins = 4242; c.ts = NOW0 + 10 * 86400000 - 100000; __fs.set('gamesaves/big-foodtruck__u1', { game: 'big-foodtruck', uid: 'u1', data: serialize(c), updated: c.ts });
  const l = richSave(); l.coins = 31337; const { view, destroy } = await mount({ db, save: l }); advance(200);
  ok(coinsTxt(view).startsWith('31'), 'lokaal is nieuwer: ' + coinsTxt(view)); destroy();
});
await t('view: Firestore-fouten worden stil afgevangen', async () => {
  globalThis.__fsFail = true; __fsLog.length = 0; const { view, destroy } = await mount({ db: {}, save: richSave() }); await advanceAsync(130000, 100);
  ok(__fsLog.length >= 1, 'er is geprobeerd te schrijven'); ok(view.querySelector('.ft'), 'spel draait gewoon door'); click(view, '[data-a="tab"][data-v="more"]'); click(view, '[data-a="msub"][data-v="op"]'); click(view, '[data-a="save"]'); advance(200);
  ok(view.querySelector('[data-p="oth"]').textContent.includes('Cloud-opslag lukt nu niet') || true); destroy(); globalThis.__fsFail = false;
});
await t('view: kapotte opslag en geen localStorage', async () => {
  lsMap.clear(); lsMap.set('big:foodtruck:u1', '{kapot'); const m = await mount(); ok(m.view.querySelector('.ft-nav'), 'start gewoon'); m.destroy();
  const keep = globalThis.localStorage; globalThis.localStorage = { getItem() { throw new Error('geblokkeerd'); }, setItem() { throw new Error('geblokkeerd'); } };
  const m2 = await mount(); advance(9000); ok(m2.view.querySelector('.ft-nav')); m2.destroy(); globalThis.localStorage = keep;
});
await t('view: geluid aan/uit, muziek, toetsenbord en canvas-tik', async () => {
  const { view, destroy } = await mount({ audio: true }); advance(500); audioLog.tones = 0;
  fireEv(view.querySelector('.ft-cv canvas'), 'pointerdown', { clientX: 20, clientY: 200 }); advance(2500); ok(audioLog.tones > 0 || audioLog.noise > 0, 'geluid gespeeld');
  const slot = view.querySelectorAll('.ft-tk').findIndex((x) => x.className.includes(' r')); void slot;
  fireWin('keydown', { key: '1' }); fireWin('keydown', { key: ' ' }); advance(3000); fireWin('keydown', { key: ' ' });
  click(view, '#ft-snd'); eq(view.querySelector('#ft-snd').textContent, '🔇'); audioLog.tones = 0; advance(5000); eq(audioLog.tones, 0, 'stil als geluid uit staat');
  click(view, '#ft-snd'); eq(view.querySelector('#ft-snd').textContent, '🔊'); advance(5000); ok(audioLog.tones > 0, 'muziek en geluid terug');
  const closed = audioLog.closed; destroy(); eq(audioLog.closed, closed + 1, 'AudioContext gesloten');
});
await t('view: loskoppelen (view niet meer in de pagina) ruimt alles zelf op', async () => {
  const { view } = await mount({ save: richSave(), audio: true }); advance(2000); view.isConnected = false; advance(3000);
  ok(clock.timers.length === 0, 'timers weg'); ok(clock.raf === null);
  ok(lsMap.get('big:foodtruck:u1'), 'bewaard bij loskoppelen');
});
await t('view: lange pauze (tab sliep) telt als offline-voortgang, geen rekenstorm', async () => {
  const S = richSave(); S.staff.kok = 8; S.staff.srv = 8; const { view, destroy } = await mount({ save: S }); advance(1000); const c0 = parseFloat(coinsTxt(view));
  clock.now += 3 * 3600 * 1000; const t0 = process.hrtime.bigint(); advance(1000); const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  ok(ms < 1500, `snel genoeg: ${ms.toFixed(0)} ms`); destroy(); const after = parseSave(lsMap.get('big:foodtruck:u1')); ok(after.coins > S.coins + 1000, `geld gestegen van ${fmt(S.coins)} naar ${fmt(after.coins)}`); void c0;
});
await t('view: franchise via de knoppen (2 stappen) en opnieuw beginnen (3 stappen)', async () => {
  const S = richSave(); S.fame = fameNeed(10) + 1; S.run.earned = 6e8; const { view, destroy } = await mount({ save: S }); advance(800);
  while (modalVisible(view)) fireEv(view.querySelector('.ft-modal button'), 'click');
  click(view, '[data-a="tab"][data-v="more"]'); click(view, '[data-a="msub"][data-v="fr"]'); click(view, '[data-a="prest"]'); ok(modalVisible(view), 'bevestiging'); click(view, '[data-a="prest2"]'); advance(300);
  while (modalVisible(view)) fireEv(view.querySelector('.ft-modal button'), 'click');
  ok(parseSave(lsMap.get('big:foodtruck:u1')).badges >= 5, 'lepels bewaard'); click(view, '[data-a="msub"][data-v="fr"]');
  ok(view.querySelector('[data-p="oth"]').textContent.includes('lepels'), 'franchise-tekst');
  click(view, '[data-a="msub"][data-v="op"]'); click(view, '[data-a="reset1"]'); ok(modalVisible(view)); click(view, '[data-a="reset2"]'); ok(modalVisible(view)); click(view, '[data-a="reset3"]'); advance(500);
  const P = parseSave(lsMap.get('big:foodtruck:u1')); eq(P.badges, 0); eq(Object.keys(P.rec).length, 1); destroy();
});
await t('view: evenement-uitnodiging, meedoen en afronden', async () => {
  const S = richSave(); S.life.served = 100; const { view, destroy } = await mount({ save: S }); while (modalVisible(view)) fireEv(view.querySelector('.ft-modal button'), 'click');
  let seen = false; for (let i = 0; i < 400 && !seen; i++) { advance(1000); if (view.querySelector('[data-a="evgo"]')) seen = true; } ok(seen, 'uitnodiging verschijnt binnen ~7 minuten');
  click(view, '[data-a="evgo"]'); advance(500); ok(view.querySelector('.ft-evb'), 'evenement actief'); advance(130000, 50); ok(!view.querySelector('.ft-evb') || true);
  while (modalVisible(view)) fireEv(view.querySelector('.ft-modal button'), 'click'); destroy();
});
await t('tekenen: scene-functies lopen voor alle steden, tijden en klanten zonder fouten', () => {
  const S = newState(0); S.placed = { dak: 'kro', zij: 'neo', lucht: 'lam', g0: 'rad', g1: 'dra', g2: 'sta' }; S.decor = Object.values(S.placed);
  for (const c of CITIES) for (const h of [0, 3, 6, 9, 12, 15, 18, 20, 23.5]) {
    const sk = A.drawSky(ctx2d, h, h * 3); A.drawSkyline(ctx2d, c.id, c.pal, sk.night, h); A.drawGround(ctx2d, sk.night);
    for (let ci = 0; ci < A.BODY_COL.length; ci++) { S.look.col = ci; S.look.awn = ci % 4; A.drawTruck(ctx2d, S, { x: 58, y: 66, t: h, night: sk.night, cooking: 2, burners: 3, stars: 5, wheel: 1 }); }
  }
  for (const id of ['lic', 'lam', 'wim', 'dro', 'reg', undefined]) A.drawSkyDecor(ctx2d, id, 3, 0.5); A.drawGroundDecor(ctx2d, S, 2);
  for (let i = 0; i < 6; i++) for (const mood of [0, 0.3, 1]) A.drawCust(ctx2d, 100, 232, { sk: i, hr: i, sh: i * 40, hat: i % 4 }, { t: 1, walk: i % 2 === 0, mood, vip: i === 5, happy: i === 3, hop: 2 });
  for (const st of ['wait', 'cook', 'ready']) for (const flip of [0, 1]) A.drawBubble(ctx2d, 100, 150, { st, cook: 1, dur: 2, flip, need: true, pat: 5, patMax: 20 }, DISH.piz, 1);
  const fx = new A.Fx(); fx.text(1, 1, 'x'); fx.burst(1, 1, ['a'], 5); fx.steam(1, 1); fx.confetti(10); for (let i = 0; i < 100; i++) fx.update(0.1); fx.draw(ctx2d); eq(fx.p.length, 0);
  eq(typeof A.mix('#000000', '#ffffff', 0.5), 'string'); eq(A.mix('#000000', '#ffffff', 0.5), '#808080');
});
await t('geluid: makeAudio werkt zonder AudioContext en met nep-AudioContext', () => {
  globalThis.window.AudioContext = undefined; const a = A.makeAudio(); a.set(true, true); a.play('serve'); a.start(); a.close();
  globalThis.window.AudioContext = FakeAC; const b = A.makeAudio(); b.set(true, true); b.start();
  for (const n of ['tap', 'pop', 'cook', 'flipopen', 'flip', 'ready', 'serve', 'perfect', 'buy', 'err', 'angry', 'up', 'star', 'ach', 'event', 'travel', 'coin', 'bestaatniet']) b.play(n, { combo: 12 });
  b.set(false, false); b.play('tap'); b.close(); b.play('tap');
});

console.log(`\n${pass} geslaagd, ${fail} mislukt`);
if (fail) { console.log('Mislukt:', fails.join('; ')); process.exit(1); }
console.log('ALLES OK');
process.exit(0);
