// Torenverdediging – goede antwoorden = goud voor torens. 10 golven monsters, 2 eindbazen.
import { attachWorld, fxLayer, gearBtn, iel, ic, di, palette, worldOf, softShadow, glow, hexA } from './_gxa.js?v=1';
// Pure spellogica (TD) is los exporteerbaar voor bot-simulaties.

export const COLS = 9, ROWS = 8, CELL = 40, W = COLS * CELL, H = ROWS * CELL, WAVES = 10;
const PATH_CELLS = [];
for (let c = 0; c <= 7; c++) PATH_CELLS.push([c, 1]);
PATH_CELLS.push([7, 2]);
for (let c = 7; c >= 1; c--) PATH_CELLS.push([c, 3]);
PATH_CELLS.push([1, 4]);
for (let c = 1; c <= 7; c++) PATH_CELLS.push([c, 5]);
PATH_CELLS.push([7, 6], [7, 7]);
const PTS = [[-20, 1 * CELL + 20], ...PATH_CELLS.map(([c, r]) => [c * CELL + 20, r * CELL + 20]), [7 * CELL + 20, ROWS * CELL + 20]];
const CUM = [0]; for (let i = 1; i < PTS.length; i++) CUM.push(CUM[i - 1] + Math.hypot(PTS[i][0] - PTS[i - 1][0], PTS[i][1] - PTS[i - 1][1]));
export const PATH_LEN = CUM[CUM.length - 1];
const PATHSET = new Set(PATH_CELLS.map(([c, r]) => c + ',' + r));
export const isPath = (c, r) => PATHSET.has(c + ',' + r);
export function posAt(d) {
  if (d <= 0) return { x: PTS[0][0], y: PTS[0][1] };
  let i = 1; while (i < CUM.length - 1 && CUM[i] < d) i++;
  const t = (d - CUM[i - 1]) / (CUM[i] - CUM[i - 1]);
  return { x: PTS[i - 1][0] + (PTS[i][0] - PTS[i - 1][0]) * t, y: PTS[i - 1][1] + (PTS[i][1] - PTS[i - 1][1]) * t };
}

