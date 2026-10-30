// Learn Study: leren zelf. Kits, Leren (Leitner), Oefenen, Toets, Levens, Talen, Flitskaarten, Voorlezen, Voortgang.
// Delen: study-logic.js (pure logica), study-ui.js (DOM + CSS), study-modes.js (leermodi), study-maker.js (kit-maker).
import * as C from './core.js?v=1';
import { h, mount, clear, injectCss, makeStore, ring, bar, twoTap, CSS } from './study-ui.js?v=1';
import * as L from './study-logic.js?v=1';
import { MODES, startLeren, startOefenen, startToets, startTalen, historyCard } from './study-modes.js?v=1';
import { openMaker, openImportCode } from './study-maker.js?v=1';

export { L as logic };
export { parsePaste, pairsToQuestions, textToQuestions, generate, GENERATORS, encodeKit, decodeKit, gradeFor, LearnQueue, LivesState, FlashDeck, cleanQ, cleanKit, fieldsToQ, qToFields, kitToText, wordsOf, langQuestion, stepsFor, planSession, timeWords, pickDistractors } from './study-logic.js?v=1';

let askMod = null;
try { askMod = await import('./q.js?v=1'); } catch (e) { askMod = null; }

// kleine noodversie van ask als q.js ontbreekt (alleen de basis)
function fallbackAsk(host, q, o = {}) {
  let cancelled = false; let resolveFn; const t0 = Date.now();
  const promise = new Promise((res) => { resolveFn = res; });
  const fin = (ok, given, extra) => { if (cancelled) return; cancelled = true; resolveFn({ ok, ms: Date.now() - t0, given, ...extra }); };
  const check = (given) => { try { const r = C.checkAnswer(q, given); fin(!!r.ok, given, { typo: r.typo, partial: r.partial }); } catch (e) { fin(false, given); } };
  const box = h('div', null, q.e && h('div', { style: { fontSize: '56px', textAlign: 'center' } }, q.e), h('div', { class: 'ls-big' }, q.q));
  if (q.t === 'mc') box.appendChild(h('div', null, q.o.map((x) => h('button', { class: 'ls-btn big', style: { marginBottom: '8px' }, onclick: () => check(x) }, x))));
  else if (q.t === 'tf') box.appendChild(h('div', { class: 'ls-row' }, h('button', { class: 'ls-btn big', onclick: () => check(true) }, 'Waar'), h('button', { class: 'ls-btn big', onclick: () => check(false) }, 'Onwaar')));
  else if (q.t === 'type' || q.t === 'num' || q.t === 'fill') {
    const inp = h('input', { class: 'ls-in', placeholder: 'Typ je antwoord', autocapitalize: 'off', autocomplete: 'off' });
    const go = () => { const v = inp.value.trim(); if (v) check(q.t === 'num' ? parseFloat(v.replace(',', '.')) : v); };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    box.appendChild(inp); box.appendChild(h('button', { class: 'ls-btn p big', style: { marginTop: '8px' }, onclick: go }, 'Klaar'));
  } else box.appendChild(h('button', { class: 'ls-btn big', onclick: () => fin(false, undefined) }, 'Overslaan'));
  mount(host, box);
  return { promise, cancel() { cancelled = true; resolveFn({ ok: false, ms: 0 }); } };
}

