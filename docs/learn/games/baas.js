// Baasgevecht – jij en 3 bots tegen een eindbaas. Elk goed antwoord = aanval. Drie fases, zwakke plekken, potions, upgrades.
// Pure spellogica (Boss) is los exporteerbaar voor bot-simulaties.

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const BOSSES = [
  { name: 'Vuurdraak Fenix', emoji: '🐲', color: '#ef4444', bg: ['#450a0a', '#7c2d12'] },
  { name: 'Kraken Karel', emoji: '🦑', color: '#6366f1', bg: ['#0c1a4a', '#155e75'] },
  { name: 'Robot-reus Rex', emoji: '🤖', color: '#64748b', bg: ['#1e293b', '#334155'] },
  { name: 'Trol Tobbe', emoji: '🧌', color: '#16a34a', bg: ['#052e16', '#365314'] },
  { name: 'Ruimtemonster Zog', emoji: '👾', color: '#a855f7', bg: ['#1e1b4b', '#581c87'] },
  { name: 'Dino Rex', emoji: '🦖', color: '#f59e0b', bg: ['#422006', '#713f12'] },
];
export const SHOP = [
  { id: 'dmg', name: 'Zwaard', emoji: '⚔️', desc: 'Meer schade per aanval', cost: [40, 100, 220, 450, 900] },
  { id: 'hp', name: 'Harnas', emoji: '❤️', desc: 'Meer levens voor het hele team', cost: [45, 115, 260, 520, 1000] },
  { id: 'block', name: 'Schild', emoji: '🛡️', desc: 'Jij krijgt minder schade', cost: [60, 160, 380, 800] },
  { id: 'crit', name: 'Kritiek', emoji: '🎯', desc: 'Kans op een dubbele klap', cost: [50, 140, 320, 700] },
  { id: 'team', name: 'Training', emoji: '🤝', desc: 'Je teamgenoten slaan harder', cost: [70, 200, 480, 1000] },
  { id: 'potion', name: 'Toverdrank', emoji: '🧪', desc: 'Geneest iedereen 40% (en wekt wakker)', cost: null, price: 55 },
];
const BOTS = [['Mila', '🧙'], ['Daan', '🥷'], ['Fleur', '🧝'], ['Bo', '🧛'], ['Kay', '🦸'], ['Noor', '🧚']];

