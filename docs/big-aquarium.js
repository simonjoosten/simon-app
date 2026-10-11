// Aquarium Tycoon: bouw en beheer een rustig, mooi publiek aquarium.
// Opslag: local-first (localStorage `big:aquarium:${uid}`) + Firestore gamesaves/big-aquarium__{uid} (max. 1x per 60 s en bij sluiten).
// Pure spellogica staat bovenaan (zonder DOM) zodat ze in node te testen is.
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

/* =====================================================================
   1. DATA
   ===================================================================== */
export const VERSION = 1;
const MAX_DATA = 18000;
export const OFFLINE_MAX = 8 * 3600;      // seconden
const CLOUD_EVERY = 60000;
const BREED_SECS = 90;                    // gemiddeld per tank met een paar
const PRESTIGE_UNIT = 3e8;                // run-verdienste per "parel-eenheid"
export const MAX_TANKS = 10;

let RNG = Math.random;
export function setRng(f) { RNG = f; }

export const TT = {
  zoet: { n: 'Zoetwater', e: '🐟', build: 150, mult: 1, sky: ['#c9f1f0', '#5fb8c9', '#1f7a94'], sand: '#e6d6a3' },
  zout: { n: 'Zoutwater', e: '🌊', build: 1500, mult: 2.5, sky: ['#b5e3ff', '#3d8fd6', '#154c8f'], sand: '#e9dcb0' },
  rif: { n: 'Koraalrif', e: '🪸', build: 15000, mult: 6, sky: ['#b9fff0', '#2fc4c4', '#10799c'], sand: '#f4e8c4' },
  haai: { n: 'Haaienbassin', e: '🦈', build: 150000, mult: 15, sky: ['#8fc3ea', '#2a68ad', '#0c2a5c'], sand: '#cdbf98' },
  ping: { n: 'Pinguïnverblijf', e: '🐧', build: 1500000, mult: 30, sky: ['#cfeaff', '#4aa0d8', '#1a5a96'], sand: '#dfe9f2' },
};
export const TT_KEYS = Object.keys(TT);
export const RAR = ['Algemeen', 'Ongewoon', 'Zeldzaam', 'Legendarisch'];

// [id, naam, habitat, tekenaar, kleuren, opties]
// opties: p patroon, sz plekken, price, rar, xo (alleen expeditie), beh gedrag, sc tekenschaal, e emoji, f weetje
const RAW = [
  ['guppy', 'Guppy', 'zoet', 'fish', ['#ff9f5a', '#ffd36b', '#fff0cf'], { p: 'tailspot', sz: 1, price: 10, beh: 'school', sc: 0.8, e: '🐟', f: 'Guppy\'s krijgen levende jongen in plaats van eitjes.' }],
  ['tetra', 'Neon tetra', 'zoet', 'fish', ['#4fc3f7', '#ff4d6d', '#e6f7ff'], { p: 'neon', sz: 1, price: 30, beh: 'school', sc: 0.75, e: '🐠', f: 'De blauwe streep glanst, zo vinden ze elkaar in donker water.' }],
  ['goudvis', 'Goudvis', 'zoet', 'fish', ['#ff8a3d', '#ff6a2a', '#ffd9a0'], { p: 'veil', sz: 1, price: 80, beh: 'roam', sc: 1, e: '🐠', f: 'Een goudvis kan meer dan twintig jaar oud worden.' }],
  ['zebra', 'Zebravis', 'zoet', 'fish', ['#dfe7ee', '#2b3a55', '#ffffff'], { p: 'stripes', sz: 1, price: 150, beh: 'school', sc: 0.85, e: '🐟', f: 'Zebravisjes zwemmen het liefst in een grote groep.' }],
  ['kemp', 'Kempvis', 'zoet', 'fish', ['#d6336c', '#7b2cbf', '#ffb3c7'], { p: 'veil', sz: 1, price: 300, beh: 'shy', sc: 1, e: '🐠', f: 'De kempvis ademt lucht aan het oppervlak.' }],
  ['discus', 'Discusvis', 'zoet', 'disc', ['#ff9a3c', '#2aa198', '#ffe0a3'], { p: 'bands', sz: 2, price: 700, beh: 'curious', sc: 1.1, e: '🐠', f: 'Discusvissen voeden hun jongen met slijm van hun huid.' }],
  ['axolotl', 'Axolotl', 'zoet', 'axolotl', ['#ffb6c8', '#ff7aa2', '#fff0f4'], { sz: 2, price: 2500, rar: 1, xo: 1, beh: 'floor', sc: 1, e: '🦎', f: 'Een axolotl kan zelfs een poot weer aan laten groeien.' }],
  ['zrog', 'Zoetwaterrog', 'zoet', 'ray', ['#8a6d4b', '#c9a97a', '#f1e2c4'], { p: 'spots', sz: 3, price: 8000, rar: 2, xo: 1, beh: 'cruise', sc: 1.1, e: '🐟', f: 'Deze rog woont in rivieren en glijdt over de bodem.' }],
  ['aal', 'Elektrische aal', 'zoet', 'eel', ['#4b5d3a', '#9bb36b', '#ffd23f'], { p: 'glow', sz: 3, price: 20000, rar: 2, xo: 1, beh: 'cruise', sc: 1.2, e: '🐍', f: 'Eigenlijk is het geen aal, en hij kan een lampje laten flitsen.' }],
  ['arowana', 'Draakvis', 'zoet', 'fish', ['#e5b94a', '#c58a1d', '#fff1b8'], { p: 'scales', sz: 3, price: 50000, rar: 2, xo: 1, beh: 'cruise', sc: 1.3, h: 0.3, e: '🐉', f: 'In China brengt de draakvis volgens de verhalen geluk.' }],
  ['koi', 'Gouden koi', 'zoet', 'fish', ['#ffcf33', '#ff9d00', '#fff3b0'], { p: 'koi', sz: 3, price: 200000, rar: 3, xo: 1, beh: 'curious', sc: 1.3, e: '✨', f: 'Een gouden koi hoort bij de allermooiste vijvers.' }],

  ['zeester', 'Zeester', 'zout', 'star', ['#ff7a59', '#ffb199', '#ffe2d6'], { sz: 1, price: 120, beh: 'floor', sc: 0.9, e: '⭐', f: 'Een zeester heeft ogen aan de punten van zijn armen.' }],
  ['krab', 'Krab', 'zout', 'crab', ['#e8553d', '#ff8a6b', '#ffd1c2'], { sz: 1, price: 200, beh: 'floor', sc: 0.9, e: '🦀', f: 'Krabben lopen opzij omdat hun poten zo zijn gebouwd.' }],
  ['egel', 'Zee-egel', 'zout', 'urchin', ['#5b3a8c', '#8e63c9', '#d7c3f5'], { sz: 1, price: 350, beh: 'floor', sc: 0.9, e: '🟣', f: 'Zijn mond zit aan de onderkant, met vijf tandjes.' }],
  ['zeepaard', 'Zeepaardje', 'zout', 'seahorse', ['#ffc23d', '#ff8f1f', '#fff0b3'], { sz: 1, price: 600, beh: 'hover', sc: 1, e: '🐴', f: 'Bij het zeepaardje zorgt papa voor de eitjes.' }],
  ['kogel', 'Kogelvis', 'zout', 'puffer', ['#e3c767', '#8d7a2b', '#fff6cf'], { sz: 1, price: 1200, beh: 'curious', sc: 1, e: '🐡', f: 'Bij schrik pompt hij zich op tot een bal.' }],
  ['kwal', 'Kwal', 'zout', 'jelly', ['#c9a7ff', '#8a6bff', '#efe3ff'], { sz: 2, price: 2500, beh: 'hover', sc: 1.1, e: '🪼', f: 'Een kwal bestaat voor het grootste deel uit water.' }],
  ['kreeft', 'Blauwe kreeft', 'zout', 'lobster', ['#3f5fbf', '#7f9dff', '#cfdcff'], { sz: 2, price: 4000, beh: 'floor', sc: 1.1, e: '🦞', f: 'Een blauwe kreeft is heel zeldzaam in de zee.' }],
  ['murene', 'Murene', 'zout', 'eel', ['#6a7d3a', '#c7d36b', '#2b3517'], { p: 'mottle', sz: 2, price: 7000, beh: 'shy', sc: 1.1, e: '🐍', f: 'Een murene gaapt om water langs zijn kieuwen te pompen.' }],
  ['octopus', 'Octopus', 'zout', 'octo', ['#e5575f', '#ff9aa0', '#ffd5d8'], { sz: 2, price: 15000, beh: 'curious', sc: 1.1, e: '🐙', f: 'Een octopus heeft drie harten en kan zijn kleur veranderen.' }],
  ['schildpad', 'Zeeschildpad', 'zout', 'turtle', ['#5aa05a', '#a6d48f', '#d7b56d'], { sz: 3, price: 30000, beh: 'cruise', sc: 1.3, e: '🐢', f: 'Zeeschildpadden keren terug naar het strand waar ze geboren zijn.' }],
  ['lantaarn', 'Lantaarnvis', 'zout', 'fish', ['#2a2b4a', '#ffe66d', '#5d5fa8'], { p: 'angler', sz: 3, price: 250000, rar: 3, xo: 1, beh: 'hover', sc: 1.2, e: '🔦', f: 'Diep in de zee lokt hij prooien met een eigen lampje.' }],

  ['clown', 'Clownvis', 'rif', 'fish', ['#ff7a1a', '#ffffff', '#ffb066'], { p: 'clown', sz: 1, price: 800, beh: 'curious', sc: 0.85, e: '🐠', f: 'Clownvissen wonen veilig tussen de netelige zeeanemoon.' }],
  ['mandarijn', 'Mandarijnvis', 'rif', 'fish', ['#2b79d9', '#ff8a1f', '#58e0b8'], { p: 'mandarin', sz: 1, price: 1500, beh: 'shy', sc: 0.85, e: '🐠', f: 'Zijn kleurige huid is eigenlijk slijm, niet geschubd.' }],
  ['vlinder', 'Vlindervis', 'rif', 'disc', ['#ffe14d', '#2b2b2b', '#fffbe0'], { p: 'butterfly', sz: 1, price: 3000, beh: 'roam', sc: 0.9, e: '🐠', f: 'Een nepoog bij de staart verwart roofvissen.' }],
  ['dokter', 'Blauwe doktersvis', 'rif', 'disc', ['#2f6fe0', '#ffd93b', '#8fb8ff'], { p: 'tang', sz: 1, price: 6000, beh: 'school', sc: 1, e: '🐠', f: 'Bekend van Dory: ze zwemmen graag in groepjes.' }],
  ['keizer', 'Keizersvis', 'rif', 'disc', ['#2d5fb5', '#ffcf3f', '#9fd3ff'], { p: 'stripes_y', sz: 2, price: 12000, beh: 'roam', sc: 1.15, e: '🐠', f: 'Jonge keizersvissen hebben heel andere kleuren dan oude.' }],
  ['duivel', 'Koraalduivel', 'rif', 'fish', ['#c9302c', '#6e1411', '#fff1e6'], { p: 'lion', sz: 2, price: 25000, beh: 'roam', sc: 1.1, e: '🐟', f: 'Zijn lange vinnen zijn mooi, maar je kijkt het best van een afstand.' }],
  ['napoleon', 'Napoleonvis', 'rif', 'fish', ['#2fb7b3', '#1c6b73', '#9bece6'], { p: 'hump', sz: 4, price: 60000, rar: 2, xo: 1, beh: 'cruise', sc: 1.5, h: 0.5, e: '🐟', f: 'Hij heeft een bult op zijn hoofd en dikke lippen.' }],
  ['nautilus', 'Nautilus', 'rif', 'nautilus', ['#f4e6d0', '#d9863a', '#fff6e8'], { sz: 2, price: 120000, rar: 2, xo: 1, beh: 'hover', sc: 1.1, e: '🐚', f: 'Het schelpkamertje dat hij bouwt, werkt als een duikboot.' }],
  ['lichtkwal', 'Lichtkwal', 'rif', 'jelly', ['#6ee7ff', '#3b82f6', '#d8f8ff'], { p: 'glow', sz: 3, price: 280000, rar: 3, xo: 1, beh: 'hover', sc: 1.5, e: '💠', f: 'Sommige kwallen geven in het donker een zacht licht af.' }],

  ['zandtijger', 'Zandtijgerhaai', 'haai', 'shark', ['#8b9aa6', '#5d6b76', '#e8eef2'], { sz: 4, price: 20000, beh: 'cruise', sc: 1.4, e: '🦈', f: 'Ondanks de grote tanden is deze haai vrij rustig.' }],
  ['hamer', 'Hamerhaai', 'haai', 'shark', ['#7c8794', '#566370', '#e6ecf0'], { p: 'hammer', sz: 6, price: 70000, beh: 'cruise', sc: 1.5, e: '🦈', f: 'Zijn brede kop werkt als een radar voor prooien.' }],
  ['manta', 'Mantarog', 'haai', 'ray', ['#2b3550', '#1b2238', '#f2f6fa'], { p: 'manta', sz: 6, price: 140000, beh: 'cruise', sc: 1.9, e: '🪽', f: 'Een mantarog kan wel zeven meter breed worden.' }],
  ['zaagvis', 'Zaagvis', 'haai', 'shark', ['#8a8f7a', '#5e624f', '#e5e7dc'], { p: 'saw', sz: 6, price: 350000, rar: 2, xo: 1, beh: 'cruise', sc: 1.6, e: '🪚', f: 'Met zijn lange snuit schudt hij kleine visjes los.' }],
  ['walvishaai', 'Walvishaai', 'haai', 'shark', ['#4b6a8a', '#35506d', '#e9f1f6'], { p: 'whale', sz: 10, price: 1500000, rar: 3, xo: 1, beh: 'cruise', sc: 2.1, h: 0.5, e: '🐋', f: 'De grootste vis ter wereld eet alleen piepkleine hapjes.' }],

  ['adelie', 'Adéliepinguïn', 'ping', 'penguin', ['#1f2433', '#ffffff', '#ff9a3d'], { sz: 2, price: 70000, beh: 'ping', sc: 1, e: '🐧', f: 'Adéliepinguïns geven elkaar een steentje als cadeautje.' }],
  ['ezel', 'Ezelspinguïn', 'ping', 'penguin', ['#222a3a', '#ffffff', '#ff8a2a'], { p: 'gentoo', sz: 2, price: 110000, beh: 'ping', sc: 1.05, e: '🐧', f: 'Hij is de snelste zwemmer onder de pinguïns.' }],
  ['keizerp', 'Keizerspinguïn', 'ping', 'penguin', ['#1d2333', '#fffaf0', '#ffc83d'], { p: 'emperor', sz: 3, price: 200000, beh: 'ping', sc: 1.3, e: '🐧', f: 'Papa houdt het ei warm op zijn voeten.' }],
  ['kuif', 'Rotspinguïn', 'ping', 'penguin', ['#1f2433', '#ffffff', '#ffd23f'], { p: 'rockhopper', sz: 2, price: 300000, beh: 'ping', sc: 1, e: '🐧', f: 'Hij hupt met twee voetjes tegelijk over de rotsen.' }],
  ['zeehond', 'Zeehond', 'ping', 'seal', ['#8d99a6', '#4d5762', '#d3dae0'], { sz: 4, price: 480000, beh: 'ping', sc: 1.4, e: '🦭', f: 'Een zeehond kan lang zijn adem inhouden onder water.' }],
  ['narwal', 'Narwal', 'ping', 'narwal', ['#9fb2c6', '#4f6479', '#e8eff6'], { sz: 8, price: 3000000, rar: 3, xo: 1, beh: 'cruise', sc: 1.9, e: '🦄', f: 'De spiraalslagtand is in werkelijkheid een lange tand.' }],
];
export const SP = RAW.map(([id, n, hab, art, cols, o]) => ({
  id, n, hab, art, cols, p: o.p || '', sz: o.sz, price: o.price, rar: o.rar || 0, xo: !!o.xo, beh: o.beh, sc: o.sc, h: o.h || 0, e: o.e, f: o.f,
  ap: Math.max(1, Math.round(Math.pow(o.price, 0.7) / 5.01 * 10) / 10),
}));
export const SPM = Object.fromEntries(SP.map((s) => [s.id, s]));
export const SHOP = (hab) => SP.filter((s) => s.hab === hab && !s.xo);

export const DECO = {
  plant: { n: 'Waterplanten', e: '🌿', base: 60, b: 0.06, not: ['ping'] },
  rots: { n: 'Rotsen', e: '🪨', base: 150, b: 0.08, not: [] },
  koraal: { n: 'Koraal', e: '🪸', base: 400, b: 0.10, only: ['zout', 'rif', 'haai'] },
  ijs: { n: 'Ijsberg', e: '🧊', base: 500, b: 0.12, only: ['ping'] },
  kasteel: { n: 'Kasteeltje', e: '🏰', base: 600, b: 0.12, only: ['zoet', 'zout', 'rif'] },
  kist: { n: 'Schatkist', e: '💰', base: 1500, b: 0.14, not: ['ping'] },
  sneeuw: { n: 'Sneeuwpop', e: '⛄', base: 1500, b: 0.10, only: ['ping'] },
  lamp: { n: 'Lichtsnoer', e: '💡', base: 2500, b: 0.15, not: [] },
  igloo: { n: 'Iglo', e: '🛖', base: 3000, b: 0.18, only: ['ping'] },
  wrak: { n: 'Scheepswrak', e: '🚢', base: 5000, b: 0.20, only: ['zout', 'rif', 'haai'] },
  tunnel: { n: 'Glazen tunnel', e: '🫧', base: 20000, b: 0.25, not: [] },
};
export const decoOk = (id, hab) => { const d = DECO[id]; return d && (!d.only || d.only.includes(hab)) && (!d.not || !d.not.includes(hab)); };

export const UP = {
  ticket: { n: 'Toegangsprijs', e: '🎟️', g: 'inc', d: 'Meer munten per bezoeker', base: 20, gr: 1.9, max: 60 },
  shop: { n: 'Souvenirwinkel', e: '🛍️', g: 'inc', d: 'Bezoekers kopen knuffels en kaarten', base: 300, gr: 2.0, max: 40 },
  cafe: { n: 'Café', e: '☕', g: 'inc', d: 'Warme chocolademelk en poffertjes', base: 2000, gr: 2.1, max: 40 },
  mk: { n: 'Reclame', e: '📣', g: 'inc', d: '+25% bezoekers per niveau', base: 60, gr: 2.0, max: 40 },
  hal: { n: 'Toegangshal', e: '🚪', g: 'inc', d: 'Ruimte voor meer bezoekers tegelijk', base: 200, gr: 3, max: 20 },
  guide: { n: 'Rondleiders', e: '🧭', g: 'inc', d: '+10% inkomsten per niveau', base: 5000, gr: 2.8, max: 20 },
  filt: { n: 'Filters', e: '🧪', g: 'zorg', d: 'Het water blijft langer schoon', base: 100, gr: 2.5, max: 12 },
  kraam: { n: 'Kraamkamer', e: '🍼', g: 'zorg', d: 'Dieren krijgen sneller jongen', base: 500, gr: 2.5, max: 12 },
  tap: { n: 'Voerschep', e: '🥄', g: 'zorg', d: 'Meer fooi bij het voeren', base: 30, gr: 2.2, max: 15 },
  st_feed: { n: 'Voerder', e: '🧑‍🍳', g: 'staf', d: 'Voert automatisch alle tanks', base: 1500, gr: 1, max: 1 },
  st_clean: { n: 'Schoonmaker', e: '🧽', g: 'staf', d: 'Houdt het water automatisch fris', base: 2500, gr: 1, max: 1 },
  st_vet: { n: 'Dierenarts', e: '🩺', g: 'staf', d: 'Geneest zieke dieren vanzelf', base: 6000, gr: 1, max: 1 },
  sub: { n: 'Onderzeeër', e: '🚤', g: 'reis', d: 'Snellere reizen, meer vondsten, extra plek op 3 en 6', base: 2000, gr: 3.2, max: 10 },
};
export const UP_KEYS = Object.keys(UP);

export const PK = {
  inc: { n: 'Glanzende schelpen', e: '🐚', d: '+10% inkomsten per niveau', max: 20 },
  start: { n: 'Startkapitaal', e: '💰', d: 'Begin elke verhuizing met 4x meer munten', max: 10 },
  breed: { n: 'Warme nestjes', e: '🥚', d: '+15% fokken per niveau', max: 10 },
  exp: { n: 'Zeekaarten', e: '🗺️', d: '-8% reistijd per niveau', max: 8 },
  tips: { n: 'Gouden schepje', e: '✨', d: '+25% fooi bij het voeren', max: 10 },
  off: { n: 'Nachtploeg', e: '🌙', d: '+5% opbrengst als je weg bent', max: 8 },
  keep: { n: 'Vast personeel', e: '🎩', d: 'Je personeel blijft bij verhuizen', max: 1 },
};

export const REGIONS = [
  { id: 'amazone', n: 'Amazone-delta', e: '🌴', cost: 4000, dur: 120, loot: { axolotl: 40, zrog: 30, aal: 20, arowana: 8, koi: 2 } },
  { id: 'rif', n: 'Verre koraalrif', e: '🏝️', cost: 30000, dur: 360, loot: { napoleon: 45, nautilus: 35, mandarijn: 10, lichtkwal: 10 } },
  { id: 'diep', n: 'De diepzee', e: '🌌', cost: 15000, dur: 900, loot: { octopus: 25, murene: 25, schildpad: 25, kreeft: 15, lantaarn: 10 } },
  { id: 'oceaan', n: 'Open oceaan', e: '⛵', cost: 300000, dur: 1800, loot: { hamer: 35, manta: 30, zaagvis: 25, walvishaai: 10 } },
  { id: 'pool', n: 'Poolzee', e: '🧊', cost: 1000000, dur: 3600, loot: { ezel: 25, keizerp: 25, kuif: 20, zeehond: 20, narwal: 10 } },
];
export const REGM = Object.fromEntries(REGIONS.map((r) => [r.id, r]));

