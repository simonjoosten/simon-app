// Node-test voor docs/meme-core.js (en de pure hulpfuncties in meme.js). Gebruik: node tools/test-meme.mjs
import assert from 'node:assert/strict';
import * as C from '../docs/meme-core.js';
import { ICONS } from '../docs/gfx/icons.js';

const mkImg = (w, h, f) => { const data = new Uint8ClampedArray(w * h * 4); for (let i = 0; i < w * h; i++) { const [r, g, b] = f(i % w, (i / w) | 0); data[i * 4] = r; data[i * 4 + 1] = g; data[i * 4 + 2] = b; data[i * 4 + 3] = 255; } return { data, width: w, height: h }; };
const px = (img, x, y) => [...img.data.slice((y * img.width + x) * 4, (y * img.width + x) * 4 + 3)];
const grad = () => mkImg(20, 20, (x, y) => [x * 12, y * 12, 128]);

// sjablonen, stickers, achtergronden
assert.ok(C.TEMPLATES.length >= 12 && C.BGS.length >= 18 && C.FONTS.length >= 5 && C.FILTERS.length >= 15);
for (const [, names] of C.STICKER_GROUPS) for (const n of names) assert.ok(ICONS[n], 'onbekend icoon ' + n);
let id = 1;
for (const t of C.TEMPLATES) {
  assert.ok(t.bg >= 0 && t.bg < C.BGS.length, t.name);
  const st = C.fromTemplate(t, () => id++);
  assert.ok(st.layers.length >= 1, t.name);
  for (const l of st.layers) { assert.ok(l.x >= 0 && l.x <= C.W && l.y >= 0 && l.y <= st.h, t.name); if (l.kind === 'sticker') assert.ok(ICONS[l.icon], t.name + ' ' + l.icon); else assert.ok(l.text, t.name); }
  const ser = JSON.parse(JSON.stringify(C.serialize(st))); const back = C.restore(ser);
  assert.equal(back.layers.length, st.layers.length); assert.equal(back.bg.idx, st.bg.idx);
}
const ids = C.TEMPLATES.map((t) => C.fromTemplate(t, () => 1).layers.length); assert.ok(ids.every((n) => n > 0));
// achtergrond-tekenfuncties lopen niet vast op een nep-canvas
const ctx = new Proxy({}, { get: (o, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {}), set: () => true });
for (const [, fn] of C.BGS) fn(ctx, 1080, 1080);
// filters
for (const [fid] of C.FILTERS) { const im = grad(); const r = C.applyFilter(im, fid, 1); assert.equal(r, im); assert.equal(im.data.length, 20 * 20 * 4); for (let i = 0; i < im.data.length; i++) assert.ok(im.data[i] >= 0 && im.data[i] <= 255); }
let im = grad(); C.applyFilter(im, 'bw', 1); { const [r, g, b] = px(im, 5, 10); assert.ok(Math.abs(r - g) <= 1 && Math.abs(g - b) <= 1); }
im = grad(); C.applyFilter(im, 'invert', 1); assert.deepEqual(px(im, 0, 0), [255, 255, 127]);
im = grad(); C.applyFilter(im, 'invert', 0); assert.deepEqual(px(im, 0, 0), [0, 0, 128]);   // sterkte 0 = niets
im = grad(); C.applyFilter(im, 'invert', 0.5); { const [r] = px(im, 0, 0); assert.ok(r > 100 && r < 160); }
im = grad(); C.applyFilter(im, 'none', 1); assert.deepEqual(px(im, 3, 3), [36, 36, 128]);
im = mkImg(8, 8, (x) => (x < 4 ? [0, 0, 0] : [255, 255, 255])); C.pixelate(im, 8); assert.deepEqual(px(im, 0, 0), px(im, 7, 7)); 
im = mkImg(8, 8, (x) => (x < 4 ? [0, 0, 0] : [255, 255, 255])); C.boxBlur(im, 2); { const m = px(im, 3, 3)[0]; assert.ok(m > 0 && m < 255); }
im = mkImg(8, 8, () => [100, 100, 100]); C.adjust(im, { brightness: 20, contrast: 0, saturate: 0 }); assert.ok(px(im, 0, 0)[0] > 100);
im = mkImg(8, 8, () => [100, 150, 200]); C.adjust(im, { saturate: -100 }); { const [r, g, b] = px(im, 0, 0); assert.ok(Math.abs(r - g) <= 1 && Math.abs(g - b) <= 1); }
im = mkImg(4, 4, () => [10, 20, 30]); C.adjust(im, { brightness: 0, contrast: 0, saturate: 0 }); assert.deepEqual(px(im, 0, 0), [10, 20, 30]);
im = mkImg(10, 4, (x) => [x * 25, 0, 0]); C.applyFilter(im, 'mirror', 1); assert.equal(px(im, 9, 0)[0], px(im, 0, 0)[0]);
// opslag
const st = C.fromTemplate(C.TEMPLATES[0], () => 1); st.bg.img = { fake: 1 };
const s = JSON.stringify(C.serialize(st)); assert.ok(!s.includes('fake'));
const r = C.restore(JSON.parse(s)); assert.equal(r.bg.img, null); assert.equal(r.filter.id, 'none'); assert.equal(r.ts.font, 'impact');
const old = C.restore({ h: 900, bg: { type: 'grad', idx: 2 }, top: 'A', bottom: 'B', layers: [{ id: 3, kind: 'sticker', emoji: '😂', x: 1, y: 2, size: 100 }, null] });
assert.equal(old.layers.length, 1); assert.equal(old.h, 900); assert.equal(old.layers[0].font, 'impact');
assert.equal(C.restore({ bg: { type: 'zzz', idx: 999 } }).bg.idx, C.BGS.length - 1); assert.equal(C.restore({ bg: { type: 'zzz' } }).bg.type, 'grad');
assert.equal(C.fitMemes(Array(30).fill({ a: 1 })).length, 14); assert.equal(C.fitMemes([{ a: 'x'.repeat(100) }, { a: 'x'.repeat(100) }, { a: 'x'.repeat(100) }], 250).length, 2);
assert.deepEqual(C.iconNamesUsed({ layers: [{ kind: 'sticker', icon: 'cat' }, { kind: 'sticker', icon: 'cat' }, { kind: 'text' }] }), ['cat']);
assert.equal(C.fontById('nietbestaand')[0], 'impact'); assert.ok(C.FUNNY.length >= 40);
// hulpfuncties in meme.js: importeren kan niet in node (gfx-imports), dus de bron even inlezen en uitvoeren
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../docs/meme.js', import.meta.url), 'utf8');
const a = src.indexOf('// ---------- Pure hulpfuncties'), b = src.indexOf('const PLAIN_BGS');
const mod = new Function('W', 'MAXH', src.slice(a, b).replace(/export /g, '') + '; return { wrapText, fitText, toCanvasPoint, hitLayer, canvasHeight };')(1080, 1350);
const meas = (t) => t.length * 10;
assert.deepEqual(mod.wrapText(meas, 'aa bb cc', 50), ['aa bb', 'cc']); assert.ok(mod.wrapText(meas, 'abcdefghijklmnop', 50).every((l) => l.length <= 5));
assert.equal(mod.fitText((sz) => (t) => t.length * sz / 2, 'hallo wereld dit is een lange tekst', 300, 100, 80).size <= 80, true);
assert.deepEqual(mod.toCanvasPoint(50, 50, { left: 0, top: 0, width: 100, height: 100 }, 1000, 1000), { x: 500, y: 500 });
assert.ok(mod.hitLayer(100, 100, { x: 100, y: 100, rot: 0 }, 50, 50)); assert.ok(!mod.hitLayer(300, 100, { x: 100, y: 100, rot: 0 }, 50, 50));
assert.equal(mod.canvasHeight(100, 100), 1080); assert.equal(mod.canvasHeight(100, 400), 1350); assert.equal(mod.canvasHeight(400, 10), 200);
console.log('test-meme OK');
