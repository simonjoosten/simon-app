// Tests voor docs/foto-collage-free.js.  Gebruik:  node tools/test-foto-collage-free.mjs
// Deel 1: pure logica (filters, snap, uitlijnen, verdelen, indeling, historie, export-grootte, vormen).
// Deel 2: rooktest met een kleine nep-DOM: de hele view opbouwen en alle knoppen/tabs/gebaren doorlopen.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/* ---------- nep-DOM ---------- */
const ops = []; // tekenopdrachten die niet crashen
function mkCtx(cv) {
  const st = { fillStyle: '#000', font: '10px sans-serif' };
  return new Proxy(st, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'canvas') return cv;
      if (k === 'measureText') return (s) => ({ width: String(s).length * 10 });
      if (k === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (k === 'createPattern') return () => ({});
      if (k === 'getImageData') return (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)).fill(128), width: w, height: h });
      return (...a) => { ops.push(String(k)); };
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}
class El {
  constructor(tag) { this.tagName = String(tag).toUpperCase(); this.children = []; this.style = { cssText: '' }; this.attrs = {}; this._l = {}; this._cls = new Set(); this.width = 300; this.height = 150; this._text = ''; this.value = ''; this.parentNode = null; this.isConnected = true; this.clientWidth = 380; this.offsetHeight = 44; this.scrollTop = 0; this.offsetTop = 0; }
  get classList() { const s = this._cls; return { add: (c) => s.add(c), remove: (c) => s.delete(c), toggle: (c, f) => { if (f === undefined ? !s.has(c) : f) s.add(c); else s.delete(c); }, contains: (c) => s.has(c) }; }
  set className(v) { this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className() { return [...this._cls].join(' '); }
  set textContent(v) { this._text = String(v); this.children = []; } get textContent() { return this._text + this.children.map((c) => c.textContent || '').join(''); }
  set innerHTML(v) { this.children = []; this._text = ''; } get innerHTML() { return ''; }
  appendChild(c) { if (c && c.parentNode) c.parentNode.children = c.parentNode.children.filter((x) => x !== c); if (c) c.parentNode = this; this.children.push(c); return c; }
  setAttribute(k, v) { this.attrs[k] = v; } getAttribute(k) { return this.attrs[k]; }
  addEventListener(t, f) { (this._l[t] = this._l[t] || []).push(f); } removeEventListener(t, f) { this._l[t] = (this._l[t] || []).filter((x) => x !== f); }
  fire(t, ev) { const e = Object.assign({ preventDefault() {}, stopPropagation() {}, target: this, currentTarget: this }, ev); (this._l[t] || []).forEach((f) => f(e)); }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter((x) => x !== this); }
  getBoundingClientRect() { return { left: 0, top: 0, width: this.clientWidth, height: 300, right: this.clientWidth, bottom: 300 }; }
  querySelector() { return null; } querySelectorAll() { return []; }
  getContext() { return (this._ctx = this._ctx || mkCtx(this)); }
  toDataURL() { return 'data:image/png;base64,AAAA'; }
  toBlob(cb) { cb({ size: 3, type: 'image/png', arrayBuffer: async () => new ArrayBuffer(3) }); }
  setPointerCapture() {} focus() {} click() {}
}
const docEl = new El('html');
globalThis.document = { createElement: (t) => new El(t), createTextNode: (s) => ({ textContent: String(s) }), head: new El('head'), body: new El('body'), documentElement: docEl };
const win = new El('window'); win.innerHeight = 800; win.scrollY = 0; win.devicePixelRatio = 2;
globalThis.window = new Proxy(win, { get: (t, k) => (k in t ? t[k] : globalThis[k]) });
globalThis.getComputedStyle = () => ({ getPropertyValue: () => '#6366f1' });
globalThis.requestAnimationFrame = (f) => setTimeout(() => f(performance.now()), 0);
globalThis.cancelAnimationFrame = (t) => clearTimeout(t);
try { globalThis.navigator = { canShare: () => false }; } catch (e) { /* node nieuw: read-only */ }
globalThis.localStorage = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); } };
globalThis.URL.createObjectURL = () => 'blob:x'; globalThis.URL.revokeObjectURL = () => {};
globalThis.Image = class { constructor() { this.naturalWidth = 400; this.naturalHeight = 300; this.width = 400; this.height = 300; } set src(v) { setTimeout(() => this.onload && this.onload(), 0); } };
globalThis.File = class { constructor(p, n, o) { this.name = n; this.type = o && o.type; } };

