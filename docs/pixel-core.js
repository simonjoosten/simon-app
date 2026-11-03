// Pixel-art kern: pure logica (geen DOM) – lagen, frames, vormen, vullen, selecties, palet-sets, sjablonen, GIF-encoder en opslagformaat.

export const PALETTE = ['#000000', '#ffffff', '#9ca3af', '#4b5563', '#ef4444', '#f97316', '#facc15', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#7c2d12', '#b45309', '#fcd9b6', '#fde68a', '#bbf7d0', '#bae6fd', '#ddd6fe', '#fbcfe8'];

// Palet-sets (naam, kleuren)
export const PALETTES = [
  ['Klassiek', PALETTE],
  ['Gameboy', ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']],
  ['Retro 8-bit', ['#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8', '#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c', '#ff77a8', '#ffccaa']],
  ['Pastel', ['#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#a5f3fc', '#bfdbfe', '#ddd6fe', '#fbcfe8', '#ffffff', '#e5e7eb', '#d6d3d1', '#fde68a']],
  ['Zonsondergang', ['#1e1b4b', '#4c1d95', '#86198f', '#be185d', '#e11d48', '#f97316', '#fbbf24', '#fde68a', '#fef3c7', '#0f172a']],
  ['Oceaan', ['#082f49', '#0c4a6e', '#075985', '#0369a1', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe', '#14b8a6', '#5eead4', '#f0fdfa']],
  ['Bos', ['#052e16', '#14532d', '#166534', '#15803d', '#22c55e', '#86efac', '#78350f', '#92400e', '#b45309', '#d97706', '#fcd9b6', '#ecfccb']],
  ['Huidskleuren', ['#fff1e6', '#fcd9b6', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a1e', '#3b2314', '#f4a6a0', '#d4756b']],
  ['Neon', ['#000000', '#ff00e6', '#00fff0', '#39ff14', '#fff200', '#ff3131', '#8a2be2', '#1f51ff', '#ff6ec7', '#ffffff']],
  ['Zwart-wit', ['#000000', '#171717', '#404040', '#737373', '#a3a3a3', '#d4d4d4', '#f5f5f5', '#ffffff']],
];

export const SIZES = [8, 16, 24, 32, 48, 64];
export const MAX_FRAMES = 24, MAX_LAYERS = 6;

import { R4_TEMPLATES } from './creatief-r4-pixel.js?v=1';
export const blank = (n) => Array(n * n).fill(null);

// ---------- document: { n, fps, layers:[{name,vis}], frames:[ [cells per laag] ] } ----------
export function newDoc(n = 16) {
  return { n, fps: 6, layers: [{ name: 'Laag 1', vis: true }], frames: [[blank(n)]] };
}
export function cloneDoc(d) {
  return { n: d.n, fps: d.fps, layers: d.layers.map((l) => ({ ...l })), frames: d.frames.map((f) => f.map((c) => c.slice())) };
}
// Samengevoegd beeld van 1 frame (onderste laag eerst).
export function composite(d, fi, opts = {}) {
  const out = blank(d.n); const f = d.frames[fi];
  d.layers.forEach((l, li) => {
    if (!l.vis && !opts.all) return;
    const c = f[li]; for (let i = 0; i < c.length; i++) if (c[i]) out[i] = c[i];
  });
  return out;
}
export function addLayer(d, name) {
  if (d.layers.length >= MAX_LAYERS) return false;
  d.layers.push({ name: name || `Laag ${d.layers.length + 1}`, vis: true });
  d.frames.forEach((f) => f.push(blank(d.n))); return true;
}
export function removeLayer(d, li) {
  if (d.layers.length <= 1) return false;
  d.layers.splice(li, 1); d.frames.forEach((f) => f.splice(li, 1)); return true;
}
export function moveLayer(d, li, dir) {
  const j = li + dir; if (j < 0 || j >= d.layers.length) return li;
  [d.layers[li], d.layers[j]] = [d.layers[j], d.layers[li]]; d.frames.forEach((f) => { [f[li], f[j]] = [f[j], f[li]]; }); return j;
}
export function dupLayer(d, li) {
  if (d.layers.length >= MAX_LAYERS) return false;
  d.layers.splice(li + 1, 0, { name: d.layers[li].name + ' kopie', vis: true }); d.frames.forEach((f) => f.splice(li + 1, 0, f[li].slice())); return true;
}
// Laag samenvoegen met de laag eronder.
export function mergeDown(d, li) {
  if (li <= 0) return false;
  d.frames.forEach((f) => { const a = f[li - 1], b = f[li]; for (let i = 0; i < a.length; i++) if (b[i]) a[i] = b[i]; });
  d.layers.splice(li, 1); d.frames.forEach((f) => f.splice(li, 1)); return true;
}
export function addFrame(d, at, copy) {
  if (d.frames.length >= MAX_FRAMES) return -1;
  const src = d.frames[at]; const nf = d.layers.map((_, li) => (copy ? src[li].slice() : blank(d.n)));
  d.frames.splice(at + 1, 0, nf); return at + 1;
}
export function removeFrame(d, fi) {
  if (d.frames.length <= 1) return false; d.frames.splice(fi, 1); return true;
}
export function moveFrame(d, fi, dir) {
  const j = fi + dir; if (j < 0 || j >= d.frames.length) return fi;
  [d.frames[fi], d.frames[j]] = [d.frames[j], d.frames[fi]]; return j;
}
// Raster-formaat veranderen (inhoud blijft linksboven staan of wordt bijgesneden).
export function resizeDoc(d, n2) {
  const m = Math.min(d.n, n2);
  d.frames = d.frames.map((f) => f.map((c) => { const o = blank(n2); for (let y = 0; y < m; y++) for (let x = 0; x < m; x++) o[y * n2 + x] = c[y * d.n + x]; return o; }));
  d.n = n2; return d;
}

// ---------- vormen (geven lijst van [x,y]) ----------
export function linePts(x0, y0, x1, y1) {
  const pts = []; let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy;
  for (let guard = 0; guard < 10000; guard++) {
    pts.push([x0, y0]); if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; }
  }
  return pts;
}
export function rectPts(x0, y0, x1, y1, fill) {
  const ax = Math.min(x0, x1), bx = Math.max(x0, x1), ay = Math.min(y0, y1), by = Math.max(y0, y1), pts = [];
  for (let y = ay; y <= by; y++) for (let x = ax; x <= bx; x++) if (fill || x === ax || x === bx || y === ay || y === by) pts.push([x, y]);
  return pts;
}
// Ellips/cirkel binnen de omhullende rechthoek.
export function ellipsePts(x0, y0, x1, y1, fill) {
  const ax = Math.min(x0, x1), bx = Math.max(x0, x1), ay = Math.min(y0, y1), by = Math.max(y0, y1);
  const cx = (ax + bx) / 2, cy = (ay + by) / 2, rx = (bx - ax) / 2 + 0.5, ry = (by - ay) / 2 + 0.5, pts = [];
  const inside = (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  for (let y = ay; y <= by; y++) for (let x = ax; x <= bx; x++) {
    if (!inside(x, y)) continue;
    if (fill || !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) pts.push([x, y]);
  }
  return pts;
}
// Penseel van grootte s (1-4) rond punt.
export function brushPts(x, y, s) {
  if (s <= 1) return [[x, y]]; const pts = [], o = Math.floor((s - 1) / 2);
  for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) pts.push([x - o + i, y - o + j]); return pts;
}
// Spiegelen: mode 'x' | 'y' | 'xy'
export function mirrorPts(pts, n, mode) {
  if (!mode) return pts; const out = pts.slice();
  for (const [x, y] of pts) {
    if (mode === 'x' || mode === 'xy') out.push([n - 1 - x, y]);
    if (mode === 'y' || mode === 'xy') out.push([x, n - 1 - y]);
    if (mode === 'xy') out.push([n - 1 - x, n - 1 - y]);
  }
  return out;
}
export function putPts(cells, n, pts, color) {
  let changed = 0;
  for (const [x, y] of pts) { if (x < 0 || y < 0 || x >= n || y >= n) continue; const i = y * n + x; if (cells[i] !== color) { cells[i] = color; changed++; } }
  return changed;
}
// Emmer (vloeien naar 4 buren).
export function flood(cells, n, x, y, color) {
  if (x < 0 || y < 0 || x >= n || y >= n) return 0;
  const target = cells[y * n + x]; if (target === color) return 0;
  const stack = [y * n + x]; let cnt = 0;
  while (stack.length) {
    const p = stack.pop(); if (cells[p] !== target) continue; cells[p] = color; cnt++;
    const px = p % n, py = (p / n) | 0;
    if (px > 0) stack.push(p - 1); if (px < n - 1) stack.push(p + 1); if (py > 0) stack.push(p - n); if (py < n - 1) stack.push(p + n);
  }
  return cnt;
}

// ---------- selecties / transformaties ----------
export const normRect = (x0, y0, x1, y1) => ({ x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0) + 1, h: Math.abs(y1 - y0) + 1 });
export function copyRegion(cells, n, r) {
  const out = []; for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) { const X = r.x + x, Y = r.y + y; out.push(X >= 0 && Y >= 0 && X < n && Y < n ? cells[Y * n + X] : null); }
  return { w: r.w, h: r.h, cells: out };
}
export function clearRegion(cells, n, r) {
  for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) { const X = r.x + x, Y = r.y + y; if (X >= 0 && Y >= 0 && X < n && Y < n) cells[Y * n + X] = null; }
}
// Plakken: lege (null) cellen van het klembord laten onderliggende pixels staan.
export function pasteRegion(cells, n, clip, ox, oy) {
  for (let y = 0; y < clip.h; y++) for (let x = 0; x < clip.w; x++) {
    const v = clip.cells[y * clip.w + x]; const X = ox + x, Y = oy + y; if (v && X >= 0 && Y >= 0 && X < n && Y < n) cells[Y * n + X] = v;
  }
}
export function flipCells(cells, n, axis) {
  const o = blank(n); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) o[(axis === 'y' ? n - 1 - y : y) * n + (axis === 'x' ? n - 1 - x : x)] = cells[y * n + x]; return o;
}
export function rotateCells(cells, n) { // 90 graden rechtsom
  const o = blank(n); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) o[x * n + (n - 1 - y)] = cells[y * n + x]; return o;
}
export function shiftCells(cells, n, dx, dy, wrap = true) { // verschuiven (rond of weg)
  const o = blank(n); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let X = x + dx, Y = y + dy; if (wrap) { X = (X + n) % n; Y = (Y + n) % n; } else if (X < 0 || Y < 0 || X >= n || Y >= n) continue; o[Y * n + X] = cells[y * n + x];
  } return o;
}
export function replaceColor(cells, from, to) { let c = 0; for (let i = 0; i < cells.length; i++) if (cells[i] === from) { cells[i] = to; c++; } return c; }
export function outline(cells, n, color) { // omtrek om de vorm
  const o = cells.slice(); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (cells[y * n + x]) continue; if ((x > 0 && cells[y * n + x - 1]) || (x < n - 1 && cells[y * n + x + 1]) || (y > 0 && cells[(y - 1) * n + x]) || (y < n - 1 && cells[(y + 1) * n + x])) o[y * n + x] = color;
  } return o;
}
export const countColors = (cells) => new Set(cells.filter(Boolean)).size;

