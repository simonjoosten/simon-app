// Learn Spel: dezelfde kit-maker als in Learn Study, maar vanuit de spel-hub (zelf kits maken, bewerken en importeren).
import * as C from './core.js?v=1';
import { h, injectCss, CSS } from './study-ui.js?v=2';

// S: { toast(msg), snd(name), onChange() }
function host(o) {
  const removeCss = injectCss('kitmaker', CSS);
  const screens = new Set();
  const S = {
    C, rand: Math.random,
    toast: o.toast, snd: o.snd || (() => {}),
    refresh() { try { o.onChange && o.onChange(); } catch (e) { /* ok */ } },
    screen(title) {
      const topT = h('div', { class: 't' }, title);
      const body = h('div', { class: 'ls-sess-body' });
      const scr = {
        el: null, body, closed: false, guard: null,
        title(t) { topT.textContent = t; },
        close() {
          if (scr.closed) return; scr.closed = true;
          if (scr.el.parentNode) scr.el.parentNode.removeChild(scr.el);
          screens.delete(scr); if (!screens.size) removeCss(); S.refresh();
        },
      };
      scr.el = h('div', { class: 'ls-sess ls-root' },
        h('div', { class: 'ls-sess-top' }, h('button', { class: 'ls-btn sm', 'aria-label': 'Sluiten', onclick: () => { if (scr.guard && !scr.guard()) return; scr.close(); } }, '✕'), topT, h('span', { style: { width: '34px' } })),
        h('div', { class: 'ls-sess-prog' }, h('i')), body);
      screens.add(scr); document.body.appendChild(scr.el); return scr;
    },
  };
  return S;
}

export async function openKitMaker(o, opts) {
  const { openMaker } = await import('./study-maker.js?v=2');
  return openMaker(host(o), opts || {});
}
export async function openKitImport(o) {
  const { openImportCode } = await import('./study-maker.js?v=2');
  return openImportCode(host(o));
}
export async function removeKit(id) { C.Kits.remove(id); }
