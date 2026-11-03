// Ronde 4 - Foodtruck Imperium: seizoenen, evenementen, prestaties, dagopdrachten en Legende-rang.
import { mount } from './big-r4-core.js?v=1';

const n = (v) => Math.floor(v).toLocaleString('nl-NL');
export const CONFIG = {
  game: 'foodtruck', name: 'Foodtruck', cur: 'munten', minGift: 30,
  flavor: {
    halloween: 'Spookweek: gasten komen verkleed. Zet een Pompoen neer bij je truck!',
    sint: 'Pepernoten en oliebollen gaan als zoete broodjes. Probeer de nieuwe seizoensgerechten.',
    kerst: 'Warm eten in de kou: Kerstdiner en Erwtensoep zijn favoriet. Zet een Kerstboom neer.',
    zomer: 'Zomerdrukte: ijsjes en smoothies vliegen weg.',
    koning: 'Oranje feest! Hang de Oranje vlag op en serveer Koningsdag-hapjes.',
    voorjaar: 'Terrasjesweer: klanten blijven langer zitten.',
    najaar: 'Herfst: soep en stamppot doen het goed.',
    oudnieuw: 'Oliebollen en vuurwerk: de drukste avond van het jaar.',
  },
  events: [
    { id: 'ft_rij', e: '🚚', n: 'Lange rij', d: 'Een rij tot om de hoek: 2x inkomen!', kind: 'mult', mult: 2, secs: 60, w: 5 },
    { id: 'ft_blog', e: '📱', n: 'Foodblogger', d: 'Een blogger post over je truck: 1,8x inkomen.', kind: 'mult', mult: 1.8, secs: 90, w: 4 },
    { id: 'ft_fooi', e: '💶', n: 'Dikke fooi', d: 'Een tevreden gast laat een flinke fooi achter.', kind: 'gift', secs: 120, w: 5 },
    { id: 'ft_tv', e: '📺', n: 'Kookprogramma', d: 'Een tv-ploeg filmt je truck en betaalt netjes.', kind: 'gift', secs: 240, w: 2 },
  ],
  dailies: [
    { id: 'ft_earn', e: '🪙', metric: 'earned', secs: [300, 900, 2400], g: [200, 1000, 5000], t: (g) => `Verdien ${n(g)} munten` },
    { id: 'ft_serv', e: '🙂', metric: 'served', g: [15, 50, 150], t: (g) => `Serveer ${n(g)} klanten` },
    { id: 'ft_perf', e: '✨', metric: 'perfect', g: [3, 10, 30], t: (g) => `Maak ${g} supergerechten` },
    { id: 'ft_comb', e: '🔥', metric: 'combo', g: [5, 15, 40], noscale: 1, t: (g) => `Haal een combo van ${g}` },
    { id: 'ft_buy', e: '🛒', metric: 'bought', g: [5, 20, 60], t: (g) => `Koop ${g} ingrediënten` },
    { id: 'ft_ev', e: '🎪', metric: 'events', g: [1, 2, 3], noscale: 1, t: (g) => `Doe mee aan ${g} evenement${g > 1 ? 'en' : ''}` },
    { id: 'ft_rec', e: '📖', metric: 'recipes', g: [1, 2, 3], noscale: 1, t: (g) => `Ontgrendel ${g} nieuw${g > 1 ? 'e' : ''} gerecht${g > 1 ? 'en' : ''}` },
    { id: 'ft_up', e: '🔧', metric: 'upgrades', g: [2, 5, 10], t: (g) => `Koop ${g} truck-upgrades` },
    { id: 'ft_staff', e: '👨‍🍳', metric: 'staff', g: [1, 3, 6], t: (g) => `Train je personeel ${g} niveau${g > 1 ? 's' : ''}` },
  ],
  achs: [
    { id: 'ft_s1', n: 'Duizend klanten', e: '🙂', d: '1.000 klanten geserveerd', pts: 1, test: (m) => m.served >= 1000, prog: (m) => [m.served, 1000] },
    { id: 'ft_s2', n: 'Tienduizend klanten', e: '🍽️', d: '10.000 klanten', pts: 2, test: (m) => m.served >= 10000, prog: (m) => [m.served, 10000] },
    { id: 'ft_s3', n: 'Honderdduizend!', e: '🏟️', d: '100.000 klanten', pts: 3, test: (m) => m.served >= 100000, prog: (m) => [m.served, 100000] },
    { id: 'ft_e1', n: 'Eerste miljoen', e: '💰', d: '1 miljoen munten verdiend', pts: 1, test: (m) => m.earned >= 1e6, prog: (m) => [m.earned, 1e6] },
    { id: 'ft_e2', n: 'Miljardair', e: '💎', d: '1 miljard munten', pts: 2, test: (m) => m.earned >= 1e9, prog: (m) => [m.earned, 1e9] },
    { id: 'ft_e3', n: 'Foodmagnaat', e: '👑', d: '1 biljoen munten', pts: 3, test: (m) => m.earned >= 1e12, prog: (m) => [m.earned, 1e12] },
    { id: 'ft_r1', n: 'Kookboek vol', e: '📖', d: '20 gerechten ontgrendeld', pts: 1, test: (m) => m.recipes >= 20, prog: (m) => [m.recipes, 20] },
    { id: 'ft_r2', n: 'Culinair genie', e: '👨‍🍳', d: '45 gerechten ontgrendeld', pts: 2, test: (m) => m.recipes >= 45, prog: (m) => [m.recipes, 45] },
    { id: 'ft_st1', n: 'Vijf sterren', e: '⭐', d: '5 sterren', pts: 1, test: (m) => m.stars >= 5, prog: (m) => [m.stars, 5] },
    { id: 'ft_st2', n: 'Tien sterren', e: '🌟', d: '10 sterren', pts: 2, test: (m) => m.stars >= 10, prog: (m) => [m.stars, 10] },
    { id: 'ft_st3', n: 'Michelin-niveau', e: '🏅', d: '18 sterren', pts: 3, test: (m) => m.stars >= 18, prog: (m) => [m.stars, 18] },
    { id: 'ft_c1', n: 'Wereldreiziger', e: '🌍', d: '5 steden', pts: 1, test: (m) => m.cities >= 5, prog: (m) => [m.cities, 5] },
    { id: 'ft_c2', n: 'Globetrotter', e: '✈️', d: '10 steden', pts: 3, test: (m) => m.cities >= 10, prog: (m) => [m.cities, 10] },
    { id: 'ft_d1', n: 'Versieringsfan', e: '🎈', d: '10 decoraties', pts: 1, test: (m) => m.decor >= 10, prog: (m) => [m.decor, 10] },
    { id: 'ft_p1', n: 'Supergerechten', e: '✨', d: '500 supergerechten', pts: 2, test: (m) => m.perfect >= 500, prog: (m) => [m.perfect, 500] },
    { id: 'ft_m1', n: 'Combokoning', e: '🔥', d: 'Combo van 50', pts: 2, test: (m) => m.combo >= 50, prog: (m) => [m.combo, 50] },
    { id: 'ft_f1', n: 'Franchisenemer', e: '🏅', d: 'Open een franchise (nieuw spel+)', pts: 3, test: (m) => m.franchises >= 1 },
    { id: 'ft_f2', n: 'Ketenbaas', e: '🏢', d: 'Open 3 franchises', pts: 3, test: (m) => m.franchises >= 3, prog: (m) => [m.franchises, 3] },
    { id: 'ft_n1', n: 'Seizoenskok', e: '🥯', d: '4 nieuwe ronde-4 gerechten', pts: 2, test: (m) => m.r4Dishes >= 4, prog: (m) => [m.r4Dishes, 4] },
    { id: 'ft_n2', n: 'Feestversiering', e: '🎃', d: '4 nieuwe ronde-4 decoraties', pts: 2, test: (m) => m.r4Decor >= 4, prog: (m) => [m.r4Decor, 4] },
  ],
  news: [
    { e: '🥯', t: '14 nieuwe gerechten', d: 'Pepernoten, Poffertjes, Oliebollen, Erwtensoep, Nasi goreng, Saté, Pizza pepperoni, Ravioli, Churros, Pekingeend, Foie-gras-toast, Barbecue-feest, Gouden sushi en Kerstdiner.' },
    { e: '🌍', t: '2 nieuwe steden', d: 'Londen en Kaapstad.' },
    { e: '🎃', t: '8 nieuwe decoraties', d: 'Pompoen, Kerstboom, Sneeuwpop, Oranje vlag, Vuurwerk, Hangmat, Pizzaoven en Fotohoek.' },
    { e: '🎪', t: '4 seizoensevenementen', d: 'Koningsdag, Halloween, Sinterklaas en Kerstmarkt, alleen in die periode.' },
    { e: '🎯', t: '7 nieuwe doelen en meer prestaties', d: 'Voor als je al ver bent.' },
    { e: '📅', t: 'Seizoenen en Legende-rang', d: 'Bonus per seizoen, dagopdrachten, evenementen en blijvende voordelen.' },
  ],
};

export function attach(ctx, live) {
  return mount(ctx, { ...CONFIG, ...live });
}