/* ---------- doelen en prestaties ---------- */
const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
export const animalsTotal = (s) => s.T.reduce((a, t) => a + sum(t.a), 0);
const speciesOwned = (s) => { const m = {}; s.T.forEach((t) => { for (const k in t.a) if (t.a[k] > 0) m[k] = 1; }); return Object.keys(m).length; };
const upLevels = (s) => UP_KEYS.reduce((a, k) => a + (s.up[k] || 0), 0);
const discN = (s) => Object.keys(s.dc).length;
const discRar = (s, r) => Object.keys(s.dc).filter((k) => SPM[k] && SPM[k].rar >= r).length;
const maxLv = (s) => s.T.reduce((a, t) => Math.max(a, t.l), 0);
const decoN = (s) => s.T.reduce((a, t) => a + t.d.length, 0);
const typesN = (s) => new Set(s.T.map((t) => t.k)).size;

// [id, tekst, waarde(s), doel, beloning, beloning in seconden inkomen]
export const GOALS = [
  ['g1', 'Verdien 50 munten', (s) => s.te, 50, 20, 0],
  ['g2', 'Heb 4 dieren', animalsTotal, 4, 30, 0],
  ['g3', 'Koop een upgrade in het Park', upLevels, 1, 50, 0],
  ['g4', 'Heb 3 soorten', speciesOwned, 3, 60, 0],
  ['g5', 'Voer de vissen 10 keer', (s) => s.st.taps, 10, 40, 0],
  ['g6', 'Zet een decoratie in een tank', decoN, 1, 80, 0],
  ['g7', 'Verwelkom 25 bezoekers', (s) => s.st.vis, 25, 100, 0],
  ['g8', 'Verwelkom je eerste babyvis', (s) => s.st.births, 1, 150, 0],
  ['g9', 'Verdien 1.000 munten', (s) => s.te, 1e3, 200, 30],
  ['g10', 'Bouw een tweede tank', (s) => s.T.length, 2, 400, 30],
  ['g11', 'Start je eerste expeditie', (s) => s.st.exps + s.x.length, 1, 500, 30],
  ['g12', 'Bouw de souvenirwinkel', (s) => s.up.shop, 1, 500, 30],
  ['g13', 'Heb 15 dieren', animalsTotal, 15, 400, 40],
  ['g14', 'Ontdek 8 soorten', discN, 8, 600, 40],
  ['g15', 'Verdien 25.000 munten', (s) => s.te, 25e3, 800, 50],
  ['g16', 'Bouw het café', (s) => s.up.cafe, 1, 1000, 50],
  ['g17', 'Neem een voerder aan', (s) => s.up.st_feed, 1, 1000, 50],
  ['g18', 'Heb 3 tanks', (s) => s.T.length, 3, 2000, 60],
  ['g19', 'Vind een zeldzaam dier', (s) => discRar(s, 2), 1, 3000, 60],
  ['g20', 'Verdien 1 miljoen', (s) => s.te, 1e6, 5000, 60],
  ['g21', 'Heb 40 dieren', animalsTotal, 40, 5000, 60],
  ['g22', 'Ontdek 20 soorten', discN, 20, 8000, 80],
  ['g23', 'Breng een tank naar niveau 5', maxLv, 5, 8000, 80],
  ['g24', 'Heb 5 verschillende soorten tanks', typesN, 5, 20000, 80],
  ['g25', 'Verhuis voor het eerst naar een groter aquarium', (s) => s.st.pres, 1, 20000, 100],
  ['g26', 'Verdien 1 miljard', (s) => s.te, 1e9, 50000, 100],
  ['g27', 'Ontdek 30 soorten', discN, 30, 50000, 100],
  ['g28', 'Heb 100 dieren', animalsTotal, 100, 60000, 100],
  ['g29', 'Vind een legendarisch dier', (s) => discRar(s, 3), 1, 100000, 150],
  ['g30', 'Ontdek alle soorten', discN, SP.length, 300000, 150],
  ['g31', 'Voltooi 10 expedities', (s) => s.st.exps, 10, 100000, 150],
  ['g32', 'Verdien 1 biljoen', (s) => s.te, 1e12, 500000, 200],
];
export const GOALM = Object.fromEntries(GOALS.map((g) => [g[0], g]));

// [id, naam, emoji, waarde(s), doel]; elke prestatie geeft +2% inkomsten
export const ACH = [
  ['a_tap1', 'Voerliefhebber', '🍤', (s) => s.st.taps, 100], ['a_tap2', 'Voerkoning', '👑', (s) => s.st.taps, 1500], ['a_tap3', 'Voerlegende', '🌟', (s) => s.st.taps, 10000],
  ['a_an1', 'Kleine kudde', '🐟', animalsTotal, 10], ['a_an2', 'Hele school', '🐠', animalsTotal, 50], ['a_an3', 'Dierenpark', '🦭', animalsTotal, 200],
  ['a_sp1', 'Verzamelaar', '📖', discN, 10], ['a_sp2', 'Kenner', '🔬', discN, 25], ['a_sp3', 'Encyclopedie compleet', '🏆', discN, SP.length],
  ['a_te1', 'Eerste duizenden', '🪙', (s) => s.te, 1e4], ['a_te2', 'Miljonair', '💰', (s) => s.te, 1e6], ['a_te3', 'Miljardair', '💎', (s) => s.te, 1e9], ['a_te4', 'Biljonair', '🌌', (s) => s.te, 1e12],
  ['a_b1', 'Kraamvisite', '🍼', (s) => s.st.births, 10], ['a_b2', 'Babyboom', '🥚', (s) => s.st.births, 100],
  ['a_x1', 'Ontdekkingsreiziger', '🧭', (s) => s.st.exps, 1], ['a_x2', 'Zeebonk', '⚓', (s) => s.st.exps, 10], ['a_x3', 'Kapitein', '🏴‍☠️', (s) => s.st.exps, 50],
  ['a_t1', 'Drie bassins', '🏗️', (s) => s.T.length, 3], ['a_t2', 'Zes bassins', '🏛️', (s) => s.T.length, 6], ['a_t3', 'Tien bassins', '🌆', (s) => s.T.length, 10],
  ['a_p1', 'Nieuw begin', '🦪', (s) => s.st.pres, 1], ['a_p2', 'Parelduiker', '🤿', (s) => s.st.pres, 5],
  ['a_d1', 'Dagelijkse bezoeker', '📅', (s) => s.dy.best, 7], ['a_dec', 'Binnenhuisarchitect', '🏰', decoN, 10],
  ['a_leg', 'Legendarisch!', '✨', (s) => discRar(s, 3), 1], ['a_v1', 'Drukke dag', '👥', (s) => s.st.vis, 1000], ['a_v2', 'Uitverkocht', '🎟️', (s) => s.st.vis, 100000],
];

/* =====================================================================
   2. STAAT
   ===================================================================== */
export function newTank(k) {
  return { k, l: 1, a: {}, d: [], w: 100, f: 100, s: 0, sk: 0, b: 0 };
}
export function newState(now = Date.now()) {
  const t = newTank('zoet'); t.a.guppy = 2;
  return {
    v: VERSION, at: now, last: now, c: 15, e: 0, te: 0, P: 0, pe: 0, pk: {}, up: {}, T: [t], inv: {}, dc: { guppy: 1 }, ach: {}, gl: {},
    x: [], st: { taps: 0, births: 0, vis: 0, exps: 0, pres: 0, ticks: 0 }, tut: 0, dy: { last: '', streak: 0, best: 0 }, snd: 1, seen: 0,
  };
}
export function migrate(o) {
  if (!o || typeof o !== 'object' || !Array.isArray(o.T) || !o.T.length) return null;
  const n = newState(Date.now());
  const s = { ...n, ...o };
  s.st = { ...n.st, ...(o.st || {}) }; s.dy = { ...n.dy, ...(o.dy || {}) };
  s.pk = o.pk || {}; s.up = o.up || {}; s.inv = o.inv || {}; s.dc = o.dc || {}; s.ach = o.ach || {}; s.gl = o.gl || {}; s.x = Array.isArray(o.x) ? o.x : [];
  s.T = o.T.filter((t) => t && TT[t.k]).map((t) => {
    const b = newTank(t.k);
    const a = {}; for (const k in t.a || {}) if (SPM[k] && t.a[k] > 0) a[k] = Math.floor(t.a[k]);
    return { ...b, ...t, a, d: (t.d || []).filter((d) => DECO[d]) };
  });
  if (!s.T.length) return null;
  for (const k of Object.keys(s.up)) if (!UP[k]) delete s.up[k];
  for (const t of s.T) for (const k in t.a) s.dc[k] = 1;
  for (const k in s.inv) if (!SPM[k]) delete s.inv[k];
  ['c', 'e', 'te', 'P', 'pe'].forEach((k) => { if (!isFinite(s[k])) s[k] = 0; });
  s.v = VERSION;
  return s;
}
export function serialize(s) {
  const r2 = (x) => Math.round(x * 100) / 100;
  const o = {
    ...s, c: r2(s.c), e: r2(s.e), te: r2(s.te),
    T: s.T.map((t) => ({ ...t, w: Math.round(t.w * 10) / 10, f: Math.round(t.f * 10) / 10, sk: Math.round(t.sk), b: Math.round(t.b * 10) / 10 })),
  };
  let str = JSON.stringify(o);
  if (str.length > MAX_DATA) { o.ach = Object.fromEntries(Object.keys(o.ach).map((k) => [k, 1])); str = JSON.stringify(o); }
  return str;
}
export function parseSave(str) {
  try { return migrate(JSON.parse(str)); } catch (e) { return null; }
}

const SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
export function fmt(n) {
  if (!isFinite(n)) return '∞';
  if (n < 0) return '-' + fmt(-n);
  if (n < 1000) return n < 10 ? (Math.round(n * 10) / 10).toString().replace('.', ',') : String(Math.floor(n));
  let i = 0; while (n >= 1000 && i < SUF.length - 1) { n /= 1000; i++; }
  return (n >= 100 ? Math.floor(n) : n >= 10 ? (Math.floor(n * 10) / 10) : (Math.floor(n * 100) / 100)).toString().replace('.', ',') + SUF[i];
}

/* =====================================================================
   3. ECONOMIE
   ===================================================================== */
export const tankUnits = (t) => { let u = 0; for (const k in t.a) u += t.a[k] * SPM[k].sz; return u; };
export const tankCap = (t) => 6 + 3 * (t.l - 1);
export const decoSlots = (t) => Math.min(6, 3 + Math.floor(t.l / 3));
export const MAX_TANK_LV = 10;
export function tankBase(t) {
  let a = 0, kinds = 0;
  for (const k in t.a) if (t.a[k] > 0) { a += t.a[k] * SPM[k].ap; kinds++; }
  const deco = t.d.reduce((x, d) => x + (DECO[d] ? DECO[d].b : 0), 0);
  return a * (1 + deco) * (1 + Math.min(0.5, 0.05 * Math.max(0, kinds - 1)));
}
export function tankFactor(t) {
  const w = t.w >= 50 ? 1 : t.w >= 25 ? 0.85 : 0.7;
  const f = t.f >= 40 ? 1 : t.f >= 15 ? 0.85 : 0.7;
  return w * f * (t.s ? 0.5 : 1);
}
export function multOf(s) {
  const disc = discN(s), ach = Object.keys(s.ach).length;
  return (1 + 0.1 * s.P) * (1 + 0.01 * disc + 0.02 * ach) * (1 + 0.1 * (s.pk.inc || 0));
}
export const pvOf = (s) => {
  const u = s.up;
  let pv = 2 * Math.pow(1.25, u.ticket || 0);
  if (u.shop) pv += 1.2 * Math.pow(1.25, u.shop - 1);
  if (u.cafe) pv += 3 * Math.pow(1.25, u.cafe - 1);
  return pv * (1 + 0.1 * (u.guide || 0));
};
export const hallCap = (s) => 25 * Math.pow(1.45, s.up.hal || 0) / 40;   // bezoekers per seconde zonder drukte
export function economy(s, ideal = false) {
  let A = 0;
  for (const t of s.T) A += tankBase(t) * (ideal ? 1 : tankFactor(t));
  const want = (0.2 + 0.05 * A) * (1 + 0.25 * (s.up.mk || 0));
  const cap = hallCap(s);
  const vps = want <= cap ? want : cap + (want - cap) * 0.25;
  const pv = pvOf(s), M = multOf(s);
  return { A, want, cap, vps, pv, M, ips: vps * pv * M, crowded: want > cap * 1.05 };
}

export function stepTank(s, t, dt, ev) {
  const u = tankUnits(t), fl = s.up.filt || 0;
  t.f = Math.max(0, t.f - dt * 100 / 300);
  t.w = Math.max(0, t.w - dt * (0.08 + 0.007 * u) / (1 + 0.3 * fl));
  if (s.up.st_feed && t.f < 45) t.f = 100;
  if (s.up.st_clean && t.w < 45) t.w = 100;
  if (t.w < 20) t.sk += dt; else t.sk = Math.max(0, t.sk - dt);
  if (t.sk > 60) t.s = 1;
  if (s.up.st_vet && t.s) { t.s = 0; t.sk = 0; t.w = Math.max(t.w, 60); }
  const el = Object.keys(t.a).filter((k) => t.a[k] >= 2);
  if (el.length && t.w >= 40 && t.f >= 25 && !t.s) {
    t.b += dt * (1 + 0.15 * (s.up.kraam || 0)) * (1 + 0.15 * (s.pk.breed || 0));
    while (t.b >= BREED_SECS) { t.b -= BREED_SECS; breedOne(s, t, ev); }
  }
}
export function breedOne(s, t, ev) {
  const el = Object.keys(t.a).filter((k) => t.a[k] >= 2);
  if (!el.length) return null;
  const wts = el.map((k) => 1 / (1 + 2 * SPM[k].rar));
  let r = RNG() * wts.reduce((a, b) => a + b, 0), id = el[0];
  for (let i = 0; i < el.length; i++) { r -= wts[i]; if (r <= 0) { id = el[i]; break; } }
  const sp = SPM[id];
  if (tankUnits(t) + sp.sz <= tankCap(t)) {
    t.a[id]++; s.st.births++; if (ev) ev.push({ t: 'birth', id });
  } else {
    const gain = Math.min(sp.price * 0.1, economy(s).ips * 12); s.c += gain; s.e += gain; s.te += gain; if (ev) ev.push({ t: 'donate', id, gain });
  }
  return id;
}
export function step(s, dt, ev) {
  if (dt <= 0) return;
  for (const t of s.T) stepTank(s, t, dt, ev);
  const e = economy(s);
  const g = e.ips * dt;
  s.c += g; s.e += g; s.te += g;
  s.st.vis += e.vps * dt;
}
// offline voortgang: max 8 uur, mild (dieren worden nooit ziek terwijl je weg bent)
export function offlineEff(s) {
  return Math.min(1, 0.6 + 0.05 * (s.pk.off || 0) + (s.up.st_feed && s.up.st_clean ? 0.2 : 0));
}
export function applyOffline(s, secs, ev) {
  secs = Math.max(0, Math.min(secs, OFFLINE_MAX));
  const e = economy(s, true);
  const gain = e.ips * secs * offlineEff(s);
  s.c += gain; s.e += gain; s.te += gain; s.st.vis += e.vps * secs * 0.5;
  let births = 0; const b0 = s.st.births;
  for (const t of s.T) {
    const u = tankUnits(t);
    t.w = Math.max(Math.min(t.w, 35), t.w - secs * (0.08 + 0.007 * u) / (1 + 0.3 * (s.up.filt || 0)));
    t.f = Math.max(Math.min(t.f, 40), t.f - secs * 100 / 300);
    if (s.up.st_feed) t.f = 100;
    if (s.up.st_clean) t.w = 100;
    t.sk = 0;
    const n = Math.min(60, Math.floor(secs / (BREED_SECS * 2) * (1 + 0.15 * (s.up.kraam || 0)) * (1 + 0.15 * (s.pk.breed || 0))));
    if (!t.s) for (let i = 0; i < n; i++) breedOne(s, t, ev);
  }
  births = s.st.births - b0;
  return { secs, gain, births };
}

/* ---------- kopen en bouwen ---------- */
const ok = (extra) => ({ ok: true, ...(extra || {}) });
const no = (msg) => ({ ok: false, msg });
const spend = (s, c) => { if (s.c < c) return false; s.c -= c; return true; };
export function priceOf(t, id) { return Math.ceil(SPM[id].price * Math.pow(1.1, t.a[id] || 0)); }
export function buyAnimal(s, ti, id) {
  const t = s.T[ti], sp = SPM[id];
  if (!t || !sp || sp.hab !== t.k || sp.xo) return no('Dit dier past hier niet.');
  if (tankUnits(t) + sp.sz > tankCap(t)) return no('Deze tank zit vol, breid hem uit of kies een andere.');
  const p = priceOf(t, id);
  if (!spend(s, p)) return no('Nog te weinig munten.');
  t.a[id] = (t.a[id] || 0) + 1; s.dc[id] = 1;
  return ok({ id, cost: p });
}
export function moveToInv(s, ti, id) {
  const t = s.T[ti];
  if (!t || !(t.a[id] > 0)) return no('Geen dier.');
  if (Object.keys(t.a).filter((k) => t.a[k] > 0).length === 1 && s.T.length === 1 && t.a[id] === 1 && animalsTotal(s) === 1) return no('Houd minstens één dier.');
  t.a[id]--; if (!t.a[id]) delete t.a[id];
  s.inv[id] = (s.inv[id] || 0) + 1;
  return ok();
}
export function placeFromInv(s, ti, id) {
  const t = s.T[ti], sp = SPM[id];
  if (!t || !sp || !(s.inv[id] > 0)) return no('Niet in voorraad.');
  if (sp.hab !== t.k) return no(`Dit dier woont in een ${TT[sp.hab].n.toLowerCase()}-tank.`);
  if (tankUnits(t) + sp.sz > tankCap(t)) return no('Geen ruimte in deze tank.');
  s.inv[id]--; if (!s.inv[id]) delete s.inv[id];
  t.a[id] = (t.a[id] || 0) + 1; s.dc[id] = 1;
  return ok();
}
export function buildCost(s, k) {
  const n = s.T.filter((t) => t.k === k).length;
  return Math.round(TT[k].build * Math.pow(6, n));
}
export function buildTank(s, k) {
  if (!TT[k]) return no('Onbekend.');
  if (s.T.length >= MAX_TANKS) return no('Het aquarium zit vol, meer ruimte is er niet.');
  if (!spend(s, buildCost(s, k))) return no('Nog te weinig munten.');
  s.T.push(newTank(k)); return ok({ index: s.T.length - 1 });
}
export const tankLvCost = (t) => Math.round(TT[t.k].mult * 100 * Math.pow(4.5, t.l));
export function upgradeTank(s, ti) {
  const t = s.T[ti];
  if (!t || t.l >= MAX_TANK_LV) return no('Hoogste niveau bereikt.');
  if (!spend(s, tankLvCost(t))) return no('Nog te weinig munten.');
  t.l++; return ok();
}
export const decoCost = (t, id) => Math.round(DECO[id].base * TT[t.k].mult);
export function buyDeco(s, ti, id) {
  const t = s.T[ti];
  if (!t || !decoOk(id, t.k)) return no('Past hier niet.');
  if (t.d.includes(id)) return no('Staat er al.');
  if (t.d.length >= decoSlots(t)) return no('Geen plek meer, breid de tank uit.');
  if (!spend(s, decoCost(t, id))) return no('Nog te weinig munten.');
  t.d.push(id); return ok();
}
export const upCost = (s, id) => Math.ceil(UP[id].base * Math.pow(UP[id].gr, s.up[id] || 0));
export function buyUp(s, id) {
  const u = UP[id]; if (!u) return no('Onbekend.');
  if ((s.up[id] || 0) >= u.max) return no('Hoogste niveau bereikt.');
  if (!spend(s, upCost(s, id))) return no('Nog te weinig munten.');
  s.up[id] = (s.up[id] || 0) + 1; return ok();
}

/* ---------- zorg ---------- */
export function tapTip(s) {
  const ips = economy(s).ips;
  return (1 + ips * 0.25) * (1 + 0.5 * (s.up.tap || 0)) * (1 + 0.25 * (s.pk.tips || 0));
}
export function feedTank(s, ti) {
  const t = s.T[ti]; if (!t) return 0;
  t.f = Math.min(100, t.f + 12);
  t.w = Math.max(0, t.w - 0.4);
  const tip = tapTip(s);
  s.c += tip; s.e += tip; s.te += tip; s.st.taps++;
  return tip;
}
export function fillFood(s, ti) { const t = s.T[ti]; if (t) t.f = 100; }
export function cleanTank(s, ti) { const t = s.T[ti]; if (!t) return; t.w = 100; if (!t.s) t.sk = 0; }
export function treatCost(s, t) { return Math.ceil(20 + economy(s).ips * 45 * (tankBase(t) / Math.max(1, economy(s, true).A))); }
export function treatTank(s, ti) {
  const t = s.T[ti]; if (!t || !t.s) return no('Deze tank is gezond.');
  if (!spend(s, treatCost(s, t))) return no('Nog te weinig munten voor medicijn.');
  t.s = 0; t.sk = 0; t.w = 100; return ok();
}

