// Vlaggenroof – veroveer de rode vlag! Goede antwoorden = stappen. Bots verdedigen (en vallen je vlag aan).
// Pure spellogica (Flag) is los exporteerbaar voor bot-simulaties.

import { attachWorld, fxLayer, gearBtn, iel, di, palette, softShadow, glow, hexA, mix } from './_gxa.js?v=1';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const COLS = 9, ROWS = 11, WIN_CAPS = 3, LIMIT = 300;
export const MY_FLAG = [4, 10], RED_FLAG = [4, 0], MY_HOME = [4, 9], RED_HOME = [4, 1];
const key = (c, r) => c + ',' + r;
const man = (a, b) => Math.abs(a.c - b.c) + Math.abs(a.r - b.r);
export const inBlueHalf = (r) => r >= 6;
export const inRedHalf = (r) => r <= 4;
export const SHOP = [
  { id: 'shoes', name: 'Schoenen', icon: 'bike', emoji: '👟', desc: '+1 stap per goed antwoord', cost: [40, 120, 300] },
  { id: 'shield', name: 'Schild', icon: 'shield', emoji: '🛡️', desc: 'Beschermt tegen 1 tik (koop meer)', price: 45 },
  { id: 'freeze', name: 'Vriesbom', icon: 'snowflake', emoji: '🧊', desc: 'Bevriest alle rode spelers 5 s', price: 60 },
  { id: 'team', name: 'Wachters', icon: 'medal', emoji: '💂', desc: 'Je teamgenoten verdedigen sneller', cost: [60, 170] },
  { id: 'radar', name: 'Radar', icon: 'satellite', emoji: '📡', desc: 'Toont wie je kan tikken', cost: [35] },
  // ---- nieuw
  { id: 'tele', name: 'Teleport', icon: 'ufo', emoji: '🛸', desc: 'Spring meteen naar de middenlijn', price: 50 },
  { id: 'decoy', name: 'Lokeend', icon: 'duck', emoji: '🦆', desc: 'Rode wachters lopen 8 s weg van de vlag', price: 55 },
  { id: 'sprint', name: 'Sprintdrank', icon: 'potion', emoji: '🧪', desc: '+4 stappen meteen', price: 35 },
  { id: 'robot', name: 'Robotwacht', icon: 'robot', emoji: '🤖', desc: 'Een extra verdediger voor je team (1x)', cost: [130] },
];
const AI = [['Rico', '🦊', 'fox'], ['Zara', '🐯', 'lion'], ['Boris', '🐻', 'bear'], ['Lotte', '🐰', 'rabbit'], ['Sem', '🐺', 'dog'], ['Yara', '🦄', 'unicorn']];
export const BLITZ_LIMIT = 150;

