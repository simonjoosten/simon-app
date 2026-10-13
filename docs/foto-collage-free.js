// Fotocollage "Zelf maken": een vrije plakboek-collage met lagen (foto's, vormen, tekst, stickers, lijnen, tekeningen).
// Alles gebeurt op je eigen toestel: foto's worden nergens geüpload. Concepten staan in IndexedDB op dit toestel.
// Puur ES-module, geen build, geen externe libs.

/* ================= pure hulpfuncties (ook getest in node) ================= */
export const CW = 1000; // vaste collagebreedte in "eenheden"; hoogte volgt uit het formaat
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const FORMATS = [['1:1', 1, 1], ['4:5', 4, 5], ['9:16', 9, 16], ['3:2', 3, 2], ['16:9', 16, 9]];
export const MASKS = [['rect', 'Rechthoek'], ['round', 'Afgerond'], ['circle', 'Cirkel'], ['heart', 'Hart'], ['star', 'Ster'], ['hex', 'Zeshoek'], ['diamond', 'Ruit'], ['triangle', 'Driehoek'], ['drop', 'Druppel'], ['cloud', 'Wolk'], ['flower', 'Bloem'], ['moon', 'Maan'], ['blob', 'Blob']];
export const FILTERS = [['none', 'Normaal'], ['bw', 'Zwart-wit'], ['sepia', 'Sepia'], ['warm', 'Warm'], ['cool', 'Koel'], ['vivid', 'Levendig'], ['soft', 'Zacht'], ['pastel', 'Pastel'], ['neon', 'Neon'], ['vintage', 'Vintage'], ['duo', 'Duotone']];
export const FONTS = [
  ['sans', 'Standaard', 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'],
  ['round', 'Rond', '"Arial Rounded MT Bold", "Nunito", "Trebuchet MS", sans-serif'],
  ['impact', 'Dik', 'Impact, "Arial Black", "Haettenschweiler", sans-serif'],
  ['serif', 'Serif', 'Georgia, "Times New Roman", serif'],
  ['hand', 'Handschrift', '"Bradley Hand", "Segoe Print", "Comic Sans MS", cursive'],
  ['marker', 'Stift', '"Marker Felt", "Chalkboard SE", "Comic Sans MS", cursive'],
  ['mono', 'Typemachine', '"Courier New", Courier, monospace'],
  ['script', 'Sierlijk', '"Snell Roundhand", "Brush Script MT", "Apple Chancery", cursive'],
  ['helv', 'Strak', '"Helvetica Neue", Helvetica, Arial, sans-serif'],
  ['palat', 'Klassiek', 'Palatino, "Palatino Linotype", "Book Antiqua", serif'],
  ['narrow', 'Smal', '"Avenir Next Condensed", "Arial Narrow", "Helvetica Neue", sans-serif'],
  ['chalk', 'Krijt', 'Chalkduster, "Comic Sans MS", fantasy'],
  ['retro', 'Retro', 'Copperplate, Optima, "Gill Sans", serif'],
  ['futura', 'Futura', 'Futura, "Century Gothic", "Trebuchet MS", sans-serif'],
  ['didot', 'Mode', 'Didot, "Bodoni 72", "Playfair Display", serif'],
];
export const fontStack = (id) => { for (const f of FONTS) if (f[0] === id) return f[2]; return FONTS[0][2]; };
export const PATTERNS = [['dots', 'Stippen'], ['stripes', 'Strepen'], ['diamonds', 'Ruiten'], ['hearts', 'Hartjes'], ['stars', 'Sterren'], ['paper', 'Papier'], ['wood', 'Hout'], ['linen', 'Canvas'], ['gingham', 'Gingham'], ['waves', 'Golven'], ['confetti', 'Confetti'], ['checker', 'Dambord'], ['zigzag', 'Zigzag'], ['plus', 'Kruisjes'], ['scales', 'Schubben'], ['triangles', 'Driehoekjes'], ['grid', 'Ruitjes']];
export const COLORS = ['#ffffff', '#111827', '#ef4444', '#f97316', '#f59e0b', '#facc15', '#22c55e', '#14b8a6', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#fda4af', '#bae6fd', '#fde68a', '#d9f99d'];
export const EMOJI = ['❤️', '💖', '💕', '⭐', '🌟', '✨', '💫', '🎉', '🎊', '🎈', '🎁', '🎂', '🍰', '🍭', '🍦', '🍕', '🍓', '🍒', '🍉', '🍌', '🌈', '☀️', '🌙', '⛅', '☁️', '❄️', '🔥', '💧', '🌸', '🌼', '🌻', '🌹', '🌴', '🍀', '🍁', '🐶', '🐱', '🐻', '🐼', '🦊', '🐰', '🦄', '🐥', '🦋', '🐝', '🐢', '🐠', '🐬', '🚗', '✈️', '🚀', '⚽', '🏀', '🎮', '🎵', '🎶', '🎸', '📷', '📍', '📌', '💌', '👑', '💎', '😀', '😍', '😎', '🥳', '😂', '😴', '🤩', '👍', '👏', '🙌', '💪', '👣', '✌️'];
// [sleutel, naam, standaardkleur, breedte/hoogte]
export const ARTS = [['heart', 'Hart', '#ef4444', 1], ['star', 'Ster', '#fbbf24', 1], ['bolt', 'Bliksem', '#facc15', 1], ['cloud', 'Wolk', '#e0f2fe', 1.3], ['crown', 'Kroon', '#fbbf24', 1.1], ['tape', 'Tape', '#f9a8d4', 3.2], ['pin', 'Punaise', '#ef4444', 1], ['arrow', 'Pijl', '#3b82f6', 1.6], ['speech', 'Tekstballon', '#ffffff', 1.3], ['confetti', 'Confetti', '#ec4899', 1], ['snow', 'Sneeuwvlok', '#60a5fa', 1], ['sun', 'Zon', '#facc15', 1], ['flowerd', 'Bloem', '#f472b6', 1], ['rainbow', 'Regenboog', '#ef4444', 1.6], ['sparkle', 'Fonkel', '#fde047', 1], ['balloon', 'Ballon', '#ef4444', .8], ['bow', 'Strik', '#ec4899', 1.4], ['note', 'Muzieknoot', '#6366f1', .9], ['paw', 'Pootje', '#a16207', 1], ['leaf', 'Blad', '#22c55e', 1], ['polaroid', 'Polaroid', '#ffffff', .85], ['bunting', 'Slinger', '#ef4444', 2.2]];

export function hexToRgb(h) {
  h = String(h || '').replace('#', ''); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16); if (h.length !== 6 || isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex(r, g, b) { const p = (v) => { const s = clamp(Math.round(v), 0, 255).toString(16); return s.length < 2 ? '0' + s : s; }; return '#' + p(r) + p(g) + p(b); }
export function shade(h, amt) { const [r, g, b] = hexToRgb(h); const f = (v) => amt >= 0 ? v + (255 - v) * amt : v * (1 + amt); return rgbToHex(f(r), f(g), f(b)); }
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Pixelfilters op een Uint8ClampedArray (RGBA). o: {filter, amt 0-100, bright/contrast/sat -100..100, duoA, duoB}
export function adjustPixels(d, o) {
  const f = o.filter || 'none', amt = (o.amt == null ? 100 : o.amt) / 100;
  const br = (o.bright || 0) * 1.6, ct = 1 + (o.contrast || 0) / 100, sa = 1 + (o.sat || 0) / 100;
  if (f === 'none' && !br && ct === 1 && sa === 1) return d;
  const A = hexToRgb(o.duoA || '#1e1b4b'), B = hexToRgb(o.duoB || '#fbbf24');
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    let r = d[i], g = d[i + 1], b = d[i + 2], y;
    if (br) { r += br; g += br; b += br; }
    if (ct !== 1) { r = (r - 128) * ct + 128; g = (g - 128) * ct + 128; b = (b - 128) * ct + 128; }
    if (sa !== 1) { y = .299 * r + .587 * g + .114 * b; r = y + (r - y) * sa; g = y + (g - y) * sa; b = y + (b - y) * sa; }
    if (f !== 'none') {
      const r0 = r, g0 = g, b0 = b;
      y = .299 * r + .587 * g + .114 * b;
      if (f === 'bw') { r = g = b = y; }
      else if (f === 'sepia') { r = .393 * r0 + .769 * g0 + .189 * b0; g = .349 * r0 + .686 * g0 + .168 * b0; b = .272 * r0 + .534 * g0 + .131 * b0; }
      else if (f === 'warm') { r = r0 * 1.1 + 10; g = g0 * 1.02 + 3; b = b0 * .86; }
      else if (f === 'cool') { r = r0 * .88; g = g0 * 1.01 + 2; b = b0 * 1.1 + 12; }
      else if (f === 'vivid') { r = y + (r0 - y) * 1.5; g = y + (g0 - y) * 1.5; b = y + (b0 - y) * 1.5; r = (r - 128) * 1.1 + 128; g = (g - 128) * 1.1 + 128; b = (b - 128) * 1.1 + 128; }
      else if (f === 'soft') { r = r0 * .8 + 46; g = g0 * .8 + 44; b = b0 * .8 + 50; }
      else if (f === 'pastel') { r = y + (r0 - y) * .75; g = y + (g0 - y) * .75; b = y + (b0 - y) * .75; r = r * .62 + 97; g = g * .62 + 97; b = b * .62 + 97; }
      else if (f === 'neon') { r = y + (r0 - y) * 2; g = y + (g0 - y) * 2; b = y + (b0 - y) * 2; r = (r - 128) * 1.3 + 128 + 8; g = (g - 128) * 1.3 + 128; b = (b - 128) * 1.3 + 128 + 14; }
      else if (f === 'vintage') { const sr = .393 * r0 + .769 * g0 + .189 * b0, sg = .349 * r0 + .686 * g0 + .168 * b0, sb = .272 * r0 + .534 * g0 + .131 * b0; r = (r0 + sr) / 2; g = (g0 + sg) / 2; b = (b0 + sb) / 2; r = r * .88 + 26; g = g * .88 + 22; b = b * .84 + 20; if (y < 110) { b += 10; g += 4; } }
      else if (f === 'duo') { const t = clamp(y / 255, 0, 1); r = A[0] + (B[0] - A[0]) * t; g = A[1] + (B[1] - A[1]) * t; b = A[2] + (B[2] - A[2]) * t; }
      if (amt < 1) { r = r0 + (r - r0) * amt; g = g0 + (g - g0) * amt; b = b0 + (b - b0) * amt; }
    }
    d[i] = r < 0 ? 0 : r > 255 ? 255 : r; d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g; d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
  return d;
}

export const limitSide = (n) => (n < 6 ? 2000 : n < 12 ? 1600 : 1200);
export function fitExport(w, h, maxArea) {
  maxArea = maxArea || 16000000; w = Math.round(w); h = Math.round(h);
  if (w * h <= maxArea) return { w, h, scaled: false };
  const s = Math.sqrt(maxArea / (w * h)); return { w: Math.floor(w * s), h: Math.floor(h * s), scaled: true };
}

export function makeHistory(max) {
  const H = { stack: [], idx: -1 };
  H.push = (s) => { if (H.idx >= 0 && H.stack[H.idx] === s) return false; H.stack.length = H.idx + 1; H.stack.push(s); while (H.stack.length > max + 1) H.stack.shift(); H.idx = H.stack.length - 1; return true; };
  H.undo = () => { if (H.idx > 0) { H.idx--; return H.stack[H.idx]; } return null; };
  H.redo = () => { if (H.idx < H.stack.length - 1) { H.idx++; return H.stack[H.idx]; } return null; };
  H.canUndo = () => H.idx > 0; H.canRedo = () => H.idx < H.stack.length - 1;
  return H;
}

export function toLocal(o, x, y) {
  const dx = x - o.x, dy = y - o.y, c = Math.cos(o.rot || 0), s = Math.sin(o.rot || 0);
  const lx = dx * c + dy * s, ly = -dx * s + dy * c; return [o.flip ? -lx : lx, ly];
}
export function toWorld(o, lx, ly) {
  if (o.flip) lx = -lx; const c = Math.cos(o.rot || 0), s = Math.sin(o.rot || 0);
  return [o.x + lx * c - ly * s, o.y + lx * s + ly * c];
}
export function pointInObj(o, x, y, pad) { const [lx, ly] = toLocal(o, x, y); pad = pad || 0; return Math.abs(lx) <= o.w / 2 + pad && Math.abs(ly) <= o.h / 2 + pad; }
export function bboxOf(o) {
  const c = Math.abs(Math.cos(o.rot || 0)), s = Math.abs(Math.sin(o.rot || 0)), ex = c * o.w / 2 + s * o.h / 2, ey = s * o.w / 2 + c * o.h / 2;
  return { l: o.x - ex, r: o.x + ex, t: o.y - ey, b: o.y + ey };
}
export function unionBox(boxes) {
  const u = { l: Infinity, r: -Infinity, t: Infinity, b: -Infinity };
  for (const b of boxes) { if (b.l < u.l) u.l = b.l; if (b.r > u.r) u.r = b.r; if (b.t < u.t) u.t = b.t; if (b.b > u.b) u.b = b.b; }
  return u;
}
// Snap: r = bewegende box, lines = {xs:[], ys:[]} doellijnen. Geeft verschuiving en welke hulplijnen getekend moeten worden.
export function computeSnap(r, lines, thr) {
  const mx = [r.l, (r.l + r.r) / 2, r.r], my = [r.t, (r.t + r.b) / 2, r.b];
  let bx = null, by = null;
  for (const m of mx) for (const x of lines.xs) { const d = x - m; if (Math.abs(d) <= thr && (bx === null || Math.abs(d) < Math.abs(bx))) bx = d; }
  for (const m of my) for (const y of lines.ys) { const d = y - m; if (Math.abs(d) <= thr && (by === null || Math.abs(d) < Math.abs(by))) by = d; }
  const gx = [], gy = [];
  if (bx !== null) for (const m of mx) for (const x of lines.xs) if (Math.abs(x - m - bx) < .5 && gx.indexOf(x) < 0) gx.push(x);
  if (by !== null) for (const m of my) for (const y of lines.ys) if (Math.abs(y - m - by) < .5 && gy.indexOf(y) < 0) gy.push(y);
  return { dx: bx || 0, dy: by || 0, gx, gy };
}
// Uitlijnen: boxes [{l,r,t,b}], mode left|center|right|top|middle|bottom, bounds {l,r,t,b} -> [{dx,dy}]
export function alignBoxes(boxes, mode, bounds) {
  return boxes.map((b) => {
    let dx = 0, dy = 0;
    if (mode === 'left') dx = bounds.l - b.l; else if (mode === 'right') dx = bounds.r - b.r; else if (mode === 'center') dx = (bounds.l + bounds.r) / 2 - (b.l + b.r) / 2;
    else if (mode === 'top') dy = bounds.t - b.t; else if (mode === 'bottom') dy = bounds.b - b.b; else if (mode === 'middle') dy = (bounds.t + bounds.b) / 2 - (b.t + b.b) / 2;
    return { dx, dy };
  });
}
// Gelijkmatig verdelen over as 'x' of 'y' (de buitenste twee blijven staan).
export function distributeBoxes(boxes, axis) {
  const res = boxes.map(() => ({ dx: 0, dy: 0 })); if (boxes.length < 3) return res;
  const lo = axis === 'x' ? 'l' : 't', hi = axis === 'x' ? 'r' : 'b';
  const order = boxes.map((b, i) => i).sort((a, b) => (boxes[a][lo] + boxes[a][hi]) - (boxes[b][lo] + boxes[b][hi]));
  const first = boxes[order[0]], last = boxes[order[order.length - 1]];
  let total = 0; for (const i of order) total += boxes[i][hi] - boxes[i][lo];
  const gap = (last[hi] - first[lo] - total) / (order.length - 1);
  let pos = first[hi] + gap;
  for (let k = 1; k < order.length - 1; k++) {
    const b = boxes[order[k]], d = pos - b[lo]; if (axis === 'x') res[order[k]].dx = d; else res[order[k]].dy = d; pos += (b[hi] - b[lo]) + gap;
  }
  return res;
}
// Nette indeling voor n foto's op een W x H pagina; geeft middelpunt + afmeting per cel.
export function autoLayout(n, W, H, gap, margin, ar) {
  if (n <= 0) return []; ar = ar > 0 ? ar : 1;
  const iw = W - 2 * margin, ih = H - 2 * margin; let best = null;
  for (let rows = 1; rows <= n; rows++) {
    const base = Math.floor(n / rows), extra = n % rows; if (base < 1) continue;
    const counts = []; for (let r = 0; r < rows; r++) counts.push(base + (r >= rows - extra ? 1 : 0));
    const ch = (ih - gap * (rows - 1)) / rows; if (ch <= 4) continue;
    let score = 0; for (const c of counts) { const cw = (iw - gap * (c - 1)) / c; if (cw <= 4) { score = 1e9; break; } score += Math.abs(Math.log(cw / ch / ar)); }
    score /= rows; if (!best || score < best.score) best = { score, counts, ch };
  }
  if (!best) return [];
  const out = []; let y = margin;
  best.counts.forEach((c) => {
    const cw = (iw - gap * (c - 1)) / c;
    for (let i = 0; i < c; i++) out.push({ x: margin + i * (cw + gap) + cw / 2, y: y + best.ch / 2, w: cw, h: best.ch });
    y += best.ch + gap;
  });
  return out;
}

/* ---------- vormen (eenheidsvierkant -.5..+.5) ---------- */
function rr(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  if (r < .01) { c.rect(x, y, w, h); return; }
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function poly(c, pts) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
const circ = (c, x, y, r) => { c.moveTo(x + r, y); c.arc(x, y, r, 0, Math.PI * 2); };
// bouwt subpaden in eenheidsruimte (zonder beginPath)
export function unitPath(c, key) {
  const PI = Math.PI;
  switch (key) {
    case 'circle': circ(c, 0, 0, .5); break;
    case 'heart':
      c.moveTo(0, .46); c.bezierCurveTo(-.58, .08, -.5, -.5, -.25, -.46); c.bezierCurveTo(-.1, -.44, 0, -.36, 0, -.24);
      c.bezierCurveTo(0, -.36, .1, -.44, .25, -.46); c.bezierCurveTo(.5, -.5, .58, .08, 0, .46); c.closePath(); break;
    case 'star': { const p = []; for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? .21 : .5; p.push([Math.cos(a) * r, Math.sin(a) * r + .03]); } poly(c, p); break; }
    case 'hex': { const p = []; for (let i = 0; i < 6; i++) p.push([Math.cos(i * PI / 3) * .5, Math.sin(i * PI / 3) * .5]); poly(c, p); break; }
    case 'diamond': poly(c, [[0, -.5], [.5, 0], [0, .5], [-.5, 0]]); break;
    case 'triangle': poly(c, [[0, -.5], [.5, .5], [-.5, .5]]); break;
    case 'drop':
      c.moveTo(0, -.5); c.bezierCurveTo(.08, -.28, .4, -.05, .4, .18); c.bezierCurveTo(.4, .38, .22, .5, 0, .5); c.bezierCurveTo(-.22, .5, -.4, .38, -.4, .18); c.bezierCurveTo(-.4, -.05, -.08, -.28, 0, -.5); c.closePath(); break;
    case 'cloud': circ(c, -.26, .1, .22); circ(c, -.04, -.1, .28); circ(c, .22, -.02, .24); circ(c, .27, .16, .2); circ(c, -.1, .17, .22); c.moveTo(-.26, .1); c.rect(-.26, .1, .53, .28); break;
    case 'flower': for (let i = 0; i < 6; i++) { const a = i * PI / 3; circ(c, Math.cos(a) * .28, Math.sin(a) * .28, .22); } circ(c, 0, 0, .2); break;
    case 'moon': { const a = Math.atan2(.38, .325), b = Math.atan2(.38, .125); c.moveTo(.325, .38); c.arc(0, 0, .5, a, 2 * PI - a, false); c.arc(.2, 0, .4, -b, b, true); c.closePath(); break; }
    case 'blob': { const N = 44; for (let i = 0; i <= N; i++) { const t = i / N * 2 * PI, r = .4 + .06 * Math.sin(3 * t + .5) + .035 * Math.sin(5 * t + 2) + .03 * Math.sin(2 * t + 1); const x = Math.cos(t) * r * 1.12, y = Math.sin(t) * r * 1.12; if (i) c.lineTo(x, y); else c.moveTo(x, y); } c.closePath(); break; }
    default: c.rect(-.5, -.5, 1, 1);
  }
}
// pad in lokale ruimte, gecentreerd op de oorsprong, w x h groot; r = hoekafronding (alleen rect/round)
export function shapePath(c, key, w, h, r) {
  c.beginPath();
  if (key === 'rect' || key === 'round') { rr(c, -w / 2, -h / 2, w, h, r || 0); return; }
  c.save(); c.scale(w, h); unitPath(c, key); c.restore();
}

function artShape(c, key, col, asp) {
  const PI = Math.PI;
  c.lineJoin = 'round'; c.lineCap = 'round';
  const fs = (fill, stroke, lw) => { c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || .03; c.stroke(); } };
  const dark = shade(col, -.3);
  switch (key) {
    case 'heart': case 'star': case 'cloud': c.beginPath(); unitPath(c, key); fs(col, dark); break;
    case 'bolt': c.beginPath(); poly(c, [[.1, -.5], [-.3, .08], [-.02, .08], [-.12, .5], [.32, -.1], [.04, -.1]]); fs(col, shade(col, -.45), .035); break;
    case 'crown':
      c.beginPath(); poly(c, [[-.42, .3], [-.46, -.25], [-.2, -.02], [0, -.42], [.2, -.02], [.46, -.25], [.42, .3]]); fs(col, dark);
      c.beginPath(); c.rect(-.42, .2, .84, .14); c.fillStyle = shade(col, -.15); c.fill();
      [[-.46, -.25, '#ef4444'], [0, -.42, '#3b82f6'], [.46, -.25, '#22c55e']].forEach((p) => { c.beginPath(); circ(c, p[0], p[1], .06); c.fillStyle = p[2]; c.fill(); }); break;
    case 'tape': {
      const a = .09 / Math.max(1, asp / 3); c.beginPath(); c.moveTo(-.5, -.5); c.lineTo(.5, -.5);
      for (let j = 1; j <= 6; j++) c.lineTo(.5 - (j % 2 ? a : 0), -.5 + j / 6); c.lineTo(-.5, .5);
      for (let j = 5; j >= 1; j--) c.lineTo(-.5 + (j % 2 ? a : 0), -.5 + j / 6); c.closePath();
      c.globalAlpha *= .82; c.fillStyle = col; c.fill(); c.globalAlpha *= .5; c.fillStyle = '#ffffff';
      for (let k = -4; k < 6; k++) { c.beginPath(); poly(c, [[-.5 + k * .12, -.5], [-.5 + k * .12 + .045, -.5], [-.5 + k * .12 + .045 - .1 / asp * 4, .5], [-.5 + k * .12 - .1 / asp * 4, .5]]); c.fill(); } break; }
    case 'pin':
      c.beginPath(); poly(c, [[-.045, .05], [.045, .05], [0, .5]]); c.fillStyle = '#9ca3af'; c.fill();
      c.beginPath(); circ(c, 0, -.18, .3); fs(col, dark);
      c.beginPath(); circ(c, -.09, -.28, .08); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill(); break;
    case 'arrow': c.beginPath(); poly(c, [[-.5, -.16], [.08, -.16], [.08, -.42], [.5, 0], [.08, .42], [.08, .16], [-.5, .16]]); fs(col, dark); break;
    case 'speech': {
      c.beginPath(); rr(c, -.5, -.45, 1, .72, .22); c.moveTo(-.2, .26); c.lineTo(-.32, .5); c.lineTo(.02, .26); c.closePath(); fs(col, '#334155', .035);
      c.fillStyle = '#94a3b8'; [-.2, 0, .2].forEach((x) => { c.beginPath(); circ(c, x, -.09, .045); c.fill(); }); break; }
    case 'confetti': { const rnd = rng(11), pal = ['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#a855f7', col];
      for (let i = 0; i < 22; i++) { c.save(); c.translate((rnd() - .5) * .9, (rnd() - .5) * .9); c.rotate(rnd() * PI); c.fillStyle = pal[i % pal.length]; if (i % 3 === 0) { c.beginPath(); circ(c, 0, 0, .035); c.fill(); } else c.fillRect(-.04, -.015, .08, .03); c.restore(); } break; }
    case 'snow': c.strokeStyle = col; c.lineWidth = .05;
      for (let i = 0; i < 6; i++) { c.save(); c.rotate(i * PI / 3); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -.46); c.moveTo(0, -.28); c.lineTo(-.1, -.38); c.moveTo(0, -.28); c.lineTo(.1, -.38); c.moveTo(0, -.15); c.lineTo(-.07, -.22); c.moveTo(0, -.15); c.lineTo(.07, -.22); c.stroke(); c.restore(); } break;
    case 'sun': c.strokeStyle = col; c.lineWidth = .06;
      for (let i = 0; i < 12; i++) { c.save(); c.rotate(i * PI / 6); c.beginPath(); c.moveTo(0, -.33); c.lineTo(0, -.47); c.stroke(); c.restore(); }
      c.beginPath(); circ(c, 0, 0, .24); fs(col, shade(col, -.25)); break;
    case 'flowerd':
      for (let i = 0; i < 6; i++) { c.save(); c.rotate(i * PI / 3); c.beginPath(); c.ellipse(0, -.27, .13, .2, 0, 0, 2 * PI); fs(col, dark, .02); c.restore(); }
      c.beginPath(); circ(c, 0, 0, .13); fs('#fbbf24', '#b45309', .02); break;
    case 'rainbow': { const cols = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7']; c.lineCap = 'butt';
      cols.forEach((cc, i) => { c.beginPath(); c.arc(0, .3, .44 - i * .055, PI, 2 * PI); c.strokeStyle = cc; c.lineWidth = .06; c.stroke(); }); break; }
    case 'sparkle': c.beginPath(); c.moveTo(0, -.5); c.quadraticCurveTo(0, 0, .5, 0); c.quadraticCurveTo(0, 0, 0, .5); c.quadraticCurveTo(0, 0, -.5, 0); c.quadraticCurveTo(0, 0, 0, -.5); c.closePath(); fs(col, shade(col, -.25), .02); break;
    case 'balloon':
      c.beginPath(); c.moveTo(0, .3); c.bezierCurveTo(-.08, .38, .08, .4, .02, .5); c.strokeStyle = '#64748b'; c.lineWidth = .015; c.stroke();
      c.beginPath(); c.moveTo(0, .24); c.bezierCurveTo(-.65, -.1, -.25, -.55, 0, -.5); c.bezierCurveTo(.25, -.55, .65, -.1, 0, .24); c.closePath(); fs(col, dark, .02);
      c.beginPath(); poly(c, [[0, .22], [-.04, .3], [.04, .3]]); c.fillStyle = dark; c.fill();
      c.beginPath(); c.ellipse(-.14, -.2, .05, .1, .5, 0, 2 * PI); c.fillStyle = 'rgba(255,255,255,.45)'; c.fill(); break;
    case 'bow':
      c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-.2, -.45, -.55, -.4, -.5, 0); c.bezierCurveTo(-.55, .4, -.2, .45, 0, 0); c.closePath(); fs(col, dark, .025);
      c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(.2, -.45, .55, -.4, .5, 0); c.bezierCurveTo(.55, .4, .2, .45, 0, 0); c.closePath(); fs(col, dark, .025);
      c.beginPath(); rr(c, -.09, -.13, .18, .26, .06); fs(shade(col, -.15), dark, .02); break;
    case 'note':
      c.beginPath(); c.ellipse(-.15, .32, .22, .15, -.4, 0, 2 * PI); c.fillStyle = col; c.fill();
      c.beginPath(); c.rect(.03, -.45, .06, .8); c.fill();
      c.beginPath(); c.moveTo(.06, -.45); c.bezierCurveTo(.3, -.35, .4, -.15, .3, .05); c.bezierCurveTo(.3, -.15, .2, -.25, .06, -.25); c.closePath(); c.fill(); break;
    case 'paw':
      c.fillStyle = col; c.beginPath(); c.ellipse(0, .2, .26, .22, 0, 0, 2 * PI); c.fill();
      [[-.3, -.08, .11, .14], [-.1, -.28, .11, .14], [.1, -.28, .11, .14], [.3, -.08, .11, .14]].forEach((p) => { c.beginPath(); c.ellipse(p[0], p[1], p[2], p[3], 0, 0, 2 * PI); c.fill(); }); break;
    case 'leaf':
      c.beginPath(); c.moveTo(-.4, .4); c.bezierCurveTo(-.5, -.2, -.1, -.5, .45, -.45); c.bezierCurveTo(.5, .1, .1, .5, -.4, .4); c.closePath(); fs(col, dark, .025);
      c.beginPath(); c.moveTo(-.4, .4); c.quadraticCurveTo(0, .05, .38, -.38); c.strokeStyle = dark; c.lineWidth = .025; c.stroke(); break;
    case 'polaroid':
      c.beginPath(); c.rect(-.5, -.5, 1, 1); fs(col, '#cbd5e1', .02);
      c.beginPath(); c.rect(-.42, -.42, .84, .68); c.fillStyle = '#cbd5e1'; c.fill(); c.beginPath(); circ(c, -.18, -.2, .08); c.fillStyle = '#f8fafc'; c.fill();
      c.beginPath(); poly(c, [[-.42, .26], [-.1, -.02], [.1, .16], [.25, .02], [.42, .2], [.42, .26]]); c.fillStyle = '#94a3b8'; c.fill(); break;
    case 'bunting': {
      c.beginPath(); c.moveTo(-.5, -.35); c.quadraticCurveTo(0, -.1, .5, -.35); c.strokeStyle = '#64748b'; c.lineWidth = .02; c.stroke();
      const pal = [col, '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#f97316']; const n = 6;
      for (let i = 0; i < n; i++) { const t = (i + .5) / n, x = -.5 + t, y = -.35 + 2 * t * (1 - t) * .25 + (t * t - t * t) * 0; const yy = -.35 + (2 * (1 - t) * t) * .25 * 1; c.beginPath(); poly(c, [[x - .07, yy], [x + .07, yy], [x, yy + .4]]); c.fillStyle = pal[i % pal.length]; c.fill(); }
      break; }
    default: c.beginPath(); c.rect(-.4, -.4, .8, .8); fs(col, dark);
  }
}
export function drawArt(c, key, col, w, h) { c.save(); c.scale(w, h); artShape(c, key, col, w / Math.max(1, h)); c.restore(); }

