// Huisdier 2.0 - koken. Zelfstandige ES-module, geen imports.
// Contract: createCooking(host, api) -> { destroy() }.
// api = { w, h, pet:{name,species,html(size,mood)}, getInventory(), consume(obj), addDish(d), award(a),
//         toast(msg), sound(name), level, loadExtra('kook'), saveExtra('kook', obj) }

const FONT = 'system-ui,-apple-system,"Segoe UI","Apple Color Emoji","Noto Color Emoji",sans-serif';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const nowMs = () => Date.now();

// ---------------------------------------------------------------- data
export const INGREDIENTS = [
  { id: 'eieren', name: 'Eieren', emoji: '\u{1F95A}', price: 2 },
  { id: 'meel', name: 'Meel', emoji: '\u{1F33E}', price: 1 },
  { id: 'melk', name: 'Melk', emoji: '\u{1F95B}', price: 1 },
  { id: 'boter', name: 'Boter', emoji: '\u{1F9C8}', price: 2 },
  { id: 'suiker', name: 'Suiker', emoji: '\u{1F36C}', price: 1 },
  { id: 'zout', name: 'Zout', emoji: '\u{1F9C2}', price: 1 },
  { id: 'tomaat', name: 'Tomaat', emoji: '\u{1F345}', price: 2 },
  { id: 'ui', name: 'Ui', emoji: '\u{1F9C5}', price: 1 },
  { id: 'knoflook', name: 'Knoflook', emoji: '\u{1F9C4}', price: 1 },
  { id: 'aardappel', name: 'Aardappel', emoji: '\u{1F954}', price: 1 },
  { id: 'wortel', name: 'Wortel', emoji: '\u{1F955}', price: 1 },
  { id: 'pasta', name: 'Pasta', emoji: '\u{1F35D}', price: 2 },
  { id: 'rijst', name: 'Rijst', emoji: '\u{1F35A}', price: 2 },
  { id: 'kaas', name: 'Kaas', emoji: '\u{1F9C0}', price: 3 },
  { id: 'kip', name: 'Kip', emoji: '\u{1F357}', price: 4 },
  { id: 'vis', name: 'Vis', emoji: '\u{1F41F}', price: 4 },
  { id: 'appel', name: 'Appel', emoji: '\u{1F34E}', price: 1 },
  { id: 'banaan', name: 'Banaan', emoji: '\u{1F34C}', price: 1 },
  { id: 'chocola', name: 'Chocola', emoji: '\u{1F36B}', price: 3 },
  { id: 'brood', name: 'Brood', emoji: '\u{1F35E}', price: 2 },
  { id: 'paprika', name: 'Paprika', emoji: '\u{1FAD1}', price: 2 },
  { id: 'champignons', name: 'Champignons', emoji: '\u{1F344}', price: 2 },
  { id: 'spinazie', name: 'Spinazie', emoji: '\u{1F96C}', price: 2 },
  { id: 'room', name: 'Room', emoji: '\u{1F376}', price: 2 },
  { id: 'olie', name: 'Olijfolie', emoji: '\u{1FAD2}', price: 2 },
  { id: 'kruiden', name: 'Kruiden', emoji: '\u{1F33F}', price: 1 },
  { id: 'citroen', name: 'Citroen', emoji: '\u{1F34B}', price: 1 },
  { id: 'honing', name: 'Honing', emoji: '\u{1F36F}', price: 2 },
  { id: 'haver', name: 'Haver', emoji: '\u{1F963}', price: 1 },
  { id: 'tofu', name: 'Tofu', emoji: '\u{1F362}', price: 3 },
  { id: 'pindakaas', name: 'Pindakaas', emoji: '\u{1F95C}', price: 2 },
  { id: 'bakpoeder', name: 'Bakpoeder', emoji: '\u{1F944}', price: 1 },
  { id: 'gist', name: 'Gist', emoji: '\u{1FAD9}', price: 1 },
  { id: 'kokosmelk', name: 'Kokosmelk', emoji: '\u{1F965}', price: 2 },
  { id: 'currypasta', name: 'Currypasta', emoji: '\u{1F35B}', price: 2 },
  { id: 'broccoli', name: 'Broccoli', emoji: '\u{1F966}', price: 2 },
  { id: 'mais', name: 'Mais', emoji: '\u{1F33D}', price: 1 },
  { id: 'aardbei', name: 'Aardbei', emoji: '\u{1F353}', price: 2 },
  { id: 'worst', name: 'Rookworst', emoji: '\u{1F32D}', price: 3 },
  { id: 'bouillon', name: 'Bouillon', emoji: '\u{1F372}', price: 1 },
  { id: 'courgette', name: 'Courgette', emoji: '\u{1F952}', price: 2 },
];
const ING = {};
INGREDIENTS.forEach((i) => { ING[i.id] = i; });

// stap-helpers
const sn = (text, em, size, col) => ({ t: 'snijden', text, em, size, col });
const sc = (text, em, mode) => ({ t: 'schillen', text, em, mode: mode || 'schillen' });
const af = (text, em, target, unit) => ({ t: 'afwegen', text, em, target, unit: unit || 'g' });
const ro = (text, col) => ({ t: 'roeren', text, col: col || '#f6d8a8' });
const kl = (text, col) => ({ t: 'kloppen', text, col: col || '#fff3c4' });
const kn = (text) => ({ t: 'kneden', text });
const ba = (text, food, flip, rate) => ({ t: 'bakken', text, food, flip: !!flip, rate: rate || 1 });
const ko = (text, secs, col) => ({ t: 'koken', text, secs: secs || 24, col: col || '#f4a58a' });
const ov = (text, tTemp, tMin, food) => ({ t: 'oven', text, tTemp, tMin, food });
const kr = (text, em, target) => ({ t: 'kruiden', text, em, target });
const op = (text, tops) => ({ t: 'opmaken', text, tops });

