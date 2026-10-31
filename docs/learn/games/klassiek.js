// Klassiek – verdien geld met goede antwoorden en koop upgrades (Gimkit-gevoel). 4 minuten, bots in de ranglijst.
// Pure economie is los exporteerbaar (Eco, UPS, makeBots, botTick) voor bot-simulaties.

import { attachWorld, fxLayer, gearBtn, iel } from './_gxa.js?v=1';

export const UPS = [
  { id: 'mult', name: 'Multiplier', icon: 'gem', emoji: '✖️', desc: 'Meer geld per goed antwoord', vals: [10, 24, 56, 125, 280, 620, 1350, 2900, 6200, 13000], cost: [35, 120, 400, 1300, 4000, 12500, 38000, 115000, 350000] },
  { id: 'streak', name: 'Reeks', icon: 'flame', emoji: '🔥', desc: 'Bonus voor goede antwoorden op rij', vals: [0, 0.07, 0.14, 0.23, 0.34, 0.48, 0.65, 0.9], cost: [80, 280, 950, 3100, 9800, 31000, 98000] },
  { id: 'insure', name: 'Verzekering', icon: 'shield', emoji: '🛡️', desc: 'Je verliest minder bij een fout', vals: [1, 0.7, 0.45, 0.25, 0.1, 0], cost: [70, 330, 1600, 8000, 40000] },
  { id: 'speed', name: 'Snelheid', icon: 'bolt', emoji: '⚡', desc: 'Extra geld bij een snel antwoord (< 6 s)', vals: [0, 0.15, 0.3, 0.5, 0.75, 1.0], cost: [100, 600, 3300, 17000, 85000] },
  { id: 'bank', name: 'Spaarpot', icon: 'bag', emoji: '🏦', desc: 'Rente: geld per seconde', vals: [0, 0.03, 0.07, 0.13, 0.22, 0.35, 0.55], cost: [140, 800, 4000, 20000, 100000, 400000] },
  // ---- nieuw: 4 extra upgrades
  { id: 'jackpot', name: 'Jackpot', icon: 'trophy', emoji: '🏆', desc: 'Elk 5e goede antwoord betaalt extra', vals: [0, 1, 2, 4, 7, 12], cost: [220, 1100, 5200, 26000, 120000] },
  { id: 'comeback', name: 'Opkikker', icon: 'heart', emoji: '💪', desc: 'Na een fout betaalt het volgende goede antwoord extra', vals: [0, 0.6, 1.2, 2, 3], cost: [150, 900, 4800, 30000] },
  { id: 'time', name: 'Extra tijd', icon: 'hourglass', emoji: '⏳', desc: '+20 seconden speeltijd per niveau (klassiek)', vals: [0, 20, 40, 60, 80], cost: [260, 1500, 8500, 45000] },
  { id: 'gold', name: 'Gouden uur', icon: 'crown', emoji: '👑', desc: 'Gouden kwartiertje duurt langer en betaalt meer', vals: [0, 1, 2, 3], cost: [400, 3200, 24000] },
];
export const GOLD_BASE = 15;
export const goldDur = (st) => GOLD_BASE + 5 * (UPS[8].vals[st.lvl.gold] > 0 ? UPS[8].vals[st.lvl.gold] : 0);
export const goldMult = (st) => 2 + 0.5 * UPS[8].vals[st.lvl.gold];

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const num = (v, d, a, b) => clamp(Number.isFinite(+v) ? +v : d, a, b);
export function fxOf(env) {
  const f = (env && env.fx) || {};
  return {
    startCash: num(f.startCash, 0, 0, 5000), cashMult: num(f.cashMult, 1, 0.5, 5), streakBonus: num(f.streakBonus, 0, 0, 0.5),
    extraLives: Math.round(num(f.extraLives, 0, 0, 5)), timeBonus: num(f.timeBonus, 0, 0, 60), hints: Math.round(num(f.hints, 0, 0, 5)),
    shield: Math.round(num(f.shield, 0, 0, 5)), luck: num(f.luck, 0, 0, 1),
  };
}

