// Escape Room: 8 thema-kamers met puzzels (code, volgorde, voorwerpen combineren, schuifpuzzel, patroon, lampjes),
// hints, tijdklok, sterren, dagelijkse mini-kamer en prijzen. Opslag: gamesaves/escape__{uid} (lokaal eerst).
import { injectKit, head, wireHead, tabsHtml, ic, playScene, showToast, appStore } from './appkit.js?v=1';
import { Settings } from './gfx/settings.js?v=1';
import * as C from './escape-core.js?v=1';
import { makeScene } from './escape-scene.js?v=1';

const CSS = `
.es{--s:var(--gfx-scale,1)}
.es button{font:inherit}
.es-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.6rem}
.es-room{position:relative;overflow:hidden;border:0;border-radius:20px;color:#fff;text-align:left;padding:.8rem;min-height:calc(128px*var(--s));display:flex;flex-direction:column;justify-content:flex-end;gap:.15rem;cursor:pointer}
.es-room .gfx-icon,.es-room .gfx-emoji{position:absolute;right:.4rem;top:.4rem}
.es-room b{font-size:1.02em;text-shadow:0 1px 3px #0008;position:relative}.es-room small{opacity:.9;position:relative}
.es-room .new{position:absolute;left:.5rem;top:.5rem;background:#facc15;color:#422006;font-size:.7rem;font-weight:700;border-radius:99px;padding:.05rem .5rem}
.es-room:active{transform:scale(.97)}
.es-stars{display:inline-flex;gap:1px;align-items:center;position:relative}.es-stars .off{opacity:.25;filter:grayscale(1)}
.es-hero{border-radius:22px;color:#fff;padding:1rem;display:flex;gap:.8rem;align-items:center;margin-bottom:.6rem;position:relative;overflow:hidden}
.es-hero p{margin:.25rem 0 0;opacity:.95;font-size:.92em}
.es-diff{display:flex;align-items:center;gap:.7rem;width:100%;text-align:left;min-height:calc(64px*var(--s));padding:.5rem .8rem;margin:.35rem 0;border-radius:16px}
.es-diff .t{flex:1;min-width:0}.es-diff small{display:block;color:var(--mute)}
.es-hud{display:flex;gap:.4rem;align-items:center;flex-wrap:wrap;margin:.1rem 0 .5rem}
.es-hud .nm{flex:1;min-width:0;font-weight:700}
.es-clock{font-variant-numeric:tabular-nums;font-weight:700;background:var(--card);border:1px solid var(--line);border-radius:99px;padding:.25rem .8rem;min-height:36px;display:inline-flex;align-items:center;gap:.3rem}
.es-clock.warn{background:#dc2626;color:#fff;border-color:#dc2626}
.es-stage{position:relative;border-radius:22px;overflow:hidden;border:1px solid var(--line);background:#111;touch-action:manipulation}
.es-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.es-obj{position:absolute;transform:translate(-50%,-50%);width:calc(74px*var(--s));min-height:calc(70px*var(--s));padding:2px;background:none;border:0;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
.es-obj span.l{font-size:.62rem;line-height:1.05;text-shadow:0 1px 3px #000c;background:#0006;border-radius:99px;padding:1px 6px;margin-top:1px;max-width:76px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.es-obj .gfx-icon,.es-obj .gfx-emoji{filter:drop-shadow(0 4px 4px #0008)}
.es-obj.station:before{content:"";position:absolute;left:50%;top:44%;width:62px;height:62px;margin:-31px 0 0 -31px;border-radius:50%;background:radial-gradient(circle,#fde68a99,#fde68a00 70%);animation:es-pulse 1.8s ease-in-out infinite}
.es-obj.done{opacity:.75}.es-obj.done:before{display:none}
.es-obj.taken{opacity:.35}
.es-obj .ok{position:absolute;right:6px;top:2px;background:#16a34a;color:#fff;border-radius:50%;width:22px;height:22px;font-size:.8rem;display:flex;align-items:center;justify-content:center;font-weight:700}
.es-obj.found .l{background:#16a34acc}
@keyframes es-pulse{0%,100%{transform:scale(.85);opacity:.5}50%{transform:scale(1.15);opacity:1}}
html[data-reduce="1"] .es-obj.station:before{animation:none}
.es-prog{display:flex;gap:.4rem;align-items:center;margin:.55rem 0}
.es-prog .chips{display:flex;gap:.3rem;flex:1;flex-wrap:wrap}
.es-chip{width:34px;height:34px;border-radius:50%;background:var(--line);display:flex;align-items:center;justify-content:center}
.es-chip.on{background:#16a34a}
.es-bar{display:flex;gap:.4rem;margin:.4rem 0}
.es-bar button{flex:1;min-height:calc(46px*var(--s));display:flex;align-items:center;justify-content:center;gap:.3rem;border-radius:14px}
.es-exit{width:100%;min-height:calc(52px*var(--s));border-radius:16px;font-weight:700;background:var(--accent);color:#fff;border:0}
.es-exit[disabled]{opacity:.45}
.es-panel{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:.9rem;margin:.5rem 0}
.es-panel h3{margin:0 0 .3rem;font-size:1.05em;display:flex;align-items:center;gap:.4rem}
.es-msg{background:#fef3c7;color:#451a03;border-radius:14px;padding:.55rem .8rem;margin:.4rem 0;font-size:.93em}
.es-note{font-size:.88em;border-left:4px solid var(--accent);padding:.2rem .6rem;margin:.3rem 0;background:var(--line);border-radius:0 10px 10px 0}
.es-code{display:flex;gap:.4rem;justify-content:center;margin:.5rem 0}
.es-code i{font-style:normal;width:calc(52px*var(--s));height:calc(64px*var(--s));border-radius:12px;background:#0f172a;color:#4ade80;font:700 1.8rem ui-monospace,monospace;display:flex;align-items:center;justify-content:center;border:2px solid #334155}
.es-code.bad{animation:es-shake .4s}
@keyframes es-shake{0%,100%{transform:none}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
html[data-reduce="1"] .es-code.bad{animation:none}
.es-keys{display:grid;grid-template-columns:repeat(5,1fr);gap:.35rem;max-width:340px;margin:0 auto}
.es-keys button{min-height:calc(48px*var(--s));border-radius:12px;font-weight:700;font-size:1.15rem;padding:0}
.es-row{display:flex;gap:.4rem;flex-wrap:wrap;justify-content:center;margin:.4rem 0}
.es-tile{min-width:calc(62px*var(--s));min-height:calc(66px*var(--s));border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:.2rem .3rem;font-size:.75rem}
.es-tile.sel{outline:3px solid var(--accent)}.es-tile.dim{opacity:.35}
.es-slot{min-width:calc(56px*var(--s));min-height:calc(60px*var(--s));border-radius:14px;border:2px dashed var(--line);display:flex;align-items:center;justify-content:center;color:var(--mute);font-weight:700;background:none}
.es-slot.full{border-style:solid;border-color:var(--accent)}
.es-sl{display:grid;grid-template-columns:repeat(3,1fr);gap:.3rem;max-width:300px;margin:.5rem auto}
.es-sl button{aspect-ratio:1;border-radius:14px;font-weight:800;font-size:1.7rem;border:0;color:#fff;background:linear-gradient(135deg,var(--a1),var(--a2));min-height:64px;padding:0}
.es-sl button.blank{background:var(--line);visibility:hidden}
.es-sl button.glow,.es-lamp.glow{box-shadow:0 0 0 4px #facc15,0 0 18px #facc15}
.es-lamp{aspect-ratio:1;border-radius:18px;min-height:64px;border:3px solid #334155;background:#1e293b;padding:0;display:flex;align-items:center;justify-content:center}
.es-lamp.on{background:radial-gradient(circle,#fef08a,#f59e0b);border-color:#fbbf24}
.es-lamp .gfx-icon,.es-lamp .gfx-emoji{opacity:.35}.es-lamp.on .gfx-icon,.es-lamp.on .gfx-emoji{opacity:1}
.es-seq{display:flex;gap:.35rem;align-items:center;justify-content:center;flex-wrap:wrap;margin:.5rem 0}
.es-seq .q{width:52px;height:52px;border-radius:14px;border:3px dashed var(--accent);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.5rem;color:var(--accent)}
.es-seq .tk{display:flex;align-items:center;gap:1px;font-weight:700;font-size:.8rem}
.es-inv{display:grid;grid-template-columns:repeat(4,1fr);gap:.4rem}
.es-inv button{min-height:calc(76px*var(--s));border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:.72rem;padding:.2rem}
.es-inv button.sel{outline:3px solid var(--accent);background:var(--line)}
.es-end{text-align:center;padding:1rem .4rem}
.es-end h2{margin:.2rem 0}
.es-big{font-size:1.1rem;font-weight:700}
.es-ach{display:flex;gap:.6rem;align-items:center;padding:.5rem;border-radius:16px;border:1px solid var(--line);background:var(--card);margin:.35rem 0}
.es-ach.lock .gfx-icon,.es-ach.lock .gfx-emoji{filter:grayscale(1);opacity:.35}
.es-stat{display:grid;grid-template-columns:repeat(4,1fr);gap:.4rem;text-align:center}.es-stat b{display:block;font-size:1.25em}.es-stat small{color:var(--mute)}
.es-pause{background:#000c;color:#fff;position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6rem;font-weight:700}
`;

