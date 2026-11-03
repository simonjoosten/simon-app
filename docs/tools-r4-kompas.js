// Kompas, ronde 4: tab "Buiten" met Windroos-race, Stappenteller, Schaduw en zon en Afstand tussen plekken.
// Pure functies bovenaan; buitenTab(b, S, api) tekent de tab (zelfde aanroep als de andere kompas-tabs).
import * as K from './kompas-core.js?v=1';
import { esc, injectR4Css, sectionsHtml, bindSections, clamp, blip, pad2 } from './tools-r4-kit.js?v=1';

export const shadowLength = (heightM, altDeg) => (altDeg <= 0.5 ? Infinity : heightM / Math.tan(altDeg * Math.PI / 180));
export const stepsDistance = (steps, strideCm) => steps * strideCm / 100;
export const strideFromHeight = (heightCm) => Math.round(heightCm * 0.415); // vuistregel voor wandelen
export const walkMinutes = (m, kmh = 5) => (m / 1000) / kmh * 60;
export function fmtMin(min) { if (!Number.isFinite(min)) return '–'; const t = Math.round(min); return t < 60 ? `${t} min` : `${Math.floor(t / 60)} u ${pad2(t % 60)} min`; }
/** 8 windrichtingen als vraag: {deg, answer, choices} */
export function windQuestion(r = Math.random, level = 1) {
  const list = level === 1 ? K.CARDINALS : K.WINDS.map((w, i) => [K.WINDNAMES[w], i * 22.5]);
  const cur = list[Math.floor(r() * list.length)], ch = new Set([cur[0]]);
  while (ch.size < 4) ch.add(list[Math.floor(r() * list.length)][0]);
  return { deg: cur[1], answer: cur[0], choices: [...ch].sort(() => r() - 0.5) };
}
export const sunPhase = (altDeg) => (altDeg > 20 ? 'hoog aan de hemel' : altDeg > 6 ? 'laag aan de hemel' : altDeg > 0 ? 'bijna onder of net op' : altDeg > -6 ? 'schemering' : 'de zon is weg');

