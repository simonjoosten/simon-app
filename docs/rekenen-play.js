// Rekenen: de hele speelomgeving (hub, oefenen, tafels, race, monsterjacht, dagelijkse uitdaging, puzzels, voortgang).
import * as C from './rekenen-core.js?v=1';
import { icon, drawIcon, GFX, Themes, injectCss, topBar, bindGear, makeStore, makeCanvas, playScene, escHtml as esc, clamp } from './tools-ui.js?v=1';
import { Particles } from './gfx/fx.js?v=1';

const CSS = `
.rk-hero{min-height:calc(150px * var(--gfx-scale,1))}
.rk-hero .tu-in{display:flex;flex-direction:column;gap:.4rem;text-shadow:0 1px 4px rgba(0,0,0,.45)}
.rk-lv{display:flex;align-items:center;gap:.6rem;font-weight:800;font-size:1.25rem}
.rk-stats{display:flex;gap:.9rem;flex-wrap:wrap;font-weight:700}
.rk-stats span{display:inline-flex;align-items:center;gap:.25rem}
.rk-stars{display:flex;gap:2px;justify-content:center}
.rk-q{font-size:calc(2rem * var(--gfx-font,1));font-weight:800;text-align:center;margin:.6rem 0;word-break:break-word;line-height:1.25}
.rk-ans{font-size:calc(2.4rem * var(--gfx-font,1));font-weight:800;text-align:center;min-height:3.2rem;border-bottom:3px solid var(--accent);margin:.3rem auto .8rem;max-width:14rem;letter-spacing:.04em}
.rk-ch{display:grid;grid-template-columns:1fr 1fr;gap:.6rem}
.rk-ch button{min-height:calc(64px * var(--gfx-scale,1));font-size:calc(1.5rem * var(--gfx-font,1));font-weight:800;border-radius:18px}
.rk-fb{min-height:3.2rem;text-align:center;font-weight:700;margin:.4rem 0}
.rk-cell{aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:10px;font-weight:800;border:2px solid var(--line);background:var(--card);padding:0;min-width:0;font-size:calc(1.15rem * var(--gfx-font,1))}
.rk-cell.fix{background:var(--line)}.rk-cell.sel{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent)}
.rk-cell.bad{border-color:#dc2626}
.rk-heat{display:grid;gap:3px}
.rk-heat div{aspect-ratio:1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;color:#fff;min-width:0}
.rk-badge{display:flex;flex-direction:column;align-items:center;text-align:center;gap:.2rem;padding:.6rem .3rem;border-radius:16px;border:1px solid var(--line);font-size:.8rem}
.rk-badge.off{opacity:.35;filter:grayscale(1)}
.rk-lane{position:relative}
`;

const WORLD_KEY = 'rekenen';
const pad2 = (n) => String(n).padStart(2, '0');
const mmss = (s) => `${pad2(Math.floor(s / 60))}:${pad2(Math.floor(s % 60))}`;

