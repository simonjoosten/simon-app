// Fotocollage-stijlen: pure geometrie + tekenhelpers (geen UI). 50 stijlen die elk een complete indeling genereren.
//
// STYLES[i].make(n, ratio, rng, opts) -> { bg, bgs, decor, slots, look }
//   n     = aantal foto's dat de gebruiker vult (4, 6, 8, 10, 12, 15)
//   ratio = breedte / hoogte van het canvas (1, 0.8, 0.5625, 1.5)
//   rng   = makeRng(seed)
//   opts  = { gap: 1 (ruimte-factor 0..2), text: '' (alleen voor de letter-stijl) }
// slot  = { x, y, w, h (0..1 van breedte/hoogte, buitenrand incl. lijst), rot (graden), shape, frame, z,
//           copyOf?, mirror?, rotPhoto?, filter? }
//   De foto zit BINNEN de lijst: frame = { w, b, color, shadow, glow } (w = zijkant/boven, b = extra onderkant, als fractie van de BREEDTE).
//   Slots zonder copyOf zijn de n "originele" vakjes (altijd eerst in de lijst); copyOf wijst naar een eerder slot.
// decor = tekenopdrachten in "eenheidsruimte": x in 0..ratio, y in 0..1, alle maten in eenheden van de canvashoogte.
//   item.over = true tekent boven de foto's; drawDecor(ctx, decor, w, h, over).

const TAU = Math.PI * 2, RAD = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ------------------------------------------------------------------ rng */
export function makeRng(seed) {
  let a = (Math.floor(Number(seed)) >>> 0) || 1;
  const r = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.range = (lo, hi) => lo + (hi - lo) * r();
  r.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * r());
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.sign = () => (r() < .5 ? -1 : 1);
  r.chance = (p) => r() < p;
  r.shuffle = (arr) => { const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = b[i]; b[i] = b[j]; b[j] = t; } return b; };
  return r;
}

/* ------------------------------------------------------------------ vormen */
function normPoly(p) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  p.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
  return p.map(([x, y]) => [(x - x0) / (x1 - x0), (y - y0) / (y1 - y0)]);
}
const starPts = (k, rin) => { const o = []; for (let i = 0; i < k * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / k, r = i % 2 ? rin : .5; o.push([Math.cos(a) * r, Math.sin(a) * r]); } return o; };
const HEART = normPoly(Array.from({ length: 180 }, (_, i) => { const t = i / 180 * TAU; return [16 * Math.pow(Math.sin(t), 3), -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]; }));
const POLYS = {
  heart: HEART,
  star: normPoly(starPts(5, .21)),
  sun: normPoly(starPts(12, .36)),
  hex: [[.5, 0], [1, .25], [1, .75], [.5, 1], [0, .75], [0, .25]],
  diamond: [[.5, 0], [1, .5], [.5, 1], [0, .5]],
  triangle: [[.5, 0], [1, 1], [0, 1]],
};

function rr(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  if (r < .5) { c.rect(x, y, w, h); return; }
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
// ellips (tegen de klok in, zodat vereniging via nonzero-winding werkt)
function ellPath(c, cx, cy, rx, ry, rot) { c.save(); c.translate(cx, cy); c.rotate(rot || 0); c.scale(Math.max(rx, 1e-6), Math.max(ry, 1e-6)); c.moveTo(1, 0); c.arc(0, 0, 1, 0, TAU, true); c.closePath(); c.restore(); }
function rectCCW(c, x, y, w, h) { c.moveTo(x, y); c.lineTo(x, y + h); c.lineTo(x + w, y + h); c.lineTo(x + w, y); c.closePath(); }
function polyPath(c, pts, x, y, w, h, flip) { pts.forEach(([px, py], i) => { const X = x + px * w, Y = y + (flip ? 1 - py : py) * h; if (i) c.lineTo(X, Y); else c.moveTo(X, Y); }); c.closePath(); }

// samengestelde vormen uit ellipsen [cx,cy,rx,ry,rot(rad)] en rechthoeken {r:[x,y,w,h]} in ontwerpruimte
function defBlob(list) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  list.forEach((it) => {
    if (it.r) { add(it.r[0], it.r[1]); add(it.r[0] + it.r[2], it.r[1] + it.r[3]); return; }
    const [cx, cy, rx, ry, rot = 0] = it;
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, px = Math.cos(a) * rx, py = Math.sin(a) * ry; add(cx + px * Math.cos(rot) - py * Math.sin(rot), cy + px * Math.sin(rot) + py * Math.cos(rot)); }
  });
  return { list, bb: [x0, y0, x1, y1], ar: (x1 - x0) / (y1 - y0) };
}
function blobPath(c, B, x, y, w, h) {
  const [x0, y0, x1, y1] = B.bb;
  c.save(); c.translate(x, y); c.scale(w / (x1 - x0), h / (y1 - y0)); c.translate(-x0, -y0);
  B.list.forEach((it) => { if (it.r) rectCCW(c, it.r[0], it.r[1], it.r[2], it.r[3]); else ellPath(c, it[0], it[1], it[2], it[3], it[4]); });
  c.restore();
}
function blobHas(B, u, v) {
  const [x0, y0, x1, y1] = B.bb, X = x0 + u * (x1 - x0), Y = y0 + v * (y1 - y0);
  return B.list.some((it) => {
    if (it.r) return X >= it.r[0] && X <= it.r[0] + it.r[2] && Y >= it.r[1] && Y <= it.r[1] + it.r[3];
    const [cx, cy, rx, ry, rot = 0] = it, dx = X - cx, dy = Y - cy, a = dx * Math.cos(rot) + dy * Math.sin(rot), b = -dx * Math.sin(rot) + dy * Math.cos(rot);
    return (a / rx) * (a / rx) + (b / ry) * (b / ry) <= 1;
  });
}
const flowerList = () => { const l = [[.5, .5, .2, .2]]; for (let i = 0; i < 6; i++) { const a = i * TAU / 6; l.push([.5 + Math.cos(a) * .27, .5 + Math.sin(a) * .27, .24, .15, a]); } return l; };
const BLOBS = {
  cloud: defBlob([[.40, .66, .24, .24], [.78, .48, .33, .33], [1.14, .62, .26, .26], [1.38, .74, .16, .16], { r: [.40, .64, .98, .26] }]),
  butterfly: defBlob([[.27, .31, .27, .17, .6], [.73, .31, .27, .17, -.6], [.33, .7, .2, .14, -.6], [.67, .7, .2, .14, .6], [.5, .52, .035, .3, 0]]),
  flower: defBlob(flowerList()),
  paw: defBlob([[.5, .72, .27, .21, 0], [.33, .64, .13, .11, .5], [.67, .64, .13, .11, -.5], [.15, .43, .1, .14, -.45], [.37, .2, .105, .15, -.15], [.63, .2, .105, .15, .15], [.85, .43, .1, .14, .45]]),
};
export const SHAPE_AR = { rect: 1, round: 1, circle: 1, heart: 1.1, star: 1, sun: 1, hex: .866, diamond: .72, triangle: 1.15, drop: .78, cloud: BLOBS.cloud.ar, flower: 1, moon: 1, paw: BLOBS.paw.ar, butterfly: BLOBS.butterfly.ar };

// 5x7 pixellettertype voor "Jouw letter of cijfer"
const FONT = {
  A: '01110,10001,10001,11111,10001,10001,10001', B: '11110,10001,10001,11110,10001,10001,11110', C: '01110,10001,10000,10000,10000,10001,01110',
  D: '11110,10001,10001,10001,10001,10001,11110', E: '11111,10000,10000,11110,10000,10000,11111', F: '11111,10000,10000,11110,10000,10000,10000',
  G: '01110,10001,10000,10111,10001,10001,01111', H: '10001,10001,10001,11111,10001,10001,10001', I: '01110,00100,00100,00100,00100,00100,01110',
  J: '00111,00010,00010,00010,00010,10010,01100', K: '10001,10010,10100,11000,10100,10010,10001', L: '10000,10000,10000,10000,10000,10000,11111',
  M: '10001,11011,10101,10101,10001,10001,10001', N: '10001,11001,10101,10011,10001,10001,10001', O: '01110,10001,10001,10001,10001,10001,01110',
  P: '11110,10001,10001,11110,10000,10000,10000', Q: '01110,10001,10001,10001,10101,10010,01101', R: '11110,10001,10001,11110,10100,10010,10001',
  S: '01111,10000,10000,01110,00001,00001,11110', T: '11111,00100,00100,00100,00100,00100,00100', U: '10001,10001,10001,10001,10001,10001,01110',
  V: '10001,10001,10001,10001,10001,01010,00100', W: '10001,10001,10001,10101,10101,11011,10001', X: '10001,10001,01010,00100,01010,10001,10001',
  Y: '10001,10001,01010,00100,00100,00100,00100', Z: '11111,00001,00010,00100,01000,10000,11111',
  0: '01110,10001,10011,10101,11001,10001,01110', 1: '00100,01100,00100,00100,00100,00100,01110', 2: '01110,10001,00001,00010,00100,01000,11111',
  3: '11110,00001,00001,01110,00001,00001,11110', 4: '00010,00110,01010,10010,11111,00010,00010', 5: '11111,10000,11110,00001,00001,10001,01110',
  6: '00110,01000,10000,11110,10001,10001,01110', 7: '11111,00001,00010,00100,01000,01000,01000', 8: '01110,10001,10001,01110,10001,10001,01110',
  9: '01110,10001,10001,01111,00001,00010,01100', '!': '00100,00100,00100,00100,00100,00000,00100', '?': '01110,10001,00001,00010,00100,00000,00100',
  '+': '00000,00100,00100,11111,00100,00100,00000', '♥': '01010,11111,11111,11111,01110,00100,00000', '&': '01100,10010,10100,01000,10101,10010,01101',
};
const glyph = (ch) => (FONT[ch] || FONT[String(ch).toUpperCase()] || '').split(',');
const glyphCells = (ch) => { const rows = glyph(ch), out = []; rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === '1') out.push([x, y]); }); return out; };
const cleanText = (t) => Array.from(String(t || '').toUpperCase()).filter((ch) => FONT[ch]).slice(0, 3);

function puzzleEdge(c, ax, ay, bx, by, nx, ny, k, e) {
  if (!k) { c.lineTo(bx, by); return; }
  const dx = bx - ax, dy = by - ay, P = (t, hh) => [ax + dx * t + nx * k * e * hh, ay + dy * t + ny * k * e * hh];
  c.lineTo(...P(.38, 0));
  c.bezierCurveTo(...P(.40, .15), ...P(.30, .30), ...P(.30, .60));
  c.bezierCurveTo(...P(.30, 1.0), ...P(.70, 1.0), ...P(.70, .60));
  c.bezierCurveTo(...P(.70, .30), ...P(.60, .15), ...P(.62, 0));
  c.lineTo(bx, by);
}

