// Tijd: wereldklokken met een draaiende 3D-globe (dag en nacht), tijdzone-rekenen, vergaderplanner en tijdzone-quiz.
import * as T from './tijd-core.js?v=1';
import { icon, GFX, makeCanvas, playScene, escHtml as esc } from './tools-ui.js?v=1';
import { glow } from './gfx/fx.js?v=1';

const TAU = Math.PI * 2, RAD = Math.PI / 180;

// Grove landvormen als [lengtegraad, breedtegraad]-lijsten (alleen voor het plaatje).
export const LAND = [
  [[-168, 66], [-162, 70], [-141, 70], [-128, 70], [-115, 68], [-95, 72], [-85, 69], [-82, 63], [-93, 59], [-85, 55], [-80, 52], [-77, 62], [-70, 60], [-62, 57], [-56, 52], [-60, 48], [-66, 45], [-70, 42], [-74, 40], [-76, 35], [-81, 31], [-80, 26], [-82, 26], [-84, 30], [-89, 30], [-94, 29], [-97, 26], [-97, 21], [-95, 18], [-91, 19], [-87, 21], [-88, 16], [-84, 15], [-83, 10], [-80, 9], [-77, 8], [-80, 7], [-84, 9], [-86, 12], [-90, 14], [-96, 16], [-105, 20], [-108, 25], [-113, 31], [-117, 33], [-121, 35], [-124, 40], [-124, 47], [-128, 51], [-135, 57], [-142, 60], [-150, 60], [-158, 57], [-165, 55], [-160, 59], [-166, 62]],
  [[-80, 9], [-72, 12], [-64, 10], [-60, 8], [-52, 5], [-50, 0], [-44, -2], [-35, -5], [-35, -9], [-39, -15], [-41, -22], [-48, -26], [-53, -34], [-58, -35], [-57, -39], [-63, -41], [-65, -47], [-68, -52], [-70, -54], [-75, -51], [-74, -43], [-73, -37], [-71, -30], [-70, -18], [-76, -14], [-81, -5], [-80, 0], [-78, 2]],
  [[-17, 21], [-16, 28], [-10, 30], [-6, 36], [10, 37], [11, 33], [20, 31], [32, 31], [34, 28], [38, 20], [43, 12], [51, 12], [48, 5], [40, -3], [40, -11], [35, -20], [33, -26], [28, -33], [20, -35], [18, -32], [14, -23], [12, -15], [13, -6], [9, 4], [5, 6], [-4, 5], [-8, 4], [-13, 8], [-17, 14]],
  [[-9, 37], [-9, 43], [-1, 44], [-4, 48], [2, 51], [8, 54], [9, 57], [11, 59], [5, 62], [14, 67], [22, 70], [30, 70], [40, 67], [44, 68], [60, 69], [70, 73], [80, 73], [100, 78], [113, 74], [130, 72], [142, 72], [160, 70], [180, 69], [180, 65], [170, 60], [160, 60], [156, 52], [150, 59], [142, 54], [140, 48], [135, 43], [130, 42], [129, 35], [126, 35], [126, 38], [122, 40], [121, 37], [119, 33], [122, 30], [120, 26], [116, 22], [110, 21], [108, 17], [109, 12], [105, 9], [100, 13], [100, 8], [103, 1], [99, 7], [98, 16], [94, 17], [92, 22], [87, 21], [80, 15], [78, 8], [73, 16], [72, 22], [67, 25], [61, 25], [57, 26], [59, 22], [55, 17], [44, 13], [43, 16], [39, 22], [35, 28], [34, 31], [35, 36], [30, 36], [27, 37], [26, 40], [24, 38], [22, 36], [20, 40], [19, 42], [14, 45], [12, 44], [16, 41], [18, 40], [16, 38], [12, 42], [9, 44], [3, 43], [-1, 43]],
  [[114, -22], [122, -18], [130, -12], [136, -12], [137, -16], [142, -11], [146, -19], [153, -26], [151, -34], [147, -39], [140, -38], [135, -34], [131, -31], [124, -33], [116, -35], [114, -26]],
  [[-73, 78], [-60, 82], [-30, 83], [-20, 80], [-20, 72], [-22, 70], [-40, 65], [-44, 60], [-50, 64], [-55, 70], [-68, 76]],
  [[-5, 50], [1, 51], [2, 53], [-2, 56], [-2, 58], [-5, 58.5], [-6, 56], [-3, 54], [-5, 52]], [[-10, 52], [-6, 52], [-6, 55], [-10, 54]],
  [[130, 31], [132, 34], [136, 34], [140, 36], [142, 40], [141, 45], [140, 41], [137, 37], [133, 35], [130, 33]],
  [[109, 1], [111, -3], [116, -4], [118, 1], [117, 7], [113, 3]], [[95, 5], [98, 4], [104, -3], [106, -6], [101, -3], [96, 3]], [[106, -6], [114, -7], [114, -9], [106, -7]], [[131, -1], [141, -3], [150, -10], [142, -9], [137, -5]],
  [[172, -34], [178, -38], [175, -41], [172, -41]], [[172, -41], [174, -42], [170, -46], [167, -46]], [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]], [[-24, 65], [-14, 66], [-14, 64], [-22, 63.5]],
  [[-180, -72], [-120, -74], [-60, -68], [0, -70], [60, -67], [120, -66], [180, -72], [180, -90], [-180, -90]],
];

