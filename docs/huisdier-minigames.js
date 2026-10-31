// huisdier-minigames.js - 4 extra spelletjes voor het Huisdier, met 3D-iconen. Zelfstandige module, geen imports.
// Zelfde contract als huisdier-games.js: GAMES[i].create(host, api) -> { destroy() }; api = { w, h, pet, gfx, score(n), end(n, {fun}) }.
// api.gfx = { iconSrc(naam) -> url | null, emoji(naam) } wordt door huisdier.js meegegeven; zonder gfx tonen we emoji's.
// Alle scores zijn hele getallen 0-100.

const FONT = 'system-ui,-apple-system,"Segoe UI","Apple Color Emoji","Noto Color Emoji",sans-serif';
export const scale100 = (raw, max) => { const r = Number(raw), m = Number(max); if (!isFinite(r) || !isFinite(m) || m <= 0) return 0; return Math.max(0, Math.min(100, Math.round((r / m) * 100))); };
const pickOf = (arr, rnd = Math.random) => arr[Math.floor(rnd() * arr.length)];
export function shuffled(arr, rnd = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---- pure spelregels (getest in tools/test-huisdier-more.mjs)
export const RAIN = { time: 30, kinds: [['coin', 1, 5], ['star', 2, 3], ['gem', 4, 2], ['bomb', -3, 2]], max: 70 };
export function rainKind(r) { // r in [0,1) -> [naam, punten]
  const tot = RAIN.kinds.reduce((a, k) => a + k[2], 0); let x = r * tot;
  for (const k of RAIN.kinds) { if (x < k[2]) return [k[0], k[1]]; x -= k[2]; }
  return [RAIN.kinds[0][0], RAIN.kinds[0][1]];
}
export const rainDelay = (t) => Math.max(0.28, 0.7 - t * 0.012); // sneller naarmate de tijd vordert
export const FOOD_OK = ['apple', 'banana', 'carrot', 'pizza', 'cake', 'cookie', 'strawberry', 'cheese', 'bread', 'icecream', 'donut', 'grapes', 'watermelon', 'corn', 'cupcake', 'candy'];
export const FOOD_BAD = ['bomb', 'skull', 'rock', 'flame', 'ghost', 'slime', 'cactus', 'hammer'];
export function foodRounds(n = 14, rnd = Math.random) {
  const out = [];
  for (let i = 0; i < n; i++) { const good = rnd() < 0.55; out.push({ n: pickOf(good ? FOOD_OK : FOOD_BAD, rnd), good }); }
  return out;
}
export const PAIR_ICONS = ['cat', 'dog', 'rabbit', 'bear', 'penguin', 'lion', 'frog', 'duck', 'owl', 'fox', 'panda', 'elephant', 'monkey', 'turtle', 'fish', 'butterfly'];
export function memoryDeck(pairs = 6, rnd = Math.random) { const ic = shuffled(PAIR_ICONS, rnd).slice(0, pairs); return shuffled(ic.concat(ic), rnd); }
export const memoryScore = (moves, pairs = 6) => Math.max(20, Math.min(100, 100 - Math.max(0, moves - pairs) * 8));
export const tapWindow = (i) => Math.max(650, 1500 - i * 55); // hoe lang een doel blijft staan (ms)
export function tapPoints(hit, reactMs, win) { return hit ? Math.max(1, Math.round(3 - 2 * Math.min(1, reactMs / win))) : 0; }

function mkKit(host, api, bg) {
  const W = api.w || host.clientWidth || 360, H = api.h || host.clientHeight || 480;
  const removers = [], timers = new Set();
  let dead = false, ended = false, raf = 0, loopFn = null, last = 0;
  host.style.touchAction = 'none'; host.style.userSelect = 'none'; host.style.background = bg;
  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;overflow:hidden;font-family:' + FONT + ';color:#4a3b63;-webkit-user-select:none;user-select:none';
  host.appendChild(root);
  const gfx = api.gfx || null;
  const k = {
    W, H, root,
    get over() { return ended || dead; },
    mk(parent, css, html) { const d = document.createElement('div'); d.style.cssText = css || ''; if (html != null) d.innerHTML = html; (parent || root).appendChild(d); return d; },
    on(t, type, fn) { t.addEventListener(type, fn); removers.push(() => { try { t.removeEventListener(type, fn); } catch (e) { /* ok */ } }); },
    timeout(fn, ms) { const id = setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms); timers.add(id); return id; },
    clear(id) { clearTimeout(id); timers.delete(id); },
    loop(fn) {
      loopFn = fn; last = 0;
      const tick = (ts) => { if (dead) return; raf = requestAnimationFrame(tick); if (!last) last = ts; const dt = Math.min(0.05, Math.max(0, (ts - last) / 1000)); last = ts; if (loopFn) loopFn(dt); };
      raf = requestAnimationFrame(tick);
    },
    // 3D-icoon als HTML (img) of emoji als er geen plaatje is
    ico(name, size) {
      const src = gfx && gfx.iconSrc ? gfx.iconSrc(name) : null;
      if (src) return `<img src="${src}" width="${size}" height="${size}" alt="" draggable="false" style="width:${size}px;height:${size}px;object-fit:contain;pointer-events:none;display:block">`;
      const e = gfx && gfx.emoji ? gfx.emoji(name) : '⭐';
      return `<span style="font-size:${Math.round(size * 0.8)}px;line-height:${size}px;display:block;text-align:center;width:${size}px;height:${size}px;pointer-events:none">${e}</span>`;
    },
    hud(css) { return k.mk(root, 'position:absolute;left:0;right:0;top:8px;text-align:center;font-weight:800;font-size:17px;color:#6b4f8a;pointer-events:none;z-index:5;' + (css || '')); },
    petHtml(size, mood) { try { if (api.pet && api.pet.html) return api.pet.html(size, mood); } catch (e) { /* ok */ } return `<span style="font-size:${Math.round(size * 0.8)}px;line-height:1">🐾</span>`; },
    live(raw, max) { try { api.score(scale100(raw, max)); } catch (e) { /* ok */ } },
    finish(raw, max, line) {
      if (ended || dead) return; ended = true;
      const s = scale100(raw, max);
      try { api.score(s); } catch (e) { /* ok */ }
      const ov = k.mk(root, 'position:absolute;left:0;top:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,248,252,.86);z-index:20;text-align:center');
      k.mk(ov, '', k.ico('trophy', 84));
      k.mk(ov, 'font-size:28px;font-weight:800;color:#8a63b5;margin-top:6px', 'Goed gedaan!');
      k.mk(ov, 'font-size:16px;margin-top:8px;color:#7a5f8f;padding:0 24px', line || 'Wat was dat gezellig!');
      k.mk(ov, 'font-size:20px;font-weight:700;margin-top:10px;color:#e0719a', 'Score: ' + s);
      k.timeout(() => { try { api.end(s, { fun: Math.min(100, Math.round(30 + s * 0.7)) }); } catch (e) { /* ok */ } }, 1800);
    },
    destroy() {
      if (dead) return; dead = true;
      if (raf) { try { cancelAnimationFrame(raf); } catch (e) { /* ok */ } }
      timers.forEach((id) => clearTimeout(id)); timers.clear(); removers.forEach((f) => f()); removers.length = 0; loopFn = null;
      try { if (root.parentNode) root.parentNode.removeChild(root); } catch (e) { /* ok */ }
    },
  };
  return k;
}

