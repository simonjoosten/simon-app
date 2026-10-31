// Gedeelde grafische hulp voor de Learn-spellen (wereld-achtergrond, 3D-iconen, deeltjes, instellingenknop).
// Geen spel zelf (underscore = niet in de lijst). Gebruik: const gx = Gx.start(root, env, 'memory', { gear: true }); ... gx.destroy().
// De gfx-modules worden veilig geladen (een kapotte/ontbrekende module mag een spel nooit laten crashen).
let GFX = { q: 1, reduce: false, dpr: 1, particles: n => n }, icon = (n) => '', has = () => false, drawIcon = () => {}, iconEmoji = () => '', Themes = null, Particles = null, openSettingsPanel = null, mixFn = null;
try { const m = await import('../../gfx/settings.js?v=1'); GFX = m.GFX || GFX; } catch (e) { /* ok */ }
try { const m = await import('../../gfx/art.js?v=1'); icon = m.icon; has = m.has; drawIcon = m.drawIcon; iconEmoji = m.emoji; } catch (e) { /* ok */ }
try { const m = await import('../../gfx/themes.js?v=1'); Themes = m.Themes; } catch (e) { /* ok */ }
try { const m = await import('../../gfx/fx.js?v=1'); Particles = m.Particles; mixFn = m.mix; } catch (e) { /* ok */ }
try { const m = await import('../../gfx/panel.js?v=1'); openSettingsPanel = m.openSettingsPanel; } catch (e) { /* ok */ }
class NoParticles { constructor() { this.list = []; } get count() { return 0; } clear() {} burst() { return 0; } update() {} draw() {} }
const hex3 = (c) => { c = String(c || '#888888'); if (c[0] !== '#') return [136, 136, 136]; if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]; return [parseInt(c.slice(1, 3), 16) || 0, parseInt(c.slice(3, 5), 16) || 0, parseInt(c.slice(5, 7), 16) || 0]; };
export function mix(c1, c2, t) { if (mixFn) { try { return mixFn(c1, c2, t); } catch (e) { /* ok */ } } const a = hex3(c1), b = hex3(c2); return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')'; }

const CSS = `
.gx-host{position:relative;isolation:isolate}
.gx-bd{position:absolute;left:0;top:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block}
.gx-fxc{position:absolute;left:0;top:0;width:100%;height:100%;z-index:60;pointer-events:none}
.gx-gear{position:absolute;top:6px;right:6px;z-index:70;width:46px;height:46px;border-radius:14px;border:2px solid var(--line,#cbd5e1);background:var(--card,#fff);color:var(--ink,#111);font-size:22px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,.2);-webkit-tap-highlight-color:transparent}
.gx-ic{display:inline-block;vertical-align:middle;filter:drop-shadow(0 3px 3px rgba(0,0,0,.32))}
.gx-em{line-height:1;text-align:center;font-style:normal}
html[data-gfx-q="0"] .gx-ic{filter:none}
.gx-pill{background:var(--card,#fff);color:var(--ink,#111);border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.18)}
.gx-chip{display:inline-flex;align-items:center;gap:5px;background:var(--card,#fff);color:var(--ink,#111);border-radius:99px;padding:5px 11px;font-weight:800;box-shadow:0 2px 6px rgba(0,0,0,.18)}
.gx-bob{animation:gxbob 2.4s ease-in-out infinite}
html[data-reduce="1"] .gx-bob{animation:none}
@keyframes gxbob{50%{transform:translateY(-4px)}}
`;

const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);

