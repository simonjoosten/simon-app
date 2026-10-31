// Extra kleurplaten voor de Kleur-app: 9 getekende plaatjes, 4 mandala's (gemaakt met een formule) en een pixelkunst-raster.
// Elke vorm is één SVG-element (zonder fill/stroke); de app kleurt ze in. Viewbox 400x400.

const C = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
const E = (x, y, a, b, rot = 0) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}"${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ''}/>`;
const R = (x, y, w, h, r = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${r ? ` rx="${r}"` : ''}/>`;
const P = (pts) => `<polygon points="${pts}"/>`;
const D = (d) => `<path d="${d}"/>`;
const L = (d) => `<path d="${d}"/>`;
const CL = (x, y, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0,0 C-30,0 -35,-35 -8,-38 C-5,-65 45,-70 55,-45 C85,-50 95,-5 65,0 Z"/>`;
const star = (cx, cy, r) => P(Array.from({ length: 10 }, (_, k) => { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`; }).join(' '));

// ---- mandala: ringen van sectoren, bloemblaadjes en bolletjes ----
function lcg(seed) { let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
export function mandala(seed, rings = 5, maxN = 16) {
  const r = lcg(seed * 977 + 13), shapes = [C(200, 200, 22)], pt = (rad, a) => [200 + rad * Math.cos(a), 200 + rad * Math.sin(a)];
  const w = (180 - 22) / rings, f = (v) => +v.toFixed(1);
  for (let k = 0; k < rings; k++) {
    const a0 = 22 + k * w, a1 = a0 + w, n = [8, 12, 16, 20, 24].filter((x) => x <= maxN + 8)[Math.floor(r() * 3) + (k > 2 ? 1 : 0)] || 12, kind = k === rings - 1 ? 'sector' : ['sector', 'petal', 'dots'][Math.floor(r() * 3)], off = r() * Math.PI;
    for (let i = 0; i < n; i++) {
      const t0 = off + (i / n) * Math.PI * 2, t1 = off + ((i + 1) / n) * Math.PI * 2, tm = (t0 + t1) / 2;
      if (kind === 'sector') { const p1 = pt(a1, t0), p2 = pt(a1, t1), p3 = pt(a0, t1), p4 = pt(a0, t0); shapes.push(D(`M${f(p1[0])},${f(p1[1])} A${f(a1)},${f(a1)} 0 0 1 ${f(p2[0])},${f(p2[1])} L${f(p3[0])},${f(p3[1])} A${f(a0)},${f(a0)} 0 0 0 ${f(p4[0])},${f(p4[1])} Z`)); }
      else if (kind === 'petal') { const c = pt((a0 + a1) / 2, tm), len = w * 0.52, wid = Math.max(5, Math.min(w * 0.42, ((a0 + a1) / 2) * Math.PI / n * 0.9)); shapes.push(E(f(c[0]), f(c[1]), f(len), f(wid), Math.round(tm * 180 / Math.PI))); }
      else { const c = pt((a0 + a1) / 2, tm); shapes.push(C(f(c[0]), f(c[1]), f(Math.max(4, Math.min(w * 0.38, ((a0 + a1) / 2) * Math.PI / n * 0.8))))); }
    }
  }
  return shapes;
}
const pixelGrid = (n = 10) => Array.from({ length: n * n }, (_, i) => R((i % n) * (400 / n), Math.floor(i / n) * (400 / n), 400 / n, 400 / n));

export const PLATEN_EXTRA = [
  { id: 'robot', naam: 'Robot', emoji: '🤖',
    shapes: [R(196, 46, 8, 18), C(200, 40, 11), R(105, 95, 25, 40, 6), R(270, 95, 25, 40, 6), R(130, 62, 140, 102, 16), C(170, 105, 17), C(230, 105, 17), R(165, 135, 70, 14, 5), R(185, 164, 30, 16), R(60, 190, 40, 100, 16), R(300, 190, 40, 100, 16), R(110, 178, 180, 140, 18), R(150, 202, 100, 62, 10), C(175, 288, 10), C(200, 288, 10), C(225, 288, 10), C(80, 305, 22), C(320, 305, 22), R(135, 318, 45, 52, 10), R(220, 318, 45, 52, 10), R(120, 366, 70, 24, 10), R(210, 366, 70, 24, 10)],
    decor: [L('M170,105 h0.1 M230,105 h0.1 M182,142 h36')] },
  { id: 'cupcake', naam: 'Cupcake', emoji: '🧁',
    shapes: [D('M110,232 L290,232 L262,365 L138,365 Z'), E(200, 228, 102, 30), E(200, 192, 82, 30), E(200, 156, 60, 28), C(200, 112, 19), E(158, 192, 9, 4, 30), E(240, 205, 9, 4, -25), E(205, 160, 9, 4, 50), E(178, 225, 9, 4, -20), E(250, 232, 9, 4, 20)],
    decor: [L('M150,240 L162,358 M190,240 L192,360 M230,240 L222,360 M268,240 L252,358 M200,95 Q212,70 232,64')] },
  { id: 'ufo', naam: 'Ruimteschip', emoji: '🛸',
    shapes: [star(55, 70, 15), star(345, 55, 12), star(335, 300, 10), star(70, 330, 9), P('160,252 240,252 295,385 105,385'), D('M130,192 Q200,40 270,192 Z'), E(200, 212, 152, 40), E(200, 172, 25, 29), C(112, 218, 11), C(158, 238, 11), C(200, 246, 11), C(242, 238, 11), C(288, 218, 11)],
    decor: [L('M190,166 h0.1 M210,166 h0.1 M192,182 q8,6 16,0')] },
  { id: 'pinguin', naam: 'Pinguïn', emoji: '🐧',
    shapes: [E(100, 245, 26, 72, 15), E(300, 245, 26, 72, -15), E(200, 228, 98, 135), E(200, 252, 66, 102), C(170, 150, 24), C(230, 150, 24), C(175, 152, 9), C(225, 152, 9), P('182,174 218,174 200,208'), R(116, 198, 168, 28, 12), E(160, 368, 38, 15), E(240, 368, 38, 15)],
    decor: [] },
  { id: 'paddenstoel', naam: 'Paddenstoel', emoji: '🍄',
    shapes: [E(200, 372, 175, 17), D('M160,222 L240,222 L252,350 Q200,384 148,350 Z'), D('M52,225 C52,92 348,92 348,225 Z'), C(130, 172, 24), C(212, 140, 28), C(282, 178, 21), C(205, 198, 12), E(70, 345, 20, 28, 15), E(340, 350, 18, 24, -15)],
    decor: [L('M185,300 q15,10 30,0')] },
  { id: 'olifant', naam: 'Olifant', emoji: '🐘',
    shapes: [R(270, 300, 38, 74, 14), R(215, 305, 38, 70, 14), R(150, 305, 38, 70, 14), R(98, 298, 38, 76, 14), D('M335,230 Q380,260 360,320 L348,316 Q362,265 328,248 Z'), E(220, 240, 125, 88), E(136, 182, 55, 62), D('M80,205 Q28,260 52,335 Q68,356 84,336 Q70,282 108,244 Z'), E(165, 170, 52, 72, 12), C(100, 168, 8), D('M96,235 L66,262 L84,264 Z')],
    decor: [L('M70,296 q10,6 20,0 M58,318 q12,6 24,0')] },
  { id: 'vlieger', naam: 'Vlieger', emoji: '🪁',
    shapes: [CL(20, 120, 0.8), CL(285, 345, 0.8), P('200,40 300,170 200,170'), P('200,40 100,170 200,170'), P('100,170 200,330 200,170'), P('300,170 200,330 200,170'), P('196,350 186,372 206,372'), P('204,392 214,370 194,372'), P('168,336 150,352 172,358')],
    decor: [L('M200,330 Q150,355 210,372 Q250,385 190,395')] },
  { id: 'vuurtoren', naam: 'Vuurtoren', emoji: '🗼',
    shapes: [P('232,115 385,55 385,175'), P('155,102 245,102 200,58'), R(166, 102, 68, 40, 4), D('M170,142 L230,142 L233,205 L167,205 Z'), D('M167,205 L233,205 L237,268 L163,268 Z'), D('M163,268 L237,268 L241,331 L159,331 Z'), D('M159,331 L241,331 L246,372 L154,372 Z'), D('M0,372 Q40,350 80,372 T160,372 T240,372 T320,372 T400,372 L400,400 L0,400 Z'), E(70, 378, 55, 20), E(342, 380, 48, 18), D('M60,70 q15,-18 30,0 q15,-18 30,0')],
    decor: [L('M200,150 v-25')] },
  { id: 'planeet', naam: 'Planeet', emoji: '🪐',
    shapes: [star(60, 70, 16), star(340, 60, 13), star(340, 330, 15), star(55, 330, 10), E(200, 200, 175, 40, -20), C(200, 200, 88), C(165, 175, 14), C(235, 225, 20), C(215, 160, 9)],
    decor: [L('M122,215 q40,26 120,-4 M130,160 q70,-18 140,6')] },
  { id: 'mandala1', naam: 'Mandala 1', emoji: '🔯', shapes: mandala(1, 5), decor: [] },
  { id: 'mandala2', naam: 'Mandala 2', emoji: '🔯', shapes: mandala(7, 6, 12), decor: [] },
  { id: 'mandala3', naam: 'Mandala 3', emoji: '🔯', shapes: mandala(23, 4, 20), decor: [] },
  { id: 'mandala4', naam: 'Mandala 4', emoji: '🔯', shapes: mandala(99, 7, 12), decor: [] },
  { id: 'pixels', naam: 'Pixelkunst', emoji: '🟦', shapes: pixelGrid(10), decor: [] },
];
