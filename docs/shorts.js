// Shorts: verticale filmpjes-feed (TikTok-stijl) met 300 korte Blender-filmpjes.
// Entry: shortsView(ctx) met ctx = { db, me, esc, nice, uid, view, addCleanup }.
// Opslag: local-first (localStorage shorts:state:<uid>), cloud gespaard in gamesaves/shorts-state__<uid> = {game,uid,data,updated}.
import { icon } from './gfx/art.js?v=1';
import { Settings, GFX } from './gfx/settings.js?v=1';
import { openSettingsPanel } from './gfx/panel.js?v=1';
import { CATS, CAT, buildFeed, createStore, createLazy, createAudioSync, dataMode, fmtMB, filterList, VOL_DEFAULT } from './shorts-logic.js?v=1';

const FS_URL = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const VIDEO_BASE = new URL('shorts/', import.meta.url).href;
const EMPTY_SOON = 12; // onder dit aantal: "er komen er nog meer!"

const CSS = `
.sh{--sh-s:var(--gfx-scale,1);--sh-f:var(--gfx-font,1);position:relative;height:calc(100dvh - 130px);min-height:360px;background:#05060d;color:#fff;border-radius:18px;overflow:hidden;font:calc(16px * var(--sh-f))/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;isolation:isolate}
.sh *{box-sizing:border-box}
.sh button{font:inherit;color:inherit;cursor:pointer;-webkit-appearance:none;appearance:none}
.sh-feed{position:absolute;inset:0;overflow-y:scroll;overflow-x:hidden;scroll-snap-type:y mandatory;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;scrollbar-width:none}
.sh-feed::-webkit-scrollbar{display:none}
.sh-item{position:relative;height:100%;scroll-snap-align:start;scroll-snap-stop:always;display:flex;align-items:center;justify-content:center;background:radial-gradient(120% 90% at 50% 40%,#1b1f3a 0%,#05060d 70%)}
.sh-stage{position:relative;height:100%;max-width:100%;aspect-ratio:9/16;background:#0b0d1c;overflow:hidden;touch-action:pan-y}
.sh-poster,.sh-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;pointer-events:none}
.sh-video{opacity:0;transition:opacity .25s}
.sh-video.on{opacity:1}
.sh-shade{position:absolute;left:0;right:0;bottom:0;height:42%;background:linear-gradient(transparent,rgba(0,0,0,.72));pointer-events:none}
.sh-info{position:absolute;left:14px;right:calc(88px * var(--sh-s));bottom:calc(26px * var(--sh-s));pointer-events:none;text-shadow:0 2px 8px rgba(0,0,0,.7)}
.sh-info b{display:block;font-size:calc(1.3em);line-height:1.2;margin-bottom:6px}
.sh-cat{display:inline-flex;align-items:center;gap:6px;padding:3px 10px 3px 5px;border-radius:99px;background:rgba(255,255,255,.18);font-size:.85em;font-weight:700;margin-right:6px}
.sh-tag{display:inline-block;font-size:.85em;opacity:.85;margin-right:8px}
.sh-bar{position:absolute;left:0;right:0;bottom:0;height:calc(22px * var(--sh-s));touch-action:none;cursor:pointer}
.sh-bar::before{content:"";position:absolute;left:0;right:0;bottom:0;height:5px;background:rgba(255,255,255,.22)}
.sh-bar i{position:absolute;left:0;bottom:0;height:5px;width:100%;transform:scaleX(0);transform-origin:left;background:var(--gfx-accent,#a78bfa)}
html[data-gfx-q="2"] .sh-bar i{box-shadow:0 0 12px var(--gfx-accent,#a78bfa)}
.sh-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;transition:opacity .15s}
.sh-play span{width:calc(92px * var(--sh-s));height:calc(92px * var(--sh-s));border-radius:50%;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font-size:calc(44px * var(--sh-s));padding-left:6px}
.sh-item.paused .sh-play{opacity:1}
.sh-heart{position:absolute;width:0;height:0;pointer-events:none;z-index:5}
.sh-heart>*{position:absolute;left:0;top:0;transform:translate(-50%,-50%) scale(0);animation:sh-pop .85s cubic-bezier(.2,1.4,.4,1) forwards}
.sh-heart .big{animation-name:sh-pop}
.sh-heart .sm{animation:sh-fly .9s ease-out forwards}
.sh-heart .glow{width:260px;height:260px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,80,120,.7),transparent);animation:sh-glow .8s ease-out forwards}
@keyframes sh-pop{0%{transform:translate(-50%,-50%) scale(0) rotate(-20deg);opacity:0}25%{transform:translate(-50%,-50%) scale(1.25) rotate(8deg);opacity:1}55%{transform:translate(-50%,-55%) scale(1) rotate(0)}100%{transform:translate(-50%,-190%) scale(.9);opacity:0}}
@keyframes sh-fly{0%{transform:translate(-50%,-50%) scale(.2);opacity:1}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1) rotate(var(--r));opacity:0}}
@keyframes sh-glow{0%{transform:translate(-50%,-50%) scale(.2);opacity:1}100%{transform:translate(-50%,-50%) scale(1.5);opacity:0}}
html[data-reduce="1"] .sh-heart>*{animation-duration:.5s}
html[data-reduce="1"] .sh-heart .sm,html[data-reduce="1"] .sh-heart .glow{display:none}
html[data-reduce="1"] .sh-heart .big{animation-name:sh-fade}
@keyframes sh-fade{0%{opacity:0;transform:translate(-50%,-50%) scale(1)}30%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(1)}}

.sh-top{position:absolute;left:0;right:0;top:0;z-index:10;padding:8px 8px 18px;background:linear-gradient(rgba(0,0,0,.65),transparent);pointer-events:none}
.sh-top>*{pointer-events:auto}
.sh-tools{display:flex;gap:8px;align-items:center;margin-bottom:8px}
.sh-tool{min-width:calc(48px * var(--sh-s));min-height:calc(48px * var(--sh-s));padding:0 14px;border:0;border-radius:99px;background:rgba(255,255,255,.16);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap}
.sh-tool[aria-pressed=true]{background:var(--gfx-accent,#6366f1);box-shadow:0 0 0 2px rgba(255,255,255,.55) inset}
.sh-tool.sq{padding:0;width:calc(48px * var(--sh-s))}
.sh-sp{flex:1}
.sh-chips{display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px}
.sh-chips::-webkit-scrollbar{display:none}
.sh-chip{flex:none;min-height:calc(46px * var(--sh-s));padding:0 14px 0 8px;border:2px solid transparent;border-radius:99px;background:rgba(255,255,255,.14);display:inline-flex;align-items:center;gap:6px;font-weight:700;white-space:nowrap}
.sh-chip[aria-pressed=true]{background:#fff;color:#111;border-color:var(--gfx-accent,#a78bfa)}
.sh-chip em{font-style:normal;font-size:.8em;opacity:.7;font-weight:600}
.sh-search{display:none;margin-bottom:8px}
.sh-search.open{display:flex;gap:8px}
.sh-search input{flex:1;min-height:calc(48px * var(--sh-s));border-radius:99px;border:0;padding:0 16px;font:inherit;background:#fff;color:#111;-webkit-user-select:text;user-select:text;min-width:0}

.sh-side{position:absolute;right:8px;bottom:calc(40px * var(--sh-s));z-index:9;display:flex;flex-direction:column;gap:14px;align-items:center}
.sh-act{display:flex;flex-direction:column;align-items:center;gap:2px;border:0;background:none;padding:0;min-width:64px;text-shadow:0 1px 6px rgba(0,0,0,.8);font-size:.78em;font-weight:700}
.sh-act .b{width:calc(60px * var(--sh-s));height:calc(60px * var(--sh-s));border-radius:50%;background:rgba(0,0,0,.38);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;font-size:calc(30px * var(--sh-s));transition:transform .12s}
.sh-act:active .b{transform:scale(.88)}
.sh-act.fav .b img,.sh-act.fav .b span{opacity:.5;filter:grayscale(1)}
.sh-act.fav.on .b img,.sh-act.fav.on .b span{opacity:1;filter:none}
.sh-act.fav.on .b{background:rgba(255,60,110,.35);box-shadow:0 0 0 2px rgba(255,120,150,.8) inset}
.sh-act.snd .b{font-size:calc(28px * var(--sh-s))}
.sh-act.snd.on .b{background:rgba(99,102,241,.45);box-shadow:0 0 0 2px rgba(165,180,252,.8) inset}
.sh-act.snd.na .b span,.sh-act.snd.na .b{opacity:.55}
.sh-range{width:100%;min-height:calc(44px * var(--sh-s));accent-color:var(--gfx-accent,#a78bfa)}
.sh-count{position:absolute;left:10px;bottom:calc(30px * var(--sh-s));z-index:9;font-size:.78em;opacity:.75;pointer-events:none;text-shadow:0 1px 4px #000}

.sh-banner{position:absolute;left:8px;right:8px;top:calc(124px * var(--sh-s));z-index:11;display:none;gap:10px;align-items:center;padding:10px 12px;border-radius:14px;background:rgba(250,204,21,.95);color:#222;font-size:.9em;font-weight:600}
.sh-banner.show{display:flex}
.sh-banner button{flex:none;min-width:44px;min-height:44px;border:0;border-radius:12px;background:rgba(0,0,0,.12)}
.sh-toast{position:absolute;left:50%;bottom:calc(90px * var(--sh-s));transform:translateX(-50%);z-index:20;padding:10px 18px;border-radius:99px;background:rgba(0,0,0,.8);font-weight:700;opacity:0;transition:opacity .2s;pointer-events:none;white-space:nowrap;max-width:92%}
.sh-toast.show{opacity:1}

.sh-card{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px;padding:90px 28px 40px;max-width:520px}
.sh-card h2{margin:0;font-size:calc(1.7em)}
.sh-card p{margin:0;opacity:.85;font-size:1.05em}
.sh-card .big{animation:sh-bob 2.4s ease-in-out infinite}
html[data-reduce="1"] .sh-card .big{animation:none}
@keyframes sh-bob{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-14px) rotate(4deg)}}
.sh-cta{min-height:calc(56px * var(--sh-s));padding:0 26px;border:0;border-radius:99px;background:var(--gfx-accent,#6366f1);font-weight:800;font-size:1.05em}
.sh-card .dots{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}

.sh-sheet-back{position:absolute;inset:0;z-index:30;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center}
.sh-sheet{width:min(520px,100%);max-height:88%;overflow:auto;background:#161a33;border-radius:22px 22px 0 0;padding:16px 16px 26px;-webkit-user-select:text;user-select:text}
.sh-sheet h2{margin:0 0 4px;font-size:1.3em}
.sh-sheet h3{margin:16px 0 8px;font-size:.85em;text-transform:uppercase;letter-spacing:.06em;opacity:.65}
.sh-opts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.sh-opt{min-height:calc(54px * var(--sh-s));border:2px solid rgba(255,255,255,.18);border-radius:14px;background:rgba(255,255,255,.07);font-weight:700;padding:6px}
.sh-opt[aria-pressed=true]{border-color:var(--gfx-accent,#a78bfa);background:rgba(167,139,250,.25)}
.sh-sheet small{opacity:.7;display:block;margin-top:6px}
.sh-wide{width:100%;margin-top:12px}
@media (min-width:700px){.sh{height:calc(100dvh - 110px)}.sh-sheet-back{align-items:center}.sh-sheet{border-radius:22px}}
@media (prefers-reduced-motion:reduce){.sh-card .big{animation:none}}
`;

