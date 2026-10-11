// Huisdier 2.0 - handgetekende SVG kamers, meubels en huizen (kawaii, pastel). Geen emoji's, geen imports.
// Meubel-box: viewBox 0 0 100 100, onderkant op y=100. Kamer: viewBox 0 0 360 300. Huis: viewBox 0 0 300 260.

export const ROOMS = [
  { id: 'woonkamer', name: 'Woonkamer' },
  { id: 'keuken', name: 'Keuken' },
  { id: 'slaapkamer', name: 'Slaapkamer' },
  { id: 'badkamer', name: 'Badkamer' },
  { id: 'tuin', name: 'Tuin' },
  { id: 'speelkamer', name: 'Speelkamer' },
];

export const HOUSES = [
  { id: 'huisje', name: 'Gezellig huisje', desc: 'Een warm roze huisje met houten vloer en een boograam.', price: 0, minLevel: 1 },
  { id: 'cottage', name: 'Bloemen-cottage', desc: 'Behang vol bloemetjes, een bloembak voor het raam en een tuin vol rozen.', price: 100, minLevel: 2 },
  { id: 'boomhut', name: 'Boomhut', desc: 'Hoog in de boom: houten planken, hangende bladeren en uitzicht over het bos.', price: 180, minLevel: 3 },
  { id: 'strandhuisje', name: 'Strandhuisje', desc: 'Blauw-witte strepen, zand onder je pootjes en de zee voor je neus.', price: 260, minLevel: 4 },
  { id: 'iglo', name: 'Iglo', desc: 'Stoere ijsblokken, een rond raam en het noorderlicht erbuiten.', price: 340, minLevel: 5 },
  { id: 'snoephuis', name: 'Snoephuis', desc: 'Peperkoek, glazuur, lollies en snoepjes overal.', price: 420, minLevel: 6 },
  { id: 'piraten-schip', name: 'Piratenschip', desc: 'Een houten schip met patrijspoorten, touwen en lantaarns op volle zee.', price: 520, minLevel: 7 },
  { id: 'villa', name: 'Villa met zwembad', desc: 'Ruim en licht met marmeren vloer, panoramaramen en een blauw zwembad.', price: 620, minLevel: 8 },
  { id: 'kasteel', name: 'Kasteel', desc: 'Stenen muren, fakkels, gotische ramen en vlaggen: koninklijk wonen.', price: 720, minLevel: 9 },
  { id: 'ruimtebasis', name: 'Ruimtebasis', desc: 'Metalen panelen, lichtstrips en een patrijspoort met uitzicht op de planeten.', price: 800, minLevel: 10 },
];

// x,y in procenten: x = midden van het meubel, y = voetpunt van het meubel; s = schaal (1 = 84px in een kamer van 360x300).
const slotSet = (a, b, c) => [
  { x: 15, y: 76, s: a }, { x: 85, y: 76, s: a },
  { x: 37, y: 68, s: b }, { x: 63, y: 68, s: b },
  { x: 11, y: 97, s: c }, { x: 89, y: 97, s: c },
];
export const SLOT_POS = {
  woonkamer: slotSet(1.15, 0.78, 0.8),
  keuken: slotSet(1.2, 0.8, 0.8),
  slaapkamer: slotSet(1.2, 0.76, 0.82),
  badkamer: slotSet(1.15, 0.76, 0.8),
  tuin: [{ x: 14, y: 78, s: 1.25 }, { x: 86, y: 78, s: 1.25 }, { x: 38, y: 70, s: 0.8 }, { x: 62, y: 70, s: 0.8 }, { x: 11, y: 98, s: 0.85 }, { x: 89, y: 98, s: 0.85 }],
  speelkamer: slotSet(1.1, 0.8, 0.85),
};
export const FLOOR_Y = { woonkamer: 78, keuken: 78, slaapkamer: 78, badkamer: 78, tuin: 80, speelkamer: 78 };

// ---------------------------------------------------------------- helpers
const INK = '#6b567a';
const hx = (c) => { c = c.replace('#', ''); if (c.length === 3) c = [...c].map((x) => x + x).join(''); return [0, 2, 4].map((i) => parseInt(c.substr(i, 2), 16)); };
const mix = (a, b, t) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const lt = (c, t = 0.4) => mix(c, '#ffffff', t);
const dk = (c, t = 0.2) => mix(c, '#4a3a66', t);
const f1 = (n) => +n.toFixed(1);
let UID = 0;

const heartD = (x, y, s) => `M${x} ${y + s * 0.8}C${x - s * 1.5} ${y - s * 0.2} ${x - s * 0.8} ${y - s * 1.1} ${x} ${y - s * 0.4}C${x + s * 0.8} ${y - s * 1.1} ${x + s * 1.5} ${y - s * 0.2} ${x} ${y + s * 0.8}Z`;
const starD = (x, y, R, r = R * 0.46) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; d += (i ? 'L' : 'M') + f1(x + Math.cos(a) * q) + ' ' + f1(y + Math.sin(a) * q); } return d + 'Z'; };