/* ---------- patronen ---------- */
export function drawTile(cv, key, c1, c2) {
  const T = cv.width, c = cv.getContext('2d'), PI = Math.PI; c.fillStyle = c1; c.fillRect(0, 0, T, T);
  c.save(); c.scale(T, T); c.fillStyle = c2; c.strokeStyle = c2; c.lineJoin = 'round'; c.lineCap = 'round'; const rnd = rng(7);
  switch (key) {
    case 'dots': [[0, 0], [1, 0], [0, 1], [1, 1]].forEach((p) => { c.beginPath(); circ(c, p[0], p[1], .13); c.fill(); }); c.beginPath(); circ(c, .5, .5, .17); c.fill(); break;
    case 'stripes': c.fillRect(0, 0, .5, 1); break;
    case 'diamonds': c.beginPath(); poly(c, [[.5, .06], [.94, .5], [.5, .94], [.06, .5]]); c.fill(); break;
    case 'hearts': c.save(); c.translate(.5, .5); c.scale(.6, .6); c.beginPath(); unitPath(c, 'heart'); c.fill(); c.restore(); break;
    case 'stars': c.save(); c.translate(.5, .5); c.scale(.66, .66); c.beginPath(); unitPath(c, 'star'); c.fill(); c.restore(); break;
    case 'gingham': c.globalAlpha = .45; c.fillRect(0, 0, .5, 1); c.fillRect(0, 0, 1, .5); break;
    case 'waves': c.lineWidth = .07; [.3, .8].forEach((yy) => { c.beginPath(); for (let i = 0; i <= 24; i++) { const x = i / 24, y = yy + Math.sin(x * 2 * PI) * .12; if (i) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke(); }); break;
    case 'checker': c.fillRect(0, 0, .5, .5); c.fillRect(.5, .5, .5, .5); break;
    case 'zigzag': c.lineWidth = .08; c.beginPath(); c.moveTo(0, .75); c.lineTo(.25, .25); c.lineTo(.5, .75); c.lineTo(.75, .25); c.lineTo(1, .75); c.stroke(); break;
    case 'plus': c.fillRect(.42, .22, .16, .56); c.fillRect(.22, .42, .56, .16); break;
    case 'scales': c.lineWidth = .05; [[0, 0], [1, 0], [.5, .5], [0, 1], [1, 1]].forEach((p) => { c.beginPath(); c.arc(p[0], p[1], .5, 0, 2 * PI); c.stroke(); }); break;
    case 'triangles': c.beginPath(); poly(c, [[.1, .9], [.5, .12], [.9, .9]]); c.fill(); break;
    case 'grid': c.lineWidth = .035; c.beginPath(); c.moveTo(0, 0); c.lineTo(1, 0); c.moveTo(0, 0); c.lineTo(0, 1); c.stroke(); break;
    case 'paper': for (let i = 0; i < 160; i++) { c.globalAlpha = .04 + rnd() * .12; c.beginPath(); circ(c, rnd(), rnd(), .002 + rnd() * .006); c.fill(); } c.lineWidth = .002; for (let i = 0; i < 18; i++) { c.globalAlpha = .06; const x = rnd(), y = rnd(), a = rnd() * 6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * .04, y + Math.sin(a) * .04); c.stroke(); } break;
    case 'linen': c.globalAlpha = .12; c.lineWidth = .014; for (let i = 0; i < 16; i++) { c.beginPath(); c.moveTo(0, i / 16); c.lineTo(1, i / 16); c.moveTo(i / 16, 0); c.lineTo(i / 16, 1); c.stroke(); } break;
    default: break;
  }
  c.restore();
}

/* ================= de view ================= */
let idCounter = 0;
const nid = (p) => p + Date.now().toString(36) + (++idCounter).toString(36) + Math.random().toString(36).slice(2, 5);
const BIG = 12000; // schaduwtruc: vorm buiten beeld tekenen, schaduw terug verschoven
const MAXOBJ = 80, MAXPHOTOS = 24, MAXCOLLAGES = 10;
const TABS = [['new', '➕ Nieuw'], ['props', '⚙️ Aanpassen'], ['layers', '📚 Lagen'], ['page', '🖼 Pagina'], ['tools', '📐 Indelen'], ['saves', '💾 Collages']];
const SKEY = 'simon.fotocollage.free.settings';

