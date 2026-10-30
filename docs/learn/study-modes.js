// Learn Study: de leermodi (Leren, Oefenen, Toets, Levens, Talen, Flitskaarten).
// Elke start*-functie krijgt S (de gedeelde app-toestand uit study.js) en tekent in een schermvullend sessie-scherm.
import { h, mount, clear } from './study-ui.js?v=1';
import * as L from './study-logic.js?v=1';

const rnd = (S) => S.rand;

/* ---------- gedeelde bouwstenen ---------- */
export function waitTap(scr, btn, auto = 0) {
  return new Promise((res) => {
    let t = null; let done = false; const born = Date.now();
    const fin = (v) => { if (done) return; done = true; clearTimeout(t); document.removeEventListener('keydown', onKey); res(v); };
    const onKey = (e) => { if (Date.now() - born < 250) return; if (e.key === 'Enter' && !(e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))) { e.preventDefault(); fin(true); } };
    if (btn) btn.addEventListener('click', () => fin(true));
    document.addEventListener('keydown', onKey);
    if (auto) t = setTimeout(() => fin(true), auto);
    scr.onClose(() => fin(false));
  });
}
export async function askOne(S, scr, host, q, o = {}) {
  clear(host);
  let hnd;
  try { hnd = S.ask(host, q, { feedback: false, tts: !!S.tts.on, hints: S.fx().hints || 0, ...o }); } catch (e) { return { ok: false, ms: 0, given: undefined, error: true }; }
  scr.cancelers.add(hnd.cancel);
  let r; try { r = await Promise.race([hnd.promise, scr.aborted()]); } catch (e) { r = { ok: false, ms: 0, given: undefined }; }
  scr.cancelers.delete(hnd.cancel);
  return r || { ok: false, ms: 0 };
}
export function correctOf(S, q, given) { try { const c = S.C.checkAnswer(q, given); if (c && c.correct != null) return String(c.correct); } catch (e) { /* val terug */ } return L.givenText(q, q.t === 'num' ? q.a : q.a); }
// laat goed/fout zien; goed = korte groene balk (wacht niet), fout = paneel met uitleg en Doorgaan
export async function feedback(S, scr, host, q, r, { quick = true } = {}) {
  const ok = !!r.ok; const typo = r.typo; const hasX = !!q.x;
  S.snd(ok ? 'goed' : 'fout');
  const ans = correctOf(S, q, r.given);
  const box = h('div', { class: 'ls-fb ls-pop ' + (ok ? (typo ? 'half' : 'ok') : 'no') },
    h('h3', null, ok ? (typo ? 'Bijna goed! Let op de spelling' : ['Goed zo!', 'Top!', 'Yes!', 'Klopt!', 'Slim!'][Math.floor(Math.random() * 5)] + ' ✓') : 'Helaas, dat was niet goed'),
    (!ok || typo) && h('div', null, 'Het goede antwoord: ', h('b', null, ans)),
    !ok && r.given !== undefined && r.given !== '' && h('div', { class: 'ls-muted' }, 'Jij zei: ' + L.givenText(q, r.given)),
    hasX && h('div', { style: { marginTop: '6px' } }, '💡 ' + q.x));
  const btn = h('button', { class: 'ls-btn p big', style: { marginTop: '10px' } }, 'Doorgaan →');
  host.appendChild(box);
  if (ok && quick && !hasX && !typo) { await waitTap(scr, null, 750); return; }
  host.appendChild(btn); try { btn.focus(); } catch (e) { /* ok */ }
  S.speakAnswer(q, ok);
  await waitTap(scr, btn, 0);
}
export function resultView(S, scr, { emoji = '🎉', title = 'Klaar!', big = '', stats = [], wrongs = [], rewardRes = null, buttons = [], extra = null }) {
  const body = scr.body; clear(body);
  const box = h('div', { class: 'ls-pop' },
    h('div', { style: { textAlign: 'center', fontSize: '56px' } }, emoji),
    h('h2', { style: { textAlign: 'center', margin: '4px 0' } }, title),
    big && h('div', { class: 'ls-big' }, big),
    stats.length && h('div', { class: 'ls-stat' }, stats.map((s) => h('div', null, h('b', null, String(s[0])), h('span', null, s[1])))),
    rewardRes && (rewardRes.xp || rewardRes.coins) ? h('div', { class: 'ls-card', style: { textAlign: 'center' } }, `+${rewardRes.xp} XP   +${rewardRes.coins} 🪙`) : null,
    extra,
    wrongs.length ? h('div', { class: 'ls-card' }, h('h3', null, 'Om nog even te oefenen'), wrongs.slice(0, 30).map((w) => h('div', { class: 'ls-li' }, h('span', null, '❌'), h('div', { class: 'ls-grow' }, h('div', null, w.q.q), h('div', { class: 'ls-muted' }, 'Goed: ' + w.correct + (w.given !== undefined && w.given !== '' ? ' · jij: ' + L.givenText(w.q, w.given) : '')))))) : null,
    h('div', { class: 'ls-row', style: { marginTop: '8px' } }, buttons.map((b) => h('button', { class: 'ls-btn ' + (b.p ? 'p' : ''), style: { flex: 1 }, onclick: b.fn }, b.text))));
  body.appendChild(box); scr.prog(100); S.snd('win');
}
function toTypeQ(S, q) { try { if (S.C.toTypeQ) { const r = S.C.toTypeQ(q); if (r) return r; } } catch (e) { /* eigen versie */ } if (q.t !== 'mc') return q; const r = { ...q, t: 'type' }; delete r.o; return r; }
function setupRow(label, chips, cur, onPick) {
  const wrap = h('div', null, h('span', { class: 'ls-lab' }, label)); const row = h('div', { class: 'ls-chips' }); wrap.appendChild(row);
  const draw = () => mount(row, chips.map((c) => h('button', { class: 'ls-chip' + (String(cur.v) === String(c.v) ? ' on' : ''), onclick: () => { cur.v = c.v; onPick && onPick(c.v); draw(); } }, c.l)));
  draw(); return wrap;
}
function multiRow(label, chips, set, onChange) {
  const wrap = h('div', null, h('span', { class: 'ls-lab' }, label)); const row = h('div', { class: 'ls-chips' }); wrap.appendChild(row);
  const draw = () => mount(row, chips.map((c) => h('button', { class: 'ls-chip' + (set.has(c.v) ? ' on' : ''), onclick: () => { if (set.has(c.v)) { if (set.size > 1) set.delete(c.v); } else set.add(c.v); onChange && onChange(); draw(); } }, c.l)));
  draw(); return wrap;
}
function typeChips(kit) { const c = L.typesIn(kit.qs); return Object.keys(c).map((t) => ({ v: t, l: `${L.TYPE_EMOJI[t]} ${L.TYPES[t]} (${c[t]})` })); }
function ttsToggle(S) { const cur = { v: S.tts.on ? 1 : 0 }; return setupRow('Voorlezen', [{ v: 1, l: '🔊 Aan' }, { v: 0, l: '🔇 Uit' }], cur, (v) => S.setTts(!!+v)); }
function doReward(S, p) { try { return S.reward(p); } catch (e) { return null; } }

