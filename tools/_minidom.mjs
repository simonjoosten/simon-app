// Minimale DOM voor node-tests van de gereedschaps-apps (HTML-parser, selectors, events, nep-timers, nep-canvas). Geen browser nodig.
const VOID = new Set(['br', 'img', 'input', 'hr', 'meta', 'link']);
const dec = (s) => s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

export class El {
  constructor(tag) { this.tag = tag; this.attrs = {}; this.children = []; this.parent = null; this.style = new Proxy({}, { set(o, k, v) { o[k] = v; return true; }, get(o, k) { if (k === 'setProperty') return (a, b) => { o[a] = b; }; if (k === 'cssText') return o.__css || ''; return o[k]; } }); this.ls = {}; this._text = null; this.id = ''; this.className = ''; this._val = undefined; this.checked = false; this.disabled = false; this.isText = false; }
  get value() { if (this._val !== undefined) return this._val; if (this.tag === 'select') { const o = this.all().filter((e) => e.tag === 'option'), sel = o.find((x) => 'selected' in x.attrs) || o[0]; return sel ? (sel.attrs.value ?? sel.textContent) : ''; } return this.attrs.value ?? ''; }
  set value(v) { this._val = String(v); }
  get isConnected() { let p = this; while (p) { if (p === document.documentElement) return true; p = p.parent; } return false; }
  get classList() { const self = this; const arr = () => self.className.split(/\s+/).filter(Boolean); return { add: (c) => { if (!arr().includes(c)) self.className = [...arr(), c].join(' '); }, remove: (c) => { self.className = arr().filter((x) => x !== c).join(' '); }, toggle: (c, force) => { const has = arr().includes(c), want = force === undefined ? !has : !!force; if (want && !has) self.className = [...arr(), c].join(' '); if (!want && has) self.className = arr().filter((x) => x !== c).join(' '); return want; }, contains: (c) => arr().includes(c) }; }
  get dataset() { const o = {}; for (const [k, v] of Object.entries(this.attrs)) if (k.startsWith('data-')) o[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v; return o; }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'class') this.className = String(v); if (k === 'id') this.id = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; } removeAttribute(k) { delete this.attrs[k]; }
  appendChild(c) { if (c.parent) c.parent.children = c.parent.children.filter((x) => x !== c); c.parent = this; this.children.push(c); return c; }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parent = null; }
  remove() { if (this.parent) this.parent.removeChild(this); }
  addEventListener(t, f) { (this.ls[t] ||= []).push(f); } removeEventListener(t, f) { this.ls[t] = (this.ls[t] || []).filter((x) => x !== f); }
  dispatch(t, e = {}) { (this.ls[t] || []).slice().forEach((f) => f({ target: this, preventDefault() {}, stopPropagation() {}, ...e })); }
  get textContent() { return this.isText ? this._text : this.children.map((c) => c.textContent).join(''); }
  set textContent(v) { this.children = []; if (v !== '' && v != null) { const t = new El('#text'); t.isText = true; t._text = String(v); this.appendChild(t); } }
  get innerHTML() { return this._html || ''; }
  set innerHTML(h) { this._html = String(h); this.children = []; parseInto(this, String(h)); }
  insertAdjacentHTML(pos, h) { const tmp = new El('div'); parseInto(tmp, h); const kids = tmp.children; kids.forEach((k) => { k.parent = this; }); if (pos === 'afterbegin') this.children.unshift(...kids); else this.children.push(...kids); }
  all() { const out = []; const walk = (n) => n.children.forEach((c) => { if (!c.isText) { out.push(c); walk(c); } }); walk(this); return out; }
  querySelectorAll(sel) { return sel.split(',').flatMap((s) => this.all().filter((e) => matchDesc(e, s.trim(), this))); }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  getElementById(id) { return this.all().find((e) => e.id === id) || null; }
  getContext() { return mkCtx(); }
  focus() {} blur() {} scrollIntoView() {} select() {}
  get offsetWidth() { return 100; } get clientWidth() { return 360; } get clientHeight() { return 200; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 360, height: 200 }; }
  click() { this.onclick && this.onclick({ target: this, preventDefault() {} }); this.dispatch('click'); }
}
function compound(e, c) {
  const re = /([#.][\w-]+|\[[^\]]+\]|^[\w*-]+)/g; let m, ok = true;
  const parts = c.match(re) || [];
  for (const p of parts) {
    if (p[0] === '#') ok = ok && e.id === p.slice(1);
    else if (p[0] === '.') ok = ok && e.className.split(/\s+/).includes(p.slice(1));
    else if (p[0] === '[') { const mm = /^\[([\w-]+)(?:="?([^"\]]*)"?)?\]$/.exec(p); ok = ok && mm && mm[1] in e.attrs && (mm[2] == null || e.attrs[mm[1]] === mm[2]); }
    else ok = ok && (p === '*' || e.tag === p);
  }
  return ok && parts.length > 0;
}
function matchDesc(e, sel, scope) {
  const parts = sel.split(/\s+/).filter((p) => p && p !== '>');
  if (!compound(e, parts[parts.length - 1])) return false;
  let i = parts.length - 2, p = e.parent;
  while (i >= 0 && p && p !== scope.parent) { if (compound(p, parts[i])) i--; p = p.parent; }
  return i < 0;
}
function parseInto(parent, html) {
  const re = /<!--[\s\S]*?-->|<\/([\w-]+)>|<([\w-]+)((?:\s+[\w:-]+(?:=(?:"[^"]*"|'[^']*'))?)*)\s*(\/?)>|([^<]+)/g;
  const stack = [parent]; let m;
  while ((m = re.exec(html))) {
    const top = stack[stack.length - 1];
    if (m[5] != null) { const t = new El('#text'); t.isText = true; t._text = dec(m[5]); top.appendChild(t); }
    else if (m[1]) { for (let i = stack.length - 1; i > 0; i--) if (stack[i].tag === m[1]) { stack.length = i; break; } }
    else if (m[2]) {
      const e = new El(m[2].toLowerCase()); const ar = /([\w:-]+)(?:=(?:"([^"]*)"|'([^']*)'))?/g; let a;
      while ((a = ar.exec(m[3] || ''))) { const v = a[2] != null ? dec(a[2]) : a[3] != null ? dec(a[3]) : ''; e.attrs[a[1]] = v; if (a[1] === 'class') e.className = v; if (a[1] === 'id') e.id = v; if (a[1] === 'checked') e.checked = true; if (a[1] === 'disabled') e.disabled = true; if (a[1] === 'style') e.style.__css = v; }
      top.appendChild(e); if (!m[4] && !VOID.has(e.tag)) stack.push(e);
    }
  }
}
export function mkCtx() {
  const calls = { n: 0 }; const log = [];
  const base = { measureText: (t) => ({ width: String(t).length * 8 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }), createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }) };
  return new Proxy(calls, { get: (o, k) => (k in base ? base[k] : k === '__n' ? o.n : k === '__log' ? log : k in o && k !== 'n' ? o[k] : (...a) => { o.n++; if (typeof k === 'string' && (k === 'fillText')) log.push(String(a[0])); }), set: (o, k, v) => { o[k] = v; return true; } });
}

export function install() {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  const html = new El('html'), body = new El('body'), head = new El('head'); html.appendChild(head); html.appendChild(body);
  const dl = {};
  globalThis.document = { documentElement: html, body, head, createElement: (t) => new El(t), getElementById: (id) => html.getElementById(id), querySelector: (s) => html.querySelector(s), querySelectorAll: (s) => html.querySelectorAll(s), addEventListener: (t, f) => (dl[t] ||= []).push(f), removeEventListener: (t, f) => { dl[t] = (dl[t] || []).filter((x) => x !== f); }, fire: (t, e = {}) => (dl[t] || []).slice().forEach((f) => f({ target: body, preventDefault() {}, ...e })), listeners: dl, hidden: false };
  globalThis.window = Object.assign(globalThis, { scrollTo() {}, addEventListener: (t, f) => (dl['w:' + t] ||= []).push(f), removeEventListener: (t, f) => { dl['w:' + t] = (dl['w:' + t] || []).filter((x) => x !== f); }, matchMedia: () => ({ matches: false, addEventListener() {} }), devicePixelRatio: 1, innerWidth: 390, innerHeight: 800 });
  try { Object.defineProperty(globalThis, 'navigator', { value: { geolocation: undefined, vibrate() {}, hardwareConcurrency: 4, userAgent: 'node-test' }, configurable: true }); } catch { /* al gezet */ }
  globalThis.Image = class { set src(v) { this._s = v; setTimeout(() => this.onerror && this.onerror(), 0); } };
  globalThis.getComputedStyle = () => ({ position: 'static' });
  globalThis.AudioContext = undefined;
  // nep-timers + nep-klok
  let now = 1_760_000_000_000, id = 0; const timers = new Map(); const rafs = [];
  const realST = globalThis.setTimeout;
  Date.now = () => now; try { globalThis.performance.now = () => now - 1_760_000_000_000; } catch { /* stil */ }
  globalThis.fetch = async (u) => { (T.fetches ||= []).push(String(u)); const h = T.fetchHandler; if (h) return h(String(u)); return { ok: false, status: 503, json: async () => ({}) }; };
  globalThis.setTimeout = (fn, ms = 0) => { const i = ++id; timers.set(i, { fn, at: now + ms, every: 0 }); return i; };
  globalThis.setInterval = (fn, ms = 0) => { const i = ++id; timers.set(i, { fn, at: now + Math.max(1, ms), every: Math.max(1, ms) }); return i; };
  globalThis.clearTimeout = globalThis.clearInterval = (i) => { timers.delete(i); };
  globalThis.requestAnimationFrame = (fn) => { rafs.push(fn); return rafs.length; }; globalThis.cancelAnimationFrame = () => {};
  const T = {
    now: () => now, setNow(t) { now = t; },
    advance(ms, step = 50) { const end = now + ms; while (now < end) { now = Math.min(end, now + step); for (const [i, t] of [...timers]) if (timers.has(i) && t.at <= now) { if (t.every) t.at += t.every; else timers.delete(i); try { t.fn(); } catch (e) { T.errors.push(e); throw e; } } this.frames(1); } },
    frames(n = 1) { for (let k = 0; k < n; k++) { const q = rafs.splice(0); q.forEach((f) => f(now)); } },
    pending: () => timers.size, errors: [], store, realST,
  };
  return { document: globalThis.document, body, html, T, store };
}
export const find = (root, sel) => root.querySelector(sel);
export const click = (el) => { if (!el) throw new Error('klik op niets'); if (el.disabled) return; el.onclick ? el.onclick({ target: el, preventDefault() {} }) : el.dispatch('click'); };
