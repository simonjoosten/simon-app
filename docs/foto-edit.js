// Foto-editor: bijsnijden, licht & kleur, filters, tekenen, tekst, stickers, frames, vervagen, kleur-pop,
// dubbele belichting en tilt-shift. Alles gebeurt op je eigen toestel: foto's worden nergens geüpload of opgeslagen.
// De pixel-bewerkingen komen uit foto-filters.js (wordt lui geladen met dynamic import).

const MAXSIDE = 2000, PREV = 1000, HMAX = 21, BMAX = 9;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r4 = (v) => Math.round(v * 10000) / 10000;
const NOADJ = { brightness: 0, contrast: 0, saturation: 0, warmth: 0, tint: 0, highlights: 0, shadows: 0, sharpen: 0, vignette: 0, grain: 0, fade: 0 };
const ADJ_LIST = [['brightness', '☀️ Helderheid'], ['contrast', '◐ Contrast'], ['saturation', '🎨 Verzadiging'], ['warmth', '🔥 Warmte'], ['tint', '🌿 Tint'], ['highlights', '⬜ Hooglichten'], ['shadows', '⬛ Schaduwen'], ['sharpen', '🔍 Scherpte'], ['vignette', '⚫ Vignet'], ['grain', '✳️ Korrel'], ['fade', '🌫️ Fade']];
const PAL = ['#ffffff', '#111827', '#ef4444', '#f97316', '#facc15', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#92400e', '#9ca3af'];
const FONTS = [
  ['Standaard', "-apple-system,'Helvetica Neue',Arial,sans-serif"],
  ['Schreef', "Georgia,'Times New Roman',serif"],
  ['Typemachine', "'Courier New',Courier,monospace"],
  ['Dik', "Impact,'Arial Black','Helvetica Neue',sans-serif"],
  ['Handschrift', "'Bradley Hand','Segoe Print','Comic Sans MS',cursive"],
  ['Krabbel', "'Marker Felt','Chalkboard SE','Comic Sans MS',cursive"],
  ['Sierlijk', "Didot,'Bodoni MT','Hoefler Text',Palatino,serif"],
  ['Boek', "Palatino,'Palatino Linotype','Book Antiqua',serif"],
  ['Rond', "'Avenir Next Rounded','Arial Rounded MT Bold','Trebuchet MS',sans-serif"],
  ['Strak', "Futura,'Century Gothic',Avenir,'Gill Sans',sans-serif"],
  ['Trebuchet', "'Trebuchet MS',Tahoma,sans-serif"],
  ['Verdana', "Verdana,Geneva,sans-serif"],
  ['Optima', "Optima,Candara,'Segoe UI',sans-serif"],
  ['Schrijfletter', "'Snell Roundhand','Brush Script MT','Lucida Handwriting',cursive"],
  ['Smal', "'Arial Narrow','Helvetica Neue',Arial,sans-serif"],
];
const EMOJI = ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💖', '⭐', '🌟', '✨', '⚡', '🔥', '🌈', '☀️', '🌙', '☁️', '❄️', '🌸', '🌼', '🌻', '🌹', '🍀', '🌴', '🎉', '🎈', '🎁', '🎂', '🍕', '🍔', '🍦', '🍩', '🍓', '🍉', '🍒', '🥑', '😀', '😂', '😍', '😎', '🥳', '😜', '🤩', '😴', '🤔', '😇', '🥰', '😱', '👍', '👏', '🙌', '💪', '👀', '💋', '👑', '🎩', '🕶️', '🎀', '🐶', '🐱', '🦄', '🐼', '🦊', '🐸', '🐝', '🦋', '🐢', '🐙', '🚀', '⚽', '🎵', '💎', '📸'];
const RATIOS = [['free', 'Vrij'], ['1:1', '1:1'], ['4:5', '4:5'], ['3:4', '3:4'], ['9:16', '9:16'], ['16:9', '16:9'], ['orig', 'Origineel']];
const BLENDS = [['screen', 'Screen'], ['multiply', 'Multiply'], ['lighten', 'Lighten'], ['overlay', 'Overlay'], ['normal', 'Normaal'], ['difference', 'Verschil']];

/* ============================ pure logica (getest in node) ============================ */
export function ratioValue(key, bw, bh) {
  const m = { '1:1': 1, '4:5': 4 / 5, '3:4': 3 / 4, '9:16': 9 / 16, '16:9': 16 / 9 };
  if (key === 'orig') return bw / bh;
  return m[key] || 0;
}
export function fitCrop(r, bw, bh) {
  if (!r) return { x: 0, y: 0, w: bw, h: bh };
  let w = bw, h = w / r;
  if (h > bh) { h = bh; w = h * r; }
  return { x: (bw - w) / 2, y: (bh - h) / 2, w, h };
}
export function coverScale(deg, w, h) {
  const a = Math.abs(deg) * Math.PI / 180;
  if (!a) return 1;
  return Math.cos(a) + Math.sin(a) * Math.max(h / w, w / h);
}
export function dragCorner(rect, corner, px, py, ratio, bw, bh, minS) {
  minS = minS || 40;
  const west = corner[1] === 'w', north = corner[0] === 'n';
  const ax = west ? rect.x + rect.w : rect.x, ay = north ? rect.y + rect.h : rect.y;
  const sx = west ? -1 : 1, sy = north ? -1 : 1;
  const maxX = sx > 0 ? bw - ax : ax, maxY = sy > 0 ? bh - ay : ay;
  let dx = clamp((px - ax) * sx, minS, maxX), dy = clamp((py - ay) * sy, minS, maxY);
  if (ratio) {
    let w = Math.max(dx, dy * ratio);
    w = Math.min(w, maxX, maxY * ratio);
    dx = w; dy = w / ratio;
  }
  return { x: sx > 0 ? ax : ax - dx, y: sy > 0 ? ay : ay - dy, w: dx, h: dy };
}
export function dragEdge(rect, edge, px, py, bw, bh, minS) {
  minS = minS || 40;
  let { x, y, w, h } = rect;
  if (edge === 'n') { const ny = clamp(py, 0, y + h - minS); h = y + h - ny; y = ny; }
  else if (edge === 's') { h = clamp(py, y + minS, bh) - y; }
  else if (edge === 'w') { const nx = clamp(px, 0, x + w - minS); w = x + w - nx; x = nx; }
  else { w = clamp(px, x + minS, bw) - x; }
  return { x, y, w, h };
}
export function moveRect(rect, dx, dy, bw, bh) {
  return { x: clamp(rect.x + dx, 0, bw - rect.w), y: clamp(rect.y + dy, 0, bh - rect.h), w: rect.w, h: rect.h };
}
// Verplaatst tekst/sticker/tekenlagen mee na bijsnijden/draaien. tf: {f(x,y)->[x,y] in pixels, k, rot, refl, oldW, newW}
export function transformLayers(st, tf) {
  const out = JSON.parse(JSON.stringify(st));
  const mp = (ux, uy) => { const q = tf.f(ux * tf.oldW, uy * tf.oldW); return [q[0] / tf.newW, q[1] / tf.newW]; };
  const su = tf.k * tf.oldW / tf.newW;
  (out.layers || []).forEach((L) => {
    const q = mp(L.x, L.y); L.x = r4(q[0]); L.y = r4(q[1]);
    L.size = L.size * su;
    L.rot = (tf.refl ? -(L.rot || 0) : (L.rot || 0)) + (tf.rot || 0);
  });
  (out.strokes || []).forEach((s) => {
    for (let i = 0; i + 1 < s.p.length; i += 2) { const q = mp(s.p[i], s.p[i + 1]); s.p[i] = r4(q[0]); s.p[i + 1] = r4(q[1]); }
    s.w = s.w * su;
  });
  return out;
}
export function framePad(w, h, thick) { return Math.round((0.012 + clamp(thick, 0, 100) / 100 * 0.12) * Math.min(w, h)); }
export function pruneHist(h, hi, maxLen, maxBases) {
  maxLen = maxLen || HMAX; maxBases = maxBases || BMAX;
  while (h.length > maxLen) { h.shift(); hi--; }
  while (new Set(h.map((e) => e.base)).size > maxBases && h.length > 1) { h.shift(); hi--; }
  return Math.max(0, hi);
}
export function clampView(v, W, H, bw, bh) {
  const mx = bw <= W ? 0 : (bw - W) / 2 + 40, my = bh <= H ? 0 : (bh - H) / 2 + 40;
  return { z: v.z, px: clamp(v.px, -mx, mx), py: clamp(v.py, -my, my) };
}
export function fitBox(W, H, cw, ch, v) {
  const a = ch / cw, fw = Math.min(W * 0.96, H * 0.96 / a), bw = fw * v.z, bh = bw * a;
  return { x: (W - bw) / 2 + v.px, y: (H - bh) / 2 + v.py, w: bw, h: bh };
}
export function overlayOffset(ox, w, dw, dxPx) { // nieuwe ox na verschuiven van de overlay met dxPx pixels
  const ov = w - dw;
  if (Math.abs(ov) < 1) return ox;
  return clamp(ox + 2 * dxPx / ov, -1, 1);
}
const lum = (hex) => { const m = /^#([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 255; const n = parseInt(m[1], 16); return .299 * (n >> 16) + .587 * ((n >> 8) & 255) + .114 * (n & 255); };

/* ============================ canvas helpers ============================ */
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
const free = (c) => { if (c && c.width) { c.width = 1; c.height = 1; } };
function rrect(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function heartPath(c, x, y, w, h) {
  const X = (v) => x + (v - 20) / 110 * w, Y = (v) => y + (v - 25) / 95 * h;
  c.beginPath(); c.moveTo(X(75), Y(40));
  c.bezierCurveTo(X(75), Y(37), X(70), Y(25), X(50), Y(25)); c.bezierCurveTo(X(20), Y(25), X(20), Y(62.5), X(20), Y(62.5));
  c.bezierCurveTo(X(20), Y(80), X(40), Y(102), X(75), Y(120)); c.bezierCurveTo(X(110), Y(102), X(130), Y(80), X(130), Y(62.5));
  c.bezierCurveTo(X(130), Y(62.5), X(130), Y(25), X(100), Y(25)); c.bezierCurveTo(X(85), Y(25), X(75), Y(37), X(75), Y(40)); c.closePath();
}
function poly(c, pts) { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); }
function wavePath(c, x, y, w, h, amp, n) {
  const st = 3, nx = Math.max(2, Math.round(n * w / Math.max(w, h))), ny = Math.max(2, Math.round(n * h / Math.max(w, h)));
  c.beginPath();
  for (let i = 0; i <= w; i += st) c.lineTo(x + i, y + amp * (1 + Math.sin(i / w * nx * TAU)));
  for (let j = 0; j <= h; j += st) c.lineTo(x + w - amp * (1 + Math.sin(j / h * ny * TAU)), y + j);
  for (let i = w; i >= 0; i -= st) c.lineTo(x + i, y + h - amp * (1 + Math.sin(i / w * nx * TAU)));
  for (let j = h; j >= 0; j -= st) c.lineTo(x + amp * (1 + Math.sin(j / h * ny * TAU)), y + j);
  c.closePath();
}

/* ============================ stickers (zelf getekend, vak -50..50) ============================ */
const STK = {
  heart: (c) => { heartPath(c, -46, -42, 92, 84); c.fillStyle = '#ef4444'; c.fill(); c.strokeStyle = '#b91c1c'; c.lineWidth = 3; c.stroke(); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-22, -22, 9, 5, -0.7, 0, TAU); c.fill(); },
  star: (c) => { const p = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 20 : 47, a = -Math.PI / 2 + i * Math.PI / 5; p.push([Math.cos(a) * r, Math.sin(a) * r + 2]); } poly(c, p); c.fillStyle = '#fbbf24'; c.fill(); c.lineJoin = 'round'; c.strokeStyle = '#f59e0b'; c.lineWidth = 4; c.stroke(); },
  bolt: (c) => { poly(c, [[-4, -48], [-28, 6], [-6, 6], [-16, 48], [28, -10], [6, -10], [20, -48]]); c.fillStyle = '#facc15'; c.fill(); c.lineJoin = 'round'; c.strokeStyle = '#eab308'; c.lineWidth = 4; c.stroke(); },
  cloud: (c) => { const path = () => { c.beginPath(); c.arc(-22, 8, 18, 0, TAU); c.moveTo(2, -4); c.arc(-2, -4, 24, 0, TAU); c.moveTo(42, 8); c.arc(24, 8, 20, 0, TAU); rrect(c, -34, 6, 78, 22, 11); }; c.fillStyle = '#cbd5e1'; c.strokeStyle = '#cbd5e1'; c.lineWidth = 7; path(); c.stroke(); c.fill(); c.fillStyle = '#ffffff'; path(); c.fill(); },
  crown: (c) => { poly(c, [[-40, 26], [-42, -20], [-20, 2], [0, -34], [20, 2], [42, -20], [40, 26]]); c.fillStyle = '#fbbf24'; c.fill(); c.strokeStyle = '#d97706'; c.lineWidth = 3; c.lineJoin = 'round'; c.stroke(); c.fillStyle = '#f59e0b'; c.fillRect(-40, 16, 80, 12); [['#ef4444', -22], ['#3b82f6', 0], ['#22c55e', 22]].forEach((j) => { c.fillStyle = j[0]; c.beginPath(); c.arc(j[1], 22, 4, 0, TAU); c.fill(); }); },
  glasses: (c) => { c.lineWidth = 5; c.strokeStyle = '#111827'; c.fillStyle = 'rgba(186,230,253,.55)'; [-24, 24].forEach((x) => { c.beginPath(); c.arc(x, 0, 18, 0, TAU); c.fill(); c.stroke(); }); c.beginPath(); c.arc(0, -2, 7, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.beginPath(); c.moveTo(-42, -2); c.lineTo(-50, -8); c.moveTo(42, -2); c.lineTo(50, -8); c.stroke(); },
  sunglasses: (c) => { c.fillStyle = '#111827'; [-1, 1].forEach((s) => { c.save(); c.scale(s, 1); poly(c, [[3, -12], [44, -12], [40, 14], [30, 22], [14, 22], [4, 8]]); c.fill(); c.fillStyle = 'rgba(255,255,255,.28)'; poly(c, [[12, -8], [26, -8], [14, 6]]); c.fill(); c.fillStyle = '#111827'; c.restore(); }); c.fillRect(-6, -12, 12, 5); c.fillRect(-50, -14, 10, 4); c.fillRect(40, -14, 10, 4); },
  mustache: (c) => { c.fillStyle = '#3b2314'; [1, -1].forEach((s) => { c.save(); c.scale(s, 1); c.beginPath(); c.moveTo(0, -6); c.bezierCurveTo(8, -18, 26, -18, 46, -2); c.bezierCurveTo(40, 14, 14, 12, 0, 6); c.bezierCurveTo(10, 4, 26, 2, 34, -4); c.bezierCurveTo(22, -8, 10, -6, 0, 2); c.closePath(); c.fill(); c.restore(); }); },
  tophat: (c) => { c.fillStyle = '#111827'; c.beginPath(); c.ellipse(0, 28, 48, 10, 0, 0, TAU); c.fill(); rrect(c, -27, -36, 54, 62, 4); c.fill(); c.fillStyle = '#ef4444'; c.fillRect(-27, 6, 54, 11); },
  partyhat: (c) => { poly(c, [[0, -42], [-30, 38], [30, 38]]); c.fillStyle = '#a855f7'; c.fill(); c.save(); c.clip(); c.strokeStyle = '#fde047'; c.lineWidth = 6; for (let i = -3; i < 4; i++) { c.beginPath(); c.moveTo(-40, 10 + i * 18); c.lineTo(40, -10 + i * 18); c.stroke(); } c.restore(); c.fillStyle = '#fde047'; c.beginPath(); c.arc(0, -43, 8, 0, TAU); c.fill(); },
  arrow: (c) => { poly(c, [[-46, -11], [8, -11], [8, -30], [46, 0], [8, 30], [8, 11], [-46, 11]]); c.fillStyle = '#3b82f6'; c.fill(); c.lineJoin = 'round'; c.strokeStyle = '#1d4ed8'; c.lineWidth = 4; c.stroke(); },
  bubble: (c) => { c.lineJoin = 'round'; c.lineWidth = 4; c.strokeStyle = '#111827'; c.fillStyle = '#ffffff'; rrect(c, -44, -36, 88, 58, 18); c.fill(); c.stroke(); poly(c, [[-18, 20], [-28, 44], [4, 20]]); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(-16, 18, 18, 5); c.fillStyle = '#111827'; [-16, 0, 16].forEach((x) => { c.beginPath(); c.arc(x, -7, 4.5, 0, TAU); c.fill(); }); },
  confetti: (c) => { const cols = ['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#ec4899', '#f97316']; const d = [[-36, -30, .5], [-8, -40, 1.2], [26, -34, -.4], [40, -8, .9], [-42, 0, 1.6], [-14, -8, .2], [14, -10, 2.2], [-30, 28, -.8], [0, 20, 1], [30, 30, .3], [-10, 42, 1.9], [44, 40, -1.2], [8, 4, 0.7]]; d.forEach((e, i) => { c.save(); c.translate(e[0], e[1]); c.rotate(e[2]); c.fillStyle = cols[i % cols.length]; if (i % 3 === 0) { c.beginPath(); c.arc(0, 0, 4.5, 0, TAU); c.fill(); } else c.fillRect(-6, -3, 12, 6); c.restore(); }); },
  sun: (c) => { c.strokeStyle = '#f59e0b'; c.lineWidth = 6; c.lineCap = 'round'; for (let i = 0; i < 12; i++) { const a = i * TAU / 12; c.beginPath(); c.moveTo(Math.cos(a) * 30, Math.sin(a) * 30); c.lineTo(Math.cos(a) * 46, Math.sin(a) * 46); c.stroke(); } c.fillStyle = '#fbbf24'; c.beginPath(); c.arc(0, 0, 24, 0, TAU); c.fill(); },
  moon: (c) => { c.save(); c.beginPath(); c.arc(0, 0, 40, 0, TAU); c.clip(); c.beginPath(); c.rect(-60, -60, 120, 120); c.arc(18, -10, 33, 0, TAU); c.fillStyle = '#fde68a'; c.fill('evenodd'); c.restore(); },
  flower: (c) => { c.fillStyle = '#f472b6'; for (let i = 0; i < 6; i++) { c.save(); c.rotate(i * TAU / 6); c.beginPath(); c.ellipse(0, -26, 12, 20, 0, 0, TAU); c.fill(); c.restore(); } c.fillStyle = '#facc15'; c.beginPath(); c.arc(0, 0, 13, 0, TAU); c.fill(); },
  rainbow: (c) => { c.lineWidth = 7; ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6'].forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(0, 26, 44 - i * 7, Math.PI, 0); c.stroke(); }); },
  diamond: (c) => { poly(c, [[-32, -18], [-18, -38], [18, -38], [32, -18], [0, 42]]); c.fillStyle = '#38bdf8'; c.fill(); c.strokeStyle = '#0284c7'; c.lineWidth = 3; c.lineJoin = 'round'; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-32, -18); c.lineTo(32, -18); c.moveTo(-10, -18); c.lineTo(0, 42); c.moveTo(10, -18); c.lineTo(0, 42); c.moveTo(-18, -38); c.lineTo(-10, -18); c.moveTo(18, -38); c.lineTo(10, -18); c.stroke(); },
  sparkle: (c) => { c.beginPath(); c.moveTo(0, -46); c.quadraticCurveTo(4, -4, 46, 0); c.quadraticCurveTo(4, 4, 0, 46); c.quadraticCurveTo(-4, 4, -46, 0); c.quadraticCurveTo(-4, -4, 0, -46); c.closePath(); c.fillStyle = '#fde047'; c.fill(); c.strokeStyle = '#facc15'; c.lineWidth = 3; c.stroke(); },
  bow: (c) => { c.lineJoin = 'round'; c.fillStyle = '#ec4899'; c.strokeStyle = '#be185d'; c.lineWidth = 3; [1, -1].forEach((s) => { c.save(); c.scale(s, 1); c.beginPath(); c.moveTo(4, 0); c.bezierCurveTo(20, -30, 46, -34, 46, -14); c.lineTo(46, 14); c.bezierCurveTo(46, 34, 20, 30, 4, 0); c.closePath(); c.fill(); c.stroke(); c.restore(); }); c.fillStyle = '#be185d'; c.beginPath(); c.arc(0, 0, 10, 0, TAU); c.fill(); },
  balloon: (c) => { c.fillStyle = '#ef4444'; c.beginPath(); c.ellipse(0, -10, 28, 34, 0, 0, TAU); c.fill(); poly(c, [[0, 25], [-6, 34], [6, 34]]); c.fill(); c.strokeStyle = '#6b7280'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 34); c.bezierCurveTo(-8, 40, 8, 44, 0, 50); c.stroke(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-10, -22, 5, 9, 0.5, 0, TAU); c.fill(); },
  banner: (c) => { c.fillStyle = '#b91c1c'; [1, -1].forEach((s) => { c.save(); c.scale(s, 1); poly(c, [[-52, -8], [-34, -8], [-34, 24], [-52, 24], [-44, 8]]); c.fill(); c.restore(); }); c.fillStyle = '#ef4444'; c.fillRect(-38, -16, 76, 34); c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(-26, -5, 52, 4); c.fillRect(-18, 5, 36, 4); },
  catears: (c) => { [1, -1].forEach((s) => { c.save(); c.scale(s, 1); poly(c, [[-4, 10], [-10, -40], [-44, -2]]); c.fillStyle = '#374151'; c.fill(); poly(c, [[-9, 4], [-12, -26], [-33, -2]]); c.fillStyle = '#f9a8d4'; c.fill(); c.restore(); }); c.strokeStyle = '#374151'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-44, 8); c.quadraticCurveTo(0, 22, 44, 8); c.stroke(); },
  lips: (c) => { c.beginPath(); c.moveTo(-44, 2); c.bezierCurveTo(-26, -26, -8, -22, 0, -12); c.bezierCurveTo(8, -22, 26, -26, 44, 2); c.bezierCurveTo(20, 6, -20, 6, -44, 2); c.fillStyle = '#dc2626'; c.fill(); c.beginPath(); c.moveTo(-44, 2); c.bezierCurveTo(-20, 6, 20, 6, 44, 2); c.bezierCurveTo(28, 34, -28, 34, -44, 2); c.fillStyle = '#ef4444'; c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(-8, 15, 9, 3, 0, 0, TAU); c.fill(); },
};
const STK_LIST = [['heart', 'Hart'], ['star', 'Ster'], ['bolt', 'Bliksem'], ['cloud', 'Wolk'], ['crown', 'Kroon'], ['glasses', 'Bril'], ['sunglasses', 'Zonnebril'], ['mustache', 'Snor'], ['tophat', 'Hoge hoed'], ['partyhat', 'Feesthoed'], ['arrow', 'Pijl'], ['bubble', 'Tekstballon'], ['confetti', 'Confetti'], ['sun', 'Zon'], ['moon', 'Maan'], ['flower', 'Bloem'], ['rainbow', 'Regenboog'], ['diamond', 'Diamant'], ['sparkle', 'Sprankel'], ['bow', 'Strik'], ['balloon', 'Ballon'], ['banner', 'Lint'], ['catears', 'Kattenoren'], ['lips', 'Lippen']];

