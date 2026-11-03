// Ronde 4 - UI-rooktest van docs/puzzel.js met nep-DOM en stub-spel: packs (vergrendeling, 250e level), huisstijlen, tijdrace (start, oplossen, overslaan, tijd om, record), hint, opruimen.
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
const R = await import('../docs/puzzel-r4-packs.js');

const skipOut = async () => { for (let i = 0; i < 30 && !/Tijd is om/.test(html()); i++) { click('skip'); await wait(5); } }; // overslaan kost 10 s: 150 s is zo op

const html = () => view.querySelector('#pz-ui')._html;
const ui = (uid) => ({ db: {}, uid, view, addCleanup: (f) => cleanups.push(f) });
const progOf = (uid) => JSON.parse(JSON.parse(ls.get(`gs:x:${uid}:pinnen`)).data);

// ---- menu van een nieuwe speler
await puzzelView(ui('u1'), 'pinnen'); await wait(30);
ok(/Beginner/.test(html()) && /400 extra levels/.test(html()) && /data-a="time"/.test(html()) && /data-a="skins"/.test(html()), 'menu: rang, 400 levels, tijdrace, huisstijl');

// ---- packs: pak 3 is op slot, pak 1 niet
click('pick'); ok(/data-n="99"/.test(html()) && !/data-n="100"/.test(html()), 'pak 1 toont levels 1-100');
click('pack', { k: '2' }); ok(/op slot/.test(html()) && !/data-a="extra"/.test(html()), 'pak 3 is op slot');
ok(/Pak 4/.test(html()) && (html().match(/data-a="pack"/g) || []).length === 4, '4 tabs');
// level uit pak 1 spelen en halen: pak 2 gaat open na 30 levels (vooraf ingevuld)
cleanups.splice(0).forEach((f) => f()); await wait(10);
ls.set('gs:x:u3:pinnen', JSON.stringify({ updated: 1, data: JSON.stringify({ x: '3'.repeat(40), d: { '2020-01-01': 2 } }) }));
await puzzelView(ui('u3'), 'pinnen'); await wait(30);
ok(/Puzzelaar|Slimmerik/.test(html()), 'rang volgt uit sterren: ' + (html().match(/<b>(\w+)<\/b><small>/) || [])[1]);
click('pick'); click('pack', { k: '1' }); ok(/data-n="250"/.test(html()) === false && /data-n="199"/.test(html()) && /data-n="100"/.test(html()), 'pak 2 open na 30 levels');
click('pack', { k: '2' }); ok(/op slot/.test(html()), 'pak 3 nog op slot');
click('pack', { k: '1' });
G.log.created = 0; G.log.destroyed = 0;
click('extra', { n: '150' }); await wait(60);
ok(G.log.loaded && G.log.loaded.l === 450 && G.log.loaded.m === 450, 'level 151 start met eigen save: ' + JSON.stringify(G.log.loaded && G.log.loaded.l));
await wait(800); G.log.api.score(903); await wait(20);
ok(R.starsOf(progOf('u3') && R.cleanProgress(progOf('u3')), 150) === 3, 'level 151 bewaard met 3 sterren');
G.log.api.save({ v: 2, l: 451 }); G.log.api.score(905); await wait(20);
ok(R.starsOf(R.cleanProgress(progOf('u3')), 151) === 2, 'doorgespeeld naar level 152 (2 sterren)');
// oude velden blijven
ok(progOf('u3').x === '3'.repeat(40) + '0'.repeat(60) && progOf('u3').d['2020-01-01'] === 2, 'oude x en d intact');

// ---- hint: klikt op een knop met een gloeilamp als die er is; mag nooit fout gaan
click('hint'); ok(true, 'hint zonder knop geeft geen fout');
click('back'); ok(/data-a="pack"/.test(html()) && G.log.destroyed >= 1, 'terug naar de pakken, spel opgeruimd');

// ---- huisstijl
click('menu'); click('skins'); ok(/Glas/.test(html()) && /Regenboog/.test(html()) && (html().match(/data-a="skinlock"/g) || []).length === 4, 'huisstijlen met slotjes ' + (html().match(/data-a="skinlock"/g) || []).length);
click('skinlock', { s: 'ruimte' }); ok(/Ruimte gaat open met 300 sterren/.test(html()), 'slottekst: ' + (html().match(/pz-msg">([^<]*)/) || [])[1]);
click('skin', { s: 'goud' }); ok(progOf('u3').sk === 'goud', 'goud gekozen en bewaard (40 sterren >= 25)');
// de gekozen skin wordt toegepast bij het spelen
click('menu'); click('daily'); await wait(40);
click('back'); click('menu');

// ---- tijdrace
click('time'); ok(/Start tijdrace/.test(html()) && /Dagelijkse race/.test(html()), 'tijdrace-scherm');
G.log.created = 0;
click('tstart'); await wait(60);
ok(G.log.created === 1 && G.log.loaded && G.log.loaded.l >= 300 && G.log.loaded.l < 300 + 6, 'tijdrace begint bij een makkelijk level: ' + (G.log.loaded && G.log.loaded.l));
ok(/pz-hud/.test(html()), 'klok in beeld');
await wait(800); G.log.api.score(903); // +3 sterren
await wait(1500);
ok(G.log.created === 2 && G.log.loaded.l >= 300 + 6, 'na oplossen volgt het volgende (moeilijkere) level: ' + G.log.loaded.l);
await wait(800);
click('skip'); await wait(60); ok(G.log.created === 3, 'overslaan geeft een nieuw level');
await skipOut();
ok(/Tijd is om/.test(html()), 'tijd om: eindscherm');
const pr = progOf('u3');
ok(pr.t.r === 1 && pr.t.b >= R.tmPoints(3, 0) , 'record en aantal races bewaard: ' + JSON.stringify(pr.t));
ok(/Nog een keer/.test(html()), 'opnieuw knop');
// dagelijkse race
G.log.created = 0; click('tdaily'); await wait(60);
ok(G.log.created === 1 && G.log.loaded.l >= 300, 'dagelijkse race start');
await wait(800); G.log.api.score(902); await wait(1500);
await skipOut();
ok(Object.keys(progOf('u3').td).length === 1 && progOf('u3').t.r === 2, 'dagelijkse score bewaard ' + JSON.stringify(progOf('u3').td) + progOf('u3').t.r);
// stoppen midden in de race slaat niets op
click('menu'); click('time'); click('tstart'); await wait(60); const runsBefore = progOf('u3').t.r;
click('back'); await wait(20); ok(progOf('u3').t.r === runsBefore && /Start tijdrace/.test(html()), 'stoppen telt niet als race');

// ---- opruimen en cloud-vorm
cleanups.splice(0).forEach((f) => f()); await wait(40);
const cloud = FS.__store.get('gamesaves/pinnen-extra__u3');
ok(cloud && cloud.game === 'pinnen-extra' && Object.keys(cloud).sort().join() === 'data,game,uid,updated' && cloud.data.length <= 20000, 'cloud-doc heeft de gamesaves-vorm: ' + JSON.stringify(cloud && Object.keys(cloud)));
console.log(fails ? fails + ' FOUTEN' : 'ALLES OK');
process.exit(fails ? 1 : 0);