/* ---------- expedities ---------- */
export const expSlots = (s) => 1 + ((s.up.sub || 0) >= 3 ? 1 : 0) + ((s.up.sub || 0) >= 6 ? 1 : 0);
export function expDur(s, r) {
  if (s.st.exps === 0 && !s.x.length) return 30;
  return Math.max(15, Math.round(r.dur * (1 - 0.06 * (s.up.sub || 0)) * Math.max(0.3, 1 - 0.08 * (s.pk.exp || 0))));
}
export function startExp(s, rid, now = Date.now()) {
  const r = REGM[rid]; if (!r) return no('Onbekende bestemming.');
  if (s.x.length >= expSlots(s)) return no('Alle schepen zijn onderweg.');
  if (!spend(s, r.cost)) return no('Nog te weinig munten voor de reis.');
  s.x.push({ r: rid, t0: now, t1: now + expDur(s, r) * 1000 });
  return ok();
}
export function rollLoot(s, r) {
  const luck = 1 + 0.1 * (s.up.sub || 0);
  const ents = Object.entries(r.loot).map(([id, w]) => [id, w * (SPM[id].rar >= 2 ? luck : 1)]);
  let x = RNG() * ents.reduce((a, e) => a + e[1], 0);
  for (const [id, w] of ents) { x -= w; if (x <= 0) return id; }
  return ents[0][0];
}
export function collectExp(s, i, now = Date.now()) {
  const x = s.x[i]; if (!x || x.t1 > now) return no('Nog onderweg.');
  const r = REGM[x.r]; s.x.splice(i, 1);
  const n = 1 + (RNG() < 0.05 * (s.up.sub || 0) ? 1 : 0);
  const found = [];
  for (let k = 0; k < n; k++) { const id = rollLoot(s, r); const isNew = !s.dc[id]; s.dc[id] = 1; s.inv[id] = (s.inv[id] || 0) + 1; found.push({ id, isNew }); }
  s.st.exps++;
  return ok({ found, region: r.id });
}

/* ---------- dagelijkse beloning ---------- */
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function dailyInfo(s, now = new Date()) {
  const today = dayKey(now), y = new Date(now.getTime() - 86400000);
  const can = s.dy.last !== today;
  const streak = s.dy.last === dayKey(y) ? s.dy.streak : (can ? 0 : s.dy.streak);
  const next = can ? streak + 1 : s.dy.streak;
  const e = economy(s, true);
  const reward = Math.max(200, e.ips * 900) * (1 + 0.15 * Math.min(Math.max(next, 1) - 1, 6));
  return { can, streak, next, reward, bonus: next % 7 === 0 };
}
export function claimDaily(s, now = new Date()) {
  const d = dailyInfo(s, now); if (!d.can) return no('Vandaag al opgehaald.');
  s.dy.last = dayKey(now); s.dy.streak = d.next; s.dy.best = Math.max(s.dy.best, d.next);
  s.c += d.reward; s.e += d.reward; s.te += d.reward;
  let pet = null;
  if (d.bonus) {
    const cands = SP.filter((p) => !p.xo && p.rar === 0 && s.T.some((t) => t.k === p.hab));
    if (cands.length) { pet = cands[Math.floor(RNG() * cands.length)].id; s.inv[pet] = (s.inv[pet] || 0) + 1; s.dc[pet] = 1; }
  }
  return ok({ reward: d.reward, streak: d.next, pet });
}

/* ---------- doelen en prestaties ---------- */
export function goalReward(s, g) { return Math.round(Math.max(g[4], g[5] ? economy(s, true).ips * g[5] : 0)); }
export function claimGoal(s, id) {
  const g = GOALM[id]; if (!g || s.gl[id]) return no('Al opgehaald.');
  if (g[2](s) < g[3]) return no('Nog niet klaar.');
  const r = goalReward(s, g); s.gl[id] = 1; s.c += r; s.e += r; s.te += r; return ok({ reward: r });
}
export function checkAch(s) {
  const out = [];
  for (const a of ACH) if (!s.ach[a[0]] && a[3](s) >= a[4]) { s.ach[a[0]] = 1; out.push(a); }
  return out;
}

/* ---------- prestige ---------- */
export const prestigeGain = (s) => Math.floor(Math.sqrt(Math.max(0, s.e) / PRESTIGE_UNIT));
export const perkCost = (s, id) => (s.pk[id] || 0) + 1 + (id === 'keep' ? 4 : 0);
export function buyPerk(s, id) {
  const p = PK[id]; if (!p) return no('Onbekend.');
  if ((s.pk[id] || 0) >= p.max) return no('Hoogste niveau bereikt.');
  const c = perkCost(s, id); if (s.pe < c) return no('Te weinig parels.');
  s.pe -= c; s.pk[id] = (s.pk[id] || 0) + 1; return ok();
}
export const startCoins = (s) => 15 * Math.pow(4, s.pk.start || 0);
export function doPrestige(s, now = Date.now()) {
  const g = prestigeGain(s); if (g < 1) return no('Nog te vroeg voor een verhuizing.');
  s.P += g; s.pe += g; s.st.pres++;
  const keepUp = {};
  if (s.pk.keep) ['st_feed', 'st_clean', 'st_vet'].forEach((k) => { if (s.up[k]) keepUp[k] = s.up[k]; });
  const f = newState(now);
  s.up = keepUp; s.T = f.T; s.inv = {}; s.x = []; s.c = startCoins(s); s.e = 0; s.last = now; s.at = now;
  return ok({ gain: g });
}

/* =====================================================================
   4. OPSLAG
   ===================================================================== */

/* =====================================================================
   5. TEKENEN (canvas): alle wezens zijn procedureel getekend, kijkend naar rechts
   ===================================================================== */
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
function shade(hex, a) {
  const n = parseInt(hex.slice(1), 16), f = (c) => Math.round(a < 0 ? c * (1 + a) : c + (255 - c) * a);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
const PALS = {};
function pal(sp) {
  if (!PALS[sp.id]) {
    const [a, b, c] = sp.cols;
    PALS[sp.id] = { a, b, c, ad: shade(a, -0.28), al: shade(a, 0.35), bd: shade(b, -0.3), bl: shade(b, 0.4), cd: shade(c, -0.2) };
  }
  return PALS[sp.id];
}
function oval(g, x, y, rx, ry, fill, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fillStyle = fill; g.fill(); }
function lin(g, x0, y0, x1, y1, a, b) { const r = g.createLinearGradient(x0, y0, x1, y1); r.addColorStop(0, a); r.addColorStop(1, b); return r; }
function eye(g, x, y, r = 2.4) { oval(g, x, y, r, r, '#fff'); oval(g, x + r * 0.2, y, r * 0.62, r * 0.62, '#1a1a2a'); oval(g, x + r * 0.35, y - r * 0.3, r * 0.22, r * 0.22, '#fff'); }
function line(g, pts, w, col, cap = 'round') {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.lineWidth = w; g.strokeStyle = col; g.lineCap = cap; g.lineJoin = 'round'; g.stroke();
}
function poly(g, pts, fill) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fillStyle = fill; g.fill(); }

function fishBody(g, L, H, hump) {
  const n = L / 2, tb = -L * 0.4;
  g.beginPath(); g.moveTo(n, H * 0.04);
  g.bezierCurveTo(n * 0.75, -H * 0.6, L * 0.12, -H * (0.55 + hump), -L * 0.12, -H * (0.46 + hump * 0.4));
  g.bezierCurveTo(-L * 0.28, -H * 0.34, tb, -H * 0.13, tb, 0);
  g.bezierCurveTo(tb, H * 0.13, -L * 0.28, H * 0.38, -L * 0.12, H * 0.46);
  g.bezierCurveTo(L * 0.12, H * 0.6, n * 0.75, H * 0.56, n, H * 0.04);
  g.closePath();
}
function fin(g, x0, y0, x1, y1, bx, by, fill, alpha = 0.9) {
  g.save(); g.globalAlpha = alpha; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(bx, by, x1, y1); g.closePath(); g.fillStyle = fill; g.fill(); g.restore();
}

function drawFish(g, sp, t, v, disc) {
  const P = pal(sp), p = sp.p;
  const L = disc ? 34 : p === 'veil' ? 34 : 44, H = L * (disc ? 1.0 : p === 'veil' ? 0.62 : p === 'angler' ? 0.8 : p === 'koi' ? 0.38 : 0.42);
  const hump = sp.h || 0, n = L / 2, tb = -L * 0.4;
  const sw = Math.sin(t * (5 + v * 5)) * (0.22 + v * 0.22);
  g.save(); g.translate(tb + 1, 0); g.rotate(sw);
  const tl = p === 'veil' ? L * 0.85 : disc ? L * 0.45 : L * 0.42, th = p === 'veil' ? H * 0.9 : H * 0.55;
  g.globalAlpha = p === 'veil' ? 0.82 : 0.95;
  g.beginPath(); g.moveTo(0, 0);
  if (p === 'veil') { g.bezierCurveTo(-tl * 0.3, -th * 1.1, -tl * 0.9, -th * 0.9 + Math.sin(t * 3) * 3, -tl, -th * 0.2); g.bezierCurveTo(-tl * 0.8, 0, -tl * 0.9, th * 0.7, -tl * 0.95, th * 0.9 + Math.sin(t * 3 + 1) * 3); g.bezierCurveTo(-tl * 0.5, th * 0.9, -tl * 0.2, th * 0.5, 0, 0); }
  else if (disc) { g.quadraticCurveTo(-tl * 0.5, -th * 0.9, -tl, -th * 0.4); g.quadraticCurveTo(-tl * 0.7, 0, -tl, th * 0.4); g.quadraticCurveTo(-tl * 0.5, th * 0.9, 0, 0); }
  else { g.quadraticCurveTo(-tl * 0.5, -th, -tl, -th * 0.85); g.quadraticCurveTo(-tl * 0.62, 0, -tl, th * 0.85); g.quadraticCurveTo(-tl * 0.5, th, 0, 0); }
  g.fillStyle = lin(g, 0, 0, -tl, 0, P.b, P.bl); g.fill();
  g.restore();
  const dh = disc ? H * 0.75 : p === 'veil' ? H * 0.8 : p === 'lion' ? H * 0.95 : p === 'angler' ? H * 0.4 : H * 0.34;
  if (p === 'lion') {
    for (let i = 0; i < 7; i++) { const x = L * 0.2 - i * L * 0.075; line(g, [[x, -H * 0.42], [x - 3 + Math.sin(t * 2 + i) * 1.5, -H * 0.42 - dh]], 1.6, i % 2 ? P.c : P.b); }
  } else {
    fin(g, L * 0.2, -H * 0.4, -L * 0.28, -H * 0.3, -L * 0.02, -H * 0.42 - dh + Math.sin(t * 4) * 1.5, P.bd);
    if (disc) fin(g, L * 0.12, H * 0.42, -L * 0.28, H * 0.3, -L * 0.04, H * 0.42 + dh, P.bd);
    else fin(g, -L * 0.05, H * 0.4, -L * 0.28, H * 0.3, -L * 0.14, H * 0.4 + dh * 0.5, P.bd);
  }
  fishBody(g, L, H, hump);
  g.fillStyle = lin(g, 0, -H * 0.5, 0, H * 0.5, p === 'koi' ? '#fff6dc' : P.a, p === 'angler' ? P.a : P.c);
  g.fill();
  g.save(); fishBody(g, L, H, hump); g.clip();
  fishPattern(g, sp, P, L, H, t);
  g.restore();
  g.save(); g.translate(L * 0.1, H * 0.1); g.rotate(Math.sin(t * 6) * 0.35 - 0.3);
  if (p === 'lion') { for (let i = 0; i < 5; i++) line(g, [[0, 0], [-8 - i * 2, 7 + i * 1.2]], 2, i % 2 ? P.c : P.b); }
  else fin(g, 0, 0, -L * 0.2, L * 0.12, -L * 0.05, L * 0.16, P.bl, 0.85);
  g.restore();
  eye(g, n * 0.52, -H * 0.1, disc ? 2.9 : p === 'angler' ? 3.2 : 2.5);
  g.beginPath(); g.arc(n * 0.28, 0, H * 0.4, -0.9, 0.9); g.lineWidth = 1; g.strokeStyle = 'rgba(0,0,0,0.16)'; g.stroke();
  if (p === 'angler') {
    line(g, [[n * 0.5, -H * 0.4], [n * 0.7, -H * 0.9], [n * 1.05, -H * 0.85]], 1.5, P.bd);
    const gl = 0.6 + Math.sin(t * 3) * 0.3; oval(g, n * 1.05, -H * 0.85, 7, 7, `rgba(255,230,109,${0.25 * gl})`); oval(g, n * 1.05, -H * 0.85, 3.2, 3.2, P.b);
    g.strokeStyle = '#fff'; g.lineWidth = 1; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(n * (0.55 + i * 0.09), H * 0.1); g.lineTo(n * (0.58 + i * 0.09), H * 0.22); g.stroke(); }
  } else { g.beginPath(); g.arc(n * 0.97, H * 0.12, 1.6, 0.2, 3.1); g.lineWidth = 1; g.strokeStyle = 'rgba(80,30,30,0.5)'; g.stroke(); }
}
function fishPattern(g, sp, P, L, H, t) {
  const p = sp.p, n = L / 2;
  const rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  if (p === 'neon') {
    rect(-L * 0.45, 0, L * 0.4, H, P.b);
    line(g, [[n * 0.8, -H * 0.04], [-L * 0.34, -H * 0.02]], H * 0.3, 'rgba(120,235,255,0.35)');
    line(g, [[n * 0.8, -H * 0.04], [-L * 0.34, -H * 0.02]], H * 0.14, '#7aeaff');
  } else if (p === 'stripes') { for (let i = 0; i < 5; i++) rect(-L * 0.3 + i * L * 0.13, -H, L * 0.05, H * 2, P.b); }
  else if (p === 'stripes_y') { for (let i = -2; i <= 2; i++) rect(-L, i * H * 0.17 - H * 0.04, L * 2, H * 0.07, P.b); }
  else if (p === 'bands') { for (let i = 0; i < 3; i++) rect(-L * 0.15 + i * L * 0.18 - L * 0.1, -H, L * 0.07, H * 2, P.b); }
  else if (p === 'clown') {
    [[L * 0.2, L * 0.09], [-L * 0.05, L * 0.1], [-L * 0.33, L * 0.08]].forEach(([x, w]) => { rect(x, -H, w, H * 2, '#fff'); rect(x - 1.2, -H, 1.2, H * 2, '#2a1a10'); rect(x + w, -H, 1.2, H * 2, '#2a1a10'); });
  } else if (p === 'mandarin') {
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-L * 0.4, -H * 0.4 + i * H * 0.2); g.bezierCurveTo(-L * 0.1, -H * 0.1 + i * H * 0.2, L * 0.1, -H * 0.5 + i * H * 0.2, L * 0.5, -H * 0.2 + i * H * 0.2); g.lineWidth = 2; g.strokeStyle = i % 2 ? P.b : P.c; g.stroke(); }
  } else if (p === 'koi') { oval(g, L * 0.08, -H * 0.2, L * 0.14, H * 0.25, '#ff6a00'); oval(g, -L * 0.18, H * 0.12, L * 0.12, H * 0.2, '#ffd23f'); oval(g, L * 0.3, -H * 0.05, L * 0.08, H * 0.18, '#ff3d00'); }
  else if (p === 'scales') { g.strokeStyle = 'rgba(120,70,0,0.25)'; g.lineWidth = 1; for (let r = -2; r <= 2; r++) for (let c = -4; c <= 4; c++) { g.beginPath(); g.arc(c * 5 + (r % 2) * 2.5, r * 4, 3, -0.2, Math.PI + 0.2); g.stroke(); } }
  else if (p === 'tailspot') { oval(g, -L * 0.3, 0, 3, 3, '#2a1a10'); oval(g, -L * 0.12, -H * 0.12, 2, 2, 'rgba(60,30,10,0.5)'); }
  else if (p === 'mottle') { for (let i = 0; i < 14; i++) oval(g, -L * 0.35 + (i * 7 % 30), -H * 0.3 + (i * 5 % 10) * H * 0.08, 3.2, 2.4, P.c); }
  else if (p === 'lion') { for (let i = 0; i < 7; i++) rect(L * 0.3 - i * L * 0.1, -H, L * 0.045, H * 2, i % 2 ? P.b : P.c); }
  else if (p === 'butterfly') { rect(L * 0.25, -H, L * 0.09, H * 2, '#222'); oval(g, -L * 0.2, -H * 0.18, 3, 3, '#222'); oval(g, -L * 0.2, -H * 0.18, 1.2, 1.2, '#fff'); }
  else if (p === 'tang') { g.beginPath(); g.moveTo(L * 0.3, -H * 0.1); g.bezierCurveTo(L * 0.1, -H * 0.5, -L * 0.2, -H * 0.4, -L * 0.45, -H * 0.05); g.bezierCurveTo(-L * 0.2, -H * 0.15, L * 0.1, -H * 0.1, L * 0.3, -H * 0.1); g.fillStyle = '#0b1c4d'; g.fill(); }
  else if (p === 'hump') { for (let i = 0; i < 4; i++) line(g, [[n * 0.3 - i * 5, -H * 0.5], [n * 0.2 - i * 5, H * 0.2]], 1.2, 'rgba(10,70,80,0.35)'); }
}

function drawEel(g, sp, t, v) {
  const P = pal(sp), N = 16, L = 64, pts = [];
  for (let i = 0; i < N; i++) { const u = i / (N - 1); pts.push([L / 2 - u * L, Math.sin(t * (3 + v * 3) - u * 4.5) * (1.5 + u * 6.5)]); }
  const wd = (i) => 7.5 - (i / (N - 1)) * 3.2 + (i < 2 ? -1 + i * 0.5 : 0);
  for (let i = N - 2; i >= 0; i--) line(g, [pts[i], pts[i + 1]], wd(i) + 2, P.ad);
  for (let i = N - 2; i >= 0; i--) line(g, [pts[i], pts[i + 1]], wd(i), P.a);
  for (let i = N - 2; i >= 0; i--) { const u = i / (N - 1); line(g, [[pts[i][0], pts[i][1] + 1.5], [pts[i + 1][0], pts[i + 1][1] + 1.5]], 3 - u * 1.4, sp.p === 'glow' ? P.c : P.al); }
  if (sp.p === 'mottle') for (let i = 1; i < N - 2; i += 2) oval(g, pts[i][0], pts[i][1] - 1, 2.4, 1.8, P.c);
  if (sp.p === 'glow' && Math.sin(t * 5) > 0.7) { const a = pts[5]; line(g, [[a[0], a[1] - 5], [a[0] - 4, a[1] - 9], [a[0] + 2, a[1] - 12], [a[0] - 3, a[1] - 17]], 1.6, P.c); }
  oval(g, pts[0][0] - 2, pts[0][1], 7.5, 5.6, P.a); oval(g, pts[0][0] - 2, pts[0][1] + 2, 6.5, 2.8, P.al);
  eye(g, pts[0][0] + 2, pts[0][1] - 2, 2.3);
  g.beginPath(); g.arc(pts[0][0] + 5, pts[0][1] + 1.8, 2, 0.2, 2.9); g.lineWidth = 1; g.strokeStyle = 'rgba(30,20,10,0.6)'; g.stroke();
}

function drawSeahorse(g, sp, t) {
  const P = pal(sp), b = Math.sin(t * 2) * 1.2;
  g.save(); g.translate(0, b);
  g.beginPath(); g.moveTo(8, -20); g.bezierCurveTo(14, -22, 22, -20, 22, -16); g.lineTo(21, -14); g.bezierCurveTo(16, -15, 13, -13, 10, -12); g.closePath(); g.fillStyle = P.a; g.fill();
  g.beginPath(); g.moveTo(-1, -16); g.bezierCurveTo(-1, -26, 12, -26, 11, -14);
  g.bezierCurveTo(14, -6, 13, 4, 7, 10); g.bezierCurveTo(1, 16, 3, 22, 8, 22); g.bezierCurveTo(3, 25, -6, 22, -3, 14);
  g.bezierCurveTo(0, 8, -6, 4, -5, -4); g.bezierCurveTo(-5, -10, -1, -12, -1, -16); g.closePath();
  g.fillStyle = lin(g, -6, -24, 12, 14, P.a, P.b); g.fill();
  for (let i = 0; i < 6; i++) line(g, [[-4 + i * 0.3, -8 + i * 4.5], [10 - i * 0.7, -8 + i * 4.5 + 1]], 1.1, 'rgba(255,255,255,0.35)');
  g.save(); g.translate(-5, -2); poly(g, [[0, 0], [-6 + Math.sin(t * 9) * 1.5, -5], [-5 + Math.sin(t * 9 + 1) * 1.5, 7]], P.bl); g.restore();
  eye(g, 9, -19, 2.2); g.restore();
}