// ctx: { view, esc, uid, addCleanup }
export function collageFreeView(ctx) {
  const { view, esc, addCleanup } = ctx;
  let alive = true;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms); timers.add(t); return t; };
  const readSettings = () => { try { return JSON.parse(localStorage.getItem(SKEY) || '{}') || {}; } catch (e) { return {}; } };
  const st0 = readSettings();

  const S = {
    fmt: FORMATS.some((f) => f[0] === st0.fmt) || st0.fmt === 'free' ? st0.fmt : '1:1',
    free: st0.free && st0.free.w > 0 ? st0.free : { w: 1200, h: 900 },
    bg: { t: 'color', c1: '#ffffff', c2: '#fde68a', ang: 135, pat: 'dots', p1: '#fff7ed', p2: '#fdba74', ps: 1, img: null, blur: 0 },
    objs: [], sel: [], grid: !!st0.grid, snap: st0.snap !== false, name: 'Mijn collage', cid: null,
    multi: false, crop: false, draw: { on: false, tool: 'pen', color: '#ef4444', size: 10, layer: null },
    tab: null, lastFont: st0.font || 'round', lastColor: st0.color || '#6366f1', exp: { type: 'png', w: 1080 }, dirty: false,
  };
  const saveSettings = () => { try { localStorage.setItem(SKEY, JSON.stringify({ grid: S.grid, snap: S.snap, fmt: S.fmt, free: S.free, font: S.lastFont, color: S.lastColor })); } catch (e) { /* ok */ } };
  let CH = 1000;
  const ratio = () => { if (S.fmt === 'free') return clamp(S.free.h / S.free.w, .2, 5); const f = FORMATS.filter((x) => x[0] === S.fmt)[0] || FORMATS[0]; return f[2] / f[1]; };
  function updateDims() {
    CH = Math.round(CW * ratio());
    S.objs.forEach((o) => { if (o.type === 'draw') { o.x = CW / 2; o.y = CH / 2; o.w = CW; o.h = CH; } });
  }
  updateDims();

  /* ---------- hulp: canvassen & foto's ---------- */
  const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  const freeCanvas = (c) => { try { c.width = 1; c.height = 1; } catch (e) { /* ok */ } };
  function scaledCanvas(src, side) {
    const sc = Math.min(1, side / Math.max(src.width, src.height)); if (sc >= 1) return src;
    const c = mkCanvas(src.width * sc, src.height * sc), g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, c.width, c.height); return c;
  }
  const bitmaps = new Map(); // id -> {src, prev}
  function addBitmap(cv, id) { id = id || nid('i'); bitmaps.set(id, { src: cv, prev: scaledCanvas(cv, 1000) }); return id; }
  function loadFile(f, side) {
    return new Promise((res) => {
      const url = URL.createObjectURL(f), im = new Image();
      const done = (v) => { try { URL.revokeObjectURL(url); } catch (e) { /* ok */ } res(v); };
      im.onload = () => {
        try {
          const nw = im.naturalWidth || im.width, nh = im.naturalHeight || im.height; if (!nw || !nh) { done(null); return; }
          const sc = Math.min(1, side / Math.max(nw, nh)), cv = mkCanvas(nw * sc, nh * sc);
          cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); done(cv);
        } catch (e) { done(null); }
      };
      im.onerror = () => done(null); im.src = url;
    });
  }
  function usedImgIds() {
    const s = new Set(); S.objs.forEach((o) => { if (o.type === 'photo' && o.img) s.add(o.img); }); if (S.bg.t === 'photo' && S.bg.img) s.add(S.bg.img); return s;
  }
  function pruneBitmaps() {
    const used = usedImgIds(); const histText = hist.stack.join('\n');
    [...bitmaps.keys()].forEach((id) => { if (!used.has(id) && histText.indexOf(id) < 0) { const b = bitmaps.get(id); bitmaps.delete(id); if (b.prev !== b.src) freeCanvas(b.prev); freeCanvas(b.src); } });
  }

  /* ---------- tekst ---------- */
  const mctx = mkCanvas(4, 4).getContext('2d');
  const fontOf = (o) => `${o.it ? 'italic ' : ''}${o.bold ? '700' : '400'} ${o.size}px ${fontStack(o.font)}`;
  function layoutText(o) {
    mctx.font = fontOf(o); const pad = o.size * (o.bar ? .34 : .1) + (o.sw || 0);
    if (o.curve) {
      const t = mctx.measureText(o.text.replace(/\n/g, ' ')).width, sweep = Math.max(.05, Math.abs(o.curve) / 100 * Math.PI), R = t / sweep, sag = R * (1 - Math.cos(sweep / 2));
      o.w = Math.max(o.size, 2 * R * Math.sin(Math.min(sweep / 2, Math.PI / 2))) + pad * 2; o.h = o.size * 1.15 + sag + pad * 2;
    } else {
      const lines = o.text.split('\n'); let mw = 0; lines.forEach((l) => { mw = Math.max(mw, mctx.measureText(l).width); });
      o.w = Math.max(o.size * .6, mw) + pad * 2; o.h = lines.length * o.size * 1.2 + pad * 2;
    }
  }

  /* ---------- verwerkte foto's (filters) ---------- */
  const pcache = new Map(), usedNow = new Set(); let pcachePx = 0;
  function getProc(o, need, noCache) {
    const bm = bitmaps.get(o.img); if (!bm) return null;
    const base = need > 1000 && bm.src !== bm.prev ? bm.src : bm.prev;
    const f = o.filter || 'none';
    if (f === 'none' && !o.br && !o.ct && !o.sa) return base;
    const key = [o.img, base === bm.src ? 's' : 'p', f, o.fa, o.br, o.ct, o.sa, o.da, o.db].join('|');
    if (!noCache && pcache.has(key)) { usedNow.add(key); return pcache.get(key); }
    const t = mkCanvas(base.width, base.height), g = t.getContext('2d'); g.drawImage(base, 0, 0);
    try {
      const im = g.getImageData(0, 0, t.width, t.height);
      adjustPixels(im.data, { filter: f, amt: o.fa, bright: o.br, contrast: o.ct, sat: o.sa, duoA: o.da, duoB: o.db }); g.putImageData(im, 0, 0);
    } catch (e) { freeCanvas(t); return base; }
    if (!noCache) {
      pcache.set(key, t); usedNow.add(key); pcachePx += t.width * t.height;
      for (const k of [...pcache.keys()]) { if (pcachePx <= 40e6) break; if (usedNow.has(k)) continue; const v = pcache.get(k); pcachePx -= v.width * v.height; freeCanvas(v); pcache.delete(k); }
    }
    return t;
  }
  function clearProcCache() { pcache.forEach((v) => freeCanvas(v)); pcache.clear(); pcachePx = 0; }

  /* ---------- tekenlagen ---------- */
  const layerCache = new Map(), layerVer = new Map();
  const verOf = (id) => layerVer.get(id) || 0, bumpLayer = (id) => layerVer.set(id, verOf(id) + 1);
  function paintStrokes(g, strokes, k) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    strokes.forEach((s) => {
      const p = s.pts; if (!p || p.length < 2) return;
      g.save(); g.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over'; g.globalAlpha = s.tool === 'marker' ? .45 : 1;
      g.strokeStyle = g.fillStyle = s.tool === 'eraser' ? '#000' : s.color; g.lineWidth = s.size * k;
      if (p.length < 4) { g.beginPath(); g.arc(p[0] * k, p[1] * k, s.size * k / 2, 0, Math.PI * 2); g.fill(); }
      else {
        g.beginPath(); g.moveTo(p[0] * k, p[1] * k);
        for (let i = 2; i < p.length - 2; i += 2) g.quadraticCurveTo(p[i] * k, p[i + 1] * k, (p[i] + p[i + 2]) / 2 * k, (p[i + 1] + p[i + 3]) / 2 * k);
        g.lineTo(p[p.length - 2] * k, p[p.length - 1] * k); g.stroke();
      }
      g.restore();
    });
  }
  function layerCanvas(o, k, exp) {
    const w = Math.round(CW * k), h = Math.round(CH * k);
    if (exp) { const c = mkCanvas(w, h); paintStrokes(c.getContext('2d'), o.strokes, w / CW); return c; }
    const stamp = verOf(o.id) + '|' + w + 'x' + h + '|' + o.strokes.length; const e = layerCache.get(o.id);
    if (e && e.stamp === stamp) return e.c;
    const c = e ? e.c : mkCanvas(w, h); if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } else c.getContext('2d').clearRect(0, 0, w, h);
    paintStrokes(c.getContext('2d'), o.strokes, w / CW); layerCache.set(o.id, { c, stamp }); return c;
  }

  /* ---------- achtergrond ---------- */
  const tileCache = new Map(), blurCache = new Map();
  function blurred(src, amt, key) {
    const ck = key + '|' + amt; if (blurCache.has(ck)) return blurCache.get(ck);
    const f = 1 + amt * .3, cw = Math.max(4, Math.round(src.width / f)), ch = Math.max(4, Math.round(src.height / f));
    const t = mkCanvas(cw, ch), g = t.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, cw, ch);
    const t2 = mkCanvas(Math.max(3, cw >> 1), Math.max(3, ch >> 1)), g2 = t2.getContext('2d'); g2.drawImage(t, 0, 0, t2.width, t2.height); g.drawImage(t2, 0, 0, cw, ch); freeCanvas(t2);
    blurCache.set(ck, t); while (blurCache.size > 3) { const k0 = blurCache.keys().next().value; freeCanvas(blurCache.get(k0)); blurCache.delete(k0); }
    return t;
  }
  function drawBg(c, k, exp) {
    const W = CW * k, H = CH * k, b = S.bg; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
    if (b.t === 'grad') {
      const a = (b.ang || 0) * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), L = (Math.abs(W * dx) + Math.abs(H * dy)) / 2;
      const g = c.createLinearGradient(W / 2 - dx * L, H / 2 - dy * L, W / 2 + dx * L, H / 2 + dy * L); g.addColorStop(0, b.c1); g.addColorStop(1, b.c2); c.fillStyle = g; c.fillRect(0, 0, W, H);
    } else if (b.t === 'pat') drawPattern(c, k, W, H, b);
    else if (b.t === 'photo') {
      const bm = b.img && bitmaps.get(b.img); c.fillStyle = '#e5e7eb'; c.fillRect(0, 0, W, H);
      if (bm) {
        let src = exp && !b.blur ? bm.src : bm.prev; if (b.blur > 0) src = blurred(src, b.blur, b.img + (src === bm.src ? 's' : 'p'));
        const s = Math.max(W / src.width, H / src.height), dw = src.width * s, dh = src.height * s; c.imageSmoothingQuality = 'high'; c.drawImage(src, (W - dw) / 2, (H - dh) / 2, dw, dh);
      }
    } else { c.fillStyle = b.c1; c.fillRect(0, 0, W, H); }
    c.restore();
  }
  function drawPattern(c, k, W, H, b) {
    const key = b.pat, ps = b.ps || 1; c.fillStyle = b.p1; c.fillRect(0, 0, W, H);
    if (key === 'wood') {
      const rnd = rng(3), ph = 110 * ps * k; let y = 0, row = 0;
      while (y < H) {
        c.fillStyle = shade(b.p1, (rnd() - .5) * .22); c.fillRect(0, y, W, ph);
        c.strokeStyle = b.p2; c.lineWidth = Math.max(1, 1.4 * k);
        for (let i = 0; i < 6; i++) { c.globalAlpha = .12 + rnd() * .16; c.beginPath(); const yy = y + ph * (.1 + rnd() * .8), a = (4 + rnd() * 8) * k; c.moveTo(0, yy); for (let x = 0; x <= W; x += 40 * k) c.lineTo(x, yy + Math.sin(x / (60 * k) + i + row) * a * .4); c.stroke(); }
        c.globalAlpha = .5; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); const sx = rnd() * W; c.beginPath(); c.moveTo(sx, y); c.lineTo(sx, y + ph); c.stroke(); c.globalAlpha = 1; y += ph; row++;
      }
    } else if (key === 'confetti') {
      const rnd = rng(5), pal = [b.p2, '#ef4444', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'], n = Math.round(150 * (CH / CW) * ps + 60);
      for (let i = 0; i < n; i++) { c.save(); c.translate(rnd() * W, rnd() * H); c.rotate(rnd() * 6.3); c.fillStyle = pal[i % pal.length]; const s = (7 + rnd() * 9) * k * ps; if (i % 4 === 0) { c.beginPath(); c.arc(0, 0, s * .45, 0, 6.3); c.fill(); } else c.fillRect(-s / 2, -s / 5, s, s * .4); c.restore(); }
    } else {
      const tu = 60 * ps, T = clamp(Math.round(tu * k), 16, 512), tk = key + '|' + b.p1 + '|' + b.p2 + '|' + T; let tile = tileCache.get(tk);
      if (!tile) { tile = mkCanvas(T, T); drawTile(tile, key, b.p1, b.p2); tileCache.set(tk, tile); while (tileCache.size > 6) { const k0 = tileCache.keys().next().value; freeCanvas(tileCache.get(k0)); tileCache.delete(k0); } }
      const pat = c.createPattern(tile, 'repeat'), sc = tu * k / T; c.save(); c.scale(sc, sc); c.fillStyle = pat; c.fillRect(0, 0, W / sc + 1, H / sc + 1); c.restore();
    }
  }

  /* ---------- objecten tekenen ---------- */
  const radOf = (o) => (o.mask === 'rect' || o.mask === 'round' || o.shape === 'rect' || o.shape === 'round') ? (o.rad || 0) * Math.min(o.w, o.h) / 2 : 0;
  function xform(c, o, k, devX) {
    c.setTransform(1, 0, 0, 1, devX || 0, 0); c.scale(k, k); c.translate(o.x, o.y); c.rotate(o.rot || 0); if (o.flip) c.scale(-1, 1);
  }
  function setShadow(c, o, k) { if (!o.shadow) return; c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = o.shadow * .35 * k; c.shadowOffsetX = 0; c.shadowOffsetY = o.shadow * .12 * k; }
  function clearShadow(c) { c.shadowColor = 'rgba(0,0,0,0)'; c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0; }
  function innerStroke(c, o, key, k) {
    if (!(o.sw > 0)) return;
    c.save(); shapePath(c, key, o.w, o.h, radOf(o)); c.clip(); shapePath(c, key, o.w, o.h, radOf(o)); c.lineWidth = o.sw * 2; c.strokeStyle = o.stroke; c.lineJoin = 'round'; c.stroke(); c.restore();
  }
  function drawObj(c, o, k, exp) {
    c.save(); c.globalAlpha = clamp(o.op == null ? 1 : o.op, 0, 1); clearShadow(c);
    if (o.type === 'draw') {
      c.setTransform(1, 0, 0, 1, 0, 0); const lc = layerCanvas(o, k, exp); c.drawImage(lc, 0, 0, Math.round(CW * k), Math.round(CH * k)); if (exp) freeCanvas(lc); c.restore(); return;
    }
    if (o.type === 'photo') drawPhoto(c, o, k, exp);
    else {
      xform(c, o, k, 0);
      if (o.type === 'shape') {
        setShadow(c, o, k); shapePath(c, o.shape, o.w, o.h, radOf(o)); c.fillStyle = o.fill; c.fill(); clearShadow(c); innerStroke(c, o, o.shape, k);
      } else if (o.type === 'text') drawText(c, o, k);
      else if (o.type === 'sticker') {
        setShadow(c, o, k);
        if (o.art) drawArt(c, o.art, o.col, o.w, o.h);
        else { c.font = `${Math.round(o.h * .8)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000'; c.fillText(o.e, 0, o.h * .04); }
      } else if (o.type === 'line') drawLine(c, o, k);
    }
    c.restore();
  }
  function drawPhoto(c, o, k, exp) {
    const bm = bitmaps.get(o.img), key = o.mask || 'rect';
    if (!bm) { xform(c, o, k, 0); shapePath(c, key, o.w, o.h, radOf(o)); c.fillStyle = '#cbd5e1'; c.fill(); return; }
    const need = Math.max(o.w, o.h) * k * Math.max(1, o.cz || 1), src = getProc(o, need, exp);
    if (!src) return;
    if (o.shadow) { xform(c, o, k, -BIG); shapePath(c, key, o.w, o.h, radOf(o)); setShadow(c, o, k); c.shadowOffsetX = BIG; c.fillStyle = '#000'; c.fill(); clearShadow(c); }
    xform(c, o, k, 0);
    const iw = src.width, ih = src.height, s = Math.max(o.w / iw, o.h / ih) * (o.cz || 1), dw = iw * s, dh = ih * s;
    const left = -dw / 2 + (o.cx || 0) * (dw - o.w) / 2, top = -dh / 2 + (o.cy || 0) * (dh - o.h) / 2;
    c.save(); shapePath(c, key, o.w, o.h, radOf(o)); c.clip(); c.imageSmoothingQuality = 'high'; c.drawImage(src, left, top, dw, dh); c.restore();
    if (exp && src !== bm.src && src !== bm.prev) freeCanvas(src);
    innerStroke(c, o, key, k);
  }
  function drawText(c, o, k) {
    const pad = o.size * (o.bar ? .34 : .1) + (o.sw || 0);
    if (o.bar) { c.beginPath(); const r = (o.rad || 0) * Math.min(o.w, o.h) / 2; rr(c, -o.w / 2, -o.h / 2, o.w, o.h, r); setShadow(c, { shadow: o.shadow }, k); c.fillStyle = o.barCol; c.fill(); clearShadow(c); }
    c.font = fontOf(o); c.textBaseline = 'middle'; c.lineJoin = 'round'; c.miterLimit = 2;
    const pass = (fn) => {
      if (o.sw > 0) { c.lineWidth = o.sw * 2; c.strokeStyle = o.stroke; fn('stroke'); }
      if (o.shadow && !o.bar) setShadow(c, o, k); c.fillStyle = o.col; fn('fill'); clearShadow(c);
    };
    if (o.curve) {
      const txt = o.text.replace(/\n/g, ' '), chars = Array.from(txt), widths = chars.map((ch) => c.measureText(ch).width), T = widths.reduce((a, b) => a + b, 0);
      const sweep = Math.max(.05, Math.abs(o.curve) / 100 * Math.PI), R = T / sweep, sag = R * (1 - Math.cos(sweep / 2)), up = o.curve > 0;
      const base = up ? -o.h / 2 + pad + o.size * .8 : -o.h / 2 + pad + o.size * .8 + sag;
      c.textAlign = 'center';
      pass((mode) => {
        let acc = 0;
        chars.forEach((ch, i) => {
          const mid = acc + widths[i] / 2; acc += widths[i]; const phi = mid / R - sweep / 2;
          c.save(); c.translate(R * Math.sin(phi), up ? base + R * (1 - Math.cos(phi)) : base - R * (1 - Math.cos(phi))); c.rotate(up ? phi : -phi);
          if (mode === 'stroke') c.strokeText(ch, 0, 0); else c.fillText(ch, 0, 0); c.restore();
        });
      });
    } else {
      const lines = o.text.split('\n'), lh = o.size * 1.2, ax = o.align === 'left' ? -o.w / 2 + pad : o.align === 'right' ? o.w / 2 - pad : 0;
      c.textAlign = o.align === 'left' ? 'left' : o.align === 'right' ? 'right' : 'center';
      pass((mode) => { lines.forEach((l, i) => { const y = -o.h / 2 + pad + lh * (i + .5) + o.size * .03; if (mode === 'stroke') c.strokeText(l, ax, y); else c.fillText(l, ax, y); }); });
    }
  }
  function drawLine(c, o, k) {
    const L = o.w / 2, sw = o.sw, hs = sw * 2.6 + 14, col = o.col;
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = sw; c.lineCap = o.dash ? 'butt' : 'round'; if (o.dash) c.setLineDash([sw * 2.4, sw * 1.8]);
    setShadow(c, o, k);
    const x0 = o.arrow === 'both' ? -L + hs * .7 : -L, x1 = o.arrow !== 'none' ? L - hs * .7 : L;
    c.beginPath(); c.moveTo(x0, 0); c.lineTo(x1, 0); c.stroke(); c.setLineDash([]);
    const head = (dir) => { c.beginPath(); c.moveTo(dir * L, 0); c.lineTo(dir * (L - hs), -hs * .55); c.lineTo(dir * (L - hs), hs * .55); c.closePath(); c.fill(); };
    if (o.arrow !== 'none') head(1); if (o.arrow === 'both') head(-1);
    clearShadow(c);
  }
  function renderScene(c, k, exp) {
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    drawBg(c, k, exp);
    S.objs.forEach((o) => { if (!o.hidden) drawObj(c, o, k, exp); });
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
  }

  /* ---------- stijl ---------- */
  const style = document.createElement('style');
  style.textContent = `
.cf-wrap{max-width:920px;margin:0 auto;color:var(--ink);-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.cf-wrap button,.cf-wrap input,.cf-wrap textarea{font:inherit;color:inherit}
.cf-top{display:flex;gap:6px;align-items:center;margin-bottom:8px;overflow-x:auto;-webkit-overflow-scrolling:touch}
.cf-sp{flex:1 0 4px}
.cf-btn{min-width:42px;height:42px;padding:0 11px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;white-space:nowrap;flex:0 0 auto;font-size:.92rem;-webkit-tap-highlight-color:transparent}
.cf-btn.on{background:var(--accent);color:#fff;border-color:var(--accent)}
.cf-btn:disabled{opacity:.35;cursor:default}
.cf-btn.pri{background:var(--accent);color:#fff;border-color:var(--accent);font-weight:700}
.cf-btn.warn{border-color:#ef4444;color:#ef4444}
.cf-stage{position:relative;width:100%;border-radius:16px;border:1px solid var(--line);background:var(--card);overflow:hidden;touch-action:none;-ms-touch-action:none}
.cf-stage canvas{position:absolute;display:block;touch-action:none}
.cf-scene{box-shadow:0 4px 18px rgba(0,0,0,.28)}
.cf-ov{left:0;top:0;pointer-events:none}
.cf-note{font-size:.85rem;opacity:.85;min-height:1.3em;margin:6px 2px}
.cf-bar{display:flex;gap:6px;overflow-x:auto;padding:2px 0 6px;-webkit-overflow-scrolling:touch}
.cf-tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch}
.cf-tab{flex:0 0 auto;height:38px;padding:0 12px;border-radius:10px;border:1px solid var(--line);background:transparent;cursor:pointer;white-space:nowrap;font-size:.88rem}
.cf-tab.on{background:var(--card);border-color:var(--accent);box-shadow:inset 0 -3px 0 var(--accent);font-weight:700}
.cf-panel{background:var(--card);border:1px solid var(--line);border-radius:16px;margin-top:6px;overflow-y:auto;overflow-x:hidden;padding:10px 12px;-webkit-overflow-scrolling:touch;-webkit-user-select:text;user-select:text}
.cf-h{font-weight:700;margin:12px 0 6px;font-size:.88rem;opacity:.85}.cf-h:first-child{margin-top:2px}
.cf-row{display:flex;align-items:center;gap:8px;margin:7px 0}.cf-row>span{min-width:6.2rem;font-size:.85rem}
.cf-row input[type=range]{flex:1;min-width:0;height:30px}.cf-val{min-width:2.6rem;text-align:right;font-size:.8rem;opacity:.8;font-weight:400}
.cf-chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.cf-chip{min-height:36px;padding:4px 11px;border-radius:10px;border:1px solid var(--line);background:transparent;cursor:pointer;font-size:.85rem}
.cf-chip.on{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent)}
.cf-sw{width:32px;height:32px;border-radius:50%;border:2px solid var(--line);padding:0;cursor:pointer;flex:0 0 auto}
.cf-sw.on{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent)}
.cf-colorin{width:38px;height:34px;padding:0;border:none;background:none}
.cf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(54px,1fr));gap:6px}
.cf-gi{aspect-ratio:1;border-radius:12px;border:1px solid var(--line);background:transparent;padding:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.7rem}
.cf-gi.on{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent)}.cf-gi img{width:100%;height:100%;object-fit:contain;pointer-events:none}
.cf-wide{width:100%;margin:4px 0}
.cf-ta{width:100%;box-sizing:border-box;min-height:64px;border-radius:12px;border:1px solid var(--line);background:transparent;padding:8px;resize:vertical;-webkit-user-select:text;user-select:text}
.cf-num{width:5.2rem;height:36px;border-radius:10px;border:1px solid var(--line);background:transparent;padding:0 8px;-webkit-user-select:text;user-select:text}
.cf-lay{display:flex;align-items:center;gap:6px;padding:4px;border:1px solid var(--line);border-radius:12px;margin:5px 0;background:transparent}
.cf-lay.on{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent)}.cf-lay.over{border-top:4px solid var(--accent)}.cf-lay.off{opacity:.5}
.cf-lay .cf-th{width:42px;height:42px;border-radius:8px;flex:0 0 auto;background:rgba(128,128,128,.15)}
.cf-lay .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;padding:8px 2px;font-size:.88rem}
.cf-lay button{width:36px;height:38px;border-radius:9px;border:1px solid var(--line);background:transparent;cursor:pointer;padding:0;flex:0 0 auto}
.cf-lay .hd{touch-action:none;cursor:grab}
.cf-sv{display:flex;gap:8px;align-items:center;border:1px solid var(--line);border-radius:12px;padding:6px;margin:6px 0}
.cf-sv img{width:64px;height:64px;object-fit:cover;border-radius:8px;flex:0 0 auto;background:rgba(128,128,128,.2)}.cf-sv .meta{flex:1;min-width:0;font-size:.85rem}
.cf-sv .acts{display:flex;gap:5px;flex-wrap:wrap}.cf-sv .acts button{height:34px;padding:0 9px;border-radius:9px;border:1px solid var(--line);background:transparent;cursor:pointer;font-size:.8rem}
.cf-sheet{position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:9000;display:flex;align-items:flex-end;justify-content:center}
.cf-sheet>div{background:var(--card);color:var(--ink);width:100%;max-width:520px;border-radius:20px 20px 0 0;padding:16px 16px 22px;box-sizing:border-box;max-height:90%;overflow:auto}
@media (min-width:600px){.cf-sheet{align-items:center}.cf-sheet>div{border-radius:20px}}
.cf-hint{font-size:.82rem;opacity:.75;margin:6px 0}
`;
  document.head.appendChild(style);

  /* ---------- kleine DOM-helper ---------- */
  function el(tag, attrs) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k]; if (v == null || v === false) continue;
      if (k === 'class') e.className = v; else if (k === 'style') e.style.cssText = v; else if (k.slice(0, 2) === 'on') e[k] = v; else if (k === 'text') e.textContent = v; else e.setAttribute(k, v === true ? '' : v);
    }
    for (let i = 2; i < arguments.length; i++) {
      const kid = arguments[i]; if (kid == null || kid === false) continue;
      if (Array.isArray(kid)) kid.forEach((x) => { if (x != null && x !== false) e.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); });
      else e.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    }
    return e;
  }
  const hex6 = (c) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : '#000000');

  /* ---------- toestand: historie, selectie, bewerkingen ---------- */
  const hist = makeHistory(30);
  const snapshot = () => JSON.stringify({ fmt: S.fmt, free: S.free, bg: S.bg, objs: S.objs });
  const byId = (id) => { for (let i = 0; i < S.objs.length; i++) if (S.objs[i].id === id) return S.objs[i]; return null; };
  const selObjs = () => S.sel.map(byId).filter(Boolean);
  const primary = () => byId(S.sel[S.sel.length - 1]);
  const eachSel = (fn, type) => selObjs().forEach((o) => { if (!type || o.type === type) fn(o); });
  let autoT = null;
  function commit() {
    if (!alive) return; S.dirty = true;
    if (hist.push(snapshot())) { updateTop(); if (S.cid) { if (autoT) clearTimeout(autoT); autoT = later(() => saveCurrent(true), 1800); } }
  }
  function restore(json) {
    const d = JSON.parse(json); S.fmt = d.fmt; S.free = d.free; S.bg = d.bg; S.objs = d.objs; updateDims();
    S.objs.forEach((o) => { if (o.type === 'text') layoutText(o); if (o.type === 'draw') bumpLayer(o.id); });
    S.sel = S.sel.filter((id) => !!byId(id)); S.draw.layer = byId(S.draw.layer) ? S.draw.layer : null;
    if (S.crop && !(primary() && primary().type === 'photo')) S.crop = false;
    sizeStage(); paint(); refresh();
  }
  function undo() { const j = hist.undo(); if (j) restore(j); }
  function redo() { const j = hist.redo(); if (j) restore(j); }

  let noteT = null;
  function note(msg, ms) { if (!noteEl) return; noteEl.textContent = msg || ''; if (noteT) clearTimeout(noteT); if (msg && ms !== 0) noteT = later(() => { noteEl.textContent = ''; }, ms || 3500); }

  const baseObj = (type, extra) => Object.assign({ id: nid('o'), type, x: CW / 2, y: CH / 2, w: 300, h: 300, rot: 0, flip: false, op: 1, shadow: 0, stroke: '#ffffff', sw: 0, rad: 0, locked: false, hidden: false }, extra);
  function addObj(o, sel) {
    if (S.objs.length >= MAXOBJ) { note('Maximaal ' + MAXOBJ + ' lagen: haal eerst iets weg.'); return null; }
    if (!o.fixedPos) { const off = (S.objs.length % 6) * 22 - 55; o.x += off; o.y += off; }
    S.objs.push(o); if (sel !== false) { S.sel = [o.id]; S.multi = S.multi && false; } return o;
  }
  const photoDefaults = (id, x, y, w, h, rot, frame) => baseObj('photo', { img: id, x, y, w, h, rot, mask: 'rect', cz: 1, cx: 0, cy: 0, filter: 'none', fa: 100, br: 0, ct: 0, sa: 0, da: '#1e1b4b', db: '#fbbf24', stroke: '#ffffff', sw: frame ? 9 : 0, shadow: frame ? 35 : 0, fixedPos: true });
  const typeLabel = { photo: 'Foto', shape: 'Vorm', text: 'Tekst', sticker: 'Sticker', line: 'Lijn', draw: 'Tekening' };
  function objName(o) {
    if (o.type === 'text') return '“' + (o.text.split('\n')[0] || '').slice(0, 18) + '”';
    if (o.type === 'sticker') { const a = ARTS.filter((x) => x[0] === o.art)[0]; return 'Sticker ' + (a ? a[1] : o.e); }
    if (o.type === 'shape') { const m = MASKS.filter((x) => x[0] === o.shape)[0]; return m ? m[1] : 'Vorm'; }
    if (o.type === 'line') return o.arrow === 'none' ? 'Lijn' : 'Pijl';
    return typeLabel[o.type] || 'Laag';
  }
  function addShape(key) {
    const o = addObj(baseObj('shape', { shape: key, w: 320, h: 320, fill: S.lastColor, rad: key === 'round' ? .3 : 0 })); if (!o) return; paint(); commit(); refresh(); note('Vorm toegevoegd. Sleep, schaal of draai hem.');
  }
  function addText(preset) {
    const p = Object.assign({ text: 'Tekst', font: S.lastFont, size: 130, col: '#111827', align: 'center', bold: true, it: false, bar: false, barCol: '#ffffff', curve: 0, stroke: '#ffffff', sw: 0 }, preset || {});
    const o = addObj(baseObj('text', p)); if (!o) return; layoutText(o); paint(); commit(); openProps(true);
  }
  function addEmoji(e) { const o = addObj(baseObj('sticker', { e, w: 230, h: 230 })); if (!o) return; paint(); commit(); refresh(); }
  function addArt(key) {
    const a = ARTS.filter((x) => x[0] === key)[0], w = a[3] >= 1 ? 300 : 260; const o = addObj(baseObj('sticker', { art: key, col: a[2], w: w * (a[3] > 1.5 ? 1.2 : 1), h: w * (a[3] > 1.5 ? 1.2 : 1) / a[3] })); if (!o) return;
    paint(); commit(); refresh();
  }
  function addLine(arrow, dash) {
    const o = addObj(baseObj('line', { w: 420, h: 44, sw: 12, col: '#111827', arrow, dash: !!dash })); if (!o) return; paint(); commit(); refresh();
  }
  function newDrawLayer() { const o = baseObj('draw', { x: CW / 2, y: CH / 2, w: CW, h: CH, strokes: [], fixedPos: true }); return addObj(o, false) ? o : null; }

  function dupSel() {
    const list = selObjs(); if (!list.length) return; const ids = [];
    for (const o of list) {
      if (S.objs.length >= MAXOBJ) { note('Maximaal ' + MAXOBJ + ' lagen.'); break; }
      const c = JSON.parse(JSON.stringify(o)); c.id = nid('o'); c.locked = false; if (c.type !== 'draw') { c.x += 34; c.y += 34; }
      S.objs.splice(S.objs.indexOf(o) + 1, 0, c); ids.push(c.id); if (c.type === 'draw') bumpLayer(c.id);
    }
    S.sel = ids; paint(); commit(); refresh();
  }
  function delSel() {
    const ids = S.sel.slice(); if (!ids.length) return; S.objs = S.objs.filter((o) => ids.indexOf(o.id) < 0); S.sel = []; S.crop = false;
    ids.forEach((id) => { const e = layerCache.get(id); if (e) { freeCanvas(e.c); layerCache.delete(id); } });
    paint(); commit(); refresh(); note('Weggehaald. Met ↶ haal je het terug.');
  }
  function reorder(where) {
    const ids = S.sel; if (!ids.length) return; const sel = S.objs.filter((o) => ids.indexOf(o.id) >= 0), rest = S.objs.filter((o) => ids.indexOf(o.id) < 0);
    if (where === 'front') S.objs = rest.concat(sel); else if (where === 'back') S.objs = sel.concat(rest);
    else if (where === 'up') { for (let i = S.objs.length - 2; i >= 0; i--) if (ids.indexOf(S.objs[i].id) >= 0 && ids.indexOf(S.objs[i + 1].id) < 0) { const t = S.objs[i]; S.objs[i] = S.objs[i + 1]; S.objs[i + 1] = t; } }
    else { for (let i = 1; i < S.objs.length; i++) if (ids.indexOf(S.objs[i].id) >= 0 && ids.indexOf(S.objs[i - 1].id) < 0) { const t = S.objs[i]; S.objs[i] = S.objs[i - 1]; S.objs[i - 1] = t; } }
    paint(); commit(); refresh();
  }
  function flipSel() { eachSel((o) => { if (o.type === 'draw') return; if (o.type === 'line') o.rot += Math.PI; else o.flip = !o.flip; }); paint(); commit(); refresh(); }
  function lockSel(v) { eachSel((o) => { o.locked = v == null ? !o.locked : v; }); if (S.sel.length && selObjs().every((o) => o.locked)) { /* blijft geselecteerd voor de knop */ } paint(); commit(); refresh(); }

  function alignSel(mode) {
    const list = selObjs().filter((o) => !o.locked && o.type !== 'draw'); if (!list.length) { note('Kies eerst iets in de collage.'); return; }
    const boxes = list.map(bboxOf), bounds = list.length === 1 ? { l: 0, r: CW, t: 0, b: CH } : unionBox(boxes), d = alignBoxes(boxes, mode, bounds);
    list.forEach((o, i) => { o.x += d[i].dx; o.y += d[i].dy; }); paint(); commit(); refresh();
  }
  function distSel(axis) {
    const list = selObjs().filter((o) => !o.locked && o.type !== 'draw'); if (list.length < 3) { note('Kies minstens 3 lagen om gelijkmatig te verdelen (zet “Meerdere” aan).'); return; }
    const d = distributeBoxes(list.map(bboxOf), axis); list.forEach((o, i) => { o.x += d[i].dx; o.y += d[i].dy; }); paint(); commit(); refresh();
  }
  function arrangePhotos(gap) {
    const list = S.objs.filter((o) => o.type === 'photo' && !o.hidden && !o.locked); if (!list.length) { note('Voeg eerst foto’s toe.'); return; }
    let ar = 0; list.forEach((o) => { const b = bitmaps.get(o.img); ar += b ? b.src.width / b.src.height : 1; }); ar /= list.length;
    const cells = autoLayout(list.length, CW, CH, gap == null ? 14 : gap, 24, ar);
    list.forEach((o, i) => { const c = cells[i]; if (!c) return; o.x = c.x; o.y = c.y; o.w = c.w; o.h = c.h; o.rot = 0; o.cz = Math.max(1, o.cz || 1); o.cx = 0; o.cy = 0; });
    paint(); commit(); refresh(); note('Foto’s netjes ingedeeld. Sleep ze gerust verder.');
  }

  /* ---------- foto's toevoegen ---------- */
  function pickFiles(multiple, cb) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = !!multiple; inp.style.display = 'none';
    inp.onchange = () => { const fs = [].slice.call(inp.files || []); if (fs.length && alive) cb(fs); };
    inp.click();
  }
  const isImg = (f) => /^image\//.test(f.type || '') || /\.(heic|heif|jpe?g|png|webp|gif|avif)$/i.test(f.name || '');
  async function loadMany(files) {
    const list = files.filter(isImg); const out = []; let bad = 0;
    for (let i = 0; i < list.length; i++) {
      if (!alive) return out;
      if (bitmaps.size >= MAXPHOTOS + 6) pruneBitmaps();
      if (bitmaps.size >= MAXPHOTOS + 6) { note('Te veel foto’s tegelijk (max ' + MAXPHOTOS + ').'); break; }
      note('Foto ' + (i + 1) + ' van ' + list.length + ' laden…', 0);
      const cv = await loadFile(list[i], limitSide(bitmaps.size)); if (!cv) { bad++; continue; }
      const id = addBitmap(cv); out.push({ id, w: cv.width, h: cv.height });
    }
    if (bad) note(bad + ' bestand(en) kon ik niet openen.'); else if (out.length) note('');
    return out;
  }
  const fitBox = (iw, ih, mw, mh) => { const s = Math.min(mw / iw, mh / ih); return [iw * s, ih * s]; };
  async function addPhotos(files) {
    const items = await loadMany(files); if (!items.length || !alive) return;
    const existing = S.objs.filter((o) => o.type === 'photo').length, n = items.length, made = [];
    if (existing === 0 && n >= 2) {
      let ar = 0; items.forEach((p) => { ar += p.w / p.h; }); ar /= n; const cells = autoLayout(n, CW, CH, 14, 24, ar);
      items.forEach((p, i) => { const c = cells[i]; made.push(photoDefaults(p.id, c.x, c.y, c.w, c.h, 0, false)); });
    } else if (n === 1) {
      const p = items[0], f = fitBox(p.w, p.h, CW * (existing ? .55 : .8), CH * (existing ? .55 : .8)), off = Math.min(existing, 6) * 24;
      made.push(photoDefaults(p.id, CW / 2 + off - 40, CH / 2 + off - 40, f[0], f[1], 0, existing > 0));
    } else {
      items.forEach((p, i) => {
        const t = i - (n - 1) / 2, f = fitBox(p.w, p.h, CW * .5, CH * .5);
        made.push(photoDefaults(p.id, CW / 2 + t * Math.min(70, 360 / n), CH / 2 + Math.abs(t) * 12, f[0], f[1], t * .1, true));
      });
    }
    for (const o of made) { if (S.objs.length >= MAXOBJ) break; S.objs.push(o); }
    S.sel = made.map((o) => o.id); S.multi = false; sizeStage(); paint(); commit(); refresh();
    note(n > 1 ? n + ' foto’s toegevoegd.' : 'Foto toegevoegd. Dubbel-tik voor filters en vormen.');
  }
  const pickPhotos = () => pickFiles(true, addPhotos);
  async function replacePhoto(o) {
    pickFiles(false, async (fs) => {
      const items = await loadMany(fs); if (!items.length) return; const p = items[0]; o.img = p.id; o.cx = 0; o.cy = 0; o.cz = 1;
      paint(); commit(); refresh();
    });
  }
  async function setBgPhoto() {
    pickFiles(false, async (fs) => {
      const items = await loadMany(fs); if (!items.length) return; S.bg.t = 'photo'; S.bg.img = items[0].id; paint(); commit(); refresh();
    });
  }

  /* ---------- formaat ---------- */
  function setFormat(fmt, free) {
    const oldCH = CH; S.fmt = fmt; if (free) S.free = free; updateDims();
    if (oldCH !== CH) S.objs.forEach((o) => { if (o.type !== 'draw') o.y = clamp(o.y * CH / oldCH, 0, CH); });
    saveSettings(); sizeStage(); paint(); commit(); refresh();
  }

  /* ---------- stage, canvassen en indeling ---------- */
  let root, topEl, stage, sceneCv, ovCv, noteEl, bar, tabsEl, panel;
  let vs = .4, dpr = 1, stageW = 320, stageH = 420, ox = 0, oy = 0, accent = '#6366f1';
  const PAD = 38;
  function sizeStage() {
    if (!root || !alive) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    try { accent = (getComputedStyle(root).getPropertyValue('--accent') || '').trim() || '#6366f1'; } catch (e) { accent = '#6366f1'; }
    stageW = Math.max(240, root.clientWidth || view.clientWidth || 360);
    const pH = S.tab ? Math.max(170, Math.round(window.innerHeight * .34)) : 0;
    panel.style.display = S.tab ? '' : 'none'; panel.style.height = pH + 'px';
    const rt = root.getBoundingClientRect().top + (window.scrollY || 0), headOff = clamp(rt, 0, 150);
    const other = topEl.offsetHeight + bar.offsetHeight + tabsEl.offsetHeight + noteEl.offsetHeight + 36;
    stageH = clamp(Math.round(window.innerHeight - headOff - other - pH), 210, 780);
    const aw = stageW - 2 * PAD, ah = stageH - 2 * PAD; let cssW = Math.min(aw, ah * CW / CH); if (cssW < 80) cssW = 80;
    vs = cssW / CW; const cssH = CH * vs; ox = (stageW - cssW) / 2; oy = (stageH - cssH) / 2;
    stage.style.height = stageH + 'px';
    sceneCv.style.cssText = `left:${ox}px;top:${oy}px;width:${cssW}px;height:${cssH}px`;
    const sw = Math.round(cssW * dpr), sh = Math.round(cssH * dpr); if (sceneCv.width !== sw || sceneCv.height !== sh) { sceneCv.width = sw; sceneCv.height = sh; }
    const ow = Math.round(stageW * dpr), oh = Math.round(stageH * dpr); if (ovCv.width !== ow || ovCv.height !== oh) { ovCv.width = ow; ovCv.height = oh; }
    ovCv.style.width = stageW + 'px'; ovCv.style.height = stageH + 'px';
    paint();
  }
  let raf = 0, needScene = false;
  function paint(scene) {
    if (scene !== false) needScene = true; if (!raf && alive) raf = requestAnimationFrame(frame);
  }
  function frame() {
    raf = 0; if (!alive || !sceneCv) return;
    if (needScene) { needScene = false; usedNow.clear(); renderScene(sceneCv.getContext('2d'), sceneCv.width / CW, false); }
    drawOverlay();
  }

  const cornersOf = (o) => [[-o.w / 2, -o.h / 2], [o.w / 2, -o.h / 2], [o.w / 2, o.h / 2], [-o.w / 2, o.h / 2]].map((p) => toWorld(o, p[0], p[1]));
  const toStage = (x, y) => ({ x: ox + x * vs, y: oy + y * vs });
  const toC = (pt) => [(pt.x - ox) / vs, (pt.y - oy) / vs];
  function handlesFor(o) {
    if (!o || o.locked || o.type === 'draw' || S.sel.length !== 1 || S.crop || S.draw.on) return [];
    const hw = o.w / 2, hh = o.h / 2, P = (lx, ly) => { const w = toWorld(o, lx, ly); return toStage(w[0], w[1]); };
    const out = [Object.assign({ k: 'rot' }, P(0, -hh - 30 / vs))];
    if (o.type === 'line') { out.push(Object.assign({ k: 'e' }, P(hw, 0)), Object.assign({ k: 'w' }, P(-hw, 0))); }
    else {
      out.push(Object.assign({ k: 'nw' }, P(-hw, -hh)), Object.assign({ k: 'ne' }, P(hw, -hh)), Object.assign({ k: 'se' }, P(hw, hh)), Object.assign({ k: 'sw' }, P(-hw, hh)));
      if (o.type === 'photo' || o.type === 'shape') out.push(Object.assign({ k: 'e' }, P(hw, 0)), Object.assign({ k: 's' }, P(0, hh)));
    }
    return out;
  }
  function drawOverlay() {
    if (!ovCv || !alive) return; const g = ovCv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, ovCv.width, ovCv.height); g.scale(dpr, dpr);
    const cw = CW * vs, ch = CH * vs;
    if (S.grid) {
      g.save(); g.beginPath(); g.rect(ox, oy, cw, ch); g.clip(); g.strokeStyle = 'rgba(120,120,140,.45)'; g.lineWidth = 1; g.beginPath();
      const step = CW / 12; for (let x = step; x < CW; x += step) { g.moveTo(ox + x * vs, oy); g.lineTo(ox + x * vs, oy + ch); } for (let y = step; y < CH; y += step) { g.moveTo(ox, oy + y * vs); g.lineTo(ox + cw, oy + y * vs); }
      g.stroke(); g.restore();
    }
    if (G && G.guides) {
      g.save(); g.strokeStyle = '#ec4899'; g.lineWidth = 1.5; g.setLineDash([5, 4]); g.beginPath();
      G.guides.gx.forEach((x) => { g.moveTo(ox + x * vs, oy); g.lineTo(ox + x * vs, oy + ch); }); G.guides.gy.forEach((y) => { g.moveTo(ox, oy + y * vs); g.lineTo(ox + cw, oy + y * vs); }); g.stroke(); g.restore();
    }
    if (S.draw.on) return;
    const sel = selObjs();
    sel.forEach((o) => {
      g.save(); g.strokeStyle = accent; g.lineWidth = 2; if (o.locked || o.type === 'draw') g.setLineDash([6, 4]);
      if (o.type === 'draw') { g.strokeRect(ox + 1, oy + 1, cw - 2, ch - 2); }
      else { const c4 = cornersOf(o).map((p) => toStage(p[0], p[1])); g.beginPath(); g.moveTo(c4[0].x, c4[0].y); for (let i = 1; i < 4; i++) g.lineTo(c4[i].x, c4[i].y); g.closePath(); g.stroke(); }
      g.restore();
    });
    const hs = handlesFor(sel.length === 1 ? sel[0] : null);
    if (hs.length) {
      const o = sel[0], top = toStage(...toWorld(o, 0, -o.h / 2));
      g.save(); g.strokeStyle = accent; g.lineWidth = 1.5; g.beginPath(); g.moveTo(top.x, top.y); g.lineTo(hs[0].x, hs[0].y); g.stroke(); g.restore();
      hs.forEach((h) => {
        g.save(); g.beginPath(); g.arc(h.x, h.y, 14, 0, Math.PI * 2);
        if (h.k === 'rot') { g.fillStyle = accent; g.fill(); g.fillStyle = '#fff'; g.font = '700 17px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('↻', h.x, h.y + 1); }
        else { g.fillStyle = '#fff'; g.fill(); g.strokeStyle = accent; g.lineWidth = 3; g.stroke(); if (h.k === 'e' || h.k === 's' || h.k === 'w') { g.fillStyle = accent; g.font = '700 14px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(h.k === 's' ? '↕' : '↔', h.x, h.y + 1); } }
        g.restore();
      });
    }
    if (S.crop) { const o = primary(); if (o) { g.save(); g.strokeStyle = '#f59e0b'; g.lineWidth = 3; g.setLineDash([8, 5]); const c4 = cornersOf(o).map((p) => toStage(p[0], p[1])); g.beginPath(); g.moveTo(c4[0].x, c4[0].y); for (let i = 1; i < 4; i++) g.lineTo(c4[i].x, c4[i].y); g.closePath(); g.stroke(); g.restore(); } }
  }

  /* ---------- aanraken en muis ---------- */
  const P = new Map(); let G = null, lastTap = null;
  const spt = (e) => { const r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  function hitObj(cx, cy) {
    for (let i = S.objs.length - 1; i >= 0; i--) { const o = S.objs[i]; if (o.hidden || o.locked || o.type === 'draw') continue; if (pointInObj(o, cx, cy, 8 / vs)) return o; }
    return null;
  }
  function hitHandle(pt) {
    const o = primary(); if (!o) return null; const hs = handlesFor(o); let best = null, bd = 26;
    hs.forEach((h) => { const d = Math.hypot(h.x - pt.x, h.y - pt.y); if (d < bd) { bd = d; best = h; } });
    return best;
  }
  const origOf = (o) => ({ x: o.x, y: o.y, w: o.w, h: o.h, rot: o.rot, size: o.size, cz: o.cz, flip: o.flip });
  function scaleObj(o, orig, f) {
    if (o.type === 'text') { o.size = clamp(orig.size * f, 14, 900); layoutText(o); }
    else if (o.type === 'line') o.w = clamp(orig.w * f, 40, 4000);
    else { o.w = clamp(orig.w * f, 24, 4000); o.h = clamp(orig.h * f, 24, 4000); }
  }
  function snapLines(excl) {
    const xs = [0, CW / 2, CW], ys = [0, CH / 2, CH];
    if (S.snap) S.objs.forEach((o) => { if (o.hidden || o.type === 'draw' || excl.indexOf(o.id) >= 0) return; const b = bboxOf(o); xs.push(b.l, (b.l + b.r) / 2, b.r); ys.push(b.t, (b.t + b.b) / 2, b.b); });
    if (S.grid) { const st = CW / 12; for (let x = st; x < CW; x += st) xs.push(x); for (let y = st; y < CH; y += st) ys.push(y); }
    return { xs, ys };
  }
  function onDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault(); try { stage.setPointerCapture(e.pointerId); } catch (er) { /* ok */ }
    const pt = spt(e); P.set(e.pointerId, pt);
    if (P.size === 2) { startPinch(); return; }
    if (P.size > 2) return;
    G = null; if (S.draw.on) { startStroke(pt); return; }
    const hd = hitHandle(pt); if (hd) { startHandle(hd, pt); return; }
    const c = toC(pt);
    if (S.crop) {
      const o = primary();
      if (o && o.type === 'photo' && pointInObj(o, c[0], c[1], 0)) { G = { mode: 'crop', o, last: toLocal(o, c[0], c[1]), moved: true }; return; }
      exitCrop();
    }
    const o = hitObj(c[0], c[1]), extra = S.multi || e.shiftKey || e.metaKey || e.ctrlKey;
    if (o) {
      let toggle = false;
      if (extra) { if (S.sel.indexOf(o.id) >= 0) toggle = true; else S.sel.push(o.id); } else if (S.sel.indexOf(o.id) < 0) S.sel = [o.id];
      G = { mode: 'move', p0: pt, c0: c, moved: false, hitId: o.id, toggle, items: S.sel.map(byId).filter((x) => x && !x.locked).map((ob) => ({ o: ob, x: ob.x, y: ob.y })), guides: null };
      refresh(true); paint(false);
    } else G = { mode: 'bg', p0: pt, moved: false };
  }
  function startHandle(h, pt) {
    const o = primary(), c = toStage(o.x, o.y);
    G = { mode: 'handle', k: h.k, o, orig: origOf(o), d0: Math.max(10, Math.hypot(pt.x - c.x, pt.y - c.y)), a0: Math.atan2(pt.y - c.y, pt.x - c.x), c, moved: false, guides: null, rotSnap: false };
    if (o.type === 'line' && (h.k === 'e' || h.k === 'w')) { const w = toWorld(o, h.k === 'e' ? -o.w / 2 : o.w / 2, 0); G.fixed = w; }
  }
  function startPinch() {
    if (S.draw.on) return;
    const ps = [...P.values()], a = ps[0], b = ps[1], mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    let o = primary();
    if (!o || o.locked || o.type === 'draw') { const m = toC(mid); o = hitObj(m[0], m[1]); if (o) { S.sel = [o.id]; refresh(true); } }
    if (!o) { G = { mode: 'idle' }; return; }
    G = { mode: 'pinch', o, orig: origOf(o), d0: Math.max(12, Math.hypot(a.x - b.x, a.y - b.y)), a0: Math.atan2(b.y - a.y, b.x - a.x), m0: toC(mid), crop: S.crop && o.type === 'photo' };
  }
  function startStroke(pt) {
    let L = byId(S.draw.layer);
    if (!L || L.type !== 'draw' || L.locked) { L = null; for (let i = S.objs.length - 1; i >= 0; i--) if (S.objs[i].type === 'draw' && !S.objs[i].locked) { L = S.objs[i]; break; } }
    if (!L) { L = newDrawLayer(); if (!L) return; }
    if (L.hidden) { L.hidden = false; } if (L.strokes.length >= 300) { note('Deze tekenlaag zit vol: maak een nieuwe laag.'); return; }
    S.draw.layer = L.id; const c = toC(pt), d = S.draw, size = d.tool === 'eraser' ? d.size * 1.6 : d.tool === 'marker' ? d.size * 1.8 : d.size;
    const s = { tool: d.tool, color: d.color, size, pts: [c[0], c[1]] }; L.strokes.push(s); G = { mode: 'stroke', L, s, moved: true }; bumpLayer(L.id); paint();
  }
  function onMove(e) {
    if (!P.has(e.pointerId)) return; const pt = spt(e); P.set(e.pointerId, pt); if (!G) return;
    const c = toC(pt);
    if (G.mode === 'move') {
      if (!G.moved) { if (Math.hypot(pt.x - G.p0.x, pt.y - G.p0.y) < 5) return; G.moved = true; }
      const dx = c[0] - G.c0[0], dy = c[1] - G.c0[1]; G.items.forEach((it) => { it.o.x = it.x + dx; it.o.y = it.y + dy; }); G.guides = null;
      if ((S.snap || S.grid) && G.items.length) {
        const r = computeSnap(unionBox(G.items.map((it) => bboxOf(it.o))), snapLines(G.items.map((it) => it.o.id)), 9 / vs);
        if (r.dx || r.dy) G.items.forEach((it) => { it.o.x += r.dx; it.o.y += r.dy; });
        if (r.gx.length || r.gy.length) G.guides = { gx: r.gx, gy: r.gy };
      }
      paint();
    } else if (G.mode === 'handle') {
      G.moved = true; const o = G.o, k = G.k, og = G.orig;
      if (k === 'rot') {
        let rot = og.rot + (Math.atan2(pt.y - G.c.y, pt.x - G.c.x) - G.a0); const q = Math.PI / 12, n = Math.round(rot / q);
        if (Math.abs(rot - n * q) < .05) { rot = n * q; G.rotSnap = true; } else G.rotSnap = false; o.rot = rot;
      } else if (k === 'e' && o.type === 'line' || k === 'w' && o.type === 'line') {
        const f = G.fixed, dx = c[0] - f[0], dy = c[1] - f[1], len = Math.max(40, Math.hypot(dx, dy)); o.w = len; o.x = (c[0] + f[0]) / 2; o.y = (c[1] + f[1]) / 2;
        o.rot = k === 'e' ? Math.atan2(dy, dx) : Math.atan2(-dy, -dx);
      } else if (k === 'e' || k === 's') {
        const l = toLocal(og, c[0], c[1]);
        if (k === 'e') { const nw = clamp(l[0] + og.w / 2, 24, 4000), p = toWorld(og, (nw - og.w) / 2, 0); o.w = nw; o.x = p[0]; o.y = p[1]; }
        else { const nh = clamp(l[1] + og.h / 2, 24, 4000), p = toWorld(og, 0, (nh - og.h) / 2); o.h = nh; o.x = p[0]; o.y = p[1]; }
      } else { scaleObj(o, og, Math.max(.05, Math.hypot(pt.x - G.c.x, pt.y - G.c.y) / G.d0)); }
      paint();
    } else if (G.mode === 'pinch') {
      const ps = [...P.values()]; if (ps.length < 2) return; const a = ps[0], b = ps[1], mid = toC({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      const f = Math.hypot(a.x - b.x, a.y - b.y) / G.d0, o = G.o, og = G.orig;
      if (G.crop) { o.cz = clamp(og.cz * f, 1, 8); }
      else { scaleObj(o, og, f); o.rot = og.rot + (Math.atan2(b.y - a.y, b.x - a.x) - G.a0); o.x = og.x + (mid[0] - G.m0[0]); o.y = og.y + (mid[1] - G.m0[1]); }
      paint();
    } else if (G.mode === 'crop') {
      const o = G.o, l = toLocal(o, c[0], c[1]), dx = l[0] - G.last[0], dy = l[1] - G.last[1]; G.last = l;
      const bm = bitmaps.get(o.img); if (!bm) return; const s = Math.max(o.w / bm.src.width, o.h / bm.src.height) * (o.cz || 1), sx = (bm.src.width * s - o.w) / 2, sy = (bm.src.height * s - o.h) / 2;
      if (sx > .5) o.cx = clamp((o.cx || 0) + dx / sx, -1, 1); if (sy > .5) o.cy = clamp((o.cy || 0) + dy / sy, -1, 1); paint();
    } else if (G.mode === 'stroke') {
      const p = G.s.pts, lx = p[p.length - 2], ly = p[p.length - 1];
      if (Math.hypot(c[0] - lx, c[1] - ly) > 1.2 / Math.max(.3, vs) * .5) { p.push(c[0], c[1]); bumpLayer(G.L.id); paint(); }
    } else if (G.mode === 'bg') { if (Math.hypot(pt.x - G.p0.x, pt.y - G.p0.y) > 6) G.moved = true; }
  }
  function onUp(e) {
    if (!P.has(e.pointerId)) return; P.delete(e.pointerId); const g = G;
    if (g && g.mode === 'pinch') { if (P.size < 2) { commit(); G = { mode: 'idle' }; refresh(); paint(); } return; }
    if (P.size > 0) return; G = null; if (!g) return;
    if (g.mode === 'move') {
      if (g.moved) { commit(); refresh(); }
      else {
        if (g.toggle) S.sel = S.sel.filter((id) => id !== g.hitId);
        const now = performance.now();
        if (lastTap && now - lastTap.t < 380 && lastTap.id === g.hitId && Math.hypot(lastTap.x - g.p0.x, lastTap.y - g.p0.y) < 28 && !g.toggle) { lastTap = null; openProps(true); }
        else { lastTap = { t: now, id: g.hitId, x: g.p0.x, y: g.p0.y }; refresh(); }
      }
    } else if (g.mode === 'bg') { if (!g.moved && !S.multi && S.sel.length) { S.sel = []; refresh(); } }
    else if (g.mode === 'handle' || g.mode === 'crop') { if (g.o.type === 'text') layoutText(g.o); commit(); refresh(); }
    else if (g.mode === 'stroke') { g.s.pts = g.s.pts.map((v) => Math.round(v * 10) / 10); bumpLayer(g.L.id); commit(); refresh(); }
    paint();
  }
  function onWheel(e) {
    if (S.draw.on) return; const o = primary(); if (!o || o.locked || o.type === 'draw') return; e.preventDefault();
    const f = Math.exp(-e.deltaY * .0015);
    if (S.crop && o.type === 'photo') o.cz = clamp((o.cz || 1) * f, 1, 8);
    else if (e.shiftKey) o.rot += e.deltaY * .003;
    else scaleObj(o, origOf(o), f);
    paint(); commitSoon();
  }
  let wheelT = null; function commitSoon() { if (wheelT) clearTimeout(wheelT); wheelT = later(() => { commit(); refresh(); }, 450); }
  function onKey(e) {
    if (!alive || !view.isConnected) return; const t = e.target, tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const mod = e.metaKey || e.ctrlKey, k = e.key;
    if (mod && (k === 'z' || k === 'Z')) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    else if (mod && (k === 'y' || k === 'Y')) { e.preventDefault(); redo(); }
    else if (mod && (k === 'd' || k === 'D')) { e.preventDefault(); dupSel(); }
    else if (mod && (k === 'a' || k === 'A')) { e.preventDefault(); S.sel = S.objs.filter((o) => !o.locked && !o.hidden).map((o) => o.id); refresh(); paint(false); }
    else if (k === 'Delete' || k === 'Backspace') { if (S.sel.length) { e.preventDefault(); delSel(); } }
    else if (k === 'Escape') { if (S.draw.on) endDraw(); else if (S.crop) exitCrop(); else { S.sel = []; refresh(); paint(false); } }
    else if (k.indexOf('Arrow') === 0 && S.sel.length) {
      e.preventDefault(); const st = e.shiftKey ? 20 : 3, dx = k === 'ArrowLeft' ? -st : k === 'ArrowRight' ? st : 0, dy = k === 'ArrowUp' ? -st : k === 'ArrowDown' ? st : 0;
      eachSel((o) => { if (!o.locked && o.type !== 'draw') { o.x += dx; o.y += dy; } }); paint(); commitSoon();
    }
  }

  /* ---------- bijsnijden & tekenen ---------- */
  function enterCrop() { const o = primary(); if (!o || o.type !== 'photo') return; S.crop = true; S.draw.on = false; note('Sleep de foto in zijn vorm. Knijp of gebruik het wiel om te zoomen.', 6000); refresh(); paint(false); }
  function exitCrop() { if (!S.crop) return; S.crop = false; commit(); refresh(); paint(false); }
  function startDraw(layerId) {
    S.crop = false; S.draw.on = true; S.tab = 'draw'; const L = layerId && byId(layerId); if (L && L.type === 'draw') S.draw.layer = L.id;
    S.multi = false; sizeStage(); refresh(); paint(false); note('Teken met je vinger of muis.', 3000);
  }
  function endDraw() { S.draw.on = false; S.tab = null; sizeStage(); commit(); refresh(); paint(false); }

  /* ---------- UI: bovenbalk, actiebalk, tabs ---------- */
  let btnUndo, btnRedo, btnMulti, btnGrid, btnSnap;
  function tb(label, title, fn) { return el('button', { class: 'cf-btn', title, 'aria-label': title, onclick: fn }, label); }
  function updateTop() {
    if (!btnUndo) return; btnUndo.disabled = !hist.canUndo(); btnRedo.disabled = !hist.canRedo();
    btnMulti.classList.toggle('on', S.multi); btnGrid.classList.toggle('on', S.grid); btnSnap.classList.toggle('on', S.snap);
  }
  function refresh(soft) { // soft: alleen de balk (tijdens het slepen houden we het paneel met rust)
    renderBar(); updateTop(); renderTabs(); if (!soft || S.tab === 'props' || S.tab === 'layers') renderPanel();
  }
  function openTab(k, sec) {
    if (S.draw.on && k !== 'draw') { S.draw.on = false; commit(); }
    if (S.crop) S.crop = false; S.tab = k; sizeStage(); refresh();
    if (sec) { const t = panel.querySelector('[data-sec="' + sec + '"]'); if (t) panel.scrollTop = Math.max(0, t.offsetTop - panel.offsetTop - 4); }
  }
  function closePanel() { if (S.draw.on) { endDraw(); return; } S.tab = null; sizeStage(); refresh(); }
  function openProps(focusText) {
    if (!primary()) return; openTab('props');
    if (focusText) { const t = panel.querySelector('textarea'); if (t) { try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); } } }
  }
  function renderTabs() {
    tabsEl.innerHTML = '';
    TABS.forEach(([k, l]) => tabsEl.appendChild(el('button', { class: 'cf-tab' + (S.tab === k ? ' on' : ''), onclick: () => { if (S.tab === k) closePanel(); else openTab(k); } }, l)));
  }
  function renderBar() {
    bar.innerHTML = ''; const add = (label, fn, cls, title) => bar.appendChild(el('button', { class: 'cf-btn' + (cls ? ' ' + cls : ''), title: title || label, 'aria-label': title || label, onclick: fn }, label));
    if (S.draw.on) {
      [['pen', '✏️ Pen'], ['marker', '🖍 Marker'], ['eraser', '🧽 Gum']].forEach(([k, l]) => add(l, () => { S.draw.tool = k; refresh(); }, S.draw.tool === k ? 'on' : ''));
      add('↶', undo, '', 'Ongedaan maken'); add('Klaar ✓', endDraw, 'pri'); return;
    }
    if (S.crop) { add('Klaar ✓', exitCrop, 'pri'); add('Reset', () => { eachSel((o) => { o.cz = 1; o.cx = 0; o.cy = 0; }, 'photo'); paint(); commit(); }); add('🔍+', () => { eachSel((o) => { o.cz = clamp((o.cz || 1) * 1.2, 1, 8); }, 'photo'); paint(); commit(); }); add('🔍−', () => { eachSel((o) => { o.cz = clamp((o.cz || 1) / 1.2, 1, 8); }, 'photo'); paint(); commit(); }); return; }
    const sel = selObjs();
    if (!sel.length) {
      add('📷 Foto’s', pickPhotos, 'pri'); add('🔷 Vorm', () => openTab('new', 'shapes')); add('🔤 Tekst', () => addText()); add('😀 Sticker', () => openTab('new', 'stickers'));
      add('➡️ Pijl', () => addLine('end')); add('✏️ Tekenen', () => startDraw()); add('🎨 Achtergrond', () => openTab('page', 'bg')); add('✨ Auto-indelen', () => arrangePhotos(), '', 'Foto’s automatisch indelen');
      return;
    }
    if (sel.length === 1) {
      const o = sel[0];
      add('⚙️ Aanpassen', () => openProps(), 'pri');
      if (o.type === 'photo') add('✂️ Bijsnijden', enterCrop);
      if (o.type === 'text') add('✎ Tekst', () => openProps(true));
      if (o.type === 'draw') add('✏️ Tekenen', () => startDraw(o.id));
      add('⧉ Kopie', dupSel); if (o.type !== 'draw') add('↔ Spiegel', flipSel);
      add('⤒ Voorop', () => reorder('front')); add('▲', () => reorder('up'), '', 'Een laag omhoog'); add('▼', () => reorder('down'), '', 'Een laag omlaag'); add('⤓ Achteraan', () => reorder('back'));
      add(o.locked ? '🔒 Open' : '🔓 Slot', () => lockSel(), o.locked ? 'on' : '', o.locked ? 'Ontgrendelen' : 'Vergrendelen');
      add('🗑 Weg', delSel, 'warn', 'Verwijderen'); add('✕', () => { S.sel = []; refresh(); paint(false); }, '', 'Niets kiezen');
      return;
    }
    add(sel.length + ' gekozen', () => openTab('tools'), 'pri', 'Uitlijnen en verdelen'); add('⇤ Links', () => alignSel('left')); add('⇔ Midden', () => alignSel('center')); add('⇥ Rechts', () => alignSel('right'));
    add('⤒ Boven', () => alignSel('top')); add('⇕ Midden', () => alignSel('middle')); add('⤓ Onder', () => alignSel('bottom'));
    add('↔ Verdeel', () => distSel('x')); add('↕ Verdeel', () => distSel('y')); add('⧉ Kopie', dupSel); add('🗑 Weg', delSel, 'warn'); add('✕', () => { S.sel = []; refresh(); paint(false); }, '', 'Niets kiezen');
  }

  /* ---------- UI: invoerhulp ---------- */
  function slider(label, min, max, step, get, set, unit) {
    const f = (v) => (unit === '°' ? Math.round(v) + '°' : unit === '%' ? Math.round(v) + '%' : String(Math.round(v * 100) / 100));
    const val = el('b', { class: 'cf-val' }, f(get())), inp = el('input', { type: 'range', min, max, step, 'aria-label': label }); inp.value = get();
    inp.oninput = () => { const v = +inp.value; set(v); val.textContent = f(v); paint(); }; inp.onchange = () => { commit(); };
    return el('div', { class: 'cf-row' }, el('span', {}, label), inp, val);
  }
  function colorPick(label, get, set) {
    const cur = String(get() || '').toLowerCase(), box = el('div', { class: 'cf-chips' });
    COLORS.forEach((cc) => box.appendChild(el('button', { class: 'cf-sw' + (cur === cc ? ' on' : ''), style: 'background:' + cc, 'aria-label': 'Kleur ' + cc, onclick: () => { set(cc); paint(); commit(); renderPanel(); } })));
    const ci = el('input', { type: 'color', class: 'cf-colorin', 'aria-label': 'Eigen kleur' }); ci.value = hex6(get()); ci.oninput = () => { set(ci.value); paint(); }; ci.onchange = () => { commit(); renderPanel(); };
    box.appendChild(ci); return el('div', {}, el('div', { class: 'cf-h' }, label), box);
  }
  const chipRow = (items, cur, pick) => el('div', { class: 'cf-chips' }, items.map((it) => el('button', { class: 'cf-chip' + (cur === it[0] ? ' on' : ''), onclick: () => pick(it[0]) }, it[1])));
  const toggleChip = (label, on, fn) => el('button', { class: 'cf-chip' + (on ? ' on' : ''), onclick: fn }, (on ? '✓ ' : '') + label);
  const btnW = (label, fn, cls) => el('button', { class: 'cf-btn cf-wide' + (cls ? ' ' + cls : ''), onclick: fn }, label);
  const iconCache = new Map();
  function icon(kind, key) {
    const ck = kind + key; if (iconCache.has(ck)) return iconCache.get(ck);
    const c = mkCanvas(96, 96), g = c.getContext('2d'); g.translate(48, 48);
    if (kind === 'shape') { shapePath(g, key, 74, 74, key === 'round' ? 20 : 0); g.fillStyle = '#8b8fe0'; g.fill(); }
    else { const a = ARTS.filter((x) => x[0] === key)[0], asp = a[3], w = asp >= 1 ? 84 : 84 * asp, h = asp >= 1 ? 84 / asp : 84; drawArt(g, key, a[2], w, h); }
    const u = c.toDataURL('image/png'); freeCanvas(c); iconCache.set(ck, u); return u;
  }

  /* ---------- paneel: nieuw ---------- */
  function pNew(p) {
    p.appendChild(el('div', { class: 'cf-h', 'data-sec': 'photos' }, '📷 Foto’s'));
    p.appendChild(btnW('Foto’s kiezen (meerdere tegelijk)', pickPhotos, 'pri'));
    p.appendChild(el('div', { class: 'cf-hint' }, 'Je foto’s blijven op je eigen toestel. De eerste foto’s worden netjes ingedeeld, daarna waaieren ze uit.'));
    p.appendChild(el('div', { class: 'cf-h', 'data-sec': 'shapes' }, '🔷 Vormen'));
    p.appendChild(el('div', { class: 'cf-grid' }, MASKS.map((m) => el('button', { class: 'cf-gi', title: m[1], 'aria-label': m[1], onclick: () => addShape(m[0]) }, el('img', { src: icon('shape', m[0]), alt: m[1] })))));
    p.appendChild(el('div', { class: 'cf-h', 'data-sec': 'text' }, '🔤 Tekst'));
    p.appendChild(el('div', { class: 'cf-chips' },
      el('button', { class: 'cf-chip', onclick: () => addText() }, 'Tekst'),
      el('button', { class: 'cf-chip', onclick: () => addText({ text: 'TITEL', font: 'impact', size: 190, col: '#ffffff', stroke: '#111827', sw: 10, bold: false }) }, 'Titel'),
      el('button', { class: 'cf-chip', onclick: () => addText({ text: 'Leuke dag', font: 'hand', size: 150, col: '#111827', bold: false }) }, 'Handgeschreven'),
      el('button', { class: 'cf-chip', onclick: () => addText({ text: 'Zomer 2026', font: 'round', size: 110, col: '#ffffff', bar: true, barCol: '#ec4899', rad: .5 }) }, 'Label'),
      el('button', { class: 'cf-chip', onclick: () => addText({ text: 'Mooie bocht', font: 'serif', size: 120, curve: 60, col: '#111827', bold: false, it: true }) }, 'Gebogen')));
    p.appendChild(el('div', { class: 'cf-h', 'data-sec': 'stickers' }, '😀 Emoji-stickers'));
    p.appendChild(el('div', { class: 'cf-grid' }, EMOJI.map((e) => el('button', { class: 'cf-gi', onclick: () => addEmoji(e), 'aria-label': 'Sticker ' + e }, e))));
    p.appendChild(el('div', { class: 'cf-h' }, '🎨 Getekende stickers'));
    p.appendChild(el('div', { class: 'cf-grid' }, ARTS.map((a) => el('button', { class: 'cf-gi', title: a[1], 'aria-label': a[1], onclick: () => addArt(a[0]) }, el('img', { src: icon('art', a[0]), alt: a[1] })))));
    p.appendChild(el('div', { class: 'cf-h' }, '➖ Lijnen en pijlen'));
    p.appendChild(el('div', { class: 'cf-chips' }, el('button', { class: 'cf-chip', onclick: () => addLine('none') }, 'Lijn'), el('button', { class: 'cf-chip', onclick: () => addLine('end') }, 'Pijl'), el('button', { class: 'cf-chip', onclick: () => addLine('both') }, 'Dubbele pijl'), el('button', { class: 'cf-chip', onclick: () => addLine('none', true) }, 'Stippellijn')));
    p.appendChild(el('div', { class: 'cf-h' }, '✏️ Tekenen'));
    p.appendChild(btnW('Start tekenen (pen, marker, gum)', () => startDraw()));
  }

  /* ---------- paneel: aanpassen ---------- */
  function pProps(p) {
    const list = selObjs();
    if (!list.length) {
      p.appendChild(el('div', { class: 'cf-hint' }, 'Tik op iets in de collage om het aan te passen. Dubbel-tikken opent dit paneel.'));
      p.appendChild(btnW('🖼 Pagina en achtergrond', () => openTab('page'))); return;
    }
    const o = primary();
    if (list.length > 1) p.appendChild(el('div', { class: 'cf-hint' }, list.length + ' lagen gekozen: wijzigingen gelden voor allemaal.'));
    if (o.type === 'photo') propsPhoto(p, o);
    else if (o.type === 'shape') {
      p.appendChild(el('div', { class: 'cf-h' }, 'Vorm'));
      p.appendChild(el('div', { class: 'cf-grid' }, MASKS.map((m) => el('button', { class: 'cf-gi' + (o.shape === m[0] ? ' on' : ''), title: m[1], onclick: () => { eachSel((x) => { x.shape = m[0]; if (m[0] === 'round' && !x.rad) x.rad = .3; }, 'shape'); paint(); commit(); renderPanel(); } }, el('img', { src: icon('shape', m[0]), alt: m[1] })))));
      p.appendChild(colorPick('Vulkleur', () => o.fill, (c) => { eachSel((x) => { x.fill = c; }, 'shape'); S.lastColor = c; saveSettings(); }));
    } else if (o.type === 'text') propsText(p, o);
    else if (o.type === 'sticker' && o.art) p.appendChild(colorPick('Kleur van de sticker', () => o.col, (c) => eachSel((x) => { if (x.art) x.col = c; }, 'sticker')));
    else if (o.type === 'line') {
      p.appendChild(el('div', { class: 'cf-h' }, 'Lijn'));
      p.appendChild(chipRow([['none', 'Geen punt'], ['end', 'Pijl'], ['both', 'Dubbele pijl']], o.arrow, (k) => { eachSel((x) => { x.arrow = k; }, 'line'); paint(); commit(); renderPanel(); }));
      p.appendChild(el('div', { class: 'cf-chips', style: 'margin-top:6px' }, toggleChip('Stippellijn', o.dash, () => { eachSel((x) => { x.dash = !x.dash; }, 'line'); paint(); commit(); renderPanel(); })));
      p.appendChild(slider('Dikte', 2, 60, 1, () => o.sw, (v) => eachSel((x) => { x.sw = v; x.h = Math.max(44, v * 2 + 24); }, 'line')));
      p.appendChild(colorPick('Kleur', () => o.col, (c) => eachSel((x) => { x.col = c; }, 'line')));
    } else if (o.type === 'draw') {
      p.appendChild(el('div', { class: 'cf-h' }, 'Tekenlaag'));
      p.appendChild(btnW('✏️ Tekenen op deze laag', () => startDraw(o.id), 'pri'));
      p.appendChild(btnW('Alles op deze laag wissen', () => { o.strokes = []; bumpLayer(o.id); paint(); commit(); note('Laag gewist. Met ↶ haal je het terug.'); }));
    }
    commonProps(p, o);
    p.appendChild(el('div', { class: 'cf-h' }, 'Acties'));
    p.appendChild(el('div', { class: 'cf-chips' },
      el('button', { class: 'cf-chip', onclick: () => reorder('front') }, '⤒ Voorop'), el('button', { class: 'cf-chip', onclick: () => reorder('up') }, '▲ Omhoog'), el('button', { class: 'cf-chip', onclick: () => reorder('down') }, '▼ Omlaag'), el('button', { class: 'cf-chip', onclick: () => reorder('back') }, '⤓ Achteraan'),
      el('button', { class: 'cf-chip', onclick: dupSel }, '⧉ Dupliceren'), el('button', { class: 'cf-chip', onclick: () => lockSel() }, o.locked ? '🔒 Ontgrendel' : '🔓 Vergrendel'), el('button', { class: 'cf-chip', onclick: delSel }, '🗑 Verwijderen')));
  }
  function commonProps(p, o) {
    p.appendChild(el('div', { class: 'cf-h' }, 'Uiterlijk'));
    p.appendChild(slider('Doorzichtig', 5, 100, 1, () => o.op * 100, (v) => eachSel((x) => { x.op = v / 100; }), '%'));
    if (o.type === 'draw') return;
    p.appendChild(slider('Schaduw', 0, 100, 1, () => o.shadow, (v) => eachSel((x) => { x.shadow = v; }), '%'));
    if (o.type === 'photo' || o.type === 'shape') {
      p.appendChild(slider('Randdikte', 0, 60, 1, () => o.sw, (v) => eachSel((x) => { x.sw = v; }, o.type)));
      if (o.sw > 0) p.appendChild(colorPick('Randkleur', () => o.stroke, (c) => eachSel((x) => { x.stroke = c; }, o.type)));
      if (o.mask === 'rect' || o.mask === 'round' || o.shape === 'rect' || o.shape === 'round') p.appendChild(slider('Ronde hoeken', 0, 100, 1, () => (o.rad || 0) * 100, (v) => eachSel((x) => { x.rad = v / 100; }, o.type), '%'));
    }
    if (o.type === 'text' && o.bar) p.appendChild(slider('Ronde balk', 0, 100, 1, () => (o.rad || 0) * 100, (v) => eachSel((x) => { x.rad = v / 100; }, 'text'), '%'));
    if (o.type !== 'text' && o.type !== 'line') p.appendChild(slider('Grootte', 5, 300, 1, () => o.w / CW * 100, (v) => eachSel((x) => { if (x.type === 'draw' || x.type === 'line') return; const f = (v / 100 * CW) / x.w; x.w *= f; x.h *= f; }), '%'));
    p.appendChild(slider('Draaien', -180, 180, 1, () => ((o.rot * 180 / Math.PI + 540) % 360) - 180, (v) => eachSel((x) => { x.rot = v * Math.PI / 180; }), '°'));
    p.appendChild(el('div', { class: 'cf-chips', style: 'margin-top:4px' }, el('button', { class: 'cf-chip', onclick: flipSel }, '↔ Spiegelen'), el('button', { class: 'cf-chip', onclick: () => { eachSel((x) => { x.rot = 0; }); paint(); commit(); renderPanel(); } }, 'Recht zetten')));
  }
  function propsPhoto(p, o) {
    p.appendChild(el('div', { class: 'cf-h' }, 'Foto'));
    p.appendChild(el('div', { class: 'cf-chips' }, el('button', { class: 'cf-chip', onclick: enterCrop }, '✂️ Bijsnijden (verschuiven en zoomen)'), el('button', { class: 'cf-chip', onclick: () => replacePhoto(o) }, '🔄 Andere foto')));
    p.appendChild(slider('Zoom in vorm', 1, 6, .01, () => o.cz || 1, (v) => eachSel((x) => { x.cz = v; }, 'photo')));
    p.appendChild(el('div', { class: 'cf-h' }, 'Vorm (masker)'));
    p.appendChild(el('div', { class: 'cf-grid' }, MASKS.map((m) => el('button', { class: 'cf-gi' + (o.mask === m[0] ? ' on' : ''), title: m[1], 'aria-label': m[1], onclick: () => { eachSel((x) => { x.mask = m[0]; if (m[0] === 'round' && !x.rad) x.rad = .3; }, 'photo'); paint(); commit(); renderPanel(); } }, el('img', { src: icon('shape', m[0]), alt: m[1] })))));
    p.appendChild(el('div', { class: 'cf-h' }, 'Kleurfilter'));
    p.appendChild(chipRow(FILTERS, o.filter || 'none', (k) => { eachSel((x) => { x.filter = k; }, 'photo'); paint(); commit(); renderPanel(); }));
    if ((o.filter || 'none') !== 'none') p.appendChild(slider('Sterkte filter', 0, 100, 1, () => o.fa == null ? 100 : o.fa, (v) => eachSel((x) => { x.fa = v; }, 'photo'), '%'));
    if (o.filter === 'duo') { p.appendChild(colorPick('Duotone: schaduwen', () => o.da, (c) => eachSel((x) => { x.da = c; }, 'photo'))); p.appendChild(colorPick('Duotone: lichte delen', () => o.db, (c) => eachSel((x) => { x.db = c; }, 'photo'))); }
    p.appendChild(slider('Helderheid', -100, 100, 1, () => o.br || 0, (v) => eachSel((x) => { x.br = v; }, 'photo')));
    p.appendChild(slider('Contrast', -100, 100, 1, () => o.ct || 0, (v) => eachSel((x) => { x.ct = v; }, 'photo')));
    p.appendChild(slider('Verzadiging', -100, 100, 1, () => o.sa || 0, (v) => eachSel((x) => { x.sa = v; }, 'photo')));
    p.appendChild(el('div', { class: 'cf-chips', style: 'margin-top:4px' }, el('button', { class: 'cf-chip', onclick: () => { eachSel((x) => { x.filter = 'none'; x.br = 0; x.ct = 0; x.sa = 0; x.fa = 100; }, 'photo'); paint(); commit(); renderPanel(); } }, 'Filter en kleur resetten')));
  }
  function propsText(p, o) {
    p.appendChild(el('div', { class: 'cf-h' }, 'Tekst'));
    const ta = el('textarea', { class: 'cf-ta', 'aria-label': 'Tekst', rows: 2 }); ta.value = o.text;
    ta.oninput = () => { o.text = ta.value || ' '; layoutText(o); paint(); }; ta.onchange = () => { commit(); };
    p.appendChild(ta);
    p.appendChild(el('div', { class: 'cf-h' }, 'Lettertype'));
    p.appendChild(el('div', { class: 'cf-chips' }, FONTS.map((f) => el('button', { class: 'cf-chip' + (o.font === f[0] ? ' on' : ''), style: 'font-family:' + f[2], onclick: () => { eachSel((x) => { x.font = f[0]; layoutText(x); }, 'text'); S.lastFont = f[0]; saveSettings(); paint(); commit(); renderPanel(); } }, f[1]))));
    p.appendChild(slider('Grootte', 20, 500, 1, () => o.size, (v) => eachSel((x) => { x.size = v; layoutText(x); }, 'text')));
    p.appendChild(el('div', { class: 'cf-chips', style: 'margin:6px 0' },
      ['left', 'center', 'right'].map((a) => el('button', { class: 'cf-chip' + (o.align === a ? ' on' : ''), onclick: () => { eachSel((x) => { x.align = a; }, 'text'); paint(); commit(); renderPanel(); } }, a === 'left' ? '⇤ Links' : a === 'right' ? 'Rechts ⇥' : '⇔ Midden')),
      toggleChip('Dik', o.bold, () => { eachSel((x) => { x.bold = !x.bold; layoutText(x); }, 'text'); paint(); commit(); renderPanel(); }),
      toggleChip('Schuin', o.it, () => { eachSel((x) => { x.it = !x.it; layoutText(x); }, 'text'); paint(); commit(); renderPanel(); })));
    p.appendChild(colorPick('Tekstkleur', () => o.col, (c) => eachSel((x) => { x.col = c; }, 'text')));
    p.appendChild(slider('Omlijning', 0, 40, 1, () => o.sw, (v) => eachSel((x) => { x.sw = v; layoutText(x); }, 'text')));
    if (o.sw > 0) p.appendChild(colorPick('Kleur omlijning', () => o.stroke, (c) => eachSel((x) => { x.stroke = c; }, 'text')));
    p.appendChild(slider('Gebogen', -100, 100, 1, () => o.curve || 0, (v) => eachSel((x) => { x.curve = Math.abs(v) < 4 ? 0 : v; layoutText(x); }, 'text')));
    p.appendChild(el('div', { class: 'cf-chips', style: 'margin-top:6px' }, toggleChip('Achtergrondbalk', o.bar, () => { eachSel((x) => { x.bar = !x.bar; layoutText(x); }, 'text'); paint(); commit(); renderPanel(); })));
    if (o.bar) p.appendChild(colorPick('Kleur balk', () => o.barCol, (c) => eachSel((x) => { x.barCol = c; }, 'text')));
  }

  /* ---------- paneel: lagen ---------- */
  function thumb(o) {
    const c = mkCanvas(84, 84); c.className = 'cf-th'; const g = c.getContext('2d');
    if (o.type === 'draw') { g.font = '40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('✏️', 42, 44); return c; }
    const k = 70 / Math.max(o.w, o.h); const t = Object.assign({}, o, { x: 42 / k, y: 42 / k, rot: 0, shadow: 0, flip: false, op: 1 });
    try { drawObj(g, t, k, false); } catch (e) { /* ok */ } return c;
  }
  function moveOne(id, dir) {
    const i = S.objs.findIndex((o) => o.id === id), j = i + (dir === 'up' ? 1 : -1); if (i < 0 || j < 0 || j >= S.objs.length) return;
    const t = S.objs[i]; S.objs[i] = S.objs[j]; S.objs[j] = t; paint(); commit(); renderPanel();
  }
  function dragLayer(e, from, rows, disp) {
    e.preventDefault(); const h = e.currentTarget; try { h.setPointerCapture(e.pointerId); } catch (er) { /* ok */ } let to = from; rows[from].style.opacity = '.5';
    const mv = (ev) => { let idx = rows.length - 1; for (let i = 0; i < rows.length; i++) { const r = rows[i].getBoundingClientRect(); if (ev.clientY < r.top + r.height / 2) { idx = i; break; } } to = idx; rows.forEach((r, i) => r.classList.toggle('over', i === to && to !== from)); };
    const up = () => {
      h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up);
      if (to !== from) { const d = disp.slice(), m = d.splice(from, 1)[0]; d.splice(to, 0, m); S.objs = d.reverse(); paint(); commit(); } renderPanel();
    };
    h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
  }
  function pLayers(p) {
    p.appendChild(el('div', { class: 'cf-hint' }, 'Bovenaan ligt voorop. Sleep aan ☰ om de volgorde te veranderen, 👁 verbergt een laag.'));
    const disp = S.objs.slice().reverse(), rows = [];
    if (!disp.length) p.appendChild(el('div', { class: 'cf-hint' }, 'Nog niets in de collage. Voeg foto’s, vormen of tekst toe via “Nieuw”.'));
    disp.forEach((o, di) => {
      const hd = el('button', { class: 'hd', 'aria-label': 'Slepen om volgorde te wijzigen' }, '☰');
      const row = el('div', { class: 'cf-lay' + (S.sel.indexOf(o.id) >= 0 ? ' on' : '') + (o.hidden ? ' off' : '') },
        el('button', { 'aria-label': o.hidden ? 'Tonen' : 'Verbergen', onclick: () => { o.hidden = !o.hidden; paint(); commit(); renderPanel(); } }, o.hidden ? '🚫' : '👁'),
        thumb(o),
        el('div', { class: 'nm', onclick: () => { if (S.multi) { const i = S.sel.indexOf(o.id); if (i >= 0) S.sel.splice(i, 1); else S.sel.push(o.id); } else S.sel = [o.id]; refresh(); paint(false); } }, objName(o)),
        el('button', { 'aria-label': o.locked ? 'Ontgrendelen' : 'Vergrendelen', onclick: () => { o.locked = !o.locked; paint(false); commit(); renderPanel(); } }, o.locked ? '🔒' : '🔓'),
        el('button', { 'aria-label': 'Een laag omhoog', onclick: () => moveOne(o.id, 'up') }, '▲'), el('button', { 'aria-label': 'Een laag omlaag', onclick: () => moveOne(o.id, 'down') }, '▼'), hd);
      hd.onpointerdown = (e) => dragLayer(e, di, rows, disp); rows.push(row); p.appendChild(row);
    });
  }

  /* ---------- paneel: pagina ---------- */
  function pPage(p) {
    p.appendChild(el('div', { class: 'cf-h' }, 'Formaat'));
    p.appendChild(chipRow(FORMATS.map((f) => [f[0], f[0]]).concat([['free', 'Vrij']]), S.fmt, (k) => { if (k === 'free') setFormat('free', S.free); else setFormat(k); }));
    if (S.fmt === 'free') {
      const wi = el('input', { type: 'number', class: 'cf-num', min: 100, max: 8000, 'aria-label': 'Breedte' }), hi = el('input', { type: 'number', class: 'cf-num', min: 100, max: 8000, 'aria-label': 'Hoogte' });
      wi.value = S.free.w; hi.value = S.free.h;
      const ap = () => { const w = clamp(+wi.value || 1200, 100, 8000), h = clamp(+hi.value || 900, 100, 8000); setFormat('free', { w, h }); };
      wi.onchange = ap; hi.onchange = ap;
      p.appendChild(el('div', { class: 'cf-row' }, el('span', {}, 'Breedte × hoogte'), wi, el('b', {}, '×'), hi));
      p.appendChild(el('div', { class: 'cf-hint' }, 'Alleen de verhouding telt; bij het bewaren kies je 1080, 2160 of 4K breed.'));
    }
    p.appendChild(el('div', { class: 'cf-h', 'data-sec': 'bg' }, 'Achtergrond'));
    const b = S.bg;
    p.appendChild(chipRow([['color', 'Kleur'], ['grad', 'Verloop'], ['pat', 'Patroon'], ['photo', 'Foto']], b.t, (k) => { b.t = k; paint(); commit(); renderPanel(); }));
    if (b.t === 'color') p.appendChild(colorPick('Achtergrondkleur', () => b.c1, (c) => { b.c1 = c; }));
    else if (b.t === 'grad') {
      p.appendChild(colorPick('Kleur 1', () => b.c1, (c) => { b.c1 = c; })); p.appendChild(colorPick('Kleur 2', () => b.c2, (c) => { b.c2 = c; }));
      p.appendChild(slider('Hoek', 0, 360, 1, () => b.ang, (v) => { b.ang = v; }, '°'));
    } else if (b.t === 'pat') {
      p.appendChild(el('div', { class: 'cf-h' }, 'Patroon')); p.appendChild(chipRow(PATTERNS, b.pat, (k) => { b.pat = k; paint(); commit(); renderPanel(); }));
      p.appendChild(colorPick('Achtergrondkleur', () => b.p1, (c) => { b.p1 = c; })); p.appendChild(colorPick('Kleur van het patroon', () => b.p2, (c) => { b.p2 = c; }));
      p.appendChild(slider('Grootte', .5, 3, .05, () => b.ps, (v) => { b.ps = v; }));
    } else {
      p.appendChild(btnW(b.img ? '🔄 Andere foto kiezen' : '📷 Foto kiezen', setBgPhoto, 'pri'));
      p.appendChild(slider('Vervagen', 0, 100, 1, () => b.blur, (v) => { b.blur = v; }, '%'));
      if (b.img) p.appendChild(btnW('Foto-achtergrond weghalen', () => { b.t = 'color'; b.img = null; paint(); commit(); renderPanel(); }));
    }
  }

  /* ---------- paneel: indelen ---------- */
  let gapVal = 14;
  function pTools(p) {
    p.appendChild(el('div', { class: 'cf-h' }, 'Kiezen'));
    p.appendChild(el('div', { class: 'cf-chips' }, toggleChip('Meerdere kiezen', S.multi, () => { S.multi = !S.multi; refresh(); }),
      el('button', { class: 'cf-chip', onclick: () => { S.sel = S.objs.filter((o) => !o.locked && !o.hidden).map((o) => o.id); refresh(); paint(false); } }, 'Alles kiezen'),
      el('button', { class: 'cf-chip', onclick: () => { S.sel = []; refresh(); paint(false); } }, 'Niets kiezen')));
    p.appendChild(el('div', { class: 'cf-hint' }, 'Tip: kies met “Meerdere kiezen”, of houd Shift ingedrukt op een computer.'));
    p.appendChild(el('div', { class: 'cf-h' }, 'Uitlijnen'));
    p.appendChild(el('div', { class: 'cf-chips' }, [['left', '⇤ Links'], ['center', '⇔ Midden'], ['right', 'Rechts ⇥'], ['top', '⤒ Boven'], ['middle', '⇕ Midden'], ['bottom', '⤓ Onder']].map((a) => el('button', { class: 'cf-chip', onclick: () => alignSel(a[0]) }, a[1]))));
    p.appendChild(el('div', { class: 'cf-hint' }, 'Eén laag gekozen: uitlijnen op de pagina. Meerdere: ten opzichte van elkaar.'));
    p.appendChild(el('div', { class: 'cf-h' }, 'Verdeel gelijkmatig'));
    p.appendChild(el('div', { class: 'cf-chips' }, el('button', { class: 'cf-chip', onclick: () => distSel('x') }, '↔ Horizontaal'), el('button', { class: 'cf-chip', onclick: () => distSel('y') }, '↕ Verticaal')));
    p.appendChild(el('div', { class: 'cf-h' }, 'Automatisch indelen'));
    p.appendChild(slider('Ruimte ertussen', 0, 60, 1, () => gapVal, (v) => { gapVal = v; }));
    p.appendChild(btnW('✨ Alle foto’s netjes indelen', () => arrangePhotos(gapVal), 'pri'));
    p.appendChild(el('div', { class: 'cf-h' }, 'Hulp bij het plaatsen'));
    p.appendChild(el('div', { class: 'cf-chips' }, toggleChip('Raster', S.grid, () => { S.grid = !S.grid; saveSettings(); paint(false); refresh(); }), toggleChip('Hulplijnen (klik vast)', S.snap, () => { S.snap = !S.snap; saveSettings(); refresh(); })));
  }

  /* ---------- paneel: tekenen ---------- */
  function pDraw(p) {
    p.appendChild(el('div', { class: 'cf-h' }, 'Tekenen'));
    p.appendChild(chipRow([['pen', '✏️ Pen'], ['marker', '🖍 Marker'], ['eraser', '🧽 Gum']], S.draw.tool, (k) => { S.draw.tool = k; refresh(); }));
    p.appendChild(slider('Dikte', 2, 80, 1, () => S.draw.size, (v) => { S.draw.size = v; }));
    if (S.draw.tool !== 'eraser') p.appendChild(colorPick('Kleur', () => S.draw.color, (c) => { S.draw.color = c; }));
    p.appendChild(el('div', { class: 'cf-chips', style: 'margin-top:8px' }, el('button', { class: 'cf-chip', onclick: () => { const L = newDrawLayer(); if (L) { S.draw.layer = L.id; commit(); note('Nieuwe tekenlaag.'); } } }, '➕ Nieuwe tekenlaag'), el('button', { class: 'cf-chip', onclick: undo }, '↶ Ongedaan'), el('button', { class: 'cf-chip', onclick: endDraw }, 'Klaar ✓')));
  }

  /* ---------- bewaren: IndexedDB ---------- */
  let dbp = null, savesList = null, saving = false, again = false, sheetEl = null; const saveCache = new Map();
  function openDB() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      try {
        const r = indexedDB.open('simon-foto-collage-free', 1);
        r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('meta', { keyPath: 'id' }); d.createObjectStore('data', { keyPath: 'id' }); };
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error || new Error('idb')); r.onblocked = () => rej(new Error('geblokkeerd'));
      } catch (e) { rej(e); }
    });
    dbp.catch(() => { dbp = null; }); return dbp;
  }
  function idbDo(stores, mode, fn) {
    return openDB().then((db) => new Promise((res, rej) => {
      let t, rq; try { t = db.transaction(stores, mode); rq = fn(t); } catch (e) { rej(e); return; }
      t.oncomplete = () => res(rq && rq.result !== undefined ? rq.result : undefined); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error('afgebroken'));
    }));
  }
  function blobToBuf(b) {
    if (b.arrayBuffer) return b.arrayBuffer();
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsArrayBuffer(b); });
  }
  async function imageRecord(id) {
    if (saveCache.has(id)) return saveCache.get(id);
    const bm = bitmaps.get(id); if (!bm) return null;
    const sc = Math.min(1, 1400 / Math.max(bm.src.width, bm.src.height)), cv = mkCanvas(bm.src.width * sc, bm.src.height * sc), g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.imageSmoothingQuality = 'high'; g.drawImage(bm.src, 0, 0, cv.width, cv.height);
    const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', .86)); freeCanvas(cv); if (!blob) return null;
    const rec = { t: 'image/jpeg', b: await blobToBuf(blob) }; saveCache.set(id, rec); return rec;
  }
  function makeThumb() {
    const w = 240, h = Math.max(60, Math.round(240 * CH / CW)), c = mkCanvas(w, h);
    try { renderScene(c.getContext('2d'), w / CW, false); const u = c.toDataURL('image/jpeg', .7); freeCanvas(c); return u; } catch (e) { freeCanvas(c); return ''; }
  }
  async function loadSaves(quiet) {
    try { const l = await idbDo('meta', 'readonly', (t) => t.objectStore('meta').getAll()); savesList = (l || []).sort((a, b) => b.updated - a.updated); S.dbErr = false; }
    catch (e) { savesList = []; S.dbErr = true; }
    if (alive && S.tab === 'saves' && !quiet) renderPanel(); else if (alive && S.tab === 'saves') renderPanel();
  }
  async function saveCurrent(silent) {
    if (!alive) return; if (saving) { again = true; return; } saving = true;
    try {
      if (!savesList) await loadSaves(true);
      if (!S.cid) {
        if (!S.objs.length) { note('Er staat nog niets in de collage.'); return; }
        if (savesList.length >= MAXCOLLAGES) { note('Je hebt al ' + MAXCOLLAGES + ' collages bewaard. Verwijder er eerst één bij “Collages”.', 7000); return; }
        S.cid = nid('c');
      }
      const imgs = {}; const ids = [...usedImgIds()];
      for (let i = 0; i < ids.length; i++) { const r = await imageRecord(ids[i]); if (r) imgs[ids[i]] = r; }
      const docStr = snapshot(), meta = { id: S.cid, name: S.name || 'Mijn collage', updated: Date.now(), thumb: makeThumb(), count: S.objs.length };
      await idbDo(['meta', 'data'], 'readwrite', (t) => { t.objectStore('meta').put(meta); t.objectStore('data').put({ id: S.cid, doc: docStr, imgs }); });
      S.dirty = false; if (!silent) note('Bewaard op dit toestel ✓'); await loadSaves(true); if (S.tab === 'saves') renderPanel();
    } catch (e) { S.dbErr = true; note('Bewaren lukte niet (geen ruimte, of privé-modus).', 7000); }
    finally { saving = false; if (again && alive) { again = false; later(() => saveCurrent(true), 400); } }
  }
  function resetDoc() {
    S.objs = []; S.sel = []; S.crop = false; S.draw.on = false; S.draw.layer = null; S.multi = false;
    S.bg = { t: 'color', c1: '#ffffff', c2: '#fde68a', ang: 135, pat: 'dots', p1: '#fff7ed', p2: '#fdba74', ps: 1, img: null, blur: 0 };
    bitmaps.forEach((b) => { if (b.prev !== b.src) freeCanvas(b.prev); freeCanvas(b.src); }); bitmaps.clear(); clearProcCache();
    layerCache.forEach((e) => freeCanvas(e.c)); layerCache.clear(); saveCache.clear(); hist.stack = []; hist.idx = -1;
  }
  function newCollage() {
    resetDoc(); S.cid = null; S.name = 'Mijn collage'; S.dirty = false; updateDims(); hist.push(snapshot()); if (S.tab === 'draw') S.tab = null;
    sizeStage(); refresh(); paint(); note('Nieuwe lege collage.');
  }
  async function openSave(id) {
    note('Collage openen…', 0);
    try {
      const rec = await idbDo('data', 'readonly', (t) => t.objectStore('data').get(id)); if (!rec) throw new Error('weg');
      const meta = (savesList || []).filter((m) => m.id === id)[0]; resetDoc();
      const keys = Object.keys(rec.imgs || {});
      for (let i = 0; i < keys.length; i++) { const r = rec.imgs[keys[i]]; if (!r) continue; const cv = await loadFile(new Blob([r.b], { type: r.t || 'image/jpeg' }), limitSide(i)); if (cv) addBitmap(cv, keys[i]); }
      const d = JSON.parse(rec.doc); S.fmt = d.fmt; S.free = d.free; S.bg = d.bg; S.objs = d.objs; S.cid = id; S.name = meta ? meta.name : 'Mijn collage'; updateDims();
      S.objs.forEach((o) => { if (o.type === 'text') layoutText(o); }); hist.push(snapshot()); S.dirty = false; S.tab = S.tab === 'saves' ? null : S.tab;
      sizeStage(); refresh(); paint(); note('Geopend. Ga lekker verder!');
    } catch (e) { note('Openen lukte niet.', 5000); }
  }
  async function dupSave(id) {
    try {
      if (!savesList) await loadSaves(true); if (savesList.length >= MAXCOLLAGES) { note('Je hebt al ' + MAXCOLLAGES + ' collages: verwijder er eerst één.', 6000); return; }
      const rec = await idbDo('data', 'readonly', (t) => t.objectStore('data').get(id)), meta = savesList.filter((m) => m.id === id)[0]; if (!rec || !meta) throw new Error('weg');
      const nidc = nid('c'); await idbDo(['meta', 'data'], 'readwrite', (t) => { t.objectStore('meta').put(Object.assign({}, meta, { id: nidc, name: meta.name + ' (kopie)', updated: Date.now() })); t.objectStore('data').put(Object.assign({}, rec, { id: nidc })); });
      await loadSaves(true); renderPanel(); note('Gedupliceerd ✓');
    } catch (e) { note('Dupliceren lukte niet.', 5000); }
  }
  async function delSave(id) {
    try { await idbDo(['meta', 'data'], 'readwrite', (t) => { t.objectStore('meta').delete(id); t.objectStore('data').delete(id); }); if (S.cid === id) S.cid = null; await loadSaves(true); renderPanel(); note('Verwijderd.'); }
    catch (e) { note('Verwijderen lukte niet.', 5000); }
  }
  function confirmBtn(label, confirmLabel, fn, cls) {
    const b = el('button', { class: cls || 'cf-chip' }, label); let armed = false, tm = null;
    b.onclick = () => { if (!armed) { armed = true; b.textContent = confirmLabel; tm = later(() => { armed = false; b.textContent = label; }, 3000); } else { if (tm) clearTimeout(tm); fn(); } };
    return b;
  }
  function pSaves(p) {
    if (savesList === null) { loadSaves(); p.appendChild(el('div', { class: 'cf-hint' }, 'Laden…')); return; }
    p.appendChild(el('div', { class: 'cf-h' }, 'Deze collage'));
    const ni = el('input', { class: 'cf-num', style: 'width:100%;box-sizing:border-box', 'aria-label': 'Naam van de collage', maxlength: 40 }); ni.value = S.name; ni.onchange = () => { S.name = ni.value.trim() || 'Mijn collage'; if (S.cid) saveCurrent(true); };
    p.appendChild(ni);
    p.appendChild(el('div', { class: 'cf-chips', style: 'margin-top:8px' }, el('button', { class: 'cf-btn pri', onclick: () => saveCurrent(false) }, S.cid ? '💾 Bijwerken' : '💾 Bewaar op dit toestel'),
      S.dirty && S.objs.length ? confirmBtn('➕ Nieuwe collage', 'Niet bewaard! Tik nog eens', newCollage, 'cf-btn') : el('button', { class: 'cf-btn', onclick: newCollage }, '➕ Nieuwe collage')));
    p.appendChild(el('div', { class: 'cf-hint' }, 'Concepten staan alleen op dit toestel (max ' + MAXCOLLAGES + '). Foto’s worden verkleind bewaard. Een bewaarde collage wordt daarna automatisch bijgewerkt.'));
    if (S.dbErr) p.appendChild(el('div', { class: 'cf-hint', style: 'color:#ef4444' }, 'Bewaren is op dit moment niet beschikbaar (privé-modus of geen ruimte).'));
    p.appendChild(el('div', { class: 'cf-h' }, 'Mijn collages (' + savesList.length + ' van ' + MAXCOLLAGES + ')'));
    if (!savesList.length) p.appendChild(el('div', { class: 'cf-hint' }, 'Nog geen bewaarde collages.'));
    savesList.forEach((m) => {
      const cur = m.id === S.cid;
      p.appendChild(el('div', { class: 'cf-sv' }, m.thumb ? el('img', { src: m.thumb, alt: '' }) : el('div', { style: 'width:64px;height:64px' }),
        el('div', { class: 'meta' }, el('div', { style: 'font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }, m.name + (cur ? ' (open)' : '')), el('div', { style: 'opacity:.7;margin-bottom:5px' }, new Date(m.updated).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) + ' · ' + m.count + ' lagen'),
          el('div', { class: 'acts' }, cur ? null : (S.dirty && S.objs.length && !S.cid ? confirmBtn('Openen', 'Huidige niet bewaard: nog eens', () => openSave(m.id), '') : el('button', { onclick: () => openSave(m.id) }, 'Openen')), el('button', { onclick: () => dupSave(m.id) }, 'Kopie'), confirmBtn('Weg', 'Zeker?', () => delSave(m.id), '')))));
    });
  }

  /* ---------- exporteren ---------- */
  function showExport() {
    if (sheetEl) return; if (S.draw.on) endDraw();
    const sheet = el('div', { class: 'cf-sheet', onclick: (e) => { if (e.target === sheet) close(); } }), box = el('div'); sheet.appendChild(box); document.body.appendChild(sheet); sheetEl = sheet;
    let busy = false, msg = '';
    function close() { if (busy) return; sheet.remove(); sheetEl = null; }
    async function go(share) {
      if (busy) return; busy = true; msg = 'Plaatje maken…'; draw();
      try { msg = await exportImage(share); } catch (e) { msg = 'Het plaatje maken lukte niet (te weinig geheugen?). Kies een kleiner formaat.'; }
      busy = false; draw();
    }
    function draw() {
      box.innerHTML = ''; const w0 = S.exp.w, fit = fitExport(w0, Math.round(w0 * CH / CW));
      box.appendChild(el('div', { class: 'cf-h' }, '📤 Bewaren of delen'));
      box.appendChild(chipRow([['png', 'PNG (scherp)'], ['jpeg', 'JPG (kleiner)']], S.exp.type, (k) => { S.exp.type = k; draw(); }));
      box.appendChild(el('div', { class: 'cf-h' }, 'Formaat'));
      box.appendChild(chipRow([[1080, '1080 breed'], [2160, '2160 breed'], [4096, '4K (4096)']], S.exp.w, (k) => { S.exp.w = k; draw(); }));
      box.appendChild(el('div', { class: 'cf-hint' }, fit.w + ' × ' + fit.h + ' pixels' + (fit.scaled ? ' (verkleind: je toestel kan niet groter)' : '') + '. Je foto’s gaan nergens naartoe.'));
      box.appendChild(el('div', { class: 'cf-chips', style: 'margin-top:10px' }, el('button', { class: 'cf-btn pri', disabled: busy, onclick: () => go(true) }, '📤 Delen'), el('button', { class: 'cf-btn', disabled: busy, onclick: () => go(false) }, '⬇ Downloaden'), el('button', { class: 'cf-btn', disabled: busy, onclick: close }, 'Sluiten')));
      box.appendChild(el('div', { class: 'cf-hint', 'aria-live': 'polite' }, msg));
    }
    draw();
  }
  async function exportImage(share) {
    if (!S.objs.length) return 'Er staat nog niets in de collage.';
    const w0 = S.exp.w, fit = fitExport(w0, Math.round(w0 * CH / CW)), cv = mkCanvas(fit.w, fit.h), mime = S.exp.type === 'jpeg' ? 'image/jpeg' : 'image/png';
    await new Promise((r) => setTimeout(r, 30));
    renderScene(cv.getContext('2d'), fit.w / CW, true);
    const blob = await new Promise((r) => cv.toBlob(r, mime, .92)); freeCanvas(cv);
    if (!blob) return 'Het plaatje maken lukte niet (te weinig geheugen?). Kies een kleiner formaat.';
    const base = (S.name || 'collage').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'collage', fname = base + (mime === 'image/jpeg' ? '.jpg' : '.png');
    let file = null; try { file = new File([blob], fname, { type: mime }); } catch (e) { file = null; }
    if (share && file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return 'Gedeeld ✓'; } catch (e) { if (e && e.name === 'AbortError') return ''; }
    }
    const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = fname; a.style.display = 'none'; document.body.appendChild(a); a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(u); }, 5000); return 'Opgeslagen als ' + fname + ' ✓';
  }

  /* ---------- opbouw ---------- */
  function renderPanel() {
    if (!S.tab || !panel) return; const st = panel.scrollTop; panel.innerHTML = '';
    const fn = { new: pNew, props: pProps, layers: pLayers, page: pPage, tools: pTools, saves: pSaves, draw: pDraw }[S.tab]; if (fn) fn(panel); panel.scrollTop = st;
  }
  const onResize = () => { if (!alive || !root || !view.isConnected) return; sizeStage(); };
  function build() {
    view.innerHTML = '';
    btnUndo = tb('↶', 'Ongedaan maken', undo); btnRedo = tb('↷', 'Opnieuw', redo);
    btnMulti = tb('☑', 'Meerdere lagen kiezen', () => { S.multi = !S.multi; if (!S.multi && S.sel.length > 1) S.sel = [S.sel[S.sel.length - 1]]; refresh(); paint(false); note(S.multi ? 'Tik nu meerdere dingen aan om ze samen te kiezen.' : ''); });
    btnGrid = tb('▦', 'Raster aan/uit', () => { S.grid = !S.grid; saveSettings(); updateTop(); paint(false); });
    btnSnap = tb('🧲', 'Hulplijnen aan/uit', () => { S.snap = !S.snap; saveSettings(); updateTop(); note(S.snap ? 'Hulplijnen aan: dingen klikken vast.' : 'Hulplijnen uit.'); });
    const btnSave = tb('💾', 'Bewaar op dit toestel', () => { if (!S.cid) openTab('saves'); saveCurrent(false); }), btnExp = el('button', { class: 'cf-btn pri', onclick: showExport }, '📤 Delen');
    topEl = el('div', { class: 'cf-top' }, btnUndo, btnRedo, btnMulti, btnGrid, btnSnap, el('span', { class: 'cf-sp' }), btnSave, btnExp);
    sceneCv = el('canvas', { class: 'cf-scene', 'aria-label': 'Collage' }); ovCv = el('canvas', { class: 'cf-ov', 'aria-hidden': 'true' });
    stage = el('div', { class: 'cf-stage' }, sceneCv, ovCv); noteEl = el('div', { class: 'cf-note', 'aria-live': 'polite' });
    bar = el('div', { class: 'cf-bar' }); tabsEl = el('div', { class: 'cf-tabs' }); panel = el('div', { class: 'cf-panel', style: 'display:none' });
    root = el('div', { class: 'cf-wrap' }, topEl, stage, noteEl, bar, tabsEl, panel); view.appendChild(root);
    stage.addEventListener('pointerdown', onDown); stage.addEventListener('pointermove', onMove); stage.addEventListener('pointerup', onUp); stage.addEventListener('pointercancel', onUp);
    stage.addEventListener('wheel', onWheel, { passive: false });
    stage.addEventListener('dragover', (e) => { e.preventDefault(); });
    stage.addEventListener('drop', (e) => { e.preventDefault(); const fs = [].slice.call((e.dataTransfer && e.dataTransfer.files) || []); if (fs.length) addPhotos(fs); });
    stage.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', onResize); window.addEventListener('orientationchange', onResize); window.addEventListener('keydown', onKey);
    hist.push(snapshot()); sizeStage(); refresh(); paint();
    note('Begin met “📷 Foto’s” of kies iets uit “Nieuw”. Tik om te kiezen, sleep om te verplaatsen.', 7000);
    later(sizeStage, 80); later(sizeStage, 400);
  }
  addCleanup(() => {
    alive = false; if (raf) cancelAnimationFrame(raf); timers.forEach((t) => clearTimeout(t)); timers.clear();
    window.removeEventListener('resize', onResize); window.removeEventListener('orientationchange', onResize); window.removeEventListener('keydown', onKey);
    if (sheetEl) { sheetEl.remove(); sheetEl = null; } style.remove();
    bitmaps.forEach((b) => { if (b.prev !== b.src) freeCanvas(b.prev); freeCanvas(b.src); }); bitmaps.clear(); clearProcCache();
    layerCache.forEach((e) => freeCanvas(e.c)); layerCache.clear(); tileCache.forEach((c) => freeCanvas(c)); tileCache.clear(); blurCache.forEach((c) => freeCanvas(c)); blurCache.clear(); saveCache.clear(); iconCache.clear();
    if (dbp) dbp.then((d) => d.close()).catch(() => { /* ok */ });
    if (sceneCv) freeCanvas(sceneCv); if (ovCv) freeCanvas(ovCv); P.clear();
  });
  build();
}
