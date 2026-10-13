// Fotocollage "Genereer"-tab: kies het aantal foto's, kies een van 50 stijlen, de app tekent direct een complete collage met lege vakjes.
// Tik op een vakje en kies een foto (of meerdere tegelijk), verschuif/zoom/spiegel/draai/wissel per vakje, voeg tekst of emoji toe en bewaar of deel.
// Alles gebeurt op je eigen toestel: de foto's worden nergens opgeslagen of geüpload.
import { STYLES, STYLE_GROUPS, RATIOS, FILTERS, makeRng, shapePath, clipShape, shapeContains, drawBackground, drawDecor, applyFilter, bgSwatch } from './foto-collage-styles.js?v=1';

const COUNTS = [4, 6, 8, 10, 12, 15];
const MAXSIDE = 2000, RAD = Math.PI / 180;
const EMOJI = ['❤️', '⭐', '✨', '🎉', '😍', '😂', '🌈', '☀️', '🌸', '🎈', '🔥', '👑'];
const TEXTCOL = ['#ffffff', '#111827', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
const EMOJIFONT = '"Apple Color Emoji","Segoe UI Emoji",sans-serif';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------------------------------------------------------------- pure logica (ook getest in node) */
// welke lege vakjes krijgen de nieuwe foto's? Eerst het aangetikte vakje (als dat leeg is), daarna de rest in volgorde.
export function emptySlots(photos, n, first, count) {
  const out = [];
  if (first != null && first >= 0 && first < n && !photos[first]) out.push(first);
  for (let i = 0; i < n && out.length < count; i++) if (!photos[i] && out.indexOf(i) < 0) out.push(i);
  return out.slice(0, count);
}
// cover-fit van een foto (iw x ih) in een vak (bw x bh), met draaiing phi (rad), zoom z en middelpunt (cx, cy in 0..1 van de foto)
export function coverView(iw, ih, bw, bh, phi, z, cx, cy) {
  const c = Math.abs(Math.cos(phi)), s = Math.abs(Math.sin(phi)), bwR = bw * c + bh * s, bhR = bw * s + bh * c;
  const sc = Math.max(bwR / iw, bhR / ih) * Math.max(1, z), vw = bwR / sc, vh = bhR / sc;
  return { sc, vw, vh, px: Math.max(vw / 2, Math.min(iw - vw / 2, cx * iw)), py: Math.max(vh / 2, Math.min(ih - vh / 2, cy * ih)) };
}
// een sleep (dx, dy in schermpixels) omrekenen naar een nieuw middelpunt in de foto
export function dragToCenter(dx, dy, slotRotDeg, mx, my, phi, view, iw, ih) {
  const a = -slotRotDeg * RAD; let x = dx * Math.cos(a) - dy * Math.sin(a), y = dx * Math.sin(a) + dy * Math.cos(a);
  x *= mx; y *= my; const b = -phi, ix = x * Math.cos(b) - y * Math.sin(b), iy = x * Math.sin(b) + y * Math.cos(b);
  return { cx: (view.px - ix / view.sc) / iw, cy: (view.py - iy / view.sc) / ih };
}
// slim middelpunt: waar zit de meeste "actie" (contrast + kleur), licht naar het midden getrokken. data = RGBA van een klein plaatje
export function smartFocus(data, w, h) {
  if (w < 3 || h < 3) return { cx: .5, cy: .5 };
  const lum = new Float32Array(w * h), sat = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) { const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2]; lum[i] = .299 * r + .587 * g + .114 * b; sat[i] = Math.max(r, g, b) - Math.min(r, g, b); }
  let sx = 0, sy = 0, tot = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x, gx = lum[i + 1] - lum[i - 1], gy = lum[i + w] - lum[i - w], e = Math.sqrt(gx * gx + gy * gy) + sat[i] * .4, dx = (x / w - .5) * 2, dy = (y / h - .5) * 2, wt = e * e * Math.max(.2, 1 - .5 * (dx * dx + dy * dy));
    sx += wt * x / w; sy += wt * y / h; tot += wt;
  }
  if (tot < 1e-3) return { cx: .5, cy: .5 };
  return { cx: clamp(.7 * sx / tot + .15, .08, .92), cy: clamp(.7 * sy / tot + .15, .08, .92) };
}
export function exportSize(ratio, big) {
  let w, h;
  if (!big) { w = 1080; h = Math.round(1080 / ratio); } else if (ratio >= 1) { w = 3840; h = Math.round(3840 / ratio); } else { h = 3840; w = Math.round(3840 * ratio); }
  while (w * h > 16000000) { w = Math.round(w * .96); h = Math.round(h * .96); } // iOS-limiet voor een canvas
  return [w, h];
}

/* ---------------------------------------------------------------- tekenen (gedeeld door editor, miniaturen en export) */
let scratchCv = null;
function scratch(w, h) { if (!scratchCv) scratchCv = document.createElement('canvas'); scratchCv.width = w; scratchCv.height = h; return scratchCv; }
const hsl = (i) => `hsl(${(i * 47 + 20) % 360},75%,${60 + (i % 3) * 4}%)`;

function effShape(s, o) {
  const t = s.shape.type;
  if (o.round != null && (t === 'rect' || t === 'round')) return { type: 'round', r: o.round };
  return s.shape;
}

