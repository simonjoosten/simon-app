// foto-filters.js - pure pixel-bibliotheek voor de foto-editor (geen DOM-UI, geen imports).
// Alles werkt IN PLAATS op een canvas (getImageData/putImageData). De kern staat op
// ImageData-niveau ({width,height,data:Uint8ClampedArray}) zodat het ook in node testbaar is.

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const norm01 = (v) => { v = +v || 0; if (v > 1) v /= 100; return clamp(v, 0, 1); };

function hexRGB(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

// deterministische random (xorshift32)
function rng(seed) {
  let s = (seed | 0) || 123456789;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) / 4294967296); };
}

/* ------------------------------------------------------------------ */
/* Blur (box-blur, meerdere passes ~ gauss). Raakt alpha niet aan.      */
/* ------------------------------------------------------------------ */
function blurAxis(src, dst, w, h, r, horiz) {
  const n = horiz ? w : h, lines = horiz ? h : w;
  const step = horiz ? 4 : w * 4, lineStep = horiz ? w * 4 : 4;
  const inv = 1 / (2 * r + 1);
  for (let l = 0; l < lines; l++) {
    const base = l * lineStep;
    for (let c = 0; c < 3; c++) {
      const b0 = base + c;
      let sum = src[b0] * (r + 1);
      for (let k = 1; k <= r; k++) sum += src[b0 + Math.min(k, n - 1) * step];
      for (let k = 0; k < n; k++) {
        dst[b0 + k * step] = (sum * inv + 0.5) | 0;
        const add = k + r + 1 < n ? k + r + 1 : n - 1;
        const rem = k - r > 0 ? k - r : 0;
        sum += src[b0 + add * step] - src[b0 + rem * step];
      }
    }
  }
}
export function boxBlur(data, w, h, radius, passes = 2) {
  const r = Math.max(1, Math.round(radius));
  const tmp = new Uint8ClampedArray(data.length);
  for (let p = 0; p < passes; p++) {
    blurAxis(data, tmp, w, h, r, true);
    blurAxis(tmp, data, w, h, r, false);
  }
  return data;
}
function blurredCopy(img, radius, passes) {
  const d = img.data.slice();
  boxBlur(d, img.width, img.height, radius, passes);
  return d;
}

/* ------------------------------------------------------------------ */
/* Kleur-hulp                                                           */
/* ------------------------------------------------------------------ */
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, dl = mx - mn;
  let h = 0, s = 0;
  if (dl > 1e-9) {
    s = l > 0.5 ? dl / (2 - mx - mn) : dl / (mx + mn);
    if (mx === r) h = ((g - b) / dl) % 6;
    else if (mx === g) h = (b - r) / dl + 2;
    else h = (r - g) / dl + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return { h, s, l };
}

// Tooncurves per kanaal (LUT's) uit parameters
function toneLUTs(p) {
  const con = p.con == null ? 1 : p.con, br = p.br || 0, gam = p.gam || 1, fade = p.fade || 0, cap = p.cap || 0;
  const crush = p.crush || 0;
  const sh = p.sh || [0, 0, 0], hi = p.hi || [0, 0, 0], gain = p.gain || [1, 1, 1], gr = p.gamRGB || [1, 1, 1];
  const luts = [new Uint8ClampedArray(256), new Uint8ClampedArray(256), new Uint8ClampedArray(256)];
  for (let c = 0; c < 3; c++) {
    for (let i = 0; i < 256; i++) {
      let v = i / 255;
      v = Math.pow(v, 1 / (gam * gr[c]));
      v = (v - 0.5) * con + 0.5 + br;
      v = clamp(v, 0, 1);
      if (crush) v = clamp((v - crush) / (1 - crush), 0, 1);
      v = fade + v * (1 - fade - cap);
      v += sh[c] * (1 - v) * (1 - v) + hi[c] * v * v;
      v *= gain[c];
      luts[c][i] = clamp(v, 0, 1) * 255 + 0.5;
    }
  }
  return luts;
}

// Een pass: (mono) -> LUT -> verzadiging -> vignet -> korrel
function colorPass(img, o) {
  const w = img.width, h = img.height, d = img.data;
  const lut = o.lut, mono = !!o.mono, sat = o.sat == null ? 1 : o.sat;
  const vig = o.vig || 0, grain = o.grain || 0;
  const lr = lut ? lut[0] : null, lg = lut ? lut[1] : null, lb = lut ? lut[2] : null;
  let s = (o.seed || 2463534242) | 0;
  const cx = (w - 1) / 2 || 1, cy = (h - 1) / 2 || 1;
  for (let y = 0; y < h; y++) {
    const dy = (y - cy) / cy;
    for (let x = 0, i = y * w * 4; x < w; x++, i += 4) {
      let r = d[i], g = d[i + 1], b = d[i + 2];
      if (mono) { r = g = b = (0.299 * r + 0.587 * g + 0.114 * b + 0.5) | 0; }
      if (lut) { r = lr[r]; g = lg[g]; b = lb[b]; }
      if (sat !== 1) {
        const l = 0.299 * r + 0.587 * g + 0.114 * b;
        r = l + (r - l) * sat; g = l + (g - l) * sat; b = l + (b - l) * sat;
      }
      if (vig) {
        const dx = (x - cx) / cx;
        const t = clamp(((dx * dx + dy * dy) * 0.5 - 0.12) / 0.88, 0, 1);
        const f = 1 - vig * t * t * (3 - 2 * t);
        r *= f; g *= f; b *= f;
      }
      if (grain) {
        s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
        const n = ((s >>> 0) / 4294967296 - 0.5) * 2 * grain;
        r += n; g += n; b += n;
      }
      d[i] = r; d[i + 1] = g; d[i + 2] = b;
    }
  }
}
function grade(img, p) {
  const needLut = ['con', 'br', 'gam', 'fade', 'cap', 'crush', 'sh', 'hi', 'gain', 'gamRGB'].some((k) => p[k] != null);
  colorPass(img, { lut: needLut ? toneLUTs(p) : null, sat: p.sat, mono: p.mono, vig: p.vig, grain: p.grain, seed: p.seed });
}

