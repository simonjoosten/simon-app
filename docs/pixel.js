// Pixel-art studio: lagen, animatie (frames), spritesheets, palet-sets, vormen, selecteren/kopiëren, zoom/pan, export (PNG/GIF/spritesheet), sjablonen en galerij.
import * as P from './pixel-core.js?v=1';
import { docToCode, codeToDoc } from './creatief-r4-pixelshare.js?v=1';
import { shareBlob } from './creatief-r4-share.js?v=1';
import { mountShell, celebrate, toast, icon, esc } from './fun-ui.js?v=1';

const TOOLS = [
  ['pen', 'pencil', 'Tekenen'], ['erase', null, '🧽 Gum'], ['fill', 'paint', 'Emmer'], ['pick', null, '💧 Pipet'],
  ['line', null, '╱ Lijn'], ['rect', null, '▭ Rechthoek'], ['rectf', null, '■ Vol vak'], ['circle', null, '◯ Cirkel'], ['circlef', null, '● Vol rond'],
  ['select', null, '⬚ Selecteer'], ['hand', null, '✋ Schuif'],
];
const MIRRORS = [[null, 'Uit'], ['x', '⇋ Links-rechts'], ['y', '⇅ Boven-onder'], ['xy', '✚ Beide']];
const CV = 560;

