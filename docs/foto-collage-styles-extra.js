// foto-collage-styles-extra.js - 30 extra collagestijlen: 18 werelden (met 3D-iconen als versiering) en 12 extra vormen/lay-outs.
// Pure data/logica, geen imports. foto-collage-styles.js geeft zijn hulpfuncties door: makeExtraDefs(h) -> [[naam, omschrijving, groep, fn, flags?], ...]
// De iconen worden getekend via decor-type 'icon' ({type:'icon', n:'rocket', x, y, s}) dat globalThis.__fotoIcon gebruikt (zie foto-icons.js).

export const EXTRA_GROUPS = ['Werelden', 'Extra lay-outs'];

// id, naam, achtergrondkleuren, accent, grond, iconen, licht/donker (zelfde data als gfx/themes.js; hier ingebakken zodat dit bestand los testbaar blijft)
export const WORLD_STYLES = [
  ['ruimte', 'Ruimte', ['#050816', '#1b1450', '#3b1d6e'], '#a78bfa', '#1e1b4b', ['rocket', 'planet', 'star', 'ufo', 'satellite', 'comet', 'astronaut'], 1],
  ['onderwater', 'Onderwater', ['#38bdf8', '#0369a1', '#082f49'], '#22d3ee', '#d9b36c', ['shell', 'crab', 'octopus', 'turtle', 'fish', 'jellyfish', 'whale'], 1],
  ['kasteel', 'Kasteel', ['#7dd3fc', '#bfdbfe', '#fde68a'], '#f59e0b', '#4d9d3a', ['castle', 'tower', 'flag', 'shield', 'crown', 'dragon', 'sword'], 0],
  ['bos', 'Bos', ['#a7f3d0', '#86efac', '#fef9c3'], '#16a34a', '#2f7d32', ['tree', 'pine', 'mushroom', 'fox', 'owl', 'flower', 'butterfly', 'bee'], 0],
  ['woestijn', 'Woestijn', ['#fb923c', '#fcd34d', '#fef3c7'], '#ea580c', '#e0a458', ['cactus', 'pyramid', 'rock', 'sun'], 0],
  ['ijs', 'IJswereld', ['#bae6fd', '#e0f2fe', '#f0f9ff'], '#0ea5e9', '#f1f5f9', ['igloo', 'pine', 'penguin', 'bear', 'snowflake'], 0],
  ['snoepland', 'Snoepland', ['#fbcfe8', '#f9a8d4', '#fde68a'], '#ec4899', '#f472b6', ['lollipop', 'icecream', 'cupcake', 'donut', 'candy', 'cookie', 'cake'], 0],
  ['stad', 'Stad', ['#1e3a8a', '#6366f1', '#fdba74'], '#38bdf8', '#334155', ['skyscraper', 'house', 'car', 'bus', 'shop', 'bridge', 'plane'], 1],
  ['jungle', 'Jungle', ['#14532d', '#16a34a', '#bef264'], '#84cc16', '#166534', ['palm', 'monkey', 'frog', 'flower', 'butterfly', 'snail'], 0],
  ['vulkaan', 'Vulkaan', ['#1c0a0a', '#7f1d1d', '#ea580c'], '#f97316', '#27272a', ['volcano', 'flame', 'dragon', 'rock', 'skull'], 1],
  ['wolken', 'Wolken', ['#60a5fa', '#a5d8ff', '#fff1f2'], '#38bdf8', '#ffffff', ['cloud', 'balloon', 'rainbow', 'unicorn', 'plane', 'helicopter', 'star'], 0],
  ['piraten', 'Piraten', ['#0f172a', '#155e75', '#f59e0b'], '#f59e0b', '#92400e', ['ship', 'chest', 'skull', 'flag', 'map', 'compass', 'shell'], 1],
  ['robots', 'Robots', ['#0f172a', '#1e293b', '#334155'], '#22d3ee', '#475569', ['robot', 'gear', 'bolt', 'satellite', 'lightbulb', 'magnet'], 1],
  ['dino', 'Dino', ['#fde68a', '#fdba74', '#86efac'], '#65a30d', '#5b7f2b', ['dino', 'palm', 'egg', 'rock', 'volcano', 'leaf'], 0],
  ['neon', 'Neon', ['#0a0014', '#3b0764', '#be185d'], '#f0abfc', '#1e0a3c', ['note', 'bolt', 'star', 'headphones', 'guitar', 'drum'], 1],
  ['herfst', 'Herfst', ['#fcd34d', '#fb923c', '#7c2d12'], '#ea580c', '#9a3412', ['tree', 'leaf', 'mushroom', 'owl', 'pie', 'clover'], 0],
  ['boerderij', 'Boerderij', ['#7dd3fc', '#bae6fd', '#fef9c3'], '#65a30d', '#65a30d', ['barn', 'windmill', 'tractor', 'cow', 'pig', 'chicken', 'sheep', 'wheat'], 0],
  ['pretpark', 'Pretpark', ['#a78bfa', '#f0abfc', '#fed7aa'], '#f43f5e', '#7c3aed', ['ferriswheel', 'rollercoaster', 'carousel', 'balloon', 'ticket', 'bell'], 0],
];

