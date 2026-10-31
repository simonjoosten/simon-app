// Learn Study: kunst en effecten. emoji -> 3D-icoon (kitIcon), kleurthema's per kit, confetti en scenes.
// Alle gfx-modules worden "zacht" geladen: ontbreken ze (of draait dit in node), dan blijft het gewoon emoji en gebeurt er niets.
let ART = null; let ICONS = {}; let FX = null; let SET = null; let SCN = null; let PNL = null;
try { ART = await import('../gfx/art.js?v=1'); } catch (e) { ART = null; }
try { ICONS = (await import('../gfx/icons.js?v=1')).ICONS || {}; } catch (e) { ICONS = {}; }
try { FX = await import('../gfx/fx.js?v=1'); } catch (e) { FX = null; }
try { SET = await import('../gfx/settings.js?v=1'); } catch (e) { SET = null; }
try { SCN = await import('../gfx/scenes.js?v=1'); } catch (e) { SCN = null; }
try { PNL = await import('../gfx/panel.js?v=1'); } catch (e) { PNL = null; }

const strip = (s) => String(s == null ? '' : s).replace(/️/g, '').trim();
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// handmatige tabel voor veelgebruikte kit-emoji's (naam = bestand in docs/art/3d)
const MANUAL = {
  '🐶': 'dog', '🐕': 'dog', '🐱': 'cat', '🐈': 'cat', '🐰': 'rabbit', '🐇': 'rabbit', '🐻': 'bear', '🐼': 'panda', '🦊': 'fox', '🦁': 'lion', '🐯': 'lion', '🐮': 'cow', '🐄': 'cow', '🐷': 'pig', '🐖': 'pig',
  '🐑': 'sheep', '🐴': 'horse', '🐎': 'horse', '🐔': 'chicken', '🐓': 'chicken', '🐸': 'frog', '🦆': 'duck', '🦉': 'owl', '🐝': 'bee', '🦋': 'butterfly', '🐌': 'snail', '🐘': 'elephant', '🐵': 'monkey', '🐒': 'monkey',
  '🐧': 'penguin', '🐟': 'fish', '🐠': 'fish', '🐡': 'fish', '🦈': 'shark', '🦀': 'crab', '🐋': 'whale', '🐳': 'whale', '🐬': 'whale', '🐙': 'octopus', '🪼': 'jellyfish', '🐢': 'turtle', '🦖': 'dino', '🦕': 'dino',
  '🐉': 'dragon', '🦄': 'unicorn', '🐚': 'shell', '🐾': 'dog', '🐣': 'chicken', '🐥': 'chicken', '🦢': 'duck',
  '🍎': 'apple', '🍏': 'apple', '🍌': 'banana', '🥕': 'carrot', '🌾': 'wheat', '🌽': 'corn', '🍅': 'tomato', '🍓': 'strawberry', '🍇': 'grapes', '🍉': 'watermelon', '🍕': 'pizza', '🍔': 'burger', '🍟': 'fries', '🌭': 'hotdog',
  '🍦': 'icecream', '🍨': 'icecream', '🍩': 'donut', '🎂': 'cake', '🍰': 'cake', '🍪': 'cookie', '🍬': 'candy', '🍭': 'lollipop', '🥚': 'egg', '🥛': 'milk', '🧀': 'cheese', '🍞': 'bread', '🥖': 'bread', '🧁': 'cupcake', '☕': 'coffee', '🥧': 'pie',
  '🏠': 'house', '🏡': 'house', '🏰': 'castle', '🏯': 'castle', '🗼': 'tower', '⛺': 'tent', '🏫': 'school', '🏥': 'hospital', '🏭': 'factory', '🏢': 'skyscraper', '🏙': 'skyscraper', '⛲': 'fountain', '🌉': 'bridge', '🎡': 'ferriswheel', '🎢': 'rollercoaster', '🎠': 'carousel', '🏪': 'shop', '🔺': 'pyramid', '🏚': 'barn',
  '🚗': 'car', '🚙': 'car', '🚚': 'truck', '🚛': 'truck', '🚌': 'bus', '🚆': 'train', '🚂': 'train', '🚄': 'train', '✈': 'plane', '⛵': 'boat', '🚢': 'ship', '🚜': 'tractor', '🚁': 'helicopter', '🚲': 'bike', '🚀': 'rocket', '🛸': 'ufo', '🛰': 'satellite', 
  '🌳': 'tree', '🌲': 'pine', '🌴': 'palm', '🌸': 'flower', '🌷': 'flower', '🌼': 'flower', '🌻': 'sunflower', '🍄': 'mushroom', '🌵': 'cactus', '🪨': 'rock', '☀': 'sun', '🌞': 'sun', '🌙': 'moon', '🌛': 'moon', '☁': 'cloud', '⛅': 'cloud', '🌦': 'rain',
  '🌧': 'rain', '❄': 'snowflake', '🔥': 'flame', '🌋': 'volcano', '🌊': 'wave', '🌈': 'rainbow', '🍂': 'leaf', '🍁': 'leaf', '🌿': 'leaf', '🍃': 'leaf', '🏔': 'rock',
  '🪐': 'planet', '🌍': 'earth', '🌎': 'earth', '🌏': 'earth', '☄': 'comet', '🧑‍🚀': 'astronaut', '👽': 'alien', '👻': 'ghost', '🤖': 'robot', '💀': 'skull', '🧙': 'wizard', '🧚': 'fairy', '🧜': 'mermaid',
  '🔨': 'hammer', '⛏': 'pickaxe', '⚙': 'gear', '🪄': 'wand', '🗺': 'map', '🧭': 'compass', '⚗': 'flask', '🧪': 'potion', '🔬': 'microscope', '🎨': 'paint', '🖼': 'paint', '✏': 'pencil', '✍': 'pencil', '📷': 'camera', '🎹': 'piano', '🎸': 'guitar', '🥁': 'drum', '🎻': 'guitar',
  '🎤': 'microphone', '🎧': 'headphones', '🎵': 'note', '🎶': 'note', '🌐': 'globe', '🪙': 'coin', '💎': 'gem', '⭐': 'star', '🌟': 'star', '❤': 'heart', '🏆': 'trophy', '👑': 'crown', '🏅': 'medal', '🥇': 'medal', '🎁': 'gift',
  '🔑': 'key', '🔒': 'lock', '💣': 'bomb', '⏳': 'hourglass', '⚡': 'bolt', '🛡': 'shield', '⚔': 'sword', '🏹': 'bow', '📘': 'book', '📚': 'book', '📖': 'book', '📜': 'scroll', '🚩': 'flag', '🏁': 'flag', '🧲': 'magnet', '💡': 'lightbulb',
  '🔔': 'bell', '🎈': 'balloon', '🎲': 'dice', '🧩': 'puzzle', '🎯': 'target', '🎟': 'ticket', '💵': 'money', '💶': 'money', '💷': 'money', '💰': 'bag', '💱': 'coin', '💍': 'ring', '🔮': 'crystal', '🍀': 'clover', '🧰': 'chest',
  '🧮': 'gear', '🔢': 'dice', '🔟': 'dice', '💻': 'gear', '🕒': 'hourglass', '🕰': 'hourglass', '🏛': 'castle',
};
const REV = {};
for (const k of Object.keys(ICONS)) { const e = strip(ICONS[k]); if (e && !REV[e]) REV[e] = k; }
for (const k of Object.keys(MANUAL)) REV[strip(k)] = MANUAL[k];

