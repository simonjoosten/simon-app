// Baasgevecht – jij en 3 bots tegen een eindbaas. Elk goed antwoord = aanval. Drie fases, zwakke plekken, potions, upgrades.
// Pure spellogica (Boss) is los exporteerbaar voor bot-simulaties.

import { attachWorld, fxLayer, gearBtn, iel, di, glow, softShadow, worldOf } from './_gxa.js?v=1';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const BOSSES = [
  { name: 'Vuurdraak Fenix', emoji: '🐲', icon: 'dragon', color: '#ef4444', bg: ['#450a0a', '#7c2d12'] },
  { name: 'Kraken Karel', emoji: '🦑', icon: 'octopus', color: '#6366f1', bg: ['#0c1a4a', '#155e75'] },
  { name: 'Robot-reus Rex', emoji: '🤖', icon: 'robot', color: '#64748b', bg: ['#1e293b', '#334155'] },
  { name: 'Trol Tobbe', emoji: '🧌', icon: 'ghost', color: '#16a34a', bg: ['#052e16', '#365314'] },
  { name: 'Ruimtemonster Zog', emoji: '👾', icon: 'alien', color: '#a855f7', bg: ['#1e1b4b', '#581c87'] },
  { name: 'Dino Rex', emoji: '🦖', icon: 'dino', color: '#f59e0b', bg: ['#422006', '#713f12'] },
  // ---- nieuw: 4 baassoorten met eigen eigenschap
  { name: 'Haai Hugo', emoji: '🦈', icon: 'shark', color: '#0ea5e9', bg: ['#082f49', '#0c4a6e'], trait: 'snel', info: 'Valt sneller aan' },
  { name: 'Tovenaar Zoltar', emoji: '🧙', icon: 'wizard', color: '#d946ef', bg: ['#2e1065', '#701a75'], trait: 'schild', info: 'Zet af en toe een toverschild op' },
  { name: 'IJsbeer Bruno', emoji: '🐻‍❄️', icon: 'bear', color: '#7dd3fc', bg: ['#0c4a6e', '#bae6fd'], trait: 'taai', hpMul: 1.15, atkMul: 0.9, info: 'Heel taai, maar slaat zachter' },
  { name: 'Reuzenkrab Kees', emoji: '🦀', icon: 'crab', color: '#f97316', bg: ['#431407', '#9a3412'], trait: 'harnas', info: 'Harnas: pak hem op zijn zwakke plek' },
];
export const SHOP = [
  { id: 'dmg', name: 'Zwaard', icon: 'sword', emoji: '⚔️', desc: 'Meer schade per aanval', cost: [40, 100, 220, 450, 900] },
  { id: 'hp', name: 'Harnas', icon: 'heart', emoji: '❤️', desc: 'Meer levens voor het hele team', cost: [45, 115, 260, 520, 1000] },
  { id: 'block', name: 'Schild', icon: 'shield', emoji: '🛡️', desc: 'Jij krijgt minder schade', cost: [60, 160, 380, 800] },
  { id: 'crit', name: 'Kritiek', icon: 'target', emoji: '🎯', desc: 'Kans op een dubbele klap', cost: [50, 140, 320, 700] },
  { id: 'team', name: 'Training', icon: 'medal', emoji: '🤝', desc: 'Je teamgenoten slaan harder', cost: [70, 200, 480, 1000] },
  { id: 'potion', name: 'Toverdrank', icon: 'potion', emoji: '🧪', desc: 'Geneest iedereen 40% (en wekt wakker)', cost: null, price: 55 },
  // ---- nieuw: twee eenmalige wapens
  { id: 'bom', name: 'Bom', icon: 'bomb', emoji: '💣', desc: 'Een enorme klap op de baas', cost: null, price: 90 },
  { id: 'vries', name: 'Vriezer', icon: 'snowflake', emoji: '❄️', desc: 'De baas valt 6 seconden niet aan', cost: null, price: 70 },
];
const BOTS = [['Mila', '🧙', 'wizard'], ['Daan', '🥷', 'fox'], ['Fleur', '🧝', 'fairy'], ['Bo', '🧛', 'owl'], ['Kay', '🦸', 'lion'], ['Noor', '🧚', 'mermaid']];
export const RUSH_BOSSES = 3;

