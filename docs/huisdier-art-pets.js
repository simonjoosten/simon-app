// huisdier-art-pets.js
// Handgetekende kawaii-SVG huisdieren + accessoires voor "Huisdier 2.0".
// Geen imports, geen externe bestanden: alles is pure SVG-tekst.
//
// Coordinatenstelsel: viewBox 0 0 200 200, voeten op y~185.
// Per soort zijn er ankerpunten (hoofd-top, oogniveau/afstand, hals, borst, breedtes);
// elk accessoire is getekend rond een eigen oorsprong en wordt met die ankers geplaatst.

let UID = 0;

// ---------- kleur- en tekenhulpjes ----------
const hex2rgb = (h) => {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
};
const rgb2hex = (a) =>
  '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => {
  const A = hex2rgb(a), B = hex2rgb(b);
  return rgb2hex(A.map((v, i) => v + (B[i] - v) * t));
};
const lighten = (h, t) => mix(h, '#ffffff', t);
const darken = (h, t) => mix(h, '#000000', t);
const lum = (h) => { const [r, g, b] = hex2rgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const r2 = (v) => Math.round(v * 100) / 100;
const tidy = (s) => s.replace(/-?\d+\.\d{3,}/g, (m) => String(Math.round(parseFloat(m) * 100) / 100));

const OL = '#3b2a47'; // zachte donkere contour voor accessoires
const DARK = '#2a1f33';

const S = (fill, w = 2.5) =>
  `fill="${fill}" stroke="${OL}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const LN = (col, w = 2.5, extra = '') =>
  `fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}`;
// lijn met donkere rand eromheen (voor dunne kaders, kettingen, banden)
const DL = (d, col, w, extra = '') =>
  `<path d="${d}" ${LN(OL, w + 3, extra)}/><path d="${d}" ${LN(col, w, extra)}/>`;

const heartD = 'M0,7 C-15,-3 -9,-14 0,-7 C9,-14 15,-3 0,7Z';
const heart = (x, y, s, fill, rot = 0) =>
  `<path transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" d="${heartD}" fill="${fill}" stroke="${OL}" stroke-width="${r2(2.2 / s)}" stroke-linejoin="round"/>`;
const starPts = (x, y, R, rr, n = 5, rot = -90) => {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    const rad = i % 2 ? rr : R;
    pts.push(`${r2(x + Math.cos(a) * rad)},${r2(y + Math.sin(a) * rad)}`);
  }
  return pts.join(' ');
};
const star5 = (x, y, R, fill, w = 2) =>
  `<polygon points="${starPts(x, y, R, R * 0.48)}" ${S(fill, w)}/>`;
const sparkle = (x, y, s, fill = '#ffe066') =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0,-9 Q1.6,-1.6 9,0 Q1.6,1.6 0,9 Q-1.6,1.6 -9,0 Q-1.6,-1.6 0,-9Z" fill="${fill}" stroke="#e8a21c" stroke-width="${r2(1.4 / s)}" stroke-linejoin="round"/><circle cx="${x - s * 1.5}" cy="${y - s * 1.5}" r="${r2(s * 1.2)}" fill="#fff" opacity=".9"/>`;
const flower = (x, y, r, petal, center = '#ffd94a') => {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * Math.PI / 180;
    s += `<circle cx="${r2(x + Math.cos(a) * r * 0.62)}" cy="${r2(y + Math.sin(a) * r * 0.62)}" r="${r2(r * 0.46)}" ${S(petal, 1.6)}/>`;
  }
  return s + `<circle cx="${x}" cy="${y}" r="${r2(r * 0.34)}" ${S(center, 1.4)}/>`;
};
const blob = (circles, fill, w = 2.5) =>
  circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" ${S(fill, w)}/>`).join('') +
  circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 0.6}" fill="${fill}"/>`).join('');
const mir = (s) => `<g transform="matrix(-1 0 0 1 200 0)">${s}</g>`;
const mirL = (s) => `<g transform="scale(-1 1)">${s}</g>`; // spiegelt om x=0 (accessoires)
const ellD = (cx, cy, rx, ry) =>
  `M${cx - rx},${cy} a${rx},${ry} 0 1,0 ${2 * rx},0 a${rx},${ry} 0 1,0 ${-2 * rx},0Z`;
const drop = (x, y, s, fill = '#8fd6ff') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0,-9 C5,-2 8,2 8,5 A8,8 0 0 1 -8,5 C-8,2 -5,-2 0,-9Z" fill="${fill}" stroke="#4aa3d8" stroke-width="${r2(1.6 / s)}" stroke-linejoin="round"/><ellipse cx="-3" cy="4" rx="1.8" ry="3" fill="#fff" opacity=".85"/></g>`;

function mkCtx() {
  const n = ++UID;
  const c = {
    n, pre: '', defs: [],
    id(k) { return `h${n}${c.pre}${k}`; },
    ref(k) { return `url(#${c.id(k)})`; },
    stops(st) {
      return st.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('');
    },
    lg(k, x1, y1, x2, y2, st) {
      c.defs.push(`<linearGradient id="${c.id(k)}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${c.stops(st)}</linearGradient>`);
      return c.ref(k);
    },
    rg(k, cx, cy, r, st) {
      c.defs.push(`<radialGradient id="${c.id(k)}" cx="${cx}" cy="${cy}" r="${r}">${c.stops(st)}</radialGradient>`);
      return c.ref(k);
    },
    v(k, a, b) { return c.lg(k, 0, 0, 0, 1, [[0, a], [1, b]]); },
    h(k, a, b) { return c.lg(k, 0, 0, 1, 0, [[0, a], [1, b]]); },
    d(k, a, b) { return c.lg(k, 0, 0, 1, 1, [[0, a], [1, b]]); },
    clip(k, inner) {
      c.defs.push(`<clipPath id="${c.id(k)}">${inner}</clipPath>`);
      return c.ref(k);
    },
  };
  return c;
}

// ---------- publieke constanten ----------
export const MOODS = ['blij', 'blijblij', 'neutraal', 'hongerig', 'moe', 'slaap', 'ziek', 'verdrietig', 'vies', 'liefde'];
export const SLOTS = ['hat', 'glasses', 'neck', 'body'];

const P6 = (rows) => rows.map(([id, name, main, accent, belly]) => ({ id, name, main, accent, belly }));

export const SPECIES = [
  { id: 'kat', name: 'Kat', palettes: P6([
    ['oranje', 'Rode kater', '#ffb067', '#e8863a', '#fff1dc'],
    ['grijs', 'Grijze poes', '#bcc3d8', '#8d95b0', '#f1f3fa'],
    ['zwart', 'Zwarte kat', '#6a6482', '#443f5c', '#b4aed0'],
    ['wit', 'Sneeuwkat', '#fff8f2', '#f6c0b0', '#ffffff'],
    ['siamees', 'Siamees', '#f4e3cf', '#8a6a5a', '#fff4e6'],
    ['roze', 'Snoepkat', '#ffc2dc', '#ff8fbd', '#fff0f7'],
  ]) },
  { id: 'hond', name: 'Hond', palettes: P6([
    ['bruin', 'Bruine pup', '#d9a572', '#9b6a3d', '#fff0d9'],
    ['goud', 'Gouden pup', '#f4d08e', '#d9a85b', '#fff6e0'],
    ['zwartwit', 'Zwart-wit', '#fafafa', '#3f3a4a', '#ffffff'],
    ['grijs', 'Grijze pup', '#b8bfc9', '#7d8795', '#f3f5f8'],
    ['vos', 'Vosrood', '#ea9560', '#b9592f', '#ffe9d6'],
    ['blauw', 'Blauwe pup', '#a3c8f2', '#6b97d6', '#eaf3ff'],
  ]) },
  { id: 'konijn', name: 'Konijn', palettes: P6([
    ['wit', 'Wit konijn', '#fff7fb', '#ffc4d6', '#ffffff'],
    ['grijs', 'Grijs konijn', '#cdd0da', '#9aa0b3', '#f4f5f9'],
    ['bruin', 'Bruin konijn', '#cfa176', '#8f6240', '#f6e7d3'],
    ['zwart', 'Zwart konijn', '#6e687c', '#443f55', '#b9b3cc'],
    ['beige', 'Beige konijn', '#f2dcb8', '#e0b98a', '#fff6e6'],
    ['roze', 'Roze konijn', '#ffc3d9', '#ff93b8', '#fff2f7'],
  ]) },
  { id: 'panda', name: 'Panda', palettes: P6([
    ['klassiek', 'Klassiek', '#fffaf5', '#3a3445', '#ffffff'],
    ['rood', 'Rode panda', '#e8834f', '#5a3a35', '#ffe2c8'],
    ['blauw', 'Blauwe panda', '#d3e5ff', '#5a6fb0', '#f4f8ff'],
    ['roze', 'Roze panda', '#ffd9ea', '#d1608f', '#fff5fa'],
    ['bamboe', 'Bamboepanda', '#dcf3d2', '#4d8a52', '#f4fff0'],
    ['goud', 'Gouden panda', '#ffeab0', '#b98a2e', '#fff8dc'],
  ]) },
  { id: 'eend', name: 'Eend', palettes: P6([
    ['geel', 'Geel eendje', '#ffe066', '#ff9f3a', '#fff4b8'],
    ['wit', 'Wit eendje', '#fffdf8', '#ffb25c', '#ffffff'],
    ['blauw', 'Blauw eendje', '#a9d8ff', '#ffb25c', '#e6f4ff'],
    ['roze', 'Roze eendje', '#ffc5dd', '#ff9f6a', '#fff0f6'],
    ['groen', 'Groen eendje', '#c2eaa4', '#ffb25c', '#f1ffe0'],
    ['bruin', 'Wilde eend', '#a98166', '#ffa84d', '#e0c6ae'],
  ]) },
  { id: 'kikker', name: 'Kikker', palettes: P6([
    ['groen', 'Groene kikker', '#8fdc6a', '#5bb04a', '#f3ffd0'],
    ['blauw', 'Blauwe kikker', '#6ac8f0', '#3b8fd0', '#e0f7ff'],
    ['geel', 'Gele kikker', '#ffe26a', '#f0b030', '#fff7cc'],
    ['rood', 'Rode kikker', '#ff9486', '#e5594d', '#ffe9e0'],
    ['paars', 'Paarse kikker', '#cda5f2', '#9068d0', '#f5e9ff'],
    ['mint', 'Muntkikker', '#a8f0d4', '#5cc9a4', '#f0fff9'],
  ]) },
  { id: 'eenhoorn', name: 'Eenhoorn', palettes: P6([
    ['wit', 'Parelwit', '#ffffff', '#ffb3d9', '#fff0fa'],
    ['roze', 'Roze droom', '#ffc6e4', '#c79bff', '#fff2fa'],
    ['lila', 'Lila wolk', '#dbc8ff', '#ff9fd2', '#f6efff'],
    ['blauw', 'Hemelsblauw', '#bfe0ff', '#9fa8ff', '#eef7ff'],
    ['mint', 'Munt', '#c4f5df', '#ffd1a6', '#f2fff9'],
    ['regenboog', 'Regenboog', '#ffeab0', '#ff8fc0', '#fffbe6'],
  ]) },
  { id: 'draak', name: 'Draakje', palettes: P6([
    ['groen', 'Groen draakje', '#82d88e', '#ffb347', '#fff0b8'],
    ['rood', 'Vuurdraakje', '#ff8585', '#ffd166', '#ffe6c4'],
    ['blauw', 'Ijsdraakje', '#82c4ff', '#ffe27a', '#e6f6ff'],
    ['paars', 'Magisch draakje', '#b99aff', '#ffd1f0', '#f2e8ff'],
    ['oranje', 'Zonnedraakje', '#ffb36b', '#ff6f91', '#fff1c9'],
    ['goud', 'Gouden draakje', '#ffd75e', '#ff8a5c', '#fff7d9'],
  ]) },
];

// =====================================================================
//  GEZICHT (gedeeld door alle soorten): ogen, wenkbrauwen, blosjes, mond
// =====================================================================
const MCOL = '#3b2538';
const OPEN_MOODS = ['blij', 'neutraal', 'hongerig', 'ziek', 'verdrietig', 'vies', 'moe'];

const eyeOpen = (x, y, r, o = {}) => {
  const lx = o.lx || 0, ly = o.ly || 0, base = o.base || DARK;
  return `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.18}" fill="${base}"/>` +
    `<ellipse cx="${x + lx * 0.4}" cy="${y + r * 0.45 + ly * 0.3}" rx="${r * 0.62}" ry="${r * 0.48}" fill="#8a76c8" opacity=".5"/>` +
    `<circle cx="${x - r * 0.3 + lx}" cy="${y - r * 0.4 + ly}" r="${r * 0.42}" fill="#fff"/>` +
    `<circle cx="${x + r * 0.4 + lx * 0.5}" cy="${y + r * 0.42}" r="${r * 0.2}" fill="#fff" opacity=".95"/>`;
};
const eyeHalf = (x, y, r, tilt, lc, base) =>
  `<g transform="rotate(${tilt} ${x} ${y})"><path d="M${x - r},${y} A${r},${r * 1.18} 0 0 0 ${x + r},${y}Z" fill="${base}"/>` +
  `<circle cx="${x - r * 0.3}" cy="${y + r * 0.4}" r="${r * 0.3}" fill="#fff"/>` +
  `<path d="M${x - r - 1.5},${y} L${x + r + 1.5},${y}" ${LN(lc, 3)}/></g>`;

