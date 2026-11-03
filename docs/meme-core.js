// Meme-kern: achtergronden, sjablonen, stickers, lettertypen, foto-filters en opslagformaat (zonder DOM; alleen een 2D-canvas-interface).
import { R4_BGS, R4_TEMPLATES, R4_FILTERS, R4_STICKER_GROUPS, R4_FUNNY, applyR4Filter } from './tools-r4-meme.js?v=1';

export const W = 1080;
export const FONTS = [
  ['impact', 'Meme', '"Impact","Arial Black","Helvetica Neue",Arial,sans-serif', 900],
  ['comic', 'Stripboek', '"Comic Sans MS","Chalkboard SE","Marker Felt",cursive,sans-serif', 800],
  ['serif', 'Krant', 'Georgia,"Times New Roman",serif', 800],
  ['hand', 'Handschrift', '"Bradley Hand","Segoe Print","Noteworthy",cursive,sans-serif', 700],
  ['mono', 'Computer', '"Courier New",Menlo,monospace', 800],
  ['round', 'Rond', '"Arial Rounded MT Bold","Avenir Next","Trebuchet MS",sans-serif', 800],
];
export const fontById = (id) => FONTS.find((f) => f[0] === id) || FONTS[0];
export const EMOJIS = ['😂', '🤣', '😎', '🤔', '😱', '🥳', '😭', '🙃', '🤪', '😴', '🤯', '😈', '🥸', '🤡', '👻', '💩', '🔥', '💀', '👀', '🙈', '🐶', '🐱', '🐸', '🦆', '🐮', '🐧', '🦄', '🐷', '🍕', '🍟', '🍩', '🍺', '☕', '🧀', '🥔', '🚲', '⚽', '🎉', '💯', '❤️', '😍', '😡', '🥶', '🤢', '🫠', '🤩', '😬', '🫡'];
export const COLORS = ['#ffffff', '#000000', '#facc15', '#ef4444', '#3b82f6', '#22c55e', '#ec4899', '#f97316', '#a855f7', '#06b6d4'];

// 3D-stickers per groep (namen uit gfx/icons.js)
export const STICKER_GROUPS = [
  ['Schatten', ['coin', 'gem', 'star', 'heart', 'trophy', 'crown', 'medal', 'gift', 'chest', 'key', 'bomb', 'bolt', 'shield', 'sword', 'potion', 'bell', 'balloon', 'dice', 'puzzle', 'target', 'ticket', 'bag', 'ring', 'crystal', 'clover', 'lightbulb', 'magnet', 'flag']],
  ['Eten', ['pizza', 'burger', 'fries', 'hotdog', 'icecream', 'donut', 'cake', 'cookie', 'candy', 'lollipop', 'egg', 'cheese', 'bread', 'cupcake', 'coffee', 'pie', 'apple', 'banana', 'carrot', 'tomato', 'strawberry', 'grapes', 'watermelon', 'corn']],
  ['Dieren', ['dog', 'cat', 'rabbit', 'bear', 'penguin', 'lion', 'frog', 'duck', 'owl', 'bee', 'butterfly', 'snail', 'elephant', 'monkey', 'fox', 'panda', 'cow', 'pig', 'chicken', 'sheep', 'horse', 'fish', 'shark', 'crab', 'whale', 'octopus', 'jellyfish', 'turtle']],
  ['Fantasie', ['dragon', 'slime', 'ghost', 'robot', 'alien', 'skull', 'unicorn', 'wizard', 'fairy', 'dino', 'mermaid', 'wand', 'crystal']],
  ['Ruimte', ['rocket', 'ufo', 'satellite', 'planet', 'earth', 'comet', 'astronaut', 'moon', 'sun', 'star']],
  ['Voertuigen', ['car', 'truck', 'bus', 'train', 'plane', 'boat', 'ship', 'tractor', 'foodtruck', 'helicopter', 'bike', 'submarine']],
  ['Natuur', ['tree', 'pine', 'palm', 'flower', 'sunflower', 'mushroom', 'cactus', 'rock', 'cloud', 'rain', 'snowflake', 'flame', 'volcano', 'wave', 'rainbow', 'leaf']],
  ['Plekken', ['house', 'castle', 'tower', 'tent', 'barn', 'windmill', 'lighthouse', 'ferriswheel', 'rollercoaster', 'carousel', 'shop', 'school', 'hospital', 'factory', 'skyscraper', 'fountain', 'bridge', 'igloo', 'pyramid']],
  ['Muziek en school', ['piano', 'guitar', 'drum', 'microphone', 'headphones', 'note', 'paint', 'pencil', 'camera', 'book', 'microscope', 'flask', 'globe', 'map', 'compass', 'gear', 'hammer', 'pickaxe']],
  ...R4_STICKER_GROUPS, // ronde 4
];

