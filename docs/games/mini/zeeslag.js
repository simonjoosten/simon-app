const LENS = [5, 4, 3, 3, 2];
const NAMES = ['Slagschip', 'Kruiser', 'Onderzeeër', 'Torpedojager', 'Patrouilleboot'];
const N = 10;
function cellsOf(s) {
  const a = [];
  for (let i = 0; i < s.l; i++) a.push(s.h ? s.r * N + s.c + i : (s.r + i) * N + s.c);
  return a;
}
function canPlace(ships, s) {
  if (s.r < 0 || s.c < 0) return false;
  if (s.h ? s.c + s.l > N : s.r + s.l > N) return false;
  if (s.r >= N || s.c >= N) return false;
  const used = new Set();
  for (const o of ships) for (const x of cellsOf(o)) used.add(x);
  return cellsOf(s).every((x) => !used.has(x));
}
function randomShips() {
  const ships = [];
  for (const l of LENS) {
    for (let k = 0; k < 500; k++) {
      const s = { r: Math.floor(Math.random() * N), c: Math.floor(Math.random() * N), l, h: Math.random() < 0.5 };
      if (canPlace(ships, s)) { ships.push(s); break; }
    }
  }
  return ships;
}
const newBoard = (ships) => ({ ships, shots: new Array(N * N).fill(0) });
function shipMap(b) {
  const m = new Array(N * N).fill(-1);
  b.ships.forEach((s, i) => cellsOf(s).forEach((x) => { m[x] = i; }));
  return m;
}
function isSunk(b, s) { return cellsOf(s).every((x) => b.shots[x]); }
function allSunk(b) { return b.ships.every((s) => isSunk(b, s)); }