function gradLUT(stops) {
  const cs = stops.map((s) => [s[0], ...hexRGB(s[1])]);
  const lut = new Uint8ClampedArray(768);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let k = 0;
    while (k < cs.length - 2 && t > cs[k + 1][0]) k++;
    const a = cs[k], b = cs[k + 1];
    const u = clamp((t - a[0]) / (b[0] - a[0] || 1), 0, 1);
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = a[c + 1] + (b[c + 1] - a[c + 1]) * u;
  }
  return lut;
}
function gradientMap(img, stops, mix = 0, pre) {
  if (pre) grade(img, pre);
  const d = img.data, lut = gradLUT(stops), n = img.width * img.height;
  for (let k = 0, i = 0; k < n; k++, i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const j = ((0.299 * r + 0.587 * g + 0.114 * b + 0.5) | 0) * 3;
    d[i] = lut[j] + (r - lut[j]) * mix;
    d[i + 1] = lut[j + 1] + (g - lut[j + 1]) * mix;
    d[i + 2] = lut[j + 2] + (b - lut[j + 2]) * mix;
  }
}
function lumArray(d, n) {
  const L = new Uint8ClampedArray(n);
  for (let k = 0, i = 0; k < n; k++, i += 4) L[k] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2] + 0.5;
  return L;
}
function blockMean(d, w, h, x0, y0, x1, y1) {
  x1 = Math.min(x1, w); y1 = Math.min(y1, h);
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = y0; y < y1; y++) for (let x = x0, i = (y * w + x0) * 4; x < x1; x++, i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
  return n ? [r / n, g / n, b / n] : [0, 0, 0];
}
function fillBlock(d, w, h, x0, y0, x1, y1, c) {
  x1 = Math.min(x1, w); y1 = Math.min(y1, h);
  for (let y = Math.max(0, y0); y < y1; y++) for (let x = Math.max(0, x0), i = (y * w + Math.max(0, x0)) * 4; x < x1; x++, i += 4) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; }
}

/* ------------------------------------------------------------------ */
/* Unieke filter-algoritmes                                             */
/* ------------------------------------------------------------------ */
function quantize(img, n) {
  const d = img.data, lut = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) lut[i] = Math.round((i / 255) * (n - 1)) / (n - 1) * 255;
  for (let i = 0; i < d.length; i += 4) { d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]]; }
}
function fPosterize(img) { grade(img, { sat: 1.35, con: 1.1 }); quantize(img, 4); }

function fCartoon(img) {
  const w = img.width, h = img.height, d = img.data, n = w * h;
  const rad = Math.round(Math.max(w, h) / 320) + 1;
  boxBlur(d, w, h, rad, 2);
  const L = lumArray(d, n);
  grade(img, { sat: 1.4, con: 1.1 });
  quantize(img, 6);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const k = y * w + x;
      const gx = -L[k - w - 1] - 2 * L[k - 1] - L[k + w - 1] + L[k - w + 1] + 2 * L[k + 1] + L[k + w + 1];
      const gy = -L[k - w - 1] - 2 * L[k - w] - L[k - w + 1] + L[k + w - 1] + 2 * L[k + w] + L[k + w + 1];
      const e = clamp((Math.abs(gx) + Math.abs(gy) - 50) / 70, 0, 1);
      if (e > 0) { const f = 1 - e * 0.92, i = k * 4; d[i] *= f; d[i + 1] *= f; d[i + 2] *= f; }
    }
  }
}

function fSketch(img) {
  const w = img.width, h = img.height, d = img.data, n = w * h;
  const L = lumArray(d, n);
  const inv = new Uint8ClampedArray(n * 4);
  for (let k = 0; k < n; k++) { const v = 255 - L[k]; inv[k * 4] = inv[k * 4 + 1] = inv[k * 4 + 2] = v; inv[k * 4 + 3] = 255; }
  boxBlur(inv, w, h, Math.round(Math.max(w, h) / 120) + 1, 2);
  for (let k = 0, i = 0; k < n; k++, i += 4) {
    let v = L[k] * 255 / (256 - inv[i]);
    v = clamp(v, 0, 255);
    v = Math.pow(v / 255, 1.6) * 255; // donkerder lijnen
    d[i] = v * 0.99 + 2; d[i + 1] = v * 0.97 + 3; d[i + 2] = v * 0.92 + 5; // papiertint
  }
}

