// Kratjes schuiven - Sokoban-achtig puzzelspel. Alleen duwen, nooit trekken.
// Levels: 60 vaste levels (hieronder, elk met bewezen oplossing via tools/test-mini-kratjes.mjs)
// en daarna een eindeloze modus met gegenereerde levels (achteruit gebouwd: oplosbaar per constructie).

// ---------- pure logica (ook door het testscript gebruikt) ----------
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // links, rechts, boven, onder

export function parse(m) {
  const rows = m.split('/');
  const h = rows.length, w = rows[0].length;
  const walls = new Uint8Array(w * h), goals = new Uint8Array(w * h);
  const box0 = [];
  let p0 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = rows[y][x], i = y * w + x;
      if (c === '#') walls[i] = 1;
      if (c === '.' || c === '*' || c === '+') goals[i] = 1;
      if (c === '$' || c === '*') box0.push(i);
      if (c === '@' || c === '+') p0 = i;
    }
  }
  const D = [-1, 1, -w, w];
  // dode vakjes: een kist die hier staat kan nooit meer naar een doel
  const alive = new Uint8Array(w * h);
  const q = [];
  for (let i = 0; i < w * h; i++) if (goals[i]) { alive[i] = 1; q.push(i); }
  while (q.length) {
    const x = q.pop();
    for (let d = 0; d < 4; d++) {
      const y = x - D[d];
      if (y < 0 || walls[y] || alive[y]) continue;
      const z = y - D[d];
      if (z < 0 || walls[z]) continue;
      alive[y] = 1; q.push(y);
    }
  }
  const dead = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) if (!walls[i] && !alive[i]) dead[i] = 1;
  return { w, h, walls, goals, box0, p0, dead, D };
}

function flood(L, p, occ) {
  const seen = new Uint8Array(L.w * L.h);
  const st = [p]; seen[p] = 1;
  while (st.length) {
    const c = st.pop();
    for (let d = 0; d < 4; d++) {
      const n = c + L.D[d];
      if (seen[n] || L.walls[n] || occ[n]) continue;
      seen[n] = 1; st.push(n);
    }
  }
  return seen;
}

// Zoekt de kortste reeks duwen (BFS over duw-toestanden). Geeft [{from,dir}] terug, [] als al opgelost, null als niet gevonden binnen cap.
export function solve(L, boxes0, player0, cap = 300000) {
  const N = L.w * L.h;
  const isWin = (b) => { for (let i = 0; i < b.length; i++) if (!L.goals[b[i]]) return false; return true; };
  const start = boxes0.slice().sort((a, b) => a - b);
  if (isWin(start)) return [];
  const nodes = [{ b: start, p: player0, par: -1, from: -1, dir: -1 }];
  const seen = new Set();
  const keyOf = (b, region) => {
    let c = 0; while (!region[c]) c++;
    return b.join(',') + ':' + c;
  };
  const occ0 = new Uint8Array(N); for (const b of start) occ0[b] = 1;
  seen.add(keyOf(start, flood(L, player0, occ0)));
  for (let qi = 0; qi < nodes.length; qi++) {
    if (nodes.length > cap) return null;
    const nd = nodes[qi];
    const occ = new Uint8Array(N); for (const b of nd.b) occ[b] = 1;
    const region = flood(L, nd.p, occ);
    for (let bi = 0; bi < nd.b.length; bi++) {
      const b = nd.b[bi];
      for (let d = 0; d < 4; d++) {
        const stand = b - L.D[d], nb = b + L.D[d];
        if (!region[stand] || L.walls[nb] || occ[nb]) continue;
        if (L.dead[nb]) continue;
        const nbs = nd.b.slice(); nbs[bi] = nb; nbs.sort((x, y) => x - y);
        const occ2 = occ.slice(); occ2[b] = 0; occ2[nb] = 1;
        const reg2 = flood(L, b, occ2);
        const k = keyOf(nbs, reg2);
        if (seen.has(k)) continue;
        seen.add(k);
        const child = { b: nbs, p: b, par: qi, from: b, dir: d };
        nodes.push(child);
        if (isWin(nbs)) {
          const path = [];
          let c = child;
          while (c.par >= 0) { path.push({ from: c.from, dir: c.dir }); c = nodes[c.par]; }
          return path.reverse();
        }
      }
    }
  }
  return null; // onoplosbaar
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Bouwt een level door vanuit de opgeloste stand willekeurig kratten te TREKKEN (omgekeerde duw). Elke omgekeerde zet is een
// geldige duw als je hem terugspeelt, dus het level is per constructie oplosbaar. o = {w,h,boxes,walls,pulls}
export function genLevel(seed, o) {
  const rnd = mulberry32(seed);
  const { w, h } = o;
  const D = [-1, 1, -w, w];
  for (let attempt = 0; attempt < 400; attempt++) {
    const walls = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x === 0 || y === 0 || x === w - 1 || y === h - 1) walls[y * w + x] = 1;
    const floor = [];
    for (let i = 0; i < w * h; i++) if (!walls[i]) floor.push(i);
    // muurtjes
    let placed = 0, guard = 0;
    while (placed < o.walls && guard++ < 200) {
      const c = floor[Math.floor(rnd() * floor.length)];
      if (walls[c]) continue;
      walls[c] = 1; placed++;
      if (rnd() < 0.5) { // soms een stukje muur van twee
        const n = c + D[Math.floor(rnd() * 4)];
        if (!walls[n] && placed < o.walls) { walls[n] = 1; placed++; }
      }
    }
    const free = [];
    for (let i = 0; i < w * h; i++) if (!walls[i]) free.push(i);
    if (free.length < o.boxes * 3 + 3) continue;
    const L0 = { w, h, walls, D };
    const none = new Uint8Array(w * h);
    if (flood(L0, free[0], none).reduce((s, v) => s + v, 0) !== free.length) continue; // alles verbonden
    // doelen en kratten
    const pool = free.slice();
    const goals = [];
    for (let k = 0; k < o.boxes; k++) goals.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    const boxes = goals.slice();
    let player = pool[Math.floor(rnd() * pool.length)];
    let done = 0;
    const trail = [];
    for (let tries = 0; tries < o.pulls * 12 && done < o.pulls; tries++) {
      const occ = new Uint8Array(w * h); for (const b of boxes) occ[b] = 1;
      const region = flood(L0, player, occ);
      const cands = [];
      for (let bi = 0; bi < boxes.length; bi++) {
        const b = boxes[bi];
        for (let d = 0; d < 4; d++) {
          const P1 = b - D[d];           // speler staat naast de kist
          const p = P1 - D[d];           // en trekt hem naar zich toe
          if (walls[P1] || occ[P1] || !region[P1]) continue;
          if (walls[p] || occ[p]) continue;
          cands.push([bi, P1, p]);
        }
      }
      if (!cands.length) break;
      const [bi, P1, p] = cands[Math.floor(rnd() * cands.length)];
      trail.push({ from: boxes[bi], to: P1, d: D.indexOf(boxes[bi] - P1) });
      boxes[bi] = P1; player = p; done++;
    }
    if (done < Math.max(2, Math.floor(o.pulls * 0.6))) continue;
    if (boxes.every((b) => goals.includes(b))) continue;
    const occ = new Uint8Array(w * h); for (const b of boxes) occ[b] = 1;
    const region = flood(L0, player, occ);
    const cells = []; for (let i = 0; i < w * h; i++) if (region[i] && !occ[i]) cells.push(i);
    player = cells[Math.floor(rnd() * cells.length)];
    const rows = [];
    for (let y = 0; y < h; y++) {
      let r = '';
      for (let x = 0; x < w; x++) {
        const i = y * w + x, g = goals.includes(i), b = boxes.includes(i);
        r += walls[i] ? '#' : b ? (g ? '*' : '$') : i === player ? (g ? '+' : '@') : g ? '.' : ' ';
      }
      rows.push(r);
    }
    return { m: rows.join('/'), pulls: done, trail };
  }
  return null;
}

