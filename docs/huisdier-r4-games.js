// huisdier-r4-games.js - 6 nieuwe spelletjes voor het Huisdier (Ronde 4), met 3D-iconen en je eigen huisdier in beeld.
// Zelfde contract als huisdier-minigames.js: GAMES_R4[i].create(host, api) -> { destroy() }; api = { w, h, pet, gfx, score(n), end(n, {fun}) }. Scores 0-100.
// De pure spelregels (molKind, runnerHit, patternCheck, ...) zijn los exporteerbaar en getest in tools/test-r4-huisdier.mjs.
import { mkKit, scale100, shuffled, pickOf } from './huisdier-minigames.js?v=2';

/* ---------- pure spelregels ---------- */
export const MOL = { time: 30, max: 36, kinds: [['rabbit', 1, 6], ['bee', 3, 1], ['bomb', -3, 2]] };
export function molKind(r) { const tot = MOL.kinds.reduce((a, k) => a + k[2], 0); let x = r * tot; for (const k of MOL.kinds) { if (x < k[2]) return [k[0], k[1]]; x -= k[2]; } return [MOL.kinds[0][0], MOL.kinds[0][1]]; }
export const molStay = (t) => Math.max(0.65, 1.5 - t * 0.026);      // hoe lang een beestje blijft staan (s)
export const molDelay = (t) => Math.max(0.3, 0.75 - t * 0.014);     // tijd tussen twee beestjes (s)

export const RUN = { time: 35, max: 40, jump: 0.62, lives: 3 };
export const jumpY = (t) => { const u = Math.max(0, Math.min(1, t / RUN.jump)); return 4 * u * (1 - u); }; // 0..1..0
export function boxHit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
export const runnerHit = (px, py, pw, ph, ox, oy, ow, oh) => boxHit({ x: px, y: py, w: pw, h: ph }, { x: ox, y: oy, w: ow, h: oh });
export const runSpeed = (t) => 170 + t * 4.2;                        // px/s
export const runGap = (t) => Math.max(0.85, 1.7 - t * 0.024);        // s tussen obstakels

export const PAT = { pads: ['star', 'heart', 'gem', 'bolt'], colors: ['#facc15', '#f472b6', '#38bdf8', '#a3e635'], rounds: 10 };
export const patternNext = (seq, rnd = Math.random) => seq.concat(Math.floor(rnd() * 4));
export function patternCheck(seq, pos, tap) { if (seq[pos] !== tap) return 'wrong'; return pos + 1 >= seq.length ? 'done' : 'ok'; }
export const patternShow = (len) => Math.max(260, 560 - len * 28); // ms per lichtje

export const POP = { time: 32, max: 34, icons: ['star', 'heart', 'gem', 'coin', 'apple', 'cake', 'balloon', 'fish', 'rocket', 'crown'] };
export const popScore = (isTarget) => (isTarget ? 2 : -1);
export function popTarget(prev, rnd = Math.random) { const o = POP.icons.filter((i) => i !== prev); return pickOf(o, rnd); }

export const FR = { time: 30, max: 32, good: ['apple', 'banana', 'strawberry', 'grapes', 'cookie', 'carrot', 'watermelon', 'cupcake'], bad: ['bomb', 'rock', 'skull'] };
export function caught(ix, iy, isz, bx, bw, by) { return iy + isz * 0.4 >= by && iy <= by + 28 && Math.abs(ix - bx) <= bw / 2 + isz * 0.3; }
export const fruitDelay = (t) => Math.max(0.32, 0.8 - t * 0.016);

