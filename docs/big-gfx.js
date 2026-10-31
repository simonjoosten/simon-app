// Gedeelde grafische hulp voor de "big-" tycoon-spellen (themapark, aquarium, stadbouwer, foodtruck, ruimtebasis).
// - emoji -> 3D-icoon (DOM via iconify(), canvas via cEmoji()), emoji blijft fallback
// - gearButton()/openGear(): instellingenpaneel;  Looks: 'Uiterlijk'-menu met werelden;  intro()/milestone(): scenes
// - uiCss(): "royale" UI via interface-schaal (zoom) ;  cloudShadows(), coinBurst(): sfeer en deeltjes (kwaliteit-bewust)
import { ICONS } from './gfx/icons.js?v=1';
import { icon, iconUrl, has, drawIcon, emoji as emojiOf } from './gfx/art.js?v=1';
import { Settings, GFX } from './gfx/settings.js?v=1';
import { Themes } from './gfx/themes.js?v=1';
import { Scenes } from './gfx/scenes.js?v=1';
import { openSettingsPanel } from './gfx/panel.js?v=1';
import { Particles, softShadow, glow } from './gfx/fx.js?v=1';

export { icon, iconUrl, has, drawIcon, Settings, GFX, Themes, Scenes, Particles, softShadow, glow };

/* ---------- emoji <-> icoonnaam ---------- */
const strip = (s) => String(s).replace(/️/g, '');
const E2I = new Map();
for (const [n, e] of Object.entries(ICONS)) { const k = strip(e); if (!E2I.has(k)) E2I.set(k, n); }
const ALIAS = { '🌷': 'flower', '🏮': 'lightbulb', '🔧': 'hammer', '🧪': 'potion', '🪙': 'coin', '💳': 'money', '🧹': 'wand', '🌿': 'leaf', '🎪': 'tent', '🏗': 'hammer', '🐠': 'fish', '🐡': 'fish', '🐬': 'whale', '🦭': 'penguin', '🧁': 'cupcake' };
for (const [e, n] of Object.entries(ALIAS)) if (!E2I.has(strip(e)) && ICONS[n]) E2I.set(strip(e), n);
export function iconName(e) { return E2I.get(strip(e)) || null; }
/** HTML voor een emoji: 3D-icoon als dat bestaat, anders de emoji zelf. */
export function ico(e, size) { const n = iconName(e); return n && has(n) ? icon(n, { size: size || 24, alt: e }) : e; }

const SKIP = new Set(['SCRIPT', 'STYLE', 'CANVAS', 'TEXTAREA', 'INPUT', 'OPTION', 'SELECT', 'IMG', 'SVG', 'TITLE']);
let RX = null;
function rx() {
  if (RX) return RX;
  const keys = [...E2I.keys()].sort((a, b) => b.length - a.length).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  // elke emoji mag een variatieselector erachter hebben
  RX = new RegExp('(' + keys.map((k) => k + '\\uFE0F?').join('|') + ')', 'g');
  return RX;
}
function convertText(node) {
  const txt = node.nodeValue; if (!txt || txt.length > 4000) return;
  const re = rx(); re.lastIndex = 0;
  if (!re.test(txt)) return;
  re.lastIndex = 0;
  const doc = node.ownerDocument, frag = doc.createDocumentFragment();
  let last = 0, m, did = false;
  while ((m = re.exec(txt))) {
    const n = E2I.get(strip(m[0])); const url = n && has(n) ? iconUrl(n) : null;
    if (!url) continue;
    if (m.index > last) frag.appendChild(doc.createTextNode(txt.slice(last, m.index)));
    // wrapper behoudt de emoji als (onzichtbare) tekst: textContent-vergelijkingen in de spellen blijven kloppen
    const wr = doc.createElement('span'); wr.className = 'gfx-ei';
    const tx = doc.createElement('span'); tx.className = 'gfx-t'; tx.textContent = m[0];
    const im = doc.createElement('img'); im.className = 'gfx-ic'; im.src = url; im.alt = ''; im.draggable = false;
    im.onerror = () => { try { wr.replaceWith(doc.createTextNode(m[0])); } catch { /* weg */ } };
    wr.appendChild(tx); wr.appendChild(im);
    frag.appendChild(wr); last = m.index + m[0].length; did = true;
  }
  if (!did) return;
  if (last < txt.length) frag.appendChild(doc.createTextNode(txt.slice(last)));
  node.parentNode.replaceChild(frag, node);
}
function walk(el) {
  if (!el) return;
  if (el.nodeType === 1 && el.classList && el.classList.contains('gfx-ei')) return;
  if (el.nodeType === 3 && el.parentNode && el.parentNode.className === 'gfx-t') return;
  if (el.nodeType === 3) { if (el.parentNode && !SKIP.has(el.parentNode.nodeName.toUpperCase()) && !(el.parentNode.closest && el.parentNode.closest('[data-noicon]'))) convertText(el); return; }
  if (el.nodeType !== 1 || SKIP.has(el.nodeName.toUpperCase()) || (el.hasAttribute && el.hasAttribute('data-noicon'))) return;
  const kids = Array.from(el.childNodes);
  for (const k of kids) walk(k);
}
/** Vervangt emoji in alle (ook later toegevoegde) tekst onder root door 3D-icoontjes. Geeft stop() terug. */
export function iconify(root) {
  if (!root) return () => {};
  walk(root);
  if (typeof MutationObserver === 'undefined') return () => {};
  // synchroon in de microtask: de emoji is dan nooit een frame lang zichtbaar (geen geflikker bij herhaald innerHTML zetten)
  const mo = new MutationObserver((recs) => {
    for (const r of recs) {
      if (r.type === 'characterData') { if (r.target.isConnected !== false) walk(r.target); }
      else for (const n of r.addedNodes) if (n.isConnected !== false) walk(n);
    }
  });
  mo.observe(root, { childList: true, subtree: true, characterData: true });
  return () => mo.disconnect();
}