export function buitenTab(b, S, api) {
  injectR4Css();
  const st = S.store; let sec = 'wind', cl = [];
  const stop = () => { cl.splice(0).forEach((f) => { try { f(); } catch {} }); };
  S.track(stop);
  const draw = () => { stop(); b.innerHTML = `${sectionsHtml([['wind', 'Windroos-race'], ['stap', 'Stappenteller'], ['zon', 'Schaduw en zon'], ['afs', 'Afstanden']], sec)}<div data-r4></div>`; bindSections(b, (k) => { sec = k; draw(); }); ({ wind: wind, stap: stap, zon: zon, afs: afs })[sec](b.querySelector('[data-r4]')); };
  const rec = () => { const d = st.get(); return (d.r4 ||= { wind: 0, steps: 0, stride: 65, km: 0 }); };

  function wind(h) {
    let level = 1, run = null;
    const menu = () => { h.innerHTML = `<div class="r4-card" style="text-align:center"><b>Windroos-race</b><br><small>Een pijl wijst een kant op. Welke windrichting is dat? 30 seconden, goede antwoorden geven punten.</small>
      <div class="r4-row" style="justify-content:center;margin:.6rem 0"><button class="r4-btn ${level === 1 ? 'pri' : ''}" data-l="1">8 richtingen</button><button class="r4-btn ${level === 2 ? 'pri' : ''}" data-l="2">16 richtingen</button></div>
      <button class="r4-btn pri" data-go style="min-width:60%">Start</button><div style="margin-top:.5rem"><span class="r4-chip">Record: ${rec().wind} punten</span></div></div>`;
      h.querySelectorAll('[data-l]').forEach((x) => { x.onclick = () => { level = +x.dataset.l; menu(); }; }); h.querySelector('[data-go]').onclick = play; };
    function play() {
      run = { t: 30, pts: 0, q: null, streak: 0 }; const iv = setInterval(() => { run.t--; const e = h.querySelector('[data-t]'); if (e) e.textContent = run.t + ' s'; if (run.t <= 0) { clearInterval(iv); end(); } }, 1000); cl.push(() => clearInterval(iv));
      const ask = () => {
        run.q = windQuestion(Math.random, level);
        h.innerHTML = `<div class="r4-card" style="text-align:center"><div class="r4-row" style="justify-content:space-between"><span class="r4-chip" data-t>${run.t} s</span><span class="r4-chip">${run.pts} punten</span></div>
          <svg viewBox="-60 -60 120 120" width="200" height="200" style="margin:.4rem auto;display:block"><circle r="54" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-width="2"/><text y="-44" text-anchor="middle" font-size="12" fill="currentColor">N</text><g transform="rotate(${run.q.deg})"><path d="M0,-44 L8,6 L0,0 L-8,6 Z" fill="#dc2626"/></g></svg>
          <div class="rk-ch" style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">${run.q.choices.map((c, i) => `<button class="r4-btn" data-c="${i}" style="min-height:56px">${esc(c)}</button>`).join('')}</div></div>`;
        h.querySelectorAll('[data-c]').forEach((x) => { x.onclick = () => { const ok = run.q.choices[+x.dataset.c] === run.q.answer; if (ok) { run.streak++; run.pts += level * 10 + Math.min(10, run.streak); } else { run.streak = 0; run.t = Math.max(0, run.t - 2); } blip(ok ? 880 : 220, 0.1, 0.15); if (run.t > 0) ask(); }; });
      };
      ask();
    }
    function end() { const nb = run.pts > rec().wind; if (nb) { rec().wind = run.pts; } st.set(st.get()); h.innerHTML = `<div class="r4-card" style="text-align:center"><div class="r4-big">${run.pts} punten</div>${nb ? '<b class="r4-ok">Nieuw record!</b>' : ''}<br><button class="r4-btn pri" data-again style="margin-top:.6rem">Nog een keer</button></div>`; h.querySelector('[data-again]').onclick = menu; }
    menu();
  }

  function stap(h) {
    let steps = 0, t0 = 0;
    const draw2 = () => {
      const r = rec(), m = stepsDistance(steps, r.stride), mins = t0 ? (Date.now() - t0) / 60000 : 0;
      h.innerHTML = `<div class="r4-card" style="text-align:center"><b>Stappenteller</b><br><small>Tik bij elke stap (of elke 10 stappen). Zo weet je hoe ver je liep. Zonder GPS!</small>
        <div class="r4-big" style="margin:.5rem 0">${steps} stappen</div><div><b>${K.fmtDist(m)}</b> · ${fmtMin(walkMinutes(m))} lopen${mins > 0.2 && m > 0 ? ` · ${(m / 1000 / (mins / 60)).toFixed(1).replace('.', ',')} km/u` : ''}</div>
        <div class="r4-row" style="justify-content:center;margin:.7rem 0"><button class="r4-btn pri" data-p1 style="min-width:30%;min-height:72px">+1</button><button class="r4-btn" data-p10 style="min-width:30%;min-height:72px">+10</button><button class="r4-btn" data-rs style="min-height:72px">Wissen</button></div>
        <label class="r4-row" style="justify-content:center">Lengte stap: <input class="r4-in" data-st type="number" min="20" max="120" value="${r.stride}" style="width:6rem"> cm</label>
        <div class="r4-row" style="justify-content:center;margin-top:.4rem"><small>Jouw lengte in cm?</small><input class="r4-in" data-ln type="number" min="80" max="220" style="width:6rem" placeholder="140"><button class="r4-btn" data-calc>Bereken</button></div>
        <div style="margin-top:.5rem"><span class="r4-chip">Totaal ooit: ${(r.km / 1000).toFixed(2).replace('.', ',')} km</span></div></div>`;
      const add = (n) => { if (!t0) t0 = Date.now(); steps += n; blip(500, 0.03, 0.05); const r2 = rec(); r2.km += stepsDistance(n, r2.stride); st.set(st.get()); draw2(); };
      h.querySelector('[data-p1]').onclick = () => add(1); h.querySelector('[data-p10]').onclick = () => add(10); h.querySelector('[data-rs]').onclick = () => { steps = 0; t0 = 0; draw2(); };
      h.querySelector('[data-st]').onchange = (e) => { rec().stride = clamp(parseInt(e.target.value, 10) || 65, 20, 120); st.set(st.get()); draw2(); };
      h.querySelector('[data-calc]').onclick = () => { const v = parseInt(h.querySelector('[data-ln]').value, 10); if (v >= 80 && v <= 220) { rec().stride = strideFromHeight(v); st.set(st.get()); draw2(); } };
    };
    draw2();
  }

  function zon(h) {
    const pos = S.gps && S.gps.pos, lat = pos ? pos.lat : 52.09, lon = pos ? pos.lon : 5.12, where = pos ? 'jouw plek' : 'Utrecht (zet bij Locatie je GPS aan voor jouw plek)';
    let obj = 1.5;
    const draw2 = () => {
      const sp = K.sunPosition(new Date(), lat, lon), L = shadowLength(obj, sp.altitude), up = sp.altitude > 0.5;
      h.innerHTML = `<div class="r4-card"><b>Schaduw en zon</b><br><small>Op ${esc(where)}.</small>
        <div class="r4-row" style="margin:.4rem 0"><span class="r4-chip">Zon: ${Math.round(sp.altitude)}° hoog, richting ${K.dir(sp.azimuth)}</span><span class="r4-chip">${sunPhase(sp.altitude)}</span></div>
        <label>Hoogte van het ding: <b>${String(obj).replace('.', ',')} m</b> <input type="range" data-o min="0.1" max="30" step="0.1" value="${obj}" style="width:100%"></label>
        <div class="r4-big" style="font-size:1.8rem">${up ? `Schaduw ${L < 1000 ? L.toFixed(1).replace('.', ',') + ' m' : 'heel lang'}` : 'Geen schaduw (zon te laag)'}</div>
        ${up ? `<div style="text-align:center">De schaduw valt richting <b>${K.dir(sp.azimuth + 180)}</b> (${K.dirName(sp.azimuth + 180)}).</div>` : ''}</div>
        <div class="r4-card"><b>Kompas zonder kompas</b><ul style="margin:.3rem 0 0 1.1rem;padding:0"><li>Om 12 uur ('s middags) staat de zon in Nederland in het <b>zuiden</b>.</li><li>De schaduw van een paal wijst dan naar het <b>noorden</b>.</li><li>Leg een stok neer, markeer de schaduwpunt, wacht 15 minuten: de lijn tussen de twee punten loopt van west naar oost.</li></ul></div>`;
      h.querySelector('[data-o]').oninput = (e) => { obj = parseFloat(e.target.value) || 1; draw2(); };
    };
    draw2();
  }

  function afs(h) {
    const pl = st.get().places || [], me = S.gps && S.gps.pos ? { id: 'me', name: 'Mijn plek nu', lat: S.gps.pos.lat, lon: S.gps.pos.lon } : null, list = me ? [me, ...pl] : pl;
    if (list.length < 2) { h.innerHTML = `<div class="r4-card" style="text-align:center"><b>Afstanden</b><br><small>Bewaar eerst minstens 2 plekken bij het tabblad Plekken (of zet GPS aan). Dan zie je hier de afstand en de richting ertussen.</small></div>`; return; }
    let a = list[0].id, bId = list[1].id;
    const draw2 = () => {
      const A = list.find((x) => x.id === a), B = list.find((x) => x.id === bId), d = K.distance(A.lat, A.lon, B.lat, B.lon), br = K.bearing(A.lat, A.lon, B.lat, B.lon);
      const opts = (cur) => list.map((x) => `<option value="${esc(x.id)}" ${x.id === cur ? 'selected' : ''}>${esc(x.name)}</option>`).join('');
      h.innerHTML = `<div class="r4-card"><b>Van</b><select class="r4-in" data-a>${opts(a)}</select><b style="display:block;margin-top:.4rem">Naar</b><select class="r4-in" data-b>${opts(bId)}</select>
        <div class="r4-big" style="margin-top:.6rem">${K.fmtDist(d)}</div><div style="text-align:center">Richting <b>${K.dirName(br)}</b> (${Math.round(br)}°)</div>
        <div class="r4-row" style="justify-content:center;margin-top:.5rem"><span class="r4-chip">Lopen: ${fmtMin(walkMinutes(d, 5))}</span><span class="r4-chip">Fietsen: ${fmtMin(walkMinutes(d, 15))}</span><span class="r4-chip">Auto: ${fmtMin(walkMinutes(d, 50))}</span></div></div>`;
      h.querySelector('[data-a]').onchange = (e) => { a = e.target.value; draw2(); }; h.querySelector('[data-b]').onchange = (e) => { bId = e.target.value; draw2(); };
    };
    draw2();
  }
  draw();
}
