// Gedeelde UI-hulpjes voor de gereedschaps-apps Rekenen, Tijd, Kompas en Weer.
// Stijlen (prefix .tu-), opslag (local-first + gamesaves), canvas-lus, ⚙-knop en scene-afspelen.
import { icon, drawIcon } from './gfx/art.js?v=1';
import { Settings, GFX } from './gfx/settings.js?v=1';
import { openSettingsPanel } from './gfx/panel.js?v=1';
import { Scenes } from './gfx/scenes.js?v=1';
import { Themes } from './gfx/themes.js?v=1';

export { icon, drawIcon, Settings, GFX, Themes, Scenes };

const FS_URL = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const CSS = `
.tu{--tu-s:var(--gfx-scale,1);--tu-f:var(--gfx-font,1);font-size:calc(1rem * var(--tu-f));}
.tu *{box-sizing:border-box}
.tu-top{display:flex;align-items:center;gap:.5rem;margin:.2rem 0 .5rem}
.tu-top h2{margin:0;flex:1;font-size:calc(1.35rem * var(--tu-f))}
.tu-gear{min-width:calc(48px * var(--tu-s));min-height:calc(48px * var(--tu-s));border-radius:14px;font-size:1.3rem;padding:0}
.tu-tabs{display:flex;gap:.45rem;overflow-x:auto;padding:.2rem 0 .5rem;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.tu-tabs::-webkit-scrollbar{display:none}
.tu-tab{flex:none;display:flex;align-items:center;gap:.4rem;min-height:calc(50px * var(--tu-s));padding:.3rem .9rem;border-radius:16px;font-weight:700;white-space:nowrap}
.tu-tab.on{background:var(--accent);border-color:var(--accent);color:#fff}
.tu-card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:calc(1rem * var(--tu-s));margin:.7rem 0;box-shadow:0 2px 10px rgba(0,0,0,.06)}
html[data-gfx-q="1"] .tu-card,html[data-gfx-q="2"] .tu-card{box-shadow:0 6px 22px rgba(0,0,0,.1)}
.tu-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(150px * var(--tu-s)),1fr));gap:.7rem}
.tu-tile{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.25rem;text-align:center;min-height:calc(120px * var(--tu-s));padding:.8rem .5rem;border-radius:20px;border:1px solid var(--line);background:var(--card);font-weight:700;position:relative;transition:transform .12s}
.tu-tile:active{transform:scale(.96)}
.tu-tile small{font-weight:500;opacity:.75}
.tu-big{min-height:calc(56px * var(--tu-s));font-size:calc(1.1rem * var(--tu-f));border-radius:16px;padding:.5rem 1.1rem;font-weight:700}
.tu-row{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}
.tu-bar{height:10px;border-radius:99px;background:var(--line);overflow:hidden}
.tu-bar>i{display:block;height:100%;background:var(--accent);border-radius:99px;transition:width .4s}
.tu-chip{display:inline-flex;align-items:center;gap:.3rem;padding:.2rem .65rem;border-radius:99px;background:var(--line);font-size:.85rem;font-weight:600}
.tu-hero{position:relative;border-radius:24px;overflow:hidden;color:#fff;background:#334}
.tu-hero canvas{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:0}
.tu-hero>.tu-in{position:relative;z-index:1;padding:calc(1.1rem * var(--tu-s))}
.tu-in-lbl{display:block;font-size:.85rem;opacity:.75;margin-bottom:.15rem}
.tu-inp{width:100%;padding:.7rem .8rem;border:1px solid var(--line);border-radius:14px;font:inherit;font-size:calc(1.05rem * var(--tu-f));background:var(--card);color:inherit;min-height:calc(48px * var(--tu-s))}
.tu-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:.45rem}
.tu-pad button{min-height:calc(58px * var(--tu-s));font-size:calc(1.5rem * var(--tu-f));font-weight:800;border-radius:16px;padding:0}
.tu-ok{color:#16a34a}.tu-bad{color:#dc2626}
@keyframes tu-pop{0%{transform:scale(.7);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
@keyframes tu-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}
.tu-pop{animation:tu-pop .35s ease-out}.tu-shake{animation:tu-shake .3s}
html[data-reduce="1"] .tu-pop,html[data-reduce="1"] .tu-shake{animation:none}
@media (prefers-reduced-motion:reduce){.tu-pop,.tu-shake{animation:none}}
`;

export function injectCss(id = 'tu-css', css = CSS) {
  const d = globalThis.document; if (!d) return;
  try { if (d.getElementById && d.getElementById(id)) return; const s = d.createElement('style'); s.id = id; s.textContent = css; (d.head || d.documentElement).appendChild(s); } catch { /* stil */ }
}

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const pad2 = (n) => String(n).padStart(2, '0');
export const escHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** De bovenbalk met titel en ⚙-knop (HTML). Binden met bindGear(root). */
export function topBar(title, iconName) {
  return `<div class="tu-top">${iconName ? icon(iconName, { size: 40 }) : ''}<h2>${escHtml(title)}</h2><button class="tu-gear" data-gear aria-label="Instellingen">⚙</button></div>`;
}
export function bindGear(root, title = 'Instellingen') {
  const b = root.querySelector && root.querySelector('[data-gear]');
  if (b) b.onclick = () => { try { openSettingsPanel({ title, toast: () => {} }); } catch { /* stil */ } };
}
export function tabsHtml(tabs, cur) {
  return `<div class="tu-tabs" role="tablist">${tabs.map(([k, l, ic]) => `<button class="tu-tab ${k === cur ? 'on' : ''}" role="tab" data-tab="${k}">${ic ? icon(ic, { size: 26 }) : ''}<span>${escHtml(l)}</span></button>`).join('')}</div>`;
}

