// Node-test voor docs/pixel-core.js. Gebruik: node tools/test-pixel.mjs
import assert from 'node:assert/strict';
import * as P from '../docs/pixel-core.js';

// GIF-decoder (alleen voor de test)
function decodeGif(buf) {
  let p = 6; const W = buf[p] | buf[p + 1] << 8, H = buf[p + 2] | buf[p + 3] << 8; const flags = buf[p + 4]; p += 7;
  const tsize = 1 << ((flags & 7) + 1); const table = []; for (let i = 0; i < tsize; i++) table.push([buf[p++], buf[p++], buf[p++]]);
  const frames = [];
  while (buf[p] !== 0x3b) {
    if (buf[p] === 0x21) { p += 2; while (buf[p]) p += buf[p] + 1; p++; continue; }
    assert.equal(buf[p], 0x2c); p += 10; const min = buf[p++]; const bytes = [];
    while (buf[p]) { for (let i = 0; i < buf[p]; i++) bytes.push(buf[p + 1 + i]); p += buf[p] + 1; } p++;
    const clear = 1 << min, eoi = clear + 1; let size = min + 1, bitpos = 0, dict = [], out = [], prev = null;
    const reset = () => { dict = []; for (let i = 0; i < clear; i++) dict[i] = [i]; dict[clear] = null; dict[eoi] = null; size = min + 1; prev = null; }; reset();
    const read = () => { let v = 0; for (let i = 0; i < size; i++) { v |= ((bytes[(bitpos + i) >> 3] >> ((bitpos + i) & 7)) & 1) << i; } bitpos += size; return v; };
    for (;;) {
      const code = read(); if (code === clear) { reset(); continue; } if (code === eoi) break;
      let entry; if (dict[code]) entry = dict[code]; else entry = prev.concat(prev[0]);
      out.push(...entry); if (prev) dict.push(prev.concat(entry[0])); prev = entry;
      if (dict.length === (1 << size) && size < 12) size++;
    }
    frames.push(out);
  }
  return { W, H, table, frames };
}

// document & lagen
const d = P.newDoc(8);
assert.equal(P.composite(d, 0).filter(Boolean).length, 0);
P.addLayer(d, 'Boven'); d.frames[0][0][0] = '#ff0000'; d.frames[0][1][0] = '#00ff00'; d.frames[0][1][1] = '#0000ff';
assert.equal(P.composite(d, 0)[0], '#00ff00');
d.layers[1].vis = false; assert.equal(P.composite(d, 0)[0], '#ff0000'); assert.equal(P.composite(d, 0)[1], null);
assert.equal(P.composite(d, 0, { all: true })[1], '#0000ff');
d.layers[1].vis = true; assert.equal(P.moveLayer(d, 1, -1), 0); assert.equal(P.composite(d, 0)[0], '#ff0000');
assert.ok(P.dupLayer(d, 0)); assert.equal(d.layers.length, 3); assert.ok(P.mergeDown(d, 2)); assert.equal(d.layers.length, 2);
while (P.addLayer(d)); assert.equal(d.layers.length, P.MAX_LAYERS); assert.ok(!P.addLayer(d));
while (d.layers.length > 1) P.removeLayer(d, 0); assert.ok(!P.removeLayer(d, 0));
assert.equal(P.addFrame(d, 0, true), 1); assert.equal(d.frames[1][0][0] !== undefined, true); assert.equal(P.removeFrame(d, 1), true); assert.equal(P.removeFrame(d, 0), false);
let big = P.newDoc(4); while (P.addFrame(big, 0) > 0); assert.equal(big.frames.length, P.MAX_FRAMES);
assert.equal(P.moveFrame(big, 0, 1), 1);

