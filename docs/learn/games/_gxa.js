// Gedeelde grafische hulpjes voor de spellen klassiek, toren, baas, race, vissen, vlag, pizza, monster en regen.
// Wereld-achtergrond (canvas achter de DOM), 3D-iconen als element/HTML/canvas, kwaliteit-bewuste deeltjes en een instellingen-knop.
// Alles ruimt zichzelf op (rAF, <style>), en werkt ook zonder DOM/canvas (tests).
import { Themes } from '../../gfx/themes.js?v=1';
import { GFX } from '../../gfx/settings.js?v=1';
import { icon, drawIcon } from '../../gfx/art.js?v=1';
import { Particles, softShadow, glow, hexA, mix } from '../../gfx/fx.js?v=1';
import { openSettingsPanel } from '../../gfx/panel.js?v=1';

export { Themes, GFX, drawIcon, softShadow, glow, hexA, mix, Particles };

const E = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

/* ---------- kwaliteit & wereld ---------- */
export const qOf = (env) => { const g = (env && env.gfx) || GFX; return g.q == null ? 1 : g.q; };
export const reduceOf = (env) => { const g = (env && env.gfx) || GFX; return !!g.reduce; };
export function worldOf(env, gameId) {
  if (env && env.world && env.world.bg) return env.world;
  try { return Themes.forGame(gameId); } catch { return { id: 'bos', name: 'Bos', bg: ['#a7f3d0', '#86efac', '#fef9c3'], accent: '#16a34a', ground: '#2f7d32', deco: ['tree', 'flower'], mood: 'light' }; }
}
export const isDark = (w) => w && w.mood === 'dark';
// Kleurenpalet afgeleid van de wereld (voor spellen die zelf tegels/vlakken tekenen).
export function palette(w) {
  const g = w.ground || '#4d7c0f', dark = isDark(w);
  return {
    a: g, b: mix(g, dark ? '#ffffff' : '#000000', dark ? 0.08 : 0.1), path: mix(g, dark ? '#ffffff' : '#fff7e0', dark ? 0.35 : 0.55), pathEdge: mix(g, '#000000', 0.45),
    sky: w.bg[0], sky2: w.bg[w.bg.length - 1], accent: w.accent, text: dark ? '#f8fafc' : '#1e293b', dark,
  };
}

/* ---------- iconen ---------- */
// HTML-string / element met een 3D-icoon (emoji als fallback als de naam niet bestaat).
export function ic(name, size = 28, cls = '') { return name ? icon(name, { size, cls: 'gx-ic ' + cls, alt: '' }) : ''; }
export function iel(name, size = 28, cls = '') { const s = E('span', 'gx-ie ' + cls); s.innerHTML = ic(name, size); return s; }
// Canvas: icoon met zachte schaduw (q>0), x,y = midden. fb = emoji-fallback als de naam niet bestaat.
export function di(ctx, name, x, y, size, o = {}) {
  if (o.shadow !== false && (o.q == null ? GFX.q : o.q) > 0 && size >= 14) softShadow(ctx, x, y + size * 0.42, size * 0.36, size * 0.08, 0.28);
  drawIcon(ctx, name, x, y, size, o);
}

/* ---------- CSS (gedeeld, teller zodat <style> netjes verdwijnt) ---------- */
const CSS = `
.gx-root{position:relative;isolation:isolate}
.gx-bg{position:absolute;left:0;top:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block;border-radius:inherit}
.gx-fxc{position:absolute;left:0;top:0;width:100%;height:100%;z-index:30;pointer-events:none}
.gx-ie{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;line-height:1}
.gx-ic{filter:drop-shadow(0 2px 2px rgba(0,0,0,.28))}
.gx-q0 .gx-ic{filter:none}
.gx-q2 .gx-ic{filter:drop-shadow(0 4px 4px rgba(0,0,0,.34))}
.gx-glass{background:color-mix(in srgb,var(--card) 90%,transparent);border:1px solid var(--line);border-radius:calc(16px*var(--gfx-scale,1))}
.gx-gear{width:calc(44px*var(--gfx-scale,1));height:calc(44px*var(--gfx-scale,1));min-width:44px;min-height:44px;border-radius:14px;border:1px solid var(--line);background:color-mix(in srgb,var(--card) 90%,transparent);color:var(--ink);font:inherit;font-size:calc(20px*var(--gfx-font,1));cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0}
.gx-gear:active{transform:scale(.94)}
.gx-reduce *{animation-duration:.01ms!important;animation-iteration-count:1!important}
`;
let cssUsers = 0, cssEl = null;
export function useCss() {
  if (cssUsers++ === 0) { cssEl = document.createElement('style'); cssEl.setAttribute('data-learn-g', 'gxa'); cssEl.textContent = CSS; document.head.appendChild(cssEl); }
  let freed = false;
  return () => { if (freed) return; freed = true; if (--cssUsers === 0 && cssEl) { cssEl.remove(); cssEl = null; } };
}

