// Fotostudio, ronde 4: 12 extra filters en 6 extra lijsten (frames). Pure pixel-functies en canvas-tekenfuncties, geen DOM.
// foto-filters.js en foto-edit.js geven hun hulpfuncties door: makeR4Filters(h) -> [[id, naam, groep, fn(img)], ...], makeR4Frames(h) -> [frame, ...]
export const R4_FILTER_COUNT = 12;
export const R4_FRAME_COUNT = 6;

export function makeR4Filters(h) {
  const { G, M, clamp } = h;
  const cl = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
  /** elke tweede regel donkerder en een lichte rood/blauw-verschuiving: oude beeldbuis */
  function fScan(img) {
    const w = img.width, hh = img.height, d = img.data, src = d.slice(), sh = Math.max(1, Math.round(w / 300));
    for (let y = 0; y < hh; y++) {
      const dark = y % 3 === 0 ? 0.62 : y % 3 === 1 ? 1.0 : 0.85;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4, xr = Math.min(w - 1, x + sh), xb = Math.max(0, x - sh);
        d[i] = cl(src[(y * w + xr) * 4] * dark * 1.04); d[i + 1] = cl(src[i + 1] * dark); d[i + 2] = cl(src[(y * w + xb) * 4 + 2] * dark * 1.06);
      }
    }
  }
  /** mozaïek van gekleurde blokken met een donkere voeg */
  function fMosaic(img) {
    const w = img.width, hh = img.height, d = img.data, b = Math.max(6, Math.round(Math.max(w, hh) / 36));
    for (let by = 0; by < hh; by += b) for (let bx = 0; bx < w; bx += b) {
      let r = 0, g = 0, bl = 0, n = 0; const ey = Math.min(hh, by + b), ex = Math.min(w, bx + b);
      for (let y = by; y < ey; y++) for (let x = bx; x < ex; x++) { const i = (y * w + x) * 4; r += d[i]; g += d[i + 1]; bl += d[i + 2]; n++; }
      r /= n; g /= n; bl /= n;
      for (let y = by; y < ey; y++) for (let x = bx; x < ex; x++) { const i = (y * w + x) * 4, edge = (x === bx || y === by) ? 0.55 : 1; d[i] = r * edge; d[i + 1] = g * edge; d[i + 2] = bl * edge; }
    }
  }
  /** randen oplichten in neonkleuren op een donkere foto */
  function fNeonEdge(img) {
    const w = img.width, hh = img.height, d = img.data, L = new Float32Array(w * hh);
    for (let k = 0, i = 0; k < w * hh; k++, i += 4) L[k] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, a = L[y * w + Math.min(w - 1, x + 1)] - L[y * w + Math.max(0, x - 1)], b = L[Math.min(hh - 1, y + 1) * w + x] - L[Math.max(0, y - 1) * w + x];
      const e = clamp(Math.sqrt(a * a + b * b) * 2.2, 0, 255) / 255, t = (x / w + y / hh) / 2;
      d[i] = cl(18 + e * (255 * (1 - t) + 60 * t)); d[i + 1] = cl(8 + e * (60 + 120 * Math.sin(t * Math.PI))); d[i + 2] = cl(34 + e * (120 + 135 * t));
    }
  }
  /** zachte gloed: lichte delen verspreiden zich */
  function fBloom(img) {
    const w = img.width, hh = img.height, d = img.data, r = Math.max(2, Math.round(Math.max(w, hh) / 90)), bright = new Float32Array(w * hh * 3);
    for (let k = 0, i = 0; k < w * hh; k++, i += 4) { const L = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2], m = L > 150 ? (L - 150) / 105 : 0; bright[k * 3] = d[i] * m; bright[k * 3 + 1] = d[i + 1] * m; bright[k * 3 + 2] = d[i + 2] * m; }
    const tmp = new Float32Array(bright.length), len = 2 * r + 1;
    for (let y = 0; y < hh; y++) for (let c = 0; c < 3; c++) { // horizontaal, lopende som
      let sum = 0; for (let k = -r; k <= r; k++) sum += bright[(y * w + clamp(k, 0, w - 1)) * 3 + c];
      for (let x = 0; x < w; x++) { tmp[(y * w + x) * 3 + c] = sum / len; sum += bright[(y * w + Math.min(w - 1, x + r + 1)) * 3 + c] - bright[(y * w + Math.max(0, x - r)) * 3 + c]; }
    }
    for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) { // verticaal
      let sum = 0; for (let k = -r; k <= r; k++) sum += tmp[(clamp(k, 0, hh - 1) * w + x) * 3 + c];
      for (let y = 0; y < hh; y++) { const i = (y * w + x) * 4 + c; d[i] = cl(d[i] + (sum / len) * 1.1); sum += tmp[(Math.min(hh - 1, y + r + 1) * w + x) * 3 + c] - tmp[(Math.max(0, y - r) * w + x) * 3 + c]; }
    }
  }
  /** verticale kleurbanden over de foto (regenboogstrepen) met zachte menging */
  function fRainbowBands(img) {
    const w = img.width, hh = img.height, d = img.data, cols = [[255, 70, 70], [255, 160, 60], [255, 230, 80], [90, 210, 120], [80, 150, 255], [170, 110, 255]];
    for (let y = 0; y < hh; y++) { const c = cols[Math.min(5, Math.floor(y / hh * 6))]; for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; d[i] = d[i] * 0.72 + c[0] * 0.28; d[i + 1] = d[i + 1] * 0.72 + c[1] * 0.28; d[i + 2] = d[i + 2] * 0.72 + c[2] * 0.28; } }
  }
  return [
    ['candy', 'Snoep', 'Kleur', M([[0, '#3a0a4a'], [0.4, '#ff4fa3'], [0.75, '#7ee8ff'], [1, '#fffbe8']], 0.25)],
    ['lava', 'Lava', 'Kleur', M([[0, '#120000'], [0.35, '#8a0f00'], [0.7, '#ff6a00'], [1, '#fff3b0']], 0.1)],
    ['jungle', 'Jungle', 'Kleur', G({ gain: [0.92, 1.12, 0.88], sat: 1.45, con: 1.1, hi: [0, 0.03, -0.02] })],
    ['galaxy', 'Sterrenstelsel', 'Kleur', M([[0, '#05001a'], [0.4, '#4b1ca8'], [0.75, '#c06bff'], [1, '#ffe9ff']], 0.2)],
    ['espresso', 'Koffie', 'Kleur', M([[0, '#140a05'], [0.45, '#6b3d1f'], [0.8, '#c99a6b'], [1, '#fff3e0']], 0.2)],
    ['poolijs', 'Poolijs', 'Kleur', G({ gain: [0.82, 1.0, 1.18], sat: 0.55, con: 1.18, hi: [0.05, 0.08, 0.1] })],
    ['bubblegum', 'Kauwgom', 'Kleur', G({ gain: [1.12, 0.92, 1.1], sat: 1.25, br: 0.06, fade: 0.04 })],
    ['oudetv', 'Oude tv', 'Retro', fScan],
    ['mosaic', 'Mozaïek', 'Creatief', fMosaic],
    ['neonedge', 'Neonlijnen', 'Creatief', fNeonEdge],
    ['bloom', 'Gloeiend', 'Creatief', fBloom],
    ['rainbands', 'Regenboogbanden', 'Fun', fRainbowBands],
  ];
}