function fPixel(img) {
  const w = img.width, h = img.height, d = img.data;
  const bs = Math.max(4, Math.round(Math.max(w, h) / 64));
  for (let y = 0; y < h; y += bs) for (let x = 0; x < w; x += bs) fillBlock(d, w, h, x, y, x + bs, y + bs, blockMean(d, w, h, x, y, x + bs, y + bs));
  grade(img, { sat: 1.25, con: 1.1 });
  quantize(img, 8);
}

function fHalftone(img) {
  const w = img.width, h = img.height, d = img.data;
  const cs = Math.max(6, Math.round(Math.max(w, h) / 80));
  const paper = [250, 246, 234];
  for (let y0 = 0; y0 < h; y0 += cs) {
    for (let x0 = 0; x0 < w; x0 += cs) {
      const x1 = Math.min(x0 + cs, w), y1 = Math.min(y0 + cs, h);
      const m = blockMean(d, w, h, x0, y0, x1, y1);
      const l = (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255;
      const lm = 0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2];
      const ink = [clamp(lm + (m[0] - lm) * 1.5 - 20, 0, 255), clamp(lm + (m[1] - lm) * 1.5 - 20, 0, 255), clamp(lm + (m[2] - lm) * 1.5 - 20, 0, 255)];
      const rad = Math.sqrt(1 - l) * cs * 0.74;
      const cx = x0 + cs / 2, cy = y0 + cs / 2;
      for (let y = y0; y < y1; y++) {
        for (let x = x0, i = (y * w + x0) * 4; x < x1; x++, i += 4) {
          const dist = Math.sqrt((x + 0.5 - cx) * (x + 0.5 - cx) + (y + 0.5 - cy) * (y + 0.5 - cy));
          const cov = clamp(rad - dist + 0.5, 0, 1);
          d[i] = paper[0] + (ink[0] - paper[0]) * cov;
          d[i + 1] = paper[1] + (ink[1] - paper[1]) * cov;
          d[i + 2] = paper[2] + (ink[2] - paper[2]) * cov;
        }
      }
    }
  }
}

function fGlitch(img) {
  const w = img.width, h = img.height, d = img.data, s = d.slice();
  const rnd = rng(777);
  const rowDx = new Int32Array(h);
  const bands = 10 + Math.round(h / 150);
  for (let b = 0; b < bands; b++) {
    const y0 = Math.floor(rnd() * h), bh = 2 + Math.floor(rnd() * h * 0.06), dx = Math.round((rnd() - 0.5) * w * 0.14);
    for (let y = y0; y < Math.min(h, y0 + bh); y++) rowDx[y] = dx;
  }
  const sh = Math.max(2, Math.round(w * 0.012));
  for (let y = 0; y < h; y++) {
    const row = y * w * 4, dx = rowDx[y], extra = dx ? sh : 0;
    for (let x = 0; x < w; x++) {
      const sx = clamp(x + dx, 0, w - 1);
      const xr = clamp(sx + sh + extra, 0, w - 1), xb = clamp(sx - sh - extra, 0, w - 1);
      const i = row + x * 4;
      d[i] = s[row + xr * 4]; d[i + 1] = s[row + sx * 4 + 1]; d[i + 2] = s[row + xb * 4 + 2];
    }
  }
  grade(img, { sat: 1.3, con: 1.15 });
}

function fChromatic(img) {
  const w = img.width, h = img.height, d = img.data, s = d.slice();
  const cx = (w - 1) / 2, cy = (h - 1) / 2, k = 0.022;
  for (let y = 0; y < h; y++) {
    const dy = y - cy;
    const yr = clamp(Math.round(cy + dy * (1 + k)), 0, h - 1), yb = clamp(Math.round(cy + dy * (1 - k)), 0, h - 1);
    for (let x = 0, i = y * w * 4; x < w; x++, i += 4) {
      const dx = x - cx;
      const xr = clamp(Math.round(cx + dx * (1 + k)), 0, w - 1), xb = clamp(Math.round(cx + dx * (1 - k)), 0, w - 1);
      d[i] = s[(yr * w + xr) * 4]; d[i + 2] = s[(yb * w + xb) * 4 + 2];
    }
  }
  grade(img, { sat: 1.2, con: 1.1 });
}

function screenInto(d, glow, k) {
  for (let i = 0; i < d.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const a = d[i + c] / 255, b = clamp(glow[i + c] * k / 255, 0, 1);
      d[i + c] = (1 - (1 - a) * (1 - b)) * 255;
    }
  }
}
function fDream(img) {
  const w = img.width, h = img.height;
  grade(img, { con: 0.88, fade: 0.04, sat: 1.1, hi: [0.05, 0.0, 0.06] });
  const b = blurredCopy(img, Math.max(2, Math.round(Math.max(w, h) / 38)), 3);
  screenInto(img.data, b, 0.85);
}
function fGlow(img) {
  const w = img.width, h = img.height, d = img.data;
  const b = d.slice();
  for (let i = 0; i < b.length; i += 4) {
    const l = (0.299 * b[i] + 0.587 * b[i + 1] + 0.114 * b[i + 2]) / 255;
    const k = clamp((l - 0.5) / 0.5, 0, 1);
    b[i] *= k; b[i + 1] *= k; b[i + 2] *= k;
  }
  boxBlur(b, w, h, Math.max(2, Math.round(Math.max(w, h) / 45)), 3);
  grade(img, { con: 1.15, sat: 1.25, br: -0.04 });
  screenInto(d, b, 1.6);
}

