// Ronde 4 - Themapark Tycoon: seizoenen, evenementen, prestaties, dagopdrachten en Legende-rang.
import { mount } from './big-r4-core.js?v=1';

const n = (v) => Math.floor(v).toLocaleString('nl-NL');
export const CONFIG = {
  game: 'themapark', name: 'Themapark', cur: '€', minGift: 40,
  fmt: (v) => '€' + (v < 10000 ? Math.floor(v) : Math.floor(v) >= 1e6 ? (v / 1e6).toFixed(1).replace('.', ',') + 'M' : (v / 1e3).toFixed(1).replace('.', ',') + 'K'),
  flavor: {
    halloween: 'Zet pompoenen neer en laat je gasten gillen in het Spookhuis. Extra drukte bij de Rupsbaan!',
    sint: 'Pepernoten bij de snoepkraam! Tip: de Suikerspinkraam en het Pannenkoekenhuis doen het nu goed.',
    kerst: 'Zet een Kerstboom en een Sneeuwpop neer: het park wordt een winterwonderland.',
    zomer: 'IJskraam en waterglijbaan draaien overuren. Zet extra drinkkramen neer!',
    koning: 'Oranje feest! De Draaimolen en Kikkerhop zijn favoriet.',
    voorjaar: 'Bloemperken en de Kinderboerderij zijn in trek.',
    najaar: 'Pompoenen en herfstbladeren. De Poffertjeskraam maakt nu veel winst.',
    oudnieuw: 'Knallen maar: het Reuzenrad heeft het mooiste uitzicht op het vuurwerk.',
  },
  events: [
    { id: 'tp_koorts', e: '🎢', n: 'Achtbaankoorts', d: 'Iedereen wil in de attracties: 2,5x inkomen!', kind: 'mult', mult: 2.5, secs: 45, w: 3 },
    { id: 'tp_bus', e: '🚌', n: 'Schoolreisje', d: 'Drie bussen vol kinderen: 1,8x inkomen.', kind: 'mult', mult: 1.8, secs: 90, w: 5 },
    { id: 'tp_ster', e: '🎤', n: 'Beroemde bezoeker', d: 'Een zanger bezoekt je park. Mooie fooi!', kind: 'gift', secs: 150, w: 3 },
    { id: 'tp_kado', e: '🧸', n: 'Verloren knuffel', d: 'Iemand schenkt een knuffel aan het park en geeft een gift.', kind: 'gift', secs: 60, w: 5 },
  ],
  dailies: [
    { id: 'tp_earn', e: '💰', metric: 'earned', secs: [300, 900, 2400], g: [200, 800, 3000], t: (g) => `Verdien ${n(g)} euro` },
    { id: 'tp_vis', e: '🎟️', metric: 'visitors', g: [30, 100, 300], t: (g) => `Ontvang ${n(g)} bezoekers` },
    { id: 'tp_ride', e: '🎢', metric: 'riders', g: [80, 300, 1000], t: (g) => `${n(g)} ritjes in de attracties` },
    { id: 'tp_tip', e: '🤝', metric: 'tips', g: [3, 8, 20], noscale: 1, t: (g) => `Geef ${g} bezoekers een high five (fooi)` },
    { id: 'tp_rep', e: '🔧', metric: 'repairs', g: [1, 3, 6], noscale: 1, t: (g) => `Repareer ${g} attracties` },
    { id: 'tp_clean', e: '🧹', metric: 'cleaned', g: [5, 15, 40], t: (g) => `Ruim ${g} stukjes afval op` },
    { id: 'tp_build', e: '🔨', metric: 'built', g: [2, 5, 12], t: (g) => `Bouw ${g} dingen in je park` },
    { id: 'tp_ev', e: '🎉', metric: 'events', g: [1, 2, 4], noscale: 1, t: (g) => `Beleef ${g} parkgebeurtenissen` },
    { id: 'tp_camp', e: '📣', metric: 'camps', g: [1, 1, 2], noscale: 1, t: (g) => `Start ${g} reclamecampagne${g > 1 ? 's' : ''}` },
    { id: 'tp_play', e: '⏱️', metric: 'play', g: [120, 300, 600], noscale: 1, t: (g) => `Speel ${Math.round(g / 60)} minuten` },
  ],
  achs: [
    { id: 'tp_v1', n: 'Duizend en een gast', e: '🎟️', d: '1.000 bezoekers', pts: 1, test: (m) => m.visitors >= 1000, prog: (m) => [m.visitors, 1000] },
    { id: 'tp_v2', n: 'Tienduizend gasten', e: '👥', d: '10.000 bezoekers', pts: 2, test: (m) => m.visitors >= 10000, prog: (m) => [m.visitors, 10000] },
    { id: 'tp_v3', n: 'Honderdduizend!', e: '🏟️', d: '100.000 bezoekers', pts: 3, test: (m) => m.visitors >= 100000, prog: (m) => [m.visitors, 100000] },
    { id: 'tp_r1', n: 'Pretmaker', e: '🎠', d: '5 attracties in je park', pts: 1, test: (m) => m.rides >= 5, prog: (m) => [m.rides, 5] },
    { id: 'tp_r2', n: 'Attractiekoning', e: '🎢', d: '15 attracties', pts: 2, test: (m) => m.rides >= 15, prog: (m) => [m.rides, 15] },
    { id: 'tp_r3', n: 'Reuzenpark', e: '🎡', d: '30 attracties', pts: 3, test: (m) => m.rides >= 30, prog: (m) => [m.rides, 30] },
    { id: 'tp_e1', n: 'Eerste miljoen', e: '💰', d: 'Verdien in totaal 1 miljoen', pts: 1, test: (m) => m.earned >= 1e6, prog: (m) => [m.earned, 1e6] },
    { id: 'tp_e2', n: 'Miljardair', e: '💎', d: 'Verdien in totaal 1 miljard', pts: 3, test: (m) => m.earned >= 1e9, prog: (m) => [m.earned, 1e9] },
    { id: 'tp_s3', n: 'Drie sterren', e: '⭐', d: 'Haal 3 sterren met je park', pts: 1, test: (m) => m.stars >= 3, prog: (m) => [m.stars, 3] },
    { id: 'tp_s5', n: 'Vijfsterrenpark', e: '🌟', d: 'Haal 5 sterren', pts: 3, test: (m) => m.stars >= 5, prog: (m) => [m.stars, 5] },
    { id: 'tp_f1', n: 'Smulkoning', e: '🍭', d: '6 soorten eten of winkels', pts: 1, test: (m) => m.shopTypes >= 6, prog: (m) => [m.shopTypes, 6] },
    { id: 'tp_d1', n: 'Groene vingers', e: '🌳', d: '30 stuks decoratie', pts: 1, test: (m) => m.decor >= 30, prog: (m) => [m.decor, 30] },
    { id: 'tp_t1', n: 'Vriendelijke gastheer', e: '🤝', d: '50 high fives gegeven', pts: 1, test: (m) => m.tips >= 50, prog: (m) => [m.tips, 50] },
    { id: 'tp_c1', n: 'Poetsfee', e: '🧹', d: '300 stukjes afval opgeruimd', pts: 1, test: (m) => m.cleaned >= 300, prog: (m) => [m.cleaned, 300] },
    { id: 'tp_g1', n: 'Doelenjager', e: '🎯', d: '15 doelen gehaald', pts: 2, test: (m) => m.goals >= 15, prog: (m) => [m.goals, 15] },
    { id: 'tp_n1', n: 'Nieuw park', e: '🗺️', d: 'Open een tweede park', pts: 2, test: (m) => m.parks >= 2, prog: (m) => [m.parks, 2] },
    { id: 'tp_fr1', n: 'Franchisenemer', e: '🎫', d: 'Start een franchise (nieuw spel+)', pts: 3, test: (m) => m.franchises >= 1 },
    { id: 'tp_nw', n: 'Fris materiaal', e: '🆕', d: 'Bouw een nieuw ronde-4 gebouw (kikkerhop, kanovaart, spiegelpaleis, rupsbaan, ijsbaan)', pts: 2, test: (m) => m.r4Items >= 1 },
    { id: 'tp_nw2', n: 'Feestdagen-fan', e: '🎄', d: 'Zet pompoen, kerstboom en sneeuwpop neer', pts: 2, test: (m) => m.seasonDecor >= 3, prog: (m) => [m.seasonDecor, 3] },
  ],
  news: [
    { e: '🎢', t: '5 nieuwe attracties', d: 'Kikkerhop, Kanovaart, Spiegelpaleis, Rupsbaan en Ijsbaan. Onderzoek ze in het lab.' },
    { e: '🍭', t: '3 nieuwe kraampjes', d: 'Suikerspin, Poffertjes en het Pannenkoekenhuis.' },
    { e: '🎃', t: '4 seizoensdecoraties', d: 'Pompoen, Kerstboom, Sneeuwpop en de Lichtjesboog.' },
    { e: '📅', t: 'Seizoenen met bonus', d: 'Elke periode van het jaar (Halloween, Sint, Kerst, Koningsdag...) geeft inkomensbonus en een eigen intro-scene.' },
    { e: '🎈', t: 'Evenementen', d: 'Tik de zwevende bel aan voor gouden kwartiertjes, cadeaus en Legende-sterren.' },
    { e: '👑', t: 'Legende-rang', d: 'Verdien sterren met prestaties en opdrachten en koop blijvende voordelen.' },
  ],
};

export function attach(ctx, live) {
  const cfg = { ...CONFIG, ...live };
  return mount(ctx, cfg);
}