export const TOWERS = {
  boog: { name: 'Boogschutter', emoji: '🏹', icon: 'bow', cost: 40, range: 95, cd: 0.65, dmg: 9, color: '#facc15', info: 'Snel en goedkoop' },
  kanon: { name: 'Kanon', emoji: '💣', icon: 'bomb', cost: 85, range: 88, cd: 1.5, dmg: 22, splash: 42, color: '#f97316', info: 'Schade in een kring' },
  ijs: { name: 'IJstoren', emoji: '❄️', icon: 'snowflake', cost: 70, range: 82, cd: 0.9, dmg: 4, slow: 0.5, color: '#67e8f9', info: 'Vertraagt monsters' },
  bliksem: { name: 'Bliksem', emoji: '⚡', icon: 'bolt', cost: 135, range: 92, cd: 1.1, dmg: 15, chain: 3, color: '#fde047', info: 'Springt naar 3 monsters' },
  magier: { name: 'Magiër', emoji: '🔮', icon: 'wand', cost: 185, range: 125, cd: 1.3, dmg: 48, color: '#c084fc', info: 'Krachtig, groot bereik' },
  // ---- nieuw
  vuur: { name: 'Vuurtoren', emoji: '🔥', icon: 'flame', cost: 95, range: 72, cd: 0.55, dmg: 5, burn: 3, color: '#fb923c', info: 'Zet monsters in brand' },
  sniper: { name: 'Scherpschutter', emoji: '🎯', icon: 'target', cost: 160, range: 190, cd: 2.1, dmg: 70, strong: true, color: '#38bdf8', info: 'Enorm bereik, mikt op de sterkste' },
  kristal: { name: 'Kristal', emoji: '💎', icon: 'gem', cost: 120, range: 78, cd: 99, dmg: 0, support: 0.25, color: '#a5f3fc', info: 'Maakt torens ernaast 25% sterker' },
  vulkaan: { name: 'Vulkaan', emoji: '🌋', icon: 'volcano', cost: 260, range: 105, cd: 1.0, dmg: 34, splash: 38, burn: 2, color: '#ef4444', info: 'Duur: kring-schade met brand' },
};
export const TOWER_IDS = Object.keys(TOWERS);
export const MONSTERS = {
  worm: { emoji: '🐛', icon: 'slime', hp: 1, speed: 1, r: 11 }, slak: { emoji: '🐌', icon: 'snail', hp: 1.5, speed: 0.6, r: 11 }, vleer: { emoji: '🦇', icon: 'owl', hp: 0.65, speed: 1.55, r: 11 },
  zwijn: { emoji: '🐗', icon: 'pig', hp: 2.8, speed: 0.8, r: 13 }, spook: { emoji: '👻', icon: 'ghost', hp: 1.4, speed: 1.15, r: 12 }, baas: { emoji: '👹', icon: 'dino', hp: 16, speed: 0.55, r: 18 }, draak: { emoji: '🐲', icon: 'dragon', hp: 34, speed: 0.5, r: 20 },
  // ---- nieuw
  krab: { emoji: '🦀', icon: 'crab', hp: 2.2, speed: 0.85, r: 12, slowRes: 0.5 }, bij: { emoji: '🐝', icon: 'bee', hp: 0.5, speed: 1.9, r: 10 },
  robot: { emoji: '🤖', icon: 'robot', hp: 3.6, speed: 0.7, r: 13 }, alien: { emoji: '👽', icon: 'alien', hp: 1.8, speed: 1.3, r: 12 },
  kraken: { emoji: '🐙', icon: 'octopus', hp: 60, speed: 0.45, r: 22, boss: true },
};
const BASE_SPEED = 52;
export const towerStat = (type, lvl) => {
  const b = TOWERS[type], k = lvl - 1;
  return { dmg: b.dmg * (1 + 0.65 * k), range: b.range * (1 + 0.07 * k), cd: b.cd * (1 - 0.08 * k), splash: b.splash ? b.splash * (1 + 0.12 * k) : 0, slow: b.slow ? Math.max(0.25, b.slow - 0.08 * k) : 0, chain: b.chain ? b.chain + k : 0, burn: b.burn || 0, support: b.support ? b.support + 0.1 * k : 0 };
};
export const upgradeCost = (type, lvl) => (lvl >= 3 ? null : Math.round(TOWERS[type].cost * 0.8 * lvl));
export function waveDef(n) {
  const g = [];
  const add = (type, count, gap, at = 0) => g.push({ type, count, gap, at });
  if (n === 1) add('worm', 6, 1.3);
  else if (n === 2) { add('worm', 7, 1.1); add('slak', 3, 1.6, 4); }
  else if (n === 3) { add('vleer', 7, 0.9); add('worm', 6, 1, 3); add('bij', 5, 0.5, 9); }
  else if (n === 4) { add('zwijn', 3, 2.2); add('worm', 8, 0.9, 2); }
  else if (n === 5) { add('slak', 6, 1.3); add('baas', 1, 1, 8); }
  else if (n === 6) { add('spook', 9, 0.9); add('vleer', 6, 0.7, 5); add('krab', 3, 1.8, 9); }
  else if (n === 7) { add('zwijn', 6, 1.8); add('slak', 8, 0.9, 3); }
  else if (n === 8) { add('spook', 10, 0.75); add('zwijn', 4, 1.6, 4); add('vleer', 8, 0.6, 8); add('robot', 2, 2.5, 12); }
  else if (n === 9) { add('zwijn', 8, 1.3); add('spook', 10, 0.7, 3); add('baas', 1, 1, 10); add('alien', 4, 1.0, 6); }
  else if (n === 10) { add('spook', 10, 0.8); add('zwijn', 8, 1.2, 4); add('draak', 1, 1, 12); add('vleer', 10, 0.5, 14); }
  else { // eindeloos: golven na 10, steeds anders
    const k = n - 10, kinds = ['spook', 'zwijn', 'krab', 'robot', 'alien', 'bij', 'vleer'];
    add(kinds[k % kinds.length], 8 + k, Math.max(0.35, 0.9 - k * 0.03));
    add(kinds[(k + 3) % kinds.length], 6 + k, Math.max(0.35, 1.1 - k * 0.03), 4);
    if (k % 3 === 0) add(k % 6 === 0 ? 'kraken' : 'baas', 1 + Math.floor(k / 6), 6, 10);
    if (k % 5 === 0) add('draak', 1 + Math.floor(k / 10), 5, 14);
  }
  const q = [];
  for (const s of g) for (let i = 0; i < s.count; i++) q.push({ t: s.at + i * s.gap, type: s.type });
  return q.sort((a, b) => a.t - b.t);
}
export const hpBase = (n) => (n <= 10 ? 19 * Math.pow(1.47, n - 1) : 19 * Math.pow(1.47, 9) * Math.pow(1.2, n - 10));

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export function newTD(opts = {}) {
  const fx = opts.fx || {};
  return {
    gold: 90 + (fx.startCash || 0), lives: 10 + (fx.extraLives || 0), maxLives: 10 + (fx.extraLives || 0), wave: 0, phase: 'build', countdown: 14,
    towers: [], mons: [], queue: [], waveT: 0, t: 0, kills: 0, streak: 0, best: 0, correct: 0, wrong: 0, shield: fx.shield || 0,
    lvlMult: [0.8, 1, 1.25][clamp(opts.level || 2, 1, 3) - 1], fx, ev: [], noFx: !!opts.noFx, uid: 1, leaked: 0, bonus: 0, endless: !!opts.endless,
  };
}
const pushEv = (st, e) => { if (st.noFx) return; if (st.ev.length > 80) st.ev.shift(); st.ev.push(e); };
export function startWave(st) {
  if (st.phase !== 'build' || (!st.endless && st.wave >= WAVES)) return false;
  st.wave++; st.phase = 'wave'; st.waveT = 0;
  st.queue = waveDef(st.wave); return true;
}
export function canBuild(st, c, r) { return c >= 0 && r >= 0 && c < COLS && r < ROWS && !isPath(c, r) && !st.towers.some((t) => t.c === c && t.r === r); }
export function build(st, c, r, type) {
  const b = TOWERS[type]; if (!b || !canBuild(st, c, r) || st.gold < b.cost) return null;
  st.gold -= b.cost; const t = { id: st.uid++, c, r, x: c * CELL + 20, y: r * CELL + 20, type, lvl: 1, cd: 0.3, spent: b.cost, flash: 0 }; st.towers.push(t); return t;
}
export function upgrade(st, t) { const c = upgradeCost(t.type, t.lvl); if (c == null || st.gold < c) return false; st.gold -= c; t.spent += c; t.lvl++; return true; }
export function sell(st, t) { const i = st.towers.indexOf(t); if (i < 0) return 0; st.towers.splice(i, 1); const g = Math.round(t.spent * 0.6); st.gold += g; return g; }