export function genWalls(rand) {
  for (let tries = 0; tries < 60; tries++) {
    const w = new Set();
    for (let i = 0; i < 9; i++) {
      const c = Math.floor(rand() * COLS), r = 2 + Math.floor(rand() * 4); // rijen 2..5, gespiegeld naar 8..5
      if (c === 4 && (r === 2 || r === 5)) continue;
      w.add(key(c, r)); w.add(key(c, ROWS - 1 - r));
    }
    for (const k of [key(...MY_FLAG), key(...RED_FLAG), key(...MY_HOME), key(...RED_HOME), key(3, 9), key(5, 9), key(3, 1), key(5, 1), key(4, 5)]) w.delete(k);
    // open vlakken rond de middenrij
    if (reach(w, MY_FLAG, RED_FLAG) && w.size >= 8) return w;
  }
  return new Set();
}
function reach(walls, a, b) { return !!bfs(walls, { c: a[0], r: a[1] }, { c: b[0], r: b[1] }); }
const D4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
// kortste pad (array van {c,r}, zonder startpunt); opt.maxRow/minRow beperken; opt.avoid = Set van sleutels
export function bfs(walls, from, to, opt = {}) {
  const sk = key(from.c, from.r), tk = key(to.c, to.r);
  if (sk === tk) return [];
  const prev = new Map([[sk, null]]), q = [from];
  const lo = opt.minRow ?? 0, hi = opt.maxRow ?? ROWS - 1;
  for (let i = 0; i < q.length; i++) {
    const p = q[i];
    for (const [dx, dy] of D4) {
      const c = p.c + dx, r = p.r + dy, k = key(c, r);
      if (c < 0 || r < lo || c >= COLS || r > hi || walls.has(k) || prev.has(k) || (opt.avoid && opt.avoid.has(k) && k !== tk)) continue;
      prev.set(k, p); if (k === tk) { const path = []; let x = { c, r }; while (x && key(x.c, x.r) !== sk) { path.push(x); x = prev.get(key(x.c, x.r)); } return path.reverse(); }
      q.push({ c, r });
    }
  }
  return null;
}
export function newFlag(opts = {}) {
  const rand = opts.rand || Math.random, level = clamp(opts.level || 2, 1, 3), fx = opts.fx || {};
  const walls = genWalls(rand);
  const names = AI.slice().sort(() => rand() - 0.5);
  const sp = [1.45, 1.05, 0.82][level - 1];
  const mk = (id, team, role, c, r, interval, name, emoji, icon) => ({ id, team, role, c, r, home: { c, r }, name, emoji, icon, interval, t: rand() * interval, freeze: 0, carry: false, mode: 'patrol', target: null, flash: 0 });
  const agents = [
    mk(1, 'blue', 'def', 3, 8, 1.2, names[0][0], names[0][1], names[0][2]), mk(2, 'blue', 'def', 5, 7, 1.2, names[1][0], names[1][1], names[1][2]),
    mk(3, 'red', 'guard', 3, 2, 1.0 * sp, names[2][0], names[2][1], names[2][2]), mk(4, 'red', 'guard', 5, 3, 1.0 * sp, names[3][0], names[3][1], names[3][2]),
    mk(5, 'red', 'raider', 4, 1, 0.68 * sp, names[4][0], names[4][1], names[4][2]),
  ];
  agents[4].mode = 'wait';
  return {
    rand, level, fx, walls, agents, t: 0, phase: 'play', coins: (fx.startCash || 0) * 0.3, bank: 1, up: { shoes: 0, team: 0, radar: 0, robot: 0 }, decoyT: 0, blitz: !!opts.blitz, winCaps: opts.blitz ? 99 : WIN_CAPS, shieldN: fx.shield || 0, freezeN: 0,
    me: { c: MY_HOME[0], r: MY_HOME[1], carry: false, walk: [], wt: 0, invuln: 2, name: opts.name || 'Jij', emoji: '😎', icon: 'astronaut', flash: 0 },
    caps: { blue: 0, red: 0 }, streak: 0, best: 0, correct: 0, wrong: 0, tagged: 0, tags: 0, ev: [], noFx: !!opts.noFx, spent: 0, chase: [2, 3, 3.5][level - 1], raiderStart: [34, 24, 16][level - 1], flagHeldRed: false,
  };
}
const ev = (st, e) => { if (st.noFx) return; if (st.ev.length > 30) st.ev.shift(); st.ev.push(e); };
const shopCost = (st, id) => { const u = SHOP.find((x) => x.id === id); if (u.price) return u.price; const l = st.up[id]; return l >= u.cost.length ? null : u.cost[l]; };
export { shopCost };
export function buy(st, id) {
  const c = shopCost(st, id); if (c == null || st.coins < c) return false;
  if (id === 'robot' && st.up.robot >= 1) return false;
  if (id === 'shield' && st.shieldN >= 4) return false; if (id === 'freeze' && st.freezeN >= 3) return false;
  st.coins -= c; st.spent += c;
  if (id === 'shield') st.shieldN++; else if (id === 'freeze') st.freezeN++; else if (st.up[id] != null) st.up[id]++;
  if (id === 'tele') { st.me.c = 4; st.me.r = 5; st.me.walk = []; }
  if (id === 'decoy') st.decoyT = 8;
  if (id === 'sprint') st.bank = Math.min(14, st.bank + 4);
  if (id === 'robot') st.agents.push({ id: 9, team: 'blue', role: 'def', c: 4, r: 8, home: { c: 4, r: 8 }, name: 'Robbie', emoji: '🤖', icon: 'robot', interval: 0.95, t: 0, freeze: 0, carry: false, mode: 'patrol', target: null, flash: 0 });
  if (id === 'team') for (const a of st.agents) if (a.team === 'blue') a.interval = 1.2 * Math.pow(0.78, st.up.team);
  return true;
}
export function useFreeze(st) {
  if (st.freezeN <= 0) return false; st.freezeN--;
  for (const a of st.agents) if (a.team === 'red') a.freeze = 5; ev(st, { k: 'freeze', life: 1, max: 1 });
  return true;
}
export function answer(st, ok, ms) {
  if (!ok) { st.streak = 0; st.wrong++; return { steps: 0 }; }
  st.streak++; st.best = Math.max(st.best, st.streak); st.correct++;
  let s = 2 + st.up.shoes + (st.streak >= 3 ? 1 : 0) + (st.streak >= 7 ? 1 : 0); if (ms < 4500) s += 0;
  st.bank = Math.min(10, st.bank + s); st.coins += Math.round((7 + st.streak) * (st.fx.cashMult || 1));
  return { steps: s };
}
// loop richting een doel (zo ver je stappen hebt)
export function tapMove(st, c, r) {
  if (st.phase !== 'play') return 0;
  const path = bfs(st.walls, { c: st.me.c, r: st.me.r }, { c, r }); if (!path || !path.length) return 0;
  st.me.walk = path.slice(0, st.bank); return st.me.walk.length;
}
function occupied(st, c, r, self) { return st.agents.some((a) => a !== self && a.c === c && a.r === r); }
function tagMe(st) {
  const me = st.me;
  if (me.invuln > 0) return;
  if (st.shieldN > 0) { st.shieldN--; me.invuln = 2; ev(st, { k: 'shield', life: 0.8, max: 0.8 }); return; }
  st.tagged++; me.flash = 0.6;
  if (me.carry) { me.carry = false; ev(st, { k: 'drop', life: 1.2, max: 1.2 }); }
  me.c = MY_HOME[0]; me.r = MY_HOME[1]; me.walk = []; me.invuln = 3; st.bank = Math.max(1, Math.floor(st.bank / 2));
  ev(st, { k: 'tagged', life: 1.2, max: 1.2 });
}
function resetRaider(a, st) {
  a.c = RED_HOME[0]; a.r = RED_HOME[1]; a.freeze = 5; a.carry = false; a.mode = 'wait'; a.waitUntil = st.t + 6; a.flash = 0.6; st.flagHeldRed = false;
}
function checkTags(st) {
  const me = st.me;
  for (const a of st.agents) {
    if (a.freeze > 0) continue;
    if (a.team === 'red') {
      if (inRedHalf(me.r) && man(me, a) <= 1 && inRedHalf(a.r)) tagMe(st);
      if (a.role === 'raider' && inBlueHalf(a.r)) {
        if ((inBlueHalf(me.r) && man(me, a) <= 1) || st.agents.some((b) => b.team === 'blue' && b.freeze <= 0 && man(b, a) <= 1)) { resetRaider(a, st); st.tags++; ev(st, { k: 'tag', life: 1, max: 1, c: a.c, r: a.r }); }
      }
    }
  }
}
function moveAgent(st, a) {
  const rand = st.rand;
  const stepTo = (tgt, opt) => {
    const av = new Set(st.agents.filter((x) => x !== a && x.team === a.team).map((x) => key(x.c, x.r)));
    if (opt.danger) { for (const x of st.agents) if (x.team === 'blue' && x.freeze <= 0) for (const [dx, dy] of [[0, 0], ...D4, [2, 0], [-2, 0], [0, 2], [0, -2]]) av.add(key(x.c + dx, x.r + dy)); if (inBlueHalf(st.me.r)) for (const [dx, dy] of [[0, 0], ...D4]) av.add(key(st.me.c + dx, st.me.r + dy)); }
    const p = bfs(st.walls, a, tgt, { ...opt, avoid: av });
    if (p && p.length) { a.c = p[0].c; a.r = p[0].r; return true; } return false;
  };
  if (a.role === 'guard') {
    const me = st.me, d = man(a, me);
    if (st.decoyT > 0) { if (!a.target || (a.c === a.target.c && a.r === a.target.r)) a.target = { c: a.c < 4 ? 0 : COLS - 1, r: 1 + Math.floor(rand() * 3) }; if (st.walls.has(key(a.target.c, a.target.r)) || !stepTo(a.target, { maxRow: 4 })) a.target = null; return; }
    if (inRedHalf(me.r) && d <= st.chase && me.invuln <= 0) { stepTo(me, { maxRow: 4 }); return; }
    if (!a.target || (a.c === a.target.c && a.r === a.target.r) || rand() < 0.1) a.target = { c: Math.floor(rand() * COLS), r: Math.floor(rand() * 5) };
    if (st.walls.has(key(a.target.c, a.target.r)) || !stepTo(a.target, { maxRow: 4 })) a.target = null;
    return;
  }
  if (a.role === 'def') {
    // verdediger: jaag op de rode aanvaller in onze helft, anders patrouilleer rond onze vlag
    const rd = st.agents.find((x) => x.role === 'raider');
    if (rd && rd.freeze <= 0 && inBlueHalf(rd.r) && (rd.carry || man(a, rd) <= 3)) { stepTo(rd, { minRow: 3 }); return; }
    if (!a.target || (a.c === a.target.c && a.r === a.target.r) || rand() < 0.12) a.target = { c: 1 + Math.floor(rand() * 7), r: 6 + Math.floor(rand() * 5) };
    if (st.walls.has(key(a.target.c, a.target.r)) || !stepTo(a.target, { minRow: 5 })) a.target = null;
    return;
  }
  if (a.role === 'raider') {
    if (a.mode === 'wait') { if (st.t >= (a.waitUntil || st.raiderStart)) a.mode = 'go'; return; }
    if (a.mode === 'go') {
      if (a.c === MY_FLAG[0] && a.r === MY_FLAG[1]) { a.carry = true; st.flagHeldRed = true; a.mode = 'home'; ev(st, { k: 'stolen', life: 1.4, max: 1.4 }); return; }
      // een beetje omweg kiezen zodat hij niet altijd dezelfde route loopt
      const mid = a.mid || (a.mid = { c: 1 + Math.floor(rand() * 7), r: 5 });
      if (!a.passed && a.r < 5 && !(a.c === mid.c && a.r === 5)) { if (stepTo(mid, {})) return; }
      a.passed = true; stepTo({ c: MY_FLAG[0], r: MY_FLAG[1] }, { danger: true }); return;
    }
    if (a.mode === 'home') {
      if (a.r <= 1) { a.carry = false; a.mode = 'wait'; a.waitUntil = st.t + 10 + rand() * 8; a.passed = false; a.mid = null; st.caps.red++; st.flagHeldRed = false; ev(st, { k: 'redscore', life: 1.6, max: 1.6 }); return; }
      stepTo({ c: RED_HOME[0], r: 0 }, { danger: true });
    }
  }
}
export function step(st, dt) {
  if (st.phase !== 'play') return;
  st.t += dt; if (st.decoyT > 0) st.decoyT -= dt;
  for (const e of st.ev) e.life -= dt; if (st.ev.length) st.ev = st.ev.filter((e) => e.life > 0);
  const me = st.me; if (me.invuln > 0) me.invuln -= dt; if (me.flash > 0) me.flash -= dt;
  if (me.walk.length) {
    me.wt -= dt;
    if (me.wt <= 0) {
      me.wt = 0.14; const n = me.walk.shift();
      if (!st.walls.has(key(n.c, n.r)) && st.bank > 0) {
        me.c = n.c; me.r = n.r; st.bank--;
        if (!me.carry && me.c === RED_FLAG[0] && me.r === RED_FLAG[1]) { me.carry = true; ev(st, { k: 'grab', life: 1.4, max: 1.4 }); }
        if (me.carry && me.r >= 9 && me.c >= 3 && me.c <= 5) { me.carry = false; st.caps.blue++; st.coins += 40; me.walk = []; ev(st, { k: 'score', life: 1.8, max: 1.8 }); }
      } else me.walk = [];
    }
  }
  for (const a of st.agents) {
    if (a.freeze > 0) { a.freeze -= dt; continue; }
    if (a.flash > 0) a.flash -= dt;
    a.t -= dt;
    if (a.t <= 0) { a.t += a.interval * (0.9 + st.rand() * 0.2); moveAgent(st, a); }
  }
  checkTags(st);
  if (st.caps.blue >= st.winCaps || st.caps.red >= st.winCaps || st.t >= (st.limit || LIMIT)) st.phase = st.caps.blue > st.caps.red ? 'won' : st.caps.blue === st.caps.red ? 'draw' : 'lost';
}
// bot-speler (voor simulatie): wacht op de middenlijn, bevriest de wachters en sprint naar de vlag
export function autoPlay(st) {
  const me = st.me;
  for (let k = 0; k < 4; k++) {
    let did = false;
    for (const id of st.freezeN < 1 ? ['freeze', 'shoes', 'team'] : ['shoes', 'freeze', 'shield', 'team']) { const c = shopCost(st, id); if (c != null && st.coins >= c && buy(st, id)) { did = true; break; } }
    if (!did) break;
  }
  if (me.walk.length) return;
  if (me.carry) { if (st.bank > 0) tapMove(st, 4, 10); return; }
  const guards = st.agents.filter((a) => a.team === 'red' && a.role === 'guard');
  if (me.r > 5) { if (st.bank > 0) tapMove(st, 4, 5); return; }
  if (me.r === 5 || me.r <= 4) {
    const dist = bfs(st.walls, me, { c: RED_FLAG[0], r: RED_FLAG[1] });
    const need = dist ? dist.length : 99;
    const frozen = guards.every((g) => g.freeze > 1.5);
    if (frozen) { if (st.bank > 0) tapMove(st, RED_FLAG[0], RED_FLAG[1]); return; }
    if (st.freezeN > 0 && st.bank >= need) { useFreeze(st); tapMove(st, RED_FLAG[0], RED_FLAG[1]); return; }
    if (st.bank >= need && guards.every((g) => man(g, me) > st.chase + 2 && man(g, { c: 4, r: 0 }) > st.chase + 1)) tapMove(st, RED_FLAG[0], RED_FLAG[1]);
    else if (me.r <= 4 && guards.some((g) => man(g, me) <= st.chase + 1) && st.bank > 0) tapMove(st, 4, 5);
  }
}

