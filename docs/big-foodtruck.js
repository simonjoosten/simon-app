// Foodtruck Imperium: begin met één foodtruck en bouw uit tot een restaurantketen over de hele wereld.
// Kook als echte bediening (bestellingen, op tijd serveren, combo's), huur personeel, koop in op de schommelende markt,
// reis langs steden met eigen smaak, doe mee aan festivals, verdien sterren en richt je truck in. Eindeloos met franchise (prestige).
// Opslag: local-first (localStorage `big:foodtruck:${uid}`) + Firestore gamesaves/big-foodtruck__${uid} = { game, uid, data (JSON, max 18000), updated }.
// De pure spellogica (Game, derive, rates, serialize, ...) is los geëxporteerd voor node-tests; de view (DOM/canvas/audio) staat onderaan.

/* =====================================================================
   1. CONSTANTEN EN HULPFUNCTIES
   ===================================================================== */
export const SAVE_V = 1;
export const MAX_DATA = 18000;
export const MAX_OFFLINE = 8 * 3600;       // seconden
const BASE_OFF_EFF = 0.65;                 // offline verdien we 65% (perk: tot 100%)
const FS_URL = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
export const MAXSTAR = 25;
const FAME0 = 90, FAMEG = 1.9;
const BADGE_MUL = 0.25;
export const MAX_DISH_LV = 10;
export const GAME_ID = 'foodtruck';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const num = (x, d = 0) => { const n = Number(x); return Number.isFinite(n) ? n : d; };
const int = (x, d = 0) => Math.floor(num(x, d));
const cost = (base, g, lv) => Math.round(base * Math.pow(g, lv));
export const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
export function fmt(n) {
  n = num(n);
  const neg = n < 0; n = Math.abs(n);
  let s;
  if (n < 1000) s = n < 10 ? String(Math.round(n * 10) / 10) : String(Math.round(n));
  else {
    let i = 0;
    while (n >= 1000 && i < SUF.length - 1) { n /= 1000; i++; }
    s = n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : n.toFixed(0);
    if (s.includes('.')) s = s.replace(/\.?0+$/, '');
    s += SUF[i];
  }
  return (neg ? '-' : '') + s.replace('.', ',');
}
export function fmtTime(s) {
  s = Math.max(0, Math.round(s));
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return m ? `${h} u ${m} min` : `${h} uur`;
}
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const yesterdayKey = (d = new Date()) => { const y = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, 12); return dayKey(y); };

/* =====================================================================
   2. DATA
   ===================================================================== */
// Ingrediënten: [id, naam, emoji, basisprijs]
export const ING = {};
const ING_IDS = [];
[['br', 'Brood', '🍞', 1.5], ['ei', 'Eieren', '🥚', 1.2], ['me', 'Zuivel', '🥛', 1.2], ['gr', 'Groente', '🥬', 1.4], ['ao', 'Aardappel', '🥔', 1.0],
  ['to', 'Tomaat', '🍅', 1.5], ['ka', 'Kaas', '🧀', 2.4], ['vl', 'Vlees', '🥩', 3.8], ['ri', 'Rijst', '🍚', 1.2], ['de', 'Meel', '🌾', 1.0],
  ['no', 'Noedels', '🍥', 1.6], ['vi', 'Vis', '🐠', 4.5], ['fr', 'Fruit', '🍓', 2.2], ['kr', 'Kruiden', '🌶️', 1.8], ['ch', 'Chocola', '🍫', 3.0],
  ['ga', 'Garnalen', '🦐', 6.5], ['tr', 'Truffel', '🍄', 12], ['kz', 'Kreeft', '🦞', 20]].forEach((r, i) => {
  ING[r[0]] = { id: r[0], n: r[1], e: r[2], p: r[3], p1: 420 + (i * 97) % 480, p2: 90 + (i * 37) % 110, ph: i * 1.37 };
  ING_IDS.push(r[0]);
});
export { ING_IDS };

export const TAGS = { NL: ['🇳🇱', 'Hollands'], IT: ['🇮🇹', 'Italiaans'], FR: ['🇫🇷', 'Frans'], MX: ['🇲🇽', 'Mexicaans'], JP: ['🇯🇵', 'Japans'], US: ['🇺🇸', 'Amerikaans'], IN: ['🇮🇳', 'Indiaas'], TR: ['🇹🇷', 'Turks'], ZO: ['🍬', 'Zoet'] };

// Verwachte stadsrijkdom bij een bepaald aantal sterren (voor kostenschaal)
const WST = (st) => [1, 1, 1.8, 1.8, 3.2, 3.2, 5.8, 5.8, 10.5, 10.5, 19, 19, 35, 35, 65][Math.min(14, st)] || 65;
// Gerechten: [id, naam, emoji, keuken, prijs, kooktijd s, ingrediënten, ster nodig]
export const DISHES = [];
export const DISH = {};
[
  ['bro', 'Broodje van het huis', '🥖', 'NL', 5, 2, '', 0], ['tos', 'Tosti', '🥪', 'NL', 9, 3, 'br1 ka1', 0], ['pat', 'Patatje', '🍟', 'NL', 12, 3, 'ao2', 0],
  ['sta', 'Stroopwafel', '🧇', 'ZO', 14, 3, 'de1 me1', 0], ['hot', 'Hotdog', '🌭', 'US', 15, 3, 'br1 vl1', 0],
  ['pan', 'Pannenkoek', '🥞', 'NL', 20, 4, 'de1 ei1 me1', 1], ['hag', 'Haring met uitjes', '🐟', 'NL', 22, 3, 'vi1 br1', 1], ['bit', 'Bitterballen', '🧆', 'NL', 24, 4, 'vl1 de1', 1],
  ['ijs', 'Softijsje', '🍦', 'ZO', 18, 3, 'me1 fr1', 1], ['sal', 'Boerensalade', '🥗', 'NL', 21, 3, 'gr2 ka1', 1],
  ['pas', 'Spaghetti pomodoro', '🍝', 'IT', 30, 5, 'de2 to1', 2], ['piz', 'Pizza Margherita', '🍕', 'IT', 34, 6, 'de1 to1 ka1', 2], ['bur', 'Hamburger', '🍔', 'US', 36, 5, 'br1 vl1 gr1', 2],
  ['taq', 'Taco', '🌮', 'MX', 32, 4, 'de1 vl1 gr1', 2], ['cro', 'Croissant', '🥐', 'FR', 28, 4, 'de1 me2', 2],
  ['oni', 'Onigiri', '🍙', 'JP', 46, 4, 'ri2 vi1', 3], ['sus', 'Sushi', '🍣', 'JP', 56, 6, 'ri1 vi1', 3], ['cur', 'Groentecurry', '🍛', 'IN', 52, 7, 'ri1 kr2 gr1', 3],
  ['keb', 'Kebab', '🥙', 'TR', 50, 6, 'br1 vl2 gr1', 3], ['dos', 'Dosa', '🫓', 'IN', 48, 5, 'de1 ri1 kr1', 3], ['ram', 'Ramen', '🍜', 'JP', 60, 7, 'no2 ei1 vl1', 4],
  ['bto', 'Burrito', '🌯', 'MX', 54, 6, 'de1 ri1 vl1 kr1', 4], ['qui', 'Quiche', '🥧', 'FR', 58, 7, 'de1 ei2 ka1', 4],
  ['but', 'Butter chicken', '🍲', 'IN', 105, 9, 'vl1 me1 kr1 ri1', 5], ['tem', 'Tempura', '🍤', 'JP', 100, 7, 'ga1 de1 gr1', 5], ['las', 'Lasagne', '🥘', 'IT', 95, 9, 'de2 vl1 to1 ka1', 5],
  ['rib', 'Spareribs', '🍗', 'US', 110, 10, 'vl2 kr1', 5], ['mac', 'Mac & cheese', '🫕', 'US', 90, 6, 'no2 ka2 me1', 5], ['tir', 'Tiramisu', '🍰', 'IT', 98, 6, 'ei1 me1 ch1', 6],
  ['mcr', 'Macarons', '🧁', 'FR', 104, 6, 'ei1 fr1 ch1', 6],
  ['dim', 'Dim sum', '🥟', 'JP', 190, 8, 'de1 vl1 gr1 kr1', 7], ['mos', 'Mosselen', '🦪', 'FR', 200, 8, 'vi1 gr1 me1', 7], ['tam', 'Tamales', '🫔', 'MX', 205, 9, 'de1 vl1 kr1', 8],
  ['gyr', 'Gyros schotel', '🍖', 'TR', 215, 9, 'vl2 to1 br1 kr1', 8], ['ste', 'Steak frites', '🥩', 'FR', 230, 10, 'vl2 ao2 kr1', 8], ['ben', 'Bento box', '🍱', 'JP', 240, 9, 'ri1 vi1 ga1', 9],
  ['cam', 'Camarones diabla', '🦐', 'MX', 380, 8, 'ga2 kr2 to1', 10], ['tru', 'Truffelpasta', '🍄', 'IT', 420, 9, 'de2 tr1 me1', 10], ['bru', 'Crème brûlée', '🍮', 'FR', 360, 7, 'ei2 me1 ch1', 11],
  ['don', 'Gourmet donut', '🍩', 'US', 350, 6, 'de1 ch1 fr1', 11], ['bak', 'Baklava', '🍯', 'TR', 390, 8, 'de1 fr1 me1 ch1', 12], ['moc', 'Mochi-ijs', '🍡', 'JP', 400, 7, 'ri1 me1 fr1', 12],
  ['kre', 'Kreeft thermidor', '🦞', 'FR', 900, 11, 'kz1 me1 kr1', 13], ['wag', 'Wagyu spies', '🍢', 'JP', 1000, 10, 'vl3 tr1', 14], ['omk', 'Omakase', '🥢', 'JP', 1100, 12, 'vi2 ga1 kz1', 15],
  ['gou', 'Gouden taart', '🎂', 'ZO', 1000, 8, 'ch2 fr1 ei1 me1', 16], ['dia', 'Diamant-diner', '💎', 'FR', 1500, 14, 'kz2 tr2 ga1', 17],
].forEach((r) => {
  const price = r[4];
  const ing = r[6] ? r[6].split(' ').map((x) => [x.slice(0, 2), int(x.slice(2))]) : [];
  const tier = price < 16 ? 1 : price < 32 ? 2 : price < 60 ? 3 : price < 120 ? 4 : price < 240 ? 5 : price < 440 ? 6 : price < 900 ? 7 : 8;
  const d = { id: r[0], n: r[1], e: r[2], tag: r[3], price, cook: r[5], ing, st: r[7], tier, unl: r[0] === 'bro' ? 0 : Math.round(price * (price <= 15 ? 5 : 25) * WST(r[7])) };
  DISHES.push(d); DISH[d.id] = d;
});
export const dishPrice = (d, lv) => d.price * (1 + 0.35 * (Math.max(1, lv) - 1));
export const dishUpCost = (d, lv) => Math.round(d.price * 6 * Math.pow(1.65, lv - 1) * WST(d.st));

// Steden
export const CITIES = [
  { id: 'ams', n: 'Amsterdam', e: '🌷', likes: ['NL', 'ZO'], w: 1, arr: 0.22, cost: 0, st: 0, pal: ['#c8553d', '#e8b04b', '#7a9e9f'], d: 'Grachten, tulpen en stroopwafels.' },
  { id: 'rom', n: 'Rome', e: '🏛️', likes: ['IT', 'ZO'], w: 1.8, arr: 0.24, cost: 3500, st: 2, pal: ['#d98e4a', '#f2d49b', '#a85d3c'], d: 'Oude ruïnes en de beste pasta.' },
  { id: 'par', n: 'Parijs', e: '🗼', likes: ['FR', 'ZO'], w: 3.2, arr: 0.26, cost: 60000, st: 4, pal: ['#7d8fb5', '#e7c9d3', '#9aa5c4'], d: 'Romantisch, chique en vol croissants.' },
  { id: 'mex', n: 'Mexico-Stad', e: '🌵', likes: ['MX', 'US'], w: 5.8, arr: 0.28, cost: 1e6, st: 6, pal: ['#e0703c', '#f2b84b', '#4aa37a'], d: 'Kleurrijk, pittig en feestelijk.' },
  { id: 'tok', n: 'Tokio', e: '🗻', likes: ['JP', 'ZO'], w: 10.5, arr: 0.3, cost: 1.2e7, st: 8, pal: ['#c2548a', '#7fb5d9', '#2f3a63'], d: 'Neonlichten en perfecte sushi.' },
  { id: 'nyc', n: 'New York', e: '🗽', likes: ['US', 'IT'], w: 19, arr: 0.32, cost: 1.5e8, st: 10, pal: ['#5b6b8a', '#d0a24a', '#8a96ad'], d: 'De stad die nooit slaapt (en altijd honger heeft).' },
  { id: 'mum', n: 'Mumbai', e: '🛕', likes: ['IN', 'TR'], w: 35, arr: 0.34, cost: 2e9, st: 12, pal: ['#d8742f', '#e9c36a', '#8a4a7a'], d: 'Kruidig, druk en vol kleur.' },
  { id: 'ist', n: 'Istanbul', e: '🕌', likes: ['TR', 'FR'], w: 65, arr: 0.36, cost: 3e10, st: 14, pal: ['#3f8f9b', '#e8c27a', '#a8573f'], d: 'Waar twee werelddelen elkaar ontmoeten.' },
];
export const CITY = {}; CITIES.forEach((c) => { CITY[c.id] = c; });
export const branchBuild = (c) => Math.round(2500 * c.w * Math.pow(1.1, c.st));
export const branchUpCost = (c, lv) => Math.round(branchBuild(c) * Math.pow(1.55, lv));
export const branchYield = (c, lv) => 0.8 * c.w * lv;

// Personeel
export const STAFF = {
  kok: { n: 'Kok', e: '👨‍🍳', nm: 'Kees', base: 140, g: 1.6, max: 40, d: 'Kookt zelf bestellingen. Hoger niveau: sneller koken, vanaf niveau 5 draait hij zelf om.' },
  srv: { n: 'Serveerder', e: '🤵', nm: 'Sanne', base: 260, g: 1.62, max: 40, d: 'Serveert klaar eten. Vanaf niveau 6 zó snel dat het telt als supersnel serveren.' },
  kas: { n: 'Kassier', e: '🧑‍💼', nm: 'Bram', base: 500, g: 1.65, max: 40, d: '+5% fooi per niveau.' },
  ent: { n: 'Entertainer', e: '🎸', nm: 'Lola', base: 1200, g: 1.66, max: 40, d: 'Klanten wachten +3% langer en komen +2% vaker.' },
  buy: { n: 'Inkoper', e: '🛒', nm: 'Pieter', base: 2500, g: 1.7, max: 40, d: 'Vult de voorraad vanzelf aan, koopt extra als het goedkoop is (-1,5% prijs per niveau).' },
};
export const STAFF_IDS = Object.keys(STAFF);
export const staffCost = (id, lv) => cost(STAFF[id].base, STAFF[id].g, lv);

// Truck-upgrades
export const UPG = [
  { id: 'pan', n: 'Betere pannen', e: '🍳', base: 20, g: 1.6, max: 40, d: 'Koken +12% sneller per niveau.' },
  { id: 'sign', n: 'Uithangbord', e: '💡', base: 80, g: 1.65, max: 40, d: '+10% klanten per niveau.' },
  { id: 'cash', n: 'Slimme kassa', e: '💶', base: 200, g: 1.75, max: 40, d: '+6% verkoopprijs per niveau.' },
  { id: 'ctr', n: 'Groter serveerluik', e: '🪟', base: 150, g: 3.2, max: 6, d: '+1 wachtplek voor klanten.' },
  { id: 'brn', n: 'Extra kookpit', e: '🔥', base: 300, g: 3.8, max: 6, d: '+1 gerecht tegelijk koken.' },
  { id: 'frg', n: 'Koelkast', e: '❄️', base: 100, g: 2.1, max: 12, d: '+25 voorraad per ingrediënt.' },
  { id: 'mnu', n: 'Menubord', e: '📋', base: 250, g: 2.8, max: 8, d: '+1 plek op je menu.' },
  { id: 'pat', n: 'Wachtbankje', e: '🛋️', base: 150, g: 1.65, max: 30, d: 'Klanten wachten +6% langer.' },
];
export const UPGM = {}; UPG.forEach((u) => { UPGM[u.id] = u; });
export const upCost = (id, lv) => cost(UPGM[id].base, UPGM[id].g, lv);

// Decoratie: slot = dak | zij | lucht | grond (3 plekken)
export const DECOR = [
  { id: 'bal', n: 'Ballonnen', e: '🎈', slot: 'dak', price: 150, arr: 0.03 }, { id: 'pla', n: 'Dakplantjes', e: '🌿', slot: 'dak', price: 220, pat: 0.04 },
  { id: 'vla', n: 'Vlaggetjes', e: '🚩', slot: 'dak', price: 600, arr: 0.04 }, { id: 'ant', n: 'Disco-bol', e: '🪩', slot: 'dak', price: 9000, arr: 0.06, tip: 0.03 },
  { id: 'kro', n: 'Gouden kroon', e: '👑', slot: 'dak', price: 300000, arr: 0.12 },
  { id: 'mur', n: 'Muurschildering', e: '🎨', slot: 'zij', price: 300, tip: 0.04 }, { id: 'ski', n: 'Surfplank', e: '🏄', slot: 'zij', price: 1200, arr: 0.04 },
  { id: 'spk', n: 'Speakers', e: '🔊', slot: 'zij', price: 4000, arr: 0.05 }, { id: 'ste', n: 'Sterrenbord', e: '🌟', slot: 'zij', price: 40000, tip: 0.06 },
  { id: 'neo', n: 'Neonbord', e: '🪧', slot: 'zij', price: 500000, arr: 0.1, tip: 0.05 },
  { id: 'lic', n: 'Lichtsnoer', e: '✨', slot: 'lucht', price: 400, arr: 0.04 }, { id: 'lam', n: 'Lampionnen', e: '🏮', slot: 'lucht', price: 1800, pat: 0.06 },
  { id: 'wim', n: 'Wimpels', e: '🎏', slot: 'lucht', price: 7000, arr: 0.05 }, { id: 'dro', n: 'Drone-camera', e: '🛸', slot: 'lucht', price: 90000, arr: 0.09 },
  { id: 'reg', n: 'Regenboog', e: '🌈', slot: 'lucht', price: 1.2e6, arr: 0.12, pat: 0.06 },
  { id: 'bak', n: 'Plantenbak', e: '🪴', slot: 'grond', price: 120, pat: 0.03 }, { id: 'taf', n: 'Terrastafel', e: '🪑', slot: 'grond', price: 500, pat: 0.05 },
  { id: 'par', n: 'Parasol', e: '⛱️', slot: 'grond', price: 1500, pat: 0.06 }, { id: 'boo', n: 'Boompje', e: '🌳', slot: 'grond', price: 3500, arr: 0.04 },
  { id: 'lou', n: 'Loungebank', e: '🛋️', slot: 'grond', price: 15000, pat: 0.1 }, { id: 'fon', n: 'Fontein', e: '⛲', slot: 'grond', price: 60000, arr: 0.08 },
  { id: 'dra', n: 'Draaimolen', e: '🎠', slot: 'grond', price: 250000, arr: 0.12 }, { id: 'rad', n: 'Reuzenrad', e: '🎡', slot: 'grond', price: 3e6, arr: 0.2 },
  { id: 'sta', n: 'Standbeeld van jou', e: '🗿', slot: 'grond', price: 2e7, tip: 0.1, arr: 0.1 },
];
export const DECM = {}; DECOR.forEach((d) => { DECM[d.id] = d; });
export const SLOTS = { dak: ['dak'], zij: ['zij'], lucht: ['lucht'], grond: ['g0', 'g1', 'g2'] };
export const SLOT_NAME = { dak: 'Dak', zij: 'Zijkant', lucht: 'Lucht', grond: 'Grond' };

export const BODY_COL = [['Tomaat', '#e8604c'], ['Mandarijn', '#f29a3a'], ['Citroen', '#f4cf55'], ['Munt', '#6fc48c'], ['Lagune', '#3fb8af'], ['Lucht', '#5aa9e6'], ['Druif', '#8a7be0'], ['Roze', '#e87bb5'], ['Room', '#efe6d3'], ['Nacht', '#475569']];
export const TRIM_COL = [['Wit', '#ffffff'], ['Rood', '#d9453b'], ['Geel', '#f2c53d'], ['Groen', '#3a9d5d'], ['Blauw', '#2f6fd1'], ['Zwart', '#2a2d38']];
export const AWN = [['Strepen', 'stripes'], ['Stippen', 'dots'], ['Zigzag', 'zig'], ['Effen', 'plain']];

// Evenementen. fx: arr (klanten), tip (extra fooi), price, pat (wachttijd), cook
export const EVENTS = [
  { id: 'ker', n: 'Kermis', e: '🎪', dur: 90, fx: { arr: 1.8 }, d: 'Het hele dorp komt kijken: veel meer klanten.' },
  { id: 'mus', n: 'Muziekfestival', e: '🎵', dur: 100, fx: { arr: 1.3, tip: 0.6 }, d: 'Vrolijke fans met veel fooi.' },
  { id: 'foo', n: 'Foodfestival', e: '🍴', dur: 90, fx: { price: 1.5 }, d: 'Iedereen wil topgerechten: +50% prijs.' },
  { id: 'reg', n: 'Regenbui', e: '☔', dur: 80, fx: { arr: 0.7, pat: 1.7, price: 1.3 }, d: 'Weinig mensen, maar die wachten graag en betalen meer.' },
  { id: 'cri', n: 'Restaurantcriticus', e: '🧐', dur: 120, fx: {}, goal: 6, goalT: 'Maak 6 klanten heel blij (4+ sterren)', d: 'Een beroemde criticus bezoekt je truck!' },
  { id: 'wed', n: 'Kookwedstrijd', e: '🏆', dur: 100, fx: {}, goal: 8, goalT: 'Serveer 8 gerechten supersnel', d: 'Wie serveert het snelst?' },
  { id: 'sch', n: 'Schoolreisje', e: '🚌', dur: 70, fx: { pat: 1.5 }, goal: 6, goalT: 'Serveer alle 6 kinderen', burst: 6, d: 'Hongerige kinderen, bestel wat snel en lekker!' },
  { id: 'vip', n: 'Beroemdheid', e: '🌟', dur: 60, fx: {}, goal: 1, goalT: 'Serveer de beroemdheid', vip: true, d: 'Een filmster wil bij jou eten. Betaalt flink!' },
];
export const EVM = {}; EVENTS.forEach((e) => { EVM[e.id] = e; });

// Franchise-voordelen (Gouden Lepels)
export const PERKS = [
  { id: 'cash', n: 'Startgeld', e: '💰', max: 6, d: 'Begin elke franchise met meer geld.' },
  { id: 'crew', n: 'Vaste ploeg', e: '🧑‍🍳', max: 5, d: 'Begin met een kok en serveerder (+3/+2 niveaus per stap).' },
  { id: 'fans', n: 'Trouwe fans', e: '💖', max: 5, d: '+10% klanten per stap.' },
  { id: 'disc', n: 'Slimme inkoop', e: '🏷️', max: 5, d: '-5% inkoopprijs per stap.' },
  { id: 'off', n: 'Slaaplekker', e: '🌙', max: 5, d: '+5% meer verdienen terwijl je weg bent.' },
  { id: 'menu', n: 'Grotere kaart', e: '📜', max: 3, d: '+1 menuplek per stap.' },
  { id: 'fast', n: 'Snelle handen', e: '⚡', max: 5, d: '+5% sneller koken per stap.' },
];
export const PERKM = {}; PERKS.forEach((p) => { PERKM[p.id] = p; });
export const perkCost = (lv) => lv + 1;
export const startCoins = (lv) => (lv ? Math.round(150 * Math.pow(4, lv)) : 0);