// naam van het icoon dat bij deze emoji hoort, of null (bv. vlaggen, cijfers, 🇳🇱 blijven emoji)
export function iconNameFor(emoji) {
  const e = strip(emoji); if (!e) return null;
  const n = REV[e] || null;
  if (n && ART && ART.has && !ART.has(n)) return n; // bestaat het plaatje niet, dan valt icon() zelf terug op emoji
  return n;
}
export const hasArt = () => !!(ART && ART.icon);

// HTML-string: 3D-icoon als het bestaat, anders de (ge-escapete) emoji op dezelfde maat
export function kitIcon(emoji, size = 32, o = {}) {
  const raw = emoji == null || emoji === '' ? '📘' : String(emoji);
  const n = iconNameFor(raw);
  if (n && ART && ART.has && ART.has(n)) { try { return ART.icon(n, { size, cls: o.cls || '', alt: o.alt != null ? o.alt : '' }); } catch (e) { /* emoji */ } }
  return `<span class="ls-em${o.cls ? ' ' + esc(o.cls) : ''}" role="img" aria-label="${esc(o.alt || '')}" style="display:inline-block;width:${size}px;height:${size}px;line-height:${size}px;font-size:${Math.round(size * 0.8)}px;text-align:center;vertical-align:middle">${esc(raw)}</span>`;
}
// DOM-element (zonder innerHTML): voor in h()
export function kitIconEl(emoji, size = 32, o = {}) {
  const raw = emoji == null || emoji === '' ? '📘' : String(emoji);
  const n = iconNameFor(raw); const url = n && ART && ART.has && ART.has(n) && ART.iconUrl ? ART.iconUrl(n) : null;
  const wrap = document.createElement('span'); wrap.className = 'ls-ico' + (o.cls ? ' ' + o.cls : '');
  wrap.style.width = size + 'px'; wrap.style.height = size + 'px'; wrap.style.fontSize = Math.round(size * 0.8) + 'px'; wrap.style.lineHeight = size + 'px';
  if (url) {
    const img = document.createElement('img'); img.setAttribute('src', url); img.setAttribute('alt', ''); img.setAttribute('draggable', 'false'); img.setAttribute('width', size); img.setAttribute('height', size);
    img.style.width = size + 'px'; img.style.height = size + 'px'; img.className = 'ls-ico-i';
    img.addEventListener('error', () => { try { if (img.parentNode) { img.parentNode.removeChild(img); wrap.textContent = raw; } } catch (e) { /* ok */ } });
    wrap.appendChild(img);
  } else wrap.textContent = raw;
  return wrap;
}
// pure icoonnaam rechtstreeks (voor badges/tabbalk): naam -> element met emoji-fallback
export function iconEl(naam, size = 28, fallback = '') {
  const url = ART && ART.has && ART.has(naam) && ART.iconUrl ? ART.iconUrl(naam) : null;
  const wrap = document.createElement('span'); wrap.className = 'ls-ico'; wrap.style.width = size + 'px'; wrap.style.height = size + 'px'; wrap.style.fontSize = Math.round(size * 0.8) + 'px'; wrap.style.lineHeight = size + 'px';
  if (url) { const img = document.createElement('img'); img.setAttribute('src', url); img.setAttribute('alt', ''); img.setAttribute('draggable', 'false'); img.style.width = size + 'px'; img.style.height = size + 'px'; img.className = 'ls-ico-i'; wrap.appendChild(img); } else wrap.textContent = fallback || ICONS[naam] || '❓';
  return wrap;
}