export function answer(st, ok, ms, fx) {
  fx = fx || st.fx;
  if (ok) {
    st.streak++; st.best = Math.max(st.best, st.streak); st.correct++;
    const speed = ms < 5000 ? 1.15 : 1;
    const g = Math.round(26 * (fx.cashMult || 1) * (1 + Math.min(st.streak, 10) * (0.04 + (fx.streakBonus || 0))) * speed);
    st.gold += g;
    let strike = false;
    if (st.streak % 5 === 0 && st.mons.length) { strike = true; for (const m of st.mons) hit(st, m, Math.max(8, m.max * 0.35), '#fde047'); pushEv(st, { k: 'flash', life: 0.4, max: 0.4, c: '#fde047' }); }
    return { gold: g, strike };
  }
  st.streak = 0; st.wrong++;
  return { gold: 0, strike: false };
}
function hit(st, m, dmg, color, quiet) {
  if (m.hp <= 0) return;
  m.hp -= dmg; if (!quiet) m.hurt = 0.12;
  if (m.hp <= 0) {
    st.kills++; const g = Math.round((3 + st.wave * 1.2) * (m.type === 'baas' || m.type === 'draak' || m.type === 'kraken' ? 6 : 1) * (st.fx.cashMult || 1)); st.gold += g;
    pushEv(st, { k: 'kill', x: m.x, y: m.y, big: m.type === 'baas' || m.type === 'draak' || m.type === 'kraken', life: 0.1, max: 0.1 });
    pushEv(st, { k: 'txt', x: m.x, y: m.y - 10, s: '+' + g, c: '#fde047', life: 0.8, max: 0.8 });
  }
}
function targetFor(st, t, stt) {
  let best = null, bd = -1; const strong = TOWERS[t.type].strong;
  for (const m of st.mons) { if (m.hp <= 0) continue; const dx = m.x - t.x, dy = m.y - t.y; const sc = strong ? m.hp : m.d; if (dx * dx + dy * dy <= stt.range * stt.range && sc > bd) { best = m; bd = sc; } }
  return best;
}
export function boostOf(st, t) {
  let b = 1;
  for (const o of st.towers) { if (o === t || !TOWERS[o.type].support) continue; const so = towerStat(o.type, o.lvl); if (Math.hypot(o.x - t.x, o.y - t.y) <= so.range) b += so.support; }
  return Math.min(b, 2.2);
}
export function step(st, dt) {
  if (st.phase === 'won' || st.phase === 'lost') return;
  st.t += dt;
  for (const e of st.ev) e.life -= dt; if (st.ev.length) st.ev = st.ev.filter((e) => e.life > 0);
  if (st.phase === 'build') { st.countdown -= dt; if (st.countdown <= 0) startWave(st); }
  if (st.phase === 'wave') {
    st.waveT += dt;
    while (st.queue.length && st.queue[0].t <= st.waveT) {
      const q = st.queue.shift(), def = MONSTERS[q.type];
      const hp = def.hp * hpBase(st.wave) * st.lvlMult;
      st.mons.push({ id: st.uid++, type: q.type, d: 0, hp, max: hp, speed: def.speed, x: PTS[0][0], y: PTS[0][1], slow: 0, slowF: 1, hurt: 0, r: def.r, burn: 0, burnDps: 0, boss: !!def.boss });
    }
  }
  for (const m of st.mons) {
    if (m.burn > 0) { m.burn -= dt; hit(st, m, m.burnDps * dt, '#fb923c', true); if (m.hp <= 0) continue; }
    if (m.slow > 0) m.slow -= dt; const f = m.slow > 0 ? m.slowF : 1;
    m.d += m.speed * BASE_SPEED * f * dt; if (m.hurt > 0) m.hurt -= dt;
    const p = posAt(m.d); m.x = p.x; m.y = p.y;
  }
  for (const m of st.mons) if (m.d >= PATH_LEN && m.hp > 0) { m.hp = 0; m.leaked = true; st.lives -= (m.type === 'baas' ? 3 : m.type === 'draak' ? 5 : 1); st.leaked++; pushEv(st, { k: 'flash', life: 0.3, max: 0.3, c: '#ef4444' }); }
  for (const t of st.towers) {
    t.cd -= dt; if (t.flash > 0) t.flash -= dt;
    if (t.cd > 0) continue;
    if (TOWERS[t.type].support) { t.cd = 99; continue; }
    const s = towerStat(t.type, t.lvl); s.dmg *= boostOf(st, t); const tg = targetFor(st, t, s);
    if (!tg) { t.cd = 0.05; continue; }
    t.cd = s.cd; t.flash = 0.12;
    const B = TOWERS[t.type];
    pushEv(st, { k: 'line', x1: t.x, y1: t.y, x2: tg.x, y2: tg.y, c: B.color, w: t.type === 'magier' || t.type === 'sniper' ? 4 : 2, life: 0.12, max: 0.12 });
    if (t.type === 'kanon' || t.type === 'vulkaan') {
      for (const m of st.mons) if (m.hp > 0 && Math.hypot(m.x - tg.x, m.y - tg.y) <= s.splash) { hit(st, m, s.dmg, B.color); if (s.burn) { m.burn = s.burn; m.burnDps = s.dmg * 0.25; } }
      pushEv(st, { k: 'ring', x: tg.x, y: tg.y, r: s.splash, c: B.color, life: 0.25, max: 0.25 });
    } else if (t.type === 'bliksem') {
      let from = tg; const used = new Set([tg.id]); hit(st, tg, s.dmg, B.color);
      for (let i = 0; i < s.chain - 1; i++) {
        let nx = null, nd = 70; for (const m of st.mons) if (m.hp > 0 && !used.has(m.id)) { const d = Math.hypot(m.x - from.x, m.y - from.y); if (d < nd) { nd = d; nx = m; } }
        if (!nx) break; used.add(nx.id); pushEv(st, { k: 'line', x1: from.x, y1: from.y, x2: nx.x, y2: nx.y, c: B.color, w: 2, life: 0.14, max: 0.14 }); hit(st, nx, s.dmg * 0.8, B.color); from = nx;
      }
    } else if (t.type === 'ijs') { hit(st, tg, s.dmg, B.color); tg.slow = 2; tg.slowF = 1 - (1 - s.slow) * (1 - ((MONSTERS[tg.type] || {}).slowRes || 0)); }
    else if (t.type === 'vuur') { hit(st, tg, s.dmg, B.color); tg.burn = s.burn; tg.burnDps = s.dmg * 1.4; }
    else hit(st, tg, s.dmg, B.color);
  }
  st.mons = st.mons.filter((m) => m.hp > 0);
  if (st.lives <= 0) { st.lives = 0; st.phase = 'lost'; return; }
  if (st.phase === 'wave' && !st.queue.length && !st.mons.length) {
    const b = Math.round((22 + st.wave * 6) * (st.fx.cashMult || 1)); st.gold += b; st.bonus += b;
    if (!st.endless && st.wave >= WAVES) st.phase = 'won'; else { st.phase = 'build'; st.countdown = 11; }
  }
}
// eenvoudige bouw-bot (voor simulatie): plaatst torens op de cellen die het meeste pad bestrijken
let SPOTS = null;
export function bestSpots() {
  if (SPOTS) return SPOTS;
  const arr = [];
  for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) if (!isPath(c, r)) {
    let n = 0; for (let d = 0; d < PATH_LEN; d += 10) { const p = posAt(d); if (Math.hypot(p.x - (c * CELL + 20), p.y - (r * CELL + 20)) <= 95) n++; }
    arr.push({ c, r, n });
  }
  SPOTS = arr.sort((a, b) => b.n - a.n); return SPOTS;
}
export function autoPlay(st) {
  const order = ['boog', 'ijs', 'kanon', 'boog', 'bliksem', 'magier', 'kanon', 'magier'];
  for (let k = 0; k < 8; k++) {
    const want = order[st.towers.length % order.length];
    const free = bestSpots().find((s) => canBuild(st, s.c, s.r));
    const upg = st.towers.filter((t) => t.lvl < 3 && upgradeCost(t.type, t.lvl) <= st.gold).sort((a, b) => upgradeCost(a.type, a.lvl) - upgradeCost(b.type, b.lvl))[0];
    if (free && st.gold >= TOWERS[want].cost && (st.towers.length < 4 + st.wave * 1.2 || !upg)) build(st, free.c, free.r, want);
    else if (upg) upgrade(st, upg);
    else break;
  }
}