export const Eco = {
  newState(fx) {
    return { cash: (fx && fx.startCash) || 0, earned: 0, streak: 0, best: 0, correct: 0, wrong: 0, shield: (fx && fx.shield) || 0, buys: 0, comeback: false, lvl: { mult: 0, streak: 0, insure: 0, speed: 0, bank: 0, jackpot: 0, comeback: 0, time: 0, gold: 0 } };
  },
  base(st) { return UPS[0].vals[st.lvl.mult]; },
  gain(st, ms, fx, gold) {
    let g = UPS[0].vals[st.lvl.mult];
    g *= 1 + Math.min(st.streak, 10) * (UPS[1].vals[st.lvl.streak] + (fx.streakBonus || 0));
    if (ms < 6000) g *= 1 + UPS[3].vals[st.lvl.speed];
    if (st.comeback) g *= 1 + UPS[6].vals[st.lvl.comeback];
    if (UPS[5].vals[st.lvl.jackpot] > 0 && (st.correct + 1) % 5 === 0) g *= 1 + UPS[5].vals[st.lvl.jackpot];
    return Math.max(1, Math.round(g * (fx.cashMult || 1) * (gold || 1)));
  },
  correct(st, ms, fx, gold) {
    st.streak++; if (st.streak > st.best) st.best = st.streak;
    const g = Eco.gain(st, ms, fx, gold); st.correct++; st.comeback = false; st.cash += g; st.earned += g; return g;
  },
  wrong(st) {
    st.streak = 0; st.wrong++; st.comeback = true;
    if (st.shield > 0) { st.shield--; return 0; }
    const loss = Math.round(Math.min(st.cash, UPS[0].vals[st.lvl.mult] * 0.5 * UPS[2].vals[st.lvl.insure]));
    st.cash -= loss; return loss;
  },
  rate(st) { return UPS[4].vals[st.lvl.bank] * UPS[0].vals[st.lvl.mult]; },
  tickBank(st, dt) { const g = Eco.rate(st) * dt; st.cash += g; st.earned += g; },
  next(st, id) { const u = UPS.find((x) => x.id === id); const l = st.lvl[id]; return l >= u.cost.length ? null : u.cost[l]; },
  buy(st, id) { const c = Eco.next(st, id); if (c == null || st.cash < c) return false; st.cash -= c; st.lvl[id]++; st.buys++; return true; },
  // slimme koop-volgorde voor bots en simulatie: goedkoopste nuttige upgrade eerst
  autoBuy(st) {
    let bought = 0;
    for (let k = 0; k < 6; k++) {
      let best = null, bc = Infinity;
      for (const u of UPS) { const c = Eco.next(st, u.id); if (c != null && c <= st.cash && c < bc) { best = u.id; bc = c; } }
      if (!best) break; Eco.buy(st, best); bought++;
    }
    return bought;
  },
};

const BOTNAMES = [['Robo', '🤖', 'robot'], ['Lisa', '🦊', 'fox'], ['Max', '🐯', 'lion'], ['Nova', '🦄', 'unicorn'], ['Bram', '🐻', 'bear'], ['Sofie', '🐼', 'panda']];
export function makeBots(level, rand, n = 4) {
  const acc = [0.5, 0.68, 0.82][clamp(level, 1, 3) - 1], think = [9, 7, 5.5][clamp(level, 1, 3) - 1];
  const names = BOTNAMES.slice().sort(() => rand() - 0.5).slice(0, n);
  return names.map(([name, emoji, icon], i) => ({ name, emoji, icon, acc: clamp(acc + (rand() - 0.5) * 0.18, 0.3, 0.95), think: think * (0.8 + rand() * 0.5), timer: 2 + rand() * 4, st: Eco.newState({}), bot: true, i }));
}
export function botTick(b, dt, rand, gold) {
  Eco.tickBank(b.st, dt);
  b.timer -= dt;
  while (b.timer <= 0) {
    const ms = b.think * 1000 * (0.7 + rand() * 0.6);
    if (rand() < b.acc) Eco.correct(b.st, ms, {}, gold); else Eco.wrong(b.st);
    Eco.autoBuy(b.st);
    b.timer += b.think * (0.75 + rand() * 0.5);
  }
}

