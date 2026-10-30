// Mini-DOM voor de hub-tests (geen jsdom beschikbaar): innerHTML is een string, querySelector zoekt in die string.
export class El {
  constructor(tag) { this.tag = tag; this._html = ''; this.children = []; this.style = {}; this.dataset = {}; this.className = ''; this.textContent = ''; this.listeners = {}; this.parent = null; this.removed = false; this.cache = new Map(); this.clientWidth = 360; }
  set innerHTML(v) { this._html = String(v); this.children = []; this.cache = new Map(); }
  get innerHTML() { return this._html; }
  appendChild(c) { this.children.push(c); c.parent = this; return c; }
  remove() { this.removed = true; if (this.parent) this.parent.children = this.parent.children.filter((x) => x !== this); }
  addEventListener(t, f) { (this.listeners[t] || (this.listeners[t] = [])).push(f); }
  removeEventListener(t, f) { this.listeners[t] = (this.listeners[t] || []).filter((x) => x !== f); }
  getBoundingClientRect() { return { top: 80, left: 0, width: 360, height: 600 }; }
  has(sel) {
    if (sel.startsWith('.')) { const c = sel.slice(1); return this._html.includes(c) || this.children.some((k) => (k.className || '').includes(c)); }
    const m = /\[data-act="(.+)"\]/.exec(sel); if (m) return this._html.includes(`data-act="${m[1]}"`);
    return false;
  }
  querySelector(sel) {
    if (!this.has(sel)) return null;
    const kid = this.children.find((k) => sel.startsWith('.') && (k.className || '').includes(sel.slice(1)) && !k.removed);
    if (kid) return kid;
    if (!this.cache.has(sel)) this.cache.set(sel, new El('div'));
    return this.cache.get(sel);
  }
  fire(type, ev) { for (const f of this.listeners[type] || []) f(ev); }
}
export const document_ = { head: new El('head'), body: new El('body'), createElement: (t) => new El(t) };
export const win = { scrollY: 0, innerHeight: 800, scrollTo() {}, listeners: {}, addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }, removeEventListener(t, f) { this.listeners[t] = (this.listeners[t] || []).filter((x) => x !== f); } };
export const ls = new Map();
export function install() {
globalThis.document = document_; globalThis.window = win;
globalThis.localStorage = { getItem: (k) => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: (k) => ls.delete(k) };
}