// Missies (ketting): [tekst, metriek, doel, beloning in seconden inkomen, minimale beloning]
export const MISSIONS = [
  ['Serveer 3 klanten', 'served', 3, 0, 15], ['Koop een verbetering in 🔧 Truck', 'upsum', 1, 0, 25], ['Serveer 15 klanten', 'served', 15, 0, 40],
  ['Ontgrendel een nieuw gerecht in 📖 Menu', 'rec', 2, 0, 40], ['Zet 2 gerechten op je menu', 'menu', 2, 0, 30], ['Haal een combo van 5', 'combo', 5, 60, 60],
  ['Huur een kok 👨‍🍳', 'kok', 1, 0, 50], ['Koop 5 ingrediënten op de markt 🛒', 'bought', 5, 0, 40], ['Verdien in totaal 300 🪙', 'earned', 300, 0, 100],
  ['Haal je eerste ster ⭐', 'stars', 1, 120, 150], ['Huur een serveerder 🤵', 'srv', 1, 0, 100], ['Maak 5 supergerechten (draai om + snel serveren)', 'perfect', 5, 120, 200],
  ['Ontgrendel 5 gerechten', 'rec', 5, 180, 250], ['Serveer 100 klanten', 'served', 100, 240, 300], ['Haal 3 sterren', 'stars', 3, 300, 500],
  ['Reis naar een tweede stad 🌍', 'cities', 2, 300, 600], ['Doe mee aan een evenement 🎪', 'events', 1, 300, 400], ['Koop een decoratie 🪴', 'decor', 1, 200, 200],
  ['Haal een combo van 15', 'combo', 15, 300, 500], ['Bouw een filiaal 🏢', 'branch', 1, 600, 800], ['Haal 6 sterren', 'stars', 6, 600, 1500],
  ['Breng een gerecht naar niveau 5', 'dishlv', 5, 600, 1500], ['Ontgrendel 15 gerechten', 'rec', 15, 900, 2500], ['Open 4 steden', 'cities', 4, 1200, 5000],
  ['Personeel: samen niveau 30', 'staffsum', 30, 1200, 4000], ['Haal 10 sterren', 'stars', 10, 1800, 20000], ['Serveer 1.000 klanten', 'served', 1000, 1800, 9000],
  ['Verdien in totaal 1 miljoen 🪙', 'earned', 1e6, 1800, 40000], ['Open alle 8 steden', 'cities', 8, 3600, 1e6], ['Open je eerste franchise 🏅', 'franch', 1, 3600, 1e5],
];

export function metric(S, k) {
  switch (k) {
    case 'served': return S.life.served; case 'earned': return S.life.earned; case 'perfect': return S.life.perfect; case 'combo': return S.life.combo;
    case 'rec': return Object.keys(S.rec).length; case 'menu': return S.menu.length; case 'bought': return S.life.bought; case 'stars': return starsOf(S.fame);
    case 'kok': case 'srv': case 'kas': case 'ent': case 'buy': return S.staff[k] | 0;
    case 'upsum': return Object.values(S.up).reduce((a, b) => a + b, 0);
    case 'cities': return Object.keys(S.cities).length; case 'events': return S.life.events; case 'decor': return S.decor.length;
    case 'branch': return Object.values(S.cities).filter((c) => c.b > 0).length;
    case 'dishlv': return Math.max(0, ...Object.values(S.rec)); case 'dishmax': return Object.values(S.rec).filter((l) => l >= MAX_DISH_LV).length;
    case 'staffsum': return Object.values(S.staff).reduce((a, b) => a + b, 0); case 'franch': return S.life.franch; case 'badges': return S.badges;
    case 'rating': return Math.max(0, ...Object.values(S.cities).map((c) => c.r)) * 10;
    case 'branchlv': return Object.values(S.cities).reduce((a, c) => a + c.b, 0);
    default: return 0;
  }
}

// Prestaties (automatisch gegenereerd uit families)
export const ACH = [];
(function () {
  const fam = (key, met, name, e, steps, fmtT) => steps.forEach((t, i) => ACH.push({ id: `${key}${i}`, met, t, e, n: `${name} ${fmtT ? fmtT(t) : fmt(t)}`, tier: i + 1 }));
  fam('sv', 'served', 'Klanten', '🙂', [10, 100, 500, 2000, 10000, 50000, 250000]);
  fam('er', 'earned', 'Verdiend', '🪙', [500, 20000, 1e6, 1e8, 1e10, 1e12, 1e14]);
  fam('pf', 'perfect', 'Supergerechten', '✨', [5, 50, 300, 1500, 8000]);
  fam('cb', 'combo', 'Combo', '🔥', [5, 10, 20, 40, 80]);
  fam('st', 'stars', 'Sterren', '⭐', [1, 3, 5, 8, 10, 14, 18, 22]);
  fam('rc', 'rec', 'Gerechten', '📖', [3, 8, 15, 25, 35, 47]);
  fam('ci', 'cities', 'Steden', '🌍', [2, 4, 6, 8]);
  fam('br', 'branch', 'Filialen', '🏢', [1, 3, 5, 8]);
  fam('sf', 'staffsum', 'Team', '👥', [5, 25, 60, 120, 250]);
  fam('ev', 'events', 'Evenementen', '🎪', [1, 5, 15, 40, 100]);
  fam('dc', 'decor', 'Decoraties', '🪴', [1, 5, 12, 20, 25]);
  fam('up', 'upsum', 'Truck-upgrades', '🔧', [3, 15, 40, 80, 150]);
  fam('dm', 'dishmax', 'Meestergerechten', '👨‍🍳', [1, 5, 15, 30]);
  fam('fr', 'franch', 'Franchises', '🏅', [1, 3, 10, 25]);
  fam('rt', 'rating', 'Topbeoordeling', '💯', [43, 46, 49], (t) => `${(t / 10).toFixed(1).replace('.', ',')}`);
})();

// Reviews
export const NAMES = ['Mila', 'Daan', 'Sofie', 'Lucas', 'Noor', 'Finn', 'Emma', 'Sem', 'Julia', 'Levi', 'Tess', 'Bram', 'Lotte', 'Jesse', 'Yara', 'Milan', 'Fleur', 'Thijs', 'Anouk', 'Ravi', 'Mei', 'Carlos', 'Aiko', 'Zoë'];
export const REVIEWS = {
  5: ['Heerlijk en razendsnel!', 'De beste truck van de stad!', 'Wauw, dit is magisch lekker.', 'Ik kom elke dag terug!', 'Vijf sterren, geen discussie.'],
  4: ['Erg lekker, snelle service.', 'Fijne sfeer en goed eten.', 'Top, ik kom zeker terug.', 'Lekker! Een klein beetje wachten.'],
  3: ['Best oké, wel even wachten.', 'Lekker, maar het duurde lang.', 'Prima hapje voor onderweg.'],
  2: ['Wat lang wachten...', 'Het eten was koud toen ik het kreeg.'],
  1: ['Ik ben weggelopen, te lang gewacht.', 'Helaas niet geserveerd.'],
};

/* =====================================================================
   3. STAAT, OPSLAG, AFLEIDINGEN
   ===================================================================== */
export const fameNeed = (n) => Math.round(FAME0 * Math.pow(FAMEG, n - 1));
export function starsOf(fame) { let n = 0; while (n < MAXSTAR && fame >= fameNeed(n + 1)) n++; return n; }

export function newState(now = Date.now(), keep = null) {
  const S = {
    v: SAVE_V, ts: now, coins: 0, fame: 0,
    run: { earned: 0, served: 0, t: 0 },
    life: { earned: 0, served: 0, perfect: 0, combo: 0, angry: 0, events: 0, bought: 0, franch: 0, days: 0, cooked: 0 },
    badges: 0, spent: 0, perks: {},
    city: 'ams', cities: { ams: { r: 4, b: 0 } },
    rec: { bro: 1 }, menu: ['bro'], stock: {}, staff: {}, up: {},
    look: { name: 'Mijn Foodtruck', col: 0, trim: 1, awn: 0 }, decor: [], placed: {},
    mdone: {}, ach: {}, daily: { last: '', streak: 0 }, tut: 0, set: { snd: 1, mus: 1 }, auto: { buy: 1 },
  };
  if (keep) { // franchise: bewaar meta
    S.badges = keep.badges; S.spent = keep.spent; S.perks = keep.perks; S.life = keep.life; S.look = keep.look; S.decor = keep.decor; S.placed = keep.placed;
    S.mdone = keep.mdone; S.ach = keep.ach; S.daily = keep.daily; S.tut = keep.tut; S.set = keep.set; S.auto = keep.auto;
    S.coins = startCoins(keep.perks.cash | 0);
    const crew = keep.perks.crew | 0;
    if (crew) { S.staff.kok = 3 * crew; S.staff.srv = 2 * crew; }
  }
  return S;
}

// Serialiseren: compact, onder MAX_DATA tekens
export function serialize(S) {
  const o = {
    v: SAVE_V, ts: S.ts, c: Math.round(S.coins * 100) / 100, f: Math.round(S.fame * 100) / 100, r: S.run, l: S.life, b: S.badges, sp: S.spent, pk: S.perks,
    ci: S.city, cs: S.cities, rc: S.rec, mn: S.menu, sk: S.stock, sf: S.staff, up: S.up, lk: S.look, dc: S.decor, pl: S.placed,
    md: Object.keys(S.mdone), ac: Object.keys(S.ach), dl: S.daily, tu: S.tut, st: S.set, au: S.auto,
  };
  let s = JSON.stringify(o);
  if (s.length > MAX_DATA) { o.ac = o.ac.slice(-100); s = JSON.stringify(o); }
  if (s.length > MAX_DATA) { o.md = o.md.slice(-60); s = JSON.stringify(o); }
  return s;
}
const objNum = (src, valid, mn = 0, mx = 1e15) => { const out = {}; if (src && typeof src === 'object') for (const k of Object.keys(src)) if (valid(k)) { const v = num(src[k], NaN); if (Number.isFinite(v)) out[k] = clamp(v, mn, mx); } return out; };

// Inlezen met migratie en controle; geeft null bij onleesbaar
export function parseSave(str, now = Date.now()) {
  let o;
  try { o = typeof str === 'string' ? JSON.parse(str) : str; } catch { return null; }
  if (!o || typeof o !== 'object') return null;
  const S = newState(now);
  S.ts = num(o.ts, now);
  S.coins = Math.max(0, num(o.c)); S.fame = Math.max(0, num(o.f));
  const r = o.r || {}; S.run = { earned: Math.max(0, num(r.earned)), served: Math.max(0, num(r.served)), t: Math.max(0, num(r.t)) };
  const l = o.l || {}; for (const k of Object.keys(S.life)) S.life[k] = Math.max(0, num(l[k]));
  S.badges = int(o.b); S.spent = int(o.sp); S.perks = objNum(o.pk, (k) => !!PERKM[k], 0, 20);
  S.cities = {};
  if (o.cs && typeof o.cs === 'object') for (const k of Object.keys(o.cs)) if (CITY[k] && o.cs[k]) S.cities[k] = { r: clamp(num(o.cs[k].r, 3.5), 1, 5), b: clamp(int(o.cs[k].b), 0, 60) };
  if (!S.cities.ams) S.cities.ams = { r: 4, b: 0 };
  S.city = CITY[o.ci] && S.cities[o.ci] ? o.ci : 'ams';
  S.rec = objNum(o.rc, (k) => !!DISH[k], 1, MAX_DISH_LV); if (!S.rec.bro) S.rec.bro = 1; for (const k of Object.keys(S.rec)) S.rec[k] = int(S.rec[k]);
  S.menu = Array.isArray(o.mn) ? o.mn.filter((k, i, a) => S.rec[k] && a.indexOf(k) === i) : ['bro'];
  S.stock = objNum(o.sk, (k) => !!ING[k], 0, 1e6);
  S.staff = objNum(o.sf, (k) => !!STAFF[k], 0, 40); for (const k of Object.keys(S.staff)) S.staff[k] = int(S.staff[k]);
  S.up = objNum(o.up, (k) => !!UPGM[k], 0, 40); for (const k of Object.keys(S.up)) S.up[k] = Math.min(int(S.up[k]), UPGM[k].max);
  const lk = o.lk || {}; S.look = { name: String(lk.name || 'Mijn Foodtruck').slice(0, 18), col: clamp(int(lk.col), 0, BODY_COL.length - 1), trim: clamp(int(lk.trim, 1), 0, TRIM_COL.length - 1), awn: clamp(int(lk.awn), 0, AWN.length - 1) };
  S.decor = Array.isArray(o.dc) ? o.dc.filter((k, i, a) => DECM[k] && a.indexOf(k) === i) : [];
  S.placed = {}; if (o.pl && typeof o.pl === 'object') for (const k of Object.keys(o.pl)) if (['dak', 'zij', 'lucht', 'g0', 'g1', 'g2'].includes(k) && S.decor.includes(o.pl[k]) && !Object.values(S.placed).includes(o.pl[k])) S.placed[k] = o.pl[k];
  S.mdone = {}; (Array.isArray(o.md) ? o.md : []).forEach((k) => { S.mdone[String(k)] = 1; });
  S.ach = {}; (Array.isArray(o.ac) ? o.ac : []).forEach((k) => { S.ach[String(k)] = 1; });
  const dl = o.dl || {}; S.daily = { last: String(dl.last || ''), streak: clamp(int(dl.streak), 0, 7) };
  S.tut = clamp(int(o.tu), 0, 99); const st = o.st || {}; S.set = { snd: st.snd === 0 ? 0 : 1, mus: st.mus === 0 ? 0 : 1 };
  S.auto = { buy: o.au && o.au.buy === 0 ? 0 : 1 };
  if (!S.menu.length) S.menu = ['bro'];
  return S;
}

function decorSum(S) {
  const d = { arr: 0, pat: 0, tip: 0 };
  for (const k of Object.keys(S.placed)) { const it = DECM[S.placed[k]]; if (it) { d.arr += it.arr || 0; d.pat += it.pat || 0; d.tip += it.tip || 0; } }
  return d;
}
export function branchRateOf(S, stars, badges) {
  let sum = 0;
  for (const id of Object.keys(S.cities)) { const b = S.cities[id].b; if (b > 0) sum += branchYield(CITY[id], b); }
  return sum * (1 + 0.04 * stars) * badges;
}

export function derive(S, ev) {
  const stars = starsOf(S.fame);
  const city = CITY[S.city] || CITY.ams;
  const cs = S.cities[S.city] || { r: 4, b: 0 };
  const U = (k) => S.up[k] | 0, T = (k) => S.staff[k] | 0, P = (k) => S.perks[k] | 0;
  const dec = decorSum(S);
  const em = (k) => (ev && ev[k] != null ? ev[k] : 1);
  const badges = 1 + BADGE_MUL * Math.pow(S.badges, 0.7);
  const D = {
    stars, city, wealth: city.w, rating: cs.r, badgeMul: badges,
    burners: 1 + U('brn'), cap: 3 + U('ctr'), menuSlots: 2 + U('mnu') + P('menu'),
    cookSpeed: (1 + 0.12 * U('pan')) * (1 + 0.05 * T('kok')) * (1 + 0.05 * P('fast')) * em('cook'),
    patMul: (1 + 0.06 * U('pat')) * (1 + 0.03 * T('ent')) * (1 + dec.pat) * em('pat'),
    arrival: city.arr * (1 + 0.1 * U('sign')) * (1 + 0.05 * stars) * (0.7 + 0.15 * cs.r) * (1 + 0.02 * T('ent')) * (1 + 0.1 * P('fans')) * (1 + dec.arr) * em('arr') * (S.life.served < 12 ? 2.2 : 1),
    priceMul: (1 + 0.06 * U('cash')) * (1 + 0.04 * stars) * badges * city.w * em('price'),
    tip: 0.05 * T('kas') + dec.tip + (ev && ev.tip != null ? ev.tip : 0),
    fridge: 30 + 25 * U('frg'), disc: Math.min(0.6, 0.015 * T('buy') + 0.05 * P('disc')), mktScale: Math.pow(1.12, stars),
    autoCook: T('kok') > 0, autoServe: T('srv') > 0, autoBuy: T('buy') > 0, autoFlip: T('kok') >= 5,
    kokReact: Math.max(0.35, 2.2 - 0.12 * T('kok')), srvReact: Math.max(0.3, 2.4 - 0.15 * T('srv')),
    branch: branchRateOf(S, stars, badges), offEff: Math.min(1, BASE_OFF_EFF + 0.05 * P('off')),
  };
  D.quickAuto = D.srvReact <= 1.5;
  return D;
}

// Marktprijsfactor, deterministisch uit de tijd (geen opslag nodig). Bereik ongeveer 0,56 .. 1,44
export function mktFactor(id, tSec) {
  const g = ING[id];
  return 1 + 0.26 * Math.sin(tSec / g.p1 * 6.2832 + g.ph) + 0.12 * Math.sin(tSec / g.p2 * 6.2832 + g.ph * 1.7) + 0.06 * Math.sin(tSec / 37 * 6.2832 + g.ph * 2.3);
}
export const ingAvgCost = (d, D) => d.ing.reduce((a, [id, q]) => a + q * ING[id].p, 0) * D.mktScale * (1 - D.disc);

export function menuStats(S, D) {
  let w = 0, price = 0, cst = 0, cook = 0, fame = 0;
  const ids = S.menu.length ? S.menu : ['bro'];
  for (const id of ids) {
    const d = DISH[id], liked = D.city.likes.includes(d.tag), wt = liked ? 2.2 : 1;
    w += wt; price += wt * dishPrice(d, S.rec[id] || 1) * D.priceMul * (liked ? 1.35 : 1); cst += wt * ingAvgCost(d, D); cook += wt * d.cook; fame += wt * d.tier;
  }
  return { price: price / w, cost: cst / w, cook: cook / w, fame: fame / w };
}

// Analytische inkomstensnelheid (gebruikt voor offline-voortgang, tips en de balans-simulatie)
export function rates(S, mode = 'idle', D0) {
  const D = D0 || derive(S, null);
  const m = menuStats(S, D);
  const kok = D.autoCook, srv = D.autoServe;
  const rEq = Math.max(D.rating, 4.6), arrEq = D.arrival * (0.7 + 0.15 * rEq) / (0.7 + 0.15 * D.rating);   // goed spel: beoordeling groeit richting 5
  const cookCap = D.burners * D.cookSpeed / Math.max(0.5, m.cook);
  let cps, q;
  const auto = (D.autoFlip ? 1.05 : 1) * (D.quickAuto ? 1.08 : 1) * (D.autoFlip && D.quickAuto ? 1.05 : 1);
  if (mode === 'active') {
    const human = kok && srv ? 99 : kok ? 0.9 : 0.55;
    cps = Math.min(arrEq, cookCap, human); q = Math.max(1.19, auto);
  } else {
    const f = kok && srv ? 1 : kok ? 0.35 : srv ? 0 : 0.08;
    cps = Math.min(arrEq, cookCap * 0.85) * f; q = auto;
  }
  q *= (1 + 0.5 * Math.min(1, cps * 8)) * 1.07;   // combo en af en toe een VIP   // combo (tot +50%)
  const val = Math.max(0, m.price * q * (1 + D.tip) - m.cost);
  return { cps, val, coins: cps * val + D.branch, fame: cps * m.fame * (mode === 'active' ? 1.4 : 1.1), branch: D.branch, cookCap, m };
}

// Offline-voortgang (max 8 uur)
export function offlineGain(S, sec) {
  sec = clamp(num(sec), 0, MAX_OFFLINE);
  if (sec < 1) return { sec: 0, coins: 0, served: 0, fame: 0 };
  const D = derive(S, null), r = rates(S, 'idle', D), eff = D.offEff;
  const coins = r.coins * sec * eff, served = r.cps * sec * eff, fame = r.fame * sec * eff;
  S.coins += coins; S.fame += fame; S.run.earned += coins; S.life.earned += coins; S.run.served += served; S.life.served += Math.floor(served);
  return { sec, coins, served, fame };
}

// Franchise (prestige)
export const prestigeGain = (S) => Math.floor(Math.sqrt(Math.max(0, S.run.earned) / 3e6));
export const canPrestige = (S) => starsOf(S.fame) >= 10 && prestigeGain(S) >= 1;

// Slim menu: kies de beste gerechten voor de huidige stad
export function bestMenu(S) {
  const D = derive(S, null);
  const sc = (id) => { const d = DISH[id], liked = D.city.likes.includes(d.tag); return (dishPrice(d, S.rec[id] || 1) * (liked ? 1.35 * 2.2 : 1) - ingAvgCost(d, D) * (liked ? 2.2 : 1)) / (1 + d.cook / 12); };
  const ids = Object.keys(S.rec).sort((a, b) => sc(b) - sc(a));
  const out = []; for (const id of ids) { if (out.length >= D.menuSlots) break; out.push(id); }
  return out;
}

export function missionReward(S, i) {
  const m = MISSIONS[i]; if (!m) return 0;
  const r = rates(S, 'active');
  return Math.round(Math.max(m[4], r.coins * m[3]));
}
export function dailyReward(S, streakDay) {
  const r = rates(S, 'active');
  return Math.round(Math.max(120 * streakDay, r.coins * 400 * (0.5 + 0.25 * streakDay)));
}

/* =====================================================================
   4. HET SPEL (pure logica, geen DOM)
   ===================================================================== */
export function replaceState(S, fresh) { for (const k of Object.keys(S)) delete S[k]; Object.assign(S, fresh); return S; }
export function dailyState(S, today = dayKey()) {
  if (S.daily.last === today) return { can: false, day: S.daily.streak };
  const day = S.daily.last === yesterdayKey(new Date(today.replace(/-/g, '/') + ' 12:00')) ? (S.daily.streak % 7) + 1 : 1;
  return { can: true, day };
}
export function activeMissions(S) { const out = []; for (let i = 0; i < MISSIONS.length && out.length < 3; i++) if (!S.mdone[i]) out.push(i); return out; }