export function newBoss(opts = {}) {
  const rand = opts.rand || Math.random, level = clamp(opts.level || 2, 1, 3), fx = opts.fx || {};
  const b = BOSSES[Math.floor(rand() * BOSSES.length)];
  const hp = Math.round(4800 * [0.8, 1, 1.25][level - 1]);
  const names = BOTS.slice().sort(() => rand() - 0.5).slice(0, 3);
  const acc = [0.55, 0.7, 0.8][level - 1];
  const team = [{ id: 0, me: true, name: opts.name || 'Jij', emoji: '😎', hp: 110, max: 110, ko: false, dmg: 0 }];
  names.forEach(([n, e], i) => team.push({ id: i + 1, name: n, emoji: e, hp: 100, max: 100, ko: false, bot: true, acc: clamp(acc + (rand() - 0.5) * 0.12, 0.3, 0.92), think: [7.5, 6.2, 5][level - 1] * (0.85 + rand() * 0.3), timer: 2 + rand() * 3, dmg: 0 }));
  return {
    rand, level, fx, boss: { ...b, hp, max: hp, phase: 1, atk: null, atkT: 4, shake: 0 }, team, coins: (fx.startCash || 0) * 0.2, up: { dmg: 0, hp: 0, block: 0, crit: 0, team: 0 }, potions: 0,
    t: 0, streak: 0, best: 0, correct: 0, wrong: 0, revives: 0, sinceRevive: 0, weak: { t: 12 + rand() * 6, active: 0 }, ev: [], noFx: !!opts.noFx, phase: 'fight', shieldFx: fx.shield || 0, crits: 0, spent: 0,
  };
}
const ev = (st, e) => { if (st.noFx) return; if (st.ev.length > 60) st.ev.shift(); st.ev.push(e); };
export const me = (st) => st.team[0];
export const alive = (st) => st.team.filter((m) => !m.ko);
export function upCost(st, id) { const u = SHOP.find((x) => x.id === id); if (!u) return null; if (id === 'potion') return u.price; const l = st.up[id]; return l >= u.cost.length ? null : u.cost[l]; }
export function buy(st, id) {
  const c = upCost(st, id); if (c == null || st.coins < c) return false;
  st.coins -= c; st.spent += c;
  if (id === 'potion') { st.potions++; usePotion(st); return true; }
  st.up[id]++;
  if (id === 'hp') for (const m of st.team) { const add = m.me ? 22 : 16; m.max += add; if (!m.ko) m.hp += add; }
  return true;
}
function usePotion(st) {
  for (const m of st.team) { if (m.ko) { m.ko = false; m.hp = m.max * 0.3; } else m.hp = Math.min(m.max, m.hp + m.max * 0.4); }
  ev(st, { k: 'heal', life: 0.8, max: 0.8 });
}
function damageBoss(st, d, who, crit) {
  const b = st.boss; d = Math.round(d); b.hp = Math.max(0, b.hp - d); b.shake = 0.18; if (who) who.dmg += d;
  ev(st, { k: 'num', s: (crit ? '💥' : '') + d, c: crit ? '#fde047' : who && who.me ? '#fff' : '#cbd5e1', x: 130 + st.rand() * 100, y: 80 + st.rand() * 30, life: 0.9, max: 0.9 });
  if (b.hp <= 0) st.phase = 'won';
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
  damageBoss(st, d, m, crit);
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
  const A = (25 + st.level * 5) * enr;
  if (b.atk) {
    b.atk.t -= dt;
    if (b.atk.t <= 0) {
      const a = b.atk; b.atk = null;
      for (const id of a.ids) { const m = st.team[id]; hurt(st, m, a.dmg); }
      ev(st, { k: 'slam', life: 0.4, max: 0.4 });
      b.atkT = [5.2, 4.3, 3.2][b.phase - 1] / Math.min(2, enr);
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
    for (const u of SHOP) { if (u.id === 'potion') continue; const c = upCost(st, u.id); if (c != null && c <= st.coins && c < bc) { best = u.id; bc = c; } }
    if (!best || st.coins < bc) break; buy(st, best);
  }
}

// ---------------------------------------------------------------------------------------------
const E = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const clr = (e) => { while (e.firstChild) e.removeChild(e.firstChild); };
const addCss = (id, t) => { const s = document.createElement('style'); s.setAttribute('data-learn-g', id); s.textContent = t; document.head.appendChild(s); return s; };
const EF = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const CW = 360, CH = 270;
const CSS = `
.ba-root{position:relative;display:flex;flex-direction:column;gap:6px;width:100%;height:100%;min-height:440px;padding:6px;box-sizing:border-box;color:var(--ink);overflow:auto}
.ba-root *{box-sizing:border-box}
.ba-cv{width:100%;max-width:520px;align-self:center;aspect-ratio:${CW}/${CH};border-radius:16px;border:2px solid var(--line);display:block;background:#1e293b}
.ba-shop{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}
.ba-up{border:2px solid var(--line);background:var(--card);color:var(--ink);border-radius:12px;padding:4px 1px;font:inherit;font-size:10px;text-align:center;cursor:pointer;opacity:.6;line-height:1.1}
.ba-up .e{font-size:20px;display:block}.ba-up b{display:block;font-size:10px}.ba-up .c{font-weight:900;font-size:11px;display:block}
.ba-up.can{opacity:1;border-color:#22c55e;box-shadow:0 0 0 2px #22c55e44}
.ba-coins{font-weight:900;font-size:14px;padding:2px 8px;align-self:flex-start;background:var(--card);border:1px solid var(--line);border-radius:10px}
.ba-q{flex:1;min-height:150px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:6px;overflow:auto}
.ba-ov{position:absolute;inset:0;background:color-mix(in srgb,var(--card) 92%,transparent);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;padding:20px;z-index:9}
.ba-ov h2{margin:0;font-size:26px}.ba-ov p{margin:0;max-width:320px;opacity:.85;line-height:1.35}.ba-ov .big{font-size:64px}
.ba-btn{border:0;background:linear-gradient(135deg,#ef4444,#f97316);color:#fff;border-radius:16px;font:inherit;font-weight:900;font-size:18px;padding:12px 28px;cursor:pointer;box-shadow:0 6px 16px #ef444466}
`;

export default {
  id: 'baas', name: 'Baasgevecht', emoji: '🐲', color: '#ef4444',
  desc: 'Versla samen met je team een gigantische eindbaas. Elk goed antwoord is een aanval!',
  tags: ['team', 'actie', 'bots'], minutes: 4, duo: false,
  create(host, env) {
    const style = addCss('baas', CSS);
    const f0 = env.fx || {};
    const fx = { startCash: clamp(+f0.startCash || 0, 0, 5000), cashMult: clamp(+f0.cashMult || 1, 0.5, 5), streakBonus: clamp(+f0.streakBonus || 0, 0, 0.5), luck: clamp(+f0.luck || 0, 0, 1), shield: Math.round(clamp((+f0.shield || 0) + (+f0.extraLives || 0), 0, 6)), hints: Math.round(clamp(+f0.hints || 0, 0, 5)) };
    const st = newBoss({ level: env.level || 2, rand: env.rand, fx, name: env.name });
    const root = E('div', 'ba-root'); host.appendChild(root);
    let dead = false, ended = false, cur = null, started = false, raf = 0, last = 0, nQ = 0, queue = [], shop = 0;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
    const cv = E('canvas', 'ba-cv'); const dpr = Math.min(2, globalThis.devicePixelRatio || 1); cv.width = CW * dpr; cv.height = CH * dpr; const ctx = cv.getContext('2d');
    const coinsEl = E('div', 'ba-coins', '🪙 0');
    const shopEl = E('div', 'ba-shop'); const upEls = {};
    for (const u of SHOP) {
      const b = E('button', 'ba-up'); b.type = 'button'; b.title = u.desc; const c = E('span', 'c', ''); const nm = E('b', '', u.name);
      b.append(E('span', 'e', u.emoji), nm, c); b.addEventListener('click', () => { if (!started || ended) return; if (buy(st, u.id)) env.snd.play('power'); else env.snd.play('klik'); refreshShop(); });
      upEls[u.id] = { b, c, nm }; shopEl.appendChild(b);
    }
    const qhost = E('div', 'ba-q');
    root.append(cv, coinsEl, shopEl, qhost);
    function refreshShop() {
      coinsEl.textContent = '🪙 ' + Math.floor(st.coins);
      for (const u of SHOP) { const c = upCost(st, u.id), el = upEls[u.id]; el.c.textContent = c == null ? 'MAX' : String(c); el.nm.textContent = u.name + (u.id !== 'potion' ? ' ' + st.up[u.id] : ''); el.b.className = 'ba-up' + (c != null && st.coins >= c ? ' can' : ''); }
    }

    // ---- tekenen
    const shown = {};
    function drawHpBar(x, y, w, h, f, col) { ctx.fillStyle = '#0008'; ctx.fillRect(x, y, w, h); ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp(f, 0, 1), h); }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const b = st.boss, bg = ctx.createLinearGradient(0, 0, 0, CH); bg.addColorStop(0, b.bg[0]); bg.addColorStop(1, b.bg[1]); ctx.fillStyle = bg; ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = '#0003'; for (let i = 0; i < 6; i++) ctx.fillRect(i * 64 + (i % 2) * 10, 200, 30, 70);
      ctx.fillStyle = '#00000044'; ctx.fillRect(0, 210, CW, 60);
      // baas
      const phaseScale = b.phase === 3 ? 1.12 : 1; const bob = Math.sin(st.t * 2) * 4; const sh = b.shake > 0 ? (Math.random() - 0.5) * 8 : 0;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.beginPath(); ctx.ellipse(180, 180, 60, 12, 0, 0, 6.2832); ctx.fillStyle = '#0005'; ctx.fill();
      ctx.save(); ctx.translate(180 + sh, 110 + bob); ctx.scale(phaseScale, phaseScale);
      if (b.phase === 3) { ctx.beginPath(); ctx.arc(0, 0, 66 + Math.sin(st.t * 8) * 3, 0, 6.2832); ctx.fillStyle = '#ef444433'; ctx.fill(); }
      ctx.font = '104px ' + EF; ctx.globalAlpha = b.shake > 0 ? 0.7 : 1; ctx.fillText(b.emoji, 0, 0); ctx.globalAlpha = 1;
      if (st.weak.active > 0) { const p = 1 + Math.sin(st.t * 12) * 0.2; ctx.font = (34 * p) + 'px ' + EF; ctx.fillText('⭐', 30, -10); }
      ctx.restore();
      // aanvals-waarschuwing
      if (b.atk) {
        const a = b.atk; ctx.fillStyle = '#ef4444' + (Math.sin(st.t * 20) > 0 ? '66' : '33');
        for (const id of a.ids) { const p = teamPos(id); ctx.beginPath(); ctx.arc(p.x, p.y, 30, 0, 6.2832); ctx.fill(); }
        ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(a.aoe ? '⚠️ AANVAL OP IEDEREEN' : '⚠️ ' + st.team[a.ids[0]].name + ' wordt geraakt', 180, 196);
      }
      // team
      st.team.forEach((m, i) => {
        const p = teamPos(i); const hop = m.ko ? 0 : Math.abs(Math.sin(st.t * 3 + i)) * 3;
        ctx.beginPath(); ctx.ellipse(p.x, p.y + 20, 17, 5, 0, 0, 6.2832); ctx.fillStyle = '#0006'; ctx.fill();
        ctx.font = '34px ' + EF; ctx.globalAlpha = m.ko ? 0.35 : 1; ctx.fillText(m.emoji, p.x, p.y - hop); ctx.globalAlpha = 1;
        if (m.ko) { ctx.font = '18px ' + EF; ctx.fillText('💤', p.x + 14, p.y - 22); }
        drawHpBar(p.x - 24, p.y + 26, 48, 6, m.hp / m.max, m.hp / m.max > 0.4 ? '#22c55e' : '#ef4444');
        ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = m.me ? '#fde047' : '#e2e8f0'; ctx.fillText(m.name, p.x, p.y + 42);
      });
      // baas-balk
      drawHpBar(10, 10, CW - 20, 14, b.hp / b.max, b.phase === 1 ? '#22c55e' : b.phase === 2 ? '#eab308' : '#ef4444');
      ctx.fillStyle = '#fff6'; ctx.fillRect(10 + (CW - 20) * 0.33, 10, 1.5, 14); ctx.fillRect(10 + (CW - 20) * 0.66, 10, 1.5, 14);
      ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(b.name + '  ' + Math.ceil(b.hp) + '/' + b.max, CW / 2, 17);
      // events
      for (const e of st.ev) {
        const a = Math.max(0, e.life / e.max);
        if (e.k === 'num') { ctx.globalAlpha = a; ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = e.c; ctx.strokeStyle = '#000a'; ctx.lineWidth = 3; ctx.strokeText(e.s, e.x, e.y - (1 - a) * 30); ctx.fillText(e.s, e.x, e.y - (1 - a) * 30); ctx.globalAlpha = 1; }
        else if (e.k === 'hurt') { const p = teamPos(e.id); ctx.globalAlpha = a; ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#fca5a5'; ctx.fillText(e.s, p.x, p.y - 30 - (1 - a) * 20); ctx.globalAlpha = 1; }
        else if (e.k === 'slam') { ctx.fillStyle = '#ef444455'; ctx.globalAlpha = a; ctx.fillRect(0, 0, CW, CH); ctx.globalAlpha = 1; }
        else if (e.k === 'heal') { ctx.fillStyle = '#22c55e33'; ctx.globalAlpha = a; ctx.fillRect(0, 0, CW, CH); ctx.globalAlpha = 1; }
        else if (e.k === 'phase') { ctx.globalAlpha = Math.min(1, a * 2); ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.strokeText(e.s, 180, 48); ctx.fillText(e.s, 180, 48); ctx.globalAlpha = 1; }
      }
    }
    function teamPos(i) { return { x: 48 + i * 88, y: 218 }; }

    // ---- vragen
    function takeQ() {
      if (!queue.length) { try { queue = env.pick(12) || []; } catch (e) { queue = []; } }
      return queue.shift() || { t: 'num', q: 'Wat is ' + (3 + (nQ % 6)) + ' + ' + (2 + (nQ % 4)) + '?', a: 5 + (nQ % 6) + (nQ % 4) };
    }
    function nextQuestion() {
      if (dead || ended) return;
      const q = takeQ(); nQ++; clr(qhost);
      try { cur = env.ask(qhost, q, { compact: true, feedback: true, autoNext: 650, hints: fx.hints, time: env.level === 3 ? 25 : 0, label: 'Val de baas aan!' }); } catch (e) { cur = { promise: Promise.resolve({ ok: false, ms: 0 }), cancel() {} }; }
      const h = cur;
      h.promise.then((r) => {
        if (dead || ended || cur !== h) return; cur = null; r = r || {};
        try { env.report({ q, ok: !!r.ok, ms: r.ms || 0 }); } catch (e) { /* hub */ }
        const res = playerAnswer(st, !!r.ok, r.ms || 9999);
        env.snd.play(r.ok ? (res.crit ? 'power' : 'goed') : 'fout');
        refreshShop(); later(nextQuestion, 40);
      }).catch(() => { if (!dead && !ended && cur === h) { cur = null; later(nextQuestion, 300); } });
    }

    function loop() {
      raf = 0; if (dead) return;
      if (host.isConnected === false) { later(loop, 500); last = performance.now(); return; }
      const now = performance.now(); const dt = clamp((now - last) / 1000, 0, 0.1); last = now;
      if (started && !ended) { step(st, dt); shop += dt; if (shop > 0.4) { shop = 0; refreshShop(); } if (st.phase !== 'fight') finish(); }
      draw(); raf = requestAnimationFrame(loop);
    }
    function finish() {
      if (ended) return; ended = true;
      if (cur) { try { cur.cancel(); } catch (e) { /* */ } cur = null; }
      const won = st.phase === 'won', m = me(st);
      const ov = E('div', 'ba-ov'); ov.append(E('div', 'big', won ? '🏆' : '💀'), E('h2', '', won ? st.boss.name + ' is verslagen!' : 'Het team is verslagen'), E('p', '', won ? 'Jij deed ' + m.dmg + ' schade.' : 'De baas had nog ' + Math.ceil(st.boss.hp) + ' levens.'));
      root.appendChild(ov); env.snd.play(won ? 'win' : 'lose');
      const score = Math.round(m.dmg + (won ? 500 + alive(st).length * 100 : 0));
      later(() => env.end({ score, win: won, stats: { correct: st.correct, wrong: st.wrong, 'beste reeks': st.best, schade: m.dmg, 'kritieke slagen': st.crits, 'teamgenoten gered': st.revives }, summary: (won ? 'Baas verslagen in ' : 'Baas won na ') + Math.round(st.t) + ' s · jouw schade ' + m.dmg + ', ' + st.correct + ' goed.' }), 1800);
    }
    function start() { if (started) return; started = true; last = performance.now(); refreshShop(); nextQuestion(); }
    const intro = E('div', 'ba-ov'); const sb = E('button', 'ba-btn', 'Tik om te beginnen'); sb.type = 'button'; sb.addEventListener('click', () => { intro.remove(); start(); });
    intro.append(E('div', 'big', st.boss.emoji), E('h2', '', st.boss.name), E('p', '', 'Elk goed antwoord is een aanval. Wek je teamgenoten, pak zwakke plekken (⭐) en koop upgrades!'), sb);
    root.appendChild(intro); refreshShop(); last = performance.now(); raf = requestAnimationFrame(loop);

    return { destroy() { dead = true; if (raf) cancelAnimationFrame(raf); timers.forEach((t) => clearTimeout(t)); timers.clear(); if (cur) { try { cur.cancel(); } catch (e) { /* */ } cur = null; } root.remove(); style.remove(); } };
  },
};
