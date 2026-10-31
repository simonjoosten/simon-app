// Fotostudio: één app met drie onderdelen. Foto bewerken, Collage genereren (50 stijlen) en Collage zelf maken.
// Elk onderdeel is een eigen module die pas geladen wordt als je erop tikt. Foto's blijven op je eigen toestel.

const TABS = [
  ['edit', '🖼️ Bewerken', './foto-edit.js?v=4', 'fotoEditView'],
  ['gen', '✨ Genereer', './foto-collage-gen.js?v=4', 'collageGenView'],
  ['free', '🎨 Zelf maken', './foto-collage-free.js?v=4', 'collageFreeView'],
];

// Op telefoon/tablet alleen image/* vragen: dan biedt iOS/Android 'Fotobibliotheek' en 'Foto maken' aan i.p.v. alleen de bestandenlijst.
window.__fotoAccept = () => {
  const ua = navigator.userAgent || '';
  const touch = /iPhone|iPad|iPod|Android/i.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1);
  return touch ? 'image/*' : 'image/*,.heic,.heif';
};

// HEIC-foto's (uit je fotobibliotheek) kan niet elke browser lezen (Zen/Firefox niet). Dan zetten we ze om naar jpg.
window.__fotoHeic = async (f) => {
  if (!/hei[cf]/i.test((f.type || '') + ' ' + (f.name || ''))) return null;
  try {
    if (!window.heic2any) await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
    const o = await window.heic2any({ blob: f, toType: 'image/jpeg', quality: 0.92 });
    return Array.isArray(o) ? o[0] : o;
  } catch (e) { console.error(e); return null; }
};

// ctx: { view, esc, uid, addCleanup }
export function fotoView(ctx) {
  const { view, esc, uid, addCleanup } = ctx;
  let tab = 'edit', token = 0, cleanups = [], alive = true;
  const style = document.createElement('style');
  style.textContent = `.fs-top{display:flex;gap:6px;margin:0 0 10px;align-items:stretch}.fs-top button{flex:1;padding:calc(.6rem * var(--gfx-scale,1)) .2rem;font-weight:700;font-size:calc(1rem * var(--gfx-font,1));min-height:48px}.fs-top .fs-set{flex:0 0 52px;font-size:1.25rem}
.fs-note{font-size:.8rem;opacity:.65;text-align:center;margin:.2rem 0 .6rem}`;
  document.head.appendChild(style);

  const runCleanups = () => { const c = cleanups; cleanups = []; for (const f of c) { try { f(); } catch { /* ok */ } } };
  addCleanup(() => { alive = false; token++; runCleanups(); style.remove(); });

  async function open(id) {
    tab = id; const my = ++token; runCleanups();
    view.innerHTML = `<div class="fs-top">${TABS.map(([k, l]) => `<button data-t="${k}" class="${k === tab ? 'pri' : ''}">${l}</button>`).join('')}<button class="fs-set" id="fs-set" aria-label="Instellingen" title="Instellingen">⚙️</button></div><div id="fs-body"></div>`;
    view.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => { if (b.dataset.t !== tab) open(b.dataset.t); });
    const gear = view.querySelector('#fs-set');
    if (gear) gear.onclick = async () => { try { const m = await import('./gfx/panel.js?v=1'); m.openSettingsPanel({ title: 'Instellingen Fotostudio' }); } catch (e) { console.error(e); } };
    const body = view.querySelector('#fs-body'); body.innerHTML = '<div class="box center"><small>Laden…</small></div>';
    const [, , path, fn] = TABS.find((t) => t[0] === id);
    try {
      const m = await import(path);
      if (!alive || my !== token) return;
      body.innerHTML = '';
      m[fn]({ view: body, esc, uid, addCleanup: (f) => { if (my === token) cleanups.push(f); else { try { f(); } catch { /* ok */ } } } });
    } catch (e) {
      if (!alive || my !== token) return;
      console.error(e);
      body.innerHTML = '<div class="box err">Dit onderdeel kon niet laden. Ververs de pagina en probeer het opnieuw.</div>';
    }
  }
  open('edit');
}