export const SORT = {
  n: 16, per: 3200,
  cats: [['dier', 'Dier', 'dog'], ['eten', 'Eten', 'apple'], ['ding', 'Ding', 'rocket']],
  items: {
    dier: ['cat', 'dog', 'rabbit', 'bear', 'penguin', 'lion', 'frog', 'duck', 'owl', 'fox', 'panda', 'elephant', 'monkey', 'turtle', 'cow', 'pig'],
    eten: ['apple', 'banana', 'carrot', 'pizza', 'cake', 'cookie', 'strawberry', 'cheese', 'bread', 'icecream', 'donut', 'grapes', 'burger', 'fries', 'cupcake', 'corn'],
    ding: ['rocket', 'car', 'key', 'bell', 'book', 'guitar', 'camera', 'hammer', 'lightbulb', 'train', 'boat', 'tent', 'drum', 'compass', 'bike', 'piano'],
  },
};
export function sortRounds(n = SORT.n, rnd = Math.random) {
  const out = [];
  for (let i = 0; i < n; i++) { const cat = SORT.cats[i % 3][0]; out.push({ ic: pickOf(SORT.items[cat], rnd), cat }); }
  return shuffled(out, rnd);
}
export const ALL_ICON_NAMES = [].concat(MOL.kinds.map((k) => k[0]), ['rock', 'cactus', 'flame', 'coin'], PAT.pads, POP.icons, FR.good, FR.bad, ...Object.values(SORT.items), ['bag', 'trophy', 'dog']);

/* ---------- 1. Molletjes: tik de beestjes, laat de bommen staan ---------- */
function createMol(host, api) {
  const k = mkKit(host, api, 'linear-gradient(180deg,#bbf7d0,#86efac 45%,#a16207 46%,#854d0e)');
  const hud = k.hud('color:#14532d'); let t = 0, raw = 0, spawn = 0.5;
  const cols = 3, cell = Math.floor(Math.min(k.W / 3.4, (k.H - 150) / 3.4)), gx = Math.floor((k.W - cols * cell) / (cols + 1)), top = Math.max(60, Math.floor((k.H - 3 * cell - 2 * gx) / 2));
  const holes = [];
  for (let i = 0; i < 9; i++) {
    const x = gx + (i % 3) * (cell + gx), y = top + Math.floor(i / 3) * (cell + gx);
    const el = k.mk(k.root, `position:absolute;left:${x}px;top:${y}px;width:${cell}px;height:${cell}px;border-radius:50%;background:radial-gradient(circle at 50% 40%,#3b2108,#1c1004);box-shadow:inset 0 6px 12px rgba(0,0,0,.6);overflow:hidden;cursor:pointer;touch-action:none`);
    const h = { el, item: null, ttl: 0 };
    k.on(el, 'pointerdown', (e) => { e.preventDefault(); if (k.over || !h.item) return; raw = Math.max(0, raw + h.item.pts); const bad = h.item.pts < 0; clear(h); k.live(raw, MOL.max); upd(); el.style.boxShadow = bad ? 'inset 0 0 0 5px #ef4444' : 'inset 0 0 0 5px #22c55e'; k.timeout(() => { el.style.boxShadow = 'inset 0 6px 12px rgba(0,0,0,.6)'; }, 160); });
    holes.push(h);
  }
  const upd = () => { hud.textContent = `⏱ ${Math.max(0, Math.ceil(MOL.time - t))}   ·   ⭐ ${raw}`; };
  function clear(h) { h.item = null; h.el.innerHTML = ''; }
  k.loop((dt) => {
    if (k.over) return; t += dt; spawn -= dt;
    if (spawn <= 0) {
      const free = holes.filter((h) => !h.item);
      if (free.length) { const h = pickOf(free), [name, pts] = molKind(Math.random()); h.item = { pts }; h.ttl = molStay(t); h.el.innerHTML = `<div style="position:absolute;left:12%;top:14%;width:76%;height:76%">${k.ico(name, Math.round(cell * 0.76))}</div>`; }
      spawn = molDelay(t);
    }
    for (const h of holes) if (h.item) { h.ttl -= dt; if (h.ttl <= 0) clear(h); }
    upd();
    if (t >= MOL.time) k.finish(raw, MOL.max, raw >= 28 ? 'Wat een snelle pootjes!' : 'Goed gemept!');
  });
  upd();
  return { destroy: k.destroy };
}

