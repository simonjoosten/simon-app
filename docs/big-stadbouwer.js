// Stadbouwer: een chille city-builder op een raster. Bouw wegen, wonen, werk, winkels, scholen, zorg, groen, vervoer, stroom en water.
// Firestore: gamesaves/big-stadbouwer__{uid} = { game:'big-stadbouwer', uid, data:<JSON-string, max 18000>, updated:ms }
// Dit bestand bevat (1) pure spellogica (ook getest in node), (2) tekenwerk op canvas, (3) de view met UI en geluid.
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

/* =====================================================================
   1. DATA EN PURE LOGICA (geen DOM)
   ===================================================================== */
export const SAVE_V = 1;
export const MAX_DATA = 18000;
export const MAX_OFFLINE = 8 * 3600;      // seconden
export const DAYLEN = 240;                // een etmaal duurt 4 minuten
export const SIZE0 = 22;
const LVM = [0, 1, 1.8, 3.2];             // schaal per gebouwniveau
const TAXPER = 0.05;
const ESC = 0.07;                         // elk gebouw maakt nieuwe gebouwen 10% duurder                       // belasting per inwoner per seconde bij 10%
const INC = 0.4;                          // algemene afstelling van de economie (zie tools/test)
const FUND = 1.0;                         // gemeentefonds: altijd inkomen, dus nooit vastlopen
const STAR_MULT = 0.08;

export const CATS = [
  { id: 'weg', n: 'Wegen', e: '🛣️' }, { id: 'wonen', n: 'Wonen', e: '🏠' }, { id: 'werk', n: 'Werk', e: '🏭' },
  { id: 'winkel', n: 'Winkels', e: '🏪' }, { id: 'zorg', n: 'Voorzieningen', e: '🏫' }, { id: 'groen', n: 'Groen & fun', e: '🌳' },
  { id: 'ov', n: 'Vervoer', e: '🚌' }, { id: 'nuts', n: 'Stroom & water', e: '⚡' },
];

// k = soort (voor dekking), r = bereik in tegels, u = onderhoud per seconde, c = bouwkosten, unl = ontgrendeld vanaf inwoners
export const BD = {};
const def = (ch, o) => { BD[ch] = { ch, u: 0, unl: 0, r: 0, ...o }; };
def('r', { n: 'Weg', e: '🛣️', cat: 'weg', c: 5, u: 0.02, d: 'Gebouwen hebben een weg ernaast nodig. Sleep om snel te bouwen.' });
def('t', { n: 'Boom', e: '🌳', cat: 'groen', c: 3, k: 'tree', noRoad: 1, d: 'Mooi en rustig. Bomen maken buren blij.' });
def('h', { n: 'Huisje', e: '🏠', cat: 'wonen', c: 30, res: 4, d: 'Plek voor 4 inwoners.' });
def('j', { n: 'Rijtjeshuizen', e: '🏘️', cat: 'wonen', c: 110, res: 12, unl: 25, d: 'Plek voor 12 inwoners.' });
def('f', { n: 'Flat', e: '🏢', cat: 'wonen', c: 380, res: 40, unl: 120, d: 'Plek voor 40 inwoners.' });
def('k', { n: 'Woontoren', e: '🏙️', cat: 'wonen', c: 1700, res: 120, unl: 500, d: 'Plek voor 120 inwoners.' });
def('v', { n: 'Villa', e: '🏡', cat: 'wonen', c: 320, res: 6, taxm: 3.2, unl: 200, d: 'Weinig bewoners, maar rijke: veel belasting.' });
def('b', { n: 'Boerderij', e: '🌾', cat: 'werk', c: 55, jobs: 5, inc: 0.05, unl: 0, d: '5 banen, schoon en rustig.' });
def('a', { n: 'Werkplaats', e: '🔧', cat: 'werk', c: 60, jobs: 8, inc: 0.06, poll: 0.4, unl: 6, d: '8 banen.' });
def('i', { n: 'Fabriek', e: '🏭', cat: 'werk', c: 300, jobs: 36, inc: 0.08, poll: 1.2, unl: 80, d: '36 banen, maar vervuilt de buurt.' });
def('o', { n: 'Kantoor', e: '🏦', cat: 'werk', c: 1000, jobs: 80, inc: 0.12, edu: 1, unl: 300, d: '80 banen. Beter met scholen.' });
def('C', { n: 'Techcampus', e: '💻', cat: 'werk', c: 4800, jobs: 220, inc: 0.2, edu: 1, unl: 1200, d: '220 banen voor slimme koppen.' });
def('m', { n: 'Kiosk', e: '🏪', cat: 'winkel', c: 45, shop: 25, rev: 0.035, k: 'shop', r: 5, unl: 8, d: 'Kleine winkel voor 25 klanten.' });
def('n', { n: 'Supermarkt', e: '🛒', cat: 'winkel', c: 240, shop: 100, rev: 0.035, k: 'shop', r: 8, unl: 60, d: 'Winkel voor 100 klanten.' });
def('e', { n: 'Café', e: '🍽️', cat: 'winkel', c: 170, shop: 45, rev: 0.06, k: 'shop', r: 6, unl: 150, d: 'Gezellig, 45 klanten.' });
def('q', { n: 'Winkelcentrum', e: '🛍️', cat: 'winkel', c: 1250, shop: 380, rev: 0.04, k: 'shop', r: 10, unl: 250, d: 'Winkel voor 380 klanten.' });
def('c', { n: 'School', e: '🏫', cat: 'zorg', c: 210, u: 0.5, k: 'school', r: 7, edu: 120, unl: 40, d: 'Onderwijs voor de buurt.' });
def('l', { n: 'Bibliotheek', e: '📚', cat: 'zorg', c: 300, u: 0.4, k: 'culture', r: 6, edu: 40, unl: 200, d: 'Rustig, slim en gezellig.' });
def('z', { n: 'Ziekenhuis', e: '🏥', cat: 'zorg', c: 650, u: 2, k: 'health', r: 10, unl: 100, d: 'Zorg voor een groot gebied.' });
def('p', { n: 'Brandweer', e: '🚒', cat: 'zorg', c: 340, u: 1, k: 'fire', r: 9, unl: 50, d: 'Blust branden automatisch.' });
def('g', { n: 'Park', e: '🌳', cat: 'groen', c: 40, u: 0.1, k: 'green', r: 4, noRoad: 1, d: 'Frisse lucht en blije buren.' });
def('d', { n: 'Speeltuin', e: '🛝', cat: 'groen', c: 95, u: 0.15, k: 'green', r: 5, unl: 40, d: 'Kinderen vinden het fantastisch.' });
def('F', { n: 'Fontein', e: '⛲', cat: 'groen', c: 190, u: 0.2, k: 'green', r: 6, noRoad: 1, tour: 5, unl: 150, d: 'Een mooi plein met water.' });
def('S', { n: 'Stadion', e: '🏟️', cat: 'groen', c: 1900, u: 3, k: 'fun', r: 14, tour: 120, unl: 600, d: 'Sport en veel bezoekers.' });
def('P', { n: 'Pretpark', e: '🎡', cat: 'groen', c: 5200, u: 6, k: 'fun', r: 16, tour: 420, unl: 1500, d: 'Het hoogtepunt van je stad.' });
def('B', { n: 'Bushalte', e: '🚏', cat: 'ov', c: 75, u: 0.3, k: 'transit', r: 6, transit: 60, unl: 30, d: 'Haalt auto\'s van de weg.' });
def('X', { n: 'Treinstation', e: '🚉', cat: 'ov', c: 950, u: 1.5, k: 'transit', r: 12, transit: 400, unl: 300, d: 'Veel minder files.' });
def('W', { n: 'Windmolen', e: '🌬️', cat: 'nuts', c: 90, u: 0.1, pwr: 14, noRoad: 1, d: 'Schone stroom (14).' });
def('Z', { n: 'Zonnepark', e: '☀️', cat: 'nuts', c: 400, u: 0.15, pwr: 45, noRoad: 1, unl: 100, d: 'Schone stroom (45).' });
def('E', { n: 'Centrale', e: '⚡', cat: 'nuts', c: 1050, u: 2, pwr: 180, poll: 2, noRoad: 1, unl: 300, d: 'Veel stroom (180), maar vervuilt.' });
def('A', { n: 'Waterpomp', e: '🚰', cat: 'nuts', c: 75, u: 0.1, wat: 14, noRoad: 1, d: 'Schoon water (14).' });
def('L', { n: 'Watertoren', e: '🗼', cat: 'nuts', c: 440, u: 0.3, wat: 60, noRoad: 1, unl: 100, d: 'Water voor een wijk (60).' });
def('R', { n: 'Zuivering', e: '💧', cat: 'nuts', c: 1400, u: 1, wat: 220, noRoad: 1, unl: 400, d: 'Water voor een stad (220).' });
def('H', { n: 'Stadhuis', e: '🏛️', cat: 'x', c: 0, pwr: 6, wat: 6, noRoad: 1, fixed: 1, d: 'Het hart van je stad.' });
export const BUILDABLE = Object.keys(BD).filter((c) => !BD[c].fixed);
const RESIDENTIAL = 'hjfkv', JOBCH = 'baioC', SHOPCH = 'mneq';

export const UPG = [
  { id: 'bld', n: 'Bouwploeg', e: '👷', d: '5% goedkoper bouwen per niveau', base: 45, g: 2.1, max: 8 },
  { id: 'tax', n: 'Belastingdienst', e: '🧾', d: '+8% belastinginkomsten per niveau', base: 90, g: 2.2, max: 10 },
  { id: 'biz', n: 'Handelsverdrag', e: '🤝', d: '+10% opbrengst van werk en winkels', base: 130, g: 2.2, max: 10 },
  { id: 'hap', n: 'Groene stad', e: '🌿', d: '+3 blijdschap voor iedereen', base: 180, g: 2.3, max: 6 },
  { id: 'eff', n: 'Slim beheer', e: '🧠', d: '6% minder onderhoudskosten', base: 160, g: 2.2, max: 8 },
  { id: 'net', n: 'Slimme netten', e: '🔌', d: '+10% stroom en water', base: 220, g: 2.3, max: 8 },
  { id: 'fire', n: 'Brandpreventie', e: '🧯', d: 'Minder branden en groter bereik', base: 200, g: 2.3, max: 5 },
  { id: 'grow', n: 'Welkomstpakket', e: '🧳', d: 'Nieuwe inwoners komen sneller', base: 150, g: 2.2, max: 8 },
  { id: 'off', n: 'Nachtploeg', e: '🌙', d: 'Meer verdienen als je weg bent (+10%)', base: 260, g: 2.4, max: 5 },
];
export const PERKS = [
  { id: 'start', n: 'Startkapitaal', e: '💰', d: '+250 startgeld per niveau', max: 10 },
  { id: 'speed', n: 'Snelle groei', e: '🚀', d: '+15% sneller nieuwe inwoners', max: 8 },
  { id: 'map', n: 'Grotere kaart', e: '🗺️', d: '+2 tegels breed en hoog (max 32)', max: 5 },
  { id: 'disc', n: 'Bouwkorting', e: '🏷️', d: '4% goedkoper bouwen per niveau', max: 8 },
];
export const upgCost = (u, lvl) => Math.round(u.base * Math.pow(u.g, lvl));
export const perkCost = (lvl) => lvl + 2;

const rngMake = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
export const mapSize = (perks) => Math.min(32, SIZE0 + 2 * ((perks && perks.map) || 0));

export function genTerrain(seed, N) {
  const r = rngMake(seed), p = [r() * 6.28, r() * 6.28, r() * 6.28, r() * 6.28], c = (N - 1) / 2, g = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const d = Math.hypot(x - c, y - c);
    const v = Math.sin(x * 0.33 + p[0]) * Math.cos(y * 0.29 + p[1]) + 0.6 * Math.sin((x + y) * 0.21 + p[2]);
    let ch = '.';
    if (d > 5.5 && (v > 1.02 || (d > N * 0.42 && v > 0.62))) ch = 'w';
    else if (d > 3.2 && (r() < 0.07 || (Math.sin(x * 0.5 + p[3]) * Math.sin(y * 0.45 + p[0]) > 0.5 && r() < 0.6))) ch = 't';
    g.push(ch);
  }
  return g;
}

export function newCity(seed, meta = {}) {
  const perks = meta.perks || {}, N = mapSize(perks), g = genTerrain(seed, N), cx = Math.floor(N / 2), cy = Math.floor(N / 2);
  g[cy * N + cx] = 'H';
  for (let x = cx - 3; x <= cx + 3; x++) g[(cy + 1) * N + x] = 'r';
  for (let dy = -2; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const i = (cy + dy) * N + cx + dx; if (g[i] === 'w' || g[i] === 't') g[i] = '.'; }
  const stars = meta.stars || 0;
  return {
    v: SAVE_V, seed, size: N, g, lv: g.map(() => 1), money: 160 + 250 * (perks.start || 0), pop: 0, peak: 0, maxPeak: meta.maxPeak || 0, clock: 100,
    tax: 10, stars, spent: meta.spent || 0, perks: { ...perks }, up: {}, ach: meta.ach ? [...meta.ach] : [], goal: 0, daily: meta.daily || { d: '', s: 0 },
    tut: meta.tut != null ? meta.tut : 0, snd: meta.snd != null ? meta.snd : 1, last: Date.now(), earned: 0, fs: meta.fs || 0, ft: meta.ft || 0,
    prest: meta.prest || 0, land: 0, proj: meta.proj ? { ...meta.proj } : {}, deb: [], built: 0, cityNo: (meta.cityNo || 0) + 1, ev: {}, tot: meta.tot || 0,
  };
}

/* ---------- opslag ---------- */
export function serialize(S) {
  const o = {
    v: SAVE_V, s: S.seed, n: S.size, g: S.g.join(''), l: S.lv.join(''), m: Math.floor(S.money), p: Math.round(S.pop * 10) / 10, pk: Math.floor(S.peak), mp: Math.floor(S.maxPeak),
    c: Math.floor(S.clock), tx: S.tax, st: S.stars, sp: S.spent, pf: S.perks, up: S.up, a: S.ach, go: S.goal, dl: S.daily, tu: S.tut, sn: S.snd ? 1 : 0, la: S.last,
    e: Math.floor(S.earned), fs: S.fs, ft: S.ft, pr: S.prest, ld: S.land, pj: S.proj, d: S.deb, b: S.built, cn: S.cityNo, to: Math.floor(S.tot),
  };
  const s = JSON.stringify(o);
  return s.length > MAX_DATA ? JSON.stringify({ ...o, a: o.a.slice(0, 20) }) : s;
}
export function deserialize(str) {
  let o; try { o = JSON.parse(str); } catch (e) { return null; }
  if (!o || typeof o !== 'object' || typeof o.g !== 'string' || !o.n) return null;
  const N = o.n | 0;
  if (N < 8 || N > 40 || o.g.length !== N * N) return null;
  const g = o.g.split('').map((c) => (c === '.' || c === 'w' || c === 'x' || BD[c] ? c : '.'));
  const lvs = String(o.l || '').padEnd(N * N, '1').split('').map((c) => Math.min(3, Math.max(1, +c || 1)));
  const num = (v, d) => (Number.isFinite(+v) ? +v : d);
  return {
    v: SAVE_V, seed: num(o.s, 1), size: N, g, lv: lvs, money: Math.max(0, num(o.m, 0)), pop: Math.max(0, num(o.p, 0)), peak: num(o.pk, 0), maxPeak: Math.max(num(o.mp, 0), num(o.pk, 0)),
    clock: num(o.c, 60), tax: Math.min(20, Math.max(5, num(o.tx, 10))), stars: num(o.st, 0), spent: num(o.sp, 0), perks: o.pf && typeof o.pf === 'object' ? o.pf : {},
    up: o.up && typeof o.up === 'object' ? o.up : {}, ach: Array.isArray(o.a) ? o.a.filter((x) => typeof x === 'string') : [], goal: num(o.go, 0),
    daily: o.dl && typeof o.dl === 'object' ? { d: String(o.dl.d || ''), s: num(o.dl.s, 0) } : { d: '', s: 0 }, tut: num(o.tu, 0), snd: o.sn === 0 ? 0 : 1, last: num(o.la, Date.now()),
    earned: num(o.e, 0), fs: num(o.fs, 0), ft: num(o.ft, 0), prest: num(o.pr, 0), land: Math.max(0, num(o.ld, 99)), proj: o.pj && typeof o.pj === 'object' ? o.pj : {}, deb: Array.isArray(o.d) ? o.d.filter((i) => i >= 0 && i < N * N) : [], built: num(o.b, 0), cityNo: num(o.cn, 1),
    ev: {}, tot: num(o.to, 0),
  };
}
// kies de nieuwste van twee opgeslagen {data, updated}
export function pickNewest(a, b) {
  const ok = (x) => x && typeof x.data === 'string' && deserialize(x.data);
  const A = ok(a) ? a : null, B = ok(b) ? b : null;
  if (A && B) return (A.updated || 0) >= (B.updated || 0) ? A : B;
  return A || B;
}

/* ---------- hulpfuncties ---------- */
export const xy = (S, i) => [i % S.size, Math.floor(i / S.size)];
export const unlockPop = (S) => Math.max(S.peak || 0, (S.maxPeak || 0) * 0.5);
export const isUnlocked = (S, ch) => !!BD[ch] && (BD[ch].unl || 0) <= unlockPop(S);
export function countOf(S, ch) { let n = 0; for (const c of S.g) if (c === ch) n++; return n; }
export function countBuildings(S) { let n = 0; for (const c of S.g) if (BD[c] && c !== 'r' && c !== 't' && c !== 'H') n++; return n; }
export const buildCost = (S, ch) => {
  const B = BD[ch], disc = Math.min(0.7, 0.05 * (S.up.bld || 0) + 0.04 * (S.perks.disc || 0));
  const esc = ch === 'r' || ch === 't' ? 1 : 1 + ESC * countBuildings(S);
  return Math.max(1, Math.round(B.c * esc * (1 - disc)));
};
export const upgradeCost = (S, i) => {
  const ch = S.g[i], B = BD[ch], lv = S.lv[i], disc = Math.min(0.7, 0.05 * (S.up.bld || 0) + 0.04 * (S.perks.disc || 0));
  return Math.round(B.c * (lv === 1 ? 2 : 4.5) * (1 - disc));
};
export const canUpgrade = (S, i) => {
  const ch = S.g[i], B = BD[ch];
  if (!B || B.fixed || ch === 't' || S.lv[i] >= 3) return { ok: false, why: 'Dit gebouw is al op zijn best.' };
  if (unlockPop(S) < (S.lv[i] === 1 ? 50 : 400)) return { ok: false, why: `Upgraden kan vanaf ${S.lv[i] === 1 ? 50 : 400} inwoners.` };
  const c = upgradeCost(S, i); if (S.money < c) return { ok: false, why: 'Te weinig geld.', cost: c };
  return { ok: true, cost: c };
};
export const projCount = (S) => Object.keys(S.proj || {}).length;
export const starMult = (S) => (1 + STAR_MULT * (S.stars || 0)) * (1 + 0.15 * projCount(S));
// grond: je mag bouwen binnen straal R (in tegels) rond het midden; je koopt steeds een nieuwe ring
export const landR = (S) => 5 + 2 * S.land;
export const maxLand = (S) => Math.max(0, Math.ceil((S.size / 2 - 5) / 2));
export const landCost = (S) => Math.round(500 * Math.pow(3.2, S.land));
export function inLand(S, i) {
  const N = S.size, c = Math.floor(N / 2), x = i % N, y = (i / N) | 0, R = landR(S);
  return Math.abs(x - c) <= R && Math.abs(y - c) <= R;
}
export function buyLand(S) {
  if (S.land >= maxLand(S)) return { ok: false, why: 'Je bezit al de hele kaart.' };
  const c = landCost(S); if (S.money < c) return { ok: false, why: 'Te weinig geld.', cost: c };
  S.money -= c; S.land++; return { ok: true, cost: c };
}
export const PROJECTS = [
  { id: 'expo', n: 'Wereldtentoonstelling', e: '🎪', cost: 25000, d: '+15% op alle inkomsten, voor altijd' },
  { id: 'hsl', n: 'Hogesnelheidslijn', e: '🚄', cost: 120000, d: '+15% op alle inkomsten, voor altijd' },
  { id: 'toren', n: 'Reuzentoren', e: '🗼', cost: 600000, d: '+15% op alle inkomsten, voor altijd' },
  { id: 'haven', n: 'Zeehaven', e: '🚢', cost: 3000000, d: '+15% op alle inkomsten, voor altijd' },
  { id: 'ruimte', n: 'Ruimtehaven', e: '🚀', cost: 15000000, d: '+15% op alle inkomsten, voor altijd' },
  { id: 'maan', n: 'Maanbasis', e: '🌙', cost: 75000000, d: '+15% op alle inkomsten, voor altijd' },
];
export function buyProject(S, id) {
  const p = PROJECTS.find((x) => x.id === id); if (!p || S.proj[id]) return { ok: false, why: 'Al gebouwd.' };
  if (S.money < p.cost) return { ok: false, why: 'Te weinig geld.', cost: p.cost };
  S.money -= p.cost; S.proj[id] = 1; return { ok: true, cost: p.cost };
}

