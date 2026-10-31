// Kleurlab: kleurwiskunde, harmonieën, palet-generator, contrast, kleurenblind-simulatie, verlopen, kleuren uit een foto en spel-logica.
// Geen DOM, dus testbaar met node (tools/test-kleur.mjs).

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rand = (n) => { const a = new Uint32Array(1); globalThis.crypto.getRandomValues(a); return a[0] % n; };
const rf = (r, a, b) => a + (r(1000) / 1000) * (b - a);

// ---- omrekenen ----
export const isHex = (s) => typeof s === 'string' && /^#[0-9a-f]{6}$/i.test(s);
export function normHex(s, dflt = '#000000') {
  if (typeof s !== 'string') return dflt; let t = s.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(t)) t = t.split('').map((c) => c + c).join('');
  return /^[0-9a-f]{6}$/i.test(t) ? '#' + t.toLowerCase() : dflt;
}
export const hexToRgb = (h) => { const n = parseInt(normHex(h).slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
export const rgbToHex = (r, g, b) => '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s * 100, l * 100];
}
export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
export const hexToHsl = (h) => rgbToHsl(...hexToRgb(h));
export const hslToHex = (h, s, l) => rgbToHex(...hslToRgb(h, s, l));
export function mix(a, b, t = 0.5) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
export function mixPaint(parts) { // [{c, w}] gewogen gemiddelde (verf mengen)
  const tot = parts.reduce((s, p) => s + p.w, 0); if (tot <= 0) return '#ffffff';
  const acc = [0, 0, 0]; parts.forEach((p) => { const c = hexToRgb(p.c); for (let i = 0; i < 3; i++) acc[i] += c[i] * p.w; });
  return rgbToHex(acc[0] / tot, acc[1] / tot, acc[2] / tot);
}
export const lighten = (hex, pct) => { const [h, s, l] = hexToHsl(hex); return hslToHex(h, s, clamp(l + pct, 0, 100)); };

// ---- namen ----
export const COLOR_NAMES = [
  ['rood', '#e53935'], ['donkerrood', '#8b0000'], ['bordeaux', '#800020'], ['koraal', '#ff7f50'], ['zalm', '#fa8072'], ['roze', '#ff69b4'], ['lichtroze', '#ffc0cb'], ['magenta', '#d81b60'],
  ['paars', '#8e24aa'], ['lila', '#c8a2c8'], ['violet', '#7e57c2'], ['lavendel', '#b39ddb'], ['indigo', '#3f51b5'], ['blauw', '#1e88e5'], ['lichtblauw', '#81d4fa'], ['hemelsblauw', '#87ceeb'], ['marineblauw', '#0b1f5c'],
  ['turquoise', '#26c6da'], ['groenblauw', '#00897b'], ['groen', '#43a047'], ['lichtgroen', '#a5d6a7'], ['mint', '#98ff98'], ['limoengroen', '#cddc39'], ['olijfgroen', '#808000'], ['donkergroen', '#1b5e20'], ['kaki', '#8f9779'],
  ['geel', '#fdd835'], ['goud', '#ffc107'], ['oranje', '#fb8c00'], ['perzik', '#ffcc99'], ['bruin', '#6d4c41'], ['chocoladebruin', '#3e2723'], ['zandkleur', '#e0c097'], ['beige', '#f5deb3'], ['crème', '#fff8e1'],
  ['wit', '#ffffff'], ['lichtgrijs', '#d0d0d0'], ['grijs', '#9e9e9e'], ['donkergrijs', '#555555'], ['zwart', '#000000'],
];
export function colorDistance(a, b) { const A = hexToRgb(a), B = hexToRgb(b), rm = (A[0] + B[0]) / 2, dr = A[0] - B[0], dg = A[1] - B[1], db = A[2] - B[2]; return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db); }
export function colorName(hex) { let best = COLOR_NAMES[0], bd = Infinity; COLOR_NAMES.forEach((c) => { const d = colorDistance(hex, c[1]); if (d < bd) { bd = d; best = c; } }); return best[0]; }

