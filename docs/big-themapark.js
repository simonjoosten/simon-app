// Themapark Tycoon: een groot, diep pretpark-spel (isometrisch canvas). Bouw wegen, attracties, kraampjes en decoratie,
// trek bezoekers, stel prijzen in, neem personeel aan, doe onderzoek, breid uit, open meer parken en begin een nieuwe franchise.
// Opslag: local-first (localStorage), cloud (gamesaves/big-themapark__<uid>) max. 1x per 60 s en bij sluiten.
// Alles in dit bestand is zelfstandig. De pure spellogica (bovenste helft) werkt ook zonder browser (zie tools/test-big-themapark.mjs).

/* =====================================================================
   1. CONSTANTEN EN HULPFUNCTIES
   ===================================================================== */
export const VERSION = 1;
export const TW = 64, TH = 32;            // tegelbreedte/-hoogte in wereldpixels (isometrisch)
export const DAY = 150;                   // een speeldag in seconden
const SEASONS = ['Lente', 'Zomer', 'Herfst', 'Winter'];
const MAXSAVE = 18000;
const OFFLINE_MAX = 8 * 3600;
const STEP = 0.1;                         // vaste simulatiestap (s)
const MAX_GUESTS_BASE = 70;

let R = Math.random;
export function setRng(f) { R = f || Math.random; }
export function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rr = (a, b) => a + (b - a) * R();
const ri = (a, b) => Math.floor(rr(a, b + 1));
const pick = (arr) => arr[Math.floor(R() * arr.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const cl01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function fmtN(n) {
  n = Math.floor(n || 0);
  const a = Math.abs(n), s = n < 0 ? '-' : '';
  const f = (v, u) => { let t = v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2); if (t.includes('.')) t = t.replace(/0+$/, '').replace(/\.$/, ''); return s + t.replace('.', ',') + u; };
  if (a < 10000) return s + String(a).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (a < 1e6) return f(a / 1e3, ' k');
  if (a < 1e9) return f(a / 1e6, ' mln');
  if (a < 1e12) return f(a / 1e9, ' mld');
  return f(a / 1e12, ' bln');
}
export const fmtM = (n) => '€' + fmtN(n);
const fmtMs = (n) => (n < 100 ? '€' + (Math.round(n * 10) / 10).toString().replace('.', ',') : fmtM(n));

/* =====================================================================
   2. CATALOGUS: attracties, kraampjes, voorzieningen, decoratie
   ===================================================================== */
export const DEFS = {};
export const ORDER = [];                  // alleen achteraan aanvullen: de index wordt in de save gebruikt
function def(id, o) { DEFS[id] = { id, up: 0, ...o }; ORDER.push(id); }
// attracties: cap = plekken, dur = ritduur (s), thr = spanning (1..10), pr = standaard kaartje, c = prijs, rp = onderzoekspunten
def('theekopjes', { k: 'ride', n: 'Theekopjes', e: '☕', w: 2, h: 2, c: 180, rp: 0, cap: 4, dur: 9, thr: 2, pr: 2, col: '#f08fb0', d: 'Rustig rondtollen. Perfect voor de kleintjes.' });
def('draaimolen', { k: 'ride', n: 'Draaimolen', e: '🎠', w: 2, h: 2, c: 320, rp: 0, cap: 6, dur: 11, thr: 2.5, pr: 3, col: '#ffb347', d: 'Paardjes, muziek en lichtjes.' });
def('kinderboerderij', { k: 'ride', n: 'Kinderboerderij', e: '🐐', w: 3, h: 2, c: 520, rp: 50, cap: 8, dur: 10, thr: 1.5, pr: 3, col: '#8fd18c', d: 'Geitjes aaien! Kinderen dol op.' });
def('botsauto', { k: 'ride', n: "Botsauto's", e: '🚗', w: 3, h: 3, c: 1200, rp: 140, cap: 8, dur: 14, thr: 5, pr: 6, col: '#56a8ff', d: 'Bonk! Lekker botsen.' });
def('spookhuis', { k: 'ride', n: 'Spookhuis', e: '👻', w: 3, h: 3, c: 2600, rp: 380, cap: 10, dur: 15, thr: 5.5, pr: 9, col: '#8a6bd6', d: 'Een beetje griezelen, veel lachen.' });
def('reuzenrad', { k: 'ride', n: 'Reuzenrad', e: '🎡', w: 3, h: 3, c: 5200, rp: 850, cap: 16, dur: 24, thr: 4.5, pr: 12, col: '#ff6f91', d: 'Prachtig uitzicht over het park.' });
def('piratenschip', { k: 'ride', n: 'Piratenschip', e: '⛵', w: 3, h: 3, c: 9000, rp: 1800, cap: 18, dur: 16, thr: 7, pr: 18, col: '#c0392b', d: 'Zwiepend heen en weer, joehoe!' });
def('waterglijbaan', { k: 'ride', n: 'Waterglijbaan', e: '💦', w: 3, h: 3, c: 15000, rp: 3400, cap: 10, dur: 10, thr: 6.5, pr: 22, col: '#2ec4d6', d: 'Splash! Heerlijk op een warme dag.' });
def('achtbaan', { k: 'ride', n: 'Achtbaan', e: '🎢', w: 4, h: 4, c: 34000, rp: 7000, cap: 24, dur: 22, thr: 9, pr: 40, col: '#e63946', d: 'De hoofdattractie. Hoor ze gillen!' });
def('valtoren', { k: 'ride', n: 'Valtoren', e: '🗼', w: 2, h: 2, c: 55000, rp: 13000, cap: 12, dur: 12, thr: 9.5, pr: 55, col: '#7b2cbf', d: 'Omhoog... en dan vallen!' });
def('draakentrein', { k: 'ride', n: 'Draakentrein', e: '🐉', w: 4, h: 3, c: 110000, rp: 26000, cap: 30, dur: 36, thr: 8, pr: 80, col: '#2a9d8f', d: 'Een lange trein door het sprookjesbos.' });
// kraampjes: hun = honger weg, thi = dorst weg (negatief = meer dorst), hap = blij, pr = prijs
def('ijskraam', { k: 'food', n: 'IJskraam', e: '🍦', w: 1, h: 1, c: 90, rp: 0, pr: 2.5, hun: 0.3, thi: 0.12, hap: 0.06, col: '#ffd6e0', d: 'IJsjes! Verkoopt goed als de zon schijnt.' });
def('drinkkraam', { k: 'food', n: 'Drinkkraam', e: '🥤', w: 1, h: 1, c: 80, rp: 0, pr: 2, hun: 0, thi: 0.7, hap: 0.03, col: '#9be564', d: 'Fris tegen de dorst.' });
def('patat', { k: 'food', n: 'Patatkraam', e: '🍟', w: 1, h: 1, c: 160, rp: 40, pr: 4, hun: 0.55, thi: -0.1, hap: 0.05, col: '#ffd23f', d: 'Warme friet met mayo.' });
def('popcorn', { k: 'food', n: 'Popcornkar', e: '🍿', w: 1, h: 1, c: 240, rp: 110, pr: 3.5, hun: 0.3, thi: -0.15, hap: 0.08, col: '#ff595e', d: 'Knisper knasper.' });
def('souvenir', { k: 'shop', n: 'Souvenirwinkel', e: '🎁', w: 2, h: 1, c: 450, rp: 300, pr: 9, hun: 0, thi: 0, hap: 0.2, col: '#b5179e', d: 'Pluchebeesten en petjes.' });
def('pizza', { k: 'food', n: 'Pizzatent', e: '🍕', w: 2, h: 1, c: 700, rp: 500, pr: 8, hun: 0.85, thi: -0.05, hap: 0.08, col: '#e76f51', d: 'Grote punten, grote honger.' });
def('restaurant', { k: 'food', n: 'Restaurant', e: '🍔', w: 2, h: 2, c: 2000, rp: 1100, pr: 16, hun: 1, thi: 0.6, hap: 0.14, col: '#f4a261', d: 'Zitten, eten en uitrusten.' });
def('toilet', { k: 'wc', n: 'Toiletten', e: '🚻', w: 2, h: 1, c: 120, rp: 0, pr: 0, col: '#8ecae6', d: 'Heel belangrijk!' });
def('bankje', { k: 'bench', n: 'Bankje', e: '🪑', w: 1, h: 1, c: 25, rp: 0, pr: 0, col: '#b08968', d: 'Even uitrusten.' });
def('prullenbak', { k: 'bin', n: 'Prullenbak', e: '🗑️', w: 1, h: 1, c: 18, rp: 20, pr: 0, col: '#6c757d', d: 'Minder rommel op straat.' });
def('lab', { k: 'lab', n: 'Onderzoekslab', e: '🔬', w: 3, h: 2, c: 2500, rp: 0, pr: 0, rps: 1.2, col: '#4cc9f0', d: 'Levert extra onderzoekspunten op.' });
// decoratie: bty = schoonheid
def('boom', { k: 'decor', n: 'Boom', e: '🌳', w: 1, h: 1, c: 20, rp: 0, bty: 1.2, d: 'Schaduw en groen.' });
def('struik', { k: 'decor', n: 'Struik', e: '🌿', w: 1, h: 1, c: 10, rp: 0, bty: 0.6, d: 'Een beetje groen.' });
def('bloemen', { k: 'decor', n: 'Bloemen', e: '🌷', w: 1, h: 1, c: 14, rp: 0, bty: 0.9, d: 'Kleurige bloemetjes.' });
def('vijver', { k: 'decor', n: 'Vijver', e: '💧', w: 1, h: 1, c: 30, rp: 0, bty: 1.5, d: 'Een plasje water met eendjes.' });
def('lantaarn', { k: 'decor', n: 'Lantaarn', e: '🏮', w: 1, h: 1, c: 45, rp: 80, bty: 1, d: 'Verlicht het park in de avond.' });
def('fontein', { k: 'decor', n: 'Fontein', e: '⛲', w: 2, h: 2, c: 420, rp: 200, bty: 6, d: 'Spetterend mooi.' });
def('bloemperk', { k: 'decor', n: 'Bloemperk', e: '🌸', w: 2, h: 2, c: 160, rp: 120, bty: 3, d: 'Een groot bed vol bloemen.' });
def('standbeeld', { k: 'decor', n: 'Clownbeeld', e: '🤡', w: 1, h: 1, c: 320, rp: 450, bty: 4, d: 'Het park heeft een mascotte.' });
def('tent', { k: 'decor', n: 'Feesttent', e: '🎪', w: 2, h: 2, c: 900, rp: 900, bty: 8, d: 'Vlaggetjes en feest.' });

export const CATS = [
  ['rides', '🎢', 'Attracties', ['theekopjes', 'draaimolen', 'kinderboerderij', 'botsauto', 'spookhuis', 'reuzenrad', 'piratenschip', 'waterglijbaan', 'achtbaan', 'valtoren', 'draakentrein']],
  ['food', '🍦', 'Eten & drinken', ['ijskraam', 'drinkkraam', 'patat', 'popcorn', 'pizza', 'restaurant', 'souvenir']],
  ['fac', '🚻', 'Voorzieningen', ['toilet', 'bankje', 'prullenbak', 'lab']],
  ['deco', '🌳', 'Decoratie', ['boom', 'struik', 'bloemen', 'vijver', 'lantaarn', 'bloemperk', 'fontein', 'standbeeld', 'tent']],
];
export const ROAD_COST = 5;

// Onderzoek-voordelen (meerdere niveaus)
export const PERKS = {
  kassa: { n: 'Slimme kassa', e: '💳', max: 5, base: 400, mul: 2.6, d: '+8% inkomen per niveau' },
  labteam: { n: 'Laboratoriumteam', e: '🧪', max: 3, base: 250, mul: 3.5, d: '+25% onderzoekspunten per niveau' },
  gereedschap: { n: 'Gereedschapskist', e: '🧰', max: 3, base: 300, mul: 3.2, d: 'Monteurs 30% sneller, minder slijtage' },
  suiger: { n: 'Superzuiger', e: '🧹', max: 3, base: 200, mul: 3, d: 'Schoonmakers 40% sneller' },
  landmeter: { n: 'Landmeter', e: '📐', max: 3, base: 600, mul: 3, d: 'Uitbreiding 20% goedkoper' },
  reclame: { n: 'Reclamebureau', e: '📣', max: 3, base: 500, mul: 3, d: 'Campagnes duren 50% langer' },
  bouwtech: { n: 'Bouwtechniek', e: '🏗️', max: 3, base: 800, mul: 3.4, d: 'Bouwkosten 5% lager' },
};
export const perkCost = (id, lvl) => Math.round(PERKS[id].base * Math.pow(PERKS[id].mul, lvl));

// Franchise-voordelen (gouden tickets)
export const FRANCHISE = {
  goud: { n: 'Gouden kassa', e: '💰', max: 30, d: '+15% inkomen per niveau', cost: (l) => 1 + Math.floor(l * 0.8) },
  bouw: { n: 'Bouwvakkers', e: '👷', max: 10, d: 'Bouwen 5% goedkoper', cost: (l) => 2 + l * 2 },
  start: { n: 'Startkapitaal', e: '🏦', max: 10, d: '+€1.500 startgeld per niveau', cost: (l) => 1 + l },
  geest: { n: 'Onderzoeksgeest', e: '💡', max: 10, d: '+20% onderzoekspunten', cost: (l) => 2 + l * 2 },
  fan: { n: 'Fanclub', e: '🎉', max: 10, d: '+10% bezoekers', cost: (l) => 3 + l * 2 },
  staf: { n: 'Superstaf', e: '🦺', max: 5, d: '+2 personeelsplekken per soort', cost: (l) => 3 + l * 3 },
  slaap: { n: 'Nachtploeg', e: '🌙', max: 6, d: 'Offline verdienen +5% efficiënter', cost: (l) => 2 + l * 2 },
};

// Marketingcampagnes: kosten = seconden inkomen, boost op bezoekersaantal
export const CAMPAIGNS = [
  { id: 'flyers', n: 'Flyers', e: '📄', secs: 45, mult: 1.5, dur: 180, min: 150 },
  { id: 'radio', n: 'Radiospot', e: '📻', secs: 110, mult: 2, dur: 180, min: 800 },
  { id: 'tv', n: 'TV-reclame', e: '📺', secs: 320, mult: 3, dur: 240, min: 5000 },
];

// Parken
export const PARKS = [
  { id: 'zon', n: 'Zonnepark', e: '🌞', theme: 'meadow', cost: 0, sizes: [16, 20, 24, 28], expand: [0, 4000, 26000, 160000], d: 'Je eerste park. Met vier seizoenen.' },
  { id: 'strand', n: 'Zandstrand', e: '🏖️', theme: 'beach', cost: 75000, sizes: [16, 20, 24, 28], expand: [0, 20000, 120000, 600000], d: 'Altijd zomer. Water is hier extra populair.' },
  { id: 'berg', n: 'IJsberg', e: '🏔️', theme: 'snow', cost: 400000, sizes: [16, 20, 24, 28], expand: [0, 90000, 500000, 2500000], d: 'Sneeuw en kerstlichtjes. Gezellig!' },
];

/* =====================================================================
   3. ONDERZOEK-LIJST, DOELEN EN PRESTATIES
   ===================================================================== */
export function researchList() {
  const out = [];
  for (const id of ORDER) { const d = DEFS[id]; if (d.rp > 0) out.push({ id, type: 'def', rp: d.rp, n: d.n, e: d.e, d: d.d }); }
  out.sort((a, b) => a.rp - b.rp);
  return out;
}
export const isUnlocked = (G, id) => DEFS[id].rp === 0 || !!G.res[id];

export const RIDE_UP = [0, 0.6, 1.4, 3];    // kosten van upgrade naar niveau 1..3 (x basisprijs)

const rideCount = (G) => G.parks.reduce((s, P) => s + P.objs.filter((o) => DEFS[o.t].k === 'ride').length, 0);
const objCount = (G, kinds) => G.parks.reduce((s, P) => s + P.objs.filter((o) => kinds.includes(DEFS[o.t].k)).length, 0);
const hasObj = (G, t) => G.parks.some((P) => P.objs.some((o) => o.t === t));
const bestStars = (G) => Math.max(...G.parks.map((P) => P.rs || 0));
const roadsBuilt = (G) => G.parks.reduce((s, P) => { let c = 0; for (let i = 0; i < P.roads.length; i++) c += P.roads[i]; return s + c; }, 0);

// doelen (per franchise-ronde). prog -> [huidig, doel]
export const GOALS = [
  { id: 'g1', t: 'Leg 10 stukjes weg', prog: (G) => [roadsBuilt(G), 10], rw: { m: 60, s: 0 } },
  { id: 'g2', t: 'Bouw je eerste attractie', prog: (G) => [rideCount(G), 1], rw: { m: 100, s: 0 } },
  { id: 'g3', t: 'Bouw een eet- of drinkkraam', prog: (G) => [objCount(G, ['food']), 1], rw: { m: 100, s: 0 } },
  { id: 'g4', t: 'Ontvang 15 bezoekers', prog: (G) => [G.st.visitors, 15], rw: { m: 150, s: 0 } },
  { id: 'g5', t: 'Bouw toiletten', prog: (G) => [hasObj(G, 'toilet') ? 1 : 0, 1], rw: { m: 150, s: 0 } },
  { id: 'g6', t: 'Bouw 3 attracties', prog: (G) => [rideCount(G), 3], rw: { m: 250, s: 40 } },
  { id: 'g7', t: 'Haal 2 sterren', prog: (G) => [Math.floor(bestStars(G) * 10) / 10, 2], rw: { m: 300, s: 60 } },
  { id: 'g8', t: 'Verdien in totaal €3.000', prog: (G) => [G.earnedRun, 3000], rw: { m: 300, s: 60, rp: 20 } },
  { id: 'g9', t: 'Bouw het onderzoekslab', prog: (G) => [hasObj(G, 'lab') ? 1 : 0, 1], rw: { m: 300, s: 60 } },
  { id: 'g10', t: 'Ontdek je eerste onderzoek', prog: (G) => [Object.keys(G.res).length, 1], rw: { m: 300, s: 60, rp: 30 } },
  { id: 'g11', t: 'Neem een monteur aan', prog: (G) => [G.parks.reduce((s, P) => s + P.staff.m, 0), 1], rw: { m: 300, s: 60 } },
  { id: 'g12', t: 'Neem een schoonmaker aan', prog: (G) => [G.parks.reduce((s, P) => s + P.staff.j, 0), 1], rw: { m: 300, s: 60 } },
  { id: 'g13', t: 'Zet 10 stukjes decoratie neer', prog: (G) => [objCount(G, ['decor']), 10], rw: { m: 400, s: 80 } },
  { id: 'g14', t: 'Ontvang 100 bezoekers', prog: (G) => [G.st.visitors, 100], rw: { m: 500, s: 90, rp: 40 } },
  { id: 'g15', t: 'Haal 3 sterren', prog: (G) => [Math.floor(bestStars(G) * 10) / 10, 3], rw: { m: 800, s: 120 } },
  { id: 'g16', t: 'Bouw 5 attracties', prog: (G) => [rideCount(G), 5], rw: { m: 800, s: 120 } },
  { id: 'g17', t: 'Bouw een Reuzenrad', prog: (G) => [hasObj(G, 'reuzenrad') ? 1 : 0, 1], rw: { m: 800, s: 150, rp: 100 } },
  { id: 'g18', t: 'Verdien in totaal €50.000', prog: (G) => [G.earnedRun, 50000], rw: { m: 800, s: 150, rp: 150 } },
  { id: 'g19', t: 'Start een marketingcampagne', prog: (G) => [G.st.camps, 1], rw: { m: 800, s: 100 } },
  { id: 'g20', t: 'Ontvang 500 bezoekers', prog: (G) => [G.st.visitors, 500], rw: { m: 800, s: 200, rp: 200 } },
  { id: 'g21', t: 'Haal 4 sterren', prog: (G) => [Math.floor(bestStars(G) * 10) / 10, 4], rw: { m: 800, s: 240 } },
  { id: 'g22', t: 'Bouw de Achtbaan', prog: (G) => [hasObj(G, 'achtbaan') ? 1 : 0, 1], rw: { m: 800, s: 300, rp: 400 } },
  { id: 'g23', t: 'Breid een park uit', prog: (G) => [G.st.expands, 1], rw: { m: 800, s: 150 } },
  { id: 'g24', t: 'Verdien in totaal €500.000', prog: (G) => [G.earnedRun, 500000], rw: { m: 800, s: 420, rp: 800 } },
  { id: 'g25', t: 'Open een tweede park', prog: (G) => [G.parks.length, 2], rw: { m: 800, s: 300, rp: 500 } },
  { id: 'g26', t: 'Ontvang 2.000 bezoekers', prog: (G) => [G.st.visitors, 2000], rw: { m: 800, s: 420, rp: 600 } },
  { id: 'g27', t: 'Bouw 10 attracties', prog: (G) => [rideCount(G), 10], rw: { m: 800, s: 500, rp: 800 } },
  { id: 'g28', t: 'Haal 5 sterren', prog: (G) => [Math.floor(bestStars(G) * 10) / 10, 5], rw: { m: 800, s: 600, rp: 1500 } },
  { id: 'g29', t: 'Verdien in totaal €5 miljoen', prog: (G) => [G.earnedRun, 5e6], rw: { m: 800, s: 900, rp: 4000 } },
  { id: 'g30', t: 'Open het derde park', prog: (G) => [G.parks.length, 3], rw: { m: 800, s: 600, rp: 3000 } },
  { id: 'g31', t: 'Verdien in totaal €50 miljoen', prog: (G) => [G.earnedRun, 5e7], rw: { m: 800, s: 1200, rp: 20000 } },
];

// prestaties (blijvend; geven soms een gouden ticket)
export const ACHS = [
  { id: 'a1', e: '🎟️', t: 'Eerste bezoeker', d: 'Ontvang 1 bezoeker', prog: (G) => [G.st.visitors, 1] },
  { id: 'a2', e: '🎢', t: 'Gillende gasten', d: '200 ritjes in totaal', prog: (G) => [G.st.riders, 200] },
  { id: 'a3', e: '🎠', t: 'Drukke draaimolen', d: '2.000 ritjes in totaal', prog: (G) => [G.st.riders, 2000] },
  { id: 'a4', e: '👥', t: 'Duizend gasten', d: '1.000 bezoekers in totaal', prog: (G) => [G.st.visitors, 1000] },
  { id: 'a5', e: '🏟️', t: 'Tienduizend gasten', d: '10.000 bezoekers in totaal', prog: (G) => [G.st.visitors, 10000], tk: 1 },
  { id: 'a6', e: '⭐', t: 'Vijf sterren!', d: 'Haal 5 sterren', prog: (G) => [Math.floor(bestStars(G) * 10) / 10, 5], tk: 1 },
  { id: 'a7', e: '💸', t: 'Eerste duizend', d: 'Verdien €1.000', prog: (G) => [G.earnedAll, 1000] },
  { id: 'a8', e: '🤑', t: 'Miljonair', d: 'Verdien €1 miljoen', prog: (G) => [G.earnedAll, 1e6], tk: 1 },
  { id: 'a9', e: '🏦', t: 'Miljardair', d: 'Verdien €1 miljard', prog: (G) => [G.earnedAll, 1e9], tk: 3 },
  { id: 'a10', e: '🤝', t: 'Fooienkoning', d: '100 fooien van bezoekers', prog: (G) => [G.st.tips, 100] },
  { id: 'a11', e: '🔧', t: 'Handige Harry', d: 'Repareer 20 attracties met een tik', prog: (G) => [G.st.repairs, 20] },
  { id: 'a12', e: '🧼', t: 'Schoon schip', d: 'Ruim 100 rommeltjes op met een tik', prog: (G) => [G.st.cleaned, 100] },
  { id: 'a13', e: '🏗️', t: 'Bouwvakker', d: 'Bouw 100 dingen', prog: (G) => [G.st.built, 100] },
  { id: 'a14', e: '🔬', t: 'Wetenschapper', d: 'Ontdek 10 onderzoeken', prog: (G) => [Object.keys(G.res).length, 10] },
  { id: 'a15', e: '🌍', t: 'Park-eigenaar', d: 'Bezit 3 parken', prog: (G) => [G.parks.length, 3], tk: 1 },
  { id: 'a16', e: '🎉', t: 'Eerste franchise', d: 'Start een nieuwe franchise', prog: (G) => [G.st.prestiges, 1], tk: 1 },
  { id: 'a17', e: '📅', t: 'Trouwe fan', d: 'Haal 7 dagen op rij je dagelijkse beloning op', prog: (G) => [G.daily.streak, 7], tk: 1 },
  { id: 'a18', e: '🎪', t: 'Feestvierder', d: 'Beleef 15 gebeurtenissen', prog: (G) => [G.st.events, 15] },
  { id: 'a19', e: '🌳', t: 'Groene vingers', d: 'Bezit 40 decoratie-stukken', prog: (G) => [objCount(G, ['decor']), 40] },
  { id: 'a20', e: '🎡', t: 'Volledige set', d: 'Bouw alle soorten attracties', prog: (G) => [new Set(G.parks.flatMap((P) => P.objs.filter((o) => DEFS[o.t].k === 'ride').map((o) => o.t))).size, 11], tk: 2 },
  { id: 'a21', e: '🦄', t: 'Topattractie', d: 'Upgrade een attractie naar niveau 3', prog: (G) => [G.st.maxlvl, 3] },
  { id: 'a22', e: '⏳', t: 'Doorzetter', d: 'Speel 10 uur', prog: (G) => [G.st.play / 3600, 10], tk: 1 },
];

/* =====================================================================
   4. STAND VAN HET SPEL: nieuw spel, park, raster
   ===================================================================== */
const INF = 32000;
const WAGE = { m: 0.25, j: 0.18, e: 0.3 };
const HIRE = { m: 250, j: 180, e: 300 };
export const STAFF_NAMES = { m: ['Monteur', '🔧'], j: ['Schoonmaker', '🧹'], e: ['Entertainer', '🤡'] };
const FX_MAX = 120;

export function dayKeyNow(now = Date.now()) { const d = new Date(now); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

export function makePark(G, idx) {
  const meta = PARKS[idx];
  const n = meta.sizes[0];
  const P = { id: meta.id, i: idx, n, lvl: 0, roads: new Uint8Array(n * n), objs: [], nid: 1, entry: 5, auto: true, prices: {}, staff: { m: 0, j: 0, e: 0 }, rs: 1.2, rev: 0, vis: 0, gx: Math.floor(n / 2) };
  for (let k = 1; k <= 6; k++) P.roads[(n - k) * n + P.gx] = 1;
  rt(P);
  return P;
}

// runtime-structuren (niet bewaard)
export function rt(P) {
  const n = P.n;
  P.occ = new Int32Array(n * n);
  P.beauty = new Float32Array(n * n);
  P.litter = new Uint8Array(n * n);
  P.byId = new Map();
  P.fields = new Map();
  P.guests = [];
  P.walkers = [];
  P.gid = 0;
  P.arr = 0;
  P.burst = 0;
  P.fx = [];
  P.roadVer = 1;
  P.sec = 0;
  P.incAcc = 0;
  P.incRate = 0;
  P.hapAvg = 0.75;
  P.cnt = {};
  P.rides = [];
  P.V = 0; P.D = 0; P.beautyTot = 0;
  P.crowd = 0;
  P.wxNow = 0;
  P.stayAvg = 160;
  for (const o of P.objs) initObj(o);
  touch(P);
  syncStaff(P);
}

function initObj(o) {
  const d = DEFS[o.t];
  o.l = o.l || 0; o.wear = o.wear || 0;
  if (d.k === 'ride') { o.q = []; o.riders = []; o.st = 0; o.tm = 0; o.wait = 0; o.broken = false; o.open = true; o.inc = 0; o.cyc = 0; o.scr = 0; o.rep = 0; }
  if (d.k === 'food' || d.k === 'shop' || d.k === 'wc' || d.k === 'bench') { o.use = 0; o.inc = 0; }
  o.ent = null; o.entVer = 0;
}

export function newGame(uid, now = Date.now()) {
  const G = {
    v: VERSION, uid, created: now, saved: now, t: 0, money: 900, rp: 0, tix: 0, tixAll: 0, earnedRun: 0, earnedAll: 0,
    res: {}, pp: {}, goals: {}, ach: {}, daily: { day: '', streak: 0 },
    st: { visitors: 0, riders: 0, tips: 0, repairs: 0, cleaned: 0, built: 0, events: 0, camps: 0, expands: 0, prestiges: 0, maxlvl: 0, play: 0, rev: 0 },
    set: { sfx: 1, mus: 1, spd: 1 }, tut: 0, cur: 0, parks: [], reviews: [], revN: 0, revSum: 0,
    mk: { until: 0, mult: 1 }, ev: null, nextEv: 120, fx: [], evMult: { until: 0, mult: 1 },
  };
  G.parks.push(makePark(G, 0));
  return G;
}

export const perk = (G, id) => G.res['p:' + id] || 0;
export const fr = (G, id) => G.pp[id] || 0;
export const incomeMult = (G) => (1 + 0.08 * perk(G, 'kassa')) * (1 + 0.15 * fr(G, 'goud'));
export const buildMult = (G) => Math.max(0.2, (1 - 0.05 * perk(G, 'bouwtech')) * (1 - 0.05 * fr(G, 'bouw')));
export const buildCost = (G, id) => Math.max(1, Math.round(DEFS[id].c * buildMult(G)));
export const sellValue = (G, o) => { const d = DEFS[o.t]; let v = d.c * 0.5; for (let i = 1; i <= o.l; i++) v += d.c * RIDE_UP[i] * 0.3; return Math.round(v); };
export const rpMult = (G) => (1 + 0.25 * perk(G, 'labteam')) * (1 + 0.2 * fr(G, 'geest'));
export const staffCap = (P, G, k) => Math.min(24, 3 + 2 * P.lvl + 2 * fr(G, 'staf') + (k === 'e' ? -1 : 0));

const ix = (P, x, y) => y * P.n + x;
export const inb = (P, x, y) => x >= 0 && y >= 0 && x < P.n && y < P.n;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function earn(G, v, P) {
  if (!(v > 0)) return;
  G.money += v; G.earnedRun += v; G.earnedAll += v;
  if (P) P.incAcc += v;
}
export function spend(G, v) { if (G.money + 1e-9 < v) return false; G.money -= v; return true; }

function fx(P, o) { if (P.fx.length < FX_MAX) P.fx.push(o); }
function gmsg(G, e, tx, kind) { if (G.fx.length < 30) G.fx.push({ k: 'msg', e, tx, kind: kind || 'info' }); }

/* ---------- scan: tellers, waarde, schoonheid ---------- */
export const thrEff = (o) => DEFS[o.t].thr * (1 + 0.18 * o.l);
export const capEff = (o) => Math.round(DEFS[o.t].cap * (1 + 0.15 * o.l));
export const fairPrice = (o) => DEFS[o.t].pr * (1 + 0.12 * o.l);
export const ridePrice = (P, o) => (P.prices[o.t] != null ? P.prices[o.t] : DEFS[o.t].pr) * (1 + 0.12 * o.l);
export const cycleTime = (o) => 2.5 + DEFS[o.t].dur + 1.5;
export const upkeepOf = (o) => DEFS[o.t].c * 0.00003 * (1 + 0.3 * o.l);

export function touch(P) {
  const n = P.n;
  P.occ.fill(0); P.beauty.fill(0); P.byId.clear();
  P.cnt = { ride: 0, food: 0, shop: 0, wc: 0, bench: 0, bin: 0, lab: 0, decor: 0 };
  P.rides = [];
  P.beautyTot = 0;
  for (const o of P.objs) {
    const d = DEFS[o.t];
    P.byId.set(o.id, o);
    for (let yy = 0; yy < d.h; yy++) for (let xx = 0; xx < d.w; xx++) P.occ[ix(P, o.x + xx, o.y + yy)] = o.id;
    P.cnt[d.k] = (P.cnt[d.k] || 0) + 1;
    if (d.k === 'ride') P.rides.push(o);
    if (d.bty) {
      P.beautyTot += d.bty;
      const cx = o.x + d.w / 2, cy = o.y + d.h / 2;
      for (let y = Math.max(0, Math.floor(cy - 4)); y <= Math.min(n - 1, Math.ceil(cy + 3)); y++) for (let x = Math.max(0, Math.floor(cx - 4)); x <= Math.min(n - 1, Math.ceil(cx + 3)); x++) {
        const dd = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (dd < 4) P.beauty[ix(P, x, y)] += d.bty * (1 - dd / 4) * 0.7;
      }
    }
  }
  P.fields.clear();
  P.roadVer++;
  recomputeValue(P);
}

export function recomputeValue(P) {
  let D = 0;
  for (const o of P.rides) if (!o.broken && o.open) D += thrEff(o);
  P.D = D;
  P.V = D + 0.5 * ((P.cnt.food || 0) + (P.cnt.shop || 0)) + 0.12 * P.beautyTot;
}

/* ---------- paden ---------- */
export function bfs(P, starts) {
  const n = P.n, dist = new Int16Array(n * n).fill(INF), q = new Int16Array(n * n);
  let h = 0, t = 0;
  for (const s of starts) if (s >= 0 && s < n * n && P.roads[s] && dist[s] === INF) { dist[s] = 0; q[t++] = s; }
  while (h < t) {
    const c = q[h++], x = c % n, y = (c - x) / n, d = dist[c] + 1;
    if (x + 1 < n && P.roads[c + 1] && dist[c + 1] === INF) { dist[c + 1] = d; q[t++] = c + 1; }
    if (x > 0 && P.roads[c - 1] && dist[c - 1] === INF) { dist[c - 1] = d; q[t++] = c - 1; }
    if (y + 1 < n && P.roads[c + n] && dist[c + n] === INF) { dist[c + n] = d; q[t++] = c + n; }
    if (y > 0 && P.roads[c - n] && dist[c - n] === INF) { dist[c - n] = d; q[t++] = c - n; }
  }
  return dist;
}
const gateCell = (P) => (P.n - 1) * P.n + P.gx;
export function gateField(P) { let f = P.fields.get('gate'); if (!f) { f = bfs(P, [gateCell(P)]); P.fields.set('gate', f); } return f; }
export function entrance(P, o) {
  if (o.ent && o.entVer === P.roadVer) return o.ent;
  const d = DEFS[o.t], out = [], n = P.n;
  for (let yy = -1; yy <= d.h; yy++) for (let xx = -1; xx <= d.w; xx++) {
    if ((xx === -1 || xx === d.w) === (yy === -1 || yy === d.h)) continue; // alleen de randen, geen hoeken
    const x = o.x + xx, y = o.y + yy;
    if (x >= 0 && y >= 0 && x < n && y < n && P.roads[y * n + x]) out.push(y * n + x);
  }
  o.ent = out; o.entVer = P.roadVer; o.entSet = new Set(out);
  return out;
}
export function objField(P, o) { let f = P.fields.get(o.id); if (!f) { f = bfs(P, entrance(P, o)); P.fields.set(o.id, f); } return f; }
export function reachable(P, o) { const gf = gateField(P); for (const c of entrance(P, o)) if (gf[c] < INF) return true; return false; }

/* ---------- bouwen ---------- */
export const MAX_OBJS = 230;
export function canPlace(P, id, x, y) {
  const d = DEFS[id];
  if (!d) return 'Onbekend';
  if (x < 0 || y < 0 || x + d.w > P.n || y + d.h > P.n) return 'Buiten het park';
  for (let yy = 0; yy < d.h; yy++) for (let xx = 0; xx < d.w; xx++) { const c = ix(P, x + xx, y + yy); if (P.occ[c]) return 'Hier staat al iets'; if (P.roads[c]) return 'Hier ligt een weg'; }
  return null;
}
export function hasAccess(P, id, x, y) {
  const d = DEFS[id];
  if (d.k === 'decor') return true;
  for (let yy = -1; yy <= d.h; yy++) for (let xx = -1; xx <= d.w; xx++) {
    if ((xx === -1 || xx === d.w) === (yy === -1 || yy === d.h)) continue;
    const X = x + xx, Y = y + yy;
    if (inb(P, X, Y) && P.roads[Y * P.n + X]) return true;
  }
  return false;
}
export function place(G, P, id, x, y) {
  const d = DEFS[id];
  if (!d) return { ok: false, msg: 'Onbekend' };
  if (!isUnlocked(G, id)) return { ok: false, msg: 'Eerst onderzoeken' };
  if (P.objs.length >= MAX_OBJS) return { ok: false, msg: 'Het park zit vol' };
  const why = canPlace(P, id, x, y);
  if (why) return { ok: false, msg: why };
  const c = buildCost(G, id);
  if (!spend(G, c)) return { ok: false, msg: 'Te weinig geld' };
  const o = { id: P.nid++, t: id, x, y, l: 0, wear: 0 };
  initObj(o);
  P.objs.push(o);
  touch(P);
  G.st.built++;
  return { ok: true, obj: o, cost: c, access: hasAccess(P, id, x, y) };
}
export function paintRoad(G, P, x, y) {
  if (!inb(P, x, y)) return false;
  const c = ix(P, x, y);
  if (P.roads[c] || P.occ[c]) return false;
  const cost = Math.max(1, Math.round(ROAD_COST * buildMult(G)));
  if (!spend(G, cost)) return false;
  P.roads[c] = 1;
  P.roadVer++; P.fields.clear();
  for (const o of P.objs) o.entVer = 0;
  return true;
}
export function removeObj(G, P, o, refund = true) {
  const d = DEFS[o.t];
  if (d.k === 'ride') {
    const ent = entrance(P, o);
    const rel = (g) => { if (!g.dead) { g.st = 0; g.goal = null; g.wt = 0; if (ent.length) { const c = ent[0]; g.cx = c % P.n; g.cy = (c - g.cx) / P.n; g.x = g.cx + 0.5; g.y = g.cy + 0.5; g.tx = g.cx; g.ty = g.cy; g.px = g.x; g.py = g.y; } else g.dead = true; } };
    o.q.forEach(rel); o.riders.forEach(rel);
  }
  const i = P.objs.indexOf(o);
  if (i >= 0) P.objs.splice(i, 1);
  P.fields.delete(o.id);
  let gain = 0;
  if (refund) { gain = Math.round(sellValue(G, o)); G.money += gain; }
  touch(P);
  for (const q of P.objs) q.entVer = 0;
  return gain;
}
export function bulldoze(G, P, x, y) {
  if (!inb(P, x, y)) return null;
  const c = ix(P, x, y);
  if (P.occ[c]) { const o = P.byId.get(P.occ[c]); const g = removeObj(G, P, o); return { kind: 'obj', gain: g, name: DEFS[o.t].n }; }
  if (P.roads[c]) {
    if (c === gateCell(P)) return null;
    P.roads[c] = 0; P.litter[c] = 0;
    P.roadVer++; P.fields.clear();
    for (const o of P.objs) o.entVer = 0;
    const g = Math.round(ROAD_COST * 0.4); G.money += g;
    // gasten op deze tegel: laat ze opnieuw kiezen
    for (const gu of P.guests) if (gu.cx === x && gu.cy === y && gu.st === 0) { gu.goal = null; gu.wt = 0; }
    return { kind: 'road', gain: g, name: 'Weg' };
  }
  return null;
}
export function upgradeCost(o) { const d = DEFS[o.t]; return o.l >= 3 ? 0 : Math.round(d.c * RIDE_UP[o.l + 1]); }
export function upgradeRide(G, P, o) {
  if (DEFS[o.t].k !== 'ride' || o.l >= 3) return false;
  if (!spend(G, upgradeCost(o))) return false;
  o.l++; G.st.maxlvl = Math.max(G.st.maxlvl, o.l);
  recomputeValue(P);
  return true;
}
export const repairCost = (o) => Math.round(Math.max(10, DEFS[o.t].c * 0.02));
export function repairRide(G, P, o, free) {
  if (!o.broken && o.wear < 1) return false;
  if (!free && !spend(G, repairCost(o))) return false;
  o.broken = false; o.wear = 0; o.rep = 0;
  G.st.repairs += free ? 0 : 1;
  recomputeValue(P);
  return true;
}

/* ---------- personeel ---------- */
export const hireCost = (P, k) => Math.round(HIRE[k] * (1 + 0.5 * P.staff[k]));
export function hire(G, P, k) {
  if (P.staff[k] >= staffCap(P, G, k)) return false;
  if (!spend(G, hireCost(P, k))) return false;
  P.staff[k]++; syncStaff(P); return true;
}
export function fire(G, P, k) { if (P.staff[k] <= 0) return false; P.staff[k]--; syncStaff(P); return true; }
export function syncStaff(P) {
  for (const k of ['m', 'j', 'e']) {
    const have = P.walkers.filter((w) => w.k === k);
    for (let i = have.length; i > P.staff[k]; i--) { const w = have[i - 1]; P.walkers.splice(P.walkers.indexOf(w), 1); }
    for (let i = have.length; i < P.staff[k]; i++) P.walkers.push(newWalker(P, k));
  }
}
function newWalker(P, k) {
  const c = gateCell(P), x = c % P.n, y = (c - x) / P.n;
  return { k, x: x + 0.5, y: y + 0.5, cx: x, cy: y, tx: x, ty: y, px: x + 0.5, py: y + 0.5, task: 0, tm: 0, tgt: null, f: null, pc: -1, ox: rr(-0.15, 0.15), oy: rr(-0.15, 0.15), dir: 0 };
}

/* =====================================================================
   5. BEZOEKERS
   ===================================================================== */
const SHIRTS = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff924c', '#f15bb5', '#00bbf9', '#9b5de5', '#2ec4b6'];
const HAIRS = ['#3b2a1a', '#7a4a21', '#e8c170', '#222', '#c2410c', '#9a9a9a', '#5a3d7a'];
const SKINS = ['#ffd9b3', '#f2b88e', '#d9915f', '#a86b3c', '#7a4a28'];
const KIND_PREF = [[2.5, 1], [7, 1.5], [5, 2], [3, 1.5]];
const KIND_SPD = [1.55, 1.7, 1.4, 1.05];
export const WALK = 0, QUEUE = 1, RIDE = 2, USE = 3;

export function guestCap(P) { return 40 + 4 * P.n; }

export function newGuest(G, P, o) {
  const roll = R();
  const kind = (o && o.kind != null) ? o.kind : roll < 0.3 ? 0 : roll < 0.55 ? 1 : roll < 0.9 ? 2 : 3;
  const pf = KIND_PREF[kind];
  const wallet = (22 + 2.4 * P.V) * rr(0.7, 1.45);
  const g = {
    id: ++P.gid, kind, sc: kind === 0 ? 0.78 : kind === 3 ? 0.92 : 1, col: pick(SHIRTS), hair: pick(HAIRS), skin: pick(SKINS),
    pref: clamp(pf[0] + rr(-pf[1], pf[1]), 1, 9.5), sp: KIND_SPD[kind] * rr(0.9, 1.1),
    hun: rr(0, 0.3), thi: rr(0, 0.35), bla: rr(0, 0.25), ene: rr(0.7, 1), hap: rr(0.7, 0.9), wal: wallet, w0: wallet,
    stay: rr(120, 230), age: 0, st: WALK, goal: null, gk: '', wt: 0, seen: [], rides: 0, tip: 0,
    ox: rr(-0.2, 0.2), oy: rr(-0.2, 0.2), cx: P.gx, cy: P.n - 1, pcx: -1, pcy: -1, tx: P.gx, ty: P.n - 1,
    x: P.gx + 0.5, y: P.n + 0.35 + rr(0, 0.5), px: 0, py: 0, ut: 0, uo: null, bub: '', bt: 0, qt: 0, vip: !!(o && o.vip), ate: 0, last: '', unmet: '', born: false,
  };
  g.px = g.tx + 0.5 + g.ox; g.py = g.ty + 0.5 + g.oy;
  if (g.vip) { g.wal = g.w0 = wallet * 6; g.col = '#ffd700'; g.stay = 260; }
  return g;
}

function setTarget(g, cx, cy) { g.tx = cx; g.ty = cy; g.px = cx + 0.5 + g.ox; g.py = cy + 0.5 + g.oy; }
function say(g, t, d) { g.bub = t; g.bt = d || 2.2; }

function stepToward(P, g, f) {
  const n = P.n, here = g.cy * n + g.cx, cur = f[here];
  let best = -1, bd = cur, cnt = 0;
  for (let i = 0; i < 4; i++) {
    const nx = g.cx + NB[i][0], ny = g.cy + NB[i][1];
    if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
    const c = ny * n + nx;
    if (f[c] < bd) { bd = f[c]; best = c; cnt = 1; } else if (f[c] === bd && best >= 0 && R() < 1 / (++cnt)) best = c;
  }
  if (best < 0) return false;
  g.pcx = g.cx; g.pcy = g.cy;
  const x = best % n; setTarget(g, x, (best - x) / n);
  return true;
}
function wanderStep(P, g) {
  const n = P.n, opts = [];
  for (let i = 0; i < 4; i++) {
    const nx = g.cx + NB[i][0], ny = g.cy + NB[i][1];
    if (nx < 0 || ny < 0 || nx >= n || ny >= n || !P.roads[ny * n + nx]) continue;
    opts.push([nx, ny]);
  }
  if (!opts.length) return false;
  let c = opts.filter((o) => !(o[0] === g.pcx && o[1] === g.pcy));
  if (!c.length) c = opts;
  // liefst rechtdoor
  const dx = g.cx - g.pcx, dy = g.cy - g.pcy;
  const straight = c.find((o) => o[0] - g.cx === dx && o[1] - g.cy === dy);
  const ch = straight && R() < 0.65 ? straight : pick(c);
  g.pcx = g.cx; g.pcy = g.cy; setTarget(g, ch[0], ch[1]);
  return true;
}

// kies een doel: behoefte of attractie
function pickGoal(G, P, g) {
  const n = P.n, here = g.cy * n + g.cx;
  g.goal = null; g.gk = '';
  const nearest = (pred) => {
    let best = null, bs = 1e9;
    for (const o of P.objs) {
      if (!pred(o)) continue;
      const f = objField(P, o), dd = f[here];
      if (dd >= INF) continue;
      const s = dd * rr(0.85, 1.3) + (o.use > 0 ? 4 : 0);
      if (s < bs) { bs = s; best = o; }
    }
    return best;
  };
  const canPay = (o) => g.wal >= DEFS[o.t].pr * 0.9;
  let need = '';
  if (g.bla > 0.72) need = 'wc';
  else if (g.thi > 0.52) need = 'thi';
  else if (g.hun > 0.55) need = 'hun';
  else if (g.ene < 0.22) need = 'bench';
  if (need) {
    let o = null;
    if (need === 'wc') o = nearest((q) => DEFS[q.t].k === 'wc');
    else if (need === 'thi') o = nearest((q) => DEFS[q.t].k === 'food' && DEFS[q.t].thi >= 0.3 && canPay(q));
    else if (need === 'hun') o = nearest((q) => DEFS[q.t].k === 'food' && DEFS[q.t].hun >= 0.25 && canPay(q));
    else o = nearest((q) => DEFS[q.t].k === 'bench');
    if (o) { g.goal = o.id; g.gk = need; say(g, { wc: '🚻', thi: '🥤', hun: '🍔', bench: '🪑' }[need], 2.5); return; }
    g.unmet = need;
  }
  if (g.hap > 0.6 && g.wal > 12 && R() < 0.1) {
    const o = nearest((q) => DEFS[q.t].k === 'shop' && canPay(q));
    if (o) { g.goal = o.id; g.gk = 'shop'; say(g, '🎁', 2.5); return; }
  }
  // attractie kiezen
  let best = null, bs = -1e9;
  for (const o of P.rides) {
    if (o.broken || !o.open || o.q.length >= 14 || g.seen.includes(o.id)) continue;
    const f = objField(P, o), dd = f[here];
    if (dd >= INF) continue;
    const d = DEFS[o.t], price = ridePrice(P, o), ratio = price / fairPrice(o);
    if (price > g.wal || ratio > 2.3) continue;
    const fit = 1 - Math.min(1, Math.abs(thrEff(o) - g.pref) / 8);
    const wait = o.q.length / Math.max(1, capEff(o)) * cycleTime(o);
    let s = 6 * fit + 0.5 * thrEff(o) - 0.07 * dd - 0.05 * wait - 3.2 * Math.max(0, ratio - 1) + (ratio < 0.7 ? 1 : 0) + rr(0, 3);
    if (o.t === 'waterglijbaan' && P.i === 1) s += 2.5;
    if (o.t === 'waterglijbaan') s += (P.wxNow === 4 || (P.wxNow === 0 && P.i !== 2)) ? 2 : (P.wxNow === 3 || P.wxNow === 2) ? -4 : 0;
    if (s > bs) { bs = s; best = o; }
  }
  if (best && bs > 0.5) { g.goal = best.id; g.gk = 'ride'; if (R() < 0.35) say(g, DEFS[best.t].e, 2.2); return; }
  g.goal = 'wander'; g.wt = rr(3, 7);
}

function enterObj(G, P, g, o) {
  const d = DEFS[o.t];
  if (d.k === 'ride') {
    if (o.broken || !o.open || o.q.length >= 16) { g.seen.push(o.id); if (g.seen.length > 4) g.seen.shift(); g.goal = null; say(g, o.broken ? '😕' : '😤', 1.8); return; }
    g.st = QUEUE; g.qt = 0; g.uo = o; o.q.push(g);
    return;
  }
  // kraam, toilet, bankje, winkel
  g.st = USE; g.uo = o; g.ut = d.k === 'bench' ? 4 : d.k === 'wc' ? 3 : 2.4; o.use = (o.use || 0) + 1;
}

function finishUse(G, P, g) {
  const o = g.uo, d = DEFS[o.t]; o.use = Math.max(0, (o.use || 1) - 1);
  g.st = WALK; g.goal = null; g.uo = null;
  if (d.k === 'wc') { g.bla = 0; g.hap = Math.min(1, g.hap + 0.04); say(g, '😌', 1.6); return; }
  if (d.k === 'bench') { g.ene = 1; g.hap = Math.min(1, g.hap + 0.05); return; }
  const price = DEFS[o.t].pr;
  if (price > g.wal) { say(g, '💸', 1.6); return; }
  g.wal -= price;
  const inc = price * incomeMult(G);
  earn(G, inc, P); o.inc += inc; P.rev += inc; G.st.rev += inc;
  fx(P, { k: 'coin', x: o.x + DEFS[o.t].w / 2, y: o.y + DEFS[o.t].h / 2, v: inc });
  g.hun = clamp(g.hun - d.hun, 0, 1.2); g.thi = clamp(g.thi - d.thi, 0, 1.2); g.hap = Math.min(1, g.hap + d.hap); g.ate++;
  g.unmet = '';
  say(g, d.k === 'shop' ? '🧸' : '😋', 1.8);
  const bin = P.cnt.bin ? 0.5 : 1;
  if (d.k === 'food' && R() < 0.4 * bin) { const c = g.cy * P.n + g.cx; if (P.roads[c] && P.litter[c] < 2) P.litter[c]++; }
}

function boardRide(G, P, o) {
  const cap = capEff(o), take = Math.min(cap, o.q.length);
  const price = ridePrice(P, o);
  const riders = [];
  for (let i = 0; i < take; i++) {
    const g = o.q.shift();
    if (g.wal < price) { g.st = WALK; g.goal = null; g.uo = null; say(g, '💸', 1.8); g.seen.push(o.id); continue; }
    g.wal -= price;
    const inc = price * incomeMult(G);
    earn(G, inc, P); o.inc += inc; P.rev += inc; G.st.rev += inc;
    g.st = RIDE; riders.push(g);
  }
  if (riders.length) fx(P, { k: 'coin', x: o.x + DEFS[o.t].w / 2, y: o.y + DEFS[o.t].h / 2, v: price * riders.length * incomeMult(G) });
  o.riders = riders; o.st = riders.length ? 1 : 0; o.tm = 0; o.wait = 0;
  if (riders.length) fx(P, { k: 'start', o });
}

function finishRide(G, P, o) {
  const ent = entrance(P, o), d = DEFS[o.t];
  const te = thrEff(o);
  for (const g of o.riders) {
    const fit = 1 - Math.min(1, Math.abs(te - g.pref) / 8);
    g.hap = Math.min(1, g.hap + 0.1 + 0.2 * fit);
    g.rides++; G.st.riders++; g.seen.push(o.id); if (g.seen.length > 4) g.seen.shift();
    g.st = WALK; g.goal = null; g.uo = null;
    if (ent.length) { const c = pick(ent), x = c % P.n, y = (c - x) / P.n; g.cx = x; g.cy = y; g.x = x + 0.5 + g.ox; g.y = y + 0.5 + g.oy; setTarget(g, x, y); } else g.dead = true;
    if (te > 6 && R() < 0.3) say(g, pick(['🤩', '😆', '🥴']), 2);
  }
  o.riders = [];
  o.st = 0; o.tm = 0; o.wait = 0; o.cyc++;
  o.wear += 2.2 * (1 - 0.15 * perk(G, 'gereedschap')) * (1 + 0.1 * o.l * 0);
  const w = o.wear / 100;
  if (R() < Math.pow(clamp(w, 0, 1.4), 2.4) * 0.3) { o.broken = true; o.rep = 0; fx(P, { k: 'break', o }); recomputeValue(P); }
  fx(P, { k: 'done', o });
}

function updRide(G, P, o, dt) {
  const d = DEFS[o.t];
  if (o.broken) {
    if (o.riders.length) { for (const g of o.riders) { g.st = WALK; g.goal = null; g.hap = Math.max(0, g.hap - 0.15); const ent = entrance(P, o); if (ent.length) { const c = ent[0], x = c % P.n, y = (c - x) / P.n; g.cx = x; g.cy = y; g.x = x + 0.5; g.y = y + 0.5; setTarget(g, x, y); } else g.dead = true; } o.riders = []; o.st = 0; }
    if (o.q.length) { for (const g of o.q) { g.st = WALK; g.goal = null; g.uo = null; g.seen.push(o.id); say(g, '😕', 1.8); } o.q = []; }
    return;
  }
  if (!o.open) { if (o.q.length) { for (const g of o.q) { g.st = WALK; g.goal = null; g.uo = null; } o.q = []; } return; }
  if (o.st === 0) {
    if (o.q.length) {
      o.wait += dt;
      if (o.q.length >= capEff(o) || o.wait >= 3) boardRide(G, P, o);
    }
  } else {
    o.tm += dt;
    if (thrEff(o) >= 6) { o.scr -= dt; if (o.scr <= 0 && o.riders.length) { o.scr = rr(1.2, 2.6); fx(P, { k: 'scream', o }); } }
    if (o.tm >= d.dur) finishRide(G, P, o);
  }
}

function leaveReview(G, P, g) {
  const stars = clamp(Math.round(1 + g.hap * 4.2 + rr(-0.4, 0.4)), 1, 5);
  G.revN++; G.revSum += stars;
  P.rvN = (P.rvN || 0) + 1;
  P.rvE = P.rvE == null ? stars : P.rvE * 0.95 + stars * 0.05;
  if (R() < 0.35) {
    const good = ['Heerlijk dagje uit!', 'Wat een mooi park!', 'De kinderen vonden het geweldig.', 'Supergezellig, we komen terug.', 'Die achtbaan is top!', 'Schoon en vriendelijk personeel.', 'Lekker ijsje gehad.', 'Prachtig versierd!'];
    const bad = ['Veel te lang in de rij.', 'Mijn ijsje was op...', 'Waar zijn de toiletten?!', 'Het was best vies.', 'Te duur voor wat je krijgt.', 'Alles was kapot.', 'Te weinig te doen.', 'Ik had honger en dorst.'];
    let txt = stars >= 4 ? pick(good) : stars <= 2 ? pick(bad) : pick(good.concat(bad));
    if (g.unmet === 'wc') txt = 'Waar zijn de toiletten?!'; else if (g.unmet === 'hun' && stars <= 3) txt = 'Ik had honger, geen eten te vinden.'; else if (g.unmet === 'thi' && stars <= 3) txt = 'Niks te drinken te krijgen...';
    G.reviews.unshift({ s: stars, t: txt, p: P.i, k: g.kind });
    if (G.reviews.length > 14) G.reviews.length = 14;
    fx(P, { k: 'review' });
  }
}

function updGuest(G, P, g, dt, wx) {
  g.age += dt;
  // behoeften
  g.hun = Math.min(1.3, g.hun + dt / 160); g.thi = Math.min(1.3, g.thi + dt / (wx === 4 ? 70 : 120)); g.bla = Math.min(1.3, g.bla + dt / 260); g.ene = Math.max(0, g.ene - dt / 520);
  if (g.bt > 0) { g.bt -= dt; if (g.bt <= 0) g.bub = ''; }
  const cell = g.cy * P.n + g.cx;
  let tgt = 0.64 + Math.min(0.2, P.beauty[cell] * 0.08) - (P.litter[cell] ? 0.1 : 0) - Math.max(0, Math.max(g.hun, g.thi, g.bla) - 0.75) * 1.0 - (wx === 2 ? 0.05 : 0);
  if (g.unmet) tgt -= 0.08;
  if (P.fw) tgt += 0.07;
  if (tgt < 0.02) tgt = 0.02;
  if (P.entertain) { for (const e of P.entertain) { const dx = e.x - g.x, dy = e.y - g.y; if (dx * dx + dy * dy < 9) { tgt += 0.12; break; } } }
  if (g.hap > tgt) g.hap = Math.max(tgt, g.hap - dt * 0.012); else g.hap = Math.min(tgt, g.hap + dt * 0.02);
  if (g.st === USE) { g.ut -= dt; if (g.ut <= 0) finishUse(G, P, g); return; }
  if (g.st === RIDE) return;
  if (g.st === QUEUE) {
    g.qt += dt;
    if (g.qt > 38 + g.hap * 20) { const o = g.uo; if (o) { const i = o.q.indexOf(g); if (i >= 0) o.q.splice(i, 1); g.seen.push(o.id); } g.st = WALK; g.goal = null; g.uo = null; g.hap = Math.max(0, g.hap - 0.12); say(g, '😠', 2); }
    return;
  }
  // lopen
  if (g.goal !== 'gate' && (g.age > g.stay || g.hap < 0.14 || (g.wal < 1.2 && g.age > 40))) {
    g.goal = 'gate'; g.gk = 'leave';
    say(g, g.hap < 0.14 ? '😞' : '👋', 2.5);
    if (g.uo) g.uo = null;
  }
  const dx = g.px - g.x, dy = g.py - g.y, d2 = dx * dx + dy * dy, stp = g.sp * dt * (g.goal === 'gate' ? 1.1 : 1);
  if (d2 > stp * stp) { const d = Math.sqrt(d2); g.x += dx / d * stp; g.y += dy / d * stp; return; }
  g.x = g.px; g.y = g.py;
  // aangekomen op de doel-tegel
  g.cx = g.tx; g.cy = g.ty;
  const here = g.cy * P.n + g.cx;
  if (g.goal === 'gate') {
    g.born = true;
    if (here === gateCell(P)) {
      if (g.exit) { g.dead = true; return; }
      g.exit = true; leaveReview(G, P, g); g.px = P.gx + 0.5 + g.ox; g.py = P.n + 0.8; return;
    }
    const f = gateField(P);
    if (f[here] >= INF || !stepToward(P, g, f)) { if (g.age > g.stay + 40) { g.dead = true; leaveReview(G, P, g); } else if (!wanderStep(P, g)) g.dead = g.age > g.stay + 60; }
    return;
  }
  g.born = true;
  // litter laten vallen
  if (g.goal === null || g.goal === undefined) pickGoal(G, P, g);
  if (g.goal === 'wander') {
    g.wt -= 1;
    if (g.wt <= 0) { g.goal = null; pickGoal(G, P, g); if (g.goal === 'wander') g.wt = rr(3, 6); }
  }
  if (typeof g.goal === 'number') {
    const o = P.byId.get(g.goal);
    if (!o) { g.goal = null; return; }
    entrance(P, o);
    if (o.entSet.has(here)) { enterObj(G, P, g, o); return; }
    const f = objField(P, o);
    if (f[here] >= INF || !stepToward(P, g, f)) { g.goal = null; wanderStep(P, g); }
    return;
  }
  if (!wanderStep(P, g)) { setTarget(g, g.cx, g.cy); }
}

/* =====================================================================
   6. PERSONEEL-SIMULATIE
   ===================================================================== */
function walkTo(P, w, dt, speed) {
  const dx = w.px - w.x, dy = w.py - w.y, d2 = dx * dx + dy * dy, stp = speed * dt;
  if (d2 > stp * stp) { const d = Math.sqrt(d2); w.x += dx / d * stp; w.y += dy / d * stp; w.dir = dx - dy; return false; }
  w.x = w.px; w.y = w.py; w.cx = w.tx; w.cy = w.ty; return true;
}
function wsetTarget(w, cx, cy) { w.tx = cx; w.ty = cy; w.px = cx + 0.5 + w.ox; w.py = cy + 0.5 + w.oy; }
function wStepField(P, w, f) {
  const n = P.n, here = w.cy * n + w.cx, cur = f[here];
  let best = -1, bd = cur;
  for (let i = 0; i < 4; i++) { const nx = w.cx + NB[i][0], ny = w.cy + NB[i][1]; if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue; const c = ny * n + nx; if (f[c] < bd) { bd = f[c]; best = c; } }
  if (best < 0) return false;
  const x = best % n; wsetTarget(w, x, (best - x) / n); return true;
}
function wWander(P, w) {
  const n = P.n, opts = [];
  for (let i = 0; i < 4; i++) { const nx = w.cx + NB[i][0], ny = w.cy + NB[i][1]; if (nx >= 0 && ny >= 0 && nx < n && ny < n && P.roads[ny * n + nx]) opts.push([nx, ny]); }
  if (!opts.length) return;
  let c = opts.filter((o) => (o[1] * n + o[0]) !== w.pc); if (!c.length) c = opts;
  const ch = pick(c); w.pc = w.cy * n + w.cx; wsetTarget(w, ch[0], ch[1]);
}

function updWalker(G, P, w, dt) {
  const n = P.n;
  if (w.k === 'e') {
    if (walkTo(P, w, dt, 1.1)) wWander(P, w);
    return;
  }
  if (w.task === 9) { // bezig met werken
    w.tm -= dt;
    if (w.tm <= 0) {
      if (w.k === 'j') { const c = w.tgt; if (P.litter[c]) { P.litter[c] = 0; } }
      else if (w.k === 'm') { const o = w.tgt; if (o && P.byId.has(o.id)) { o.broken = false; o.wear = 0; o.rep = 0; recomputeValue(P); fx(P, { k: 'fixed', o }); } }
      w.task = 0; w.tgt = null; w.f = null;
    }
    return;
  }
  const arrived = walkTo(P, w, dt, w.k === 'm' ? 2.0 : 1.7);
  if (!arrived) return;
  const here = w.cy * n + w.cx;
  if (w.task === 0) { // zoek werk
    if (w.k === 'j') {
      let best = -1, bd = 1e9;
      for (let c = 0; c < P.litter.length; c++) if (P.litter[c] && P.roads[c] && !(P.claim && P.claim.get(c) && P.claim.get(c) !== w)) { const x = c % n, y = (c - x) / n; const d = Math.abs(x - w.cx) + Math.abs(y - w.cy) + rr(0, 4); if (d < bd) { bd = d; best = c; } }
      if (best >= 0) { w.tgt = best; w.f = bfs(P, [best]); w.task = 1; if (!P.claim) P.claim = new Map(); P.claim.set(best, w); }
    } else {
      let best = null, bs = -1;
      for (const o of P.rides) {
        const need = o.broken ? 100 + o.wear : o.wear > 42 ? o.wear : 0;
        if (need <= 0) continue;
        if (P.mechBusy && P.mechBusy.has(o.id)) continue;
        if (need > bs && reachable(P, o)) { bs = need; best = o; }
      }
      if (best) { w.tgt = best; w.f = objField(P, best); w.task = 1; if (!P.mechBusy) P.mechBusy = new Set(); P.mechBusy.add(best.id); }
    }
    if (w.task === 0) wWander(P, w);
    return;
  }
  if (w.task === 1) {
    if (w.k === 'j') {
      if (here === w.tgt) { w.task = 9; w.tm = 1.4 / (1 + 0.4 * perk(G, 'suiger')); P.claim && P.claim.delete(w.tgt); return; }
      if (!wStepField(P, w, w.f)) { P.claim && P.claim.delete(w.tgt); w.task = 0; wWander(P, w); }
    } else {
      const o = w.tgt;
      if (!o || !P.byId.has(o.id)) { w.task = 0; w.tgt = null; return; }
      entrance(P, o);
      if (o.entSet.has(here)) { w.task = 9; w.tm = 6 / (1 + 0.3 * perk(G, 'gereedschap')); P.mechBusy && P.mechBusy.delete(o.id); return; }
      if (!wStepField(P, w, w.f)) { P.mechBusy && P.mechBusy.delete(o.id); w.task = 0; w.tgt = null; wWander(P, w); }
    }
  }
}

/* =====================================================================
   7. SEIZOEN, WEER, WAARDERING, AANKOMST
   ===================================================================== */
export function seasonOf(P, G) { const th = PARKS[P.i].theme; if (th === 'beach') return 1; if (th === 'snow') return 3; return Math.floor(G.t / (DAY * 5)) % 4; }
export function dayNo(G) { return Math.floor(G.t / DAY); }
export function nightAt(t) { const ph = (t / DAY + 0.35) % 1; const sun = Math.sin((ph - 0.25) * 6.2832); return clamp(0.45 - sun * 0.9, 0, 1) * 0.72; }
export function todPhase(G) { return (G.t % DAY) / DAY; }   // 0 = zonsopgang, .5 = zonsondergang... zie daylight()
function hash(a, b) { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
// 0 zon, 1 bewolkt, 2 regen, 3 sneeuw, 4 hitte
export function weatherOf(P, G) {
  const s = seasonOf(P, G), r = hash(dayNo(G) + 7, P.i + 3), th = PARKS[P.i].theme;
  if (G.hot && G.hot > G.t && th !== 'snow') return 4;
  if (th === 'snow') return r < 0.55 ? 3 : r < 0.8 ? 1 : 0;
  if (th === 'beach') return r < 0.55 ? 0 : r < 0.75 ? 4 : r < 0.9 ? 1 : 2;
  if (s === 0) return r < 0.4 ? 0 : r < 0.65 ? 1 : 2;
  if (s === 1) return r < 0.5 ? 0 : r < 0.68 ? 4 : r < 0.85 ? 1 : 2;
  if (s === 2) return r < 0.25 ? 0 : r < 0.6 ? 1 : 2;
  return r < 0.35 ? 3 : r < 0.6 ? 1 : r < 0.8 ? 0 : 2;
}
const WX_ARR = [1.1, 1, 0.7, 0.8, 1.05];
export const WX_NAMES = ['Zonnig', 'Bewolkt', 'Regen', 'Sneeuw', 'Hittegolf'];
export const WX_ICONS = ['☀️', '☁️', '🌧️', '❄️', '🔥'];

export function fairEntry(P) { return 2.5 + 0.5 * P.V; }
export function setEntry(P, v) { P.entry = clamp(Math.round(v), 0, 999); P.auto = false; }
export function autoEntry(P) { return Math.max(1, Math.round(fairEntry(P) * 0.7)); }
export function arrivalRate(G, P, live) {
  const stars = P.rs;
  const starsF = 0.55 + 0.2 * stars;
  const ratio = P.entry / fairEntry(P);
  const priceF = clamp(1.25 - 0.5 * ratio, 0.05, 1.25);
  let l = 0.075 * Math.pow(P.V + 6, 0.85) * starsF * priceF * (1 + 0.1 * fr(G, 'fan'));
  if (live) {
    l *= WX_ARR[weatherOf(P, G)];
    if (G.mk.until > G.t) l *= G.mk.mult;
    if (G.evMult.until > G.t) l *= G.evMult.mult;
  }
  return l;
}

export function calcRating(G, P) {
  const R_ = P.rides.length;
  const guests = P.guests.length;
  let happy = 0.75;
  if (guests) { let s = 0; for (const g of P.guests) s += g.hap; happy = s / guests; }
  P.hapAvg = happy;
  const Dneed = 3.4 * P.n;
  const appeal = cl01(P.D / Dneed);
  const types = new Set(P.rides.map((o) => o.t)).size;
  const variety = cl01(types / 6);
  let litter = 0, roads = 0;
  for (let i = 0; i < P.roads.length; i++) if (P.roads[i]) { roads++; if (P.litter[i]) litter++; }
  const clean = cl01(1 - (litter / Math.max(8, roads)) * 3);
  const beauty = cl01(P.beautyTot / (P.n * P.n * 0.045));
  const fac = cl01(((P.cnt.food || 0) * 12 + (P.cnt.shop || 0) * 4 + (P.cnt.wc || 0) * 10 + (P.cnt.bench || 0) * 5) / Math.max(24, guests));
  let broken = 0; for (const o of P.rides) if (o.broken) broken++;
  const safety = R_ ? cl01(1 - broken / R_ * 1.5) : 0;
  const revS = P.rvE != null ? (P.rvE - 1) / 4 : 0.7;
  let core = 0.28 * happy + 0.22 * appeal + 0.08 * variety + 0.12 * fac + 0.08 * beauty + (R_ ? 0.08 * clean + 0.08 * safety : 0) + 0.06 * revS;
  const score = clamp(core * 100, 0, 100);
  const target = clamp(5 * Math.pow(score / 92, 2), 0.3, 5);
  P.parts = { happy, appeal, variety, clean, beauty, fac, safety, rev: revS, score };
  P.rsT = target;
  return target;
}

/* =====================================================================
   8. HOOFD-STAP
   ===================================================================== */
function rollEvent(G, P) {
  const rides = P.rides.length;
  const list = ['school', 'kermis', 'sponsor', 'party', 'critic', 'vip'];
  if (rides >= 3) list.push('breakdown', 'breakdown');
  if (seasonOf(P, G) === 1 || PARKS[P.i].theme === 'beach') list.push('heat');
  const id = pick(list);
  const inc = Math.max(50, P.incRate);
  G.st.events++;
  switch (id) {
    case 'school': P.burst += 14; G.ev = { id, e: '🚌', t: 'Schoolreisje!', d: 'Een bus vol kinderen komt aan.', until: G.t + 25 }; break;
    case 'kermis': G.evMult = { until: G.t + 90, mult: 1.6 }; G.ev = { id, e: '🎪', t: 'Kermisweekend!', d: 'Extra veel bezoekers voor anderhalve minuut.', until: G.t + 25 }; break;
    case 'party': for (const g of P.guests) g.hap = Math.min(1, g.hap + 0.25); G.ev = { id, e: '🎂', t: 'Een kind is jarig!', d: 'Iedereen zingt mee. Alle gasten zijn blij.', until: G.t + 25 }; break;
    case 'sponsor': { const amt = Math.round(inc * 100 + 150); G.ev = { id, e: '🤝', t: 'Sponsor aan de poort', d: 'Een sponsor wil zijn logo ophangen.', until: G.t + 45, claim: { m: amt }, btn: 'Aannemen +' + fmtM(amt) }; break; }
    case 'critic': {
      if (P.rs >= 3) { const amt = Math.round(inc * 80 + 200); G.ev = { id, e: '📝', t: 'Recensent op bezoek', d: 'Hij is onder de indruk van je park!', until: G.t + 45, claim: { m: amt, rp: Math.round(10 + inc) }, btn: 'Beloning +' + fmtM(amt) }; }
      else G.ev = { id, e: '📝', t: 'Recensent op bezoek', d: 'Hij vindt het nog niet zo mooi. Haal meer sterren!', until: G.t + 25 };
      break;
    }
    case 'vip': P.guests.push(newGuest(G, P, { vip: true, kind: 2 })); G.ev = { id, e: '🌟', t: 'VIP-gast!', d: 'Een gouden bezoeker met veel geld. Tik hem aan!', until: G.t + 40 }; break;
    case 'heat': G.hot = G.t + 100; G.ev = { id, e: '🔥', t: 'Hittegolf!', d: 'Bezoekers willen drinken en ijs.', until: G.t + 25 }; break;
    case 'breakdown': {
      const ok = P.rides.filter((o) => !o.broken);
      if (ok.length) { const o = pick(ok); o.broken = true; recomputeValue(P); G.ev = { id, e: '🔧', t: 'Storing!', d: DEFS[o.t].n + ' is stuk. Tik erop of stuur een monteur.', until: G.t + 25 }; }
      break;
    }
  }
  if (G.ev) G.fx.push({ k: 'event', ev: G.ev });
}

export function claimEvent(G) {
  const ev = G.ev; if (!ev || !ev.claim) return false;
  if (ev.claim.m) G.money += ev.claim.m;
  if (ev.claim.rp) G.rp += ev.claim.rp;
  G.ev = null; return true;
}

// een stap van dt seconden (aanbevolen <= 0.25)
export function tick(G, dt) {
  G.t += dt; G.st.play += dt;
  const P = G.parks[G.cur];
  const wx = weatherOf(P, G);
  P.wxNow = wx;
  P.fw = P.rides.length >= 4 && dayNo(G) % 3 === 0 && nightAt(G.t) > 0.35;
  // onderzoeksgeest
  let rps = 0.4;
  for (const Q of G.parks) for (const o of Q.objs) if (o.t === 'lab') rps += DEFS.lab.rps * (1 + 0.1 * Q.lvl);
  G.rp += rps * rpMult(G) * dt;
  // kosten: personeel en onderhoud
  for (const Q of G.parks) {
    let cost = 0;
    cost += Q.staff.m * WAGE.m + Q.staff.j * WAGE.j + Q.staff.e * WAGE.e;
    for (const o of Q.rides) cost += upkeepOf(o);
    G.money = Math.max(0, G.money - cost * dt);
  }
  // inactieve parken: schatting
  for (let i = 0; i < G.parks.length; i++) {
    if (i === G.cur) continue;
    const Q = G.parks[i];
    if (!Q.est || G.t - Q.estT > 5) { Q.est = estimate(G, Q); Q.estT = G.t; }
    const e = Q.est;
    Q.idleAcc = (Q.idleAcc || 0) + e.gross * dt * IDLE_EFF;
    if (Q.idleAcc >= 1) { const v = Math.floor(Q.idleAcc); Q.idleAcc -= v; earn(G, v, Q); Q.incAcc += v; Q.rev += v; }
    Q.sec += dt; if (Q.sec >= 1) { Q.incRate = Q.incRate * 0.9 + Q.incAcc * 0.1; Q.incAcc = 0; Q.sec = 0; }
  }
  // wereldgebeurtenissen
  if (G.ev && G.ev.until < G.t) G.ev = null;
  if (G.t >= G.nextEv && G.tut >= 99) { G.nextEv = G.t + rr(110, 220); if (P.guests.length > 3) rollEvent(G, P); }
  // bezoekers komen
  P.arr += arrivalRate(G, P, true) * dt;
  const cap = guestCap(P);
  while (P.arr >= 1) {
    P.arr -= 1;
    if (P.guests.length < cap) { P.guests.push(newGuest(G, P)); G.st.visitors++; P.vis++; const inc = P.entry * incomeMult(G); earn(G, inc, P); P.rev += inc; G.st.rev += inc; }
  }
  if (P.burst > 0 && R() < dt * 0.6) { P.burst--; if (P.guests.length < cap + 20) { const g = newGuest(G, P, { kind: 0 }); P.guests.push(g); G.st.visitors++; const inc = P.entry * incomeMult(G); earn(G, inc, P); P.rev += inc; } }
  // entertainers voor stemming
  P.entertain = P.walkers.length ? P.walkers.filter((w) => w.k === 'e') : null;
  for (const o of P.rides) updRide(G, P, o, dt);
  for (const g of P.guests) updGuest(G, P, g, dt, wx);
  for (const w of P.walkers) updWalker(G, P, w, dt);
  // opruimen
  if (P.guests.some((g) => g.dead)) P.guests = P.guests.filter((g) => !g.dead);
  // elke seconde: rating, inkomen
  P.sec += dt;
  if (P.sec >= 1) {
    P.sec -= 1;
    P.incRate = P.incRate * 0.9 + P.incAcc * 0.1; P.incAcc = 0;
    P.mechBusy = new Set(); P.claim = new Map();
    for (const w of P.walkers) if (w.task === 1) { if (w.k === 'm' && w.tgt) P.mechBusy.add(w.tgt.id); if (w.k === 'j') P.claim.set(w.tgt, w); }
    calcRating(G, P);
    P.rs += (P.rsT - P.rs) * 0.1;
    // inactieve parken houden hun laatste rating
    // rommel: gasten laten af en toe iets vallen
    if (P.guests.length && R() < 0.5 * Math.min(1, P.guests.length / 30)) { const g = pick(P.guests); const c = g.cy * P.n + g.cx; if (g.st === WALK && P.roads[c] && P.litter[c] < 2 && g.ate > 0 && R() < 0.5) P.litter[c]++; }
    recomputeValue(P);
    if (P.auto) P.entry = autoEntry(P);
    if (P.guests.length < 2 && P.V < 2 && G.money < 30 && P.entry <= 0) { P.entry = 2; }
  }
  // doelen en prestaties
  G.chk = (G.chk || 0) + dt;
  if (G.chk >= 1) { G.chk = 0; checkAchs(G); }
  return G;
}

// ===== 'sim' helper: meerdere stappen =====
export function simulate(G, secs) { let t = 0; while (t < secs) { tick(G, STEP); t += STEP; } }

function checkAchs(G) {
  for (const a of ACHS) {
    if (G.ach[a.id]) continue;
    const [c, m] = a.prog(G);
    if (c >= m) { G.ach[a.id] = Date.now(); if (a.tk) { G.tix += a.tk; G.tixAll += a.tk; } G.fx.push({ k: 'ach', a }); }
  }
}

export function goalReward(G, goal, net) { if (net == null) net = goal.rw.s ? totalRate(G).net : 0; return Math.round(Math.max(goal.rw.m || 0, (goal.rw.s || 0) * Math.max(0, net))); }
export function goalState(G, goal) { const [c, m] = goal.prog(G); return { c, m, done: c >= m, claimed: !!G.goals[goal.id] }; }
export function claimGoal(G, id) {
  const goal = GOALS.find((g) => g.id === id); if (!goal || G.goals[id]) return false;
  const s = goalState(G, goal); if (!s.done) return false;
  G.goals[id] = 1;
  G.money += goalReward(G, goal);
  if (goal.rw.rp) G.rp += goal.rw.rp;
  if (goal.rw.tk) { G.tix += goal.rw.tk; G.tixAll += goal.rw.tk; }
  return true;
}
// eindeloze mijlpalen als alle vaste doelen klaar zijn
export const allGoalsDone = (G) => GOALS.every((g) => G.goals[g.id]);
export function endlessGoal(G) {
  const k = G.st.endless || 0, t = k % 3, r = Math.floor(k / 3);
  if (t === 0) { const m = Math.round(3000 * Math.pow(1.6, r)); return { id: 'e' + k, t: `Ontvang ${fmtN(m)} bezoekers in totaal`, prog: (G2) => [G2.st.visitors, m], rw: { m: 0, s: 900 } }; }
  if (t === 1) { const m = Math.round(8e7 * Math.pow(2, r)); return { id: 'e' + k, t: `Verdien ${fmtM(m)} in deze ronde`, prog: (G2) => [G2.earnedRun, m], rw: { m: 0, s: 900, tk: 1 } }; }
  const m = Math.min(60, 15 + 5 * r); return { id: 'e' + k, t: `Heb ${m} attracties tegelijk`, prog: (G2) => [rideCount(G2), m], rw: { m: 0, s: 900 } };
}
export function claimEndless(G) {
  if (!allGoalsDone(G)) return false;
  const g = endlessGoal(G), [c, m] = g.prog(G); if (c < m) return false;
  G.money += goalReward(G, g);
  if (g.rw.tk) { G.tix += g.rw.tk; G.tixAll += g.rw.tk; }
  G.st.endless = (G.st.endless || 0) + 1; return true;
}
export const goalsReady = (G) => GOALS.filter((g) => !G.goals[g.id] && goalState(G, g).done).length + (allGoalsDone(G) && endlessGoal(G).prog(G)[0] >= endlessGoal(G).prog(G)[1] ? 1 : 0);
export function nextGoals(G, k = 3) { return GOALS.filter((g) => !G.goals[g.id]).slice(0, k); }

/* ---------- onderzoek ---------- */
export function buyResearch(G, id) {
  if (id.startsWith('p:')) {
    const p = PERKS[id.slice(2)], lvl = G.res[id] || 0;
    if (!p || lvl >= p.max) return false;
    const c = perkCost(id.slice(2), lvl); if (G.rp < c) return false;
    G.rp -= c; G.res[id] = lvl + 1; return true;
  }
  const d = DEFS[id]; if (!d || !d.rp || G.res[id]) return false;
  if (G.rp < d.rp) return false;
  G.rp -= d.rp; G.res[id] = 1; return true;
}

/* ---------- uitbreiden, parken, marketing ---------- */
export function expandCost(G, P) {
  const meta = PARKS[P.i]; if (P.lvl >= meta.sizes.length - 1) return 0;
  return Math.round(meta.expand[P.lvl + 1] * (1 - 0.2 * perk(G, 'landmeter')));
}
export function expandPark(G, P) {
  const meta = PARKS[P.i]; if (P.lvl >= meta.sizes.length - 1) return false;
  const c = expandCost(G, P); if (!spend(G, c)) return false;
  const nn = meta.sizes[P.lvl + 1], k = nn - P.n, on = P.n;
  const roads = new Uint8Array(nn * nn);
  for (let y = 0; y < on; y++) for (let x = 0; x < on; x++) roads[(y + k) * nn + x + k] = P.roads[y * on + x];
  P.roads = roads;
  for (const o of P.objs) { o.x += k; o.y += k; }
  P.n = nn; P.lvl++; P.gx += k;
  G.st.expands++;
  const keep = P.guests;
  const objs = P.objs, fxq = P.fx;
  rt(P);
  // gasten en personeel bewaren op nieuwe plek
  for (const g of keep) { g.st = WALK; g.uo = null; g.ut = 0; g.cx += k; g.cy += k; g.x += k; g.y += k; g.tx += k; g.ty += k; g.px += k; g.py += k; g.pcx = -1; g.goal = null; P.guests.push(g); }
  P.gid = Math.max(P.gid, ...keep.map((g) => g.id), 0);
  P.expandShift = k;
  return true;
}
export function unlockPark(G, idx) {
  if (G.parks.some((p) => p.i === idx)) return false;
  const meta = PARKS[idx]; if (!meta) return false;
  if (!spend(G, meta.cost)) return false;
  G.parks.push(makePark(G, idx));
  G.parks.sort((a, b) => a.i - b.i);
  return true;
}
export function campaignCost(G, P, c) { return Math.round(Math.max(c.min, Math.max(30, P.incRate) * c.secs)); }
export function startCampaign(G, P, c) {
  if (G.mk.until > G.t) return false;
  const cost = campaignCost(G, P, c); if (!spend(G, cost)) return false;
  G.mk = { until: G.t + c.dur * (1 + 0.5 * perk(G, 'reclame')), mult: c.mult, id: c.id };
  G.st.camps++; return true;
}

/* ---------- aanwijzen: tip, rommel ---------- */
export function tipGuest(G, P, g) {
  if (g.tip > 2) return 0;
  g.tip++;
  const amt = g.vip ? Math.round(50 + P.incRate * 20) : Math.max(1, Math.round((1 + R() * 3) * (1 + P.rs * 0.5) * (1 + Math.min(5, P.incRate / 40))));
  earn(G, amt * incomeMult(G), P); G.st.tips++;
  g.hap = Math.min(1, g.hap + 0.2); say(g, '😄', 1.6);
  return amt;
}
export function cleanTile(G, P, x, y) { const c = y * P.n + x; if (inb(P, x, y) && P.litter[c]) { P.litter[c] = 0; G.st.cleaned++; earn(G, 1, P); return true; } return false; }

/* ---------- winst-schatting (inactief / offline) ---------- */
export const IDLE_EFF = 0.8;
const EST_K = 1.25;
export function estimate(G, P) {
  recomputeValue(P);
  const lam0 = arrivalRate(G, P, false);
  const cap = guestCap(P);
  const stay = 175;
  const gN = Math.min(lam0 * stay, cap);
  let lam = gN / stay;
  const mul = incomeMult(G);
  const rides = P.rides.filter((o) => reachable(P, o));
  let CR = 0, pw = 0;
  for (const o of rides) { const r = capEff(o) / cycleTime(o); CR += r; pw += r * Math.min(ridePrice(P, o), (P.prices[o.t] != null ? 1 : 1) * 1e9); }
  const avgPrice = CR > 0 ? pw / CR : 0;
  const wallet = 22 + 2.4 * P.V;
  const walkT = 22 + P.n;
  let rpg = CR > 0 ? Math.min(stay / (walkT + 14), wallet * 0.6 / Math.max(0.5, avgPrice), 8) : 0;
  rpg *= 0.9;
  let ridersPerSec = lam * rpg;
  const maxR = 0.65 * CR;
  if (ridersPerSec > maxR) ridersPerSec = maxR;
  const rideInc = ridersPerSec * avgPrice;
  // eten
  let foodInc = 0;
  const foods = P.objs.filter((o) => DEFS[o.t].k === 'food');
  if (foods.length) {
    const avgPr = foods.reduce((s, o) => s + DEFS[o.t].pr, 0) / foods.length;
    const buys = Math.min(2.2, 1.1 * stay / 100) * Math.min(1, foods.length * 0.33 * stay / Math.max(1, gN * 2) );
    foodInc = lam * buys * avgPr * 0.9;
  }
  const shops = P.objs.filter((o) => DEFS[o.t].k === 'shop');
  const shopInc = shops.length ? lam * 0.25 * 9 : 0;
  const entryInc = lam * P.entry;
  const gross = (entryInc + rideInc + foodInc + shopInc) * mul;
  let cost = P.staff.m * WAGE.m + P.staff.j * WAGE.j + P.staff.e * WAGE.e;
  for (const o of P.rides) cost += upkeepOf(o);
  // onderhoud: zonder monteurs valt een deel van de attracties uit
  const maint = rides.length ? clamp(0.5 + 0.5 * Math.min(1, P.staff.m * 4 / rides.length), 0.5, 1) : 1;
  const g2 = gross * maint * EST_K;
  return { gross: g2, cost, net: g2 - cost, lam, guests: gN, maint };
}

export function totalRate(G) {
  let net = 0, gross = 0;
  for (const P of G.parks) { const e = estimate(G, P); net += e.net; gross += e.gross; }
  return { net, gross };
}

// offline: verdien terwijl je weg was (max 8 uur)
export function offlineEff(G) { return Math.min(0.9, 0.5 + 0.05 * fr(G, 'slaap')); }
export function applyOffline(G, now) {
  const away = clamp((now - G.saved) / 1000, 0, OFFLINE_MAX);
  if (away < 90) return null;
  let net = 0;
  for (const P of G.parks) { P.rs = P.rs; net += estimate(G, P).net; }
  const eff = offlineEff(G);
  const gain = Math.max(0, Math.floor(net * away * eff));
  let rps = 0.4; for (const P of G.parks) for (const o of P.objs) if (o.t === 'lab') rps += DEFS.lab.rps * (1 + 0.1 * P.lvl);
  const rpGain = Math.floor(rps * rpMult(G) * away * eff);
  earn(G, gain); G.rp += rpGain;
  G.t += away;
  // wear en rommel: jouw gasten zijn weg
  for (const P of G.parks) { P.guests = []; P.litter.fill(0); for (const o of P.rides) { if (o.q) o.q = []; o.riders = []; } }
  return { away, gain, rpGain, eff };
}

/* ---------- dagelijkse beloning ---------- */
export function dailyState(G, now = Date.now()) {
  const today = dayKeyNow(now);
  const yest = dayKeyNow(now - 86400000);
  const can = G.daily.day !== today;
  const streak = G.daily.day === yest ? G.daily.streak : (G.daily.day === today ? G.daily.streak : 0);
  return { can, streak, next: can ? streak + 1 : streak + 1 };
}
export function claimDaily(G, now = Date.now()) {
  const s = dailyState(G, now); if (!s.can) return null;
  const st = s.streak + 1;
  const base = Math.max(400, totalRate(G).net * 240);
  const m = Math.round(base * (1 + Math.min(st, 7) * 0.25));
  const rp = Math.round(30 * Math.min(st, 7) * rpMult(G));
  const out = { m, rp, tk: 0 };
  if (st % 7 === 0) { out.tk = 1; G.tix += 1; G.tixAll += 1; }
  G.money += m; G.rp += rp;
  G.daily = { day: dayKeyNow(now), streak: st };
  return out;
}

/* ---------- franchise (prestige) ---------- */
export function franchiseGain(G) { return Math.max(0, Math.floor(Math.pow(G.earnedRun / 150000, 0.6))); }
export function buyFranchise(G, id) {
  const f = FRANCHISE[id], l = fr(G, id); if (!f || l >= f.max) return false;
  const c = f.cost(l); if (G.tix < c) return false;
  G.tix -= c; G.pp[id] = l + 1; return true;
}
export function startFranchise(G) {
  const gain = franchiseGain(G); if (gain < 1) return false;
  G.tix += gain; G.tixAll += gain; G.st.prestiges++;
  G.money = 900 + 1500 * fr(G, 'start'); G.rp = 0; G.earnedRun = 0; G.res = {}; G.goals = {};
  G.mk = { until: 0, mult: 1 }; G.ev = null; G.evMult = { until: 0, mult: 1 }; G.hot = 0;
  G.parks = [makePark(G, 0)]; G.cur = 0; G.reviews = []; G.nextEv = G.t + 120;
  G.tut = 99;
  return true;
}

/* ---------- slimme plek zoeken ---------- */
export function findSpot(P, id, near) {
  const d = DEFS[id], n = P.n, cands = [];
  for (let y = 0; y + d.h <= n; y++) for (let x = 0; x + d.w <= n; x++) {
    if (canPlace(P, id, x, y)) continue;
    if (!hasAccess(P, id, x, y) && d.k !== 'decor') continue;
    // dichtbij de weg en niet versperren: tel vrije buren rondom
    let score = 0;
    const cx = x + d.w / 2, cy = y + d.h / 2;
    const px = near ? near[0] : P.gx, py = near ? near[1] : n - 1;
    score -= Math.hypot(cx - px, cy - py) * 0.4;
    // liefst langs de weg (al aanwezig), niet in een doodlopende hoek
    cands.push([score + R() * 0.8, x, y]);
  }
  if (!cands.length) return null;
  cands.sort((a, b) => b[0] - a[0]);
  return { x: cands[0][1], y: cands[0][2] };
}
// bouw een weg naar een plek (voor auto-uitbreiding): lijn vanaf bestaande weg
export function roadTo(G, P, x, y) {
  // vind dichtstbijzijnde wegtegel
  let best = -1, bd = 1e9;
  for (let c = 0; c < P.roads.length; c++) if (P.roads[c]) { const rx = c % P.n, ry = (c - rx) / P.n; const d = Math.abs(rx - x) + Math.abs(ry - y); if (d < bd) { bd = d; best = c; } }
  if (best < 0) return 0;
  let cx = best % P.n, cy = (best - cx) / P.n, built = 0;
  while ((cx !== x || cy !== y) && built < 40) {
    if (cx !== x) cx += Math.sign(x - cx); else cy += Math.sign(y - cy);
    const c = cy * P.n + cx;
    if (P.occ[c]) break;
    if (!P.roads[c]) { if (!paintRoad(G, P, cx, cy)) break; built++; }
  }
  return built;
}

/* =====================================================================
   9. OPSLAAN (compact, versioneerd)
   ===================================================================== */
const r0 = Math.round;
function rleRoads(roads) {
  const out = []; let cur = 0, run = 0;
  for (let i = 0; i < roads.length; i++) { const v = roads[i] ? 1 : 0; if (v === cur) run++; else { out.push(run); cur = v; run = 1; } }
  out.push(run); return out;
}
function unrle(arr, n) {
  const roads = new Uint8Array(n * n); let i = 0, cur = 0;
  for (const run of arr) { if (cur) for (let k = 0; k < run && i + k < roads.length; k++) roads[i + k] = 1; i += run; cur = cur ? 0 : 1; }
  return roads;
}

export function packGame(G, now = Date.now()) {
  G.saved = now;
  const resKeys = {};
  for (const k of Object.keys(G.res)) resKeys[k.startsWith('p:') ? k : ORDER.indexOf(k)] = G.res[k];
  const o = {
    v: VERSION, u: G.uid, c: G.created, s: now, t: r0(G.t), m: r0(G.money), r: r0(G.rp), k: G.tix, ka: G.tixAll, e: r0(G.earnedRun), ea: r0(G.earnedAll),
    rs: resKeys, pp: G.pp, go: Object.keys(G.goals).map((id) => GOALS.findIndex((g) => g.id === id)).filter((i) => i >= 0),
    ac: Object.keys(G.ach).map((id) => ACHS.findIndex((a) => a.id === id)).filter((i) => i >= 0),
    da: [G.daily.day, G.daily.streak], st: { ...G.st, play: r0(G.st.play), rev: r0(G.st.rev) }, se: [G.set.sfx, G.set.mus, G.set.spd], tu: G.tut, cu: G.cur,
    rv: G.reviews.slice(0, 8).map((r) => [r.s, r.t, r.p, r.k]), rn: G.revN, rsum: G.revSum, mk: [r0(G.mk.until), G.mk.mult, G.mk.id || ''], nx: r0(G.nextEv),
    pk: G.parks.map((P) => {
      const flat = [];
      for (const ob of P.objs) flat.push(ORDER.indexOf(ob.t), ob.x, ob.y, ob.l, r0(ob.wear || 0));
      const pr = {}; for (const k of Object.keys(P.prices)) pr[ORDER.indexOf(k)] = P.prices[k];
      return { i: P.i, l: P.lvl, ro: rleRoads(P.roads), o: flat, en: P.entry, au: P.auto ? 1 : 0, pr, sf: [P.staff.m, P.staff.j, P.staff.e], rs: Math.round(P.rs * 100) / 100, rv: r0(P.rev), vi: P.vis, re: P.rvE == null ? 0 : Math.round(P.rvE * 100) / 100, rnn: P.rvN || 0 };
    }),
  };
  let s = JSON.stringify(o);
  if (s.length > MAXSAVE) { o.rv = []; s = JSON.stringify(o); }
  if (s.length > MAXSAVE) { for (const p of o.pk) { const f = p.o; for (let i = 4; i < f.length; i += 5) f[i] = 0; } s = JSON.stringify(o); }
  return s;
}

export function unpackGame(str, uid) {
  let o;
  try { o = typeof str === 'string' ? JSON.parse(str) : str; } catch (e) { return null; }
  if (!o || typeof o !== 'object' || !Array.isArray(o.pk) || !o.pk.length) return null;
  o = migrate(o);
  const G = newGame(uid || o.u || 'x', o.c || Date.now());
  G.parks = [];
  G.t = +o.t || 0; G.money = +o.m || 0; G.rp = +o.r || 0; G.tix = +o.k || 0; G.tixAll = +o.ka || 0; G.earnedRun = +o.e || 0; G.earnedAll = +o.ea || 0;
  G.saved = +o.s || Date.now(); G.created = +o.c || G.saved;
  G.res = {};
  for (const k of Object.keys(o.rs || {})) { if (k.startsWith('p:')) { if (PERKS[k.slice(2)]) G.res[k] = o.rs[k]; } else { const id = ORDER[+k]; if (id) G.res[id] = o.rs[k]; } }
  G.pp = {}; for (const k of Object.keys(o.pp || {})) if (FRANCHISE[k]) G.pp[k] = o.pp[k];
  G.goals = {}; for (const i of o.go || []) if (GOALS[i]) G.goals[GOALS[i].id] = 1;
  G.ach = {}; for (const i of o.ac || []) if (ACHS[i]) G.ach[ACHS[i].id] = 1;
  G.daily = { day: (o.da && o.da[0]) || '', streak: (o.da && o.da[1]) || 0 };
  G.st = { ...G.st, ...(o.st || {}) };
  G.set = { sfx: o.se ? o.se[0] : 1, mus: o.se ? o.se[1] : 1, spd: o.se ? o.se[2] || 1 : 1 };
  G.tut = o.tu == null ? 99 : o.tu;
  G.reviews = (o.rv || []).map((r) => ({ s: r[0], t: String(r[1] || ''), p: r[2] || 0, k: r[3] || 0 }));
  G.revN = o.rn || 0; G.revSum = o.rsum || 0;
  G.mk = { until: (o.mk && o.mk[0]) || 0, mult: (o.mk && o.mk[1]) || 1, id: (o.mk && o.mk[2]) || '' };
  G.nextEv = o.nx || G.t + 120;
  for (const p of o.pk) {
    const meta = PARKS[p.i]; if (!meta) continue;
    const lvl = clamp(p.l | 0, 0, meta.sizes.length - 1), n = meta.sizes[lvl];
    const P = { id: meta.id, i: p.i, n, lvl, roads: unrle(p.ro || [], n), objs: [], nid: 1, entry: p.en != null ? +p.en : 5, auto: p.au == null ? true : !!p.au, prices: {}, staff: { m: (p.sf && p.sf[0]) | 0, j: (p.sf && p.sf[1]) | 0, e: (p.sf && p.sf[2]) | 0 }, rs: p.rs || 1, rev: p.rv || 0, vis: p.vi || 0, gx: Math.floor(meta.sizes[0] / 2) };
    // poort mee verschoven door uitbreiding
    let gx = Math.floor(meta.sizes[0] / 2); for (let l = 1; l <= lvl; l++) gx += meta.sizes[l] - meta.sizes[l - 1]; P.gx = gx;
    P.roads[(n - 1) * n + gx] = 1;
    for (const k of Object.keys(p.pr || {})) { const id = ORDER[+k]; if (id && DEFS[id].k === 'ride') P.prices[id] = +p.pr[k]; }
    const f = p.o || [];
    for (let i = 0; i + 4 < f.length; i += 5) {
      const id = ORDER[f[i]], d = DEFS[id]; if (!d) continue;
      const x = f[i + 1] | 0, y = f[i + 2] | 0;
      if (x < 0 || y < 0 || x + d.w > n || y + d.h > n) continue;
      P.objs.push({ id: P.nid++, t: id, x, y, l: clamp(f[i + 3] | 0, 0, 3), wear: +f[i + 4] || 0 });
    }
    if (p.re) { P.rvE = p.re; P.rvN = p.rnn || 0; }
    rt(P);
    G.parks.push(P);
  }
  if (!G.parks.length) return null;
  G.parks.sort((a, b) => a.i - b.i);
  G.cur = clamp(o.cu | 0, 0, G.parks.length - 1);
  return G;
}

function migrate(o) {
  // toekomstige versies: v1 -> v2 ... hier omzetten
  if (!o.v) o.v = 1;
  return o;
}

// bezoekers voor de start (zodat een geladen park niet leeg is)
export function populate(G, P, frac = 0.7) {
  if (!P.rides.length) return;
  calcRating(G, P);
  const e = estimate(G, P);
  const want = Math.min(guestCap(P), Math.floor(e.guests * frac));
  const cells = []; for (let c = 0; c < P.roads.length; c++) if (P.roads[c]) cells.push(c);
  if (!cells.length) return;
  const gf = gateField(P);
  for (let i = 0; i < want; i++) {
    const g = newGuest(G, P), c = pick(cells);
    if (gf[c] >= INF) continue;
    const x = c % P.n, y = (c - x) / P.n;
    g.cx = x; g.cy = y; g.x = x + 0.5 + g.ox; g.y = y + 0.5 + g.oy; g.tx = x; g.ty = y; g.px = g.x; g.py = g.y; g.born = true;
    g.age = rr(0, g.stay * 0.7); g.hun = rr(0, 0.6); g.thi = rr(0, 0.6); g.bla = rr(0, 0.5); g.wal = g.w0 * rr(0.3, 1);
    P.guests.push(g);
  }
}

/* =====================================================================
   10. TEKENEN: isometrische wereld (canvas)
   ===================================================================== */
const X = (x, y) => (x - y) * 32;
const Y = (x, y, z) => (x + y) * 16 - (z || 0);
const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const shadeCache = new Map();
function shade(col, k) {
  const key = col + k;
  let v = shadeCache.get(key);
  if (v) return v;
  const [r, g, b] = hexRgb(col);
  if (k < 1) v = `rgb(${r * k | 0},${g * k | 0},${b * k | 0})`;
  else { const t = k - 1; v = `rgb(${r + (255 - r) * t | 0},${g + (255 - g) * t | 0},${b + (255 - b) * t | 0})`; }
  shadeCache.set(key, v);
  return v;
}
let C = null;                             // huidige 2D-context
let LIGHTS = [];                          // lichtjes die 's nachts gloeien
let ENV = { T: 0, night: 0, season: 0, theme: 'meadow', wx: 0 };

function fpoly(pts, fill, stroke, lw) {
  C.beginPath(); C.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) C.lineTo(pts[i], pts[i + 1]);
  C.closePath();
  if (fill) { C.fillStyle = fill; C.fill(); }
  if (stroke) { C.strokeStyle = stroke; C.lineWidth = lw || 1; C.stroke(); }
}
function quad3(x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4, fill, stroke) {
  fpoly([X(x1, y1), Y(x1, y1, z1), X(x2, y2), Y(x2, y2, z2), X(x3, y3), Y(x3, y3, z3), X(x4, y4), Y(x4, y4, z4)], fill, stroke);
}
function flat(x0, y0, w, d, z, fill, stroke) { quad3(x0, y0, z, x0 + w, y0, z, x0 + w, y0 + d, z, x0, y0 + d, z, fill, stroke); }
function box(x0, y0, w, d, z0, h, col, k) {
  const z1 = z0 + h, kk = k || 1;
  // linkervlak (y = y0 + d), rechtervlak (x = x0 + w), bovenvlak
  quad3(x0, y0 + d, z0, x0 + w, y0 + d, z0, x0 + w, y0 + d, z1, x0, y0 + d, z1, shade(col, 0.8 * kk));
  quad3(x0 + w, y0, z0, x0 + w, y0 + d, z0, x0 + w, y0 + d, z1, x0 + w, y0, z1, shade(col, 0.62 * kk));
  quad3(x0, y0, z1, x0 + w, y0, z1, x0 + w, y0 + d, z1, x0, y0 + d, z1, shade(col, 1.08 * kk));
}
function ell(cx, cy, z, r, fill, stroke, lw) {
  C.beginPath(); C.ellipse(X(cx, cy), Y(cx, cy, z), r * 45.25, r * 22.63, 0, 0, 6.2832);
  if (fill) { C.fillStyle = fill; C.fill(); }
  if (stroke) { C.strokeStyle = stroke; C.lineWidth = lw || 1; C.stroke(); }
}
function cyl(cx, cy, r, z0, h, col) {
  const px = X(cx, cy), rx = r * 45.25, ry = r * 22.63, yb = Y(cx, cy, z0), yt = Y(cx, cy, z0 + h);
  C.beginPath(); C.moveTo(px - rx, yt); C.lineTo(px - rx, yb); C.ellipse(px, yb, rx, ry, 0, Math.PI, 0, true); C.lineTo(px + rx, yt); C.ellipse(px, yt, rx, ry, 0, 0, Math.PI, false); C.closePath();
  C.fillStyle = shade(col, 0.78); C.fill();
  // lichtere band links voor volume
  C.beginPath(); C.ellipse(px, yt, rx, ry, 0, 0, 6.2832); C.fillStyle = shade(col, 1.1); C.fill();
}
function line3(pts, col, lw) {
  C.beginPath();
  for (let i = 0; i < pts.length; i += 3) { const x = X(pts[i], pts[i + 1]), y = Y(pts[i], pts[i + 1], pts[i + 2]); if (i === 0) C.moveTo(x, y); else C.lineTo(x, y); }
  C.strokeStyle = col; C.lineWidth = lw || 2; C.lineJoin = 'round'; C.lineCap = 'round'; C.stroke();
}
function pole(x, y, z0, z1, col, lw) { C.beginPath(); C.moveTo(X(x, y), Y(x, y, z0)); C.lineTo(X(x, y), Y(x, y, z1)); C.strokeStyle = col; C.lineWidth = lw || 2; C.lineCap = 'round'; C.stroke(); }
function ball(x, y, z, r, col) { C.beginPath(); C.arc(X(x, y), Y(x, y, z), r, 0, 6.2832); C.fillStyle = col; C.fill(); }
function dot3(x, y, z, r, col) { ball(x, y, z, r, col); }
function cone(cx, cy, r, z0, h, cols, seg, rot) {
  seg = seg || 8; rot = rot || 0;
  const apx = X(cx, cy), apy = Y(cx, cy, z0 + h), list = [];
  for (let i = 0; i < seg; i++) {
    const a0 = rot + i / seg * 6.2832, a1 = rot + (i + 1) / seg * 6.2832, am = (a0 + a1) / 2;
    list.push([Math.sin(am) + Math.cos(am), i, a0, a1]);   // diepte: x+y
  }
  list.sort((p, q) => p[0] - q[0]);
  for (const [, i, a0, a1] of list) {
    const x1 = cx + Math.cos(a0) * r, y1 = cy + Math.sin(a0) * r, x2 = cx + Math.cos(a1) * r, y2 = cy + Math.sin(a1) * r;
    const am = (a0 + a1) / 2, lt = 0.8 + 0.25 * (-Math.cos(am) - Math.sin(am)) * 0.5;
    fpoly([apx, apy, X(x1, y1), Y(x1, y1, z0), X(x2, y2), Y(x2, y2, z0)], shade(cols[i % cols.length], clamp(lt, 0.55, 1.2)));
  }
}
function gable(x0, y0, w, d, z, h, col) { // dak met nok langs de x-as (zichtbare zijden)
  const ym = y0 + d / 2;
  quad3(x0, ym, z + h, x0 + w, ym, z + h, x0 + w, y0 + d, z, x0, y0 + d, z, shade(col, 0.95));
  quad3(x0, y0, z, x0 + w, y0, z, x0 + w, ym, z + h, x0, ym, z + h, shade(col, 1.12));
  fpoly([X(x0 + w, y0), Y(x0 + w, y0, z), X(x0 + w, y0 + d), Y(x0 + w, y0 + d, z), X(x0 + w, ym), Y(x0 + w, ym, z + h)], shade(col, 0.66));
}
function shadow(cx, cy, r, a) { ell(cx, cy, 0, r, `rgba(0,0,0,${a || 0.16})`); }
function text(t, x, y, size, alpha) {
  C.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif`; C.textAlign = 'center'; C.textBaseline = 'middle';
  if (alpha != null) C.globalAlpha = alpha;
  C.fillText(t, x, y);
  if (alpha != null) C.globalAlpha = 1;
}
function badge(emoji, x, y, z, size, bob) {
  const px = X(x, y), py = Y(x, y, z) + (bob ? Math.sin(ENV.T * 2 + x) * 1.5 : 0);
  C.beginPath(); C.arc(px, py, size * 0.72, 0, 6.2832); C.fillStyle = 'rgba(255,255,255,.92)'; C.fill();
  C.strokeStyle = 'rgba(0,0,0,.12)'; C.lineWidth = 1; C.stroke();
  text(emoji, px, py + 1, size);
}
function glow(x, y, z, r, col) { LIGHTS.push([X(x, y), Y(x, y, z), r, col || '255,220,140']); }
function awning(x0, y0, w, d, z, col, alt) {
  const n = Math.max(3, Math.round(w * 4)), sw = w / n;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * sw, b = a + sw;
    quad3(a, y0 + d, z, b, y0 + d, z, b, y0 + d + 0.28, z - 7, a, y0 + d + 0.28, z - 7, i % 2 ? (alt || '#ffffff') : col);
  }
}
const SEASON_LEAF = [['#8fd16b', '#a6e07f'], ['#4fb04a', '#63c25d'], ['#e0872b', '#d95d2a'], ['#eef6fb', '#dce9f2']];
function tree(x, y, id, scale) {
  const sway = Math.sin(ENV.T * 1.1 + id) * 1.2, s = scale || 1;
  shadow(x, y, 0.4 * s, 0.18);
  pole(x, y, 0, 16 * s, '#7a5230', 4 * s);
  if (ENV.theme === 'snow') { // den
    for (let k = 0; k < 3; k++) { const z = 10 + k * 11, w = (14 - k * 3.2) * s; const px = X(x, y), py = Y(x, y, z); fpoly([px + sway * k * 0.3, py - 18 * s, px - w, py + 3, px + w, py + 3], k % 2 ? '#2f7d4f' : '#2a6f46'); fpoly([px + sway * k * 0.3, py - 18 * s, px - w * 0.6, py - 6 * s, px + w * 0.6, py - 6 * s], 'rgba(255,255,255,.85)'); }
    return;
  }
  const lc = SEASON_LEAF[ENV.season];
  ball(x, y, 24 * s, 13 * s, lc[0]);
  const px = X(x, y) + sway, py = Y(x, y, 30 * s);
  C.beginPath(); C.arc(px - 5 * s, py - 1, 9 * s, 0, 6.2832); C.fillStyle = lc[1]; C.fill();
  C.beginPath(); C.arc(px + 6 * s, py + 3, 8 * s, 0, 6.2832); C.fillStyle = shade(lc[0], 0.88); C.fill();
  if (ENV.season === 0) for (let k = 0; k < 4; k++) ball(x + Math.cos(id + k) * 0.12, y + Math.sin(id * 2 + k) * 0.1, 24 * s + (k - 2) * 4, 1.6, '#ffc2da');
}

/* ---------- attracties ---------- */
const COLS4 = ['#ff595e', '#ffca3a', '#1982c4', '#8ac926'];
const DR = {};
function runOf(o) { return o.st === 1 && !o.broken; }

DR.theekopjes = (o, a) => {
  const cx = o.x + 1, cy = o.y + 1;
  shadow(cx, cy, 1.0, 0.2);
  cyl(cx, cy, 0.95, 0, 5, '#f3a5c4');
  cyl(cx, cy, 0.14, 5, 28, '#d9d2c0');
  const cups = [];
  for (let i = 0; i < 4; i++) { const an = a + i * 1.5708; cups.push([cx + 0.62 * Math.cos(an), cy + 0.62 * Math.sin(an), i]); }
  cups.sort((p, q) => p[0] + p[1] - q[0] - q[1]);
  for (const [px, py, i] of cups) { cyl(px, py, 0.2, 5, 9, COLS4[i]); ell(px, py, 14, 0.15, shade(COLS4[i], 0.55)); if (runOf(o)) ball(px, py, 17, 3, '#ffd9b3'); }
  cone(cx, cy, 0.5, 33, 10, ['#ff6fa5', '#ffffff'], 8, a * 0.5);
  ball(cx, cy, 45, 2.5, '#ffd23f'); glow(cx, cy, 30, 40);
};
DR.draaimolen = (o, a) => {
  const cx = o.x + 1, cy = o.y + 1;
  shadow(cx, cy, 1.05, 0.2);
  cyl(cx, cy, 0.98, 0, 5, '#f4c27a');
  cyl(cx, cy, 0.22, 5, 36, '#e8c55a');
  for (let i = 0; i < 6; i++) {
    const an = a + i * 1.0472, px = cx + 0.68 * Math.cos(an), py = cy + 0.68 * Math.sin(an), up = 10 + 5 * Math.sin(a * 3 + i * 1.7);
    pole(px, py, 5, 36, '#f6f2e6', 1.6);
  }
  const hs = [];
  for (let i = 0; i < 6; i++) { const an = a + i * 1.0472; hs.push([cx + 0.68 * Math.cos(an), cy + 0.68 * Math.sin(an), 10 + 5 * Math.sin(a * 3 + i * 1.7)]); }
  hs.sort((p, q) => p[0] + p[1] - q[0] - q[1]);
  for (const [px, py, z] of hs) text(i2h(px + py), X(px, py), Y(px, py, z + 7), 13);
  cone(cx, cy, 1.05, 38, 15, ['#e63946', '#fff3d6'], 12, a * 0.3);
  for (let i = 0; i < 10; i++) { const an = i / 10 * 6.2832; const bx = cx + 1.0 * Math.cos(an), by = cy + 1.0 * Math.sin(an); ball(bx, by, 39, 1.5, (Math.floor(ENV.T * 3) + i) % 2 ? '#fff6a0' : '#ff9ec7'); }
  ball(cx, cy, 55, 3, '#ffd23f'); glow(cx, cy, 40, 55);
};
const i2h = (v) => (Math.floor(v * 3) % 2 ? '🐴' : '🦄');
DR.kinderboerderij = (o, a) => {
  const x0 = o.x, y0 = o.y;
  flat(x0 + 0.05, y0 + 0.05, 2.9, 1.9, 0, '#9bd36e', 'rgba(60,110,40,.5)');
  // hek
  for (let i = 0; i <= 6; i++) { const x = x0 + 0.1 + i * 0.47; pole(x, y0 + 0.1, 0, 7, '#b88b5a', 2); pole(x, y0 + 1.9, 0, 7, '#b88b5a', 2); }
  line3([x0 + 0.1, y0 + 0.1, 5, x0 + 2.9, y0 + 0.1, 5], '#b88b5a', 1.4);
  for (let i = 0; i <= 4; i++) { const y = y0 + 0.1 + i * 0.45; pole(x0 + 0.1, y, 0, 7, '#b88b5a', 2); pole(x0 + 2.9, y, 0, 7, '#b88b5a', 2); }
  // stal
  box(x0 + 0.25, y0 + 0.25, 1.1, 0.8, 0, 18, '#c0392b'); gable(x0 + 0.2, y0 + 0.2, 1.2, 0.9, 18, 10, '#8b3a2f');
  fpoly([X(x0 + 0.8, y0 + 1.05), Y(x0 + 0.8, y0 + 1.05, 0), X(x0 + 1.1, y0 + 1.05), Y(x0 + 1.1, y0 + 1.05, 0), X(x0 + 1.1, y0 + 1.05), Y(x0 + 1.1, y0 + 1.05, 11), X(x0 + 0.8, y0 + 1.05), Y(x0 + 0.8, y0 + 1.05, 11)], '#5a2a20');
  const an = ['🐐', '🐑', '🐖', '🐓'];
  for (let i = 0; i < 4; i++) { const px = x0 + 1.4 + (i % 2) * 0.7 + 0.35 * Math.sin(ENV.T * 0.5 + i * 2), py = y0 + 0.9 + (i >> 1) * 0.55 + 0.1 * Math.cos(ENV.T * 0.7 + i); text(an[i], X(px, py), Y(px, py, 7), 13); }
  text('🌻', X(x0 + 2.6, y0 + 0.4), Y(x0 + 2.6, y0 + 0.4, 8), 12);
};
DR.botsauto = (o, a) => {
  const x0 = o.x, y0 = o.y, cx = x0 + 1.5, cy = y0 + 1.5;
  flat(x0 + 0.05, y0 + 0.05, 2.9, 2.9, 0, '#4b5068', 'rgba(255,255,255,.2)');
  flat(x0 + 0.3, y0 + 0.3, 2.4, 2.4, 0, '#5a6080');
  const cars = [];
  for (let i = 0; i < 5; i++) { const px = cx + 0.95 * Math.sin(a * 1.1 + i * 1.7), py = cy + 0.95 * Math.sin(a * 0.9 + i * 2.3 + 1); cars.push([px, py, i]); }
  cars.sort((p, q) => p[0] + p[1] - q[0] - q[1]);
  const cc = ['#ff595e', '#ffca3a', '#1982c4', '#8ac926', '#ff924c'];
  for (const [px, py, i] of cars) { box(px - 0.17, py - 0.12, 0.34, 0.24, 1, 6, cc[i]); box(px - 0.08, py - 0.07, 0.16, 0.14, 7, 3, shade(cc[i], 1.25)); if (runOf(o)) ball(px, py, 11, 2.2, '#ffd9b3'); }
  // rand
  box(x0, y0 + 2.9, 3, 0.1, 0, 5, '#ff595e'); box(x0 + 2.9, y0, 0.1, 2.9, 0, 5, '#e63946');
  // dak op palen, doorzichtig
  for (const [px, py] of [[x0 + 0.1, y0 + 0.1], [x0 + 2.9, y0 + 0.1], [x0 + 0.1, y0 + 2.9], [x0 + 2.9, y0 + 2.9]]) pole(px, py, 0, 36, '#dcd6c5', 2);
  C.globalAlpha = 0.5; flat(x0 + 0.1, y0 + 0.1, 2.8, 2.8, 36, '#ffd23f'); C.globalAlpha = 1;
  for (let i = 0; i < 6; i++) ball(x0 + 0.2 + i * 0.5, y0 + 2.9, 36, 1.6, (Math.floor(ENV.T * 4) + i) % 2 ? '#fff6a0' : '#ff9ec7');
  glow(cx, cy, 30, 70, '255,200,120');
};
DR.spookhuis = (o, a) => {
  const x0 = o.x, y0 = o.y;
  shadow(x0 + 1.5, y0 + 1.5, 1.4, 0.2);
  box(x0 + 0.25, y0 + 0.25, 2.5, 2.5, 0, 38, '#5b4a8a');
  gable(x0 + 0.1, y0 + 0.1, 2.8, 2.8, 38, 22, '#2b2347');
  box(x0 + 2.0, y0 + 0.5, 0.35, 0.35, 38, 22, '#3b3358');
  // ramen
  const fl = (Math.sin(ENV.T * 7 + o.id) > -0.3) ? '#ffe680' : '#7a6a40';
  for (let i = 0; i < 2; i++) { const x = x0 + 0.55 + i * 1.1; quad3(x, y0 + 2.75, 22, x + 0.45, y0 + 2.75, 22, x + 0.45, y0 + 2.75, 32, x, y0 + 2.75, 32, i ? '#ffe680' : fl); }
  for (let i = 0; i < 2; i++) { const y = y0 + 0.5 + i * 1.2; quad3(x0 + 2.75, y, 20, x0 + 2.75, y + 0.5, 20, x0 + 2.75, y + 0.5, 32, x0 + 2.75, y, 32, i ? fl : '#ffe680'); }
  // deur
  quad3(x0 + 1.2, y0 + 2.75, 0, x0 + 1.9, y0 + 2.75, 0, x0 + 1.9, y0 + 2.75, 16, x0 + 1.2, y0 + 2.75, 16, '#1d1630');
  const gy = 58 + Math.sin(ENV.T * 1.6) * 3;
  text('👻', X(x0 + 1.5, y0 + 1.5), Y(x0 + 1.5, y0 + 1.5, 0) - gy - 10, 20, 0.9);
  text('🦇', X(x0 + 0.5 + 0.4 * Math.sin(ENV.T), y0 + 0.5), Y(x0 + 0.5, y0 + 0.5, 70) - 8 * Math.abs(Math.sin(ENV.T * 5)), 11);
  glow(x0 + 1.5, y0 + 2.7, 24, 60, '150,100,255');
};
DR.reuzenrad = (o, a) => {
  const cx = o.x + 1.5, cy = o.y + 1.5, zc = 72, Rv = 52, Rx = 1.45;
  shadow(cx, cy, 1.3, 0.2);
  box(cx - 1.0, cy + 0.7, 2.0, 0.5, 0, 6, '#c9c2b0');
  for (const s of [-1, 1]) { line3([cx + s * 1.1, cy + 0.9, 3, cx, cy, zc], '#e8e2d2', 4); line3([cx + s * 1.1, cy - 0.9, 3, cx, cy, zc], '#cfc8b6', 4); }
  const pt = (an, r) => [cx + Rx * r * Math.cos(an), cy, zc + Rv * r * Math.sin(an)];
  C.beginPath();
  for (let i = 0; i <= 40; i++) { const p = pt(i / 40 * 6.2832, 1); const x = X(p[0], p[1]), y = Y(p[0], p[1], p[2]); if (i) C.lineTo(x, y); else C.moveTo(x, y); }
  C.strokeStyle = '#ff6f91'; C.lineWidth = 3.2; C.stroke();
  C.beginPath();
  for (let i = 0; i <= 40; i++) { const p = pt(i / 40 * 6.2832, 0.7); const x = X(p[0], p[1]), y = Y(p[0], p[1], p[2]); if (i) C.lineTo(x, y); else C.moveTo(x, y); }
  C.strokeStyle = '#ffd1dc'; C.lineWidth = 1.5; C.stroke();
  for (let i = 0; i < 12; i++) { const an = a + i * 0.5236, p = pt(an, 1); line3([cx, cy, zc, p[0], p[1], p[2]], '#fff0f4', 1.1); }
  for (let i = 0; i < 12; i++) { const an = a + i * 0.5236, p = pt(an, 1); const col = ['#ffca3a', '#1982c4', '#8ac926', '#ff595e', '#9b5de5', '#2ec4b6'][i % 6]; box(p[0] - 0.12, p[1] - 0.09, 0.24, 0.18, p[2] - 13, 9, col); }
  ball(cx, cy, zc, 4, '#ffd23f');
  for (let i = 0; i < 12; i++) { const p = pt(a + i * 0.5236, 1.04); ball(p[0], p[1], p[2], 1.3, (Math.floor(ENV.T * 3) + i) % 2 ? '#fff6a0' : '#ff9ec7'); }
  glow(cx, cy, zc, 90, '255,150,190');
};
DR.piratenschip = (o, a) => {
  const cx = o.x + 1.5, cy = o.y + 1.5, zp = 78;
  shadow(cx, cy, 1.3, 0.2);
  box(cx - 0.4, cy - 1.3, 0.8, 2.6, 0, 6, '#b08968');
  for (const s of [-1, 1]) { line3([cx - 0.5, cy + s * 1.25, 3, cx, cy + s * 1.25, zp], '#8a5a3a', 4); line3([cx + 0.5, cy + s * 1.25, 3, cx, cy + s * 1.25, zp], '#a06c48', 4); }
  line3([cx, cy - 1.25, zp, cx, cy + 1.25, zp], '#5a3a28', 4);
  const amp = runOf(o) ? 1.05 : 0.12, th = amp * Math.sin(a * 1.6);
  const L = 62, ct = Math.cos(th), st = Math.sin(th);
  // punt in (tegel-x, z) rond de scharnier; hx in px langs x-as (1 tegel ~ 35.8 px)
  const ptp = (u, v) => { const hx = u * 35.8, vz = -L + v; const rx = hx * ct - vz * st, rz = hx * st + vz * ct; return [cy, cx + rx / 35.8, zp + rz]; };
  const hull = [[-1.0, 8], [-0.6, -4], [0.6, -4], [1.0, 8], [0.6, 3], [-0.6, 3]];
  C.beginPath();
  for (let i = 0; i < hull.length; i++) { const p = ptp(hull[i][0], hull[i][1]); const x = X(p[1], p[0]), y = Y(p[1], p[0], p[2]); if (i) C.lineTo(x, y); else C.moveTo(x, y); }
  C.closePath(); C.fillStyle = '#b5472f'; C.fill(); C.strokeStyle = '#6e2616'; C.lineWidth = 1.5; C.stroke();
  line3([...(() => { const p = ptp(0, 3); return [p[1], p[0], p[2]]; })(), ...(() => { const p = ptp(0, 38); return [p[1], p[0], p[2]]; })()], '#4a2c1a', 2.5);
  { const p = ptp(0, 34), q = ptp(0.45, 24), r = ptp(0, 14); fpoly([X(p[1], p[0]), Y(p[1], p[0], p[2]), X(q[1], q[0]), Y(q[1], q[0], q[2]), X(r[1], r[0]), Y(r[1], r[0], r[2])], '#f6f1e3'); }
  { const p = ptp(0, 40); text('☠️', X(p[1], p[0]), Y(p[1], p[0], p[2]), 9); }
  if (runOf(o)) for (let i = -2; i <= 2; i++) { const p = ptp(i * 0.3, 8); ball(p[1], p[0], p[2], 2, ['#ff595e', '#ffca3a', '#1982c4'][(i + 2) % 3]); }
  glow(cx, cy, zp - 30, 60, '255,170,90');
};
DR.waterglijbaan = (o, a) => {
  const x0 = o.x, y0 = o.y;
  // bad
  flat(x0 + 0.1, y0 + 1.35, 2.8, 1.55, 0, '#eaf7fb', 'rgba(0,0,0,.15)');
  flat(x0 + 0.25, y0 + 1.5, 2.5, 1.25, 0.6, '#5ec8f0');
  const rp = (ENV.T * 1.5) % 6.28;
  C.strokeStyle = 'rgba(255,255,255,.7)'; C.lineWidth = 1;
  for (let k = 0; k < 3; k++) { ell(x0 + 1.5 + k * 0.45 - 0.45, y0 + 2.1 + Math.sin(rp + k) * 0.1, 1, 0.22 + 0.04 * Math.sin(rp * 2 + k), null, 'rgba(255,255,255,.7)', 1); }
  // toren
  box(x0 + 0.2, y0 + 0.2, 0.9, 0.9, 0, 56, '#2ec4d6'); box(x0 + 0.1, y0 + 0.1, 1.1, 1.1, 56, 4, '#f6f2e6');
  for (let z = 6; z < 54; z += 8) line3([x0 + 1.12, y0 + 0.3, z, x0 + 1.12, y0 + 1.0, z], '#fff', 1);
  const path = [[0.65, 0.65, 60], [1.7, 0.7, 52], [2.6, 0.9, 44], [2.7, 1.8, 34], [2.0, 2.2, 24], [1.2, 2.0, 16], [1.5, 1.7, 6]];
  const flatp = []; path.forEach((p) => flatp.push(x0 + p[0], y0 + p[1], p[2]));
  const sp = []; for (let i = 0; i + 2 < flatp.length; i += 3) { sp.push(flatp[i], flatp[i + 1], flatp[i + 2]); }
  for (let i = 1; i < path.length - 1; i++) pole(x0 + path[i][0], y0 + path[i][1], 0, path[i][2] - 2, '#cfd8dc', 2);
  line3(sp, '#c1a100', 9); line3(sp, '#ffd23f', 7); line3(sp, '#fff1a8', 2.5);
  if (runOf(o)) { const ph = (o.tm / DEFS.waterglijbaan.dur * 3) % 1; const idx = ph * (path.length - 1), i0 = Math.floor(idx), f = idx - i0; const p0 = path[i0], p1 = path[Math.min(path.length - 1, i0 + 1)]; ball(x0 + p0[0] + (p1[0] - p0[0]) * f, y0 + p0[1] + (p1[1] - p0[1]) * f, p0[2] + (p1[2] - p0[2]) * f + 4, 3, '#ff595e'); if (f > 0.8 && i0 === path.length - 2) { for (let k = 0; k < 4; k++) ball(x0 + 1.5 + (k - 1.5) * 0.15, y0 + 1.7, 2 + Math.random() * 9, 1.8, 'rgba(255,255,255,.9)'); } }
  text('🌴', X(x0 + 2.8, y0 + 2.8), Y(x0 + 2.8, y0 + 2.8, 12), 16);
};
function coasterPt(s, cx, cy) {
  const an = s * 6.2832;
  const rx = 1.7 * (1 + 0.14 * Math.cos(an * 3 + 0.5)), ry = 1.55 * (1 + 0.12 * Math.sin(an * 2));
  const h = 14 + 52 * Math.pow(0.5 + 0.5 * Math.sin(an * 2 - 1.2), 1.4) + 20 * Math.max(0, Math.sin(an * 3 + 2)) * 0.5;
  return [cx + rx * Math.cos(an), cy + ry * Math.sin(an), h];
}
DR.achtbaan = (o, a) => {
  const x0 = o.x, y0 = o.y, cx = x0 + 2, cy = y0 + 2;
  shadow(cx, cy, 2.0, 0.14);
  const pts = []; const N = 56;
  for (let i = 0; i < N; i++) pts.push(coasterPt(i / N, cx, cy));
  // steunen
  for (let i = 0; i < N; i += 2) pole(pts[i][0], pts[i][1], 0, pts[i][2], 'rgba(235,235,240,.9)', 1.6);
  const fl = []; for (let i = 0; i <= N; i++) { const p = pts[i % N]; fl.push(p[0], p[1], p[2]); }
  line3(fl, '#9d1c24', 6); line3(fl, '#e63946', 4); const fl2 = fl.map((v, i) => (i % 3 === 2 ? v + 3 : v)); line3(fl2, '#ffb3b8', 1.2);
  // station
  box(x0 + 0.3, y0 + 3.0, 1.7, 0.8, 0, 14, '#3a86ff'); gable(x0 + 0.25, y0 + 2.95, 1.8, 0.9, 14, 8, '#e63946');
  // treintje
  const ph = runOf(o) ? ((o.tm / DEFS.achtbaan.dur) * 1.6) % 1 : 0.0;
  const ccol = ['#ffca3a', '#ff924c', '#ffca3a', '#ff924c', '#ffca3a'];
  for (let i = 4; i >= 0; i--) { const s = ((ph - i * 0.014) % 1 + 1) % 1, p = coasterPt(s, cx, cy); box(p[0] - 0.12, p[1] - 0.1, 0.24, 0.2, p[2] + 2, 5, ccol[i]); if (runOf(o)) ball(p[0], p[1], p[2] + 10, 2.2, i % 2 ? '#ff595e' : '#ffd9b3'); }
  glow(cx, cy, 40, 110, '255,120,120');
};
DR.valtoren = (o, a) => {
  const cx = o.x + 1, cy = o.y + 1;
  shadow(cx, cy, 0.8, 0.2);
  box(cx - 0.7, cy - 0.7, 1.4, 1.4, 0, 5, '#9a8ac2');
  box(cx - 0.17, cy - 0.17, 0.34, 0.34, 5, 122, '#8e7cc3');
  for (let z = 16; z < 120; z += 18) box(cx - 0.2, cy - 0.2, 0.4, 0.4, z, 3, '#b8a8e8');
  let z = 10;
  if (runOf(o)) {
    const p = o.tm / DEFS.valtoren.dur;
    if (p < 0.55) z = 10 + 105 * (p / 0.55) * (p / 0.55 * 0.4 + 0.6); else if (p < 0.68) z = 115; else if (p < 0.82) { const q = (p - 0.68) / 0.14; z = 115 - 105 * q * q; } else z = 10 + (0.1) * Math.sin(ENV.T * 8);
  }
  z = clamp(z, 8, 118);
  box(cx - 0.5, cy - 0.5, 1.0, 1.0, z, 6, '#ff595e');
  for (const [dx, dy] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]]) if (runOf(o)) ball(cx + dx, cy + dy, z + 10, 2, '#ffd9b3');
  ball(cx, cy, 130, 3, (Math.floor(ENV.T * 2) % 2) ? '#ff595e' : '#fff6a0'); glow(cx, cy, 128, 60, '255,120,120');
};
DR.draakentrein = (o, a) => {
  const x0 = o.x, y0 = o.y, cx = x0 + 2, cy = y0 + 1.5;
  flat(x0 + 0.05, y0 + 0.05, 3.9, 2.9, 0, '#7fc66b', 'rgba(40,100,40,.4)');
  const path = (s) => { const an = s * 6.2832; return [cx + 1.65 * Math.cos(an), cy + 1.05 * Math.sin(an)]; };
  C.beginPath(); for (let i = 0; i <= 48; i++) { const p = path(i / 48); const x = X(p[0], p[1]), y = Y(p[0], p[1], 1); if (i) C.lineTo(x, y); else C.moveTo(x, y); } C.strokeStyle = '#6a4a34'; C.lineWidth = 4; C.stroke(); C.strokeStyle = '#c9b8a0'; C.lineWidth = 1.5; C.stroke();
  box(x0 + 0.25, y0 + 2.2, 1.0, 0.6, 0, 12, '#2a9d8f'); gable(x0 + 0.2, y0 + 2.15, 1.1, 0.7, 12, 7, '#264653');
  const ph = runOf(o) ? ((o.tm / DEFS.draakentrein.dur) * 3) % 1 : 0.07;
  const segs = [];
  for (let i = 0; i < 7; i++) { const s = ((ph - i * 0.032) % 1 + 1) % 1, p = path(s); segs.push([p[0], p[1], i]); }
  segs.sort((p, q) => p[0] + p[1] - q[0] - q[1]);
  for (const [px, py, i] of segs) {
    if (i === 0) { ball(px, py, 9, 6.5, '#2a9d8f'); text('🐲', X(px, py), Y(px, py, 12), 16); }
    else { ball(px, py, 7, 5.2, i % 2 ? '#52b788' : '#2a9d8f'); if (runOf(o)) ball(px, py, 14, 2, '#ffd9b3'); }
  }
  tree(x0 + 3.5, y0 + 0.5, 3, 0.9); tree(x0 + 0.5, y0 + 0.5, 4, 0.9); tree(x0 + 3.6, y0 + 2.5, 5, 0.8);
  glow(cx, cy, 20, 80, '120,255,170');
};

/* ---------- kraampjes en voorzieningen ---------- */
function stallBase(o, col, roof, emoji, h) {
  const x0 = o.x, y0 = o.y, d = DEFS[o.t];
  const w = d.w, dd = d.h;
  shadow(x0 + w / 2, y0 + dd / 2, 0.6 * Math.max(w, dd), 0.15);
  box(x0 + 0.12, y0 + 0.15, w - 0.24, dd - 0.35, 0, h || 16, col);
  awning(x0 + 0.08, y0 + 0.1, w - 0.16, dd - 0.25, (h || 16) + 3, roof, '#ffffff');
  text(emoji, X(x0 + w / 2, y0 + dd / 2), Y(x0 + w / 2, y0 + dd / 2, (h || 16) + 17), 15);
  glow(x0 + w / 2, y0 + dd / 2, (h || 16) + 6, 36);
}
DR.ijskraam = (o) => stallBase(o, '#ffd6e0', '#ff7aa8', '🍦');
DR.drinkkraam = (o) => stallBase(o, '#c8f0a8', '#4caf50', '🥤');
DR.patat = (o) => stallBase(o, '#fff0a0', '#ffb703', '🍟');
DR.popcorn = (o) => {
  const x0 = o.x, y0 = o.y;
  shadow(x0 + 0.5, y0 + 0.5, 0.45, 0.15);
  box(x0 + 0.2, y0 + 0.25, 0.6, 0.5, 2, 9, '#ffffff'); cyl(x0 + 0.5, y0 + 0.5, 0.28, 11, 6, '#ff595e');
  cone(x0 + 0.5, y0 + 0.5, 0.3, 17, 8, ['#ff595e', '#ffffff'], 8, 0);
  ball(x0 + 0.2, y0 + 0.82, 1, 3, '#444'); ball(x0 + 0.8, y0 + 0.82, 1, 3, '#444');
  text('🍿', X(x0 + 0.5, y0 + 0.5), Y(x0 + 0.5, y0 + 0.5, 34), 14); glow(x0 + 0.5, y0 + 0.5, 20, 32);
};
DR.souvenir = (o) => {
  const x0 = o.x, y0 = o.y;
  shadow(x0 + 1, y0 + 0.5, 0.9, 0.15);
  box(x0 + 0.1, y0 + 0.12, 1.8, 0.76, 0, 20, '#d6a2e8'); gable(x0 + 0.05, y0 + 0.08, 1.9, 0.84, 20, 9, '#7b2cbf');
  awning(x0 + 0.1, y0 + 0.1, 1.8, 0.7, 14, '#b5179e', '#fff');
  text('🎁', X(x0 + 1, y0 + 0.5), Y(x0 + 1, y0 + 0.5, 42), 15); glow(x0 + 1, y0 + 0.5, 15, 46);
};
DR.pizza = (o) => {
  const x0 = o.x, y0 = o.y;
  shadow(x0 + 1, y0 + 0.5, 0.9, 0.15);
  box(x0 + 0.1, y0 + 0.12, 1.8, 0.76, 0, 22, '#f7b58a'); gable(x0 + 0.05, y0 + 0.08, 1.9, 0.84, 22, 8, '#c8441f');
  awning(x0 + 0.1, y0 + 0.1, 1.8, 0.7, 16, '#e63946', '#fff');
  text('🍕', X(x0 + 1, y0 + 0.5), Y(x0 + 1, y0 + 0.5, 44), 15); glow(x0 + 1, y0 + 0.5, 15, 46);
};
DR.restaurant = (o) => {
  const x0 = o.x, y0 = o.y;
  shadow(x0 + 1, y0 + 1, 1.2, 0.18);
  box(x0 + 0.15, y0 + 0.1, 1.7, 1.0, 0, 30, '#f9d5a7'); box(x0 + 0.15, y0 + 0.1, 1.7, 1.0, 30, 3, '#c97d3a');
  gable(x0 + 0.05, y0 + 0.0, 1.9, 1.2, 33, 12, '#d9622b');
  for (let i = 0; i < 3; i++) { const x = x0 + 0.3 + i * 0.5; quad3(x, y0 + 1.1, 14, x + 0.3, y0 + 1.1, 14, x + 0.3, y0 + 1.1, 24, x, y0 + 1.1, 24, '#ffe9a8'); }
  for (let i = 0; i < 2; i++) { const px = x0 + 0.5 + i * 1.0, py = y0 + 1.55; cyl(px, py, 0.14, 0, 8, '#eadcc0'); cone(px, py, 0.34, 14, 8, ['#e63946', '#fff'], 6, 0); pole(px, py, 8, 14, '#888', 1.2); }
  text('🍔', X(x0 + 1, y0 + 0.5), Y(x0 + 1, y0 + 0.5, 58), 16); glow(x0 + 1, y0 + 1, 24, 60);
};
DR.toilet = (o) => {
  const x0 = o.x, y0 = o.y;
  shadow(x0 + 1, y0 + 0.5, 0.9, 0.15);
  box(x0 + 0.1, y0 + 0.1, 1.8, 0.8, 0, 22, '#9bd1ee');
  quad3(x0 + 0.3, y0 + 0.9, 0, x0 + 0.8, y0 + 0.9, 0, x0 + 0.8, y0 + 0.9, 16, x0 + 0.3, y0 + 0.9, 16, '#3a7ca5');
  quad3(x0 + 1.2, y0 + 0.9, 0, x0 + 1.7, y0 + 0.9, 0, x0 + 1.7, y0 + 0.9, 16, x0 + 1.2, y0 + 0.9, 16, '#e07a5f');
  box(x0 + 0.05, y0 + 0.05, 1.9, 0.9, 22, 3, '#4a8fb8');
  text('🚻', X(x0 + 1, y0 + 0.5), Y(x0 + 1, y0 + 0.5, 38), 14);
};
DR.bankje = (o) => {
  const x0 = o.x, y0 = o.y;
  shadow(x0 + 0.5, y0 + 0.5, 0.3, 0.12);
  box(x0 + 0.25, y0 + 0.4, 0.5, 0.25, 4, 3, '#b08968'); box(x0 + 0.25, y0 + 0.35, 0.5, 0.06, 7, 7, '#9c7452');
  pole(x0 + 0.28, y0 + 0.62, 0, 4, '#444', 1.4); pole(x0 + 0.72, y0 + 0.62, 0, 4, '#444', 1.4);
};
DR.prullenbak = (o) => {
  const x0 = o.x, y0 = o.y;
  shadow(x0 + 0.5, y0 + 0.5, 0.25, 0.12);
  cyl(x0 + 0.5, y0 + 0.5, 0.17, 0, 12, '#6c9a8b'); ell(x0 + 0.5, y0 + 0.5, 12, 0.19, '#4f7a6c');
};
DR.lab = (o, a) => {
  const x0 = o.x, y0 = o.y;
  shadow(x0 + 1.5, y0 + 1, 1.3, 0.18);
  box(x0 + 0.15, y0 + 0.15, 2.7, 1.7, 0, 26, '#eef3f7'); box(x0 + 0.1, y0 + 0.1, 2.8, 1.8, 26, 3, '#4cc9f0');
  for (let i = 0; i < 3; i++) { const x = x0 + 0.35 + i * 0.8; quad3(x, y0 + 1.85, 8, x + 0.5, y0 + 1.85, 8, x + 0.5, y0 + 1.85, 20, x, y0 + 1.85, 20, '#8fe3ff'); }
  // koepel
  const px = X(x0 + 1.5, y0 + 1), py = Y(x0 + 1.5, y0 + 1, 29);
  C.beginPath(); C.ellipse(px, py, 22, 11, 0, Math.PI, 0); C.lineTo(px + 22, py); C.ellipse(px, py, 22, 11, 0, 0, Math.PI); C.closePath(); C.fillStyle = 'rgba(120,220,255,.75)'; C.fill();
  pole(x0 + 2.5, y0 + 0.5, 29, 56, '#9aa5b1', 1.8); ball(x0 + 2.5, y0 + 0.5, 57, 2.5, (Math.floor(ENV.T * 2) % 2) ? '#ff595e' : '#ffd0d0');
  for (let k = 0; k < 3; k++) { const t = (ENV.T * 0.6 + k * 0.33) % 1; ball(x0 + 1.5 + Math.sin(t * 6 + k) * 0.15, y0 + 1, 34 + t * 18, 2.2 * (1 - t) + 0.6, `rgba(120,255,200,${1 - t})`); }
  text('🔬', X(x0 + 1.5, y0 + 1), Y(x0 + 1.5, y0 + 1, 70), 16); glow(x0 + 1.5, y0 + 1.5, 20, 70, '120,220,255');
};

/* ---------- decoratie ---------- */
DR.boom = (o) => tree(o.x + 0.5, o.y + 0.5, o.id, 1);
DR.struik = (o) => {
  const x = o.x + 0.5, y = o.y + 0.5, lc = SEASON_LEAF[ENV.season];
  shadow(x, y, 0.3, 0.15);
  ball(x - 0.12, y, 5, 6, ENV.theme === 'snow' ? '#e9f3f9' : lc[0]); ball(x + 0.14, y + 0.05, 6, 6.5, ENV.theme === 'snow' ? '#dcebf4' : lc[1]); ball(x, y - 0.08, 9, 5, shade(lc[0], 0.9));
};
DR.bloemen = (o) => {
  const x = o.x, y = o.y; const cols = ['#ff595e', '#ffca3a', '#c77dff', '#ff9ec7', '#ffffff'];
  shadow(x + 0.5, y + 0.5, 0.3, 0.1);
  for (let i = 0; i < 6; i++) { const px = x + 0.2 + ((o.id * 7 + i * 13) % 10) / 14, py = y + 0.2 + ((o.id * 5 + i * 11) % 10) / 14; pole(px, py, 0, 5, '#4caf50', 1.2); ball(px, py, 7 + Math.sin(ENV.T * 2 + i) * 0.6, ENV.season === 3 ? 0 : 2.6, cols[(o.id + i) % 5]); }
  if (ENV.season === 3) ell(x + 0.5, y + 0.5, 1, 0.35, 'rgba(255,255,255,.8)');
};
DR.vijver = (o) => {
  const x = o.x, y = o.y;
  flat(x + 0.04, y + 0.04, 0.92, 0.92, 0, '#b79f7b'); flat(x + 0.1, y + 0.1, 0.8, 0.8, 0.5, ENV.season === 3 ? '#cfe8f5' : '#5bb5e6');
  ell(x + 0.5, y + 0.5, 1, 0.25 + 0.03 * Math.sin(ENV.T * 2 + o.id), null, 'rgba(255,255,255,.7)', 1);
  ell(x + 0.3, y + 0.62, 1, 0.1, '#4caf50'); if (ENV.season !== 3) text('🦆', X(x + 0.62 + Math.sin(ENV.T * 0.5 + o.id) * 0.1, y + 0.4), Y(x + 0.62, y + 0.4, 5), 10);
};
DR.lantaarn = (o) => {
  const x = o.x + 0.5, y = o.y + 0.5;
  shadow(x, y, 0.2, 0.12);
  pole(x, y, 0, 34, '#33323a', 2.4); ball(x, y, 36, 4.2, '#fff3b0'); glow(x, y, 36, 70, '255,220,140');
};
DR.fontein = (o) => {
  const cx = o.x + 1, cy = o.y + 1;
  shadow(cx, cy, 0.95, 0.15);
  cyl(cx, cy, 0.85, 0, 7, '#cfc8b6'); ell(cx, cy, 6, 0.7, ENV.season === 3 ? '#d6edf7' : '#6cc3ec');
  cyl(cx, cy, 0.1, 6, 22, '#cfc8b6');
  if (ENV.season !== 3) for (let i = 0; i < 6; i++) { const an = i * 1.0472 + ENV.T * 0.4; for (let k = 0; k < 5; k++) { const t = k / 5, px = cx + 0.5 * t * Math.cos(an), py = cy + 0.5 * t * Math.sin(an); ball(px, py, 28 + 14 * Math.sin(t * 3.14) - 4 * t * t * 10, 1.4, 'rgba(255,255,255,.85)'); } }
  glow(cx, cy, 20, 50, '150,220,255');
};
DR.bloemperk = (o) => {
  const x = o.x, y = o.y; const cols = ['#ff595e', '#ffca3a', '#c77dff', '#ff9ec7', '#ffffff', '#4cc9f0'];
  box(x + 0.08, y + 0.08, 1.84, 1.84, 0, 5, '#b08968'); flat(x + 0.2, y + 0.2, 1.6, 1.6, 5.2, '#6b4a2f');
  for (let i = 0; i < 14; i++) { const px = x + 0.3 + ((o.id * 7 + i * 17) % 20) / 14, py = y + 0.3 + ((o.id * 3 + i * 23) % 20) / 14; if (ENV.season === 3) continue; pole(px, py, 5, 10, '#4caf50', 1); ball(px, py, 11 + Math.sin(ENV.T * 2 + i) * 0.5, 2.8, cols[(o.id + i) % 6]); }
  if (ENV.season === 3) flat(x + 0.2, y + 0.2, 1.6, 1.6, 5.4, 'rgba(255,255,255,.85)');
};
DR.standbeeld = (o) => {
  const x = o.x + 0.5, y = o.y + 0.5;
  shadow(x, y, 0.35, 0.15);
  box(x - 0.25, y - 0.25, 0.5, 0.5, 0, 12, '#cfc8b6'); text('🤡', X(x, y), Y(x, y, 0) - 26 + Math.sin(ENV.T * 2) * 1.5, 26);
};
DR.tent = (o, a) => {
  const cx = o.x + 1, cy = o.y + 1;
  shadow(cx, cy, 1.1, 0.18);
  cyl(cx, cy, 0.95, 0, 16, '#ff6b6b');
  cone(cx, cy, 1.0, 16, 26, ['#e63946', '#ffffff'], 10, 0);
  pole(cx, cy, 42, 58, '#555', 1.6); fpoly([X(cx, cy), Y(cx, cy, 58), X(cx + 0.3, cy), Y(cx + 0.3, cy, 54 + Math.sin(ENV.T * 5) * 1.5), X(cx, cy), Y(cx, cy, 50)], '#ffd23f');
  for (let i = 0; i < 8; i++) { const an = i / 8 * 6.2832; ball(cx + Math.cos(an) * 0.98, cy + Math.sin(an) * 0.98, 16, 1.4, (Math.floor(ENV.T * 3) + i) % 2 ? '#fff6a0' : '#ff9ec7'); }
  glow(cx, cy, 24, 70, '255,150,150');
};

// hoogte van objecten (voor aantikken)
export function objHeight(o) {
  switch (o.t) {
    case 'reuzenrad': return 126; case 'piratenschip': return 84; case 'achtbaan': return 80; case 'valtoren': return 135; case 'waterglijbaan': return 62;
    case 'spookhuis': return 64; case 'boom': return 40; case 'tent': return 60; case 'draaimolen': return 56; case 'theekopjes': return 46; case 'botsauto': return 38; case 'lab': return 58;
    case 'restaurant': return 46; case 'fontein': return 30; case 'standbeeld': return 36; case 'lantaarn': return 38; default: return 30;
  }
}

export function drawObject(c, o, anim, dim) {
  C = c;
  const f = DR[o.t]; if (!f) return;
  f(o, anim || 0);
  if (DEFS[o.t].k === 'ride') {
    const d = DEFS[o.t], top = objHeight(o) + 12;
    badge(d.e, o.x + d.w / 2, o.y + d.h / 2, top, 9, true);
    if (o.broken) { const px = X(o.x + d.w / 2, o.y + d.h / 2), py = Y(o.x + d.w / 2, o.y + d.h / 2, top + 22); text('🔧', px, py + Math.sin(ENV.T * 6) * 2, 16); C.strokeStyle = '#e63946'; C.lineWidth = 2; C.beginPath(); C.arc(px, py, 12, 0, 6.2832); C.stroke(); }
    else if (!o.open) { text('⛔', X(o.x + d.w / 2, o.y + d.h / 2), Y(o.x + d.w / 2, o.y + d.h / 2, top + 22), 15); }
    else if (o.wear > 60) { text('⚠️', X(o.x + d.w / 2, o.y + d.h / 2) + 14, Y(o.x + d.w / 2, o.y + d.h / 2, top + 8), 11); }
    if (o.q && o.q.length >= 5) { const px = X(o.x + d.w / 2, o.y + d.h / 2) + 16, py = Y(o.x + d.w / 2, o.y + d.h / 2, top + 6); C.fillStyle = o.q.length > 11 ? '#ef4444' : '#f59e0b'; C.beginPath(); C.roundRect(px - 11, py - 7, 22, 14, 6); C.fill(); C.fillStyle = '#fff'; C.font = 'bold 9px system-ui,sans-serif'; C.textAlign = 'center'; C.textBaseline = 'middle'; C.fillText(String(o.q.length), px, py + 0.5); }
    if (o.l > 0) { for (let i = 0; i < o.l; i++) text('⭐', X(o.x + d.w / 2, o.y + d.h / 2) + (i - (o.l - 1) / 2) * 9, Y(o.x + d.w / 2, o.y + d.h / 2, top - 12), 8); }
  }
}

/* ---------- bezoekers en personeel ---------- */
function drawPerson(x, y, sc, shirt, hair, skin, phase, zoff, dir, kind) {
  const px = X(x, y), py = Y(x, y, zoff || 0);
  C.fillStyle = 'rgba(0,0,0,.18)'; C.beginPath(); C.ellipse(px, py + 1, 4 * sc, 2 * sc, 0, 0, 6.2832); C.fill();
  const sw = Math.sin(phase) * 2.2 * sc;
  C.strokeStyle = '#3b3b4f'; C.lineWidth = 2 * sc; C.lineCap = 'round';
  C.beginPath(); C.moveTo(px - 1.5 * sc, py - 5 * sc); C.lineTo(px - 1.5 * sc + sw * 0.5, py); C.moveTo(px + 1.5 * sc, py - 5 * sc); C.lineTo(px + 1.5 * sc - sw * 0.5, py); C.stroke();
  C.fillStyle = shirt; C.beginPath(); C.roundRect(px - 3.4 * sc, py - 12.5 * sc, 6.8 * sc, 8 * sc, 2.4 * sc); C.fill();
  C.fillStyle = skin; C.beginPath(); C.arc(px, py - 15.6 * sc, 3.4 * sc, 0, 6.2832); C.fill();
  C.fillStyle = hair; C.beginPath(); C.arc(px, py - 16.6 * sc, 3.5 * sc, Math.PI, 0); C.fill();
}
function bubble(txt, px, py) {
  C.fillStyle = 'rgba(255,255,255,.95)'; C.strokeStyle = 'rgba(0,0,0,.15)'; C.lineWidth = 1;
  const w = Math.max(18, txt.length * 6 + 8);
  C.beginPath(); C.roundRect(px - w / 2, py - 17, w, 17, 8); C.fill(); C.stroke();
  C.beginPath(); C.moveTo(px - 3, py); C.lineTo(px, py + 4); C.lineTo(px + 3, py); C.fillStyle = 'rgba(255,255,255,.95)'; C.fill();
  C.fillStyle = '#222'; text(txt, px, py - 8, 11);
}

export function drawGuest(c, g, T, sel, qoff) {
  C = c;
  const ph = T * 7 + g.id;
  let x = g.x, y = g.y;
  if (qoff) { x += qoff[0]; y += qoff[1]; }
  const walking = g.st === 0;
  drawPerson(x, y, g.sc, g.col, g.hair, g.skin, walking ? ph : 0, 0, 0, g.kind);
  if (g.vip) { text('👑', X(x, y), Y(x, y, 0) - 24 * g.sc, 10); }
  if (sel) { C.strokeStyle = '#ffd23f'; C.lineWidth = 2; C.beginPath(); C.ellipse(X(x, y), Y(x, y, 0) + 1, 9, 4.5, 0, 0, 6.2832); C.stroke(); }
  if (g.bt > 0 && g.bub) { bubble(g.bub, X(x, y), Y(x, y, 0) - 26 * g.sc); }
}
export function drawWalker(c, w, T) {
  C = c;
  const col = w.k === 'm' ? '#ff9f1c' : w.k === 'j' ? '#2ec4b6' : '#e5389b';
  drawPerson(w.x, w.y, 1.05, col, '#222', '#f2b88e', w.task === 9 ? 0 : T * 7, 0, 0, 2);
  const px = X(w.x, w.y), py = Y(w.x, w.y, 0);
  if (w.k === 'm') { text('🔧', px + 6, py - 12, 9); }
  else if (w.k === 'j') { text('🧹', px + 6, py - 6, 10); if (w.task === 9) { text('✨', px - 6, py - 22 + Math.sin(T * 8) * 2, 9); } }
  else { text('🎈', px + 3, py - 30 + Math.sin(T * 3) * 2, 12); }
}
export function drawGate(c, P) {
  C = c;
  const gx = P.gx + 0.5, gy = P.n - 0.5;
  // pilaren links/rechts en een boog met naam
  pole(gx - 0.5, gy + 0.45, 0, 54, '#ffffff', 5); pole(gx + 0.5, gy + 0.45, 0, 54, '#ffffff', 5);
  pole(gx - 0.5, gy + 0.45, 0, 54, '#e63946', 2.4); pole(gx + 0.5, gy + 0.45, 0, 54, '#e63946', 2.4);
  const lx = X(gx - 0.5, gy + 0.45), ly = Y(gx - 0.5, gy + 0.45, 54), rx = X(gx + 0.5, gy + 0.45), ry = Y(gx + 0.5, gy + 0.45, 54);
  C.beginPath(); C.moveTo(lx, ly); C.quadraticCurveTo((lx + rx) / 2, ly - 22, rx, ry); C.strokeStyle = '#ffd23f'; C.lineWidth = 7; C.stroke();
  C.strokeStyle = '#e63946'; C.lineWidth = 3; C.stroke();
  C.fillStyle = '#fff'; C.beginPath(); C.roundRect((lx + rx) / 2 - 26, (ly + ry) / 2 - 24, 52, 15, 6); C.fill();
  C.fillStyle = '#e63946'; C.font = 'bold 10px system-ui,sans-serif'; C.textAlign = 'center'; C.textBaseline = 'middle'; C.fillText('PARK', (lx + rx) / 2, (ly + ry) / 2 - 16.5);
  for (let i = 0; i < 7; i++) { const t = i / 6, px = lx + (rx - lx) * t, py = ly + (ry - ly) * t - Math.sin(t * 3.14) * 11; ball2(px, py + 5, 2, i % 2 ? '#fff6a0' : '#ff9ec7'); }
}
function ball2(px, py, r, col) { C.beginPath(); C.arc(px, py, r, 0, 6.2832); C.fillStyle = col; C.fill(); }

/* ---------- ondergrond (gecachet) ---------- */
export const THEMES = {
  meadow: { g: [['#a9dc72', '#9fd368'], ['#86d263', '#7bc85a'], ['#cdb84e', '#c3ad44'], ['#edf4f9', '#e1ebf3']], road: '#ddd5c2', edge: '#8a6a45', out: ['#bfe3ff', '#e9f6e0'] },
  beach: { g: [['#f4e2a8', '#efd99a']], road: '#e7ddc6', edge: '#c9a86a', out: ['#7fd6ee', '#bdeef7'] },
  snow: { g: [['#f6fbff', '#e9f3fb']], road: '#cfd8e3', edge: '#7f8fa3', out: ['#c9dbf0', '#eef5fc'] },
};
export function groundKey(G, P) { return [P.n, seasonOf(P, G), P.i].join('|'); }
export function roadKey(G, P) { return [P.n, P.roadVer, seasonOf(P, G), P.i].join('|'); }
const OUTER = 3;
export function buildGround(P, G, mk) {
  const n = P.n, M = OUTER, gs = n <= 20 ? 1.5 : n <= 24 ? 1.3 : 1.15;
  const th = THEMES[PARKS[P.i].theme], season = seasonOf(P, G), themeName = PARKS[P.i].theme;
  const pal = th.g[th.g.length === 1 ? 0 : season];
  const minX = -(n + 2 * M) * 32 - 24, maxX = (n + 2 * M) * 32 + 24, minY = -32 * M - 30, maxY = (2 * n + 2 * M) * 16 + 70;
  const cv = mk(Math.ceil((maxX - minX) * gs), Math.ceil((maxY - minY) * gs));
  const c = cv.getContext('2d');
  c.scale(gs, gs); c.translate(-minX, -minY);
  C = c;
  const oldEnv = ENV; ENV = { T: 0, night: 0, season, theme: themeName, wx: 0 };
  const th2 = 22;
  // omgeving: lager gelegen land of zee
  let seed0 = n * 977 + P.i * 131 + season * 7;
  const rnd0 = () => { seed0 = (seed0 * 1664525 + 1013904223) >>> 0; return seed0 / 4294967296; };
  const outerCols = themeName === 'beach' ? [['#6ecbe3', '#66c3dd'], ['#f0dca0', '#ead392']] : themeName === 'snow' ? [['#e9f1f8', '#dfe9f3']] : [[shade(pal[0], 0.9), shade(pal[1], 0.9)]];
  for (let y = -M; y < n + M; y++) for (let x = -M; x < n + M; x++) {
    if (x >= 0 && y >= 0 && x < n && y < n) continue;
    const ring = Math.max(-x, -y, x - n + 1, y - n + 1);   // 1 = direct langs het park
    const set = themeName === 'beach' ? (ring <= 1 ? outerCols[1] : outerCols[0]) : outerCols[0];
    const col = set[(x + y) & 1 ? 1 : 0];
    fpoly([X(x, y), Y(x, y, -th2), X(x + 1, y), Y(x + 1, y, -th2), X(x + 1, y + 1), Y(x + 1, y + 1, -th2), X(x, y + 1), Y(x, y + 1, -th2)], col);
  }
  // schuimrand / waterlijn
  if (themeName === 'beach') {
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2;
    c.beginPath();
    const o1 = -2, o2 = n + 2;
    c.moveTo(X(o1, o1), Y(o1, o1, -th2)); c.lineTo(X(o2, o1), Y(o2, o1, -th2)); c.lineTo(X(o2, o2), Y(o2, o2, -th2)); c.lineTo(X(o1, o2), Y(o1, o2, -th2)); c.closePath(); c.stroke();
  }
  // bomen en struiken in de omgeving (achter het park nu, voor het park later)
  const frontTrees = [];
  if (themeName !== 'beach') {
    const gx = P.gx;
    for (let y = -M; y < n + M; y++) for (let x = -M; x < n + M; x++) {
      if (x >= 0 && y >= 0 && x < n && y < n) continue;
      if (y >= n && x >= gx - 2 && x <= gx + 2) continue;
      if (rnd0() < 0.3) { const tt = [x + 0.3 + rnd0() * 0.4, y + 0.3 + rnd0() * 0.4, Math.floor(rnd0() * 100), 0.9 + rnd0() * 0.4]; if (x >= n || y >= n) frontTrees.push(tt); else { c.save(); c.translate(0, th2); tree(tt[0], tt[1], tt[2], tt[3]); c.restore(); } }
    }
  } else {
    for (let k = 0; k < 14; k++) { const x = -M + rnd0() * (n + 2 * M), y = rnd0() < 0.5 ? n + 0.5 + rnd0() * 1.5 : -1 - rnd0() * 1.5; if (x > P.gx - 2 && x < P.gx + 3 && y > n) continue; c.save(); c.translate(0, th2); text('🌴', X(x, y), Y(x, y, 12), 22); c.restore(); }
  }
  // randplaat
  const L = [X(0, n), Y(0, n)], F = [X(n, n), Y(n, n)], Rr = [X(n, 0), Y(n, 0)];
  fpoly([L[0], L[1], F[0], F[1], F[0], F[1] + th2, L[0], L[1] + th2], th.edge);
  fpoly([F[0], F[1], Rr[0], Rr[1], Rr[0], Rr[1] + th2, F[0], F[1] + th2], shade(th.edge, 0.75));
  // tegels
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const col = pal[(x + y) & 1];
    fpoly([X(x, y), Y(x, y), X(x + 1, y), Y(x + 1, y), X(x + 1, y + 1), Y(x + 1, y + 1), X(x, y + 1), Y(x, y + 1)], col);
  }
  // textuur
  let seed = n * 131 + P.i * 17;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let k = 0; k < n * n * 1.2; k++) {
    const x = rnd() * n, y = rnd() * n, px = X(x, y), py = Y(x, y);
    if (th === THEMES.snow || season === 3) { c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(px, py, 1.5, 1.5); }
    else if (th === THEMES.beach) { c.fillStyle = 'rgba(180,140,70,.25)'; c.fillRect(px, py, 1.4, 1); }
    else { c.strokeStyle = 'rgba(40,110,40,.28)'; c.lineWidth = 1; c.beginPath(); c.moveTo(px, py); c.lineTo(px - 1.5, py - 3); c.moveTo(px + 1, py); c.lineTo(px + 1.5, py - 2.5); c.stroke(); }
  }
  for (const tt of frontTrees) { c.save(); c.translate(0, th2); tree(tt[0], tt[1], tt[2], tt[3]); c.restore(); }
  ENV = oldEnv;
  return { cv, gs, minX, minY };
}
// wegenlaag: aparte, kleinere cache zodat slepen met de weg-tool snel blijft
export function buildRoads(P, G, mk) {
  const n = P.n, gs = n <= 20 ? 1.5 : n <= 24 ? 1.3 : 1.15, season = seasonOf(P, G);
  const th = THEMES[PARKS[P.i].theme];
  const minX = -n * 32 - 12, maxX = n * 32 + 12, minY = -10, maxY = n * 32 + 12;
  const cv = mk(Math.ceil((maxX - minX) * gs), Math.ceil((maxY - minY) * gs));
  const c = cv.getContext('2d');
  c.scale(gs, gs); c.translate(-minX, -minY);
  C = c;
  // wegen
  const rd = (x, y) => x >= 0 && y >= 0 && x < n && y < n && P.roads[y * n + x];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!P.roads[y * n + x]) continue;
    fpoly([X(x, y), Y(x, y), X(x + 1, y), Y(x + 1, y), X(x + 1, y + 1), Y(x + 1, y + 1), X(x, y + 1), Y(x, y + 1)], (x + y) & 1 ? th.road : shade(th.road, 0.96));
  }
  c.lineWidth = 1.6; c.lineCap = 'round';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!P.roads[y * n + x]) continue;
    c.strokeStyle = shade(th.road, 0.7);
    if (!rd(x, y - 1)) { c.beginPath(); c.moveTo(X(x, y), Y(x, y)); c.lineTo(X(x + 1, y), Y(x + 1, y)); c.stroke(); }
    if (!rd(x - 1, y)) { c.beginPath(); c.moveTo(X(x, y), Y(x, y)); c.lineTo(X(x, y + 1), Y(x, y + 1)); c.stroke(); }
    c.strokeStyle = 'rgba(255,255,255,.65)';
    if (!rd(x + 1, y)) { c.beginPath(); c.moveTo(X(x + 1, y), Y(x + 1, y)); c.lineTo(X(x + 1, y + 1), Y(x + 1, y + 1)); c.stroke(); }
    if (!rd(x, y + 1)) { c.beginPath(); c.moveTo(X(x, y + 1), Y(x, y + 1)); c.lineTo(X(x + 1, y + 1), Y(x + 1, y + 1)); c.stroke(); }
  }
  // poort-tegel: zebrastrepen
  { const gx = P.gx, gy = n - 1; for (let i = 0; i < 5; i++) { const x = gx + 0.1 + i * 0.2; fpoly([X(x, gy + 0.2), Y(x, gy + 0.2), X(x + 0.1, gy + 0.2), Y(x + 0.1, gy + 0.2), X(x + 0.1, gy + 0.8), Y(x + 0.1, gy + 0.8), X(x, gy + 0.8), Y(x, gy + 0.8)], 'rgba(255,255,255,.75)'); } }
  return { cv, gs, minX, minY };
}

/* =====================================================================
   11. GELUID (WebAudio)
   ===================================================================== */
function makeAudio() {
  let ac = null, master = null, musGain = null, sfxGain = null, timer = null, step = 0, nextT = 0;
  const A = { sfx: true, mus: true, started: false };
  A.start = () => {
    if (ac) { if (ac.state === 'suspended') ac.resume().catch(() => {}); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ac = new AC(); master = ac.createGain(); master.gain.value = 0.8; master.connect(ac.destination);
      musGain = ac.createGain(); musGain.gain.value = 0.12; musGain.connect(master);
      sfxGain = ac.createGain(); sfxGain.gain.value = 0.5; sfxGain.connect(master);
      A.started = true; if (A.mus) A.musicOn();
    } catch (e) { ac = null; }
  };
  const tone = (f, d, type, vol, when, slide, dest) => {
    if (!ac) return;
    const t = when || ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(dest || sfxGain); o.start(t); o.stop(t + d + 0.05);
  };
  const noise = (d, vol, f0, f1) => {
    if (!ac) return;
    const t = ac.currentTime, len = Math.floor(ac.sampleRate * d), buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ac.createBufferSource(); s.buffer = buf;
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + d); bp.Q.value = 1.2;
    const g = ac.createGain(); g.gain.value = vol; s.connect(bp); bp.connect(g); g.connect(sfxGain); s.start(t);
  };
  const last = {};
  const ok = (k, gap) => { const n = Date.now(); if (last[k] && n - last[k] < gap) return false; last[k] = n; return true; };
  A.play = (name) => {
    if (!ac || !A.sfx) return;
    switch (name) {
      case 'click': if (ok('click', 40)) tone(660, 0.06, 'triangle', 0.14); break;
      case 'place': tone(300, 0.09, 'triangle', 0.25, 0, 1.8); tone(520, 0.12, 'sine', 0.18, ac.currentTime + 0.07); break;
      case 'coin': if (ok('coin', 140)) { tone(988, 0.07, 'square', 0.06); tone(1319, 0.14, 'square', 0.06, ac.currentTime + 0.06); } break;
      case 'err': tone(180, 0.18, 'sawtooth', 0.15, 0, 0.7); break;
      case 'up': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.2, ac.currentTime + i * 0.07)); break;
      case 'fan': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.25, 'triangle', 0.22, ac.currentTime + i * 0.09)); break;
      case 'scream': if (ok('scream', 1400)) noise(0.7, 0.18, 500, 2400); break;
      case 'whoosh': if (ok('whoosh', 500)) noise(0.5, 0.1, 300, 1500); break;
      case 'break': tone(150, 0.3, 'sawtooth', 0.2, 0, 0.5); tone(110, 0.4, 'square', 0.1, ac.currentTime + 0.1); break;
      case 'fixed': tone(700, 0.08, 'square', 0.1); tone(900, 0.12, 'square', 0.1, ac.currentTime + 0.08); break;
      case 'bell': tone(880, 0.5, 'sine', 0.2); tone(1320, 0.5, 'sine', 0.1); break;
      case 'tip': tone(784, 0.1, 'triangle', 0.18); tone(1175, 0.16, 'triangle', 0.16, ac.currentTime + 0.07); break;
      case 'pop': if (ok('pop', 700)) { noise(0.25, 0.08, 2500, 700); tone(180, 0.2, 'sine', 0.12, 0, 0.5); } break;
      case 'splash': if (ok('splash', 800)) noise(0.4, 0.1, 1200, 400); break;
      default: break;
    }
  };
  const SCALE = [0, 2, 4, 7, 9];
  const note = (deg, oct) => 261.63 * Math.pow(2, (SCALE[((deg % 5) + 5) % 5] + 12 * (oct + Math.floor(deg / 5))) / 12);
  const sched = () => {
    if (!ac || !A.mus) return;
    const ahead = ac.currentTime + 0.6;
    if (nextT < ac.currentTime) nextT = ac.currentTime + 0.05;
    while (nextT < ahead) {
      const s = step % 32, bar = Math.floor(step / 8) % 4, root = [0, 3, 4, 2][bar];
      if (s % 2 === 0) { const deg = root + [0, 2, 4, 2, 5, 4, 2, 0][(s / 2) % 8]; tone(note(deg, 1), 0.28, 'triangle', 0.35, nextT, null, musGain); }
      if (s % 8 === 0) tone(note(root, -1), 0.5, 'sine', 0.5, nextT, null, musGain);
      if (s % 8 === 4) tone(note(root + 2, 0), 0.2, 'sine', 0.2, nextT, null, musGain);
      nextT += 0.25; step++;
    }
  };
  A.musicOn = () => { if (!ac) return; if (!timer) { nextT = 0; timer = setInterval(sched, 200); } };
  A.musicOff = () => { if (timer) { clearInterval(timer); timer = null; } };
  A.setMus = (on) => { A.mus = on; if (on) A.musicOn(); else A.musicOff(); };
  A.destroy = () => { A.musicOff(); try { if (ac) ac.close(); } catch (e) { /* niets */ } ac = null; };
  return A;
}

/* =====================================================================
   12. STIJL
   ===================================================================== */
const CSS = `
.tp-root{--tpb:rgba(255,255,255,.93);--tpink:#22263a;position:relative;margin:0 -1rem;height:calc(100vh - 76px);height:calc(100dvh - 76px);min-height:520px;max-height:960px;overflow:hidden;background:#cfe9ff;font-size:14px;line-height:1.3;color:var(--ink);-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
@media(prefers-color-scheme:dark){.tp-root{--tpb:rgba(30,33,46,.92);--tpink:#eef0f8}}
.tp-root *{box-sizing:border-box}
.tp-scr{position:absolute;left:0;right:0;top:0;bottom:56px;display:none}
.tp-scr.on{display:block}
.tp-scr.pn{overflow-y:auto;overflow-x:hidden;padding:12px 12px 24px;background:var(--bg);-webkit-overflow-scrolling:touch}
.tp-cv{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab}
.tp-cv.tool{cursor:crosshair}
.tp-nav{position:absolute;left:0;right:0;bottom:0;height:56px;display:flex;background:var(--card);border-top:1px solid var(--line);z-index:30}
.tp-nav button{flex:1;border:0;background:transparent;border-radius:0;padding:4px 0 2px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;font-size:10px;color:var(--mute);position:relative}
.tp-nav button b{font-size:21px;line-height:1;font-weight:400}
.tp-nav button.on{color:var(--accent);font-weight:700}
.tp-nav button.on::before{content:"";position:absolute;top:0;left:22%;right:22%;height:3px;background:var(--accent);border-radius:0 0 3px 3px}
.tp-dot{position:absolute;top:3px;left:calc(50% + 6px);min-width:16px;height:16px;border-radius:8px;background:#ef4444;color:#fff;font-size:10px;line-height:16px;text-align:center;padding:0 4px;font-weight:700}
.tp-root [hidden]{display:none!important}
.tp-hud{position:absolute;top:8px;left:8px;right:58px;display:flex;gap:6px;pointer-events:none;z-index:5;flex-wrap:wrap}
.tp-chip{pointer-events:auto;background:var(--tpb);color:var(--tpink);border-radius:14px;padding:5px 9px;box-shadow:0 2px 8px rgba(0,0,0,.18);font-weight:700;display:flex;align-items:center;gap:5px;white-space:nowrap;backdrop-filter:blur(6px)}
.tp-chip small{font-weight:600;opacity:.7;font-size:11px}
.tp-chip.mny{font-size:15px}
.tp-chip.mny .up{color:#18a058;font-size:11px;font-weight:700}
.tp-stars{letter-spacing:-1px;font-size:13px}
.tp-side{position:absolute;right:8px;top:48px;display:flex;flex-direction:column;gap:7px;z-index:6}
.tp-rb{width:44px;height:44px;border-radius:50%;border:0;background:var(--tpb);color:var(--tpink);font-size:21px;line-height:1;padding:0;box-shadow:0 2px 8px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;position:relative;backdrop-filter:blur(6px)}
.tp-rb.on{background:var(--accent);color:#fff}
.tp-rb small{position:absolute;bottom:-2px;right:-2px;background:#222;color:#fff;border-radius:8px;font-size:9px;padding:1px 4px}
.tp-rb:active{transform:scale(.92)}
.tp-pulse{animation:tp-pulse 1.1s ease-in-out infinite}
@keyframes tp-pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,210,63,.9),0 2px 8px rgba(0,0,0,.22)}50%{box-shadow:0 0 0 9px rgba(255,210,63,0),0 2px 8px rgba(0,0,0,.22)}}
.tp-tut{position:absolute;left:10px;right:62px;top:46px;background:var(--tpb);color:var(--tpink);border-radius:16px;padding:10px 12px;box-shadow:0 4px 16px rgba(0,0,0,.25);z-index:8;border:2px solid #ffd23f}
.tp-tut b{display:block;font-size:15px;margin-bottom:2px}
.tp-tut p{margin:0;font-size:13px}
.tp-tut a{display:inline-block;margin-top:5px;font-size:11px;opacity:.7;text-decoration:underline;cursor:pointer}
.tp-ev{position:absolute;left:10px;right:62px;top:46px;background:linear-gradient(135deg,#ffe29a,#ffb199);color:#3a2300;border-radius:16px;padding:9px 12px;box-shadow:0 4px 16px rgba(0,0,0,.25);z-index:9;display:flex;gap:10px;align-items:center}
.tp-ev .em{font-size:30px}
.tp-ev div{flex:1;min-width:0}.tp-ev b{display:block}.tp-ev span{font-size:12px}
.tp-ev button{background:#18a058;color:#fff;border:0;border-radius:12px;padding:8px 10px;font-weight:700;font-size:12px}
.tp-toasts{position:absolute;left:8px;right:62px;bottom:70px;display:flex;flex-direction:column;align-items:flex-start;gap:6px;pointer-events:none;z-index:16}
.tp-toast{background:rgba(25,28,40,.9);color:#fff;border-radius:14px;padding:7px 12px;font-size:13px;box-shadow:0 2px 10px rgba(0,0,0,.3);animation:tp-in .25s ease-out;max-width:100%}
.tp-toast.good{background:rgba(24,140,80,.95)}.tp-toast.bad{background:rgba(200,50,50,.95)}.tp-toast.gold{background:rgba(190,130,10,.96)}
@keyframes tp-in{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:none}}
.tp-sheet{position:absolute;left:0;right:0;bottom:0;background:var(--card);color:var(--ink);border-radius:20px 20px 0 0;box-shadow:0 -6px 24px rgba(0,0,0,.28);padding:12px 14px 12px;z-index:14;transform:translateY(110%);transition:transform .22s ease;max-height:64%;overflow-y:auto}
.tp-sheet.on{transform:none}
.tp-sheet h4{margin:0 0 4px;font-size:16px;display:flex;align-items:center;gap:8px}
.tp-sheet h4 .x{margin-left:auto;border:0;background:var(--line);border-radius:50%;width:28px;height:28px;padding:0;font-size:14px}
.tp-sheet .sub{color:var(--mute);font-size:12px;margin-bottom:8px}
.tp-bars{display:grid;grid-template-columns:auto 1fr;gap:3px 8px;align-items:center;font-size:12px;margin:6px 0}
.tp-bar{height:8px;background:var(--line);border-radius:4px;overflow:hidden}.tp-bar i{display:block;height:100%;border-radius:4px;background:#18a058;transition:width .3s}
.tp-bar.warn i{background:#f59e0b}.tp-bar.bad i{background:#ef4444}.tp-bar.blue i{background:#3b82f6}
.tp-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.tp-b{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:12px;padding:8px 11px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:5px;cursor:pointer}
.tp-b:active{transform:scale(.96)}
.tp-b.pri{background:var(--accent);color:#fff;border-color:var(--accent)}
.tp-b.ok{background:#18a058;color:#fff;border-color:#18a058}
.tp-b.red{background:#ef4444;color:#fff;border-color:#ef4444}
.tp-b[disabled],.tp-b.off{opacity:.45;pointer-events:none}
.tp-b small{opacity:.85;font-weight:500}
.tp-drawer{position:absolute;left:0;right:0;bottom:0;background:var(--card);color:var(--ink);border-radius:20px 20px 0 0;box-shadow:0 -6px 24px rgba(0,0,0,.28);padding:8px 8px 8px;z-index:13;transform:translateY(110%);transition:transform .22s ease}
.tp-drawer.on{transform:none}
.tp-cats{display:flex;gap:5px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none}
.tp-cats::-webkit-scrollbar,.tp-items::-webkit-scrollbar{display:none}
.tp-cat{flex:0 0 auto;border:1px solid var(--line);background:var(--card);border-radius:12px;padding:6px 10px;font-size:12px;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:4px}
.tp-cat.on{background:var(--accent);color:#fff;border-color:var(--accent)}
.tp-items{display:flex;gap:7px;overflow-x:auto;padding:2px 2px 4px;scrollbar-width:none}
.tp-it{flex:0 0 88px;border:2px solid var(--line);border-radius:14px;background:var(--card);padding:6px 4px 5px;text-align:center;color:var(--ink);position:relative;font-size:11px;line-height:1.2}
.tp-it b{display:block;font-size:26px;line-height:1.1;font-weight:400}
.tp-it span{display:block;font-weight:700;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tp-it em{display:block;font-style:normal;color:#18a058;font-weight:700}
.tp-it.sel{border-color:var(--accent);background:rgba(99,102,241,.1)}
.tp-it.lock{opacity:.55}.tp-it.lock em{color:var(--mute)}
.tp-it.poor em{color:#ef4444}
.tp-conf{position:absolute;left:8px;right:8px;bottom:12px;display:none;gap:8px;justify-content:center;z-index:15}
.tp-conf.on{display:flex}
.tp-conf .tp-b{box-shadow:0 3px 12px rgba(0,0,0,.3);padding:11px 14px;font-size:14px}
.tp-hint{position:absolute;left:50%;transform:translateX(-50%);bottom:12px;background:rgba(25,28,40,.88);color:#fff;border-radius:12px;padding:8px 12px;font-size:12px;z-index:12;cursor:pointer;white-space:nowrap}
.tp-modal{position:absolute;inset:0;background:rgba(10,12,24,.55);z-index:50;display:flex;align-items:center;justify-content:center;padding:18px;overflow-y:auto}
.tp-mbox{background:var(--card);color:var(--ink);border-radius:22px;padding:18px;max-width:380px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.4);text-align:center;animation:tp-in .25s ease-out}
.tp-mbox h3{margin:0 0 6px;font-size:20px}.tp-mbox p{margin:6px 0;color:var(--mute)}
.tp-mbox .big{font-size:44px;line-height:1.1}
.tp-h{font-size:17px;font-weight:800;margin:14px 0 6px;display:flex;align-items:center;gap:6px}
.tp-h:first-child{margin-top:2px}
.tp-h small{font-weight:500;color:var(--mute);font-size:12px;margin-left:auto}
.tp-box{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:11px 12px;margin:8px 0}
.tp-row{display:flex;align-items:center;gap:10px}
.tp-row .em{font-size:28px;width:38px;text-align:center;flex:0 0 38px}
.tp-row .tx{flex:1;min-width:0}.tp-row .tx b{display:block}.tp-row .tx span{color:var(--mute);font-size:12px}
.tp-row .tx .bar{margin-top:5px}
.tp-sp{display:flex;align-items:center;gap:6px}.tp-sp b{min-width:56px;text-align:center}
.tp-sp .tp-b{padding:6px 11px;font-size:16px}
.tp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(98px,1fr));gap:8px}
.tp-ach{border:1px solid var(--line);border-radius:14px;padding:8px 6px;text-align:center;font-size:11px;background:var(--card)}
.tp-ach b{display:block;font-size:26px;font-weight:400}
.tp-ach.no{opacity:.4;filter:grayscale(1)}
.tp-rev{display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--line);font-size:13px}
.tp-rev:last-child{border:0}
.tp-tabs{display:flex;gap:6px;overflow-x:auto;margin-bottom:8px;scrollbar-width:none}
.tp-chk{display:flex;align-items:center;justify-content:space-between;gap:8px}
.tp-badge{display:inline-block;border-radius:99px;padding:1px 8px;font-size:11px;font-weight:700;background:var(--line)}
.tp-badge.g{background:#18a058;color:#fff}
.tp-note{color:var(--mute);font-size:12px}
@media(max-width:380px){.tp-chip{padding:4px 7px;font-size:12px}.tp-it{flex-basis:80px}}
`;

/* ---------- kleine hulpfuncties voor de UI ---------- */
const esc2 = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (v) => Math.round(clamp(v, 0, 1) * 100);
function barHtml(v, cls) { return `<div class="tp-bar ${cls || ''}"><i style="width:${pct(v)}%"></i></div>`; }
const starText = (r) => { const f = clamp(Math.round(r), 0, 5); return '★'.repeat(f) + '☆'.repeat(5 - f); };
export function clockText(G) {
  const ph = (G.t / DAY + 0.35) % 1, h = ph * 24, hh = Math.floor(h), mm = Math.floor((h - hh) * 60 / 10) * 10;
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}
export function nightFactor(G) { return nightAt(G.t); }
export function dateText(G, P) {
  const s = seasonOf(P, G), dn = dayNo(G);
  return SEASONS[s] + ' · dag ' + (dn % 5 + 1);
}

/* =====================================================================
   13. PANELEN (HTML-sjablonen, zuiver)
   ===================================================================== */
const money = (v) => fmtM(v);
const stepOf = (p) => (p < 10 ? 0.5 : p < 50 ? 1 : p < 150 ? 5 : p < 500 ? 10 : 25);
const fmtPrice = (p) => (Math.round(p * 10) / 10).toString().replace('.', ',');
const mmss = (s) => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const hm = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h} u ${m} min` : `${m} min`; };

export function rpRate(G) {
  let rps = 0.4; for (const Q of G.parks) for (const o of Q.objs) if (o.t === 'lab') rps += DEFS.lab.rps * (1 + 0.1 * Q.lvl);
  return rps * rpMult(G);
}

function spark(h) {
  if (!h || h.length < 3) return '';
  const mx = Math.max(...h, 1), n = h.length, pts = h.map((v, i) => (i / (n - 1) * 200).toFixed(1) + ',' + (34 - v / mx * 30).toFixed(1)).join(' ');
  return `<svg viewBox="0 0 200 38" width="100%" height="46" preserveAspectRatio="none" style="margin-top:8px"><polyline points="${pts}" fill="none" stroke="#18a058" stroke-width="2.2" stroke-linejoin="round"/></svg><div class="tp-note">Inkomsten per seconde, laatste minuten (nu ${fmtN(h[n - 1])}/s)</div>`;
}

export function tplManage(G, P, hist) {
  const fair = fairEntry(P), lam = arrivalRate(G, P, true), cap = guestCap(P);
  const parts = P.parts || { happy: 0.75, appeal: 0, variety: 0, clean: 1, beauty: 0, fac: 0, safety: 0, rev: 0.7 };
  const tips = [];
  if (parts.appeal < 0.5) tips.push('Bouw meer of spannendere attracties.');
  if (parts.fac < 0.5) tips.push('Bouw meer kraampjes en toiletten.');
  if (parts.clean < 0.7) tips.push('Neem schoonmakers aan of zet prullenbakken neer.');
  if (parts.safety < 0.8) tips.push('Neem monteurs aan: er staan stuk-attracties.');
  if (parts.beauty < 0.4) tips.push('Zet bomen, bloemen en fonteinen neer.');
  if (parts.variety < 0.6) tips.push('Bouw verschillende soorten attracties.');
  if (parts.happy < 0.6) tips.push('Bezoekers zijn ontevreden: te duur, te lang wachten, honger of dorst.');
  const bar = (l, v) => `<span>${l}</span>${barHtml(v, v < 0.4 ? 'bad' : v < 0.7 ? 'warn' : '')}`;
  let h = `<div class="tp-h">💶 Entree</div><div class="tp-box">
    <div class="tp-chk"><div class="tp-sp"><button class="tp-b" data-act="entry-" ${P.auto ? 'disabled' : ''}>−</button><b>${money(P.entry)}</b><button class="tp-b" data-act="entry+" ${P.auto ? 'disabled' : ''}>+</button></div>
    <button class="tp-b ${P.auto ? 'ok' : ''}" data-act="entry-auto">${P.auto ? '✔ Slimme prijs' : 'Slimme prijs'}</button></div>
    <p class="tp-note" style="margin:8px 0 0">Bezoekers vinden ${money(fair)} eerlijk. ${P.auto ? 'De slimme prijs past zichzelf aan als je park groeit.' : (P.entry > fair * 1.3 ? 'Dit is duur: er komen minder bezoekers.' : P.entry < fair * 0.5 ? 'Dit is goedkoop: veel bezoekers, weinig geld.' : 'Mooi gekozen.')}</p>
    <p class="tp-note" style="margin:4px 0 0">Nu ongeveer ${Math.round(Math.min(lam, cap / 175) * 60)} nieuwe bezoekers per minuut · ${P.guests.length} van max. ${cap} in het park.</p>${spark(hist)}</div>`;
  h += `<div class="tp-h">⭐ Parkbeoordeling <small>${starText(P.rs)} ${P.rs.toFixed(1).replace('.', ',')}</small></div><div class="tp-box"><div class="tp-bars">
    ${bar('Blije gasten', parts.happy)}${bar('Attracties', parts.appeal)}${bar('Afwisseling', parts.variety)}${bar('Voorzieningen', parts.fac)}${bar('Schoon', parts.clean)}${bar('Mooi park', parts.beauty)}${bar('Veilig', parts.safety)}</div>
    ${tips.length ? `<p class="tp-note" style="margin:6px 0 0">💡 ${esc2(tips[0])}</p>` : '<p class="tp-note" style="margin:6px 0 0">🌟 Alles ziet er prima uit!</p>'}</div>`;
  h += '<div class="tp-h">👷 Personeel <small>loon loopt per seconde</small></div>';
  for (const k of ['m', 'j', 'e']) {
    const cp = staffCap(P, G, k), cost = hireCost(P, k);
    const desc = k === 'm' ? 'Repareren attracties en onderhouden ze.' : k === 'j' ? 'Ruimen rommel op de paden op.' : 'Maken bezoekers blij onderweg.';
    h += `<div class="tp-box"><div class="tp-row"><div class="em">${STAFF_NAMES[k][1]}</div><div class="tx"><b>${STAFF_NAMES[k][0]}s: ${P.staff[k]} / ${cp}</b><span>${desc} Loon ${money(WAGE[k] * 60)}/min per persoon.</span></div>
      <div class="tp-acts" style="margin:0;flex-wrap:nowrap"><button class="tp-b" data-act="fire:${k}" ${P.staff[k] <= 0 ? 'disabled' : ''}>−</button><button class="tp-b pri" data-act="hire:${k}" ${P.staff[k] >= cp || G.money < cost ? 'disabled' : ''}>+ <small>${money(cost)}</small></button></div></div></div>`;
  }
  h += '<div class="tp-h">📣 Marketing</div>';
  if (P.guests.length >= cap * 0.9) h += '<div class="tp-box tp-note">Je park zit al bijna vol: reclame helpt nu weinig. Bouw eerst uit of verhoog de prijzen.</div>';
  const active = G.mk.until > G.t;
  if (active) h += `<div class="tp-box"><b>${CAMPAIGNS.find((c) => c.id === G.mk.id)?.e || '📣'} Campagne actief</b> · ×${G.mk.mult} bezoekers nog ${mmss(G.mk.until - G.t)}</div>`;
  for (const c of CAMPAIGNS) {
    const cost = campaignCost(G, P, c);
    h += `<div class="tp-box"><div class="tp-row"><div class="em">${c.e}</div><div class="tx"><b>${c.n}</b><span>×${c.mult} bezoekers voor ${Math.round(c.dur * (1 + 0.5 * perk(G, 'reclame')) / 60 * 10) / 10} min</span></div><button class="tp-b pri" data-act="camp:${c.id}" ${active || G.money < cost ? 'disabled' : ''}>${money(cost)}</button></div></div>`;
  }
  const types = [...new Set(P.rides.map((o) => o.t))];
  h += '<div class="tp-h">🎟️ Kaartjesprijzen</div>';
  if (!types.length) h += '<div class="tp-box tp-note">Bouw eerst een attractie.</div>';
  for (const t of types) {
    const d = DEFS[t], base = P.prices[t] != null ? P.prices[t] : d.pr;
    const lv = Math.max(...P.rides.filter((o) => o.t === t).map((o) => o.l));
    const eff = base * (1 + 0.12 * lv), fp = d.pr * (1 + 0.12 * lv);
    const mood = eff / fp > 1.5 ? 'Duur' : eff / fp < 0.7 ? 'Koopje' : 'Prima prijs';
    h += `<div class="tp-box"><div class="tp-row"><div class="em">${d.e}</div><div class="tx"><b>${d.n}</b><span>${mood} · eerlijk ${money(fp)}</span></div>
      <div class="tp-sp"><button class="tp-b" data-act="rp-:${t}">−</button><b>${fmtMs(eff)}</b><button class="tp-b" data-act="rp+:${t}">+</button></div></div></div>`;
  }
  h += '<div class="tp-h">🗺️ Parken</div>';
  for (let i = 0; i < PARKS.length; i++) {
    const meta = PARKS[i], Q = G.parks.find((p) => p.i === i);
    if (Q) {
      const isCur = G.parks[G.cur] === Q, ec = expandCost(G, Q), mx = Q.lvl >= meta.sizes.length - 1;
      h += `<div class="tp-box"><div class="tp-row"><div class="em">${meta.e}</div><div class="tx"><b>${meta.n} ${isCur ? '<span class="tp-badge g">hier</span>' : ''}</b><span>${starText(Q.rs)} · ${Q.staff.m + Q.staff.j + Q.staff.e} personeel · ${Q.n}×${Q.n} tegels</span></div>
        ${isCur ? '' : `<button class="tp-b pri" data-act="park:${i}">Ga naar</button>`}</div>
        <div class="tp-acts"><button class="tp-b" data-act="expand:${i}" ${mx || G.money < ec ? 'disabled' : ''}>${mx ? 'Maximale grootte' : `Uitbreiden naar ${meta.sizes[Q.lvl + 1]}×${meta.sizes[Q.lvl + 1]} <small>${money(ec)}</small>`}</button></div></div>`;
    } else {
      h += `<div class="tp-box"><div class="tp-row"><div class="em">${meta.e}</div><div class="tx"><b>${meta.n}</b><span>${meta.d}</span></div><button class="tp-b pri" data-act="unlock:${i}" ${G.money < meta.cost ? 'disabled' : ''}>🔓 ${money(meta.cost)}</button></div></div>`;
    }
  }
  h += '<div class="tp-h">💬 Reviews <small>gemiddeld ' + (G.revN ? (G.revSum / G.revN).toFixed(1).replace('.', ',') : '–') + ' ★ (' + fmtN(G.revN) + ')</small></div><div class="tp-box">';
  if (!G.reviews.length) h += '<span class="tp-note">Nog geen reviews. Bezoekers schrijven er een als ze naar huis gaan.</span>';
  for (const r of G.reviews.slice(0, 8)) h += `<div class="tp-rev"><span>${'★'.repeat(r.s)}${'☆'.repeat(5 - r.s)}</span><span>${esc2(r.t)}</span></div>`;
  h += '</div>';
  return h;
}

export function tplResearch(G) {
  const rate = rpRate(G);
  let h = `<div class="tp-h">🔬 Onderzoek <small>${fmtN(G.rp)} punten · +${rate.toFixed(1).replace('.', ',')}/s</small></div>`;
  if (!G.parks.some((P) => P.objs.some((o) => o.t === 'lab'))) h += '<div class="tp-box tp-note">💡 Bouw een Onderzoekslab 🔬 in je park voor veel meer punten per seconde.</div>';
  const groups = [['Attracties', (d) => d.k === 'ride'], ['Eten, drinken & winkels', (d) => d.k === 'food' || d.k === 'shop'], ['Voorzieningen', (d) => ['wc', 'bench', 'bin', 'lab'].includes(d.k)], ['Decoratie', (d) => d.k === 'decor']];
  const list = researchList();
  for (const [gn, f] of groups) {
    const items = list.filter((r) => f(DEFS[r.id]));
    if (!items.length) continue;
    h += `<div class="tp-h">${gn}</div>`;
    for (const r of items) {
      const have = !!G.res[r.id], can = G.rp >= r.rp;
      h += `<div class="tp-box" style="${have ? 'opacity:.6' : ''}"><div class="tp-row"><div class="em">${r.e}</div><div class="tx"><b>${r.n}</b><span>${esc2(r.d)}${DEFS[r.id].k === 'ride' ? ` · spanning ${DEFS[r.id].thr}, ticket ${money(DEFS[r.id].pr)}` : ''}</span>${have ? '' : `<div class="bar">${barHtml(G.rp / r.rp, 'blue')}</div>`}</div>
        ${have ? '<span class="tp-badge g">✔ Ontdekt</span>' : `<button class="tp-b ${can ? 'pri' : ''}" data-act="res:${r.id}" ${can ? '' : 'disabled'}>${fmtN(r.rp)} 🔬</button>`}</div></div>`;
    }
  }
  h += '<div class="tp-h">🧠 Verbeteringen</div>';
  for (const id of Object.keys(PERKS)) {
    const p = PERKS[id], lvl = G.res['p:' + id] || 0, mx = lvl >= p.max, c = mx ? 0 : perkCost(id, lvl);
    h += `<div class="tp-box"><div class="tp-row"><div class="em">${p.e}</div><div class="tx"><b>${p.n} <span class="tp-badge">${lvl}/${p.max}</span></b><span>${p.d}</span>${mx ? '' : `<div class="bar">${barHtml(G.rp / c, 'blue')}</div>`}</div>
      ${mx ? '<span class="tp-badge g">Max</span>' : `<button class="tp-b ${G.rp >= c ? 'pri' : ''}" data-act="res:p:${id}" ${G.rp >= c ? '' : 'disabled'}>${fmtN(c)} 🔬</button>`}</div></div>`;
  }
  return h;
}

export function tplGoals(G, now) {
  const ds = dailyState(G, now);
  let h = `<div class="tp-h">🎁 Dagelijkse beloning</div><div class="tp-box"><div class="tp-row"><div class="em">🎁</div><div class="tx"><b>${ds.can ? 'Je beloning staat klaar!' : 'Al opgehaald, kom morgen terug'}</b><span>Reeks: ${ds.streak} ${ds.streak === 1 ? 'dag' : 'dagen'} · elke 7e dag een gouden ticket 🎟️</span></div>
    <button class="tp-b ${ds.can ? 'ok' : ''}" data-act="daily" ${ds.can ? '' : 'disabled'}>Ophalen</button></div>
    <div class="tp-acts">${[1, 2, 3, 4, 5, 6, 7].map((i) => `<span class="tp-badge ${i <= ds.streak % 7 || (ds.streak > 0 && ds.streak % 7 === 0) ? 'g' : ''}">${i === 7 ? '🎟️' : i}</span>`).join('')}</div></div>`;
  const open = GOALS.filter((g) => !G.goals[g.id]);
  const ready = open.filter((g) => goalState(G, g).done);
  h += `<div class="tp-h">🏆 Doelen <small>${GOALS.length - open.length} van ${GOALS.length} klaar</small></div>`;
  if (ready.length > 1) h += `<button class="tp-b ok" data-act="claimall" style="width:100%;justify-content:center;margin-bottom:6px">🎉 Alles ophalen (${ready.length})</button>`;
  const show = [...ready, ...open.filter((g) => !ready.includes(g))].slice(0, 6);
  const netNow = totalRate(G).net;
  for (const g of show) {
    const s = goalState(G, g), rw = goalReward(G, g, netNow);
    h += `<div class="tp-box"><div class="tp-row"><div class="em">${s.done ? '🏆' : '🎯'}</div><div class="tx"><b>${esc2(g.t)}</b><span>Beloning: ${money(rw)}${g.rw.rp ? ` + ${fmtN(g.rw.rp)} 🔬` : ''}</span><div class="bar">${barHtml(s.c / s.m, s.done ? '' : 'blue')}</div></div>
      <button class="tp-b ${s.done ? 'ok' : ''}" data-act="goal:${g.id}" ${s.done ? '' : 'disabled'}>${s.done ? 'Ophalen' : (g.id === 'g7' || g.id === 'g15' || g.id === 'g21' || g.id === 'g28' ? `${s.c.toFixed(1).replace('.', ',')}/${s.m}` : `${fmtN(Math.floor(s.c))}/${fmtN(s.m)}`)}</button></div></div>`;
  }
  if (!open.length) {
    const eg = endlessGoal(G), [ec, em] = eg.prog(G), erw = goalReward(G, eg, netNow);
    h += `<div class="tp-box"><div class="tp-row"><div class="em">♾️</div><div class="tx"><b>${esc2(eg.t)}</b><span>Eindeloze mijlpaal · beloning ${money(erw)}${eg.rw.tk ? ' + 1 🎟️' : ''}</span><div class="bar">${barHtml(ec / em, ec >= em ? '' : 'blue')}</div></div><button class="tp-b ${ec >= em ? 'ok' : ''}" data-act="egoal" ${ec >= em ? '' : 'disabled'}>${ec >= em ? 'Ophalen' : fmtN(Math.floor(ec)) + '/' + fmtN(em)}</button></div></div><div class="tp-note">Alle vaste doelen zijn klaar! Hierna komen steeds nieuwe mijlpalen. Of begin een nieuwe franchise bij ⭐ Meer.</div>`;
  }
  h += `<div class="tp-h">🏅 Prestaties <small>${Object.keys(G.ach).length} van ${ACHS.length}</small></div><div class="tp-grid">`;
  for (const a of ACHS) {
    const got = !!G.ach[a.id], [c, m] = a.prog(G);
    h += `<div class="tp-ach ${got ? '' : 'no'}"><b>${a.e}</b>${esc2(a.t)}<br><span class="tp-note">${got ? (a.tk ? '+' + a.tk + ' 🎟️' : 'Behaald!') : esc2(a.d)}</span>${got ? '' : barHtml(c / m, 'blue')}</div>`;
  }
  return h + '</div>';
}

export function tplMore(G, V) {
  const gain = franchiseGain(G);
  let h = `<div class="tp-h">⭐ Franchise <small>🎟️ ${G.tix} gouden tickets</small></div><div class="tp-box">
    <p style="margin:0 0 6px">Begin opnieuw met een nieuw park en krijg 🎟️ <b>gouden tickets</b>. Daarmee koop je blijvende voordelen: meer inkomen, goedkoper bouwen, meer startgeld en meer.</p>
    <p class="tp-note" style="margin:0 0 8px">Je verliest geld, parken en onderzoek van deze ronde. Voordelen, prestaties en tickets blijven. Deze ronde verdiend: ${money(G.earnedRun)}. Je krijgt nu <b>${gain}</b> 🎟️. Het volgende ticket krijg je vanaf ${money(150000 * Math.pow(gain + 1, 1 / 0.6))} verdiend.${gain > 0 && gain < 3 ? ' Tip: wacht nog even, dan krijg je meer tickets.' : ''}</p>
    <button class="tp-b ${gain ? 'pri' : ''}" data-act="franchise" ${gain ? '' : 'disabled'}>🎉 Nieuwe franchise starten (+${gain} 🎟️)</button></div>`;
  h += '<div class="tp-h">🛒 Franchise-voordelen</div>';
  for (const id of Object.keys(FRANCHISE)) {
    const f = FRANCHISE[id], l = fr(G, id), mx = l >= f.max, c = mx ? 0 : f.cost(l);
    h += `<div class="tp-box"><div class="tp-row"><div class="em">${f.e}</div><div class="tx"><b>${f.n} <span class="tp-badge">${l}/${f.max}</span></b><span>${f.d}</span></div>${mx ? '<span class="tp-badge g">Max</span>' : `<button class="tp-b ${G.tix >= c ? 'pri' : ''}" data-act="fb:${id}" ${G.tix >= c ? '' : 'disabled'}>${c} 🎟️</button>`}</div></div>`;
  }
  const rev = G.revN ? (G.revSum / G.revN).toFixed(1).replace('.', ',') : '–';
  h += `<div class="tp-h">📊 Statistieken</div><div class="tp-box"><div class="tp-bars" style="grid-template-columns:1fr auto">
    <span>Bezoekers ontvangen</span><b>${fmtN(G.st.visitors)}</b><span>Ritjes gemaakt</span><b>${fmtN(G.st.riders)}</b><span>Totaal verdiend</span><b>${money(G.earnedAll)}</b><span>Speeltijd</span><b>${hm(G.st.play)}</b>
    <span>Gemiddelde review</span><b>${rev} ★</b><span>Fooien gekregen</span><b>${fmtN(G.st.tips)}</b><span>Franchises</span><b>${G.st.prestiges}</b></div></div>`;
  h += `<div class="tp-h">⚙️ Instellingen</div><div class="tp-box">
    <div class="tp-chk"><span>🔊 Geluidjes</span><button class="tp-b ${G.set.sfx ? 'ok' : ''}" data-act="sfx">${G.set.sfx ? 'Aan' : 'Uit'}</button></div><br>
    <div class="tp-chk"><span>🎵 Muziek</span><button class="tp-b ${G.set.mus ? 'ok' : ''}" data-act="mus">${G.set.mus ? 'Aan' : 'Uit'}</button></div><br>
    <div class="tp-chk"><span>⏩ Spelsnelheid</span><button class="tp-b" data-act="speed">×${G.set.spd}</button></div><br>
    <div class="tp-chk"><span>🎓 Uitleg</span><button class="tp-b" data-act="tutorial">Opnieuw tonen</button></div><br>
    <div class="tp-chk"><span>☁️ Opslag</span><span class="tp-note">${esc2(V.cloudMsg || 'lokaal')}</span></div><br>
    <div class="tp-chk"><span>🗑️ Alles wissen</span><button class="tp-b ${V.resetArmed ? 'red' : ''}" data-act="reset">${V.resetArmed ? 'Zeker weten? Tik nog eens' : 'Opnieuw beginnen'}</button></div></div>
    <p class="tp-note" style="text-align:center">Themapark Tycoon · versie ${VERSION} · je voortgang wordt automatisch bewaard</p>`;
  return h;
}

/* =====================================================================
   14. DE VIEW
   ===================================================================== */
const TABS = [['park', '🎡', 'Park'], ['manage', '📋', 'Beheer'], ['research', '🔬', 'Onderzoek'], ['goals', '🏆', 'Doelen'], ['more', '⭐', 'Meer']];

export function themaparkView(ctx) {
  const { db, me, view, addCleanup } = ctx;
  const uid = ctx.uid || (me && (me.uid || me.id)) || 'anon';
  let alive = true;
  let G = null;
  const cur = () => G.parks[G.cur];
  const A = makeAudio();
  const timers = [];
  const listeners = [];
  const on = (t, ev, fn, opt) => { t.addEventListener(ev, fn, opt); listeners.push([t, ev, fn, opt]); };
  let raf = 0;

  if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); };
  }
  const css = document.createElement('style'); css.textContent = CSS; document.head.appendChild(css);
  const root = document.createElement('div'); root.className = 'tp-root';
  view.innerHTML = ''; view.appendChild(root);
  root.innerHTML = `
  <div class="tp-scr on" data-s="park">
    <canvas class="tp-cv"></canvas>
    <div class="tp-hud"><div class="tp-chip mny" data-hud="money">💰 <span data-v="money">€0</span><span class="up" data-v="rate"></span></div>
      <div class="tp-chip" data-act="goto-manage">⭐ <span data-v="stars">1,0</span></div>
      <div class="tp-chip" data-act="goto-manage">👥 <span data-v="guests">0</span></div>
      <div class="tp-chip" data-v="env">☀️ 09:00</div>
      <div class="tp-chip" data-act="nextpark" data-v="parkchip" style="display:none"></div></div>
    <div class="tp-side">
      <button class="tp-rb" data-act="build" data-hint="build">🔨</button>
      <button class="tp-rb" data-act="speed">⏩<small data-v="spd">×1</small></button>
      <button class="tp-rb" data-act="daily-btn" data-v="dailybtn">🎁</button>
      <button class="tp-rb" data-act="mus">🎵</button>
      <button class="tp-rb" data-act="center">🧭</button>
      <button class="tp-rb" data-act="zoom+" data-v="zp">＋</button>
      <button class="tp-rb" data-act="zoom-" data-v="zm">－</button>
    </div>
    <div class="tp-tut" data-v="tut" hidden></div>
    <div class="tp-ev" data-v="ev" hidden></div>
    <div class="tp-toasts" data-v="toasts"></div>
    <div class="tp-hint" data-v="hint" data-act="pcancel" hidden></div>
    <div class="tp-conf" data-v="conf"></div>
    <div class="tp-sheet" data-v="sheet"></div>
    <div class="tp-drawer" data-v="drawer"></div>
  </div>
  ${TABS.slice(1).map((t) => `<div class="tp-scr pn" data-s="${t[0]}"></div>`).join('')}
  <nav class="tp-nav">${TABS.map((t) => `<button data-act="tab:${t[0]}" class="${t[0] === 'park' ? 'on' : ''}" data-hint="tab-${t[0]}"><b>${t[1]}</b>${t[2]}<i class="tp-dot" data-dot="${t[0]}" hidden></i></button>`).join('')}</nav>
  <div class="tp-modal" data-v="modal"><div class="tp-mbox"><div class="big">🎡</div><h3>Park wordt geladen…</h3></div></div>`;
  const q = (s) => root.querySelector(s);
  const vq = (n) => root.querySelector(`[data-v="${n}"]`);
  const canvas = q('canvas');

  /* ---------- toestand van het scherm ---------- */
  const V = {
    tab: 'park', W: 360, H: 560, dpr: 1, cam: { x: 0, y: 0, z: 0.7 }, tool: null, ghost: null, sel: null, cat: 'rides', buildOpen: false,
    parts: [], toasts: [], last: 0, acc: 0, ground: null, gkey: '', incEma: 0, lastEarn: 0, lastEarnT: 0, pdown: false, resetArmed: 0,
    hist: [], fw: [], cloudMsg: 'lokaal', dirty: false, lastCloud: 0, lastLocal: 0, saveTimer: 0, rain: [], tutSkip: false, fps: 0, panelSig: {}, lastPanel: 0,
    hoverTouch: false, lastPaint: null, painted: 0, dailyShown: false, evId: null, shown: {},
  };
  for (let i = 0; i < 90; i++) V.rain.push([Math.random(), Math.random(), 0.6 + Math.random()]);

  /* ---------- hulpjes: toast, geluid, opslag ---------- */
  function toast(msg, kind) {
    const box = vq('toasts'); if (!box) return;
    const el = document.createElement('div'); el.className = 'tp-toast ' + (kind || ''); el.innerHTML = msg;
    box.appendChild(el);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    timers.push(setTimeout(() => { try { el.remove(); } catch (e) { /* weg */ } }, 3600));
  }
  const sfx = (n) => { if (G) { A.sfx = !!G.set.sfx; A.play(n); } };
  const markDirty = () => { V.dirty = true; V.dc = true; };

  const lsKey = `big:themapark:${uid}`;
  function saveLocal() {
    if (!G) return null;
    const s = packGame(G, Date.now());
    try { localStorage.setItem(lsKey, JSON.stringify({ u: G.saved, d: s })); } catch (e) { /* vol of geblokkeerd */ }
    V.lastLocal = Date.now(); return s;
  }
  let cloudBusy = false;
  async function saveCloud(final) {
    if (!G || !db) return;
    const now = Date.now();
    if (!final && now - V.lastCloud < 60000) return;
    if (cloudBusy && !final) return;
    const s = packGame(G, now);
    if (s.length > MAXSAVE) { V.cloudMsg = 'lokaal (te groot voor cloud)'; return; }
    V.lastCloud = now; V.dc = false; cloudBusy = true;
    try {
      const fs = ctx._fs || await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
      await fs.setDoc(fs.doc(db, 'gamesaves', 'big-themapark__' + uid), { game: 'big-themapark', uid, data: s, updated: now });
      V.cloudMsg = 'cloud ✓ ' + new Date(now).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { V.cloudMsg = 'alleen lokaal (cloud niet bereikbaar)'; } finally { cloudBusy = false; }
  }
  function flushSave(final) {
    if (!G) return;
    saveLocal();
    V.dirty = false;
    if (final || V.dc) saveCloud(final);
  }

  /* ---------- laden ---------- */
  async function loadAll() {
    let local = null, cloud = null;
    try { const r = JSON.parse(localStorage.getItem(lsKey) || 'null'); if (r && r.d) local = r; } catch (e) { /* leeg */ }
    try {
      if (db) {
        const fs = ctx._fs || await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
        const sn = await fs.getDoc(fs.doc(db, 'gamesaves', 'big-themapark__' + uid));
        if (sn.exists()) { const d = sn.data(); if (d && typeof d.data === 'string') cloud = { u: +d.updated || 0, d: d.data }; }
      }
    } catch (e) { V.cloudMsg = 'alleen lokaal (cloud niet bereikbaar)'; }
    const best = local && cloud ? (cloud.u > local.u ? cloud : local) : (cloud || local);
    let g = best ? unpackGame(best.d, uid) : null;
    if (!g && best === cloud && local) g = unpackGame(local.d, uid);
    if (!g) { g = newGame(uid); g._fresh = true; }
    return g;
  }

  /* ---------- camera ---------- */
  const s2w = (px, py) => [(px - V.W / 2) / V.cam.z + V.cam.x, (py - V.H / 2) / V.cam.z + V.cam.y];
  const w2t = (wx, wy) => [(wx / 32 + wy / 16) / 2, (wy / 16 - wx / 32) / 2];
  const t2w = (x, y) => [X(x, y), Y(x, y)];
  function clampCam() {
    const P = cur(), n = P.n;
    V.cam.z = clamp(V.cam.z, 0.32, 2.6);
    V.cam.x = clamp(V.cam.x, -n * 32 - 40, n * 32 + 40);
    V.cam.y = clamp(V.cam.y, -40, n * 32 + 80);
  }
  function centerOn(tx, ty, z) { const w = t2w(tx, ty); V.cam.x = w[0]; V.cam.y = w[1]; if (z) V.cam.z = z; clampCam(); }
  function fitMargin() { try { const vw = view.getBoundingClientRect().width; if (vw && window.innerWidth && window.innerWidth - vw < 28) root.style.margin = '0'; } catch (e) { /* laat staan */ } }
  function resize() {
    const r = canvas.getBoundingClientRect();
    V.W = Math.max(200, r.width || 360); V.H = Math.max(200, r.height || 560);
    V.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(V.W * V.dpr); canvas.height = Math.floor(V.H * V.dpr);
  }

  /* ---------- bouwen en gereedschap ---------- */
  function setTool(t) {
    V.tool = t; V.ghost = null; V.lastPaint = null;
    canvas.classList.toggle('tool', !!t);
    renderDrawer(); renderConf(); updateHint();
  }
  function ghostAt(px, py, touch) {
    const t = V.tool; if (!t || t.k !== 'place') return;
    const d = DEFS[t.id], w = s2w(px, py - (touch ? 44 : 0)), tt = w2t(w[0], w[1]);
    const gx = Math.floor(tt[0]) - Math.floor((d.w - 1) / 2), gy = Math.floor(tt[1]) - Math.floor((d.h - 1) / 2);
    setGhost(gx, gy);
  }
  function setGhost(gx, gy) {
    const t = V.tool, P = cur(); if (!t) return;
    const why = canPlace(P, t.id, gx, gy), cost = buildCost(G, t.id);
    V.ghost = { x: gx, y: gy, why, ok: !why && G.money >= cost, access: hasAccess(P, t.id, gx, gy) };
    renderConf(); updateHint();
  }
  function tryPlace() {
    const t = V.tool, gh = V.ghost; if (!t || t.k !== 'place' || !gh) return false;
    const r = place(G, cur(), t.id, gh.x, gh.y);
    if (r.ok) {
      sfx('place'); burst(gh.x + DEFS[t.id].w / 2, gh.y + DEFS[t.id].h / 2, 10);
      if (!r.access && DEFS[t.id].k !== 'decor') toast('⚠️ Er ligt nog geen weg langs dit gebouw: bezoekers kunnen er niet bij.', 'bad');
      markDirty(); setGhost(gh.x, gh.y); renderDrawer(); updateHUD(true);
      return true;
    }
    sfx('err'); toast(r.msg, 'bad'); return false;
  }
  function paintTile(tx, ty) {
    const P = cur(), t = V.tool; if (!t) return;
    if (t.k === 'road') {
      if (P.roads[ty * P.n + tx] || !inb(P, tx, ty)) return;
      if (paintRoad(G, P, tx, ty)) { V.painted++; if (V.painted % 3 === 1) sfx('click'); markDirty(); } else if (G.money < ROAD_COST) { if (!V.shown.poor || Date.now() - V.shown.poor > 2500) { V.shown.poor = Date.now(); toast('Te weinig geld voor weg', 'bad'); sfx('err'); } }
    } else if (t.k === 'dozer') {
      const r = bulldoze(G, P, tx, ty);
      if (r) { sfx('click'); burst(tx + 0.5, ty + 0.5, 6, '#9a8a70'); markDirty(); if (r.kind === 'obj') toast(`${esc2(r.name)} gesloopt · +${money(r.gain)}`); if (V.sel && V.sel.kind === 'obj' && !P.byId.has(V.sel.id)) closeSheet(); }
    } else if (t.k === 'place' && t.paint) {
      if (!inb(P, tx, ty)) return;
      const r = place(G, P, t.id, tx, ty);
      if (r.ok) { sfx('place'); burst(tx + 0.5, ty + 0.5, 5); markDirty(); renderDrawer(); }
      else if (r.msg === 'Te weinig geld') { if (!V.shown.poor || Date.now() - V.shown.poor > 2500) { V.shown.poor = Date.now(); toast(r.msg, 'bad'); sfx('err'); } }
    }
  }
  function paintLine(tx, ty) {
    const lp = V.lastPaint;
    if (!lp) { paintTile(tx, ty); V.lastPaint = [tx, ty]; return; }
    let x = lp[0], y = lp[1];
    let guard = 0;
    while ((x !== tx || y !== ty) && guard++ < 60) {
      if (Math.abs(tx - x) >= Math.abs(ty - y)) x += Math.sign(tx - x); else y += Math.sign(ty - y);
      paintTile(x, y);
    }
    V.lastPaint = [tx, ty];
  }
  function burst(tx, ty, n, col) {
    const w = t2w(tx, ty);
    for (let i = 0; i < n; i++) V.parts.push({ x: w[0], y: w[1] - 10, vx: (Math.random() - 0.5) * 90, vy: -30 - Math.random() * 70, life: 0.7 + Math.random() * 0.4, max: 1.1, kind: 'dot', col: col || ['#ffd23f', '#ff6f91', '#4cc9f0', '#8ac926'][i % 4], size: 2 + Math.random() * 2 });
    if (V.parts.length > 160) V.parts.splice(0, V.parts.length - 160);
  }
  function floatText(wx, wy, txt, col) {
    if (V.parts.length > 140) return;
    V.parts.push({ x: wx, y: wy, vx: 0, vy: -28, life: 1.3, max: 1.3, kind: 'text', txt, col: col || '#ffd23f', size: 12 });
  }

  /* ---------- aanwijzen ---------- */
  function pickGuest(wx, wy) {
    const P = cur(); let best = null, bd = (26 / V.cam.z) ** 2;
    for (const g of P.guests) {
      if (g.st === RIDE) continue;
      const sx = X(g.x, g.y), sy = Y(g.x, g.y) - 10 * g.sc;
      const d = (sx - wx) ** 2 + (sy - wy) ** 2;
      if (d < bd) { bd = d; best = g; }
    }
    return best;
  }
  function pickObj(wx, wy) {
    const P = cur(); let best = null, bk = -1;
    for (let z = 0; z <= 150; z += 6) {
      const t = w2t(wx, wy + z), tx = Math.floor(t[0]), ty = Math.floor(t[1]);
      if (!inb(P, tx, ty)) continue;
      const id = P.occ[ty * P.n + tx]; if (!id) continue;
      const o = P.byId.get(id); if (!o || objHeight(o) < z - 4) continue;
      const k = o.x + o.y + (DEFS[o.t].w + DEFS[o.t].h) / 2;
      if (k > bk) { bk = k; best = o; }
    }
    return best;
  }
  function handleTap(px, py, touch) {
    A.start();
    const P = cur(), w = s2w(px, py), t = w2t(w[0], w[1]), tx = Math.floor(t[0]), ty = Math.floor(t[1]);
    const tool = V.tool;
    if (tool) {
      if (tool.k === 'road' || tool.k === 'dozer' || (tool.k === 'place' && tool.paint)) { paintTile(tx, ty); V.lastPaint = null; return; }
      if (tool.k === 'place') {
        if (touch) ghostAt(px, py, true); else { ghostAt(px, py, false); tryPlace(); }
        return;
      }
    }
    // normaal: bezoeker, rommel, object
    const g = pickGuest(w[0], w[1]);
    if (g) { selectGuest(g); const amt = tipGuest(G, P, g); if (amt) { sfx('tip'); floatText(X(g.x, g.y), Y(g.x, g.y) - 28, '+' + money(amt), '#ffd23f'); markDirty(); } return; }
    if (inb(P, tx, ty) && P.litter[ty * P.n + tx]) { if (cleanTile(G, P, tx, ty)) { sfx('click'); floatText(X(tx + 0.5, ty + 0.5), Y(tx + 0.5, ty + 0.5) - 10, '✨', '#fff'); markDirty(); return; } }
    const o = pickObj(w[0], w[1]);
    if (o) { selectObj(o); return; }
    closeSheet();
  }

  /* ---------- schermen: sheet, drawer, confirm ---------- */
  function layoutFloat() { const t = vq('toasts'); if (t) t.style.bottom = (V.buildOpen ? 165 : V.sel ? 150 : 70) + 'px'; }
  function closeSheet() { V.sel = null; vq('sheet').classList.remove('on'); layoutFloat(); }
  function selectObj(o) { V.sel = { kind: 'obj', id: o.id }; sfx('click'); V.buildOpen = false; syncDrawerOpen(); renderSheet(); vq('sheet').classList.add('on'); layoutFloat(); }
  function selectGuest(g) { V.sel = { kind: 'guest', id: g.id }; V.buildOpen = false; syncDrawerOpen(); renderSheet(); vq('sheet').classList.add('on'); layoutFloat(); }
  function renderSheet() {
    const sh = vq('sheet'); if (!V.sel || !G) return;
    const P = cur(); let h = '';
    if (V.sel.kind === 'obj') {
      const o = P.byId.get(V.sel.id);
      if (!o) { closeSheet(); return; }
      const d = DEFS[o.t];
      h += `<h4><span style="font-size:26px">${d.e}</span> ${d.n}${o.l ? ' ' + '⭐'.repeat(o.l) : ''}<button class="x" data-act="close">✕</button></h4><div class="sub">${esc2(d.d)}</div>`;
      if (d.k === 'ride') {
        const price = ridePrice(P, o), fp = fairPrice(o);
        h += `<div class="tp-bars"><span>Slijtage</span>${barHtml(o.wear / 100, o.wear > 70 ? 'bad' : o.wear > 40 ? 'warn' : '')}<span>Wachtrij</span>${barHtml(o.q.length / 14, o.q.length > 10 ? 'warn' : 'blue')}</div>
          <div class="tp-note">${o.broken ? '🔧 <b>Kapot!</b> Een monteur komt eraan, of repareer snel zelf.' : o.open ? (o.st ? 'Draait nu met ' + o.riders.length + ' gasten' : 'Wacht op bezoekers') : '⛔ Gesloten'} · ${capEff(o)} plekken · spanning ${thrEff(o).toFixed(1).replace('.', ',')} · ${fmtN(o.cyc)} ritten · verdiend ${money(o.inc)}</div>
          <div class="tp-row" style="margin-top:8px"><div class="tx"><b>Kaartje: ${fmtMs(price)}</b><span>Eerlijk ${fmtMs(fp)} · geldt voor alle ${esc2(d.n)}</span></div><div class="tp-sp"><button class="tp-b" data-act="rp-:${o.t}">−</button><button class="tp-b" data-act="rp+:${o.t}">+</button></div></div>
          <div class="tp-acts">
            ${o.l < 3 ? `<button class="tp-b pri ${G.money < upgradeCost(o) ? 'off' : ''}" data-act="up">⬆️ Upgrade <small>${money(upgradeCost(o))}</small></button>` : '<span class="tp-badge g">Maximaal niveau</span>'}
            ${(o.broken || o.wear > 30) ? `<button class="tp-b ok ${G.money < repairCost(o) ? 'off' : ''}" data-act="repair">🔧 Repareer <small>${money(repairCost(o))}</small></button>` : ''}
            <button class="tp-b" data-act="toggle">${o.open ? '⛔ Sluiten' : '✅ Openen'}</button>
            <button class="tp-b" data-act="sell">🧨 Verkopen <small>+${money(sellValue(G, o))}</small></button></div>`;
      } else {
        h += `<div class="tp-note">${d.k === 'food' || d.k === 'shop' ? `Prijs ${fmtMs(d.pr)} · verdiend ${money(o.inc)}` : d.k === 'lab' ? 'Levert onderzoekspunten op.' : d.bty ? `Maakt het park mooier (+${d.bty}).` : ''}${hasAccess(P, o.t, o.x, o.y) ? '' : ' ⚠️ Niet bereikbaar: leg een weg ernaast.'}</div>
          <div class="tp-acts"><button class="tp-b" data-act="sell">🧨 Verkopen <small>+${money(sellValue(G, o))}</small></button></div>`;
      }
    } else {
      const g = P.guests.find((x) => x.id === V.sel.id);
      if (!g) { closeSheet(); return; }
      const mood = g.hap > 0.75 ? '😄' : g.hap > 0.5 ? '🙂' : g.hap > 0.3 ? '😐' : '😞';
      h += `<h4><span style="font-size:26px">${mood}</span> ${['Kindje', 'Tiener', 'Bezoeker', 'Opa/oma'][g.kind]}${g.vip ? ' · VIP' : ''}<button class="x" data-act="close">✕</button></h4><div class="sub">Zakgeld ${money(g.wal)} · houdt van ${g.pref > 6 ? 'spannende' : g.pref > 3.5 ? 'gewone' : 'rustige'} attracties</div>
        <div class="tp-bars"><span>Blij</span>${barHtml(g.hap, g.hap < 0.35 ? 'bad' : g.hap < 0.6 ? 'warn' : '')}<span>Honger</span>${barHtml(g.hun, g.hun > 0.7 ? 'bad' : g.hun > 0.5 ? 'warn' : 'blue')}<span>Dorst</span>${barHtml(g.thi, g.thi > 0.7 ? 'bad' : g.thi > 0.5 ? 'warn' : 'blue')}<span>Plas</span>${barHtml(g.bla, g.bla > 0.7 ? 'bad' : g.bla > 0.5 ? 'warn' : 'blue')}</div>
        <div class="tp-note">${g.unmet ? 'Mist: ' + ({ wc: 'toiletten 🚻', hun: 'eten 🍔', thi: 'drinken 🥤', bench: 'een bankje 🪑' }[g.unmet] || '') : 'Alles goed!'} · ${g.rides} ritjes gemaakt</div>`;
    }
    sh.innerHTML = h;
  }
  function syncDrawerOpen() { vq('drawer').classList.toggle('on', V.buildOpen); const b = q('[data-act="build"]'); if (b) b.classList.toggle('on', V.buildOpen || !!V.tool); if (V.buildOpen) { closeSheetKeep(); renderDrawer(); } updateHint(); layoutFloat(); }
  function closeSheetKeep() { if (V.sel) { V.sel = null; vq('sheet').classList.remove('on'); } }
  function itemCard(id) {
    const d = DEFS[id], lock = !isUnlocked(G, id), cost = buildCost(G, id), poor = !lock && G.money < cost;
    const sel = V.tool && V.tool.k === 'place' && V.tool.id === id;
    return `<button class="tp-it ${sel ? 'sel' : ''} ${lock ? 'lock' : ''} ${poor ? 'poor' : ''}" data-act="pick:${id}" data-hint="item-${id}"><b>${lock ? '🔒' : d.e}</b><span>${d.n}</span><em>${lock ? '🔬 ' + fmtN(d.rp) : money(cost)}</em></button>`;
  }
  function renderDrawer() {
    const dr = vq('drawer'); if (!G) return;
    const cats = [['tools', '🛤️', 'Wegen']].concat(CATS.map((c) => [c[0], c[1], c[2]]));
    let items = '';
    if (V.cat === 'tools') {
      const rc = Math.max(1, Math.round(ROAD_COST * buildMult(G)));
      items = `<button class="tp-it ${V.tool && V.tool.k === 'road' ? 'sel' : ''}" data-act="tool:road" data-hint="item-road"><b>🛤️</b><span>Weg leggen</span><em>${money(rc)} /stuk</em></button>
        <button class="tp-it ${V.tool && V.tool.k === 'dozer' ? 'sel' : ''}" data-act="tool:dozer"><b>🧨</b><span>Slopen</span><em>krijg geld terug</em></button>
        <button class="tp-it ${!V.tool ? 'sel' : ''}" data-act="tool:hand"><b>✋</b><span>Kijken</span><em>tik op dingen</em></button>`;
    } else {
      const cat = CATS.find((c) => c[0] === V.cat);
      items = cat[3].map(itemCard).join('');
    }
    const keep = dr.querySelector('.tp-items'), sl = keep ? keep.scrollLeft : 0;
    dr.innerHTML = `<div class="tp-cats">${cats.map((c) => `<button class="tp-cat ${V.cat === c[0] ? 'on' : ''}" data-act="cat:${c[0]}" data-hint="cat-${c[0]}">${c[1]} ${c[2]}</button>`).join('')}</div><div class="tp-items">${items}</div>`;
    const ni = dr.querySelector('.tp-items'); if (ni && sl) ni.scrollLeft = sl;
    applyHint();
  }
  function renderConf() {
    const c = vq('conf'); if (!c) return;
    const t = V.tool, gh = V.ghost;
    if (t && t.k === 'place' && !t.paint) {
      const cost = buildCost(G, t.id);
      c.classList.add('on');
      c.innerHTML = `<button class="tp-b red" data-act="pcancel">✕</button><button class="tp-b" data-act="pspot">🪄 Zoek plek</button><button class="tp-b ok ${gh && gh.ok ? '' : 'off'}" data-act="pok" data-hint="pok">✔ Zet neer · ${money(cost)}</button>`;
      c.style.bottom = V.buildOpen ? '150px' : '12px';
    } else { c.classList.remove('on'); c.innerHTML = ''; }
  }
  function updateHint() {
    const h = vq('hint'), t = V.tool;
    let m = '';
    if (t && t.k === 'road') m = 'Sleep over de kaart om weg te leggen';
    else if (t && t.k === 'dozer') m = 'Tik of sleep om te slopen';
    else if (t && t.k === 'place') m = t.paint ? 'Tik of sleep om neer te zetten' : (V.ghost ? (V.ghost.why ? V.ghost.why : (V.ghost.access ? 'Tik ✔ om te bouwen' : '⚠️ Geen weg ernaast')) : 'Tik op de kaart waar het moet komen');
    h.hidden = !m || !!(t && t.k === 'place' && !t.paint);
    h.textContent = m ? m + ' · tik hier om te stoppen ✕' : '';
    h.style.bottom = V.buildOpen ? '140px' : '12px';
  }

  /* ---------- tutorial ---------- */
  const TUT = [
    { t: 'Welkom in je pretpark! 🎡', d: 'Je hebt een poort en wat geld. Bezoekers komen al binnen! Tik op 🔨 om te gaan bouwen.', ok: () => V.buildOpen || G.tut > 0, hint: 'build' },
    { t: 'Leg een weg 🛤️', d: 'Kies "Weg leggen" en sleep over de kaart: leg minstens 6 stukjes extra weg, ook een zijpad. Daarlangs bouw je straks.', ok: () => roadsBuilt(G) >= 12, hint: 'item-road' },
    { t: 'Bouw een attractie 🎢', d: 'Open 🎢 Attracties, kies Theekopjes of Draaimolen en sleep naast de weg. Tik dan ✔.', ok: () => rideCount(G) >= 1, hint: 'cat-rides' },
    { t: 'Eten & drinken 🍦', d: 'Bezoekers krijgen honger en dorst. Zet een IJskraam of Drinkkraam naast de weg.', ok: () => objCount(G, ['food']) >= 1, hint: 'cat-food' },
    { t: 'Tik op een bezoeker 💰', d: 'Tik op een bezoekertje: je krijgt een fooi! Tik ook op rommel op de weg om het op te ruimen.', ok: () => G.st.tips >= 1, hint: 'build' },
    { t: 'Doelen & beloningen 🏆', d: 'Bij Doelen staan missies met beloningen. Tik op Doelen en haal je eerste beloning op!', ok: () => Object.keys(G.goals).length >= 1, hint: 'tab-goals' },
    { t: 'Je bent een echte parkdirecteur! 🌟', d: 'Bouw verder: toiletten, personeel, onderzoek, nieuwe attracties. Veel plezier!', ok: () => true, hint: '', last: true },
  ];
  let hintCur = '';
  function applyHint() {
    root.querySelectorAll('.tp-pulse').forEach((e) => e.classList.remove('tp-pulse'));
    if (!hintCur) return;
    const e = root.querySelector(`[data-hint="${hintCur}"]`); if (e) e.classList.add('tp-pulse');
  }
  function updateTutorial() {
    const el = vq('tut'); if (!el || !G) return;
    if (G.tut >= 99 || V.tutSkip) { el.hidden = true; hintCur = ''; applyHint(); return; }
    let guard = 0;
    const done = (k) => k < TUT.length - 1 && (TUT[k].ok() || done(k + 1));
    while (G.tut < TUT.length - 1 && done(G.tut) && guard++ < 8) { G.tut++; sfx('up'); markDirty(); }
    if (G.tut >= TUT.length - 1) { G.tut = 99; markDirty(); el.hidden = true; hintCur = ''; applyHint(); toast('🌟 Uitleg klaar! Veel plezier met je park.', 'gold'); return; }
    const i = G.tut, s = TUT[i];
    el.hidden = V.tab !== 'park';
    const html = `<b>${s.t}</b><p>${s.d}</p><a data-act="tutskip">Uitleg overslaan</a>`;
    if (V.shown.tutHtml !== html) { V.shown.tutHtml = html; el.innerHTML = html; }
    const op = V.buildOpen, placing = V.tool && V.tool.k === 'place' && !V.tool.paint;
    const by = (cat, item) => (!op ? 'build' : V.cat !== cat ? 'cat-' + cat : item);
    if (i === 0) hintCur = 'build';
    else if (i === 1) hintCur = V.tool && V.tool.k === 'road' ? '' : by('tools', 'item-road');
    else if (i === 2) hintCur = placing ? 'pok' : by('rides', 'item-theekopjes');
    else if (i === 3) hintCur = placing ? 'pok' : by('food', 'item-ijskraam');
    else if (i === 4) hintCur = op ? 'build' : '';
    else hintCur = V.tab === 'park' ? 'tab-goals' : '';
    applyHint();
  }

  /* ---------- modal ---------- */
  function showModal(html) { const m = vq('modal'); m.innerHTML = `<div class="tp-mbox">${html}</div>`; m.hidden = false; m.style.display = 'flex'; }
  function hideModal() { const m = vq('modal'); m.hidden = true; m.style.display = 'none'; m.innerHTML = ''; }

  /* ---------- HUD en panelen ---------- */
  function setText(el, t) { if (el && el.textContent !== t) el.textContent = t; }
  function updateHUD(force) {
    if (!G) return;
    const P = cur();
    setText(vq('money'), money(G.money));
    setText(vq('rate'), V.incEma >= 1 ? ' +' + fmtN(V.incEma) + '/s' : '');
    setText(vq('stars'), P.rs.toFixed(1).replace('.', ','));
    setText(vq('guests'), String(P.guests.length));
    const wx = weatherOf(P, G);
    setText(vq('env'), `${WX_ICONS[wx]} ${clockText(G)} · ${dateText(G, P)}`);
    setText(vq('spd'), '×' + G.set.spd);
    const pc = vq('parkchip'); if (pc) { pc.style.display = G.parks.length > 1 ? '' : 'none'; setText(pc, `${PARKS[P.i].e} ${PARKS[P.i].n} ▾`); }
    const mb = q('[data-act="mus"]'); if (mb) mb.textContent = G.set.mus ? '🎵' : '🔇';
    const ds = dailyState(G);
    const db_ = vq('dailybtn'); if (db_) db_.style.display = ds.can ? '' : 'none';
    // nav-bolletjes
    const gr = goalsReady(G) + (ds.can ? 1 : 0);
    const set = (k, n) => { const e = q(`[data-dot="${k}"]`); if (e) { e.hidden = !n; e.textContent = String(n); } };
    set('goals', gr);
    let rn = 0; for (const r of researchList()) if (!G.res[r.id] && G.rp >= r.rp) rn++;
    set('research', rn);
    // evenement
    const ev = vq('ev');
    if (G.ev && G.ev.until > G.t) {
      const id = G.ev.id + G.ev.until;
      if (V.evId !== id) { V.evId = id; ev.innerHTML = `<div class="em">${G.ev.e}</div><div><b>${esc2(G.ev.t)}</b><span>${esc2(G.ev.d)}</span></div>${G.ev.claim ? `<button data-act="evclaim">${esc2(G.ev.btn || 'Ophalen')}</button>` : ''}`; }
      ev.hidden = V.tab !== 'park';
      if (G.tut < 99 && !V.tutSkip) ev.hidden = true;
    } else { ev.hidden = true; V.evId = null; }
  }
  function renderPanel(tab, force) {
    const el = q(`[data-s="${tab}"]`); if (!el || !G) return;
    const P = cur(); let h = '';
    if (tab === 'manage') h = tplManage(G, P, V.hist); else if (tab === 'research') h = tplResearch(G); else if (tab === 'goals') h = tplGoals(G, Date.now()); else if (tab === 'more') h = tplMore(G, V);
    if (V.panelSig[tab] === h && !force) return;
    V.panelSig[tab] = h;
    const st = el.scrollTop;
    el.innerHTML = h; el.scrollTop = st;
  }
  function setTab(t) {
    V.tab = t;
    root.querySelectorAll('.tp-scr').forEach((e) => e.classList.toggle('on', e.dataset.s === t));
    root.querySelectorAll('.tp-nav button').forEach((b) => b.classList.toggle('on', b.dataset.act === 'tab:' + t));
    if (t !== 'park') { renderPanel(t, true); } else { resize(); }
    updateHUD(true); updateTutorial(); sfx('click');
  }

  /* ---------- acties ---------- */
  function afterAction() { markDirty(); updateHUD(true); if (V.tab !== 'park') renderPanel(V.tab, true); if (V.sel) renderSheet(); if (V.buildOpen) renderDrawer(); }
  function switchPark(i) {
    const idx = G.parks.findIndex((p) => p.i === i); if (idx < 0) return;
    G.cur = idx; const P = cur();
    if (!P.guests.length) populate(G, P, 0.6);
    V.ground = null; V.gkey = ''; V.rkey = ''; closeSheet(); setTool(null);
    centerOn(P.gx, P.n - 6, 0.7); toast(`${PARKS[P.i].e} ${PARKS[P.i].n}`);
    afterAction();
  }
  function onAct(act, el) {
    A.start();
    const [a, b, c2] = act.split(':');
    const P = G ? cur() : null;
    switch (a) {
      case 'tab': setTab(b); break;
      case 'goto-manage': setTab('manage'); break;
      case 'build': V.buildOpen = !V.buildOpen; syncDrawerOpen(); sfx('click'); updateTutorial(); break;
      case 'cat': V.cat = b; renderDrawer(); sfx('click'); updateTutorial(); break;
      case 'tool': if (b === 'road') setTool({ k: 'road' }); else if (b === 'dozer') setTool({ k: 'dozer' }); else setTool(null); V.buildOpen = false; syncDrawerOpen(); sfx('click'); updateTutorial(); break;
      case 'pick': {
        const d = DEFS[b];
        if (!isUnlocked(G, b)) { toast(`🔒 Eerst onderzoeken in 🔬 (${fmtN(d.rp)} punten)`, 'bad'); sfx('err'); break; }
        const paint = d.w === 1 && d.h === 1 && ['decor', 'bench', 'bin'].includes(d.k);
        setTool({ k: 'place', id: b, paint }); sfx('click');
        if (!paint) { const w = s2w(V.W / 2, V.H * 0.38), t = w2t(w[0], w[1]); setGhost(Math.floor(t[0]) - Math.floor((d.w - 1) / 2), Math.floor(t[1]) - Math.floor((d.h - 1) / 2)); }
        V.buildOpen = false; syncDrawerOpen(); updateHint(); renderConf(); updateTutorial(); break;
      }
      case 'pok': tryPlace(); updateTutorial(); break;
      case 'pcancel': setTool(null); break;
      case 'pspot': {
        const t = V.tool; if (!t || t.k !== 'place') break;
        const sp = findSpot(P, t.id, [P.gx, P.n - 4]);
        if (!sp) { toast('Geen vrije plek naast de weg gevonden. Leg meer weg of breid uit.', 'bad'); sfx('err'); break; }
        setGhost(sp.x, sp.y); const w = t2w(sp.x + DEFS[t.id].w / 2, sp.y + DEFS[t.id].h / 2); V.cam.x += (w[0] - V.cam.x) * 0.6; V.cam.y += (w[1] - V.cam.y) * 0.6; clampCam(); sfx('click'); break;
      }
      case 'close': closeSheet(); break;
      case 'center': centerOn(P.gx, P.n - 7, 0.7); break;
      case 'zoom+': V.cam.z *= 1.25; clampCam(); break;
      case 'zoom-': V.cam.z /= 1.25; clampCam(); break;
      case 'speed': G.set.spd = G.set.spd === 1 ? 2 : G.set.spd === 2 ? 4 : 1; sfx('click'); afterAction(); break;
      case 'sfx': G.set.sfx = G.set.sfx ? 0 : 1; if (G.set.sfx) A.play('click'); afterAction(); break;
      case 'mus': G.set.mus = G.set.mus ? 0 : 1; A.setMus(!!G.set.mus); afterAction(); break;
      case 'nextpark': { const k = (G.cur + 1) % G.parks.length; switchPark(G.parks[k].i); break; }
      case 'park': switchPark(+b); setTab('park'); break;
      case 'expand': { const Q = G.parks.find((p) => p.i === +b); if (Q && expandPark(G, Q)) { sfx('fan'); toast('🗺️ Je park is groter geworden!', 'good'); V.ground = null; V.gkey = ''; V.rkey = ''; if (Q === P) centerOn(P.gx, P.n - 7); afterAction(); } else sfx('err'); break; }
      case 'unlock': if (unlockPark(G, +b)) { sfx('fan'); toast(`🎉 ${PARKS[+b].n} geopend!`, 'gold'); switchPark(+b); setTab('park'); } else sfx('err'); break;
      case 'entry-': setEntry(P, P.entry - Math.max(1, Math.round(P.entry * 0.1))); afterAction(); break;
      case 'entry+': setEntry(P, P.entry + Math.max(1, Math.round(P.entry * 0.1))); afterAction(); break;
      case 'entry-auto': P.auto = !P.auto; if (P.auto) P.entry = autoEntry(P); afterAction(); break;
      case 'hire': if (hire(G, P, b)) { sfx('place'); afterAction(); } else sfx('err'); break;
      case 'fire': if (fire(G, P, b)) afterAction(); break;
      case 'camp': { const cm = CAMPAIGNS.find((x) => x.id === b); if (cm && startCampaign(G, P, cm)) { sfx('fan'); toast(`${cm.e} ${cm.n} gestart!`, 'good'); afterAction(); } else sfx('err'); break; }
      case 'rp-': case 'rp+': {
        const d = DEFS[b], cur0 = P.prices[b] != null ? P.prices[b] : d.pr, st = stepOf(cur0);
        const nv = Math.round((cur0 + (a === 'rp+' ? st : -st)) * 10) / 10;
        P.prices[b] = clamp(nv, 0, d.pr * 4); sfx('click'); afterAction(); break;
      }
      case 'res': { const id = c2 ? b + ':' + c2 : b; if (buyResearch(G, id)) { sfx('up'); toast('🔬 Ontdekt!', 'good'); afterAction(); } else sfx('err'); break; }
      case 'goal': if (claimGoal(G, b)) { sfx('fan'); const gl = GOALS.find((x) => x.id === b); toast(`🏆 ${esc2(gl.t)} · +${money(goalReward(G, gl))}`, 'gold'); afterAction(); updateTutorial(); } break;
      case 'claimall': { let n = 0, tot = 0; for (const g of GOALS) if (!G.goals[g.id] && goalState(G, g).done) { const rw = goalReward(G, g); if (claimGoal(G, g.id)) { n++; tot += rw; } } if (n) { sfx('fan'); toast(`🏆 ${n} doelen · +${money(tot)}`, 'gold'); afterAction(); updateTutorial(); } break; }
      case 'daily': case 'daily-btn': {
        const r = claimDaily(G);
        if (r) { sfx('fan'); showModal(`<div class="big">🎁</div><h3>Dagelijkse beloning!</h3><p>Je krijgt <b>${money(r.m)}</b> en <b>${fmtN(r.rp)}</b> 🔬${r.tk ? ' en een gouden ticket 🎟️!' : '.'}</p><p class="tp-note">Reeks: ${G.daily.streak} dagen. Kom morgen terug voor meer!</p><button class="tp-b pri" data-act="mclose" style="margin-top:8px">Top!</button>`); afterAction(); }
        else if (a === 'daily-btn') setTab('goals');
        break;
      }
      case 'egoal': if (claimEndless(G)) { sfx('fan'); toast('♾️ Mijlpaal gehaald!', 'gold'); afterAction(); } break;
      case 'mclose': hideModal(); break;
      case 'evclaim': if (claimEvent(G)) { sfx('fan'); toast('🎉 Beloning opgehaald!', 'gold'); afterAction(); } break;
      case 'up': { const o = P.byId.get(V.sel && V.sel.id); if (o && upgradeRide(G, P, o)) { sfx('up'); burst(o.x + DEFS[o.t].w / 2, o.y + DEFS[o.t].h / 2, 14); afterAction(); } else sfx('err'); break; }
      case 'repair': { const o = P.byId.get(V.sel && V.sel.id); if (o && repairRide(G, P, o)) { sfx('fixed'); afterAction(); } else sfx('err'); break; }
      case 'toggle': { const o = P.byId.get(V.sel && V.sel.id); if (o) { o.open = !o.open; recomputeValue(P); sfx('click'); afterAction(); } break; }
      case 'sell': { const o = P.byId.get(V.sel && V.sel.id); if (o) { const gain = removeObj(G, P, o); sfx('coin'); toast(`${DEFS[o.t].n} verkocht · +${money(gain)}`); closeSheet(); afterAction(); } break; }
      case 'franchise': {
        const gain = franchiseGain(G);
        showModal(`<div class="big">🎉</div><h3>Nieuwe franchise?</h3><p>Je begint opnieuw met één klein park en krijgt <b>${gain} 🎟️</b>. Je houdt je voordelen, prestaties en tickets.</p><p class="tp-note">Geld, parken en onderzoek van nu gaan weg.</p><div class="tp-acts" style="justify-content:center"><button class="tp-b" data-act="mclose">Nog niet</button><button class="tp-b pri" data-act="franchise-go">Ja, nieuw begin!</button></div>`);
        break;
      }
      case 'franchise-go': { if (startFranchise(G)) { hideModal(); sfx('fan'); V.ground = null; V.gkey = ''; V.rkey = ''; closeSheet(); setTool(null); V.buildOpen = false; syncDrawerOpen(); const P2 = cur(); P2.guests = []; populate(G, P2, 0.1); centerOn(P2.gx, P2.n - 7, 0.7); setTab('park'); toast('🎟️ Nieuwe franchise gestart! Koop voordelen bij Meer.', 'gold'); flushSave(false); afterAction(); } break; }
      case 'fb': if (buyFranchise(G, b)) { sfx('up'); afterAction(); } else sfx('err'); break;
      case 'tutorial': G.tut = 0; V.tutSkip = false; setTab('park'); updateTutorial(); afterAction(); break;
      case 'tutskip': V.tutSkip = true; G.tut = 99; updateTutorial(); markDirty(); break;
      case 'reset': {
        if (!V.resetArmed || Date.now() - V.resetArmed > 4000) { V.resetArmed = Date.now(); afterAction(); timers.push(setTimeout(() => { V.resetArmed = 0; if (alive && V.tab === 'more') renderPanel('more', true); }, 4200)); }
        else { V.resetArmed = 0; const g2 = newGame(uid); g2.tut = 0; G = g2; G.parks[0].guests = []; V.ground = null; V.gkey = ''; V.rkey = ''; closeSheet(); setTool(null); V.buildOpen = false; syncDrawerOpen(); centerOn(G.parks[0].gx, G.parks[0].n - 7, 0.7); setTab('park'); flushSave(false); V.tutSkip = false; toast('Nieuw spel gestart'); }
        break;
      }
      default: break;
    }
  }
  on(root, 'click', (e) => {
    const t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!t || !root.contains(t) || !G) return;
    e.preventDefault();
    onAct(t.getAttribute('data-act'), t);
  });
  on(root, 'pointerdown', () => { V.pdown = true; });
  on(window, 'pointerup', () => { V.pdown = false; });
  on(window, 'pointercancel', () => { V.pdown = false; });

  /* ---------- invoer op de kaart ---------- */
  const ptrs = new Map();
  let pinch = null, downInfo = null;
  on(canvas, 'pointerdown', (e) => {
    if (!G) return;
    A.start();
    try { canvas.setPointerCapture(e.pointerId); } catch (er) { /* niet nodig */ }
    const r = canvas.getBoundingClientRect(), p = { x: e.clientX - r.left, y: e.clientY - r.top, sx: e.clientX - r.left, sy: e.clientY - r.top, t: performance.now(), btn: e.button, touch: e.pointerType !== 'mouse' };
    ptrs.set(e.pointerId, p);
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: V.cam.z, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; downInfo = null; }
    else { downInfo = { moved: false, tool: V.tool ? V.tool.k : '', right: e.button === 2 || e.button === 1 }; V.lastPaint = null; }
    V.hoverTouch = p.touch;
  });
  on(canvas, 'pointermove', (e) => {
    if (!G) return;
    const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const p = ptrs.get(e.pointerId);
    if (!p) { // muis zweeft
      if (V.tool && V.tool.k === 'place' && !V.tool.paint && e.pointerType === 'mouse') ghostAt(x, y, false);
      return;
    }
    const dx = x - p.x, dy = y - p.y; p.x = x; p.y = y;
    if (ptrs.size >= 2 && pinch) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const before = s2w(pinch.mx, pinch.my);
      V.cam.z = clamp(pinch.z * d / Math.max(10, pinch.d), 0.32, 2.6);
      const after = s2w(mx, my);
      V.cam.x += before[0] - after[0]; V.cam.y += before[1] - after[1];
      clampCam(); return;
    }
    if (!downInfo) return;
    if (Math.hypot(x - p.sx, y - p.sy) > 7) downInfo.moved = true;
    const tl = V.tool;
    const paintMode = tl && !downInfo.right && (tl.k === 'road' || tl.k === 'dozer' || (tl.k === 'place' && tl.paint));
    if (paintMode) {
      if (downInfo.moved || true) { const w = s2w(x, y), t = w2t(w[0], w[1]); paintLine(Math.floor(t[0]), Math.floor(t[1])); }
    } else if (tl && tl.k === 'place' && !tl.paint && !downInfo.right) {
      if (downInfo.moved) ghostAt(x, y, p.touch);
    } else if (downInfo.moved) {
      V.cam.x -= dx / V.cam.z; V.cam.y -= dy / V.cam.z; clampCam();
    }
  });
  const up = (e) => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (downInfo && !downInfo.moved && ptrs.size === 0 && performance.now() - p.t < 600 && e.type !== 'pointercancel' && !downInfo.right) handleTap(p.x, p.y, p.touch);
    if (ptrs.size === 0) { downInfo = null; V.lastPaint = null; if (V.tool && V.tool.k === 'place') updateHint(); }
  };
  on(canvas, 'pointerup', up); on(canvas, 'pointercancel', up);
  on(canvas, 'contextmenu', (e) => e.preventDefault());
  on(canvas, 'wheel', (e) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const before = s2w(x, y);
    V.cam.z = clamp(V.cam.z * Math.exp(-e.deltaY * 0.0015), 0.32, 2.6);
    const after = s2w(x, y);
    V.cam.x += before[0] - after[0]; V.cam.y += before[1] - after[1]; clampCam();
  }, { passive: false });
  on(window, 'keydown', (e) => {
    if (!G || V.tab !== 'park' || e.target.tagName === 'INPUT') return;
    const k = e.key.toLowerCase(), st = 60 / V.cam.z;
    if (k === 'arrowleft' || k === 'a') V.cam.x -= st; else if (k === 'arrowright' || k === 'd') V.cam.x += st;
    else if (k === 'arrowup' || k === 'w') V.cam.y -= st; else if (k === 'arrowdown' || k === 's') V.cam.y += st;
    else if (k === '+' || k === '=') V.cam.z *= 1.15; else if (k === '-') V.cam.z /= 1.15;
    else if (k === 'escape') { if (V.tool) setTool(null); else if (V.sel) closeSheet(); else if (V.buildOpen) { V.buildOpen = false; syncDrawerOpen(); } }
    else if (k === 'b') { V.buildOpen = !V.buildOpen; syncDrawerOpen(); }
    else if (k === 'enter') { if (V.tool && V.tool.k === 'place' && !V.tool.paint) tryPlace(); }
    else return;
    clampCam(); e.preventDefault();
  });

  /* ---------- simulatie-lus ---------- */
  function gap(sec) {
    // lange pauze (scherm uit, tabblad op de achtergrond): verdien een schatting
    const now = Date.now(); G.saved = now - sec * 1000;
    const r = applyOffline(G, now);
    if (r) {
      const P = cur(); P.guests = []; populate(G, P, 0.7);
      if (r.away > 120) showModal(`<div class="big">👋</div><h3>Welkom terug!</h3><p>Je was ${hm(r.away)} weg.</p><p>Je park verdiende <b>${money(r.gain)}</b> en <b>${fmtN(r.rpGain)}</b> 🔬 onderzoekspunten.</p><button class="tp-b pri" data-act="mclose" style="margin-top:8px">Top!</button>`);
      sfx('bell'); markDirty();
    }
  }
  function handleFx() {
    const P = cur();
    for (const e of P.fx) {
      if (e.k === 'coin') {
        if (e.v >= 1 && V.parts.length < 50) { const w = t2w(e.x, e.y); floatText(w[0], w[1] - 26, '+' + fmtMs(e.v), '#ffd23f'); }
        sfx('coin');
      } else if (e.k === 'scream') {
        const o = e.o; if (!o) continue; const d = DEFS[o.t], w = t2w(o.x + d.w / 2, o.y + d.h / 2);
        V.parts.push({ x: w[0] + (Math.random() - 0.5) * 30, y: w[1] - objHeight(o) - 14, vx: 0, vy: -14, life: 1.4, max: 1.4, kind: 'text', txt: ['AAAH!', 'WIEEE!', 'JIEHA!', '🙌', 'HELP!'][Math.floor(Math.random() * 5)], col: '#fff', size: 12, stroke: '#e63946' });
        sfx('scream');
      } else if (e.k === 'break') { toast(`🔧 ${DEFS[e.o.t].n} is stuk!`, 'bad'); sfx('break'); }
      else if (e.k === 'fixed') { sfx('fixed'); burst(e.o.x + DEFS[e.o.t].w / 2, e.o.y + DEFS[e.o.t].h / 2, 8, '#8ac926'); }
      else if (e.k === 'start') { if (DEFS[e.o.t].thr >= 6) sfx('whoosh'); if (e.o.t === 'waterglijbaan') sfx('splash'); }
    }
    P.fx.length = 0;
    for (const e of G.fx) {
      if (e.k === 'msg') toast(e.e + ' ' + e.tx, e.kind);
      else if (e.k === 'event') { sfx('bell'); }
      else if (e.k === 'ach') { sfx('fan'); toast(`${e.a.e} Prestatie: ${esc2(e.a.t)}${e.a.tk ? ' · +' + e.a.tk + ' 🎟️' : ''}`, 'gold'); markDirty(); }
    }
    G.fx.length = 0;
  }
  function animateRides(dt) {
    const P = cur();
    for (const o of P.rides) {
      const base = { theekopjes: 1.7, draaimolen: 1.3, botsauto: 1.5, reuzenrad: 0.32, piratenschip: 1.0, draakentrein: 1 }[o.t] || 1;
      const tgt = runOf(o) ? base : (o.t === 'reuzenrad' ? 0.04 : 0.15 * base * (o.t === 'draaimolen' ? 0.8 : 0.5));
      o._v = (o._v == null ? tgt : o._v) + (tgt - (o._v == null ? tgt : o._v)) * Math.min(1, dt * 2.2);
      o._a = (o._a || 0) + o._v * dt;
    }
  }
  function advance(now) {
    if (!G) return;
    if (!V.last) V.last = now;
    let dt = (now - V.last) / 1000; V.last = now;
    if (!view.isConnected) return;
    if (dt <= 0) return;
    if (dt > 20) { gap(dt); dt = 0.05; }
    V.acc += Math.min(dt, document.hidden ? 5 : 0.5) * G.set.spd;
    let n = 0;
    while (V.acc >= STEP && n < 48) { tick(G, STEP); V.acc -= STEP; n++; }
    if (n === 48) V.acc = 0;
    handleFx();
    animateRides(Math.min(dt, 0.1));
    // inkomen-gemiddelde
    V.lastEarnT += dt;
    if (V.lastEarnT >= 1) { const d = (G.earnedAll - V.lastEarn) / V.lastEarnT; V.incEma = V.incEma ? V.incEma * 0.7 + d * 0.3 : d; V.lastEarn = G.earnedAll; V.lastEarnT = 0; V.histN = (V.histN || 0) + 1; if (V.histN % 10 === 0) { V.hist.push(Math.round(V.incEma)); if (V.hist.length > 60) V.hist.shift(); } }
    // deeltjes
    for (let i = V.parts.length - 1; i >= 0; i--) { const p = V.parts[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.kind === 'dot') p.vy += 160 * dt; if (p.life <= 0) V.parts.splice(i, 1); }
  }

  /* ---------- tekenen ---------- */
  const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function draw(now) {
    const P = cur(), c = canvas.getContext('2d', { alpha: false }); if (!c) return;
    const T = now / 1000, n = P.n, z = V.cam.z, dpr = V.dpr, W = V.W, H = V.H;
    const season = seasonOf(P, G), theme = PARKS[P.i].theme, night = nightFactor(G), wx = weatherOf(P, G);
    ENV = { T, night, season, theme, wx };
    LIGHTS = [];
    const gk = groundKey(G, P);
    if (!V.ground || V.gkey !== gk) { V.ground = buildGround(P, G, mkCanvas); V.gkey = gk; V.rkey = ''; }
    const rk = roadKey(G, P);
    if (!V.roadsC || V.rkey !== rk) { V.roadsC = buildRoads(P, G, mkCanvas); V.rkey = rk; }
    // achtergrond
    const th = THEMES[theme];
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, th.out[0]); bg.addColorStop(1, th.out[1]);
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    if (theme === 'beach') { c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; for (let i = 0; i < 12; i++) { const y = (i / 12 * H + T * 6) % H; c.beginPath(); for (let x = 0; x <= W; x += 20) c.lineTo(x, y + Math.sin(x * 0.05 + T + i) * 4); c.stroke(); } }
    c.setTransform(dpr * z, 0, 0, dpr * z, dpr * (W / 2 - V.cam.x * z), dpr * (H / 2 - V.cam.y * z));
    C = c;
    const g0 = V.ground;
    c.drawImage(g0.cv, g0.minX, g0.minY, g0.cv.width / g0.gs, g0.cv.height / g0.gs);
    const r0 = V.roadsC; c.drawImage(r0.cv, r0.minX, r0.minY, r0.cv.width / r0.gs, r0.cv.height / r0.gs);
    // zichtbaar gebied (wereldcoordinaten)
    const vx0 = V.cam.x - W / 2 / z - 160, vx1 = V.cam.x + W / 2 / z + 160, vy0 = V.cam.y - H / 2 / z - 220, vy1 = V.cam.y + H / 2 / z + 120;
    const vis = (x, y) => { const sx = X(x, y), sy = Y(x, y); return sx > vx0 && sx < vx1 && sy > vy0 && sy < vy1; };
    // raster als je bouwt
    if (V.tool) {
      c.beginPath();
      for (let i = 0; i <= n; i++) { c.moveTo(X(i, 0), Y(i, 0)); c.lineTo(X(i, n), Y(i, n)); c.moveTo(X(0, i), Y(0, i)); c.lineTo(X(n, i), Y(n, i)); }
      c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1; c.stroke();
    }
    // rommel
    for (let i = 0; i < P.litter.length; i++) {
      if (!P.litter[i]) continue; const x = i % n, y = (i - x) / n; if (!vis(x, y)) continue;
      const hx = ((i * 37) % 7) / 10, hy = ((i * 53) % 7) / 10;
      c.fillStyle = '#fff'; c.fillRect(X(x + 0.3 + hx * 0.4, y + 0.3 + hy * 0.4), Y(x + 0.3 + hx * 0.4, y + 0.3 + hy * 0.4) - 1, 3, 2);
      c.fillStyle = '#c0392b'; c.fillRect(X(x + 0.55, y + 0.5), Y(x + 0.55, y + 0.5), 2.5, 2.5);
      if (P.litter[i] > 1) { c.fillStyle = '#7f8c8d'; c.fillRect(X(x + 0.4, y + 0.7), Y(x + 0.4, y + 0.7), 3, 2); }
    }
    // doel-markering ghost voetafdruk
    if (V.tool && V.tool.k === 'place' && V.ghost) {
      const d = DEFS[V.tool.id], gh = V.ghost;
      const col = gh.ok ? 'rgba(34,197,94,.5)' : 'rgba(239,68,68,.5)';
      for (let yy = 0; yy < d.h; yy++) for (let xx = 0; xx < d.w; xx++) { const x = gh.x + xx, y = gh.y + yy; fpoly([X(x, y), Y(x, y), X(x + 1, y), Y(x + 1, y), X(x + 1, y + 1), Y(x + 1, y + 1), X(x, y + 1), Y(x, y + 1)], col); }
    }
    // tekenlijst
    const list = [];
    for (const o of P.objs) { const d = DEFS[o.t]; if (!vis(o.x + d.w / 2, o.y + d.h / 2)) continue; list.push([o.x + o.y + (d.w + d.h) / 2, 0, o]); }
    for (const g of P.guests) { if (g.st === RIDE) continue; if (!vis(g.x, g.y)) continue; list.push([g.x + g.y + 0.001, 1, g]); }
    for (const w of P.walkers) { if (vis(w.x, w.y)) list.push([w.x + w.y + 0.002, 2, w]); }
    list.push([P.gx + P.n + 0.3, 3, null]);
    list.sort((a, b) => a[0] - b[0]);
    // wachtrijen: kleine verschuiving per plek
    const qpos = new Map();
    for (const o of P.rides) o.q.forEach((g, i) => qpos.set(g.id, [((i % 3) - 1) * 0.16, -Math.floor(i / 3) * 0.1 - 0.05]));
    const selId = V.sel ? V.sel.id : -1;
    for (const [, kind, it] of list) {
      if (kind === 0) {
        drawObject(c, it, it._a || 0);
        if (V.sel && V.sel.kind === 'obj' && V.sel.id === it.id) { const d = DEFS[it.t]; c.strokeStyle = '#ffd23f'; c.lineWidth = 2.5; c.setLineDash([6, 4]); c.lineDashOffset = -T * 12; fpoly([X(it.x, it.y), Y(it.x, it.y), X(it.x + d.w, it.y), Y(it.x + d.w, it.y), X(it.x + d.w, it.y + d.h), Y(it.x + d.w, it.y + d.h), X(it.x, it.y + d.h), Y(it.x, it.y + d.h)], null, '#ffd23f', 2.5); c.setLineDash([]); }
        if (DEFS[it.t].k !== 'decor' && !reachable(P, it)) { const d = DEFS[it.t]; const wob = Math.sin(T * 4) * 2; c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(X(it.x + d.w / 2, it.y + d.h / 2), Y(it.x + d.w / 2, it.y + d.h / 2, objHeight(it) + 30) + wob, 11, 0, 6.2832); c.fill(); text('🚫', X(it.x + d.w / 2, it.y + d.h / 2), Y(it.x + d.w / 2, it.y + d.h / 2, objHeight(it) + 30) + wob, 14); }
      } else if (kind === 1) drawGuest(c, it, T, V.sel && V.sel.kind === 'guest' && V.sel.id === it.id, qpos.get(it.id));
      else if (kind === 2) drawWalker(c, it, T);
      else drawGate(c, P);
    }
    // ghost-gebouw
    if (V.tool && V.tool.k === 'place' && V.ghost && !V.tool.paint) {
      const d = DEFS[V.tool.id]; c.globalAlpha = 0.72;
      const go = { id: 999, t: V.tool.id, x: V.ghost.x, y: V.ghost.y, l: 0, st: 0, q: [], riders: [], broken: false, open: true, tm: 0, wear: 0 };
      drawObject(c, go, T * 1.2); c.globalAlpha = 1;
      if (!V.ghost.access && d.k !== 'decor') text('⚠️', X(V.ghost.x + d.w / 2, V.ghost.y + d.h / 2), Y(V.ghost.x + d.w / 2, V.ghost.y + d.h / 2, objHeight(go) + 34), 18);
    } else if (V.tool && V.tool.k === 'place' && V.tool.paint && V.ghost == null) { /* niets */ }
    // deeltjes
    for (const p of V.parts) {
      const a = clamp(p.life / (p.max * 0.5), 0, 1);
      if (p.kind === 'dot') { c.globalAlpha = a; c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, p.size, 0, 6.2832); c.fill(); c.globalAlpha = 1; }
      else {
        c.globalAlpha = a; c.font = 'bold 13px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        if (p.stroke) { c.lineWidth = 3; c.strokeStyle = p.stroke; c.strokeText(p.txt, p.x, p.y); } else { c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.45)'; c.strokeText(p.txt, p.x, p.y); }
        c.fillStyle = p.col; c.fillText(p.txt, p.x, p.y); c.globalAlpha = 1;
      }
    }
    // dag/nacht en weer in schermruimte
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (night > 0.04) {
      c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgb(${255 - night * 190 | 0},${255 - night * 170 | 0},${255 - night * 80 | 0})`; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';
      if (night > 0.12) {
        c.globalCompositeOperation = 'lighter';
        for (const L of LIGHTS) { const sx = (L[0] - V.cam.x) * z + W / 2, sy = (L[1] - V.cam.y) * z + H / 2, r = L[2] * z; if (sx < -r || sx > W + r || sy < -r || sy > H + r) continue; const gr = c.createRadialGradient(sx, sy, 0, sx, sy, r); gr.addColorStop(0, `rgba(${L[3]},${0.55 * night})`); gr.addColorStop(1, `rgba(${L[3]},0)`); c.fillStyle = gr; c.fillRect(sx - r, sy - r, r * 2, r * 2); }
        c.globalCompositeOperation = 'source-over';
      }
    }
    if (P.fw) {
      if (Math.random() < 0.03 && V.fw.length < 6) { V.fw.push({ x: W * (0.15 + Math.random() * 0.7), y: H * (0.1 + Math.random() * 0.3), t: 0, col: ['255,90,120', '255,210,70', '90,200,255', '150,255,140', '210,130,255'][Math.floor(Math.random() * 5)] }); sfx('pop'); }
    }
    for (let i = V.fw.length - 1; i >= 0; i--) {
      const f = V.fw[i]; f.t += 1 / 60; if (f.t > 1.6) { V.fw.splice(i, 1); continue; }
      const r = 10 + f.t * 55, a = clamp(1.4 - f.t, 0, 1);
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(${f.col},${a})`; c.lineWidth = 2; c.lineCap = 'round';
      c.beginPath(); for (let k = 0; k < 16; k++) { const an = k / 16 * 6.2832; c.moveTo(f.x + Math.cos(an) * r * 0.55, f.y + Math.sin(an) * r * 0.55 + f.t * f.t * 14); c.lineTo(f.x + Math.cos(an) * r, f.y + Math.sin(an) * r + f.t * f.t * 14); } c.stroke();
      c.globalCompositeOperation = 'source-over';
    }
    if (wx === 2 || wx === 1) { c.fillStyle = wx === 2 ? 'rgba(40,60,90,.18)' : 'rgba(60,70,90,.08)'; c.fillRect(0, 0, W, H); }
    if (wx === 2) { c.strokeStyle = 'rgba(190,215,245,.7)'; c.lineWidth = 1.2; c.beginPath(); for (const r of V.rain) { const x = ((r[0] * W + T * 40 * r[2]) % (W + 20)) - 10, y = ((r[1] * H + T * 520 * r[2]) % (H + 20)) - 10; c.moveTo(x, y); c.lineTo(x - 3, y + 11); } c.stroke(); }
    if (wx === 3) { c.fillStyle = 'rgba(255,255,255,.9)'; for (const r of V.rain) { const x = ((r[0] * W + Math.sin(T * 0.8 + r[1] * 9) * 14 + T * 8) % (W + 20)) - 10, y = ((r[1] * H + T * 50 * r[2]) % (H + 20)) - 10; c.beginPath(); c.arc(x, y, 1.3 + r[2] * 0.9, 0, 6.2832); c.fill(); } }
    if (wx === 0 || wx === 4) { const gr = c.createRadialGradient(W * 0.85, -20, 10, W * 0.85, -20, H * 0.9); gr.addColorStop(0, wx === 4 ? 'rgba(255,170,60,.28)' : 'rgba(255,240,170,.22)'); gr.addColorStop(1, 'rgba(255,240,170,0)'); c.fillStyle = gr; c.fillRect(0, 0, W, H); }
  }

  function frame(now) {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    advance(now);
    if (V.tab === 'park' && !document.hidden && view.isConnected) {
      try { draw(now); } catch (e) { if (!V.drawErr) { V.drawErr = 1; console.error(e); } }
    }
  }

  /* ---------- seconde-timer: HUD, panelen, opslaan ---------- */
  function slow() {
    if (!alive || !G) return;
    if (!view.isConnected) return;
    { const r = canvas.getBoundingClientRect(); if (Math.abs(r.width - V.W) > 1 || Math.abs(r.height - V.H) > 1) { if (r.width > 50) { resize(); clampCam(); } } }
    updateHUD();
    updateTutorial();
    if (V.tab !== 'park' && !V.pdown) renderPanel(V.tab);
    if (V.sel && !V.pdown) renderSheet();
    if (V.tool && V.tool.k === 'place' && !V.tool.paint && V.ghost && !V.pdown) { const gh = V.ghost, okNow = !canPlace(cur(), V.tool.id, gh.x, gh.y) && G.money >= buildCost(G, V.tool.id); if (okNow !== gh.ok) setGhost(gh.x, gh.y); }
    if (V.buildOpen && !V.pdown) { const dr = vq('drawer'); if (dr) { const cards = dr.querySelectorAll('.tp-it'); /* kleur "te duur" bijwerken */ if ((V.tickN = (V.tickN || 0) + 1) % 2 === 0) renderDrawer(); } }
    if (Date.now() - V.lastLocal > 20000) { V.dirty = true; V.dc = true; }
    if (V.dirty && Date.now() - V.lastLocal > 2500) { saveLocal(); V.dirty = false; }
    if (Date.now() - V.lastCloud > 60000 && V.dc) { saveCloud(false); }
    if (!V.dailyShown && G.tut >= 99 && dailyState(G).can) { V.dailyShown = true; toast('🎁 Je dagelijkse beloning staat klaar!', 'gold'); }
  }

  /* ---------- starten ---------- */
  async function start() {
    let g;
    try { g = await loadAll(); } catch (e) { g = newGame(uid); }
    if (!alive) return;
    G = g;
    const off = applyOffline(G, Date.now());
    const P = cur();
    if (!G._fresh) populate(G, P, 0.75);
    if (G.tut < 99 && G.st.visitors > 20) { G.tut = 99; }
    resize();
    centerOn(P.gx, P.n - 7, V.W < 500 ? 0.68 : 0.9);
    fitMargin();
    A.sfx = !!G.set.sfx; A.mus = !!G.set.mus;
    hideModal();
    renderDrawer(); updateHUD(true); updateTutorial();
    V.last = performance.now(); V.lastEarn = G.earnedAll;
    if (off) showModal(`<div class="big">👋</div><h3>Welkom terug!</h3><p>Je was ${hm(off.away)} weg.</p><p>Je park verdiende <b>${money(off.gain)}</b> en <b>${fmtN(off.rpGain)}</b> 🔬 onderzoekspunten.</p><p class="tp-note">Offline verdien je ${Math.round(off.eff * 100)}% van wat je park normaal oplevert.</p><button class="tp-b pri" data-act="mclose" style="margin-top:8px">Top!</button>`);
    raf = requestAnimationFrame(frame);
    timers.push(setInterval(slow, 1000));
    timers.push(setInterval(() => { if (document.hidden) advance(performance.now()); }, 1000));
    saveLocal();
  }
  on(window, 'resize', () => { if (G) { resize(); clampCam(); } });
  on(document, 'visibilitychange', () => { if (G && document.hidden) flushSave(false); });
  on(window, 'pagehide', () => { if (G) flushSave(true); });
  A.setMus(true);
  start();

  addCleanup(() => {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(raf);
    for (const t of timers) { clearTimeout(t); clearInterval(t); }
    for (const [t, ev, fn, opt] of listeners) { try { t.removeEventListener(ev, fn, opt); } catch (e) { /* weg */ } }
    if (G) { saveLocal(); saveCloud(true); }
    A.destroy();
    try { css.remove(); root.remove(); } catch (e) { /* weg */ }
  });
  return { G: () => G, V, advance, draw, onAct, setTab, A };
}