export const bossHp = (b, level, rush) => Math.round(4800 * (b.hpMul || 1) * (rush ? 0.55 : 1) * [0.8, 1, 1.25][level - 1]);
export function newBoss(opts = {}) {
  const rand = opts.rand || Math.random, level = clamp(opts.level || 2, 1, 3), fx = opts.fx || {};
  const rush = !!opts.rush;
  const b = BOSSES[opts.boss != null ? opts.boss % BOSSES.length : Math.floor(rand() * BOSSES.length)];
  const hp = bossHp(b, level, rush);
  const names = BOTS.slice().sort(() => rand() - 0.5).slice(0, 3);
  const acc = [0.55, 0.7, 0.8][level - 1];
  const team = [{ id: 0, me: true, name: opts.name || 'Jij', emoji: '😎', icon: 'astronaut', hp: 110, max: 110, ko: false, dmg: 0 }];
  names.forEach(([n, e, ic], i) => team.push({ id: i + 1, name: n, emoji: e, icon: ic, hp: 100, max: 100, ko: false, bot: true, acc: clamp(acc + (rand() - 0.5) * 0.12, 0.3, 0.92), think: [7.5, 6.2, 5][level - 1] * (0.85 + rand() * 0.3), timer: 2 + rand() * 3, dmg: 0 }));
  return {
    rand, level, fx, boss: { ...b, hp, max: hp, phase: 1, atk: null, atkT: 4, shake: 0, shieldT: 0, shieldIn: 16 }, team, coins: (fx.startCash || 0) * 0.2, up: { dmg: 0, hp: 0, block: 0, crit: 0, team: 0 }, potions: 0, rush: rush, bossNo: 1, bossTotal: rush ? RUSH_BOSSES : 1, used: [BOSSES.indexOf(b)], bombs: 0, freezes: 0, totalDmg: 0,
    t: 0, streak: 0, best: 0, correct: 0, wrong: 0, revives: 0, sinceRevive: 0, weak: { t: 12 + rand() * 6, active: 0 }, ev: [], noFx: !!opts.noFx, phase: 'fight', shieldFx: fx.shield || 0, crits: 0, spent: 0,
  };
}
const ev = (st, e) => { if (st.noFx) return; if (st.ev.length > 60) st.ev.shift(); st.ev.push(e); };
export const me = (st) => st.team[0];
export const alive = (st) => st.team.filter((m) => !m.ko);
export function upCost(st, id) { const u = SHOP.find((x) => x.id === id); if (!u) return null; if (u.price) return u.price; const l = st.up[id]; return l >= u.cost.length ? null : u.cost[l]; }
export function buy(st, id) {
  const c = upCost(st, id); if (c == null || st.coins < c) return false;
  st.coins -= c; st.spent += c;
  if (id === 'potion') { st.potions++; usePotion(st); return true; }
  if (id === 'bom') { st.bombs++; damageBoss(st, 420 * (1 + 0.25 * st.up.dmg), me(st), true, true); return true; }
  if (id === 'vries') { st.freezes++; const b = st.boss; if (b.atk) b.atk.t += 4; b.atkT += 6; ev(st, { k: 'phase', life: 1.2, max: 1.2, s: 'Bevroren!' }); return true; }
  st.up[id]++;
  if (id === 'hp') for (const m of st.team) { const add = m.me ? 22 : 16; m.max += add; if (!m.ko) m.hp += add; }
  return true;
}
// baas-rush: volgende baas, team knapt een beetje op
export function nextBoss(st) {
  const pool = BOSSES.map((_, i) => i).filter((i) => !st.used.includes(i)); const i = pool[Math.floor(st.rand() * pool.length)]; const b = BOSSES[i];
  st.used.push(i); st.bossNo++; const hp = bossHp(b, st.level, true);
  st.boss = { ...b, hp, max: hp, phase: 1, atk: null, atkT: 5, shake: 0, shieldT: 0, shieldIn: 16 };
  st.weak = { t: 10 + st.rand() * 5, active: 0 };
  for (const m of st.team) { if (m.ko) { m.ko = false; m.hp = m.max * 0.3; } else m.hp = Math.min(m.max, m.hp + m.max * 0.35); }
  st.coins += 40; ev(st, { k: 'phase', life: 2, max: 2, s: 'Baas ' + st.bossNo + ': ' + b.name });
}
function usePotion(st) {
  for (const m of st.team) { if (m.ko) { m.ko = false; m.hp = m.max * 0.3; } else m.hp = Math.min(m.max, m.hp + m.max * 0.4); }
  ev(st, { k: 'heal', life: 0.8, max: 0.8 });
}
function damageBoss(st, d, who, crit, raw) {
  const b = st.boss;
  if (!raw) { if (b.shieldT > 0) d *= 0.5; if (b.trait === 'harnas' && !st._pierce) d *= 0.78; }
  d = Math.round(d); b.hp = Math.max(0, b.hp - d); b.shake = 0.18; if (who) who.dmg += d; st.totalDmg += d;
  ev(st, { k: 'num', s: (crit ? '💥' : '') + d, c: crit ? '#fde047' : who && who.me ? '#fff' : '#cbd5e1', x: 130 + st.rand() * 100, y: 80 + st.rand() * 30, life: 0.9, max: 0.9 });
  if (b.hp <= 0) { if (st.rush && st.bossNo < st.bossTotal) nextBoss(st); else st.phase = 'won'; }
  else { const f = b.hp / b.max; const ph = f > 0.66 ? 1 : f > 0.33 ? 2 : 3; if (ph !== b.phase) { b.phase = ph; ev(st, { k: 'phase', life: 1.6, max: 1.6, s: ph === 2 ? 'Fase 2: aardbeving!' : 'Fase 3: WOEDE!' }); } }
}
// jouw antwoord
export function playerAnswer(st, ok, ms) {
  const f = st.fx;
  const m = me(st);
  if (!ok) {
    st.streak = 0; st.wrong++;
    if (st.shieldFx > 0) { st.shieldFx--; return { dmg: 0, shielded: true }; }
    if (!m.ko) hurt(st, m, 6, true);
    return { dmg: 0 };
  }
  st.streak++; st.best = Math.max(st.best, st.streak); st.correct++;
  if (m.ko) { m.ko = false; m.hp = m.max * 0.25; st.revives++; return { dmg: 0, revived: true }; }
  let d = 30 * (1 + 0.5 * st.up.dmg) * (1 + Math.min(st.streak, 10) * (0.07 + (f.streakBonus || 0)));
  if (ms < 5000) d *= 1.12;
  const crit = st.rand() < 0.08 + 0.07 * st.up.crit + (f.luck || 0) * 0.1; if (crit) { d *= 2.2; st.crits++; }
  let weak = false; if (st.weak.active > 0) { d *= 2.5; weak = true; st.weak.active = 0; st.weak.t = 14 + st.rand() * 6; }
  st._pierce = weak; damageBoss(st, d, m, crit); st._pierce = false;
  const c = Math.round((10 + d / 8) * (f.cashMult || 1)); st.coins += c;
  m.hp = Math.min(m.max, m.hp + 3);
  st.sinceRevive++;
  let revived = null;
  if (st.sinceRevive >= 3) { const ko = st.team.find((x) => x.ko); if (ko) { ko.ko = false; ko.hp = ko.max * 0.4; st.sinceRevive = 0; st.revives++; revived = ko; } }
  return { dmg: Math.round(d), crit, weak, coins: c, revived };
}
function hurt(st, m, d, quiet) {
  if (m.ko) return;
  if (m.me) d *= 1 - 0.12 * st.up.block;
  d = Math.round(d); m.hp -= d;
  ev(st, { k: 'hurt', id: m.id, s: '-' + d, life: 0.7, max: 0.7 });
  if (m.hp <= 0) { m.hp = 0; m.ko = true; ev(st, { k: 'ko', id: m.id, life: 1, max: 1 }); }
}
export function step(st, dt) {
  if (st.phase !== 'fight') return;
  st.t += dt;
  for (const e of st.ev) e.life -= dt; if (st.ev.length) st.ev = st.ev.filter((e) => e.life > 0);
  const b = st.boss; if (b.shake > 0) b.shake -= dt;
  if (b.trait === 'schild') { if (b.shieldT > 0) b.shieldT -= dt; else { b.shieldIn -= dt; if (b.shieldIn <= 0) { b.shieldT = 4; b.shieldIn = 18; ev(st, { k: 'phase', life: 1.2, max: 1.2, s: 'Toverschild! Schade gehalveerd' }); } } }
  if (st.weak.active > 0) { st.weak.active -= dt; if (st.weak.active <= 0) st.weak.t = 12 + st.rand() * 6; }
  else { st.weak.t -= dt; if (st.weak.t <= 0) { st.weak.active = 6; ev(st, { k: 'phase', life: 1.2, max: 1.2, s: '⭐ Zwakke plek! Antwoord nu!' }); } }
  // teamgenoten
  for (const m of st.team) {
    if (!m.bot || m.ko) continue;
    m.timer -= dt;
    if (m.timer <= 0) {
      m.timer += m.think * (0.8 + st.rand() * 0.4);
      if (st.rand() < m.acc) { damageBoss(st, 22 * (1 + 0.3 * st.up.team) * (0.9 + st.rand() * 0.3), m, false); st.coins += 4; }
    }
  }
  // baas
  const enr = st.t > 300 ? 1 + (st.t - 300) / 40 : 1;
  const A = (25 + st.level * 5) * enr * (st.boss.atkMul || 1);
  if (b.atk) {
    b.atk.t -= dt;
    if (b.atk.t <= 0) {
      const a = b.atk; b.atk = null;
      for (const id of a.ids) { const m = st.team[id]; hurt(st, m, a.dmg); }
      ev(st, { k: 'slam', life: 0.4, max: 0.4 });
      b.atkT = [5.2, 4.3, 3.2][b.phase - 1] / Math.min(2, enr) * (b.trait === 'snel' ? 0.78 : 1);
    }
  } else {
    b.atkT -= dt;
    if (b.atkT <= 0) {
      const al = alive(st); if (!al.length) { st.phase = 'lost'; return; }
      const aoe = b.phase === 2 || (b.phase === 3 && st.rand() < 0.5);
      if (aoe) b.atk = { t: 1.3, ids: al.map((m) => m.id), dmg: A * (b.phase === 3 ? 0.7 : 0.6), aoe: true };
      else { const t = al[Math.floor(st.rand() * al.length)]; b.atk = { t: 1.3, ids: [t.id], dmg: A * (b.phase === 3 ? 1.5 : 1.3), aoe: false }; }
    }
  }
  if (!alive(st).length) st.phase = 'lost';
}
// bot-koop (voor simulatie)
export function autoBuy(st) {
  for (let k = 0; k < 6; k++) {
    const avg = st.team.reduce((s, m) => s + (m.ko ? 0 : m.hp / m.max), 0) / st.team.length;
    if ((avg < 0.55 || st.team.some((m) => m.ko)) && st.coins >= 55) { buy(st, 'potion'); continue; }
    let best = null, bc = Infinity;
    for (const u of SHOP) { if (u.price) continue; const c = upCost(st, u.id); if (c != null && c <= st.coins && c < bc) { best = u.id; bc = c; } }
    if (!best || st.coins < bc) break; buy(st, best);
  }
}