// ---------- hulp voor weergave ----------
export const hexRgb = (h) => { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h || ''); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0]; };
export const rgbHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, '0')).join('');

// ---------- sjablonen ----------
// Elke sjabloon: 16 regels van 16 tekens; '.' is leeg, teken -> kleur.
export const TEMPLATES = [
  { name: 'Hartje', key: { r: '#ef4444', d: '#b91c1c', w: '#fecaca' }, rows: ['................', '..rrrr....rrrr..', '.rwwrrr..rrrrrr.', '.rwrrrrrrrrrrrr.', 'rrrrrrrrrrrrrrrr', 'rrrrrrrrrrrrrrrr', 'rrrrrrrrrrrrrrrr', '.rrrrrrrrrrrrrr.', '.drrrrrrrrrrrrd.', '..drrrrrrrrrrd..', '...drrrrrrrrd...', '....drrrrrrd....', '.....drrrrd.....', '......drrd......', '.......dd.......', '................'] },
  { name: 'Smiley', key: { y: '#facc15', o: '#b45309', k: '#1f2937', r: '#ef4444' }, rows: ['................', '.....oooooo.....', '...ooyyyyyyoo...', '..oyyyyyyyyyyo..', '.oyyyyyyyyyyyyo.', '.oyykkyyyykkyyo.', 'oyyykkyyyykkyyyo', 'oyyyyyyyyyyyyyyo', 'oyyyyyyyyyyyyyyo', 'oyykyyyyyyyykyyo', '.oyykyyyyyykyyo.', '.oyyykkkkkkyyyo.', '..oyyyyyyyyyyo..', '...ooyyyyyyoo...', '.....oooooo.....', '................'] },
  { name: 'Paddenstoel', key: { r: '#ef4444', w: '#ffffff', b: '#fcd9b6', d: '#7f1d1d', k: '#92400e' }, rows: ['................', '.....dddddd.....', '...ddrrrrrrdd...', '..drrwwrrrrrrd..', '.drrwwwwrrwwrrd.', '.drrwwwwrrwwrrd.', 'drrrrwwrrrrrrrrd', 'drrrrrrrrrwwrrrd', 'drrwwrrrrwwwwrrd', 'ddddddddddddddd.', '....kbbbbbbk....', '....kbbbbbbk....', '....kbbbbbbk....', '....kbbbbbbk....', '...kkbbbbbbkk...', '................'] },
  { name: 'Ruimtemonster', key: { g: '#22c55e', d: '#15803d', k: '#111827', w: '#ffffff' }, rows: ['................', '...g........g...', '....g......g....', '...gggggggggg...', '..gggggggggggg..', '.ggg.gggggg.ggg.', '.gggkkgggggkkgg.', 'gggggkwggggkwggg', 'gggggggggggggggg', 'g.gggggggggggg.g', 'g.g.gggggggg.g.g', 'g.g.g......g.g.g', '...ggg....ggg...', '................', '................', '................'] },
  { name: 'Boom', key: { g: '#16a34a', l: '#4ade80', d: '#14532d', b: '#92400e', c: '#78350f' }, rows: ['................', '.......gg.......', '.....gglggg.....', '....gllgggdg....', '...gggglgggdg...', '..glggggggggdg..', '...gggglggdgg...', '..ggllggggggdg..', '.gggggggdggggdg.', '..gggldgggggdg..', '...dggggggdd....', '......bbb.......', '......bcb.......', '......bcb.......', '.....bbcbb......', '................'] },
  { name: 'Zwaard', key: { s: '#e5e7eb', d: '#9ca3af', g: '#facc15', b: '#92400e', r: '#ef4444' }, rows: ['..............sd', '.............ssd', '............ssd.', '...........ssd..', '..........ssd...', '.........ssd....', '..g.....ssd.....', '..gg...ssd......', '...gg.ssd.......', '....ggsd........', '....bggg........', '...bb.gg........', '..bb..r.g.......', '.bb.............', 'bb..............', '................'] },
  { name: 'Kat', key: { o: '#f97316', d: '#c2410c', w: '#ffffff', k: '#1f2937', p: '#f9a8d4' }, rows: ['................', '..o..........o..', '..oo........oo..', '..opo......opo..', '..ooooooooooo...', '.ooooooooooooo..', '.ooookooookooo..', '.oooookoookooo..', '.oowwoopoowwoo..', '.ooowwwwwwwooo..', '..ooooookooooo..', '..dooooooooood..', '...dooooooood...', '....dddddddd....', '................', '................'] },
  { name: 'Raket', key: { w: '#f1f5f9', r: '#ef4444', b: '#3b82f6', g: '#94a3b8', y: '#facc15', o: '#f97316' }, rows: ['.......ww.......', '......wwww......', '.....wwwwww.....', '.....wwbbww.....', '.....wbbbbw.....', '.....wwbbww.....', '.....wwwwww.....', '....rwwwwwwr....', '...rrwwwwwwrr...', '..rrrwwwwwwrrr..', '..rr.gggggg.rr..', '.....gggggg.....', '......yyyy......', '......oyyo......', '.......oo.......', '................'] },
  { name: 'Ijsje', key: { p: '#f9a8d4', c: '#fcd9b6', b: '#b45309', w: '#ffffff', r: '#ef4444' }, rows: ['................', '.......r........', '......rr........', '.....pppp.......', '...pppppppp.....', '..ppwppppppp....', '..pppppppppp....', '..ppppppppppp...', '...cccccccccc...', '....cbcbcbcb....', '....bcbcbcbc....', '.....cbcbcb.....', '.....bcbcbc.....', '......cbcb......', '.......bc.......', '........b.......'] },
  { name: 'Spookje', key: { w: '#f8fafc', g: '#cbd5e1', k: '#111827', p: '#fda4af' }, rows: ['................', '......wwww......', '....wwwwwwww....', '...wwwwwwwwww...', '..wwwwwwwwwwww..', '..wwkkwwwwkkww..', '..wwkkwwwwkkww..', '..wwwwwwwwwwww..', '..wwppwwwwppww..', '..wwwwkkkkwwww..', '..wwwwwwwwwwww..', '..wwwwwwwwwwww..', '..wwwwwwwwwwww..', '..ww.www.www.w..', '..w...w...w.....', '................'] },
  ...R4_TEMPLATES,
];
export function templateDoc(t) {
  const n = 16, paint = (rows) => { const c = blank(n); rows.forEach((row, y) => { for (let x = 0; x < n; x++) { const ch = row[x]; if (ch && ch !== '.' && t.key[ch]) c[y * n + x] = t.key[ch]; } }); return c; };
  const d = newDoc(n);
  if (t.frames) { d.frames = t.frames.slice(0, MAX_FRAMES).map((rows) => [paint(rows)]); d.fps = t.fps || 6; } else d.frames[0][0] = paint(t.rows);
  return d;
}