/** Orthografische projectie: (lon,lat) -> {x,y,z} met z>0 aan de voorkant. Kijkpunt (vlon, vlat) in graden. */
export function project(lon, lat, vlon, vlat) {
  const l = (lon - vlon) * RAD, p = lat * RAD, p0 = vlat * RAD;
  const x = Math.cos(p) * Math.sin(l), y = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l), z = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
  return { x, y, z };
}
/** Omgekeerd: punt op de eenheidsschijf (x, y in -1..1, y omhoog) -> {lon, lat} of null buiten de bol. */
export function unproject(x, y, vlon, vlat) {
  const rr = x * x + y * y; if (rr > 1) return null; const z = Math.sqrt(1 - rr), p0 = vlat * RAD;
  const lat = Math.asin(Math.max(-1, Math.min(1, z * Math.sin(p0) + y * Math.cos(p0))));
  const lon = vlon * RAD + Math.atan2(x, z * Math.cos(p0) - y * Math.sin(p0));
  return { lon: ((lon / RAD + 540) % 360) - 180, lat: lat / RAD };
}

let maskCv = null;
function nightMask(res, vlon, vlat, sun) {
  if (!maskCv || maskCv.width !== res) { maskCv = document.createElement('canvas'); maskCv.width = res; maskCv.height = res; }
  const c = maskCv.getContext('2d'); if (!c || !c.createImageData) return null;
  const img = c.createImageData(res, res), d = img.data, sl = sun.lat * RAD, sn = sun.lon * RAD;
  const sx = Math.cos(sl) * Math.cos(sn), sy = Math.cos(sl) * Math.sin(sn), sz = Math.sin(sl);
  for (let py = 0; py < res; py++) for (let px = 0; px < res; px++) {
    const x = ((px + 0.5) / res) * 2 - 1, y = 1 - ((py + 0.5) / res) * 2, rr = x * x + y * y, o = (py * res + px) * 4;
    if (rr > 1) { d[o + 3] = 0; continue; }
    const p = unproject(x, y, vlon, vlat), cl = Math.cos(p.lat * RAD), dot = cl * Math.cos(p.lon * RAD) * sx + cl * Math.sin(p.lon * RAD) * sy + Math.sin(p.lat * RAD) * sz;
    const night = Math.min(1, Math.max(0, (0.12 - dot) / 0.3)), limb = Math.pow(rr, 3) * 0.35;
    d[o] = 6; d[o + 1] = 10; d[o + 2] = 40; d[o + 3] = Math.round(255 * Math.min(0.82, night * 0.72 + limb));
  }
  c.putImageData(img, 0, 0); return maskCv;
}

