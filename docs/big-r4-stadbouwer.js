// Ronde 4 - Stadbouwer: seizoenen, evenementen, prestaties, dagopdrachten en Legende-rang.
import { mount } from './big-r4-core.js?v=1';

const n = (v) => Math.floor(v).toLocaleString('nl-NL');
export const CONFIG = {
  game: 'stadbouwer', name: 'Stadbouwer', cur: 'geld', minGift: 40,
  flavor: {
    halloween: 'Spookweek in de stad! Zet een Kermis neer: de bezoekers komen voor het griezelen.',
    sint: 'De Sint komt aan! Winkels en het Pannenkoekenhuis doen goede zaken.',
    kerst: 'Lichtjes in de straten. Winkels en bioscopen zijn druk bezocht.',
    zomer: 'Zomerdrukte! Zwembad, ijssalon en kermis draaien overuren.',
    koning: 'Vrijmarkt op het plein: het Marktplein levert extra op.',
    voorjaar: 'Bloemetjes in de stad: parken maken je inwoners extra blij.',
    najaar: 'Herfstbladeren op straat. Een mooi moment om te bouwen.',
    oudnieuw: 'Vuurwerk boven het stadhuis. Gelukkig nieuwjaar, inwoners!',
  },
  events: [
    { id: 'sb_markt', e: '🍎', n: 'Grote markt', d: 'Het plein zit vol: 2x inkomen!', kind: 'mult', mult: 2, secs: 60, w: 5 },
    { id: 'sb_toerist', e: '🧳', n: 'Toeristenbus', d: 'Toeristen vullen de straten: 1,7x inkomen.', kind: 'mult', mult: 1.7, secs: 100, w: 4 },
    { id: 'sb_subsidie', e: '🏛️', n: 'Subsidie van de provincie', d: 'De provincie steunt je stad met een mooi bedrag.', kind: 'gift', secs: 180, w: 3 },
    { id: 'sb_erfenis', e: '📜', n: 'Onverwachte erfenis', d: 'Een tante schenkt geld aan de stad.', kind: 'gift', secs: 90, w: 5 },
  ],
  dailies: [
    { id: 'sb_earn', e: '💰', metric: 'earned', secs: [300, 900, 2400], g: [200, 1000, 5000], t: (g) => `Verdien ${n(g)} voor de stad` },
    { id: 'sb_build', e: '🏗️', metric: 'built', g: [3, 8, 20], t: (g) => `Bouw ${g} gebouwen` },
    { id: 'sb_pop', e: '👥', metric: 'peak', g: [10, 40, 120], t: (g) => `Haal ${n(g)} nieuwe inwoners naar je stad` },
    { id: 'sb_fire', e: '🚒', metric: 'fires', g: [1, 2, 3], noscale: 1, t: (g) => `Blus ${g} brand${g > 1 ? 'en' : ''}` },
    { id: 'sb_tap', e: '🪣', metric: 'taps', g: [1, 2, 4], noscale: 1, t: (g) => `Gebruik ${g} keer de emmer` },
    { id: 'sb_goal', e: '🎯', metric: 'goal', g: [1, 2, 3], noscale: 1, t: (g) => `Haal ${g} stadsdoel${g > 1 ? 'en' : ''}` },
    { id: 'sb_up', e: '⬆️', metric: 'upgrades', g: [1, 3, 6], noscale: 1, t: (g) => `Koop ${g} stadsplan-upgrade${g > 1 ? 's' : ''}` },
    { id: 'sb_ach', e: '🏅', metric: 'achs', g: [1, 2, 3], noscale: 1, t: (g) => `Verdien ${g} stads-prestatie${g > 1 ? 's' : ''}` },
  ],
  achs: [
    { id: 'sb_p1', n: 'Duizend inwoners', e: '🏙️', d: 'Piek van 1.000 inwoners', pts: 2, test: (m) => m.peak >= 1000, prog: (m) => [m.peak, 1000] },
    { id: 'sb_p2', n: 'Tienduizend!', e: '🌆', d: 'Piek van 10.000 inwoners', pts: 3, test: (m) => m.peak >= 10000, prog: (m) => [m.peak, 10000] },
    { id: 'sb_b1', n: 'Bouwvakker', e: '🔨', d: '50 gebouwen gebouwd', pts: 1, test: (m) => m.built >= 50, prog: (m) => [m.built, 50] },
    { id: 'sb_b2', n: 'Aannemer', e: '🏗️', d: '300 gebouwen gebouwd', pts: 2, test: (m) => m.built >= 300, prog: (m) => [m.built, 300] },
    { id: 'sb_k1', n: 'Veelzijdig', e: '🧩', d: '15 soorten gebouwen in je stad', pts: 1, test: (m) => m.kinds >= 15, prog: (m) => [m.kinds, 15] },
    { id: 'sb_k2', n: 'Complete stad', e: '🌐', d: '30 soorten gebouwen in je stad', pts: 3, test: (m) => m.kinds >= 30, prog: (m) => [m.kinds, 30] },
    { id: 'sb_h1', n: 'Woningbouwer', e: '🏘️', d: '40 woningen', pts: 1, test: (m) => m.houses >= 40, prog: (m) => [m.houses, 40] },
    { id: 'sb_w1', n: 'Werkgever', e: '🏭', d: '20 werkplekken-gebouwen', pts: 1, test: (m) => m.works >= 20, prog: (m) => [m.works, 20] },
    { id: 'sb_s1', n: 'Winkelstraat', e: '🛍️', d: '15 winkels', pts: 1, test: (m) => m.shops >= 15, prog: (m) => [m.shops, 15] },
    { id: 'sb_g1', n: 'Groene longen', e: '🌳', d: '25 groene plekken en pret', pts: 1, test: (m) => m.green >= 25, prog: (m) => [m.green, 25] },
    { id: 'sb_e1', n: 'Stroom voor iedereen', e: '⚡', d: '10 stroomcentrales', pts: 1, test: (m) => m.power >= 10, prog: (m) => [m.power, 10] },
    { id: 'sb_e2', n: 'Waterstad', e: '💧', d: '10 water-gebouwen', pts: 1, test: (m) => m.water >= 10, prog: (m) => [m.water, 10] },
    { id: 'sb_t1', n: 'Op wielen', e: '🚲', d: '10 vervoersgebouwen', pts: 1, test: (m) => m.transit >= 10, prog: (m) => [m.transit, 10] },
    { id: 'sb_u1', n: 'Schoolstad', e: '🎓', d: '10 scholen en bibliotheken', pts: 1, test: (m) => m.schools >= 10, prog: (m) => [m.schools, 10] },
    { id: 'sb_j1', n: 'Blije burgemeester', e: '😊', d: 'Blijdschap van 90 of meer', pts: 2, test: (m) => m.happy >= 90 && m.pop >= 100 },
    { id: 'sb_pr1', n: 'Projectontwikkelaar', e: '🏛️', d: '3 grote projecten gebouwd', pts: 2, test: (m) => m.projects >= 3, prog: (m) => [m.projects, 3] },
    { id: 'sb_pr2', n: 'Tweede stad', e: '🔄', d: 'Begin een nieuwe stad (nieuw spel+)', pts: 3, test: (m) => m.prestiges >= 1 },
    { id: 'sb_ur1', n: 'Stadsplanner pro', e: '📐', d: '40 upgrade-niveaus', pts: 2, test: (m) => m.upgrades >= 40, prog: (m) => [m.upgrades, 40] },
    { id: 'sb_n1', n: 'Nieuwe wijk', e: '🆕', d: '4 nieuwe ronde-4 gebouwen', pts: 2, test: (m) => m.r4Items >= 4, prog: (m) => [m.r4Items, 4] },
    { id: 'sb_n2', n: 'Alles nieuw', e: '🎉', d: 'Alle 12 nieuwe gebouwen', pts: 3, test: (m) => m.r4Items >= 12, prog: (m) => [m.r4Items, 12] },
  ],
  news: [
    { e: '🏠', t: '12 nieuwe gebouwen', d: 'Tinyhouse, Studentenflat, Drukkerij, Datacenter, Pannenkoekenhuis, Bioscoop, Muziekschool, Hondenrenweide, Kermis, Fietsenstalling, Batterijpark en Regenwatertank.' },
    { e: '🎯', t: '6 nieuwe doelen en 5 prestaties', d: 'Doelen na je 5000e inwoner en nieuwe stadsprestaties.' },
    { e: '📅', t: 'Seizoenen en evenementen', d: 'Per periode van het jaar een bonus en een scene. Tik op de bel voor een bonus.' },
    { e: '👑', t: 'Legende-rang', d: 'Sterren verdienen en blijvende voordelen kopen.' },
  ],
};

export function attach(ctx, live) {
  return mount(ctx, { ...CONFIG, ...live });
}
