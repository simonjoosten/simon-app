// Meme-maker: achtergrond (foto, kleurverloop, grote emoji), boven-/onderregel, vrije tekstlagen en stickers op een canvas.

const W = 1080, MAXH = 1350;
const FONT = '"Impact","Arial Black","Helvetica Neue",Arial,sans-serif';
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const EMOJIS = ['😂', '🤣', '😎', '🤔', '😱', '🥳', '😭', '🙃', '🤪', '😴', '🤯', '😈', '🥸', '🤡', '👻', '💩', '🔥', '💀', '👀', '🙈', '🐶', '🐱', '🐸', '🦆', '🐮', '🐧', '🦄', '🐷', '🍕', '🍟', '🍩', '🍺', '☕', '🧀', '🥔', '🚲', '⚽', '🎉', '💯', '❤️'];
const COLORS = ['#ffffff', '#000000', '#facc15', '#ef4444', '#3b82f6', '#22c55e', '#ec4899', '#f97316'];

// 12 achtergronden: [naam, tekenfunctie(c, w, h)]
const lin = (c, w, h, a, b, ang = 0.6) => { const g = c.createLinearGradient(0, 0, w * Math.cos(ang), h * Math.sin(ang) + h * 0.4); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, w, h); };
const BGS = [
  ['Zonsondergang', (c, w, h) => lin(c, w, h, '#f97316', '#be185d', 1.2)],
  ['Oceaan', (c, w, h) => lin(c, w, h, '#06b6d4', '#1e3a8a', 1.4)],
  ['Bos', (c, w, h) => lin(c, w, h, '#a3e635', '#14532d', 1.2)],
  ['Snoepje', (c, w, h) => lin(c, w, h, '#f9a8d4', '#a78bfa', 0.9)],
  ['Nacht', (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, Math.max(w, h) * 0.7); g.addColorStop(0, '#4338ca'); g.addColorStop(1, '#0f0a2a'); c.fillStyle = g; c.fillRect(0, 0, w, h); }],
  ['Zon', (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h) * 0.7); g.addColorStop(0, '#fef08a'); g.addColorStop(1, '#f97316'); c.fillStyle = g; c.fillRect(0, 0, w, h); }],
  ['Strepen', (c, w, h) => { c.fillStyle = '#fde047'; c.fillRect(0, 0, w, h); c.fillStyle = '#ef4444'; for (let x = -h; x < w + h; x += 120) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 60, 0); c.lineTo(x + 60 - h * 0.5, h); c.lineTo(x - h * 0.5, h); c.fill(); } }],
  ['Stippen', (c, w, h) => { c.fillStyle = '#38bdf8'; c.fillRect(0, 0, w, h); c.fillStyle = '#e0f2fe'; for (let y = 0; y < h + 60; y += 90) for (let x = ((y / 90) % 2) * 45; x < w + 60; x += 90) { c.beginPath(); c.arc(x, y, 24, 0, 7); c.fill(); } }],
  ['Ruit', (c, w, h) => { const s = 135; for (let y = 0; y * s < h; y++) for (let x = 0; x * s < w; x++) { c.fillStyle = (x + y) % 2 ? '#ffffff' : '#16a34a'; c.fillRect(x * s, y * s, s, s); } }],
  ['Zonnestralen', (c, w, h) => { c.fillStyle = '#fbbf24'; c.fillRect(0, 0, w, h); c.fillStyle = '#fb923c'; const cx = w / 2, cy = h / 2, R = Math.max(w, h); for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R, a, a + Math.PI / 20); c.fill(); } }],
  ['Paars-groen', (c, w, h) => lin(c, w, h, '#7c3aed', '#34d399', 0.5)],
  ['Grijs', (c, w, h) => lin(c, w, h, '#e5e7eb', '#4b5563', 1.3)],
];

