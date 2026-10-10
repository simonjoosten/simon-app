export default {
  id: 'rekensprint',
  name: 'Rekensprint',
  emoji: '🧮',
  hint: 'Los zoveel mogelijk sommen op in 30 seconden',
  create(host, api) {
    host.style.touchAction = 'manipulation';
    host.style.background = '#15324a';
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;font-family:system-ui,sans-serif;color:#fff;padding:14px 14px 18px;box-sizing:border-box;user-select:none;-webkit-user-select:none';
    root.innerHTML =
      '<div style="width:100%;display:flex;justify-content:space-between;font-size:22px;font-weight:800"><span data-r="time"></span><span data-r="score"></span></div>' +
      '<div style="width:100%;height:8px;background:rgba(255,255,255,.15);border-radius:4px;margin:8px 0 0;overflow:hidden"><div data-r="bar" style="height:100%;width:100%;background:#4ad66d"></div></div>' +
      '<div data-r="lvl" style="margin-top:10px;font-size:14px;opacity:.75"></div>' +
      '<div data-r="q" style="flex:1;display:flex;align-items:center;justify-content:center;font-size:54px;font-weight:800;text-align:center"></div>' +
      '<div data-r="ans" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:380px"></div>';
    host.appendChild(root);
    const q = n => root.querySelector('[data-r="' + n + '"]');
    const elTime = q('time'), elScore = q('score'), elBar = q('bar'), elQ = q('q'), elAns = q('ans'), elLvl = q('lvl');

    const TOTAL = 30;
    let dead = false, done = false, iv = 0, tm = 0;
    let startMs = Date.now(), penalty = 0, correct = 0, answer = 0, locked = false, over = false;
    const btns = [];
    for (let i = 0; i < 4; i++) {
      const b = document.createElement('button');
      b.style.cssText = 'height:76px;border:0;border-radius:16px;background:#2f6fb5;color:#fff;font-size:30px;font-weight:800;cursor:pointer;touch-action:manipulation';
      b.addEventListener('click', () => pick(i));
      elAns.appendChild(b); btns.push(b);
    }
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    function level() { return Math.floor(correct / 4); }
    function makeQ() {
      const L = Math.min(level(), 7);
      let a, b, op, ans;
      const r = Math.random();
      if (L === 0) { a = rnd(1, 9); b = rnd(1, 9); op = '+'; }
      else if (L === 1) { if (r < 0.5) { a = rnd(5, 20); b = rnd(1, 10); op = '+'; } else { a = rnd(8, 20); b = rnd(1, a - 1); op = '-'; } }
      else if (L === 2) { if (r < 0.4) { a = rnd(10, 50); b = rnd(5, 40); op = '+'; } else if (r < 0.7) { a = rnd(20, 60); b = rnd(1, 19); op = '-'; } else { a = rnd(2, 5); b = rnd(2, 5); op = '×'; } }
      else if (L === 3) { if (r < 0.5) { a = rnd(2, 10); b = rnd(2, 6); op = '×'; } else if (r < 0.75) { a = rnd(30, 99); b = rnd(10, 60); op = '+'; } else { a = rnd(40, 99); b = rnd(10, 39); op = '-'; } }
      else if (L === 4) { if (r < 0.6) { a = rnd(3, 12); b = rnd(3, 12); op = '×'; } else if (r < 0.8) { a = rnd(50, 150); b = rnd(20, 90); op = '+'; } else { a = rnd(60, 150); b = rnd(20, 59); op = '-'; } }
      else if (L === 5) { if (r < 0.5) { a = rnd(6, 15); b = rnd(6, 12); op = '×'; } else if (r < 0.75) { a = rnd(100, 400); b = rnd(50, 300); op = '+'; } else { a = rnd(150, 500); b = rnd(40, 149); op = '-'; } }
      else if (L === 6) { if (r < 0.65) { a = rnd(7, 19); b = rnd(7, 14); op = '×'; } else if (r < 0.85) { a = rnd(200, 800); b = rnd(100, 600); op = '+'; } else { a = rnd(300, 900); b = rnd(100, 299); op = '-'; } }
      else { if (r < 0.7) { a = rnd(11, 25); b = rnd(11, 19); op = '×'; } else if (r < 0.85) { a = rnd(300, 999); b = rnd(300, 999); op = '+'; } else { a = rnd(500, 999); b = rnd(100, 499); op = '-'; } }
      ans = op === '+' ? a + b : op === '-' ? a - b : a * b;
      return { text: a + ' ' + op + ' ' + b, ans };
    }
    function showQ() {
      const qq = makeQ();
      answer = qq.ans;
      elQ.textContent = qq.text + ' = ?';
      const set = new Set([answer]);
      const spread = Math.max(3, Math.round(Math.abs(answer) * 0.15));
      let guard = 0;
      while (set.size < 4 && guard++ < 200) {
        let w = answer + rnd(-spread, spread);
        if (Math.random() < 0.3) w = answer + (Math.random() < 0.5 ? 10 : -10);
        if (w >= 0 && w !== answer) set.add(w);
      }
      let n = 1;
      while (set.size < 4) set.add(answer + n++);
      const arr = Array.from(set).sort(() => Math.random() - 0.5);
      btns.forEach((b, i) => { b.textContent = String(arr[i]); b.dataset.v = String(arr[i]); b.style.background = '#2f6fb5'; });
      elLvl.textContent = 'Niveau ' + (level() + 1);
      locked = false;
    }
    function pick(i) {
      if (locked || over || dead) return;
      locked = true;
      const b = btns[i];
      if (Number(b.dataset.v) === answer) {
        correct++; api.score(correct); elScore.textContent = '⭐ ' + correct;
        b.style.background = '#2e9e57';
        tm = setTimeout(() => { if (!dead && !over) showQ(); }, 180);
      } else {
        penalty += 1500;
        b.style.background = '#c0394b';
        btns.forEach(x => { if (Number(x.dataset.v) === answer) x.style.background = '#2e9e57'; });
        tm = setTimeout(() => { if (!dead && !over) showQ(); }, 600);
      }
    }
    function tick() {
      const left = Math.max(0, TOTAL - (Date.now() - startMs + penalty) / 1000);
      elTime.textContent = '⏱ ' + Math.ceil(left);
      elTime.style.color = left < 6 ? '#ff8080' : '#fff';
      elBar.style.width = (left / TOTAL * 100) + '%';
      if (left <= 0 && !over) {
        over = true; clearInterval(iv); locked = true;
        elQ.textContent = 'Tijd is om!';
        tm = setTimeout(() => { if (!dead && !done) { done = true; api.end(correct); } }, 1200);
      }
    }
    api.score(0);
    elScore.textContent = '⭐ 0';
    showQ();
    tick();
    iv = setInterval(tick, 100);
    const onKey = e => {
      const i = ['1', '2', '3', '4'].indexOf(e.key);
      if (i >= 0) pick(i);
    };
    window.addEventListener('keydown', onKey);
    return {
      destroy() {
        dead = true; clearInterval(iv); clearTimeout(tm);
        window.removeEventListener('keydown', onKey);
        if (root.parentNode === host) host.removeChild(root);
      },
    };
  },
};