/* ---------- LEREN (Leitner) ---------- */
export async function startLeren(S, kit, o = {}) {
  const C = S.C; try { await C.Prog.load(); } catch (e) { /* ok */ }
  const scr = S.screen(`${kit.emoji || '📘'} Leren`);
  const n = o.n || 10; const rand = rnd(S);
  let ordered; try { ordered = C.Prog.dueFirst(kit) || kit.qs; } catch (e) { ordered = kit.qs; }
  if (o.qs) ordered = o.qs;
  const withBox = ordered.map((q) => { let b = 0; try { b = C.Prog.box(kit.id, q) || 0; } catch (e) { /* 0 */ } return { q, box: b }; });
  const plan = L.planSession(withBox, n);
  if (!plan.length) { mount(scr.body, h('div', { class: 'ls-card' }, 'Deze kit heeft nog geen vragen.')); return scr; }
  const queue = new L.LearnQueue(plan.map((p, i) => ({ id: i, q: p.q, box: p.box, steps: L.stepsFor(p.q, p.box) })));
  const body = scr.body; const missed = new Map(); let nCorrect = 0, nWrong = 0;
  while (!queue.done && !scr.closed) {
    const { item, step, retry } = queue.current();
    scr.prog((queue.progress().done / queue.total) * 100);
    clear(body);
    const q = item.q;
    if (step === 'card') {
      const c = L.cardText(q); S.speak(q.say || q.q, q.lang, false);
      const btn = h('button', { class: 'ls-btn p big' }, 'Snap ik, volgende →');
      body.appendChild(h('div', null, h('div', { class: 'ls-muted', style: { textAlign: 'center' } }, '🆕 Nieuwe kaart · bekijk goed'),
        h('div', { class: 'ls-learncard ls-pop' }, c.e && h('div', { class: 'e' }, c.e), h('div', { class: 'f' }, c.front), h('div', { class: 'b' }, c.back), c.x && h('div', { class: 'ls-muted' }, '💡 ' + c.x)),
        h('div', { class: 'ls-row' }, h('button', { class: 'ls-btn', onclick: () => S.speak(q.say || q.q + '. ' + c.back, q.lang, true) }, '🔊 Voorlezen'), h('div', { class: 'ls-grow' }, btn))));
      await waitTap(scr, btn); if (scr.closed) break; queue.advance(true); continue;
    }
    let qq = q;
    if (step === 'mc') qq = L.makeMc(q, kit.qs, rand) || q;
    else if (step === 'type') qq = toTypeQ(S, q);
    body.appendChild(h('div', { class: 'ls-muted', style: { textAlign: 'center' } }, retry ? '🔁 Nog een keer' : step === 'mc' ? 'Kies het goede antwoord' : 'Typ het antwoord'));
    const host = h('div'); const fbh = h('div'); body.appendChild(host); body.appendChild(fbh);
    const r = await askOne(S, scr, host, qq, {});
    if (scr.closed) break;
    const res = queue.advance(r.ok);
    if (r.ok) nCorrect++; else { nWrong++; if (!missed.has(item.id)) missed.set(item.id, { q, correct: correctOf(S, qq, r.given), given: r.given }); }
    if (res.record !== null && res.record !== undefined) { try { C.Prog.record(kit.id, q, res.record, r.ms || 0); } catch (e) { /* ok */ } }
    await feedback(S, scr, fbh, qq, r);
  }
  if (scr.closed) return scr;
  const rw = doReward(S, { correct: nCorrect, wrong: nWrong, mode: 'leren' });
  const pm = (() => { try { return C.Prog.mastery(kit.id, kit); } catch (e) { return null; } })();
  resultView(S, scr, { emoji: nWrong === 0 ? '🌟' : '🎉', title: 'Sessie klaar!', big: pm ? `Je kent ${Math.round(pm.pct)}% van deze kit` : '', stats: [[nCorrect, 'goed'], [nWrong, 'fout'], [queue.total, 'kaarten']], wrongs: [...missed.values()], rewardRes: rw,
    buttons: [{ text: '🎓 Nog een ronde', p: 1, fn: () => { scr.close(); startLeren(S, kit, { n }); } }, { text: 'Klaar', fn: () => scr.close() }] });
  return scr;
}

