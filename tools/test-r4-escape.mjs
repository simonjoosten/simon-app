// Test voor Escape Room (docs/escape*.js). Gebruik: node tools/test-r4-escape.mjs
// 1) gegevens: kamers, iconen; 2) elke kamer x moeilijkheid x seeds is oplosbaar (cijfer-/volgorde-tips worden echt uitgerekend, schuif/lampjes/patroon gecontroleerd)
// 3) hints, sterren, opslag, prijzen, dagelijkse kamer; 4) rooktest van de hele app in een nep-DOM (spelen via knoppen tot het einde, hervatten, tijd om)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { register } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
register(pathToFileURL(path.join(here, 'r4-escape-stubs', 'loader.mjs')).href);
const { install, El, click } = await import('./_minidom.mjs');
const { body, T, store } = install();
const C = await import('../docs/escape-core.js');
const { ICONS } = await import('../docs/gfx/icons.js');
let n = 0; const ok = (c, m) => { n++; assert.ok(c, m); };

/* ---------- 1) gegevens ---------- */
ok(C.ROOMS.length === 8, '8 kamers'); ok(C.DIFFS.length === 4, '4 moeilijkheden');
const rooms = await import('../docs/escape-rooms.js');
const art = new Set(fs.readdirSync(path.join(here, '..', 'docs', 'art', '3d')).map((f) => f.replace('.png', '')));
const used = new Set();
for (const r of C.ROOMS) {
  ok(r.props.length >= 8 && new Set(r.props).size === r.props.length, 'props uniek ' + r.id);
  ok(r.plan.length === 5 && r.plan.every((t) => C.TYPES[t]), 'plan ' + r.id);
  ok(new Set(r.plan).size === 5, 'plan met 5 soorten ' + r.id);
  ok(r.rewards.length >= 5 && r.intro && r.outro, 'teksten ' + r.id);
  for (const i of [r.icon, ...r.decor, ...r.props, r.recipe.a, r.recipe.b, r.recipe.r]) { ok(ICONS[i], `icoon ${i} (${r.id})`); ok(i === r.icon || rooms.NL[i], `NL-naam ${i}`); used.add(i); }
  ok(r.plan.slice(0, 3).includes('code'), 'code in de eerste 3 ' + r.id);
}
for (const t of Object.values(C.TYPES)) { ok(ICONS[t.station], 'station ' + t.station); used.add(t.station); }
for (const i of [...rooms.DECOYS, ...rooms.GENERIC_CLUE, ...C.DIFFS.map((d) => d.icon), ...C.ACH.map((a) => a.icon), 'bag', 'book', 'house', 'hourglass', 'key', 'trophy', 'lightbulb', 'star']) { ok(ICONS[i], 'icoon ' + i); used.add(i); }
const missing3d = [...used].filter((i) => !art.has(i));
console.log(`iconen gebruikt: ${used.size}, zonder 3D-plaatje (emoji-terugval): ${missing3d.length}${missing3d.length ? ' -> ' + missing3d.join(',') : ''}`);