/* ---------- bouwen en slopen ---------- */
export function canPlace(S, i, ch) {
  const B = BD[ch]; if (!B || B.fixed) return { ok: false, why: 'Onbekend gebouw.' };
  if (i < 0 || i >= S.g.length) return { ok: false, why: 'Buiten de kaart.' };
  if (!isUnlocked(S, ch)) return { ok: false, why: `Nog niet ontgrendeld (${B.unl} inwoners).` };
  const cur = S.g[i];
  if (cur === 'w') return { ok: false, why: 'Dat is water.' };
  if (!inLand(S, i)) return { ok: false, why: 'Dit stuk grond is nog niet van jou. Koop het in het Plan-tabblad.' };
  if (cur !== '.' && cur !== 't' && cur !== 'x') return { ok: false, why: 'Hier staat al iets.' };
  if (cur === 't' && ch === 't') return { ok: false, why: 'Hier staat al een boom.' };
  const cost = buildCost(S, ch) + (cur === 't' ? 4 : 0);
  if (S.money < cost) return { ok: false, why: 'Te weinig geld.', cost };
  return { ok: true, cost };
}
export function place(S, i, ch) {
  const r = canPlace(S, i, ch); if (!r.ok) return r;
  S.money -= r.cost; S.g[i] = ch; S.lv[i] = 1; S.built++;
  const k = S.deb.indexOf(i); if (k >= 0) S.deb.splice(k, 1);
  return r;
}
export function bulldoze(S, i) {
  const ch = S.g[i], B = BD[ch];
  if (ch === 'x' || ch === 't') { S.g[i] = '.'; S.lv[i] = 1; return { ok: true, refund: 0 }; }
  if (!B || B.fixed) return { ok: false, why: ch === 'w' ? 'Dat is water.' : (ch === 'H' ? 'Het stadhuis blijft staan.' : 'Hier is niets te slopen.') };
  const refund = Math.floor(B.c * 0.5 * LVM[S.lv[i]] * 0.8);
  S.money += refund; S.g[i] = '.'; S.lv[i] = 1;
  return { ok: true, refund };
}
export function upgradeBuilding(S, i) {
  const r = canUpgrade(S, i); if (!r.ok) return r;
  S.money -= r.cost; S.lv[i]++; return r;
}
export const upLevels = (S) => Object.values(S.up || {}).reduce((a, b) => a + (b | 0), 0);
export function buyUp(S, id) {
  const u = UPG.find((x) => x.id === id); if (!u) return { ok: false, why: 'Onbekend.' };
  const l = S.up[id] || 0; if (l >= u.max) return { ok: false, why: 'Maximaal.' };
  const c = upgCost(u, l); if (S.money < c) return { ok: false, why: 'Te weinig geld.', cost: c };
  S.money -= c; S.up[id] = l + 1; return { ok: true, cost: c };
}
export function buyPerk(S, id) {
  const p = PERKS.find((x) => x.id === id); if (!p) return { ok: false, why: 'Onbekend.' };
  const l = S.perks[id] || 0; if (l >= p.max) return { ok: false, why: 'Maximaal.' };
  const c = perkCost(l); if ((S.stars - S.spent) < c) return { ok: false, why: 'Te weinig sterren.', cost: c };
  S.spent += c; S.perks[id] = l + 1; return { ok: true, cost: c };
}

/* ---------- de rekenkern: alle statistieken van de stad ---------- */
export function calc(S) {
  const N = S.size, g = S.g, lv = S.lv, up = S.up || {}, ev = S.ev || {};
  const cnt = {}, svc = { green: [], school: [], health: [], fire: [], culture: [], transit: [], shop: [], fun: [] };
  const R = [], J = [], SH = [], PO = [], disc = [];
  let pwr = 0, wat = 0, upk = 0, roads = 0, roadCap = 0, jobs = 0, shopCap = 0, edu = 0, transit = 0, tour = 0, health = 0;
  const treeAt = new Uint8Array(N * N);
  const adj = (x, y) => (x > 0 && g[y * N + x - 1] === 'r') || (x < N - 1 && g[y * N + x + 1] === 'r') || (y > 0 && g[(y - 1) * N + x] === 'r') || (y < N - 1 && g[(y + 1) * N + x] === 'r');
  const storm = ev.storm > 0 ? 2.2 : 1, drought = ev.drought > 0 ? 0.65 : 1, nets = 1 + 0.1 * (up.net || 0);
  for (let i = 0; i < N * N; i++) {
    const ch = g[i], B = BD[ch]; if (!B) continue;
    cnt[ch] = (cnt[ch] || 0) + 1;
    const x = i % N, y = (i / N) | 0, m = LVM[lv[i]];
    if (ch === 't') { treeAt[i] = 1; continue; }
    if (ch === 'r') { roads++; roadCap += 8 * m; upk += B.u * m; continue; }
    upk += B.u * Math.pow(m, 0.8);
    if (B.pwr) pwr += B.pwr * m * nets * (ch === 'W' ? storm : 1);
    if (B.wat) wat += B.wat * m * nets * drought;
    const conn = B.noRoad || adj(x, y);
    if (!conn) { disc.push(i); continue; }
    const rr = B.r ? B.r + (lv[i] - 1) + (ch === 'p' ? 0.7 * (up.fire || 0) : 0) : 0;
    if (B.res) R.push({ i, x, y, cap: B.res * m, taxm: B.taxm || 1 });
    if (B.jobs) { J.push({ i, jobs: B.jobs * m, inc: B.inc, edu: B.edu }); jobs += B.jobs * m; }
    if (B.shop) { SH.push({ cap: B.shop * m, rev: B.rev }); shopCap += B.shop * m; }
    if (B.edu && B.k) edu += B.edu * m;
    if (B.k === 'health') health += m;
    if (B.transit) transit += B.transit * m;
    if (B.tour) tour += B.tour * m;
    if (B.poll) PO.push({ x, y, p: B.poll * m });
    if (B.k && svc[B.k]) svc[B.k].push({ x, y, r2: rr * rr });
  }
  const pop = S.pop, workers = pop * 0.6, nsv = svc.school.length + svc.health.length + svc.fire.length + svc.culture.length + svc.transit.length + svc.fun.length + svc.shop.length;
  const demP = pop * 0.08 + jobs * 0.05 + nsv * 0.8, demW = pop * 0.07 + jobs * 0.03 + nsv * 0.4;
  const pr = demP > 0 ? Math.min(1, pwr / demP) : 1, wr = demW > 0 ? Math.min(1, wat / demW) : 1;
  const employed = Math.min(workers, jobs), unemp = workers > 0 ? Math.max(0, 1 - jobs / workers) : 0;
  const eduNeed = pop * 0.25, eduR = eduNeed > 0 ? Math.min(1, edu / eduNeed) : 1;
  // verkeer
  const load = employed * 0.8 + pop * 0.25 + tour * 0.2, eff = Math.max(load * 0.4, load - transit);
  const ti = roadCap > 0 ? eff / roadCap : (load > 0 ? 3 : 0), pen = Math.min(1.2, Math.max(0, ti - 0.9));
  // globale blijdschap
  const rate = S.tax;
  const crunchPrev = S.money < 0.5 && S.lastNet < 0;
  const moodEv = (ev.fest > 0 ? 10 : 0) - (ev.bad > 0 ? 6 : 0);
  let gadj = -40 * (1 - pr) - 40 * (1 - wr) - (pop > 15 ? 26 * unemp : 0) - (rate > 10 ? (rate - 10) * 3 : -(10 - rate) * 1.5)
    - 22 * Math.min(1, pen) + 3 * (up.hap || 0) + moodEv - (crunchPrev ? 10 : 0);
  gadj = Math.round(gadj * 100) / 100;
  // per woning
  let capSum = 0, hSum = 0, target = 0, capAll = 0, taxmSum = 0;
  const hm = new Float32Array(N * N);
  const near = (arr, x, y) => { let n = 0; for (const s of arr) { const dx = s.x - x, dy = s.y - y; if (dx * dx + dy * dy <= s.r2) n++; } return n; };
  const debS = new Set(S.deb || []);
  for (const r of R) {
    let h = 52;
    const gr = near(svc.green, r.x, r.y); if (gr) h += Math.min(16, 10 + 3 * (gr - 1));
    if (near(svc.school, r.x, r.y)) h += 9;
    if (near(svc.health, r.x, r.y)) h += 10;
    if (near(svc.fire, r.x, r.y)) h += 8;
    if (near(svc.culture, r.x, r.y)) h += 6;
    if (near(svc.shop, r.x, r.y)) h += 9;
    if (near(svc.transit, r.x, r.y)) h += 4;
    if (near(svc.fun, r.x, r.y)) h += 8;
    let tr = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = r.x + dx, yy = r.y + dy; if (xx >= 0 && yy >= 0 && xx < N && yy < N) tr += treeAt[yy * N + xx]; }
    h += Math.min(6, tr);
    for (const p of PO) { const d = Math.hypot(p.x - r.x, p.y - r.y); if (d < 7) h -= p.p * (1 - d / 7) * 8; }
    if (debS.size) for (const di of debS) { if (Math.abs((di % N) - r.x) <= 3 && Math.abs(((di / N) | 0) - r.y) <= 3) h -= 4; }
    h = Math.max(0, Math.min(100, h));
    hm[r.i] = h;
    const hh = h + gadj;
    const attract = Math.min(1, Math.max(0.25, 0.25 + (hh - 30) / 50));
    capAll += r.cap; hSum += h * r.cap; target += r.cap * attract; taxmSum += r.taxm * r.cap;
  }
  const avgH = capAll > 0 ? hSum / capAll : 50;
  const happy = Math.max(0, Math.min(100, avgH + gadj));
  const avgTaxM = capAll > 0 ? taxmSum / capAll : 1;
  // inkomen
  const pm = starMult(S), hmul = 0.6 + 0.8 * (happy / 100), ut = 0.3 + 0.7 * Math.min(pr, wr), cp = 1 - 0.15 * Math.min(1, pen);
  const festM = ev.fest > 0 ? 1.25 : 1;
  const taxBase = 0.45 * pop + 0.9 * employed;
  const tax = taxBase * TAXPER * (rate / 10) * hmul * avgTaxM * (1 + 0.08 * (up.tax || 0));
  const filled = jobs > 0 ? Math.min(1, workers / jobs) : 0;
  let jobInc = 0; for (const j of J) jobInc += j.jobs * j.inc * filled * (j.edu ? 0.5 + 0.5 * eduR : 1) * ut;
  const demand = pop * 0.9 + tour, sFill = shopCap > 0 ? Math.min(1, demand / shopCap) : 0;
  let shopInc = 0; for (const s of SH) shopInc += s.cap * s.rev * sFill * ut;
  const tourInc = (shopCap > 0 || tour > 0 ? tour * 0.06 : 0);
  const biz = (jobInc + shopInc + tourInc) * (1 + 0.1 * (up.biz || 0)) * cp;
  const inc = INC + (1 - INC) * Math.exp(-pop / 120);   // vroeg ruimer, later strakker
  const taxI = tax * pm * festM * inc, bizI = biz * pm * festM * inc;
  const income = FUND + taxI + bizI;
  const upkeep = upk * 0.6 * Math.max(0.2, 1 - 0.06 * (up.eff || 0));
  const net = income - upkeep;
  return {
    cnt, pop, cap: capAll, target, happy, avgH, gadj, pwr, wat, demP, demW, pr, wr, jobs, workers, employed, unemp, edu, eduR, eduNeed, health, transit, tour, load, ti, roads, roadCap,
    tax, taxI, bizI, jobInc, shopInc, tourInc, biz, income, upkeep, net, fund: FUND, shopCap, sFill, disc, hm, svc, crunch: crunchPrev, pm, nres: R.length,
  };
}

/* ---------- tijdstap ---------- */
export function step(S, dt, o = {}) {
  const st = calc(S), eff = o.eff == null ? 1 : o.eff;
  const gs = (1 + 0.15 * (S.perks.speed || 0)) * (1 + 0.1 * (S.up.grow || 0));
  const gap = st.target - S.pop;
  if (gap > 0) S.pop += Math.min(gap, gap * (1 - Math.exp(-dt * gs / 25)) + 0.05 * dt * gs);
  else S.pop += gap * (1 - Math.exp(-dt / 70));
  let gain = st.net * dt * eff;
  if (S.money + gain < 0) gain = -S.money + FUND * 0.5 * dt * eff;
  S.money += gain; S.lastNet = st.net;
  if (st.income > 0) S.earned += st.income * dt * eff;
  S.tot += Math.max(0, gain);
  if (!o.offline) S.clock += dt;
  if (S.pop > S.peak) S.peak = S.pop;
  if (S.peak > S.maxPeak) S.maxPeak = S.peak;
  return st;
}
export const offlineEff = (S) => Math.min(1, 0.5 + 0.1 * (S.up.off || 0));
export function offlineProgress(S, secs) {
  secs = Math.max(0, Math.min(MAX_OFFLINE, secs));
  const m0 = S.money, p0 = S.pop; let left = secs;
  const eff = offlineEff(S);
  while (left > 0.5) { const dt = Math.min(left, 90); step(S, dt, { eff, offline: true }); left -= dt; }
  return { secs, gain: S.money - m0, pop: S.pop - p0, eff };
}

/* ---------- prestige ---------- */
export const starsFor = (S) => Math.floor(Math.sqrt(Math.max(0, S.peak) / 40));
export const PRESTIGE_MIN = 600;
export const canPrestige = (S) => S.peak >= PRESTIGE_MIN;
export function prestige(S, seed) {
  const gain = starsFor(S);
  const n = newCity(seed, {
    stars: S.stars + gain, spent: S.spent, perks: S.perks, maxPeak: S.maxPeak, ach: S.ach, daily: S.daily, tut: S.tut, snd: S.snd, fs: S.fs, ft: S.ft,
    prest: S.prest + 1, cityNo: S.cityNo, tot: S.tot, proj: S.proj,
  });
  return { S: n, gain };
}

/* ---------- dagelijkse beloning ---------- */
const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const shiftDay = (k, n) => { const [y, m, d] = k.split('-').map(Number); const t = new Date(y, m - 1, d + n, 12); return dayKey(t); };
export function dailyInfo(S, now = new Date()) {
  const today = dayKey(now), d = S.daily || { d: '', s: 0 };
  const can = d.d !== today;
  const streak = d.d === shiftDay(today, -1) ? d.s : (d.d === today ? d.s : 0);
  const next = can ? Math.min(7, streak + 1) : Math.min(7, streak);
  const reward = Math.round((120 + Math.min(S.peak, 5000) * 2.5 + S.stars * 50) * (1 + 0.25 * (next - 1)));
  return { can, streak, next, reward, today };
}
export function claimDaily(S, now = new Date()) {
  const i = dailyInfo(S, now); if (!i.can) return null;
  S.daily = { d: i.today, s: i.next }; S.money += i.reward; S.tot += i.reward; return i;
}

/* ---------- doelen en prestaties ---------- */
const nC = (st, chs) => chs.split('').reduce((a, c) => a + (st.cnt[c] || 0), 0);
export const GOALS = [
  { t: 'Bouw 2 huisjes', e: '🏠', r: 40, f: (S, st) => [nC(st, 'h'), 2] },
  { t: 'Haal 6 inwoners naar je stad', e: '👥', r: 40, f: (S) => [Math.floor(S.pop), 6] },
  { t: 'Bouw een boerderij of werkplaats', e: '🔧', r: 50, f: (S, st) => [nC(st, 'ba'), 1] },
  { t: 'Zet een windmolen neer', e: '🌬️', r: 50, f: (S, st) => [nC(st, 'W'), 1] },
  { t: 'Bouw een kiosk', e: '🏪', r: 60, f: (S, st) => [nC(st, 'm'), 1] },
  { t: 'Leg een park aan', e: '🌳', r: 60, f: (S, st) => [nC(st, 'g'), 1] },
  { t: 'Koop je eerste stadsplan-upgrade', e: '⬆️', r: 90, f: (S) => [upLevels(S), 1] },
  { t: 'Bereik 25 inwoners', e: '👥', r: 150, f: (S) => [Math.floor(S.pop), 25] },
  { t: 'Bouw een waterpomp', e: '🚰', r: 120, f: (S, st) => [nC(st, 'ALR'), 1] },
  { t: 'Bouw een school', e: '🏫', r: 220, f: (S, st) => [nC(st, 'c'), 1] },
  { t: 'Bouw een brandweerkazerne', e: '🚒', r: 260, f: (S, st) => [nC(st, 'p'), 1] },
  { t: 'Bereik 60 inwoners', e: '👥', r: 400, f: (S) => [Math.floor(S.pop), 60] },
  { t: 'Bouw 3 parken of speeltuinen', e: '🛝', r: 450, f: (S, st) => [nC(st, 'gd'), 3] },
  { t: 'Zet een bushalte neer', e: '🚏', r: 400, f: (S, st) => [nC(st, 'B'), 1] },
  { t: 'Bereik 120 inwoners', e: '👥', r: 900, f: (S) => [Math.floor(S.pop), 120] },
  { t: 'Bouw een ziekenhuis', e: '🏥', r: 900, f: (S, st) => [nC(st, 'z'), 1] },
  { t: 'Blijdschap 75+ met minstens 80 inwoners', e: '😊', r: 1100, f: (S, st) => [S.pop >= 80 ? Math.floor(st.happy) : 0, 75] },
  { t: 'Upgrade een gebouw naar niveau 2', e: '⭐', r: 1000, f: (S) => [S.lv.some((l) => l >= 2) ? 1 : 0, 1] },
  { t: 'Bereik 250 inwoners', e: '👥', r: 3000, f: (S) => [Math.floor(S.pop), 250] },
  { t: 'Bouw een flat', e: '🏢', r: 1800, f: (S, st) => [nC(st, 'f'), 1] },
  { t: 'Verdien netto +30 per seconde', e: '💰', r: 2500, f: (S, st) => [Math.floor(st.net), 30] },
  { t: 'Bouw een fabriek', e: '🏭', r: 2200, f: (S, st) => [nC(st, 'i'), 1] },
  { t: 'Bereik 500 inwoners', e: '👥', r: 9000, f: (S) => [Math.floor(S.pop), 500] },
  { t: 'Bouw een treinstation', e: '🚉', r: 6000, f: (S, st) => [nC(st, 'X'), 1] },
  { t: 'Bouw een stadion', e: '🏟️', r: 12000, f: (S, st) => [nC(st, 'S'), 1] },
  { t: 'Bereik 1000 inwoners', e: '🏙️', r: 30000, f: (S) => [Math.floor(S.pop), 1000] },
  { t: 'Bouw een woontoren', e: '🏙️', r: 24000, f: (S, st) => [nC(st, 'k'), 1] },
  { t: 'Verdien netto +300 per seconde', e: '💰', r: 40000, f: (S, st) => [Math.floor(st.net), 300] },
  { t: 'Bouw een pretpark', e: '🎡', r: 80000, f: (S, st) => [nC(st, 'P'), 1] },
  { t: 'Bereik 2500 inwoners', e: '🌆', r: 120000, f: (S) => [Math.floor(S.pop), 2500] },
  { t: 'Start een Nieuwe Stad met sterren (Meer-tab)', e: '🌟', r: 0, f: (S) => [S.prest > 0 ? 1 : 0, 1] },
];
export const ACHS = [
  { id: 'h1', n: 'Eerste huis', e: '🏠', r: 25, f: (S, st) => nC(st, RESIDENTIAL) >= 1 },
  { id: 'p25', n: 'Dorp', e: '🏡', r: 100, f: (S) => S.peak >= 25 },
  { id: 'p100', n: 'Gemeente', e: '🏘️', r: 400, f: (S) => S.peak >= 100 },
  { id: 'p250', n: 'Stadje', e: '🌇', r: 1200, f: (S) => S.peak >= 250 },
  { id: 'p500', n: 'Stad', e: '🏙️', r: 4000, f: (S) => S.peak >= 500 },
  { id: 'p1000', n: 'Grote stad', e: '🌆', r: 12000, f: (S) => S.peak >= 1000 },
  { id: 'p2500', n: 'Metropool', e: '🌃', r: 40000, f: (S) => S.peak >= 2500 },
  { id: 'p5000', n: 'Wereldstad', e: '🌍', r: 100000, f: (S) => S.peak >= 5000 },
  { id: 'happy', n: 'Vrolijke stad', e: '😊', r: 800, f: (S, st) => S.pop >= 60 && st.happy >= 85 },
  { id: 'work', n: 'Iedereen aan het werk', e: '👷', r: 800, f: (S, st) => S.pop >= 60 && st.unemp < 0.02 },
  { id: 'green', n: 'Groene vingers', e: '🌿', r: 500, f: (S, st) => nC(st, 'gdt') >= 15 },
  { id: 'fire3', n: 'Brandweerheld', e: '👨‍🚒', r: 400, f: (S) => S.fs >= 3 },
  { id: 'tap3', n: 'Emmer erbij!', e: '🪣', r: 400, f: (S) => S.ft >= 3 },
  { id: 'rich', n: 'Spaarpot', e: '🐷', r: 2000, f: (S) => S.money >= 10000 },
  { id: 'earn', n: 'Miljonair', e: '💎', r: 20000, f: (S) => S.tot >= 1e6 },
  { id: 'ov', n: 'Openbaar vervoer', e: '🚌', r: 600, f: (S, st) => nC(st, 'B') >= 2 && nC(st, 'X') >= 1 },
  { id: 'clean', n: 'Schone stroom', e: '🌬️', r: 600, f: (S, st) => nC(st, 'WZ') >= 5 },
  { id: 'fun', n: 'Feest in de stad', e: '🎡', r: 5000, f: (S, st) => nC(st, 'SP') >= 2 },
  { id: 'tech', n: 'Slimme stad', e: '💻', r: 6000, f: (S, st) => nC(st, 'C') >= 1 },
  { id: 'lv3', n: 'Topniveau', e: '🌟', r: 3000, f: (S) => S.lv.some((l) => l >= 3) },
  { id: 'upg', n: 'Stadsplanner', e: '📐', r: 3000, f: (S) => upLevels(S) >= 15 },
  { id: 'pre1', n: 'Nieuw begin', e: '🔄', r: 0, f: (S) => S.prest >= 1 },
  { id: 'daily3', n: 'Trouwe burgemeester', e: '📅', r: 1500, f: (S) => (S.daily && S.daily.s >= 3) },
  { id: 'star5', n: 'Sterrenstad', e: '🌟', r: 0, f: (S) => S.stars >= 5 },
];
// geeft lijst van nieuwe prestaties; kent geld toe
export function checkAch(S, st) {
  const out = [];
  for (const a of ACHS) if (!S.ach.includes(a.id) && a.f(S, st)) { S.ach.push(a.id); S.money += a.r; S.tot += a.r; out.push(a); }
  return out;
}
export function goalProgress(S, st) { const G = GOALS[S.goal]; return G ? G.f(S, st) : null; }
export function claimGoal(S, st) {
  const G = GOALS[S.goal]; if (!G) return null;
  const [c, t] = G.f(S, st); if (c < t) return null;
  S.money += G.r; S.tot += G.r; S.goal++; return G;
}