// ---- harmonieën ----
export const HARMONIES = [
  { id: 'compl', name: 'Complementair', desc: 'Tegenovergestelde kleuren: sterk contrast.', off: [0, 180] },
  { id: 'analoog', name: 'Analoog', desc: 'Buren op het wiel: rustig en mooi.', off: [-30, 0, 30] },
  { id: 'triade', name: 'Triade', desc: 'Drie kleuren op gelijke afstand.', off: [0, 120, 240] },
  { id: 'split', name: 'Split-complementair', desc: 'Eén kleur met de twee buren van zijn tegenhanger.', off: [0, 150, 210] },
  { id: 'tetrade', name: 'Tetrade', desc: 'Vier kleuren in een vierkant.', off: [0, 90, 180, 270] },
  { id: 'mono', name: 'Monochroom', desc: 'Eén kleur in licht en donker.', off: null },
];
export function harmony(hex, id) {
  const [h, s, l] = hexToHsl(hex), H = HARMONIES.find((x) => x.id === id) || HARMONIES[0];
  if (!H.off) return [lighten(hex, 0), ...[-30, -15, 15, 30].map((d) => hslToHex(h, s, clamp(l + d, 8, 94)))].sort((a, b) => hexToHsl(a)[2] - hexToHsl(b)[2]);
  return H.off.map((o) => hslToHex(h + o, s, l));
}

// ---- palet-generator ----
// opts: { mode (harmonie-id of 'willekeurig'), n (3-8), locked: {index: hex}, base }
export function generatePalette(opts = {}, r = rand) {
  const n = clamp(opts.n | 0 || 5, 2, 8), locked = opts.locked || {}, mode = opts.mode || 'willekeurig';
  const baseH = opts.base ? hexToHsl(opts.base)[0] : r(360), out = [];
  const lockedIdx = Object.keys(locked).map(Number);
  const hueFor = (i) => {
    if (mode === 'willekeurig') return baseH + (i * 360 / n) + rf(r, -25, 25);
    const H = HARMONIES.find((x) => x.id === mode); if (!H || !H.off) return baseH + rf(r, -8, 8);
    return baseH + H.off[i % H.off.length] + rf(r, -8, 8);
  };
  for (let i = 0; i < n; i++) {
    if (locked[i]) { out.push(normHex(locked[i])); continue; }
    const mono = mode === 'mono', l = mono ? 22 + (i * 62) / Math.max(1, n - 1) : rf(r, 35, 78), s = rf(r, 45, 88);
    out.push(hslToHex(hueFor(i), s, l));
  }
  void lockedIdx; return out;
}
export const randomColor = (r = rand) => hslToHex(r(360), rf(r, 50, 90), rf(r, 40, 68));