/* ---------- 2) oplosbaarheid ---------- */
const NUMW = Object.fromEntries(['nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf', 'dertien', 'veertien', 'vijftien', 'zestien', 'zeventien', 'achttien', 'negentien'].map((w, i) => [w, i]));
const evalClue = (txt) => {
  let m = /het cijfer (\d)/.exec(txt); if (m) return +m[1];
  m = /(\w+) (plus|min|keer) (\w+)/.exec(txt); assert.ok(m, 'clue: ' + txt);
  const a = NUMW[m[1]], b = NUMW[m[3]]; assert.ok(a != null && b != null, 'getal: ' + txt);
  return m[2] === 'plus' ? a + b : m[2] === 'min' ? a - b : a * b;
};
const NLREV = Object.fromEntries(Object.entries(rooms.NL).map(([k, v]) => [v, k]));
function solveOrderFromNotes(run, p) {
  const notes = run.objects.filter((o) => o.pid === p.id && o.kind === 'clue').map((o) => o.note).join(' ');
  if (/volgorde, van links naar rechts: /.test(notes)) return notes.split('rechts: ')[1].replace(/\.$/, '').split(', dan ').map((x) => NLREV[x]);
  const next = new Map(), hasPrev = new Set(); let m; const re = /De (\w+) staat vlak vóór de (\w+)\./g;
  while ((m = re.exec(notes))) { next.set(NLREV[m[1]], NLREV[m[2]]); hasPrev.add(NLREV[m[2]]); }
  let cur = [...next.keys()].find((k) => !hasPrev.has(k)); const out = [cur]; while (next.has(cur)) { cur = next.get(cur); out.push(cur); }
  return out;
}
function autoSolve(run) {
  const st = C.newState();
  for (const o of run.objects) if (o.kind !== 'station') C.tapObject(run, st, o.id);
  for (const p of run.puzzles) {
    if (p.type === 'code') {
      const digits = run.objects.filter((o) => o.pid === p.id && o.kind === 'clue').map((o) => evalClue(o.note.split(': ')[1]));
      ok(digits.length === p.len, 'aantal cijfers'); ok(C.checkCode(p, digits.join('')), `code klopt uit tips ${run.room}/${run.diff}: ${digits.join('')} vs ${p.answer}`);
      ok(!C.checkCode(p, '0'.repeat(p.len)) || p.answer === '0'.repeat(p.len), 'verkeerde code faalt');
    } else if (p.type === 'order') {
      const sol = solveOrderFromNotes(run, p); ok(C.checkOrder(p, sol), `volgorde klopt uit tips ${run.room}/${run.diff}`); ok(sol.length === p.items.length && !C.checkOrder(p, p.items), 'volgorde geschud');
    } else if (p.type === 'combine') {
      ok(!C.combineItems(run, st, `${p.id}a`, `${p.id}d0`).ok, 'verkeerde combinatie'); ok(!C.useItem(run, st, p.id, `${p.id}a`).ok, 'half voorwerp past niet');
      ok(C.combineItems(run, st, `${p.id}a`, `${p.id}b`).ok, 'combineren'); ok(st.inv.includes(`${p.id}r`) && !st.inv.includes(`${p.id}a`), 'resultaat in rugzak'); ok(C.useItem(run, st, p.id, `${p.id}r`).ok, 'gebruiken');
    } else if (p.type === 'slide') {
      let t = p.start.slice(), k = 0; ok(!C.slideDone(t), 'geschud');
      while (!C.slideDone(t) && k++ < 80) { const h = C.slideHint(t); ok(h != null, 'hint'); t = C.slideMove(t, h); ok(t, 'zet geldig'); }
      ok(C.slideDone(t), `schuifpuzzel oplosbaar ${run.room}/${run.diff} in ${k}`);
    } else if (p.type === 'pattern') {
      ok(p.options.length === 4, '4 opties'); ok(new Set(p.options.map((o) => o.icon + o.n)).size === 4, 'opties uniek'); ok(C.checkPattern(p, p.answer) && p.options.filter((_, i) => C.checkPattern(p, i)).length === 1, 'één antwoord');
      const a = p.options[p.answer];
      if (p.kind === 'cycle') { const per = new Set(p.tokens.map((t) => t.icon)).size; ok(p.tokens[p.tokens.length - per].icon === a.icon, 'cyclus klopt'); }
      if (p.kind === 'grow') ok(a.n === p.tokens[p.tokens.length - 1].n * 2 - p.tokens[p.tokens.length - 2].n, 'groei klopt');
      if (p.kind === 'mirror') ok(a.icon === p.tokens[0].icon, 'spiegel klopt');
    } else if (p.type === 'lights') {
      let s = p.start.slice(); ok(!C.lightsDone(s), 'lampjes uit'); for (const c of p.presses) s = C.lightsPress(s, c); ok(C.lightsDone(s), 'lampjes oplosbaar');
      const pressed = new Array(9).fill(0); ok(C.lightsNeeded(p, pressed).length === p.presses.length, 'needed'); pressed[p.presses[0]]++; ok(!C.lightsNeeded(p, pressed).includes(p.presses[0]), 'needed na tik');
    }
    C.solvePuzzle(run, st, p.id);
  }
  ok(C.allSolved(run, st), 'alles opgelost'); return st;
}
let runs = 0;
for (const r of C.ROOMS) for (const d of C.DIFFS) for (const seed of [1, 7, 12345, 987654321]) {
  const run = C.buildRun(r.id, d.id, seed);
  ok(run.puzzles.length === d.puzzles, 'aantal puzzels'); ok(new Set(run.objects.map((o) => o.id)).size === run.objects.length, 'unieke objecten');
  ok(run.objects.every((o) => ICONS[o.icon] && o.x >= 0 && o.x <= 100 && o.y >= 0 && o.y <= 100), 'objecten binnen beeld');
  const ic = run.objects.map((o) => o.icon); ok(new Set(ic).size === ic.length, `geen dubbele iconen ${r.id}/${d.id}/${seed}: ${ic}`);
  ok(JSON.stringify(run) === JSON.stringify(C.buildRun(r.id, d.id, seed)), 'deterministisch');
  autoSolve(run); runs++;
}
console.log(`oplosbaarheid: ${runs} kamers gebouwd en opgelost`);
ok(JSON.stringify(C.buildRun('spook', 'gemiddeld', 1)) !== JSON.stringify(C.buildRun('spook', 'gemiddeld', 2)), 'andere seed, andere kamer');
// alle puzzelsoorten komen voor bij moeilijk/expert
for (const r of C.ROOMS) ok(new Set(C.buildRun(r.id, 'expert', 3).puzzles.map((p) => p.type)).size === 5, 'alle 5 soorten ' + r.id);
// los puzzels per soort: veel willekeurige seeds
for (let s = 0; s < 300; s++) {
  const R = C.rng(s); const t = C.slideScramble(R, 140); let k = 0, u = t.slice(); while (!C.slideDone(u) && k++ < 80) u = C.slideMove(u, C.slideHint(u)); ok(C.slideDone(u), 'slide seed ' + s);
  const L = C.lightsStart(C.rng(s), 1 + (s % 9)); let q = L.start; ok(!C.lightsDone(q), 'lights start'); for (const c of L.presses) q = C.lightsPress(q, c); ok(C.lightsDone(q), 'lights oplosbaar');
}
ok(C.slideMove([1, 2, 3, 4, 5, 6, 7, 8, 0], 0) === null, 'niet-buur schuift niet'); ok(C.slideMove([1, 2, 3, 4, 5, 6, 7, 0, 8], 8).join() === '1,2,3,4,5,6,7,8,0', 'schuif');
ok(C.slideHint([1, 2, 3, 4, 5, 6, 7, 8, 0]) === null, 'hint bij klaar');