const FUNNY = [
  ['Als je maandag ziet', 'en het is pas zondagavond'], ['Ik: ik ga vroeg slapen', 'Ook ik om 3 uur: nog één filmpje'],
  ['Wat denk je dat je doet', 'met mijn laatste stuk pizza'], ['Mama zei: we hebben thuis frikandellen', 'De frikandellen thuis:'],
  ['Huiswerk maken?', 'Eerst even de kat knuffelen'], ['Kijk eens hoe goed ik opruim', 'Alles onder het bed geschoven'],
  ['Wifi valt uit', 'Ineens weer buiten spelen'], ['Mijn plan voor vandaag', 'Niks, en dat ook nog slecht'],
  ['Opa vertelt weer', 'Vroeger was alles beter, ook de fiets'], ['Ik zei nog 1 aflevering', 'Het is nu 5 uur in de ochtend'],
  ['Niemand: helemaal niemand', 'Mijn hond om 6 uur: ontbijt!'], ['Dat ene vriendje', 'dat altijd je friet opeet'],
  ['Even snel boodschappen doen', 'Komt thuis met 14 dingen, geen melk'], ['Ik heb honger', 'Koelkast open, koelkast dicht, herhaal'],
  ['Teamgeest!', 'Maar ik doe het wel alleen'], ['Hoe laat is het?', 'Tijd om te snacken'],
  ['Het regent weer', 'Typisch Nederland, jas vergeten'], ['Mijn wekker om 7:00', 'Mijn bed: nee'],
  ['Als de juf zegt: pak je schrift', 'Ik: welk schrift?'], ['Fietsen tegen de wind in', 'Terugweg: ook tegen de wind in'],
  ['Zeg het met een stroopwafel', 'Alles is beter met stroop'], ['Ik beloofde minder snoep', 'De snoeppot lacht me uit'],
  ['Wie heeft er koekjes gepakt?', 'Niet kijken naar mijn mond'], ['Mijn kamer is een puinhoop', 'Ik weet precies waar alles ligt'],
  ['Vroeg op en fris', 'Zei niemand ooit'], ['Eén pannenkoek erbij', 'Zei ik tegen de zevende'],
  ['Als je je schoenen vergeet', 'Gewoon op sokken naar school'], ['Mijn gamevaardigheden', 'Verloren van een kind van 6'],
  ['Spaghetti eten met wit shirt', 'Wat kan er misgaan?'], ['Ik ben niet te laat', 'Iedereen was gewoon te vroeg'],
  ['Zondagmiddag', 'Horizontaal op de bank, geen plannen'], ['Zwemles vandaag', 'Mijn zwembroek: zoek de fout'],
  ['Ik probeer gezond te eten', 'Hmm, friet telt als groente'],
];

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