// vormen
assert.deepEqual(P.linePts(0, 0, 3, 0), [[0, 0], [1, 0], [2, 0], [3, 0]]);
assert.equal(P.linePts(0, 0, 5, 3).length, 6);
assert.equal(P.linePts(2, 2, 2, 2).length, 1);
assert.equal(P.rectPts(0, 0, 3, 3, true).length, 16); assert.equal(P.rectPts(0, 0, 3, 3, false).length, 12);
assert.equal(P.rectPts(3, 3, 0, 0, true).length, 16);
const el = P.ellipsePts(0, 0, 6, 6, true); assert.ok(el.length > 25 && el.length < 49);
const ring = P.ellipsePts(0, 0, 6, 6, false); assert.ok(ring.length < el.length && ring.length > 10);
assert.ok(ring.some(([x, y]) => x === 3 && y === 0));
assert.equal(P.brushPts(5, 5, 3).length, 9); assert.equal(P.brushPts(5, 5, 1).length, 1);
assert.equal(P.mirrorPts([[1, 2]], 8, 'xy').length, 4); assert.deepEqual(P.mirrorPts([[1, 2]], 8, 'x')[1], [6, 2]); assert.equal(P.mirrorPts([[1, 2]], 8, null).length, 1);
const c = P.blank(8); assert.equal(P.putPts(c, 8, [[0, 0], [9, 9], [-1, 0]], '#fff'), 1); assert.equal(c[0], '#fff');
// emmer
const f = P.blank(4); f[5] = '#000'; assert.equal(P.flood(f, 4, 0, 0, '#f00'), 15); assert.equal(f[5], '#000'); assert.equal(P.flood(f, 4, 0, 0, '#f00'), 0);
// selectie
const g = P.blank(4); P.putPts(g, 4, [[1, 1], [2, 1]], '#abc');
const clip = P.copyRegion(g, 4, P.normRect(2, 1, 1, 2)); assert.equal(clip.w, 2); assert.equal(clip.h, 2); assert.equal(clip.cells[0], '#abc');
P.clearRegion(g, 4, P.normRect(1, 1, 2, 1)); assert.equal(g.filter(Boolean).length, 0);
P.pasteRegion(g, 4, clip, 0, 0); assert.equal(g[0], '#abc'); assert.equal(g[1], '#abc');
const g2 = P.blank(4); g2[0] = '#111'; P.pasteRegion(g2, 4, { w: 1, h: 1, cells: [null] }, 0, 0); assert.equal(g2[0], '#111');
assert.equal(P.flipCells(g2, 4, 'x')[3], '#111'); assert.equal(P.flipCells(g2, 4, 'y')[12], '#111'); assert.equal(P.rotateCells(g2, 4)[3], '#111');
assert.equal(P.shiftCells(g2, 4, -1, 0)[3], '#111'); assert.equal(P.shiftCells(g2, 4, -1, 0, false).filter(Boolean).length, 0);
assert.equal(P.replaceColor(g2, '#111', '#222'), 1); assert.equal(g2[0], '#222');
const ol = P.outline(g2, 4, '#000'); assert.equal(ol[1], '#000'); assert.equal(ol[4], '#000'); assert.equal(ol.filter(Boolean).length, 3);
const rs = P.newDoc(4); rs.frames[0][0][5] = '#f00'; P.resizeDoc(rs, 8); assert.equal(rs.n, 8); assert.equal(rs.frames[0][0].length, 64); assert.equal(rs.frames[0][0][1 * 8 + 1], '#f00'); P.resizeDoc(rs, 2); assert.equal(rs.frames[0][0].length, 4);

// opslag
const doc = P.newDoc(16); P.addLayer(doc); P.addFrame(doc, 0, true);
doc.frames[0][0][3] = '#123456'; doc.frames[1][1][20] = '#ef4444'; doc.frames[1][0][255] = '#ffffff';
const enc = P.encodeDoc(doc, 'test'); assert.equal(enc.v, 2); const json = JSON.parse(JSON.stringify(enc));
const back = P.decodeDoc(json); assert.deepEqual(back.frames, doc.frames); assert.equal(back.layers.length, 2); assert.equal(back.n, 16);
// oud formaat
const old = P.decodeDoc({ size: 8, cells: Array(64).fill(null).map((_, i) => (i === 0 ? 4 : i === 1 ? '#00ff00' : null)), at: 1 });
assert.equal(old.frames[0][0][0], P.PALETTE[4]); assert.equal(old.frames[0][0][1], '#00ff00'); assert.equal(old.layers.length, 1);
assert.equal(P.rleDecode(P.rleEncode([null, null, 'a', 'a'], ['a']), ['a'], 4).join(), ',,a,a');
assert.equal(P.fitGallery(Array(50).fill({ x: 1 })).length, 40);
assert.ok(JSON.stringify(enc.cells).length > 0);