/* ============================ frames ============================ */
const bgFill = (c, L, col) => { if (col && col !== 'transparent') { c.fillStyle = col; c.fillRect(0, 0, L.W, L.H); } };
const putImg = (c, L, src) => c.drawImage(src, L.ix, L.iy, L.iw, L.ih);
const lay0 = (w, h) => ({ W: w, H: h, ix: 0, iy: 0, iw: w, ih: h });
const layPad = (f) => (w, h, p) => { const q = Math.round(p * f); return { W: w + 2 * q, H: h + 2 * q, ix: q, iy: q, iw: w, ih: h }; };
const laySq = (w, h) => { const s = Math.min(w, h); return { W: s, H: s, ix: Math.round((s - w) / 2), iy: Math.round((s - h) / 2), iw: w, ih: h }; };
const FRAMES = [
  { id: 'none', name: 'Geen', icon: '⬜', def: '#ffffff', lay: lay0, draw: (c, L, p, col, src) => putImg(c, L, src) },
  { id: 'thin', name: 'Dunne rand', icon: '▫️', def: '#ffffff', lay: lay0, draw: (c, L, p, col, src) => { putImg(c, L, src); const lw = Math.max(2, p * .6); c.strokeStyle = col === 'transparent' ? '#fff' : col; c.lineWidth = lw; c.strokeRect(lw / 2, lw / 2, L.W - lw, L.H - lw); } },
  { id: 'wide', name: 'Brede rand', icon: '🔲', def: '#ffffff', lay: layPad(1.6), draw: (c, L, p, col, src) => { bgFill(c, L, col); putImg(c, L, src); } },
  { id: 'polaroid', name: 'Polaroid', icon: '📷', def: '#fafafa', lay: (w, h, p) => { const s = Math.round(p * 1.3), b = Math.round(p * 4.2); return { W: w + 2 * s, H: h + s + b, ix: s, iy: s, iw: w, ih: h }; }, draw: (c, L, p, col, src) => { bgFill(c, L, col); putImg(c, L, src); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1.5; c.strokeRect(L.ix - .5, L.iy - .5, L.iw + 1, L.ih + 1); } },
  { id: 'film', name: 'Filmrol', icon: '🎞️', def: '#151515', lay: (w, h, p) => { const b = Math.round(p * 2.6) + 6; return { W: w, H: h + 2 * b, ix: 0, iy: b, iw: w, ih: h, b }; }, draw: (c, L, p, col, src) => { bgFill(c, L, col); putImg(c, L, src); const b = L.b, hw = b * .42, hh = b * .5, step = b * .95; c.fillStyle = lum(col) < 128 ? '#f4f4f4' : '#2a2a2a'; for (let x = step / 2; x < L.W - hw; x += step) { [b * .25, L.H - b * .25 - hh].forEach((y) => { rrect(c, x, y, hw, hh, hw * .25); c.fill(); }); } } },
  { id: 'round', name: 'Ronde hoeken', icon: '🟦', def: 'transparent', lay: lay0, draw: (c, L, p, col, src) => { bgFill(c, L, col); c.save(); rrect(c, 0, 0, L.W, L.H, Math.min(L.W, L.H) * (.04 + p / Math.min(L.W, L.H) * 1.2)); c.clip(); putImg(c, L, src); c.restore(); } },
  { id: 'double', name: 'Dubbele rand', icon: '🔳', def: '#ffffff', lay: layPad(1.3), draw: (c, L, p, col, src) => { bgFill(c, L, col); putImg(c, L, src); const q = L.ix, line = lum(col) < 140 ? '#ffffff' : '#222222'; c.strokeStyle = line; c.lineWidth = Math.max(1.5, p * .12); c.strokeRect(q * .4, q * .4, L.W - q * .8, L.H - q * .8); c.strokeRect(q - .5, q - .5, L.iw + 1, L.ih + 1); } },
  { id: 'circle', name: 'Cirkel', icon: '⚪', def: '#ffffff', lay: laySq, draw: (c, L, p, col, src) => { bgFill(c, L, col); c.save(); c.beginPath(); c.arc(L.W / 2, L.H / 2, L.W / 2 - 1, 0, TAU); c.clip(); putImg(c, L, src); c.restore(); } },
  { id: 'heart', name: 'Hart', icon: '❤️', def: '#ffe4ec', lay: laySq, draw: (c, L, p, col, src) => { bgFill(c, L, col); c.save(); heartPath(c, L.W * .02, L.H * .04, L.W * .96, L.H * .9); c.clip(); putImg(c, L, src); c.restore(); } },
  { id: 'wave', name: 'Golfrand', icon: '🌊', def: '#ffffff', lay: layPad(1.5), draw: (c, L, p, col, src) => { bgFill(c, L, col); c.save(); wavePath(c, L.ix, L.iy, L.iw, L.ih, Math.max(3, p * .35), 9); c.clip(); putImg(c, L, src); c.restore(); } },
  { id: 'postcard', name: 'Ansichtkaart', icon: '✉️', def: '#fdf6e3', lay: layPad(1.7), draw: (c, L, p, col, src) => { bgFill(c, L, col); const b = L.ix * .3; c.save(); c.beginPath(); c.rect(0, 0, L.W, L.H); c.rect(b, b, L.W - 2 * b, L.H - 2 * b); c.clip('evenodd'); for (let x = -L.H, i = 0; x < L.W; x += b * 1.6, i++) { c.fillStyle = i % 2 ? '#2563eb' : '#e11d48'; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + b * 1.6, 0); c.lineTo(x + b * 1.6 + L.H, L.H); c.lineTo(x + L.H, L.H); c.closePath(); c.fill(); } c.restore(); putImg(c, L, src); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1.5; c.strokeRect(L.ix - .5, L.iy - .5, L.iw + 1, L.ih + 1); } },
  { id: 'shadow', name: 'Schaduwrand', icon: '🌑', def: '#e5e7eb', lay: layPad(2.2), draw: (c, L, p, col, src) => { bgFill(c, L, col); c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = L.ix * .7; c.shadowOffsetY = L.ix * .22; putImg(c, L, src); c.restore(); } },
  { id: 'stamp', name: 'Postzegel', icon: '📮', def: '#ffffff', lay: layPad(1.6), draw: (c, L, p, col, src) => { c.fillStyle = col === 'transparent' ? '#ffffff' : col; c.fillRect(0, 0, L.W, L.H); putImg(c, L, src); c.globalCompositeOperation = 'destination-out'; const r = L.ix * .3, nx = Math.max(3, Math.round(L.W / (r * 2.6))), ny = Math.max(3, Math.round(L.H / (r * 2.6))); c.fillStyle = '#000'; for (let i = 0; i <= nx; i++) { const x = i * L.W / nx; [0, L.H].forEach((y) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }); } for (let j = 0; j <= ny; j++) { const y = j * L.H / ny; [0, L.W].forEach((x) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }); } c.globalCompositeOperation = 'source-over'; } },
  { id: 'mat', name: 'Passe-partout', icon: '🖼️', def: '#f5f0e6', lay: layPad(2.4), draw: (c, L, p, col, src) => { bgFill(c, L, col); putImg(c, L, src); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; c.strokeRect(L.ix - 1, L.iy - 1, L.iw + 2, L.ih + 2); c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 1.5; c.strokeRect(L.ix * .3, L.iy * .3, L.W - L.ix * .6, L.H - L.iy * .6); } },
];
const FR = {}; FRAMES.forEach((f) => { FR[f.id] = f; });
export const FRAME_IDS = FRAMES.map((f) => f.id);
export function frameLayout(id, w, h, thick) { const F = FR[id] || FR.none; return F.lay(w, h, framePad(w, h, thick)); }
function applyFrame(src, fr) {
  const F = FR[fr.id];
  if (!F || fr.id === 'none') return { cv: src, L: lay0(src.width, src.height) };
  const w = src.width, h = src.height, p = framePad(w, h, fr.thick), L = F.lay(w, h, p);
  const out = mk(L.W, L.H); F.draw(out.getContext('2d'), L, p, fr.color, src);
  return { cv: out, L };
}