// ---------- opslag ----------
// Galerij-item (oud: {size,cells(index of hex),at}). Nieuw: {v:2,size,name,fps,layers:[names+vis],frames:[[laag-RLE...]],pal:[kleuren],cells:(frame0 samengevoegd, voor oude lezers),at}
export function rleEncode(cells, pal) {
  const out = []; let prev = -2, run = 0;
  for (const v of cells) { const k = v ? pal.indexOf(v) : -1; if (k === prev) run++; else { if (run) out.push(prev, run); prev = k; run = 1; } }
  if (run) out.push(prev, run); return out.join(',');
}
export function rleDecode(str, pal, len) {
  const out = []; const a = String(str).split(',').map(Number);
  for (let i = 0; i + 1 < a.length; i += 2) for (let j = 0; j < a[i + 1] && out.length < len; j++) out.push(a[i] >= 0 ? pal[a[i]] || null : null);
  while (out.length < len) out.push(null); return out;
}
export function encodeDoc(d, name) {
  const pal = []; d.frames.forEach((f) => f.forEach((c) => c.forEach((v) => { if (v && !pal.includes(v)) pal.push(v); })));
  return {
    v: 2, size: d.n, name: name || '', fps: d.fps, pal, at: Date.now(),
    layers: d.layers.map((l) => ({ name: l.name, vis: l.vis })),
    frames: d.frames.map((f) => f.map((c) => rleEncode(c, pal))),
    cells: composite(d, 0).map((v) => (v ? (PALETTE.indexOf(v) >= 0 ? PALETTE.indexOf(v) : v) : null)),   // oude lezers
  };
}
export function decodeDoc(item) {
  const n = item.size;
  if (item.v === 2 && Array.isArray(item.frames)) {
    const d = { n, fps: item.fps || 6, layers: item.layers.map((l) => ({ name: l.name, vis: l.vis !== false })), frames: item.frames.map((f) => f.map((s) => rleDecode(s, item.pal, n * n))) };
    return d;
  }
  const d = newDoc(n); d.frames[0][0] = item.cells.map((v) => (typeof v === 'number' ? PALETTE[v] || null : v)); return d;
}
// Alleen veilige, kleine items bewaren: aantal en grootte beperken.
export function fitGallery(items, maxBytes = 3_000_000, maxN = 40) {
  let g = items.slice(0, maxN);
  while (g.length > 1 && JSON.stringify(g).length > maxBytes) g.pop(); return g;
}