export class Game {
  constructor(S, o = {}) {
    this.S = S; this.rng = o.rng || Math.random; this.wall = o.wall || (() => Date.now() / 1000);
    this.slots = []; this.out = []; this.acc = 1; this.combo = 0; this.comboT = 0; this.cid = 1; this.t = 0; this.sec = 0;
    this.ev = null; this.invite = null; this.evOn = !!o.events; this.evNext = o.evFirst != null ? o.evFirst : 150;
    this.reviews = []; this.kokT = 0; this.travelT = 0; this.dirty = false; this.d = null; this.goalT = 0;
    const slots = this.D.menuSlots; if (S.menu.length > slots) S.menu.length = slots;
  }
  emit(type, o) { if (this.out.length < 300) this.out.push(Object.assign({ type }, o)); }
  touch() { this.d = null; this.dirty = true; }
  evFx() { return this.ev ? EVM[this.ev.id].fx : null; }
  get D() { return this.d || (this.d = derive(this.S, this.evFx())); }
  stockOf(id) { return this.S.stock[id] || 0; }
  price(id) { return ING[id].p * mktFactor(id, this.wall()) * this.D.mktScale * (1 - this.D.disc); }
  trend(id) { const t = this.wall(); return mktFactor(id, t + 45) - mktFactor(id, t); }
  feasible(d) { return d.ing.every(([id, q]) => this.stockOf(id) >= q); }
  burning() { let n = 0; for (const c of this.slots) if (c && c.st === 'cook') n++; return n; }
  freeSlot() { const cap = this.D.cap; for (let i = 0; i < cap; i++) if (!this.slots[i]) return i; return -1; }
  waiting() { return this.slots.filter(Boolean).length; }
  clearSlots() { this.slots = []; this.acc = 0.5; }
  addCoins(n) { const S = this.S; S.coins += n; S.run.earned += n; S.life.earned += n; }
  spend(n) { const S = this.S; if (S.coins + 1e-9 < n) return false; S.coins = Math.max(0, S.coins - n); this.dirty = true; return true; }
  addFame(x) { const S = this.S, b = starsOf(S.fame); S.fame += x; const a = starsOf(S.fame); if (a > b) { this.touch(); this.emit('star', { n: a }); } }
  rate(r5) { const cs = this.S.cities[this.S.city]; if (cs) cs.r = clamp(cs.r * 0.94 + r5 * 0.06, 1, 5); }

  /* ----- klanten ----- */
  pickDish(vip, kid) {
    const S = this.S, D = this.D, ids = S.menu.length ? S.menu : ['bro'];
    if (vip) return ids.reduce((a, b) => (DISH[b].price > DISH[a].price ? b : a));
    if (kid) return ids.reduce((a, b) => (DISH[b].price < DISH[a].price ? b : a));
    const pick = (list) => {
      const ws = list.map((id) => (D.city.likes.includes(DISH[id].tag) ? 2.2 : 1)); let r = this.rng() * ws.reduce((a, b) => a + b, 0);
      for (let i = 0; i < list.length; i++) { r -= ws[i]; if (r <= 0) return list[i]; }
      return list[list.length - 1];
    };
    let id = pick(ids);
    if (!this.feasible(DISH[id]) && this.rng() < 0.7) { const f = ids.filter((k) => this.feasible(DISH[k])); id = f.length ? pick(f) : 'bro'; }
    return id;
  }
  spawn(o = {}) {
    const i = this.freeSlot(); if (i < 0) return -1;
    const S = this.S, D = this.D, rg = this.rng;
    const vip = !!o.vip || (!o.kid && S.life.served > 25 && rg() < 0.025);
    const id = this.pickDish(vip, o.kid), d = DISH[id];
    const patMax = (22 + 3 * d.cook) * D.patMul * (vip ? 1.5 : 1) * (o.kid ? 1.2 : 1);
    this.slots[i] = {
      id: this.cid++, dish: id, st: 'wait', age: 0, pat: patMax, patMax, cook: 0, dur: 0, flip: 0, flipEnd: 0, ready: 0, vip, kid: !!o.kid,
      liked: D.city.likes.includes(d.tag), need: !this.feasible(d), look: { sk: Math.floor(rg() * 6), hr: Math.floor(rg() * 6), sh: Math.floor(rg() * 360), hat: Math.floor(rg() * 4) },
    };
    this.emit('arrive', { slot: i, vip });
    return i;
  }

  /* ----- koken en serveren ----- */
  startCook(i, auto) {
    const c = this.slots[i]; if (!c || c.st !== 'wait') return 'none';
    if (this.burning() >= this.D.burners) return 'burn';
    const d = DISH[c.dish]; if (!this.feasible(d)) return 'stock';
    for (const [id, q] of d.ing) this.S.stock[id] = this.stockOf(id) - q;
    c.st = 'cook'; c.cook = 0; c.dur = d.cook / this.D.cookSpeed; c.flip = 0; this.S.life.cooked++; this.dirty = true;
    this.emit('cook', { slot: i, auto: !!auto });
    return 'ok';
  }
  flip(i, auto) {
    const c = this.slots[i]; if (!c || c.st !== 'cook' || c.flip !== 1) return false;
    c.flip = 2; c.cook = Math.min(c.dur, c.cook + c.dur * 0.12); this.emit('flip', { slot: i, auto: !!auto }); return true;
  }
  quickBuyFor(i) { // koop de ontbrekende ingrediënten voor deze klant tegen de dagprijs
    const c = this.slots[i]; if (!c || c.st !== 'wait') return 'none';
    const d = DISH[c.dish], S = this.S; let total = 0; const miss = [];
    for (const [id, q] of d.ing) { const m = q - this.stockOf(id); if (m > 0) { miss.push([id, m]); total += m * this.price(id); } }
    if (!miss.length) return 'ok';
    if (S.coins < total) return 'coins';
    if (miss.some(([id, m]) => this.stockOf(id) + m > this.D.fridge)) return 'full';
    S.coins -= total; for (const [id, m] of miss) { S.stock[id] = this.stockOf(id) + m; S.life.bought += m; }
    this.dirty = true; this.emit('buy', { auto: false }); return 'ok';
  }
  serve(i, auto) {
    const c = this.slots[i]; if (!c || c.st !== 'ready') return null;
    const S = this.S, D = this.D, d = DISH[c.dish], lv = S.rec[c.dish] || 1;
    const quick = auto ? D.quickAuto : c.ready <= 1.5, flipped = c.flip === 2, perfect = flipped && quick;
    const q = (flipped ? 1.05 : 1) * (quick ? 1.08 : 1) * (perfect ? 1.05 : 1);
    this.combo++; this.comboT = 6; if (this.combo > S.life.combo) S.life.combo = this.combo;
    const pay = dishPrice(d, lv) * D.priceMul * (c.liked ? 1.35 : 1) * (c.vip ? 4 : 1) * q * (1 + 0.025 * Math.min(this.combo, 20)) * (1 + D.tip);
    this.addCoins(pay);
    const pf = c.pat / c.patMax; let r5 = pf >= 0.55 ? 5 : pf >= 0.35 ? 4 : pf >= 0.15 ? 3 : 2; if (perfect) r5 = 5;
    this.rate(r5); S.run.served++; S.life.served++; if (perfect) S.life.perfect++;
    this.addFame(d.tier * (perfect ? 2 : 1) * (c.vip ? 3 : 1));
    this.slots[i] = null; this.d = null; this.dirty = true;
    this.reviewAdd(r5, d);
    if (this.ev) {
      const e = EVM[this.ev.id];
      if (e.goal && ((e.id === 'cri' && r5 >= 4) || (e.id === 'wed' && quick) || (e.id === 'sch' && c.kid) || (e.id === 'vip' && c.vip))) { this.ev.prog++; if (this.ev.prog >= e.goal) this.ev.left = 0; }
    }
    this.emit('serve', { slot: i, pay, perfect, quick, combo: this.combo, r5, vip: c.vip, em: d.e, cid: c.id });
    return pay;
  }
  leaveAngry(i) {
    const c = this.slots[i]; if (!c) return;
    this.slots[i] = null; this.combo = 0; this.S.life.angry++; this.rate(1); this.d = null;
    this.reviewAdd(1, DISH[c.dish]);
    this.emit('angry', { slot: i, cid: c.id });
  }
  reviewAdd(r5, d) {
    if (this.rng() > 0.35 && r5 >= 3) return;
    const arr = REVIEWS[r5]; this.reviews.unshift({ n: NAMES[Math.floor(this.rng() * NAMES.length)], r: r5, t: arr[Math.floor(this.rng() * arr.length)], e: d.e });
    if (this.reviews.length > 12) this.reviews.pop();
  }
  tapSlot(i) { // één tik: koken, omdraaien of serveren
    const c = this.slots[i]; if (!c) return 'none';
    if (c.st === 'wait') return this.startCook(i, false);
    if (c.st === 'cook') return this.flip(i, false) ? 'flip' : 'busy';
    if (c.st === 'ready') return this.serve(i, false) != null ? 'serve' : 'none';
    return 'none';
  }

  /* ----- tikken van de klok ----- */
  tick(dt) {
    const S = this.S; let D = this.D;
    this.t += dt; S.run.t += dt; this.sec += dt;
    if (D.branch > 0) this.addCoins(D.branch * dt);
    if (this.travelT > 0) this.travelT -= dt;
    else {
      this.acc = Math.min(this.acc + D.arrival * dt, 1.6);
      if (this.acc >= 1 && this.freeSlot() >= 0) { this.acc -= 1; this.spawn(); }
    }
    for (let i = 0; i < this.slots.length; i++) {
      const c = this.slots[i]; if (!c) continue;
      c.age += dt; c.pat -= dt;
      if (c.st === 'wait') c.need = !this.feasible(DISH[c.dish]);
      else if (c.st === 'cook') {
        c.cook += dt;
        if (c.flip === 0 && c.cook >= c.dur * 0.35) { c.flip = 1; c.flipEnd = c.cook + 1.6; this.emit('flipopen', { slot: i }); if (D.autoFlip) this.flip(i, true); }
        else if (c.flip === 1 && c.cook > c.flipEnd) c.flip = 3;
        if (c.cook >= c.dur) { c.st = 'ready'; c.ready = 0; this.emit('ready', { slot: i }); }
      } else if (c.st === 'ready') c.ready += dt;
      if (c.pat <= 0) this.leaveAngry(i);
    }
    if (D.autoCook) {
      this.kokT -= dt;
      if (this.kokT <= 0) {
        let best = -1, bp = 1e9;
        for (let i = 0; i < this.slots.length; i++) { const c = this.slots[i]; if (c && c.st === 'wait' && !c.need && c.pat < bp) { bp = c.pat; best = i; } }
        if (best < 0 && !D.autoBuy) { // geen inkoper: de kok haalt zelf even ontbrekende ingrediënten voor de meest ongeduldige klant
          let bn = -1, bq = 1e9; for (let i = 0; i < this.slots.length; i++) { const c = this.slots[i]; if (c && c.st === 'wait' && c.need && c.pat < bq) { bq = c.pat; bn = i; } }
          if (bn >= 0 && this.burning() < D.burners && this.quickBuyFor(bn) === 'ok') best = bn;
        }
        if (best >= 0 && this.startCook(best, true) === 'ok') this.kokT = D.kokReact; else this.kokT = 0.25;
      }
    }
    if (D.autoServe) for (let i = 0; i < this.slots.length; i++) { const c = this.slots[i]; if (c && c.st === 'ready' && c.ready >= D.srvReact) this.serve(i, true); }
    if (this.combo > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = 0; }
    this.tickEvents(dt);
    if (this.sec >= 1) { this.sec -= 1; this.autoBuy(); this.checkGoals(); }
  }
  autoBuy() {
    const S = this.S, D = this.D; if (!D.autoBuy || !S.auto.buy) return;
    const need = new Set(); for (const id of S.menu) for (const [k] of DISH[id].ing) need.add(k);
    const lvl = S.staff.buy | 0, base = Math.min(D.fridge, 8 + 3 * lvl);
    for (const k of need) {
      const f = mktFactor(k, this.wall()), have = this.stockOf(k);
      const target = f < 0.82 ? Math.floor(D.fridge * 0.9) : f > 1.2 ? Math.floor(base * 0.4) : base;
      if (have >= target) continue;
      const p = this.price(k), m = Math.min(target - have, D.fridge - have, 10 + lvl, Math.floor(S.coins / p));
      if (m > 0) { S.coins -= p * m; S.stock[k] = have + m; S.life.bought += m; this.dirty = true; }
    }
  }
  checkGoals() {
    const S = this.S;
    for (const a of ACH) if (!S.ach[a.id] && metric(S, a.met) >= a.t) {
      S.ach[a.id] = 1; const r = Math.round(Math.max(50 * a.tier, rates(S, 'active').coins * 15 * a.tier)); this.addCoins(r); this.dirty = true; this.emit('ach', { id: a.id, coins: r });
    }
    this.mNote = this.mNote || {};
    for (const i of activeMissions(S)) if (metric(S, MISSIONS[i][1]) >= MISSIONS[i][2] && !this.mNote[i]) { this.mNote[i] = 1; this.emit('missionReady', { i }); }
  }

  /* ----- evenementen ----- */
  tickEvents(dt) {
    if (!this.evOn) return;
    if (this.ev) { this.ev.left -= dt; this.eventSpawns(dt); if (this.ev.left <= 0) this.endEvent(); }
    else if (this.invite) { this.invite.left -= dt; if (this.invite.left <= 0) { this.invite = null; this.emit('inviteGone', {}); } }
    else if (this.S.life.served >= 25) {
      this.evNext -= dt;
      if (this.evNext <= 0) { const e = EVENTS[Math.floor(this.rng() * EVENTS.length)]; this.invite = { id: e.id, left: 60 }; this.evNext = 240 + this.rng() * 180; this.emit('invite', { id: e.id }); }
    }
  }
  startEvent() {
    if (!this.invite || this.ev) return false;
    const e = EVM[this.invite.id]; this.ev = { id: e.id, left: e.dur, dur: e.dur, prog: 0, kids: e.burst || 0, vip: e.vip ? 1 : 0, kt: 0 }; this.invite = null; this.touch();
    this.eventSpawns(0);
    this.emit('evStart', { id: e.id }); return true;
  }
  eventSpawns(dt) { // kinderen en beroemdheid komen binnen zodra er een plek vrij is
    const ev = this.ev; if (!ev) return;
    ev.kt -= dt; if (ev.kt > 0) return;
    if (ev.kids > 0 && this.spawn({ kid: true }) >= 0) { ev.kids--; ev.kt = 0.9; }
    else if (ev.vip && this.spawn({ vip: true }) >= 0) { ev.vip = 0; ev.kt = 0.5; }
    else ev.kt = 0.4;
  }
  declineEvent() { this.invite = null; this.evNext = 120 + this.rng() * 120; }
  endEvent() {
    const e = EVM[this.ev.id], S = this.S; const ok = !e.goal || this.ev.prog >= e.goal; let coins = 0;
    if (e.goal && ok) { coins = Math.round(Math.max(300, rates(S, 'active').coins * 240)); this.addCoins(coins); this.addFame(fameNeed(starsOf(S.fame) + 1) * 0.1); }
    S.life.events++; this.ev = null; this.touch(); this.emit('evEnd', { id: e.id, ok, coins });
  }

  /* ----- kopen en verbeteren (geven 'ok' of een foutcode) ----- */
  buyIng(id, n) {
    const D = this.D, S = this.S; if (!ING[id]) return 'none';
    n = Math.min(n, D.fridge - this.stockOf(id)); if (n <= 0) return 'full';
    const p = this.price(id); n = Math.min(n, Math.floor(S.coins / p)); if (n <= 0) return 'coins';
    S.coins -= p * n; S.stock[id] = this.stockOf(id) + n; S.life.bought += n; this.dirty = true; this.emit('buy', { id, n }); return 'ok';
  }
  fillIng(id) { return this.buyIng(id, 9999); }
  unlockDish(id) {
    const d = DISH[id], S = this.S; if (!d || S.rec[id]) return 'have';
    if (starsOf(S.fame) < d.st) return 'stars'; if (!this.spend(d.unl)) return 'coins';
    S.rec[id] = 1; if (S.menu.length < this.D.menuSlots) S.menu.push(id); this.touch(); this.emit('unlock', { id }); return 'ok';
  }
  upDish(id) {
    const d = DISH[id], S = this.S, lv = S.rec[id]; if (!d || !lv) return 'none'; if (lv >= MAX_DISH_LV) return 'max';
    if (!this.spend(dishUpCost(d, lv))) return 'coins'; S.rec[id] = lv + 1; this.touch(); this.emit('up', { id }); return 'ok';
  }
  toggleMenu(id) {
    const S = this.S; if (!S.rec[id]) return 'none'; const i = S.menu.indexOf(id);
    if (i >= 0) { if (S.menu.length <= 1) return 'last'; S.menu.splice(i, 1); } else { if (S.menu.length >= this.D.menuSlots) return 'slots'; S.menu.push(id); }
    this.touch(); return 'ok';
  }
  autoMenu() { this.S.menu = bestMenu(this.S); this.touch(); }
  upStaff(id) {
    const S = this.S, lv = S.staff[id] | 0; if (!STAFF[id]) return 'none'; if (lv >= STAFF[id].max) return 'max';
    if (!this.spend(staffCost(id, lv))) return 'coins'; S.staff[id] = lv + 1; this.touch(); this.emit('hire', { id, lv: lv + 1 }); return 'ok';
  }
  upTruck(id) {
    const S = this.S, lv = S.up[id] | 0; if (!UPGM[id]) return 'none'; if (lv >= UPGM[id].max) return 'max';
    if (!this.spend(upCost(id, lv))) return 'coins'; S.up[id] = lv + 1; this.touch(); this.emit('upgrade', { id, lv: lv + 1 }); return 'ok';
  }
  openCity(id) {
    const c = CITY[id], S = this.S; if (!c || S.cities[id]) return 'have';
    if (starsOf(S.fame) < c.st) return 'stars'; if (!this.spend(c.cost)) return 'coins';
    S.cities[id] = { r: 4, b: 0 }; this.touch(); this.emit('city', { id }); return 'ok';
  }
  travel(id) {
    const S = this.S; if (!S.cities[id]) return 'none'; if (S.city === id) return 'here';
    S.city = id; this.clearSlots(); this.travelT = 2.5; this.touch();
    S.menu = S.menu.length ? S.menu : ['bro']; this.emit('travel', { id }); return 'ok';
  }
  branch(id) {
    const S = this.S, c = CITY[id], cs = S.cities[id]; if (!cs) return 'none'; const lv = cs.b; if (lv >= 40) return 'max';
    if (!this.spend(lv ? branchUpCost(c, lv) : branchBuild(c))) return 'coins'; cs.b = lv + 1; this.touch(); this.emit('branch', { id, lv: lv + 1 }); return 'ok';
  }
  buyDecor(id) {
    const S = this.S, it = DECM[id]; if (!it) return 'none'; if (S.decor.includes(id)) return 'have'; if (!this.spend(it.price)) return 'coins';
    S.decor.push(id); this.placeDecor(id); this.touch(); this.emit('decor', { id }); return 'ok';
  }
  placeDecor(id) { // plaats op de eerste vrije plek (of haal weg als al geplaatst)
    const S = this.S, it = DECM[id]; if (!it || !S.decor.includes(id)) return 'none';
    const cur = Object.keys(S.placed).find((k) => S.placed[k] === id);
    if (cur) { delete S.placed[cur]; this.touch(); return 'removed'; }
    const slots = SLOTS[it.slot]; let k = slots.find((s) => !S.placed[s]); if (!k) k = slots[0];
    S.placed[k] = id; this.touch(); return 'ok';
  }
  setLook(k, v) {
    const L = this.S.look;
    if (k === 'name') L.name = String(v).slice(0, 18);
    else if (k === 'col') L.col = clamp(int(v), 0, BODY_COL.length - 1);
    else if (k === 'trim') L.trim = clamp(int(v), 0, TRIM_COL.length - 1);
    else if (k === 'awn') L.awn = clamp(int(v), 0, AWN.length - 1);
    this.dirty = true;
  }
  claimMission(i) {
    const S = this.S; if (S.mdone[i] || !MISSIONS[i]) return 'none'; if (metric(S, MISSIONS[i][1]) < MISSIONS[i][2]) return 'notyet';
    const r = missionReward(S, i); this.addCoins(r); S.mdone[i] = 1; this.dirty = true; this.emit('mission', { i, coins: r }); return r;
  }
  claimDaily(today = dayKey()) {
    const S = this.S, ds = dailyState(S, today); if (!ds.can) return null;
    const coins = dailyReward(S, ds.day); this.addCoins(coins);
    let gift = '';
    if (ds.day === 3 || ds.day === 7) { for (const id of ING_IDS) S.stock[id] = Math.min(this.D.fridge, this.stockOf(id) + (ds.day === 7 ? 15 : 8)); gift = ds.day === 7 ? 'Een kist verse ingrediënten (+15 van alles)!' : 'Extra ingrediënten (+8 van alles)!'; }
    S.daily = { last: today, streak: ds.day }; S.life.days++; this.dirty = true;
    return { coins, day: ds.day, gift };
  }
  buyPerk(id) {
    const S = this.S, p = PERKM[id]; if (!p) return 'none'; const lv = S.perks[id] | 0; if (lv >= p.max) return 'max';
    if (S.badges - S.spent < perkCost(lv)) return 'badges'; S.spent += perkCost(lv); S.perks[id] = lv + 1; this.touch(); return 'ok';
  }
  prestige() {
    const S = this.S; if (!canPrestige(S)) return 'no';
    const gain = prestigeGain(S), keep = { badges: S.badges + gain, spent: S.spent, perks: S.perks, life: S.life, look: S.look, decor: S.decor, placed: S.placed, mdone: S.mdone, ach: S.ach, daily: S.daily, tut: S.tut, set: S.set, auto: S.auto };
    keep.life.franch++;
    replaceState(S, newState(Date.now(), keep)); this.slots = []; this.ev = null; this.invite = null; this.combo = 0; this.acc = 1; this.mNote = {}; this.touch();
    this.emit('franchise', { gain }); return gain;
  }
  hardReset() { replaceState(this.S, newState()); this.slots = []; this.ev = null; this.invite = null; this.combo = 0; this.mNote = {}; this.acc = 1; this.touch(); }
}

/* =====================================================================
   5. GELUID (WebAudio, alles synthetisch, met aan/uit)
   ===================================================================== */
