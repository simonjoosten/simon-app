export default {
  id: 'muntenjager', name: 'Muntenjager', emoji: '🪙', hint: 'Veeg door het doolhof, pak munten, ontwijk het spook',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#1a1033';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    const COLS = 11, ROWS = 15, TOP = 36;
    const T = Math.floor(Math.min(W / COLS, (H - TOP - 6) / ROWS));
    const OX = Math.floor((W - T * COLS) / 2), OY = TOP;
    let dead = false, raf = 0, last = 0, ended = false;
    let grid, coins, coinsLeft, score = 0, level = 0, timeLeft = 45, grace = 2.5;
    const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const pl = { c: 1, r: 1, nc: 1, nr: 1, p: 1, dir: null, want: null };
    const gh = { c: 9, r: 13, nc: 9, nr: 13, p: 1, dir: null };
    function free(c, r) { return c >= 0 && r >= 0 && c < COLS && r < ROWS && grid[r][c] === 0; }
    function gen() {
      grid = [];
      for (let r = 0; r < ROWS; r++) { grid.push(new Array(COLS).fill(1)); }
      const st = [[1, 1]]; grid[1][1] = 0;
      while (st.length) {
        const [c, r] = st[st.length - 1];
        const opts = [];
        for (const [dx, dy] of DIRS) { const nc = c + dx * 2, nr = r + dy * 2; if (nc > 0 && nr > 0 && nc < COLS - 1 && nr < ROWS - 1 && grid[nr][nc] === 1) opts.push([dx, dy]); }
        if (!opts.length) { st.pop(); continue; }
        const [dx, dy] = opts[Math.floor(Math.random() * opts.length)];
        grid[r + dy][c + dx] = 0; grid[r + dy * 2][c + dx * 2] = 0; st.push([c + dx * 2, r + dy * 2]);
      }
      // remove some walls for loops
      for (let i = 0; i < 14; i++) {
        const c = 1 + Math.floor(Math.random() * (COLS - 2)), r = 1 + Math.floor(Math.random() * (ROWS - 2));
        if (grid[r][c] === 1 && ((free(c - 1, r) && free(c + 1, r)) || (free(c, r - 1) && free(c, r + 1)))) grid[r][c] = 0;
      }
      coins = []; coinsLeft = 0;
      for (let r = 0; r < ROWS; r++) { coins.push([]); for (let c = 0; c < COLS; c++) { const v = grid[r][c] === 0 && (c + r > 3) && Math.random() < 0.55; coins[r].push(v); if (v) coinsLeft++; } }
      if (coinsLeft < 5) { coins[ROWS - 2][COLS - 2] = true; coinsLeft++; }
      Object.assign(pl, { c: 1, r: 1, nc: 1, nr: 1, p: 1, dir: null, want: null });
      Object.assign(gh, { c: COLS - 2, r: ROWS - 2, nc: COLS - 2, nr: ROWS - 2, p: 1, dir: null });
      coins[ROWS - 2][COLS - 2] = false;
      grace = 2.5;
    }
    gen();
    api.score(0);
    function bfsDir(g) { // direction from ghost toward player
      const q = [[g.nc, g.nr]], prev = new Map(); prev.set(g.nr * COLS + g.nc, null);
      const tgt = pl.nr * COLS + pl.nc;
      while (q.length) {
        const [c, r] = q.shift();
        if (r * COLS + c === tgt) break;
        for (const d of DIRS) { const nc = c + d[0], nr = r + d[1], k = nr * COLS + nc; if (free(nc, nr) && !prev.has(k)) { prev.set(k, [c, r]); q.push([nc, nr]); } }
      }
      let k = tgt; if (!prev.has(k)) return null;
      let cur = [pl.nc, pl.nr];
      while (true) { const pv = prev.get(cur[1] * COLS + cur[0]); if (!pv) return null; if (pv[0] === g.nc && pv[1] === g.nr) return [cur[0] - g.nc, cur[1] - g.nr]; cur = pv; }
    }
    function stepEntity(e, speed, dt, chooser) {
      let left = speed * dt;
      while (left > 0) {
        if (e.p >= 1) {
          e.c = e.nc; e.r = e.nr; e.p = 1;
          if (e === pl) onArrive();
          const d = chooser();
          if (!d) { e.p = 1; return; }
          e.dir = d; e.nc = e.c + d[0]; e.nr = e.r + d[1]; e.p = 0;
        }
        const need = 1 - e.p;
        if (left >= need) { e.p = 1; left -= need; } else { e.p += left; left = 0; }
      }
    }
    function onArrive() {
      if (coins[pl.nr][pl.nc]) {
        coins[pl.nr][pl.nc] = false; coinsLeft--; score += 10; api.score(score);
        if (coinsLeft <= 0) { level++; timeLeft += 12; gen(); }
      }
    }
    function plChoose() {
      if (pl.want && free(pl.c + pl.want[0], pl.r + pl.want[1])) { pl.dir = pl.want; return pl.dir; }
      if (pl.dir && free(pl.c + pl.dir[0], pl.r + pl.dir[1])) return pl.dir;
      return null;
    }
    function ghChoose() {
      const opts = DIRS.filter(d => free(gh.c + d[0], gh.r + d[1]));
      const back = gh.dir ? opts.filter(d => !(d[0] === -gh.dir[0] && d[1] === -gh.dir[1])) : opts;
      const pool = back.length ? back : opts;
      if (Math.random() < Math.min(0.45 + level * 0.1, 0.85)) { const d = bfsDir(gh); if (d) return d; }
      return pool[Math.floor(Math.random() * pool.length)];
    }
    // pl moves back & forth mid-tile: allow reversing
    function reverseIfNeeded() {
      if (pl.want && pl.dir && pl.p < 1 && pl.want[0] === -pl.dir[0] && pl.want[1] === -pl.dir[1]) {
        const c = pl.c, r = pl.r; pl.c = pl.nc; pl.r = pl.nr; pl.nc = c; pl.nr = r; pl.p = 1 - pl.p; pl.dir = pl.want;
      }
    }
    function setDir(d) { pl.want = d; reverseIfNeeded(); }
    let sx = 0, sy = 0, down = false;
    const pd = e => { down = true; sx = e.clientX; sy = e.clientY; try { host.setPointerCapture(e.pointerId); } catch (_) {} };
    const pm = e => {
      if (!down) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 18 || Math.abs(dy) > 18) {
        setDir(Math.abs(dx) > Math.abs(dy) ? [dx > 0 ? 1 : -1, 0] : [0, dy > 0 ? 1 : -1]);
        sx = e.clientX; sy = e.clientY;
      }
    };
    const pu = () => { down = false; };
    host.addEventListener('pointerdown', pd); host.addEventListener('pointermove', pm);
    host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pu);
    const kd = e => {
      const m = { ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0], ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1] }[e.key];
      if (m) { setDir(m); e.preventDefault(); }
    };
    window.addEventListener('keydown', kd);
    function pos(e) { return [OX + (e.c + (e.nc - e.c) * e.p + 0.5) * T, OY + (e.r + (e.nr - e.r) * e.p + 0.5) * T]; }
    function frame(ts) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min((ts - (last || ts)) / 1000, 0.05); last = ts;
      if (!ended) {
        timeLeft -= dt;
        stepEntity(pl, 5.2, dt, plChoose);
        if (grace > 0) grace -= dt; else stepEntity(gh, 3.2 + level * 0.5, dt, ghChoose);
        const a = pos(pl), b = pos(gh);
        if (grace <= 0 && Math.hypot(a[0] - b[0], a[1] - b[1]) < T * 0.6) { ended = true; api.end(score); }
        else if (timeLeft <= 0) { timeLeft = 0; ended = true; api.end(score); }
      }
      draw();
    }
    function draw() {
      ctx.fillStyle = '#1a1033'; ctx.fillRect(0, 0, W, H);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (grid[r][c] === 1) { ctx.fillStyle = '#4b3a9e'; ctx.fillRect(OX + c * T, OY + r * T, T, T); ctx.fillStyle = '#6a55cc'; ctx.fillRect(OX + c * T + 2, OY + r * T + 2, T - 4, T - 4); }
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = Math.floor(T * 0.6) + 'px serif';
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (coins[r][c]) ctx.fillText('🪙', OX + (c + 0.5) * T, OY + (r + 0.5) * T);
      ctx.font = Math.floor(T * 0.85) + 'px serif';
      const a = pos(pl), b = pos(gh);
      ctx.globalAlpha = grace > 0 ? 0.5 : 1;
      ctx.fillText('👻', b[0], b[1]); ctx.globalAlpha = 1;
      ctx.fillText('😎', a[0], a[1]);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('⏱ ' + Math.ceil(timeLeft) + 's', 10, 18);
      ctx.textAlign = 'right'; ctx.fillText('Ronde ' + (level + 1), W - 10, 18);
    }
    raf = requestAnimationFrame(frame);
    return { destroy() {
      dead = true; cancelAnimationFrame(raf);
      host.removeEventListener('pointerdown', pd); host.removeEventListener('pointermove', pm);
      host.removeEventListener('pointerup', pu); host.removeEventListener('pointercancel', pu);
      window.removeEventListener('keydown', kd);
      cv.remove();
    } };
  },
};
