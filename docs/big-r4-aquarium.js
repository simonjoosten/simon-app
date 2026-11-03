// Ronde 4 - Aquarium Tycoon: seizoenen, evenementen, prestaties, dagopdrachten en Legende-rang.
import { mount } from './big-r4-core.js?v=1';

const n = (v) => Math.floor(v).toLocaleString('nl-NL');
export const CONFIG = {
  game: 'aquarium', name: 'Aquarium', cur: 'munten', minGift: 30,
  flavor: {
    halloween: 'Spookweek in het aquarium: de lichtkwallen gloeien extra eng. Zet het Pompoenhuisje in een tank!',
    sint: 'Pepernoten voor de vissen? Liever niet. Maar bezoekers komen wel kijken.',
    kerst: 'Zet een Kerstboom in de tank en kijk naar de lichtjes in het water.',
    zomer: 'Vakantiedrukte! De ijskraam en het café draaien volop.',
    koning: 'Een oranje vis zwemt trots rond. Oranje boven!',
    voorjaar: 'Het voorjaar brengt jonge vissen: kijk of er babyvisjes komen.',
    najaar: 'Rustige herfstdagen: perfect om expedities te sturen.',
    oudnieuw: 'Een lichtshow achter het glas. Gelukkig nieuwjaar, visjes!',
  },
  events: [
    { id: 'aq_school', e: '🏫', n: 'Schoolklas op bezoek', d: 'Honderd kinderen kijken naar de vissen: 2x inkomen!', kind: 'mult', mult: 2, secs: 60, w: 5 },
    { id: 'aq_duik', e: '🤿', n: 'Duikshow', d: 'Een duiker voert de haaien: 1,7x inkomen.', kind: 'mult', mult: 1.7, secs: 100, w: 4 },
    { id: 'aq_parel', e: '🦪', n: 'Parel gevonden', d: 'Een oester bevat een parel!', kind: 'gift', secs: 200, w: 3 },
    { id: 'aq_tv', e: '📺', n: 'Tv-opnames', d: 'Een natuurprogramma filmt je aquarium. Mooie vergoeding!', kind: 'gift', secs: 120, w: 4 },
  ],
  dailies: [
    { id: 'aq_earn', e: '🪙', metric: 'earned', secs: [300, 900, 2400], g: [200, 1000, 5000], t: (g) => `Verdien ${n(g)} munten` },
    { id: 'aq_tap', e: '🍤', metric: 'taps', g: [20, 60, 150], t: (g) => `Voer de vissen ${n(g)} keer` },
    { id: 'aq_vis', e: '👥', metric: 'visitors', g: [30, 100, 300], t: (g) => `Verwelkom ${n(g)} bezoekers` },
    { id: 'aq_birth', e: '🥚', metric: 'births', g: [1, 3, 8], noscale: 1, t: (g) => `Verwelkom ${g} babyvis${g > 1 ? 'sen' : ''}` },
    { id: 'aq_exp', e: '🧭', metric: 'exps', g: [1, 2, 4], noscale: 1, t: (g) => `Voltooi ${g} expeditie${g > 1 ? 's' : ''}` },
    { id: 'aq_ani', e: '🐠', metric: 'animals', g: [3, 8, 20], t: (g) => `Haal ${g} extra dieren erbij` },
    { id: 'aq_deco', e: '🏰', metric: 'decos', g: [1, 2, 4], noscale: 1, t: (g) => `Zet ${g} decoratie${g > 1 ? 's' : ''} neer` },
    { id: 'aq_up', e: '⬆️', metric: 'upgrades', g: [2, 5, 10], t: (g) => `Koop ${g} upgrades in het park` },
    { id: 'aq_sp', e: '📖', metric: 'species', g: [1, 2, 3], noscale: 1, t: (g) => `Ontdek ${g} nieuwe soort${g > 1 ? 'en' : ''}` },
    { id: 'aq_play', e: '⏱️', metric: 'play', g: [120, 300, 600], noscale: 1, t: (g) => `Kijk ${Math.round(g / 60)} minuten naar je aquarium` },
  ],
  achs: [
    { id: 'aq_s1', n: 'Soortenjager', e: '📖', d: '15 soorten ontdekt', pts: 1, test: (m) => m.species >= 15, prog: (m) => [m.species, 15] },
    { id: 'aq_s2', n: 'Biologieleraar', e: '🔬', d: '35 soorten ontdekt', pts: 2, test: (m) => m.species >= 35, prog: (m) => [m.species, 35] },
    { id: 'aq_s3', n: 'Hele wereldzee', e: '🌍', d: '55 soorten ontdekt', pts: 3, test: (m) => m.species >= 55, prog: (m) => [m.species, 55] },
    { id: 'aq_a1', n: 'Volle tank', e: '🐟', d: '30 dieren', pts: 1, test: (m) => m.animals >= 30, prog: (m) => [m.animals, 30] },
    { id: 'aq_a2', n: 'Wemelende zee', e: '🐠', d: '150 dieren', pts: 2, test: (m) => m.animals >= 150, prog: (m) => [m.animals, 150] },
    { id: 'aq_a3', n: 'Oceaan', e: '🌊', d: '400 dieren', pts: 3, test: (m) => m.animals >= 400, prog: (m) => [m.animals, 400] },
    { id: 'aq_t1', n: 'Bassinbouwer', e: '🏗️', d: '4 tanks', pts: 1, test: (m) => m.tanks >= 4, prog: (m) => [m.tanks, 4] },
    { id: 'aq_t2', n: 'Aquariumdirecteur', e: '🏛️', d: '8 tanks', pts: 2, test: (m) => m.tanks >= 8, prog: (m) => [m.tanks, 8] },
    { id: 'aq_r1', n: 'Zeldzaam!', e: '💎', d: '3 zeldzame dieren', pts: 2, test: (m) => m.rare >= 3, prog: (m) => [m.rare, 3] },
    { id: 'aq_l1', n: 'Legendenjager', e: '🌟', d: '2 legendarische dieren', pts: 3, test: (m) => m.legend >= 2, prog: (m) => [m.legend, 2] },
    { id: 'aq_b1', n: 'Kraamafdeling', e: '🍼', d: '50 babyvissen', pts: 1, test: (m) => m.births >= 50, prog: (m) => [m.births, 50] },
    { id: 'aq_v1', n: 'Duizenden gasten', e: '🎟️', d: '5.000 bezoekers', pts: 1, test: (m) => m.visitors >= 5000, prog: (m) => [m.visitors, 5000] },
    { id: 'aq_x1', n: 'Zeemanshart', e: '⚓', d: '15 expedities', pts: 1, test: (m) => m.exps >= 15, prog: (m) => [m.exps, 15] },
    { id: 'aq_d1', n: 'Decorateur', e: '🎨', d: '5 soorten decoratie', pts: 1, test: (m) => m.decoTypes >= 5, prog: (m) => [m.decoTypes, 5] },
    { id: 'aq_e1', n: 'Miljardair', e: '💰', d: '1 miljard munten verdiend', pts: 2, test: (m) => m.earned >= 1e9, prog: (m) => [m.earned, 1e9] },
    { id: 'aq_p1', n: 'Verhuisd!', e: '🦪', d: 'Verhuis voor het eerst', pts: 2, test: (m) => m.prestiges >= 1 },
    { id: 'aq_p2', n: 'Parelkoning', e: '🤿', d: 'Verhuis 3 keer', pts: 3, test: (m) => m.prestiges >= 3, prog: (m) => [m.prestiges, 3] },
    { id: 'aq_n1', n: 'Nieuwe vrienden', e: '🆕', d: '3 nieuwe ronde-4 soorten gevonden of gekocht', pts: 2, test: (m) => m.r4Species >= 3, prog: (m) => [m.r4Species, 3] },
    { id: 'aq_n2', n: 'Feestelijke tank', e: '🎃', d: 'Alle 4 de nieuwe decoraties', pts: 2, test: (m) => m.r4Deco >= 4, prog: (m) => [m.r4Deco, 4] },
  ],
  news: [
    { e: '🐟', t: '12 nieuwe soorten', d: 'Platy, Skalaar, Rivierkreeftje, Maankwal, Tonijn, Vliegende vis, Papegaaivis, Bladzeedraakje, Citroenhaai, Hoedjespinguïn, Zeeolifant en Beloega.' },
    { e: '🎄', t: '4 nieuwe decoraties', d: 'Zeewierwoud, Pompoenhuisje, Kerstboom en Zeesterrenbed.' },
    { e: '🧭', t: '2 nieuwe expeditiegebieden', d: 'De Verborgen lagune en de IJsfjord leveren nieuwe zeldzame dieren op.' },
    { e: '🎯', t: '6 nieuwe doelen', d: 'Check het tabblad Doelen voor de nieuwe uitdagingen.' },
    { e: '📅', t: 'Seizoenen en evenementen', d: 'Per periode van het jaar een bonus, een intro-scene en vallende seizoensvormpjes.' },
    { e: '👑', t: 'Legende-rang', d: 'Sterren verdienen en blijvende voordelen kopen.' },
  ],
};

export function attach(ctx, live) {
  return mount(ctx, { ...CONFIG, ...live });
}
