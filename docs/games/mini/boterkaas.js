export default {
  id: 'boterkaas',
  name: 'Boter-kaas-en-eieren',
  emoji: '❌',
  hint: 'Tik op een vakje. Win zo vaak mogelijk achter elkaar!',
  create(host, api) {
    host.style.touchAction = 'none';
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;background:linear-gradient(160deg,#1e3a8a,#6d28d9);color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;box-sizing:border-box;padding:16px;user-select:none';
    host.appendChild(root);
    let dead = false, ended = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); };

    const title = document.createElement('div');
    title.style.cssText = 'font-size:22px;font-weight:700';
    const msg = document.createElement('div');
    msg.style.cssText = 'font-size:18px;min-height:26px;text-align:center';
    const size = Math.min(api.w - 40, api.h * 0.6, 340);
    const gap = 8;
    const cs = Math.floor((size - gap * 2) / 3);
    const grid = document.createElement('div');
    grid.style.cssText = `display:grid;grid-template-columns:repeat(3,${cs}px);gap:${gap}px`;
    root.append(title, grid, msg);
    const cells = [];
    for (let i = 0; i < 9; i++) {
      const b = document.createElement('button');
      b.style.cssText = `width:${cs}px;height:${cs}px;border:0;border-radius:14px;background:rgba(255,255,255,.14);color:#fff;font-size:${Math.floor(cs * 0.6)}px;line-height:1;cursor:pointer;padding:0;touch-action:manipulation`;
      b.addEventListener('click', () => onCell(i));
      grid.appendChild(b);
      cells.push(b);
    }

    const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    let board, streak = 0, locked = true, games = 0;

    function winner(b) {
      for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
      return b.every(Boolean) ? 'D' : null;
    }
    function minimax(b, turn) { // geeft score vanuit O (computer)
      const w = winner(b);
      if (w === 'O') return 1;
      if (w === 'X') return -1;
      if (w === 'D') return 0;
      let best = turn === 'O' ? -2 : 2;
      for (let i = 0; i < 9; i++) {
        if (b[i]) continue;
        b[i] = turn;
        const v = minimax(b, turn === 'O' ? 'X' : 'O');
        b[i] = null;
        if (turn === 'O') { if (v > best) best = v; } else if (v < best) best = v;
      }
      return best;
    }
    function computerMove() {
      const free = [];
      for (let i = 0; i < 9; i++) if (!board[i]) free.push(i);
      const mistake = Math.max(0.08, 0.5 - 0.06 * streak);
      if (Math.random() < mistake) return free[Math.floor(Math.random() * free.length)];
      let best = -2, picks = [];
      for (const i of free) {
        board[i] = 'O';
        const v = minimax(board, 'X');
        board[i] = null;
        if (v > best) { best = v; picks = [i]; } else if (v === best) picks.push(i);
      }
      return picks[Math.floor(Math.random() * picks.length)];
    }
    function render() {
      for (let i = 0; i < 9; i++) {
        cells[i].textContent = board[i] === 'X' ? '❌' : board[i] === 'O' ? '⭕' : '';
      }
      title.textContent = `Reeks: ${streak} 🏆`;
    }
    function newGame() {
      board = Array(9).fill(null);
      games++;
      locked = true;
      render();
      if (games % 2 === 0) {
        msg.textContent = 'De computer begint...';
        later(() => { board[computerMove()] = 'O'; locked = false; msg.textContent = 'Jij bent ❌'; render(); }, 500);
      } else {
        locked = false;
        msg.textContent = 'Jij bent ❌ en begint';
      }
    }
    function finishRound(w) {
      locked = true;
      render();
      if (w === 'X') {
        streak++;
        api.score(streak);
        msg.textContent = 'Gewonnen! 🎉';
        later(newGame, 1100);
      } else if (w === 'D') {
        msg.textContent = 'Gelijkspel, door!';
        later(newGame, 1100);
      } else {
        msg.textContent = 'Verloren... 😢';
        later(() => { if (!ended) { ended = true; api.end(streak); } }, 1200);
      }
    }
    function onCell(i) {
      if (dead || locked || board[i]) return;
      board[i] = 'X';
      render();
      let w = winner(board);
      if (w) return finishRound(w);
      locked = true;
      msg.textContent = 'Computer denkt...';
      later(() => {
        board[computerMove()] = 'O';
        render();
        const w2 = winner(board);
        if (w2) return finishRound(w2);
        locked = false;
        msg.textContent = 'Jouw beurt';
      }, 450);
    }
    api.score(0);
    newGame();
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