function kit(night) {
  const pre = 'k' + (++UID) + '_';
  let n = 0;
  const defs = [], cache = {};
  const k = { pre, night: !!night, defs, gl: '' };
  k.id = () => pre + (++n);
  k.grad = (c1, c2) => {
    const key = c1 + c2;
    if (cache[key]) return cache[key];
    const i = k.id();
    defs.push(`<linearGradient id="${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`);
    return (cache[key] = `url(#${i})`);
  };
  const F = (c) => (c === 'none' || c[0] === 'u' ? c : k.grad(lt(c, 0.4), c));
  const st = (sw) => (sw ? ` stroke="${INK}" stroke-width="${sw}"` : '');
  const op = (o) => (o === 1 ? '' : ` opacity="${o}"`);
  k.r = (x, y, w, h, c, rx = 3, sw = 2, o = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${F(c)}"${st(sw)}${op(o)}/>`;
  k.c = (x, y, r, c, sw = 2, o = 1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${F(c)}"${st(sw)}${op(o)}/>`;
  k.e = (x, y, rx, ry, c, sw = 2, o = 1) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${F(c)}"${st(sw)}${op(o)}/>`;
  k.p = (d, c, sw = 2, o = 1) => `<path d="${d}" fill="${F(c)}"${st(sw)}${op(o)}/>`;
  k.l = (d, col = INK, sw = 2) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}"/>`;
  k.f = (d, c, o = 1) => `<path d="${d}" fill="${c}"${op(o)}/>`;
  k.fc = (x, y, r, c, o = 1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"${op(o)}/>`;
  k.fe = (x, y, rx, ry, c, o = 1) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}"${op(o)}/>`;
  k.fr = (x, y, w, h, c, o = 1, rx = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${c}"${op(o)}/>`;
  k.hl = (x, y, rx, ry = rx) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#ffffff" opacity=".6"/>`;
  k.glow = (x, y, r, c = '#ffe08a') => {
    if (!night) return;
    const i = k.id();
    defs.push(`<radialGradient id="${i}"><stop offset="0" stop-color="${c}" stop-opacity=".85"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`);
    k.gl += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${i})"/>`;
  };
  return k;
}

const face = (k, x, y, s = 1) => k.fc(x - 5 * s, y, 1.8 * s, INK) + k.fc(x + 5 * s, y, 1.8 * s, INK) + k.l(`M${x - 2 * s} ${y + 3 * s}Q${x} ${y + 5.5 * s} ${x + 2 * s} ${y + 3 * s}`, INK, 1.4) + k.fc(x - 8 * s, y + 3.5 * s, 2.4 * s, '#ff9db5', 0.65) + k.fc(x + 8 * s, y + 3.5 * s, 2.4 * s, '#ff9db5', 0.65);
const heart = (k, x, y, s, c) => k.p(heartD(x, y, s), c, 1.4);
const star = (k, x, y, R, c, sw = 1.4) => k.p(starD(x, y, R), c, sw);
const leaf = (k, x, y, rot, len, c) => `<g transform="translate(${x} ${y}) rotate(${rot})">${k.p(`M0 0C${f1(len * 0.3)} ${f1(-len * 0.38)} ${f1(len * 0.8)} ${f1(-len * 0.32)} ${len} 0C${f1(len * 0.8)} ${f1(len * 0.32)} ${f1(len * 0.3)} ${f1(len * 0.38)} 0 0Z`, c, 1.6)}${k.l(`M2 0H${len * 0.85}`, dk(c, 0.3), 1)}</g>`;
const flower = (k, x, y, r, c, m = '#ffe27a') => { let s = ''; for (let i = 0; i < 5; i++) { const a = i * 1.2566; s += k.c(f1(x + Math.cos(a) * r), f1(y + Math.sin(a) * r), f1(r * 0.75), c, 1.3); } return s + k.c(x, y, f1(r * 0.62), m, 1.3); };
const pot = (k, x, y, w, h, c) => k.p(`M${x} ${y}H${x + w}L${x + w * 0.86} ${y + h}H${x + w * 0.14}Z`, c, 2) + k.r(x - 2, y - 4, w + 4, 8, lt(c, 0.15), 3, 2);
const books = (k, x, yb, list) => { let s = ''; for (const [w, h, c] of list) { s += k.r(x, yb - h, w, h, c, 2, 1.5); x += w; } return s; };
const cloud = (k, x, y, s = 1, o = 0.95) => k.fe(x, y, 16 * s, 7 * s, '#ffffff', o) + k.fc(x - 6 * s, y - 5 * s, 8 * s, '#ffffff', o) + k.fc(x + 5 * s, y - 7 * s, 9 * s, '#ffffff', o);

// ---------------------------------------------------------------- meubels
const FD = {};

// --- woonkamer
FD['bank'] = (k) => k.r(14, 88, 10, 10, '#b98457', 3) + k.r(76, 88, 10, 10, '#b98457', 3) + k.r(10, 34, 80, 42, '#f4a6c0', 16) + k.r(2, 48, 24, 46, '#f08fb0', 12) + k.r(74, 48, 24, 46, '#f08fb0', 12) + k.r(22, 56, 56, 34, '#f9bfd3', 10) + k.l('M50 60V88', '#e394b3', 1.5) + k.r(27, 40, 18, 18, '#ffe08a', 7) + k.r(56, 42, 18, 16, '#bfe4ff', 7) + heart(k, 36, 49, 4, '#ff8fb1') + k.hl(16, 56, 3, 7);
FD['fauteuil'] = (k) => k.r(20, 90, 9, 9, '#b98457', 3) + k.r(71, 90, 9, 9, '#b98457', 3) + k.r(20, 22, 60, 50, '#9fd8c4', 18) + k.r(8, 48, 24, 44, '#86cbb3', 12) + k.r(68, 48, 24, 44, '#86cbb3', 12) + k.r(26, 58, 48, 32, '#bde8d9', 10) + star(k, 50, 44, 8, '#ffe08a') + k.hl(30, 34, 6, 3);
FD['tv'] = (k) => k.l('M40 18L28 5M60 18L72 5') + k.fc(28, 5, 2.5, '#ff9bb6') + k.fc(72, 5, 2.5, '#ff9bb6') + k.r(14, 78, 72, 20, '#d9b28a', 5) + k.r(44, 68, 12, 10, '#8d7aa0', 3) + k.r(8, 16, 84, 54, '#8c7b9e', 11) + k.r(14, 22, 72, 42, '#bde8f7', 7) + heart(k, 50, 42, 9, '#ff9bb6') + k.hl(26, 30, 7, 3) + k.fc(80, 68, 1.8, '#9fe3a0') + k.r(22, 84, 14, 7, '#c4966a', 2, 1.5) + k.r(64, 84, 14, 7, '#c4966a', 2, 1.5);
FD['boekenkast'] = (k) => k.r(12, 4, 76, 94, '#d8a97c', 5) + k.r(18, 10, 64, 82, '#f3dcbd', 3) + books(k, 20, 32, [[6, 18, '#f4a6c0'], [5, 22, '#9fd8f0'], [7, 16, '#ffe08a'], [5, 20, '#b9a3f0'], [6, 24, '#9fe0b8'], [8, 17, '#ffb88a']]) + k.r(16, 32, 68, 5, '#c28f60', 2) + books(k, 20, 62, [[7, 19, '#9fe0b8'], [5, 14, '#f4a6c0'], [6, 21, '#ffe08a']]) + k.c(66, 54, 8, '#ffb3c8', 1.5) + k.c(66, 54, 3, '#fff3d0', 1) + k.r(16, 62, 68, 5, '#c28f60', 2) + books(k, 20, 90, [[6, 20, '#b9a3f0'], [8, 16, '#ffb88a'], [5, 22, '#9fd8f0'], [6, 18, '#f4a6c0'], [7, 21, '#9fe0b8'], [5, 15, '#ffe08a']]) + k.r(16, 90, 68, 6, '#c28f60', 2);
FD['tapijt'] = (k) => k.e(50, 86, 48, 12, '#f7b6c9') + k.e(50, 86, 38, 8.5, '#fde0e8', 1.5) + k.e(50, 86, 26, 5.5, '#f7b6c9', 1.5) + [14, 28, 72, 86].map((x) => k.fc(x, 86, 1.8, '#fff')).join('') + k.fc(50, 86, 2.2, '#fff');
FD['schilderij'] = (k) => k.r(14, 16, 72, 62, '#d9a56b', 6) + k.r(21, 23, 58, 48, '#bfe8f5', 3) + k.f('M21 71V56Q38 44 52 58T79 54V71Z', '#a9e2a2') + k.fc(34, 36, 6, '#ffe27a') + k.p('M52 52L62 42L72 52V62H52Z', '#ffd0dc', 1.4) + k.r(59, 54, 6, 8, '#d98aa9', 1, 1) + k.l('M50 16V8', INK, 1.4);
FD['staande-lamp'] = (k) => { k.glow(50, 26, 48); return k.e(50, 96, 20, 5, '#c9a0d8') + k.r(47, 34, 6, 62, '#d8b87a', 2) + k.p('M30 8H70L81 38H19Z', '#ffe9a6') + k.hl(38, 18, 6, 3) + k.l('M50 38V45', INK, 1.5); };
FD['plant'] = (k) => leaf(k, 50, 62, -100, 40, '#86d99a') + leaf(k, 50, 62, -60, 42, '#a3e6a8') + leaf(k, 50, 62, -135, 38, '#7ccf93') + leaf(k, 50, 62, -20, 34, '#8fe0a0') + leaf(k, 50, 62, -160, 32, '#a3e6a8') + pot(k, 26, 66, 48, 32, '#f6b27a') + k.hl(34, 78, 3, 6);
FD['klok'] = (k) => k.r(26, 98, 48, 2, '#c4966a', 1, 1) + k.r(28, 8, 44, 90, '#c99a68', 8) + k.p('M28 16Q50 -4 72 16Z', '#d8ab78', 2) + k.c(50, 30, 15, '#fff6e0') + [0, 3, 6, 9].map((i) => { const a = i * Math.PI / 6; return k.fc(f1(50 + Math.sin(a) * 11.5), f1(30 - Math.cos(a) * 11.5), 1.3, INK); }).join('') + k.l('M50 30V21M50 30L56 33', INK, 2) + k.r(36, 52, 28, 38, '#ead0a8', 5, 1.5) + k.l('M50 52V76', '#c4966a', 1.5) + k.c(50, 78, 6, '#ffd36b', 1.8) + face(k, 50, 62, 0.6);
FD['haardvuur'] = (k) => { k.glow(50, 80, 50, '#ffb870'); return k.r(12, 26, 76, 72, '#eec8b4', 4) + k.l('M12 50H88M12 74H88M34 26V50M66 26V50M22 50V74M54 50V74M82 50V74M34 74V98M66 74V98', '#d9a98a', 1.3) + k.r(4, 14, 92, 13, '#d9a98a', 5) + k.p('M28 98V60Q28 42 50 42Q72 42 72 60V98Z', '#4a3a55', 2) + k.p('M34 98Q30 80 42 70Q42 80 49 60Q52 76 60 68Q70 84 64 98Z', '#ff9a5a', 1.6) + k.p('M42 98Q40 88 48 82Q50 90 55 86Q60 92 58 98Z', '#ffe27a', 1.2) + k.r(32, 94, 36, 5, '#a9774f', 2, 1.5) + heart(k, 32, 8, 4, '#ff8fb1') + k.r(60, 2, 12, 12, '#bfe4ff', 3, 1.5); };
FD['vissenkom'] = (k) => k.r(24, 84, 52, 16, '#d8a9c8', 6) + k.e(50, 50, 36, 34, '#cfeefa', 2, 0.75) + k.p('M16 50Q50 58 84 50Q86 84 50 84Q14 84 16 50Z', '#8fd8f0', 0, 0.55) + k.e(50, 80, 26, 4, '#f6e2b0', 0) + leaf(k, 36, 80, -80, 22, '#7ccf93') + leaf(k, 40, 80, -110, 18, '#9fe0a8') + k.p('M36 50Q44 40 56 50Q44 60 36 50Z', '#ffb36b', 1.6) + k.p('M56 50L66 42V58Z', '#ff9a6b', 1.6) + k.fc(41, 48, 1.6, INK) + k.p('M60 66Q66 60 72 66Q66 72 60 66Z', '#9fd0ff', 1.3) + k.c(30, 36, 3, '#fff', 1, 0.7) + k.c(36, 28, 2, '#fff', 1, 0.7) + k.hl(30, 38, 4, 9) + k.e(50, 17, 22, 4, '#bfe8f7', 1.5, 0.8);

// --- keuken
FD['koelkast'] = (k) => k.r(22, 4, 56, 94, '#cfeaf7', 13) + k.l('M22 38H78') + k.r(68, 14, 5, 16, '#8fb0c4', 2, 1.5) + k.r(68, 46, 5, 24, '#8fb0c4', 2, 1.5) + face(k, 44, 24, 1) + heart(k, 36, 58, 5, '#ff8fb1') + star(k, 52, 70, 5, '#ffe08a') + k.r(34, 76, 14, 10, '#fff', 1, 1.2) + k.hl(30, 14, 3, 7);
FD['kookplaat'] = (k) => k.r(10, 38, 80, 60, '#f3e4ef', 8) + k.r(6, 30, 88, 12, '#b9b0c8', 5) + k.e(30, 34, 14, 4, '#8f86a8', 1.5) + k.e(70, 34, 14, 4, '#8f86a8', 1.5) + k.r(20, 56, 60, 34, '#6f6a80', 6) + k.r(24, 60, 52, 26, '#ffd9a8', 4, 1.2) + k.c(26, 48, 3, '#ffb3c8', 1.5) + k.c(42, 48, 3, '#9fd8f0', 1.5) + k.c(58, 48, 3, '#ffe08a', 1.5) + k.c(74, 48, 3, '#b9e8a8', 1.5) + k.r(24, 94, 52, 3, '#b9b0c8', 1, 1) + k.p('M22 30V14Q22 8 30 8H44Q50 8 50 14V30Z', '#ffb3c8', 2) + k.r(20, 6, 32, 6, '#ff9bb6', 3, 1.8) + k.l('M26 4Q30 -2 26 -6M38 4Q42 -2 38 -6', '#c9c0e0', 1.6);
FD['tafel'] = (k) => k.r(16, 56, 8, 42, '#c99a68', 3) + k.r(76, 56, 8, 42, '#c99a68', 3) + k.r(6, 46, 88, 14, '#f6b8c4', 6) + k.l('M20 46V60M34 46V60M48 46V60M62 46V60M76 46V60', '#fff', 1.6) + [12, 28, 44, 60, 76, 90].map((x) => k.c(x, 62, 6, '#f6b8c4', 1.6)).join('') + k.r(43, 26, 14, 22, '#bfe4ff', 6) + k.l('M50 26V12M50 20L42 10M50 18L58 8') + k.c(50, 10, 5, '#ffb3c8', 1.5) + k.c(42, 9, 4, '#ffe08a', 1.5) + k.c(58, 7, 4, '#ffb3c8', 1.5);
FD['fruitschaal'] = (k) => k.c(34, 56, 13, '#ff8a8a') + k.l('M34 43V38M34 38Q40 34 42 38', '#7bb36b', 1.6) + k.c(58, 52, 13, '#ffb86b') + k.c(76, 62, 9, '#c6e88a') + k.p('M16 62Q26 36 44 44Q30 50 22 70Z', '#ffe27a', 1.6) + k.hl(30, 50, 3, 4) + k.p('M8 62H92Q88 94 50 94Q12 94 8 62Z', '#ffd9e6') + k.r(32, 92, 36, 8, '#e6b6cc', 4) + k.l('M20 70Q50 78 80 70', '#fff', 2);
FD['theepot'] = (k) => k.l('M40 24Q36 14 42 6M54 22Q50 12 56 4', '#c9c0e0', 1.8) + k.r(10, 88, 80, 12, '#fff0f5', 5) + k.p('M74 52Q94 46 92 66Q90 70 78 64', '#ffc6d9', 2) + k.l('M76 58Q94 60 82 76', INK, 5) + k.l('M76 58Q94 60 82 76', '#ffc6d9', 2.6) + k.e(46, 66, 30, 24, '#ffc6d9') + k.p('M24 44Q46 34 68 44Z', '#ffd7e4', 2) + k.fc(46, 38, 4, '#ff8fb1') + k.p('M17 62L6 52L10 48L22 56Z', '#ffc6d9', 2) + face(k, 46, 66, 1.1) + heart(k, 60, 56, 3, '#fff');
FD['bakplaat'] = (k) => k.fe(50, 99, 44, 3, '#000', 0.08) + k.p('M6 84H94L88 98H12Z', '#cfcfe0') + k.r(14, 96, 72, 3, '#b3b3c8', 1, 1) + [24, 46, 68].map((x, i) => k.c(x, 76, 10, '#e0a96a') + k.fc(x - 3, 73, 1.6, '#6b4a3a') + k.fc(x + 3, 78, 1.6, '#6b4a3a') + k.fc(x + 4, 72, 1.4, '#6b4a3a')).join('') + k.c(37, 62, 9, '#f2b9d0') + k.c(59, 62, 9, '#e0a96a') + k.fc(57, 60, 1.5, '#6b4a3a') + k.fc(62, 64, 1.5, '#6b4a3a') + k.l('M86 84Q92 78 98 80', INK, 2) + k.l('M20 40Q24 34 20 28M30 44Q34 38 30 32', '#c9c0e0', 1.6);
FD['kookboek'] = (k) => k.r(10, 78, 80, 11, '#9bd0e8', 3) + k.r(14, 88, 72, 11, '#f4a6c0', 3) + k.r(70, 90, 6, 7, '#fff3d0', 1, 1) + k.p('M50 76Q32 62 8 70V32Q32 24 50 38Z', '#fffaf0') + k.p('M50 76Q68 62 92 70V32Q68 24 50 38Z', '#fff3e0') + k.l('M50 38V76') + heart(k, 28, 50, 6, '#ff9bb6') + k.l('M62 46H82M62 54H80M62 62H78', '#c9b8d8', 1.8) + k.p('M82 32V50L86 46L90 50V34Z', '#ff9bb6', 1.3);
FD['kruidenrek'] = (k) => { const jar = (x, y, c, lid) => k.r(x, y, 12, 16, c, 4, 1.6) + k.r(x + 1, y - 5, 10, 6, lid, 2, 1.6) + k.r(x + 3, y + 5, 6, 6, '#fff', 2, 0.8); return jar(14, 28, '#ffd0a8', '#e09a6a') + jar(30, 26, '#b9e8c4', '#7ccf93') + jar(46, 29, '#f9c0d2', '#ec8fb0') + jar(62, 27, '#cfe4ff', '#8fb8f0') + jar(76, 30, '#fff0a8', '#e8c860') + k.r(8, 44, 84, 6, '#c9955f', 3) + k.l('M18 50V58M82 50V58') + jar(18, 62, '#e0c8ff', '#b093e8') + jar(36, 60, '#ffe0a8', '#e8b060') + k.c(62, 70, 9, '#ffb3c8', 1.6) + k.c(80, 72, 7, '#b9e8c4', 1.6) + k.r(8, 78, 84, 6, '#c9955f', 3) + k.l('M18 84V90M82 84V90'); };
FD['afwasbak'] = (k) => k.r(8, 52, 84, 46, '#c8e6d4', 6) + k.l('M50 56V96', INK, 1.6) + k.r(14, 60, 32, 34, '#b4d9c2', 4, 1.4) + k.r(54, 60, 32, 34, '#b4d9c2', 4, 1.4) + k.fc(42, 77, 2, INK) + k.fc(58, 77, 2, INK) + k.r(4, 44, 92, 10, '#f3ece0', 4) + k.p('M20 44Q20 36 28 36H60Q68 36 68 44Z', '#b9d8f0', 2) + k.l('M72 44V22Q72 14 62 14H56', INK, 5) + k.l('M72 44V22Q72 14 62 14H56', '#c9d4e8', 2.5) + k.c(32, 30, 6, '#fff', 1.2, 0.85) + k.c(44, 26, 4, '#fff', 1.2, 0.85) + k.c(40, 34, 3, '#fff', 1, 0.85) + k.c(82, 40, 5, '#ffd36b', 1.6);
FD['taartvitrine'] = (k) => k.e(50, 90, 30, 6, '#f2d4e2') + k.r(46, 82, 8, 14, '#f2d4e2', 2) + k.r(26, 94, 48, 6, '#e6b6cc', 3) + k.r(28, 62, 44, 22, '#ffe0ec', 6) + k.r(28, 70, 44, 5, '#fff', 3, 1.4) + k.r(32, 46, 36, 16, '#fff0f5', 6) + k.r(32, 52, 36, 4, '#ffb3c8', 2, 1) + k.c(50, 40, 6, '#ff6f8f', 1.6) + k.l('M50 34Q54 28 58 28', '#7bb36b', 1.5) + k.p('M18 84Q16 24 50 22Q84 24 82 84Z', '#d8f1fb', 2, 0.55) + k.hl(28, 50, 3, 14) + k.c(50, 20, 4, '#f2d4e2', 1.6);

// --- slaapkamer
FD['bed'] = (k) => k.r(6, 84, 8, 14, '#b98457', 3) + k.r(86, 84, 8, 14, '#b98457', 3) + k.r(4, 22, 92, 56, '#e0b98c', 12) + k.r(10, 28, 80, 22, '#ecc89c', 8, 1.4) + star(k, 50, 39, 7, '#fff3b0') + k.r(4, 56, 92, 32, '#fff7fb', 10) + k.e(30, 54, 20, 9, '#ffd0e0') + k.e(70, 54, 20, 9, '#ffe9a6') + k.p('M4 66Q50 60 96 66V86Q96 90 90 90H10Q4 90 4 86Z', '#b9d4ff', 2) + k.l('M4 74Q50 70 96 74', '#fff', 2) + heart(k, 28, 80, 4, '#fff') + heart(k, 70, 80, 4, '#fff');
FD['nachtkastje'] = (k) => { k.glow(50, 30, 38); return k.r(18, 58, 64, 40, '#e8c49a', 6) + k.r(24, 64, 52, 14, '#f3d6b0', 4, 1.5) + k.r(24, 80, 52, 14, '#f3d6b0', 4, 1.5) + k.fc(50, 71, 2.4, '#8d6a48') + k.fc(50, 87, 2.4, '#8d6a48') + k.r(46, 40, 8, 18, '#d8b87a', 2, 1.6) + k.p('M34 24H66L72 42H28Z', '#ffd0e8') + k.hl(42, 30, 4, 2.5) + k.r(14, 54, 72, 6, '#d8ab78', 3); };
FD['kast'] = (k) => k.r(14, 90, 10, 9, '#b98457', 3) + k.r(76, 90, 10, 9, '#b98457', 3) + k.r(12, 14, 76, 80, '#cdb8f0', 7) + k.p('M8 16Q50 -2 92 16V22H8Z', '#b9a0e8', 2) + k.r(17, 26, 32, 62, '#ddd0f7', 5, 1.6) + k.r(51, 26, 32, 62, '#ddd0f7', 5, 1.6) + k.fc(44, 58, 2.6, '#ffd36b') + k.fc(56, 58, 2.6, '#ffd36b') + star(k, 33, 42, 6, '#fff3b0') + heart(k, 67, 42, 5, '#ffb3c8');
FD['sterrenlamp'] = (k) => { k.glow(50, 30, 50, '#fff0a0'); return k.e(50, 96, 18, 4, '#c9a0d8') + k.r(47, 52, 6, 44, '#d8b87a', 2) + k.p(starD(50, 30, 28), '#ffe27a', 2.2) + face(k, 50, 30, 1) + k.hl(40, 18, 4, 2.5); };
FD['knuffelhoek'] = (k) => k.p('M6 96Q2 62 28 52Q54 44 80 54Q100 66 94 96Q50 102 6 96Z', '#c9b8f2') + k.l('M22 62Q50 52 76 64', '#fff', 1.6) + k.c(34, 38, 8, '#e0b48a') + k.c(28, 29, 4.5, '#e0b48a') + k.c(40, 29, 4.5, '#e0b48a') + k.e(34, 56, 13, 12, '#e0b48a') + k.fc(31, 37, 1.5, INK) + k.fc(38, 37, 1.5, INK) + k.e(34, 41, 3.5, 2.5, '#f5dcc0', 1.2) + k.fc(34, 40, 1.2, INK) + k.c(68, 46, 7, '#f4a6c0') + k.c(62, 38, 3.5, '#f4a6c0') + k.c(74, 38, 3.5, '#f4a6c0') + k.e(68, 62, 11, 10, '#f4a6c0') + k.fc(66, 45, 1.2, INK) + k.fc(71, 45, 1.2, INK) + heart(k, 54, 80, 6, '#fff3b0');
FD['spiegel'] = (k) => k.l('M50 80L34 98M50 80L66 98', INK, 5) + k.l('M50 80L34 98M50 80L66 98', '#d8a9c8', 2.4) + k.e(50, 44, 30, 40, '#e5b6d4') + k.e(50, 44, 23, 33, '#d6f1fb', 1.6) + k.l('M36 30L44 20M32 40L40 28', '#fff', 3) + [0, 1, 2, 3, 4].map((i) => k.fc(f1(50 + Math.cos(-2.4 + i * 0.7) * 30), f1(44 + Math.sin(-2.4 + i * 0.7) * 40), 2.4, '#fff3b0')).join('');
FD['wekker'] = (k) => k.c(32, 28, 11, '#9ed6c9') + k.c(68, 28, 11, '#9ed6c9') + k.l('M32 18L36 10M68 18L64 10') + k.l('M44 28H56') + k.r(30, 90, 8, 10, '#d8a9c8', 3) + k.r(62, 90, 8, 10, '#d8a9c8', 3) + k.c(50, 62, 34, '#ffd0dc') + k.c(50, 62, 26, '#fffaf0', 1.6) + [0, 3, 6, 9].map((i) => k.fc(f1(50 + Math.sin(i * Math.PI / 6) * 20), f1(62 - Math.cos(i * Math.PI / 6) * 20), 1.8, INK)).join('') + k.l('M50 62V48M50 62L60 66', INK, 2.4) + k.fc(50, 62, 2.4, '#ff8fb1') + k.fc(40, 70, 2.4, '#ff9db5', 0.7) + k.fc(60, 72, 2.4, '#ff9db5', 0.7) + k.hl(34, 44, 4, 6);
FD['schommelstoel'] = (k) => k.l('M10 92Q50 104 90 92', INK, 7) + k.l('M10 92Q50 104 90 92', '#d8a070', 4) + k.p('M30 14Q34 10 40 14L44 60H30Z', '#e0b98c', 2) + k.r(26, 14, 8, 50, '#e0b98c', 4) + k.p('M30 64H76V76H30Z', '#ffd0e0', 2) + k.r(26, 54, 54, 12, '#f9b8cf', 6) + k.l('M32 76L26 94M72 76L78 94M34 76L38 94M70 76L66 94', INK, 5) + k.l('M32 76L26 94M72 76L78 94M34 76L38 94M70 76L66 94', '#c99a68', 2.4) + k.r(60, 44, 24, 12, '#fff3b0', 5) + k.l('M70 58V66M76 58V66', INK, 1);
FD['kleedje'] = (k) => k.e(50, 86, 42, 11, '#d7c8f5') + k.e(50, 86, 33, 8, '#efe6ff', 1.4) + star(k, 36, 86, 4, '#ffe27a', 1.2) + star(k, 50, 85, 4.5, '#ffb3c8', 1.2) + star(k, 64, 86, 4, '#9fd8f0', 1.2) + k.l('M8 86H3M97 86H92', '#d7c8f5', 1.8);
FD['poster'] = (k) => k.r(20, 12, 60, 74, '#fffaf0', 3) + k.r(25, 17, 50, 64, '#2f3a82', 2, 1.4) + [[32, 26], [66, 30], [40, 70], [64, 62], [30, 50]].map(([x, y]) => k.fc(x, y, 1.4, '#fff3b0')).join('') + k.c(60, 28, 7, '#fff3c4', 1.2) + k.p('M46 64Q38 48 50 32Q62 48 54 64Z', '#fff', 1.8) + k.p('M46 64L40 72L48 66ZM54 64L60 72L52 66Z', '#ff8fb1', 1.4) + k.c(50, 48, 4, '#9fd8f0', 1.4) + k.p('M47 66Q50 76 53 66Z', '#ffb36b', 1.2) + k.l('M50 12V6', INK, 1.4);
FD['lavalamp'] = (k) => { k.glow(50, 50, 40, '#ff9bd0'); return k.p('M30 98Q32 82 40 78H60Q68 82 70 98Z', '#b9a3f0') + k.p('M40 78L36 22Q36 14 50 14Q64 14 64 22L60 78Z', '#ffc6e4', 2) + k.fc(50, 62, 8, '#ff7fb8') + k.fc(46, 44, 6, '#ff7fb8') + k.fc(55, 32, 4, '#ff7fb8') + k.p('M38 14Q50 4 62 14Z', '#b9a3f0') + k.fc(50, 8, 3, '#ffe27a') + k.hl(44, 46, 2, 14); };

// --- badkamer
FD['bad'] = (k) => k.r(12, 90, 8, 10, '#e8c46a', 3) + k.r(80, 90, 8, 10, '#e8c46a', 3) + k.p('M4 52H96Q96 90 70 92H30Q4 90 4 52Z', '#ffffff') + k.p('M10 56H90Q90 66 50 66Q10 66 10 56Z', '#bfe4f5', 1.4) + [[24, 48, 9], [38, 40, 11], [52, 46, 8], [64, 36, 10], [76, 46, 8], [46, 30, 6]].map(([x, y, r]) => k.c(x, y, r, '#fff', 1.4, 0.92)).join('') + k.hl(32, 42, 3, 2) + k.l('M86 52V20Q86 12 76 12H70', INK, 5) + k.l('M86 52V20Q86 12 76 12H70', '#c9d4e8', 2.4) + k.fc(68, 12, 3, '#ffb3c8') + k.hl(14, 70, 3, 7);
FD['wastafel'] = (k) => k.p('M38 52H62L66 94H34Z', '#f4eef8') + k.r(26, 94, 48, 6, '#e0d6ec', 3) + k.p('M10 40H90Q90 62 50 62Q10 62 10 40Z', '#ffffff') + k.e(50, 40, 40, 6, '#bfe4f5', 1.6) + k.l('M50 40V22Q50 14 40 14H34', INK, 5) + k.l('M50 40V22Q50 14 40 14H34', '#c9d4e8', 2.4) + k.fc(52, 24, 3, '#ffb3c8') + k.r(72, 20, 14, 18, '#bfe4ff', 4, 1.6) + k.l('M76 20L80 6M81 20L84 8', '#ff8fb1', 2.2) + k.hl(24, 48, 4, 2);
FD['handdoeken'] = (k) => k.l('M26 8V98M74 8V98', INK, 6) + k.l('M26 8V98M74 8V98', '#d8b87a', 3) + k.l('M26 26H74M26 50H74M26 74H74', INK, 5) + k.l('M26 26H74M26 50H74M26 74H74', '#e8d0a0', 2.4) + k.p('M30 24H70V58H30Z', '#f9b8cf', 1.8) + k.l('M30 34H70M30 38H70', '#fff', 1.6) + k.p('M32 50H68V86H32Z', '#b9e0f5', 1.8) + k.l('M32 60H68', '#fff', 1.6) + k.r(36, 74, 28, 14, '#fff3b0', 3, 1.6) + heart(k, 50, 80, 3.5, '#ffb3c8');
FD['rubberen-eend'] = (k) => k.p('M14 52Q4 40 20 40Q16 52 24 56Z', '#ffe27a', 2) + k.e(46, 72, 36, 24, '#ffe27a') + k.p('M32 70Q46 64 58 78Q44 90 30 80Z', '#ffd250', 1.6) + k.c(66, 38, 20, '#ffe27a') + k.p('M82 38Q98 38 94 46Q88 48 80 46Z', '#ffa85a', 1.8) + k.fc(68, 32, 2.6, INK) + k.hl(69, 31, 1, 1) + k.fc(76, 44, 3, '#ff9db5', 0.7) + k.hl(52, 24, 5, 3) + k.l('M84 20Q88 14 92 18', '#ffe27a', 0);
FD['schaal-met-zeep'] = (k) => k.r(30, 58, 8, 40, '#e8d0a0', 3) + k.r(62, 58, 8, 40, '#e8d0a0', 3) + k.r(16, 50, 68, 10, '#f0dcb4', 4) + k.p('M14 36H86Q84 52 50 52Q16 52 14 36Z', '#bfe4ff') + k.r(26, 22, 22, 16, '#ffb3c8', 6, 1.8) + k.r(50, 24, 22, 14, '#b9e8c4', 6, 1.8) + k.hl(32, 26, 4, 2) + [[30, 14, 7], [44, 8, 5], [64, 14, 8], [76, 22, 5], [54, 16, 4]].map(([x, y, r]) => k.c(x, y, r, '#fff', 1.2, 0.85)).join('');
FD['douche'] = (k) => k.r(10, 94, 80, 6, '#d8d0e8', 3) + k.r(14, 12, 72, 82, '#d8f1fb', 4, 2, 0.5) + k.l('M14 12H86M14 94H86', INK, 2.4) + k.l('M60 12V4Q60 -2 50 -2', INK, 0) + k.l('M70 4V30', '#c9d4e8', 3) + k.p('M56 28H84L80 36H60Z', '#c9d4e8', 2) + [[62, 44], [68, 52], [76, 46], [72, 62], [64, 68], [80, 58], [74, 78]].map(([x, y]) => k.p(`M${x} ${y - 3}Q${x + 3} ${y + 1} ${x} ${y + 3}Q${x - 3} ${y + 1} ${x} ${y - 3}Z`, '#8fd8f0', 1)).join('') + k.r(18, 52, 8, 3, '#fff', 1, 0) + k.c(24, 78, 4, '#fff', 1.2, 0.9) + k.c(30, 84, 3, '#fff', 1.2, 0.9) + k.hl(22, 30, 3, 14) + k.fc(20, 50, 3, '#ff9bb6');
FD['wasmand'] = (k) => k.p('M16 44H84L78 96Q77 100 70 100H30Q23 100 22 96Z', '#f0d4a0') + k.l('M20 56H80M21 68H79M22 80H78M32 44L34 100M50 44V100M68 44L66 100', '#d8b070', 1.4) + k.r(12, 38, 76, 10, '#e8c480', 5) + k.p('M44 38Q42 22 52 20Q60 20 56 38Z', '#ffb3c8', 1.8) + k.l('M43 30H57', '#fff', 2) + k.p('M64 38Q70 26 78 30L72 40Z', '#9fd0ff', 1.8) + k.l('M68 34L74 36', '#fff', 1.6) + face(k, 50, 70, 0.9);
FD['weegschaal'] = (k) => k.e(50, 86, 42, 13, '#d9d4f2') + k.e(50, 82, 42, 13, '#ece8fb') + k.r(32, 74, 36, 12, '#fff', 6, 1.6) + k.l('M38 79H62', '#c9b8e0', 1.2) + k.l('M50 86V80', '#ff8fb1', 2) + k.e(24, 86, 6, 3, '#d4cbee', 1.4) + k.e(76, 86, 6, 3, '#d4cbee', 1.4) + k.fc(50, 86, 1.6, INK) + k.hl(26, 76, 5, 2);
FD['badkamerplant'] = (k) => leaf(k, 50, 58, -90, 50, '#7ccf93') + leaf(k, 50, 58, -70, 48, '#9fe0a8') + leaf(k, 50, 58, -110, 46, '#8fdc9c') + leaf(k, 50, 58, -48, 38, '#7ccf93') + leaf(k, 50, 58, -132, 38, '#9fe0a8') + pot(k, 28, 62, 44, 36, '#9fd8f0') + k.r(34, 74, 32, 3, '#fff', 1, 0) + k.hl(34, 80, 3, 6);
FD['badmat'] = (k) => k.p('M6 84Q6 76 16 76H84Q94 76 94 84V92Q94 99 84 99H16Q6 99 6 92Z', '#bfe9e0') + k.p('M12 84Q12 80 18 80H82Q88 80 88 84V92Q88 95 82 95H18Q12 95 12 92Z', '#e2f6f1', 1.2) + k.e(40, 88, 4, 6, '#bfe9e0', 1.2) + k.e(60, 88, 4, 6, '#bfe9e0', 1.2) + [34, 38, 42, 56, 60, 64].map((x) => k.fc(x, 80.5, 1.3, '#bfe9e0')).join('');

// --- tuin
FD['bloembed'] = (k) => [[20, 52, '#ffb3c8'], [38, 40, '#ffe27a'], [56, 50, '#b9a3f0'], [74, 38, '#ff9a8a'], [30, 66, '#9fd8f0'], [66, 64, '#ffb3c8']].map(([x, y, c]) => k.l(`M${x} ${y}V84`, '#6fbf7a', 2.2) + leaf(k, x, 80, -40, 10, '#8fdc9c') + flower(k, x, y, 6, c)).join('') + k.p('M4 82Q50 70 96 82V90Q50 100 4 90Z', '#b98457') + [10, 28, 46, 64, 82].map((x) => k.e(x + 4, 93, 8, 5, '#d8d0e8', 1.6)).join('');
FD['boom'] = (k) => k.p('M42 98Q46 76 44 54H58Q56 76 62 98Z', '#b98457') + k.l('M50 70L42 60M52 66L60 58', '#8d6a48', 1.8) + k.c(30, 36, 20, '#8fdc9c') + k.c(70, 36, 20, '#8fdc9c') + k.c(50, 24, 24, '#a3e6a8') + k.c(50, 46, 18, '#8fdc9c') + [[34, 30], [62, 22], [70, 40], [48, 44], [26, 44], [52, 12]].map(([x, y]) => k.c(x, y, 4.2, '#ff7f8f', 1.4)).join('') + k.hl(40, 14, 6, 3);
FD['hangmat'] = (k) => k.r(10, 20, 6, 78, '#b98457', 3) + k.r(84, 20, 6, 78, '#b98457', 3) + k.fc(13, 20, 4, '#8d6a48') + k.fc(87, 20, 4, '#8d6a48') + k.p('M16 30Q50 80 84 30Q84 28 80 28Q50 72 20 28Q16 28 16 30Z', '#ffd9a0', 2) + k.l('M24 36Q50 70 76 36M30 32Q50 60 70 32', '#ff9bb6', 1.6) + k.e(34, 52, 9, 4, '#ffb3c8', 1.4) + k.e(50, 98, 30, 3, '#000', 0, 0.08);
FD['vijver'] = (k) => k.e(50, 80, 46, 18, '#cfc8e0') + k.e(50, 80, 38, 13, '#8fd8f0') + k.e(50, 80, 30, 9, '#a9e6f8', 1.2) + k.c(34, 80, 8, '#7ccf93', 1.6) + k.c(62, 84, 7, '#7ccf93', 1.6) + k.c(48, 76, 4.5, '#ffb3c8', 1.4) + k.p('M38 62Q40 52 44 60Q48 50 52 60Q56 52 58 62Z', '#fff', 1.4, 0).replace('opacity="0"', '') + k.l('M80 76V50M86 78V56M74 78V58', '#6fbf7a', 2) + k.e(80, 49, 2.6, 6, '#b98457', 1.4) + k.e(86, 55, 2.4, 5, '#b98457', 1.4) + k.l('M24 82Q30 86 36 83', '#fff', 1.4);
FD['vogelhuisje'] = (k) => k.r(46, 56, 8, 44, '#b98457', 2) + k.r(22, 34, 56, 28, '#f6c8a0', 5) + k.p('M16 36L50 8L84 36Z', '#f48fa6', 2.2) + k.c(50, 48, 7, '#6b4a5a', 1.8) + k.r(36, 60, 28, 4, '#c99a68', 2, 1.6) + k.p('M60 72Q66 60 74 66Q78 76 66 80Z', '#9fd0ff', 1.6) + k.fc(68, 68, 1.2, INK) + k.p('M74 70L80 71L74 73Z', '#ffa85a', 1) + k.c(50, 22, 3, '#fff3b0', 1.2);
FD['bankje'] = (k) => k.r(14, 76, 8, 22, '#b98457', 3) + k.r(78, 76, 8, 22, '#b98457', 3) + k.r(10, 62, 80, 12, '#e8b27a', 4) + k.r(12, 24, 76, 10, '#e8b27a', 4) + k.r(12, 40, 76, 10, '#e8b27a', 4) + k.r(14, 24, 7, 52, '#d49a62', 3) + k.r(79, 24, 7, 52, '#d49a62', 3) + k.r(34, 54, 20, 10, '#ffb3c8', 5, 1.6) + heart(k, 44, 59, 2.6, '#fff');
FD['windmolen'] = (k) => k.p('M32 98L38 44H62L68 98Z', '#f6e8d0') + k.p('M34 44Q50 22 66 44Z', '#f48fa6', 2.2) + k.r(44, 76, 12, 22, '#b98457', 6, 1.8) + k.r(44, 56, 12, 10, '#bfe4ff', 3, 1.6) + k.l('M36 82H64', '#e8d0a8', 1.2) + `<g transform="translate(50 40) rotate(20)">${[0, 90, 180, 270].map((a) => `<g transform="rotate(${a})">${k.l('M0 0V-36', INK, 4)}${k.r(2, -36, 11, 24, '#fffaf0', 1.5, 1.6)}${k.l('M2 -28H13M2 -20H13', '#d8c8e8', 1)}</g>`).join('')}</g>` + k.c(50, 40, 4.5, '#ffd36b', 1.8);
FD['lampionnen'] = (k) => { const L = (x, y, c) => { k.glow(x, y + 8, 22, c); return k.l(`M${x} ${y - 2}V${y}`, INK, 1.5) + k.e(x, y + 9, 8, 10, c) + k.l(`M${x - 8} ${y + 9}Q${x} ${y + 12} ${x + 8} ${y + 9}`, lt(INK, 0.3), 1) + k.r(x - 3, y + 17, 6, 3, '#e8c46a', 1, 1.2); }; return k.r(8, 14, 5, 86, '#b98457', 2) + k.r(87, 14, 5, 86, '#b98457', 2) + k.l('M10 18Q50 48 90 18', INK, 1.8) + L(24, 28, '#ff9bb6') + L(38, 36, '#ffe27a') + L(52, 38, '#9fe0b8') + L(66, 36, '#9fd0ff') + L(79, 28, '#e0b0ff') + k.fc(10, 14, 4, '#ffd36b') + k.fc(90, 14, 4, '#ffd36b'); };
FD['schommel'] = (k) => k.l('M14 98L36 6M86 98L64 6M36 6H64', INK, 7) + k.l('M14 98L36 6M86 98L64 6M36 6H64', '#d49a62', 3.6) + k.l('M40 7V68M60 7V68', INK, 2.6) + k.r(34, 68, 32, 7, '#ff9bb6', 3) + k.hl(42, 70, 6, 1.4) + k.fc(14, 98, 0.1, INK);
FD['barbecue'] = (k) => k.l('M30 62L22 98M70 62L78 98M50 70V98', INK, 5) + k.l('M30 62L22 98M70 62L78 98M50 70V98', '#8f86a8', 2.4) + k.p('M12 44H88Q86 66 50 68Q14 66 12 44Z', '#e86f7a') + k.e(50, 44, 38, 6, '#4a3a55', 1.8) + k.l('M20 44H80', '#c9c0e0', 1.4) + k.e(34, 40, 9, 5, '#ff9a8a', 1.6) + k.e(56, 39, 9, 5, '#ffb86b', 1.6) + k.e(70, 40, 7, 4, '#b9e8a8', 1.6) + k.l('M28 30Q34 22 28 14M52 28Q58 20 52 10M66 30Q72 22 66 14', '#c9c0e0', 2) + k.c(70, 62, 3, '#ffe27a', 1.2) + k.hl(24, 54, 5, 2.5);
FD['zandbak'] = (k) => k.p('M4 74H96V94Q96 100 90 100H10Q4 100 4 94Z', '#e8b27a') + k.p('M8 74H92Q90 86 50 86Q10 86 8 74Z', '#f6e2b0', 1.6) + k.p('M30 76L34 54H52L56 76Z', '#f6e2b0', 1.8) + k.r(34, 48, 18, 8, '#f6e2b0', 2, 1.8) + k.l('M43 48V40', INK, 1.6) + star(k, 43, 38, 4, '#ff8fb1', 1) + k.p('M64 70H82L78 56H68Z', '#9fd0ff', 1.8) + k.l('M66 58Q73 50 80 58', INK, 1.8) + k.r(82, 66, 4, 18, '#ff9bb6', 1, 1.4);

// --- speelkamer
FD['poppenhuis'] = (k) => k.r(10, 40, 80, 58, '#ffe3c2', 4) + k.p('M4 44L50 8L96 44Z', '#f48fa6', 2.2) + k.l('M10 70H90') + k.r(18, 48, 24, 16, '#d8f1fb', 3, 1.6) + k.r(58, 48, 24, 16, '#d8f1fb', 3, 1.6) + k.l('M30 48V64M18 56H42M70 48V64M58 56H82', '#fff', 1.4) + k.r(42, 74, 16, 24, '#c9b8f2', 7, 1.8) + k.fc(54, 87, 1.6, '#ffd36b') + k.r(18, 76, 18, 14, '#ffb3c8', 3, 1.6) + k.r(64, 76, 18, 14, '#9fe0b8', 3, 1.6) + heart(k, 50, 26, 5, '#fff');
FD['trampoline'] = (k) => k.l('M18 56L12 98M82 56L88 98M32 62L30 98M68 62L70 98', INK, 5) + k.l('M18 56L12 98M82 56L88 98M32 62L30 98M68 62L70 98', '#8f86a8', 2.4) + k.e(50, 54, 44, 12, '#9fd0ff') + k.e(50, 52, 34, 8, '#6b5fa0', 1.4) + k.l('M8 54Q50 66 92 54', '#ff9bb6', 3) + k.c(50, 26, 12, '#ffd36b') + k.e(50, 42, 10, 12, '#ff8fb1') + face(k, 50, 24, 0.9) + k.l('M40 36L32 26M60 36L68 26', INK, 4) + k.l('M40 36L32 26M60 36L68 26', '#ffd36b', 2);
FD['blokken'] = (k) => k.r(12, 66, 34, 32, '#ffb3c8', 5) + k.r(52, 66, 34, 32, '#9fd8f0', 5) + k.r(32, 34, 34, 32, '#ffe27a', 5) + star(k, 29, 82, 9, '#fff', 1.4) + k.c(69, 82, 9, '#fff', 1.4) + k.p('M49 40L60 60H38Z', '#fff', 1.4) + k.r(14, 68, 30, 6, '#fff', 3, 0, 0.35) + k.hl(40, 38, 4, 2);
FD['kleine-glijbaan'] = (k) => k.r(10, 40, 24, 6, '#ffb3c8', 3) + k.l('M14 46L10 98M30 46L34 98', INK, 5) + k.l('M14 46L10 98M30 46L34 98', '#8f86a8', 2.4) + k.l('M13 58H31M12 72H32M11 86H33', INK, 3) + k.p('M34 36Q60 40 70 64Q78 84 92 90V98Q70 96 62 70Q54 52 34 50Z', '#ffd36b', 2) + k.l('M36 38Q60 42 70 66Q78 86 92 92', '#ff9bb6', 3) + k.r(10, 30, 24, 10, '#9fd8f0', 5) + k.c(22, 22, 8, '#ffe0c0') + k.fc(20, 21, 1.2, INK) + k.fc(25, 21, 1.2, INK);
FD['speelgoedkist'] = (k) => k.c(36, 34, 9, '#e0b48a') + k.c(31, 27, 4, '#e0b48a') + k.c(41, 27, 4, '#e0b48a') + k.fc(34, 33, 1.2, INK) + k.fc(39, 33, 1.2, INK) + k.c(62, 30, 11, '#ff8fb1') + k.l('M54 28Q62 36 70 28', '#fff', 1.4) + k.r(48, 34, 14, 14, '#9fd8f0', 3, 1.6) + k.r(14, 52, 72, 46, '#b9a3f0', 6) + k.r(10, 46, 80, 12, '#c9b8f8', 5) + k.l('M14 74H86', INK, 1.6) + k.r(44, 64, 12, 12, '#ffd36b', 3, 1.8) + star(k, 28, 85, 5, '#ffe27a', 1.2) + heart(k, 72, 85, 5, '#ffb3c8');
FD['tentje'] = (k) => k.p('M50 8L94 98H6Z', '#ffb3c8') + k.p('M50 8L68 98H32Z', '#fff', 0).replace('<path', '<path opacity=".6"') + k.p('M50 8L94 98H78Z', '#f99ab6', 0) + k.l('M50 8L94 98M50 8L6 98M50 8L32 98M50 8L68 98', INK, 1.4) + k.p('M50 50L72 98H28Z', '#4a3a66', 2) + k.p('M50 50L50 98L32 98Z', '#ffe27a', 1.6) + k.l('M50 8V-2', INK, 2) + k.p('M50 -2L62 3L50 8Z', '#9fd8f0', 0).replace('<path', '<path transform="translate(0 4)"') + star(k, 50, 74, 4, '#fff3b0', 1);
FD['bal'] = (k) => { let s = k.c(50, 62, 36, '#fff'); const cols = ['#ff9bb6', '#ffe27a', '#9fd8f0', '#b9e8a8']; for (let i = 0; i < 4; i++) { const a0 = i * Math.PI / 2 + 0.3, a1 = a0 + Math.PI / 4; s += k.f(`M50 62L${f1(50 + Math.cos(a0) * 36)} ${f1(62 + Math.sin(a0) * 36)}A36 36 0 0 1 ${f1(50 + Math.cos(a1) * 36)} ${f1(62 + Math.sin(a1) * 36)}Z`, cols[i]); } return s + k.c(50, 62, 36, 'none', 2.2) + k.c(50, 62, 5, '#fff', 1.6) + k.hl(34, 44, 7, 4) + face(k, 50, 78, 0.8); };
FD['piano'] = (k) => k.r(8, 34, 84, 54, '#c9b8f2', 6) + k.r(14, 18, 72, 20, '#b9a3f0', 5) + heart(k, 50, 28, 5, '#fff') + k.r(14, 56, 72, 22, '#fff', 3, 1.8) + [0, 1, 2, 3, 4, 5, 6].map((i) => k.l(`M${24 + i * 10.3} 56V78`, INK, 1)).join('') + [[22, 0], [32, 0], [52, 0], [62, 0], [72, 0]].map(([x]) => k.r(x, 56, 6, 14, '#5b4a6b', 1, 1)).join('') + k.r(14, 86, 8, 14, '#8d6a48', 2) + k.r(78, 86, 8, 14, '#8d6a48', 2) + k.r(40, 90, 20, 8, '#ffb3c8', 3, 1.6);
FD['tekentafel'] = (k) => k.l('M18 62L14 98M82 62L86 98', INK, 6) + k.l('M18 62L14 98M82 62L86 98', '#d49a62', 3) + k.r(6, 50, 88, 14, '#f3d6b0', 5) + k.p('M16 48L22 18H62L56 48Z', '#fff', 1.6) + k.l('M24 40Q32 24 42 36T58 28', '#ff9bb6', 2) + k.fc(30, 30, 3, '#ffe27a') + k.p('M70 50V26H82V50Z', '#9fd8f0', 1.8) + k.l('M72 26L76 16L80 26', INK, 1.6) + k.r(72, 8, 6, 8, '#ffb3c8', 1, 1) + k.l('M64 50L84 44', '#ff8fb1', 3) + k.l('M60 50L82 46', INK, 0);
FD['ballenbad'] = (k) => k.p('M4 52Q4 46 14 46H86Q96 46 96 52L90 96Q89 100 82 100H18Q11 100 10 96Z', '#9fd0ff') + [[18, 42, '#ff9bb6'], [32, 38, '#ffe27a'], [46, 42, '#b9e8a8'], [60, 36, '#c9b8f2'], [74, 41, '#ffb36b'], [86, 44, '#9fd8f0'], [25, 52, '#b9e8a8'], [40, 50, '#ff8fb1'], [55, 50, '#9fd8f0'], [70, 50, '#ffe27a']].map(([x, y, c]) => k.c(x, y, 8.5, c, 1.6)).join('') + k.p('M6 56H94L90 94Q89 98 82 98H18Q11 98 10 94Z', '#7fb6f5') + k.l('M8 66H92', '#fff', 1.8, 0) + k.hl(18, 36, 2.6, 1.6) + k.hl(60, 30, 2.6, 1.6);

// ---------------------------------------------------------------- meubel-register
// [id, naam, kamer, prijs, minLevel, slotHint]
const FT = [
  ['bank', 'Bank', 'woonkamer', 60, 1], ['tv', 'Televisie', 'woonkamer', 90, 2], ['boekenkast', 'Boekenkast', 'woonkamer', 70, 1], ['tapijt', 'Tapijt', 'woonkamer', 40, 1, 'rug'],
  ['schilderij', 'Schilderij', 'woonkamer', 35, 1, 'wall'], ['staande-lamp', 'Staande lamp', 'woonkamer', 45, 1], ['plant', 'Kamerplant', 'woonkamer', 25, 1], ['klok', 'Staande klok', 'woonkamer', 55, 2],
  ['haardvuur', 'Haardvuur', 'woonkamer', 120, 3], ['vissenkom', 'Vissenkom', 'woonkamer', 80, 2], ['fauteuil', 'Fauteuil', 'woonkamer', 65, 2],
  ['koelkast', 'Koelkast', 'keuken', 80, 1], ['kookplaat', 'Kookplaat', 'keuken', 90, 2], ['tafel', 'Keukentafel', 'keuken', 55, 1], ['fruitschaal', 'Fruitschaal', 'keuken', 20, 1],
  ['theepot', 'Theepot', 'keuken', 25, 1], ['bakplaat', 'Bakplaat met koekjes', 'keuken', 35, 2], ['kookboek', 'Kookboeken', 'keuken', 30, 1], ['kruidenrek', 'Kruidenrek', 'keuken', 45, 2, 'wall'],
  ['afwasbak', 'Afwasbak', 'keuken', 70, 2], ['taartvitrine', 'Taartvitrine', 'keuken', 110, 3],
  ['bed', 'Bed', 'slaapkamer', 90, 1], ['nachtkastje', 'Nachtkastje', 'slaapkamer', 40, 1], ['kast', 'Kledingkast', 'slaapkamer', 75, 2], ['sterrenlamp', 'Sterrenlamp', 'slaapkamer', 60, 2],
  ['knuffelhoek', 'Knuffelhoek', 'slaapkamer', 65, 2], ['spiegel', 'Spiegel', 'slaapkamer', 50, 1], ['wekker', 'Wekker', 'slaapkamer', 20, 1], ['schommelstoel', 'Schommelstoel', 'slaapkamer', 70, 3],
  ['kleedje', 'Sterrenkleedje', 'slaapkamer', 30, 1, 'rug'], ['poster', 'Ruimtevaartposter', 'slaapkamer', 25, 1, 'wall'], ['lavalamp', 'Lavalamp', 'slaapkamer', 55, 3],
  ['bad', 'Bad', 'badkamer', 100, 2], ['wastafel', 'Wastafel', 'badkamer', 60, 1], ['handdoeken', 'Handdoekenrek', 'badkamer', 35, 1], ['rubberen-eend', 'Rubberen eend', 'badkamer', 15, 1],
  ['schaal-met-zeep', 'Schaal met zeep', 'badkamer', 25, 1], ['douche', 'Douche', 'badkamer', 95, 3], ['wasmand', 'Wasmand', 'badkamer', 30, 1], ['weegschaal', 'Weegschaal', 'badkamer', 20, 1],
  ['badkamerplant', 'Badkamerplant', 'badkamer', 22, 1], ['badmat', 'Badmat', 'badkamer', 28, 1, 'rug'],
  ['bloembed', 'Bloembed', 'tuin', 30, 1], ['boom', 'Appelboom', 'tuin', 80, 2], ['hangmat', 'Hangmat', 'tuin', 85, 3], ['vijver', 'Vijver', 'tuin', 100, 3], ['vogelhuisje', 'Vogelhuisje', 'tuin', 35, 1],
  ['bankje', 'Tuinbankje', 'tuin', 50, 1], ['windmolen', 'Windmolen', 'tuin', 110, 4], ['lampionnen', 'Lampionnen', 'tuin', 60, 2], ['schommel', 'Schommel', 'tuin', 75, 2], ['barbecue', 'Barbecue', 'tuin', 70, 3],
  ['zandbak', 'Zandbak', 'tuin', 45, 1],
  ['poppenhuis', 'Poppenhuis', 'speelkamer', 90, 2], ['trampoline', 'Trampoline', 'speelkamer', 100, 3], ['blokken', 'Bouwblokken', 'speelkamer', 25, 1], ['kleine-glijbaan', 'Kleine glijbaan', 'speelkamer', 85, 2],
  ['speelgoedkist', 'Speelgoedkist', 'speelkamer', 40, 1], ['tentje', 'Speeltentje', 'speelkamer', 60, 2], ['bal', 'Strandbal', 'speelkamer', 15, 1], ['piano', 'Piano', 'speelkamer', 95, 3],
  ['tekentafel', 'Tekentafel', 'speelkamer', 55, 2], ['ballenbad', 'Ballenbad', 'speelkamer', 110, 4],
];
export const FURNITURE = FT.map(([id, name, room, price, minLevel, slotHint]) => (slotHint ? { id, name, room, price, minLevel, slotHint } : { id, name, room, price, minLevel }));
const FMETA = Object.fromEntries(FURNITURE.map((f) => [f.id, f]));

export function furnitureSVG(id, size, opts = {}) {
  const d = FD[id];
  if (!d) return '';
  const k = kit(opts.night);
  const body = d(k);
  const sz = size ? (typeof size === 'number' ? ` width="${size}" height="${size}"` : ` width="${size}" height="${size}"`) : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -8 112 112" overflow="visible"${sz} stroke-linejoin="round" stroke-linecap="round" role="img" aria-label="${FMETA[id] ? FMETA[id].name : id}"><defs>${k.defs.join('')}</defs>${body}${k.gl}</svg>`;
}

// ---------------------------------------------------------------- huisstijlen
const HS = {
  huisje: { wall: '#fde3d2', b: '#fbc9c4', pat: 'hearts', fl: { t: 'planks', c1: '#e9c49b', c2: '#dfb68a', line: '#c79d72', pw: 96 }, plint: '#fff6ee', view: 'meadow', win: 'arch', wd: [92, 92], fdeco: 'none', ground: ['#b8ebb0', '#9fdc9a'], fence: 'picket', deco: 'garland' },
  cottage: { wall: '#e8f6dc', b: '#f9b8cf', pat: 'flowers', fl: { t: 'planks', c1: '#efd6a8', c2: '#e6c898', line: '#c9a870', pw: 70 }, plint: '#fffdf2', view: 'flowers', win: 'flowerbox', wd: [92, 88], fdeco: 'petals', ground: ['#c5f0b5', '#a8e49c'], fence: 'picket', deco: 'ivy' },
  boomhut: { wall: '#d9b27c', b: '#b98a56', pat: 'planks', fl: { t: 'planks', c1: '#b98a56', c2: '#a97a48', line: '#8a6038', pw: 120 }, plint: '#8f6640', view: 'forest', win: 'wood', wd: [96, 84], fdeco: 'leaves', ground: ['#9fd88a', '#86c476'], fence: 'rope', deco: 'hangleaves' },
  strandhuisje: { wall: '#f4fbff', b: '#a9d8f5', pat: 'bigstripes', fl: { t: 'planks', c1: '#f6e2b8', c2: '#efd6a4', line: '#d9bc84', pw: 100 }, plint: '#ffffff', view: 'sea', win: 'shutter', wd: [96, 84], fdeco: 'sand', ground: ['#fbe9bd', '#f4d9a0'], fence: 'bamboo', deco: 'buoy' },
  iglo: { wall: '#e6f4fc', b: '#bcdcf0', pat: 'bricks', fl: { t: 'planks', c1: '#f3fbff', c2: '#e3f2fb', line: '#bcdcf0', pw: 70 }, plint: '#cfe8f7', view: 'arctic', win: 'ice', wd: [92, 92], fdeco: 'snow', ground: ['#f7fcff', '#e0f0fa'], fence: 'ice', deco: 'icicles', sky: ['#bfe3ff', '#f0f9ff'] },
  snoephuis: { wall: '#ffe9f1', b: '#ffb3cc', pat: 'candy', fl: { t: 'tiles', c1: '#a9744f', c2: '#8f5e3e', line: '#6e4630', pw: 56 }, plint: '#ffffff', view: 'candy', win: 'candy', wd: [92, 86], fdeco: 'sprinkles', ground: ['#ffd9e8', '#ffc4dc'], fence: 'candy', deco: 'icing', sky: ['#ffd6ea', '#fff0f7'] },
  'piraten-schip': { wall: '#a9784a', b: '#7d5330', pat: 'planks', fl: { t: 'planks', c1: '#c4925c', c2: '#b4824e', line: '#7d5330', pw: 150 }, plint: '#6e4628', view: 'ocean', win: 'brass', wd: [88, 88], fdeco: 'nails', ground: ['#c4925c', '#a97a48'], fence: 'rope', deco: 'lantern', sky: ['#a8dcf0', '#eaf8ff'] },
  villa: { wall: '#e0f4f4', b: '#c4e6e8', pat: 'stripes', fl: { t: 'tiles', c1: '#fbfdff', c2: '#d6e8f2', line: '#c4d8e6', pw: 60 }, plint: '#ffffff', view: 'pool', win: 'wide', wd: [172, 84], fdeco: 'shine', ground: ['#bff0b4', '#a2e49a'], fence: 'hedge', deco: 'spots' },
  kasteel: { wall: '#cfc8e8', b: '#a9a0cf', pat: 'bricks', fl: { t: 'planks', c1: '#b9b2d6', c2: '#aaa2c9', line: '#8c84b4', pw: 64 }, plint: '#8c84b4', view: 'castle', win: 'gothic', wd: [60, 122], fdeco: 'carpet', ground: ['#a8e0a0', '#8fd088'], fence: 'stone', deco: 'torches' },
  ruimtebasis: { wall: '#3a4177', b: '#5560a8', pat: 'panels', fl: { t: 'tiles', c1: '#4a5290', c2: '#3c4480', line: '#2c3366', pw: 54 }, plint: '#8f9ad8', view: 'space', win: 'porthole', wd: [92, 92], fdeco: 'lights', ground: ['#d9d4ee', '#bdb6dc'], fence: 'rail', deco: 'strip' },
};
const ROOMTINT = { woonkamer: ['#ffffff', 0], keuken: ['#fff0a8', 0.2], slaapkamer: ['#cdb8ff', 0.2], badkamer: ['#a8ece8', 0.24], speelkamer: ['#ffc7a0', 0.2], tuin: ['#ffffff', 0] };

function wallPat(k, type, a, b) {
  const i = k.id(); let w = 30, h = 30, body = '', tr = '';
  switch (type) {
    case 'dots': w = h = 26; body = `<circle cx="13" cy="13" r="3.2" fill="${b}" opacity=".7"/>`; break;
    case 'stripes': w = 36; h = 10; body = `<rect width="18" height="10" fill="${b}" opacity=".55"/>`; break;
    case 'bigstripes': w = 52; h = 10; body = `<rect width="26" height="10" fill="${b}" opacity=".75"/>`; break;
    case 'hearts': w = h = 44; body = `<path d="${heartD(22, 22, 5)}" fill="${b}" opacity=".7"/><circle cx="1" cy="1" r="2" fill="${b}" opacity=".6"/><circle cx="43" cy="43" r="2" fill="${b}" opacity=".6"/>`; break;
    case 'flowers': w = h = 52; body = [0, 1, 2, 3, 4].map((j) => `<circle cx="${f1(26 + Math.cos(j * 1.2566) * 5)}" cy="${f1(26 + Math.sin(j * 1.2566) * 5)}" r="4" fill="${b}"/>`).join('') + `<circle cx="26" cy="26" r="2.6" fill="#ffe27a"/><path d="M0 0q5 3 8 0q-3 -5 -8 0zM52 52q-5 -3 -8 0q3 5 8 0z" fill="#9fdca0"/>`; break;
    case 'bricks': w = 64; h = 32; body = `<path d="M0 .5H64M0 16.5H64M32 .5V16.5M0 16.5V32.5M64 16.5V32.5" stroke="${b}" stroke-width="2" fill="none"/><path d="M4 4H20M38 20H54" stroke="#fff" stroke-width="2" opacity=".35"/>`; break;
    case 'planks': w = 34; h = 60; body = `<path d="M1 0V60" stroke="${b}" stroke-width="2.4"/><path d="M12 8Q16 14 12 22M24 36Q20 42 24 52" stroke="${b}" stroke-width="1.4" opacity=".5" fill="none"/><circle cx="26" cy="12" r="2" fill="${b}" opacity=".6"/>`; break;
    case 'panels': w = h = 60; body = `<rect x="3" y="3" width="54" height="54" rx="7" fill="none" stroke="${b}" stroke-width="2.4"/><circle cx="9" cy="9" r="1.8" fill="${b}"/><circle cx="51" cy="9" r="1.8" fill="${b}"/><circle cx="9" cy="51" r="1.8" fill="${b}"/><circle cx="51" cy="51" r="1.8" fill="${b}"/>`; break;
    case 'candy': w = h = 30; tr = ' patternTransform="rotate(45)"'; body = `<rect width="15" height="30" fill="${b}" opacity=".75"/>`; break;
    default: body = '';
  }
  k.defs.push(`<pattern id="${i}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"${tr}>${body}</pattern>`);
  return `url(#${i})`;
}

const FY = [204, 214, 227, 243, 263, 300];
const px = (x, y) => 180 + (x - 180) * (1 + (y - 204) / 96 * 0.7);
function floorDraw(k, fl) {
  let s = k.fr(0, 204, 360, 96, fl.c1);
  if (fl.t === 'planks') {
    let d = '';
    for (let i = 0; i < 5; i++) {
      if (i % 2) s += k.fr(0, FY[i], 360, FY[i + 1] - FY[i], fl.c2);
      const off = (i * fl.pw * 0.37) % fl.pw;
      for (let x = -720 + off; x < 1080; x += fl.pw) { const a = px(x, FY[i]), b = px(x, FY[i + 1]); if ((a > -10 && a < 370) || (b > -10 && b < 370)) d += `M${f1(a)} ${FY[i]}L${f1(b)} ${FY[i + 1]}`; }
    }
    s += k.l(d, fl.line, 1.6) + k.l('M0 214H360M0 227H360M0 243H360M0 263H360', fl.line, 1.6);
  } else {
    let d1 = '', d2 = '';
    const st = fl.pw;
    for (let i = 0; i < 5; i++) for (let j = -14; j < 20; j++) {
      const x0 = j * st, x1 = x0 + st, a0 = px(x0, FY[i]), a1 = px(x1, FY[i]), b0 = px(x0, FY[i + 1]), b1 = px(x1, FY[i + 1]);
      if (Math.max(a1, b1) < -5 || Math.min(a0, b0) > 365) continue;
      const q = `M${f1(a0)} ${FY[i]}L${f1(a1)} ${FY[i]}L${f1(b1)} ${FY[i + 1]}L${f1(b0)} ${FY[i + 1]}Z`;
      if ((i + j) % 2) d2 += q; else d1 += q;
    }
    s += k.f(d2, fl.c2) + k.l(d1 + d2, fl.line, 1.2);
  }
  s += `<rect x="0" y="204" width="360" height="14" fill="#000" opacity=".07"/>`;
  return s;
}

function floorDeco(k, t, H) {
  switch (t) {
    case 'snow': return [[40, 240, 26], [150, 285, 34], [300, 250, 30], [250, 292, 22], [90, 268, 18]].map(([x, y, r]) => k.fe(x, y, r, r * 0.3, '#ffffff', 0.8)).join('');
    case 'sand': return [[50, 250], [120, 280], [210, 240], [310, 270], [270, 290], [20, 288]].map(([x, y]) => k.fc(x, y, 1.6, '#e0c080', 0.8)).join('') + k.p('M300 280Q310 268 320 280Q310 286 300 280Z', '#ffb3c8', 1.2) + k.p('M60 286Q68 276 76 286Q68 291 60 286Z', '#fff3d0', 1.2);
    case 'sprinkles': return [[30, 230, '#ff6f9f', 20], [90, 280, '#6fd0f0', -30], [160, 244, '#ffe27a', 40], [230, 270, '#b9a0f0', 10], [300, 236, '#7fe0a0', -20], [330, 290, '#ff6f9f', 30], [60, 262, '#ffe27a', -50], [260, 244, '#6fd0f0', 60]].map(([x, y, c, r]) => `<rect x="${x - 5}" y="${y - 1.6}" width="10" height="3.2" rx="1.6" fill="${c}" transform="rotate(${r} ${x} ${y})"/>`).join('');
    case 'petals': return [[40, 240], [140, 285], [240, 250], [320, 280], [90, 262], [280, 222]].map(([x, y], i) => flower(k, x, y, 3, ['#ffb3c8', '#fff', '#ffe27a'][i % 3])).join('');
    case 'leaves': return [[50, 245, 20], [170, 282, -30], [300, 250, 60], [250, 288, 10]].map(([x, y, r]) => leaf(k, x, y, r, 16, '#8fdc9c')).join('');
    case 'carpet': return `<path d="M150 204H210L270 300H90Z" fill="#e86f8a"/><path d="M158 204H202L252 300H108Z" fill="#f48fa6"/><path d="M165 204L180 204M163 230L197 230" stroke="#ffe27a" stroke-width="2.4"/>` + [[204, 1], [225, 1.3], [250, 1.7], [282, 2.2]].map(([y, sc]) => `<path d="M${f1(180 - 22 * sc)} ${y}H${f1(180 + 22 * sc)}" stroke="#ffe27a" stroke-width="${f1(sc * 1.4)}" stroke-dasharray="${f1(4 * sc)} ${f1(5 * sc)}"/>`).join('');
    case 'lights': return [[60, 240], [300, 240], [110, 288], [250, 288]].map(([x, y]) => k.fe(x, y, 10, 3, '#7fe8ff', 0.8) + k.fe(x, y, 4, 1.4, '#ffffff', 0.9)).join('');
    case 'nails': return [[40, 224], [160, 252], [260, 224], [320, 270], [100, 286]].map(([x, y]) => k.fc(x, y, 1.6, '#5a3c22', 0.7)).join('');
    case 'shine': return `<path d="M60 300L120 204M130 300L170 204" stroke="#fff" stroke-width="10" opacity=".25"/>`;
    default: return '';
  }
}

// --- uitzicht voor ramen (coordinaten: x rond 0, y 0..100, schaal h/100)
function scene(k, H, night, cx, top, h) {
  const v = H.view, sp = v === 'space';
  const nc = (c) => (night ? mix(c, '#2a3170', 0.5) : c);
  const sky = sp ? ['#1a1a4e', '#4b3a8f'] : night ? ['#1f2760', '#4c5399'] : (H.sky || ['#9ddcff', '#eaf8ff']);
  let s = `<g transform="translate(${cx} ${top}) scale(${f1(h / 100)})">`;
  s += `<rect x="-400" y="0" width="800" height="100" fill="${k.grad(sky[0], sky[1])}"/>`;
  if (night || sp) {
    s += [[-40, 12], [-12, 8], [30, 14], [50, 34], [-55, 38], [8, 40], [-70, 20], [70, 10], [-30, 52], [60, 56]].map(([x, y]) => k.f(starD(x, y, 2.6, 1.1), '#fff3b0', 0.95)).join('');
    if (!sp) s += k.fc(24, 24, 10, '#fff6c9') + k.fc(29, 21, 9, sky[0]);
  } else {
    s += k.fc(-24, 26, 14, '#ffe27a', 0.35) + k.fc(-24, 26, 10, '#ffe27a') + cloud(k, 22, 22, 1) + cloud(k, -50, 46, 0.7, 0.8) + cloud(k, 60, 40, 0.6, 0.8);
  }
  const hills = (c1, c2, y1 = 62, y2 = 78) => k.f(`M-400 100V${y1}Q-250 ${y1 - 24} -100 ${y1}T100 ${y1 - 6}T400 ${y1 - 4}V100Z`, nc(c1)) + k.f(`M-400 100V${y2}Q-200 ${y2 - 20} -40 ${y2}T200 ${y2 - 4}T400 ${y2 + 2}V100Z`, nc(c2));
  const tree = (x, y, sc, c) => k.fr(x - 2 * sc, y, 4 * sc, 12 * sc, nc('#b98457')) + k.fc(x, y, 9 * sc, nc(c)) + k.fc(x - 6 * sc, y + 4 * sc, 6 * sc, nc(c)) + k.fc(x + 6 * sc, y + 4 * sc, 6 * sc, nc(c));
  const fir = (x, y, sc, c, snow) => k.f(`M${x} ${y - 20 * sc}L${x + 9 * sc} ${y}H${x - 9 * sc}Z`, nc(c)) + k.f(`M${x} ${y - 30 * sc}L${x + 7 * sc} ${y - 12 * sc}H${x - 7 * sc}Z`, nc(c)) + (snow ? k.f(`M${x} ${y - 30 * sc}L${x + 4 * sc} ${y - 21 * sc}L${x - 4 * sc} ${y - 21 * sc}Z`, '#fff') : '');
  switch (v) {
    case 'meadow': s += hills('#b4eaa6', '#9ddc92') + tree(-32, 52, 1, '#86d49a') + tree(40, 56, 0.8, '#8fdc9c') + [[-10, 90], [14, 86], [-50, 88], [58, 90]].map(([x, y], i) => k.fc(x, y, 2.4, nc(['#ffb3c8', '#fff', '#ffe27a', '#ffb3c8'][i]))).join('') + k.f('M-6 100Q4 80 20 66Q8 80 12 100Z', nc('#f2dcb0')); break;
    case 'forest': s += hills('#79c98a', '#5fb67a', 58, 76) + fir(-44, 74, 1.2, '#4fa86c') + fir(-22, 78, 1, '#5fb67a') + fir(30, 72, 1.3, '#4fa86c') + fir(52, 80, 1, '#6cc383') + fir(6, 84, 0.8, '#5fb67a') + fir(-62, 82, 1, '#6cc383'); break;
    case 'pool': s += hills('#cfeecb', '#bfe8b8', 46, 56) + k.fr(-400, 58, 800, 6, nc('#fdfdfd')) + `<rect x="-400" y="64" width="800" height="40" fill="${nc('#7fdcf0')}"/>` + k.l('M-40 80H-10M10 90H50M-60 94H-30M30 74H60', nc('#e8fcff'), 2.4) + k.fr(-400, 62, 800, 3, nc('#e8f4ff')) + k.fr(-64, 32, 4, 30, nc('#b98457')) + k.f('M-62 32Q-82 24 -90 34Q-72 28 -62 36ZM-62 32Q-44 22 -34 32Q-52 28 -62 36ZM-62 32Q-62 14 -72 12Q-64 22 -62 32ZM-62 32Q-56 16 -46 14Q-58 22 -62 32Z', nc('#6fcf8a')); break;
    case 'castle': s += hills('#b6e8b0', '#9fdc9a', 70, 82) + k.fr(-16, 34, 32, 40, nc('#d6cff0')) + k.fr(-34, 24, 12, 50, nc('#cfc8ea')) + k.fr(22, 28, 12, 46, nc('#cfc8ea')) + k.f('M-36 24L-28 8L-20 24Z', nc('#f08fb0')) + k.f('M20 28L28 12L36 28Z', nc('#f08fb0')) + k.f('M-10 34L0 18L10 34Z', nc('#f08fb0')) + k.fr(-4, 50, 8, 24, nc('#8c84b4'), 1, 4) + k.l('M-28 8V0', nc(INK), 1.2) + k.f('M-28 0L-20 3L-28 6Z', nc('#ff6f8f')) + k.l('M28 12V4', nc(INK), 1.2) + k.f('M28 4L36 7L28 10Z', nc('#ff6f8f')); break;
    case 'space': s += k.fc(16, 42, 17, '#f5a6c9') + `<ellipse cx="16" cy="42" rx="28" ry="7" fill="none" stroke="#ffe08a" stroke-width="3" transform="rotate(-20 16 42)"/>` + k.fc(-30, 24, 8, '#9fe3d6') + k.fc(-46, 70, 5, '#ffb36b') + k.f('M-400 100V82Q-250 74 -90 84T120 80T400 84V100Z', '#d4cff0') + k.fc(-30, 90, 6, '#bdb6dc') + k.fc(30, 92, 5, '#bdb6dc') + k.fc(-6, 70, 9, '#7fc8ff') + k.f('M-14 68Q-8 62 -2 68Q-8 74 -14 68Z', '#9fe0a0'); break;
    case 'arctic': s += (night ? k.f('M-400 30Q-200 0 -50 24T150 16T400 30V50Q150 28 -50 50T-400 46Z', '#7fffc8', 0.45) + k.f('M-300 40Q-100 18 60 38T400 30V52Q150 36 -50 56T-300 52Z', '#c08fff', 0.35) : k.f('M-400 40Q-200 20 -50 38T150 30T400 40V56Q150 42 -50 60T-400 56Z', '#e8f8ff', 0.6)) + `<path d="M-400 100V68Q-250 48 -100 68T100 60T400 64V100Z" fill="${night ? '#9ab6dc' : '#ffffff'}"/><path d="M-400 100V82Q-200 66 -40 82T200 78T400 84V100Z" fill="${night ? '#b6cbe8' : '#e8f6ff'}"/>` + fir(-40, 74, 1.1, '#6fb6a0', true) + fir(-20, 80, 0.9, '#7cc4ae', true) + fir(44, 76, 1.2, '#6fb6a0', true); break;
    case 'sea': s += `<rect x="-400" y="52" width="800" height="48" fill="${nc('#7fd0f0')}"/>` + k.f('M-400 62Q-380 56 -360 62T-320 62T-280 62T-240 62T-200 62T-160 62T-120 62T-80 62T-40 62T0 62T40 62T80 62T120 62T160 62T200 62T240 62T280 62T320 62T360 62T400 62V70H-400Z', nc('#a9e6fa'), 0.8) + k.f('M-400 100V88Q-200 76 0 88T400 84V100Z', nc('#f6e2b0')) + k.f('M-30 54L-30 36L-12 54Z', '#fff') + k.f('M-14 54L-14 40L2 54Z', nc('#ffb3c8')) + k.f('M-36 54H4L0 60H-32Z', nc('#b98457')) + k.fr(-31, 30, 1.6, 24, nc(INK)); break;
    case 'flowers': s += hills('#c7f0b8', '#b2e6a4', 66, 80) + [[-50, 84, '#ff9bb6'], [-30, 90, '#fff'], [-8, 84, '#ffe27a'], [14, 90, '#ff9bb6'], [38, 84, '#c9a0ff'], [58, 90, '#ffb36b'], [-66, 92, '#ffe27a']].map(([x, y, c]) => k.l(`M${x} ${y}V100`, nc('#6fbf7a'), 1.6) + k.fc(x, y, 5, nc(c)) + k.fc(x, y, 2, nc('#ffe27a'))).join('') + tree(0, 54, 0.9, '#9fe0a8') + k.fc(-40, 62, 2.6, nc('#ffb36b')) + k.fc(-36, 60, 2.6, nc('#ffb36b')); break;
    case 'ocean': s += `<rect x="-400" y="40" width="800" height="60" fill="${nc('#4fb0d0')}"/>` + k.f('M-400 52Q-370 44 -340 52T-280 52T-220 52T-160 52T-100 52T-40 52T20 52T80 52T140 52T200 52T260 52T320 52T380 52V60H-400Z', nc('#7fd0e8'), 0.8) + k.f('M-30 52L-26 40H26L30 52Z', nc('#6e4628')) + k.l('M0 40V14', nc(INK), 1.6) + k.f('M0 16Q16 22 14 36H0Z', nc('#fffaf0')) + k.f('M-2 20Q-14 26 -12 36H-2Z', nc('#fffaf0')) + k.f('M0 14L10 17L0 20Z', nc('#222244')) + k.f('M40 24Q46 18 52 24Q46 22 40 24ZM52 24Q58 18 64 24Q58 22 52 24Z', '#fff') + k.f('M-400 76Q-370 68 -340 76T-280 76T-220 76T-160 76T-100 76T-40 76T20 76T80 76T140 76T200 76T260 76T320 76T380 76V100H-400Z', nc('#3d9cc0'), 0.9); break;
    case 'candy': s += k.f('M-400 100V64Q-300 40 -200 64T0 60T200 62T400 60V100Z', nc('#ffc4dc')) + k.f('M-400 100V80Q-250 62 -80 80T200 76T400 82V100Z', nc('#b9f0d8')) + [[-48, 70], [-10, 74], [40, 68]].map(([x, y], i) => k.fr(x - 1.6, y, 3.2, 26, nc('#fff')) + k.fc(x, y, 11, nc(['#ff9bb6', '#ffe27a', '#9fd8f0'][i])) + `<path d="M${x} ${y}m0 -2a3 3 0 1 1 -3 3a6 6 0 1 1 6 -6" fill="none" stroke="${nc('#fff')}" stroke-width="2"/>`).join('') + [[-70, 90, '#ff9bb6'], [24, 92, '#9fe0b8'], [64, 90, '#ffe27a']].map(([x, y, c]) => k.fe(x, y, 6, 5, nc(c))).join('') + cloud(k, 60, 30, 0.8, 0.9); break;
    default: s += hills('#b4eaa6', '#9ddc92');
  }
  return s + '</g>';
}

function windowDraw(k, H, cx, top, sc, night) {
  const [w0, h0] = H.wd, w = f1(w0 * sc), h = f1(h0 * sc), x = f1(cx - w / 2), y = top, id = k.id();
  const arch = `M${x} ${f1(y + h)}V${f1(y + w / 2)}A${f1(w / 2)} ${f1(w / 2)} 0 0 1 ${f1(x + w)} ${f1(y + w / 2)}V${f1(y + h)}Z`;
  const fr = (d, c, wd) => k.l(d, INK, wd + 3.6) + k.l(d, c, wd);
  const rr = `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
  let clip, frame = '';
  const cy = f1(y + h / 2), r = f1(h / 2);
  switch (H.win) {
    case 'arch': clip = `<path d="${arch}"/>`;
      frame = fr(arch, '#fff8ee', 6) + k.l(`M${cx} ${y}V${y + h}M${x} ${f1(y + h * 0.55)}H${x + w}`, INK, 5.5) + k.l(`M${cx} ${y}V${y + h}M${x} ${f1(y + h * 0.55)}H${x + w}`, '#fff8ee', 2.6) + k.r(x - 8, y + h, w + 16, 9, '#fff8ee', 4) + k.p(`M${x - 4} ${y + 2}Q${x + 24} ${y + h * 0.35} ${x + 10} ${y + h}H${x - 8}Z`, '#ffb8cc') + k.p(`M${x + w + 4} ${y + 2}Q${x + w - 24} ${y + h * 0.35} ${x + w - 10} ${y + h}H${x + w + 8}Z`, '#ffb8cc') + pot(k, x + w - 34, y + h - 12, 20, 12, '#f6b27a') + flower(k, x + w - 24, y + h - 20, 4, '#ff9bb6');
      break;
    case 'flowerbox': clip = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>`;
      frame = fr(`M${x} ${y}H${x + w}V${y + h}H${x}Z`, '#fffdf2', 6) + k.l(`M${cx} ${y}V${y + h}M${x} ${f1(y + h * 0.5)}H${x + w}`, INK, 5.5) + k.l(`M${cx} ${y}V${y + h}M${x} ${f1(y + h * 0.5)}H${x + w}`, '#fffdf2', 2.6) + k.p(`M${x} ${y}H${x + 30}Q${x + 14} ${y + 20} ${x} ${y + 30}Z`, '#ffffff', 1.4, 0.85) + k.p(`M${x + w} ${y}H${x + w - 30}Q${x + w - 14} ${y + 20} ${x + w} ${y + 30}Z`, '#ffffff', 1.4, 0.85) + k.r(x - 6, y + h - 2, w + 12, 14, '#c99a68', 4) + [0, 1, 2, 3, 4, 5].map((i) => flower(k, x + 8 + i * (w - 16) / 5, y + h - 8, 4.2, ['#ff9bb6', '#ffe27a', '#c9a0ff'][i % 3])).join('') + [0, 1, 2, 3].map((i) => leaf(k, x + w + 2, y + 12 + i * 20, i % 2 ? -150 : -30, 12, '#7ccf93')).join('');
      break;
    case 'wood': clip = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`;
      frame = fr(rr, '#a9763f', 8) + k.p(`M${x - 20} ${y - 2}L${x - 4} ${y + 2}V${y + h - 2}L${x - 20} ${y + h + 4}Z`, '#c99a68') + k.p(`M${x + w + 20} ${y - 2}L${x + w + 4} ${y + 2}V${y + h - 2}L${x + w + 20} ${y + h + 4}Z`, '#c99a68') + k.l(`M${x - 12} ${y + 12}V${y + h - 8}M${x + w + 12} ${y + 12}V${y + h - 8}`, '#e0b27a', 1.6) + [0, 1, 2, 3, 4].map((i) => leaf(k, x + 8 + i * w / 5, y - 4, 60 + i * 15, 18, i % 2 ? '#6fcf8a' : '#8fdc9c')).join('') + k.r(x - 6, y + h, w + 12, 8, '#a9763f', 3);
      break;
    case 'wide': clip = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>`;
      frame = fr(rr, '#bfe9ec', 5) + k.l(`M${f1(x + w / 3)} ${y}V${y + h}M${f1(x + 2 * w / 3)} ${y}V${y + h}`, INK, 4.6) + k.l(`M${f1(x + w / 3)} ${y}V${y + h}M${f1(x + 2 * w / 3)} ${y}V${y + h}`, '#e8fafa', 2) + `<path d="M${x + 20} ${y + h}L${x + 50} ${y}M${x + 38} ${y + h}L${x + 58} ${y + 16}" stroke="#fff" stroke-width="7" opacity=".3"/>` + k.r(x - 6, y + h, w + 12, 8, '#ffffff', 3);
      break;
    case 'gothic': clip = `<path d="${arch}"/>`;
      frame = fr(arch, '#e0dcf2', 7) + k.l(`M${cx} ${y}V${y + h}M${x} ${f1(y + h * 0.5)}H${x + w}`, INK, 4.4) + k.l(`M${cx} ${y}V${y + h}M${x} ${f1(y + h * 0.5)}H${x + w}`, '#8c84b4', 2) + [-1, 1].map((sg) => { const bx = cx + sg * (w / 2 + 16); return k.r(bx - 9, y - 4, 18, 62, '#e86f8a', 3) + k.p(`M${bx - 9} ${y + 58}L${bx} ${y + 48}L${bx + 9} ${y + 58}L${bx + 9} ${y + 66}L${bx} ${y + 58}L${bx - 9} ${y + 66}Z`, '#e86f8a', 1.6) + star(k, bx, y + 18, 5, '#ffe27a', 1) + k.r(bx - 12, y - 8, 24, 5, '#d4b068', 2, 1.6); }).join('');
      break;
    case 'porthole': clip = `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
      frame = k.c(cx, cy, r + 5, 'none', 0) + `<circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="${INK}" stroke-width="14"/><circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="#9aa3d8" stroke-width="10"/><circle cx="${cx}" cy="${cy}" r="${r - 2}" fill="none" stroke="#c9d0f5" stroke-width="2"/>` + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => k.c(f1(cx + Math.cos(i * Math.PI / 4) * (r + 4)), f1(cy + Math.sin(i * Math.PI / 4) * (r + 4)), 2.6, '#e8ecff', 1.2)).join('');
      break;
    case 'ice': clip = `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
      frame = `<circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="${INK}" stroke-width="15"/><circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="#f4fbff" stroke-width="11"/>` + [-30, -12, 8, 28].map((dx, i) => k.p(`M${f1(cx + dx - 5)} ${f1(cy + r + 6)}L${f1(cx + dx + 5)} ${f1(cy + r + 6)}L${f1(cx + dx)} ${f1(cy + r + 18 + (i % 2) * 8)}Z`, '#d6ecfa', 1.6)).join('') + k.hl(f1(cx - r * 0.55), f1(cy - r * 0.55), 5, 3);
      break;
    case 'shutter': clip = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>`;
      frame = fr(rr, '#ffffff', 5) + k.l(`M${cx} ${y}V${y + h}`, INK, 5) + k.l(`M${cx} ${y}V${y + h}`, '#fff', 2) + [-1, 1].map((sg) => { const bx = sg < 0 ? x - 22 : x + w + 2; return k.r(bx, y - 2, 20, h + 4, '#7fc4ee', 3) + [0, 1, 2, 3, 4].map((i) => k.l(`M${bx + 3} ${y + 8 + i * 15}H${bx + 17}`, '#e8f6ff', 1.6)).join(''); }).join('') + k.p(`M${x - 14} ${y - 6}H${x + w + 14}L${x + w + 8} ${y - 24}H${x - 8}Z`, '#ff8fa8') + [0, 1, 2, 3, 4].map((i) => k.p(`M${x - 8 + i * (w + 16) / 5} ${y - 24}h${f1((w + 16) / 5)}l${-1 + i * 0.2} 18h${-f1((w + 16) / 5)}Z`, i % 2 ? '#ff8fa8' : '#ffffff', 1)).join('') + k.r(x - 6, y + h, w + 12, 7, '#ffffff', 3);
      break;
    case 'brass': clip = `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
      frame = `<circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="${INK}" stroke-width="14"/><circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="#e0b050" stroke-width="10"/><circle cx="${cx}" cy="${cy}" r="${r + 12}" fill="none" stroke="#e8d0a0" stroke-width="5" stroke-dasharray="6 3"/>` + [0, 1, 2, 3, 4, 5].map((i) => k.c(f1(cx + Math.cos(i * Math.PI / 3 + 0.5) * (r + 4)), f1(cy + Math.sin(i * Math.PI / 3 + 0.5) * (r + 4)), 2.4, '#fff0b0', 1.2)).join('') + k.l(`M${cx} ${f1(cy - r)}V${f1(cy + r)}M${f1(cx - r)} ${cy}H${f1(cx + r)}`, '#e0b050', 2.4);
      break;
    case 'candy': clip = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24"/>`;
      frame = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="none" stroke="${INK}" stroke-width="13"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="none" stroke="#ff8fb8" stroke-width="9"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="none" stroke="#fff" stroke-width="9" stroke-dasharray="9 9"/>` + k.p(`M${x - 6} ${y - 2}Q${x + 6} ${y + 14} ${x + 16} ${y - 2}Q${x + 28} ${y + 18} ${x + 42} ${y - 2}Q${x + 54} ${y + 12} ${x + 66} ${y - 2}Q${x + 78} ${y + 16} ${x + w + 6} ${y - 2}Z`, '#ffffff', 1.8) + k.c(x + 4, y + h - 2, 6, '#9fe0b8') + k.c(x + w - 4, y + h - 2, 6, '#ffe27a') + k.c(cx, y + h + 3, 6, '#9fd8f0');
      break;
    default: clip = `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`;
  }
  const cid = k.id();
  k.defs.push(`<clipPath id="${cid}">${clip}</clipPath>`);
  return { svg: `<g clip-path="url(#${cid})">${scene(k, H, night, cx, y, h)}</g>${frame}`, cx, bottom: y + h, w };
}

// --- kamerdecoratie
function roomDeco(k, roomId, H, night) {
  switch (roomId) {
    case 'keuken': {
      const id = k.id();
      k.defs.push(`<pattern id="${id}" width="18" height="18" patternUnits="userSpaceOnUse"><rect x=".6" y=".6" width="16.8" height="16.8" rx="3" fill="#ffffff" opacity=".75" stroke="${lt(H.b, 0.2)}" stroke-width="1"/></pattern>`);
      return `<rect x="0" y="132" width="360" height="62" fill="${H.wall}" opacity=".6"/><rect x="0" y="132" width="360" height="62" fill="url(#${id})"/>` + k.r(-4, 126, 368, 8, lt(H.plint, 0.1), 3) + [300, 322, 342].map((x, i) => k.l(`M${x} 134V${142 + i * 2}`, INK, 1.6) + (i === 0 ? k.p(`M${x - 6} ${150}Q${x} ${142} ${x + 6} ${150}V${166}Q${x} ${172} ${x - 6} ${166}Z`, '#c9d4e8', 1.4) : i === 1 ? k.e(x, 156, 4, 10, '#e8b27a', 1.4) : k.r(x - 5, 144, 10, 16, '#ffb3c8', 3, 1.4))).join('');
    }
    case 'slaapkamer': return [[40, 40, 7], [120, 30, 5], [300, 36, 6], [330, 90, 5], [28, 100, 5], [70, 64, 4], [210, 24, 4]].map(([x, y, r]) => k.f(starD(x, y, r), '#fff3b0', night ? 0.95 : 0.8)).join('') + k.l('M14 8Q70 36 130 6', '#ffffff', 1.6) + [[40, 22], [78, 28], [108, 20]].map(([x, y]) => k.p(starD(x, y, 7), '#ffe27a', 1.4)).join('');
    case 'badkamer': {
      const id = k.id();
      k.defs.push(`<pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse"><rect x=".6" y=".6" width="22.8" height="22.8" rx="2" fill="#ffffff" opacity=".42" stroke="${lt(H.b, 0.1)}" stroke-width="1.2"/></pattern>`);
      return `<rect x="0" y="92" width="360" height="102" fill="url(#${id})"/>` + k.r(-4, 88, 368, 8, lt(H.b, 0.3), 3) + [[40, 108], [160, 120], [260, 112], [330, 128]].map(([x, y]) => k.p(`M${x - 10} ${y}Q${x} ${y - 8} ${x + 8} ${y - 2}L${x + 14} ${y - 8}V${y + 8}L${x + 8} ${y + 2}Q${x} ${y + 8} ${x - 10} ${y}Z`, '#9fd8f0', 1.3)).join('') + [[100, 140, 6], [108, 154, 4], [290, 150, 5]].map(([x, y, r]) => k.c(x, y, r, '#ffffff', 1.2, 0.8)).join('');
    }
    case 'speelkamer': {
      const cols = ['#ff9bb6', '#ffe27a', '#9fd8f0', '#b9e8a8', '#c9b8f2'];
      let s = k.l('M-4 8Q90 40 180 14T364 10', INK, 1.6);
      for (let i = 0; i < 11; i++) { const x = 8 + i * 33, y = 10 + (i % 2 ? 10 : 6) + Math.sin(i * 0.9) * 8 + 12; s += k.p(`M${x - 11} ${f1(y - 10)}H${x + 11}L${x} ${y + 10}Z`, cols[i % 5], 1.4); }
      s += [0, 1, 2, 3].map((i) => `<path d="M${40 + i * 0} ${150}" fill="none"/>` ).join('');
      const rb = ['#ff9bb6', '#ffd36b', '#b9e8a8', '#9fd8f0'];
      s += rb.map((c, i) => k.l(`M${268 + i * 8} 190A${54 - i * 8} ${54 - i * 8} 0 0 1 ${344 - i * 8 - (0)} 190`, c, 8)).join('').replace(/M(\d+) 190A(\d+) \d+ 0 0 1 (\d+) 190/g, (m, a, r, b) => m);
      return s;
    }
    default: return '';
  }
}

