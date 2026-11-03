// Meme-maker: sjablonen, foto of eigen camera, filters, meerdere tekstvakken en tekstballonnen, 3D-stickers, rand, opslaan en delen.
import * as C from './meme-core.js?v=2';
import { mountShell, celebrate, toast, icon, esc } from './fun-ui.js?v=1';
import { preload, drawIcon } from './gfx/art.js?v=1';
import { GFX } from './gfx/settings.js?v=1';

const { W, BGS, FUNNY, EMOJIS, COLORS } = C;
const MAXH = 1350;
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

// ---------- Pure hulpfuncties (los te testen) ----------
// Breek tekst in regels zodat elke regel maxW past; te lange woorden worden per letter gebroken.
export function wrapText(measure, text, maxW) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    let cur = '';
    for (let word of para.split(/\s+/).filter(Boolean)) {
      while (measure(word) > maxW && word.length > 1) {
        let k = word.length - 1;
        while (k > 1 && measure(word.slice(0, k)) > maxW) k--;
        if (cur) { lines.push(cur); cur = ''; }
        lines.push(word.slice(0, k)); word = word.slice(k);
      }
      const t = cur ? cur + ' ' + word : word;
      if (cur && measure(t) > maxW) { lines.push(cur); cur = word; } else cur = t;
    }
    lines.push(cur);
  }
  while (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}
// Verklein de letter tot de tekst in maxW x maxH past. measureAt(size) geeft een meetfunctie.
export function fitText(measureAt, text, maxW, maxH, size, min = 20) {
  let s = size, lines = [];
  for (; s >= min; s = Math.floor(s * 0.92)) {
    lines = wrapText(measureAt(s), text, maxW);
    if (lines.length * s * 1.12 <= maxH) return { size: s, lines };
  }
  s = min; lines = wrapText(measureAt(s), text, maxW);
  return { size: s, lines };
}
// Schermpositie -> canvascoördinaten (werkt bij CSS-schaling).
export function toCanvasPoint(clientX, clientY, rect, cw, ch) {
  return { x: (clientX - rect.left) * cw / rect.width, y: (clientY - rect.top) * ch / rect.height };
}
// Is punt (px,py) in een geroteerde laag met middelpunt (lx,ly), afmetingen w x h en hoek deg?
export function hitLayer(px, py, l, w, h) {
  const a = -l.rot * Math.PI / 180, dx = px - l.x, dy = py - l.y;
  const rx = dx * Math.cos(a) - dy * Math.sin(a), ry = dx * Math.sin(a) + dy * Math.cos(a);
  return Math.abs(rx) <= w / 2 + 10 && Math.abs(ry) <= h / 2 + 10;
}
export const canvasHeight = (iw, ih) => Math.max(200, Math.min(MAXH, Math.round(W * ih / iw)));

const PLAIN_BGS = BGS.map((_, i) => i).filter((i) => i < 12 || i > 14);
const ASPECTS = [['1:1', 1080], ['4:5', 1350], ['3:2', 720], ['16:9', 608]];