export function makeAudio() {
  let ac = null, out = null, mus = null, noiseBuf = null, mt = null, step = 0, dead = false, snd = true, music = true;
  const AC = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
  function ensure() {
    if (dead || !AC) return null;
    if (!ac) {
      try { ac = new AC(); out = ac.createGain(); out.gain.value = 0.7; out.connect(ac.destination); mus = ac.createGain(); mus.gain.value = 0.5; mus.connect(out); } catch { ac = null; return null; }
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return ac;
  }
  function tone(dest, f, dur, type, vol, at = 0, slide = 0) {
    const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, f0, f1, at = 0) {
    if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const t = ac.currentTime + at, s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; fl.type = 'bandpass'; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(Math.max(50, f1), t + dur); fl.Q.value = 1.2;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(out); s.start(t); s.stop(t + dur + 0.05);
  }
  const P = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784];
  const SFX = {
    tap: () => tone(out, 760, 0.07, 'triangle', 0.08),
    pop: () => tone(out, 540, 0.08, 'sine', 0.05, 0, 260),
    cook: () => { noise(0.45, 0.07, 3600, 1800); tone(out, 300, 0.1, 'triangle', 0.07, 0, 160); },
    flipopen: () => tone(out, 1200, 0.06, 'sine', 0.05),
    flip: () => { tone(out, 520, 0.14, 'triangle', 0.1, 0, 520); tone(out, 1040, 0.1, 'sine', 0.06, 0.08); },
    ready: () => { tone(out, 1175, 0.28, 'sine', 0.1); tone(out, 1568, 0.3, 'sine', 0.06, 0.05); },
    serve: (o) => { const k = Math.min(8, (o && o.combo) || 1); tone(out, 880 + k * 40, 0.09, 'square', 0.04); tone(out, 1175 + k * 50, 0.2, 'square', 0.045, 0.07); },
    perfect: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(out, f, 0.22, 'triangle', 0.08, i * 0.06)),
    buy: () => { tone(out, 660, 0.07, 'triangle', 0.07); tone(out, 880, 0.1, 'triangle', 0.07, 0.06); },
    err: () => tone(out, 190, 0.2, 'sawtooth', 0.05, 0, -60),
    angry: () => tone(out, 260, 0.3, 'sawtooth', 0.04, 0, -120),
    up: () => [440, 554, 659, 880].forEach((f, i) => tone(out, f, 0.18, 'triangle', 0.07, i * 0.07)),
    star: () => [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(out, f, 0.35, 'triangle', 0.08, i * 0.1)),
    ach: () => [784, 988, 1175, 1568].forEach((f, i) => tone(out, f, 0.25, 'sine', 0.07, i * 0.08)),
    event: () => { tone(out, 392, 0.18, 'square', 0.04); tone(out, 523, 0.18, 'square', 0.04, 0.18); tone(out, 659, 0.4, 'square', 0.04, 0.36); },
    travel: () => { noise(1.6, 0.06, 300, 900); tone(out, 120, 1.4, 'sawtooth', 0.03, 0, 80); },
    coin: () => { tone(out, 1318, 0.07, 'square', 0.035); tone(out, 1760, 0.16, 'square', 0.035, 0.06); },
  };
  function musicTick() {
    if (!ac || !music || !snd || dead || ac.state !== 'running') return;
    const roots = [130.8, 110, 87.3, 98], bar = Math.floor(step / 8) % 4, r = roots[bar], s = step % 8, t0 = 0.05;
    if (s === 0) tone(mus, r, 1.1, 'triangle', 0.13, t0);
    if (s === 4) tone(mus, r * 1.5, 0.7, 'triangle', 0.06, t0);
    if (Math.random() < 0.62) { const f = P[Math.floor(Math.random() * P.length)] * (bar === 1 ? 0.84 : bar === 2 ? 0.89 : 1); tone(mus, f, 0.45, 'triangle', 0.06 + Math.random() * 0.02, t0); }
    step++;
  }
  function sync() {
    const want = snd && music && !!ac && !dead;
    if (want && !mt) mt = setInterval(musicTick, 330);
    if (!want && mt) { clearInterval(mt); mt = null; }
  }
  return {
    ensure,
    set(s, m) { snd = !!s; music = !!m; if (out) out.gain.value = snd ? 0.7 : 0; sync(); },
    start() { if (!ensure()) return; sync(); },
    play(name, o) { if (!snd) return; if (!ensure()) return; try { if (SFX[name]) SFX[name](o); } catch { /* geluid is bijzaak */ } },
    close() { dead = true; if (mt) clearInterval(mt); mt = null; try { if (ac) ac.close(); } catch { /* */ } ac = null; },
  };
}

/* =====================================================================
   6. STIJL (unieke prefix ft-)
   ===================================================================== */
const CSS = `
.ft{--ft-gold:#f5b301;--ft-ok:#2fb36d;--ft-no:#e5534b;--ft-soft:rgba(127,127,127,.12);--ft-warm:#ff8a3d;display:block;color:var(--ink);-webkit-user-select:none;user-select:none;padding-bottom:4.4rem;position:relative}
.ft *{box-sizing:border-box}
.ft button{touch-action:manipulation}
.ft small,.ft .ft-mut{color:var(--mute)}
.ft-load{padding:3rem 1rem;text-align:center;font-size:1.1rem}
.ft-hud{position:sticky;top:58px;z-index:6;display:flex;align-items:center;gap:.4rem;padding:.4rem .5rem;margin:.4rem 0;background:var(--card);border:1px solid var(--line);border-radius:14px;font-size:.85rem}
.ft-coins{font-weight:800;font-size:1.05rem;display:flex;align-items:center;gap:.25rem;min-width:5.5rem}
.ft-coins span{display:inline-block;transition:transform .15s}
.ft-coins.pop span{transform:scale(1.18)}
.ft-star{display:flex;flex-direction:column;flex:1;min-width:0;gap:2px}
.ft-star b{font-size:.85rem;white-space:nowrap}
.ft-xp{display:block;height:6px;background:var(--line);border-radius:9px;overflow:hidden}
.ft-xp i{display:block;height:100%;background:linear-gradient(90deg,var(--ft-gold),#ffd966);border-radius:9px;transition:width .3s}
.ft-rt{font-weight:700;white-space:nowrap}
.ft-hud button{padding:.3rem .5rem;border-radius:10px;font-size:1rem;line-height:1}
.ft-pane{display:block}.ft-pane[hidden]{display:none}
.ft-cv{position:relative;width:100%;aspect-ratio:360/260;border-radius:16px;overflow:hidden;border:1px solid var(--line);background:#9cc7ee;touch-action:manipulation}
.ft-cv canvas{display:block;width:100%;height:100%}
.ft-trv{position:absolute;inset:auto 0 8px 0;text-align:center;font-weight:700;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.5);pointer-events:none}
.ft-ev{margin:.5rem 0}
.ft-evb{display:flex;align-items:center;gap:.5rem;padding:.5rem .6rem;border-radius:14px;background:linear-gradient(135deg,rgba(255,138,61,.18),rgba(245,179,1,.18));border:1px solid rgba(245,179,1,.5);font-size:.85rem}
.ft-evb .ft-eve{font-size:1.6rem}.ft-evb>div{flex:1;min-width:0}
.ft-evb .ft-bar{margin-top:.25rem}
.ft-bar{display:block;height:7px;border-radius:9px;background:var(--line);overflow:hidden}
.ft-bar i{display:block;height:100%;border-radius:9px;background:var(--accent);transition:width .25s}
.ft-bar.g i{background:var(--ft-ok)}.ft-bar.y i{background:var(--ft-gold)}.ft-bar.r i{background:var(--ft-no)}
.ft-tix{display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:.35rem;margin:.5rem 0}
.ft-tk{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;padding:.3rem .15rem .4rem;min-height:68px;border-radius:12px;border:2px solid var(--line);background:var(--card);overflow:hidden;font-size:.62rem;line-height:1.1;--p:0%}
.ft-tk .ft-tke{font-size:1.5rem;line-height:1}
.ft-tk .ft-tkt{font-weight:700;color:var(--mute);height:.8rem;white-space:nowrap}
.ft-tk .ft-tkb{display:block;position:absolute;left:0;right:0;bottom:0;height:5px;background:var(--line)}
.ft-tk .ft-tkb b{display:block;height:100%;background:var(--ft-ok);width:100%;transition:width .2s linear}
.ft-tk.e{opacity:.4;border-style:dashed}
.ft-tk.e .ft-tke{filter:grayscale(1);opacity:.5}
.ft-tk.w{border-color:#5aa9e6}
.ft-tk.n{border-color:var(--ft-no)}.ft-tk.n .ft-tkt{color:var(--ft-no)}
.ft-tk.c{border-color:var(--ft-warm);background:linear-gradient(to top,rgba(255,138,61,.3) var(--p),var(--card) var(--p))}
.ft-tk.f{border-color:var(--ft-gold);animation:ftpulse .5s infinite alternate}.ft-tk.f .ft-tkt{color:#b88300}
.ft-tk.r{border-color:var(--ft-ok);background:rgba(47,179,109,.16);animation:ftpulse .7s infinite alternate}.ft-tk.r .ft-tkt{color:var(--ft-ok)}
.ft-tk.hit{animation:fthit .25s}
.ft-tk.warn .ft-tkb b{background:var(--ft-gold)}.ft-tk.bad .ft-tkb b{background:var(--ft-no)}
.ft-tk.vip{box-shadow:0 0 0 2px var(--ft-gold) inset}
@keyframes ftpulse{from{transform:scale(1)}to{transform:scale(1.06)}}
@keyframes fthit{0%{transform:scale(.9)}60%{transform:scale(1.08)}100%{transform:scale(1)}}
.ft-sbar{display:flex;gap:.4rem;flex-wrap:wrap;align-items:center;font-size:.8rem;margin:.3rem 0}
.ft-sbar>span{background:var(--ft-soft);border-radius:99px;padding:.2rem .6rem;white-space:nowrap}
.ft-card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:.7rem .8rem;margin:.55rem 0}
.ft-card h3{margin:.1rem 0 .4rem;font-size:1rem}
.ft-card p{margin:.3rem 0;font-size:.85rem}
.ft-coach{display:flex;gap:.6rem;align-items:flex-start;margin:.55rem 0;padding:.65rem .75rem;border-radius:16px;background:linear-gradient(135deg,rgba(99,102,241,.16),rgba(255,138,61,.16));border:1px solid var(--accent);font-size:.88rem}
.ft-coach>b{font-size:1.6rem;line-height:1}.ft-coach>div{flex:1}
.ft-coach button{font-size:.72rem;padding:.2rem .5rem;margin-top:.3rem}
.ft-ms{margin:.5rem 0}
.ft-mi{display:flex;align-items:center;gap:.5rem;padding:.45rem .6rem;border-radius:12px;background:var(--ft-soft);margin:.3rem 0;font-size:.82rem}
.ft-mi>div{flex:1;min-width:0}.ft-mi .ft-bar{margin-top:.25rem}
.ft-mi.rdy{background:rgba(47,179,109,.18);border:1px solid var(--ft-ok)}
.ft-nav{position:fixed;left:0;right:0;bottom:0;z-index:20;max-width:430px;margin:0 auto;display:grid;grid-template-columns:repeat(7,1fr);gap:2px;padding:.3rem .3rem calc(.3rem + env(safe-area-inset-bottom,0px));background:var(--card);border-top:1px solid var(--line);box-shadow:0 -4px 14px rgba(0,0,0,.08)}
.ft-nav button{position:relative;display:flex;flex-direction:column;align-items:center;gap:1px;border:0;background:none;padding:.25rem 0;border-radius:10px;font-size:.58rem;color:var(--mute);line-height:1.1}
.ft-nav button span{font-size:1.25rem;line-height:1.1}
.ft-nav button.on{background:var(--ft-soft);color:var(--ink);font-weight:700}
.ft-nav button.pul{animation:ftpulse .6s infinite alternate;background:rgba(245,179,1,.3)}
.ft-nav button i{position:absolute;top:1px;right:6px;min-width:15px;height:15px;border-radius:99px;background:var(--ft-no);color:#fff;font-size:.6rem;font-style:normal;line-height:15px;text-align:center;padding:0 3px}
.ft-sub{display:flex;gap:.3rem;overflow-x:auto;margin:.2rem 0 .4rem;padding-bottom:.2rem}
.ft-sub button{white-space:nowrap;font-size:.8rem;padding:.35rem .7rem;border-radius:99px}
.ft-sub button.on{background:var(--accent);border-color:var(--accent);color:#fff}
.ft-b{border-radius:10px;padding:.4rem .6rem;font-size:.8rem;font-weight:700;white-space:nowrap;background:var(--accent);border-color:var(--accent);color:#fff}
.ft-b.no{opacity:.45;background:var(--card);color:var(--ink);border-color:var(--line)}
.ft-b.alt{background:var(--card);color:var(--ink);border-color:var(--line)}
.ft-b.on{background:var(--ft-ok);border-color:var(--ft-ok);color:#fff}
.ft-b.gold{background:var(--ft-gold);border-color:var(--ft-gold);color:#3a2a00}
.ft-b:disabled{opacity:.4}
.ft-chip{display:inline-flex;align-items:center;gap:.25rem;padding:.2rem .55rem;border-radius:99px;background:var(--ft-soft);font-size:.78rem;margin:.1rem}
.ft-chip.on{background:rgba(47,179,109,.2);border:1px solid var(--ft-ok)}
.ft-chip.lack{background:rgba(229,83,75,.16)}
.ft-dish{display:flex;gap:.6rem;align-items:center;padding:.55rem .6rem;border-radius:14px;border:1px solid var(--line);background:var(--card);margin:.4rem 0}
.ft-dish.lock{opacity:.8}
.ft-dish .ft-de{font-size:2rem;width:2.4rem;text-align:center;flex:none}
.ft-dish.lock .ft-de{filter:grayscale(.8)}
.ft-di{flex:1;min-width:0;font-size:.82rem;line-height:1.35}
.ft-di b{font-size:.9rem}
.ft-da{display:flex;flex-direction:column;gap:.3rem;align-items:stretch;flex:none}
.ft-row{display:flex;gap:.5rem;align-items:center;margin:.35rem 0;flex-wrap:wrap}
.ft-row>div{flex:1;min-width:0}
.ft-ing{display:flex;gap:.55rem;align-items:center;padding:.5rem .6rem;border-radius:14px;border:1px solid var(--line);background:var(--card);margin:.35rem 0}
.ft-ing .ft-ie{font-size:1.8rem;width:2.2rem;text-align:center}
.ft-ing .ft-ii{flex:1;min-width:0;font-size:.8rem}
.ft-ing .ft-bar{margin:.25rem 0}
.ft-ing .ft-ib{display:flex;gap:.25rem}
.ft-ing .ft-ib button{padding:.3rem .45rem;font-size:.75rem}
.ft-up{color:var(--ft-ok);font-weight:700}.ft-dn{color:var(--ft-no);font-weight:700}
.ft-cheap{border-color:var(--ft-ok);box-shadow:0 0 0 1px var(--ft-ok) inset}
.ft-sw{display:inline-block;width:2rem;height:2rem;border-radius:50%;border:3px solid transparent;padding:0;margin:.15rem}
.ft-sw.on{border-color:var(--ink)}
.ft-slots{display:flex;gap:.35rem;flex-wrap:wrap;margin:.3rem 0}
.ft-slot{width:3.6rem;height:3.6rem;border-radius:14px;border:2px dashed var(--line);display:flex;align-items:center;justify-content:center;font-size:1.7rem;background:none;padding:0;position:relative}
.ft-slot.has{border-style:solid;border-color:var(--ft-ok);background:rgba(47,179,109,.1)}
.ft-slot.sel{border-color:var(--accent)}
.ft-slot small{position:absolute;bottom:1px;font-size:.5rem}
.ft-dec{display:flex;flex-direction:column;align-items:center;gap:2px;width:calc(25% - .3rem);min-width:72px;padding:.4rem .15rem;border-radius:12px;border:1px solid var(--line);background:var(--card);font-size:.65rem;text-align:center}
.ft-dec>span{font-size:1.6rem}
.ft-dec.own{border-color:var(--ft-ok)}.ft-dec.pl{background:rgba(47,179,109,.18)}
.ft-decs{display:flex;flex-wrap:wrap;gap:.35rem}
.ft-city{padding:.7rem;border-radius:16px;border:1px solid var(--line);background:var(--card);margin:.5rem 0}
.ft-city.here{border-color:var(--ft-ok);box-shadow:0 0 0 1px var(--ft-ok) inset}
.ft-city.lock{opacity:.8}
.ft-city .ft-ch{display:flex;align-items:center;gap:.5rem}
.ft-city .ft-ce{font-size:2.2rem}
.ft-city .ft-ch>div{flex:1}
.ft-stars{color:var(--ft-gold);letter-spacing:1px;font-size:.85rem}
.ft-ach{display:flex;flex-wrap:wrap;gap:.35rem}
.ft-an{width:calc(33.3% - .3rem);min-width:92px;padding:.4rem .3rem;border-radius:12px;border:1px solid var(--line);text-align:center;font-size:.65rem;background:var(--card)}
.ft-an>span{display:block;font-size:1.5rem}
.ft-an.off{opacity:.45;filter:grayscale(1)}
.ft-rv{padding:.45rem .6rem;border-radius:12px;background:var(--ft-soft);margin:.3rem 0;font-size:.8rem}
.ft-days{display:flex;gap:.25rem;margin:.4rem 0}
.ft-days span{flex:1;text-align:center;padding:.3rem 0;border-radius:10px;background:var(--ft-soft);font-size:.7rem}
.ft-days span.done{background:rgba(47,179,109,.25)}.ft-days span.now{outline:2px solid var(--ft-gold)}
.ft-toasts{position:fixed;left:0;right:0;top:64px;z-index:40;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:.3rem}
.ft-toast{max-width:min(92vw,400px);padding:.45rem .8rem;border-radius:99px;background:rgba(30,32,45,.92);color:#fff;font-size:.82rem;box-shadow:0 4px 14px rgba(0,0,0,.25);animation:fttoast 2.8s forwards}
.ft-toast.good{background:rgba(31,140,86,.95)}.ft-toast.gold{background:rgba(190,130,0,.95)}.ft-toast.bad{background:rgba(190,60,55,.95)}
@keyframes fttoast{0%{opacity:0;transform:translateY(-10px)}8%{opacity:1;transform:none}85%{opacity:1}100%{opacity:0}}
.ft-modal{position:fixed;inset:0;z-index:50;background:rgba(10,12,20,.55);display:flex;align-items:center;justify-content:center;padding:1rem}
.ft-modal[hidden]{display:none}
.ft-mb{width:min(100%,380px);max-height:86vh;overflow:auto;background:var(--card);color:var(--ink);border-radius:20px;padding:1.1rem;box-shadow:0 10px 40px rgba(0,0,0,.4);text-align:center;animation:ftpop .25s}
.ft-mb h3{margin:.2rem 0 .4rem}.ft-mb .ft-big{font-size:3rem;line-height:1.1}
.ft-mb .ft-mrow{display:flex;gap:.5rem;justify-content:center;margin-top:.8rem}
@keyframes ftpop{from{transform:scale(.85);opacity:0}to{transform:none;opacity:1}}
.ft input[type=text]{width:100%}
.ft-switch{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.5rem 0;border-bottom:1px solid var(--line)}
.ft-note{font-size:.75rem;color:var(--mute);margin:.25rem 0}
.ft-hint{background:rgba(245,179,1,.15);border-radius:12px;padding:.4rem .6rem;font-size:.8rem;margin:.4rem 0}
.ft-tcv{width:100%;aspect-ratio:360/190;display:block;border-radius:14px;border:1px solid var(--line)}
@media (prefers-reduced-motion:reduce){.ft *{animation:none!important;transition:none!important}}
`;

/* =====================================================================
   7. TEKENEN (canvas, alles met vormen en emoji; logische maat 360x260)
   ===================================================================== */
export const CW = 360, CH = 260;
const BASE = 172;        // grondlijn van de skyline
const FEET = 232;        // voeten van de klanten
const SKIN = ['#f6d3b3', '#e8b98e', '#c98f63', '#9a6a45', '#6d4630', '#fbe0c8'];
const HAIR = ['#2b2118', '#5a3a22', '#c9892b', '#e1c16e', '#a33b2b', '#8c8c9a'];
const hx = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const x = hx(a), y = hx(b); return toHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); };
export const shade = (h, amt) => (amt < 0 ? mix(h, '#000000', -amt) : mix(h, '#ffffff', amt));
function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
const SKY_KEYS = [[0, '#0b1030', '#1c2a5a'], [5, '#243b6b', '#e08a6a'], [7, '#6aa8e8', '#cfe6f7'], [12, '#4a97e0', '#bfe3ff'], [17, '#5b8fd0', '#f3c27a'], [19, '#3d3a7a', '#e8825a'], [21, '#0f1538', '#2a2f66'], [24, '#0b1030', '#1c2a5a']];
export function skyAt(h) {
  let i = 0; while (i < SKY_KEYS.length - 2 && h >= SKY_KEYS[i + 1][0]) i++;
  const a = SKY_KEYS[i], b = SKY_KEYS[i + 1], t = clamp((h - a[0]) / (b[0] - a[0]), 0, 1);
  const night = h < 5 || h >= 21 ? 1 : h < 7 ? (7 - h) / 2 : h < 19 ? 0 : (h - 19) / 2;
  return { top: mix(a[1], b[1], t), bot: mix(a[2], b[2], t), night };
}
const STARS = Array.from({ length: 36 }, (_, i) => [(i * 97 % 360), (i * 53 % 110) + 4, (i % 3) + 0.6]);
const CLOUDS = [{ x: 30, y: 30, s: 1, v: 5 }, { x: 170, y: 58, s: 0.7, v: 3 }, { x: 290, y: 22, s: 1.2, v: 4 }];

export function drawSky(c, h, t) {
  const sk = skyAt(h);
  const g = c.createLinearGradient(0, 0, 0, BASE); g.addColorStop(0, sk.top); g.addColorStop(1, sk.bot);
  c.fillStyle = g; c.fillRect(0, 0, CW, CH);
  if (sk.night > 0.15) { c.fillStyle = '#fff'; for (const s of STARS) { c.globalAlpha = sk.night * (0.5 + 0.5 * Math.sin(t * 1.5 + s[0])); c.fillRect(s[0], s[1], s[2], s[2]); } c.globalAlpha = 1; }
  const day = h >= 6 && h <= 19;
  const p = day ? (h - 6) / 13 : ((h + 24 - 19) % 24) / 11;
  const x = 30 + (CW - 60) * clamp(p, 0, 1), y = 130 - Math.sin(clamp(p, 0, 1) * Math.PI) * 100;
  const rg = c.createRadialGradient(x, y, 2, x, y, 38); rg.addColorStop(0, day ? 'rgba(255,240,170,.9)' : 'rgba(230,235,255,.6)'); rg.addColorStop(1, 'rgba(255,240,170,0)');
  c.fillStyle = rg; c.fillRect(x - 40, y - 40, 80, 80);
  c.fillStyle = day ? '#ffe27a' : '#eef1ff'; c.beginPath(); c.arc(x, y, day ? 12 : 9, 0, 6.2832); c.fill();
  if (!day) { c.fillStyle = sk.top; c.beginPath(); c.arc(x + 4, y - 2, 8, 0, 6.2832); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,' + (0.85 - sk.night * 0.65) + ')';
  for (const cl of CLOUDS) {
    const cx = ((cl.x + t * cl.v) % (CW + 120)) - 60, s = cl.s;
    c.beginPath(); c.ellipse(cx, cl.y, 24 * s, 8 * s, 0, 0, 6.2832); c.ellipse(cx - 14 * s, cl.y + 3 * s, 14 * s, 6 * s, 0, 0, 6.2832); c.ellipse(cx + 15 * s, cl.y + 2 * s, 16 * s, 7 * s, 0, 0, 6.2832); c.fill();
  }
  return sk;
}