function houseDeco(k, H, roomId, night) {
  switch (H.deco) {
    case 'garland': return k.l('M0 6Q60 30 120 8T240 8T360 8', INK, 1.4) + [20, 60, 100, 160, 210, 260, 310].map((x, i) => heart(k, x, 20 + (i % 2) * 8, 7, ['#ff8fb1', '#ffe27a', '#fff'][i % 3])).join('');
    case 'ivy': return k.l('M0 0Q10 60 20 120M360 0Q350 60 340 100', '#6fbf7a', 2.4) + [[10, 20], [16, 50], [20, 80], [24, 112], [350, 16], [346, 46], [342, 78]].map(([x, y], i) => leaf(k, x, y, i % 2 ? 30 : 150, 14, '#8fdc9c')).join('');
    case 'hangleaves': return [10, 50, 96, 140, 200, 250, 300, 340].map((x, i) => leaf(k, x, 0, 90 + (i % 2 ? 20 : -20), 24 + (i % 3) * 8, i % 2 ? '#6fcf8a' : '#8fdc9c')).join('') + k.l('M0 0Q20 30 40 0M300 0Q320 30 360 0', '#6fbf7a', 2);
    case 'buoy': return `<g transform="translate(46 96)">${k.c(0, 0, 22, '#ffffff')}${[0, 1, 2, 3].map((i) => `<path d="M0 0L${f1(Math.cos(i * Math.PI / 2 + 0.8) * 22)} ${f1(Math.sin(i * Math.PI / 2 + 0.8) * 22)}A22 22 0 0 ${i % 2 ? 0 : 1} ${f1(Math.cos(i * Math.PI / 2 + 0.8 + Math.PI / 4) * 22)} ${f1(Math.sin(i * Math.PI / 2 + 0.8 + Math.PI / 4) * 22)}Z" fill="#ff8fa8"/>`).join('')}${k.c(0, 0, 22, 'none', 2)}${k.c(0, 0, 10, '#f4fbff', 2)}</g>`;
    case 'icicles': return [8, 40, 70, 112, 150, 196, 236, 280, 318, 346].map((x, i) => k.p(`M${x - 7} 0H${x + 7}L${x} ${14 + (i % 3) * 8}Z`, '#d6ecfa', 1.4)).join('');
    case 'icing': return k.p('M0 0H360V10Q348 22 336 10Q324 24 312 10Q300 22 288 10Q276 24 264 10Q252 22 240 10Q228 24 216 10Q204 22 192 10Q180 24 168 10Q156 22 144 10Q132 24 120 10Q108 22 96 10Q84 24 72 10Q60 22 48 10Q36 24 24 10Q12 22 0 10Z', '#ffffff', 1.8) + [[30, 196, '#ff9bb6'], [326, 160, '#9fd8f0']].map(([x, y, c]) => k.fr(x - 2, y - 66, 4, 66, '#fff') + k.c(x, y - 66, 14, c) + k.l(`M${x - 8} ${y - 66}Q${x} ${y - 56} ${x + 8} ${y - 66}`, '#fff', 2)).join('');
    case 'lantern': return k.l('M46 0V30', INK, 1.6) + (k.glow(46, 52, 46, '#ffd28a'), k.r(38, 30, 16, 28, '#ffe9a6', 5, 1.8) + k.r(35, 26, 22, 6, '#6e4628', 2, 1.6) + k.r(35, 56, 22, 5, '#6e4628', 2, 1.6) + k.l('M46 36V54', '#e0b050', 1.4)) + k.l('M318 8Q338 24 330 54T318 108', '#e8d0a0', 5) + k.l('M318 8Q338 24 330 54T318 108', INK, 0);
    case 'spots': return [60, 130, 230, 300].map((x) => { k.glow(x, 12, 26, '#fff7c8'); return k.c(x, 8, 5, '#ffffff', 1.4); }).join('');
    case 'torches': return [34, 326].map((x) => { k.glow(x, 86, 40, '#ffb870'); return k.l(`M${x} 104V130`, INK, 5) + k.r(x - 6, 100, 12, 8, '#b98457', 2, 1.6) + k.l(`M${x} 104V130`, '#a9763f', 2.4) + k.p(`M${x - 7} 98Q${x - 10} 82 ${x} 70Q${x} 82 ${x + 4} 76Q${x + 10} 88 ${x + 7} 98Z`, '#ff9a5a', 1.6) + k.p(`M${x - 3} 98Q${x - 4} 90 ${x} 84Q${x + 4} 92 ${x + 3} 98Z`, '#ffe27a', 1); }).join('');
    case 'strip': k.glow(180, 8, 120, '#7fe8ff'); return k.r(0, 0, 360, 10, '#5560a8', 0, 0) + `<rect x="10" y="2" width="340" height="5" rx="2.5" fill="#8ff0ff"/>` + [60, 120, 240, 300].map((x) => k.fr(x, 14, 18, 3, '#2c3366', 0.7, 1.5)).join('') + k.c(40, 130, 10, '#5560a8', 1.6) + k.fc(40, 130, 4, '#7fe8ff');
    default: return '';
  }
}