function eyeFor(mood, x, y, r, side, lc, base, c) {
  switch (mood) {
    case 'blijblij': return `<path d="M${x - r * 1.05},${y + r * 0.45} Q${x},${y - r * 1.5} ${x + r * 1.05},${y + r * 0.45}" ${LN(lc, 3.4)}/>`;
    case 'slaap': return `<path d="M${x - r * 1.05},${y - r * 0.1} Q${x},${y + r * 1.1} ${x + r * 1.05},${y - r * 0.1}" ${LN(lc, 3.2)}/>` +
      `<path d="M${x - r * 0.9},${y + r * 0.55} l-2,2.4 M${x},${y + r * 0.95} v3 M${x + r * 0.9},${y + r * 0.55} l2,2.4" ${LN(lc, 1.6, 'opacity=".7"')}/>`;
    case 'liefde': {
      const s = r * 0.125;
      return `<path transform="translate(${x} ${y + r * 0.25}) scale(${r2(s * 2.3)})" d="${heartD}" fill="${c.ref('hrt')}" stroke="#c42456" stroke-width="1.1" stroke-linejoin="round"/>` +
        `<ellipse cx="${x - r * 0.4}" cy="${y - r * 0.5}" rx="${r * 0.3}" ry="${r * 0.2}" fill="#fff" opacity=".9" transform="rotate(-30 ${x - r * 0.4} ${y - r * 0.5})"/>`;
    }
    case 'moe': return eyeHalf(x, y - r * 0.15, r, 0, lc, base) +
      `<path d="M${x - r},${y + r * 1.45} Q${x},${y + r * 2} ${x + r},${y + r * 1.45}" ${LN(lc, 1.8, 'opacity=".4"')}/>`;
    case 'ziek': return eyeHalf(x, y - r * 0.1, r * 0.95, side * 13, lc, base);
    case 'hongerig': return eyeOpen(x, y, r, { lx: 1.6, ly: 2, base });
    case 'verdrietig': return eyeOpen(x, y, r * 1.1, { base }) +
      `<ellipse cx="${x}" cy="${y + r * 0.72}" rx="${r * 0.85}" ry="${r * 0.38}" fill="#9fdcff" opacity=".8"/>` +
      `<circle cx="${x - r * 0.35}" cy="${y - r * 0.42}" r="${r * 0.5}" fill="#fff"/>`;
    case 'vies': return eyeOpen(x, y + 1, r * 0.88, { base });
    default: return eyeOpen(x, y, r, { base });
  }
}

function browFor(mood, x, y, r, side, col) {
  const by = y - r * 2.15, w = r * 0.85;
  const outer = x + side * w, inner = x - side * w;
  const L = (a, b, c2, d) => `<path d="M${a},${b} L${c2},${d}" ${LN(col, 2.6)}/>`;
  switch (mood) {
    case 'hongerig': return L(outer, by + 2.5, inner, by - 2.5);
    case 'ziek': return `<path d="M${outer},${by + 2.5} Q${x},${by - 3} ${inner},${by - 3.5}" ${LN(col, 2.6)}/>`;
    case 'verdrietig': return L(outer, by + 4, inner, by - 3.5);
    case 'moe': return L(outer, by + 3.5, inner, by + 1);
    case 'vies': return L(outer, by - 1, inner, by + 3.5);
    case 'liefde': return `<path d="M${x - w},${by + 3} Q${x},${by - 3} ${x + w},${by + 3}" ${LN(col, 2.4)}/>`;
    case 'blij': return `<path d="M${x - w},${by + 3} Q${x},${by - 1.5} ${x + w},${by + 3}" ${LN(col, 2.2, 'opacity=".55"')}/>`;
    default: return '';
  }
}

