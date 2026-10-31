// Kleurlab (tabblad in de Kleur-app): kleurenwiel, harmonieën, palet-generator, verlopen en mixer, contrast, kleurenblind, kleuren uit een foto, bewaarde paletten.
import * as K from './kleur-color.js?v=1';
import { GFX } from './gfx/settings.js?v=1';
import { icon } from './gfx/art.js?v=1';

// api: { esc, say(t), copy(text)->Promise<bool>, pals() -> [], setPals(arr), toColoring(colors), cur() -> hex, setCur(hex) }
export function mountLab(host, api) {
  const { esc } = api;
  const st = { sub: 'wiel', L: 55, harm: 'triade', pal: K.generatePalette({ n: 5 }), locked: {}, n: 5, mode: 'willekeurig', hist: [],
    grad: { type: 'linear', angle: 90, stops: [{ c: '#ff6b6b', p: 0 }, { c: '#feca57', p: 50 }, { c: '#48dbfb', p: 100 }] }, mixA: '#ef4444', mixB: '#3b82f6', mixT: 50,
    fg: '#3b3b98', bg: '#f1f2f6', photo: null, photoPal: [], sim: 'normaal', cb: 'normaal' };
  let disposed = false, wheelImg = null, wheelL = -1;
  const $ = (s) => host.querySelector(s);
  const SUBS = [['wiel', '🎡 Wiel'], ['palet', '🎲 Palet'], ['verloop', '🌅 Verloop'], ['contrast', '🔍 Contrast'], ['blind', '👓 Kleurenblind'], ['foto', '📷 Foto'], ['bewaard', '⭐ Bewaard']];
  const tx = (c) => K.bestText(c);
  const sw = (c, extra = '', body = '') => `<button class="kl-sw" data-pick="${c}" title="${c} · ${K.colorName(c)}" style="background:${c};color:${tx(c)};${extra}">${body}</button>`;

  function render() {
    if (disposed) return;
    host.innerHTML = `<div class="tabs2" id="lb-subs">${SUBS.map(([k, l]) => `<button data-sub="${k}" class="${k === st.sub ? 'on' : ''}">${l}</button>`).join('')}</div><div id="lb-body"></div>`;
    $('#lb-subs').onclick = (e) => { const b = e.target.closest('[data-sub]'); if (b) { st.sub = b.dataset.sub; render(); } };
    const body = $('#lb-body');
    body.innerHTML = ({ wiel: wielHtml, palet: paletHtml, verloop: verloopHtml, contrast: contrastHtml, blind: blindHtml, foto: fotoHtml, bewaard: bewaardHtml })[st.sub]();
    ({ wiel: wielAfter, palet: () => {}, verloop: () => {}, contrast: () => {}, blind: () => {}, foto: fotoAfter, bewaard: () => {} })[st.sub]();
  }

  // ===== Wiel =====
  function wielHtml() {
    const c = api.cur(), [h, s, l] = K.hexToHsl(c), rgb = K.hexToRgb(c), H = K.HARMONIES.find((x) => x.id === st.harm), hc = K.harmony(c, st.harm);
    return `<div class="card"><div class="kl-flex"><canvas id="lb-wheel" width="240" height="240" style="width:min(100%,280px);aspect-ratio:1;touch-action:none;border-radius:50%;cursor:crosshair"></canvas>
      <div style="flex:1;min-width:190px"><div class="kl-big" style="background:${c};color:${tx(c)}">${esc(K.colorName(c))}</div>
        <div class="kl-row"><input type="text" id="lb-hex" value="${c}" maxlength="7" style="width:7.5rem" aria-label="Hex-code"><input type="color" id="lb-picker" value="${c}" style="width:3.2rem;height:46px;padding:0;border:0;background:none" aria-label="Kies kleur"><button data-act="copyhex">📋 Kopieer</button></div>
        <small class="mute">RGB ${rgb.join(', ')} · HSL ${Math.round(h)}°, ${Math.round(s)}%, ${Math.round(l)}%</small>
        <div class="kl-row"><span>Licht</span><input type="range" id="lb-light" min="5" max="95" value="${Math.round(st.L)}" style="flex:1"></div></div></div></div>
      <div class="card"><b>Kleurharmonie</b><div class="kl-row">${K.HARMONIES.map((x) => `<button data-harm="${x.id}" class="${x.id === st.harm ? 'on' : ''}">${x.name}</button>`).join('')}</div><small class="mute">${esc(H.desc)}</small>
        <div class="kl-strip">${hc.map((x) => sw(x, '', `<small>${x}</small>`)).join('')}</div>
        <div class="kl-row"><button data-act="harmToPal">🎲 Maak hier een palet van</button></div></div>`;
  }
  function drawWheel() {
    const cv = $('#lb-wheel'); if (!cv) return; const N = cv.width, ctx = cv.getContext('2d'); if (!ctx) return;
    if (!wheelImg || wheelL !== st.L) {
      wheelL = st.L; try { wheelImg = ctx.createImageData(N, N); } catch { wheelImg = null; }
      if (wheelImg) { const R = N / 2; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const dx = x - R + 0.5, dy = y - R + 0.5, r = Math.hypot(dx, dy), i = (y * N + x) * 4; if (r > R) { wheelImg.data[i + 3] = 0; continue; } const [rr, gg, bb] = K.hslToRgb((Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360, (r / R) * 100, st.L); wheelImg.data[i] = rr; wheelImg.data[i + 1] = gg; wheelImg.data[i + 2] = bb; wheelImg.data[i + 3] = 255; } }
    }
    ctx.clearRect(0, 0, N, N); if (wheelImg) ctx.putImageData(wheelImg, 0, 0);
    const [h, s] = K.hexToHsl(api.cur()), R = N / 2, a = h * Math.PI / 180, rr = (s / 100) * R, x = R + Math.cos(a) * rr, y = R + Math.sin(a) * rr;
    ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fillStyle = api.cur(); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.lineWidth = 1; ctx.strokeStyle = '#0008'; ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.stroke();
    K.harmony(api.cur(), st.harm).slice(1).forEach((hc) => { const [hh, ss] = K.hexToHsl(hc), aa = hh * Math.PI / 180; ctx.beginPath(); ctx.arc(R + Math.cos(aa) * (ss / 100) * R, R + Math.sin(aa) * (ss / 100) * R, 7, 0, Math.PI * 2); ctx.fillStyle = hc; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); });
  }
  function wielAfter() {
    const cv = $('#lb-wheel'); if (!cv) return; wheelImg = null; drawWheel(); let down = false;
    const pick = (e) => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 2 - 1, y = (e.clientY - r.top) / r.height * 2 - 1, d = Math.min(1, Math.hypot(x, y)); const hex = K.hslToHex((Math.atan2(y, x) * 180 / Math.PI + 360) % 360, d * 100, st.L); api.setCur(hex); updateWielInfo(); drawWheel(); };
    cv.addEventListener('pointerdown', (e) => { down = true; try { cv.setPointerCapture(e.pointerId); } catch { /* stil */ } pick(e); });
    cv.addEventListener('pointermove', (e) => { if (down) pick(e); }); cv.addEventListener('pointerup', () => { down = false; cv.dispatchEvent(new Event('lb-done')); });
    cv.addEventListener('lb-done', () => render());
    $('#lb-light').oninput = (e) => { st.L = +e.target.value; const [h, s] = K.hexToHsl(api.cur()); api.setCur(K.hslToHex(h, s, st.L)); drawWheel(); updateWielInfo(); };
    $('#lb-light').onchange = () => render();
    $('#lb-hex').onchange = (e) => { api.setCur(K.normHex(e.target.value, api.cur())); render(); };
    $('#lb-picker').onchange = (e) => { api.setCur(e.target.value); st.L = K.hexToHsl(e.target.value)[2]; render(); };
  }
  function updateWielInfo() { const c = api.cur(), big = $('.kl-big'); if (big) { big.style.background = c; big.style.color = tx(c); big.textContent = K.colorName(c); } const hx = $('#lb-hex'); if (hx) hx.value = c; const pk = $('#lb-picker'); if (pk) pk.value = c; }

  // ===== Palet =====
  function newPalette() {
    st.hist.push({ pal: st.pal.slice(), locked: { ...st.locked } }); if (st.hist.length > 10) st.hist.shift();
    st.pal = K.generatePalette({ mode: st.mode, n: st.n, locked: st.locked, base: st.mode !== 'willekeurig' && api.cur() ? api.cur() : undefined });
    if (st.mode !== 'willekeurig') { /* basis = huidige kleur, daarom wisselt hij mee */ }
  }
  function paletHtml() {
    return `<div class="card"><div class="kl-pal">${st.pal.map((c, i) => `<div class="kl-pc" style="background:${c};color:${tx(c)}"><button class="kl-lock" data-lock="${i}" aria-label="Vastzetten" style="color:${tx(c)}">${st.locked[i] ? '🔒' : '🔓'}</button><button data-pick="${c}" class="kl-hexb" style="color:${tx(c)}"><b>${c}</b><small>${esc(K.colorName(c))}</small></button></div>`).join('')}</div>
      <div class="kl-row"><button class="on" data-act="newpal" style="flex:1;font-size:1.1rem">🎲 Nieuw palet</button><button data-act="undopal" ${st.hist.length ? '' : 'disabled'}>↶ Vorige</button></div>
      <div class="kl-row"><label>Soort <select id="lb-mode"><option value="willekeurig"${st.mode === 'willekeurig' ? ' selected' : ''}>Willekeurig</option>${K.HARMONIES.map((h) => `<option value="${h.id}"${st.mode === h.id ? ' selected' : ''}>${h.name} (met je kleur)</option>`).join('')}</select></label>
        <label>Aantal <select id="lb-n">${[2, 3, 4, 5, 6, 7, 8].map((n) => `<option${n === st.n ? ' selected' : ''}>${n}</option>`).join('')}</select></label></div>
      <small class="mute">Tik op het slotje om een kleur te houden. Tik op een kleur om hem te kiezen.</small></div>
      <div class="card"><div class="kl-row"><input type="text" id="lb-pname" maxlength="30" placeholder="Naam van je palet" style="flex:1"><button data-act="savepal">⭐ Bewaar</button></div>
        <div class="kl-row"><button data-act="palcopy">📋 Kopieer kleuren</button><button data-act="palcss">📋 Kopieer als CSS</button><button data-act="palcolor">🎨 Gebruik bij kleurplaten</button></div></div>`;
  }

  // ===== Verloop & mixer =====
  function verloopHtml() {
    const g = st.grad, css = K.gradientCss(g), mixed = K.mix(st.mixA, st.mixB, st.mixT / 100);
    return `<div class="card"><b>Verloop maken</b><div class="kl-grad" style="background:${css}"></div>
      <div class="kl-row"><select id="lb-gt"><option value="linear"${g.type === 'linear' ? ' selected' : ''}>Lijn</option><option value="radial"${g.type === 'radial' ? ' selected' : ''}>Cirkel</option><option value="conic"${g.type === 'conic' ? ' selected' : ''}>Draaiend</option></select>
        <span>Hoek</span><input type="range" id="lb-ga" min="0" max="360" value="${g.angle}" style="flex:1" ${g.type === 'radial' ? 'disabled' : ''}><b>${g.angle}°</b></div>
      ${g.stops.map((s, i) => `<div class="kl-row"><input type="color" data-gc="${i}" value="${s.c}" style="width:3.2rem;height:46px;padding:0;border:0;background:none" aria-label="Kleur ${i + 1}"><input type="range" data-gp="${i}" min="0" max="100" value="${s.p}" style="flex:1" aria-label="Plek"><b style="min-width:2.6rem">${s.p}%</b><button data-gdel="${i}" ${g.stops.length <= 2 ? 'disabled' : ''} aria-label="Verwijder">✖</button></div>`).join('')}
      <div class="kl-row"><button data-act="gadd" ${g.stops.length >= 5 ? 'disabled' : ''}>＋ Kleur</button><button data-act="grand">🎲 Verras me</button><button data-act="gcopy">📋 Kopieer CSS</button></div>
      <textarea readonly rows="2" id="lb-gcss" style="font-family:monospace;font-size:.8rem">background: ${esc(css)};</textarea></div>
      <div class="card"><b>Kleuren mengen</b><div class="kl-row"><input type="color" id="lb-ma" value="${st.mixA}" style="width:3.2rem;height:46px;padding:0;border:0;background:none"><input type="range" id="lb-mt" min="0" max="100" value="${st.mixT}" style="flex:1"><input type="color" id="lb-mb" value="${st.mixB}" style="width:3.2rem;height:46px;padding:0;border:0;background:none"></div>
        <div class="kl-big" id="lb-mixbig" style="background:${mixed};color:${tx(mixed)}">${mixed} · ${esc(K.colorName(mixed))}</div>
        <div class="kl-strip" id="lb-mixstrip">${[0, 1, 2, 3, 4, 5, 6].map((i) => sw(K.mix(st.mixA, st.mixB, i / 6), '', `<small>${Math.round(i / 6 * 100)}%</small>`)).join('')}</div></div>`;
  }

  // ===== Contrast =====
  function contrastHtml() {
    const r = K.contrastRatio(st.fg, st.bg), g = K.contrastGrade(r), badge = (ok, t) => `<span class="kl-badge ${ok ? 'ok' : 'no'}">${ok ? '✔' : '✖'} ${t}</span>`;
    return `<div class="card"><div class="kl-flex"><label class="kl-row" style="margin:0">Tekst <input type="color" id="lb-fg" value="${st.fg}" style="width:3.2rem;height:46px;padding:0;border:0;background:none"></label>
      <label class="kl-row" style="margin:0">Achtergrond <input type="color" id="lb-bg" value="${st.bg}" style="width:3.2rem;height:46px;padding:0;border:0;background:none"></label><button data-act="swap">⇄ Wissel</button><button data-act="fixc">✨ Maak leesbaar</button></div>
      <div class="kl-prev" style="background:${st.bg};color:${st.fg}"><div style="font-size:1rem">Zo ziet gewone tekst eruit. The quick brown fox jumps.</div><div style="font-size:1.8rem;font-weight:800">Grote tekst</div></div>
      <div class="kl-big" style="background:transparent;color:inherit;border:2px solid var(--line)">Contrast ${r.toFixed(2)} : 1</div>
      <div class="kl-row">${badge(g.normaalAA, 'Gewone tekst AA')}${badge(g.normaalAAA, 'Gewone tekst AAA')}${badge(g.grootAA, 'Grote tekst AA')}${badge(g.grootAAA, 'Grote tekst AAA')}</div>
      <small class="mute">Hoe hoger het getal, hoe makkelijker te lezen. Minstens 4,5 is goed voor gewone tekst, 3 is genoeg voor grote tekst. Wit op zwart is 21.</small></div>`;
  }

  // ===== Kleurenblind =====
  function blindHtml() {
    const pal = st.pal;
    return `<div class="card"><b>Hoe ziet iemand die kleurenblind is jouw palet?</b><br><small class="mute">Ongeveer 1 op de 12 jongens en 1 op de 200 meisjes ziet kleuren anders. Kijk of je kleuren nog uit elkaar te houden zijn!</small>
      ${K.CB_TYPES.map((t) => `<div style="margin:.5rem 0"><small><b>${t.name}</b></small><div class="kl-strip">${pal.map((c) => { const s = K.simulateHex(c, t.id); return `<div class="kl-sw" style="background:${s};color:${tx(s)};cursor:default"><small>${s}</small></div>`; }).join('')}</div></div>`).join('')}
      <div class="kl-row"><button data-act="newpal2">🎲 Ander palet</button><small class="mute">Het palet van het tabblad “Palet” wordt hier gebruikt. Op het tabblad “Foto” kun je ook een foto met andere ogen bekijken.</small></div></div>`;
  }

  // ===== Foto =====
  function fotoHtml() {
    return `<div class="card"><b>Kleuren uit een foto</b><br><small class="mute">Kies een foto uit je bibliotheek of maak er een. Tik daarna op de foto om een kleur te pakken.</small>
      <div class="kl-row"><label class="kl-file"><input type="file" id="lb-file" accept="image/*" style="display:none"><span class="kl-btn on">${icon('camera', { size: 26 })} Kies een foto</span></label></div>
      <div id="lb-pwrap" style="display:${st.photo ? '' : 'none'}"><canvas id="lb-photo" style="width:100%;max-width:520px;border-radius:12px;touch-action:none;cursor:crosshair;display:block"></canvas>
        <div class="kl-row"><label>Kijk met <select id="lb-sim">${K.CB_TYPES.map((t) => `<option value="${t.id}"${t.id === st.sim ? ' selected' : ''}>${t.name}</option>`).join('')}</select></label></div>
        <div class="kl-big" id="lb-pbig" style="background:${api.cur()};color:${tx(api.cur())}">${api.cur()} · ${esc(K.colorName(api.cur()))}</div>
        <b>Palet van deze foto</b><div class="kl-strip" id="lb-ppal">${st.photoPal.map((c) => sw(c, '', `<small>${c}</small>`)).join('')}</div>
        <div class="kl-row"><button data-act="ppal">🎲 Andere hoeveelheid</button><button data-act="ppalsave">⭐ Bewaar palet</button><button data-act="ppalto">🎨 Bij kleurplaten</button></div></div>
      <div id="lb-perr"></div></div>`;
  }
  function drawPhoto() {
    const cv = $('#lb-photo'); if (!cv || !st.photo) return; const ctx = cv.getContext('2d'), p = st.photo; cv.width = p.w; cv.height = p.h;
    const copy = new ImageData(new Uint8ClampedArray(p.data), p.w, p.h); K.simulateImageData(copy.data, st.sim); ctx.putImageData(copy, 0, 0);
  }
  function fotoAfter() {
    if (st.photo) drawPhoto();
    const f = $('#lb-file'); if (!f) return;
    f.onchange = () => {
      const file = f.files && f.files[0]; if (!file) return; const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        try {
          const max = 480, k = Math.min(1, max / Math.max(img.width, img.height)), w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k)), tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
          const c = tmp.getContext('2d'); c.drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url); const d = c.getImageData(0, 0, w, h);
          st.photo = { w, h, data: new Uint8ClampedArray(d.data) }; st.photoPal = K.extractPalette(st.photo.data, 6); if (!disposed) render();
        } catch { URL.revokeObjectURL(url); const e = $('#lb-perr'); if (e) e.innerHTML = '<small class="err">Deze foto kan niet gelezen worden.</small>'; }
      };
      img.onerror = () => { URL.revokeObjectURL(url); const e = $('#lb-perr'); if (e) e.innerHTML = '<small class="err">Dit is geen plaatje dat ik kan openen.</small>'; };
      img.src = url;
    };
    const cv = $('#lb-photo'); if (cv && st.photo) cv.addEventListener('pointerdown', (e) => {
      const r = cv.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / r.width * st.photo.w), y = Math.floor((e.clientY - r.top) / r.height * st.photo.h);
      if (x < 0 || y < 0 || x >= st.photo.w || y >= st.photo.h) return; const i = (y * st.photo.w + x) * 4, d = st.photo.data, hex = K.rgbToHex(d[i], d[i + 1], d[i + 2]);
      api.setCur(hex); const big = $('#lb-pbig'); if (big) { big.style.background = hex; big.style.color = tx(hex); big.textContent = `${hex} · ${K.colorName(hex)}`; }
    });
    const sim = $('#lb-sim'); if (sim) sim.onchange = () => { st.sim = sim.value; drawPhoto(); };
  }

  // ===== Bewaard =====
  function bewaardHtml() {
    const pals = api.pals();
    return `<div class="card"><b>Mijn paletten</b> <small class="mute">(${pals.length}/${K.PAL_MAX})</small>${pals.length ? pals.map((p, i) => `<div class="kl-saved"><div style="flex:1;min-width:0"><b>${esc(p.name)}</b><div class="kl-strip" style="margin:.2rem 0">${p.colors.map((c) => `<div class="kl-sw" data-pick="${c}" style="background:${c};min-height:34px"></div>`).join('')}</div></div>
      <div class="kl-col"><button data-act="puse" data-i="${i}">Gebruik</button><button data-act="pcolor" data-i="${i}">🎨</button><button data-act="pcopy" data-i="${i}">📋</button><button data-act="pdel" data-i="${i}">🗑</button></div></div>`).join('') : '<br><small class="mute">Nog geen paletten. Maak er een bij “Palet” of “Foto” en tik op ⭐ Bewaar.</small>'}</div>`;
  }

  // ===== events =====
  function onClick(e) {
    const b = e.target.closest && e.target.closest('button, .kl-sw'); if (!b || !host.contains(b) || b.disabled) return;
    if (b.dataset.pick) { api.setCur(b.dataset.pick); st.L = K.hexToHsl(b.dataset.pick)[2]; api.say(`${b.dataset.pick} · ${K.colorName(b.dataset.pick)} gekozen.`); if (st.sub === 'wiel') render(); return; }
    if (b.dataset.harm) { st.harm = b.dataset.harm; render(); return; }
    if (b.dataset.lock != null) { const i = +b.dataset.lock; if (st.locked[i]) delete st.locked[i]; else st.locked[i] = st.pal[i]; render(); return; }
    if (b.dataset.gdel != null) { st.grad.stops.splice(+b.dataset.gdel, 1); render(); return; }
    const a = b.dataset.act; if (!a) return;
    switch (a) {
      case 'copyhex': api.copy(api.cur()).then((ok) => api.say(ok ? `✔ ${api.cur()} gekopieerd` : 'Kopiëren lukt niet.')); break;
      case 'harmToPal': st.pal = K.harmony(api.cur(), st.harm); st.n = st.pal.length; st.locked = {}; st.sub = 'palet'; render(); break;
      case 'newpal': case 'newpal2': newPalette(); render(); break;
      case 'undopal': { const h = st.hist.pop(); if (h) { st.pal = h.pal; st.locked = h.locked; } render(); break; }
      case 'savepal': { const pals = api.pals(); if (pals.length >= K.PAL_MAX) { api.say('Je hebt al ' + K.PAL_MAX + ' paletten. Gooi er eerst een weg.'); break; } pals.unshift({ name: ($('#lb-pname').value || '').trim().slice(0, 30) || `Palet ${pals.length + 1}`, colors: st.pal.slice() }); api.setPals(pals); api.say('⭐ Palet bewaard!'); break; }
      case 'palcopy': api.copy(K.paletteText(st.pal)).then((ok) => api.say(ok ? '✔ Gekopieerd' : 'Kopiëren lukt niet.')); break;
      case 'palcss': api.copy(K.paletteCss(st.pal)).then((ok) => api.say(ok ? '✔ CSS gekopieerd' : 'Kopiëren lukt niet.')); break;
      case 'palcolor': api.toColoring(st.pal, 'Mijn palet'); break;
      case 'gadd': { const g = st.grad; g.stops.push({ c: K.randomColor(), p: 100 }); g.stops.forEach((s, i) => { s.p = Math.round(i * 100 / (g.stops.length - 1)); }); render(); break; }
      case 'grand': { const cs = K.generatePalette({ mode: 'analoog', n: st.grad.stops.length }); st.grad.stops.forEach((s, i) => { s.c = cs[i]; }); st.grad.angle = Math.round(K.rand(360)); render(); break; }
      case 'gcopy': api.copy(`background: ${K.gradientCss(st.grad)};`).then((ok) => api.say(ok ? '✔ CSS gekopieerd' : 'Kopiëren lukt niet.')); break;
      case 'swap': [st.fg, st.bg] = [st.bg, st.fg]; render(); break;
      case 'fixc': st.fg = K.fixContrast(st.fg, st.bg, 4.5); render(); break;
      case 'ppal': st.photoPal = K.extractPalette(st.photo.data, 3 + K.rand(6)); render(); break;
      case 'ppalsave': { const pals = api.pals(); if (st.photoPal.length < 2) break; pals.unshift({ name: 'Uit foto', colors: st.photoPal.slice() }); api.setPals(pals); api.say('⭐ Palet bewaard!'); break; }
      case 'ppalto': api.toColoring(st.photoPal, 'Uit foto'); break;
      case 'puse': { const p = api.pals()[+b.dataset.i]; if (p) { st.pal = p.colors.slice(); st.n = Math.max(3, Math.min(8, st.pal.length)); st.locked = {}; st.sub = 'palet'; render(); } break; }
      case 'pcolor': { const p = api.pals()[+b.dataset.i]; if (p) api.toColoring(p.colors, p.name); break; }
      case 'pcopy': { const p = api.pals()[+b.dataset.i]; if (p) api.copy(K.paletteText(p.colors)).then((ok) => api.say(ok ? '✔ Gekopieerd' : 'Kopiëren lukt niet.')); break; }
      case 'pdel': { const pals = api.pals(); pals.splice(+b.dataset.i, 1); api.setPals(pals); render(); break; }
      default: break;
    }
  }
  function onInput(e) {
    const t = e.target;
    if (t.id === 'lb-mode') { st.mode = t.value; return; }
    if (t.id === 'lb-n') { st.n = +t.value; st.locked = {}; st.pal = K.generatePalette({ mode: st.mode, n: st.n }); render(); return; }
    if (t.id === 'lb-gt') { st.grad.type = t.value; render(); return; }
    if (t.id === 'lb-ga') { st.grad.angle = +t.value; refreshGrad(); return; }
    if (t.dataset.gc != null) { st.grad.stops[+t.dataset.gc].c = t.value; refreshGrad(); return; }
    if (t.dataset.gp != null) { st.grad.stops[+t.dataset.gp].p = +t.value; refreshGrad(); return; }
    if (t.id === 'lb-ma' || t.id === 'lb-mb' || t.id === 'lb-mt') { if (t.id === 'lb-ma') st.mixA = t.value; else if (t.id === 'lb-mb') st.mixB = t.value; else st.mixT = +t.value; refreshMix(); return; }
    if (t.id === 'lb-fg' || t.id === 'lb-bg') { if (t.id === 'lb-fg') st.fg = t.value; else st.bg = t.value; render(); }
  }
  function refreshGrad() { const css = K.gradientCss(st.grad), g = $('.kl-grad'); if (g) g.style.background = css; const ta = $('#lb-gcss'); if (ta) ta.value = `background: ${css};`; }
  function refreshMix() { const m = K.mix(st.mixA, st.mixB, st.mixT / 100), big = $('#lb-mixbig'); if (big) { big.style.background = m; big.style.color = tx(m); big.textContent = `${m} · ${K.colorName(m)}`; } const s = $('#lb-mixstrip'); if (s) s.innerHTML = [0, 1, 2, 3, 4, 5, 6].map((i) => sw(K.mix(st.mixA, st.mixB, i / 6), '', `<small>${Math.round(i / 6 * 100)}%</small>`)).join(''); }
  host.addEventListener('click', onClick); host.addEventListener('input', onInput); host.addEventListener('change', (e) => { if (e.target.id === 'lb-gt' || e.target.id === 'lb-mode') onInput(e); });
  void GFX;
  render();
  return { dispose() { disposed = true; } , setPalette(p) { st.pal = p.slice(); } };
}