/** innerHTML alleen zetten als het echt veranderd is (voorkomt dat 3D-icoontjes elke tik opnieuw worden opgebouwd). */
export function setHtml(el, html) { if (!el || el.__bgh === html) return false; el.__bgh = html; el.innerHTML = html; return true; }

/* ---------- canvas ---------- */
/** Tekent emoji als 3D-icoon (of als emoji-tekst als er geen icoon is). x,y = midden. */
export function cEmoji(ctx, e, x, y, size, o) {
  const n = iconName(e);
  if (n) { drawIcon(ctx, n, x, y, size * 1.18, o); return true; }
  return false;
}

/* ---------- CSS: royaler (interface-schaal) ---------- */
/** CSS-regels (string) die de opgegeven selectors met interface-schaal laten meeschalen (zoom). base = extra royaliteit. */
export function uiCss(selectors, base = 1.1) {
  return `${selectors.join(',')}{zoom:calc(var(--gfx-scale,1) * ${base})}
.gfx-ei{display:inline-block;position:relative;width:1.25em;height:1.25em;vertical-align:-.25em;line-height:1}
.gfx-ei .gfx-t{position:absolute;left:0;top:0;width:0;height:0;overflow:hidden;font-size:0;opacity:0}
img.gfx-ic{display:inline-block;width:1.25em;height:1.25em;vertical-align:-.25em;object-fit:contain;pointer-events:none;user-select:none;-webkit-user-drag:none}
.gfx-ei img.gfx-ic{display:block;width:100%;height:100%;vertical-align:baseline}
.bg-gearbtn{width:48px;height:48px;border-radius:50%;border:0;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;background:rgba(255,255,255,.92);box-shadow:0 2px 8px rgba(0,0,0,.25);padding:0;font-size:22px}
.bg-gearbtn img.gfx-ic{width:28px;height:28px}`;
}

/* ---------- instellingen ---------- */
export function openGear(opts = {}) { return openSettingsPanel({ title: opts.title || 'Instellingen', toast: opts.toast || (() => {}) }); }
/** Maakt een ⚙-knop (als element). */
export function gearButton(opts = {}) {
  const b = document.createElement('button'); b.type = 'button'; b.className = opts.cls || 'bg-gearbtn'; b.setAttribute('aria-label', 'Instellingen'); b.title = 'Instellingen';
  b.innerHTML = ico('⚙️', 28); b.addEventListener('click', () => openGear(opts));
  return b;
}

/* ---------- uiterlijken (werelden) ---------- */
// look = { id, name, emoji, world (id uit Themes), d (omschrijving), pal: {...eigen palet voor het spel} }
const LK = (g) => 'big:look:' + g;
export function getLook(gameId, looks) {
  let id = null; try { id = globalThis.localStorage.getItem(LK(gameId)); } catch { /* stil */ }
  return looks.find((l) => l.id === id) || looks[0];
}
export function setLook(gameId, id) { try { globalThis.localStorage.setItem(LK(gameId), id); } catch { /* stil */ } }
/** Menu 'Uiterlijk': grote kaarten met voorbeeld. onPick(look) wordt aangeroepen na keuze. */
export function openLooks({ gameId, looks, onPick, title }) {
  const doc = globalThis.document; if (!doc) return { close() {} };
  const old = doc.querySelector('.bg-lk'); if (old) old.remove();
  const cur = getLook(gameId, looks);
  const back = doc.createElement('div'); back.className = 'bg-lk';
  back.style.cssText = 'position:fixed;inset:0;z-index:100001;background:rgba(10,10,30,.6);display:flex;align-items:center;justify-content:center;padding:12px';
  const box = doc.createElement('div');
  box.style.cssText = 'width:min(560px,100%);max-height:92vh;overflow:auto;background:var(--card,#fff);color:var(--ink,#1e293b);border-radius:22px;padding:16px;font:16px/1.35 system-ui,sans-serif';
  box.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h2 style="margin:0;font-size:1.3em">${ico('🎨', 28)} ${title || 'Uiterlijk'}</h2><button type="button" data-x style="min-width:48px;min-height:48px;border:0;border-radius:14px;font-size:1.3em;background:rgba(128,128,128,.18);color:inherit">✕</button></div><div data-g style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px"></div>`;
  const grid = box.querySelector('[data-g]');
  for (const l of looks) {
    const b = doc.createElement('button'); b.type = 'button'; b.setAttribute('aria-pressed', l.id === cur.id ? 'true' : 'false');
    b.style.cssText = 'padding:0;border:3px solid ' + (l.id === cur.id ? 'var(--accent,#6366f1)' : 'rgba(128,128,128,.3)') + ';border-radius:16px;overflow:hidden;background:transparent;color:inherit;text-align:left;cursor:pointer;font:inherit';
    const cv = doc.createElement('canvas'); cv.width = 240; cv.height = 130; cv.style.cssText = 'display:block;width:100%;height:auto';
    try { const c2 = cv.getContext('2d'); Themes.paintBackground(c2, 240, 130, Themes.world(l.world), 1); } catch { /* geen canvas */ }
    const t = doc.createElement('div'); t.style.cssText = 'padding:8px 10px'; t.innerHTML = `<b>${ico(l.emoji, 22)} ${l.name}</b><div style="font-size:.8em;opacity:.7">${l.d || ''}</div>`;
    b.appendChild(cv); b.appendChild(t);
    b.addEventListener('click', () => { setLook(gameId, l.id); close(); if (onPick) onPick(l); });
    grid.appendChild(b);
  }
  back.appendChild(box); doc.body.appendChild(back);
  function close() { try { back.remove(); } catch { /* weg */ } }
  box.querySelector('[data-x]').addEventListener('click', close);
  back.addEventListener('pointerdown', (e) => { if (e.target === back) close(); });
  iconify(box);
  return { close };
}

