// Gedeelde UI voor pixel-art, meme-maker en moppen: wereld-banner met ⚙, wereldkeuze, toast en feestscènes.
import { icon } from './gfx/art.js?v=1';
import { GFX, Settings } from './gfx/settings.js?v=1';
import { Themes } from './gfx/themes.js?v=1';
import { openSettingsPanel } from './gfx/panel.js?v=1';
import { Scenes } from './gfx/scenes.js?v=1';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function toast(text, ms = 2200) {
  const d = document.createElement('div');
  d.textContent = text;
  d.style.cssText = 'position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);max-width:88vw;z-index:100001;background:rgba(20,20,40,.92);color:#fff;padding:.7rem 1.1rem;border-radius:14px;font:600 1rem system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35);text-align:center';
  document.body.appendChild(d); setTimeout(() => { try { d.remove(); } catch { /* */ } }, ms);
}

// Feestscène over het hele scherm. Geeft de belofte van de scène terug (nooit een fout).
export function celebrate(id, opts = {}) {
  try {
    if (!Scenes.list[id]) return Promise.resolve();
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.25)';
    document.body.appendChild(host);
    const h = Scenes.play(host, id, { title: opts.title, sub: opts.sub, w: host.clientWidth || 360, h: host.clientHeight || 640 });
    const end = () => { try { host.remove(); } catch { /* */ } };
    return Promise.resolve(h.done).then(end, end);
  } catch { return Promise.resolve(); }
}

// Banner met de gekozen wereld als achtergrond, titel, ⚙-knop en wereldkiezer.
// Geeft { body } terug: het element waar de app in tekent.
export function mountShell(view, { game, title, sub, iconName, addCleanup }) {
  view.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.innerHTML = `<div class="fu-ban" style="position:relative;border-radius:calc(18px * var(--gfx-scale,1));overflow:hidden;margin:.4rem 0 .6rem;min-height:calc(104px * var(--gfx-scale,1));background:#334">
      <canvas class="fu-cv" style="position:absolute;inset:0;width:100%;height:100%"></canvas>
      <div style="position:relative;display:flex;align-items:center;gap:.8rem;padding:.8rem 1rem;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.5)">
        <span class="fu-ic" style="filter:drop-shadow(0 4px 6px rgba(0,0,0,.4))">${icon(iconName, { size: Math.round(64 * (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gfx-scale')) || 1)) })}</span>
        <div style="flex:1;min-width:0"><div style="font:800 calc(1.35rem * var(--gfx-font,1)) system-ui,sans-serif">${esc(title)}</div><div style="font:600 calc(.9rem * var(--gfx-font,1)) system-ui,sans-serif;opacity:.9">${esc(sub || '')}</div></div>
        <select class="fu-world" aria-label="Wereld" style="max-width:7.5rem;min-height:44px;border-radius:12px;border:0;padding:0 .4rem;font-size:.9rem"></select>
        <button class="fu-set" aria-label="Instellingen" style="min-width:48px;min-height:48px;border-radius:14px;border:0;background:rgba(255,255,255,.88);font-size:1.4rem;cursor:pointer">⚙</button>
      </div></div><div class="fu-body"></div>`;
  view.appendChild(wrap);
  const q = (s) => wrap.querySelector(s);
  const cv = q('.fu-cv'), sel = q('.fu-world'), body = q('.fu-body');
  sel.innerHTML = Themes.list.map((w) => `<option value="${w.id}">${esc(w.emoji + ' ' + w.name)}</option>`).join('');
  sel.value = Themes.forGame(game).id;
  let t0 = 0, raf = 0, dead = false, last = 0;
  const paint = (t) => {
    const w = Math.max(200, cv.clientWidth || 360), h = Math.max(80, cv.clientHeight || 104), dpr = Math.min(GFX.dpr || 1, 2);
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const c = cv.getContext('2d'); if (!c) return; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    try { Themes.paintBackground(c, w, h, Themes.forGame(game), t); } catch { c.fillStyle = '#334'; c.fillRect(0, 0, w, h); }
  };
  const loop = (ts) => {
    raf = 0; if (dead || !cv.isConnected) return;
    if (!t0) t0 = ts; if (ts - last > 120) { last = ts; paint((ts - t0) / 1000); }
    if (GFX.q >= 2 && !GFX.reduce) raf = requestAnimationFrame(loop);
  };
  const kick = () => { paint(0); if (!raf && GFX.q >= 2 && !GFX.reduce) raf = requestAnimationFrame(loop); };
  sel.onchange = () => { Themes.setForGame(game, sel.value); kick(); };
  q('.fu-set').onclick = () => openSettingsPanel({ title: 'Instellingen', toast });
  const off = Settings.onChange(() => kick());
  if (addCleanup) addCleanup(() => { dead = true; cancelAnimationFrame(raf); off(); });
  requestAnimationFrame(kick);
  return { body, kick, destroy() { dead = true; cancelAnimationFrame(raf); off(); } };
}

export { icon, esc };