function fVhs(img) {
  const w = img.width, h = img.height, d = img.data, s = d.slice();
  const rnd = rng(4242);
  const sh = Math.max(2, Math.round(w * 0.007));
  const bandY = Math.floor(rnd() * h * 0.8), bandH = Math.max(3, Math.round(h * 0.03));
  for (let y = 0; y < h; y++) {
    const row = y * w * 4;
    const jit = Math.round(Math.sin(y * 0.05 + rnd() * 0.3) * 1.5);
    const inBand = y >= bandY && y < bandY + bandH;
    const bandShift = inBand ? Math.round(w * 0.03) : 0;
    const line = (y & 1) ? 0.88 : 1;
    for (let x = 0; x < w; x++) {
      const sx = clamp(x + jit + bandShift, 0, w - 1);
      const xr = clamp(sx + sh, 0, w - 1), xb = clamp(sx - sh, 0, w - 1);
      const i = row + x * 4;
      let n = (rnd() - 0.5) * 22;
      if (inBand) n += 28;
      d[i] = s[row + xr * 4] * line + n;
      d[i + 1] = s[row + sx * 4 + 1] * line + n;
      d[i + 2] = s[row + xb * 4 + 2] * line + n;
    }
  }
  grade(img, { sat: 1.3, con: 1.05, fade: 0.06, sh: [-0.02, 0.0, 0.06], hi: [0.03, 0.0, 0.03] });
}

function fNegative(img) { const d = img.data; for (let i = 0; i < d.length; i += 4) { d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2]; } }

function fEmboss(img) {
  const w = img.width, h = img.height, d = img.data, L = lumArray(d, w * h);
  for (let y = 0; y < h; y++) {
    const ym = y > 0 ? y - 1 : 0, yp = y < h - 1 ? y + 1 : h - 1;
    for (let x = 0; x < w; x++) {
      const xm = x > 0 ? x - 1 : 0, xp = x < w - 1 ? x + 1 : w - 1;
      const e = -2 * L[ym * w + xm] - L[ym * w + x] - L[y * w + xm] + L[y * w + x] + L[y * w + xp] + L[yp * w + x] + 2 * L[yp * w + xp];
      const v = 128 + e * 0.9, i = (y * w + x) * 4;
      d[i] = v * 0.78 + d[i] * 0.22; d[i + 1] = v * 0.78 + d[i + 1] * 0.22; d[i + 2] = v * 0.78 + d[i + 2] * 0.22;
    }
  }
}
function fSolarize(img) {
  const d = img.data, lut = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) lut[i] = i < 140 ? i : 280 - i;
  for (let i = 0; i < d.length; i += 4) { d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]]; }
  grade(img, { sat: 1.5, con: 1.25 });
}

/* ------------------------------------------------------------------ */
/* Filtertabel: precies 50                                              */
/* ------------------------------------------------------------------ */
const G = (p) => (img) => grade(img, p);
const M = (stops, mix, pre) => (img) => gradientMap(img, stops, mix, pre);

