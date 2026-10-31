// Gedeelde UI-hulpjes voor Piano, Muziekmaker, Dobbel en Kleur (fase 3): wereld-banner, ⚙-knop, scènes, basisstijl.
import { icon } from './gfx/art.js?v=1';
import { GFX } from './gfx/settings.js?v=1';
import { Themes } from './gfx/themes.js?v=1';
import { Scenes } from './gfx/scenes.js?v=1';
import { Particles } from './gfx/fx.js?v=1';
import { openSettingsPanel } from './gfx/panel.js?v=1';

export { icon, GFX, Themes, Scenes, Particles };

export const BASE_CSS = `
.ap{--s:var(--gfx-scale,1);--f:var(--gfx-font,1);font-size:calc(1rem*var(--f))}
.ap button,.ap select,.ap input[type=text],.ap input[type=number],.ap textarea{min-height:calc(46px*var(--s));font-size:calc(1rem*var(--f))}
.ap select,.ap input[type=text],.ap input[type=number],.ap textarea{font-family:inherit;padding:0 .6rem;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--ink);min-width:0}
.ap textarea{padding:.6rem;width:100%}
.ap button{border-radius:12px;padding:.4rem .8rem;display:inline-flex;align-items:center;justify-content:center;gap:.35rem}
.ap button:disabled{opacity:.45;cursor:default}
.ap .tabs2{display:flex;gap:.4rem;overflow-x:auto;margin:.2rem 0 .6rem;padding-bottom:2px;-webkit-overflow-scrolling:touch}
.ap .tabs2 button{flex:1 0 auto;white-space:nowrap}
.ap .tabs2 button.on,.ap button.on{background:var(--accent);border-color:var(--accent);color:#fff}
.ap .hero{position:relative;margin:0 0 .6rem;border-radius:16px;overflow:hidden}
.ap .hero canvas{width:100%;display:block}
.ap .hero .bar{position:absolute;left:.5rem;right:.5rem;top:.4rem;display:flex;align-items:center;gap:.4rem;pointer-events:none}
.ap .hero .bar>*{pointer-events:auto}
.ap .hero .ttl{flex:1;color:#fff;font-weight:800;font-size:calc(1.15rem*var(--f));text-shadow:0 2px 6px #0008;display:flex;align-items:center;gap:.4rem;pointer-events:none}
.ap .hero select{max-width:9rem;background:#0006;color:#fff;border-color:#fff4}
.ap .hero button{background:#0006;color:#fff;border-color:#fff4}
.ap .card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:calc(.8rem*var(--s));margin:.6rem 0}
.ap .grid{display:grid;gap:.5rem}
.ap .chip{border:1px solid var(--line);background:var(--card);border-radius:12px;padding:.35rem .6rem}
.ap .msg{min-height:1.6rem;margin:.3rem 0;font-weight:600}
.ap .stars{letter-spacing:2px}
.ap small.mute{color:var(--mute)}
.ap .sc-host{position:fixed;inset:0;z-index:9999;display:none}
.ap .sc-host.on{display:block}
`;

let styleN = 0;
export function styleTag() { return `<style data-ap="${++styleN}">${BASE_CSS}</style>`; }

// ⚙-knop (HTML) en bedrading
export const gearHtml = (id = 'ap-gear') => `<button id="${id}" aria-label="Instellingen" title="Instellingen">${icon('gear', { size: 26 })}</button>`;
export function wireGear(view, setMsg, id = 'ap-gear') {
  const b = view.querySelector('#' + id);
  if (b) b.onclick = () => { try { openSettingsPanel({ title: 'Instellingen', toast: (t) => setMsg && setMsg(t) }); } catch (e) { /* stil */ } };
}

// Wereld-keuze (select) voor een spel
export function worldSelectHtml(gameId, id = 'ap-world') {
  const cur = Themes.forGame(gameId).id;
  return `<select id="${id}" aria-label="Wereld">${Themes.list.map((w) => `<option value="${w.id}"${w.id === cur ? ' selected' : ''}>${w.emoji || ''} ${w.name}</option>`).join('')}</select>`;
}

// Scene (victory, levelup, ...) over het scherm; tik = overslaan
export function playScene(view, sceneId, opts = {}) {
  try { const h = Scenes.play(document.body, sceneId, opts); return h.done.then(() => {}, () => {}); } catch (e) { return Promise.resolve(); }
}

// Banner-canvas met wereldachtergrond, deeltjes en eigen tekencallback.
// draw(ctx, w, h, t, dt, parts)  -> ctl: { run(bool), paint(), burst(x,y,o), dispose(), setWorld(id), world }
export function hero(host, { gameId, height = 130, draw = null, title = '', rightHtml = '' } = {}) {
  host.classList.add('hero');
  host.innerHTML = `<canvas></canvas><div class="bar"><span class="ttl">${title}</span>${rightHtml}</div>`;
  const cv = host.querySelector('canvas'); cv.style.height = height + 'px';
  let world = Themes.forGame(gameId), raf = 0, last = 0, running = false, alive = true, t = 0, skip = 0, W = 0;
  const parts = new Particles();
  const size = () => { const w = cv.clientWidth || 320, d = GFX.dpr || 1; if (w !== W || cv.width !== Math.round(w * d)) { W = w; cv.width = Math.round(w * d); cv.height = Math.round(height * d); } return [w, height, d]; };
  function paint(dt = 0.016) {
    try {
      const ctx = cv.getContext('2d'); if (!ctx) return; const [w, h, d] = size();
      ctx.setTransform(d, 0, 0, d, 0, 0); Themes.paintBackground(ctx, w, h, world, t);
      if (draw) draw(ctx, w, h, t, dt, parts);
      parts.update(dt); parts.draw(ctx);
    } catch (e) { /* stil */ }
  }
  let until = 0;
  function frame(ts) {
    raf = 0; if (!alive || (!running && performance.now() > until)) { if (alive) paint(0); return; }
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    if (GFX.q === 0 && (skip ^= 1)) return;   // Normaal: 30 beelden per seconde
    t += dt; paint(dt);
  }
  const kick = () => { if (alive && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const ctl = {
    get world() { return world; },
    run(on) { if (GFX.reduce) { running = false; paint(); return; } if (on) { running = true; kick(); } else { running = false; if (!raf) paint(); } },
    paint, burst(x, y, o) { if (GFX.reduce) return; parts.burst(x, y, o); until = performance.now() + 1800; kick(); },
    setWorld(id) { if (Themes.setForGame(gameId, id)) { world = Themes.forGame(gameId); paint(); } },
    dispose() { alive = false; running = false; cancelAnimationFrame(raf); },
  };
  setTimeout(() => paint(), 0);
  return ctl;
}

// kleine hulp: tekst naar klembord
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* val terug */ }
  try { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return !!ok; } catch { return false; }
}
export const starsStr = (n, max = 3) => '★'.repeat(n) + '☆'.repeat(Math.max(0, max - n));
