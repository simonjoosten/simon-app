const SNAKES = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
const LADDERS = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };
const DICE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
export default {
  id: 'slangenladders',
  name: 'Slangen en Ladders',
  emoji: '🐍',
  hint: 'Gooi de dobbelsteen: ladders omhoog, slangen omlaag. Eerst op 100 wint',
  create(host, api) {
    host.style.touchAction = 'manipulation';
    host.style.background = '#1b4332';
    let dead = false, ended = false, busy = false, over = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
    let pos = [0, 0], turn = 0, streak = 0, msg = 'Gooi de dobbelsteen!', die = 0;
    const NAME = ['Jij', 'Computer'];
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;font-family:system-ui,sans-serif;color:#fff;padding:8px;box-sizing:border-box;user-select:none;-webkit-user-select:none';
    host.appendChild(root);
    const B = Math.floor(Math.min(api.w - 16, api.h - 200, 420));
    const CS = B / 10;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    root.innerHTML = '<div style="width:100%;display:flex;justify-content:space-between;font-weight:800;font-size:15px"><span>🐍 Slangen en Ladders</span><span data-r="st"></span></div>' +
      '<div data-r="wrap" style="position:relative;width:' + B + 'px;height:' + B + 'px;margin-top:8px;border-radius:6px;overflow:hidden"><canvas data-r="cv"></canvas></div>' +
      '<div data-r="msg" style="margin:8px 6px 2px;font-weight:800;font-size:16px;min-height:42px;text-align:center"></div>' +
      '<div style="display:flex;align-items:center;gap:16px"><div data-r="die" style="font-size:54px;line-height:1;min-width:60px;text-align:center">🎲</div>' +
      '<button data-r="btn" style="font:inherit;font-weight:900;border:0;border-radius:14px;padding:13px 26px;font-size:19px;color:#fff;background:#d98a00;cursor:pointer">🎲 Gooi</button></div>';
    const q = (n) => root.querySelector('[data-r="' + n + '"]');
    const wrap = q('wrap'), cv = q('cv'), elMsg = q('msg'), elDie = q('die'), elBtn = q('btn'), elSt = q('st');
    cv.width = B * dpr; cv.height = B * dpr; cv.style.cssText = 'width:' + B + 'px;height:' + B + 'px;display:block';
    function xy(n) {
      const i = n - 1, row = Math.floor(i / 10), k = i % 10, col = row % 2 === 0 ? k : 9 - k;
      return { x: col * CS, y: (9 - row) * CS, cx: col * CS + CS / 2, cy: (9 - row) * CS + CS / 2 };
    }
    function drawBoard() {
      const g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (let n = 1; n <= 100; n++) {
        const p = xy(n);
        g.fillStyle = n % 2 ? '#f1e6c4' : '#d9c88f';
        if (n === 100) g.fillStyle = '#ffd54a';
        g.fillRect(p.x, p.y, CS, CS);
        g.fillStyle = 'rgba(60,40,10,.7)';
        g.font = 'bold ' + Math.floor(CS * 0.3) + 'px system-ui';
        g.textAlign = 'left'; g.textBaseline = 'top';
        g.fillText(String(n), p.x + 2, p.y + 1);
      }
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = Math.floor(CS * 0.7) + 'px serif';
      const e100 = xy(100); g.fillText('🏆', e100.cx, e100.cy + 3);
      // ladders
      g.lineCap = 'round';
      for (const [a, b] of Object.entries(LADDERS)) {
        const p = xy(Number(a)), r = xy(b);
        const dx = r.cx - p.cx, dy = r.cy - p.cy, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy * CS * 0.16, ny = ux * CS * 0.16;
        g.strokeStyle = '#8b5a2b'; g.lineWidth = Math.max(3, CS * 0.1);
        g.beginPath(); g.moveTo(p.cx + nx, p.cy + ny); g.lineTo(r.cx + nx, r.cy + ny); g.moveTo(p.cx - nx, p.cy - ny); g.lineTo(r.cx - nx, r.cy - ny); g.stroke();
        g.lineWidth = Math.max(2, CS * 0.07);
        for (let t = CS * 0.4; t < len - CS * 0.2; t += CS * 0.38) { g.beginPath(); g.moveTo(p.cx + ux * t + nx, p.cy + uy * t + ny); g.lineTo(p.cx + ux * t - nx, p.cy + uy * t - ny); g.stroke(); }
      }
      // slangen
      const cols = ['#2e9e4f', '#d1495b', '#3b82c4', '#e0a100', '#7c4dbe'];
      let ci = 0;
      for (const [a, b] of Object.entries(SNAKES)) {
        const head = xy(Number(a)), tail = xy(b);
        const dx = tail.cx - head.cx, dy = tail.cy - head.cy, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
        const col = cols[ci++ % cols.length];
        const pts = [];
        const steps = 24;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps, w = Math.sin(t * Math.PI * 3) * CS * 0.35 * (0.4 + 0.6 * Math.sin(t * Math.PI));
          pts.push([head.cx + dx * t + nx * w, head.cy + dy * t + ny * w]);
        }
        g.strokeStyle = col; g.lineWidth = Math.max(4, CS * 0.2);
        g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = Math.max(1.5, CS * 0.06); g.setLineDash([CS * 0.12, CS * 0.18]);
        g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); g.setLineDash([]);
        g.fillStyle = col; g.beginPath(); g.arc(head.cx, head.cy, CS * 0.2, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(head.cx - CS * 0.07, head.cy - CS * 0.05, CS * 0.05, 0, 7); g.arc(head.cx + CS * 0.07, head.cy - CS * 0.05, CS * 0.05, 0, 7); g.fill();
        g.fillStyle = '#111'; g.beginPath(); g.arc(head.cx - CS * 0.07, head.cy - CS * 0.05, CS * 0.02, 0, 7); g.arc(head.cx + CS * 0.07, head.cy - CS * 0.05, CS * 0.02, 0, 7); g.fill();
      }
    }
    drawBoard();
    const tok = ['🙂', '🤖'].map((e, i) => {
      const t = document.createElement('div');
      t.style.cssText = 'position:absolute;width:' + CS * 0.5 + 'px;height:' + CS * 0.5 + 'px;border-radius:50%;background:' + (i ? '#1971c2' : '#e03131') + ';border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:' + CS * 0.32 + 'px;z-index:3;transition:left .17s,top .17s;box-shadow:0 2px 4px rgba(0,0,0,.5)';
      t.textContent = e;
      wrap.appendChild(t);
      return t;
    });
    let slideMs = 170;
    function place(i) {
      const n = pos[i];
      const base = n === 0 ? { x: 0, y: 9 * CS + CS * 0.5 } : xy(n);
      const same = pos[0] === pos[1] && n > 0;
      const dx = same ? (i ? CS * 0.5 : 0) : CS * 0.25;
      tok[i].style.transition = 'left ' + slideMs + 'ms,top ' + slideMs + 'ms';
      tok[i].style.left = base.x + dx + 'px';
      tok[i].style.top = base.y + (n === 0 ? 0 : CS * 0.25) + 'px';
    }
    function ui() {
      elMsg.textContent = msg;
      elDie.textContent = die ? DICE[die - 1] : '🎲';
      elSt.textContent = '🔥 Reeks ' + streak;
      elBtn.style.display = !busy || over ? '' : 'none';
      elBtn.textContent = over ? '▶ Nog een spel' : '🎲 Gooi';
      place(0); place(1);
    }
    function turnFor(who) {
      busy = true; ui();
      die = 1 + Math.floor(Math.random() * 6);
      // rolanimatie
      let k = 0;
      const roll = () => {
        if (k++ < 6) { elDie.textContent = DICE[Math.floor(Math.random() * 6)]; later(roll, 70); return; }
        elDie.textContent = DICE[die - 1];
        move(who);
      };
      msg = NAME[who] + ' gooit...'; elMsg.textContent = msg;
      roll();
    }
    function move(who) {
      const start = pos[who], target = start + die;
      if (target > 100) { msg = NAME[who] + ' gooit ' + die + ': te veel, blijft staan'; ui(); later(() => next(who), 1100); return; }
      msg = NAME[who] + ' gooit ' + die;
      ui();
      let cur = start;
      const step = () => {
        if (cur < target) {
          cur++; pos[who] = cur; ui(); later(step, 200); return;
        }
        // einde lopen
        if (LADDERS[cur]) { msg = NAME[who] + ': ladder omhoog! 🪜'; ui(); later(() => { slideMs = 700; pos[who] = LADDERS[cur]; ui(); later(() => landed(who), 900); }, 500); return; }
        if (SNAKES[cur]) { msg = NAME[who] + ': een slang! 🐍'; ui(); later(() => { slideMs = 700; pos[who] = SNAKES[cur]; ui(); later(() => landed(who), 900); }, 500); return; }
        landed(who);
      };
      later(step, 250);
    }
    function landed(who) {
      slideMs = 170; ui();
      if (pos[who] === 100) { endGame(who); return; }
      if (die === 6) { msg = NAME[who] + ' gooide 6: nog een keer!'; ui(); later(() => { if (who === 0) { busy = false; msg = 'Een 6! Gooi nog een keer'; ui(); } else turnFor(1); }, 900); return; }
      later(() => next(who), 400);
    }
    function next(who) {
      if (who === 0) { turn = 1; msg = 'Computer is aan de beurt'; ui(); later(() => turnFor(1), 700); }
      else { turn = 0; busy = false; msg = 'Jouw beurt!'; ui(); }
    }
    function endGame(who) {
      over = true; busy = false;
      if (who === 0) { streak++; api.score(streak); msg = '🎉 Je staat op 100: jij wint!'; ui(); }
      else {
        msg = '😞 De computer wint...'; ui(); elBtn.style.display = 'none';
        later(() => { if (!ended) { ended = true; api.end(streak); } }, 1600);
      }
    }
    function onBtn() {
      if (ended) return;
      if (over) { pos = [0, 0]; over = false; busy = false; die = 0; msg = 'Nieuw spel! Gooi de dobbelsteen.'; ui(); return; }
      if (busy || turn !== 0) return;
      turnFor(0);
    }
    elBtn.addEventListener('click', onBtn);
    api.score(0); ui();
    return {
      destroy() {
        dead = true; timers.forEach(clearTimeout); timers.clear();
        elBtn.removeEventListener('click', onBtn);
        if (root.parentNode) root.parentNode.removeChild(root);
      },
    };
  },
};
