// Kleine stub van docs/foto-filters.js (zelfde API) voor tests van foto-edit.js.
const mkc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
export const FILTERS = Array.from({ length: 50 }, (_, i) => ({ id: 'f' + i, name: 'Filter ' + i, group: ['Klassiek', 'Kleur', 'Retro', 'Kunst', 'Fun'][i % 5] }));
export const applyFilter = (c) => c;
export const adjust = (c) => c;
export const blurBrush = () => {};
export const pixelateBrush = () => {};
export const colorPop = (c) => c;
export const hueAt = () => ({ h: 120, s: 0.6, l: 0.5 });
export const tiltShift = (c) => c;
export const doubleExposure = (b) => b;
export const cloneCanvas = (c) => { const n = mkc(c.width, c.height); n.getContext('2d').drawImage(c, 0, 0); return n; };
export const makeThumb = (c, m) => { const k = m / Math.max(c.width, c.height); const n = mkc(Math.round(c.width * k), Math.round(c.height * k)); n.getContext('2d').drawImage(c, 0, 0, n.width, n.height); return n; };