/* ---------- gebeurtenissen: branden, storm, feest, cadeaus ---------- */
export function fireCovered(S, st, i) {
  const [x, y] = xy(S, i);
  return st.svc.fire.some((s) => { const dx = s.x - x, dy = s.y - y; return dx * dx + dy * dy <= s.r2; });
}
const CHOICES = [
  { id: 'circus', t: '🎪 Een circus wil een weekje blijven. Kost een beetje geld, maar iedereen vindt het geweldig.', yes: 'Welkom circus!', no: 'Nu even niet', cost: (S) => Math.round(30 + Math.min(S.money * 0.1, 1500)) },
  { id: 'taart', t: '🎂 De bakker wil gratis taart uitdelen aan de hele stad. Mag dat?', yes: 'Taart voor iedereen!', no: 'Liever niet', cost: (S) => Math.round(20 + S.pop * 0.5) },
  { id: 'reclame', t: '📺 Een firma wil een groot reclamebord plaatsen en betaalt veel. Het is wel wat lelijk.', yes: 'Prima, bij ons ophangen', no: 'Nee, laat maar', cost: () => 0 },
];
export function resolveChoice(S, id, yes) {
  const C = CHOICES.find((c) => c.id === id); if (!C) return '';
  if (!yes) return 'Geen probleem, misschien een andere keer.';
  if (id === 'reclame') { const g = Math.round(120 + S.pop * 4 + S.peak); S.money += g; S.tot += g; S.ev.bad = 90; return `Het reclamebord brengt ${g} munten op. Even iets minder blije buren.`; }
  const c = C.cost(S); if (S.money < c) return 'Helaas, daar is nu te weinig geld voor.';
  S.money -= c; S.ev.fest = Math.max(S.ev.fest || 0, id === 'circus' ? 120 : 90);
  return id === 'circus' ? 'Het circus is in de stad! Iedereen is blij.' : 'Taart! De stad geniet.';
}
export const choiceById = (id) => CHOICES.find((c) => c.id === id);

// Roept hooks.news(tekst, soort) aan; muteert S.ev. Geeft niets terug. rng = () => [0,1).
export function tickEvents(S, st, dt, rng, hooks = {}) {
  const ev = S.ev, news = hooks.news || (() => {});
  for (const k of ['fest', 'storm', 'drought', 'bad']) if (ev[k] > 0) { ev[k] -= dt; if (ev[k] <= 0) { ev[k] = 0; if (k === 'storm') news('De storm is voorbij. ☀️', 'ok'); } }
  // vuur
  if (ev.fire) {
    for (const f of ev.fire) f.t -= dt;
    const done = ev.fire.filter((f) => f.t <= 0); ev.fire = ev.fire.filter((f) => f.t > 0);
    for (const f of done) {
      if (f.cov) { S.fs++; news('De brandweer heeft de brand geblust! 🚒', 'ok'); if (hooks.sfx) hooks.sfx('fireout'); }
      else if (BD[S.g[f.i]]) { S.g[f.i] = 'x'; S.lv[f.i] = 1; news('Een gebouw is afgebrand. Ruim het puin op (tik erop) en bouw opnieuw. Tip: een brandweer helpt!', 'bad'); if (hooks.sfx) hooks.sfx('bad'); }
    }
  }
  if (ev.gift && (ev.gift.t -= dt) <= 0) ev.gift = null;
  ev.cd = (ev.cd == null ? 70 : ev.cd) - dt;
  if (ev.cd > 0 || S.pop < 8) return;
  ev.cd = 70 + rng() * 80;
  const spots = []; for (let i = 0; i < S.g.length; i++) { const c = S.g[i]; if (BD[c] && !BD[c].fixed && c !== 'r' && c !== 't' && c !== 'g') spots.push(i); }
  const w = [['brand', spots.length >= 5 ? 22 - 3 * (S.up.fire || 0) : 0], ['storm', 14], ['feest', 12], ['toer', 12], ['cadeau', 16], ['droogte', S.pop > 40 ? 6 : 0], ['keuze', S.pop > 20 ? 14 : 0]];
  let tot = w.reduce((a, b) => a + b[1], 0), pick = rng() * tot, kind = 'cadeau';
  for (const [k, v] of w) { if ((pick -= v) <= 0) { kind = k; break; } }
  if (kind === 'brand') {
    const i = spots[Math.floor(rng() * spots.length)], cov = fireCovered(S, st, i);
    ev.fire = ev.fire || []; if (ev.fire.some((f) => f.i === i)) return;
    ev.fire.push({ i, t: cov ? 6 : 14, cov });
    news(cov ? 'Brand! De brandweer rukt uit. 🔥🚒' : 'Brand! Tik snel op de vlammen om te blussen! 🔥', cov ? 'warn' : 'bad'); if (hooks.sfx) hooks.sfx('alarm');
  } else if (kind === 'storm') {
    ev.storm = 60; const free = []; for (let i = 0; i < S.g.length; i++) { if ((S.g[i] === '.' || S.g[i] === 't') && !S.deb.includes(i)) { const [x, y] = xy(S, i); const N = S.size; if ((x > 0 && S.g[i - 1] === 'r') || (x < N - 1 && S.g[i + 1] === 'r') || (y > 0 && S.g[i - N] === 'r') || (y < N - 1 && S.g[i + N] === 'r')) free.push(i); } }
    const n = Math.min(free.length, 2 + Math.floor(rng() * 3)); for (let k = 0; k < n; k++) { const j = Math.floor(rng() * free.length); S.deb.push(free[j]); free.splice(j, 1); }
    news(`Storm! Windmolens draaien overuren. ${n ? 'Er liggen takken op straat: tik ze weg. 🍂' : ''}`, 'warn'); if (hooks.sfx) hooks.sfx('wind');
  } else if (kind === 'feest') { ev.fest = 90; news('Er is een straatfeest! Iedereen is blij en geeft meer uit. 🎉', 'ok'); if (hooks.sfx) hooks.sfx('party'); }
  else if (kind === 'toer') {
    const g = Math.round(40 + S.pop * 2.2 + (st.cnt.g || 0) * 8); S.money += g; S.tot += g;
    news(`Een bus vol toeristen brengt ${g} munten! 🚌`, 'ok'); if (hooks.sfx) hooks.sfx('coin');
  } else if (kind === 'cadeau') {
    const free = []; for (let i = 0; i < S.g.length; i++) if (S.g[i] === '.' ) free.push(i);
    const i = free.length ? free[Math.floor(rng() * free.length)] : -1;
    if (i >= 0) { ev.gift = { i, t: 30 }; news('Er ligt een cadeautje in de stad! 🎁', 'ok'); }
  } else if (kind === 'droogte') { ev.drought = 70; news('Droogte: er is minder water. Pompen en torens helpen! 💧', 'warn'); }
  else if (kind === 'keuze') { const C = CHOICES[Math.floor(rng() * CHOICES.length)]; ev.choice = C.id; if (hooks.sfx) hooks.sfx('ping'); }
}
export function douse(S, st, i) {
  const f = (S.ev.fire || []).find((x) => x.i === i); if (!f) return false;
  S.ev.fire = S.ev.fire.filter((x) => x !== f); S.ft++; if (!f.cov) S.fs += 0; return true;
}
export function takeGift(S, i) {
  const g = S.ev.gift; if (!g || g.i !== i) return 0;
  const v = Math.round(30 + S.pop * 1.2 + S.peak * 0.5); S.money += v; S.tot += v; S.ev.gift = null; return v;
}
export function clearDebris(S, i) {
  const k = S.deb.indexOf(i); if (k < 0) return 0;
  S.deb.splice(k, 1); const v = 5 + Math.floor(S.peak / 40); S.money += v; S.tot += v; return v;
}

/* =====================================================================
   2. TEKENEN (canvas; alles zelf getekend, geen afbeeldingen)
   ===================================================================== */