/* ============================ lagen: tekst, emoji, stickers ============================ */
let _mctx = null;
function fontOf(L, px) { return (L.italic ? 'italic ' : '') + (L.bold ? '700 ' : '400 ') + px + 'px ' + (FONTS[L.font] || FONTS[0])[1]; }
function textMetrics(L) { // in eenheden van beeldbreedte
  if (!_mctx) _mctx = mk(4, 4).getContext('2d');
  const fs = 1000 * L.size; _mctx.font = fontOf(L, fs);
  const lines = String(L.text || ' ').split('\n'); let w = 0;
  lines.forEach((t) => { w = Math.max(w, _mctx.measureText(t || ' ').width); });
  const lh = fs * 1.2, pad = L.bg ? fs * .3 : 0;
  return { lines, fs, lh, bw: w / 1000, bh: lh * lines.length / 1000, pad: pad / 1000 };
}
function layerSize(L) {
  if (L.type === 'text') { const m = textMetrics(L); return { w: m.bw + 2 * m.pad, h: m.bh + 1.2 * m.pad }; }
  return { w: L.size, h: L.size * (L.type === 'emoji' ? 1.15 : 1) };
}
function drawLayer(c, L, W) {
  c.save(); c.translate(L.x * W, L.y * W); c.rotate(L.rot || 0);
  if (L.type === 'text') {
    const m = textMetrics(L), fs = m.fs / 1000 * W, lh = m.lh / 1000 * W, bw = m.bw * W, bh = m.bh * W, pad = m.pad * W;
    c.font = fontOf(L, fs); c.textBaseline = 'middle'; c.textAlign = L.align === 'left' ? 'left' : L.align === 'right' ? 'right' : 'center';
    const tx = L.align === 'left' ? -bw / 2 : L.align === 'right' ? bw / 2 : 0;
    if (L.bg) { c.globalAlpha = .88; c.fillStyle = L.bgColor; rrect(c, -bw / 2 - pad, -bh / 2 - pad * .6, bw + 2 * pad, bh + 1.2 * pad, fs * .2); c.fill(); c.globalAlpha = 1; }
    m.lines.forEach((t, i) => {
      const y = -bh / 2 + lh * (i + .5);
      if (L.shadow) { c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = fs * .12; c.shadowOffsetX = fs * .03; c.shadowOffsetY = fs * .05; }
      if (L.stroke) { c.lineJoin = 'round'; c.lineWidth = fs * .14; c.strokeStyle = L.strokeColor; c.strokeText(t, tx, y); c.shadowColor = 'transparent'; }
      c.fillStyle = L.color; c.fillText(t, tx, y); c.shadowColor = 'transparent';
    });
  } else {
    if (L.flip) c.scale(-1, 1);
    if (L.type === 'emoji') { c.font = Math.round(L.size * W * .86) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(L.ch, 0, L.size * W * .04); }
    else if (STK[L.key]) { const s = L.size * W / 100; c.scale(s, s); STK[L.key](c); }
  }
  c.restore();
}
function drawLayers(c, W, layers) { layers.forEach((L) => drawLayer(c, L, W)); }
function drawStrokes(c, W, H, strokes, cache) {
  if (!strokes.length) return;
  let lc = cache && cache.width === W && cache.height === H ? cache : null;
  if (!lc) lc = mk(W, H);
  const g = lc.getContext('2d'); g.clearRect(0, 0, W, H);
  strokes.forEach((s) => {
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = Math.max(1, s.w * W);
    g.globalCompositeOperation = s.k === 'eraser' ? 'destination-out' : 'source-over';
    g.globalAlpha = s.k === 'marker' ? .45 : 1; g.strokeStyle = g.fillStyle = s.k === 'eraser' ? '#000' : s.c;
    const p = s.p;
    if (p.length <= 2) { g.beginPath(); g.arc(p[0] * W, p[1] * W, g.lineWidth / 2, 0, TAU); g.fill(); }
    else {
      g.beginPath(); g.moveTo(p[0] * W, p[1] * W);
      for (let i = 2; i < p.length - 2; i += 2) g.quadraticCurveTo(p[i] * W, p[i + 1] * W, (p[i] + p[i + 2]) / 2 * W, (p[i + 1] + p[i + 3]) / 2 * W);
      g.lineTo(p[p.length - 2] * W, p[p.length - 1] * W); g.stroke();
    }
    g.restore();
  });
  c.drawImage(lc, 0, 0);
  return lc;
}

