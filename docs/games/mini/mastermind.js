export default {
  id: 'mastermind', name: 'Mastermind', emoji: '🎯', hint: 'Raad de code van 4 kleuren in 8 pogingen. Zwart = goed, wit = andere plek',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#1d2a1f'; host.style.fontFamily = 'system-ui,sans-serif'; host.style.color = '#fff';
    host.style.display = 'flex'; host.style.flexDirection = 'column'; host.style.alignItems = 'center'; host.style.padding = '8px 0'; host.style.boxSizing = 'border-box'; host.style.gap = '6px';
    const mk = (tag, css, txt) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; };
    const COLS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00', '#26c6da'];
    const ROUNDS = 6, TRIES = 8, LEN = 4;
    const NC = [5, 5, 6, 6, 7, 7];
    let dead = false, ended = false, busy = false;
    const timers = [];
    const later = (fn, ms) => { const id = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(id); };
    let round = 1, code = [], guesses = [], cur = [-1, -1, -1, -1], score = 0, reveal = false, msg = '';

    const info = mk('div', 'font-size:17px;font-weight:700;text-align:center;min-height:42px;line-height:1.3;white-space:pre-line');
    const rowsEl = mk('div', 'display:flex;flex-direction:column;gap:5px;align-items:center');
    const pal = mk('div', 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;max-width:' + (api.w - 20) + 'px');
    const act = mk('div', 'display:flex;gap:10px');
    host.appendChild(info); host.appendChild(rowsEl); host.appendChild(pal); host.appendChild(act);
    const rh = Math.max(30, Math.min(48, Math.floor((api.h - 235) / TRIES))), dot = Math.floor(rh * 0.72);
    const pb = Math.max(36, Math.min(48, Math.floor((api.w - 30) / 7) - 8));
    const delB = mk('button', 'padding:10px 18px;border-radius:12px;border:0;background:#8a3b3b;color:#fff;font-weight:800;font-size:16px;cursor:pointer', '⌫ Wis');
    const okB = mk('button', 'padding:10px 26px;border-radius:12px;border:0;background:#2e9a4d;color:#fff;font-weight:800;font-size:16px;cursor:pointer', '✔ Raad');
    act.appendChild(delB); act.appendChild(okB);

    function newCode() {
      const k = NC[round - 1]; code = [];
      for (let i = 0; i < LEN; i++) code.push(Math.floor(Math.random() * k));
      guesses = []; cur = [-1, -1, -1, -1]; reveal = false; msg = '';
    }
    function evalG(g) {
      let b = 0, w = 0; const cc = {}, gc = {};
      for (let i = 0; i < LEN; i++) {
        if (g[i] === code[i]) b++; else { cc[code[i]] = (cc[code[i]] || 0) + 1; gc[g[i]] = (gc[g[i]] || 0) + 1; }
      }
      for (const k in gc) w += Math.min(gc[k], cc[k] || 0);
      return { b, w };
    }
    function circle(color, size, extra) {
      return mk('div', 'width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:' + color + ';box-sizing:border-box;' + (extra || ''));
    }
    function renderPal() {
      pal.textContent = '';
      for (let c = 0; c < NC[round - 1]; c++) {
        const b = circle(COLS[c], pb, 'cursor:pointer;border:3px solid #ffffff55');
        b.addEventListener('pointerdown', () => pick(c));
        pal.appendChild(b);
      }
    }
    function render() {
      info.textContent = 'Ronde ' + round + '/' + ROUNDS + '   Score ' + score + '\n' + (msg || ('Poging ' + Math.min(guesses.length + 1, TRIES) + ' van ' + TRIES + ' - ' + NC[round - 1] + ' kleuren'));
      rowsEl.textContent = '';
      for (let r = 0; r < TRIES; r++) {
        const row = mk('div', 'display:flex;align-items:center;gap:8px;padding:2px 8px;border-radius:12px;background:' + (r === guesses.length && !ended && !reveal ? '#2b4130' : '#222e24'));
        const g = guesses[r];
        for (let i = 0; i < LEN; i++) {
          let color = '#34413a', ex = 'border:2px solid #4b5a50';
          if (g) { color = COLS[g.g[i]]; ex = ''; }
          else if (r === guesses.length) {
            if (cur[i] >= 0) { color = COLS[cur[i]]; ex = 'border:2px solid #fff;cursor:pointer'; } else ex = 'border:2px dashed #8aa;cursor:pointer';
          }
          const d = circle(color, dot, ex);
          if (!g && r === guesses.length) d.addEventListener('pointerdown', () => { if (!busy && !ended) { cur[i] = -1; render(); } });
          row.appendChild(d);
        }
        const peg = mk('div', 'display:grid;grid-template-columns:1fr 1fr;gap:3px;width:' + Math.floor(rh * 0.72) + 'px;margin-left:6px');
        for (let k = 0; k < LEN; k++) {
          let c = '#34413a';
          if (g) c = k < g.b ? '#111' : (k < g.b + g.w ? '#fff' : '#34413a');
          peg.appendChild(circle(c, Math.floor(rh * 0.3), 'border:1px solid #6a7a70'));
        }
        row.appendChild(peg); rowsEl.appendChild(row);
      }
      if (reveal) {
        const row = mk('div', 'display:flex;gap:8px;align-items:center;font-size:14px;font-weight:700;margin-top:2px', 'Code:');
        code.forEach(c => row.appendChild(circle(COLS[c], Math.floor(dot * 0.8))));
        rowsEl.appendChild(row);
      }
    }
    function pick(c) {
      if (busy || ended) return;
      const i = cur.indexOf(-1); if (i < 0) return;
      cur[i] = c; render();
    }
    delB.addEventListener('click', () => {
      if (busy || ended) return;
      for (let i = LEN - 1; i >= 0; i--) if (cur[i] >= 0) { cur[i] = -1; break; }
      render();
    });
    okB.addEventListener('click', submit);
    function submit() {
      if (busy || ended || cur.includes(-1)) return;
      const g = cur.slice(), res = evalG(g);
      guesses.push({ g, b: res.b, w: res.w }); cur = [-1, -1, -1, -1];
      if (res.b === LEN) {
        const bonus = (TRIES + 1 - guesses.length) * 40 + round * 10;
        score += bonus; api.score(score); busy = true; reveal = true; msg = 'Goed! +' + bonus + ' punten 🎉'; render();
        if (round >= ROUNDS) { ended = true; later(() => api.end(score), 1400); return; }
        later(() => { round++; newCode(); busy = false; renderPal(); render(); }, 1600);
      } else if (guesses.length >= TRIES) {
        ended = true; reveal = true; msg = 'Helaas, niet geraden!'; render();
        later(() => api.end(score), 1800);
      } else render();
    }
    const onKey = (e) => {
      const k = e.key;
      if (k >= '1' && k <= '7' && +k <= NC[round - 1]) pick(+k - 1);
      else if (k === 'Backspace') delB.click();
      else if (k === 'Enter') submit();
    };
    window.addEventListener('keydown', onKey);
    newCode(); renderPal(); render(); api.score(0);
    return { destroy() { dead = true; timers.forEach(clearTimeout); window.removeEventListener('keydown', onKey); } };
  },
};