export function makeR4Frames(h) {
  const { bgFill, putImg, layPad, laySq, poly, rrect, TAU, lum } = h;
  const dark = (col) => lum(col) < 140;
  return [
    { id: 'neon', name: 'Neonrand', icon: '💡', def: '#0b0b14', lay: layPad(1.5), draw: (c, L, p, col, src) => { bgFill(c, L, col); putImg(c, L, src); const q = L.ix; c.save(); c.shadowColor = '#22d3ee'; c.shadowBlur = q * 0.8; c.strokeStyle = '#67e8f9'; c.lineWidth = Math.max(2, q * 0.12); c.strokeRect(q * 0.45, q * 0.45, L.W - q * 0.9, L.H - q * 0.9); c.shadowColor = '#f472b6'; c.strokeStyle = '#f9a8d4'; c.strokeRect(q * 0.8, q * 0.8, L.W - q * 1.6, L.H - q * 1.6); c.restore(); } },
    { id: 'ticket', name: 'Kaartje', icon: '🎫', def: '#fde68a', lay: layPad(1.4), draw: (c, L, p, col, src) => { bgFill(c, L, col); putImg(c, L, src); const q = L.ix, r = q * 0.38; c.fillStyle = col === 'transparent' ? '#fff' : col; [[0, L.H * 0.3], [0, L.H * 0.7], [L.W, L.H * 0.3], [L.W, L.H * 0.7]].forEach(([x, y]) => { c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }); c.globalCompositeOperation = 'source-over'; c.strokeStyle = dark(col) ? '#fff' : '#92400e'; c.setLineDash([q * 0.3, q * 0.2]); c.lineWidth = 2; c.strokeRect(q * 0.4, q * 0.4, L.W - q * 0.8, L.H - q * 0.8); c.setLineDash([]); } },
    { id: 'scrapbook', name: 'Plakboek', icon: '📎', def: '#f3e9d2', lay: layPad(2.2), draw: (c, L, p, col, src) => { bgFill(c, L, col); c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = L.ix * 0.4; c.shadowOffsetY = L.ix * 0.12; c.fillStyle = '#fff'; c.fillRect(L.ix - L.ix * 0.12, L.iy - L.ix * 0.12, L.iw + L.ix * 0.24, L.ih + L.ix * 0.24); c.restore(); putImg(c, L, src); const t = L.ix * 0.9; [[L.ix, L.iy], [L.ix + L.iw, L.iy + L.ih]].forEach(([x, y], k) => { c.save(); c.translate(x, y); c.rotate(k ? -0.6 : -0.7); c.fillStyle = k ? 'rgba(251,191,36,.75)' : 'rgba(244,114,182,.75)'; c.fillRect(-t, -t * 0.3, t * 2, t * 0.6); c.restore(); }); } },
    { id: 'star', name: 'Ster', icon: '⭐', def: '#fff7cc', lay: laySq, draw: (c, L, p, col, src) => { bgFill(c, L, col); c.save(); const R = L.W * 0.5, pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? R * 0.52 : R * 0.98, a = -Math.PI / 2 + i * Math.PI / 5; pts.push([L.W / 2 + Math.cos(a) * r, L.H / 2 + Math.sin(a) * r + R * 0.04]); } poly(c, pts); c.clip(); putImg(c, L, src); c.restore(); } },
    { id: 'diamond', name: 'Ruit', icon: '🔶', def: '#e0f2fe', lay: laySq, draw: (c, L, p, col, src) => { bgFill(c, L, col); c.save(); poly(c, [[L.W / 2, L.H * 0.01], [L.W * 0.99, L.H / 2], [L.W / 2, L.H * 0.99], [L.W * 0.01, L.H / 2]]); c.clip(); putImg(c, L, src); c.restore(); } },
    { id: 'rounded2', name: 'Ronde kaart', icon: '🟪', def: '#ede9fe', lay: layPad(1.2), draw: (c, L, p, col, src) => { bgFill(c, L, col); const q = L.ix; c.save(); c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = q * 0.5; c.fillStyle = '#fff'; rrect(c, q * 0.6, q * 0.6, L.W - q * 1.2, L.H - q * 1.2, q * 0.9); c.fill(); c.restore(); c.save(); rrect(c, q, q, L.iw, L.ih, q * 0.6); c.clip(); putImg(c, L, src); c.restore(); } },
  ];
}

// Extra tekststijlen en emoji's voor de editor (achteraan toegevoegd: bestaande keuzes veranderen niet)
export const R4_FONTS = [
  ['Brede letters', "'Arial Black','Helvetica Neue',Arial,sans-serif"],
  ['Zwierig', "'Zapfino','Apple Chancery','Lucida Calligraphy',cursive"],
  ['Potlood', "'Chalkduster','Bradley Hand','Comic Sans MS',cursive"],
  ['Kantoor', "'American Typewriter','Courier New',serif"],
  ['Stoer', "'Rockwell','Georgia',serif"],
];
export const R4_EMOJI = ['🦄', '🐶', '🐱', '🦊', '🐼', '🐸', '🦁', '🐙', '🦋', '🌸', '🌻', '🍀', '🍕', '🍦', '🍩', '🍓', '🎈', '🎉', '🎁', '🏆', '🚀', '🎸', '⚽', '👑'];
