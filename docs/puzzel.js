// Losse puzzel-app: start één minigame uit games/mini/ als eigen app, nu met een menu (spelen, dagelijkse puzzel, 100 extra levels),
// een wereld als achtergrond, een instellingenknop en korte scènes bij mijlpalen. De gewone voortgang wordt op dezelfde plek bewaard
// als in de Gamescroller (gamesaves/{spel}__{uid}); extra levels en dagelijkse puzzel hebben een eigen, aparte opslag
// (lokaal + gamesaves/{spel}-extra__{uid} met exact {game,uid,data,updated}).
import { doc, getDoc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { GFX, Settings } from './gfx/settings.js?v=1';
import { icon } from './gfx/art.js?v=1';
import { Themes } from './gfx/themes.js?v=1';
import { Scenes } from './gfx/scenes.js?v=1';
import { openSettingsPanel } from './gfx/panel.js?v=1';
import { attach3D } from './emoji3d.js?v=1';
import * as PX from './puzzel-extra.js?v=1';
import * as R from './puzzel-r4-packs.js?v=1';

const CLOUD_EVERY = 20000;

const CSS = `
.pz-root{position:relative;overflow:hidden;border-radius:20px;min-height:calc(100vh - 150px);padding:calc(12px * var(--gfx-scale,1));background:#0b1026;color:#fff;isolation:isolate}
.pz-bg{position:absolute;inset:0;width:100%;height:100%;z-index:-1;display:block}
.pz-ui{position:relative;max-width:560px;margin:0 auto}
.pz-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}
.pz-title{display:flex;align-items:center;gap:12px;min-width:0}
.pz-title h2{margin:0;font-size:calc(1.45rem * var(--gfx-font,1));line-height:1.15;text-shadow:0 2px 8px rgba(0,0,0,.45)}
.pz-title small{display:block;opacity:.9;font-size:calc(.9rem * var(--gfx-font,1));text-shadow:0 1px 4px rgba(0,0,0,.5)}
.pz-tools{display:flex;gap:8px;flex:none}
.pz-ib{min-width:52px;min-height:52px;border:0;border-radius:16px;background:rgba(15,23,42,.55);color:#fff;font-size:1.4rem;cursor:pointer;display:flex;align-items:center;justify-content:center;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.pz-ib:active,.pz-card:active,.pz-lv:active{transform:scale(.96)}
.pz-cards{display:grid;gap:12px}
.pz-card{display:flex;align-items:center;gap:14px;width:100%;text-align:left;padding:calc(14px * var(--gfx-scale,1)) calc(16px * var(--gfx-scale,1));border:0;border-radius:20px;color:#fff;cursor:pointer;font:inherit;min-height:84px;
 background:linear-gradient(135deg,rgba(15,23,42,.62),rgba(15,23,42,.42));box-shadow:0 8px 24px rgba(0,0,0,.28),inset 0 0 0 2px rgba(255,255,255,.14);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.pz-card.main{background:linear-gradient(135deg,var(--pz-ac,#6366f1),rgba(15,23,42,.55));min-height:104px}
.pz-card b{display:block;font-size:calc(1.2rem * var(--gfx-font,1))}
.pz-card span.s{display:block;opacity:.92;font-size:calc(.92rem * var(--gfx-font,1));margin-top:2px}
.pz-card .ic{flex:none;filter:drop-shadow(0 4px 6px rgba(0,0,0,.4))}
.pz-bar{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.pz-bar b{flex:1;text-align:center;text-shadow:0 1px 4px rgba(0,0,0,.6);font-size:calc(1rem * var(--gfx-font,1))}
.pz-wrap{display:flex;justify-content:center}
.pz-host{position:relative;overflow:hidden;border-radius:18px;background:#0b1026;touch-action:none;box-shadow:0 0 0 3px var(--pz-ring,var(--pz-ac,#6366f1)),0 12px 36px rgba(0,0,0,.45)}
html[data-gfx-q="2"] .pz-host{box-shadow:0 0 0 3px var(--pz-ring,var(--pz-ac,#6366f1)),0 0 28px var(--pz-ring,var(--pz-ac,#6366f1)),0 14px 40px rgba(0,0,0,.5)}
.pz-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(58px * var(--gfx-scale,1)),1fr));gap:8px}
.pz-lv{min-height:calc(60px * var(--gfx-scale,1));border:0;border-radius:14px;background:rgba(15,23,42,.6);color:#fff;font:inherit;font-weight:800;font-size:calc(1.05rem * var(--gfx-font,1));cursor:pointer;box-shadow:inset 0 0 0 2px rgba(255,255,255,.14);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.pz-lv small{font-size:.7rem;letter-spacing:-1px;color:#fde047;min-height:1em}
.pz-lv.done{background:linear-gradient(160deg,var(--pz-ac,#6366f1),rgba(15,23,42,.6))}
.pz-pane{background:rgba(15,23,42,.55);border-radius:18px;padding:14px;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.pz-pane h3{margin:0 0 10px;font-size:calc(1.1rem * var(--gfx-font,1))}
.pz-worlds{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(96px * var(--gfx-scale,1)),1fr));gap:8px}
.pz-w{border:0;border-radius:14px;padding:8px 4px;min-height:84px;color:#fff;cursor:pointer;font:inherit;font-size:calc(.85rem * var(--gfx-font,1));display:flex;flex-direction:column;align-items:center;gap:4px;box-shadow:inset 0 0 0 2px rgba(255,255,255,.2)}
.pz-w.on{box-shadow:inset 0 0 0 4px #fff}
.pz-rank{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:18px;background:rgba(15,23,42,.5);margin-bottom:12px;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.pz-rank b{display:block;font-size:calc(1.1rem * var(--gfx-font,1))}.pz-rank small{display:block;opacity:.92;font-size:calc(.82rem * var(--gfx-font,1))}
.pz-rank .pz-rk{flex:1;min-width:0}
.pz-pb{display:block;height:8px;border-radius:6px;background:rgba(255,255,255,.18);margin-top:6px;overflow:hidden}.pz-pb u{display:block;height:100%;background:linear-gradient(90deg,var(--pz-ac,#6366f1),#fde047);border-radius:6px}
.pz-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px}
.pz-tab{min-height:56px;border:0;border-radius:14px;background:rgba(15,23,42,.6);color:#fff;font:inherit;font-weight:800;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;box-shadow:inset 0 0 0 2px rgba(255,255,255,.14)}
.pz-tab.on{box-shadow:inset 0 0 0 4px #fff;background:linear-gradient(160deg,var(--pz-ac,#6366f1),rgba(15,23,42,.6))}.pz-tab.lock{opacity:.6}
.pz-skins{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(120px * var(--gfx-scale,1)),1fr));gap:10px}
.pz-sk{border:0;border-radius:16px;padding:10px 6px;min-height:112px;color:#fff;font:inherit;cursor:pointer;background:rgba(15,23,42,.6);display:flex;flex-direction:column;align-items:center;gap:4px;box-shadow:inset 0 0 0 3px var(--sk,#fff)}
.pz-sk.on{background:linear-gradient(160deg,var(--sk,#6366f1),rgba(15,23,42,.6));box-shadow:inset 0 0 0 4px #fff}.pz-sk.lock{opacity:.55}
.pz-sk small{font-size:calc(.75rem * var(--gfx-font,1));opacity:.95;text-align:center}
.pz-big{font-size:calc(2.4rem * var(--gfx-font,1));font-weight:900;text-align:center;margin:6px 0;text-shadow:0 2px 8px rgba(0,0,0,.5)}
.pz-row{display:flex;gap:10px;flex-wrap:wrap}.pz-row .pz-card{flex:1 1 200px}
.pz-hud{font-weight:900;font-variant-numeric:tabular-nums}.pz-hud.low{color:#fca5a5}
@keyframes pz-rb{from{filter:hue-rotate(0deg) saturate(1.5)}to{filter:hue-rotate(360deg) saturate(1.5)}}
.pz-rainbow{animation:pz-rb 9s linear infinite}
@media (prefers-reduced-motion:reduce){.pz-rainbow{animation:none}}
.pz-msg{margin:10px 2px;font-size:calc(.9rem * var(--gfx-font,1));opacity:.95;text-shadow:0 1px 4px rgba(0,0,0,.6)}
`;

const GAME_CSS_ID = 'pz-css';

// ctx: { db, me, view, uid, addCleanup }
export async function puzzelView(ctx, id) {
  const { db, view, addCleanup } = ctx;
  const uid = ctx.uid || (ctx.me && ctx.me.uid) || 'anon';
  const meta = PX.GAMES[id] || { name: id, icon: 'puzzle', tip: '' };
  let alive = true, inst = null, timer = null, pending = null, bgRaf = 0, bgTimer = 0, sceneInst = null, e3d = null;
  let mode = 'menu';           // menu | play | pick | worlds | time | timeover | skins
  let packIdx = 0, tm = null, tmTick = 0, hostW = 360, hostH = 600;
  let play = null;             // { kind: 'main'|'daily'|'extra', n }
  let world = Themes.forGame('puzzel-' + id);
  let prog = R.emptyProgress();
  let msg = '';

  const key = `gs:g:${uid}:${id}`;
  const ref = doc(db, 'gamesaves', `${id}__${uid}`);
  const xKey = `gs:x:${uid}:${id}`;
  const xRef = doc(db, 'gamesaves', `${id}-extra__${uid}`);
  const today = PX.dateKey();

  let g;
  try { g = (await import(`./games/mini/${id}.js?v=2`)).default; }
  catch (e) { console.error(e); view.innerHTML = '<div class="box err">Dit spel kon niet laden. Ververs de pagina en probeer het opnieuw.</div>'; return; }
  if (!alive) return;

  // ---------- opslag: gewone voortgang (zoals voorheen) ----------
  const local = () => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
  const flush = async () => {
    if (!pending) return; const p = pending; pending = null; clearTimeout(timer); timer = null;
    try { await setDoc(ref, { game: id, uid, data: p.data, updated: p.updated }); } catch { pending = p; }
  };
  const mainApi = (hooks) => ({
    w: 360, h: 640,
    score(v) { hooks.score(v); }, end() {},
    async load() {
      let remote = null;
      try { const s = await getDoc(ref); if (s.exists()) remote = s.data(); } catch { /* lokaal gebruiken */ }
      const loc = local(); const pick = loc && (!remote || loc.updated > remote.updated) ? loc : remote;
      hooks.loaded();
      if (!pick || !pick.data) return null;
      try { return JSON.parse(pick.data); } catch { return null; }
    },
    save(o) {
      let d; try { d = JSON.stringify(o); } catch { return; }
      if (d.length > 18000) return;
      const p = { data: d, updated: Date.now() };
      try { localStorage.setItem(key, JSON.stringify(p)); } catch { /* ok */ }
      pending = p; if (!timer) timer = setTimeout(flush, CLOUD_EVERY);
    },
    clear() { pending = null; clearTimeout(timer); timer = null; try { localStorage.removeItem(key); } catch { /* ok */ } deleteDoc(ref).catch(() => {}); },
  });

  // ---------- opslag: extra levels en dagelijkse puzzel ----------
  let xPending = null, xTimer = null;
  const xFlush = async () => {
    if (!xPending) return; const p = xPending; xPending = null; clearTimeout(xTimer); xTimer = null;
    try { await setDoc(xRef, { game: id + '-extra', uid, data: p.data, updated: p.updated }); } catch { xPending = p; }
  };
  function saveProg() {
    let d; try { d = JSON.stringify(prog); } catch { return; }
    const p = { data: d, updated: Date.now() };
    try { localStorage.setItem(xKey, JSON.stringify(p)); } catch { /* ok */ }
    xPending = p; if (!xTimer) xTimer = setTimeout(xFlush, CLOUD_EVERY);
  }
  async function loadProg() {
    let loc = null, remote = null;
    try { loc = JSON.parse(localStorage.getItem(xKey) || 'null'); } catch { /* leeg */ }
    try { const s = await getDoc(xRef); if (s.exists()) remote = s.data(); } catch { /* lokaal */ }
    const pick = loc && (!remote || loc.updated > remote.updated) ? loc : remote;
    if (pick && pick.data) { try { prog = R.cleanProgress(JSON.parse(pick.data)); } catch { /* leeg */ } }
  }

  // ---------- opbouw ----------
  if (!document.getElementById(GAME_CSS_ID)) { const st = document.createElement('style'); st.id = GAME_CSS_ID; st.textContent = CSS; document.head.appendChild(st); }
  view.innerHTML = '<div class="pz-root" id="pz-root"><canvas class="pz-bg" id="pz-bg"></canvas><div class="pz-ui" id="pz-ui"></div></div>';
  const root = view.querySelector('#pz-root'), bg = view.querySelector('#pz-bg'), ui = view.querySelector('#pz-ui');
  const bgc = bg.getContext && bg.getContext('2d');

  function applyWorld() {
    root.style.setProperty('--pz-ac', world.accent);
    root.style.background = world.bg[0];
  }
  function paintBg(ts) {
    if (!alive) return;
    const reduce = GFX.reduce, step = reduce ? 0 : [140, 60, 40][GFX.q] || 60;
    if (bgc && root.clientWidth) {
      const k = [0.35, 0.5, 0.7][GFX.q] || 0.5, w = Math.max(60, Math.round(root.clientWidth * k)), h = Math.max(60, Math.round(root.clientHeight * k));
      if (bg.width !== w || bg.height !== h) { bg.width = w; bg.height = h; }
      try { Themes.paintBackground(bgc, w, h, world, (ts || 0) / 1000); } catch (e) { /* bg mag nooit het spel stoppen */ }
    }
    if (step) bgTimer = setTimeout(() => { bgRaf = requestAnimationFrame(paintBg); }, step);
  }
  function restartBg() { clearTimeout(bgTimer); cancelAnimationFrame(bgRaf); bgRaf = requestAnimationFrame(paintBg); }

  const stars = (n) => '★'.repeat(n);
  const iconBtn = (a, html, label) => `<button class="pz-ib" data-a="${a}" aria-label="${label}" title="${label}">${html}</button>`;
  const tools = () => iconBtn('world', icon('earth', { size: 30 }), 'Kies een wereld') + iconBtn('gear', '⚙️', 'Instellingen');

  function stopScene() { if (sceneInst) { try { sceneInst.stop(); } catch { /* ok */ } sceneInst = null; } }
  function scene(sid, title, sub) {
    stopScene();
    try { sceneInst = Scenes.play(root, sid, { title, sub, theme: world.id }); sceneInst.done.then(() => { sceneInst = null; }); } catch (e) { console.error(e); }
  }

  function stopTick() { if (tmTick) { clearInterval(tmTick); tmTick = 0; } }
  function unmountGame() {
    if (e3d) { try { e3d.stop(); } catch { /* ok */ } e3d = null; }
    try { inst && inst.destroy && inst.destroy(); } catch (e) { console.error(e); }
    inst = null; flush().catch(() => {});
  }

  function setMode(m, pl) {
    unmountGame(); stopScene(); stopTick();
    mode = m; if (pl !== undefined) play = pl;
    if (m === 'menu') renderMenu(); else if (m === 'pick') renderPick(); else if (m === 'worlds') renderWorlds();
    else if (m === 'skins') renderSkins(); else if (m === 'time') renderTime(); else if (m === 'timeover') renderTimeOver(); else renderPlay();
  }

  // ---------- schermen ----------
  const fmtTime = (sec) => { sec = Math.max(0, Math.ceil(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); };
  function renderMenu() {
    const st = R.totalStats(prog), done = prog.d[today], streak = PX.dailyStreak(prog, today);
    const score = R.starScore(prog), rank = R.rankOf(score), sk = R.skinById(prog.sk);
    const into = rank.next ? Math.round(100 * (score - R.RANKS[rank.index].min) / (R.RANKS[rank.index + 1].min - R.RANKS[rank.index].min)) : 100;
    ui.innerHTML = `<div class="pz-head"><div class="pz-title">${icon(meta.icon, { size: 56 })}<div><h2>${meta.name}</h2><small>${meta.tip}</small></div></div><div class="pz-tools">${tools()}</div></div>
      <div class="pz-rank">${icon(rank.icon, { size: 48 })}<div class="pz-rk"><b>${rank.name}</b><small>${stars(1)} ${score} sterren${rank.next ? ` · nog ${rank.toNext} tot ${rank.next}` : ' · hoogste rang!'}</small><i class="pz-pb"><u style="width:${into}%"></u></i></div></div>
      <div class="pz-cards">
        <button class="pz-card main" data-a="main"><span class="ic">${icon(meta.icon, { size: 64 })}</span><span><b>Spelen</b><span class="s">300 levels in 10 werelden en daarna eindeloos</span></span></button>
        <button class="pz-card" data-a="daily"><span class="ic">${icon(done ? 'trophy' : 'gift', { size: 56 })}</span><span><b>Dagelijkse puzzel</b><span class="s">${done ? `Gehaald! ${stars(done)} · reeks ${streak} dag${streak === 1 ? '' : 'en'}` : `Een nieuwe puzzel voor vandaag${streak ? ` · reeks ${streak}` : ''}`}</span></span></button>
        <button class="pz-card" data-a="pick"><span class="ic">${icon('gem', { size: 56 })}</span><span><b>400 extra levels</b><span class="s">4 packs · ${st.done} van 400 gehaald · ${st.stars} van ${st.max} sterren</span></span></button>
        <button class="pz-card" data-a="time"><span class="ic">${icon('hourglass', { size: 56 })}</span><span><b>Tijdrace</b><span class="s">${prog.t.b ? `Record: ${prog.t.b} punten` : 'Los zoveel mogelijk levels op voor de klok afloopt'}${prog.td[today] ? ` · vandaag ${prog.td[today]}` : ''}</span></span></button>
        <button class="pz-card" data-a="skins"><span class="ic">${icon(sk.icon, { size: 56 })}</span><span><b>Huisstijl: ${sk.name}</b><span class="s">Geef je puzzel een nieuwe look · ${R.SKINS.filter((x) => R.skinOpen(x, prog, streak)).length} van ${R.SKINS.length} open</span></span></button>
        <button class="pz-card" data-a="world"><span class="ic">${icon('earth', { size: 56 })}</span><span><b>Wereld: ${world.name}</b><span class="s">Kies een andere achtergrond voor dit spel</span></span></button>
      </div>${msg ? `<p class="pz-msg">${msg}</p>` : ''}`;
  }
  function renderPick() {
    const k = packIdx, pk = R.PACKS[k], ps = R.packStats(prog, k), open = R.packOpen(prog, k), tot = R.totalStats(prog);
    const tabs = R.PACKS.map((x, i) => `<button class="pz-tab ${i === k ? 'on' : ''} ${R.packOpen(prog, i) ? '' : 'lock'}" data-a="pack" data-k="${i}" aria-label="${x.name}">${icon(R.packOpen(prog, i) ? x.icon : 'lock', { size: 30 })}<span>Pak ${i + 1}</span></button>`).join('');
    let body;
    if (!open) {
      const prev = R.packStats(prog, k - 1);
      body = `<p class="pz-msg">Dit pak is nog op slot. Haal eerst ${R.PACK_UNLOCK} levels in Pak ${k} (nu ${prev.done} van ${R.PACK_UNLOCK}).</p>`;
    } else {
      body = `<div class="pz-grid">${Array.from({ length: R.PACK_SIZE }, (_, i) => { const n = k * R.PACK_SIZE + i, sv = R.starsOf(prog, n); return `<button class="pz-lv ${sv ? 'done' : ''}" data-a="extra" data-n="${n}">${i + 1}<small>${stars(sv)}</small></button>`; }).join('')}</div>
      <p class="pz-msg">${ps.perfect ? 'Alles met 3 sterren! Je bent een meester van dit pak.' : 'Deze levels worden bij het spelen gebouwd en zijn altijd op te lossen. Je gewone voortgang blijft zoals die was.'}</p>`;
    }
    ui.innerHTML = `<div class="pz-bar">${iconBtn('menu', '‹', 'Terug')}<b>Extra levels · ${stars(1)} ${tot.stars}/${tot.max}</b>${iconBtn('gear', '⚙️', 'Instellingen')}</div>
      <div class="pz-tabs">${tabs}</div>
      <div class="pz-pane"><h3>${pk.name} · ${ps.stars}/${ps.max} ${stars(1)}</h3>${body}</div>`;
  }
  function renderSkins() {
    const streak = PX.dailyStreak(prog, today);
    ui.innerHTML = `<div class="pz-bar">${iconBtn('menu', '‹', 'Terug')}<b>Kies een huisstijl</b>${iconBtn('gear', '⚙️', 'Instellingen')}</div>
      <div class="pz-pane"><div class="pz-skins">${R.SKINS.map((x) => { const o = R.skinOpen(x, prog, streak); return `<button class="pz-sk ${x.id === prog.sk ? 'on' : ''} ${o ? '' : 'lock'}" style="--sk:${x.ring}" data-a="${o ? 'skin' : 'skinlock'}" data-s="${x.id}">${icon(o ? x.icon : 'lock', { size: 52 })}<b>${x.name}</b><small>${x.id === prog.sk ? 'Gekozen' : o ? 'Tik om te kiezen' : 'Open met ' + R.unlockText(x)}</small></button>`; }).join('')}</div>
      <p class="pz-msg">${msg || 'Een huisstijl geeft je puzzels andere kleuren en een eigen rand. Verdien ze met sterren, een dagelijkse reeks of een tijdrace.'}</p></div>`;
  }
  function renderTime() {
    ui.innerHTML = `<div class="pz-bar">${iconBtn('menu', '‹', 'Terug')}<b>Tijdrace</b>${iconBtn('gear', '⚙️', 'Instellingen')}</div>
      <div class="pz-pane"><h3>${icon('hourglass', { size: 36 })} ${meta.name}</h3>
        <p class="pz-msg">Je hebt ${R.TM_START} seconden. Elk level dat je oplost geeft ${R.TM_BONUS} seconden erbij en punten: sneller en meer sterren is meer punten. De levels worden steeds moeilijker. Vastgelopen? Sla over voor ${R.TM_SKIP} seconden.</p>
        <p class="pz-big">${prog.t.b} <small style="font-size:.4em">punten record</small></p>
        <p class="pz-msg" style="text-align:center">${prog.t.r} race${prog.t.r === 1 ? '' : 's'} gespeeld${prog.td[today] ? ` · vandaag: ${prog.td[today]}` : ''}</p>
        <div class="pz-row">
          <button class="pz-card main" data-a="tstart"><span class="ic">${icon('rocket', { size: 52 })}</span><span><b>Start tijdrace</b><span class="s">Elke keer andere levels</span></span></button>
          <button class="pz-card" data-a="tdaily"><span class="ic">${icon('star', { size: 52 })}</span><span><b>Dagelijkse race</b><span class="s">${prog.td[today] ? `Beste vandaag: ${prog.td[today]}` : 'Voor iedereen dezelfde levels vandaag'}</span></span></button>
        </div></div>`;
  }
  function renderTimeOver() {
    const r = tm || { pts: 0, solved: 0, daily: false, newBest: false };
    ui.innerHTML = `<div class="pz-bar">${iconBtn('time', '‹', 'Terug')}<b>Tijd is om!</b>${iconBtn('gear', '⚙️', 'Instellingen')}</div>
      <div class="pz-pane"><p class="pz-big">${r.pts} punten</p>
        <p class="pz-msg" style="text-align:center">${r.solved} level${r.solved === 1 ? '' : 's'} opgelost${r.newBest ? ' · nieuw record!' : ` · record ${prog.t.b}`}${r.daily ? ' · dagelijkse race' : ''}</p>
        <div class="pz-row"><button class="pz-card main" data-a="${r.daily ? 'tdaily' : 'tstart'}"><span class="ic">${icon('rocket', { size: 52 })}</span><span><b>Nog een keer</b><span class="s">${r.daily ? 'Probeer je dag-score te verbeteren' : 'Nieuwe levels, nieuwe kans'}</span></span></button>
        <button class="pz-card" data-a="menu"><span class="ic">${icon(meta.icon, { size: 52 })}</span><span><b>Naar het menu</b></span></button></div></div>`;
  }
  function renderWorlds() {
    ui.innerHTML = `<div class="pz-bar">${iconBtn('menu', '‹', 'Terug')}<b>Kies een wereld</b>${iconBtn('gear', '⚙️', 'Instellingen')}</div>
      <div class="pz-pane"><div class="pz-worlds">${Themes.list.map((w) => `<button class="pz-w ${w.id === world.id ? 'on' : ''}" data-a="setworld" data-w="${w.id}" style="background:linear-gradient(160deg,${w.bg[0]},${w.bg[w.bg.length - 1]})">${icon(w.deco[0], { size: 40 })}<span>${w.name}</span></button>`).join('')}</div></div>`;
  }
  function renderPlay() {
    const tmode = play.kind === 'time';
    const label = tmode ? `<span class="pz-hud" id="pz-hud"></span>` : play.kind === 'daily' ? `Dagelijkse puzzel · ${today}` : play.kind === 'extra' ? `Extra level ${play.n + 1}` : meta.name;
    ui.innerHTML = `<div class="pz-bar">${iconBtn('back', '‹', tmode ? 'Stop de race' : 'Terug naar het menu')}<b>${label}</b>${iconBtn('hint', icon('lightbulb', { size: 30 }), 'Hint')}${tmode ? iconBtn('skip', '»', `Level overslaan (${R.TM_SKIP} seconden eraf)`) : iconBtn('gear', '⚙️', 'Instellingen')}</div><div class="pz-wrap"><div class="pz-host" id="pz-host"></div></div>`;
    const host = ui.querySelector('#pz-host');
    const vw = view.clientWidth || window.innerWidth || 360;
    const w = Math.min(GFX.q > 0 ? 500 : 440, vw - 16 - 24);
    const h = Math.max(520, Math.min(800, (window.innerHeight || 700) - 190));
    hostW = w; hostH = h;
    host.style.width = w + 'px'; host.style.height = h + 'px';
    const sk = R.skinById(prog.sk);
    root.style.setProperty('--pz-ring', sk.ring);
    try { host.style.filter = R.skinFilter(sk); if (sk.anim && host.classList) host.classList.add('pz-rainbow'); } catch { /* skin mag nooit het spel stoppen */ }
    mountGame(host, w, h);
    if (tmode) { updateHud(); stopTick(); tmTick = setInterval(tickTime, 250); }
  }

  // ---------- tijdrace ----------
  function updateHud() {
    const el = ui.querySelector('#pz-hud'); if (!el || !tm) return;
    el.textContent = `${fmtTime(tm.sec)} · ${tm.pts} p`;
    if (el.classList) { if (tm.sec <= 15) el.classList.add('low'); else el.classList.remove('low'); }
  }
  function tickTime() {
    if (!alive || !tm || tm.over) return stopTick();
    const now = Date.now(), dt = Math.min(1, (now - tm.t) / 1000); tm.t = now;
    if (tm.hold) return;
    tm.sec -= dt; updateHud();
    if (tm.sec <= 0) endTime();
  }
  function startTime(daily) {
    tm = { daily, seed: daily ? today : String(Date.now()), k: 0, solved: 0, pts: 0, sec: R.TM_START, over: false, hold: false, t: Date.now(), newBest: false };
    setMode('play', { kind: 'time', n: R.tmLevel(id, tm.seed, 0) });
  }
  function nextTimeLevel() {
    if (!alive || !tm || tm.over) return;
    tm.hold = false; tm.t = Date.now();
    play.n = R.tmLevel(id, tm.seed, tm.k);
    unmountGame();
    const host = ui.querySelector('#pz-host'); if (!host) return;
    host.innerHTML = ''; mountGame(host, hostW, hostH); updateHud();
  }
  function endTime() {
    if (!tm || tm.over) return;
    tm.over = true; stopTick();
    const r = R.recordTime(prog, tm.pts, tm.daily ? today : null); tm.newBest = r.newBest; saveProg();
    unmountGame(); mode = 'timeover'; renderTimeOver();
    scene(tm.newBest && tm.pts > 0 ? 'victory' : 'levelup', 'Tijd is om!', `${tm.pts} punten · ${tm.solved} level${tm.solved === 1 ? '' : 's'}`);
  }
  function skipTime() {
    if (!tm || tm.over || tm.hold) return;
    tm.sec -= R.TM_SKIP; tm.k++;
    if (tm.sec <= 0) return endTime();
    nextTimeLevel();
  }
  function doHint() {
    const host = ui.querySelector('#pz-host');
    try {
      const bs = host && host.querySelectorAll ? Array.from(host.querySelectorAll('button')) : [];
      const b = bs.find((x) => /\u{1F4A1}/u.test(x.textContent || ''));
      if (b && b.click) { b.click(); return; }
      if (typeof KeyboardEvent !== 'undefined') window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
    } catch (e) { console.error(e); }
  }

  function mountGame(host, w, h) {
    let armed = false, last = 0, curN = play.n | 0, started = false;
    const hooks = {
      loaded() { setTimeout(() => { armed = true; }, 700); },
      score(v) {
        if (!started) { started = true; last = v; return; }
        const prev = last; last = v;
        if (!armed || !(v > prev)) return;
        onDone(prev, v, curN);
      },
    };
    let api;
    if (play.kind === 'main') api = mainApi(hooks);
    else {
      api = {
        w, h, score(v) { hooks.score(v); }, end() {},
        async load() { hooks.loaded(); return R.extraSaveAt(id, play.n); },
        save(o) { const n = R.levelOfSave(id, o); if (n != null) curN = n; },
        clear() {},
      };
    }
    api.w = w; api.h = h;
    try { inst = g.create(host, api); } catch (e) { console.error(e); host.innerHTML = '<div style="padding:1rem;color:#fff">Dit spel wil nu niet starten.</div>'; return; }
    try { e3d = attach3D(host, { scale: 1.1 }); } catch { e3d = null; }
  }

  function onDone(prev, v, n) {
    if (!alive || !play) return;
    const s = PX.starsFromScoreDelta(prev, v);
    if (play.kind === 'time') {
      if (!tm || tm.over || tm.hold) return;
      tm.hold = true; const pts = R.tmPoints(s, tm.sec); tm.pts += pts; tm.solved++; tm.sec = R.tmAfterSolve(tm.sec); tm.k++; updateHud();
      scene('victory', 'Opgelost!', `+${pts} punten · ${stars(s)}`);
      setTimeout(nextTimeLevel, 1300);
    } else if (play.kind === 'daily') {
      const first = !prog.d[today]; PX.recordDaily(prog, today, s); saveProg();
      const streak = PX.dailyStreak(prog, today);
      scene(first ? 'daily-bonus' : 'victory', first ? 'Dagelijkse puzzel!' : 'Opgelost!', first ? `Reeks: ${streak} dag${streak === 1 ? '' : 'en'}` : stars(s));
    } else if (play.kind === 'extra') {
      const before = R.packStats(prog, R.packOf(n)); R.recordLevel(prog, n, s); saveProg();
      const after = R.packStats(prog, R.packOf(n));
      if (after.perfect && !before.perfect) scene('levelup', 'Pak perfect!', `${R.PACKS[R.packOf(n)].name} · alles 3 sterren`);
      else scene('victory', 'Level klaar!', `Extra level ${n + 1} · ${stars(s)}`);
    } else {
      const m = PX.milestone(prev, v);
      if (m === 'wereld') scene('victory', 'Wereld-mijlpaal!', `${v} sterren verzameld`);
      else if (m === 'mijlpaal') scene('levelup', 'Mijlpaal!', `${v} sterren`);
    }
  }

  // ---------- kliks ----------
  const onClick = (e) => {
    const b = e.target.closest && e.target.closest('[data-a]'); if (!b || !ui.contains(b)) return;
    const a = b.dataset.a;
    if (a === 'main') setMode('play', { kind: 'main', n: 0 });
    else if (a === 'daily') setMode('play', { kind: 'daily', n: PX.dailyIndex(id, today) });
    else if (a === 'pick') setMode('pick');
    else if (a === 'pack') { packIdx = Math.max(0, Math.min(R.PACKS.length - 1, +b.dataset.k || 0)); renderPick(); }
    else if (a === 'extra') { const n = Math.max(0, Math.min(R.TOTAL_X - 1, +b.dataset.n || 0)); packIdx = R.packOf(n); setMode('play', { kind: 'extra', n }); }
    else if (a === 'time') setMode('time');
    else if (a === 'tstart') startTime(false);
    else if (a === 'tdaily') startTime(true);
    else if (a === 'skins') { msg = ''; setMode('skins'); }
    else if (a === 'skin') { const sk = R.skinById(b.dataset.s); prog.sk = sk.id; saveProg(); msg = `Huisstijl ${sk.name} gekozen.`; renderSkins(); msg = ''; }
    else if (a === 'skinlock') { const sk = R.skinById(b.dataset.s); msg = `${sk.name} gaat open met ${R.unlockText(sk)}.`; renderSkins(); msg = ''; }
    else if (a === 'hint') doHint();
    else if (a === 'skip') skipTime();
    else if (a === 'menu') { msg = ''; setMode('menu'); }
    else if (a === 'back') { if (play && play.kind === 'time') { tm = null; setMode('time'); } else setMode(play && play.kind === 'extra' ? 'pick' : 'menu'); }
    else if (a === 'world') setMode(mode === 'worlds' ? 'menu' : 'worlds');
    else if (a === 'setworld') { const w = Themes.world(b.dataset.w); Themes.setForGame('puzzel-' + id, w.id); world = w; applyWorld(); restartBg(); renderWorlds(); }
    else if (a === 'gear') openSettingsPanel({ title: 'Instellingen ' + meta.name });
  };
  view.addEventListener('click', onClick);
  const offSettings = Settings.onChange ? Settings.onChange(() => { if (alive) restartBg(); }) : null;

  addCleanup(() => {
    alive = false; stopTick(); clearTimeout(bgTimer); cancelAnimationFrame(bgRaf);
    view.removeEventListener('click', onClick); if (offSettings) offSettings();
    stopScene(); unmountGame(); xFlush().catch(() => {});
    const st = document.getElementById(GAME_CSS_ID); if (st) st.remove();
  });

  applyWorld(); restartBg();
  renderMenu();
  loadProg().then(() => { if (alive && mode === 'menu') renderMenu(); }).catch(() => {});
}