// ---------------------------------------------------------------------------------------------
const E = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const clr = (e) => { while (e.firstChild) e.removeChild(e.firstChild); };
const addCss = (id, t) => { const s = document.createElement('style'); s.setAttribute('data-learn-g', id); s.textContent = t; document.head.appendChild(s); return s; };
const CSS = `
.to-root{position:relative;display:flex;flex-direction:column;gap:8px;width:100%;height:100%;min-height:460px;padding:8px;box-sizing:border-box;color:var(--ink);overflow:auto;font-size:calc(16px*var(--gfx-font,1))}
.to-root *{box-sizing:border-box}
.to-hud{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.to-chip{background:color-mix(in srgb,var(--card) 92%,transparent);border:1px solid var(--line);border-radius:14px;padding:6px 12px;font-weight:800;font-size:calc(16px*var(--gfx-font,1));white-space:nowrap;display:flex;align-items:center;gap:5px;min-height:44px}
.to-go{margin-left:auto;border:0;border-radius:14px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font:inherit;font-weight:900;font-size:calc(16px*var(--gfx-font,1));padding:8px 16px;min-height:48px;cursor:pointer;box-shadow:0 3px 10px #16a34a66}
.to-go[disabled]{opacity:.5;box-shadow:none}
.to-cv{width:100%;max-width:560px;align-self:center;aspect-ratio:9/8;border-radius:18px;border:3px solid color-mix(in srgb,var(--line) 70%,#000);touch-action:manipulation;display:block;background:#4d7c0f;box-shadow:0 8px 22px #0005}
.to-bar{min-height:76px;display:flex;gap:6px;align-items:stretch;justify-content:center;flex-wrap:wrap}
.to-tw{flex:1;min-width:calc(62px*var(--gfx-scale,1));max-width:100px;min-height:calc(70px*var(--gfx-scale,1));border:2px solid var(--line);background:color-mix(in srgb,var(--card) 94%,transparent);color:var(--ink);border-radius:14px;font:inherit;font-size:calc(12px*var(--gfx-font,1));padding:4px 2px;cursor:pointer;text-align:center;line-height:1.15;opacity:.62}
.to-tw .e{display:block;margin:0 auto}.to-tw b{display:block;font-size:calc(14px*var(--gfx-font,1))}
.to-tw.can{opacity:1;border-color:#22c55e;box-shadow:0 0 0 2px #22c55e44}
.to-hint{align-self:center;font-size:calc(14px*var(--gfx-font,1));text-align:center;background:color-mix(in srgb,var(--card) 90%,transparent);border-radius:12px;padding:6px 10px;display:flex;gap:6px;align-items:center;justify-content:center}
.to-q{flex:1;min-height:170px;background:color-mix(in srgb,var(--card) 93%,transparent);border:1px solid var(--line);border-radius:18px;padding:8px;overflow:auto}
.to-ov{position:absolute;inset:0;background:color-mix(in srgb,var(--card) 88%,transparent);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;padding:20px;z-index:40}
.to-ov h2{margin:0;font-size:calc(30px*var(--gfx-font,1))}.to-ov p{margin:0;max-width:340px;opacity:.9;line-height:1.4}
.to-btn{border:0;background:linear-gradient(135deg,#10b981,#059669);color:#fff;border-radius:18px;font:inherit;font-weight:900;font-size:calc(19px*var(--gfx-font,1));padding:14px 28px;min-height:54px;cursor:pointer;box-shadow:0 6px 16px #05966966}
.to-btn.alt{background:linear-gradient(135deg,#f59e0b,#dc2626);box-shadow:0 6px 16px #dc262666}
`;