/* ---------- 2. Hindernisren: tik om te springen ---------- */
function createRunner(host, api) {
  const k = mkKit(host, api, 'linear-gradient(180deg,#bae6fd,#e0f2fe 55%,#86efac 56%,#4ade80)');
  const hud = k.hud(), gy = Math.round(k.H * 0.62), ps = 64, px = Math.round(k.W * 0.16);
  const pet = k.mk(k.root, `position:absolute;left:${px}px;top:${gy - ps}px;width:${ps}px;height:${ps}px;z-index:4`, k.petHtml(ps, 'blij'));
  k.mk(k.root, `position:absolute;left:0;top:${gy}px;width:100%;height:${Math.round(k.H - gy)}px;background:repeating-linear-gradient(90deg,#16a34a 0 28px,#22c55e 28px 56px);opacity:.9`);
  let t = 0, jt = -1, lives = RUN.lives, score = 0, gap = 1.0, inv = 0; const obs = [];
  const upd = () => { hud.textContent = `⏱ ${Math.max(0, Math.ceil(RUN.time - t))}   ·   ${'❤️'.repeat(Math.max(0, lives))}   ·   ⭐ ${score}`; };
  const jump = (e) => { if (e) e.preventDefault(); if (k.over || jt >= 0) return; jt = 0; };
  k.on(k.root, 'pointerdown', jump); k.on(host, 'pointerdown', jump);
  function spawn() {
    const coin = Math.random() < 0.3, name = coin ? 'coin' : pickOf(['rock', 'cactus', 'rock']), sz = coin ? 40 : 46 + Math.round(Math.random() * 10);
    const y = coin ? gy - 110 - Math.round(Math.random() * 30) : gy - sz + 6;
    const el = k.mk(k.root, `position:absolute;left:0;top:0;width:${sz}px;height:${sz}px;z-index:3;pointer-events:none`, k.ico(name, sz));
    obs.push({ el, x: k.W + 10, y, sz, coin, done: false });
  }
  k.loop((dt) => {
    if (k.over) return; t += dt; gap -= dt; inv = Math.max(0, inv - dt);
    if (gap <= 0) { spawn(); gap = runGap(t) * (0.9 + Math.random() * 0.4); }
    let lift = 0; if (jt >= 0) { jt += dt; if (jt >= RUN.jump) jt = -1; else lift = jumpY(jt) * 105; }
    pet.style.transform = `translateY(${-Math.round(lift)}px)`; pet.style.opacity = inv > 0 && Math.floor(t * 12) % 2 ? '.45' : '1';
    const py = gy - ps - lift;
    for (const o of obs) {
      o.x -= runSpeed(t) * dt; o.el.style.transform = `translate(${Math.round(o.x)}px,${Math.round(o.y)}px)`;
      if (!o.done && runnerHit(px + 10, py + 8, ps - 20, ps - 12, o.x + 6, o.y + 6, o.sz - 12, o.sz - 12)) {
        o.done = true; if (o.coin) { score += 2; o.el.style.opacity = '0'; } else if (inv <= 0) { lives--; inv = 1.1; }
      } else if (!o.done && !o.coin && o.x + o.sz < px) { o.done = true; score += 1; }
    }
    for (let i = obs.length - 1; i >= 0; i--) if (obs[i].x < -80) { if (obs[i].el.parentNode) obs[i].el.parentNode.removeChild(obs[i].el); obs.splice(i, 1); }
    k.live(score, RUN.max); upd();
    if (lives <= 0) k.finish(score, RUN.max, 'Au! Probeer het nog eens.'); else if (t >= RUN.time) k.finish(score, RUN.max, 'Wat een springer!');
  });
  upd();
  return { destroy: k.destroy };
}