// ---------- achtergronden: [naam, tekenfunctie(c, w, h)] ----------
const lin = (c, w, h, a, b, ang = 0.6) => { const g = c.createLinearGradient(0, 0, w * Math.cos(ang), h * Math.sin(ang) + h * 0.4); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, w, h); };
const rad = (c, w, h, a, b) => { const g = c.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, Math.max(w, h) * 0.7); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, w, h); };
const panels = (c, w, h, cols, rows, colors) => {
  const pw = w / cols, ph = h / rows; let k = 0;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { c.fillStyle = colors[k++ % colors.length]; c.fillRect(x * pw, y * ph, Math.ceil(pw), Math.ceil(ph)); }
  c.strokeStyle = '#111827'; c.lineWidth = 10; c.strokeRect(5, 5, w - 10, h - 10); c.beginPath();
  for (let x = 1; x < cols; x++) { c.moveTo(x * pw, 0); c.lineTo(x * pw, h); } for (let y = 1; y < rows; y++) { c.moveTo(0, y * ph); c.lineTo(w, y * ph); } c.stroke();
};
export const BGS = [
  ['Zonsondergang', (c, w, h) => lin(c, w, h, '#f97316', '#be185d', 1.2)],
  ['Oceaan', (c, w, h) => lin(c, w, h, '#06b6d4', '#1e3a8a', 1.4)],
  ['Bos', (c, w, h) => lin(c, w, h, '#a3e635', '#14532d', 1.2)],
  ['Snoepje', (c, w, h) => lin(c, w, h, '#f9a8d4', '#a78bfa', 0.9)],
  ['Nacht', (c, w, h) => rad(c, w, h, '#4338ca', '#0f0a2a')],
  ['Zon', (c, w, h) => rad(c, w, h, '#fef08a', '#f97316')],
  ['Strepen', (c, w, h) => { c.fillStyle = '#fde047'; c.fillRect(0, 0, w, h); c.fillStyle = '#ef4444'; for (let x = -h; x < w + h; x += 120) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 60, 0); c.lineTo(x + 60 - h * 0.5, h); c.lineTo(x - h * 0.5, h); c.fill(); } }],
  ['Stippen', (c, w, h) => { c.fillStyle = '#38bdf8'; c.fillRect(0, 0, w, h); c.fillStyle = '#e0f2fe'; for (let y = 0; y < h + 60; y += 90) for (let x = ((y / 90) % 2) * 45; x < w + 60; x += 90) { c.beginPath(); c.arc(x, y, 24, 0, 7); c.fill(); } }],
  ['Ruit', (c, w, h) => { const s = 135; for (let y = 0; y * s < h; y++) for (let x = 0; x * s < w; x++) { c.fillStyle = (x + y) % 2 ? '#ffffff' : '#16a34a'; c.fillRect(x * s, y * s, s, s); } }],
  ['Zonnestralen', (c, w, h) => { c.fillStyle = '#fbbf24'; c.fillRect(0, 0, w, h); c.fillStyle = '#fb923c'; const cx = w / 2, cy = h / 2, R = Math.max(w, h); for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R, a, a + Math.PI / 20); c.fill(); } }],
  ['Paars-groen', (c, w, h) => lin(c, w, h, '#7c3aed', '#34d399', 0.5)],
  ['Grijs', (c, w, h) => lin(c, w, h, '#e5e7eb', '#4b5563', 1.3)],
  ['Twee vakken', (c, w, h) => panels(c, w, h, 1, 2, ['#fecaca', '#bbf7d0'])],
  ['Vier vakken', (c, w, h) => panels(c, w, h, 2, 2, ['#fde68a', '#bae6fd', '#fbcfe8', '#bbf7d0'])],
  ['Drie stroken', (c, w, h) => panels(c, w, h, 1, 3, ['#bfdbfe', '#fde68a', '#fecdd3'])],
  ['Regenboog', (c, w, h) => { const cols = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7']; cols.forEach((k, i) => { c.fillStyle = k; c.fillRect(0, i * h / 6, w, Math.ceil(h / 6)); }); }],
  ['Sterrenhemel', (c, w, h) => { rad(c, w, h, '#1e1b4b', '#020617'); c.fillStyle = '#fff'; let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 110; i++) { c.globalAlpha = 0.4 + r() * 0.6; c.beginPath(); c.arc(r() * w, r() * h, 1 + r() * 3.5, 0, 7); c.fill(); } c.globalAlpha = 1; }],
  ['Strand', (c, w, h) => { lin(c, w, h * 0.55, '#7dd3fc', '#e0f2fe', 1.5); c.fillStyle = '#38bdf8'; c.fillRect(0, h * 0.5, w, h * 0.2); c.fillStyle = '#fde68a'; c.fillRect(0, h * 0.68, w, h * 0.32); c.fillStyle = '#fef08a'; c.beginPath(); c.arc(w * 0.8, h * 0.18, 70, 0, 7); c.fill(); }],
  ['Rood-zwart', (c, w, h) => lin(c, w, h, '#dc2626', '#111827', 1.1)],
  ['Mint', (c, w, h) => lin(c, w, h, '#a7f3d0', '#0ea5e9', 0.8)],
  ...R4_BGS, // ronde 4: 8 extra achtergronden (nummers 20 t/m 27)
];

