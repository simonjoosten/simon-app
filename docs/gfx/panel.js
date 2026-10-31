// Instellingenpaneel (modal). openSettingsPanel({title, toast}) -> { close() }. Alle CSS met prefix .gfx-, <style> en node worden bij sluiten verwijderd.
import { Settings } from './settings.js?v=1';

const ACCENTS = [['#6366f1', 'Indigo'], ['#ec4899', 'Roze'], ['#ef4444', 'Rood'], ['#f97316', 'Oranje'], ['#eab308', 'Geel'], ['#22c55e', 'Groen'], ['#06b6d4', 'Turkoois'], ['#8b5cf6', 'Paars']];
const QUALITY = [
  ['normaal', 'Normaal', 'Vlot op elke telefoon. Minder effecten.'],
  ['hoog', 'Hoog', 'Mooier: meer deeltjes, zachte gloed.'],
  ['ultra', 'Ultra', 'Het allermooiste. Kan zwaar zijn.'],
];
const CB = [['uit', 'Uit', 'Normale kleuren'], ['deutan', 'Groen-zwak', 'Deuteranomalie'], ['protan', 'Rood-zwak', 'Protanomalie'], ['tritan', 'Blauw-zwak', 'Tritanomalie']];
const THEMES = [['auto', 'Automatisch'], ['licht', 'Licht'], ['donker', 'Donker']];

const CSS = `
.gfx-back{position:fixed;inset:0;z-index:100000;background:rgba(10,10,30,.55);display:flex;align-items:flex-end;justify-content:center;animation:gfx-fade .18s ease-out}
.gfx-panel{--p-bg:#fff;--p-fg:#1e293b;--p-mut:#64748b;--p-line:#e2e8f0;--p-card:#f1f5f9;--p-ac:var(--gfx-accent,#6366f1);
 box-sizing:border-box;width:min(560px,100%);max-height:92vh;overflow:auto;-webkit-overflow-scrolling:touch;background:var(--p-bg);color:var(--p-fg);border-radius:22px 22px 0 0;padding:18px 18px 28px;font:16px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;animation:gfx-up .22s ease-out;overscroll-behavior:contain}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .gfx-panel{--p-bg:#1e293b;--p-fg:#f1f5f9;--p-mut:#94a3b8;--p-line:#334155;--p-card:#0f172a}}
:root[data-theme=dark] .gfx-panel{--p-bg:#1e293b;--p-fg:#f1f5f9;--p-mut:#94a3b8;--p-line:#334155;--p-card:#0f172a}
@media (min-width:600px){.gfx-back{align-items:center}.gfx-panel{border-radius:22px}}
.gfx-panel *{box-sizing:border-box}
.gfx-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}
.gfx-head h2{margin:0;font-size:1.35em}
.gfx-x{min-width:48px;min-height:48px;border:0;border-radius:14px;background:var(--p-card);color:var(--p-fg);font-size:1.3em;cursor:pointer}
.gfx-sec{margin:18px 0 0}
.gfx-sec h3{margin:0 0 8px;font-size:.95em;text-transform:uppercase;letter-spacing:.05em;color:var(--p-mut)}
.gfx-row{display:grid;gap:8px}
.gfx-row.c3{grid-template-columns:repeat(3,1fr)}.gfx-row.c2{grid-template-columns:repeat(2,1fr)}
.gfx-opt{min-height:52px;padding:10px 8px;border:2px solid var(--p-line);border-radius:14px;background:var(--p-card);color:var(--p-fg);font:inherit;text-align:center;cursor:pointer;display:flex;flex-direction:column;justify-content:center;gap:2px}
.gfx-opt b{font-size:1em}.gfx-opt small{font-size:.76em;color:var(--p-mut);line-height:1.25}
.gfx-opt[aria-pressed=true]{border-color:var(--p-ac);box-shadow:0 0 0 2px var(--p-ac) inset;background:color-mix(in srgb,var(--p-ac) 14%,var(--p-card))}
.gfx-opt:focus-visible,.gfx-x:focus-visible,.gfx-sw:focus-visible,.gfx-reset:focus-visible,.gfx-range:focus-visible{outline:3px solid var(--p-ac);outline-offset:2px}
.gfx-tog{width:100%;min-height:56px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;border:2px solid var(--p-line);border-radius:14px;background:var(--p-card);color:var(--p-fg);font:inherit;text-align:left;cursor:pointer;margin-bottom:8px}
.gfx-tog small{display:block;color:var(--p-mut);font-size:.8em}
.gfx-sw-t{flex:none;width:54px;height:30px;border-radius:15px;background:#94a3b8;position:relative;transition:background .15s}
.gfx-sw-t::after{content:"";position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:transform .15s}
.gfx-tog[aria-checked=true] .gfx-sw-t{background:var(--p-ac)}.gfx-tog[aria-checked=true] .gfx-sw-t::after{transform:translateX(24px)}
.gfx-sl{display:flex;align-items:center;gap:12px;padding:6px 2px}
.gfx-sl output{min-width:52px;text-align:right;font-variant-numeric:tabular-nums;font-weight:700}
.gfx-range{flex:1;height:44px;accent-color:var(--p-ac);margin:0}
.gfx-sws{display:flex;flex-wrap:wrap;gap:10px}
.gfx-sw{width:48px;height:48px;border-radius:50%;border:3px solid transparent;cursor:pointer;padding:0;box-shadow:0 0 0 2px var(--p-line)}
.gfx-sw[aria-pressed=true]{border-color:var(--p-bg);box-shadow:0 0 0 4px var(--p-fg)}
.gfx-prev{margin-top:8px;padding:12px;border-radius:14px;background:var(--p-card);font-size:calc(1em * var(--gfx-font,1))}
.gfx-reset{margin-top:22px;width:100%;min-height:52px;border:2px dashed var(--p-mut);border-radius:14px;background:transparent;color:var(--p-fg);font:inherit;font-weight:700;cursor:pointer}
@keyframes gfx-fade{from{opacity:0}to{opacity:1}}@keyframes gfx-up{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.gfx-back,.gfx-panel{animation:none}}
html[data-reduce="1"] .gfx-back,html[data-reduce="1"] .gfx-panel{animation:none}
`;