const M = await import(pathToFileURL(path.join(here, '..', 'docs', 'foto-collage-free.js')).href);
let n = 0; const ok = (name, fn) => { fn(); n++; };
const near = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) <= e, `${a} != ${b}`);

/* ---------- deel 1: pure logica ---------- */
ok('exports', () => { for (const k of ['collageFreeView', 'adjustPixels', 'computeSnap', 'alignBoxes', 'distributeBoxes', 'autoLayout', 'makeHistory', 'fitExport', 'shapePath', 'drawArt', 'drawTile', 'bboxOf', 'toLocal', 'toWorld', 'limitSide']) assert.equal(typeof M[k], 'function', k); });
ok('aantallen', () => { assert.ok(M.MASKS.length >= 13); assert.ok(M.FILTERS.length >= 11); assert.ok(M.FONTS.length >= 12); assert.ok(M.PATTERNS.length >= 12); assert.ok(M.EMOJI.length >= 60); assert.equal(M.ARTS.length >= 20, true); assert.equal(new Set(M.EMOJI).size, M.EMOJI.length); });
ok('filters', () => {
  const mk = () => new Uint8ClampedArray([200, 100, 50, 255, 10, 20, 30, 0]);
  for (const [f] of M.FILTERS) { const d = mk(); M.adjustPixels(d, { filter: f, amt: 100 }); assert.equal(d[3], 255); assert.equal(d[7], 0); assert.equal(d[4], 10); }
  let d = mk(); M.adjustPixels(d, { filter: 'bw' }); assert.ok(d[0] === d[1] && d[1] === d[2]);
  d = mk(); M.adjustPixels(d, { filter: 'none' }); assert.deepEqual([...d], [200, 100, 50, 255, 10, 20, 30, 0]);
  d = mk(); M.adjustPixels(d, { filter: 'sepia', amt: 0 }); assert.deepEqual([...d.slice(0, 3)], [200, 100, 50]);
  d = mk(); M.adjustPixels(d, { filter: 'none', bright: 50 }); assert.ok(d[0] > 200 && d[2] > 50);
  d = mk(); M.adjustPixels(d, { filter: 'none', sat: -100 }); assert.ok(d[0] === d[1] && d[1] === d[2]);
  d = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]); M.adjustPixels(d, { filter: 'duo', duoA: '#ff0000', duoB: '#0000ff' }); assert.deepEqual([...d.slice(0, 3)], [255, 0, 0]); assert.deepEqual([...d.slice(4, 7)], [0, 0, 255]);
  const plain = [250, 250, 250, 255]; M.adjustPixels(plain, { filter: 'vivid', contrast: 100 }); assert.ok(plain.every((v) => v <= 255 && v >= 0));
});
ok('hex en kleur', () => { assert.deepEqual(M.hexToRgb('#fff'), [255, 255, 255]); assert.deepEqual(M.hexToRgb('#102030'), [16, 32, 48]); assert.deepEqual(M.hexToRgb('zzz'), [0, 0, 0]); assert.equal(M.rgbToHex(255, 0, 16), '#ff0010'); assert.equal(M.shade('#808080', -1), '#000000'); assert.equal(M.shade('#808080', 1), '#ffffff'); });
ok('rng deterministisch', () => { const a = M.rng(5), b = M.rng(5); for (let i = 0; i < 5; i++) assert.equal(a(), b()); });
ok('bbox en lokaal/wereld', () => {
  const o = { x: 100, y: 50, w: 40, h: 20, rot: Math.PI / 2, flip: false }; const b = M.bboxOf(o); near(b.l, 90); near(b.r, 110); near(b.t, 30); near(b.b, 70);
  for (const flip of [false, true]) { const p = { x: 10, y: 20, w: 30, h: 40, rot: .7, flip }; const w = M.toWorld(p, 5, -7), l = M.toLocal(p, w[0], w[1]); near(l[0], 5); near(l[1], -7); }
  assert.ok(M.pointInObj({ x: 0, y: 0, w: 10, h: 10, rot: 0 }, 4, 4)); assert.ok(!M.pointInObj({ x: 0, y: 0, w: 10, h: 10, rot: 0 }, 9, 0)); assert.ok(M.pointInObj({ x: 0, y: 0, w: 10, h: 10, rot: 0 }, 9, 0, 5));
});
ok('snap', () => {
  const lines = { xs: [0, 500, 1000], ys: [0, 500, 1000] };
  let r = M.computeSnap({ l: 440, r: 540, t: 100, b: 200 }, lines, 10); near(r.dx, 10); near(r.dy, 0); assert.deepEqual(r.gx, [500]); assert.deepEqual(r.gy, []);
  r = M.computeSnap({ l: 100, r: 200, t: 100, b: 200 }, lines, 10); assert.equal(r.dx, 0); assert.equal(r.gx.length, 0);
  r = M.computeSnap({ l: 3, r: 103, t: 497, b: 597 }, lines, 10); near(r.dx, -3); near(r.dy, 3);
  r = M.computeSnap({ l: 920, r: 1006, t: 0, b: 50 }, lines, 10); near(r.dx, -6); assert.deepEqual(r.gx, [1000]);
});
ok('uitlijnen', () => {
  const b = [{ l: 10, r: 50, t: 10, b: 30 }, { l: 100, r: 120, t: 60, b: 100 }], u = M.unionBox(b);
  assert.deepEqual(u, { l: 10, r: 120, t: 10, b: 100 });
  let d = M.alignBoxes(b, 'left', u); assert.equal(d[0].dx, 0); assert.equal(d[1].dx, -90);
  d = M.alignBoxes(b, 'right', u); assert.equal(d[0].dx, 70); assert.equal(d[1].dx, 0);
  d = M.alignBoxes(b, 'center', u); near(b[0].l + d[0].dx + 20, 65); near(b[1].l + d[1].dx + 10, 65);
  d = M.alignBoxes(b, 'top', u); assert.equal(d[1].dy, -50); d = M.alignBoxes(b, 'bottom', u); assert.equal(d[0].dy, 70);
  d = M.alignBoxes([b[0]], 'center', { l: 0, r: 1000, t: 0, b: 1000 }); near(30 + d[0].dx, 500);
});
ok('verdelen', () => {
  const b = [{ l: 0, r: 10, t: 0, b: 10 }, { l: 20, r: 30, t: 0, b: 10 }, { l: 100, r: 110, t: 0, b: 10 }, { l: 40, r: 70, t: 0, b: 10 }];
  const d = M.distributeBoxes(b, 'x'); const pos = b.map((x, i) => ({ l: x.l + d[i].dx, r: x.r + d[i].dx })).sort((p, q) => p.l - q.l);
  const gaps = []; for (let i = 1; i < pos.length; i++) gaps.push(pos[i].l - pos[i - 1].r); near(gaps[0], gaps[1]); near(gaps[1], gaps[2]); assert.equal(pos[0].l, 0); assert.equal(pos[3].r, 110);
  assert.deepEqual(M.distributeBoxes(b.slice(0, 2), 'x'), [{ dx: 0, dy: 0 }, { dx: 0, dy: 0 }]);
});
ok('auto-indeling', () => {
  for (const [W, H] of [[1000, 1000], [1000, 1778], [1000, 562], [1000, 1250]]) for (let cnt = 1; cnt <= 24; cnt++) {
    const c = M.autoLayout(cnt, W, H, 14, 24, 1.3); assert.equal(c.length, cnt);
    c.forEach((r) => { assert.ok(r.w > 0 && r.h > 0); assert.ok(r.x - r.w / 2 >= 24 - 1e-6 && r.x + r.w / 2 <= W - 24 + 1e-6, `x ${cnt}`); assert.ok(r.y - r.h / 2 >= 24 - 1e-6 && r.y + r.h / 2 <= H - 24 + 1e-6, `y ${cnt}`); });
    for (let i = 0; i < cnt; i++) for (let j = i + 1; j < cnt; j++) { const a = c[i], b = c[j]; const ox = Math.min(a.x + a.w / 2, b.x + b.w / 2) - Math.max(a.x - a.w / 2, b.x - b.w / 2), oy = Math.min(a.y + a.h / 2, b.y + b.h / 2) - Math.max(a.y - a.h / 2, b.y - b.h / 2); assert.ok(!(ox > 0.01 && oy > 0.01), `overlap ${cnt}`); }
  }
  assert.deepEqual(M.autoLayout(0, 100, 100, 5, 5, 1), []);
  const two = M.autoLayout(2, 1000, 500, 10, 10, 1); assert.equal(two[0].y, two[1].y);
});
ok('historie', () => {
  const h = M.makeHistory(30); assert.ok(!h.canUndo()); h.push('a'); assert.ok(!h.push('a')); h.push('b'); h.push('c'); assert.equal(h.undo(), 'b'); assert.equal(h.undo(), 'a'); assert.equal(h.undo(), null); assert.equal(h.redo(), 'b'); h.push('d'); assert.ok(!h.canRedo()); assert.equal(h.undo(), 'b');
  const g = M.makeHistory(30); for (let i = 0; i < 100; i++) g.push('s' + i); assert.equal(g.stack.length, 31); let steps = 0; while (g.undo() !== null) steps++; assert.equal(steps, 30);
});
ok('export en foto-limiet', () => {
  assert.deepEqual(M.fitExport(1080, 1080), { w: 1080, h: 1080, scaled: false });
  const f = M.fitExport(4096, 7282); assert.ok(f.scaled && f.w * f.h <= 16e6 && f.w < 4096); const g = M.fitExport(4096, 4096); assert.ok(g.w * g.h <= 16e6);
  assert.equal(M.limitSide(1), 2000); assert.ok(M.limitSide(10) < 2000); assert.ok(M.limitSide(20) <= M.limitSide(10));
});
ok('vormen en tekeningen crashen niet', () => {
  const c = mkCtx(null);
  for (const [k] of M.MASKS) M.shapePath(c, k, 100, 80, 10);
  for (const a of M.ARTS) M.drawArt(c, a[0], a[2], 100, 100 / a[3]);
  for (const [k] of M.PATTERNS) { const t = new El('canvas'); t.width = 64; t.height = 64; M.drawTile(t, k, '#fff', '#000'); }
  assert.ok(ops.length > 100);
});