// ---------- sjablonen ----------
// Posities (x,y) zijn fracties van breedte/hoogte. layers: tekst / sticker (icon of emoji) / bubble (tekstballon).
const T = (x, y, text, size = 90, extra = {}) => ({ kind: 'text', x, y, text, size, ...extra });
const S = (x, y, icon, size = 300, extra = {}) => ({ kind: 'sticker', x, y, icon, size, ...extra });
const B = (x, y, text, size = 60, extra = {}) => ({ kind: 'bubble', x, y, text, size, ...extra });
export const TEMPLATES = [
  { name: 'Klassiek', bg: 1, top: 'Als je het eindelijk snapt', bottom: 'maar de les is al voorbij', layers: [S(0.5, 0.5, 'penguin', 420)] },
  { name: 'Twee keuzes', bg: 12, top: '', bottom: '', layers: [T(0.3, 0.25, 'NEE', 120, { color: '#b91c1c' }), T(0.3, 0.75, 'JA', 120, { color: '#15803d' }), B(0.7, 0.25, 'Huiswerk maken', 54), B(0.7, 0.75, 'Nog even gamen', 54), S(0.82, 0.5, 'cat', 180)] },
  { name: 'Vier vakken', bg: 13, top: '', bottom: '', layers: [T(0.25, 0.1, 'Wat ik denk', 60), T(0.75, 0.1, 'Wat mama ziet', 60), T(0.25, 0.6, 'Wat ik doe', 60), T(0.75, 0.6, 'Wat er echt gebeurt', 60), S(0.25, 0.3, 'lightbulb', 200), S(0.75, 0.3, 'dog', 200), S(0.25, 0.8, 'pencil', 200), S(0.75, 0.8, 'flame', 200)] },
  { name: 'Dit is prima', bg: 18, top: 'DIT IS PRIMA', bottom: '', layers: [S(0.3, 0.62, 'house', 360), S(0.62, 0.7, 'flame', 380), S(0.78, 0.55, 'flame', 300), B(0.5, 0.88, 'Alles onder controle!', 54)] },
  { name: 'Verbaasde kat', bg: 3, top: 'Toen de bak leeg bleek', bottom: 'ik had dit niet gezien', layers: [S(0.5, 0.5, 'cat', 500), S(0.8, 0.72, 'fish', 170)] },
  { name: 'Pizza-liefde', bg: 5, top: 'Ik en mijn pizza', bottom: 'niemand kan ons scheiden', layers: [S(0.5, 0.5, 'pizza', 540), S(0.2, 0.3, 'heart', 150), S(0.8, 0.3, 'heart', 150)] },
  { name: 'Held van de dag', bg: 4, top: 'Ik na 1 minuut opruimen', bottom: 'Dat was zwaar werk', layers: [S(0.5, 0.5, 'trophy', 480), S(0.2, 0.75, 'star', 150), S(0.8, 0.75, 'star', 150)] },
  { name: 'Dino-presentatie', bg: 2, top: '', bottom: '', layers: [S(0.5, 0.55, 'dino', 520), B(0.5, 0.15, 'Mijn spreekbeurt gaat over... uh... dinosauriërs?', 52)] },
  { name: 'Ruimtenieuws', bg: 16, top: 'BREAKING NEWS', bottom: 'Er is geen wifi op Mars', layers: [S(0.5, 0.48, 'astronaut', 440), S(0.2, 0.25, 'planet', 220), S(0.82, 0.7, 'rocket', 220)] },
  { name: 'Geheime schat', bg: 9, top: 'Eindelijk gevonden!', bottom: 'Het was een sok', layers: [S(0.5, 0.5, 'chest', 450), S(0.25, 0.28, 'coin', 130), S(0.75, 0.28, 'gem', 140)] },
  { name: 'Gedachtebel hond', bg: 17, top: '', bottom: '', layers: [S(0.5, 0.62, 'dog', 520), B(0.5, 0.15, 'Als ik heel lief kijk krijg ik misschien een worstje', 52)] },
  { name: 'Drie stappen', bg: 14, top: '', bottom: '', layers: [T(0.5, 0.12, '1. Plan maken', 70), T(0.5, 0.45, '2. Niks doen', 70), T(0.5, 0.8, '3. Paniek!', 70), S(0.15, 0.27, 'lightbulb', 130), S(0.85, 0.6, 'hourglass', 130), S(0.15, 0.93, 'bomb', 130)] },
  { name: 'Koning van de snacks', bg: 0, top: 'Ik bij de chipskast', bottom: 'Lang leve de koning', layers: [S(0.5, 0.4, 'crown', 360), S(0.5, 0.68, 'fries', 330)] },
  { name: 'Zwemles', bg: 17, top: 'Zwemles vandaag', bottom: 'Ik: wie, ik?', layers: [S(0.5, 0.5, 'duck', 440), S(0.8, 0.8, 'wave', 200)] },
  { name: 'Superheld', bg: 19, top: 'Mijn superkracht:', bottom: 'Altijd honger', layers: [S(0.5, 0.5, 'bolt', 420), S(0.5, 0.78, 'burger', 240)] },
  ...R4_TEMPLATES, // ronde 4: 14 extra sjablonen
];
// Instantie van een sjabloon als bewerkbare toestand.
export function fromTemplate(t, idGen) {
  const h = t.h || W;
  const st = { h, bg: { type: 'grad', idx: t.bg, emoji: '😂', img: null }, top: t.top || '', bottom: t.bottom || '', ts: { color: '#ffffff', stroke: '#000000', size: 110, font: 'impact' }, layers: [], filter: { id: 'none', amt: 0.8 }, adj: { brightness: 0, contrast: 0, saturate: 0 }, frame: { w: 0, color: '#ffffff' } };
  for (const l of t.layers) {
    const base = { id: idGen(), rot: 0, color: '#ffffff', stroke: '#000000', font: 'impact', emoji: null, icon: null, text: '', ...l };
    if (base.kind === 'bubble') { base.color = '#111827'; base.stroke = '#ffffff'; base.font = 'comic'; }
    if (base.kind === 'text' && l.color === undefined) base.color = '#ffffff';
    base.x = Math.round(l.x * W); base.y = Math.round(l.y * h); st.layers.push(base);
  }
  return st;
}