/* ---------- OEFENEN ---------- */
export function startOefenen(S, kit, o = {}) {
  const scr = S.screen(`${kit.emoji || '📘'} Oefenen`);
  if (o.qs && o.qs.length) { runOefen(S, scr, kit, o.qs, o); return scr; }
  const types = new Set(Object.keys(L.typesIn(kit.qs))); const cn = { v: 10 }, cd = { v: 0 }, cw = { v: 0 };
  const start = h('button', { class: 'ls-btn p big', style: { marginTop: '12px' }, onclick: () => {
    let qs = [];
    const nn = +cn.v || kit.qs.length; const hard = +cd.v || undefined;
    const allowed = kit.qs.filter((q) => types.has(q.t) && (!hard || (q.d || 2) <= hard));
    const pool = { ...kit, qs: allowed.length ? allowed : kit.qs };
    try { qs = S.C.pick(pool, Math.min(nn, 100), { types: [...types], hard, weakFirst: !!+cw.v, kitId: kit.id, seed: Date.now() % 100000 }) || []; } catch (e) { qs = L.shuf(pool.qs, S.rand).slice(0, nn); }
    if (!qs.length) qs = L.shuf(pool.qs, S.rand).slice(0, nn);
    runOefen(S, scr, kit, qs, o);
  } }, '▶ Start oefenen');
  mount(scr.body, h('div', { class: 'ls-card' }, h('h3', null, 'Oefenen'), h('div', { class: 'ls-muted' }, 'Vrij oefenen met meteen uitleg. Kies wat je wilt.'),
    multiRow('Vraagsoorten', typeChips(kit), types), setupRow('Aantal vragen', [{ v: 5, l: '5' }, { v: 10, l: '10' }, { v: 20, l: '20' }, { v: 50, l: '50' }], cn),
    setupRow('Moeilijkheid', [{ v: 0, l: 'Alles' }, { v: 1, l: '😊 Makkelijk' }, { v: 2, l: '🙂 Gemiddeld' }, { v: 3, l: '🔥 Moeilijk' }], cd),
    setupRow('Welke vragen', [{ v: 0, l: 'Door elkaar' }, { v: 1, l: '🎯 Zwakke eerst' }], cw), ttsToggle(S), start));
  return scr;
}
async function runOefen(S, scr, kit, qs, o) {
  const C = S.C; const body = scr.body; let ok = 0, bad = 0; const wrongs = []; const total = qs.length;
  for (let i = 0; i < qs.length && !scr.closed; i++) {
    scr.prog((i / total) * 100); scr.title(`Vraag ${i + 1}/${total}`);
    clear(body); const host = h('div'); const fb = h('div'); body.appendChild(host); body.appendChild(fb);
    const q = qs[i]; const r = await askOne(S, scr, host, q, {});
    if (scr.closed) return;
    if (r.ok) ok++; else { bad++; wrongs.push({ q, correct: correctOf(S, q, r.given), given: r.given }); }
    try { C.Prog.record(kit.id, q, !!r.ok, r.ms || 0); } catch (e) { /* ok */ }
    await feedback(S, scr, fb, q, r);
  }
  if (scr.closed) return;
  const rw = doReward(S, { correct: ok, wrong: bad, mode: 'oefen' });
  resultView(S, scr, { emoji: bad === 0 ? '🏆' : '💪', title: bad === 0 ? 'Foutloos!' : 'Goed geoefend', big: `${ok} van ${total} goed`, stats: [[ok, 'goed'], [bad, 'fout'], [Math.round((ok / Math.max(1, total)) * 100) + '%', 'score']], wrongs, rewardRes: rw,
    buttons: [wrongs.length && { text: '🔁 Oefen mijn fouten', p: 1, fn: () => { scr.close(); startOefenen(S, kit, { qs: wrongs.map((w) => w.q) }); } }, { text: 'Opnieuw', p: !wrongs.length, fn: () => { scr.close(); startOefenen(S, kit); } }, { text: 'Klaar', fn: () => scr.close() }].filter(Boolean) });
}

