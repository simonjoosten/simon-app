export default {
  id: 'schuifpuzzel',
  name: 'Schuifpuzzel',
  emoji: '🧩',
  hint: 'Schuif de tegels op volgorde: eerst 3x3, daarna 4x4. Snel en weinig zetten geeft meer punten.',
  create(host, api) {
    host.style.touchAction = 'none';
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;background:linear-gradient(160deg,#0f766e,#164e63);color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;box-sizing:border-box;padding:16px;user-select:none';
    host.appendChild(root);
    let dead = false, ended = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); };

    const title = document.createElement('div');
    title.style.cssText = 'font-size:20px;font-weight:700;text-align:center';
    const stats = document.createElement('div');
    stats.style.cssText = 'font-size:16px;text-align:center;min-height:22px';
    const boardSize = Math.min(api.w - 32, api.h * 0.55, 360);
    const board = document.createElement('div');
    board.style.cssText = `position:relative;width:${boardSize}px;height:${boardSize}px;background:rgba(0,0,0,.25);border-radius:12px`;
    const give = document.createElement('button');
    give.textContent = 'Stoppen';
    give.style.cssText = 'padding:10px 22px;min-height:44px;border:0;border-radius:10px;background:rgba(255,255,255,.2);color:#fff;font-size:16px;cursor:pointer';
    root.append(title, stats, board, give);

    let n = 3, tiles = [], emptyIdx = 0, moves = 0, startT = 0, secs = 0, total = 0, round = 0, locked = false, els = [];
    // tiles[pos] = waarde (0 = leeg), waarde v hoort op pos v-1

    function build() {
      board.innerHTML = '';
      els = [];
      const cs = boardSize / n;
      for (let v = 1; v < n * n; v++) {
        const b = document.createElement('button');
        b.textContent = v;
        b.style.cssText = `position:absolute;width:${cs - 6}px;height:${cs - 6}px;border:0;border-radius:10px;background:linear-gradient(#fde68a,#f59e0b);color:#422006;font-size:${Math.floor(cs * 0.42)}px;font-weight:800;cursor:pointer;padding:0;transition:left .12s,top .12s;touch-action:manipulation`;
        b.addEventListener('click', () => onTile(v));
        board.appendChild(b);
        els[v] = b;
      }
    }
    function layout() {
      const cs = boardSize / n;
      for (let p = 0; p < tiles.length; p++) {
        const v = tiles[p];
        if (!v) continue;
        els[v].style.left = (p % n) * cs + 3 + 'px';
        els[v].style.top = Math.floor(p / n) * cs + 3 + 'px';
      }
    }
    function isSolved() {
      for (let p = 0; p < tiles.length - 1; p++) if (tiles[p] !== p + 1) return false;
      return true;
    }
    function neighbors(e) {
      const r = Math.floor(e / n), c = e % n, out = [];
      if (r > 0) out.push(e - n);
      if (r < n - 1) out.push(e + n);
      if (c > 0) out.push(e - 1);
      if (c < n - 1) out.push(e + 1);
      return out;
    }
    function startRound() {
      n = round === 0 ? 3 : 4;
      tiles = [];
      for (let p = 0; p < n * n - 1; p++) tiles.push(p + 1);
      tiles.push(0);
      emptyIdx = n * n - 1;
      // schud met legale zetten vanuit de opgeloste stand: altijd oplosbaar
      let prev = -1;
      const steps = n === 3 ? 80 : 200;
      for (let s = 0; s < steps || isSolved(); s++) {
        const opts = neighbors(emptyIdx).filter(x => x !== prev);
        const pick = opts[Math.floor(Math.random() * opts.length)];
        tiles[emptyIdx] = tiles[pick];
        tiles[pick] = 0;
        prev = emptyIdx;
        emptyIdx = pick;
      }
      moves = 0; locked = false;
      startT = Date.now();
      build();
      layout();
      updateStats();
    }
    function updateStats() {
      secs = Math.floor((Date.now() - startT) / 1000);
      title.textContent = `Puzzel ${round + 1} van 2 · ${n}x${n}`;
      stats.textContent = `⏱ ${secs}s · Zetten: ${moves} · Score: ${total}`;
    }
    function shiftToward(idx) {
      // schuif tegels in dezelfde rij/kolom richting de lege plek
      const er = Math.floor(emptyIdx / n), ec = emptyIdx % n;
      const r = Math.floor(idx / n), c = idx % n;
      let step;
      if (r === er && c !== ec) step = c < ec ? -1 : 1;
      else if (c === ec && r !== er) step = r < er ? -n : n;
      else return false;
      // loop vanaf de lege plek richting idx
      let cur = emptyIdx;
      while (cur !== idx) {
        const from = cur + step;
        tiles[cur] = tiles[from];
        cur = from;
      }
      tiles[idx] = 0;
      emptyIdx = idx;
      return true;
    }
    function onTile(v) {
      if (dead || locked) return;
      const idx = tiles.indexOf(v);
      if (!shiftToward(idx)) return;
      moves++;
      layout();
      afterMove();
    }
    function afterMove() {
      updateStats();
      if (!isSolved()) return;
      locked = true;
      const base = n === 3 ? 1000 : 2000;
      const bonus = Math.max(100, base - secs * 5 - moves * 4);
      total += bonus;
      api.score(total);
      stats.textContent = `Opgelost! +${bonus} punten 🎉`;
      round++;
      if (round >= 2) later(() => { if (!ended) { ended = true; api.end(total); } }, 1600);
      else later(startRound, 1600);
    }
    const onKey = e => {
      if (locked) return;
      const r = Math.floor(emptyIdx / n), c = emptyIdx % n;
      let idx = -1;
      // pijl = richting waarin de tegel beweegt
      if (e.key === 'ArrowLeft' && c < n - 1) idx = emptyIdx + 1;
      else if (e.key === 'ArrowRight' && c > 0) idx = emptyIdx - 1;
      else if (e.key === 'ArrowUp' && r < n - 1) idx = emptyIdx + n;
      else if (e.key === 'ArrowDown' && r > 0) idx = emptyIdx - n;
      if (idx < 0) return;
      e.preventDefault();
      shiftToward(idx);
      moves++;
      layout();
      afterMove();
    };
    window.addEventListener('keydown', onKey);
    const onGive = () => { if (dead || ended) return; ended = true; api.end(total); };
    give.addEventListener('click', onGive);
    const iv = setInterval(() => { if (!dead && !locked) updateStats(); }, 500);
    api.score(0);
    startRound();
    return {
      destroy() {
        dead = true;
        clearInterval(iv);
        timers.forEach(clearTimeout);
        timers.clear();
        window.removeEventListener('keydown', onKey);
        give.removeEventListener('click', onGive);
        root.remove();
      },
    };
  },
};