// ctx: { view, esc, uid, addCleanup? }
export function pixelView(ctx) {
  const { view, uid, addCleanup } = ctx;
  const shell = mountShell(view, { game: 'pixel', title: 'Pixel-studio', sub: 'Lagen, animatie en meer', iconName: 'paint', addCleanup });
  const root = shell.body;
  const KEY = `pixel:gallery:${uid}`, DRAFT = `pixel:draft:${uid}`, REC = `pixel:recent:${uid}`;
  const jget = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch { return d; } };
  const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  const readG = () => jget(KEY, []);
  const writeG = (g) => jset(KEY, P.fitGallery(g));

  let doc = P.newDoc(16), fi = 0, li = 0, color = P.PALETTE[4], tool = 'pen', bsize = 1, mirror = null, gridOn = true, onion = false;
  let palIdx = 0, recent = jget(REC, []), zoom = 1, vx = 0, vy = 0, undo = [], redo = [], editing = null, name = '';
  let sel = null, flt = null, clip = null, preview = null, playing = false, previewFrame = 0, saved = 0, exportScale = 16, sheetCols = 4;
  let gesture = null, dead = false, timers = new Set();
  const draft = jget(DRAFT, null);
  if (draft && draft.v === 2) { try { doc = P.decodeDoc(draft); name = draft.name || ''; } catch { /* */ } }
  if (addCleanup) addCleanup(() => { dead = true; timers.forEach(clearInterval); });

  const snap = () => { undo.push(P.cloneDoc(doc)); if (undo.length > 40) undo.shift(); redo = []; };
  const cells = () => doc.frames[fi][li];
  let saveT = 0;
  const autosave = () => { clearTimeout(saveT); saveT = setTimeout(() => jset(DRAFT, P.encodeDoc(doc, name)), 600); };
  const commitFloat = () => { if (!flt) return; P.pasteRegion(cells(), doc.n, flt.clip, flt.x, flt.y); flt = null; sel = null; };
  const pushRecent = (c) => { recent = [c, ...recent.filter((x) => x !== c)].slice(0, 12); jset(REC, recent); };
  const setColor = (c) => { color = c; if (tool === 'erase' || tool === 'pick' || tool === 'hand') tool = 'pen'; };

  // ---- weergave van het raster ----
  const ppc = () => (CV / doc.n) * zoom;                // canvaspixels per cel
  const clampView = () => { const total = CV * zoom; vx = Math.min(0, Math.max(CV - total, vx)); vy = Math.min(0, Math.max(CV - total, vy)); };
  function render(cv) {
    const c = cv.getContext('2d'), n = doc.n, s = ppc();
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, CV, CV);
    const x0 = Math.max(0, Math.floor(-vx / s)), y0 = Math.max(0, Math.floor(-vy / s)), x1 = Math.min(n, Math.ceil((CV - vx) / s)), y1 = Math.min(n, Math.ceil((CV - vy) / s));
    const img = P.composite(doc, fi); const prev = onion && fi > 0 ? P.composite(doc, fi - 1) : null;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const px = vx + x * s, py = vy + y * s;
      c.fillStyle = (x + y) % 2 ? '#e5e7eb' : '#f3f4f6'; c.fillRect(px, py, Math.ceil(s), Math.ceil(s));
      const v = img[y * n + x];
      if (!v && prev && prev[y * n + x]) { c.globalAlpha = 0.3; c.fillStyle = prev[y * n + x]; c.fillRect(px, py, Math.ceil(s), Math.ceil(s)); c.globalAlpha = 1; }
      if (v) { c.fillStyle = v; c.fillRect(px, py, Math.ceil(s), Math.ceil(s)); }
    }
    if (flt) for (let y = 0; y < flt.clip.h; y++) for (let x = 0; x < flt.clip.w; x++) { const v = flt.clip.cells[y * flt.clip.w + x]; if (v) { c.fillStyle = v; c.fillRect(vx + (flt.x + x) * s, vy + (flt.y + y) * s, Math.ceil(s), Math.ceil(s)); } }
    if (preview) { c.globalAlpha = 0.75; c.fillStyle = tool === 'erase' ? '#ffffff' : color; for (const [x, y] of preview) if (x >= 0 && y >= 0 && x < n && y < n) c.fillRect(vx + x * s, vy + y * s, Math.ceil(s), Math.ceil(s)); c.globalAlpha = 1; }
    if (gridOn && s >= 7) { c.strokeStyle = 'rgba(0,0,0,.13)'; c.lineWidth = 1; c.beginPath(); for (let i = x0; i <= x1; i++) { c.moveTo(vx + i * s, vy + y0 * s); c.lineTo(vx + i * s, vy + y1 * s); } for (let j = y0; j <= y1; j++) { c.moveTo(vx + x0 * s, vy + j * s); c.lineTo(vx + x1 * s, vy + j * s); } c.stroke(); }
    if (mirror) { c.strokeStyle = 'rgba(236,72,153,.8)'; c.lineWidth = 2; c.beginPath(); if (mirror === 'x' || mirror === 'xy') { c.moveTo(vx + CV * zoom / 2, vy); c.lineTo(vx + CV * zoom / 2, vy + CV * zoom); } if (mirror === 'y' || mirror === 'xy') { c.moveTo(vx, vy + CV * zoom / 2); c.lineTo(vx + CV * zoom, vy + CV * zoom / 2); } c.stroke(); }
    const r = flt ? { x: flt.x, y: flt.y, w: flt.clip.w, h: flt.clip.h } : sel;
    if (r) { c.setLineDash([6, 5]); c.lineWidth = 2; c.strokeStyle = '#4f46e5'; c.strokeRect(vx + r.x * s, vy + r.y * s, r.w * s, r.h * s); c.setLineDash([]); }
  }
  const frameCanvas = (fidx, px) => {
    const cvs = document.createElement('canvas'); cvs.width = cvs.height = px; const c = cvs.getContext('2d'); const s = px / doc.n;
    c.fillStyle = '#f3f4f6'; c.fillRect(0, 0, px, px); P.composite(doc, fidx).forEach((v, i) => { if (v) { c.fillStyle = v; c.fillRect((i % doc.n) * s, ((i / doc.n) | 0) * s, Math.ceil(s), Math.ceil(s)); } }); return cvs;
  };
  const hexCanvas = (w, h, arr, scale) => { const cvs = document.createElement('canvas'); cvs.width = w * scale; cvs.height = h * scale; const c = cvs.getContext('2d'); arr.forEach((v, i) => { if (v) { c.fillStyle = v; c.fillRect((i % w) * scale, ((i / w) | 0) * scale, scale, scale); } }); return cvs; };
  const download = (blob, fname) => { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = fname; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); };
  const safeName = () => (name.trim().replace(/[^\w\-]+/g, '-').slice(0, 30) || 'pixel-art');

  function draw() {
    const s = (v) => `calc(${v}px * var(--gfx-scale,1))`;
    const palette = P.PALETTES[palIdx][1];
    const frameStrip = doc.frames.map((_, i) => `<button data-fr="${i}" class="px-fr ${i === fi ? 'on' : ''}" aria-label="Plaatje ${i + 1}"><canvas width="64" height="64" data-frc="${i}"></canvas><small>${i + 1}</small></button>`).join('');
    const layerRows = doc.layers.map((l, i) => i).reverse().map((i) => `<div class="px-lay ${i === li ? 'on' : ''}"><button data-lvis="${i}" aria-label="Zichtbaar">${doc.layers[i].vis ? '👁' : '🚫'}</button><button data-lsel="${i}" style="flex:1;text-align:left">${esc(doc.layers[i].name)}</button><button data-lup="${i}">▲</button><button data-ldn="${i}">▼</button></div>`).join('');
    const gal = readG();
    root.innerHTML = `<style>
      .px-b{min-height:${s(46)};font-size:calc(1rem*var(--gfx-font,1))}
      .px-tools{display:grid;grid-template-columns:repeat(auto-fill,minmax(${s(104)},1fr));gap:6px;margin:.5rem 0}
      .px-tools button,.px-act button{min-height:${s(48)};font-size:calc(.95rem*var(--gfx-font,1));display:flex;gap:.3rem;align-items:center;justify-content:center;padding:.2rem .4rem}
      .px-act{display:flex;flex-wrap:wrap;gap:6px;margin:.5rem 0}.px-act button{flex:1 1 auto}
      .px-pal{display:grid;grid-template-columns:repeat(auto-fill,minmax(${s(40)},1fr));gap:5px;margin:.5rem 0}
      .px-pal button{aspect-ratio:1;border-radius:10px;padding:0;min-height:${s(40)}}
      .px-strip{display:flex;gap:6px;overflow-x:auto;padding:4px 0}.px-fr{flex:none;padding:3px;border-radius:10px;border:2px solid var(--line);background:var(--card)}.px-fr.on{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent) inset}.px-fr canvas{width:${s(56)};height:${s(56)};display:block;image-rendering:pixelated;border-radius:6px}
      .px-lay{display:flex;gap:4px;margin:4px 0;padding:3px;border-radius:12px;border:2px solid transparent}.px-lay.on{border-color:var(--accent);background:rgba(99,102,241,.1)}.px-lay button{min-height:${s(44)};min-width:${s(44)}}
      .px-tpl{display:grid;grid-template-columns:repeat(auto-fill,minmax(${s(78)},1fr));gap:8px}.px-tpl button{padding:4px;display:flex;flex-direction:column;align-items:center;gap:2px}.px-tpl canvas{width:100%;image-rendering:pixelated;border-radius:8px}
      .px-hd{display:flex;align-items:center;gap:.5rem;font-weight:800;font-size:calc(1.1rem*var(--gfx-font,1))}
      .px-sel{min-height:${s(46)};border-radius:12px;padding:0 .5rem;font-size:calc(1rem*var(--gfx-font,1))}
    </style>
    <div class="box" style="padding:.7rem">
      <div class="px-hd">${icon('pencil', { size: 30 })} Tekenen <span style="flex:1"></span><small style="font-weight:500">${doc.n}×${doc.n} · plaatje ${fi + 1}/${doc.frames.length} · ${esc(doc.layers[li].name)}</small></div>
      <canvas id="px-cv" width="${CV}" height="${CV}" style="width:100%;aspect-ratio:1;border-radius:12px;touch-action:none;display:block;image-rendering:pixelated;cursor:crosshair;margin-top:.4rem"></canvas>
      <div class="px-act">
        <button id="px-zout">➖ Uit</button><button id="px-zin">➕ In</button><button id="px-zfit">⤢ Passend</button>
        <button id="px-grid" class="${gridOn ? 'pri' : ''}">▦ Raster</button><button id="px-undo" ${undo.length ? '' : 'disabled'}>↶ Terug</button><button id="px-redo" ${redo.length ? '' : 'disabled'}>↷ Opnieuw</button>
      </div>
      <div class="px-tools">${TOOLS.map(([k, ic, l]) => `<button data-tool="${k}" class="${k === tool ? 'pri' : ''}">${ic ? icon(ic, { size: 26 }) + ' ' : ''}${l}</button>`).join('')}</div>
      ${tool === 'select' ? `<div class="px-act"><button id="s-all">Alles</button><button id="s-copy">📋 Kopieer</button><button id="s-cut">✂ Knip</button><button id="s-paste" ${clip ? '' : 'disabled'}>📥 Plak</button><button id="s-del">🗑 Wis</button><button id="s-fx">⇋ Spiegel</button><button id="s-fy">⇅ Spiegel</button><button id="s-ok" ${flt ? '' : 'disabled'}>✔ Zet vast</button></div>` : ''}
      <div class="row wrap" style="gap:.5rem"><label style="display:flex;gap:.4rem;align-items:center"><small>Penseel</small>${[1, 2, 3, 4].map((b) => `<button data-bs="${b}" class="${b === bsize ? 'pri' : ''}" style="min-width:${s(44)};min-height:${s(44)}">${b}</button>`).join('')}</label></div>
      <div class="row wrap" style="gap:.4rem"><small>Spiegelen</small>${MIRRORS.map(([k, l]) => `<button data-mir="${k || ''}" class="${k === mirror ? 'pri' : ''}">${l}</button>`).join('')}</div>
    </div>
    <div class="box">
      <div class="px-hd">${icon('paint', { size: 30 })} Kleuren</div>
      <div class="row wrap"><select id="px-palsel" class="px-sel">${P.PALETTES.map(([n], i) => `<option value="${i}" ${i === palIdx ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
        <label style="display:flex;gap:.4rem;align-items:center"><small>Eigen kleur</small><input type="color" id="px-custom" value="${/^#[0-9a-f]{6}$/i.test(color) ? color : '#000000'}" style="width:${s(52)};height:${s(44)};padding:0;border:0;background:none"></label>
        <span style="width:${s(44)};height:${s(44)};border-radius:12px;border:3px solid var(--accent);background:${color}" title="Gekozen kleur"></span></div>
      <div class="px-pal">${palette.map((c) => `<button data-col="${c}" title="${c}" style="border:${c === color ? '3px solid var(--accent)' : '1px solid var(--line)'};background:${c}"></button>`).join('')}</div>
      ${recent.length ? `<small>Laatst gebruikt</small><div class="px-pal">${recent.map((c) => `<button data-col="${c}" style="border:1px solid var(--line);background:${c}"></button>`).join('')}</div>` : ''}
    </div>
    <div class="box">
      <div class="px-hd">${icon('puzzle', { size: 30 })} Lagen</div>
      <small>Hogere lagen liggen bovenop. Tik een laag om op te tekenen.</small>
      ${layerRows}
      <div class="px-act"><button id="l-add">➕ Nieuwe laag</button><button id="l-dup">⧉ Kopie</button><button id="l-merge" ${li > 0 ? '' : 'disabled'}>⬇ Voeg samen</button><button id="l-ren">✎ Naam</button><button id="l-del">🗑 Verwijder</button></div>
      <small>Hele laag:</small>
      <div class="px-act"><button id="t-fx">⇋ Spiegel</button><button id="t-fy">⇅ Spiegel</button><button id="t-rot">⟳ Draai</button><button id="t-l">◀</button><button id="t-u">▲</button><button id="t-d">▼</button><button id="t-r">▶</button><button id="t-out">◌ Omtrek</button><button id="t-clr">Laag leeg</button></div>
    </div>
    <div class="box">
      <div class="px-hd">${icon('camera', { size: 30 })} Animatie</div>
      <div class="px-strip">${frameStrip}</div>
      <div class="px-act"><button id="f-add">➕ Leeg</button><button id="f-dup">⧉ Kopie</button><button id="f-del">🗑 Weg</button><button id="f-l">◀ Eerder</button><button id="f-r">Later ▶</button><button id="f-onion" class="${onion ? 'pri' : ''}">🧅 Doorzicht</button></div>
      <div class="row wrap" style="gap:.6rem;align-items:center"><button id="f-play" class="${playing ? 'pri' : ''}" style="min-height:${s(48)}">${playing ? '⏸ Stop' : '▶ Afspelen'}</button>
        <label style="display:flex;gap:.4rem;align-items:center;flex:1;min-width:150px"><small>Snelheid ${doc.fps}/s</small><input type="range" id="f-fps" min="1" max="24" value="${doc.fps}" style="flex:1;min-height:${s(40)}"></label>
        <canvas id="px-prev" width="96" height="96" style="width:${s(96)};height:${s(96)};border-radius:10px;image-rendering:pixelated;background:#f3f4f6"></canvas></div>
    </div>
    <div class="box">
      <div class="px-hd">${icon('star', { size: 30 })} Sjablonen en formaat</div>
      <div class="px-tpl">${P.TEMPLATES.map((t, i) => `<button data-tpl="${i}"><canvas width="64" height="64" data-tplc="${i}"></canvas><small>${t.anim ? '▶ ' : ''}${esc(t.name)}</small></button>`).join('')}</div>
      <div class="row wrap" style="margin-top:.6rem"><small>Nieuw leeg raster:</small>${P.SIZES.map((z) => `<button data-size="${z}" class="${z === doc.n ? 'pri' : ''}" style="min-height:${s(44)}">${z}</button>`).join('')}</div>
    </div>
    <div class="box">
      <div class="px-hd">${icon('gift', { size: 30 })} Bewaren en delen</div>
      <input id="px-name" placeholder="Naam van je werk" maxlength="30" value="${esc(name)}" style="width:100%;box-sizing:border-box;min-height:${s(46)};margin:.4rem 0;font-size:calc(1rem*var(--gfx-font,1))">
      <div class="px-act"><button class="pri" id="px-save">💾 Bewaar in galerij</button></div>
      <div class="row wrap" style="gap:.5rem"><small>Grootte:</small>${[1, 4, 8, 16, 32].map((z) => `<button data-xs="${z}" class="${z === exportScale ? 'pri' : ''}" style="min-height:${s(44)}">×${z}</button>`).join('')}</div>
      <div class="px-act"><button id="px-png">⬇ PNG (plaatje)</button><button id="px-gif" ${doc.frames.length > 1 ? '' : 'disabled'}>⬇ GIF (animatie)</button><button id="px-sheet" ${doc.frames.length > 1 ? '' : 'disabled'}>⬇ Spritesheet</button><button id="px-share">📤 Deel</button></div>
      <div class="row wrap" style="gap:.5rem"><button id="px-code">🔗 Maak code</button><input id="px-codein" placeholder="Plak hier een code van een vriend" style="flex:1;min-width:150px;min-height:${s(44)}"><button id="px-codeload">Laad</button></div>
      <div class="row wrap" style="gap:.5rem"><small>Spritesheet kolommen:</small>${[1, 2, 4, 8].map((z) => `<button data-sc="${z}" class="${z === sheetCols ? 'pri' : ''}" style="min-height:${s(44)}">${z}</button>`).join('')}</div>
      <div id="px-msg" style="min-height:1.2rem"><small>${editing !== null ? 'Je past een bewaarde tekening aan.' : ''}</small></div>
    </div>
    <div class="box"><div class="px-hd">${icon('trophy', { size: 30 })} Mijn galerij</div>${gal.length ? '<div id="px-gal" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(92px*var(--gfx-scale,1)),1fr));gap:.6rem;margin-top:.5rem"></div><small>Tik om te openen. Houd lang ingedrukt om te verwijderen.</small>' : '<br><small>Nog leeg. Bewaar je eerste tekening!</small>'}</div>`;
    bind();
  }

  function bind() {
    const q = (sl) => root.querySelector(sl), qa = (sl) => root.querySelectorAll(sl);
    const cv = q('#px-cv'); render(cv);
    qa('[data-frc]').forEach((t) => { const c = t.getContext('2d'); c.drawImage(frameCanvas(+t.dataset.frc, 64), 0, 0); });
    qa('[data-tplc]').forEach((t) => { const tt = P.templateDoc(P.TEMPLATES[+t.dataset.tplc]); t.getContext('2d').drawImage(hexCanvas(16, 16, tt.frames[0][0], 4), 0, 0); });
    const pv = q('#px-prev'); drawPreview(pv);
    // ---- aanwijzen op het raster ----
    const cellAt = (e) => { const r = cv.getBoundingClientRect(), s = ppc(); return { x: Math.floor(((e.clientX - r.left) / r.width * CV - vx) / s), y: Math.floor(((e.clientY - r.top) / r.height * CV - vy) / s) }; };
    const inside = (p, r) => r && p.x >= r.x && p.y >= r.y && p.x < r.x + r.w && p.y < r.y + r.h;
    const stamp = (pts, col) => { P.putPts(cells(), doc.n, P.mirrorPts(pts, doc.n, mirror), col); };
    cv.onpointerdown = (e) => {
      e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch { /* */ }
      const p = cellAt(e); const inb = p.x >= 0 && p.y >= 0 && p.x < doc.n && p.y < doc.n;
      if (tool === 'hand') { gesture = { k: 'pan', sx: e.clientX, sy: e.clientY, vx, vy }; return; }
      if (tool === 'select') {
        if (flt && inside(p, { x: flt.x, y: flt.y, w: flt.clip.w, h: flt.clip.h })) { gesture = { k: 'mv', dx: flt.x - p.x, dy: flt.y - p.y }; return; }
        if (flt) { snap(); commitFloat(); render(cv); }
        if (sel && inside(p, sel)) { snap(); const reg = P.copyRegion(cells(), doc.n, sel); P.clearRegion(cells(), doc.n, sel); flt = { clip: reg, x: sel.x, y: sel.y }; gesture = { k: 'mv', dx: sel.x - p.x, dy: sel.y - p.y }; render(cv); return; }
        sel = null; gesture = { k: 'sel', a: p }; return;
      }
      if (flt) { snap(); commitFloat(); }
      if (!inb && tool !== 'pen') return;
      if (tool === 'pick') { const v = P.composite(doc, fi)[p.y * doc.n + p.x]; if (v) { color = v; tool = 'pen'; draw(); } return; }
      snap();
      if (tool === 'fill') { P.flood(cells(), doc.n, p.x, p.y, color); pushRecent(color); autosave(); draw(); return; }
      if (tool === 'pen' || tool === 'erase') { const col = tool === 'erase' ? null : color; stamp(P.brushPts(p.x, p.y, bsize), col); gesture = { k: 'free', last: p, col }; render(cv); return; }
      gesture = { k: 'shape', a: p, b: p };
    };
    cv.onpointermove = (e) => {
      if (!gesture) return; const p = cellAt(e);
      if (gesture.k === 'pan') { const r = cv.getBoundingClientRect(); vx = gesture.vx + (e.clientX - gesture.sx) / r.width * CV; vy = gesture.vy + (e.clientY - gesture.sy) / r.height * CV; clampView(); render(cv); return; }
      if (gesture.k === 'free') { const pts = P.linePts(gesture.last.x, gesture.last.y, p.x, p.y).flatMap(([x, y]) => P.brushPts(x, y, bsize)); stamp(pts, gesture.col); gesture.last = p; render(cv); return; }
      if (gesture.k === 'sel') { gesture.b = p; const a = gesture.a; sel = P.normRect(Math.max(0, Math.min(doc.n - 1, a.x)), Math.max(0, Math.min(doc.n - 1, a.y)), Math.max(0, Math.min(doc.n - 1, p.x)), Math.max(0, Math.min(doc.n - 1, p.y))); render(cv); return; }
      if (gesture.k === 'mv') { flt.x = p.x + gesture.dx; flt.y = p.y + gesture.dy; render(cv); return; }
      if (gesture.k === 'shape') {
        gesture.b = p; const { a } = gesture;
        const base = tool === 'line' ? P.linePts(a.x, a.y, p.x, p.y) : tool === 'rect' || tool === 'rectf' ? P.rectPts(a.x, a.y, p.x, p.y, tool === 'rectf') : P.ellipsePts(a.x, a.y, p.x, p.y, tool === 'circlef');
        preview = P.mirrorPts(base.flatMap(([x, y]) => P.brushPts(x, y, tool === 'rectf' || tool === 'circlef' ? 1 : bsize)), doc.n, mirror); render(cv);
      }
    };
    const end = () => {
      if (!gesture) return; const g = gesture; gesture = null;
      if (g.k === 'shape') { if (preview) { P.putPts(cells(), doc.n, preview, color); pushRecent(color); } preview = null; autosave(); draw(); return; }
      if (g.k === 'free') { if (g.col) pushRecent(g.col); autosave(); draw(); return; }
      if (g.k === 'sel' || g.k === 'mv') { draw(); return; }
    };
    cv.onpointerup = end; cv.onpointercancel = end;
    cv.onwheel = (e) => { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.25 : 0.8, e, cv); };
    // ---- knoppen ----
    const on = (id, fn) => { const el = q(id); if (el) el.onclick = fn; };
    qa('[data-tool]').forEach((b) => b.onclick = () => { if (flt && b.dataset.tool !== 'select') { snap(); commitFloat(); } if (b.dataset.tool !== 'select') sel = null; tool = b.dataset.tool; draw(); });
    qa('[data-bs]').forEach((b) => b.onclick = () => { bsize = +b.dataset.bs; draw(); });
    qa('[data-mir]').forEach((b) => b.onclick = () => { mirror = b.dataset.mir || null; draw(); });
    qa('[data-col]').forEach((b) => b.onclick = () => { setColor(b.dataset.col); draw(); });
    q('#px-palsel').onchange = (e) => { palIdx = +e.target.value; draw(); };
    q('#px-custom').oninput = (e) => { color = e.target.value; if (tool === 'erase' || tool === 'pick' || tool === 'hand') tool = 'pen'; };
    q('#px-custom').onchange = () => { pushRecent(color); draw(); };
    on('#px-zin', () => zoomBy(1.5, null, cv)); on('#px-zout', () => zoomBy(1 / 1.5, null, cv)); on('#px-zfit', () => { zoom = 1; vx = vy = 0; draw(); });
    on('#px-grid', () => { gridOn = !gridOn; draw(); });
    on('#px-undo', () => { if (!undo.length) return; redo.push(P.cloneDoc(doc)); doc = undo.pop(); clampIdx(); flt = sel = null; autosave(); draw(); });
    on('#px-redo', () => { if (!redo.length) return; undo.push(P.cloneDoc(doc)); doc = redo.pop(); clampIdx(); flt = sel = null; autosave(); draw(); });
    // selectie-acties
    const region = () => (flt ? null : sel);
    on('#s-all', () => { commitFloat(); sel = { x: 0, y: 0, w: doc.n, h: doc.n }; draw(); });
    on('#s-copy', () => { if (flt) clip = flt.clip; else if (sel) clip = P.copyRegion(cells(), doc.n, sel); toast('Gekopieerd'); draw(); });
    on('#s-cut', () => { if (flt) { clip = flt.clip; flt = null; sel = null; } else if (sel) { snap(); clip = P.copyRegion(cells(), doc.n, sel); P.clearRegion(cells(), doc.n, sel); sel = null; } autosave(); draw(); });
    on('#s-paste', () => { if (!clip) return; if (flt) { snap(); commitFloat(); } flt = { clip, x: sel ? sel.x : 0, y: sel ? sel.y : 0 }; draw(); });
    on('#s-del', () => { if (flt) { flt = null; sel = null; } else if (sel) { snap(); P.clearRegion(cells(), doc.n, sel); sel = null; } autosave(); draw(); });
    const flipSel = (ax) => { if (flt) { const c = flt.clip, o = Array(c.w * c.h).fill(null); for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) o[(ax === 'y' ? c.h - 1 - y : y) * c.w + (ax === 'x' ? c.w - 1 - x : x)] = c.cells[y * c.w + x]; flt.clip = { w: c.w, h: c.h, cells: o }; } else if (region()) { snap(); const r = sel, reg = P.copyRegion(cells(), doc.n, r); P.clearRegion(cells(), doc.n, r); const o = Array(r.w * r.h).fill(null); for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) o[(ax === 'y' ? r.h - 1 - y : y) * r.w + (ax === 'x' ? r.w - 1 - x : x)] = reg.cells[y * r.w + x]; P.pasteRegion(cells(), doc.n, { w: r.w, h: r.h, cells: o }, r.x, r.y); } autosave(); draw(); };
    on('#s-fx', () => flipSel('x')); on('#s-fy', () => flipSel('y'));
    on('#s-ok', () => { snap(); commitFloat(); autosave(); draw(); });
    // lagen
    const prep = () => { if (flt) { snap(); commitFloat(); } };
    qa('[data-lsel]').forEach((b) => b.onclick = () => { prep(); li = +b.dataset.lsel; draw(); });
    qa('[data-lvis]').forEach((b) => b.onclick = () => { const i = +b.dataset.lvis; doc.layers[i].vis = !doc.layers[i].vis; autosave(); draw(); });
    qa('[data-lup]').forEach((b) => b.onclick = () => { snap(); const i = +b.dataset.lup; const j = P.moveLayer(doc, i, 1); if (li === i) li = j; else if (li === j) li = i; autosave(); draw(); });
    qa('[data-ldn]').forEach((b) => b.onclick = () => { snap(); const i = +b.dataset.ldn; const j = P.moveLayer(doc, i, -1); if (li === i) li = j; else if (li === j) li = i; autosave(); draw(); });
    on('#l-add', () => { prep(); snap(); if (P.addLayer(doc)) li = doc.layers.length - 1; else toast(`Meer dan ${P.MAX_LAYERS} lagen kan niet.`); autosave(); draw(); });
    on('#l-dup', () => { prep(); snap(); if (P.dupLayer(doc, li)) li++; else toast('Te veel lagen.'); autosave(); draw(); });
    on('#l-merge', () => { prep(); snap(); if (P.mergeDown(doc, li)) li--; autosave(); draw(); });
    on('#l-del', () => { prep(); if (doc.layers.length <= 1) { toast('Je hebt minstens één laag nodig.'); return; } snap(); P.removeLayer(doc, li); li = Math.max(0, li - 1); autosave(); draw(); });
    on('#l-ren', () => { const nn = prompt('Naam van de laag', doc.layers[li].name); if (nn && nn.trim()) { doc.layers[li].name = nn.trim().slice(0, 20); autosave(); draw(); } });
    const xf = (fn) => () => { prep(); snap(); doc.frames[fi][li] = fn(cells()); autosave(); draw(); };
    on('#t-fx', xf((c) => P.flipCells(c, doc.n, 'x'))); on('#t-fy', xf((c) => P.flipCells(c, doc.n, 'y'))); on('#t-rot', xf((c) => P.rotateCells(c, doc.n)));
    on('#t-l', xf((c) => P.shiftCells(c, doc.n, -1, 0))); on('#t-r', xf((c) => P.shiftCells(c, doc.n, 1, 0))); on('#t-u', xf((c) => P.shiftCells(c, doc.n, 0, -1))); on('#t-d', xf((c) => P.shiftCells(c, doc.n, 0, 1)));
    on('#t-out', xf((c) => P.outline(c, doc.n, color))); on('#t-clr', xf(() => P.blank(doc.n)));
    // frames
    qa('[data-fr]').forEach((b) => b.onclick = () => { prep(); fi = +b.dataset.fr; draw(); });
    on('#f-add', () => { prep(); snap(); const k = P.addFrame(doc, fi, false); if (k < 0) toast(`Maximaal ${P.MAX_FRAMES} plaatjes.`); else fi = k; autosave(); draw(); });
    on('#f-dup', () => { prep(); snap(); const k = P.addFrame(doc, fi, true); if (k < 0) toast(`Maximaal ${P.MAX_FRAMES} plaatjes.`); else fi = k; autosave(); draw(); });
    on('#f-del', () => { prep(); if (doc.frames.length <= 1) { toast('Je hebt minstens één plaatje nodig.'); return; } snap(); P.removeFrame(doc, fi); fi = Math.max(0, fi - 1); autosave(); draw(); });
    on('#f-l', () => { prep(); snap(); fi = P.moveFrame(doc, fi, -1); autosave(); draw(); });
    on('#f-r', () => { prep(); snap(); fi = P.moveFrame(doc, fi, 1); autosave(); draw(); });
    on('#f-onion', () => { onion = !onion; draw(); });
    on('#f-play', () => { playing = !playing; previewFrame = 0; draw(); });
    q('#f-fps').oninput = (e) => { doc.fps = +e.target.value; startTimer(); }; q('#f-fps').onchange = () => { autosave(); draw(); };
    // sjablonen en formaat
    qa('[data-tpl]').forEach((b) => b.onclick = () => { if (hasContent() && !confirm('Een sjabloon laden? Je huidige tekening gaat verloren (bewaar hem eerst).')) return; snap(); doc = P.templateDoc(P.TEMPLATES[+b.dataset.tpl]); fi = li = 0; name = P.TEMPLATES[+b.dataset.tpl].name; flt = sel = null; editing = null; zoom = 1; vx = vy = 0; autosave(); draw(); toast('Sjabloon geladen. Maak hem helemaal van jou!'); });
    qa('[data-size]').forEach((b) => b.onclick = () => { if (hasContent() && !confirm('Een nieuw raster maken? Je huidige tekening gaat verloren (bewaar hem eerst).')) return; doc = P.newDoc(+b.dataset.size); fi = li = 0; undo = []; redo = []; flt = sel = null; editing = null; name = ''; zoom = 1; vx = vy = 0; autosave(); draw(); });
    // bestand
    q('#px-name').oninput = (e) => { name = e.target.value; autosave(); };
    qa('[data-xs]').forEach((b) => b.onclick = () => { exportScale = +b.dataset.xs; draw(); });
    qa('[data-sc]').forEach((b) => b.onclick = () => { sheetCols = +b.dataset.sc; draw(); });
    const msg = (t, err) => { q('#px-msg').innerHTML = err ? `<span class="err">${esc(t)}</span>` : `<small>${esc(t)}</small>`; };
    const maxScale = (w) => Math.max(1, Math.min(exportScale, Math.floor(4096 / w)));
    on('#px-png', () => { prep(); const sc = maxScale(doc.n); hexCanvas(doc.n, doc.n, P.composite(doc, fi), sc).toBlob((bl) => { if (!bl) return msg('Plaatje maken lukt niet.', true); download(bl, safeName() + '.png'); msg('PNG opgeslagen.'); }); });
    on('#px-sheet', () => { prep(); const sh = P.spritesheet(doc, sheetCols), sc = maxScale(sh.w); hexCanvas(sh.w, sh.h, sh.cells, sc).toBlob((bl) => { if (!bl) return msg('Maken lukt niet.', true); download(bl, safeName() + '-spritesheet.png'); msg(`Spritesheet ${sh.cols}×${sh.rows} opgeslagen.`); }); });
    on('#px-gif', () => { prep(); try { const sc = Math.max(1, Math.min(Math.max(2, exportScale), Math.floor(640 / doc.n))); const bytes = P.gifFromDoc(doc, sc); download(new Blob([bytes], { type: 'image/gif' }), safeName() + '.gif'); msg(`GIF opgeslagen (${doc.frames.length} plaatjes).`); if (doc.frames.length >= 4) celebrate('levelup', { title: 'Je animatie is klaar!', sub: 'GIF opgeslagen' }); } catch { msg('GIF maken lukt niet.', true); } });
    on('#px-share', () => { prep(); try { if (doc.frames.length > 1) { const sc = Math.max(1, Math.min(Math.max(2, exportScale), Math.floor(640 / doc.n))); shareBlob(new Blob([P.gifFromDoc(doc, sc)], { type: 'image/gif' }), safeName() + '.gif', name).then((r) => msg(r === 'shared' ? 'Gedeeld!' : r === 'downloaded' ? 'Opgeslagen (delen kan niet op dit apparaat).' : '')); } else { const sc = maxScale(doc.n); hexCanvas(doc.n, doc.n, P.composite(doc, fi), sc).toBlob((bl) => { if (!bl) return msg('Plaatje maken lukt niet.', true); shareBlob(bl, safeName() + '.png', name).then((r) => msg(r === 'shared' ? 'Gedeeld!' : r === 'downloaded' ? 'Opgeslagen (delen kan niet op dit apparaat).' : '')); }); } } catch { msg('Delen lukt niet.', true); } });
    on('#px-code', () => { prep(); const c = docToCode(doc, name); const inp = q('#px-codein'); if (inp) inp.value = c; try { navigator.clipboard.writeText(c).then(() => msg('Code gekopieerd! Stuur hem naar een vriend.'), () => msg('Code staat in het vak. Kopieer hem zelf.')); } catch { msg('Code staat in het vak. Kopieer hem zelf.'); } });
    on('#px-codeload', () => { const r = codeToDoc((q('#px-codein') || {}).value); if (!r) return msg('Deze code klopt niet. Plak de hele code.', true); if (hasContent() && !confirm('Een code laden? Je huidige tekening gaat verloren (bewaar hem eerst).')) return; snap(); doc = r.doc; fi = li = 0; name = r.name || 'Tekening van een vriend'; flt = sel = null; editing = null; zoom = 1; vx = vy = 0; autosave(); draw(); toast('Tekening geladen!'); });
    on('#px-save', () => {
      prep(); if (!doc.frames.some((f) => f.some((c) => c.some(Boolean)))) return msg('Teken eerst iets.', true);
      const g = readG(); const item = P.encodeDoc(doc, name);
      if (editing !== null && g[editing]) g[editing] = item; else { g.unshift(item); editing = 0; }
      if (!writeG(g)) return msg('Bewaren lukt niet (geheugen vol?). Verwijder oude werken.', true);
      saved++; if (g.length === 1 || g.length % 10 === 0 || saved === 1) celebrate(g.length >= 10 ? 'new-record' : 'victory', { title: g.length >= 10 ? 'Echte kunstenaar!' : 'Mooi gedaan!', sub: `${g.length} ${g.length === 1 ? 'werk' : 'werken'} in je galerij` });
      draw(); toast('Bewaard in je galerij');
    });
    const gv = q('#px-gal');
    if (gv) readG().forEach((it, i) => {
      let d2; try { d2 = P.decodeDoc(it); } catch { return; }
      const wrap = document.createElement('button'); wrap.style.cssText = 'padding:4px;display:flex;flex-direction:column;gap:2px;align-items:center'; const sc = 64 / it.size;
      const t = hexCanvas(it.size, it.size, P.composite(d2, 0), Math.max(1, Math.floor(sc))); t.style.cssText = 'width:100%;border-radius:8px;image-rendering:pixelated;background:#f3f4f6';
      wrap.appendChild(t); const lab = document.createElement('small'); lab.textContent = (it.name || `${it.size}×${it.size}`) + (it.frames && it.frames.length > 1 ? ' 🎞' : ''); wrap.appendChild(lab); gv.appendChild(wrap);
      let timer = null, long = false;
      wrap.onpointerdown = () => { long = false; timer = setTimeout(() => { long = true; if (!confirm('Dit werk verwijderen?')) return; const g = readG(); g.splice(i, 1); writeG(g); if (editing === i) editing = null; draw(); }, 700); };
      wrap.onpointerup = wrap.onpointerleave = wrap.onpointercancel = () => clearTimeout(timer);
      wrap.onclick = () => { if (long) return; doc = d2; fi = li = 0; undo = []; redo = []; editing = i; name = it.name || ''; flt = sel = null; zoom = 1; vx = vy = 0; draw(); window.scrollTo({ top: 0 }); };
    });
    startTimer();
  }
  const hasContent = () => doc.frames.some((f) => f.some((c) => c.some(Boolean)));
  const clampIdx = () => { fi = Math.min(fi, doc.frames.length - 1); li = Math.min(li, doc.layers.length - 1); };
  function zoomBy(f, e, cv) {
    const old = zoom; zoom = Math.max(1, Math.min(10, zoom * f)); if (zoom === old) return;
    const r = cv.getBoundingClientRect(); const mx = e ? (e.clientX - r.left) / r.width * CV : CV / 2, my = e ? (e.clientY - r.top) / r.height * CV : CV / 2;
    vx = mx - (mx - vx) * zoom / old; vy = my - (my - vy) * zoom / old; clampView(); render(cv);
  }
  function drawPreview(pv) {
    if (!pv) return; const c = pv.getContext('2d'); c.clearRect(0, 0, 96, 96);
    const idx = playing ? previewFrame % doc.frames.length : fi; c.imageSmoothingEnabled = false; c.drawImage(frameCanvas(idx, 96), 0, 0);
  }
  let animTimer = null;
  function startTimer() {
    clearInterval(animTimer); timers.delete(animTimer);
    if (!playing || doc.frames.length < 2) return;
    animTimer = setInterval(() => { const pv = root.querySelector('#px-prev'); if (dead || !pv || !pv.isConnected) { clearInterval(animTimer); return; } previewFrame++; drawPreview(pv); }, 1000 / Math.max(1, doc.fps));
    timers.add(animTimer);
  }
  draw();
}