/* ---------- scenes ---------- */
let playing = null;
function playScene(host, id, opts) {
  try {
    if (globalThis.__BIG_NOSCENES || !host || !Scenes.list[id] || !Number.isFinite(GFX.dpr) || typeof host.clientWidth !== 'number') return null;
    if (playing) { try { playing.stop(); } catch { /* weg */ } }
    const h = Scenes.play(host, id, opts || {});
    playing = h; h.done.then(() => { if (playing === h) playing = null; }).catch(() => {});
    return h;
  } catch { return null; }
}
/** Intro-scène bij het eerste openen van een spel (daarna nooit meer, tenzij force). */
export function intro(host, gameId, sceneId, opts = {}) {
  const k = 'big:intro:' + gameId;
  try { if (!opts.force && globalThis.localStorage.getItem(k)) return null; globalThis.localStorage.setItem(k, '1'); } catch { /* stil */ }
  return playScene(host, sceneId, { title: opts.title, sub: opts.sub, skippable: true });
}
const LAST = {};
/** Mijlpaal-scene: kind = levelup | new-record | daily-bonus | coins-rain | chest-open | victory | boss-defeated. Max 1 per 20 s per soort. */
export function milestone(host, kind, opts = {}) {
  const now = Date.now();
  if (!opts.force && LAST[kind] && now - LAST[kind] < (opts.gap || 20000)) return null;
  LAST[kind] = now;
  return playScene(host, kind, { title: opts.title, sub: opts.sub, value: opts.value, icon: opts.icon, skippable: true });
}

/* ---------- sfeer ---------- */
/** Zachte, langzaam voorbijdrijvende wolkenschaduwen over het scherm (alleen Hoog/Ultra). */
export function cloudShadows(ctx, w, h, t, a = 0.12) {
  if (GFX.q < 1 || GFX.reduce) return;
  ctx.save();
  const n = GFX.q === 2 ? 5 : 3;
  for (let i = 0; i < n; i++) {
    const sp = 6 + i * 3, rx = w * (0.22 + 0.05 * i), ry = h * (0.1 + 0.03 * i);
    const x = ((t * sp + i * w * 0.43) % (w + rx * 3)) - rx * 1.5, y = h * (0.15 + 0.17 * i);
    ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, `rgba(10,20,40,${a})`); g.addColorStop(1, 'rgba(10,20,40,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.2832); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
/** Muntjes-explosie voor inkomsten (gebruikt Particles). */
export function coinBurst(fx, x, y, n = 6) { if (fx && !GFX.reduce) fx.burst(x, y, { kind: 'coins', n, power: 0.6, spread: Math.PI * 0.8 }); }
/** Zachte schaduw onder een gebouw (kwaliteit-bewust: Normaal = simpele ellips). */
export function groundShadow(ctx, x, y, rx, ry, a = 0.25) { if (GFX.q === 0) { ctx.fillStyle = `rgba(0,0,0,${a * 0.6})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.2832); ctx.fill(); } else softShadow(ctx, x, y, rx, ry, a); }
/** Verloop van overdag naar nacht: 0..1 donkerte -> tint-kleur voor multiply. */
export function nightTint(n) { return `rgb(${255 - n * 190 | 0},${255 - n * 170 | 0},${255 - n * 80 | 0})`; }
/** Parallax-offset voor een achtergrondlaag (diepte 0..1) bij camera (cx, cy). */
export function parallax(cx, cy, depth) { return [-cx * depth * 0.15, -cy * depth * 0.08]; }
export { emojiOf };