export function learnStudyView(ctx) {
  const { view, addCleanup } = ctx;
  try { C.bindCtx && C.bindCtx(ctx); } catch (e) { /* cloud is aanvulling */ }
  const uid = ctx.uid || (ctx.me && ctx.me.uid) || 'anon';
  const store = makeStore(uid);
  let dead = false; const cleanups = []; const screens = new Set(); let toastEl = null; let toastT = null;
  const removeCss = injectCss('study', CSS); cleanups.push(removeCss);
  const root = h('div', { class: 'ls-root' }); clear(view); view.appendChild(root);

  const S = {
    C, ctx, uid, store, rand: Math.random, root,
    ask: (askMod && (askMod.ask || askMod.renderQ)) || fallbackAsk,
    get tts() { return C.TTS; },
    get dead() { return dead; },
    track(fn) { cleanups.push(fn); },
    fx() { try { return (C.Profile && C.Profile.effects && C.Profile.effects()) || {}; } catch (e) { return {}; } },
    snd(n) { try { C.Snd && C.Snd.play(n); } catch (e) { /* stil */ } },
    setTts(b) { try { C.TTS.setOn(!!b); store.set('tts', !!b); } catch (e) { /* ok */ } },
    speak(text, lang, force) { try { if ((force || C.TTS.on) && text) { const p = C.TTS.speak(String(text), lang || 'nl', { rate: C.TTS.rate }); if (p && p.catch) p.catch(() => {}); } } catch (e) { /* ok */ } },
    speakAnswer(q, ok) { try { if (C.TTS.on && ok && q.lang && q.lang !== 'nl' && typeof q.a === 'string' && q.g !== 'luister') S.speak(q.a, q.lang); } catch (e) { /* ok */ } },
    toast(msg) {
      if (toastEl && toastEl.parentNode) toastEl.parentNode.removeChild(toastEl); clearTimeout(toastT);
      toastEl = h('div', { class: 'ls-toast ls-pop' }, msg); document.body.appendChild(toastEl);
      toastT = setTimeout(() => { if (toastEl && toastEl.parentNode) toastEl.parentNode.removeChild(toastEl); }, 2400);
    },
    reward(p) {
      const r = L.rewardFor(p); const fx = S.fx(); const xp = Math.round(r.xp * (fx.xpMult || 1)), coins = Math.round(r.coins * (fx.coinMult || 1));
      const P = C.Profile || {};
      try { P.addXp && P.addXp(xp); } catch (e) { /* ok */ } try { P.addCoins && P.addCoins(coins); } catch (e) { /* ok */ }
      try { P.bumpQuest && P.bumpQuest('answers', (p.correct || 0) + (p.wrong || 0)); P.bumpQuest && P.bumpQuest('correct', p.correct || 0); P.bumpQuest && P.bumpQuest('study', 1); } catch (e) { /* ok */ }
      try { P.checkAch && P.checkAch(); } catch (e) { /* ok */ }
      S.mcache.clear(); return { xp, coins };
    },
    mcache: new Map(),
    screen(title) {
      const fns = []; const aborts = new Set();
      const topT = h('div', { class: 't' }, title); const prog = h('i');
      const closeBtn = h('button', { class: 'ls-btn sm', 'aria-label': 'Sluiten', onclick: () => { if (scr.guard && !scr.guard()) return; scr.close(); } }, '✕');
      const body = h('div', { class: 'ls-sess-body' });
      const el = h('div', { class: 'ls-sess' }, h('div', { class: 'ls-sess-top' }, closeBtn, topT, h('button', { class: 'ls-btn sm', 'aria-label': 'Voorlezen', onclick: () => openSettings() }, C.TTS && C.TTS.on ? '🔊' : '🔇')), h('div', { class: 'ls-sess-prog' }, prog), body);
      const scr = {
        el, body, closed: false, cancelers: new Set(), guard: null,
        prog(p) { prog.style.width = Math.max(0, Math.min(100, p)) + '%'; },
        title(t) { topT.textContent = t; },
        onClose(fn) { if (scr.closed) fn(); else fns.push(fn); },
        aborted() { return new Promise((res) => { aborts.add(res); }); },
        abortAll() { aborts.forEach((r) => r({ ok: false, aborted: true, ms: 0 })); aborts.clear(); scr.cancelers.forEach((c) => { try { c(); } catch (e) { /* ok */ } }); scr.cancelers.clear(); },
        close() {
          if (scr.closed) return; scr.closed = true; scr.abortAll(); fns.splice(0).forEach((f) => { try { f(); } catch (e) { /* ok */ } });
          try { C.TTS.stop(); } catch (e) { /* ok */ }
          if (el.parentNode) el.parentNode.removeChild(el); screens.delete(scr); if (!dead) S.refresh();
        },
      };
      screens.add(scr); document.body.appendChild(el); return scr;
    },
    refresh() { if (!dead) { S.mcache.clear(); loadKits().then(() => { if (!dead) drawTab(); }); } },
    list: [], recent: store.get('recent', []), kitId: store.get('kit', null),
    async getKit(id) { try { return await C.getKit(id); } catch (e) { return null; } },
    async masteryOf(info) {
      if (S.mcache.has(info.id)) return S.mcache.get(info.id);
      let m = null; try { const kit = await S.getKit(info.id); if (kit) m = C.Prog.mastery(info.id, kit); } catch (e) { /* null */ }
      S.mcache.set(info.id, m); return m;
    },
  };
  S.cur = () => S.list.find((k) => k.id === S.kitId) || null;
  function setKit(id) { S.kitId = id; store.set('kit', id); S.recent = L.pushRecent(S.recent, id); store.set('recent', S.recent); }
  async function loadKits() {
    try { await C.Kits.load(); } catch (e) { /* lokaal */ }
    try { S.list = (await C.allKits()) || []; } catch (e) { S.list = (C.Kits.list ? C.Kits.list() : []).map((k) => ({ id: k.id, name: k.name, emoji: k.emoji, group: k.group, count: k.qs.length, lang: k.lang, src: 'user' })); }
    if (!S.cur()) { const def = S.recent.map((id) => S.list.find((k) => k.id === id)).find(Boolean) || S.list.find((k) => /tafel/i.test(k.name)) || S.list.find((k) => k.src === 'pack') || S.list[0]; S.kitId = def ? def.id : null; }
  }
  async function launch(modeId, info) {
    info = info || S.cur(); if (!info) { S.toast('Kies eerst een kit'); return; }
    const kit = await S.getKit(info.id); if (!kit || !kit.qs || !kit.qs.length) { S.toast('Deze kit is leeg of niet te laden'); return; }
    setKit(info.id); const m = MODES.find((x) => x.id === modeId); try { await m.fn(S, kit, {}); } catch (e) { S.toast('Er ging iets mis, probeer het opnieuw'); }
  }
  S.launch = launch;

  /* ---------- sheets ---------- */
  function sheet(build) {
    const inner = h('div'); const wrap = h('div', { class: 'ls-sheet', onclick: (e) => { if (e.target === wrap) close(); } }, inner); let closed = false;
    function close() { if (closed) return; closed = true; if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }
    build(inner, close); document.body.appendChild(wrap); cleanups.push(close); return close;
  }
  function pickKit(onPick, filterFn) {
    sheet((box, close) => {
      const q = h('input', { class: 'ls-in', placeholder: '🔍 Zoek een kit…' }); const list = h('div');
      const draw = () => {
        let items = S.list.filter(filterFn || (() => true)); items = L.filterKits(items, { q: q.value });
        const rec = S.recent.map((id) => items.find((k) => k.id === id)).filter(Boolean).slice(0, 5);
        const groups = [];
        if (!q.value && rec.length) groups.push({ group: '🕒 Recent', kits: rec });
        const mine = items.filter((k) => k.src !== 'pack'); if (mine.length) groups.push({ group: '✏️ Mijn kits', kits: mine });
        groups.push(...L.groupKits(items.filter((k) => k.src === 'pack')));
        mount(list, groups.map((g) => h('div', null, h('h3', { class: 'ls-muted', style: { margin: '10px 0 4px' } }, g.group), g.kits.map((k) => h('button', { class: 'ls-kit', onclick: () => { close(); onPick(k); } }, h('div', { class: 'em' }, k.emoji || '📘'), h('div', { class: 'ls-grow' }, h('div', { class: 'nm' }, k.name), h('div', { class: 'ls-muted' }, `${k.count || '?'} vragen${k.lang && k.lang !== 'nl' ? ' · ' + ((C.LANGS && C.LANGS[k.lang] && C.LANGS[k.lang].name) || k.lang) : ''}`)))))));
        if (!items.length) mount(list, h('div', { class: 'ls-muted' }, 'Niets gevonden.'));
      };
      q.addEventListener('input', draw); mount(box, h('div', { class: 'ls-row sp' }, h('h2', { style: { margin: 0 } }, 'Kies een kit'), h('button', { class: 'ls-btn sm', onclick: close }, '✕')), q, list); draw();
    });
  }
  function openSettings() {
    sheet((box, close) => {
      const on = !!(C.TTS && C.TTS.on); const body = h('div');
      const draw = () => {
        const cur = !!(C.TTS && C.TTS.on); const supported = (() => { try { return !!C.TTS.supported(); } catch (e) { return false; } })();
        const rate = h('input', { type: 'range', min: '0.6', max: '1.5', step: '0.1', value: String((C.TTS && C.TTS.rate) || 1), style: { width: '100%' }, oninput: (e) => { try { C.TTS.setRate(+e.target.value); store.set('rate', +e.target.value); } catch (er) { /* ok */ } } });
        const langs = Object.keys(C.LANGS || { nl: 1, en: 1, de: 1, fr: 1, es: 1 });
        mount(body, h('div', { class: 'ls-card' }, h('h3', null, '🔊 Voorlezen'), h('div', { class: 'ls-muted' }, supported ? 'Als dit aan staat, wordt elke vraag automatisch voorgelezen.' : 'Dit toestel kan helaas niet voorlezen.'),
          h('div', { class: 'ls-row', style: { margin: '8px 0' } }, h('button', { class: 'ls-chip' + (cur ? ' on' : ''), onclick: () => { S.setTts(true); draw(); } }, '🔊 Aan'), h('button', { class: 'ls-chip' + (!cur ? ' on' : ''), onclick: () => { S.setTts(false); try { C.TTS.stop(); } catch (e) { /* ok */ } draw(); } }, '🔇 Uit')),
          h('span', { class: 'ls-lab' }, 'Snelheid'), rate,
          h('span', { class: 'ls-lab' }, 'Stem per taal'), langs.map((lg) => { let voices = []; try { voices = C.TTS.voices(lg) || []; } catch (e) { /* leeg */ } const saved = store.get('voice-' + lg, ''); const sel = h('select', { class: 'ls-sel', onchange: (e) => { store.set('voice-' + lg, e.target.value); try { C.TTS.setVoice && C.TTS.setVoice(lg, e.target.value); } catch (er) { /* ok */ } } }, h('option', { value: '' }, 'Standaard'), voices.map((v) => h('option', { value: v.name || v, selected: (v.name || v) === saved }, v.name || v))); return h('div', { class: 'ls-row', style: { marginBottom: '6px' } }, h('div', { style: { width: '110px', fontWeight: '700' } }, (C.LANGS && C.LANGS[lg] && C.LANGS[lg].name) || lg), h('div', { class: 'ls-grow' }, sel), h('button', { class: 'ls-btn sm', onclick: () => S.speak({ nl: 'Hallo, dit is mijn stem.', en: 'Hello, this is my voice.', de: 'Hallo, das ist meine Stimme.', fr: 'Bonjour, voici ma voix.', es: 'Hola, esta es mi voz.' }[lg] || 'Hallo', lg, true) }, '▶')); }),
          h('button', { class: 'ls-btn p big', style: { marginTop: '8px' }, onclick: close }, 'Klaar')));
      };
      draw(); box.appendChild(body);
    });
  }

  /* ---------- tabs ---------- */
  const TABS = [['kits', '📚', 'Kits'], ['leren', '🎓', 'Leren'], ['toets', '✍️', 'Toets'], ['talen', '🗣', 'Talen'], ['voortgang', '📊', 'Voortgang']];
  let tab = store.get('tab', 'leren'); if (!TABS.some((t) => t[0] === tab)) tab = 'leren';
  const head = h('div', { class: 'ls-top' }, h('h2', null, '🧠 Learn Study'), h('button', { class: 'ls-btn sm', 'aria-label': 'Voorlezen-instellingen', onclick: openSettings }, '🔊 Voorlezen'));
  const content = h('div'); const tabs = h('nav', { class: 'ls-tabs' });
  mount(root, head, content, tabs);
  function go(t) { tab = t; store.set('tab', t); drawTab(); try { root.scrollIntoView && root.scrollIntoView({ block: 'start' }); } catch (e) { /* ok */ } }
  S.go = go;
  function drawTabs() { mount(tabs, TABS.map(([id, em, nm]) => h('button', { class: 'ls-tab' + (tab === id ? ' on' : ''), onclick: () => go(id) }, h('b', null, em), nm))); }
  function drawTab() {
    if (dead) return; drawTabs();
    try { ({ kits: tabKits, leren: tabLeren, toets: tabToets, talen: tabTalen, voortgang: tabVoortgang })[tab](); } catch (e) { mount(content, h('div', { class: 'ls-card' }, 'Er ging iets mis bij het laden. Probeer een ander tabblad.')); }
  }
  const kitBar = (label) => {
    const k = S.cur();
    return h('button', { class: 'ls-kit', onclick: () => pickKit((x) => { setKit(x.id); drawTab(); }) }, h('div', { class: 'em' }, k ? k.emoji || '📘' : '❔'), h('div', { class: 'ls-grow' }, h('div', { class: 'ls-muted' }, label || 'Gekozen kit'), h('div', { class: 'nm' }, k ? k.name : 'Kies een kit'), h('div', { class: 'ls-muted' }, k ? `${k.count || '?'} vragen` : '')), h('span', { class: 'ls-btn sm' }, 'Wijzig'));
  };
  const statRow = () => {
    let st = { streak: 0, today: { answers: 0, correct: 0, xp: 0 }, goal: 20 }; let lv = null;
    try { st = C.Prog.stats() || st; } catch (e) { /* ok */ } try { lv = C.Profile.levelInfo(); } catch (e) { /* ok */ }
    return h('div', { class: 'ls-stat' }, h('div', null, h('b', null, '🔥 ' + (st.streak || 0)), h('span', null, 'dagen reeks')), h('div', null, h('b', null, `${(st.today && st.today.answers) || 0}/${st.goal || 20}`), h('span', null, 'vandaag')), h('div', null, h('b', null, lv ? 'Lv ' + lv.level : '⭐'), h('span', null, 'niveau')));
  };

  /* --- Leren (start-kaart) --- */
  function tabLeren() {
    const k = S.cur(); const ringBox = h('div');
    if (k) S.masteryOf(k).then((m) => { if (!dead && m) mount(ringBox, ring(m.pct, 56)); });
    const hero = h('div', { class: 'ls-hero ls-pop' }, h('div', { class: 'ls-row' }, h('div', { class: 'em' }, k ? k.emoji || '📘' : '📚'), h('div', { class: 'ls-grow' }, h('div', { style: { opacity: '.85', fontSize: '13px' } }, 'Jouw kit'), h('h2', null, k ? k.name : 'Nog geen kit'), h('div', { style: { opacity: '.85', fontSize: '14px' } }, k ? `${k.count || '?'} vragen` : 'Maak er een of kies er een')), ringBox),
      h('div', { class: 'ls-row', style: { marginTop: '12px' } }, h('button', { class: 'ls-btn big', style: { flex: 2 }, disabled: !k, onclick: () => launch('leren') }, '▶ Start leren'), h('button', { class: 'ls-btn ghost big', style: { flex: 1, width: 'auto' }, onclick: () => pickKit((x) => { setKit(x.id); drawTab(); }) }, 'Andere kit')));
    const modes = h('div', { class: 'ls-modes' }, MODES.filter((m) => m.id !== 'leren' && m.id !== 'toets' && !(m.id === 'talen' && !(k && k.lang && k.lang !== 'nl'))).map((m) => h('button', { class: 'ls-mode', disabled: !k, onclick: () => launch(m.id) }, h('b', null, m.emoji), h('span', null, m.name), h('small', null, m.desc))), h('button', { class: 'ls-mode', disabled: !k, onclick: () => go('toets') }, h('b', null, '✍️'), h('span', null, 'Toets'), h('small', null, 'Echte toets met cijfer.')));
    mount(content, statRow(), hero, modes,
      h('div', { class: 'ls-card' }, h('h3', null, 'Zelf kits maken'), h('div', { class: 'ls-muted' }, 'Plak een woordenlijst, laat een tekst vragen worden, of gebruik de generator voor sommen.'),
        h('div', { class: 'ls-row', style: { marginTop: '8px' } }, h('button', { class: 'ls-btn p', style: { flex: 1 }, onclick: () => openMaker(S, {}) }, '➕ Nieuwe kit'), h('button', { class: 'ls-btn', style: { flex: 1 }, onclick: () => openImportCode(S) }, '📥 Kit-code'))));
  }

  /* --- Kits (bibliotheek) --- */
  let libQ = ''; let libLang = ''; let libOpen = new Set(['Mijn kits', 'Recent']);
  function tabKits() {
    const qi = h('input', { class: 'ls-in', placeholder: '🔍 Zoek in kits…', value: libQ, oninput: (e) => { libQ = e.target.value; drawList(); } });
    const langs = [...new Set(S.list.map((k) => k.lang || 'nl'))];
    const chips = h('div', { class: 'ls-chips' }, [{ v: '', l: 'Alle talen' }].concat(langs.map((l) => ({ v: l, l: (C.LANGS && C.LANGS[l] && C.LANGS[l].name) || l }))).map((c) => h('button', { class: 'ls-chip' + (libLang === c.v ? ' on' : ''), onclick: () => { libLang = c.v; tabKits(); } }, c.l)));
    const list = h('div');
    function kitRow(k) {
      const rb = h('div', { style: { width: '44px', height: '44px' } });
      if (S.mcache.has(k.id)) { const m = S.mcache.get(k.id); if (m && m.pct) mount(rb, ring(m.pct, 44)); }
      else if (S.recent.includes(k.id) || k.src !== 'pack') S.masteryOf(k).then((m) => { if (!dead && m && m.pct) mount(rb, ring(m.pct, 44)); });
      return h('button', { class: 'ls-kit', onclick: () => kitSheet(k) }, h('div', { class: 'em' }, k.emoji || '📘'), h('div', { class: 'ls-grow' }, h('div', { class: 'nm' }, k.name), h('div', { class: 'ls-muted' }, `${k.count || '?'} vragen${k.lang && k.lang !== 'nl' ? ' · ' + ((C.LANGS && C.LANGS[k.lang] && C.LANGS[k.lang].name) || k.lang) : ''}`)), rb);
    }
    function drawList() {
      const items = L.filterKits(S.list, { q: libQ, lang: libLang }); const searching = !!libQ.trim();
      const groups = []; const rec = S.recent.map((id) => items.find((k) => k.id === id)).filter(Boolean).slice(0, 6); if (rec.length && !searching) groups.push({ group: '🕒 Recent', key: 'Recent', kits: rec });
      groups.push({ group: '✏️ Mijn kits', key: 'Mijn kits', kits: items.filter((k) => k.src !== 'pack'), empty: true });
      for (const g of L.groupKits(items.filter((k) => k.src === 'pack'))) groups.push({ group: g.group, key: g.group, kits: g.kits });
      mount(list, groups.map((g) => {
        const open = searching || libOpen.has(g.key) || g.key === 'Recent';
        return h('div', null, h('button', { class: 'ls-btn', style: { width: '100%', textAlign: 'left', margin: '4px 0 8px', display: 'flex', justifyContent: 'space-between' }, onclick: () => { if (libOpen.has(g.key)) libOpen.delete(g.key); else libOpen.add(g.key); drawList(); } }, h('span', null, `${g.group} (${g.kits.length})`), h('span', null, open ? '▾' : '▸')),
          open ? (g.kits.length ? g.kits.map(kitRow) : g.empty ? h('div', { class: 'ls-card ls-muted' }, 'Je hebt nog geen eigen kits. Tik op “Nieuwe kit”.') : null) : null);
      }));
    }
    mount(content, h('div', { class: 'ls-row', style: { marginBottom: '8px' } }, h('button', { class: 'ls-btn p', style: { flex: 1 }, onclick: () => openMaker(S, {}) }, '➕ Nieuwe kit'), h('button', { class: 'ls-btn', style: { flex: 1 }, onclick: () => openImportCode(S) }, '📥 Kit-code plakken')), qi, chips, list);
    drawList();
  }
  function kitSheet(k) {
    sheet((box, close) => {
      const own = k.src !== 'pack'; const isLang = k.lang && k.lang !== 'nl'; const rb = h('div');
      S.masteryOf(k).then((m) => { if (m) mount(rb, ring(m.pct, 64), h('div', { class: 'ls-muted' }, `${m.known} gekend · ${m.learning} lerend · ${m.new} nieuw`)); });
      const start = (id) => { close(); launch(id, k); };
      const del = h('button', { class: 'ls-btn' }, '🗑 Verwijderen'); twoTap(del, 'Zeker weten?', () => { try { C.Kits.remove(k.id); } catch (e) { /* ok */ } close(); S.refresh(); });
      mount(box, h('div', { class: 'ls-row' }, h('div', { style: { fontSize: '48px' } }, k.emoji || '📘'), h('div', { class: 'ls-grow' }, h('h2', { style: { margin: 0 } }, k.name), h('div', { class: 'ls-muted' }, `${k.count || '?'} vragen · ${k.group || (own ? 'Mijn kits' : '')}`)), rb),
        h('button', { class: 'ls-btn p big', style: { margin: '10px 0' }, onclick: () => start('leren') }, '🎓 Start leren'),
        h('div', { class: 'ls-modes' }, MODES.filter((m) => m.id !== 'leren' && !(m.id === 'talen' && !isLang)).map((m) => h('button', { class: 'ls-mode', onclick: () => start(m.id) }, h('b', null, m.emoji), h('span', null, m.name)))),
        h('div', { class: 'ls-row' },
          h('button', { class: 'ls-btn', onclick: async () => { const full = await S.getKit(k.id); if (!full) return; close(); openMaker(S, { kit: full, copy: !own }); } }, own ? '✏️ Bewerken' : '📄 Kopie maken & bewerken'),
          h('button', { class: 'ls-btn', onclick: async () => { const full = await S.getKit(k.id); if (!full) return; close(); openMaker(S, { kit: full, copy: !own, tab: 'delen' }); } }, '📤 Delen'), own ? del : null));
    });
  }

  /* --- Toets --- */
  function tabToets() {
    const k = S.cur(); let hist = []; try { hist = k ? C.Prog.history(k.id) || [] : []; } catch (e) { /* ok */ }
    mount(content, kitBar('Toets maken over'), h('button', { class: 'ls-btn p big', disabled: !k, style: { marginBottom: '10px' }, onclick: () => launch('toets') }, '✍️ Toets maken'),
      h('div', { class: 'ls-card ls-muted' }, 'Je krijgt een cijfer van 1 tot 10. Tijdens de toets zie je niet of je het goed hebt. Daarna kun je je fouten oefenen.'), k ? historyCard(hist) : null);
  }

  /* --- Talen --- */
  function tabTalen() {
    const langKits = S.list.filter((k) => k.lang && k.lang !== 'nl'); const holder = h('div');
    const byLang = new Map(); for (const k of langKits) { if (!byLang.has(k.lang)) byLang.set(k.lang, []); byLang.get(k.lang).push(k); }
    const cur = S.cur(); const curIsLang = cur && cur.lang && cur.lang !== 'nl';
    mount(content, h('div', { class: 'ls-card' }, h('h3', null, '🗣 Woordjes leren'), h('div', { class: 'ls-muted' }, 'Elk woord gaat door vier fasen: zien en horen, kiezen, typen, en luisteren-en-typen.')), curIsLang ? h('button', { class: 'ls-btn p big', style: { marginBottom: '10px' }, onclick: () => launch('talen') }, `▶ Start ${cur.name}`) : null, holder);
    if (!byLang.size) { mount(holder, h('div', { class: 'ls-card ls-muted' }, 'Nog geen taalkits. Maak er een: Nieuwe kit → 📋 Plakken, en kies de taal.'), h('button', { class: 'ls-btn p', onclick: () => openMaker(S, {}) }, '➕ Maak woordjes-kit')); return; }
    const sections = [...byLang.entries()].map(([lang, kits]) => {
      const avg = h('span', { class: 'ls-muted' }); const rows = kits.map((k) => { const rb = h('div', { style: { width: '44px', height: '44px' } }); return { k, rb, el: h('button', { class: 'ls-kit', onclick: () => { setKit(k.id); launch('talen', k); } }, h('div', { class: 'em' }, k.emoji || '🗣'), h('div', { class: 'ls-grow' }, h('div', { class: 'nm' }, k.name), h('div', { class: 'ls-muted' }, `${k.count || '?'} woordjes`)), rb) }; });
      (async () => { let tot = 0, n = 0; for (const r of rows) { if (dead) return; const m = await S.masteryOf(r.k); if (m) { mount(r.rb, ring(m.pct, 44)); tot += m.pct; n++; avg.textContent = `taalkaart: ${Math.round(tot / n)}% gekend`; } } })();
      return h('div', { class: 'ls-card' }, h('div', { class: 'ls-row sp' }, h('h3', { style: { margin: 0 } }, (C.LANGS && C.LANGS[lang] && C.LANGS[lang].name) || lang), avg), h('div', { style: { height: '8px' } }), rows.map((r) => r.el));
    });
    mount(holder, sections);
  }

  /* --- Voortgang --- */
  function tabVoortgang() {
    let st = { streak: 0, today: { answers: 0, correct: 0, xp: 0 }, goal: 20, best: 0 }; let lv = null; let pr = null; let ach = [];
    try { st = C.Prog.stats() || st; } catch (e) { /* ok */ } try { lv = C.Profile.levelInfo(); pr = C.Profile.get(); } catch (e) { /* ok */ } try { ach = C.Profile.achievements() || []; } catch (e) { /* ok */ }
    const goal = st.goal || 20; const ans = (st.today && st.today.answers) || 0; const ok = (st.today && st.today.correct) || 0;
    const kitsBox = h('div'); const weakBox = h('div'); const histBox = h('div');
    mount(content,
      h('div', { class: 'ls-card' }, h('div', { class: 'ls-row' }, ring(Math.min(100, (ans / goal) * 100), 72, `${ans}/${goal}`), h('div', { class: 'ls-grow' }, h('h3', { style: { margin: 0 } }, ans >= goal ? '🎯 Dagdoel gehaald!' : 'Dagdoel'), h('div', { class: 'ls-muted' }, `${ans} antwoorden vandaag, ${ok} goed`), h('div', null, `🔥 ${st.streak || 0} dagen reeks`, st.best ? ` · beste ${st.best}` : '')))),
      lv ? h('div', { class: 'ls-card' }, h('div', { class: 'ls-row sp' }, h('b', null, `⭐ Level ${lv.level}`), h('span', { class: 'ls-muted' }, `${lv.cur} / ${lv.next} XP${pr ? ' · ' + (pr.coins || 0) + ' 🪙' : ''}`)), bar(lv.next ? (lv.cur / lv.next) * 100 : 0)) : null,
      h('div', { class: 'ls-card' }, h('h3', null, '📚 Beheersing per kit'), kitsBox), h('div', { class: 'ls-card' }, h('h3', null, '🎯 Zwakste vragen'), weakBox), h('div', { class: 'ls-card' }, h('h3', null, '✍️ Toets-geschiedenis'), histBox),
      h('div', { class: 'ls-card' }, h('h3', null, `🏅 Prestaties${ach.length ? ` (${ach.filter((a) => a.done).length}/${ach.length})` : ''}`), ach.length ? h('div', { class: 'ls-chips' }, ach.map((a) => h('span', { class: 'ls-chip' + (a.done ? ' on' : ''), style: { opacity: a.done ? 1 : 0.5 }, title: a.name }, `${a.emoji} ${a.name}`))) : h('div', { class: 'ls-muted' }, 'Speel en leer om prestaties te verdienen.')));
    // zware dingen async
    (async () => {
      const ids = [...new Set([...S.recent, ...S.list.filter((k) => k.src !== 'pack').map((k) => k.id)])].slice(0, 12); const infos = ids.map((id) => S.list.find((k) => k.id === id)).filter(Boolean);
      if (!infos.length) { mount(kitsBox, h('div', { class: 'ls-muted' }, 'Begin met leren, dan zie je hier hoe goed je elke kit kent.')); mount(weakBox, h('div', { class: 'ls-muted' }, 'Nog niets.')); mount(histBox, h('div', { class: 'ls-muted' }, 'Nog geen toetsen.')); return; }
      const rows = []; const weaks = []; const hists = [];
      for (const k of infos) {
        if (dead) return; const kit = await S.getKit(k.id); if (!kit) continue; let m = null; try { m = C.Prog.mastery(k.id, kit); } catch (e) { /* ok */ }
        if (m) rows.push(h('div', { style: { marginBottom: '10px' } }, h('div', { class: 'ls-row sp' }, h('span', null, `${k.emoji || '📘'} ${k.name}`), h('b', null, Math.round(m.pct) + '%')), h('div', { class: 'ls-bar' }, h('i', { style: { width: m.pct + '%' } })), h('div', { class: 'ls-muted' }, `${m.known} gekend · ${m.learning} lerend · ${m.new} nieuw`)));
        try { for (const q of C.Prog.weak(k.id, 3) || []) weaks.push({ k, kit, q }); } catch (e) { /* ok */ }
        try { for (const r of C.Prog.history(k.id) || []) hists.push({ k, r }); } catch (e) { /* ok */ }
      }
      if (dead) return;
      mount(kitsBox, rows.length ? rows : h('div', { class: 'ls-muted' }, 'Nog geen voortgang.'));
      mount(weakBox, weaks.length ? [weaks.slice(0, 6).map((w) => h('div', { class: 'ls-li' }, h('span', null, '⚠️'), h('div', { class: 'ls-grow' }, h('div', null, w.q.q), h('div', { class: 'ls-muted' }, w.k.name)))), h('button', { class: 'ls-btn p', style: { width: '100%', marginTop: '8px' }, onclick: () => { const byKit = new Map(); weaks.forEach((w) => { if (!byKit.has(w.k.id)) byKit.set(w.k.id, { kit: w.kit, qs: [] }); byKit.get(w.k.id).qs.push(w.q); }); const first = [...byKit.values()][0]; startOefenen(S, first.kit, { qs: first.qs }); } }, '🎯 Oefen mijn zwakste')] : h('div', { class: 'ls-muted' }, 'Geen zwakke vragen. Goed bezig!'));
      hists.sort((a, b) => (b.r.t || 0) - (a.r.t || 0));
      mount(histBox, hists.length ? hists.slice(0, 8).map((x) => h('div', { class: 'ls-li' }, h('b', { style: { width: '44px' } }, String(x.r.grade).replace('.', ',')), h('div', { class: 'ls-grow' }, h('div', null, x.k.name), h('div', { class: 'ls-muted' }, `${x.r.score}/${x.r.total} goed${x.r.t ? ' · ' + new Date(x.r.t).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : ''}`)))) : h('div', { class: 'ls-muted' }, 'Nog geen toetsen gemaakt.'));
    })();
  }

  /* ---------- opstarten ---------- */
  try { const sv = store.get('tts', null); if (sv !== null && C.TTS && C.TTS.setOn) C.TTS.setOn(!!sv); const rv = store.get('rate', null); if (rv && C.TTS && C.TTS.setRate) C.TTS.setRate(rv); } catch (e) { /* ok */ }
  mount(content, h('div', { class: 'ls-card ls-muted' }, 'Kits laden…')); drawTabs();
  try { C.Prog.load && C.Prog.load(); } catch (e) { /* ok */ } try { C.Profile.load && C.Profile.load(); } catch (e) { /* ok */ }
  loadKits().then(() => drawTab()).catch(() => drawTab());
  try { const off = C.Kits.onChange && C.Kits.onChange(() => { if (!dead && !screens.size) S.refresh(); }); if (off) cleanups.push(off); } catch (e) { /* ok */ }

  const destroy = () => {
    if (dead) return; dead = true;
    for (const s of [...screens]) { try { s.close(); } catch (e) { /* ok */ } }
    try { C.TTS.stop(); } catch (e) { /* ok */ }
    cleanups.splice(0).reverse().forEach((f) => { try { f(); } catch (e) { /* ok */ } });
    if (toastEl && toastEl.parentNode) toastEl.parentNode.removeChild(toastEl); clearTimeout(toastT);
    if (root.parentNode) root.parentNode.removeChild(root);
  };
  if (typeof addCleanup === 'function') addCleanup(destroy);
  return { destroy, S };
}

export default learnStudyView;