// ---------- foto-filters (op {data,width,height}) ----------
export const FILTERS = [
  ['none', 'Geen'], ['bw', 'Zwart-wit'], ['sepia', 'Sepia'], ['warm', 'Warm'], ['cool', 'Koud'], ['pop', 'Pop'], ['vintage', 'Vintage'], ['invert', 'Negatief'],
  ['poster', 'Poster'], ['pixel', 'Pixels'], ['blur', 'Wazig'], ['dream', 'Droom'], ['duo1', 'Duotoon paars'], ['duo2', 'Duotoon oranje'], ['comic', 'Strip'],
  ['night', 'Nacht'], ['vignette', 'Vignet'], ['noise', 'Korrel'], ['glitch', 'Glitch'], ['mirror', 'Spiegel'],
  ...R4_FILTERS,
];
const cl = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const mixv = (a, b, t) => a + (b - a) * t;
function eachPx(img, fn) { const d = img.data; for (let i = 0; i < d.length; i += 4) { const o = fn(d[i], d[i + 1], d[i + 2], i); if (o) { d[i] = cl(o[0]); d[i + 1] = cl(o[1]); d[i + 2] = cl(o[2]); } } }
function blendTo(img, orig, amt) { if (amt >= 1) return; const d = img.data; for (let i = 0; i < d.length; i++) if ((i & 3) !== 3) d[i] = mixv(orig[i], d[i], amt); }
export function boxBlur(img, rad) {
  const { width: w, height: h, data: d } = img; rad = Math.max(1, rad | 0); const tmp = new Float32Array(d.length);
  for (let pass = 0; pass < 2; pass++) {
    const src = pass === 0 ? d : tmp, dst = pass === 0 ? tmp : d;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      for (let ch = 0; ch < 3; ch++) {
        let s = 0, cnt = 0;
        if (pass === 0) { for (let k = -rad; k <= rad; k++) { const xx = x + k; if (xx >= 0 && xx < w) { s += src[(y * w + xx) * 4 + ch]; cnt++; } } }
        else { for (let k = -rad; k <= rad; k++) { const yy = y + k; if (yy >= 0 && yy < h) { s += src[(yy * w + x) * 4 + ch]; cnt++; } } }
        dst[(y * w + x) * 4 + ch] = s / cnt;
      }
      dst[(y * w + x) * 4 + 3] = 255;
    }
  }
}
export function pixelate(img, block) {
  const { width: w, height: h, data: d } = img; block = Math.max(2, block | 0);
  for (let by = 0; by < h; by += block) for (let bx = 0; bx < w; bx += block) {
    let r = 0, g = 0, b = 0, n = 0; const ye = Math.min(h, by + block), xe = Math.min(w, bx + block);
    for (let y = by; y < ye; y++) for (let x = bx; x < xe; x++) { const i = (y * w + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
    r /= n; g /= n; b /= n;
    for (let y = by; y < ye; y++) for (let x = bx; x < xe; x++) { const i = (y * w + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; }
  }
}
export function adjust(img, a) {
  const br = (a.brightness || 0) * 2.55, ct = (a.contrast || 0) / 100, sa = 1 + (a.saturate || 0) / 100;
  if (!br && !ct && !a.saturate) return;
  const f = (259 * (ct * 255 + 255)) / (255 * (259 - ct * 255));
  eachPx(img, (r, g, b) => {
    const L = lum(r, g, b); r = L + (r - L) * sa; g = L + (g - L) * sa; b = L + (b - L) * sa;
    return [f * (r + br - 128) + 128, f * (g + br - 128) + 128, f * (b + br - 128) + 128];
  });
}
const prng = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export function applyFilter(img, id, amt = 1) {
  if (!id || id === 'none') return img;
  const orig = img.data.slice(), { width: w, height: h, data: d } = img; amt = Math.max(0, Math.min(1, amt));
  switch (id) {
    case 'bw': eachPx(img, (r, g, b) => { const L = lum(r, g, b); return [L, L, L]; }); break;
    case 'sepia': eachPx(img, (r, g, b) => [r * 0.393 + g * 0.769 + b * 0.189, r * 0.349 + g * 0.686 + b * 0.168, r * 0.272 + g * 0.534 + b * 0.131]); break;
    case 'warm': eachPx(img, (r, g, b) => [r * 1.12 + 12, g * 1.02 + 4, b * 0.82]); break;
    case 'cool': eachPx(img, (r, g, b) => [r * 0.85, g * 1.0 + 4, b * 1.18 + 12]); break;
    case 'pop': adjust(img, { contrast: 35, saturate: 55 }); break;
    case 'vintage': eachPx(img, (r, g, b) => { const L = lum(r, g, b); return [mixv(L, r, 0.6) * 1.08 + 18, mixv(L, g, 0.6) * 0.98 + 10, mixv(L, b, 0.6) * 0.82 + 6]; }); break;
    case 'invert': eachPx(img, (r, g, b) => [255 - r, 255 - g, 255 - b]); break;
    case 'poster': eachPx(img, (r, g, b) => [Math.round(r / 64) * 64, Math.round(g / 64) * 64, Math.round(b / 64) * 64]); break;
    case 'pixel': pixelate(img, Math.max(4, Math.round(Math.max(w, h) / 70))); break;
    case 'blur': boxBlur(img, Math.max(2, Math.round(Math.max(w, h) / 120))); break;
    case 'dream': { boxBlur(img, Math.max(3, Math.round(Math.max(w, h) / 90))); for (let i = 0; i < d.length; i += 4) { d[i] = cl(mixv(orig[i], d[i], 0.5) * 1.15 + 14); d[i + 1] = cl(mixv(orig[i + 1], d[i + 1], 0.5) * 1.08 + 8); d[i + 2] = cl(mixv(orig[i + 2], d[i + 2], 0.5) * 1.18 + 18); } break; }
    case 'duo1': eachPx(img, (r, g, b) => { const t = lum(r, g, b) / 255; return [mixv(40, 255, t), mixv(10, 190, t), mixv(110, 240, t * t)]; }); break;
    case 'duo2': eachPx(img, (r, g, b) => { const t = lum(r, g, b) / 255; return [mixv(30, 255, t), mixv(10, 170, t), mixv(60, 70, t)]; }); break;
    case 'comic': {
      eachPx(img, (r, g, b) => [Math.round(r / 51) * 51, Math.round(g / 51) * 51, Math.round(b / 51) * 51]);
      for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) { const i = (y * w + x) * 4, j = i + 4, k = i + w * 4; const L = lum(orig[i], orig[i + 1], orig[i + 2]); if (Math.abs(L - lum(orig[j], orig[j + 1], orig[j + 2])) + Math.abs(L - lum(orig[k], orig[k + 1], orig[k + 2])) > 60) { d[i] = d[i + 1] = d[i + 2] = 10; } }
      break;
    }
    case 'night': eachPx(img, (r, g, b) => { const L = lum(r, g, b) * 0.7; return [L * 0.35, L * 0.6, L * 1.1 + 20]; }); break;
    case 'vignette': for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (x / w - 0.5) * 2, dy = (y / h - 0.5) * 2, f = 1 - Math.min(1, Math.max(0, (Math.sqrt(dx * dx + dy * dy) - 0.45) / 0.9)) * 0.85, i = (y * w + x) * 4; d[i] *= f; d[i + 1] *= f; d[i + 2] *= f; } break;
    case 'noise': { const r = prng(11); for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 70; d[i] = cl(d[i] + n); d[i + 1] = cl(d[i + 1] + n); d[i + 2] = cl(d[i + 2] + n); } break; }
    case 'glitch': { const r = prng(5); for (let y = 0; y < h; y++) { const off = r() < 0.12 ? Math.round((r() - 0.5) * w * 0.12) : 0; const sh = Math.round(w * 0.012); for (let x = 0; x < w; x++) { const i = (y * w + x) * 4, xr = Math.min(w - 1, Math.max(0, x + off + sh)), xb = Math.min(w - 1, Math.max(0, x + off - sh)), xg = Math.min(w - 1, Math.max(0, x + off)); d[i] = orig[(y * w + xr) * 4]; d[i + 1] = orig[(y * w + xg) * 4 + 1]; d[i + 2] = orig[(y * w + xb) * 4 + 2]; } } break; }
    case 'mirror': for (let y = 0; y < h; y++) for (let x = Math.floor(w / 2); x < w; x++) { const i = (y * w + x) * 4, j = (y * w + (w - 1 - x)) * 4; d[i] = orig[j]; d[i + 1] = orig[j + 1]; d[i + 2] = orig[j + 2]; } break;
    default: if (!applyR4Filter(img, id)) return img;
  }
  blendTo(img, orig, amt); return img;
}