/* ---------- deel 2: rooktest met nep-DOM ---------- */
const walk = (e, f) => { f(e); (e.children || []).forEach((c) => walk(c, f)); };
const find = (root, pred) => { const r = []; walk(root, (e) => { if (e.tagName && pred(e)) r.push(e); }); return r; };
const click = (root, text) => { const b = find(root, (e) => e.tagName === 'BUTTON' && e.textContent.indexOf(text) >= 0)[0]; assert.ok(b, 'knop ' + text); b.onclick && b.onclick(); return b; };
const ev0 = (x, y) => ({ pointerId: 1, clientX: x, clientY: y, button: 0, pointerType: 'touch' });
const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms));
{
  const view = new El('div'); view.innerHTML = ''; const cleanups = []; const errs = [];
  process.on('uncaughtException', (e) => { errs.push(e); });
  M.collageFreeView({ view, esc: (s) => s, uid: 'u1', addCleanup: (f) => cleanups.push(f) });
  const root = view.children[0]; assert.ok(root, 'root');
  const stage = find(root, (e) => e.className === 'cf-stage')[0]; assert.ok(stage);
  await tick();
  // alle tabs doorlopen en dingen toevoegen
  click(root, '➕ Nieuw'); const panel = find(root, (e) => e.className === 'cf-panel')[0]; assert.ok(panel.children.length > 5);
  const grid = find(panel, (e) => e.className === 'cf-grid');
  grid[0].children[3].onclick(); grid[0].children[0].onclick(); // 2 vormen
  grid[1].children[5].onclick(); grid[1].children[1] && 0; // emoji
  grid[2].children.forEach((b) => b.onclick()); // alle getekende stickers
  find(panel, (e) => e.tagName === 'BUTTON' && /^Titel$/.test(e.textContent))[0].onclick();
  click(root, '➕ Nieuw'); if (panel.children.length < 5) click(root, '➕ Nieuw');
  find(panel, (e) => e.tagName === 'BUTTON' && /^Gebogen$/.test(e.textContent))[0].onclick();
  click(root, '➕ Nieuw'); if (find(panel, (e) => /^Stippellijn$/.test(e.textContent)).length === 0) click(root, '➕ Nieuw');
  click(panel, 'Pijl'); click(panel, 'Stippellijn');
  await tick();
  for (const t of ['⚙️ Aanpassen', '📚 Lagen', '🖼 Pagina', '📐 Indelen', '💾 Collages', '➕ Nieuw']) { click(root, t); await tick(); }
  // pagina: formaat en achtergronden
  click(root, '🖼 Pagina'); for (const f of ['4:5', '9:16', '3:2', '16:9', 'Vrij', '1:1']) { click(panel, f); }
  for (const t of ['Verloop', 'Patroon', 'Foto', 'Kleur']) { click(panel, t); await tick(); }
  click(panel, 'Patroon'); for (const [, label] of M.PATTERNS) { click(panel, label); await tick(1); }
  // foto's: 3 stuks laden (netjes ingedeeld), daarna 2 extra (waaier), masker + filters
  stage.fire('drop', { dataTransfer: { files: [1, 2, 3].map((i) => ({ type: 'image/jpeg', name: 'f' + i + '.jpg' })) } }); await tick(60);
  stage.fire('drop', { dataTransfer: { files: [4, 5].map((i) => ({ type: 'image/jpeg', name: 'f' + i + '.jpg' })) } }); await tick(60);
  stage.fire('drop', { dataTransfer: { files: [{ type: 'text/plain', name: 'x.txt' }] } }); await tick(10);
  click(root, '⚙️ Aanpassen'); if (!find(panel, (e) => e.textContent === 'Sepia').length) click(root, '⚙️ Aanpassen');
  for (const [, label] of M.FILTERS) { const b = find(panel, (e) => e.tagName === 'BUTTON' && e.textContent === label)[0]; if (b) { b.onclick(); await tick(2); } }
  find(panel, (e) => e.className.indexOf('cf-gi') >= 0 && e.attrs.title === 'Hart')[0].onclick(); await tick(5);
  click(root, '✂️ Bijsnijden'); stage.fire('pointerdown', ev0(190, 200)); stage.fire('pointermove', ev0(230, 220)); stage.fire('pointerup', ev0(230, 220)); stage.fire('wheel', { deltaY: -200 }); click(root, 'Klaar ✓');
  click(root, '🖼 Pagina'); click(panel, 'Foto'); await tick();
  // gebaren: tik, sleep, pinch, wiel, toetsen
  const ev = (id, x, y) => ({ pointerId: id, clientX: x, clientY: y, button: 0, pointerType: 'touch' });
  const cx = 190, cy = 200;
  for (let i = 0; i < 3; i++) { stage.fire('pointerdown', ev(1, cx + i * 3, cy)); stage.fire('pointermove', ev(1, cx + 40, cy + 30)); stage.fire('pointerup', ev(1, cx + 40, cy + 30)); await tick(); }
  stage.fire('pointerdown', ev(1, cx, cy)); stage.fire('pointerup', ev(1, cx, cy)); stage.fire('pointerdown', ev(1, cx, cy)); stage.fire('pointerup', ev(1, cx, cy)); // dubbel-tik
  stage.fire('pointerdown', ev(1, cx, cy)); stage.fire('pointerdown', ev(2, cx + 60, cy)); stage.fire('pointermove', ev(2, cx + 120, cy + 30)); stage.fire('pointerup', ev(2, cx + 120, cy)); stage.fire('pointerup', ev(1, cx, cy));
  stage.fire('wheel', { deltaY: -120, shiftKey: false }); stage.fire('wheel', { deltaY: 60, shiftKey: true });
  win.fire('keydown', { key: 'ArrowRight', target: new El('div') }); win.fire('keydown', { key: 'd', metaKey: true, target: new El('div') }); win.fire('keydown', { key: 'z', metaKey: true, target: new El('div') });
  // tekenen
  click(root, '✏️ Tekenen'); await tick(); stage.fire('pointerdown', ev(1, 100, 100)); for (let i = 0; i < 20; i++) stage.fire('pointermove', ev(1, 100 + i * 5, 100 + i * 3)); stage.fire('pointerup', ev(1, 200, 160)); click(root, 'Klaar ✓'); await tick();
  // balk-knoppen bij selectie
  stage.fire('pointerdown', ev(1, cx + 40, cy + 30)); stage.fire('pointerup', ev(1, cx + 40, cy + 30));
  for (const t of ['⧉ Kopie', '↔ Spiegel', '⤒ Voorop', '▲', '▼', '⤓ Achteraan', '🔒', '🔓', '⚙️ Aanpassen']) { const bs = find(root, (e) => e.tagName === 'BUTTON' && e.textContent.indexOf(t) >= 0); if (bs[0]) bs[0].onclick(); await tick(1); }
  click(root, '☑'); click(root, '📐 Indelen'); for (const t of ['⇤ Links', '⇔ Midden', 'Rechts ⇥', '⤒ Boven', '⤓ Onder', '↔ Horizontaal', '↕ Verticaal', 'Alles kiezen', '✨ Alle foto’s', 'Raster', 'Hulplijnen']) { click(panel, t); }
  click(root, '↶'); click(root, '↶'); click(root, '↷');
  click(root, '📚 Lagen'); find(panel, (e) => e.className === 'hd').forEach((h) => h.onpointerdown && h.onpointerdown({ preventDefault() {}, currentTarget: h, pointerId: 1, clientY: 0, setPointerCapture() {} }));
  // export
  click(root, '📤 Delen'); const sheet = document.body.children.filter((c) => c.className === 'cf-sheet')[0]; assert.ok(sheet); click(sheet, '⬇ Downloaden'); await tick(120); click(sheet, 'Sluiten');
  // opruimen
  await tick(20); cleanups.forEach((f) => f()); await tick(20);
  assert.equal(errs.length, 0, errs.map((e) => e.stack).join('\n'));
  n++;
}
console.log(`OK: ${n} testgroepen geslaagd`);
process.exit(0);