function mouthFor(mood, x, y, k) {
  const o = (d, extra) => d;
  let m = '';
  switch (mood) {
    case 'blij':
      m = `<path d="M-9,0 Q0,10 9,0" ${LN(MCOL, 2.8)}/><path d="M-9,0 q-2,-1.6 -3.5,-0.4 M9,0 q2,-1.6 3.5,-0.4" ${LN(MCOL, 2.2)}/>`; break;
    case 'blijblij':
      m = `<path d="M-11,-2 Q0,2 11,-2 Q10,14 0,14 Q-10,14 -11,-2Z" fill="${MCOL}" stroke="${MCOL}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M-6.5,11 Q0,5 6.5,11 Q0,15.5 -6.5,11Z" fill="#ff7f9b"/><path d="M-8.5,0.4 Q0,3.5 8.5,0.4 L8,3 Q0,5.5 -8,3Z" fill="#fff"/>`; break;
    case 'neutraal':
      m = `<path d="M-6,2 Q-3,5 0,2 Q3,5 6,2" ${LN(MCOL, 2.6)}/>`; break;
    case 'hongerig':
      m = `<ellipse cx="0" cy="4" rx="4.6" ry="6" fill="${MCOL}"/><ellipse cx="0" cy="7" rx="2.6" ry="2.4" fill="#ff7f9b"/>` +
        `<path d="M7,10 C9,13 10,15 8.6,17 C7,18 5.6,16.4 6,14.6Z" fill="#bfe8ff" stroke="#6fb8e0" stroke-width="1.2" stroke-linejoin="round"/>`; break;
    case 'moe':
      m = `<path d="M-6,3 Q-3,0 0,3 Q3,6 6,3" ${LN(MCOL, 2.6)}/>`; break;
    case 'slaap':
      m = `<ellipse cx="0" cy="3.5" rx="3.2" ry="2.8" fill="${MCOL}"/>` +
        `<g><circle cx="12" cy="-1" r="6" fill="#d8f1ff" fill-opacity=".75" stroke="#7cc3ea" stroke-width="1.6"/><circle cx="10" cy="-3" r="1.8" fill="#fff"/>` +
        `<animateTransform attributeName="transform" type="scale" values="0.85;1.15;0.85" dur="3s" repeatCount="indefinite" additive="sum"/></g>`; break;
    case 'ziek':
      m = `<path d="M-9,4 Q-5,0 -1,4 T7,4" ${LN(MCOL, 2.6)}/>` +
        `<g transform="translate(-2 4) rotate(28)"><rect x="0" y="-3.4" width="38" height="6.8" rx="3.4" fill="#f4fbff" stroke="${OL}" stroke-width="2"/>` +
        `<rect x="2" y="-1.5" width="19" height="3" rx="1.5" fill="#ff5a5a"/><path d="M26,-3.2 v2.4 M30,-3.2 v3 M34,-3.2 v2.4" stroke="${OL}" stroke-width="1" /><circle cx="2.5" cy="0" r="4.4" fill="#ff5a5a" stroke="${OL}" stroke-width="2"/><circle cx="1.4" cy="-1.4" r="1.2" fill="#fff"/></g>`; break;
    case 'verdrietig':
      m = `<path d="M-8,7 Q0,-3 8,7" ${LN(MCOL, 2.8)}/>`; break;
    case 'vies':
      m = `<path d="M-10,3 L-6,-1 L-2,4 L2,-1 L6,4 L10,0" ${LN(MCOL, 2.4)}/>`; break;
    case 'liefde':
      m = `<path d="M-8,0 Q0,2.4 8,0 Q7,11 0,11 Q-7,11 -8,0Z" fill="${MCOL}" stroke="${MCOL}" stroke-width="1.6" stroke-linejoin="round"/><ellipse cx="0" cy="8.4" rx="3.8" ry="2.4" fill="#ff7f9b"/>`; break;
    default: m = `<path d="M-6,2 Q0,6 6,2" ${LN(MCOL, 2.6)}/>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${k})">${m}</g>`;
}

function blushFor(c, mood, S, es) {
  const by = S.blushY, dx = S.eyeDX + S.blushX;
  let col = '#ff7fa0', op = 0.75, sc = 1;
  if (mood === 'ziek') { col = '#8fd45a'; op = 0.9; sc = 1.35; }
  if (mood === 'liefde') { col = '#ff4f80'; op = 0.9; sc = 1.25; }
  if (mood === 'blijblij') { sc = 1.15; }
  if (mood === 'vies') { col = '#b08a55'; op = 0.5; }
  if (mood === 'moe') { op = 0.5; }
  if (mood === 'hongerig') { op = 0.55; }
  const g = c.rg('bl', 0.5, 0.5, 0.5, [[0, col, op], [0.6, col, op * 0.55], [1, col, 0]]);
  const rx = 10.5 * sc * (es > 1.1 ? 1.12 : 1), ry = 6.6 * sc;
  return [100 - dx, 100 + dx].map((x) => `<ellipse cx="${x}" cy="${by}" rx="${rx}" ry="${ry}" fill="${g}"/>`).join('') +
    (mood === 'blij' || mood === 'blijblij' || mood === 'liefde'
      ? [100 - dx, 100 + dx].map((x) => `<path d="M${x - 4},${by + 1} l2,-3 M${x},${by + 1.5} l2,-3 M${x + 4},${by + 1} l2,-3" ${LN('#ff4f80', 1.3, 'opacity=".55"')}/>`).join('') : '');
}

// extra's rond de kop/het lijf (onder = boven het lijf maar onder accessoires; boven = bovenop alles)
function extrasFor(c, mood, AN, es) {
  const under = [];
  const over = [];
  const ey = AN.eyeY, dx = AN.eyeDX;
  switch (mood) {
    case 'blijblij':
      over.push(sparkle(36, 44, 1.15), sparkle(168, 56, 1.0), sparkle(150, 20, 0.8), sparkle(44, 112, 0.7), sparkle(162, 108, 0.65, '#fff2a8'));
      break;
    case 'liefde': {
      over.push(heart(162, 34, 1.15, c.ref('hrt'), 12), heart(40, 48, 0.95, c.ref('hrt'), -14),
        heart(172, 78, 0.65, c.ref('hrt'), 10), heart(30, 86, 0.55, c.ref('hrt'), -8), heart(138, 18, 0.5, c.ref('hrt'), 0));
      break;
    }
    case 'slaap': {
      const z = (x, y, s, o) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="${o}"><path d="M-6,-6 H6 L-6,6 H6" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M-6,-6 H6 L-6,6 H6" fill="none" stroke="#6f7fe8" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></g>`;
      over.push(z(150, 44, 1.5, 1), z(166, 24, 1.05, 0.9), z(178, 10, 0.72, 0.75));
      break;
    }
    case 'moe':
      over.push(drop(AN.eyeDX + 100 + 22, ey - 14, 0.7, '#cfeaff'));
      over.push(`<path d="M146,36 q5,-5 10,0 M156,26 q4,-4 8,0" ${LN('#8a7fb0', 2, 'opacity=".55"')}/>`);
      break;
    case 'ziek':
      over.push(drop(100 + dx + 30, ey - 24, 1.0));
      over.push(`<path d="M38,52 q-6,-5 0,-10 t0,-10 M164,60 q6,-5 0,-10 t0,-10" ${LN('#7bbf4a', 3, 'opacity=".7"')}/>`);
      break;
    case 'verdrietig': {
      const t = (x) => `<path d="M${x},${ey + 8} q${x < 100 ? -3 : 3},9 ${x < 100 ? -1 : 1},19" ${LN('#a6e1ff', 4.2, 'opacity=".95"')}/>` +
        `<path d="M${x},${ey + 8} q${x < 100 ? -3 : 3},9 ${x < 100 ? -1 : 1},19" ${LN('#fff', 1.2, 'opacity=".7"')}/>` +
        drop(x + (x < 100 ? -1 : 1), ey + 33, 0.55);
      over.push(t(100 - dx - 3), t(100 + dx + 3));
      break;
    }
    case 'vies': {
      const blobs = [[58, 74, 6, 4], [142, 70, 5, 3.4], [128, 118, 5.5, 3.6], [84, 160, 7, 4.5], [120, 168, 6, 4], [70, 130, 4.4, 3]];
      under.push(blobs.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#7d5c30" opacity=".6"/><ellipse cx="${x - 1}" cy="${y - 1}" rx="${rx * 0.5}" ry="${ry * 0.5}" fill="#a98450" opacity=".7"/>`).join(''));
      const fly = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><ellipse cx="-2.8" cy="-3.4" rx="4" ry="2.2" fill="#fff" fill-opacity=".8" stroke="#8aa" stroke-width=".8" transform="rotate(-30)"/><ellipse cx="2.8" cy="-3.4" rx="4" ry="2.2" fill="#fff" fill-opacity=".8" stroke="#8aa" stroke-width=".8" transform="rotate(30)"/><ellipse cx="0" cy="0" rx="3" ry="3.8" fill="#2f2a36"/><circle cx="0" cy="-3.6" r="2.2" fill="#2f2a36"/></g>`;
      over.push(`<path d="M30,60 C50,20 88,22 112,34" fill="none" stroke="#777" stroke-width="1.4" stroke-dasharray="2 4" opacity=".6"/>` + fly(116, 36, 40), fly(162, 40, -20),
        `<path d="M148,50 C140,70 160,76 150,98" fill="none" stroke="#777" stroke-width="1.4" stroke-dasharray="2 4" opacity=".55"/>`,
        `<path d="M44,92 q-6,-6 0,-12 t0,-12 M156,100 q6,-6 0,-12 t0,-12" ${LN('#9bc74a', 3, 'opacity=".75"')}/>`);
      break;
    }
    case 'hongerig': {
      over.push(`<path d="M60,148 q-5,8 0,16 M140,148 q5,8 0,16" ${LN(OL, 2.4, 'opacity=".5"')}/>`);
      over.push(`<ellipse cx="158" cy="186" rx="26" ry="4.5" fill="#000" opacity=".12"/>` +
        `<path d="M138,170 Q140,190 158,190 Q176,190 178,170Z" fill="${c.v('bowl', '#ffc2d8', '#ff8fb5')}" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/>` +
        `<ellipse cx="158" cy="170" rx="20.5" ry="6.4" fill="#fff3e8" stroke="${OL}" stroke-width="2.5"/><ellipse cx="158" cy="171" rx="16" ry="3.9" fill="#ecd3bc"/>` +
        `<circle cx="152" cy="171" r="1.3" fill="#c9a98a"/><circle cx="163" cy="172" r="1.1" fill="#c9a98a"/>` +
        `<path d="M146,176 q2,3 5,3" ${LN('#fff', 1.8, 'opacity=".7"')}/>`);
      over.push(`<circle cx="124" cy="62" r="4" ${S('#fff', 2)}/><circle cx="133" cy="50" r="5.5" ${S('#fff', 2)}/>` +
        blob([[148, 32, 17], [135, 38, 12], [163, 38, 12], [150, 44, 12]], '#fff', 2.5) +
        `<g transform="translate(148 36)"><ellipse cx="0" cy="0" rx="9.5" ry="6" fill="#ffae5e" stroke="${OL}" stroke-width="1.8"/><path d="M8,0 L16,-6 L16,6Z" fill="#ff8d3a" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="-4.4" cy="-1.2" r="1.5" fill="${OL}"/><path d="M-1,-5 Q2,-1 -1,5" ${LN('#ffd3a3', 1.4)}/></g>`);
      break;
    }
    default: break;
  }
  return { under: under.join(''), over: over.join('') };
}

function faceParts(c, S, mood, es, blink, onDark) {
  const lc = onDark ? '#fff4ec' : MCOL;
  const base = onDark ? '#120c19' : DARK;
  const ey = S.eyeY, dx = S.eyeDX, r = r2(7.6 * es);
  const xs = [100 - dx, 100 + dx];
  let eyes = xs.map((x, i) => eyeFor(mood, x, ey, r, i === 0 ? -1 : 1, lc, base, c)).join('');
  if (blink && OPEN_MOODS.includes(mood)) {
    eyes = `<g transform="translate(0 ${ey})"><g><animateTransform attributeName="transform" type="scale" values="1 1;1 1;1 0.08;1 1;1 1" keyTimes="0;0.9;0.94;0.98;1" dur="4s" begin="-${r2((c.n * 0.77) % 4)}s" repeatCount="indefinite"/><g transform="translate(0 ${-ey})">${eyes}</g></g></g>`;
  }
  const brows = xs.map((x, i) => browFor(mood, x, ey, r, i === 0 ? -1 : 1, c.ol)).join('');
  return {
    eyes: `<g class="pet-eyes">${eyes}</g>`,
    brows: brows + blushFor(c, mood, S, es),
    mouth: mouthFor(mood, 100, S.mouthY, S.mouthScale || 1),
  };
}

// =====================================================================
//  SOORTEN
// =====================================================================
const oa = (c, w = 3) => `stroke="${c.ol}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const grp = (cls, inner, origin = '50% 100%') =>
  `<g class="${cls}" style="transform-box:fill-box;transform-origin:${origin}">${inner}</g>`;
const shine = (cx, cy, rx, ry, rot, op = 0.3) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="#fff" opacity="${op}"/>`;
const headEl = (c, cx, cy, rx, ry) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c.M}" ${oa(c)}/>` +
  shine(cx - rx * 0.36, cy - ry * 0.5, rx * 0.34, ry * 0.17, -24);

function bodyBase(c, o = {}) {
  const feetFill = o.feet || c.M, armFill = o.arms || c.M;
  const feet = o.customFeet || [76, 124].map((x) => `<ellipse cx="${x}" cy="177" rx="15" ry="8" fill="${feetFill}" ${oa(c)}/>`).join('');
  const torso = `<ellipse cx="100" cy="152" rx="38" ry="32" fill="${c.M}" ${oa(c)}/>` +
    shine(80, 134, 13, 6, -28, 0.22);
  const belly = o.noBelly ? '' : `<ellipse cx="100" cy="158" rx="${o.bellyRx || 24}" ry="${o.bellyRy || 21}" fill="${c.B}" opacity=".96"/>`;
  const arms = o.customArms || `<ellipse cx="62" cy="150" rx="9" ry="14" transform="rotate(16 62 150)" fill="${armFill}" ${oa(c)}/>` +
    `<ellipse cx="138" cy="150" rx="9" ry="14" transform="rotate(-16 138 150)" fill="${armFill}" ${oa(c)}/>`;
  return (o.beforeTorso || '') + feet + torso + belly + (o.afterBelly || '') + arms;
}

const SPECIES_DRAW = {
  kat(c, P) {
    const ear = `<path d="M47,74 Q42,36 51,22 Q58,19 66,28 L91,47Z" fill="${c.M}" ${oa(c)}/><path d="M54,62 Q51,41 56,32 Q60,32 67,39 L79,49Z" fill="#ffb3c6"/>`;
    const tail = `<path d="M128,170 C168,176 188,148 172,114" ${LN(c.ol, 20)}/><path d="M128,170 C168,176 188,148 172,114" ${LN(P.main, 14)}/>` +
      `<path d="M180,138 C181,128 178,121 172,114" ${LN(P.accent, 14)}/><path d="M156,172 q4,-6 3,-14 M172,162 q5,-4 6,-10" ${LN(P.accent, 3.5, 'opacity=".7"')}/>`;
    return {
      back: grp('pet-tail', tail, '0% 100%') + grp('pet-ears', ear + mir(ear)),
      body: bodyBase(c),
      head: headEl(c, 100, 88, 56, 47) +
        `<path d="M100,43 L100,57 M88,45 L90,57 M112,45 L110,57" ${LN(P.accent, 4.4, 'opacity=".85"')}/>` +
        `<ellipse cx="100" cy="109" rx="21" ry="14" fill="${c.B}" opacity=".95"/>`,
      deco: `<path d="M95,98.5 Q100,95.5 105,98.5 Q103,104.5 100,105.5 Q97,104.5 95,98.5Z" fill="#ff8fa8" ${oa(c, 1.8)}/>` +
        `<path d="M100,105.5 L100,108" ${LN(c.ol, 1.8)}/>` +
        `<path d="M66,104 L40,98 M66,108 L38,110 M66,112 L42,122 M134,104 L160,98 M134,108 L162,110 M134,112 L158,122" ${LN(c.ol, 1.8, 'opacity=".55"')}/>`,
    };
  },

  hond(c, P) {
    const ear = `<ellipse cx="41" cy="94" rx="16" ry="30" transform="rotate(12 41 94)" fill="${c.A}" ${oa(c)}/>`;
    const tail = `<ellipse cx="148" cy="160" rx="9" ry="16" transform="rotate(38 148 160)" fill="${c.M}" ${oa(c)}/>`;
    return {
      back: grp('pet-tail', tail, '10% 90%') + grp('pet-ears', ear + mir(ear)),
      body: bodyBase(c),
      head: headEl(c, 100, 88, 56, 47) +
        `<ellipse cx="126" cy="88" rx="20" ry="19" fill="${c.A}" opacity=".95"/>` +
        `<ellipse cx="100" cy="110" rx="28" ry="20" fill="${c.B}" opacity=".97"/>`,
      deco: `<path d="M90,98 Q100,91 110,98 Q109,107 100,108 Q91,107 90,98Z" fill="#3a2d44" ${oa(c, 2)}/><ellipse cx="96" cy="97" rx="3.4" ry="1.7" fill="#fff" opacity=".6"/>` +
        `<path d="M100,108 L100,113" ${LN(c.ol, 2)}/>`,
    };
  },

  konijn(c, P) {
    const ear = `<ellipse cx="66" cy="34" rx="14" ry="32" transform="rotate(-12 66 34)" fill="${c.M}" ${oa(c)}/><ellipse cx="66" cy="36" rx="7" ry="23" transform="rotate(-12 66 34)" fill="#ffb3c9"/>`;
    const tail = `<circle cx="146" cy="170" r="12" fill="${c.B}" ${oa(c)}/><circle cx="143" cy="166" r="3.5" fill="#fff" opacity=".7"/>`;
    return {
      back: grp('pet-tail', tail, '0% 100%') + grp('pet-ears', ear + mir(ear)),
      body: bodyBase(c),
      head: headEl(c, 100, 88, 56, 47) + `<ellipse cx="100" cy="108" rx="20" ry="13.5" fill="${c.B}" opacity=".95"/>`,
      deco: `<path d="M95,97.5 Q100,94.5 105,97.5 Q103,103.5 100,104.5 Q97,103.5 95,97.5Z" fill="#ff8fae" ${oa(c, 1.8)}/>` +
        `<path d="M100,104.5 L100,107.5" ${LN(c.ol, 1.8)}/>`,
    };
  },

  panda(c, P) {
    const ear = `<circle cx="56" cy="50" r="16" fill="${c.A}" ${oa(c)}/><circle cx="57" cy="52" r="8" fill="${lighten(P.accent, 0.3)}" opacity=".8"/>`;
    const patch = (x, rot) => `<ellipse cx="${x}" cy="95" rx="15.5" ry="19.5" transform="rotate(${rot} ${x} 95)" fill="${c.A}"/>`;
    return {
      back: grp('pet-ears', ear + mir(ear)),
      body: bodyBase(c, { feet: c.A, arms: c.A, afterBelly: '' }),
      head: headEl(c, 100, 88, 56, 47) + patch(75, 22) + patch(125, -22) +
        `<ellipse cx="100" cy="109" rx="21" ry="14" fill="${c.B}" opacity=".97"/>`,
      deco: `<path d="M92,98.5 Q100,94 108,98.5 Q106,106 100,107 Q94,106 92,98.5Z" fill="#3a2d44" ${oa(c, 1.8)}/><ellipse cx="97" cy="98" rx="3" ry="1.5" fill="#fff" opacity=".55"/>` +
        `<path d="M100,107 L100,110" ${LN(c.ol, 1.8)}/>`,
      patchEyes: true,
    };
  },

  eend(c, P) {
    const wing = `<ellipse cx="60" cy="150" rx="10.5" ry="17" transform="rotate(24 60 150)" fill="${c.M}" ${oa(c)}/><path d="M55,152 q2,6 5,8" ${LN(c.ol, 1.6, 'opacity=".4"')}/>`;
    const tail = `<path d="M134,166 Q152,162 160,146 Q162,166 150,177 Q141,178 134,172Z" fill="${c.M}" ${oa(c)}/>`;
    const feet = [74, 126].map((x) => `<path d="M${x - 19},183 Q${x - 16},171 ${x},171 Q${x + 16},171 ${x + 19},183 Q${x + 12},187 ${x + 6},183 Q${x},188 ${x - 6},183 Q${x - 12},187 ${x - 19},183Z" fill="${c.A}" ${oa(c)}/>`).join('');
    return {
      back: grp('pet-tail', tail, '0% 100%'),
      body: bodyBase(c, { customFeet: feet, customArms: grp('pet-ears', wing + mir(wing)) }),
      head: headEl(c, 100, 88, 55, 46) +
        `<path d="M100,45 C92,28 106,22 111,29 C106,31 106,38 100,45Z M104,44 C104,33 116,30 118,36 C113,37 111,42 104,44Z" fill="${c.M}" ${oa(c, 2.4)}/>` +
        `<path d="M110,31 q4,0 6,3" ${LN('#fff', 1.6, 'opacity=".5"')}/>`,
      deco: `<ellipse cx="100" cy="111.5" rx="15" ry="6.5" fill="${c.A}" ${oa(c, 2.4)}/>` +
        `<ellipse cx="100" cy="105" rx="19" ry="10" fill="${c.A}" ${oa(c, 2.6)}/>` +
        `<ellipse cx="94" cy="101" rx="9" ry="3" fill="#fff" opacity=".35"/>` +
        `<circle cx="93.5" cy="103" r="1.4" fill="${c.ol}" opacity=".7"/><circle cx="106.5" cy="103" r="1.4" fill="${c.ol}" opacity=".7"/>`,
    };
  },

  kikker(c, P) {
    const toes = (x) => [-11, 0, 11].map((d, i) => `<circle cx="${x + d}" cy="${i === 1 ? 183 : 181}" r="5" fill="${c.M}" ${oa(c, 2.4)}/>`).join('');
    const feet = [72, 128].map((x) => toes(x) + `<ellipse cx="${x}" cy="176" rx="19" ry="8.5" fill="${c.M}" ${oa(c)}/>`).join('');
    const thighs = `<ellipse cx="62" cy="158" rx="17" ry="21" transform="rotate(-24 62 158)" fill="${c.A}" ${oa(c)}/><ellipse cx="138" cy="158" rx="17" ry="21" transform="rotate(24 138 158)" fill="${c.A}" ${oa(c)}/>`;
    const bulge = (x) => `<circle cx="${x}" cy="58" r="22" fill="${c.M}" ${oa(c)}/>` + shine(x - 8, 46, 8, 4, -30, 0.3);
    return {
      back: '',
      body: bodyBase(c, { customFeet: feet, beforeTorso: thighs, bellyRx: 26, bellyRy: 24 }),
      head: `<ellipse cx="100" cy="98" rx="58" ry="40" fill="${c.M}" ${oa(c)}/>` + shine(70, 84, 18, 6, -14, 0.25) +
        bulge(68) + bulge(132) +
        `<circle cx="58" cy="44" r="3.2" fill="${c.A}" opacity=".8"/><circle cx="76" cy="40" r="2.4" fill="${c.A}" opacity=".8"/><circle cx="124" cy="40" r="2.4" fill="${c.A}" opacity=".8"/><circle cx="142" cy="44" r="3.2" fill="${c.A}" opacity=".8"/>`,
      deco: `<circle cx="94" cy="92" r="1.6" fill="${c.ol}" opacity=".7"/><circle cx="106" cy="92" r="1.6" fill="${c.ol}" opacity=".7"/>`,
    };
  },

  eenhoorn(c, P) {
    const horn = `<path d="M100,5 L89,47 L111,47Z" fill="${c.v('horn', '#fff0a8', '#ffb93d')}" ${oa(c, 2.8)}/>` +
      `<path d="M93,37 Q100,42 107,35 M95,27 Q100,31 105,25 M97,17 Q100,20 103,15" ${LN('#d98a1e', 2.2)}/><path d="M95,44 L99,10" ${LN('#fff', 1.6, 'opacity=".6"')}/>`;
    const ear = `<path d="M62,56 L58,28 Q72,28 82,46Z" fill="${c.M}" ${oa(c)}/><path d="M64,50 L62,36 Q69,37 74,45Z" fill="#ffb3c9"/>`;
    const mane = `<path d="M52,58 C34,66 28,96 36,124 C42,132 52,126 54,116 C50,100 52,80 60,66Z" fill="${c.A}" ${oa(c)}/><path d="M46,74 q-6,16 -2,32" ${LN(lighten(P.accent, 0.5), 3, 'opacity=".8"')}/>`;
    const tail = `<path d="M130,168 C172,178 188,146 168,122" ${LN(c.ol, 22)}/><path d="M130,168 C172,178 188,146 168,122" ${LN(P.accent, 16)}/>` +
      `<path d="M134,166 C170,172 182,148 166,126" ${LN(lighten(P.accent, 0.55), 5, 'opacity=".85"')}/><path d="M176,142 C176,134 173,128 168,122" ${LN(mix(P.accent, '#9fd8ff', 0.6), 16)}/>`;
    const hoof = (x) => `<path d="M${x - 14},178 a14,7 0 0 0 28,0Z" fill="#ffd86b" stroke="${c.ol}" stroke-width="2" stroke-linejoin="round"/>`;
    const feet = [76, 124].map((x) => `<ellipse cx="${x}" cy="177" rx="15" ry="8" fill="${c.M}" ${oa(c)}/>${hoof(x)}`).join('');
    return {
      back: grp('pet-tail', tail, '0% 100%') + mane + mir(mane) + horn + grp('pet-ears', ear + mir(ear)),
      body: bodyBase(c, { customFeet: feet, afterBelly: star5(120, 150, 6.5, '#ffd86b', 1.6) }),
      head: headEl(c, 100, 88, 56, 47) +
        `<path d="M92,40 C112,32 142,48 139,80 C133,63 118,57 100,57 C88,57 80,49 92,40Z" fill="${c.A}" ${oa(c)}/>` +
        `<path d="M104,44 C121,44 132,54 134,68" ${LN(lighten(P.accent, 0.55), 3.2, 'opacity=".9"')}/>` +
        `<ellipse cx="100" cy="109" rx="20" ry="13.5" fill="${c.B}" opacity=".95"/>`,
      deco: `<circle cx="94.5" cy="104" r="1.6" fill="#ff8fa8"/><circle cx="105.5" cy="104" r="1.6" fill="#ff8fa8"/>`,
    };
  },

  draak(c, P) {
    const horn = `<path d="M62,60 Q52,34 60,12 Q77,22 86,52Z" fill="${c.A}" ${oa(c)}/><path d="M64,50 Q60,34 62,22" ${LN('#fff', 2, 'opacity=".5"')}/>`;
    const fin = `<path d="M48,86 L22,72 L30,86 L18,98 L32,101 L26,114 L48,106Z" fill="${c.A}" ${oa(c, 2.6)}/>`;
    const wing = `<path d="M128,136 C142,112 164,96 190,90 C186,100 192,106 184,114 C186,122 178,128 170,127 C168,137 156,141 146,143Z" fill="${c.v('wing', lighten(P.accent, 0.35), P.accent)}" ${oa(c)}/>` +
      `<path d="M131,134 C152,116 172,104 187,92 M154,126 L168,128 M146,124 L158,112" ${LN(c.ol, 2, 'opacity=".55"')}/>`;
    const tail = `<path d="M126,170 C162,182 192,162 180,128" ${LN(c.ol, 22)}/><path d="M126,170 C162,182 192,162 180,128" ${LN(P.main, 16)}/>` +
      `<path d="M180,112 L193,134 L168,132Z" fill="${c.A}" ${oa(c, 2.6)}/>`;
    const stripes = [146, 156, 166].map((y, i) => `<path d="M${78 + i * 2},${y} Q100,${y + 7} ${122 - i * 2},${y}" ${LN(darken(P.belly, 0.18), 2.4, 'opacity=".7"')}/>`).join('');
    return {
      back: grp('pet-tail', tail, '0% 100%') + grp('pet-wings', wing + mir(wing), '50% 100%') + grp('pet-ears', horn + mir(horn) + fin + mir(fin)),
      body: bodyBase(c, { afterBelly: stripes }),
      head: headEl(c, 100, 88, 56, 47) + `<ellipse cx="100" cy="109" rx="26" ry="16.5" fill="${lighten(P.main, 0.34)}" opacity=".95"/>`,
      deco: `<ellipse cx="92" cy="102" rx="2.3" ry="2.9" fill="${c.ol}" opacity=".85"/><ellipse cx="108" cy="102" rx="2.3" ry="2.9" fill="${c.ol}" opacity=".85"/>`,
    };
  },
};

// ankers per soort (alles in het lokale 200x200 stelsel, voor stage-schaling)
const BASE_A = { hx: 100, hatY: 41, hatS: 1, eyeY: 92, eyeDX: 24, mouthY: 111, blushX: 17, blushY: 106, mouthScale: 1, neckY: 136, neckW: 34, chestY: 152, bodyW: 40 };
const SPDEF = {
  kat: { a: {}, corr: {} },
  hond: { a: { mouthY: 115, blushY: 109 }, corr: {} },
  konijn: { a: { hatS: 0.9, mouthY: 112, hatY: 43 }, corr: {} },
  panda: { a: { eyeDX: 25, eyeY: 94, mouthY: 113, blushX: 20 }, corr: {} },
  eend: { a: { eyeY: 86, eyeDX: 26, mouthY: 107, mouthScale: 0.8, blushY: 100, hatY: 43, hatS: 0.96, blushX: 18 }, corr: {} },
  kikker: { a: { eyeY: 58, eyeDX: 32, mouthY: 113, mouthScale: 1.4, blushX: 14, blushY: 104, hatY: 38, hatS: 0.98, neckY: 138 }, corr: { hat: { dy: -2 }, glasses: { s: 0.8 } } },
  eenhoorn: { a: { mouthY: 112, hatS: 0.82 }, corr: { hat: { dx: -27, dy: 3, rot: -17 } } },
  draak: { a: { eyeY: 90, mouthY: 114, hatY: 42, hatS: 0.92, blushY: 108 }, corr: { hat: { dy: -1 } } },
};

// =====================================================================
//  ACCESSOIRES
//  Hoeden:   oorsprong = kruin (midden bovenop het hoofd), tekening groeit omhoog (y<0)
//  Brillen:  oorsprong = midden tussen de ogen, lenzen op x=+-22
//  Hals:     oorsprong = midden van de nek (onder de kin), halfbreedte ~34
//  Lijf:     oorsprong = midden van het lijf, halfbreedte ~40, {back, front}
// =====================================================================
export const ACCESSORIES = {
  hat: [
    { id: 'strik', name: 'Roze strikje', price: 15, minLevel: 1 },
    { id: 'petje', name: 'Sportpetje', price: 20, minLevel: 1 },
    { id: 'hoofdband', name: 'Hoofdband', price: 25, minLevel: 1 },
    { id: 'haarspeldjes', name: 'Haarspeldjes', price: 30, minLevel: 1 },
    { id: 'bloemenkrans', name: 'Bloemenkrans', price: 40, minLevel: 2 },
    { id: 'pompommuts', name: 'Muts met bobbel', price: 45, minLevel: 2 },
    { id: 'feesthoed', name: 'Feesthoedje', price: 55, minLevel: 2 },
    { id: 'baret', name: 'Baret', price: 65, minLevel: 3 },
    { id: 'koksmuts', name: 'Koksmuts', price: 75, minLevel: 3 },
    { id: 'helm', name: 'Bouwhelm', price: 85, minLevel: 4 },
    { id: 'cowboyhoed', name: 'Cowboyhoed', price: 100, minLevel: 4 },
    { id: 'piratenhoed', name: 'Piratenhoed', price: 115, minLevel: 5 },
    { id: 'hogehoed', name: 'Hoge hoed', price: 130, minLevel: 6 },
    { id: 'heksenhoed', name: 'Heksenhoed', price: 150, minLevel: 7 },
    { id: 'tovenaarshoed', name: 'Tovenaarshoed', price: 175, minLevel: 8 },
    { id: 'kroon', name: 'Gouden kroon', price: 210, minLevel: 10 },
    { id: 'aureool', name: 'Engelenaureool', price: 250, minLevel: 12 },
  ],
  glasses: [
    { id: 'rond', name: 'Ronde bril', price: 30, minLevel: 1 },
    { id: 'zonnebril', name: 'Zonnebril', price: 45, minLevel: 1 },
    { id: 'hartjesbril', name: 'Hartjesbril', price: 60, minLevel: 2 },
    { id: 'nerdbril', name: 'Nerdbril', price: 75, minLevel: 3 },
    { id: 'driedbril', name: '3D-bril', price: 90, minLevel: 4 },
    { id: 'monocle', name: 'Monocle', price: 110, minLevel: 5 },
    { id: 'skibril', name: 'Skibril', price: 130, minLevel: 6 },
    { id: 'sterbril', name: 'Sterrenbril', price: 155, minLevel: 8 },
    { id: 'ooglap', name: 'Piratenooglap', price: 185, minLevel: 9 },
    { id: 'masker', name: 'Superheldenmasker', price: 220, minLevel: 11 },
  ],
  neck: [
    { id: 'sjaal', name: 'Gestreepte sjaal', price: 20, minLevel: 1 },
    { id: 'vlinderdas', name: 'Vlinderdas', price: 30, minLevel: 1 },
    { id: 'stropdas', name: 'Stropdas', price: 40, minLevel: 2 },
    { id: 'bandana', name: 'Bandana', price: 50, minLevel: 2 },
    { id: 'hartketting', name: 'Ketting met hart', price: 65, minLevel: 3 },
    { id: 'belletje', name: 'Belletje', price: 80, minLevel: 4 },
    { id: 'medaillon', name: 'Medaillon', price: 95, minLevel: 4 },
    { id: 'bloemenketting', name: 'Bloemenketting', price: 110, minLevel: 5 },
    { id: 'pluchenkraag', name: 'Pluchen kraag', price: 130, minLevel: 6 },
    { id: 'medaille', name: 'Gouden medaille', price: 160, minLevel: 8 },
    { id: 'parels', name: 'Parelketting', price: 190, minLevel: 10 },
    { id: 'diamanten', name: 'Diamanten hanger', price: 240, minLevel: 12 },
  ],
  body: [
    { id: 'trui', name: 'Gestreepte trui', price: 35, minLevel: 1 },
    { id: 'schort', name: 'Bakkersschort', price: 50, minLevel: 2 },
    { id: 'regenjas', name: 'Regenjas', price: 65, minLevel: 3 },
    { id: 'jasje', name: 'Chic jasje', price: 80, minLevel: 3 },
    { id: 'hoodie', name: 'Hoodie', price: 95, minLevel: 4 },
    { id: 'zwemband', name: 'Zwemband', price: 110, minLevel: 5 },
    { id: 'rugzakje', name: 'Rugzakje', price: 125, minLevel: 5 },
    { id: 'tutu', name: 'Tutu', price: 140, minLevel: 6 },
    { id: 'piratenjas', name: 'Piratenjas', price: 160, minLevel: 7 },
    { id: 'cape', name: 'Koningscape', price: 190, minLevel: 8 },
    { id: 'superheldencape', name: 'Superheldencape', price: 215, minLevel: 9 },
    { id: 'vleugels', name: 'Engelenvleugels', price: 250, minLevel: 11 },
  ],
};

// ---------------- hoeden ----------------
const HAT = {
  strik(c) {
    const g = c.d('a', '#ffa6c6', '#ff5f93'), k = c.d('b', '#ff86b0', '#e0457b');
    return `<g transform="translate(20 4) rotate(16)">` +
      `<path d="M0,0 C-8,-20 -32,-16 -29,0 C-28,13 -9,11 0,0Z" ${S(g)}/><path d="M0,0 C8,-20 32,-16 29,0 C28,13 9,11 0,0Z" ${S(g)}/>` +
      `<path d="M-23,-7 Q-18,-11 -11,-6 M-22,4 Q-17,7 -10,4" ${LN('#ffd6e5', 1.8, 'opacity=".85"')}/>` +
      `<path d="M-3,6 L-10,22 L-1,17 L0,8Z M3,6 L10,22 L1,17 L0,8Z" ${S(k, 2)}/>` +
      `<circle cx="0" cy="0" r="6.6" ${S(k)}/><circle cx="-2" cy="-2" r="1.9" fill="#fff" opacity=".75"/></g>`;
  },
  petje(c) {
    const g = c.v('a', '#6fb5ff', '#3b82e0'), b = c.v('b', '#4f95ee', '#2763c0');
    return `<path d="M-41,13 C-45,-22 -16,-32 0,-32 C16,-32 45,-22 41,13Z" ${S(g)}/>` +
      `<path d="M0,-32 L0,12 M-20,-28 Q-15,-8 -16,12 M20,-28 Q15,-8 16,12" ${LN('#2763c0', 1.6, 'opacity=".55"')}/>` +
      `<circle cx="0" cy="-33" r="3.8" ${S('#2763c0', 2)}/>` +
      `<path d="M-44,12 Q0,30 44,12 Q40,4 0,5 Q-40,4 -44,12Z" ${S(b)}/>` +
      `<path d="M-30,8 Q-10,13 8,10" ${LN('#fff', 2, 'opacity=".45"')}/>` + star5(0, -14, 8, '#ffe066', 1.8) +
      `<path d="M-30,-22 Q-22,-28 -12,-29" ${LN('#fff', 2.4, 'opacity=".5"')}/>`;
  },
  hoofdband(c) {
    const d = 'M-47,23 Q-30,5 0,4 Q30,5 47,23';
    return DL(d, '#ff6f9b', 7) + `<path d="${d}" transform="translate(0 -1.8)" ${LN('#ffc0d4', 1.8, 'opacity=".85"')}/>` +
      star5(0, 3, 9, '#ffe066', 1.8) + heart(-28, 11, 0.62, '#fff', -12) + heart(28, 11, 0.62, '#fff', 12);
  },
  haarspeldjes(c) {
    const clip = (x, y, rot, col, gem) =>
      `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-14" y="-6" width="28" height="5.2" rx="2.6" ${S(col, 2)}/><rect x="-14" y="1" width="28" height="5.2" rx="2.6" ${S(col, 2)}/>` +
      `<circle cx="9" cy="0" r="5" ${S(gem, 1.8)}/><circle cx="7.6" cy="-1.4" r="1.4" fill="#fff"/></g>`;
    return clip(-30, 14, -42, '#ffb7d1', '#ff6f9b') + clip(-18, 3, -26, '#b9e4ff', '#4aa3e8') + clip(30, 12, 40, '#ffe58a', '#ff9f3a');
  },
  bloemenkrans(c) {
    const cols = ['#ff8fb5', '#ffffff', '#ffd94a', '#c9a0ff', '#ff9f6a'];
    let leaves = '', fl = '';
    for (let i = 0; i < 11; i++) {
      const t = ((-66 + i * 13.2) * Math.PI) / 180;
      const x = r2(53 * Math.sin(t)), y = r2(46 * (1 - Math.cos(t)) - 2);
      leaves += `<ellipse transform="translate(${x} ${y}) rotate(${r2(t * 57.3 + 50)})" cx="0" cy="9" rx="4" ry="8.5" ${S('#7ccf72', 1.6)}/>`;
      fl += flower(x, y, 8, cols[i % 5], i % 2 ? '#ff9f6a' : '#ffd94a');
    }
    return leaves + fl;
  },
  pompommuts(c) {
    const g = c.v('a', '#9fe3d6', '#4fc1ad');
    let ribs = '';
    for (let x = -36; x <= 36; x += 8) ribs += `M${x},6 v14 `;
    return `<path d="M-41,16 C-45,-20 -20,-30 0,-30 C20,-30 45,-20 41,16Z" ${S(g)}/>` +
      `<path d="M-30,-14 Q-18,-24 -4,-25" ${LN('#fff', 2.4, 'opacity=".5"')}/>` +
      `<rect x="-44" y="3" width="88" height="18" rx="8" ${S(c.v('b', '#fff3d6', '#ffd9a0'))}/>` +
      `<path d="${ribs}" ${LN('#e0b878', 1.6, 'opacity=".7"')}/>` +
      blob([[0, -37, 10], [-9, -33, 8], [9, -33, 8], [0, -45, 8], [-8, -42, 7], [8, -42, 7]], '#fff', 2.2) +
      `<circle cx="-3" cy="-40" r="2.4" fill="#e6f0ff"/><circle cx="5" cy="-36" r="2" fill="#e6f0ff"/>`;
  },
  feesthoed(c) {
    const cone = 'M-27,10 Q0,19 27,10 L0,-62Z';
    const g = c.d('a', '#b88bff', '#6a4de0'), cl = c.clip('c', `<path d="${cone}"/>`);
    let st = '';
    for (let i = -3; i <= 4; i++) st += `<path d="M${-44 + i * 15},24 L${-14 + i * 15},-72" ${LN('#ffd94a', 5)}/>`;
    return `<g transform="rotate(-12)"><path d="${cone}" fill="${g}"/><g clip-path="${cl}">${st}` +
      `<circle cx="-8" cy="-10" r="2.6" fill="#ff8fb5"/><circle cx="8" cy="-26" r="2.6" fill="#7fe0ff"/><circle cx="-4" cy="-38" r="2.2" fill="#ff8fb5"/><circle cx="10" cy="-4" r="2.4" fill="#7fe0ff"/></g>` +
      `<path d="${cone}" fill="none" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/>` +
      `<path d="M-14,-4 L-2,-52" ${LN('#fff', 2.2, 'opacity=".4"')}/>` +
      blob([[0, -64, 6.5], [-5, -61, 5], [5, -61, 5], [0, -70, 5]], '#ffd94a', 2) + `</g>`;
  },
  baret(c) {
    const g = c.d('a', '#ff7f8f', '#d9384f');
    return `<g transform="translate(-4 0) rotate(-6)"><path d="M-42,8 C-48,-14 -14,-28 16,-24 C42,-20 50,-2 38,8 C20,15 -18,15 -42,8Z" ${S(g)}/>` +
      `<rect x="1" y="-31" width="7" height="9" rx="3.2" ${S('#b82b40', 2)}/>` +
      `<path d="M-30,-6 Q-12,-18 8,-17 M-36,2 Q-28,-4 -22,-4" ${LN('#ffb3bf', 2.2, 'opacity=".65"')}/>` +
      `<path d="M-40,8 C-20,14 20,14 38,8" ${LN('#a82339', 2.4)}/></g>`;
  },
  koksmuts(c) {
    const g = c.v('a', '#ffffff', '#e9eef7');
    return blob([[-23, -13, 16], [0, -24, 19], [23, -13, 16], [-10, -23, 13], [11, -23, 13]], g, 2.5) +
      `<path d="M-32,-12 Q-26,-22 -18,-24 M-6,-34 Q2,-38 10,-35" ${LN('#cfd8ea', 2)}/>` +
      `<path d="M-31,-3 H31 L29,14 Q0,22 -29,14Z" ${S(g)}/>` +
      `<path d="M-14,0 L-13,17 M0,1 L0,19 M14,0 L13,17" ${LN('#cfd8ea', 1.8)}/>`;
  },
  helm(c) {
    const g = c.d('a', '#ffe35f', '#ffb21f');
    return `<path d="M-42,14 C-46,-22 -20,-34 0,-34 C20,-34 46,-22 42,14Z" ${S(g)}/>` +
      `<rect x="-8" y="-36" width="16" height="48" rx="4" ${S(c.v('b', '#ffcf3d', '#f19a12'), 2)}/>` +
      `<path d="M-52,13 Q0,26 52,13 Q54,5 46,5 L-46,5 Q-54,5 -52,13Z" ${S(c.v('c', '#ffd23f', '#e8930e'))}/>` +
      `<path d="M-32,-16 Q-24,-26 -14,-29" ${LN('#fff', 2.6, 'opacity=".6"')}/>` +
      `<circle cx="-24" cy="-2" r="2.2" fill="#e8930e"/><circle cx="24" cy="-2" r="2.2" fill="#e8930e"/>`;
  },
  cowboyhoed(c) {
    const g = c.v('a', '#c98a52', '#8f5a2c'), b = c.v('b', '#d89a5e', '#9c6330');
    return `<path d="M-60,2 C-58,16 -26,12 0,12 C26,12 58,16 60,2 C62,-10 46,-4 38,-3 L-38,-3 C-46,-4 -62,-10 -60,2Z" ${S(b)}/>` +
      `<path d="M-32,0 C-37,-24 -24,-32 -9,-27 C-4,-25 4,-25 9,-27 C24,-32 37,-24 32,0Z" ${S(g)}/>` +
      `<path d="M-33,-4 Q0,4 33,-4 L33,3 Q0,11 -33,3Z" ${S('#6b3a1c', 2)}/>` +
      star5(0, 0, 4.6, '#ffd94a', 1.2) +
      `<path d="M-22,-14 Q-18,-24 -9,-24" ${LN('#fff', 2.2, 'opacity=".4"')}/>` +
      `<path d="M-52,6 Q-30,11 -6,10" ${LN('#fff', 2, 'opacity=".25"')}/>`;
  },
  piratenhoed(c) {
    const g = c.v('a', '#4a4560', '#1c1826');
    return `<path d="M-58,12 C-44,-32 -12,-36 0,-30 C12,-36 44,-32 58,12 C32,3 -32,3 -58,12Z" ${S(g)}/>` +
      `<path d="M-52,9 C-30,2 30,2 52,9" ${LN('#ffd94a', 2.6)}/>` +
      `<circle cx="0" cy="-12" r="8" ${S('#fff', 1.8)}/><rect x="-4.6" y="-5" width="9.2" height="5" rx="1.8" ${S('#fff', 1.6)}/>` +
      `<circle cx="-3" cy="-13" r="2" fill="${OL}"/><circle cx="3" cy="-13" r="2" fill="${OL}"/>` +
      `<path d="M-36,-16 Q-24,-26 -12,-27" ${LN('#fff', 2.2, 'opacity=".25"')}/>`;
  },
  hogehoed(c) {
    const g = c.h('a', '#4b4660', '#1e1a29');
    return `<ellipse cx="0" cy="6" rx="44" ry="9" ${S(c.v('b', '#403b55', '#1a1624'))}/>` +
      `<path d="M-27,6 L-27,-44 L27,-44 L27,6 Q0,14 -27,6Z" ${S(g)}/>` +
      `<ellipse cx="0" cy="-44" rx="27" ry="7" ${S('#5a5472')}/>` +
      `<path d="M-27,-4 Q0,4 27,-4 L27,5 Q0,13 -27,5Z" ${S('#d9384f', 2)}/>` +
      `<rect x="-6" y="-4" width="12" height="11" rx="2" ${S('#ffd94a', 1.8)}/><rect x="-2.6" y="-1.6" width="5.2" height="6.4" rx="1" fill="#d9384f"/>` +
      `<path d="M-19,-36 L-19,-8" ${LN('#fff', 2.4, 'opacity=".25"')}/>`;
  },
  heksenhoed(c) {
    const g = c.d('a', '#9b6bd8', '#5a2f9c');
    return `<ellipse cx="0" cy="8" rx="52" ry="10" ${S(c.v('b', '#6d3bb0', '#3f1f73'))}/>` +
      `<path d="M-27,8 L-8,-34 Q0,-50 22,-62 Q10,-44 13,-34 L27,8 Q0,16 -27,8Z" ${S(g)}/>` +
      `<path d="M-26,-2 Q0,6 26,-2 L27,8 Q0,16 -27,8Z" ${S('#2e1a52', 2)}/>` +
      `<rect x="-7" y="0" width="14" height="12" rx="2.4" ${S('#ffd94a', 1.8)}/><rect x="-3.4" y="3.2" width="6.8" height="5.6" rx="1" fill="#2e1a52"/>` +
      star5(-4, -22, 5, '#ffe066', 1.2) + `<circle cx="6" cy="-34" r="1.8" fill="#ffe066"/>` +
      `<path d="M-14,-12 L-5,-30" ${LN('#fff', 2.2, 'opacity=".35"')}/>`;
  },
  tovenaarshoed(c) {
    const g = c.d('a', '#4d56c9', '#252a82');
    return `<ellipse cx="0" cy="8" rx="46" ry="9" ${S(c.v('b', '#3a42b0', '#1c2068'))}/>` +
      `<path d="M-31,8 Q-9,-18 -5,-66 Q22,-40 31,8 Q0,16 -31,8Z" ${S(g)}/>` +
      `<path d="M-30,3 Q0,12 30,3" ${LN('#ffd94a', 2.6)}/>` +
      star5(5, -22, 6, '#ffe066', 1.2) + star5(-8, -6, 4, '#fff2a8', 1) +
      `<path transform="translate(-1 -40)" d="M6,-7 A8,8 0 1 0 6,8 A6.2,6.2 0 1 1 6,-7Z" fill="#ffe066" stroke="#e8a21c" stroke-width="1.4" stroke-linejoin="round"/>` +
      `<circle cx="12" cy="-6" r="1.5" fill="#fff"/><circle cx="-14" cy="-18" r="1.4" fill="#fff"/>`;
  },
  kroon(c) {
    const g = c.v('a', '#fff0a0', '#ffb82e');
    return `<path d="M-31,10 L-37,-26 L-18,-9 L0,-36 L18,-9 L37,-26 L31,10 Q0,18 -31,10Z" ${S(g)}/>` +
      `<path d="M-31,2 Q0,10 31,2 L31,10 Q0,18 -31,10Z" ${S('#ffc43d', 2)}/>` +
      [[-37, -28], [0, -38], [37, -28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.6" ${S('#ff6f9b', 1.8)}/><circle cx="${x - 1.4}" cy="${y - 1.4}" r="1.3" fill="#fff"/>`).join('') +
      `<circle cx="0" cy="-8" r="5.2" ${S('#6fd6ff', 1.8)}/><circle cx="-18" cy="3" r="3.6" ${S('#ff5a6e', 1.6)}/><circle cx="18" cy="3" r="3.6" ${S('#8be07a', 1.6)}/>` +
      `<circle cx="-1.6" cy="-9.6" r="1.4" fill="#fff"/><path d="M-26,-8 L-31,-18" ${LN('#fff', 2.2, 'opacity=".55"')}/>`;
  },
  aureool(c) {
    return `<ellipse cx="0" cy="-22" rx="31" ry="9" ${LN(OL, 11)}/><ellipse cx="0" cy="-22" rx="31" ry="9" ${LN(c.h('a', '#fff3a8', '#ffc83a'), 7)}/>` +
      `<path d="M-22,-27 Q-8,-32 8,-31" ${LN('#fff', 2.2, 'opacity=".85"')}/>` +
      sparkle(36, -36, 0.8) + sparkle(-38, -30, 0.55, '#fff2a8');
  },
};

// ---------------- brillen ----------------
const LX = 22;
const temples = (w = 3) => `<path d="M-37,-2 L-47,-5 M37,-2 L47,-5" ${LN(OL, w)}/>`;
const GLASSES = {
  rond(c) {
    const g = c.rg('a', 0.35, 0.3, 0.8, [[0, '#ffffff', 0.7], [1, '#bfe6ff', 0.35]]);
    return temples(2.6) + [-LX, LX].map((x) => `<circle cx="${x}" cy="0" r="14.5" fill="${g}"/>`).join('') +
      DL('M-8,-3 Q0,-9 8,-3', '#d9a43a', 2.4) +
      [-LX, LX].map((x) => `<circle cx="${x}" cy="0" r="14.5" ${LN(OL, 5.4)}/><circle cx="${x}" cy="0" r="14.5" ${LN('#e3b04a', 2.6)}/><path d="M${x - 9},-6 Q${x - 5},-11 ${x + 1},-10" ${LN('#fff', 2.2, 'opacity=".9"')}/>`).join('');
  },
  zonnebril(c) {
    const g = c.lg('a', 0, 0, 0, 1, [[0, '#4a5388'], [1, '#101226']]);
    const lens = (x) => `<path d="M${x - 15},-9 Q${x - 15},-12.5 ${x - 11},-12.5 L${x + 12},-12.5 Q${x + 16},-12.5 ${x + 15.5},-8.5 Q${x + 14},13 ${x + 3},13.5 Q${x - 9},13.5 ${x - 14},3Z" fill="${g}" stroke="#15121c" stroke-width="3.4" stroke-linejoin="round"/>` +
      `<path d="M${x - 10},-7 L${x - 3},-7 M${x - 11},-2 L${x - 7},-2" ${LN('#fff', 2.4, 'opacity=".55"')}/>`;
    return temples(3.4) + `<path d="M-8,-8 L8,-8" ${LN('#15121c', 4)}/>` + lens(-LX) + lens(LX);
  },
  hartjesbril(c) {
    const g = c.rg('a', 0.4, 0.3, 0.8, [[0, '#ffffff', 0.55], [1, '#ffc0d8', 0.55]]);
    const h = (x) => `<path transform="translate(${x} 1.5) scale(1.62)" d="${heartD}" fill="${g}" stroke="#e0457b" stroke-width="2.3" stroke-linejoin="round"/>` +
      `<path d="M${x - 11},-5 Q${x - 8},-9 ${x - 3},-8" ${LN('#fff', 2.2, 'opacity=".9"')}/>`;
    return temples(2.6) + DL('M-8,-3 Q0,-8 8,-3', '#e0457b', 2.2) + h(-LX) + h(LX);
  },
  nerdbril(c) {
    const g = c.rg('a', 0.35, 0.3, 0.8, [[0, '#fff', 0.55], [1, '#cfe9ff', 0.3]]);
    const r = (x) => `<rect x="${x - 15}" y="-12" width="30" height="24" rx="6" fill="${g}" stroke="#24202e" stroke-width="4.6" stroke-linejoin="round"/><path d="M${x - 9},-6 L${x - 4},-7" ${LN('#fff', 2.2, 'opacity=".9"')}/>`;
    return temples(3.6) + `<path d="M-7,-4 H7" ${LN('#24202e', 4.5)}/>` + r(-LX) + r(LX) +
      `<rect x="-6" y="-8" width="12" height="9" rx="1.5" fill="#fff" stroke="${OL}" stroke-width="1.4" transform="rotate(-8)"/><path d="M-3,-6 L3,-1 M3,-6 L-3,-1" ${LN('#c9c9d6', 1.2)} transform="rotate(-8)"/>`;
  },
  driedbril(c) {
    return `<path d="M-37,-2 L-47,-5 M37,-2 L47,-5" ${LN(OL, 3)}/>` +
      `<rect x="-40" y="-14" width="80" height="28" rx="6" ${S('#fbfbf4', 2.6)}/>` +
      `<rect x="-35" y="-10" width="26" height="20" rx="3.4" fill="${c.v('a', '#ff6a6a', '#c21f2e')}" stroke="${OL}" stroke-width="2"/>` +
      `<rect x="9" y="-10" width="26" height="20" rx="3.4" fill="${c.v('b', '#6fe3ff', '#1a8ac2')}" stroke="${OL}" stroke-width="2"/>` +
      `<path d="M-31,-6 L-24,-6 M13,-6 L20,-6" ${LN('#fff', 2.2, 'opacity=".7"')}/><rect x="-6" y="-8" width="12" height="9" rx="2" fill="#fbfbf4"/>`;
  },
  monocle(c) {
    const g = c.rg('a', 0.35, 0.3, 0.8, [[0, '#fff', 0.7], [1, '#cfeaff', 0.35]]);
    return `<circle cx="${LX}" cy="0" r="15.5" fill="${g}"/><circle cx="${LX}" cy="0" r="15.5" ${LN(OL, 6)}/><circle cx="${LX}" cy="0" r="15.5" ${LN(c.v('b', '#ffe38a', '#d9962a'), 3.2)}/>` +
      `<path d="M${LX - 9},-7 Q${LX - 5},-12 ${LX + 1},-11" ${LN('#fff', 2.2, 'opacity=".9"')}/>` +
      `<path d="M${LX + 15},6 Q${LX + 26},20 ${LX + 10},44" ${LN(OL, 4.4, 'stroke-dasharray="0.1 5.4"')}/><path d="M${LX + 15},6 Q${LX + 26},20 ${LX + 10},44" ${LN('#f3c14d', 2.6, 'stroke-dasharray="0.1 5.4"')}/>` +
      `<path d="M${LX + 15},6 Q${LX + 26},20 ${LX + 10},44" ${LN('#e0a62e', 1.2, 'opacity=".9"')}/>`;
  },
  skibril(c) {
    const g = c.lg('a', 0, 0, 1, 1, [[0, '#ffe08a'], [0.5, '#ff8a3d'], [1, '#8a3fd6']]);
    return `<rect x="-54" y="-8" width="108" height="16" rx="7" ${S('#3b6fe0', 2.6)}/>` +
      `<path d="M-48,-3 H-40 M40,-3 H48" ${LN('#fff', 2, 'opacity=".5"')}/>` +
      `<rect x="-39" y="-18" width="78" height="36" rx="17" ${S('#2b2f4a', 3)}/>` +
      `<rect x="-34" y="-13" width="68" height="26" rx="12.5" fill="${g}"/>` +
      `<path d="M-24,-8 L-12,-8 M-27,-3 L-22,-3 M10,-8 L22,-8" ${LN('#fff', 2.6, 'opacity=".75"')}/>` +
      `<path d="M-8,13 Q0,7 8,13" ${LN('#2b2f4a', 3.2)}/>`;
  },
  sterbril(c) {
    const g = c.rg('a', 0.4, 0.4, 0.7, [[0, '#fff7c0', 0.7], [1, '#ffd24a', 0.55]]);
    const s = (x) => `<polygon points="${starPts(x, 1, 19, 10)}" fill="${g}" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/><polygon points="${starPts(x, 1, 19, 10)}" fill="none" stroke="#f0b020" stroke-width="2.4" stroke-linejoin="round"/>` +
      `<path d="M${x - 4},-3 L${x - 1},-8" ${LN('#fff', 2, 'opacity=".9"')}/>`;
    return temples(2.8) + DL('M-6,-4 Q0,-8 6,-4', '#f0b020', 2.2) + s(-LX) + s(LX);
  },
  ooglap(c) {
    return `<path d="M-52,-24 L8,-10" ${LN(OL, 4.4)}/><path d="M34,2 L52,14" ${LN(OL, 4.4)}/>` +
      `<path d="M-52,-24 L8,-10" ${LN('#2a2536', 2.4)}/>` +
      `<ellipse cx="${LX}" cy="1" rx="16" ry="13.5" transform="rotate(-10 ${LX} 1)" fill="${c.rg('a', 0.35, 0.3, 0.8, [[0, '#5b5470'], [1, '#17131f']])}" stroke="${OL}" stroke-width="2.8"/>` +
      `<path d="M${LX - 10},-6 Q${LX - 4},-11 ${LX + 4},-9" ${LN('#fff', 2.2, 'opacity=".35"')}/>` +
      `<path d="M${LX - 12},4 Q${LX},13 ${LX + 12},5" ${LN('#fff', 1.2, 'stroke-dasharray="2 3" opacity=".35"')}/>`;
  },
  masker(c) {
    const hole = (x) => ellD(x, 0, 13.5, 14.5);
    const g = c.lg('a', 0, 0, 0, 1, [[0, '#ff6a6a'], [1, '#c4162e']]);
    return `<path fill-rule="evenodd" d="M-50,-4 Q-44,-20 -24,-19 Q-8,-16 0,-10 Q8,-16 24,-19 Q44,-20 50,-4 Q44,17 24,17 Q8,17 0,8 Q-8,17 -24,17 Q-44,17 -50,-4Z ${hole(-LX)} ${hole(LX)}" fill="${g}" stroke="${OL}" stroke-width="2.8" stroke-linejoin="round"/>` +
      `<path d="M-44,-8 Q-34,-16 -26,-15 M44,-8 Q34,-16 26,-15" ${LN('#fff', 2.2, 'opacity=".5"')}/>` +
      `<circle cx="-40" cy="2" r="1.8" fill="#ffe066"/><circle cx="40" cy="2" r="1.8" fill="#ffe066"/>` +
      `<path d="M-6,-6 L0,-12 L6,-6" ${LN('#ffd94a', 2.2)}/>` +
      [-LX, LX].map((x) => `<ellipse cx="${x}" cy="0" rx="13.5" ry="14.5" ${LN('#ffd0d0', 1.4, 'opacity=".7"')}/>`).join('');
  },
};

// ---------------- hals ----------------
const quadPt = (p0, p1, p2, t) => [
  r2((1 - t) * (1 - t) * p0[0] + 2 * t * (1 - t) * p1[0] + t * t * p2[0]),
  r2((1 - t) * (1 - t) * p0[1] + 2 * t * (1 - t) * p1[1] + t * t * p2[1]),
];
const NECK = {
  sjaal(c) {
    const g = c.v('a', '#ff7a7a', '#d9384f');
    const band = 'M-37,-5 Q0,16 37,-5 L35,10 Q0,29 -35,10Z', tail = 'M12,12 L33,11 L38,46 L17,49Z';
    const cl = c.clip('c', `<path d="${band}"/><path d="${tail}"/>`);
    let st = '';
    for (let i = -4; i < 8; i++) st += `<path d="M${-48 + i * 13},-20 L${-34 + i * 13},60" ${LN('#fff3d9', 4.6)}/>`;
    return `<path d="${band}" fill="${g}"/><path d="${tail}" fill="${g}"/><g clip-path="${cl}">${st}</g>` +
      `<path d="${band}" fill="none" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/><path d="${tail}" fill="none" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>` +
      `<path d="M20,49 v7 M26,48.5 v7 M32,47.5 v7" ${LN('#d9384f', 2.6)}/><path d="M-24,4 Q-10,12 4,10" ${LN('#fff', 2, 'opacity=".45"')}/>`;
  },
  vlinderdas(c) {
    const g = c.v('a', '#ff6f8f', '#d12a52');
    const dots = (sx) => [[14, -5], [20, 4], [12, 8], [24, -1]].map(([x, y]) => `<circle cx="${sx * x}" cy="${y}" r="1.7" fill="#fff" opacity=".85"/>`).join('');
    return `<g transform="translate(0 9)"><path d="M-3,0 L-27,-15 Q-33,0 -27,15Z" ${S(g)}/><path d="M3,0 L27,-15 Q33,0 27,15Z" ${S(g)}/>${dots(-1)}${dots(1)}` +
      `<path d="M-10,-1 L-22,-8 M10,-1 L22,-8 M-10,2 L-22,8 M10,2 L22,8" ${LN('#a81d3e', 1.4, 'opacity=".6"')}/>` +
      `<rect x="-6.5" y="-8" width="13" height="16" rx="5" ${S(c.v('b', '#ff7f9c', '#c0224a'))}/><path d="M-3,-4 v8" ${LN('#fff', 1.8, 'opacity=".6"')}/></g>`;
  },
  stropdas(c) {
    const g = c.h('a', '#4aa3e8', '#2b6fc2');
    return `<path d="M-35,-5 L-3,9 L-21,24 L-36,6Z" ${S('#ffffff', 2.4)}/><path d="M35,-5 L3,9 L21,24 L36,6Z" ${S('#ffffff', 2.4)}/>` +
      `<path d="M-4,13 L4,13 L11,45 L0,55 L-11,45Z" ${S(g)}/>` +
      `<path d="M-8,26 L8,20 M-9,35 L9,29 M-10,44 L10,38" ${LN('#fff', 2.6, 'opacity=".75"')}/>` +
      `<path d="M-6,6 L6,6 L5,14 L-5,14Z" ${S(c.v('b', '#5aaff0', '#2663b8'), 2.2)}/>`;
  },
  bandana(c) {
    const g = c.v('a', '#ff6a6a', '#d12a3c');
    const sh = 'M-38,-5 Q0,17 38,-5 L4,44 Q0,48 -4,44Z';
    const cl = c.clip('c', `<path d="${sh}"/>`);
    let dots = '';
    for (let y = 4; y < 46; y += 9) for (let x = -34 + ((y / 9) % 2) * 6; x < 36; x += 12) dots += `<circle cx="${x}" cy="${y}" r="1.9" fill="#fff" opacity=".85"/>`;
    return `<path d="M-37,-4 L-50,-12 L-47,4Z" ${S(g, 2.2)}/><path d="${sh}" fill="${g}"/><g clip-path="${cl}">${dots}</g>` +
      `<path d="${sh}" fill="none" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>` +
      `<path d="M-30,6 Q0,24 30,6" ${LN('#fff', 1.8, 'opacity=".5"')}/>`;
  },
  hartketting(c) {
    const d = 'M-31,-4 Q0,36 31,-4';
    return `<path d="${d}" ${LN(OL, 5.2, 'stroke-dasharray="4 1.5"')}/><path d="${d}" ${LN('#f6c84f', 3, 'stroke-dasharray="4 1.5"')}/>` +
      `<circle cx="0" cy="17.5" r="2.6" ${S('#f6c84f', 1.4)}/>` + heart(0, 26, 1.55, c.d('a', '#ff9bbd', '#e0306c')) +
      `<ellipse cx="-3.6" cy="20.5" rx="2.4" ry="1.5" fill="#fff" opacity=".85" transform="rotate(-30 -3.6 20.5)"/>`;
  },
  belletje(c) {
    const d = 'M-34,-4 Q0,17 34,-4';
    return DL(d, '#e0455b', 6) + `<path d="${d}" transform="translate(0 -1.4)" ${LN('#ff9fae', 1.6, 'opacity=".8"')}/>` +
      `<circle cx="0" cy="11.5" r="3.4" ${LN('#e0a62e', 1.8)}/>` +
      `<circle cx="0" cy="23" r="10.5" ${S(c.rg('a', 0.35, 0.3, 0.75, [[0, '#fff3a8'], [1, '#e8a21c']]))}/>` +
      `<path d="M-7,24 Q0,29 7,24" ${LN(OL, 1.8)}/><circle cx="0" cy="27.5" r="1.8" fill="${OL}"/><path d="M-7,17 Q-4,13 0,13" ${LN('#fff', 2, 'opacity=".85"')}/>`;
  },
  medaillon(c) {
    const d = 'M-31,-4 Q0,36 31,-4';
    return `<path d="${d}" ${LN(OL, 5, 'stroke-dasharray="3.6 1.4"')}/><path d="${d}" ${LN('#f3c14d', 2.8, 'stroke-dasharray="3.6 1.4"')}/>` +
      `<circle cx="0" cy="17" r="2.8" ${S('#f3c14d', 1.4)}/>` +
      `<circle cx="0" cy="29" r="12" ${S(c.rg('a', 0.35, 0.3, 0.8, [[0, '#fff0a0'], [1, '#d9962a']]))}/>` +
      `<circle cx="0" cy="29" r="8.2" ${LN('#a8731a', 1.4)}/>` + heart(0, 30, 0.62, '#ff7fa8') +
      `<path d="M-8,23 Q-5,19 0,18.5" ${LN('#fff', 2, 'opacity=".85"')}/>`;
  },
  bloemenketting(c) {
    const cols = ['#ff8fb5', '#ffd94a', '#ffffff', '#c9a0ff', '#ff9f6a', '#7fe0ff'];
    let lv = '', fl = '';
    for (let i = 0; i < 9; i++) {
      const x = -34 + i * 8.5, y = r2(-2 + 25 * (1 - Math.pow(x / 36, 2)));
      lv += `<ellipse cx="${x + (i % 2 ? 4 : -4)}" cy="${y + 6}" rx="3.6" ry="7" transform="rotate(${i % 2 ? -30 : 30} ${x} ${y + 6})" ${S('#7ccf72', 1.6)}/>`;
      fl += flower(x, y, 7.4, cols[i % 6], i % 2 ? '#ff9f6a' : '#ffd94a');
    }
    return `<path d="M-35,-2 Q0,36 35,-2" ${LN('#5bb050', 3)}/>` + lv + fl;
  },
  pluchenkraag(c) {
    const g = c.v('a', '#ffffff', '#e8ddf5');
    const circles = [];
    for (let i = 0; i < 9; i++) {
      const x = -34 + i * 8.5;
      circles.push([x, r2(1 + 14 * (1 - Math.pow(x / 38, 2))), 9.2]);
    }
    return blob(circles, g, 2.4) +
      circles.map(([x, y]) => `<circle cx="${x - 2.4}" cy="${y - 2.6}" r="2.4" fill="#fff" opacity=".9"/>`).join('') +
      circles.filter((_, i) => i % 2).map(([x, y]) => `<circle cx="${x + 2}" cy="${y + 3}" r="1.3" fill="#c9b6e8" opacity=".8"/>`).join('') +
      `<path d="M-6,22 L6,22 L5,30 L-5,30Z" ${S('#ff7f9c', 2)}/>`;
  },
  medaille(c) {
    return `<path d="M-33,-5 L-23,-5 L4,30 L-8,33Z" ${S('#e0455b', 2.4)}/><path d="M33,-5 L23,-5 L-4,30 L8,33Z" ${S('#3b82e0', 2.4)}/>` +
      `<path d="M-28,-3 L2,29 M28,-3 L-2,29" ${LN('#fff', 1.6, 'opacity=".5"')}/>` +
      `<circle cx="0" cy="40" r="13.5" ${S(c.rg('a', 0.35, 0.3, 0.8, [[0, '#fff3a8'], [1, '#e19a1e']]), 2.6)}/>` +
      `<circle cx="0" cy="40" r="9.6" ${LN('#b87a14', 1.4)}/>` + star5(0, 40, 6.4, '#fff7c4', 1.2) +
      `<path d="M-9,33 Q-5,28 1,27.5" ${LN('#fff', 2.2, 'opacity=".9"')}/>`;
  },
  parels(c) {
    const p0 = [-31, -4], p1 = [0, 36], p2 = [31, -4];
    let s = `<path d="M-31,-4 Q0,36 31,-4" ${LN('#d9c9d9', 1.4)}/>`;
    for (let i = 0; i <= 12; i++) {
      const [x, y] = quadPt(p0, p1, p2, i / 12);
      const R = i === 6 ? 6.4 : 4.4;
      s += `<circle cx="${x}" cy="${y}" r="${R}" ${S(c.rg('p' + i, 0.35, 0.3, 0.75, [[0, '#ffffff'], [0.6, '#fbeef3'], [1, '#e6d3df']]), 1.6)}/>` +
        `<circle cx="${r2(x - R * 0.3)}" cy="${r2(y - R * 0.35)}" r="${r2(R * 0.28)}" fill="#fff"/>`;
    }
    return s;
  },
  diamanten(c) {
    const p0 = [-31, -4], p1 = [0, 34], p2 = [31, -4];
    let s = `<path d="M-31,-4 Q0,34 31,-4" ${LN(OL, 4)}/><path d="M-31,-4 Q0,34 31,-4" ${LN('#dfe6f2', 2)}/>`;
    for (let i = 1; i < 12; i += 2) {
      const [x, y] = quadPt(p0, p1, p2, i / 12);
      s += `<polygon points="${x},${r2(y - 4)} ${r2(x + 3.8)},${y} ${x},${r2(y + 4)} ${r2(x - 3.8)},${y}" ${S('#8fe0ff', 1.4)}/>`;
    }
    const g = c.lg('a', 0, 0, 1, 1, [[0, '#e8fbff'], [0.5, '#6fd0ff'], [1, '#2e7fe0']]);
    s += `<polygon points="-8,17 8,17 14,25 0,43 -14,25" ${S(g, 2.4)}/>` +
      `<path d="M-14,25 H14 M-8,17 L-4,25 L0,43 M8,17 L4,25 L0,43 M-4,25 L0,17 L4,25" ${LN('#fff', 1.3, 'opacity=".8"')}/>` +
      sparkle(14, 17, 0.7, '#fff') + sparkle(-16, 38, 0.5, '#e8fbff');
    return s;
  },
};

// ---------------- lijf ----------------
const CLIP_T = '<ellipse cx="0" cy="0" rx="41" ry="33"/>';
const torso = (fill, w = 2.8) => `<ellipse cx="0" cy="0" rx="41" ry="33" ${S(fill, w)}/>`;
const sleeves = (fill, cuff) => [-1, 1].map((s) =>
  `<g transform="translate(${s * 39} -1) rotate(${-s * 16})"><ellipse cx="0" cy="0" rx="10.8" ry="15.8" ${S(fill, 2.8)}/>` +
  (cuff ? `<path d="M-10,7.5 Q0,14 10,7.5 L9.4,12.5 Q0,19 -9.4,12.5Z" fill="${cuff}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>` : '') + `</g>`).join('');
const BODY = {
  trui(c) {
    const g = c.v('a', '#a4ecdc', '#52c6ae'), cl = c.clip('c', CLIP_T);
    let st = '';
    for (let y = -24; y < 36; y += 14) st += `<rect x="-44" y="${y}" width="88" height="6.4" fill="#fff6dc" opacity=".92"/>`;
    return { back: '', front: torso(g) + `<g clip-path="${cl}">${st}</g>` + `<ellipse cx="0" cy="0" rx="41" ry="33" fill="none" stroke="${OL}" stroke-width="2.8"/>` +
      shine(-22, -16, 10, 4, -30, 0.3) + sleeves(g, '#fff6dc') +
      `<path d="M-19,-27 Q0,-16 19,-27 L17,-20 Q0,-9 -17,-20Z" ${S('#fff6dc', 2.2)}/><path d="M-10,-21 v4 M-3,-19 v4 M4,-19 v4 M11,-21 v4" ${LN('#e0c98f', 1.3)}/>` };
  },
  schort(c) {
    const g = c.v('a', '#fffdf5', '#f4e8d2');
    return { back: '', front: `<path d="M-15,-26 Q0,-37 15,-26" ${LN(OL, 6.4)}/><path d="M-15,-26 Q0,-37 15,-26" ${LN('#ff8fb5', 3.6)}/>` +
      `<path d="M-17,-26 L17,-26 L18,-8 L32,-1 Q34,27 0,34 Q-34,27 -32,-1 L-18,-8Z" ${S(g)}/>` +
      `<path d="M-32,-1 L-43,-6 L-42,8Z M32,-1 L43,-6 L42,8Z" ${S('#ff8fb5', 2)}/>` +
      `<path d="M-13,9 H13 V22 Q0,29 -13,22Z" ${S('#ffd0e1', 2.2)}/>` + heart(0, 16, 0.6, '#ff6f9b') +
      `<path d="M-14,-18 H14" ${LN('#ff8fb5', 2, 'stroke-dasharray="3 3"')}/>` + `<path d="M-26,8 Q-24,22 -14,28" ${LN('#fff', 2, 'opacity=".8"')}/>` };
  },
  regenjas(c) {
    const g = c.v('a', '#ffe566', '#f5b800'), dk = '#e0a000';
    return { back: '', front: torso(g) + shine(-22, -16, 10, 4, -30, 0.35) + sleeves(g, dk) +
      `<path d="M0,-22 L0,33" ${LN(OL, 2.2)}/><rect x="-2.6" y="-14" width="5.2" height="8" rx="2" ${S('#c8ccd8', 1.4)}/>` +
      `<path d="M-30,16 Q0,24 30,16" ${LN('#e6ecf5', 3.4)}/><path d="M-30,16 Q0,24 30,16" ${LN(OL, 1.2, 'opacity=".5"')}/>` +
      `<path d="M-33,0 H-12 V10 H-33Z M33,0 H12 V10 H33Z" ${S(g, 1.8)} transform="translate(0 4)"/>` +
      `<path d="M-26,-27 Q0,-13 26,-27 L24,-18 Q0,-4 -24,-18Z" ${S('#f2b600', 2.4)}/>` };
  },
  jasje(c) {
    const g = c.v('a', '#4d5a8f', '#262f5c');
    return { back: '', front: torso(g) + shine(-24, -16, 10, 4, -30, 0.2) + sleeves(g, '#1f2750') +
      `<path d="M-13,-27 L0,10 L13,-27Z" ${S('#ffffff', 2)}/><path d="M-2.4,-18 L2.4,-18 L1.6,2 L0,6 L-1.6,2Z" ${S('#d9384f', 1.6)}/>` +
      `<path d="M-15,-28 L-27,-8 L-8,-2 L0,10Z" ${S(c.v('b', '#5a69a6', '#2f3a72'), 2.2)}/><path d="M15,-28 L27,-8 L8,-2 L0,10Z" ${S(c.v('b2', '#5a69a6', '#2f3a72'), 2.2)}/>` +
      `<path d="M0,10 L0,33" ${LN(OL, 2)}/>` +
      `<circle cx="6" cy="17" r="3.2" ${S('#ffd94a', 1.4)}/><circle cx="6" cy="27" r="3.2" ${S('#ffd94a', 1.4)}/>` +
      `<path d="M-26,6 L-14,6 L-14,12 L-26,12Z" ${S('#fff', 1.4)}/>` };
  },
  hoodie(c) {
    const g = c.v('a', '#c3a3ff', '#8a63e0'), dk = c.v('b', '#a98af0', '#6f4cc9');
    return { back: '', front: torso(g) + shine(-22, -14, 10, 4, -30, 0.3) + sleeves(g, '#7a56d6') +
      `<path d="M-27,-27 Q0,-12 27,-27 Q33,-10 21,-3 Q0,9 -21,-3 Q-33,-10 -27,-27Z" ${S(dk)}/>` +
      `<path d="M-8,0 Q-9,10 -10,19 M8,0 Q9,10 10,19" ${LN('#fff', 2.4)}/><circle cx="-10" cy="21" r="2.6" ${S('#fff', 1.4)}/><circle cx="10" cy="21" r="2.6" ${S('#fff', 1.4)}/>` +
      `<path d="M-23,17 H23 L29,31 Q0,37 -29,31Z" ${S(dk)}/>` };
  },
  zwemband(c) {
    const arc = (sweep) => `M-46,6 A46,15 0 0 ${sweep} 46,6`;
    const ring = (sweep) => `<path d="${arc(sweep)}" ${LN(OL, 17)}/><path d="${arc(sweep)}" ${LN('#ffffff', 12)}/><path d="${arc(sweep)}" ${LN('#ff5a6e', 12, 'stroke-dasharray="11.3 11.3"')}/>`;
    return { back: ring(1), front: ring(0) + `<path d="M-30,17 Q-10,24 10,22" ${LN('#fff', 2.4, 'opacity=".7"')}/>` };
  },
  rugzakje(c) {
    const g = c.v('a', '#ffa45a', '#e8642a');
    return { back: `<rect x="-47" y="-32" width="94" height="62" rx="22" ${S(g)}/>` +
      `<path d="M-9,-33 Q0,-46 9,-33" ${LN(OL, 6)}/><path d="M-9,-33 Q0,-46 9,-33" ${LN('#c24b1a', 3)}/>` +
      `<rect x="-52" y="2" width="12" height="22" rx="5" ${S('#e8642a', 2.4)}/><rect x="40" y="2" width="12" height="22" rx="5" ${S('#e8642a', 2.4)}/>` +
      star5(0, -20, 5.6, '#ffe066', 1.3),
      front: [-1, 1].map((s) => `<path d="M${s * 25},-25 C${s * 30},-10 ${s * 34},6 ${s * 34},22" ${LN(OL, 9)}/><path d="M${s * 25},-25 C${s * 30},-10 ${s * 34},6 ${s * 34},22" ${LN('#c24b1a', 5.4)}/><rect x="${s * 34 - 3.6}" y="10" width="7.2" height="6" rx="1.5" ${S('#ffe066', 1.2)}/>`).join('') +
        `<path d="M-30,-2 H30" ${LN(OL, 4)}/><path d="M-30,-2 H30" ${LN('#c24b1a', 1.8)}/><rect x="-4" y="-5.4" width="8" height="6.8" rx="1.6" ${S('#ffe066', 1.2)}/>` };
  },
  tutu(c) {
    const g1 = c.v('a', '#ffc7e3', '#ff8cc0'), g2 = c.v('b', '#ffe3f1', '#ffb1d6');
    const sk = 'M-48,10 Q-54,31 -38,35 Q-30,43 -20,36 Q-10,44 0,37 Q10,44 20,36 Q30,43 38,35 Q54,31 48,10 Q0,-1 -48,10Z';
    return { back: '', front: `<path d="${sk}" ${S(g1)}/><g transform="translate(0 -3) scale(.86 .86)"><path d="${sk}" ${S(g2)}/></g>` +
      `<path d="M-34,16 Q-31,26 -26,31 M-14,19 Q-12,27 -8,33 M10,19 Q12,27 15,32 M30,16 Q32,25 28,31" ${LN('#ff8cc0', 1.6, 'opacity=".6"')}/>` +
      `<path d="M-37,4 Q0,13 37,4 L36,12 Q0,21 -36,12Z" ${S('#ff6fa8', 2.4)}/>` + sparkle(-24, 24, 0.55, '#fff8c4') + sparkle(26, 22, 0.5, '#fff8c4') + heart(0, 9, 0.5, '#fff') };
  },
  piratenjas(c) {
    const g = c.v('a', '#d8485e', '#8f1f36');
    let gb = '';
    for (const y of [-6, 4, 14]) gb += `<circle cx="-5" cy="${y}" r="2.1" fill="#ffd94a"/><circle cx="5" cy="${y}" r="2.1" fill="#ffd94a"/>`;
    return { back: '', front: torso(g) + shine(-24, -16, 10, 4, -30, 0.22) + sleeves(g, '#ffd94a') +
      `<path d="M-9,-27 L0,16 L9,-27Z" ${S('#fff7e8', 1.8)}/>` + gb +
      `<rect x="-41" y="16" width="82" height="9" rx="4" ${S('#2a2230', 2)}/><rect x="-7" y="14" width="14" height="13" rx="3" ${S('#ffd94a', 1.8)}/><rect x="-3.2" y="17.5" width="6.4" height="6" rx="1.4" fill="#8f1f36"/>` +
      blob([[-9, -23, 4.6], [-3, -20, 4.6], [3, -20, 4.6], [9, -23, 4.6]], '#fff', 1.6) };
  },
  cape(c) {
    const g = c.v('a', '#a77bff', '#5a31b0');
    const spots = [-50, -38, -26, -14, -2, 10, 22, 34, 46].map((x) => `<path d="M${x},${r2(41 + 11 * (1 - Math.pow(x / 62, 2)) - 5)} l1.8,5 l1.8,-5Z" fill="#2a2236"/>`).join('');
    const circles = [];
    for (let i = 0; i < 8; i++) { const x = -31 + i * 8.8; circles.push([x, r2(-22 + 7 * (1 - Math.pow(x / 36, 2))), 8]); }
    return { back: `<path d="M-33,-30 Q-62,8 -63,42 Q0,56 63,42 Q62,8 33,-30Z" ${S(g)}/>` +
      `<path d="M-63,42 Q0,56 63,42" ${LN(OL, 12)}/><path d="M-63,42 Q0,56 63,42" ${LN('#ffffff', 8.4)}/>` + spots +
      `<path d="M-44,-4 Q-52,16 -52,34" ${LN('#fff', 2.4, 'opacity=".25"')}/>`,
      front: blob(circles, '#ffffff', 2.2) + `<circle cx="-30" cy="-16" r="4.2" ${S('#ffd94a', 1.6)}/><circle cx="30" cy="-16" r="4.2" ${S('#ffd94a', 1.6)}/>` +
        `<path d="M-30,-12 Q0,2 30,-12" ${LN('#ffd94a', 2, 'stroke-dasharray="3 2"')}/>` };
  },
  superheldencape(c) {
    const g = c.v('a', '#ff6a6a', '#b3162c');
    const sh = 'M-31,-30 Q-66,8 -62,44 Q-44,38 -31,47 Q-15,39 0,49 Q15,39 31,47 Q44,38 62,44 Q66,8 31,-30Z';
    return { back: `<path d="${sh}" ${S(g)}/><path d="M-62,44 Q-44,38 -31,47 Q-15,39 0,49 Q15,39 31,47 Q44,38 62,44" ${LN('#ffd94a', 3.2)}/>` +
      `<path d="M-48,-2 Q-56,18 -54,34 M-36,10 Q-40,24 -38,38" ${LN('#fff', 2.4, 'opacity=".3"')}/>`,
      front: `<circle cx="-29" cy="-17" r="4.6" ${S('#ffd94a', 1.6)}/><circle cx="29" cy="-17" r="4.6" ${S('#ffd94a', 1.6)}/>` +
        `<path d="M-29,-14 Q0,3 29,-14" ${LN(OL, 4)}/><path d="M-29,-14 Q0,3 29,-14" ${LN('#ffd94a', 1.8)}/>` +
        `<path d="M-13,6 H13 V16 Q13,27 0,33 Q-13,27 -13,16Z" ${S(c.v('b', '#ffe566', '#f5a800'), 2.4)}/>` + star5(0, 17, 7, '#e0314b', 1.4) };
  },
  vleugels(c) {
    const g = c.lg('a', 0, 0, 1, 1, [[0, '#ffffff'], [1, '#c9dcff']]);
    const wing = `<path d="M-28,-16 C-50,-52 -88,-56 -93,-30 C-96,-14 -82,-4 -72,0 C-78,9 -66,19 -56,16 C-58,25 -46,30 -37,25Z" ${S(g)}/>` +
      `<path d="M-42,-8 Q-64,-26 -84,-28 M-44,4 Q-62,-6 -76,-2 M-46,15 Q-58,8 -66,12" ${LN('#aac4f0', 2.2)}/><path d="M-60,-34 Q-72,-42 -82,-38" ${LN('#fff', 2.4, 'opacity=".9"')}/>`;
    return { back: wing + mirL(wing), front: '' };
  },
};

const DRAW = { hat: HAT, glasses: GLASSES, neck: NECK, body: BODY };
const VB = { hat: [-70, -96, 140, 140], glasses: [-60, -60, 120, 120], neck: [-56, -30, 112, 100], body: [-72, -72, 144, 144] };
const VB_ID = {
  strik: [-15, -31, 70, 70], petje: [-56, -64, 112, 112], hoofdband: [-58, -44, 116, 116], haarspeldjes: [-56, -48, 112, 112],
  bloemenkrans: [-60, -44, 120, 120], pompommuts: [-56, -72, 112, 112], feesthoed: [-60, -84, 120, 120], baret: [-60, -64, 112, 112],
  koksmuts: [-52, -66, 104, 104], helm: [-62, -66, 124, 124], cowboyhoed: [-70, -78, 140, 140], piratenhoed: [-66, -78, 132, 132],
  hogehoed: [-56, -74, 112, 112], heksenhoed: [-60, -84, 120, 120], tovenaarshoed: [-60, -86, 120, 120], kroon: [-52, -65, 104, 104],
  aureool: [-52, -74, 104, 104],
  monocle: [-22, -44, 96, 96],
  medaille: [-50, -20, 100, 96],
  vleugels: [-100, -80, 200, 160], cape: [-76, -50, 152, 120], superheldencape: [-76, -50, 152, 120], zwemband: [-62, -34, 124, 78],
  rugzakje: [-66, -58, 132, 126], tutu: [-62, -32, 124, 90],
};

// =====================================================================
//  EI
// =====================================================================
function eggParts(c, progress, tint) {
  const p = Math.max(0, Math.min(1, Number(progress) || 0));
  const spot = tint || '#ffb3d1', spot2 = '#8fd3ff';
  const path = 'M100,36 C139,36 159,92 159,128 C159,160 135,183 100,183 C65,183 41,160 41,128 C41,92 61,36 100,36Z';
  const fill = c.rg('egg', 0.38, 0.3, 0.85, [[0, '#ffffff'], [0.55, '#fff1de'], [1, '#f0cfae']]);
  const sh = c.rg('esh', 0.5, 0.5, 0.5, [[0, '#6a4a7a', 0.34], [1, '#6a4a7a', 0]]);
  const clip = c.clip('eclip', `<path d="${path}"/>`);
  const cracks = [
    ['M96,44 L105,58 L94,71 L106,86 L97,99', 0.12], ['M97,99 L84,107 L90,119 L74,128', 0.28],
    ['M98,99 L114,105 L108,118 L126,124', 0.42], ['M60,86 L73,94 L66,107', 0.58],
    ['M141,82 L130,94 L139,102', 0.68], ['M100,152 L91,162 L103,168', 0.78], ['M74,128 L66,142 L76,150', 0.86],
  ];
  let cr = '', glow = '';
  for (const [d, st] of cracks) {
    const len = Math.max(0, Math.min(1, (p - st) / 0.22)) * 100;
    if (len <= 0) continue;
    cr += `<path d="${d}" pathLength="100" fill="none" stroke="${OL}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${r2(len)} 100"/>`;
    if (p > 0.82) glow += `<path d="${d}" pathLength="100" fill="none" stroke="#fff3a0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".55" stroke-dasharray="${r2(len)} 100"/>`;
  }
  const amp = p < 0.02 ? 0 : r2(1.5 + p * 9), dur = r2(2.8 - p * 1.9);
  const wob = amp
    ? `<animateTransform attributeName="transform" type="rotate" values="0 100 183;${-amp} 100 183;0 100 183;${amp} 100 183;0 100 183" keyTimes="0;0.25;0.5;0.75;1" dur="${dur}s" repeatCount="indefinite"/>`
    : '';
  const eggBody = `<g>${wob}` +
    `<path d="${path}" fill="${fill}" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>` +
    `<g clip-path="${clip}">` +
    `<circle cx="78" cy="92" r="9" fill="${spot}" opacity=".9"/><circle cx="124" cy="78" r="6.5" fill="${spot2}" opacity=".9"/>` +
    `<circle cx="112" cy="124" r="11" fill="${spot}" opacity=".85"/><circle cx="70" cy="140" r="7.5" fill="${spot2}" opacity=".85"/>` +
    `<circle cx="132" cy="150" r="6" fill="${spot}" opacity=".85"/><circle cx="92" cy="60" r="4.5" fill="${spot2}" opacity=".85"/>` +
    `<path d="M41,150 Q100,170 159,150 L159,190 L41,190Z" fill="#e8b98a" opacity=".22"/></g>` +
    `<ellipse cx="78" cy="68" rx="13" ry="25" transform="rotate(24 78 68)" fill="#fff" opacity=".6"/>` +
    `<ellipse cx="68" cy="98" rx="3.2" ry="6" transform="rotate(14 68 98)" fill="#fff" opacity=".6"/>` +
    glow + cr +
    `<path d="${path}" fill="none" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/></g>`;
  return `<ellipse cx="100" cy="185" rx="58" ry="9" fill="${sh}"/>` + `<g class="pet-body" style="transform-box:fill-box;transform-origin:50% 100%">${eggBody}</g>`;
}

function wrapSvg(c, size, vb, inner, label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${size}" height="${size}" role="img" aria-label="${label}">` +
    `<defs>${c.defs.join('')}</defs>${inner}</svg>`;
  return tidy(svg);
}

export function eggSVG(size = 200, progress = 0, tint) {
  const c = mkCtx();
  return wrapSvg(c, size || 200, '0 0 200 200', eggParts(c, progress, tint), 'Ei');
}

// =====================================================================
//  HUISDIER
// =====================================================================
const STAGES = {
  baby: { sx: 0.76, sy: 0.7, es: 1.34 },
  kind: { sx: 0.88, sy: 0.86, es: 1.16 },
  tiener: { sx: 0.9, sy: 0.97, es: 1.02 },
  volwassen: { sx: 1, sy: 1, es: 0.96 },
};

function resolvePalette(sp, pal) {
  let p = pal;
  if (p == null) p = 0;
  if (typeof p === 'number' || typeof p === 'string') {
    const idx = typeof p === 'string' ? Math.max(0, sp.palettes.findIndex((x) => x.id === p)) : Math.max(0, Math.min(sp.palettes.length - 1, p | 0));
    p = sp.palettes[idx];
  }
  const d = sp.palettes[0];
  return { main: p.main || d.main, accent: p.accent || d.accent, belly: p.belly || d.belly };
}

function placeAcc(slot, A, corr) {
  const k = corr || {};
  const dx = k.dx || 0, dy = k.dy || 0, s = k.s || 1, rot = k.rot || 0;
  if (slot === 'hat') return `translate(${A.hx + dx} ${A.hatY + dy}) rotate(${rot}) scale(${r2(A.hatS * s)})`;
  if (slot === 'glasses') return `translate(${100 + dx} ${A.eyeY + dy}) rotate(${rot}) scale(${r2((A.eyeDX / 22) * s)})`;
  if (slot === 'neck') return `translate(${100 + dx} ${A.neckY + dy}) rotate(${rot}) scale(${r2((A.neckW / 34) * s)})`;
  return `translate(${100 + dx} ${A.chestY + dy}) rotate(${rot}) scale(${r2((A.bodyW / 40) * s)})`;
}

export function petSVG(speciesId, opts) {
  const o = opts || {};
  const sp = SPECIES.find((s) => s.id === speciesId) || SPECIES[0];
  const size = o.size || 200;
  const stageName = o.stage === 'ei' || STAGES[o.stage] ? o.stage : 'volwassen';
  const mood = MOODS.includes(o.mood) ? o.mood : 'blij';
  let pal = resolvePalette(sp, o.palette);

  if (stageName === 'ei') {
    const c = mkCtx();
    return wrapSvg(c, size, '0 0 200 200', eggParts(c, o.progress != null ? o.progress : 0.12, pal.accent), `Ei van ${sp.name}`);
  }

  // stemming kleurt het dier een beetje
  if (mood === 'ziek') pal = { main: mix(pal.main, '#a6d77e', 0.32), accent: mix(pal.accent, '#8fbf6a', 0.22), belly: mix(pal.belly, '#d4eaa8', 0.3) };
  if (mood === 'vies') pal = { main: mix(pal.main, '#a08a62', 0.18), accent: pal.accent, belly: mix(pal.belly, '#bba98a', 0.22) };

  const st = STAGES[stageName];
  const def = SPDEF[sp.id];
  const A = Object.assign({}, BASE_A, def.a);
  const c = mkCtx();
  const P = { main: pal.main, accent: pal.accent, belly: pal.belly };
  c.ol = mix(darken(pal.main, 0.35), '#2b1d38', 0.55);
  c.M = c.rg('M', 0.38, 0.28, 0.85, [[0, lighten(pal.main, 0.4)], [0.55, pal.main], [1, mix(pal.main, '#7d5f95', 0.26)]]);
  c.A = c.rg('A', 0.38, 0.28, 0.85, [[0, lighten(pal.accent, 0.35)], [0.55, pal.accent], [1, mix(pal.accent, '#4a3560', 0.22)]]);
  c.B = c.rg('B', 0.4, 0.3, 0.8, [[0, lighten(pal.belly, 0.5)], [0.7, pal.belly], [1, mix(pal.belly, '#b89aa8', 0.22)]]);
  c.lg('hrt', 0, 0, 1, 1, [[0, '#ff9bb8'], [1, '#e8305f']]);

  const d = SPECIES_DRAW[sp.id](c, P);
  const onDark = d.patchEyes ? lum(pal.accent) < 0.5 : lum(pal.main) < 0.42;
  const face = faceParts(c, A, mood, st.es, !!o.blink, onDark);
  const fx = extrasFor(c, mood, A, st.es);

  const outfit = o.outfit || {};
  const acc = {};
  for (const slot of SLOTS) {
    const id = outfit[slot];
    if (!id || !DRAW[slot][id]) continue;
    c.pre = slot[0] + '_';
    const corr = Object.assign({}, (def.corr || {})[slot], ((def.corrId || {})[slot] || {})[id]);
    const res = DRAW[slot][id](c);
    acc[slot] = { tf: placeAcc(slot, A, corr), res };
  }
  c.pre = '';

  const wrapAcc = (a, s) => (a ? `<g transform="${a.tf}">${s}</g>` : '');
  const bodyA = acc.body;
  const inner =
    '<ellipse cx="100" cy="186" rx="54" ry="6" fill="#4a3560" opacity=".14"/>' +
    `<g class="pet-body${o.idleClass ? ' ' + o.idleClass : ''}" style="transform-box:fill-box;transform-origin:50% 100%">` +
    d.back +
    (bodyA ? wrapAcc(bodyA, bodyA.res.back) : '') +
    d.body +
    (bodyA ? wrapAcc(bodyA, bodyA.res.front) : '') +
    (acc.neck ? wrapAcc(acc.neck, acc.neck.res) : '') +
    d.head + face.eyes + face.brows + d.deco + face.mouth + fx.under +
    (acc.glasses ? wrapAcc(acc.glasses, acc.glasses.res) : '') +
    (acc.hat ? wrapAcc(acc.hat, acc.hat.res) : '') +
    fx.over +
    '</g>';
  const wrapped = `<g transform="translate(100 185) scale(${st.sx} ${st.sy}) translate(-100 -185)">${inner}</g>`;
  return wrapSvg(c, size, '0 0 200 200', wrapped, `${sp.name}, ${mood}`);
}

// =====================================================================
//  LOSSE ACCESSOIRE-PREVIEW (winkel)
// =====================================================================
export function accessorySVG(slot, id, size = 100) {
  const c = mkCtx();
  const fn = DRAW[slot] && DRAW[slot][id];
  const vb = (VB_ID[id] || VB[slot] || [-60, -60, 120, 120]).join(' ');
  if (!fn) return wrapSvg(c, size, vb, '', 'onbekend accessoire');
  c.pre = (slot[0] || 'x') + '_';
  const res = fn(c);
  const inner = typeof res === 'string' ? res : (res.back || '') + (res.front || '');
  const item = (ACCESSORIES[slot] || []).find((x) => x.id === id);
  return wrapSvg(c, size, vb, inner, item ? item.name : id);
}
