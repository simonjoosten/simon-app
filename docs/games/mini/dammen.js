// Bord: 64 vakjes, index r*8+c. Waarden: 1 wit man, 2 wit dam, -1 zwart man, -2 zwart dam. Speler = wit (onderaan).
const DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const inB = (r, c) => r >= 0 && c >= 0 && r < 8 && c < 8;
function startBoard() {
  const b = new Array(64).fill(0);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) { if (r < 3) b[r * 8 + c] = -1; else if (r > 4) b[r * 8 + c] = 1; }
  return b;
}
function capSeq(b, from, side, res) {
  const piece = b[from], king = Math.abs(piece) === 2;
  const r0 = Math.floor(from / 8), c0 = from % 8;
  b[from] = 0;
  const captured = [];
  const isCap = new Set();
  const rec = (r, c, path) => {
    let any = false;
    for (const [dr, dc] of DIRS) {
      let nr = r + dr, nc = c + dc;
      if (king) while (inB(nr, nc) && b[nr * 8 + nc] === 0) { nr += dr; nc += dc; }
      if (!inB(nr, nc)) continue;
      const ti = nr * 8 + nc, tv = b[ti];
      if (tv === 0 || Math.sign(tv) === side || isCap.has(ti)) continue;
      let lr = nr + dr, lc = nc + dc;
      if (!inB(lr, lc) || b[lr * 8 + lc] !== 0) continue;
      isCap.add(ti); captured.push(ti);
      const lands = [];
      while (inB(lr, lc) && b[lr * 8 + lc] === 0) { lands.push([lr, lc]); if (!king) break; lr += dr; lc += dc; }
      for (const [a, c2] of lands) { any = true; rec(a, c2, path.concat(a * 8 + c2)); }
      captured.pop(); isCap.delete(ti);
    }
    if (!any && path.length) res.push({ from, to: path[path.length - 1], cap: captured.slice(), path });
  };
  // captured moet bij 'rec' op de leaf kloppen: gebruik kopie in push (zie hierboven: any=false pas op leaf)
  rec(r0, c0, []);
  b[from] = piece;
}
function genMoves(b, side) {
  const caps = [];
  for (let i = 0; i < 64; i++) if (b[i] !== 0 && Math.sign(b[i]) === side) capSeq(b, i, side, caps);
  if (caps.length) {
    let mx = 0;
    for (const m of caps) mx = Math.max(mx, m.cap.length);
    return caps.filter((m) => m.cap.length === mx);
  }
  const res = [];
  for (let i = 0; i < 64; i++) {
    const v = b[i];
    if (v === 0 || Math.sign(v) !== side) continue;
    const r = Math.floor(i / 8), c = i % 8, king = Math.abs(v) === 2;
    for (const [dr, dc] of DIRS) {
      if (!king && dr !== -side) continue;
      let nr = r + dr, nc = c + dc;
      while (inB(nr, nc) && b[nr * 8 + nc] === 0) {
        res.push({ from: i, to: nr * 8 + nc, cap: [], path: [nr * 8 + nc] });
        if (!king) break;
        nr += dr; nc += dc;
      }
    }
  }
  return res;
}
function applyMove(b, m) {
  const nb = b.slice();
  const v = nb[m.from];
  nb[m.from] = 0;
  for (const x of m.cap) nb[x] = 0;
  const r = Math.floor(m.to / 8);
  let nv = v;
  if (Math.abs(v) === 1 && ((v === 1 && r === 0) || (v === -1 && r === 7))) nv = v * 2;
  nb[m.to] = nv;
  return nb;
}
function evalB(b) {
  let s = 0;
  for (let i = 0; i < 64; i++) {
    const v = b[i];
    if (!v) continue;
    const r = Math.floor(i / 8), c = i % 8, side = Math.sign(v);
    let x;
    if (Math.abs(v) === 2) x = 320;
    else {
      const adv = side === 1 ? 7 - r : r;
      x = 100 + adv * 4 + ((side === 1 && r === 7) || (side === -1 && r === 0) ? 6 : 0);
    }
    if (c === 0 || c === 7) x += 3;
    if (r >= 2 && r <= 5 && c >= 2 && c <= 5) x += 2;
    s += side * x;
  }
  return s; // positief = goed voor wit
}
function search(b, side, depth, alpha, beta) {
  const ms = genMoves(b, side);
  if (!ms.length) return side === 1 ? -(100000 + depth) : 100000 + depth;
  if (depth === 0) return evalB(b);
  if (side === 1) {
    let best = -Infinity;
    for (const m of ms) { const v = search(applyMove(b, m), -1, depth - 1, alpha, beta); if (v > best) best = v; if (best > alpha) alpha = best; if (alpha >= beta) break; }
    return best;
  }
  let best = Infinity;
  for (const m of ms) { const v = search(applyMove(b, m), 1, depth - 1, alpha, beta); if (v < best) best = v; if (best < beta) beta = best; if (alpha >= beta) break; }
  return best;
}
function aiMove(b, depth) {
  const ms = genMoves(b, -1);
  if (ms.length === 1) return ms[0];
  let bestV = Infinity, arr = [];
  for (const m of ms) {
    const v = search(applyMove(b, m), 1, depth - 1, -Infinity, Infinity);
    if (v < bestV - 1e-9) { bestV = v; arr = [m]; } else if (Math.abs(v - bestV) < 1e-9) arr.push(m);
  }
  return arr[Math.floor(Math.random() * arr.length)];
}
const enc = (b) => b.map((v) => v + 2).join('');
const dec = (s) => s.split('').map((x) => Number(x) - 2);