// ---------- opslag ----------
// Toestand zonder foto-canvas; foto wordt apart (verkleind) bewaard.
export function serialize(st) {
  const { bg, layers, ...rest } = st;
  return { v: 2, ...JSON.parse(JSON.stringify(rest)), bg: { type: bg.type, idx: bg.idx, emoji: bg.emoji, zoom: bg.zoom || 1, ox: bg.ox || 0, oy: bg.oy || 0 }, layers: JSON.parse(JSON.stringify(layers)) };
}
export function restore(o) {
  const d = { top: '', bottom: '', ts: { color: '#ffffff', stroke: '#000000', size: 110, font: 'impact' }, filter: { id: 'none', amt: 0.8 }, adj: { brightness: 0, contrast: 0, saturate: 0 }, frame: { w: 0, color: '#ffffff' } };
  const st = { ...d, ...o, ts: { ...d.ts, ...(o.ts || {}) }, filter: { ...d.filter, ...(o.filter || {}) }, adj: { ...d.adj, ...(o.adj || {}) }, frame: { ...d.frame, ...(o.frame || {}) } };
  st.h = Math.max(200, Math.min(1920, +o.h || W));
  st.bg = { type: ['grad', 'emoji', 'img'].includes(o.bg && o.bg.type) ? o.bg.type : 'grad', idx: Math.max(0, Math.min(BGS.length - 1, (o.bg && o.bg.idx) | 0)), emoji: (o.bg && o.bg.emoji) || '😂', img: null, zoom: (o.bg && o.bg.zoom) || 1, ox: (o.bg && o.bg.ox) || 0, oy: (o.bg && o.bg.oy) || 0 };
  st.layers = (Array.isArray(o.layers) ? o.layers : []).filter((l) => l && typeof l === 'object').map((l, i) => ({ id: l.id || i + 1, kind: l.kind || 'text', x: +l.x || W / 2, y: +l.y || st.h / 2, rot: +l.rot || 0, size: +l.size || 90, color: l.color || '#ffffff', stroke: l.stroke || '#000000', text: l.text || '', emoji: l.emoji || null, icon: l.icon || null, font: l.font || 'impact' }));
  return st;
}
// Galerij beperken op aantal en totale grootte (aantal tekens van JSON).
export function fitMemes(items, maxChars = 3_200_000, maxN = 14) {
  const g = items.slice(0, maxN); while (g.length > 1 && JSON.stringify(g).length > maxChars) g.pop(); return g;
}
export const iconNamesUsed = (st) => [...new Set(st.layers.filter((l) => l.kind === 'sticker' && l.icon).map((l) => l.icon))];