const TABLE = [
  // Klassiek
  ['bw', 'Zwart-wit', 'Klassiek', G({ mono: 1, con: 1.1 })],
  ['bwhard', 'Zwart-wit hard', 'Klassiek', G({ mono: 1, con: 1.7, br: -0.04, vig: 0.3, grain: 8 })],
  ['bwsoft', 'Zacht zwart-wit', 'Klassiek', G({ mono: 1, con: 0.8, fade: 0.08, gam: 1.15 })],
  ['sepia', 'Sepia', 'Klassiek', G({ mono: 1, con: 1.05, fade: 0.03, gain: [1.1, 0.96, 0.74] })],
  ['vintage', 'Vintage', 'Klassiek', G({ sat: 0.72, con: 0.9, fade: 0.08, sh: [0.04, 0.02, -0.02], hi: [0.05, 0.03, -0.04], gain: [1.04, 1, 0.9], vig: 0.35, grain: 10 })],
  ['fade', 'Fade', 'Klassiek', G({ sat: 0.75, fade: 0.14, con: 0.88, cap: 0.04 })],
  ['warm', 'Warm', 'Klassiek', G({ gain: [1.12, 1.02, 0.84], sat: 1.12, hi: [0.03, 0.01, -0.02] })],
  ['cool', 'Koel', 'Klassiek', G({ gain: [0.86, 1, 1.15], sat: 1.05, sh: [-0.02, 0, 0.05] })],
  ['matte', 'Mat', 'Klassiek', G({ fade: 0.1, cap: 0.08, con: 0.95, sat: 0.88, sh: [0, 0.01, 0.03] })],
  ['dramatic', 'Dramatisch', 'Klassiek', G({ con: 1.45, sat: 1.2, br: -0.05, gam: 0.88, vig: 0.45 })],
  // Film
  ['f70', 'Jaren 70', 'Film', G({ gain: [1.12, 1.0, 0.78], sat: 1.15, fade: 0.07, con: 1.05, hi: [0.05, 0.02, 0], grain: 14, vig: 0.3 })],
  ['kodak', 'Kodak-achtig', 'Film', G({ gain: [1.07, 1.03, 0.9], sat: 1.4, con: 1.18, sh: [0.02, 0, -0.02], grain: 8 })],
  ['polaroid', 'Polaroid', 'Film', G({ fade: 0.09, con: 0.88, sat: 0.9, sh: [-0.02, 0.05, 0.07], hi: [0.07, 0.03, -0.04], vig: 0.2, grain: 6 })],
  ['noir', 'Noir', 'Film', G({ mono: 1, con: 1.7, br: -0.08, gam: 0.82, vig: 0.55, grain: 18 })],
  ['fuji', 'Fuji', 'Film', G({ gain: [0.94, 1.05, 1.03], sat: 1.3, con: 1.12, sh: [-0.03, 0.04, 0.04], hi: [0, 0.03, 0.02], grain: 6 })],
  ['cinema', 'Cinema', 'Film', G({ sh: [-0.07, 0.04, 0.09], hi: [0.09, 0.03, -0.08], con: 1.18, sat: 1.1, vig: 0.35 })],
  ['lomo', 'Lomo', 'Film', G({ con: 1.4, sat: 1.45, vig: 0.75, gain: [1.06, 1.0, 0.92], sh: [0, 0.04, 0], grain: 10 })],
  ['cross', 'Kruisontwikkeld', 'Film', G({ gamRGB: [1.3, 1.0, 0.72], sh: [0, 0.05, 0.1], hi: [0.1, 0.05, -0.1], sat: 1.3, con: 1.2 })],
  ['bleach', 'Bleach bypass', 'Film', G({ sat: 0.4, con: 1.55, br: -0.03, grain: 7 })],
  ['technicolor', 'Technicolor', 'Film', G({ sat: 1.8, con: 1.2, hi: [0.05, 0, -0.03], sh: [-0.03, 0, 0.05], gain: [1.08, 0.98, 0.96] })],
  // Kleur
  ['vivid', 'Levendig', 'Kleur', G({ sat: 1.65, con: 1.12 })],
  ['neon', 'Neon', 'Kleur', G({ con: 1.55, sat: 2.3, gam: 0.78, sh: [0.06, -0.03, 0.14], hi: [0.1, 0, 0.07], vig: 0.3 })],
  ['pastel', 'Pastel', 'Kleur', G({ sat: 0.6, fade: 0.14, br: 0.08, con: 0.78 })],
  ['duo1', 'Duotone paars-roze', 'Kleur', M([[0, '#1b0a3c'], [0.4, '#7b2ff7'], [0.75, '#ff5fa2'], [1, '#ffe3f0']], 0)],
  ['duo2', 'Duotone blauw-oranje', 'Kleur', M([[0, '#0a1f44'], [0.4, '#1f5fbf'], [0.7, '#ff8c42'], [1, '#ffe9c7']], 0)],
  ['cyanpink', 'Cyaan-roze', 'Kleur', M([[0, '#001a2c'], [0.38, '#00b8d4'], [0.72, '#ff4fa3'], [1, '#fff0f8']], 0)],
  ['sunset', 'Zonsondergang', 'Kleur', M([[0, '#2b0f3a'], [0.35, '#b8325b'], [0.7, '#ff7a3d'], [1, '#ffd27a']], 0.3)],
  ['ocean', 'Oceaan', 'Kleur', M([[0, '#02142b'], [0.35, '#0b5c8a'], [0.7, '#2fc0c8'], [1, '#e6fbff']], 0.25)],
  ['forest', 'Bos', 'Kleur', M([[0, '#06190d'], [0.4, '#1d5c2e'], [0.75, '#7aa84b'], [1, '#f1f5c8']], 0.25)],
  ['autumn', 'Herfst', 'Kleur', M([[0, '#2a0e05'], [0.4, '#8f2d0b'], [0.75, '#e8821c'], [1, '#ffe3a3']], 0.35)],
  ['winter', 'Winter', 'Kleur', G({ gain: [0.86, 0.98, 1.16], sat: 0.65, con: 1.12, hi: [-0.02, 0.02, 0.06], fade: 0.03 })],
  ['summer', 'Zomer', 'Kleur', G({ br: 0.05, sat: 1.4, gain: [1.07, 1.05, 0.92], con: 1.1, hi: [0.04, 0.03, -0.02] })],
  ['mint', 'Munt', 'Kleur', M([[0, '#052d2a'], [0.4, '#1fb59a'], [0.75, '#a8f0d2'], [1, '#f4fff8']], 0.2)],
  ['rose', 'Roze', 'Kleur', M([[0, '#2d0a1c'], [0.4, '#c23a6e'], [0.75, '#ff9fb8'], [1, '#fff1f4']], 0.2)],
  ['gold', 'Goud', 'Kleur', M([[0, '#1a1000'], [0.4, '#8a5a00'], [0.75, '#f2b705'], [1, '#fff6c9']], 0.12)],
  // Creatief
  ['posterize', 'Posterize', 'Creatief', fPosterize],
  ['cartoon', 'Cartoon', 'Creatief', fCartoon],
  ['sketch', 'Schets', 'Creatief', fSketch],
  ['pixel', 'Pixel', 'Creatief', fPixel],
  ['halftone', 'Stippen', 'Creatief', fHalftone],
  ['glitch', 'Glitch', 'Creatief', fGlitch],
  ['chromatic', 'Chromatisch', 'Creatief', fChromatic],
  ['dream', 'Dromerig', 'Creatief', fDream],
  ['vhs', 'VHS', 'Creatief', fVhs],
  ['glow', 'Gloed', 'Creatief', fGlow],
  ['negative', 'Negatief', 'Creatief', fNegative],
  ['rwb', 'Rood-wit-blauw', 'Creatief', M([[0, '#0a1a5c'], [0.33, '#2f5fd0'], [0.55, '#ffffff'], [0.8, '#e0242c'], [1, '#ffd5d5']], 0)],
  ['emboss', 'Reliëf', 'Creatief', fEmboss],
  ['solarize', 'Solarisatie', 'Creatief', fSolarize],
  ['thermal', 'Warmtecamera', 'Creatief', M([[0, '#0b0030'], [0.25, '#5a0fa0'], [0.5, '#e0243c'], [0.75, '#ffa000'], [1, '#ffffe0']], 0)],
];