export function makeExtraDefs(h) {
  const { mkSlot, inset, solids, rnd, grad, gridCells, rowsFill, T, RECT, clamp } = h;
  const G = EXTRA_GROUPS;
  const out = [];

  // ---------- 18 werelden ----------
  for (const [id, name, bg, accent, ground, deco, dark] of WORLD_STYLES) {
    out.push([name + '-collage', 'thema ' + name.toLowerCase() + ' met 3D-plaatjes', G[0], (n, W, H, rng, o) => {
      const g = .03 * o.gap, top = .14, bot = .15, box = { x: .06, y: top, w: W - .12, h: H - top - bot };
      const cells = gridCells(n, box, 1);
      const frameCol = dark ? '#f8fafc' : '#ffffff';
      const slots = cells.map((c, i) => mkSlot(inset(c, g / 2), { shape: rnd(.1), rot: (i % 2 ? 1 : -1) * rng.range(.3, 1.6), frame: { w: .008, color: frameCol, shadow: .5 } }));
      const decor = [
        { type: 'wave', y: H - bot + .02, amp: .012, len: .3, color: ground, alpha: .95, phase: rng.range(0, 6) },
      ];
      // iconen onderin (langs de grond) en in de hoeken
      const per = Math.max(5, Math.min(9, Math.round(W * 7))), sz = Math.min(.11, (W - .1) / per * 1.05);
      for (let i = 0; i < per; i++) decor.push({ type: 'icon', n: deco[(i + rng.int(0, 3)) % deco.length], x: .05 + sz / 2 + i * ((W - .1 - sz) / Math.max(1, per - 1)), y: H - bot / 2 + .012 + (i % 2) * .008, s: sz * rng.range(.85, 1.1), rot: rng.range(-.2, .2), over: true });
      decor.push({ type: 'icon', n: deco[0], x: .07, y: .07, s: .09, rot: -.15, over: true }, { type: 'icon', n: deco[deco.length - 1], x: W - .07, y: .07, s: .09, rot: .15, over: true });
      decor.push(T(W / 2, .075, name, .056, { color: dark ? '#ffffff' : '#1e293b', stroke: dark ? '#0f172a' : '#ffffff', strokeW: .16, maxw: W * .6, over: true }));
      const [c0, c1, c2] = bg;
      return { bgs: [grad(c0, c2, 170), grad(c1, c2, 200), grad(c2, c0, 150), grad(c0, c1, 120)], decor, slots };
    }]);
    void id;
  }

  // ---------- 12 extra lay-outs ----------
  const frame = (w, color, shadow, b) => ({ w, color, shadow: shadow == null ? .5 : shadow, b: b || 0 });
  out.push(['Cirkel-raster', 'ronde foto\'s in een raster', G[1], (n, W, H, rng, o) => {
    const g = .03 * o.gap, cells = gridCells(n, { x: .06, y: .06, w: W - .12, h: H - .12 }, 1);
    return { bgs: solids(rng, ['#fef3c7', '#e0f2fe', '#fce7f3', '#111827', '#ecfccb']), slots: cells.map((c) => mkSlot(inset(c, g / 2), { shape: { type: 'circle' }, frame: frame(.006, '#ffffff', .4) })) };
  }]);
  out.push(['Hartjesraster', 'elke foto een hartje', G[1], (n, W, H, rng, o) => {
    const g = .02 * o.gap, cells = gridCells(n, { x: .05, y: .05, w: W - .1, h: H - .1 }, 1);
    return { bgs: solids(rng, ['#fff1f2', '#fce7f3', '#fecdd3', '#4c0519', '#fdf2f8']), slots: cells.map((c) => mkSlot(inset(c, g / 2), { shape: { type: 'heart' } })) };
  }]);
  out.push(['Bijenraat', 'bijenraat van foto\'s', G[1], (n, W, H, rng, o) => {
    const g = .015 * o.gap, cells = gridCells(n, { x: .05, y: .05, w: W - .1, h: H - .1 }, 1);
    return { bgs: solids(rng, ['#fef9c3', '#1f2937', '#fde68a', '#fff7ed', '#ecfeff']), slots: cells.map((c) => mkSlot(inset(c, g / 2), { shape: { type: 'hex' }, frame: frame(.005, '#f59e0b', 0) })) };
  }]);
  out.push(['Polaroid-muur', 'nette polaroids op hout', G[1], (n, W, H, rng, o) => {
    const g = .04 * o.gap, cells = gridCells(n, { x: .05, y: .05, w: W - .1, h: H - .1 }, .9);
    return { bgs: [{ type: 'pattern', kind: 'wood', color: '#c69c6d', color2: '#6b4423', size: .1 }, { type: 'pattern', kind: 'wood', color: '#e0c9a6', color2: '#8a6a3f', size: .1 }, grad('#e9edf2', '#cfd8e3'), grad('#1f2937', '#374151')], slots: cells.map((c) => mkSlot(inset(c, g / 2), { frame: frame(.01, '#fafafa', .6, .035) })) };
  }]);
  out.push(['Spotlight', 'één grote foto, de rest klein eronder', G[1], (n, W, H, rng, o) => {
    const g = .02 * o.gap, m = .05, heroH = (H - 2 * m) * .62, hero = { x: m, y: m, w: W - 2 * m, h: heroH - g };
    const rest = gridCells(n - 1, { x: m, y: m + heroH, w: W - 2 * m, h: H - 2 * m - heroH }, 1.2);
    return { bgs: [grad('#0f172a', '#1e1b4b', 180), grad('#111827', '#4c1d95', 160), grad('#000000', '#374151', 180)], decor: [{ type: 'ellipse', x: W / 2, y: m + heroH / 2, rx: W * .52, ry: heroH * .62, color: '#ffffff', alpha: .06 }],
      slots: [mkSlot(hero, { shape: rnd(.03), frame: frame(.007, '#ffffff', .8) })].concat(rest.map((c) => mkSlot(inset(c, g / 2), { shape: rnd(.08), frame: frame(.004, '#e2e8f0', .5) }))) };
  }]);
  out.push(['Tijdschrift', 'voorpagina met kop en kleine foto\'s', G[1], (n, W, H, rng, o) => {
    const g = .015 * o.gap, m = .04, land = W >= H * 1.1;
    let hero, side;
    if (land) { hero = { x: m, y: m, w: (W - 2 * m) * .62, h: H - 2 * m }; side = { x: m + hero.w + .02, y: m, w: W - 2 * m - hero.w - .02, h: H - 2 * m }; }
    else { hero = { x: m, y: m, w: W - 2 * m, h: (H - 2 * m) * .6 }; side = { x: m, y: m + hero.h + .02, w: W - 2 * m, h: H - 2 * m - hero.h - .02 }; }
    const rest = gridCells(n - 1, side, 1);
    const decor = [T(hero.x + hero.w / 2, hero.y + .06, 'MIJN LEVEN', .085, { color: '#ffffff', stroke: '#be123c', strokeW: .2, font: 'impact', maxw: hero.w * .9, over: true }), T(hero.x + hero.w / 2, hero.y + hero.h - .035, 'De mooiste momenten van dit jaar', .026, { color: '#ffffff', stroke: '#000000', strokeW: .2, maxw: hero.w * .9, over: true })];
    return { bgs: solids(rng, ['#ffffff', '#fef3c7', '#f1f5f9', '#fee2e2']), decor, slots: [mkSlot(hero)].concat(rest.map((c) => mkSlot(inset(c, g / 2), { shape: rnd(.04), frame: frame(.004, '#ffffff', .4) }))) };
  }]);
  out.push(['Fotokalender', 'kalenderblad met ringetjes', G[1], (n, W, H, rng, o) => {
    const g = .018 * o.gap, headH = .1, m = .05, cells = gridCells(n, { x: m, y: headH + .03, w: W - 2 * m, h: H - headH - .03 - m }, 1);
    const decor = [{ type: 'rect', x: 0, y: 0, w: W, h: headH, color: rng.pick(['#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']) }, T(W / 2, headH / 2 + .005, rng.pick(['JANUARI', 'MEI', 'JULI', 'OKTOBER', 'DECEMBER']), .05, { color: '#ffffff', maxw: W * .7, over: true })];
    for (let i = 0; i < 7; i++) decor.push({ type: 'circle', x: W * (.12 + i * .126), y: .018, r: .012, color: '#ffffff', stroke: '#475569', lw: .003, over: true });
    return { bgs: solids(rng, ['#ffffff', '#f8fafc', '#fff7ed']), decor, slots: cells.map((c) => mkSlot(inset(c, g / 2), { shape: rnd(.03) })) };
  }]);
  out.push(['Fotohokje', 'strookjes zoals uit een fotohokje', G[1], (n, W, H, rng, o) => {
    const per = 4, strips = Math.ceil(n / per), m = .05, g = .012 * o.gap, sw = Math.min((W - 2 * m) / strips - .03, (H - 2 * m) / per * .8), decor = [], slots = [];
    const totW = strips * sw + (strips - 1) * .03, x0 = (W - totW) / 2, cellH = (H - 2 * m) / per;
    let left = n;
    for (let s = 0; s < strips; s++) {
      const cnt = Math.min(per, Math.ceil(left / (strips - s))); left -= cnt;
      const sx = x0 + s * (sw + .03), ph = Math.min(cellH - g, (sw - .03) * .8), th = cnt * (ph + g) + .02;
      const sy = (H - th) / 2;
      decor.push({ type: 'rect', x: sx, y: sy, w: sw, h: th, color: '#ffffff', r: .02, shadow: .02 });
      for (let i = 0; i < cnt; i++) slots.push(mkSlot({ x: sx + .015, y: sy + .01 + i * (ph + g), w: sw - .03, h: ph }));
    }
    return { bgs: solids(rng, ['#fda4af', '#a5b4fc', '#fde68a', '#6ee7b7', '#111827']), decor, slots };
  }]);
  out.push(['Kleurrijke lijsten', 'elke foto een andere kleur lijst', G[1], (n, W, H, rng, o) => {
    const g = .03 * o.gap, cells = gridCells(n, { x: .05, y: .05, w: W - .1, h: H - .1 }, 1), pal = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6'];
    return { bgs: solids(rng, ['#ffffff', '#fffbeb', '#f0f9ff', '#111827']), slots: cells.map((c, i) => mkSlot(inset(c, g / 2), { frame: frame(.012, pal[(i + rng.int(0, 6)) % pal.length], .4) })) };
  }]);
  out.push(['Zigzag-rijen', 'rijen die op en neer golven', G[1], (n, W, H, rng, o) => {
    const g = .02 * o.gap, shift = .03, cells = gridCells(n, { x: .05, y: .05, w: W - .1, h: H - .1 }, 1);
    return { bgs: solids(rng, ['#ede9fe', '#ccfbf1', '#fef3c7', '#fce7f3']), slots: cells.map((c, i) => mkSlot(inset({ x: c.x, y: c.y + ((i % 2) ? shift / 2 : -shift / 2), w: c.w, h: c.h }, g / 2 + shift / 2), { shape: rnd(.1), frame: frame(.005, '#ffffff', .4) })) };
  }]);
  out.push(['Neon-nacht', 'donker met gloeiende lijsten', G[1], (n, W, H, rng, o) => {
    const g = .03 * o.gap, cells = gridCells(n, { x: .06, y: .06, w: W - .12, h: H - .12 }, 1), pal = ['#f0abfc', '#22d3ee', '#a3e635', '#fb7185', '#fde047'];
    const decor = [{ type: 'zigzag', x: .02, y: H - .03, w: W - .04, n: 24, amp: .008, color: '#22d3ee', glow: true, lw: .004 }, { type: 'zigzag', x: .02, y: .025, w: W - .04, n: 24, amp: .008, color: '#f0abfc', glow: true, lw: .004 }];
    return { bgs: [grad('#0a0014', '#3b0764', 170), grad('#020617', '#1e1b4b', 160), grad('#000000', '#0f172a', 180)], decor, slots: cells.map((c, i) => mkSlot(inset(c, g / 2), { shape: rnd(.06), frame: { w: .006, color: pal[i % pal.length], shadow: 0, glow: true } })) };
  }]);
  out.push(['Stickerfoto\'s', 'ronde stickers met dikke witte rand', G[1], (n, W, H, rng, o) => {
    const g = .04 * o.gap, cells = gridCells(n, { x: .06, y: .06, w: W - .12, h: H - .12 }, 1);
    return { bgs: [grad('#fde68a', '#fb7185', 150), grad('#a5f3fc', '#c4b5fd', 150), grad('#bbf7d0', '#fde68a', 150)], slots: cells.map((c) => mkSlot(inset(c, g / 2), { shape: { type: 'circle' }, frame: frame(.014, '#ffffff', .6) })) };
  }]);
  void RECT; void rowsFill; void clamp;
  return out;
}