export const RECIPES = [
  { id: 'boterham', name: 'Boterham met kaas', emoji: '\u{1F96A}', minLevel: 1, look: 'sandwich',
    desc: 'Een lekker simpele lunch.', ingredients: { brood: 2, kaas: 1, boter: 1, tomaat: 1 },
    steps: [sc('Was de tomaat', '\u{1F345}', 'wassen'), sn('Snijd de kaas in plakjes', '\u{1F9C0}', 'dun', '#ffd24a'), op('Beleg de boterham', ['\u{1F9C0}', '\u{1F345}', '\u{1F33F}'])],
    base: { hunger: 18, happy: 6, energy: 8, health: 4 }, tags: ['makkelijk', 'lunch'] },
  { id: 'roerei', name: 'Roerei', emoji: '\u{1F373}', minLevel: 1, look: 'scramble',
    desc: 'Zacht en romig, zo klaar.', ingredients: { eieren: 2, boter: 1, zout: 1 },
    steps: [kl('Klop de eieren los', '#ffe680'), ba('Roer de eieren in de pan', 'ei', false, 1.2), kr('Een snufje zout', '\u{1F9C2}', 2), op('Schep op het bord', ['\u{1F33F}', '\u{1F345}'])],
    base: { hunger: 20, happy: 6, energy: 10, health: 5 }, tags: ['makkelijk', 'ontbijt'] },
  { id: 'fruitsalade', name: 'Fruitsalade', emoji: '\u{1F957}', minLevel: 1, look: 'salad',
    desc: 'Vrolijk, fris en vol vitamientjes.', ingredients: { appel: 1, banaan: 1, aardbei: 1, citroen: 1 },
    steps: [sc('Was het fruit', '\u{1F34E}', 'wassen'), sn('Snijd het fruit in stukjes', '\u{1F34C}', 'middel', '#ffe08a'), kr('Druppel wat citroen erover', '\u{1F34B}', 3), ro('Meng alles voorzichtig', '#ffd6a5'), op('Maak de kom mooi', ['\u{1F353}', '\u{1F34C}', '\u{1F34E}', '\u{1FAD0}'])],
    base: { hunger: 14, happy: 9, energy: 8, health: 14 }, tags: ['makkelijk', 'fruit', 'gezond'] },
  { id: 'havermout', name: 'Havermoutpap met fruit', emoji: '\u{1F963}', minLevel: 1, look: 'bowl', col: '#f1deb8',
    desc: 'Warm en zacht voor een goede start.', ingredients: { haver: 1, melk: 1, banaan: 1, honing: 1 },
    steps: [af('Weeg de haver af', '\u{1F963}', 50, 'g'), ko('Laat de pap zachtjes sudderen', 22, '#f1deb8'), sn('Snijd de banaan', '\u{1F34C}', 'dun', '#ffe680'), kr('Een lepeltje honing', '\u{1F36F}', 3), op('Versier met fruit', ['\u{1F34C}', '\u{1F353}', '\u{1FAD0}'])],
    base: { hunger: 20, happy: 7, energy: 14, health: 10 }, tags: ['ontbijt', 'gezond'] },
  { id: 'pannenkoeken', name: 'Pannenkoeken', emoji: '\u{1F95E}', minLevel: 2, look: 'pancakes',
    desc: 'Dun, goudbruin en heerlijk.', ingredients: { meel: 1, eieren: 1, melk: 1, boter: 1, zout: 1 },
    steps: [af('Weeg het meel af', '\u{1F33E}', 250, 'g'), kl('Klop het beslag glad', '#f7ecd0'), ro('Roer de melk erdoor', '#f7ecd0'), ba('Bak de pannenkoek en draai hem om', 'deeg', true, 1), op('Stapel en versier', ['\u{1F353}', '\u{1F36F}', '\u{1F9C8}'])],
    base: { hunger: 24, happy: 12, energy: 14, health: 3 }, tags: ['makkelijk', 'bakken'] },
  { id: 'omelet', name: 'Omelet met kaas', emoji: '\u{1F95A}', minLevel: 2, look: 'omelet',
    desc: 'Gevuld met kaas en spinazie.', ingredients: { eieren: 2, kaas: 1, spinazie: 1, boter: 1 },
    steps: [sc('Was de spinazie', '\u{1F96C}', 'wassen'), sn('Rasp of snijd de kaas', '\u{1F9C0}', 'dun', '#ffd24a'), kl('Klop de eieren', '#ffe680'), ba('Bak de omelet en draai hem om', 'ei', true, 1), kr('Een beetje kruiden', '\u{1F33F}', 3)],
    base: { hunger: 22, happy: 8, energy: 12, health: 8 }, tags: ['bakken', 'ontbijt'] },
  { id: 'tomatensoep', name: 'Tomatensoep', emoji: '\u{1F345}', minLevel: 3, look: 'bowl', col: '#e8553a',
    desc: 'Warm, rood en gezellig.', ingredients: { tomaat: 2, ui: 1, bouillon: 1, room: 1 },
    steps: [sc('Schil de ui', '\u{1F9C5}', 'schillen'), sn('Snijd de tomaten', '\u{1F345}', 'middel', '#ef5b4a'), ko('Laat de soep zachtjes pruttelen', 26, '#e8553a'), ro('Roer de room erdoor', '#f08a6a'), kr('Proef en voeg zout toe', '\u{1F9C2}', 3), op('Garneer met kruiden', ['\u{1F33F}', '\u{1F33F}', '\u{1F95B}'])],
    base: { hunger: 20, happy: 9, energy: 8, health: 10 }, tags: ['soep', 'warm'] },
  { id: 'groentesoep', name: 'Groentesoep', emoji: '\u{1F963}', minLevel: 3, look: 'bowl', col: '#9cc96a',
    desc: 'Vol groente, goed voor je.', ingredients: { wortel: 1, aardappel: 1, broccoli: 1, bouillon: 1 },
    steps: [sc('Was de groente', '\u{1F955}', 'wassen'), sn('Snijd de groente in stukjes', '\u{1F955}', 'middel', '#f4a261'), ko('Laat de soep sudderen', 28, '#9cc96a'), kr('Proef en kruid', '\u{1F33F}', 3), op('Schep in de kom', ['\u{1F33F}', '\u{1F955}'])],
    base: { hunger: 18, happy: 7, energy: 8, health: 16 }, tags: ['soep', 'gezond'] },
  { id: 'spaghetti', name: 'Spaghetti met tomatensaus', emoji: '\u{1F35D}', minLevel: 4, look: 'pasta',
    desc: 'De klassieker met zelfgemaakte saus.', ingredients: { pasta: 1, tomaat: 2, ui: 1, knoflook: 1, olie: 1 },
    steps: [sn('Snijd ui en tomaat', '\u{1F345}', 'middel', '#ef5b4a'), ba('Bak de ui en knoflook zacht', 'groente', false, 1), ko('Kook de spaghetti gaar', 26, '#f6e3a1'), kr('Kruid de saus', '\u{1F33F}', 4), op('Schep de saus op de pasta', ['\u{1F345}', '\u{1F33F}', '\u{1F9C0}'])],
    base: { hunger: 26, happy: 11, energy: 16, health: 6 }, tags: ['pasta', 'avondeten'] },
  { id: 'rijstkip', name: 'Rijst met kip en groente', emoji: '\u{1F35B}', minLevel: 5, look: 'rice',
    desc: 'Een complete maaltijd.', ingredients: { rijst: 1, kip: 1, paprika: 1, wortel: 1, olie: 1 },
    steps: [sn('Snijd de kip in blokjes', '\u{1F357}', 'middel', '#f0c8a0'), sn('Snijd paprika en wortel', '\u{1FAD1}', 'dun', '#e85a4f'), ba('Bak de kip goudbruin en draai om', 'kip', true, 0.9), ko('Kook de rijst', 24, '#fffdf5'), kr('Kruid de kip', '\u{1F33F}', 4), op('Maak het bord mooi', ['\u{1F357}', '\u{1FAD1}', '\u{1F955}', '\u{1F33F}'])],
    base: { hunger: 30, happy: 10, energy: 18, health: 12 }, tags: ['avondeten', 'kip'] },
  { id: 'stamppot', name: 'Stamppot met worst', emoji: '\u{1F954}', minLevel: 5, look: 'mash',
    desc: 'Echte Hollandse winterkost.', ingredients: { aardappel: 2, wortel: 1, worst: 1, boter: 1, melk: 1 },
    steps: [sc('Schil de aardappels', '\u{1F954}', 'schillen'), sn('Snijd de wortel', '\u{1F955}', 'middel', '#f4a261'), ko('Kook de groente gaar', 26, '#e9d6a8'), ro('Stamp en roer tot puree', '#e8d39a'), op('Leg de worst erbij', ['\u{1F32D}', '\u{1F9C8}', '\u{1F33F}'])],
    base: { hunger: 32, happy: 9, energy: 18, health: 9 }, tags: ['avondeten', 'hollands'] },
  { id: 'vis', name: 'Gebakken vis met citroen', emoji: '\u{1F41F}', minLevel: 6, look: 'fish',
    desc: 'Knapperig van buiten, zacht van binnen.', ingredients: { vis: 1, citroen: 1, boter: 1, mais: 1 },
    steps: [sc('Was de vis voorzichtig', '\u{1F41F}', 'wassen'), kr('Strooi wat zout en kruiden', '\u{1F33F}', 3), ba('Bak de vis en draai om', 'vis', true, 0.9), sn('Snijd de citroen', '\u{1F34B}', 'dik', '#ffe14d'), op('Leg het mooi op het bord', ['\u{1F34B}', '\u{1F33D}', '\u{1F33F}'])],
    base: { hunger: 26, happy: 9, energy: 14, health: 14 }, tags: ['vis', 'avondeten'] },
  { id: 'wafels', name: 'Wafels', emoji: '\u{1F9C7}', minLevel: 6, look: 'waffle',
    desc: 'Warm uit het wafelijzer.', ingredients: { meel: 1, eieren: 1, melk: 1, boter: 1, suiker: 1, bakpoeder: 1 },
    steps: [af('Weeg het meel af', '\u{1F33E}', 200, 'g'), kl('Klop eieren en suiker luchtig', '#fff0b8'), ro('Roer het beslag glad', '#f7ecd0'), ba('Bak de wafel goudbruin', 'deeg', true, 1), op('Versier met fruit', ['\u{1F353}', '\u{1F353}', '\u{1FAD0}', '\u{1F36F}'])],
    base: { hunger: 22, happy: 14, energy: 14, health: 3 }, tags: ['bakken', 'zoet'] },
  { id: 'koekjes', name: 'Pindakaaskoekjes', emoji: '\u{1F36A}', minLevel: 7, look: 'cookies',
    desc: 'Krokant buiten, zacht binnen.', ingredients: { pindakaas: 1, suiker: 1, eieren: 1, meel: 1 },
    steps: [af('Weeg de suiker af', '\u{1F36C}', 100, 'g'), ro('Roer pindakaas en ei door elkaar', '#d9a45e'), kn('Kneed het deeg'), ov('Bak de koekjes in de oven', 175, 12, 'koek'), op('Leg de koekjes op het bord', ['\u{1F36A}', '\u{1F36A}', '\u{1F36A}'])],
    base: { hunger: 14, happy: 16, energy: 14, health: 2 }, tags: ['koekjes', 'zoet', 'oven'] },
  { id: 'pizza', name: 'Pizza', emoji: '\u{1F355}', minLevel: 8, look: 'pizza',
    desc: 'Zelfgemaakte bodem met veel kaas.', ingredients: { meel: 1, gist: 1, tomaat: 2, kaas: 1, olie: 1 },
    steps: [af('Weeg het meel af', '\u{1F33E}', 300, 'g'), kn('Kneed het pizzadeeg'), ro('Roer de tomatensaus', '#e8553a'), op('Beleg de pizza', ['\u{1F9C0}', '\u{1F345}', '\u{1F344}', '\u{1F33F}', '\u{1FAD1}']), ov('Bak de pizza in de oven', 220, 15, 'deeg')],
    base: { hunger: 34, happy: 16, energy: 20, health: 4 }, tags: ['oven', 'avondeten'] },
  { id: 'bananenbrood', name: 'Bananenbrood', emoji: '\u{1F35E}', minLevel: 8, look: 'loaf', col: '#c58a4a',
    desc: 'Zoet, zacht en heerlijk geurig.', ingredients: { banaan: 2, meel: 1, suiker: 1, eieren: 1, boter: 1, bakpoeder: 1 },
    steps: [sc('Pel de bananen', '\u{1F34C}', 'schillen'), ro('Prak en meng het beslag', '#f0d79a'), af('Weeg het meel af', '\u{1F33E}', 250, 'g'), kl('Klop de eieren erdoor', '#fff0b8'), ov('Bak het brood in de oven', 175, 35, 'cake')],
    base: { hunger: 22, happy: 14, energy: 16, health: 6 }, tags: ['oven', 'zoet'] },
  { id: 'appeltaart', name: 'Appeltaart', emoji: '\u{1F967}', minLevel: 10, look: 'pie',
    desc: 'Met kaneel, een echte klassieker.', ingredients: { appel: 3, meel: 1, suiker: 1, boter: 1, eieren: 1, kruiden: 1 },
    steps: [sc('Schil de appels', '\u{1F34E}', 'schillen'), sn('Snijd de appels in partjes', '\u{1F34E}', 'dun', '#f2e6b0'), kn('Kneed het deeg'), kr('Strooi kaneel en suiker', '\u{1F33F}', 4), ov('Bak de taart in de oven', 180, 40, 'cake'), op('Versier de taart', ['\u{1F353}', '\u{1F36F}', '\u{1F33F}'])],
    base: { hunger: 28, happy: 18, energy: 18, health: 6 }, tags: ['oven', 'zoet', 'taart'] },
  { id: 'chocoladecake', name: 'Chocoladecake', emoji: '\u{1F370}', minLevel: 11, look: 'cake',
    desc: 'Zacht, donker en vol chocola.', ingredients: { chocola: 1, meel: 1, suiker: 1, eieren: 2, boter: 1, bakpoeder: 1 },
    steps: [af('Weeg het meel af', '\u{1F33E}', 200, 'g'), kl('Klop eieren en suiker', '#fff0b8'), ro('Roer de gesmolten chocola erdoor', '#7a4a2a'), ov('Bak de cake in de oven', 175, 30, 'cake'), op('Versier de cake', ['\u{1F353}', '\u{1F36B}', '\u{1F36B}', '\u{1F33F}'])],
    base: { hunger: 22, happy: 20, energy: 18, health: 2 }, tags: ['oven', 'zoet', 'taart'] },
  { id: 'risotto', name: 'Champignonrisotto', emoji: '\u{1F344}', minLevel: 12, look: 'bowl', col: '#f0e2c0', top: 'champ',
    desc: 'Romig en langzaam gekookt.', ingredients: { rijst: 1, champignons: 1, ui: 1, bouillon: 1, kaas: 1, boter: 1 },
    steps: [sn('Snijd ui en champignons', '\u{1F344}', 'dun', '#e6d5b8'), ba('Bak de ui en champignons zacht', 'groente', false, 0.9), ko('Laat de rijst langzaam garen', 32, '#f0e2c0'), ro('Roer de kaas erdoor', '#f6ebc8'), kr('Proef en kruid', '\u{1F9C2}', 3), op('Garneer het bord', ['\u{1F33F}', '\u{1F9C0}', '\u{1F344}'])],
    base: { hunger: 32, happy: 14, energy: 20, health: 8 }, tags: ['avondeten', 'moeilijk'] },
  { id: 'curry', name: 'Kokoscurry met tofu', emoji: '\u{1F35B}', minLevel: 13, look: 'bowl', col: '#e8a23a', top: 'rice',
    desc: 'Geurig, zacht pittig en romig.', ingredients: { tofu: 1, kokosmelk: 1, currypasta: 1, rijst: 1, paprika: 1, ui: 1 },
    steps: [sn('Snijd tofu, paprika en ui', '\u{1F362}', 'middel', '#f4ecd0'), ba('Bak de tofu goudbruin', 'tofu', true, 1), ko('Laat de curry sudderen', 32, '#e8a23a'), kr('Voeg currykruiden toe', '\u{1F33F}', 4), op('Serveer met rijst en kruiden', ['\u{1F35A}', '\u{1FAD1}', '\u{1F33F}'])],
    base: { hunger: 34, happy: 14, energy: 22, health: 12 }, tags: ['avondeten', 'moeilijk', 'vegetarisch'] },
  { id: 'ovenschotel', name: 'Pasta-ovenschotel', emoji: '\u{1F9C0}', minLevel: 14, look: 'casserole',
    desc: 'Met broccoli en een korstje kaas.', ingredients: { pasta: 1, kaas: 2, broccoli: 1, room: 1, ui: 1 },
    steps: [sn('Snijd ui en broccoli', '\u{1F966}', 'middel', '#7cc24f'), ko('Kook de pasta halfgaar', 26, '#f6e3a1'), ro('Roer de roomsaus met kaas', '#f8e3a0'), kr('Kruid de saus', '\u{1F33F}', 3), ov('Gratineer in de oven', 200, 25, 'deeg'), op('Strooi kaas en kruiden erover', ['\u{1F9C0}', '\u{1F33F}', '\u{1F966}'])],
    base: { hunger: 38, happy: 16, energy: 22, health: 10 }, tags: ['oven', 'avondeten', 'moeilijk'] },
];

// ---------------------------------------------------------------- pure functies
export const STEP_TYPES = ['snijden', 'schillen', 'afwegen', 'roeren', 'kloppen', 'kneden', 'bakken', 'koken', 'oven', 'kruiden', 'opmaken'];

function num(v, d) { const n = Number(v); return (v === null || v === undefined || v === '' || !isFinite(n)) ? d : n; }

// Fornuis: hitte 0-5 x seconden = 'energie'. <30 rauw, 30-60 gaar, 60-85 bruin, >=85 verbrand.
function stateFromEnergy(e) { return e < 30 ? 'rauw' : e < 60 ? 'gaar' : e < 85 ? 'bruin' : 'verbrand'; }
export function stoveState(heat, secondsOnHeat) {
  return stateFromEnergy(Math.max(0, num(heat, 0)) * Math.max(0, num(secondsOnHeat, 0)));
}

function bakeScore(e) { return 100 - Math.max(0, Math.abs(e - 47) - 8) * 3.5; }