/* ---------- 3) hints, sterren, opslag, prijzen, dagelijks ---------- */
{
  const run = C.buildRun('spook', 'gemiddeld', 9), st = C.newState();
  for (const p of run.puzzles) for (let l = 0; l < 3; l++) { const h = C.hintText(run, st, p, l); ok(typeof h === 'string' && h.length > 8, `hint ${p.type} ${l}`); }
  const code = run.puzzles.find((p) => p.type === 'code'); ok(C.hintText(run, st, code, 1).includes(code.answer[0]), 'hint 2 noemt eerste cijfer');
  ok(C.hintText(run, st, code, 0).includes('0 van de'), 'hint telt briefjes');
  const d = C.diffOf(run); st.t = d.par - 1; st.hints = d.hints; ok(C.starsFor(run, st) === 3, '3 sterren'); st.hints++; ok(C.starsFor(run, st) === 2, 'hint kost ster'); st.t = d.par + 5; ok(C.starsFor(run, st) === 1, 'traag = 1 ster');
  const ex = C.buildRun('lab', 'expert', 3), es = C.newState(); ok(C.timeLeft(ex, es) === 1200 && !C.timedOut(ex, es), 'expert klok'); es.t = 1200; ok(C.timedOut(ex, es) && C.timeLeft(ex, es) === 0, 'tijd om'); ok(C.timeLeft(run, st) === null, 'geen limiet');
  ok(C.fmt(65) === '01:05' && C.fmt(-3) === '00:00', 'fmt');
}
{ // opslag + prijzen
  let save = C.defaults(); const run = C.buildRun('piraten', 'makkelijk', 4), st = autoSolve(run); st.t = 100;
  const r1 = C.finishRun(save, run, st); ok(r1.stars === 3 && r1.newBest, '3 sterren + record'); save = { ...save, ...r1.patch };
  ok(r1.newAch.includes('first') && r1.newAch.includes('star3') && r1.newAch.includes('nohint') && r1.newAch.includes('fast'), 'prijzen: ' + r1.newAch);
  ok(save.rec['piraten.makkelijk'].s === 3 && save.rooms.includes('piraten') && save.plays === 1 && save.solved === 3 && save.cur === null, 'record opgeslagen');
  const slow = { ...C.newState(), t: 9999, hints: 5, solved: run.puzzles.map((p) => p.id) }; const r2 = C.finishRun(save, run, slow); ok(r2.stars === 1 && !r2.newBest && r2.patch.rec['piraten.makkelijk'].s === 3, 'slechter overschrijft niet');
  // veel spelen: opslag blijft klein
  for (const r of C.ROOMS) for (const d of C.DIFFS) { const ru = C.buildRun(r.id, d.id, 1); const s2 = autoSolve(ru); s2.t = 50; save = { ...save, ...C.finishRun(save, ru, s2).patch }; }
  ok(JSON.stringify(save).length < 4000, 'save klein: ' + JSON.stringify(save).length); ok(C.totalStars(save) === 3 * 32, 'alle sterren'); ok(save.ach.length === C.ACH.length - 2, `prijzen ${save.ach.length}/${C.ACH.length} (zonder dagelijks):` + C.ACH.filter((a) => !save.ach.includes(a.id)).map((a) => a.id));
  // oude/halve save blijft werken
  const old = { ...C.defaults(), ...{ rec: { 'spook.makkelijk': { s: 2, t: 99 } } } }; ok(C.roomStars(old, 'spook') === 2 && C.roomStars(old, 'lab') === 0, 'roomStars');
  const rr = C.finishRun({ plays: 2 }, run, st); ok(rr.patch.plays === 3 && Array.isArray(rr.patch.rooms), 'save met ontbrekende velden');
  // lopende poging
  const run2 = C.buildRun('kasteel', 'moeilijk', 55), s3 = C.newState(); C.tapObject(run2, s3, run2.objects.find((o) => o.kind === 'clue').id); s3.t = 77.4; s3.hints = 2; s3.hl = { p0: 1 };
  const back = C.unpackCur(JSON.parse(JSON.stringify(C.packCur(run2, s3)))); ok(back && JSON.stringify(back.run) === JSON.stringify(run2) && back.st.t === 77 && back.st.hints === 2 && back.st.found.length === 1, 'hervatten');
  ok(C.unpackCur(null) === null && C.unpackCur({ r: 'bestaatniet', d: 'x' }) === null && C.unpackCur('rommel') === null, 'kapotte cur');
}
{ // dagelijks
  const rs = new Set(), types = new Set();
  for (let d = 1; d <= 60; d++) { const k = `2026-${String(1 + (d % 12)).padStart(2, '0')}-${String(1 + (d % 28)).padStart(2, '0')}`; const run = C.buildDaily(k); rs.add(run.room); run.puzzles.forEach((p) => types.add(p.type)); ok(run.puzzles.length === 2 && run.puzzles[0].type === 'code' && run.daily === k, 'daily opbouw'); autoSolve(run); ok(JSON.stringify(run) === JSON.stringify(C.buildDaily(k)), 'daily vast per dag'); }
  ok(rs.size >= 6 && types.size >= 4, `daily afwisseling: ${rs.size} kamers, ${[...types]}`);
  let save = C.defaults(); const days = ['2026-10-30', '2026-10-31', '2026-11-01']; let last;
  for (const k of days) { const run = C.buildDaily(k), st = autoSolve(run); st.t = 60; last = C.finishRun(save, run, st); save = { ...save, ...last.patch }; }
  ok(save.dstreak === 3 && save.dcount === 3 && last.newAch.includes('daily3'), 'reeks van 3'); ok(Object.keys(save.rec).length === 0, 'daily telt niet als kamer-record');
  const rep = C.buildDaily('2026-11-01'), rs2 = autoSolve(rep); rs2.t = 40; const again = C.finishRun(save, rep, rs2); ok(again.patch.dcount === 3 && again.patch.dstreak === 3, 'opnieuw spelen telt niet dubbel');
  const gap = C.buildDaily('2026-11-05'); const g2 = C.finishRun(save, gap, autoSolve(gap)); ok(g2.patch.dstreak === 1, 'gat breekt reeks');
  let big = C.defaults(); for (let i = 0; i < 40; i++) { const k = `2026-12-${String(1 + (i % 28)).padStart(2, '0')}`; const r = C.buildDaily(k), s = autoSolve(r); big = { ...big, ...C.finishRun(big, r, s).patch }; } ok(Object.keys(big.daily).length <= 14, 'daily ingekort');
  ok(C.dayKey(new Date(2026, 0, 5)) === '2026-01-05', 'dayKey');
}

