// Rooktest van de Rekenen-schermen met een minimale nep-DOM. Gebruik: node tools/test-rekenen-ui.mjs
import assert from 'node:assert/strict';
import { install, El, click } from './_minidom.mjs';
const { body, T, store } = install();
const view = new El('div'); view.id = 'view'; body.appendChild(view);
const cleanups = []; const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const R = await import('../docs/rekenen.js');
assert.equal(R.evaluate('2+2'), 4);
await R.rekenenView({ view, esc, uid: 't1', db: null, addCleanup: (f) => cleanups.push(f) });
let n = 0; const ok = (c, m) => { n++; assert.ok(c, m); };
const q = (s) => view.querySelector(s), qa = (s) => view.querySelectorAll(s);
const text = () => view.textContent;
const typeAnswer = (a) => { for (const ch of String(a)) { const k = ch === '-' ? '−' : ch; const b = qa('[data-k]').find((x) => x.attrs['data-k'] === k); ok(b, `toets ${k}`); click(b); } click(qa('[data-k]').find((x) => x.attrs['data-k'] === 'OK')); };

ok(text().includes('Rekenen') && text().includes('Dagelijkse uitdaging') && qa('.tu-tile').length >= 17, 'hub');
ok(qa('img,span').some((e) => /gfx-icon/.test(e.className)), 'iconen');

// ---- oefenen: tafels niveau 1, alles goed
click(q('[data-arg="tafels"]')); ok(text().includes('Niveau 1') && text().includes('Niveau 5'), 'niveaus');
click(q('[data-lv="1"]'));
const solveTafel = (s) => { let m; if ((m = /^(\d+) × (\d+) = \?$/.exec(s))) return +m[1] * +m[2]; if ((m = /^(\d+) ÷ (\d+) = \?$/.exec(s))) return +m[1] / +m[2]; if ((m = /^(\d+) × \? = (\d+)$/.exec(s))) return +m[2] / +m[1]; throw new Error('onbekend: ' + s); };
for (let i = 0; i < 10; i++) { const s = q('[data-q]').textContent; typeAnswer(solveTafel(s)); ok(text().includes('Goed zo'), 'feedback goed'); T.advance(800); }
ok(text().includes('10 van 10 goed'), 'resultaat 10/10: ' + text().slice(0, 200));
const saved = JSON.parse(store.get('rekenen:v2:t1')); ok(saved.d.topics.tafels.stars[0] === 3 && saved.d.coins >= 15, 'opgeslagen');
click(q('[data-next]')); ok(text().includes('Tafels · niveau 2'), 'volgend niveau');
// fout antwoord geeft uitleg + volgende-knop
typeAnswer(9999); ok(text().includes('Niet goed') && q('[data-nx]'), 'fout'); click(q('[data-nx]'));
click(q('[data-quit]')); ok(text().includes('Niveau 2'), 'stoppen terug naar onderwerp');

// ---- andere onderwerpen laden en breuken met keuze / breuk-invoer
click(q('[data-go="hub"]'));
for (const t of ['optellen', 'breuken', 'meetkunde', 'geld', 'reeksen']) { click(q(`[data-arg="${t}"]`)); click(q('[data-lv="1"]')); ok(q('[data-q]') && q('[data-q]').textContent.length > 2, `start ${t}`); click(q('[data-quit]')); click(q('[data-go="hub"]')); }
click(q('[data-arg="breuken"]')); ok(q('[data-lv="2"]').disabled, 'niveau 2 vergrendeld'); click(q('[data-go="hub"]'));

// ---- tafelkamp
click(q('[data-go="tafels"]')); ok(qa('[data-f]').length === 100 && qa('[data-t]').length === 12, 'heatmap');
click(q('[data-t="7"]')); ok(/7/.test(q('[data-q]').textContent), 'tafel van 7'); click(q('[data-quit]'));
click(q('[data-weak]')); ok(q('[data-q]'), 'zwakke plekken'); click(q('[data-quit]')); click(q('[data-go="hub"]'));

// ---- dagelijkse uitdaging
click(q('[data-go="daily"]')); click(q('[data-start]')); ok(q('[data-q]'), 'daily start');
for (let i = 0; i < 8; i++) { const b = qa('[data-k]'); if (b.length) { typeAnswer(1); } else click(q('[data-c]')); if (q('[data-nx]')) click(q('[data-nx]')); else T.advance(800); }
ok(text().includes('van 8'), 'daily resultaat'); click(q('[data-back]'));
click(q('[data-go="daily"]')); ok(text().includes('Vandaag is gelukt'), 'daily klaar');
click(q('[data-go="hub"]'));

// ---- race
click(q('[data-go="race"]')); click(q('[data-start]')); ok(q('[data-lanes]'), 'race baan');
for (let i = 0; i < 6; i++) { const keys = qa('[data-k]'); if (keys.length) typeAnswer(0); else click(qa('[data-c]')[0]); T.advance(1400); }
T.advance(160000); ok(/Je (hebt gewonnen|werd)/.test(text()), 'race eind: ' + text().slice(0, 120));
click(q('[data-back]')); click(q('[data-go="hub"]'));

// ---- monsterjacht
click(q('[data-go="boss"]')); click(q('[data-m="0"]')); ok(q('[data-arena]'), 'arena');
let guard = 0; while (!/verslagen!|won deze keer/.test(text()) && guard++ < 60) { if (q('[data-k]')) typeAnswer(7777); else if (q('[data-c]')) click(qa('[data-c]')[0]); T.advance(1400); }
ok(/won deze keer|verslagen!/.test(text()), 'boss eind'); click(q('[data-back]')); click(q('[data-go="hub"]'));

// ---- puzzels
click(q('[data-go="puzzles"]')); ok(qa('[data-p]').length === 6, 'puzzelkeuze');
for (const p of ['magic', 'pyramid', 'make24', 'riddle', 'balance', 'sudoku']) {
  click(q(`[data-p="${p}"]`)); ok(q('[data-pz]') && q('[data-pz]').children.length > 0, `puzzel ${p}`);
  if (p === 'riddle' || p === 'balance') { typeAnswer(5); ok(/Goed|Nee/.test(text()), 'antwoord puzzel'); }
  if (p === 'magic' || p === 'sudoku') { const h = q('[data-hint]'); click(h); ok(/verklapt/.test(text()), 'hint'); }
  if (p === 'make24') { click(q('[data-n="0"]')); click(q('[data-o="+"]')); click(q('[data-bs]')); click(q('[data-ok]')); ok(/getal|Dat is|af|ontbreekt|Gebruik/i.test(text()), 'maak24 controle'); }
  click(q('[data-new]')); click(q('[data-go="puzzles"]'));
}
click(q('[data-go="hub"]'));

// ---- voortgang, gereedschap, instellingen
click(q('[data-go="progress"]')); ok(text().includes('Badges') && qa('.rk-badge').length === 18, 'voortgang'); click(q('[data-go="hub"]'));
click(q('[data-go="tools"]')); await new Promise((r) => T.realST(r, 20)); ok(text().includes('Rekenmachine') && qa('[data-k]').length > 20, 'gereedschap');
ok(q('[data-go="hub"]'), 'terugknop'); click(q('[data-go="hub"]'));
ok(q('[data-gear]'), 'gear-knop');
const sel = q('[data-world]'); sel.value = 'ruimte'; sel.onchange({ target: sel }); ok(JSON.parse(store.get('rekenen:v2:t1')).d.world === 'ruimte', 'wereld opgeslagen');
cleanups.forEach((f) => f());
console.log(`test-rekenen-ui: ${n} controles OK`);
process.exit(0);
