export default {
  id: 'bliksemreactie',
  name: 'Bliksemreactie',
  emoji: '⚡',
  hint: 'Zeven reactietests, wees zo snel mogelijk',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.userSelect = 'none';
    const stage = document.createElement('div');
    stage.style.cssText = 'position:absolute;inset:0;font-family:system-ui,sans-serif;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden;cursor:pointer;transition:background .05s';
    const head = document.createElement('div');
    head.style.cssText = 'position:absolute;top:14px;left:0;right:0;font-size:16px;opacity:.85;font-weight:700';
    const big = document.createElement('div');
    big.style.cssText = 'font-size:64px;font-weight:900;padding:0 16px;line-height:1.1';
    const sub = document.createElement('div');
    sub.style.cssText = 'font-size:20px;margin-top:14px;padding:0 20px;min-height:52px;opacity:.9';
    const dot = document.createElement('div');
    dot.style.cssText = 'position:absolute;width:70px;height:70px;border-radius:50%;background:#ffd166;display:none;box-shadow:0 0 0 6px rgba(255,255,255,.4)';
    stage.append(head, big, sub, dot);
    host.appendChild(stage);

    const NEU = '#1f2a44';
    const seqRender = (arr) => (it) => ({ html: it, bg: NEU, big: true, arr });
    const TESTS = [
      { name: 'Kleur', type: 'color', intro: 'Tik zodra het scherm GROEN wordt' },
      { name: 'Vorm', type: 'seq', intro: 'Tik zodra je een ROND ziet', items: ['■', '▲', '◆', '⬟', '★'], target: '●', r: (i) => ({ html: i, bg: NEU }) },
      { name: 'Woord', type: 'seq', intro: 'Tik zodra je het woord NU! ziet', items: ['WACHT', 'NEE', 'STOP', 'NIET', 'HOU VOL'], target: 'NU!', r: (i) => ({ html: i, bg: NEU }) },
      { name: 'Positie', type: 'dot', intro: 'Tik zo snel mogelijk op het gele rondje' },
      { name: 'Kleurwissel', type: 'seq', intro: 'Tik zodra het scherm BLAUW wordt', items: ['#c62828', '#f9a825', '#6a1b9a', '#ef6c00', '#2e7d32'], target: '#1565c0', r: (i) => ({ html: '', bg: i }) },
      { name: 'Kant', type: 'side', intro: 'Tik op de kant van het scherm waar de ster verschijnt' },
      { name: 'Dier', type: 'seq', intro: 'Tik zodra je de KIKKER ziet', items: ['🐱', '🐶', '🐭', '🐰', '🐻'], target: '🐸', r: (i) => ({ html: i, bg: NEU }) },
    ];

    let idx = 0, phase = 'idle', tStim = 0, pen = 0, rts = [], timers = [], side = 0, dotC = null, ended = false;

    function later(fn, ms) { const id = setTimeout(fn, ms); timers.push(id); return id; }
    function clearAll() { timers.forEach(clearTimeout); timers = []; }
    function show(html, bg, subtxt, size) {
      stage.style.background = bg || NEU;
      big.style.fontSize = (size || 64) + 'px';
      big.textContent = html; sub.textContent = subtxt || '';
      dot.style.display = 'none';
    }
    function setHead() { head.textContent = 'Test ' + (idx + 1) + ' van ' + TESTS.length + ' - ' + TESTS[idx].name; }

    function beginTest() {
      clearAll(); pen = 0; phase = 'idle'; setHead();
      show('', NEU, TESTS[idx].intro);
      sub.style.fontSize = '22px';
      later(run, 1700);
    }

    function go() { phase = 'go'; tStim = performance.now(); later(() => { if (phase === 'go') record(2000); }, 2500); }

    function run() {
      const t = TESTS[idx];
      phase = 'wait';
      sub.style.fontSize = '20px';
      const d = 1000 + Math.random() * 2000;
      if (t.type === 'color') {
        show('Wacht...', '#c62828', '');
        later(() => { show('TIK!', '#2e7d32', ''); go(); }, d);
      } else if (t.type === 'seq') {
        show('+', NEU, 'Wacht...');
        const k = 2 + Math.floor(Math.random() * 4);
        later(() => {
          let prev = -1;
          const step = (i) => {
            if (i < k) {
              let j; do { j = Math.floor(Math.random() * t.items.length); } while (j === prev);
              prev = j;
              const r = t.r(t.items[j]); show(r.html, r.bg, '', 90);
              later(() => step(i + 1), 800);
            } else {
              const r = t.r(t.target); show(r.html, r.bg, '', 90); go();
            }
          };
          step(0);
        }, d * 0.6);
      } else if (t.type === 'dot') {
        show('+', NEU, 'Wacht...');
        later(() => {
          const w = stage.clientWidth || 360, h = stage.clientHeight || 640;
          dotC = { x: 50 + Math.random() * (w - 100), y: 110 + Math.random() * (h - 220) };
          dot.style.left = (dotC.x - 35) + 'px'; dot.style.top = (dotC.y - 35) + 'px'; dot.style.display = 'block';
          sub.textContent = ''; go();
        }, d);
      } else if (t.type === 'side') {
        show('+', NEU, 'Wacht...');
        later(() => {
          side = Math.random() < 0.5 ? 0 : 1;
          big.textContent = '';
          const star = document.createElement('div');
          star.textContent = '⭐';
          star.style.cssText = 'position:absolute;top:45%;font-size:80px;' + (side === 0 ? 'left:8%' : 'right:8%');
          star.className = 'rx-star';
          stage.appendChild(star);
          sub.textContent = ''; go();
        }, d);
      }
    }

    function clearStars() { stage.querySelectorAll('.rx-star').forEach((n) => n.remove()); }

    function record(rt) {
      if (phase === 'result') return;
      clearAll(); clearStars();
      phase = 'result';
      const total = Math.round(rt + pen);
      rts.push(total);
      const avg = rts.reduce((a, b) => a + b, 0) / rts.length;
      api.score(Math.max(0, Math.round(2000 - 4 * avg)));
      const good = total < 350;
      show(total + ' ms', good ? '#1b5e20' : total < 600 ? '#e65100' : '#b71c1c', total >= 2000 ? 'Te traag!' : pen ? 'Inclusief ' + pen + ' ms straf' : good ? 'Bliksemsnel!' : 'Prima');
      later(() => { idx++; if (idx >= TESTS.length) finish(); else beginTest(); }, 1200);
    }

    function falseStart() {
      clearAll(); clearStars();
      pen += 150; phase = 'idle';
      show('Te vroeg!', '#b71c1c', '+150 ms straf. We doen deze test opnieuw.', 54);
      later(run, 1500);
    }

    function finish() {
      if (ended) return;
      ended = true;
      const avg = rts.reduce((a, b) => a + b, 0) / rts.length;
      const score = Math.max(0, Math.round(2000 - 4 * avg));
      head.textContent = 'Klaar!';
      show(Math.round(avg) + ' ms', '#1f2a44', 'Gemiddelde reactietijd van ' + rts.length + ' tests', 64);
      api.score(score);
      later(() => api.end(score), 2200);
    }

    function handle(x, y) {
      if (ended) return;
      const t = TESTS[idx];
      if (phase === 'wait') { falseStart(); return; }
      if (phase !== 'go') return;
      const rt = performance.now() - tStim;
      if (t.type === 'dot') {
        if (x === null || !dotC) return;
        if (Math.hypot(x - dotC.x, y - dotC.y) > 50) return;
        record(rt);
      } else if (t.type === 'side') {
        if (x === null) return;
        const w = stage.clientWidth || 360;
        const correct = (x < w / 2) === (side === 0);
        record(correct ? rt : rt + 400);
      } else record(rt);
    }

    function onDown(e) {
      e.preventDefault();
      const r = stage.getBoundingClientRect();
      handle(e.clientX - r.left, e.clientY - r.top);
    }
    function onKey(e) { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) handle(null, null); } }
    stage.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    beginTest();

    return {
      destroy() {
        clearAll();
        stage.removeEventListener('pointerdown', onDown);
        window.removeEventListener('keydown', onKey);
        stage.remove();
      },
    };
  },
};