/* ---------- 3. Patroon: onthoud het rijtje en tik het na ---------- */
function createPattern(host, api) {
  const k = mkKit(host, api, 'linear-gradient(180deg,#1e1b4b,#312e81 60%,#4c1d95)');
  const hud = k.hud('color:#fff'), msg = k.mk(k.root, `position:absolute;left:0;right:0;top:${Math.round(k.H * 0.12)}px;text-align:center;color:#fde68a;font-weight:800;font-size:20px`);
  const pad = Math.floor(Math.min(k.W * 0.38, (k.H - 220) / 2.2)), gx = Math.floor((k.W - pad * 2) / 3), y0 = Math.round(k.H * 0.24);
  const pads = PAT.pads.map((ic, i) => {
    const x = gx + (i % 2) * (pad + gx), y = y0 + Math.floor(i / 2) * (pad + 16);
    const el = k.mk(k.root, `position:absolute;left:${x}px;top:${y}px;width:${pad}px;height:${pad}px;border-radius:24px;background:${PAT.colors[i]};opacity:.55;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 0 rgba(0,0,0,.3);transition:transform .12s,opacity .12s;touch-action:none`, k.ico(ic, Math.round(pad * 0.6)));
    k.on(el, 'pointerdown', (e) => { e.preventDefault(); tap(i); });
    return el;
  });
  let seq = [], pos = 0, round = 0, input = false;
  const flash = (i, ms) => { pads[i].style.opacity = '1'; pads[i].style.transform = 'scale(1.08)'; k.timeout(() => { pads[i].style.opacity = '.55'; pads[i].style.transform = 'scale(1)'; }, ms); };
  function play() {
    input = false; pos = 0; msg.textContent = 'Kijk goed…'; hud.textContent = `Ronde ${round + 1} van ${PAT.rounds}`;
    seq = patternNext(seq); const ms = patternShow(seq.length);
    seq.forEach((p, j) => k.timeout(() => flash(p, ms * 0.75), 700 + j * ms));
    k.timeout(() => { input = true; msg.textContent = 'Jouw beurt!'; }, 700 + seq.length * ms);
  }
  function tap(i) {
    if (!input || k.over) return; flash(i, 160);
    const r = patternCheck(seq, pos, i);
    if (r === 'wrong') { input = false; msg.textContent = 'Oei, mis!'; k.timeout(() => k.finish(round, PAT.rounds, 'Wat een goed geheugen!'), 700); }
    else if (r === 'done') { input = false; round++; k.live(round, PAT.rounds); msg.textContent = 'Goed zo!'; if (round >= PAT.rounds) k.timeout(() => k.finish(round, PAT.rounds, 'Alle rondes gehaald!'), 600); else k.timeout(play, 800); }
    else pos++;
  }
  k.timeout(play, 500);
  return { destroy: k.destroy };
}

/* ---------- 4. Bellenprik: knal de bellen met het juiste plaatje ---------- */
function createPop(host, api) {
  const k = mkKit(host, api, 'linear-gradient(180deg,#fbcfe8,#c4b5fd 60%,#93c5fd)');
  const hud = k.hud(), tbox = k.mk(k.root, `position:absolute;left:50%;top:34px;transform:translateX(-50%);display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.8);border-radius:20px;padding:4px 14px;z-index:6;font-weight:800;color:#6b4f8a;font-size:16px`);
  let t = 0, raw = 0, target = popTarget(''), tLeft = 8, spawn = 0.3; const bubbles = [];
  const showT = () => { tbox.innerHTML = `Knal: ${k.ico(target, 34)}`; };
  const upd = () => { hud.textContent = `⏱ ${Math.max(0, Math.ceil(POP.time - t))}   ·   ⭐ ${raw}`; };
  function add() {
    const size = 70 + Math.round(Math.random() * 20), isT = Math.random() < 0.38, name = isT ? target : popTarget(target), x = size / 2 + Math.random() * (k.W - size);
    const el = k.mk(k.root, `position:absolute;left:0;top:0;width:${size}px;height:${size}px;border-radius:50%;background:radial-gradient(circle at 32% 28%,rgba(255,255,255,.95),rgba(255,255,255,.25) 40%,rgba(180,210,255,.45));border:2px solid rgba(255,255,255,.8);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:3;touch-action:none`, k.ico(name, Math.round(size * 0.55)));
    const b = { el, x, y: k.H + size, vy: 70 + Math.random() * 50 + t * 1.5, size, name, dead: false, w: Math.random() * 6 };
    k.on(el, 'pointerdown', (e) => {
      e.preventDefault(); if (b.dead || k.over) return; b.dead = true; const good = b.name === target; raw = Math.max(0, raw + popScore(good));
      el.style.transition = 'transform .18s,opacity .18s'; el.style.opacity = '0'; el.style.transform += ' scale(1.5)'; k.timeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 220); k.live(raw, POP.max); upd();
    });
    bubbles.push(b);
  }
  k.loop((dt) => {
    if (k.over) return; t += dt; tLeft -= dt; spawn -= dt;
    if (tLeft <= 0) { target = popTarget(target); tLeft = 8; showT(); }
    if (spawn <= 0) { add(); spawn = Math.max(0.35, 0.8 - t * 0.012); }
    for (const b of bubbles) { if (b.dead) continue; b.y -= b.vy * dt; b.el.style.transform = `translate(${Math.round(b.x - b.size / 2 + Math.sin(t * 2 + b.w) * 12)}px,${Math.round(b.y - b.size)}px)`; if (b.y < -20) { b.dead = true; if (b.el.parentNode) b.el.parentNode.removeChild(b.el); } }
    for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].dead) bubbles.splice(i, 1);
    upd();
    if (t >= POP.time) k.finish(raw, POP.max, 'Wat een prikkers!');
  });
  showT(); upd();
  return { destroy: k.destroy };
}

