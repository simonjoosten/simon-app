// Rooktest: laadt de echte schermen (Kleur, Emoji, Muziek, Piano, Dobbel, Pixel) in een nep-DOM, klikt op de nieuwe knoppen en let op fouten.
// Een nep-DOM is geen browser: dit vangt scriptfouten, geen layoutproblemen. Gebruik: node tools/test-r4-creatief-ui.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { install, El } from './_minidom.mjs';
const env = install();
// nep-DOM aanvullen: closest() en klikken die omhoog borrelen (de apps gebruiken delegatie op de view)
const simple = (e, sel) => sel.split(',').some((part) => { part = part.trim(); const tag = /^[a-z]+/i.exec(part); if (tag && e.tag !== tag[0].toLowerCase()) return false; for (const c of part.matchAll(/\.([\w-]+)/g)) if (!e.className.split(/\s+/).includes(c[1])) return false; for (const a of part.matchAll(/\[([\w-]+)(?:="?([^"\]]*)"?)?\]/g)) { if (!(a[1] in e.attrs)) return false; if (a[2] != null && e.attrs[a[1]] !== a[2]) return false; } return true; });
El.prototype.closest = function (sel) { for (let e = this; e && !e.isText; e = e.parent) if (e.tag && simple(e, sel)) return e; return null; };
El.prototype.contains = function (o) { for (let e = o; e; e = e.parent) if (e === this) return true; return false; };
globalThis.getComputedStyle = () => ({ position: 'static', getPropertyValue: () => '' });
const click = (el) => { if (!el) throw new Error('klik op niets'); if (el.disabled || el.attrs.disabled !== undefined) return; const ev = { target: el, preventDefault() {}, stopPropagation() {} }; for (let p = el; p; p = p.parent) { if (p.onclick) p.onclick(ev); (p.ls.click || []).slice().forEach((f) => f(ev)); } };
const txt = (v) => v.textContent;
const { T } = env;
let n = 0, failed = 0;
const ok = async (name, fn) => { try { await fn(); n++; } catch (e) { failed++; console.error('FAIL', name, (e.stack || String(e)).split('\n').slice(0, 5).join(' | ')); process.exitCode = 1; } };
const mkView = () => { const v = new El('div'); document.body.appendChild(v); return v; };
const cleanups = [];
const ctx = (view) => ({ view, uid: 'testuid', esc: (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])), addCleanup: (f) => cleanups.push(f), db: null, me: { uid: 'testuid' } });
const settle = async (ms = 400) => { for (let i = 0; i < 6; i++) { T.advance(ms / 6); await new Promise((r) => setImmediate(r)); } };
const has = (v, sel) => !!v.querySelector(sel);
const must = (v, sel) => { const e = v.querySelector(sel); assert.ok(e, 'ontbreekt: ' + sel); return e; };

await ok('Kleur: platen, groepen en deelknoppen', async () => {
  const { kleurView } = await import('../docs/kleur.js'); const v = mkView(); kleurView(ctx(v)); await settle();
  const html = txt(v); assert.ok(html.includes('plaatjes'), 'geen platenlijst'); assert.ok(/109 plaatjes/.test(html), 'aantal plaatjes: ' + (/(\d+) plaatjes/.exec(html) || [])[0]);
  for (const g of ['Meer dieren', 'Eten', 'Fantasie', 'Patronen']) assert.ok(html.includes(g), 'groep ' + g);
  const open = v.querySelector('[data-plaat="konijn"]') || v.querySelector('[data-id="konijn"]'); assert.ok(open || html.includes('konijn'), 'konijn niet in lijst');
});
await ok('Emoji-mixer: nieuwe knoppen', async () => {
  const data = JSON.parse(fs.readFileSync(new URL('../docs/emoji-data.json', import.meta.url), 'utf8')); T.fetchHandler = async () => ({ ok: true, json: async () => data });
  const { emojiView } = await import('../docs/emoji.js'); const v = mkView(); await emojiView(ctx(v)); await settle();
  for (const id of ['#em-day', '#em-story', '#em-share', '#em-qstart']) must(v, id);
  click(must(v, '#em-story')); assert.ok(has(v, '#em-storytxt'), 'verhaaltje'); click(must(v, '#em-day')); assert.ok(!has(v, '#em-storytxt'), 'verhaaltje blijft hangen na een andere mix');
  click(must(v, '#em-qstart')); const opts = v.querySelectorAll('[data-q]'); assert.equal(opts.length, 6); assert.ok(has(v, '#em-qcv'));
  click(opts[0]); const o2 = v.querySelectorAll('[data-q]'); click(o2[1]); await settle(); assert.ok(has(v, '#em-qnext') || has(v, '#em-qstop'), 'geen resultaat');
  click(must(v, '#em-fav')); assert.ok(has(v, '#em-poster'), 'poster-knop na bewaren');
});
await ok('Muziek: Verras me, dag, mashup en bouwstenen', async () => {
  const { muziekView } = await import('../docs/music.js'); const v = mkView(); muziekView(ctx(v)); await settle();
  const tabs = v.querySelectorAll('[data-tab]'); assert.ok(tabs.length >= 3, 'tabs');
  const songTab = tabs.find((t) => /lied/i.test(t.textContent) && t.dataset.tab !== 'studio') || tabs[1]; click(songTab); await settle();
  for (const act of ['r4surprise', 'r4daily', 'r4mash']) must(v, `[data-act="${act}"]`);
  click(must(v, '[data-act="r4surprise"]')); await settle(); assert.ok(/Verrassing/.test(txt(v)), 'geen verrassing-melding');
  click(must(v, '[data-act="r4daily"]')); await settle(); click(must(v, '[data-act="r4mash"]')); await settle(); assert.ok(/Mash-up/.test(txt(v)));
  const presets = v.querySelectorAll('[data-act="preset"]'); assert.ok(presets.length >= 25, 'voorbeelden ' + presets.length); click(presets.find((b) => b.dataset.k === 'salsa')); await settle();
  const loop = v.querySelector('[data-act="r4loop"]'); if (loop) { click(loop); await settle(); }
  cleanups.splice(0).forEach((f) => { try { f(); } catch { /* stil */ } });
});
await ok('Piano: liedjes, pads en liedje van de dag', async () => {
  const { pianoView } = await import('../docs/piano.js'); const v = mkView(); pianoView(ctx(v)); await settle();
  const tabs = v.querySelectorAll('[data-tab]'); const find = (re) => tabs.find((t) => re.test(t.textContent));
  const learn = find(/leer|lied/i) || tabs[1]; click(learn); await settle(); const html = txt(v); assert.ok(/Liedje van de dag/.test(html), 'geen dagliedje'); assert.ok(v.querySelectorAll('[data-song]').length >= 38, 'liedjes ' + v.querySelectorAll('[data-song]').length);
  click(v.querySelector('[data-song="stillenacht"]')); await settle();
  const pads = find(/pad|drum/i); if (pads) { click(pads); await settle(); assert.equal(v.querySelectorAll('.pi-pad').length, 18); }
  cleanups.splice(0).forEach((f) => { try { f(); } catch { /* stil */ } });
});
await ok('Dobbel: nieuwe spellen in het menu en starten', async () => {
  const { diceView } = await import('../docs/dice.js'); const v = mkView(); diceView(ctx(v)); await settle();
  click(must(v, '[data-tab="games"]')); await settle(); const g = v.querySelectorAll('[data-act="game"]'); assert.equal(g.length, 9, 'spellen ' + g.length);
  for (const id of ['hl', 'derby', 'bj', 'ms', 'gs']) { click(must(v, '#dc-tabs [data-tab="games"]')); click(v.querySelector(`[data-act="game"][data-g="${id}"]`)); await settle(); assert.ok(has(v, '#r4-t'), 'scherm ' + id); click(must(v, '[data-act="gmenu"]')); }
  click(must(v, '[data-tab="wheel"]')); await settle(); assert.ok(v.querySelectorAll('[data-act="wpreset"]').length >= 13, 'wielen');
  cleanups.splice(0).forEach((f) => { try { f(); } catch { /* stil */ } });
});
await ok('Pixel: sjablonen en code-delen', async () => {
  const { pixelView } = await import('../docs/pixel.js'); const v = mkView(); pixelView({ view: v, esc: (s) => String(s), uid: 'testuid' }); await settle();
  const tpl = v.querySelectorAll('[data-tpl]'); assert.ok(tpl.length >= 40, 'sjablonen ' + tpl.length); for (const id of ['#px-share', '#px-code', '#px-codeload', '#px-codein']) must(v, id);
  const idx = tpl.findIndex((b) => /Draaiende munt/.test(b.textContent)); assert.ok(idx > 0, 'munt-sjabloon'); globalThis.confirm = () => true; click(tpl[idx]); await settle();
  click(must(v, '#px-code')); await settle(); const code = must(v, '#px-codein').value; assert.ok(String(code).startsWith('PXA1:'), 'code gemaakt'); must(v, '#px-codein').value = code; click(must(v, '#px-codeload')); await settle();
});
console.log(failed ? `FOUT: ${failed} mislukt, ${n} gelukt` : `OK (${n} UI-tests)`);
process.exit(failed ? 1 : 0);