// Stateloze slimme computer: richt zich op open treffers, anders kansdichtheid.
function aiPick(b) {
  const sm = shipMap(b), sh = b.shots;
  const sunkCells = new Set();
  const left = [];
  b.ships.forEach((s) => { if (isSunk(b, s)) cellsOf(s).forEach((x) => sunkCells.add(x)); else left.push(s.l); });
  const hits = [];
  for (let i = 0; i < N * N; i++) if (sh[i] && sm[i] >= 0 && !sunkCells.has(i)) hits.push(i);
  const free = (r, c) => r >= 0 && c >= 0 && r < N && c < N && !sh[r * N + c];
  if (hits.length) {
    const cand = new Map();
    const add = (r, c, w) => { if (free(r, c)) cand.set(r * N + c, (cand.get(r * N + c) || 0) + w); };
    const lineH = hits.filter((x) => hits.some((y) => y !== x && Math.floor(y / N) === Math.floor(x / N) && Math.abs(y - x) <= 4));
    const lineV = hits.filter((x) => hits.some((y) => y !== x && y % N === x % N && Math.abs(y - x) <= 4 * N));
    for (const x of hits) {
      const r = Math.floor(x / N), c = x % N;
      const inH = lineH.includes(x), inV = lineV.includes(x);
      if (!inH && !inV) { add(r - 1, c, 1); add(r + 1, c, 1); add(r, c - 1, 1); add(r, c + 1, 1); }
      if (inH) { add(r, c - 1, 6); add(r, c + 1, 6); }
      if (inV) { add(r - 1, c, 6); add(r + 1, c, 6); }
    }
    // verder langs de lijn zoeken over gaten heen
    for (const x of lineH) { const r = Math.floor(x / N); let c = x % N; while (c < N && sh[r * N + c] && sm[r * N + c] >= 0 && !sunkCells.has(r * N + c)) c++; add(r, c, 3); c = x % N; while (c >= 0 && sh[r * N + c] && sm[r * N + c] >= 0 && !sunkCells.has(r * N + c)) c--; add(r, c, 3); }
    for (const x of lineV) { const c = x % N; let r = Math.floor(x / N); while (r < N && sh[r * N + c] && sm[r * N + c] >= 0 && !sunkCells.has(r * N + c)) r++; add(r, c, 3); r = Math.floor(x / N); while (r >= 0 && sh[r * N + c] && sm[r * N + c] >= 0 && !sunkCells.has(r * N + c)) r--; add(r, c, 3); }
    let bestV = -1, arr = [];
    cand.forEach((v, k) => { if (v > bestV) { bestV = v; arr = [k]; } else if (v === bestV) arr.push(k); });
    if (arr.length) return arr[Math.floor(Math.random() * arr.length)];
  }
  const dens = new Array(N * N).fill(0);
  for (const l of left) {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      for (const h of [true, false]) {
        if (h ? c + l > N : r + l > N) continue;
        let ok = true;
        for (let i = 0; i < l; i++) { const x = h ? r * N + c + i : (r + i) * N + c; if (sh[x] && !(sm[x] >= 0 && !sunkCells.has(x))) { ok = false; break; } if (sh[x]) { ok = false; break; } }
        if (ok) for (let i = 0; i < l; i++) dens[h ? r * N + c + i : (r + i) * N + c]++;
      }
    }
  }
  let mx = -1, arr = [];
  for (let i = 0; i < N * N; i++) {
    if (sh[i]) continue;
    const par = ((Math.floor(i / N) + (i % N)) % 2 === 0) ? 1.15 : 1;
    const v = dens[i] * par;
    if (v > mx + 1e-9) { mx = v; arr = [i]; } else if (Math.abs(v - mx) < 1e-9) arr.push(i);
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

export default {
  id: 'zeeslag',
  name: 'Zeeslag',
  emoji: '🚢',
  hint: 'Plaats je schepen en zink de vloot van de computer',
  save: 'day',
  create(host, api) {
    host.style.touchAction = 'manipulation';
    host.style.background = '#0d2b4d';
    let dead = false, ended = false, ready = false, busy = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
    let streak = 0, phase = 'place', my = null, en = null, placed = [], horiz = true, msg = '', over = false, lastAi = -1;
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;font-family:system-ui,sans-serif;color:#fff;padding:8px;user-select:none;-webkit-user-select:none;box-sizing:border-box';
    host.appendChild(root);
    const CS = Math.floor(Math.min((api.w - 16) / 10, (api.h - 150) / 15.5, 40));
    const SS = Math.max(12, Math.floor(CS * 0.55));

    function persist() {
      if (!ready || over) return;
      if (phase === 'battle' && my && en) {
        api.save({ streak, phase, my: { s: my.ships, sh: my.shots.join('') }, en: { s: en.ships, sh: en.shots.join('') } });
      } else api.save({ streak, phase: 'place' });
    }
    const shotsFrom = (str) => str.split('').map(Number);

    function gridHtml(board, cs, mine, clickable) {
      const sm = shipMap(board);
      let h = '<div ' + (clickable ? 'data-g="en"' : 'data-g="x"') + ' style="display:grid;grid-template-columns:repeat(10,' + cs + 'px);grid-auto-rows:' + cs + 'px;gap:1px;background:#06182d;padding:1px;border-radius:6px">';
      for (let i = 0; i < N * N; i++) {
        const sh = board.shots[i], si = sm[i];
        let bg = '#1d5c99', t = '';
        if (mine && si >= 0) bg = '#7d8da1';
        if (sh && si >= 0) { bg = '#d6402a'; t = '💥'; if (isSunk(board, board.ships[si])) bg = '#8b1d12'; }
        else if (sh) { t = '•'; bg = '#2c7bc0'; }
        else if (!mine && false) t = '';
        if (!mine && si >= 0 && isSunk(board, board.ships[si])) bg = '#8b1d12';
        let extra = '';
        if (mine && i === lastAi) extra = ';outline:2px solid #ffd54a;outline-offset:-2px';
        h += '<div data-i="' + i + '" style="background:' + bg + ';display:flex;align-items:center;justify-content:center;font-size:' + Math.floor(cs * 0.55) + 'px;line-height:1' + extra + '">' + t + '</div>';
      }
      return h + '</div>';
    }
    function placeGridHtml() {
      const tmp = newBoard(placed);
      return gridHtml(tmp, CS, true, false).replace('data-g="x"', 'data-g="pl"');
    }
    function render() {
      if (!ready) { root.innerHTML = '<div style="margin:auto">Laden...</div>'; return; }
      let h = '<div style="width:100%;display:flex;justify-content:space-between;font-weight:800;font-size:15px"><span>🚢 Zeeslag</span><span>🔥 Reeks ' + streak + '</span></div>';
      if (phase === 'place') {
        const k = placed.length;
        h += '<div style="margin:6px 0;text-align:center;font-weight:700;min-height:40px;font-size:15px">' + (k < LENS.length ? 'Plaats je ' + NAMES[k] + ' (' + LENS[k] + ' vakjes) - tik waar hij begint' : 'Alle schepen staan! Klaar voor de strijd?') + '<br><span style="font-weight:400;font-size:13px;color:#ffd54a">' + msg + '</span></div>';
        h += placeGridHtml();
        h += '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;justify-content:center">';
        h += '<button data-a="rot" style="' + btn('#1d6fd6') + '">' + (horiz ? '↔ Liggend' : '↕ Staand') + '</button>';
        h += '<button data-a="undo" style="' + btn('#555') + '">↩ Terug</button>';
        h += '<button data-a="rnd" style="' + btn('#7a3fc4') + '">🎲 Willekeurig</button>';
        if (placed.length === LENS.length) h += '<button data-a="go" style="' + btn('#17a34a') + ';width:100%;font-size:18px">⚓ Start gevecht!</button>';
        h += '</div>';
      } else {
        const bleft = en.ships.filter((s) => !isSunk(en, s)).length, mleft = my.ships.filter((s) => !isSunk(my, s)).length;
        h += '<div style="margin:4px 0;font-weight:700;font-size:15px;min-height:22px;text-align:center">' + (msg || 'Jouw beurt: tik op de zee van de vijand') + '</div>';
        h += '<div style="font-size:12px;opacity:.8;margin-bottom:2px">Vijandelijke vloot: ' + bleft + ' schepen</div>';
        h += gridHtml(en, CS, false, true);
        h += '<div style="font-size:12px;opacity:.8;margin:6px 0 2px">Jouw vloot: ' + mleft + ' schepen</div>';
        h += gridHtml(my, SS, true, false);
        if (over) h += '<button data-a="next" style="' + btn('#17a34a') + ';margin-top:6px">Volgende ronde ▶</button>';
      }
      root.innerHTML = h;
    }
    function btn(c) { return 'font:inherit;font-weight:800;border:0;border-radius:12px;padding:10px 14px;color:#fff;background:' + c + ';cursor:pointer'; }

    function startBattle() {
      my = newBoard(placed.map((s) => ({ ...s })));
      en = newBoard(randomShips());
      phase = 'battle'; msg = ''; lastAi = -1; over = false; busy = false;
      render(); persist();
    }
    function describe(board, i, who) {
      const sm = shipMap(board);
      if (sm[i] < 0) return who + ': mis 💦';
      const s = board.ships[sm[i]];
      if (isSunk(board, s)) return who + ': ' + NAMES[LENS.indexOf(s.l) >= 0 ? idxName(board, sm[i]) : 0] + ' tot zinken gebracht! 💥';
      return who + ': raak! 🔥';
    }
    function idxName(board, k) { return Math.min(k, NAMES.length - 1); }
    function playerShot(i) {
      if (busy || over || phase !== 'battle' || en.shots[i]) return;
      en.shots[i] = 1;
      msg = describe(en, i, 'Jij');
      if (allSunk(en)) {
        streak++; api.score(streak); over = true; msg = '🎉 Je hebt de hele vloot gezonken!';
        render(); persist(); api.save({ streak, phase: 'place' });
        return;
      }
      busy = true; render();
      later(() => {
        const k = aiPick(my);
        my.shots[k] = 1; lastAi = k;
        const d = describe(my, k, 'Computer');
        msg = msg + '  |  ' + d;
        if (allSunk(my)) {
          over = true; busy = true; msg = '💀 Je vloot is gezonken...';
          api.clear(); render();
          later(() => { if (!ended) { ended = true; api.end(streak); } }, 1500);
          return;
        }
        busy = false; render(); persist();
      }, 700);
    }
    root.addEventListener('click', (e) => {
      if (!ready || ended) return;
      const a = e.target.closest('[data-a]');
      if (a) {
        const k = a.dataset.a;
        if (phase === 'place') {
          if (k === 'rot') horiz = !horiz;
          else if (k === 'undo') placed.pop();
          else if (k === 'rnd') placed = randomShips();
          else if (k === 'go' && placed.length === LENS.length) { startBattle(); return; }
          msg = ''; render();
        } else if (k === 'next' && over && !ended) {
          phase = 'place'; placed = []; my = null; en = null; msg = ''; over = false; render(); persist();
        }
        return;
      }
      const c = e.target.closest('[data-i]');
      if (!c) return;
      const i = Number(c.dataset.i);
      const g = c.parentNode.dataset.g;
      if (phase === 'place' && g === 'pl') {
        if (placed.length >= LENS.length) return;
        const l = LENS[placed.length];
        let r = Math.floor(i / N), cc = i % N;
        if (horiz) cc = Math.min(cc, N - l); else r = Math.min(r, N - l);
        const s = { r, c: cc, l, h: horiz };
        if (canPlace(placed, s)) { placed.push(s); msg = ''; } else msg = 'Daar kan hij niet (overlap)';
        render();
      } else if (phase === 'battle' && g === 'en') playerShot(i);
    });

    render();
    api.load().then((s) => {
      if (dead) return;
      if (s && typeof s.streak === 'number') streak = s.streak;
      if (s && s.phase === 'battle' && s.my && s.en) {
        try {
          my = { ships: s.my.s, shots: shotsFrom(s.my.sh) };
          en = { ships: s.en.s, shots: shotsFrom(s.en.sh) };
          if (my.shots.length !== 100 || en.shots.length !== 100 || my.ships.length !== LENS.length) throw new Error('bad');
          phase = 'battle'; msg = 'Weer verder! Jouw beurt.';
        } catch (err) { phase = 'place'; my = null; en = null; }
      }
      ready = true; api.score(streak); render();
    }).catch(() => { if (dead) return; ready = true; render(); });
    return {
      destroy() {
        dead = true; timers.forEach(clearTimeout); timers.clear();
        if (ready && !busy) persist();
        if (root.parentNode) root.parentNode.removeChild(root);
      },
    };
  },
};