// ---- contrast (WCAG) ----
export function relLuminance(hex) { const [r, g, b] = hexToRgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
export function contrastRatio(a, b) { const la = relLuminance(a), lb = relLuminance(b), hi = Math.max(la, lb), lo = Math.min(la, lb); return (hi + 0.05) / (lo + 0.05); }
export function contrastGrade(ratio) { return { normaalAA: ratio >= 4.5, normaalAAA: ratio >= 7, grootAA: ratio >= 3, grootAAA: ratio >= 4.5 }; }
export function fixContrast(fg, bg, target = 4.5) {
  fg = normHex(fg); bg = normHex(bg); if (contrastRatio(fg, bg) >= target) return fg;
  const [h, sat, l] = hexToHsl(fg), first = relLuminance(bg) > 0.4 ? -1 : 1;
  for (let d = 1; d <= 100; d++) for (const dir of [first, -first]) { const c = hslToHex(h, sat, clamp(l + dir * d, 0, 100)); if (contrastRatio(c, bg) >= target) return c; }
  return bestText(bg);
}
export const bestText = (bg) => (contrastRatio(bg, '#000000') >= contrastRatio(bg, '#ffffff') ? '#000000' : '#ffffff');

// ---- kleurenblind ----
export const CB_TYPES = [
  { id: 'normaal', name: 'Normaal' }, { id: 'deutan', name: 'Rood-groen (deuteranopie)' }, { id: 'protan', name: 'Rood-blind (protanopie)' }, { id: 'tritan', name: 'Blauw-geel (tritanopie)' }, { id: 'achroma', name: 'Zwart-wit (achromatopsie)' },
];
const CB = {
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const unlin = (v) => { v = clamp(v, 0, 1); return 255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055); };
export function simulateRgb(rgb, type) {
  if (!type || type === 'normaal') return rgb.slice();
  const l = rgb.map(lin);
  if (type === 'achroma') { const y = unlin(0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]); return [y, y, y]; }
  const M = CB[type]; if (!M) return rgb.slice();
  return M.map((row) => unlin(row[0] * l[0] + row[1] * l[1] + row[2] * l[2]));
}
export const simulateHex = (hex, type) => rgbToHex(...simulateRgb(hexToRgb(hex), type));
export function simulateImageData(data, type) { // Uint8ClampedArray RGBA, in place
  if (type === 'normaal') return data;
  for (let i = 0; i < data.length; i += 4) { const o = simulateRgb([data[i], data[i + 1], data[i + 2]], type); data[i] = o[0]; data[i + 1] = o[1]; data[i + 2] = o[2]; }
  return data;
}

// ---- verloop ----
export function gradientCss(g) {
  const stops = (g.stops || []).filter((s) => isHex(s.c)).slice().sort((a, b) => a.p - b.p);
  if (stops.length < 2) return 'none';
  const list = stops.map((s) => `${s.c} ${Math.round(clamp(+s.p, 0, 100))}%`).join(', ');
  return g.type === 'radial' ? `radial-gradient(circle at center, ${list})` : g.type === 'conic' ? `conic-gradient(from ${Math.round(+g.angle || 0)}deg, ${list})` : `linear-gradient(${Math.round(((+g.angle || 0) % 360 + 360) % 360)}deg, ${list})`;
}
export function gradientAt(stops, p) { // kleur op positie p (0..100)
  const s = stops.slice().sort((a, b) => a.p - b.p); if (p <= s[0].p) return s[0].c; if (p >= s[s.length - 1].p) return s[s.length - 1].c;
  for (let i = 0; i < s.length - 1; i++) if (p >= s[i].p && p <= s[i + 1].p) return mix(s[i].c, s[i + 1].c, (p - s[i].p) / Math.max(1e-9, s[i + 1].p - s[i].p));
  return s[0].c;
}

// ---- kleuren uit een foto (median cut) ----
export function extractPalette(data, k = 5, maxSamples = 6000) {
  const px = [], total = data.length / 4, step = Math.max(1, Math.floor(total / maxSamples));
  for (let i = 0; i < total; i += step) { const o = i * 4; if (data[o + 3] >= 125) px.push([data[o], data[o + 1], data[o + 2]]); }
  if (!px.length) return [];
  let boxes = [px];
  while (boxes.length < k) {
    let bi = -1, bs = 0, bc = 0;
    boxes.forEach((b, i) => { if (b.length < 2) return; const rng = [0, 1, 2].map((c) => { let mn = 255, mx = 0; b.forEach((p) => { if (p[c] < mn) mn = p[c]; if (p[c] > mx) mx = p[c]; }); return mx - mn; }); const m = Math.max(...rng); const score = m * Math.sqrt(b.length); if (score > bs) { bs = score; bi = i; bc = rng.indexOf(m); } });
    if (bi < 0 || bs === 0) break;
    const b = boxes[bi].slice().sort((x, y) => x[bc] - y[bc]), mid = b.length >> 1; boxes.splice(bi, 1, b.slice(0, mid), b.slice(mid));
  }
  return boxes.filter((b) => b.length).sort((a, b) => b.length - a.length).map((b) => { const s = [0, 0, 0]; b.forEach((p) => { s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; }); return rgbToHex(s[0] / b.length, s[1] / b.length, s[2] / b.length); });
}

