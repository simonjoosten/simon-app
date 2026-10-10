// Kompas en waterpas met de bewegingssensoren van je telefoon of tablet.

const WINDS = ['N', 'NNO', 'NO', 'ONO', 'O', 'OZO', 'ZO', 'ZZO', 'Z', 'ZZW', 'ZW', 'WZW', 'W', 'WNW', 'NW', 'NNW'];
const WINDNAMES = { N: 'Noord', NNO: 'Noord-noordoost', NO: 'Noordoost', ONO: 'Oost-noordoost', O: 'Oost', OZO: 'Oost-zuidoost', ZO: 'Zuidoost', ZZO: 'Zuid-zuidoost', Z: 'Zuid', ZZW: 'Zuid-zuidwest', ZW: 'Zuidwest', WZW: 'West-zuidwest', W: 'West', WNW: 'West-noordwest', NW: 'Noordwest', NNW: 'Noord-noordwest' };
const dir = (deg) => WINDS[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];

// ctx: { view, esc, addCleanup }
export function kompasView(ctx) {
  const { view, addCleanup } = ctx;
  let tab = 'kompas', heading = null, beta = 0, gamma = 0, listening = false, locked = null, raf = 0, shown = 0;
  const supported = typeof DeviceOrientationEvent !== 'undefined';
  const needsAsk = supported && typeof DeviceOrientationEvent.requestPermission === 'function';

  const onOrient = (e) => {
    if (typeof e.webkitCompassHeading === 'number') heading = e.webkitCompassHeading;              // iPhone: echt kompas
    else if (e.absolute && typeof e.alpha === 'number') heading = (360 - e.alpha) % 360;           // Android
    else if (typeof e.alpha === 'number' && heading === null) heading = (360 - e.alpha) % 360;     // niet-absoluut: bij benadering
    if (typeof e.beta === 'number') beta = e.beta; if (typeof e.gamma === 'number') gamma = e.gamma;
  };
  const start = async () => {
    if (listening) return;
    if (needsAsk) { try { const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') { msg('Toestemming geweigerd. Zet bewegingssensoren aan bij Instellingen → Safari → Beweging en oriëntatie.'); return; } } catch { msg('Toestemming vragen lukt niet. Probeer het in Safari.'); return; } }
    window.addEventListener('deviceorientationabsolute', onOrient, true); window.addEventListener('deviceorientation', onOrient, true); listening = true; msg(''); loop(); draw();
  };
  const msg = (t) => { const el = view.querySelector('#kp-msg'); if (el) el.textContent = t; };
  addCleanup(() => { window.removeEventListener('deviceorientationabsolute', onOrient, true); window.removeEventListener('deviceorientation', onOrient, true); clearInterval(raf); });

  function loop() {
    clearInterval(raf);
    let last = performance.now();
    const step = (now) => {
      if (!view.isConnected) return;
      const dt = Math.min(1, Math.max(0.001, ((now || performance.now()) - last) / 1000)); last = now || performance.now(); const k = 1 - Math.exp(-dt / 0.09);
      const rose = view.querySelector('#kp-rose'), num = view.querySelector('#kp-num'), bub = view.querySelector('#kp-bub');
      if (heading !== null) { // vloeiend naar het doel draaien (kortste weg)
        const d = ((heading - shown + 540) % 360) - 180; shown = (shown + d * k + 360) % 360;
        if (rose) rose.style.transform = `rotate(${-shown}deg)`;
        if (num) num.textContent = `${Math.round(shown)}° ${dir(shown)}`;
        const nm = view.querySelector('#kp-name'); if (nm) nm.textContent = WINDNAMES[dir(shown)];
        if (locked !== null) { const off = ((locked - shown + 540) % 360) - 180; const lk = view.querySelector('#kp-lock'); if (lk) lk.textContent = `Doel ${Math.round(locked)}°: ${Math.abs(Math.round(off))}° naar ${off > 0 ? 'rechts' : 'links'}`; }
      }
      if (bub) { const x = Math.max(-1, Math.min(1, gamma / 30)), y = Math.max(-1, Math.min(1, (beta - 0) / 30)); bub.style.transform = `translate(${x * 90}px, ${y * 90}px)`; const flat = Math.abs(gamma) < 1.5 && Math.abs(beta) < 1.5; bub.style.background = flat ? '#22c55e' : '#f59e0b'; const t = view.querySelector('#kp-tilt'); if (t) t.textContent = flat ? '✅ Waterpas!' : `Helling: ${Math.round(Math.hypot(beta, gamma) * 10) / 10}°`; }
    };
    raf = setInterval(() => step(performance.now()), 33);
  }

  function draw() {
    const tabs = [['kompas', '🧭 Kompas'], ['level', '📏 Waterpas']];
    let body;
    if (!supported) body = '<div class="box center"><h3>Geen sensor gevonden</h3><p>Een kompas werkt alleen op een <b>telefoon of tablet</b>. Open simon-app daar in Safari of Chrome.</p></div>';
    else if (!listening) body = `<div class="box center"><h3>${tab === 'kompas' ? '🧭 Kompas' : '📏 Waterpas'}</h3><p>Voor het kompas en de waterpas gebruikt de app de bewegingssensoren van je toestel. ${needsAsk ? 'Je krijgt zo een vraag om toestemming.' : ''}</p><button class="pri" id="kp-go" style="font-size:1.1rem;padding:.7rem 1.6rem">Start</button><div id="kp-msg" class="err" style="margin-top:.5rem"></div></div>`;
    else if (tab === 'kompas') {
      body = `<div class="box center">
        <div style="position:relative;width:min(80vw,300px);aspect-ratio:1;margin:.5rem auto">
          <div style="position:absolute;top:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border:10px solid transparent;border-top:0;border-bottom:18px solid #ef4444;z-index:3"></div>
          <div id="kp-rose" style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,var(--card) 62%,var(--line) 63%);border:4px solid var(--ink);transition:none">
            ${[...Array(72)].map((_, i) => `<div style="position:absolute;left:50%;top:0;width:2px;height:${i % 9 === 0 ? 16 : i % 3 === 0 ? 10 : 6}px;margin-left:-1px;background:var(--ink);transform-origin:1px calc(min(40vw,150px));transform:rotate(${i * 5}deg)"></div>`).join('')}
            ${[['N', 0, '#ef4444'], ['O', 90, 'var(--ink)'], ['Z', 180, 'var(--ink)'], ['W', 270, 'var(--ink)']].map(([l, a, c]) => `<div style="position:absolute;left:50%;top:0;height:100%;transform:translateX(-50%) rotate(${a}deg);pointer-events:none"><div style="position:absolute;top:24px;left:50%;transform:translateX(-50%) rotate(${-a}deg);font:800 1.5rem system-ui;color:${c}">${l}</div></div>`).join('')}
          </div>
          <div style="position:absolute;left:50%;top:50%;width:10px;height:10px;margin:-5px;border-radius:50%;background:var(--ink)"></div>
        </div>
        <div id="kp-num" style="font-size:2rem;font-weight:800">${heading === null ? '…' : ''}</div><div id="kp-name" style="opacity:.8"></div>
        <div class="row wrap" style="justify-content:center;margin-top:.5rem"><button id="kp-set">🎯 Zet doel hier</button><button id="kp-clr">Wis doel</button></div><div id="kp-lock"><small>${locked === null ? 'Houd je telefoon plat voor een goed kompas.' : ''}</small></div><div id="kp-msg"></div></div>
        <div class="box"><small>Tip: loopt het kompas fout, beweeg je telefoon een paar keer in een 8-figuur. Blijf uit de buurt van magneten en metaal. Het toont het <b>magnetische</b> noorden.</small></div>`;
    } else {
      body = `<div class="box center"><div style="position:relative;width:min(80vw,260px);aspect-ratio:1;margin:.5rem auto;border-radius:50%;border:4px solid var(--ink);background:var(--card)">
          <div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:var(--line)"></div><div style="position:absolute;top:50%;left:0;right:0;height:1px;background:var(--line)"></div>
          <div style="position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px;border-radius:50%;border:2px dashed var(--ink)"></div>
          <div id="kp-bub" style="position:absolute;left:50%;top:50%;width:34px;height:34px;margin:-17px;border-radius:50%;background:#f59e0b;box-shadow:inset -4px -4px 8px #0003"></div></div>
        <div id="kp-tilt" style="font-size:1.6rem;font-weight:800"></div><small>Leg je telefoon plat neer. Het bolletje moet in het midden komen.</small></div>`;
    }
    view.innerHTML = `<div class="row wrap">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'pri' : ''}" style="flex:1">${l}</button>`).join('')}</div>${body}`;
    view.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; draw(); });
    const go = view.querySelector('#kp-go'); if (go) go.onclick = start;
    const set = view.querySelector('#kp-set'); if (set) { set.onclick = () => { if (heading !== null) { locked = heading; draw(); } }; view.querySelector('#kp-clr').onclick = () => { locked = null; draw(); }; }
  }
  draw();
}