export function playApp(ctx) {
  const { view, addCleanup, uid, db } = ctx;
  injectCss(); injectCss('rk-css', CSS);
  const store = makeStore({ key: `rekenen:v2:${uid || 'anon'}`, game: 'rekenen', uid, db, def: C.newState() });
  const S = () => store.get();
  const save = () => store.set(store.get());
  store.sync().then((changed) => { if (changed && screen === 'hub') go('hub'); }).catch(() => {});
  view.innerHTML = '<div class="tu" data-rk></div>';
  const root = view.querySelector('[data-rk]');
  let screen = 'hub', cleanups = [], alive = true;
  const clean = () => { cleanups.splice(0).forEach((f) => { try { f(); } catch { /* stil */ } }); };
  const track = (f) => { cleanups.push(f); return f; };
  addCleanup(() => { alive = false; clean(); store.flush(); });
  const world = () => { const w = S().world; return w ? Themes.world(w) : Themes.forGame(WORLD_KEY); };

  /* ---------- hulpjes ---------- */
  const starsHtml = (n, size = 22) => `<span class="rk-stars">${[0, 1, 2].map((i) => `<span style="opacity:${i < n ? 1 : 0.25};${i < n ? '' : 'filter:grayscale(1)'}">${icon('star', { size })}</span>`).join('')}</span>`;
  const back = (to = 'hub', label = '← Terug') => `<button class="tu-big" data-go="${to}" style="margin:.3rem 0">${label}</button>`;
  function bindNav(el = root) { el.querySelectorAll('[data-go]').forEach((b) => { b.onclick = () => go(b.dataset.go, b.dataset.arg); }); }

  function celebrate(res) {
    // één scène per mijlpaal, in volgorde van belangrijkheid
    if (!res) return;
    if (res.levelUp) playScene(document.body, 'levelup', { title: `Level ${res.levelUp}!`, sub: 'Je bent een betere rekenaar geworden' });
    else if (res.newBadges && res.newBadges.length) { const b = C.BADGES.find((x) => x.id === res.newBadges[0]); playScene(document.body, 'chest-open', { title: b ? b.name : 'Nieuwe badge!', sub: b ? b.desc : '', icon: b ? b.icon : 'trophy' }); }
  }

  /* ---------- navigatie ---------- */
  function go(to, arg) {
    clean(); screen = to; window.scrollTo && window.scrollTo(0, 0);
    ({ hub: hubScreen, topic: topicScreen, tafels: tafelsScreen, progress: progressScreen, puzzles: puzzlesScreen, race: raceSetup, boss: bossSetup, daily: dailyScreen, tools: toolsScreen, extra: extraScreen })[to](arg);
  }

  /* ---------- Extra spellen (ronde 4) ---------- */
  let extraFn = null;
  function extraScreen(arg) {
    root.innerHTML = '<div class="tu-card center"><small>Laden…</small></div>';
    import('./tools-r4-rekenen.js?v=1').then((m) => { if (!alive || screen !== 'extra') return; extraFn = m.extraScreen(root, { S, save, go, icon, C, celebrate, track }); extraFn(arg); })
      .catch((e) => { root.innerHTML = `<div class="tu-card"><span class="tu-bad">Kon dit niet laden: ${esc(e.message)}</span></div>${back()}`; bindNav(); });
  }

  /* ---------- HUB ---------- */
  function hubScreen() {
    const s = S(), lv = C.playerLevel(s.xp), lo = C.xpForLevel(lv), hi = C.xpForLevel(lv + 1), today = C.dayKey();
    const dailyDone = s.daily.scores[today] != null;
    root.innerHTML = `${topBar('Rekenen', 'pencil')}
      <div class="tu-hero rk-hero" data-hero><div class="tu-in">
        <div class="rk-lv">${icon('crown', { size: 40 })} Level ${lv}</div>
        <div class="tu-bar" style="background:rgba(255,255,255,.3)"><i style="width:${Math.round(100 * (s.xp - lo) / (hi - lo))}%"></i></div>
        <div class="rk-stats"><span>${icon('coin', { size: 26 })} ${s.coins}</span><span>${icon('flame', { size: 26 })} ${s.daily.streak} ${s.daily.streak === 1 ? 'dag' : 'dagen'}</span><span>${icon('medal', { size: 26 })} ${s.badges.length}</span><span>${icon('star', { size: 26 })} ${s.xp} xp</span></div>
      </div></div>
      <button class="tu-card" data-go="daily" style="display:flex;align-items:center;gap:.8rem;width:100%;text-align:left">${icon('gift', { size: 56 })}<span style="flex:1"><b style="font-size:1.15rem">Dagelijkse uitdaging</b><br><small>${dailyDone ? `Vandaag gehaald met ${s.daily.scores[today]} van 8. Tot morgen!` : '8 vragen, elke dag nieuw. Bonus-munten!'}</small></span><span class="tu-chip">${dailyDone ? 'Klaar' : 'Start'}</span></button>
      <h3 style="margin:1rem 0 .3rem">Oefenen</h3>
      <div class="tu-grid">${C.TOPICS.map((t) => { const ts = C.topicState(s, t.id), ul = C.unlockedLevel(s, t.id), tot = ts.stars.reduce((a, b) => a + b, 0); return `<button class="tu-tile" data-go="topic" data-arg="${t.id}" style="border-color:${t.color}55">${icon(t.icon, { size: 56 })}<span>${esc(t.name)}</span><small>Niveau ${ul} van 5</small><span class="rk-stars" style="font-size:.8rem;opacity:.9">${tot}/15 ${icon('star', { size: 16 })}</span></button>`; }).join('')}</div>
      <h3 style="margin:1rem 0 .3rem">Spelletjes</h3>
      <div class="tu-grid">
        <button class="tu-tile" data-go="race">${icon('car', { size: 56 })}<span>Rekenrace</span><small>Win van de bots</small></button>
        <button class="tu-tile" data-go="boss">${icon('dragon', { size: 56 })}<span>Monsterjacht</span><small>${(s.records.boss && s.records.boss.wins) || 0} verslagen</small></button>
        <button class="tu-tile" data-go="tafels">${icon('tent', { size: 56 })}<span>Tafelkamp</span><small>Kleur je tafels groen</small></button>
        <button class="tu-tile" data-go="extra">${icon('bolt', { size: 56 })}<span>Extra spellen</span><small>6 nieuwe: Romeins, binair…</small></button>
        <button class="tu-tile" data-go="puzzles">${icon('puzzle', { size: 56 })}<span>Puzzels</span><small>6 soorten</small></button>
      </div>
      <h3 style="margin:1rem 0 .3rem">Meer</h3>
      <div class="tu-grid">
        <button class="tu-tile" data-go="progress">${icon('trophy', { size: 56 })}<span>Voortgang en badges</span><small>${s.badges.length} van ${C.BADGES.length}</small></button>
        <button class="tu-tile" data-go="tools">${icon('gear', { size: 56 })}<span>Gereedschap</span><small>Rekenmachine, eenheden, valuta</small></button>
      </div>
      <div class="tu-card tu-row"><span>${icon('globe', { size: 30 })} Wereld:</span>
        <select data-world class="tu-inp" style="flex:1;min-width:8rem"><option value="">Automatisch</option>${Themes.list.map((w) => `<option value="${w.id}" ${s.world === w.id ? 'selected' : ''}>${w.emoji} ${esc(w.name)}</option>`).join('')}</select></div>`;
    bindNav(); bindGear(root, 'Instellingen');
    root.querySelector('[data-world]').onchange = (e) => { S().world = e.target.value; if (e.target.value) Themes.setForGame(WORLD_KEY, e.target.value); save(); go('hub'); };
    heroCanvas(root.querySelector('[data-hero]'));
  }
  function heroCanvas(host) {
    let painted = 0;
    const c = makeCanvas(host, (ctx2, w, h, t) => {
      if (GFX.reduce && painted > 1) return; painted++;
      Themes.paintBackground(ctx2, w, h, world(), GFX.reduce ? 0 : t);
    }, { fps: GFX.q ? 30 : 15 });
    track(c.stop);
  }

  /* ---------- Onderwerp: niveau kiezen ---------- */
  function topicScreen(id) {
    const t = C.TOPIC[id], s = S(), ts = C.topicState(s, id), ul = C.unlockedLevel(s, id);
    root.innerHTML = `${back()}<div class="tu-card" style="text-align:center;border-color:${t.color}">${icon(t.icon, { size: 84 })}<h2 style="margin:.2rem 0">${esc(t.name)}</h2><div>${esc(t.desc)}</div><small>${ts.total ? `Goed: ${ts.right} van ${ts.total}` : 'Nog niet geoefend'}</small></div>
      ${t.levels.map((nm, i) => { const L = i + 1, locked = L > ul; return `<button class="tu-card" ${locked ? 'disabled' : ''} data-lv="${L}" style="display:flex;align-items:center;gap:.8rem;width:100%;text-align:left;${locked ? 'opacity:.5' : ''}"><span style="font-size:1.8rem;font-weight:800;min-width:2.2rem">${locked ? icon('lock', { size: 36 }) : L}</span><span style="flex:1"><b>Niveau ${L}</b><br><small>${esc(nm)}</small></span>${starsHtml(ts.stars[i])}</button>`; }).join('')}
      <small style="display:block;text-align:center">Haal minstens 1 ster (6 van 10 goed) om het volgende niveau te openen.</small>`;
    bindNav();
    root.querySelectorAll('[data-lv]').forEach((b) => { b.onclick = () => startPractice(id, +b.dataset.lv); });
  }
  function startPractice(topic, level) {
    const qs = C.makeSet(topic, level, 10);
    runSession({
      title: `${C.TOPIC[topic].name} · niveau ${level}`, questions: qs, hints: true, topic, mode: 'oefen',
      onEnd: (hist) => { const res = C.applySession(S(), { topic, level, answers: hist, mode: 'oefen' }); save(); resultScreen({ res, hist, title: C.TOPIC[topic].name, again: () => startPractice(topic, level), next: res.unlocked || (level < 5 && C.unlockedLevel(S(), topic) > level) ? () => startPractice(topic, level + 1) : null, back: () => go('topic', topic) }); },
      onQuit: () => go('topic', topic),
    });
  }

  /* ---------- Sessie (vragen beantwoorden) ---------- */
  function runSession(o) {
    clean();
    const fx = new Particles(); let fxc = null;
    let i = 0, cur = '', hist = [], streak = 0, lives = o.lives || 0, t0 = Date.now(), qStart = Date.now(), q = null, locked = false, hinted = false, ended = false, advTimer = 0;
    const total = o.total || (o.questions ? o.questions.length : 0);
    const nextQ = () => (o.next ? o.next(i, hist) : o.questions[i] || null);
    root.innerHTML = `<div class="tu-top"><button data-quit class="tu-big" style="min-height:48px">✕</button><b style="flex:1;font-size:1.05rem">${esc(o.title)}</b><span data-timer class="tu-chip"></span><span class="tu-chip">${icon('flame', { size: 22 })}<b data-streak>0</b></span></div>
      ${o.topHtml || ''}
      <div class="tu-bar"><i data-prog style="width:0"></i></div>
      <div class="tu-card" data-card style="position:relative;overflow:hidden"><div data-vis></div><div class="rk-q" data-q></div><div class="rk-ans" data-ans></div><div class="rk-fb" data-fb></div><div data-input></div></div>`;
    if (o.mount) o.mount(root);
    const $ = (s) => root.querySelector(s);
    if (!GFX.reduce) { const c = makeCanvas($('[data-card]'), (ctx2, w, h, t, dt) => { fx.update(dt); fx.draw(ctx2); ctx2.save(); ctx2.restore(); }, { fps: 40 }); c.cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none'; fxc = c; track(c.stop); }
    const burst = (kind, n) => { if (fxc && fxc.w) fx.burst(fxc.w / 2, fxc.h * 0.3, { kind, n, power: 1.1 }); };
    const timerEl = $('[data-timer]');
    const tick = () => {
      if (ended) return;
      const el = (Date.now() - t0) / 1000;
      if (o.timeLimit) { const left = Math.max(0, o.timeLimit - el); timerEl.textContent = mmss(left); if (left <= 0) finish('tijd'); } else timerEl.textContent = mmss(el);
      if (o.onTick) o.onTick(el, hist);
    };
    const iv = setInterval(tick, 250); track(() => clearInterval(iv)); tick();
    const onKey = (e) => {
      if (ended || e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
      if (!q || q.kind === 'choice') return;
      if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === ',' || e.key === '.') press(','); else if (e.key === '-') press('-'); else if (e.key === '/' && q.kind === 'frac') press('/');
      else if (e.key === 'Backspace') press('⌫'); else if (e.key === 'Enter') press('OK'); else return; e.preventDefault();
    };
    document.addEventListener('keydown', onKey); track(() => document.removeEventListener('keydown', onKey));
    track(() => clearTimeout(advTimer));
    $('[data-quit]').onclick = () => { ended = true; o.onQuit ? o.onQuit() : go('hub'); };

    function show() {
      q = nextQ();
      if (!q) return finish('klaar');
      cur = ''; locked = false; hinted = false; qStart = Date.now();
      $('[data-q]').textContent = q.q; $('[data-fb]').innerHTML = o.hints && q.hint ? '<button data-hint class="tu-big" style="min-height:44px;font-size:.95rem">Hint</button>' : '';
      const hb = $('[data-hint]'); if (hb) hb.onclick = () => { hinted = true; $('[data-fb]').textContent = q.hint; };
      $('[data-vis]').innerHTML = visual(q);
      $('[data-prog]').style.width = `${total ? Math.round(100 * i / total) : 0}%`;
      $('[data-streak]').textContent = streak;
      if (q.kind === 'choice') {
        $('[data-ans]').style.visibility = 'hidden'; $('[data-input]').innerHTML = `<div class="rk-ch">${q.choices.map((c) => `<button data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>`;
        root.querySelectorAll('[data-c]').forEach((b) => { b.onclick = () => submit(b.dataset.c); });
      } else {
        const a = $('[data-ans]'); a.style.visibility = 'visible'; a.textContent = '?';
        const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', q.kind === 'frac' ? '/' : '−', '0', q.kind === 'frac' ? '⌫' : ','];
        $('[data-input]').innerHTML = `<div class="tu-pad">${keys.map((k) => `<button data-k="${k}">${k}</button>`).join('')}${q.kind === 'frac' ? '' : '<button data-k="⌫">⌫</button>'}<button data-k="OK" class="pri" style="${q.kind === 'frac' ? 'grid-column:span 3' : 'grid-column:span 2'}">OK</button></div>`;
        root.querySelectorAll('[data-k]').forEach((b) => { b.onclick = () => press(b.dataset.k); });
      }
    }
    function press(k) {
      if (locked) return;
      if (k === 'OK') { if (cur) submit(cur); return; }
      if (k === '⌫') cur = cur.slice(0, -1);
      else if (k === '−' || k === '-') { if (!cur) cur = '-'; }
      else if (k === ',') { if (!cur.includes(',') && !cur.includes('/')) cur += cur === '' || cur === '-' ? '0,' : ','; }
      else if (k === '/') { if (cur && !cur.includes('/') && /\d$/.test(cur)) cur += '/'; }
      else if (cur.length < 9) cur += k;
      $('[data-ans]').textContent = cur ? cur.replace('-', '−') : '?';
    }
    function submit(val) {
      if (locked || !q) return; locked = true;
      const ok = C.checkAnswer(q, val), ms = hinted ? 99999 : Date.now() - qStart;
      hist.push({ q, ok, ms, val });
      streak = ok ? streak + 1 : 0;
      const fb = $('[data-fb]'), card = $('[data-card]');
      if (ok) { fb.innerHTML = `<span class="tu-ok">Goed zo!</span>`; card.classList.remove('tu-pop'); void card.offsetWidth; card.classList.add('tu-pop'); burst(streak && streak % 5 === 0 ? 'coins' : 'stars', streak % 5 === 0 ? 8 : 10); }
      else { if (lives) lives--; fb.innerHTML = `<span class="tu-bad">Niet goed.</span> Het antwoord is <b>${esc(q.a)}</b>.<br><small>${esc(q.expl || '')}</small>`; card.classList.remove('tu-shake'); void card.offsetWidth; card.classList.add('tu-shake'); }
      $('[data-streak]').textContent = streak;
      if (o.onAnswer) o.onAnswer(hist[hist.length - 1], { streak, lives, hist });
      i++;
      $('[data-prog]').style.width = `${total ? Math.round(100 * i / total) : 0}%`;
      if (o.lives && lives <= 0) return advTimer = setTimeout(() => finish('levens'), 900);
      if (o.done && o.done(hist)) return advTimer = setTimeout(() => finish('doel'), 700);
      if (ok || o.fast) advTimer = setTimeout(show, ok ? 650 : 1200);
      else { fb.insertAdjacentHTML('beforeend', '<br><button class="pri tu-big" data-nx style="margin-top:.4rem">Volgende</button>'); fb.querySelector('[data-nx]').onclick = show; }
    }
    function finish(why) {
      if (ended) return; ended = true; clean();
      o.onEnd(hist, why, { elapsed: (Date.now() - t0) / 1000, lives });
    }
    track(() => { ended = true; });
    show();
    return { finish };
  }

  function visual(q) {
    if (q.pie) return `<div style="display:flex;justify-content:center;gap:1.5rem">${q.pie.map(([n, d]) => `<div style="text-align:center">${pieSvg(n, d, 96)}<div><b>${n}/${d}</b></div></div>`).join('')}</div>`;
    if (q.shape && q.shape[0] === 'rect') { const [, l, b] = q.shape, W = 150, H = Math.max(30, Math.min(110, W * b / l)); return `<svg viewBox="-30 -22 ${W + 60} ${H + 50}" width="190" style="display:block;margin:auto"><rect x="0" y="0" width="${W}" height="${H}" fill="#38bdf855" stroke="#0284c7" stroke-width="3" rx="3"/><text x="${W / 2}" y="${H + 20}" text-anchor="middle" font-size="16" font-weight="700" fill="currentColor">${l} cm</text><text x="-8" y="${H / 2 + 5}" text-anchor="end" font-size="16" font-weight="700" fill="currentColor">${b}</text></svg>`; }
    return '';
  }
  function pieSvg(n, d, size) {
    let s = `<svg viewBox="-52 -52 104 104" width="${size}" height="${size}"><circle r="48" fill="#fff" stroke="#be185d" stroke-width="3"/>`;
    for (let k = 0; k < d; k++) {
      const a0 = -Math.PI / 2 + 2 * Math.PI * k / d, a1 = -Math.PI / 2 + 2 * Math.PI * (k + 1) / d;
      const p = (a) => `${(48 * Math.cos(a)).toFixed(1)},${(48 * Math.sin(a)).toFixed(1)}`;
      s += `<path d="M0,0 L${p(a0)} A48,48 0 0 1 ${p(a1)} Z" fill="${k < n ? '#f472b6' : '#fff'}" stroke="#be185d" stroke-width="1.5"/>`;
    }
    return s + '</svg>';
  }

  /* ---------- Resultaat ---------- */
  function resultScreen({ res, hist, title, again, next, back: backFn, extra = '', scene = true }) {
    clean();
    root.innerHTML = `<div class="tu-card" style="text-align:center"><h2 style="margin:.2rem 0">${esc(title)}</h2>
      <div class="tu-pop">${starsHtml(res.stars, 56)}</div>
      <div style="font-size:1.6rem;font-weight:800;margin:.4rem 0">${res.right} van ${res.total} goed</div>
      <div class="rk-stats" style="justify-content:center"><span>${icon('coin', { size: 28 })} +${res.coins}</span><span>${icon('star', { size: 28 })} +${res.xp} xp</span><span>${icon('flame', { size: 28 })} reeks ${res.bestStreak}</span></div>
      ${res.unlocked ? `<p class="tu-chip" style="margin-top:.6rem">${icon('key', { size: 22 })} Niveau ${res.unlocked} is open!</p>` : ''}
      ${(res.newBadges || []).map((b) => { const bb = C.BADGES.find((x) => x.id === b); return `<p class="tu-chip">${icon(bb.icon, { size: 22 })} Badge: ${esc(bb.name)}</p>`; }).join(' ')}${extra}</div>
      ${hist.some((h) => !h.ok) ? `<div class="tu-card"><b>Dit ging nog fout</b>${hist.filter((h) => !h.ok).slice(0, 6).map((h) => `<div style="margin:.35rem 0">${esc(h.q.q)} <b>${esc(h.q.a)}</b><br><small>${esc(h.q.expl || '')}</small></div>`).join('')}</div>` : ''}
      <div class="tu-row" style="justify-content:center">${next ? '<button class="pri tu-big" data-next>Volgend niveau</button>' : ''}<button class="tu-big ${next ? '' : 'pri'}" data-again>Nog een keer</button><button class="tu-big" data-back>Terug</button></div>`;
    const q = (s) => root.querySelector(s);
    if (next) q('[data-next]').onclick = next; q('[data-again]').onclick = again; q('[data-back]').onclick = backFn || (() => go('hub'));
    if (scene) { if (res.levelUp || (res.newBadges && res.newBadges.length)) celebrate(res); else if (res.perfect) playScene(document.body, 'victory', { title: 'Foutloos!', sub: 'Alles goed!' }); }
  }

  /* ---------- Dagelijkse uitdaging ---------- */
  function dailyScreen() {
    const s = S(), date = C.dayKey();
    if (s.daily.scores[date] != null) {
      root.innerHTML = `${back()}<div class="tu-card" style="text-align:center">${icon('gift', { size: 96 })}<h2>Vandaag is gelukt!</h2><p>Score: <b>${s.daily.scores[date]} van 8</b><br>Reeks: ${s.daily.streak} ${s.daily.streak === 1 ? 'dag' : 'dagen'} (beste ${s.daily.best})</p><p>Kom morgen terug voor een nieuwe uitdaging.</p></div>`;
      bindNav(); return;
    }
    root.innerHTML = `${back()}<div class="tu-card" style="text-align:center">${icon('gift', { size: 96 })}<h2>Dagelijkse uitdaging</h2><p>8 vragen uit allerlei onderwerpen. Iedereen krijgt vandaag dezelfde vragen!</p><p>Reeks: ${s.daily.streak} ${s.daily.streak === 1 ? 'dag' : 'dagen'}</p><button class="pri tu-big" data-start>Start</button></div>`;
    bindNav();
    root.querySelector('[data-start]').onclick = () => {
      const qs = C.dailyQuestions(date, S());
      runSession({ title: 'Dagelijkse uitdaging', questions: qs, hints: true, mode: 'daily', onQuit: () => go('hub'),
        onEnd: (hist) => { const res = C.applySession(S(), { answers: hist, mode: 'daily' }); const d = C.applyDaily(S(), date, res.right); save(); res.coins += d.bonus || 0;
          resultScreen({ res, hist, title: 'Dagelijkse uitdaging', scene: false, extra: `<p class="tu-chip">${icon('flame', { size: 22 })} Reeks: ${d.streak} ${d.streak === 1 ? 'dag' : 'dagen'} · +${d.bonus || 0} bonus-munten</p>`, again: () => go('daily'), back: () => go('hub') });
          if (d.first) playScene(document.body, 'daily-bonus', { title: 'Dagelijkse bonus!', sub: `Reeks van ${d.streak} ${d.streak === 1 ? 'dag' : 'dagen'}` });
        } });
    };
  }

  /* ---------- Tafelkamp ---------- */
  function tafelsScreen() {
    const s = S(), N = 10;
    const col = (sc) => (sc == null ? '#94a3b8' : `hsl(${Math.round(sc * 120)},65%,${sc > 0.8 ? 38 : 45}%)`);
    root.innerHTML = `${back()}<div class="tu-card"><div class="tu-row">${icon('tent', { size: 48 })}<div><h2 style="margin:0">Tafelkamp</h2><small>Grijs = nog niet geoefend, rood = lastig, groen = top. Tik op een som om hem te oefenen.</small></div></div>
      <div class="rk-heat" style="grid-template-columns:repeat(${N + 1},1fr);margin-top:.7rem"><div style="background:none"></div>${Array.from({ length: N }, (_, c) => `<div style="background:none;color:var(--ink)">${c + 1}</div>`).join('')}
      ${Array.from({ length: N }, (_, r) => `<div style="background:none;color:var(--ink)">${r + 1}</div>${Array.from({ length: N }, (_, c) => { const k = `${Math.min(r + 1, c + 1)}x${Math.max(r + 1, c + 1)}`, sc = C.factScore(s, k); return `<div data-f="${r + 1},${c + 1}" style="background:${col(sc)};cursor:pointer">${(r + 1) * (c + 1)}</div>`; }).join('')}`).join('')}</div></div>
      <div class="tu-card"><b>Oefen een tafel</b><div class="tu-row" style="margin-top:.4rem">${Array.from({ length: 12 }, (_, i) => `<button class="tu-big" style="min-width:56px;padding:.3rem" data-t="${i + 1}">${i + 1}</button>`).join('')}</div>
      <div class="tu-row" style="margin-top:.6rem"><button class="tu-big pri" data-weak>Zwakke plekken</button><button class="tu-big" data-all>Alles door elkaar</button></div></div>`;
    bindNav();
    const go2 = (tables, title, facts) => {
      const qs = facts ? facts.map(([a, b]) => C.factQuestion(a, b)) : C.tableSet(tables, 12);
      runSession({ title, questions: qs, hints: true, topic: 'tafels', mode: 'tafel', onQuit: () => go('tafels'),
        onEnd: (hist) => { const res = C.applySession(S(), { topic: 'tafels', answers: hist, mode: 'tafel' }); save(); resultScreen({ res, hist, title, again: () => go2(tables, title, facts), back: () => go('tafels') }); } });
    };
    root.querySelectorAll('[data-t]').forEach((b) => { b.onclick = () => go2([+b.dataset.t], `Tafel van ${b.dataset.t}`); });
    root.querySelector('[data-all]').onclick = () => go2([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 'Alle tafels');
    root.querySelector('[data-weak]').onclick = () => { const w = C.weakFacts(S(), 10); if (w.length < 3) go2([2, 3, 4, 5, 6, 7, 8, 9, 10], 'Tafels door elkaar'); else go2(null, 'Zwakke plekken', w.concat(w).slice(0, 12)); };
    root.querySelectorAll('[data-f]').forEach((b) => { b.onclick = () => { const [a, c] = b.dataset.f.split(',').map(Number); go2(null, `${a} × ${c}`, [[a, c], [a, c], [c, a], [a, c], [c, a], [a, c]]); }; });
  }

  /* ---------- Voortgang en badges ---------- */
  function progressScreen() {
    const s = S(), lv = C.playerLevel(s.xp), t = s.total, acc = t.right + t.wrong ? Math.round(100 * t.right / (t.right + t.wrong)) : 0;
    root.innerHTML = `${back()}<div class="tu-card"><div class="tu-row">${icon('crown', { size: 64 })}<div><h2 style="margin:0">Level ${lv}</h2><small>${s.xp} xp · volgend level bij ${C.xpForLevel(lv + 1)} xp</small></div></div>
      <div class="rk-stats" style="margin-top:.6rem"><span>${icon('coin', { size: 26 })} ${s.coins} munten</span><span>${t.right} goed</span><span>${t.wrong} fout</span><span>${acc}% goed</span><span>beste reeks ${t.bestStreak}</span><span>${t.sessions} oefeningen</span></div></div>
      <div class="tu-card"><b>Per onderwerp</b>${C.TOPICS.map((tp) => { const ts = C.topicState(s, tp.id), sum = ts.stars.reduce((a, b) => a + b, 0); return `<div class="tu-row" style="margin:.5rem 0">${icon(tp.icon, { size: 36 })}<span style="flex:1;min-width:7rem"><b>${esc(tp.name)}</b><div class="tu-bar"><i style="width:${Math.round(100 * sum / 15)}%;background:${tp.color}"></i></div></span><small>${sum}/15</small></div>`; }).join('')}</div>
      <div class="tu-card"><b>Badges (${s.badges.length} van ${C.BADGES.length})</b><div class="tu-grid" style="grid-template-columns:repeat(auto-fill,minmax(110px,1fr));margin-top:.5rem">${C.BADGES.map((b) => `<div class="rk-badge ${s.badges.includes(b.id) ? '' : 'off'}">${icon(b.icon, { size: 52 })}<b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div>`).join('')}</div></div>`;
    bindNav();
  }

  /* ---------- Gereedschap ---------- */
  async function toolsScreen() {
    root.innerHTML = `${back()}<div data-tools><div class="tu-card">Laden…</div></div>`; bindNav();
    const m = await import('./rekenen-tools.js?v=1'); if (!alive || screen !== 'tools') return;
    const host = root.querySelector('[data-tools]'); host.innerHTML = '';
    m.toolsView({ ...ctx, view: host, addCleanup: (f) => track(f) });
  }

  /* ---------- Puzzels ---------- */
  function puzzlesScreen() {
    const s = S();
    root.innerHTML = `${back()}<h2 style="margin:.3rem 0">Puzzels</h2><div class="tu-grid">${C.PUZZLES.map((p) => `<button class="tu-tile" data-p="${p.id}">${icon(p.icon, { size: 56 })}<span>${esc(p.name)}</span><small>${esc(p.desc)}</small><small>${(s.puzzles[p.id] && s.puzzles[p.id].solved) || 0} opgelost</small></button>`).join('')}</div>`;
    bindNav();
    root.querySelectorAll('[data-p]').forEach((b) => { b.onclick = () => puzzleScreen(b.dataset.p, Math.min(PL[b.dataset.p] || 1, C.PUZZLES.find((x) => x.id === b.dataset.p).levels)); });
  }
  const PL = {}; // gekozen puzzelniveau onthouden zolang de app open is

  function puzzleScreen(type, level) {
    clean(); screen = 'puzzle'; PL[type] = level;
    const P = C.PUZZLES.find((x) => x.id === type);
    const head = `<div class="tu-top"><button class="tu-big" data-go="puzzles" style="min-height:48px">←</button><b style="flex:1">${icon(P.icon, { size: 32 })} ${esc(P.name)}</b></div>
      <div class="tu-row" style="margin-bottom:.4rem">${Array.from({ length: P.levels }, (_, i) => `<button class="tu-big ${i + 1 === level ? 'pri' : ''}" data-l="${i + 1}" style="min-height:44px">Niveau ${i + 1}</button>`).join('')}</div>
      <div class="tu-card" data-pz></div>`;
    root.innerHTML = head; bindNav();
    root.querySelectorAll('[data-l]').forEach((b) => { b.onclick = () => puzzleScreen(type, +b.dataset.l); });
    const box = root.querySelector('[data-pz]');
    const solved = () => {
      const res = C.puzzleSolved(S(), type, level); save();
      box.insertAdjacentHTML('afterbegin', `<div class="tu-pop" style="text-align:center">${icon('trophy', { size: 72 })}<h3 style="margin:.2rem">Opgelost!</h3><div class="rk-stats" style="justify-content:center"><span>${icon('coin', { size: 24 })} +${3 * level}</span><span>${icon('star', { size: 24 })} +${15 * level} xp</span></div></div>`);
      celebrate(res);
      const nb = box.querySelector('[data-new]'); if (nb) nb.classList.add('pri');
    };
    ({ magic: pzMagic, pyramid: pzPyramid, make24: pzTwentyFour, riddle: pzRiddle, balance: pzBalance, sudoku: pzSudoku })[type](box, level, solved, () => puzzleScreen(type, level));
  }

  // Gemeenschappelijk rooster met cijfertoetsenbord. cells: [{given, v}], cols, max (cijfers), onChange
  function cellBoard(box, { cells, cols, maxLen = 3, check, onSolved, again, extraTop = '', hint, shape }) {
    const vals = cells.map((c) => (c.given != null ? String(c.given) : ''));
    let sel = cells.findIndex((c) => c.given == null), done = false;
    box.innerHTML = `${extraTop}<div data-grid style="display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:6px;max-width:${cols * 76}px;margin:.5rem auto"></div><div data-msg class="rk-fb"></div>
      <div class="tu-pad" style="max-width:320px;margin:auto">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].map((k) => `<button data-k="${k}" ${k === 'OK' ? 'class="pri"' : ''}>${k}</button>`).join('')}</div>
      <div class="tu-row" style="justify-content:center;margin-top:.7rem">${hint ? '<button class="tu-big" data-hint>Hint</button>' : ''}<button class="tu-big" data-new>Nieuwe puzzel</button></div>`;
    const grid = box.querySelector('[data-grid]');
    const draw = () => {
      grid.innerHTML = cells.map((c, i) => `<button class="rk-cell ${c.given != null ? 'fix' : ''} ${i === sel ? 'sel' : ''}" data-c="${i}" style="${shape ? shape(i) : ''}">${esc(vals[i])}</button>`).join('');
      grid.querySelectorAll('[data-c]').forEach((b) => { b.onclick = () => { if (!done && cells[+b.dataset.c].given == null) { sel = +b.dataset.c; draw(); } }; });
    };
    draw();
    const msg = (t, cls = '') => { box.querySelector('[data-msg]').innerHTML = `<span class="${cls}">${t}</span>`; };
    box.querySelectorAll('[data-k]').forEach((b) => { b.onclick = () => {
      if (done || sel < 0) return; const k = b.dataset.k;
      if (k === 'OK') { if (check(vals)) { done = true; msg('Klopt helemaal!', 'tu-ok'); onSolved(); draw(); } else msg('Nog niet helemaal. Kijk nog eens goed.', 'tu-bad'); return; }
      if (k === '⌫') vals[sel] = vals[sel].slice(0, -1); else if (vals[sel].length < maxLen) vals[sel] = maxLen === 1 ? k : vals[sel] + k;
      draw();
    }; });
    const hb = box.querySelector('[data-hint]'); if (hb) hb.onclick = () => { const i = cells.findIndex((c, k) => c.given == null && String(vals[k]) !== String(c.v)); if (i >= 0) { vals[i] = String(cells[i].v); sel = i; draw(); msg('Eén vakje verklapt.'); } };
    box.querySelector('[data-new]').onclick = again;
  }

  function pzMagic(box, level, solved, again) {
    const p = C.makeMagic(level);
    cellBoard(box, { cells: p.sol.map((v, i) => ({ v, given: p.given[i] })), cols: 3, maxLen: 3, hint: true, check: (v) => C.checkMagic(p, v), onSolved: solved, again,
      extraTop: `<p style="text-align:center;margin:0">Vul de getallen in. Elke rij, kolom en diagonaal moet samen <b>${p.sum}</b> zijn. Elk getal komt maar één keer voor.</p>` });
  }
  function pzPyramid(box, level, solved, again) {
    const p = C.makePyramid(level), rows = p.rows.length;
    // piramide-opmaak: rijen gecentreerd
    const cells = p.cells; const vals = cells.map((c) => (c.given != null ? String(c.given) : '')); let sel = cells.findIndex((c) => c.given == null), done = false;
    box.innerHTML = `<p style="text-align:center;margin:0">Twee blokjes onder elkaar tellen samen op tot het blokje erboven.</p><div data-grid style="margin:.6rem auto;max-width:360px"></div><div data-msg class="rk-fb"></div>
      <div class="tu-pad" style="max-width:320px;margin:auto">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].map((k) => `<button data-k="${k}" ${k === 'OK' ? 'class="pri"' : ''}>${k}</button>`).join('')}</div>
      <div class="tu-row" style="justify-content:center;margin-top:.7rem"><button class="tu-big" data-hint>Hint</button><button class="tu-big" data-new>Nieuwe puzzel</button></div>`;
    const grid = box.querySelector('[data-grid]');
    const draw = () => { let html = ''; for (let r = 0; r < rows; r++) { html += '<div style="display:flex;justify-content:center;gap:5px;margin:5px 0">'; cells.forEach((c, i) => { if (c.r === r) html += `<button class="rk-cell ${c.given != null ? 'fix' : ''} ${i === sel ? 'sel' : ''}" data-c="${i}" style="width:calc(${Math.floor(100 / rows) - 3}%);max-width:68px;aspect-ratio:1.25">${esc(vals[i])}</button>`; }); html += '</div>'; } grid.innerHTML = html; grid.querySelectorAll('[data-c]').forEach((b) => { b.onclick = () => { if (!done && cells[+b.dataset.c].given == null) { sel = +b.dataset.c; draw(); } }; }); };
    draw();
    const msg = (t, c = '') => { box.querySelector('[data-msg]').innerHTML = `<span class="${c}">${t}</span>`; };
    box.querySelectorAll('[data-k]').forEach((b) => { b.onclick = () => { if (done || sel < 0) return; const k = b.dataset.k;
      if (k === 'OK') { if (C.checkPyramid(p, vals)) { done = true; msg('Klopt helemaal!', 'tu-ok'); solved(); draw(); } else msg('Nog niet helemaal.', 'tu-bad'); return; }
      if (k === '⌫') vals[sel] = vals[sel].slice(0, -1); else if (vals[sel].length < 3) vals[sel] += k; draw(); }; });
    box.querySelector('[data-hint]').onclick = () => { const i = cells.findIndex((c, k) => c.given == null && vals[k] !== String(c.v)); if (i >= 0) { vals[i] = String(cells[i].v); sel = i; draw(); } };
    box.querySelector('[data-new]').onclick = again;
  }
  function pzSudoku(box, level, solved, again) {
    const p = C.makeSudoku4(level);
    cellBoard(box, { cells: p.sol.map((v, i) => ({ v, given: p.given[i] })), cols: 4, maxLen: 1, hint: true, check: (v) => C.checkSudoku4(p, v), onSolved: solved, again,
      shape: (i) => `${i % 4 === 1 ? 'margin-right:8px;' : ''}${Math.floor(i / 4) === 1 ? 'margin-bottom:8px;' : ''}`,
      extraTop: '<p style="text-align:center;margin:0">Zet de cijfers 1 tot 4 in elke rij, kolom en elk blok van 2×2 precies één keer.</p>' });
  }
  function pzTwentyFour(box, level, solved, again) {
    const p = C.makeTwentyFour(level); let expr = '', done = false;
    box.innerHTML = `<p style="text-align:center;margin:0">Maak <b style="font-size:1.4rem">${p.target}</b> met alle vier de getallen (elk één keer). Je mag + − × ÷ en haakjes gebruiken.</p>
      <div class="tu-row" style="justify-content:center;margin:.6rem 0">${p.nums.map((n, i) => `<button class="tu-big" data-n="${i}" style="min-width:64px;font-size:1.6rem">${n}</button>`).join('')}</div>
      <div class="rk-ans" data-e style="max-width:none;font-size:1.8rem">&nbsp;</div><div data-msg class="rk-fb"></div>
      <div class="tu-row" style="justify-content:center">${['+', '−', '×', '÷', '(', ')'].map((o) => `<button class="tu-big" data-o="${o}" style="min-width:52px">${o}</button>`).join('')}</div>
      <div class="tu-row" style="justify-content:center;margin-top:.5rem"><button class="tu-big" data-bs>⌫</button><button class="tu-big pri" data-ok>Controleer</button></div>
      <div class="tu-row" style="justify-content:center;margin-top:.7rem"><button class="tu-big" data-hint>Hint</button><button class="tu-big" data-new>Nieuwe puzzel</button></div>`;
    const stack = []; // om ⌫ per token te doen
    const used = new Set();
    const show = () => { box.querySelector('[data-e]').textContent = expr || ' '; box.querySelectorAll('[data-n]').forEach((b) => { b.disabled = used.has(+b.dataset.n); b.style.opacity = used.has(+b.dataset.n) ? 0.3 : 1; }); };
    box.querySelectorAll('[data-n]').forEach((b) => { b.onclick = () => { if (done) return; const i = +b.dataset.n; if (used.has(i)) return; used.add(i); stack.push({ t: String(p.nums[i]), i }); expr += p.nums[i]; show(); }; });
    box.querySelectorAll('[data-o]').forEach((b) => { b.onclick = () => { if (done) return; stack.push({ t: b.dataset.o }); expr += b.dataset.o; show(); }; });
    box.querySelector('[data-bs]').onclick = () => { if (done) return; const l = stack.pop(); if (!l) return; if (l.i != null) used.delete(l.i); expr = expr.slice(0, expr.length - l.t.length); show(); };
    box.querySelector('[data-ok]').onclick = () => { if (done) return; const r = C.checkTwentyFour(p, expr); if (r.ok) { done = true; box.querySelector('[data-msg]').innerHTML = '<span class="tu-ok">Gelukt!</span>'; solved(); } else box.querySelector('[data-msg]').innerHTML = `<span class="tu-bad">${esc(r.why)}</span>`; };
    box.querySelector('[data-hint]').onclick = () => { const f = p.sol.split(/[+\-*/()]/)[0]; box.querySelector('[data-msg]').textContent = `Tip: begin eens met ${f}…`; };
    box.querySelector('[data-new]').onclick = again; show();
  }
  function simpleAnswer(box, { prompt, check, onSolved, again, hint }) {
    let cur = '', done = false;
    box.innerHTML = `${prompt}<div class="rk-ans" data-a>?</div><div data-msg class="rk-fb"></div>
      <div class="tu-pad" style="max-width:320px;margin:auto">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '−', '0', '⌫'].map((k) => `<button data-k="${k}">${k}</button>`).join('')}<button class="pri" data-k="OK" style="grid-column:span 3">OK</button></div>
      <div class="tu-row" style="justify-content:center;margin-top:.7rem">${hint ? '<button class="tu-big" data-hint>Hint</button>' : ''}<button class="tu-big" data-new>Nieuwe puzzel</button></div>`;
    box.querySelectorAll('[data-k]').forEach((b) => { b.onclick = () => { if (done) return; const k = b.dataset.k;
      if (k === 'OK') { if (!cur) return; if (check(cur)) { done = true; box.querySelector('[data-msg]').innerHTML = '<span class="tu-ok">Goed!</span>'; onSolved(); } else box.querySelector('[data-msg]').innerHTML = '<span class="tu-bad">Nee, probeer het nog eens.</span>'; return; }
      if (k === '⌫') cur = cur.slice(0, -1); else if (k === '−') { if (!cur) cur = '-'; } else if (cur.length < 6) cur += k;
      box.querySelector('[data-a]').textContent = cur ? cur.replace('-', '−') : '?'; }; });
    const hb = box.querySelector('[data-hint]'); if (hb) hb.onclick = () => { box.querySelector('[data-msg]').textContent = hint; };
    box.querySelector('[data-new]').onclick = again;
  }
  function pzRiddle(box, level, solved, again) {
    const p = C.makeRiddle(level);
    simpleAnswer(box, { prompt: `<p style="margin:0">Ik ben een getal tussen 1 en ${p.max}.</p>${p.clues.map((c, i) => `<div class="tu-row" style="margin:.35rem 0">${icon('scroll', { size: 28 })}<span>${esc(c)}</span></div>`).join('')}`, check: (v) => Number(v) === p.answer, onSolved: solved, again, hint: p.answer % 2 ? 'Het getal is oneven.' : 'Het getal is even.' });
  }
  function pzBalance(box, level, solved, again) {
    const e = C.makeEquation(level), [l, r] = e.q.split('=');
    simpleAnswer(box, { prompt: `<p style="margin:0;text-align:center">Welke waarde heeft x?</p><div style="display:flex;align-items:center;justify-content:center;gap:.6rem;margin:.6rem 0"><div style="font-size:1.8rem;font-weight:800;padding:.4rem .8rem;border:3px solid var(--accent);border-radius:14px">${esc(l.trim())}</div><b style="font-size:2rem">=</b><div style="font-size:1.8rem;font-weight:800;padding:.4rem .8rem;border:3px solid var(--accent);border-radius:14px">${esc(r.trim())}</div></div>`, check: (v) => Number(v) === e.x, onSolved: solved, again, hint: 'Wat moet je links en rechts doen om x alleen te krijgen?' });
  }

  /* ---------- Rekenrace ---------- */
  let raceCfg = { skill: 1, topic: 'alles' };
  function raceSetup() {
    root.innerHTML = `${back()}<div class="tu-card" style="text-align:center">${icon('car', { size: 84 })}<h2 style="margin:.2rem 0">Rekenrace</h2><p>Los 20 sommen op voordat de bots de finish halen. Elk goed antwoord brengt je dichter bij de streep.</p>
      <b>Snelheid van de bots</b><div class="tu-row" style="justify-content:center;margin:.4rem 0">${[[0.7, 'Rustig'], [1, 'Normaal'], [1.35, 'Snel']].map(([v, n]) => `<button class="tu-big ${raceCfg.skill === v ? 'pri' : ''}" data-sk="${v}">${n}</button>`).join('')}</div>
      <b>Onderwerp</b><div class="tu-row" style="justify-content:center;margin:.4rem 0"><button class="tu-big ${raceCfg.topic === 'alles' ? 'pri' : ''}" data-tp="alles">Alles</button>${C.TOPICS.slice(0, 6).map((t) => `<button class="tu-big ${raceCfg.topic === t.id ? 'pri' : ''}" data-tp="${t.id}">${icon(t.icon, { size: 24 })} ${esc(t.name)}</button>`).join('')}</div>
      <button class="pri tu-big" data-start style="margin-top:.6rem">Start de race</button>${S().records.race ? `<p><small>Beste tijd: ${S().records.race.best ? mmss(S().records.race.best) : '–'} · gewonnen: ${S().records.race.wins}</small></p>` : ''}</div>`;
    bindNav();
    root.querySelectorAll('[data-sk]').forEach((b) => { b.onclick = () => { raceCfg.skill = +b.dataset.sk; raceSetup(); }; });
    root.querySelectorAll('[data-tp]').forEach((b) => { b.onclick = () => { raceCfg.topic = b.dataset.tp; raceSetup(); }; });
    root.querySelector('[data-start]').onclick = startRace;
  }
  function startRace() {
    const GOAL = 20, skill = raceCfg.skill, ids = raceCfg.topic === 'alles' ? C.TOPICS.map((t) => t.id).filter((id) => id !== 'woord') : [raceCfg.topic];
    let right = 0, el = 0; const wd = world();
    runSession({
      title: 'Rekenrace', total: GOAL, hints: false, fast: true, mode: 'race', onQuit: () => go('race'), timeLimit: 150,
      topHtml: '<div data-lanes style="height:min(34vw,180px);border-radius:18px;overflow:hidden;position:relative;margin:.4rem 0"></div>',
      mount: (rt) => {
        const host = rt.querySelector('[data-lanes]');
        const c = makeCanvas(host, (ctx2, w, h, t) => {
          Themes.paintBackground(ctx2, w, h, wd, GFX.reduce ? 0 : t);
          const lanes = 4, lh = h / lanes, left = 40, right2 = w - 50;
          ctx2.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < lanes; i++) ctx2.fillRect(0, i * lh + lh * 0.82, w, 2);
          ctx2.fillStyle = '#fff'; for (let y = 0; y < h; y += 10) ctx2.fillRect(right2 + 12, y, 6, 5);
          const rows = [{ icon: 'car', p: right / GOAL, me: true }, ...C.BOTS.map((b) => ({ icon: b.icon, p: C.botProgress(b, el, GOAL, skill) }))];
          rows.forEach((rw, i) => { const x = left + (right2 - left) * rw.p, y = i * lh + lh * 0.5; drawIcon(ctx2, rw.icon, x, y, Math.min(lh * 0.95, 44), { shadow: true }); if (rw.me) { ctx2.fillStyle = '#fff'; ctx2.font = '700 11px system-ui'; ctx2.fillText('JIJ', 4, y + 4); } });
        }, { fps: 30 }); track(c.stop);
      },
      onTick: (t) => { el = t; },
      next: (i) => { const topic = pick(ids), ul = C.unlockedLevel(S(), topic), L = clamp(Math.min(ul, 1 + Math.floor(right / 4)), 1, 5); return C.makeQuestion(topic, L); },
      onAnswer: (a) => { if (a.ok) right++; },
      done: () => right >= GOAL || C.BOTS.some((b) => C.botProgress(b, el, GOAL, skill) >= 1),
      onEnd: (hist, why, info) => {
        const t = info.elapsed, rank = C.raceRanking(right / GOAL, t, GOAL, skill), place = rank.findIndex((x) => x.me) + 1;
        const res = C.applySession(S(), { answers: hist, mode: 'race' }), rec = (S().records.race ||= { best: 0, wins: 0 });
        let newRecord = false;
        if (place === 1 && right >= GOAL) { rec.wins++; if (!rec.best || t < rec.best) { newRecord = !!rec.best; rec.best = Math.round(t); } }
        const aw = C.award(S(), place === 1 ? 10 : 3, place === 1 ? 40 : 10); res.coins += (place === 1 ? 10 : 3); res.xp += place === 1 ? 40 : 10; res.newBadges = Array.from(new Set([...(res.newBadges || []), ...aw.newBadges])); res.levelUp = res.levelUp || aw.levelUp; save();
        resultScreen({ res: { ...res, stars: place === 1 ? 3 : place === 2 ? 2 : place === 3 ? 1 : 0 }, hist, title: place === 1 ? 'Je hebt gewonnen!' : `Je werd ${place}e`, scene: false,
          extra: `<p>${rank.map((x, i) => `${i + 1}. ${esc(x.name)}`).join(' · ')}</p><p><small>${right} van ${GOAL} sommen in ${mmss(t)}</small></p>`, again: startRace, back: () => go('race') });
        if (newRecord) playScene(document.body, 'new-record', { title: 'Nieuw record!', sub: mmss(t) }); else if (place === 1) playScene(document.body, 'victory', { title: 'Eerste plaats!', sub: 'Je bent de snelste rekenaar' }); else celebrate(res);
      },
    });
  }
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  /* ---------- Monsterjacht ---------- */
  function bossSetup() {
    const s = S(), wins = (s.records.boss && s.records.boss.defeated) || [];
    root.innerHTML = `${back()}<div class="tu-card" style="text-align:center"><h2 style="margin:.2rem 0">Monsterjacht</h2><p>Elk goed antwoord is een aanval. Bij een fout raakt het monster jou. Je hebt 3 levens.</p></div>
      <div class="tu-grid">${C.MONSTERS.map((m, i) => `<button class="tu-tile" data-m="${i}">${icon(m.icon, { size: 72 })}<span>${esc(m.name)}</span><small>${m.hp} levenspunten</small>${wins.includes(m.id) ? `<span class="tu-chip">${icon('medal', { size: 18 })} verslagen</span>` : ''}</button>`).join('')}</div>`;
    bindNav();
    root.querySelectorAll('[data-m]').forEach((b) => { b.onclick = () => startBoss(+b.dataset.m); });
  }
  function startBoss(idx) {
    const m = C.MONSTERS[idx], ids = C.TOPICS.map((t) => t.id).filter((id) => id !== 'woord' && id !== 'geld');
    let hp = m.hp, hurt = 0, hearts = 3, shake = 0, atk = 0; const fxm = new Particles();
    runSession({
      title: m.name, total: m.hp, lives: 3, hints: false, fast: true, mode: 'boss', onQuit: () => go('boss'),
      topHtml: '<div data-arena style="height:min(52vw,230px);border-radius:18px;overflow:hidden;position:relative;margin:.4rem 0"></div>',
      mount: (rt) => {
        const host = rt.querySelector('[data-arena]');
        const c = makeCanvas(host, (ctx2, w, h, t, dt) => {
          Themes.paintBackground(ctx2, w, h, Themes.world(m.world), GFX.reduce ? 0 : t);
          shake = Math.max(0, shake - dt); hurt = Math.max(0, hurt - dt); atk = Math.max(0, atk - dt);
          const bob = GFX.reduce ? 0 : Math.sin(t * 2.2) * 6, sz = Math.min(h * 0.62, 130), sx = shake > 0 ? Math.sin(t * 80) * 6 : 0;
          drawIcon(ctx2, m.icon, w * 0.68 + sx, h * 0.5 + bob, sz, { shadow: true, alpha: hurt > 0 ? 0.6 : 1 });
          drawIcon(ctx2, 'wizard', w * 0.22 + (atk > 0 ? atk * 120 : 0), h * 0.55, Math.min(h * 0.5, 90), { shadow: true });
          ctx2.fillStyle = 'rgba(0,0,0,.45)'; ctx2.fillRect(w * 0.45, 10, w * 0.5, 14); ctx2.fillStyle = '#ef4444'; ctx2.fillRect(w * 0.45, 10, w * 0.5 * Math.max(0, hp) / m.hp, 14);
          for (let i = 0; i < 3; i++) drawIcon(ctx2, 'heart', 22 + i * 28, 22, 24, { alpha: i < hearts ? 1 : 0.25 });
          fxm.update(dt); fxm.draw(ctx2);
        }, { fps: 30 }); track(c.stop);
        rt._boss = { burst: (x, y, o) => fxm.burst(x * c.w, y * c.h, o) };
        host._c = c;
      },
      next: (i, hist) => { const topic = pick(ids), L = clamp(Math.min(idx + 1, C.unlockedLevel(S(), topic) + 1), 1, 5); return C.makeQuestion(topic, L); },
      onAnswer: (a, st) => {
        const rt = root;
        if (a.ok) { const dmg = st.streak >= 3 ? 2 : 1; hp -= dmg; hurt = 0.4; shake = 0.4; atk = 0.25; rt._boss && rt._boss.burst(0.68, 0.5, { kind: 'stars', n: 12 }); }
        else { hearts = st.lives; rt._boss && rt._boss.burst(0.22, 0.55, { kind: 'smoke', n: 6 }); }
      },
      done: () => hp <= 0,
      onEnd: (hist, why) => {
        const won = hp <= 0, res = C.applySession(S(), { answers: hist, mode: 'boss' }), rec = (S().records.boss ||= { wins: 0, defeated: [] });
        let aw = { levelUp: 0, newBadges: [] };
        if (won) { rec.wins++; if (!rec.defeated.includes(m.id)) rec.defeated.push(m.id); aw = C.award(S(), 8 + idx * 4, 30 + idx * 10); res.coins += 8 + idx * 4; res.xp += 30 + idx * 10; res.newBadges = Array.from(new Set([...(res.newBadges || []), ...aw.newBadges])); res.levelUp = res.levelUp || aw.levelUp; }
        save();
        resultScreen({ res: { ...res, stars: won ? (hearts === 3 ? 3 : hearts === 2 ? 2 : 1) : 0 }, hist, title: won ? `${m.name} verslagen!` : `${m.name} won deze keer`, scene: false, again: () => startBoss(idx), back: () => go('boss') });
        if (won) playScene(document.body, 'boss-defeated', { title: `${m.name} verslagen!`, sub: 'Niemand houdt jou tegen' }); else celebrate(res);
      },
    });
  }

  go('hub');
}