const TABS = [['kamers', 'Kamers', 'key'], ['dagelijks', 'Dagelijks', 'hourglass'], ['prijzen', 'Prijzen', 'trophy']];
const starsHtml = (n, size = 16) => `<span class="es-stars" aria-label="${n} sterren">${[1, 2, 3].map((i) => `<span class="${i <= n ? '' : 'off'}">${ic('star', { size })}</span>`).join('')}</span>`;

export async function escapeView(ctx) {
  const { view, esc, addCleanup } = ctx;
  injectKit();
  if (typeof document !== 'undefined' && !document.getElementById('es-css')) { const st = document.createElement('style'); st.id = 'es-css'; st.textContent = CSS; (document.head || document.documentElement).appendChild(st); }
  const store = appStore(ctx, 'escape', C.defaults());
  let alive = true;
  try { await store.load(); } catch (e) { /* lokaal verder */ }
  const S = () => store.get();

  let tab = 'kamers', screen = 'home', setupRoom = null;
  let R = null, ST = null, panel = null, msg = '', mem = null, sel = [], scene = null, timer = null, lastTick = 0, clockOn = false, paused = false, lastSave = 0, ended = false, offSet = null;

  const stopPlay = () => { if (timer) { clearInterval(timer); timer = null; } if (scene) { scene.stop(); scene = null; } if (offSet) { offSet(); offSet = null; } clockOn = false; };
  const persist = () => { if (R && ST && !ended) store.set({ cur: C.packCur(R, ST), lastRoom: R.room, lastDiff: R.diff }); };
  addCleanup(() => { alive = false; persist(); stopPlay(); store.flush(); });
  const on = (root, sel2, fn) => root.querySelectorAll(sel2).forEach((b) => { b.onclick = (e) => fn(b, e); });
  const $ = (s) => view.querySelector(s);
  const room = () => C.ROOM_BY_ID[R.room];
  const diff = () => C.diffOf(R);

  /* ---------- startscherm ---------- */
  function paintHome() {
    screen = 'home'; stopPlay();
    const s = S(), cur = C.unpackCur(s.cur);
    let body = '';
    if (tab === 'kamers') {
      body += cur ? `<div class="ak-card"><h3>Verder spelen</h3><p class="mute">${esc(C.ROOM_BY_ID[cur.run.room].name)} · ${esc(C.diffOf(cur.run).name)} · ${C.fmt(cur.st.t)} · ${cur.st.solved.length}/${cur.run.puzzles.length} puzzels</p><button class="ak-big" data-resume style="background:var(--accent);color:#fff;border:0;width:100%">Doorgaan</button></div>` : '';
      body += `<div class="es-grid">${C.ROOMS.map((r) => {
        const n = C.roomStars(s, r.id), seen = s.rooms.includes(r.id);
        return `<button class="es-room" data-room="${r.id}" style="background:linear-gradient(150deg,${r.bg[0]},${r.bg[1]})">${ic(r.icon, { size: 64 })}${seen ? '' : '<span class="new">Nieuw</span>'}<b>${esc(r.name)}</b><small>${esc(r.sub)}</small>${starsHtml(n)}</button>`;
      }).join('')}</div>`;
    } else if (tab === 'dagelijks') body += dailyHtml(s);
    else body += prizesHtml(s);
    view.innerHTML = `<div class="ak es">${head({ icon: 'lock', title: 'Escape Room', sub: `${C.totalStars(s)} sterren · ${s.plays} ontsnappingen`, c1: '#7c3aed', c2: '#db2777' })}${tabsHtml(tab, TABS)}${body}</div>`;
    wireHead(view, showToast);
    on(view, '[data-tab]', (b) => { tab = b.dataset.tab; paintHome(); });
    on(view, '[data-room]', (b) => paintSetup(b.dataset.room));
    on(view, '[data-resume]', () => { const c = C.unpackCur(S().cur); if (c) startPlay(c.run, c.st, true); });
    on(view, '[data-daily]', () => startPlay(C.buildDaily(C.dayKey()), C.newState(), false));
  }

  function dailyHtml(s) {
    const key = C.dayKey(), spec = C.dailySpec(key), r = C.ROOM_BY_ID[spec.room], done = s.daily[key];
    const days = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = C.dayKey(d); days.push([k, s.daily[k]]); }
    return `<div class="es-hero" style="background:linear-gradient(150deg,${r.bg[0]},${r.bg[1]})">${ic(r.icon, { size: 72 })}<div><b style="font-size:1.15em">Mini-kamer van vandaag</b><p>${esc(r.name)} · 2 puzzels · ${C.fmt(C.DIFF_DAILY.par)} voor 3 sterren</p></div></div>
      <div class="ak-card">${done ? `<p class="es-big">Gelukt! ${starsHtml(done.s, 22)} in ${C.fmt(done.t)}</p><p class="mute">Kom morgen terug voor een nieuwe kamer. Je mag oefenen, dan blijft je beste score staan.</p>` : '<p>Elke dag een nieuwe kleine kamer, voor iedereen dezelfde. Houd je reeks vol!</p>'}
        <button class="ak-big" data-daily style="background:var(--accent);color:#fff;border:0;width:100%">${done ? 'Oefen opnieuw' : 'Start de dagelijkse kamer'}</button></div>
      <div class="ak-card"><div class="es-stat"><div><b>${s.dstreak}</b><small>reeks</small></div><div><b>${s.dcount}</b><small>gedaan</small></div><div><b>${days.filter((d) => d[1]).length}/7</b><small>deze week</small></div></div>
      <div class="es-row">${days.map(([k, v]) => `<span class="ak-chip ${v ? 'on' : ''}" title="${k}">${k.slice(8)} ${v ? '★'.repeat(v.s) : '·'}</span>`).join('')}</div></div>`;
  }

  function prizesHtml(s) {
    return `<div class="ak-card"><div class="es-stat"><div><b>${C.totalStars(s)}</b><small>sterren</small></div><div><b>${s.plays}</b><small>ontsnapt</small></div><div><b>${s.solved}</b><small>puzzels</small></div><div><b>${s.hints}</b><small>hints</small></div></div></div>
      ${C.ACH.map((a) => { const got = s.ach.includes(a.id); return `<div class="es-ach ${got ? '' : 'lock'}">${ic(a.icon, { size: 44 })}<div><b>${esc(a.name)}</b><br><small class="mute">${esc(a.desc)}</small></div></div>`; }).join('')}`;
  }

  /* ---------- kamer kiezen ---------- */
  function paintSetup(id) {
    screen = 'setup'; setupRoom = id; const r = C.ROOM_BY_ID[id], s = S();
    view.innerHTML = `<div class="ak es"><div class="es-hero" style="background:linear-gradient(150deg,${r.bg[0]},${r.bg[1]})">${ic(r.icon, { size: 80 })}<div><b style="font-size:1.2em">${esc(r.name)}</b><p>${esc(r.intro)}</p></div></div>
      <h3 style="margin:.4rem 0 0">Kies hoe moeilijk</h3>
      ${C.DIFFS.map((d) => { const rec = s.rec[C.recKey(id, d.id)]; return `<button class="es-diff" data-diff="${d.id}">${ic(d.icon, { size: 40 })}<span class="t"><b>${d.name}</b><small>${esc(d.desc)}</small></span><span style="text-align:right">${starsHtml(rec ? rec.s : 0, 14)}<small>${rec ? 'Beste ' + C.fmt(rec.t) : ''}</small></span></button>`; }).join('')}
      <button class="ak-big" data-back style="width:100%;margin-top:.5rem">Terug</button></div>`;
    on(view, '[data-diff]', (b) => startPlay(C.buildRun(id, b.dataset.diff, Math.floor(Math.random() * 2147483647)), C.newState(), false));
    on(view, '[data-back]', () => paintHome());
  }

  /* ---------- spelen ---------- */
  function resetMem() {
    mem = { code: {}, order: {}, slide: {}, lights: {}, glow: {} };
    for (const p of R.puzzles) {
      if (p.type === 'code') mem.code[p.id] = '';
      if (p.type === 'order') mem.order[p.id] = [];
      if (p.type === 'slide') mem.slide[p.id] = { tiles: p.start.slice(), moves: 0 };
      if (p.type === 'lights') mem.lights[p.id] = { state: p.start.slice(), pressed: new Array(9).fill(0) };
    }
  }

  function startPlay(run, st, resumed) {
    stopPlay(); R = run; ST = st; panel = null; sel = []; ended = false; paused = false; screen = 'play';
    msg = resumed ? 'Welkom terug! Je kunt verder waar je gebleven was.' : room().intro;
    resetMem();
    const r = room(), d = diff();
    view.innerHTML = `<div class="ak es"><div class="es-hud"><button data-leave class="ak-big" aria-label="Terug naar de lijst" style="min-width:48px">←</button><span class="nm">${ic(r.icon, { size: 28 })} ${esc(R.daily ? 'Dagelijks: ' : '')}${esc(r.name)}</span><span class="es-clock" id="es-clock"></span></div>
      <div class="es-stage" id="es-stage" style="height:${Math.max(300, R.rows * 108 + 16)}px"><canvas id="es-cv"></canvas><div id="es-objs"></div><div id="es-pause" hidden></div></div>
      <div class="es-prog"><div class="chips" id="es-chips"></div><span id="es-stars"></span></div>
      <div class="es-bar"><button data-inv>${ic('bag', { size: 24 })} Rugzak</button><button data-notes>${ic('book', { size: 24 })} Notities</button><button data-pause>${ic('hourglass', { size: 24 })} Pauze</button></div>
      <div id="es-panel"></div>
      <button class="es-exit" id="es-exit" disabled>${ic('house', { size: 26 })} Naar buiten</button></div>`;
    const cv = $('#es-cv');
    try { scene = makeScene(cv, r); scene.resize(cv.clientWidth || 360, cv.clientHeight || 300); scene.start(); } catch (e) { scene = null; }
    offSet = Settings.onChange(() => { if (scene) scene.resize(cv.clientWidth || 360, cv.clientHeight || 300); });
    on(view, '[data-leave]', () => { persist(); store.flush(); paintHome(); });
    on(view, '[data-inv]', () => openPanel({ t: 'inv' }));
    on(view, '[data-notes]', () => openPanel({ t: 'notes' }));
    on(view, '[data-pause]', () => togglePause());
    $('#es-exit').onclick = () => finish();
    paintStage(); paintPanel(); paintHud();
    // klok start na de intro-scène (of na 5 seconden als die niet klaar komt)
    clockOn = false; lastTick = Date.now();
    const go = () => { if (!clockOn && alive && R === run) { clockOn = true; lastTick = Date.now(); } };
    if (!resumed) { Promise.race([playScene(r.scene, { title: r.name, sub: r.sub }), new Promise((res) => setTimeout(res, 5000))]).then(go, go); } else go();
    timer = setInterval(tick, 500);
  }

  function tick() {
    if (!alive || screen !== 'play' || ended) return;
    const n = Date.now();
    if (clockOn && !paused && !(typeof document !== 'undefined' && document.hidden)) ST.t += Math.min(2, Math.max(0, (n - lastTick) / 1000));
    lastTick = n;
    paintHud();
    if (C.timedOut(R, ST)) return finish(true);
    if (n - lastSave > 8000) { lastSave = n; persist(); }
  }

  function paintHud() {
    const el = $('#es-clock'); if (!el) return;
    const left = C.timeLeft(R, ST);
    el.textContent = left == null ? C.fmt(ST.t) : C.fmt(left);
    el.className = 'es-clock' + (left != null && left < 60 ? ' warn' : '');
    const stars = C.starsFor(R, ST);
    const se = $('#es-stars'); if (se) se.innerHTML = starsHtml(stars, 22);
  }

  function togglePause() {
    paused = !paused;
    const p = $('#es-pause');
    if (!p) return;
    if (paused) { p.hidden = false; p.className = 'es-pause'; p.innerHTML = `${ic('hourglass', { size: 56 })}<span>Gepauzeerd</span><button class="ak-big" data-unpause style="min-width:160px">Verder</button>`; on(p, '[data-unpause]', togglePause); }
    else { p.hidden = true; p.className = ''; p.innerHTML = ''; }
  }

  function paintStage() {
    const host = $('#es-objs'); if (!host) return;
    host.innerHTML = R.objects.map((o) => {
      const done = o.kind === 'station' && C.isSolved(ST, o.pid), found = ST.found.includes(o.id);
      const cls = `es-obj ${o.kind}${done ? ' done' : ''}${found && o.kind === 'clue' ? ' found' : ''}${found && o.kind === 'item' ? ' taken' : ''}`;
      return `<button class="${cls}" data-obj="${o.id}" style="left:${o.x}%;top:${o.y}%" aria-label="${esc(o.name)}">${ic(o.icon, { size: 50 })}${done ? '<span class="ok">✓</span>' : ''}<span class="l">${esc(o.name)}</span></button>`;
    }).join('');
    on(host, '[data-obj]', (b) => tapObj(b.dataset.obj));
    const chips = $('#es-chips');
    if (chips) chips.innerHTML = R.puzzles.map((p) => `<span class="es-chip ${C.isSolved(ST, p.id) ? 'on' : ''}" title="${esc(C.TYPES[p.type].name)}">${ic(C.isSolved(ST, p.id) ? 'key' : C.TYPES[p.type].station, { size: 22 })}</span>`).join('');
    const ex = $('#es-exit'); if (ex) ex.disabled = !C.allSolved(R, ST);
  }

  function openPanel(p) { panel = p; sel = []; paintPanel(); const el = $('#es-panel'); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }

  function tapObj(id) {
    if (paused || ended) return;
    const r = C.tapObject(R, ST, id);
    if (r.kind === 'station') { openPanel({ t: 'puz', pid: r.pid }); return; }
    if (r.kind === 'clue' || r.kind === 'item') { msg = r.text; panel = r.kind === 'item' && r.first ? { t: 'inv' } : null; if (r.first) persist(); paintStage(); paintPanel(); }
  }

  /* ---------- paneel onder de kamer ---------- */
  function paintPanel() {
    const host = $('#es-panel'); if (!host) return;
    let h = msg ? `<div class="es-msg">${esc(msg)}</div>` : '';
    if (panel && panel.t === 'inv') h += invHtml();
    else if (panel && panel.t === 'notes') h += notesHtml();
    else if (panel && panel.t === 'puz') h += puzzleHtml(C.puzzleOf(R, panel.pid));
    host.innerHTML = h;
    wirePanel(host);
  }

  function invHtml() {
    const items = ST.inv.map((i) => C.itemInfo(R, i));
    return `<div class="es-panel"><h3>${ic('bag', { size: 30 })} Rugzak</h3>${items.length ? `<div class="es-inv">${items.map((i) => `<button data-item="${i.id}" class="${sel.includes(i.id) ? 'sel' : ''}">${ic(i.icon, { size: 40 })}${esc(i.name)}</button>`).join('')}</div>
      <p class="mute" style="font-size:.85em">Kies twee voorwerpen en druk op Combineer.</p><button class="ak-big" data-combine ${sel.length === 2 ? '' : 'disabled'} style="width:100%">Combineer</button>` : '<p class="mute">Nog leeg. Zoek in de kamer naar voorwerpen die je kunt oppakken.</p>'}</div>`;
  }
  function notesHtml() {
    const ns = C.notesOf(R, ST);
    return `<div class="es-panel"><h3>${ic('book', { size: 30 })} Notitieboekje</h3>${ns.length ? ns.map((n) => `<div class="es-note">${esc(n.text)}</div>`).join('') : '<p class="mute">Nog niets gevonden. Tik op de voorwerpen in de kamer om briefjes te zoeken.</p>'}</div>`;
  }

  function puzzleHtml(p) {
    const t = C.TYPES[p.type], done = C.isSolved(ST, p.id), r = room();
    let h = `<div class="es-panel"><h3>${ic(t.station, { size: 32 })} ${esc(t.label)}</h3>`;
    if (done) return h + '<p>Dit is al opgelost. Goed gedaan!</p></div>';
    const notes = R.objects.filter((o) => o.pid === p.id && o.kind === 'clue');
    const got = notes.filter((o) => ST.found.includes(o.id));
    const showNotes = () => got.map((o) => `<div class="es-note">${esc(o.note)}</div>`).join('');
    if (p.type === 'code') {
      const cur = mem.code[p.id];
      h += `<p class="mute">Zoek de ${p.len} briefjes in de kamer (${got.length}/${p.len} gevonden) en tik de code in.</p>${showNotes()}
        <div class="es-code" id="es-codebox">${Array.from({ length: p.len }, (_, i) => `<i>${cur[i] != null ? cur[i] : ''}</i>`).join('')}</div>
        <div class="es-keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((k) => `<button data-key="${k}">${k}</button>`).join('')}<button data-key="b" aria-label="Wis">⌫</button></div>`;
    } else if (p.type === 'order') {
      const picked = mem.order[p.id];
      h += `<p class="mute">Zet de voorwerpen in de goede volgorde (links naar rechts). ${got.length}/${notes.length} tips gevonden.</p>${showNotes()}
        <div class="es-row">${p.solution.map((_, i) => `<button class="es-slot ${picked[i] ? 'full' : ''}" data-unpick="${i}">${picked[i] ? ic(picked[i], { size: 40 }) : i + 1}</button>`).join('')}</div>
        <div class="es-row">${p.items.map((i) => `<button class="es-tile ${picked.includes(i) ? 'dim' : ''}" data-pick="${i}">${ic(i, { size: 40 })}${esc(C.nl(i))}</button>`).join('')}</div>`;
    } else if (p.type === 'combine') {
      const items = ST.inv.map((i) => C.itemInfo(R, i));
      h += `<p class="mute">Op het slot staat een plaatje van een ${esc(C.nl(p.r))}. Maak die eerst in je rugzak.</p>
        <div class="es-row">${ic(p.r, { size: 56 })}</div>
        ${items.length ? `<p>Welk voorwerp gebruik je?</p><div class="es-inv">${items.map((i) => `<button data-use="${i.id}">${ic(i.icon, { size: 40 })}${esc(i.name)}</button>`).join('')}</div>` : '<p class="mute">Je rugzak is leeg. Zoek eerst voorwerpen in de kamer.</p>'}`;
    } else if (p.type === 'slide') {
      const m = mem.slide[p.id], g = mem.glow[p.id];
      h += `<p class="mute">Schuif de tegels op volgorde: 1 tot en met 8. Zetten: ${m.moves}</p>
        <div class="es-sl" style="--a1:${r.bg[1]};--a2:${r.accent}">${m.tiles.map((v, i) => `<button data-sl="${i}" class="${v ? '' : 'blank'}${g === i ? ' glow' : ''}">${v || ''}</button>`).join('')}</div>`;
    } else if (p.type === 'pattern') {
      const tk = (o) => `<span class="tk">${ic(o.icon, { size: 36 })}${o.n > 1 ? '×' + o.n : ''}</span>`;
      h += `<p class="mute">Wat komt er daarna?</p><div class="es-seq">${p.tokens.map(tk).join('')}<span class="q">?</span></div>
        <div class="es-row">${p.options.map((o, i) => `<button class="es-tile" data-opt="${i}">${ic(o.icon, { size: 40 })}${o.n > 1 ? '×' + o.n : esc(C.nl(o.icon))}</button>`).join('')}</div>`;
    } else if (p.type === 'lights') {
      const m = mem.lights[p.id], g = mem.glow[p.id];
      h += `<p class="mute">Maak alle lampjes aan. Een tik draait ook de buren om.</p>
        <div class="es-sl" style="max-width:260px">${m.state.map((v, i) => `<button class="es-lamp ${v ? 'on' : ''}${g === i ? ' glow' : ''}" data-lamp="${i}" aria-label="Lampje ${i + 1}">${ic('lightbulb', { size: 36 })}</button>`).join('')}</div>`;
    }
    const d = diff(), free = Math.max(0, d.hints - ST.hints);
    h += `<div class="es-bar"><button data-hint>${ic('lightbulb', { size: 24 })} Hint ${free ? `(${free} gratis)` : '(kost een ster)'}</button><button data-close>Sluiten</button></div></div>`;
    return h;
  }

  function wirePanel(host) {
    on(host, '[data-item]', (b) => { const id = b.dataset.item; sel = sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id].slice(-2); paintPanel(); });
    on(host, '[data-combine]', () => {
      if (sel.length !== 2) return;
      const r = C.combineItems(R, ST, sel[0], sel[1]); msg = r.msg; sel = [];
      if (r.ok) { burst(0.5, 0.5, 'sparkle'); persist(); }
      paintStage(); paintPanel();
    });
    on(host, '[data-use]', (b) => {
      const p = C.puzzleOf(R, panel.pid), r = C.useItem(R, ST, p.id, b.dataset.use);
      if (r.ok) win(p); else { msg = r.msg; paintPanel(); }
    });
    on(host, '[data-close]', () => { panel = null; msg = ''; paintPanel(); });
    on(host, '[data-hint]', () => giveHint());
    on(host, '[data-key]', (b) => {
      const p = C.puzzleOf(R, panel.pid), k = b.dataset.key;
      let cur = mem.code[p.id];
      if (k === 'b') cur = cur.slice(0, -1); else if (cur.length < p.len) cur += k;
      mem.code[p.id] = cur;
      if (cur.length === p.len) {
        if (C.checkCode(p, cur)) return win(p);
        msg = 'Het slot blijft dicht. Controleer je briefjes en probeer het nog eens!'; mem.code[p.id] = ''; paintPanel();
        const box = $('#es-codebox'); if (box) box.className = 'es-code bad';
      } else { msg = ''; paintPanel(); }
    });
    on(host, '[data-pick]', (b) => {
      const p = C.puzzleOf(R, panel.pid), arr = mem.order[p.id], i = b.dataset.pick;
      if (arr.includes(i) || arr.length >= p.solution.length) return;
      arr.push(i);
      if (arr.length === p.solution.length) {
        if (C.checkOrder(p, arr)) return win(p);
        msg = 'Niet helemaal goed. Lees de tips in je notities nog eens.'; mem.order[p.id] = [];
      } else msg = '';
      paintPanel();
    });
    on(host, '[data-unpick]', (b) => { const p = C.puzzleOf(R, panel.pid); mem.order[p.id].splice(+b.dataset.unpick, 1); paintPanel(); });
    on(host, '[data-sl]', (b) => {
      const p = C.puzzleOf(R, panel.pid), m = mem.slide[p.id], n = C.slideMove(m.tiles, +b.dataset.sl);
      if (!n) return;
      m.tiles = n; m.moves++; mem.glow[p.id] = null;
      if (C.slideDone(n)) return win(p);
      msg = ''; paintPanel();
    });
    on(host, '[data-lamp]', (b) => {
      const p = C.puzzleOf(R, panel.pid), m = mem.lights[p.id], i = +b.dataset.lamp;
      m.state = C.lightsPress(m.state, i); m.pressed[i]++; mem.glow[p.id] = null;
      if (C.lightsDone(m.state)) return win(p);
      msg = ''; paintPanel();
    });
    on(host, '[data-opt]', (b) => {
      const p = C.puzzleOf(R, panel.pid);
      if (C.checkPattern(p, +b.dataset.opt)) return win(p);
      msg = 'Dat is het niet. Kijk nog eens naar wat zich herhaalt!'; paintPanel();
    });
  }

  function giveHint() {
    const p = C.puzzleOf(R, panel.pid); if (!p) return;
    const lvl = Math.min(2, ST.hl[p.id] == null ? 0 : ST.hl[p.id] + 1);
    if (ST.hl[p.id] !== lvl) { ST.hl[p.id] = lvl; ST.hints++; }
    msg = C.hintText(R, ST, p, lvl);
    if (lvl === 2) {
      if (p.type === 'slide') { const g = C.slideHint(mem.slide[p.id].tiles); mem.glow[p.id] = g == null ? null : g; }
      if (p.type === 'lights') { const n = C.lightsNeeded(p, mem.lights[p.id].pressed); mem.glow[p.id] = n.length ? n[0] : null; }
    }
    persist(); paintHud(); paintPanel();
  }

  function burst(x, y, kind) { if (scene) scene.burst(x, y, kind, 28); }

  function win(p) {
    const o = R.objects.find((x) => x.pid === p.id && x.kind === 'station');
    const text = C.solvePuzzle(R, ST, p.id);
    msg = (p.type === 'combine' ? 'Klik! De kist springt open. ' : 'Opgelost! ') + text;
    panel = null; mem.glow[p.id] = null;
    burst((o ? o.x : 50) / 100, (o ? o.y : 50) / 100, 'stars');
    persist(); paintStage(); paintPanel(); paintHud();
    if (C.allSolved(R, ST)) { msg += ' De deur is open! Tik op Naar buiten.'; paintPanel(); }
  }

  /* ---------- einde ---------- */
  function finish(timeUp) {
    if (ended) return;
    if (!timeUp && !C.allSolved(R, ST)) return;
    ended = true; stopPlay();
    const run = R, st = ST, r = room();
    let html;
    if (timeUp) {
      store.set({ cur: null });
      html = `<div class="ak-card es-end">${ic('hourglass', { size: 90 })}<h2>De tijd is om!</h2><p class="mute">Je had ${st.solved.length} van de ${run.puzzles.length} puzzels. Probeer het nog eens, je kunt het!</p>`;
    } else {
      const res = C.finishRun(S(), run, st); store.set(res.patch); store.flush();
      html = `<div class="ak-card es-end pop">${ic(r.icon, { size: 90 })}<h2>Ontsnapt!</h2><p>${esc(r.outro)}</p><div class="es-big">${starsHtml(res.stars, 40)}</div>
        <p>Tijd ${C.fmt(st.t)} · ${st.hints} ${st.hints === 1 ? 'hint' : 'hints'}${res.newBest ? ' · nieuw record!' : ''}</p>
        <small class="mute">Sterren: gelukt, maximaal ${C.diffOf(run).hints} ${C.diffOf(run).hints === 1 ? 'hint' : 'hints'}, binnen ${C.fmt(C.diffOf(run).par)}</small>
        ${res.newAch.length ? `<div style="margin-top:.6rem"><b>Nieuwe prijs${res.newAch.length > 1 ? 'zen' : ''}!</b>${res.newAch.map((id) => { const a = C.ACH.find((x) => x.id === id); return `<div class="es-ach">${ic(a.icon, { size: 40 })}<div><b>${esc(a.name)}</b><br><small class="mute">${esc(a.desc)}</small></div></div>`; }).join('')}</div>` : ''}`;
      playScene(run.daily ? 'daily-bonus' : res.newBest && st.hints === 0 ? 'new-record' : 'victory', { title: 'Ontsnapt!', sub: r.name });
    }
    html += `<button class="ak-big" data-again style="width:100%;margin-top:.7rem;background:var(--accent);color:#fff;border:0">Nog een keer</button><button class="ak-big" data-home style="width:100%;margin-top:.4rem">Naar de kamers</button></div>`;
    view.innerHTML = `<div class="ak es">${html}</div>`;
    screen = 'end';
    on(view, '[data-again]', () => {
      if (run.daily) startPlay(C.buildDaily(run.daily), C.newState(), false);
      else startPlay(C.buildRun(run.room, run.diff, Math.floor(Math.random() * 2147483647)), C.newState(), false);
    });
    on(view, '[data-home]', () => { tab = 'kamers'; paintHome(); });
  }

  paintHome();
}