// ---------------------------------------------------------------------------------------------
const E = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const clr = (e) => { while (e.firstChild) e.removeChild(e.firstChild); };
const addCss = (id, t) => { const s = document.createElement('style'); s.setAttribute('data-learn-g', id); s.textContent = t; document.head.appendChild(s); return s; };
const T = 34, CW = COLS * T, CH = ROWS * T;
const CSS = `
.vl-root{position:relative;display:flex;flex-direction:column;gap:8px;width:100%;height:100%;min-height:460px;padding:8px;box-sizing:border-box;color:var(--ink);overflow:auto;font-size:calc(16px*var(--gfx-font,1))}
.vl-root *{box-sizing:border-box}
.vl-hud{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.vl-chip{background:color-mix(in srgb,var(--card) 92%,transparent);border:1px solid var(--line);border-radius:14px;padding:6px 11px;font-weight:800;font-size:calc(15px*var(--gfx-font,1));white-space:nowrap;display:flex;gap:5px;align-items:center;min-height:44px;font-family:inherit;color:var(--ink)}
.vl-score{font-size:calc(19px*var(--gfx-font,1));font-weight:900;padding:6px 14px;border-radius:14px;background:linear-gradient(90deg,#3b82f6 50%,#ef4444 50%);color:#fff;min-height:44px;display:flex;align-items:center}
.vl-cv{width:100%;max-width:min(100%,380px);align-self:center;aspect-ratio:${CW}/${CH};border-radius:16px;border:3px solid color-mix(in srgb,var(--line) 70%,#000);display:block;background:#4d7c0f;touch-action:manipulation;box-shadow:0 8px 22px #0005}
.vl-shop{display:flex;gap:8px;overflow-x:auto;padding:3px 2px 6px;-webkit-overflow-scrolling:touch}
.vl-up{flex:0 0 auto;width:calc(84px*var(--gfx-scale,1));min-height:calc(84px*var(--gfx-scale,1));border:2px solid var(--line);background:color-mix(in srgb,var(--card) 94%,transparent);color:var(--ink);border-radius:14px;padding:4px 2px;font:inherit;font-size:calc(12px*var(--gfx-font,1));text-align:center;cursor:pointer;opacity:.65;line-height:1.1}
.vl-up .e{display:block;margin:0 auto}.vl-up b{display:block}.vl-up .c{font-weight:900;font-size:calc(14px*var(--gfx-font,1));display:block}
.vl-up.can{opacity:1;border-color:#22c55e;box-shadow:0 0 0 2px #22c55e44}
.vl-q{flex:1;min-height:160px;background:color-mix(in srgb,var(--card) 93%,transparent);border:1px solid var(--line);border-radius:18px;padding:8px;overflow:auto}
.vl-ov{position:absolute;inset:0;background:color-mix(in srgb,var(--card) 88%,transparent);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;padding:18px;z-index:40}
.vl-ov h2{margin:0;font-size:calc(30px*var(--gfx-font,1))}.vl-ov p{margin:0;max-width:340px;opacity:.9;line-height:1.4}
.vl-btn{border:0;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;border-radius:18px;font:inherit;font-weight:900;font-size:calc(19px*var(--gfx-font,1));padding:14px 28px;min-height:54px;cursor:pointer;box-shadow:0 6px 16px #6366f166}
.vl-btn.alt{background:linear-gradient(135deg,#f59e0b,#ef4444);box-shadow:0 6px 16px #ef444466}
.vl-toast{position:absolute;left:50%;top:60px;transform:translateX(-50%);background:#111d;color:#fff;border-radius:14px;padding:8px 14px;font-weight:800;z-index:35;white-space:nowrap;font-size:calc(15px*var(--gfx-font,1))}
`;