/**
 * Local-first opslag. localStorage `key`, en (als db+uid) gamesaves/<game>__<uid> = {game,uid,data(<=20000),updated}.
 * get() -> object; set(obj); update(fn). Cloud: max 1x per 20 s (debounce) en bij sluiten met flush().
 */
export function makeStore({ key, game, uid, db, def = {}, max = 19000 }) {
  let data = null, upd = 0, timer = null, dirty = false;
  const read = () => { try { const o = JSON.parse(localStorage.getItem(key) || 'null'); return o && typeof o === 'object' ? o : null; } catch { return null; } };
  const loc = read();
  data = loc ? loc.d || {} : {}; upd = loc ? loc.u || 0 : 0;
  data = Object.assign(structuredCloneSafe(def), data);
  const writeLocal = () => { try { localStorage.setItem(key, JSON.stringify({ d: data, u: upd })); } catch { /* stil */ } };
  async function push() {
    timer = null; if (!db || !uid || !dirty) return; dirty = false;
    try {
      const fs = await import(FS_URL); let s = JSON.stringify(data);
      if (s.length > max) { s = JSON.stringify(trim(data)); }
      if (s.length > 20000) return;
      await fs.setDoc(fs.doc(db, 'gamesaves', `${game}__${uid}`), { game, uid, data: s, updated: upd });
    } catch { /* stil: best effort */ }
  }
  const api = {
    get: () => data,
    set(o) { data = o; upd = Date.now(); writeLocal(); dirty = true; if (!timer && db && uid) timer = setTimeout(push, 20000); },
    update(fn) { const r = fn(data); api.set(data); return r; },
    async sync() {
      if (!db || !uid) return false;
      try {
        const fs = await import(FS_URL);
        const snap = await fs.getDoc(fs.doc(db, 'gamesaves', `${game}__${uid}`));
        if (snap.exists()) {
          const d = snap.data();
          if (d && typeof d.data === 'string' && (d.updated || 0) > upd) { try { data = Object.assign(structuredCloneSafe(def), JSON.parse(d.data)); upd = d.updated; writeLocal(); return true; } catch { /* stil */ } }
        }
        if (upd) { dirty = true; push(); }
      } catch { /* stil */ }
      return false;
    },
    flush() { if (timer) { clearTimeout(timer); timer = null; } return push(); },
  };
  return api;
}
function structuredCloneSafe(o) { return JSON.parse(JSON.stringify(o)); }
// te grote saves: houd arrays van geschiedenis kort
function trim(d) {
  const c = structuredCloneSafe(d);
  for (const k of Object.keys(c)) if (Array.isArray(c[k]) && c[k].length > 30) c[k] = c[k].slice(-30);
  return c;
}

/** Canvas met resolutie naar kwaliteit + animatielus. draw(ctx,w,h,t,dt). Geeft {cv,stop,resize}. */
export function makeCanvas(host, draw, { fps = 60, onResize } = {}) {
  const cv = document.createElement('canvas'); host.appendChild(cv);
  const ctx = cv.getContext('2d');
  let w = 0, h = 0, raf = 0, last = 0, t0 = 0, stopped = false, acc = 0;
  const resize = () => {
    const nw = Math.max(1, host.clientWidth || 300), nh = Math.max(1, host.clientHeight || 200), d = GFX.dpr || 1;
    if (nw === w && nh === h && cv.width === Math.round(nw * d)) return;
    w = nw; h = nh; cv.width = Math.round(w * d); cv.height = Math.round(h * d);
    if (ctx.setTransform) ctx.setTransform(d, 0, 0, d, 0, 0);
    onResize && onResize(w, h);
  };
  const frame = (now) => {
    if (stopped) return;
    if (!cv.isConnected && cv.isConnected !== undefined) { stopped = true; return; }
    raf = requestAnimationFrame(frame);
    if (!t0) { t0 = now; last = now; }
    const dt = Math.min(0.06, (now - last) / 1000); acc += dt; last = now;
    if (fps < 60 && acc < 1 / fps - 0.002) return;
    const step = acc; acc = 0;
    resize();
    try { draw(ctx, w, h, (now - t0) / 1000, step); } catch (e) { stopped = true; throw e; }
  };
  raf = requestAnimationFrame(frame);
  return { cv, ctx, stop() { stopped = true; try { cancelAnimationFrame(raf); } catch { /* stil */ } }, resize, get w() { return w; }, get h() { return h; } };
}

/** Speel een scène als overlay op host (valt stil terug bij fouten). */
export function playScene(host, id, opts = {}) {
  try { return Scenes.play(host || document.body, id, opts); } catch { return { stop() {}, done: Promise.resolve() }; }
}

/** Geschiedenis-veilige toast. */
export function toast(root, text, ms = 2200) {
  try {
    const t = document.createElement('div'); t.textContent = text;
    t.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#111c;color:#fff;padding:.7rem 1.1rem;border-radius:99px;z-index:9998;font-weight:700;max-width:90vw;text-align:center';
    document.body.appendChild(t); setTimeout(() => { try { t.remove(); } catch { /* stil */ } }, ms);
  } catch { /* stil */ }
}
