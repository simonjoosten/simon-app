// Node-test voor docs/gfx/*: mock-DOM + mock-canvas. Gebruik: node tools/test-gfx.mjs
import assert from 'node:assert/strict';
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
class El {
  constructor(tag) { this.tag = tag; this.children = []; this.style = { setProperty(k, v) { this[k] = v; }, cssText: '' }; this.attrs = {}; this.ls = {}; this.parent = null; this._text = ''; this.id = ''; this.className = ''; }
  appendChild(c) { c.parent = this; this.children.push(c); return c; }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parent = null; }
  remove() { if (this.parent) this.parent.removeChild(this); }
  setAttribute(k, v) { this.attrs[k] = String(v); } removeAttribute(k) { delete this.attrs[k]; } getAttribute(k) { return this.attrs[k]; }
  addEventListener(t, f) { (this.ls[t] ||= []).push(f); } removeEventListener(t, f) { this.ls[t] = (this.ls[t] || []).filter((x) => x !== f); }
  fire(t, e = {}) { (this.ls[t] || []).slice().forEach((f) => f(e)); }
  set textContent(v) { this._text = v; } get textContent() { return this._text; }
  set innerHTML(v) { this._html = v; this.children = []; if (/feColorMatrix/.test(v)) { const m = new El('feColorMatrix'); m.id = 'gfx-cb-matrix'; this.appendChild(m); } } 
  all() { return this.children.flatMap((c) => [c, ...c.all()]); }
  getElementById(id) { return this.all().find((e) => e.id === id) || null; }
  querySelector(s) { return this.querySelectorAll(s)[0] || null; }
  querySelectorAll(s) { const cls = s.startsWith('.') ? s.slice(1) : null, ids = s.startsWith('#') ? s.slice(1) : null; return this.all().filter((e) => (cls && (' ' + e.className + ' ').includes(' ' + cls + ' ')) || (ids && e.id === ids) || (!cls && !ids && s.split(',').includes(e.tag))); }
  getContext() { return mkCtx(); } focus() {}
  get clientWidth() { return 390; } get clientHeight() { return 800; }
}
function mkCtx() {
  const calls = { n: 0 };
  const base = { measureText: (t) => ({ width: String(t).length * 12 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }) };
  return new Proxy(calls, { get: (o, k) => (k in base ? base[k] : k === '__n' ? o.n : k in o && k !== 'n' ? o[k] : (...a) => { o.n++; }), set: (o, k, v) => { o[k] = v; return true; } });
}
const html = new El('html'), body = new El('body'), head = new El('head'); html.appendChild(head); html.appendChild(body);
const docLs = {};
globalThis.document = { documentElement: html, body, head, createElement: (t) => new El(t), getElementById: (id) => html.getElementById(id), querySelector: (s) => html.querySelector(s), addEventListener: (t, f) => (docLs[t] ||= []).push(f), removeEventListener: (t, f) => { docLs[t] = (docLs[t] || []).filter((x) => x !== f); } };
globalThis.Image = class { set src(v) { this._s = v; setTimeout(() => this.onerror && this.onerror(), 0); } };
let rafQ = []; globalThis.requestAnimationFrame = (f) => { rafQ.push(f); return rafQ.length; }; globalThis.cancelAnimationFrame = () => {};
globalThis.getComputedStyle = () => ({ position: 'static' });

const { Settings, GFX } = await import('../docs/gfx/settings.js?v=1');
const Art = await import('../docs/gfx/art.js?v=1');
const { ICONS } = await import('../docs/gfx/icons.js?v=1');
const FX = await import('../docs/gfx/fx.js?v=1');
const { Themes, WORLDS } = await import('../docs/gfx/themes.js?v=1');
const { Scenes } = await import('../docs/gfx/scenes.js?v=1');
const { openSettingsPanel } = await import('../docs/gfx/panel.js?v=1');