function fenceDraw(k, type) {
  switch (type) {
    case 'picket': return k.r(0, 184, 360, 5, '#ffffff', 2, 1.6) + k.r(0, 196, 360, 5, '#ffffff', 2, 1.6) + Array.from({ length: 17 }, (_, i) => k.p(`M${i * 22 + 4} 206V176Q${i * 22 + 14} 164 ${i * 22 + 24} 176V206Z`, '#ffffff', 1.8)).join('');
    case 'hedge': return Array.from({ length: 12 }, (_, i) => k.c(i * 32 + 6, 190, 20, i % 2 ? '#7fd68c' : '#8fe09a', 1.8)).join('') + k.fr(0, 190, 360, 16, '#7fd68c');
    case 'stone': return k.r(-4, 168, 368, 40, '#cfc8ea', 2) + Array.from({ length: 12 }, (_, i) => k.r(i * 32, 156, 20, 14, '#cfc8ea', 2, 1.8)).join('') + k.l('M0 188H360M0 198H360', '#a9a0cf', 1.4) + k.l(Array.from({ length: 12 }, (_, i) => `M${i * 32 + 16} 170V188M${i * 32 + 30} 188V198`).join(''), '#a9a0cf', 1.4);
    case 'rail': return k.l('M0 176H360M0 192H360', INK, 6) + k.l('M0 176H360M0 192H360', '#9aa3d8', 3) + Array.from({ length: 10 }, (_, i) => k.r(i * 40 + 12, 168, 8, 38, '#bcc4f0', 2, 1.8)).join('');
    case 'candy': return Array.from({ length: 14 }, (_, i) => `<g>${k.r(i * 26 + 4, 168, 8, 38, '#ffffff', 4, 1.8)}${k.l(`M${i * 26 + 4} 178L${i * 26 + 12} 172M${i * 26 + 4} 190L${i * 26 + 12} 184M${i * 26 + 4} 202L${i * 26 + 12} 196`, i % 2 ? '#ff6f9f' : '#ff9bb6', 2.6)}${k.c(i * 26 + 8, 166, 5, ['#ff9bb6', '#ffe27a', '#9fd8f0'][i % 3], 1.6)}</g>`).join('');
    case 'ice': return Array.from({ length: 12 }, (_, i) => k.p(`M${i * 32 + 2} 206V${186 - (i % 3) * 6}L${i * 32 + 16} ${172 - (i % 2) * 6}L${i * 32 + 30} ${186 - (i % 3) * 6}V206Z`, '#dff0fa', 1.8)).join('');
    case 'bamboo': return Array.from({ length: 18 }, (_, i) => k.r(i * 20 + 2, 170 + (i % 3) * 5, 8, 40, '#e0cc88', 4, 1.8)).join('') + k.l('M0 184H360', '#b9a060', 3);
    case 'rope': return Array.from({ length: 7 }, (_, i) => k.r(i * 60 + 6, 166, 9, 40, '#b98457', 3, 1.8)).join('') + k.l('M10 174Q40 190 70 174T130 174T190 174T250 174T310 174T360 176', INK, 5) + k.l('M10 174Q40 190 70 174T130 174T190 174T250 174T310 174T360 176', '#ead8a8', 2.4);
    default: return '';
  }
}