/* 1. Sterrenregen: tik op munten, sterren en edelstenen; laat de bommen met rust */
function createRain(host, api) {
  const k = mkKit(host, api, 'linear-gradient(180deg,#312e81,#6d28d9 55%,#c084fc)');
  const hud = k.hud('color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.5)');
  const items = []; let t = 0, spawnIn = 0.5, raw = 0;
  const upd = () => { hud.textContent = `⏱ ${Math.max(0, Math.ceil(RAIN.time - t))}   ·   ⭐ ${Math.max(0, raw)}`; };
  const pop = (x, y, txt, col) => { const f = k.mk(k.root, `position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%);font-weight:900;font-size:24px;color:${col};text-shadow:0 2px 4px rgba(0,0,0,.5);pointer-events:none;transition:all .6s ease-out;z-index:6`, txt); k.timeout(() => { f.style.top = (y - 50) + 'px'; f.style.opacity = '0'; }, 20); k.timeout(() => { if (f.parentNode) f.parentNode.removeChild(f); }, 700); };
  function spawn() {
    const [name, pts] = rainKind(Math.random()), size = 54 + Math.round(Math.random() * 18), x = size / 2 + Math.random() * (k.W - size);
    const el = k.mk(k.root, `position:absolute;left:0;top:0;width:${size + 14}px;height:${size + 14}px;padding:7px;box-sizing:border-box;cursor:pointer;z-index:3`, k.ico(name, size));
    const it = { el, x, y: -size, vy: 110 + Math.random() * 90 + t * 3, name, pts, size, dead: false };
    el.addEventListener('pointerdown', (e) => {
      if (it.dead || k.over) return; e.preventDefault(); it.dead = true; raw += pts; if (el.parentNode) el.parentNode.removeChild(el);
      pop(it.x, it.y, pts > 0 ? '+' + pts : String(pts), pts > 0 ? '#fde047' : '#fca5a5'); k.live(raw, RAIN.max); upd();
    });
    items.push(it);
  }
  k.loop((dt) => {
    if (k.over) return; t += dt;
    spawnIn -= dt; if (spawnIn <= 0) { spawn(); spawnIn = rainDelay(t); }
    for (const it of items) { if (it.dead) continue; it.y += it.vy * dt; it.el.style.transform = `translate(${Math.round(it.x - it.size / 2 - 7)}px,${Math.round(it.y - 7)}px)`; if (it.y > k.H + 40) { it.dead = true; if (it.el.parentNode) it.el.parentNode.removeChild(it.el); } }
    for (let i = items.length - 1; i >= 0; i--) if (items[i].dead) items.splice(i, 1);
    upd();
    if (t >= RAIN.time) k.finish(raw, RAIN.max, 'Wat een schitterende regen!');
  });
  upd();
  return { destroy: k.destroy };
}

