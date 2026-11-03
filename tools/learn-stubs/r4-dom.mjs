// Ronde 4: breidt de nep-DOM van dom-mock-c.mjs uit met een kleine HTML-parser voor innerHTML (de R4-spellen bouwen hun UI met innerHTML)
// en met [attr]-selectors. Alleen voor tests.
import { El, install } from './dom-mock-c.mjs';
export * from './dom-mock-c.mjs';
const VOID = new Set(['img', 'br', 'input', 'hr']);
function parse(html) {
  const root = new El('#frag'); const stack = [root]; const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>|([^<]+)/g; let m;
  while ((m = re.exec(html))) {
    if (m[4] !== undefined) { const t = new El('#text'); t._t = m[4].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"); stack[stack.length - 1].appendChild(t); continue; }
    const tag = m[2].toLowerCase();
    if (m[1]) { for (let i = stack.length - 1; i > 0; i--) if (stack[i].tagName.toLowerCase() === tag) { stack.length = i; break; } continue; }
    const el = new El(tag); const attrs = m[3] || ''; let am; const are = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
    while ((am = are.exec(attrs))) { const k = am[1], v = am[2] ?? am[3] ?? am[4] ?? ''; if (k === 'class') el.className = v; else if (k === 'disabled') el.disabled = true; else el.setAttribute(k, v); }
    stack[stack.length - 1].appendChild(el);
    if (!VOID.has(tag) && !/\/\s*$/.test(attrs)) stack.push(el);
  }
  return root.children;
}
let patched = false;
export function installR4() {
  install();
  if (patched) return; patched = true;
  Object.defineProperty(El.prototype, 'innerHTML', {
    configurable: true,
    get() { return this._t + this.children.map((c) => (c.tagName === '#TEXT' ? c._t : c.innerHTML)).join(''); },
    set(v) { this.children = []; this._t = ''; for (const c of parse(String(v))) this.appendChild(c); },
  });
  Object.defineProperty(El.prototype, 'textContent', {
    configurable: true,
    get() { return this._t + this.children.map((c) => c.textContent).join(''); },
    set(v) { this.children = []; this._t = String(v); },
  });
  const om = El.prototype.matches;
  El.prototype.matches = function (sel) {
    return sel.split(',').some((s) => {
      s = s.trim(); const a = /^\[([^\]=]+)(?:="?([^\]"]*)"?)?\]$/.exec(s);
      if (a) return this.attrs && Object.prototype.hasOwnProperty.call(this.attrs, a[1]) && (a[2] === undefined || this.attrs[a[1]] === a[2]);
      return om.call(this, s);
    });
  };
}
