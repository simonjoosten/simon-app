// Kompas: locatie (GPS, hoogte, luchtdruk), opgeslagen plekken, schatzoek-spel en oefenen.
// Alle functies: (body, S, api) waarbij S de gedeelde sensor-toestand is (zie kompas.js).
import * as K from './kompas-core.js?v=1';
import { playScene } from './tools-ui.js?v=1';

const newId = () => Math.random().toString(36).slice(2, 9);
const arrow = (deg) => `<div style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;flex:none"><svg viewBox="-20 -20 40 40" width="52" height="52" style="transform:rotate(${deg}deg);transition:transform .25s"><path d="M0,-17 L11,12 L0,6 L-11,12 Z" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.5" stroke-linejoin="round"/></svg></div>`;
/** Hoek waarmee een pijl naar `brg` moet draaien (ten opzichte van de bovenkant van het scherm). */
const relAngle = (S, brg) => (S.heading != null ? K.norm360(brg - S.heading) : brg);

/* =====================================================================
   LOCATIE
   ===================================================================== */
export function locatieTab(b, S, api) {
  const { esc, icon } = api;
  if (!S.gps.on && !S.consent()) {
    b.innerHTML = `<div class="tu-card">${icon('map', { size: 72 })}<h3 style="margin:.2rem 0">Waar ben je?</h3>
      <p>Om je plek, hoogte en snelheid te laten zien, vraagt deze app je toestel om je <b>locatie</b>.</p>
      <ul style="padding-left:1.2rem"><li>Je locatie wordt alleen op dit toestel gebruikt.</li><li>De app slaat alleen de plekken op die jij zelf bewaart.</li><li>Je kunt stoppen wanneer je wilt.</li></ul>
      <p><small>Je toestel vraagt daarna zelf nog om toestemming. Ben je jonger dan 16? Vraag het even aan een volwassene.</small></p>
      <button class="tu-big pri" data-yes>Ja, gebruik mijn locatie</button> <button class="tu-big" data-no>Liever niet</button><div class="err" data-msg style="margin-top:.4rem"></div></div>`;
    b.querySelector('[data-yes]').onclick = () => { S.giveConsent(); locatieTab(b, S, api); };
    b.querySelector('[data-no]').onclick = () => S.go('kompas');
    return;
  }
  S.startGps();
  const st = S.store;
  b.innerHTML = `<div class="tu-card" data-live></div>
    <div class="tu-card"><b>${icon('flag', { size: 26 })} Plek bewaren</b><div class="tu-row" style="margin-top:.4rem"><input data-name class="tu-inp" placeholder="Naam (bijv. Boomhut)" maxlength="30" style="flex:1;min-width:8rem"><button class="tu-big pri" data-save>Bewaar</button></div><div data-smsg class="tu-ok" style="margin-top:.3rem"></div></div>
    <div class="tu-card"><b>${icon('cloud', { size: 26 })} Luchtdruk en hoogte</b><div data-press style="margin:.4rem 0"></div><button class="tu-big" data-getp>Luchtdruk ophalen</button><p><small>Deze telefoon heeft geen luchtdrukmeter die de browser mag gebruiken. Met de knop haalt de app de luchtdruk op bij Open-Meteo (gratis weerdienst). Daarvoor wordt je locatie, afgerond op ongeveer 1 kilometer, naar open-meteo.com gestuurd.</small></p></div>
    <div class="tu-row" style="justify-content:center"><button class="tu-big" data-copy>Kopieer coördinaten</button><button class="tu-big" data-stop>Stop locatie</button></div>`;
  const live = b.querySelector('[data-live]');
  const paint = () => {
    const p = S.gps.pos;
    if (!p) { live.innerHTML = `<div style="text-align:center">${icon('map', { size: 56 })}<div>${S.gps.error ? `<span class="err">${esc(S.gps.error)}</span>` : 'Locatie zoeken… Ga zo mogelijk naar buiten.'}</div></div>`; return; }
    const sun = K.sunPosition(new Date(), p.lat, p.lon), q = p.acc <= 10 ? ['Heel nauwkeurig', '#16a34a'] : p.acc <= 30 ? ['Goed', '#65a30d'] : p.acc <= 100 ? ['Matig', '#f59e0b'] : ['Onnauwkeurig', '#dc2626'];
    live.innerHTML = `<div style="text-align:center"><div style="font-size:1.35rem;font-weight:800">${esc(K.dms(p.lat, true))}<br>${esc(K.dms(p.lon, false))}</div><div style="opacity:.8">${esc(K.fmtCoord(p.lat, p.lon))}</div>
      <div class="tu-chip" style="background:${q[1]};color:#fff;margin:.4rem 0">${q[0]} (±${Math.round(p.acc)} m)</div></div>
      <div class="tu-grid" style="margin-top:.5rem"><div class="tu-tile">${icon('tower', { size: 40 })}<span>${p.alt != null ? Math.round(p.alt) + ' m' : '–'}</span><small>hoogte (GPS)${p.altAcc != null ? ' ±' + Math.round(p.altAcc) : ''}</small></div>
        <div class="tu-tile">${icon('car', { size: 40 })}<span>${p.speed != null && p.speed >= 0 ? (p.speed * 3.6).toFixed(1).replace('.', ',') + ' km/u' : '–'}</span><small>snelheid</small></div>
        <div class="tu-tile">${icon('compass', { size: 40 })}<span>${p.heading != null && !Number.isNaN(p.heading) ? Math.round(p.heading) + '° ' + K.dir(p.heading) : '–'}</span><small>looprichting (GPS)</small></div>
        <div class="tu-tile">${icon(sun.altitude > 0 ? 'sun' : 'moon', { size: 40 })}<span>${sun.altitude > 0 ? K.dir(sun.azimuth) + ', ' + Math.round(sun.altitude) + '° hoog' : 'onder de horizon'}</span><small>de zon</small></div></div>`;
  };
  paint();
  const iv = setInterval(paint, 1000); S.track(() => clearInterval(iv));
  b.querySelector('[data-save]').onclick = () => {
    const p = S.gps.pos, msg = b.querySelector('[data-smsg]'); if (!p) { msg.className = 'err'; msg.textContent = 'Wacht tot je locatie bekend is.'; return; }
    const name = b.querySelector('[data-name]').value.trim() || `Plek ${st.get().places.length + 1}`;
    st.update((d) => { d.places.unshift({ id: newId(), name, lat: p.lat, lon: p.lon, alt: p.alt, ts: Date.now() }); d.places = d.places.slice(0, 40); });
    msg.className = 'tu-ok'; msg.textContent = `"${name}" is bewaard bij Plekken.`; b.querySelector('[data-name]').value = '';
  };
  const pb = b.querySelector('[data-press]');
  const showP = () => {
    if (!S.pressure) { pb.innerHTML = '<small>Nog niet opgehaald.</small>'; return; }
    const p = S.pressure, ga = S.gps.pos && S.gps.pos.alt != null ? Math.round(S.gps.pos.alt) : null;
    pb.innerHTML = `<div style="font-size:1.6rem;font-weight:800">${p.surface.toFixed(1).replace('.', ',')} hPa</div><div>Op zeeniveau: ${p.msl.toFixed(1).replace('.', ',')} hPa, ${esc(K.pressureWord(p.msl))}</div><div>Hoogte uit luchtdruk: ongeveer <b>${Math.round(K.altitudeFromPressure(p.surface, p.msl))} m</b>${ga != null ? ` (GPS zegt ${ga} m)` : ''}</div>`;
  };
  showP();
  b.querySelector('[data-getp]').onclick = async () => {
    const p = S.gps.pos; if (!p) { pb.innerHTML = '<span class="err">Wacht tot je locatie bekend is.</span>'; return; }
    pb.innerHTML = '<small>Ophalen…</small>';
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat.toFixed(2)}&longitude=${p.lon.toFixed(2)}&current=surface_pressure,pressure_msl`); if (!r.ok) throw new Error('http');
      const j = await r.json(); if (!j.current || j.current.surface_pressure == null) throw new Error('data');
      S.pressure = { surface: j.current.surface_pressure, msl: j.current.pressure_msl }; showP();
    } catch { pb.innerHTML = '<span class="err">Ophalen lukt niet. Heb je internet?</span>'; }
  };
  b.querySelector('[data-copy]').onclick = async () => { const p = S.gps.pos; if (!p) return; try { await navigator.clipboard.writeText(K.fmtCoord(p.lat, p.lon)); b.querySelector('[data-smsg]').textContent = 'Gekopieerd!'; } catch { b.querySelector('[data-smsg]').textContent = K.fmtCoord(p.lat, p.lon); } };
  b.querySelector('[data-stop]').onclick = () => { S.stopGps(); try { localStorage.removeItem('kompas:consent'); } catch { /* stil */ } locatieTab(b, S, api); };
}

/* =====================================================================
   PLEKKEN
   ===================================================================== */
export function plekkenTab(b, S, api) {
  const { esc, icon } = api, st = S.store;
  if (!S.gps.on && S.consent()) S.startGps();
  const draw = () => {
    const pl = st.get().places, tg = st.get().target;
    b.innerHTML = `<div class="tu-card"><b>${icon('flag', { size: 26 })} Mijn plekken</b>${pl.length ? '' : '<p><small>Nog geen plekken. Bewaar er een bij Locatie, of voeg er hieronder een toe.</small></p>'}
      ${pl.map((p) => `<div class="tu-row" style="border-top:1px solid var(--line);padding:.6rem 0;flex-wrap:nowrap"><span data-arr="${p.id}">${arrow(0)}</span><span style="flex:1;min-width:0"><b>${esc(p.name)}</b>${tg && tg.id === p.id ? ' <span class="tu-chip">doel</span>' : ''}<br><small data-dist="${p.id}">${esc(K.fmtCoord(p.lat, p.lon))}</small></span>
        <button class="tu-big pri" data-nav="${p.id}" style="min-height:44px;padding:.2rem .7rem">Ga</button><button data-code="${p.id}" style="min-width:44px;min-height:44px">Code</button><button data-rm="${p.id}" aria-label="Verwijder" style="min-width:44px;min-height:44px">✕</button></div>`).join('')}</div>
      <div class="tu-card"><b>Plek toevoegen</b><p><small>Typ coördinaten (bijv. 52,3702 4,8952) of een schatcode van een vriend.</small></p><input data-name class="tu-inp" placeholder="Naam" maxlength="30" style="margin-bottom:.4rem"><input data-in class="tu-inp" placeholder="Coördinaten of code (ABCD-EFGH-JKMN)"><button class="tu-big pri" data-add style="margin-top:.5rem">Toevoegen</button><div data-msg class="err" style="margin-top:.3rem"></div></div>
      ${!S.gps.on ? `<div class="tu-card"><small>Zet bij Locatie je GPS aan om afstand en richting naar je plekken te zien.</small></div>` : ''}`;
    b.querySelectorAll('[data-nav]').forEach((x) => { x.onclick = () => { const p = pl.find((q) => q.id === x.dataset.nav); st.update((d) => { d.target = { id: p.id, name: p.name, lat: p.lat, lon: p.lon }; }); S.go('kompas'); }; });
    b.querySelectorAll('[data-rm]').forEach((x) => { x.onclick = () => { st.update((d) => { d.places = d.places.filter((q) => q.id !== x.dataset.rm); if (d.target && d.target.id === x.dataset.rm) d.target = null; }); draw(); }; });
    b.querySelectorAll('[data-code]').forEach((x) => { x.onclick = () => { const p = pl.find((q) => q.id === x.dataset.code), c = K.encodeSpot(p.lat, p.lon); const el = b.querySelector(`[data-dist="${p.id}"]`); el.innerHTML = `Code: <b>${c}</b>`; }; });
    b.querySelector('[data-add]').onclick = () => {
      const v = b.querySelector('[data-in]').value, msg = b.querySelector('[data-msg]'); const pos = K.decodeSpot(v) || K.parseCoord(v);
      if (!pos) { msg.textContent = 'Dat lijkt geen coördinaten of schatcode. Probeer: 52,3702 4,8952'; return; }
      const name = b.querySelector('[data-name]').value.trim() || `Plek ${pl.length + 1}`;
      st.update((d) => { d.places.unshift({ id: newId(), name, lat: pos.lat, lon: pos.lon, alt: null, ts: Date.now() }); d.places = d.places.slice(0, 40); }); draw();
    };
  };
  draw();
  const iv = setInterval(() => {
    const p = S.gps.pos; if (!p) return;
    for (const pl of st.get().places) {
      const brg = K.bearing(p.lat, p.lon, pl.lat, pl.lon), d = K.distance(p.lat, p.lon, pl.lat, pl.lon);
      const a = b.querySelector(`[data-arr="${pl.id}"]`), t = b.querySelector(`[data-dist="${pl.id}"]`);
      if (a) a.innerHTML = arrow(relAngle(S, brg)); if (t && !/Code:/.test(t.textContent)) t.textContent = `${K.fmtDist(d)} naar het ${K.dirName(brg).toLowerCase()}`;
    }
  }, 600); S.track(() => clearInterval(iv));
}

/* =====================================================================
   SCHATZOEKEN
   ===================================================================== */
export function schatTab(b, S, api) {
  const { esc, icon } = api, st = S.store;
  let hunt = null;
  if (!S.gps.on && S.consent()) S.startGps();

  function menu() {
    const d = st.get();
    b.innerHTML = `<div class="tu-card" style="text-align:center">${icon('chest', { size: 84 })}<h2 style="margin:.2rem 0">Schatzoeken</h2><p>Er liggen drie schatten verstopt. Loop erheen met je kompas en GPS. De afstand laat zien of je warm of koud bent!</p><div class="tu-row" style="justify-content:center"><span class="tu-chip">${icon('coin', { size: 22 })} ${d.coins}</span><span class="tu-chip">${icon('chest', { size: 22 })} ${d.found} gevonden</span></div></div>
      <div class="tu-card"><b>Veiligheid eerst</b><br><small>Speel op veilige plekken (park, speelveld, rustige straat). Kijk uit voor verkeer en water, ga niet alleen ver weg en vraag een volwassene bij een lange tocht. De schatten liggen alleen in de buurt, niet op een bepaalde plek: kijk dus altijd of je er veilig kunt komen.</small></div>
      <h3 style="margin:.6rem 0 .2rem">Echte jacht (met GPS)</h3>
      ${K.HUNT_LEVELS.map((l) => `<button class="tu-card" data-lv="${l.id}" style="display:flex;align-items:center;gap:.8rem;width:100%;text-align:left">${icon(['map', 'compass', 'rocket'][l.id - 1], { size: 52 })}<span style="flex:1"><b>${l.name}</b><br><small>${l.desc} (${l.min} tot ${l.max} m per schat)</small></span></button>`).join('')}
      <h3 style="margin:.6rem 0 .2rem">Binnen spelen (zonder GPS)</h3>
      <button class="tu-card" data-virtual style="display:flex;align-items:center;gap:.8rem;width:100%;text-align:left">${icon('tent', { size: 52 })}<span style="flex:1"><b>Virtuele wandeling</b><br><small>Loop met de pijlknoppen over een denkbeeldige kaart. Handig thuis of in de klas.</small></span></button>
      <h3 style="margin:.6rem 0 .2rem">Met een vriend</h3>
      <div class="tu-card"><p style="margin-top:0"><small>Verstop een schat op je plek en deel de code. Je vriend voert de code in en gaat zoeken.</small></p>
        <div class="tu-row"><button class="tu-big" data-hide>Verstop schat hier</button></div><div data-hidemsg style="margin:.4rem 0;font-weight:700"></div>
        <div class="tu-row"><input data-code class="tu-inp" placeholder="Code van je vriend" style="flex:1;min-width:8rem"><button class="tu-big pri" data-friend>Zoek!</button></div><div class="err" data-msg style="margin-top:.3rem"></div></div>`;
    b.querySelectorAll('[data-lv]').forEach((x) => { x.onclick = () => startGps(+x.dataset.lv); });
    b.querySelector('[data-virtual]').onclick = () => startVirtual(1);
    b.querySelector('[data-hide]').onclick = () => {
      const m = b.querySelector('[data-hidemsg]'); if (!S.gps.pos) { m.innerHTML = '<span class="err">Zet eerst bij Locatie je GPS aan en wacht tot je plek bekend is.</span>'; return; }
      m.innerHTML = `Code: <span class="code" style="font:700 1.3rem ui-monospace,monospace;letter-spacing:.06em">${K.encodeSpot(S.gps.pos.lat, S.gps.pos.lon)}</span><br><small>Geef deze code aan je vriend.</small>`;
    };
    b.querySelector('[data-friend]').onclick = () => { const t = K.decodeSpot(b.querySelector('[data-code]').value); if (!t) { b.querySelector('[data-msg]').textContent = 'Die code klopt niet. Controleer hem nog eens.'; return; } startFriend(t); };
  }

  function startGps(level) {
    if (!S.gps.on) { S.giveConsent(); S.startGps(); }
    hunt = { mode: 'gps', level, idx: 0, total: 3, found: 0, target: null, startDist: 0, hint: false, waiting: true };
    play();
  }
  function startVirtual(level) {
    const pos = Object.assign({}, K.VIRTUAL_START, { acc: 5 });
    hunt = { mode: 'virtual', level, idx: 0, total: 3, found: 0, vpos: pos, target: null, startDist: 0, hint: false };
    hunt.target = K.makeTreasure(pos, 1); hunt.startDist = K.distance(pos.lat, pos.lon, hunt.target.lat, hunt.target.lon);
    play();
  }
  function startFriend(t) { hunt = { mode: 'friend', level: 1, idx: 0, total: 1, found: 0, target: t, startDist: 0, hint: false, waiting: true }; play(); }

  const curPos = () => (hunt.mode === 'virtual' ? hunt.vpos : S.gps.pos);

  function play() {
    const virt = hunt.mode === 'virtual';
    b.innerHTML = `<div class="tu-card" style="text-align:center"><div class="tu-row" style="justify-content:space-between"><button class="tu-big" data-quit style="min-height:44px">Stoppen</button><span data-dots></span></div>
      <div data-body style="margin:.6rem 0"></div></div>
      ${virt ? `<div class="tu-card"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem;max-width:300px;margin:auto"><span></span><button class="tu-big" data-mv="0" aria-label="Noord">▲ N</button><span></span><button class="tu-big" data-mv="270" aria-label="West">◀ W</button><span class="tu-chip" style="justify-content:center">10 m</span><button class="tu-big" data-mv="90" aria-label="Oost">O ▶</button><span></span><button class="tu-big" data-mv="180" aria-label="Zuid">▼ Z</button><span></span></div><p style="text-align:center;margin:.5rem 0 0"><small>Elke stap is 10 meter.</small></p></div>` : ''}`;
    b.querySelector('[data-quit]').onclick = () => { hunt = null; menu(); };
    b.querySelectorAll('[data-mv]').forEach((x) => { x.onclick = () => { if (!hunt) return; hunt.vpos = K.stepVirtual(hunt.vpos, +x.dataset.mv, 10); paint(); }; });
    paint();
  }

  const dots = () => Array.from({ length: hunt.total }, (_, i) => `<span style="opacity:${i < hunt.found ? 1 : 0.28}">${icon('chest', { size: 30 })}</span>`).join('');
  function paint() {
    if (!hunt || !b.querySelector('[data-body]')) return;
    const bodyEl = b.querySelector('[data-body]'); b.querySelector('[data-dots]').innerHTML = dots();
    const pos = curPos();
    if (!pos) { bodyEl.innerHTML = `${icon('map', { size: 64 })}<p>${S.gps.error ? `<span class="err">${esc(S.gps.error)}</span>` : 'Wachten op je locatie… Ga naar buiten voor het beste signaal.'}</p>`; return; }
    if (!hunt.target) { hunt.target = K.makeTreasure(pos, hunt.level); hunt.startDist = K.distance(pos.lat, pos.lon, hunt.target.lat, hunt.target.lon); }
    if (hunt.waiting) { hunt.waiting = false; if (hunt.mode === 'friend') hunt.startDist = K.distance(pos.lat, pos.lon, hunt.target.lat, hunt.target.lon); }
    const d = K.distance(pos.lat, pos.lon, hunt.target.lat, hunt.target.lon), brg = K.bearing(pos.lat, pos.lon, hunt.target.lat, hunt.target.lon), hc = K.hotCold(d, Math.max(hunt.startDist, 60));
    if (d <= K.foundRadius(pos.acc)) return found();
    bodyEl.innerHTML = `<div style="color:${hc.color};font-size:calc(2rem * var(--gfx-font,1));font-weight:800">${icon(hc.icon, { size: 52 })} ${hc.text}</div>
      <div class="tu-row" style="justify-content:center;gap:1rem"><div style="transform:scale(1.5);margin:.5rem 1rem">${arrow(relAngle(S, brg))}</div><div style="text-align:left"><div style="font-size:2.4rem;font-weight:800">${K.fmtDist(d)}</div><div>richting ${esc(K.dirName(brg))}</div></div></div>
      <div class="tu-bar" style="margin:.5rem 0"><i style="width:${Math.round(100 * (1 - Math.min(1, d / Math.max(hunt.startDist, 60))))}%;background:${hc.color}"></i></div>
      <div style="min-height:1.5rem">${hunt.hint ? esc(K.clueText(hunt.target, pos)) : '<button class="tu-big" data-hint style="min-height:44px">Geef een hint</button>'}</div>
      <small>${hunt.mode === 'virtual' ? 'Denkbeeldige kaart' : `GPS-nauwkeurigheid ±${Math.round(pos.acc || 0)} m`}${S.heading == null && hunt.mode !== 'virtual' ? ' · zonder kompas wijst de pijl naar het noorden' : ''}</small>`;
    const h = b.querySelector('[data-hint]'); if (h) h.onclick = () => { hunt.hint = true; paint(); };
  }
  function found() {
    const lv = hunt.level; hunt.found++; hunt.idx++;
    const last = hunt.found >= hunt.total;
    const reward = K.huntReward(lv, 1);
    st.update((d) => { d.coins += reward; d.found++; if (last) d.hunts++; });
    if (last) {
      const bonus = 10 * lv; st.update((d) => { d.coins += bonus; });
      const h = hunt; hunt = null;
      b.innerHTML = `<div class="tu-card" style="text-align:center">${icon('trophy', { size: 90 })}<h2>Alle schatten gevonden!</h2><p>Je kreeg ${reward + bonus} munten bij deze laatste schat.</p><button class="tu-big pri" data-ok>Terug naar het menu</button></div>`;
      b.querySelector('[data-ok]').onclick = menu; playScene(document.body, 'victory', { title: 'Schatzoeker!', sub: `${h.total} schatten gevonden` });
      return;
    }
    const pos = curPos(); hunt.target = K.makeTreasure(pos, hunt.level); hunt.startDist = K.distance(pos.lat, pos.lon, hunt.target.lat, hunt.target.lon); hunt.hint = false;
    playScene(document.body, 'chest-open', { title: 'Schat gevonden!', sub: `+${reward} munten`, icon: 'chest' });
    paint();
  }
  const iv = setInterval(() => { if (hunt && b.isConnected !== false) paint(); }, 800); S.track(() => clearInterval(iv));
  S.track(() => { hunt = null; });
  menu();
}

/* =====================================================================
   OEFENEN
   ===================================================================== */
export function oefenTab(b, S, api) {
  const { esc, icon } = api, st = S.store;
  function menu() {
    const q = st.get().quiz;
    b.innerHTML = `<div class="tu-card" style="text-align:center">${icon('book', { size: 72 })}<h2 style="margin:.2rem 0">Oefenen met richtingen</h2><p>Leer de windstreken en graden uit je hoofd. Beste score: <b>${q.best}</b> van 10. Goed: ${q.right} van ${q.total}.</p></div>
      ${[[1, 'Hoofdwindstreken', 'Noord, Oost, Zuid en West'], [2, 'Alle windstreken', 'Ook Noordoost, Zuidwest en graden']].map(([l, n, d]) => `<button class="tu-card" data-q="${l}" style="display:flex;align-items:center;gap:.8rem;width:100%;text-align:left">${icon('compass', { size: 48 })}<span><b>Quiz: ${n}</b><br><small>${d}</small></span></button>`).join('')}
      <button class="tu-card" data-turn style="display:flex;align-items:center;gap:.8rem;width:100%;text-align:left">${icon('target', { size: 48 })}<span><b>Draai-uitdaging</b><br><small>Draai jezelf naar de gevraagde richting met je telefoon in de hand${S.listening ? '' : ' (zet eerst bij Kompas de sensor aan)'}.</small></span></button>`;
    b.querySelectorAll('[data-q]').forEach((x) => { x.onclick = () => quiz(+x.dataset.q); });
    b.querySelector('[data-turn]').onclick = () => (S.listening ? turn() : S.go('kompas'));
  }
  function quiz(level) {
    let i = 0, right = 0, q = null;
    const next = () => {
      if (i >= 10) { st.update((d) => { d.quiz.best = Math.max(d.quiz.best, right); }); b.innerHTML = `<div class="tu-card" style="text-align:center">${icon('trophy', { size: 80 })}<h2>${right} van 10 goed</h2><div class="tu-row" style="justify-content:center"><button class="tu-big pri" data-again>Nog een keer</button><button class="tu-big" data-menu>Menu</button></div></div>`; b.querySelector('[data-again]').onclick = () => quiz(level); b.querySelector('[data-menu]').onclick = menu; if (right === 10) playScene(document.body, 'victory', { title: 'Kompasmeester!', sub: 'Alles goed' }); return; }
      q = K.makeDirQuestion(level);
      b.innerHTML = `<div class="tu-card" style="text-align:center"><span class="tu-chip">${i + 1} van 10</span><p style="font-size:1.35rem;font-weight:800;margin:.6rem 0">${esc(q.q)}</p><div data-fb style="min-height:1.6rem;font-weight:700"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">${q.choices.map((c) => `<button class="tu-big" data-c="${esc(c)}" style="min-height:64px">${esc(c)}</button>`).join('')}</div><div style="margin-top:.6rem"><button class="tu-big" data-menu style="min-height:44px">Stoppen</button></div></div>`;
      b.querySelector('[data-menu]').onclick = menu;
      b.querySelectorAll('[data-c]').forEach((x) => { x.onclick = () => { if (x.disabled) return; const ok = x.dataset.c === q.answer; if (ok) right++; st.update((d) => { d.quiz.total++; if (ok) d.quiz.right++; }); b.querySelector('[data-fb]').innerHTML = ok ? '<span class="tu-ok">Goed!</span>' : `<span class="tu-bad">Het antwoord is ${esc(q.answer)}.</span>`; b.querySelectorAll('[data-c]').forEach((y) => { y.disabled = true; }); i++; const t = setTimeout(next, ok ? 700 : 1600); S.track(() => clearTimeout(t)); }; });
    };
    next();
  }
  function turn() {
    let round = 0, score = 0; const hold = {};
    const nextRound = () => {
      if (round >= 5) { b.innerHTML = `<div class="tu-card" style="text-align:center">${icon('trophy', { size: 80 })}<h2>Klaar!</h2><p>Je draaide ${score} van 5 richtingen goed.</p><button class="tu-big pri" data-menu>Menu</button></div>`; b.querySelector('[data-menu]').onclick = menu; if (score === 5) playScene(document.body, 'victory', { title: 'Draaikampioen!', sub: 'Vijf van vijf' }); return; }
      const [name, deg] = K.CARDINALS[Math.floor(Math.random() * 8)]; hold.since = 0; const t0 = Date.now(); let done = false;
      b.innerHTML = `<div class="tu-card" style="text-align:center"><span class="tu-chip">${round + 1} van 5</span><p style="font-size:1.5rem;font-weight:800;margin:.6rem 0">Draai naar het ${esc(name.toLowerCase())}</p><div data-arr style="transform:scale(1.8);margin:1.2rem"></div><div class="tu-bar"><i data-p style="width:0"></i></div><div data-t style="margin-top:.5rem"></div><button class="tu-big" data-menu style="margin-top:.6rem;min-height:44px">Stoppen</button></div>`;
      b.querySelector('[data-menu]').onclick = () => { done = true; menu(); };
      const iv = setInterval(() => {
        if (done || S.heading == null) return; const now = Date.now(), p = K.holdProgress(hold, S.heading, deg, now);
        b.querySelector('[data-arr]').innerHTML = arrow(K.angleDiff(S.heading, deg));
        b.querySelector('[data-p]').style.width = `${Math.round(p * 100)}%`; b.querySelector('[data-t]').textContent = `Je kijkt naar ${Math.round(S.heading)}° ${K.dir(S.heading)}`;
        if (p >= 1) { done = true; clearInterval(iv); score++; round++; nextRound(); } else if (now - t0 > 45000) { done = true; clearInterval(iv); round++; nextRound(); }
      }, 100);
      S.track(() => { done = true; clearInterval(iv); });
    };
    nextRound();
  }
  menu();
}