function drawPhoto(c, s, ph, ix, iy, iw, ih, filter, px) {
  const src = ph.src, mx = (s.mirror && s.mirror.indexOf('x') >= 0 ? -1 : 1) * (ph.flip ? -1 : 1), my = s.mirror && s.mirror.indexOf('y') >= 0 ? -1 : 1, phi = ((s.rotPhoto || 0) + (ph.rot || 0) * 90) * RAD;
  const v = coverView(src.width, src.height, iw, ih, phi, ph.z, ph.cx, ph.cy), f = filter && filter !== 'none' ? filter : null;
  if (!f) {
    c.save(); c.translate(ix + iw / 2, iy + ih / 2); c.scale(mx, my); c.rotate(phi); c.drawImage(src, -v.px * v.sc, -v.py * v.sc, src.width * v.sc, src.height * v.sc); c.restore(); return;
  }
  const tw = Math.max(1, Math.round(iw * px)), th = Math.max(1, Math.round(ih * px)), t = scratch(tw, th), g = t.getContext('2d');
  g.save(); g.translate(tw / 2, th / 2); g.scale(px * mx, px * my); g.rotate(phi); g.drawImage(src, -v.px * v.sc, -v.py * v.sc, src.width * v.sc, src.height * v.sc); g.restore();
  applyFilter(g, tw, th, f); c.drawImage(t, ix, iy, iw, ih);
}

