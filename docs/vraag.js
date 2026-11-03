// Dagelijkse vraag: elke dag één vraag voor iedereen (open, kies, wat liever, schaal, ja/nee, plaatjes).
// Antwoorden van anderen zie je pas nadat je zelf hebt geantwoord. Extra's: Samen-overzicht, spelletjes (quiz, wat liever, dobbelvraag) en een vraagbank.
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { injectKit, head, wireHead, tabsHtml, ic, playScene, appStore, showToast } from './appkit.js?v=1';
import { mountR4 } from './tools-r4-vraag.js?v=1';
import { GFX } from './gfx/settings.js?v=1';
import { SECTIONS } from './vraag-bank.js?v=1';
import * as V from './vraag-core.js?v=1';
import * as GM from './vraag-games.js?v=1';

const { dayKey, addDays, parseKey } = V;
const clock = (t) => (t ? new Date(t).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
const longDate = (d) => d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
const denied = (e) => e && (e.code === 'permission-denied' || /permission/i.test(e.message || ''));
const MAXLEN = 400;
const TABS = [['vandaag', 'Vandaag', 'bell'], ['samen', 'Samen', 'heart'], ['spel', 'Spelletjes', 'dice'], ['bank', 'Vraagbank', 'book']];
const VCSS = `<style>
.vq-opt{display:flex;align-items:center;gap:.6rem;width:100%;min-height:calc(56px*var(--gfx-scale,1));margin:.35rem 0;border-radius:16px;font-size:1.05em;text-align:left;padding:.5rem 1rem}
.vq-opt.sel{background:var(--accent);color:#fff;border-color:var(--accent)}
.vq-opt.ok{background:#16a34a;color:#fff;border-color:#16a34a}.vq-opt.bad{background:#e11d48;color:#fff;border-color:#e11d48}
.vq-emo{font-size:1.9rem}
.vq-bar{position:relative;height:calc(38px*var(--gfx-scale,1));border-radius:12px;background:var(--line);overflow:hidden;margin:.3rem 0}
.vq-bar>i{position:absolute;inset:0 auto 0 0;background:var(--accent);opacity:.35;border-radius:12px}
.vq-bar>span{position:relative;display:flex;justify-content:space-between;padding:.45rem .8rem}
.vq-die{display:inline-block;transition:transform .6s}
.vq-die.spin{transform:rotate(720deg) scale(1.15)}
html[data-reduce="1"] .vq-die{transition:none}
</style>`;

export async function vraagView(ctx) {
  const { db, me, esc, nice, view, addCleanup } = ctx;
  injectKit();
  let alive = true; addCleanup(() => { alive = false; store.flush(); });
  const store = appStore(ctx, 'vraag-extra', { quiz: {}, liever: 0, favs: [], dice: 0 });
  const today = new Date(); const todayKey = dayKey(today);
  const adminOnly = !!(ctx.adminOnly && me.admin);
  let tab = adminOnly ? 'admin' : 'vandaag';
  let adminToday = [], adminQs = new Map(), mine = null, others = [], othersState = 'locked';
  let past = [], streak = 0, pastLoaded = false, pastErr = false;
  let plan = [], planErr = false, planDate = dayKey(addDays(today, 1)), planText = '', planMsg = '', planType = 'open', planOpts = '';
  let sel = '', guess = '', scale = 7, game = null, qz = null, lv = null, dice = null, bankSec = 'alles', bankSearch = '', onlyFav = false;

  const questionFor = (key) => V.questionFor(key, adminQs.get(key));
  const answersCol = (key) => collection(db, 'dailyq', key, 'answers');
  view.innerHTML = '<div class="box center"><small>Even de vraag van vandaag ophalen…</small></div>';

  async function loadQuestions() {
    try {
      const s = await getDocs(collection(db, 'dailyq'));
      adminQs = new Map(); s.docs.forEach((d) => { const x = d.data(); if (x && x.by === 'admin' && x.q) adminQs.set(d.id, { q: x.q, by: x.by, created: x.created, type: x.type, opts: x.opts }); });
    } catch (e) { console.error(e); }
  }
  async function loadToday() {
    try { const s = await getDoc(doc(db, 'dailyq', todayKey, 'answers', me.uid)); mine = s.exists() ? s.data() : null; } catch (e) { console.error(e); mine = null; }
    others = []; othersState = 'locked';
    if (!mine) return;
    try { const s = await getDocs(answersCol(todayKey)); others = s.docs.map((d) => d.data()).sort((a, b) => (a.created || 0) - (b.created || 0)); othersState = 'ok'; }
    catch (e) { if (!denied(e)) { console.error(e); othersState = 'error'; } else othersState = 'locked'; }
  }
  async function loadPast() {
    pastErr = false; past = [];
    const days = []; for (let i = 1; i <= 7; i++) days.push(addDays(today, -i));
    past = await Promise.all(days.map(async (d) => {
      const key = dayKey(d); const row = { key, d, q: questionFor(key), mine: null, all: [], locked: false };
      try {
        const s = await getDocs(answersCol(key)); row.all = s.docs.map((x) => x.data()).sort((a, b) => (a.created || 0) - (b.created || 0));
        row.mine = row.all.find((x) => x.uid === me.uid) || null;
        if (!row.mine) { row.all = []; row.locked = true; }
      } catch (e) { if (denied(e)) row.locked = true; else { console.error(e); pastErr = true; } }
      return row;
    }));
    const byKey = new Map(past.map((r) => [r.key, !!r.mine])); byKey.set(todayKey, !!mine);
    // verder terug dan 7 dagen alleen opvragen zolang de reeks doorloopt
    let n = 0, i = mine ? 0 : 1;
    for (; i <= 30; i++) {
      const key = dayKey(addDays(today, -i)); let ok = byKey.get(key);
      if (ok === undefined) { try { ok = (await getDoc(doc(db, 'dailyq', key, 'answers', me.uid))).exists(); } catch (e) { ok = false; } }
      if (ok) n++; else break;
    }
    streak = n; pastLoaded = true;
  }
  async function loadPlan() {
    planErr = false;
    try { const s = await getDocs(collection(db, 'dailyq')); plan = s.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => x.by === 'admin' && x.id >= todayKey).sort((a, b) => (a.id < b.id ? -1 : 1)); }
    catch (e) { console.error(e); planErr = true; }
  }

  /* ---------- weergave van antwoorden ---------- */
  const answerBlock = (a, own) => `<div style="background:var(--card);border-radius:14px;padding:.8rem 1rem;margin:.5rem 0;border:1px solid ${own ? 'var(--accent)' : 'var(--line)'}"><b>${esc(a.name || 'Iemand')}${own ? ' <small>(jij)</small>' : ''}</b>
    <div style="margin:.3rem 0;white-space:pre-wrap">${esc(V.mainOf(a))}</div><small>${clock(a.created)}</small></div>`;
  function resultBlock(q, list, mineA) {
    const t = V.tally(list, q.opts), mx = Math.max(1, ...t.map((r) => r.n)), tot = list.length || 1;
    let h = t.map((r) => `<div class="vq-bar"><i style="width:${Math.round(r.n / tot * 100)}%"></i><span><b class="${q.type === 'emoji' ? 'vq-emo' : ''}">${esc(r.opt)}</b><span>${r.names.map(esc).join(', ')}</span></span></div>`).join('');
    const oth = list.filter((a) => a.uid !== me.uid && V.mainOf(a));
    if (mineA && oth.length) {
      const same = oth.filter((a) => V.sameChoice(a, mineA));
      h += same.length ? `<div class="ak-chip on pop" style="margin-top:.4rem">${ic('heart', { size: 18 })} Jullie kozen allebei: ${esc(V.mainOf(mineA))}!</div>` : `<div class="ak-chip" style="margin-top:.4rem">Verschillend gekozen, leuk! 🌈</div>`;
      const gr = V.guessResult(mineA, list);
      if (gr) h += `<div style="margin-top:.4rem"><small>Jij dacht: <b>${esc(gr.guess)}</b> ${gr.right ? `✅ ${gr.right} van ${gr.total} klopt!` : '❌ dat klopte niet.'}</small></div>`;
    }
    return h;
  }

  /* ---------- tab: vandaag ---------- */
  function inputBlock(q) {
    if (!V.isChoice(q)) return `<textarea id="vq-text" maxlength="${MAXLEN}" rows="4" placeholder="Typ hier rustig je antwoord…" style="width:100%;margin:.5rem 0;resize:vertical;min-height:7rem">${esc(mine ? mine.text : '')}</textarea>
      <div class="row" style="justify-content:space-between;align-items:center"><small id="vq-count">0 / ${MAXLEN}</small><button class="pri ak-big" id="vq-save">${mine ? 'Aanpassen' : 'Antwoord delen'}</button></div>`;
    const cur = V.parseAnswer(mine ? mine.text : '');
    if (!sel && cur.main) sel = cur.main; if (!guess && cur.guess) guess = cur.guess;
    let h;
    if (q.type === 'schaal') {
      if (cur.main && !sel.startsWith('~')) scale = Number(cur.main) || scale;
      h = `<div style="text-align:center"><div style="font-size:3rem;font-weight:800;color:var(--accent)" id="vq-sv">${scale}</div><input type="range" id="vq-range" min="1" max="10" step="1" value="${scale}" style="width:100%;height:44px"><div class="row" style="justify-content:space-between;margin:0"><small>1</small><small>10</small></div></div>`;
    } else h = q.opts.map((o) => `<button class="vq-opt ${sel === o ? 'sel' : ''}" data-opt="${esc(o)}"><span class="${q.type === 'emoji' ? 'vq-emo' : ''}">${esc(o)}</span></button>`).join('');
    if (q.type !== 'schaal') h += `<div style="margin-top:.7rem"><small class="mute">Wat denk je dat de ander kiest? (mag je overslaan)</small></div><div class="ak-chips">${q.opts.map((o) => `<button class="ak-chip ${guess === o ? 'on' : ''}" data-guess="${esc(o)}" style="border:0;min-height:42px">${esc(o)}</button>`).join('')}</div>`;
    return h + `<div class="row"><button class="pri ak-big" id="vq-save" style="flex:1">${mine ? 'Aanpassen' : 'Antwoord delen'}</button></div>`;
  }
  function drawToday() {
    const q = questionFor(todayKey), bd = V.streakBadge(streak);
    const streakTxt = !pastLoaded ? '' : streak > 1 ? `<span class="ak-chip on">${ic('flame', { size: 18 })} ${streak} dagen op rij</span>` : streak === 1 ? '<span class="ak-chip">🌱 Je bent begonnen</span>' : '';
    let h = `<div class="ak-card" style="text-align:center;padding:1.4rem 1rem"><small>${esc(longDate(today))}</small><div style="margin:.3rem 0"><span class="ak-chip">${ic(q.from === 'admin' ? 'heart' : (V.TYPES[q.type] || V.TYPES.open).ic, { size: 18 })} ${esc(q.cat || V.TYPES[q.type].n)}</span></div>
      <div style="font-size:1.25em;line-height:1.45;margin:.5rem 0"><b>${esc(q.q)}</b></div>${q.from === 'admin' ? '<small>Een eigen vraag van Simon 💛</small>' : ''}<div style="margin-top:.5rem">${streakTxt}${bd ? ` <span class="ak-chip">${ic(bd[2], { size: 18 })} ${bd[1]}</span>` : ''}</div></div>`;
    h += `<div class="ak-card"><b>${mine ? 'Jouw antwoord' : 'Jouw antwoord op vandaag'}</b>${inputBlock(q)}<div id="vq-msg"></div></div>`;
    if (!mine) h += '<div class="ak-card" style="text-align:center"><small>Beantwoord eerst zelf de vraag om de antwoorden van de anderen te zien. ✨</small></div>';
    else if (othersState === 'error') h += '<div class="ak-card"><div class="err">De antwoorden konden niet geladen worden.</div><div class="row"><button id="vq-retry">Opnieuw proberen</button></div></div>';
    else if (othersState === 'locked') h += '<div class="ak-card" style="text-align:center"><small>Beantwoord eerst zelf de vraag om de antwoorden van de anderen te zien.</small></div>';
    else {
      const list = others.length ? others : [mine];
      h += `<div class="ak-card"><h3>Antwoorden van vandaag</h3>${V.isChoice(q) ? resultBlock(q, list, mine) : list.map((a) => answerBlock(a, a.uid === me.uid)).join('')}`;
      if (others.filter((a) => a.uid !== me.uid).length === 0) h += '<div style="text-align:center"><small>De anderen hebben nog niet geantwoord. Rustig aan, er is tijd genoeg.</small></div>';
      h += '</div>';
    }
    h += '<div style="margin-top:1.2rem"><b>Eerdere dagen</b></div>';
    if (!pastLoaded) h += '<div class="ak-card"><small>Eerdere dagen worden opgehaald…</small></div>';
    else {
      if (pastErr) h += '<div class="ak-card"><div class="err"><small>Een deel van de eerdere dagen kon niet geladen worden.</small></div></div>';
      h += past.map((r) => `<div class="ak-card"><small>${esc(longDate(r.d))}</small><div style="margin:.25rem 0 .5rem"><b>${esc(r.q.q)}</b></div>
        ${r.mine ? (V.isChoice(r.q) ? resultBlock(r.q, r.all, r.mine) : r.all.map((a) => answerBlock(a, a.uid === me.uid)).join('')) : '<small>Je hebt deze dag niet geantwoord, dus de antwoorden blijven verborgen.</small>'}</div>`).join('');
    }
    return h;
  }

  /* ---------- tab: samen ---------- */
  function drawSamen() {
    if (!pastLoaded) return '<div class="ak-card"><small>Even laden…</small></div>';
    const st = V.togetherStats(past), dots = [...past].reverse().map((r) => `<div style="text-align:center;flex:1"><div style="width:100%;aspect-ratio:1;max-width:44px;margin:auto;border-radius:50%;background:${r.mine ? 'var(--accent)' : 'var(--line)'};display:flex;align-items:center;justify-content:center;color:#fff">${r.mine ? '✓' : ''}</div><small class="mute">${esc(r.d.toLocaleDateString('nl-NL', { weekday: 'short' }))}</small></div>`).join('');
    const bd = V.streakBadge(streak);
    return `<div class="ak-card" style="text-align:center">${ic('flame', { size: 64 })}<div style="font-size:2rem;font-weight:800">${streak}</div><small>${streak === 1 ? 'dag' : 'dagen'} op rij beantwoord</small>${bd ? `<div style="margin-top:.4rem"><span class="ak-chip on">${ic(bd[2], { size: 18 })} ${bd[1]}</span></div>` : ''}</div>
      <div class="ak-card"><h3>Laatste 7 dagen</h3><div class="row" style="gap:.2rem">${dots}<div style="text-align:center;flex:1"><div style="width:100%;aspect-ratio:1;max-width:44px;margin:auto;border-radius:50%;background:${mine ? 'var(--accent)' : 'var(--line)'};color:#fff;display:flex;align-items:center;justify-content:center">${mine ? '✓' : ''}</div><small>vandaag</small></div></div></div>
      <div class="ak-card"><h3>Hoe goed passen jullie bij elkaar?</h3>${st.comparable ? `<div class="ak-bar" style="margin:.4rem 0"><div style="width:${st.pct}%"></div></div><b>${st.pct}% hetzelfde gekozen</b> <small class="mute">(${st.same} van ${st.comparable} keuzevragen)</small>` : ''}
        <div><small>${V.verdict(st.pct)}</small></div>${st.guesses ? `<div style="margin-top:.4rem"><small>Raden: ${st.guessRight} van ${st.guesses} keer goed geraden wat de ander koos.</small></div>` : ''}<div><small class="mute">${st.days} van de laatste 7 dagen beantwoord.</small></div></div>`;
  }

  /* ---------- tab: spelletjes ---------- */
  const qs = () => store.get().quiz || {};
  function drawSpel() {
    if (game === 'quiz') return drawQuiz();
    if (game === 'liever') return drawLiever();
    if (game === 'dobbel') return drawDobbel();
    if (game === 'r4') return '<div data-r4host></div>';
    const s = qs();
    const card = (id, icn, t, d) => `<button class="ak-card" data-game="${id}" style="width:100%;text-align:left;display:flex;gap:.8rem;align-items:center;margin:.5rem 0">${ic(icn, { size: 64 })}<span><b style="font-size:1.1em">${t}</b><br><small class="mute">${d}</small></span></button>`;
    return card('quiz', 'lightbulb', 'Kennisquiz', `${GM.QUIZ.length} vragen in ${GM.QUIZ_CATS.length} categorieën${s.best ? ` · record ${s.best}/10` : ''}`)
      + card('liever', 'dice', 'Wat liever?', `Kies en vergelijk ${V.TYPED.filter((t) => t.type === 'liever').length} lastige keuzes${store.get().liever ? ` · ${store.get().liever} gespeeld` : ''}`)
      + card('dobbel', 'puzzle', 'Dobbelvraag', 'Gooi de dobbelsteen en stel de vraag aan de anderen')
      + card('r4', 'trophy', 'Nieuwe spelletjes', 'Dagquiz, Bliksemquiz, Waar of niet waar, Wie of wat ben ik?');
  }
  function drawQuiz() {
    const s = qs(), back = '<button class="ak-big" data-gback>‹ Terug</button>';
    if (!qz) {
      return `<div class="ak-card"><div class="row" style="margin:0">${back}<b style="flex:1;text-align:center">Kennisquiz</b></div>${s.plays ? `<div style="text-align:center;margin:.5rem 0"><small>${s.plays} rondes · ${s.right}/${s.asked} goed · record ${s.best || 0}/10</small></div>` : ''}<small class="mute">Kies een categorie, tien vragen per ronde.</small>
        <div class="ak-grid" style="grid-template-columns:1fr 1fr;margin-top:.6rem"><button class="ak-big pri" data-qcat="alles" style="grid-column:span 2">${ic('star', { size: 28 })} Alles door elkaar</button>${GM.QUIZ_CATS.map((c) => { const b = (s.byCat || {})[c.id]; return `<button class="ak-big" data-qcat="${c.id}" style="display:flex;gap:.4rem;align-items:center;justify-content:flex-start">${ic(c.ic, { size: 30 })}<span>${c.n}${b ? `<br><small class="mute">${Math.round(b.r / b.a * 100)}% goed</small>` : ''}</span></button>`; }).join('')}</div></div>`;
    }
    if (qz.i >= qz.items.length) {
      return `<div class="ak-card" style="text-align:center">${ic(qz.score >= 8 ? 'trophy' : 'medal', { size: 90 })}<div style="font-size:2.2rem;font-weight:800">${qz.score} / ${qz.items.length}</div><div>${GM.roundVerdict(qz.score, qz.items.length)}</div><div class="row" style="justify-content:center"><button class="pri ak-big" data-qcat="${qz.cat}">Nog een ronde</button><button class="ak-big" data-qmenu>Andere categorie</button></div></div>`;
    }
    const it = qz.items[qz.i], c = GM.QUIZ_CATS.find((x) => x.id === it.cat);
    return `<div class="ak-card"><div class="row" style="margin:0"><span class="ak-chip">${ic(c.ic, { size: 18 })} ${c.n}</span><span style="flex:1"></span><span class="ak-chip">${qz.i + 1} / ${qz.items.length}</span><span class="ak-chip on">${ic('star', { size: 16 })} ${qz.score}</span></div>
      <div class="ak-bar" style="margin:.6rem 0"><div style="width:${qz.i / qz.items.length * 100}%"></div></div><div style="font-size:1.2em;margin:.6rem 0"><b>${esc(it.q)}</b></div>
      ${it.opts.map((o, i) => `<button class="vq-opt ${qz.picked != null ? (i === it.correct ? 'ok' : i === qz.picked ? 'bad' : '') : ''}" data-qa="${i}" ${qz.picked != null ? 'disabled' : ''}>${esc(o)}</button>`).join('')}
      ${qz.picked != null ? `<div class="row"><span style="flex:1">${qz.picked === it.correct ? '🎉 Goed zo!' : 'Helaas, het was ' + esc(it.opts[it.correct]) + '.'}</span><button class="pri ak-big" data-qnext>${qz.i + 1 < qz.items.length ? 'Volgende' : 'Uitslag'}</button></div>` : ''}</div>`;
  }
  const pickLiever = () => { const pool = V.TYPED.filter((t) => t.type === 'liever'); return pool[Math.floor(Math.random() * pool.length)]; };
  function drawLiever() {
    if (!lv) lv = { q: pickLiever(), pick: null };
    const back = '<button class="ak-big" data-gback>‹ Terug</button>';
    return `<div class="ak-card"><div class="row" style="margin:0">${back}<b style="flex:1;text-align:center">Wat liever?</b></div><div style="text-align:center;margin:.8rem 0">${ic('dice', { size: 56 })}<div style="font-size:1.15em"><b>${esc(lv.q.q.replace(/^Wat liever: /, '').replace(/\?$/, ''))}?</b></div></div>
      ${lv.q.opts.map((o, i) => `<button class="vq-opt ${lv.pick === i ? 'sel' : ''}" data-lv="${i}">${esc(o)}</button>`).join('')}
      ${lv.pick != null ? `<div style="text-align:center;margin:.5rem 0"><small>Jij koos: <b>${esc(lv.q.opts[lv.pick])}</b>. Vraag eens aan de anderen wat zij kiezen!</small></div><div class="row"><button class="pri ak-big" data-lnext style="flex:1">Nog een</button></div>` : ''}</div>`;
  }
  function drawDobbel() {
    const back = '<button class="ak-big" data-gback>‹ Terug</button>';
    const favd = dice && store.get().favs.includes(dice.q);
    return `<div class="ak-card" style="text-align:center"><div class="row" style="margin:0">${back}<b style="flex:1">Dobbelvraag</b></div>
      <div class="vq-die" id="vq-die" style="margin:.8rem 0">${ic('dice', { size: 110 })}</div>${dice ? `<div style="font-size:2rem;font-weight:800">${dice.face}</div><span class="ak-chip">${ic(V.SECTION_ICON[dice.section] || 'star', { size: 18 })} ${esc(dice.section)}</span><div style="font-size:1.2em;margin:.7rem 0"><b>${esc(dice.q)}</b></div><button class="ak-big" data-dfav>${favd ? '⭐ Bewaard' : '☆ Bewaar'}</button>` : '<small class="mute">Gooi de dobbelsteen: elk getal is een andere soort vraag.</small>'}
      <div class="row" style="justify-content:center"><button class="pri ak-big" data-roll>🎲 ${dice ? 'Nog een keer' : 'Gooi!'}</button></div></div>`;
  }

  /* ---------- tab: vraagbank ---------- */
  function drawBank() {
    const favs = new Set(store.get().favs), term = bankSearch.trim().toLowerCase();
    const rows = []; for (const [name, list] of SECTIONS) for (const q of list) rows.push({ name, q });
    for (const t of V.TYPED) rows.push({ name: V.TYPES[t.type].n, q: t.q });
    const f = rows.filter((r) => (bankSec === 'alles' || r.name === bankSec) && (!onlyFav || favs.has(r.q)) && (!term || r.q.toLowerCase().includes(term)));
    const names = [...SECTIONS.map((s) => s[0]), ...new Set(V.TYPED.map((t) => V.TYPES[t.type].n))];
    return `<div class="ak-card"><div class="row" style="margin:0"><input id="vq-bs" placeholder="🔍 Zoek een vraag" value="${esc(bankSearch)}" style="min-height:48px"></div>
      <div class="ak-chips" style="margin-top:.5rem"><button class="ak-chip ${bankSec === 'alles' && !onlyFav ? 'on' : ''}" data-bsec="alles" style="border:0;min-height:38px">Alles (${rows.length})</button><button class="ak-chip ${onlyFav ? 'on' : ''}" data-bfav style="border:0;min-height:38px">⭐ Bewaard (${favs.size})</button>${names.map((n) => `<button class="ak-chip ${bankSec === n ? 'on' : ''}" data-bsec="${esc(n)}" style="border:0;min-height:38px">${esc(n)}</button>`).join('')}</div></div>
      <div class="ak-card">${f.slice(0, 80).map((r) => `<div class="row" style="margin:.4rem 0;align-items:flex-start"><span style="flex:1">${esc(r.q)}<br><small class="mute">${esc(r.name)}</small></span><button data-bf="${esc(r.q)}" aria-label="Bewaar" style="min-width:44px;min-height:44px">${favs.has(r.q) ? '⭐' : '☆'}</button></div>`).join('') || '<small class="mute">Geen vragen gevonden.</small>'}${f.length > 80 ? `<small class="mute">…en nog ${f.length - 80}. Zoek verder om te filteren.</small>` : ''}</div>`;
  }

  /* ---------- beheer ---------- */
  function drawAdmin() {
    const minD = todayKey, choice = planType !== 'open';
    let h = `<div class="ak-card"><h3>Vraag inplannen</h3><div style="margin:.5rem 0"><small>Datum</small><br><input type="date" id="vq-date" min="${minD}" value="${esc(planDate)}"></div>
      <select id="vq-type" style="width:100%;margin-bottom:.5rem">${Object.entries(V.TYPES).map(([k, v]) => `<option value="${k}"${planType === k ? ' selected' : ''}>${v.n}</option>`).join('')}</select>
      <textarea id="vq-q" maxlength="200" rows="3" placeholder="Jouw eigen vraag voor die dag…" style="width:100%">${esc(planText)}</textarea>
      ${choice && planType !== 'schaal' && planType !== 'janee' ? `<textarea id="vq-opts" rows="2" placeholder="Antwoorden, gescheiden door komma's (2 tot 6)" style="width:100%;margin-top:.4rem">${esc(planOpts)}</textarea>` : ''}
      <div class="row" style="margin-top:.5rem"><button class="pri ak-big" id="vq-plan">Inplannen</button></div>
      <div id="vq-pmsg">${planMsg}</div><small>Staat er voor een dag niets gepland, dan komt er een vraag uit de ingebouwde bank.</small></div>
      <div style="margin-top:1rem"><b>Geplande vragen</b></div>`;
    if (planErr) h += '<div class="ak-card"><div class="err">De geplande vragen konden niet geladen worden.</div><div class="row"><button id="vq-preload">Opnieuw proberen</button></div></div>';
    else if (!plan.length) h += '<div class="ak-card" style="text-align:center"><small>Nog niets gepland. Alle komende dagen komen uit de ingebouwde bank.</small></div>';
    else h += plan.map((p) => `<div class="ak-card"><small>${esc(longDate(parseKey(p.id)))} · ${(V.TYPES[p.type] || V.TYPES.open).n}</small><div style="margin:.25rem 0">${esc(p.q)}${p.opts && p.opts.length ? `<br><small class="mute">${p.opts.map(esc).join(' · ')}</small>` : ''}</div><div class="row"><button data-del="${esc(p.id)}">Verwijderen</button></div></div>`).join('');
    return h;
  }
  async function loadAdminToday() {
    try { const s = await getDocs(answersCol(todayKey)); adminToday = s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.created || 0) - (b.created || 0)); }
    catch (e) { console.error(e); adminToday = null; }
  }
  function drawAdminOnly() {
    const up = Array.from({ length: 7 }, (_, i) => dayKey(addDays(today, i))), q = questionFor(todayKey);
    let h = `<div class="ak-card" style="text-align:center"><small>${esc(longDate(today))}</small><div style="font-size:1.15rem;font-weight:700;margin:.4rem 0">${esc(q.q)}</div><small>${adminQs.has(todayKey) ? '✏️ Eigen vraag' : '📚 Uit de ingebouwde bank'} · ${V.TYPES[q.type].n}</small></div>`;
    h += '<div class="ak-card"><h3>Antwoorden van vandaag</h3>';
    if (adminToday === null) h += '<div class="err" style="margin-top:.4rem">De antwoorden konden niet geladen worden.</div>';
    else if (!adminToday.length) h += '<div style="margin-top:.4rem"><small>Nog niemand heeft geantwoord.</small></div>';
    else h += (V.isChoice(q) ? `<div>${V.tally(adminToday, q.opts).map((r) => `<div class="vq-bar"><i style="width:${Math.round(r.n / adminToday.length * 100)}%"></i><span><b>${esc(r.opt)}</b><span>${r.names.map(esc).join(', ')}</span></span></div>`).join('')}</div>` : '') + adminToday.map((a) => `<div class="row" style="align-items:flex-start;margin:.5rem 0"><div style="flex:1"><b>${esc(a.name || '?')}</b> <small>${a.created ? new Date(a.created).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : ''}</small><div>${esc(V.mainOf(a))}</div></div><button data-delans="${esc(a.id)}" title="Verwijder dit antwoord">🗑</button></div>`).join('');
    h += '</div>';
    h += '<div class="ak-card"><h3>Komende 7 dagen</h3>' + up.map((k) => `<div class="row" style="margin:.35rem 0;align-items:flex-start"><small style="width:6.2rem;flex:none">${esc(longDate(parseKey(k)))}</small><span style="flex:1">${esc(questionFor(k).q)}</span><small>${adminQs.has(k) ? '✏️' : '📚'}</small></div>`).join('') + '<small>✏️ = jouw eigen vraag, 📚 = uit de bank</small></div>';
    return h + drawAdmin();
  }

  /* ---------- tekenen en koppelen ---------- */
  function draw() {
    if (!alive) return;
    const shell = (inner, tabs = '') => `${VCSS}<div class="ak">${head({ icon: 'bell', title: adminOnly ? 'Vraag Admin' : 'Dagelijkse vraag', sub: adminOnly ? 'Plan vragen en bekijk antwoorden' : (streak > 1 ? `${streak} dagen op rij` : 'Elke dag één vraag voor ons allemaal'), c1: '#38bdf8', c2: '#818cf8' })}${tabs}${inner}</div>`;
    if (adminOnly) { view.innerHTML = shell(drawAdminOnly()); wireAdmin(); wireHeadOnly(); view.querySelectorAll('[data-delans]').forEach((b) => b.onclick = async () => {
      if (!confirm('Dit antwoord verwijderen?')) return; b.disabled = true;
      try { await deleteDoc(doc(db, 'dailyq', todayKey, 'answers', b.dataset.delans)); if (!alive) return; await loadAdminToday(); draw(); } catch (e) { if (alive) { alert(nice(e)); b.disabled = false; } }
    }); return; }
    const tabList = me.admin ? [...TABS, ['admin', 'Beheer', 'gear']] : TABS;
    const body = { vandaag: drawToday, samen: drawSamen, spel: drawSpel, bank: drawBank, admin: drawAdmin }[tab]();
    view.innerHTML = shell(body, tabsHtml(tab, tabList));
    wireHeadOnly();
    view.querySelectorAll('[data-tab]').forEach((b) => b.onclick = async () => { tab = b.dataset.tab; if (tab === 'admin' && !plan.length) { await loadPlan(); } draw(); });
    wireToday(); wireAdmin(); wireGames(); wireBank();
    const r4h = view.querySelector('[data-r4host]'); if (r4h) { r4h.innerHTML = '<div class="ak-card"><button class="ak-big" data-gback>‹ Terug</button></div>'; const sub = document.createElement('div'); r4h.appendChild(sub); mountR4(sub, 'menu', { store, ic, dayKey: todayKey, back: () => { game = null; draw(); } }); view.querySelectorAll('[data-gback]').forEach((b) => { b.onclick = () => { game = null; draw(); }; }); }
  }
  const wireHeadOnly = () => wireHead(view);

  function wireToday() {
    const q = questionFor(todayKey);
    const rt = view.querySelector('#vq-retry'); if (rt) rt.onclick = async () => { await loadToday(); draw(); };
    view.querySelectorAll('[data-opt]').forEach((b) => b.onclick = () => { sel = b.dataset.opt; draw(); });
    view.querySelectorAll('[data-guess]').forEach((b) => b.onclick = () => { guess = guess === b.dataset.guess ? '' : b.dataset.guess; draw(); });
    const rg = view.querySelector('#vq-range'); if (rg) rg.oninput = () => { scale = Number(rg.value); view.querySelector('#vq-sv').textContent = scale; };
    const save = view.querySelector('#vq-save'); if (!save) return;
    const ta = view.querySelector('#vq-text');
    if (ta) { const cnt = view.querySelector('#vq-count'); const upd = () => { cnt.textContent = `${ta.value.length} / ${MAXLEN}`; }; ta.oninput = upd; upd(); }
    save.onclick = async (ev) => {
      const msg = view.querySelector('#vq-msg'); let text;
      if (V.isChoice(q)) { const main = q.type === 'schaal' ? String(scale) : sel; if (!main) { msg.innerHTML = '<small class="err">Kies eerst een antwoord.</small>'; return; } text = V.encodeAnswer(main, q.type === 'schaal' ? '' : guess); }
      else { text = ta.value.trim().slice(0, MAXLEN); if (!text) { msg.innerHTML = '<small class="err">Schrijf eerst iets, hoe kort ook.</small>'; return; } }
      ev.target.disabled = true; msg.innerHTML = '<small>Opslaan…</small>';
      const first = !mine;
      try {
        await setDoc(doc(db, 'dailyq', todayKey, 'answers', me.uid), { uid: me.uid, name: me.name, text, created: mine && mine.created ? mine.created : Date.now() });
        if (!alive) return;
        await loadToday(); await loadPast(); draw();
        const m2 = view.querySelector('#vq-msg'); if (m2) m2.innerHTML = '<small>Opgeslagen, dankjewel! 💛</small>';
        if (first) playScene('daily-bonus', { title: 'Dankjewel!', sub: streak > 1 ? `${streak} dagen op rij` : 'Je hebt de vraag van vandaag beantwoord' });
      } catch (e) { if (!alive) return; msg.innerHTML = `<small class="err">${esc(nice(e))}</small>`; ev.target.disabled = false; }
    };
  }

  function wireGames() {
    const $$ = (s) => view.querySelectorAll(s);
    $$('[data-game]').forEach((b) => b.onclick = () => { game = b.dataset.game; qz = null; lv = null; dice = null; draw(); });
    $$('[data-gback]').forEach((b) => b.onclick = () => { game = null; qz = null; draw(); });
    $$('[data-qcat]').forEach((b) => b.onclick = () => { qz = { cat: b.dataset.qcat, items: GM.makeRound(b.dataset.qcat === 'alles' ? null : b.dataset.qcat, 10), i: 0, score: 0, picked: null }; draw(); });
    $$('[data-qmenu]').forEach((b) => b.onclick = () => { qz = null; draw(); });
    $$('[data-qa]').forEach((b) => b.onclick = () => { qz.picked = Number(b.dataset.qa); if (GM.isRight(qz.items[qz.i], qz.picked)) qz.score++; draw(); });
    $$('[data-qnext]').forEach((b) => b.onclick = () => {
      qz.i++; qz.picked = null;
      if (qz.i >= qz.items.length) { store.set({ quiz: GM.recordRound(qs(), qz.cat, qz.score, qz.items.length) }); draw(); if (qz.score >= 8) playScene('victory', { title: `${qz.score} van ${qz.items.length} goed!`, sub: 'Kennisquiz' }); }
      else draw();
    });
    $$('[data-lv]').forEach((b) => b.onclick = () => { if (lv.pick == null) store.set({ liever: (store.get().liever || 0) + 1 }); lv.pick = Number(b.dataset.lv); draw(); });
    $$('[data-lnext]').forEach((b) => b.onclick = () => { lv = { q: pickLiever(), pick: null }; draw(); });
    $$('[data-roll]').forEach((b) => b.onclick = () => {
      const die = view.querySelector('#vq-die'); if (die && !GFX.reduce) die.classList.add('spin');
      const go = () => { const face = GM.rollDie(); const p = GM.dicePick(SECTIONS, face); dice = { face, ...p }; store.set({ dice: (store.get().dice || 0) + 1 }); draw(); };
      if (GFX.reduce) go(); else setTimeout(go, 600);
    });
    $$('[data-dfav]').forEach((b) => b.onclick = () => toggleFav(dice.q));
  }
  function toggleFav(q) { const f = new Set(store.get().favs); if (f.has(q)) f.delete(q); else f.add(q); store.set({ favs: [...f].slice(-60) }); draw(); }
  function wireBank() {
    const bs = view.querySelector('#vq-bs'); if (bs) bs.oninput = () => { bankSearch = bs.value; const p = bs.selectionStart; draw(); const n = view.querySelector('#vq-bs'); n.focus(); try { n.setSelectionRange(p, p); } catch (e) { /* */ } };
    view.querySelectorAll('[data-bsec]').forEach((b) => b.onclick = () => { bankSec = b.dataset.bsec; onlyFav = false; draw(); });
    view.querySelectorAll('[data-bfav]').forEach((b) => b.onclick = () => { onlyFav = !onlyFav; draw(); });
    view.querySelectorAll('[data-bf]').forEach((b) => b.onclick = () => toggleFav(b.dataset.bf));
  }

  function wireAdmin() {
    const btn = view.querySelector('#vq-plan'); if (!btn) return;
    view.querySelector('#vq-date').onchange = (e) => { planDate = e.target.value; };
    view.querySelector('#vq-q').oninput = (e) => { planText = e.target.value; };
    view.querySelector('#vq-type').onchange = (e) => { planType = e.target.value; draw(); };
    const po = view.querySelector('#vq-opts'); if (po) po.oninput = (e) => { planOpts = e.target.value; };
    const pr = view.querySelector('#vq-preload'); if (pr) pr.onclick = async () => { await loadPlan(); draw(); };
    btn.onclick = async () => {
      const q = view.querySelector('#vq-q').value.trim(); const date = view.querySelector('#vq-date').value;
      const pm = view.querySelector('#vq-pmsg'); const opts = V.optsFor(planType, V.parseOpts(planOpts));
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < todayKey) { pm.innerHTML = '<small class="err">Kies een datum vanaf vandaag.</small>'; return; }
      if (!q) { pm.innerHTML = '<small class="err">Typ eerst een vraag.</small>'; return; }
      if (planType !== 'open' && opts.length < 2) { pm.innerHTML = '<small class="err">Geef minstens twee antwoorden.</small>'; return; }
      btn.disabled = true;
      try {
        const data = { q: q.slice(0, 200), by: 'admin', created: Date.now() }; if (planType !== 'open') { data.type = planType; data.opts = opts; }
        await setDoc(doc(db, 'dailyq', date), data);
        if (!alive) return;
        planText = ''; planOpts = ''; planMsg = `<small>Ingepland voor ${esc(longDate(parseKey(date)))} ✅</small>`;
        await loadQuestions(); await loadPlan(); draw();
      } catch (e) { if (!alive) return; pm.innerHTML = `<small class="err">${esc(nice(e))}</small>`; btn.disabled = false; }
    };
    view.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => {
      if (!confirm('Deze geplande vraag verwijderen?')) return; b.disabled = true;
      try { await deleteDoc(doc(db, 'dailyq', b.dataset.del)); if (!alive) return; planMsg = ''; await loadQuestions(); await loadPlan(); draw(); }
      catch (e) { if (alive) { alert(nice(e)); b.disabled = false; } }
    });
  }

  try {
    if (adminOnly) { await loadQuestions(); await loadPlan(); await loadAdminToday(); if (alive) draw(); return; }
    await Promise.all([loadQuestions(), store.load()]); await loadToday();
    if (!alive) return;
    draw();
    await loadPast(); if (!alive) return;
    draw();
  } catch (e) {
    console.error(e); if (!alive) return;
    view.innerHTML = `<div class="box"><div class="err">Er ging iets mis bij het laden: ${esc(nice(e))}</div><div class="row"><button id="vq-again">Opnieuw proberen</button></div></div>`;
    view.querySelector('#vq-again').onclick = () => vraagView(ctx);
  }
}