// ---------------------------------------------------------------------------------------------
const E = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const clr = (e) => { while (e.firstChild) e.removeChild(e.firstChild); };
const addCss = (id, t) => { const s = document.createElement('style'); s.setAttribute('data-learn-g', id); s.textContent = t; document.head.appendChild(s); return s; };
const fmt = (n) => {
  n = Math.round(n);
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace('.', ',') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1).replace('.', ',') + 'K';
  return String(n);
};

const CSS = `
.kl-root{position:relative;display:flex;flex-direction:column;gap:10px;width:100%;height:100%;min-height:460px;box-sizing:border-box;padding:10px;color:var(--ink);font-family:inherit;overflow:hidden;font-size:calc(16px*var(--gfx-font,1))}
.kl-root *{box-sizing:border-box}
.kl-hud{display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,var(--gx-accent,#6366f1),color-mix(in srgb,var(--gx-accent,#6366f1) 55%,#8b5cf6));color:#fff;border-radius:20px;padding:10px 12px;box-shadow:0 6px 18px #0004}
.kl-cash{font-size:calc(34px*var(--gfx-font,1));font-weight:900;letter-spacing:-.5px;flex:1;position:relative;font-variant-numeric:tabular-nums;display:flex;align-items:center;gap:8px;line-height:1.05;min-width:0}
.kl-cash small{font-size:calc(13px*var(--gfx-font,1));font-weight:700;opacity:.9;display:block;letter-spacing:0;margin-top:0}
.kl-cash .t{display:flex;flex-direction:column;min-width:0}
.kl-chip{background:#ffffff2e;border-radius:14px;padding:6px 10px;font-weight:800;font-size:calc(16px*var(--gfx-font,1));white-space:nowrap;display:flex;align-items:center;gap:4px}
.kl-gold .kl-hud{background:linear-gradient(135deg,#f59e0b,#ef4444);box-shadow:0 4px 22px #f59e0bbb;animation:kl-pulse 1s infinite}
@keyframes kl-pulse{50%{transform:scale(1.015)}}
.kl-time{height:8px;border-radius:5px;background:color-mix(in srgb,var(--card) 80%,transparent);overflow:hidden}
.kl-time i{display:block;height:100%;background:linear-gradient(90deg,#22c55e,#eab308,#ef4444);transition:width .2s linear}
.kl-board{display:flex;gap:6px;overflow:hidden}
.kl-bi{flex:1;min-width:0;background:color-mix(in srgb,var(--card) 90%,transparent);border:1px solid var(--line);border-radius:14px;padding:5px 8px;font-size:calc(14px*var(--gfx-font,1));display:flex;align-items:center;gap:5px;white-space:nowrap}
.kl-bi b{overflow:hidden;text-overflow:ellipsis}
.kl-bi.me{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 30%,transparent)}
.kl-bi span.v{margin-left:auto;font-weight:800;font-variant-numeric:tabular-nums}
.kl-q{flex:1;min-height:170px;overflow:auto;background:color-mix(in srgb,var(--card) 93%,transparent);border:1px solid var(--line);border-radius:20px;padding:10px;position:relative}
.kl-shop{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 8px;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity}
.kl-up{flex:0 0 auto;width:calc(96px*var(--gfx-scale,1));min-height:calc(96px*var(--gfx-scale,1));border:2px solid var(--line);background:color-mix(in srgb,var(--card) 94%,transparent);color:var(--ink);border-radius:18px;padding:8px 4px;font:inherit;font-size:calc(13px*var(--gfx-font,1));text-align:center;cursor:pointer;opacity:.7;position:relative;transition:transform .12s,opacity .2s,border-color .2s;scroll-snap-align:start}
.kl-up .e{display:block;margin:0 auto}
.kl-up .n{font-weight:700;display:block;line-height:1.1;margin:3px 0}
.kl-up .c{font-weight:900;display:block;font-variant-numeric:tabular-nums}
.kl-up .p{display:flex;gap:2px;justify-content:center;margin-top:3px;min-height:6px;flex-wrap:wrap}
.kl-up .p i{width:6px;height:6px;border-radius:3px;background:var(--line)}
.kl-up .p i.on{background:var(--accent)}
.kl-up.can{opacity:1;border-color:#22c55e;box-shadow:0 0 0 3px #22c55e44;animation:kl-pulse 1.2s infinite}
.kl-up:active{transform:scale(.94)}
.kl-up.max{opacity:.9;border-color:#eab308}
.kl-float{position:absolute;left:0;top:0;font-weight:900;pointer-events:none;animation:kl-fl 1.1s ease-out forwards;white-space:nowrap;font-size:calc(20px*var(--gfx-font,1));text-shadow:0 2px 4px #0008}
@keyframes kl-fl{0%{opacity:0;transform:translateY(10px) scale(.7)}15%{opacity:1}100%{opacity:0;transform:translateY(-46px) scale(1.2)}}
.kl-toast{position:absolute;left:50%;top:84px;transform:translateX(-50%);background:#111d;color:#fff;border-radius:16px;padding:10px 16px;font-weight:800;z-index:5;animation:kl-fl 2s ease-out forwards;white-space:nowrap;display:flex;gap:6px;align-items:center;font-size:calc(16px*var(--gfx-font,1))}
.kl-ov{position:absolute;inset:0;background:color-mix(in srgb,var(--card) 88%,transparent);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;padding:20px;z-index:9}
.kl-ov h2{margin:0;font-size:calc(30px*var(--gfx-font,1))}
.kl-ov p{margin:0;max-width:340px;opacity:.9;line-height:1.4;font-size:calc(16px*var(--gfx-font,1))}
.kl-ov .big{animation:kl-pulse 1.2s infinite}
.kl-btn{border:0;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:18px;font:inherit;font-weight:900;font-size:calc(19px*var(--gfx-font,1));padding:14px 30px;min-height:54px;cursor:pointer;box-shadow:0 6px 16px #6366f166}
.kl-btn.alt{background:linear-gradient(135deg,#f59e0b,#ef4444);box-shadow:0 6px 16px #ef444466}
.kl-btn:active{transform:scale(.96)}
.kl-top{display:flex;gap:8px;align-items:stretch}
.kl-top .kl-hud{flex:1;min-width:0}
`;