/* ---------- kleurthema's per kit ---------- */
export const PALETTE = [
  { id: 'indigo', name: 'Indigo', a: '#6366f1', b: '#a855f7' }, { id: 'roze', name: 'Roze', a: '#ec4899', b: '#f97316' }, { id: 'groen', name: 'Groen', a: '#10b981', b: '#06b6d4' },
  { id: 'oranje', name: 'Oranje', a: '#f59e0b', b: '#ef4444' }, { id: 'blauw', name: 'Blauw', a: '#0ea5e9', b: '#6366f1' }, { id: 'paars', name: 'Paars', a: '#8b5cf6', b: '#ec4899' },
  { id: 'limoen', name: 'Limoen', a: '#65a30d', b: '#10b981' }, { id: 'goud', name: 'Goud', a: '#d97706', b: '#b45309' }, { id: 'nacht', name: 'Nacht', a: '#334155', b: '#6366f1' },
];
const GROUP_PAL = { Talen: 'blauw', Spelling: 'roze', Rekenen: 'oranje', Wereld: 'groen', Natuur: 'limoen', Mens: 'roze', Geschiedenis: 'goud', Creatief: 'paars', Technologie: 'nacht', 'Mijn kits': 'indigo' };
export function paletteById(id) { return PALETTE.find((p) => p.id === id) || null; }
// kit -> { id, name, a, b }; keuze = opgeslagen palet-id of null/'auto' (dan op groep)
export function kitTheme(kit, chosen) {
  const p = paletteById(chosen) || paletteById(GROUP_PAL[kit && kit.group] || (kit && kit.src && kit.src !== 'pack' ? 'indigo' : '')) || PALETTE[0];
  return p;
}
export function themeVars(p) { return `--ka:${p.a};--kb:${p.b};`; }
export function applyTheme(el, p) { if (!el || !p) return; try { el.style.setProperty('--ka', p.a); el.style.setProperty('--kb', p.b); } catch (e) { /* ok */ } }

/* ---------- kwaliteit ---------- */
export function gfxQ() { try { return SET && SET.GFX ? SET.GFX.q : 1; } catch (e) { return 1; } }
export function gfxReduce() { try { return SET && SET.GFX ? !!SET.GFX.reduce : false; } catch (e) { return false; } }
export const canCanvas = () => { try { if (typeof requestAnimationFrame !== 'function' || typeof document === 'undefined') return false; const c = document.createElement('canvas'); return !!(c && typeof c.getContext === 'function'); } catch (e) { return false; } };

// welke scene (en hoeveel confetti) bij dit resultaat past; pure functie (testbaar)
export function celebrationFor({ pct = 0, record = false, levelUp = false, perfect = false, coins = 0, daily = false, q = 1, reduce = false } = {}) {
  if (reduce) return { scene: null, confetti: 0 };
  let scene = null;
  if (record) scene = 'new-record'; else if (levelUp) scene = 'levelup'; else if (daily) scene = 'daily-bonus'; else if (perfect) scene = 'victory'; else if (pct >= 90 && coins >= 25) scene = 'coins-rain';
  if (q === 0 && scene && scene !== 'victory' && scene !== 'new-record' && scene !== 'levelup') scene = null;
  let confetti = 0;
  if (q > 0 && pct >= 60) confetti = pct >= 90 || perfect || record ? 70 : 36;
  return { scene, confetti };
}