// ---------------------------------------------------------------------------------------------
const E = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const clr = (e) => { while (e.firstChild) e.removeChild(e.firstChild); };
const addCss = (id, t) => { const s = document.createElement('style'); s.setAttribute('data-learn-g', id); s.textContent = t; document.head.appendChild(s); return s; };
const CW = 360, CH = 270;
const CSS = `
.ba-root{position:relative;display:flex;flex-direction:column;gap:8px;width:100%;height:100%;min-height:460px;padding:8px;box-sizing:border-box;color:var(--ink);overflow:auto;font-size:calc(16px*var(--gfx-font,1))}
.ba-root *{box-sizing:border-box}
.ba-cv{width:100%;max-width:560px;align-self:center;aspect-ratio:${CW}/${CH};border-radius:18px;border:3px solid color-mix(in srgb,var(--line) 70%,#000);display:block;background:transparent;box-shadow:0 8px 22px #0005}
.ba-row{display:flex;gap:6px;align-items:center}
.ba-shop{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.ba-up{border:2px solid var(--line);background:color-mix(in srgb,var(--card) 94%,transparent);color:var(--ink);border-radius:14px;padding:5px 2px;font:inherit;font-size:calc(12px*var(--gfx-font,1));text-align:center;cursor:pointer;opacity:.65;line-height:1.1;min-height:calc(76px*var(--gfx-scale,1))}
.ba-up .e{display:block;margin:0 auto}.ba-up b{display:block;font-size:calc(12px*var(--gfx-font,1))}.ba-up .c{font-weight:900;font-size:calc(14px*var(--gfx-font,1));display:block}
.ba-up.can{opacity:1;border-color:#22c55e;box-shadow:0 0 0 2px #22c55e44}
.ba-coins{font-weight:900;font-size:calc(17px*var(--gfx-font,1));padding:6px 12px;background:color-mix(in srgb,var(--card) 92%,transparent);border:1px solid var(--line);border-radius:14px;display:flex;gap:6px;align-items:center;min-height:44px}
.ba-info{flex:1;font-size:calc(13px*var(--gfx-font,1));background:color-mix(in srgb,var(--card) 90%,transparent);border-radius:12px;padding:6px 10px;border:1px solid var(--line);display:flex;gap:6px;align-items:center;min-height:44px}
.ba-q{flex:1;min-height:170px;background:color-mix(in srgb,var(--card) 93%,transparent);border:1px solid var(--line);border-radius:18px;padding:8px;overflow:auto}
.ba-ov{position:absolute;inset:0;background:color-mix(in srgb,var(--card) 88%,transparent);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;padding:20px;z-index:40}
.ba-ov h2{margin:0;font-size:calc(30px*var(--gfx-font,1))}.ba-ov p{margin:0;max-width:340px;opacity:.9;line-height:1.4}
.ba-btn{border:0;background:linear-gradient(135deg,#ef4444,#f97316);color:#fff;border-radius:18px;font:inherit;font-weight:900;font-size:calc(19px*var(--gfx-font,1));padding:14px 28px;min-height:54px;cursor:pointer;box-shadow:0 6px 16px #ef444466}
.ba-btn.alt{background:linear-gradient(135deg,#8b5cf6,#ec4899);box-shadow:0 6px 16px #8b5cf666}
`;