export const FUNNY = [
  ['Als je maandag ziet', 'en het is pas zondagavond'], ['Ik: ik ga vroeg slapen', 'Ook ik om 3 uur: nog één filmpje'],
  ['Wat denk je dat je doet', 'met mijn laatste stuk pizza'], ['Mama zei: we hebben thuis frikandellen', 'De frikandellen thuis:'],
  ['Huiswerk maken?', 'Eerst even de kat knuffelen'], ['Kijk eens hoe goed ik opruim', 'Alles onder het bed geschoven'],
  ['Wifi valt uit', 'Ineens weer buiten spelen'], ['Mijn plan voor vandaag', 'Niks, en dat ook nog slecht'],
  ['Opa vertelt weer', 'Vroeger was alles beter, ook de fiets'], ['Ik zei nog 1 aflevering', 'Het is nu 5 uur in de ochtend'],
  ['Niemand: helemaal niemand', 'Mijn hond om 6 uur: ontbijt!'], ['Dat ene vriendje', 'dat altijd je friet opeet'],
  ['Even snel boodschappen doen', 'Komt thuis met 14 dingen, geen melk'], ['Ik heb honger', 'Koelkast open, koelkast dicht, herhaal'],
  ['Teamgeest!', 'Maar ik doe het wel alleen'], ['Hoe laat is het?', 'Tijd om te snacken'],
  ['Het regent weer', 'Typisch Nederland, jas vergeten'], ['Mijn wekker om 7:00', 'Mijn bed: nee'],
  ['Als de juf zegt: pak je schrift', 'Ik: welk schrift?'], ['Fietsen tegen de wind in', 'Terugweg: ook tegen de wind in'],
  ['Zeg het met een stroopwafel', 'Alles is beter met stroop'], ['Ik beloofde minder snoep', 'De snoeppot lacht me uit'],
  ['Wie heeft er koekjes gepakt?', 'Niet kijken naar mijn mond'], ['Mijn kamer is een puinhoop', 'Ik weet precies waar alles ligt'],
  ['Vroeg op en fris', 'Zei niemand ooit'], ['Eén pannenkoek erbij', 'Zei ik tegen de zevende'],
  ['Als je je schoenen vergeet', 'Gewoon op sokken naar school'], ['Mijn gamevaardigheden', 'Verloren van een kind van 6'],
  ['Spaghetti eten met wit shirt', 'Wat kan er misgaan?'], ['Ik ben niet te laat', 'Iedereen was gewoon te vroeg'],
  ['Zondagmiddag', 'Horizontaal op de bank, geen plannen'], ['Zwemles vandaag', 'Mijn zwembroek: zoek de fout'],
  ['Ik probeer gezond te eten', 'Hmm, friet telt als groente'],
  ['Toen de leraar zei: even stil', 'Mijn buik: GRRRR'], ['Laatste dag van de vakantie', 'Ik: nog zo veel plannen'],
  ['Opruimen duurt 5 minuten', 'Drie uur later: nog steeds bezig'], ['Mijn batterij: 1%', 'Opeens superbelangrijk bericht'],
  ['Snoep delen?', 'Ik denk het niet'], ['Mijn zakgeld op dinsdag', 'Is er nog wel'], ['De bus komt zo', 'De bus: ik ben al weg'],
  ['Ik heb alles onder controle', 'Dat zei de hond ook, voor hij de taart zag'], ['Grote broer: laat mij maar', 'Het ging fout'],
  ['Pannenkoeken of poffertjes?', 'Ja'], ['Ik beloof dat ik niet lach', 'Ik lach'],
  ...R4_FUNNY, // ronde 4: 24 extra teksten
];