// Geeft 0-100 terug. Zie de invoer per stapsoort hieronder.
export function scoreStep(type, input) {
  const i = input || {};
  let s = 0;
  switch (type) {
    case 'snijden': { // { ratio: gemiddelde dikte / doeldikte, even: 0-1 }
      const r = num(i.ratio, 0), ev = clamp(num(i.even, 1), 0, 1);
      s = r <= 0 ? 0 : 100 - Math.abs(r - 1) * 90 - (1 - ev) * 40; break;
    }
    case 'schillen': case 'wassen': { // { done, total, secs, par }
      const d = num(i.done, 0), t = Math.max(1, num(i.total, 1));
      s = d < t ? 55 * d / t : Math.max(55, 100 - Math.max(0, num(i.secs, 0) - num(i.par, 10)) * 3); break;
    }
    case 'afwegen': { // { amount, target }
      const t = num(i.target, 0);
      s = t <= 0 ? 0 : 100 - Math.abs(num(i.amount, 0) - t) / t * 400; break;
    }
    case 'roeren': // { even: 0-1, splashes }
      s = clamp(num(i.even, 0), 0, 1) * 100 - num(i.splashes, 0) * 5; break;
    case 'kloppen': { // { secs, par, steady: 0-1 }
      const sp = Math.min(1, num(i.par, 8) / Math.max(0.1, num(i.secs, 8)));
      s = 40 + 40 * sp + 20 * clamp(num(i.steady, 0.5), 0, 1); break;
    }
    case 'kneden': // { avgErr: 0-0.5 }
      s = 100 - clamp(num(i.avgErr, 0.5), 0, 0.5) * 220; break;
    case 'bakken': { // { e, e2? } energie per kant
      s = i.e2 === undefined || i.e2 === null ? bakeScore(num(i.e, 0)) : (bakeScore(num(i.e, 0)) + bakeScore(num(i.e2, 0))) / 2; break;
    }
    case 'koken': { // { good, total, overs }
      const t = num(i.total, 0);
      s = t <= 0 ? 0 : num(i.good, 0) / t * 100 - num(i.overs, 0) * 12; break;
    }
    case 'oven': { // { temp, minutes, tTemp, tMin }
      const tt = Math.max(1, num(i.tTemp, 180)), tm = Math.max(1, num(i.tMin, 30));
      const dose = (num(i.temp, 0) * num(i.minutes, 0)) / (tt * tm);
      s = 100 - Math.abs(dose - 1) * 100 - Math.abs(num(i.temp, 0) - tt) / tt * 150; break;
    }
    case 'kruiden': // { amount, target }
      s = 100 - Math.abs(num(i.amount, 0) - num(i.target, 3)) * 28; break;
    case 'opmaken': { // { placed, total, spread: 0-1 }
      const t = Math.max(1, num(i.total, 1));
      s = clamp(num(i.placed, 0) / t, 0, 1) * 70 + clamp(num(i.spread, 0), 0, 1) * 30; break;
    }
    default: s = 0;
  }
  return Math.round(clamp(s, 0, 100));
}

export function starsFromScores(scores) {
  const a = (scores || []).map((x) => num(x, 0));
  if (!a.length) return 1;
  const avg = a.reduce((p, c) => p + c, 0) / a.length;
  return avg >= 78 ? 3 : avg >= 50 ? 2 : 1;
}
export function averageScore(scores) {
  const a = (scores || []).map((x) => num(x, 0));
  return a.length ? Math.round(a.reduce((p, c) => p + c, 0) / a.length) : 0;
}
export function isFailed(scores) { return averageScore(scores) < 28; }

export function missingFor(recipe, inventory) {
  const inv = inventory || {}, miss = {};
  const need = (recipe && recipe.ingredients) || {};
  Object.keys(need).forEach((k) => { const lack = need[k] - num(inv[k], 0); if (lack > 0) miss[k] = lack; });
  return miss;
}
export function canCook(recipe, inventory) {
  if (!recipe || !recipe.ingredients) return false;
  return Object.keys(missingFor(recipe, inventory)).length === 0;
}

export function tipFor(type, input, score) {
  const i = input || {};
  const good = score >= 78, ok = score >= 50;
  switch (type) {
    case 'snijden': return num(i.ratio, 1) > 1.25 ? 'Iets te grof gesneden' : num(i.ratio, 1) < 0.75 ? 'Wel heel fijn gesneden' : num(i.even, 1) < 0.7 ? 'Prima, maar de stukjes zijn ongelijk' : 'Mooi gelijkmatige stukjes!';
    case 'schillen': case 'wassen': return good ? 'Lekker schoon en netjes!' : ok ? 'Goed gedaan, dat kan iets sneller' : 'Nog niet helemaal schoon, even doorgaan';
    case 'afwegen': { const d = num(i.amount, 0) - num(i.target, 0); return Math.abs(d) <= num(i.target, 1) * 0.03 ? 'Precies afgewogen!' : d > 0 ? 'Een beetje te veel' : 'Een beetje te weinig'; }
    case 'roeren': return num(i.splashes, 0) > 2 ? 'Oeps, het spetterde een beetje' : good ? 'Mooi gelijkmatig geroerd!' : 'Wat onregelmatig, maar het mengt wel';
    case 'kloppen': return good ? 'Lekker luchtig geklopt!' : ok ? 'Goed geklopt, probeer eens een vast ritme' : 'Nog wat plukkerig, klop iets vaker';
    case 'kneden': return good ? 'Mooi in het ritme gekneed!' : ok ? 'Goed bezig, let op het ritme' : 'Wat onregelmatig gekneed';
    case 'bakken': { const e = num(i.e, 0); return e < 30 ? 'Nog een beetje rauw' : e < 60 ? 'Mooi gaar en gouden!' : e < 85 ? 'Wat donker, maar nog lekker' : 'Oeps, een beetje aangebrand'; }
    case 'koken': return num(i.overs, 0) > 0 ? 'Oeps, het kookte even over' : good ? 'Lekker zachtjes gesudderd!' : 'De hitte mocht iets gelijkmatiger';
    case 'oven': { const d = (num(i.temp, 0) * num(i.minutes, 0)) / (Math.max(1, num(i.tTemp, 180)) * Math.max(1, num(i.tMin, 30))); return d < 0.8 ? 'Wat te kort in de oven, nog een beetje rauw' : d > 1.25 ? 'Wat te lang, een beetje droog' : 'Precies goed gebakken!'; }
    case 'kruiden': { const d = num(i.amount, 0) - num(i.target, 3); return d === 0 ? 'Precies goed op smaak!' : d < 0 ? 'Een tikkeltje flauw' : 'Een tikkeltje te veel'; }
    case 'opmaken': return good ? 'Wat een mooi bord!' : ok ? 'Gezellig opgemaakt' : 'Zo kan het ook, het smaakt hetzelfde';
    default: return 'Goed gedaan!';
  }
}