/* ---------- TOETS ---------- */
export function startToets(S, kit) {
  const C = S.C; const scr = S.screen(`${kit.emoji || '📘'} Toets`);
  const types = new Set(Object.keys(L.typesIn(kit.qs))); const cn = { v: 10 }, ct = { v: 0 };
  const hist = (() => { try { return C.Prog.history(kit.id) || []; } catch (e) { return []; } })();
  const start = h('button', { class: 'ls-btn p big', style: { marginTop: '12px' }, onclick: () => {
    const pool = { ...kit, qs: kit.qs.filter((q) => types.has(q.t)) };
    const nn = Math.min(+cn.v || pool.qs.length, pool.qs.length);
    let qs; try { qs = C.pick(pool, nn, { types: [...types], kitId: kit.id, seed: Date.now() % 100000 }) || []; } catch (e) { qs = L.shuf(pool.qs, S.rand).slice(0, nn); }
    if (!qs.length) qs = L.shuf(pool.qs, S.rand).slice(0, nn);
    runToets(S, scr, kit, qs, +ct.v * 60);
  } }, '▶ Start toets');
  mount(scr.body, h('div', { class: 'ls-card' }, h('h3', null, 'Toets'), h('div', { class: 'ls-muted' }, 'Geen hulp en geen uitleg tijdens de toets. Aan het eind krijg je een cijfer.'),
    setupRow('Aantal vragen', [{ v: 10, l: '10' }, { v: 20, l: '20' }, { v: 30, l: '30' }, { v: 0, l: 'Alles' }], cn),
    setupRow('Tijd', [{ v: 0, l: 'Geen limiet' }, { v: 5, l: '5 min' }, { v: 10, l: '10 min' }, { v: 20, l: '20 min' }], ct),
    multiRow('Vraagsoorten', typeChips(kit), types), start), historyCard(hist));
  return scr;
}
export function historyCard(hist) {
  if (!hist || !hist.length) return h('div', { class: 'ls-card ls-muted' }, 'Nog geen toetsen gemaakt voor deze kit.');
  const list = hist.slice(-8).reverse();
  return h('div', { class: 'ls-card' }, h('h3', null, '📈 Eerdere toetsen'), list.map((x) => h('div', { class: 'ls-li' }, h('b', { style: { width: '44px' } }, String(x.grade != null ? String(x.grade).replace('.', ',') : '–')), h('div', { class: 'ls-grow ls-muted' }, `${x.score != null ? x.score : '?'}/${x.total || '?'} goed${x.t ? ' · ' + new Date(x.t).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : ''}`))));
}
async function runToets(S, scr, kit, qs, limit) {
  const C = S.C; const body = scr.body; const rec = []; let left = limit; let timedOut = false;
  if (limit) { const iv = setInterval(() => { left--; scr.title(`⏱ ${L.fmtTime(left)}`); if (left <= 0) { timedOut = true; clearInterval(iv); scr.abortAll(); } }, 1000); S.track(() => clearInterval(iv)); scr.onClose(() => clearInterval(iv)); scr.title(`⏱ ${L.fmtTime(left)}`); }
  for (let i = 0; i < qs.length && !scr.closed && !timedOut; i++) {
    scr.prog((i / qs.length) * 100); if (!limit) scr.title(`Vraag ${i + 1}/${qs.length}`);
    clear(body); body.appendChild(h('div', { class: 'ls-muted', style: { textAlign: 'center', marginBottom: '6px' } }, `Vraag ${i + 1} van ${qs.length}`));
    const host = h('div'); body.appendChild(host);
    const q = qs[i]; const r = await askOne(S, scr, host, q, { hints: 0, tts: !!S.tts.on });
    if (scr.closed) return;
    if (r.aborted) break;
    rec.push({ q, ok: !!r.ok, partial: r.partial || 0, given: r.given, ms: r.ms || 0, correct: correctOf(S, q, r.given) });
    try { C.Prog.record(kit.id, q, !!r.ok, r.ms || 0); } catch (e) { /* ok */ }
  }
  if (scr.closed) return;
  while (rec.length < qs.length) { const q = qs[rec.length]; rec.push({ q, ok: false, partial: 0, given: undefined, ms: 0, correct: correctOf(S, q, undefined), skipped: true }); }
  const score = rec.reduce((s, x) => s + (x.ok ? 1 : (x.partial || 0)), 0); const total = rec.length; const grade = L.gradeFor(score, total);
  const good = rec.filter((x) => x.ok).length;
  try { C.Prog.addResult(kit.id, { t: Date.now(), grade, score: Math.round(score * 10) / 10, total, pct: Math.round((score / total) * 100) }); } catch (e) { /* ok */ }
  const rw = doReward(S, { correct: good, wrong: total - good, mode: 'toets', grade });
  const wrongs = rec.filter((x) => !x.ok);
  const overview = h('div', { class: 'ls-card' }, h('h3', null, 'Alle vragen'), rec.map((x, i) => h('div', { class: 'ls-li' }, h('span', null, x.ok ? '✅' : '❌'), h('div', { class: 'ls-grow' }, h('div', null, `${i + 1}. ${x.q.q}`), h('div', { class: 'ls-muted' }, 'Goed: ' + x.correct + (x.ok ? '' : x.skipped ? ' · niet beantwoord' : ' · jij: ' + L.givenText(x.q, x.given)))))));
  let hist = []; try { hist = C.Prog.history(kit.id) || []; } catch (e) { /* ok */ }
  resultView(S, scr, { emoji: grade >= 5.5 ? '🎓' : '🌱', title: L.gradeLabel(grade), big: '', stats: [[good, 'goed'], [total - good, 'fout'], [Math.round((score / total) * 100) + '%', 'score']], rewardRes: rw,
    extra: h('div', null, h('div', { class: 'ls-card' }, h('div', { class: 'ls-muted', style: { textAlign: 'center' } }, 'Jouw cijfer'), h('div', { class: 'ls-grade' }, String(grade).replace('.', ',')), timedOut ? h('div', { class: 'ls-muted', style: { textAlign: 'center' } }, '⏱ De tijd was om') : null), overview, historyCard(hist)),
    buttons: [wrongs.length && { text: '🔁 Oefen mijn fouten', p: 1, fn: () => { scr.close(); startOefenen(S, kit, { qs: wrongs.map((w) => w.q) }); } }, { text: 'Nieuwe toets', fn: () => { scr.close(); startToets(S, kit); } }, { text: 'Klaar', fn: () => scr.close() }].filter(Boolean) });
}