/* ---------- 5. Fruitmand: sleep de mand en vang het lekkers ---------- */
function createFruit(host, api) {
  const k = mkKit(host, api, 'linear-gradient(180deg,#fef9c3,#fde68a 60%,#fdba74)');
  const hud = k.hud(), by = k.H - 74, bw = 110; let bx = k.W / 2, t = 0, raw = 0, spawn = 0.4; const items = [];
  const basket = k.mk(k.root, `position:absolute;left:0;top:${by - 18}px;width:${bw}px;height:80px;z-index:4;pointer-events:none`, k.ico('bag', 96));
  const setBx = (e) => { const r = host.getBoundingClientRect ? host.getBoundingClientRect() : { left: 0 }; const cx = Number(e && e.clientX); if (Number.isFinite(cx)) bx = Math.max(bw / 2, Math.min(k.W - bw / 2, cx - r.left)); };
  k.on(k.root, 'pointermove', (e) => { e.preventDefault(); setBx(e); }); k.on(k.root, 'pointerdown', (e) => { e.preventDefault(); setBx(e); }); k.on(host, 'pointermove', setBx);
  const upd = () => { hud.textContent = `⏱ ${Math.max(0, Math.ceil(FR.time - t))}   ·   ⭐ ${raw}`; };
  function add() {
    const bad = Math.random() < 0.28, name = pickOf(bad ? FR.bad : FR.good), sz = 48;
    const el = k.mk(k.root, `position:absolute;left:0;top:0;width:${sz}px;height:${sz}px;z-index:3;pointer-events:none`, k.ico(name, sz));
    items.push({ el, x: sz / 2 + Math.random() * (k.W - sz), y: -sz, vy: 130 + Math.random() * 60 + t * 3, sz, bad, dead: false });
  }
  k.loop((dt) => {
    if (k.over) return; t += dt; spawn -= dt; if (spawn <= 0) { add(); spawn = fruitDelay(t); }
    basket.style.transform = `translateX(${Math.round(bx - bw / 2)}px)`;
    for (const it of items) {
      if (it.dead) continue; it.y += it.vy * dt; it.el.style.transform = `translate(${Math.round(it.x - it.sz / 2)}px,${Math.round(it.y)}px)`;
      if (caught(it.x, it.y, it.sz, bx, bw, by)) { it.dead = true; raw = Math.max(0, raw + (it.bad ? -3 : 1)); if (it.el.parentNode) it.el.parentNode.removeChild(it.el); k.live(raw, FR.max); }
      else if (it.y > k.H + 10) { it.dead = true; if (it.el.parentNode) it.el.parentNode.removeChild(it.el); }
    }
    for (let i = items.length - 1; i >= 0; i--) if (items[i].dead) items.splice(i, 1);
    upd();
    if (t >= FR.time) k.finish(raw, FR.max, 'Een mand vol lekkers!');
  });
  upd();
  return { destroy: k.destroy };
}