export function openSettingsPanel(opts = {}) {
  const doc = globalThis.document;
  if (!doc) return { close() {} };
  const old = doc.querySelector('.gfx-back'); if (old && old._gfxClose) old._gfxClose();
  const toast = typeof opts.toast === 'function' ? opts.toast : () => {};
  const style = doc.createElement('style'); style.id = 'gfx-panel-style'; style.textContent = CSS; (doc.head || doc.documentElement).appendChild(style);
  const back = doc.createElement('div'); back.className = 'gfx-back';
  const panel = doc.createElement('div'); panel.className = 'gfx-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', opts.title || 'Instellingen');
  back.appendChild(panel);

  const el = (tag, cls, txt) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const sec = (title) => { const s = el('div', 'gfx-sec'); s.appendChild(el('h3', '', title)); panel.appendChild(s); return s; };
  const refreshers = [];

  const head = el('div', 'gfx-head'); head.appendChild(el('h2', '', opts.title || 'Instellingen'));
  const x = el('button', 'gfx-x', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'Sluiten'); head.appendChild(x); panel.appendChild(head);

  function choice(parent, cols, items, key, onPick) { // knoppenrij met aria-pressed
    const row = el('div', 'gfx-row c' + cols); parent.appendChild(row);
    const btns = items.map(([val, label, sub]) => {
      const b = el('button', 'gfx-opt'); b.type = 'button'; b.appendChild(el('b', '', label)); if (sub) b.appendChild(el('small', '', sub));
      b.addEventListener('click', () => { Settings.set({ [key]: val }); if (onPick) onPick(val); });
      row.appendChild(b); return [val, b];
    });
    refreshers.push((s) => btns.forEach(([v, b]) => b.setAttribute('aria-pressed', String(s[key] === v))));
  }
  function toggle(parent, key, label, sub, onTxt) {
    const b = el('button', 'gfx-tog'); b.type = 'button'; b.setAttribute('role', 'switch');
    const l = el('span'); l.appendChild(el('b', '', label)); if (sub) l.appendChild(el('small', '', sub)); b.appendChild(l); b.appendChild(el('span', 'gfx-sw-t'));
    b.addEventListener('click', () => { const v = !Settings.get()[key]; Settings.set({ [key]: v }); if (onTxt) toast(onTxt(v)); });
    parent.appendChild(b); refreshers.push((s) => b.setAttribute('aria-checked', String(!!s[key])));
  }
  function slider(parent, key, min, max, step, label) {
    const w = el('label', 'gfx-sl'); const r = el('input', 'gfx-range'); r.type = 'range'; r.min = min; r.max = max; r.step = step; r.setAttribute('aria-label', label);
    const o = el('output'); const a1 = el('span', '', 'A'), a2 = el('span', '', 'A'); a1.style.fontSize = '.85em'; a2.style.fontSize = '1.4em';
    w.appendChild(a1); w.appendChild(r); w.appendChild(a2); w.appendChild(o);
    r.addEventListener('input', () => Settings.set({ [key]: +r.value }));
    parent.appendChild(w); refreshers.push((s) => { if (+r.value !== s[key]) r.value = s[key]; o.textContent = Math.round(s[key] * 100) + '%'; });
  }

  let s = sec('Kwaliteit'); choice(s, 3, QUALITY, 'quality');
  s = sec('Grootte van de interface'); slider(s, 'uiScale', 0.9, 1.5, 0.05, 'Schaal van de interface');
  s = sec('Tekstgrootte'); slider(s, 'fontScale', 0.85, 1.6, 0.05, 'Tekstgrootte'); const pv = el('div', 'gfx-prev', 'Zo groot wordt de tekst. Kun je dit goed lezen?'); s.appendChild(pv);
  s = sec('Geluid'); toggle(s, 'sound', 'Geluid', 'Geluidseffecten en spraak'); toggle(s, 'music', 'Muziek', 'Achtergrondmuziek');
  s = sec('Beweging'); toggle(s, 'reduceMotion', 'Minder beweging', 'Rustiger: geen schuddende of vliegende dingen');
  s = sec('Kleurenblind-stand'); choice(s, 2, CB.map(([v, l, d]) => [v, l, d]), 'colorblind');
  s = sec('Thema'); choice(s, 3, THEMES, 'theme');
  s = sec('Accentkleur');
  const sws = el('div', 'gfx-sws'); s.appendChild(sws);
  const swb = ACCENTS.map(([col, nm]) => { const b = el('button', 'gfx-sw'); b.type = 'button'; b.style.background = col; b.setAttribute('aria-label', nm); b.title = nm; b.addEventListener('click', () => Settings.set({ accent: col })); sws.appendChild(b); return [col, b]; });
  refreshers.push((st) => swb.forEach(([c, b]) => b.setAttribute('aria-pressed', String(st.accent.toLowerCase() === c))));
  const reset = el('button', 'gfx-reset', 'Terug naar standaard'); reset.type = 'button';
  reset.addEventListener('click', () => { Settings.reset(); toast('Instellingen teruggezet'); });
  panel.appendChild(reset);

  const refresh = (st) => refreshers.forEach((f) => f(st));
  refresh(Settings.get());
  const off = Settings.onChange(refresh);

  let closed = false, prevFocus = doc.activeElement;
  function close() {
    if (closed) return; closed = true; off();
    doc.removeEventListener('keydown', onKey, true);
    try { back.remove(); } catch { /* stil */ } try { style.remove(); } catch { /* stil */ }
    if (prevFocus && prevFocus.focus) try { prevFocus.focus(); } catch { /* stil */ }
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key === 'Tab') { // focus-val
      const f = [...panel.querySelectorAll('button,input')]; if (!f.length) return;
      const first = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); lastEl.focus(); } else if (!e.shiftKey && doc.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    }
  }
  back._gfxClose = close;
  x.addEventListener('click', close);
  back.addEventListener('click', (e) => { if (e.target === back) close(); });
  doc.addEventListener('keydown', onKey, true);
  doc.body.appendChild(back);
  try { x.focus(); } catch { /* stil */ }
  return { close };
}