function drawEmpty(c, s, own, ix, iy, iw, ih, o) {
  if (o.thumb) { // gekleurd vlak met een richting-bolletje, zodat spiegelen/draaien zichtbaar is
    const mx = s.mirror && s.mirror.indexOf('x') >= 0 ? -1 : 1, my = s.mirror && s.mirror.indexOf('y') >= 0 ? -1 : 1, d = Math.max(iw, ih) * 1.6;
    c.save(); c.translate(ix + iw / 2, iy + ih / 2); c.scale(mx, my); c.rotate((s.rotPhoto || 0) * RAD);
    const g = c.createLinearGradient(-d / 2, -d / 2, d / 2, d / 2); g.addColorStop(0, hsl(own)); g.addColorStop(1, hsl(own + 5)); c.fillStyle = g; c.fillRect(-d / 2, -d / 2, d, d);
    c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(-iw * .22, -ih * .22, Math.min(iw, ih) * .13, 0, Math.PI * 2); c.fill(); c.restore();
    return;
  }
  c.fillStyle = 'rgba(125,130,170,.2)'; c.fillRect(ix, iy, iw, ih);
  if (o.ui && s.copyOf == null) {
    const m = Math.min(iw, ih), cx = ix + iw / 2, cy = iy + ih / 2;
    c.strokeStyle = 'rgba(90,95,150,.85)'; c.lineWidth = Math.max(2, m * .06); c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - m * .16, cy); c.lineTo(cx + m * .16, cy); c.moveTo(cx, cy - m * .16); c.lineTo(cx, cy + m * .16); c.stroke();
    if (m > 46) { c.fillStyle = 'rgba(90,95,150,.8)'; c.font = `700 ${Math.max(10, m * .11)}px system-ui,sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(own + 1), cx, cy + m * .3); }
  } else if (o.ui) {
    const m = Math.min(iw, ih); c.fillStyle = 'rgba(90,95,150,.7)'; c.font = `${Math.max(10, m * .22)}px ${EMOJIFONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🔁', ix + iw / 2, iy + ih / 2);
  }
}

function paintSlot(c, s, i, w, h, o) {
  const bw = s.w * w, bh = s.h * h, fr = s.frame, fw = fr ? fr.w * w : 0, fb = fr ? (fr.b || 0) * w : 0, shape = effShape(s, o);
  const ix = -bw / 2 + fw, iy = -bh / 2 + fw, iw = bw - 2 * fw, ih = bh - 2 * fw - fb;
  if (iw < 1 || ih < 1) return;
  const own = s.copyOf != null ? s.copyOf : i, ph = o.photos ? o.photos[own] : null;
  c.save(); c.translate(s.x * w + bw / 2, s.y * h + bh / 2); if (s.rot) c.rotate(s.rot * RAD);
  if (fr) {
    c.save();
    if (fr.glow) { c.shadowColor = fr.color; c.shadowBlur = w * .025; } else if (fr.shadow) { c.shadowColor = `rgba(0,0,0,${.2 + .35 * Math.min(1, fr.shadow)})`; c.shadowBlur = Math.max(2, w * .014 * (.5 + fr.shadow)); c.shadowOffsetY = w * .004 * (.5 + fr.shadow); }
    shapePath(c, shape, -bw / 2, -bh / 2, bw, bh); c.fillStyle = fr.color; c.fill(); c.restore();
  }
  c.save(); clipShape(c, shape, ix, iy, iw, ih);
  if (ph) drawPhoto(c, s, ph, ix, iy, iw, ih, s.filter || o.filter, o.px || 1); else drawEmpty(c, s, own, ix, iy, iw, ih, o);
  c.restore();
  if (!ph && o.ui && s.copyOf == null) { shapePath(c, shape, ix, iy, iw, ih); c.setLineDash([6, 5]); c.strokeStyle = 'rgba(100,100,150,.65)'; c.lineWidth = 1.5; c.stroke(); c.setLineDash([]); }
  c.restore();
}

export function paintCollage(c, made, w, h, o) {
  drawBackground(c, o.bg || made.bg, w, h); drawDecor(c, made.decor, w, h, false);
  const sl = made.slots, order = sl.map((_, i) => i).sort((a, b) => (sl[a].z - sl[b].z) || (a - b));
  for (const i of order) paintSlot(c, sl[i], i, w, h, o);
  drawDecor(c, made.decor, w, h, true);
  (o.items || []).forEach((it) => {
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `${it.e ? 400 : 800} ${it.s * w}px ${it.e ? EMOJIFONT : 'system-ui,-apple-system,sans-serif'}`;
    if (!it.e) { c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = it.s * w * .12; c.fillStyle = it.c; }
    c.fillText(it.t, it.x * w, it.y * h); c.restore();
  });
  if (o.ui && o.sel) {
    if (o.sel.k === 's') {
      sl.forEach((s, i) => {
        if ((s.copyOf != null ? s.copyOf : i) !== o.sel.i) return;
        const bw = s.w * w, bh = s.h * h; c.save(); c.translate(s.x * w + bw / 2, s.y * h + bh / 2); if (s.rot) c.rotate(s.rot * RAD);
        shapePath(c, effShape(s, o), -bw / 2, -bh / 2, bw, bh); c.strokeStyle = '#6366f1'; c.lineWidth = s.copyOf == null ? 3 : 2; if (s.copyOf != null) c.setLineDash([5, 4]); c.stroke(); c.restore();
      });
    } else {
      const it = o.items[o.sel.i];
      if (it) { c.save(); c.font = `${it.e ? 400 : 800} ${it.s * w}px ${it.e ? EMOJIFONT : 'system-ui,sans-serif'}`; const tw = c.measureText(it.t).width, th = it.s * w * 1.2; c.strokeStyle = '#6366f1'; c.lineWidth = 2; c.setLineDash([5, 4]); c.strokeRect(it.x * w - tw / 2 - 6, it.y * h - th / 2, tw + 12, th); c.restore(); }
    }
  }
}

/* ---------------------------------------------------------------- de view */
// ctx: { view, esc, uid, addCleanup }
export function collageGenView(ctx) {
  const { view, esc, addCleanup } = ctx;
  const S = {
    step: 1, n: 6, styleIdx: 0, seed: (Math.random() * 1e9) | 0, ratioIdx: 0, group: 0, gap: 1, round: null, bgIdx: 0, bgCustom: null, filter: 'none', text: 'A',
    photos: [], items: [], sel: null, swap: null, tab: 'foto', big: false, itext: '', tcol: TEXTCOL[0],
  };
  let made = null, canvas = null, W = 340, H = 340, dpr = 1, msg = '', alive = true, raf = 0, io = null, textTimer = 0, busy = false;
  const thumbCache = new Map(), ptrs = new Map(), timers = new Set();
  let drag = null, pinch = null, hitCv = null;
  const ratio = () => RATIOS[S.ratioIdx][1];
  const hitCtx = () => { if (!hitCv) hitCv = document.createElement('canvas'); return hitCv.getContext('2d'); };

  const style = document.createElement('style');
  style.textContent = `
.cg-wrap{max-width:480px;margin:0 auto;color:var(--ink)}
.cg-wrap *{box-sizing:border-box}
.cg-btn{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:12px;padding:.55rem .7rem;font:inherit;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.cg-btn:active{transform:scale(.97)}.cg-btn.on,.cg-btn.cg-pri{background:var(--accent);border-color:var(--accent);color:#fff}
.cg-btn[disabled]{opacity:.5}
.cg-h{font-size:1.15rem;font-weight:800;margin:.2rem 0 .1rem}.cg-sub{font-size:.9rem;opacity:.75;margin:.1rem 0 .7rem}
.cg-ns{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.cg-n{display:flex;flex-direction:column;align-items:center;gap:6px;padding:.8rem .3rem}
.cg-n b{font-size:1.7rem;line-height:1}.cg-n svg{width:64px;height:38px;display:block}
.cg-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 .6rem}.cg-bar .cg-sp{flex:1}
.cg-chips{display:flex;gap:6px;flex-wrap:wrap;margin:.3rem 0}.cg-chips .cg-btn{padding:.35rem .65rem;font-size:.9rem}
.cg-gal{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:.5rem}
.cg-th{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 4px;border-radius:14px;min-width:0}.cg-th span{font-size:.78rem;line-height:1.15;text-align:center;overflow-wrap:anywhere}
.cg-thc{width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:rgba(128,128,160,.1);border-radius:10px;overflow:hidden}.cg-thc canvas{display:block;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,.18)}
.cg-stage{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:8px;display:flex;justify-content:center}
.cg-stage canvas{display:block;border-radius:6px;touch-action:none;max-width:100%;outline:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.cg-note{font-size:.88rem;opacity:.8;min-height:1.3em;margin:6px 2px}
.cg-top{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 .5rem}.cg-top .cg-btn{flex:1;padding:.5rem .3rem;font-size:.9rem;white-space:nowrap}
.cg-tools{border:1px solid var(--line);background:var(--card);border-radius:14px;padding:8px;margin:8px 0;display:flex;flex-direction:column;gap:8px}
.cg-row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.cg-row .cg-btn{padding:.45rem .6rem;font-size:.9rem}
.cg-r{display:flex;align-items:center;gap:8px;margin:6px 0}.cg-r span{min-width:5.6rem;font-size:.9rem}.cg-r input[type=range]{flex:1;min-width:0}
.cg-tabs{display:flex;gap:6px;margin:10px 0}.cg-tabs .cg-btn{flex:1;padding:.5rem .2rem;font-size:.92rem}
.cg-panel{border:1px solid var(--line);background:var(--card);border-radius:14px;padding:10px}
.cg-sw{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}.cg-sw button{width:34px;height:34px;border-radius:50%;padding:0;border:2px solid var(--line);cursor:pointer}.cg-sw button.on{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent)}
.cg-emo{display:flex;gap:4px;flex-wrap:wrap}.cg-emo button{font-size:1.35rem;padding:.2rem .45rem}
.cg-inp{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:10px;padding:.5rem .6rem;font:inherit;min-width:0}
.cg-act{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}.cg-act .cg-btn{flex:1;padding:.75rem}
.cg-lbl{font-size:.85rem;opacity:.75;margin:8px 0 2px}
`;
  document.head.appendChild(style);

  /* ---------- genereren ---------- */
  function regen() {
    const st = STYLES[S.styleIdx]; if (!st) return;
    made = st.make(S.n, ratio(), makeRng(S.seed), { gap: S.gap, text: S.text });
    if (S.bgIdx >= made.bgs.length) S.bgIdx = 0;
  }
  const curBg = () => (S.bgCustom ? { type: 'solid', color: S.bgCustom } : made.bgs[S.bgIdx] || made.bg);
  const opts = (extra) => Object.assign({ photos: S.photos, bg: curBg(), round: S.round, filter: S.filter, items: S.items, px: dpr }, extra || {});
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms); timers.add(t); return t; };

  /* ---------- foto's laden ---------- */
  function loadFile(f) {
    return new Promise((res) => {
      const url = URL.createObjectURL(f), im = new Image();
      im.onload = () => {
        try {
          const sc = Math.min(1, MAXSIDE / Math.max(im.naturalWidth, im.naturalHeight)), cv = document.createElement('canvas');
          cv.width = Math.max(1, Math.round(im.naturalWidth * sc)); cv.height = Math.max(1, Math.round(im.naturalHeight * sc));
          cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
          let foc = { cx: .5, cy: .5 };
          try { const sw = 48, sh = Math.max(3, Math.round(48 * cv.height / cv.width)), t = document.createElement('canvas'); t.width = sw; t.height = sh; const tc = t.getContext('2d'); tc.drawImage(cv, 0, 0, sw, sh); foc = smartFocus(tc.getImageData(0, 0, sw, sh).data, sw, sh); } catch (e) { /* geen analyse: midden */ }
          res({ src: cv, cx: foc.cx, cy: foc.cy, z: 1, flip: false, rot: 0 });
        } catch (e) { res(null); } finally { URL.revokeObjectURL(url); }
      };
      im.onerror = () => { URL.revokeObjectURL(url); res(null); };
      im.src = url;
    });
  }
  async function addFiles(files, first, replace) {
    const list = [...files].filter((f) => /^image\//.test(f.type) || /\.(heic|heif|jpe?g|png|webp|gif)$/i.test(f.name || ''));
    if (!list.length || busy) return;
    const targets = replace ? [first] : emptySlots(S.photos, S.n, first, list.length);
    if (!targets.length) { msg = 'Alle vakjes zijn al gevuld. Tik op een foto om hem te vervangen.'; note(); return; }
    busy = true; msg = 'Foto\'s laden…'; note();
    let bad = 0, used = 0;
    for (let k = 0; k < list.length && used < targets.length; k++) {
      if (!alive) { busy = false; return; }
      const p = await loadFile(list[k]); if (!p) { bad++; continue; }
      const old = S.photos[targets[used]]; if (old && old.src) old.src.width = 0;
      S.photos[targets[used++]] = p;
      paint(); refreshTools();
    }
    busy = false;
    const extra = list.length - bad - used;
    msg = bad ? `${bad} bestand(en) kon ik niet openen (misschien geen foto).` : extra > 0 ? `${extra} foto('s) pasten niet meer: alle vakjes zijn vol.` : '';
    if (used && !bad && extra <= 0) msg = filled() >= S.n ? 'Je collage is klaar! Verschuif of zoom nog wat, en bewaar hem. ✓' : '';
    paint(); refreshTools(); renderTab(); note();
  }
  const filled = () => { let c = 0; for (let i = 0; i < S.n; i++) if (S.photos[i]) c++; return c; };
  function pick(first, replace) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = !replace;
    inp.onchange = () => { addFiles(inp.files || [], first, replace); };
    inp.click();
  }

  /* ---------- canvas / aanraken ---------- */
  function sizeCanvas() {
    const R = ratio(), maxW = Math.min(440, (view.clientWidth || 360) - 20), maxH = Math.max(260, (window.innerHeight || 700) * .6);
    let w = maxW, h = w / R; if (h > maxH) { h = maxH; w = h * R; }
    W = Math.round(w); H = Math.round(h); dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  }
  function paintNow() {
    raf = 0; if (!alive || !canvas || !made) return;
    const c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    paintCollage(c, made, W, H, opts({ ui: true, sel: S.sel }));
  }
  function paint() { if (!raf) raf = requestAnimationFrame(paintNow); }
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)]; };
  const orderZ = () => made.slots.map((_, i) => i).sort((a, b) => (made.slots[b].z - made.slots[a].z) || (b - a));
  function hitAt(x, y) {
    const c = canvas.getContext('2d');
    for (let i = S.items.length - 1; i >= 0; i--) {
      const it = S.items[i]; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.font = `${it.e ? 400 : 800} ${it.s * W}px system-ui`; const tw = c.measureText(it.t).width, th = it.s * W * 1.2; c.restore();
      if (Math.abs(x - it.x * W) <= tw / 2 + 8 && Math.abs(y - it.y * H) <= th / 2 + 4) return { k: 't', i };
    }
    const hc = hitCtx();
    for (const i of orderZ()) {
      const s = made.slots[i], bw = s.w * W, bh = s.h * H, a = -(s.rot || 0) * RAD, dx = x - (s.x * W + bw / 2), dy = y - (s.y * H + bh / 2), lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
      if (Math.abs(lx) > bw / 2 + 1 || Math.abs(ly) > bh / 2 + 1) continue;
      if (shapeContains(hc, effShape(s, { round: S.round }), -bw / 2, -bh / 2, bw, bh, lx, ly)) return { k: 's', i: s.copyOf != null ? s.copyOf : i, si: i };
    }
    return null;
  }
  const selPhoto = () => (S.sel && S.sel.k === 's' ? S.photos[S.sel.i] : null);
  function slotInner(si) {
    const s = made.slots[si], fr = s.frame, fw = fr ? fr.w * W : 0, fb = fr ? (fr.b || 0) * W : 0;
    return { s, iw: s.w * W - 2 * fw, ih: s.h * H - 2 * fw - fb };
  }
  function movePhoto(si, ph, dx, dy) {
    const { s, iw, ih } = slotInner(si), mx = (s.mirror && s.mirror.indexOf('x') >= 0 ? -1 : 1) * (ph.flip ? -1 : 1), my = s.mirror && s.mirror.indexOf('y') >= 0 ? -1 : 1, phi = ((s.rotPhoto || 0) + (ph.rot || 0) * 90) * RAD;
    const v = coverView(ph.src.width, ph.src.height, iw, ih, phi, ph.z, ph.cx, ph.cy), r = dragToCenter(dx, dy, s.rot || 0, mx, my, phi, v, ph.src.width, ph.src.height);
    ph.cx = clamp(r.cx, 0, 1); ph.cy = clamp(r.cy, 0, 1);
  }
  function setZoom(ph, z) { ph.z = clamp(z, 1, 5); const el = view.querySelector('#cg-z'); if (el) el.value = ph.z; paint(); }
  function onDown(e) {
    e.preventDefault(); try { canvas.setPointerCapture(e.pointerId); } catch (er) { /* ok */ }
    const [x, y] = pos(e); ptrs.set(e.pointerId, [x, y]);
    if (ptrs.size === 2) { const ph = selPhoto(); if (ph) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.max(10, Math.hypot(a[0] - b[0], a[1] - b[1])), z: ph.z }; drag = null; return; } }
    if (ptrs.size > 1) return;
    const h = hitAt(x, y);
    if (h && h.k === 's' && S.swap != null && S.swap !== h.i) {
      const a = S.swap; const t = S.photos[a]; S.photos[a] = S.photos[h.i] || null; S.photos[h.i] = t || null; S.swap = null; S.sel = { k: 's', i: h.i }; msg = 'Gewisseld ✓'; paint(); refreshTools(); note(); return;
    }
    S.sel = h ? { k: h.k, i: h.i } : null;
    drag = h ? { k: h.k, i: h.i, si: h.si, x, y, sx: x, sy: y, moved: false, empty: h.k === 's' && !S.photos[h.i] } : null;
    paint(); refreshTools();
  }
  function onMove(e) {
    if (!ptrs.has(e.pointerId)) return;
    const [x, y] = pos(e); ptrs.set(e.pointerId, [x, y]);
    if (pinch && ptrs.size >= 2) { const ph = selPhoto(), [a, b] = [...ptrs.values()]; if (ph) setZoom(ph, pinch.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d); return; }
    if (!drag) return;
    const dx = x - drag.x, dy = y - drag.y; if (Math.abs(x - drag.sx) + Math.abs(y - drag.sy) > 5) drag.moved = true;
    if (!drag.moved) return;
    if (drag.k === 't') { const it = S.items[drag.i]; if (it) { it.x = clamp(it.x + dx / W, 0, 1); it.y = clamp(it.y + dy / H, 0, 1); } }
    else { const ph = S.photos[drag.i]; if (ph) movePhoto(drag.si, ph, dx, dy); }
    drag.x = x; drag.y = y; paint();
  }
  function onUp(e) {
    const was = ptrs.has(e.pointerId); ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
    if (!ptrs.size) { const d = drag; drag = null; if (was && d && !d.moved && d.empty && e.type === 'pointerup') pick(d.i, false); }
  }
  function onWheel(e) {
    const [x, y] = pos(e), h = hitAt(x, y), tgt = h && h.k === 's' ? h : S.sel && S.sel.k === 's' ? S.sel : null;
    if (!tgt || !S.photos[tgt.i]) return; e.preventDefault();
    if (!S.sel || S.sel.i !== tgt.i) { S.sel = { k: 's', i: tgt.i }; refreshTools(); }
    setZoom(S.photos[tgt.i], S.photos[tgt.i].z * Math.exp(-e.deltaY * .0015));
  }
  function onKey(e) {
    const ph = selPhoto(); if (!ph || !S.sel) return; const st = 14;
    const mv = { ArrowLeft: [st, 0], ArrowRight: [-st, 0], ArrowUp: [0, st], ArrowDown: [0, -st] }[e.key];
    if (mv) { e.preventDefault(); const si = made.slots.findIndex((s, i) => (s.copyOf != null ? s.copyOf : i) === S.sel.i); movePhoto(si, ph, mv[0], mv[1]); paint(); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); setZoom(ph, ph.z * 1.1); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); setZoom(ph, ph.z / 1.1); }
    else if (e.key === 'r' || e.key === 'R') { ph.rot = ((ph.rot || 0) + 1) % 4; paint(); }
    else if (e.key === 'f' || e.key === 'F') { ph.flip = !ph.flip; paint(); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removePhoto(S.sel.i); }
  }
  function removePhoto(i) { const p = S.photos[i]; if (p && p.src) p.src.width = 0; S.photos[i] = null; S.swap = null; paint(); refreshTools(); renderTab(); }

  /* ---------- bewaren / delen ---------- */
  async function exportBlob() {
    const [w, h] = exportSize(ratio(), S.big), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d'); if (!c) return null;
    paintCollage(c, made, w, h, opts({ ui: false, sel: null, px: 1 }));
    const type = S.big ? 'image/jpeg' : 'image/png';
    const bl = await new Promise((res) => { try { cv.toBlob((b) => res(b), type, .92); } catch (e) { res(null); } });
    cv.width = cv.height = 0; return bl;
  }
  async function save(share) {
    if (!filled()) { msg = 'Kies eerst een paar foto\'s.'; note(); return; }
    if (busy) return; busy = true; msg = S.big ? 'Groot plaatje maken…' : 'Plaatje maken…'; note();
    const bl = await exportBlob(); busy = false;
    if (!bl) { msg = 'Het plaatje maken lukte niet (te weinig geheugen?). Probeer de gewone kwaliteit of minder foto\'s.'; note(); return; }
    const ext = S.big ? 'jpg' : 'png', file = new File([bl], 'collage.' + ext, { type: bl.type });
    if (share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file] }); msg = 'Gedeeld ✓'; note(); return; } catch (e) { if (e && e.name === 'AbortError') { msg = ''; note(); return; } }
    }
    const u = URL.createObjectURL(bl), a = document.createElement('a'); a.href = u; a.download = 'collage.' + ext; document.body.appendChild(a); a.click(); a.remove();
    later(() => URL.revokeObjectURL(u), 8000); msg = `Opgeslagen als collage.${ext} ✓ (kijk in je Downloads of Foto's).`; note();
  }

  /* ---------- schermen ---------- */
  const note = () => { const n = view.querySelector('#cg-note'); if (n) n.textContent = msg; };
  const range = (id, label, v, a, b, st) => `<div class="cg-r"><span>${label}</span><input type="range" id="${id}" min="${a}" max="${b}" step="${st || 1}" value="${v}"></div>`;
  const chip = (act, attrs, label, on) => `<button class="cg-btn ${on ? 'on' : ''}" data-act="${act}" ${attrs}>${label}</button>`;
  const fmtChips = () => `<div class="cg-chips">${RATIOS.map((r, i) => chip('ratio', `data-i="${i}"`, r[0], i === S.ratioIdx)).join('')}</div>`;
  const dotsSvg = (n) => { const cols = n <= 6 ? 3 : 5, rows = Math.ceil(n / cols); let d = ''; for (let i = 0; i < n; i++) d += `<circle cx="${(i % cols + .5) * 50 / cols}" cy="${(Math.floor(i / cols) + .5) * 30 / rows}" r="${Math.min(50 / cols, 30 / rows) * .32}" fill="currentColor" opacity=".75"/>`; return `<svg viewBox="0 0 50 30">${d}</svg>`; };

  function stop() { if (io) { io.disconnect(); io = null; } ptrs.clear(); drag = null; pinch = null; }
  function render() {
    stop(); canvas = null;
    if (S.step === 1) {
      view.innerHTML = `<div class="cg-wrap"><div class="cg-h">✨ Collage laten genereren</div><div class="cg-sub">Stap 1 · Hoeveel foto's wil je gebruiken?</div>
        <div class="cg-ns">${COUNTS.map((n) => `<button class="cg-btn cg-n ${n === S.n ? 'on' : ''}" data-act="n" data-n="${n}"><b>${n}</b>${dotsSvg(n)}</button>`).join('')}</div>
        <p class="cg-note">${filled() ? `Je hebt al ${filled()} foto's gekozen: die blijven staan.` : 'Je kiest de foto\'s straks zelf in de collage.'} Alles blijft op je eigen toestel.</p></div>`;
    } else if (S.step === 2) {
      view.innerHTML = `<div class="cg-wrap"><div class="cg-bar"><button class="cg-btn" data-act="step1">‹ ${S.n} foto's</button><span class="cg-sp"></span><span class="cg-sub" style="margin:0">Stap 2 · Kies een stijl</span></div>
        ${fmtChips()}<div class="cg-tabs" style="flex-wrap:wrap">${STYLE_GROUPS.map((g, i) => chip('group', `data-i="${i}"`, esc(g), i === S.group)).join('')}</div>
        <div id="cg-tx"></div><div class="cg-gal" id="cg-gal"></div></div>`;
      gallery();
    } else {
      view.innerHTML = `<div class="cg-wrap"><div class="cg-top"><button class="cg-btn cg-pri" data-act="reroll">🎲 Opnieuw genereren</button><button class="cg-btn" data-act="step1">Ander aantal</button><button class="cg-btn" data-act="step2">Andere stijl</button></div>
        <div class="cg-stage"><canvas id="cg-cv" tabindex="0" aria-label="Collage"></canvas></div><div class="cg-note" id="cg-note"></div>
        <div id="cg-tools"></div>
        <div class="cg-tabs">${[['foto', '📷 Foto\'s'], ['stijl', '🎨 Stijl'], ['tekst', '✏️ Tekst']].map(([k, l]) => chip('tab', `data-t="${k}"`, l, S.tab === k)).join('')}</div>
        <div class="cg-panel" id="cg-panel"></div>
        <div class="cg-act"><button class="cg-btn cg-pri" data-act="share">📤 Deel</button><button class="cg-btn" data-act="dl">⬇ Download</button></div>
        <div class="cg-chips" style="justify-content:center">${chip('q', 'data-b="0"', 'Normaal · 1080 breed', !S.big)}${chip('q', 'data-b="1"', '4K · extra scherp', S.big)}</div>
        <p class="cg-note" style="text-align:center">Je foto's blijven op je eigen toestel.</p></div>`;
      canvas = view.querySelector('#cg-cv');
      canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp);
      canvas.addEventListener('wheel', onWheel, { passive: false }); canvas.addEventListener('keydown', onKey); canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      regen(); sizeCanvas(); paint(); refreshTools(); renderTab();
      if (!msg) msg = filled() ? '' : 'Tik op een vakje met + om een foto te kiezen (meerdere tegelijk kan ook).'; note();
    }
  }

  /* ---------- galerij met miniaturen (lui + gecachet) ---------- */
  function thumbFor(st) {
    const key = [st.id, S.n, S.ratioIdx, st.usesText ? S.text : ''].join('|');
    let cv = thumbCache.get(key); if (cv) return cv;
    const R = ratio(), long = 112, d = Math.min(2, window.devicePixelRatio || 1), w = R >= 1 ? long : long * R, h = R >= 1 ? long / R : long;
    cv = document.createElement('canvas'); cv.width = Math.round(w * d); cv.height = Math.round(h * d); cv.style.width = Math.round(w) + 'px'; cv.style.height = Math.round(h) + 'px';
    try { const m = st.make(S.n, R, makeRng(11), { gap: 1, text: S.text }); paintCollage(cv.getContext('2d'), m, cv.width, cv.height, { thumb: true, photos: null, items: [], px: d }); } catch (e) { /* lege miniatuur */ }
    thumbCache.set(key, cv); if (thumbCache.size > 160) { const k0 = thumbCache.keys().next().value; thumbCache.delete(k0); }
    return cv;
  }
  function gallery(keepTx) {
    const box = view.querySelector('#cg-gal'); if (!box) return;
    const list = STYLES.filter((s) => s.group === STYLE_GROUPS[S.group]);
    const tx = view.querySelector('#cg-tx');
    if (tx && !keepTx) tx.innerHTML = list.some((s) => s.usesText) ? `<div class="cg-row" style="margin:.4rem 0"><span style="font-size:.9rem">Letter of cijfer (max 3):</span><input class="cg-inp" id="cg-letters" maxlength="3" value="${esc(S.text)}" style="width:5rem;text-transform:uppercase"></div>` : '';
    box.innerHTML = list.map((st) => `<button class="cg-btn cg-th ${st.index === S.styleIdx ? 'on' : ''}" data-act="style" data-i="${st.index}" title="${esc(st.desc)}"><div class="cg-thc"></div><span>${esc(st.name)}</span></button>`).join('');
    const fill = (b) => { const slot = b.querySelector('.cg-thc'); if (slot && !slot.firstChild) slot.appendChild(thumbFor(STYLES[+b.dataset.i])); };
    const btns = [...box.querySelectorAll('.cg-th')];
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((es) => { es.forEach((en) => { if (en.isIntersecting) { fill(en.target); io.unobserve(en.target); } }); }, { rootMargin: '200px' });
      btns.forEach((b) => io.observe(b));
    } else btns.forEach((b, i) => later(() => fill(b), 30 * i));
  }

  /* ---------- gereedschap onder de collage ---------- */
  function refreshTools() {
    const box = view.querySelector('#cg-tools'); if (!box) return;
    const ph = selPhoto(), it = S.sel && S.sel.k === 't' ? S.items[S.sel.i] : null;
    if (ph) {
      box.innerHTML = `<div class="cg-tools"><div class="cg-r" style="margin:0"><span>🔍 Zoom</span><input type="range" id="cg-z" min="1" max="5" step="0.01" value="${ph.z}"></div>
        <div class="cg-row"><button class="cg-btn" data-act="flip">↔ Spiegel</button><button class="cg-btn" data-act="rot">⟳ Draai 90°</button><button class="cg-btn ${S.swap === S.sel.i ? 'on' : ''}" data-act="swap">⇄ Wissel</button><button class="cg-btn" data-act="rep">🖼 Vervang</button><button class="cg-btn" data-act="del">✖ Weg</button></div>
        <div style="font-size:.8rem;opacity:.7">Sleep op de collage om de foto te verschuiven, knijp (of scroll) om te zoomen.</div></div>`;
    } else if (S.sel && S.sel.k === 's') {
      box.innerHTML = `<div class="cg-tools"><div class="cg-row"><button class="cg-btn cg-pri" data-act="fillone">+ Foto kiezen voor dit vakje</button>${S.swap != null ? '' : ''}</div></div>`;
    } else if (it) {
      box.innerHTML = `<div class="cg-tools">${range('cg-sz', 'Grootte', Math.round(it.s * 100), 3, 40)}<div class="cg-row"><button class="cg-btn" data-act="idel">🗑 Verwijder dit</button></div></div>`;
    } else box.innerHTML = '';
  }
  function renderTab() {
    const box = view.querySelector('#cg-panel'); if (!box || !made) return;
    view.querySelectorAll('[data-act="tab"]').forEach((b) => b.classList.toggle('on', b.dataset.t === S.tab));
    let h = '';
    if (S.tab === 'foto') {
      h = `<div class="cg-row"><button class="cg-btn cg-pri" data-act="pickmany">📷 Foto's kiezen</button>${filled() ? '<button class="cg-btn" data-act="clear">🗑 Alles wissen</button>' : ''}</div>
        <p class="cg-note" style="min-height:0">${filled()} van ${S.n} vakjes gevuld. Kies je meerdere foto's tegelijk, dan vullen ze de lege vakjes in volgorde. Een foto past automatisch in het vakje.</p>`;
    } else if (S.tab === 'stijl') {
      const hasRound = made.slots.some((s) => s.shape.type === 'rect' || s.shape.type === 'round');
      h = `${range('cg-gap', 'Ruimte', Math.round(S.gap * 10), 0, 20)}${hasRound ? range('cg-rad', 'Ronde hoeken', Math.round((S.round == null ? .1 : S.round) * 100), 0, 50) : ''}
        <div class="cg-lbl">Achtergrond</div><div class="cg-sw">${made.bgs.map((b, i) => `<button data-act="bg" data-i="${i}" class="${!S.bgCustom && i === S.bgIdx ? 'on' : ''}" style="background:${bgSwatch(b)}" aria-label="Achtergrond ${i + 1}"></button>`).join('')}<input type="color" id="cg-bgc" value="${/^#[0-9a-f]{6}$/i.test(S.bgCustom || '') ? S.bgCustom : '#ffffff'}" style="width:2.6rem;height:2.3rem;padding:0;border:0;background:none" aria-label="Eigen kleur"></div>
        <div class="cg-lbl">Kleurfilter</div><div class="cg-chips">${FILTERS.map(([k, l]) => chip('flt', `data-k="${k}"`, l, k === S.filter)).join('')}</div>
        <div class="cg-lbl">Formaat</div>${fmtChips()}
        ${STYLES[S.styleIdx].usesText ? `<div class="cg-lbl">Letter of cijfer (max 3)</div><input class="cg-inp" id="cg-letters" maxlength="3" value="${esc(S.text)}" style="width:6rem;text-transform:uppercase">` : ''}`;
    } else {
      const it = S.sel && S.sel.k === 't' ? S.items[S.sel.i] : null;
      h = `<div class="cg-row"><input class="cg-inp" id="cg-txt" maxlength="40" placeholder="Typ een tekst…" value="${esc(S.itext)}" style="flex:1"><button class="cg-btn cg-pri" data-act="addt">Toevoegen</button></div>
        <div class="cg-sw">${TEXTCOL.map((c) => `<button data-act="tc" data-c="${c}" class="${(it && !it.e ? it.c : S.tcol) === c ? 'on' : ''}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div>
        <div class="cg-emo">${EMOJI.map((e) => `<button class="cg-btn" data-act="emo" data-e="${e}">${e}</button>`).join('')}</div>
        <p class="cg-note" style="min-height:0">Sleep een tekst of emoji op de collage om hem te verplaatsen.</p>`;
    }
    box.innerHTML = h;
  }

  /* ---------- klikken en invoer ---------- */
  function onClick(e) {
    const b = e.target.closest('[data-act]'); if (!b || !view.contains(b)) return; const a = b.dataset.act, d = b.dataset;
    switch (a) {
      case 'n': S.n = +d.n; S.step = 2; msg = ''; render(); break;
      case 'step1': S.step = 1; render(); break;
      case 'step2': S.step = 2; render(); break;
      case 'group': S.group = +d.i; render(); break;
      case 'ratio': S.ratioIdx = +d.i; if (S.step === 3) { regen(); sizeCanvas(); paint(); renderTab(); } else render(); break;
      case 'style': {
        S.styleIdx = +d.i; S.step = 3; S.sel = null; S.swap = null; S.bgIdx = 0; S.bgCustom = null; S.round = null; S.seed = (Math.random() * 1e9) | 0; S.tab = filled() ? 'stijl' : 'foto';
        const m = STYLES[S.styleIdx].make(S.n, ratio(), makeRng(S.seed), { gap: S.gap, text: S.text }); S.filter = m.look && m.look.filter ? m.look.filter : 'none'; msg = ''; render(); break;
      }
      case 'reroll': S.seed = (Math.random() * 1e9) | 0; if (!S.bgCustom) S.bgIdx = 0; S.swap = null; regen(); paint(); renderTab(); msg = 'Nieuwe variatie! Je foto\'s staan nog op hun plek.'; note(); break;
      case 'tab': S.tab = d.t; renderTab(); break;
      case 'pickmany': pick(S.sel && S.sel.k === 's' ? S.sel.i : null, false); break;
      case 'fillone': pick(S.sel.i, false); break;
      case 'clear': S.photos.forEach((p) => { if (p && p.src) p.src.width = 0; }); S.photos = []; S.sel = null; S.swap = null; msg = ''; paint(); refreshTools(); renderTab(); note(); break;
      case 'flip': { const p = selPhoto(); if (p) { p.flip = !p.flip; paint(); } break; }
      case 'rot': { const p = selPhoto(); if (p) { p.rot = ((p.rot || 0) + 1) % 4; paint(); } break; }
      case 'swap': S.swap = S.swap === S.sel.i ? null : S.sel.i; msg = S.swap != null ? 'Tik nu op het vakje waarmee je wilt wisselen.' : ''; refreshTools(); note(); break;
      case 'rep': pick(S.sel.i, true); break;
      case 'del': removePhoto(S.sel.i); break;
      case 'bg': S.bgCustom = null; S.bgIdx = +d.i; paint(); renderTab(); break;
      case 'flt': S.filter = d.k; paint(); renderTab(); break;
      case 'q': S.big = d.b === '1'; view.querySelectorAll('[data-act="q"]').forEach((x) => x.classList.toggle('on', (x.dataset.b === '1') === S.big)); msg = S.big ? '4K: tot 3840 pixels, kost meer geheugen.' : ''; note(); break;
      case 'share': save(true); break;
      case 'dl': save(false); break;
      case 'addt': { const t = S.itext.trim(); if (!t) { msg = 'Typ eerst een tekst.'; note(); break; } if (S.items.length >= 40) break; S.items.push({ t, e: false, x: .5, y: .5, s: .09, c: S.tcol }); S.itext = ''; S.sel = { k: 't', i: S.items.length - 1 }; paint(); refreshTools(); renderTab(); break; }
      case 'emo': if (S.items.length < 40) { S.items.push({ t: d.e, e: true, x: .5, y: .5, s: .14, c: '#000' }); S.sel = { k: 't', i: S.items.length - 1 }; paint(); refreshTools(); } break;
      case 'tc': { S.tcol = d.c; const it = S.sel && S.sel.k === 't' ? S.items[S.sel.i] : null; if (it && !it.e) it.c = d.c; paint(); renderTab(); break; }
      case 'idel': S.items.splice(S.sel.i, 1); S.sel = null; paint(); refreshTools(); renderTab(); break;
      default: break;
    }
  }
  function onInput(e) {
    const t = e.target, id = t.id;
    if (id === 'cg-z') { const p = selPhoto(); if (p) { p.z = +t.value; paint(); } }
    else if (id === 'cg-gap') { S.gap = +t.value / 10; regen(); paint(); }
    else if (id === 'cg-rad') { S.round = +t.value / 100; paint(); }
    else if (id === 'cg-bgc') { S.bgCustom = t.value; paint(); }
    else if (id === 'cg-sz') { const it = S.sel && S.sel.k === 't' ? S.items[S.sel.i] : null; if (it) { it.s = +t.value / 100; paint(); } }
    else if (id === 'cg-txt') S.itext = t.value;
    else if (id === 'cg-letters') {
      const v = Array.from(t.value.toUpperCase()).slice(0, 3).join(''); S.text = v || 'A';
      if (S.step === 3) { regen(); paint(); } else { clearTimeout(textTimer); textTimer = later(() => gallery(true), 300); }
    }
  }
  const onResize = () => { if (!alive || !canvas || !view.isConnected) return; sizeCanvas(); paint(); };
  view.addEventListener('click', onClick); view.addEventListener('input', onInput); window.addEventListener('resize', onResize);
  addCleanup(() => {
    alive = false; stop(); if (raf) cancelAnimationFrame(raf); timers.forEach(clearTimeout); timers.clear();
    view.removeEventListener('click', onClick); view.removeEventListener('input', onInput); window.removeEventListener('resize', onResize);
    style.remove(); S.photos.forEach((p) => { if (p && p.src) p.src.width = 0; }); S.photos = []; thumbCache.forEach((cv) => { cv.width = 0; }); thumbCache.clear();
    if (scratchCv) { scratchCv.width = 0; scratchCv = null; } if (hitCv) { hitCv.width = 0; hitCv = null; } made = null; canvas = null;
  });
  render();
}
