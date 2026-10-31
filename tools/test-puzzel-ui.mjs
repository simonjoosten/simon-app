// Rooktest van docs/puzzel.js met een nep-DOM en een stub-spel: menu, dagelijkse puzzel, extra levels, mijlpalen, wereldkeuze, opruimen.
import { register } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
register(pathToFileURL(path.join(here, 'puzzel-stubs', 'loader.mjs')).href);

const ls = new Map();
globalThis.localStorage = { getItem: (k) => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: (k) => ls.delete(k) };
class El {
  constructor(tag) { this.tag = tag; this.style = { setProperty() {} }; this.dataset = {}; this.listeners = {}; this._html = ''; this.width = 100; this.height = 100; this.clientWidth = 400; this.clientHeight = 700; this.id = ''; this.children = []; this.textContent = ''; }
  set innerHTML(v) { this._html = String(v); this.kids = new Map(); }
  get innerHTML() { return this._html; }
  querySelector(sel) { if (!this.kids) this.kids = new Map(); const m = /^#([\w-]+)$/.exec(sel); if (m && !this._html.includes(`id="${m[1]}"`)) return null; if (!this.kids.has(sel)) { const e = new El('div'); e.id = m ? m[1] : ''; this.kids.set(sel, e); } return this.kids.get(sel); }
  getContext() { return new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ addColorStop() {} })), set: (t, k, v) => { t[k] = v; return true; } }); }
  addEventListener(t, f) { (this.listeners[t] ||= []).push(f); }
  removeEventListener(t, f) { this.listeners[t] = (this.listeners[t] || []).filter((x) => x !== f); }
  contains() { return true; } remove() {} appendChild() {} setAttribute() {} removeAttribute() {} getAttribute() { return null; } getElementById() { return null; }
}
const head = new El('head');
globalThis.document = { head, body: new El('body'), createElement: (t) => new El(t), getElementById: () => null, documentElement: new El('html') };
globalThis.window = { innerHeight: 800, innerWidth: 400, addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false }) };
globalThis.requestAnimationFrame = (f) => setTimeout(() => f(1000), 5); globalThis.cancelAnimationFrame = (t) => clearTimeout(t);

const { puzzelView } = await import('../docs/puzzel.js');
const FS = await import('../docs/games/fake-firestore.js');
const G = await import('./puzzel-stubs/game.mjs');
const X = await import('../docs/puzzel-extra.js');
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const view = new El('div'); const cleanups = [];
const click = (a, extra = {}) => { const b = { dataset: { a, ...extra }, closest: () => b }; (view.listeners.click || []).forEach((f) => f({ target: b })); };
await puzzelView({ db: {}, uid: 'u1', view, addCleanup: (f) => cleanups.push(f) }, 'pinnen');
ok(/data-a="daily"/.test(view.querySelector('#pz-ui')._html), 'menu toont dagelijkse puzzel');
ok(/100 extra levels/.test(view.querySelector('#pz-ui')._html), 'menu toont extra levels');

// extra level 5 spelen
click('pick'); ok(/data-n="99"/.test(view.querySelector('#pz-ui')._html), 'pick toont 100 levels');
click('extra', { n: '4' }); await wait(60);
ok(G.log.created === 1 && G.log.loaded && G.log.loaded.l === 304, 'extra level start met eigen save ' + JSON.stringify(G.log.loaded));
await wait(800);
G.log.api.score(902); // spel meldt +2 sterren
ok(true, 'score');
let st = JSON.parse(ls.get('gs:x:u1:pinnen')).data; ok(JSON.parse(st).x[4] === '2', 'extra level 5 heeft 2 sterren: ' + st.slice(0, 20));
G.log.api.save({ v: 2, l: 305 }); G.log.api.score(905);
st = JSON.parse(JSON.parse(ls.get('gs:x:u1:pinnen')).data); ok(st.x[5] === '3', 'doorgespeeld naar level 6');
ok(ls.get('gs:g:u1:pinnen') === undefined, 'gewone voortgang onaangeroerd');

// dagelijkse puzzel
click('back'); ok(G.log.destroyed === 1, 'spel opgeruimd bij terug');
click('menu'); click('daily'); await wait(60);
const dn = X.dailyIndex('pinnen', X.dateKey());
ok(G.log.loaded.l === 300 + dn, 'dagelijkse puzzel level ' + dn);
await wait(800); G.log.api.score(901);
st = JSON.parse(JSON.parse(ls.get('gs:x:u1:pinnen')).data); ok(st.d[X.dateKey()] === 1, 'dagelijkse puzzel bewaard');

// gewone modus: bewaart op de oude plek, geen extra-opslag
click('back'); click('main'); await wait(60);
G.log.api.save({ v: 2, l: 3, m: 3, s: '123' });
ok(JSON.parse(ls.get('gs:g:u1:pinnen')).data.includes('"l":3'), 'gewone save lokaal');
await wait(800); G.log.api.score(931); // +30 => mijlpaal-scene (Scenes.play kan in de nep-DOM falen, maar mag niets breken)
// wereldkeuze
click('back'); click('menu'); click('world'); ok(/data-a="setworld"/.test(view.querySelector('#pz-ui')._html), 'wereldkeuze');
click('setworld', { w: 'ruimte' }); ok(ls.get('gfx:world:puzzel-pinnen') === 'ruimte', 'wereld bewaard');
cleanups.forEach((f) => f()); await wait(30);
const cloud = FS.__store.get('gamesaves/pinnen-extra__u1'); ok(cloud && cloud.game === 'pinnen-extra' && cloud.uid === 'u1' && typeof cloud.data === 'string' && cloud.data.length <= 20000 && Object.keys(cloud).sort().join() === 'data,game,uid,updated', 'cloud-doc heeft exact de gamesaves-vorm: ' + JSON.stringify(cloud && Object.keys(cloud)));
const main = FS.__store.get('gamesaves/pinnen__u1'); ok(main && main.game === 'pinnen', 'gewone cloud-save (flush bij opruimen)');
console.log(fails ? fails + ' FOUTEN' : 'ALLES OK');
process.exit(fails ? 1 : 0);
