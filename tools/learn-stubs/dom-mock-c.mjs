// Mini nep-DOM + handmatige klok voor de rooktests van de Learn-spellen (SPELLEN-C)
export const clock = { now: 0, id: 1, timers: new Map(), raf: new Map() };
export class El {
  constructor(tag) { this.tagName = String(tag).toUpperCase(); this.children = []; this.style = {}; this.className = ''; this._t = ''; this.listeners = {}; this.parentNode = null; this.clientWidth = 390; this.clientHeight = 640; this.isConnected = true; this.dataset = {}; this.attrs = {}; this.value = ''; this.disabled = false; this.width = 300; this.height = 300; }
  get textContent() { return this._t + this.children.map(c => c.textContent).join(''); }
  set textContent(v) { this.children = []; this._t = String(v); }
  set innerHTML(v) { this.children = []; this._t = String(v).replace(/<[^>]*>/g, ''); }
  get innerHTML() { return this._t; }
  get classList() { const s = this; return { add: (...c) => { s.className = (s.className + ' ' + c.join(' ')).trim(); }, remove: (...c) => { s.className = s.className.split(/\s+/).filter(x => !c.includes(x)).join(' '); }, contains: c => s.className.split(/\s+/).includes(c), toggle: (c, f) => { const h = s.className.split(/\s+/).includes(c); if (f === undefined ? h : !f) this.remove(c); else this.add(c); } }; }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  append(...cs) { cs.forEach(c => { if (typeof c === 'string') { this._t += c; } else this.appendChild(c); }); }
  prepend(c) { c.parentNode = this; this.children.unshift(c); }
  insertBefore(c, r) { c.parentNode = this; const i = this.children.indexOf(r); if (i < 0) this.children.push(c); else this.children.splice(i, 0, c); return c; }
  removeChild(c) { this.children = this.children.filter(x => x !== c); c.parentNode = null; return c; }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); this.isConnected = false; }
  addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }
  removeEventListener(t, f) { this.listeners[t] = (this.listeners[t] || []).filter(x => x !== f); }
  setAttribute(k, v) { this.attrs[k] = v; } getAttribute(k) { return this.attrs[k]; } removeAttribute(k) { delete this.attrs[k]; }
  focus() {} blur() {} setPointerCapture() {} releasePointerCapture() {} scrollIntoView() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: 300, height: 300, right: 300, bottom: 300 }; }
  getContext() { return ctxProxy(); }
  cloneNode() { return new El(this.tagName); }
  contains(x) { return x === this || this.children.some(c => c.contains && c.contains(x)); }
  fire(type, ev = {}) { const e = Object.assign({ target: this, currentTarget: this, preventDefault() {}, stopPropagation() {}, clientX: 5, clientY: 5, touches: [{ clientX: 5, clientY: 5 }], changedTouches: [{ clientX: 5, clientY: 5 }], pointerId: 1 }, ev); if (typeof this['on' + type] === 'function') this['on' + type](e); (this.listeners[type] || []).slice().forEach(f => f(e)); }
  click() { if (!this.disabled) this.fire('click'); }
  matches(sel) { return sel.split(',').some(s => { s = s.trim(); if (s[0] === '.') return this.className.split(/\s+/).includes(s.slice(1)); if (s[0] === '#') return false; return this.tagName === s.toUpperCase(); }); }
  querySelectorAll(sel) { const out = []; const w = n => { n.children.forEach(c => { if (c.matches(sel)) out.push(c); w(c); }); }; w(this); return out; }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}