export function shapePath(c, s, x, y, w, h) {
  c.beginPath();
  const t = (s && s.type) || 'rect';
  switch (t) {
    case 'round': rr(c, x, y, w, h, (s.r == null ? .12 : s.r) * Math.min(w, h)); break;
    case 'circle': ellPath(c, x + w / 2, y + h / 2, w / 2, h / 2, 0); break;
    case 'heart': case 'star': case 'sun': case 'hex': case 'diamond': polyPath(c, POLYS[t], x, y, w, h); break;
    case 'triangle': polyPath(c, POLYS.triangle, x, y, w, h, !!s.flip); break;
    case 'cloud': case 'butterfly': case 'flower': case 'paw': blobPath(c, BLOBS[t], x, y, w, h); break;
    case 'drop':
      c.moveTo(x + w * .5, y); c.bezierCurveTo(x + w * .58, y + h * .18, x + w * .86, y + h * .4, x + w * .86, y + h * .64);
      c.bezierCurveTo(x + w * .86, y + h * .86, x + w * .7, y + h, x + w * .5, y + h); c.bezierCurveTo(x + w * .3, y + h, x + w * .14, y + h * .86, x + w * .14, y + h * .64);
      c.bezierCurveTo(x + w * .14, y + h * .4, x + w * .42, y + h * .18, x + w * .5, y); c.closePath(); break;
    case 'moon': { // maan: buitencirkel min binnencirkel
      const R = .5, r = .4, d = .22, xi = (d * d + R * R - r * r) / (2 * d), yi = Math.sqrt(R * R - xi * xi), al = Math.atan2(yi, xi), be = Math.atan2(yi, xi - d);
      c.save(); c.translate(x + w * .5, y + h * .5); c.scale(w, h); c.arc(0, 0, R, -al, al, true); c.arc(d, 0, r, be, -be, false); c.closePath(); c.restore(); break;
    }
    case 'blob': { // organische vorm (vaste seed)
      const rg = makeRng(s.seed || 3), N = 9, pts = [];
      for (let i = 0; i < N; i++) { const a = i / N * TAU, rad = .38 + rg() * .12; pts.push([x + w * (.5 + Math.cos(a) * rad), y + h * (.5 + Math.sin(a) * rad)]); }
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const m0 = mid(pts[N - 1], pts[0]); c.moveTo(m0[0], m0[1]);
      for (let i = 0; i < N; i++) { const m = mid(pts[i], pts[(i + 1) % N]); c.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
      c.closePath(); break;
    }
    case 'puzzle': {
      const ex = s.ex * w, ey = s.ey * h, ix = x + ex, iy = y + ey, iw = w - 2 * ex, ih = h - 2 * ey, kn = s.kn;
      c.moveTo(ix, iy);
      puzzleEdge(c, ix, iy, ix + iw, iy, 0, -1, kn[0], ey); puzzleEdge(c, ix + iw, iy, ix + iw, iy + ih, 1, 0, kn[1], ex);
      puzzleEdge(c, ix + iw, iy + ih, ix, iy + ih, 0, 1, kn[2], ey); puzzleEdge(c, ix, iy + ih, ix, iy, -1, 0, kn[3], ex); c.closePath(); break;
    }
    case 'cells': (s.cells || []).forEach((q) => c.rect(x + q[0] * w, y + q[1] * h, q[2] * w, q[3] * h)); break;
    case 'letter': { // blokletter in het vak
      const rows = glyph(s.ch || 'A'); if (rows.length === 7) { const cw = w / 5, chh = h / 7; rows.forEach((row, j) => { for (let i = 0; i < 5; i++) if (row[i] === '1') c.rect(x + i * cw, y + j * chh, cw, chh); }); }
      break;
    }
    default: c.rect(x, y, w, h);
  }
}
// clip: bij 'cells' met mask eerst de cellen, dan de masker-vorm (doorsnede)
export function clipShape(c, s, x, y, w, h) {
  shapePath(c, s, x, y, w, h); c.clip();
  if (s && s.type === 'cells' && s.mask) { const m = s.mask; shapePath(c, m, x + m.rx * w, y + m.ry * h, m.rw * w, m.rh * h); c.clip(); }
}
export function shapeContains(c, s, x, y, w, h, px, py) {
  if (!s || s.type === 'rect' || !s.type) return px >= x && px <= x + w && py >= y && py <= y + h;
  shapePath(c, s, x, y, w, h); let ok = c.isPointInPath(px, py);
  if (ok && s.type === 'cells' && s.mask) { const m = s.mask; shapePath(c, m, x + m.rx * w, y + m.ry * h, m.rw * w, m.rh * h); ok = c.isPointInPath(px, py); }
  return ok;
}

/* ------------------------------------------------------------------ kleurfilters */
export const FILTERS = [['none', 'Normaal'], ['bw', 'Zwart-wit'], ['sepia', 'Sepia'], ['warm', 'Warm'], ['cool', 'Koel'], ['vivid', 'Levendig'], ['fade', 'Zacht'], ['pop1', 'Pop paars'], ['pop2', 'Pop blauw'], ['pop3', 'Pop rood'], ['pop4', 'Pop groen']];
const POP = { pop1: [[30, 10, 80], [255, 60, 150], [255, 230, 80]], pop2: [[10, 40, 70], [0, 180, 200], [255, 250, 200]], pop3: [[60, 10, 10], [230, 60, 40], [255, 220, 120]], pop4: [[5, 40, 30], [40, 190, 110], [240, 255, 160]] };
export function applyFilter(c, W, H, kind) {
  if (!kind || kind === 'none' || W < 1 || H < 1) return;
  let img; try { img = c.getImageData(0, 0, W, H); } catch (e) { return; }
  const d = img.data, pop = POP[kind];
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    let r = d[i], g = d[i + 1], b = d[i + 2];
    if (pop) {
      const t = (.299 * r + .587 * g + .114 * b) / 255, a = t < .5 ? pop[0] : pop[1], z = t < .5 ? pop[1] : pop[2], f = t < .5 ? t * 2 : (t - .5) * 2;
      r = a[0] + (z[0] - a[0]) * f; g = a[1] + (z[1] - a[1]) * f; b = a[2] + (z[2] - a[2]) * f;
    } else if (kind === 'bw') { const y = .299 * r + .587 * g + .114 * b; r = g = b = y; }
    else if (kind === 'sepia') { const nr = .393 * r + .769 * g + .189 * b, ng = .349 * r + .686 * g + .168 * b, nb = .272 * r + .534 * g + .131 * b; r = nr; g = ng; b = nb; }
    else if (kind === 'warm') { r = r * 1.08 + 8; g = g * 1.02; b = b * .88; }
    else if (kind === 'cool') { r = r * .9; g = g * 1.02; b = b * 1.1 + 8; }
    else if (kind === 'vivid') { const y = .299 * r + .587 * g + .114 * b; r = y + (r - y) * 1.45; g = y + (g - y) * 1.45; b = y + (b - y) * 1.45; r = (r - 128) * 1.08 + 128; g = (g - 128) * 1.08 + 128; b = (b - 128) * 1.08 + 128; }
    else if (kind === 'fade') { r = r * .85 + 36; g = g * .85 + 36; b = b * .85 + 40; }
    d[i] = r < 0 ? 0 : r > 255 ? 255 : r; d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g; d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
  c.putImageData(img, 0, 0);
}

/* ------------------------------------------------------------------ achtergrond */
export function drawBackground(c, bg, w, h) {
  bg = bg || { type: 'solid', color: '#ffffff' };
  c.save();
  if (bg.type === 'gradient') {
    const stops = bg.stops || [[0, bg.from || '#fff'], [1, bg.to || '#ddd']];
    let g;
    if (bg.radial) g = c.createRadialGradient(w / 2, h * .4, 0, w / 2, h * .4, Math.max(w, h) * .8);
    else { const a = (bg.angle == null ? 180 : bg.angle) * RAD, dx = Math.sin(a), dy = -Math.cos(a), L = (Math.abs(w * dx) + Math.abs(h * dy)) / 2; g = c.createLinearGradient(w / 2 - dx * L, h / 2 - dy * L, w / 2 + dx * L, h / 2 + dy * L); }
    stops.forEach(([p, col]) => g.addColorStop(p, col)); c.fillStyle = g; c.fillRect(0, 0, w, h);
  } else if (bg.type === 'pattern') {
    c.fillStyle = bg.color || '#fff'; c.fillRect(0, 0, w, h);
    const s = (bg.size || .05) * h, c2 = bg.color2 || 'rgba(0,0,0,.1)', rg = makeRng(7);
    c.fillStyle = c2; c.strokeStyle = c2;
    switch (bg.kind) {
      case 'dots': for (let y = 0, j = 0; y < h + s; y += s, j++) for (let x = (j % 2) * s / 2; x < w + s; x += s) { c.beginPath(); c.arc(x, y, s * .17, 0, TAU); c.fill(); } break;
      case 'stripes': { const dg = Math.hypot(w, h); c.translate(w / 2, h / 2); c.rotate((bg.angle == null ? 45 : bg.angle) * RAD); for (let x = -dg; x < dg; x += s * 2) c.fillRect(x, -dg, s, dg * 2); break; }
      case 'grid': c.lineWidth = Math.max(1, s * .05); c.beginPath(); for (let x = 0; x <= w; x += s) { c.moveTo(x, 0); c.lineTo(x, h); } for (let y = 0; y <= h; y += s) { c.moveTo(0, y); c.lineTo(w, y); } c.stroke(); break;
      case 'checker': for (let y = 0, j = 0; y < h; y += s, j++) for (let x = 0, i = 0; x < w; x += s, i++) if ((i + j) % 2) c.fillRect(x, y, s, s); break;
      case 'wood': {
        let j = 0;
        for (let y = 0; y < h; y += s, j++) {
          c.globalAlpha = j % 2 ? .5 : .22; c.fillStyle = c2; c.fillRect(0, y, w, s);
          c.globalAlpha = .35; c.lineWidth = Math.max(1, s * .02); c.strokeStyle = c2;
          for (let q = 0; q < 3; q++) { c.beginPath(); const yy = y + s * (.2 + q * .27) + rg() * s * .05; for (let x = 0; x <= w; x += w / 24) c.lineTo(x, yy + Math.sin(x / w * (5 + j) + j) * s * .04); c.stroke(); }
          c.globalAlpha = .6; c.fillStyle = '#000'; c.fillRect(0, y, w, Math.max(1, s * .03));
        }
        break;
      }
      case 'cork': c.globalAlpha = .55; for (let i = 0; i < w * h / (s * s) * 60; i++) { const r = s * (.02 + rg() * .06); c.fillStyle = rg() < .5 ? c2 : 'rgba(255,230,180,.7)'; c.beginPath(); c.arc(rg() * w, rg() * h, r, 0, TAU); c.fill(); } break;
      case 'paper': c.globalAlpha = .16; for (let i = 0; i < w * h / (s * s) * 25; i++) { c.fillStyle = rg() < .5 ? c2 : '#fff'; c.fillRect(rg() * w, rg() * h, s * .05, s * .05); } break;
      case 'halftone': for (let y = s / 2; y < h; y += s) for (let x = s / 2 + ((y / s | 0) % 2) * s / 2; x < w; x += s) { c.beginPath(); c.arc(x, y, s * .42 * (1 - y / h * .85), 0, TAU); c.fill(); } break;
      case 'synth': {
        const hz = h * .56; c.lineWidth = Math.max(1, h * .0035); c.globalAlpha = .9;
        for (let i = 0; i <= 12; i++) { const t = i / 12, y = hz + (h - hz) * t * t; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
        for (let k = -10; k <= 10; k++) { c.beginPath(); c.moveTo(w / 2 + k * w * .02, hz); c.lineTo(w / 2 + k * w * .16, h); c.stroke(); }
        break;
      }
      default: break;
    }
  } else { c.fillStyle = bg.color || '#fff'; c.fillRect(0, 0, w, h); }
  c.restore();
}

/* ------------------------------------------------------------------ decoratie */
const FONTS = { sans: 'system-ui,-apple-system,"Segoe UI",sans-serif', serif: 'Georgia,"Times New Roman",serif', hand: '"Bradley Hand","Segoe Script","Marker Felt","Comic Sans MS",cursive', mono: 'ui-monospace,Menlo,Consolas,monospace', impact: 'Impact,"Arial Black","Helvetica Neue",sans-serif', emoji: '"Apple Color Emoji","Segoe UI Emoji",sans-serif' };
const al = (c, d, def) => { const a = d.alpha == null ? def : d.alpha; if (a != null) c.globalAlpha = a; };
const spin = (c, x, y, rot) => { if (rot) { c.translate(x, y); c.rotate(rot * RAD); c.translate(-x, -y); } };
const inAvoid = (av, x, y) => (av || []).some((a) => x > a.x && x < a.x + a.w && y > a.y && y < a.y + a.h);
function stroker(c, d, u, col) { if (d.stroke) { c.strokeStyle = d.stroke; c.lineWidth = (d.lw || .003) * u; if (d.dash) c.setLineDash(d.dash.map((v) => v * u)); c.stroke(); } if (col && d.color) { c.fillStyle = d.color; c.fill(); } }

const DECOR = {
  rect(c, d, u) {
    al(c, d); const x = d.x * u, y = d.y * u, w = d.w * u, h = d.h * u; spin(c, x + w / 2, y + h / 2, d.rot);
    c.beginPath(); rr(c, x, y, w, h, (d.r || 0) * Math.min(w, h));
    if (d.shadow) { c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = d.shadow * u; c.shadowOffsetY = d.shadow * u * .4; }
    if (d.color) { c.fillStyle = d.color; c.fill(); } c.shadowColor = 'transparent'; stroker(c, d, u);
  },
  circle(c, d, u) { al(c, d); c.beginPath(); c.arc(d.x * u, d.y * u, d.r * u, 0, TAU); stroker(c, d, u, true); },
  ellipse(c, d, u) { al(c, d); c.beginPath(); ellPath(c, d.x * u, d.y * u, d.rx * u, d.ry * u, (d.rot || 0) * RAD); stroker(c, d, u, true); },
  line(c, d, u) { al(c, d); c.beginPath(); c.moveTo(d.x1 * u, d.y1 * u); if (d.sag) c.quadraticCurveTo((d.x1 + d.x2) * u / 2, ((d.y1 + d.y2) / 2 + d.sag) * u, d.x2 * u, d.y2 * u); else c.lineTo(d.x2 * u, d.y2 * u); c.strokeStyle = d.color || '#000'; c.lineWidth = (d.lw || .003) * u; c.lineCap = d.cap || 'round'; if (d.dash) c.setLineDash(d.dash.map((v) => v * u)); c.stroke(); },
  polygon(c, d, u) { al(c, d); c.beginPath(); d.pts.forEach((p, i) => (i ? c.lineTo(p[0] * u, p[1] * u) : c.moveTo(p[0] * u, p[1] * u))); c.closePath(); stroker(c, d, u, true); },
  text(c, d, u) {
    al(c, d); c.font = `${d.italic ? 'italic ' : ''}${d.weight || 700} ${d.size * u}px ${FONTS[d.font || 'sans']}`; c.textAlign = d.align || 'center'; c.textBaseline = d.base || 'middle';
    c.translate(d.x * u, d.y * u); if (d.rot) c.rotate(d.rot * RAD);
    if (d.shadow) { c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = d.size * u * .12; c.shadowOffsetY = d.size * u * .05; }
    const mw = d.maxw ? d.maxw * u : undefined;
    if (d.stroke) { c.lineJoin = 'round'; c.strokeStyle = d.stroke; c.lineWidth = (d.strokeW || .12) * d.size * u; c.strokeText(d.t, 0, 0, mw); }
    c.fillStyle = d.color || '#111'; c.fillText(d.t, 0, 0, mw);
  },
  emoji(c, d, u) { al(c, d); c.font = `${d.s * u}px ${FONTS.emoji}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.translate(d.x * u, d.y * u); if (d.rot) c.rotate(d.rot * RAD); c.fillText(d.e, 0, 0); },
  scatter(c, d, u, W, H) {
    const rg = makeRng(d.seed || 1), a = d.area || { x: 0, y: 0, w: W / u, h: 1 }; al(c, d);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let i = 0, t = 0; i < d.n && t < d.n * 8; t++) {
      const x = a.x + rg() * a.w, y = a.y + rg() * a.h, s = d.size[0] + rg() * (d.size[1] - d.size[0]), rot = (rg() - .5) * 2 * (d.rotMax == null ? 40 : d.rotMax), e = d.emojis[Math.floor(rg() * d.emojis.length)];
      if (inAvoid(d.avoid, x, y)) continue; i++;
      c.save(); c.translate(x * u, y * u); c.rotate(rot * RAD);
      if (d.shape) { const sz = s * u; shapePath(c, { type: d.shape }, -sz / 2, -sz / 2, sz * (SHAPE_AR[d.shape] || 1), sz); c.fillStyle = d.colors ? d.colors[Math.floor(rg() * d.colors.length)] : (d.color || '#f9a8d4'); c.globalAlpha = (d.alpha == null ? 1 : d.alpha) * (.5 + rg() * .5); c.fill(); }
      else { c.font = `${s * u}px ${FONTS.emoji}`; c.fillText(e, 0, 0); }
      c.restore();
    }
  },
  confetti(c, d, u, W, H) {
    const rg = makeRng(d.seed || 1), a = d.area || { x: 0, y: 0, w: W / u, h: 1 }, cols = d.colors || ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];
    for (let i = 0, t = 0; i < d.n && t < d.n * 6; t++) {
      const x = a.x + rg() * a.w, y = a.y + rg() * a.h; if (inAvoid(d.avoid, x, y)) continue; i++;
      const s = (d.size || .014) * (.6 + rg() * .8); c.save(); c.translate(x * u, y * u); c.rotate(rg() * TAU); c.fillStyle = cols[Math.floor(rg() * cols.length)]; c.globalAlpha = d.alpha == null ? 1 : d.alpha;
      const k = rg();
      if (k < .4) c.fillRect(-s * u, -s * u * .4, s * 2 * u, s * .8 * u); else if (k < .75) { c.beginPath(); c.arc(0, 0, s * u * .7, 0, TAU); c.fill(); } else { c.lineWidth = s * u * .45; c.strokeStyle = c.fillStyle; c.beginPath(); c.moveTo(-s * u, 0); c.bezierCurveTo(-s * u * .3, -s * u, s * u * .3, s * u, s * u, 0); c.stroke(); }
      c.restore();
    }
  },
  shape(c, d, u) {
    al(c, d); const x = d.x * u, y = d.y * u, w = d.w * u, h = d.h * u; spin(c, x + w / 2, y + h / 2, d.rot);
    if (d.shadow) { c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = d.shadow * u; c.shadowOffsetY = d.shadow * u * .4; }
    shapePath(c, d.shape, x, y, w, h); if (d.color) { c.fillStyle = d.color; c.fill(); } c.shadowColor = 'transparent'; stroker(c, d, u);
  },
  bunting(c, d, u) {
    const cols = d.colors || ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'], N = d.n || 10, s = (d.size || .05) * u;
    const P = (t) => { const x = d.x1 + (d.x2 - d.x1) * t, y = d.y1 + (d.y2 - d.y1) * t + 4 * d.sag * t * (1 - t) * .5; return [x * u, y * u]; };
    c.beginPath(); for (let i = 0; i <= 40; i++) { const p = P(i / 40); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); } c.strokeStyle = d.line || '#6b4f3a'; c.lineWidth = Math.max(1, s * .06); c.stroke();
    for (let i = 0; i < N; i++) { const p = P((i + .5) / N); c.beginPath(); c.moveTo(p[0] - s * .5, p[1]); c.lineTo(p[0] + s * .5, p[1]); c.lineTo(p[0], p[1] + s * 1.05); c.closePath(); c.fillStyle = cols[i % cols.length]; c.fill(); }
  },
  balloon(c, d, u) {
    const r = d.r * u, x = d.x * u, y = d.y * u; c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = Math.max(1, r * .05); c.beginPath(); c.moveTo(x, y + r * 1.25); c.bezierCurveTo(x - r * .3, y + r * 1.9, x + r * .3, y + r * 2.4, x, y + r * 3.2); c.stroke();
    c.beginPath(); ellPath(c, x, y, r, r * 1.2, 0); c.fillStyle = d.color || '#f43f5e'; c.fill();
    c.beginPath(); c.moveTo(x, y + r * 1.2); c.lineTo(x - r * .14, y + r * 1.42); c.lineTo(x + r * .14, y + r * 1.42); c.closePath(); c.fill();
    c.beginPath(); ellPath(c, x - r * .35, y - r * .45, r * .17, r * .3, .5); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill();
  },
  tape(c, d, u) {
    al(c, d, .78); const w = d.w * u, h = d.h * u, t = h / 4; c.translate(d.x * u, d.y * u); c.rotate((d.rot || 0) * RAD);
    c.beginPath(); c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2, -h / 2);
    for (let i = 1; i <= 4; i++) c.lineTo(w / 2 - (i % 2 ? t * .5 : 0), -h / 2 + i * t);
    c.lineTo(-w / 2, h / 2); for (let i = 3; i >= 1; i--) c.lineTo(-w / 2 + (i % 2 ? t * .5 : 0), -h / 2 + i * t); c.closePath();
    c.fillStyle = d.color || '#fbbf24'; c.fill();
    c.save(); c.clip(); c.fillStyle = 'rgba(255,255,255,.55)';
    if (d.pattern === 'stripes') for (let x = -w; x < w; x += h * .7) { c.save(); c.translate(x, 0); c.rotate(.6); c.fillRect(0, -h * 2, h * .3, h * 4); c.restore(); }
    else if (d.pattern === 'dots') for (let x = -w / 2 + h * .4; x < w / 2; x += h * .6) for (let y = -h / 2 + h * .25; y < h / 2; y += h * .5) { c.beginPath(); c.arc(x, y, h * .09, 0, TAU); c.fill(); }
    c.restore();
  },
  pin(c, d, u) {
    const x = d.x * u, y = d.y * u, r = d.r * u; c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = r * .8; c.shadowOffsetY = r * .5;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = d.color || '#ef4444'; c.fill(); c.shadowColor = 'transparent';
    c.beginPath(); c.arc(x - r * .3, y - r * .3, r * .32, 0, TAU); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill();
  },
  stamp(c, d, u) {
    al(c, d, .8); const r = d.r * u; c.translate(d.x * u, d.y * u); c.rotate((d.rot || 0) * RAD); c.strokeStyle = d.color || '#7f1d1d'; c.fillStyle = c.strokeStyle; c.lineWidth = Math.max(1, r * .07);
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.lineWidth = Math.max(1, r * .035); c.beginPath(); c.arc(0, 0, r * .84, 0, TAU); c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `800 ${r * .3}px ${FONTS.sans}`; c.fillText(d.t || 'GROETEN', 0, -r * .12, r * 1.4); c.font = `700 ${r * .22}px ${FONTS.sans}`; c.fillText(d.sub || '', 0, r * .3, r * 1.4);
    if (d.waves) { c.lineWidth = Math.max(1, r * .06); for (let k = -1; k <= 2; k++) { c.beginPath(); for (let i = 0; i <= 16; i++) { const x = r * 1.05 + i * r * .1, y = k * r * .3 - r * .15 + Math.sin(i * .9) * r * .08; if (i) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke(); } }
  },
  postage(c, d, u) {
    const w = d.w * u, h = d.h * u, x = d.x * u, y = d.y * u; c.translate(x, y); c.rotate((d.rot || 0) * RAD); c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = h * .06; c.shadowOffsetY = h * .03;
    const nh = Math.max(4, Math.round(w / (h * .12))), nv = Math.max(4, Math.round(h / (h * .12))), pw = w / nh, ph = h / nv, rx = pw * .36, ry = ph * .36; c.beginPath(); c.moveTo(-w / 2, -h / 2);
    for (let i = 0; i < nh; i++) c.arc(-w / 2 + pw * (i + .5), -h / 2, rx, Math.PI, 0, true);
    for (let i = 0; i < nv; i++) c.arc(w / 2, -h / 2 + ph * (i + .5), ry, -Math.PI / 2, Math.PI / 2, true);
    for (let i = 0; i < nh; i++) c.arc(w / 2 - pw * (i + .5), h / 2, rx, 0, Math.PI, true);
    for (let i = 0; i < nv; i++) c.arc(-w / 2, h / 2 - ph * (i + .5), ry, Math.PI / 2, -Math.PI / 2, true);
    c.closePath(); c.fillStyle = '#fffdf6'; c.fill(); c.shadowColor = 'transparent';
    c.fillStyle = d.color || '#fca5a5'; c.fillRect(-w / 2 + pw * .9, -h / 2 + ph * .9, w - pw * 1.8, h - ph * 1.8);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `${h * .42}px ${FONTS.emoji}`; c.fillText(d.e || '🌴', 0, -h * .05); c.font = `800 ${h * .14}px ${FONTS.sans}`; c.fillStyle = '#fff'; c.fillText(d.val || '€1', 0, h * .32);
  },
  airmail(c, d, u) {
    const x = d.x * u, y = d.y * u, w = d.w * u, h = d.h * u, t = d.t * u; c.save(); c.beginPath(); c.rect(x, y, w, h); c.rect(x + t, y + t, w - 2 * t, h - 2 * t); c.clip('evenodd');
    c.fillStyle = '#fff'; c.fillRect(x, y, w, h); const s = t * 1.5, dg = w + h;
    for (let k = -h; k < dg; k += s * 2) { c.save(); c.translate(x + k, y); c.transform(1, 0, -.9, 1, 0, 0); c.fillStyle = (Math.round(k / (s * 2)) % 2) ? '#dc2626' : '#2563eb'; c.fillRect(0, 0, s, h); c.restore(); }
    c.restore();
  },
  snow(c, d, u, W, H) {
    const rg = makeRng(d.seed || 1), a = d.area || { x: 0, y: 0, w: W / u, h: 1 }; c.fillStyle = d.color || '#fff';
    for (let i = 0; i < d.n; i++) { const r = (d.size ? d.size[0] + rg() * (d.size[1] - d.size[0]) : .004 + rg() * .006); c.globalAlpha = (d.alpha == null ? .85 : d.alpha) * (.5 + rg() * .5); c.beginPath(); c.arc((a.x + rg() * a.w) * u, (a.y + rg() * a.h) * u, r * u, 0, TAU); c.fill(); }
  },
  wave(c, d, u, W, H) {
    al(c, d); c.beginPath(); c.moveTo(0, H); const L = d.len || .25; for (let i = 0; i <= 80; i++) { const x = i / 80 * W; c.lineTo(x, (d.y + Math.sin(x / u / L * TAU + (d.phase || 0)) * d.amp) * u); } c.lineTo(W, H); c.closePath(); c.fillStyle = d.color || '#fff'; c.fill();
  },
  sprockets(c, d, u) {
    const N = d.n, w = d.w * u / N, hh = d.h * u; c.fillStyle = d.color || '#efe9d8';
    for (let i = 0; i < N; i++) { c.beginPath(); rr(c, d.x * u + w * (i + .2), d.y * u, w * .6, hh, hh * .25); c.fill(); }
  },
  corners(c, d, u) {
    const x = d.x * u, y = d.y * u, w = d.w * u, h = d.h * u, k = d.size * u; spin(c, x + w / 2, y + h / 2, d.rot); c.fillStyle = d.color || '#2b2118';
    const tri = (ax, ay, bx, by, cx, cy) => { c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.lineTo(cx, cy); c.closePath(); c.fill(); };
    tri(x, y, x + k, y, x, y + k); tri(x + w, y, x + w - k, y, x + w, y + k); tri(x, y + h, x + k, y + h, x, y + h - k); tri(x + w, y + h, x + w - k, y + h, x + w, y + h - k);
  },
  leaf(c, d, u) {
    const s = d.s * u; c.translate(d.x * u, d.y * u); c.rotate((d.rot || 0) * RAD); al(c, d);
    c.beginPath(); c.moveTo(0, -s); c.bezierCurveTo(s * .75, -s * .5, s * .6, s * .5, 0, s); c.bezierCurveTo(-s * .6, s * .5, -s * .75, -s * .5, 0, -s); c.closePath(); c.fillStyle = d.color || '#d97706'; c.fill();
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = Math.max(1, s * .06); c.beginPath(); c.moveTo(0, -s * .9); c.lineTo(0, s * 1.15); c.stroke();
  },
  sunrays(c, d, u) {
    al(c, d); const x = d.x * u, y = d.y * u, r1 = d.r1 * u, r2 = d.r2 * u; c.fillStyle = d.color || '#fde047';
    for (let i = 0; i < d.n; i++) { const a = i / d.n * TAU, b = .45 * TAU / d.n; c.beginPath(); c.moveTo(x + Math.cos(a - b) * r1, y + Math.sin(a - b) * r1); c.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2); c.lineTo(x + Math.cos(a + b) * r1, y + Math.sin(a + b) * r1); c.closePath(); c.fill(); }
  },
  burst(c, d, u) {
    const r = d.r * u; c.translate(d.x * u, d.y * u); c.rotate((d.rot || 0) * RAD); c.beginPath();
    for (let i = 0; i < 28; i++) { const a = i / 28 * TAU, rr2 = i % 2 ? r * .72 : r; if (i) c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); else c.moveTo(r, 0); } c.closePath();
    c.fillStyle = d.color || '#fde047'; c.fill(); c.strokeStyle = '#111'; c.lineWidth = Math.max(1, r * .06); c.lineJoin = 'round'; c.stroke();
    c.fillStyle = d.textColor || '#dc2626'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `900 ${r * .5}px ${FONTS.impact}`; c.lineWidth = r * .05; c.strokeStyle = '#111'; c.strokeText(d.t || 'POW!', 0, 0, r * 1.5); c.fillText(d.t || 'POW!', 0, 0, r * 1.5);
  },
  speech(c, d, u) {
    const x = d.x * u, y = d.y * u, rx = d.w * u / 2, ry = d.h * u / 2, tx = d.tx * u, ty = d.ty * u; c.lineWidth = Math.max(1.5, d.h * u * .04); c.strokeStyle = '#111'; c.fillStyle = '#fff'; c.lineJoin = 'round';
    c.beginPath(); ellPath(c, x, y, rx, ry, 0); c.fill(); c.stroke();
    const a = Math.atan2(ty - y, tx - x), b1 = [x + Math.cos(a - .32) * rx * .93, y + Math.sin(a - .32) * ry * .93], b2 = [x + Math.cos(a + .32) * rx * .93, y + Math.sin(a + .32) * ry * .93];
    c.beginPath(); c.moveTo(b1[0], b1[1]); c.lineTo(tx, ty); c.lineTo(b2[0], b2[1]); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(b1[0], b1[1]); c.lineTo(tx, ty); c.lineTo(b2[0], b2[1]); c.stroke();
    c.fillStyle = '#111'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `900 ${d.size * u}px ${FONTS.impact}`; c.fillText(d.t, x, y, rx * 1.7);
  },
  textlines(c, d, u) {
    const rg = makeRng(d.seed || 1); c.fillStyle = d.color || '#9ca3af'; al(c, d); const lh = d.h / d.rows;
    for (let i = 0; i < d.rows; i++) { const w = d.w * (i === d.rows - 1 ? .35 + rg() * .4 : .88 + rg() * .12); c.beginPath(); rr(c, d.x * u, (d.y + i * lh + lh * .25) * u, w * u, lh * .45 * u, lh * .2 * u); c.fill(); }
  },
  zigzag(c, d, u) {
    c.beginPath(); for (let i = 0; i <= d.n; i++) { const x = (d.x + d.w * i / d.n) * u, y = (d.y + (i % 2 ? d.amp : -d.amp)) * u; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
    c.strokeStyle = d.color || '#22d3ee'; c.lineWidth = (d.lw || .006) * u; c.lineJoin = 'round'; c.lineCap = 'round'; if (d.glow) { c.shadowColor = d.color; c.shadowBlur = .02 * u; } c.stroke();
  },
};
export function drawDecor(c, decor, w, h, over, strict) {
  for (const d of decor || []) {
    if (!!d.over !== !!over) continue; const f = DECOR[d.type]; if (!f) { if (strict) throw new Error('onbekend decor: ' + d.type); continue; }
    c.save(); try { f(c, d, h, w, h); } catch (e) { if (strict) throw e; /* een kapot decor-item mag nooit de collage stoppen */ } c.restore();
  }
}

/* ------------------------------------------------------------------ indeling-hulpjes (eenheidsruimte: breedte = ratio, hoogte = 1) */
const RECT = { type: 'rect' };
const rnd = (r) => ({ type: 'round', r });
const mkSlot = (b, o) => Object.assign({ x: b.x, y: b.y, w: b.w, h: b.h, rot: 0, shape: RECT, frame: null, z: 0 }, o || {});
const inset = (c, g) => ({ x: c.x + g, y: c.y + g, w: c.w - 2 * g, h: c.h - 2 * g });
const rot2 = (k, list) => list.slice(k).concat(list.slice(0, k));
const solids = (rng, list) => rot2(rng.int(0, Math.min(3, list.length - 1)), list).map((color) => ({ type: 'solid', color }));
const grad = (a, b, angle) => ({ type: 'gradient', from: a, to: b, angle: angle == null ? 160 : angle });
const pat = (kind, color, color2, size, extra) => Object.assign({ type: 'pattern', kind, color, color2, size }, extra || {});
const rotate = (rng, bgs) => rot2(rng.int(0, Math.min(2, bgs.length - 1)), bgs);
const T = (x, y, t, size, o) => Object.assign({ type: 'text', x, y, t, size }, o || {});

function balanced(n, k) {
  const base = Math.floor(n / k), extra = n % k, counts = Array(k).fill(base), order = Array.from({ length: k }, (_, i) => i).sort((a, b) => Math.abs(a - (k - 1) / 2) - Math.abs(b - (k - 1) / 2));
  for (let i = 0; i < extra; i++) counts[order[i]]++;
  return counts;
}
function gridCells(n, box, ar) {
  let best = null;
  for (let k = 1; k <= n; k++) {
    const counts = balanced(n, k), m = Math.max.apply(null, counts), cw = box.w / m, ch = box.h / k, empt = m * k - n;
    const score = Math.abs(Math.log((cw / ch) / (ar || 1))) + empt * .3;
    if (!best || score < best.score - 1e-9) best = { k, counts, m, score };
  }
  const { k, counts, m } = best, cw = box.w / m, ch = box.h / k, out = [];
  counts.forEach((cnt, r) => { const off = (m - cnt) * cw / 2; for (let i = 0; i < cnt; i++) out.push({ x: box.x + off + i * cw, y: box.y + r * ch, w: cw, h: ch }); });
  return out;
}
function rowsFill(n, box, rng) {
  const opts = [];
  for (let k = 1; k <= n; k++) { const counts = balanced(n, k); let s = 0; counts.forEach((cnt) => { s += Math.abs(Math.log((box.w / cnt) / (box.h / k))) * cnt; }); opts.push({ k, counts, s: s / n }); }
  const bs = Math.min.apply(null, opts.map((o) => o.s)), pick = rng.pick(opts.filter((o) => o.s <= bs + .06)), out = [];
  pick.counts.forEach((cnt, r) => { for (let i = 0; i < cnt; i++) out.push({ x: box.x + i * box.w / cnt, y: box.y + r * box.h / pick.k, w: box.w / cnt, h: box.h / pick.k }); });
  return out;
}
function split(n, b, rng, jit) {
  if (n === 1) return [b];
  let n1 = Math.floor(n / 2); if (n > 3 && rng() < .35) n1 = clamp(n1 + (rng() < .5 ? -1 : 1), 1, n - 1);
  const f = clamp(n1 / n + rng.range(-jit, jit), .28, .72), vert = b.w >= b.h * rng.range(.8, 1.2);
  if (vert) return split(n1, { x: b.x, y: b.y, w: b.w * f, h: b.h }, rng, jit).concat(split(n - n1, { x: b.x + b.w * f, y: b.y, w: b.w * (1 - f), h: b.h }, rng, jit));
  return split(n1, { x: b.x, y: b.y, w: b.w, h: b.h * f }, rng, jit).concat(split(n - n1, { x: b.x, y: b.y + b.h * f, w: b.w, h: b.h * (1 - f) }, rng, jit));
}
function treemap(n, box, rng, jit, maxAr) {
  let best = null, bs = -1;
  for (let t = 0; t < 40; t++) {
    const cells = split(n, box, rng, jit || .2), worst = Math.max.apply(null, cells.map((c) => Math.max(c.w / c.h, c.h / c.w))), mind = Math.min.apply(null, cells.map((c) => Math.min(c.w, c.h))), sc = mind * (worst <= (maxAr || 2.3) ? 1 : .4);
    if (sc > bs) { bs = sc; best = cells; }
  }
  return best;
}
const alt = (k, mm, high) => Array.from({ length: k }, (_, i) => ((i % 2 === 0) === high ? mm : mm - 1));
function tiled(n, W, H, rng, p) {
  const ar = p.ar || 1, rs = p.rs || 1, pad = p.pad == null ? .05 : p.pad, g = p.gap || 0, aw = W - 2 * pad, ah = H - 2 * pad, plans = [];
  const add = (counts, shift) => plans.push({ counts, shift, k: counts.length, max: Math.max.apply(null, counts) });
  for (let k = 1; k <= n; k++) {
    if (p.stagger) {
      if (k >= 2 && n % k === 0 && n / k >= 2) add(Array(k).fill(n / k), true);
      if (k >= 2) { const hi = (n + Math.floor(k / 2)) / k; if (Number.isInteger(hi) && hi >= 2) add(alt(k, hi, true), false); const lo = (n + Math.ceil(k / 2)) / k; if (Number.isInteger(lo) && lo >= 2) add(alt(k, lo, false), false); }
    } else add(balanced(n, k), false);
  }
  if (!plans.length) for (let k = 1; k <= n; k++) add(balanced(n, k), false);
  plans.forEach((pl) => { const wu = pl.max + (pl.shift ? .5 : 0), hu = 1 + (pl.k - 1) * rs; pl.w = Math.min(aw / wu, ah / hu * ar); pl.wu = wu; pl.hu = hu; });
  const top = Math.max.apply(null, plans.map((pl) => pl.w)), pl = rng.pick(plans.filter((q) => q.w >= top * .95)), w = pl.w, h = w / ar;
  const x0 = pad + (aw - pl.wu * w) / 2, y0 = pad + (ah - pl.hu * h) / 2, out = [];
  pl.counts.forEach((cnt, r) => {
    const sx = pl.shift ? x0 + (r % 2) * .5 * w : x0 + (pl.max - cnt) * w / 2;
    for (let i = 0; i < cnt; i++) out.push({ x: sx + i * w + g / 2, y: y0 + r * rs * h + g / (2 * ar), w: w - g, h: h - g / ar, row: r, col: i });
  });
  return out;
}
function factorPair(n, W, H, ar, wUnits) {
  let best = null;
  for (let k = 2; k < n; k++) if (n % k === 0) { const m = n / k, cw = W / (m + (wUnits || 0)), ch = H / k, s = Math.abs(Math.log(cw / ch / ar)); if (!best || s < best.s) best = { k, m, s }; }
  return best || { k: Math.ceil(n / 3), m: 3, s: 0 };
}
function bboxOf(slots) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  slots.forEach((s) => { const cx = s.x + s.w / 2, cy = s.y + s.h / 2, a = (s.rot || 0) * RAD, ex = (Math.abs(s.w * Math.cos(a)) + Math.abs(s.h * Math.sin(a))) / 2, ey = (Math.abs(s.w * Math.sin(a)) + Math.abs(s.h * Math.cos(a))) / 2; x0 = Math.min(x0, cx - ex); x1 = Math.max(x1, cx + ex); y0 = Math.min(y0, cy - ey); y1 = Math.max(y1, cy + ey); });
  return { x0, y0, x1, y1 };
}
// schaal + verschuif alle vakjes zodat de hele compositie in `box` past (grow: ook vergroten)
function fit(slots, box, grow) {
  const b = bboxOf(slots), bw = b.x1 - b.x0, bh = b.y1 - b.y0; let k = Math.min(box.w / bw, box.h / bh); if (!grow) k = Math.min(1, k);
  const ccx = (b.x0 + b.x1) / 2, ccy = (b.y0 + b.y1) / 2, tx = box.x + box.w / 2, ty = box.y + box.h / 2;
  slots.forEach((s) => { const cx = s.x + s.w / 2, cy = s.y + s.h / 2; s.w *= k; s.h *= k; s.x = tx + (cx - ccx) * k - s.w / 2; s.y = ty + (cy - ccy) * k - s.h / 2; if (s.frame) { s.frame.w *= k; if (s.frame.b) s.frame.b *= k; } });
  return k;
}
const polaroid = (cx, cy, s, rot, o) => mkSlot({ x: cx - s / 2, y: cy - s * .6, w: s, h: s * 1.2 }, Object.assign({ rot, frame: { w: s * .075, b: s * .2, color: '#fffdf8', shadow: .6 } }, o || {}));
const cardSlot = (cx, cy, w, h, rot, o) => mkSlot({ x: cx - w / 2, y: cy - h / 2, w, h }, Object.assign({ rot, frame: { w: Math.min(w, h) * .05, color: '#fffdf8', shadow: .5 } }, o || {}));
const mirrorCells = (cells, W, H, how) => cells.map((c) => ({ x: how.indexOf('x') >= 0 ? W - c.x - c.w : c.x, y: how.indexOf('y') >= 0 ? H - c.y - c.h : c.y, w: c.w, h: c.h }));

// kd-verdeling: verdeel de cellen in n compacte groepen
function kdSplit(cells, n) {
  if (n <= 1) return [cells];
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; cells.forEach((c) => { x0 = Math.min(x0, c.cx); x1 = Math.max(x1, c.cx); y0 = Math.min(y0, c.cy); y1 = Math.max(y1, c.cy); });
  const a = x1 - x0 >= y1 - y0 ? 'cx' : 'cy', b = a === 'cx' ? 'cy' : 'cx', s = cells.slice().sort((p, q) => p[a] - q[a] || p[b] - q[b]), n1 = Math.floor(n / 2), k = Math.max(1, Math.min(s.length - 1, Math.round(s.length * n1 / n)));
  return kdSplit(s.slice(0, k), n1).concat(kdSplit(s.slice(k), n - n1));
}
// cellen (rooster-cellen {x,y,w,h,gx,gy}) -> n slots met 'cells'-vorm; tussen groepen komt een spleet g
function cellSlots(cells, n, g, mask, extra) {
  const groups = kdSplit(cells.map((c) => Object.assign({ cx: c.x + c.w / 2, cy: c.y + c.h / 2 }, c)), n), out = [];
  groups.forEach((grp) => {
    const has = new Set(grp.map((c) => c.gx + ',' + c.gy)), rects = grp.map((c) => {
      const l = has.has((c.gx - 1) + ',' + c.gy), r = has.has((c.gx + 1) + ',' + c.gy), t = has.has(c.gx + ',' + (c.gy - 1)), b = has.has(c.gx + ',' + (c.gy + 1));
      return { x0: c.x + (l ? 0 : g / 2), x1: c.x + c.w - (r ? 0 : g / 2), y0: c.y + (t ? 0 : g / 2), y1: c.y + c.h - (b ? 0 : g / 2) };
    });
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; rects.forEach((q) => { x0 = Math.min(x0, q.x0); y0 = Math.min(y0, q.y0); x1 = Math.max(x1, q.x1); y1 = Math.max(y1, q.y1); });
    const bw = x1 - x0, bh = y1 - y0, shape = { type: 'cells', cells: rects.map((q) => [(q.x0 - x0) / bw, (q.y0 - y0) / bh, (q.x1 - q.x0) / bw, (q.y1 - q.y0) / bh]) };
    if (mask) shape.mask = { type: mask.type, rx: (mask.box.x - x0) / bw, ry: (mask.box.y - y0) / bh, rw: mask.box.w / bw, rh: mask.box.h / bh };
    out.push(mkSlot({ x: x0, y: y0, w: bw, h: bh }, Object.assign({ shape }, extra || {})));
  });
  return out;
}
function pointInPoly(poly, u, v) { let ins = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > v) !== (b[1] > v) && u < (b[0] - a[0]) * (v - a[1]) / (b[1] - a[1]) + a[0]) ins = !ins; } return ins; }
function maskCells(box, res, test) {
  const cs = box.h / res, cols = Math.ceil(box.w / cs), cells = [];
  for (let gy = 0; gy < res; gy++) for (let gx = 0; gx < cols; gx++) {
    const x = box.x + gx * cs, y = box.y + gy * cs; let inside = false;
    for (const [a, b] of [[.5, .5], [.1, .1], [.9, .1], [.1, .9], [.9, .9]]) if (test((x + cs * a - box.x) / box.w, (y + cs * b - box.y) / box.h)) { inside = true; break; }
    if (inside) cells.push({ x, y, w: cs, h: cs, gx, gy });
  }
  return cells;
}
const phStamp = (rng) => rng.pick(['GROETEN', 'VAKANTIE', 'ZOMER', 'HOERA']);

/* ------------------------------------------------------------------ de 50 stijlen */
const DEFS = [];
const def = (name, desc, group, fn, flags) => DEFS.push({ name, desc, group, fn, flags: flags || {} });
const G = ['Klassiek', 'Gedraaid en speels', 'Spiegelen en dubbelen', 'Vormen', 'Thema'];
const WOODS = () => [pat('wood', '#c69c6d', '#6b4423', .1), pat('wood', '#e0c9a6', '#8a6a3f', .1), pat('wood', '#8d6e63', '#3e2723', .1), grad('#e9edf2', '#cfd8e3'), grad('#fde68a', '#fbcfe8', 135), grad('#1f2937', '#374151')];
const PASTELS = ['#fde2e4', '#dbeafe', '#fef3c7', '#d1fae5', '#e9d5ff', '#ffedd5', '#fbcfe8', '#cffafe'];

/* ---- Klassiek ---- */
def('Strak raster', 'nette rijen en kolommen', G[0], (n, W, H, rng, o) => {
  const m = .05, g = .024 * o.gap, r = rng.pick([0, .07, .14]), cells = gridCells(n, { x: m, y: m, w: W - 2 * m, h: H - 2 * m }, 1);
  return { bgs: solids(rng, ['#ffffff', '#f4efe8', '#fde2e4', '#dbeafe', '#fef3c7', '#d1fae5', '#111827']), slots: cells.map((c) => mkSlot(inset(c, g / 2), { shape: r ? rnd(r) : RECT })) };
});
def('Brede witte rand', 'als een ingelijste galerij', G[0], (n, W, H, rng, o) => {
  const m = .1, g = .018 * o.gap, cells = gridCells(n, { x: m, y: m, w: W - 2 * m, h: H - 2 * m }, 1);
  return {
    bgs: solids(rng, ['#ffffff', '#faf6ef', '#efece6', '#fdf2f8', '#eef2ff', '#e8f1ec']),
    decor: [{ type: 'rect', x: .045, y: .045, w: W - .09, h: H - .09, stroke: '#c9c2b6', lw: .002 }],
    slots: cells.map((c) => mkSlot(inset(c, g / 2), { frame: { w: 0, color: '#ffffff', shadow: .4 } })),
  };
});
def('Geen ruimte', 'muur van foto\'s', G[0], (n, W, H, rng, o) => {
  const g = Math.max(0, o.gap - 1) * .012, cells = rowsFill(n, { x: 0, y: 0, w: W, h: H }, rng);
  return { bgs: solids(rng, ['#111827', '#ffffff', '#f8e1e7']), slots: cells.map((c) => mkSlot(inset(c, g / 2))) };
});
def('Metselwerk', 'verspringende rijen', G[0], (n, W, H, rng, o) => {
  const m = .05, g = .016 * o.gap, fp = factorPair(n, W - 2 * m, H - 2 * m, 1.6, .5), k = fp.k, c = fp.m, cw = (W - 2 * m) / (c + .5), ch = (H - 2 * m) / k, slots = [];
  const bw = Math.min(cw, ch * 1.9), bh = Math.min(ch, bw / 1.3), tw = (c + .5) * bw, th = k * bh, x0 = (W - tw) / 2, y0 = (H - th) / 2;
  for (let r = 0; r < k; r++) for (let i = 0; i < c; i++) slots.push(mkSlot(inset({ x: x0 + i * bw + (r % 2) * bw / 2, y: y0 + r * bh, w: bw, h: bh }, g / 2), { shape: rnd(.05) }));
  return { bgs: solids(rng, ['#e7dfd3', '#d6cfc4', '#f1e8dc', '#c9c2b8', '#e8c4a8', '#cbd5e1']), slots };
});
def('Mozaïek', 'verschillende groottes', G[0], (n, W, H, rng, o) => {
  const m = .04, g = .016 * o.gap, cells = treemap(n, { x: m, y: m, w: W - 2 * m, h: H - 2 * m }, rng, .2, 2.3);
  return { bgs: solids(rng, ['#ffffff', '#111827', '#f4efe8', '#fde2e4', '#dbeafe']), slots: cells.map((c) => mkSlot(inset(c, g / 2), { shape: rnd(.05) })) };
});
def('Eén grote foto met kleintjes', 'groot in het midden van de aandacht', G[0], (n, W, H, rng, o) => {
  const m = .04, g = .022 * o.gap, box = { x: m, y: m, w: W - 2 * m, h: H - 2 * m }, side = rng.sign(), f = .6; let hero, rest;
  if (W > H * 1.08) { const hw = box.w * f; hero = side > 0 ? { x: box.x, y: box.y, w: hw, h: box.h } : { x: box.x + box.w - hw, y: box.y, w: hw, h: box.h }; rest = side > 0 ? { x: box.x + hw, y: box.y, w: box.w - hw, h: box.h } : { x: box.x, y: box.y, w: box.w - hw, h: box.h }; }
  else { const hh = box.h * f; hero = side > 0 ? { x: box.x, y: box.y, w: box.w, h: hh } : { x: box.x, y: box.y + box.h - hh, w: box.w, h: hh }; rest = side > 0 ? { x: box.x, y: box.y + hh, w: box.w, h: box.h - hh } : { x: box.x, y: box.y, w: box.w, h: box.h - hh }; }
  const smalls = gridCells(n - 1, rest, 1);
  return { bgs: solids(rng, ['#ffffff', '#fef3c7', '#dbeafe', '#fde2e4', '#111827']), slots: [hero].concat(smalls).map((c) => mkSlot(inset(c, g / 2), { shape: rnd(.05) })) };
});
def('Filmstrip', 'zwarte filmrol met gaatjes', G[0], (n, W, H, rng, o) => {
  const gS = .012 + .008 * o.gap; let best = null;
  for (let k = 1; k <= n; k++) {
    const counts = balanced(n, k), m = Math.max.apply(null, counts); let cw = (W - (m + 1) * gS) / m, ch = cw / 1.4, p = ch * .2, bh = ch + 2 * p, gap2 = .03, total = k * bh + (k - 1) * gap2;
    const s = Math.min(1, H * .94 / total); cw *= s; ch *= s; p *= s; bh *= s; gap2 *= s; total *= s;
    if (!best || cw > best.cw + 1e-9) best = { k, counts, cw, ch, p, bh, gap2, total };
  }
  const { counts, cw, ch, p, bh, gap2, total } = best, y0 = (H - total) / 2, slots = [], decor = [];
  counts.forEach((cnt, r) => {
    const y = y0 + r * (bh + gap2), rowW = cnt * cw + (cnt - 1) * gS, sx = (W - rowW) / 2, nh = Math.max(8, Math.round(W / (p * 1.5)));
    decor.push({ type: 'rect', x: 0, y, w: W, h: bh, color: '#0e0e0e' });
    decor.push({ type: 'sprockets', x: 0, y: y + p * .18, w: W, h: p * .64, n: nh, color: '#efe9d8' }, { type: 'sprockets', x: 0, y: y + p + ch + p * .18, w: W, h: p * .64, n: nh, color: '#efe9d8' });
    for (let i = 0; i < cnt; i++) slots.push(mkSlot({ x: sx + i * (cw + gS), y: y + p, w: cw, h: ch }, { shape: rnd(.03) }));
  });
  return { bgs: solids(rng, ['#3a3a3c', '#8a6f55', '#d9c9a8', '#2d4a6b', '#f4f1ea']), decor, slots };
});
def('Contactvel met nummertjes', 'zoals een filmrol op papier', G[0], (n, W, H, rng, o) => {
  const m = .04, head = .085, g = .014 * o.gap, box = { x: m, y: head + .01, w: W - 2 * m, h: H - head - m - .01 }, cells = gridCells(n, box, 1.2), slots = [], decor = [];
  const lab = Math.min(.034, box.h / cells.length * .22 + .008);
  decor.push(T(m, head / 2 + .004, 'CONTACT SHEET', .028, { align: 'left', font: 'mono', color: '#374151' }), { type: 'line', x1: m, y1: head - .005, x2: W - m, y2: head - .005, color: '#374151', lw: .002 });
  cells.forEach((c, i) => {
    const b = inset(c, g / 2); slots.push(mkSlot({ x: b.x, y: b.y, w: b.w, h: b.h - lab }, { frame: { w: .003, color: '#111' } }));
    decor.push(T(b.x + .004, b.y + b.h - lab / 2, String(i + 1), lab * .8, { align: 'left', font: 'mono', weight: 700, color: '#374151' }), T(b.x + b.w - .004, b.y + b.h - lab / 2, i + 1 + 'A  ▶', lab * .65, { align: 'right', font: 'mono', color: '#b45309' }));
  });
  const pick = rng.int(0, n - 1), s = slots[pick]; decor.push({ type: 'ellipse', x: s.x + s.w / 2, y: s.y + s.h / 2, rx: s.w * .56, ry: s.h * .56, stroke: '#e11d48', lw: .004, rot: rng.range(-6, 6), over: true });
  return { bgs: solids(rng, ['#f5f2ea', '#e9e9e9', '#ffffff', '#d8d8d8']), decor, slots };
});

/* ---- Gedraaid en speels ---- */
def('Plakboek', 'scheef met schaduw', G[1], (n, W, H, rng, o) => {
  const cells = gridCells(n, { x: .03, y: .03, w: W - .06, h: H - .06 }, 1.05), slots = [];
  cells.forEach((c, i) => { const s = rng.range(1.0, 1.18) * o.gap * .3 + .85; slots.push(mkSlot({ x: c.x + c.w / 2 - c.w * s / 2 + rng.range(-.2, .2) * c.w * .5, y: c.y + c.h / 2 - c.h * s / 2 + rng.range(-.2, .2) * c.h * .5, w: c.w * s, h: c.h * s }, { rot: rng.range(-9, 9), z: i, frame: { w: .007, color: '#fffdf8', shadow: .7 } })); });
  fit(slots, { x: .02, y: .02, w: W - .04, h: H - .04 }, false);
  const decor = []; slots.forEach((s, i) => { if (rng() < .55) decor.push({ type: 'tape', x: s.x + s.w / 2 + rng.range(-.2, .2) * s.w, y: s.y + .004, w: Math.min(s.w, s.h) * .38, h: Math.min(s.w, s.h) * .13, rot: rng.range(-18, 18), color: rng.pick(['#fde68a', '#fbcfe8', '#bae6fd', '#bbf7d0']), over: true }); });
  return { bgs: rotate(rng, [pat('paper', '#d8b98a', '#7c5a2c', .06), pat('grid', '#fbf7ee', 'rgba(70,90,140,.18)', .04), pat('dots', '#f7efe2', 'rgba(120,90,60,.2)', .04), grad('#fde2e4', '#e0f2fe', 140), pat('paper', '#bfd8c4', '#355', .06)]), decor, slots };
}, { overlap: true });
def('Polaroid-stapel', 'een losse stapel polaroids', G[1], (n, W, H, rng, o) => {
  const s = clamp(Math.sqrt(W * H / n) * .95 * (.8 + .2 * o.gap), .12, Math.min(W, H) * .5), ax = (W - s) / 2 - .03, ay = (H - s * 1.2) / 2 - .03, slots = [];
  for (let i = 0; i < n; i++) { const a = i * 2.39996 + 1, rr2 = Math.sqrt((i + .5) / n); slots.push(polaroid(W / 2 + Math.cos(a) * ax * rr2, H / 2 + Math.sin(a) * ay * rr2, s, rng.range(-18, 18), { z: i })); }
  fit(slots, { x: .02, y: .02, w: W - .04, h: H - .04 }, false);
  return { bgs: rotate(rng, WOODS()), slots };
}, { overlap: true });
def('Waaier', 'foto\'s uitgespreid als speelkaarten', G[1], (n, W, H, rng, o) => {
  const slots = [], px = W / 2, py = H * .9, hc = Math.min(H * .7, W * 1.1), two = n > 9, rows = two ? [Math.ceil(n / 2), Math.floor(n / 2)] : [n];
  rows.forEach((cnt, ri) => {
    const len = ri === 0 ? hc : hc * .78, cw = len * .68, span = Math.min(110, 24 + cnt * (two ? 11 : 13)) * (ri ? .92 : 1), z0 = ri === 0 ? 0 : 100;
    for (let i = 0; i < cnt; i++) { const a = cnt === 1 ? 0 : -span / 2 + span * i / (cnt - 1), r = a * RAD; slots.push(cardSlot(px + Math.sin(r) * len / 2, py - Math.cos(r) * len / 2, cw, len, a, { z: z0 + i })); }
  });
  fit(slots, { x: .03, y: .03, w: W - .06, h: H - .06 }, true);
  return { bgs: rotate(rng, [grad('#1e3a5f', '#0f172a', 160), grad('#fde68a', '#fb7185', 150), grad('#d1fae5', '#a7f3d0', 160), pat('dots', '#f8e1e7', 'rgba(190,24,93,.15)', .05), grad('#e9d5ff', '#c4b5fd', 150)]), slots };
}, { overlap: true });
def('Verspreid op tafel', 'losjes neergegooid', G[1], (n, W, H, rng, o) => {
  const cells = gridCells(n, { x: .03, y: .03, w: W - .06, h: H - .06 }, 1), slots = [], zs = rng.shuffle(cells.map((_, i) => i));
  cells.forEach((c, i) => { const s = rng.range(.82, 1.2) * (.85 + o.gap * .15), w = c.w * s, h = c.h * s * rng.range(.85, 1.05); slots.push(mkSlot({ x: c.x + c.w / 2 + rng.range(-.28, .28) * c.w - w / 2, y: c.y + c.h / 2 + rng.range(-.28, .28) * c.h - h / 2, w, h }, { rot: rng.range(-30, 30), z: zs[i], frame: { w: .006, color: '#fffdf8', shadow: .8 } })); });
  fit(slots, { x: .02, y: .02, w: W - .04, h: H - .04 }, false);
  return { bgs: rotate(rng, [pat('wood', '#b9895b', '#5b3a1e', .11), grad('#2f5d50', '#1f3f36', 140), pat('wood', '#e6d3b3', '#9a7b4f', .11), grad('#374151', '#111827'), pat('checker', '#fff7ed', 'rgba(220,38,38,.12)', .06)]), slots };
}, { overlap: true });
def('Prikbord met punaises', 'kurk, speldjes en touwtjes', G[1], (n, W, H, rng, o) => {
  const m = .05, g = .03 * o.gap, cells = gridCells(n, { x: m, y: m, w: W - 2 * m, h: H - 2 * m }, 1), slots = [], decor = [], pins = [], cols = ['#ef4444', '#3b82f6', '#facc15', '#22c55e', '#ec4899'];
  cells.forEach((c, i) => { const b = inset(c, g / 2); const s = mkSlot(b, { rot: rng.range(-4, 4), z: i, frame: { w: .005, b: .014, color: '#fffdf8', shadow: .6 } }); slots.push(s); pins.push([s.x + s.w / 2 + rng.range(-.01, .01), s.y + .012]); });
  fit(slots, { x: .01, y: .01, w: W - .02, h: H - .02 }, false);
  const pp = slots.map((s) => [s.x + s.w / 2, s.y + .014]);
  if (rng() < .5) for (let i = 0; i < pp.length - 1; i++) decor.push({ type: 'line', x1: pp[i][0], y1: pp[i][1], x2: pp[i + 1][0], y2: pp[i + 1][1], sag: .02, color: '#b91c1c', lw: .0028 });
  pp.forEach((p, i) => decor.push({ type: 'pin', x: p[0], y: p[1], r: .011, color: cols[i % cols.length], over: true }));
  return { bgs: rotate(rng, [pat('cork', '#c8935a', '#7a4b21', .05), pat('cork', '#d9b382', '#8a5a2b', .05), pat('cork', '#9fb4a0', '#3d5a40', .05), pat('cork', '#9db4cf', '#2f4a6b', .05)]), decor, slots };
}, { overlap: true });
def('Foto\'s met washi-tape', 'plakstrookjes op papier', G[1], (n, W, H, rng, o) => {
  const m = .05, g = .035 * o.gap, cells = gridCells(n, { x: m, y: m, w: W - 2 * m, h: H - 2 * m }, 1), slots = [], decor = [], tc = ['#fca5a5', '#fde68a', '#a7f3d0', '#bae6fd', '#ddd6fe', '#fbcfe8'];
  cells.forEach((c, i) => slots.push(mkSlot(inset(c, g / 2), { rot: rng.range(-3.5, 3.5), z: i, frame: { w: .006, color: '#fffdf8', shadow: .55 } })));
  fit(slots, { x: .01, y: .01, w: W - .02, h: H - .02 }, false);
  slots.forEach((s) => { decor.push({ type: 'tape', x: s.x + s.w / 2, y: s.y + .003, w: Math.min(s.w, s.h) * .42, h: Math.min(s.w, s.h) * .13, rot: rng.range(-10, 10), color: rng.pick(tc), pattern: rng.pick(['stripes', 'dots', null]), over: true }); });
  return { bgs: rotate(rng, [pat('grid', '#fbf7ee', 'rgba(70,90,140,.16)', .04), pat('dots', '#fff7ed', 'rgba(244,114,182,.28)', .045), pat('paper', '#f4ecdc', '#7c5a2c', .06), pat('stripes', '#fdf2f8', 'rgba(244,114,182,.12)', .03), grad('#e0f2fe', '#fef9c3', 150)]), decor, slots };
}, { overlap: true });
def('Stapel met bovenste foto groot', 'één grote bovenop, de rest eronder', G[1], (n, W, H, rng, o) => {
  const slots = [], bw = Math.min(W * .62, H * .5), bh = bw * 1.12, sm = Math.min(W, H) * (n > 8 ? .27 : .33), cx = W / 2, cy = H / 2, rest = n - 1;
  slots.push(cardSlot(cx, cy, bw, bh, rng.range(-2, 2), { z: 200, frame: { w: bw * .04, b: bw * .08, color: '#fffdf8', shadow: .8 } }));
  const inner = Math.min(rest, 7), outer = rest - inner;
  for (let i = 0; i < inner; i++) { const a = rng.range(0, 1) * .5 + i / inner * TAU, rx = (W - sm) / 2 * .78, ry = (H - sm) / 2 * .78; slots.push(polaroid(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, sm, rng.range(-24, 24), { z: 100 + i })); }
  for (let i = 0; i < outer; i++) { const a = (i + .5) / outer * TAU + .3, rx = (W - sm) / 2, ry = (H - sm) / 2; slots.push(polaroid(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, sm * .9, rng.range(-24, 24), { z: i })); }
  fit(slots, { x: .02, y: .02, w: W - .04, h: H - .04 }, false);
  return { bgs: rotate(rng, [grad('#fde68a', '#fca5a5', 150), grad('#bfdbfe', '#c7d2fe', 150), pat('dots', '#fef3c7', 'rgba(217,119,6,.18)', .05), grad('#1f2937', '#111827'), pat('paper', '#d8b98a', '#7c5a2c', .06)]), slots };
}, { overlap: true });
def('Puzzelstukjes', 'passende puzzelstukken', G[1], (n, W, H, rng, o) => {
  const m = .04, g = .006 * o.gap; let e = .05, fp, cw, ch;
  for (let it = 0; it < 3; it++) { fp = factorPair(n, W - 2 * (m + e), H - 2 * (m + e), 1, 0); cw = (W - 2 * (m + e)) / fp.m; ch = (H - 2 * (m + e)) / fp.k; e = Math.min(cw, ch) * .2; }
  const k = fp.k, c = fp.m, sz = Math.min(cw, ch), x0 = (W - sz * c) / 2, y0 = (H - sz * k) / 2, hs = [], vs = [];
  for (let r = 0; r < k; r++) { hs.push([]); for (let i = 0; i < c - 1; i++) hs[r].push(rng.sign()); }
  for (let r = 0; r < k - 1; r++) { vs.push([]); for (let i = 0; i < c; i++) vs[r].push(rng.sign()); }
  const slots = [];
  for (let r = 0; r < k; r++) for (let i = 0; i < c; i++) {
    const kn = [r > 0 ? -vs[r - 1][i] : 0, i < c - 1 ? hs[r][i] : 0, r < k - 1 ? vs[r][i] : 0, i > 0 ? -hs[r][i - 1] : 0];
    const b = { x: x0 + i * sz + g / 2 - e, y: y0 + r * sz + g / 2 - e, w: sz - g + 2 * e, h: sz - g + 2 * e };
    slots.push(mkSlot(b, { shape: { type: 'puzzle', kn, ex: e / b.w, ey: e / b.h }, frame: { w: 0, color: '#fff', shadow: .35 } }));
  }
  return { bgs: rotate(rng, WOODS()), slots };
}, { overlap: true });

/* ---- Spiegelen en dubbelen ---- */
def('Spiegel links/rechts', 'de rechterhelft is het spiegelbeeld', G[2], (n, W, H, rng, o) => {
  const m = .04, g = .016 * o.gap, cells = gridCells(n, { x: m, y: m, w: W / 2 - m, h: H - 2 * m }, 1), sl = cells.map((c) => mkSlot(inset(c, g / 2), { shape: rnd(.04) })), cp = mirrorCells(cells.map((c) => inset(c, g / 2)), W, H, 'x').map((c, i) => mkSlot(c, { shape: rnd(.04), copyOf: i, mirror: 'x' }));
  return { bgs: solids(rng, ['#111827', '#fdf2f8', '#eef2ff', '#fef3c7', '#ffffff']), decor: [{ type: 'line', x1: W / 2, y1: 0, x2: W / 2, y2: H, color: 'rgba(255,255,255,.35)', lw: .002, over: true }], slots: sl.concat(cp) };
});
def('Spiegel boven/onder', 'de onderste helft is het spiegelbeeld', G[2], (n, W, H, rng, o) => {
  const m = .04, g = .016 * o.gap, cells = gridCells(n, { x: m, y: m, w: W - 2 * m, h: H / 2 - m }, 1), sl = cells.map((c) => mkSlot(inset(c, g / 2), { shape: rnd(.04) })), cp = mirrorCells(cells.map((c) => inset(c, g / 2)), W, H, 'y').map((c, i) => mkSlot(c, { shape: rnd(.04), copyOf: i, mirror: 'y' }));
  return { bgs: solids(rng, ['#0f172a', '#e0f2fe', '#fdf2f8', '#fef9c3', '#ffffff']), decor: [{ type: 'line', x1: 0, y1: H / 2, x2: W, y2: H / 2, color: 'rgba(255,255,255,.4)', lw: .002, dash: [.01, .008], over: true }], slots: sl.concat(cp) };
});
def('Kaleidoscoop', '4 gespiegelde kwadranten', G[2], (n, W, H, rng, o) => {
  const g = .008 * o.gap, qc = n > 8 ? gridCells(n, { x: 0, y: 0, w: W / 2, h: H / 2 }, 1) : treemap(n, { x: 0, y: 0, w: W / 2, h: H / 2 }, rng, .22, 2.4), q = qc.map((c) => inset(c, g / 2)), slots = q.map((c) => mkSlot(c));
  [['x', 'x'], ['y', 'y'], ['xy', 'xy']].forEach(([how, mir]) => mirrorCells(q, W, H, how).forEach((c, i) => slots.push(mkSlot(c, { copyOf: i, mirror: mir }))));
  const decor = []; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; decor.push({ type: 'line', x1: W / 2, y1: H / 2, x2: W / 2 + Math.cos(a) * 2, y2: H / 2 + Math.sin(a) * 2, color: 'rgba(255,255,255,.08)', lw: .01 }); }
  return { bgs: rotate(rng, [grad('#312e81', '#1e1b4b', 140), grad('#831843', '#4c0519', 140), grad('#064e3b', '#022c22', 140), solids(rng, ['#111827'])[0], grad('#f59e0b', '#be123c', 140)]), decor, slots };
});
def('Elke foto dubbel, één gedraaid', 'één van de twee staat op zijn kop', G[2], (n, W, H, rng, o) => {
  const m = .04, g = .014 * o.gap, cells = gridCells(n, { x: m, y: m, w: W - 2 * m, h: H - 2 * m }, 2), orig = [], copies = [];
  cells.forEach((c, i) => { const a = inset({ x: c.x, y: c.y, w: c.w / 2, h: c.h }, g / 2), b = inset({ x: c.x + c.w / 2, y: c.y, w: c.w / 2, h: c.h }, g / 2); orig.push(mkSlot(a, { shape: rnd(.06) })); copies.push(mkSlot(b, { shape: rnd(.06), copyOf: i, rotPhoto: 180 })); });
  return { bgs: solids(rng, ['#fef3c7', '#dbeafe', '#fde2e4', '#d1fae5', '#ffffff', '#111827']), slots: orig.concat(copies) };
});
def('Draaipatroon', 'elke foto 90° verder gedraaid', G[2], (n, W, H, rng, o) => {
  const m = .04, g = .012 * o.gap, cells = gridCells(n, { x: m, y: m, w: W - 2 * m, h: H - 2 * m }, 1), orig = [], more = [];
  cells.forEach((c, i) => {
    const hw = c.w / 2, hh = c.h / 2, q = (dx, dy) => inset({ x: c.x + dx * hw, y: c.y + dy * hh, w: hw, h: hh }, g / 2);
    orig.push(mkSlot(q(0, 0))); more.push(mkSlot(q(1, 0), { copyOf: i, rotPhoto: 90 }), mkSlot(q(1, 1), { copyOf: i, rotPhoto: 180 }), mkSlot(q(0, 1), { copyOf: i, rotPhoto: 270 }));
  });
  return { bgs: solids(rng, ['#111827', '#ffffff', '#fef3c7', '#e0e7ff']), slots: orig.concat(more) };
});
def('Schaakbord van foto en spiegelbeeld', 'om en om', G[2], (n, W, H, rng, o) => {
  const m = .04, g = .006 * o.gap, total = n * 2; let best = null;
  for (let c = 1; c <= total; c++) if (total % c === 0) { const r = total / c, cw = (W - 2 * m) / c, ch = (H - 2 * m) / r, s = Math.abs(Math.log(cw / ch)) + (c < 2 || r < 2 ? 5 : 0); if (!best || s < best.s) best = { c, r, s }; }
  const { c: cols, r: rows } = best, cw = (W - 2 * m) / cols, ch = (H - 2 * m) / rows, orig = [], idx = {}, copies = [];
  for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) if ((i + r) % 2 === 0) { idx[i + ',' + r] = orig.length; orig.push(mkSlot(inset({ x: m + i * cw, y: m + r * ch, w: cw, h: ch }, g / 2))); }
  for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) if ((i + r) % 2) { const src = i > 0 ? idx[(i - 1) + ',' + r] : idx[(i + 1) + ',' + r]; copies.push(mkSlot(inset({ x: m + i * cw, y: m + r * ch, w: cw, h: ch }, g / 2), { copyOf: src, mirror: 'x' })); }
  return { bgs: solids(rng, ['#111827', '#ffffff', '#fef3c7', '#f1f5f9']), slots: orig.concat(copies) };
});
def('Herhaling met ander kleurfilter per vak', 'elke foto in 4 popkleuren', G[2], (n, W, H, rng, o) => {
  const m = .04, g = .014 * o.gap, cells = gridCells(n, { x: m, y: m, w: W - 2 * m, h: H - 2 * m }, 1), orig = [], more = [], fl = rng.shuffle(['pop1', 'pop2', 'pop3', 'pop4']);
  cells.forEach((c, i) => {
    const hw = c.w / 2, hh = c.h / 2, q = (dx, dy) => inset({ x: c.x + dx * hw, y: c.y + dy * hh, w: hw, h: hh }, g / 2);
    orig.push(mkSlot(q(0, 0), { shape: rnd(.06) })); more.push(mkSlot(q(1, 0), { copyOf: i, filter: fl[0], shape: rnd(.06) }), mkSlot(q(0, 1), { copyOf: i, filter: fl[1], shape: rnd(.06) }), mkSlot(q(1, 1), { copyOf: i, filter: fl[2], shape: rnd(.06) }));
  });
  return { bgs: solids(rng, ['#ffffff', '#111827', '#fde047', '#fbcfe8']), slots: orig.concat(more) };
});

/* ---- Vormen ---- */
const shapeDef = (name, desc, shapeT, par, extra) => def(name, desc, G[3], (n, W, H, rng, o) => {
  const g = (par.gap || .014) * o.gap, cells = tiled(n, W, H, rng, Object.assign({}, par, { gap: g })), slots = cells.map((c) => mkSlot(c, Object.assign({ shape: { type: shapeT } }, par.rotAlt ? { rot: (c.row % 2 ? 1 : -1) * par.rotAlt + (c.col % 2 ? 4 : -4) } : {}, par.slot || {})));
  const out = { bgs: par.bgs ? par.bgs(rng) : solids(rng, ['#fde2e4', '#dbeafe', '#fef3c7', '#d1fae5']), slots };
  if (par.rotAlt) fit(slots, { x: .02, y: .02, w: W - .04, h: H - .04 }, false);
  if (extra) extra(out, n, W, H, rng, o);
  return out;
}, { overlap: true });
shapeDef('Harten', 'een rij harten', 'heart', { ar: 1.1, rs: .9, stagger: false, pad: .05, gap: .012, bgs: (rng) => solids(rng, ['#fde2e4', '#fbcfe8', '#fff1f2', '#ffe4e6', '#ffffff']) });
def('Eén groot hart', 'opgebouwd uit alle foto\'s', G[3], (n, W, H, rng, o) => {
  const m = .05, bw = Math.min(W - 2 * m, (H - 2 * m) * 1.1), box = { x: (W - bw) / 2, y: (H - bw / 1.1) / 2, w: bw, h: bw / 1.1 }, cells = maskCells(box, 20 + Math.round(n / 3), (u, v) => pointInPoly(HEART, u, v));
  const slots = cellSlots(cells, n, .008 * o.gap + .002, { type: 'heart', box });
  return { bgs: rotate(rng, [grad('#fff1f2', '#fecdd3', 160), grad('#fde2e4', '#fbcfe8', 160), solids(rng, ['#ffffff'])[0], grad('#4c0519', '#831843'), grad('#fef3c7', '#fed7aa')]), decor: [{ type: 'scatter', emojis: ['❤'], shape: 'heart', n: 18, seed: 5, size: [.02, .05], colors: ['#fb7185', '#f9a8d4', '#fda4af'], alpha: .5, avoid: [{ x: box.x, y: box.y, w: box.w, h: box.h }] }], slots };
}, { overlap: true });
shapeDef('Cirkels', 'ronde foto\'s tegen elkaar', 'circle', { ar: 1, rs: .866, stagger: true, pad: .04, gap: .012, bgs: (rng) => solids(rng, ['#111827', '#ffffff', '#dbeafe', '#fef3c7', '#fce7f3']) });
shapeDef('Zeshoeken', 'honingraat', 'hex', { ar: .866, rs: .75, stagger: true, pad: .04, gap: .012, bgs: (rng) => solids(rng, ['#fef3c7', '#fde68a', '#111827', '#ffffff', '#d1fae5']) });
shapeDef('Sterren', 'een sterrenhemel van foto\'s', 'star', { ar: 1, rs: .86, stagger: true, pad: .04, gap: .01, bgs: (rng) => rotate(rng, [grad('#1e1b4b', '#312e81'), grad('#0f172a', '#1e3a8a'), grad('#fef3c7', '#fde68a'), grad('#fdf2f8', '#e9d5ff'), grad('#064e3b', '#065f46')]) }, (out, n, W, H, rng) => { out.decor = [{ type: 'confetti', n: 70, seed: 3, colors: ['#ffffff', '#fde68a', '#bae6fd'], size: .005, alpha: .6 }]; });
def('Zon', 'cirkel met stralen', G[3], (n, W, H, rng, o) => {
  const rc = 1, m = n - 1, R0 = rc * 1.08, L = rc * (m <= 4 ? 1.35 : 1.15), wMax = Math.min(rc * 1.25, TAU * R0 / m * .9), slots = [mkSlot({ x: -rc, y: -rc, w: 2 * rc, h: 2 * rc }, { shape: { type: 'circle' }, frame: { w: rc * .05, color: '#fff7d6', shadow: .5 }, z: 10 })], off = rng.range(0, TAU);
  for (let i = 0; i < m; i++) { const a = off + i / m * TAU, rd = R0 + L / 2, rot = a / RAD + 90; slots.push(mkSlot({ x: Math.cos(a) * rd - wMax / 2, y: Math.sin(a) * rd - L / 2, w: wMax, h: L }, { shape: { type: 'triangle' }, rot, rotPhoto: -rot, z: i })); }
  const bb = bboxOf(slots); const s = Math.min((W - .1) / (bb.x1 - bb.x0), (H - .1) / (bb.y1 - bb.y0)), cx = W / 2 - (bb.x0 + bb.x1) / 2 * s, cy = H / 2 - (bb.y0 + bb.y1) / 2 * s;
  slots.forEach((q) => { const qx = q.x + q.w / 2, qy = q.y + q.h / 2; q.w *= s; q.h *= s; q.x = cx + qx * s - q.w / 2; q.y = cy + qy * s - q.h / 2; if (q.frame) q.frame.w *= s; });
  return { bgs: rotate(rng, [grad('#7dd3fc', '#fef3c7', 180), grad('#fdba74', '#fde68a', 180), grad('#fef9c3', '#fed7aa', 180), grad('#1e3a8a', '#7c3aed', 180), grad('#a7f3d0', '#fef08a', 180)]), decor: [{ type: 'scatter', emojis: ['☁️'], n: 4, seed: 4, size: [.06, .1], alpha: .8, avoid: [{ x: W * .2, y: H * .2, w: W * .6, h: H * .6 }] }], slots };
}, { overlap: true });
def('Bloem', 'blaadjes rond een midden', G[3], (n, W, H, rng, o) => {
  const rc = 1, m = n - 1, rings = m > 8 ? [Math.ceil(m * .42), m - Math.ceil(m * .42)] : [m], slots = [mkSlot({ x: -rc, y: -rc, w: 2 * rc, h: 2 * rc }, { shape: { type: 'circle' }, frame: { w: rc * .06, color: '#fde047', shadow: .5 }, z: 50 })];
  let base = rc, off = rng.range(0, TAU), zi = 0;
  rings.forEach((cnt, ri) => {
    let Rp = base * 1.6, pw = 1; for (let it = 0; it < 30; it++) { pw = Math.min(TAU * Rp / cnt * .92, rc * (ri ? 1.2 : 1.5)); Rp = base * 1.02 + pw * .7; }
    const pl = pw * 1.4; Rp = base * 1.03 + pl / 2;
    for (let i = 0; i < cnt; i++) { const a = off + (i + (ri ? .5 : 0)) / cnt * TAU, rot = a / RAD + 90; slots.push(mkSlot({ x: Math.cos(a) * Rp - pw / 2, y: Math.sin(a) * Rp - pl / 2, w: pw, h: pl }, { shape: rnd(.5), rot, rotPhoto: -rot, z: ri ? zi++ : 20 + zi++, frame: { w: pw * .03, color: '#fff', shadow: .35 } })); }
    base = Rp + pl / 2; off += .2;
  });
  fit(slots, { x: .03, y: .03, w: W - .06, h: (H - .06) * .8 }, true);
  const c0 = slots[0], cx = c0.x + c0.w / 2, cy = c0.y + c0.h / 2, sy = cy;
  const decor = [{ type: 'line', x1: cx, y1: sy, x2: cx + .02, y2: H + .02, color: '#16a34a', lw: .014, sag: .02 }, { type: 'leaf', x: cx + .09, y: H * .86, s: .06, rot: 55, color: '#22c55e' }, { type: 'leaf', x: cx - .08, y: H * .92, s: .05, rot: -55, color: '#16a34a' }];
  return { bgs: rotate(rng, [grad('#bae6fd', '#dcfce7', 180), grad('#fef9c3', '#bbf7d0', 180), grad('#fce7f3', '#e0f2fe', 180), grad('#fed7aa', '#fef9c3', 180)]), decor, slots };
}, { overlap: true });
shapeDef('Wolken', 'wolken in de lucht', 'cloud', { ar: BLOBS.cloud.ar, rs: .72, stagger: true, pad: .04, gap: .01, bgs: (rng) => rotate(rng, [grad('#60a5fa', '#e0f2fe', 180), grad('#fda4af', '#fef3c7', 180), grad('#1e3a8a', '#7dd3fc', 180), grad('#a78bfa', '#fbcfe8', 180)]) });
def('Driehoeken', 'een patroon van driehoeken', G[3], (n, W, H, rng, o) => {
  const pad = .05, aw = W - 2 * pad, ah = H - 2 * pad, g = .008 * o.gap; let best = null;
  for (let k = 1; k <= n; k++) { const counts = balanced(n, k), mx = Math.max.apply(null, counts), w = Math.min(aw / ((mx + 1) / 2), ah / (k * .866)); if (!best || w > best.w) best = { k, counts, mx, w }; }
  const { counts, mx, w } = best, h = w * .866, x0 = pad + (aw - (mx + 1) * w / 2) / 2, y0 = pad + (ah - best.k * h) / 2, slots = [];
  counts.forEach((cnt, r) => { const sx = x0 + (mx - cnt) * w / 4; for (let j = 0; j < cnt; j++) { const down = (j + r) % 2 === 1; slots.push(mkSlot({ x: sx + j * w / 2 + g / 2, y: y0 + r * h + g / 2, w: w - g, h: h - g }, { shape: { type: 'triangle', flip: down } })); } });
  return { bgs: solids(rng, ['#ffffff', '#fef3c7', '#dbeafe', '#fde2e4', '#111827']), slots };
}, { overlap: true });
shapeDef('Ruiten', 'ruitvormen als een harlekijn', 'diamond', { ar: .72, rs: .5, stagger: true, pad: .03, gap: .012, bgs: (rng) => solids(rng, ['#fde2e4', '#111827', '#fef3c7', '#e0e7ff', '#ffffff']) });
shapeDef('Druppels', 'waterdruppels', 'drop', { ar: .78, rs: .88, stagger: true, pad: .04, gap: .012, bgs: (rng) => rotate(rng, [grad('#bae6fd', '#e0f2fe', 180), grad('#0ea5e9', '#0c4a6e', 180), grad('#a7f3d0', '#e0f2fe', 180), grad('#ddd6fe', '#e0f2fe', 180)]) });
def('Maan en sterren', 'de nacht met een grote maan', G[3], (n, W, H, rng, o) => {
  const m = .05, g = .02 * o.gap, land = W > H * 1.25; let moon, rest;
  if (land) { const ms = Math.min(H - 2 * m, W * .46); moon = { x: m, y: (H - ms) / 2, w: ms, h: ms }; rest = { x: m + ms + .03, y: m, w: W - 2 * m - ms - .03, h: H - 2 * m }; }
  else { const ms = Math.min(W - 2 * m, H * .5); moon = { x: (W - ms) / 2, y: m, w: ms, h: ms }; rest = { x: m, y: m + ms + .02, w: W - 2 * m, h: H - 2 * m - ms - .02 }; }
  const stars = gridCells(n - 1, rest, 1).map((c) => { const q = inset(c, g / 2), s = Math.min(q.w, q.h); return mkSlot({ x: q.x + (q.w - s) / 2, y: q.y + (q.h - s) / 2, w: s, h: s }, { shape: { type: 'star' } }); });
  const decor = [{ type: 'confetti', n: 80, seed: 9, colors: ['#ffffff', '#fde68a', '#bfdbfe'], size: .004, alpha: .7 }, { type: 'scatter', emojis: ['✨'], n: 6, seed: 3, size: [.03, .05], alpha: .8 }];
  return { bgs: rotate(rng, [grad('#0f172a', '#312e81', 170), grad('#1e1b4b', '#4c1d95', 170), grad('#082f49', '#1e3a8a', 170), grad('#111827', '#3b0764', 170)]), decor, slots: [mkSlot(moon, { shape: { type: 'moon' } })].concat(stars) };
});
shapeDef('Pootafdruk', 'pootjes lopen over het papier', 'paw', { ar: BLOBS.paw.ar, rs: .95, stagger: true, pad: .05, gap: .02, rotAlt: 12, bgs: (rng) => solids(rng, ['#fef3c7', '#dcfce7', '#fce7f3', '#e0f2fe', '#ffedd5']) });
def('Vlinder', 'een vlinder gemaakt van foto\'s', G[3], (n, W, H, rng, o) => {
  const B = BLOBS.butterfly, m = .06, bw = Math.min(W - 2 * m, (H - 2 * m) * B.ar), box = { x: (W - bw) / 2, y: (H - bw / B.ar) / 2, w: bw, h: bw / B.ar }, cells = maskCells(box, 22 + Math.round(n / 3), (u, v) => blobHas(B, u, v));
  const slots = cellSlots(cells, n, .008 * o.gap + .002, { type: 'butterfly', box }), cx = W / 2, [x0, y0, x1, y1] = B.bb, mapY = (Y) => box.y + (Y - y0) / (y1 - y0) * box.h;
  const decor = [{ type: 'ellipse', x: cx, y: mapY(.52), rx: box.w * .03, ry: box.h * .31, color: '#1f2937', over: true }, { type: 'line', x1: cx, y1: mapY(.24), x2: cx - box.w * .12, y2: mapY(.08) - .0, color: '#1f2937', lw: .004, sag: -.02, over: true }, { type: 'line', x1: cx, y1: mapY(.24), x2: cx + box.w * .12, y2: mapY(.08), color: '#1f2937', lw: .004, sag: -.02, over: true }];
  return { bgs: rotate(rng, [grad('#d1fae5', '#fef9c3', 170), grad('#bae6fd', '#fbcfe8', 170), grad('#fde68a', '#fbcfe8', 170), grad('#ede9fe', '#cffafe', 170), grad('#14532d', '#365314', 170)]), decor, slots };
}, { overlap: true });
def('Jouw letter of cijfer', 'typ max. 3 tekens', G[3], (n, W, H, rng, o) => {
  const chars = cleanText(o.text); if (!chars.length) chars.push('A');
  const m = .06, cols = chars.length * 5 + (chars.length - 1), cs = Math.min((W - 2 * m) / cols, (H - 2 * m) / 7), x0 = (W - cs * cols) / 2, y0 = (H - cs * 7) / 2, cells = [];
  chars.forEach((ch, ci) => glyphCells(ch).forEach(([gx, gy]) => { const X = ci * 6 + gx; cells.push({ x: x0 + X * cs, y: y0 + gy * cs, w: cs, h: cs, gx: X, gy }); }));
  const slots = cellSlots(cells, n, .008 * o.gap + .002, null);
  return { bgs: rotate(rng, [grad('#fde68a', '#fb7185', 150), grad('#bae6fd', '#c4b5fd', 150), grad('#bbf7d0', '#fef08a', 150), grad('#111827', '#1e1b4b', 150), grad('#fecdd3', '#fed7aa', 150)]), decor: [{ type: 'confetti', n: 40, seed: 8, size: .011, avoid: [{ x: x0, y: y0, w: cs * cols, h: cs * 7 }] }], slots };
}, { overlap: true });

/* ---- Thema ---- */
def('Verjaardag', 'slingers en confetti', G[4], (n, W, H, rng, o) => {
  const g = .028 * o.gap, box = { x: .05, y: .17, w: W - .1, h: H - .17 - .11 }, cells = gridCells(n, box, 1), slots = cells.map((c, i) => mkSlot(inset(c, g / 2), { shape: rnd(.12), rot: (i % 2 ? 1 : -1) * rng.range(.5, 2.5), frame: { w: .006, color: '#fff', shadow: .5 } }));
  const decor = [{ type: 'confetti', n: 90, seed: rng.int(1, 99), size: .012 }, { type: 'bunting', x1: -.02, y1: .035, x2: W + .02, y2: .06, sag: .05, n: Math.round(W * 11) + 3, size: .05 }, { type: 'bunting', x1: -.02, y1: .09, x2: W + .02, y2: .075, sag: .035, n: Math.round(W * 11) + 3, size: .04, colors: ['#a855f7', '#22c55e', '#f43f5e', '#3b82f6', '#f59e0b'] },
    { type: 'balloon', x: .07, y: H - .13, r: .035, color: '#f43f5e', over: true }, { type: 'balloon', x: .13, y: H - .12, r: .03, color: '#3b82f6', over: true }, { type: 'balloon', x: W - .08, y: H - .13, r: .035, color: '#facc15', over: true }, { type: 'balloon', x: W - .14, y: H - .115, r: .03, color: '#22c55e', over: true },
    T(W / 2, H - .055, 'Gefeliciteerd! 🎉', .05, { color: '#fff', stroke: '#be185d', strokeW: .18, maxw: W * .6, over: true })];
  return { bgs: rotate(rng, [grad('#fda4af', '#fde68a', 160), grad('#a5b4fc', '#fbcfe8', 160), grad('#fde68a', '#fca5a5', 160), grad('#86efac', '#bae6fd', 160), grad('#c4b5fd', '#f9a8d4', 160)]), decor, slots };
});
def('Vakantie', 'ansichtkaart met stempels', G[4], (n, W, H, rng, o) => {
  const g = .02 * o.gap, land = W >= H * 1.1, m = .07; let pr, tr;
  if (land) { pr = { x: m, y: m, w: (W - 2 * m) * .58, h: H - 2 * m }; tr = { x: m + pr.w + .05, y: m, w: W - 2 * m - pr.w - .05, h: H - 2 * m }; }
  else { pr = { x: m, y: m, w: W - 2 * m, h: (H - 2 * m) * .62 }; tr = { x: m, y: m + pr.h + .035, w: W - 2 * m, h: H - 2 * m - pr.h - .035 }; }
  const slots = gridCells(n, pr, 1.2).map((c, i) => mkSlot(inset(c, g / 2), { rot: (i % 2 ? 1 : -1) * rng.range(.4, 1.6), frame: { w: .006, color: '#fffdf8', shadow: .5 } }));
  const decor = [{ type: 'airmail', x: .01, y: .01, w: W - .02, h: H - .02, t: .02 }], sw = Math.min(tr.w * .28, .13), px = tr.x + tr.w - sw / 2, py = tr.y + sw * .6;
  if (land) decor.push({ type: 'line', x1: tr.x - .025, y1: m, x2: tr.x - .025, y2: H - m, color: '#a8a29e', lw: .002 });
  else decor.push({ type: 'line', x1: m, y1: tr.y - .018, x2: W - m, y2: tr.y - .018, color: '#a8a29e', lw: .002 });
  decor.push({ type: 'postage', x: px, y: py, w: sw, h: sw * 1.18, rot: 4, color: rng.pick(['#fca5a5', '#93c5fd', '#fde68a']), e: rng.pick(['🌴', '☀️', '🏖️', '⛵']), val: '€1' }, { type: 'postage', x: px - sw * 1.15, y: py + sw * .08, w: sw * .9, h: sw * 1.06, rot: -5, color: '#a7f3d0', e: '🐚', val: '€0,5' },
    { type: 'stamp', x: px - sw * 1.0, y: py + sw * .55, r: sw * .5, rot: -12, t: phStamp(rng), sub: '14 JULI', waves: true, over: true },
    T(tr.x, tr.y + sw * 1.75, 'Groetjes van onze vakantie!', .034, { align: 'left', font: 'hand', color: '#374151', italic: true, maxw: tr.w }));
  const ly = tr.y + sw * 2.1, lh = Math.min(.04, (tr.y + tr.h - ly - .02) / 4);
  for (let i = 0; i < 3; i++) decor.push({ type: 'line', x1: tr.x, y1: ly + lh * (i + 1), x2: tr.x + tr.w, y2: ly + lh * (i + 1), color: '#cbd5e1', lw: .002 });
  return { bgs: solids(rng, ['#f6efe0', '#fff7ed', '#f0f9ff', '#fef9c3']), decor, slots };
});
def('Liefde', 'roze met harten', G[4], (n, W, H, rng, o) => {
  const g = .035 * o.gap, box = { x: .06, y: .06, w: W - .12, h: H - .06 - .13 }, cells = gridCells(n, box, 1), slots = cells.map((c, i) => mkSlot(inset(c, g / 2), { shape: rnd(.14), rot: (i % 2 ? 1 : -1) * rng.range(.8, 3), frame: { w: .008, color: '#fff', shadow: .5 } }));
  const decor = [{ type: 'scatter', emojis: ['❤'], shape: 'heart', n: 34, seed: rng.int(1, 99), size: [.025, .09], colors: ['#f9a8d4', '#fb7185', '#fda4af', '#fbcfe8', '#f472b6'], alpha: .55 }];
  slots.forEach((s) => { if (rng() < .45) decor.push({ type: 'shape', shape: { type: 'heart' }, x: s.x + s.w - .028, y: s.y - .02, w: .05, h: .045, color: '#e11d48', rot: rng.range(10, 30), over: true, shadow: .01 }); });
  decor.push(T(W / 2, H - .065, 'Met liefde ❤', .052, { font: 'hand', italic: true, color: '#be123c', maxw: W * .7, over: true }));
  return { bgs: rotate(rng, [grad('#fecdd3', '#fbcfe8', 160), grad('#ffe4e6', '#fda4af', 160), grad('#fdf2f8', '#f9a8d4', 160), grad('#fce7f3', '#ddd6fe', 160)]), decor, slots };
});
def('Winter', 'sneeuw en ijskristallen', G[4], (n, W, H, rng, o) => {
  const g = .035 * o.gap, box = { x: .05, y: .05, w: W - .1, h: H * .78 - .05 }, cells = gridCells(n, box, 1), slots = cells.map((c, i) => mkSlot(inset(c, g / 2), { shape: rnd(.1), rot: (i % 2 ? 1 : -1) * rng.range(.5, 2.5), frame: { w: .01, color: '#ffffff', shadow: .55 } }));
  const decor = [{ type: 'wave', y: H * .87, amp: .012, len: .35, color: '#ffffff', alpha: .9, phase: 1 }, { type: 'wave', y: H * .92, amp: .014, len: .28, color: '#eaf4ff', phase: 3 },
    { type: 'scatter', emojis: ['🌲', '🎄', '⛄', '🌲'], n: 7, seed: rng.int(1, 50), size: [.05, .09], rotMax: 6, area: { x: .03, y: H * .86, w: W - .06, h: H * .1 } },
    { type: 'snow', n: 80, seed: 5, size: [.003, .008], alpha: .9, over: true }];
  return { bgs: rotate(rng, [grad('#7fb2e5', '#e6f2ff', 180), grad('#a5b4fc', '#f1f5f9', 180), grad('#334155', '#94a3b8', 180), grad('#bae6fd', '#ffffff', 180)]), decor, slots };
});
def('Herfst', 'bladeren in warme kleuren', G[4], (n, W, H, rng, o) => {
  const g = .03 * o.gap, box = { x: .06, y: .06, w: W - .12, h: H - .12 }, cells = gridCells(n, box, 1), slots = cells.map((c, i) => mkSlot(inset(c, g / 2), { rot: (i % 2 ? 1 : -1) * rng.range(.5, 2.5), frame: { w: .011, color: rng.pick(['#7a4a2b', '#8a5a2c', '#9a3412']), shadow: .5 } }));
  const cols = ['#d97706', '#b45309', '#dc2626', '#ca8a04', '#9a3412', '#ea580c'], decor = [], rg = makeRng(rng.int(1, 999));
  for (let i = 0; i < 26; i++) decor.push({ type: 'leaf', x: rg.range(0, W), y: rg.range(0, H), s: rg.range(.02, .045), rot: rg.range(0, 360), color: rg.pick(cols), alpha: .55 });
  for (let i = 0; i < 7; i++) decor.push({ type: 'leaf', x: rg.pick([.02, W - .02]) + rg.range(-.03, .03), y: rg.range(0, H), s: rg.range(.035, .06), rot: rg.range(0, 360), color: rg.pick(cols), over: true });
  decor.push({ type: 'scatter', emojis: ['🍂', '🍁', '🎃', '🌰'], n: 5, seed: 12, size: [.04, .06], over: true, area: { x: 0, y: 0, w: W, h: H }, avoid: [{ x: .08, y: .08, w: W - .16, h: H - .16 }] });
  return { bgs: rotate(rng, [grad('#fcd9a8', '#e9965a', 160), grad('#fde68a', '#c2410c', 160), grad('#d6c5a8', '#8a5a2c', 160), grad('#fed7aa', '#b45309', 160)]), decor, slots };
});
def('Zomer en strand', 'zon, zee en zand', G[4], (n, W, H, rng, o) => {
  const g = .03 * o.gap, box = { x: .06, y: .07, w: W - .12, h: H * .8 - .07 }, cells = gridCells(n, box, 1), slots = cells.map((c, i) => mkSlot(inset(c, g / 2), { shape: rnd(.06), rot: (i % 2 ? 1 : -1) * rng.range(.5, 2.5), frame: { w: .009, b: .012, color: '#fffdf8', shadow: .5 } }));
  const decor = [{ type: 'circle', x: W - .1, y: .1, r: .07, color: '#fde047' }, { type: 'sunrays', x: W - .1, y: .1, r1: .08, r2: .115, n: 12, color: '#fde047', alpha: .8 },
    { type: 'wave', y: H * .8, amp: .012, len: .22, color: '#38bdf8', alpha: .55, phase: 0 }, { type: 'wave', y: H * .84, amp: .012, len: .3, color: '#fde68a', phase: 2 },
    { type: 'scatter', emojis: ['🐚', '🦀', '⛱️', '🌴', '🍉', '🐠'], n: 8, seed: rng.int(1, 60), size: [.045, .075], rotMax: 20, area: { x: .03, y: H * .87, w: W - .06, h: H * .1 }, over: true }];
  return { bgs: [{ type: 'gradient', stops: [[0, '#7dd3fc'], [.55, '#e0f2fe'], [.6, '#fde68a'], [1, '#fcd34d']], angle: 180 }, grad('#fda4af', '#fde68a', 180), grad('#22d3ee', '#fef3c7', 180)], decor, slots };
});
def('Retro jaren 90', 'neon en memphis', G[4], (n, W, H, rng, o) => {
  const g = .036 * o.gap, box = { x: .06, y: .06, w: W - .12, h: H - .12 }, cells = gridCells(n, box, 1), nc = ['#ff2e93', '#22e5ff', '#fde047', '#a3ff3c', '#b366ff'], slots = cells.map((c, i) => mkSlot(inset(c, g / 2), { frame: { w: .007, color: nc[i % nc.length], shadow: .8, glow: true } }));
  const decor = [], rg = makeRng(rng.int(1, 99));
  for (let i = 0; i < 9; i++) { const x = rg.range(.03, W - .03), y = rg.range(.02, H - .02), k = rg.int(0, 3); decor.push(k === 0 ? { type: 'zigzag', x, y, w: .12, amp: .012, n: 6, color: rg.pick(nc), glow: true } : k === 1 ? { type: 'circle', x, y, r: .02, stroke: rg.pick(nc), lw: .005 } : k === 2 ? { type: 'shape', shape: { type: 'triangle' }, x, y, w: .04, h: .035, stroke: rg.pick(nc), lw: .005, rot: rg.range(0, 90) } : { type: 'shape', shape: { type: 'star' }, x, y, w: .04, h: .04, color: rg.pick(nc), alpha: .8 }); }
  return { bgs: rotate(rng, [pat('synth', '#140a33', '#ff2e93', .05), pat('grid', '#0f0a2a', 'rgba(34,229,255,.35)', .05), grad('#1a0b3d', '#4a0e6b', 160), pat('checker', '#1e1b4b', 'rgba(255,46,147,.2)', .06)]), decor, slots };
});
def('Vintage fotoalbum', 'plakhoekjes en handschrift', G[4], (n, W, H, rng, o) => {
  const pm = .035, m = .085, g = .03 * o.gap, box = { x: m, y: m, w: W - 2 * m, h: H - 2 * m }, cells = gridCells(n, box, 1), slots = [], decor = [{ type: 'rect', x: pm, y: pm, w: W - 2 * pm, h: H - 2 * pm, color: '#efe6d2', r: .01, shadow: .02 }, { type: 'rect', x: pm + .012, y: pm + .012, w: W - 2 * pm - .024, h: H - 2 * pm - .024, stroke: '#b49a6a', lw: .002, dash: [.008, .006] }];
  const caps = ['Zomer 1987', 'Oma en opa', 'Op vakantie', 'Lekker buiten', 'Kerst', 'Feestje', 'Mooie dag', 'Samen', 'Verjaardag', 'Weekend', 'Aan het strand', 'Thuis'], cs = rng.shuffle(caps), lab = Math.min(.03, box.h / Math.max(2, cells.length) * .25);
  cells.forEach((c, i) => { const b = inset(c, g / 2), s = mkSlot({ x: b.x, y: b.y, w: b.w, h: b.h - lab }, { rot: rng.range(-1.5, 1.5), frame: { w: .004, color: '#fffdf8', shadow: .35 } }); slots.push(s);
    decor.push({ type: 'corners', x: s.x, y: s.y, w: s.w, h: s.h, rot: s.rot, size: Math.min(s.w, s.h) * .16, color: '#3b2f22', over: true }, T(s.x + s.w / 2, s.y + s.h + lab * .55, cs[i % cs.length], lab * .8, { font: 'hand', italic: true, weight: 400, color: '#4b3b2a', maxw: s.w, rot: s.rot * .4 })); });
  return { bgs: rotate(rng, [pat('paper', '#4a2f1d', '#c2956a', .05), pat('paper', '#2d3b2f', '#9bb59f', .05), pat('paper', '#5b1f2a', '#d99ba5', .05)]), decor, slots, look: { filter: 'sepia' } };
});
def('Krantenpagina', 'zwart-wit met een grote kop', G[4], (n, W, H, rng, o) => {
  const m = .04, head = Math.min(.24, .13 + .1 * (1 - W / 1.5)), g = .016 * o.gap, box = { x: m, y: head + .01, w: W - 2 * m, h: H - head - m }, cells = gridCells(n, box, 1.15), slots = [], decor = [];
  decor.push(T(W / 2, .045, 'DE DAGBLAD', Math.min(.07, W * .13), { font: 'serif', weight: 900, color: '#111', maxw: W - 2 * m }), { type: 'line', x1: m, y1: .09, x2: W - m, y2: .09, color: '#111', lw: .004 }, { type: 'line', x1: m, y1: .097, x2: W - m, y2: .097, color: '#111', lw: .0015 },
    T(m, .115, 'ZATERDAG · EDITIE FAMILIE', .015, { align: 'left', font: 'serif', weight: 400, color: '#444' }), T(W / 2, head - .03, 'GROTE FOTO\'S OP DE VOORPAGINA', Math.min(.034, W * .055), { font: 'serif', weight: 900, color: '#111', maxw: W - 2 * m }), { type: 'line', x1: m, y1: head - .005, x2: W - m, y2: head - .005, color: '#111', lw: .002 });
  const capH = Math.min(.045, box.h / cells.length * .3);
  cells.forEach((c, i) => { const b = inset(c, g / 2); slots.push(mkSlot({ x: b.x, y: b.y, w: b.w, h: b.h - capH }, { frame: { w: .002, color: '#111' } })); decor.push({ type: 'textlines', x: b.x, y: b.y + b.h - capH + .004, w: b.w, h: capH - .006, rows: capH > .03 ? 3 : 2, seed: i + 3, color: '#6b7280' }); });
  return { bgs: solids(rng, ['#ece8dc', '#f4f1e8', '#e5e1d3', '#f7f7f2']), decor, slots, look: { filter: 'bw' } };
});
def('Stripverhaal', 'panelen met tekstballonnen', G[4], (n, W, H, rng, o) => {
  const m = .035, g = .02 * o.gap, cells = treemap(n, { x: m, y: m, w: W - 2 * m, h: H - 2 * m }, rng, .22, 2.2), slots = cells.map((c) => mkSlot(inset(c, g / 2), { frame: { w: .0045, color: '#111' } })), decor = [], words = rng.shuffle(['WOW!', 'Haha!', 'Kijk!', 'Hoera!', 'Ooooh!', 'Yes!', 'Hmm...']);
  const idx = rng.shuffle(slots.map((_, i) => i)); let cnt = 0;
  idx.forEach((i) => { const s = slots[i]; if (cnt >= Math.min(3, Math.ceil(n / 3)) || s.w < .2 || s.h < .12) return; const bw = Math.min(s.w * .46, .24), bh = bw * .55; decor.push({ type: 'speech', x: s.x + s.w * .3, y: s.y + bh * .62 + .008, w: bw, h: bh, tx: s.x + s.w * .45, ty: s.y + bh + .045, t: words[cnt], size: bh * .4, over: true }); cnt++; });
  const big = slots.slice().sort((a, b) => b.w * b.h - a.w * a.h)[0]; if (big && n >= 6) decor.push({ type: 'burst', x: big.x + big.w * .8, y: big.y + big.h * .82, r: Math.min(big.w, big.h) * .2, rot: rng.range(-12, 12), t: 'POW!', over: true });
  return { bgs: rotate(rng, [pat('halftone', '#fde047', 'rgba(220,38,38,.28)', .02), pat('halftone', '#ffffff', 'rgba(37,99,235,.3)', .02), pat('halftone', '#fecaca', 'rgba(220,38,38,.3)', .02), pat('halftone', '#bae6fd', 'rgba(37,99,235,.3)', .02)]), decor, slots };
});
def('Tijdlijn', 'foto\'s langs een lijn met jaartallen', G[4], (n, W, H, rng, o) => {
  const m = .05, land = W >= H * 1.2, inc = n <= 6 ? rng.int(1, 3) : 1, sy = rng.int(1992, 2025 - n * inc), slots = [], decor = [], lc = '#94a3b8', g = .012 * o.gap;
  const node = (x, y, yr) => decor.push({ type: 'circle', x, y, r: .013, color: '#fff', stroke: '#6366f1', lw: .005, over: true });
  if (!land) {
    const cw = W / 2 - m - .06, hh = Math.min(2 * (H - 2 * m) / (n + 1) - g, cw * 1.25), step = (H - 2 * m - hh) / (n - 1);
    decor.push({ type: 'line', x1: W / 2, y1: m * .6, x2: W / 2, y2: H - m * .6, color: lc, lw: .006 });
    for (let i = 0; i < n; i++) { const cy = m + hh / 2 + step * i, left = i % 2 === 0, x = left ? m : W / 2 + .06; slots.push(mkSlot({ x, y: cy - hh / 2, w: cw, h: hh }, { shape: rnd(.08), frame: { w: .005, color: '#fff', shadow: .5 } }));
      decor.push({ type: 'line', x1: W / 2, y1: cy, x2: left ? m + cw : W / 2 + .06, y2: cy, color: lc, lw: .003 }); node(W / 2, cy);
      decor.push(T(left ? W / 2 + .03 : W / 2 - .03, cy, String(sy + i * inc), .026, { align: left ? 'left' : 'right', color: '#475569', font: 'mono' })); }
  } else {
    const hh = H / 2 - m - .06, ww = Math.min(2 * (W - 2 * m) / (n + 1) - g, hh * 1.25), step = (W - 2 * m - ww) / (n - 1);
    decor.push({ type: 'line', x1: m * .6, y1: H / 2, x2: W - m * .6, y2: H / 2, color: lc, lw: .006 });
    for (let i = 0; i < n; i++) { const cx = m + ww / 2 + step * i, top = i % 2 === 0, y = top ? m : H / 2 + .06; slots.push(mkSlot({ x: cx - ww / 2, y: top ? y + hh - hh : y, w: ww, h: hh }, { shape: rnd(.08), frame: { w: .005, color: '#fff', shadow: .5 } }));
      decor.push({ type: 'line', x1: cx, y1: H / 2, x2: cx, y2: top ? m + hh : H / 2 + .06, color: lc, lw: .003 }); node(cx, H / 2);
      decor.push(T(cx, top ? H / 2 + .035 : H / 2 - .035, String(sy + i * inc), .024, { color: '#475569', font: 'mono' })); }
  }
  return { bgs: solids(rng, ['#f8fafc', '#fef3c7', '#eef2ff', '#ecfdf5', '#fff1f2']), decor, slots };
});
def('Instagram-feed', '3 kolommen met profiel erboven', G[4], (n, W, H, rng, o) => {
  const gp = .005 * o.gap + .002, hh = Math.min(.24, W * .38), fh = .06, rows = Math.ceil(n / 3), availH = H - hh - fh - .01, cw = Math.min((W - 2 * gp) / 3, (availH - (rows - 1) * gp) / rows), gw = cw * 3 + gp * 2, gx = (W - gw) / 2, gy = hh + .005, slots = [], decor = [];
  for (let i = 0; i < n; i++) slots.push(mkSlot({ x: gx + (i % 3) * (cw + gp), y: gy + Math.floor(i / 3) * (cw + gp), w: cw, h: cw }));
  const pr = hh * .26, px = W * .13, py = hh * .42, nm = ['jouw.collage', 'mijn.fotos', 'samen.leuk'][rng.int(0, 2)];
  decor.push({ type: 'circle', x: px, y: py, r: pr + .007, stroke: '#e1306c', lw: .006 }, { type: 'circle', x: px, y: py, r: pr, color: '#fde68a' }, { type: 'emoji', x: px, y: py + .003, s: pr * 1.3, e: rng.pick(['😊', '🦊', '🌈', '🐱']) },
    T(W * .27, py - hh * .16, nm, .026, { align: 'left', color: '#111', maxw: W * .4 }), T(W * .27, py + hh * .03, n + ' berichten  ·  123 volgers', .016, { align: 'left', weight: 500, color: '#555', maxw: W * .62 }),
    { type: 'rect', x: W * .27, y: py + hh * .12, w: W * .3, h: hh * .15, color: '#3b82f6', r: .25 }, T(W * .27 + W * .15, py + hh * .195, 'Volgen', .018, { color: '#fff', maxw: W * .24 }));
  [0, 1, 2, 3].forEach((i) => decor.push({ type: 'circle', x: W * (.13 + i * .2), y: hh * .86, r: hh * .075, color: ['#fecaca', '#bfdbfe', '#bbf7d0', '#fde68a'][i], stroke: '#d1d5db', lw: .002 }));
  decor.push({ type: 'line', x1: 0, y1: H - fh, x2: W, y2: H - fh, color: '#e5e7eb', lw: .002 });
  ['🏠', '🔍', '➕', '❤️', '👤'].forEach((e, i) => decor.push({ type: 'emoji', x: W * (.1 + i * .2), y: H - fh / 2, s: .03, e }));
  return { bgs: solids(rng, ['#ffffff', '#fafafa', '#f3f4f6', '#fff7ed']), decor, slots };
});

export const STYLES = DEFS.map((d, i) => {
  const id = d.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    id, name: d.name, desc: d.desc, group: d.group, index: i, overlap: !!d.flags.overlap, usesText: id === 'jouw-letter-of-cijfer',
    make(n, ratio, rng, opts) {
      const R = ratio > 0 ? ratio : 1, o = Object.assign({ gap: 1, text: '' }, opts || {}); o.gap = clamp(Number(o.gap) || 0, 0, 3);
      const out = d.fn(n, R, 1, rng || makeRng(1), o);
      const slots = out.slots.map((s) => {
        const q = { x: s.x / R, y: s.y, w: s.w / R, h: s.h, rot: s.rot || 0, shape: s.shape || RECT, frame: null, z: s.z || 0 };
        if (s.frame) q.frame = { w: (s.frame.w || 0) / R, b: (s.frame.b || 0) / R, color: s.frame.color || '#fff', shadow: s.frame.shadow === true ? .5 : (s.frame.shadow || 0), glow: !!s.frame.glow };
        ['copyOf', 'mirror', 'rotPhoto', 'filter'].forEach((k) => { if (s[k] != null) q[k] = s[k]; });
        return q;
      });
      return { bg: out.bgs[0], bgs: out.bgs, decor: out.decor || [], slots, look: out.look || null };
    },
  };
});
export const STYLE_GROUPS = G;
export const RATIOS = [['1:1', 1], ['4:5', .8], ['9:16', 9 / 16], ['3:2', 1.5]];
// kleur om een achtergrond-staal mee te tonen
export const bgSwatch = (bg) => (!bg ? '#fff' : bg.type === 'gradient' ? (bg.from || (bg.stops && bg.stops[0][1]) || '#fff') : bg.color || '#fff');