export default {
  id: 'baas', name: 'Baasgevecht', emoji: '🐲', color: '#ef4444',
  desc: 'Versla samen met je team een gigantische eindbaas (10 soorten). Elk goed antwoord is een aanval! Of kies baas-rush: 3 bazen na elkaar.',
  tags: ['team', 'actie', 'bots', 'baas-rush'], minutes: 4, duo: false,
  create(host, env) {
    const style = addCss('baas', CSS);
    const f0 = env.fx || {};
    const fx = { startCash: clamp(+f0.startCash || 0, 0, 5000), cashMult: clamp(+f0.cashMult || 1, 0.5, 5), streakBonus: clamp(+f0.streakBonus || 0, 0, 0.5), luck: clamp(+f0.luck || 0, 0, 1), shield: Math.round(clamp((+f0.shield || 0) + (+f0.extraLives || 0), 0, 6)), hints: Math.round(clamp(+f0.hints || 0, 0, 5)) };
    let st = newBoss({ level: env.level || 2, rand: env.rand, fx, name: env.name });
    const root = E('div', 'ba-root'); host.appendChild(root);
    const bgw = attachWorld(root, env, 'baas'); const fl = fxLayer(root, env);
    let dead = false, ended = false, cur = null, started = false, raf = 0, last = 0, nQ = 0, queue = [], shop = 0, seenEv = new Set(), lastBossNo = 1;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
    const cv = E('canvas', 'ba-cv'); const dpr = Math.min(2, Math.max(1, globalThis.devicePixelRatio || 1) * ((env.gfx && env.gfx.q === 0) ? 1 : 1.25)); cv.width = Math.round(CW * dpr); cv.height = Math.round(CH * dpr); const ctx = cv.getContext('2d');
    const q = () => (env.gfx && env.gfx.q != null ? env.gfx.q : 1);
    const coinsEl = E('div', 'ba-coins'); const infoEl = E('div', 'ba-info'); const row = E('div', 'ba-row'); row.append(coinsEl, infoEl, gearBtn());
    const shopEl = E('div', 'ba-shop'); const upEls = {};
    for (const u of SHOP) {
      const b = E('button', 'ba-up'); b.type = 'button'; b.title = u.desc; const c = E('span', 'c', ''); const nm = E('b', '', u.name);
      b.append(iel(u.icon, 36, 'e'), nm, c); b.addEventListener('click', () => { if (!started || ended) return; if (buy(st, u.id)) { env.snd.play('power'); fl.burstEl(b, 'sparkle', 12); } else env.snd.play('klik'); refreshShop(); });
      upEls[u.id] = { b, c, nm }; shopEl.appendChild(b);
    }
    const qhost = E('div', 'ba-q');
    root.append(cv, row, shopEl, qhost);
    let lastCoins = -1;
    function refreshShop() {
      const cn = Math.floor(st.coins);
      if (cn !== lastCoins) { lastCoins = cn; clr(coinsEl); coinsEl.append(iel('coin', 28), E('span', '', String(cn))); }
      const tx = st.rush ? 'Baas ' + st.bossNo + ' van ' + st.bossTotal : (st.boss.info || 'Eindbaas');
      if (infoEl.dataset.k !== tx) { infoEl.dataset.k = tx; clr(infoEl); infoEl.append(iel(st.boss.icon, 28), E('span', '', st.boss.name + ' · ' + tx)); }
      for (const u of SHOP) { const c = upCost(st, u.id), el = upEls[u.id]; el.c.textContent = c == null ? 'MAX' : String(c); el.nm.textContent = u.name + (!u.price ? ' ' + st.up[u.id] : ''); const cls = 'ba-up' + (c != null && st.coins >= c ? ' can' : ''); if (el.b.className !== cls) el.b.className = cls; }
    }
    const toRoot = (x, y) => { try { const a = cv.getBoundingClientRect(), b = root.getBoundingClientRect(), k = (a.width || CW) / CW; return [a.left - b.left + x * k, a.top - b.top + y * k]; } catch (e) { return [x, y]; } };

    // ---- tekenen
    function drawHpBar(x, y, w, h, f, col) { ctx.fillStyle = '#0009'; ctx.fillRect(x, y, w, h); ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp(f, 0, 1), h); ctx.strokeStyle = '#fff5'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h); }
    function teamPos(i) { return { x: 48 + i * 88, y: 216 }; }
    function draw() {
      const qq = q();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, CW, CH);
      const b = st.boss;
      // vloer + gloed in de kleur van de baas
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(0, 205, CW, 65);
      glow(ctx, 180, 110, 140 + (b.phase === 3 ? 20 : 0), b.color, b.phase === 3 ? 0.5 : 0.28);
      const phaseScale = b.phase === 3 ? 1.12 : 1; const bob = Math.sin(st.t * 2) * 4; const sh = b.shake > 0 ? (Math.random() - 0.5) * 8 : 0;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      softShadow(ctx, 180, 188, 70, 13, 0.4);
      ctx.save(); ctx.translate(180 + sh, 108 + bob); ctx.scale(phaseScale, phaseScale);
      if (b.phase === 3) { ctx.beginPath(); ctx.arc(0, 0, 66 + Math.sin(st.t * 8) * 3, 0, 6.2832); ctx.fillStyle = '#ef444433'; ctx.fill(); }
      if (b.shieldT > 0) { ctx.beginPath(); ctx.arc(0, 0, 78, 0, 6.2832); ctx.fillStyle = '#e879f933'; ctx.fill(); ctx.strokeStyle = '#f0abfc'; ctx.lineWidth = 3; ctx.stroke(); }
      ctx.globalAlpha = b.shake > 0 ? 0.7 : 1; di(ctx, b.icon, 0, 0, 150, { q: qq, shadow: false }); ctx.globalAlpha = 1;
      if (st.weak.active > 0) { const p = 1 + Math.sin(st.t * 12) * 0.2; di(ctx, 'star', 44, -30, 44 * p, { q: qq, shadow: false }); }
      ctx.restore();
      if (b.atk) {
        const a = b.atk; ctx.fillStyle = '#ef4444' + (Math.sin(st.t * 20) > 0 ? '66' : '33');
        for (const id of a.ids) { const p = teamPos(id); ctx.beginPath(); ctx.arc(p.x, p.y, 32, 0, 6.2832); ctx.fill(); }
        ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000a'; ctx.lineWidth = 3; const tx = a.aoe ? 'AANVAL OP IEDEREEN!' : st.team[a.ids[0]].name + ' wordt geraakt!'; ctx.strokeText(tx, 180, 194); ctx.fillText(tx, 180, 194);
      }
      st.team.forEach((m, i) => {
        const p = teamPos(i); const hop = m.ko ? 0 : Math.abs(Math.sin(st.t * 3 + i)) * 3;
        ctx.globalAlpha = m.ko ? 0.35 : 1; di(ctx, m.icon, p.x, p.y - hop - 4, 52, { q: qq }); ctx.globalAlpha = 1;
        if (m.ko) { ctx.font = '18px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('Zzz', p.x + 16, p.y - 26); }
        drawHpBar(p.x - 25, p.y + 24, 50, 7, m.hp / m.max, m.hp / m.max > 0.4 ? '#22c55e' : '#ef4444');
        ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = m.me ? '#fde047' : '#fff'; ctx.strokeStyle = '#000a'; ctx.lineWidth = 3; ctx.strokeText(m.name, p.x, p.y + 42); ctx.fillText(m.name, p.x, p.y + 42);
      });
      drawHpBar(10, 10, CW - 20, 16, b.hp / b.max, b.phase === 1 ? '#22c55e' : b.phase === 2 ? '#eab308' : '#ef4444');
      ctx.fillStyle = '#fff6'; ctx.fillRect(10 + (CW - 20) * 0.33, 10, 1.5, 16); ctx.fillRect(10 + (CW - 20) * 0.66, 10, 1.5, 16);
      ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000a'; ctx.lineWidth = 3; const bt = b.name + '  ' + Math.ceil(b.hp) + '/' + b.max; ctx.strokeText(bt, CW / 2, 18); ctx.fillText(bt, CW / 2, 18);
      for (const e of st.ev) {
        const a = Math.max(0, e.life / e.max);
        if (e.k === 'num') { ctx.globalAlpha = a; ctx.font = 'bold 21px sans-serif'; ctx.fillStyle = e.c; ctx.strokeStyle = '#000a'; ctx.lineWidth = 4; ctx.strokeText(e.s, e.x, e.y - (1 - a) * 30); ctx.fillText(e.s, e.x, e.y - (1 - a) * 30); ctx.globalAlpha = 1; if (!seenEv.has(e)) { seenEv.add(e); const [rx, ry] = toRoot(e.x, e.y); fl.burst(rx, ry, e.s.indexOf('💥') === 0 ? 'stars' : 'sparkle', e.s.indexOf('💥') === 0 ? 14 : 6); } }
        else if (e.k === 'hurt') { const p = teamPos(e.id); ctx.globalAlpha = a; ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = '#fca5a5'; ctx.fillText(e.s, p.x, p.y - 34 - (1 - a) * 20); ctx.globalAlpha = 1; }
        else if (e.k === 'slam') { ctx.fillStyle = '#ef444455'; ctx.globalAlpha = a; ctx.fillRect(0, 0, CW, CH); ctx.globalAlpha = 1; if (!seenEv.has(e)) { seenEv.add(e); const [rx, ry] = toRoot(180, 210); fl.burst(rx, ry, 'smoke', 8); } }
        else if (e.k === 'heal') { ctx.fillStyle = '#22c55e33'; ctx.globalAlpha = a; ctx.fillRect(0, 0, CW, CH); ctx.globalAlpha = 1; }
        else if (e.k === 'phase') { ctx.globalAlpha = Math.min(1, a * 2); ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.strokeText(e.s, 180, 52); ctx.fillText(e.s, 180, 52); ctx.globalAlpha = 1; }
      }
      if (seenEv.size > 200) seenEv = new Set([...seenEv].filter((e) => st.ev.includes(e)));
    }

    // ---- vragen
    function takeQ() {
      if (!queue.length) { try { queue = env.pick(12) || []; } catch (e) { queue = []; } }
      return queue.shift() || { t: 'num', q: 'Wat is ' + (3 + (nQ % 6)) + ' + ' + (2 + (nQ % 4)) + '?', a: 5 + (nQ % 6) + (nQ % 4) };
    }
    function nextQuestion() {
      if (dead || ended) return;
      const qq = takeQ(); nQ++; clr(qhost);
      try { cur = env.ask(qhost, qq, { compact: true, feedback: true, autoNext: 650, hints: fx.hints, time: env.level === 3 ? 25 : 0, label: 'Val de baas aan!' }); } catch (e) { cur = { promise: Promise.resolve({ ok: false, ms: 0 }), cancel() {} }; }
      const h = cur;
      h.promise.then((r) => {
        if (dead || ended || cur !== h) return; cur = null; r = r || {};
        try { env.report({ q: qq, ok: !!r.ok, ms: r.ms || 0 }); } catch (e) { /* hub */ }
        const res = playerAnswer(st, !!r.ok, r.ms || 9999);
        env.snd.play(r.ok ? (res.crit ? 'power' : 'goed') : 'fout');
        if (r.ok) fl.burstEl(coinsEl, 'coins', 4);
        refreshShop(); later(nextQuestion, 40);
      }).catch(() => { if (!dead && !ended && cur === h) { cur = null; later(nextQuestion, 300); } });
    }

    function loop() {
      raf = 0; if (dead) return;
      if (host.isConnected === false) { later(loop, 500); last = performance.now(); return; }
      const now = performance.now(); const dt = clamp((now - last) / 1000, 0, 0.1); last = now;
      if (started && !ended) {
        step(st, dt); shop += dt; if (shop > 0.4) { shop = 0; refreshShop(); }
        if (st.bossNo !== lastBossNo) { lastBossNo = st.bossNo; env.snd.play('level'); const [rx, ry] = toRoot(180, 110); fl.burst(rx, ry, 'confetti', 40); refreshShop(); }
        if (st.phase !== 'fight') finish();
      }
      draw(); raf = requestAnimationFrame(loop);
    }
    function finish() {
      if (ended) return; ended = true;
      if (cur) { try { cur.cancel(); } catch (e) { /* */ } cur = null; }
      const won = st.phase === 'won', m = me(st);
      const ov = E('div', 'ba-ov'); const big = E('div', 'big'); big.appendChild(iel(won ? 'trophy' : 'skull', 96));
      ov.append(big, E('h2', '', won ? (st.rush ? 'Alle ' + st.bossTotal + ' bazen verslagen!' : st.boss.name + ' is verslagen!') : 'Het team is verslagen'), E('p', '', won ? 'Jij deed ' + m.dmg + ' schade.' : (st.rush ? 'Je versloeg ' + (st.bossNo - 1) + ' van ' + st.bossTotal + ' bazen.' : 'De baas had nog ' + Math.ceil(st.boss.hp) + ' levens.')));
      root.appendChild(ov); env.snd.play(won ? 'win' : 'lose');
      fl.burst((root.clientWidth || 360) / 2, 150, won ? 'confetti' : 'smoke', won ? 60 : 12);
      const score = Math.round(m.dmg + (won ? 500 + alive(st).length * 100 : 0) + (st.rush ? (st.bossNo - 1) * 400 : 0));
      later(() => env.end({ score, win: won, stats: { correct: st.correct, wrong: st.wrong, 'beste reeks': st.best, schade: m.dmg, 'kritieke slagen': st.crits, 'teamgenoten gered': st.revives }, summary: (st.rush ? 'Baas-rush: ' : '') + (won ? 'Baas verslagen in ' : 'Baas won na ') + Math.round(st.t) + ' s · jouw schade ' + m.dmg + ', ' + st.correct + ' goed.' }), 1800);
    }
    function start(mode) {
      if (started) return; started = true;
      if (mode === 'rush') { st = newBoss({ level: env.level || 2, rand: env.rand, fx, name: env.name, rush: true }); lastBossNo = 1; }
      last = performance.now(); refreshShop(); nextQuestion();
    }
    const intro = E('div', 'ba-ov');
    const mk = (txt, cls, m) => { const b = E('button', 'ba-btn ' + cls, txt); b.type = 'button'; b.addEventListener('click', () => { intro.remove(); start(m); }); return b; };
    const bigI = E('div', 'big'); bigI.appendChild(iel(st.boss.icon, 110));
    intro.append(bigI, E('h2', '', st.boss.name), E('p', '', 'Elk goed antwoord is een aanval. Wek je teamgenoten, pak zwakke plekken en koop upgrades en wapens!' + (st.boss.info ? ' (' + st.boss.info + ')' : '')), mk('Tik om te beginnen', '', 'baas'), mk('Baas-rush: 3 bazen na elkaar', 'alt', 'rush'));
    root.appendChild(intro); refreshShop(); last = performance.now(); raf = requestAnimationFrame(loop);

    return { destroy() { dead = true; if (raf) cancelAnimationFrame(raf); timers.forEach((t) => clearTimeout(t)); timers.clear(); if (cur) { try { cur.cancel(); } catch (e) { /* */ } cur = null; } fl.destroy(); bgw.destroy(); root.remove(); style.remove(); } };
  },
};