/** Teken de globe. o = { vlon, vlat, date, cities:[{lon,lat,name,color}], sel, t } */
export function drawGlobe(ctx, cx, cy, R, o) {
  const q = GFX.q;
  glow(ctx, cx, cy, R * 1.25, '#60a5fa', 0.28);
  // zee
  let g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
  g.addColorStop(0, '#38bdf8'); g.addColorStop(0.6, '#0369a1'); g.addColorStop(1, '#0c2d5a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
  // lengte- en breedtelijnen
  if (q > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1;
    for (let lat = -60; lat <= 60; lat += 30) { ctx.beginPath(); let first = true; for (let lon = -180; lon <= 180; lon += 6) { const p = project(lon, lat, o.vlon, o.vlat); if (p.z <= 0) { first = true; continue; } const X = cx + p.x * R, Y = cy - p.y * R; first ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); first = false; } ctx.stroke(); }
    for (let lon = -180; lon < 180; lon += 30) { ctx.beginPath(); let first = true; for (let lat = -90; lat <= 90; lat += 6) { const p = project(lon, lat, o.vlon, o.vlat); if (p.z <= 0) { first = true; continue; } const X = cx + p.x * R, Y = cy - p.y * R; first ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); first = false; } ctx.stroke(); }
  }
  // land
  for (const poly of LAND) {
    ctx.beginPath(); let any = false;
    poly.forEach(([lon, lat], i) => {
      const p = project(lon, lat, o.vlon, o.vlat); let x = p.x, y = p.y;
      if (p.z > 0) any = true; else { const l = Math.hypot(x, y) || 1; x /= l; y /= l; }
      const X = cx + x * R, Y = cy - y * R; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    });
    if (!any) continue; ctx.closePath();
    g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, '#86c961'); g.addColorStop(1, '#3f7d34');
    ctx.fillStyle = g; ctx.fill();
    if (q > 0) { ctx.strokeStyle = 'rgba(20,60,20,.5)'; ctx.lineWidth = 1; ctx.stroke(); }
  }
  // nacht
  const sun = T.subsolar(o.date), res = [40, 64, 96][q] || 64, m = nightMask(res, o.vlon, o.vlat, sun);
  if (m) ctx.drawImage(m, cx - R, cy - R, R * 2, R * 2);
  ctx.restore();
  // steden
  for (const c of o.cities) {
    const p = project(c.lon, c.lat, o.vlon, o.vlat); if (p.z <= 0.05) continue;
    const X = cx + p.x * R, Y = cy - p.y * R, sel = c.id === o.sel, day = T.isDaytime(o.date, c.lat, c.lon);
    const pulse = sel && !GFX.reduce ? 1 + 0.35 * Math.sin((o.t || 0) * 4) : 1;
    if (q > 0 || sel) glow(ctx, X, Y, (sel ? 16 : 10) * pulse, day ? '#fde047' : '#e0e7ff', 0.7);
    ctx.fillStyle = day ? '#fde047' : '#fff'; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X, Y, sel ? 5 : 3.5, 0, TAU); ctx.fill(); ctx.stroke();
    if (sel || o.labels) { ctx.fillStyle = '#fff'; ctx.font = '700 12px system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(c.name, X + 8, Y); ctx.fillText(c.name, X + 8, Y); }
  }
  // glans
  if (q > 0) { g = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.05, cx - R * 0.3, cy - R * 0.3, R * 0.8); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill(); }
}

const DAYNAMES = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];

