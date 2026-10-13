// Tests voor de pure logica van docs/foto-edit.js + rooktest met nep-DOM.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, '..', 'docs', 'foto-edit.js');
const M = await import(pathToFileURL(src).href);

// ratio / crop
assert.equal(M.ratioValue('1:1', 100, 50), 1);
assert.equal(M.ratioValue('orig', 200, 100), 2);
assert.equal(M.ratioValue('free', 1, 1), 0);
let r = M.fitCrop(1, 400, 300); assert.deepEqual(r, { x: 50, y: 0, w: 300, h: 300 });
r = M.fitCrop(16 / 9, 400, 400); assert.ok(Math.abs(r.w / r.h - 16 / 9) < 1e-9 && r.w === 400);
assert.deepEqual(M.fitCrop(0, 10, 20), { x: 0, y: 0, w: 10, h: 20 });
// rechtzetten
assert.equal(M.coverScale(0, 100, 50), 1);
const s45 = M.coverScale(45, 100, 100); assert.ok(Math.abs(s45 - Math.SQRT2) < 1e-9);
assert.ok(M.coverScale(10, 200, 100) > 1);
// hoek slepen
let c = M.dragCorner({ x: 100, y: 100, w: 100, h: 100 }, 'se', 400, 300, 0, 500, 500);
assert.deepEqual(c, { x: 100, y: 100, w: 300, h: 200 });
c = M.dragCorner({ x: 100, y: 100, w: 100, h: 100 }, 'nw', -50, -50, 0, 500, 500);
assert.deepEqual(c, { x: 0, y: 0, w: 200, h: 200 });
c = M.dragCorner({ x: 100, y: 100, w: 100, h: 100 }, 'se', 400, 300, 2, 500, 500);
assert.ok(Math.abs(c.w / c.h - 2) < 1e-9 && c.x === 100 && c.x + c.w <= 500 && c.y + c.h <= 500);
c = M.dragCorner({ x: 100, y: 100, w: 100, h: 100 }, 'se', 101, 101, 0, 500, 500); assert.ok(c.w >= 40 && c.h >= 40);
assert.deepEqual(M.dragEdge({ x: 10, y: 10, w: 100, h: 100 }, 'e', 300, 0, 200, 200), { x: 10, y: 10, w: 190, h: 100 });
assert.deepEqual(M.dragEdge({ x: 10, y: 10, w: 100, h: 100 }, 'n', 0, -5, 200, 200), { x: 10, y: 0, w: 100, h: 110 });
assert.deepEqual(M.moveRect({ x: 10, y: 10, w: 100, h: 100 }, 500, -500, 200, 200), { x: 100, y: 0, w: 100, h: 100 });
// lagen meetransformeren: 90 graden rechtsom op 200x100 canvas
const st = { layers: [{ x: 0.5, y: 0.25, size: 0.2, rot: 0.1 }], strokes: [{ w: 0.01, p: [0.1, 0.1, 0.2, 0.2] }] };
const o = M.transformLayers(st, { f: (x, y) => [100 - y, x], k: 1, rot: Math.PI / 2, refl: false, oldW: 200, newW: 100 });
// oud px (100,50) -> nieuw (50,100) -> eenheden (0.5, 1)
assert.ok(Math.abs(o.layers[0].x - 0.5) < 1e-3 && Math.abs(o.layers[0].y - 1) < 1e-3);
assert.ok(Math.abs(o.layers[0].size - 0.4) < 1e-9 && Math.abs(o.layers[0].rot - (0.1 + Math.PI / 2)) < 1e-9);
assert.ok(Math.abs(o.strokes[0].w - 0.02) < 1e-9);
assert.equal(st.layers[0].x, 0.5, 'origineel niet aangepast');
const fl = M.transformLayers(st, { f: (x, y) => [200 - x, y], k: 1, rot: 0, refl: true, oldW: 200, newW: 200 });
assert.ok(Math.abs(fl.layers[0].x - 0.5) < 1e-3 && Math.abs(fl.layers[0].rot + 0.1) < 1e-9);
// frames
assert.ok(M.FRAME_IDS.length >= 13);
for (const id of M.FRAME_IDS) {
  for (const t of [0, 40, 100]) {
    const L = M.frameLayout(id, 800, 600, t);
    assert.ok(L.W >= 1 && L.H >= 1 && L.iw === 800 && L.ih === 600, id);
    if (id !== 'circle' && id !== 'heart') assert.ok(L.W >= 800 && L.H >= 600, id);
    else assert.equal(L.W, 600);
  }
}
assert.ok(M.frameLayout('wide', 800, 600, 100).W > M.frameLayout('wide', 800, 600, 0).W);
// geschiedenis: max 21 en max 9 verschillende canvassen
const shared = {}; const mkh = (n, uniq) => Array.from({ length: n }, (_, i) => ({ base: uniq ? { id: i } : shared, j: '' + i }));
let h = mkh(30, false), hi = M.pruneHist(h, 29); assert.equal(h.length, 21); assert.equal(hi, 20);
h = mkh(15, true); hi = M.pruneHist(h, 14); assert.equal(new Set(h.map((e) => e.base)).size, 9); assert.equal(hi, 8);
// weergave
const v = M.clampView({ z: 1, px: 999, py: 999 }, 300, 300, 288, 200); assert.equal(v.px, 0); assert.equal(v.py, 0);
const v2 = M.clampView({ z: 4, px: 9999, py: -9999 }, 300, 300, 1000, 800); assert.ok(v2.px === (1000 - 300) / 2 + 40 && v2.py === -((800 - 300) / 2 + 40));
const bx = M.fitBox(300, 300, 1000, 500, { z: 1, px: 0, py: 0 }); assert.ok(bx.w <= 300 && bx.h === bx.w / 2 && Math.abs(bx.x + bx.w / 2 - 150) < 1e-9);
assert.equal(M.overlayOffset(0, 100, 100, 10), 0);
assert.equal(M.overlayOffset(0, 100, 200, 50), -1);
assert.ok(Math.abs(M.overlayOffset(0, 100, 300, 50) + 0.5) < 1e-9);
console.log('pure logica OK');