function drawJelly(g, sp, t) {
  const P = pal(sp), pu = Math.sin(t * 2.6), sx = 1 + pu * 0.09, sy = 1 - pu * 0.13, glow = sp.p === 'glow', R = 15;
  if (glow) { const r = g.createRadialGradient(0, -4, 2, 0, -4, 30); r.addColorStop(0, 'rgba(120,230,255,0.35)'); r.addColorStop(1, 'rgba(120,230,255,0)'); g.fillStyle = r; g.fillRect(-32, -36, 64, 64); }
  for (let i = 0; i < 6; i++) { const x = -9 + i * 3.6; g.beginPath(); g.moveTo(x, 2); for (let k = 1; k <= 5; k++) g.lineTo(x + Math.sin(t * 3 + i + k * 0.8) * (1 + k * 0.6), 2 + k * 5.2); g.lineWidth = 1.2; g.strokeStyle = P.b; g.globalAlpha = 0.7; g.lineCap = 'round'; g.stroke(); g.globalAlpha = 1; }
  for (let i = 0; i < 3; i++) { const x = -5 + i * 5; g.beginPath(); g.moveTo(x, 2); g.bezierCurveTo(x + Math.sin(t * 2 + i) * 4, 8, x - Math.sin(t * 2 + i) * 4, 12, x + Math.sin(t * 2.5 + i) * 3, 19); g.lineWidth = 3; g.strokeStyle = P.c; g.globalAlpha = 0.65; g.stroke(); g.globalAlpha = 1; }
  g.save(); g.translate(0, 3); g.scale(sx, sy);
  g.beginPath(); g.moveTo(-R, 0); g.bezierCurveTo(-R, -R * 1.5, R, -R * 1.5, R, 0);
  for (let i = 0; i < 5; i++) g.quadraticCurveTo(R - (i + 0.5) * R * 0.4, 4, R - (i + 1) * R * 0.4, 0);
  g.closePath(); g.globalAlpha = 0.78; g.fillStyle = lin(g, 0, -R * 1.3, 0, 3, P.al, P.a); g.fill(); g.globalAlpha = 0.5;
  oval(g, -4, -R * 0.65, 5, 3, 'rgba(255,255,255,0.7)', -0.4); g.globalAlpha = 1;
  if (glow) oval(g, 0, -R * 0.4, 6, 4, `rgba(255,255,255,${0.4 + 0.3 * Math.sin(t * 3)})`);
  else for (let i = 0; i < 3; i++) oval(g, -6 + i * 6, -R * 0.35 - (i % 2) * 3, 1.5, 1.5, 'rgba(255,255,255,0.5)');
  g.restore();
}

function drawOcto(g, sp, t) {
  const P = pal(sp);
  for (let i = 0; i < 8; i++) {
    const ph = t * 3 + i * 0.9; g.beginPath(); g.moveTo(-6 + i * 1.6, 4);
    for (let k = 1; k <= 6; k++) g.lineTo(-8 + i * 2 + i * 0.6 - k * 4 * (0.5 + i * 0.04) + Math.sin(ph + k * 0.5) * 1.5, 4 + k * 3.3 + Math.cos(ph + k * 0.7) * 1.2);
    g.lineWidth = 4.3; g.strokeStyle = P.a; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
  }
  oval(g, 0, -4, 14, 15, lin(g, 0, -20, 0, 8, P.al, P.a), -0.15);
  oval(g, 3, -12, 4, 2.5, 'rgba(255,255,255,0.35)', -0.5);
  for (let i = 0; i < 4; i++) oval(g, -4 + i * 3, -8 + (i % 2) * 7, 1.2, 1.2, P.c);
  eye(g, 5, -2, 3); eye(g, -2, -3, 2.6);
}

function drawCrab(g, sp, t, v) {
  const P = pal(sp), w = Math.sin(t * (4 + v * 8));
  for (let s = 0; s < 3; s++) { line(g, [[-5 + s * 4, 3], [-11 - s * 2, 7 + w * (s % 2 ? 1 : -1)], [-14 - s * 2, 12]], 2.2, P.ad); line(g, [[5 - s * 4, 3], [11 + s * 2, 7 - w * (s % 2 ? 1 : -1)], [14 + s * 2, 12]], 2.2, P.ad); }
  line(g, [[13, -3], [19, -12 + w * 1.5]], 3, P.a); oval(g, 20, -15 + w * 1.5, 6, 4, P.a, 0.5); poly(g, [[22, -15], [29, -13], [24, -10]], P.al);
  line(g, [[-13, -3], [-18, -10 - w]], 3, P.a); oval(g, -19, -13 - w, 5, 3.4, P.a, -0.4);
  oval(g, 0, 0, 15, 10, lin(g, 0, -10, 0, 10, P.al, P.a));
  oval(g, 0, -3, 9, 3, 'rgba(255,255,255,0.25)');
  line(g, [[5, -8], [6, -13]], 1.3, P.ad); line(g, [[-1, -8], [-2, -13]], 1.3, P.ad); eye(g, 6, -14, 2.2); eye(g, -2, -14, 2.2);
}
function drawLobster(g, sp, t, v) {
  const P = pal(sp), w = Math.sin(t * (3 + v * 6));
  for (let i = 0; i < 4; i++) line(g, [[4 - i * 5, 4], [6 - i * 5 + w * (i % 2 ? 1 : -1), 10], [4 - i * 5, 13]], 1.8, P.ad);
  line(g, [[-14, -2], [-30, 2 + w], [-40, 0]], 0.9, P.b);
  for (let i = 0; i < 5; i++) oval(g, -2 - i * 6.5, 0, 6 - i * 0.4, 6.5 - i * 0.6, i % 2 ? P.a : P.al);
  poly(g, [[-30, 0], [-38, -6], [-39, 6]], P.bd);
  oval(g, 10, -1, 11, 8, lin(g, 0, -8, 0, 8, P.al, P.a));
  line(g, [[16, -1], [24, -4]], 3.4, P.a); oval(g, 28, -6, 7, 4.5, P.a, -0.5); poly(g, [[32, -7], [39, -8], [33, -3]], P.al);
  line(g, [[13, 3], [21, 7]], 3, P.a); oval(g, 25, 9, 5, 3.2, P.a, 0.3);
  line(g, [[18, -4], [34, -14 + w], [42, -12]], 0.9, P.b); eye(g, 17, -5, 2);
}
function drawStar(g, sp, t) {
  const P = pal(sp); g.save(); g.rotate(Math.sin(t * 0.5) * 0.06);
  g.beginPath();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 6.5 : 19, a = -Math.PI / 2 + i * Math.PI / 5; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
  g.closePath(); g.lineJoin = 'round'; g.lineWidth = 5; g.strokeStyle = P.a; g.stroke(); g.fillStyle = P.a; g.fill();
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; line(g, [[0, 0], [Math.cos(a) * 15, Math.sin(a) * 15]], 2, P.al); for (let k = 1; k < 4; k++) oval(g, Math.cos(a) * k * 4.5, Math.sin(a) * k * 4.5, 1.1, 1.1, P.c); }
  oval(g, 0, 0, 3, 3, P.b); g.restore();
}
function drawUrchin(g, sp, t) {
  const P = pal(sp);
  for (let i = 0; i < 24; i++) { const a = Math.PI + i * Math.PI / 23, r = 18 + Math.sin(t * 2 + i) * 1.2; line(g, [[Math.cos(a) * 8, Math.sin(a) * 8], [Math.cos(a) * r, Math.sin(a) * r]], 1.5, i % 3 ? P.a : P.b); }
  g.beginPath(); g.arc(0, 0, 10, Math.PI, TAU); g.closePath(); g.fillStyle = lin(g, 0, -10, 0, 4, P.al, P.a); g.fill(); oval(g, -3, -5, 3, 1.8, 'rgba(255,255,255,0.4)');
  eye(g, 3, -3, 1.6);
}
function drawAxolotl(g, sp, t, v) {
  const P = pal(sp), w = Math.sin(t * (3 + v * 4));
  g.beginPath(); g.moveTo(-8, -3); g.bezierCurveTo(-24, -6 + w * 3, -34, 2 + w * 4, -42, 1 + w * 5); g.bezierCurveTo(-34, 6 + w * 3, -22, 7, -8, 6); g.closePath(); g.fillStyle = P.a; g.fill();
  line(g, [[-14, 6], [-18, 12]], 3, P.a); line(g, [[8, 6], [12, 12]], 3, P.a);
  oval(g, 0, 1, 18, 8.5, lin(g, 0, -8, 0, 9, P.al, P.a));
  oval(g, 14, -1, 10, 8, P.al);
  for (let i = 0; i < 3; i++) { const ph = Math.sin(t * 5 + i); line(g, [[10 - i * 3, -6], [7 - i * 4 + ph, -14 - i], [5 - i * 4, -12 - i * 0.5]], 2.4, P.b); line(g, [[10 - i * 3, -6], [14 - i * 4 + ph, -14 - i * 1.5]], 2.4, P.b); }
  eye(g, 19, -3, 1.9); g.beginPath(); g.arc(21, 2, 3, 0.2, 2.9); g.lineWidth = 1; g.strokeStyle = P.bd; g.stroke();
  oval(g, 16, 3, 2, 1.2, 'rgba(255,100,130,0.4)');
}
function drawNautilus(g, sp, t) {
  const P = pal(sp), w = Math.sin(t * 3);
  for (let i = 0; i < 7; i++) line(g, [[12, 4 + i * 1.2 - 3], [20 + w * 1.5, 6 + i * 1.5 - 3], [26, 8 + i * 2 - 4 + w]], 1.4, '#f3c9a2');
  g.beginPath(); g.moveTo(10, 8); g.bezierCurveTo(10, -14, -6, -22, -16, -10); g.bezierCurveTo(-24, 0, -14, 14, 0, 14); g.bezierCurveTo(6, 14, 10, 12, 10, 8); g.closePath();
  g.fillStyle = lin(g, -16, -16, 10, 12, P.c, P.a); g.fill();
  g.strokeStyle = P.b; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-3 - i * 2.4, -16 + i * 2.2); g.quadraticCurveTo(-8 - i * 2, 0, -3 - i * 1.5, 12); g.stroke(); }
  oval(g, 13, 2, 5, 6, '#f3b98a'); eye(g, 15, 0, 2);
}
function drawPuffer(g, sp, t) {
  const P = pal(sp), sw = Math.sin(t * 7) * 0.4;
  g.save(); g.translate(-15, 0); g.rotate(sw); fin(g, 0, 0, -9, -1, -4, -9, P.b); g.restore();
  oval(g, 0, 0, 17, 15, lin(g, 0, -15, 0, 15, P.a, P.c));
  for (let i = 0; i < 16; i++) { const a = i * TAU / 16; if (Math.cos(a) > 0.2 && Math.abs(Math.sin(a)) < 0.5) continue; line(g, [[Math.cos(a) * 16.4, Math.sin(a) * 14.4], [Math.cos(a) * 19.4, Math.sin(a) * 17.4]], 1.2, P.bd); }
  for (let i = 0; i < 7; i++) oval(g, -8 + (i * 5 % 14), -6 + (i * 7 % 9), 1.3, 1.3, P.b);
  g.save(); g.translate(2, 4); g.rotate(Math.sin(t * 9) * 0.5 - 0.3); fin(g, 0, 0, -7, 3, -3, 6, P.bl); g.restore();
  eye(g, 8, -4, 4); oval(g, 16.5, 4, 3, 2.3, '#f4a58a');
}
function drawTurtle(g, sp, t, v) {
  const P = pal(sp), f = Math.sin(t * (2 + v * 2));
  g.save(); g.translate(8, 4); g.rotate(0.5 + f * 0.5); fin(g, 0, 0, 5, 20, 14, 8, P.c, 1); g.restore();
  g.save(); g.translate(-12, 6); g.rotate(0.4 - f * 0.2); fin(g, 0, 0, -3, 11, 6, 4, P.c, 1); g.restore();
  poly(g, [[-22, 0], [-30, 3 + f * 2], [-22, 4]], P.c);
  oval(g, 22, -1, 7, 5.5, P.c); eye(g, 25, -3, 1.8);
  g.beginPath(); g.moveTo(-22, 4); g.bezierCurveTo(-24, -20, 18, -20, 20, 4); g.closePath(); g.fillStyle = lin(g, 0, -16, 0, 4, P.a, P.ad); g.fill();
  g.strokeStyle = P.al; g.lineWidth = 1.4; g.globalAlpha = 0.7; g.beginPath(); g.moveTo(-8, -13); g.lineTo(-10, 2); g.moveTo(8, -13); g.lineTo(10, 2); g.moveTo(-18, -5); g.lineTo(16, -5); g.stroke(); g.globalAlpha = 1;
  oval(g, 6, 4, 22, 2.6, P.c);
  g.save(); g.translate(8, 5); g.rotate(-0.4 - f * 0.4); fin(g, 0, 0, 4, 20, 14, 8, P.cd, 1); g.restore();
}
function drawShark(g, sp, t, v) {
  const P = pal(sp), p = sp.p, L = 64, sw = Math.sin(t * (2.2 + v * 2)) * (0.2 + v * 0.1);
  const bh = p === 'whale' ? 22 : 18;
  g.save(); g.translate(-L * 0.42, 0); g.rotate(sw);
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-8, -6, -16, -22); g.quadraticCurveTo(-12, -8, -13, -2); g.quadraticCurveTo(-10, 6, -18, 12); g.quadraticCurveTo(-8, 8, 0, 3); g.closePath(); g.fillStyle = P.b; g.fill(); g.restore();
  if (p === 'saw') {
    poly(g, [[L / 2 - 4, -2], [L / 2 + 26, 0], [L / 2 - 4, 2]], P.c);
    for (let i = 0; i < 7; i++) { poly(g, [[L / 2 + 2 + i * 3.4, -1], [L / 2 + 3.5 + i * 3.4, -4.2], [L / 2 + 5 + i * 3.4, -1]], '#fff'); poly(g, [[L / 2 + 2 + i * 3.4, 1], [L / 2 + 3.5 + i * 3.4, 4.2], [L / 2 + 5 + i * 3.4, 1]], '#fff'); }
  }
  fin(g, 4, -bh * 0.45, -10, -bh * 0.4, -6, -bh * 1.5, P.b);
  g.beginPath(); g.moveTo(L / 2, 2);
  g.bezierCurveTo(L * 0.3, -bh * 0.7, -L * 0.05, -bh * 0.75, -L * 0.42, -1);
  g.lineTo(-L * 0.42, 1);
  g.bezierCurveTo(-L * 0.05, bh * 0.75, L * 0.3, bh * 0.65, L / 2, 2); g.closePath();
  g.fillStyle = lin(g, 0, -bh * 0.6, 0, bh * 0.6, P.a, P.c); g.fill();
  if (p === 'whale') { g.save(); g.clip(); for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) oval(g, -22 + c * 6 + (r % 2) * 3, -9 + r * 4.5, 1.3, 1.3, 'rgba(255,255,255,0.85)'); g.restore(); }
  g.save(); g.translate(8, 4); g.rotate(0.5 + Math.sin(t * 2) * 0.1); fin(g, 0, 0, -10, 14, -2, 10, P.b); g.restore();
  if (p === 'hammer') { g.save(); g.translate(L / 2 - 6, 0); g.beginPath(); g.moveTo(-2, -11); g.quadraticCurveTo(4, -13, 6, -9); g.lineTo(6, 9); g.quadraticCurveTo(4, 13, -2, 11); g.quadraticCurveTo(1, 0, -2, -11); g.fillStyle = lin(g, 0, -10, 0, 10, P.a, P.c); g.fill(); eye(g, 5.5, -9, 2); eye(g, 5.5, 9, 2); g.restore(); }
  else eye(g, L / 2 - 12, -3, p === 'whale' ? 2.4 : 2.2);
  for (let i = 0; i < 3; i++) line(g, [[L / 2 - 20 - i * 2, -3 + i * 0.2], [L / 2 - 21 - i * 2, 4]], 0.9, 'rgba(0,0,0,0.25)');
  g.beginPath(); g.arc(L / 2 - 6, 4, 6, 0.2, 1.2); g.lineWidth = 1; g.strokeStyle = 'rgba(0,0,0,0.35)'; g.stroke();
}
function drawRay(g, sp, t, v) {
  const P = pal(sp), manta = sp.p === 'manta', f = Math.sin(t * (1.8 + v * 1.4)), W = manta ? 34 : 26, Hh = manta ? 8 : 6;
  line(g, [[-W * 0.5, 0], [-W * 0.9 - 8, 2 + f * 3], [-W * 1.4 - 8, 5 + f * 5]], manta ? 1.6 : 2, P.b);
  for (const sgn of [-1, 1]) {
    g.save(); g.globalAlpha = sgn < 0 ? 0.85 : 1;
    g.beginPath(); g.moveTo(W * 0.5, 0); g.bezierCurveTo(W * 0.2, sgn * Hh * 0.4 + f * -6 * sgn, -W * 0.3, sgn * Hh * 2.5 + f * -9 * sgn, -W * 0.5, sgn + f * -3 * sgn);
    g.bezierCurveTo(-W * 0.3, sgn * 2, W * 0.1, 0, W * 0.5, 0); g.fillStyle = sgn < 0 ? P.b : P.a; g.fill(); g.restore();
  }
  oval(g, 0, 0, W * 0.5, Hh, lin(g, 0, -Hh, 0, Hh, P.a, P.c));
  if (sp.p === 'spots') for (let i = 0; i < 6; i++) oval(g, -8 + i * 3, -2 + (i % 2) * 2.5, 1.5, 1.5, P.ad);
  if (manta) { poly(g, [[W * 0.45, -2], [W * 0.62, -5], [W * 0.55, -1]], P.a); poly(g, [[W * 0.45, 2], [W * 0.62, 5], [W * 0.55, 1]], P.a); oval(g, 4, 1, 8, 2.5, P.c); }
  eye(g, W * 0.38, -3, 1.8);
}
function drawPenguin(g, sp, t, v, mode) {
  const P = pal(sp), emp = sp.p === 'emperor', big = emp ? 1.0 : 0.9, swim = mode === 'swim';
  g.save();
  if (swim) g.rotate(-Math.PI / 2 + 0.08);
  g.rotate(swim ? 0 : Math.sin(t * (v > 0.1 ? 9 : 1.5)) * (v > 0.1 ? 0.07 : 0.015));
  if (!swim) { oval(g, -4, 18, 5, 2.2, P.c); oval(g, 5, 18, 5, 2.2, P.c); } else poly(g, [[-3, 16], [3, 16], [0, 24]], P.c);
  oval(g, 0, 2, 12 * big, 18 * big, P.a);
  oval(g, 2, 4.5, 8 * big, 14.5 * big, P.b);
  if (emp) oval(g, 1, -9, 6, 5, P.c);
  if (sp.p === 'gentoo') { g.beginPath(); g.moveTo(-6, -13); g.quadraticCurveTo(0, -17, 8, -13); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke(); }
  if (sp.p === 'rockhopper') { line(g, [[-2, -13], [-9, -19 - Math.sin(t * 3)], [-7, -11]], 1.6, P.c); line(g, [[4, -13], [9, -19], [8, -11]], 1.6, P.c); }
  g.save(); g.translate(-9, -4); g.rotate((swim ? Math.sin(t * 8) * 0.5 : Math.sin(t * 2) * 0.1) + 0.2); oval(g, -1, 8, 3.2, 10, P.a, 0.12); g.restore();
  g.save(); g.translate(9, -4); g.rotate((swim ? -Math.sin(t * 8) * 0.5 : -Math.sin(t * 2) * 0.1) - 0.2); oval(g, 1, 8, 3.2, 10, P.a, -0.12); g.restore();
  eye(g, 5, -9, 2.1);
  poly(g, [[8, -8], [15, -6.2], [8, -4.2]], sp.p === 'rockhopper' || emp ? P.c : '#ff9a3d');
  g.restore();
}
function drawSeal(g, sp, t) {
  const P = pal(sp), sw = Math.sin(t * 3 + 1) * 0.2;
  g.save(); g.translate(-26, 0); g.rotate(sw); fin(g, 0, 0, -12, -7, -9, 0, P.b, 1); fin(g, 0, 0, -12, 7, -9, 0, P.b, 1); g.restore();
  g.beginPath(); g.moveTo(26, 2); g.bezierCurveTo(22, -14, 0, -15, -26, -1); g.lineTo(-26, 1); g.bezierCurveTo(-4, 14, 20, 13, 26, 2); g.closePath(); g.fillStyle = lin(g, 0, -14, 0, 12, P.a, P.c); g.fill();
  for (let i = 0; i < 8; i++) oval(g, -14 + i * 4, -4 + (i * 3 % 7), 1.2, 1.2, P.b);
  g.save(); g.translate(6, 7); g.rotate(0.6 + Math.sin(t * 4) * 0.3); fin(g, 0, 0, -3, 12, 6, 6, P.b, 1); g.restore();
  eye(g, 18, -4, 2.4); oval(g, 26, 0, 2.6, 2, '#2a2d35');
  for (let i = 0; i < 3; i++) line(g, [[24, 2 + i], [31, 2 + i * 2.4 - 1]], 0.7, '#fff');
}
function drawNarwal(g, sp, t) {
  const P = pal(sp), sw = Math.sin(t * 2) * 0.18;
  line(g, [[34, -2], [64, -6]], 2.6, '#fff8e0'); for (let i = 0; i < 6; i++) line(g, [[38 + i * 4, -2.5 - i * 0.3], [40 + i * 4, -4.4 - i * 0.3]], 0.8, 'rgba(180,150,80,0.6)');
  g.save(); g.translate(-32, 0); g.rotate(sw); poly(g, [[0, 0], [-12, -12], [-8, 0], [-12, 12]], P.b); g.restore();
  g.beginPath(); g.moveTo(36, 0); g.bezierCurveTo(30, -17, -8, -17, -32, -1); g.lineTo(-32, 1); g.bezierCurveTo(-8, 15, 30, 14, 36, 0); g.closePath(); g.fillStyle = lin(g, 0, -16, 0, 14, P.a, P.c); g.fill();
  for (let i = 0; i < 12; i++) oval(g, -18 + (i * 7 % 40), -9 + (i * 5 % 9), 1.8, 1.3, P.b);
  g.save(); g.translate(8, 6); g.rotate(0.5); fin(g, 0, 0, -3, 12, 6, 6, P.b, 1); g.restore();
  eye(g, 26, -4, 2.2);
}