export function memeView(ctx) {
  const { view, esc, addCleanup } = ctx;
  const cv0 = document.createElement('canvas'); // meetcanvas
  const mc = cv0.getContext('2d');
  const measureAt = (size, emoji) => { mc.font = emoji ? `${size}px ${EMOJI_FONT}` : `900 ${size}px ${FONT}`; return (t) => mc.measureText(t).width; };

  let st, nextId = 1, selId = null, confirmReset = false, raf = 0, dead = false, objUrl = null;
  const fresh = () => ({ h: W, bg: { type: 'grad', idx: 0, emoji: '😂', img: null }, top: '', bottom: '', ts: { color: '#ffffff', stroke: '#000000', size: 110 }, layers: [] });
  st = fresh();
  addCleanup(() => { dead = true; cancelAnimationFrame(raf); if (objUrl) URL.revokeObjectURL(objUrl); });

  view.innerHTML = `
    <div class="box" style="padding:.6rem">
      <canvas id="mm-cv" width="${W}" height="${W}" style="width:100%;height:auto;display:block;border-radius:10px;touch-action:none;background:#ddd;cursor:grab"></canvas>
      <div id="mm-msg" style="min-height:1.3rem;margin-top:.3rem"><small>Tik een laag op het plaatje om hem te verslepen.</small></div>
    </div>
    <div class="box">
      <b>Achtergrond</b>
      <div class="row wrap" style="margin-top:.4rem">
        <label class="chip" style="min-height:40px;display:inline-flex;align-items:center;cursor:pointer">📷 Eigen foto<input id="mm-file" type="file" accept="image/*" style="display:none"></label>
        <button id="mm-emobg">🎭 Grote emoji</button>
        <button id="mm-rnd" class="pri">🎲 Verras me</button>
      </div>
      <div id="mm-grads" style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:.5rem 0"></div>
      <div id="mm-emobox" style="display:none"><small>Kies de grote emoji</small><div id="mm-emogrid" style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;margin-top:.3rem"></div></div>
    </div>
    <div class="box">
      <b>Tekst</b>
      <input id="mm-top" placeholder="Bovenregel" maxlength="120" style="width:100%;box-sizing:border-box;min-height:44px;margin:.4rem 0 .3rem">
      <input id="mm-bot" placeholder="Onderregel" maxlength="120" style="width:100%;box-sizing:border-box;min-height:44px">
      <div class="row wrap" style="margin-top:.5rem"><small>Boven/onder:</small>
        <label class="row" style="gap:.3rem"><small>letter</small><input id="mm-tsize" type="color" style="width:44px;height:40px;padding:0;border:0;background:none"></label>
        <label class="row" style="gap:.3rem"><small>rand</small><input id="mm-tstroke" type="color" style="width:44px;height:40px;padding:0;border:0;background:none"></label>
        <label class="row" style="gap:.3rem;flex:1;min-width:120px"><small>grootte</small><input id="mm-tsz" type="range" min="40" max="200" style="flex:1;min-height:40px"></label>
      </div>
    </div>
    <div class="box">
      <b>Lagen</b>
      <div class="row wrap" style="margin-top:.4rem"><button id="mm-addtxt">➕ Tekstlaag</button><button id="mm-addstk">➕ Sticker</button></div>
      <div id="mm-stkbox" style="display:none;grid-template-columns:repeat(8,1fr);gap:4px;margin-top:.4rem"></div>
      <div id="mm-sel" style="margin-top:.5rem"></div>
    </div>
    <div class="box">
      <div class="row wrap"><button class="pri" id="mm-dl">⬇ PNG downloaden</button><button id="mm-copy">📋 Kopieer naar klembord</button></div>
      <div class="row wrap" id="mm-reset"></div>
    </div>`;
  const $ = (s) => view.querySelector(s);
  const cv = $('#mm-cv'), c = cv.getContext('2d');
  const msg = (t, err) => { $('#mm-msg').innerHTML = err ? `<span class="err">${esc(t)}</span>` : `<small>${esc(t)}</small>`; };

  // ---- tekenen ----
  function drawBg(g, h) {
    const b = st.bg;
    if (b.type === 'img' && b.img) { g.drawImage(b.img, 0, 0, W, h); return; }
    BGS[b.idx][1](g, W, h);
    if (b.type === 'emoji') {
      const s = Math.min(W, h) * 0.72; g.font = `${s}px ${EMOJI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 40; g.shadowOffsetY = 14; g.fillText(b.emoji, W / 2, h / 2 + s * 0.04); g.shadowColor = 'transparent';
    }
  }
  function outlined(g, lines, size, cx, cy, color, stroke) {
    g.font = `900 ${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.miterLimit = 2;
    g.lineWidth = Math.max(2, size * 0.16); g.strokeStyle = stroke; g.fillStyle = color;
    const lh = size * 1.12, y0 = cy - (lines.length - 1) * lh / 2;
    lines.forEach((ln, i) => { g.strokeText(ln, cx, y0 + i * lh); g.fillText(ln, cx, y0 + i * lh); });
  }
  function layout(l) {
    if (l.kind === 'sticker') { l.w = l.size * 1.25; l.h = l.size * 1.25; return; }
    const txt = (l.text || 'Tekst').toUpperCase();
    l.lines = wrapText(measureAt(l.size), txt, W * 0.9);
    l.w = Math.max(...l.lines.map((s) => measureAt(l.size)(s))) + l.size * 0.2; l.h = l.lines.length * l.size * 1.12 + l.size * 0.1;
  }
  function paint(g, h, showSel) {
    g.clearRect(0, 0, W, h); drawBg(g, h);
    const ts = st.ts, maxH = h * 0.3;
    for (const [txt, atTop] of [[st.top, true], [st.bottom, false]]) {
      if (!txt.trim()) continue;
      const f = fitText((s) => measureAt(s), txt.toUpperCase(), W * 0.94, maxH, ts.size);
      const bh = f.lines.length * f.size * 1.12;
      outlined(g, f.lines, f.size, W / 2, atTop ? 22 + bh / 2 : h - 22 - bh / 2, ts.color, ts.stroke);
    }
    for (const l of st.layers) {
      layout(l);
      g.save(); g.translate(l.x, l.y); g.rotate(l.rot * Math.PI / 180);
      if (l.kind === 'sticker') { g.font = `${l.size}px ${EMOJI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(l.emoji, 0, l.size * 0.04); }
      else outlined(g, l.lines, l.size, 0, 0, l.color, l.stroke);
      if (showSel && l.id === selId) { g.setLineDash([14, 10]); g.lineWidth = 4; g.strokeStyle = '#4f46e5'; g.strokeRect(-l.w / 2, -l.h / 2, l.w, l.h); g.setLineDash([]); }
      g.restore();
    }
  }
  const redraw = () => { if (raf || dead) return; raf = requestAnimationFrame(() => { raf = 0; if (!dead) paint(c, st.h, true); }); };
  function setHeight(h) { st.h = h; if (cv.height !== h) cv.height = h; redraw(); }

  // ---- lagen ----
  const sel = () => st.layers.find((l) => l.id === selId);
  function addLayer(kind, emoji) {
    const l = { id: nextId++, kind, x: W / 2, y: st.h / 2, rot: 0, size: kind === 'sticker' ? 260 : 90, color: '#ffffff', stroke: '#000000', text: 'Nieuwe tekst', emoji };
    st.layers.push(l); selId = l.id; renderSel(); redraw();
  }
  function renderSel() {
    const l = sel(), box = $('#mm-sel');
    if (!l) { box.innerHTML = st.layers.length ? '<small>Tik een laag om hem te bewerken.</small>' : '<small>Nog geen lagen.</small>'; return; }
    const col = (id, v) => `<input type="color" id="${id}" value="${v}" style="width:44px;height:40px;padding:0;border:0;background:none">`;
    box.innerHTML = `<div class="chip" style="margin-bottom:.4rem">${l.kind === 'sticker' ? 'Sticker ' + esc(l.emoji) : 'Tekstlaag'} geselecteerd</div>
      ${l.kind === 'text' ? `<input id="ml-text" value="${esc(l.text)}" maxlength="120" style="width:100%;box-sizing:border-box;min-height:44px;margin-bottom:.3rem"><div class="row wrap"><label class="row" style="gap:.3rem"><small>letter</small>${col('ml-col', l.color)}</label><label class="row" style="gap:.3rem"><small>rand</small>${col('ml-str', l.stroke)}</label></div>` : ''}
      <label class="row" style="gap:.4rem"><small style="width:4.5rem">Grootte</small><input id="ml-size" type="range" min="30" max="500" value="${l.size}" style="flex:1;min-height:40px"></label>
      <label class="row" style="gap:.4rem"><small style="width:4.5rem">Draaien</small><input id="ml-rot" type="range" min="-180" max="180" value="${l.rot}" style="flex:1;min-height:40px"></label>
      <div class="row wrap"><button id="ml-fwd">⬆ Naar voren</button><button id="ml-back">⬇ Naar achteren</button><button id="ml-dup">⧉ Kopie</button><button id="ml-del">🗑 Verwijder</button></div>`;
    const on = (id, ev, fn) => { const e = box.querySelector(id); if (e) e.addEventListener(ev, fn); };
    on('#ml-text', 'input', (e) => { l.text = e.target.value; redraw(); });
    on('#ml-col', 'input', (e) => { l.color = e.target.value; redraw(); });
    on('#ml-str', 'input', (e) => { l.stroke = e.target.value; redraw(); });
    on('#ml-size', 'input', (e) => { l.size = +e.target.value; redraw(); });
    on('#ml-rot', 'input', (e) => { l.rot = +e.target.value; redraw(); });
    const move = (d) => { const i = st.layers.indexOf(l), j = i + d; if (j < 0 || j >= st.layers.length) return; st.layers.splice(i, 1); st.layers.splice(j, 0, l); redraw(); };
    on('#ml-fwd', 'click', () => move(1)); on('#ml-back', 'click', () => move(-1));
    on('#ml-dup', 'click', () => { const n = { ...l, id: nextId++, x: l.x + 40, y: l.y + 40 }; st.layers.push(n); selId = n.id; renderSel(); redraw(); });
    on('#ml-del', 'click', () => { st.layers = st.layers.filter((x) => x !== l); selId = null; renderSel(); redraw(); });
  }

  // ---- slepen ----
  let drag = null;
  const pt = (e) => toCanvasPoint(e.clientX, e.clientY, cv.getBoundingClientRect(), cv.width, cv.height);
  cv.addEventListener('pointerdown', (e) => {
    const p = pt(e); let hit = null;
    for (let i = st.layers.length - 1; i >= 0; i--) { const l = st.layers[i]; layout(l); if (hitLayer(p.x, p.y, l, l.w, l.h)) { hit = l; break; } }
    const changed = (hit ? hit.id : null) !== selId; selId = hit ? hit.id : null;
    if (hit) { drag = { id: hit.id, dx: hit.x - p.x, dy: hit.y - p.y, pid: e.pointerId }; try { cv.setPointerCapture(e.pointerId); } catch { /* */ } cv.style.cursor = 'grabbing'; e.preventDefault(); }
    if (changed) renderSel(); redraw();
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pid) return;
    const l = st.layers.find((x) => x.id === drag.id); if (!l) return;
    const p = pt(e); l.x = Math.max(0, Math.min(W, p.x + drag.dx)); l.y = Math.max(0, Math.min(st.h, p.y + drag.dy)); redraw();
  });
  const endDrag = () => { drag = null; cv.style.cursor = 'grab'; };
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);

  // ---- achtergrond-keuzes ----
  function bgThumbs() {
    $('#mm-grads').innerHTML = BGS.map(([n], i) => `<button data-g="${i}" title="${esc(n)}" style="padding:0;height:44px;border-radius:8px;overflow:hidden;border:${st.bg.type !== 'img' && st.bg.idx === i ? '3px solid var(--accent)' : '1px solid var(--line)'}"><canvas width="60" height="44" data-t="${i}" style="width:100%;height:100%;display:block"></canvas></button>`).join('');
    $('#mm-grads').querySelectorAll('canvas').forEach((t) => { const g = t.getContext('2d'); g.save(); g.scale(60 / 360, 44 / 264); BGS[+t.dataset.t][1](g, 360, 264); g.restore(); });
    $('#mm-grads').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const keep = st.bg.type === 'emoji'; st.bg = { ...st.bg, type: keep ? 'emoji' : 'grad', idx: +b.dataset.g, img: null };
      if (!keep) setHeight(W); bgThumbs(); redraw();
    }));
  }
  $('#mm-emogrid').innerHTML = EMOJIS.map((e) => `<button data-e="${e}" style="min-height:40px;padding:0;font-size:1.4rem">${e}</button>`).join('');
  $('#mm-emogrid').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { st.bg = { type: 'emoji', idx: st.bg.idx, emoji: b.dataset.e, img: null }; setHeight(W); bgThumbs(); redraw(); }));
  $('#mm-emobg').addEventListener('click', () => { const bx = $('#mm-emobox'); bx.style.display = bx.style.display === 'none' ? 'block' : 'none'; if (st.bg.type !== 'emoji') { st.bg = { type: 'emoji', idx: st.bg.idx, emoji: st.bg.emoji || '😂', img: null }; setHeight(W); bgThumbs(); redraw(); } });
  $('#mm-stkbox').innerHTML = EMOJIS.map((e) => `<button data-e="${e}" style="min-height:40px;padding:0;font-size:1.4rem">${e}</button>`).join('');
  $('#mm-stkbox').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => addLayer('sticker', b.dataset.e)));
  $('#mm-addstk').addEventListener('click', () => { const s = $('#mm-stkbox'); s.style.display = s.style.display === 'none' ? 'grid' : 'none'; });
  $('#mm-addtxt').addEventListener('click', () => addLayer('text'));

  $('#mm-file').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    if (objUrl) URL.revokeObjectURL(objUrl);
    objUrl = URL.createObjectURL(f); const im = new Image();
    im.onload = () => {
      if (dead) return;
      const h = canvasHeight(im.naturalWidth, im.naturalHeight), off = document.createElement('canvas'); off.width = W; off.height = h;
      const g = off.getContext('2d'), sc = Math.max(W / im.naturalWidth, h / im.naturalHeight), dw = im.naturalWidth * sc, dh = im.naturalHeight * sc;
      g.drawImage(im, (W - dw) / 2, (h - dh) / 2, dw, dh);
      st.bg = { type: 'img', idx: st.bg.idx, emoji: st.bg.emoji, img: off };
      st.layers.forEach((l) => { l.y = Math.min(l.y, h); });
      setHeight(h); bgThumbs(); msg('Foto geladen.');
    };
    im.onerror = () => msg('Dit bestand kon niet als plaatje worden gelezen.', true);
    im.src = objUrl; e.target.value = '';
  });

  // tekst boven/onder
  const bind = (id, fn) => $(id).addEventListener('input', (e) => { fn(e.target.value); redraw(); });
  bind('#mm-top', (v) => { st.top = v; }); bind('#mm-bot', (v) => { st.bottom = v; });
  bind('#mm-tsize', (v) => { st.ts.color = v; }); bind('#mm-tstroke', (v) => { st.ts.stroke = v; }); bind('#mm-tsz', (v) => { st.ts.size = +v; });
  function syncText() { $('#mm-top').value = st.top; $('#mm-bot').value = st.bottom; $('#mm-tsize').value = st.ts.color; $('#mm-tstroke').value = st.ts.stroke; $('#mm-tsz').value = st.ts.size; }

  $('#mm-rnd').addEventListener('click', () => {
    const [t, b] = FUNNY[Math.floor(Math.random() * FUNNY.length)];
    const emo = Math.random() < 0.4;
    st.bg = { type: emo ? 'emoji' : 'grad', idx: Math.floor(Math.random() * BGS.length), emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)], img: null };
    st.top = t; st.bottom = b; setHeight(W); syncText(); bgThumbs(); redraw(); msg('Verrassing! Pas de tekst gerust aan.');
  });

  // ---- opslaan ----
  const toBlob = () => new Promise((res, rej) => {
    const o = document.createElement('canvas'); o.width = W; o.height = st.h; paint(o.getContext('2d'), st.h, false);
    o.toBlob((b) => (b ? res(b) : rej(new Error('leeg'))), 'image/png');
  });
  $('#mm-dl').addEventListener('click', async () => {
    try {
      const b = await toBlob(), u = URL.createObjectURL(b), a = document.createElement('a');
      a.href = u; a.download = 'meme.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000); msg('Meme opgeslagen als meme.png.');
    } catch { msg('Opslaan is niet gelukt.', true); }
  });
  $('#mm-copy').addEventListener('click', async () => {
    if (!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem)) { msg('Kopiëren naar het klembord kan niet in deze browser. Download de PNG.', true); return; }
    try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': toBlob() })]); msg('Gekopieerd naar het klembord.'); }
    catch { msg('Kopiëren is geblokkeerd. Download de PNG.', true); }
  });

  function renderReset() {
    const r = $('#mm-reset');
    r.innerHTML = confirmReset ? '<small>Alles wissen?</small><button id="mm-yes" class="pri">Ja, alles opnieuw</button><button id="mm-no">Annuleer</button>' : '<button id="mm-again">🔄 Alles opnieuw</button>';
    const on = (id, fn) => { const e = r.querySelector(id); if (e) e.addEventListener('click', fn); };
    on('#mm-again', () => { confirmReset = true; renderReset(); });
    on('#mm-no', () => { confirmReset = false; renderReset(); });
    on('#mm-yes', () => { st = fresh(); selId = null; confirmReset = false; cv.height = W; syncText(); bgThumbs(); renderSel(); renderReset(); redraw(); msg('Alles is gewist.'); });
  }

  syncText(); bgThumbs(); renderSel(); renderReset(); paint(c, st.h, true);
}