// ---------------------------------------------------------------- kleur en tekenen
function hexRgb(h) { const n = parseInt(String(h).replace('#', ''), 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mixHex(a, b, t) {
  const A = hexRgb(a), B = hexRgb(b);
  const c = A.map((v, k) => Math.round(v + (B[k] - v) * clamp(t, 0, 1)));
  return '#' + c.map((v) => ('0' + v.toString(16)).slice(-2)).join('');
}
const FOODS = {
  ei: ['#fff6c8', '#ffd84d', '#d79a2b', '#2f2118'],
  deeg: ['#f7ead2', '#f1cf8e', '#c9873a', '#2f2118'],
  kip: ['#f6ddd3', '#f0c89a', '#b9783a', '#2f2118'],
  groente: ['#d8e8b0', '#9bd36f', '#b9923a', '#2f2118'],
  vis: ['#f6e6df', '#f4d3ba', '#cf9552', '#2f2118'],
  tofu: ['#f4efe0', '#f0dd9c', '#c58a3a', '#2f2118'],
  cake: ['#f3e1b8', '#e0b36a', '#a8672a', '#2b1d14'],
  koek: ['#f0d9a8', '#dcae65', '#a86a2c', '#2b1d14'],
};
function foodColor(food, e) {
  const p = FOODS[food] || FOODS.deeg;
  if (e <= 0) return p[0];
  if (e < 45) return mixHex(p[0], p[1], e / 45);
  if (e < 72) return mixHex(p[1], p[2], (e - 45) / 27);
  if (e < 100) return mixHex(p[2], p[3], (e - 72) / 28);
  return p[3];
}
function starStr(n, total) { let s = ''; for (let k = 0; k < (total || 3); k++) s += k < n ? '⭐' : '☆'; return s; }
function diffOf(r) { return Math.max(1, Math.min(3, 1 + Math.floor((r.minLevel || 1) / 5))); }
function stepStars(sc2) { return sc2 >= 78 ? 3 : sc2 >= 50 ? 2 : 1; }

// Gerecht op een bord, viewBox 0 0 120 120. Uiterlijk per recept en kwaliteit q (0-100).
export function dishSvg(recipe, q, size) {
  const Q = clamp(num(q, 70), 0, 100);
  const c = (col) => Q < 40 ? mixHex(col, '#3b2a1f', 0.55) : Q < 65 ? mixHex(col, '#6b4a2a', 0.18) : col;
  const r = recipe || {};
  const col = r.col || '#e8a23a';
  let body = '';
  switch (r.look) {
    case 'sandwich':
      body = '<rect x="24" y="40" width="72" height="44" rx="12" fill="' + c('#e4b76c') + '"/><rect x="30" y="46" width="60" height="32" rx="8" fill="' + c('#f6dca0') + '"/><rect x="20" y="52" width="80" height="12" rx="3" fill="' + c('#ffd24a') + '"/><circle cx="44" cy="62" r="7" fill="' + c('#ee5a4a') + '"/><circle cx="74" cy="62" r="7" fill="' + c('#ee5a4a') + '"/><path d="M32 46h56" stroke="' + c('#c58a3a') + '" stroke-width="2"/>'; break;
    case 'scramble':
      body = [[44, 58, 16, 11], [66, 54, 15, 10], [58, 70, 17, 10], [78, 68, 12, 8], [38, 72, 11, 8]].map((e) => '<ellipse cx="' + e[0] + '" cy="' + e[1] + '" rx="' + e[2] + '" ry="' + e[3] + '" fill="' + c('#ffdf55') + '"/>').join('') + '<circle cx="52" cy="58" r="2" fill="#6fbf4a"/><circle cx="72" cy="66" r="2" fill="#6fbf4a"/><circle cx="62" cy="50" r="2" fill="#6fbf4a"/>'; break;
    case 'salad':
      body = '<path d="M18 52h84a42 42 0 0 1 -84 0z" fill="#fff" stroke="#e1d8ee" stroke-width="2"/>' + [[40, 48, '#ee5a6a'], [60, 44, '#ffe27a'], [80, 48, '#9bd36f'], [50, 54, '#ff9db1'], [70, 54, '#ffd35a'], [60, 56, '#ee5a6a']].map((e) => '<circle cx="' + e[0] + '" cy="' + e[1] + '" r="9" fill="' + c(e[2]) + '"/>').join(''); break;
    case 'bowl':
      body = '<path d="M16 54h88a44 44 0 0 1 -88 0z" fill="#fff" stroke="#e1d8ee" stroke-width="2"/><ellipse cx="60" cy="54" rx="42" ry="9" fill="' + c(col) + '"/>' + (r.top === 'rice' ? '<ellipse cx="82" cy="52" rx="14" ry="7" fill="#fffdf5"/>' : r.top === 'champ' ? '<ellipse cx="50" cy="52" rx="7" ry="4" fill="#caa97a"/><ellipse cx="72" cy="55" rx="6" ry="3.5" fill="#caa97a"/>' : '<circle cx="48" cy="54" r="2.5" fill="#fff" opacity=".7"/><circle cx="70" cy="53" r="2" fill="#6fbf4a"/>') + '<path d="M44 30c-5 6 5 8 0 14M62 26c-5 6 5 8 0 14M80 30c-5 6 5 8 0 14" stroke="#d9d2e3" stroke-width="2.5" fill="none" stroke-linecap="round"/>'; break;
    case 'pasta':
      body = [[0, 0], [4, 5], [-4, 8], [6, -4], [-6, -2]].map((e, k) => '<ellipse cx="' + (60 + e[0]) + '" cy="' + (64 + e[1]) + '" rx="' + (32 - k * 2) + '" ry="' + (16 - k) + '" fill="none" stroke="' + c('#f2d27a') + '" stroke-width="5"/>').join('') + '<ellipse cx="60" cy="56" rx="19" ry="10" fill="' + c('#e0472f') + '"/><circle cx="54" cy="53" r="3" fill="#6fbf4a"/><circle cx="66" cy="58" r="2.5" fill="#6fbf4a"/>'; break;
    case 'pancakes':
      body = [74, 64, 54].map((y, k) => '<ellipse cx="60" cy="' + y + '" rx="38" ry="12" fill="' + c(k === 2 ? '#e2a95a' : '#d99a48') + '"/>').join('') + '<ellipse cx="60" cy="50" rx="30" ry="8" fill="' + c('#f0c177') + '"/><rect x="52" y="42" width="14" height="9" rx="2" fill="#ffe680"/><circle cx="76" cy="46" r="4" fill="#e63950"/><circle cx="44" cy="48" r="3.5" fill="#e63950"/><path d="M38 52c10 8 30 8 44 0" stroke="#d98a2a" stroke-width="2" fill="none"/>'; break;
    case 'omelet':
      body = '<path d="M16 64a44 30 0 0 1 88 0a44 18 0 0 1 -88 0z" fill="' + c('#ffd24a') + '"/><path d="M22 62q38 -18 76 0" stroke="' + c('#e4a920') + '" stroke-width="2.5" fill="none"/><circle cx="40" cy="66" r="3" fill="#6fbf4a"/><circle cx="62" cy="70" r="3" fill="#6fbf4a"/><circle cx="82" cy="65" r="3" fill="#6fbf4a"/>'; break;
    case 'cookies':
      body = [[40, 60], [74, 56], [58, 80]].map((e) => '<circle cx="' + e[0] + '" cy="' + e[1] + '" r="17" fill="' + c('#d9a45e') + '"/><path d="M' + (e[0] - 9) + ' ' + e[1] + 'h18M' + e[0] + ' ' + (e[1] - 9) + 'v18" stroke="' + c('#b57a35') + '" stroke-width="2"/>').join(''); break;
    case 'pizza':
      body = '<circle cx="60" cy="62" r="42" fill="' + c('#e6b562') + '"/><circle cx="60" cy="62" r="36" fill="' + c('#d9482f') + '"/><circle cx="60" cy="62" r="33" fill="' + c('#ffd24a') + '" opacity=".85"/>' + [[46, 50], [72, 54], [58, 74], [78, 72], [44, 70]].map((e) => '<circle cx="' + e[0] + '" cy="' + e[1] + '" r="6" fill="' + c('#e0472f') + '"/>').join('') + '<circle cx="62" cy="58" r="3" fill="#6fbf4a"/><circle cx="52" cy="62" r="3" fill="#6fbf4a"/>'; break;
    case 'loaf':
      body = '<rect x="18" y="46" width="84" height="38" rx="16" fill="' + c(col) + '"/><path d="M26 56q34 -14 68 0" stroke="' + c('#a6692f') + '" stroke-width="3" fill="none"/><rect x="82" y="50" width="18" height="30" rx="6" fill="' + c('#f6dca0') + '"/>'; break;
    case 'pie':
      body = '<circle cx="60" cy="62" r="42" fill="' + c('#e0a85a') + '"/><circle cx="60" cy="62" r="34" fill="' + c('#eec177') + '"/><path d="M30 44l60 36M44 36l46 44M30 62l40 24M90 44L30 80M76 36L30 70" stroke="' + c('#c98a3c') + '" stroke-width="3.5"/><circle cx="60" cy="62" r="42" fill="none" stroke="' + c('#c98a3c') + '" stroke-width="3" stroke-dasharray="4 5"/>'; break;
    case 'cake':
      body = '<rect x="22" y="58" width="76" height="28" rx="6" fill="' + c('#6b3f22') + '"/><rect x="22" y="42" width="76" height="22" rx="6" fill="' + c('#8a5230') + '"/><path d="M22 46h76v8q-6 10 -12 0q-6 12 -12 0q-6 10 -12 0q-6 12 -12 0q-6 10 -12 0z" fill="' + c('#4b2a16') + '"/><circle cx="48" cy="40" r="5" fill="#e63950"/><circle cx="72" cy="40" r="5" fill="#e63950"/>'; break;
    case 'rice':
      body = '<ellipse cx="46" cy="66" rx="26" ry="18" fill="#fffdf5" stroke="#eee7f6"/>' + [[70, 56], [80, 66], [72, 76], [86, 56]].map((e, k) => '<rect x="' + e[0] + '" y="' + e[1] + '" width="11" height="11" rx="3" fill="' + c(k % 2 ? '#e85a4f' : '#f0b878') + '"/>').join('') + '<circle cx="42" cy="58" r="3" fill="#f4a261"/><circle cx="52" cy="70" r="3" fill="#6fbf4a"/>'; break;
    case 'mash':
      body = '<ellipse cx="52" cy="66" rx="30" ry="20" fill="' + c('#ecd89c') + '"/><circle cx="44" cy="58" r="4" fill="' + c('#f4a261') + '"/><circle cx="58" cy="64" r="3" fill="' + c('#6fbf4a') + '"/><rect x="40" y="76" width="56" height="12" rx="6" fill="' + c('#b5513a') + '" transform="rotate(-14 68 82)"/><rect x="48" y="50" width="10" height="7" rx="2" fill="#ffe680"/>'; break;
    case 'casserole':
      body = '<rect x="14" y="42" width="92" height="50" rx="9" fill="#f0e7f7" stroke="#d9cfe6" stroke-width="2"/><rect x="20" y="48" width="80" height="38" rx="6" fill="' + c('#f2bf4a') + '"/>' + [[34, 60], [60, 70], [82, 58], [74, 76], [44, 76]].map((e) => '<circle cx="' + e[0] + '" cy="' + e[1] + '" r="6" fill="' + c('#d7922b') + '"/>').join('') + '<circle cx="56" cy="56" r="3" fill="#6fbf4a"/>'; break;
    case 'fish':
      body = '<path d="M20 62q30 -26 62 0q-32 26 -62 0z" fill="' + c('#e8b27a') + '"/><path d="M80 62l22 -14v28z" fill="' + c('#d79a58') + '"/><circle cx="36" cy="58" r="3" fill="#4b3a2a"/><path d="M44 52q10 10 0 20M56 50q10 12 0 24" stroke="' + c('#c98a3c') + '" stroke-width="2" fill="none"/><circle cx="92" cy="86" r="11" fill="#ffe14d" stroke="#f1c40f" stroke-width="2"/>'; break;
    case 'waffle':
      body = '<rect x="22" y="38" width="76" height="56" rx="14" fill="' + c('#e0a85a') + '"/>' + [0, 1, 2, 3].map((k) => '<path d="M' + (34 + k * 16) + ' 42v48M26 ' + (50 + k * 12) + 'h68" stroke="' + c('#b87a33') + '" stroke-width="2.5"/>').join('') + '<circle cx="46" cy="58" r="6" fill="#e63950"/><circle cx="70" cy="70" r="6" fill="#e63950"/><circle cx="76" cy="52" r="5" fill="#5b6bd6"/>'; break;
    default:
      body = '<circle cx="60" cy="62" r="30" fill="' + c('#e8a23a') + '"/>';
  }
  const spark = Q >= 78 ? '<text x="88" y="30" font-size="16">✨</text><text x="14" y="38" font-size="12">✨</text>' : Q < 40 ? '<text x="84" y="30" font-size="14">\u{1F4A8}</text>' : '';
  const s = size || 120;
  return '<svg viewBox="0 0 120 120" width="' + s + '" height="' + s + '" xmlns="http://www.w3.org/2000/svg"><ellipse cx="60" cy="104" rx="50" ry="8" fill="rgba(0,0,0,.08)"/><circle cx="60" cy="62" r="54" fill="#fff" stroke="#e1d8ee" stroke-width="3"/><circle cx="60" cy="62" r="46" fill="#f9f6fc" stroke="#eee7f6"/>' + body + spark + '</svg>';
}

// ---------------------------------------------------------------- scope (opruimen)
function makeScope() {
  const rem = [], tm = new Set(), iv = new Set();
  let dead = false;
  return {
    on(t, ty, fn, o) {
      if (!t || !t.addEventListener) return;
      t.addEventListener(ty, fn, o);
      rem.push(() => { try { t.removeEventListener(ty, fn, o); } catch (e) {} });
    },
    after(fn, ms) {
      if (dead) return 0;
      const id = setTimeout(() => { tm.delete(id); if (!dead) fn(); }, ms);
      tm.add(id); return id;
    },
    every(fn, ms) {
      if (dead) return 0;
      let last = nowMs();
      const id = setInterval(() => { if (dead) return; const n = nowMs(); const dt = Math.min(0.1, (n - last) / 1000); last = n; fn(dt); }, ms);
      iv.add(id); return id;
    },
    end() {
      dead = true;
      rem.forEach((f) => f()); rem.length = 0;
      tm.forEach((id) => clearTimeout(id)); tm.clear();
      iv.forEach((id) => clearInterval(id)); iv.clear();
    },
    get dead() { return dead; },
  };
}

const KBG = '<defs><pattern id="ktile" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="30" height="30" fill="#fff4e6"/><path d="M0 0H30V30" fill="none" stroke="#f3dcc2" stroke-width="1.2"/></pattern></defs>' +
  '<rect width="360" height="300" fill="url(#ktile)"/>' +
  '<rect x="248" y="14" width="86" height="60" rx="10" fill="#cfeaf7" stroke="#b08968" stroke-width="5"/><path d="M291 14v60M248 44h86" stroke="#b08968" stroke-width="3"/>' +
  '<path d="M20 26h130" stroke="#b08968" stroke-width="3"/><text x="30" y="56" font-size="22">\u{1F373}</text><text x="68" y="56" font-size="22">\u{1F944}</text><text x="104" y="56" font-size="22">\u{1F52A}</text>' +
  '<rect x="0" y="236" width="360" height="64" fill="#d9a877"/><rect x="0" y="230" width="360" height="12" fill="#ecc596"/>';

const BTN = 'border:0;border-radius:999px;padding:10px 18px;font:700 15px ' + FONT + ';background:#b794e6;color:#fff;cursor:pointer;box-shadow:0 3px 0 #9a78cc;touch-action:manipulation';
const BTN2 = 'border:0;border-radius:999px;padding:10px 16px;font:700 15px ' + FONT + ';background:#ffe3ee;color:#b0446f;cursor:pointer;box-shadow:0 3px 0 #f2bfd3;touch-action:manipulation';

// ---------------------------------------------------------------- minigames
// ctx: { S, C, p, scope, done(input), q(sel), pt(e), btn(text, fn, css), snd(n), say(t), draw(inner) }
const GAMES = {
  snijden(x) {
    const p = x.p, tgt = { dik: 46, middel: 30, dun: 18 }[p.size || 'middel'];
    const L = 50, R = 310;
    let ticks = '';
    for (let a = L; a <= L + tgt * 4; a += tgt) ticks += '<path d="M' + a + ' 120v12" stroke="#b0446f" stroke-width="2"/>';
    let em = '';
    for (let k = 0; k < 5; k++) em += '<text x="' + (66 + k * 52) + '" y="204" font-size="30">' + (p.em || '\u{1F955}') + '</text>';
    x.draw('<rect x="30" y="146" width="300" height="86" rx="12" fill="#e3b87f" stroke="#c99660" stroke-width="3"/><rect x="' + L + '" y="168" width="' + (R - L) + '" height="46" rx="10" fill="' + (p.col || '#f4a261') + '"/>' + em +
      ticks + '<text x="' + (L + tgt * 4 + 8) + '" y="130" font-size="12" fill="#b0446f" font-family="sans-serif">zo dik</text><g id="k_cuts"></g><text id="k_knife" x="318" y="150" font-size="30">\u{1F52A}</text>');
    const svg = x.q('svg'), cuts = [];
    const need = Math.max(2, Math.floor((R - L) / tgt) - 1);
    let sx = 0, sy = 0, down = false;
    const finish = () => {
      const b = [L].concat(cuts.slice().sort((a, c) => a - c), [R]);
      const w = []; for (let k = 1; k < b.length; k++) w.push(b[k] - b[k - 1]);
      const avg = w.reduce((a, c) => a + c, 0) / w.length;
      const sd = Math.sqrt(w.reduce((a, c) => a + (c - avg) * (c - avg), 0) / w.length);
      x.done({ ratio: avg / tgt, even: clamp(1 - sd / avg, 0, 1) });
    };
    x.scope.on(svg, 'pointerdown', (e) => { const a = x.pt(e); sx = a.x; sy = a.y; down = true; });
    x.scope.on(svg, 'pointerup', (e) => {
      if (!down) return; down = false;
      const a = x.pt(e);
      if (a.y - sy > 18 && Math.abs(a.x - sx) < 45 && sx > L + 4 && sx < R - 4 && cuts.every((c) => Math.abs(c - sx) > 4)) {
        cuts.push(sx); x.snd('tik');
        x.q('#k_cuts').innerHTML += '<path d="M' + sx + ' 160v62" stroke="#7a4a2a" stroke-width="3" stroke-linecap="round"/>';
        const kn2 = x.q('#k_knife'); if (kn2) { kn2.setAttribute('x', String(sx - 14)); kn2.setAttribute('y', '160'); }
        x.say(cuts.length + ' keer gesneden');
        if (cuts.length >= need) x.scope.after(finish, 350);
      }
    });
    x.btn('Klaar met snijden', () => { if (cuts.length >= 1) finish(); else x.say('Veeg eerst van boven naar beneden over de snijplank'); });
    x.say('Veeg van boven naar beneden om te snijden, zo dik als het streepje');
  },

  schillen(x) {
    const p = x.p, wash = p.mode === 'wassen', n = 5, t0 = nowMs();
    let g = '';
    for (let k = 0; k < n; k++) {
      const cx = 50 + k * 65;
      g += '<g id="k_i' + k + '"><text x="' + (cx - 20) + '" y="202" font-size="40">' + (p.em || '\u{1F954}') + '</text>' +
        '<circle id="k_s' + k + 'a" cx="' + (cx - 8) + '" cy="186" r="6" fill="#8a6a3a"/><circle id="k_s' + k + 'b" cx="' + (cx + 8) + '" cy="196" r="5" fill="#8a6a3a"/></g>';
    }
    x.draw(g + '<text x="150" y="130" font-size="34">' + (wash ? '\u{1F6BF}' : '\u{1F962}') + '</text>');
    const svg = x.q('svg'), hit = new Array(n).fill(0), need = 5;
    let down = false, finished = false;
    const upd = () => {
      let d = 0;
      for (let k = 0; k < n; k++) {
        const o = clamp(1 - hit[k] / need, 0, 1);
        ['a', 'b'].forEach((s) => { const el = x.q('#k_s' + k + s); if (el) el.setAttribute('opacity', String(o)); });
        if (hit[k] >= need) d++;
      }
      x.say((wash ? 'Gewassen: ' : 'Geschild: ') + d + ' van ' + n);
      if (d >= n && !finished) { finished = true; x.snd('plons'); x.scope.after(() => x.done({ done: n, total: n, secs: (nowMs() - t0) / 1000, par: 10 }), 450); }
    };
    const scrub = (e) => {
      const a = x.pt(e);
      for (let k = 0; k < n; k++) { if (Math.abs(a.x - (50 + k * 65)) < 34 && a.y > 150 && a.y < 225 && hit[k] < need) { hit[k] += 0.34; x.snd('tik'); } }
      upd();
    };
    x.scope.on(svg, 'pointerdown', (e) => { down = true; scrub(e); });
    x.scope.on(svg, 'pointermove', (e) => { if (down) scrub(e); });
    x.scope.on(svg, 'pointerup', () => { down = false; });
    x.scope.on(svg, 'pointerleave', () => { down = false; });
    x.say((wash ? 'Veeg of tik over alles om het schoon te wassen' : 'Veeg of tik over elk stuk om het te schillen'));
  },

  afwegen(x) {
    const p = x.p, tgt = p.target || 100, max = tgt * 2, stepV = Math.max(1, Math.round(tgt / 100));
    x.draw('<rect x="70" y="190" width="220" height="40" rx="14" fill="#cfd8dc" stroke="#aab6bb" stroke-width="3"/><path d="M110 160a70 70 0 0 1 140 0" fill="#fff" stroke="#aab6bb" stroke-width="4"/>' +
      '<path id="k_mark" d="M180 160" stroke="#2da44e" stroke-width="4"/><line id="k_nd" x1="180" y1="160" x2="110" y2="160" stroke="#b0446f" stroke-width="4" stroke-linecap="round"/><circle cx="180" cy="160" r="6" fill="#b0446f"/>' +
      '<text id="k_pile" x="156" y="130" font-size="34">' + (p.em || '\u{1F33E}') + '</text><text id="k_val" x="180" y="214" font-size="20" text-anchor="middle" fill="#5a4a6a" font-family="sans-serif" font-weight="700">0</text>');
    const ang = (v) => Math.PI * (1 - v / max);
    const tx = 180 + 62 * Math.cos(ang(tgt)), ty = 160 - 62 * Math.sin(ang(tgt));
    x.q('svg').insertAdjacentHTML && x.q('svg').insertAdjacentHTML('beforeend', '<circle cx="' + tx.toFixed(1) + '" cy="' + ty.toFixed(1) + '" r="6" fill="#2da44e"/><text x="' + (tx).toFixed(1) + '" y="' + (ty - 10).toFixed(1) + '" font-size="12" text-anchor="middle" fill="#2da44e" font-family="sans-serif">' + tgt + ' ' + (p.unit || 'g') + '</text>');
    let val = 0;
    const rng = document.createElement('input');
    rng.type = 'range'; rng.min = '0'; rng.max = String(max); rng.step = String(stepV); rng.value = '0';
    rng.style.cssText = 'width:80%;max-width:300px;accent-color:#b794e6';
    x.C.appendChild(rng);
    const upd = () => {
      const a = ang(val);
      const nd = x.q('#k_nd'); if (nd) { nd.setAttribute('x2', (180 + 62 * Math.cos(a)).toFixed(1)); nd.setAttribute('y2', (160 - 62 * Math.sin(a)).toFixed(1)); }
      const v = x.q('#k_val'); if (v) v.textContent = val + ' ' + (p.unit || 'g');
      const pi = x.q('#k_pile'); if (pi) pi.setAttribute('font-size', String(20 + Math.round(val / max * 40)));
    };
    x.scope.on(rng, 'input', () => { val = num(rng.value, 0); upd(); x.snd('tik'); });
    const bump = (d) => { val = clamp(val + d * stepV, 0, max); rng.value = String(val); upd(); x.snd('tik'); };
    x.btn('−', () => bump(-1), BTN2); x.btn('+', () => bump(1), BTN2);
    x.btn('Klaar', () => x.done({ amount: val, target: tgt }));
    upd();
    x.say('Schuif tot de wijzer op het groene bolletje staat: ' + tgt + ' ' + (p.unit || 'g'));
  },

  roeren(x) {
    const p = x.p, cx = 180, cy = 170, REV = 6;
    x.draw('<ellipse cx="180" cy="190" rx="118" ry="56" fill="#fff" stroke="#d9cfe6" stroke-width="4"/><ellipse cx="180" cy="184" rx="106" ry="46" fill="' + (p.col || '#f6d8a8') + '"/>' +
      '<g id="k_sw"><path d="M180 184m-60 0a60 28 0 0 1 120 0" fill="none" stroke="rgba(255,255,255,.65)" stroke-width="5" stroke-linecap="round"/><circle cx="130" cy="186" r="5" fill="rgba(255,255,255,.7)"/></g>' +
      '<circle cx="180" cy="184" r="62" fill="none" stroke="#b794e6" stroke-width="2" stroke-dasharray="5 6" opacity=".6"/><line id="k_sp" x1="180" y1="184" x2="180" y2="124" stroke="#b5835a" stroke-width="8" stroke-linecap="round"/><g id="k_spl"></g>');
    const svg = x.q('svg');
    let last = null, lastT = 0, good = 0, total = 0, prog = 0, splashes = 0, lastSplash = 0, down = false, sw = 0, finished = false;
    const bar = x.mkBar();
    x.scope.on(svg, 'pointerdown', (e) => { down = true; last = null; });
    x.scope.on(svg, 'pointerup', () => { down = false; last = null; });
    x.scope.on(svg, 'pointerleave', () => { down = false; last = null; });
    x.scope.on(svg, 'pointermove', (e) => {
      if (!down || finished) return;
      const a = x.pt(e), dx = a.x - cx, dy = (a.y - 184) * 1.7, r = Math.sqrt(dx * dx + dy * dy), th = Math.atan2(dy, dx), t = nowMs();
      const sp = x.q('#k_sp');
      if (sp) { sp.setAttribute('x2', String(clamp(a.x, 100, 260))); sp.setAttribute('y2', String(clamp(a.y, 130, 230))); }
      if (last !== null) {
        let d = th - last; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        const dt = Math.max(0.008, (t - lastT) / 1000), vel = Math.abs(d) / dt;
        if (Math.abs(d) > 0.02) {
          total++;
          const inBand = r > 25 && r < 120;
          if (vel > 15) {
            if (t - lastSplash > 600) {
              splashes++; lastSplash = t; x.snd('plons');
              x.q('#k_spl').innerHTML += '<text x="' + rnd(110, 250).toFixed(0) + '" y="' + rnd(130, 160).toFixed(0) + '" font-size="20">\u{1F4A6}</text>';
              x.scope.after(() => { const g = x.q('#k_spl'); if (g) g.innerHTML = ''; }, 700);
            }
            x.say('Pas op, te wild! Rustiger roeren');
          } else if (inBand && vel >= 2.5) { good++; prog += Math.abs(d) / (2 * Math.PI); x.say('Mooi tempo'); }
          else if (!inBand) x.say('Blijf in de ronde cirkel');
          else x.say('Een beetje sneller');
          sw += d * 57.3;
          const g = x.q('#k_sw'); if (g) g.setAttribute('transform', 'rotate(' + sw.toFixed(0) + ' 180 184)');
          bar(prog / REV);
          if (prog >= REV && !finished) { finished = true; x.snd('klaar'); x.scope.after(() => x.done({ even: total ? good / total : 0, splashes }), 300); }
        }
      }
      last = th; lastT = t;
    });
    x.say('Teken rondjes met je vinger of muis in de kom, niet te wild');
  },

  kloppen(x) {
    const p = x.p, NEED = 24, t0 = nowMs();
    x.draw('<ellipse cx="180" cy="190" rx="100" ry="44" fill="#fff" stroke="#d9cfe6" stroke-width="4"/><ellipse id="k_foam" cx="180" cy="190" rx="86" ry="30" fill="' + (p.col || '#fff3c4') + '"/>' +
      '<g id="k_wh"><line x1="180" y1="90" x2="180" y2="170" stroke="#b0b8c0" stroke-width="6" stroke-linecap="round"/><ellipse cx="180" cy="178" rx="14" ry="22" fill="none" stroke="#9aa5ae" stroke-width="4"/></g>' +
      '<rect x="36" y="110" width="110" height="40" rx="12" fill="#ffe3ee"/><text x="91" y="136" font-size="14" text-anchor="middle" fill="#b0446f" font-family="sans-serif">links</text>' +
      '<rect x="214" y="110" width="110" height="40" rx="12" fill="#e5f0ff"/><text x="269" y="136" font-size="14" text-anchor="middle" fill="#3b6bb0" font-family="sans-serif">rechts</text>');
    const svg = x.q('svg'), bar = x.mkBar(), iv = [];
    let beats = 0, lastSide = -1, down = false, tPrev = 0, finished = false;
    const hit = (side) => {
      if (finished || side === lastSide) return;
      lastSide = side; beats++; const t = nowMs();
      if (tPrev) iv.push(t - tPrev); tPrev = t;
      x.snd('tik');
      const wh = x.q('#k_wh'); if (wh) wh.setAttribute('transform', 'rotate(' + (side ? 14 : -14) + ' 180 90)');
      const f = x.q('#k_foam'); if (f) { f.setAttribute('ry', String(30 + Math.round(beats / NEED * 14))); f.setAttribute('cy', String(190 - Math.round(beats / NEED * 6))); }
      bar(beats / NEED);
      x.say(beats + ' van ' + NEED + ' klopjes');
      if (beats >= NEED) {
        finished = true; x.snd('klaar');
        const m = iv.reduce((a, c) => a + c, 0) / Math.max(1, iv.length);
        const sd = Math.sqrt(iv.reduce((a, c) => a + (c - m) * (c - m), 0) / Math.max(1, iv.length));
        x.scope.after(() => x.done({ secs: (nowMs() - t0) / 1000, par: 9, steady: clamp(1 - sd / Math.max(1, m), 0, 1) }), 300);
      }
    };
    x.scope.on(svg, 'pointerdown', (e) => { down = true; hit(x.pt(e).x < 180 ? 0 : 1); });
    x.scope.on(svg, 'pointermove', (e) => { if (down) hit(x.pt(e).x < 180 ? 0 : 1); });
    x.scope.on(svg, 'pointerup', () => { down = false; });
    x.say('Tik links en rechts om de beurt, of veeg heen en weer');
  },

  kneden(x) {
    const P = 0.9, NEED = 10, t0 = nowMs();
    x.draw('<rect x="40" y="150" width="280" height="84" rx="14" fill="#f3e6d3" stroke="#d9c3a3" stroke-width="3"/><circle id="k_ring" cx="180" cy="190" r="100" fill="none" stroke="#b794e6" stroke-width="4" opacity=".7"/>' +
      '<ellipse id="k_dough" cx="180" cy="196" rx="52" ry="30" fill="#f6e3b8" stroke="#e3c788" stroke-width="3"/><text x="180" y="118" font-size="30" text-anchor="middle">\u{1F44F}</text>');
    const svg = x.q('svg'), bar = x.mkBar(), errs = [];
    let presses = 0, finished = false;
    const phase = () => (((nowMs() - t0) / 1000) % P) / P;
    x.scope.every(() => {
      const ring = x.q('#k_ring'); if (ring) ring.setAttribute('r', String(Math.round(52 + 70 * (1 - phase()))));
    }, 33);
    x.scope.on(svg, 'pointerdown', () => {
      if (finished) return;
      const ph = phase(), err = Math.min(ph, 1 - ph);
      errs.push(err); presses++; x.snd('tik');
      const d = x.q('#k_dough'); if (d) { d.setAttribute('ry', '20'); d.setAttribute('rx', '60'); x.scope.after(() => { d.setAttribute('ry', '30'); d.setAttribute('rx', '52'); }, 120); }
      x.say(err < 0.1 ? 'Mooi op de maat!' : err < 0.22 ? 'Bijna op de maat' : 'Wacht tot de ring het deeg raakt');
      bar(presses / NEED);
      if (presses >= NEED) { finished = true; x.snd('klaar'); x.scope.after(() => x.done({ avgErr: errs.reduce((a, c) => a + c, 0) / errs.length }), 350); }
    });
    x.say('Druk op het deeg als de ring het deeg raakt: ' + NEED + ' keer');
  },

  bakken(x) {
    const p = x.p, rate = p.rate || 1, food = p.food || 'deeg';
    x.draw('<rect x="40" y="206" width="280" height="30" rx="8" fill="#6b6f78"/><circle cx="90" cy="221" r="9" fill="#444"/><circle cx="270" cy="221" r="9" fill="#444"/>' +
      '<ellipse cx="180" cy="214" rx="96" ry="18" fill="#3b3f46"/><g id="k_fl"></g><ellipse cx="180" cy="196" rx="92" ry="26" fill="#555a63"/><ellipse cx="180" cy="190" rx="80" ry="20" fill="#6b717b"/>' +
      '<ellipse id="k_food" cx="180" cy="188" rx="56" ry="14" fill="' + foodColor(food, 0) + '"/><text id="k_sm" x="170" y="130" font-size="32" opacity="0">\u{1F4A8}</text>' +
      '<rect x="280" y="90" width="22" height="100" rx="11" fill="#fff" stroke="#aab6bb" stroke-width="3"/><rect id="k_th" x="285" y="185" width="12" height="2" rx="5" fill="#e0472f"/>' +
      '<text id="k_deg" x="291" y="84" font-size="13" text-anchor="middle" fill="#5a4a6a" font-family="sans-serif">20°</text>');
    let heat = 0, eff = 0, e = 0, e2 = 0, side = 0, finished = false, sizz = 0;
    const lab = document.createElement('div');
    lab.style.cssText = 'width:100%;text-align:center;font-weight:700;color:#7a5f8f;min-height:22px';
    x.C.appendChild(lab);
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;justify-content:center;width:100%';
    x.C.appendChild(row);
    const hb = [];
    for (let k = 0; k <= 5; k++) {
      const b = document.createElement('button'); b.style.cssText = BTN2 + ';padding:8px 12px'; b.textContent = k === 0 ? 'Uit' : '\u{1F525}'.repeat(Math.min(k, 3)) + (k > 3 ? k : '');
      b.textContent = k === 0 ? 'Uit' : '\u{1F525}' + k; row.appendChild(b); hb.push(b);
      x.scope.on(b, 'click', () => { heat = k; hb.forEach((o, j) => { o.style.background = j === k ? '#ffb84d' : '#ffe3ee'; }); x.snd('tik'); });
    }
    hb[0].style.background = '#ffb84d';
    const end = () => {
      if (finished) return; finished = true; x.snd('klaar');
      x.done(p.flip ? { e, e2 } : { e });
    };
    if (p.flip) x.btn('Draai om \u{1F504}', () => { if (side === 0) { side = 1; x.snd('plons'); x.say('Omgedraaid! Nu de andere kant'); } }, BTN2);
    x.btn('Haal van het vuur ✅', end);
    x.scope.every((dt) => {
      if (finished) return;
      eff += (heat - eff) * Math.min(1, dt * 1.2);
      if (side === 0) e += eff * rate * dt; else e2 += eff * rate * dt;
      const cur = side === 0 ? e : e2;
      const f = x.q('#k_food'); if (f) f.setAttribute('fill', foodColor(food, cur));
      const th = x.q('#k_th'); const tmp = 20 + eff * 45;
      if (th) { const h = Math.round((tmp - 20) / 225 * 94) + 2; th.setAttribute('height', String(h)); th.setAttribute('y', String(187 - h)); }
      const dg = x.q('#k_deg'); if (dg) dg.textContent = Math.round(tmp) + '°C';
      const fl = x.q('#k_fl'); if (fl) { let s = ''; const n = Math.round(eff * 1.6); for (let k = 0; k < n; k++) s += '<text x="' + (112 + k * 20) + '" y="228" font-size="22">\u{1F525}</text>'; fl.innerHTML = s; }
      const sm = x.q('#k_sm'); if (sm) sm.setAttribute('opacity', cur > 85 ? '1' : '0');
      const st = stateFromEnergy(cur);
      lab.textContent = (p.flip ? (side === 0 ? 'Kant 1: ' : 'Kant 2: ') : '') + (st === 'rauw' ? 'Nog rauw' : st === 'gaar' ? 'Mooi gaar!' : st === 'bruin' ? 'Wordt bruin' : 'Pas op, aangebrand!');
      sizz += dt; if (sizz > 1.5 && eff > 0.5) { sizz = 0; x.snd('koken'); }
      if (cur >= 130) { x.say('Oeps, dat is te lang! Van het vuur af'); end(); }
    }, 50);
    x.say(p.flip ? 'Kies de hitte, draai om en haal het op tijd van het vuur' : 'Kies de hitte en haal het op tijd van het vuur');
  },

  koken(x) {
    const p = x.p, DUR = p.secs || 24;
    x.draw('<rect x="60" y="200" width="240" height="30" rx="8" fill="#6b6f78"/><rect x="80" y="130" width="200" height="86" rx="14" fill="#9aa2ad" stroke="#7d8591" stroke-width="4"/><rect x="62" y="150" width="20" height="10" rx="5" fill="#7d8591"/><rect x="278" y="150" width="20" height="10" rx="5" fill="#7d8591"/>' +
      '<rect x="90" y="140" width="180" height="62" rx="8" fill="' + (p.col || '#f4a58a') + '"/><g id="k_bub"></g><rect id="k_foam" x="90" y="140" width="180" height="2" fill="#fff" opacity=".8"/><g id="k_fl"></g>' +
      '<text id="k_st" x="180" y="98" font-size="20" text-anchor="middle" fill="#5a4a6a" font-family="sans-serif" font-weight="700"></text>');
    let heat = 0, T = 20, foam = 0, good = 0, total = 0, overs = 0, tm = 0, finished = false, snd = 0;
    const bar = x.mkBar();
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;justify-content:center;width:100%';
    x.C.appendChild(row);
    const hb = [];
    for (let k = 0; k <= 5; k++) {
      const b = document.createElement('button'); b.style.cssText = BTN2 + ';padding:8px 12px'; b.textContent = k === 0 ? 'Uit' : '\u{1F525}' + k; row.appendChild(b); hb.push(b);
      x.scope.on(b, 'click', () => { heat = k; hb.forEach((o, j) => { o.style.background = j === k ? '#ffb84d' : '#ffe3ee'; }); x.snd('tik'); });
    }
    hb[0].style.background = '#ffb84d';
    x.scope.every((dt) => {
      if (finished) return;
      tm += dt;
      T += (heat * 21 - T) * Math.min(1, dt * 0.45);
      total += dt;
      let msg;
      if (T < 52) msg = 'Nog te koud, zet de hitte hoger';
      else if (T <= 83) { good += dt; msg = 'Zachtjes borrelend, precies goed'; }
      else msg = 'Het kookt hard, zet de hitte lager';
      if (T > 84) foam += (T - 82) * dt * 6; else foam -= dt * 18;
      foam = clamp(foam, 0, 100);
      if (foam >= 100) { overs++; foam = 35; x.snd('fout'); x.say('Oeps, het kookte over'); msg = 'Oeps, overgekookt'; }
      const fe = x.q('#k_foam'); if (fe) { fe.setAttribute('y', String(140 - Math.round(foam * 0.16))); fe.setAttribute('height', String(2 + Math.round(foam * 0.16))); }
      const bu = x.q('#k_bub');
      if (bu) { let s = ''; const n = Math.round(clamp((T - 40) / 8, 0, 8)); for (let k = 0; k < n; k++) s += '<circle cx="' + rnd(100, 260).toFixed(0) + '" cy="' + rnd(150, 195).toFixed(0) + '" r="' + rnd(3, 7).toFixed(1) + '" fill="#fff" opacity=".6"/>'; bu.innerHTML = s; }
      const fl = x.q('#k_fl'); if (fl) { let s = ''; const n = Math.round(heat * 1.4); for (let k = 0; k < n; k++) s += '<text x="' + (100 + k * 24) + '" y="226" font-size="22">\u{1F525}</text>'; fl.innerHTML = s; }
      const st = x.q('#k_st'); if (st) st.textContent = Math.round(20 + T * 0.8) + '°C · ' + msg;
      snd += dt; if (snd > 1.3 && T > 50) { snd = 0; x.snd('koken'); }
      bar(tm / DUR);
      if (tm >= DUR) { finished = true; x.snd('klaar'); x.done({ good, total, overs }); }
    }, 100);
    x.say('Houd de pan zachtjes borrelend, niet te koud en niet te wild');
  },

  oven(x) {
    const p = x.p, tTemp = p.tTemp || 180, tMin = p.tMin || 30, food = p.food || 'cake';
    let temp = 180, mins = 30, running = false, finished = false, elapsed = 0, peek = 0, tk = 0;
    x.draw('<rect x="70" y="40" width="220" height="190" rx="18" fill="#c9ced6" stroke="#9aa2ad" stroke-width="4"/><rect x="92" y="90" width="176" height="110" rx="12" fill="#2f3338" stroke="#6b717b" stroke-width="4"/>' +
      '<rect id="k_glow" x="100" y="98" width="160" height="94" rx="8" fill="#ff9d3a" opacity="0"/><ellipse id="k_food" cx="180" cy="168" rx="46" ry="18" fill="' + foodColor(food, 0) + '"/>' +
      '<circle cx="110" cy="64" r="10" fill="#6b717b"/><circle cx="250" cy="64" r="10" fill="#6b717b"/><rect x="150" y="54" width="60" height="22" rx="6" fill="#222"/>' +
      '<text id="k_disp" x="180" y="71" font-size="15" text-anchor="middle" fill="#7dff9c" font-family="monospace">180° 30:00</text><text id="k_pk" x="180" y="232" font-size="14" text-anchor="middle" fill="#5a4a6a" font-family="sans-serif" font-weight="700"></text>');
    const disp = () => { const d = x.q('#k_disp'); const left = Math.max(0, mins - elapsed); if (d) d.textContent = temp + '° ' + ('0' + Math.floor(left)).slice(-2) + ':' + ('0' + Math.floor((left % 1) * 60)).slice(-2); };
    const mk2 = (label, min, max, st, init, fmt, set) => {
      const w = document.createElement('label'); w.style.cssText = 'display:flex;align-items:center;gap:8px;font-weight:700;color:#7a5f8f;font-size:14px';
      const t = document.createElement('span'); t.textContent = label; const r = document.createElement('input');
      r.type = 'range'; r.min = String(min); r.max = String(max); r.step = String(st); r.value = String(init); r.style.cssText = 'width:150px;accent-color:#b794e6';
      const v = document.createElement('span'); v.textContent = fmt(init); v.style.minWidth = '60px';
      w.appendChild(t); w.appendChild(r); w.appendChild(v); x.C.appendChild(w);
      x.scope.on(r, 'input', () => { const nv = num(r.value, init); set(nv); v.textContent = fmt(nv); disp(); x.snd('tik'); });
      return w;
    };
    const w1 = mk2('Temperatuur', 120, 240, 10, 180, (v) => v + ' °C', (v) => { temp = v; });
    const w2 = mk2('Tijd', 5, 60, 5, 30, (v) => v + ' min', (v) => { mins = v; });
    const finish = () => { if (finished) return; finished = true; x.snd('klaar'); x.done({ temp, minutes: elapsed, tTemp, tMin }); };
    let startB = null, peekB = null, outB = null;
    startB = x.btn('Start de oven \u{1F525}', () => {
      running = true; w1.style.display = 'none'; w2.style.display = 'none'; startB.style.display = 'none';
      peekB.style.display = ''; outB.style.display = ''; x.snd('koken'); x.say('De oven staat aan. Kijk gerust, maar open de deur niet te vaak');
    });
    peekB = x.btn('Kijken \u{1F440}', () => { peek = 3; });
    outB = x.btn('Eruit halen \u{1F9E4}', finish, BTN2);
    peekB.style.display = 'none'; outB.style.display = 'none';
    x.scope.every((dt) => {
      if (!running || finished) return;
      elapsed += dt * 2; tk += dt;
      const d = (temp * elapsed) / (tTemp * tMin);
      const f = x.q('#k_food'); if (f) f.setAttribute('fill', foodColor(food, 47 * d));
      const gl = x.q('#k_glow'); if (gl) gl.setAttribute('opacity', String(0.25 + 0.15 * Math.sin(elapsed)));
      if (tk >= 1) { tk = 0; x.snd('tik'); }
      if (peek > 0) {
        peek -= dt;
        const pk = x.q('#k_pk');
        if (pk) pk.textContent = d < 0.5 ? 'Nog helemaal rauw' : d < 0.85 ? 'Bijna klaar, nog even' : d <= 1.15 ? 'Mooi goudbruin!' : d < 1.4 ? 'Wordt al donker' : 'Pas op, te droog!';
        if (peek <= 0 && pk) pk.textContent = '';
      }
      disp();
      if (elapsed >= mins) finish();
    }, 50);
    x.say('Kies temperatuur en tijd (1 seconde = 2 minuten) en start de oven');
  },

  kruiden(x) {
    const p = x.p, tgt = p.target || 3;
    x.draw('<ellipse cx="180" cy="214" rx="100" ry="20" fill="#555a63"/><ellipse cx="180" cy="206" rx="88" ry="14" fill="#f0d9a8"/><g id="k_gr"></g>' +
      '<g id="k_sh"><rect x="150" y="70" width="60" height="64" rx="14" fill="#e5f0ff" stroke="#a8c4ee" stroke-width="3"/><text x="180" y="116" font-size="32" text-anchor="middle">' + (p.em || '\u{1F9C2}') + '</text></g>');
    const svg = x.q('svg');
    let amt = 0, moved = 0, lx = null, down = false, tasting = '';
    const face = document.createElement('div');
    face.style.cssText = 'min-height:64px;display:flex;align-items:center;gap:8px;font-weight:700;color:#7a5f8f';
    x.C.appendChild(face);
    const add = () => {
      amt++; x.snd('tik');
      const g = x.q('#k_gr'); if (g) g.innerHTML += '<circle cx="' + rnd(120, 240).toFixed(0) + '" cy="' + rnd(200, 210).toFixed(0) + '" r="2.4" fill="#5a8f3a"/>';
      const sh = x.q('#k_sh'); if (sh) { sh.setAttribute('transform', 'rotate(' + (amt % 2 ? 22 : -22) + ' 180 134)'); x.scope.after(() => sh.setAttribute('transform', 'rotate(0 180 134)'), 140); }
    };
    x.scope.on(svg, 'pointerdown', (e) => { down = true; lx = x.pt(e); add(); });
    x.scope.on(svg, 'pointermove', (e) => { if (!down) return; const a = x.pt(e); moved += Math.abs(a.x - lx.x) + Math.abs(a.y - lx.y); lx = a; if (moved > 90) { moved = 0; add(); } });
    x.scope.on(svg, 'pointerup', () => { down = false; });
    x.btn('Proeven \u{1F445}', () => {
      const d = amt - tgt;
      const mood = d === 0 ? 'happy' : 'sad';
      const em = d <= -2 ? '\u{1F636}' : d === -1 ? '\u{1F615}' : d === 0 ? '\u{1F60B}' : d === 1 ? '\u{1F632}' : '\u{1F975}';
      const tx = d <= -2 ? 'Veel te weinig' : d === -1 ? 'Een beetje te weinig' : d === 0 ? 'Precies goed!' : d === 1 ? 'Een beetje te veel' : 'Veel te veel';
      face.innerHTML = '<span style="font-size:44px">' + em + '</span><span>' + tx + '</span>';
      x.snd(d === 0 ? 'eten' : 'tik');
      tasting = tx; x.say('Het huisdier proeft: ' + tx);
      void mood;
    }, BTN2);
    x.btn('Klaar', () => x.done({ amount: amt, target: tgt }));
    x.say('Tik of schud om te kruiden en laat het huisdier proeven');
  },

  opmaken(x) {
    const tops = (x.p.tops && x.p.tops.length ? x.p.tops : ['\u{1F33F}', '\u{1F345}']).slice(0, 6), n = tops.length;
    const slot = (k) => ({ x: 180 + (k - (n - 1) / 2) * Math.min(50, 280 / n), y: 268 });
    let g = '<ellipse cx="180" cy="196" rx="124" ry="38" fill="rgba(0,0,0,.06)"/><circle cx="180" cy="150" r="92" fill="#fff" stroke="#e1d8ee" stroke-width="4"/><circle cx="180" cy="150" r="72" fill="#f9f6fc" stroke="#eee7f6" stroke-width="2"/>' +
      '<text x="180" y="156" font-size="44" text-anchor="middle" opacity=".35">\u{1F37D}️</text>';
    tops.forEach((t, k) => { const s = slot(k); g += '<text id="k_t' + k + '" x="' + s.x + '" y="' + s.y + '" font-size="34" text-anchor="middle">' + t + '</text>'; });
    x.draw(g);
    const svg = x.q('svg'), placed = new Array(n).fill(null);
    let cur = -1, finished = false;
    const fin = () => {
      if (finished) return; finished = true;
      const ps = placed.filter(Boolean);
      let spread = 0.5;
      if (ps.length >= 2) {
        let s = 0;
        ps.forEach((a, i) => { let m = 1e9; ps.forEach((b, j) => { if (i !== j) m = Math.min(m, Math.hypot(a.x - b.x, a.y - b.y)); }); s += m; });
        spread = clamp(s / ps.length / 46, 0, 1);
      }
      x.snd('klaar'); x.done({ placed: ps.length, total: n, spread });
    };
    x.scope.on(svg, 'pointerdown', (e) => {
      const a = x.pt(e); let best = -1, bd = 36;
      for (let k = 0; k < n; k++) { if (placed[k]) continue; const s = slot(k), d = Math.hypot(a.x - s.x, a.y - s.y + 12); if (d < bd) { bd = d; best = k; } }
      cur = best;
    });
    x.scope.on(svg, 'pointermove', (e) => {
      if (cur < 0) return; const a = x.pt(e), el = x.q('#k_t' + cur);
      if (el) { el.setAttribute('x', String(a.x)); el.setAttribute('y', String(a.y + 10)); }
    });
    const up = (e) => {
      if (cur < 0) return; const a = x.pt(e), el = x.q('#k_t' + cur);
      if (Math.hypot(a.x - 180, a.y - 150) < 78) {
        placed[cur] = { x: a.x, y: a.y }; x.snd('plons');
        if (el) { el.setAttribute('x', String(a.x)); el.setAttribute('y', String(a.y + 10)); }
        const c2 = placed.filter(Boolean).length; x.say(c2 + ' van ' + n + ' op het bord');
        if (c2 >= n) x.scope.after(fin, 500);
      } else if (el) { const s = slot(cur); el.setAttribute('x', String(s.x)); el.setAttribute('y', String(s.y)); }
      cur = -1;
    };
    x.scope.on(svg, 'pointerup', up);
    x.scope.on(svg, 'pointerleave', up);
    x.btn('Klaar', () => { if (placed.some(Boolean)) fin(); else x.say('Sleep eerst iets op het bord'); }, BTN2);
    x.say('Sleep de toppings op het bord en verdeel ze mooi');
  },
};
GAMES.wassen = GAMES.schillen;
export const STEP_IMPLS = Object.keys(GAMES);

// ---------------------------------------------------------------- hoofdmodule
function loadBook(api) {
  try {
    let o = api && typeof api.loadExtra === 'function' ? api.loadExtra('kook') : null;
    if (typeof o === 'string') o = JSON.parse(o);
    if (o && typeof o === 'object' && o.r && typeof o.r === 'object') return o;
  } catch (e) {}
  return { r: {} };
}
function saveBook(api, book) {
  try {
    if (!api || typeof api.saveExtra !== 'function') return;
    const keys = () => Object.keys(book.r);
    while (JSON.stringify(book).length > 1200 && keys().length) {
      const k = keys().sort((a, b) => book.r[a][1] - book.r[b][1])[0]; delete book.r[k];
    }
    api.saveExtra('kook', book);
  } catch (e) {}
}

export function createCooking(host, api) {
  api = api || {};
  const scope = makeScope();         // hele module
  let view = null;                   // scope per scherm
  let stepScope = null;
  let dead = false, tab = 'koken', book = loadBook(api);
  const W = api.w || host.clientWidth || 360, H = api.h || host.clientHeight || 520;
  const snd = (n) => { try { api.sound && api.sound(n); } catch (e) {} };
  const toast = (m) => { try { api.toast && api.toast(m); } catch (e) {} };
  const petHtml = (s, mood) => { try { if (api.pet && typeof api.pet.html === 'function') return api.pet.html(s, mood); } catch (e) {} return '<span style="font-size:' + Math.round(s * 0.8) + 'px">\u{1F43E}</span>'; };

  try { host.style.touchAction = 'manipulation'; host.style.background = '#fff8fc'; } catch (e) {}
  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;overflow:hidden;font-family:' + FONT + ';color:#5a4a6a;background:#fff8fc;display:flex;flex-direction:column;-webkit-user-select:none;user-select:none';
  const style = document.createElement('style');
  style.textContent = '@keyframes kpop{0%{transform:scale(.5);opacity:0}100%{transform:scale(1);opacity:1}}@keyframes kbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}.kpop{animation:kpop .45s ease-out both}.kbob{animation:kbob 1.2s ease-in-out infinite}';
  root.appendChild(style);
  host.appendChild(root);

  const mk = (parent, css, html) => { const d = document.createElement('div'); d.style.cssText = css || ''; if (html != null) d.innerHTML = html; (parent || root).appendChild(d); return d; };
  const mkBtn = (parent, text, fn, css, sc) => {
    const b = document.createElement('button'); b.style.cssText = css || BTN; b.textContent = text; parent.appendChild(b);
    (sc || view || scope).on(b, 'click', fn); return b;
  };
  function resetView() {
    if (stepScope) { stepScope.end(); stepScope = null; }
    if (view) view.end();
    view = makeScope();
    while (root.children && root.children.length > 1 && root.lastChild) root.removeChild(root.lastChild);
  }

  // ---- menu en kookboek
  function header() {
    const bar = mk(root, 'display:flex;gap:8px;padding:10px 12px 6px;align-items:center;flex:none');
    const t1 = mkBtn(bar, '\u{1F373} Koken', () => { tab = 'koken'; showMenu(); }, tab === 'koken' ? BTN : BTN2);
    const t2 = mkBtn(bar, '\u{1F4D6} Kookboek', () => { tab = 'boek'; showMenu(); }, tab === 'boek' ? BTN : BTN2);
    void t1; void t2;
    mk(bar, 'margin-left:auto;font-size:13px;color:#9a86ad', 'Niveau ' + (api.level || 1));
  }
  function showMenu() {
    if (dead) return;
    resetView(); header();
    const body = mk(root, 'flex:1;overflow:auto;padding:4px 12px 16px;-webkit-overflow-scrolling:touch');
    if (tab === 'boek') return renderBook(body);
    const inv = (api.getInventory && api.getInventory()) || {};
    let html = '';
    RECIPES.forEach((r) => {
      const locked = (api.level || 1) < r.minLevel, ok = canCook(r, inv) && !locked;
      let chips = '';
      Object.keys(r.ingredients).forEach((id) => {
        const need = r.ingredients[id], have = num(inv[id], 0), i = ING[id] || { emoji: '?', name: id };
        chips += '<span style="display:inline-block;margin:2px 3px 0 0;padding:3px 8px;border-radius:999px;font-size:12px;font-weight:700;background:' + (have >= need ? '#d8f5d0;color:#2d7a2d' : '#ffd9d9;color:#b03030') + '">' + i.emoji + ' ' + i.name + ' ' + Math.min(have, need) + '/' + need + (have < need ? ' (mist)' : '') + '</span>';
      });
      html += '<div style="background:#fff;border-radius:18px;padding:12px;margin-top:10px;box-shadow:0 2px 8px rgba(150,120,190,.15);' + (locked ? 'opacity:.6' : '') + '">' +
        '<div style="display:flex;align-items:center;gap:10px"><span style="font-size:34px">' + r.emoji + '</span><div style="flex:1"><div style="font-weight:800;font-size:16px">' + r.name + '</div>' +
        '<div style="font-size:12px;color:#9a86ad">' + starStr(diffOf(r)) + ' · ' + r.steps.length + ' stappen' + (locked ? ' · vanaf niveau ' + r.minLevel : '') + '</div></div></div>' +
        '<div style="font-size:13px;margin:6px 0 2px">' + r.desc + '</div><div>' + chips + '</div>' +
        '<button data-r="' + r.id + '" ' + (ok ? '' : 'disabled') + ' style="' + (ok ? BTN : BTN + ';opacity:.45;cursor:default') + ';margin-top:8px">' + (locked ? 'Nog op slot' : ok ? 'Begin met koken' : 'Je mist nog iets') + '</button></div>';
    });
    body.innerHTML = html;
    view.on(body, 'click', (e) => {
      let t = e && e.target; const id = t && t.getAttribute && t.getAttribute('data-r');
      if (id && !(t.disabled)) { const r = RECIPES.find((q) => q.id === id); if (r) startCook(r); }
    });
  }
  function renderBook(body) {
    const made = RECIPES.filter((r) => book.r[r.id]);
    let html = '<div style="text-align:center;margin:8px 0;font-weight:700;color:#7a5f8f">Je kookboek: ' + made.length + ' van ' + RECIPES.length + ' recepten</div>';
    if (!made.length) html += '<div style="text-align:center;padding:30px 10px;color:#9a86ad"><div style="font-size:44px">\u{1F4D6}</div>Nog leeg. Kook je eerste gerecht, dan komt het hier te staan!</div>';
    made.forEach((r) => {
      const b = book.r[r.id];
      html += '<div style="display:flex;align-items:center;gap:10px;background:#fff;border-radius:18px;padding:8px 12px;margin-top:8px;box-shadow:0 2px 8px rgba(150,120,190,.15)">' + dishSvg(r, [0, 35, 65, 92][b[0]] || 60, 56) +
        '<div style="flex:1"><div style="font-weight:800">' + r.emoji + ' ' + r.name + '</div><div style="font-size:13px;color:#9a86ad">Beste: ' + starStr(b[0]) + '</div></div><div style="font-size:13px;font-weight:700;color:#7a5f8f">' + b[1] + '× gemaakt</div></div>';
    });
    body.innerHTML = html;
  }

  // ---- koken
  let run = null;
  function startCook(recipe) {
    const inv = (api.getInventory && api.getInventory()) || {};
    if (!canCook(recipe, inv)) { toast('Je mist nog ingrediënten'); showMenu(); return; }
    let ok = true;
    try { ok = api.consume ? api.consume(Object.assign({}, recipe.ingredients)) : true; } catch (e) { ok = false; }
    if (ok === false) { toast('Dat lukte niet, probeer het zo nog eens'); showMenu(); return; }
    run = { r: recipe, i: 0, scores: [] };
    snd('koken');
    showStep();
  }
  function showStep() {
    if (dead) return;
    resetView();
    const r = run.r, st = r.steps[run.i];
    const top = mk(root, 'display:flex;align-items:center;gap:8px;padding:8px 12px;flex:none');
    mk(top, 'font-size:28px', r.emoji);
    const tt = mk(top, 'flex:1;min-width:0');
    mk(tt, 'font-weight:800;font-size:15px', r.name);
    const dots = mk(tt, 'font-size:12px;color:#9a86ad;margin-top:2px', '');
    let ds = ''; for (let k = 0; k < r.steps.length; k++) ds += k < run.i ? '● ' : k === run.i ? '◉ ' : '○ ';
    dots.textContent = 'Stap ' + (run.i + 1) + ' van ' + r.steps.length + '   ' + ds;
    mk(top, 'width:54px;height:54px;flex:none', petHtml(54, 'happy'));
    mk(root, 'padding:0 14px 4px;font-weight:800;color:#8a63b5;font-size:16px;flex:none', st.text);
    const hint = mk(root, 'padding:0 14px 4px;font-size:13px;color:#9a86ad;min-height:18px;flex:none', '');
    const S = mk(root, 'flex:none;width:100%;touch-action:none;position:relative');
    const C = mk(root, 'flex:1;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center;align-content:flex-start;padding:10px 12px;overflow:auto');
    stepScope = makeScope();
    const sc = stepScope;
    let finished = false;
    const ctx = {
      S, C, p: st, scope: sc,
      q: (sel) => S.querySelector(sel),
      draw: (inner) => { S.innerHTML = '<svg viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-height:46vh;display:block;touch-action:none">' + KBG + inner + '</svg>'; },
      pt: (e) => {
        const svg = S.querySelector('svg'); let b = null;
        try { b = svg.getBoundingClientRect(); } catch (er) {}
        if (!b || !b.width) return { x: num(e.clientX, 0), y: num(e.clientY, 0) };
        return { x: (e.clientX - b.left) * 360 / b.width, y: (e.clientY - b.top) * 300 / b.height };
      },
      btn: (text, fn, css) => mkBtn(C, text, fn, css, sc),
      snd, say: (t) => { hint.textContent = t; },
      mkBar: () => {
        const bar = mk(C, 'width:80%;max-width:300px;height:10px;border-radius:6px;background:#eadff6;overflow:hidden;flex:none;order:-1');
        const f = mk(bar, 'height:100%;width:0%;background:#b794e6;border-radius:6px;transition:width .15s');
        return (v) => { f.style.width = Math.round(clamp(v, 0, 1) * 100) + '%'; };
      },
      done: (input) => {
        if (finished || dead) return; finished = true;
        const score = scoreStep(st.t, input);
        sc.after(() => stepResult(st, input, score), 80);
      },
    };
    try { GAMES[st.t](ctx); } catch (e) { toast('Oeps, even opnieuw proberen'); ctx.done({}); }
  }
  function stepResult(st, input, score) {
    if (dead) return;
    run.scores.push(score);
    const tip = tipFor(st.t, input, score), n = stepStars(score);
    resetView();
    const box = mk(root, 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px');
    mk(box, 'width:90px;height:90px', petHtml(90, score >= 50 ? 'happy' : 'sad')).className = 'kpop';
    mk(box, 'font-size:30px;margin-top:8px', starStr(n));
    mk(box, 'font-size:18px;font-weight:800;color:#8a63b5;margin-top:6px', tip);
    mk(box, 'font-size:13px;color:#9a86ad;margin-top:4px', 'Stap ' + (run.i + 1) + ': ' + score + ' van 100');
    snd(score >= 50 ? 'klaar' : 'tik');
    const last = run.i + 1 >= run.r.steps.length;
    mkBtn(box, last ? 'Bekijk je gerecht' : 'Volgende stap', () => { run.i++; if (last) finishDish(); else showStep(); }, BTN + ';margin-top:14px');
  }
  function finishDish() {
    resetView();
    const r = run.r, scores = run.scores, avg = averageScore(scores), failed = isFailed(scores), stars = starsFromScores(scores);
    const box = mk(root, 'flex:1;overflow:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:16px');
    if (failed) {
      mk(box, 'font-size:46px', '\u{1F605}');
      mk(box, 'font-size:22px;font-weight:800;color:#8a63b5', 'Oeps, probeer opnieuw!');
      mk(box, 'font-size:14px;color:#7a5f8f;margin:8px 20px', 'Dit gerecht is niet gelukt, maar oefening baart kunst. Hier is een troostprijsje.');
      try { api.award && api.award({ xp: 3, coins: 1, happy: 2, bond: 0 }); } catch (e) {}
      toast('Oeps, probeer opnieuw! Troostprijsje: 3 xp');
      snd('fout');
    } else {
      const mult = { 1: 0.7, 2: 1, 3: 1.4 }[stars];
      const b = r.base || {};
      const dish = { recipeId: r.id, name: r.name, emoji: r.emoji, stars, hunger: Math.round(num(b.hunger, 10) * mult), happy: Math.round(num(b.happy, 5) * mult), energy: Math.round(num(b.energy, 5) * mult), health: Math.round(num(b.health, 2) * mult), quality: avg };
      const xp = clamp(Math.round((8 + r.minLevel * 1.6 + r.steps.length * 2) * { 1: 0.7, 2: 1, 3: 1.3 }[stars]), 8, 40);
      try { api.addDish && api.addDish(dish); } catch (e) {}
      try { api.award && api.award({ xp, coins: stars === 3 ? 5 : stars === 2 ? 2 : 1, happy: 3 + stars * 2, bond: stars === 3 ? 2 : stars === 2 ? 1 : 0 }); } catch (e) {}
      const old = book.r[r.id];
      book.r[r.id] = [Math.max(old ? old[0] : 0, stars), (old ? old[1] : 0) + 1];
      saveBook(api, book);
      mk(box, 'width:170px;height:170px', dishSvg(r, avg, 170)).className = 'kpop';
      mk(box, 'font-size:34px;margin-top:4px', starStr(stars));
      mk(box, 'font-size:20px;font-weight:800;color:#8a63b5', r.emoji + ' ' + r.name);
      mk(box, 'font-size:14px;color:#7a5f8f;margin:6px 16px', stars === 3 ? 'Wat een meesterlijk gerecht! Het huisdier danst van blijdschap.' : stars === 2 ? 'Lekker gelukt! Het ziet er heerlijk uit.' : 'Gelukt! Volgende keer nog lekkerder.');
      mk(box, 'width:60px;height:60px', petHtml(60, 'happy')).className = 'kbob';
      mk(box, 'font-size:13px;color:#9a86ad', 'Kwaliteit ' + avg + ' · +' + xp + ' xp · het gerecht staat in je voorraad');
      snd('klaar'); snd('munt');
    }
    const row = mk(box, 'display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;justify-content:center');
    mkBtn(row, 'Nog een gerecht', () => { tab = 'koken'; showMenu(); }, BTN);
    mkBtn(row, 'Kookboek', () => { tab = 'boek'; showMenu(); }, BTN2);
    run = null;
  }

  showMenu();
  return {
    destroy() {
      if (dead) return; dead = true;
      if (stepScope) stepScope.end();
      if (view) view.end();
      scope.end();
      try { if (root.parentNode) root.parentNode.removeChild(root); } catch (e) {}
    },
  };
}