/* ---------- LEVENS-MODUS ---------- */
export function startLevens(S, kit) {
  const C = S.C; const scr = S.screen(`${kit.emoji || '📘'} Levens-modus`);
  const fx = S.fx(); const hi = S.store.get('hi:' + kit.id, 0); const ct = { v: 0 };
  const start = h('button', { class: 'ls-btn p big', style: { marginTop: '12px' }, onclick: () => runLevens(S, scr, kit, +ct.v, fx) }, '▶ Start');
  mount(scr.body, h('div', { class: 'ls-card' }, h('h3', null, '❤️ Levens-modus'), h('div', { class: 'ls-muted' }, `Je hebt ${3 + (fx.extraLives || 0)} levens${fx.shield ? ` en ${fx.shield} schild${fx.shield > 1 ? 'en' : ''} 🛡️` : ''}. Elk foutje kost een leven. Hoe lang kom je? Elke 10 goede antwoorden op rij geeft een extra leven.`), h('div', { style: { marginTop: '6px' } }, '🏆 Jouw record: ', h('b', null, String(hi))),
    setupRow('Tempo', [{ v: 0, l: '🐢 Rustig' }, { v: 20, l: '20 sec' }, { v: 10, l: '10 sec' }], ct), ttsToggle(S), start));
  return scr;
}
async function runLevens(S, scr, kit, secs, fx) {
  const C = S.C; const body = scr.body; const st = new L.LivesState({ lives: 3 + (fx.extraLives || 0), shield: fx.shield || 0 });
  let pool = []; let seed = Date.now() % 100000; const seen = new Set(); const wrongs = []; const rand = rnd(S);
  const refill = () => { let qs = []; try { qs = C.pick(kit, Math.min(20, Math.max(5, kit.qs.length)), { seed: seed++, weakFirst: true, kitId: kit.id, avoid: seen }) || []; } catch (e) { qs = L.shuf(kit.qs, rand).slice(0, 20); } if (!qs.length) qs = L.shuf(kit.qs, rand).slice(0, 20); pool = qs; if (seen.size > kit.qs.length * 0.8) seen.clear(); };
  while (!st.over && !scr.closed) {
    if (!pool.length) refill();
    const q = pool.shift(); try { seen.add(C.qkey(q)); } catch (e) { /* ok */ }
    clear(body);
    const hud = h('div', { class: 'ls-row sp' }, h('div', { class: 'ls-hearts' }, '❤️'.repeat(Math.max(0, st.lives)) + (st.shield ? '🛡️'.repeat(st.shield) : '')), h('div', null, h('b', null, '🔥 ' + st.streak), '  ', h('span', { class: 'ls-muted' }, `${st.score} punten`)));
    body.appendChild(hud); const host = h('div'); const fb = h('div'); body.appendChild(host); body.appendChild(fb);
    const r = await askOne(S, scr, host, q, { time: secs || 0, hints: fx.hints || 0 });
    if (scr.closed) return;
    const prev = st.lives; st.step(!!r.ok, 0);
    try { C.Prog.record(kit.id, q, !!r.ok, r.ms || 0); } catch (e) { /* ok */ }
    if (!r.ok) wrongs.push({ q, correct: correctOf(S, q, r.given), given: r.given });
    scr.prog(Math.min(100, st.streak * 5));
    await feedback(S, scr, fb, q, r, { quick: true });
  }
  if (scr.closed) return;
  const hi = S.store.get('hi:' + kit.id, 0); const record = st.score > hi; if (record) S.store.set('hi:' + kit.id, st.score);
  const rw = doReward(S, { correct: st.correct, wrong: st.wrong, mode: 'levens', best: st.best });
  resultView(S, scr, { emoji: record ? '🏆' : '💔', title: record ? 'Nieuw record!' : 'Alle levens op', big: `${st.score} punten`, stats: [[st.correct, 'goed'], [st.best, 'beste reeks'], [record ? 'NIEUW' : hi, 'record']], wrongs: wrongs.slice(-8), rewardRes: rw,
    buttons: [{ text: '❤️ Nog een keer', p: 1, fn: () => { scr.close(); startLevens(S, kit); } }, { text: 'Klaar', fn: () => scr.close() }] });
}