export const Gx = {
  GFX,
  world(env, id) {
    try { if (env && env.world && env.world.bg) return env.world; } catch (e) { /* ok */ }
    try { if (Themes) return Themes.forGame(id); } catch (e) { /* ok */ }
    return { id: 'ruimte', name: 'Ruimte', bg: ['#0b1026', '#3b1d6e'], accent: '#a78bfa', ground: '#1e1b4b', deco: [], mood: 'dark' };
  },
  // wereld-achtergrond op een eigen canvas (voor spellen die de wereld IN het speelveld willen)
  paint(ctx, w, h, world, t) { try { if (Themes) Themes.paintBackground(ctx, w, h, world, t || 0); } catch (e) { /* ok */ } },
  q(env) { const g = (env && env.gfx) || {}; return num(g.q, num(GFX.q, 1)); },
  reduce(env) { const g = (env && env.gfx) || {}; return !!(g.reduce != null ? g.reduce : GFX.reduce); },
  has(name) { try { return has(name); } catch (e) { return false; } },
  // HTML van een 3D-icoon (emoji als fallback). size in px.
  ic(name, size = 32, emo) {
    if (Gx.has(name)) return icon(name, { size, cls: 'gx-ic', alt: '' });
    const e = emo || (name ? iconEmoji(name) : '') || '❓';
    return `<span class="gx-ic gx-em" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.8)}px;line-height:${size}px">${e}</span>`;
  },
  // canvas: icoon (x,y = midden)
  draw(ctx, name, x, y, size, emo, o) {
    try {
      if (Gx.has(name)) { drawIcon(ctx, name, x, y, size, o || {}); return; }
      const e = emo || iconEmoji(name) || '❓';
      ctx.save(); if (o && o.rot) { ctx.translate(x, y); ctx.rotate(o.rot); x = 0; y = 0; }
      if (o && o.alpha != null) ctx.globalAlpha *= o.alpha;
      ctx.font = Math.round(size * 0.82) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, x, y + size * 0.04); ctx.restore();
    } catch (e2) { /* mock/ctx fout: stil */ }
  },

  /* start(container, env, gameId, { backdrop:true, gear:true, fxLayer:true }) -> gx
     container moet position:relative zijn (wordt gezet) en mag NIET leeggemaakt worden met innerHTML terwijl het spel loopt. */
  start(container, env, gameId, opts = {}) {
    const o = Object.assign({ backdrop: true, gear: true, fxLayer: true, dprCap: 1.25 }, opts);
    const world = Gx.world(env, gameId);
    const doc = document;
    let dead = false, raf = 0, last = 0, lw = 0, lh = 0, painted = false, fxRaf = 0, fxLast = 0;
    const st = doc.createElement('style'); st.textContent = CSS; (doc.head || container).appendChild(st);
    container.classList.add('gx-host');
    try {
      container.style.setProperty && container.style.setProperty('--gx-a', world.accent || '#6366f1');
      container.style.setProperty && container.style.setProperty('--gx-b1', (world.bg && world.bg[0]) || '#334155');
      container.style.setProperty && container.style.setProperty('--gx-b2', (world.bg && world.bg[world.bg.length - 1]) || '#0f172a');
      container.style.setProperty && container.style.setProperty('--gx-ground', world.ground || '#334155');
    } catch (e) { /* ok */ }
    const gx = { world, accent: world.accent || '#6366f1', dark: world.mood === 'dark', el: container, fx: Particles ? new Particles() : new NoParticles() };
    gx.q = () => Gx.q(env); gx.reduce = () => Gx.reduce(env);

    // --- achtergrond
    let cv = null, cx = null;
    function paint(ts) {
      if (dead || !cv) return;
      raf = requestAnimationFrame(paint);
      if (cv.isConnected === false) return;
      const q = gx.q(), minGap = gx.reduce() ? 1500 : [110, 55, 34][q] || 55;
      const now = ts || 0;
      const w = container.clientWidth || 360, h = container.clientHeight || 600;
      const resized = w !== lw || h !== lh;
      if (!resized && painted && now - last < minGap) return;
      if (!resized && painted && gx.reduce()) return;
      last = now; painted = true;
      if (resized) {
        lw = w; lh = h;
        const d = Math.min(o.dprCap, [0.75, 1, 1.25][q] || 1);
        cv.width = Math.max(2, Math.round(w * d)); cv.height = Math.max(2, Math.round(h * d)); cv._d = d;
      }
      try {
        cx.setTransform && cx.setTransform(cv._d || 1, 0, 0, cv._d || 1, 0, 0);
        if (Themes) Themes.paintBackground(cx, w, h, world, gx.reduce() ? 0 : now / 1000);
      } catch (e) { /* achtergrond is bijzaak */ }
    }
    if (o.backdrop) {
      try {
        cv = doc.createElement('canvas'); cv.className = 'gx-bd'; cx = cv.getContext && cv.getContext('2d');
        if (cx) { container.prepend ? container.prepend(cv) : container.appendChild(cv); raf = requestAnimationFrame(paint); } else cv = null;
      } catch (e) { cv = null; }
    }
    // --- deeltjes-laag (alleen actief als er deeltjes zijn)
    let fc = null, fcx = null;
    function fxLoop(ts) {
      fxRaf = 0;
      if (dead || !fcx) return;
      const dt = Math.min(0.05, (ts - (fxLast || ts)) / 1000); fxLast = ts;
      const w = container.clientWidth || 360, h = container.clientHeight || 600;
      if (fc.width !== w || fc.height !== h) { fc.width = w; fc.height = h; }
      gx.fx.update(dt);
      fcx.clearRect(0, 0, w, h);
      gx.fx.draw(fcx);
      if (gx.fx.count > 0) fxRaf = requestAnimationFrame(fxLoop); else { fxLast = 0; fcx.clearRect(0, 0, w, h); }
    }
    if (o.fxLayer) {
      try { fc = doc.createElement('canvas'); fc.className = 'gx-fxc'; fcx = fc.getContext && fc.getContext('2d'); if (fcx) container.appendChild(fc); else fc = null; } catch (e) { fc = null; }
    }
    // x,y in px t.o.v. container
    gx.burst = (x, y, kind = 'sparkle', n = 16, extra) => {
      if (dead || !fcx) return;
      try { gx.fx.burst(x, y, Object.assign({ kind, n }, extra || {})); if (!fxRaf) fxRaf = requestAnimationFrame(fxLoop); } catch (e) { /* ok */ }
    };
    gx.burstEl = (elem, kind = 'sparkle', n = 16, extra) => {
      try {
        const r = elem.getBoundingClientRect(), b = container.getBoundingClientRect();
        gx.burst(r.left - b.left + r.width / 2, r.top - b.top + r.height / 2, kind, n, extra);
      } catch (e) { /* ok */ }
    };
    // ⚙-knop
    gx.gearBtn = null; let panelH = null;
    if (o.gear) {
      const b = doc.createElement('button'); b.type = 'button'; b.className = 'gx-gear'; b.textContent = '⚙'; b.setAttribute('aria-label', 'Instellingen');
      b.addEventListener('click', ev => { try { ev.stopPropagation && ev.stopPropagation(); } catch (e) { /* ok */ } try { if (panelH && panelH.close) panelH.close(); if (openSettingsPanel) panelH = openSettingsPanel({ title: 'Instellingen', toast: m => { try { env.toast && env.toast(m); } catch (e2) { /* ok */ } } }); } catch (e) { /* ok */ } });
      container.appendChild(b); gx.gearBtn = b;
    }
    gx.destroy = () => {
      dead = true;
      try { panelH && panelH.close && panelH.close(); } catch (e) { /* ok */ }
      try { cancelAnimationFrame(raf); cancelAnimationFrame(fxRaf); } catch (e) { /* ok */ }
      try { st.remove(); } catch (e) { /* ok */ }
      try { cv && cv.remove(); fc && fc.remove(); gx.gearBtn && gx.gearBtn.remove(); container.classList.remove('gx-host'); } catch (e) { /* ok */ }
      gx.fx.clear();
    };
    return gx;
  },
};
export default Gx;
