// Gedeelde bouwstenen voor Agenda, Gewoontes, Klusjes, Vraag en Chat: stijl, kop met ⚙, tabs, scènes, opslag.
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { icon } from './gfx/art.js?v=1';
import { GFX } from './gfx/settings.js?v=1';
import { openSettingsPanel } from './gfx/panel.js?v=1';
import { Scenes } from './gfx/scenes.js?v=1';
import { makeStore } from './appstore.js';

export { icon as ic };

const CSS = `
.ak{--s:var(--gfx-scale,1);--f:var(--gfx-font,1);font-size:calc(1rem*var(--f))}
.ak *{box-sizing:border-box}
.ak-head{display:flex;align-items:center;gap:.7rem;padding:calc(.9rem*var(--s)) calc(1rem*var(--s));margin:.2rem 0 .8rem;border-radius:22px;color:#fff;background:linear-gradient(135deg,var(--ak1,#6366f1),var(--ak2,#a855f7));position:relative;overflow:hidden}
html[data-gfx-q="1"] .ak-head,html[data-gfx-q="2"] .ak-head{box-shadow:0 8px 22px -8px var(--ak1,#6366f1)}
.ak-head:after{content:"";position:absolute;right:-30px;top:-40px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.14)}
.ak-head .t{flex:1;min-width:0}.ak-head b{font-size:1.25em;display:block}.ak-head small{opacity:.9}
.ak-head button{background:rgba(255,255,255,.22);border:0;color:#fff;border-radius:14px;min-width:44px;min-height:44px;font-size:1.2rem;z-index:1}
.ak-tabs{display:flex;gap:.4rem;overflow-x:auto;padding:.1rem .1rem .5rem;margin:0 -.1rem;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.ak-tabs::-webkit-scrollbar{display:none}
.ak-tab{flex:0 0 auto;display:flex;align-items:center;gap:.35rem;min-height:calc(46px*var(--s));padding:.4rem calc(.9rem*var(--s));border-radius:99px;font-weight:600;white-space:nowrap}
.ak-tab.on{background:var(--accent);border-color:var(--accent);color:#fff}
.ak-card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:calc(1rem*var(--s));margin:.7rem 0}
html[data-gfx-q="1"] .ak-card,html[data-gfx-q="2"] .ak-card{box-shadow:0 6px 18px -10px rgba(0,0,0,.35)}
.ak-card h3{margin:.1rem 0 .5rem;font-size:1.1em}
.ak-big{min-height:calc(48px*var(--s));font-size:1.02em;border-radius:14px;padding:.5rem 1rem}
.ak-grid{display:grid;gap:.5rem}
.ak-chips{display:flex;flex-wrap:wrap;gap:.4rem}
.ak-chip{display:inline-flex;align-items:center;gap:.3rem;padding:.25rem .7rem;border-radius:99px;background:var(--line);font-size:.85em}
.ak-chip.on{background:var(--accent);color:#fff}
.ak-bar{height:12px;background:var(--line);border-radius:9px;overflow:hidden}
.ak-bar>div{height:100%;background:var(--accent);border-radius:9px;transition:width .5s}
.ak-pick{display:flex;flex-wrap:wrap;gap:.35rem}
.ak-pick button{min-width:calc(46px*var(--s));min-height:calc(46px*var(--s));padding:.25rem;display:flex;align-items:center;justify-content:center;font-size:1.3rem}
.ak-pick button.sel{outline:3px solid var(--accent);outline-offset:1px}
.ak-ov{position:fixed;inset:0;z-index:9000;background:#000}
.ak-toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#111c;color:#fff;padding:.6rem 1rem;border-radius:99px;z-index:9100;font-size:.9rem;max-width:90vw}
.ak textarea,.ak select{font:inherit;color:inherit;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:.6rem .75rem}
.ak .mute{color:var(--mute)}
.ak .pop{animation:ak-pop .35s ease-out}
@keyframes ak-pop{0%{transform:scale(.7);opacity:0}70%{transform:scale(1.08)}100%{transform:none;opacity:1}}
html[data-reduce="1"] .ak .pop{animation:none}
@media (prefers-reduced-motion:reduce){.ak .pop{animation:none}}
`;

export function injectKit() {
  if (typeof document === 'undefined' || document.getElementById('ak-css')) return;
  const s = document.createElement('style'); s.id = 'ak-css'; s.textContent = CSS; (document.head || document.documentElement).appendChild(s);
}

// Kop met icoon, titel, ondertitel en ⚙-knop. Kleuren via c1/c2.
export function head({ icon: ic = 'star', title, sub = '', c1, c2, extra = '' }) {
  const st = c1 ? ` style="--ak1:${c1};--ak2:${c2 || c1}"` : '';
  return `<div class="ak-head"${st}>${icon(ic, { size: 52 })}<div class="t"><b>${title}</b><small>${sub}</small></div>${extra}<button data-ak-set aria-label="Instellingen">⚙️</button></div>`;
}
export function wireHead(root, toast) {
  const b = root.querySelector('[data-ak-set]');
  if (b) b.onclick = () => openSettingsPanel({ title: 'Instellingen', toast: toast || ((m) => showToast(m)) });
}
export function tabsHtml(cur, list) {
  return `<div class="ak-tabs" role="tablist">${list.map(([k, l, ic]) => `<button role="tab" class="ak-tab ${k === cur ? 'on' : ''}" data-tab="${k}">${ic ? icon(ic, { size: 24 }) : ''}${l}</button>`).join('')}</div>`;
}

let toastEl = null, toastT = null;
export function showToast(msg) {
  if (typeof document === 'undefined') return;
  if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'ak-toast'; document.body.appendChild(toastEl); }
  toastEl.textContent = msg; toastEl.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(() => { toastEl.style.display = 'none'; }, 2600);
}

// Speel een scène (victory, levelup, chest-open, coins-rain, ...) schermvullend; tik = overslaan.
export function playScene(id, opts = {}) {
  try {
    if (typeof document === 'undefined') return Promise.resolve();
    const host = document.createElement('div'); host.className = 'ak-ov'; document.body.appendChild(host);
    const r = Scenes.play(host, id, { title: opts.title || '', sub: opts.sub || '', w: window.innerWidth, h: window.innerHeight, ...opts });
    const end = () => { try { host.remove(); } catch (e) { /* weg */ } };
    return Promise.resolve(r.done).then(end, end);
  } catch (e) { return Promise.resolve(); }
}

// Opslag per app: lokaal + gamesaves/<game>__<uid> (geknepen).
export function appStore(ctx, game, defaults) {
  const { db, me } = ctx; const id = `${game}__${me.uid}`;
  return makeStore({
    game, uid: me.uid, defaults, ls: localStorage,
    cloudGet: async () => { const s = await getDoc(doc(db, 'gamesaves', id)); const d = s.exists() ? s.data() : null; return d && typeof d.data === 'string' ? d : null; },
    cloudSet: (data, updated) => setDoc(doc(db, 'gamesaves', id), { game, uid: me.uid, data, updated }),
  });
}

export const reduced = () => !!GFX.reduce;
export const q = () => GFX.q;
