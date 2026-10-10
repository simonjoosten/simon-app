export default {
  id: 'pijpenspel', name: 'Pijpenspel', emoji: '🚰', hint: 'Tik op stukken om ze te draaien: laat het water van links naar rechts stromen',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#16222e'; host.style.fontFamily = 'system-ui,sans-serif';
    const W = api.w, H = api.h, dpr = Math.min(2, window.devicePixelRatio || 1);
    const cv = document.createElement('canvas');
    cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
    cv.style.cssText = 'width:' + W + 'px;height:' + H + 'px;display:block;touch-action:none';
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    const SIZES = [3, 4, 4, 5, 5, 6, 6, 7];
    // N=1 E=2 S=4 W=8
    const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0], BIT = [1, 2, 4, 8];
    let dead = false, ended = false, busy = false;
    const timers = [];
    const later = (fn, ms) => { const id = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(id); };
    let level = 1, n = 3, tiles = [], sr = 0, er = 0, score = 0, timeLeft = 0, wet = new Set(), won = false, msg = '';
    let cell = 40, ox = 0, oy = 0;
    const rotm = (m) => ((m << 1) | (m >> 3)) & 15;

    function genPath() {
      for (let minLen = n + 3; minLen >= 2; minLen--) {
        for (let tries = 0; tries < 30; tries++) {
          const r0 = Math.floor(Math.random() * n), r1 = Math.floor(Math.random() * n);
          const seen = new Set([r0 * n]); const path = [[0, r0]];
          const dfs = () => {
            const [x, y] = path[path.length - 1];
            if (x === n - 1 && y === r1 && path.length >= minLen) return true;
            const dirs = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
            for (const d of dirs) {
              const nx = x + DX[d], ny = y + DY[d];
              if (nx < 0 || ny < 0 || nx >= n || ny >= n || seen.has(ny * n + nx)) continue;
              if (nx === n - 1 && ny === r1 && path.length + 1 < minLen) continue;
              if (path.length > n * n) return false;
              seen.add(ny * n + nx); path.push([nx, ny]);
              if (dfs()) return true;
              path.pop(); seen.delete(ny * n + nx);
            }
            return false;
          };
          if (dfs()) return { path, r0, r1 };
        }
      }
      const r0 = 0, path = []; for (let x = 0; x < n; x++) path.push([x, 0]);
      return { path, r0, r1: 0 };
    }
    function makeLevel() {
      n = SIZES[level - 1];
      const { path, r0, r1 } = genPath();
      sr = r0; er = r1;
      const t = new Array(n * n).fill(0);
      const pool = [5, 3, 3, 5, 7, 7, 1, 15, 0, 3];
      for (let i = 0; i < n * n; i++) t[i] = pool[Math.floor(Math.random() * pool.length)];
      path.forEach(([x, y], k) => {
        let m = 0;
        const prev = k === 0 ? [-1, y] : path[k - 1], next = k === path.length - 1 ? [n, y] : path[k + 1];
        for (let d = 0; d < 4; d++) {
          if (x + DX[d] === prev[0] && y + DY[d] === prev[1]) m |= BIT[d];
          if (x + DX[d] === next[0] && y + DY[d] === next[1]) m |= BIT[d];
        }
        t[y * n + x] = m;
      });
      do {
        for (let i = 0; i < n * n; i++) { const k = Math.floor(Math.random() * 4); for (let q = 0; q < k; q++) t[i] = rotm(t[i]); }
        tiles = t; flow();
      } while (won);
      timeLeft = Math.round(10 + n * n * 1.3);
      cell = Math.floor(Math.min((W - 76) / n, (H - 150) / n));
      ox = Math.floor((W - cell * n) / 2); oy = 72 + Math.floor((H - 150 - cell * n) / 2);
      won = false; msg = '';
    }
    function flow() {
      wet = new Set(); won = false;
      if (!(tiles[sr * n] & 8)) return;
      const st = [[0, sr]]; wet.add(sr * n);
      while (st.length) {
        const [x, y] = st.pop(), m = tiles[y * n + x];
        for (let d = 0; d < 4; d++) {
          if (!(m & BIT[d])) continue;
          const nx = x + DX[d], ny = y + DY[d];
          if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
          if (!(tiles[ny * n + nx] & BIT[(d + 2) % 4])) continue;
          if (wet.has(ny * n + nx)) continue;
          wet.add(ny * n + nx); st.push([nx, ny]);
        }
      }
      if (wet.has(er * n + n - 1) && (tiles[er * n + n - 1] & 2)) won = true;
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#16222e'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.font = '700 19px system-ui,sans-serif'; ctx.textBaseline = 'middle';
      ctx.textAlign = 'left'; ctx.fillText('Level ' + level + '/' + SIZES.length, 14, 24);
      ctx.textAlign = 'right'; ctx.fillText('Score ' + score, W - 14, 24);
      ctx.textAlign = 'center'; ctx.fillStyle = timeLeft <= 8 ? '#ff6b6b' : '#9fd3ff'; ctx.font = '800 24px system-ui,sans-serif';
      ctx.fillText('⏱ ' + Math.max(0, Math.ceil(timeLeft)) + 's', W / 2, 54);
      if (msg) { ctx.fillStyle = '#7CFC9a'; ctx.font = '700 18px system-ui,sans-serif'; ctx.fillText(msg, W / 2, oy + cell * n + 30); }
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const m = tiles[y * n + x], px = ox + x * cell, py = oy + y * cell, cx = px + cell / 2, cy = py + cell / 2;
        ctx.fillStyle = '#22364a'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(px + 2, py + 2, cell - 4, cell - 4, 8) : ctx.rect(px + 2, py + 2, cell - 4, cell - 4); ctx.fill();
        const w = wet.has(y * n + x);
        ctx.lineCap = 'round';
        for (let d = 0; d < 4; d++) {
          if (!(m & BIT[d])) continue;
          ctx.strokeStyle = w ? '#4fc3ff' : '#8a9bab'; ctx.lineWidth = cell * 0.26;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + DX[d] * cell / 2, cy + DY[d] * cell / 2); ctx.stroke();
        }
        if (m) { ctx.fillStyle = w ? '#4fc3ff' : '#8a9bab'; ctx.beginPath(); ctx.arc(cx, cy, cell * 0.13, 0, 7); ctx.fill(); }
      }
      ctx.font = Math.floor(cell * 0.6) + 'px serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
      ctx.fillText('🚰', ox - 20, oy + sr * cell + cell / 2);
      ctx.fillText('🏁', ox + n * cell + 20, oy + er * cell + cell / 2);
    }
    function pos(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; }
    const onDown = (e) => {
      if (ended || busy) return;
      const p = pos(e), x = Math.floor((p.x - ox) / cell), y = Math.floor((p.y - oy) / cell);
      if (x < 0 || y < 0 || x >= n || y >= n) return;
      tiles[y * n + x] = rotm(tiles[y * n + x]);
      flow();
      if (won) {
        busy = true;
        score += 100 * level + Math.ceil(timeLeft) * 3; api.score(score);
        msg = 'Het water stroomt! 🎉';
        if (level >= SIZES.length) { ended = true; later(() => api.end(score), 1000); }
        else later(() => { level++; makeLevel(); busy = false; draw(); }, 1100);
      }
      draw();
    };
    cv.addEventListener('pointerdown', onDown);
    const tick = setInterval(() => {
      if (dead || ended || busy) return;
      timeLeft -= 0.25;
      if (timeLeft <= 0) { timeLeft = 0; ended = true; msg = 'Tijd is op!'; draw(); later(() => api.end(score), 900); return; }
      draw();
    }, 250);
    makeLevel(); api.score(0); draw();
    return { destroy() { dead = true; clearInterval(tick); timers.forEach(clearTimeout); cv.removeEventListener('pointerdown', onDown); } };
  },
};