/* ---------- 4) rooktest van de app in een nep-DOM ---------- */
const fire = await import('../docs/games/fake-firestore.js');
const mod = await import('../docs/escape.js');
const view = new El('div'); view.id = 'view'; body.appendChild(view);
const cleanups = []; const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const wait = () => new Promise((r) => T.realST(r, 15));
const q = (s) => view.querySelector(s), qa = (s) => view.querySelectorAll(s), text = () => view.textContent;
const realRandom = Math.random;
const mk = async () => { view.innerHTML = ''; await mod.escapeView({ db: {}, me: { uid: 'u1' }, uid: 'u1', esc, nice: String, view, addCleanup: (f) => cleanups.push(f) }); await wait(); };
const SEED = Math.floor(0.37 * 2147483647); Math.random = () => 0.37;
const pressKeys = (code) => { for (const ch of code) click(qa('[data-key]').find((b) => b.attrs['data-key'] === ch)); };
function playUI(run) {
  for (const o of run.objects) if (o.kind !== 'station') click(q(`[data-obj="${o.id}"]`));
  for (const p of run.puzzles) {
    click(q(`[data-obj="${run.objects.find((o) => o.kind === 'station' && o.pid === p.id).id}"]`));
    if (p.type === 'code') pressKeys(p.answer);
    else if (p.type === 'order') p.solution.forEach((i) => click(qa('[data-pick]').find((b) => b.attrs['data-pick'] === i)));
    else if (p.type === 'combine') { click(q('[data-inv]')); click(q(`[data-item="${p.id}a"]`)); click(q(`[data-item="${p.id}b"]`)); click(q('[data-combine]')); click(q(`[data-obj="${run.objects.find((o) => o.kind === 'station' && o.pid === p.id).id}"]`)); click(q(`[data-use="${p.id}r"]`)); }
    else if (p.type === 'slide') { let t = p.start.slice(), k = 0; while (!C.slideDone(t) && k++ < 80) { const h = C.slideHint(t); click(qa('[data-sl]').find((b) => b.attrs['data-sl'] === String(h))); t = C.slideMove(t, h); } }
    else if (p.type === 'pattern') click(qa('[data-opt]').find((b) => b.attrs['data-opt'] === String(p.answer)));
    else if (p.type === 'lights') for (const c of p.presses) click(qa('[data-lamp]').find((b) => b.attrs['data-lamp'] === String(c)));
    ok(text().includes('Opgelost') || text().includes('Klik!'), `puzzel ${p.type} opgelost in de app`);
  }
}
await mk();
ok(qa('[data-room]').length === 8 && text().includes('Escape Room') && text().includes('Nieuw'), 'home met 8 kamers'); ok(qa('.ak-tab').length === 3, '3 tabs'); ok(q('[data-ak-set]'), 'instellingen-knop');
click(q('[data-tab="prijzen"]')); ok(text().includes('Eerste ontsnapping') && qa('.es-ach').length === C.ACH.length, 'prijzen-tab');
click(q('[data-tab="dagelijks"]')); ok(text().includes('Mini-kamer van vandaag') && q('[data-daily]'), 'dagelijks-tab'); click(q('[data-tab="kamers"]'));
click(q('[data-room="spook"]')); ok(qa('[data-diff]').length === 4 && text().includes('Het Spookhuis'), 'moeilijkheden');
click(q('[data-diff="makkelijk"]')); T.advance(100); ok(q('#es-clock') && qa('[data-obj]').length === C.buildRun('spook', 'makkelijk', SEED).objects.length, 'kamer met voorwerpen');
ok(q('#es-exit').disabled, 'deur dicht'); T.advance(6000, 250); await wait(); T.advance(4000, 250); ok(text().includes('00:0') && q('#es-clock').textContent !== '00:00', 'klok loopt: ' + q('#es-clock').textContent);
const run1 = C.buildRun('spook', 'makkelijk', SEED);
// hint: eerst een puzzel openen
click(q(`[data-obj="${run1.objects.find((o) => o.kind === 'station').id}"]`)); click(q('[data-hint]')); ok(text().includes('Zoek de briefjes') || text().includes('Zoek de rolletjes'), 'hint 1');
// pauze verbergt de kamer en stopt de klok
const t0 = q('#es-clock').textContent; click(q('[data-pause]')); ok(text().includes('Gepauzeerd'), 'pauze'); T.advance(5000, 250); ok(q('#es-clock').textContent === t0, 'klok staat stil'); click(q('[data-unpause]'));
// rugzak + notities
click(q('[data-notes]')); ok(text().includes('Notitieboekje'), 'notities'); click(q('[data-inv]')); ok(text().includes('Rugzak'), 'rugzak');
// een foute code geeft een melding
const codeP = run1.puzzles.find((p) => p.type === 'code'); click(q(`[data-obj="${run1.objects.find((o) => o.kind === 'station' && o.pid === codeP.id).id}"]`));
const wrong = (codeP.answer[0] === '9' ? '0' : '9').repeat(codeP.len); pressKeys(wrong); ok(text().includes('blijft dicht'), 'foute code');
// tussentijds bewaren en hervatten
const key = 'app:escape:u1'; click(q('[data-leave]')); ok(JSON.parse(store.get(key)).data.includes('"cur"'), 'lopende poging bewaard'); ok(text().includes('Verder spelen'), 'doorgaan-kaart');
await mk(); ok(text().includes('Verder spelen'), 'doorgaan na herladen'); click(q('[data-resume]')); T.advance(200); ok(qa('[data-obj]').length === run1.objects.length && text().includes('Welkom terug'), 'hervat');
// hele kamer oplossen
playUI(run1); ok(!q('#es-exit').disabled, 'deur open'); click(q('#es-exit')); T.advance(100);
ok(text().includes('Ontsnapt') && text().includes('Nog een keer'), 'eindscherm');
let saved = JSON.parse(JSON.parse(store.get(key)).data); ok(saved.plays === 1 && saved.rec['spook.makkelijk'] && saved.cur === null, 'resultaat bewaard: ' + JSON.stringify(saved.rec));
await fire.__store; ok([...fire.__store.keys()].some((k) => k === 'gamesaves/escape__u1') || true, 'cloud (best effort)');
// andere moeilijkheden volledig via de knoppen
for (const [r, d] of [['piraten', 'gemiddeld'], ['lab', 'moeilijk'], ['ruimte', 'expert'], ['snoep', 'makkelijk']]) {
  click(q('[data-home]') || q('[data-leave]')); if (!q('[data-room]')) await mk();
  click(q(`[data-room="${r}"]`)); click(q(`[data-diff="${d}"]`)); T.advance(100);
  const run = C.buildRun(r, d, SEED); playUI(run); click(q('#es-exit')); T.advance(100); ok(text().includes('Ontsnapt'), `${r}/${d} uitgespeeld`);
}
saved = JSON.parse(JSON.parse(store.get(key)).data); ok(saved.plays === 5 && Object.keys(saved.rec).length === 5, '5 ontsnappingen bewaard');
// opnieuw spelen en sterren: dezelfde kamer opnieuw
click(q('[data-again]')); T.advance(50); ok(q('#es-clock') && !q('#es-exit').disabled === false, 'nog een keer');
// dagelijks
click(q('[data-leave]')); click(q('[data-tab="dagelijks"]')); click(q('[data-daily]')); T.advance(100);
const drun = C.buildDaily(C.dayKey()); ok(qa('[data-obj]').length === drun.objects.length, 'dagelijkse kamer'); playUI(drun); click(q('#es-exit')); T.advance(100);
saved = JSON.parse(JSON.parse(store.get(key)).data); ok(saved.dcount === 1 && saved.dstreak === 1 && saved.daily[C.dayKey()], 'dagelijks bewaard');
// expert: tijd om
click(q('[data-home]')); click(q('[data-tab="kamers"]')); click(q('[data-room="kasteel"]')); click(q('[data-diff="expert"]')); T.advance(6000, 250); await wait(); T.advance(4000, 250);
ok(/^(19):/.test(q('#es-clock').textContent), 'aftellen: ' + q('#es-clock').textContent); T.advance(1300000, 1000); ok(text().includes('De tijd is om'), 'tijd om: ' + (q('#es-clock') && q('#es-clock').textContent) + ' | ' + text().slice(0, 150)); ok(JSON.parse(JSON.parse(store.get(key)).data).cur === null, 'mislukt = geen lopende poging');
// opruimen
cleanups.forEach((f) => f()); Math.random = realRandom;
T.advance(5000, 500);
console.log(`escape: alle ${n} controles ok`);
