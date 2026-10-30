// Heel kleine nep-DOM voor rooktests (geen jsdom nodig).
export function installDom() {
  const timers = []; const realST = globalThis.setTimeout;
  globalThis.setTimeout = (f, ms, ...a) => realST(f, Math.min(ms || 0, 5), ...a);
  class Node { constructor() { this.childNodes = []; this.parentNode = null; } get firstChild() { return this.childNodes[0] || null; } appendChild(c) { if (c.parentNode) c.parentNode.removeChild(c); c.parentNode = this; this.childNodes.push(c); return c; } removeChild(c) { const i = this.childNodes.indexOf(c); if (i >= 0) { this.childNodes.splice(i, 1); c.parentNode = null; } return c; } get children() { return this.childNodes.filter((c) => c.nodeType === 1); } }
  class Text extends Node { constructor(t) { super(); this.nodeType = 3; this.data = String(t); } get textContent() { return this.data; } set textContent(v) { this.data = String(v); } }
  class El extends Node {
    constructor(tag, ns) { super(); this.nodeType = 1; this.tagName = String(tag).toUpperCase(); this.attrs = {}; this.style = {}; this.listeners = {}; this.className = ''; this.value = ''; this.checked = false; this.disabled = false; this.namespace = ns;
      const self = this; this.classList = { add: (c) => { if (!self.classList.contains(c)) self.className = (self.className + ' ' + c).trim(); }, remove: (c) => { self.className = self.className.split(/\s+/).filter((x) => x && x !== c).join(' '); }, contains: (c) => self.className.split(/\s+/).includes(c), toggle(c) { if (self.classList.contains(c)) self.classList.remove(c); else self.classList.add(c); } }; }
    setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'class') this.className = String(v); if (k === 'id') this.id = String(v); } getAttribute(k) { return this.attrs[k]; }
    get textContent() { return this.childNodes.map((c) => c.textContent).join(''); }
    set textContent(v) { this.childNodes = []; if (v !== '' && v != null) this.appendChild(new Text(v)); }
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); } removeEventListener(t, f) { this.listeners[t] = (this.listeners[t] || []).filter((x) => x !== f); }
    dispatch(t, ev = {}) { const e = { type: t, target: this, key: ev.key, clientX: 0, preventDefault() {}, stopPropagation() {}, ...ev }; (this.listeners[t] || []).slice().forEach((f) => f(e)); }
    click() { if (!this.disabled) this.dispatch('click'); } focus() {} select() {} scrollIntoView() {}
    querySelector(sel) { const all = this.querySelectorAll(sel); return all[0] || null; }
    querySelectorAll(sel) { const out = []; const test = sel[0] === '#' ? (e) => e.id === sel.slice(1) : sel[0] === '.' ? (e) => e.classList.contains(sel.slice(1)) : (e) => e.tagName === sel.toUpperCase(); const walk = (n) => { for (const c of n.childNodes) if (c.nodeType === 1) { if (test(c)) out.push(c); walk(c); } }; walk(this); return out; }
  }
  const body = new El('body'), head = new El('head'), html = new El('html'); html.appendChild(head); html.appendChild(body);
  const docListeners = {};
  globalThis.document = { body, head, documentElement: html, createElement: (t) => new El(t), createElementNS: (ns, t) => new El(t, ns), createTextNode: (t) => new Text(t),
    addEventListener: (t, f) => { (docListeners[t] = docListeners[t] || []).push(f); }, removeEventListener: (t, f) => { docListeners[t] = (docListeners[t] || []).filter((x) => x !== f); }, execCommand: () => true };
  globalThis.__docListeners = docListeners;
  const store = new Map(); globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  Object.defineProperty(globalThis, 'navigator', { value: { clipboard: { writeText: async (t) => { globalThis.__clip = t; } } }, configurable: true });
  return { body, El, Text, findAll(root, pred) { const out = []; const walk = (n) => { if (n.nodeType === 1 && pred(n)) out.push(n); (n.childNodes || []).forEach(walk); }; walk(root); return out; } };
}
