// Rooktest voor de UI van pixel.js, meme.js en mop.js met een heel kleine nep-DOM (geen browser). Gebruik: node tools/test-fun-ui.mjs
import assert from 'node:assert/strict';
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
const ctx2d = () => new Proxy({}, { get: (o, k) => (k in o ? o[k] : k === 'measureText' ? (t) => ({ width: String(t).length * 10 }) : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : k === 'getImageData' ? (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }) : () => {}), set: (o, k, v) => { o[k] = v; return true; } });
const camel = (s) => s.replace(/-(\w)/g, (_, c) => c.toUpperCase());
class El {
  constructor(tag = 'div') { this.tag = tag; this.style = { setProperty() {} }; this.dataset = {}; this.ls = {}; this.children = []; this.isConnected = true; this.value = ''; this.width = 300; this.height = 300; this.clientWidth = 360; this.clientHeight = 200; this._stubs = []; this.classList = { add() {}, remove() {} }; }
  set innerHTML(h) {
    this._html = h; this._stubs = [];
    for (const m of h.matchAll(/<(\w+)([^>]*)>/g)) {
      const e = new El(m[1]); e.attrs = {};
      for (const a of m[2].matchAll(/([\w:-]+)(?:="([^"]*)")?/g)) { e.attrs[a[1]] = a[2] ?? ''; if (a[1].startsWith('data-')) e.dataset[camel(a[1].slice(5))] = a[2] ?? ''; }
      e.id = e.attrs.id || ''; e.value = e.attrs.value || ''; e.cls = e.attrs.class || ''; this._stubs.push(e);
    }
  }
  get innerHTML() { return this._html || ''; }
  set textContent(v) { this._text = v; } get textContent() { return this._text || ''; }
  setAttribute() {} removeAttribute() {} getAttribute() { return null; } getElementById() { return null; }
  appendChild(c) { this.children.push(c); return c; } remove() {} focus() {} setSelectionRange() {}
  addEventListener(t, f) { (this.ls[t] ||= []).push(f); } removeEventListener() {}
  fire(t, e = {}) { (this.ls[t] || []).forEach((f) => f({ preventDefault() {}, pointerId: 1, ...e })); const h = this['on' + t]; if (h) h({ preventDefault() {}, pointerId: 1, ...e }); }
  getContext() { return (this._c ||= ctx2d()); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 300, height: 300 }; }
  setPointerCapture() {} toBlob(cb) { cb(null); } toDataURL() { return 'data:image/jpeg;base64,AAAA'; }
  querySelector(s) { return this.querySelectorAll(s)[0] || (this.children[0] && this.children[0].querySelector ? this.children[0].querySelector(s) : null) || null; }
  querySelectorAll(s) {
    const all = [...this._stubs, ...this.children.flatMap((c) => (c.querySelectorAll ? c.querySelectorAll(s) : []))]; const seen = new Set();
    return all.filter((e) => { if (seen.has(e)) return false; seen.add(e); if (s.startsWith('#')) return e.id === s.slice(1); if (s.startsWith('.')) return (' ' + e.cls + ' ').includes(' ' + s.slice(1) + ' '); const m = /^\[(data-[\w-]+)\]$/.exec(s); if (m) return m[1] in e.attrs; return e.tag === s; });
  }
}
const html = new El('html'); const body = new El('body');
globalThis.document = { documentElement: html, body, head: new El('head'), createElement: (t) => new El(t), querySelector: () => null, addEventListener() {}, removeEventListener() {} };
globalThis.window = { scrollTo() {}, ClipboardItem: undefined };
Object.defineProperty(globalThis, 'navigator', { value: { clipboard: { writeText: async () => {} }, hardwareConcurrency: 4 }, configurable: true });
globalThis.Image = class { set src(v) { setTimeout(() => this.onerror && this.onerror(), 0); } };
globalThis.requestAnimationFrame = (f) => { setTimeout(() => f(performance.now()), 0); return 1; }; globalThis.cancelAnimationFrame = () => {};
globalThis.getComputedStyle = () => ({ getPropertyValue: () => '1', position: 'static' });
globalThis.confirm = () => true; globalThis.prompt = () => 'Naam'; globalThis.alert = () => {};
globalThis.URL.createObjectURL = () => 'blob:x'; globalThis.URL.revokeObjectURL = () => {};
const wait = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const q = (root, s) => { const e = root.querySelector(s); assert.ok(e, 'ontbreekt: ' + s); return e; };
const clickAll = (root, s) => root.querySelectorAll(s).forEach((e) => e.fire('click'));

