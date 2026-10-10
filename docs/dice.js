// Dobbel & kies: dobbelstenen (d4 t/m d20), muntworp en een willekeurige keuze-kiezer.

const buzz = (ms = 25) => { try { navigator.vibrate && navigator.vibrate(ms); } catch {} };
const rnd = (n) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };   // eerlijke willekeur
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

// ctx: { view, esc, addCleanup }
export function diceView(ctx) {
  const { view, esc, addCleanup } = ctx;
  let tab = 'dice', count = 2, sides = 6, history = [], coinSide = null, flips = 0, items = '', pick = null, timers = [];
  addCleanup(() => timers.forEach(clearInterval));
  const later = (fn, ms) => { const t = setTimeout(fn, ms); return t; };

  const face = (n) => (sides === 6 ? `<div style="width:64px;height:64px;background:#fff;color:#111;border-radius:14px;box-shadow:0 3px 8px #0003;display:grid;grid-template:repeat(3,1fr)/repeat(3,1fr);padding:9px;gap:2px">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<span style="border-radius:50%;background:${PIPS[n].includes(i) ? '#111' : 'transparent'};"></span>`).join('')}</div>`
    : `<div style="min-width:64px;height:64px;padding:0 .6rem;background:#fff;color:#111;border-radius:14px;box-shadow:0 3px 8px #0003;display:grid;place-items:center;font:800 1.6rem system-ui">${n}</div>`);

  function draw() {
    const tabs = [['dice', '🎲 Dobbel'], ['coin', '🪙 Munt'], ['pick', '🎯 Kies']];
    let body = '';
    if (tab === 'dice') {
      body = `<div class="box center"><div class="row wrap" style="justify-content:center"><small>Aantal</small>${[1, 2, 3, 4, 5, 6].map((n) => `<button data-c="${n}" class="${n === count ? 'pri' : ''}">${n}</button>`).join('')}</div>
        <div class="row wrap" style="justify-content:center"><small>Soort</small>${[4, 6, 8, 10, 12, 20].map((n) => `<button data-s="${n}" class="${n === sides ? 'pri' : ''}">d${n}</button>`).join('')}</div>
        <div id="dd" style="display:flex;flex-wrap:wrap;gap:.7rem;justify-content:center;min-height:70px;margin:1rem 0">${history[0] ? history[0].vals.map(face).join('') : '<small>Tik op Gooi!</small>'}</div>
        <div id="dt" style="font-size:1.5rem;font-weight:800">${history[0] ? `Totaal: ${history[0].vals.reduce((a, b) => a + b, 0)}` : ''}</div>
        <div class="row" style="justify-content:center"><button class="pri" id="roll" style="font-size:1.2rem;padding:.7rem 2rem">🎲 Gooi!</button></div></div>
        <div class="box"><b>Laatste worpen</b>${history.length ? history.map((h) => `<div class="row"><span style="flex:1">${h.n}×d${h.s}: ${h.vals.join(' + ')}</span><b>${h.vals.reduce((a, b) => a + b, 0)}</b></div>`).join('') : '<br><small>Nog niets.</small>'}</div>`;
    } else if (tab === 'coin') {
      body = `<div class="box center"><div id="coin" style="width:140px;height:140px;margin:1rem auto;border-radius:50%;display:grid;place-items:center;font:800 1.1rem system-ui;color:#5b4400;background:radial-gradient(circle at 30% 30%,#fde68a,#d4a017);box-shadow:0 6px 16px #0004;transition:transform .9s cubic-bezier(.2,.7,.2,1);transform:rotateY(${flips * 180}deg)">${coinSide ? (coinSide === 'kop' ? '👑<br>KOP' : '🌷<br>MUNT') : '🪙'}</div>
        <div id="ct" style="font-size:1.5rem;font-weight:800;min-height:2rem">${coinSide ? coinSide.toUpperCase() + '!' : ''}</div>
        <div class="row" style="justify-content:center"><button class="pri" id="flip" style="font-size:1.2rem;padding:.7rem 2rem">🪙 Gooi de munt</button></div></div>
        <div class="box"><small>Kop of munt. Elke worp is helemaal eerlijk.</small></div>`;
    } else {
      body = `<div class="box"><b>Waar twijfel je over?</b>
        <div class="row"><textarea id="items" rows="5" placeholder="Zet elke keuze op een nieuwe regel, bijv.&#10;pizza&#10;friet&#10;sushi" style="flex:1;padding:.6rem;border:1px solid var(--line);border-radius:10px;font:inherit;background:var(--card);color:inherit">${esc(items)}</textarea></div>
        <div class="row" style="justify-content:center"><button class="pri" id="choose" style="font-size:1.2rem;padding:.7rem 2rem">🎯 Kies voor mij</button></div>
        <div id="pk" class="center" style="font-size:1.8rem;font-weight:800;min-height:2.6rem;margin-top:.6rem">${pick ? esc(pick) : ''}</div></div>`;
    }
    view.innerHTML = `<div class="row wrap">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'pri' : ''}" style="flex:1">${l}</button>`).join('')}</div>${body}`;
    view.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; draw(); });
    view.querySelectorAll('[data-c]').forEach((b) => b.onclick = () => { count = +b.dataset.c; draw(); });
    view.querySelectorAll('[data-s]').forEach((b) => b.onclick = () => { sides = +b.dataset.s; draw(); });
    if (view.querySelector('#roll')) view.querySelector('#roll').onclick = roll;
    if (view.querySelector('#flip')) view.querySelector('#flip').onclick = flip;
    if (view.querySelector('#choose')) { view.querySelector('#items').oninput = (e) => { items = e.target.value; }; view.querySelector('#choose').onclick = choose; }
  }

  function roll() {
    const btn = view.querySelector('#roll'); btn.disabled = true; buzz(40);
    const dd = view.querySelector('#dd'); let n = 0;
    const t = setInterval(() => { dd.innerHTML = Array.from({ length: count }, () => face(1 + rnd(sides))).join(''); if (++n > 9) { clearInterval(t); finish(); } }, 70); timers.push(t);
    const finish = () => { const vals = Array.from({ length: count }, () => 1 + rnd(sides)); history.unshift({ n: count, s: sides, vals }); history = history.slice(0, 10); buzz(20); draw(); };
  }
  function flip() {
    const btn = view.querySelector('#flip'); btn.disabled = true; buzz(40);
    const result = rnd(2) ? 'kop' : 'munt'; flips += 6 + (result === coinSide ? 0 : 1); const coin = view.querySelector('#coin');
    coin.style.transform = `rotateY(${flips * 180}deg)`; coin.innerHTML = '🪙'; view.querySelector('#ct').textContent = '';
    later(() => { coinSide = result; buzz(20); draw(); }, 950);
  }
  function choose() {
    const list = (items || '').split('\n').map((x) => x.trim()).filter(Boolean);
    if (list.length < 2) { view.querySelector('#pk').innerHTML = '<small class="err">Vul minstens twee keuzes in.</small>'; return; }
    const out = view.querySelector('#pk'); view.querySelector('#choose').disabled = true; buzz(30); let n = 0;
    const t = setInterval(() => { out.textContent = list[rnd(list.length)]; if (++n > 14) { clearInterval(t); pick = list[rnd(list.length)]; buzz(25); draw(); view.querySelector('#pk').innerHTML = `🎉 ${esc(pick)}`; } }, 90); timers.push(t);
  }
  draw();
}