export function memeView(ctx) {
  const { view, addCleanup, uid } = ctx;
  const shell = mountShell(view, { game: 'meme', title: 'Meme-studio', sub: 'Sjablonen, foto\'s, stickers en filters', iconName: 'camera', addCleanup });
  const root = shell.body;
  const GKEY = `meme:gallery:${uid || 'x'}`;
  const jget = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch { return d; } };
  const cv0 = document.createElement('canvas'); const mc = cv0.getContext('2d');
  const fontCss = (id, size) => { const f = C.fontById(id); return `${f[3]} ${size}px ${f[2]}`; };
  const measureAt = (size, fontId) => { mc.font = fontCss(fontId || 'impact', size); return (t) => mc.measureText(t).width; };

  let nextId = 1, selId = null, raf = 0, dead = false, st, undoStack = [], lastSnap = 0, bgCache = null, bgKey = '', saved = 0, openStk = false, openGroup = 0, editingGal = null;
  const idGen = () => nextId++;
  const fresh = () => ({ h: W, bg: { type: 'grad', idx: 0, emoji: '😂', img: null, zoom: 1, ox: 0, oy: 0 }, top: '', bottom: '', ts: { color: '#ffffff', stroke: '#000000', size: 110, font: 'impact' }, layers: [], filter: { id: 'none', amt: 0.8 }, adj: { brightness: 0, contrast: 0, saturate: 0 }, frame: { w: 0, color: '#ffffff' } });
  st = fresh();
  addCleanup && addCleanup(() => { dead = true; cancelAnimationFrame(raf); });

  // ---- undo ----
  const snapNow = () => { undoStack.push(JSON.stringify(C.serialize(st))); if (undoStack.length > 30) undoStack.shift(); lastSnap = Date.now(); };
  const touch = () => { if (Date.now() - lastSnap > 900) snapNow(); };
  const doUndo = () => {
    if (!undoStack.length) return toast('Niks om terug te draaien');
    const o = C.restore(JSON.parse(undoStack.pop())), keep = st.bg.img; st = o; st.bg.img = o.bg.type === 'img' ? keep : null; if (o.bg.type === 'img' && !keep) st.bg.type = 'grad';
    selId = null; syncAll(); redraw();
  };

  root.innerHTML = `<style>
    .mm-b{min-height:calc(46px*var(--gfx-scale,1));font-size:calc(1rem*var(--gfx-font,1))}
    .mm-act{display:flex;flex-wrap:wrap;gap:6px;margin:.5rem 0}.mm-act>button,.mm-act>label{min-height:calc(48px*var(--gfx-scale,1));flex:1 1 auto;display:inline-flex;align-items:center;justify-content:center;gap:.3rem}
    .mm-hd{display:flex;align-items:center;gap:.5rem;font-weight:800;font-size:calc(1.1rem*var(--gfx-font,1))}
    .mm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(84px*var(--gfx-scale,1)),1fr));gap:6px;margin:.5rem 0}
    .mm-grid button{padding:4px;min-height:calc(56px*var(--gfx-scale,1));display:flex;flex-direction:column;align-items:center;gap:2px;font-size:.78rem}
    .mm-row{display:flex;gap:.5rem;align-items:center;margin:.3rem 0}.mm-row small{min-width:4.6rem}.mm-row input[type=range]{flex:1;min-height:calc(40px*var(--gfx-scale,1))}
    .mm-in{width:100%;box-sizing:border-box;min-height:calc(46px*var(--gfx-scale,1));font-size:calc(1rem*var(--gfx-font,1));margin:.2rem 0}
    .mm-sw{width:calc(36px*var(--gfx-scale,1));height:calc(36px*var(--gfx-scale,1));border-radius:50%;padding:0;border:2px solid var(--line);min-height:0}
    .mm-cols{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.mm-cols input[type=color]{width:calc(44px*var(--gfx-scale,1));height:calc(40px*var(--gfx-scale,1));padding:0;border:0;background:none}
    .mm-chip{padding:.35rem .7rem;border-radius:99px;border:2px solid var(--line);background:var(--card);min-height:calc(40px*var(--gfx-scale,1))}.mm-chip.on{border-color:var(--accent);background:var(--accent);color:#fff}
  </style>
  <div class="box" style="padding:.6rem">
    <canvas id="mm-cv" width="${W}" height="${W}" style="width:100%;height:auto;display:block;border-radius:12px;touch-action:none;background:#ddd;cursor:grab"></canvas>
    <div id="mm-msg" style="min-height:1.3rem;margin-top:.3rem"><small>Tik een laag op het plaatje om hem te verslepen.</small></div>
    <div class="mm-act"><button id="mm-undo">↶ Terug</button><button id="mm-rnd" class="pri">🎲 Verras me</button><button id="mm-reset">🔄 Opnieuw</button></div>
  </div>
  <div class="box"><div class="mm-hd">${icon('star', { size: 30 })} Sjablonen</div><div class="mm-grid" id="mm-tpl"></div></div>
  <div class="box">
    <div class="mm-hd">${icon('camera', { size: 30 })} Achtergrond</div>
    <div class="mm-act">
      <label class="mm-chip" style="cursor:pointer;text-align:center">🖼 Foto uit bibliotheek<input id="mm-file" type="file" accept="image/*" style="display:none"></label>
      <label class="mm-chip" style="cursor:pointer;text-align:center">📸 Nieuwe foto<input id="mm-cam" type="file" accept="image/*" capture="environment" style="display:none"></label>
      <button id="mm-emobg">🎭 Grote emoji</button>
    </div>
    <div id="mm-grads" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(54px*var(--gfx-scale,1)),1fr));gap:6px;margin:.5rem 0"></div>
    <div id="mm-emobox" style="display:none"><small>Kies de grote emoji</small><div id="mm-emogrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(44px,1fr));gap:4px;margin-top:.3rem"></div></div>
    <div class="mm-cols" id="mm-asp"></div>
    <div id="mm-photoctl"></div>
  </div>
  <div class="box">
    <div class="mm-hd">${icon('magnet', { size: 30 })} Filters en kleuren</div>
    <div class="mm-cols" id="mm-filters" style="margin-top:.4rem"></div>
    <div class="mm-row"><small>Sterkte</small><input id="mm-famt" type="range" min="0" max="100"></div>
    <div class="mm-row"><small>Helderheid</small><input id="mm-br" type="range" min="-60" max="60"></div>
    <div class="mm-row"><small>Contrast</small><input id="mm-ct" type="range" min="-60" max="60"></div>
    <div class="mm-row"><small>Kleur</small><input id="mm-sa" type="range" min="-100" max="100"></div>
    <div class="mm-row"><small>Rand</small><input id="mm-fw" type="range" min="0" max="80"><input id="mm-fc" type="color"></div>
  </div>
  <div class="box">
    <div class="mm-hd">${icon('pencil', { size: 30 })} Tekst boven en onder</div>
    <input id="mm-top" class="mm-in" placeholder="Bovenregel" maxlength="120"><input id="mm-bot" class="mm-in" placeholder="Onderregel" maxlength="120">
    <div class="mm-cols" id="mm-tfont"></div>
    <div class="mm-cols" style="margin-top:.4rem"><small>letter</small><input id="mm-tsize" type="color"><small>rand</small><input id="mm-tstroke" type="color"></div>
    <div class="mm-row"><small>Grootte</small><input id="mm-tsz" type="range" min="40" max="200"></div>
  </div>
  <div class="box">
    <div class="mm-hd">${icon('puzzle', { size: 30 })} Lagen en stickers</div>
    <div class="mm-act"><button id="mm-addtxt">➕ Tekst</button><button id="mm-addbub">💬 Tekstballon</button><button id="mm-addstk">➕ Sticker</button></div>
    <div id="mm-stkbox" style="display:none"></div>
    <div id="mm-sel" style="margin-top:.5rem"></div>
  </div>
  <div class="box">
    <div class="mm-hd">${icon('gift', { size: 30 })} Bewaren en delen</div>
    <div class="mm-act"><button class="pri" id="mm-save">💾 Bewaar in galerij</button><button id="mm-share">📤 Delen</button><button id="mm-dl">⬇ PNG</button><button id="mm-copy">📋 Kopieer</button></div>
  </div>
  <div class="box"><div class="mm-hd">${icon('trophy', { size: 30 })} Mijn memes</div><div id="mm-gal" class="mm-grid"></div></div>`;
  const $ = (s) => root.querySelector(s);
  const cv = $('#mm-cv'), c = cv.getContext('2d');
  const msg = (t, err) => { $('#mm-msg').innerHTML = err ? `<span class="err">${esc(t)}</span>` : `<small>${esc(t)}</small>`; };

  // ---- achtergrond (met filter-cache) ----
  const filtering = () => st.filter.id !== 'none' || st.adj.brightness || st.adj.contrast || st.adj.saturate;
  function makeBg(scale) {
    const w = Math.round(W * scale), h = Math.round(st.h * scale), o = document.createElement('canvas'); o.width = w; o.height = h; const g = o.getContext('2d');
    const b = st.bg;
    if (b.type === 'img' && b.img) {
      const s = b.img, z = Math.max(1, b.zoom || 1), cover = Math.max(w / s.width, h / s.height) * z, dw = s.width * cover, dh = s.height * cover;
      g.drawImage(s, (w - dw) / 2 - (b.ox || 0) * (dw - w) / 2, (h - dh) / 2 - (b.oy || 0) * (dh - h) / 2, dw, dh);
    } else {
      g.save(); g.scale(scale, scale); BGS[b.idx][1](g, W, st.h);
      if (b.type === 'emoji') { const sz = Math.min(W, st.h) * 0.72; g.font = `${sz}px ${EMOJI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(b.emoji, W / 2, st.h / 2 + sz * 0.04); }
      g.restore();
    }
    if (filtering()) {
      try { const im = g.getImageData(0, 0, w, h); C.applyFilter(im, st.filter.id, st.filter.amt); C.adjust(im, st.adj); g.putImageData(im, 0, 0); } catch { /* geblokkeerd canvas: zonder filter */ }
    }
    return o;
  }
  const bgSig = (scale) => JSON.stringify([scale, st.h, st.bg.type, st.bg.idx, st.bg.emoji, st.bg.zoom, st.bg.ox, st.bg.oy, st.bg.img ? st.bg.img.width + 'x' + st.bg.img.height + (st.bg.imgId || '') : 0, st.filter, st.adj]);
  function getBg(scale) {
    const sc = filtering() && scale < 1 ? 0.5 : 1; const key = bgSig(sc);
    if (!bgCache || bgKey !== key) { bgCache = makeBg(sc); bgKey = key; }
    return bgCache;
  }

  // ---- tekenen ----
  function outlined(g, lines, size, cx, cy, color, stroke, fontId) {
    g.font = fontCss(fontId, size); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.miterLimit = 2;
    g.lineWidth = Math.max(2, size * 0.16); g.strokeStyle = stroke; g.fillStyle = color;
    const lh = size * 1.12, y0 = cy - (lines.length - 1) * lh / 2;
    lines.forEach((ln, i) => { g.strokeText(ln, cx, y0 + i * lh); g.fillText(ln, cx, y0 + i * lh); });
  }
  function layout(l) {
    if (l.kind === 'sticker') { l.w = l.size * 1.2; l.h = l.size * 1.2; return; }
    const upper = l.kind === 'text'; const txt = (l.text || 'Tekst'); const t2 = upper ? txt.toUpperCase() : txt;
    const maxW = l.kind === 'bubble' ? W * 0.62 : W * 0.9;
    l.lines = wrapText(measureAt(l.size, l.font), t2, maxW);
    const mw = Math.max(...l.lines.map((s) => measureAt(l.size, l.font)(s)));
    if (l.kind === 'bubble') { l.w = mw + l.size * 1.1; l.h = l.lines.length * l.size * 1.15 + l.size * 0.9; }
    else { l.w = mw + l.size * 0.2; l.h = l.lines.length * l.size * 1.12 + l.size * 0.1; }
  }
  function bubbleShape(g, w, h) { // afgeronde ballon + staartje (zonder roundRect)
    const r = Math.min(h / 2, w / 4), x = -w / 2, y = -h / 2;
    g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.arc(x + w - r, y + r, r, -Math.PI / 2, 0); g.lineTo(x + w, y + h - r); g.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    g.lineTo(x + w * 0.45, y + h); g.lineTo(x + w * 0.28, y + h + h * 0.5); g.lineTo(x + w * 0.2, y + h);
    g.lineTo(x + r, y + h); g.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI); g.lineTo(x, y + r); g.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5); g.closePath();
  }
  function paint(g, h, showSel, full) {
    g.clearRect(0, 0, W, h); g.drawImage(full ? makeBg(1) : getBg(1), 0, 0, W, h);
    const ts = st.ts, maxH = h * 0.3;
    for (const [txt, atTop] of [[st.top, true], [st.bottom, false]]) {
      if (!txt.trim()) continue;
      const f = fitText((s) => measureAt(s, ts.font), txt.toUpperCase(), W * 0.94, maxH, ts.size);
      const bh = f.lines.length * f.size * 1.12;
      outlined(g, f.lines, f.size, W / 2, atTop ? 22 + bh / 2 + st.frame.w : h - 22 - bh / 2 - st.frame.w, ts.color, ts.stroke, ts.font);
    }
    for (const l of st.layers) {
      layout(l);
      g.save(); g.translate(l.x, l.y); g.rotate(l.rot * Math.PI / 180);
      if (l.kind === 'sticker') {
        if (l.icon) drawIcon(g, l.icon, 0, 0, l.size, { shadow: GFX.q > 0 });
        else { g.font = `${l.size}px ${EMOJI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(l.emoji || '😂', 0, l.size * 0.04); }
      } else if (l.kind === 'bubble') {
        bubbleShape(g, l.w, l.h); g.fillStyle = l.stroke; g.fill(); g.lineWidth = Math.max(3, l.size * 0.07); g.strokeStyle = '#111827'; g.lineJoin = 'round'; g.stroke();
        g.font = fontCss(l.font, l.size); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = l.color;
        const lh = l.size * 1.15, y0 = -(l.lines.length - 1) * lh / 2; l.lines.forEach((ln, i) => g.fillText(ln, 0, y0 + i * lh));
      } else outlined(g, l.lines, l.size, 0, 0, l.color, l.stroke, l.font);
      if (showSel && l.id === selId) { g.setLineDash([14, 10]); g.lineWidth = 4; g.strokeStyle = '#4f46e5'; g.strokeRect(-l.w / 2, -l.h / 2, l.w, l.h); g.setLineDash([]); }
      g.restore();
    }
    const f = st.frame; if (f.w > 0) { g.fillStyle = f.color; g.fillRect(0, 0, W, f.w); g.fillRect(0, h - f.w, W, f.w); g.fillRect(0, 0, f.w, h); g.fillRect(W - f.w, 0, f.w, h); }
  }
  const redraw = () => { if (raf || dead) return; raf = requestAnimationFrame(() => { raf = 0; if (!dead) paint(c, st.h, true, false); }); };
  function setHeight(h) { st.h = h; if (cv.height !== h) cv.height = h; st.layers.forEach((l) => { l.y = Math.min(l.y, h); }); redraw(); }

  // ---- lagen ----
  const sel = () => st.layers.find((l) => l.id === selId);
  function addLayer(kind, extra = {}) {
    snapNow();
    const l = { id: idGen(), kind, x: W / 2, y: st.h / 2, rot: 0, size: kind === 'sticker' ? 300 : kind === 'bubble' ? 56 : 90, color: kind === 'bubble' ? '#111827' : '#ffffff', stroke: kind === 'bubble' ? '#ffffff' : '#000000', text: kind === 'bubble' ? 'Wat een dag!' : 'Nieuwe tekst', emoji: null, icon: null, font: kind === 'bubble' ? 'comic' : 'impact', ...extra };
    st.layers.push(l); selId = l.id; renderSel(); redraw(); return l;
  }
  function renderSel() {
    const l = sel(), box = $('#mm-sel');
    if (!l) { box.innerHTML = st.layers.length ? '<small>Tik een laag op het plaatje om hem te bewerken.</small>' : '<small>Nog geen lagen. Voeg tekst, een ballon of een sticker toe.</small>'; return; }
    const kindName = l.kind === 'sticker' ? 'Sticker' : l.kind === 'bubble' ? 'Tekstballon' : 'Tekstlaag';
    const col = (id, v) => `<input type="color" id="${id}" value="${v}">`;
    box.innerHTML = `<div class="chip" style="margin-bottom:.4rem">${kindName} geselecteerd</div>
      ${l.kind !== 'sticker' ? `<input id="ml-text" class="mm-in" value="${esc(l.text)}" maxlength="120"><div class="mm-cols">${C.FONTS.map(([id, nm]) => `<button class="mm-chip ${l.font === id ? 'on' : ''}" data-mf="${id}">${nm}</button>`).join('')}</div><div class="mm-cols" style="margin:.4rem 0"><small>${l.kind === 'bubble' ? 'tekst' : 'letter'}</small>${col('ml-col', l.color)}<small>${l.kind === 'bubble' ? 'ballon' : 'rand'}</small>${col('ml-str', l.stroke)}</div>` : ''}
      <div class="mm-row"><small>Grootte</small><input id="ml-size" type="range" min="30" max="600" value="${l.size}"></div>
      <div class="mm-row"><small>Draaien</small><input id="ml-rot" type="range" min="-180" max="180" value="${l.rot}"></div>
      <div class="mm-act"><button id="ml-fwd">⬆ Voor</button><button id="ml-back">⬇ Achter</button><button id="ml-dup">⧉ Kopie</button><button id="ml-del">🗑 Weg</button></div>`;
    const on = (id, ev, fn) => { const e = box.querySelector(id); if (e) e.addEventListener(ev, fn); };
    on('#ml-text', 'input', (e) => { touch(); l.text = e.target.value; redraw(); });
    on('#ml-col', 'input', (e) => { touch(); l.color = e.target.value; redraw(); });
    on('#ml-str', 'input', (e) => { touch(); l.stroke = e.target.value; redraw(); });
    on('#ml-size', 'input', (e) => { touch(); l.size = +e.target.value; redraw(); });
    on('#ml-rot', 'input', (e) => { touch(); l.rot = +e.target.value; redraw(); });
    box.querySelectorAll('[data-mf]').forEach((b) => b.addEventListener('click', () => { snapNow(); l.font = b.dataset.mf; renderSel(); redraw(); }));
    const move = (d) => { snapNow(); const i = st.layers.indexOf(l), j = i + d; if (j < 0 || j >= st.layers.length) return; st.layers.splice(i, 1); st.layers.splice(j, 0, l); redraw(); };
    on('#ml-fwd', 'click', () => move(1)); on('#ml-back', 'click', () => move(-1));
    on('#ml-dup', 'click', () => { snapNow(); const n = { ...l, id: idGen(), x: l.x + 40, y: l.y + 40 }; st.layers.push(n); selId = n.id; renderSel(); redraw(); });
    on('#ml-del', 'click', () => { snapNow(); st.layers = st.layers.filter((x) => x !== l); selId = null; renderSel(); redraw(); });
  }

  // ---- slepen ----
  let drag = null;
  const pt = (e) => toCanvasPoint(e.clientX, e.clientY, cv.getBoundingClientRect(), cv.width, cv.height);
  cv.addEventListener('pointerdown', (e) => {
    const p = pt(e); let hit = null;
    for (let i = st.layers.length - 1; i >= 0; i--) { const l = st.layers[i]; layout(l); if (hitLayer(p.x, p.y, l, l.w, l.h)) { hit = l; break; } }
    const changed = (hit ? hit.id : null) !== selId; selId = hit ? hit.id : null;
    if (hit) { snapNow(); drag = { id: hit.id, dx: hit.x - p.x, dy: hit.y - p.y, pid: e.pointerId }; try { cv.setPointerCapture(e.pointerId); } catch { /* */ } cv.style.cursor = 'grabbing'; e.preventDefault(); }
    if (changed) renderSel(); redraw();
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pid) return;
    const l = st.layers.find((x) => x.id === drag.id); if (!l) return;
    const p = pt(e); l.x = Math.max(0, Math.min(W, p.x + drag.dx)); l.y = Math.max(0, Math.min(st.h, p.y + drag.dy)); redraw();
  });
  const endDrag = () => { drag = null; cv.style.cursor = 'grab'; };
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);

  // ---- keuzes ----
  function bgThumbs() {
    $('#mm-grads').innerHTML = BGS.map(([n], i) => `<button data-g="${i}" title="${esc(n)}" style="padding:0;height:calc(46px*var(--gfx-scale,1));border-radius:8px;overflow:hidden;border:${st.bg.type !== 'img' && st.bg.idx === i ? '3px solid var(--accent)' : '1px solid var(--line)'}"><canvas width="60" height="46" data-t="${i}" style="width:100%;height:100%;display:block"></canvas></button>`).join('');
    $('#mm-grads').querySelectorAll('canvas').forEach((t) => { const g = t.getContext('2d'); g.save(); g.scale(60 / 360, 46 / 276); BGS[+t.dataset.t][1](g, 360, 276); g.restore(); });
    $('#mm-grads').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      snapNow(); const keep = st.bg.type === 'emoji'; st.bg = { ...st.bg, type: keep ? 'emoji' : 'grad', idx: +b.dataset.g, img: null };
      bgThumbs(); renderPhotoCtl(); redraw();
    }));
    $('#mm-asp').innerHTML = '<small>Formaat</small>' + ASPECTS.map(([n, h]) => `<button class="mm-chip ${st.h === h ? 'on' : ''}" data-asp="${h}">${n}</button>`).join('');
    $('#mm-asp').querySelectorAll('[data-asp]').forEach((b) => b.addEventListener('click', () => { snapNow(); setHeight(+b.dataset.asp); bgThumbs(); }));
  }
  function renderPhotoCtl() {
    const b = st.bg, box = $('#mm-photoctl');
    if (b.type !== 'img') { box.innerHTML = ''; return; }
    box.innerHTML = `<div class="mm-row"><small>Inzoomen</small><input id="mp-z" type="range" min="100" max="300" value="${Math.round((b.zoom || 1) * 100)}"></div><div class="mm-row"><small>Links-rechts</small><input id="mp-x" type="range" min="-100" max="100" value="${Math.round((b.ox || 0) * 100)}"></div><div class="mm-row"><small>Boven-onder</small><input id="mp-y" type="range" min="-100" max="100" value="${Math.round((b.oy || 0) * 100)}"></div>`;
    box.querySelector('#mp-z').oninput = (e) => { touch(); b.zoom = +e.target.value / 100; redraw(); };
    box.querySelector('#mp-x').oninput = (e) => { touch(); b.ox = +e.target.value / 100; redraw(); };
    box.querySelector('#mp-y').oninput = (e) => { touch(); b.oy = +e.target.value / 100; redraw(); };
  }
  function renderFilters() {
    $('#mm-filters').innerHTML = C.FILTERS.map(([id, n]) => `<button class="mm-chip ${st.filter.id === id ? 'on' : ''}" data-f="${id}">${n}</button>`).join('');
    $('#mm-filters').querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { snapNow(); st.filter.id = b.dataset.f; renderFilters(); redraw(); }));
  }
  function renderTplFonts() {
    $('#mm-tfont').innerHTML = C.FONTS.map(([id, nm]) => `<button class="mm-chip ${st.ts.font === id ? 'on' : ''}" data-tf="${id}">${nm}</button>`).join('');
    $('#mm-tfont').querySelectorAll('[data-tf]').forEach((b) => b.addEventListener('click', () => { snapNow(); st.ts.font = b.dataset.tf; renderTplFonts(); redraw(); }));
  }
  function renderStickers() {
    const box = $('#mm-stkbox'); box.style.display = openStk ? 'block' : 'none'; if (!openStk) return;
    const groups = [...C.STICKER_GROUPS, ['Emoji', null]];
    box.innerHTML = `<div class="mm-cols">${groups.map(([n], i) => `<button class="mm-chip ${i === openGroup ? 'on' : ''}" data-sg="${i}">${n}</button>`).join('')}</div><div class="mm-grid" style="grid-template-columns:repeat(auto-fill,minmax(calc(64px*var(--gfx-scale,1)),1fr))">${groups[openGroup][1] ? groups[openGroup][1].map((nm) => `<button data-si="${nm}" aria-label="${nm}">${icon(nm, { size: 48 })}</button>`).join('') : EMOJIS.map((e) => `<button data-se="${e}" style="font-size:1.7rem">${e}</button>`).join('')}</div>`;
    box.querySelectorAll('[data-sg]').forEach((b) => b.addEventListener('click', () => { openGroup = +b.dataset.sg; renderStickers(); }));
    box.querySelectorAll('[data-si]').forEach((b) => b.addEventListener('click', () => { addLayer('sticker', { icon: b.dataset.si }); preload([b.dataset.si]).then(redraw); }));
    box.querySelectorAll('[data-se]').forEach((b) => b.addEventListener('click', () => addLayer('sticker', { emoji: b.dataset.se })));
  }
  function renderTemplates() {
    $('#mm-tpl').innerHTML = C.TEMPLATES.map((t, i) => `<button data-tp="${i}">${icon((t.layers.find((l) => l.kind === 'sticker') || {}).icon || 'star', { size: 44 })}<span>${esc(t.name)}</span></button>`).join('');
    $('#mm-tpl').querySelectorAll('[data-tp]').forEach((b) => b.addEventListener('click', () => {
      snapNow(); const keep = st.bg.type === 'img' ? st.bg : null; const keepFilter = st.filter; st = C.fromTemplate(C.TEMPLATES[+b.dataset.tp], idGen); st.filter = keepFilter;
      if (keep) { st.bg = { ...keep }; st.h = keep.img ? st.h : W; } selId = null; cv.height = st.h; syncAll();
      preload(C.iconNamesUsed(st)).then(redraw); redraw(); msg('Sjabloon geladen. Verander de tekst en sleep de stickers!');
    }));
  }
  $('#mm-emogrid').innerHTML = EMOJIS.map((e) => `<button data-e="${e}" style="min-height:44px;padding:0;font-size:1.5rem">${e}</button>`).join('');
  $('#mm-emogrid').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { snapNow(); st.bg = { type: 'emoji', idx: st.bg.idx, emoji: b.dataset.e, img: null, zoom: 1, ox: 0, oy: 0 }; bgThumbs(); renderPhotoCtl(); redraw(); }));
  $('#mm-emobg').addEventListener('click', () => { const bx = $('#mm-emobox'); bx.style.display = bx.style.display === 'none' ? 'block' : 'none'; if (st.bg.type !== 'emoji') { snapNow(); st.bg = { type: 'emoji', idx: st.bg.idx, emoji: st.bg.emoji || '😂', img: null, zoom: 1, ox: 0, oy: 0 }; bgThumbs(); renderPhotoCtl(); redraw(); } });
  $('#mm-addstk').addEventListener('click', () => { openStk = !openStk; renderStickers(); });
  $('#mm-addtxt').addEventListener('click', () => addLayer('text'));
  $('#mm-addbub').addEventListener('click', () => addLayer('bubble'));

  // foto's: uit bibliotheek of camera (accept="image/*" zonder extensies, zodat iOS de fotobibliotheek toont)
  let objUrl = null, imgCount = 0;
  function useImage(im) {
    const maxS = 1600, k = Math.min(1, maxS / Math.max(im.naturalWidth || im.width, im.naturalHeight || im.height));
    const src = document.createElement('canvas'); src.width = Math.max(1, Math.round((im.naturalWidth || im.width) * k)); src.height = Math.max(1, Math.round((im.naturalHeight || im.height) * k)); src.getContext('2d').drawImage(im, 0, 0, src.width, src.height);
    snapNow(); st.bg = { type: 'img', idx: st.bg.idx, emoji: st.bg.emoji, img: src, imgId: ++imgCount, zoom: 1, ox: 0, oy: 0 };
    setHeight(canvasHeight(src.width, src.height)); bgThumbs(); renderPhotoCtl(); redraw();
  }
  function onFile(e) {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    if (objUrl) URL.revokeObjectURL(objUrl);
    objUrl = URL.createObjectURL(f); const im = new Image();
    im.onload = () => { if (dead) return; useImage(im); msg('Foto geladen. Kies een filter of sleep er stickers op!'); };
    im.onerror = () => msg('Dit bestand kon niet als plaatje worden gelezen.', true);
    im.src = objUrl; e.target.value = '';
  }
  $('#mm-file').addEventListener('change', onFile); $('#mm-cam').addEventListener('change', onFile);
  addCleanup && addCleanup(() => { if (objUrl) URL.revokeObjectURL(objUrl); });

  // tekst boven/onder, filters, rand
  const bind = (id, fn, snap = true) => $(id).addEventListener('input', (e) => { if (snap) touch(); fn(e.target.value); redraw(); });
  bind('#mm-top', (v) => { st.top = v; }); bind('#mm-bot', (v) => { st.bottom = v; });
  bind('#mm-tsize', (v) => { st.ts.color = v; }); bind('#mm-tstroke', (v) => { st.ts.stroke = v; }); bind('#mm-tsz', (v) => { st.ts.size = +v; });
  bind('#mm-famt', (v) => { st.filter.amt = +v / 100; }); bind('#mm-br', (v) => { st.adj.brightness = +v; }); bind('#mm-ct', (v) => { st.adj.contrast = +v; }); bind('#mm-sa', (v) => { st.adj.saturate = +v; });
  bind('#mm-fw', (v) => { st.frame.w = +v; }); bind('#mm-fc', (v) => { st.frame.color = v; });
  function syncAll() {
    $('#mm-top').value = st.top; $('#mm-bot').value = st.bottom; $('#mm-tsize').value = st.ts.color; $('#mm-tstroke').value = st.ts.stroke; $('#mm-tsz').value = st.ts.size;
    $('#mm-famt').value = Math.round(st.filter.amt * 100); $('#mm-br').value = st.adj.brightness; $('#mm-ct').value = st.adj.contrast; $('#mm-sa').value = st.adj.saturate; $('#mm-fw').value = st.frame.w; $('#mm-fc').value = st.frame.color;
    if (cv.height !== st.h) cv.height = st.h;
    bgThumbs(); renderPhotoCtl(); renderFilters(); renderTplFonts(); renderSel(); renderStickers();
  }

  $('#mm-rnd').addEventListener('click', () => {
    snapNow(); const [t, b] = FUNNY[Math.floor(Math.random() * FUNNY.length)], emo = Math.random() < 0.4;
    st.bg = { type: emo ? 'emoji' : (st.bg.type === 'img' ? 'img' : 'grad'), idx: PLAIN_BGS[Math.floor(Math.random() * PLAIN_BGS.length)], emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)], img: emo ? null : st.bg.img, imgId: st.bg.imgId, zoom: st.bg.zoom || 1, ox: st.bg.ox || 0, oy: st.bg.oy || 0 };
    if (st.bg.type === 'img' && !st.bg.img) st.bg.type = 'grad';
    st.top = t; st.bottom = b; if (!st.bg.img) st.h = W; st.filter.id = Math.random() < 0.3 ? C.FILTERS[1 + Math.floor(Math.random() * (C.FILTERS.length - 1))][0] : 'none';
    syncAll(); redraw(); msg('Verrassing! Pas de tekst gerust aan.');
  });
  $('#mm-undo').addEventListener('click', doUndo);

  // ---- opslaan, delen, galerij ----
  async function renderBlob() {
    await preload(C.iconNamesUsed(st));
    const o = document.createElement('canvas'); o.width = W; o.height = st.h; paint(o.getContext('2d'), st.h, false, true);
    return new Promise((res, rej) => o.toBlob((b) => (b ? res(b) : rej(new Error('leeg'))), 'image/png'));
  }
  const download = (b, name) => { const u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000); };
  $('#mm-dl').addEventListener('click', async () => { try { download(await renderBlob(), 'meme.png'); msg('Meme opgeslagen als meme.png.'); } catch { msg('Opslaan is niet gelukt.', true); } });
  $('#mm-share').addEventListener('click', async () => {
    try {
      const b = await renderBlob(); const file = new File([b], 'meme.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Mijn meme' }); msg('Gedeeld!'); }
      else { download(b, 'meme.png'); msg('Delen kan hier niet; het plaatje is gedownload.'); }
    } catch (e) { if (!e || e.name !== 'AbortError') msg('Delen is niet gelukt.', true); }
  });
  $('#mm-copy').addEventListener('click', async () => {
    if (!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem)) { msg('Kopiëren naar het klembord kan niet in deze browser. Download de PNG.', true); return; }
    try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': renderBlob() })]); msg('Gekopieerd naar het klembord.'); }
    catch { msg('Kopiëren is geblokkeerd. Download de PNG.', true); }
  });
  const readGal = () => jget(GKEY, []);
  function writeGal(g) { try { localStorage.setItem(GKEY, JSON.stringify(C.fitMemes(g))); return true; } catch { return false; } }
  function jpegOf(canvas, maxS, q) { const k = Math.min(1, maxS / Math.max(canvas.width, canvas.height)), o = document.createElement('canvas'); o.width = Math.round(canvas.width * k); o.height = Math.round(canvas.height * k); o.getContext('2d').drawImage(canvas, 0, 0, o.width, o.height); return o.toDataURL('image/jpeg', q); }
  $('#mm-save').addEventListener('click', async () => {
    try {
      await preload(C.iconNamesUsed(st)); const o = document.createElement('canvas'); o.width = W; o.height = st.h; paint(o.getContext('2d'), st.h, false, true);
      const item = { at: Date.now(), thumb: jpegOf(o, 200, 0.7), st: C.serialize(st) };
      if (st.bg.type === 'img' && st.bg.img) item.photo = jpegOf(st.bg.img, 800, 0.72);
      const g = readGal(); if (editingGal !== null && g[editingGal]) g[editingGal] = item; else { g.unshift(item); editingGal = 0; }
      if (!writeGal(g)) return msg('Bewaren lukt niet (geheugen vol?). Verwijder oude memes.', true);
      renderGal(); msg('Bewaard in je galerij.'); saved++; if (saved === 1) celebrate('victory', { title: 'Meme gemaakt!', sub: 'Goed gedaan' });
    } catch { msg('Bewaren is niet gelukt.', true); }
  });
  function renderGal() {
    const g = readGal(), box = $('#mm-gal');
    if (!g.length) { box.innerHTML = '<small>Nog leeg. Bewaar je eerste meme!</small>'; return; }
    box.innerHTML = g.map((it, i) => `<div style="position:relative"><button data-go="${i}" style="padding:3px;width:100%"><img src="${esc(it.thumb)}" alt="meme" style="width:100%;border-radius:8px;display:block"></button><button data-gd="${i}" aria-label="Verwijder" style="position:absolute;top:2px;right:2px;min-height:34px;min-width:34px;padding:0">🗑</button></div>`).join('');
    box.querySelectorAll('[data-gd]').forEach((b) => b.addEventListener('click', () => { if (!confirm('Deze meme verwijderen?')) return; const a = readGal(); a.splice(+b.dataset.gd, 1); writeGal(a); if (editingGal === +b.dataset.gd) editingGal = null; renderGal(); }));
    box.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => {
      const it = readGal()[+b.dataset.go]; if (!it) return; snapNow();
      const o = C.restore(it.st); const finish = (img) => { st = o; st.bg.img = img; if (img) { st.bg.type = 'img'; st.bg.imgId = ++imgCount; } else if (st.bg.type === 'img') st.bg.type = 'grad'; selId = null; editingGal = +b.dataset.go; syncAll(); preload(C.iconNamesUsed(st)).then(redraw); redraw(); window.scrollTo({ top: 0 }); msg('Geopend. Je kunt hem aanpassen.'); };
      if (it.photo) { const im = new Image(); im.onload = () => { const s = document.createElement('canvas'); s.width = im.naturalWidth; s.height = im.naturalHeight; s.getContext('2d').drawImage(im, 0, 0); finish(s); }; im.onerror = () => finish(null); im.src = it.photo; } else finish(null);
    }));
  }
  let confirmReset = false;
  $('#mm-reset').addEventListener('click', () => {
    if (!confirmReset) { confirmReset = true; $('#mm-reset').textContent = 'Zeker weten? Tik nogmaals'; setTimeout(() => { confirmReset = false; $('#mm-reset').textContent = '🔄 Opnieuw'; }, 3000); return; }
    confirmReset = false; $('#mm-reset').textContent = '🔄 Opnieuw'; snapNow(); st = fresh(); selId = null; editingGal = null; syncAll(); redraw(); msg('Alles is gewist.');
  });

  renderTemplates(); syncAll(); renderGal(); paint(c, st.h, true, false);
}