// ---- opgeslagen paletten ----
export const PAL_MAX = 24;
export function cleanPalettes(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, PAL_MAX).map((p) => (p && typeof p === 'object' && Array.isArray(p.colors) ? { name: String(p.name || 'Palet').slice(0, 30), colors: p.colors.filter(isHex).slice(0, 12).map((c) => c.toLowerCase()) } : null)).filter((p) => p && p.colors.length >= 2);
}
export const paletteText = (colors) => colors.join(', ');
export const paletteCss = (colors) => ':root{\n' + colors.map((c, i) => `  --kleur-${i + 1}: ${c};`).join('\n') + '\n}';

// ---- kleurensets voor de kleurplaten ----
export const SETS = [
  { id: 'regenboog', name: 'Regenboog', colors: ['#000000', '#4b5563', '#9ca3af', '#ffffff', '#7c2d12', '#b45309', '#d97706', '#fcd9b6', '#ef4444', '#f43f5e', '#ec4899', '#a855f7', '#6366f1', '#3b82f6', '#06b6d4', '#14b8a6', '#22c55e', '#84cc16', '#facc15', '#fde68a', '#f97316', '#bae6fd', '#bbf7d0', '#fbcfe8'] },
  { id: 'pastel', name: 'Pastel', colors: ['#fecaca', '#fed7aa', '#fef08a', '#d9f99d', '#bbf7d0', '#a7f3d0', '#99f6e4', '#a5f3fc', '#bae6fd', '#bfdbfe', '#c7d2fe', '#ddd6fe', '#e9d5ff', '#f5d0fe', '#fbcfe8', '#fecdd3', '#ffffff', '#e5e7eb', '#d6d3d1', '#fde68a', '#fcd9b6', '#f5f5f4', '#cbd5e1', '#fdf4ff'] },
  { id: 'neon', name: 'Neon', colors: ['#ff0054', '#ff5400', '#ffbd00', '#ccff00', '#39ff14', '#00ff9f', '#00f5ff', '#00b4ff', '#4d4dff', '#8a2be2', '#bf00ff', '#ff00e6', '#ff3366', '#fffb00', '#00ffd5', '#7cff00', '#ffffff', '#111111', '#ff7b00', '#00d4ff', '#9d00ff', '#ff0099', '#c6ff00', '#ffe600'] },
  { id: 'aarde', name: 'Aarde', colors: ['#3e2723', '#5d4037', '#6d4c41', '#8d6e63', '#a1887f', '#bcaaa4', '#d7ccc8', '#efebe9', '#33691e', '#558b2f', '#7cb342', '#9ccc65', '#827717', '#afb42b', '#e0c097', '#f5deb3', '#bf360c', '#e64a19', '#ff8a65', '#ffab91', '#455a64', '#78909c', '#b0bec5', '#263238'] },
  { id: 'zee', name: 'Zee', colors: ['#01161e', '#124559', '#598392', '#aec3b0', '#eff6e0', '#0b3954', '#087e8b', '#bfd7ea', '#0077b6', '#00b4d8', '#90e0ef', '#caf0f8', '#023e8a', '#48cae4', '#ade8f4', '#03045e', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#ffffff', '#f1faee', '#a8dadc', '#457b9d'] },
  { id: 'herfst', name: 'Herfst', colors: ['#582f0e', '#7f4f24', '#936639', '#a68a64', '#b6ad90', '#c2c5aa', '#a4ac86', '#656d4a', '#414833', '#333d29', '#9d0208', '#d00000', '#dc2f02', '#e85d04', '#f48c06', '#faa307', '#ffba08', '#ffd60a', '#6a040f', '#370617', '#fff3b0', '#e09f3e', '#9e2a2b', '#540b0e'] },
  { id: 'huid', name: 'Huidskleuren', colors: ['#ffe0bd', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a21', '#3b2219', '#ffdbac', '#f5cba7', '#d9a066', '#a0522d', '#6f4e37', '#000000', '#ffffff', '#ef4444', '#f9a8d4', '#fde68a', '#3b82f6', '#22c55e', '#7c2d12', '#facc15', '#a855f7', '#9ca3af', '#4b5563'] },
  { id: 'grijs', name: 'Grijstinten', colors: ['#000000', '#171717', '#262626', '#404040', '#525252', '#737373', '#8a8a8a', '#a3a3a3', '#bdbdbd', '#d4d4d4', '#e5e5e5', '#f5f5f5', '#ffffff', '#1c1917', '#292524', '#44403c', '#57534e', '#78716c', '#a8a29e', '#d6d3d1', '#0f172a', '#334155', '#64748b', '#cbd5e1'] },
];

// ---- spellen ----
// 1. Raad de kleur / 2. Kleurmenger
export function matchScore(a, b) { return clamp(Math.round(100 * (1 - colorDistance(a, b) / 330)), 0, 100); }
export const MIX_PRIMARIES = [{ id: 'rood', name: 'Rood', c: '#e53935' }, { id: 'geel', name: 'Geel', c: '#fdd835' }, { id: 'blauw', name: 'Blauw', c: '#1e88e5' }, { id: 'wit', name: 'Wit', c: '#ffffff' }];
export function mixTarget(r = rand) {
  const w = MIX_PRIMARIES.map(() => 0); const k = 1 + r(3); const idxs = []; while (idxs.length < k) { const i = r(MIX_PRIMARIES.length); if (!idxs.includes(i)) idxs.push(i); }
  idxs.forEach((i) => { w[i] = 1 + r(4); });
  return { weights: w, color: mixPaint(MIX_PRIMARIES.map((p, i) => ({ c: p.c, w: w[i] }))) };
}
export const mixFromWeights = (w) => mixPaint(MIX_PRIMARIES.map((p, i) => ({ c: p.c, w: w[i] || 0 })));
export function starsForScore(avg) { return avg >= 90 ? 3 : avg >= 75 ? 2 : avg >= 55 ? 1 : 0; }
// 3. Welke is anders?
export function oddOneOut(level, r = rand) {
  const L = Math.max(1, level | 0), n = Math.min(7, 2 + Math.floor((L - 1) / 3)), delta = Math.max(2.4, 24 * Math.pow(0.88, L - 1));
  const h = r(360), s = rf(r, 50, 85), l = rf(r, 38, 66), base = hslToHex(h, s, l), sign = l + delta > 92 ? -1 : l - delta < 8 ? 1 : (r(2) ? 1 : -1);
  return { n, base, odd: hslToHex(h, s, l + sign * delta), idx: r(n * n), delta };
}
// 4. Kleurgeheugen (Simon)
export const SIMON = [{ c: '#ef4444', f: 262 }, { c: '#22c55e', f: 330 }, { c: '#3b82f6', f: 392 }, { c: '#facc15', f: 523 }];
export function simonNext(seq, r = rand) { return [...seq, r(4)]; }
export function simonCheck(seq, input) { for (let i = 0; i < input.length; i++) if (input[i] !== seq[i]) return 'fout'; return input.length === seq.length ? 'klaar' : 'door'; }
export function cleanGames(o) {
  const g = o && typeof o === 'object' ? o : {}, n = (v) => (Number.isFinite(+v) && +v > 0 ? Math.round(+v) : 0);
  return { raad: n(g.raad), menger: n(g.menger), anders: n(g.anders), geheugen: n(g.geheugen) };
}
