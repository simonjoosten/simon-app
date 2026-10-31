// huisdier-gfx.js - brug tussen het Huisdier en de gedeelde grafische kern (docs/gfx): 3D-iconen, scènes, instellingenpaneel,
// seizoenslaag. Wordt lui geladen door huisdier.js; als dit bestand ontbreekt werkt het Huisdier gewoon met emoji's.
import { icon, iconUrl, preload } from './gfx/art.js?v=1';
import { ICONS } from './gfx/icons.js?v=1';
import { Scenes } from './gfx/scenes.js?v=1';
import { GFX } from './gfx/settings.js?v=1';
import { openSettingsPanel } from './gfx/panel.js?v=1';
import { Themes } from './gfx/themes.js?v=1';
import { attach3D } from './emoji3d.js?v=1';
import { particlePlan } from './huisdier-more.js?v=1';

export { attach3D, preload, iconUrl, openSettingsPanel, Themes };
export const urlOf = (n) => iconUrl(n);
export const iconHtml = (n, size = 24) => icon(n, { size, alt: '' });
export const gfxApi = { iconSrc: (n) => iconUrl(n), emoji: (n) => ICONS[n] || '⭐' };

const CSS = `.hd-season{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2}
.hd-sp{position:absolute;top:-14%;animation:hd-fall linear infinite;opacity:.9}
.hd-sp img{display:block;width:100%;height:auto}
@keyframes hd-fall{0%{top:-14%;transform:translateX(0) rotate(0)}50%{transform:translateX(14px) rotate(180deg)}100%{top:104%;transform:translateX(-6px) rotate(360deg)}}
.hd-xf{position:absolute;transform:translate(-50%,-100%);pointer-events:none;z-index:1}.hd-xf svg{display:block;width:100%;height:auto;overflow:visible}
.hd-ev{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;border-radius:14px;margin-bottom:6px;background:linear-gradient(90deg,#fde68a,#fbcfe8);color:#5a3a1a}
.hd-ev button{min-height:40px}.hd-gear{min-width:44px;min-height:40px}
.e3d img{vertical-align:middle}
html[data-reduce="1"] .hd-sp{animation:none;display:none}`;

export function ensureCss() {
  if (document.getElementById('hd-gfx-css')) return;
  const st = document.createElement('style'); st.id = 'hd-gfx-css'; st.textContent = CSS; document.head.appendChild(st);
}

// Seizoens- en evenementenlaag boven de kamer (HTML-string). Zacht en kwaliteit-bewust; bij 'reduce' niets.
export function seasonLayerHTML(season, events) {
  const plan = particlePlan(season, events, GFX.q, GFX.reduce);
  if (!plan.length) return '';
  return `<div class="hd-season" aria-hidden="true">${plan.map((p) => `<span class="hd-sp" style="left:${p.left}%;width:${p.size}px;animation-duration:${p.dur}s;animation-delay:-${p.delay}s">${icon(p.ic, { size: p.size, alt: '' })}</span>`).join('')}</div>`;
}

export function playScene(host, id, opts) {
  try { const s = Scenes.play(host, id, Object.assign({ theme: undefined }, opts)); return s; } catch (e) { console.error(e); return null; }
}
export function openSettings(opts) { return openSettingsPanel(opts); }

// ---- kamer-thema's: een wereld uit gfx/themes.js als lijst + hoekdecoratie rond de kamer
export const worldList = () => Themes.list.map((w) => ({ id: w.id, name: w.name, emoji: w.emoji, accent: w.accent, deco: w.deco }));
const WD_POS = [[7, 9], [93, 9], [6, 90], [94, 90], [50, 5]];
export function worldFrameHTML(id) {
  const w = Themes.list.find((x) => x.id === id); if (!w) return '';
  const n = GFX.q === 0 ? 2 : GFX.q === 1 ? 4 : 5, glowPx = GFX.q === 2 ? 46 : GFX.q === 1 ? 24 : 0;
  return `<div class="hd-wd" aria-hidden="true" style="position:absolute;inset:0;pointer-events:none;z-index:2;border-radius:inherit;box-shadow:inset 0 0 0 4px ${w.accent}${glowPx ? `,inset 0 0 ${glowPx}px ${w.accent}88` : ''};background:linear-gradient(180deg,${w.bg[0]}40,transparent 45%)">${w.deco.slice(0, n).map((name, i) => `<span style="position:absolute;left:${WD_POS[i][0]}%;top:${WD_POS[i][1]}%;transform:translate(-50%,-50%)">${icon(name, { size: 34, alt: '' })}</span>`).join('')}</div>`;
}
