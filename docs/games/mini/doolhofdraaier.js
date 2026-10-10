export default {
  id: 'doolhofdraaier', name: 'Doolhofdraaier', emoji: '🌀', hint: 'Draai het doolhof (knoppen, pijltjes of veeg): de bal rolt omlaag naar de uitgang',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#1c1530'; host.style.fontFamily = 'system-ui,sans-serif'; host.style.color = '#fff';
    const W = api.w, H = api.h, dpr = Math.min(2, window.devicePixelRatio || 1);
    const cv = document.createElement('canvas');
    cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
    cv.style.cssText = 'position:absolute;left:0;top:0;width:' + W + 'px;height:' + H + 'px;touch-action:none';
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    const mkBtn = (txt, left) => {
      const b = document.createElement('button'); b.textContent = txt;
      b.style.cssText = 'position:absolute;bottom:14px;' + (left ? 'left:14px' : 'right:14px') + ';width:' + Math.floor((W - 44) / 2) + 'px;height:56px;border-radius:16px;border:0;background:#5b3fd1;color:#fff;font-size:22px;font-weight:800;cursor:pointer';
      host.appendChild(b); return b;
    };
    const bl = mkBtn('⟲ Links', true), br = mkBtn('Rechts ⟳', false);
    // N=0 E=1 S=2 W=3 (kloksgewijs). walls[i] bits 1<<d = muur aan kant d
    const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
    const SIZES = [4, 5, 5, 6, 6, 7, 7, 8, 8, 9];
    let dead = false, ended = false;
    const timers = [];
    const later = (fn, ms) => { const id = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(id); };
    let level = 1, n = 5, walls = [], start = 0, exit = 0, turnsLeft = 0, score = 0;
    let rotCur = 0, rotTarget = 0, bx = 0, by = 0, queue = [], busy = false, win = false, msg = '', last = 0, raf = 0, waitRoll = 0;
    const cellPx = () => Math.floor(Math.min(W - 28, H - 190) / n);
    const hasWall = (i, d) => !!(walls[i] & (1 << d));

    function genMaze() {
      walls = new Array(n * n).fill(15);
      const seen = new Array(n * n).fill(false), st = [0]; seen[0] = true;
      while (st.length) {
        const i = st[st.length - 1], x = i % n, y = Math.floor(i / n);
        const opts = [];
        for (let d = 0; d < 4; d++) { const nx = x + DX[d], ny = y + DY[d]; if (nx >= 0 && ny >= 0 && nx < n && ny < n && !seen[ny * n + nx]) opts.push(d); }
        if (!opts.length) { st.pop(); continue; }
        const d = opts[Math.floor(Math.random() * opts.length)], j = (y + DY[d]) * n + x + DX[d];
        walls[i] &= ~(1 << d); walls[j] &= ~(1 << ((d + 2) % 4)); seen[j] = true; st.push(j);
      }
      // extra openingen zodat de bal niet te vast zit
      let extra = Math.floor(n * n * 0.18);
      while (extra-- > 0) {
        const x = Math.floor(Math.random() * n), y = Math.floor(Math.random() * n), d = Math.floor(Math.random() * 4), nx = x + DX[d], ny = y + DY[d];
        if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
        walls[y * n + x] &= ~(1 << d); walls[ny * n + nx] &= ~(1 << ((d + 2) % 4));
      }
    }
    // rol vanuit cel i in richting d; geeft lijst cellen. stopt bij uitgang (indien exitCell >= 0)
    function roll(i, d, exitCell) {
      const path = []; let cur = i;
      while (!hasWall(cur, d)) {
        cur = (Math.floor(cur / n) + DY[d]) * n + (cur % n) + DX[d]; path.push(cur);
        if (cur === exitCell) break;
      }
      return path;
    }
    const grav = (r) => (((2 - r) % 4) + 4) % 4;
    function solveInfo() {
      // BFS over (cel, rot)
      const key = (c, r) => c * 4 + r;
      const dist = new Map([[key(start, 0), 0]]), cd = new Array(n * n).fill(-1);
      cd[start] = 0;
      let q = [[start, 0]], t = 0;
      while (q.length && t < 40) {
        const nq = []; t++;
        for (const [c, r] of q) {
          for (const dr of [1, -1]) {
            const r2 = (r + dr + 4) % 4, p = roll(c, grav(r2), -1);
            for (const cc of p) if (cd[cc] < 0) cd[cc] = t;
            const end = p.length ? p[p.length - 1] : c, k = key(end, r2);
            if (!dist.has(k)) { dist.set(k, t); nq.push([end, r2]); }
          }
        }
        q = nq;
      }
      return cd;
    }
    function makeLevel() {
      n = SIZES[level - 1];
      let tries = 0;
      for (;;) {
        genMaze(); start = Math.floor(Math.random() * n * n);
        const cd = solveInfo();
        const want = Math.min(2 + Math.floor(level * 0.9), 8);
        let best = -1, bd = 0; const cand = [];
        for (let i = 0; i < n * n; i++) if (i !== start && cd[i] >= 2) { cand.push(i); if (cd[i] > bd) { bd = cd[i]; best = i; } }
        tries++;
        if (best >= 0 && (bd >= want || tries > 30)) {
          const good = cand.filter(i => cd[i] >= Math.max(2, Math.min(want, bd)));
          exit = good[Math.floor(Math.random() * good.length)];
          turnsLeft = cd[exit] + 2 + Math.ceil(cd[exit] * 0.6);
          break;
        }
        if (tries > 200) { start = 0; exit = n * n - 1; turnsLeft = 99; break; }
      }
      rotCur = 0; rotTarget = 0; bx = start % n; by = Math.floor(start / n); queue = []; busy = false; win = false; msg = '';
    }
    function turn(dr) {
      if (ended || busy || win) return;
      rotTarget += dr; turnsLeft--; busy = true;
      const r = ((rotTarget % 4) + 4) % 4;
      const cur = Math.round(by) * n + Math.round(bx);
      queue = roll(cur, grav(r), exit);
      waitRoll = 0.28;
    }
    function frame(ts) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
      rotCur += (rotTarget - rotCur) * Math.min(1, dt * 11);
      if (Math.abs(rotTarget - rotCur) < 0.003) rotCur = rotTarget;
      if (waitRoll > 0) waitRoll -= dt;
      else if (queue.length) {
        const tx = queue[0] % n, ty = Math.floor(queue[0] / n);
        const dx = tx - bx, dy = ty - by, dist = Math.hypot(dx, dy), step = 11 * dt;
        if (dist <= step) { bx = tx; by = ty; queue.shift(); } else { bx += dx / dist * step; by += dy / dist * step; }
        if (!queue.length) settle();
      } else if (busy && !ended) settle();
      draw();
    }
    function settle() {
      busy = false;
      const cur = Math.round(by) * n + Math.round(bx);
      if (cur === exit) {
        win = true; score += 100 * level + turnsLeft * 15; api.score(score); msg = 'Gelukt! 🎉';
        if (level >= SIZES.length) { ended = true; later(() => api.end(score), 1000); }
        else later(() => { level++; makeLevel(); }, 1100);
      } else if (turnsLeft <= 0) {
        ended = true; msg = 'Geen draaien meer!'; later(() => api.end(score), 1000);
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#1c1530'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.font = '700 18px system-ui,sans-serif'; ctx.textBaseline = 'middle';
      ctx.textAlign = 'left'; ctx.fillText('Level ' + level + '/' + SIZES.length, 14, 24);
      ctx.textAlign = 'right'; ctx.fillText('Score ' + score, W - 14, 24);
      ctx.textAlign = 'center'; ctx.fillStyle = turnsLeft <= 2 ? '#ff7b7b' : '#c9b8ff'; ctx.font = '700 17px system-ui,sans-serif';
      ctx.fillText('Draaien over: ' + Math.max(0, turnsLeft), W / 2, 52);
      const cp = cellPx(), cx = W / 2, cy = 76 + (H - 76 - 80) / 2;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rotCur * Math.PI / 2); ctx.translate(-n * cp / 2, -n * cp / 2);
      ctx.fillStyle = '#2a2050'; ctx.fillRect(0, 0, n * cp, n * cp);
      ctx.fillStyle = '#3a8f4d'; ctx.fillRect((exit % n) * cp + 3, Math.floor(exit / n) * cp + 3, cp - 6, cp - 6);
      ctx.font = Math.floor(cp * 0.6) + 'px serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.fillText('🏁', (exit % n + 0.5) * cp, (Math.floor(exit / n) + 0.55) * cp);
      ctx.strokeStyle = '#b79cff'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath();
      for (let i = 0; i < n * n; i++) {
        const x = (i % n) * cp, y = Math.floor(i / n) * cp;
        if (hasWall(i, 0)) { ctx.moveTo(x, y); ctx.lineTo(x + cp, y); }
        if (hasWall(i, 1)) { ctx.moveTo(x + cp, y); ctx.lineTo(x + cp, y + cp); }
        if (hasWall(i, 2)) { ctx.moveTo(x, y + cp); ctx.lineTo(x + cp, y + cp); }
        if (hasWall(i, 3)) { ctx.moveTo(x, y); ctx.lineTo(x, y + cp); }
      }
      ctx.stroke();
      ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc((bx + 0.5) * cp, (by + 0.5) * cp, cp * 0.3, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff7'; ctx.beginPath(); ctx.arc((bx + 0.42) * cp, (by + 0.4) * cp, cp * 0.09, 0, 7); ctx.fill();
      ctx.restore();
      if (msg) { ctx.fillStyle = '#fff'; ctx.font = '800 26px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(msg, W / 2, H - 100); }
    }
    const onL = () => turn(-1), onR = () => turn(1);
    bl.addEventListener('click', onL); br.addEventListener('click', onR);
    const onKey = (e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); turn(-1); } else if (e.key === 'ArrowRight') { e.preventDefault(); turn(1); } };
    window.addEventListener('keydown', onKey);
    let sx = 0, tracking = false;
    const onDown = (e) => { sx = e.clientX; tracking = true; };
    const onUp = (e) => { if (!tracking) return; tracking = false; const dx = e.clientX - sx; if (Math.abs(dx) > 30) turn(dx < 0 ? -1 : 1); };
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointerup', onUp);
    makeLevel(); api.score(0);
    raf = requestAnimationFrame(frame);
    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout);
        bl.removeEventListener('click', onL); br.removeEventListener('click', onR);
        window.removeEventListener('keydown', onKey); cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointerup', onUp);
      },
    };
  },
};