/* 2. Lekker of bah?: wat mag je huisdier eten? */
function createFood(host, api) {
  const k = mkKit(host, api, 'linear-gradient(180deg,#fef9c3,#fde68a 60%,#fdba74)');
  const rounds = foodRounds(14), per = 3200;
  let i = 0, good = 0, locked = false, tId = 0;
  const hud = k.hud(), card = k.mk(k.root, `position:absolute;left:50%;top:${Math.round(k.H * 0.2)}px;transform:translateX(-50%);width:${Math.round(k.W * 0.6)}px;height:${Math.round(k.W * 0.6)}px;border-radius:28px;background:#fff;box-shadow:0 10px 30px rgba(120,80,0,.25);display:flex;align-items:center;justify-content:center`);
  const bar = k.mk(k.root, `position:absolute;left:8%;width:84%;top:${Math.round(k.H * 0.2 + k.W * 0.6 + 14)}px;height:10px;border-radius:5px;background:rgba(0,0,0,.12);overflow:hidden`), fill = k.mk(bar, 'height:100%;width:100%;background:#22c55e');
  const msg = k.mk(k.root, `position:absolute;left:0;right:0;top:${Math.round(k.H * 0.2 + k.W * 0.6 + 30)}px;text-align:center;font-weight:800;font-size:20px;min-height:26px`);
  const mkBtn = (txt, bg, fn, left) => { const b = k.mk(k.root, `position:absolute;${left ? 'left:6%' : 'right:6%'};bottom:18px;width:41%;height:${Math.round(Math.min(96, k.H * 0.16))}px;border-radius:22px;background:${bg};color:#fff;font-weight:900;font-size:22px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 0 rgba(0,0,0,.2);z-index:4`, txt); b.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(); }); return b; };
  function show() {
    if (i >= rounds.length) return k.finish(good, rounds.length, good >= 12 ? 'Jij weet precies wat lekker is!' : 'Goed opgelet!');
    locked = false; msg.textContent = ''; card.innerHTML = k.ico(rounds[i].n, Math.round(k.W * 0.46)); hud.textContent = `${i + 1} van ${rounds.length}   ·   ✔ ${good}`;
    fill.style.transition = 'none'; fill.style.width = '100%'; void fill.offsetWidth; fill.style.transition = `width ${per}ms linear`; fill.style.width = '0%';
    k.clear(tId); tId = k.timeout(() => answer(null), per);
  }
  function answer(ans) {
    if (locked || k.over) return; locked = true; k.clear(tId);
    const ok = ans === rounds[i].good; if (ok) good++;
    msg.textContent = ans === null ? '⏰ Te laat!' : ok ? '✔ Goed!' : '✘ Nee!'; msg.style.color = ok ? '#15803d' : '#b91c1c'; k.live(good, rounds.length);
    i++; k.timeout(show, 650);
  }
  mkBtn('😋 Lekker', '#22c55e', () => answer(true), true); mkBtn('🤢 Bah', '#ef4444', () => answer(false), false);
  show();
  return { destroy: k.destroy };
}