/* ---------- wereld-achtergrond ---------- */
// attachWorld(root, env, gameId, o) -> { world, setWorld(w), repaint(), destroy() }
// Zet class gx-root (+ gx-q<n>) op root, voegt <canvas class="gx-bg"> als eerste kind toe en tekent Themes.paintBackground
// (Normaal ~14 fps op halve resolutie, Hoog ~24, Ultra ~30; bij 'minder beweging' eenmalig). Past CSS-variabelen --gx-accent/--gx-ink aan.
export function attachWorld(root, env, gameId, o = {}) {
  const rel = useCss();
  let world = worldOf(env, gameId), dead = false, raf = 0, lastPaint = -1e9, cw = 0, ch = 0, dirty = true;
  const cv = E('canvas', 'gx-bg');
  const ctx = cv.getContext ? cv.getContext('2d') : null;
  root.classList.add('gx-root');
  if (root.firstChild) root.insertBefore(cv, root.firstChild); else root.appendChild(cv);
  function vars() {
    const q = qOf(env);
    root.classList.remove('gx-q0', 'gx-q1', 'gx-q2'); root.classList.add('gx-q' + q);
    if (reduceOf(env)) root.classList.add('gx-reduce'); else root.classList.remove('gx-reduce');
    if (root.style && root.style.setProperty) { root.style.setProperty('--gx-accent', world.accent); root.style.setProperty('--gx-bg1', world.bg[0]); root.style.setProperty('--gx-bg2', world.bg[world.bg.length - 1]); }
  }
  function size() {
    const w = root.clientWidth || (env && env.w) || 360, h = root.clientHeight || (env && env.h) || 600;
    const q = qOf(env), sc = q === 0 ? 0.5 : q === 1 ? 0.75 : Math.min(GFX.dpr || 1, 1.5);
    const nw = Math.max(40, Math.round(w * sc)), nh = Math.max(40, Math.round(h * sc));
    if (nw !== cw || nh !== ch) { cw = nw; ch = nh; cv.width = cw; cv.height = ch; dirty = true; }
  }
  function paint(t) {
    if (!ctx) return;
    try { size(); ctx.setTransform(1, 0, 0, 1, 0, 0); Themes.paintBackground(ctx, cw, ch, world, t); } catch { /* achtergrond is bijzaak */ }
    dirty = false;
  }
  function loop(ts) {
    raf = 0; if (dead) return;
    if (root.isConnected !== false) {
      const now = (typeof performance !== 'undefined' ? performance.now() : ts || 0), q = qOf(env), red = reduceOf(env);
      const gap = red ? 1500 : [70, 42, 33][q];
      if (dirty || now - lastPaint >= gap) { if (red && !dirty && now - lastPaint < 1500) { /* stil */ } else { lastPaint = now; paint(red ? 3 : now / 1000); } }
    }
    raf = requestAnimationFrame(loop);
  }
  // roots met overflow:auto scrollen: houd de achtergrond vast aan het zichtbare deel
  const onScroll = () => { try { cv.style.transform = 'translate(' + (root.scrollLeft || 0) + 'px,' + (root.scrollTop || 0) + 'px)'; } catch { /* stil */ } };
  if (root.addEventListener) root.addEventListener('scroll', onScroll, { passive: true });
  vars(); paint(3);
  raf = requestAnimationFrame(loop);
  return {
    get world() { return world; },
    setWorld(w) { if (w && w.bg) { world = w; vars(); dirty = true; } },
    repaint() { dirty = true; vars(); },
    destroy() { dead = true; if (raf) cancelAnimationFrame(raf); raf = 0; if (root.removeEventListener) root.removeEventListener('scroll', onScroll); cv.remove(); rel(); },
  };
}