export const ART_UPRIGHT = { jelly: 1, seahorse: 1, crab: 1, lobster: 1, star: 1, urchin: 1, penguin: 1, nautilus: 1, octo: 1, axolotl: 1 };
// Tekent een wezen in lokale eenheden (ongeveer 44 breed), kijkend naar rechts. v = snelheid 0..1
export function drawCreature(g, sp, t, v, mode) {
  switch (sp.art) {
    case 'fish': return drawFish(g, sp, t, v, false);
    case 'disc': return drawFish(g, sp, t, v, true);
    case 'eel': return drawEel(g, sp, t, v);
    case 'seahorse': return drawSeahorse(g, sp, t);
    case 'jelly': return drawJelly(g, sp, t);
    case 'octo': return drawOcto(g, sp, t);
    case 'crab': return drawCrab(g, sp, t, v);
    case 'lobster': return drawLobster(g, sp, t, v);
    case 'star': return drawStar(g, sp, t);
    case 'urchin': return drawUrchin(g, sp, t);
    case 'axolotl': return drawAxolotl(g, sp, t, v);
    case 'nautilus': return drawNautilus(g, sp, t);
    case 'puffer': return drawPuffer(g, sp, t);
    case 'turtle': return drawTurtle(g, sp, t, v);
    case 'shark': return drawShark(g, sp, t, v);
    case 'ray': return drawRay(g, sp, t, v);
    case 'penguin': return drawPenguin(g, sp, t, v, mode);
    case 'seal': return drawSeal(g, sp, t);
    case 'narwal': return drawNarwal(g, sp, t);
    default: oval(g, 0, 0, 14, 8, sp.cols[0]);
  }
}
// pictogram als data-URL (gecachet), voor lijsten
const ICONS = {};
export function iconURL(id) {
  if (id in ICONS) return ICONS[id];
  let url = '';
  try {
    const sp = SPM[id], c = document.createElement('canvas'); c.width = 96; c.height = 64;
    const g = c.getContext('2d');
    if (g) {
      const ext = { shark: 76, narwal: 110, ray: 52, seal: 58, lobster: 62, eel: 66, turtle: 56, seahorse: 54, penguin: 52, jelly: 52, nautilus: 46, octo: 48, urchin: 44, star: 44, axolotl: 56 }[sp.art] || 48;
      const k = Math.min(1.6, 84 / ext);
      g.translate(sp.art === 'narwal' ? 40 : 48, 34); g.scale(k, k);
      drawCreature(g, sp, 0.6, 0.2, 'walk');
      url = c.toDataURL('image/png');
    }
  } catch (e) { url = ''; }
  ICONS[id] = url; return url;
}

/* ---------- achtergronden en decoraties ---------- */
export function layoutOf(k, W, H) {
  const floorY = H * 0.8;
  if (k === 'ping') return { top: H * 0.3, floorY, shelf: { x1: W * 0.36, y: H * 0.3, y2: H * 0.52 } };
  return { top: 6, floorY, shelf: null };
}
export function drawBG(g, k, W, H, t, lay) {
  const T = TT[k], top = lay.top, fl = lay.floorY;
  const gr = g.createLinearGradient(0, top, 0, fl); gr.addColorStop(0, T.sky[0]); gr.addColorStop(0.45, T.sky[1]); gr.addColorStop(1, T.sky[2]);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (k === 'ping') {
    const sk = g.createLinearGradient(0, 0, 0, top); sk.addColorStop(0, '#e3f1ff'); sk.addColorStop(1, '#f7fbff'); g.fillStyle = sk; g.fillRect(0, 0, W, top);
    for (let i = 0; i < 12; i++) { const x = (i * 97 + t * 6) % (W + 20) - 10, y = (i * 53 + t * 12) % top; oval(g, x, y, 1.6, 1.6, 'rgba(255,255,255,0.95)'); }
  }
  g.save(); g.globalAlpha = 0.09 + 0.03 * Math.sin(t * 0.6);
  for (let i = 0; i < 4; i++) { const x = W * (0.12 + i * 0.26) + Math.sin(t * 0.3 + i) * 12; poly(g, [[x, top], [x + 28, top], [x + 80, fl], [x + 20, fl]], '#fff'); }
  g.restore();
  g.beginPath(); g.moveTo(0, top + 3); for (let x = 0; x <= W; x += 12) g.lineTo(x, top + 3 + Math.sin(x * 0.06 + t * 1.5) * 1.8); g.lineTo(W, top - 2); g.lineTo(0, top - 2); g.closePath(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fill();
  const sand = g.createLinearGradient(0, fl - 8, 0, H); sand.addColorStop(0, shade(T.sand, 0.05)); sand.addColorStop(1, shade(T.sand, -0.25));
  g.beginPath(); g.moveTo(0, fl + 4); for (let x = 0; x <= W; x += 20) g.lineTo(x, fl + 2 + Math.sin(x * 0.04) * 3); g.lineTo(W, H * 0.9); g.lineTo(0, H * 0.9); g.closePath(); g.fillStyle = sand; g.fill();
  if (k === 'rif') {
    const cols = ['#ff7aa8', '#ffb347', '#b57bff', '#ff6a5a'];
    for (let i = 0; i < 7; i++) { const x = W * (0.05 + i * 0.15), h = 24 + (i * 13 % 22); line(g, [[x, fl + 2], [x - 4, fl - h * 0.5], [x + Math.sin(t + i) * 2, fl - h]], 5, cols[i % 4]); line(g, [[x - 2, fl - h * 0.45], [x - 12, fl - h * 0.8]], 4, cols[i % 4]); line(g, [[x - 2, fl - h * 0.6], [x + 8, fl - h * 0.95]], 4, cols[(i + 1) % 4]); }
  }
  const sh = lay.shelf;
  if (sh) {
    g.beginPath(); g.moveTo(0, sh.y); g.lineTo(sh.x1, sh.y); g.quadraticCurveTo(sh.x1 + 10, sh.y + 8, sh.x1 - 4, sh.y2 * 0.9); g.lineTo(sh.x1 - 20, sh.y2 + 20); g.lineTo(0, sh.y2 + 30); g.closePath();
    g.fillStyle = lin(g, 0, sh.y, 0, sh.y2 + 30, '#f4faff', '#9fd0ee'); g.fill();
    oval(g, sh.x1 * 0.5, sh.y + 1, sh.x1 * 0.5, 3, 'rgba(255,255,255,0.9)');
  }
}
export function decoSlotX(i, W) { return W * [0.12, 0.56, 0.32, 0.8, 0.9, 0.44][i % 6]; }
// x,y = voet van de decoratie; topY = bovenkant van het water (voor lampjes)
export function drawDeco(g, id, x, y, t, i, W, topY) {
  g.save(); g.translate(x, y);
  switch (id) {
    case 'plant': for (let b = 0; b < 5; b++) { g.beginPath(); g.moveTo((b - 2) * 5, 4); g.quadraticCurveTo((b - 2) * 6 + Math.sin(t * 1.4 + b + i) * 6, -22 - b % 3 * 6, (b - 2) * 5 + Math.sin(t * 1.4 + b + i + 1) * 9, -34 - (b % 3) * 9); g.lineWidth = 4; g.lineCap = 'round'; g.strokeStyle = b % 2 ? '#3fae6a' : '#2f8f56'; g.stroke(); } break;
    case 'rots': oval(g, 0, -6, 20, 12, '#8a8f99'); oval(g, 14, -3, 12, 8, '#a2a7b0'); oval(g, -9, -14, 9, 7, '#9a9fa8'); oval(g, -4, -10, 6, 3, 'rgba(255,255,255,0.25)'); break;
    case 'koraal': { const cs = ['#ff7aa8', '#ffb347', '#c07bff']; for (let b = 0; b < 3; b++) { const bx = (b - 1) * 14; line(g, [[bx, 4], [bx - 3, -14], [bx + Math.sin(t + b) * 2, -28 - b * 3]], 6, cs[b]); line(g, [[bx - 3, -12], [bx - 12, -24]], 4.5, cs[b]); line(g, [[bx - 2, -18], [bx + 9, -30]], 4.5, cs[b]); } break; }
    case 'kasteel': poly(g, [[-18, 4], [-18, -26], [18, -26], [18, 4]], '#c7b9a3'); poly(g, [[-22, -26], [-22, -34], [-16, -34], [-16, -30], [-8, -30], [-8, -34], [-2, -34], [-2, -30], [2, -30], [2, -34], [8, -34], [8, -30], [16, -30], [16, -34], [22, -34], [22, -26]], '#b7a78f'); poly(g, [[-5, 4], [-5, -10], [0, -15], [5, -10], [5, 4]], '#4b3b2e'); poly(g, [[-12, -34], [-8, -48], [-4, -34]], '#d95d5d'); poly(g, [[8, -34], [12, -48], [16, -34]], '#d95d5d'); break;
    case 'kist': poly(g, [[-14, 4], [-14, -8], [14, -8], [14, 4]], '#9a5b2b'); g.beginPath(); g.moveTo(-14, -8); g.quadraticCurveTo(0, -24 - Math.sin(t) * 2, 14, -8); g.fillStyle = '#b4713a'; g.fill(); oval(g, 0, -8, 3, 3, '#ffd23f'); for (let b = 0; b < 3; b++) oval(g, Math.sin(t * 2 + b) * 4, -20 - ((t * 14 + b * 12) % 40), 1.8, 1.8, 'rgba(255,255,255,0.6)'); break;
    case 'wrak': g.rotate(-0.25); poly(g, [[-26, 0], [-20, 10], [22, 10], [30, -4], [26, -6], [-22, -6]], '#7a5636'); line(g, [[0, -6], [0, -34]], 2.4, '#5d4129'); poly(g, [[1, -32], [18, -22], [1, -12]], 'rgba(235,230,220,0.85)'); for (let b = 0; b < 4; b++) oval(g, -14 + b * 9, 1, 2.2, 2.2, '#2a1c10'); break;
    case 'tunnel': g.beginPath(); g.ellipse(0, 4, 38, 40, 0, Math.PI, TAU); g.lineWidth = 5; g.strokeStyle = 'rgba(255,255,255,0.5)'; g.stroke(); g.beginPath(); g.ellipse(0, 4, 32, 34, 0, Math.PI, TAU); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,0.25)'; g.stroke(); break;
    case 'lamp': for (let b = 0; b < 8; b++) { const lx = (b + 0.5) * W / 8 - x, ly = topY + 18 + 7 * Math.sin(b / 7 * Math.PI) - y, a = 0.55 + 0.35 * Math.sin(t * 2 + b); oval(g, lx, ly, 7, 7, `rgba(255,236,160,${a * 0.3})`); oval(g, lx, ly, 2.6, 2.6, `rgba(255,244,190,${0.5 + a * 0.5})`); } break;
    case 'ijs': poly(g, [[-22, 4], [-14, -22], [-6, -12], [4, -34], [16, -10], [24, 4]], 'rgba(235,248,255,0.92)'); poly(g, [[4, -34], [16, -10], [8, -8]], 'rgba(190,225,245,0.9)'); break;
    case 'sneeuw': oval(g, 0, -6, 12, 11, '#fff'); oval(g, 0, -22, 8, 8, '#fff'); oval(g, -3, -24, 1.2, 1.2, '#222'); oval(g, 3, -24, 1.2, 1.2, '#222'); poly(g, [[0, -22], [8, -21], [0, -20]], '#ff8a3d'); poly(g, [[-9, -17], [9, -17], [9, -14], [-9, -14]], '#d94c4c'); break;
    case 'igloo': g.beginPath(); g.arc(0, 4, 26, Math.PI, TAU); g.fillStyle = '#f2f9ff'; g.fill(); g.strokeStyle = 'rgba(150,190,220,0.8)'; g.lineWidth = 1.2; for (let r = 0; r < 3; r++) { g.beginPath(); g.arc(0, 4, 26 - r * 8, Math.PI + 0.15, TAU - 0.15); g.stroke(); } g.beginPath(); g.arc(0, 4, 8, Math.PI, TAU); g.fillStyle = '#334a66'; g.fill(); break;
    default: break;
  }
  g.restore();
}

/* =====================================================================
   6. GELUID (WebAudio, zacht en met aan/uit)
   ===================================================================== */
function makeSound() {
  let ac = null, master = null, on = true, unlocked = false;
  const get = () => {
    if (!on || !unlocked) return null;
    if (!ac) {
      try { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ac = new C(); master = ac.createGain(); master.gain.value = 0.2; master.connect(ac.destination); } catch (e) { return null; }
    }
    if (ac.state === 'suspended') { try { ac.resume(); } catch (e) { /* ok */ } }
    return ac;
  };
  function tone(f0, f1, dur, type = 'sine', vol = 0.5, delay = 0) {
    const a = get(); if (!a) return;
    try {
      const t = a.currentTime + delay, o = a.createOscillator(), gn = a.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + 0.012); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(gn); gn.connect(master); o.start(t); o.stop(t + dur + 0.05);
    } catch (e) { /* ok */ }
  }
  const NAMES = {
    tap: () => tone(620, 280, 0.12, 'sine', 0.5),
    coin: () => { tone(988, 988, 0.08, 'triangle', 0.3); tone(1319, 1319, 0.14, 'triangle', 0.3, 0.07); },
    buy: () => { tone(523, 523, 0.1, 'triangle', 0.35); tone(659, 659, 0.1, 'triangle', 0.35, 0.08); tone(784, 784, 0.16, 'triangle', 0.35, 0.16); },
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.2, 'triangle', 0.35, i * 0.1)),
    err: () => tone(220, 150, 0.18, 'sine', 0.3),
    baby: () => { tone(1100, 1500, 0.12, 'sine', 0.3); tone(1500, 1900, 0.14, 'sine', 0.25, 0.1); },
    bloop: () => tone(300 + Math.random() * 260, 520 + Math.random() * 300, 0.16, 'sine', 0.1),
    horn: () => { tone(196, 196, 0.35, 'sawtooth', 0.15); tone(262, 262, 0.5, 'sawtooth', 0.15, 0.3); },
  };
  return {
    unlock() { unlocked = true; },
    get on() { return on; },
    set on(v) { on = !!v; },
    play(n) { if (on && NAMES[n]) NAMES[n](); },
    close() { try { if (ac) ac.close(); } catch (e) { /* ok */ } ac = null; },
  };
}

/* =====================================================================
   7. STIJL
   ===================================================================== */
const CSS = `
.aq-root{max-width:560px;margin:0 auto;padding:.3rem .5rem 8.6rem;color:var(--ink);position:relative;-webkit-tap-highlight-color:transparent}
.aq-root *{box-sizing:border-box}
.aq-load{text-align:center;padding:3rem 1rem;color:var(--mute,#8a90a2)}
.aq-dock{position:fixed;left:0;right:0;bottom:0;z-index:30;pointer-events:none}
.aq-dockin{max-width:560px;margin:0 auto;pointer-events:auto;background:var(--card);border:1px solid var(--line);border-bottom:0;border-radius:18px 18px 0 0;box-shadow:0 -4px 18px rgba(0,0,0,.12);padding:.35rem .4rem calc(.3rem + env(safe-area-inset-bottom,0px))}
.aq-stats{display:flex;align-items:center;gap:.6rem;padding:.1rem .35rem .3rem}
.aq-coins{font-weight:800;font-size:1.2rem;white-space:nowrap}
.aq-sub{font-size:.8rem;color:var(--mute,#8a90a2);white-space:nowrap}
.aq-sp{flex:1}
.aq-ib{padding:.2rem .55rem;border-radius:99px;font-size:1.05rem;line-height:1.4}
.aq-nav{display:grid;grid-template-columns:repeat(6,1fr);gap:2px}
.aq-nav button{position:relative;border:0;background:transparent;border-radius:12px;padding:.25rem 0 .2rem;font-size:1.25rem;line-height:1.1;display:flex;flex-direction:column;align-items:center;gap:1px;color:var(--ink)}
.aq-nav button small{font-size:.62rem;color:var(--mute,#8a90a2)}
.aq-nav button.on{background:color-mix(in srgb,var(--accent) 16%,transparent)}
.aq-nav button.on small{color:var(--ink);font-weight:700}
.aq-nav i{position:absolute;top:2px;right:18%;min-width:.95rem;height:.95rem;border-radius:99px;background:#ef5b6b;color:#fff;font:700 .6rem/.95rem system-ui,sans-serif;font-style:normal;text-align:center;padding:0 3px}
.aq-pulse{animation:aqp 1.2s ease-in-out infinite}
@keyframes aqp{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}
.aq-tut{display:flex;gap:.6rem;align-items:center;background:linear-gradient(135deg,#ffe9a8,#ffd0e0);color:#3a2a1a;border-radius:14px;padding:.55rem .7rem;margin:.2rem 0 .5rem;font-size:.9rem;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.aq-tut b{display:block}
.aq-tut button{flex:none;border:0;background:rgba(255,255,255,.65);color:#3a2a1a;border-radius:99px;padding:.25rem .6rem;font-size:.75rem}
.aq-cvbox{border-radius:18px;overflow:hidden;border:3px solid #28324a;background:#0c1830;box-shadow:0 6px 20px rgba(0,0,0,.2);line-height:0;touch-action:manipulation}
.aq-cvbox canvas{width:100%;display:block;cursor:pointer}
.aq-chips{display:flex;gap:.35rem;overflow-x:auto;padding:.1rem .1rem .45rem;scrollbar-width:none}
.aq-chip{flex:none;border-radius:99px;padding:.3rem .7rem;font-size:.9rem;white-space:nowrap}
.aq-chip.on{background:var(--accent);color:#fff;border-color:var(--accent)}
.aq-card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:.7rem;margin:.55rem 0}
.aq-card h3{margin:0 0 .4rem;font-size:1rem;display:flex;align-items:center;gap:.4rem}
.aq-h{margin:.9rem .2rem .3rem;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:var(--mute,#8a90a2);font-weight:700}
.aq-bars{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin:.55rem 0 .2rem}
.aq-bars span{font-size:.78rem;color:var(--mute,#8a90a2)}
.aq-bar{display:block;height:10px;background:var(--line);border-radius:9px;overflow:hidden;margin-top:2px}
.aq-bar b{display:block;height:100%;border-radius:9px;background:var(--accent);transition:width .5s}
.aq-bar.w b{background:#3aa6d9}.aq-bar.f b{background:#f2a33a}.aq-bar.g b{background:#4caf7a}
.aq-act{display:flex;gap:.4rem;flex-wrap:wrap;margin:.45rem 0}
.aq-act button{flex:1;min-width:6.5rem}
.aq-btn{border-radius:12px;padding:.5rem .8rem;font-weight:600}
.aq-btn[disabled]{opacity:.45;cursor:default}
.aq-btn.pri{background:var(--accent);border-color:var(--accent);color:#fff}
.aq-line{font-size:.82rem;color:var(--mute,#8a90a2);margin:.2rem 0}
.aq-row{display:flex;align-items:center;gap:.6rem;padding:.45rem 0;border-top:1px solid var(--line)}
.aq-row:first-of-type{border-top:0}
.aq-ico{width:56px;height:38px;object-fit:contain;flex:none;border-radius:10px;background:linear-gradient(#cfeefa,#8fd0e8)}
.aq-ico.emo{display:flex;align-items:center;justify-content:center;font-size:1.4rem}
.aq-rm{flex:1;min-width:0;line-height:1.25}
.aq-rm b{display:block;font-size:.95rem}
.aq-rm small{display:block;font-size:.76rem;color:var(--mute,#8a90a2)}
.aq-rb{display:flex;gap:.3rem;flex:none}
.aq-rb button{padding:.4rem .6rem;border-radius:10px;font-size:.85rem;white-space:nowrap}
.aq-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.45rem}
.aq-dc{border:1px solid var(--line);background:var(--card);border-radius:14px;padding:.5rem .3rem;text-align:center;font-size:.78rem;line-height:1.25;color:var(--ink)}
.aq-dc.has{outline:2px solid var(--accent);outline-offset:-2px}
.aq-dc em{display:block;font-style:normal;font-size:1.5rem}
.aq-dc small{display:block;color:var(--mute,#8a90a2);font-size:.7rem}
.aq-book{display:grid;grid-template-columns:repeat(3,1fr);gap:.45rem}
.aq-bk{border:1px solid var(--line);background:var(--card);border-radius:14px;padding:.4rem .2rem;text-align:center;font-size:.74rem;color:var(--ink);line-height:1.2}
.aq-bk img{width:100%;height:46px;object-fit:contain;border-radius:8px;background:linear-gradient(#cfeefa,#8fd0e8);display:block;margin-bottom:.2rem}
.aq-bk.unk img{filter:brightness(0);opacity:.28}
.aq-bk.unk{color:var(--mute,#8a90a2)}
.aq-bk .r1{color:#3aa6d9}.aq-bk .r2{color:#9b59d6}.aq-bk .r3{color:#e6a100}
.aq-prog{height:12px;background:var(--line);border-radius:9px;overflow:hidden}
.aq-prog b{display:block;height:100%;background:linear-gradient(90deg,#3aa6d9,#4cd4b0);border-radius:9px;transition:width .4s}
.aq-modal{position:fixed;inset:0;z-index:60;background:rgba(10,16,30,.55);display:flex;align-items:flex-end;justify-content:center;padding:0}
.aq-mbox{background:var(--card);color:var(--ink);width:100%;max-width:520px;border-radius:22px 22px 0 0;padding:1rem 1rem calc(1rem + env(safe-area-inset-bottom,0px));max-height:88vh;overflow:auto;animation:aqup .25s ease-out}
@keyframes aqup{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
.aq-mbox h2{margin:.1rem 0 .5rem;font-size:1.2rem}
.aq-mbox canvas{width:100%;border-radius:14px;display:block;margin-bottom:.5rem}
.aq-toast{position:fixed;left:50%;bottom:7.8rem;transform:translateX(-50%);z-index:70;background:#1f2330;color:#fff;border-radius:99px;padding:.5rem .95rem;font-size:.88rem;max-width:90vw;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.3);animation:aqup .2s ease-out;pointer-events:none}
.aq-tag{display:inline-block;border-radius:99px;padding:.05rem .5rem;font-size:.7rem;background:var(--line);margin-left:.3rem}
.aq-tag.new{background:#ffd23f;color:#3a2a1a}
.aq-warn{color:#d9822b}
.aq-sick{color:#d9534f;font-weight:700}
.aq-two{display:grid;grid-template-columns:1fr 1fr;gap:.45rem}
.aq-ach{display:grid;grid-template-columns:repeat(5,1fr);gap:.35rem}
.aq-ach div{text-align:center;font-size:1.5rem;padding:.35rem 0;border-radius:12px;background:var(--line);opacity:.45}
.aq-ach div.on{opacity:1;background:color-mix(in srgb,var(--accent) 18%,var(--card))}
.aq-ship{display:flex;align-items:center;gap:.6rem}
.aq-ship .aq-bar{flex:1}
`;