export default {
  id: 'klassiek', name: 'Klassiek', emoji: '💰', color: '#6366f1',
  desc: 'Verdien geld met goede antwoorden en koop upgrades. Wie is na 4 minuten het rijkst? Of speel eindeloos met 3 levens.',
  tags: ['geld', 'solo', 'upgrades', 'eindeloos'], minutes: 4, duo: false,
  create(host, env) {
    const style = addCss('klassiek', CSS);
    const fx = fxOf(env);
    const rand = env.rand || Math.random;
    let limit = 240 + fx.timeBonus, mode = 'klassiek', hearts = 0;
    const root = E('div', 'kl-root'); host.appendChild(root);
    const bgw = attachWorld(root, env, 'klassiek'); const fl = fxLayer(root, env);
    let dead = false, ended = false, cur = null, started = false, timeLeft = limit, goldT = 0, goldNext = 60, nQ = 0, interval = 0, last = 0;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };

    const st = Eco.newState(fx);
    const bots = makeBots(env.level || 2, rand, 4);
    const me = { name: env.name || 'Jij', emoji: '😎', icon: 'astronaut', st, me: true };

    // ---- DOM
    const hud = E('div', 'kl-hud');
    const cashEl = E('div', 'kl-cash'); const cashNum = E('span', '', '0'); const cashSub = E('small', '', ''); const cashT = E('div', 't'); cashT.append(cashNum, cashSub); cashEl.append(iel('coin', 44), cashT);
    const stChip = E('div', 'kl-chip'); const tChip = E('div', 'kl-chip');
    hud.append(cashEl, stChip, tChip);
    const top = E('div', 'kl-top'); top.append(hud, gearBtn());
    const timebar = E('div', 'kl-time'); const timefill = E('i'); timebar.appendChild(timefill);
    const board = E('div', 'kl-board');
    const qhost = E('div', 'kl-q');
    const shop = E('div', 'kl-shop');
    const upEls = {};
    for (const u of UPS) {
      const b = E('button', 'kl-up'); b.type = 'button';
      const e = iel(u.icon, 38, 'e'), n = E('span', 'n', u.name), c = E('span', 'c', ''), p = E('span', 'p');
      b.append(e, n, c, p); b.title = u.desc;
      b.addEventListener('click', () => buy(u.id));
      upEls[u.id] = { b, c, p }; shop.appendChild(b);
    }
    root.append(top, timebar, board, qhost, shop);

    function setChip(el, ico, txt) { clr(el); el.append(iel(ico, 24), E('span', '', txt)); }
    let shown = 0, lastStreakTxt = '', lastTimeTxt = '';
    function refresh() {
      const target = st.cash; shown += (target - shown) * 0.35; if (Math.abs(target - shown) < 1) shown = target;
      cashNum.textContent = fmt(shown);
      const r = Eco.rate(st); cashSub.textContent = r > 0 ? '+' + fmt(r) + ' per seconde' : 'per goed antwoord: ' + fmt(Eco.gain(st, 9999, fx, goldT > 0 ? goldMult(st) : 1));
      const sTxt = st.streak + (st.shield ? '  +' + st.shield + ' schild' : '');
      if (sTxt !== lastStreakTxt) { lastStreakTxt = sTxt; setChip(stChip, 'flame', sTxt); }
      let tTxt;
      if (mode === 'eindeloos') tTxt = String(hearts); else { const m = Math.max(0, Math.floor(timeLeft)); tTxt = Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); }
      if (tTxt !== lastTimeTxt) { lastTimeTxt = tTxt; setChip(tChip, mode === 'eindeloos' ? 'heart' : 'hourglass', tTxt); }
      timefill.style.width = (mode === 'eindeloos' ? clampN(hearts / (3 + fx.extraLives) * 100, 0, 100) : clampN(timeLeft / limit * 100, 0, 100)) + '%';
      for (const u of UPS) {
        const el = upEls[u.id], c = Eco.next(st, u.id), l = st.lvl[u.id];
        el.c.textContent = c == null ? 'MAX' : '$' + fmt(c);
        const cls = 'kl-up' + (c == null ? ' max' : st.cash >= c ? ' can' : '');
        if (el.cls !== cls) { el.cls = cls; el.b.className = cls; }
        if (el.l !== l) { el.l = l; clr(el.p); for (let i = 0; i < u.cost.length; i++) el.p.appendChild(E('i', i < l ? 'on' : '')); }
      }
      root.classList.toggle('kl-gold', goldT > 0);
    }
    const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);
    function standings() { return [me, ...bots].map((x) => ({ x, v: x.st.cash })).sort((a, b) => b.v - a.v); }
    function drawBoard() {
      const s = standings(); clr(board);
      const myI = s.findIndex((o) => o.x.me);
      const show = s.slice(0, 3); if (myI > 2) show[2] = s[myI];
      show.forEach((o) => {
        const i = s.indexOf(o);
        const d = E('div', 'kl-bi' + (o.x.me ? ' me' : ''));
        d.append(E('span', '', (i + 1) + '.'), iel(o.x.icon, 26), E('b', '', o.x.name), E('span', 'v', fmt(o.v)));
        board.appendChild(d);
      });
    }
    function floatTxt(t, color) {
      const f = E('div', 'kl-float', t); f.style.color = color || '#fff'; f.style.left = (60 + rand() * 120) + 'px'; f.style.top = '4px';
      cashEl.appendChild(f); later(() => f.remove(), 1200);
    }
    function toast(t, icon) { const d = E('div', 'kl-toast'); if (icon) d.appendChild(iel(icon, 28)); d.appendChild(E('span', '', t)); root.appendChild(d); later(() => d.remove(), 2000); }
    function buy(id) {
      if (!started || ended) return;
      if (Eco.buy(st, id)) {
        env.snd.play('power'); const u = UPS.find((x) => x.id === id); toast(u.name + ' niveau ' + st.lvl[id], u.icon);
        if (id === 'time' && mode === 'klassiek') { timeLeft += 20; limit += 20; }
        fl.burstEl(upEls[id].b, 'sparkle', 16); refresh();
      } else env.snd.play('klik');
    }

    // ---- vragen
    let queue = [];
    function takeQ() {
      if (!queue.length) { try { queue = env.pick(12) || []; } catch (e) { queue = []; } }
      return queue.shift() || { t: 'num', q: 'Wat is ' + (2 + (nQ % 7)) + ' + ' + (3 + (nQ % 5)) + '?', a: 5 + (nQ % 7) + (nQ % 5) };
    }
    function nextQuestion() {
      if (dead || ended) return;
      const q = takeQ(); nQ++; clr(qhost);
      const o = { compact: true, feedback: true, autoNext: 800, hints: fx.hints, time: env.level === 3 ? 25 : 0, label: 'Vraag ' + nQ };
      try { cur = env.ask(qhost, q, o); } catch (e) { cur = { promise: Promise.resolve({ ok: false, ms: 0 }), cancel() {} }; }
      const h = cur;
      h.promise.then((r) => {
        if (dead || ended || cur !== h) return;
        cur = null; r = r || {};
        const ok = !!r.ok;
        try { env.report({ q, ok, ms: r.ms || 0 }); } catch (e) { /* hub */ }
        if (ok) {
          const g = Eco.correct(st, r.ms || 9999, fx, goldT > 0 ? goldMult(st) : 1); env.snd.play('munt'); floatTxt('+$' + fmt(g), '#fde047');
          fl.burstEl(cashEl, 'coins', 6);
          if (st.streak && st.streak % 5 === 0) { toast(st.streak + ' op rij!', 'flame'); fl.burstEl(cashEl, 'confetti', 18); }
        } else {
          const had = st.shield; const l = Eco.wrong(st); env.snd.play('fout'); floatTxt(l ? '-$' + fmt(l) : 'geblokt', '#fca5a5');
          if (mode === 'eindeloos' && st.shield >= had) { hearts--; if (hearts <= 0) { refresh(); finish(); return; } }
        }
        refresh(); later(nextQuestion, 50);
      }).catch(() => { if (!dead && !ended && cur === h) { cur = null; later(nextQuestion, 300); } });
    }

    // ---- klok
    function tick() {
      if (dead || ended || !started) return;
      const nowT = performance.now(); let dt = (nowT - last) / 1000; last = nowT; dt = clampN(dt, 0, 0.5);
      if (mode === 'klassiek') timeLeft -= dt; else timeLeft += 0;
      const elapsed = mode === 'klassiek' ? limit - timeLeft : (nowT - startAt) / 1000;
      if (elapsed >= goldNext && (mode === 'eindeloos' || goldNext < limit - 20)) { goldT = goldDur(st); goldNext += 60; toast('Gouden kwartiertje! ' + (goldMult(st) === 2 ? 'Dubbel' : 'x' + goldMult(st)) + ' geld ' + Math.round(goldT) + ' s', 'crown'); env.snd.play('level'); fl.burst((root.clientWidth || 360) / 2, 90, 'stars', 18); }
      if (goldT > 0) goldT -= dt;
      Eco.tickBank(st, dt);
      const gold = goldT > 0 ? goldMult(st) : 1;
      for (const b of bots) botTick(b, dt, rand, gold > 1 ? 2 : 1);
      refresh(); if (Math.floor(elapsed * 2) !== tick.k) { tick.k = Math.floor(elapsed * 2); drawBoard(); }
      if (mode === 'klassiek' && timeLeft <= 0) finish();
    }

    function finish() {
      if (ended) return; ended = true;
      if (cur) { try { cur.cancel(); } catch (e) { /* */ } cur = null; }
      const s = standings(); const rank = s.findIndex((o) => o.x.me) + 1;
      const ov = E('div', 'kl-ov'); const big = E('div', 'big'); big.appendChild(iel(rank === 1 ? 'trophy' : mode === 'eindeloos' ? 'heart' : 'hourglass', 96));
      ov.append(big, E('h2', '', rank === 1 ? 'Jij wint!' : mode === 'eindeloos' ? 'Geen levens meer' : 'Tijd om!'), E('p', '', 'Je bent ' + rank + 'e met $' + fmt(st.cash) + '.'));
      root.appendChild(ov); env.snd.play(rank === 1 ? 'win' : 'level');
      fl.burst((root.clientWidth || 360) / 2, 160, rank === 1 ? 'confetti' : 'coins', rank === 1 ? 50 : 20);
      later(() => {
        env.end({ score: Math.round(st.cash), win: rank === 1, stats: { correct: st.correct, wrong: st.wrong, 'beste reeks': st.best, upgrades: st.buys, plek: rank }, summary: (mode === 'eindeloos' ? 'Eindeloos: ' : '') + 'Plek ' + rank + ' van ' + (bots.length + 1) + ' met $' + fmt(st.cash) + ' · ' + st.correct + ' goed, ' + st.buys + ' upgrades.' });
      }, 1600);
    }

    let startAt = 0;
    function start(m) {
      if (started) return; started = true; mode = m || 'klassiek'; startAt = performance.now(); last = startAt; tick.k = -1;
      if (mode === 'eindeloos') { hearts = 3 + fx.extraLives; timebar.style.display = ''; }
      interval = setInterval(tick, 100);
      refresh(); drawBoard(); nextQuestion();
    }

    const intro = E('div', 'kl-ov');
    const mk = (txt, cls, m) => { const b = E('button', 'kl-btn ' + cls, txt); b.type = 'button'; b.addEventListener('click', () => { intro.remove(); start(m); }); return b; };
    const bigI = E('div', 'big'); bigI.appendChild(iel('bag', 96));
    intro.append(bigI, E('h2', '', 'Klassiek'), E('p', '', 'Elk goed antwoord brengt geld op. Koop onderaan upgrades zodat je steeds meer verdient en een fout minder pijn doet.'), mk('Tik om te beginnen (4 min)', '', 'klassiek'), mk('Eindeloos: 3 levens, geen klok', 'alt', 'eindeloos'));
    root.appendChild(intro); refresh(); drawBoard();

    return {
      destroy() {
        dead = true; if (interval) clearInterval(interval);
        timers.forEach((t) => clearTimeout(t)); timers.clear();
        if (cur) { try { cur.cancel(); } catch (e) { /* */ } cur = null; }
        fl.destroy(); bgw.destroy(); root.remove(); style.remove();
      },
    };
  },
};