export default {
  id: 'dammen',
  name: 'Dammen',
  emoji: '⚫',
  hint: 'Tik een steen en dan een vakje - slaan is verplicht',
  save: 'day',
  create(host, api) {
    host.style.touchAction = 'manipulation';
    host.style.background = '#3b2616';
    let dead = false, ended = false, ready = false, busy = false, over = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
    let board = startBoard(), streak = 0, sel = -1, moves = [], msg = 'Jij speelt wit', last = [], quiet = 0;
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;font-family:system-ui,sans-serif;color:#fff;padding:8px;box-sizing:border-box;user-select:none;-webkit-user-select:none';
    host.appendChild(root);
    const CS = Math.floor(Math.min((api.w - 16) / 8, (api.h - 130) / 8, 56));

    function persist() { if (ready && !over) api.save({ b: enc(board), streak, q: quiet }); }
    function render() {
      if (!ready) { root.innerHTML = '<div style="margin:auto">Laden...</div>'; return; }
      const mine = busy || over ? [] : moves;
      const froms = new Set(mine.map((m) => m.from));
      const tos = new Set(mine.filter((m) => m.from === sel).map((m) => m.to));
      const w = board.filter((v) => v > 0).length, z = board.filter((v) => v < 0).length;
      let h = '<div style="width:100%;display:flex;justify-content:space-between;font-weight:800;font-size:15px"><span>⚫ Dammen</span><span>🔥 Reeks ' + streak + '</span></div>';
      h += '<div style="margin:6px 0;font-weight:700;font-size:15px;min-height:22px;text-align:center">' + msg + '</div>';
      h += '<div style="display:grid;grid-template-columns:repeat(8,' + CS + 'px);grid-auto-rows:' + CS + 'px;border:4px solid #1d1008;border-radius:4px">';
      for (let i = 0; i < 64; i++) {
        const r = Math.floor(i / 8), c = i % 8, dark = (r + c) % 2 === 1, v = board[i];
        let bg = dark ? '#6b4423' : '#e8d3a8';
        if (last.includes(i)) bg = '#9a7a2c';
        let inner = '';
        if (v) {
          const white = v > 0;
          inner = '<div style="width:80%;height:80%;border-radius:50%;background:' + (white ? 'radial-gradient(circle at 35% 30%,#fff,#d6cdbd)' : 'radial-gradient(circle at 35% 30%,#555,#111)') + ';box-shadow:0 2px 3px rgba(0,0,0,.6),inset 0 0 0 3px ' + (white ? '#b9ad96' : '#333') + ';display:flex;align-items:center;justify-content:center;font-size:' + Math.floor(CS * 0.45) + 'px' + (i === sel ? ';outline:3px solid #ffd54a' : (froms.has(i) && !busy ? ';outline:2px solid #4ade80' : '')) + '">' + (Math.abs(v) === 2 ? '👑' : '') + '</div>';
        } else if (tos.has(i)) inner = '<div style="width:34%;height:34%;border-radius:50%;background:#4ade80;opacity:.85"></div>';
        h += '<div data-i="' + i + '" style="background:' + bg + ';display:flex;align-items:center;justify-content:center">' + inner + '</div>';
      }
      h += '</div><div style="margin-top:8px;font-size:14px;opacity:.85">Jij: ' + w + ' stenen · Computer: ' + z + ' stenen</div>';
      if (over && !ended) h += '<button data-a="next" style="font:inherit;font-weight:800;border:0;border-radius:12px;padding:10px 20px;color:#fff;background:#17a34a;margin-top:10px">Volgende partij ▶</button>';
      root.innerHTML = h;
    }
    function newGame() {
      board = startBoard(); sel = -1; last = []; quiet = 0; over = false; busy = false;
      msg = 'Jij speelt wit - jij begint'; moves = genMoves(board, 1); render(); persist();
    }
    function afterPlayer() {
      moves = genMoves(board, -1);
      if (!moves.length) return win();
      if (quiet >= 50) return draw();
      busy = true; render();
      later(() => {
        const mv = aiMove(board, 6);
        quiet = (mv.cap.length || Math.abs(board[mv.from]) === 1) ? 0 : quiet + 1;
        board = applyMove(board, mv); last = [mv.from, mv.to]; sel = -1;
        moves = genMoves(board, 1);
        busy = false;
        if (!moves.length) return lose();
        if (quiet >= 50) return draw();
        msg = mv.cap.length ? 'Computer sloeg ' + mv.cap.length + ' steen/stenen' : 'Jouw beurt';
        if (moves.length && moves[0].cap.length) msg += ' - je moet slaan!';
        render(); persist();
      }, 450);
    }
    function win() { streak++; api.score(streak); over = true; busy = false; msg = '🎉 Gewonnen! De computer kan niet meer zetten.'; api.save({ streak, newgame: 1 }); render(); }
    function draw() { over = true; busy = false; msg = '🤝 Remise (te lang zonder slaan)'; api.save({ streak, newgame: 1 }); render(); }
    function lose() {
      over = true; msg = '💀 Verloren...'; api.clear(); render();
      later(() => { if (!ended) { ended = true; api.end(streak); } }, 1500);
    }
    root.addEventListener('click', (e) => {
      if (!ready || ended) return;
      if (e.target.closest('[data-a="next"]')) { if (over) newGame(); return; }
      if (busy || over) return;
      const c = e.target.closest('[data-i]');
      if (!c) return;
      const i = Number(c.dataset.i);
      const mv = moves.filter((m) => m.from === sel && m.to === i);
      if (mv.length) {
        const m = mv[0];
        quiet = (m.cap.length || Math.abs(board[m.from]) === 1) ? 0 : quiet + 1;
        board = applyMove(board, m); last = [m.from, m.to]; sel = -1;
        msg = 'Computer denkt na...';
        afterPlayer();
        return;
      }
      if (moves.some((m) => m.from === i)) { sel = i; msg = 'Kies waar je heen wilt'; }
      else { sel = -1; if (moves.length && moves[0].cap.length) msg = 'Je moet slaan!'; }
      render();
    });
    render();
    api.load().then((s) => {
      if (dead) return;
      if (s && typeof s.streak === 'number') streak = s.streak;
      if (s && typeof s.b === 'string' && s.b.length === 64) { board = dec(s.b); quiet = s.q || 0; msg = 'Weer verder! Jouw beurt.'; }
      ready = true; api.score(streak);
      moves = genMoves(board, 1);
      if (!moves.length) { board = startBoard(); moves = genMoves(board, 1); }
      render();
    }).catch(() => { if (dead) return; ready = true; moves = genMoves(board, 1); render(); });
    return {
      destroy() {
        dead = true; timers.forEach(clearTimeout); timers.clear();
        if (ready && !busy) persist();
        if (root.parentNode) root.parentNode.removeChild(root);
      },
    };
  },
};