export default {
  id: 'vlag', name: 'Vlaggenroof', emoji: '🚩', color: '#3b82f6',
  desc: 'Goede antwoorden geven stappen. Sluip langs de wachters, pak de rode vlag en breng hem thuis! Of speel de Blitz: zoveel mogelijk vlaggen in 2,5 minuut.',
  tags: ['strategie', 'bots', 'kaart', 'blitz'], minutes: 5, duo: false,
  create(host, env) {
    const style = addCss('vlag', CSS);
    const f0 = env.fx || {};
    const fx = { startCash: clamp(+f0.startCash || 0, 0, 5000), cashMult: clamp(+f0.cashMult || 1, 0.5, 5), shield: Math.round(clamp((+f0.shield || 0), 0, 3)), hints: Math.round(clamp(+f0.hints || 0, 0, 5)) };
    let st = newFlag({ level: env.level || 2, rand: env.rand, fx, name: env.name });
    st.limit = LIMIT + clamp(+f0.timeBonus || 0, 0, 60);
    const root = E('div', 'vl-root'); host.appendChild(root);
    const bgw = attachWorld(root, env, 'vlag'); const fl = fxLayer(root, env);
    const world = bgw.world, pal = palette(world);
    const wallIcons = (world.deco && world.deco.length ? world.deco : ['tree', 'rock']);
    let dead = false, ended = false, cur = null, started = false, raf = 0, last = 0, nQ = 0, queue = [], uiT = 0, toastEl = null, blitz = false, seen = new Set();
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
    const qq = () => (env.gfx && env.gfx.q != null ? env.gfx.q : 1);
    const hud = E('div', 'vl-hud'); const cScore = E('div', 'vl-score'), cBank = E('div', 'vl-chip'), cCoins = E('div', 'vl-chip'), cTime = E('div', 'vl-chip'), cBuf = E('div', 'vl-chip'); hud.append(cScore, cBank, cCoins, cTime, cBuf, gearBtn());
    const cv = E('canvas', 'vl-cv'); const dpr = Math.min(2, Math.max(1, globalThis.devicePixelRatio || 1) * ((env.gfx && env.gfx.q === 0) ? 1 : 1.25)); cv.width = Math.round(CW * dpr); cv.height = Math.round(CH * dpr); const ctx = cv.getContext('2d');
    const shop = E('div', 'vl-shop'); const upEls = {};
    for (const u of SHOP) { const b = E('button', 'vl-up'); b.type = 'button'; b.title = u.desc; const c = E('span', 'c'), nm = E('b'); b.append(iel(u.icon, 36, 'e'), nm, c); b.addEventListener('click', () => { if (!started || ended) return; if (buy(st, u.id)) { env.snd.play('power'); toast(u.name + '!', u.icon); fl.burstEl(b, 'sparkle', 12); } else env.snd.play('klik'); refresh(); }); upEls[u.id] = { b, c, nm }; shop.appendChild(b); }
    const freezeBtn = E('button', 'vl-chip'); freezeBtn.type = 'button'; freezeBtn.append(iel('snowflake', 26), E('span', '', 'Gebruik vriesbom')); freezeBtn.style.cssText = 'cursor:pointer;display:none;border-color:#22d3ee';
    freezeBtn.addEventListener('click', () => { if (useFreeze(st)) { env.snd.play('power'); toast('Rood bevroren!', 'snowflake'); fl.burst((root.clientWidth || 360) / 2, 200, 'sparkle', 30); } refresh(); });
    const qhost = E('div', 'vl-q');
    root.append(hud, cv, freezeBtn, shop, qhost);
    function toast(t, icon) { if (toastEl) toastEl.remove(); toastEl = E('div', 'vl-toast'); toastEl.style.display = 'flex'; toastEl.style.gap = '6px'; toastEl.style.alignItems = 'center'; if (icon) toastEl.appendChild(iel(icon, 24)); toastEl.appendChild(E('span', '', t)); root.appendChild(toastEl); const el = toastEl; later(() => el.remove(), 1700); }
    const chip = (el, ico, txt) => { clr(el); el.append(iel(ico, 26), E('span', '', txt)); };
    let rk = '';
    function refresh() {
      const m = Math.max(0, Math.floor(st.limit - st.t));
      const k = st.caps.blue + '|' + st.caps.red + '|' + st.bank + '|' + Math.floor(st.coins) + '|' + m + '|' + st.shieldN + '|' + st.freezeN + '|' + JSON.stringify(st.up);
      if (k !== rk) {
        rk = k;
        cScore.textContent = st.caps.blue + ' - ' + st.caps.red; chip(cBank, 'bike', String(st.bank)); chip(cCoins, 'coin', String(Math.floor(st.coins))); chip(cTime, 'hourglass', Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'));
        clr(cBuf); if (st.shieldN) cBuf.append(iel('shield', 24), E('span', '', st.shieldN + ' ')); if (st.freezeN) cBuf.append(iel('snowflake', 24), E('span', '', String(st.freezeN)));
        cBuf.style.display = cBuf.firstChild ? '' : 'none'; freezeBtn.style.display = st.freezeN > 0 ? '' : 'none';
        for (const u of SHOP) { const c = shopCost(st, u.id), el = upEls[u.id]; el.c.textContent = c == null ? 'MAX' : String(c); el.nm.textContent = u.name + (u.cost && u.id !== 'robot' ? ' ' + st.up[u.id] : ''); el.b.className = 'vl-up' + (c != null && st.coins >= c && !(u.id === 'robot' && st.up.robot >= 1) ? ' can' : ''); }
      }
    }
    const toRoot = (c, r) => { try { const a = cv.getBoundingClientRect(), b = root.getBoundingClientRect(), k = (a.width || CW) / CW; return [a.left - b.left + (c * T + T / 2) * k, a.top - b.top + (r * T + T / 2) * k]; } catch (e) { return [c * T, r * T]; } };
    cv.addEventListener('pointerdown', (e) => {
      if (!started || ended) return;
      const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) / (r.width || CW) * COLS, y = (e.clientY - r.top) / (r.height || CH) * ROWS;
      const n = tapMove(st, clamp(Math.floor(x), 0, COLS - 1), clamp(Math.floor(y), 0, ROWS - 1)); if (n) env.snd.play('tik'); else if (st.bank <= 0) toast('Beantwoord een vraag voor stappen!');
    });

    // ---- tekenen
    function flagShape(x, y, color, wave) { ctx.fillStyle = '#e5e7eb'; ctx.fillRect(x - 1.5, y - 15, 3, 30); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x + 1.5, y - 15); ctx.lineTo(x + 17, y - 10 + Math.sin(wave) * 2.5); ctx.lineTo(x + 1.5, y - 3); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#0006'; ctx.lineWidth = 1; ctx.stroke(); }
    function agentShape(x, y, a, ring) {
      const q = qq();
      ctx.beginPath(); ctx.ellipse(x, y + 14, 12, 4, 0, 0, 6.2832); ctx.fillStyle = '#0004'; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y + 4, 15, 0, 6.2832); ctx.fillStyle = a.freeze > 0 ? '#bae6fdcc' : 'rgba(255,255,255,.55)'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = ring; ctx.stroke();
      di(ctx, a.icon || 'astronaut', x, y - 1, 34, { q, shadow: false });
      if (a.carry) flagShape(x + 10, y - 12, a.team === 'red' ? '#3b82f6' : '#ef4444', st.t * 6);
      if (a.freeze > 0) di(ctx, 'snowflake', x + 11, y - 12, 16, { q, shadow: false });
    }
    function draw() {
      const q = qq();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const aBlue = mix(pal.a, '#3b82f6', 0.28), bBlue = mix(pal.b, '#3b82f6', 0.28), aRed = mix(pal.a, '#ef4444', 0.28), bRed = mix(pal.b, '#ef4444', 0.28);
      for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) { const odd = (c + r) % 2; ctx.fillStyle = r >= 6 ? (odd ? aBlue : bBlue) : r <= 4 ? (odd ? aRed : bRed) : (odd ? pal.a : pal.b); ctx.fillRect(c * T, r * T, T, T); }
      ctx.fillStyle = '#3b82f655'; ctx.fillRect(3 * T, 9 * T, 3 * T, 2 * T); ctx.fillStyle = '#ef444455'; ctx.fillRect(3 * T, 0, 3 * T, 2 * T);
      ctx.strokeStyle = '#fff9'; ctx.setLineDash && ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 5.5 * T); ctx.lineTo(CW, 5.5 * T); ctx.stroke(); ctx.setLineDash && ctx.setLineDash([]);
      let wi = 0; for (const k of st.walls) { const [c, r] = k.split(',').map(Number); di(ctx, wallIcons[(c * 3 + r) % wallIcons.length], c * T + T / 2, r * T + T / 2 - 1, T * 1.05, { q }); wi++; }
      const redHere = !st.agents.some((a) => a.carry && a.team === 'blue') && !st.me.carry; const blueHere = !st.flagHeldRed;
      if (redHere) flagShape(RED_FLAG[0] * T + T / 2, RED_FLAG[1] * T + T / 2, '#ef4444', st.t * 5);
      if (blueHere) flagShape(MY_FLAG[0] * T + T / 2, MY_FLAG[1] * T + T / 2, '#3b82f6', st.t * 5 + 1);
      if (st.bank > 0 && !st.me.walk.length && started) {
        ctx.fillStyle = '#ffffff66';
        const sn = new Map([[key(st.me.c, st.me.r), 0]]), qu = [{ c: st.me.c, r: st.me.r }];
        for (let i = 0; i < qu.length; i++) { const p = qu[i], d = sn.get(key(p.c, p.r)); if (d >= st.bank) continue; for (const [dx, dy] of D4) { const c = p.c + dx, r = p.r + dy, k = key(c, r); if (c < 0 || r < 0 || c >= COLS || r >= ROWS || st.walls.has(k) || sn.has(k)) continue; sn.set(k, d + 1); qu.push({ c, r }); ctx.beginPath(); ctx.arc(c * T + T / 2, r * T + T / 2, 3.5, 0, 6.2832); ctx.fill(); } }
      }
      if (st.up.radar) for (const a of st.agents) if (a.team === 'red' && a.role === 'guard') { ctx.beginPath(); ctx.arc(a.c * T + T / 2, a.r * T + T / 2, st.chase * T * 0.9, 0, 6.2832); ctx.fillStyle = '#ef444418'; ctx.fill(); ctx.strokeStyle = '#ef444477'; ctx.lineWidth = 1.5; ctx.stroke(); }
      for (const a of st.agents) agentShape(a.c * T + T / 2, a.r * T + T / 2 + Math.sin(st.t * 5 + a.id) * 1, a, a.team === 'red' ? '#ef4444' : '#3b82f6');
      const me = st.me; if (!(me.invuln > 0 && Math.floor(st.t * 8) % 2)) agentShape(me.c * T + T / 2, me.r * T + T / 2, { icon: me.icon, freeze: 0, carry: me.carry, team: 'blue' }, '#facc15');
      if (me.invuln > 0) { ctx.beginPath(); ctx.arc(me.c * T + T / 2, me.r * T + T / 2 + 3, 19, 0, 6.2832); ctx.strokeStyle = '#facc15aa'; ctx.lineWidth = 2; ctx.stroke(); }
      if (st.decoyT > 0) { ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#000b'; ctx.lineWidth = 3; const t = 'Lokeend: ' + Math.ceil(st.decoyT) + ' s'; ctx.strokeText(t, CW / 2, 12); ctx.fillText(t, CW / 2, 12); }
      for (const e of st.ev) {
        const a = clamp(e.life / e.max, 0, 1); ctx.globalAlpha = Math.min(1, a * 1.5); ctx.font = 'bold 20px sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = '#000b';
        const txt = { grab: ['Vlag gepakt! Naar huis!', '#fde047'], score: ['PUNT!', '#86efac'], tagged: ['Getikt!', '#fca5a5'], drop: ['Vlag kwijt', '#fca5a5'], stolen: ['Rood pakt jouw vlag!', '#fca5a5'], redscore: ['Rood scoort...', '#fca5a5'], tag: ['Aanvaller getikt!', '#86efac'], shield: ['Geblokt!', '#93c5fd'], freeze: ['Bevroren!', '#67e8f9'] }[e.k];
        if (txt) { ctx.fillStyle = txt[1]; const y = CH / 2 - (1 - a) * 20; ctx.strokeText(txt[0], CW / 2, y); ctx.fillText(txt[0], CW / 2, y); }
        ctx.globalAlpha = 1;
        if (!seen.has(e)) { seen.add(e); const mp = toRoot(me.c, me.r); if (e.k === 'score') fl.burst(mp[0], mp[1], 'confetti', 40); else if (e.k === 'grab') fl.burst(mp[0], mp[1], 'stars', 14); else if (e.k === 'tagged') fl.burst(mp[0], mp[1], 'smoke', 8); else if (e.k === 'tag') { const rp = toRoot(e.c, e.r); fl.burst(rp[0], rp[1], 'sparkle', 12); } else if (e.k === 'shield') fl.burst(mp[0], mp[1], 'sparkle', 10); }
      }
      if (seen.size > 80) seen = new Set([...seen].filter((e) => st.ev.includes(e)));
    }

    // ---- vragen
    function takeQ() {
      if (!queue.length) { try { queue = env.pick(12) || []; } catch (e) { queue = []; } }
      return queue.shift() || { t: 'num', q: 'Wat is ' + (3 + (nQ % 6)) + ' + ' + (2 + (nQ % 4)) + '?', a: 5 + (nQ % 6) + (nQ % 4) };
    }
    function nextQuestion() {
      if (dead || ended) return;
      const q = takeQ(); nQ++; clr(qhost);
      try { cur = env.ask(qhost, q, { compact: true, feedback: true, autoNext: 600, hints: fx.hints, time: env.level === 3 ? 25 : 0, label: 'Verdien stappen' }); } catch (e) { cur = { promise: Promise.resolve({ ok: false, ms: 0 }), cancel() {} }; }
      const h = cur;
      h.promise.then((r) => {
        if (dead || ended || cur !== h) return; cur = null; r = r || {};
        try { env.report({ q, ok: !!r.ok, ms: r.ms || 0 }); } catch (e) { /* hub */ }
        const res = answer(st, !!r.ok, r.ms || 9999);
        env.snd.play(r.ok ? 'goed' : 'fout'); if (res.steps) { toast('+' + res.steps + ' stappen: tik waar je heen wilt', 'bike'); fl.burstEl(cBank, 'sparkle', 8); }
        refresh(); later(nextQuestion, 30);
      }).catch(() => { if (!dead && !ended && cur === h) { cur = null; later(nextQuestion, 300); } });
    }
    function loop() {
      raf = 0; if (dead) return;
      if (host.isConnected === false) { later(loop, 500); last = performance.now(); return; }
      const now = performance.now(); const dt = clamp((now - last) / 1000, 0, 0.1); last = now;
      if (started && !ended) {
        const caps0 = st.caps.blue, red0 = st.caps.red; step(st, dt);
        if (st.caps.blue > caps0) env.snd.play('win'); if (st.caps.red > red0) env.snd.play('lose');
        uiT += dt; if (uiT > 0.2) { uiT = 0; refresh(); }
        if (st.phase !== 'play') finish();
      }
      draw(); raf = requestAnimationFrame(loop);
    }
    function finish() {
      if (ended) return; ended = true;
      if (cur) { try { cur.cancel(); } catch (e) { /* */ } cur = null; }
      rk = ''; refresh();
      const won = st.phase === 'won', draw0 = st.phase === 'draw';
      const ov = E('div', 'vl-ov'); const big = E('div', 'big'); big.appendChild(iel(won ? 'trophy' : draw0 ? 'medal' : 'flag', 96));
      ov.append(big, E('h2', '', won ? 'Je team wint!' : draw0 ? 'Gelijkspel' : 'Rood wint'), E('p', '', 'Eindstand: blauw ' + st.caps.blue + ' - rood ' + st.caps.red + '.'));
      root.appendChild(ov); env.snd.play(won ? 'win' : 'lose'); fl.burst((root.clientWidth || 360) / 2, 160, won ? 'confetti' : 'smoke', won ? 60 : 10);
      const score = st.caps.blue * 100 + st.correct * 3 + st.tags * 10 + (won ? 200 : 0);
      later(() => env.end({ score, win: won ? true : draw0 ? null : false, stats: { correct: st.correct, wrong: st.wrong, 'beste reeks': st.best, vlaggen: st.caps.blue, getikt: st.tagged, 'aanvallers getikt': st.tags }, summary: (blitz ? 'Blitz: ' : '') + 'Blauw ' + st.caps.blue + ' - ' + st.caps.red + ' rood · ' + st.correct + ' goed, ' + st.tagged + 'x getikt.' }), 1800);
    }
    function start(mode) {
      if (started) return; started = true; blitz = mode === 'blitz';
      if (blitz) { st = newFlag({ level: env.level || 2, rand: env.rand, fx, name: env.name, blitz: true }); st.limit = BLITZ_LIMIT + clamp(+f0.timeBonus || 0, 0, 60); }
      last = performance.now(); refresh(); nextQuestion();
    }
    const intro = E('div', 'vl-ov');
    const mk = (txt, cls, m) => { const b = E('button', 'vl-btn ' + cls, txt); b.type = 'button'; b.addEventListener('click', () => { intro.remove(); start(m); }); return b; };
    const bigI = E('div', 'big'); bigI.appendChild(iel('flag', 96));
    intro.append(bigI, E('h2', '', 'Vlaggenroof'), E('p', '', 'Elk goed antwoord geeft stappen: tik op de kaart om te lopen. Pak de rode vlag bovenin en breng hem naar je basis. Rode wachters tikken je in hun helft!'), mk('Tik om te beginnen (eerste tot 3)', '', 'klassiek'), mk('Blitz: 2,5 minuut, zoveel vlaggen als kan', 'alt', 'blitz'));
    root.appendChild(intro); refresh(); last = performance.now(); raf = requestAnimationFrame(loop);

    return { destroy() { dead = true; if (raf) cancelAnimationFrame(raf); timers.forEach((t) => clearTimeout(t)); timers.clear(); if (cur) { try { cur.cancel(); } catch (e) { /* */ } cur = null; } fl.destroy(); bgw.destroy(); root.remove(); style.remove(); } };
  },
};