/* ============================ de view ============================ */
// ctx: { view, esc, uid, addCleanup }
export function fotoEditView(ctx) {
  const { view, addCleanup } = ctx;
  let alive = true, FX = null, fxErr = '', raf = 0, dirtyComp = false, nid = 1, ovId = 0;
  const cleanups = [], urls = new Set(), timers = new Set();
  const ptrs = new Map();
  let g = null, cv = null, sctx = null, SW = 300, SH = 300, dpr = 1, panel = null, ro = null, fileIn = null, ovIn = null, msgEl = null;

  const style = document.createElement('style');
  style.textContent = `
.fe-wrap{max-width:760px;margin:0 auto;color:var(--ink);-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.fe-wrap *{box-sizing:border-box}
.fe-b{font:inherit;font-size:.92rem;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:11px;padding:.5rem .7rem;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;line-height:1.2}
.fe-b:disabled{opacity:.4;cursor:default}
.fe-b.on,.fe-b.pri{background:var(--accent);border-color:var(--accent);color:#fff}
.fe-top{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.fe-stage{position:relative;height:clamp(250px,46vh,540px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden}
.fe-stage canvas{position:absolute;top:0;left:0;width:100%;height:100%;display:block;touch-action:none}
.fe-zoom{position:absolute;right:8px;bottom:8px;display:flex;gap:4px}
.fe-zoom .fe-b{padding:.3rem .55rem;opacity:.9}
.fe-msg{position:absolute;left:8px;top:8px;right:8px;pointer-events:none;font-size:.82rem;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:.3rem .6rem;display:none}
.fe-tools{display:flex;gap:6px;overflow-x:auto;padding:8px 2px;-webkit-overflow-scrolling:touch}
.fe-t{flex:0 0 auto;min-width:64px;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:.72rem;padding:.4rem .3rem}
.fe-t i{font-style:normal;font-size:1.3rem;line-height:1.2}
.fe-panel{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px;min-height:96px}
.fe-row{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0;align-items:center}
.fe-r{display:flex;align-items:center;gap:8px;margin:7px 0;font-size:.88rem}
.fe-r span{min-width:6.6rem}.fe-r input[type=range]{flex:1;min-width:0}.fe-r b{min-width:2.4rem;text-align:right;font-weight:600;opacity:.75}
.fe-hint{font-size:.82rem;opacity:.7;margin:6px 2px}
.fe-sw{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:6px 0}
.fe-s{width:32px;height:32px;border-radius:50%;border:2px solid var(--line);padding:0;cursor:pointer}
.fe-s.on{box-shadow:0 0 0 2px var(--accent);border-color:var(--card)}
.fe-cc{width:38px;height:32px;padding:0;border:0;background:none}
.fe-flt{display:flex;gap:6px;overflow-x:auto;padding:4px 0 8px;-webkit-overflow-scrolling:touch;align-items:stretch}
.fe-ft{flex:0 0 auto;width:76px;padding:3px;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:.68rem;background:var(--card);border:2px solid transparent;border-radius:10px;color:var(--ink);cursor:pointer;touch-action:manipulation}
.fe-ft.on{border-color:var(--accent)}.fe-ft canvas{width:68px;height:68px;border-radius:8px;background:var(--line);display:block}
.fe-gl{flex:0 0 auto;writing-mode:vertical-rl;transform:rotate(180deg);font-size:.7rem;font-style:normal;opacity:.65;padding:4px 2px;border-left:1px solid var(--line);text-align:center;max-height:100px}
.fe-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(46px,1fr));gap:6px;max-height:200px;overflow-y:auto;-webkit-overflow-scrolling:touch}
.fe-grid .fe-b{padding:.2rem;font-size:1.5rem;aspect-ratio:1;display:flex;align-items:center;justify-content:center}
.fe-grid canvas{width:34px;height:34px;display:block}
.fe-frames{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:6px}
.fe-frames .fe-b{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:.72rem;padding:.4rem .2rem}.fe-frames i{font-style:normal;font-size:1.3rem}
.fe-fonts{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0}.fe-fonts .fe-b{padding:.3rem .55rem;font-size:.95rem}
.fe-ta{width:100%;font:inherit;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:10px;padding:.5rem;min-height:3.2rem;resize:vertical;-webkit-user-select:text;user-select:text}
.fe-drop{border:2px dashed var(--line);border-radius:18px;padding:2rem 1rem;text-align:center;background:var(--card)}
.fe-drop.over{border-color:var(--accent)}.fe-big{font-size:3rem}
.fe-tips{font-size:.84rem;opacity:.8;margin:12px 4px}.fe-tips li{margin:3px 0}
`;
  document.head.appendChild(style);

  /* ---------- staat ---------- */
  const S = { orig: null, base: null, small: null, owned: false, bver: 0, adj: { ...NOADJ }, filt: { id: 'none', s: 100 }, frame: { id: 'none', color: '#ffffff', thick: 40 }, layers: [], strokes: [], sel: null, tool: 'adj', pend: null, hist: [], hi: -1, view: { z: 1, px: 0, py: 0 }, comp: null, compCv: null, strokeCv: null, map: { ox: 0, oy: 0, k: 1, cw: 1, ch: 1 }, box: null, comparing: false, hover: null, queue: [], name: 'foto', busy: false, pk: '', proc: null };
  const T = {
    crop: { rect: null, ratio: 'free', ang: 0 },
    filt: { ver: -1, map: new Map(), base: null, io: null },
    draw: { k: 'pen', color: '#ef4444', size: 12 },
    text: { text: '', font: 0, color: '#ffffff', size: 9, align: 'center', bold: false, italic: false, shadow: true, stroke: false, strokeColor: '#000000', bg: false, bgColor: '#000000' },
    stk: { tab: 'emoji' },
    brush: { mode: 'blur', size: 10, strength: 60 },
    pop: { tol: 30, soft: 20, pick: null },
    tilt: { mode: 'linear', cy: .5, size: .3, blur: 60, angle: 0, sat: 25 },
    dbl: { ov: null, mode: 'screen', opacity: 60, scale: 100, ox: 0, oy: 0 },
    save: { fmt: 'jpg', q: 90 },
  };
  let P = { key: '', cv: null }; // cache van bewerkte voorbeeld

  /* ---------- fx-wrapper ---------- */
  const fx = (name, c, ...a) => { const r = FX[name](c, ...a); return r && r.getContext ? r : c; };
  const hasAdj = () => ADJ_LIST.some((a) => S.adj[a[0]]);
  function applyLook(c) {
    if (hasAdj()) c = fx('adjust', c, S.adj);
    if (S.filt.id !== 'none' && S.filt.s > 0) c = fx('applyFilter', c, S.filt.id, S.filt.s / 100);
    return c;
  }
  function coverCanvas(src, w, h, scale, ox, oy) {
    const out = mk(w, h), c = out.getContext('2d');
    const s = Math.max(w / src.width, h / src.height) * scale, dw = src.width * s, dh = src.height * s;
    c.imageSmoothingQuality = 'high';
    c.drawImage(src, (w - dw) * (.5 + .5 * ox), (h - dh) * (.5 + .5 * oy), dw, dh);
    return out;
  }
  function runPend(c, pd) {
    if (pd.type === 'pop') return fx('colorPop', c, pd.h, pd.tol, pd.soft);
    if (pd.type === 'tilt') return fx('tiltShift', c, { mode: pd.mode, cy: pd.cy, size: pd.size, blur: pd.blur, angle: pd.angle, saturationBoost: pd.sat / 100 });
    if (pd.type === 'dbl' && T.dbl.ov) {
      const ov = coverCanvas(T.dbl.ov, c.width, c.height, pd.scale / 100, pd.ox, pd.oy);
      const r = FX.doubleExposure(c, ov, { opacity: pd.opacity / 100, mode: pd.mode, fit: 'cover' });
      free(ov);
      return r && r.getContext ? r : c;
    }
    return c;
  }
  function processed() {
    const key = [S.bver, JSON.stringify(S.adj), JSON.stringify(S.filt), S.pend ? JSON.stringify(S.pend) + ovId : ''].join('|');
    if (P.key === key && P.cv) return P.cv;
    free(P.cv);
    let c = FX.cloneCanvas(S.small);
    if (S.pend) c = runPend(c, S.pend);
    c = applyLook(c);
    P = { key, cv: c };
    return c;
  }
  function buildComp() {
    const p = processed(), w = p.width, h = p.height;
    let out = S.compCv;
    if (!out || out.width !== w || out.height !== h) { free(out); out = S.compCv = mk(w, h); }
    const c = out.getContext('2d'); c.clearRect(0, 0, w, h); c.drawImage(p, 0, 0);
    let res = out, L = lay0(w, h);
    if (S.tool !== 'crop') {
      const lc = drawStrokes(c, w, h, S.strokes, S.strokeCv); if (lc && lc !== S.strokeCv) { free(S.strokeCv); S.strokeCv = lc; }
      drawLayers(c, w, S.layers);
      if (S.frame.id !== 'none') { const f = applyFrame(out, S.frame); res = f.cv; L = f.L; }
    }
    S.comp = res; S.map = { ox: L.ix, oy: L.iy, k: w, cw: res.width, ch: res.height };
  }
  function renderFull() {
    let p = FX.cloneCanvas(S.base); p = applyLook(p);
    const w = p.width, h = p.height, out = mk(w, h), c = out.getContext('2d'); c.drawImage(p, 0, 0); free(p);
    const lc = drawStrokes(c, w, h, S.strokes, null); free(lc);
    drawLayers(c, w, S.layers);
    if (S.frame.id === 'none') return out;
    const f = applyFrame(out, S.frame); free(out); return f.cv;
  }

  /* ---------- geschiedenis ---------- */
  const snapJSON = () => JSON.stringify({ adj: S.adj, filt: S.filt, frame: S.frame, layers: S.layers, strokes: S.strokes });
  function commit() {
    const j = snapJSON(), cur = S.hist[S.hi];
    if (cur && cur.base === S.base && cur.j === j) return;
    S.hist.length = S.hi + 1; S.hist.push({ base: S.base, j }); S.owned = false;
    S.hi = pruneHist(S.hist, S.hist.length - 1);
    upUndo();
  }
  function restore(i) {
    const e = S.hist[i]; if (!e) return;
    const st = JSON.parse(e.j);
    S.hi = i; S.base = e.base; S.owned = false; S.adj = st.adj; S.filt = st.filt; S.frame = st.frame; S.layers = st.layers; S.strokes = st.strokes;
    S.sel = null; S.pend = null; S.hover = null; rebuildSmall(); S.bver++;
    if (S.tool === 'crop') enterCrop();
    if (S.tool === 'tilt') enterTilt();
    refreshPanel(); upUndo(); resetViewIfNeeded(); req(true);
  }
  let lastDims = '';
  function resetViewIfNeeded() { const d = S.base.width + 'x' + S.base.height; if (d !== lastDims) { lastDims = d; S.view = { z: 1, px: 0, py: 0 }; } }
  const undo = () => { if (S.hi > 0) restore(S.hi - 1); };
  const redo = () => { if (S.hi < S.hist.length - 1) restore(S.hi + 1); };
  function upUndo() {
    const u = view.querySelector('[data-top="undo"]'), r = view.querySelector('[data-top="redo"]');
    if (u) u.disabled = S.hi <= 0; if (r) r.disabled = S.hi >= S.hist.length - 1;
  }
  function mutableBase() { if (!S.owned) { S.base = FX.cloneCanvas(S.base); S.owned = true; rebuildSmall(); } return S.base; }
  function rebuildSmall() {
    const b = S.base, m = Math.max(b.width, b.height);
    if (S.small && S.small !== S.base && S.small !== S.orig) free(S.small);
    if (m <= PREV) { S.small = b; return; }
    const k = PREV / m, s = mk(b.width * k, b.height * k), c = s.getContext('2d'); c.imageSmoothingQuality = 'high'; c.drawImage(b, 0, 0, s.width, s.height); S.small = s;
  }
  function resetAll() {
    S.base = S.orig; S.owned = false; S.adj = { ...NOADJ }; S.filt = { id: 'none', s: 100 }; S.frame = { id: 'none', color: '#ffffff', thick: 40 }; S.layers = []; S.strokes = []; S.sel = null; S.pend = null;
    rebuildSmall(); S.bver++; commit();
    if (S.tool === 'crop') enterCrop(); if (S.tool === 'tilt') enterTilt();
    resetViewIfNeeded(); refreshPanel(); req(true); flash('Alles teruggezet (je kunt dit ongedaan maken)');
  }

  /* ---------- foto laden ---------- */
  function loadFile(file, maxSide) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file); urls.add(url);
      const im = new Image();
      const done = () => { urls.delete(url); URL.revokeObjectURL(url); };
      im.onload = () => {
        try {
          const w = im.naturalWidth, h = im.naturalHeight; if (!w || !h) throw new Error('leeg');
          const k = Math.min(1, maxSide / Math.max(w, h)), c = mk(w * k, h * k), x = c.getContext('2d');
          x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, c.width, c.height); done(); res(c);
        } catch (e) { done(); rej(e); }
      };
      im.onerror = () => { done(); rej(new Error('Deze foto kon niet geladen worden.')); };
      im.src = url;
    });
  }
  const isImg = (f) => f && (/^image\//.test(f.type) || /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp)$/i.test(f.name || ''));
  async function openFiles(files) {
    const list = Array.from(files || []).filter(isImg);
    if (!list.length) { flash('Dat is geen foto. Kies een plaatje (jpg, png, heic…).'); return; }
    S.queue = list.slice(1);
    await openOne(list[0]);
  }
  async function openOne(file) {
    flash('Foto laden…');
    try {
      const c = await loadFile(file, MAXSIDE); if (!alive) return;
      S.name = (file.name || 'foto').replace(/\.[^.]+$/, '') || 'foto';
      openCanvas(c);
    } catch (e) { flash(e && e.message ? e.message : 'Laden mislukt.'); }
  }
  function openCanvas(c) {
    S.orig = c; S.base = c; S.owned = false; S.adj = { ...NOADJ }; S.filt = { id: 'none', s: 100 }; S.frame = { id: 'none', color: '#ffffff', thick: 40 };
    S.layers = []; S.strokes = []; S.sel = null; S.pend = null; S.hist = []; S.hi = -1; S.view = { z: 1, px: 0, py: 0 }; lastDims = '';
    T.filt.map.clear(); T.filt.ver = -1; T.pop.pick = null; T.dbl.ov = null; T.crop.ang = 0; T.crop.ratio = 'free';
    free(P.cv); P = { key: '', cv: null }; rebuildSmall(); S.bver++; commit(); lastDims = c.width + 'x' + c.height;
    buildShell(); setTool(S.tool === 'save' ? 'adj' : S.tool || 'adj');
  }

  /* ---------- scherm: start & shell ---------- */
  const tipsHtml = `<ul class="fe-tips"><li>🤏 Knijp met twee vingers (of scroll met de muis) om in te zoomen; sleep om te schuiven.</li><li>👁 Houd <b>Vergelijk</b> ingedrukt om het origineel te zien.</li><li>🫧 Gebruik <b>Vervagen</b> om gezichten of nummerborden onherkenbaar te maken.</li><li>↔️ Bij tekst en stickers: sleep de hoek om te schalen én te draaien.</li><li>↶ Je kunt 20 stappen ongedaan maken (Ctrl/⌘+Z).</li><li>🔒 Je foto blijft op je eigen toestel en wordt nergens geüpload.</li></ul>`;
  function showStart(extra) {
    teardownShell();
    view.innerHTML = `<div class="fe-wrap"><div class="fe-drop" id="fe-drop"><div class="fe-big">🖼️</div><h2 style="margin:.3rem 0">Foto bewerken</h2>
      <p class="fe-hint" style="font-size:.95rem">Snij bij, maak kleuren mooier, voeg filters, tekst en stickers toe.</p>
      <p><button class="fe-b pri" id="fe-pick" style="font-size:1.05rem;padding:.7rem 1.2rem">📷 Kies een foto</button></p>
      <p class="fe-hint">Je kunt een foto ook hierheen slepen of plakken (Ctrl/⌘+V).</p><p class="fe-hint" id="fe-smsg">${extra || ''}</p></div>${tipsHtml}
      <input type="file" id="fe-file" accept="image/*" multiple hidden></div>`;
    fileIn = view.querySelector('#fe-file');
    fileIn.onchange = () => { const f = fileIn.files; if (f && f.length) openFiles(f); fileIn.value = ''; };
    view.querySelector('#fe-pick').onclick = () => fileIn.click();
  }
  function flash(t) {
    const m = view.querySelector('#fe-smsg'); if (m) m.textContent = t;
    if (msgEl) { msgEl.textContent = t; msgEl.style.display = 'block'; clearTimeout(flash.t); flash.t = setTimeout(() => { if (msgEl) msgEl.style.display = 'none'; }, 2600); timers.add(flash.t); }
  }
  const TOOLBAR = [['crop', '✂️', 'Bijsnijden'], ['adj', '🌤️', 'Licht'], ['filt', '🎞️', 'Filters'], ['draw', '🖍️', 'Tekenen'], ['text', '🔤', 'Tekst'], ['stk', '😀', 'Stickers'], ['frame', '🖼️', 'Frames'], ['brush', '🫧', 'Vervagen'], ['pop', '🎯', 'Kleur-pop'], ['dbl', '🌗', 'Dubbel'], ['tilt', '📐', 'Tilt-shift'], ['save', '💾', 'Bewaren']];
  function buildShell() {
    teardownShell();
    view.innerHTML = `<div class="fe-wrap">
      <div class="fe-top"><button class="fe-b" data-top="undo" aria-label="Ongedaan maken">↶</button><button class="fe-b" data-top="redo" aria-label="Opnieuw">↷</button>
        <button class="fe-b" data-top="cmp" style="touch-action:none">👁 Vergelijk</button><button class="fe-b" data-top="reset">↺ Alles terugzetten</button><button class="fe-b" data-top="new">📷 Andere foto</button></div>
      <div class="fe-stage" id="fe-stage"><canvas id="fe-cv" aria-label="Foto"></canvas><div class="fe-msg" id="fe-msg"></div>
        <div class="fe-zoom"><button class="fe-b" data-top="zm" aria-label="Uitzoomen">−</button><button class="fe-b" data-top="zp" aria-label="Inzoomen">＋</button><button class="fe-b" data-top="zf" aria-label="Passend">⤢</button></div></div>
      <div class="fe-tools" id="fe-tools">${TOOLBAR.map((t) => `<button class="fe-b fe-t" data-tool="${t[0]}"><i>${t[1]}</i>${t[2]}</button>`).join('')}</div>
      <div class="fe-panel" id="fe-panel"></div>${tipsHtml}
      <input type="file" id="fe-file" accept="image/*" multiple hidden><input type="file" id="fe-ov" accept="image/*" hidden></div>`;
    cv = view.querySelector('#fe-cv'); sctx = cv.getContext('2d'); panel = view.querySelector('#fe-panel'); msgEl = view.querySelector('#fe-msg');
    fileIn = view.querySelector('#fe-file'); ovIn = view.querySelector('#fe-ov');
    fileIn.onchange = () => { const f = fileIn.files; if (f && f.length) openFiles(f); fileIn.value = ''; };
    ovIn.onchange = async () => {
      const f = ovIn.files && ovIn.files[0]; ovIn.value = ''; if (!isImg(f)) return;
      try { const c = await loadFile(f, 1400); if (!alive) return; free(T.dbl.ov); T.dbl.ov = c; ovId++; T.dbl.ox = 0; T.dbl.oy = 0; T.dbl.scale = 100; syncDbl(); refreshPanel(); req(true); } catch (e) { flash(e.message); }
    };
    // bovenbalk
    view.querySelectorAll('[data-top]').forEach((b) => {
      const k = b.dataset.top;
      if (k === 'cmp') {
        const on = (e) => { e.preventDefault(); S.comparing = true; req(false); }, off = () => { if (S.comparing) { S.comparing = false; req(false); } };
        b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
        b.addEventListener('contextmenu', (e) => e.preventDefault());
        return;
      }
      b.onclick = () => {
        if (k === 'undo') undo(); else if (k === 'redo') redo(); else if (k === 'reset') resetAll();
        else if (k === 'zp') zoomBy(1.4); else if (k === 'zm') zoomBy(1 / 1.4); else if (k === 'zf') { S.view = { z: 1, px: 0, py: 0 }; req(false); }
        else if (k === 'new') arm(b, 'Zeker? Tik nogmaals', () => showStart());
      };
    });
    view.querySelectorAll('[data-tool]').forEach((b) => { b.onclick = () => setTool(b.dataset.tool); });
    // paneel (delegatie)
    const disp = (type) => (e) => {
      const el = e.target.closest ? e.target.closest('[data-a]') : null; if (!el || !panel.contains(el)) return;
      if (type === 'click' && el.tagName === 'INPUT') return;
      if (type === 'input' && el.type === 'range') { const b = el.parentNode.querySelector('b'); if (b) b.textContent = el.value + (el.dataset.u || ''); }
      const tl = TOOLS[S.tool]; if (tl && tl.act) tl.act(el.dataset.a, el, type, e);
    };
    panel.addEventListener('click', disp('click')); panel.addEventListener('input', disp('input')); panel.addEventListener('change', disp('change'));
    // canvas
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('pointerleave', () => { if (!ptrs.size) { S.hover = null; req(false); } });
    cv.addEventListener('wheel', onWheel, { passive: false }); cv.addEventListener('contextmenu', (e) => e.preventDefault());
    sizeStage();
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(() => sizeStage()); ro.observe(view.querySelector('#fe-stage')); }
    upUndo();
  }
  function teardownShell() {
    if (ro) { ro.disconnect(); ro = null; }
    if (T.filt.io) { T.filt.io.disconnect(); T.filt.io = null; }
    g = null; ptrs.clear(); cv = null; sctx = null; panel = null; msgEl = null;
  }
  function arm(btn, label, fn) {
    if (btn._armed) { btn._armed = false; fn(); return; }
    const old = btn.textContent; btn._armed = true; btn.textContent = label;
    const t = setTimeout(() => { timers.delete(t); btn._armed = false; btn.textContent = old; }, 3000); timers.add(t);
  }
  function sizeStage() {
    if (!cv) return;
    const r = cv.getBoundingClientRect(); SW = Math.max(50, r.width); SH = Math.max(50, r.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(SW * dpr); cv.height = Math.round(SH * dpr); req(false);
  }

  /* ---------- render-loop ---------- */
  function req(comp) {
    if (comp) dirtyComp = true;
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; frame(); });
  }
  function frame() {
    if (!alive || !cv || !S.base) return;
    if (dirtyComp || !S.comp) { dirtyComp = false; try { buildComp(); } catch (e) { flash('Bewerken mislukte: ' + (e && e.message)); } }
    drawStage();
  }
  function curBox() {
    const c = S.comp, b0 = fitBox(SW, SH, c.width, c.height, { z: S.view.z, px: 0, py: 0 });
    S.view = clampView(S.view, SW, SH, b0.w, b0.h);
    return fitBox(SW, SH, c.width, c.height, S.view);
  }
  function u2s(ux, uy) { const m = S.map, b = S.box, f = b.w / m.cw; return [b.x + (m.ox + ux * m.k) * f, b.y + (m.oy + uy * m.k) * f]; }
  function s2u(sx, sy) { const m = S.map, b = S.box, f = m.cw / b.w; return { x: ((sx - b.x) * f - m.ox) / m.k, y: ((sy - b.y) * f - m.oy) / m.k }; }
  const U = () => S.map.k / S.map.cw * S.box.w; // schermpixels per eenheid
  function drawStage() {
    const c = sctx; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, SW, SH);
    if (!S.comp) return;
    const box = S.box = curBox();
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    if (S.comparing) {
      const o = S.orig, k = Math.min(box.w / o.width, box.h / o.height), w = o.width * k, h = o.height * k;
      c.drawImage(o, box.x + (box.w - w) / 2, box.y + (box.h - h) / 2, w, h); label(c, 'Origineel'); return;
    }
    if (S.tool === 'crop') {
      c.save(); c.beginPath(); c.rect(box.x, box.y, box.w, box.h); c.clip();
      const s = coverScale(T.crop.ang, box.w, box.h);
      c.translate(box.x + box.w / 2, box.y + box.h / 2); c.rotate(T.crop.ang * Math.PI / 180); c.scale(s, s); c.drawImage(S.comp, -box.w / 2, -box.h / 2, box.w, box.h); c.restore();
      drawCropOverlay(c, box);
    } else {
      c.drawImage(S.comp, box.x, box.y, box.w, box.h);
      c.strokeStyle = 'rgba(128,128,128,.35)'; c.lineWidth = 1; c.strokeRect(box.x - .5, box.y - .5, box.w + 1, box.h + 1);
      overlays(c);
    }
  }
  function label(c, t) { c.font = '600 13px sans-serif'; c.fillStyle = 'rgba(0,0,0,.6)'; const w = c.measureText(t).width + 16; c.fillRect(SW - w - 8, 8, w, 24); c.fillStyle = '#fff'; c.fillText(t, SW - w, 25); }

  /* ---------- gereedschap-overlays ---------- */
  function layerGeom(L) {
    const sz = layerSize(L), u = U(), c = u2s(L.x, L.y), hw = sz.w * u / 2 + 6, hh = sz.h * u / 2 + 6, ca = Math.cos(L.rot || 0), sa = Math.sin(L.rot || 0);
    const pt = (x, y) => [c[0] + x * ca - y * sa, c[1] + x * sa + y * ca];
    return { c, hw, hh, ca, sa, pt, del: pt(-hw, -hh), scl: pt(hw, hh) };
  }
  function overlays(c) {
    const t = S.tool;
    if ((t === 'text' || t === 'stk') && S.sel != null) {
      const L = selLayer(); if (!L) return;
      const gm = layerGeom(L);
      c.save(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); [[-gm.hw, -gm.hh], [gm.hw, -gm.hh], [gm.hw, gm.hh], [-gm.hw, gm.hh]].forEach((q, i) => { const p = gm.pt(q[0], q[1]); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); c.stroke();
      c.strokeStyle = '#3b82f6'; c.lineWidth = 1.5; c.setLineDash([6, 4]); c.stroke(); c.setLineDash([]);
      [[gm.del, '✕', '#ef4444'], [gm.scl, '⤡', '#3b82f6']].forEach((h) => { c.beginPath(); c.arc(h[0][0], h[0][1], 14, 0, TAU); c.fillStyle = h[2]; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#fff'; c.font = '700 14px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(h[1], h[0][0], h[0][1] + 1); });
      c.restore();
    } else if ((t === 'draw' || t === 'brush') && S.hover) {
      const r = t === 'draw' ? T.draw.size * (T.draw.k === 'pen' ? 1 : T.draw.k === 'marker' ? 2 : 2.5) / 1000 / 2 : T.brush.size / 200;
      const rad = Math.max(2, r * U());
      c.save(); c.beginPath(); c.arc(S.hover.x, S.hover.y, rad, 0, TAU); c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke(); c.strokeStyle = '#000'; c.lineWidth = 1; c.stroke(); c.restore();
    } else if (t === 'tilt' && S.pend) {
      const b = S.box, p = T.tilt, cy = b.y + p.cy * b.h, half = p.size * b.h / 2;
      c.save(); c.beginPath(); c.rect(b.x, b.y, b.w, b.h); c.clip(); c.translate(b.x + b.w / 2, cy); c.rotate(p.angle * Math.PI / 180);
      c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 2; c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 3;
      if (p.mode === 'radial') { c.beginPath(); c.ellipse(0, 0, Math.max(10, half * (b.w / b.h)), Math.max(10, half), 0, 0, TAU); c.stroke(); }
      else { const L = b.w + b.h; c.beginPath(); c.moveTo(-L, -half); c.lineTo(L, -half); c.moveTo(-L, half); c.lineTo(L, half); c.stroke(); }
      c.restore();
    }
  }
  const HND = 26;
  function cropScreen() { const b = S.box, k = b.w / S.base.width, r = T.crop.rect; return { x: b.x + r.x * k, y: b.y + r.y * k, w: r.w * k, h: r.h * k, k }; }
  function drawCropOverlay(c, b) {
    const r = cropScreen();
    c.fillStyle = 'rgba(0,0,0,.55)';
    c.fillRect(b.x, b.y, b.w, r.y - b.y); c.fillRect(b.x, r.y + r.h, b.w, b.y + b.h - r.y - r.h); c.fillRect(b.x, r.y, r.x - b.x, r.h); c.fillRect(r.x + r.w, r.y, b.x + b.w - r.x - r.w, r.h);
    c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(r.x, r.y, r.w, r.h);
    c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,.45)'; c.beginPath();
    for (let i = 1; i < 3; i++) { c.moveTo(r.x + r.w * i / 3, r.y); c.lineTo(r.x + r.w * i / 3, r.y + r.h); c.moveTo(r.x, r.y + r.h * i / 3); c.lineTo(r.x + r.w, r.y + r.h * i / 3); }
    c.stroke(); c.fillStyle = '#fff';
    cropHandles(r).forEach((h) => { c.fillRect(h.x - 7, h.y - 7, 14, 14); });
  }
  function cropHandles(r) {
    const hs = [{ id: 'nw', x: r.x, y: r.y }, { id: 'ne', x: r.x + r.w, y: r.y }, { id: 'sw', x: r.x, y: r.y + r.h }, { id: 'se', x: r.x + r.w, y: r.y + r.h }];
    if (!ratioValue(T.crop.ratio, S.base.width, S.base.height)) hs.push({ id: 'n', x: r.x + r.w / 2, y: r.y }, { id: 's', x: r.x + r.w / 2, y: r.y + r.h }, { id: 'w', x: r.x, y: r.y + r.h / 2 }, { id: 'e', x: r.x + r.w, y: r.y + r.h / 2 });
    return hs;
  }

  /* ---------- aanwijzer ---------- */
  const posOf = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  function onDown(e) {
    if (!S.base || !S.comp || S.comparing) return;
    if (e.pointerType === 'mouse' && e.button > 1) return;
    const p = posOf(e); ptrs.set(e.pointerId, p);
    try { cv.setPointerCapture(e.pointerId); } catch (_) { /* ok */ }
    if (ptrs.size === 2) { endG(); startPinch(); }
    else if (ptrs.size === 1) { S.box = curBox(); startSingle(p, e.pointerType === 'mouse' && e.button === 1); }
    e.preventDefault();
  }
  function onMove(e) {
    const p = posOf(e);
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, p);
    else { if (e.pointerType === 'mouse' && (S.tool === 'draw' || S.tool === 'brush')) { S.hover = p; req(false); } return; }
    if (S.tool === 'draw' || S.tool === 'brush') S.hover = p;
    if (!g || !S.box) return;
    if (g.type === 'pinch') movePinch(); else moveSingle(p);
    e.preventDefault();
  }
  function onUp(e) {
    if (!ptrs.has(e.pointerId)) return;
    const p = posOf(e); ptrs.delete(e.pointerId);
    if (g && g.type === 'pinch') { if (ptrs.size < 2) { endG(); } return; }
    if (g && g.type === 'poptap' && !g.moved) pickColor(p);
    endG();
    if (e.pointerType !== 'mouse') { S.hover = null; req(false); }
  }
  function onWheel(e) {
    if (!S.comp) return; e.preventDefault();
    const p = posOf(e); S.box = curBox();
    zoomAt(p.x, p.y, S.view.z * Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0016)));
  }
  function zoomAt(sx, sy, z) {
    const b = curBox(), fx_ = (sx - b.x) / b.w, fy = (sy - b.y) / b.h; setViewFrac(clamp(z, 1, 10), fx_, fy, sx, sy);
  }
  function setViewFrac(z, fx_, fy, sx, sy) {
    const nb = fitBox(SW, SH, S.comp.width, S.comp.height, { z, px: 0, py: 0 });
    S.view = clampView({ z, px: sx - fx_ * nb.w - nb.x, py: sy - fy * nb.h - nb.y }, SW, SH, nb.w, nb.h); req(false);
  }
  function zoomBy(f) { if (!S.comp) return; zoomAt(SW / 2, SH / 2, S.view.z * f); }
  function startPan(p) { g = { type: 'pan', s: p, v0: { ...S.view } }; }
  function selLayer() { return S.layers.find((l) => l.id === S.sel) || null; }
  function startSingle(p, mid) {
    const t = S.tool;
    if (mid) { startPan(p); return; }
    if (t === 'crop') {
      const r = cropScreen(), hit = cropHandles(r).find((h) => Math.hypot(h.x - p.x, h.y - p.y) < HND);
      const px = (p.x - S.box.x) / r.k, py = (p.y - S.box.y) / r.k;
      if (hit) g = { type: 'crop', mode: hit.id, r0: { ...T.crop.rect } };
      else if (p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h) g = { type: 'crop', mode: 'move', r0: { ...T.crop.rect }, s: { x: px, y: py } };
      else startPan(p);
    } else if (t === 'draw') {
      const u = s2u(p.x, p.y), d = T.draw, w = (d.k === 'pen' ? d.size : d.k === 'marker' ? d.size * 2 : d.size * 2.5) / 1000;
      const st = { k: d.k, c: d.color, w, p: [r4(u.x), r4(u.y)] }; S.strokes.push(st); g = { type: 'draw', st }; req(true);
    } else if (t === 'brush') {
      mutableBase(); S.pend = null; const u = s2u(p.x, p.y); g = { type: 'brush', last: u }; stamp(u.x, u.y); req(true);
    } else if (t === 'text' || t === 'stk') {
      const L = selLayer();
      if (L) {
        const gm = layerGeom(L);
        if (Math.hypot(gm.del[0] - p.x, gm.del[1] - p.y) < 20) { removeLayer(L.id); return; }
        if (Math.hypot(gm.scl[0] - p.x, gm.scl[1] - p.y) < 22) { g = { type: 'lscale', L, c: gm.c, d0: Math.hypot(p.x - gm.c[0], p.y - gm.c[1]) || 1, a0: Math.atan2(p.y - gm.c[1], p.x - gm.c[0]), s0: L.size, r0: L.rot || 0, moved: false }; return; }
      }
      const hit = hitLayer(p);
      if (hit) { if (S.sel !== hit.id) { S.sel = hit.id; syncTextFrom(hit); refreshPanel(); } g = { type: 'lmove', L: hit, last: p, moved: false }; req(false); }
      else { if (S.sel != null) { S.sel = null; refreshPanel(); req(false); } startPan(p); }
    } else if (t === 'pop') { g = { type: 'poptap', s: p, moved: false, v0: { ...S.view } };
    } else if (t === 'tilt' && S.pend) { g = { type: 'tilt' }; moveSingle(p);
    } else if (t === 'dbl' && S.pend) { g = { type: 'dbl', last: p };
    } else startPan(p);
  }
  function moveSingle(p) {
    const b = S.box;
    switch (g.type) {
      case 'pan': S.view = clampView({ z: g.v0.z, px: g.v0.px + p.x - g.s.x, py: g.v0.py + p.y - g.s.y }, SW, SH, b.w, b.h); req(false); break;
      case 'poptap': if (Math.hypot(p.x - g.s.x, p.y - g.s.y) > 8) { g.moved = true; g.type = 'pan'; } break;
      case 'crop': {
        const k = b.w / S.base.width, px = (p.x - b.x) / k, py = (p.y - b.y) / k, bw = S.base.width, bh = S.base.height, rv = ratioValue(T.crop.ratio, bw, bh);
        if (g.mode === 'move') T.crop.rect = moveRect(g.r0, px - g.s.x, py - g.s.y, bw, bh);
        else if (g.mode.length === 2) T.crop.rect = dragCorner(g.r0, g.mode, px, py, rv, bw, bh);
        else T.crop.rect = dragEdge(g.r0, g.mode, px, py, bw, bh);
        req(false); break;
      }
      case 'draw': {
        const u = s2u(p.x, p.y), a = g.st.p, lx = a[a.length - 2], ly = a[a.length - 1];
        if (Math.hypot(u.x - lx, u.y - ly) > 0.0012) { a.push(r4(u.x), r4(u.y)); req(true); } break;
      }
      case 'brush': {
        const u = s2u(p.x, p.y), r = T.brush.size / 200, d = Math.hypot(u.x - g.last.x, u.y - g.last.y), step = Math.max(r * .35, .002), n = Math.max(1, Math.ceil(d / step));
        for (let i = 1; i <= n; i++) stamp(g.last.x + (u.x - g.last.x) * i / n, g.last.y + (u.y - g.last.y) * i / n);
        g.last = u; S.bver++; req(true); break;
      }
      case 'lmove': {
        const f = 1 / U(); g.L.x = r4(clamp(g.L.x + (p.x - g.last.x) * f, 0, S.base.width / S.base.width)); g.L.y = r4(clamp(g.L.y + (p.y - g.last.y) * f, 0, S.base.height / S.base.width));
        g.last = p; g.moved = true; req(true); break;
      }
      case 'lscale': {
        const d = Math.hypot(p.x - g.c[0], p.y - g.c[1]), a = Math.atan2(p.y - g.c[1], p.x - g.c[0]);
        g.L.size = clamp(g.s0 * d / g.d0, g.L.type === 'text' ? .02 : .04, g.L.type === 'text' ? .5 : 1.6); g.L.rot = g.r0 + (a - g.a0); g.moved = true; req(true); break;
      }
      case 'tilt': { const u = s2u(p.x, p.y); T.tilt.cy = clamp(u.y / (S.base.height / S.base.width), 0, 1); syncTilt(); req(true); break; }
      case 'dbl': {
        const sm = S.small, f = sm.width / b.w, ov = T.dbl.ov;
        const s = Math.max(sm.width / ov.width, sm.height / ov.height) * T.dbl.scale / 100, dw = ov.width * s, dh = ov.height * s;
        T.dbl.ox = overlayOffset(T.dbl.ox, sm.width, dw, (p.x - g.last.x) * f); T.dbl.oy = overlayOffset(T.dbl.oy, sm.height, dh, (p.y - g.last.y) * f);
        g.last = p; syncDbl(); req(true); break;
      }
      default: break;
    }
  }
  function endG() {
    if (!g) return;
    const t = g.type; const cur = g; g = null;
    if (t === 'pinch') { if (cur.L && cur.moved) commit(); return; }
    if (t === 'draw') { if (cur.st.p.length < 2) S.strokes.pop(); commit(); req(true); }
    else if (t === 'brush') { S.bver++; commit(); req(true); }
    else if ((t === 'lmove' || t === 'lscale') && cur.moved) { commit(); }
    else if (t === 'tilt' || t === 'dbl') { /* pending, geen stap */ }
  }
  function startPinch() {
    const pts = Array.from(ptrs.values()); if (pts.length < 2) return;
    const m = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }, d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1, a = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
    const L = (S.tool === 'text' || S.tool === 'stk') ? selLayer() : null;
    S.box = curBox();
    if (L) g = { type: 'pinch', L, m0: m, d0: d, a0: a, s0: L.size, r0: L.rot || 0, x0: L.x, y0: L.y, moved: false };
    else { const b = S.box; g = { type: 'pinch', m0: m, d0: d, v0: { ...S.view }, fx: (m.x - b.x) / b.w, fy: (m.y - b.y) / b.h, z0: S.view.z }; }
  }
  function movePinch() {
    const pts = Array.from(ptrs.values()); if (pts.length < 2) return;
    const m = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }, d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1, a = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
    if (g.L) {
      const L = g.L, f = 1 / U();
      L.size = clamp(g.s0 * d / g.d0, L.type === 'text' ? .02 : .04, L.type === 'text' ? .5 : 1.6); L.rot = g.r0 + (a - g.a0);
      L.x = r4(g.x0 + (m.x - g.m0.x) * f); L.y = r4(g.y0 + (m.y - g.m0.y) * f); g.moved = true; req(true);
    } else setViewFrac(clamp(g.z0 * d / g.d0, 1, 10), g.fx, g.fy, m.x, m.y);
  }

  /* ---------- lagen ---------- */
  function hitLayer(p) {
    for (let i = S.layers.length - 1; i >= 0; i--) {
      const L = S.layers[i], sz = layerSize(L), u = U(), c = u2s(L.x, L.y), dx = p.x - c[0], dy = p.y - c[1], ca = Math.cos(-(L.rot || 0)), sa = Math.sin(-(L.rot || 0));
      const lx = dx * ca - dy * sa, ly = dx * sa + dy * ca;
      if (Math.abs(lx) <= sz.w * u / 2 + 8 && Math.abs(ly) <= sz.h * u / 2 + 8) return L;
    }
    return null;
  }
  function addLayer(L) {
    const n = S.layers.length; L.id = nid++; L.x = r4(.5 + (n % 5) * .02); L.y = r4(S.base.height / S.base.width / 2 + (n % 5) * .02); L.rot = 0;
    S.layers.push(L); S.sel = L.id; commit(); refreshPanel(); req(true);
  }
  function removeLayer(id) { S.layers = S.layers.filter((l) => l.id !== id); S.sel = null; commit(); refreshPanel(); req(true); }
  function syncTextFrom(L) { if (L.type !== 'text') return; ['text', 'font', 'color', 'align', 'bold', 'italic', 'shadow', 'stroke', 'strokeColor', 'bg', 'bgColor'].forEach((k) => { T.text[k] = L[k]; }); T.text.size = Math.round(L.size * 100); }

  /* ---------- brush / kleur-pop / tilt / dubbel ---------- */
  function stamp(ux, uy) {
    const b = S.base, targets = S.small !== b ? [b, S.small] : [b];
    targets.forEach((t) => {
      const x = ux * t.width, y = uy * t.width, r = Math.max(2, T.brush.size / 200 * t.width);
      if (T.brush.mode === 'blur') FX.blurBrush(t, x, y, r, T.brush.strength / 100);
      else FX.pixelateBrush(t, x, y, r, Math.max(3, Math.round(t.width * (.004 + .0004 * T.brush.strength))));
    });
  }
  function pickColor(p) {
    const u = s2u(p.x, p.y), sm = S.small;
    if (u.x < 0 || u.y < 0 || u.x > 1 || u.y * sm.width > sm.height) return;
    let hs; try { hs = FX.hueAt(sm, Math.round(u.x * (sm.width - 1)), Math.round(u.y * (sm.width - 1))); } catch (e) { flash('Kleur kiezen mislukte.'); return; }
    T.pop.pick = hs; syncPop(); refreshPanel(); req(true);
  }
  function syncPop() { S.pend = T.pop.pick ? { type: 'pop', h: T.pop.pick.h, tol: T.pop.tol, soft: T.pop.soft } : null; }
  function syncTilt() { S.pend = { type: 'tilt', mode: T.tilt.mode, cy: T.tilt.cy, size: T.tilt.size, blur: T.tilt.blur, angle: T.tilt.angle, sat: T.tilt.sat }; }
  function syncDbl() { S.pend = T.dbl.ov ? { type: 'dbl', mode: T.dbl.mode, opacity: T.dbl.opacity, scale: T.dbl.scale, ox: T.dbl.ox, oy: T.dbl.oy } : null; }
  function applyPending() {
    if (!S.pend) return;
    try {
      const b = mutableBase(); S.base = runPend(b, S.pend); S.owned = true;
    } catch (e) { flash('Toepassen mislukte: ' + (e && e.message)); return; }
    S.pend = null; rebuildSmall(); S.bver++; commit(); refreshPanel(); req(true); flash('Toegepast ✓');
  }
  function cancelPending() { S.pend = null; if (S.tool === 'pop') T.pop.pick = null; if (S.tool === 'dbl') T.dbl.ov = null; refreshPanel(); req(true); }

  /* ---------- bijsnijden & draaien ---------- */
  function enterCrop() { T.crop.rect = { x: 0, y: 0, w: S.base.width, h: S.base.height }; T.crop.ratio = 'free'; T.crop.ang = 0; }
  function bakeGeom(kind) {
    flash('Bezig…');
    const b = mutableBase(), W = b.width, H = b.height; let nc, f, rot = 0, refl = false;
    if (kind === 'rr' || kind === 'rl') {
      nc = mk(H, W); const c = nc.getContext('2d');
      if (kind === 'rr') { c.translate(H, 0); c.rotate(Math.PI / 2); f = (x, y) => [H - y, x]; rot = Math.PI / 2; }
      else { c.translate(0, W); c.rotate(-Math.PI / 2); f = (x, y) => [y, W - x]; rot = -Math.PI / 2; }
      c.drawImage(b, 0, 0);
    } else {
      nc = mk(W, H); const c = nc.getContext('2d'); refl = true;
      if (kind === 'fh') { c.translate(W, 0); c.scale(-1, 1); f = (x, y) => [W - x, y]; T.crop.ang = -T.crop.ang; }
      else { c.translate(0, H); c.scale(1, -1); f = (x, y) => [x, H - y]; T.crop.ang = -T.crop.ang; }
      c.drawImage(b, 0, 0);
    }
    const st = transformLayers({ layers: S.layers, strokes: S.strokes }, { f, k: 1, rot, refl, oldW: W, newW: nc.width });
    S.layers = st.layers; S.strokes = st.strokes; S.base = nc; S.owned = true;
    rebuildSmall(); S.bver++; commit(); enterCropKeepAng(); resetViewIfNeeded(); refreshPanel(); req(true);
  }
  function enterCropKeepAng() { const a = T.crop.ang; enterCrop(); T.crop.ang = a; }
  function applyCrop() {
    const r = T.crop.rect, ang = T.crop.ang, W = S.base.width, H = S.base.height;
    const full = r.x < 1 && r.y < 1 && r.w > W - 2 && r.h > H - 2;
    if (full && !ang) { flash('Sleep eerst de rand van het kader.'); return; }
    flash('Bezig…');
    const s = coverScale(ang, W, H), th = ang * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
    let src = S.base;
    if (ang) { src = mk(W, H); const c = src.getContext('2d'); c.imageSmoothingQuality = 'high'; c.translate(W / 2, H / 2); c.rotate(th); c.scale(s, s); c.drawImage(S.base, -W / 2, -H / 2); }
    const cr = { x: Math.round(r.x), y: Math.round(r.y), w: Math.max(8, Math.round(r.w)), h: Math.max(8, Math.round(r.h)) };
    const nc = mk(cr.w, cr.h); nc.getContext('2d').drawImage(src, -cr.x, -cr.y);
    if (src !== S.base) free(src);
    const f = (x, y) => { const dx = x - W / 2, dy = y - H / 2; return [(dx * cs - dy * sn) * s + W / 2 - cr.x, (dx * sn + dy * cs) * s + H / 2 - cr.y]; };
    const st = transformLayers({ layers: S.layers, strokes: S.strokes }, { f, k: s, rot: th, refl: false, oldW: W, newW: nc.width });
    S.layers = st.layers; S.strokes = st.strokes; S.base = nc; S.owned = true;
    rebuildSmall(); S.bver++; commit(); enterCrop(); resetViewIfNeeded(); refreshPanel(); req(true); flash('Bijgesneden ✓');
  }

  /* ---------- exporteren ---------- */
  function sizeText() {
    const w = S.base.width, h = S.base.height, L = frameLayout(S.frame.id, w, h, S.frame.thick);
    return L.W + ' × ' + L.H + ' px';
  }
  async function exportBlob() {
    const out = renderFull(); let src = out;
    const jpg = T.save.fmt === 'jpg';
    if (jpg) { src = mk(out.width, out.height); const c = src.getContext('2d'); c.fillStyle = '#ffffff'; c.fillRect(0, 0, src.width, src.height); c.drawImage(out, 0, 0); }
    const bl = await new Promise((res) => src.toBlob((b) => res(b), jpg ? 'image/jpeg' : 'image/png', T.save.q / 100));
    if (src !== out) free(src); free(out);
    return bl;
  }
  async function saveOut(share) {
    if (S.busy) return; S.busy = true; flash('Plaatje maken…');
    try {
      const bl = await exportBlob(); if (!bl) { flash('Het plaatje maken lukte niet (te weinig geheugen?).'); return; }
      const ext = T.save.fmt === 'jpg' ? 'jpg' : 'png', nm = S.name + '-bewerkt.' + ext;
      const file = new File([bl], nm, { type: bl.type });
      if (share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file] }); flash('Gedeeld ✓'); return; } catch (e) { if (e && e.name === 'AbortError') { flash(''); return; } }
      }
      const u = URL.createObjectURL(bl); urls.add(u); const a = document.createElement('a'); a.href = u; a.download = nm; document.body.appendChild(a); a.click(); a.remove();
      const t = setTimeout(() => { timers.delete(t); urls.delete(u); URL.revokeObjectURL(u); }, 8000); timers.add(t);
      flash('Opgeslagen als ' + nm + ' ✓ (kijk in je Downloads of Foto\'s)');
    } catch (e) { flash('Opslaan mislukte: ' + (e && e.message)); } finally { S.busy = false; }
  }

  /* ---------- paneel-hulpjes ---------- */
  const esc2 = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const B = (a, label, o) => `<button class="fe-b ${o && o.on ? 'on' : ''} ${o && o.pri ? 'pri' : ''}" data-a="${a}" ${o && o.v != null ? `data-v="${esc2(o.v)}"` : ''} ${o && o.dis ? 'disabled' : ''}>${label}</button>`;
  const R = (a, label, v, min, max, step, unit) => `<label class="fe-r"><span>${label}</span><input type="range" data-a="${a}" data-u="${unit || ''}" min="${min}" max="${max}" step="${step || 1}" value="${v}"><b>${Math.round(v * 100) / 100}${unit || ''}</b></label>`;
  const SW_ = (list, cur, a) => `<div class="fe-sw">${list.map((c) => `<button class="fe-s ${c === cur ? 'on' : ''}" data-a="${a}" data-v="${c}" aria-label="${c}" style="background:${c === 'transparent' ? 'repeating-conic-gradient(#bbb 0 25%,#fff 0 50%) 50%/10px 10px' : c}"></button>`).join('')}<input type="color" class="fe-cc" data-a="${a}c" value="${/^#[0-9a-f]{6}$/i.test(cur) ? cur : '#ffffff'}" aria-label="Eigen kleur"></div>`;
  function refreshPanel() {
    if (!panel) return;
    const tl = TOOLS[S.tool]; panel.innerHTML = tl.html();
    view.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === S.tool));
    if (tl.after) tl.after();
  }
  function setTool(t) {
    if (TOOLS[S.tool] && TOOLS[S.tool].leave) TOOLS[S.tool].leave();
    if (S.tool !== t) S.pend = null;
    S.tool = t; S.sel = null; S.hover = null; g = null; ptrs.clear();
    if (TOOLS[t].enter) TOOLS[t].enter();
    refreshPanel(); req(true);
    const tb = view.querySelector('[data-tool="' + t + '"]'); if (tb && tb.scrollIntoView) { try { tb.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (_) { /* ok */ } }
  }
  function enterTilt() { syncTilt(); }

  /* ---------- tools ---------- */
  const TOOLS = {
    crop: {
      enter: () => { enterCrop(); },
      html: () => `<div class="fe-row">${RATIOS.map((r) => B('ratio', r[1], { v: r[0], on: T.crop.ratio === r[0] })).join('')}</div>
        <div class="fe-row">${B('rl', '⟲ Draai links')}${B('rr', '⟳ Draai rechts')}${B('fh', '⇋ Spiegel')}${B('fv', '⇅ Op de kop')}</div>
        ${R('ang', '📐 Rechtzetten', T.crop.ang, -45, 45, .5, '°')}
        <div class="fe-row">${B('apply', '✔ Toepassen', { pri: 1 })}${B('reset', 'Kader herstellen')}</div>
        <p class="fe-hint">Sleep de hoeken of randen van het kader. Tekst, stickers en tekeningen schuiven mee. Tijdens het bijsnijden zie je ze even niet.</p>`,
      act: (a, el, type) => {
        if (type === 'click') {
          if (a === 'ratio') { T.crop.ratio = el.dataset.v; T.crop.rect = fitCrop(ratioValue(T.crop.ratio, S.base.width, S.base.height), S.base.width, S.base.height); refreshPanel(); req(false); }
          else if (a === 'rl' || a === 'rr' || a === 'fh' || a === 'fv') bakeGeom(a);
          else if (a === 'apply') applyCrop();
          else if (a === 'reset') { enterCrop(); refreshPanel(); req(false); }
        } else if (a === 'ang' && type === 'input') { T.crop.ang = +el.value; req(false); }
      },
    },
    adj: {
      html: () => ADJ_LIST.map((a) => R(a[0], a[1], S.adj[a[0]], -100, 100, 1)).join('') + `<div class="fe-row">${B('reset', 'Nulstellen')}</div><p class="fe-hint">Het voorbeeld past zich meteen aan. Dubbeltik niet nodig: schuif gewoon.</p>`,
      act: (a, el, type) => {
        if (a === 'reset' && type === 'click') { S.adj = { ...NOADJ }; commit(); refreshPanel(); req(true); return; }
        if (!(a in NOADJ)) return;
        if (type === 'input') { S.adj[a] = +el.value; req(true); } else if (type === 'change') commit();
      },
    },
    filt: {
      leave: () => { if (T.filt.io) { T.filt.io.disconnect(); T.filt.io = null; } },
      html: () => {
        if (T.filt.ver !== S.bver) {
          T.filt.map.forEach(free); T.filt.map.clear(); T.filt.ver = S.bver; const sm = S.small, sd = Math.min(sm.width, sm.height), t = mk(80, 80);
          t.getContext('2d').drawImage(sm, (sm.width - sd) / 2, (sm.height - sd) / 2, sd, sd, 0, 0, 80, 80); free(T.filt.base); T.filt.base = t;
        }
        const list = [{ id: 'none', name: 'Origineel', group: 'Geen' }].concat(FX.FILTERS.filter((f) => f.id !== 'none')); let lastG = null, h = '';
        list.forEach((f) => {
          if (f.group !== lastG) { lastG = f.group; h += `<i class="fe-gl">${esc2(f.group || '')}</i>`; }
          h += `<button class="fe-ft ${S.filt.id === f.id ? 'on' : ''}" data-a="flt" data-v="${esc2(f.id)}"><canvas width="68" height="68" data-fid="${esc2(f.id)}"></canvas>${esc2(f.name)}</button>`;
        });
        return `<div class="fe-flt" id="fe-flt">${h}</div>${R('str', 'Sterkte', S.filt.s, 0, 100, 1, '%')}<p class="fe-hint">Er zijn ${list.length - 1} filters. Veeg zijwaarts om ze allemaal te zien.</p>`;
      },
      after: () => {
        const cvs = Array.from(panel.querySelectorAll('canvas[data-fid]'));
        const gen = (el) => {
          if (el._done || !alive || !T.filt.base) return; el._done = true; const id = el.dataset.fid; let tc = T.filt.map.get(id);
          if (!tc) { tc = FX.cloneCanvas(T.filt.base); if (id !== 'none') { try { tc = fx('applyFilter', tc, id, 1); } catch (e) { /* laat origineel zien */ } } T.filt.map.set(id, tc); }
          const x = el.getContext('2d'); x.drawImage(tc, 0, 0, el.width, el.height);
        };
        if (typeof IntersectionObserver !== 'undefined') {
          T.filt.io = new IntersectionObserver((es) => { es.forEach((en) => { if (en.isIntersecting) { const t = setTimeout(() => { timers.delete(t); gen(en.target); }, 0); timers.add(t); T.filt.io && T.filt.io.unobserve(en.target); } }); }, { root: panel.querySelector('#fe-flt'), rootMargin: '0px 200px 0px 200px' });
          cvs.forEach((el) => T.filt.io.observe(el));
        } else {
          let i = 0; const tick = () => { if (!alive || i >= cvs.length) return; gen(cvs[i++]); const t = setTimeout(() => { timers.delete(t); tick(); }, 20); timers.add(t); }; tick();
        }
      },
      act: (a, el, type) => {
        if (a === 'flt' && type === 'click') { S.filt.id = el.dataset.v; panel.querySelectorAll('.fe-ft').forEach((b) => b.classList.toggle('on', b === el)); commit(); req(true); }
        else if (a === 'str') { if (type === 'input') { S.filt.s = +el.value; req(true); } else if (type === 'change') commit(); }
      },
    },
    draw: {
      html: () => { const d = T.draw; return `<div class="fe-row">${B('dk', '🖊️ Pen', { v: 'pen', on: d.k === 'pen' })}${B('dk', '🖍️ Marker', { v: 'marker', on: d.k === 'marker' })}${B('dk', '🧽 Gum', { v: 'eraser', on: d.k === 'eraser' })}${B('dclear', '🗑 Wis tekening', { dis: !S.strokes.length })}</div>
        ${d.k === 'eraser' ? '' : SW_(PAL, d.color, 'dcol')}${R('dsize', 'Dikte', d.size, 2, 80, 1)}<p class="fe-hint">Teken met één vinger. Met twee vingers zoom en schuif je. Je tekening blijft bewerkbaar met de gum.</p>`; },
      act: (a, el, type) => {
        const d = T.draw;
        if (type === 'click') {
          if (a === 'dk') { d.k = el.dataset.v; refreshPanel(); } else if (a === 'dcol') { d.color = el.dataset.v; refreshPanel(); }
          else if (a === 'dclear') { S.strokes = []; commit(); refreshPanel(); req(true); }
        } else if (a === 'dcolc') { d.color = el.value; panel.querySelectorAll('.fe-s').forEach((b) => b.classList.remove('on')); }
        else if (a === 'dsize' && type === 'input') d.size = +el.value;
      },
    },
    text: {
      html: () => {
        const t = T.text, L = selLayer(), isT = L && L.type === 'text';
        return `<textarea class="fe-ta" data-a="txt" maxlength="200" placeholder="Typ hier je tekst…">${esc2(isT ? L.text : t.text)}</textarea>
        <div class="fe-row">${B('tadd', '➕ Tekst toevoegen', { pri: !isT })}${L ? B('ldup', '⧉ Kopie') + B('lfront', '⬆ Naar voren') + B('ldel', '🗑 Weg') : ''}</div>
        <div class="fe-fonts">${FONTS.map((f, i) => `<button class="fe-b ${t.font === i ? 'on' : ''}" data-a="font" data-v="${i}" style="font-family:${f[1].replace(/"/g, "'")}">${f[0]}</button>`).join('')}</div>
        ${SW_(PAL, t.color, 'tcol')}${R('tsize', 'Grootte', t.size, 2, 40, 1, '%')}${L ? R('lrot', 'Draaien', Math.round((L.rot || 0) * 180 / Math.PI), -180, 180, 1, '°') : ''}
        <div class="fe-row">${B('al', '⇤', { v: 'left', on: t.align === 'left' })}${B('al', '↔', { v: 'center', on: t.align === 'center' })}${B('al', '⇥', { v: 'right', on: t.align === 'right' })}${B('bold', '<b>B</b>', { on: t.bold })}${B('italic', '<i>I</i>', { on: t.italic })}${B('shadow', 'Schaduw', { on: t.shadow })}${B('stroke', 'Rand', { on: t.stroke })}${B('bg', 'Balk', { on: t.bg })}</div>
        ${t.stroke ? '<p class="fe-hint">Randkleur</p>' + SW_(PAL, t.strokeColor, 'tscol') : ''}${t.bg ? '<p class="fe-hint">Kleur van de balk</p>' + SW_(PAL, t.bgColor, 'tbcol') : ''}
        <p class="fe-hint">Sleep de tekst om te verplaatsen. Sleep de blauwe hoek of gebruik twee vingers om te schalen en te draaien.</p>`;
      },
      act: (a, el, type) => {
        const t = T.text, L = selLayer(), isT = L && L.type === 'text';
        const set = (k, v, doCommit) => { t[k] = v; if (isT) { L[k] = v; req(true); if (doCommit) commit(); } };
        if (layerAct(a, el, type)) return;
        if (a === 'txt') { t.text = el.value; if (isT) { L.text = el.value; req(true); if (type === 'change') commit(); } return; }
        if (a === 'tsize') { const v = +el.value; t.size = v; if (isT) { L.size = v / 100; req(true); if (type === 'change') commit(); } return; }
        if (a === 'tcolc' || a === 'tscolc' || a === 'tbcolc') { const k = a === 'tcolc' ? 'color' : a === 'tscolc' ? 'strokeColor' : 'bgColor'; if (type === 'input') set(k, el.value); else if (type === 'change' && isT) commit(); return; }
        if (type !== 'click') return;
        if (a === 'tadd') { const v = (t.text || '').trim() || 'Tekst'; t.text = v; addLayer({ type: 'text', text: v, size: t.size / 100, font: t.font, color: t.color, align: t.align, bold: t.bold, italic: t.italic, shadow: t.shadow, stroke: t.stroke, strokeColor: t.strokeColor, bg: t.bg, bgColor: t.bgColor }); }
        else if (a === 'font') { set('font', +el.dataset.v, true); refreshPanel(); }
        else if (a === 'tcol') { set('color', el.dataset.v, true); refreshPanel(); }
        else if (a === 'tscol') { set('strokeColor', el.dataset.v, true); refreshPanel(); }
        else if (a === 'tbcol') { set('bgColor', el.dataset.v, true); refreshPanel(); }
        else if (a === 'al') { set('align', el.dataset.v, true); refreshPanel(); }
        else if (a === 'bold' || a === 'italic' || a === 'shadow' || a === 'stroke' || a === 'bg') { set(a, !t[a], true); refreshPanel(); }
      },
    },
    stk: {
      html: () => {
        const L = selLayer(), tab = T.stk.tab;
        const grid = tab === 'emoji' ? EMOJI.map((e) => `<button class="fe-b" data-a="semo" data-v="${e}">${e}</button>`).join('') : STK_LIST.map((s) => `<button class="fe-b" data-a="sdraw" data-v="${s[0]}" aria-label="${s[1]}" title="${s[1]}"><canvas width="68" height="68" data-sk="${s[0]}"></canvas></button>`).join('');
        return `<div class="fe-row">${B('stab', `😀 Emoji (${EMOJI.length})`, { v: 'emoji', on: tab === 'emoji' })}${B('stab', `🎨 Getekend (${STK_LIST.length})`, { v: 'draw', on: tab === 'draw' })}</div>
        <div class="fe-grid">${grid}</div>
        ${L ? `<div class="fe-row">${B('lflip', '↔ Spiegel')}${B('ldup', '⧉ Kopie')}${B('lfront', '⬆ Naar voren')}${B('ldel', '🗑 Weg')}</div>${R('lsz', 'Grootte', Math.round(L.size * 100), L.type === 'text' ? 2 : 4, L.type === 'text' ? 50 : 160, 1, '%')}${R('lrot', 'Draaien', Math.round((L.rot || 0) * 180 / Math.PI), -180, 180, 1, '°')}` : ''}
        <p class="fe-hint">Tik op een sticker om hem op de foto te zetten. Sleep om te verplaatsen; sleep de blauwe hoek of gebruik twee vingers om te schalen en te draaien.</p>`;
      },
      after: () => { panel.querySelectorAll('canvas[data-sk]').forEach((el) => { const x = el.getContext('2d'); x.translate(34, 34); x.scale(.64, .64); try { STK[el.dataset.sk](x); } catch (e) { /* sla over */ } }); },
      act: (a, el, type) => {
        if (layerAct(a, el, type)) return;
        if (type !== 'click') return;
        if (a === 'stab') { T.stk.tab = el.dataset.v; refreshPanel(); }
        else if (a === 'semo') addLayer({ type: 'emoji', ch: el.dataset.v, size: .22, flip: false });
        else if (a === 'sdraw') addLayer({ type: 'svg', key: el.dataset.v, size: .28, flip: false });
      },
    },
    frame: {
      html: () => {
        const f = S.frame;
        return `<div class="fe-frames">${FRAMES.map((x) => `<button class="fe-b ${f.id === x.id ? 'on' : ''}" data-a="fr" data-v="${x.id}"><i>${x.icon}</i>${x.name}</button>`).join('')}</div>
        ${f.id !== 'none' ? `<p class="fe-hint">Kleur</p>${SW_(['#ffffff', '#111827', '#fdf6e3', '#f5f0e6', '#ffe4ec', '#e5e7eb', '#ef4444', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6', 'transparent'], f.color, 'frc')}${R('frt', 'Dikte', f.thick, 0, 100, 1)}` : ''}
        <p class="fe-hint">Bij “doorzichtig” blijft de rand leeg (bewaar dan als PNG). </p>`;
      },
      act: (a, el, type) => {
        const f = S.frame;
        if (type === 'click') {
          if (a === 'fr') { f.id = el.dataset.v; f.color = FR[f.id].def; commit(); refreshPanel(); req(true); }
          else if (a === 'frc') { f.color = el.dataset.v; commit(); refreshPanel(); req(true); }
        } else if (a === 'frcc') { f.color = el.value; req(true); if (type === 'change') commit(); }
        else if (a === 'frt') { if (type === 'input') { f.thick = +el.value; req(true); } else if (type === 'change') commit(); }
      },
    },
    brush: {
      html: () => { const b = T.brush; return `<div class="fe-row">${B('bm', '🫧 Vervagen', { v: 'blur', on: b.mode === 'blur' })}${B('bm', '🔳 Pixeleren', { v: 'pixel', on: b.mode === 'pixel' })}</div>
        ${R('bsz', 'Penseelgrootte', b.size, 2, 40, 1)}${R('bst', b.mode === 'blur' ? 'Sterkte' : 'Blokgrootte', b.strength, 5, 100, 1)}
        <p class="fe-hint">Veeg over het stuk dat je onherkenbaar wilt maken, bijvoorbeeld een gezicht of nummerbord. Elke veeg is één stap ongedaan te maken.</p>`; },
      act: (a, el, type) => {
        const b = T.brush;
        if (type === 'click' && a === 'bm') { b.mode = el.dataset.v; refreshPanel(); }
        else if (a === 'bsz' && type === 'input') { b.size = +el.value; req(false); }
        else if (a === 'bst' && type === 'input') b.strength = +el.value;
      },
    },
    pop: {
      enter: () => { T.pop.pick = null; S.pend = null; },
      html: () => { const p = T.pop.pick; return `<p class="fe-hint" style="font-size:.95rem">${p ? `Gekozen kleur: <span style="display:inline-block;width:1.2em;height:1.2em;border-radius:50%;vertical-align:middle;border:1px solid var(--line);background:hsl(${Math.round(p.h)},${Math.round((p.s <= 1 ? p.s * 100 : p.s))}%,${Math.round((p.l <= 1 ? p.l * 100 : p.l))}%)"></span> Alles daarbuiten wordt zwart-wit.` : '🎯 Tik op een kleur in de foto. Al het andere wordt zwart-wit.'}</p>
        ${R('ptol', 'Tolerantie', T.pop.tol, 5, 90, 1)}${R('psoft', 'Zachtheid', T.pop.soft, 0, 60, 1)}
        <div class="fe-row">${B('papply', '✔ Toepassen', { pri: 1, dis: !p })}${B('pcancel', 'Andere kleur', { dis: !p })}</div>`; },
      act: (a, el, type) => {
        if (a === 'ptol' || a === 'psoft') { if (type === 'input') { T.pop[a === 'ptol' ? 'tol' : 'soft'] = +el.value; syncPop(); req(true); } }
        else if (type === 'click') { if (a === 'papply') applyPending(); else if (a === 'pcancel') { T.pop.pick = null; S.pend = null; refreshPanel(); req(true); } }
      },
    },
    dbl: {
      enter: () => { syncDbl(); },
      html: () => { const d = T.dbl, has = !!d.ov; return `<div class="fe-row">${B('dpick', has ? '🖼 Andere tweede foto' : '🖼 Kies tweede foto', { pri: !has })}</div>
        ${has ? `<div class="fe-row">${BLENDS.map((m) => B('dmode', m[1], { v: m[0], on: d.mode === m[0] })).join('')}</div>${R('dop', 'Dekking', d.opacity, 0, 100, 1, '%')}${R('dsc', 'Grootte tweede foto', d.scale, 100, 300, 1, '%')}
        <div class="fe-row">${B('dapply', '✔ Toepassen', { pri: 1 })}${B('dcancel', 'Annuleren')}</div><p class="fe-hint">Sleep over de foto om de tweede foto te verschuiven.</p>` : '<p class="fe-hint">Kies een tweede foto; die wordt over de eerste heen gemengd.</p>'}`; },
      act: (a, el, type) => {
        const d = T.dbl;
        if (type === 'click') {
          if (a === 'dpick') ovIn.click(); else if (a === 'dmode') { d.mode = el.dataset.v; syncDbl(); refreshPanel(); req(true); }
          else if (a === 'dapply') applyPending(); else if (a === 'dcancel') cancelPending();
        } else if (type === 'input') { if (a === 'dop') d.opacity = +el.value; else if (a === 'dsc') d.scale = +el.value; else return; syncDbl(); req(true); }
      },
    },
    tilt: {
      enter: () => { syncTilt(); },
      html: () => { const t = T.tilt; return `<div class="fe-row">${B('tm', '↔ Lineair', { v: 'linear', on: t.mode === 'linear' })}${B('tm', '◎ Radiaal', { v: 'radial', on: t.mode === 'radial' })}</div>
        ${R('tsz', 'Scherp gebied', Math.round(t.size * 100), 5, 100, 1, '%')}${R('tbl', 'Vervaging', t.blur, 0, 100, 1)}${t.mode === 'linear' ? R('tan', 'Draaien', t.angle, -90, 90, 1, '°') : ''}${R('tsa', 'Verzadiging +', t.sat, 0, 100, 1)}
        <div class="fe-row">${B('tapply', '✔ Toepassen', { pri: 1 })}${B('tcancel', 'Terugzetten')}</div><p class="fe-hint">Sleep over de foto om het scherpe gebied te verplaatsen.</p>`; },
      act: (a, el, type) => {
        const t = T.tilt;
        if (type === 'click') {
          if (a === 'tm') { t.mode = el.dataset.v; syncTilt(); refreshPanel(); req(true); }
          else if (a === 'tapply') applyPending(); else if (a === 'tcancel') { T.tilt = Object.assign(t, { cy: .5, size: .3, blur: 60, angle: 0, sat: 25 }); syncTilt(); refreshPanel(); req(true); }
        } else if (type === 'input') {
          if (a === 'tsz') t.size = +el.value / 100; else if (a === 'tbl') t.blur = +el.value; else if (a === 'tan') t.angle = +el.value; else if (a === 'tsa') t.sat = +el.value; else return;
          syncTilt(); req(true);
        }
      },
    },
    save: {
      html: () => `<div class="fe-row">${B('fmt', 'JPG', { v: 'jpg', on: T.save.fmt === 'jpg' })}${B('fmt', 'PNG', { v: 'png', on: T.save.fmt === 'png' })}</div>
        ${T.save.fmt === 'jpg' ? R('q', 'Kwaliteit', T.save.q, 40, 100, 1, '%') : ''}
        <p class="fe-hint">Formaat: ${sizeText()}${S.frame.id !== 'none' && T.save.fmt === 'jpg' ? ' · doorzichtige randen worden wit in JPG' : ''}</p>
        <div class="fe-row">${B('share', '📤 Delen', { pri: 1 })}${B('dl', '⬇ Download')}${S.queue.length ? B('next', `➡ Volgende foto (${S.queue.length})`) : ''}</div>
        <p class="fe-hint">Je foto blijft op je eigen toestel.</p>`,
      act: (a, el, type) => {
        if (type === 'click') {
          if (a === 'fmt') { T.save.fmt = el.dataset.v; refreshPanel(); } else if (a === 'share') saveOut(true); else if (a === 'dl') saveOut(false);
          else if (a === 'next' && S.queue.length) { const f = S.queue.shift(); openOne(f); }
        } else if (a === 'q' && type === 'input') T.save.q = +el.value;
      },
    },
  };
  // gedeelde laag-acties (tekst en stickers)
  function layerAct(a, el, type) {
    const L = selLayer();
    if (a === 'lrot') { if (!L) return true; if (type === 'input') { L.rot = +el.value * Math.PI / 180; req(true); } else if (type === 'change') commit(); return true; }
    if (a === 'lsz') { if (!L) return true; if (type === 'input') { L.size = +el.value / 100; req(true); } else if (type === 'change') commit(); return true; }
    if (type !== 'click') return false;
    if (a === 'ldel') { if (L) removeLayer(L.id); return true; }
    if (a === 'ldup') { if (L) { const c = JSON.parse(JSON.stringify(L)); c.id = nid++; c.x = r4(c.x + .04); c.y = r4(c.y + .04); S.layers.push(c); S.sel = c.id; commit(); refreshPanel(); req(true); } return true; }
    if (a === 'lfront') { if (L) { S.layers = S.layers.filter((l) => l !== L); S.layers.push(L); commit(); req(true); } return true; }
    if (a === 'lflip') { if (L && L.type !== 'text') { L.flip = !L.flip; commit(); req(true); } return true; }
    return false;
  }

  /* ---------- toetsen, plakken, slepen ---------- */
  const onKey = (e) => {
    if (!S.base || !cv) return;
    const tg = e.target, tag = tg && tg.tagName; if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel != null) { e.preventDefault(); removeLayer(S.sel); }
    else if (e.key === 'Escape' && S.sel != null) { S.sel = null; refreshPanel(); req(false); }
  };
  const onPaste = (e) => {
    if (!view.querySelector('#fe-drop')) return; const items = e.clipboardData && e.clipboardData.files; if (items && items.length) { const l = Array.from(items).filter(isImg); if (l.length) { e.preventDefault(); openFiles(l); } }
  };
  const onDragOver = (e) => { e.preventDefault(); const d = view.querySelector('#fe-drop'); if (d) d.classList.add('over'); };
  const onDragLeave = () => { const d = view.querySelector('#fe-drop'); if (d) d.classList.remove('over'); };
  const onDrop = (e) => { e.preventDefault(); onDragLeave(); if (view.querySelector('#fe-drop') && e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) openFiles(e.dataTransfer.files); };
  const onResize = () => sizeStage();
  window.addEventListener('keydown', onKey); window.addEventListener('resize', onResize); document.addEventListener('paste', onPaste);
  view.addEventListener('dragover', onDragOver); view.addEventListener('dragleave', onDragLeave); view.addEventListener('drop', onDrop);

  addCleanup(() => {
    alive = false; if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); document.removeEventListener('paste', onPaste);
    view.removeEventListener('dragover', onDragOver); view.removeEventListener('dragleave', onDragLeave); view.removeEventListener('drop', onDrop);
    teardownShell(); timers.forEach((t) => clearTimeout(t)); timers.clear(); urls.forEach((u) => { try { URL.revokeObjectURL(u); } catch (e) { /* ok */ } }); urls.clear();
    cleanups.forEach((f) => { try { f(); } catch (e) { /* ok */ } });
    [S.orig, S.base, S.small, S.compCv, S.strokeCv, P.cv, T.filt.base, T.dbl.ov].forEach(free); T.filt.map.forEach(free); T.filt.map.clear(); S.hist.length = 0;
    style.remove();
  });

  /* ---------- start ---------- */
  view.innerHTML = '<div class="fe-wrap"><p class="fe-hint">Fotobewerker laden…</p></div>';
  if (ctx.__test) Object.assign(ctx.__test, { S, T, TOOLS, setTool, req, frame, openFiles, openCanvas, commit, undo, redo, applyCrop, bakeGeom, saveOut, exportBlob, renderFull, onDown, onMove, onUp, onWheel, getCv: () => cv, getPanel: () => panel });
  import('./foto-filters.js?v=1').then((m) => {
    if (!alive) return;
    if (!m || !m.FILTERS || !m.applyFilter || !m.adjust || !m.cloneCanvas) throw new Error('onvolledige module');
    FX = m;
  }).then(() => { if (alive) showStart(); }, (e) => {
    if (!alive) return;
    fxErr = e && e.message ? e.message : String(e);
    view.innerHTML = `<div class="fe-wrap"><div class="fe-drop"><div class="fe-big">🛠️</div><h2>De fotobibliotheek ontbreekt</h2><p class="fe-hint">Het bestand foto-filters.js kon niet geladen worden (${esc2(fxErr)}). Ververs de pagina of probeer het later nog eens.</p></div></div>`;
  });
}