// settings
let g = Settings.get(); assert.ok(['normaal', 'hoog', 'ultra'].includes(g.quality)); assert.equal(g.uiScale, 1);
let fired = 0; const off = Settings.onChange(() => fired++);
Settings.set({ quality: 'ultra', uiScale: 9, colorblind: 'deutan', accent: '#ec4899', sound: false });
g = Settings.get(); assert.equal(GFX.q, 2); assert.equal(g.uiScale, 1.5); assert.equal(fired, 1);
assert.equal(html.attrs['data-cb'], 'deutan'); assert.equal(html.style['--gfx-accent'], '#ec4899');
assert.ok(html.getElementById('gfx-cb-svg') && html.getElementById('gfx-cb-style').textContent.includes('url(#gfx-cb-filter)'));
assert.ok(JSON.parse(store.get('gfx:settings')).quality === 'ultra');
Settings.set({ colorblind: 'uit', quality: 'normaal' }); assert.equal(html.getElementById('gfx-cb-svg'), null); assert.equal(GFX.q, 0);
assert.ok(GFX.particles(100) < 100); Settings.set({ quality: 'ultra' }); assert.ok(GFX.particles(100) > 100);
Settings.set({ quality: 'bogus', theme: 'nope' }); assert.equal(Settings.get().quality, 'ultra');
off(); Settings.reset(); assert.equal(Settings.get().accent, '#6366f1');
// art
await Art.ready; const hc = Art.has('coin'); assert.equal(Art.has('nietbestaand'), false); assert.equal(Art.iconUrl('nietbestaand'), null);
assert.match(Art.icon('coin', { size: 32 }), hc ? /<img/ : /🪙/); assert.match(Art.icon('nietbestaand'), /❓/); if (hc) assert.match(Art.iconUrl('coin'), /art\/3d\/coin\.png/);
const ctx = mkCtx(); Art.drawIcon(ctx, 'coin', 10, 10, 32, { rot: 1, shadow: true, alpha: 0.5 }); Art.drawIcon(ctx, 'nietbestaand', 1, 1, 8);
const pm = await Art.preload(['coin']); assert.ok(pm.size <= 1);
// themes
assert.ok(WORLDS.length >= 16);
for (const need of ['ruimte', 'onderwater', 'kasteel', 'bos', 'woestijn', 'ijs', 'snoepland', 'stad', 'jungle', 'vulkaan', 'wolken', 'piraten', 'robots', 'dino', 'neon', 'herfst']) assert.ok(Themes.list.find((w) => w.id === need), need);
for (const w of WORLDS) for (const n of w.deco) assert.ok(ICONS[n], w.id + ':' + n);
for (const q of ['normaal', 'hoog', 'ultra']) for (const reduce of [false, true]) { Settings.set({ quality: q, reduceMotion: reduce }); for (const w of WORLDS) for (const [W, H] of [[390, 800], [900, 500]]) { const c = mkCtx(); Themes.paintBackground(c, W, H, w, 3.7); Themes.paintBackground(c, W, H, w.id, 0); assert.ok(c.__n > 20, w.id); } }
Settings.set({ reduceMotion: false });
assert.ok(Themes.cssVars('neon')['--world-grad']); assert.equal(Themes.world('xx').id, 'ruimte');
Themes.setForGame('spel', 'ijs'); assert.equal(Themes.forGame('spel').id, 'ijs'); assert.ok(Themes.forGame('ander').id);
// fx
for (const q of ['normaal', 'hoog', 'ultra']) { Settings.set({ quality: q }); const c = mkCtx(); const p = new FX.Particles();
  for (const kind of ['coins', 'sparkle', 'confetti', 'smoke', 'bubbles', 'stars']) p.burst(100, 100, { kind, n: 30 });
  for (let i = 0; i < 100; i++) { p.update(0.016); p.draw(c); } assert.ok(p.count <= 520);
  FX.softShadow(c, 1, 1, 10, 3, .3); FX.glow(c, 1, 1, 10, '#abc', .5); FX.vignette(c, 100, 100, .4); FX.gradientSky(c, 10, 10, '#000', '#fff'); FX.lightRays(c, 100, 100, 1); FX.bokeh(c, 100, 100, 1); }
// scenes
assert.ok(Object.keys(Scenes.list).length >= 15);
async function run(id, opts = {}, secs = 6, tapAt = null) {
  const host = new El('div'); rafQ = []; let ts = 1000, frames = 0, fin = false;
  const p = Scenes.play(host, id, opts); p.done.then(() => (fin = true));
  assert.equal(host.children.length, 1);
  while (!fin && frames < 600) { const q = rafQ; rafQ = []; ts += 33; frames++; if (tapAt != null && frames === tapAt) host.children[0].fire('pointerdown', {}); q.forEach((f) => f(ts)); await Promise.resolve(); }
  assert.ok(fin, id + ' klaar'); assert.equal(host.children.length, 0); return frames;
}
for (const q of ['normaal', 'ultra']) for (const reduce of [false, true]) { Settings.set({ quality: q, reduceMotion: reduce }); for (const id of Object.keys(Scenes.list)) { const f = await run(id, { value: 120, title: 'Test' }); assert.ok(reduce ? f < 60 : f > 60, id + ' ' + f); } }
Settings.set({ reduceMotion: false, quality: 'hoog' });
const fTap = await run('victory', {}, 6, 20); assert.ok(fTap < 40, 'tap slaat over ' + fTap);
const h2 = new El('div'); rafQ = []; const lp = Scenes.play(h2, 'levelup', { loop: true }); for (let i = 0; i < 300; i++) { const q = rafQ; rafQ = []; q.forEach((f) => f(1000 + i * 33)); } assert.equal(h2.children.length, 1); lp.stop(); assert.equal(h2.children.length, 0); assert.equal((await lp.done).skipped, false);
const bad = Scenes.play(new El('div'), 'bestaatniet'); assert.equal((await bad.done).error, true);
// panel
const pr = openSettingsPanel({ title: 'Instellingen', toast: () => {} });
assert.ok(body.querySelector('.gfx-back')); assert.ok(head.getElementById('gfx-panel-style'));
const opts2 = body.querySelectorAll('.gfx-opt'); assert.ok(opts2.length === 10);
opts2[0].fire('click'); assert.equal(Settings.get().quality, 'normaal'); assert.equal(opts2[0].attrs['aria-pressed'], 'true');
body.querySelector('.gfx-reset').fire('click'); assert.equal(Settings.get().accent, '#6366f1');
body.querySelectorAll('.gfx-sw')[1].fire('click'); assert.equal(Settings.get().accent, '#ec4899');
pr.close(); assert.equal(body.querySelector('.gfx-back'), null); assert.equal(head.getElementById('gfx-panel-style'), null);
console.log('test-gfx: alles OK');