/* ---------- TALEN ---------- */
export function startTalen(S, kit, o = {}) {
  const words = L.wordsOf(kit);
  const scr = S.screen('🗣 Woordjes leren');
  if (words.length < 3) { mount(scr.body, h('div', { class: 'ls-card' }, 'Deze kit heeft geen woordjes in een andere taal. Kies een taalkit (bijvoorbeeld Engels of Frans) of maak er een met plak-import.'), h('button', { class: 'ls-btn', onclick: () => scr.close() }, 'Terug')); return scr; }
  const cd = { v: o.dir || 'nl2xx' }, cn = { v: 10 };
  const start = h('button', { class: 'ls-btn p big', style: { marginTop: '12px' }, onclick: () => runTalen(S, scr, kit, words, cd.v, +cn.v) }, '▶ Start');
  const phases = h('div', { class: 'ls-muted' }, 'Fases: 👀 Zien en horen → 🔘 Kiezen → ⌨️ Typen → 🎧 Luisteren en typen. Elk woord gaat vanzelf naar de volgende fase als je het goed doet.');
  mount(scr.body, h('div', { class: 'ls-card' }, h('h3', null, `${kit.emoji || '🗣'} ${kit.name}`), h('div', { class: 'ls-muted' }, `${words.length} woordjes`), phases,
    setupRow('Richting', [{ v: 'nl2xx', l: 'NL → taal' }, { v: 'xx2nl', l: 'taal → NL' }, { v: 'mix', l: '🔀 Gemengd' }], cd), setupRow('Aantal woordjes', [{ v: 5, l: '5' }, { v: 10, l: '10' }, { v: 15, l: '15' }], cn), ttsToggle(S), start));
  return scr;
}
async function runTalen(S, scr, kit, words, dir, n) {
  const C = S.C; try { await C.Prog.load(); } catch (e) { /* ok */ }
  const rand = rnd(S); const canSpeak = (() => { try { return !!C.TTS.supported(); } catch (e) { return false; } })();
  let order = words.map((w) => w.q); try { order = C.Prog.dueFirst({ ...kit, qs: order }) || order; } catch (e) { /* ok */ }
  const byQ = new Map(words.map((w) => [w.q, w]));
  const withBox = order.map((q) => { let b = 0; try { b = C.Prog.box(kit.id, q) || 0; } catch (e) { /* 0 */ } return { q, box: b }; });
  const plan = L.planSession(withBox, n);
  const queue = new L.LearnQueue(plan.map((p, i) => ({ id: i, q: p.q, w: byQ.get(p.q), box: p.box, steps: L.phaseStepsForBox(p.box).filter((s) => canSpeak || s !== 'listen').concat([]) })).map((it) => ({ ...it, steps: it.steps.length ? it.steps : ['type'] })));
  const body = scr.body; let nOk = 0, nBad = 0; const missed = new Map();
  while (!queue.done && !scr.closed) {
    const { item, step, retry } = queue.current(); const w = item.w;
    scr.prog((queue.progress().done / queue.total) * 100); clear(body);
    const d = L.dirOf(dir, w);
    if (step === 'see') {
      S.speak(w.fo, w.lang, false);
      const btn = h('button', { class: 'ls-btn p big' }, 'Volgende →');
      body.appendChild(h('div', null, h('div', { class: 'ls-muted', style: { textAlign: 'center' } }, `${L.PHASE_NAMES.see} · ${S.C.LANGS && S.C.LANGS[w.lang] ? S.C.LANGS[w.lang].name : w.lang}`),
        h('div', { class: 'ls-learncard ls-pop' }, w.e && h('div', { class: 'e' }, w.e), h('div', { class: 'f' }, d === 'xx2nl' ? w.fo : w.nl), h('div', { class: 'b' }, d === 'xx2nl' ? w.nl : w.fo), w.x && h('div', { class: 'ls-muted' }, '💡 ' + w.x)),
        h('div', { class: 'ls-row' }, h('button', { class: 'ls-btn', onclick: () => S.speak(w.fo, w.lang, true) }, '🔊 Hoor het'), h('div', { class: 'ls-grow' }, btn))));
      await waitTap(scr, btn); if (scr.closed) break; queue.advance(true); continue;
    }
    const q = L.langQuestion(w, step, dir, words, rand);
    body.appendChild(h('div', { class: 'ls-muted', style: { textAlign: 'center' } }, (retry ? '🔁 ' : '') + L.PHASE_NAMES[step]));
    const host = h('div'); const fb = h('div'); body.appendChild(host); body.appendChild(fb);
    const r = await askOne(S, scr, host, q, { tts: step === 'listen' ? true : false });
    if (scr.closed) break;
    const res = queue.advance(r.ok);
    if (r.ok) nOk++; else { nBad++; if (!missed.has(item.id)) missed.set(item.id, { q: { q: w.nl + ' = ' + w.fo }, correct: w.fo, given: r.given }); }
    if (res.record !== null && res.record !== undefined) { try { C.Prog.record(kit.id, w.q, res.record, r.ms || 0); } catch (e) { /* ok */ } }
    if (r.ok && step !== 'listen') S.speak(w.fo, w.lang, false);
    await feedback(S, scr, fb, q, r);
  }
  if (scr.closed) return;
  const rw = doReward(S, { correct: nOk, wrong: nBad, mode: 'leren' });
  resultView(S, scr, { emoji: '🗣', title: 'Woordjes gedaan!', big: `${queue.total} woordjes geoefend`, stats: [[nOk, 'goed'], [nBad, 'fout'], [queue.total, 'woordjes']], wrongs: [...missed.values()], rewardRes: rw,
    buttons: [{ text: '🗣 Nog een ronde', p: 1, fn: () => { scr.close(); startTalen(S, kit, { dir }); } }, { text: 'Klaar', fn: () => scr.close() }] });
}