// scene als overlay in host; geeft { stop } of null
export function playScene(host, id, o = {}) {
  try { if (!SCN || !SCN.Scenes || !canCanvas() || !host) return null; if (!SCN.Scenes.list[id]) return null; return SCN.Scenes.play(host, id, { skippable: true, ...o }); } catch (e) { return null; }
}
// confetti op een canvas dat over host ligt (klikt niet in de weg); geeft { stop } of null
export function confetti(host, n = 60, o = {}) {
  try {
    if (!FX || !FX.Particles || !canCanvas() || !host || gfxReduce() || gfxQ() === 0) return null;
    const cv = document.createElement('canvas'); cv.className = 'ls-confetti'; cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:5';
    const W = Math.max(1, host.clientWidth || 360), Hh = Math.max(1, host.clientHeight || 640); const dpr = (SET && SET.GFX && SET.GFX.dpr) || 1;
    cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr); host.appendChild(cv);
    const ctx = cv.getContext('2d'); const ps = new FX.Particles(); let last = 0; let t0 = 0; let alive = true; let raf = 0;
    const kinds = o.kinds || ['confetti'];
    const fire = (x, y, k) => ps.burst(x, y, { kind: k, n: Math.round(n / 2), angle: -Math.PI / 2, spread: Math.PI * 0.9, power: 1.6 });
    const frame = (ts) => {
      if (!alive) return; if (!t0) t0 = ts; const t = (ts - t0) / 1000; const dt = last ? (ts - last) / 1000 : 0.016; last = ts;
      if (t > (o.delay || 0) && !frame.f1) { frame.f1 = 1; fire(W * 0.2, Hh * 0.85, kinds[0]); fire(W * 0.8, Hh * 0.85, kinds[kinds.length - 1]); }
      if (t > 0.7 + (o.delay || 0) && !frame.f2 && gfxQ() === 2) { frame.f2 = 1; ps.burst(W / 2, Hh * 0.3, { kind: 'stars', n: 24, power: 1.2 }); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, Hh); ps.update(dt); ps.draw(ctx);
      if (t > 4.5 || (frame.f1 && ps.count === 0)) { stop(); return; } raf = requestAnimationFrame(frame);
    };
    const stop = () => { alive = false; try { cancelAnimationFrame(raf); } catch (e) { /* ok */ } try { if (cv.parentNode) cv.parentNode.removeChild(cv); } catch (e) { /* ok */ } };
    raf = requestAnimationFrame(frame); return { stop };
  } catch (e) { return null; }
}

export function openGfxSettings(toast) { try { if (PNL && PNL.openSettingsPanel) { PNL.openSettingsPanel({ title: 'Instellingen', toast: toast || (() => {}) }); return true; } } catch (e) { /* ok */ } return false; }
// kleine uitroep-gloed voor voortgangsringen: CSS-variabele --glow per kwaliteit
export function glowCss() { const q = gfxQ(); return q === 0 ? 'none' : q === 1 ? 'drop-shadow(0 0 4px var(--ka,#6366f1))' : 'drop-shadow(0 0 8px var(--ka,#6366f1))'; }

// keuzelijst voor de kit-maker: emoji's die als 3D-icoon getoond worden
export const PICKER = ['📘', '📚', '🐶', '🐱', '🐰', '🐻', '🐼', '🦊', '🦁', '🐮', '🐷', '🐑', '🐴', '🐔', '🐸', '🦆', '🦉', '🐝', '🦋', '🐘', '🐵', '🐧', '🐟', '🦈', '🦀', '🐋', '🐙', '🐢', '🦖', '🐉', '🦄',
  '🍎', '🍌', '🥕', '🍓', '🍇', '🍉', '🍕', '🍔', '🍦', '🍩', '🎂', '🍪', '🧀', '🍞', '☕', '🏠', '🏰', '🗼', '🏫', '🏥', '🏭', '🎡', '🚗', '🚌', '🚆', '✈️', '⛵', '🚢', '🚜', '🚲', '🚀', '🛸',
  '🌳', '🌲', '🌴', '🌸', '🌻', '🍄', '🌵', '☀️', '🌙', '☁️', '🌧️', '❄️', '🔥', '🌋', '🌊', '🌈', '🪐', '🌍', '☄️', '👽', '🤖', '👻', '🧙', '🧚', '🔨', '⚙️', '🗺️', '🧭', '🧪', '🔬', '🎨', '✏️', '📷',
  '🎹', '🎸', '🥁', '🎤', '🎧', '🎵', '🌐', '💎', '⭐', '❤️', '🏆', '👑', '🏅', '🎁', '🔑', '🛡️', '⚔️', '💡', '🔔', '🎈', '🎲', '🧩', '🎯', '💰'];
