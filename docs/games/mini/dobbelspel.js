export default {
  id: 'dobbelspel',
  name: 'Dobbelspel',
  emoji: '🎲',
  hint: 'Gooi tot 3 keer, tik dobbelstenen om vast te houden en kies per ronde een categorie. 8 rondes!',
  create(host, api) {
    host.style.touchAction = 'none';
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;background:linear-gradient(160deg,#064e3b,#14532d);color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:8px;box-sizing:border-box;padding:10px;user-select:none;overflow:hidden';
    host.appendChild(root);
    let dead = false, ended = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); };

    const info = document.createElement('div');
    info.style.cssText = 'font-size:16px;font-weight:700;text-align:center;min-height:22px';
    const diceRow = document.createElement('div');
    diceRow.style.cssText = 'display:flex;gap:6px;justify-content:center';
    const dsz = Math.min(60, Math.floor((api.w - 20 - 24) / 5));
    const diceEls = [];
    for (let i = 0; i < 5; i++) {
      const b = document.createElement('button');
      b.style.cssText = `width:${dsz}px;height:${dsz + 8}px;border:3px solid transparent;border-radius:12px;background:#fff;color:#111;font-size:${Math.floor(dsz * 0.9)}px;line-height:1;padding:0;cursor:pointer;touch-action:manipulation`;
      b.addEventListener('click', () => toggleHold(i));
      diceRow.appendChild(b);
      diceEls.push(b);
    }
    const rollBtn = document.createElement('button');
    rollBtn.style.cssText = 'width:100%;max-width:340px;min-height:48px;border:0;border-radius:12px;background:#f59e0b;color:#fff;font-size:18px;font-weight:700;cursor:pointer;touch-action:manipulation';
    rollBtn.addEventListener('click', roll);
    const msg = document.createElement('div');
    msg.style.cssText = 'font-size:14px;min-height:18px;color:#fde68a;text-align:center';
    const catGrid = document.createElement('div');
    catGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:6px;width:100%;max-width:380px';
    root.append(info, diceRow, rollBtn, msg, catGrid);

    const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    const counts = d => { const c = [0, 0, 0, 0, 0, 0, 0]; d.forEach(v => c[v]++); return c; };
    const sum = d => d.reduce((a, b) => a + b, 0);
    const hasStraight = (d, len) => {
      const s = new Set(d);
      for (let st = 1; st + len - 1 <= 6; st++) {
        let ok = true;
        for (let k = 0; k < len; k++) if (!s.has(st + k)) ok = false;
        if (ok) return true;
      }
      return false;
    };
    const CATS = [
      { id: 'e1', n: 'Enen', f: d => counts(d)[1] * 1 },
      { id: 'e2', n: 'Tweeën', f: d => counts(d)[2] * 2 },
      { id: 'e3', n: 'Drieën', f: d => counts(d)[3] * 3 },
      { id: 'e4', n: 'Vieren', f: d => counts(d)[4] * 4 },
      { id: 'e5', n: 'Vijven', f: d => counts(d)[5] * 5 },
      { id: 'e6', n: 'Zessen', f: d => counts(d)[6] * 6 },
      { id: 'd3', n: 'Drie gelijk', f: d => counts(d).some(c => c >= 3) ? sum(d) : 0 },
      { id: 'd4', n: 'Carré', f: d => counts(d).some(c => c >= 4) ? sum(d) : 0 },
      { id: 'fh', n: 'Full house', f: d => { const c = counts(d).filter(Boolean).sort(); return (c.length === 2 && c[0] === 2 && c[1] === 3) ? 25 : 0; } },
      { id: 'ks', n: 'Kleine straat', f: d => hasStraight(d, 4) ? 30 : 0 },
      { id: 'gs', n: 'Grote straat', f: d => hasStraight(d, 5) ? 40 : 0 },
      { id: 'yz', n: 'Yahtzee!', f: d => counts(d).some(c => c === 5) ? 50 : 0 },
      { id: 'ch', n: 'Chance', f: d => sum(d) },
    ];
    const catEls = [];
    CATS.forEach((c, i) => {
      const b = document.createElement('button');
      b.style.cssText = 'display:flex;justify-content:space-between;align-items:center;min-height:36px;padding:0 10px;border:0;border-radius:8px;font-size:14px;cursor:pointer;touch-action:manipulation;text-align:left';
      b.addEventListener('click', () => pick(i));
      catGrid.appendChild(b);
      catEls.push(b);
    });

    let dice = [1, 1, 1, 1, 1], held = [false, false, false, false, false], throwsLeft = 3, round = 1, total = 0;
    const scored = Array(CATS.length).fill(null);
    let locked = false;

    function render() {
      info.textContent = `Ronde ${Math.min(round, 8)} van 8 · Score: ${total}`;
      const rolled = throwsLeft < 3;
      for (let i = 0; i < 5; i++) {
        diceEls[i].textContent = rolled ? FACES[dice[i] - 1] : '?';
        diceEls[i].style.borderColor = held[i] ? '#ef4444' : 'transparent';
        diceEls[i].style.background = held[i] ? '#fecaca' : '#fff';
      }
      rollBtn.textContent = throwsLeft === 3 ? '🎲 Gooi!' : throwsLeft > 0 ? `🎲 Gooi opnieuw (${throwsLeft} over)` : 'Kies een categorie';
      rollBtn.style.opacity = throwsLeft > 0 && !locked ? '1' : '.5';
      CATS.forEach((c, i) => {
        const b = catEls[i];
        if (scored[i] !== null) {
          b.style.background = 'rgba(0,0,0,.35)';
          b.style.color = '#9ca3af';
          b.innerHTML = `<span>${c.n}</span><b>${scored[i]}</b>`;
        } else {
          const pot = rolled ? c.f(dice) : '';
          b.style.background = rolled ? (pot > 0 ? '#fff' : '#e5e7eb') : 'rgba(255,255,255,.55)';
          b.style.color = '#111';
          b.innerHTML = `<span>${c.n}</span><b>${rolled ? pot : ''}</b>`;
        }
      });
    }
    function roll() {
      if (dead || locked || throwsLeft <= 0) return;
      for (let i = 0; i < 5; i++) if (!held[i] || throwsLeft === 3) dice[i] = 1 + Math.floor(Math.random() * 6);
      throwsLeft--;
      msg.textContent = throwsLeft > 0 ? 'Tik dobbelstenen om ze vast te houden' : 'Kies nu een categorie';
      render();
    }
    function toggleHold(i) {
      if (dead || locked || throwsLeft === 3 || throwsLeft === 0) return;
      held[i] = !held[i];
      render();
    }
    function pick(i) {
      if (dead || locked || throwsLeft === 3 || scored[i] !== null) return;
      const v = CATS[i].f(dice);
      scored[i] = v;
      total += v;
      api.score(total);
      msg.textContent = `${CATS[i].n}: +${v}`;
      round++;
      held = [false, false, false, false, false];
      throwsLeft = 3;
      if (round > 8) {
        locked = true;
        render();
        info.textContent = `Klaar! Totaal: ${total} 🎉`;
        later(() => { if (!ended) { ended = true; api.end(total); } }, 2000);
        return;
      }
      render();
    }
    api.score(0);
    render();
    msg.textContent = 'Gooi de dobbelstenen!';
    return {
      destroy() {
        dead = true;
        timers.forEach(clearTimeout);
        timers.clear();
        root.remove();
      },
    };
  },
};
