// Ronde 4 - Ruimtebasis: seizoenen, evenementen, prestaties, dagopdrachten en Legende-rang.
import { mount } from './big-r4-core.js?v=1';

const n = (v) => Math.floor(v).toLocaleString('nl-NL');
export const CONFIG = {
  game: 'ruimtebasis', name: 'Ruimtebasis', cur: 'erts', minGift: 60,
  flavor: {
    halloween: 'Spooksterren! Op de donkere kant van de maan klinkt een vreemd gezoem.',
    sint: 'De Sint landt met een raket vol cadeautjes op je maanbasis.',
    kerst: 'Lichtjes in de ruimte: je maanbasis is versierd als kerstboom.',
    zomer: 'Zonnevlammen! Je zonnepanelen leveren extra veel stroom.',
    koning: 'Een oranje komeet scheert langs de maan. Feest in de ruimte!',
    voorjaar: 'In de Maanbossen groeien voor het eerst echte bloemen.',
    najaar: 'Een meteorenregen: kijk omhoog en doe een wens.',
    oudnieuw: 'Raketvuurwerk boven de basis! Tien, negen, acht...',
  },
  events: [
    { id: 'rb_zon', e: '☀️', n: 'Zonnevlam-boost', d: 'Extra energie voor je machines: 2x productie!', kind: 'mult', mult: 2, secs: 60, w: 5 },
    { id: 'rb_meteor', e: '☄️', n: 'Meteorenregen', d: 'Rijke brokken erts vallen uit de lucht: 1,8x productie.', kind: 'mult', mult: 1.8, secs: 90, w: 4 },
    { id: 'rb_pakket', e: '📦', n: 'Aardse bevoorrading', d: 'Een vrachtraket bezorgt erts.', kind: 'gift', secs: 120, w: 5 },
    { id: 'rb_alien', e: '👽', n: 'Vriendelijke alien', d: 'Een alien ruilt een schat voor een knuffel.', kind: 'gift', secs: 200, w: 2 },
  ],
  dailies: [
    { id: 'rb_ore', e: '🪨', metric: 'ore', secs: [300, 900, 2400], g: [500, 3000, 20000], t: (g) => `Delf ${n(g)} erts` },
    { id: 'rb_tap', e: '👆', metric: 'taps', g: [30, 100, 300], t: (g) => `Tik ${n(g)} keer op de maan` },
    { id: 'rb_bld', e: '🏗️', metric: 'built', g: [3, 10, 30], t: (g) => `Bouw ${g} modules` },
    { id: 'rb_mis', e: '🚀', metric: 'missions', g: [1, 2, 4], noscale: 1, t: (g) => `Voltooi ${g} missie${g > 1 ? 's' : ''}` },
    { id: 'rb_ln', e: '🛫', metric: 'launches', g: [1, 3, 6], noscale: 1, t: (g) => `Lanceer ${g} raket${g > 1 ? 'ten' : ''}` },
    { id: 'rb_sold', e: '🪙', metric: 'sold', g: [1, 3, 8], noscale: 1, t: (g) => `Verkoop ${g} keer spullen op de markt` },
    { id: 'rb_res', e: '🔬', metric: 'research', g: [1, 2, 3], noscale: 1, t: (g) => `Rond ${g} onderzoek${g > 1 ? 'en' : ''} af` },
    { id: 'rb_cred', e: '💰', metric: 'cred', g: [50, 400, 3000], t: (g) => `Verdien ${n(g)} credits` },
    { id: 'rb_star', e: '🌠', metric: 'stars', g: [1, 2, 3], noscale: 1, t: (g) => `Vang ${g} vallende ster${g > 1 ? 'ren' : ''}` },
  ],
  achs: [
    { id: 'rb_o1', n: 'Erts-miljoen', e: '🪨', d: '1 miljoen erts gedolven', pts: 1, test: (m) => m.ore >= 1e6, prog: (m) => [m.ore, 1e6] },
    { id: 'rb_o2', n: 'Erts-biljoen', e: '⛰️', d: '1 biljoen erts', pts: 2, test: (m) => m.ore >= 1e12, prog: (m) => [m.ore, 1e12] },
    { id: 'rb_o3', n: 'Planeetverslinder', e: '🌋', d: '1 triljoen erts', pts: 3, test: (m) => m.ore >= 1e15, prog: (m) => [m.ore, 1e15] },
    { id: 'rb_m1', n: 'Modulebouwer', e: '🏗️', d: '100 modules in je basis', pts: 1, test: (m) => m.modules >= 100, prog: (m) => [m.modules, 100] },
    { id: 'rb_m2', n: 'Ruimtestad', e: '🏙️', d: '400 modules in je basis', pts: 2, test: (m) => m.modules >= 400, prog: (m) => [m.modules, 400] },
    { id: 'rb_p1', n: 'Maanbewoners', e: '👩‍🚀', d: '25 bewoners', pts: 1, test: (m) => m.pop >= 25, prog: (m) => [m.pop, 25] },
    { id: 'rb_p2', n: 'Maanstad', e: '🌆', d: '100 bewoners', pts: 2, test: (m) => m.pop >= 100, prog: (m) => [m.pop, 100] },
    { id: 'rb_r1', n: 'Geleerde', e: '📘', d: '20 onderzoeken', pts: 1, test: (m) => m.research >= 20, prog: (m) => [m.research, 20] },
    { id: 'rb_r2', n: 'Nobelprijs', e: '🏅', d: '40 onderzoeken', pts: 3, test: (m) => m.research >= 40, prog: (m) => [m.research, 40] },
    { id: 'rb_w1', n: 'Zonnestelsel', e: '🪐', d: '9 werelden ontdekt', pts: 2, test: (m) => m.worlds >= 9, prog: (m) => [m.worlds, 9] },
    { id: 'rb_w2', n: 'Melkweg', e: '🌌', d: 'Alle 15 werelden ontdekt', pts: 3, test: (m) => m.worlds >= 15, prog: (m) => [m.worlds, 15] },
    { id: 'rb_l1', n: 'Raketlanceerder', e: '🚀', d: '50 raketten gelanceerd', pts: 1, test: (m) => m.launches >= 50, prog: (m) => [m.launches, 50] },
    { id: 'rb_l2', n: 'Ruimtehaven', e: '🛸', d: '300 raketten gelanceerd', pts: 2, test: (m) => m.launches >= 300, prog: (m) => [m.launches, 300] },
    { id: 'rb_t1', n: 'Tikkoning', e: '👆', d: '25.000 keer getikt', pts: 1, test: (m) => m.taps >= 25000, prog: (m) => [m.taps, 25000] },
    { id: 'rb_s1', n: 'Wensjesmaker', e: '🌠', d: '25 vallende sterren gevangen', pts: 1, test: (m) => m.stars >= 25, prog: (m) => [m.stars, 25] },
    { id: 'rb_b1', n: 'Robotleger', e: '🤖', d: '40 robots', pts: 1, test: (m) => m.bots >= 40, prog: (m) => [m.bots, 40] },
    { id: 'rb_v1', n: 'Nieuwe maan', e: '✨', d: 'Verhuis 3 keer (nieuw spel+)', pts: 2, test: (m) => m.moves >= 3, prog: (m) => [m.moves, 3] },
    { id: 'rb_v2', n: 'Maanzwerver', e: '🌙', d: 'Verhuis 15 keer', pts: 3, test: (m) => m.moves >= 15, prog: (m) => [m.moves, 15] },
    { id: 'rb_n1', n: 'Nieuw speelgoed', e: '🆕', d: '3 nieuwe ronde-4 modules gebouwd', pts: 2, test: (m) => m.r4Mods >= 3, prog: (m) => [m.r4Mods, 3] },
    { id: 'rb_n2', n: 'Complete collectie', e: '🏛️', d: 'Alle 10 nieuwe modules gebouwd', pts: 3, test: (m) => m.r4Mods >= 10, prog: (m) => [m.r4Mods, 10] },
  ],
  news: [
    { e: '🔋', t: '10 nieuwe modules', d: 'Batterijbank, Paddenstoelenkelder, Waterzuivering, Graafmachinepark, Maanmuseum, Maanuniversiteit, Maanbos, Maancasino, Thoriumreactor en Warpbaken.' },
    { e: '🔬', t: '10 nieuwe onderzoeken', d: 'Ontgrendel de nieuwe modules in het Lab.' },
    { e: '🎯', t: '8 nieuwe doelen en 6 prestaties', d: 'Voor als je al ver bent.' },
    { e: '📅', t: 'Seizoenen en evenementen', d: 'Zonnevlammen, meteorenregens en cadeaus uit de ruimte. Per seizoen een bonus en een scene.' },
    { e: '👑', t: 'Legende-rang', d: 'Sterren verdienen en blijvende voordelen kopen.' },
  ],
};

export function attach(ctx, live) {
  return mount(ctx, { ...CONFIG, ...live });
}
