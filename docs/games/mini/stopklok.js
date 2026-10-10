export default {
  id: 'stopklok',
  name: 'Stopklok',
  emoji: '⏱️',
  hint: 'Stop de klok op precies 10,00 seconden',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = 'linear-gradient(#0f2027,#203a43,#2c5364)';
    host.style.userSelect = 'none';
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui,sans-serif;color:#fff;text-align:center;padding:16px;box-sizing:border-box;cursor:pointer';
    root.innerHTML =
      '<div id="sk-round" style="font-size:18px;opacity:.8;margin-bottom:12px"></div>' +
      '<div id="sk-clock" style="font-size:72px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:2px;margin:10px 0">0,00</div>' +
      '<div id="sk-msg" style="font-size:20px;min-height:56px;line-height:1.3"></div>' +
      '<div id="sk-list" style="margin-top:18px;font-size:16px;opacity:.9;line-height:1.7"></div>' +
      '<div id="sk-btn" style="margin-top:22px;padding:16px 40px;border-radius:40px;background:#ffb703;color:#222;font-size:22px;font-weight:800"></div>';
    host.appendChild(root);
    const $ = (id) => root.querySelector('#' + id);
    const elRound = $('sk-round'), elClock = $('sk-clock'), elMsg = $('sk-msg'), elList = $('sk-list'), elBtn = $('sk-btn');

    const ROUNDS = 5, TARGET = 10, SHOW = 1.6;
    let round = 1, state = 'ready', t0 = 0, score = 0, results = [], raf = 0, alive = true, lockUntil = 0, endTimer = 0, ended = false;
    const fmt = (s) => s.toFixed(2).replace('.', ',');

    function setReady() {
      state = 'ready';
      elRound.textContent = 'Ronde ' + round + ' van ' + ROUNDS;
      elClock.textContent = '0,00'; elClock.style.opacity = '1'; elClock.style.color = '#fff';
      elMsg.textContent = round === 1 ? 'De klok verdwijnt na ' + String(SHOW).replace('.', ',') + ' seconden. Tel zelf tot 10!' : 'Tik om te starten';
      elBtn.textContent = 'START';
      renderList();
    }
    function renderList() {
      elList.innerHTML = results.map((r, i) => 'Ronde ' + (i + 1) + ': ' + fmt(r.time) + ' s (' + (r.diff >= 0 ? '+' : '-') + fmt(Math.abs(r.diff)) + ') = ' + r.pts + ' pt').join('<br>');
    }
    function startRound() {
      state = 'run'; t0 = performance.now();
      elMsg.textContent = 'Stop op 10,00!';
      elBtn.textContent = 'STOP';
    }
    function stopRound() {
      const time = (performance.now() - t0) / 1000;
      const diff = time - TARGET;
      const pts = Math.max(0, Math.round(200 * (1 - Math.abs(diff) / 1.5)));
      results.push({ time, diff, pts });
      score += pts; api.score(score);
      state = 'result';
      elClock.textContent = fmt(time); elClock.style.opacity = '1';
      const ad = Math.abs(diff);
      elClock.style.color = ad < 0.1 ? '#80ed99' : ad < 0.5 ? '#ffe066' : '#ff6b6b';
      elMsg.textContent = ad < 0.02 ? 'Wauw, bijna perfect!' : ad < 0.1 ? 'Superdichtbij!' : ad < 0.5 ? 'Best goed' : (diff < 0 ? 'Te vroeg' : 'Te laat') + ' - ' + fmt(ad) + ' s ernaast';
      renderList();
      if (round >= ROUNDS) {
        elBtn.textContent = 'Klaar...';
        state = 'done';
        ended = true;
        endTimer = setTimeout(() => { if (state === 'done') { state = 'fin'; api.end(score); } }, 2800);
      } else {
        elBtn.textContent = 'Volgende ronde';
      }
    }
    function act() {
      const now = performance.now();
      if (now < lockUntil) return;
      lockUntil = now + 350;
      if (state === 'ready') startRound();
      else if (state === 'run') stopRound();
      else if (state === 'result') { round++; setReady(); }
      else if (state === 'done' && ended) { clearTimeout(endTimer); state = 'fin'; api.end(score); }
    }

    function tick() {
      if (!alive) return;
      if (state === 'run') {
        const s = (performance.now() - t0) / 1000;
        if (s < SHOW) { elClock.textContent = fmt(s); elClock.style.opacity = '1'; }
        else { elClock.textContent = '?,??'; elClock.style.opacity = '0.45'; }
        if (s > 25) stopRound();
      }
      raf = requestAnimationFrame(tick);
    }
    setReady();
    raf = requestAnimationFrame(tick);

    function onDown(e) { e.preventDefault(); act(); }
    function onKey(e) { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); act(); } }
    root.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);

    return {
      destroy() {
        alive = false; cancelAnimationFrame(raf); clearTimeout(endTimer);
        root.removeEventListener('pointerdown', onDown);
        window.removeEventListener('keydown', onKey);
        root.remove();
      },
    };
  },
};