// eindeloze modus: n = 0,1,2,...
export function endlessParams(n) {
  const size = Math.min(10, 8 + (n >> 3));
  const boxes = 3 + (n % 10 > 5 ? 1 : 0);
  return { w: size, h: size - 1 - (n % 2), boxes, walls: 7 + (n % 5), pulls: 14 + (n % 13) };
}

// ---------- vaste levels (gegenereerd en door de solver gecontroleerd; o = minimaal aantal duwen) ----------
export const LEVELS = [
  {m:"######/#    #/# $ @#/#  . #/#    #/######",o:2},
  {m:"######/#    #/#    #/# $  #/#+   #/######",o:2},
  {m:"######/#.  ##/# $# #/# @  #/#    #/######",o:4},
  {m:"######/#    #/## $ #/##   #/#  @.#/######",o:3},
  {m:"######/#@ . #/#   ##/# $  #/##   #/######",o:3},
  {m:"######/#    #/#@$###/#    #/#   .#/######",o:4},
  {m:"#######/# .   #/#     #/##  $##/##  @ #/#######",o:4},
  {m:"#######/# ##@##/#. #$ #/#     #/#     #/#######",o:5},
  {m:"#######/#  ## #/#  #  #/# $   #/##@# .#/#######",o:6},
  {m:"#######/#.    #/###   #/#@$   #/#  #  #/#######",o:7},
  {m:"#######/#  ## #/#  ## #/#   $ #/#   @.#/#######",o:6},
  {m:"#######/# ##  #/#@$   #/###   #/#.   ##/#######",o:7},
  {m:"#######/### @ #/## $  #/#  $  #/#  .  #/#    .#/#######",o:6},
  {m:"#######/#.  . #/##    #/## $$ #/# @ # #/#######",o:8},
  {m:"#######/#   @ #/#  #  #/# $#. #/#  $  #/# # . #/#######",o:8},
  {m:"#######/#     #/##    #/# #$$ #/#+.  ##/#######",o:8},
  {m:"#######/#    .#/# .####/#   $@#/# $  ##/#     #/#######",o:9},
  {m:"#######/#   #@#/#   $ #/# $ ###/#  ..##/#######",o:8},
  {m:"#######/#    ##/##  $@#/#   $ #/# . # #/#.  # #/#######",o:9},
  {m:"#######/#.    #/##   .#/#@$ $ #/##  ###/#######",o:9},
  {m:"#######/#@    #/# $   #/####$ #/## .  #/##.   #/#######",o:9},
  {m:"#######/##   .#/#   .##/# $ $@#/#  ####/#######",o:10},
  {m:"#######/#.    #/#  $  #/# # $ #/# ##  #/#.@## #/#######",o:10},
  {m:"#######/#   ###/#   $@#/#.# $ #/#.#  ##/#######",o:10},
  {m:"########/#. #@  #/#. # # #/#  #   #/#  $ $ #/#      #/########",o:11},
  {m:"########/# ##   #/#.#@$  #/#.#$   #/#      #/#      #/########",o:11},
  {m:"########/#. .   #/### @  #/#      #/# $ #$ #/#   #  #/########",o:11},
  {m:"########/#    . #/#   ####/#   $  #/##$    #/#@    .#/########",o:12},
  {m:"########/# ##   #/# $ $  #/#    @.#/#.# $# #/#  . # #/########",o:14},
  {m:"########/# .    #/#.##   #/#  $  ##/#.  $$@#/#  ##  #/########",o:12},
  {m:"########/#  @  ##/# $ #..#/# $ #  #/##   $ #/##  .  #/########",o:14},
  {m:"########/#. . $ #/# ##   #/##     #/# $  $ #/#@# # .#/########",o:14},
  {m:"########/#   @###/#.   $ #/# #  $ #/#.## $ #/## .   #/########",o:14},
  {m:"########/#    + #/# $ $ ##/#  ##.##/# $ #  #/#   #. #/########",o:14},
  {m:"########/### .  #/#   .  #/# $# #@#/# $ $#.#/#     ##/########",o:14},
  {m:"########/#  .  .#/#  $.# #/#  #####/# $$  ##/# @    #/########",o:13},
  {m:"########/####   #/#@$    #/# $ #..#/# $ # .#/# #   ##/########",o:18},
  {m:"########/#  #####/# $ ## #/# $   .#/# $    #/#@ # ..#/########",o:15},
  {m:"#########/#      ##/# $ $ ###/#       #/#  .    #/# $## . #/# @#   .#/#########",o:16},
  {m:"#########/#   ..###/# $  # @#/#  ###$ #/#  $    #/#.      #/#########",o:17},
  {m:"#########/# .#   .#/#  #  $ #/#. #  @ #/#    $$ #/#     # #/##  #   #/#########",o:16},
  {m:"#########/# .     #/#       #/###.  ###/# $.#$$ #/#   #@  #/#########",o:17},
  {m:"#########/#   . .##/#   .  ##/# $ ### #/#    $  #/#    $  #/#@##    #/#########",o:18},
  {m:"#########/#  $.#  #/#       #/#  ##   #/#.. #$$ #/# ## @ ##/#########",o:17},
  {m:"#########/#. # .  #/#       #/#.    $ #/# #    ##/# # $$  #/####   @#/#########",o:16},
  {m:"#########/#   #. ##/# $$#   #/#    .  #/#@$##  .#/#  ##   #/#########",o:18},
  {m:"#########/#  .    #/#  $  $ #/# #   # #/# #.#   #/#.  # $ #/#@##   ##/#########",o:17},
  {m:"#########/### .# ##/#  #  $ #/# $     #/# $#   ##/#@ #  ..#/#########",o:17},
  {m:"#########/#    ##.#/#@$$##  #/### # # #/#   ..  #/#     $ #/#       #/#########",o:17},
  {m:"#########/#@##  . #/# ##$# ##/#       #/# $ # $ #/#   #. .#/#########",o:19},
  {m:"##########/#.     ###/#   $  $ #/#   $ #  #/#    ## ##/#    #   #/#   .# @ #/#.       #/##########",o:18},
  {m:"##########/# .  @.# #/#   ###  #/##$   #  #/#    # $ #/#      $ #/#  # .   #/##########",o:19},
  {m:"##########/#  #    ##/#  #..   #/#  #     #/# #      #/#        #/#$$#$  # #/#+ #     #/##########",o:20},
  {m:"##########/# @   .# #/# $#   # #/# $  ##  #/# $      #/##      .#/##    . ##/##########",o:19},
  {m:"##########/#    #  .#/##$      #/## $     #/#     ## #/#.$    #.#/#   # @# #/#   #    #/##########",o:19},
  {m:"##########/###   #  #/# $   #. #/#@$#     #/# $  ##  #/###$  .. #/#.       #/##########",o:22},
  {m:"##########/#.     . #/#  #     #/##    ####/##       #/#.       #/# #$$$ $ #/# # + #  #/##########",o:22},
  {m:"##########/#    @# .#/# $####$ #/#        #/# #    $ #/### .. $ #/##.      #/##########",o:24},
  {m:"##########/##       #/#  $    .#/#    $ #.#/#  ##  #.#/# . # $@##/##  #  $ #/#   #    #/##########",o:25},
  {m:"##########/#   ###  #/#  . ##  #/#$.  #@$ #/#     $  #/#.#$     #/#.#  ##  #/##########",o:21},
];

