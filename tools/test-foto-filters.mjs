import * as F from '../docs/foto-filters.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };

function synth(w, h) {
  const data = new Uint8ClampedArray(w * h * 4);
  let s = 1;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    let r = (x / w) * 255, g = (y / h) * 255, b = 255 - (x / w) * 200;
    const dx = x - w * 0.5, dy = y - h * 0.5;
    if (dx * dx + dy * dy < (w * 0.2) ** 2) { r = 230; g = 60; b = 60; }
    if (x > w * 0.7 && y < h * 0.3) { r = 40; g = 200; b = 90; }
    if (y > h * 0.8) { r = g = b = 40 + (x / w) * 200; }
    r += (rnd() - 0.5) * 20; g += (rnd() - 0.5) * 20; b += (rnd() - 0.5) * 20;
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
    data[i + 3] = (x + y) % 7 === 0 ? 200 : 255; // alpha-variatie
  }
  return { width: w, height: h, data };
}
const clone = (img) => ({ width: img.width, height: img.height, data: img.data.slice() });
const mad = (a, b) => { let s = 0, n = 0; for (let i = 0; i < a.length; i += 4) { s += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); n += 3; } return s / n; };
const checkSane = (img, src, name) => {
  let bad = 0, alphaBad = 0;
  for (let i = 0; i < img.data.length; i += 4) {
    for (let c = 0; c < 3; c++) { const v = img.data[i + c]; if (!(v >= 0 && v <= 255) || Number.isNaN(v)) bad++; }
    if (img.data[i + 3] !== src.data[i + 3]) alphaBad++;
  }
  ok(bad === 0, name + ' waarden buiten 0..255/NaN');
  ok(alphaBad === 0, name + ' alpha veranderd');
};

ok(F.FILTERS.length === 50, 'precies 50 filters, nu ' + F.FILTERS.length);
ok(new Set(F.FILTERS.map((f) => f.id)).size === 50, 'unieke ids');
ok(F.FILTERS.every((f) => f.id && f.name && f.group), 'velden gevuld');
console.log('groepen:', [...new Set(F.FILTERS.map((f) => f.group))].join(', '));

const small = synth(240, 180);
const outs = {};
for (const f of F.FILTERS) {
  const im = clone(small);
  F.applyFilterData(im, f.id, 1);
  checkSane(im, small, f.id);
  outs[f.id] = im;
  ok(mad(im.data, small.data) > 3, f.id + ' verschilt te weinig van origineel: ' + mad(im.data, small.data).toFixed(2));
  // strength 0 = origineel, 0.5 tussen
  const z = clone(small); F.applyFilterData(z, f.id, 0);
  ok(mad(z.data, small.data) === 0, f.id + ' strength 0');
  const hlf = clone(small); F.applyFilterData(hlf, f.id, 0.5);
  const dh = mad(hlf.data, small.data), df = mad(im.data, small.data);
  ok(dh < df + 0.01, f.id + ' strength 0.5 niet kleiner');
}
// onderlinge verschillen
let minPair = [1e9, '', ''];
const ids = F.FILTERS.map((f) => f.id);
for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
  const m = mad(outs[ids[a]].data, outs[ids[b]].data);
  if (m < minPair[0]) minPair = [m, ids[a], ids[b]];
  ok(m > 1.5, `filters ${ids[a]} en ${ids[b]} te gelijk (${m.toFixed(2)})`);
}
console.log('dichtstbijzijnde paar:', minPair[1], minPair[2], minPair[0].toFixed(2));

// timing 1000x1000
const big = synth(1000, 1000);
const slow = [];
let maxT = 0;
for (const f of F.FILTERS) {
  const im = clone(big);
  const t = performance.now();
  F.applyFilterData(im, f.id, 1);
  const dt = performance.now() - t;
  maxT = Math.max(maxT, dt);
  if (dt > 400) slow.push(f.id + ':' + Math.round(dt));
}
console.log('traag (>400ms):', slow.join(' ') || 'geen', ' max', Math.round(maxT));
ok(slow.length <= 5, 'te veel trage filters');
ok(maxT < 1500, 'filter > 1500ms');

