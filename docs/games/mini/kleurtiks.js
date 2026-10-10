export default {
  id: 'kleurtiks',
  name: 'Kleurtiks',
  emoji: '🎨',
  hint: 'Tik snel de tegel met de genoemde kleur',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#1d1b2f';
    host.style.userSelect = 'none';
    const COLORS = [
      { n: 'ROOD', c: '#e53935' }, { n: 'BLAUW', c: '#1e88e5' }, { n: 'GROEN', c: '#43a047' }, { n: 'GEEL', c: '#fdd835' },
      { n: 'ORANJE', c: '#fb8c00' }, { n: 'PAARS', c: '#8e24aa' }, { n: 'ROZE', c: '#f48fb1' }, { n: 'TURKOOIS', c: '#00bcd4' },
    ];
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;font-family:system-ui,sans-serif;color:#fff;box-sizing:border-box;padding:12px';
    const top = document.createElement('div');
    top.style.cssText = 'display:flex;justify-content:space-between;font-size:18px;font-weight:700;margin-bottom:6px';
    const elScore = document.createElement('span'), elTime = document.createElement('span'), elStreak = document.createElement('span');
    top.append(elScore, elStreak, elTime);
    const bar = document.createElement('div');
    bar.style.cssText = 'height:8px;border-radius:4px;background:rgba(255,255,255,.2);overflow:hidden;margin-bottom:10px';
    const barIn = document.createElement('div');
    barIn.style.cssText = 'height:100%;width:100%;background:#80ed99';
    bar.appendChild(barIn);
    const prompt = document.createElement('div');
    prompt.style.cssText = 'text-align:center;min-height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center';
    const grid = document.createElement('div');
    grid.style.cssText = 'flex:1;display:grid;gap:10px;margin-top:10px';
    root.append(top, bar, prompt, grid);
    host.appendChild(root);

    const TOTAL = 30;
    let timeLeft = TOTAL, score = 0, streak = 0, answered = 0, target = null, raf = 0, alive = true, last = performance.now();
    let ended = false, endTimer = 0, flashT = 0;

    function pick(n, arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      return a.slice(0, n);
    }

    function nextQ() {
      const n = answered < 6 ? 4 : answered < 16 ? 6 : 9;
      const cols = pick(n, COLORS);
      target = cols[Math.floor(Math.random() * n)];
      const cl = n === 4 ? [2, 2] : n === 6 ? [2, 3] : [3, 3];
      grid.style.gridTemplateColumns = 'repeat(' + cl[0] + ',1fr)';
      grid.style.gridTemplateRows = 'repeat(' + cl[1] + ',1fr)';
      grid.innerHTML = '';
      for (const col of cols) {
        const b = document.createElement('div');
        b.style.cssText = 'border-radius:16px;background:' + col.c + ';box-shadow:0 4px 0 rgba(0,0,0,.35);cursor:pointer';
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); choose(col); });
        grid.appendChild(b);
      }
      const swatch = answered >= 4 && Math.random() < 0.35;
      prompt.innerHTML = '';
      const small = document.createElement('div');
      small.style.cssText = 'font-size:15px;opacity:.75;margin-bottom:6px';
      if (swatch) {
        small.textContent = 'Tik dezelfde kleur als dit rondje';
        const dot = document.createElement('div');
        dot.style.cssText = 'width:84px;height:84px;border-radius:50%;background:' + target.c + ';border:4px solid #fff';
        prompt.append(small, dot);
      } else {
        small.textContent = 'Tik de kleur die er staat';
        const w = document.createElement('div');
        const ink = pick(1, COLORS.filter((c) => c !== target))[0];
        w.textContent = target.n;
        w.style.cssText = 'font-size:54px;font-weight:900;letter-spacing:2px;color:' + (answered < 3 ? '#fff' : ink.c) + ';text-shadow:0 2px 0 rgba(0,0,0,.5)';
        prompt.append(small, w);
      }
    }

    function choose(col) {
      if (ended) return;
      answered++;
      if (col === target) {
        streak++;
        score += 10 + Math.min(streak, 10) * 2; api.score(score);
        prompt.style.background = 'rgba(128,237,153,.25)';
      } else {
        streak = 0; timeLeft = Math.max(0, timeLeft - 2);
        score = Math.max(0, score - 5); api.score(score);
        prompt.style.background = 'rgba(255,107,107,.35)';
      }
      flashT = 0.15;
      if (timeLeft > 0) nextQ();
    }

    function finish() {
      if (ended) return;
      ended = true;
      grid.style.pointerEvents = 'none';
      prompt.innerHTML = '<div style="font-size:36px;font-weight:800">Tijd om!</div>';
      endTimer = setTimeout(() => { api.end(score); }, 900);
    }

    function tick(now) {
      if (!alive) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (!ended) {
        timeLeft -= dt;
        if (timeLeft <= 0) { timeLeft = 0; finish(); }
      }
      if (flashT > 0) { flashT -= dt; if (flashT <= 0) prompt.style.background = 'none'; }
      elScore.textContent = 'Score ' + score;
      elStreak.textContent = streak > 1 ? '🔥 ' + streak : '';
      elTime.textContent = timeLeft.toFixed(1).replace('.', ',') + ' s';
      barIn.style.width = (timeLeft / TOTAL * 100) + '%';
      barIn.style.background = timeLeft > 8 ? '#80ed99' : '#ff6b6b';
      raf = requestAnimationFrame(tick);
    }
    nextQ();
    raf = requestAnimationFrame(tick);

    return {
      destroy() {
        alive = false; cancelAnimationFrame(raf); clearTimeout(endTimer);
        root.remove();
      },
    };
  },
};