/* ---------- deeltjes-laag ---------- */
// fxLayer(root, env) -> { burst(x,y,kind,n,opts), burstEl(el,kind,n), destroy() }; x,y in px t.o.v. de root.
export function fxLayer(root, env) {
  const parts = new Particles();
  const cv = E('canvas', 'gx-fxc');
  root.appendChild(cv);
  const ctx = cv.getContext ? cv.getContext('2d') : null;
  let raf = 0, last = 0, dead = false;
  const onScroll = () => { try { cv.style.transform = 'translate(' + (root.scrollLeft || 0) + 'px,' + (root.scrollTop || 0) + 'px)'; } catch { /* stil */ } };
  if (root.addEventListener) root.addEventListener('scroll', onScroll, { passive: true });
  function fit() {
    const w = root.clientWidth || (env && env.w) || 360, h = root.clientHeight || (env && env.h) || 600, sc = qOf(env) === 0 ? 0.6 : 1;
    const nw = Math.round(w * sc), nh = Math.round(h * sc);
    if (cv.width !== nw || cv.height !== nh) { cv.width = nw; cv.height = nh; }
    return sc;
  }
  function frame(ts) {
    raf = 0; if (dead) return;
    const now = typeof performance !== 'undefined' ? performance.now() : ts; const dt = Math.min(0.05, (now - last) / 1000); last = now;
    parts.update(dt);
    if (ctx) { const sc = fit(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.setTransform(sc, 0, 0, sc, 0, 0); parts.draw(ctx); }
    if (parts.count) raf = requestAnimationFrame(frame); else if (ctx) ctx.clearRect(0, 0, cv.width, cv.height);
  }
  function burst(x, y, kind = 'sparkle', n = 14, o = {}) {
    if (dead || reduceOf(env) && kind !== 'coins') n = Math.min(n, 4);
    if (reduceOf(env)) n = Math.min(n, 5);
    parts.burst(x, y, { kind, n, ...o });
    if (!raf) { last = typeof performance !== 'undefined' ? performance.now() : 0; raf = requestAnimationFrame(frame); }
  }
  function burstEl(el, kind, n, o) {
    let x = (root.clientWidth || 360) / 2, y = (root.clientHeight || 400) / 2;
    try { const a = el.getBoundingClientRect(), b = root.getBoundingClientRect(); x = a.left - b.left + a.width / 2; y = a.top - b.top + a.height / 2; } catch { /* midden */ }
    burst(x, y, kind, n, o);
  }
  return { burst, burstEl, destroy() { dead = true; if (raf) cancelAnimationFrame(raf); raf = 0; if (root.removeEventListener) root.removeEventListener('scroll', onScroll); parts.clear(); cv.remove(); } };
}

/* ---------- instellingen-knop ---------- */
export function gearBtn() {
  const b = E('button', 'gx-gear', '⚙'); b.type = 'button'; b.title = 'Instellingen'; b.setAttribute('aria-label', 'Instellingen');
  b.addEventListener('click', () => { try { openSettingsPanel({ title: 'Instellingen', toast: () => {} }); } catch { /* paneel optioneel */ } });
  return b;
}

/* ---------- kleine hulpjes ---------- */
// Pas schaal toe op een px-waarde (voor canvas-tekst/hit-vlakken): max(min, px*scale)
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const sz = (px) => `calc(${px}px*var(--gfx-scale,1))`;
export const fz = (px) => `calc(${px}px*var(--gfx-font,1))`;
// eindeloze-modus label voor hub: hou het save-formaat eenvoudig
export function loadBest(key) { try { return +globalThis.localStorage.getItem('learn:best:' + key) || 0; } catch { return 0; } }
export function saveBest(key, v) { try { if (v > loadBest(key)) globalThis.localStorage.setItem('learn:best:' + key, String(Math.round(v))); } catch { /* geen opslag */ } }
