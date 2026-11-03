// Weer-app: huidig weer met geanimeerde weerscène, uur- (48 u) en dagverwachting (14 dagen), regen, wind, UV, zon en maan,
// luchtkwaliteit, advies, meerdere plaatsen, leerhoekje en regenradar-links. Data van Open-Meteo (gratis, zonder sleutel).
// Entry-bestand: weerView({ view, esc, uid, addCleanup }) (db mag erbij voor opslag in de cloud).
import * as W from './weer-core.js?v=1';
import { WeatherScene } from './weer-scene.js?v=1';
import { icon, GFX, Themes, injectCss, topBar, bindGear, tabsHtml, makeStore, makeCanvas, playScene, escHtml } from './tools-ui.js?v=1';
import { preload, drawIcon } from './gfx/art.js?v=1';

const TABS = [['nu', 'Nu', 'sun'], ['uur', 'Per uur', 'hourglass'], ['dagen', '14 dagen', 'ticket'], ['zon', 'Zon en maan', 'moon'], ['radar', 'Regenradar', 'rain'], ['leren', 'Leren', 'book'], ['mijn', 'Mijn weer', 'heart'], ['plaatsen', 'Plaatsen', 'map']];

export async function weerView(ctx) {
  const { view, addCleanup, uid } = ctx;
  const esc = ctx.esc || escHtml;
  injectCss(); injectCss('wr-css', `.wr button{min-height:calc(44px * var(--gfx-scale,1))}.wr-temp{font-size:calc(4.4rem * var(--gfx-font,1));font-weight:800;line-height:1}.wr-chips{display:flex;gap:.4rem;overflow-x:auto;padding:.1rem 0 .4rem;scrollbar-width:none}.wr-chips::-webkit-scrollbar{display:none}.wr-chip{flex:none;border-radius:99px;padding:.3rem .9rem;font-weight:700;white-space:nowrap}.wr-chip.on{background:var(--accent);border-color:var(--accent);color:#fff}.wr-ico{position:relative;display:inline-block}.wr-ico>*+*{position:absolute;right:-30%;bottom:-8%}a.tu-card{display:flex;align-items:center;gap:.8rem;color:inherit;text-decoration:none}`);
  const LOC_KEY = `weer:loc:${uid}`, CACHE_KEY = `weer:cache:${uid}`;
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* stil */ } };
  const store = makeStore({ key: `weer:v2:${uid}`, game: 'weer', uid, db: ctx.db, def: { places: [], world: '', quiz: { best: 0 } } });
  store.sync().catch(() => {});
  let loc = read(LOC_KEY), raw = null, st = null, air = null, tab = 'nu', alive = true, seq = 0;
  let tabCleanups = [], tickTimer = null, refreshTimer = null;
  const scene = new WeatherScene();
  const track = (f) => tabCleanups.push(f);
  addCleanup(() => { alive = false; clearInterval(tickTimer); clearInterval(refreshTimer); tabCleanups.splice(0).forEach((f) => { try { f(); } catch { /* stil */ } }); store.flush(); });

  view.innerHTML = '<div class="tu wr"><div data-top></div><div data-chips></div><div data-tabs></div><div data-body></div></div>';
  const $ = (s) => view.querySelector(s);
  $('[data-top]').innerHTML = topBar('Weer', 'cloud'); bindGear(view, 'Instellingen');

  /* ---------- data ---------- */
  const url = (l) => `https://api.open-meteo.com/v1/forecast?latitude=${l.lat}&longitude=${l.lon}`
    + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,is_day,cloud_cover,pressure_msl,surface_pressure'
    + '&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index,cloud_cover,is_day'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset,uv_index_max,wind_speed_10m_max,wind_gusts_10m_max,sunshine_duration,daylight_duration'
    + '&minutely_15=precipitation&forecast_minutely_15=8&past_hours=3&forecast_hours=72&timezone=auto&forecast_days=14&wind_speed_unit=kmh';
  async function fetchWeather() { const r = await fetch(url(loc)); if (!r.ok) throw new Error(`Weerdienst gaf fout ${r.status}`); return r.json(); }
  async function fetchAir() {
    air = null; const l = loc;
    try { const r = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${l.lat}&longitude=${l.lon}&current=european_aqi,pm10,pm2_5,alder_pollen,birch_pollen,grass_pollen&timezone=auto`); if (!r.ok) return; const j = await r.json(); if (l === loc && j.current) { air = j.current; fillAir(); } } catch { /* stil */ }
  }
  const nowMs = () => Date.now();

  async function load(spinner = true) {
    if (!loc) return searchView();
    renderChips();
    if (spinner && !st) $('[data-body]').innerHTML = '<div class="tu-card center"><small>Weer laden…</small></div>';
    try { raw = await fetchWeather(); write(CACHE_KEY, { loc, data: raw, at: Date.now() }); }
    catch (e) {
      const c = read(CACHE_KEY);
      if (c && c.loc && c.loc.name === loc.name && c.data) { raw = c.data; st = W.normalize(raw); render(); $('[data-body]').insertAdjacentHTML('afterbegin', '<div class="tu-card err">Geen verbinding, dit is het laatste bekende weer.</div>'); return; }
      $('[data-body]').innerHTML = `<div class="tu-card"><span class="err">Weer laden lukt niet: ${esc(e.message)}</span><div class="tu-row" style="margin-top:.5rem"><button class="tu-big" data-retry>Opnieuw</button><button class="tu-big" data-other>Andere plaats</button></div></div>`;
      $('[data-retry]').onclick = () => load(); $('[data-other]').onclick = () => { tab = 'plaatsen'; render(); }; return;
    }
    st = W.normalize(raw); if (!spinner && (tab === 'leren' || tab === 'plaatsen')) { fetchAir(); return; } render(); fetchAir();
  }
  const setLoc = (l, remember = true) => {
    loc = l; write(LOC_KEY, l); write(CACHE_KEY, null); st = null; raw = null; air = null;
    if (remember) store.update((d) => { if (!d.places.some((p) => Math.abs(p.lat - l.lat) < 0.02 && Math.abs(p.lon - l.lon) < 0.02)) { d.places.unshift({ name: l.name, lat: l.lat, lon: l.lon }); d.places = d.places.slice(0, 12); } });
    tab = 'nu'; load();
  };

  /* ---------- plaatsen ---------- */
  function renderChips() {
    const pl = store.get().places, el = $('[data-chips]');
    const items = pl.length ? pl : (loc ? [{ name: loc.name, lat: loc.lat, lon: loc.lon }] : []);
    el.innerHTML = `<div class="wr-chips">${items.map((p, i) => `<button class="wr-chip ${loc && Math.abs(p.lat - loc.lat) < 0.02 && Math.abs(p.lon - loc.lon) < 0.02 ? 'on' : ''}" data-pl="${i}">${esc(p.name)}</button>`).join('')}<button class="wr-chip" data-addpl aria-label="Plaats toevoegen">＋</button></div>`;
    el.querySelectorAll('[data-pl]').forEach((b) => { b.onclick = () => { const p = items[+b.dataset.pl]; setLoc({ name: p.name, lat: p.lat, lon: p.lon }, false); }; });
    el.querySelector('[data-addpl]').onclick = () => { tab = 'plaatsen'; render(); };
  }
  function searchView(msg = '') {
    $('[data-tabs]').innerHTML = ''; $('[data-chips]').innerHTML = '';
    $('[data-body]').innerHTML = placesCard(msg, true); bindSearch($('[data-body]'));
  }
  const placesCard = (msg = '', first = false) => `<div class="tu-card"><h3 style="margin-top:0">${icon('map', { size: 32 })} ${first ? 'Waar ben je?' : 'Plaats zoeken'}</h3>
      <div class="tu-row"><input id="wq" class="tu-inp" placeholder="Zoek een plaats (bijv. Utrecht)" autocomplete="off" style="flex:1;min-width:8rem"><button class="pri tu-big" id="wgo">Zoek</button></div>
      <div class="tu-row" style="margin-top:.5rem"><button id="wgeo" class="tu-big" style="flex:1">${icon('compass', { size: 24 })} Gebruik mijn locatie</button></div>
      <small style="display:block;margin-top:.3rem;opacity:.75">Met mijn locatie vraagt je toestel om toestemming. Je locatie gaat alleen naar de weerdienst Open-Meteo om het weer te halen.</small>
      <div id="wres"></div><div id="wmsg" class="err">${esc(msg)}</div></div>`;
  function bindSearch(root) {
    const q = root.querySelector('#wq');
    const go = async () => {
      const name = q.value.trim(); if (!name) return;
      root.querySelector('#wres').innerHTML = '<small>Zoeken…</small>';
      try {
        const j = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=6&language=nl&format=json`)).json(); const list = j.results || [];
        root.querySelector('#wres').innerHTML = list.length ? list.map((p, i) => `<div class="tu-row" style="margin:.35rem 0;flex-wrap:nowrap"><span style="flex:1">${esc(p.name)} <small>${esc([p.admin1, p.country].filter(Boolean).join(', '))}</small></span><button class="pri tu-big" style="min-height:44px" data-p="${i}">Kies</button></div>`).join('') : '<small>Niets gevonden.</small>';
        root.querySelectorAll('[data-p]').forEach((b) => { b.onclick = () => { const p = list[b.dataset.p]; setLoc({ name: p.name, lat: p.latitude, lon: p.longitude }); }; });
      } catch { root.querySelector('#wres').innerHTML = '<span class="err">Zoeken lukt niet. Heb je internet?</span>'; }
    };
    root.querySelector('#wgo').onclick = go; q.onkeydown = (e) => { if (e.key === 'Enter') go(); };
    root.querySelector('#wgeo').onclick = () => {
      root.querySelector('#wmsg').textContent = '';
      if (!navigator.geolocation) { root.querySelector('#wmsg').textContent = 'Locatie is niet beschikbaar in deze browser.'; return; }
      root.querySelector('#wres').innerHTML = '<small>Locatie ophalen… (geef toestemming als je browser erom vraagt)</small>';
      navigator.geolocation.getCurrentPosition((p) => setLoc({ name: 'Mijn locatie', lat: Math.round(p.coords.latitude * 100) / 100, lon: Math.round(p.coords.longitude * 100) / 100 }),
        () => { root.querySelector('#wres').innerHTML = ''; root.querySelector('#wmsg').textContent = 'Locatie geweigerd. Zoek een plaats met de naam.'; }, { timeout: 15000, maximumAge: 600000 });
    };
  }

  /* ---------- hulp ---------- */
  const isNightAt = (ms) => { if (!st) return false; const p = W.placeParts(ms, st.off); const day = st.days.find((x) => { const q = W.placeParts(x.sunrise, st.off); return q.d === p.d && q.mo === p.mo; }); return day ? ms < day.sunrise || ms > day.sunset : false; };
  const wxIcon = (info, size) => (info.icons.length > 1 ? `<span class="wr-ico" style="width:${size}px;height:${size}px">${icon(info.icons[0], { size })}${icon(info.icons[1], { size: Math.round(size * 0.62) })}</span>` : icon(info.icons[0], { size }));
  const temp = (v) => `${Math.round(v)}°`;
  const f1 = (v) => (Math.round(v * 10) / 10).toString().replace('.', ',');
  const windArrow = (deg, size = 36) => `<svg viewBox="-20 -20 40 40" width="${size}" height="${size}" style="transform:rotate(${(deg + 180) % 360}deg);flex:none"><path d="M0,-16 L9,10 L0,5 L-9,10 Z" fill="currentColor"/></svg>`;
  const wd = (d) => `${W.DAGEN_LANG[d.wd]}`;

  /* ---------- hoofdweergave ---------- */
  function render() {
    if (!alive || !st) return;
    renderChips();
    $('[data-tabs]').innerHTML = tabsHtml(TABS, tab);
    view.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { tab = b.dataset.tab; render(); }; });
    tabCleanups.splice(0).forEach((f) => { try { f(); } catch { /* stil */ } }); clearInterval(tickTimer);
    const b = $('[data-body]'); b.innerHTML = '';
    ({ nu: tabNu, uur: tabUur, dagen: tabDagen, zon: tabZon, radar: tabRadar, leren: tabLeren, mijn: tabMijn, plaatsen: tabPlaatsen })[tab](b);
  }

  /* ----- Mijn weer (ronde 4) ----- */
  function tabMijn(b) {
    b.innerHTML = '<div class="tu-card center"><small>Laden…</small></div>'; const my = seq;
    import('./tools-r4-weer.js?v=1').then((m) => { if (!alive || tab !== 'mijn') return; b.innerHTML = ''; m.mijnWeerTab(b, { st, store, icon, track, loc }); })
      .catch((e) => { b.innerHTML = `<div class="tu-card"><span class="err">Kon dit niet laden: ${esc(e.message)}</span></div>`; });
  }

  /* ----- Nu ----- */
  function tabNu(b) {
    const now = nowMs(), c = st.current, hi = W.currentHourIndex(st.hours, now), hr = st.hours[hi] || {}, day = st.days[0] || {};
    const night = !c.day, info = W.wmoInfo(c.code, night), uv = hr.uv || 0, uvi = W.uvInfo(uv), rs = W.rainSummary(st.rain15, now);
    const frac = day.sunrise ? W.sunFraction(now, day.sunrise, day.sunset) : null;
    const world = store.get().world ? Themes.world(store.get().world) : null;
    scene.set(W.sceneParams(c.code, { night, wind: c.wind, clouds: c.clouds }), { sunFrac: night ? null : frac == null ? 0.5 : frac, world });
    b.innerHTML = `<div class="tu-hero" data-hero style="height:min(100vw,380px)"><div class="tu-in" style="height:100%;display:flex;flex-direction:column;justify-content:space-between;text-shadow:0 1px 6px rgba(0,0,0,.55)">
        <div class="tu-row" style="justify-content:space-between"><b style="font-size:1.25rem">${esc(loc.name)}</b><span data-clock style="font-weight:700;font-size:1.1rem"></span></div>
        <div class="tu-row" style="align-items:flex-end;justify-content:space-between"><div><div class="wr-temp">${temp(c.temp)}</div><div style="font-size:1.25rem;font-weight:700">${esc(info.text)}</div><div style="opacity:.92">Voelt als ${temp(c.feels)} · ${temp(day.max)} / ${temp(day.min)}</div></div><div>${wxIcon(info, 110)}</div></div></div></div>
      <div class="tu-card" style="${rs.state === 'none' ? 'background:#064e3b;color:#fff;border:0' : 'background:#1e3a8a;color:#fff;border:0'}"><div class="tu-row" style="flex-wrap:nowrap">${icon(rs.state === 'none' ? 'sun' : 'rain', { size: 40 })}<b>${esc(rs.text)}</b></div></div>
      <div class="tu-card"><b>${icon('heart', { size: 26 })} Wat trek ik aan?</b>${W.clothing({ feels: c.feels, rain: hr.rain || 0, pop: hr.pop || 0, wind: c.wind, uv, code: c.code }).map((x) => `<div class="tu-row" style="margin:.35rem 0;flex-wrap:nowrap">${icon(x.icon, { size: 34 })}<span>${esc(x.text)}</span></div>`).join('')}</div>
      <div class="tu-grid">
        <div class="tu-tile" style="color:#0ea5e9">${windArrow(c.dir, 44)}<span style="color:var(--ink)">${Math.round(c.wind)} km/u</span><small style="color:var(--ink)">Windkracht ${W.bft(c.wind)} · uit het ${W.windFrom(c.dir)}${c.gust ? `<br>vlagen ${Math.round(c.gust)} km/u` : ''}</small></div>
        <div class="tu-tile">${icon('sun', { size: 44 })}<span style="color:${uvi.color}">UV ${Math.round(uv * 10) / 10}</span><small>${uvi.level}<br>${esc(uvi.advice)}</small></div>
        <div class="tu-tile">${icon('rain', { size: 44 })}<span>${c.hum ?? '–'}%</span><small>luchtvochtigheid</small></div>
        <div class="tu-tile">${icon('cloud', { size: 44 })}<span>${c.clouds != null ? c.clouds + '%' : '–'}</span><small>bewolking</small></div>
        <div class="tu-tile">${icon('earth', { size: 44 })}<span>${c.pmsl ? Math.round(c.pmsl) + ' hPa' : '–'}</span><small>luchtdruk${c.pmsl ? ' · ' + (c.pmsl < 1000 ? 'laag' : c.pmsl > 1020 ? 'hoog' : 'gemiddeld') : ''}</small></div>
        <div class="tu-tile" data-air>${icon('leaf', { size: 44 })}<span>…</span><small>luchtkwaliteit</small></div></div>
      <div class="tu-card"><b>${icon('sun', { size: 26 })} Zon</b>${sunArc(day, now)}</div>
      <div class="tu-card"><b>${icon('bike', { size: 26 })} Wat past er vandaag bij?</b>${W.activityScores(day).map((a) => `<div class="tu-row" style="margin:.4rem 0;flex-wrap:nowrap">${icon(a.icon, { size: 32 })}<span style="flex:1;min-width:0">${esc(a.name)}<div class="tu-bar"><i style="width:${a.score}%;background:${a.score >= 60 ? '#16a34a' : a.score >= 40 ? '#eab308' : '#dc2626'}"></i></div></span><b style="min-width:5.5rem;text-align:right">${W.scoreWord(a.score)}</b></div>`).join('')}</div>
      <div class="tu-card"><div class="tu-row" style="flex-wrap:nowrap">${icon('map', { size: 40 })}<span style="flex:1"><b>Regenradar</b><br><small>Waar regent het nu? Bekijk de radar.</small></span><button class="tu-big pri" data-radar>Open</button></div></div>
      <small style="display:block;text-align:center;opacity:.6;margin:.5rem 0 1rem">Weerdata: Open-Meteo.com · ververst elke 10 minuten</small>`;
    $('[data-radar]').onclick = () => { tab = 'radar'; render(); };
    const cv = makeCanvas(b.querySelector('[data-hero]'), (ctx2, w, h, t, dt) => { scene.update(dt, w, h); scene.draw(ctx2, w, h, GFX.reduce ? 0 : t); }, { fps: GFX.reduce ? 3 : GFX.q ? 40 : 24 });
    track(cv.stop);
    const clock = () => { const el = b.querySelector('[data-clock]'); if (!el) return; const p = W.placeParts(Date.now(), st.off); el.textContent = `${W.DAGEN[p.wd]} ${String(p.h).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}`; };
    clock(); tickTimer = setInterval(clock, 5000); fillAir();
  }
  function fillAir() {
    const el = view.querySelector('[data-air]'); if (!el || !air) return;
    const a = W.aqiInfo(air.european_aqi), pol = [['els', air.alder_pollen], ['berk', air.birch_pollen], ['gras', air.grass_pollen]].filter(([, v]) => v != null && v >= 1).map(([n, v]) => `${n}: ${W.pollenLevel(v)}`);
    el.innerHTML = `${icon('leaf', { size: 44 })}<span style="color:${a ? a.color : 'inherit'}">${a ? a.text : '–'}</span><small>luchtkwaliteit${air.european_aqi != null ? ' (' + Math.round(air.european_aqi) + ')' : ''}${pol.length ? '<br>pollen ' + esc(pol.join(', ')) : ''}</small>`;
  }
  function sunArc(day, now) {
    if (!day || !day.sunrise) return '';
    const f = W.sunFraction(now, day.sunrise, day.sunset), x = (v) => 10 + 180 * v, y = (v) => 70 - 58 * Math.sin(Math.PI * v), fr = f == null ? (now < day.sunrise ? 0 : 1) : f;
    return `<svg viewBox="0 0 200 90" width="100%" style="max-height:170px"><path d="M10,70 Q100,-46 190,70" fill="none" stroke="var(--line)" stroke-width="3" stroke-dasharray="5 5"/><line x1="0" y1="70" x2="200" y2="70" stroke="currentColor" stroke-opacity=".4"/>
      <circle cx="${x(fr)}" cy="${y(fr)}" r="9" fill="${f == null ? '#94a3b8' : '#fbbf24'}" stroke="#f59e0b" stroke-width="2"/></svg>
      <div class="tu-row" style="justify-content:space-between"><span>${icon('sun', { size: 22 })} Op ${W.hhmm(day.sunrise, st.off)}</span><span>${day.daylight ? W.dayLength(day.daylight) + ' daglicht' : ''}</span><span>Onder ${W.hhmm(day.sunset, st.off)}</span></div>`;
  }

  /* ----- Per uur ----- */
  function tabUur(b) {
    const now = nowMs(), s0 = Math.max(0, W.currentHourIndex(st.hours, now)), hrs = st.hours.slice(s0, s0 + 48);
    b.innerHTML = `<div class="tu-card"><b>Komende ${hrs.length} uur</b><div data-scroll style="overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:.4rem"><canvas data-chart style="display:block"></canvas></div><small>Lijn = temperatuur, blokjes onderin = hoeveel regen.</small></div>
      <div class="tu-card" style="padding:.4rem 1rem">${hrs.map((h, k) => { const inf = W.wmoInfo(h.code, isNightAt(h.t)); return `<div class="tu-row" style="flex-wrap:nowrap;border-top:${k ? '1px solid var(--line)' : '0'};padding:.45rem 0"><b style="width:3.2rem">${k === 0 ? 'nu' : W.hhmm(h.t, st.off)}</b>${wxIcon(inf, 36)}<b style="width:2.6rem;text-align:right">${temp(h.temp)}</b><span style="flex:1;font-size:.85rem;opacity:.85;min-width:0">${esc(inf.text)}</span><small style="width:7.5rem;text-align:right">${h.rain > 0 ? `${icon('rain', { size: 16 })} ${f1(h.rain)} mm · ` : ''}${h.pop}%<br>${Math.round(h.wind)} km/u${h.uv >= 3 ? ' · UV ' + Math.round(h.uv) : ''}</small></div>`; }).join('')}</div>`;
    const cv = b.querySelector('[data-chart]'), wpx = Math.max(b.clientWidth || 340, hrs.length * 46), hpx = 190, d = GFX.dpr || 1;
    cv.width = Math.round(wpx * d); cv.height = Math.round(hpx * d); cv.style.width = wpx + 'px'; cv.style.height = hpx + 'px';
    preload(['sun', 'moon', 'cloud', 'rain', 'snowflake', 'bolt']).catch(() => {}).then(() => { if (alive && cv.isConnected !== false) drawChart(cv, hrs, wpx, hpx, d); });
  }
  function drawChart(cv, hrs, w, h, d) {
    const ctx2 = cv.getContext('2d'); if (!ctx2) return; if (ctx2.setTransform) ctx2.setTransform(d, 0, 0, d, 0, 0);
    ctx2.clearRect(0, 0, w, h); const mx = Math.max(...hrs.map((x) => x.temp)), mn = Math.min(...hrs.map((x) => x.temp)), top = 52, bot = 40, pw = w / hrs.length;
    const ty = (v) => top + (h - top - bot - 14) * (1 - (v - mn) / Math.max(1, mx - mn));
    const ink = '#64748b';
    const gr = ctx2.createLinearGradient(0, top, 0, h); gr.addColorStop(0, 'rgba(99,102,241,.35)'); gr.addColorStop(1, 'rgba(99,102,241,0)');
    ctx2.beginPath(); hrs.forEach((x, i) => { const px = pw * (i + 0.5), py = ty(x.temp); i ? ctx2.lineTo(px, py) : ctx2.moveTo(px, py); }); ctx2.lineTo(w - pw * 0.5, h - bot); ctx2.lineTo(pw * 0.5, h - bot); ctx2.closePath(); ctx2.fillStyle = gr; ctx2.fill();
    ctx2.beginPath(); hrs.forEach((x, i) => { const px = pw * (i + 0.5), py = ty(x.temp); i ? ctx2.lineTo(px, py) : ctx2.moveTo(px, py); }); ctx2.strokeStyle = '#6366f1'; ctx2.lineWidth = 3; ctx2.lineJoin = 'round'; ctx2.stroke();
    ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle';
    hrs.forEach((x, i) => {
      const px = pw * (i + 0.5), py = ty(x.temp), bh = Math.min(30, x.rain * 14);
      if (bh > 0.5) { ctx2.fillStyle = 'rgba(14,165,233,.75)'; ctx2.fillRect(px - pw * 0.3, h - bot - bh, pw * 0.6, bh); }
      ctx2.fillStyle = '#6366f1'; ctx2.beginPath(); ctx2.arc(px, py, 3.5, 0, Math.PI * 2); ctx2.fill();
      if (i % 2 === 0) { ctx2.fillStyle = ink; ctx2.font = '700 12px system-ui,sans-serif'; ctx2.fillText(`${Math.round(x.temp)}°`, px, py - 12); drawIcon(ctx2, W.wmoInfo(x.code, isNightAt(x.t)).icons[0], px, 22, 32); }
      if (i % 3 === 0) { ctx2.fillStyle = ink; ctx2.font = '600 11px system-ui,sans-serif'; ctx2.fillText(W.hhmm(x.t, st.off), px, h - 14); }
    });
  }

  /* ----- 14 dagen ----- */
  function tabDagen(b) {
    const days = st.days, gmin = Math.min(...days.map((d) => d.min)), gmax = Math.max(...days.map((d) => d.max));
    let open = -1, act = 'fietsen';
    const draw = () => {
      const best = W.bestDayFor(days, act), acts = W.activityScores(days[0]);
      b.innerHTML = `<div class="tu-card"><b>Beste dag voor…</b><div class="wr-chips" style="margin-top:.4rem">${acts.map((a) => `<button class="wr-chip ${a.id === act ? 'on' : ''}" data-act="${a.id}">${icon(a.icon, { size: 22 })} ${esc(a.name)}</button>`).join('')}</div>
        <div class="tu-row" style="margin-top:.3rem">${icon(acts.find((a) => a.id === act).icon, { size: 40 })}<b>${best.i === 0 ? 'Vandaag' : esc(wd(best.day))}</b> <span class="tu-chip">${W.scoreWord(best.score)}</span> <small>${esc(W.daySummary(best.day))}</small></div></div>
        <div class="tu-card" style="padding:.4rem 1rem">${days.map((d, i) => { const inf = W.wmoInfo(d.code), l = 100 * (d.min - gmin) / Math.max(1, gmax - gmin), r = 100 * (d.max - gmin) / Math.max(1, gmax - gmin);
          return `<div data-day="${i}" style="border-top:${i ? '1px solid var(--line)' : '0'};padding:.5rem 0;cursor:pointer"><div class="tu-row" style="flex-wrap:nowrap"><b style="width:3.4rem">${i === 0 ? 'Nu' : W.DAGEN[d.wd]} <small style="font-weight:400">${d.date.slice(8)}</small></b>${wxIcon(inf, 40)}<small style="width:4.8rem;text-align:right;white-space:nowrap">${d.rain >= 0.1 ? icon('rain', { size: 14 }) + ' ' + f1(d.rain) + ' mm' : ''}</small>
            <span style="flex:1;position:relative;height:10px;background:var(--line);border-radius:99px"><i style="position:absolute;left:${l}%;width:${Math.max(6, r - l)}%;top:0;bottom:0;border-radius:99px;background:linear-gradient(90deg,#38bdf8,#f97316)"></i></span><span style="width:4.4rem;text-align:right"><b>${temp(d.max)}</b> <small>${temp(d.min)}</small></span></div>
            ${open === i ? `<div style="padding:.5rem 0 .2rem 3.4rem;font-size:.92rem"><b>${esc(W.DAGEN_LANG[d.wd])}: ${esc(inf.text)}</b><br>${icon('sun', { size: 16 })} ${W.hhmm(d.sunrise, st.off)} tot ${W.hhmm(d.sunset, st.off)}${d.sunHours != null ? ` · zon ${f1(d.sunHours)} uur` : ''}<br>${icon('rain', { size: 16 })} ${f1(d.rain)} mm · kans ${d.pop}%<br>Wind tot ${Math.round(d.wind)} km/u (vlagen ${Math.round(d.gust)}) · UV ${Math.round(d.uv * 10) / 10} (${W.uvInfo(d.uv).level})</div>` : ''}</div>`; }).join('')}</div>`;
      b.querySelectorAll('[data-act]').forEach((x) => { x.onclick = () => { act = x.dataset.act; draw(); }; });
      b.querySelectorAll('[data-day]').forEach((x) => { x.onclick = () => { open = open === +x.dataset.day ? -1 : +x.dataset.day; draw(); }; });
    };
    draw();
  }

  /* ----- Zon en maan ----- */
  function tabZon(b) {
    const now = nowMs(), d0 = st.days[0], d1 = st.days[1], moon = W.moonPhase(new Date()), nf = W.nextFullMoon(new Date());
    const diff = d0 && d1 && d0.daylight && d1.daylight ? Math.round((d1.daylight - d0.daylight) / 60) : null;
    b.innerHTML = `<div class="tu-card"><b>${icon('sun', { size: 26 })} Vandaag</b>${sunArc(d0, now)}${diff != null ? `<p style="margin:.5rem 0 0">Morgen is het ${Math.abs(diff)} ${Math.abs(diff) === 1 ? 'minuut' : 'minuten'} ${diff >= 0 ? 'langer' : 'korter'} licht.</p>` : ''}
        <p style="margin:.3rem 0 0"><small>Gouden uur (mooi licht voor foto's): vanaf ${W.hhmm(d0.sunset - 3600e3, st.off)}.</small></p></div>
      <div class="tu-card"><b>${icon('moon', { size: 26 })} De maan</b><div class="tu-row" style="margin-top:.5rem;flex-wrap:nowrap"><canvas data-moon width="120" height="120" style="width:96px;height:96px;flex:none"></canvas><div><div style="font-size:1.3rem;font-weight:800">${esc(moon.name)}</div><div>${Math.round(moon.illum * 100)}% verlicht</div>${nf ? `<small>Volgende volle maan rond ${nf.getDate()}/${nf.getMonth() + 1}</small>` : ''}</div></div></div>
      <div class="tu-card"><b>Zon per dag</b>${st.days.slice(0, 7).map((d, i) => `<div class="tu-row" style="justify-content:space-between;border-top:${i ? '1px solid var(--line)' : '0'};padding:.35rem 0"><span style="width:5.5rem">${i === 0 ? 'Vandaag' : W.DAGEN_LANG[d.wd]}</span><span>${W.hhmm(d.sunrise, st.off)} – ${W.hhmm(d.sunset, st.off)}</span><small>${d.daylight ? W.dayLength(d.daylight) : ''}</small></div>`).join('')}</div>`;
    const mc = b.querySelector('[data-moon]'), c2 = mc.getContext('2d');
    if (c2 && c2.arc) {
      const R = 54, cx = 60, cy = 60; c2.fillStyle = '#1e293b'; c2.beginPath(); c2.arc(cx, cy, R, 0, Math.PI * 2); c2.fill();
      const p = moon.phase, k = Math.cos(p * 2 * Math.PI); c2.fillStyle = '#fef9c3';
      const waxing = p < 0.5; c2.beginPath(); c2.arc(cx, cy, R, -Math.PI / 2, Math.PI / 2, !waxing); c2.ellipse(cx, cy, Math.abs(k) * R, R, 0, Math.PI / 2, -Math.PI / 2, waxing ? k > 0 : k < 0); c2.fill();
    }
  }

  /* ----- Regenradar ----- */
  function tabRadar(b) {
    const rs = W.rainSummary(st.rain15, nowMs()), mx = Math.max(0.5, ...st.rain15.map((r) => r.mm));
    const link = (href, ic, t, d) => `<a class="tu-card" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${icon(ic, { size: 52 })}<span style="flex:1"><b>${esc(t)}</b><br><small>${esc(d)}</small></span><span class="tu-chip">Open ↗</span></a>`;
    b.innerHTML = `<div class="tu-card"><b>${icon('rain', { size: 26 })} Regen de komende 2 uur</b><div style="display:flex;align-items:flex-end;gap:5px;height:90px;margin:.6rem 0 .2rem">${st.rain15.map((r) => `<div style="flex:1;text-align:center"><div style="height:${Math.round(70 * r.mm / mx)}px;min-height:${r.mm > 0 ? 3 : 1}px;background:#0ea5e9;border-radius:5px 5px 0 0"></div><small style="font-size:.7rem">${W.hhmm(r.t, st.off)}</small></div>`).join('')}</div><p style="margin:.3rem 0 0"><b>${esc(rs.text)}</b></p></div>
      ${link('https://www.buienradar.nl/', 'map', 'Buienradar', 'De bekende regenradar voor Nederland en België.')}
      ${link(`https://www.windy.com/?rain,${loc.lat.toFixed(2)},${loc.lon.toFixed(2)},8`, 'earth', 'Windy: regen en wind', 'Een wereldkaart met regen, wind en wolken. Ook voor jouw plaats.')}
      ${link('https://www.knmi.nl/nederland-nu/weer/waarschuwingen', 'bell', 'KNMI waarschuwingen', 'Code geel, oranje of rood? Kijk of er een weerwaarschuwing is.')}
      <div class="tu-card"><b>Hoe werkt een regenradar?</b><br><small>Een radar stuurt radiogolven de lucht in. Regendruppels kaatsen een deel terug. Hoe sterker de echo, hoe harder het regent. De kaart toont die echo's in blauw (licht) tot rood en paars (heel veel regen).</small></div>
      <small style="display:block;text-align:center;opacity:.6">Deze links openen een andere website.</small>`;
  }

  /* ----- Leren ----- */
  function tabLeren(b) {
    const cur = W.bft(st.current.wind);
    b.innerHTML = `<div class="tu-card"><b>${icon('trophy', { size: 26 })} Weer-quiz</b><div data-quiz style="margin-top:.5rem"></div></div>
      <div class="tu-card"><b>${icon('cloud', { size: 26 })} Windkracht (Beaufort)</b><p><small>Nu waait het windkracht <b>${cur}</b>.</small></p>${W.BEAUFORT.map((x) => `<div style="padding:.4rem .5rem;border-radius:12px;margin:.2rem 0;${x.n === cur ? 'background:var(--accent);color:#fff' : ''}"><b>${x.n} · ${esc(x.name)}</b> <small>${x.max === Infinity ? 'meer dan 117' : 'tot ' + x.max} km/u</small><br><small>${esc(x.land)}</small></div>`).join('')}</div>
      <div class="tu-card"><b>${icon('cloud', { size: 26 })} Soorten wolken</b>${W.CLOUDS.map((c) => `<div class="tu-row" style="margin:.5rem 0;flex-wrap:nowrap">${icon(c.icon, { size: 44 })}<span><b>${esc(c.name)}</b><br><small>${esc(c.desc)} (${esc(c.height)})</small></span></div>`).join('')}</div>
      <div class="tu-card"><b>${icon('sun', { size: 26 })} UV-index</b>${[1, 4, 7, 9, 12].map((u) => { const i = W.uvInfo(u); return `<div class="tu-row" style="margin:.3rem 0;flex-wrap:nowrap"><span style="background:${i.color};color:#fff;border-radius:10px;padding:.2rem .6rem;min-width:6.5rem;text-align:center;font-weight:700">${i.level}</span><small>${esc(i.advice)}</small></div>`; }).join('')}</div>`;
    let i = 0, right = 0;
    const qz = b.querySelector('[data-quiz]');
    const next = () => {
      if (i >= 8) { const best = store.get().quiz.best; if (right > best) store.update((d) => { d.quiz.best = right; }); qz.innerHTML = `<div style="text-align:center"><h3>${right} van 8 goed</h3><small>Beste score: ${Math.max(best, right)}</small><br><button class="tu-big pri" data-again>Nog een keer</button></div>`; qz.querySelector('[data-again]').onclick = () => { i = 0; right = 0; next(); }; if (right === 8) playScene(document.body, 'victory', { title: 'Weerkenner!', sub: 'Alles goed' }); return; }
      const q = W.makeWeatherQuiz();
      qz.innerHTML = `<span class="tu-chip">${i + 1} van 8</span><p style="font-weight:700;margin:.5rem 0">${esc(q.q)}</p><div data-fb style="min-height:1.4rem;font-weight:700"></div><div style="display:grid;grid-template-columns:1fr;gap:.45rem">${q.choices.map((c) => `<button class="tu-big" data-c="${esc(c)}" style="text-align:left;font-size:.95rem">${esc(c)}</button>`).join('')}</div>`;
      qz.querySelectorAll('[data-c]').forEach((x) => { x.onclick = () => { if (x.disabled) return; const ok = x.dataset.c === q.answer; if (ok) right++; qz.querySelector('[data-fb]').innerHTML = ok ? '<span class="tu-ok">Goed!</span>' : `<span class="tu-bad">Het antwoord: ${esc(q.answer)}</span>`; qz.querySelectorAll('[data-c]').forEach((y) => { y.disabled = true; }); i++; const t = setTimeout(next, ok ? 800 : 2000); track(() => clearTimeout(t)); }; });
    };
    next();
  }

  /* ----- Plaatsen ----- */
  function tabPlaatsen(b) {
    const pl = store.get().places, w = store.get().world;
    b.innerHTML = `<div class="tu-card"><b>Mijn plaatsen</b>${pl.length ? '' : '<p><small>Nog geen plaatsen bewaard. Zoek er hieronder een.</small></p>'}${pl.map((p, i) => `<div class="tu-row" style="border-top:1px solid var(--line);padding:.4rem 0;flex-wrap:nowrap"><span style="flex:1">${icon('map', { size: 26 })} <b>${esc(p.name)}</b></span><button class="tu-big pri" style="min-height:44px" data-go="${i}">Bekijk</button><button data-rm="${i}" aria-label="Verwijder" style="min-width:44px;min-height:44px">✕</button></div>`).join('')}</div>
      ${placesCard()}
      <div class="tu-card tu-row"><span>${icon('globe', { size: 28 })} Achtergrond bij Nu:</span><select data-world class="tu-inp" style="flex:1;min-width:8rem"><option value="">Weer van nu</option>${Themes.list.map((x) => `<option value="${x.id}" ${w === x.id ? 'selected' : ''}>${x.emoji} ${esc(x.name)}</option>`).join('')}</select></div>`;
    b.querySelectorAll('[data-go]').forEach((x) => { x.onclick = () => { const p = pl[+x.dataset.go]; setLoc({ name: p.name, lat: p.lat, lon: p.lon }, false); }; });
    b.querySelectorAll('[data-rm]').forEach((x) => { x.onclick = () => { store.update((d) => { d.places.splice(+x.dataset.rm, 1); }); renderChips(); tabPlaatsen(b); }; });
    b.querySelector('[data-world]').onchange = (e) => { store.update((d) => { d.world = e.target.value; }); };
    bindSearch(b);
  }

  if (loc && !store.get().places.some((p) => Math.abs(p.lat - loc.lat) < 0.02 && Math.abs(p.lon - loc.lon) < 0.02)) store.update((d) => { d.places.unshift({ name: loc.name, lat: loc.lat, lon: loc.lon }); });
  clearInterval(refreshTimer); refreshTimer = setInterval(() => { if (loc && alive) load(false); }, 10 * 60e3);
  await load();
}
