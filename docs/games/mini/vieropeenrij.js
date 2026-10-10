export default {
  id: 'vieropeenrij',
  name: 'Vier op een rij',
  emoji: '🔴',
  hint: 'Tik op een kolom en maak vier op een rij. Win zo vaak mogelijk achter elkaar!',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = 'linear-gradient(160deg,#0f172a,#1e3a8a)';
    const dpr = window.devicePixelRatio || 1;
    const W = api.w, H = api.h;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px`;
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const COLS = 7, ROWS = 6;
    const cell = Math.min((W - 24) / COLS, (H * 0.62) / ROWS);
    const bw = cell * COLS, bh = cell * ROWS;
    const bx = (W - bw) / 2, by = (H - bh) / 2 + 10;

    // alle lijnen van 4
    const LINES = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
        const er = r + dr * 3, ec = c + dc * 3;
        if (er < 0 || er >= ROWS || ec < 0 || ec >= COLS) continue;
        LINES.push([0, 1, 2, 3].map(k => (r + dr * k) * COLS + c + dc * k));
      }
    }
    // 1 = speler (rood), 2 = computer (geel)
    let board, streak = 0, locked = true, over = false, games = 0, winCells = null, msg = '', hoverCol = 3;
    let dead = false, ended = false, raf = 0;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); };

    function findWin(b) {
      for (const L of LINES) {
        const v = b[L[0]];
        if (v && v === b[L[1]] && v === b[L[2]] && v === b[L[3]]) return { who: v, cells: L };
      }
      return null;
    }
    function dropRow(b, c) {
      for (let r = ROWS - 1; r >= 0; r--) if (!b[r * COLS + c]) return r;
      return -1;
    }
    function evalBoard(b) {
      let s = 0;
      for (const L of LINES) {
        let a = 0, p = 0;
        for (const i of L) { if (b[i] === 2) a++; else if (b[i] === 1) p++; }
        if (a && p) continue;
        if (a === 3) s += 50; else if (a === 2) s += 6; else if (a === 1) s += 1;
        if (p === 3) s -= 60; else if (p === 2) s -= 6; else if (p === 1) s -= 1;
      }
      for (let r = 0; r < ROWS; r++) {
        const v = b[r * COLS + 3];
        if (v === 2) s += 4; else if (v === 1) s -= 4;
      }
      return s;
    }
    const ORDER = [3, 2, 4, 1, 5, 0, 6];
    function minimax(b, depth, alpha, beta, comp) {
      const w = findWin(b);
      if (w) return w.who === 2 ? 100000 + depth : -100000 - depth;
      if (b.every(Boolean)) return 0;
      if (depth === 0) return evalBoard(b);
      if (comp) {
        let best = -Infinity;
        for (const c of ORDER) {
          const r = dropRow(b, c);
          if (r < 0) continue;
          b[r * COLS + c] = 2;
          const v = minimax(b, depth - 1, alpha, beta, false);
          b[r * COLS + c] = 0;
          if (v > best) best = v;
          if (best > alpha) alpha = best;
          if (alpha >= beta) break;
        }
        return best;
      }
      let best = Infinity;
      for (const c of ORDER) {
        const r = dropRow(b, c);
        if (r < 0) continue;
        b[r * COLS + c] = 1;
        const v = minimax(b, depth - 1, alpha, beta, true);
        b[r * COLS + c] = 0;
        if (v < best) best = v;
        if (best < beta) beta = best;
        if (alpha >= beta) break;
      }
      return best;
    }
    function computerChoice() {
      let best = -Infinity, picks = [];
      for (const c of ORDER) {
        const r = dropRow(board, c);
        if (r < 0) continue;
        board[r * COLS + c] = 2;
        const v = minimax(board, 3, -Infinity, Infinity, false) + Math.random() * 0.5;
        board[r * COLS + c] = 0;
        if (v > best) { best = v; picks = [c]; }
      }
      return picks[0];
    }

    function place(c, who) {
      const r = dropRow(board, c);
      if (r < 0) return false;
      board[r * COLS + c] = who;
      return true;
    }
    function checkEnd(who) {
      const w = findWin(board);
      if (w) {
        winCells = w.cells;
        over = true; locked = true;
        if (w.who === 1) {
          streak++;
          api.score(streak);
          msg = 'Gewonnen! 🎉';
          later(newGame, 1500);
        } else {
          msg = 'De computer wint... 😢';
          later(() => { if (!ended) { ended = true; api.end(streak); } }, 1500);
        }
        return true;
      }
      if (board.every(Boolean)) {
        over = true; locked = true;
        msg = 'Gelijkspel, door!';
        later(newGame, 1300);
        return true;
      }
      return false;
    }
    function newGame() {
      board = Array(COLS * ROWS).fill(0);
      winCells = null; over = false; games++;
      locked = true;
      if (games % 2 === 0) {
        msg = 'Computer begint...';
        later(() => { place(computerChoice(), 2); locked = false; msg = 'Jouw beurt'; }, 500);
      } else {
        locked = false;
        msg = 'Jouw beurt (rood)';
      }
    }
    function playerMove(c) {
      if (dead || locked || over) return;
      if (!place(c, 1)) return;
      if (checkEnd(1)) return;
      locked = true;
      msg = 'Computer denkt...';
      later(() => {
        const c2 = computerChoice();
        place(c2, 2);
        if (checkEnd(2)) return;
        locked = false;
        msg = 'Jouw beurt';
      }, 350);
    }

    function colFromEvent(e) {
      const rect = host.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (W / (rect.width || W));
      return Math.max(0, Math.min(COLS - 1, Math.floor((x - bx) / cell)));
    }
    const onDown = e => { hoverCol = colFromEvent(e); playerMove(hoverCol); };
    const onMove = e => { hoverCol = colFromEvent(e); };
    host.addEventListener('pointerdown', onDown);
    host.addEventListener('pointermove', onMove);
    const onKey = e => {
      if (e.key >= '1' && e.key <= '7') { hoverCol = +e.key - 1; playerMove(hoverCol); }
      else if (e.key === 'ArrowLeft') hoverCol = Math.max(0, hoverCol - 1);
      else if (e.key === 'ArrowRight') hoverCol = Math.min(COLS - 1, hoverCol + 1);
      else if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); playerMove(hoverCol); }
    };
    window.addEventListener('keydown', onKey);

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px system-ui,sans-serif';
      ctx.fillText(`Gewonnen: ${streak}`, W / 2, by - 50);
      ctx.font = '16px system-ui,sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(msg, W / 2, by - 22);
      // preview-schijf
      if (!locked && !over) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(bx + hoverCol * cell + cell / 2, by - 6 - cell * 0.0, cell * 0.14, 0, 7);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(bx - 6, by - 6, bw + 12, bh + 12, 14) : ctx.rect(bx - 6, by - 6, bw + 12, bh + 12);
      ctx.fill();
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const v = board[r * COLS + c];
        const cx = bx + c * cell + cell / 2, cy = by + r * cell + cell / 2;
        ctx.fillStyle = v === 1 ? '#ef4444' : v === 2 ? '#facc15' : '#0f172a';
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.4, 0, 7);
        ctx.fill();
        if (winCells && winCells.includes(r * COLS + c)) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 4;
          ctx.stroke();
        }
      }
    }
    function loop() {
      if (dead) return;
      draw();
      raf = requestAnimationFrame(loop);
    }
    api.score(0);
    newGame();
    raf = requestAnimationFrame(loop);
    return {
      destroy() {
        dead = true;
        cancelAnimationFrame(raf);
        timers.forEach(clearTimeout);
        timers.clear();
        host.removeEventListener('pointerdown', onDown);
        host.removeEventListener('pointermove', onMove);
        window.removeEventListener('keydown', onKey);
        canvas.remove();
      },
    };
  },
};
