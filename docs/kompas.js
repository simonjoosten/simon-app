// Kompas: 3D-kompas, waterpas, hoogtemeter, GPS-locatie met hoogte en luchtdruk, plekken opslaan,
// schatzoek-spel en richting-oefeningen. Entry-bestand: kompasView(ctx) met ctx = { view, esc, addCleanup } (uid/db mogen erbij).
// Locatie wordt alleen na jouw toestemming gebruikt en blijft op dit toestel; alleen plekken die je zelf bewaart worden opgeslagen.
import * as K from './kompas-core.js?v=1';
import { drawCompass, drawLevel } from './kompas-draw.js?v=1';
import { icon, GFX, Themes, injectCss, topBar, bindGear, tabsHtml, makeStore, makeCanvas, escHtml } from './tools-ui.js?v=1';
export { WINDS, WINDNAMES, dir } from './kompas-core.js?v=1';

const TABS = [['kompas', 'Kompas', 'compass'], ['waterpas', 'Waterpas', 'target'], ['hoogte', 'Hoogte meten', 'tree'], ['locatie', 'Locatie', 'map'], ['plekken', 'Plekken', 'flag'], ['schat', 'Schatzoeken', 'chest'], ['buiten', 'Buiten', 'sun'], ['oefen', 'Oefenen', 'book']];