export default {
  id: 'toren', name: 'Torenverdediging', emoji: '🏰', color: '#10b981',
  desc: 'Goede antwoorden geven goud. Bouw en upgrade 9 soorten torens en versla 10 golven monsters, of speel eindeloos.',
  tags: ['verdedigen', 'strategie', 'solo', 'eindeloos'], minutes: 6, duo: false,
  create(host, env) {
    const style = addCss('toren', CSS);
    const fx = { startCash: Math.min(+((env.fx || {}).startCash) || 0, 5000), cashMult: clamp(+((env.fx || {}).cashMult) || 1, 0.5, 5), streakBonus: clamp(+((env.fx || {}).streakBonus) || 0, 0, 0.5), extraLives: Math.round(clamp(+((env.fx || {}).extraLives) || 0, 0, 5)), shield: 0, hints: Math.round(clamp(+((env.fx || {}).hints) || 0, 0, 5)) };
    let st = newTD({ level: env.level || 2, fx });
    const root = E('div', 'to-root'); host.appendChild(root);
    const bgw = attachWorld(root, env, 'toren'); const fl = fxLayer(root, env);
    const world = bgw.world, pal = palette(world);
    // landschap: vaste plekken voor wereld-decoratie naast het pad
    const scenery = (() => {
      let a = 7; for (const ch of world.id) a = (a * 31 + ch.charCodeAt(0)) | 0;
      const r = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      const names = (world.deco && world.deco.length ? world.deco : ['tree', 'flower']), out = [], used = new Set();
      for (let k = 0; k < 14 && out.length < 8; k++) { const c = Math.floor(r() * COLS), rr = Math.floor(r() * ROWS), key = c + ',' + rr; if (isPath(c, rr) || used.has(key)) continue; used.add(key); out.push({ c, r: rr, n: names[Math.floor(r() * names.length)], s: 26 + r() * 10 }); }
      return out;
    })();
    let dead = false, ended = false, cur = null, started = false, raf = 0, last = 0, nQ = 0, sel = null, queue = [], endTimer = 0, endless = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };

    const hud = E('div', 'to-hud');
    const cLives = E('div', 'to-chip'), cWave = E('div', 'to-chip'), cGold = E('div', 'to-chip'), go = E('button', 'to-go', 'Start'); go.type = 'button';
    hud.append(cLives, cWave, cGold, go, gearBtn());
    const cv = E('canvas', 'to-cv');
    const dpr = Math.min(2, Math.max(1, (globalThis.devicePixelRatio || 1)) * (((env.gfx && env.gfx.q) === 0) ? 1 : 1.25));
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const ctx = cv.getContext('2d');
    const bar = E('div', 'to-bar');
    const qhost = E('div', 'to-q');
    root.append(hud, cv, bar, qhost);

    function toRoot(x, y) {
      try { const a = cv.getBoundingClientRect(), b = root.getBoundingClientRect(), k = (a.width || W) / W; return [a.left - b.left + x * k, a.top - b.top + y * k]; } catch (e) { return [x, y]; }
    }
    const setChip = (el, ico, txt) => { clr(el); el.append(iel(ico, 26), E('span', '', txt)); };

    go.addEventListener('click', () => { if (started && st.phase === 'build') { st.countdown = 0; env.snd.play('klik'); } });
    cv.addEventListener('pointerdown', (e) => {
      if (!started || ended) return;
      const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) / (r.width || W) * W, y = (e.clientY - r.top) / (r.height || H) * H;
      const c = Math.floor(x / CELL), rr = Math.floor(y / CELL);
      const t = st.towers.find((o) => o.c === c && o.r === rr);
      sel = t ? { t } : canBuild(st, c, rr) ? { c, r: rr } : null; env.snd.play('klik'); drawBar();
    });

    let barBtns = [];
    function drawBar() {
      clr(bar); barBtns = [];
      if (sel && sel.t && !st.towers.includes(sel.t)) sel = null;
      if (!sel) { const h = E('div', 'to-hint', 'Tik op een leeg vak om een toren te bouwen, of op een toren om hem te verbeteren.'); bar.appendChild(h); return; }
      if (sel.t) {
        const t = sel.t, B = TOWERS[t.type], uc = upgradeCost(t.type, t.lvl);
        const info = E('div', 'to-hint'); info.style.flexBasis = '100%'; info.append(iel(B.icon, 30), E('span', '', B.name + ' niv. ' + t.lvl + ' · ' + B.info));
        const up = E('button', 'to-tw' + (uc != null && st.gold >= uc ? ' can' : ''), ''); up.type = 'button'; up.append(iel('star', 34, 'e'), E('b', '', uc == null ? 'MAX' : 'Upgrade $' + uc));
        up.addEventListener('click', () => { if (upgrade(st, t)) { env.snd.play('power'); const [x, y] = toRoot(t.x, t.y); fl.burst(x, y, 'sparkle', 14); } drawBar(); });
        const sl = E('button', 'to-tw can', ''); sl.type = 'button'; sl.append(iel('bag', 34, 'e'), E('b', '', 'Verkoop $' + Math.round(t.spent * 0.6)));
        sl.addEventListener('click', () => { sell(st, t); sel = null; env.snd.play('munt'); drawBar(); });
        bar.append(info, up, sl); barBtns.push({ el: up, cost: () => { const c = upgradeCost(t.type, t.lvl); return c == null ? Infinity : c; } }); return;
      }
      for (const id of TOWER_IDS) {
        const B = TOWERS[id]; const b = E('button', 'to-tw' + (st.gold >= B.cost ? ' can' : ''), ''); b.type = 'button'; b.title = B.name + ': ' + B.info;
        b.append(iel(B.icon, 36, 'e'), E('b', '', '$' + B.cost));
        b.addEventListener('click', () => { const t = build(st, sel.c, sel.r, id); if (t) { env.snd.play('power'); sel = { t }; const [x, y] = toRoot(t.x, t.y); fl.burst(x, y, 'sparkle', 12); } else env.snd.play('fout'); drawBar(); });
        bar.appendChild(b); barBtns.push({ el: b, cost: () => B.cost });
      }
    }

    let hk = '';
    function hudUpdate() {
      const k = st.lives + '|' + st.wave + '|' + Math.floor(st.gold) + '|' + st.phase + '|' + Math.ceil(st.countdown);
      if (k === hk) return; hk = k;
      setChip(cLives, 'heart', String(st.lives)); setChip(cWave, 'flag', endless ? String(Math.max(1, st.wave)) + ' (eindeloos)' : Math.max(1, st.wave) + '/' + WAVES); setChip(cGold, 'coin', String(Math.floor(st.gold)));
      go.disabled = st.phase !== 'build'; go.textContent = st.phase === 'build' ? (st.wave === 0 ? 'Start (' + Math.ceil(st.countdown) + ')' : 'Golf ' + (st.wave + 1) + ' (' + Math.ceil(st.countdown) + ')') : 'Bezig...';
    }

    // ---- tekenen
    const qq = () => (env.gfx && env.gfx.q != null ? env.gfx.q : 1);
    function draw() {
      const q = qq();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) { ctx.fillStyle = (c + r) % 2 ? pal.a : pal.b; ctx.fillRect(c * CELL, r * CELL, CELL, CELL); }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); PTS.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.strokeStyle = pal.pathEdge; ctx.lineWidth = 34; ctx.stroke(); ctx.strokeStyle = pal.path; ctx.lineWidth = 28; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 14; ctx.stroke();
      for (const sc of scenery) di(ctx, sc.n, sc.c * CELL + 20, sc.r * CELL + 20, sc.s, { q });
      di(ctx, 'castle', 7 * CELL + 20, H - 17, 40, { q });
      if (sel && !sel.t) { ctx.fillStyle = '#ffffff77'; ctx.fillRect(sel.c * CELL, sel.r * CELL, CELL, CELL); }
      if (sel && sel.t) { const s = towerStat(sel.t.type, sel.t.lvl); ctx.beginPath(); ctx.arc(sel.t.x, sel.t.y, s.range, 0, 6.2832); ctx.fillStyle = '#ffffff25'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); }
      const ts = st.t;
      for (const t of st.towers) {
        const B = TOWERS[t.type];
        if (B.support) { const s = towerStat(t.type, t.lvl); ctx.beginPath(); ctx.arc(t.x, t.y, s.range, 0, 6.2832); ctx.strokeStyle = hexA(B.color, 0.35 + 0.15 * Math.sin(ts * 3)); ctx.lineWidth = 1.5; ctx.stroke(); if (q > 0) glow(ctx, t.x, t.y, 26, B.color, 0.35); }
        ctx.beginPath(); ctx.ellipse(t.x, t.y + 14, 16, 6, 0, 0, 6.2832); ctx.fillStyle = '#0004'; ctx.fill();
        ctx.beginPath(); ctx.arc(t.x, t.y + 3, 15, 0, 6.2832); ctx.fillStyle = t.flash > 0 ? '#fff' : '#334155'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = B.color; ctx.stroke();
        di(ctx, B.icon, t.x, t.y - 4 - (t.flash > 0 ? 2 : 0), 36, { q, shadow: false });
        for (let i = 0; i < t.lvl; i++) { ctx.beginPath(); ctx.arc(t.x - (t.lvl - 1) * 4 + i * 8, t.y + 18, 2.8, 0, 6.2832); ctx.fillStyle = '#fde047'; ctx.fill(); }
      }
      for (const m of st.mons) {
        const bob = Math.sin(ts * 9 + m.id) * 1.8, def = MONSTERS[m.type], S = m.r * 3;
        ctx.globalAlpha = m.hurt > 0 ? 0.6 : 1; di(ctx, def.icon, m.x, m.y + bob - 2, S, { q }); ctx.globalAlpha = 1;
        if (m.slow > 0) { ctx.beginPath(); ctx.arc(m.x, m.y, m.r + 3, 0, 6.2832); ctx.strokeStyle = '#67e8f9'; ctx.lineWidth = 2; ctx.stroke(); }
        if (m.burn > 0 && q > 0) glow(ctx, m.x, m.y, m.r * 1.6, '#fb923c', 0.5);
        const w = m.r * 2.2; ctx.fillStyle = '#0006'; ctx.fillRect(m.x - w / 2, m.y - m.r - 12, w, 5); ctx.fillStyle = m.hp / m.max > 0.5 ? '#22c55e' : m.hp / m.max > 0.25 ? '#eab308' : '#ef4444'; ctx.fillRect(m.x - w / 2, m.y - m.r - 12, w * Math.max(0, m.hp / m.max), 5);
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const e of st.ev) {
        if (e.k === 'kill') { if (!e.seen) { e.seen = true; const [x, y] = toRoot(e.x, e.y); fl.burst(x, y, e.big ? 'stars' : 'sparkle', e.big ? 18 : 6); if (e.big) fl.burst(x, y, 'coins', 5); } continue; }
        const a = Math.max(0, e.life / e.max); ctx.globalAlpha = a;
        if (e.k === 'line') { ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2); ctx.strokeStyle = e.c; ctx.lineWidth = e.w; ctx.stroke(); if (q > 0) glow(ctx, e.x2, e.y2, 12, e.c, 0.5); }
        else if (e.k === 'ring') { ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (1.2 - a * 0.4), 0, 6.2832); ctx.fillStyle = e.c + '55'; ctx.fill(); }
        else if (e.k === 'txt') { ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = e.c; ctx.strokeStyle = '#0008'; ctx.lineWidth = 3; ctx.strokeText(e.s, e.x, e.y - (1 - a) * 22); ctx.fillText(e.s, e.x, e.y - (1 - a) * 22); }
        else if (e.k === 'flash') { ctx.fillStyle = e.c + '55'; ctx.fillRect(0, 0, W, H); }
        ctx.globalAlpha = 1;
      }
      if (st.phase === 'build' && (endless || st.wave < WAVES)) { ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0008'; ctx.lineWidth = 3; const tx = 'Golf ' + (st.wave + 1) + ' komt over ' + Math.ceil(st.countdown) + ' s'; ctx.strokeText(tx, W / 2, 12); ctx.fillText(tx, W / 2, 12); }
    }

    // ---- vragen
    function takeQ() {
      if (!queue.length) { try { queue = env.pick(12) || []; } catch (e) { queue = []; } }
      return queue.shift() || { t: 'num', q: 'Wat is ' + (3 + (nQ % 6)) + ' + ' + (2 + (nQ % 4)) + '?', a: 5 + (nQ % 6) + (nQ % 4) };
    }
    function nextQuestion() {
      if (dead || ended) return;
      const q = takeQ(); nQ++; clr(qhost);
      try { cur = env.ask(qhost, q, { compact: true, feedback: true, autoNext: 700, hints: fx.hints, time: env.level === 3 ? 25 : 0, label: 'Goud verdienen' }); } catch (e) { cur = { promise: Promise.resolve({ ok: false, ms: 0 }), cancel() {} }; }
      const h = cur;
      h.promise.then((r) => {
        if (dead || ended || cur !== h) return; cur = null; r = r || {};
        try { env.report({ q, ok: !!r.ok, ms: r.ms || 0 }); } catch (e) { /* hub */ }
        const res = answer(st, !!r.ok, r.ms || 9999, fx);
        env.snd.play(r.ok ? 'munt' : 'fout'); if (res.strike) env.snd.play('power');
        if (r.ok) { fl.burstEl(cGold, 'coins', 5); if (res.strike) { const [x, y] = toRoot(W / 2, H / 2); fl.burst(x, y, 'confetti', 30); } }
        drawBar(); later(nextQuestion, 40);
      }).catch(() => { if (!dead && !ended && cur === h) { cur = null; later(nextQuestion, 300); } });
    }

    function loop() {
      raf = 0; if (dead) return;
      if (host.isConnected === false) { later(loop, 500); last = performance.now(); return; }
      const now = performance.now(); let dt = clamp((now - last) / 1000, 0, 0.1); last = now;
      if (started && !ended) { let rest = dt; while (rest > 0) { const s = Math.min(rest, 1 / 30); step(st, s); rest -= s; } hudUpdate(); if (st.phase === 'won' || st.phase === 'lost') finish(); }
      draw(); raf = requestAnimationFrame(loop);
    }
    let barTick = 0;
    function finish() {
      if (ended) return; ended = true;
      if (cur) { try { cur.cancel(); } catch (e) { /* */ } cur = null; }
      const won = st.phase === 'won';
      const ov = E('div', 'to-ov'); const big = E('div', 'big'); big.appendChild(iel(won ? 'trophy' : endless ? 'medal' : 'skull', 96));
      ov.append(big, E('h2', '', won ? 'Kasteel gered!' : endless ? 'Golf ' + st.wave + ' bereikt!' : 'Het kasteel valt'), E('p', '', won ? 'Alle 10 golven verslagen.' : 'Je haalde golf ' + st.wave + (endless ? '' : ' van ' + WAVES) + '.'));
      root.appendChild(ov); env.snd.play(won || (endless && st.wave >= 8) ? 'win' : 'lose');
      fl.burst((root.clientWidth || 360) / 2, 150, won ? 'confetti' : 'smoke', won ? 60 : 12);
      const score = st.wave * 100 + st.kills * 3 + st.lives * 15 + (won ? 300 : 0);
      endTimer = later(() => env.end({ score, win: endless ? null : won, stats: { correct: st.correct, wrong: st.wrong, 'beste reeks': st.best, golf: st.wave, torens: st.towers.length, monsters: st.kills }, summary: (endless ? 'Eindeloos: golf ' + st.wave + ' bereikt' : won ? 'Gewonnen met ' + st.lives + ' levens over' : 'Verslagen in golf ' + st.wave) + ' · ' + st.kills + ' monsters, ' + st.correct + ' goede antwoorden.' }), 1800);
    }
    function start(m) {
      if (started) return; started = true; endless = m === 'eindeloos';
      if (endless) { st = newTD({ level: env.level || 2, fx, endless: true }); }
      last = performance.now(); drawBar(); nextQuestion();
      barTick = setInterval(() => { if (!dead && !ended) for (const o of barBtns) o.el.className = 'to-tw' + (st.gold >= o.cost() ? ' can' : ''); }, 500);
    }

    const intro = E('div', 'to-ov');
    const mk = (txt, cls, m) => { const b = E('button', 'to-btn ' + cls, txt); b.type = 'button'; b.addEventListener('click', () => { intro.remove(); start(m); }); return b; };
    const bigI = E('div', 'big'); bigI.appendChild(iel('castle', 96));
    intro.append(bigI, E('h2', '', 'Torenverdediging'), E('p', '', 'Beantwoord vragen om goud te verdienen en bouw torens langs het pad. Houd de monsters tegen!'), mk('Tik om te beginnen (10 golven)', '', 'campagne'), mk('Eindeloos: hoe ver kom je?', 'alt', 'eindeloos'));
    root.appendChild(intro);
    drawBar(); hudUpdate(); last = performance.now(); raf = requestAnimationFrame(loop);

    return {
      destroy() {
        dead = true; if (raf) cancelAnimationFrame(raf); if (barTick) clearInterval(barTick);
        timers.forEach((t) => clearTimeout(t)); timers.clear();
        if (cur) { try { cur.cancel(); } catch (e) { /* */ } cur = null; }
        fl.destroy(); bgw.destroy(); root.remove(); style.remove();
      },
    };
  },
};