export const FILTERS = TABLE.map(([id, name, group]) => ({ id, name, group }));
const IMPL = {};
for (const t of TABLE) IMPL[t[0]] = t[3];

export function applyFilterData(img, id, strength = 1) {
  const f = IMPL[id];
  if (!f) return img;
  const s = clamp(+strength, 0, 1);
  if (!(s > 0)) return img;
  const d = img.data;
  const orig = s < 1 ? d.slice() : null;
  f(img);
  if (orig) for (let i = 0; i < d.length; i += 4) {
    d[i] = orig[i] + (d[i] - orig[i]) * s;
    d[i + 1] = orig[i + 1] + (d[i + 1] - orig[i + 1]) * s;
    d[i + 2] = orig[i + 2] + (d[i + 2] - orig[i + 2]) * s;
  }
  return img;
}

/* ------------------------------------------------------------------ */
/* adjust                                                               */
/* ------------------------------------------------------------------ */
export function adjustData(img, o = {}) {
  const v = (k) => clamp(+o[k] || 0, -100, 100) / 100;
  const br = v('brightness'), con = v('contrast'), sat = v('saturation'), warm = v('warmth'), tint = v('tint');
  const hl = v('highlights'), sd = v('shadows'), fadeV = v('fade');
  const sharpen = clamp(+o.sharpen || 0, 0, 100) / 100, vig = clamp(+o.vignette || 0, 0, 100) / 100, grain = clamp(+o.grain || 0, 0, 100) / 100;
  if (!(br || con || sat || warm || tint || hl || sd || fadeV || sharpen || vig || grain)) return img;
  const w = img.width, h = img.height, d = img.data;

  if (sharpen) {
    const b = blurredCopy(img, Math.max(1, Math.round(Math.max(w, h) / 900)), 2), k = sharpen * 1.6;
    for (let i = 0; i < d.length; i += 4) { d[i] += (d[i] - b[i]) * k; d[i + 1] += (d[i + 1] - b[i + 1]) * k; d[i + 2] += (d[i + 2] - b[i + 2]) * k; }
    // clamp via Uint8ClampedArray (waarden worden direct afgekapt)
  }

  const needLut = br || con || warm || tint || hl || sd || fadeV;
  let lut = null;
  if (needLut) {
    const gain = [1 + warm * 0.16 + tint * 0.04, 1 - tint * 0.14, 1 - warm * 0.16 + tint * 0.04];
    const lutAll = [new Uint8ClampedArray(256), new Uint8ClampedArray(256), new Uint8ClampedArray(256)];
    const conF = con >= 0 ? 1 + con : 1 + con * 0.75;
    for (let c = 0; c < 3; c++) {
      for (let i = 0; i < 256; i++) {
        let x = i / 255;
        x += br * 0.3;
        x = (x - 0.5) * conF + 0.5;
        x = clamp(x, 0, 1);
        x += hl * 0.28 * x * x * x + sd * 0.28 * (1 - x) * (1 - x) * (1 - x);
        x = clamp(x, 0, 1);
        if (fadeV > 0) x = fadeV * 0.25 + x * (1 - fadeV * 0.25);
        else if (fadeV < 0) x = clamp((x + fadeV * 0.12) / (1 + fadeV * 0.12), 0, 1);
        x *= gain[c];
        lutAll[c][i] = clamp(x, 0, 1) * 255 + 0.5;
      }
    }
    lut = lutAll;
  }
  colorPass(img, { lut, sat: 1 + sat, vig: vig * 0.85, grain: grain * 30, seed: 99991 });
  return img;
}

/* ------------------------------------------------------------------ */
/* Kwasten                                                              */
/* ------------------------------------------------------------------ */
function brushBlurRadius(radius, strength) { return Math.max(1, Math.round(1 + strength * radius * 0.2)); }