export function kompasView(ctx) {
  const { view, addCleanup } = ctx;
  const esc = ctx.esc || escHtml, uid = ctx.uid || 'anon';
  injectCss(); injectCss('kp-css', '.kp button{min-height:calc(46px * var(--gfx-scale,1))}.kp-num{font-size:calc(2.6rem * var(--gfx-font,1));font-weight:800;line-height:1.1}');
  const store = makeStore({ key: `kompas:v2:${uid}`, game: 'kompas', uid: ctx.uid, db: ctx.db, def: { places: [], target: null, coins: 0, found: 0, hunts: 0, quiz: { best: 0, right: 0, total: 0 }, world: '' } });
  store.sync().catch(() => {});
  let alive = true, tab = 'kompas', tabCleanups = [], seq = 0;
  const S = {
    store, heading: null, beta: 0, gamma: 0, listening: false, supported: typeof DeviceOrientationEvent !== 'undefined', accuracy: null, msg: '',
    gps: { on: false, pos: null, error: '', watch: null }, locked: null, shown: 0, pressure: null,
  };
  const needsAsk = S.supported && typeof DeviceOrientationEvent.requestPermission === 'function';

  /* ---------- sensoren ---------- */
  const onOrient = (e) => {
    if (typeof e.webkitCompassHeading === 'number') { S.heading = e.webkitCompassHeading; if (typeof e.webkitCompassAccuracy === 'number') S.accuracy = e.webkitCompassAccuracy; }
    else if (e.absolute && typeof e.alpha === 'number') S.heading = (360 - e.alpha) % 360;
    else if (typeof e.alpha === 'number' && S.heading === null) S.heading = (360 - e.alpha) % 360;
    if (typeof e.beta === 'number') S.beta = e.beta; if (typeof e.gamma === 'number') S.gamma = e.gamma;
  };
  S.start = async () => {
    if (S.listening) return true;
    if (!S.supported) { S.msg = 'Dit toestel heeft geen bewegingssensoren. Open de app op een telefoon of tablet.'; return false; }
    if (needsAsk) {
      try { const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') { S.msg = 'Toestemming geweigerd. Zet bewegingssensoren aan bij Instellingen, Safari, Beweging en oriëntatie.'; return false; } }
      catch { S.msg = 'Toestemming vragen lukt niet. Probeer het in Safari.'; return false; }
    }
    window.addEventListener('deviceorientationabsolute', onOrient, true); window.addEventListener('deviceorientation', onOrient, true); S.listening = true; S.msg = ''; return true;
  };
  S.consent = () => { try { return localStorage.getItem('kompas:consent') === '1'; } catch { return false; } };
  S.giveConsent = () => { try { localStorage.setItem('kompas:consent', '1'); } catch { /* stil */ } };
  S.startGps = () => {
    if (S.gps.on) return;
    if (!navigator.geolocation) { S.gps.error = 'Locatie is niet beschikbaar in deze browser.'; return; }
    S.gps.on = true; S.gps.error = '';
    S.gps.watch = navigator.geolocation.watchPosition((p) => {
      const c = p.coords; S.gps.pos = { lat: c.latitude, lon: c.longitude, acc: c.accuracy, alt: c.altitude, altAcc: c.altitudeAccuracy, speed: c.speed, heading: c.heading, ts: p.timestamp }; S.gps.error = '';
    }, (e) => { S.gps.error = e.code === 1 ? 'Locatie geweigerd. Zet locatie aan voor deze website in de instellingen van je toestel of browser.' : e.code === 3 ? 'Locatie zoeken duurt lang. Ga naar buiten of probeer opnieuw.' : 'Locatie niet beschikbaar.'; if (e.code === 1) S.stopGps(); }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
  };
  S.stopGps = () => { if (S.gps.watch != null && navigator.geolocation) navigator.geolocation.clearWatch(S.gps.watch); S.gps.on = false; S.gps.watch = null; };
  addCleanup(() => { alive = false; window.removeEventListener('deviceorientationabsolute', onOrient, true); window.removeEventListener('deviceorientation', onOrient, true); S.stopGps(); tabCleanups.splice(0).forEach((f) => { try { f(); } catch { /* stil */ } }); store.flush(); });

  S.world = () => { const w = store.get().world; return w ? Themes.world(w) : Themes.forGame('kompas'); };
  S.sensorCard = (what) => `<div class="tu-card center">${icon('compass', { size: 72 })}<h3 style="margin:.2rem 0">${what}</h3>${!S.supported ? '<p>Dit werkt alleen op een <b>telefoon of tablet</b>. Open simon-app daar in Safari of Chrome.</p>' : `<p>Voor het ${what.toLowerCase()} gebruikt de app de bewegingssensoren van je toestel. ${needsAsk ? 'Je krijgt zo een vraag om toestemming.' : ''}</p><button class="pri tu-big" data-sensor>Start</button>`}<div class="err" data-smsg style="margin-top:.4rem">${esc(S.msg)}</div></div>`;
  S.bindSensor = (body, redraw) => { const b = body.querySelector('[data-sensor]'); if (b) b.onclick = async () => { const ok = await S.start(); if (ok) redraw(); else { const m = body.querySelector('[data-smsg]'); if (m) m.textContent = S.msg; } }; };
  S.track = (f) => tabCleanups.push(f);
  S.go = (t) => { tab = t; render(); };

  view.innerHTML = `<div class="tu kp">${topBar('Kompas', 'compass')}<div data-tabs></div><div data-body></div></div>`;
  bindGear(view, 'Instellingen');
  const body = () => view.querySelector('[data-body]');

  function render() {
    tabCleanups.splice(0).forEach((f) => { try { f(); } catch { /* stil */ } }); const my = ++seq;
    view.querySelector('[data-tabs]').innerHTML = tabsHtml(TABS, tab);
    view.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { tab = b.dataset.tab; render(); }; });
    const b = body();
    if (tab === 'kompas') return compassTab(b);
    if (tab === 'waterpas') return levelTab(b);
    if (tab === 'hoogte') return heightTab(b);
    b.innerHTML = '<div class="tu-card center"><small>Laden…</small></div>';
    if (tab === 'buiten') { import('./tools-r4-kompas.js?v=1').then((m) => { if (!alive || my !== seq) return; const b2 = body(); b2.innerHTML = ''; m.buitenTab(b2, S, ctxApi); }).catch((e) => { if (alive && my === seq) body().innerHTML = `<div class="tu-card"><span class="err">Kon dit onderdeel niet laden: ${esc(e.message)}</span></div>`; }); return; }
    import('./kompas-geo.js?v=1').then((m) => { if (!alive || my !== seq) return; const b2 = body(); b2.innerHTML = ''; ({ locatie: m.locatieTab, plekken: m.plekkenTab, schat: m.schatTab, oefen: m.oefenTab })[tab](b2, S, ctxApi); })
      .catch((e) => { if (alive && my === seq) body().innerHTML = `<div class="tu-card"><span class="err">Kon dit onderdeel niet laden: ${esc(e.message)}</span></div>`; });
  }
  const ctxApi = { esc, icon, makeCanvas, GFX, Themes };

  /* ---------- Kompas ---------- */
  function compassTab(b) {
    if (!S.listening) { b.innerHTML = S.sensorCard('Kompas'); S.bindSensor(b, () => compassTab(b)); return; }
    const w = S.world();
    b.innerHTML = `<div class="tu-hero" data-hero style="height:min(118vw,500px)"><div class="tu-in" style="height:100%;display:flex;flex-direction:column;justify-content:flex-end;text-align:center;text-shadow:0 1px 4px rgba(0,0,0,.6)">
        <div class="kp-num" data-num>…</div><div data-name style="font-size:1.15rem;font-weight:700"></div><div data-lock style="min-height:1.4rem"></div></div></div>
      <div class="tu-card"><div class="tu-row" style="justify-content:center"><button class="tu-big pri" data-set>${icon('flag', { size: 24 })} Zet doel hier</button><button class="tu-big" data-clr>Wis doel</button>${store.get().target ? `<button class="tu-big" data-clrt>Stop navigeren</button>` : ''}</div>
        <div class="tu-row" style="margin-top:.6rem;justify-content:center"><span>Wereld:</span><select data-world class="tu-inp" style="width:auto"><option value="">Automatisch</option>${Themes.list.map((x) => `<option value="${x.id}" ${store.get().world === x.id ? 'selected' : ''}>${x.emoji} ${escHtml(x.name)}</option>`).join('')}</select></div>
        <div data-info style="margin-top:.5rem;font-size:.9rem;opacity:.85;text-align:center"></div></div>
      <div class="tu-card"><small>Tip: loopt het kompas fout, beweeg je telefoon een paar keer in een 8-figuur. Blijf uit de buurt van magneten en metaal. Het kompas wijst naar het <b>magnetische</b> noorden (in Nederland ongeveer 3 graden naast het ware noorden). De rode vlag is je doel, de zon staat op de ring zodra je locatie bekend is.</small></div>`;
    const host = b.querySelector('[data-hero]');
    let shown = S.heading == null ? 0 : S.heading;
    const c = makeCanvas(host, (ctx2, wd, ht, t, dt) => {
      Themes.paintBackground(ctx2, wd, ht, w, GFX.reduce ? 0 : t);
      if (S.heading != null) { const k = 1 - Math.exp(-dt / 0.08), d = K.angleDiff(shown, S.heading); shown = K.norm360(shown + d * k); }
      const pos = S.gps.pos, tg = store.get().target;
      const sun = pos ? K.sunPosition(new Date(), pos.lat, pos.lon) : null;
      const tb = tg && pos ? K.bearing(pos.lat, pos.lon, tg.lat, tg.lon) : null;
      drawCompass(ctx2, wd / 2, ht * 0.4, Math.min(wd * 0.44, ht * 0.36), { heading: shown, tiltX: Math.max(-1, Math.min(1, S.gamma / 45)), tiltY: Math.max(-1, Math.min(1, (S.beta - 10) / 45)), target: tb, sunAz: sun ? sun.azimuth : null, sunAlt: sun ? sun.altitude : -90, locked: S.locked });
    }, { fps: GFX.q ? 45 : 30 });
    // de achtergrond wordt in het canvas getekend; hero krijgt geen eigen achtergrond
    S.track(c.stop);
    const iv = setInterval(() => {
      if (!view.isConnected) return;
      const hd = S.heading; if (hd == null) { b.querySelector('[data-num]').textContent = '…'; return; }
      b.querySelector('[data-num]').textContent = `${Math.round(hd)}° ${K.dir(hd)}`; b.querySelector('[data-name]').textContent = K.dirName(hd);
      let l = '';
      if (S.locked != null) { const off = K.angleDiff(hd, S.locked); l = Math.abs(off) < 4 ? 'Je loopt precies goed!' : `Doel ${Math.round(S.locked)}°: ${Math.abs(Math.round(off))}° naar ${off > 0 ? 'rechts' : 'links'}`; }
      const tg = store.get().target, pos = S.gps.pos;
      if (tg && pos) { const brg = K.bearing(pos.lat, pos.lon, tg.lat, tg.lon), off = K.angleDiff(hd, brg); l = `${escHtml(tg.name || 'Doel')}: ${K.fmtDist(K.distance(pos.lat, pos.lon, tg.lat, tg.lon))}, ${Math.abs(Math.round(off)) < 5 ? 'recht vooruit' : Math.abs(Math.round(off)) + '° naar ' + (off > 0 ? 'rechts' : 'links')}`; }
      b.querySelector('[data-lock]').innerHTML = l;
      const inf = []; if (S.accuracy != null && S.accuracy >= 0) inf.push(`Nauwkeurigheid ±${Math.round(S.accuracy)}°`); if (pos) { const sp = K.sunPosition(new Date(), pos.lat, pos.lon); inf.push(sp.altitude > 0 ? `Zon: richting ${K.dir(sp.azimuth)}, ${Math.round(sp.altitude)}° hoog` : 'De zon is onder de horizon'); }
      b.querySelector('[data-info]').textContent = inf.join(' · ');
    }, 120); S.track(() => clearInterval(iv));
    b.querySelector('[data-set]').onclick = () => { if (S.heading !== null) { S.locked = S.heading; } };
    b.querySelector('[data-clr]').onclick = () => { S.locked = null; };
    const ct = b.querySelector('[data-clrt]'); if (ct) ct.onclick = () => { store.update((d) => { d.target = null; }); compassTab(b); };
    b.querySelector('[data-world]').onchange = (e) => { store.update((d) => { d.world = e.target.value; }); if (e.target.value) Themes.setForGame('kompas', e.target.value); compassTab(b); };
  }

  /* ---------- Waterpas ---------- */
  function levelTab(b) {
    if (!S.listening) { b.innerHTML = S.sensorCard('Waterpas'); S.bindSensor(b, () => levelTab(b)); return; }
    b.innerHTML = `<div class="tu-card center"><div data-lv style="height:min(80vw,320px);margin:0 auto;position:relative"></div><div class="kp-num" data-tilt></div><div data-hint style="opacity:.8">Leg je telefoon plat neer. De luchtbel moet in het midden komen.</div>
      <div class="tu-row" style="justify-content:center;margin-top:.7rem"><span class="tu-chip">Voorwaarts <b data-b>0</b>°</span><span class="tu-chip">Zijwaarts <b data-g>0</b>°</span></div></div>
      <div class="tu-card"><b>Tip</b><br><small>Op een rechtopstaand toestel meet je ook of een muur recht staat: zet de lange kant tegen de muur.</small></div>`;
    let wasFlat = false;
    const c = makeCanvas(b.querySelector('[data-lv]'), (ctx2, w, h) => { ctx2.clearRect(0, 0, w, h); const flat = drawLevel(ctx2, w / 2, h / 2, Math.min(w, h) * 0.46, { beta: S.beta, gamma: S.gamma }); if (flat && !wasFlat) { try { navigator.vibrate && navigator.vibrate(30); } catch { /* stil */ } } wasFlat = flat; }, { fps: 30 });
    S.track(c.stop);
    const iv = setInterval(() => { const t = b.querySelector('[data-tilt]'); if (!t) return; const h = Math.hypot(S.beta, S.gamma); t.textContent = h < 1.5 ? 'Waterpas!' : `${(Math.round(h * 10) / 10).toString().replace('.', ',')}°`; b.querySelector('[data-b]').textContent = Math.round(S.beta * 10) / 10; b.querySelector('[data-g]').textContent = Math.round(S.gamma * 10) / 10; }, 150);
    S.track(() => clearInterval(iv));
  }

  /* ---------- Hoogte meten ---------- */
  function heightTab(b) {
    if (!S.listening) { b.innerHTML = S.sensorCard('Hoogtemeter'); S.bindSensor(b, () => heightTab(b)); return; }
    let dist = 20, eye = 1.5, frozen = null;
    const cur = () => (frozen != null ? frozen : Math.max(0, Math.min(89, S.beta)));
    function layout() {
      b.innerHTML = `<div class="tu-card center"><h3 style="margin:.1rem 0">Hoe hoog is dat?</h3><p><small>Loop ${dist} meter bij de boom of het gebouw vandaan. Houd je telefoon als een kijker: kijk langs de <b>bovenste rand</b> naar de top en tik op Meet.</small></p>
        <div style="margin:.5rem auto" data-svg></div><div class="kp-num" data-val></div><small data-sub></small>
        <div class="tu-row" style="justify-content:center;margin:.7rem 0"><button class="tu-big pri" data-meet>${frozen != null ? 'Opnieuw meten' : 'Meet!'}</button></div>
        <div class="tu-row" style="justify-content:center"><span>Afstand</span><button class="tu-big" data-d="-5">−</button><b>${dist} m</b><button class="tu-big" data-d="5">+</button></div>
        <div class="tu-row" style="justify-content:center;margin-top:.4rem"><span>Jouw ooghoogte</span><button class="tu-big" data-e="-0.1">−</button><b>${eye.toFixed(1).replace('.', ',')} m</b><button class="tu-big" data-e="0.1">+</button></div></div>
        <div class="tu-card"><b>Hoe werkt het?</b><br><small>De hoogte is afstand × tan(hoek) + jouw ooghoogte. Met een hoek van 45° is een boom precies zo hoog als de afstand die je ervandaan staat, plus je ooghoogte.</small></div>`;
      b.querySelector('[data-meet]').onclick = () => { frozen = frozen != null ? null : Math.max(0, Math.min(89, S.beta)); layout(); };
      b.querySelectorAll('[data-d]').forEach((x) => { x.onclick = () => { dist = Math.max(5, Math.min(200, dist + +x.dataset.d)); layout(); }; });
      b.querySelectorAll('[data-e]').forEach((x) => { x.onclick = () => { eye = Math.max(0.5, Math.min(2.2, Math.round((eye + +x.dataset.e) * 10) / 10)); layout(); }; });
      paint();
    }
    function paint() {
      const ang = cur(), h = K.heightFromAngle(dist, ang, eye), sc = 90 / Math.max(10, h * 1.2), ph = Math.min(95, h * sc);
      const svg = b.querySelector('[data-svg]'); if (!svg) return;
      svg.innerHTML = `<svg viewBox="-10 -10 220 130" width="min(80vw,320px)"><line x1="0" y1="100" x2="200" y2="100" stroke="currentColor" stroke-width="2"/><rect x="170" y="${100 - ph}" width="12" height="${ph}" fill="#16a34a" rx="2"/><circle cx="20" cy="${100 - eye * sc}" r="6" fill="#f59e0b"/><line x1="20" y1="${100 - eye * sc}" x2="176" y2="${100 - ph}" stroke="#ef4444" stroke-width="2" stroke-dasharray="4 3"/><text x="40" y="${92 - eye * sc}" font-size="12" fill="currentColor">${Math.round(ang)}°</text></svg>`;
      b.querySelector('[data-val]').textContent = frozen != null ? `${h.toFixed(1).replace('.', ',')} m` : `${Math.round(ang)}°`;
      b.querySelector('[data-sub]').textContent = frozen != null ? `Gemeten hoek ${Math.round(frozen)}°. Helling: ${K.slopePercent(frozen).toFixed(0)}%.` : 'Richt op de top en tik Meet';
    }
    layout();
    const iv = setInterval(() => { if (frozen == null && view.isConnected) paint(); }, 250);
    S.track(() => clearInterval(iv));
  }
  render();
}