// ---------- het spel ----------
export default {
  id: 'kratjes',
  name: 'Kratjes schuiven',
  emoji: '📦',
  hint: 'Veeg of tik om te lopen en duw de kratten op de doelen. Trekken kan niet!',
  save: 'forever',
  create(host, api) {
    host.style.touchAction = 'none';
    let dead = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); };

    // ----- DOM -----
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;background:linear-gradient(170deg,#2a2018,#4b3524 60%,#5b4029);color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;box-sizing:border-box;user-select:none;-webkit-user-select:none;overflow:hidden';
    host.appendChild(root);
    const style = document.createElement('style');
    style.textContent = '@keyframes krPop{0%{transform:scale(0) rotate(-40deg);opacity:0}70%{transform:scale(1.35) rotate(8deg);opacity:1}100%{transform:scale(1) rotate(0)}}@keyframes krCard{0%{transform:translateY(30px) scale(.8);opacity:0}100%{transform:none;opacity:1}}.kr-btn{border:0;border-radius:14px;color:#fff;font-weight:700;font-size:15px;cursor:pointer;touch-action:manipulation;font-family:inherit}.kr-btn:active{transform:scale(.95)}.kr-btn[disabled]{opacity:.35}';
    root.appendChild(style);
    const mk = (tag, css, txt) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; };

    const top = mk('div', 'display:flex;align-items:center;gap:8px;padding:10px 10px 4px;flex:none');
    const bPrev = mk('button', 'width:44px;height:44px;font-size:20px;background:#ffffff22', '◀'); bPrev.className = 'kr-btn';
    const bNext = mk('button', 'width:44px;height:44px;font-size:20px;background:#ffffff22', '▶'); bNext.className = 'kr-btn';
    const mid = mk('div', 'flex:1;text-align:center;line-height:1.2');
    const title = mk('div', 'font-size:20px;font-weight:800');
    const sub = mk('div', 'font-size:13px;opacity:.85;margin-top:2px');
    mid.append(title, sub);
    top.append(bPrev, mid, bNext);
    const info = mk('div', 'flex:none;min-height:22px;text-align:center;font-size:14px;padding:0 12px;color:#ffe9a8');
    const holder = mk('div', 'flex:1;min-height:0;position:relative');
    const cv = mk('canvas', 'position:absolute;left:0;top:0;width:100%;height:100%;touch-action:none');
    holder.appendChild(cv);
    const bottom = mk('div', 'display:flex;gap:8px;padding:6px 10px 12px;flex:none');
    const bUndo = mk('button', 'flex:1;height:50px;background:#3b82f6', '↩ Terug'); bUndo.className = 'kr-btn';
    const bReset = mk('button', 'flex:1;height:50px;background:#ef6c3c', '🔄 Opnieuw'); bReset.className = 'kr-btn';
    const bHint = mk('button', 'flex:1;height:50px;background:#16a34a'); bHint.className = 'kr-btn';
    bottom.append(bUndo, bReset, bHint);
    root.append(top, info, holder, bottom);
    const overlay = mk('div', 'position:absolute;left:0;top:0;width:100%;height:100%;display:none;align-items:center;justify-content:center;background:#0006;z-index:5');
    root.appendChild(overlay);
    const ctx = cv.getContext('2d');

    // ----- geluid (zacht, alleen korte tikjes) -----
    let ac = null;
    function audio() {
      if (ac) return ac;
      try { const A = window.AudioContext || window.webkitAudioContext; if (A) ac = new A(); } catch (e) { ac = null; }
      return ac;
    }
    function tone(f, dur, type, vol, f2, delay = 0) {
      const a = audio(); if (!a || dead) return;
      try {
        const t = a.currentTime + delay;
        const o = a.createOscillator(), g = a.createGain();
        o.type = type; o.frequency.setValueAtTime(f, t);
        if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
      } catch (e) { /* geluid is bijzaak */ }
    }
    const sStep = () => tone(260, 0.05, 'triangle', 0.025);
    const sPush = () => tone(150, 0.14, 'triangle', 0.09, 70);
    const sBump = () => tone(90, 0.08, 'square', 0.03);
    const sGoal = () => { tone(784, 0.18, 'sine', 0.06); tone(1175, 0.22, 'sine', 0.045, 0, 0.07); };
    const sUndo = () => tone(420, 0.1, 'triangle', 0.05, 280);
    const sWin = () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.28, 'sine', 0.07, 0, i * 0.09));

    // ----- toestand -----
    let lv = 0, stars = '';   // stars: een cijfer per level (0 = nog niet gehaald)
    let L = null, par = 0, boxes = [], player = 0, hist = [], moves = 0, pushes = 0, face = 1;
    let hintsLeft = 3, queue = [], anim = null, won = false, winAt = 0, sparks = [], deadWarn = false;
    let tile = 40, ox = 0, oy = 0, cw = 360, ch = 400, dpr = 1;
    const cache = new Map();

    const totalStars = () => { let s = 0; for (const c of stars) s += +c || 0; return s; };
    const firstOpen = () => { let i = 0; while (i < stars.length && stars[i] !== '0') i++; return i; };
    function persist() {
      try { api.save({ lv, s: stars.slice(0, 3000) }); } catch (e) { /* niets */ }
    }
    function levelData(i) {
      if (i < LEVELS.length) return LEVELS[i];
      if (cache.has(i)) return cache.get(i);
      const n = i - LEVELS.length;
      let g = null, tries = 0;
      while (!g && tries < 20) { g = genLevel(n * 131 + 7 + tries * 7919, endlessParams(n + tries * 0)); tries++; }
      const d = g ? { m: g.m, o: g.pulls } : LEVELS[LEVELS.length - 1] || { m: '#####/#@$.#/#####', o: 1 };
      cache.set(i, d);
      return d;
    }

    function layout() {
      const r = holder.getBoundingClientRect();
      cw = Math.max(100, Math.floor(r.width || api.w));
      ch = Math.max(100, Math.floor(r.height || api.h - 190));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.floor(cw * dpr); cv.height = Math.floor(ch * dpr);
      if (L) {
        tile = Math.max(16, Math.floor(Math.min((cw - 8) / L.w, (ch - 8) / L.h, 64)));
        ox = Math.floor((cw - tile * L.w) / 2); oy = Math.floor((ch - tile * L.h) / 2);
      }
    }

    function updateUI() {
      title.textContent = lv < LEVELS.length ? `Level ${lv + 1}` : `Eindeloos ${lv - LEVELS.length + 1}`;
      const best = +stars[lv] || 0;
      sub.textContent = `Zetten ${moves} · Duwen ${pushes} · Beste ${'★'.repeat(best)}${'☆'.repeat(3 - best)}`;
      bHint.textContent = `💡 Hint (${hintsLeft})`;
      bHint.disabled = hintsLeft <= 0 || won;
      bUndo.disabled = !hist.length;
      bPrev.disabled = lv <= 0;
      bNext.disabled = lv >= firstOpen() || lv >= LEVELS.length + 100000;
      bPrev.style.opacity = bPrev.disabled ? '.3' : '1';
      bNext.style.opacity = bNext.disabled ? '.3' : '1';
      let msg = '';
      if (lv === 0) msg = 'Veeg of tik om te lopen. Duw de 📦 op het rode doel!';
      else if (lv === 1) msg = 'Je kunt alleen duwen, niet trekken. Let op de muren!';
      else if (lv === 2) msg = 'Zit je vast? Gebruik ↩ Terug, zo vaak je wilt.';
      if (deadWarn) msg = '⚠️ Een krat zit vast in een hoek. Maak een zet ongedaan!';
      info.textContent = msg;
    }

    function loadLevel(i, keepHints) {
      lv = Math.max(0, i);
      const d = levelData(lv);
      L = parse(d.m);
      par = d.o || 1;
      boxes = L.box0.slice(); player = L.p0; hist = []; moves = 0; pushes = 0; face = 1;
      queue = []; anim = null; won = false; winAt = 0; deadWarn = false; sparks = [];
      if (!keepHints) hintsLeft = 3;
      overlay.style.display = 'none';
      while (stars.length <= lv) stars += '0';
      layout(); updateUI(); persist();
    }

    // ----- zetten -----
    const isBox = (c) => boxes.indexOf(c);
    function startStep(d) {
      const np = player + L.D[d];
      if (L.walls[np]) return false;
      const bi = isBox(np);
      let push = false;
      if (bi >= 0) {
        const nb = np + L.D[d];
        if (L.walls[nb] || isBox(nb) >= 0) return false;
        push = true;
      }
      hist.push({ p: player, b: boxes.slice(), m: moves, u: pushes, f: face });
      const from = player;
      const a = { t0: performance.now(), dur: queue.length > 3 ? 75 : 115, kind: 'move', from, to: np, d, bi: -1, bFrom: 0, bTo: 0 };
      if (push) {
        a.bi = bi; a.bFrom = np; a.bTo = np + L.D[d];
        boxes[bi] = a.bTo; pushes++;
        sPush();
        if (L.goals[a.bTo] && !L.goals[a.bFrom]) later(sGoal, 90);
      } else sStep();
      player = np; moves++;
      if (d === 0) face = -1; else if (d === 1) face = 1;
      anim = a;
      if (boxes.every((b) => L.goals[b])) {
        won = true; queue = [];
        winAt = a.t0 + a.dur + 350;
      } else {
        deadWarn = boxes.some((b) => L.dead[b]);
      }
      updateUI();
      return true;
    }
    function bump(d) {
      anim = { t0: performance.now(), dur: 140, kind: 'bump', d };
      sBump();
    }
    function enqueue(ds) { if (won) return; for (const d of ds) queue.push(d); }
    function pump() {
      if (anim || won || !queue.length) return;
      const d = queue.shift();
      if (!startStep(d)) { queue = []; bump(d); }
    }
    function undo() {
      if (!hist.length || (won && overlay.style.display === 'flex')) return;
      queue = []; anim = null; won = false; winAt = 0;
      const h = hist.pop();
      player = h.p; boxes = h.b; moves = h.m; pushes = h.u; face = h.f;
      deadWarn = boxes.some((b) => L.dead[b]);
      sUndo(); updateUI();
    }
    function restart() {
      overlay.style.display = 'none';
      loadLevel(lv, true);
      sUndo();
    }
    function pathTo(target) {
      const prev = new Int16Array(L.w * L.h).fill(-2);
      const q = [player]; prev[player] = -1;
      for (let qi = 0; qi < q.length; qi++) {
        const c = q[qi];
        if (c === target) break;
        for (let d = 0; d < 4; d++) {
          const n = c + L.D[d];
          if (prev[n] !== -2 || L.walls[n] || isBox(n) >= 0) continue;
          prev[n] = c; q.push(n);
        }
      }
      if (prev[target] === -2) return null;
      const ds = [];
      let c = target;
      while (c !== player) {
        const p = prev[c];
        ds.push(L.D.indexOf(c - p));
        c = p;
      }
      return ds.reverse();
    }
    function tapCell(x, y) {
      if (won || x < 0 || y < 0 || x >= L.w || y >= L.h) return;
      const t = y * L.w + x;
      if (t === player || L.walls[t]) return;
      queue = [];
      const px = player % L.w, py = Math.floor(player / L.w);
      if (isBox(t) < 0) {
        const p = pathTo(t);
        if (p) { enqueue(p); return; }
      }
      // rechte lijn (ook door een krat heen duwen)
      if (x === px || y === py) {
        const d = x < px ? 0 : x > px ? 1 : y < py ? 2 : 3;
        const n = Math.abs(x - px) + Math.abs(y - py);
        // bij een krat zelf: een duw
        enqueue(Array(Math.max(1, isBox(t) >= 0 ? n : n)).fill(d));
      } else {
        sBump();
      }
    }

    // ----- hint -----
    function hint() {
      if (won || hintsLeft <= 0 || anim) return;
      queue = [];
      const sol = solve(L, boxes, player, 400000);
      if (sol === null) {
        info.textContent = '🤔 Hier kom je niet meer uit (of het is te lastig te berekenen). Probeer ↩ Terug.';
        return;
      }
      if (!sol.length) return;
      hintsLeft--;
      const m = sol[0];
      const stand = m.from - L.D[m.dir];
      let ds = [];
      if (stand !== player) {
        const p = pathTo(stand);
        if (!p) { hintsLeft++; return; }
        ds = p;
      }
      ds.push(m.dir);
      enqueue(ds);
      updateUI();
      info.textContent = `💡 Nog ${sol.length} ${sol.length === 1 ? 'duw' : 'duwen'} te gaan.`;
    }

    // ----- winnen -----
    function starsFor() {
      if (pushes <= par) return 3;
      if (pushes <= par + Math.ceil(par * 0.5) + 2) return 2;
      return 1;
    }
    function confetti() {
      const cols = ['#ff5e5e', '#ffd23f', '#4ade80', '#38bdf8', '#c084fc', '#fb923c'];
      for (let i = 0; i < 90; i++) {
        sparks.push({ x: cw / 2 + (Math.random() - 0.5) * cw * 0.4, y: ch * 0.35, vx: (Math.random() - 0.5) * 420, vy: -200 - Math.random() * 360,
          r: Math.random() * 6, vr: (Math.random() - 0.5) * 12, c: cols[i % cols.length], s: 5 + Math.random() * 6, t0: performance.now() });
      }
    }
    function showWin() {
      winAt = 0;
      const s = starsFor();
      const had = +stars[lv] || 0;
      if (s > had) { stars = stars.slice(0, lv) + s + stars.slice(lv + 1); }
      api.score(totalStars());
      persist();
      confetti(); sWin();
      overlay.textContent = '';
      const card = mk('div', 'background:#fff;color:#3b2a1a;border-radius:22px;padding:22px 26px;text-align:center;min-width:240px;box-shadow:0 12px 40px #0008;animation:krCard .35s ease-out both');
      card.appendChild(mk('div', 'font-size:26px;font-weight:800', 'Level klaar! 🎉'));
      const row = mk('div', 'font-size:44px;margin:10px 0 4px;letter-spacing:4px');
      for (let i = 0; i < 3; i++) {
        const st = mk('span', `display:inline-block;${i < s ? '' : 'filter:grayscale(1);opacity:.35;'}animation:krPop .5s ${0.15 + i * 0.2}s ease-out both`, '⭐');
        row.appendChild(st);
      }
      card.appendChild(row);
      card.appendChild(mk('div', 'font-size:14px;margin-bottom:14px;opacity:.8', `${pushes} duwen${pushes <= par ? ' · perfect!' : ` · perfect is ${par}`}`));
      const bn = mk('button', 'display:block;width:100%;height:50px;background:#16a34a;margin-bottom:8px', 'Volgende level ▶'); bn.className = 'kr-btn';
      const br = mk('button', 'display:block;width:100%;height:42px;background:#e5e7eb;color:#3b2a1a', s < 3 ? 'Nog eens proberen' : 'Opnieuw spelen'); br.className = 'kr-btn';
      bn.addEventListener('click', () => { overlay.style.display = 'none'; loadLevel(lv + 1); });
      br.addEventListener('click', restart);
      card.append(bn, br);
      overlay.appendChild(card);
      overlay.style.display = 'flex';
      updateUI();
    }

    // ----- tekenen -----
    function rr(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }
    function drawCrate(x, y, on, scale = 1) {
      const t = tile, pad = t * 0.09, s = t - pad * 2;
      ctx.save();
      ctx.translate(x + t / 2, y + t / 2); ctx.scale(scale, scale); ctx.translate(-t / 2, -t / 2);
      ctx.fillStyle = '#0003'; rr(ctx, pad + 1, pad + 3, s, s, t * 0.12); ctx.fill();
      ctx.fillStyle = on ? '#7bc65a' : '#c98a4b'; rr(ctx, pad, pad, s, s, t * 0.12); ctx.fill();
      ctx.lineWidth = Math.max(2, t * 0.07); ctx.strokeStyle = on ? '#3f8a2e' : '#8a5a2a'; rr(ctx, pad + t * 0.035, pad + t * 0.035, s - t * 0.07, s - t * 0.07, t * 0.1); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pad + t * 0.12, pad + t * 0.12); ctx.lineTo(t - pad - t * 0.12, t - pad - t * 0.12);
      ctx.moveTo(t - pad - t * 0.12, pad + t * 0.12); ctx.lineTo(pad + t * 0.12, t - pad - t * 0.12);
      ctx.lineWidth = Math.max(2, t * 0.06); ctx.stroke();
      if (on) { ctx.fillStyle = '#fff'; ctx.font = `${t * 0.38}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✓', t / 2, t / 2 + 1); }
      ctx.restore();
    }
    function draw(now) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      if (!L) return;
      const t = tile;
      for (let y = 0; y < L.h; y++) {
        for (let x = 0; x < L.w; x++) {
          const i = y * L.w + x, px = ox + x * t, py = oy + y * t;
          if (L.walls[i]) {
            ctx.fillStyle = '#1b1410'; rr(ctx, px + 1, py + 2, t - 1, t - 1, 5); ctx.fill();
            ctx.fillStyle = '#6b5a52'; rr(ctx, px, py, t - 1, t - 3, 5); ctx.fill();
            ctx.fillStyle = '#85726a'; ctx.fillRect(px + 3, py + 3, t - 7, 3);
            ctx.strokeStyle = '#4e403a'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(px + 2, py + t * 0.48); ctx.lineTo(px + t - 3, py + t * 0.48);
            ctx.moveTo(px + t * 0.5, py + 2); ctx.lineTo(px + t * 0.5, py + t * 0.48); ctx.moveTo(px + t * 0.25, py + t * 0.48); ctx.lineTo(px + t * 0.25, py + t - 4);
            ctx.moveTo(px + t * 0.75, py + t * 0.48); ctx.lineTo(px + t * 0.75, py + t - 4); ctx.stroke();
          } else {
            ctx.fillStyle = (x + y) % 2 ? '#e9d6b0' : '#dfc99e';
            ctx.fillRect(px, py, t, t);
            if (L.goals[i]) {
              const pulse = 0.5 + 0.5 * Math.sin(now / 350);
              ctx.strokeStyle = '#e0443e'; ctx.lineWidth = Math.max(2, t * 0.08);
              ctx.beginPath(); ctx.arc(px + t / 2, py + t / 2, t * (0.26 + 0.02 * pulse), 0, 7); ctx.stroke();
              ctx.fillStyle = '#e0443e'; ctx.beginPath(); ctx.arc(px + t / 2, py + t / 2, t * 0.09, 0, 7); ctx.fill();
            }
          }
        }
      }
      // posities met animatie
      let ppx = player % L.w, ppy = Math.floor(player / L.w), bob = 0, shake = 0, boxAnim = -1, bax = 0, bay = 0;
      if (anim) {
        const k = Math.min(1, (now - anim.t0) / anim.dur), e = k * (2 - k);
        if (anim.kind === 'move') {
          const fx = anim.from % L.w, fy = Math.floor(anim.from / L.w), tx = anim.to % L.w, ty = Math.floor(anim.to / L.w);
          ppx = fx + (tx - fx) * e; ppy = fy + (ty - fy) * e;
          bob = Math.sin(k * Math.PI) * t * 0.08;
          if (anim.bi >= 0) {
            boxAnim = anim.bi;
            const bx0 = anim.bFrom % L.w, by0 = Math.floor(anim.bFrom / L.w), bx1 = anim.bTo % L.w, by1 = Math.floor(anim.bTo / L.w);
            bax = bx0 + (bx1 - bx0) * e; bay = by0 + (by1 - by0) * e;
          }
        } else {
          shake = Math.sin(k * Math.PI) * t * 0.12;
          ppx += DIRS[anim.d][0] * shake / t; ppy += DIRS[anim.d][1] * shake / t;
        }
      }
      for (let bi = 0; bi < boxes.length; bi++) {
        const b = boxes[bi];
        if (bi === boxAnim) drawCrate(ox + bax * t, oy + bay * t, L.goals[b] && (now - anim.t0) > anim.dur * 0.6);
        else drawCrate(ox + (b % L.w) * t, oy + Math.floor(b / L.w) * t, !!L.goals[b]);
      }
      // speler
      const cx = ox + ppx * t + t / 2, cy = oy + ppy * t + t / 2 - bob;
      ctx.fillStyle = '#0003'; ctx.beginPath(); ctx.ellipse(cx, oy + ppy * t + t * 0.88, t * 0.28, t * 0.09, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(cx, cy); ctx.scale(face, 1);
      ctx.font = `${t * 0.78}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('👷', 0, t * 0.03);
      ctx.restore();
      // confetti
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i], a = (now - s.t0) / 1000;
        if (a > 1.8) { sparks.splice(i, 1); continue; }
        const x = s.x + s.vx * a, y = s.y + s.vy * a + 700 * a * a;
        ctx.save(); ctx.globalAlpha = Math.min(1, (1.8 - a) * 1.5); ctx.translate(x, y); ctx.rotate(s.r + s.vr * a);
        ctx.fillStyle = s.c; ctx.fillRect(-s.s / 2, -s.s / 4, s.s, s.s / 2); ctx.restore();
      }
    }

    let raf = 0;
    function frame(now) {
      if (dead) return;
      if (anim && now >= anim.t0 + anim.dur) anim = null;
      pump();
      if (won && !anim && winAt && now >= winAt) showWin();
      draw(now);
      raf = requestAnimationFrame(frame);
    }

    // ----- invoer -----
    let ptr = null;
    function onDown(e) {
      if (overlay.style.display === 'flex') return;
      audio(); if (ac && ac.state === 'suspended') ac.resume();
      const r = cv.getBoundingClientRect();
      ptr = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: e.clientX, oy: e.clientY, swiped: false, rect: r };
      try { cv.setPointerCapture(e.pointerId); } catch (er) { /* ok */ }
    }
    function onMove(e) {
      if (!ptr || e.pointerId !== ptr.id || won) return;
      const dx = e.clientX - ptr.ox, dy = e.clientY - ptr.oy, th = Math.max(14, tile * 0.55);
      if (Math.max(Math.abs(dx), Math.abs(dy)) >= th) {
        const d = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 0 : 1) : (dy < 0 ? 2 : 3);
        queue = queue.length > 2 ? [] : queue;
        enqueue([d]);
        ptr.swiped = true; ptr.ox = e.clientX; ptr.oy = e.clientY;
      }
    }
    function onUp(e) {
      if (!ptr || e.pointerId !== ptr.id) return;
      const p = ptr; ptr = null;
      if (!p.swiped && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < 12) {
        const r = cv.getBoundingClientRect();
        tapCell(Math.floor((e.clientX - r.left - ox) / tile), Math.floor((e.clientY - r.top - oy) / tile));
      }
    }
    function onCancel() { ptr = null; }
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onCancel);
    function onKey(e) {
      if (overlay.style.display === 'flex') { if (e.key === 'Enter') { overlay.style.display = 'none'; loadLevel(lv + 1); } return; }
      const k = e.key.toLowerCase();
      const map = { arrowleft: 0, a: 0, arrowright: 1, d: 1, arrowup: 2, w: 2, arrowdown: 3, s: 3 };
      if (k in map) { e.preventDefault(); audio(); enqueue([map[k]]); }
      else if (k === 'z' || k === 'u' || k === 'backspace') { e.preventDefault(); undo(); }
      else if (k === 'r') restart();
      else if (k === 'h') hint();
    }
    window.addEventListener('keydown', onKey);
    const onResize = () => { layout(); };
    window.addEventListener('resize', onResize);
    bUndo.addEventListener('click', undo);
    bReset.addEventListener('click', restart);
    bHint.addEventListener('click', () => { audio(); hint(); });
    bPrev.addEventListener('click', () => { if (lv > 0) loadLevel(lv - 1); });
    bNext.addEventListener('click', () => { if (lv < firstOpen()) loadLevel(lv + 1); });

    // ----- start -----
    let started = false;
    function start(saved) {
      if (started || dead) return;
      started = true;
      if (saved && typeof saved.s === 'string' && /^[0-3]*$/.test(saved.s)) stars = saved.s;
      let i = saved && Number.isInteger(saved.lv) && saved.lv >= 0 ? saved.lv : 0;
      i = Math.min(i, firstOpen());
      api.score(totalStars());
      loadLevel(i);
    }
    api.score(0);
    layout();
    Promise.resolve(api.load()).then((s) => start(s), () => start(null));
    raf = requestAnimationFrame(frame);

    return {
      destroy() {
        if (dead) return;
        dead = true;
        cancelAnimationFrame(raf);
        timers.forEach(clearTimeout); timers.clear();
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('resize', onResize);
        cv.removeEventListener('pointerdown', onDown);
        cv.removeEventListener('pointermove', onMove);
        cv.removeEventListener('pointerup', onUp);
        cv.removeEventListener('pointercancel', onCancel);
        if (started) { try { api.save({ lv, s: stars.slice(0, 3000) }); } catch (e) { /* niets */ } }
        if (ac) { try { ac.close(); } catch (e) { /* niets */ } ac = null; }
        root.remove();
      },
    };
  },
};
