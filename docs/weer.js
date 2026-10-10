// Weer-app: huidig weer, regenwaarschuwing, uur- en dagverwachting. Data van Open-Meteo (gratis, zonder sleutel).

const WMO = {
  0: ['☀️', 'Onbewolkt'], 1: ['🌤️', 'Overwegend zonnig'], 2: ['⛅', 'Half bewolkt'], 3: ['☁️', 'Bewolkt'],
  45: ['🌫️', 'Mist'], 48: ['🌫️', 'Rijpmist'],
  51: ['🌦️', 'Lichte motregen'], 53: ['🌦️', 'Motregen'], 55: ['🌧️', 'Zware motregen'], 56: ['🌧️', 'IJzel-motregen'], 57: ['🌧️', 'IJzel-motregen'],
  61: ['🌦️', 'Lichte regen'], 63: ['🌧️', 'Regen'], 65: ['🌧️', 'Zware regen'], 66: ['🌧️', 'IJzelregen'], 67: ['🌧️', 'IJzelregen'],
  71: ['🌨️', 'Lichte sneeuw'], 73: ['🌨️', 'Sneeuw'], 75: ['❄️', 'Zware sneeuw'], 77: ['🌨️', 'Korrelsneeuw'],
  80: ['🌦️', 'Lichte buien'], 81: ['🌧️', 'Buien'], 82: ['⛈️', 'Zware buien'], 85: ['🌨️', 'Sneeuwbuien'], 86: ['🌨️', 'Zware sneeuwbuien'],
  95: ['⛈️', 'Onweer'], 96: ['⛈️', 'Onweer met hagel'], 99: ['⛈️', 'Zwaar onweer met hagel'],
};
const wmo = (c, night) => (night && (c === 0 || c === 1) ? ['🌙', c === 0 ? 'Helder' : 'Overwegend helder'] : WMO[c] || ['🌡️', 'Onbekend']);
const DAGEN = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const bft = (kmh) => { const i = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117].findIndex((x) => kmh < x); return i < 0 ? 12 : i; };