export function worldTab(api) {
  const { body, track, load, save } = api;
  let ids = load('wereld-steden', T.DEFAULT_CITIES).filter((id) => T.CITY[id]); if (!ids.length) ids = T.DEFAULT_CITIES.slice();
  let sel = ids[0], offMin = 0, vlon = T.CITY[sel].lon, vlat = 20, drag = null, focusTo = null, section = 'klokken';
  const persist = () => save('wereld-steden', ids);
  const home = () => T.CITY[ids[0]];

  body.innerHTML = `<div class="tu-hero" style="background:radial-gradient(circle at 50% 40%,#16254a,#050816)"><div class="tu-in" style="padding:.5rem"><div data-globe style="height:min(88vw,340px);position:relative;touch-action:none;margin:0 auto"></div>
      <div style="text-align:center;font-size:.85rem;opacity:.8">Sleep om te draaien · tik op een stad in de lijst</div></div></div>
    <div class="tu-tabs" style="margin-top:.5rem"><button class="tu-tab on" data-sec="klokken">${icon('earth', { size: 24 })}Klokken</button><button class="tu-tab" data-sec="reken">${icon('hourglass', { size: 24 })}Tijdzone-rekenen</button><button class="tu-tab" data-sec="plan">${icon('bell', { size: 24 })}Vergaderen</button><button class="tu-tab" data-sec="quiz">${icon('target', { size: 24 })}Quiz</button></div>
    <div data-sec-body></div>`;

  // --- globe
  const host = body.querySelector('[data-globe]');
  const cv = makeCanvas(host, (ctx, w, h, t, dt) => {
    ctx.clearRect(0, 0, w, h);
    if (focusTo) { const dl = ((focusTo.lon - vlon + 540) % 360) - 180; vlon += dl * Math.min(1, dt * 5); vlat += (focusTo.lat - vlat) * Math.min(1, dt * 5); if (Math.abs(dl) < 0.5) focusTo = null; }
    else if (!drag && !GFX.reduce) vlon = (vlon + dt * 7 + 540) % 360 - 180;
    drawGlobe(ctx, w / 2, h / 2, Math.min(w, h) * 0.44, { vlon, vlat, date: new Date(Date.now() + offMin * 60000), sel, t, cities: ids.map((id) => T.CITY[id]).map((c) => ({ id: c.id, lon: c.lon, lat: c.lat, name: c.name })) });
  }, { fps: GFX.reduce ? 4 : GFX.q ? 30 : 20 });
  track(cv.stop);
  const el = cv.cv;
  el.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; focusTo = null; try { el.setPointerCapture(e.pointerId); } catch { /* stil */ } });
  el.addEventListener('pointermove', (e) => { if (!drag) return; vlon = ((vlon - (e.clientX - drag.x) * 0.5 + 540) % 360) - 180; vlat = Math.max(-70, Math.min(70, vlat + (e.clientY - drag.y) * 0.4)); drag = { x: e.clientX, y: e.clientY }; });
  el.addEventListener('pointerup', () => { drag = null; }); el.addEventListener('pointercancel', () => { drag = null; });

  const sb = body.querySelector('[data-sec-body]');
  body.querySelectorAll('[data-sec]').forEach((b) => { b.onclick = () => { section = b.dataset.sec; body.querySelectorAll('[data-sec]').forEach((x) => x.classList.toggle('on', x === b)); render(); }; });

  function render() { api.tickFns.length = 0; ({ klokken: sClocks, reken: sConvert, plan: sPlan, quiz: sQuiz })[section](); }

  /* ---- klokken ---- */
  function sClocks() {
    const rest = T.CITIES.filter((c) => !ids.includes(c.id));
    sb.innerHTML = `<div class="tu-card"><div class="tu-row" style="justify-content:space-between"><b>Tijd verschuiven</b><button data-now class="tu-big" style="min-height:44px">Nu</button></div>
      <input type="range" data-off min="-720" max="1440" step="15" value="${offMin}" style="width:100%;height:36px"><div data-offl style="text-align:center;font-weight:700"></div></div>
      <div data-list></div>
      <div class="tu-card"><b>Stad toevoegen</b><div class="tu-row" style="margin-top:.4rem"><select data-add class="tu-inp" style="flex:1">${rest.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select><button class="tu-big pri" data-addb>Toevoegen</button></div></div>`;
    const list = sb.querySelector('[data-list]'), slider = sb.querySelector('[data-off]');
    const draw = () => {
      const d = new Date(Date.now() + offMin * 60000), h = home(), hp = T.tzParts(d, h.tz);
      sb.querySelector('[data-offl]').textContent = offMin === 0 ? 'Het is nu' : `${offMin > 0 ? '+' : '−'}${Math.floor(Math.abs(offMin) / 60)} u ${Math.abs(offMin) % 60 ? Math.abs(offMin) % 60 + ' min' : ''} (in ${h.name}: ${T.pad2(hp.h)}:${T.pad2(hp.mi)})`;
      list.innerHTML = ids.map((id, i) => {
        const c = T.CITY[id], p = T.tzParts(d, c.tz), day = T.isDaytime(d, c.lat, c.lon), diff = T.hoursAhead(h.tz, c.tz, d), dd = Math.round((Date.UTC(p.y, p.mo - 1, p.d) - Date.UTC(hp.y, hp.mo - 1, hp.d)) / 864e5);
        return `<div class="tu-card" data-city="${id}" style="display:flex;align-items:center;gap:.7rem;margin:.4rem 0;${id === sel ? 'border-color:var(--accent)' : ''};cursor:pointer">${icon(day ? 'sun' : 'moon', { size: 44 })}<span style="flex:1"><b style="font-size:1.1rem">${esc(c.name)}</b>${i === 0 ? ' <span class="tu-chip">thuis</span>' : ''}<br><small>${DAYNAMES[p.wd]} ${p.d}/${p.mo} · ${T.formatOffset(T.tzOffsetMin(d, c.tz))}${i ? ` · ${diff === 0 ? 'zelfde tijd' : (diff > 0 ? '+' : '−') + Math.abs(diff) + ' u'}` : ''}${dd ? ` · ${dd > 0 ? 'morgen' : 'gisteren'}` : ''}</small></span>
          <span style="font-size:1.9rem;font-weight:800;font-variant-numeric:tabular-nums">${T.pad2(p.h)}:${T.pad2(p.mi)}</span>${ids.length > 1 ? `<button data-rm="${id}" aria-label="Verwijder" style="min-width:44px;min-height:44px">✕</button>` : ''}</div>`;
      }).join('');
      list.querySelectorAll('[data-city]').forEach((e) => { e.onclick = (ev) => { const id = e.dataset.city; sel = id; focusTo = { lon: T.CITY[id].lon, lat: Math.max(-40, Math.min(50, T.CITY[id].lat)) }; draw(); }; });
      list.querySelectorAll('[data-rm]').forEach((b) => { b.onclick = (ev) => { if (ev && ev.stopPropagation) ev.stopPropagation(); ids = ids.filter((x) => x !== b.dataset.rm); if (!ids.includes(sel)) sel = ids[0]; persist(); sClocks(); }; });
    };
    slider.oninput = () => { offMin = +slider.value; draw(); };
    sb.querySelector('[data-now]').onclick = () => { offMin = 0; slider.value = 0; draw(); };
    sb.querySelector('[data-addb]').onclick = () => { const id = sb.querySelector('[data-add]').value; if (id && !ids.includes(id)) { ids.push(id); persist(); sel = id; focusTo = { lon: T.CITY[id].lon, lat: Math.max(-40, Math.min(50, T.CITY[id].lat)) }; sClocks(); } };
    api.tickFns.push((now) => { if (now - (sClocks._l || 0) > 1000) { sClocks._l = now; draw(); } });
    draw();
  }

  /* ---- tijdzone-rekenen ---- */
  function sConvert() {
    let from = ids[0], to = ids[1] || 'tok', hh = new Date().getHours(), mm = 0;
    const opts = (s) => T.CITIES.map((c) => `<option value="${c.id}" ${c.id === s ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
    sb.innerHTML = `<div class="tu-card"><b>Hoe laat is het daar?</b><div class="tu-row" style="margin-top:.5rem"><label style="flex:1"><span class="tu-in-lbl">Van</span><select data-f class="tu-inp">${opts(from)}</select></label><button data-sw class="tu-big" style="min-height:48px">⇄</button><label style="flex:1"><span class="tu-in-lbl">Naar</span><select data-t class="tu-inp">${opts(to)}</select></label></div>
      <label style="display:block;margin-top:.6rem"><span class="tu-in-lbl">Tijd</span><input data-time type="time" class="tu-inp" value="${T.pad2(hh)}:${T.pad2(mm)}"></label><div data-out style="font-size:1.5rem;font-weight:800;margin-top:.7rem;line-height:1.4"></div>
      <small data-hint style="opacity:.75"></small></div>`;
    const upd = () => {
      from = sb.querySelector('[data-f]').value; to = sb.querySelector('[data-t]').value;
      const v = sb.querySelector('[data-time]').value || '12:00', [h, m] = v.split(':').map(Number), a = T.CITY[from], b = T.CITY[to];
      const r = T.convertTime(h, m, a.tz, b.tz, new Date()), diff = T.hoursAhead(a.tz, b.tz);
      sb.querySelector('[data-out]').innerHTML = `${T.pad2(h)}:${T.pad2(m)} in ${esc(a.name)} is<br><span style="color:var(--accent);font-size:2rem">${T.pad2(r.h)}:${T.pad2(r.mi)}</span> in ${esc(b.name)}${r.dayShift ? `<br><small>${r.dayShift > 0 ? 'de volgende dag' : 'de vorige dag'}</small>` : ''}`;
      sb.querySelector('[data-hint]').textContent = `${esc(b.name)} loopt ${diff === 0 ? 'gelijk met' : Math.abs(diff) + ' uur ' + (diff > 0 ? 'voor op' : 'achter bij')} ${a.name} (op dit moment).`;
    };
    sb.querySelectorAll('select,input').forEach((e) => { e.onchange = upd; e.oninput = upd; });
    sb.querySelector('[data-sw]').onclick = () => { const f = sb.querySelector('[data-f]'), t = sb.querySelector('[data-t]'), x = f.value; f.value = t.value; t.value = x; upd(); };
    upd();
  }

  /* ---- vergaderplanner ---- */
  function sPlan() {
    let chosen = ids.slice(0, 3), startH = 8, endH = 20;
    const draw = () => {
      const tzs = chosen.map((id) => T.CITY[id].tz), w = T.meetingWindows(tzs, new Date(), startH, endH);
      sb.innerHTML = `<div class="tu-card"><b>Wanneer kan iedereen bellen?</b><p><small>Kies steden. Je ziet de tijden waarop het overal tussen ${startH}:00 en ${endH}:00 is (in de tijd van ${esc(chosen.length ? T.CITY[chosen[0]].name : '…')}).</small></p>
        <div class="tu-row">${T.CITIES.map((c) => `<button class="tu-tab ${chosen.includes(c.id) ? 'on' : ''}" data-ch="${c.id}" style="min-height:40px;padding:.2rem .7rem">${esc(c.name)}</button>`).join('')}</div>
        <div class="tu-row" style="margin-top:.6rem"><label>Vanaf <select data-s class="tu-inp" style="width:auto">${[6, 7, 8, 9, 10].map((x) => `<option ${x === startH ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label>tot <select data-e class="tu-inp" style="width:auto">${[17, 18, 19, 20, 21, 22].map((x) => `<option ${x === endH ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div></div>
        <div class="tu-card">${chosen.length < 2 ? '<small>Kies minstens twee steden.</small>' : w.length ? w.map((x) => `<div style="font-size:1.3rem;font-weight:800;margin:.3rem 0">${icon('bell', { size: 28 })} ${T.hhmm(x.from)} tot ${T.hhmm(x.to)}</div>`).join('') + '<small>Tijden zijn voor vandaag, in de tijd van de eerste stad.</small>' : '<b>Geen gezamenlijk moment vandaag.</b><br><small>Probeer andere steden of een ruimer tijdvenster.</small>'}</div>`;
      sb.querySelectorAll('[data-ch]').forEach((b) => { b.onclick = () => { const id = b.dataset.ch; chosen = chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id]; draw(); }; });
      sb.querySelector('[data-s]').onchange = (e) => { startH = +e.target.value; draw(); }; sb.querySelector('[data-e]').onchange = (e) => { endH = +e.target.value; draw(); };
    };
    draw();
  }

  /* ---- quiz ---- */
  function sQuiz() {
    let i = 0, right = 0, best = load('wereld-quiz', 0), q;
    const N = 8;
    const next = () => {
      if (i >= N) { if (right > best) { best = right; save('wereld-quiz', best); } sb.innerHTML = `<div class="tu-card" style="text-align:center">${icon('trophy', { size: 80 })}<h2>${right} van ${N} goed</h2><small>Beste score: ${best}</small><div class="tu-row" style="justify-content:center;margin-top:.6rem"><button class="tu-big pri" data-again>Nog een keer</button></div></div>`; sb.querySelector('[data-again]').onclick = sQuiz; if (right === N) playScene(document.body, 'victory', { title: 'Wereldklok-expert!', sub: 'Alles goed' }); return; }
      const a = T.CITIES[Math.floor(Math.random() * T.CITIES.length)];
      let b; do { b = T.CITIES[Math.floor(Math.random() * T.CITIES.length)]; } while (b.id === a.id);
      const h = Math.floor(Math.random() * 24), m = [0, 30][Math.floor(Math.random() * 2)], now = new Date();
      const r = T.convertTime(h, m, a.tz, b.tz, now), ans = `${T.pad2(r.h)}:${T.pad2(r.mi)}`, set = new Set([ans]);
      while (set.size < 4) { const o = [-3, -2, -1, 1, 2, 3, 0.5][Math.floor(Math.random() * 7)], tot = (r.h * 60 + r.mi + Math.round(o * 60) + 1440) % 1440; set.add(`${T.pad2(Math.floor(tot / 60))}:${T.pad2(tot % 60)}`); }
      q = { ans, opts: [...set].sort(() => Math.random() - 0.5) };
      sb.innerHTML = `<div class="tu-card" style="text-align:center"><span class="tu-chip">${i + 1}/${N}</span><p style="font-size:1.3rem;font-weight:800;margin:.6rem 0">Het is ${T.pad2(h)}:${T.pad2(m)} in ${esc(a.name)}.<br>Hoe laat is het in ${esc(b.name)}?</p><div data-fb style="min-height:2rem;font-weight:700"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">${q.opts.map((o) => `<button class="tu-big" data-o="${o}" style="min-height:64px;font-size:1.3rem">${o}</button>`).join('')}</div></div>`;
      sb.querySelectorAll('[data-o]').forEach((bt) => { bt.onclick = () => { if (bt.disabled) return; const ok = bt.dataset.o === q.ans; if (ok) right++; sb.querySelector('[data-fb]').innerHTML = ok ? '<span class="tu-ok">Goed!</span>' : `<span class="tu-bad">Het is ${q.ans}.</span>`; sb.querySelectorAll('[data-o]').forEach((x) => { x.disabled = true; }); i++; api.later(next, ok ? 800 : 1700); }; });
    };
    next();
  }
  render();
}