export function walk(n, f) { f(n); n.children.forEach(c => walk(c, f)); }
export function findAll(n, pred) { const o = []; walk(n, x => { if (pred(x)) o.push(x); }); return o; }
export function byClass(n, cls) { return findAll(n, x => x.className.split(/\s+/).some(c => c === cls || c.endsWith(cls))); }
export function visible(n) { for (let x = n; x; x = x.parentNode) if (x.style && x.style.display === 'none') return false; return true; }
function ctxProxy() {
  const store = {};
  const grad = () => ({ addColorStop() {} });
  return new Proxy(store, { get(t, p) { if (p in t) return t[p]; if (p === 'createLinearGradient' || p === 'createRadialGradient') return grad; if (p === 'measureText') return () => ({ width: 10 }); if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) }); return () => {}; }, set(t, p, v) { t[p] = v; return true; } });
}
let installed = false;
export function install() {
  if (installed) return; installed = true;
  const doc = new El('#doc'); const head = new El('head'), body = new El('body');
  const d = { head, body, createElement: t => new El(t), createElementNS: (n, t) => new El(t), createTextNode: t => { const e = new El('#text'); e._t = t; return e; }, addEventListener(t, f) { (d.l[t] = d.l[t] || []).push(f); }, removeEventListener(t, f) { d.l[t] = (d.l[t] || []).filter(x => x !== f); }, l: {}, querySelector: () => null, getElementById: () => null, activeElement: null, hidden: false, documentElement: new El('html') };
  d.keydown = (key) => (d.l.keydown || []).slice().forEach(f => f({ key, preventDefault() {} }));
  globalThis.document = d;
  globalThis.window = globalThis; globalThis.devicePixelRatio = 1;
  Object.defineProperty(globalThis, 'performance', { value: { now: () => clock.now }, configurable: true, writable: true });
  globalThis.requestAnimationFrame = f => { const id = clock.id++; clock.raf.set(id, f); return id; };
  globalThis.cancelAnimationFrame = id => clock.raf.delete(id);
  globalThis.setTimeout = (f, ms = 0) => { const id = clock.id++; clock.timers.set(id, { f, at: clock.now + Math.max(0, ms), every: 0 }); return id; };
  globalThis.setInterval = (f, ms = 0) => { const id = clock.id++; clock.timers.set(id, { f, at: clock.now + Math.max(1, ms), every: Math.max(1, ms) }); return id; };
  globalThis.clearTimeout = globalThis.clearInterval = id => { clock.timers.delete(id); };
  globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  try { Object.defineProperty(globalThis, 'navigator', { value: { vibrate() {} }, configurable: true, writable: true }); } catch (e) {}
  globalThis.AudioContext = undefined;
}
export async function advance(ms, step = 16) {
  const end = clock.now + ms;
  while (clock.now < end) {
    clock.now = Math.min(end, clock.now + step);
    for (const [id, t] of [...clock.timers]) { if (t.at <= clock.now && clock.timers.has(id)) { if (t.every) t.at += t.every; else clock.timers.delete(id); t.f(); } }
    const rs = [...clock.raf]; clock.raf.clear(); rs.forEach(([, f]) => f(clock.now));
    await Promise.resolve(); await Promise.resolve();
  }
}
export const pending = () => clock.timers.size + clock.raf.size;
// nep-env voor een spel; askFn(q) -> {ok,ms} (sync of async)
export function mkEnv(o = {}) {
  const qs = o.qs || [
    { t: 'mc', q: 'Hoeveel is 2+3?', a: '5', o: ['4', '5', '6', '7'], d: 1 }, { t: 'tf', q: 'De zon is een ster', a: true },
    { t: 'type', q: 'Hoofdstad van Frankrijk?', a: 'Parijs' }, { t: 'num', q: '6 x 7 = ?', a: 42 },
    { t: 'mc', q: 'Welk dier blaft?', a: 'hond', o: ['kat', 'hond', 'vis', 'koe'] }, { t: 'fill', q: 'De ___ schijnt', a: 'zon', o: ['maan', 'zon', 'ster', 'wolk'] },
    { t: 'order', q: 'Zet op volgorde', a: ['1', '2', '3'] }, { t: 'multi', q: 'Kies de dieren', o: ['hond', 'stoel', 'kat', 'tafel'], a: ['hond', 'kat'] }];
  let i = 0; const reports = []; const ends = []; const asked = [];
  const env = {
    kit: { qs }, uid: 'u', name: 'Test', seed: o.seed || 7, level: o.level || 2, w: 390, h: 640, fx: o.fx || { startCash: 0, cashMult: 1, streakBonus: 0, extraLives: 0, timeBonus: 0, hints: 0, shield: 0, luck: 0 },
    pick: (n) => { const out = []; for (let k = 0; k < n; k++) out.push(qs[(i++) % qs.length]); return out; },
    ask: (host, q, op) => { asked.push({ q, op }); const r = (o.answer ? o.answer(q) : { ok: true }); const res = Object.assign({ ms: 1500, given: null }, r); return { promise: new Promise(res2 => setTimeout(() => res2(res), o.askDelay ?? 50)), cancel() {} }; },
    snd: { play() {} }, tts: { speak() { return Promise.resolve(); }, stop() {} }, rand: (() => { let s = (o.seed || 7) >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })(),
    report: r => reports.push(r), end: r => ends.push(r), reports, ends, asked
  };
  return env;
}