// spritesheet
const sd = P.newDoc(4); P.addFrame(sd, 0); P.addFrame(sd, 1); P.addFrame(sd, 2); sd.frames[2][0][0] = '#f00';
const sh = P.spritesheet(sd, 2); assert.equal(sh.w, 8); assert.equal(sh.h, 8); assert.equal(sh.cells[0 * 8 + 4 * 0 + 0], null); assert.equal(sh.cells[0 + 4 * 8], '#f00');
assert.deepEqual(P.sheetLayout(10, 4), { cols: 4, rows: 3 }); assert.deepEqual(P.sheetLayout(3, 9), { cols: 3, rows: 1 });

// sjablonen
for (const t of P.TEMPLATES) { assert.equal(t.rows.length, 16, t.name); t.rows.forEach((r, i) => assert.equal(r.length, 16, t.name + ' regel ' + i)); const td = P.templateDoc(t); const used = new Set(t.rows.join('').replace(/\./g, '')); for (const ch of used) assert.ok(t.key[ch], `${t.name}: ${ch}`); assert.ok(P.countColors(td.frames[0][0]) >= 2); }
assert.ok(P.TEMPLATES.length >= 8 && P.PALETTES.length >= 8);
for (const [, cols] of P.PALETTES) cols.forEach((h) => assert.ok(/^#[0-9a-f]{6}$/i.test(h), h));

// GIF round trip
const gd = P.newDoc(8); gd.frames[0][0][0] = '#ff0000'; gd.frames[0][0][9] = '#00ff00'; P.addFrame(gd, 0, true); gd.frames[1][0][1] = '#0000ff';
const gif = P.gifFromDoc(gd, 2); assert.equal(String.fromCharCode(...gif.slice(0, 6)), 'GIF89a'); assert.equal(gif[gif.length - 1], 0x3b);
const dec = decodeGif(gif); assert.equal(dec.W, 16); assert.equal(dec.H, 16); assert.equal(dec.frames.length, 2);
const rgb = (fr, x, y) => dec.table[fr[y * 16 + x]];
assert.deepEqual(rgb(dec.frames[0], 0, 0), [255, 0, 0]); assert.deepEqual(rgb(dec.frames[0], 3, 3), [0, 255, 0]); assert.equal(dec.frames[0][5 * 16 + 9], 0);
assert.deepEqual(rgb(dec.frames[1], 2, 0), [0, 0, 255]);
// groot beeld met veel kleuren (LZW-tabel loopt vol) en veel unieke kleuren (kubus)
const rnd = (() => { let s = 7; return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; })();
const cells = Array.from({ length: 64 * 64 }, () => P.rgbHex(rnd() * 256, rnd() * 256, rnd() * 256));
const gif2 = P.encodeGif(64, 64, [{ cells, delay: 5 }], { scale: 1 }); const d2 = decodeGif(gif2); assert.equal(d2.frames[0].length, 4096);
const near = (a, b) => Math.abs(a - b) <= 26; let okc = 0; cells.forEach((h, i) => { const [r, gg, b] = P.hexRgb(h), t = d2.table[d2.frames[0][i]]; if (near(r, t[0]) && near(gg, t[1]) && near(b, t[2])) okc++; }); assert.equal(okc, 4096);
const plain = Array.from({ length: 128 * 128 }, (_, i) => (i % 7 === 0 ? '#111111' : i % 5 === 0 ? '#eeeeee' : null));
const d3 = decodeGif(P.encodeGif(128, 128, [{ cells: plain, delay: 5 }])); d3.frames[0].forEach((v, i) => assert.equal(v === 0, plain[i] === null)); 
console.log('test-pixel OK');