// adjust
const base = synth(200, 150);
const zero = clone(base); F.adjustData(zero, {}); ok(mad(zero.data, base.data) === 0, 'adjust leeg = identiek');
for (const k of ['brightness', 'contrast', 'saturation', 'warmth', 'tint', 'highlights', 'shadows', 'sharpen', 'vignette', 'grain', 'fade']) {
  for (const val of [100, k === 'sharpen' || k === 'vignette' || k === 'grain' ? 0 : -100]) {
    const im = clone(base); F.adjustData(im, { [k]: val });
    checkSane(im, base, 'adjust ' + k + val);
    if (val !== 0) ok(mad(im.data, base.data) > 0.5, 'adjust ' + k + val + ' doet niets');
  }
}
const br = clone(base); F.adjustData(br, { brightness: 50 });
const dk = clone(base); F.adjustData(dk, { brightness: -50 });
ok(avg(br.data) > avg(base.data) && avg(dk.data) < avg(base.data), 'brightness richting');
function avg(d) { let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2]; return s / (d.length / 4 * 3); }
const t0 = performance.now(); const all = clone(big); F.adjustData(all, { brightness: 10, contrast: 20, saturation: 20, warmth: 10, tint: 5, highlights: -20, shadows: 20, sharpen: 40, vignette: 30, grain: 20, fade: 10 });
console.log('adjust alles 1000x1000:', Math.round(performance.now() - t0), 'ms');

// blurBrush
const bb = clone(base); F.blurBrushData(bb, 100, 75, 40, 0.8);
checkSane(bb, base, 'blurBrush'); ok(mad(bb.data, base.data) > 0.3, 'blurBrush verschilt');
const far = (() => { let d = 0; for (let y = 0; y < 150; y++) for (let x = 0; x < 20; x++) { const i = (y * 200 + x) * 4; d += Math.abs(bb.data[i] - base.data[i]); } return d; })();
ok(far === 0, 'blurBrush buiten bereik ongemoeid');
// pixelateBrush
const pb = clone(base); F.pixelateBrushData(pb, 0, 0, 100, 75, 40, 10);
checkSane(pb, base, 'pixelateBrush'); ok(mad(pb.data, base.data) > 0.3, 'pixelate verschilt');
const i1 = (75 * 200 + 101) * 4, i2 = (75 * 200 + 104) * 4; ok(pb.data[i1] === pb.data[i2], 'pixelate blok gelijk');
// colorPop
const cp = clone(base); F.colorPopData(cp, 0, 30, 20);
checkSane(cp, base, 'colorPop');
const ci = (75 * 200 + 100) * 4; // rood middencirkel
ok(Math.abs(cp.data[ci] - base.data[ci]) < 3, 'colorPop behoudt rood');
const gi = (10 * 200 + 190) * 4; // groen vak
ok(Math.abs(cp.data[gi] - cp.data[gi + 1]) < 2, 'colorPop grijst groen: ' + cp.data[gi] + ',' + cp.data[gi + 1]);
const hs = F.rgbToHsl(255, 0, 0); ok(hs.h === 0 && hs.s === 1 && Math.abs(hs.l - 0.5) < 1e-9, 'rgbToHsl rood');
ok(Math.round(F.rgbToHsl(0, 255, 0).h) === 120 && Math.round(F.rgbToHsl(0, 0, 255).h) === 240, 'rgbToHsl groen/blauw');
// tiltShift
for (const mode of ['linear', 'radial']) {
  const ts = clone(base); F.tiltShiftData(ts, { mode, cy: 0.5, size: 0.3, blur: 80, angle: 20, saturationBoost: 30 });
  checkSane(ts, base, 'tilt ' + mode); ok(mad(ts.data, base.data) > 0.5, 'tilt ' + mode + ' verschilt');
}
const tt = performance.now(); F.tiltShiftData(clone(big), { mode: 'linear', blur: 100, size: 0.2 }); console.log('tiltShift 1000x1000:', Math.round(performance.now() - tt), 'ms');
// doubleExposure
const ov = synth(200, 150); for (let i = 0; i < ov.data.length; i += 4) { ov.data[i] = 255 - ov.data[i]; ov.data[i + 3] = 255; }
for (const mode of ['screen', 'multiply', 'lighten', 'overlay', 'normal', 'difference']) {
  const de = clone(base); F.doubleExposureData(de, ov, { opacity: 0.7, mode });
  checkSane(de, base, 'dbl ' + mode); ok(mad(de.data, base.data) > 0.5, 'dbl ' + mode);
}

console.log(fails ? fails + ' FOUTEN' : 'ALLES OK');
process.exit(fails ? 1 : 0);