function bld(c, x, w, h, col, night, win = true) {
  c.fillStyle = col; c.fillRect(x, BASE - h, w, h);
  if (win && night > 0.3) { c.fillStyle = 'rgba(255,220,120,' + (0.85 * night) + ')'; for (let yy = BASE - h + 6; yy < BASE - 8; yy += 10) for (let xx = x + 3; xx < x + w - 5; xx += 8) if (((xx * 7 + yy * 13) | 0) % 5 !== 0) c.fillRect(xx, yy, 3, 4); }
}
export function drawSkyline(c, id, pal, night, t) {
  const dark = (col) => mix(col, '#0b1030', night * 0.72);
  const far = dark(mix(pal[2], '#9aa8c8', 0.45)), mid = dark(pal[2]), a = dark(pal[0]), b = dark(pal[1]);
  c.globalAlpha = 1;
  const fill = (cols, hmin, hspan, w0, step) => { let x = -4, i = 0; while (x < CW) { const w = w0 + (i * 7) % 9, h = hmin + (i * 17) % hspan; bld(c, x, w, h, cols[i % cols.length], night); x += w + step; i++; } };
  if (id === 'ams') {
    let x = -4, i = 0;
    while (x < CW) { const w = 22 + (i * 7) % 11, h = 46 + (i * 17) % 30, col = [a, b, mid][i % 3]; bld(c, x, w, h, col, night); c.fillStyle = col; c.beginPath(); c.moveTo(x, BASE - h); c.lineTo(x + w / 2, BASE - h - 12); c.lineTo(x + w, BASE - h); c.fill(); x += w + 2; i++; }
    c.fillStyle = dark('#f3ead8'); c.beginPath(); c.moveTo(294, BASE); c.lineTo(305, BASE - 72); c.lineTo(323, BASE - 72); c.lineTo(334, BASE); c.fill();
    c.fillStyle = dark('#7a4a32'); c.beginPath(); c.moveTo(304, BASE - 72); c.lineTo(314, BASE - 84); c.lineTo(324, BASE - 72); c.fill();
    c.strokeStyle = dark('#efe3c8'); c.lineWidth = 3; for (let k = 0; k < 4; k++) { const an = t * 0.6 + k * 1.5708; c.beginPath(); c.moveTo(314, BASE - 72); c.lineTo(314 + Math.cos(an) * 38, BASE - 72 + Math.sin(an) * 38); c.stroke(); }
  } else if (id === 'rom') {
    fill([far, mid, b], 30, 24, 34, 4);
    c.fillStyle = dark('#e3bd7e'); rr(c, 236, BASE - 66, 122, 66, 8); c.fill();
    c.fillStyle = dark('#7a5a3a');
    for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) { const ax = 242 + k * 19, ay = BASE - 58 + r * 20; c.beginPath(); c.arc(ax + 6, ay + 12, 6, Math.PI, 0); c.rect(ax, ay + 12, 12, 8); c.fill(); }
    c.fillStyle = dark('#d8c9a8'); for (let k = 0; k < 3; k++) c.fillRect(224 + k * 4, BASE - 40, 2, 40);
  } else if (id === 'par') {
    for (let i = 0; i < 9; i++) { const x = i * 42 - 8, h = 40 + (i * 13) % 14; bld(c, x, 40, h, i % 2 ? b : far, night); c.fillStyle = dark('#5a6483'); c.beginPath(); c.moveTo(x - 2, BASE - h); c.lineTo(x + 6, BASE - h - 12); c.lineTo(x + 34, BASE - h - 12); c.lineTo(x + 42, BASE - h); c.fill(); }
    c.strokeStyle = dark('#3d4258'); c.fillStyle = dark('#3d4258'); c.lineWidth = 2;
    c.beginPath(); c.moveTo(268, BASE); c.lineTo(292, BASE - 76); c.lineTo(298, BASE - 128); c.lineTo(304, BASE - 76); c.lineTo(328, BASE); c.lineTo(316, BASE); c.lineTo(298, BASE - 62); c.lineTo(280, BASE); c.closePath(); c.fill();
    c.fillRect(288, BASE - 80, 20, 4); c.lineWidth = 1; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(278 + k * 2, BASE - 10 - k * 11); c.lineTo(318 - k * 2, BASE - 10 - k * 11); c.stroke(); }
  } else if (id === 'mex') {
    fill([a, b, mid, far], 28, 18, 34, 5);
    c.fillStyle = dark('#c88a52'); for (let k = 0; k < 5; k++) c.fillRect(246 + k * 8, BASE - 14 - k * 14, 108 - k * 16, 14);
    c.fillStyle = dark('#7a5432'); c.fillRect(290, BASE - 14, 20, 14); c.fillRect(288, BASE - 88, 24, 14);
    c.fillStyle = dark('#3d8c5a'); for (const cx of [232, 362]) { c.fillRect(cx, BASE - 34, 6, 34); c.fillRect(cx - 8, BASE - 24, 8, 4); c.fillRect(cx - 8, BASE - 30, 4, 10); c.fillRect(cx + 6, BASE - 18, 8, 4); c.fillRect(cx + 10, BASE - 28, 4, 14); }
    const cols = ['#e5534b', '#f5b301', '#2fb36d', '#5aa9e6', '#e87bb5']; for (let k = 0; k < 14; k++) { c.fillStyle = dark(cols[k % 5]); c.beginPath(); c.moveTo(k * 28, 112); c.lineTo(k * 28 + 10, 112); c.lineTo(k * 28 + 5, 120); c.fill(); }
  } else if (id === 'tok') {
    fill([mid, far, b], 30, 40, 22, 3);
    c.fillStyle = dark('#6b7aa8'); c.beginPath(); c.moveTo(226, BASE); c.lineTo(292, BASE - 100); c.lineTo(364, BASE); c.fill();
    c.fillStyle = dark('#f1f4ff'); c.beginPath(); c.moveTo(272, BASE - 70); c.lineTo(292, BASE - 100); c.lineTo(312, BASE - 70); c.lineTo(300, BASE - 62); c.lineTo(292, BASE - 74); c.lineTo(282, BASE - 62); c.fill();
    c.fillStyle = dark('#d9453b'); c.fillRect(326, BASE - 36, 4, 36); c.fillRect(348, BASE - 36, 4, 36); c.fillRect(320, BASE - 40, 38, 5); c.fillRect(324, BASE - 32, 30, 3);
  } else if (id === 'nyc') {
    for (let i = 0; i < 12; i++) { const w = 20 + (i * 5) % 12, h = 36 + (i * 29) % 40, x = i * 31 - 6; bld(c, x, w, h, [far, mid, b][i % 3], night); }
    const tall = [[228, 26, 84], [258, 22, 104], [284, 30, 128], [318, 24, 96], [342, 26, 76]];
    tall.forEach(([x, w, h], i) => { bld(c, x, w, h, [mid, a, far][i % 3], night); c.fillStyle = dark('#5a6070'); c.fillRect(x + w / 2 - 1, BASE - h - 14, 2, 14); });
    c.fillStyle = dark(mix(pal[2], '#a8b0c8', 0.3)); c.fillRect(290, BASE - 134, 18, 8); c.fillRect(296, BASE - 142, 6, 8);
  } else if (id === 'mum') {
    fill([far, b, mid], 30, 30, 34, 4);
    c.fillStyle = dark('#e8d8b8'); c.fillRect(240, BASE - 70, 104, 70); c.fillStyle = dark('#7a5a3a'); c.beginPath(); c.arc(292, BASE, 26, Math.PI, 0); c.fill();
    c.fillStyle = dark('#e8d8b8'); for (const dx of [250, 292, 334]) { c.beginPath(); c.arc(dx, BASE - 70, 12, Math.PI, 0); c.fill(); } c.fillRect(290, BASE - 96, 4, 14);
    c.fillStyle = dark('#3d7c4a'); for (const px of [228, 358]) { c.fillRect(px, BASE - 44, 4, 44); for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(px + 2 + (k - 2) * 7, BASE - 46 + Math.abs(k - 2) * 3, 9, 3, (k - 2) * 0.4, 0, 6.2832); c.fill(); } }
  } else { // ist
    fill([far, a, mid], 26, 22, 34, 4);
    c.fillStyle = dark('#efe3c6'); rr(c, 240, BASE - 46, 112, 46, 3); c.fill(); c.beginPath(); c.arc(296, BASE - 46, 36, Math.PI, 0); c.fill();
    c.beginPath(); c.arc(296, BASE - 86, 7, Math.PI, 0); c.fill(); c.fillRect(295, BASE - 98, 2, 12);
    for (const mx of [228, 354]) { c.fillStyle = dark('#efe3c6'); c.fillRect(mx, BASE - 100, 8, 100); c.beginPath(); c.moveTo(mx - 1, BASE - 100); c.lineTo(mx + 4, BASE - 118); c.lineTo(mx + 9, BASE - 100); c.fill(); c.fillRect(mx - 2, BASE - 74, 12, 3); }
    c.fillStyle = dark('#d9453b'); c.beginPath(); c.arc(296, BASE - 100, 3, 0, 6.2832); c.fill();
  }
}

export function drawGround(c, night) {
  const g = c.createLinearGradient(0, BASE, 0, CH);
  g.addColorStop(0, mix('#d8d0be', '#2a2f40', night * 0.75)); g.addColorStop(0.7, mix('#c7bfae', '#222736', night * 0.75)); g.addColorStop(0.72, mix('#6b6f7a', '#161922', night * 0.7)); g.addColorStop(1, mix('#585c68', '#12151d', night * 0.7));
  c.fillStyle = g; c.fillRect(0, BASE, CW, CH - BASE);
  c.strokeStyle = 'rgba(0,0,0,.07)'; c.lineWidth = 1;
  for (let x = 0; x < CW; x += 36) { c.beginPath(); c.moveTo(x, BASE + 22); c.lineTo(x - 12, 238); c.stroke(); }
  for (let y = BASE + 22; y < 238; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(CW, y); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.45)'; for (let x = 8; x < CW; x += 44) c.fillRect(x, 250, 22, 3);
}

/* ----- de truck ----- */
export function drawTruck(c, S, o) {
  const L = S.look, body = BODY_COL[L.col][1], trim = TRIM_COL[L.trim][1], t = o.t || 0, night = o.night || 0;
  c.save(); c.translate(o.x, o.y); if (o.sc) c.scale(o.sc, o.sc);
  c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(112, 126, 124, 8, 0, 0, 6.2832); c.fill();
  // hang-lichten achter de truck
  // dak-bord
  const nm = (L.name || 'Foodtruck').slice(0, 18);
  c.fillStyle = shade(body, -0.25); rr(c, 38, -28, 112, 24, 6); c.fill();
  c.fillStyle = '#fffaf0'; rr(c, 41, -25, 106, 18, 4); c.fill();
  let fs = 12; c.font = `800 ${fs}px system-ui,sans-serif`; while (fs > 7 && c.measureText(nm).width > 98) { fs--; c.font = `800 ${fs}px system-ui,sans-serif`; }
  c.fillStyle = shade(body, -0.35); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(nm, 94, -16);
  c.fillStyle = shade(body, -0.3); c.fillRect(54, -5, 5, 6); c.fillRect(129, -5, 5, 6);
  const glow = (night > 0.3 ? 1 : 0.6) * (0.7 + 0.3 * Math.sin(t * 4)); c.fillStyle = `rgba(255,224,120,${glow})`; for (let k = 0; k < 8; k++) { c.beginPath(); c.arc(46 + k * 14, -28, 2, 0, 6.2832); c.fill(); }
  // carrosserie
  const bg = c.createLinearGradient(0, 0, 0, 105); bg.addColorStop(0, shade(body, 0.12)); bg.addColorStop(1, shade(body, -0.12));
  c.fillStyle = bg; rr(c, 0, 0, 172, 105, 10); c.fill();
  c.fillStyle = shade(body, -0.2); c.fillRect(0, 88, 172, 17);
  c.fillStyle = trim; c.fillRect(0, 85, 172, 4);
  // zijdecor (muurschildering e.d.)
  const side = S.placed.zij ? DECM[S.placed.zij] : null;
  if (side) { c.font = '26px system-ui,sans-serif'; c.fillText(side.e, 20, 52); } else { c.fillStyle = shade(body, 0.2); rr(c, 8, 34, 24, 36, 6); c.fill(); c.fillStyle = trim; c.font = '700 8px system-ui,sans-serif'; c.fillText('★' + (o.stars || 0), 20, 52); }
  // raam
  c.fillStyle = shade(body, -0.3); rr(c, 38, 28, 118, 52, 6); c.fill();
  const wg = c.createLinearGradient(0, 32, 0, 76); wg.addColorStop(0, night > 0.3 ? '#ffd68a' : '#5a3a28'); wg.addColorStop(1, night > 0.3 ? '#e29a45' : '#2e2018');
  c.fillStyle = wg; rr(c, 42, 32, 110, 44, 4); c.fill();
  // kok
  const cook = o.cooking || 0, sw = Math.sin(t * (cook ? 9 : 1.5)) * (cook ? 4 : 1);
  c.fillStyle = '#f4f4f4'; rr(c, 82, 55, 28, 22, 6); c.fill();
  c.fillStyle = '#f6d3b3'; c.beginPath(); c.arc(96, 49, 8, 0, 6.2832); c.fill();
  c.fillStyle = '#fff'; c.fillRect(88, 36, 16, 6); c.beginPath(); c.arc(90, 37, 5, 0, 6.2832); c.arc(96, 34, 6, 0, 6.2832); c.arc(102, 37, 5, 0, 6.2832); c.fill();
  c.fillStyle = '#2b2118'; c.fillRect(93, 48, 2, 2); c.fillRect(98, 48, 2, 2); c.fillStyle = '#c0506a'; c.fillRect(94, 53, 4, 1);
  c.strokeStyle = '#f4f4f4'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(86, 62); c.lineTo(72 + sw, 68 + (cook ? Math.cos(t * 9) * 2 : 0)); c.stroke();
  c.beginPath(); c.moveTo(106, 62); c.lineTo(120 - sw, 68); c.stroke();
  // pannen en vlammen
  for (let k = 0; k < 3; k++) {
    const px = 50 + k * 34; c.fillStyle = '#3a3d48'; rr(c, px, 68, 24, 5, 2); c.fill();
    if (k < (o.burners || 1)) { c.fillStyle = k < cook ? '#ff8a3d' : '#8a8f9c'; if (k < cook) { c.beginPath(); c.moveTo(px + 6, 76); c.quadraticCurveTo(px + 12, 66 - Math.sin(t * 12 + k) * 3, px + 18, 76); c.fill(); } }
  }
  // balie
  c.fillStyle = trim; rr(c, 34, 76, 126, 7, 3); c.fill(); c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(34, 82, 126, 2);
  // luifel
  const awn = AWN[L.awn][1], ax = 30, aw = 134;
  c.fillStyle = trim; c.fillRect(ax, 18, aw, 14);
  const n = 12, sw2 = aw / n;
  for (let k = 0; k < n; k++) {
    const col = awn === 'stripes' ? (k % 2 ? '#ffffff' : trim) : awn === 'zig' ? (k % 2 ? shade(trim, 0.35) : trim) : awn === 'dots' ? trim : trim;
    c.fillStyle = col; c.fillRect(ax + k * sw2, 18, sw2 + 0.5, 14); c.beginPath(); c.arc(ax + k * sw2 + sw2 / 2, 32, sw2 / 2, 0, Math.PI); c.fill();
    if (awn === 'dots') { c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(ax + k * sw2 + sw2 / 2, 25, 2, 0, 6.2832); c.fill(); }
  }
  c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(ax, 16, aw, 3);
  // cabine
  const cg = c.createLinearGradient(0, 30, 0, 105); cg.addColorStop(0, shade(body, 0.05)); cg.addColorStop(1, shade(body, -0.18));
  c.fillStyle = cg; c.beginPath(); c.moveTo(172, 105); c.lineTo(172, 30); c.lineTo(205, 30); c.quadraticCurveTo(222, 32, 232, 62); c.lineTo(246, 66); c.quadraticCurveTo(252, 70, 252, 80); c.lineTo(252, 105); c.closePath(); c.fill();
  c.fillStyle = night > 0.3 ? '#3a4a70' : '#bfe3ff'; c.beginPath(); c.moveTo(178, 38); c.lineTo(203, 38); c.quadraticCurveTo(216, 40, 224, 62); c.lineTo(178, 62); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(186, 40); c.lineTo(194, 40); c.lineTo(184, 60); c.lineTo(180, 60); c.closePath(); c.fill();
  c.fillStyle = shade(body, -0.3); c.fillRect(190, 66, 14, 3);
  c.fillStyle = night > 0.3 ? '#fff6b0' : '#ffe27a'; rr(c, 246, 76, 8, 8, 3); c.fill();
  if (night > 0.3) { const lg = c.createRadialGradient(256, 80, 2, 256, 80, 26); lg.addColorStop(0, 'rgba(255,240,170,.5)'); lg.addColorStop(1, 'rgba(255,240,170,0)'); c.fillStyle = lg; c.fillRect(230, 54, 56, 52); }
  c.fillStyle = '#4a4f5c'; c.fillRect(0, 100, 252, 5);
  // wielen
  for (const wx of [46, 208]) {
    c.fillStyle = '#23252e'; c.beginPath(); c.arc(wx, 106, 16, 0, 6.2832); c.fill(); c.fillStyle = '#cfd3dc'; c.beginPath(); c.arc(wx, 106, 8, 0, 6.2832); c.fill();
    c.strokeStyle = '#8a8f9c'; c.lineWidth = 2; const rot = o.wheel || 0; for (let k = 0; k < 4; k++) { const an = rot + k * 1.5708; c.beginPath(); c.moveTo(wx, 106); c.lineTo(wx + Math.cos(an) * 7, 106 + Math.sin(an) * 7); c.stroke(); }
  }
  // dakversiering
  const roof = S.placed.dak ? DECM[S.placed.dak] : null;
  if (roof) { c.font = '24px system-ui,sans-serif'; c.fillText(roof.e, 14, -10); c.fillText(roof.e, 160, -10 + Math.sin(t * 2) * 1.5); }
  c.restore();
}

/* ----- klanten ----- */
export function drawCust(c, x, y, look, o) {
  const t = o.t || 0, bob = o.walk ? Math.abs(Math.sin(t * 12 + x)) * 3 : Math.sin(t * 2 + x) * 0.6;
  const sk = SKIN[look.sk % 6], hr = HAIR[look.hr % 6], shirt = `hsl(${look.sh},58%,${o.vip ? 55 : 62}%)`;
  c.save(); c.translate(x, y - bob - (o.hop || 0));
  c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0, bob + (o.hop || 0), 11, 3.5, 0, 0, 6.2832); c.fill();
  const ls = o.walk ? Math.sin(t * 12 + x) * 3 : 0;
  c.fillStyle = '#3d4258'; c.fillRect(-6 + ls, -9, 5, 9); c.fillRect(1 - ls, -9, 5, 9);
  c.fillStyle = shirt; rr(c, -8, -26, 16, 19, 6); c.fill();
  c.fillStyle = sk; c.beginPath(); c.arc(0, -33, 8.5, 0, 6.2832); c.fill();
  c.fillStyle = hr; c.beginPath(); c.arc(0, -35, 8.8, Math.PI * 1.05, Math.PI * 1.95); c.fill();
  if (look.hr % 3 === 0) c.fillRect(-9, -36, 3, 10);
  if (look.hat === 1 && !o.vip) { c.fillStyle = `hsl(${look.sh},50%,45%)`; c.beginPath(); c.arc(0, -37, 9, Math.PI, 0); c.fill(); c.fillRect(0, -38, 12, 2); }
  else if (look.hat === 2 && !o.vip) { c.fillStyle = `hsl(${(look.sh + 120) % 360},60%,60%)`; c.beginPath(); c.arc(0, -38, 8.5, Math.PI, 0); c.fill(); c.beginPath(); c.arc(0, -46, 2.5, 0, 6.2832); c.fill(); }
  else if (look.hat === 3 && !o.vip) { c.fillStyle = hr; c.beginPath(); c.arc(0, -43, 4, 0, 6.2832); c.fill(); }
  if (o.vip) { c.fillStyle = '#f5b301'; c.beginPath(); c.moveTo(-8, -40); c.lineTo(-8, -48); c.lineTo(-4, -43); c.lineTo(0, -50); c.lineTo(4, -43); c.lineTo(8, -48); c.lineTo(8, -40); c.closePath(); c.fill(); }
  c.fillStyle = '#2b2118'; c.fillRect(-4, -34, 2, 2.4); c.fillRect(2, -34, 2, 2.4);
  const m = o.mood; // 0..1
  c.strokeStyle = '#7a3a3a'; c.lineWidth = 1.2; c.beginPath();
  if (o.happy) { c.arc(0, -31, 3.4, 0.1, Math.PI - 0.1); } else if (m > 0.5) { c.arc(0, -31, 2.6, 0.2, Math.PI - 0.2); } else if (m > 0.22) { c.moveTo(-2.5, -29.5); c.lineTo(2.5, -29.5); } else { c.arc(0, -28, 2.6, Math.PI + 0.2, -0.2); }
  c.stroke();
  if (m < 0.22 && !o.happy) { c.fillStyle = '#6ec6ff'; c.beginPath(); c.arc(9, -37, 1.6, 0, 6.2832); c.fill(); }
  c.restore();
}
export function drawBubble(c, x, y, cu, d, now, showFlip) {
  const w = 32, h = 28, bx = x - w / 2, by = y;
  const bounce = cu.st === 'ready' ? Math.abs(Math.sin(now * 7)) * 3 : 0;
  c.save(); c.translate(0, -bounce);
  c.fillStyle = cu.st === 'ready' ? '#e6ffee' : cu.st === 'cook' ? '#fff2e0' : '#ffffff'; c.strokeStyle = cu.st === 'ready' ? '#2fb36d' : cu.need ? '#e5534b' : 'rgba(0,0,0,.25)'; c.lineWidth = cu.st === 'ready' || cu.need ? 2 : 1;
  rr(c, bx, by, w, h, 9); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(x - 4, by + h - 0.5); c.lineTo(x, by + h + 5); c.lineTo(x + 4, by + h - 0.5); c.fillStyle = c.fillStyle; c.fill();
  c.font = '17px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  if (cu.st === 'cook') {
    const p = clamp(cu.cook / cu.dur, 0, 1); c.globalAlpha = 0.35; c.fillText(d.e, x, by + h / 2 + 1); c.globalAlpha = 1;
    c.save(); c.beginPath(); c.rect(bx, by + h * (1 - p), w, h * p); c.clip(); c.fillText(d.e, x, by + h / 2 + 1); c.restore();
    if (cu.flip === 1) { c.strokeStyle = '#f5b301'; c.lineWidth = 3; c.beginPath(); c.arc(x, by + h / 2, 15 + Math.sin(now * 14) * 2, 0, 6.2832); c.stroke(); c.fillStyle = '#b88300'; c.font = '800 14px system-ui,sans-serif'; c.fillText('↻', x, by + h / 2 + 1); }
  } else c.fillText(d.e, x, by + h / 2 + 1);
  if (cu.st === 'ready') { c.fillStyle = '#2fb36d'; c.beginPath(); c.arc(bx + w - 2, by + 2, 7, 0, 6.2832); c.fill(); c.fillStyle = '#fff'; c.font = '800 10px system-ui,sans-serif'; c.fillText('✓', bx + w - 2, by + 3); }
  if (cu.need && cu.st === 'wait') { c.font = '11px system-ui,sans-serif'; c.fillText('🛒', bx + w - 2, by + 2); }
  const pf = clamp(cu.pat / cu.patMax, 0, 1);
  c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(bx + 2, by + h + 7, w - 4, 3); c.fillStyle = pf > 0.55 ? '#2fb36d' : pf > 0.25 ? '#f5b301' : '#e5534b'; c.fillRect(bx + 2, by + h + 7, (w - 4) * pf, 3);
  c.restore();
}