/* ---------- FLITSKAARTEN ---------- */
export function startFlits(S, kit) {
  const scr = S.screen(`${kit.emoji || '📘'} Flitskaarten`);
  const cn = { v: 20 }, cs = { v: 'q' };
  const start = h('button', { class: 'ls-btn p big', style: { marginTop: '12px' }, onclick: () => runFlits(S, scr, kit, cs.v, +cn.v) }, '▶ Start');
  mount(scr.body, h('div', { class: 'ls-card' }, h('h3', null, 'Flitskaarten'), h('div', { class: 'ls-muted' }, 'Tik op de kaart om om te draaien. Sleep naar rechts als je het wist, naar links als nog niet.'),
    setupRow('Aantal kaarten', [{ v: 10, l: '10' }, { v: 20, l: '20' }, { v: 50, l: '50' }, { v: 0, l: 'Alles' }], cn), setupRow('Voorkant', [{ v: 'q', l: 'Vraag' }, { v: 'a', l: 'Antwoord' }], cs), ttsToggle(S), start));
  return scr;
}
async function runFlits(S, scr, kit, side, n) {
  const C = S.C; const body = scr.body; const rand = rnd(S);
  let pick = L.shuf(kit.qs, rand); if (n) pick = pick.slice(0, n);
  const deck = new L.FlashDeck(pick, rand); let totalKnown = 0;
  const kitLang = kit.lang && kit.lang !== 'nl' ? kit.lang : null;
  while (!scr.closed) {
    while (!deck.done && !scr.closed) {
      const q = deck.current(); const c = L.cardText(q); const rev = side === 'a';
      scr.prog((deck.i / deck.items.length) * 100); scr.title(`Kaart ${deck.i + 1}/${deck.items.length}${deck.round > 1 ? ' · ronde ' + deck.round : ''}`);
      const flip = h('div', { class: 'ls-flip' }, h('div', { class: 'ls-flip-in' },
        h('div', { class: 'ls-face' }, c.e && !rev ? h('div', { class: 'e' }, c.e) : null, rev ? c.back : c.front, h('small', null, 'tik om om te draaien')),
        h('div', { class: 'ls-face bk' }, rev ? c.front : c.back, c.x ? h('small', null, '💡 ' + c.x) : null)));
      const bNo = h('button', { class: 'ls-btn', style: { flex: 1 } }, '🤔 Nog niet'), bYes = h('button', { class: 'ls-btn p', style: { flex: 1 } }, '😎 Ik wist het');
      const bSay = h('button', { class: 'ls-btn', onclick: () => S.speak((flip.classList.contains('f') ? (rev ? c.front : c.back) : (rev ? c.back : c.front)).replace(/\n/g, ', '), flip.classList.contains('f') === rev ? 'nl' : (q.lang || kitLang || 'nl'), true) }, '🔊');
      clear(body); body.appendChild(flip); body.appendChild(h('div', { class: 'ls-row' }, bNo, bSay, bYes));
      const verdict = await new Promise((res) => {
        let sx = null, dx = 0, moved = false;
        const toggle = () => flip.classList.toggle('f');
        const fin = (v) => { document.removeEventListener('keydown', onKey); res(v); };
        const onKey = (e) => { if (e.key === ' ') { e.preventDefault(); toggle(); } else if (e.key === 'ArrowRight') fin(true); else if (e.key === 'ArrowLeft') fin(false); };
        document.addEventListener('keydown', onKey); scr.onClose(() => fin(null));
        bNo.addEventListener('click', () => fin(false)); bYes.addEventListener('click', () => fin(true));
        flip.addEventListener('pointerdown', (e) => { sx = e.clientX; dx = 0; moved = false; });
        flip.addEventListener('pointermove', (e) => { if (sx == null) return; dx = e.clientX - sx; if (Math.abs(dx) > 8) moved = true; flip.style.transform = `translateX(${dx}px) rotate(${dx / 25}deg)`; });
        const end = () => { if (sx == null) return; sx = null; flip.style.transform = ''; if (dx > 90) fin(true); else if (dx < -90) fin(false); else if (!moved) toggle(); };
        flip.addEventListener('pointerup', end); flip.addEventListener('pointercancel', () => { sx = null; flip.style.transform = ''; });
        if (S.tts.on) S.speak(rev ? c.back : c.front, rev ? (q.lang || kitLang || 'nl') : (kitLang ? 'nl' : q.lang || 'nl'), true);
      });
      if (verdict === null || scr.closed) return;
      deck.mark(verdict); if (verdict) totalKnown++;
      try { C.Prog.record(kit.id, q, verdict, 0); } catch (e) { /* ok */ }
      S.snd(verdict ? 'goed' : 'klik');
    }
    if (scr.closed) return;
    const unk = deck.unknown.length;
    const rw = unk === 0 ? doReward(S, { correct: deck.known.length, wrong: 0, mode: 'oefen' }) : null;
    await new Promise((res) => {
      resultView(S, scr, { emoji: unk ? '🔄' : '🎉', title: unk ? `Nog ${unk} om te oefenen` : 'Alle kaarten gekend!', big: `${deck.known.length} gekend`, stats: [[deck.known.length, 'gekend'], [unk, 'nog niet'], [deck.round, 'ronde']], rewardRes: rw,
        buttons: [unk && { text: '🔁 Alleen de moeilijke', p: 1, fn: () => { deck.nextRound(); res(); } }, { text: '🔀 Opnieuw schudden', fn: () => { scr.close(); startFlits(S, kit); res(); } }, { text: 'Klaar', fn: () => { scr.close(); res(); } }].filter(Boolean) });
      scr.onClose(res);
    });
    if (!unk) return;
  }
}

export const MODES = [
  { id: 'leren', name: 'Leren', emoji: '🎓', desc: 'Slim herhalen: nieuwe kaarten en wat je bijna vergeet.', fn: startLeren },
  { id: 'oefenen', name: 'Oefenen', emoji: '🏋️', desc: 'Vrij oefenen met uitleg.', fn: startOefenen },
  { id: 'toets', name: 'Toets', emoji: '✍️', desc: 'Echte toets met cijfer.', fn: startToets },
  { id: 'levens', name: 'Levens', emoji: '❤️', desc: 'Hoe ver kom je met 3 levens?', fn: startLevens },
  { id: 'flits', name: 'Flitskaarten', emoji: '🃏', desc: 'Omdraaien en sorteren.', fn: startFlits },
  { id: 'talen', name: 'Woordjes', emoji: '🗣', desc: 'Talen leren in fasen.', fn: startTalen },
];