// ---------- mop ----------
{
  const { mopView } = await import('../docs/mop.js');
  const view = new El(); await mopView({ view, uid: 'u1', addCleanup() {} }); await wait();
  let body = view.children[0].children[0] ? view : view; const root = () => view.querySelector('.fu-body');
  const R = () => root(); assert.ok(R()._html.includes('Toon het antwoord'));
  const fire = (s) => { q(R(), s).fire('click'); };
  fire('#mp-show'); assert.ok(R()._html.includes('data-star="5"')); R().querySelectorAll('[data-star]').find((e) => e.dataset.star === '4').fire('click');
  fire('#mp-fav'); assert.ok(JSON.parse(store.get('mop:u1:favs')).length === 1); assert.equal(JSON.parse(store.get('mop:u1:ratings'))[Object.keys(JSON.parse(store.get('mop:u1:ratings')))[0]], 4);
  fire('#mp-next'); fire('#mp-prev'); fire('#mp-share'); fire('#mp-say');
  for (const t of ['raad', 'alle', 'fav', 'eigen', 'score', 'mop']) { R().querySelectorAll('[data-tab]').find((e) => e.dataset.tab === t).fire('click'); assert.ok(R()._html.length > 100, t); }
  R().querySelectorAll('[data-cat]').find((e) => e.dataset.cat === 'ober').fire('click'); assert.ok(R()._html.includes('class="chip"'));
  // quiz volledig doorspelen
  R().querySelectorAll('[data-tab]').find((e) => e.dataset.tab === 'raad').fire('click'); fire('#q-start');
  for (let i = 0; i < 10; i++) { R().querySelectorAll('[data-qa]')[0].fire('click'); fire('#q-next'); }
  assert.ok(R()._html.includes('van 10 goed')); assert.equal(JSON.parse(store.get('mop:u1:quiz')).played, 1);
  // eigen mop
  R().querySelectorAll('[data-tab]').find((e) => e.dataset.tab === 'eigen').fire('click');
  q(R(), '#own-q').value = 'Waarom lacht de maan?'; q(R(), '#own-a').value = 'Omdat de zon een mop vertelde.'; fire('#own-add');
  assert.equal(JSON.parse(store.get('mop:u1:own')).length, 1); assert.ok(R()._html.includes('Waarom lacht de maan?'));
  fire('#own-sharecode');
  await wait(); 
}
// ---------- pixel ----------
{
  const { pixelView } = await import('../docs/pixel.js');
  const view = new El(); pixelView({ view, uid: 'u1', addCleanup() {} }); await wait();
  const R = () => view.querySelector('.fu-body');
  const click = (s) => q(R(), s).fire('click'); const each = (s, f) => R().querySelectorAll(s).forEach(f);
  const cv = () => q(R(), '#px-cv');
  const draw = (x0, y0, x1, y1) => { cv().fire('pointerdown', { clientX: x0, clientY: y0 }); cv().fire('pointermove', { clientX: x1, clientY: y1 }); cv().fire('pointerup', { clientX: x1, clientY: y1 }); };
  draw(10, 10, 200, 150);
  const tool = (t) => each('[data-tool]', (e) => e.dataset.tool === t && e.fire('click'));
  for (const t of ['line', 'rect', 'rectf', 'circle', 'circlef', 'erase', 'fill', 'pick', 'pen']) { tool(t); draw(30, 30, 120, 90); }
  tool('select'); draw(20, 20, 100, 100); click('#s-copy'); click('#s-paste'); click('#s-fx'); click('#s-ok'); click('#s-cut'); click('#s-all'); click('#s-del');
  tool('hand'); draw(50, 50, 100, 100); click('#px-zin'); click('#px-zout'); click('#px-zfit'); click('#px-grid'); click('#px-undo'); click('#px-redo');
  click('#l-add'); click('#l-dup'); click('#l-merge'); each('[data-lup]', (e, i) => i === 0 && e.fire('click')); click('#l-del');
  for (const id of ['#t-fx', '#t-fy', '#t-rot', '#t-l', '#t-r', '#t-u', '#t-d', '#t-out', '#t-clr']) click(id);
  click('#f-add'); click('#f-dup'); click('#f-onion'); click('#f-l'); click('#f-r'); click('#f-play'); click('#f-del'); click('#f-play');
  each('[data-tpl]', (e, i) => i === 2 && e.fire('click')); each('[data-size]', (e) => e.dataset.size === '32' && e.fire('click')); each('[data-mir]', (e) => e.dataset.mir === 'xy' && e.fire('click')); each('[data-bs]', (e) => e.dataset.bs === '3' && e.fire('click'));
  tool('pen'); draw(30, 30, 90, 90); click('#px-save');
  await wait(700);
  const g = JSON.parse(store.get('pixel:gallery:u1')); assert.equal(g.length, 1); assert.equal(g[0].v, 2); assert.ok(JSON.parse(store.get('pixel:draft:u1')));
  click('#px-png'); click('#px-gif'); click('#px-sheet');
  assert.ok(R()._html.includes('Mijn galerij'));
}
// ---------- meme ----------
{
  const { memeView } = await import('../docs/meme.js');
  const view = new El(); memeView({ view, uid: 'u1', addCleanup() {} }); await wait();
  const R = () => view.querySelector('.fu-body'); const b = (s) => q(R(), s);
  R().querySelectorAll('[data-tp]').forEach((e, i) => i < 4 && e.fire('click')); await wait();
  b('#mm-rnd').fire('click'); b('#mm-addtxt').fire('click'); b('#mm-addbub').fire('click'); b('#mm-addstk').fire('click');
  R().querySelectorAll('[data-si]').slice(0, 2).forEach((e) => e.fire('click')); R().querySelectorAll('[data-se]').slice(0, 1).forEach((e) => e.fire('click'));
  R().querySelectorAll('[data-f]').forEach((e) => e.fire('click')); await wait(40);
  R().querySelectorAll('[data-asp]').forEach((e) => e.fire('click')); R().querySelectorAll('[data-tf]').forEach((e) => e.fire('click'));
  b('#mm-top').fire('input', { target: { value: 'Hallo' } }); b('#mm-fw').fire('input', { target: { value: '30' } });
  b('#mm-cv').fire('pointerdown', { clientX: 150, clientY: 150 }); b('#mm-cv').fire('pointermove', { clientX: 100, clientY: 100 }); b('#mm-cv').fire('pointerup', {});
  b('#mm-undo').fire('click'); b('#mm-undo').fire('click'); b('#mm-save').fire('click'); await wait(60); b('#mm-dl').fire('click'); await wait(); b('#mm-share').fire('click'); await wait(); b('#mm-reset').fire('click'); b('#mm-reset').fire('click');
  assert.equal(JSON.parse(store.get('meme:gallery:u1')).length, 1);
}
console.log('test-fun-ui OK'); process.exit(0);
