// Mini-DOM voor de tests van docs/learn/q.js (agent KERN). Geen jsdom nodig. Ondersteunt alleen wat q.js gebruikt.
class Text {
  constructor(d) { this.nodeType = 3; this.data = String(d); this.parentNode = null; }
  get textContent() { return this.data; }
  get isConnected() { return !!this.parentNode && this.parentNode.isConnected; }
}
export class El {
  constructor(tag, doc, ns) {
    this.nodeType = 1; this.tagName = String(tag).toUpperCase(); this.ownerDocument = doc; this.ns = ns || null;
    this.childNodes = []; this.parentNode = null; this.attrs = {}; this.listeners = {}; this._cn = '';
    this.value = ''; this.disabled = false;
    const props = {};
    this.style = { setProperty: (k, v) => { props[k] = String(v); }, getPropertyValue: (k) => props[k] || '', removeProperty: (k) => { delete props[k]; }, _p: props };
  }
  get className() { return this._cn; }
  set className(v) { this._cn = String(v); }
  get children() { return this.childNodes.filter((c) => c.nodeType === 1); }
  get firstChild() { return this.childNodes[0] || null; }
  get lastChild() { return this.childNodes[this.childNodes.length - 1] || null; }
  get isConnected() { let n = this; while (n) { if (n === this.ownerDocument.documentElement) return true; n = n.parentNode; } return false; }
  appendChild(c) { if (c.parentNode) c.parentNode.removeChild(c); c.parentNode = this; this.childNodes.push(c); return c; }
  insertBefore(c, ref) { if (c.parentNode) c.parentNode.removeChild(c); c.parentNode = this; const i = ref ? this.childNodes.indexOf(ref) : -1; if (i < 0) this.childNodes.push(c); else this.childNodes.splice(i, 0, c); return c; }
  removeChild(c) { const i = this.childNodes.indexOf(c); if (i >= 0) { this.childNodes.splice(i, 1); c.parentNode = null; } return c; }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'disabled') this.disabled = true; if (k === 'class') this._cn = String(v); }
  removeAttribute(k) { delete this.attrs[k]; if (k === 'disabled') this.disabled = false; }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  hasAttribute(k) { return k in this.attrs; }
  get textContent() { return this.childNodes.map((c) => c.textContent).join(''); }
  set textContent(v) { this.childNodes.forEach((c) => { c.parentNode = null; }); this.childNodes = []; if (v !== '' && v !== null && v !== undefined) this.appendChild(new Text(v)); }
  addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }
  removeEventListener(t, f) { this.listeners[t] = (this.listeners[t] || []).filter((x) => x !== f); }
  focus() { this.ownerDocument.activeElement = this; }
  click() { if (this.disabled) return; fire(this, 'click'); }
  getBoundingClientRect() { const i = this.parentNode ? this.parentNode.childNodes.indexOf(this) : 0; return { left: 10, right: 310, top: i * 60, bottom: i * 60 + 52, width: 300, height: 52 }; }
  querySelectorAll(sel) { const out = []; const test = sel.startsWith('.') ? (e) => (' ' + e._cn + ' ').includes(' ' + sel.slice(1) + ' ') : (e) => e.tagName === sel.toUpperCase(); const walk = (n) => { for (const c of n.childNodes) if (c.nodeType === 1) { if (test(c)) out.push(c); walk(c); } }; walk(this); return out; }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}
export function fire(el, type, props = {}) {
  const ev = { type, target: el, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this._stop = true; }, key: '', clientX: 0, clientY: 0, ...props };
  let n = el;
  while (n) {
    ev.currentTarget = n;
    for (const f of [...((n.listeners && n.listeners[type]) || [])]) f(ev);
    if (ev._stop) return ev;
    n = n.parentNode;
  }
  const d = el.ownerDocument;
  if (d) for (const f of [...(d.listeners[type] || [])]) f(ev);
  return ev;
}
export function installDom() {
  const doc = {
    listeners: {}, hidden: false, activeElement: null,
    createElement: (t) => new El(t, doc), createElementNS: (ns, t) => new El(t, doc, ns), createTextNode: (s) => new Text(s),
    addEventListener: (t, f) => { (doc.listeners[t] = doc.listeners[t] || []).push(f); },
    removeEventListener: (t, f) => { doc.listeners[t] = (doc.listeners[t] || []).filter((x) => x !== f); },
    getElementById: (id) => { const w = (n) => { for (const c of n.childNodes) if (c.nodeType === 1) { if (c.attrs.id === id || c.id === id) return c; const r = w(c); if (r) return r; } return null; }; return w(doc.documentElement); },
  };
  doc.documentElement = new El('html', doc);
  doc.head = doc.documentElement.appendChild(new El('head', doc));
  doc.body = doc.documentElement.appendChild(new El('body', doc));
  const origHeadAppend = doc.head.appendChild.bind(doc.head);
  doc.head.appendChild = (c) => { if (c.id === undefined && c.attrs) c.id = c.attrs.id; return origHeadAppend(c); };
  globalThis.document = doc;
  const wl = {};
  globalThis.window = globalThis;
  globalThis.addEventListener = (t, f) => { (wl[t] = wl[t] || []).push(f); };
  globalThis.removeEventListener = (t, f) => { wl[t] = (wl[t] || []).filter((x) => x !== f); };
  return { doc, windowListeners: wl };
}
export const allEls = (root) => { const out = []; const w = (n) => { for (const c of n.childNodes) if (c.nodeType === 1) { out.push(c); w(c); } }; w(root); return out; };
export const byClass = (root, cls) => allEls(root).filter((e) => (' ' + e.className + ' ').includes(' ' + cls + ' '));
export const hasClass = (el, cls) => (' ' + el.className + ' ').includes(' ' + cls + ' ');
