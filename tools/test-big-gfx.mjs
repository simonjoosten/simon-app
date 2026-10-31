// Test voor docs/big-gfx.js (gedeelde helper van de big-* spellen): emoji -> icoon, iconify met een kleine nep-DOM, uiterlijken.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FOUT: ' + m); } };

// --- minimale nep-DOM
class Node_ { constructor(t) { this.nodeType = t; this.parentNode = null; this.childNodes = []; this.isConnected = true; }
  appendChild(c) { if (c.nodeType === 11) { for (const k of [...c.childNodes]) this.appendChild(k); c.childNodes = []; return c; } if (c.parentNode) c.parentNode.childNodes = c.parentNode.childNodes.filter((x) => x !== c); c.parentNode = this; this.childNodes.push(c); return c; }
  replaceChild(n, o) { const i = this.childNodes.indexOf(o); const ins = n.nodeType === 11 ? n.childNodes : [n]; ins.forEach((k) => { k.parentNode = this; }); this.childNodes.splice(i, 1, ...ins); o.parentNode = null; if (n.nodeType === 11) n.childNodes = []; }
  replaceWith(n) { this.parentNode.replaceChild(n, this); }
  get textContent() { return this.nodeType === 3 ? this.nodeValue : this.childNodes.map((c) => c.textContent).join(''); }
  set textContent(v) { this.childNodes = []; this.appendChild(doc.createTextNode(v)); } }
const doc = {
  createElement(tag) { const e = new Node_(1); e.nodeName = tag.toUpperCase(); e.ownerDocument = doc; e.className = ''; e.attrs = {}; e.classList = { contains: (c) => e.className.split(' ').includes(c) }; e.hasAttribute = (a) => a in e.attrs; e.setAttribute = (a, v) => { e.attrs[a] = v; }; e.closest = () => null; return e; },
  createTextNode(t) { const n = new Node_(3); n.nodeValue = t; n.nodeName = '#text'; n.ownerDocument = doc; return n; },
  createDocumentFragment() { const f = new Node_(11); f.ownerDocument = doc; return f; },
};
globalThis.document = doc;
globalThis.__BIG_NOSCENES = true;
const G = await import(pathToFileURL(path.join(here, '..', 'docs', 'big-gfx.js')).href);

ok(G.iconName('🎢') === 'rollercoaster' && G.iconName('⚙️') === 'gear' && G.iconName('⚙') === 'gear', 'emoji -> icoonnaam (ook zonder variatieselector)');
ok(G.iconName('🔧') === 'hammer' && G.iconName('🌷') === 'flower', 'aliassen');
ok(G.iconName('x') === null && G.iconName('😀') === null, 'onbekend geeft null');
ok(/<img/.test(G.ico('🪙', 20)) && G.ico('😀', 20) === '😀', 'ico(): icoon of emoji-fallback');

const root = doc.createElement('div'); root.ownerDocument = doc;
const p = doc.createElement('p'); root.appendChild(p); p.appendChild(doc.createTextNode('Kosten 🪙 12 en ⭐ en 😀'));
const sc = doc.createElement('script'); root.appendChild(sc); sc.appendChild(doc.createTextNode('🪙'));
const no = doc.createElement('b'); no.attrs['data-noicon'] = ''; root.appendChild(no); no.appendChild(doc.createTextNode('🪙'));
const stop = G.iconify(root);
ok(p.textContent === 'Kosten 🪙 12 en ⭐ en 😀', 'textContent blijft gelijk (emoji blijft als verborgen tekst): ' + p.textContent);
const imgs = (n) => n.childNodes.reduce((a, c) => a + (c.nodeName === 'IMG' ? 1 : 0) + imgs(c), 0);
ok(imgs(p) === 2, 'twee emoji vervangen door img (😀 niet): ' + imgs(p));
ok(imgs(sc) === 0 && imgs(no) === 0, 'script en data-noicon blijven met rust');
stop();
// tweede keer niet opnieuw omzetten (geen oneindige lus)
const n1 = imgs(p); G.iconify(root); ok(imgs(p) === n1, 'geen dubbele omzetting');

// setHtml
const el = { innerHTML: '' }; ok(G.setHtml(el, 'a') && !G.setHtml(el, 'a') && G.setHtml(el, 'b') && el.innerHTML === 'b', 'setHtml zet alleen bij verandering');
// uiterlijken opslaan/lezen
const store = new Map(); globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) };
const looks = [{ id: 'a' }, { id: 'b' }];
ok(G.getLook('t', looks).id === 'a', 'standaard uiterlijk = eerste'); G.setLook('t', 'b'); ok(G.getLook('t', looks).id === 'b', 'gekozen uiterlijk wordt onthouden'); G.setLook('t', 'zzz'); ok(G.getLook('t', looks).id === 'a', 'onbekend uiterlijk valt terug');
// intro maar één keer; mijlpaal-throttle (scenes staan uit in de test, dus null)
ok(G.intro({}, 'game1', 'intro-ruimte') === null && store.get('big:intro:game1') === '1', 'intro markeert zichzelf');
ok(G.milestone({}, 'levelup') === null, 'milestone zonder scenes geeft null');
// canvas
let drawn = 0; const ctx = new Proxy({}, { get: (t, k) => (k === 'save' || k === 'restore' || k === 'drawImage' || k === 'fillText' || k === 'translate' || k === 'rotate' ? () => { if (k === 'fillText' || k === 'drawImage') drawn++; } : t[k]), set: (t, k, v) => { t[k] = v; return true; } });
ok(G.cEmoji(ctx, '🪙', 10, 10, 20) === true && drawn >= 1 && G.cEmoji(ctx, '😀', 10, 10, 20) === false, 'cEmoji tekent icoon, geeft false bij onbekend');
// cloudShadows en parallax crashen niet
const g2 = new Proxy({}, { get: (t, k) => (k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {}), set: () => true });
G.cloudShadows(g2, 300, 200, 3); ok(G.parallax(100, 50, 1).every(Number.isFinite), 'parallax is eindig');
console.log(`\n${pass} geslaagd, ${fail} mislukt`);
process.exit(fail ? 1 : 0);