// cx, cy relatief aan de ImageData
export function blurBrushData(img, cx, cy, radius, strength = 0.5) {
  const w = img.width, h = img.height, d = img.data;
  strength = norm01(strength);
  radius = Math.max(1, radius);
  const src = blurredCopy(img, brushBlurRadius(radius, strength), 2);
  const x0 = Math.max(0, Math.floor(cx - radius)), x1 = Math.min(w - 1, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius)), y1 = Math.min(h - 1, Math.ceil(cy + radius));
  const amt = 0.45 + 0.55 * strength;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0, i = (y * w + x0) * 4; x <= x1; x++, i += 4) {
      const t = 1 - Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)) / radius;
      if (t <= 0) continue;
      const k = smooth(t / 0.45) * amt;
      d[i] += (src[i] - d[i]) * k; d[i + 1] += (src[i + 1] - d[i + 1]) * k; d[i + 2] += (src[i + 2] - d[i + 2]) * k;
    }
  }
  return img;
}
export function blurBrush(canvas, x, y, radius, strength = 0.5) {
  const W = canvas.width, H = canvas.height, ctx = canvas.getContext('2d');
  const s = norm01(strength), pad = brushBlurRadius(radius, s) * 2 + 2;
  const x0 = Math.max(0, Math.floor(x - radius - pad)), y0 = Math.max(0, Math.floor(y - radius - pad));
  const x1 = Math.min(W, Math.ceil(x + radius + pad)), y1 = Math.min(H, Math.ceil(y + radius + pad));
  if (x1 <= x0 || y1 <= y0) return;
  const img = ctx.getImageData(x0, y0, x1 - x0, y1 - y0);
  blurBrushData(img, x - x0, y - y0, radius, s);
  ctx.putImageData(img, x0, y0);
}

// ox, oy = positie van de ImageData op het canvas (voor een vast blokkenraster); cx, cy in canvas-coördinaten
export function pixelateBrushData(img, ox, oy, cx, cy, radius, size) {
  const w = img.width, h = img.height, d = img.data;
  size = Math.max(2, Math.round(size));
  const bx0 = Math.floor(ox / size) * size - ox;
  const by0 = Math.floor(oy / size) * size - oy;
  for (let by = by0; by < h; by += size) {
    for (let bx = bx0; bx < w; bx += size) {
      const mx = ox + bx + size / 2, my = oy + by + size / 2;
      if ((mx - cx) * (mx - cx) + (my - cy) * (my - cy) > radius * radius) continue;
      const xa = Math.max(0, bx), ya = Math.max(0, by), xb = Math.min(w, bx + size), yb = Math.min(h, by + size);
      if (xb <= xa || yb <= ya) continue;
      fillBlock(d, w, h, xa, ya, xb, yb, blockMean(d, w, h, xa, ya, xb, yb));
    }
  }
  return img;
}
export function pixelateBrush(canvas, x, y, radius, size = 12) {
  const W = canvas.width, H = canvas.height, ctx = canvas.getContext('2d');
  size = Math.max(2, Math.round(size));
  const x0 = Math.max(0, Math.floor((x - radius) / size) * size), y0 = Math.max(0, Math.floor((y - radius) / size) * size);
  const x1 = Math.min(W, Math.ceil((x + radius) / size) * size), y1 = Math.min(H, Math.ceil((y + radius) / size) * size);
  if (x1 <= x0 || y1 <= y0) return;
  const img = ctx.getImageData(x0, y0, x1 - x0, y1 - y0);
  pixelateBrushData(img, x0, y0, x, y, radius, size);
  ctx.putImageData(img, x0, y0);
}

/* ------------------------------------------------------------------ */
/* Kleur-pop                                                            */
/* ------------------------------------------------------------------ */
export function colorPopData(img, hue, tolerance = 30, softness = 20) {
  const d = img.data, n = img.width * img.height;
  const tol = Math.max(0, tolerance), soft = Math.max(0.001, softness);
  hue = ((hue % 360) + 360) % 360;
  for (let k = 0, i = 0; k < n; k++, i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const mx = r > g ? (r > b ? r : b) : (g > b ? g : b), mn = r < g ? (r < b ? r : b) : (g < b ? g : b), dl = mx - mn;
    if (dl === 0) continue;
    let hh;
    if (mx === r) hh = ((g - b) / dl) % 6; else if (mx === g) hh = (b - r) / dl + 2; else hh = (r - g) / dl + 4;
    hh *= 60; if (hh < 0) hh += 360;
    let dh = Math.abs(hh - hue); if (dh > 180) dh = 360 - dh;
    const wgt = dh <= tol ? 1 : dh >= tol + soft ? 0 : 1 - smooth((dh - tol) / soft);
    if (wgt >= 1) continue;
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    d[i] = l + (r - l) * wgt; d[i + 1] = l + (g - l) * wgt; d[i + 2] = l + (b - l) * wgt;
  }
  return img;
}
export function colorPop(canvas, hue, tolerance = 30, softness = 20) {
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  colorPopData(img, hue, tolerance, softness);
  ctx.putImageData(img, 0, 0);
}
export function hueAt(canvas, x, y) {
  const px = clamp(Math.round(x), 0, canvas.width - 1), py = clamp(Math.round(y), 0, canvas.height - 1);
  const p = canvas.getContext('2d').getImageData(px, py, 1, 1).data;
  return rgbToHsl(p[0], p[1], p[2]);
}