// ---------- spritesheet ----------
export function sheetLayout(frames, cols) {
  const c = Math.max(1, Math.min(cols || frames, frames)); return { cols: c, rows: Math.ceil(frames / c) };
}
// Eén groot vlak van alle frames naast elkaar: { w, h, cells }.
export function spritesheet(d, cols) {
  const { cols: c, rows } = sheetLayout(d.frames.length, cols); const n = d.n, w = c * n, h = rows * n, cells = Array(w * h).fill(null);
  d.frames.forEach((_, fi) => { const img = composite(d, fi), ox = (fi % c) * n, oy = ((fi / c) | 0) * n; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) cells[(oy + y) * w + ox + x] = img[y * n + x]; });
  return { w, h, cols: c, rows, cells };
}

// ---------- GIF-encoder (GIF89a, LZW, doorzichtig = index 0) ----------
export function buildPalette(imgs) { // imgs: arrays van hex|null -> { colors:[rgb], map(hex)->index (0 = transparant) }
  const uniq = new Set(); imgs.forEach((im) => im.forEach((v) => { if (v) uniq.add(v); }));
  const colors = [[0, 0, 0]]; const idx = new Map();
  if (uniq.size <= 255) { for (const h of uniq) { idx.set(h, colors.length); colors.push(hexRgb(h)); } return { colors, map: (h) => (h ? idx.get(h) : 0) }; }
  // te veel kleuren: 6x6x6-kubus
  for (let r = 0; r < 6; r++) for (let g = 0; g < 6; g++) for (let b = 0; b < 6; b++) colors.push([r * 51, g * 51, b * 51]);
  return { colors, map: (h) => { if (!h) return 0; const [r, g, b] = hexRgb(h); return 1 + Math.round(r / 51) * 36 + Math.round(g / 51) * 6 + Math.round(b / 51); } };
}
function lzw(indices, minCode) {
  const clear = 1 << minCode, eoi = clear + 1; const out = []; let cur = 0, curBits = 0;
  let codeSize = minCode + 1, next = eoi + 1; let dict = new Map();
  const emit = (code) => { cur |= code << curBits; curBits += codeSize; while (curBits >= 8) { out.push(cur & 255); cur >>>= 8; curBits -= 8; } };
  emit(clear);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i], key = prefix * 4096 + k; const found = dict.get(key);
    if (found !== undefined) { prefix = found; continue; }
    emit(prefix);
    if (next < 4096) { dict.set(key, next++); if (next - 1 === (1 << codeSize) && codeSize < 12) codeSize++; }
    else { emit(clear); dict = new Map(); codeSize = minCode + 1; next = eoi + 1; }
    prefix = k;
  }
  emit(prefix); emit(eoi); if (curBits > 0) out.push(cur & 255);
  return out;
}
// frames: [{ cells: hex|null[] (w*h), delay: centiseconden }]. Geeft Uint8Array.
export function encodeGif(w, h, frames, opts = {}) {
  const scale = Math.max(1, opts.scale | 0 || 1); const W = w * scale, H = h * scale;
  const pal = buildPalette(frames.map((f) => f.cells));
  let bits = 1; while ((1 << bits) < pal.colors.length) bits++;
  bits = Math.max(2, Math.min(8, bits)); const tableSize = 1 << bits;
  const out = []; const w16 = (v) => out.push(v & 255, (v >> 8) & 255);
  const str = (s) => { for (const ch of s) out.push(ch.charCodeAt(0)); };
  str('GIF89a'); w16(W); w16(H); out.push(0x80 | 0x70 | (bits - 1), 0, 0);
  for (let i = 0; i < tableSize; i++) { const c = pal.colors[i] || [0, 0, 0]; out.push(c[0], c[1], c[2]); }
  out.push(0x21, 0xff, 11); str('NETSCAPE2.0'); out.push(3, 1); w16(opts.loop === undefined ? 0 : opts.loop); out.push(0);
  for (const f of frames) {
    out.push(0x21, 0xf9, 4, (2 << 2) | 1); w16(Math.max(2, Math.round(f.delay || 10))); out.push(0, 0);
    out.push(0x2c); w16(0); w16(0); w16(W); w16(H); out.push(0);
    const idx = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) idx[y * W + x] = pal.map(f.cells[((y / scale) | 0) * w + ((x / scale) | 0)]);
    const minCode = Math.max(2, bits); out.push(minCode);
    const data = lzw(idx, minCode);
    for (let p = 0; p < data.length; p += 255) { const chunk = data.slice(p, p + 255); out.push(chunk.length, ...chunk); }
    out.push(0);
  }
  out.push(0x3b); return Uint8Array.from(out);
}
export function gifFromDoc(d, scale = 8) {
  const frames = d.frames.map((_, fi) => ({ cells: composite(d, fi), delay: 100 / Math.max(1, d.fps) }));
  return encodeGif(d.n, d.n, frames, { scale });
}