/* 3. Dierenmemory met 3D-plaatjes */
function createMemory3d(host, api) {
  const k = mkKit(host, api, 'linear-gradient(180deg,#dbeafe,#bfdbfe 55%,#e9d5ff)');
  const deck = memoryDeck(6), cols = 3, gap = 10, pad = 12, cw = Math.floor((k.W - pad * 2 - gap * (cols - 1)) / cols), ch = Math.min(cw * 1.1, Math.floor((k.H - 70 - gap * 3) / 4));
  let open = [], found = 0, moves = 0, lock = false;
  const hud = k.hud(); const upd = () => { hud.textContent = `Zetten: ${moves}   ·   Paartjes: ${found}/6`; }; upd();
  const cards = deck.map((name, idx) => {
    const x = pad + (idx % cols) * (cw + gap), y = 46 + Math.floor(idx / cols) * (ch + gap);
    const el = k.mk(k.root, `position:absolute;left:${x}px;top:${y}px;width:${cw}px;height:${ch}px;border-radius:18px;background:linear-gradient(145deg,#a78bfa,#6366f1);box-shadow:0 5px 0 rgba(60,40,120,.35);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:34px;color:#fff;transition:transform .25s`, '❓');
    const c = { el, name, up: false, done: false };
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); flip(c); });
    return c;
  });
  function face(c, up) { c.up = up; c.el.style.background = up ? '#fff' : 'linear-gradient(145deg,#a78bfa,#6366f1)'; c.el.innerHTML = up ? k.ico(c.name, Math.round(Math.min(cw, ch) * 0.78)) : '❓'; }
  function flip(c) {
    if (lock || c.up || c.done || k.over) return;
    face(c, true); open.push(c);
    if (open.length === 2) {
      moves++; upd(); const [a, b] = open; open = [];
      if (a.name === b.name) { a.done = b.done = true; found++; upd(); a.el.style.boxShadow = b.el.style.boxShadow = '0 0 0 4px #22c55e'; k.live(found, 6);
        if (found === 6) k.timeout(() => k.finish(memoryScore(moves), 100, `Alles gevonden in ${moves} zetten!`), 500);
      } else { lock = true; k.timeout(() => { face(a, false); face(b, false); lock = false; }, 800); }
    }
  }
  k.timeout(() => k.finish(found * 10, 60 + 40, 'De tijd is om, maar goed geprobeerd!'), 120000);
  return { destroy: k.destroy };
}

/* 4. Snelle tik: tik de ster voor hij verdwijnt */
function createTap(host, api) {
  const k = mkKit(host, api, 'linear-gradient(180deg,#ccfbf1,#99f6e4 55%,#a5f3fc)');
  const total = 15; let n = 0, hits = 0, pts = 0, cur = null, shownAt = 0;
  const hud = k.hud(); const upd = () => { hud.textContent = `${Math.min(n + 1, total)} van ${total}   ·   punten ${pts}`; };
  function next() {
    if (n >= total) return k.finish(pts, total * 3, hits >= 12 ? 'Bliksemsnel!' : 'Lekker bezig!');
    upd(); const win = tapWindow(n), size = 78, x = size / 2 + 10 + Math.random() * (k.W - size - 20), y = 60 + size / 2 + Math.random() * (k.H - size - 90);
    const el = k.mk(k.root, `position:absolute;left:${Math.round(x - size / 2 - 10)}px;top:${Math.round(y - size / 2 - 10)}px;width:${size + 20}px;height:${size + 20}px;padding:10px;box-sizing:border-box;cursor:pointer;z-index:3;animation:none`, k.ico(pickOf(['star', 'gem', 'coin', 'target', 'balloon']), size));
    cur = { el, win }; shownAt = Date.now();
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!cur || cur.el !== el || k.over) return; const p = tapPoints(true, Date.now() - shownAt, win); hits++; pts += p; end(true); });
    cur.t = k.timeout(() => end(false), win);
  }
  function end(hit) {
    if (!cur) return; k.clear(cur.t); const e = cur.el; cur = null; if (e.parentNode) e.parentNode.removeChild(e); n++; k.live(pts, total * 3); k.timeout(next, hit ? 120 : 350);
  }
  k.timeout(next, 400);
  return { destroy: k.destroy };
}

export const GAMES2 = [
  { id: 'sterrenregen', name: 'Sterrenregen', emoji: '\u{1F31F}', desc: 'Tik op vallende munten, sterren en edelstenen. Pas op voor de bommen!', create: createRain },
  { id: 'lekkerbah', name: 'Lekker of bah?', emoji: '\u{1F34E}', desc: 'Mag dit op het bordje van je huisdier? Kies snel: lekker of bah!', create: createFood },
  { id: 'iconmemory', name: 'Dieren-memory', emoji: '\u{1F43B}', desc: 'Zoek de zes paartjes dieren in zo min mogelijk zetten.', create: createMemory3d },
  { id: 'snelletik', name: 'Snelle tik', emoji: '⚡', desc: 'Tik elk doel aan voordat het verdwijnt. Hoe sneller, hoe meer punten.', create: createTap },
];
