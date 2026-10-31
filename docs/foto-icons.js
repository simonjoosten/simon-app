// foto-icons.js - brug tussen de fotostudio en de gedeelde grafische kern (docs/gfx): 3D-iconen als stickers, werelden als kaders.
// Wordt lui geladen (dynamic import) door foto-edit, foto-collage-gen en foto-collage-free. Zet globalThis.__fotoIcon = drawIcon
// zodat canvas-code zonder imports (zoals foto-collage-styles.js) iconen kan tekenen.
import { ICONS } from './gfx/icons.js?v=1';
import { icon, iconUrl, drawIcon, preload, has } from './gfx/art.js?v=1';
import { Themes } from './gfx/themes.js?v=1';

globalThis.__fotoIcon = drawIcon;

// Categorieën volgens de volgorde in icons.js: elke categorie begint bij het eerste icoon dat hieronder staat.
const CAT_START = [['coin', 'Schatten'], ['apple', 'Eten'], ['fish', 'Dieren'], ['house', 'Gebouwen'], ['car', 'Voertuigen'], ['tree', 'Natuur'], ['dragon', 'Fantasie'], ['hammer', 'Muziek & werk']];
export function stickerCats(names = Object.keys(ICONS)) {
  const out = []; let cur = null;
  for (const n of names) {
    const hit = CAT_START.find((c) => c[0] === n);
    if (hit) { cur = { id: hit[1].toLowerCase().replace(/[^a-z]+/g, '-'), name: hit[1], items: [] }; out.push(cur); }
    if (cur) cur.items.push(n);
  }
  return out;
}
export const STICKER_CATS = stickerCats();
export const allStickerNames = () => STICKER_CATS.flatMap((c) => c.items);
export const stickerAvailable = (n) => has(n);
export const iconHtml = (n, size) => icon(n, { size, alt: n });
export const iconSrc = (n) => iconUrl(n);
export const iconEmoji = (n) => ICONS[n] || '\u2753';
export const ICON_ARRAY = Object.keys(ICONS);

export async function ensureIcons(names) { // wacht tot de PNG's klaar zijn zodat het canvas ze meteen kan tekenen
  try { await preload(names && names.length ? names : []); } catch { /* emoji-terugval */ }
  return true;
}
export const preloadIcons = (names) => preload(names || []);
export { drawIcon, has };

// werelden voor kaders / achtergronden
export const worlds = () => Themes.list.map((w) => ({ id: w.id, name: w.name, emoji: w.emoji, bg: w.bg, accent: w.accent, ground: w.ground, deco: w.deco, mood: w.mood }));

// Waar staan de iconen langs een rand? (zuiver, testbaar) -> [{x,y}] langs de rechthoek [x0,y0,x1,y1] met stapgrootte step
export function edgeSpots(x0, y0, x1, y1, step) {
  const pts = [], w = x1 - x0, h = y1 - y0;
  if (!(step > 0) || w <= 0 || h <= 0) return pts;
  const nx = Math.max(1, Math.round(w / step)), ny = Math.max(1, Math.round(h / step));
  for (let i = 0; i < nx; i++) { const x = x0 + (i + .5) * w / nx; pts.push({ x, y: y0 }, { x: x1 - (i + .5) * w / nx, y: y1 }); }
  for (let j = 0; j < ny; j++) { const y = y0 + (j + .5) * h / ny; pts.push({ x: x1, y }, { x: x0, y: y1 - (j + .5) * h / ny }); }
  return pts;
}

// Kaderdefinitie in het formaat van foto-edit.js ({id,name,icon,def,lay,draw}); helpers worden doorgegeven (layPad, putImg).
export function worldFrameDef(w, helpers) {
  const { layPad, putImg } = helpers;
  return {
    id: 'w-' + w.id, name: w.name, icon: w.emoji, def: w.accent, deco: w.deco, lay: layPad(2.4),
    draw(c, L, p, col, src) {
      const g = c.createLinearGradient(0, 0, L.W, L.H);
      w.bg.forEach((cl, i) => g.addColorStop(w.bg.length > 1 ? i / (w.bg.length - 1) : 0, cl));
      c.fillStyle = g; c.fillRect(0, 0, L.W, L.H);
      putImg(c, L, src);
      const lw = Math.max(2, p * .3), line = col && col !== 'transparent' ? col : w.accent;
      c.strokeStyle = line; c.lineWidth = lw; c.strokeRect(L.ix - lw / 2, L.iy - lw / 2, L.iw + lw, L.ih + lw);
      const sz = Math.max(10, L.ix * 1.35), pts = edgeSpots(L.ix * .5, L.iy * .5, L.W - L.ix * .5, L.H - L.iy * .5, sz * 1.05);
      pts.forEach((pt, i) => drawIcon(c, w.deco[i % w.deco.length], pt.x, pt.y, sz, { rot: ((i % 5) - 2) * .09 }));
    },
  };
}
