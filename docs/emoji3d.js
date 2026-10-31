// emoji3d.js - vervangt emoji in een stuk pagina door de echte 3D-iconen (docs/art/3d) waar een icoon bestaat.
// attach3D(root, { selector, size, scale }) -> { stop(), run() }. Alleen emoji die in docs/gfx/icons.js staan EN als PNG bestaan worden vervangen,
// de rest blijft emoji. Werkt op tekst in knoppen, kaarten en titels (geen canvas). Veilig tegen lussen: vervangen tekst bevat geen emoji meer.
import { ICONS } from './gfx/icons.js?v=1';
import { icon, has } from './gfx/art.js?v=1';

const strip = (s) => String(s).replace(/️/g, '');
let REV = null, RX = null;
export function reverseMap() {
  if (REV) return REV;
  REV = new Map();
  for (const [name, e] of Object.entries(ICONS)) { const k = strip(e); if (!REV.has(k) && has(name)) REV.set(k, name); }
  const keys = [...REV.keys()].sort((a, b) => b.length - a.length).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  RX = keys.length ? new RegExp('(' + keys.join('|') + ')\\uFE0F?', 'gu') : null;
  return REV;
}
export const iconForEmoji = (e) => reverseMap().get(strip(e)) || null;

// Splitst tekst in delen: [{t:'tekst'} | {n:'iconnaam'}]. Zuiver (testbaar zonder DOM).
export function splitEmoji(text) {
  reverseMap();
  const out = [];
  if (!RX || !text) return text ? [{ t: String(text) }] : out;
  RX.lastIndex = 0;
  let last = 0, m;
  const s = String(text);
  while ((m = RX.exec(s))) {
    if (m.index > last) out.push({ t: s.slice(last, m.index) });
    out.push({ n: REV.get(strip(m[1])) });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ t: s.slice(last) });
  return out;
}

export function attach3D(root, o = {}) {
  const doc = globalThis.document;
  if (!doc || !root || typeof globalThis.MutationObserver === 'undefined') return { stop() {}, run() {} };
  const sel = o.selector || null;
  let raf = 0, stopped = false, queue = new Set();
  const sizeOf = (el) => {
    let fs = 16;
    try { fs = parseFloat(globalThis.getComputedStyle(el).fontSize) || 16; } catch { /* standaard */ }
    return Math.max(14, Math.round(fs * (o.scale || 1.15)));
  };
  function convertNode(tn) {
    const p = tn.parentNode;
    if (!p || p.nodeType !== 1) return;
    const tag = p.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'OPTION') return;
    if (p.closest && p.closest('.gfx-icon,[data-no3d],canvas')) return;
    const parts = splitEmoji(tn.nodeValue);
    if (!parts.some((x) => x.n)) return;
    const size = o.size || sizeOf(p), frag = doc.createDocumentFragment();
    for (const x of parts) {
      if (x.t != null) frag.appendChild(doc.createTextNode(x.t));
      else { const sp = doc.createElement('span'); sp.className = 'e3d'; sp.style.cssText = 'display:inline-block;line-height:0;vertical-align:middle'; sp.setAttribute('aria-hidden', 'true'); sp.innerHTML = icon(x.n, { size, alt: '' }); frag.appendChild(sp); }
    }
    p.replaceChild(frag, tn);
  }
  function scan(node) {
    if (!node) return;
    if (node.nodeType === 3) { convertNode(node); return; }
    if (node.nodeType !== 1) return;
    if (node.closest && node.closest('.gfx-icon,[data-no3d]')) return;
    const walker = doc.createTreeWalker(node, 4 /* SHOW_TEXT */);
    const list = []; let n;
    while ((n = walker.nextNode())) list.push(n);
    list.forEach((t) => { if (!sel || (t.parentNode && t.parentNode.closest && t.parentNode.closest(sel))) convertNode(t); });
  }
  const flush = () => { raf = 0; if (stopped) return; const q = [...queue]; queue = new Set(); q.forEach((n) => { if (root.contains(n) || n === root) scan(n); }); };
  const mo = new globalThis.MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') queue.add(m.target);
      else m.addedNodes && m.addedNodes.forEach((n) => queue.add(n));
    }
    if (!raf && queue.size) raf = (globalThis.requestAnimationFrame || ((f) => setTimeout(f, 16)))(flush);
  });
  mo.observe(root, { childList: true, subtree: true, characterData: true });
  scan(root);
  return { stop() { stopped = true; mo.disconnect(); }, run() { scan(root); } };
}
