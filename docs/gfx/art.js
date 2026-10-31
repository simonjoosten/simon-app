// Iconen: 3D-PNG's (docs/art/3d/<naam>.png) met emoji-fallback. Werkt ook als de manifest leeg/deels/afwezig is.
// drawIcon(ctx, naam, x, y, size, {rot, shadow, alpha}): x,y = MIDDEN van het icoon, size = breedte/hoogte in px.
import { ICONS } from './icons.js?v=1';

let names = new Set();
let ver = 1;
// De manifest wordt gegenereerd door tools/blender/render_all.py; mag ontbreken.
export const ready = (async () => {
  try {
    const m = await import('../art/manifest.js?v=1');
    const A = m && m.ART3D;
    if (A && Array.isArray(A.names)) names = new Set(A.names);
    if (A && A.v) ver = A.v;
  } catch { /* geen manifest: alleen emoji's */ }
  return names;
})();
await ready;

const imgs = new Map(); // naam -> { img, ok, fail, p }
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function has(naam) { return names.has(naam); }
export function emoji(naam) { return ICONS[naam] || '❓'; }
export function iconUrl(naam) {
  if (!names.has(naam)) return null;
  return new URL('../art/3d/' + naam + '.png', import.meta.url).href + '?v=' + ver;
}

// HTML-string voor in innerHTML.
export function icon(naam, o = {}) {
  const size = o.size || 32, cls = o.cls ? ' ' + esc(o.cls) : '', alt = esc(o.alt != null ? o.alt : naam);
  const url = iconUrl(naam);
  if (url) {
    return `<img class="gfx-icon${cls}" src="${esc(url)}" width="${size}" height="${size}" alt="${alt}" draggable="false" loading="lazy" style="width:${size}px;height:${size}px;object-fit:contain;vertical-align:middle" onerror="this.outerHTML='&lt;span class=&quot;gfx-icon gfx-emoji&quot;&gt;'+${esc(JSON.stringify(emoji(naam)))}+'&lt;/span&gt;'">`;
  }
  return `<span class="gfx-icon gfx-emoji${cls}" role="img" aria-label="${alt}" style="display:inline-block;width:${size}px;height:${size}px;line-height:${size}px;font-size:${Math.round(size * 0.82)}px;text-align:center;vertical-align:middle">${emoji(naam)}</span>`;
}

function entry(naam) {
  let e = imgs.get(naam);
  if (e) return e;
  e = { img: null, ok: false, fail: false, p: null };
  imgs.set(naam, e);
  const url = iconUrl(naam);
  if (!url || typeof Image === 'undefined') { e.fail = true; e.p = Promise.resolve(e); return e; }
  e.p = new Promise((res) => {
    const im = new Image();
    im.onload = () => { e.ok = true; e.img = im; res(e); };
    im.onerror = () => { e.fail = true; res(e); };
    e.img = im;
    im.src = url;
  });
  return e;
}

// -> Promise<Map naam -> HTMLImageElement> (alleen wat echt geladen is)
export function preload(lijst) {
  return Promise.all((lijst || []).map((n) => entry(n).p.then((e) => [n, e]))).then((rs) => {
    const m = new Map();
    for (const [n, e] of rs) if (e.ok && e.img) m.set(n, e.img);
    return m;
  });
}

export function drawIcon(ctx, naam, x, y, size, o = {}) {
  const e = entry(naam);
  const a = o.alpha == null ? 1 : o.alpha;
  if (a <= 0) return;
  const prevA = ctx.globalAlpha;
  ctx.save();
  ctx.globalAlpha = prevA * a;
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  if (o.shadow) { // zachte vloerschaduw zonder blur
    ctx.save();
    ctx.globalAlpha *= 0.28;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.46, size * 0.36, size * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (e.ok && e.img) ctx.drawImage(e.img, -size / 2, -size / 2, size, size);
  else {
    ctx.font = Math.round(size * 0.82) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(emoji(naam), 0, size * 0.04);
  }
  ctx.restore();
}
