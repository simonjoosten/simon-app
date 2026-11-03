// Moppentrommel: mop van de dag, veel moppen in groepen, favorieten, sterren, voorlezen, raad-de-grap, eigen moppen delen met je broer, score en rangen.
import * as M from './mop-core.js?v=1';
import { mountShell, celebrate, toast, icon, esc } from './fun-ui.js?v=1';
import { mountShow } from './tools-r4-mop.js?v=1';

// ctx: { view, esc, uid, addCleanup? }
export async function mopView(ctx) {
  const { view, uid, addCleanup } = ctx;
  let OLD, MORE;
  try { OLD = (await import('./jokes.js')).JOKES; MORE = (await import('./jokes-more.js?v=1')).MORE; } catch { view.innerHTML = '<div class="box err">De moppen laden lukt niet.</div>'; return; }
  const ALL = M.buildAll(OLD, MORE);
  const shell = mountShell(view, { game: 'mop', title: 'Moppentrommel', sub: `${ALL.length} moppen en jij kunt er zelf bij maken`, iconName: 'balloon', addCleanup });
  const root = shell.body;
  const K = `mop:${uid}`;
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(`${K}:${k}`) || 'null') ?? d; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(`${K}:${k}`, JSON.stringify(v)); } catch { /* vol */ } };
  let favs = read('favs', []), seen = read('seen', []), streak = read('streak', { last: null, n: 0 }), own = read('own', []), ratings = read('ratings', {}), done = read('read', []), qstats = read('quiz', { best: 0, played: 0, points: 0 });
  const today = M.dayNumber(); const todayId = M.dayPick(today, ALL.length);
  if (streak.last !== today) { streak = { last: today, n: streak.last === today - 1 ? streak.n + 1 : 1 }; write('streak', streak); }
  let id = todayId, tab = 'mop', shown = false, cat = '', history = [], search = '', quiz = null, qRound = 0, qScore = 0, qStreak = 0, qCat = '', speaking = false, dead = false;
  if (addCleanup) addCleanup(() => { dead = true; stopSpeak(); });

  const ownJokes = () => own.map((o) => ({ id: o.id, q: o.q, a: o.a, cat: 'eigen' }));
  const get = (x) => (typeof x === 'number' ? ALL[x] : ownJokes().find((j) => j.id === x));
  const pool = () => (cat === 'eigen' ? ownJokes() : (cat ? ALL.filter((j) => j.cat === cat) : ALL.concat(ownJokes())));
  const catIcon = (j) => (j.cat === 'eigen' ? 'star' : M.catById(j.cat).icon);
  const catName = (j) => (j.cat === 'eigen' ? 'Eigen mop' : M.catById(j.cat).name);
  const speechOk = () => typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';

  function stopSpeak() { try { if (speechOk()) speechSynthesis.cancel(); } catch { /* */ } speaking = false; }
  function say(text, onend) {
    const u = new SpeechSynthesisUtterance(text); u.lang = 'nl-NL'; u.rate = 0.95;
    try { const v = speechSynthesis.getVoices().find((x) => /^nl/i.test(x.lang)); if (v) u.voice = v; } catch { /* */ }
    u.onend = () => onend && onend(); u.onerror = () => { speaking = false; };
    speechSynthesis.speak(u);
  }
  function readAloud() {
    if (!speechOk()) return toast('Voorlezen kan niet in deze browser.');
    if (speaking) { stopSpeak(); draw(); return; }
    const j = get(id); if (!j) return; speaking = true; stopSpeak(); speaking = true;
    say(j.q, () => { if (dead || !speaking) return; setTimeout(() => { if (dead || !speaking) return; shown = true; remember(); draw(); say(j.a, () => { speaking = false; if (!dead) draw(); }); }, 900); });
    draw();
  }
  function remember() {
    if (!seen.includes(id)) { seen.push(id); if (seen.length >= ALL.length) seen = [id]; write('seen', seen); }
    if (!done.includes(id)) {
      const before = M.rankFor(done.length).level; done.push(id); write('read', done);
      const after = M.rankFor(done.length); if (after.level > before) celebrate('levelup', { title: `Nieuwe rang: ${after.name}!`, sub: `${done.length} moppen gelezen` });
    }
  }
  const go = (x) => { stopSpeak(); history.push(id); if (history.length > 50) history.shift(); id = x; shown = false; };
  const stars = (j) => { const r = ratings[j.id] || 0; return [1, 2, 3, 4, 5].map((n) => `<button data-star="${n}" aria-label="${n} sterren" style="min-width:calc(46px*var(--gfx-scale,1));min-height:calc(46px*var(--gfx-scale,1));padding:0;background:none;border:0;opacity:${n <= r ? 1 : 0.28}">${icon('star', { size: 34 })}</button>`).join(''); };
  const shareJoke = async (j) => {
    const text = M.shareText(j);
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(text); toast('Gekopieerd, plak hem in een bericht'); } catch { toast('Kopiëren lukt niet in deze browser.'); }
  };
  const copyText = async (t, okMsg) => { try { await navigator.clipboard.writeText(t); toast(okMsg); return true; } catch { return false; } };

  function jokeCard(j, big) {
    const isFav = favs.includes(j.id);
    return `<div class="box center" style="padding:1.2rem">
      <div>${icon(shown || !big ? catIcon(j) : 'lightbulb', { size: Math.round(84 * (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gfx-scale')) || 1)) })}</div>
      <small class="chip">${esc(catName(j))}</small>
      <div style="font-size:calc(1.3rem*var(--gfx-font,1));font-weight:700;margin:.6rem 0">${esc(j.q)}</div>
      ${big && !shown ? '<button class="pri" id="mp-show" style="font-size:calc(1.1rem*var(--gfx-font,1));min-height:calc(54px*var(--gfx-scale,1));padding:.6rem 1.6rem">Toon het antwoord</button>'
        : `<div style="font-size:calc(1.3rem*var(--gfx-font,1));color:var(--accent);font-weight:800;margin:.4rem 0 .8rem">${esc(j.a)}</div>`}
      ${big && shown ? `<div title="Geef sterren">${stars(j)}</div>` : ''}
      ${big ? `<div class="row wrap" style="justify-content:center;gap:.4rem"><button id="mp-prev" ${history.length ? '' : 'disabled'}>◀ Vorige</button><button id="mp-next" class="pri">🎲 Nog een mop</button>
        <button id="mp-fav" class="${isFav ? 'pri' : ''}">${isFav ? '⭐ Favoriet' : '☆ Bewaar'}</button><button id="mp-say" class="${speaking ? 'pri' : ''}">${speaking ? '⏹ Stop' : '🔊 Voorlezen'}</button><button id="mp-share">📤 Deel</button></div>` : ''}
    </div>`;
  }
  const catChips = (selected, attr, withOwn) => `<div style="display:flex;gap:6px;overflow-x:auto;padding:4px 0;margin:.2rem 0"><button data-${attr}="" class="${!selected ? 'pri' : ''}" style="flex:none">Alles</button>${M.CATS.map((c) => `<button data-${attr}="${c.id}" class="${selected === c.id ? 'pri' : ''}" style="flex:none;display:flex;gap:.3rem;align-items:center">${icon(c.icon, { size: 24 })}${esc(c.name)}</button>`).join('')}${withOwn ? `<button data-${attr}="eigen" class="${selected === 'eigen' ? 'pri' : ''}" style="flex:none">${icon('star', { size: 24 })} Eigen</button>` : ''}</div>`;

  function draw() {
    const tabs = [['mop', '😄 Mop'], ['raad', '🎯 Raad'], ['alle', '📚 Alle'], ['fav', `⭐ (${favs.length})`], ['eigen', '✍ Eigen'], ['score', '🏆 Score'], ['show', '🎭 Show']];
    let body = '';
    if (tab === 'mop') {
      const j = get(id) || ALL[todayId];
      body = `<div class="box center" style="padding:.6rem"><small>${id === todayId ? '📅 Mop van vandaag' : '🎲 Willekeurige mop'} · 🔥 ${streak.n} ${streak.n === 1 ? 'dag' : 'dagen'} op rij · ${M.rankFor(done.length).name}</small></div>
        ${catChips(cat, 'cat', own.length > 0)}${jokeCard(j, true)}${id !== todayId ? '<div class="row" style="justify-content:center"><button id="mp-today">Terug naar de mop van vandaag</button></div>' : ''}`;
    } else if (tab === 'raad') body = quizHtml();
    else if (tab === 'alle') {
      const list = M.filterJokes(ALL.concat(ownJokes()), { cat: cat === 'eigen' ? 'eigen' : cat, query: search, ratings });
      body = `<input id="mp-search" placeholder="Zoek een mop..." value="${esc(search)}" style="width:100%;box-sizing:border-box;min-height:calc(48px*var(--gfx-scale,1));font-size:calc(1rem*var(--gfx-font,1))">${catChips(cat, 'cat', own.length > 0)}<small>${list.length} moppen. Tik om het antwoord te zien.</small>
        ${list.slice(0, 60).map((j) => `<div class="box" data-open="${esc(String(j.id))}" style="cursor:pointer;display:flex;gap:.7rem;align-items:center">${icon(catIcon(j), { size: 40 })}<div style="flex:1"><b>${esc(j.q)}</b><div class="mp-ans" style="display:none;color:var(--accent);font-weight:700;margin-top:.3rem">${esc(j.a)}</div></div></div>`).join('')}${list.length > 60 ? '<small>Verfijn je zoekopdracht om meer te zien.</small>' : ''}`;
    } else if (tab === 'fav') {
      const fl = favs.map(get).filter(Boolean);
      body = fl.length ? fl.map((j) => `<div class="box"><b>${esc(j.q)}</b><div style="color:var(--accent);font-weight:700;margin-top:.3rem">${esc(j.a)}</div><div class="row wrap"><button data-un="${esc(String(j.id))}">Verwijder</button><button data-sh="${esc(String(j.id))}">📤 Deel</button></div></div>`).join('') : `<div class="box center"><div>${icon('star', { size: 64 })}</div><small>Nog geen favorieten. Tik op ☆ Bewaar bij een mop die je goed vindt.</small></div>`;
    } else if (tab === 'show') {
      body = '<div id="mp-showhost"></div>';
    } else if (tab === 'eigen') {
      body = `<div class="box"><b>Verzin je eigen mop</b>
        <input id="own-q" placeholder="De vraag of het begin" maxlength="160" style="width:100%;box-sizing:border-box;min-height:calc(48px*var(--gfx-scale,1));margin:.4rem 0;font-size:calc(1rem*var(--gfx-font,1))">
        <input id="own-a" placeholder="Het antwoord (de clou)" maxlength="160" style="width:100%;box-sizing:border-box;min-height:calc(48px*var(--gfx-scale,1));font-size:calc(1rem*var(--gfx-font,1))">
        <div class="row"><button class="pri" id="own-add">➕ Bewaar mijn mop</button></div><small id="own-msg"></small></div>
        <div class="box"><b>Mijn moppen (${own.length})</b>${own.length ? own.map((o) => `<div style="padding:.5rem 0;border-top:1px solid var(--line)"><b>${esc(o.q)}</b><div style="color:var(--accent);font-weight:700">${esc(o.a)}</div><div class="row wrap"><button data-osh="${esc(o.id)}">📤 Deel</button><button data-odel="${esc(o.id)}">🗑 Weg</button></div></div>`).join('') : '<br><small>Nog niks. Verzin er een!</small>'}
          ${own.length ? '<div class="row wrap"><button id="own-sharecode" class="pri">📤 Deel al mijn moppen met mijn broer</button></div>' : ''}</div>
        <div class="box"><b>Moppen van je broer toevoegen</b><br><small>Plak hier de mop-code die je broer je heeft gestuurd.</small>
          <textarea id="own-code" rows="3" placeholder="MOP1:..." style="width:100%;box-sizing:border-box;margin-top:.4rem;font-size:1rem"></textarea><div class="row"><button id="own-import">📥 Toevoegen</button></div><small id="own-imsg"></small></div>`;
    } else {
      const rk = M.rankFor(done.length); const top = ALL.concat(ownJokes()).filter((j) => (ratings[j.id] || 0) >= 4);
      body = `<div class="box center" style="padding:1.2rem"><div>${icon('trophy', { size: 90 })}</div><div style="font-size:1.5rem;font-weight:800">${esc(rk.name)}</div>
        <small>${done.length} van ${ALL.length} moppen gelezen${rk.next ? ` · nog ${rk.next.left} tot ${esc(rk.next.name)}` : ' · hoogste rang bereikt!'}</small>
        <div style="height:12px;border-radius:99px;background:var(--line);margin:.6rem 0;overflow:hidden"><div style="height:100%;width:${rk.next ? Math.round(100 * (done.length - M.RANKS[rk.level][0]) / (rk.next.at - M.RANKS[rk.level][0])) : 100}%;background:var(--accent)"></div></div></div>
        <div class="box"><div class="row wrap" style="justify-content:space-around;text-align:center"><div>${icon('flame', { size: 44 })}<br><b>${streak.n}</b><br><small>dagen op rij</small></div><div>${icon('target', { size: 44 })}<br><b>${qstats.best}</b><br><small>beste quiz (van 10)</small></div><div>${icon('coin', { size: 44 })}<br><b>${qstats.points}</b><br><small>quizpunten</small></div><div>${icon('star', { size: 44 })}<br><b>${favs.length}</b><br><small>favorieten</small></div></div></div>
        <div class="box"><b>Mijn topmoppen (4 of 5 sterren)</b>${top.length ? top.slice(0, 30).map((j) => `<div style="padding:.4rem 0;border-top:1px solid var(--line)"><b>${esc(j.q)}</b><div style="color:var(--accent)">${esc(j.a)}</div></div>`).join('') : '<br><small>Geef sterren aan moppen die je goed vindt, dan komen ze hier.</small>'}</div>`;
    }
    root.innerHTML = `<div class="row wrap" style="gap:.4rem">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'pri' : ''}" style="flex:1;min-height:calc(48px*var(--gfx-scale,1));font-size:calc(.95rem*var(--gfx-font,1))">${l}</button>`).join('')}</div>${body}<small style="display:block;text-align:center;opacity:.6;margin:.4rem 0 1rem">${ALL.length} ingebouwde moppen${own.length ? ` + ${own.length} eigen` : ''}</small>`;
    bind();
    const sh = root.querySelector('#mp-showhost'); if (sh) mountShow(sh, { ALL, ratings, M, icon, toast });
  }

  // ---- raad de grap ----
  function newQuiz() { quiz = M.makeQuiz(qCat === 'eigen' ? ALL : (qCat ? ALL.filter((j) => j.cat === qCat) : ALL), Math.random, null); quiz.picked = -1; }
  function quizHtml() {
    if (!quiz && qRound === 0) return `<div class="box center" style="padding:1.2rem"><div>${icon('target', { size: 90 })}</div><div style="font-size:1.3rem;font-weight:800">Raad de grap!</div><small>Je krijgt 10 moppen. Kies steeds het goede antwoord uit 4. Punten voor elke goede, bonus voor een reeks.</small>${catChips(qCat, 'qcat', false)}<div class="row" style="justify-content:center"><button class="pri" id="q-start" style="min-height:calc(54px*var(--gfx-scale,1))">▶ Start</button></div><small>Beste score: ${qstats.best}/10 · ${qstats.played} spellen gespeeld</small></div>`;
    if (!quiz) { const rec = qScore > qstats.best; return `<div class="box center" style="padding:1.2rem"><div>${icon(qScore >= 7 ? 'trophy' : 'medal', { size: 90 })}</div><div style="font-size:1.4rem;font-weight:800">${qScore} van 10 goed!</div><small>${qScore >= 9 ? 'Geweldig! Echte mopkenner!' : qScore >= 6 ? 'Goed gedaan!' : 'Probeer het nog eens, je wordt steeds beter.'}${rec ? ' Nieuw record!' : ''}</small><div class="row" style="justify-content:center"><button class="pri" id="q-again">Nog een keer</button></div></div>`; }
    const picked = quiz.picked >= 0;
    return `<div class="box"><small>Vraag ${qRound} van 10 · score ${qScore}${qStreak > 1 ? ` · reeks ${qStreak}` : ''}</small><div style="font-size:calc(1.25rem*var(--gfx-font,1));font-weight:700;margin:.6rem 0">${esc(quiz.q)}</div>
      ${quiz.options.map((o, i) => `<button data-qa="${i}" ${picked ? 'disabled' : ''} class="${picked && i === quiz.correct ? 'pri' : ''}" style="display:block;width:100%;text-align:left;margin:.4rem 0;min-height:calc(54px*var(--gfx-scale,1));font-size:calc(1rem*var(--gfx-font,1));${picked && i === quiz.picked && i !== quiz.correct ? 'border-color:#ef4444;background:#fee2e2;color:#7f1d1d' : ''}">${esc(o)}</button>`).join('')}
      ${picked ? `<div class="row" style="justify-content:center"><b>${quiz.picked === quiz.correct ? '✅ Goed!' : '❌ Helaas, het goede antwoord staat groen.'}</b></div><div class="row" style="justify-content:center"><button class="pri" id="q-next">${qRound >= 10 ? 'Uitslag' : 'Volgende'}</button></div>` : ''}</div>`;
  }

  function bind() {
    const q = (s) => root.querySelector(s), qa = (s) => root.querySelectorAll(s);
    qa('[data-tab]').forEach((b) => b.onclick = () => { stopSpeak(); tab = b.dataset.tab; draw(); });
    qa('[data-cat]').forEach((b) => b.onclick = () => { cat = b.dataset.cat; if (tab === 'mop') { const p = pool(); if (p.length) { go(p[Math.floor(Math.random() * p.length)].id); } } draw(); });
    qa('[data-qcat]').forEach((b) => b.onclick = () => { qCat = b.dataset.qcat; draw(); });
    qa('[data-star]').forEach((b) => b.onclick = () => { ratings[id] = +b.dataset.star; write('ratings', ratings); toast(`${b.dataset.star} ${+b.dataset.star === 1 ? 'ster' : 'sterren'} gegeven`); draw(); });
    const on = (s, fn) => { const e = q(s); if (e) e.onclick = fn; };
    on('#mp-show', () => { shown = true; remember(); draw(); });
    on('#mp-next', () => { if (!shown) remember(); const p = pool().map((j) => j.id); go(M.pickNext(p, seen, id, Math.random)); draw(); });
    on('#mp-prev', () => { stopSpeak(); id = history.pop(); shown = true; draw(); });
    on('#mp-today', () => { stopSpeak(); id = todayId; shown = false; draw(); });
    on('#mp-fav', () => { favs = M.toggle(favs, id); write('favs', favs); draw(); });
    on('#mp-say', readAloud);
    on('#mp-share', () => shareJoke(get(id)));
    const search_ = q('#mp-search'); if (search_) { search_.oninput = (e) => { search = e.target.value; const pos = e.target.selectionStart; draw(); const n = q('#mp-search'); n.focus(); try { n.setSelectionRange(pos, pos); } catch { /* */ } }; }
    qa('[data-open]').forEach((b) => b.onclick = () => { const a = b.querySelector('.mp-ans'); a.style.display = a.style.display === 'none' ? 'block' : 'none'; const raw = b.dataset.open; if (a.style.display === 'block') { const keep = id; id = /^\d+$/.test(raw) ? +raw : raw; remember(); id = keep; } });
    const parse = (s) => (/^\d+$/.test(s) ? +s : s);
    qa('[data-un]').forEach((b) => b.onclick = () => { favs = favs.filter((x) => x !== parse(b.dataset.un)); write('favs', favs); draw(); });
    qa('[data-sh]').forEach((b) => b.onclick = () => shareJoke(get(parse(b.dataset.sh))));
    // quiz
    on('#q-start', () => { qRound = 1; qScore = 0; qStreak = 0; newQuiz(); draw(); });
    on('#q-again', () => { qRound = 0; quiz = null; draw(); });
    qa('[data-qa]').forEach((b) => b.onclick = () => {
      if (quiz.picked >= 0) return; quiz.picked = +b.dataset.qa;
      if (quiz.picked === quiz.correct) { qScore++; qStreak++; qstats.points += M.quizPoints(qStreak); } else qStreak = 0;
      if (!done.includes(quiz.id)) { done.push(quiz.id); write('read', done); }
      write('quiz', qstats); draw();
    });
    on('#q-next', () => {
      if (qRound >= 10) {
        const rec = qScore > qstats.best; qstats.played++; if (rec) qstats.best = qScore; write('quiz', qstats); quiz = null;
        if (qScore >= 7) celebrate(rec && qstats.played > 1 ? 'new-record' : 'victory', { title: `${qScore} van 10!`, sub: rec ? 'Nieuw record' : 'Goed geraden' });
      } else { qRound++; newQuiz(); }
      draw();
    });
    // eigen moppen
    const msg = (s, t, err) => { const e = q(s); if (e) e.innerHTML = err ? `<span class="err">${esc(t)}</span>` : esc(t); };
    on('#own-add', () => {
      const c = M.cleanJoke(q('#own-q').value, q('#own-a').value); if (c.err) return msg('#own-msg', c.err, true);
      if (own.length >= 60) return msg('#own-msg', 'Je hebt al 60 eigen moppen. Verwijder er eerst een paar.', true);
      own.unshift({ id: 'o' + Date.now().toString(36), q: c.q, a: c.a, at: Date.now() }); write('own', own);
      if (own.length === 1) celebrate('victory', { title: 'Je eerste eigen mop!', sub: 'Deel hem met je broer' }); else toast('Mop bewaard'); draw();
    });
    qa('[data-odel]').forEach((b) => b.onclick = () => { if (!confirm('Deze mop verwijderen?')) return; own = own.filter((o) => o.id !== b.dataset.odel); favs = favs.filter((f) => f !== b.dataset.odel); write('own', own); write('favs', favs); draw(); });
    qa('[data-osh]').forEach((b) => b.onclick = () => { const o = own.find((x) => x.id === b.dataset.osh); if (o) shareCode([o]); });
    on('#own-sharecode', () => shareCode(own));
    on('#own-import', () => {
      const list = M.decodeShare(q('#own-code').value); if (!list || !list.length) return msg('#own-imsg', 'Dit is geen geldige mop-code. Plak de hele tekst die begint met MOP1:', true);
      let added = 0; for (const j of list) { if (own.length >= 60) break; if (own.some((o) => o.q === j.q && o.a === j.a)) continue; own.unshift({ id: 'o' + Date.now().toString(36) + added, q: j.q, a: j.a, at: Date.now() }); added++; }
      write('own', own); toast(`${added} ${added === 1 ? 'mop' : 'moppen'} toegevoegd`); draw();
    });
  }
  async function shareCode(list) {
    const text = `Kijk, een paar moppen van mij! Plak dit in de Moppentrommel bij Eigen:\n${M.encodeShare(list)}`;
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    if (!(await copyText(text, 'Code gekopieerd. Stuur hem naar je broer!'))) toast('Kopiëren lukt niet. Selecteer de code zelf: ' + M.encodeShare(list).slice(0, 20) + '...');
  }
  draw();
}
