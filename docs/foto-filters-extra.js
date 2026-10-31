// foto-filters-extra.js - 25 extra filters voor de fotostudio (sfeer, werelden, creatief). Pure pixel-functies, geen DOM.
// foto-filters.js geeft zijn hulpfuncties door: makeExtraFilters(h) -> [[id, naam, groep, fn(img)], ...]
export const EXTRA_COUNT = 25;

export function makeExtraFilters(h) {
  const { G, M, grade, gradientMap, boxBlur, lumArray, quantize, clamp, rng, blockMean, fillBlock } = h;

  // witte puntjes (sterren / sneeuw) over de foto; deterministisch
  function specks(img, seed, density, minR, maxR, col, aMin) {
    const w = img.width, d = img.data, hh = img.height, r = rng(seed), n = Math.round(w * hh * density);
    for (let k = 0; k < n; k++) {
      const cx = Math.floor(r() * w), cy = Math.floor(r() * hh), rad = minR + r() * (maxR - minR), a = aMin + r() * (1 - aMin);
      const x0 = Math.max(0, Math.floor(cx - rad)), x1 = Math.min(w - 1, Math.ceil(cx + rad)), y0 = Math.max(0, Math.floor(cy - rad)), y1 = Math.min(hh - 1, Math.ceil(cy + rad));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const dd = Math.hypot(x - cx, y - cy) / rad; if (dd > 1) continue;
        const cov = (1 - dd) * a, i = (y * w + x) * 4;
        d[i] += (col[0] - d[i]) * cov; d[i + 1] += (col[1] - d[i + 1]) * cov; d[i + 2] += (col[2] - d[i + 2]) * cov;
      }
    }
  }
  const rad0 = (img, div) => Math.max(1, Math.round(Math.max(img.width, img.height) / div));

  function fMirror(img) {
    const w = img.width, hh = img.height, d = img.data;
    for (let y = 0; y < hh; y++) for (let x = 0; x < Math.floor(w / 2); x++) {
      const a = (y * w + x) * 4, b = (y * w + (w - 1 - x)) * 4;
      d[b] = d[a]; d[b + 1] = d[a + 1]; d[b + 2] = d[a + 2];
    }
  }
  function fKaleido(img) {
    const w = img.width, hh = img.height, d = img.data;
    const hw = Math.floor(w / 2), hh2 = Math.floor(hh / 2);
    for (let y = 0; y < hh2; y++) for (let x = 0; x < hw; x++) {
      const a = (y * w + x) * 4;
      const t = [[w - 1 - x, y], [x, hh - 1 - y], [w - 1 - x, hh - 1 - y]];
      for (const [tx, ty] of t) { const b = (ty * w + tx) * 4; d[b] = d[a]; d[b + 1] = d[a + 1]; d[b + 2] = d[a + 2]; }
    }
    grade(img, { sat: 1.25, con: 1.08 });
  }
  function fWave(img) {
    const w = img.width, hh = img.height, d = img.data, s = d.slice();
    const amp = Math.max(2, Math.round(Math.min(w, hh) * 0.018)), per = Math.max(20, Math.min(w, hh) / 6);
    for (let y = 0; y < hh; y++) {
      const dx = Math.round(Math.sin(y / per * 6.283) * amp);
      for (let x = 0; x < w; x++) {
        const sx = clamp(x + dx, 0, w - 1), i = (y * w + x) * 4, j = (y * w + sx) * 4;
        d[i] = s[j]; d[i + 1] = s[j + 1]; d[i + 2] = s[j + 2];
      }
    }
    grade(img, { sat: 1.15 });
  }
  function fTiles(img) {
    const w = img.width, hh = img.height, d = img.data, bs = Math.max(8, rad0(img, 28));
    for (let y = 0; y < hh; y += bs) for (let x = 0; x < w; x += bs) {
      const m = blockMean(d, w, hh, x, y, x + bs, y + bs);
      fillBlock(d, w, hh, x, y, x + bs, y + bs, m);
      const g = Math.max(1, Math.round(bs * 0.08)), grout = [m[0] * 0.35, m[1] * 0.35, m[2] * 0.35];
      fillBlock(d, w, hh, x, y, x + bs, y + g, grout); fillBlock(d, w, hh, x, y, x + g, y + bs, grout);
    }
    grade(img, { sat: 1.2 });
  }
  function fScan(img) {
    const w = img.width, hh = img.height, d = img.data, step = Math.max(2, rad0(img, 240));
    grade(img, { sat: 1.25, con: 1.18, vig: 0.4 });
    for (let y = 0; y < hh; y++) {
      const f = (Math.floor(y / step) & 1) ? 0.72 : 1.0, row = y * w * 4;
      for (let x = 0, i = row; x < w; x++, i += 4) { const px = (x % 3 === 0) ? [1.1, 0.95, 0.95] : (x % 3 === 1) ? [0.95, 1.1, 0.95] : [0.95, 0.95, 1.1]; d[i] *= f * px[0]; d[i + 1] *= f * px[1]; d[i + 2] *= f * px[2]; }
    }
  }
  function edgesOf(img) {
    const w = img.width, hh = img.height, L = lumArray(img.data, w * hh), E = new Float32Array(w * hh);
    for (let y = 1; y < hh - 1; y++) for (let x = 1; x < w - 1; x++) {
      const k = y * w + x;
      const gx = -L[k - w - 1] - 2 * L[k - 1] - L[k + w - 1] + L[k - w + 1] + 2 * L[k + 1] + L[k + w + 1];
      const gy = -L[k - w - 1] - 2 * L[k - w] - L[k - w + 1] + L[k + w - 1] + 2 * L[k + w] + L[k + w + 1];
      E[k] = Math.abs(gx) + Math.abs(gy);
    }
    return E;
  }
  function fPencil(img) {
    const w = img.width, hh = img.height, d = img.data, E = edgesOf(img);
    grade(img, { sat: 0.5, fade: 0.35, con: 0.8 });
    for (let k = 0, i = 0; k < w * hh; k++, i += 4) { const e = clamp((E[k] - 30) / 160, 0, 1) * 0.85, f = 1 - e; d[i] = d[i] * f + 40 * e; d[i + 1] = d[i + 1] * f + 40 * e; d[i + 2] = d[i + 2] * f + 55 * e; }
  }
  function fComic(img) {
    const w = img.width, hh = img.height, d = img.data;
    boxBlur(d, w, hh, rad0(img, 500), 1);
    const E = edgesOf(img);
    grade(img, { sat: 1.7, con: 1.25 }); quantize(img, 4);
    for (let k = 0, i = 0; k < w * hh; k++, i += 4) { const e = clamp((E[k] - 70) / 120, 0, 1); if (e > 0) { const f = 1 - e; d[i] *= f; d[i + 1] *= f; d[i + 2] *= f; } }
  }
  function fWater(img) {
    const w = img.width, hh = img.height, d = img.data;
    boxBlur(d, w, hh, rad0(img, 160), 2);
    grade(img, { sat: 1.1, fade: 0.1, con: 0.92, br: 0.04 }); quantize(img, 7);
    boxBlur(d, w, hh, 1, 1);
    const r = rng(99);
    for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 10; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  }
  function fSnow(img) {
    grade(img, { gain: [0.92, 0.99, 1.1], sat: 0.8, con: 1.05, hi: [0.03, 0.04, 0.07] });
    specks(img, 31337, 0.0016, 1.2, Math.max(2.5, rad0(img, 260)), [255, 255, 255], 0.55);
  }
  function fSpace(img) {
    gradientMap(img, [[0, '#04040f'], [0.35, '#27145a'], [0.7, '#7b3fd0'], [1, '#d6f0ff']], 0.22);
    specks(img, 4711, 0.0009, 0.8, Math.max(2, rad0(img, 320)), [255, 255, 240], 0.6);
  }
  function fSparkle(img) {
    grade(img, { con: 1.1, sat: 1.25, br: 0.02 });
    const w = img.width, hh = img.height, d = img.data, r = rng(2024), n = Math.round(w * hh * 0.0004);
    const arm = Math.max(4, rad0(img, 55));
    for (let k = 0; k < n; k++) {
      const cx = Math.floor(r() * w), cy = Math.floor(r() * hh), l = arm * (0.5 + r() * 0.9);
      for (let t = -l; t <= l; t++) {
        const a = 1 - Math.abs(t) / l;
        for (const [px, py] of [[cx + t, cy], [cx, cy + t]]) {
          const x = Math.round(px), y = Math.round(py); if (x < 0 || y < 0 || x >= w || y >= hh) continue;
          const i = (y * w + x) * 4; d[i] += (255 - d[i]) * a * 0.9; d[i + 1] += (255 - d[i + 1]) * a * 0.9; d[i + 2] += (240 - d[i + 2]) * a * 0.9;
        }
      }
    }
  }
  function fBlueprint(img) {
    const w = img.width, hh = img.height, d = img.data, E = edgesOf(img);
    for (let k = 0, i = 0; k < w * hh; k++, i += 4) {
      const e = clamp((E[k] - 25) / 140, 0, 1);
      d[i] = 18 + e * 220; d[i + 1] = 62 + e * 190; d[i + 2] = 140 + e * 115;
    }
    const step = Math.max(12, rad0(img, 36));
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) if (x % step === 0 || y % step === 0) { const i = (y * w + x) * 4; d[i] += 14; d[i + 1] += 24; d[i + 2] += 30; }
  }

  function fInfra(img) { // valse kleuren: groen wordt roze, lucht wordt geel
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) { const r = d[i], g = d[i + 1], b = d[i + 2]; d[i] = g * 1.25; d[i + 1] = r * 0.6 + b * 0.2; d[i + 2] = b * 0.5 + r * 0.55; }
    grade(img, { sat: 1.4, con: 1.1 });
  }

  return [
    // Sfeer
    ['goldenhour', 'Gouden uur', 'Sfeer', G({ gain: [1.14, 1.04, 0.82], sat: 1.25, hi: [0.06, 0.03, -0.03], con: 1.06, vig: 0.25 })],
    ['moody', 'Moody', 'Sfeer', G({ con: 1.3, sat: 0.7, br: -0.06, gam: 0.88, sh: [-0.02, 0.02, 0.05], vig: 0.5 })],
    ['blush', 'Blush', 'Sfeer', M([[0, '#3a1030'], [0.45, '#d4568f'], [0.8, '#ffc4d6'], [1, '#fff5f8']], 0.35)],
    ['tealorange', 'Teal & oranje', 'Sfeer', G({ sh: [-0.08, 0.04, 0.1], hi: [0.1, 0.03, -0.08], con: 1.15, sat: 1.2 })],
    ['dusk', 'Schemering', 'Sfeer', M([[0, '#0f0a2e'], [0.4, '#5b2a86'], [0.72, '#e0607e'], [1, '#ffd9a8']], 0.3)],
    ['lavender', 'Lavendel', 'Sfeer', M([[0, '#1d1240'], [0.45, '#8b6fd6'], [0.8, '#d8c8f8'], [1, '#faf6ff']], 0.3)],
    ['arctic', 'Poolkoud', 'Sfeer', G({ gain: [0.82, 0.98, 1.2], sat: 0.7, con: 1.15, br: 0.03, hi: [0, 0.03, 0.08] })],
    ['tropical', 'Tropisch', 'Sfeer', G({ sat: 1.7, con: 1.12, gain: [1.05, 1.04, 0.95], sh: [0, 0.05, 0.03] })],
    ['candyland', 'Snoepland', 'Sfeer', M([[0, '#4a1050'], [0.4, '#f06bb4'], [0.75, '#9be8ff'], [1, '#fff8c4']], 0.25)],
    // Werelden
    ['w-space', 'Ruimte', 'Werelden', fSpace],
    ['w-deep', 'Diepzee', 'Werelden', M([[0, '#01101f'], [0.4, '#0a5c7a'], [0.75, '#34d0c8'], [1, '#e8fffb']], 0.3, { fade: 0.05 })],
    ['w-volcano', 'Vulkaan', 'Werelden', M([[0, '#140404'], [0.35, '#7a1a0a'], [0.7, '#ff6a1a'], [1, '#ffe08a']], 0.18)],
    ['w-jungle', 'Jungle', 'Werelden', G({ gain: [1.0, 1.12, 0.78], sat: 1.9, con: 1.2, sh: [-0.04, 0.06, -0.04], hi: [0.04, 0.05, -0.05], vig: 0.3 })],
    ['w-snow', 'IJswereld', 'Werelden', fSnow],
    // Creatief
    ['mirror', 'Spiegel', 'Creatief', fMirror],
    ['kaleido', 'Kaleidoscoop', 'Creatief', fKaleido],
    ['wavy', 'Golvend', 'Creatief', fWave],
    ['tiles', 'Tegels', 'Creatief', fTiles],
    ['scanlines', 'Retro-tv', 'Creatief', fScan],
    ['pencilc', 'Potloodtekening', 'Creatief', fPencil],
    ['comic', 'Stripboek', 'Creatief', fComic],
    ['watercolor', 'Aquarel', 'Creatief', fWater],
    ['sparkle', 'Fonkelend', 'Creatief', fSparkle],
    ['blueprint', 'Blauwdruk', 'Creatief', fBlueprint],
    ['infrared', 'Infrarood', 'Creatief', fInfra],
  ];
}