function garden(k, H, night) {
  let s = scene(k, H, night, 180, 0, 206);
  s += fenceDraw(k, H.fence);
  s += k.fr(0, 204, 360, 96, k.grad(H.ground[0], H.ground[1]));
  s += `<path d="M0 204H360" stroke="${dk(H.ground[1], 0.25)}" stroke-width="2"/>`;
  for (let i = 0; i < 18; i++) { const x = 10 + ((i * 53) % 340), y = 218 + ((i * 37) % 76); s += H.view === 'space' ? k.fe(x, y, 7, 2, dk(H.ground[1], 0.12), 0.8) : k.l(`M${x} ${y}l-3 -6M${x} ${y}l1 -7M${x} ${y}l4 -5`, dk(H.ground[1], 0.28), 1.6); }
  s += floorDeco(k, H.fdeco === 'carpet' ? 'none' : H.fdeco, H);
  if (H.fence === 'stone') s += `<path d="M150 204H210L250 300H110Z" fill="#cfc8ea" opacity=".7"/>`;
  return s;
}

// ---------------------------------------------------------------- roomSVG
export function roomSVG(houseId, roomId, opts = {}) {
  const H = HS[houseId] || HS.huisje;
  const night = !!opts.night;
  const k = kit(night);
  const [tc, tt] = ROOMTINT[roomId] || ['#ffffff', 0];
  let s = '';
  let win = null;
  if (roomId === 'tuin') s += garden(k, H, night);
  else {
    const wall = mix(H.wall, tc, tt), acc = mix(H.b, tc, tt * 0.7);
    s += k.fr(0, 0, 360, 206, k.grad(lt(wall, 0.25), wall));
    s += k.fr(0, 0, 360, 206, wallPat(k, H.pat, wall, acc));
    s += floorDraw(k, H.fl) + floorDeco(k, H.fdeco, H);
    s += k.fr(0, 192, 360, 13, H.plint) + `<path d="M0 192H360M0 205H360" stroke="${INK}" stroke-width="1.8" opacity=".55"/>`;
    s += k.fr(0, 0, 360, 7, dk(wall, 0.12), 0.5);
    const wx = { woonkamer: 190, keuken: 118, slaapkamer: 235, badkamer: 250, speelkamer: 180 }[roomId] || 180;
    const sc = roomId === 'badkamer' ? 0.74 : roomId === 'keuken' ? 0.9 : 1;
    const ht = H.wd[1] * sc;
    win = windowDraw(k, H, wx, Math.max(18, Math.min(34, 176 - ht)), sc, night);
    s += houseDeco(k, H, roomId, night) + roomDeco(k, roomId, H, night) + win.svg;
  }
  // meubels
  const items = [];
  const slots = SLOT_POS[roomId] || [];
  (opts.furniture || []).forEach((fid, i) => {
    if (!fid || !FD[fid] || !slots[i]) return;
    const m = FMETA[fid] || {}, sl = slots[i];
    let size = 84 * sl.s, X = sl.x * 3.6, Y = sl.y * 3;
    if (m.slotHint === 'wall') { size = 84 * Math.max(sl.s, 0.95); Y = 160 + (i % 2) * 6; }
    if (m.slotHint === 'rug') { size = 84 * sl.s * 1.35; }
    items.push({ fid, size, X, Y, order: m.slotHint === 'rug' ? -1 : m.slotHint === 'wall' ? 0 : sl.y });
  });
  items.sort((a, b) => a.order - b.order);
  let glows = '';
  for (const it of items) {
    k.gl = '';
    const body = FD[it.fid](k), sc = it.size / 100, tf = `translate(${f1(it.X - it.size / 2)} ${f1(it.Y - it.size)}) scale(${f1(sc * 1000) / 1000})`;
    s += `<g transform="${tf}">${body}</g>`;
    if (k.gl) glows += `<g transform="${tf}">${k.gl}</g>`;
  }
  k.gl = '';
  if (night) {
    s += `<rect width="360" height="300" fill="#1b2354" opacity=".36"/>`;
    if (win) {
      const bi = k.id();
      k.defs.push(`<linearGradient id="${bi}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfd8ff" stop-opacity=".32"/><stop offset="1" stop-color="#cfd8ff" stop-opacity="0"/></linearGradient>`);
      s += `<path d="M${f1(win.cx - win.w / 2)} ${f1(win.bottom)}L${f1(win.cx + win.w / 2)} ${f1(win.bottom)}L${f1(win.cx + win.w / 2 + 80)} 296L${f1(win.cx - win.w / 2 - 40)} 296Z" fill="url(#${bi})"/>`;
    }
  }
  s += glows;
  if (night) { const gi = k.id(); k.defs.push(`<radialGradient id="${gi}"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".2"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient>`); s += `<ellipse cx="180" cy="190" rx="220" ry="130" fill="url(#${gi})"/>`; }
  const wh = (opts.width ? ` width="${opts.width}"` : '') + (opts.height ? ` height="${opts.height}"` : '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 300"${wh} stroke-linejoin="round" stroke-linecap="round" role="img" aria-label="${roomId}"><defs>${k.defs.join('')}</defs>${s}</svg>`;
}

// ---------------------------------------------------------------- buitenkant
const EXT = {};
const extFence = (k, x1, x2, y, c = '#fff') => { let s = k.r(x1, y - 14, x2 - x1, 3.5, c, 1.5, 1.4) + k.r(x1, y - 5, x2 - x1, 3.5, c, 1.5, 1.4); for (let x = x1; x < x2 - 6; x += 10) s += k.p(`M${x} ${y + 4}V${y - 18}Q${x + 4} ${y - 23} ${x + 8} ${y - 18}V${y + 4}Z`, c, 1.4); return s; };
const extTree = (k, x, y, sc, c) => k.r(x - 3 * sc, y - 14 * sc, 6 * sc, 16 * sc, '#b98457', 2, 1.6) + k.c(x, y - 24 * sc, 17 * sc, c) + k.c(x - 11 * sc, y - 15 * sc, 11 * sc, c) + k.c(x + 11 * sc, y - 15 * sc, 11 * sc, c) + k.hl(x - 6 * sc, y - 30 * sc, 5 * sc, 3 * sc);
const extFir = (k, x, y, sc, c, snow) => k.r(x - 3 * sc, y - 4 * sc, 6 * sc, 8 * sc, '#b98457', 1, 1.4) + k.p(`M${x} ${y - 44 * sc}L${x + 16 * sc} ${y - 6 * sc}H${x - 16 * sc}Z`, c, 1.8) + k.p(`M${x} ${y - 56 * sc}L${x + 12 * sc} ${y - 24 * sc}H${x - 12 * sc}Z`, c, 1.8) + (snow ? k.f(`M${x} ${y - 56 * sc}L${x + 5 * sc} ${y - 44 * sc}Q${x} ${y - 40 * sc} ${x - 5 * sc} ${y - 44 * sc}Z`, '#fff') : '');
const extWin = (k, x, y, w, h, night, r = 4) => { const c = night ? '#ffe9a0' : '#cdeeff'; if (night) k.glow(x + w / 2, y + h / 2, w * 1.3, '#ffd77a'); return k.r(x, y, w, h, c, r, 2) + k.l(`M${x + w / 2} ${y}V${y + h}M${x} ${y + h / 2}H${x + w}`, INK, 1.6) + (night ? '' : k.hl(x + w * 0.28, y + h * 0.28, w * 0.12, h * 0.08)); };

EXT['huisje'] = (k, n) => k.e(150, 252, 190, 54, '#b8ebb0') + extTree(k, 34, 232, 1.2, '#9fe0a8') + extTree(k, 268, 236, 1, '#a3e6a8') + k.r(188, 62, 20, 40, '#e8a0a0', 3) + (n ? '' : k.fc(200, 50, 7, '#fff', 0.8) + k.fc(210, 38, 9, '#fff', 0.7)) + k.r(70, 130, 160, 100, '#ffe3c2', 8) + k.p('M56 138L150 62L244 138Z', '#f48fa6', 3) + k.l('M70 128Q150 78 230 128', '#ffd0dc', 3) + k.c(150, 108, 12, n ? '#ffe9a0' : '#cdeeff') + (n ? (k.glow(150, 108, 30, '#ffd77a'), '') : '') + k.l('M150 96V120M138 108H162', INK, 1.6) + extWin(k, 88, 158, 38, 36, n) + extWin(k, 174, 158, 38, 36, n) + k.r(134, 176, 32, 54, '#e58aa3', 14) + k.fc(158, 206, 2.4, '#ffd36b') + k.r(86, 192, 42, 8, '#c99a68', 3) + k.r(172, 192, 42, 8, '#c99a68', 3) + [92, 104, 116].map((x, i) => flower(k, x, 188, 4, ['#ff9bb6', '#ffe27a', '#fff'][i])).join('') + [178, 190, 202].map((x, i) => flower(k, x, 188, 4, ['#fff', '#ff9bb6', '#ffe27a'][i])).join('') + extFence(k, 10, 60, 238) + extFence(k, 240, 290, 238) + k.p('M130 250Q150 240 170 250V260H130Z', '#f2dcb0', 0);
EXT['boomhut'] = (k, n) => k.e(150, 262, 170, 40, '#9fd88a') + k.p('M120 258Q130 200 126 140H174Q170 200 180 258Z', '#b98457') + k.l('M138 200Q150 190 142 170M160 220Q150 200 164 180', '#8d6a48', 1.8) + k.c(80, 90, 40, '#7fcf8a') + k.c(220, 90, 40, '#7fcf8a') + k.c(150, 56, 54, '#8fdc9c') + k.c(100, 40, 30, '#9fe0a8') + k.c(200, 40, 30, '#9fe0a8') + k.r(66, 128, 168, 12, '#c99a68', 4) + k.r(82, 82, 136, 48, '#e0b27f', 6) + k.l('M100 82V130M126 82V130M174 82V130M200 82V130', '#b98a56', 1.6) + k.p('M70 86L150 36L230 86Z', '#6fcf8a', 3) + k.l('M92 76L150 44L208 76', '#9fe0a8', 2.4) + extWin(k, 100, 96, 30, 26, n) + extWin(k, 170, 96, 30, 26, n) + k.r(136, 98, 28, 32, '#8d6a48', 12) + k.l('M82 140L56 250M104 140L84 250', INK, 5) + k.l('M82 140L56 250M104 140L84 250', '#c99a68', 2.4) + [160, 180, 200, 220].map((y, i) => k.l(`M${f1(82 - (y - 140) * 0.236)} ${y}H${f1(104 - (y - 140) * 0.18)}`, INK, 3)).join('') + k.l('M224 140Q248 190 236 232', '#e8d0a0', 3) + k.r(222, 232, 30, 6, '#e0a870', 3, 1.6) + k.l('M150 36V18', INK, 1.8) + k.p('M150 18L172 24L150 30Z', '#ff8fb1', 1.6) + [[40, 200], [262, 210], [270, 120]].map(([x, y]) => leaf(k, x, y, -60, 16, '#6fcf8a')).join('');
EXT['villa'] = (k, n) => k.e(150, 254, 190, 48, '#bff0b4') + k.r(110, 78, 130, 54, '#f3e6d4', 8) + k.r(100, 72, 150, 10, '#9ad3d0', 4) + k.r(50, 124, 200, 84, '#fdf6ee', 8) + k.r(44, 118, 212, 10, '#9ad3d0', 4) + extWin(k, 62, 140, 78, 52, n, 8) + k.l('M101 140V192', INK, 2) + extWin(k, 190, 140, 44, 52, n, 8) + extWin(k, 126, 92, 92, 28, n, 8) + k.r(150, 172, 24, 36, '#9ad3d0', 8) + k.fc(168, 192, 2, '#fff') + k.r(30, 214, 150, 34, '#ffffff', 14) + k.r(36, 219, 138, 24, '#7fdcf0', 10) + k.l('M60 226H90M110 234H150M80 238H100', '#e8fcff', 2.4) + k.l('M150 214V224Q150 230 156 230M162 214V224Q162 230 168 230', '#c9d4e8', 3) + k.r(196, 222, 60, 12, '#ffd9a0', 5) + k.r(196, 216, 16, 10, '#fff', 4, 1.6) + k.r(264, 128, 5, 84, '#b98457', 2) + k.p('M266 128Q250 118 238 130Q254 124 266 134ZM266 128Q284 118 296 130Q280 124 266 134ZM266 128Q262 108 252 106Q260 118 266 128ZM266 128Q272 108 282 106Q274 118 266 128Z', '#6fcf8a', 1.8) + k.r(24, 160, 5, 52, '#b98457', 2) + k.p('M26 160Q10 150 -2 162Q14 156 26 166ZM26 160Q44 150 56 162Q40 156 26 166Z', '#6fcf8a', 1.8);
EXT['kasteel'] = (k, n) => k.e(150, 258, 180, 40, '#a8e0a0') + k.r(24, 150, 252, 70, '#c6c0e2', 3) + Array.from({ length: 9 }, (_, i) => k.r(26 + i * 28, 140, 18, 14, '#c6c0e2', 2, 1.8)).join('') + [[16, 100, 54], [230, 100, 54]].map(([x, y, w]) => k.r(x, y, w, 124, '#d3cdf0', 3) + k.p(`M${x - 6} ${y}L${x + w / 2} ${y - 46}L${x + w + 6} ${y}Z`, '#f08fb0', 2.4) + k.l(`M${x + w / 2} ${y - 46}V${y - 62}`, INK, 1.8) + k.p(`M${x + w / 2} ${y - 62}L${x + w / 2 + 20} ${y - 56}L${x + w / 2} ${y - 50}Z`, '#ffe27a', 1.6) + extWin(k, x + w / 2 - 6, y + 16, 12, 22, n, 6)).join('') + k.r(104, 80, 92, 140, '#e0dcf6', 3) + Array.from({ length: 5 }, (_, i) => k.r(104 + i * 19, 70, 14, 14, '#e0dcf6', 2, 1.8)).join('') + k.p('M98 80L150 30L202 80Z', '#9fd8f0', 2.4) + k.l('M150 30V14', INK, 1.8) + k.p('M150 14L172 20L150 26Z', '#ff6f8f', 1.6) + extWin(k, 138, 90, 24, 36, n, 12) + k.p('M120 220V180Q120 160 150 160Q180 160 180 180V220Z', '#4a3a66', 2) + k.l('M130 168V220M140 164V220M150 162V220M160 164V220M170 168V220M122 180H178M122 196H178M122 210H178', '#8c84b4', 1.2) + k.p('M108 232L192 232L204 258H96Z', '#b98457', 2) + k.l('M120 232L116 258M134 232L132 258M150 232V258M166 232L168 258M180 232L184 258', '#8d6a48', 1.2) + k.e(150, 252, 130, 12, '#7fd0f0', 0, 0.45);
EXT['ruimtebasis'] = (k, n) => k.e(150, 270, 220, 60, '#d9d4ee') + k.fe(60, 240, 22, 6, '#bdb6dc') + k.fe(240, 250, 18, 5, '#bdb6dc') + k.c(240, 60, 22, '#f5a6c9') + `<ellipse cx="240" cy="60" rx="38" ry="9" fill="none" stroke="#ffe08a" stroke-width="3.6" transform="rotate(-20 240 60)"/>` + k.fc(40, 50, 9, '#9fe3d6') + k.fc(70, 90, 5, '#ffb36b') + k.p('M60 220A90 90 0 0 1 240 220Z', '#bfe9ff', 2.4, 0.7) + k.r(86, 160, 40, 60, '#8f9ad8', 4) + k.r(130, 150, 36, 70, '#a9b2ea', 4) + k.r(170, 170, 40, 50, '#8f9ad8', 4) + extWin(k, 94, 172, 24, 18, n) + extWin(k, 138, 164, 20, 24, n) + extWin(k, 180, 182, 20, 16, n) + k.l('M148 150V122', INK, 3) + k.c(148, 118, 6, '#ff8fb1') + k.l('M40 222H260', INK, 5) + k.r(54, 218, 192, 10, '#8f9ad8', 4) + k.l('M256 224V170', INK, 0) + k.p('M246 224Q250 190 262 186Q274 190 278 224Z', '#ffffff', 2.2) + k.p('M246 224L238 238L252 230ZM278 224L286 238L272 230Z', '#ff8fb1', 1.8) + k.c(262, 204, 6, '#9fd8f0', 1.8) + k.p('M254 186Q262 170 270 186Z', '#ff8fb1', 1.8) + k.r(14, 226, 28, 14, '#5560a8', 3, 1.8) + k.l('M14 233H42M28 226V240', '#8f9ad8', 1.4);
EXT['iglo'] = (k, n) => k.e(150, 254, 190, 54, '#f7fcff') + extFir(k, 30, 240, 1.1, '#6fb6a0', true) + extFir(k, 270, 238, 1, '#7cc4ae', true) + k.p('M50 226A100 100 0 0 1 250 226Z', '#eef8ff', 2.6) + k.l('M60 196H240M76 166H224M104 140H196M150 126V196M104 196V226M150 196V226M196 196V226M80 166V196M122 140V166M178 140V166M220 166V196M62 226V196', '#bcdcf0', 1.8).replace('M150 126V196', 'M150 126V166M122 166V196M178 166V196') + k.p('M110 226V196Q110 170 150 170Q190 170 190 196V226Z', '#d6ecfa', 2.4) + k.p('M124 226V202Q124 186 150 186Q176 186 176 202V226Z', '#5b6fa0', 2) + (n ? (k.glow(150, 214, 40, '#ffd77a'), k.p('M132 226V204Q132 194 150 194Q168 194 168 204V226Z', '#ffe9a0', 0)) : '') + k.c(150, 150, 0.1, '#fff', 0) + k.hl(94, 168, 8, 4) + k.c(240, 232, 14, '#ffffff') + k.c(240, 214, 10, '#ffffff') + k.fc(237, 212, 1.4, INK) + k.fc(243, 212, 1.4, INK) + k.p('M240 216L248 218L240 220Z', '#ff9a5a', 1) + k.r(231, 202, 18, 5, '#ff8fb1', 2, 1.4) + k.l('M226 228L214 220M254 228L266 220', '#8d6a48', 2);
EXT['strandhuisje'] = (k, n) => `<rect x="0" y="150" width="300" height="60" fill="${k.grad('#8fdcf5', '#6cc8ec')}"/>` + k.f('M0 160Q20 152 40 160T80 160T120 160T160 160T200 160T240 160T280 160T320 160V168H0Z', '#bff0fc', 0.9) + k.f('M0 190Q20 182 40 190T80 190T120 190T160 190T200 190T240 190T280 190T320 190V200H0Z', '#bff0fc', 0.7) + k.p('M0 230Q70 196 150 214T300 206V260H0Z', '#fbe9bd', 0) + k.e(150, 262, 200, 56, '#fbe9bd') + k.r(60, 150, 6, 74, '#b98457', 2) + k.r(234, 150, 6, 74, '#b98457', 2) + k.r(80, 84, 140, 74, '#f4fbff', 6) + Array.from({ length: 5 }, (_, i) => k.fr(94 + i * 28, 86, 14, 70, '#a9d8f5', 0.7)).join('') + k.r(80, 84, 140, 74, 'none', 2.4) + k.p('M66 88L150 38L234 88Z', '#ff8fa8', 3) + Array.from({ length: 4 }, (_, i) => k.f(`M${150 - 12 - i * 20} ${68 - i * 0}L${150} 38L${150 + 12 + i * 20} ${68}Z`, '#fff', 0)).join('') + k.l('M110 62L150 38L190 62', '#ffd0dc', 3) + extWin(k, 96, 104, 36, 30, n) + k.r(158, 106, 34, 52, '#7fc4ee', 8) + k.fc(184, 134, 2.4, '#ffd36b') + k.r(64, 156, 172, 10, '#c99a68', 3) + k.l('M110 166L98 224M190 166L202 224', '#b98457', 4) + k.r(246, 150, 3, 90, '#b98457', 0) + k.r(256, 140, 6, 100, '#b98457', 2) + k.p('M258 140Q238 126 224 140Q244 134 258 146ZM258 140Q280 126 294 140Q274 134 258 146ZM258 140Q254 118 242 116Q252 128 258 140ZM258 140Q266 118 278 118Q268 128 258 140Z', '#6fcf8a', 1.8) + k.l('M36 240V206', INK, 3) + k.p('M10 206Q36 176 62 206Z', '#ffffff', 2.2) + k.p('M10 206Q18 190 36 186L30 206Z', '#ff8fa8', 0) + k.p('M36 186Q54 190 62 206H44Z', '#ff8fa8', 0) + k.p('M44 236Q52 224 60 236Q52 242 44 236Z', '#ffb3c8', 1.4);
EXT['snoephuis'] = (k, n) => k.e(150, 254, 190, 52, '#ffd9e8') + cloud(k, 56, 54, 1.1, 0.95) + cloud(k, 240, 40, 0.9, 0.9) + k.r(70, 128, 160, 100, '#d9a56b', 8) + k.p('M54 136L150 58L246 136Z', '#ff9bb6', 3) + k.p('M54 136Q64 150 74 136Q84 150 94 136Q104 150 114 136Q124 150 134 136Q144 150 154 136Q164 150 174 136Q184 150 194 136Q204 150 214 136Q224 150 234 136L246 136L150 58L54 136Z', '#ffffff', 2.2) + [[110, 110, '#ffe27a'], [150, 90, '#9fd8f0'], [190, 112, '#b9e8a8'], [130, 124, '#c9a0ff'], [172, 126, '#ffe27a']].map(([x, y, c]) => k.c(x, y, 5, c, 1.6)).join('') + k.r(204, 60, 20, 36, '#c9a0ff', 3) + k.r(200, 56, 28, 8, '#ffffff', 4) + k.l('M78 168H222M78 192H222', '#ffffff', 3).replace('d=', 'stroke-dasharray="8 6" d=') + extWin(k, 88, 156, 36, 34, n, 12) + extWin(k, 176, 156, 36, 34, n, 12) + k.r(134, 170, 32, 58, '#8f5e3e', 14) + k.l('M150 176V226M134 198H166', '#6e4630', 1.4) + k.c(158, 202, 4, '#ff6f9f', 1.6) + [[34, 236, '#ff9bb6'], [266, 232, '#9fd8f0']].map(([x, y, c]) => k.r(x - 2, y - 60, 4, 60, '#ffffff', 2, 1.6) + k.c(x, y - 66, 18, c) + k.p(`M${x} ${y - 66}m0 -4a5 5 0 1 1 -5 5a10 10 0 1 1 10 -10`, 'none', 0).replace('fill="none"', 'fill="none" stroke="#fff" stroke-width="3"')).join('') + [[96, 244, '#ffe27a'], [196, 248, '#9fe0b8'], [226, 244, '#ff9bb6'], [60, 246, '#c9a0ff']].map(([x, y, c]) => k.p(`M${x - 8} ${y}Q${x - 8} ${y - 14} ${x} ${y - 14}Q${x + 8} ${y - 14} ${x + 8} ${y}Z`, c, 1.8)).join('');
EXT['cottage'] = (k, n) => k.e(150, 254, 190, 52, '#c5f0b5') + extTree(k, 30, 238, 1.2, '#a3e6a8') + extTree(k, 276, 236, 1.1, '#9fe0a8') + k.r(76, 126, 148, 102, '#fff0e6', 8) + k.p('M60 132Q70 70 150 60Q230 70 240 132Q200 122 150 122Q100 122 60 132Z', '#c9b2e8', 3) + k.l('M76 112Q150 86 224 112M84 98Q150 74 216 98', '#e0d0f5', 2.4) + [[96, 104], [130, 82], [176, 80], [208, 102]].map(([x, y], i) => flower(k, x, y, 4, ['#ff9bb6', '#ffe27a', '#fff', '#ff9bb6'][i])).join('') + k.r(176, 70, 20, 30, '#e8a0a0', 3) + extWin(k, 90, 148, 40, 38, n) + extWin(k, 170, 148, 40, 38, n) + k.r(84, 184, 52, 12, '#c99a68', 4) + k.r(164, 184, 52, 12, '#c99a68', 4) + [90, 102, 114, 126].map((x, i) => flower(k, x, 180, 4.2, ['#ff9bb6', '#ffe27a', '#c9a0ff', '#ff9bb6'][i])).join('') + [170, 182, 194, 206].map((x, i) => flower(k, x, 180, 4.2, ['#c9a0ff', '#ff9bb6', '#ffe27a', '#fff'][i])).join('') + k.p('M138 228V186Q138 170 150 170Q162 170 162 186V228Z', '#e58aa3', 2) + k.fc(157, 204, 2, '#ffd36b') + `<path d="M126 228V190Q126 160 150 160Q174 160 174 190V228" fill="none" stroke="#ffffff" stroke-width="4"/>` + [[128, 200], [172, 196], [132, 176], [168, 174], [150, 160]].map(([x, y], i) => flower(k, x, y, 3.2, i % 2 ? '#ff9bb6' : '#ff6f8f')).join('') + extFence(k, 8, 70, 242) + extFence(k, 230, 292, 242);
EXT['piraten-schip'] = (k, n) => `<rect x="0" y="150" width="300" height="110" fill="${k.grad('#6cc8e0', '#3d9cc0')}"/>` + k.f('M0 156Q15 148 30 156T60 156T90 156T120 156T150 156T180 156T210 156T240 156T270 156T300 156V164H0Z', '#bff0fc', 0.7) + k.r(148, 40, 7, 130, '#8d6a48', 2) + k.r(84, 70, 6, 100, '#8d6a48', 2) + k.p('M152 46Q210 62 206 112H152Z', '#fffaf0', 2.2) + k.p('M150 56Q104 70 108 112H150Z', '#fffaf0', 2.2) + k.p('M88 78Q124 90 120 126H88Z', '#fffaf0', 2.2) + k.c(176, 84, 8, '#fff', 1.4) + k.fc(173, 83, 1.8, INK) + k.fc(179, 83, 1.8, INK) + k.l('M174 89H178', INK, 1.4) + k.p('M155 40L186 30L186 52L155 52Z', '#3a3a5e', 2) + k.c(170, 44, 4, '#fff', 1) + k.fc(168.5, 43.5, 1, INK) + k.fc(171.5, 43.5, 1, INK) + k.p('M20 150H280Q270 208 230 214H70Q30 208 20 150Z', '#a9784a', 2.6) + k.p('M30 164H270', 'none', 0) + k.l('M24 166H276', '#7d5330', 2) + [60, 100, 140, 180, 220].map((x) => k.c(x, 184, 7, n ? '#ffe9a0' : '#cdeeff', 2.2)).join('') + (n ? [60, 100, 140, 180, 220].map((x) => (k.glow(x, 184, 20, '#ffd77a'), '')).join('') : '') + k.r(228, 120, 52, 34, '#c4925c', 5) + extWin(k, 238, 128, 14, 14, n, 7) + k.p('M18 150Q8 130 20 120L34 150Z', '#7d5330', 2) + k.l('M20 124L2 100', INK, 2.4) + k.f('M0 190Q15 182 30 190T60 190T90 190T120 190T150 190T180 190T210 190T240 190T270 190T300 190V260H0Z', '#4fb0d0', 0.8) + k.f('M0 215Q15 207 30 215T60 215T90 215T120 215T150 215T180 215T210 215T240 215T270 215T300 215V260H0Z', '#3d9cc0', 0.9);

function extSky(k, H, night) {
  const sp = H === 'ruimtebasis';
  const colors = sp ? ['#1a1a4e', '#5b4aa3'] : night ? ['#1f2760', '#4c5399'] : H === 'iglo' ? ['#bfe3ff', '#f0f9ff'] : H === 'snoephuis' ? ['#ffd6ea', '#fff0f7'] : ['#9ddcff', '#eaf8ff'];
  let s = `<rect width="300" height="260" rx="26" fill="${k.grad(colors[0], colors[1])}"/>`;
  if (night || sp) {
    s += [[30, 30], [80, 18], [140, 40], [210, 22], [260, 44], [180, 66], [20, 80], [270, 90], [110, 70]].map(([x, y]) => k.f(starD(x, y, 3.2, 1.3), '#fff3b0')).join('');
    if (!sp) s += k.fc(246, 40, 16, '#fff6c9') + k.fc(254, 36, 14, colors[0]);
  } else s += k.fc(40, 40, 24, '#ffe27a', 0.35) + k.fc(40, 40, 17, '#ffe27a') + cloud(k, 150, 36, 1.3) + cloud(k, 246, 64, 1, 0.85) + cloud(k, 70, 90, 0.8, 0.8);
  return s;
}

export function houseExteriorSVG(houseId, opts = {}) {
  const id = EXT[houseId] ? houseId : 'huisje';
  const night = !!opts.night;
  const k = kit(night);
  let s = extSky(k, id, night);
  s += EXT[id](k, night);
  const glows0 = k.gl;
  k.gl = '';
  if (night) s += `<rect width="300" height="260" rx="26" fill="#1b2354" opacity=".34"/>`;
  s += glows0;
  const cid = k.id();
  k.defs.push(`<clipPath id="${cid}"><rect width="300" height="260" rx="26"/></clipPath>`);
  s = `<g clip-path="url(#${cid})">${s}</g>`;
  const wh = (opts.width ? ` width="${opts.width}"` : '') + (opts.height ? ` height="${opts.height}"` : '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 260"${wh} stroke-linejoin="round" stroke-linecap="round" role="img" aria-label="${id}"><defs>${k.defs.join('')}</defs>${s}</svg>`;
}