// ---- rooktest met nep-DOM ----
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-'));
fs.copyFileSync(src, path.join(tmp, 'foto-edit.js'));
fs.copyFileSync(path.join(here, 'foto-filters-stub.mjs'), path.join(tmp, 'foto-filters.js'));
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}');
const ctr = { fill: 0, draw: 0 };
const mkEl = (tag) => {
  const reg = {};
  const t = {
    tag, width: 300, height: 150, listeners: {}, innerHTML: '', textContent: '', value: '', files: [], dataset: {}, style: {}, classList: { add() {}, remove() {}, toggle() {} },
    addEventListener(n, f) { (this.listeners[n] = this.listeners[n] || []).push(f); }, removeEventListener() {}, remove() {}, appendChild() {}, setAttribute() {}, click() {}, contains: () => true, closest() { return null; },
    querySelector(sel) { return reg[sel] || (reg[sel] = mkEl('x')); }, querySelectorAll() { return []; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 360, height: 400 }; }, setPointerCapture() {}, scrollIntoView() {},
    toBlob(cb) { cb({ type: 'image/png', size: 5 }); },
  };
  t.getContext = () => t.__ctx || (t.__ctx = new Proxy({ canvas: t }, { get(o, k) { if (k in o) return o[k]; if (k === 'measureText') return () => ({ width: 40 }); if (k === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) }); if (k === 'createPattern') return () => ({}); return () => {}; }, set(o, k, v) { o[k] = v; return true; } }));
  return t;
};
globalThis.document = { createElement: mkEl, head: { appendChild() {} }, body: { appendChild() {} }, addEventListener() {}, removeEventListener() {} };
globalThis.window = { addEventListener() {}, removeEventListener() {}, devicePixelRatio: 2 };
globalThis.requestAnimationFrame = (f) => setTimeout(f, 0);
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.URL.createObjectURL = () => 'blob:x'; globalThis.URL.revokeObjectURL = () => {};
globalThis.Image = class { set src(v) { this.naturalWidth = 3000; this.naturalHeight = 2000; setTimeout(() => this.onload && this.onload(), 0); } };
globalThis.File = class { constructor(p, n, o) { this.name = n; this.type = o.type; } };
const view = mkEl('div');
const clean = [];
const E = await import(pathToFileURL(path.join(tmp, 'foto-edit.js')).href);
const H = {};
E.fotoEditView({ view, esc: (s) => s, uid: () => 'x', addCleanup: (f) => clean.push(f), __test: H });
await new Promise((r) => setTimeout(r, 50));
assert.ok(/Kies een foto/.test(view.innerHTML), 'startscherm: ' + String(view.innerHTML).slice(0, 300));
await H.openFiles([{ name: 'a.jpg', type: 'image/jpeg' }, { name: 'b.jpg', type: 'image/jpeg' }]);
await new Promise((r) => setTimeout(r, 50));
const { S, T, TOOLS } = H;
assert.ok(S.base && S.base.width === 2000 && S.base.height === 1333, 'foto geladen ' + (S.base && S.base.width));
assert.equal(S.queue.length, 1);
assert.ok(S.small.width <= 1000);
const wait = () => new Promise((r) => setTimeout(r, 10));
for (const t of Object.keys(TOOLS)) {
  H.setTool(t); await wait();
  assert.ok(typeof TOOLS[t].html() === 'string', t);
}
// pointer-gebaren op het canvas
const cv = H.getCv();
const ev = (id, x, y, extra) => Object.assign({ pointerId: id, clientX: x, clientY: y, pointerType: 'touch', button: 0, preventDefault() {} }, extra);
const pd = (e) => H.onDown(e), pm = (e) => H.onMove(e), pu = (e) => H.onUp(e);
const call = async (tool, fn) => { H.setTool(tool); await wait(); fn(); await wait(); };
await call('draw', () => { pd(ev(1, 100, 150)); pm(ev(1, 150, 200)); pm(ev(1, 200, 220)); pu(ev(1, 200, 220)); });
assert.equal(S.strokes.length, 1); assert.ok(S.strokes[0].p.length >= 4);
H.undo(); assert.equal(S.strokes.length, 0); H.redo(); assert.equal(S.strokes.length, 1);
await call('text', () => { TOOLS.text.act('tadd', { dataset: {} }, 'click'); });
assert.equal(S.layers.length, 1); assert.equal(S.layers[0].type, 'text');
await call('stk', () => { TOOLS.stk.act('sdraw', { dataset: { v: 'heart' } }, 'click'); TOOLS.stk.act('semo', { dataset: { v: '🎉' } }, 'click'); });
assert.equal(S.layers.length, 3);
const L = S.layers[2]; const gm0 = S.box;
pd(ev(1, 180, 200)); pm(ev(1, 200, 210)); pu(ev(1, 200, 210));
pd(ev(1, 100, 100)); pd(ev(2, 200, 100)); pm(ev(2, 260, 100)); pu(ev(2, 260, 100)); pu(ev(1, 100, 100));
await call('crop', () => {});
TOOLS.crop.act('ratio', { dataset: { v: '1:1' } }, 'click');
TOOLS.crop.act('ang', { value: '5' }, 'input');
const before = S.base.width;
H.applyCrop(); await wait();
assert.ok(S.base.width !== before || S.base.height !== 1333, 'crop toegepast');
assert.equal(S.layers.length, 3);
await H.bakeGeom('rr'); await wait();
await H.bakeGeom('fh'); await wait();
for (const id of ['thin', 'wide', 'polaroid', 'film', 'round', 'double', 'circle', 'heart', 'wave', 'postcard', 'shadow', 'stamp', 'mat']) {
  TOOLS.frame.act('fr', { dataset: { v: id } }, 'click'); const o = H.renderFull(); assert.ok(o.width > 0, id);
}
TOOLS.adj.act('brightness', { value: '30' }, 'input'); TOOLS.adj.act('brightness', {}, 'change');
await call('brush', () => { pd(ev(1, 100, 150)); pm(ev(1, 150, 200)); pu(ev(1, 150, 200)); });
await call('pop', () => { pd(ev(1, 100, 150)); pu(ev(1, 100, 150)); });
assert.ok(S.pend && S.pend.type === 'pop'); TOOLS.pop.act('papply', {}, 'click');
await call('tilt', () => { pd(ev(1, 100, 150)); pm(ev(1, 100, 220)); pu(ev(1, 100, 220)); });
TOOLS.tilt.act('tapply', {}, 'click');
H.onWheel({ clientX: 100, clientY: 100, deltaY: -200, preventDefault() {} });
assert.ok(S.view.z > 1);
await H.saveOut(false);
const blob = await H.exportBlob(); assert.ok(blob);
for (let i = 0; i < 30; i++) { H.S.adj.contrast = i; H.commit(); }
assert.ok(S.hist.length <= 21);
await wait(); assert.ok(!/mislukt/.test(view.querySelector('#fe-msg').textContent), 'fout: ' + view.querySelector('#fe-msg').textContent);
clean.forEach((f) => f());
console.log('rooktest OK');