/* ---------- 6. Sorteren: dier, eten of ding? ---------- */
function createSort(host, api) {
  const k = mkKit(host, api, 'linear-gradient(180deg,#cffafe,#a5f3fc 55%,#ddd6fe)');
  const rounds = sortRounds(), hud = k.hud(), size = Math.round(k.W * 0.44);
  const card = k.mk(k.root, `position:absolute;left:50%;top:${Math.round(k.H * 0.12)}px;transform:translateX(-50%);width:${Math.round(size * 1.2)}px;height:${Math.round(size * 1.2)}px;border-radius:28px;background:#fff;box-shadow:0 10px 30px rgba(20,80,120,.25);display:flex;align-items:center;justify-content:center`);
  const bar = k.mk(k.root, `position:absolute;left:10%;width:80%;top:${Math.round(k.H * 0.12 + size * 1.2 + 14)}px;height:10px;border-radius:5px;background:rgba(0,0,0,.12);overflow:hidden`), fill = k.mk(bar, 'height:100%;width:100%;background:#22c55e');
  const msg = k.mk(k.root, `position:absolute;left:0;right:0;top:${Math.round(k.H * 0.12 + size * 1.2 + 32)}px;text-align:center;font-weight:800;font-size:20px;min-height:26px`);
  let i = 0, good = 0, locked = false, tId = 0;
  const bh = Math.round(Math.min(96, k.H * 0.15)), bwid = Math.floor((k.W - 40) / 3);
  SORT.cats.forEach(([id, name, ic], n) => {
    const b = k.mk(k.root, `position:absolute;left:${10 + n * (bwid + 10)}px;bottom:16px;width:${bwid}px;height:${bh}px;border-radius:20px;background:#6366f1;color:#fff;font-weight:900;font-size:17px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 0 rgba(0,0,0,.25);z-index:4;touch-action:none`, `${k.ico(ic, 36)}<span>${name}</span>`);
    k.on(b, 'pointerdown', (e) => { e.preventDefault(); answer(id); });
  });
  function show() {
    if (i >= rounds.length) return k.finish(good, rounds.length, good >= 14 ? 'Jij weet alles!' : 'Goed gesorteerd!');
    locked = false; msg.textContent = ''; card.innerHTML = k.ico(rounds[i].ic, Math.round(size * 0.9)); hud.textContent = `${i + 1} van ${rounds.length}   ·   ✔ ${good}`;
    fill.style.transition = 'none'; fill.style.width = '100%'; void fill.offsetWidth; fill.style.transition = `width ${SORT.per}ms linear`; fill.style.width = '0%';
    k.clear(tId); tId = k.timeout(() => answer(null), SORT.per);
  }
  function answer(a) {
    if (locked || k.over) return; locked = true; k.clear(tId);
    const ok = a === rounds[i].cat; if (ok) good++;
    msg.textContent = a === null ? '⏰ Te laat!' : ok ? '✔ Goed!' : '✘ Nee!'; msg.style.color = ok ? '#15803d' : '#b91c1c'; k.live(good, rounds.length);
    i++; k.timeout(show, 600);
  }
  show();
  return { destroy: k.destroy };
}

export const GAMES_R4 = [
  { id: 'molletjes', name: 'Molletjes', emoji: '🐰', desc: 'Tik de konijntjes en bijtjes uit hun gaatjes. Laat de bommen met rust!', create: createMol },
  { id: 'hindernis', name: 'Hindernisren', emoji: '🏃', desc: 'Tik om te springen over stenen en cactussen. Pak onderweg munten!', create: createRunner },
  { id: 'patroon', name: 'Patroon-geheugen', emoji: '🎵', desc: 'Kijk naar het rijtje lichtjes en tik het na. Elke ronde wordt het langer.', create: createPattern },
  { id: 'ballonpop', name: 'Bellenprik', emoji: '🫧', desc: 'Knal alleen de zeepbellen met het gevraagde plaatje.', create: createPop },
  { id: 'fruitmand', name: 'Fruitmand', emoji: '🧺', desc: 'Sleep de mand heen en weer en vang het lekkers. Pas op voor de bommen!', create: createFruit },
  { id: 'sorteer', name: 'Sorteer snel', emoji: '🗂️', desc: 'Is het een dier, iets te eten of een ding? Kies snel!', create: createSort },
];
export { scale100 };
