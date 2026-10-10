export default {
  id: 'lichtjesuit',
  name: 'Lichtjes uit',
  emoji: '💡',
  hint: 'Tik een lamp: die en de buren wisselen. Doe alle lichtjes uit binnen je zetten!',
  create(host, api) {
    host.style.touchAction = 'none';
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;background:linear-gradient(160deg,#111827,#312e81);color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;box-sizing:border-box;padding:16px;user-select:none';
    host.appendChild(root);
    let dead = false, ended = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); };

    const N = 5;
    const title = document.createElement('div');
    title.style.cssText = 'font-size:22px;font-weight:700';
    const stats = document.createElement('div');
    stats.style.cssText = 'font-size:17px;min-height:24px;text-align:center';
    const size = Math.min(api.w - 32, api.h * 0.55, 340);
    const gap = 6;
    const cs = Math.floor((size - gap * (N - 1)) / N);
    const grid = document.createElement('div');
    grid.style.cssText = `display:grid;grid-template-columns:repeat(${N},${cs}px);gap:${gap}px`;
    root.append(title, stats, grid);
    const cells = [];
    for (let i = 0; i < N * N; i++) {
      const b = document.createElement('button');
      b.style.cssText = `width:${cs}px;height:${cs}px;border:0;border-radius:12px;cursor:pointer;padding:0;touch-action:manipulation;transition:background .12s,box-shadow .12s`;
      b.addEventListener('click', () => press(i));
      grid.appendChild(b);
      cells.push(b);
    }
    let on = Array(N * N).fill(false), level = 1, movesLeft = 0, done = 0, locked = false;

    function toggle(i) {
      const r = Math.floor(i / N), c = i % N;
      on[i] = !on[i];
      if (r > 0) on[i - N] = !on[i - N];
      if (r < N - 1) on[i + N] = !on[i + N];
      if (c > 0) on[i - 1] = !on[i - 1];
      if (c < N - 1) on[i + 1] = !on[i + 1];
    }
    function render() {
      for (let i = 0; i < N * N; i++) {
        cells[i].style.background = on[i] ? 'radial-gradient(circle,#fef08a,#f59e0b)' : '#1f2937';
        cells[i].style.boxShadow = on[i] ? '0 0 16px #fbbf24' : 'inset 0 0 0 2px #374151';
      }
      title.textContent = `Level ${level}`;
      stats.textContent = `Zetten over: ${movesLeft} · Gehaald: ${done}`;
    }
    function startLevel() {
      const presses = Math.min(2 + level, 14);
      let tries = 0;
      do {
        on = Array(N * N).fill(false);
        const idx = [];
        for (let i = 0; i < N * N; i++) idx.push(i);
        for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
        for (let k = 0; k < presses; k++) toggle(idx[k]);
        tries++;
      } while (!on.some(Boolean) && tries < 50);
      movesLeft = presses + 5;
      locked = false;
      render();
    }
    function press(i) {
      if (dead || locked) return;
      toggle(i);
      movesLeft--;
      render();
      if (!on.some(Boolean)) {
        locked = true;
        done++;
        api.score(done);
        stats.textContent = 'Alles uit! 🎉';
        level++;
        later(startLevel, 800);
      } else if (movesLeft <= 0) {
        locked = true;
        stats.textContent = 'Geen zetten meer... 😢';
        later(() => { if (!ended) { ended = true; api.end(done); } }, 1300);
      }
    }
    api.score(0);
    startLevel();
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