/* ----- deeltjes ----- */
export class Fx {
  constructor() { this.p = []; this.on = true; }
  add(o) { if (this.on && this.p.length < 140) this.p.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 1, max: 1, txt: '', col: '#fff', size: 14, kind: 'txt', rot: 0, vr: 0 }, o)); }
  text(x, y, txt, col = '#fff', size = 14, life = 1.1) { this.add({ x, y, vy: -34, life, max: life, txt, col, size, kind: 'txt' }); }
  burst(x, y, list, n = 6, spread = 60) { for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, s = spread * (0.5 + Math.random() * 0.7); this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 120, life: 0.9 + Math.random() * 0.5, max: 1.3, txt: list[i % list.length], size: 12 + Math.random() * 6, kind: 'txt' }); } }
  steam(x, y) { this.add({ x: x + (Math.random() - 0.5) * 10, y, vx: (Math.random() - 0.5) * 8, vy: -16 - Math.random() * 10, life: 1.4, max: 1.4, kind: 'puff', size: 4 + Math.random() * 3 }); }
  confetti(n = 30) { const cols = ['#f5b301', '#e5534b', '#2fb36d', '#5aa9e6', '#e87bb5', '#8a7be0']; for (let i = 0; i < n; i++) this.add({ x: Math.random() * CW, y: -10 - Math.random() * 40, vx: (Math.random() - 0.5) * 40, vy: 40 + Math.random() * 60, g: 20, life: 2.4, max: 2.4, kind: 'conf', col: cols[i % 6], size: 4 + Math.random() * 3, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10 }); }
  update(dt) { for (let i = this.p.length - 1; i >= 0; i--) { const q = this.p[i]; q.life -= dt; if (q.life <= 0) { this.p.splice(i, 1); continue; } q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt; } }
  draw(c) {
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const q of this.p) {
      const a = clamp(q.life / q.max * 1.6, 0, 1);
      c.globalAlpha = a;
      if (q.kind === 'txt') { c.font = `800 ${q.size}px system-ui,sans-serif`; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.45)'; if (q.col !== '#fff' && q.txt.length < 14 && !/\p{Extended_Pictographic}/u.test(q.txt)) c.strokeText(q.txt, q.x, q.y); c.fillStyle = q.col; c.fillText(q.txt, q.x, q.y); }
      else if (q.kind === 'puff') { c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(q.x, q.y, q.size * (1.4 - a * 0.4), 0, 6.2832); c.fill(); }
      else { c.save(); c.translate(q.x, q.y); c.rotate(q.rot); c.fillStyle = q.col; c.fillRect(-q.size / 2, -q.size / 4, q.size, q.size / 2); c.restore(); }
    }
    c.globalAlpha = 1;
  }
}

// lichtsnoer / lampionnen / wimpels in de lucht
export function drawSkyDecor(c, id, t, night) {
  if (!id) return;
  if (id === 'lic') { c.strokeStyle = 'rgba(40,40,40,.6)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 96); c.quadraticCurveTo(CW / 2, 128, CW, 96); c.stroke(); for (let k = 0; k <= 12; k++) { const u = k / 12, x = u * CW, y = (1 - u) * (1 - u) * 96 + 2 * u * (1 - u) * 128 + u * u * 96; c.fillStyle = `rgba(255,224,120,${0.6 + 0.4 * Math.sin(t * 3 + k)})`; c.beginPath(); c.arc(x, y + 3, 3.2, 0, 6.2832); c.fill(); } }
  else if (id === 'lam') { c.font = '20px system-ui,sans-serif'; c.textAlign = 'center'; for (let k = 0; k < 6; k++) c.fillText('🏮', 30 + k * 60, 112 + Math.sin(t * 1.6 + k) * 3); }
  else if (id === 'wim') { const cols = ['#e5534b', '#f5b301', '#2fb36d', '#5aa9e6', '#e87bb5']; c.strokeStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.moveTo(0, 90); c.quadraticCurveTo(CW / 2, 118, CW, 90); c.stroke(); for (let k = 0; k < 16; k++) { const u = (k + 0.5) / 16, x = u * CW, y = (1 - u) * (1 - u) * 90 + 2 * u * (1 - u) * 118 + u * u * 90; c.fillStyle = cols[k % 5]; c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x + 6, y); c.lineTo(x, y + 12 + Math.sin(t * 3 + k) * 1.5); c.closePath(); c.fill(); } }
  else if (id === 'dro') { c.font = '24px system-ui,sans-serif'; c.textAlign = 'center'; c.fillText('🛸', 80 + Math.sin(t * 0.8) * 50, 70 + Math.sin(t * 1.7) * 6); }
  else if (id === 'reg') { c.font = '60px system-ui,sans-serif'; c.textAlign = 'center'; c.globalAlpha = 0.85; c.fillText('🌈', 300, 90); c.globalAlpha = 1; }
}
export const GROUND_X = { g0: 22, g1: 322, g2: 345 };
export function drawGroundDecor(c, S, t) {
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  const spots = [['g0', 22, 214, 26], ['g1', 322, 206, 26], ['g2', 296, 214, 22]];
  for (const [k, x, y, sz] of spots) { const it = S.placed[k] ? DECM[S.placed[k]] : null; if (!it) continue; c.font = `${sz}px system-ui,sans-serif`; const wob = it.id === 'dra' ? Math.sin(t * 2) * 2 : 0; c.fillText(it.e, x, y + wob); }
}

/* =====================================================================
   8. DE VIEW
   ===================================================================== */
const withTimeout = (p, ms) => new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('timeout')), ms); p.then((v) => { clearTimeout(t); res(v); }, (e) => { clearTimeout(t); rej(e); }); });
const MSG = { coins: 'Nog niet genoeg 🪙', stars: 'Je hebt meer ⭐ nodig', max: 'Dit is al maximaal!', have: 'Heb je al', full: 'De koelkast is vol', slots: 'Geen plek op je menu: haal eerst een gerecht weg', last: 'Houd minstens één gerecht op je menu', badges: 'Te weinig 🥄 Gouden Lepels', burn: 'Alle kookpitten zijn bezig 🔥', stock: 'Geen ingrediënten: koop ze op de markt 🛒', here: 'Je staat hier al' };
const NAV = [['svc', '🚚', 'Serveer'], ['menu', '📖', 'Menu'], ['mkt', '🛒', 'Markt'], ['team', '👥', 'Team'], ['city', '🌍', 'Steden'], ['tru', '🔧', 'Truck'], ['more', '⭐', 'Meer']];
const stars5 = (r) => { const n = Math.round(r); return '★'.repeat(n) + '☆'.repeat(5 - n); };
const fxText = (it) => [it.arr ? `+${Math.round(it.arr * 100)}% klanten` : '', it.pat ? `+${Math.round(it.pat * 100)}% wachttijd` : '', it.tip ? `+${Math.round(it.tip * 100)}% fooi` : ''].filter(Boolean).join(', ');
const hourNow = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };

export async function foodtruckView(ctx) {
  const { db, me, esc, view, addCleanup } = ctx;
  const UID = ctx.uid || (me && me.uid) || 'anon';
  const lsKey = `big:foodtruck:${UID}`, docId = `big-foodtruck__${UID}`;
  let alive = true, raf = 0, destroyed = false;
  const timers = new Set(), offs = [];
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms); timers.add(t); return t; };
  const every = (fn, ms) => { const t = setInterval(() => { if (alive) fn(); }, ms); timers.add(t); return t; };
  const on = (target, ev, fn, opt) => { target.addEventListener(ev, fn, opt); offs.push(() => target.removeEventListener(ev, fn, opt)); };
  let S = null, g = null;
  let cloudAt = 0, cloudStatus = '', cloudBusy = false, cloudDirty = false, fsP = Promise.resolve(null);
  const audio = makeAudio();

  if (typeof document !== 'undefined' && !document.getElementById('ft-css')) { const st = document.createElement('style'); st.id = 'ft-css'; st.textContent = CSS; document.head.appendChild(st); }
  view.innerHTML = '<div class="ft"><div class="ft-load">🚚 Foodtruck Imperium wordt gestart…</div></div>';

  function saveLocal() { if (!S) return; S.ts = Date.now(); try { localStorage.setItem(lsKey, serialize(S)); } catch { /* geen opslag beschikbaar */ } cloudDirty = true; }
  async function cloudSave(force) {
    if (!db || !S || cloudBusy) return;
    const now = Date.now(); if (!force && (now - cloudAt < 60000 || !cloudDirty)) return;
    cloudBusy = true; cloudAt = now;
    try {
      const fs = await fsP; if (!fs) throw new Error('geen firestore');
      const data = serialize(S); if (data.length > MAX_DATA) throw new Error('te groot');
      await fs.setDoc(fs.doc(db, 'gamesaves', docId), { game: 'big-foodtruck', uid: UID, data, updated: Date.now() });
      cloudStatus = `ok:${Date.now()}`; cloudDirty = false;
    } catch { cloudStatus = 'fail'; }
    cloudBusy = false;
  }
  function destroy() {
    if (destroyed) return; destroyed = true;
    if (S) { saveLocal(); cloudSave(true); }
    alive = false; if (raf && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(raf);
    for (const t of timers) { clearTimeout(t); clearInterval(t); } timers.clear();
    for (const f of offs) { try { f(); } catch { /* */ } } offs.length = 0;
    audio.close();
  }
  addCleanup(destroy);

  /* ---------- laden: nieuwste van lokaal en cloud ---------- */
  fsP = db ? import(FS_URL).catch(() => null) : Promise.resolve(null);
  let local = null;
  try { const raw = localStorage.getItem(lsKey); if (raw) local = parseSave(raw); } catch { /* geen opslag */ }
  let cloud = null;
  if (db) {
    try {
      cloud = await withTimeout((async () => {
        const fs = await fsP; if (!fs) return null;
        const snap = await fs.getDoc(fs.doc(db, 'gamesaves', docId)); if (!snap.exists()) return null;
        const d = snap.data(); const p = d && typeof d.data === 'string' ? parseSave(d.data) : null;
        return p ? { S: p, upd: num(d.updated, p.ts) } : null;
      })(), 2800);
    } catch { cloud = null; }
  }
  if (!alive) return;
  let first = false;
  if (cloud && (!local || cloud.upd > local.ts)) S = cloud.S; else S = local;
  if (!S) { S = newState(); first = true; }
  let away = null;
  { const gap = (Date.now() - S.ts) / 1000; if (!first && gap > 90) { const s0 = starsOf(S.fame), gain = offlineGain(S, gap); if (gain.coins >= 1) away = Object.assign({ gap, stars: starsOf(S.fame) - s0 }, gain); } }
  g = new Game(S, { events: true });
  if (S.menu.length === 0) S.menu = ['bro'];
  audio.set(S.set.snd, S.set.mus);

  /* ---------- opbouw ---------- */
  let tab = 'svc', sub = { more: 'ms', tru: '', menu: 'all' }, tixCap = 0, tkEls = [], tkCache = [], modalOpen = false;
  const mq = [];
  view.innerHTML = `<div class="ft" id="ft">
    <div class="ft-hud"><div class="ft-coins"><b>🪙</b><span id="ft-c">0</span></div>
      <div class="ft-star"><b id="ft-s">⭐ 0</b><i class="ft-xp"><i id="ft-xp" style="width:0"></i></i></div>
      <div class="ft-rt" id="ft-r" title="Beoordeling">★ 3,5</div>
      <button data-a="snd" id="ft-snd" aria-label="Geluid aan of uit">🔊</button></div>
    <section class="ft-pane" data-p="svc">
      <div class="ft-cv"><canvas width="720" height="520" aria-label="Je foodtruck"></canvas><div class="ft-trv" hidden></div></div>
      <div class="ft-ev"></div>
      <div class="ft-tix"></div>
      <div class="ft-sbar"></div>
      <div class="ft-coach" hidden></div>
      <div class="ft-ms"></div>
    </section>
    <section class="ft-pane" data-p="oth" hidden></section>
    <nav class="ft-nav" aria-label="Schermen">${NAV.map((n) => `<button data-a="tab" data-v="${n[0]}"><span>${n[1]}</span>${n[2]}</button>`).join('')}</nav>
    <div class="ft-toasts" aria-live="polite"></div><div class="ft-modal" hidden></div></div>`;
  const q = (s) => view.querySelector(s);
  const cv = q('.ft-cv canvas'), c2 = cv.getContext ? cv.getContext('2d') : null;
  const paneS = q('[data-p="svc"]'), paneO = q('[data-p="oth"]'), tixEl = q('.ft-tix'), evEl = q('.ft-ev'), sbarEl = q('.ft-sbar'), coachEl = q('.ft-coach'), msEl = q('.ft-ms');
  const toasts = q('.ft-toasts'), mdl = q('.ft-modal'), trvEl = q('.ft-trv');
  const hudC = q('#ft-c'), hudS = q('#ft-s'), hudXp = q('#ft-xp'), hudR = q('#ft-r'), hudSnd = q('#ft-snd'), hudCoins = q('.ft-coins');
  const navBtns = [...view.querySelectorAll('.ft-nav button')];

  function toast(msg, kind = '') {
    const d = document.createElement('div'); d.className = `ft-toast ${kind}`; d.textContent = msg; toasts.appendChild(d);
    while (toasts.children.length > 3) toasts.removeChild(toasts.children[0]);
    later(() => { if (d.remove) d.remove(); }, 2900);
  }
  function modal(html) {
    if (modalOpen) { mq.push(html); return; }
    modalOpen = true; mdl.innerHTML = `<div class="ft-mb" role="dialog" aria-modal="true">${html}</div>`; mdl.hidden = false;
    const b = mdl.querySelector('button'); if (b && b.focus) { try { b.focus(); } catch { /* */ } }
  }
  function closeModal() { mdl.hidden = true; mdl.innerHTML = ''; modalOpen = false; if (mq.length) modal(mq.shift()); }
  const res = (r, snd = 'buy') => { if (r === 'ok') { audio.play(snd); return true; } toast(MSG[r] || 'Dat lukt nu niet', 'bad'); audio.play('err'); return false; };

  /* ---------- tekenscene ---------- */
  const sc = { t: 0, vis: new Map(), ghosts: [], fx: new Fx(), wheel: 0, city: CITY[S.city], chef: 0, steamT: 0, dpr: 1, cw: 0 };
  const slotX = (i, cap) => { cap = cap || tixCap || 3; return cap <= 1 ? CW / 2 : 30 + i * ((CW - 60) / (cap - 1)); };
  function resizeCanvas() {
    if (!c2) return; const w = cv.clientWidth || 360; if (w === sc.cw) return; sc.cw = w;
    sc.dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    cv.width = Math.round(w * sc.dpr); cv.height = Math.round(w * CH / CW * sc.dpr);
  }
  function sceneUpdate(dt) {
    sc.t += dt; sc.fx.update(dt);
    const cap = tixCap, seen = new Set();
    for (let i = 0; i < g.slots.length; i++) {
      const cu = g.slots[i]; if (!cu) continue; seen.add(cu.id);
      let v = sc.vis.get(cu.id); const tx = slotX(i, cap);
      if (!v) { v = { x: i % 2 ? CW + 24 : -24, tx, walk: true, hop: 0, look: cu.look, vip: cu.vip }; sc.vis.set(cu.id, v); }
      v.tx = tx; const dx = tx - v.x, st = 120 * dt; v.walk = Math.abs(dx) > 1.5; v.x += Math.abs(dx) <= st ? dx : Math.sign(dx) * st;
      v.hop = cu.st === 'ready' ? Math.abs(Math.sin(sc.t * 6 + i)) * 2 : 0;
    }
    for (const k of [...sc.vis.keys()]) if (!seen.has(k)) sc.vis.delete(k);
    for (let i = sc.ghosts.length - 1; i >= 0; i--) { const gh = sc.ghosts[i]; gh.t += dt; gh.x += gh.dir * (gh.happy ? 40 : 70) * dt; if (gh.t > 1.8) sc.ghosts.splice(i, 1); }
    const burning = g.burning(); sc.chef = Math.max(0, sc.chef - dt);
    if (burning > 0) { sc.steamT -= dt; if (sc.steamT <= 0) { sc.steamT = 0.18; sc.fx.steam(60 + Math.random() * 70, 112); } }
    if (g.travelT > 0) sc.wheel += dt * 9;
    const p = g.travelT > 0 ? 1 - g.travelT / 2.5 : 1; if (p >= 0.5 || g.travelT <= 0) sc.city = CITY[S.city];
  }
  function drawScene() {
    if (!c2) return; resizeCanvas();
    const k = cv.width / CW; c2.setTransform(k, 0, 0, k, 0, 0);
    const h = hourNow(), sk = drawSky(c2, h, sc.t);
    drawSkyline(c2, sc.city.id, sc.city.pal, sk.night, sc.t);
    drawSkyDecor(c2, S.placed.lucht, sc.t, sk.night);
    drawGround(c2, sk.night);
    const p = g.travelT > 0 ? 1 - g.travelT / 2.5 : 1; let off = 0;
    if (g.travelT > 0) off = p < 0.5 ? p * 2 * 420 : -420 + (p - 0.5) * 2 * 420;
    drawTruck(c2, S, { x: 12 + off, y: 86, sc: 0.84, t: sc.t, night: sk.night, cooking: Math.min(3, g.burning()) || (sc.chef > 0 ? 1 : 0), burners: g.D.burners, stars: g.D.stars, wheel: sc.wheel });
    drawGroundDecor(c2, S, sc.t);
    const list = [];
    for (let i = 0; i < g.slots.length; i++) { const cu = g.slots[i]; if (cu) { const v = sc.vis.get(cu.id); if (v) list.push([cu, v, i]); } }
    for (const [cu, v] of list) {
      const mood = clamp(cu.pat / cu.patMax, 0, 1);
      drawCust(c2, v.x, FEET, cu.look, { t: sc.t, walk: v.walk, mood, vip: cu.vip, hop: v.hop });
    }
    for (const gh of sc.ghosts) { c2.globalAlpha = clamp(1.8 - gh.t, 0, 1); drawCust(c2, gh.x, FEET, gh.look, { t: sc.t, walk: true, mood: gh.happy ? 1 : 0, happy: gh.happy, vip: gh.vip, hop: gh.happy ? Math.abs(Math.sin(gh.t * 9)) * 6 : 0 }); if (gh.happy) { c2.font = '14px system-ui,sans-serif'; c2.textAlign = 'center'; c2.fillText('💛', gh.x, FEET - 58 - gh.t * 14); } c2.globalAlpha = 1; }
    for (const [cu, v] of list) { if (v.walk && cu.st === 'wait' && Math.abs(v.tx - v.x) > 20) continue; drawBubble(c2, v.x, FEET - 78, cu, DISH[cu.dish], sc.t); }
    sc.fx.draw(c2);
    if (g.combo >= 2) { c2.textAlign = 'left'; c2.textBaseline = 'alphabetic'; c2.font = '800 13px system-ui,sans-serif'; c2.fillStyle = 'rgba(0,0,0,.45)'; rrect(c2, 6, 6, 92, 22, 11); c2.fillStyle = '#ffb347'; c2.fillText(`🔥 Combo ×${g.combo}`, 12, 22); c2.fillStyle = 'rgba(255,255,255,.35)'; c2.fillRect(12, 25, 80 * clamp(g.comboT / 10, 0, 1), 2); }
  }
  const rrect = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); c.fill(); };
  let miniCv = null;
  function drawMini() {
    const el = q('#ft-mini'); if (!el || !el.getContext) return;
    if (el !== miniCv) { miniCv = el; const w = el.clientWidth || 360; el.width = Math.round(w * 2); el.height = Math.round(w * 190 / 360 * 2); }
    const m = el.getContext('2d'), k = el.width / CW; m.setTransform(k, 0, 0, k, 0, -46 * k);
    const sk = drawSky(m, hourNow(), sc.t); drawSkyline(m, CITY[S.city].id, CITY[S.city].pal, sk.night, sc.t); drawSkyDecor(m, S.placed.lucht, sc.t, sk.night); drawGround(m, sk.night);
    drawTruck(m, S, { x: 12, y: 86, sc: 0.84, t: sc.t, night: sk.night, cooking: 0, burners: g.D.burners, stars: g.D.stars }); drawGroundDecor(m, S, sc.t);
  }

  /* ---------- tikken op klanten ---------- */
  function tapSlot(i) {
    const cu = g.slots[i]; audio.start();
    if (!cu) { audio.play('tap'); return; }
    const el = tkEls[i]; if (el) { el.el.classList.remove('hit'); void el.el.offsetWidth; el.el.classList.add('hit'); }
    if (cu.st === 'wait' && cu.need) {
      const r = g.quickBuyFor(i);
      if (r === 'ok') { const r2 = g.startCook(i, false); if (r2 !== 'ok') res(r2); } else res(r === 'full' ? 'full' : 'coins');
      handleOut(); return;
    }
    const r = g.tapSlot(i);
    if (r === 'burn' || r === 'stock') { res(r); } else if (r === 'busy') audio.play('tap');
    handleOut(); uiUpdate(true);
  }
  function bestTap() { // spatiebalk: meest dringende handeling
    let best = -1, bs = -1;
    g.slots.forEach((cu, i) => { if (!cu) return; const s = cu.st === 'ready' ? 3 : cu.flip === 1 ? 4 : cu.st === 'wait' && !cu.need ? 2 : 0; const sc2 = s * 100 - cu.pat; if (s > 0 && sc2 > bs) { bs = sc2; best = i; } });
    if (best >= 0) tapSlot(best);
  }
  function canvasTap(e) {
    const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * CW, y = (e.clientY - r.top) / r.height * CH;
    let bi = -1, bd = 1e9;
    g.slots.forEach((cu, i) => { if (!cu) return; const v = sc.vis.get(cu.id); if (!v) return; const d = Math.abs(v.x - x) + Math.abs(FEET - 40 - y) * 0.3; if (Math.abs(v.x - x) < 24 && y > 120 && d < bd) { bd = d; bi = i; } });
    if (bi >= 0) tapSlot(bi);
  }

  /* ---------- gebeurtenissen uit het spel ---------- */
  function ghostFor(e, happy) {
    const v = sc.vis.get(e.cid);
    if (tab !== 'svc' || sc.ghosts.length > 30) { sc.vis.delete(e.cid); return; }
    sc.ghosts.push({ x: v ? v.x : slotX(e.slot), look: (v && v.look) || { sk: 0, hr: 0, sh: 200, hat: 0 }, dir: Math.random() < 0.5 ? -1 : 1, happy, t: 0, vip: !!(v && v.vip) });
    sc.vis.delete(e.cid);
  }
  function handleOut() {
    if (!g.out.length) return; const out = g.out; g.out = [];
    for (const e of out) {
      const x = e.slot != null ? slotX(e.slot) : CW / 2;
      switch (e.type) {
        case 'arrive': { audio.play('pop'); const cu = g.slots[e.slot]; const v = cu && sc.vis.get(cu.id); if (cu && !v) sc.vis.set(cu.id, { x: e.slot % 2 ? CW + 24 : -24, tx: x, walk: true, hop: 0, look: cu.look, vip: cu.vip }); else if (v) { v.look = cu.look; v.vip = cu.vip; } break; }
        case 'cook': audio.play('cook'); sc.chef = 1.2; break;
        case 'ready': audio.play('ready'); break;
        case 'flipopen': audio.play('flipopen'); break;
        case 'flip': audio.play('flip'); sc.fx.text(x, FEET - 84, '↻ Hop!', '#ffd45a', 13); break;
        case 'serve': {
          sc.fx.text(x, FEET - 74, `+${fmt(e.pay)}`, '#ffe27a', 15); sc.fx.burst(x, FEET - 56, ['🪙'], 3, 44);
          if (e.combo >= 3) sc.fx.text(x, FEET - 94, `Combo ×${e.combo}`, '#ff9a4d', 12);
          if (e.perfect) { sc.fx.text(x, FEET - 110, '✨ Super!', '#8affc1', 14); sc.fx.burst(x, FEET - 60, ['✨', '⭐'], 6); audio.play('perfect'); } else if (e.quick) { sc.fx.text(x, FEET - 110, 'Snel!', '#9ad0ff', 12); audio.play('serve', { combo: e.combo }); } else audio.play('serve', { combo: e.combo });
          if (e.vip) { sc.fx.confetti(24); audio.play('coin'); }
          ghostFor(e, true); break;
        }
        case 'angry': sc.fx.text(x, FEET - 76, '💢', '#fff', 22); audio.play('angry'); ghostFor(e, false); break;
        case 'buy': audio.play('buy'); break;
        case 'star': onStar(e); break;
        case 'ach': { const a = ACH.find((z) => z.id === e.id); toast(`🏆 ${a ? a.n : 'Prestatie'}  +${fmt(e.coins)} 🪙`, 'gold'); audio.play('ach'); break; }
        case 'missionReady': toast('🎯 Een missie is klaar! Pak je beloning', 'good'); audio.play('ach'); break;
        case 'mission': toast(`🎯 Missie voltooid! +${fmt(e.coins)} 🪙`, 'good'); sc.fx.confetti(18); audio.play('star'); break;
        case 'invite': { const ev = EVM[e.id]; toast(`${ev.e} ${ev.n}! Tik op de banner om mee te doen`, 'gold'); audio.play('event'); break; }
        case 'inviteGone': break;
        case 'evStart': { const ev = EVM[e.id]; toast(`${ev.e} ${ev.n} begint!`, 'gold'); audio.play('event'); sc.fx.confetti(20); break; }
        case 'evEnd': { const ev = EVM[e.id]; if (e.coins) { toast(`${ev.e} ${ev.n} gehaald! +${fmt(e.coins)} 🪙`, 'good'); sc.fx.confetti(40); audio.play('star'); } else toast(`${ev.e} ${ev.n} is voorbij`, ''); break; }
        case 'travel': audio.play('travel'); toast(`🚚 Onderweg naar ${CITY[e.id].n}…`); break;
        case 'franchise': sc.fx.confetti(60); audio.play('star'); tixCap = 0; break;
        case 'unlock': case 'up': case 'hire': case 'upgrade': case 'city': case 'branch': case 'decor': audio.play('up'); break;
        default: break;
      }
    }
  }
  function onStar(e) {
    audio.play('star'); sc.fx.confetti(50);
    const nd = DISHES.filter((d) => d.st === e.n), nc = CITIES.filter((c) => c.st === e.n);
    const lines = [];
    if (nd.length) lines.push(`Nieuwe gerechten: ${nd.map((d) => `${d.e} ${esc(d.n)}`).join(', ')}`);
    if (nc.length) lines.push(`Nieuwe stad: ${nc.map((c) => `${c.e} ${esc(c.n)}`).join(', ')}`);
    lines.push('Meer klanten en hogere prijzen!');
    if (e.n === 10 && canPrestige(S)) lines.push('Je kunt nu een franchise openen (⭐ Meer).');
    modal(`<div class="ft-big">⭐</div><h3>Nieuwe ster! Je hebt er nu ${e.n}</h3><p>${lines.join('<br>')}</p><div class="ft-mrow"><button class="ft-b" data-a="mclose">Lekker!</button></div>`);
    refresh();
  }

  /* ---------- UI-updates ---------- */
  let shown = S.coins, lastCoinsTxt = '', uiAt = 0, lastEv = '', lastSb = '', lastCoach = '-', lastMs = '';
  function buildTix() {
    const cap = g.D.cap; tixCap = cap; tkCache = [];
    tixEl.innerHTML = Array.from({ length: cap }, (_, i) => `<button class="ft-tk e" data-a="slot" data-i="${i}" aria-label="Bestelling ${i + 1}"><span class="ft-tke">·</span><span class="ft-tkt"></span><i class="ft-tkb"><b></b></i></button>`).join('');
    tkEls = [...tixEl.querySelectorAll('.ft-tk')].map((el) => ({ el, e: el.querySelector('.ft-tke'), t: el.querySelector('.ft-tkt'), b: el.querySelector('.ft-tkb b') }));
  }
  function updTix() {
    if (g.D.cap !== tixCap || tkEls.length !== tixCap) buildTix();
    for (let i = 0; i < tixCap; i++) {
      const cu = g.slots[i], t = tkEls[i]; let cls = 'ft-tk e', em = '·', tx = '', pw = 0, p = 0;
      if (cu) {
        const d = DISH[cu.dish]; em = d.e; pw = clamp(cu.pat / cu.patMax, 0, 1) * 100;
        if (cu.st === 'wait') { cls = cu.need ? 'ft-tk n' : 'ft-tk w'; tx = cu.need ? '🛒 Koop' : 'Tik: kook'; }
        else if (cu.st === 'cook') { if (cu.flip === 1) { cls = 'ft-tk f'; tx = '↻ Draai!'; } else { cls = 'ft-tk c'; tx = 'Kookt…'; } p = Math.round(clamp(cu.cook / cu.dur, 0, 1) * 100); }
        else { cls = 'ft-tk r'; tx = '✓ Serveer'; }
        if (cu.vip) cls += ' vip'; cls += pw < 25 ? ' bad' : pw < 55 ? ' warn' : '';
      }
      const key = `${cls}|${em}|${tx}|${Math.round(pw / 4)}|${Math.round(p / 5)}`;
      if (tkCache[i] !== key) { tkCache[i] = key; t.el.className = cls; t.e.textContent = em; t.t.textContent = tx; t.b.style.width = `${pw}%`; t.el.style.setProperty('--p', `${p}%`); }
    }
  }
  function evHtml() {
    if (g.ev) {
      const e = EVM[g.ev.id], left = Math.ceil(g.ev.left);
      return `<div class="ft-evb"><span class="ft-eve">${e.e}</span><div><b>${esc(e.n)}</b> · nog ${left} s<br><small>${esc(e.goal ? `${e.goalT}: ${g.ev.prog}/${e.goal}` : e.d)}</small><span class="ft-bar y"><i style="width:${Math.round(100 * g.ev.left / g.ev.dur)}%"></i></span></div></div>`;
    }
    if (g.invite) {
      const e = EVM[g.invite.id];
      return `<div class="ft-evb"><span class="ft-eve">${e.e}</span><div><b>${esc(e.n)}</b><br><small>${esc(e.d)}${e.goal ? ` Doel: ${esc(e.goalT)}.` : ''}</small></div><button class="ft-b gold" data-a="evgo">Meedoen</button><button class="ft-b alt" data-a="evno" aria-label="Niet meedoen">✕</button></div>`;
    }
    return '';
  }
  function sbarHtml() {
    const D = g.D, r = rateNow;
    return `<span>🔥 ${g.burning()}/${D.burners} pitten</span><span>👥 ${g.waiting()}/${D.cap}</span>${g.combo >= 2 ? `<span>⚡ ×${(1 + 0.05 * Math.min(g.combo, 20)).toFixed(2).replace('.', ',')}</span>` : ''}${S.life.served > 15 ? `<span>≈ ${fmt(r.coins)} 🪙/s</span>` : ''}<span>📍 ${CITY[S.city].e} ${esc(CITY[S.city].n)}</span>`;
  }
  let rateNow = rates(S, 'active'), lastCoinsVal = S.coins;
  const TUT = [
    ['Welkom bij je eigen foodtruck! 👋 Er staat al een klant. Tik hieronder op de bestelling om het broodje te maken.', () => S.life.cooked >= 1, ''],
    ['Het broodje bakt! Tik er nog eens op zodra het klaar is (✓) om te serveren.', () => S.life.served >= 1, ''],
    ['Lekker, je eerste muntjes! 🪙 Serveer snel achter elkaar voor een combo. Spaar voor je eerste verbetering.', () => S.coins >= upCost('pan', 0) || metric(S, 'upsum') >= 1, ''],
    ['Ga naar 🔧 Truck en koop "Betere pannen", dan kook je sneller.', () => metric(S, 'upsum') >= 1, 'tru'],
    ['Open nu 📖 Menu en ontgrendel een nieuw gerecht, zoals de Tosti. Het komt meteen op je menu.', () => Object.keys(S.rec).length >= 2, 'menu'],
    ['Tip: tijdens het koken verschijnt ↻, tik dan snel voor een supergerecht! Huur in 👥 Team een kok in: die werkt ook als jij weg bent.', () => (S.staff.kok | 0) >= 1, 'team'],
  ];
  let tutNote = 0;
  function tutCheck() {
    while (S.tut < TUT.length && TUT[S.tut][1]()) { S.tut++; tutNote = 0; g.dirty = true; if (S.tut >= TUT.length) { S.tut = 99; toast('🎉 Je bent een echte chef! Veel plezier met je imperium', 'good'); } }
    if (S.tut >= TUT.length && S.tut !== 99) S.tut = 99;
  }
  function coachHtml() { return S.tut < TUT.length ? TUT[S.tut][0] : ''; }
  function msHtml() {
    const act = activeMissions(S); if (!act.length) return '';
    const i = act[0], m = MISSIONS[i], v = metric(S, m[1]), ok = v >= m[2];
    return `<div class="ft-mi ${ok ? 'rdy' : ''}"><span style="font-size:1.3rem">🎯</span><div><b>${esc(m[0])}</b><br><small>${fmt(Math.min(v, m[2]))} / ${fmt(m[2])} · beloning ${fmt(missionReward(S, i))} 🪙</small><span class="ft-bar ${ok ? 'g' : ''}"><i style="width:${Math.round(100 * clamp(v / m[2], 0, 1))}%"></i></span></div>${ok ? `<button class="ft-b on" data-a="mclaim" data-i="${i}">Pak!</button>` : ''}</div>`;
  }
  function uiUpdate(force) {
    const now = performance.now();
    if (!force && now - uiAt < 110) return; uiAt = now;
    shown += (S.coins - shown) * 0.35; if (Math.abs(S.coins - shown) < 0.5) shown = S.coins;
    const ct = fmt(shown); if (ct !== lastCoinsTxt) { lastCoinsTxt = ct; hudC.textContent = ct; }
    if (S.coins > lastCoinsVal + 0.5) { hudCoins.classList.add('pop'); later(() => hudCoins.classList.remove('pop'), 160); } lastCoinsVal = S.coins;
    const st = g.D.stars, a = st ? fameNeed(st) : 0, b = fameNeed(st + 1), pr = st >= MAXSTAR ? 100 : clamp((S.fame - a) / (b - a), 0, 1) * 100;
    hudS.textContent = `⭐ ${st}`; hudXp.style.width = `${pr}%`;
    hudR.textContent = `★ ${(S.cities[S.city] ? S.cities[S.city].r : 3.5).toFixed(1).replace('.', ',')}`;
    const sn = S.set.snd ? '🔊' : '🔇'; if (hudSnd.textContent !== sn) hudSnd.textContent = sn;
    if (tab !== 'svc') return;
    updTix();
    const eh = evHtml(); if (eh !== lastEv) { lastEv = eh; evEl.innerHTML = eh; }
    const sb = sbarHtml(); if (sb !== lastSb) { lastSb = sb; sbarEl.innerHTML = sb; }
    const ch = coachHtml(); if (ch !== lastCoach) { lastCoach = ch; if (ch) { coachEl.hidden = false; coachEl.innerHTML = `<b>👩‍🍳</b><div>${esc(ch)}<br><button data-a="tutskip">Uitleg overslaan</button></div>`; } else { coachEl.hidden = true; coachEl.innerHTML = ''; } }
    trvEl.hidden = g.travelT <= 0; if (g.travelT > 0) trvEl.textContent = `🚚 Onderweg naar ${CITY[S.city].n}…`;
  }
  function second() {
    tutCheck(); rateNow = rates(S, 'active');
    const mh = msHtml(); if (mh !== lastMs) { lastMs = mh; msEl.innerHTML = mh; }
    // wenk voor de navigatie
    const want = S.tut < TUT.length ? TUT[S.tut][2] : '';
    let badge = 0; for (const i of activeMissions(S)) if (metric(S, MISSIONS[i][1]) >= MISSIONS[i][2]) badge++; if (dailyState(S).can) badge++;
    navBtns.forEach((bn, i) => { const id = NAV[i][0]; bn.classList.toggle('on', id === tab); bn.classList.toggle('pul', !!want && id === want && tab !== id); let bi = bn.querySelector('i'); const n = id === 'more' ? badge : 0; if (n && !bi) { bi = document.createElement('i'); bn.appendChild(bi); } if (bi) { if (n) bi.textContent = String(n); else if (bi.remove) bi.remove(); } });
    liveUpdate();
    if (g.dirty) { g.dirty = false; }
  }
  function liveUpdate() {
    if (tab === 'svc') return;
    for (const el of paneO.querySelectorAll('[data-cost]')) el.classList.toggle('no', S.coins < Number(el.dataset.cost));
    if (tab === 'menu') for (const el of paneO.querySelectorAll('[data-ig]')) el.classList.toggle('lack', g.stockOf(el.dataset.ig) < Number(el.dataset.q));
    if (tab === 'mkt') {
      for (const id of ING_IDS) {
        const p = g.price(id), tr = g.trend(id), f = mktFactor(id, g.wall()), has = g.stockOf(id);
        const pe = paneO.querySelector(`[data-pr="${id}"]`); if (pe) { pe.textContent = fmt(p); const row = pe.closest('.ft-ing'); if (row) row.classList.toggle('ft-cheap', f < 0.85); }
        const te = paneO.querySelector(`[data-tr="${id}"]`); if (te) { te.textContent = f < 0.85 ? '🟢 goedkoop' : f > 1.2 ? '🔴 duur' : tr > 0.02 ? '▲ stijgt' : tr < -0.02 ? '▼ daalt' : '● stabiel'; te.className = f < 0.85 ? 'ft-up' : f > 1.2 ? 'ft-dn' : ''; }
        const se = paneO.querySelector(`[data-st="${id}"]`); if (se) se.textContent = `${has}/${g.D.fridge}`;
        const be = paneO.querySelector(`[data-sb="${id}"]`); if (be) be.style.width = `${Math.round(100 * has / g.D.fridge)}%`;
      }
    }
  }

  /* ---------- schermen ---------- */
  const costBtn = (label, cost, attrs, cls = '') => `<button class="ft-b ${cls} ${S.coins >= cost ? '' : 'no'}" data-cost="${cost}" ${attrs}>${label} 🪙 ${fmt(cost)}</button>`;
  const tutHint = () => (S.tut < TUT.length ? `<div class="ft-hint">👩‍🍳 ${esc(TUT[S.tut][0])}</div>` : '');
  const ingChips = (d) => (d.ing.length ? d.ing.map(([id, n]) => `<span class="ft-chip ${g.stockOf(id) >= n ? '' : 'lack'}" data-ig="${id}" data-q="${n}">${ING[id].e}${n > 1 ? `×${n}` : ''}</span>`).join('') : '<span class="ft-chip">geen ingrediënten nodig</span>');

  function htmlMenu() {
    const D = g.D, f = sub.menu;
    const chips = S.menu.map((id) => `<button class="ft-chip on" data-a="mtog" data-id="${id}" title="Van het menu halen">${DISH[id].e} ${esc(DISH[id].n)} ✕</button>`).join('');
    const empty = Array.from({ length: Math.max(0, D.menuSlots - S.menu.length) }, () => '<span class="ft-chip">＋ vrij</span>').join('');
    const list = DISHES.filter((d) => (f === 'all' ? true : f === 'own' ? !!S.rec[d.id] : !S.rec[d.id] && D.stars >= d.st));
    const cards = list.map((d) => {
      const lv = S.rec[d.id] || 0, liked = D.city.likes.includes(d.tag), pr = fmt(dishPrice(d, lv || 1) * D.priceMul * (liked ? 1.35 : 1));
      const info = `<b>${esc(d.n)}</b> ${TAGS[d.tag][0]}${liked ? ' 💛' : ''}<br><small>🪙 ${pr} per bord · ⏱ ${d.cook} s</small><br>${ingChips(d)}`;
      if (lv) {
        const on = S.menu.includes(d.id);
        return `<div class="ft-dish"><div class="ft-de">${d.e}</div><div class="ft-di">${info}<br><small>Niveau ${lv}/${MAX_DISH_LV}</small><span class="ft-bar g"><i style="width:${lv * 10}%"></i></span></div><div class="ft-da">${lv < MAX_DISH_LV ? costBtn('Verbeter', dishUpCost(d, lv), `data-a="dup" data-id="${d.id}"`) : '<button class="ft-b on" disabled>Meester!</button>'}<button class="ft-b ${on ? 'on' : 'alt'}" data-a="mtog" data-id="${d.id}">${on ? '✓ Op menu' : '+ Menu'}</button></div></div>`;
      }
      const can = D.stars >= d.st;
      return `<div class="ft-dish lock"><div class="ft-de">${d.e}</div><div class="ft-di">${info}</div><div class="ft-da">${can ? costBtn('Ontgrendel', d.unl, `data-a="dunl" data-id="${d.id}"`) : `<button class="ft-b no" disabled>⭐ ${d.st} nodig</button>`}</div></div>`;
    }).join('');
    return `${tutHint()}<div class="ft-card"><h3>📋 Menu van de dag (${S.menu.length}/${D.menuSlots})</h3><p class="ft-mut">Klanten bestellen alleen wat op je menu staat. Gerechten uit de keuken van deze stad (💛) verkopen extra goed. Meer plekken koop je in 🔧 Truck.</p>
      <div>${chips}${empty}</div><div class="ft-row"><button class="ft-b" data-a="amenu">✨ Slim menu</button><small>${Object.keys(S.rec).length}/${DISHES.length} gerechten in je kookboek</small></div></div>
      <div class="ft-sub">${[['all', 'Alle'], ['own', 'Mijn gerechten'], ['buy', 'Te koop']].map(([k, n]) => `<button class="${f === k ? 'on' : ''}" data-a="mf" data-v="${k}">${n}</button>`).join('')}</div>${cards || '<p class="ft-mut">Niets te zien. Haal meer ⭐ om nieuwe gerechten te zien.</p>'}`;
  }
  function htmlMarket() {
    const D = g.D, need = {}; for (const id of S.menu) for (const [k] of DISH[id].ing) (need[k] = need[k] || []).push(DISH[id].e);
    const rows = ING_IDS.map((id) => {
      const gi = ING[id], f = mktFactor(id, g.wall()), has = g.stockOf(id);
      return `<div class="ft-ing ${f < 0.85 ? 'ft-cheap' : ''}"><div class="ft-ie">${gi.e}</div><div class="ft-ii"><b>${gi.n}</b> <small>${need[id] ? `nodig voor ${need[id].join(' ')}` : ''}</small><span class="ft-bar"><i data-sb="${id}" style="width:${Math.round(100 * has / D.fridge)}%"></i></span>
        <small>Voorraad <b data-st="${id}">${has}/${D.fridge}</b> · prijs 🪙 <b data-pr="${id}">${fmt(g.price(id))}</b> <span data-tr="${id}"></span></small></div>
        <div class="ft-ib"><button class="ft-b" data-a="buy" data-id="${id}" data-n="1">+1</button><button class="ft-b" data-a="buy" data-id="${id}" data-n="10">+10</button><button class="ft-b alt" data-a="fill" data-id="${id}">Vul</button></div></div>`;
    }).join('');
    return `${tutHint()}<div class="ft-card"><h3>🛒 Markt</h3><p class="ft-mut">De prijzen schommelen de hele dag. Koop veel als het 🟢 goedkoop is en bewaar het in de koelkast. Hoe beroemder je wordt, hoe duurder de inkoop.</p>
      ${D.autoBuy ? `<div class="ft-switch"><span>🛒 Inkoper koopt automatisch bij</span><button class="ft-b ${S.auto.buy ? 'on' : 'alt'}" data-a="abtog">${S.auto.buy ? 'Aan' : 'Uit'}</button></div>` : '<p class="ft-note">Tip: huur in 👥 Team een Inkoper, dan vult de voorraad vanzelf bij.</p>'}</div>${rows}`;
  }
  function staffEffect(id, lv) {
    const react = (b, k) => Math.max(b === 'k' ? 0.35 : 0.3, (b === 'k' ? 2.2 : 2.4) - k * lv);
    switch (id) {
      case 'kok': return `Koken ${lv * 5}% sneller${lv >= 5 ? ' · draait zelf om' : ''} · begint na ${react('k', 0.12).toFixed(1).replace('.', ',')} s`;
      case 'srv': return `Serveert na ${react('s', 0.15).toFixed(1).replace('.', ',')} s${react('s', 0.15) <= 1.5 ? ' · supersnel' : ''}`;
      case 'kas': return `+${lv * 5}% fooi`;
      case 'ent': return `+${lv * 3}% wachttijd en +${lv * 2}% klanten`;
      default: return `Koopt zelf in · -${(lv * 1.5).toFixed(1).replace('.', ',')}% inkoopprijs`;
    }
  }
  function htmlTeam() {
    const D = g.D, idle = rates(S, 'idle'), hour = idle.coins * 3600 * D.offEff;
    const rows = STAFF_IDS.map((id) => {
      const s = STAFF[id], lv = S.staff[id] | 0;
      return `<div class="ft-card"><div class="ft-row"><span style="font-size:2.2rem">${s.e}</span><div><b>${s.n} ${s.nm}</b> <small>niveau ${lv}/${s.max}</small><br><small>${esc(s.d)}</small><br><small>${lv ? `Nu: ${staffEffect(id, lv)}` : 'Nog niet ingehuurd'}${lv < s.max ? `<br>Volgend niveau: ${staffEffect(id, lv + 1)}` : ''}</small></div></div>
        ${lv < s.max ? costBtn(lv ? 'Verbeter' : 'Huur in', staffCost(id, lv), `data-a="hire" data-id="${id}"`) : '<button class="ft-b on" disabled>Maximaal!</button>'}</div>`;
    }).join('');
    return `${tutHint()}<div class="ft-card"><h3>👥 Je team</h3><p>Personeel werkt ook als jij er niet bent. Met een kok én een serveerder verdien je tot 8 uur lang door.</p>
      <p class="ft-hint">🌙 Terwijl je weg bent: ongeveer <b>${fmt(hour)} 🪙 per uur</b> ${!D.autoCook || !D.autoServe ? '<br>Huur een kok en een serveerder in voor veel meer.' : ''}</p></div>${rows}`;
  }
  function htmlCity() {
    const D = g.D;
    const cities = CITIES.map((c) => {
      const cs = S.cities[c.id], here = S.city === c.id, lk = c.likes.map((t) => `${TAGS[t][0]} ${TAGS[t][1]}`).join(', ');
      const head = `<div class="ft-ch"><span class="ft-ce">${c.e}</span><div><b>${esc(c.n)}</b> ${here ? '<span class="ft-chip on">hier sta je</span>' : ''}<br><small>${esc(c.d)}</small><br><small>Smaak: ${lk} · rijkdom ×${String(c.w).replace('.', ',')}</small>${cs ? `<br><span class="ft-stars">${stars5(cs.r)}</span> <small>${cs.r.toFixed(1).replace('.', ',')}</small>` : ''}</div></div>`;
      if (!cs) {
        const can = D.stars >= c.st;
        return `<div class="ft-city lock">${head}<div class="ft-row">${can ? costBtn('Open deze stad', c.cost, `data-a="cunl" data-id="${c.id}"`) : `<button class="ft-b no" disabled>⭐ ${c.st} nodig</button>`}</div></div>`;
      }
      const lv = cs.b, cost = lv ? branchUpCost(c, lv) : branchBuild(c);
      return `<div class="ft-city ${here ? 'here' : ''}">${head}<div class="ft-row">${here ? '' : `<button class="ft-b" data-a="ctrav" data-id="${c.id}">🚚 Rij hierheen</button>`}
        ${lv < 40 ? costBtn(lv ? `🏢 Filiaal niv. ${lv + 1}` : '🏢 Bouw restaurant', cost, `data-a="cbr" data-id="${c.id}"`) : '<button class="ft-b on" disabled>Filiaal maximaal</button>'}</div>
        <small>${lv ? `Filiaal niveau ${lv} verdient ${fmt(branchYield(c, lv) * (1 + 0.04 * D.stars) * D.badgeMul)} 🪙/s, ook als je weg bent.` : 'Een restaurant verdient geld, ook als je weg bent.'}</small></div>`;
    }).join('');
    const nb = Object.values(S.cities).filter((x) => x.b > 0).length;
    return `${tutHint()}<div class="ft-card"><h3>🌍 Jouw keten</h3><p>Open nieuwe steden voor rijkere klanten en andere smaken. In elke stad bouw je een restaurant dat voor je werkt. <b>${nb}</b> filialen verdienen samen <b>${fmt(D.branch)} 🪙/s</b>.</p></div>${cities}
      <div class="ft-card"><h3>🎪 Evenementen</h3><p>Tijdens het spelen komen er vanzelf uitnodigingen voor festivals en bijzondere gasten. Je deed al <b>${S.life.events}</b> keer mee.</p>${EVENTS.map((e) => `<div class="ft-row"><span style="font-size:1.5rem">${e.e}</span><div><b>${e.n}</b><br><small>${esc(e.d)}</small></div></div>`).join('')}</div>`;
  }
  function htmlTruck() {
    const L = S.look;
    const upg = UPG.map((u) => {
      const lv = S.up[u.id] | 0;
      return `<div class="ft-row"><span style="font-size:1.8rem">${u.e}</span><div><b>${u.n}</b> <small>niveau ${lv}/${u.max}</small><br><small>${esc(u.d)}</small></div>${lv < u.max ? costBtn('Koop', upCost(u.id, lv), `data-a="tup" data-id="${u.id}"`) : '<button class="ft-b on" disabled>Max</button>'}</div>`;
    }).join('');
    const swatch = (arr, key, cur) => arr.map((c, i) => `<button class="ft-sw ${cur === i ? 'on' : ''}" style="background:${c[1]}" data-a="look" data-k="${key}" data-v="${i}" title="${c[0]}" aria-label="${c[0]}"></button>`).join('');
    const dec = Object.keys(SLOTS).map((sl) => `<h3 style="margin:.6rem 0 .3rem;font-size:.9rem">${SLOT_NAME[sl]}</h3><div class="ft-decs">${DECOR.filter((d) => d.slot === sl).map((d) => {
      const own = S.decor.includes(d.id), pl = Object.values(S.placed).includes(d.id);
      return `<button class="ft-dec ${own ? 'own' : ''} ${pl ? 'pl' : ''}" data-a="dec" data-id="${d.id}" ${own ? '' : `data-cost="${d.price}"`}><span>${d.e}</span><b>${d.n}</b><small>${fxText(d)}</small><small>${own ? (pl ? '✓ geplaatst' : 'plaats') : `🪙 ${fmt(d.price)}`}</small></button>`;
    }).join('')}</div>`).join('');
    return `${tutHint()}<div class="ft-card"><canvas id="ft-mini" class="ft-tcv" width="720" height="380"></canvas>
      <div class="ft-row"><input type="text" maxlength="18" value="${esc(L.name)}" data-in="name" aria-label="Naam van je truck" placeholder="Naam van je truck"></div>
      <small>Kleur</small><div>${swatch(BODY_COL, 'col', L.col)}</div><small>Rand en luifel</small><div>${swatch(TRIM_COL, 'trim', L.trim)}</div>
      <small>Luifel</small><div class="ft-sub">${AWN.map((a, i) => `<button class="${L.awn === i ? 'on' : ''}" data-a="look" data-k="awn" data-v="${i}">${a[0]}</button>`).join('')}</div></div>
      <div class="ft-card"><h3>🔧 Verbeteringen</h3>${upg}</div>
      <div class="ft-card"><h3>🎨 Versiering</h3><p class="ft-mut">Koop versiering en tik om te plaatsen of weg te halen. Het geeft bonussen én het ziet er gezellig uit.</p>${dec}</div>`;
  }
  function htmlMore() {
    const tabs = [['ms', '🎯 Missies'], ['ac', '🏆 Prestaties'], ['rv', '💬 Reviews'], ['fr', '🏅 Franchise'], ['op', '⚙️ Opties']];
    const sb = `<div class="ft-sub">${tabs.map(([k, n]) => `<button class="${sub.more === k ? 'on' : ''}" data-a="msub" data-v="${k}">${n}</button>`).join('')}</div>`;
    const k = sub.more; let body = '';
    if (k === 'ms') {
      const ds = dailyState(S), day = ds.can ? ds.day : S.daily.streak;
      const days = Array.from({ length: 7 }, (_, i) => `<span class="${i + 1 <= S.daily.streak && !ds.can ? 'done' : ''} ${ds.can && i + 1 === ds.day ? 'now' : ''}">${i + 1 === 7 ? '🎁' : i + 1 === 3 ? '📦' : '🪙'}<br>dag ${i + 1}</span>`).join('');
      body = `<div class="ft-card"><h3>📅 Dagelijkse beloning</h3><div class="ft-days">${days}</div>${ds.can ? `<button class="ft-b gold" data-a="daily">Pak dag ${day} (${fmt(dailyReward(S, day))} 🪙)</button>` : '<p class="ft-mut">Vandaag al opgehaald. Kom morgen terug voor meer!</p>'}</div>`;
      const act = activeMissions(S);
      body += `<div class="ft-card"><h3>🎯 Missies</h3>${act.length ? act.map((i) => { const m = MISSIONS[i], v = metric(S, m[1]), ok = v >= m[2]; return `<div class="ft-mi ${ok ? 'rdy' : ''}"><div><b>${esc(m[0])}</b><br><small>${fmt(Math.min(v, m[2]))} / ${fmt(m[2])} · beloning ${fmt(missionReward(S, i))} 🪙</small><span class="ft-bar ${ok ? 'g' : ''}"><i style="width:${Math.round(100 * clamp(v / m[2], 0, 1))}%"></i></span></div>${ok ? `<button class="ft-b on" data-a="mclaim" data-i="${i}">Pak!</button>` : ''}</div>`; }).join('') : '<p>Alle missies gehaald, wat een chef! 🎉</p>'}<p class="ft-note">${Object.keys(S.mdone).length}/${MISSIONS.length} missies gehaald</p></div>`;
    } else if (k === 'ac') {
      const n = ACH.filter((a) => S.ach[a.id]).length;
      body = `<div class="ft-card"><h3>🏆 Prestaties (${n}/${ACH.length})</h3><div class="ft-ach">${ACH.map((a) => `<div class="ft-an ${S.ach[a.id] ? '' : 'off'}"><span>${a.e}</span>${esc(a.n)}</div>`).join('')}</div></div>`;
    } else if (k === 'rv') {
      body = `<div class="ft-card"><h3>⭐ Beoordelingen per stad</h3>${Object.keys(S.cities).map((id) => `<div class="ft-row"><span style="font-size:1.4rem">${CITY[id].e}</span><div><b>${CITY[id].n}</b></div><span class="ft-stars">${stars5(S.cities[id].r)}</span><small>${S.cities[id].r.toFixed(1).replace('.', ',')}</small></div>`).join('')}<p class="ft-note">Blije klanten (snel bediend, lekker) verhogen je cijfer, en een hoog cijfer trekt meer klanten.</p></div>
        <div class="ft-card"><h3>💬 Laatste reviews</h3>${g.reviews.length ? g.reviews.map((r) => `<div class="ft-rv"><b>${r.n}</b> <span class="ft-stars">${stars5(r.r)}</span> ${r.e}<br>${esc(r.t)}</div>`).join('') : '<p class="ft-mut">Nog geen reviews. Serveer wat klanten!</p>'}</div>`;
    } else if (k === 'fr') {
      const gain = prestigeGain(S), can = canPrestige(S), av = S.badges - S.spent;
      body = `<div class="ft-card"><h3>🏅 Franchise</h3><p>Open een franchise: je begint opnieuw met één truck, maar je krijgt <b>Gouden Lepels 🥄</b>. Elke lepel maakt alles blijvend winstgevender, en je kunt ze uitgeven aan voordelen. Je prestaties, versiering en truck-uiterlijk blijven.</p>
        <p>Je hebt <b>${S.badges}</b> lepels (${av} te besteden) · inkomstenbonus <b>×${g.D.badgeMul.toFixed(2).replace('.', ',')}</b></p>
        <p class="ft-hint">${can ? `Nu openen geeft <b>+${gain} 🥄</b>.` : D_need()}</p>
        <button class="ft-b ${can ? 'gold' : 'no'}" data-a="${can ? 'prest' : 'noprest'}">🏅 Open franchise${can ? ` (+${gain} 🥄)` : ''}</button></div>
        <div class="ft-card"><h3>🥄 Voordelen</h3>${PERKS.map((p) => { const lv = S.perks[p.id] | 0; return `<div class="ft-row"><span style="font-size:1.6rem">${p.e}</span><div><b>${p.n}</b> <small>stap ${lv}/${p.max}</small><br><small>${esc(p.d)}</small></div>${lv < p.max ? `<button class="ft-b ${av >= perkCost(lv) ? '' : 'no'}" data-a="perk" data-id="${p.id}">${perkCost(lv)} 🥄</button>` : '<button class="ft-b on" disabled>Max</button>'}</div>`; }).join('')}</div>`;
    } else {
      const ok = cloudStatus.startsWith('ok:'), tm = ok ? new Date(Number(cloudStatus.slice(3))) : null;
      body = `<div class="ft-card"><h3>⚙️ Opties</h3>
        <div class="ft-switch"><span>🔊 Geluidjes</span><button class="ft-b ${S.set.snd ? 'on' : 'alt'}" data-a="snd">${S.set.snd ? 'Aan' : 'Uit'}</button></div>
        <div class="ft-switch"><span>🎵 Muziekje</span><button class="ft-b ${S.set.mus ? 'on' : 'alt'}" data-a="mus">${S.set.mus ? 'Aan' : 'Uit'}</button></div>
        <div class="ft-switch"><span>☁️ Opslaan</span><button class="ft-b alt" data-a="save">Nu opslaan</button></div>
        <p class="ft-note">${db ? (ok ? `Laatst in de cloud bewaard om ${String(tm.getHours()).padStart(2, '0')}:${String(tm.getMinutes()).padStart(2, '0')}.` : cloudStatus === 'fail' ? 'Cloud-opslag lukt nu niet. Je voortgang staat wel veilig op dit apparaat.' : 'Je voortgang wordt elke minuut ook in de cloud bewaard.') : 'Je voortgang wordt op dit apparaat bewaard.'}</p>
        <p class="ft-note">Spelen met toetsenbord: 1 t/m 9 kiest een bestelling, spatie doet de meest dringende handeling.</p>
        <div class="ft-switch"><span>🗑️ Opnieuw beginnen</span><button class="ft-b no" data-a="reset1">Wissen…</button></div>
        <p class="ft-note">Gespeeld: ${fmt(S.life.served)} klanten · ${fmt(S.life.earned)} 🪙 verdiend · ${S.life.franch} franchises</p></div>`;
    }
    return tutHint() + sb + body;
  }
  const D_need = () => `Haal minstens ⭐ 10 (je hebt ⭐ ${g.D.stars}) en genoeg verdiensten om je eerste lepel te krijgen.`;
  function tabHtml() {
    switch (tab) { case 'menu': return htmlMenu(); case 'mkt': return htmlMarket(); case 'team': return htmlTeam(); case 'city': return htmlCity(); case 'tru': return htmlTruck(); case 'more': return htmlMore(); default: return ''; }
  }
  const typing = () => { const a = document.activeElement; return !!(a && a.tagName === 'INPUT'); };
  function refresh() {
    if (tab === 'svc') { uiUpdate(true); return; }
    if (typing()) return;
    let y = 0; try { y = window.scrollY; } catch { /* */ }
    paneO.innerHTML = tabHtml(); miniCv = null;
    try { window.scrollTo(0, y); } catch { /* */ }
    liveUpdate();
  }
  function switchTab(t) {
    if (!NAV.some((n) => n[0] === t)) return;
    tab = t; sc.fx.on = t === 'svc'; paneS.hidden = t !== 'svc'; paneO.hidden = t === 'svc';
    if (t === 'svc') { tixCap = 0; lastEv = lastSb = lastMs = ''; lastCoach = '-'; uiUpdate(true); second(); } else { refresh(); }
    navBtns.forEach((bn, i) => bn.classList.toggle('on', NAV[i][0] === t));
    try { window.scrollTo(0, 0); } catch { /* */ }
    audio.play('tap');
  }

  /* ---------- acties ---------- */
  function showAway() {
    if (!away) return; const a = away; away = null;
    modal(`<div class="ft-big">🌙</div><h3>Welkom terug, chef!</h3><p>Je was ${fmtTime(a.gap)} weg${a.gap > MAX_OFFLINE ? ' (we rekenen maximaal 8 uur)' : ''}. Je team en restaurants werkten door:</p><p><b>+${fmt(a.coins)} 🪙</b><br>${fmt(a.served)} klanten geserveerd${a.stars > 0 ? `<br>⭐ +${a.stars} nieuwe ${a.stars === 1 ? 'ster' : 'sterren'}!` : ''}</p><div class="ft-mrow"><button class="ft-b" data-a="mclose">Binnenhalen!</button></div>`);
    audio.play('star');
  }
  function showDaily() {
    const ds = dailyState(S); if (!ds.can) return;
    modal(`<div class="ft-big">🎁</div><h3>Dagelijkse beloning</h3><p>Dag ${ds.day} van 7. Kom elke dag terug voor een grotere beloning!</p><div class="ft-mrow"><button class="ft-b gold" data-a="daily">Pak ${fmt(dailyReward(S, ds.day))} 🪙</button></div>`);
  }
  function act(a, d, el) {
    switch (a) {
      case 'tab': switchTab(d.v); break;
      case 'slot': tapSlot(int(d.i)); break;
      case 'snd': S.set.snd = S.set.snd ? 0 : 1; audio.set(S.set.snd, S.set.mus); audio.start(); audio.play('tap'); refresh(); uiUpdate(true); break;
      case 'mus': S.set.mus = S.set.mus ? 0 : 1; audio.set(S.set.snd, S.set.mus); audio.start(); refresh(); break;
      case 'abtog': S.auto.buy = S.auto.buy ? 0 : 1; refresh(); break;
      case 'mclose': closeModal(); break;
      case 'tutskip': S.tut = 99; lastCoach = '-'; uiUpdate(true); refresh(); break;
      case 'evgo': if (g.startEvent()) { lastEv = ''; uiUpdate(true); } break;
      case 'evno': g.declineEvent(); lastEv = ''; uiUpdate(true); break;
      case 'mclaim': { const r = g.claimMission(int(d.i)); if (typeof r === 'number') { lastMs = ''; second(); refresh(); } break; }
      case 'daily': { const r = g.claimDaily(); if (r) { audio.play('star'); sc.fx.confetti(40); if (modalOpen) closeModal(); modal(`<div class="ft-big">🎁</div><h3>Dag ${r.day} binnen!</h3><p><b>+${fmt(r.coins)} 🪙</b>${r.gift ? `<br>${r.gift}` : ''}</p><div class="ft-mrow"><button class="ft-b" data-a="mclose">Top!</button></div>`); refresh(); } break; }
      case 'mf': sub.menu = d.v; refresh(); break;
      case 'msub': sub.more = d.v; refresh(); break;
      case 'amenu': g.autoMenu(); audio.play('buy'); toast('✨ Slim menu ingesteld voor deze stad', 'good'); refresh(); break;
      case 'mtog': { const r = g.toggleMenu(d.id); if (r === 'ok') audio.play('tap'); else res(r); refresh(); break; }
      case 'dunl': if (res(g.unlockDish(d.id), 'up')) { sc.fx.confetti(14); toast(`${DISH[d.id].e} ${DISH[d.id].n} ontgrendeld!`, 'good'); if (!S.menu.includes(d.id)) toast('Je menu zit vol: wissel gerechten hieronder of koop een Menubord in 🔧 Truck'); } refresh(); break;
      case 'dup': res(g.upDish(d.id), 'up'); refresh(); break;
      case 'buy': res(g.buyIng(d.id, int(d.n)), 'buy'); refresh(); break;
      case 'fill': res(g.fillIng(d.id), 'buy'); refresh(); break;
      case 'hire': if (res(g.upStaff(d.id), 'up')) toast(`${STAFF[d.id].e} ${STAFF[d.id].nm} is nu niveau ${S.staff[d.id]}`, 'good'); refresh(); break;
      case 'tup': res(g.upTruck(d.id), 'up'); refresh(); break;
      case 'cunl': if (res(g.openCity(d.id), 'star')) { toast(`${CITY[d.id].e} ${CITY[d.id].n} is open!`, 'good'); sc.fx.confetti(30); } refresh(); break;
      case 'ctrav': if (res(g.travel(d.id), 'tap')) { switchTab('svc'); if (S.life.served < 1500) toast('Tip: ✨ Slim menu (tab Menu) past je gerechten aan op deze stad'); } break;
      case 'cbr': res(g.branch(d.id), 'up'); refresh(); break;
      case 'look': g.setLook(d.k, d.v); audio.play('tap'); refresh(); break;
      case 'dec': { const own = S.decor.includes(d.id); if (!own) { if (res(g.buyDecor(d.id), 'up')) toast(`${DECM[d.id].e} ${DECM[d.id].n} gekocht en geplaatst`, 'good'); } else { g.placeDecor(d.id); audio.play('tap'); } refresh(); break; }
      case 'perk': res(g.buyPerk(d.id), 'up'); refresh(); break;
      case 'noprest': toast(D_need(), 'bad'); break;
      case 'prest': modal(`<div class="ft-big">🏅</div><h3>Franchise openen?</h3><p>Je krijgt <b>+${prestigeGain(S)} 🥄</b>, maar je begint opnieuw met één truck, zonder geld, steden, personeel en gerechten. Je prestaties, versiering en lepels blijven.</p><div class="ft-mrow"><button class="ft-b alt" data-a="mclose">Nog niet</button><button class="ft-b gold" data-a="prest2">Ja, open!</button></div>`); break;
      case 'prest2': { closeModal(); const r = g.prestige(); if (typeof r === 'number') { sc.city = CITY.ams; sc.vis.clear(); saveLocal(); cloudSave(true); modal(`<div class="ft-big">🏅</div><h3>Je franchise is open!</h3><p>+${r} Gouden Lepels. Geef ze uit in ⭐ Meer › Franchise.</p><div class="ft-mrow"><button class="ft-b" data-a="mclose">Aan de slag!</button></div>`); switchTab('more'); sub.more = 'fr'; refresh(); } break; }
      case 'save': saveLocal(); cloudSave(true).then(() => { if (alive) { toast(cloudStatus === 'fail' ? 'Cloud lukt nu niet, wel lokaal bewaard' : '☁️ Opgeslagen', cloudStatus === 'fail' ? 'bad' : 'good'); refresh(); } }); toast('💾 Bewaard'); break;
      case 'reset1': modal('<div class="ft-big">🗑️</div><h3>Opnieuw beginnen?</h3><p>Je voortgang gaat verloren.</p><div class="ft-mrow"><button class="ft-b alt" data-a="mclose">Nee, terug</button><button class="ft-b no" data-a="reset2">Ja, wissen</button></div>'); break;
      case 'reset2': closeModal(); modal('<div class="ft-big">⚠️</div><h3>Echt zeker?</h3><p>Dit kan niet ongedaan worden gemaakt.</p><div class="ft-mrow"><button class="ft-b alt" data-a="mclose">Nee, terug</button><button class="ft-b no" data-a="reset3">Definitief wissen</button></div>'); break;
      case 'reset3': closeModal(); g.hardReset(); S.set = { snd: S.set.snd, mus: S.set.mus }; sc.city = CITY.ams; sc.vis.clear(); tixCap = 0; saveLocal(); cloudSave(true); switchTab('svc'); toast('🚚 Nieuwe start!', 'good'); break;
      default: break;
    }
  }
  on(view, 'click', (e) => {
    const el = e.target && e.target.closest ? e.target.closest('[data-a]') : null;
    if (!el || !view.contains(el)) return;
    audio.start(); act(el.dataset.a, el.dataset, el);
  });
  on(view, 'input', (e) => { const t = e.target; if (t && t.dataset && t.dataset.in === 'name') { g.setLook('name', t.value); } });
  on(cv, 'pointerdown', (e) => { audio.start(); canvasTap(e); });
  on(window, 'keydown', (e) => {
    if (!alive || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape' && modalOpen) { closeModal(); return; }
    if (tab !== 'svc' || modalOpen) return;
    const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.key >= '1' && e.key <= '9') { tapSlot(int(e.key) - 1); e.preventDefault(); } else if (e.key === ' ' || e.key === 'Enter') { if (t && t.tagName === 'BUTTON') return; bestTap(); e.preventDefault(); }
  });
  on(document, 'visibilitychange', () => { if (document.hidden) saveLocal(); });
  on(window, 'pagehide', () => { saveLocal(); cloudSave(true); });

  /* ---------- hoofdlus ---------- */
  let lastT = Date.now(), frameN = 0, lastDraw = 0;
  function pump() {
    const now = Date.now(); let dt = (now - lastT) / 1000; lastT = now;
    if (!(dt > 0)) return 0;
    if (dt > 5) { // tabblad lag stil: reken het als offline-voortgang
      const s0 = starsOf(S.fame), gain = offlineGain(S, dt); g.clearSlots(); g.touch(); if (gain.coins >= 1) toast(`🌙 +${fmt(gain.coins)} 🪙 terwijl je weg was${starsOf(S.fame) > s0 ? ` · ⭐ ${starsOf(S.fame)}` : ''}`, 'good'); return 0;
    }
    let left = dt; while (left > 0) { const s = Math.min(left, 0.1); g.tick(s); left -= s; }
    return dt;
  }
  function frame() {
    if (!alive) return;
    if (!view.isConnected) { destroy(); return; }
    raf = requestAnimationFrame(frame);
    const dt = pump(); handleOut(); frameN++;
    if (tab === 'svc') { sceneUpdate(dt); if (!document.hidden && performance.now() - lastDraw >= 28) { lastDraw = performance.now(); drawScene(); } } else if (tab === 'tru' && frameN % 5 === 0) { sc.t += dt * 5; drawMini(); }
    uiUpdate(false);
  }
  buildTix(); tutCheck(); second(); uiUpdate(true);
  if (typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(frame);
  every(() => { if (!view.isConnected) { destroy(); return; } if (Date.now() - lastT > 400) { pump(); handleOut(); uiUpdate(true); } }, 500);   // reserve voor verborgen tabbladen
  every(() => { second(); if (tab === 'mkt' || tab === 'team' || tab === 'city' || tab === 'menu') liveUpdate(); }, 1000);
  every(() => { saveLocal(); }, 8000);
  every(() => { cloudSave(false); }, 20000);
  later(() => { showAway(); showDaily(); }, 600);
}