export async function shortsView(ctx) {
  const view = ctx.view;
  const esc = ctx.esc || ((s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const uid = ctx.uid || (ctx.me && ctx.me.uid) || 'anon';
  const cleanups = [];
  let alive = true;
  const addCleanup = (f) => cleanups.push(f);
  if (ctx.addCleanup) ctx.addCleanup(() => { alive = false; cleanups.splice(0).reverse().forEach((f) => { try { f(); } catch { /* */ } }); });

  const styleEl = document.createElement('style'); styleEl.textContent = CSS; document.head.appendChild(styleEl);
  addCleanup(() => styleEl.remove());
  view.innerHTML = '<div class="sh"><div class="sh-card" style="margin:auto;height:100%"><div class="big">' + icon('hourglass', { size: 96 }) + '</div><h2>Shorts laden…</h2></div></div>';

  // ---- filmlijst (index.js wordt door tools/make-shorts-index.py gemaakt en groeit)
  let ALL = [];
  try { ALL = (await import('./shorts/index.js?t=' + Math.floor(Date.now() / 300000))).SHORTS || []; } catch { ALL = []; }
  if (!alive) return;

  // ---- opslag (cloud lui laden)
  let fsMod = null; const fsP = import(FS_URL).then((m) => (fsMod = m)).catch(() => null);
  const cloud = ctx.db ? {
    db: ctx.db, doc: (db, ...p) => ({ db, p }),
    getDoc: async (r) => { const m = fsMod || (await fsP); if (!m) throw new Error('offline'); return m.getDoc(m.doc(r.db, ...r.p)); },
    setDoc: async (r, d) => { const m = fsMod || (await fsP); if (!m) throw new Error('offline'); return m.setDoc(m.doc(r.db, ...r.p), d); },
  } : null;
  const store = createStore(uid, { cloud });
  addCleanup(() => { store.flush(); store.destroy(); });
  const pageHide = () => store.flush();
  window.addEventListener('pagehide', pageHide); addCleanup(() => window.removeEventListener('pagehide', pageHide));
  store.loadCloud(); // bijwerken op de achtergrond; favorieten/opties lezen we live uit store.state

  // ---- UI-staat
  let cat = 'all', q = '', feed = [], cur = 0, userPaused = false, dm = dataMode(navigator, store.state.opt.data), bannerShut = false;
  let loadedKB = 0; const loadedIds = new Set(); const loadedAudio = new Set(); const sessionSeen = new Set();
  let blocked = false, docHidden = false, rootHidden = false;
  let seenTimer = null, raf = 0, itemH = 0;

  view.innerHTML = `<div class="sh">
    <div class="sh-feed" tabindex="-1"></div>
    <div class="sh-top">
      <div class="sh-tools">
        <button class="sh-tool sq" data-a="search" aria-label="Zoeken">🔍</button>
        <button class="sh-tool" data-a="random" aria-pressed="false">${icon('dice', { size: 28 })}<span>Willekeurig</span></button>
        <button class="sh-tool" data-a="mix" aria-pressed="false">${icon('puzzle', { size: 28 })}<span>Mix</span></button>
        <span class="sh-sp"></span>
        <button class="sh-tool" data-a="opts"><span>Opties</span></button>
        <button class="sh-tool sq" data-a="gfx" aria-label="Instellingen">⚙️</button>
      </div>
      <div class="sh-search"><input type="search" placeholder="Zoek op titel of tag…" enterkeyhint="search" autocomplete="off" aria-label="Zoeken"><button class="sh-tool sq" data-a="clear" aria-label="Wissen">✕</button></div>
      <div class="sh-chips" role="tablist"></div>
    </div>
    <div class="sh-banner" role="status"><span></span><button data-a="bannerx" aria-label="Sluiten">✕</button></div>
    <div class="sh-side">
      <button class="sh-act fav" data-a="fav" aria-label="Favoriet"><span class="b">${icon('heart', { size: 40 })}</span><span>Favoriet</span></button>
      <button class="sh-act snd" data-a="sound" aria-label="Geluid aan" aria-pressed="false"><span class="b">🔇</span><span>Geluid</span></button>
      <button class="sh-act" data-a="next" aria-label="Volgende"><span class="b">⌄</span><span>Volgende</span></button>
      <button class="sh-act" data-a="share" aria-label="Delen"><span class="b">${icon('gift', { size: 38 })}</span><span>Delen</span></button>
    </div>
    <div class="sh-count"></div>
    <div class="sh-toast" role="status"></div>
  </div>`;
  const root = view.querySelector('.sh'), feedEl = root.querySelector('.sh-feed'), chipsEl = root.querySelector('.sh-chips');
  const searchWrap = root.querySelector('.sh-search'), searchIn = searchWrap.querySelector('input');
  const banner = root.querySelector('.sh-banner'), toastEl = root.querySelector('.sh-toast'), countEl = root.querySelector('.sh-count');
  const favBtn = root.querySelector('[data-a=fav]');
  const reduce = () => !!(GFX && GFX.reduce);
  const q0 = () => (GFX && GFX.q) || 0;

  // ---- geluid: één Audio-element voor het huidige filmpje, gelijk met de stille <video> (zie createAudioSync in shorts-logic.js)
  const sndBtn = root.querySelector('[data-a=sound]');
  const snd = createAudioSync({
    base: VIDEO_BASE,
    createAudio: () => new Audio(),
    onBlocked: () => { blocked = true; syncSoundBtn(); },
    onLoad: (it) => { if (it && !loadedAudio.has(it.id)) { loadedAudio.add(it.id); loadedKB += it.ak || 30; updateBanner(); } },
  });
  snd.setVolume(store.state.opt.vol == null ? VOL_DEFAULT : store.state.opt.vol);
  addCleanup(() => snd.destroy());
  function syncSoundBtn() {
    const on = !!store.state.opt.sound && !blocked, o = curItem();
    sndBtn.querySelector('.b').textContent = on ? '🔊' : '🔇';
    sndBtn.classList.toggle('on', on); sndBtn.classList.toggle('na', !(o && snd.has(o.it)));
    sndBtn.setAttribute('aria-pressed', String(on)); sndBtn.setAttribute('aria-label', on ? 'Geluid uit' : 'Geluid aan');
  }
  function audioTarget() { const o = curItem(); snd.setTarget(o && o.video ? o.it : null, o && o.video ? o.video : null); syncSoundBtn(); }
  function setSound(on) { // in een tik-handler aanroepen (iOS laat audio alleen na een tik starten)
    store.setOpt({ sound: !!on }); blocked = false; snd.setEnabled(!!on); syncSoundBtn();
    const o = curItem();
    toast(on ? (o && !snd.has(o.it) ? 'Geluid aan (dit filmpje heeft nog geen geluid)' : 'Geluid aan') : 'Geluid uit');
  }

  let toastT = 0;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 1800); }
  addCleanup(() => clearTimeout(toastT));

  // hoogte van de root: tot onderaan het scherm
  function fit() {
    const top = root.getBoundingClientRect().top;
    const h = Math.max(360, Math.floor((window.innerHeight || 700) - Math.max(0, top) - 10));
    root.style.height = h + 'px';
    itemH = feedEl.clientHeight;
  }
  fit(); window.addEventListener('resize', fit); addCleanup(() => window.removeEventListener('resize', fit));

  // ---- chips
  function counts() {
    const fav = new Set(store.state.fav);
    let nf = 0, nn = 0; const per = {};
    for (const it of ALL) { if (fav.has(it.id)) nf++; if (!store.views(it.id)) nn++; per[it.c] = (per[it.c] || 0) + 1; }
    return { all: ALL.length, fav: nf, new: nn, per };
  }
  function renderChips() {
    const c = counts();
    const defs = [{ id: 'all', name: 'Alles', icon: 'star', n: c.all }, { id: 'fav', name: 'Favorieten', icon: 'heart', n: c.fav }, { id: 'new', name: 'Nieuw', icon: 'gift', n: c.new }]
      .concat(CATS.map((k) => ({ id: k.id, name: k.name, icon: k.icon, n: c.per[k.id] || 0 })));
    chipsEl.innerHTML = defs.map((d) => `<button class="sh-chip" role="tab" data-cat="${d.id}" aria-pressed="${d.id === cat}">${icon(d.icon, { size: 30 })}<span>${esc(d.name)}</span><em>${d.n}</em></button>`).join('');
  }
  function syncTools() {
    const o = store.state.opt;
    root.querySelector('[data-a=random]').setAttribute('aria-pressed', String(o.order === 'random'));
    root.querySelector('[data-a=mix]').setAttribute('aria-pressed', String(!!o.mix));
  }

  // ---- feed opbouwen
  const items = []; // { kind:'v', it, el, stage, video, poster, bar } | { kind:'end'|'empty', el }
  function emptyCard() {
    if (!ALL.length) return { icon: 'hourglass', h: 'De filmpjes worden gemaakt!', p: 'Er komen heel veel korte filmpjes aan. Kom straks nog eens terug.' };
    if (q.trim()) return { icon: 'magnet', h: 'Niets gevonden', p: `Geen filmpje voor “${q.trim()}”. Probeer een ander woord.` };
    if (cat === 'fav') return { icon: 'heart', h: 'Nog geen favorieten', p: 'Tik twee keer op een filmpje of tik op het hartje om het te bewaren.' };
    if (cat === 'new') return { icon: 'trophy', h: 'Alles gezien!', p: 'Je hebt alle filmpjes al bekeken. Er komen er straks vast nog meer!' };
    return { icon: 'hourglass', h: 'Hier is nog niets', p: 'Er komen er nog meer! Kijk later nog eens.' };
  }
  function endCard(n) {
    const few = ALL.length < EMPTY_SOON;
    return { icon: few ? 'rocket' : 'trophy', h: few ? 'Er komen er nog meer!' : 'Dat was het voor nu!', p: few ? `Dit zijn er ${n} tot nu toe. Er worden nog veel meer filmpjes gemaakt, kom snel terug.` : 'Je bent onderaan. Terug naar boven of kies een andere categorie.' };
  }
  const cardHTML = (c, cta) => `<div class="sh-card"><div class="big">${icon(c.icon, { size: 120 })}</div><h2>${esc(c.h)}</h2><p>${esc(c.p)}</p>${cta ? '<button class="sh-cta" data-a="top">Terug naar boven</button>' : ''}</div>`;

  const lazyV = createLazy({ radius: 1, attach: attachVideo, detach: detachVideo });
  const lazyP = createLazy({ radius: 3, attach: attachPoster, detach: detachPoster });

  function stopAll() { snd.setTarget(null, null); lazyV.clear(); lazyP.clear(); clearTimeout(seenTimer); }
  function rebuild() {
    stopAll(); items.length = 0; feedEl.innerHTML = ''; feedEl.scrollTop = 0; cur = 0; userPaused = false;
    const list = buildFeed(ALL, { cat, q }, store);
    const frag = document.createDocumentFragment();
    if (!list.length) {
      const el = document.createElement('section'); el.className = 'sh-item'; el.innerHTML = cardHTML(emptyCard(), false); frag.appendChild(el); items.push({ kind: 'empty', el });
    } else {
      list.forEach((it) => {
        const el = document.createElement('section'); el.className = 'sh-item';
        el.innerHTML = `<div class="sh-stage"><div class="sh-shade"></div><div class="sh-play"><span>▶</span></div>
          <div class="sh-info"><b>${esc(it.t)}</b><span class="sh-cat">${icon((CAT[it.c] || {}).icon || 'star', { size: 24 })}${esc((CAT[it.c] || { name: it.c }).name)}</span>${(it.tags || []).slice(0, 3).map((t) => `<span class="sh-tag">#${esc(t)}</span>`).join('')}</div>
          <div class="sh-bar" aria-hidden="true"><i></i></div><div class="sh-heart"></div></div>`;
        frag.appendChild(el);
        items.push({ kind: 'v', it, el, stage: el.firstChild, video: null, poster: null, bar: el.querySelector('.sh-bar i') });
      });
      const el = document.createElement('section'); el.className = 'sh-item'; el.innerHTML = cardHTML(endCard(list.length), true); frag.appendChild(el); items.push({ kind: 'end', el });
    }
    feedEl.appendChild(frag);
    itemH = feedEl.clientHeight;
    renderChips(); syncTools(); updateSide();
    setCurrent(0, true);
  }

  // ---- video's lui laden: alleen huidig +-1 heeft src (zuinig: alleen huidig); posters +-3
  const posterUrl = (it) => VIDEO_BASE + it.id + '.jpg';
  const videoUrl = (it) => VIDEO_BASE + it.id + '.mp4';
  function attachPoster(i) {
    const o = items[i]; if (!o || o.kind !== 'v' || o.poster) return;
    const img = document.createElement('img'); img.className = 'sh-poster'; img.alt = ''; img.decoding = 'async'; img.draggable = false; img.src = posterUrl(o.it);
    o.stage.insertBefore(img, o.stage.firstChild); o.poster = img;
  }
  function detachPoster(i) { const o = items[i]; if (!o || !o.poster) return; o.poster.remove(); o.poster = null; }
  function attachVideo(i) {
    const o = items[i]; if (!o || o.kind !== 'v' || o.video) return;
    const v = document.createElement('video');
    v.className = 'sh-video'; v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.autoplay = false; v.controls = false;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', ''); v.setAttribute('disablepictureinpicture', ''); v.setAttribute('x-webkit-airplay', 'deny');
    v.preload = dm.zuinig ? 'metadata' : 'auto'; v.poster = posterUrl(o.it);
    v.addEventListener('playing', () => v.classList.add('on'));
    v.addEventListener('error', () => { v.classList.remove('on'); });
    v.src = videoUrl(o.it);
    o.stage.insertBefore(v, o.stage.querySelector('.sh-shade')); o.video = v;
    if (!loadedIds.has(o.it.id)) { loadedIds.add(o.it.id); loadedKB += o.it.kb || 300; updateBanner(); }
    if (i === cur) { audioTarget(); playCurrent(); }
  }
  function detachVideo(i) {
    const o = items[i]; if (!o || !o.video) return;
    if (i === cur) snd.setTarget(null, null);
    const v = o.video; o.video = null;
    try { v.pause(); } catch { /* */ } v.removeAttribute('src'); try { v.load(); } catch { /* */ } v.remove();
  }
  function curItem() { const o = items[cur]; return o && o.kind === 'v' ? o : null; }
  function playCurrent() {
    const o = curItem(); if (!o || !o.video || userPaused || document.hidden) return;
    let p; try { p = o.video.play(); } catch { p = null; }
    if (p && p.catch) p.catch(() => { o.el.classList.add('paused'); }); // iOS (spaarstand) blokkeert autoplay: dan staat er een ▶
    else o.el.classList.remove('paused');
    if (p && p.then) p.then(() => { if (alive && items[cur] === o && !userPaused) o.el.classList.remove('paused'); }).catch(() => {});
  }
  function pauseAllVideos() { for (const o of items) if (o.video) { try { o.video.pause(); } catch { /* */ } } }
  function setPaused(on) {
    const o = curItem(); if (!o) return;
    userPaused = on; o.el.classList.toggle('paused', on);
    if (on) { if (o.video) try { o.video.pause(); } catch { /* */ } } else playCurrent();
  }

  function setCurrent(i, force) {
    i = Math.max(0, Math.min(items.length - 1, i));
    if (i === cur && !force) return;
    const prev = items[cur]; if (prev && prev.video && cur !== i) { try { prev.video.pause(); } catch { /* */ } }
    if (prev) prev.el.classList.remove('paused');
    cur = i; userPaused = false;
    dm = dataMode(navigator, store.state.opt.data); lazyV.setRadius(dm.zuinig ? 0 : 1); snd.setZuinig(dm.zuinig);
    lazyV.move(cur, items.length); lazyP.move(cur, items.length);
    pauseOthers(); audioTarget(); playCurrent();
    const o = curItem();
    clearTimeout(seenTimer);
    if (o) {
      seenTimer = setTimeout(() => { if (!alive || curItem() !== o || sessionSeen.has(o.it.id)) return; sessionSeen.add(o.it.id); store.markSeen(o.it.id); renderChipsKeepScroll(); }, 1500);
      if (o.video && o.video.currentTime > 0.05) { try { o.video.currentTime = 0; } catch { /* */ } }
    }
    updateSide();
  }
  function pauseOthers() { items.forEach((o, k) => { if (k !== cur && o.video) { try { o.video.pause(); } catch { /* */ } } }); }
  function renderChipsKeepScroll() { const x = chipsEl.scrollLeft; renderChips(); chipsEl.scrollLeft = x; }
  function updateSide() {
    const o = curItem();
    favBtn.classList.toggle('on', !!(o && store.isFav(o.it.id)));
    favBtn.style.visibility = o ? '' : 'hidden'; root.querySelector('[data-a=share]').style.visibility = o ? '' : 'hidden';
    const n = items.filter((x) => x.kind === 'v').length;
    countEl.textContent = o ? `${cur + 1} / ${n}` : '';
    syncSoundBtn();
  }

  // ---- scrollen
  let scrollRaf = 0;
  feedEl.addEventListener('scroll', () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; const h = feedEl.clientHeight || itemH || 1; setCurrent(Math.round(feedEl.scrollTop / h)); });
  }, { passive: true });
  addCleanup(() => { if (scrollRaf) cancelAnimationFrame(scrollRaf); });
  function goTo(i) {
    i = Math.max(0, Math.min(items.length - 1, i));
    const h = feedEl.clientHeight || itemH;
    try { feedEl.scrollTo({ top: i * h, behavior: reduce() ? 'auto' : 'smooth' }); } catch { feedEl.scrollTop = i * h; }
  }

  // ---- hartje
  function burstHeart(o, x, y) {
    const box = o.el.querySelector('.sh-heart'); if (!box) return;
    box.style.left = x + 'px'; box.style.top = y + 'px';
    const wrap = document.createElement('div'); wrap.style.cssText = 'position:absolute;left:0;top:0';
    let html = '';
    if (q0() >= 1 && !reduce()) html += '<div class="glow"></div>';
    html += '<div class="big">' + icon('heart', { size: 150 }) + '</div>';
    if (!reduce()) {
      const n = GFX && GFX.particles ? Math.min(14, Math.round(GFX.particles(6))) : 4;
      for (let k = 0; k < n; k++) {
        const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 110;
        const nm = k % 3 === 0 ? 'star' : 'heart';
        html += `<div class="sm" style="--dx:${Math.round(Math.cos(a) * d)}px;--dy:${Math.round(Math.sin(a) * d - 60)}px;--r:${Math.round(Math.random() * 60 - 30)}deg">${icon(nm, { size: 28 + Math.round(Math.random() * 16) })}</div>`;
      }
    }
    wrap.innerHTML = html; box.appendChild(wrap);
    setTimeout(() => wrap.remove(), 1100);
  }
  function like(o, x, y) {
    if (!o) return;
    const was = store.isFav(o.it.id);
    store.setFav(o.it.id, true);
    burstHeart(o, x, y); updateSide(); if (!was) renderChipsKeepScroll();
  }

  // ---- tik / dubbel tik
  let lastTap = { t: 0, x: 0, y: 0 };
  feedEl.addEventListener('click', (e) => {
    const stage = e.target.closest && e.target.closest('.sh-stage'); if (!stage) return;
    if (e.target.closest('.sh-bar')) return;
    const o = items[cur]; if (!o || o.kind !== 'v' || o.stage !== stage) return;
    const r = stage.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top;
    const t = Date.now();
    if (t - lastTap.t < 320 && Math.hypot(x - lastTap.x, y - lastTap.y) < 60) { // dubbel: pauze terugdraaien + hartje
      lastTap.t = 0;
      if (userPaused) setPaused(false);
      like(o, x, y);
    } else {
      lastTap = { t, x, y };
      setPaused(!userPaused);
    }
  });
  feedEl.addEventListener('dblclick', (e) => e.preventDefault());

  // ---- voortgangsbalk (+ scrubben)
  function frame() {
    raf = requestAnimationFrame(frame);
    const o = curItem(); if (!o || !o.video) return;
    snd.tick();
    const v = o.video; if (v.duration > 0) o.bar.style.transform = 'scaleX(' + Math.min(1, v.currentTime / v.duration).toFixed(4) + ')';
  }
  raf = requestAnimationFrame(frame); addCleanup(() => cancelAnimationFrame(raf));
  let scrubbing = false;
  function scrub(e) {
    const o = curItem(); if (!o || !o.video || !(o.video.duration > 0)) return;
    const r = o.bar.parentNode.getBoundingClientRect(); const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    try { o.video.currentTime = f * o.video.duration; } catch { /* */ }
  }
  feedEl.addEventListener('pointerdown', (e) => { if (e.target.closest && e.target.closest('.sh-bar')) { scrubbing = true; try { e.target.setPointerCapture(e.pointerId); } catch { /* */ } scrub(e); e.preventDefault(); } });
  feedEl.addEventListener('pointermove', (e) => { if (scrubbing) scrub(e); });
  const endScrub = () => { scrubbing = false; };
  feedEl.addEventListener('pointerup', endScrub); feedEl.addEventListener('pointercancel', endScrub);

  // ---- zichtbaarheid: pauzeren als het tabblad of de app uit beeld is
  const onVis = () => { docHidden = document.hidden; snd.setHidden(docHidden || rootHidden); if (document.hidden) pauseAllVideos(); else playCurrent(); };
  document.addEventListener('visibilitychange', onVis); addCleanup(() => document.removeEventListener('visibilitychange', onVis));
  if (typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver((es) => { for (const en of es) { rootHidden = !en.isIntersecting || en.intersectionRatio < 0.2; snd.setHidden(docHidden || rootHidden); if (rootHidden) pauseAllVideos(); else playCurrent(); } }, { threshold: [0, 0.2, 0.5] });
    io.observe(root); addCleanup(() => io.disconnect());
  }
  addCleanup(() => { stopAll(); pauseAllVideos(); snd.setTarget(null, null); });

  // ---- banner (mobiele data)
  function updateBanner() {
    const show = dm.zuinig && !bannerShut && ALL.length > 0;
    banner.classList.toggle('show', show);
    if (show) {
      const why = dm.reason === 'mobiel' ? 'Je zit op mobiele data' : dm.reason === 'databesparing' ? 'Databesparing staat aan' : dm.reason === 'traag' ? 'Je verbinding is traag' : 'Zuinige modus staat aan';
      banner.firstChild.textContent = `${why}: we laden maar één filmpje tegelijk. Tot nu toe ±${fmtMB(loadedKB)}.`;
    }
  }
  const conn = navigator.connection;
  if (conn && conn.addEventListener) { const f = () => { dm = dataMode(navigator, store.state.opt.data); lazyV.setRadius(dm.zuinig ? 0 : 1); snd.setZuinig(dm.zuinig); lazyV.move(cur, items.length); updateBanner(); }; conn.addEventListener('change', f); addCleanup(() => conn.removeEventListener('change', f)); }

  // ---- opties-sheet
  function openOpts() {
    const o = store.state.opt;
    const back = document.createElement('div'); back.className = 'sh-sheet-back';
    const seg = (name, cur2, defs) => `<div class="sh-opts" data-seg="${name}">${defs.map(([v, l]) => `<button class="sh-opt" data-v="${v}" aria-pressed="${String(cur2) === String(v)}">${l}</button>`).join('')}</div>`;
    back.innerHTML = `<div class="sh-sheet" role="dialog" aria-modal="true" aria-label="Shorts-opties"><h2>Shorts-opties</h2>
      <h3>Volgorde</h3>${seg('order', o.order, [['nieuw', 'Nieuw eerst'], ['id', 'Op nummer'], ['random', 'Willekeurig']])}
      <h3>Mix van categorieën</h3>${seg('mix', o.mix, [[true, 'Afwisselen'], [false, 'Los']])}
      <h3>Data</h3>${seg('data', o.data, [['auto', 'Automatisch'], ['zuinig', 'Altijd zuinig'], ['normaal', 'Normaal']])}
      <small>Zuinig = één filmpje tegelijk laden, zonder het geluid vooraf te laden. Automatisch let op mobiele data. Deze sessie ±${fmtMB(loadedKB)}.</small>
      <h3>Geluid</h3>${seg('sound', !!o.sound, [[true, '🔊 Aan'], [false, '🔇 Uit']])}
      <input class="sh-range" type="range" min="0" max="100" step="5" value="${Math.round((o.vol == null ? VOL_DEFAULT : o.vol) * 100)}" aria-label="Volume" data-vol>
      <small>Standaard uit. Op iPhone/iPad regel je het volume met de knoppen van het apparaat.</small>
      <button class="sh-cta sh-wide" data-a="gfx2">Beeld en effecten…</button>
      <button class="sh-opt sh-wide" data-a="close">Sluiten</button></div>`;
    root.appendChild(back);
    const close = () => back.remove();
    const vol = back.querySelector('[data-vol]');
    if (vol) {
      vol.addEventListener('input', () => snd.setVolume(Number(vol.value) / 100));
      vol.addEventListener('change', () => store.setOpt({ vol: Number(vol.value) / 100 }));
    }
    back.addEventListener('click', (e) => {
      if (e.target === back || (e.target.closest && e.target.closest('[data-a=close]'))) return close();
      if (e.target.closest && e.target.closest('[data-a=gfx2]')) { close(); return openGfx(); }
      const b = e.target.closest && e.target.closest('.sh-opt[data-v]'); if (!b) return;
      const name = b.parentNode.getAttribute('data-seg'); let v = b.getAttribute('data-v');
      if (name === 'mix' || name === 'sound') v = v === 'true';
      store.setOpt({ [name]: v });
      b.parentNode.querySelectorAll('.sh-opt').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      if (name === 'sound') { blocked = false; snd.setEnabled(v); syncSoundBtn(); }
      else if (name === 'data') { dm = dataMode(navigator, v); lazyV.setRadius(dm.zuinig ? 0 : 1); snd.setZuinig(dm.zuinig); lazyV.move(cur, items.length); updateBanner(); }
      else { syncTools(); rebuild(); }
    });
  }
  function openGfx() { try { openSettingsPanel({ title: 'Instellingen', toast }); } catch { toast('Instellingen niet beschikbaar'); } }

  // ---- delen
  async function share() {
    const o = curItem(); if (!o) return;
    const url = videoUrl(o.it);
    try {
      if (navigator.share) { await navigator.share({ title: o.it.t, text: o.it.t + ' - kijk dit filmpje!', url }); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(url); toast('Link gekopieerd'); return; }
      toast('Delen kan hier niet');
    } catch { /* geannuleerd */ }
  }

  // ---- knoppen
  root.addEventListener('click', (e) => {
    const chip = e.target.closest && e.target.closest('.sh-chip');
    if (chip) { cat = chip.getAttribute('data-cat'); rebuild(); return; }
    const b = e.target.closest && e.target.closest('[data-a]'); if (!b) return;
    const a = b.getAttribute('data-a');
    if (a === 'search') { searchWrap.classList.toggle('open'); if (searchWrap.classList.contains('open')) searchIn.focus(); else if (q) { q = ''; searchIn.value = ''; rebuild(); } }
    else if (a === 'clear') { q = ''; searchIn.value = ''; searchWrap.classList.remove('open'); rebuild(); }
    else if (a === 'random') { const o = store.state.opt; store.setOpt({ order: o.order === 'random' ? 'nieuw' : 'random' }); toast(store.state.opt.order === 'random' ? 'Willekeurig aan' : 'Nieuwe eerst'); rebuild(); }
    else if (a === 'mix') { store.setOpt({ mix: !store.state.opt.mix }); toast(store.state.opt.mix ? 'Mix aan' : 'Mix uit'); rebuild(); }
    else if (a === 'sound') setSound(!store.state.opt.sound);
    else if (a === 'opts') openOpts();
    else if (a === 'gfx') openGfx();
    else if (a === 'bannerx') { bannerShut = true; updateBanner(); }
    else if (a === 'fav') { const o = curItem(); if (o) { const on = store.toggleFav(o.it.id); toast(on ? 'Bewaard bij favorieten' : 'Uit favorieten'); updateSide(); renderChipsKeepScroll(); } }
    else if (a === 'next') goTo(cur + 1);
    else if (a === 'share') share();
    else if (a === 'top') goTo(0);
  });
  let st = 0;
  searchIn.addEventListener('input', () => { clearTimeout(st); st = setTimeout(() => { q = searchIn.value; rebuild(); }, 250); });
  addCleanup(() => clearTimeout(st));

  const onKey = (e) => {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === 'ArrowDown' || e.key === 'j') { goTo(cur + 1); e.preventDefault(); }
    else if (e.key === 'ArrowUp' || e.key === 'k') { goTo(cur - 1); e.preventDefault(); }
    else if (e.key === ' ') { setPaused(!userPaused); e.preventDefault(); }
    else if (e.key === 'l') { const o = curItem(); if (o) like(o, 180, 300); }
    else if (e.key === 'm') setSound(!store.state.opt.sound);
  };
  window.addEventListener('keydown', onKey); addCleanup(() => window.removeEventListener('keydown', onKey));

  // grafische instellingen (schaal/lettergrootte) kunnen veranderen: opnieuw passen
  const offS = Settings.onChange(() => { fit(); });
  addCleanup(() => { if (typeof offS === 'function') offS(); });

  rebuild(); updateBanner();
  if (store.state.opt.sound) { // eerder aangezet: proberen te starten; lukt dat niet zonder tik (iOS), dan ontgrendelt de eerste tik
    snd.setEnabled(true);
    const unlock = () => { root.removeEventListener('pointerup', unlock, true); root.removeEventListener('click', unlock, true); if (store.state.opt.sound) { blocked = false; snd.setEnabled(true); syncSoundBtn(); } };
    root.addEventListener('pointerup', unlock, true); root.addEventListener('click', unlock, true);
    addCleanup(() => { root.removeEventListener('pointerup', unlock, true); root.removeEventListener('click', unlock, true); });
  }
  if (ALL.length && ALL.length < EMPTY_SOON) toast('Er komen er nog meer!');
}