/* ------------------------------------------------------------------ */
/* Tilt-shift                                                           */
/* ------------------------------------------------------------------ */
export function tiltShiftData(img, o = {}) {
  const w = img.width, h = img.height, d = img.data;
  const mode = o.mode === 'radial' ? 'radial' : 'linear';
  const cyN = o.cy == null ? 0.5 : clamp(+o.cy, 0, 1), size = o.size == null ? 0.3 : clamp(+o.size, 0, 1);
  const blur = clamp(+o.blur == null || isNaN(+o.blur) ? 50 : +o.blur, 0, 100);
  let sb = +o.saturationBoost || 0; if (sb !== 0 && Math.abs(sb) <= 1) sb *= 100;
  sb = clamp(sb, -100, 100) / 100;
  const ang = ((+o.angle || 0) * Math.PI) / 180, ca = Math.cos(ang), sa = Math.sin(ang);
  if (blur > 0) {
    const R = Math.max(1, (blur / 100) * Math.max(w, h) * 0.02);
    const A = blurredCopy(img, Math.max(1, R * 0.4), 2), B = blurredCopy(img, R, 3);
    const cx = w / 2, cy = cyN * h;
    const sharp = mode === 'linear' ? size * 0.5 * h : size * 0.5 * Math.min(w, h);
    const trans = mode === 'linear' ? 0.3 * h : 0.4 * Math.max(w, h) * 0.5;
    for (let y = 0; y < h; y++) {
      for (let x = 0, i = y * w * 4; x < w; x++, i += 4) {
        const dx = x - cx, dy = y - cy;
        const dist = mode === 'linear' ? Math.abs(dy * ca - dx * sa) : Math.sqrt(dx * dx + dy * dy);
        const t = smooth((dist - sharp) / trans);
        if (t <= 0) continue;
        for (let c = 0; c < 3; c++) {
          const a = A[i + c];
          d[i + c] = t < 0.5 ? d[i + c] + (a - d[i + c]) * (t * 2) : a + (B[i + c] - a) * ((t - 0.5) * 2);
        }
      }
    }
  }
  if (sb) colorPass(img, { sat: 1 + sb });
  return img;
}
export function tiltShift(canvas, o = {}) {
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  tiltShiftData(img, o);
  ctx.putImageData(img, 0, 0);
}

/* ------------------------------------------------------------------ */
/* Dubbele belichting                                                   */
/* ------------------------------------------------------------------ */
const BLEND = {
  screen: (b, o) => 1 - (1 - b) * (1 - o),
  multiply: (b, o) => b * o,
  lighten: (b, o) => (b > o ? b : o),
  overlay: (b, o) => (b < 0.5 ? 2 * b * o : 1 - 2 * (1 - b) * (1 - o)),
  normal: (b, o) => o,
  difference: (b, o) => Math.abs(b - o),
};
// base en over: zelfde afmetingen; alpha van over bepaalt waar het effect telt
export function doubleExposureData(base, over, o = {}) {
  const fn = BLEND[o.mode] || BLEND.screen;
  const op = o.opacity == null ? 0.6 : clamp(+o.opacity, 0, 1);
  const a = base.data, b = over.data;
  for (let i = 0; i < a.length; i += 4) {
    const k = op * (b[i + 3] / 255);
    if (k <= 0) continue;
    for (let c = 0; c < 3; c++) {
      const x = a[i + c] / 255, y = b[i + c] / 255;
      a[i + c] = (x + (fn(x, y) - x) * k) * 255;
    }
  }
  return base;
}
export function doubleExposure(baseCanvas, overlayCanvas, o = {}) {
  const w = baseCanvas.width, h = baseCanvas.height;
  const tmp = document.createElement('canvas');
  tmp.width = w; tmp.height = h;
  const t = tmp.getContext('2d');
  const ow = overlayCanvas.width || overlayCanvas.naturalWidth, oh = overlayCanvas.height || overlayCanvas.naturalHeight;
  const sc = o.fit === 'contain' ? Math.min(w / ow, h / oh) : Math.max(w / ow, h / oh);
  const dw = ow * sc, dh = oh * sc;
  t.imageSmoothingEnabled = true;
  try { t.imageSmoothingQuality = 'high'; } catch (e) { /* ignore */ }
  t.drawImage(overlayCanvas, (w - dw) / 2, (h - dh) / 2, dw, dh);
  const over = t.getImageData(0, 0, w, h);
  const ctx = baseCanvas.getContext('2d');
  const base = ctx.getImageData(0, 0, w, h);
  doubleExposureData(base, over, o);
  ctx.putImageData(base, 0, 0);
  tmp.width = tmp.height = 1; // geheugen vrijgeven
}

/* ------------------------------------------------------------------ */
/* Canvas-wrappers                                                      */
/* ------------------------------------------------------------------ */
export function applyFilter(canvas, id, strength = 1) {
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  applyFilterData(img, id, strength);
  ctx.putImageData(img, 0, 0);
}
export function adjust(canvas, o = {}) {
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  adjustData(img, o);
  ctx.putImageData(img, 0, 0);
}
export function cloneCanvas(c) {
  const n = document.createElement('canvas');
  n.width = c.width; n.height = c.height;
  n.getContext('2d').drawImage(c, 0, 0);
  return n;
}
export function makeThumb(c, maxSide = 96) {
  const sc = Math.min(1, maxSide / Math.max(c.width, c.height));
  const n = document.createElement('canvas');
  n.width = Math.max(1, Math.round(c.width * sc)); n.height = Math.max(1, Math.round(c.height * sc));
  const ctx = n.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  try { ctx.imageSmoothingQuality = 'high'; } catch (e) { /* ignore */ }
  ctx.drawImage(c, 0, 0, n.width, n.height);
  return n;
}
