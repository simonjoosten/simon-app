export default {
  id: 'geheugen', name: 'Geheugen', emoji: '🧠', hint: 'Vind alle paren, zo snel en met zo min mogelijk zetten',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = 'linear-gradient(#2d1b69,#11998e)';
    host.style.display = 'flex'; host.style.flexDirection = 'column'; host.style.fontFamily = 'system-ui,sans-serif';
    const info = document.createElement('div');
    info.style.cssText = 'height:48px;display:flex;align-items:center;justify-content:space-around;color:#fff;font-size:16px;font-weight:700';
    const board = document.createElement('div');
    host.appendChild(info); host.appendChild(board);
    const EMO = ['🐶', '🐱', '🦊', '🐸', '🐵', '🦁', '🐼', '🐙', '🦄', '🐢', '🍕', '🍩', '🚀', '⚽', '🎈', '🌵', '🍉', '🎸'];
    let dead = false, ended = false, round = 0, score = 0, moves = 0, matched = 0, first = null, lock = false, t0 = 0, cards = [], pairs = 0;
    const timers = [];
    function later(fn, ms) { const id = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(id); }
    const LAYOUTS = [[4, 4], [4, 5], [5, 6], [6, 6]];
    let tick = 0;
    function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    function newRound() {
      board.innerHTML = '';
      const [rows, cols] = LAYOUTS[Math.min(round, LAYOUTS.length - 1)];
      pairs = rows * cols / 2;
      const set = shuffle(EMO.slice()).slice(0, pairs);
      const deck = shuffle(set.concat(set));
      board.style.cssText = 'flex:1;display:grid;gap:6px;padding:8px;grid-template-columns:repeat(' + cols + ',1fr);grid-template-rows:repeat(' + rows + ',1fr)';
      cards = deck.map((e, i) => {
        const d = document.createElement('div');
        d.style.cssText = 'border-radius:12px;background:#ffb300;display:flex;align-items:center;justify-content:center;font-size:' + (cols > 4 ? 26 : 34) + 'px;color:#fff;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;transition:background .15s';
        d.textContent = '?'; d.dataset.i = i;
        board.appendChild(d);
        return { e, el: d, open: false, done: false };
      });
      moves = 0; matched = 0; first = null; lock = false; t0 = performance.now();
      upd();
    }
    function upd() {
      const s = Math.floor((performance.now() - t0) / 1000);
      info.innerHTML = '<span>Ronde ' + (round + 1) + '</span><span>Zetten ' + moves + '</span><span>⏱ ' + s + 's</span>';
    }
    tick = setInterval(() => { if (!dead && !ended && !lock) upd(); }, 500);
    function show(c, on) {
      c.open = on; c.el.textContent = on ? c.e : '?'; c.el.style.background = on ? '#fff' : '#ffb300';
    }
    function flip(i) {
      if (lock || ended) return;
      const c = cards[i]; if (!c || c.open || c.done) return;
      show(c, true);
      if (!first) { first = c; return; }
      moves++;
      const a = first; first = null;
      if (a.e === c.e) {
        a.done = c.done = true; a.el.style.background = '#b9f6ca'; c.el.style.background = '#b9f6ca'; matched++;
        if (matched >= pairs) finishRound();
      } else {
        lock = true;
        later(() => { show(a, false); show(c, false); lock = false; }, 800);
      }
      upd();
    }
    function finishRound() {
      lock = true;
      const secs = (performance.now() - t0) / 1000;
      const par = pairs * 2 + 2, parT = pairs * 4;
      const bonus = Math.max(0, (par + pairs - moves) * 5) + Math.max(0, Math.round((parT - secs) * 2));
      score += pairs * 20 + bonus; api.score(score);
      info.innerHTML = '<span>Gelukt! +' + (pairs * 20 + bonus) + '</span>';
      round++;
      // game ends after the 4th round or when a round is too sloppy (more than 4x pairs moves)
      if (round >= 6 || moves > pairs * 4) {
        ended = true; later(() => api.end(score), 1000);
      } else later(newRound, 1200);
    }
    const pd = e => { const t = e.target.closest ? e.target.closest('[data-i]') : null; if (t) { e.preventDefault(); flip(+t.dataset.i); } };
    board.addEventListener('pointerdown', pd);
    api.score(0);
    newRound();
    return { destroy() {
      dead = true; timers.forEach(clearTimeout); clearInterval(tick);
      board.removeEventListener('pointerdown', pd);
      info.remove(); board.remove();
    } };
  },
};