// ctx: { view, esc, uid, addCleanup }
export async function weerView(ctx) {
  const { view, esc, uid, addCleanup } = ctx;
  const LOC_KEY = `weer:loc:${uid}`, CACHE_KEY = `weer:cache:${uid}`;
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  let loc = read(LOC_KEY); let data = null; let alive = true; let tickTimer = null, refreshTimer = null;
  addCleanup(() => { alive = false; clearInterval(tickTimer); clearInterval(refreshTimer); });

  const fetchWeather = async () => {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}`
      + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,is_day'
      + '&hourly=temperature_2m,precipitation_probability,precipitation,weather_code'
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset'
      + '&minutely_15=precipitation&forecast_minutely_15=8&timezone=auto&forecast_days=7&wind_speed_unit=kmh';
    const r = await fetch(u); if (!r.ok) throw new Error(`Weerdienst gaf fout ${r.status}`);
    return r.json();
  };

  const searchView = (msg = '') => {
    view.innerHTML = `<div class="box"><h3>🌦️ Waar ben je?</h3>
      <div class="row"><input id="wq" placeholder="Zoek een plaats (bijv. Utrecht)" autocomplete="off"><button class="pri" id="wgo">Zoek</button></div>
      <div class="row"><button id="wgeo" style="flex:1">📍 Gebruik mijn locatie</button></div>
      <div id="wres"></div><div id="wmsg" class="err">${esc(msg)}</div></div>`;
    const q = view.querySelector('#wq');
    const go = async () => {
      const name = q.value.trim(); if (!name) return;
      view.querySelector('#wres').innerHTML = '<small>Zoeken…</small>';
      try {
        const j = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=6&language=nl&format=json`)).json();
        const list = j.results || [];
        view.querySelector('#wres').innerHTML = list.length ? list.map((p, i) => `<div class="row"><span style="flex:1">${esc(p.name)} <small>${esc([p.admin1, p.country].filter(Boolean).join(', '))}</small></span><button class="pri" data-p="${i}">Kies</button></div>`).join('') : '<small>Niets gevonden.</small>';
        view.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => { const p = list[b.dataset.p]; setLoc({ name: p.name, lat: p.latitude, lon: p.longitude }); });
      } catch { view.querySelector('#wres').innerHTML = '<span class="err">Zoeken lukt niet. Heb je internet?</span>'; }
    };
    view.querySelector('#wgo').onclick = go; q.onkeydown = (e) => { if (e.key === 'Enter') go(); };
    view.querySelector('#wgeo').onclick = () => {
      view.querySelector('#wmsg').textContent = '';
      if (!navigator.geolocation) { view.querySelector('#wmsg').textContent = 'Locatie is niet beschikbaar in deze browser.'; return; }
      view.querySelector('#wres').innerHTML = '<small>Locatie ophalen… (geef toestemming als je browser erom vraagt)</small>';
      navigator.geolocation.getCurrentPosition((p) => setLoc({ name: 'Mijn locatie', lat: p.coords.latitude, lon: p.coords.longitude }),
        () => { view.querySelector('#wres').innerHTML = ''; view.querySelector('#wmsg').textContent = 'Locatie geweigerd. Zoek een plaats met de naam.'; }, { timeout: 15000, maximumAge: 600000 });
    };
  };
  const setLoc = (l) => { loc = l; write(LOC_KEY, l); write(CACHE_KEY, null); load(); };

  const render = () => {
    if (!alive || !data) return;
    const c = data.current, [em, txt] = wmo(c.weather_code, !c.is_day);
    // regenwaarschuwing uit de komende 2 uur (stappen van 15 minuten)
    const m = data.minutely_15, now = Date.now();
    let warn = '<div class="box" style="background:#064e3b;color:#fff">✅ Geen regen verwacht de komende 2 uur.</div>';
    if (m && m.time) {
      const idx = m.time.findIndex((t, i) => new Date(t).getTime() + 15 * 60e3 > now && (m.precipitation[i] || 0) >= 0.1);
      if (idx >= 0) {
        const at = new Date(m.time[idx]); const min = Math.round((at - now) / 60000);
        const hhmm = at.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
        warn = min <= 5 ? `<div class="box" style="background:#1e3a8a;color:#fff">🌧️ <b>Het regent nu of bijna.</b> (${(m.precipitation[idx]).toFixed(1)} mm)</div>`
          : `<div class="box" style="background:#1e3a8a;color:#fff">☔ <b>Het gaat regenen om ${hhmm}</b> (over ${min} min). Neem een jas of paraplu mee.</div>`;
      }
    }
    const hrs = data.hourly; const start = hrs.time.findIndex((t) => new Date(t).getTime() >= now - 3600e3);
    const dl = data.daily; const isNight = (t) => { const di = dl.time.indexOf(t.slice(0, 10)); return di >= 0 && (t < dl.sunrise[di] || t > dl.sunset[di]); };
    const hours = hrs.time.slice(start, start + 24).map((t, k) => { const i = start + k; const d = new Date(t); return `<div style="flex:none;text-align:center;min-width:3.4rem"><small>${k === 0 ? 'nu' : String(d.getHours()).padStart(2, '0') + 'u'}</small><div style="font-size:1.4rem">${wmo(hrs.weather_code[i], isNight(t))[0]}</div><b>${Math.round(hrs.temperature_2m[i])}°</b><br><small>${hrs.precipitation_probability[i] ?? 0}%</small></div>`; }).join('');
    const dly = data.daily; const tm = (s) => new Date(s).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    const days = dly.time.map((t, i) => { const d = new Date(t + 'T12:00'); return `<div class="row" style="justify-content:space-between;margin:.2rem 0"><span style="width:3rem">${i === 0 ? 'Nu' : DAGEN[d.getDay()]}</span><span style="font-size:1.3rem">${wmo(dly.weather_code[i])[0]}</span><small style="width:5rem;text-align:right;white-space:nowrap">${dly.precipitation_sum[i] > 0 ? '💧' + dly.precipitation_sum[i].toFixed(1) + ' mm' : ''}</small><span style="width:5.5rem;text-align:right"><b>${Math.round(dly.temperature_2m_max[i])}°</b> <small>${Math.round(dly.temperature_2m_min[i])}°</small></span></div>`; }).join('');
    view.innerHTML = `
      <div class="box center" style="padding:1.2rem;background:linear-gradient(160deg,${c.is_day ? '#38bdf8,#2563eb' : '#312e81,#0f172a'});color:#fff;border:0">
        <div style="display:flex;justify-content:space-between;align-items:center"><b>${esc(loc.name)}</b><button id="wchg" style="padding:.2rem .6rem;font-size:.8rem">Verander</button></div>
        <div style="font-size:3.6rem;line-height:1.1;margin-top:.4rem">${em} ${Math.round(c.temperature_2m)}°</div>
        <div style="font-size:1.1rem">${txt}</div>
        <small style="color:#fff;opacity:.85">Voelt als ${Math.round(c.apparent_temperature)}° · wind ${Math.round(c.wind_speed_10m)} km/u (${bft(c.wind_speed_10m)} Bft) · vocht ${c.relative_humidity_2m}%</small>
        <div style="margin-top:.5rem"><span id="wclock" style="font-size:1.2rem;font-weight:700"></span> <small style="color:#fff;opacity:.85" id="wdate"></small></div>
        <small style="color:#fff;opacity:.85">🌅 ${tm(dly.sunrise[0])} · 🌇 ${tm(dly.sunset[0])}</small>
      </div>
      ${warn}
      <div class="box"><b>Komende 24 uur</b><div style="display:flex;gap:.3rem;overflow-x:auto;padding:.5rem 0">${hours}</div></div>
      <div class="box"><b>7 dagen</b>${days}</div>
      <small style="display:block;text-align:center;opacity:.6;margin-bottom:1rem">Weerdata: Open-Meteo.com · ververst elke 10 minuten</small>`;
    view.querySelector('#wchg').onclick = () => searchView();
    const clock = () => { const el = view.querySelector('#wclock'); if (!el) return; const d = new Date(); el.textContent = d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: data.timezone }); view.querySelector('#wdate').textContent = d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: data.timezone }); };
    clock(); clearInterval(tickTimer); tickTimer = setInterval(clock, 1000);
  };

  async function load(showSpinner = true) {
    if (!loc) return searchView();
    if (showSpinner && !data) view.innerHTML = '<div class="box center"><small>Weer laden…</small></div>';
    try { data = await fetchWeather(); write(CACHE_KEY, { loc, data, at: Date.now() }); }
    catch (e) {
      const c = read(CACHE_KEY);
      if (c && c.loc && c.loc.name === loc.name) { data = c.data; render(); view.insertAdjacentHTML('afterbegin', '<div class="box err">Geen verbinding, dit is het laatste bekende weer.</div>'); return; }
      view.innerHTML = `<div class="box"><span class="err">Weer laden lukt niet: ${esc(e.message)}</span><div class="row"><button id="wr">Opnieuw</button><button id="wchg2">Andere plaats</button></div></div>`;
      view.querySelector('#wr').onclick = () => load(); view.querySelector('#wchg2').onclick = () => searchView(); return;
    }
    render();
  }
  clearInterval(refreshTimer); refreshTimer = setInterval(() => { if (loc && alive) load(false); }, 10 * 60e3);
  await load();
}
