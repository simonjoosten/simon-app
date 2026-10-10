export default {
  id: 'reactie',
  name: 'Reactietest',
  emoji: '⚡',
  hint: 'Tik zodra het scherm groen wordt',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#b3261e';
    const box = document.createElement('div');
    box.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
      'text-align:center;color:#fff;font-family:system-ui,sans-serif;user-select:none;-webkit-user-select:none;padding:20px;box-sizing:border-box';
    const big = document.createElement('div');
    big.style.cssText = 'font-size:56px;font-weight:800;line-height:1.1;margin-bottom:12px';
    const small = document.createElement('div');
    small.style.cssText = 'font-size:20px;opacity:.95;white-space:pre-line';
    const info = document.createElement('div');
    info.style.cssText = 'position:absolute;top:14px;left:0;right:0;font-size:18px;font-weight:700;opacity:.9';
    box.append(info, big, small);
    host.appendChild(box);

    const ROUNDS = 5;
    let dead = false, done = false, timer = 0;
    let state = 'idle'; // wait | go | result | early | finished
    let round = 0, times = [], goAt = 0;

    function setTimer(fn, ms) { clearTimeout(timer); timer = setTimeout(() => { if (!dead) fn(); }, ms); }
    function paint(bg, b, s) { host.style.background = bg; big.textContent = b; small.textContent = s; }
    function showInfo() { info.textContent = 'Ronde ' + Math.min(round + 1, ROUNDS) + ' van ' + ROUNDS; }

    function startRound() {
      state = 'wait'; showInfo();
      paint('#b3261e', 'Wacht...', 'Tik pas als het groen wordt');
      setTimer(() => {
        state = 'go'; goAt = performance.now();
        paint('#1b9c3f', 'NU!', 'Tik!');
      }, 1500 + Math.random() * 2800);
    }
    function avg() { return times.reduce((a, b) => a + b, 0) / times.length; }
    function finish() {
      state = 'finished';
      const a = avg();
      const sc = Math.max(0, Math.round(1000 - a));
      api.score(sc);
      paint('#2755b8', Math.round(a) + ' ms', 'Gemiddelde reactietijd\nScore: ' + sc);
      info.textContent = 'Klaar!';
      setTimer(() => { if (!done) { done = true; api.end(sc); } }, 1800);
    }
    function onDown(e) {
      e.preventDefault();
      if (state === 'wait') {
        clearTimeout(timer);
        state = 'early';
        paint('#c77700', 'Te vroeg!', 'Wacht tot het groen is.\nOpnieuw...');
        setTimer(startRound, 1300);
      } else if (state === 'go') {
        const ms = Math.round(performance.now() - goAt);
        times.push(ms); round++;
        const sc = Math.max(0, Math.round(1000 - avg()));
        api.score(sc);
        if (round >= ROUNDS) { state = 'result'; paint('#2755b8', ms + ' ms', 'Goed gedaan!'); setTimer(finish, 1100); }
        else { state = 'result'; paint('#2755b8', ms + ' ms', 'Volgende ronde komt eraan...'); setTimer(startRound, 1300); }
      }
    }
    host.addEventListener('pointerdown', onDown);
    const onKey = e => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); onDown(e); } };
    window.addEventListener('keydown', onKey);
    api.score(0);
    paint('#2755b8', 'Klaar?', 'Het scherm wordt zo rood...');
    info.textContent = '';
    setTimer(startRound, 900);

    return {
      destroy() {
        dead = true; clearTimeout(timer);
        host.removeEventListener('pointerdown', onDown);
        window.removeEventListener('keydown', onKey);
        if (box.parentNode === host) host.removeChild(box);
      },
    };
  },
};