const hsh = (i, k = 0) => { let h = Math.imul(i + 1 + k * 7919, 2654435761) >>> 0; h ^= h >>> 13; h = Math.imul(h, 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const WALLS = ['#f6e3c6', '#ecd0a8', '#f4d6d2', '#d8e8f4', '#e6f0d2', '#f3e4ac', '#ddd1ee'];
const ROOFS = ['#c8553d', '#a9442f', '#7a5c9e', '#4f7cac', '#b86b3a', '#6a8d5a'];
const pick = (arr, i, k = 0) => arr[Math.floor(hsh(i, k) * arr.length)];

function rrect(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function circ(c, x, y, r, fill) { c.fillStyle = fill; c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, 6.2832); c.fill(); }
function poly(c, pts, fill) { c.fillStyle = fill; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) c.lineTo(pts[k], pts[k + 1]); c.closePath(); c.fill(); }
// 3D-blok in schuine projectie: voetafdruk [x,y,w,d], hoogte h; dak = top, voorkant = front
function box(c, x, y, w, d, h, top, front) {
  c.fillStyle = 'rgba(20,30,10,.2)'; c.fillRect(x + h * 0.25 + 1, y + d * 0.2, w, d);
  c.fillStyle = front; c.fillRect(x, y - h + d, w, h);
  c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(x + w * 0.72, y - h + d, w * 0.28, h);
  c.fillStyle = top; c.fillRect(x, y - h, w, d);
  c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y - h + 0.5, w - 1, d + h - 1);
  c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x + 1, y - h + 1, w - 2, 1.5);
}
// schuin dak: bovenste helft licht, onderste donker, nok in het midden
function roof(c, x, y, w, d, h, col, ov = 0) {
  c.fillStyle = col; c.fillRect(x - ov, y - h - ov, w + ov * 2, d + ov * 2);
  c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x - ov, y - h - ov, w + ov * 2, (d + ov * 2) * 0.48);
  c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x - ov, y - h - ov + (d + ov * 2) * 0.52, w + ov * 2, (d + ov * 2) * 0.48);
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x - ov, y - h + d / 2 - 0.5, w + ov * 2, 1);
}
function wins(c, x, y, w, h, cols, rows, o, seed, day = '#cde6f7') {
  const cw = w / cols, rh = h / rows, ww = cw * 0.52, wh = rh * 0.55;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const lit = o.night > 0.25 && hsh(o.i, seed + i * 7 + j * 13) < 0.72;
    c.fillStyle = lit ? '#ffd873' : day; c.fillRect(x + cw * i + (cw - ww) / 2, y + rh * j + (rh - wh) / 2, ww, wh);
  }
}
function smoke(c, x, y, r, t, n = 3, col = '255,255,255') {
  for (let k = 0; k < n; k++) { const p = (t * 0.35 + k / n) % 1; c.fillStyle = `rgba(${col},${(0.5 * (1 - p)).toFixed(2)})`; c.beginPath(); c.arc(x + Math.sin(p * 5 + k) * r * 0.6 + p * r * 0.8, y - p * r * 4, r * (0.5 + p), 0, 6.2832); c.fill(); }
}
function badge(c, x, y, s, emoji) {
  circ(c, x, y, s * 0.17, 'rgba(255,255,255,.85)'); c.font = `${Math.round(s * 0.24)}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000'; c.fillText(emoji, x, y + s * 0.01);
}
function tree(c, x, y, r, i = 0, sway = 0) {
  c.fillStyle = 'rgba(20,40,10,.22)'; c.beginPath(); c.ellipse(x + r * 0.3, y + r * 0.2, r * 0.9, r * 0.4, 0, 0, 6.2832); c.fill();
  c.fillStyle = '#7a5230'; c.fillRect(x - r * 0.12, y - r * 0.5, r * 0.24, r * 0.7);
  const g = ['#3f9a4d', '#4aa957', '#37894a'][i % 3];
  circ(c, x + sway, y - r * 1.1, r * 0.85, g); circ(c, x - r * 0.35 + sway, y - r * 0.8, r * 0.55, '#3a8f4a'); circ(c, x + r * 0.35 + sway, y - r * 0.85, r * 0.55, '#4fb25d');
  circ(c, x - r * 0.2 + sway, y - r * 1.35, r * 0.25, 'rgba(255,255,255,.18)');
}
function lvDots(c, x, y, s, lv) { for (let k = 1; k < lv; k++) circ(c, x + s * 0.12 + (k - 1) * s * 0.13, y + s * 0.88, s * 0.05, '#ffd24a'); }

// Alle gebouwen. Argumenten: (c, x, y, s, o); (x,y) = linkerbovenhoek van de tegel, s = tegelgrootte, o = {lv, t, night, i}
const DRAW = {
  h(c, x, y, s, o) {
    const lv = o.lv, hgt = s * (0.26 + 0.1 * (lv - 1)), w = s * 0.72, d = s * 0.5, bx = x + s * 0.14, by = y + s * 0.3;
    box(c, bx, by, w, d, hgt, '#000', pick(WALLS, o.i)); roof(c, bx, by, w, d, hgt, pick(ROOFS, o.i, 3), s * 0.05);
    c.fillStyle = '#7a4a2a'; c.fillRect(bx + w * 0.42, by + d - hgt * 0.5, w * 0.16, hgt * 0.5);
    wins(c, bx + w * 0.08, by + d - hgt * 0.85, w * 0.3, hgt * 0.6, 1, 1, o, 1); wins(c, bx + w * 0.62, by + d - hgt * 0.85, w * 0.3, hgt * 0.6, 1, 1, o, 2);
    if (lv > 1) { c.fillStyle = '#8a4f3a'; c.fillRect(bx + w * 0.7, by - hgt - s * 0.1, s * 0.07, s * 0.1); }
    lvDots(c, x, y, s, lv);
  },
  j(c, x, y, s, o) {
    const hgt = s * (0.36 + 0.1 * (o.lv - 1)), w = s * 0.9, d = s * 0.5, bx = x + s * 0.05, by = y + s * 0.3, n = 3, uw = w / n;
    for (let k = 0; k < n; k++) { box(c, bx + k * uw, by, uw, d, hgt, '#000', pick(WALLS, o.i, k + 1)); roof(c, bx + k * uw, by, uw, d, hgt, pick(ROOFS, o.i, k + 5)); wins(c, bx + k * uw + uw * 0.12, by + d - hgt * 0.9, uw * 0.76, hgt * 0.8, 1, 2, o, 3 + k); c.fillStyle = '#6d4026'; c.fillRect(bx + k * uw + uw * 0.38, by + d - hgt * 0.35, uw * 0.24, hgt * 0.35); }
    lvDots(c, x, y, s, o.lv);
  },
  f(c, x, y, s, o) {
    const hgt = s * (0.7 + 0.18 * (o.lv - 1)), w = s * 0.76, d = s * 0.5, bx = x + s * 0.12, by = y + s * 0.34;
    box(c, bx, by, w, d, hgt, '#9aa3b5', pick(['#d9c9b2', '#c9d3de', '#e0cfc8'], o.i));
    wins(c, bx + w * 0.08, by + d - hgt * 0.92, w * 0.84, hgt * 0.8, 3, 3 + o.lv, o, 4);
    c.fillStyle = '#6c7487'; c.fillRect(bx + w * 0.55, by - hgt + d * 0.2, w * 0.25, d * 0.35); lvDots(c, x, y, s, o.lv);
  },
  k(c, x, y, s, o) {
    const hgt = s * (1.2 + 0.3 * (o.lv - 1)), w = s * 0.7, d = s * 0.46, bx = x + s * 0.15, by = y + s * 0.38;
    const g = c.createLinearGradient(bx, by - hgt, bx + w, by + d); g.addColorStop(0, '#9fd0ee'); g.addColorStop(1, '#4f86b8');
    box(c, bx, by, w, d, hgt, '#c8d6e6', g); wins(c, bx + w * 0.07, by + d - hgt * 0.95, w * 0.86, hgt * 0.9, 4, 6 + o.lv * 2, o, 5, '#e8f4ff');
    c.fillStyle = '#ccd'; c.fillRect(bx + w * 0.48, by - hgt - s * 0.2, 1.5, s * 0.2); circ(c, bx + w * 0.48, by - hgt - s * 0.2, s * 0.025, Math.sin(o.t * 4) > 0 ? '#ff4d4d' : '#702'); lvDots(c, x, y, s, o.lv);
  },
  v(c, x, y, s, o) {
    const hgt = s * (0.3 + 0.08 * (o.lv - 1)), w = s * 0.6, d = s * 0.4, bx = x + s * 0.08, by = y + s * 0.2;
    box(c, bx, by, w, d, hgt, '#000', '#fbf6ee'); roof(c, bx, by, w, d, hgt, '#c0623b', s * 0.05); wins(c, bx + w * 0.1, by + d - hgt * 0.85, w * 0.8, hgt * 0.6, 3, 1, o, 6);
    c.fillStyle = '#58b7e8'; rrect(c, x + s * 0.36, y + s * 0.66, s * 0.5, s * 0.22, 3); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + s * 0.4 + Math.sin(o.t * 2) * 2 + 2, y + s * 0.72, s * 0.12, 1.5);
    tree(c, x + s * 0.86, y + s * 0.6, s * 0.14, o.i); lvDots(c, x, y, s, o.lv);
  },
  b(c, x, y, s, o) {
    const hgt = s * 0.3, w = s * 0.5, d = s * 0.38, bx = x + s * 0.08, by = y + s * 0.4;
    box(c, bx, by, w, d, hgt, '#000', '#b8412f'); roof(c, bx, by, w, d, hgt, '#7d4a33', s * 0.04);
    c.strokeStyle = '#f5e6d6'; c.lineWidth = 1.5; c.strokeRect(bx + w * 0.3, by + d - hgt * 0.65, w * 0.4, hgt * 0.65); c.beginPath(); c.moveTo(bx + w * 0.3, by + d - hgt * 0.65); c.lineTo(bx + w * 0.7, by + d); c.moveTo(bx + w * 0.7, by + d - hgt * 0.65); c.lineTo(bx + w * 0.3, by + d); c.stroke();
    box(c, x + s * 0.68, y + s * 0.32, s * 0.16, s * 0.16, s * 0.4, '#8aa0b8', '#b9c6d6'); circ(c, x + s * 0.76, y + s * 0.2, s * 0.09, '#9aaec4');
    circ(c, x + s * 0.28, y + s * 0.88, s * 0.1, '#e6c050'); circ(c, x + s * 0.45, y + s * 0.9, s * 0.08, '#d8b240'); lvDots(c, x, y, s, o.lv);
  },
  a(c, x, y, s, o) {
    const hgt = s * (0.34 + 0.08 * (o.lv - 1)), w = s * 0.82, d = s * 0.5, bx = x + s * 0.09, by = y + s * 0.34;
    box(c, bx, by, w, d, hgt, '#8c95a3', '#aab3c0');
    for (let k = 0; k < 3; k++) poly(c, [bx + w * k / 3, by - hgt, bx + w * (k + 1) / 3, by - hgt, bx + w * (k + 1) / 3, by - hgt - s * 0.1], '#7f8998');
    c.fillStyle = '#5e6a7a'; c.fillRect(bx + w * 0.3, by + d - hgt * 0.7, w * 0.4, hgt * 0.7); wins(c, bx + w * 0.06, by + d - hgt * 0.8, w * 0.2, hgt * 0.4, 1, 1, o, 7);
    smoke(c, bx + w * 0.85, by - hgt, s * 0.04, o.t, 2, '230,230,230'); lvDots(c, x, y, s, o.lv);
  },
  i(c, x, y, s, o) {
    const hgt = s * (0.5 + 0.12 * (o.lv - 1)), w = s * 0.84, d = s * 0.5, bx = x + s * 0.08, by = y + s * 0.4;
    box(c, bx, by, w, d, hgt, '#7b6a62', '#a65a43'); wins(c, bx + w * 0.06, by + d - hgt * 0.9, w * 0.88, hgt * 0.5, 5, 1, o, 8, '#f3d9a8');
    for (let k = 0; k < 2; k++) { const cx = bx + w * (0.2 + 0.4 * k); c.fillStyle = '#6f6360'; c.fillRect(cx, by - hgt - s * 0.3, s * 0.1, s * 0.34); c.fillStyle = '#c0392b'; c.fillRect(cx, by - hgt - s * 0.3, s * 0.1, s * 0.05); smoke(c, cx + s * 0.05, by - hgt - s * 0.3, s * 0.06, o.t + k * 0.4, 4, '200,200,205'); }
    lvDots(c, x, y, s, o.lv);
  },
  o(c, x, y, s, o) {
    const hgt = s * (0.9 + 0.25 * (o.lv - 1)), w = s * 0.74, d = s * 0.46, bx = x + s * 0.13, by = y + s * 0.38;
    const g = c.createLinearGradient(bx, by - hgt, bx, by + d); g.addColorStop(0, '#b0d6ee'); g.addColorStop(1, '#5f8fb8');
    box(c, bx, by, w, d, hgt, '#d8e0ea', g); wins(c, bx + w * 0.05, by + d - hgt * 0.95, w * 0.9, hgt * 0.9, 4, 7, o, 9, '#e8f4ff');
    c.fillStyle = '#8fa1b5'; c.fillRect(bx + w * 0.4, by - hgt + 2, w * 0.2, d * 0.5); lvDots(c, x, y, s, o.lv);
  },
  C(c, x, y, s, o) {
    const hgt = s * (0.8 + 0.2 * (o.lv - 1)), w = s * 0.8, d = s * 0.5, bx = x + s * 0.1, by = y + s * 0.38;
    const g = c.createLinearGradient(bx, by - hgt, bx + w, by); g.addColorStop(0, '#54e0cb'); g.addColorStop(1, '#2a7fa8');
    box(c, bx, by, w, d, hgt, '#d9f5f0', g); wins(c, bx + w * 0.06, by + d - hgt * 0.92, w * 0.88, hgt * 0.8, 5, 5, o, 10, '#d9fffa');
    c.fillStyle = '#e8fffb'; c.beginPath(); c.arc(bx + w * 0.3, by - hgt + d * 0.4, s * 0.16, Math.PI, 0); c.fill(); c.fillStyle = '#9edad0'; c.fillRect(bx + w * 0.3 - s * 0.16, by - hgt + d * 0.4, s * 0.32, 2);
    c.fillStyle = '#cde'; c.fillRect(bx + w * 0.78, by - hgt - s * 0.25, 1.5, s * 0.25); circ(c, bx + w * 0.78, by - hgt - s * 0.25, s * 0.03, Math.sin(o.t * 5) > 0 ? '#5ff' : '#055'); lvDots(c, x, y, s, o.lv);
  },
  m(c, x, y, s, o) {
    const hgt = s * 0.3, w = s * 0.5, d = s * 0.36, bx = x + s * 0.25, by = y + s * 0.4;
    box(c, bx, by, w, d, hgt, '#000', '#f2e1c2'); roof(c, bx, by, w, d, hgt, '#e0705a', s * 0.03);
    for (let k = 0; k < 5; k++) { c.fillStyle = k % 2 ? '#fff' : '#e8483a'; c.fillRect(bx - 2 + k * (w + 4) / 5, by + d - hgt * 0.62, (w + 4) / 5, hgt * 0.22); }
    c.fillStyle = '#fff3b0'; c.fillRect(bx + w * 0.12, by + d - hgt * 0.36, w * 0.76, hgt * 0.26); lvDots(c, x, y, s, o.lv);
  },
  n(c, x, y, s, o) {
    const hgt = s * (0.3 + 0.06 * (o.lv - 1)), w = s * 0.86, d = s * 0.5, bx = x + s * 0.07, by = y + s * 0.38;
    box(c, bx, by, w, d, hgt, '#cfd6df', '#f4f6f8'); c.fillStyle = '#3aa04f'; c.fillRect(bx - 1, by + d - hgt, w + 2, hgt * 0.3);
    c.fillStyle = '#d7f0ff'; c.fillRect(bx + w * 0.1, by + d - hgt * 0.62, w * 0.8, hgt * 0.5); badge(c, bx + w * 0.5, by - hgt + d * 0.5, s * 0.8, '🛒'); lvDots(c, x, y, s, o.lv);
  },
  e(c, x, y, s, o) {
    const hgt = s * 0.3, w = s * 0.6, d = s * 0.38, bx = x + s * 0.2, by = y + s * 0.3;
    box(c, bx, by, w, d, hgt, '#000', '#e9d3b8'); roof(c, bx, by, w, d, hgt, '#9b5a3c', s * 0.04); wins(c, bx + w * 0.1, by + d - hgt * 0.8, w * 0.8, hgt * 0.55, 3, 1, o, 11);
    for (let k = 0; k < 2; k++) { const ux = x + s * (0.3 + 0.35 * k), uy = y + s * 0.82; c.fillStyle = k ? '#e8483a' : '#3a7fe0'; c.beginPath(); c.arc(ux, uy, s * 0.1, Math.PI, 0); c.fill(); c.fillStyle = '#654'; c.fillRect(ux - 0.5, uy, 1.2, s * 0.08); }
    lvDots(c, x, y, s, o.lv);
  },
  q(c, x, y, s, o) {
    const hgt = s * (0.45 + 0.1 * (o.lv - 1)), w = s * 0.92, d = s * 0.58, bx = x + s * 0.04, by = y + s * 0.34;
    box(c, bx, by, w, d, hgt, '#bfe3f5', '#f2ecf8'); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(bx + w * 0.1, by - hgt + 3, w * 0.8, d - 6);
    wins(c, bx + w * 0.05, by + d - hgt * 0.8, w * 0.9, hgt * 0.5, 6, 1, o, 12); c.fillStyle = '#e0508a'; c.fillRect(bx + w * 0.4, by + d - hgt * 0.4, w * 0.2, hgt * 0.4);
    for (let k = 0; k < 3; k++) { const fx = bx + w * (0.15 + 0.35 * k); c.fillStyle = '#555'; c.fillRect(fx, by - hgt - s * 0.14, 1, s * 0.16); poly(c, [fx + 1, by - hgt - s * 0.14, fx + 1 + s * 0.1 + Math.sin(o.t * 3 + k) * 1.5, by - hgt - s * 0.1, fx + 1, by - hgt - s * 0.06], ['#ff5a5a', '#ffd24a', '#4ac0ff'][k]); }
    lvDots(c, x, y, s, o.lv);
  },
  c(c, x, y, s, o) {
    const hgt = s * (0.36 + 0.08 * (o.lv - 1)), w = s * 0.82, d = s * 0.46, bx = x + s * 0.09, by = y + s * 0.38;
    box(c, bx, by, w, d, hgt, '#000', '#f4cf6e'); roof(c, bx, by, w, d, hgt, '#b4503a', s * 0.04); wins(c, bx + w * 0.06, by + d - hgt * 0.85, w * 0.88, hgt * 0.5, 5, 1, o, 13);
    c.fillStyle = '#6d4026'; c.fillRect(bx + w * 0.44, by + d - hgt * 0.4, w * 0.12, hgt * 0.4); c.fillStyle = '#555'; c.fillRect(bx + w * 0.82, by - hgt - s * 0.22, 1.2, s * 0.24);
    poly(c, [bx + w * 0.82 + 1, by - hgt - s * 0.22, bx + w * 0.82 + s * 0.12 + Math.sin(o.t * 3) * 1.5, by - hgt - s * 0.17, bx + w * 0.82 + 1, by - hgt - s * 0.12], '#e8483a'); lvDots(c, x, y, s, o.lv);
  },
  l(c, x, y, s, o) {
    const hgt = s * (0.36 + 0.08 * (o.lv - 1)), w = s * 0.7, d = s * 0.42, bx = x + s * 0.15, by = y + s * 0.4;
    box(c, bx, by, w, d, hgt, '#d8c9a8', '#efe3c8'); poly(c, [bx - 2, by - hgt, bx + w + 2, by - hgt, bx + w / 2, by - hgt - s * 0.2], '#c9b890');
    for (let k = 0; k < 4; k++) { c.fillStyle = '#fff8e6'; c.fillRect(bx + w * (0.12 + 0.24 * k), by + d - hgt * 0.9, w * 0.08, hgt * 0.8); }
    badge(c, bx + w / 2, by - hgt - s * 0.07, s * 0.6, '📚'); lvDots(c, x, y, s, o.lv);
  },
  z(c, x, y, s, o) {
    const hgt = s * (0.6 + 0.14 * (o.lv - 1)), w = s * 0.8, d = s * 0.5, bx = x + s * 0.1, by = y + s * 0.38;
    box(c, bx, by, w, d, hgt, '#e8eef4', '#fbfdff'); wins(c, bx + w * 0.06, by + d - hgt * 0.92, w * 0.88, hgt * 0.8, 4, 3, o, 14, '#cfe8f7');
    const cx = bx + w / 2, cy = by - hgt + d * 0.5, a = s * 0.13; c.fillStyle = '#e03a46'; c.fillRect(cx - a, cy - a / 3, a * 2, a * 0.66); c.fillRect(cx - a / 3, cy - a, a * 0.66, a * 2); lvDots(c, x, y, s, o.lv);
  },
  p(c, x, y, s, o) {
    const hgt = s * (0.4 + 0.08 * (o.lv - 1)), w = s * 0.82, d = s * 0.5, bx = x + s * 0.09, by = y + s * 0.36;
    box(c, bx, by, w, d, hgt, '#000', '#d9433a'); roof(c, bx, by, w, d, hgt, '#9c2c27', s * 0.03);
    c.fillStyle = '#f4f4f4'; c.fillRect(bx + w * 0.12, by + d - hgt * 0.8, w * 0.36, hgt * 0.8); c.fillStyle = '#c7ccd4'; for (let k = 1; k < 4; k++) c.fillRect(bx + w * 0.12, by + d - hgt * 0.8 + hgt * 0.2 * k, w * 0.36, 1);
    wins(c, bx + w * 0.58, by + d - hgt * 0.8, w * 0.34, hgt * 0.5, 1, 1, o, 15); const on = Math.sin(o.t * 6) > 0; circ(c, bx + w * 0.8, by - hgt - 2, s * 0.05, on ? '#ff3b3b' : '#4d6bff');
    if (on) { c.fillStyle = 'rgba(255,60,60,.25)'; c.beginPath(); c.arc(bx + w * 0.8, by - hgt - 2, s * 0.14, 0, 6.2832); c.fill(); } lvDots(c, x, y, s, o.lv);
  },
  g(c, x, y, s, o) {
    c.fillStyle = '#7fc25f'; rrect(c, x + 2, y + 2, s - 4, s - 4, s * 0.15); c.fill(); c.strokeStyle = '#e8d9b0'; c.lineWidth = Math.max(1, s * 0.06); c.beginPath(); c.moveTo(x + s * 0.1, y + s * 0.7); c.quadraticCurveTo(x + s * 0.5, y + s * 0.4, x + s * 0.9, y + s * 0.75); c.stroke();
    c.fillStyle = '#6bb5e0'; c.beginPath(); c.ellipse(x + s * 0.72, y + s * 0.3, s * 0.15, s * 0.1, 0, 0, 6.2832); c.fill();
    tree(c, x + s * 0.25, y + s * 0.5, s * 0.17, o.i, Math.sin(o.t + o.i) * 0.6); tree(c, x + s * 0.55, y + s * 0.88, s * 0.15, o.i + 1, Math.sin(o.t + 1 + o.i) * 0.6);
    for (let k = 0; k < 4; k++) circ(c, x + s * (0.15 + hsh(o.i, k) * 0.7), y + s * (0.15 + hsh(o.i, k + 9) * 0.75), s * 0.02, ['#ff7aa8', '#ffd24a', '#fff'][k % 3]);
  },
  t(c, x, y, s, o) { tree(c, x + s * 0.5, y + s * 0.78, s * (0.25 + 0.06 * hsh(o.i, 4)), o.i, Math.sin(o.t * 1.3 + o.i) * 0.8); },
  d(c, x, y, s, o) {
    c.fillStyle = '#efd9a0'; rrect(c, x + 2, y + 2, s - 4, s - 4, s * 0.15); c.fill();
    c.strokeStyle = '#d24a4a'; c.lineWidth = Math.max(1.5, s * 0.05); c.beginPath(); c.moveTo(x + s * 0.2, y + s * 0.8); c.lineTo(x + s * 0.2, y + s * 0.3); c.lineTo(x + s * 0.55, y + s * 0.3); c.lineTo(x + s * 0.65, y + s * 0.8); c.stroke();
    c.strokeStyle = '#4a7fd2'; c.beginPath(); c.moveTo(x + s * 0.75, y + s * 0.85); c.lineTo(x + s * 0.75, y + s * 0.3); c.moveTo(x + s * 0.95, y + s * 0.85); c.lineTo(x + s * 0.95, y + s * 0.3); c.moveTo(x + s * 0.7, y + s * 0.3); c.lineTo(x + s, y + s * 0.3); c.stroke();
    const sw = Math.sin(o.t * 2.2) * s * 0.06; c.strokeStyle = '#444'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + s * 0.82, y + s * 0.3); c.lineTo(x + s * 0.82 + sw, y + s * 0.55); c.stroke(); circ(c, x + s * 0.82 + sw, y + s * 0.57, s * 0.04, '#ffcf3a');
  },
  F(c, x, y, s, o) {
    c.fillStyle = '#d9d2c4'; rrect(c, x + 2, y + 2, s - 4, s - 4, s * 0.2); c.fill(); circ(c, x + s / 2, y + s * 0.55, s * 0.34, '#b9b3a6'); circ(c, x + s / 2, y + s * 0.55, s * 0.29, '#5db7e6');
    for (let k = 0; k < 5; k++) { const p = (o.t * 1.4 + k / 5) % 1, a = (k / 5) * 6.28; c.fillStyle = `rgba(255,255,255,${(0.8 * (1 - p)).toFixed(2)})`; c.beginPath(); c.arc(x + s / 2 + Math.cos(a) * s * 0.1 * p, y + s * 0.55 - Math.sin(p * 3.14) * s * 0.3, s * 0.03, 0, 6.28); c.fill(); }
    c.fillStyle = '#e8f6ff'; c.fillRect(x + s / 2 - 1, y + s * 0.3, 2, s * 0.25);
  },
  S(c, x, y, s, o) {
    const w = s * 0.92, d = s * 0.62, bx = x + s * 0.04, by = y + s * 0.3, h = s * 0.28;
    box(c, bx, by, w, d, h, '#6fbf5b', '#c9ced8'); c.strokeStyle = '#fff'; c.lineWidth = 1; c.strokeRect(bx + w * 0.15, by - h + d * 0.18, w * 0.7, d * 0.64); c.beginPath(); c.moveTo(bx + w / 2, by - h + d * 0.18); c.lineTo(bx + w / 2, by - h + d * 0.82); c.stroke();
    for (let k = 0; k < 4; k++) { const fx = bx + w * (0.1 + 0.27 * k); c.fillStyle = '#8b94a5'; c.fillRect(fx, by - h - s * 0.2, 1.5, s * 0.22); circ(c, fx, by - h - s * 0.2, s * 0.03, o.night > 0.3 ? '#fff6b0' : '#dde'); }
    lvDots(c, x, y, s, o.lv);
  },
  P(c, x, y, s, o) {
    c.fillStyle = '#f0c9e0'; rrect(c, x + 2, y + 2, s - 4, s - 4, s * 0.12); c.fill(); const cx = x + s / 2, cy = y + s * 0.42, R = s * 0.34, a0 = o.t * 0.6;
    c.strokeStyle = '#7a7fa0'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx - s * 0.16, y + s * 0.9); c.lineTo(cx, cy); c.lineTo(cx + s * 0.16, y + s * 0.9); c.stroke();
    c.strokeStyle = '#e8508a'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, R, 0, 6.2832); c.stroke();
    for (let k = 0; k < 8; k++) { const a = a0 + k * 0.785; c.strokeStyle = 'rgba(122,127,160,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); c.stroke(); circ(c, cx + Math.cos(a) * R, cy + Math.sin(a) * R + s * 0.03, s * 0.045, ['#ff5a5a', '#ffd24a', '#4ac0ff', '#7be07b'][k % 4]); }
    circ(c, cx, cy, s * 0.04, '#fff'); lvDots(c, x, y, s, o.lv);
  },
  B(c, x, y, s, o) {
    c.fillStyle = '#bfc4cf'; c.fillRect(x + s * 0.1, y + s * 0.62, s * 0.8, s * 0.28); box(c, x + s * 0.18, y + s * 0.56, s * 0.64, s * 0.2, s * 0.22, '#3d86c6', '#cfeaf8');
    c.fillStyle = '#e8f6ff'; c.fillRect(x + s * 0.22, y + s * 0.62, s * 0.5, s * 0.14);
    c.fillStyle = '#555'; c.fillRect(x + s * 0.86, y + s * 0.22, 1.5, s * 0.42); circ(c, x + s * 0.86, y + s * 0.2, s * 0.08, '#3d86c6'); c.font = `${Math.round(s * 0.12)}px sans-serif`; c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('B', x + s * 0.86, y + s * 0.21);
  },
  X(c, x, y, s, o) {
    c.fillStyle = '#9a9faa'; c.fillRect(x, y + s * 0.62, s, s * 0.28); c.fillStyle = '#6a6f7a'; c.fillRect(x, y + s * 0.68, s, 1.5); c.fillRect(x, y + s * 0.8, s, 1.5);
    const tx = ((o.t * 0.22) % 1.6 - 0.3) * s; c.fillStyle = '#e8483a'; rrect(c, x + tx, y + s * 0.64, s * 0.5, s * 0.2, 3); c.fill(); c.fillStyle = '#d7f0ff'; for (let k = 0; k < 3; k++) c.fillRect(x + tx + s * (0.05 + 0.15 * k), y + s * 0.68, s * 0.09, s * 0.07);
    const hgt = s * 0.3; box(c, x + s * 0.1, y + s * 0.28, s * 0.8, s * 0.34, hgt, '#4a5568', '#e7e1d6'); wins(c, x + s * 0.14, y + s * 0.6 - hgt * 0.8, s * 0.72, hgt * 0.5, 4, 1, o, 16); badge(c, x + s * 0.5, y + s * 0.18, s * 0.7, '🚉');
  },
  W(c, x, y, s, o) {
    c.fillStyle = '#b9d98f'; rrect(c, x + 3, y + s * 0.78, s - 6, s * 0.15, 4); c.fill(); poly(c, [x + s * 0.42, y + s * 0.88, x + s * 0.58, y + s * 0.88, x + s * 0.53, y + s * 0.3, x + s * 0.47, y + s * 0.3], '#f1f1f1');
    const cx = x + s / 2, cy = y + s * 0.28, a = o.t * (o.storm ? 5 : 1.6); circ(c, cx, cy, s * 0.04, '#c9ced8');
    for (let k = 0; k < 3; k++) { const aa = a + k * 2.094; c.strokeStyle = '#fafafa'; c.lineWidth = Math.max(1.5, s * 0.05); c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(aa) * s * 0.34, cy + Math.sin(aa) * s * 0.34); c.stroke(); } c.lineCap = 'butt';
  },
  Z(c, x, y, s, o) {
    c.fillStyle = '#7fc25f'; rrect(c, x + 2, y + 2, s - 4, s - 4, 4); c.fill();
    for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) { const px = x + s * (0.1 + 0.29 * k), py = y + s * (0.14 + 0.27 * j); const g = c.createLinearGradient(px, py, px + s * 0.24, py + s * 0.2); g.addColorStop(0, '#3a6fc0'); g.addColorStop(1, '#1f3f86'); c.fillStyle = g; c.fillRect(px, py, s * 0.24, s * 0.2); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(px, py, s * 0.24, 1.2); c.fillRect(px + s * 0.12, py, 1, s * 0.2); }
    const sh = (Math.sin(o.t * 2) + 1) / 2; c.fillStyle = `rgba(255,255,255,${(0.12 * sh).toFixed(2)})`; c.fillRect(x + 2, y + 2, s - 4, s - 4); lvDots(c, x, y, s, o.lv);
  },
  E(c, x, y, s, o) {
    const hgt = s * (0.4 + 0.1 * (o.lv - 1)), bx = x + s * 0.06, by = y + s * 0.5; box(c, bx, by, s * 0.6, s * 0.4, hgt, '#7b7f8a', '#a1a6b2'); wins(c, bx + 3, by + s * 0.4 - hgt * 0.8, s * 0.6 - 6, hgt * 0.4, 3, 1, o, 17, '#f3e0a8');
    for (let k = 0; k < 2; k++) { const cx = x + s * (0.72 + 0.14 * k); poly(c, [cx - s * 0.05, y + s * 0.9, cx + s * 0.05, y + s * 0.9, cx + s * 0.035, y + s * 0.15, cx - s * 0.035, y + s * 0.15], k ? '#c4c7cf' : '#d4d7de'); c.fillStyle = '#d9433a'; c.fillRect(cx - s * 0.04, y + s * 0.15, s * 0.08, s * 0.05); smoke(c, cx, y + s * 0.15, s * 0.07, o.t + k * 0.5, 4, '210,212,220'); }
    c.fillStyle = '#ffd24a'; c.beginPath(); c.moveTo(bx + s * 0.28, by - hgt + 1); c.lineTo(bx + s * 0.22, by - hgt + s * 0.16); c.lineTo(bx + s * 0.29, by - hgt + s * 0.14); c.lineTo(bx + s * 0.25, by - hgt + s * 0.28); c.lineTo(bx + s * 0.38, by - hgt + s * 0.1); c.lineTo(bx + s * 0.3, by - hgt + s * 0.11); c.closePath(); c.fill(); lvDots(c, x, y, s, o.lv);
  },
  A(c, x, y, s, o) {
    c.fillStyle = '#9aa3b0'; rrect(c, x + s * 0.18, y + s * 0.5, s * 0.64, s * 0.36, 4); c.fill(); c.fillStyle = '#3d86c6'; c.fillRect(x + s * 0.3, y + s * 0.36, s * 0.14, s * 0.2); c.fillRect(x + s * 0.3, y + s * 0.36, s * 0.34, s * 0.07);
    const p = (o.t * 1.5) % 1; c.fillStyle = `rgba(90,180,240,${(0.9 * (1 - p)).toFixed(2)})`; c.beginPath(); c.arc(x + s * 0.64, y + s * 0.44 + p * s * 0.3, s * 0.04, 0, 6.28); c.fill(); badge(c, x + s * 0.5, y + s * 0.68, s * 0.6, '💧');
  },
  L(c, x, y, s, o) {
    poly(c, [x + s * 0.3, y + s * 0.92, x + s * 0.7, y + s * 0.92, x + s * 0.6, y + s * 0.5, x + s * 0.4, y + s * 0.5], '#bcc4cf'); const g = c.createLinearGradient(x + s * 0.2, 0, x + s * 0.8, 0); g.addColorStop(0, '#6bb4e6'); g.addColorStop(1, '#3d86c6');
    c.fillStyle = g; rrect(c, x + s * 0.2, y + s * 0.18, s * 0.6, s * 0.36, s * 0.12); c.fill(); poly(c, [x + s * 0.2, y + s * 0.22, x + s * 0.5, y + s * 0.04, x + s * 0.8, y + s * 0.22], '#7a8493'); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x + s * 0.26, y + s * 0.26, s * 0.1, s * 0.22);
  },
  R(c, x, y, s, o) {
    c.fillStyle = '#cfd6df'; rrect(c, x + 2, y + 2, s - 4, s - 4, 4); c.fill(); for (let k = 0; k < 2; k++) { const cx = x + s * (0.3 + 0.4 * k), cy = y + s * 0.5; circ(c, cx, cy, s * 0.22, '#a9b2bf'); circ(c, cx, cy, s * 0.17, '#52b8e8'); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, s * 0.1 + (o.t * 0.04 % 0.07) * s, 0, 6.28); c.stroke(); }
    c.fillStyle = '#7a8493'; c.fillRect(x + s * 0.1, y + s * 0.82, s * 0.8, s * 0.06);
  },
  H(c, x, y, s, o) {
    const hgt = s * 0.5, w = s * 0.86, d = s * 0.5, bx = x + s * 0.07, by = y + s * 0.42; box(c, bx, by, w, d, hgt, '#d8cdb8', '#f1e8d6');
    poly(c, [bx - 3, by - hgt, bx + w + 3, by - hgt, bx + w / 2, by - hgt - s * 0.22], '#b9a98c'); for (let k = 0; k < 4; k++) { c.fillStyle = '#fffaf0'; c.fillRect(bx + w * (0.14 + 0.2 * k), by + d - hgt * 0.9, w * 0.07, hgt * 0.8); }
    c.fillStyle = '#6d4026'; c.fillRect(bx + w * 0.44, by + d - hgt * 0.45, w * 0.12, hgt * 0.45);
    c.fillStyle = '#6f9ad6'; c.beginPath(); c.arc(bx + w / 2, by - hgt - s * 0.2, s * 0.14, Math.PI, 0); c.fill(); c.fillStyle = '#555'; c.fillRect(bx + w / 2 - 0.6, by - hgt - s * 0.5, 1.4, s * 0.3);
    poly(c, [bx + w / 2 + 1, by - hgt - s * 0.5, bx + w / 2 + 1 + s * 0.16 + Math.sin(o.t * 3) * 2, by - hgt - s * 0.44, bx + w / 2 + 1, by - hgt - s * 0.38], '#ff7a45');
  },
  x(c, x, y, s, o) {
    c.fillStyle = '#6f6a63'; rrect(c, x + s * 0.12, y + s * 0.4, s * 0.76, s * 0.5, 4); c.fill();
    for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? '#8a8378' : '#5b564f'; c.fillRect(x + s * (0.15 + hsh(o.i, k) * 0.55), y + s * (0.42 + hsh(o.i, k + 7) * 0.35), s * 0.14, s * 0.1); }
    smoke(c, x + s * 0.5, y + s * 0.5, s * 0.06, o.t, 3, '120,120,120');
  },
};
const ICON_ONLY = new Set(['g', 'd', 'F', 'P', 'Z', 'W', 'L', 'R', 'A', 'B', 'X', 't', 'x']);

function drawFlame(c, x, y, s, t, k) {
  for (let n = 0; n < 3; n++) {
    const fx = x + s * (0.25 + 0.25 * n), ph = t * 9 + n * 2 + k, h = s * (0.35 + 0.12 * Math.sin(ph));
    poly(c, [fx - s * 0.1, y + s * 0.8, fx + s * 0.1, y + s * 0.8, fx + Math.sin(ph) * s * 0.04, y + s * 0.8 - h], '#ff6a1a'); poly(c, [fx - s * 0.05, y + s * 0.8, fx + s * 0.05, y + s * 0.8, fx, y + s * 0.8 - h * 0.6], '#ffd24a');
  }
  smoke(c, x + s * 0.5, y + s * 0.4, s * 0.07, t, 3, '60,60,60');
}

// Eén hele frame tekenen. g = {S, st, cam, t, night, cars, floaters, tool, ghost, sel, layer, W, H, glow}
export function drawCity(c, g) {
  const { S, st, cam, t, night, W, H } = g, N = S.size, z = cam.z;
  c.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
  c.fillStyle = '#5aa05a'; c.fillRect(0, 0, W, H);
  const ox = W / 2 - cam.x * z, oy = H / 2 - cam.y * z;
  const x0 = Math.max(0, Math.floor((-ox) / z)), y0 = Math.max(0, Math.floor((-oy) / z) - 1), x1 = Math.min(N - 1, Math.ceil((W - ox) / z)), y1 = Math.min(N - 1, Math.ceil((H - oy) / z) + 2);
  c.font = '12px sans-serif';
  const gr = S.g, R = 5 + 2 * S.land, cen = Math.floor(N / 2), storm = S.ev && S.ev.storm > 0;
  // grond
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = y * N + x, px = ox + x * z, py = oy + y * z, ch = gr[i];
    if (ch === 'w') {
      c.fillStyle = '#3f9fd8'; c.fillRect(px, py, z + 0.6, z + 0.6);
      c.fillStyle = 'rgba(255,255,255,.22)'; const wv = Math.sin(t * 1.5 + x * 1.3 + y * 0.7) * z * 0.1; c.fillRect(px + z * 0.15 + wv, py + z * 0.3, z * 0.4, 1.6); c.fillRect(px + z * 0.45 - wv, py + z * 0.7, z * 0.35, 1.6);
    } else {
      c.fillStyle = (x + y) & 1 ? '#93d072' : '#8bc96a'; c.fillRect(px, py, z + 0.6, z + 0.6);
      if (ch === '.' && hsh(i) < 0.18) { circ(c, px + z * hsh(i, 1), py + z * hsh(i, 2), z * 0.025, hsh(i, 3) < 0.5 ? '#ffffff' : '#ffd0e0'); }
      // zandrand
      if (x > 0 && gr[i - 1] === 'w') { c.fillStyle = '#efd9a0'; c.fillRect(px, py, z * 0.12, z); }
      if (x < N - 1 && gr[i + 1] === 'w') { c.fillStyle = '#efd9a0'; c.fillRect(px + z * 0.88, py, z * 0.12, z); }
      if (y > 0 && gr[i - N] === 'w') { c.fillStyle = '#efd9a0'; c.fillRect(px, py, z, z * 0.12); }
      if (y < N - 1 && gr[i + N] === 'w') { c.fillStyle = '#efd9a0'; c.fillRect(px, py + z * 0.88, z, z * 0.12); }
    }
  }
  // wegen
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = y * N + x; if (gr[i] !== 'r') continue; const px = ox + x * z, py = oy + y * z, lv = S.lv[i];
    c.fillStyle = '#8f96a6'; c.fillRect(px, py, z + 0.6, z + 0.6);
    const L = x > 0 && gr[i - 1] === 'r', Rr = x < N - 1 && gr[i + 1] === 'r', U = y > 0 && gr[i - N] === 'r', D = y < N - 1 && gr[i + N] === 'r', e = z * 0.09;
    c.fillStyle = '#5b6272'; c.fillRect(px + (L ? 0 : e), py + (U ? 0 : e), z - (L ? 0 : e) - (Rr ? 0 : e) + 0.6, z - (U ? 0 : e) - (D ? 0 : e) + 0.6);
    c.strokeStyle = lv > 1 ? '#f2c94c' : 'rgba(255,255,255,.55)'; c.lineWidth = Math.max(1, z * 0.04); c.setLineDash([z * 0.14, z * 0.12]); c.beginPath();
    const cx = px + z / 2, cy = py + z / 2; if (L) { c.moveTo(px, cy); c.lineTo(cx, cy); } if (Rr) { c.moveTo(cx, cy); c.lineTo(px + z, cy); } if (U) { c.moveTo(cx, py); c.lineTo(cx, cy); } if (D) { c.moveTo(cx, cy); c.lineTo(cx, py + z); } c.stroke(); c.setLineDash([]);
    if (lv > 2) { circ(c, px + z * 0.12, py + z * 0.12, z * 0.06, '#3f9a4d'); circ(c, px + z * 0.88, py + z * 0.88, z * 0.06, '#3f9a4d'); }
    if (night > 0.3 && (x + y) % 3 === 0) { circ(c, px + z * 0.5, py + z * 0.18, z * 0.04, '#ffe9a8'); }
  }
  // dekking-/bereik-overlays
  if (g.range) { const rg = g.range, rx = ox + (rg.x + 0.5) * z, ry = oy + (rg.y + 0.5) * z; c.fillStyle = 'rgba(255,255,255,.16)'; c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2; c.setLineDash([6, 5]); c.beginPath(); c.arc(rx, ry, rg.r * z + z * 0.5, 0, 6.2832); c.fill(); c.stroke(); c.setLineDash([]); }
  // gebouwen: rij voor rij (van boven naar beneden)
  const o = { lv: 1, t, night, i: 0, storm };
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = y * N + x, ch = gr[i]; if (ch === '.' || ch === 'w' || ch === 'r') continue;
    const fn = DRAW[ch]; if (!fn) continue; const px = ox + x * z, py = oy + y * z;
    o.lv = S.lv[i]; o.i = i;
    c.save(); fn(c, px, py, z, o); c.restore();
    if (st && st.disc && st.disc.length && g.discSet && g.discSet.has(i)) { const bob = Math.sin(t * 4) * 2; c.font = `${Math.round(z * 0.32)}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000'; c.fillText('⚠️', px + z * 0.5, py + z * 0.15 + bob); }
    if (g.sel === i) { c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.setLineDash([5, 4]); c.strokeRect(px + 1, py + 1, z - 2, z - 2); c.setLineDash([]); c.strokeStyle = '#ffcf3a'; c.lineWidth = 1.5; c.strokeRect(px + 3, py + 3, z - 6, z - 6); }
    if (ch === 'x') { /* puin */ }
  }
  // auto's
  for (const car of g.cars) {
    const cx = ox + (car.x + (car.tx - car.x) * car.p + 0.5) * z, cy = oy + (car.y + (car.ty - car.y) * car.p + 0.5) * z, horiz = car.tx !== car.x;
    const lane = (car.dir ? 1 : -1) * z * 0.12, w = horiz ? z * 0.24 : z * 0.14, h = horiz ? z * 0.14 : z * 0.24;
    const px = cx - w / 2 + (horiz ? 0 : lane), py = cy - h / 2 + (horiz ? lane : 0);
    c.fillStyle = car.col; rrect(c, px, py, w, h, z * 0.04); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; if (horiz) c.fillRect(px + w * 0.55, py + 1, w * 0.2, h - 2); else c.fillRect(px + 1, py + h * 0.2, w - 2, h * 0.2);
    if (night > 0.3) { c.fillStyle = 'rgba(255,240,170,.9)'; if (horiz) c.fillRect(car.tx > car.x ? px + w - 1.5 : px, py + 1, 1.5, h - 2); else c.fillRect(px + 1, car.ty > car.y ? py + h - 1.5 : py, w - 2, 1.5); }
  }
  // branden, cadeau, takken
  const ev = S.ev || {};
  if (ev.fire) for (const f of ev.fire) { const x = f.i % N, y = (f.i / N) | 0; drawFlame(c, ox + x * z, oy + y * z, z, t, f.i); if (f.cov) { c.font = `${Math.round(z * 0.4)}px serif`; c.textAlign = 'center'; c.fillText('🚒', ox + (x + 0.5) * z + Math.sin(t * 6) * 2, oy + (y + 0.15) * z); } }
  if (ev.gift) { const x = ev.gift.i % N, y = (ev.gift.i / N) | 0, bob = Math.abs(Math.sin(t * 3)) * z * 0.15; circ(c, ox + (x + 0.5) * z, oy + (y + 0.8) * z, z * 0.18, 'rgba(0,0,0,.15)'); c.font = `${Math.round(z * 0.62)}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🎁', ox + (x + 0.5) * z, oy + (y + 0.5) * z - bob); c.strokeStyle = `rgba(255,220,80,${(0.5 + 0.4 * Math.sin(t * 5)).toFixed(2)})`; c.lineWidth = 2; c.beginPath(); c.arc(ox + (x + 0.5) * z, oy + (y + 0.55) * z, z * (0.4 + 0.06 * Math.sin(t * 5)), 0, 6.28); c.stroke(); }
  for (const di of S.deb) { const x = di % N, y = (di / N) | 0; if (x < x0 || x > x1 || y < y0 || y > y1) continue; const px = ox + x * z, py = oy + y * z; c.strokeStyle = '#7a5230'; c.lineWidth = Math.max(1.5, z * 0.05); c.beginPath(); c.moveTo(px + z * 0.2, py + z * 0.7); c.lineTo(px + z * 0.7, py + z * 0.4); c.moveTo(px + z * 0.3, py + z * 0.45); c.lineTo(px + z * 0.8, py + z * 0.75); c.stroke(); circ(c, px + z * 0.5, py + z * 0.55, z * 0.08, '#6a9a3a'); circ(c, px + z * 0.35, py + z * 0.6, z * 0.06, '#8ab04a'); }
  // grond-grens en slot
  const lx = ox + (cen - R) * z, ly = oy + (cen - R) * z, lw = (2 * R + 1) * z;
  c.fillStyle = 'rgba(15,25,45,.38)'; c.fillRect(ox, oy, N * z, ly - oy); c.fillRect(ox, ly + lw, N * z, oy + N * z - ly - lw); c.fillRect(ox, ly, lx - ox, lw); c.fillRect(lx + lw, ly, ox + N * z - lx - lw, lw);
  c.strokeStyle = 'rgba(255,214,90,.9)'; c.lineWidth = 2; c.setLineDash([8, 6]); c.strokeRect(lx, ly, lw, lw); c.setLineDash([]);
  if (S.land < Math.max(0, Math.ceil((N / 2 - 5) / 2))) { c.font = `${Math.round(Math.max(12, z * 0.4))}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(255,255,255,.85)'; c.fillText('🔒', lx + lw / 2, ly - z * 0.45); }
  // blijdschapskaart
  if (g.layer === 'blij' && st) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * N + x; if (!st.hm[i]) continue; const h = st.hm[i] + st.gadj; const hue = Math.max(0, Math.min(120, (h - 20) * 1.6)); c.fillStyle = `hsla(${hue},85%,50%,.55)`; c.fillRect(ox + x * z, oy + y * z, z, z); }
  }
  // spook (plaatsen)
  if (g.ghost && g.tool) {
    const gh = g.ghost, px = ox + gh.x * z, py = oy + gh.y * z, ok = gh.ok;
    c.globalAlpha = 0.7; if (g.tool !== 'sloop' && DRAW[g.tool] && gh.x >= 0) { o.lv = 1; o.i = gh.y * N + gh.x; c.save(); DRAW[g.tool](c, px, py, z, o); c.restore(); } c.globalAlpha = 1;
    c.fillStyle = ok ? 'rgba(80,220,120,.28)' : 'rgba(255,70,70,.32)'; c.fillRect(px, py, z, z); c.strokeStyle = ok ? '#4ade80' : '#ff5a5a'; c.lineWidth = 2; c.strokeRect(px + 1, py + 1, z - 2, z - 2);
  }
  // drijvende teksten
  c.font = `bold ${Math.round(Math.max(12, z * 0.32))}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const f of g.floaters) { const a = Math.max(0, 1 - f.t / 1.6); c.globalAlpha = a; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.55)'; const fx = ox + f.x * z, fy = oy + f.y * z - f.t * z * 0.6; c.strokeText(f.text, fx, fy); c.fillStyle = f.col || '#fff'; c.fillText(f.text, fx, fy); } c.globalAlpha = 1;
  // nacht
  if (night > 0.02) {
    c.fillStyle = `rgba(14,22,70,${(0.52 * night).toFixed(3)})`; c.fillRect(0, 0, W, H);
    if (night > 0.3 && g.glow) {
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, (night - 0.2) * 1.4);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const ch = gr[y * N + x]; if (ch === '.' || ch === 'w' || ch === 't') continue; const cx = ox + (x + 0.5) * z, cy = oy + (y + 0.55) * z;
        if (ch === 'r') { if ((x + y) % 3 === 0) c.drawImage(g.glow, cx - z * 0.7, cy - z * 0.9, z * 1.4, z * 1.4); } else if (ch !== 'x') c.drawImage(g.glow, cx - z * 0.55, cy - z * 0.7, z * 1.1, z * 1.1);
      }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
  }
  // storm/regen
  if (storm) { c.strokeStyle = 'rgba(190,210,240,.5)'; c.lineWidth = 1; c.beginPath(); for (let k = 0; k < 40; k++) { const rx = (hsh(k, Math.floor(t * 6)) * W), ry = ((hsh(k + 99, Math.floor(t * 6)) * H)); c.moveTo(rx, ry); c.lineTo(rx - 5, ry + 12); } c.stroke(); }
}
export function makeGlow() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'); const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,214,120,.55)'); g.addColorStop(1, 'rgba(255,214,120,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); return cv;
}
// kleine auto's die over de wegen rijden
export function carsStep(cars, S, dt, want) {
  const N = S.size, g = S.g, road = (x, y) => x >= 0 && y >= 0 && x < N && y < N && g[y * N + x] === 'r';
  const rl = []; for (let i = 0; i < g.length; i++) if (g[i] === 'r') rl.push(i);
  if (!rl.length) { cars.length = 0; return; }
  while (cars.length < want) { const i = rl[Math.floor(Math.random() * rl.length)], x = i % N, y = (i / N) | 0; cars.push({ x, y, tx: x, ty: y, p: 1, px: x, py: y, dir: Math.random() < 0.5, col: ['#e8483a', '#3a7fe0', '#f2c94c', '#4ab36a', '#f4f4f4', '#9b59b6'][Math.floor(Math.random() * 6)], sp: 1.3 + Math.random() * 0.9 }); }
  while (cars.length > want) cars.pop();
  for (const car of cars) {
    car.p += dt * car.sp;
    if (car.p >= 1) {
      car.px = car.x; car.py = car.y; car.x = car.tx; car.y = car.ty; car.p = 0;
      if (!road(car.x, car.y)) { const i = rl[Math.floor(Math.random() * rl.length)]; car.x = car.tx = i % N; car.y = car.ty = (i / N) | 0; car.p = 1; continue; }
      const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => road(car.x + dx, car.y + dy) && !(car.x + dx === car.px && car.y + dy === car.py));
      if (!opts.length) opts.push([car.px - car.x, car.py - car.y]);
      const [dx, dy] = opts[Math.floor(Math.random() * opts.length)]; car.tx = car.x + dx; car.ty = car.y + dy; car.dir = dx > 0 || dy > 0;
      if (car.tx === car.x && car.ty === car.y) { car.p = 1; }
    }
  }
}

/* =====================================================================
   3. GELUID
   ===================================================================== */
function makeAudio(getOn, getNight) {
  let ac = null, master = null, musicT = null, last = {};
  const ensure = () => {
    if (ac) return ac;
    try { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ac = new A(); master = ac.createGain(); master.gain.value = 0.55; master.connect(ac.destination); } catch (e) { ac = null; }
    return ac;
  };
  const tone = (f, d = 0.15, type = 'sine', v = 0.12, when = 0, slide = 0) => {
    if (!getOn() || !ensure()) return;
    try {
      if (ac.state === 'suspended') ac.resume();
      const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.05);
    } catch (e) { /* geluid is optioneel */ }
  };
  const throttle = (k, ms, fn) => () => { const n = Date.now(); if (n - (last[k] || 0) < ms) return; last[k] = n; fn(); };
  const SFX = {
    place: throttle('place', 60, () => { tone(520, 0.08, 'triangle', 0.14); tone(780, 0.1, 'triangle', 0.1, 0.06); }),
    bad: throttle('bad', 150, () => tone(180, 0.18, 'sawtooth', 0.07, 0, -60)),
    click: throttle('click', 40, () => tone(660, 0.05, 'triangle', 0.08)),
    coin: () => { tone(988, 0.08, 'square', 0.05); tone(1319, 0.2, 'square', 0.05, 0.07); },
    ach: () => { [523, 659, 784, 1046].forEach((f, k) => tone(f, 0.28, 'triangle', 0.12, k * 0.1)); },
    unlock: () => { [392, 523, 659].forEach((f, k) => tone(f, 0.22, 'sine', 0.13, k * 0.09)); },
    sell: () => { tone(440, 0.1, 'triangle', 0.1); tone(330, 0.14, 'triangle', 0.08, 0.08); },
    alarm: () => { tone(740, 0.16, 'square', 0.05); tone(560, 0.16, 'square', 0.05, 0.18); tone(740, 0.16, 'square', 0.05, 0.36); },
    fireout: () => { tone(880, 0.12, 'sine', 0.1); tone(1175, 0.2, 'sine', 0.1, 0.1); },
    splash: () => { tone(300, 0.2, 'sine', 0.1, 0, 500); },
    wind: () => { tone(200, 0.9, 'sawtooth', 0.025, 0, 60); },
    party: () => { [523, 659, 784, 659, 784, 1046].forEach((f, k) => tone(f, 0.14, 'triangle', 0.1, k * 0.09)); },
    ping: () => { tone(880, 0.2, 'sine', 0.1); tone(1320, 0.3, 'sine', 0.08, 0.12); },
    upg: () => { tone(440, 0.1, 'triangle', 0.12); tone(660, 0.1, 'triangle', 0.12, 0.08); tone(880, 0.2, 'triangle', 0.12, 0.16); },
  };
  const NOTES_D = [262, 294, 330, 392, 440, 523, 587], NOTES_N = [196, 220, 262, 294, 330];
  const music = () => {
    musicT = null;
    if (getOn() && ac && ac.state === 'running') {
      const arr = getNight() > 0.5 ? NOTES_N : NOTES_D, f = arr[Math.floor(Math.random() * arr.length)];
      tone(f, 2.2, 'sine', 0.035); if (Math.random() < 0.4) tone(f * 1.5, 2.6, 'sine', 0.02, 0.25);
    }
    musicT = setTimeout(music, 2600 + Math.random() * 3800);
  };
  return {
    sfx: (n) => { if (SFX[n]) SFX[n](); }, ensure, start() { ensure(); if (ac && ac.state === 'suspended') ac.resume(); if (!musicT) musicT = setTimeout(music, 1200); },
    stop() { if (musicT) { clearTimeout(musicT); musicT = null; } try { if (ac) ac.close(); } catch (e) { /* niets */ } ac = null; },
  };
}

/* =====================================================================
   4. DE VIEW: UI, invoer, opslag, spelloop
   ===================================================================== */
const CSS = `
.sb-root{position:relative;height:clamp(460px,calc(100dvh - 5.5rem),860px);border-radius:16px;overflow:hidden;background:#5aa05a;color:var(--ink);font-size:14px;user-select:none;-webkit-user-select:none;margin:.4rem 0}
.sb-cv{position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block;cursor:grab}
.sb-hud{position:absolute;left:6px;right:6px;top:6px;display:flex;flex-wrap:wrap;gap:4px;pointer-events:none}
.sb-hud>*{pointer-events:auto}
.sb-pill{background:rgba(18,22,40,.66);color:#fff;border-radius:12px;padding:3px 9px;font-weight:600;line-height:1.35;backdrop-filter:blur(4px);display:flex;align-items:center;gap:4px;white-space:nowrap}
.sb-pill small{font-weight:500;opacity:.8;font-size:.78em}
.sb-pill.red{background:rgba(190,40,40,.8)}.sb-pill.amb{background:rgba(190,120,20,.8)}
.sb-btn{background:rgba(18,22,40,.66);color:#fff;border:0;border-radius:12px;padding:3px 9px;font-size:1rem;cursor:pointer;min-height:28px}
.sb-msgs{position:absolute;left:8px;right:8px;top:72px;display:flex;flex-direction:column;gap:5px;pointer-events:none;align-items:center}
.sb-msgs>*{pointer-events:auto}
.sb-tut{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:14px;padding:8px 11px;box-shadow:0 4px 14px rgba(0,0,0,.28);max-width:440px;width:100%;line-height:1.35;animation:sbpop .4s}
.sb-tut button{background:rgba(255,255,255,.22);border:0;color:#fff;border-radius:9px;padding:2px 8px;font-size:.8em;margin-top:4px;cursor:pointer}
.sb-toast{background:rgba(18,22,40,.82);color:#fff;border-radius:12px;padding:6px 11px;max-width:440px;animation:sbpop .3s;box-shadow:0 3px 10px rgba(0,0,0,.25)}
.sb-toast.bad{background:rgba(170,40,40,.9)}.sb-toast.ok{background:rgba(30,120,70,.9)}.sb-toast.warn{background:rgba(170,110,20,.92)}
@keyframes sbpop{from{transform:translateY(-8px) scale(.96);opacity:0}to{transform:none;opacity:1}}
@keyframes sbpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}
.sb-tabs{position:absolute;left:0;right:0;bottom:0;height:54px;display:flex;background:var(--card);border-top:1px solid var(--line)}
.sb-tab{flex:1;border:0;background:none;color:var(--ink);font-size:.7rem;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;cursor:pointer;position:relative;padding:0;border-radius:0}
.sb-tab span{font-size:1.3rem;line-height:1}
.sb-tab.on{background:rgba(99,102,241,.14);color:var(--accent);font-weight:700}
.sb-tab.pulse span{animation:sbpulse 1s infinite}
.sb-tab i{position:absolute;top:5px;right:calc(50% - 20px);width:9px;height:9px;border-radius:50%;background:#ef4444;display:none}
.sb-tab.dot i{display:block}
.sb-sheet{position:absolute;left:0;right:0;bottom:54px;max-height:60%;background:var(--card);border-radius:18px 18px 0 0;box-shadow:0 -6px 20px rgba(0,0,0,.25);display:none;flex-direction:column;border-top:1px solid var(--line)}
.sb-sheet.open{display:flex}
.sb-sh-top{display:flex;align-items:center;justify-content:space-between;padding:8px 12px 2px}
.sb-sh-top b{font-size:1.02rem}
.sb-sc{overflow-y:auto;padding:4px 12px 12px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.sb-x{background:none;border:0;font-size:1.2rem;cursor:pointer;color:var(--ink);padding:2px 8px}
.sb-cats{display:flex;gap:6px;overflow-x:auto;padding:4px 0 8px;scrollbar-width:none}
.sb-chip{border:1px solid var(--line);background:var(--bg,var(--card));color:var(--ink);border-radius:20px;padding:4px 11px;white-space:nowrap;cursor:pointer;font-size:.85rem}
.sb-chip.on{background:var(--accent);color:#fff;border-color:transparent}
.sb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:7px}
.sb-card{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:13px;padding:7px 4px;display:flex;flex-direction:column;align-items:center;gap:1px;cursor:pointer;min-height:76px;text-align:center}
.sb-card .e{font-size:1.7rem;line-height:1.1}.sb-card b{font-size:.8rem}.sb-card small{opacity:.8;font-size:.74rem}
.sb-card.poor small{color:#ef4444;opacity:1}.sb-card.lock{opacity:.5}
.sb-card.sel{outline:2.5px solid var(--accent)}
.sb-tool{position:absolute;left:8px;right:8px;bottom:62px;display:none;align-items:center;gap:8px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:7px 10px;box-shadow:0 4px 14px rgba(0,0,0,.25)}
.sb-tool.show{display:flex}.sb-tool .e{font-size:1.6rem}.sb-tool div{flex:1;min-width:0;line-height:1.25}.sb-tool small{opacity:.8}
.sb-info{position:absolute;left:8px;right:8px;bottom:62px;display:none;background:var(--card);border:1px solid var(--line);border-radius:15px;padding:9px 11px;box-shadow:0 4px 16px rgba(0,0,0,.3)}
.sb-info.show{display:block}.sb-info h4{margin:0 0 2px;font-size:1rem}.sb-info p{margin:2px 0;line-height:1.35}
.sb-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:6px}
.sb-b{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:11px;padding:6px 11px;cursor:pointer;font-size:.88rem}
.sb-b.pri{background:var(--accent);color:#fff;border-color:transparent;font-weight:600}
.sb-b:disabled,.sb-b.off{opacity:.45;cursor:default}
.sb-b.good{background:#16a34a;color:#fff;border-color:transparent;font-weight:600}
.sb-bar{height:9px;background:var(--line);border-radius:6px;overflow:hidden;margin:3px 0 7px}
.sb-bar>div{height:100%;border-radius:6px;background:var(--accent);transition:width .4s}
.sb-kv{display:flex;justify-content:space-between;gap:8px;padding:2px 0}
.sb-kv span:last-child{font-weight:600;text-align:right}
.sb-box{border:1px solid var(--line);border-radius:13px;padding:9px 11px;margin:7px 0;background:var(--card)}
.sb-box h4{margin:0 0 3px;font-size:.95rem}.sb-box small{opacity:.8}
.sb-pips{display:inline-flex;gap:2px;vertical-align:middle}.sb-pips i{width:7px;height:7px;border-radius:50%;background:var(--line)}.sb-pips i.on{background:#f59e0b}
.sb-ach{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:6px}
.sb-ach>div{border:1px solid var(--line);border-radius:12px;padding:6px 4px;text-align:center;font-size:.76rem}
.sb-ach>div.no{opacity:.4;filter:grayscale(1)}.sb-ach .e{font-size:1.5rem;display:block}
.sb-modal{position:absolute;inset:0;background:rgba(10,14,30,.55);display:none;align-items:center;justify-content:center;padding:16px;z-index:5}
.sb-modal.show{display:flex}
.sb-mc{background:var(--card);border-radius:20px;padding:18px;max-width:380px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.4);animation:sbpop .35s;text-align:center;line-height:1.4}
.sb-mc h3{margin:0 0 6px;font-size:1.2rem}
.sb-mc .big{font-size:2.6rem;line-height:1.1}
.sb-slider{width:100%;accent-color:var(--accent)}
.sb-news{font-size:.82rem;opacity:.9;padding:2px 0;border-bottom:1px solid var(--line)}
`;

export async function stadbouwerView(ctx) {
  const { db, me, esc, view, addCleanup } = ctx;
  const uid = ctx.uid || (me && me.uid) || 'anon';
  const LS = `big:stadbouwer:${uid}`;
  const ref = doc(db, 'gamesaves', 'big-stadbouwer__' + uid);
  let alive = true, S = null, st = null, raf = 0, tickT = null, saveT = null, localT = null, rafOn = false;
  let tab = '', catSel = 'wonen', tool = null, sel = -1, layer = '', confirmPrest = false, sheetBusy = false;
  let lastCloud = 0, cloudDirty = false, localDirty = false, saveMsg = '';
  let lastTick = Date.now(), lastT = performance.now(), tAnim = 0, lastUnl = 0, lastSheet = '', toastT = null, lastGoalReady = false;
  const cam = { x: 11, y: 11, z: 36 }; const cars = [], floaters = [], news = [];
  let W = 300, H = 400, dpr = 1, ghost = null, glow = null, discSet = null;
  const cleanups = [];
  const audio = makeAudio(() => !!(S && S.snd), () => nightNow());

  view.innerHTML = '<div class="box" style="text-align:center"><small>Stad laden…</small></div>';

  /* ---------- opslag ---------- */
  const readLocal = () => { try { const o = JSON.parse(localStorage.getItem(LS) || 'null'); return o && typeof o.data === 'string' ? o : null; } catch (e) { return null; } };
  const writeLocal = () => { try { S.last = Date.now(); localStorage.setItem(LS, JSON.stringify({ data: serialize(S), updated: S.last })); localDirty = false; } catch (e) { /* geen opslag */ } };
  const markDirty = () => { localDirty = true; cloudDirty = true; if (!localT) localT = setTimeout(() => { localT = null; if (S && localDirty) writeLocal(); }, 1500); };
  async function cloudSave(force) {
    if (!S || !cloudDirty) return; const now = Date.now();
    if (!force && now - lastCloud < 60000) return;
    lastCloud = now; cloudDirty = false; S.last = now; const data = serialize(S);
    try { writeLocal(); await setDoc(ref, { game: 'big-stadbouwer', uid, data, updated: now }); saveMsg = 'Opgeslagen in de cloud ☁️'; }
    catch (e) { cloudDirty = true; saveMsg = 'Staat veilig op dit apparaat 💾'; }
  }
  const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(() => r(null), ms))]);
  async function loadRemote() {
    try { const s = await withTimeout(getDoc(ref), 5000); if (s && s.exists()) { const d = s.data(); if (d && typeof d.data === 'string') return { data: d.data, updated: d.updated || 0 }; } } catch (e) { /* offline */ }
    return null;
  }

  const loc = readLocal(), remote = await loadRemote();
  if (!alive) return;
  const best = pickNewest(loc, remote);
  let welcome = null;
  if (best) {
    S = deserialize(best.data);
    if (best === loc && remote && (loc.updated || 0) > (remote.updated || 0)) cloudDirty = true;
    if (best === loc && !remote) cloudDirty = true;
    const gap = (Date.now() - (S.last || Date.now())) / 1000;
    if (gap > 60) { const r = offlineProgress(S, gap); welcome = { ...r, away: Math.min(gap, 365 * 86400) }; }
  } else { S = newCity((Math.random() * 2147483647) | 0); cloudDirty = true; }
  S.ev = S.ev || {}; S.last = Date.now(); lastCloud = Date.now() - 30000;

  /* ---------- opbouw van de UI ---------- */
  view.innerHTML = `<style>${CSS}</style><div class="sb-root">
    <canvas class="sb-cv"></canvas>
    <div class="sb-hud">
      <div class="sb-pill" data-h="money"></div><div class="sb-pill" data-h="pop"></div><div class="sb-pill" data-h="happy"></div>
      <div class="sb-pill" data-h="pw"></div><div class="sb-pill" data-h="wt"></div><div class="sb-pill" data-h="tr"></div>
      <div class="sb-pill" data-h="time"></div><button class="sb-btn" data-a="snd" aria-label="Geluid"></button><button class="sb-btn" data-a="center" aria-label="Midden">🎯</button>
    </div>
    <div class="sb-msgs"><div class="sb-tut" data-h="tut" style="display:none"></div><div data-h="toasts" style="display:flex;flex-direction:column;gap:5px;align-items:center;width:100%"></div></div>
    <div class="sb-tool" data-h="tool"></div><div class="sb-info" data-h="info"></div>
    <div class="sb-sheet" data-h="sheet"><div class="sb-sh-top"><b data-h="shtitle"></b><button class="sb-x" data-a="closesheet" aria-label="Sluiten">✕</button></div><div class="sb-sc" data-h="sc"></div></div>
    <div class="sb-tabs">
      <button class="sb-tab" data-a="tab" data-v="bouw"><span>🏗️</span>Bouwen<i></i></button><button class="sb-tab" data-a="tab" data-v="stad"><span>📊</span>Stad<i></i></button>
      <button class="sb-tab" data-a="tab" data-v="plan"><span>📈</span>Plan<i></i></button><button class="sb-tab" data-a="tab" data-v="doel"><span>🎯</span>Doelen<i></i></button>
      <button class="sb-tab" data-a="tab" data-v="meer"><span>⚙️</span>Meer<i></i></button>
    </div>
    <div class="sb-modal" data-h="modal"></div></div>`;
  const root = view.querySelector('.sb-root'), cv = root.querySelector('canvas'), c2 = cv.getContext('2d');
  const q = (k) => root.querySelector(`[data-h="${k}"]`);
  const El = { money: q('money'), pop: q('pop'), happy: q('happy'), pw: q('pw'), wt: q('wt'), tr: q('tr'), time: q('time'), tut: q('tut'), toasts: q('toasts'), tool: q('tool'), info: q('info'), sheet: q('sheet'), shtitle: q('shtitle'), sc: q('sc'), modal: q('modal') };
  glow = makeGlow();

  /* ---------- hulpjes ---------- */
  const N = () => S.size, fmtN = (n) => { n = Math.floor(n); const a = Math.abs(n); if (a < 10000) return String(n); if (a < 1e6) return (n / 1e3).toFixed(a < 1e5 ? 1 : 0).replace('.0', '') + 'k'; if (a < 1e9) return (n / 1e6).toFixed(a < 1e7 ? 2 : 1) + 'M'; return (n / 1e9).toFixed(2) + 'B'; };
  const f1 = (n) => (Math.round(n * 10) / 10).toString().replace('.', ',');
  const clock = () => (S.clock % DAYLEN) / DAYLEN * 24;
  function nightNow() { if (!S) return 0; const h = clock(); if (h >= 20 || h < 5) return 1; if (h >= 18) return (h - 18) / 2; if (h < 7) return 1 - (h - 5) / 2; return 0; }
  const recalc = () => { st = calc(S); discSet = st.disc.length ? new Set(st.disc) : null; };
  recalc();
  const sfx = (n) => audio.sfx(n);
  function toast(text, kind = '', ms = 5200) {
    news.unshift(text); if (news.length > 12) news.pop();
    const d = document.createElement('div'); d.className = 'sb-toast ' + kind; d.textContent = text; El.toasts.appendChild(d);
    while (El.toasts.children.length > 3) El.toasts.removeChild(El.toasts.firstChild);
    setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, ms);
  }
  const floatAt = (i, text, col) => floaters.push({ x: (i % N()) + 0.5, y: Math.floor(i / N()) + 0.2, text, col, t: 0 });
  function changed(snd) { recalc(); markDirty(); hud(); tutCheck(); if (snd) sfx(snd); if (sel >= 0) paintInfo(); }

  /* ---------- camera ---------- */
  function clampCam() {
    const n = N(), minZ = Math.max(12, Math.min(W / (n + 0.5), H / (n + 0.5)));
    cam.z = Math.max(minZ, Math.min(100, cam.z)); cam.x = Math.max(0, Math.min(n, cam.x)); cam.y = Math.max(0, Math.min(n, cam.y));
  }
  function fitCam() { const R = 5 + 2 * S.land; cam.x = Math.floor(N() / 2) + 0.5; cam.y = Math.floor(N() / 2) + 0.5; cam.z = Math.max(26, Math.min(64, Math.min(W / (2 * R + 3), H / (2 * R + 3)))); clampCam(); }
  const tileAt = (px, py) => ({ x: Math.floor((px - W / 2) / cam.z + cam.x), y: Math.floor((py - H / 2) / cam.z + cam.y) });
  function resize() {
    const r = root.getBoundingClientRect(); if (r.width < 10) return; dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); clampCam();
  }

  /* ---------- HUD ---------- */
  const faceOf = (h) => (h >= 80 ? '😄' : h >= 60 ? '🙂' : h >= 40 ? '😐' : h >= 20 ? '🙁' : '😠');
  const pctC = (r) => (r >= 0.999 ? '' : r >= 0.7 ? 'amb' : 'red');
  function hud() {
    if (!S || !st) return;
    const net = st.net, hh = clock(), hr = Math.floor(hh), mn = Math.floor((hh - hr) * 60);
    El.money.className = 'sb-pill' + (st.crunch ? ' red' : ''); El.money.innerHTML = `💰 ${fmtN(S.money)} <small>${net >= 0 ? '+' : ''}${f1(net)}/s</small>`;
    El.pop.innerHTML = `👥 ${fmtN(S.pop)} <small>/${fmtN(st.cap)}</small>`;
    El.happy.innerHTML = `${faceOf(st.happy)} ${Math.round(st.happy)}%`;
    El.pw.className = 'sb-pill ' + pctC(st.pr); El.pw.innerHTML = `⚡ ${Math.round(st.pr * 100)}%`;
    El.wt.className = 'sb-pill ' + pctC(st.wr); El.wt.innerHTML = `💧 ${Math.round(st.wr * 100)}%`;
    El.tr.className = 'sb-pill ' + (st.ti > 1.15 ? 'red' : st.ti > 0.9 ? 'amb' : ''); El.tr.innerHTML = `🚗 ${st.ti > 1.15 ? 'file' : st.ti > 0.9 ? 'druk' : 'vrij'}`;
    El.time.innerHTML = `${nightNow() > 0.5 ? '🌙' : '☀️'} <small>dag ${Math.floor(S.clock / DAYLEN) + 1} · ${String(hr).padStart(2, '0')}:${String(mn).padStart(2, '0')}</small>`;
    root.querySelector('[data-a="snd"]').textContent = S.snd ? '🔊' : '🔇';
  }

  /* ---------- tutorial ---------- */
  const TUT = [
    { t: '👋 Welkom, burgemeester! Tik op 🏗️ Bouwen, kies Wegen en sleep over de kaart om een paar wegen te leggen.', tab: 'bouw', f: () => (st.cnt.r || 0) >= 10 },
    { t: '🏠 Mooi! Gebouwen hebben een weg ernaast nodig. Kies Wonen en zet een Huisje naast de weg.', tab: 'bouw', f: () => (st.cnt.h || 0) >= 1 },
    { t: '🌾 Inwoners komen vanzelf. Ze willen werken: bouw onder Werk een Boerderij of Werkplaats.', tab: 'bouw', f: () => ((st.cnt.b || 0) + (st.cnt.a || 0)) >= 1 },
    { t: '🌳 Een Park (onder Groen & fun) maakt buren blij. Leg er één neer, ook zonder weg.', tab: 'bouw', f: () => (st.cnt.g || 0) >= 1 },
    { t: '🏪 Bij 8 inwoners ontgrendel je de Kiosk (Winkels). Winkels brengen extra geld op!', tab: 'bouw', f: () => (st.cnt.m || 0) >= 1 },
    { t: '📈 Open Plan en koop een stadsplan-upgrade. Dat maakt je stad sterker voor altijd.', tab: 'plan', f: () => upLevels(S) >= 1 },
    { t: '🎯 Bij Doelen vind je opdrachten met beloningen. Tik op Claimen als een doel klaar is!', tab: 'doel', f: () => S.goal >= 1 },
    { t: '🌟 Je kunt het! Let op ⚡ stroom en 💧 water bovenin, en bouw scholen, brandweer en parken. Veel plezier!', tab: '', f: () => S.pop >= 12 },
  ];
  function tutCheck() {
    if (!S || S.tut >= 99) { El.tut.style.display = 'none'; updateTabs(); return; }
    let guard = 0;
    while (S.tut < TUT.length && TUT[S.tut].f() && guard++ < 10) { S.tut++; sfx('unlock'); markDirty(); }
    if (S.tut >= TUT.length) { S.tut = 99; El.tut.style.display = 'none'; toast('Tutorial klaar. Bouw je droomstad! 🏙️', 'ok'); updateTabs(); return; }
    El.tut.style.display = 'block'; El.tut.innerHTML = `${TUT[S.tut].t}<br><button data-a="tutskip">Tutorial overslaan</button>`; updateTabs();
  }
  function updateTabs() {
    const want = S.tut < 99 && TUT[S.tut] ? TUT[S.tut].tab : '';
    root.querySelectorAll('.sb-tab').forEach((b) => {
      const v = b.dataset.v; b.classList.toggle('on', v === tab); b.classList.toggle('pulse', !!want && v === want && v !== tab);
      let dot = false;
      if (v === 'doel') dot = goalReady();
      if (v === 'stad') dot = dailyInfo(S).can && S.tut >= 99;
      if (v === 'bouw') dot = newUnlock;
      b.classList.toggle('dot', dot);
    });
  }
  let newUnlock = false;
  const goalReady = () => { const p = goalProgress(S, st); return !!(p && p[0] >= p[1]); };

  /* ---------- bouwen, slopen, kiezen ---------- */
  const PAINT = new Set(['r', 't', 'g', 'sloop']);
  function tileAct(x, y, drag) {
    const n = N(); if (x < 0 || y < 0 || x >= n || y >= n) return;
    const i = y * n + x, ch = S.g[i];
    if (!drag) {
      if (S.ev.fire && S.ev.fire.some((f) => f.i === i)) {
        const f = S.ev.fire.find((z) => z.i === i);
        if (douse(S, st, i)) { floatAt(i, '💦 Gebluste brand!', '#9fe3ff'); sfx('splash'); toast(f.cov ? 'Samen met de brandweer geblust!' : 'Goed gedaan! Je blusde de brand zelf. 🪣', 'ok'); changed(); return; }
      }
      if (S.ev.gift && S.ev.gift.i === i) { const v = takeGift(S, i); floatAt(i, `+${v} 💰`, '#ffe066'); sfx('coin'); toast(`Een cadeautje! +${v} munten 🎁`, 'ok'); changed(); return; }
      if (S.deb.includes(i)) { const v = clearDebris(S, i); floatAt(i, `+${v}`, '#ffe066'); sfx('click'); changed(); return; }
    }
    if (tool === 'sloop') {
      if (!inLand(S, i) && ch !== 'w') return;
      const r = bulldoze(S, i);
      if (r.ok) { if (r.refund) floatAt(i, `+${r.refund}`, '#ffe066'); sfx('sell'); if (sel === i) sel = -1; changed(); } else if (!drag) { toast(r.why, 'warn'); sfx('bad'); }
      return;
    }
    if (tool) {
      const r = place(S, i, tool);
      if (r.ok) { floatAt(i, `−${r.cost}`, '#ffb4b4'); changed('place'); }
      else if (!drag || r.why !== 'Hier staat al iets.') { if (!drag) { toast(r.why, 'warn'); sfx('bad'); } }
      return;
    }
    // kiezen
    if (!inLand(S, i) && ch !== 'w') { toast('Dit stuk grond is nog niet van jou. Koop het in 📈 Plan.', 'warn'); sfx('bad'); return; }
    if (BD[ch] || ch === 'x') { sel = i; if (tab) setTab(''); paintInfo(); sfx('click'); } else { sel = -1; paintInfo(); }
  }
  function line(x0, y0, x1, y1, fn) {
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx - dy, x = x0, y = y0, g = 0;
    for (;;) { fn(x, y); if ((x === x1 && y === y1) || g++ > 80) break; const e2 = 2 * err; if (e2 > -dy) { err -= dy; x += sx; } if (e2 < dx) { err += dx; y += sy; } }
  }
  function setTool(t) {
    tool = t; sel = -1; paintInfo(); paintTool(); if (t) setTab('');
  }
  function paintTool() {
    if (!tool) { El.tool.classList.remove('show'); return; }
    if (tool === 'sloop') { El.tool.innerHTML = `<span class="e">🧹</span><div><b>Slopen</b><br><small>Tik of sleep over gebouwen. Je krijgt een deel van de kosten terug.</small></div><button class="sb-b" data-a="tool0">Klaar</button>`; }
    else { const B = BD[tool]; El.tool.innerHTML = `<span class="e">${B.e}</span><div><b>${B.n}</b> · 💰 ${fmtN(buildCost(S, tool))}<br><small>${B.d}${PAINT.has(tool) ? ' Sleep om meer te bouwen.' : ''}</small></div><button class="sb-b" data-a="tool0">Klaar</button>`; }
    El.tool.classList.add('show');
  }
  function paintInfo() {
    if (sel < 0 || tool) { El.info.classList.remove('show'); return; }
    const ch = S.g[sel], B = BD[ch];
    if (ch === 'x') { El.info.innerHTML = `<h4>🧱 Puin</h4><p>Na de brand is hier puin over. Ruim het gratis op en bouw opnieuw.</p><div class="sb-row"><button class="sb-b pri" data-a="sell">Opruimen</button><button class="sb-b" data-a="closeinfo">Sluit</button></div>`; El.info.classList.add('show'); return; }
    if (!B) { El.info.classList.remove('show'); return; }
    const lv = S.lv[sel], m = [0, 1, 1.8, 3.2][lv], lines = [];
    if (S.ev.fire && S.ev.fire.some((f) => f.i === sel)) lines.push('🔥 Brand!');
    if (st.disc.includes(sel)) lines.push('⚠️ Geen weg ernaast: dit gebouw werkt niet. Leg een weg aan.');
    if (B.res) lines.push(`👥 Plek voor ${Math.round(B.res * m)} inwoners · 😊 buurt ${Math.round(st.hm[sel] + st.gadj)}%`);
    if (B.jobs) lines.push(`💼 ${Math.round(B.jobs * m)} banen`);
    if (B.shop) lines.push(`🛍️ ${Math.round(B.shop * m)} klanten`);
    if (B.pwr) lines.push(`⚡ ${Math.round(B.pwr * m)} stroom`);
    if (B.wat) lines.push(`💧 ${Math.round(B.wat * m)} water`);
    if (B.r) lines.push(`📡 Bereik ${B.r + lv - 1} tegels`);
    if (B.u) lines.push(`🧾 Onderhoud ${f1(B.u * Math.pow(m, ch === 'r' ? 1 : 0.8) * 0.6)}/s`);
    const up = canUpgrade(S, sel), canUp = ch !== 't' && !B.fixed && lv < 3;
    const refund = Math.floor(B.c * 0.5 * m * 0.8);
    El.info.innerHTML = `<h4>${B.e} ${B.n} <small>niveau ${lv}</small></h4><p>${B.d}</p><p>${lines.join('<br>')}</p>
      <div class="sb-row">${canUp ? `<button class="sb-b ${up.ok ? 'pri' : 'off'}" data-a="upbld">⬆️ Upgrade 💰${fmtN(upgradeCost(S, sel))}</button>` : ''}
      ${B.fixed ? '' : `<button class="sb-b" data-a="sell">🧹 Slopen (+${fmtN(refund)})</button>`}<button class="sb-b" data-a="closeinfo">Sluit</button></div>${canUp && !up.ok && up.why ? `<small>${esc(up.why)}</small>` : ''}`;
    El.info.classList.add('show');
  }

  /* ---------- tabbladen ---------- */
  const TITLES = { bouw: '🏗️ Bouwen', stad: '📊 Mijn stad', plan: '📈 Stadsplan', doel: '🎯 Doelen & prestaties', meer: '⚙️ Meer' };
  function setTab(t) {
    if (t === tab) t = ''; tab = t; confirmPrest = false;
    if (t) { sel = -1; paintInfo(); if (tool && t !== 'bouw') { /* tool blijft actief */ } }
    El.sheet.classList.toggle('open', !!t); El.tool.style.display = t ? 'none' : ''; lastSheet = ''; if (t) { El.shtitle.textContent = TITLES[t]; if (t === 'bouw') { newUnlock = false; } renderSheet(true); } else El.sc.innerHTML = '';
    if (t === 'bouw') El.sc.scrollTop = 0; updateTabs();
  }
  const bar = (v, max, col) => `<div class="sb-bar"><div style="width:${Math.max(0, Math.min(100, max > 0 ? v / max * 100 : 0))}%;${col ? `background:${col}` : ''}"></div></div>`;
  const kv = (a, b) => `<div class="sb-kv"><span>${a}</span><span>${b}</span></div>`;
  const ratioCol = (r) => (r >= 0.999 ? '#16a34a' : r >= 0.7 ? '#f59e0b' : '#ef4444');

  function sheetBouw() {
    let h = `<div class="sb-cats">${CATS.map((c) => `<button class="sb-chip ${catSel === c.id ? 'on' : ''}" data-a="cat" data-v="${c.id}">${c.e} ${c.n}</button>`).join('')}</div>
      <div class="sb-row" style="margin:0 0 8px"><button class="sb-b ${tool === 'sloop' ? 'pri' : ''}" data-a="pick" data-v="sloop">🧹 Slopen</button><button class="sb-b" data-a="tool0">👆 Kiezen</button></div><div class="sb-grid">`;
    for (const ch of BUILDABLE) {
      const B = BD[ch]; if (B.cat !== catSel) continue; const lock = !isUnlocked(S, ch), cost = buildCost(S, ch);
      h += `<button class="sb-card ${lock ? 'lock' : ''} ${S.money < cost && !lock ? 'poor' : ''} ${tool === ch ? 'sel' : ''}" data-a="pick" data-v="${ch}" data-cost="${cost}"><span class="e">${lock ? '🔒' : B.e}</span><b>${B.n}</b><small>${lock ? `${B.unl} inwoners` : `💰 ${fmtN(cost)}`}</small></button>`;
    }
    return h + '</div>';
  }
  function sheetStad() {
    const d = dailyInfo(S), net = st.net;
    let h = '';
    if (d.can) h += `<div class="sb-box" style="border-color:#f59e0b"><h4>🎁 Dagelijkse beloning</h4><small>Dag ${d.next} van 7 op rij: hoe langer, hoe meer.</small><div class="sb-row"><button class="sb-b good" data-a="daily">Claim 💰 ${fmtN(d.reward)}</button></div></div>`;
    h += `<div class="sb-box"><h4>${faceOf(st.happy)} Blijdschap ${Math.round(st.happy)}%</h4>${bar(st.happy, 100, ratioCol(st.happy / 70))}
      ${kv('👥 Inwoners', `${fmtN(S.pop)} van ${fmtN(st.cap)} plek`)}${kv('💼 Banen / werkenden', `${fmtN(st.jobs)} / ${fmtN(st.workers)}`)}${kv('🎓 Onderwijs', `${Math.round(st.eduR * 100)}%`)}${kv('🏥 Zorg', st.health ? 'aanwezig' : 'nog geen')}
      ${kv('⚡ Stroom', `${fmtN(st.pwr)} / ${fmtN(st.demP)}`)}${bar(st.pr, 1, ratioCol(st.pr))}${kv('💧 Water', `${fmtN(st.wat)} / ${fmtN(st.demW)}`)}${bar(st.wr, 1, ratioCol(st.wr))}
      ${kv('🚗 Verkeer', st.ti > 1.15 ? 'file! Meer wegen of bussen' : st.ti > 0.9 ? 'druk' : 'rustig')}</div>`;
    h += `<div class="sb-box"><h4>🧾 Belasting: ${S.tax}%</h4><input class="sb-slider" type="range" min="5" max="20" step="1" value="${S.tax}" data-a="tax" aria-label="Belasting"><small>Hoger = meer geld, maar inwoners worden minder blij.</small></div>`;
    h += `<div class="sb-box"><h4>💰 Budget per seconde</h4>${kv('Belasting', '+' + f1(st.taxI))}${kv('Werk en winkels', '+' + f1(st.bizI))}${kv('Gemeentefonds', '+' + f1(st.fund))}${kv('Onderhoud', '−' + f1(st.upkeep))}${kv('<b>Netto</b>', `<b style="color:${net >= 0 ? '#16a34a' : '#ef4444'}">${net >= 0 ? '+' : ''}${f1(net)}</b>`)}</div>`;
    h += `<div class="sb-box"><h4>🗺️ Kaartlaag</h4><div class="sb-row"><button class="sb-b ${layer === '' ? 'pri' : ''}" data-a="layer" data-v="">Normaal</button><button class="sb-b ${layer === 'blij' ? 'pri' : ''}" data-a="layer" data-v="blij">😊 Blijdschap</button></div></div>`;
    h += `<div class="sb-box"><h4>📰 Nieuws</h4>${news.length ? news.slice(0, 8).map((n) => `<div class="sb-news">${esc(n)}</div>`).join('') : '<small>Nog geen nieuws.</small>'}</div>`;
    return h;
  }
  function sheetPlan() {
    let h = `<small>Stadsplan-upgrades zijn permanent voor deze stad.</small>`;
    for (const u of UPG) {
      const l = S.up[u.id] || 0, maxed = l >= u.max, cost = upgCost(u, l);
      h += `<div class="sb-box"><h4>${u.e} ${u.n} <small>niveau ${l}/${u.max}</small></h4><small>${u.d}</small><div class="sb-pips" style="display:block;margin:3px 0">${Array.from({ length: u.max }, (_, k) => `<i class="${k < l ? 'on' : ''}"></i>`).join('')}</div>
        ${maxed ? '<small>✅ Maximaal</small>' : `<button class="sb-b ${S.money >= cost ? 'pri' : 'off'}" data-a="buyup" data-v="${u.id}">Koop 💰 ${fmtN(cost)}</button>`}</div>`;
    }
    const ml = maxLand(S);
    h += `<div class="sb-box"><h4>🗺️ Grond kopen</h4>${S.land >= ml ? '<small>✅ Je bezit de hele kaart.</small>' : `<small>Nu: ${2 * landR(S) + 1}×${2 * landR(S) + 1} tegels. Koop een nieuwe ring rondom je stad.</small><div class="sb-row"><button class="sb-b ${S.money >= landCost(S) ? 'pri' : 'off'}" data-a="buyland">Koop 💰 ${fmtN(landCost(S))}</button></div>`}</div>`;
    h += `<h4 style="margin:12px 0 0">🏛️ Grote projecten</h4><small>Elk project geeft +15% op al je inkomsten, voor altijd (ook na een nieuwe stad).</small>`;
    for (const p of PROJECTS) {
      const done = !!S.proj[p.id];
      h += `<div class="sb-box"><h4>${p.e} ${p.n}</h4>${done ? '<small>✅ Gebouwd</small>' : `<button class="sb-b ${S.money >= p.cost ? 'pri' : 'off'}" data-a="buyproj" data-v="${p.id}">Bouw 💰 ${fmtN(p.cost)}</button>`}</div>`;
    }
    return h;
  }
  function sheetDoel() {
    let h = '';
    const nxt = [S.goal, S.goal + 1, S.goal + 2].filter((i) => GOALS[i]);
    if (!nxt.length) h += `<div class="sb-box"><h4>🏆 Alle doelen klaar!</h4><small>Ga door met Nieuwe Stad (Meer) voor sterren.</small></div>`;
    nxt.forEach((gi, k) => {
      const G = GOALS[gi], [cur, tgt] = G.f(S, st), ok = cur >= tgt && k === 0;
      h += `<div class="sb-box" style="${k > 0 ? 'opacity:.6' : ''}"><h4>${G.e} ${G.t}</h4>${bar(cur, tgt, ok ? '#16a34a' : '')}<div class="sb-row" style="margin-top:0"><small style="flex:1">${Math.min(cur, tgt)} / ${tgt} · beloning 💰 ${fmtN(G.r)}</small>${ok ? '<button class="sb-b good" data-a="claimgoal">Claimen!</button>' : ''}</div></div>`;
    });
    h += `<h4 style="margin:14px 0 6px">🏅 Prestaties ${S.ach.length}/${ACHS.length}</h4><div class="sb-ach">${ACHS.map((a) => `<div class="${S.ach.includes(a.id) ? '' : 'no'}"><span class="e">${a.e}</span><b>${a.n}</b></div>`).join('')}</div>`;
    return h;
  }
  function sheetMeer() {
    const free = S.stars - S.spent, can = canPrestige(S);
    let h = `<div class="sb-box"><h4>🔊 Geluid</h4><div class="sb-row"><button class="sb-b ${S.snd ? 'pri' : ''}" data-a="snd">${S.snd ? 'Aan' : 'Uit'}</button></div></div>`;
    h += `<div class="sb-box"><h4>🌟 Nieuwe stad</h4><small>Bereik ${PRESTIGE_MIN} inwoners en begin opnieuw met een nieuwe, snellere stad. Je houdt sterren (+8% inkomen per ⭐), erfenissen, projecten en prestaties.</small>
      <p style="margin:6px 0">Beste in deze stad: <b>${fmtN(S.peak)}</b> inwoners · nu te winnen: <b>${starsFor(S)} ⭐</b> · je hebt <b>${S.stars} ⭐</b></p>`;
    if (!can) h += `<small>Nog ${Math.ceil(PRESTIGE_MIN - S.peak)} inwoners te gaan.</small>`;
    else if (!confirmPrest) h += `<button class="sb-b pri" data-a="prest1">Nieuwe stad beginnen…</button>`;
    else h += `<p><b>Zeker weten?</b> Deze stad verdwijnt en je krijgt ${starsFor(S)} ⭐.</p><div class="sb-row"><button class="sb-b pri" data-a="prest2">Ja, nieuwe stad!</button><button class="sb-b" data-a="prest0">Nee, blijven</button></div>`;
    h += `</div><div class="sb-box"><h4>🎁 Erfenissen <small>${free} ⭐ over</small></h4>`;
    for (const p of PERKS) { const l = S.perks[p.id] || 0, cost = perkCost(l); h += `<div class="sb-kv" style="align-items:center"><span>${p.e} <b>${p.n}</b> <small>${l}/${p.max}<br>${p.d}</small></span>${l >= p.max ? '<span>✅</span>' : `<button class="sb-b ${free >= cost ? 'pri' : 'off'}" data-a="perk" data-v="${p.id}">${cost} ⭐</button>`}</div>`; }
    h += `</div><div class="sb-box"><h4>❓ Tips</h4><small>• Gebouwen hebben een weg ernaast nodig (behalve parken, stroom en water).<br>• Brand? Tik snel op de vlammen, of bouw een brandweer.<br>• Tik op cadeautjes 🎁 en takken 🍂.<br>• Knijp of scroll om te zoomen, sleep om te schuiven.<br>• Weg-uit? Je stad verdient tot 8 uur door (50%, met Nachtploeg meer).<br>• Elk gebouw maakt nieuwe gebouwen iets duurder: upgraden is slim.</small></div>
      <div class="sb-box"><h4>💾 Opslaan</h4><small>${esc(saveMsg || 'Automatisch opgeslagen op dit apparaat en in de cloud.')}</small><div class="sb-row"><button class="sb-b" data-a="save">Nu opslaan</button><button class="sb-b" data-a="tutagain">Tutorial opnieuw</button></div></div>`;
    return h;
  }
  function renderSheet(force) {
    if (!tab || (sheetBusy && !force)) return;
    const h = tab === 'bouw' ? sheetBouw() : tab === 'stad' ? sheetStad() : tab === 'plan' ? sheetPlan() : tab === 'doel' ? sheetDoel() : sheetMeer();
    if (h === lastSheet) return; lastSheet = h; const sc = El.sc.scrollTop; El.sc.innerHTML = h; El.sc.scrollTop = sc;
  }

  /* ---------- modals ---------- */
  function modal(html) { El.modal.innerHTML = `<div class="sb-mc">${html}</div>`; El.modal.classList.add('show'); }
  function closeModal() { El.modal.classList.remove('show'); El.modal.innerHTML = ''; }
  function showChoice() {
    const C = choiceById(S.ev.choice); if (!C || El.modal.classList.contains('show')) return;
    const cost = C.cost(S);
    modal(`<div class="big">${C.t.split(' ')[0]}</div><h3>Burgemeester, een vraag!</h3><p>${esc(C.t.slice(C.t.indexOf(' ') + 1))}</p>${cost ? `<small>Kosten: 💰 ${fmtN(cost)}</small>` : ''}<div class="sb-row" style="justify-content:center"><button class="sb-b pri" data-a="choice" data-v="1">${esc(C.yes)}</button><button class="sb-b" data-a="choice" data-v="0">${esc(C.no)}</button></div>`);
  }
  function showWelcome(w) {
    const mins = Math.floor(w.away / 60), hrs = Math.floor(mins / 60), t = hrs ? `${hrs} uur en ${mins % 60} min` : `${mins} min`;
    modal(`<div class="big">🌅</div><h3>Welkom terug!</h3><p>Je was ${t} weg. Je stad werkte rustig door${w.secs < w.away ? ' (maximaal 8 uur)' : ''}.</p><p style="font-size:1.3rem;margin:6px 0"><b>+${fmtN(Math.max(0, w.gain))} 💰</b>${w.pop > 0.5 ? ` · <b>+${fmtN(w.pop)} 👥</b>` : ''}</p><small>Je verdiende ${Math.round(w.eff * 100)}% terwijl je weg was. Upgrade Nachtploeg voor meer.</small><div class="sb-row" style="justify-content:center"><button class="sb-b pri" data-a="modalok">Top!</button></div>`);
    sfx('coin');
  }
  function showDaily() {
    const d = dailyInfo(S); if (!d.can || El.modal.classList.contains('show')) return;
    modal(`<div class="big">🎁</div><h3>Dagelijkse beloning</h3><p>Dag ${d.next} van 7 op rij. Kom elke dag terug voor meer!</p><div class="sb-row" style="justify-content:center"><button class="sb-b good" data-a="daily">Claim 💰 ${fmtN(d.reward)}</button><button class="sb-b" data-a="modalok">Later</button></div>`);
  }

  /* ---------- klikken ---------- */
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]'); if (!b || !root.contains(b) || b.tagName === 'INPUT') return;
    const a = b.dataset.a, v = b.dataset.v; audio.start();
    switch (a) {
      case 'tab': sfx('click'); setTab(v); break;
      case 'closesheet': setTab(''); break;
      case 'cat': catSel = v; renderSheet(true); break;
      case 'pick': {
        if (v === 'sloop') { setTool('sloop'); break; }
        if (!isUnlocked(S, v)) { toast(`${BD[v].n} ontgrendel je bij ${BD[v].unl} inwoners.`, 'warn'); sfx('bad'); break; }
        setTool(v); sfx('click'); break;
      }
      case 'tool0': setTool(null); break;
      case 'closeinfo': sel = -1; paintInfo(); break;
      case 'snd': S.snd = S.snd ? 0 : 1; if (S.snd) { audio.start(); sfx('click'); } hud(); markDirty(); renderSheet(true); break;
      case 'center': fitCam(); break;
      case 'tutskip': S.tut = 99; markDirty(); tutCheck(); break;
      case 'tutagain': S.tut = 0; tutCheck(); markDirty(); break;
      case 'upbld': { const r = upgradeBuilding(S, sel); if (r.ok) { floatAt(sel, '⬆️ Niveau ' + S.lv[sel], '#fff'); changed('upg'); } else { toast(r.why, 'warn'); sfx('bad'); } break; }
      case 'sell': { const r = bulldoze(S, sel); if (r.ok) { if (r.refund) floatAt(sel, `+${r.refund}`, '#ffe066'); sel = -1; changed('sell'); paintInfo(); } break; }
      case 'buyup': { const r = buyUp(S, v); if (r.ok) { changed('upg'); renderSheet(true); } else { toast(r.why, 'warn'); sfx('bad'); } break; }
      case 'buyland': { const r = buyLand(S); if (r.ok) { toast('Nieuwe grond gekocht! Je stad kan groeien. 🗺️', 'ok'); changed('unlock'); renderSheet(true); } else { toast(r.why, 'warn'); sfx('bad'); } break; }
      case 'buyproj': { const r = buyProject(S, v); if (r.ok) { toast('Groot project klaar! +15% inkomen 🎉', 'ok'); changed('ach'); renderSheet(true); } else { toast(r.why, 'warn'); sfx('bad'); } break; }
      case 'claimgoal': { const G = claimGoal(S, st); if (G) { toast(`Doel gehaald: +${fmtN(G.r)} 💰`, 'ok'); changed('coin'); renderSheet(true); } break; }
      case 'daily': { const r = claimDaily(S); if (r) { toast(`Dagelijkse beloning: +${fmtN(r.reward)} 💰 (dag ${r.next})`, 'ok'); changed('coin'); } closeModal(); renderSheet(true); break; }
      case 'modalok': closeModal(); sfx('click'); break;
      case 'choice': { const msg = resolveChoice(S, S.ev.choice, v === '1'); S.ev.choice = null; toast(msg, v === '1' ? 'ok' : ''); closeModal(); changed(v === '1' ? 'party' : 'click'); break; }
      case 'layer': layer = v; renderSheet(true); break;
      case 'perk': { const r = buyPerk(S, v); if (r.ok) { sfx('upg'); markDirty(); renderSheet(true); } else { toast(r.why, 'warn'); sfx('bad'); } break; }
      case 'prest1': confirmPrest = true; renderSheet(true); break;
      case 'prest0': confirmPrest = false; renderSheet(true); break;
      case 'prest2': doPrestige(); break;
      case 'save': cloudDirty = true; cloudSave(true).then(() => { if (alive) renderSheet(true); }); writeLocal(); saveMsg = 'Opgeslagen ✅'; renderSheet(true); break;
      default: break;
    }
  });
  root.addEventListener('input', (e) => {
    const b = e.target; if (b && b.dataset && b.dataset.a === 'tax') { S.tax = Math.max(5, Math.min(20, +b.value || 10)); recalc(); hud(); markDirty(); const h4 = b.parentNode.querySelector('h4'); if (h4) h4.textContent = `🧾 Belasting: ${S.tax}%`; lastSheet = ''; }
  });
  El.sheet.addEventListener('pointerdown', () => { sheetBusy = true; });
  const rel = () => { sheetBusy = false; };
  window.addEventListener('pointerup', rel); window.addEventListener('pointercancel', rel); cleanups.push(() => { window.removeEventListener('pointerup', rel); window.removeEventListener('pointercancel', rel); });

  function doPrestige() {
    if (!canPrestige(S)) return;
    cloudDirty = true; const old = S, res = prestige(S, (Math.random() * 2147483647) | 0); S = res.S; S.ev = {}; confirmPrest = false; tool = null; sel = -1; layer = '';
    recalc(); fitCam(); cars.length = 0; setTab(''); paintTool(); paintInfo(); S.last = Date.now(); writeLocal(); cloudSave(true);
    modal(`<div class="big">🌟</div><h3>Een nieuwe stad!</h3><p>Je won <b>${res.gain} ⭐</b>. Je hebt nu ${S.stars} sterren: +${Math.round(S.stars * 8)}% inkomen.</p><small>Besteed sterren aan erfenissen in Meer.</small><div class="sb-row" style="justify-content:center"><button class="sb-b pri" data-a="modalok">Aan de slag!</button></div>`); sfx('ach'); hud(); void old;
  }

  /* ---------- invoer op de kaart ---------- */
  const ptrs = new Map(); let g0 = null, pinch = null;
  cv.addEventListener('pointerdown', (e) => {
    audio.start(); try { cv.setPointerCapture(e.pointerId); } catch (er) { /* oké */ }
    ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
    if (ptrs.size === 1) {
      g0 = { x: e.offsetX, y: e.offsetY, cx: cam.x, cy: cam.y, moved: false, t: Date.now(), paint: !!tool && PAINT.has(tool) };
      if (g0.paint) { const t = tileAt(e.offsetX, e.offsetY); tileAct(t.x, t.y, false); g0.last = t; g0.moved = true; }
      if (tool && !g0.paint) { const t = tileAt(e.offsetX, e.offsetY); updateGhost(t.x, t.y); }
    } else if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: cam.z, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, cx: cam.x, cy: cam.y }; if (g0) { g0.moved = true; g0.paint = false; }
    }
  });
  cv.addEventListener('pointermove', (e) => {
    const p = ptrs.get(e.pointerId);
    if (!p) { if (tool) { const t = tileAt(e.offsetX, e.offsetY); updateGhost(t.x, t.y); } return; }
    p.x = e.offsetX; p.y = e.offsetY;
    if (ptrs.size === 1 && g0) {
      const dx = e.offsetX - g0.x, dy = e.offsetY - g0.y;
      if (g0.paint) { const t = tileAt(e.offsetX, e.offsetY); if (g0.last && (t.x !== g0.last.x || t.y !== g0.last.y)) { line(g0.last.x, g0.last.y, t.x, t.y, (x, y) => { if (x !== g0.last.x || y !== g0.last.y) tileAct(x, y, true); }); g0.last = t; } updateGhost(t.x, t.y); }
      else { if (!g0.moved && Math.hypot(dx, dy) > 6) g0.moved = true; if (g0.moved) { cam.x = g0.cx - dx / cam.z; cam.y = g0.cy - dy / cam.z; clampCam(); } if (tool) { const t = tileAt(e.offsetX, e.offsetY); updateGhost(t.x, t.y); } }
    } else if (ptrs.size >= 2 && pinch) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y) || 1, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const wx = (pinch.mx - W / 2) / pinch.z + pinch.cx, wy = (pinch.my - H / 2) / pinch.z + pinch.cy;
      cam.z = pinch.z * (d / pinch.d); clampCam(); cam.x = wx - (mx - W / 2) / cam.z; cam.y = wy - (my - H / 2) / cam.z; clampCam();
    }
  });
  const up = (e) => {
    const had = ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (had && ptrs.size === 0 && g0) {
      if (!g0.moved && !g0.paint && Date.now() - g0.t < 700 && e.type === 'pointerup') { const t = tileAt(g0.x, g0.y); tileAct(t.x, t.y, false); if (tool) updateGhost(t.x, t.y); }
      g0 = null;
    }
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', () => { if (!ptrs.size) { ghost = null; } });
  cv.addEventListener('wheel', (e) => {
    e.preventDefault(); const wx = (e.offsetX - W / 2) / cam.z + cam.x, wy = (e.offsetY - H / 2) / cam.z + cam.y;
    cam.z *= Math.exp(-e.deltaY * 0.0016); clampCam(); cam.x = wx - (e.offsetX - W / 2) / cam.z; cam.y = wy - (e.offsetY - H / 2) / cam.z; clampCam();
  }, { passive: false });
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  function updateGhost(x, y) {
    if (!tool || x < 0 || y < 0 || x >= N() || y >= N()) { ghost = null; return; }
    const i = y * N() + x; let ok;
    if (tool === 'sloop') ok = !!(BD[S.g[i]] && !BD[S.g[i]].fixed) || S.g[i] === 'x' || S.g[i] === 't'; else ok = canPlace(S, i, tool).ok;
    ghost = { x, y, ok };
  }
  const onKey = (e) => {
    if (!view.isConnected) return; const tg = e.target && e.target.tagName; if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return;
    const k = e.key, s = 0.9;
    if (k === 'ArrowLeft' || k === 'a') cam.x -= s; else if (k === 'ArrowRight' || k === 'd') cam.x += s; else if (k === 'ArrowUp' || k === 'w') cam.y -= s; else if (k === 'ArrowDown' || k === 's') cam.y += s;
    else if (k === '+' || k === '=') cam.z *= 1.15; else if (k === '-' || k === '_') cam.z /= 1.15; else if (k === 'Escape') { setTool(null); sel = -1; paintInfo(); setTab(''); closeModal(); } else return;
    clampCam(); if (k.startsWith('Arrow')) e.preventDefault();
  };
  window.addEventListener('keydown', onKey); cleanups.push(() => window.removeEventListener('keydown', onKey));

  /* ---------- spelloop ---------- */
  const hooks = { news: (t, k) => toast(t, k), sfx };
  function tick() {
    if (!alive || !S) return;
    if (!view.isConnected) return;                     // niet zichtbaar: pauzeren (tijd telt dan als 'weg')
    const now = Date.now(); let dt = (now - lastTick) / 1000; lastTick = now;
    if (dt > 25) { const r = offlineProgress(S, dt); recalc(); if (dt > 60) showWelcome({ ...r, away: dt }); dt = 0; }
    dt = Math.min(dt, 25);
    for (let rem = dt; rem > 0.001;) { const d = Math.min(rem, 2); st = step(S, d); rem -= d; }
    if (dt > 0) {
      const before = (S.ev.fire || []).length;
      tickEvents(S, st, dt, Math.random, hooks);
      void before;
    }
    recalc();
    const got = checkAch(S, st);
    for (const a of got) { toast(`Prestatie: ${a.e} ${a.n}${a.r ? ` (+${fmtN(a.r)} 💰)` : ''}`, 'ok', 6500); sfx('ach'); }
    const up2 = unlockPop(S);
    if (up2 > lastUnl) { const nb = BUILDABLE.filter((c) => BD[c].unl > lastUnl && BD[c].unl <= up2); if (nb.length) { toast(`Nieuw: ${nb.map((c) => BD[c].e + ' ' + BD[c].n).join(', ')}`, 'ok', 7000); sfx('unlock'); newUnlock = true; } lastUnl = up2; }
    const gr = goalReady(); if (gr && !lastGoalReady) { toast('Doel gehaald! Tik op 🎯 om te claimen.', 'ok'); sfx('ach'); } lastGoalReady = gr;
    if (S.ev.choice) showChoice();
    tutCheck(); hud(); renderSheet(); if (tool) paintTool(); if (sel >= 0) paintInfo();
    const d0 = dailyInfo(S); if (d0.can && S.tut >= 99 && !welcome && !dailyShown) { dailyShown = true; showDaily(); }
    if (now - lastLocalAuto > 15000) { lastLocalAuto = now; markDirty(); }
    cloudSave(false);
  }
  let lastLocalAuto = Date.now(), dailyShown = false;
  if (welcome) showWelcome(welcome);
  lastUnl = unlockPop(S);

  function frame(ts) {
    raf = 0; if (!alive) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (ts - lastT) / 1000); lastT = ts;
    if (!view.isConnected || document.hidden) return;
    tAnim += dt;
    const want = Math.min(36, Math.floor(st.roads * 0.7 * Math.min(1.4, 0.3 + st.load / Math.max(1, st.roadCap) * 1.4)));
    carsStep(cars, S, dt, st.roads > 3 ? Math.max(2, want) : 0);
    for (const f of floaters) f.t += dt; for (let k = floaters.length - 1; k >= 0; k--) if (floaters[k].t > 1.6) floaters.splice(k, 1);
    const range = (() => { const i = tool ? (ghost ? ghost.y * N() + ghost.x : -1) : sel, ch = i >= 0 ? (tool || S.g[i]) : ''; const B = BD[ch]; if (B && B.r && !B.fixed) { const lv = tool ? 1 : S.lv[i]; return { x: (tool ? ghost.x : i % N()), y: (tool ? ghost.y : Math.floor(i / N())), r: B.r + lv - 1 }; } return null; })();
    drawCity(c2, { S, st, cam, t: tAnim, night: nightNow(), cars, floaters, tool, ghost, sel, layer, W, H, dpr, glow, discSet, range });
  }
  const startRaf = () => { if (!raf) raf = requestAnimationFrame(frame); };

  // opruimen
  let ro = null;
  try { ro = new ResizeObserver(() => resize()); ro.observe(root); } catch (e) { window.addEventListener('resize', resize); cleanups.push(() => window.removeEventListener('resize', resize)); }
  const onVis = () => { if (document.hidden) { if (S && localDirty) writeLocal(); } else { lastT = performance.now(); } };
  const onHide = () => { if (S) { writeLocal(); cloudSave(true); } };
  document.addEventListener('visibilitychange', onVis); window.addEventListener('pagehide', onHide);
  cleanups.push(() => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('pagehide', onHide); });
  addCleanup(() => {
    alive = false; if (raf) cancelAnimationFrame(raf); raf = 0; if (tickT) clearInterval(tickT); if (saveT) clearInterval(saveT); if (localT) clearTimeout(localT); if (toastT) clearTimeout(toastT);
    cleanups.forEach((f) => { try { f(); } catch (e) { /* niets */ } }); if (ro) { try { ro.disconnect(); } catch (e) { /* niets */ } }
    if (S) { try { writeLocal(); } catch (e) { /* niets */ } cloudDirty = true; cloudSave(true); }
    audio.stop();
  });

  resize(); fitCam(); hud(); tutCheck(); startRaf();
  tickT = setInterval(tick, 500);
  if (S.snd) { /* muziek start bij de eerste tik/klik (browser eist een gebaar) */ }
  saveT = setInterval(() => { if (S && localDirty) writeLocal(); }, 5000);
  toast(S.tut < 99 ? 'Welkom in Stadbouwer! 🏙️' : 'Welkom terug in je stad! 🏙️', 'ok', 3500);
}