/* =====================================================================
   8. DE VIEW
   ===================================================================== */
const TABS = [['tank', '🐠', 'Tank'], ['park', '🏗️', 'Park'], ['reis', '🧭', 'Reizen'], ['boek', '📖', 'Boek'], ['doel', '🎯', 'Doelen'], ['parel', '🦪', 'Parels']];
const rnd = (a, b) => a + Math.random() * (b - a);
const fmtTime = (s) => { s = Math.max(0, Math.ceil(s)); if (s >= 3600) return `${Math.floor(s / 3600)}u ${String(Math.floor(s % 3600 / 60)).padStart(2, '0')}m`; if (s >= 60) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`; return `${s}s`; };
const pct = (x) => Math.round(x * 100);

export async function aquariumView(ctx) {
  const { db, view, addCleanup } = ctx;
  const U = String(ctx.uid || 'anon');
  const lsKey = `big:aquarium:${U}`;
  const docRef = () => doc(db, 'gamesaves', 'big-aquarium__' + U);
  if (!document.getElementById('aq-style')) { const st = document.createElement('style'); st.id = 'aq-style'; st.textContent = CSS; document.head.appendChild(st); }
  view.classList.add('aq-root');
  view.innerHTML = '<div class="aq-load">🐠 Aquarium laden…</div>';

  let S = null, destroyed = false, lastLocal = 0, lastCloud = Date.now(), lastForced = 0, cloudBusy = false;
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
  const sound = makeSound();

  /* ---------- opslag ---------- */
  function readLocal() {
    try { const o = JSON.parse(localStorage.getItem(lsKey) || 'null'); if (!o || !o.d) return null; const s = parseSave(o.d); return s ? { s, at: +o.u || s.at || 0 } : null; } catch (e) { return null; }
  }
  function writeLocal() { try { if (S) { S.at = Date.now(); localStorage.setItem(lsKey, JSON.stringify({ u: S.at, d: serialize(S) })); } } catch (e) { /* vol of geblokkeerd */ } }
  async function readCloud() {
    try { const sn = await getDoc(docRef()); if (!sn.exists()) return null; const d = sn.data() || {}; const s = parseSave(d.data); return s ? { s, at: +d.updated || s.at || 0 } : null; } catch (e) { return null; }
  }
  async function writeCloud(force) {
    if (!S || cloudBusy) return;
    const now = Date.now();
    if (!force && now - lastCloud < CLOUD_EVERY) return;
    if (force === 'soft' && now - lastForced < 15000) return;
    lastCloud = now; if (force) lastForced = now;
    try {
      cloudBusy = true; S.at = now;
      const data = serialize(S); if (data.length > MAX_DATA) return;
      await setDoc(docRef(), { game: 'big-aquarium', uid: U, data, updated: now });
    } catch (e) { /* stil: lokaal staat het veilig */ } finally { cloudBusy = false; }
  }

  /* ---------- opstarten ---------- */
  const local = readLocal();
  const cloudP = readCloud();
  let first = local;
  if (!first) first = await Promise.race([cloudP, new Promise((r) => setTimeout(() => r(null), 4500))]);
  if (destroyed) return;
  S = first ? first.s : newState();
  const isNew = !first, loadedAt = first ? first.at : 0;
  let away = null;
  {
    const now = Date.now(), gap = (now - (S.last || S.at || now)) / 1000;
    if (gap > 45) { const before = S.c; const info = applyOffline(S, gap); info.coinsBefore = before; away = info; }
    S.last = now;
  }
  sound.on = !!S.snd;

  /* ---------- toestand van de UI ---------- */
  let tab = 'tank', ti = 0, bookFilter = 'all', prestConfirm = false, modalOpen = false, modalCv = null, modalSp = null;
  let goalSeen = new Set(Object.keys(S.gl)), expSeen = new Set(), tabsVisited = new Set(['tank']);
  let lastTopC = '', lastSig = '';
  checkAch(S); GOALS.forEach((g) => { if (g[2](S) >= g[3]) goalSeen.add(g[0]); });

  /* ---------- canvas-wereld ---------- */
  const cv = document.createElement('canvas'); cv.setAttribute('aria-label', 'Je aquarium: tik om de dieren te voeren');
  const g = cv.getContext('2d');
  let CW = 360, CH = 252, dpr = 1, u = 1, LAY = layoutOf('zoet', 360, 252);
  const Wd = { ents: [], food: [], parts: [], bubbles: [], vis: [], school: {}, t: 0, sig: '' };
  const ptr = { x: 0, y: 0, t: -99 };
  function resize() {
    const par = cv.parentNode; const w = Math.round(Math.max(200, (par && par.clientWidth) || view.clientWidth || 360));
    dpr = Math.min(2, window.devicePixelRatio || 1); CW = w; CH = Math.round(w * 0.7); u = CW / 360;
    cv.width = Math.round(CW * dpr); cv.height = Math.round(CH * dpr); cv.style.height = CH + 'px';
    const t = S.T[ti]; LAY = layoutOf(t ? t.k : 'zoet', CW, CH);
    Wd.bubbles = []; for (let i = 0; i < 14; i++) Wd.bubbles.push({ x: rnd(0, CW), y: rnd(LAY.top, LAY.floorY), r: rnd(1, 3.2), s: rnd(8, 22), p: rnd(0, 6) });
  }
  const sigOf = (t) => ti + t.k + JSON.stringify(t.a) + t.d.join(',') + t.l;
  function mkEnt(sp, i) {
    const t = S.T[ti], e = { key: sp.id + '#' + i, sp, k: rnd(0.92, 1.08), x: rnd(30, CW - 30), y: rnd(LAY.top + 30, LAY.floorY - 20), vx: 0, vy: 0, fx: Math.random() < 0.5 ? 1 : -1, tx: 0, ty: 0, stT: rnd(0, 2), ph: rnd(0, 20), ox: rnd(-34, 34), oy: rnd(-22, 22), mode: 'swim', ps: 'land', phT: rnd(6, 14), sp0: 0 };
    if (sp.beh === 'floor') e.y = LAY.floorY - 6 * u;
    if (sp.beh === 'ping' && LAY.shelf) { e.x = rnd(14, LAY.shelf.x1 - 20) * 1; e.y = LAY.shelf.y - 20 * sp.sc * u; e.mode = 'walk'; }
    return e;
  }
  function syncEnts() {
    const t = S.T[ti]; if (!t) return;
    LAY = layoutOf(t.k, CW, CH); Wd.sig = sigOf(t);
    const old = new Map(Wd.ents.map((e) => [e.key, e])), out = [];
    for (const id of Object.keys(t.a)) {
      const n = t.a[id]; if (!(n > 0)) continue; const sp = SPM[id];
      const show = Math.min(18, n <= 8 ? n : 8 + Math.floor((n - 8) / 3));
      for (let i = 0; i < show && out.length < 34; i++) { const key = id + '#' + i; out.push(old.get(key) || mkEnt(sp, i)); }
    }
    Wd.ents = out; Wd.food.length = 0;
  }
  function addPart(x, y, txt, kind) { if (Wd.parts.length < 40) Wd.parts.push({ x, y, txt, kind: kind || 'up', life: 1.4, vy: -26 * u, vx: rnd(-8, 8) * u }); }

  function updEnt(e, dt) {
    const sp = e.sp, lay = LAY, m = 12 * u, t = Wd.t;
    const bx0 = m, bx1 = CW - m, by0 = lay.top + 14 * u, by1 = lay.floorY - 10 * u;
    const sz = sp.sc * u;
    e.stT -= dt;
    const pt = (t - ptr.t < 2.5 / 1) ? ptr : null;
    let tx = e.tx, ty = e.ty, spd = 26 * u, eating = false;
    const pick = () => { e.tx = rnd(bx0 + 20, bx1 - 20); e.ty = rnd(by0 + 10, by1 - 6); };
    // eten
    let fd = null;
    if (sp.beh !== 'floor' && sp.beh !== 'hover' && Wd.food.length && !(sp.beh === 'ping' && e.ps !== 'swim')) {
      let bd = 1e9; for (const f of Wd.food) { const d = Math.hypot(f.x - e.x, f.y - e.y); if (d < bd) { bd = d; fd = f; } }
      if (fd && bd < 220 * u) { eating = true; tx = fd.x; ty = fd.y; spd = 44 * u; if (bd < 10 * u + sz * 8) { fd.eaten = true; addPart(e.x, e.y - 8 * u, '💗'); } } else fd = null;
    }
    if (!eating) {
      switch (sp.beh) {
        case 'school': {
          const s = Wd.school[sp.id]; tx = s.x + e.ox * u; ty = s.y + e.oy * u; spd = 30 * u; break;
        }
        case 'roam': if (e.stT <= 0 || Math.hypot(e.tx - e.x, e.ty - e.y) < 12 * u) { pick(); e.stT = rnd(3, 7); } tx = e.tx; ty = e.ty; spd = 22 * u; break;
        case 'shy': {
          if (e.stT <= 0) { e.tx = rnd(bx0 + 20, bx1 - 20); e.ty = rnd(by1 - 50 * u, by1); e.stT = rnd(4, 9); }
          tx = e.tx; ty = e.ty; spd = 16 * u;
          if (pt && Math.hypot(pt.x - e.x, pt.y - e.y) < 90 * u) { const a = Math.atan2(e.y - pt.y, e.x - pt.x); tx = e.x + Math.cos(a) * 80 * u; ty = e.y + Math.sin(a) * 60 * u; spd = 70 * u; }
          break;
        }
        case 'curious': {
          if (pt) { const a = e.ph + t * 1.6; tx = pt.x + Math.cos(a) * 36 * u; ty = pt.y + Math.sin(a) * 26 * u; spd = 40 * u; }
          else { if (e.stT <= 0 || Math.hypot(e.tx - e.x, e.ty - e.y) < 12 * u) { pick(); e.stT = rnd(3, 7); } tx = e.tx; ty = e.ty; spd = 22 * u; }
          break;
        }
        case 'cruise': {
          if (e.stT <= 0 || Math.abs(e.tx - e.x) < 20 * u) { e.tx = e.x < CW / 2 ? rnd(CW * 0.7, bx1) : rnd(bx0, CW * 0.3); e.ty = rnd(by0 + 20 * u, by1 - 20 * u); e.stT = rnd(8, 16); }
          tx = e.tx; ty = e.ty; spd = 24 * u; break;
        }
        case 'hover': {
          if (e.stT <= 0 || Math.hypot(e.tx - e.x, e.ty - e.y) < 14 * u) { e.tx = clamp(e.x + rnd(-80, 80) * u, bx0 + 10, bx1 - 10); e.ty = rnd(by0 + 15 * u, by1 - 30 * u); e.stT = rnd(5, 10); }
          tx = e.tx; ty = e.ty + Math.sin(t * 1.3 + e.ph) * 10 * u; spd = 9 * u; break;
        }
        case 'floor': {
          if (e.stT <= 0) { e.tx = rnd(bx0 + 16, bx1 - 16); e.stT = rnd(4, 12); e.sp0 = Math.random() < 0.4 ? 0 : 1; }
          tx = e.sp0 ? e.tx : e.x; ty = lay.floorY - 6 * u; spd = 9 * u; break;
        }
        case 'ping': {
          const sh = lay.shelf, landY = sh ? sh.y - 19 * sz : by1, edgeX = sh ? sh.x1 - 16 * u : 40;
          if (!sh) { tx = e.tx; ty = e.ty; break; }
          e.phT -= dt;
          if (e.ps === 'land') {
            e.mode = 'walk'; ty = landY;
            if (e.stT <= 0) { e.tx = rnd(14 * u, edgeX - 10 * u); e.stT = rnd(2.5, 6); e.sp0 = Math.random() < 0.6 ? 1 : 0; }
            tx = e.sp0 ? e.tx : e.x; spd = 11 * u;
            if (e.phT <= 0) { e.ps = 'toedge'; }
          } else if (e.ps === 'toedge') {
            e.mode = 'walk'; tx = edgeX; ty = landY; spd = 16 * u;
            if (Math.abs(e.x - edgeX) < 5 * u) { e.ps = 'swim'; e.phT = rnd(10, 20); e.mode = 'swim'; e.vy = 30 * u; e.vx = 20 * u; }
          } else if (e.ps === 'swim') {
            e.mode = 'swim';
            if (e.stT <= 0 || Math.hypot(e.tx - e.x, e.ty - e.y) < 14 * u) { e.tx = rnd(sh.x1 + 24 * u, bx1 - 10); e.ty = rnd(sh.y + 24 * u, by1 - 10); e.stT = rnd(2.5, 5); }
            tx = e.tx; ty = e.ty; spd = 34 * u;
            if (e.phT <= 0) e.ps = 'back';
          } else { // back
            e.mode = 'swim'; tx = sh.x1 + 8 * u; ty = sh.y + 10 * u; spd = 30 * u;
            if (Math.hypot(e.x - tx, e.y - ty) < 12 * u) { e.ps = 'land'; e.mode = 'walk'; e.phT = rnd(10, 20); e.x = sh.x1 - 12 * u; e.y = landY; e.vx = e.vy = 0; }
          }
          break;
        }
        default: break;
      }
    }
    // beweging
    const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy) || 1;
    const sp2 = Math.min(spd, d * 2.4);
    const k = Math.min(1, dt * (sp.beh === 'floor' ? 3 : 2.2));
    e.vx += (dx / d * sp2 - e.vx) * k; e.vy += (dy / d * sp2 - e.vy) * k;
    if (sp.beh === 'floor' || (sp.beh === 'ping' && e.mode === 'walk')) { e.y += (ty - e.y) * Math.min(1, dt * 6); e.vy = 0; }
    e.x += e.vx * dt; e.y += e.vy * dt;
    const swimMode = !(sp.beh === 'floor' || (sp.beh === 'ping' && e.mode === 'walk'));
    if (swimMode) { e.x = clamp(e.x, bx0, bx1); e.y = clamp(e.y, (sp.beh === 'ping' && lay.shelf ? lay.top : by0), by1); }
    else e.x = clamp(e.x, bx0, sp.beh === 'ping' && lay.shelf ? lay.shelf.x1 - 6 * u : bx1);
    const want = Math.abs(e.vx) > 3 * u ? Math.sign(e.vx) : Math.sign(e.fx) || 1;
    e.fx += (want - e.fx) * Math.min(1, dt * 6);
    e.sv = Math.min(1, Math.hypot(e.vx, e.vy) / (50 * u));
  }
  function updateWorld(dt) {
    const t = S.T[ti]; if (!t) return;
    if (Wd.sig !== sigOf(t)) syncEnts();
    Wd.t += dt;
    // scholen
    const seen = {};
    for (const e of Wd.ents) if (e.sp.beh === 'school') seen[e.sp.id] = 1;
    for (const id in seen) {
      let s = Wd.school[id]; if (!s) s = Wd.school[id] = { x: rnd(60, CW - 60), y: rnd(LAY.top + 40, LAY.floorY - 40), t: 0 };
      s.t -= dt; if (s.t <= 0) { s.x = rnd(60 * u, CW - 60 * u); s.y = rnd(LAY.top + 40 * u, LAY.floorY - 40 * u); s.t = rnd(5, 9); }
    }
    for (const e of Wd.ents) updEnt(e, dt);
    for (const f of Wd.food) { f.age += dt; f.y = Math.min(LAY.floorY - 4 * u, f.y + 24 * u * dt); f.x += Math.sin(f.age * 3 + f.p) * 6 * dt; }
    Wd.food = Wd.food.filter((f) => !f.eaten && f.age < 14);
    for (const b of Wd.bubbles) { b.y -= b.s * dt * u; b.x += Math.sin(Wd.t * 1.5 + b.p) * 6 * dt; if (b.y < LAY.top + 4) { b.y = LAY.floorY - 4; b.x = rnd(0, CW); } }
    for (const p of Wd.parts) { p.life -= dt; p.y += p.vy * dt; p.x += p.vx * dt; }
    Wd.parts = Wd.parts.filter((p) => p.life > 0);
    // bezoekers
    if (Wd.t - (Wd.ecoT || -9) > 0.6) { Wd.vpsC = economy(S).vps; Wd.ecoT = Wd.t; }
    const target = clamp(Math.round(Math.sqrt(Wd.vpsC || 0.3) * 4), 1, 9);
    if (Wd.vis.length < target && Math.random() < dt * 0.8) { const dir = Math.random() < 0.5 ? 1 : -1; Wd.vis.push({ x: dir > 0 ? -20 : CW + 20, dir, s: rnd(14, 28), h: rnd(0.85, 1.15), c: ['#e0654f', '#4f8fe0', '#e0b84f', '#6fbf73', '#b86fe0', '#e07fa6'][Math.floor(Math.random() * 6)], kid: Math.random() < 0.35, ph: rnd(0, 9), bal: Math.random() < 0.3 }); }
    for (const v of Wd.vis) v.x += v.dir * v.s * u * dt;
    Wd.vis = Wd.vis.filter((v) => v.x > -40 && v.x < CW + 40 && (Wd.vis.length <= target + 2 || Math.random() > 0.01));
    if (Math.random() < dt * 0.4 && sound.on && tab === 'tank') sound.play('bloop');
  }
  function drawWorld() {
    const t = S.T[ti]; if (!t) return;
    if ((Wd.fc = (Wd.fc || 0) + 1) % 40 === 0 && cv.parentNode && Math.abs(cv.parentNode.clientWidth - CW) > 2 && cv.parentNode.clientWidth > 100) { resize(); syncEnts(); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = CW, H = CH, T = Wd.t;
    drawBG(g, t.k, W, H, T, LAY);
    // decoraties
    t.d.forEach((id, i) => { if (id === 'lamp') return; drawDeco(g, id, decoSlotX(i, W) * 1, LAY.floorY + 2, T, i, W, LAY.top); });
    for (const b of Wd.bubbles) { g.beginPath(); g.arc(b.x, b.y, b.r * u, 0, TAU); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1; g.stroke(); }
    const ents = Wd.ents.slice().sort((a, b) => (a.sp.beh === 'floor' ? 0 : 1) - (b.sp.beh === 'floor' ? 0 : 1));
    for (const e of ents) {
      const sp = e.sp, s = sp.sc * u * e.k;
      g.save(); g.translate(e.x, e.y);
      const upright = ART_UPRIGHT[sp.art] && !(sp.art === 'penguin' && e.mode === 'swim');
      if (!upright && !(sp.beh === 'floor')) g.rotate(clamp(Math.atan2(e.vy, Math.abs(e.vx) + 10 * u) * 0.7, -0.5, 0.5) * (Math.sign(e.fx) || 1));
      g.scale(e.fx * s, s);
      drawCreature(g, sp, T * 1 + e.ph, e.sv || 0, e.mode);
      g.restore();
    }
    t.d.forEach((id, i) => { if (id === 'lamp') drawDeco(g, id, 0, 0, T, i, W, LAY.top); });
    for (const f of Wd.food) { g.beginPath(); g.arc(f.x, f.y, 2.4 * u, 0, TAU); g.fillStyle = '#f2b36b'; g.fill(); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const p of Wd.parts) {
      g.globalAlpha = clamp(p.life, 0, 1);
      if (p.txt.startsWith('+')) { g.font = `700 ${13 * u}px system-ui,sans-serif`; g.fillStyle = '#ffe28a'; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 3; g.strokeText(p.txt, p.x, p.y); g.fillText(p.txt, p.x, p.y); }
      else { g.font = `${14 * u}px serif`; g.fillText(p.txt, p.x, p.y); }
      g.globalAlpha = 1;
    }
    // glasglans
    g.save(); g.globalAlpha = 0.07; poly(g, [[W * 0.06, 0], [W * 0.16, 0], [W * 0.02, LAY.floorY], [0, LAY.floorY]], '#fff'); g.restore();
    if (t.s) { g.fillStyle = `rgba(200,60,60,${0.1 + 0.05 * Math.sin(T * 3)})`; g.fillRect(0, 0, W, LAY.floorY + 4); }
    // hal met bezoekers
    const hy = H * 0.885;
    const hg = g.createLinearGradient(0, hy, 0, H); hg.addColorStop(0, '#2b3550'); hg.addColorStop(1, '#161c2e'); g.fillStyle = hg; g.fillRect(0, hy, W, H - hy);
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, hy, W, 2);
    for (const v of Wd.vis) {
      const s = u * v.h * (v.kid ? 0.7 : 1), bob = Math.abs(Math.sin(T * 6 + v.ph)) * 1.6 * u, by = H - 3 * u;
      g.fillStyle = 'rgba(8,10,20,0.78)';
      const lw = Math.sin(T * 6 + v.ph) * 3 * s;
      g.fillRect(v.x - 4 * s + lw, by - 11 * s, 3 * s, 11 * s); g.fillRect(v.x + 1 * s - lw, by - 11 * s, 3 * s, 11 * s);
      g.beginPath(); g.roundRect ? g.roundRect(v.x - 6 * s, by - 26 * s - bob, 12 * s, 17 * s, 4 * s) : g.rect(v.x - 6 * s, by - 26 * s - bob, 12 * s, 17 * s); g.fill();
      g.beginPath(); g.arc(v.x, by - 30 * s - bob, 5 * s, 0, TAU); g.fill();
      g.fillStyle = v.c; g.globalAlpha = 0.8; g.fillRect(v.x - 6 * s, by - 20 * s - bob, 12 * s, 3 * s); g.globalAlpha = 1;
      if (v.bal) { g.beginPath(); g.moveTo(v.x + 5 * s, by - 20 * s - bob); g.lineTo(v.x + 9 * s, by - 40 * s); g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 0.8; g.stroke(); g.beginPath(); g.arc(v.x + 9 * s, by - 44 * s, 4.5 * s, 0, TAU); g.fillStyle = v.c; g.fill(); }
    }
  }
  function drawModal() {
    if (!modalCv || !modalCv.isConnected || !modalSp) return;
    const c = modalCv.getContext('2d'); if (!c) return;
    const w = modalCv.width, h = modalCv.height, sp = modalSp, T = performance.now() / 1000;
    const tt = TT[sp.hab];
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, tt.sky[0]); gr.addColorStop(0.5, tt.sky[1]); gr.addColorStop(1, tt.sky[2]); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = tt.sand; c.fillRect(0, h * 0.86, w, h * 0.14);
    const ext = { shark: 76, narwal: 110, ray: 52, seal: 58, lobster: 62, eel: 66, turtle: 56 }[sp.art] || 48, k = Math.min(3, (w * 0.62) / ext);
    c.save(); c.translate(w / 2 + Math.sin(T * 0.8) * w * 0.05, h * 0.5 + Math.sin(T * 1.3) * 6); c.scale(k, k);
    if (sp.beh === 'floor') c.translate(0, h * 0.14 / k * 1.6);
    drawCreature(c, sp, T, 0.3, 'walk'); c.restore();
  }

  /* ---------- UI helpers ---------- */
  const $ = (sel, root = view) => root.querySelector(sel);
  function toast(msg) {
    const old = $('.aq-toast'); if (old) old.remove();
    const el = document.createElement('div'); el.className = 'aq-toast'; el.textContent = msg; view.appendChild(el);
    later(() => { if (el.parentNode) el.remove(); }, 2600);
  }
  function openModal(html) {
    closeModal(); modalOpen = true;
    const m = document.createElement('div'); m.className = 'aq-modal'; m.innerHTML = `<div class="aq-mbox">${html}<div style="margin-top:.7rem"><button class="aq-btn pri" data-a="mclose" style="width:100%">Mooi, verder!</button></div></div>`;
    view.appendChild(m);
  }
  function closeModal() { const m = $('.aq-modal'); if (m) m.remove(); modalOpen = false; modalCv = null; modalSp = null; }
  const iconHTML = (id, cls = 'aq-ico') => { const url = iconURL(id); return url ? `<img class="${cls}" alt="" src="${url}">` : `<div class="${cls} emo">${SPM[id].e}</div>`; };
  const costBtn = (label, cost, attrs, extra = '') => `<button class="aq-btn ${extra}" data-cost="${cost}" ${S.c < cost ? 'disabled' : ''} ${attrs}>${label} 🪙${fmt(cost)}</button>`;
  const tankName = (t, i) => `${TT[t.k].e} ${TT[t.k].n}${S.T.filter((x) => x.k === t.k).length > 1 ? ' ' + (S.T.filter((x, j) => x.k === t.k && j <= i).length) : ''}`;
  function autoPlace(id) {
    const sp = SPM[id];
    const order = S.T.map((t, i) => i).sort((a, b) => (a === ti ? -1 : 0) - (b === ti ? -1 : 0));
    for (const i of order) if (S.T[i].k === sp.hab && tankUnits(S.T[i]) + sp.sz <= tankCap(S.T[i])) { const r = placeFromInv(S, i, id); if (r.ok) return i; }
    return -1;
  }

  /* ---------- tabs ---------- */
  function tabTank() {
    return `<div class="aq-chips" id="aqChips"></div><div class="aq-cvbox" id="aqCv"></div><div id="aqStat"></div><div id="aqList"></div>`;
  }
  function chipsHTML() {
    return S.T.map((t, i) => `<button class="aq-chip ${i === ti ? 'on' : ''}" data-a="sel" data-i="${i}">${TT[t.k].e} ${i + 1}${t.s ? ' 🤒' : ''}</button>`).join('');
  }
  function statHTML() {
    const t = S.T[ti], e = economy(S), share = e.A > 0 ? tankBase(t) * tankFactor(t) / e.A : 0;
    const u2 = tankUnits(t), cap = tankCap(t);
    const sick = t.s ? `<div class="aq-sick">🤒 Deze tank is ziek: de dieren verdienen minder. Geef medicijn!</div>` : '';
    return `<div class="aq-card"><h3>${tankName(t, ti)} <span class="aq-tag">niveau ${t.l}</span></h3>
      <div class="aq-bars"><div><span>💧 Water</span><i class="aq-bar w"><b id="aqW" style="width:${Math.round(t.w)}%"></b></i></div><div><span>🍤 Voer</span><i class="aq-bar f"><b id="aqF" style="width:${Math.round(t.f)}%"></b></i></div></div>
      ${sick}
      <div class="aq-line">Plekken ${u2}/${cap} · jouw aandeel in de inkomsten ${pct(share)}%${Object.keys(t.a).some((k) => t.a[k] >= 2) ? ' · 🍼 fokken actief' : ' · twee van dezelfde soort? Dan krijgen ze jongen'}</div>
      <div class="aq-act"><button class="aq-btn pri" data-a="feed">🍤 Voeren</button><button class="aq-btn" data-a="clean">🧽 Water verversen</button>${t.s ? costBtn('💊 Medicijn', treatCost(S, t), 'data-a="treat"') : ''}</div>
      <div class="aq-line">Tip: tik op het water om te voeren. Tik op een dier om het te aaien.</div></div>`;
  }
  function listHTML() {
    const t = S.T[ti], hab = t.k;
    const species = SP.filter((s) => s.hab === hab && (!s.xo || t.a[s.id] || S.inv[s.id]));
    let h = `<div class="aq-h">Dieren</div><div class="aq-card" style="padding:.3rem .7rem">`;
    for (const sp of species) {
      const n = t.a[sp.id] || 0, inv = S.inv[sp.id] || 0, fits = tankUnits(t) + sp.sz <= tankCap(t);
      const price = priceOf(t, sp.id);
      h += `<div class="aq-row">${iconHTML(sp.id)}<div class="aq-rm"><b>${sp.n}${sp.rar ? `<span class="aq-tag">${RAR[sp.rar]}</span>` : ''}</b><small>${n ? `×${n} in deze tank · ` : ''}${sp.sz} plek${sp.sz > 1 ? 'ken' : ''} · ✨ ${fmt(sp.ap)}</small>${inv ? `<small>📦 Voorraad: ${inv}</small>` : ''}</div><div class="aq-rb">`;
      if (n) h += `<button data-a="sell" data-id="${sp.id}" title="Naar voorraad">−</button>`;
      if (inv) h += `<button data-a="place" data-id="${sp.id}" ${fits ? '' : 'disabled'}>Plaats</button>`;
      if (!sp.xo) h += `<button class="pri" data-cost="${price}" data-a="buy" data-id="${sp.id}" ${S.c < price || !fits ? 'disabled' : ''} data-fit="${fits ? 1 : 0}">${fits ? '' : 'Vol '}🪙${fmt(price)}</button>`;
      h += `</div></div>`;
    }
    h += `</div>`;
    h += `<div class="aq-h">Decoratie (${t.d.length}/${decoSlots(t)})</div><div class="aq-grid">`;
    for (const id of Object.keys(DECO)) {
      if (!decoOk(id, hab)) continue;
      const d = DECO[id], has = t.d.includes(id), c = decoCost(t, id), full = t.d.length >= decoSlots(t);
      h += has ? `<div class="aq-dc has"><em>${d.e}</em>${d.n}<small>✓ +${pct(d.b)}%</small></div>`
        : `<button class="aq-dc" data-a="deco" data-id="${id}" data-cost="${c}" ${S.c < c || full ? 'disabled' : ''}><em>${d.e}</em>${d.n}<small>+${pct(d.b)}% · 🪙${fmt(c)}</small></button>`;
    }
    h += `</div>`;
    const lc = tankLvCost(t);
    h += `<div class="aq-card"><h3>🔧 Tank uitbreiden</h3><div class="aq-line">Niveau ${t.l}${t.l < MAX_TANK_LV ? ` → ${t.l + 1}: meer plekken (${tankCap(t)} → ${tankCap({ l: t.l + 1 })})${(t.l + 1) % 3 === 0 ? ' en een decoratieplek' : ''}` : ' (hoogste)'}</div>${t.l < MAX_TANK_LV ? costBtn('Uitbreiden', lc, 'data-a="tup"', 'pri') : ''}</div>`;
    return h;
  }
  function renderTank() {
    if (!$('#aqChips')) return;
    $('#aqChips').innerHTML = chipsHTML();
    $('#aqStat').innerHTML = statHTML();
    $('#aqList').innerHTML = listHTML();
  }

  function tabPark() {
    const e = economy(S);
    let h = `<div class="aq-card"><h3>🏛️ Je aquarium</h3>
      <div class="aq-two"><div>👥 <b>${fmt(e.vps)}</b> bezoekers/s</div><div>🎟️ <b>${fmt(e.pv)}</b> per bezoeker</div><div>🪙 <b>${fmt(e.ips)}</b> per seconde</div><div>⭐ bonus <b>x${fmt(e.M)}</b></div></div>
      <div class="aq-line">Bonus: ${S.P} parel${S.P === 1 ? '' : 'en'}, ${Object.keys(S.dc).length} ontdekte soorten, ${Object.keys(S.ach).length} prestaties.</div>
      ${e.crowded ? `<div class="aq-warn">🚪 Het is druk bij de ingang! Bouw de Toegangshal uit zodat er meer bezoekers binnenkomen.</div>` : `<div class="aq-line">De hal is rustig genoeg.</div>`}</div>`;
    h += `<div class="aq-h">Tanks (${S.T.length}/${MAX_TANKS})</div>`;
    S.T.forEach((t, i) => {
      const n = sum(t.a);
      h += `<div class="aq-card"><div class="aq-row" style="border:0;padding:0"><div class="aq-ico emo" style="background:linear-gradient(${TT[t.k].sky[0]},${TT[t.k].sky[2]})">${TT[t.k].e}</div><div class="aq-rm"><b>${tankName(t, i)}</b><small>Niveau ${t.l} · ${n} dieren · ${tankUnits(t)}/${tankCap(t)} plekken${t.s ? ' · <span class="aq-sick">ziek</span>' : ''}</small></div><div class="aq-rb"><button data-a="goto" data-i="${i}">Bekijk</button></div></div></div>`;
    });
    if (S.T.length < MAX_TANKS) {
      h += `<div class="aq-h">Nieuwe tank bouwen</div><div class="aq-grid">`;
      for (const k of TT_KEYS) { const c = buildCost(S, k); h += `<button class="aq-dc" data-a="build" data-k="${k}" data-cost="${c}" ${S.c < c ? 'disabled' : ''}><em>${TT[k].e}</em>${TT[k].n}<small>🪙${fmt(c)}</small></button>`; }
      h += `</div>`;
    }
    const groups = [['inc', 'Inkomsten'], ['zorg', 'Zorg en fokken'], ['staf', 'Personeel'], ['reis', 'Expedities']];
    for (const [gk, gn] of groups) {
      h += `<div class="aq-h">${gn}</div><div class="aq-card" style="padding:.3rem .7rem">`;
      for (const id of UP_KEYS) {
        const up = UP[id]; if (up.g !== gk) continue;
        const lv = S.up[id] || 0, maxed = lv >= up.max, c = upCost(S, id);
        const built = (id === 'shop' || id === 'cafe') && lv === 0 ? 'Bouwen' : (up.max === 1 ? 'Aannemen' : 'Verbeteren');
        h += `<div class="aq-row"><div class="aq-ico emo" style="background:var(--line)">${up.e}</div><div class="aq-rm"><b>${up.n}${up.max > 1 ? ` <span class="aq-tag">niveau ${lv}</span>` : lv ? '<span class="aq-tag">✓</span>' : ''}</b><small>${up.d}</small></div><div class="aq-rb">${maxed ? '<small>Max</small>' : `<button class="pri" data-a="up" data-id="${id}" data-cost="${c}" ${S.c < c ? 'disabled' : ''}>${built} 🪙${fmt(c)}</button>`}</div></div>`;
      }
      h += `</div>`;
    }
    return h;
  }

  function tabReis() {
    const now = Date.now();
    let h = `<div class="aq-card"><h3>🧭 Expedities</h3><div class="aq-line">Stuur een schip weg om zeldzame dieren te vinden. Het schip vaart ook door als je weg bent. Plekken: ${S.x.length}/${expSlots(S)}.</div>`;
    S.x.forEach((x, i) => {
      const r = REGM[x.r], done = x.t1 <= now;
      h += `<div class="aq-ship" style="margin:.5rem 0"><span style="font-size:1.4rem">${r.e}</span><div style="flex:1"><b>${r.n}</b><i class="aq-bar g"><b data-ship="${i}" data-t0="${x.t0}" data-t1="${x.t1}" style="width:${pct(clamp((now - x.t0) / (x.t1 - x.t0), 0, 1))}%"></b></i><small class="aq-line" data-shiptxt="${i}">${done ? 'Klaar!' : 'Nog ' + fmtTime((x.t1 - now) / 1000)}</small></div>${done ? `<button class="aq-btn pri" data-a="collect" data-i="${i}">Binnenhalen</button>` : ''}</div>`;
    });
    if (!S.x.length) h += `<div class="aq-line">Er vaart nu geen schip.</div>`;
    h += `</div><div class="aq-h">Bestemmingen</div>`;
    for (const r of REGIONS) {
      const dur = expDur(S, r), loot = Object.keys(r.loot);
      const free = S.x.length < expSlots(S);
      h += `<div class="aq-card"><div class="aq-row" style="border:0;padding:0"><div class="aq-ico emo" style="background:var(--line)">${r.e}</div><div class="aq-rm"><b>${r.n}</b><small>Duur ${fmtTime(dur)}${S.st.exps === 0 && !S.x.length ? ' (eerste reis is kort)' : ''}</small></div><div class="aq-rb"><button class="pri" data-a="exp" data-id="${r.id}" data-cost="${r.cost}" ${S.c < r.cost || !free ? 'disabled' : ''}>Vertrek 🪙${fmt(r.cost)}</button></div></div>
        <div style="display:flex;gap:.3rem;margin-top:.5rem;flex-wrap:wrap">${loot.map((id) => S.dc[id] ? `<img class="aq-ico" style="width:46px;height:32px" src="${iconURL(id)}" alt="${SPM[id].n}" title="${SPM[id].n}">` : `<div class="aq-ico emo" style="width:46px;height:32px;font-size:1rem;background:var(--line)">❔</div>`).join('')}</div></div>`;
    }
    const inv = Object.keys(S.inv);
    h += `<div class="aq-h">Voorraad</div><div class="aq-card" style="padding:.3rem .7rem">`;
    if (!inv.length) h += `<div class="aq-line">Je voorraad is leeg. Gevonden dieren komen hier terecht als er geen plek is.</div>`;
    for (const id of inv) { const sp = SPM[id]; h += `<div class="aq-row">${iconHTML(id)}<div class="aq-rm"><b>${sp.n} ×${S.inv[id]}</b><small>Woont in: ${TT[sp.hab].n}</small></div><div class="aq-rb"><button class="pri" data-a="autoplace" data-id="${id}">Plaats</button></div></div>`; }
    h += `</div>`;
    return h;
  }

  function tabBoek() {
    const total = SP.length, got = Object.keys(S.dc).length;
    let h = `<div class="aq-card"><h3>📖 Encyclopedie <span class="aq-tag">${got}/${total}</span></h3><div class="aq-prog"><b style="width:${pct(got / total)}%"></b></div><div class="aq-line">Elke ontdekte soort geeft +1% inkomsten voor altijd.</div></div>`;
    h += `<div class="aq-chips"><button class="aq-chip ${bookFilter === 'all' ? 'on' : ''}" data-a="bfilter" data-k="all">Alle</button>${TT_KEYS.map((k) => `<button class="aq-chip ${bookFilter === k ? 'on' : ''}" data-a="bfilter" data-k="${k}">${TT[k].e}</button>`).join('')}</div><div class="aq-book">`;
    for (const sp of SP) {
      if (bookFilter !== 'all' && sp.hab !== bookFilter) continue;
      const known = !!S.dc[sp.id];
      h += `<button class="aq-bk ${known ? '' : 'unk'}" data-a="detail" data-id="${sp.id}">${iconHTML(sp.id, '')}<b>${known ? sp.n : '???'}</b>${known && sp.rar ? `<div class="r${sp.rar}">${RAR[sp.rar]}</div>` : ''}</button>`;
    }
    return h + `</div>`;
  }
  function detailHTML(id) {
    const sp = SPM[id], known = !!S.dc[id];
    if (!known) return `<h2>❔ Nog onbekend</h2><div class="aq-line">Dit dier zit in de ${TT[sp.hab].n.toLowerCase()}-wereld. ${sp.xo ? 'Je vindt het op een expeditie.' : 'Je kunt het kopen als je een passende tank hebt.'}</div>`;
    const own = S.T.reduce((a, t) => a + (t.a[id] || 0), 0);
    return `<canvas width="440" height="260" id="aqDetCv"></canvas><h2>${sp.n} <span class="aq-tag">${RAR[sp.rar]}</span></h2>
      <div class="aq-line">${TT[sp.hab].e} ${TT[sp.hab].n} · ${sp.sz} plek${sp.sz > 1 ? 'ken' : ''} · ✨ aantrekkelijkheid ${fmt(sp.ap)}</div>
      <p style="margin:.4rem 0">${sp.f}</p>
      <div class="aq-line">${sp.xo ? '🧭 Alleen te vinden op expedities.' : `🛒 Basisprijs 🪙${fmt(sp.price)}.`} Nu in je aquarium: ${own}${S.inv[id] ? ` (+${S.inv[id]} in voorraad)` : ''}.</div>`;
  }

  function tabDoel() {
    const d = dailyInfo(S);
    let h = `<div class="aq-card"><h3>🎁 Dagelijkse beloning</h3>`;
    h += d.can ? `<div class="aq-line">Dag ${d.next} op rij${d.bonus ? ' · vandaag ook een verrassingsdier!' : ''}. Beloning: 🪙${fmt(d.reward)}</div><button class="aq-btn pri" data-a="daily">Ophalen</button>`
      : `<div class="aq-line">Vandaag opgehaald. Reeks: ${S.dy.streak} dag${S.dy.streak === 1 ? '' : 'en'} (beste ${S.dy.best}). Kom morgen terug!</div>`;
    h += `</div><div class="aq-h">Doelen</div>`;
    const open = GOALS.filter((x) => !S.gl[x[0]]).slice(0, 6);
    h += `<div class="aq-card" style="padding:.3rem .7rem">`;
    if (!open.length) h += `<div class="aq-line">Alle doelen gehaald. Wat een aquarium! 🏆</div>`;
    for (const x of open) {
      const v = x[2](S), done = v >= x[3], rw = goalReward(S, x);
      h += `<div class="aq-row"><div class="aq-rm"><b>${x[1]}</b><div class="aq-prog" style="margin-top:.3rem"><b style="width:${pct(clamp(v / x[3], 0, 1))}%"></b></div><small>${fmt(Math.min(v, x[3]))} / ${fmt(x[3])} · beloning 🪙${fmt(rw)}</small></div><div class="aq-rb">${done ? `<button class="pri" data-a="goal" data-id="${x[0]}">Ophalen</button>` : ''}</div></div>`;
    }
    h += `</div><div class="aq-line" style="margin-left:.3rem">${Object.keys(S.gl).length}/${GOALS.length} doelen gehaald</div>`;
    h += `<div class="aq-h">Prestaties (+2% inkomsten per stuk)</div><div class="aq-card"><div class="aq-ach">${ACH.map((a) => `<div class="${S.ach[a[0]] ? 'on' : ''}" title="${a[1]}">${S.ach[a[0]] ? a[2] : '🔒'}</div>`).join('')}</div><div class="aq-line">${Object.keys(S.ach).length}/${ACH.length} behaald. Tik hieronder voor uitleg.</div>
      ${ACH.filter((a) => !S.ach[a[0]]).slice(0, 3).map((a) => `<div class="aq-line">🔒 ${a[1]}: ${fmt(Math.min(a[3](S), a[4]))} / ${fmt(a[4])}</div>`).join('')}</div>`;
    h += `<div class="aq-h">Statistieken</div><div class="aq-card"><div class="aq-two"><div>🍤 Gevoerd: <b>${fmt(S.st.taps)}</b></div><div>🍼 Geboren: <b>${fmt(S.st.births)}</b></div><div>👥 Bezoekers: <b>${fmt(S.st.vis)}</b></div><div>🧭 Reizen: <b>${S.st.exps}</b></div><div>🪙 Ooit verdiend: <b>${fmt(S.te)}</b></div><div>🦪 Verhuizingen: <b>${S.st.pres}</b></div></div></div>`;
    return h;
  }

  function tabParel() {
    const gain = prestigeGain(S), nextAt = PRESTIGE_UNIT * Math.pow(gain + 1, 2);
    let h = `<div class="aq-card"><h3>🦪 Parels: verhuis naar een groter aquarium</h3>
      <div class="aq-line">Je begint opnieuw met een klein aquarium, maar je houdt je encyclopedie, prestaties, doelen en parels. Elke parel geeft +10% inkomsten, en je kunt parels uitgeven aan blijvende voordelen hieronder.</div>
      <div class="aq-two" style="margin:.5rem 0"><div>🦪 Parels: <b>${S.P}</b></div><div>💠 Te besteden: <b>${S.pe}</b></div><div>Deze ronde verdiend: <b>${fmt(S.e)}</b></div><div>Nu te krijgen: <b>${gain}</b> 🦪</div></div>
      ${gain < 1 ? `<div class="aq-line">Verdien ${fmt(PRESTIGE_UNIT)} munten in deze ronde om je eerste parel te krijgen (nog ${fmt(Math.max(0, PRESTIGE_UNIT - S.e))}).</div>`
        : `<div class="aq-line">Nog ${fmt(Math.max(0, nextAt - S.e))} munten voor de volgende extra parel.</div>`}`;
    if (gain >= 1) {
      h += prestConfirm ? `<div class="aq-warn" style="margin:.4rem 0">Weet je het zeker? Je tanks, dieren, upgrades en munten gaan terug naar het begin${S.pk.keep ? ' (je personeel blijft)' : ''}.</div><div class="aq-act"><button class="aq-btn pri" data-a="prest2">Ja, verhuis (+${gain} 🦪)</button><button class="aq-btn" data-a="prest0">Nog even niet</button></div>`
        : `<button class="aq-btn pri" data-a="prest1">✨ Verhuizen</button>`;
    }
    h += `</div><div class="aq-h">Blijvende voordelen</div><div class="aq-card" style="padding:.3rem .7rem">`;
    for (const id of Object.keys(PK)) {
      const p = PK[id], lv = S.pk[id] || 0, c = perkCost(S, id), maxed = lv >= p.max;
      h += `<div class="aq-row"><div class="aq-ico emo" style="background:var(--line)">${p.e}</div><div class="aq-rm"><b>${p.n} <span class="aq-tag">niveau ${lv}</span></b><small>${p.d}</small></div><div class="aq-rb">${maxed ? '<small>Max</small>' : `<button class="pri" data-a="perk" data-id="${id}" ${S.pe < c ? 'disabled' : ''}>${c} 🦪</button>`}</div></div>`;
    }
    return h + `</div>`;
  }

  const TAB_FN = { tank: tabTank, park: tabPark, reis: tabReis, boek: tabBoek, doel: tabDoel, parel: tabParel };
  function shell() {
    view.innerHTML = `<div id="aqTut"></div><div id="aqMain"></div>
      <div class="aq-dock"><div class="aq-dockin"><div class="aq-stats"><span class="aq-coins" id="aqCoins">🪙 0</span><span class="aq-sub" id="aqIps"></span><span class="aq-sp"></span><span class="aq-sub" id="aqVis"></span><button class="aq-ib" data-a="snd" id="aqSnd">🔊</button></div>
      <div class="aq-nav">${TABS.map(([k, e, n]) => `<button data-a="tab" data-t="${k}" id="aqt-${k}"><span>${e}</span><small>${n}</small></button>`).join('')}</div></div></div>`;
  }
  function render() {
    const main = $('#aqMain'); if (!main) return;
    main.innerHTML = TAB_FN[tab]();
    if (tab === 'tank') {
      const box = $('#aqCv'); box.appendChild(cv); resize(); syncEnts(); renderTank();
    }
    TABS.forEach(([k]) => { const b = $('#aqt-' + k); if (b) b.classList.toggle('on', k === tab); });
    refresh(true);
  }
  function tutorial() {
    const box = $('#aqTut'); if (!box) return;
    const steps = [
      ['Welkom bij je aquarium! 🐠', 'Tik op het water om de vissen te voeren. Je krijgt fooi van de bezoekers.', () => S.st.taps >= 3, 'tank'],
      ['Mooi gedaan!', 'Koop nu een extra guppy in de lijst hieronder.', () => animalsTotal(S) >= 3, 'tank'],
      ['Bezoekers betalen entree', 'Open 🏗️ Park en koop je eerste upgrade.', () => upLevels(S) >= 1, 'park'],
      ['Nu nog beloningen', 'Kijk bij 🎯 Doelen: daar wachten munten op je.', () => tabsVisited.has('doel') || Object.keys(S.gl).length > 0, 'doel'],
      ['Wist je dat…', 'Twee dezelfde dieren krijgen jongen. Bij 🧭 Reizen vind je later zeldzame dieren. Veel plezier!', () => false, 'reis'],
    ];
    if (S.tut >= steps.length) { box.innerHTML = ''; TABS.forEach(([k]) => { const b = $('#aqt-' + k); if (b) b.classList.remove('aq-pulse'); }); return; }
    while (S.tut < steps.length - 1 && steps[S.tut][2]()) S.tut++;
    const st = steps[S.tut], last = S.tut === steps.length - 1;
    const html = `<div class="aq-tut"><div style="flex:1"><b>${st[0]}</b>${st[1]}</div><button data-a="tutnext">${last ? 'Begrepen' : 'Overslaan'}</button></div>`;
    if (box.dataset.k !== String(S.tut)) { box.innerHTML = html; box.dataset.k = String(S.tut); }
    TABS.forEach(([k]) => { const b = $('#aqt-' + k); if (b) b.classList.toggle('aq-pulse', k === st[3] && k !== tab); });
  }

  // lichte verversing (elke ~0,5 s): getallen, balkjes, knoppen
  function refresh(force) {
    if (!S || !$('#aqCoins')) return;
    const e = economy(S);
    const c = fmt(S.c); if (c !== lastTopC || force) { $('#aqCoins').textContent = '🪙 ' + c; lastTopC = c; }
    $('#aqIps').textContent = `+${fmt(e.ips)}/s`;
    $('#aqVis').textContent = `👥 ${fmt(e.vps)}/s`;
    $('#aqSnd').textContent = sound.on ? '🔊' : '🔇';
    view.querySelectorAll('[data-cost]').forEach((el) => { const dis = S.c < +el.dataset.cost || el.dataset.fit === '0'; if (el.disabled !== dis) el.disabled = dis; });
    if (tab === 'tank' && S.T[ti]) {
      const t = S.T[ti], w = $('#aqW'), f = $('#aqF');
      if (w) w.style.width = Math.round(t.w) + '%'; if (f) f.style.width = Math.round(t.f) + '%';
    }
    if (tab === 'reis') {
      const now = Date.now(); let rerender = false;
      view.querySelectorAll('[data-ship]').forEach((b) => {
        const t0 = +b.dataset.t0, t1 = +b.dataset.t1, i = b.dataset.ship, done = t1 <= now;
        b.style.width = pct(clamp((now - t0) / (t1 - t0), 0, 1)) + '%';
        const tx = view.querySelector(`[data-shiptxt="${i}"]`); if (tx) tx.textContent = done ? 'Klaar!' : 'Nog ' + fmtTime((t1 - now) / 1000);
        if (done && !view.querySelector(`[data-a="collect"][data-i="${i}"]`)) rerender = true;
      });
      if (rerender) render();
    }
    // badges
    const nGoal = GOALS.filter((x) => !S.gl[x[0]] && x[2](S) >= x[3]).length + (dailyInfo(S).can ? 1 : 0);
    const nShip = S.x.filter((x) => x.t1 <= Date.now()).length;
    const bad = { doel: nGoal, reis: nShip, parel: prestigeGain(S) >= 1 ? '!' : 0 };
    for (const [k] of TABS) { const b = $('#aqt-' + k); if (!b) continue; let i = b.querySelector('i'); const v = bad[k]; if (v) { if (!i) { i = document.createElement('i'); b.appendChild(i); } if (i.textContent !== String(v)) i.textContent = v; } else if (i) i.remove(); }
    tutorial();
  }

  /* ---------- acties ---------- */
  function afterChange(rerender = true) {
    S.at = Date.now();
    for (const a of checkAch(S)) { toast(`🏆 ${a[2]} ${a[1]}! (+2% inkomsten)`); sound.play('win'); }
    if (rerender) { if (tab === 'tank') { Wd.sig = ''; renderTank(); } else render(); }
    refresh(true);
  }
  function fail(r) { toast(r.msg || 'Dat lukt nu niet.'); sound.play('err'); }
  function doFeed(x, y, fromBtn) {
    const now = performance.now(); if (now - (doFeed.last || 0) < 280) return; doFeed.last = now;
    const tip = feedTank(S, ti);
    sound.play('tap');
    const px = x != null ? x : rnd(CW * 0.25, CW * 0.75), py = y != null ? y : LAY.top + 8;
    for (let i = 0; i < 3 && Wd.food.length < 16; i++) Wd.food.push({ x: px + rnd(-14, 14) * u, y: Math.max(LAY.top + 4, py + rnd(-6, 6) * u), age: 0, p: rnd(0, 6) });
    addPart(px, py, '+' + fmt(tip), 'up');
    ptr.x = px; ptr.y = py; ptr.t = Wd.t;
    if (Math.random() < 0.3) sound.play('coin');
    markTutorialFeed(); refresh();
  }
  function markTutorialFeed() { /* S.st.taps is al verhoogd in feedTank */ }
  function onCanvasDown(ev) {
    sound.unlock();
    const r = cv.getBoundingClientRect(); const x = (ev.clientX - r.left) * CW / r.width, y = (ev.clientY - r.top) * CH / r.height;
    if (y > LAY.floorY + 6) return;
    let hit = null, bd = 1e9;
    for (const e of Wd.ents) { const d = Math.hypot(e.x - x, e.y - y); if (d < 24 * u * e.sp.sc && d < bd) { bd = d; hit = e; } }
    if (hit) {
      for (let i = 0; i < 3; i++) addPart(hit.x + rnd(-10, 10), hit.y - 10 * u, '💗');
      sound.play('bloop'); ptr.x = x; ptr.y = y; ptr.t = Wd.t;
      if (Math.random() < 0.35) toast(`${hit.sp.n}: ${hit.sp.f}`);
      hit.vy -= 30 * u;
    } else doFeed(x, y, false);
  }

  function showAway(a) {
    const rdy = S.x.filter((x) => x.t1 <= Date.now()).length;
    openModal(`<h2>👋 Welkom terug!</h2><div class="aq-line">Je was ${fmtTime(a.secs)} weg. De bezoekers bleven komen.</div><p style="font-size:1.3rem;margin:.6rem 0">🪙 +${fmt(a.gain)}</p>${a.births ? `<div>🍼 ${a.births} nieuwe baby${a.births === 1 ? '' : "'s"} geboren.</div>` : ''}${rdy ? `<div>🧭 ${rdy} schip${rdy === 1 ? '' : 'pen'} wacht${rdy === 1 ? '' : 'en'} in de haven.</div>` : ''}<div class="aq-line" style="margin-top:.4rem">Terwijl je weg bent, verdien je maximaal 8 uur aan inkomsten.</div>`);
  }

  function onClick(ev) {
    sound.unlock();
    const b = ev.target.closest('[data-a]'); if (!b || b.disabled) return;
    const a = b.dataset.a, id = b.dataset.id, i = b.dataset.i != null ? +b.dataset.i : null;
    let r;
    switch (a) {
      case 'tab': tab = b.dataset.t; tabsVisited.add(tab); prestConfirm = false; render(); window.scrollTo && window.scrollTo(0, 0); break;
      case 'sel': ti = i; Wd.sig = ''; render(); break;
      case 'goto': ti = i; tab = 'tank'; render(); break;
      case 'feed': doFeed(null, null, true); break;
      case 'clean': cleanTank(S, ti); sound.play('buy'); toast('🧽 Het water is weer helder.'); afterChange(true); break;
      case 'treat': r = treatTank(S, ti); if (r.ok) { sound.play('win'); toast('💊 De dieren voelen zich weer fit!'); afterChange(true); } else fail(r); break;
      case 'buy': r = buyAnimal(S, ti, id); if (r.ok) { sound.play('buy'); toast(`${SPM[id].e} ${SPM[id].n} erbij!`); afterChange(true); } else fail(r); break;
      case 'sell': r = moveToInv(S, ti, id); if (r.ok) { toast(`${SPM[id].n} gaat naar de voorraad.`); afterChange(true); } else fail(r); break;
      case 'place': r = placeFromInv(S, ti, id); if (r.ok) { sound.play('buy'); afterChange(true); } else fail(r); break;
      case 'autoplace': { const k = autoPlace(id); if (k >= 0) { sound.play('buy'); toast(`${SPM[id].n} woont nu in ${tankName(S.T[k], k)}.`); afterChange(true); } else fail({ msg: `Geen vrije plek in een ${TT[SPM[id].hab].n.toLowerCase()}-tank. Bouw of breid een tank uit.` }); break; }
      case 'deco': r = buyDeco(S, ti, id); if (r.ok) { sound.play('buy'); afterChange(true); } else fail(r); break;
      case 'tup': r = upgradeTank(S, ti); if (r.ok) { sound.play('win'); toast('🔧 De tank is groter geworden!'); afterChange(true); } else fail(r); break;
      case 'build': r = buildTank(S, b.dataset.k); if (r.ok) { sound.play('win'); toast('🏗️ Nieuwe tank gebouwd! Vul hem met dieren.'); ti = r.index; tab = 'tank'; Wd.sig = ''; afterChange(true); render(); } else fail(r); break;
      case 'up': r = buyUp(S, id); if (r.ok) { sound.play('buy'); afterChange(true); } else fail(r); break;
      case 'exp': r = startExp(S, id); if (r.ok) { sound.play('horn'); toast('⛵ Het schip vertrekt!'); afterChange(true); } else fail(r); break;
      case 'collect': {
        r = collectExp(S, i); if (!r.ok) { fail(r); break; }
        sound.play('win');
        const rows = r.found.map((f) => { const k = autoPlace(f.id); return `<div class="aq-row">${iconHTML(f.id)}<div class="aq-rm"><b>${SPM[f.id].n}${f.isNew ? '<span class="aq-tag new">Nieuw!</span>' : ''}</b><small>${k >= 0 ? 'Woont nu in ' + tankName(S.T[k], k) : 'In je voorraad: geen vrije plek'}</small></div></div>`; }).join('');
        openModal(`<h2>${REGM[r.region].e} De expeditie is terug!</h2>${rows}`);
        afterChange(true); break;
      }
      case 'goal': r = claimGoal(S, id); if (r.ok) { sound.play('coin'); toast(`🎯 +${fmt(r.reward)} munten!`); afterChange(true); } else fail(r); break;
      case 'daily': r = claimDaily(S); if (r.ok) { sound.play('win'); openModal(`<h2>🎁 Dagelijkse beloning</h2><p style="font-size:1.3rem">🪙 +${fmt(r.reward)}</p><div class="aq-line">Dag ${r.streak} op rij.</div>${r.pet ? `<div class="aq-row">${iconHTML(r.pet)}<div class="aq-rm"><b>Verrassing: ${SPM[r.pet].n}!</b><small>Staat in je voorraad (Reizen).</small></div></div>` : ''}`); afterChange(true); } else fail(r); break;
      case 'perk': r = buyPerk(S, id); if (r.ok) { sound.play('buy'); afterChange(true); } else fail(r); break;
      case 'prest1': prestConfirm = true; render(); break;
      case 'prest0': prestConfirm = false; render(); break;
      case 'prest2': {
        r = doPrestige(S); prestConfirm = false;
        if (r.ok) { ti = 0; Wd.sig = ''; Wd.ents = []; sound.play('win'); openModal(`<h2>🦪 Nieuw aquarium!</h2><p style="font-size:1.3rem">+${r.gain} parel${r.gain === 1 ? '' : 'en'}</p><div class="aq-line">Je inkomsten zijn nu x${fmt(multOf(S))} en je kunt parels uitgeven aan voordelen.</div>`); lastLocal = 0; afterChange(true); writeLocal(); writeCloud('soft'); } else fail(r);
        break;
      }
      case 'bfilter': bookFilter = b.dataset.k; render(); break;
      case 'detail': {
        const sp = SPM[id]; openModal(detailHTML(id));
        const c = $('#aqDetCv'); if (c) { modalCv = c; modalSp = sp; }
        break;
      }
      case 'snd': sound.on = !sound.on; S.snd = sound.on ? 1 : 0; if (sound.on) sound.play('buy'); refresh(true); break;
      case 'tutnext': S.tut = 5; $('#aqTut').dataset.k = ''; tutorial(); break;
      case 'mclose': closeModal(); break;
      default: break;
    }
  }
  const onModalBackdrop = (ev) => { if (ev.target.classList && ev.target.classList.contains('aq-modal')) closeModal(); };

  /* ---------- hoofdlus ---------- */
  let evs = [];
  function tick() {
    if (!S || destroyed) return;
    if (!view.isConnected) return;               // pauze: de tijd telt dan als "weg geweest"
    const now = Date.now(); let dt = (now - S.last) / 1000;
    if (dt < 0) { S.last = now; return; }
    if (dt > 20) { const info = applyOffline(S, dt, evs); S.last = now; if (dt > 45) showAway(info); evs = []; afterChange(true); return; }
    S.last = now;
    step(S, dt, evs);
    S.st.ticks++;
    if (evs.length) {
      for (const ev of evs) if (ev.t === 'birth') { sound.play('baby'); toast(`🍼 Een baby ${SPM[ev.id].n}!`); } else if (ev.t === 'donate') toast(`🎁 ${SPM[ev.id].n}-jong naar een ander aquarium: +${fmt(ev.gain)}`);
      evs = []; const t = S.T[ti]; if (t && Wd.sig !== sigOf(t)) { syncEnts(); if (tab === 'tank') renderTank(); }
    }
    // meldingen
    if (S.st.ticks % 8 === 0) {
      for (const a of checkAch(S)) { toast(`🏆 ${a[2]} ${a[1]}! (+2% inkomsten)`); sound.play('win'); }
      for (const x of GOALS) if (!goalSeen.has(x[0]) && x[2](S) >= x[3]) { goalSeen.add(x[0]); toast(`🎯 Doel gehaald: ${x[1]}`); sound.play('coin'); break; }
      S.x.forEach((x, i) => { if (x.t1 <= now && !expSeen.has(x.t1)) { expSeen.add(x.t1); toast('🧭 Een schip is terug in de haven!'); sound.play('horn'); } });
    }
    if (now - lastLocal > 5000) { lastLocal = now; writeLocal(); }
    if (now - lastCloud >= CLOUD_EVERY) writeCloud();
    if (S.st.ticks % 2 === 0) refresh();
    if (S.st.ticks % 20 === 0 && tab === 'tank') { const st = $('#aqStat'); if (st && !modalOpen) st.innerHTML = statHTML(); }
  }

  let raf = 0, lastTs = 0, lastDrawAt = 0;
  function draw(nowMs) {
    if (!S || destroyed || !view.isConnected || document.hidden) return;
    const dt = Math.min(0.06, Math.max(0.001, (nowMs - (lastTs || nowMs)) / 1000)); lastTs = nowMs; lastDrawAt = nowMs;
    if (tab === 'tank' && cv.isConnected) { updateWorld(dt); drawWorld(); }
    if (modalCv) drawModal();
  }
  function frame(ts) { raf = requestAnimationFrame(frame); draw(ts); }

  shell();
  render();
  view.addEventListener('click', onClick);
  view.addEventListener('pointerdown', onModalBackdrop);
  cv.addEventListener('pointerdown', onCanvasDown);
  const onResize = () => { if (tab === 'tank' && cv.isConnected) { resize(); syncEnts(); } };
  let ro = null;
  try { if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(onResize); ro.observe(view); } } catch (e) { ro = null; }
  window.addEventListener('resize', onResize);
  const onHide = () => { if (document.visibilityState === 'hidden' || document.visibilityState === undefined) { writeLocal(); writeCloud('soft'); } };
  const onPageHide = () => { writeLocal(); writeCloud('soft'); };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', onPageHide);
  const tickId = setInterval(tick, 250);
  const fbId = setInterval(() => { const n = performance.now(); if (n - lastDrawAt > 400) draw(n); }, 120);
  if (typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(frame);

  if (away && away.secs > 60) showAway(away);
  else if (!isNew && dailyInfo(S).can) later(() => toast('🎁 Je dagelijkse beloning staat klaar bij Doelen!'), 1200);
  if (!isNew) cloudP.then((c) => {
    if (destroyed || !c || !S) return;
    if (c.at > loadedAt + 3000) {
      S = c.s; const now = Date.now(), gap = (now - (S.last || S.at || now)) / 1000; if (gap > 45) applyOffline(S, gap); S.last = now;
      goalSeen = new Set(Object.keys(S.gl)); ti = 0; Wd.sig = ''; lastLocal = 0; render(); toast('☁️ Nieuwere voortgang van een ander apparaat geladen.');
    }
  });
  writeLocal();

  addCleanup(() => {
    destroyed = true;
    clearInterval(tickId); clearInterval(fbId); if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
    timers.forEach((id) => clearTimeout(id)); timers.clear();
    view.removeEventListener('click', onClick); view.removeEventListener('pointerdown', onModalBackdrop); cv.removeEventListener('pointerdown', onCanvasDown);
    window.removeEventListener('resize', onResize); window.removeEventListener('pagehide', onPageHide); document.removeEventListener('visibilitychange', onHide);
    if (ro) ro.disconnect();
    try { writeLocal(); writeCloud(true); } catch (e) { /* ok */ }
    sound.close();
  });
}
