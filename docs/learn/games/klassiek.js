// Klassiek – verdien geld met goede antwoorden en koop upgrades (Gimkit-gevoel). 4 minuten, bots in de ranglijst.
// Pure economie is los exporteerbaar (Eco, UPS, makeBots, botTick) voor bot-simulaties.

export const UPS = [
  { id: 'mult', name: 'Multiplier', emoji: '✖️', desc: 'Meer geld per goed antwoord', vals: [10, 24, 56, 125, 280, 620, 1350, 2900, 6200, 13000], cost: [35, 120, 400, 1300, 4000, 12500, 38000, 115000, 350000] },
  { id: 'streak', name: 'Reeks', emoji: '🔥', desc: 'Bonus voor goede antwoorden op rij', vals: [0, 0.07, 0.14, 0.23, 0.34, 0.48, 0.65, 0.9], cost: [80, 280, 950, 3100, 9800, 31000, 98000] },
  { id: 'insure', name: 'Verzekering', emoji: '🛡️', desc: 'Je verliest minder bij een fout', vals: [1, 0.7, 0.45, 0.25, 0.1, 0], cost: [70, 330, 1600, 8000, 40000] },
  { id: 'speed', name: 'Snelheid', emoji: '⚡', desc: 'Extra geld bij een snel antwoord (< 6 s)', vals: [0, 0.15, 0.3, 0.5, 0.75, 1.0], cost: [100, 600, 3300, 17000, 85000] },
  { id: 'bank', name: 'Spaarpot', emoji: '🏦', desc: 'Rente: geld per seconde', vals: [0, 0.03, 0.07, 0.13, 0.22, 0.35, 0.55], cost: [140, 800, 4000, 20000, 100000, 400000] },
];

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
    return { cash: (fx && fx.startCash) || 0, earned: 0, streak: 0, best: 0, correct: 0, wrong: 0, shield: (fx && fx.shield) || 0, buys: 0, lvl: { mult: 0, streak: 0, insure: 0, speed: 0, bank: 0 } };
  },
  base(st) { return UPS[0].vals[st.lvl.mult]; },
  gain(st, ms, fx, gold) {
    let g = UPS[0].vals[st.lvl.mult];
    g *= 1 + Math.min(st.streak, 10) * (UPS[1].vals[st.lvl.streak] + (fx.streakBonus || 0));
    if (ms < 6000) g *= 1 + UPS[3].vals[st.lvl.speed];
    return Math.max(1, Math.round(g * (fx.cashMult || 1) * (gold || 1)));
  },
  correct(st, ms, fx, gold) {
    st.streak++; if (st.streak > st.best) st.best = st.streak; st.correct++;
    const g = Eco.gain(st, ms, fx, gold); st.cash += g; st.earned += g; return g;
  },
  wrong(st) {
    st.streak = 0; st.wrong++;
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

const BOTNAMES = [['Robo', '🤖'], ['Lisa', '🦊'], ['Max', '🐯'], ['Nova', '🦄'], ['Bram', '🐻'], ['Sofie', '🐼']];
export function makeBots(level, rand, n = 4) {
  const acc = [0.5, 0.68, 0.82][clamp(level, 1, 3) - 1], think = [9, 7, 5.5][clamp(level, 1, 3) - 1];
  const names = BOTNAMES.slice().sort(() => rand() - 0.5).slice(0, n);
  return names.map(([name, emoji], i) => ({ name, emoji, acc: clamp(acc + (rand() - 0.5) * 0.18, 0.3, 0.95), think: think * (0.8 + rand() * 0.5), timer: 2 + rand() * 4, st: Eco.newState({}), bot: true, i }));
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
.kl-root{position:relative;display:flex;flex-direction:column;gap:8px;width:100%;height:100%;min-height:420px;box-sizing:border-box;padding:8px;color:var(--ink);font-family:inherit;overflow:hidden}
.kl-root *{box-sizing:border-box}
.kl-hud{display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:16px;padding:8px 12px;box-shadow:0 4px 14px #6366f155}
.kl-cash{font-size:28px;font-weight:900;letter-spacing:-.5px;flex:1;position:relative;font-variant-numeric:tabular-nums}
.kl-cash small{font-size:12px;font-weight:700;opacity:.85;display:block;letter-spacing:0;margin-top:-4px}
.kl-chip{background:#ffffff26;border-radius:12px;padding:4px 9px;font-weight:800;font-size:14px;white-space:nowrap}
.kl-gold .kl-hud{background:linear-gradient(135deg,#f59e0b,#ef4444);box-shadow:0 4px 18px #f59e0b99;animation:kl-pulse 1s infinite}
@keyframes kl-pulse{50%{transform:scale(1.015)}}
.kl-time{height:6px;border-radius:4px;background:var(--line);overflow:hidden}
.kl-time i{display:block;height:100%;background:linear-gradient(90deg,#22c55e,#eab308,#ef4444);transition:width .2s linear}
.kl-board{display:flex;gap:6px;overflow:hidden}
.kl-bi{flex:1;min-width:0;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:4px 6px;font-size:12px;display:flex;align-items:center;gap:4px;white-space:nowrap}
.kl-bi b{overflow:hidden;text-overflow:ellipsis}
.kl-bi.me{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 30%,transparent)}
.kl-bi span{margin-left:auto;font-weight:800;font-variant-numeric:tabular-nums}
.kl-q{flex:1;min-height:150px;overflow:auto;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:8px;position:relative}
.kl-shop{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.kl-up{border:2px solid var(--line);background:var(--card);color:var(--ink);border-radius:14px;padding:6px 2px;font:inherit;font-size:11px;text-align:center;cursor:pointer;opacity:.6;position:relative;transition:transform .12s,opacity .2s,border-color .2s}
.kl-up .e{font-size:22px;display:block}
.kl-up .n{font-weight:700;display:block;line-height:1.1;margin:2px 0}
.kl-up .c{font-weight:900;display:block;font-variant-numeric:tabular-nums}
.kl-up .p{display:flex;gap:2px;justify-content:center;margin-top:2px;min-height:5px}
.kl-up .p i{width:5px;height:5px;border-radius:3px;background:var(--line)}
.kl-up .p i.on{background:var(--accent)}
.kl-up.can{opacity:1;border-color:#22c55e;box-shadow:0 0 0 3px #22c55e33;animation:kl-pulse 1.2s infinite}
.kl-up:active{transform:scale(.94)}
.kl-up.max{opacity:.9;border-color:#eab308}
.kl-float{position:absolute;left:0;top:0;font-weight:900;pointer-events:none;animation:kl-fl 1.1s ease-out forwards;white-space:nowrap}
@keyframes kl-fl{0%{opacity:0;transform:translateY(10px) scale(.7)}15%{opacity:1}100%{opacity:0;transform:translateY(-46px) scale(1.2)}}
.kl-toast{position:absolute;left:50%;top:70px;transform:translateX(-50%);background:#111c;color:#fff;border-radius:14px;padding:8px 14px;font-weight:800;z-index:5;animation:kl-fl 2s ease-out forwards;white-space:nowrap}
.kl-ov{position:absolute;inset:0;background:color-mix(in srgb,var(--card) 92%,transparent);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;padding:20px;z-index:9}
.kl-ov h2{margin:0;font-size:26px}
.kl-ov p{margin:0;max-width:320px;opacity:.85;line-height:1.35}
.kl-ov .big{font-size:64px;animation:kl-pulse 1.2s infinite}
.kl-btn{border:0;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:16px;font:inherit;font-weight:900;font-size:18px;padding:12px 28px;cursor:pointer;box-shadow:0 6px 16px #6366f166}
.kl-btn:active{transform:scale(.96)}
`;

export default {
  id: 'klassiek', name: 'Klassiek', emoji: '💰', color: '#6366f1',
  desc: 'Verdien geld met goede antwoorden en koop upgrades. Wie is na 4 minuten het rijkst?',
  tags: ['geld', 'solo', 'upgrades'], minutes: 4, duo: false,
  create(host, env) {
    const style = addCss('klassiek', CSS);
    const fx = fxOf(env);
    const rand = env.rand || Math.random;
    const LIMIT = 240 + fx.timeBonus;
    const root = E('div', 'kl-root'); host.appendChild(root);
    let dead = false, ended = false, cur = null, started = false, timeLeft = LIMIT, goldT = 0, goldNext = 60, nQ = 0, interval = 0, last = 0;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };

    const st = Eco.newState(fx);
    const bots = makeBots(env.level || 2, rand, 4);
    const me = { name: env.name || 'Jij', emoji: '😎', st, me: true };

    // ---- DOM
    const hud = E('div', 'kl-hud');
    const cashEl = E('div', 'kl-cash'); const cashNum = E('span', '', '0'); const cashSub = E('small', '', ''); cashEl.append(E('span', '', '💰 '), cashNum, cashSub);
    const stChip = E('div', 'kl-chip', '🔥 0'); const tChip = E('div', 'kl-chip', '4:00');
    hud.append(cashEl, stChip, tChip);
    const timebar = E('div', 'kl-time'); const timefill = E('i'); timebar.appendChild(timefill);
    const board = E('div', 'kl-board');
    const qhost = E('div', 'kl-q');
    const shop = E('div', 'kl-shop');
    const upEls = {};
    for (const u of UPS) {
      const b = E('button', 'kl-up'); b.type = 'button';
      const e = E('span', 'e', u.emoji), n = E('span', 'n', u.name), c = E('span', 'c', ''), p = E('span', 'p');
      b.append(e, n, c, p); b.title = u.desc;
      b.addEventListener('click', () => buy(u.id));
      upEls[u.id] = { b, c, p }; shop.appendChild(b);
    }
    root.append(hud, timebar, board, qhost, shop);

    let shown = 0;
    function refresh() {
      const target = st.cash; shown += (target - shown) * 0.35; if (Math.abs(target - shown) < 1) shown = target;
      cashNum.textContent = fmt(shown);
      const r = Eco.rate(st); cashSub.textContent = r > 0 ? '+' + fmt(r) + ' per seconde' : 'per goed antwoord: ' + fmt(Eco.gain(st, 9999, fx, goldT > 0 ? 2 : 1));
      stChip.textContent = '🔥 ' + st.streak + (st.shield ? '  🛡️' + st.shield : '');
      const m = Math.max(0, Math.floor(timeLeft)); tChip.textContent = '⏱ ' + Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
      timefill.style.width = clamp(timeLeft / LIMIT * 100, 0, 100) + '%';
      for (const u of UPS) {
        const el = upEls[u.id], c = Eco.next(st, u.id), l = st.lvl[u.id];
        el.c.textContent = c == null ? 'MAX' : '$' + fmt(c);
        el.b.className = 'kl-up' + (c == null ? ' max' : st.cash >= c ? ' can' : '');
        clr(el.p); for (let i = 0; i < u.cost.length; i++) el.p.appendChild(E('i', i < l ? 'on' : ''));
      }
      root.className = 'kl-root' + (goldT > 0 ? ' kl-gold' : '');
    }
    function standings() {
      return [me, ...bots].map((x) => ({ x, v: x.st.cash })).sort((a, b) => b.v - a.v);
    }
    function drawBoard() {
      const s = standings(); clr(board);
      const myI = s.findIndex((o) => o.x.me);
      const show = s.slice(0, 3); if (myI > 2) show[2] = s[myI];
      show.forEach((o) => {
        const i = s.indexOf(o);
        const d = E('div', 'kl-bi' + (o.x.me ? ' me' : ''));
        d.append(E('span', '', (i + 1) + '.'), E('span', '', o.x.emoji), E('b', '', o.x.name), E('span', '', fmt(o.v)));
        board.appendChild(d);
      });
    }
    function floatTxt(t, color) {
      const f = E('div', 'kl-float', t); f.style.color = color || '#fff'; f.style.left = (40 + rand() * 120) + 'px'; f.style.top = '6px';
      cashEl.appendChild(f); later(() => f.remove(), 1200);
    }
    function toast(t) { const d = E('div', 'kl-toast', t); root.appendChild(d); later(() => d.remove(), 2000); }
    function buy(id) {
      if (!started || ended) return;
      if (Eco.buy(st, id)) { env.snd.play('power'); const u = UPS.find((x) => x.id === id); toast(u.emoji + ' ' + u.name + ' niveau ' + st.lvl[id]); refresh(); }
      else env.snd.play('klik');
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
        if (ok) { const g = Eco.correct(st, r.ms || 9999, fx, goldT > 0 ? 2 : 1); env.snd.play('munt'); floatTxt('+$' + fmt(g), '#fde047'); if (st.streak && st.streak % 5 === 0) toast('🔥 ' + st.streak + ' op rij!'); }
        else { const l = Eco.wrong(st); env.snd.play('fout'); floatTxt(l ? '-$' + fmt(l) : '🛡️ geblokt', '#fca5a5'); }
        refresh(); later(nextQuestion, 50);
      }).catch(() => { if (!dead && !ended && cur === h) { cur = null; later(nextQuestion, 300); } });
    }

    // ---- klok
    function tick() {
      if (dead || ended || !started) return;
      const nowT = performance.now(); let dt = (nowT - last) / 1000; last = nowT; dt = clamp(dt, 0, 0.5);
      timeLeft -= dt;
      const elapsed = LIMIT - timeLeft;
      if (elapsed >= goldNext && goldNext < LIMIT - 20) { goldT = 15; goldNext += 60; toast('💥 Gouden kwartiertje! Dubbel geld 15 s'); env.snd.play('level'); }
      if (goldT > 0) goldT -= dt;
      Eco.tickBank(st, dt);
      const gold = goldT > 0 ? 2 : 1;
      for (const b of bots) botTick(b, dt, rand, gold);
      refresh(); if (Math.floor(elapsed * 2) !== tick.k) { tick.k = Math.floor(elapsed * 2); drawBoard(); }
      if (timeLeft <= 0) finish();
    }

    function finish() {
      if (ended) return; ended = true;
      if (cur) { try { cur.cancel(); } catch (e) { /* */ } cur = null; }
      const s = standings(); const rank = s.findIndex((o) => o.x.me) + 1;
      const ov = E('div', 'kl-ov'); ov.append(E('div', 'big', rank === 1 ? '🏆' : '⏰'), E('h2', '', rank === 1 ? 'Jij wint!' : 'Tijd om!'), E('p', '', 'Je bent ' + rank + 'e met $' + fmt(st.cash) + '.'));
      root.appendChild(ov); env.snd.play(rank === 1 ? 'win' : 'level');
      later(() => {
        env.end({ score: Math.round(st.cash), win: rank === 1, stats: { correct: st.correct, wrong: st.wrong, 'beste reeks': st.best, upgrades: st.buys, plek: rank }, summary: 'Plek ' + rank + ' van ' + (bots.length + 1) + ' met $' + fmt(st.cash) + ' · ' + st.correct + ' goed, ' + st.buys + ' upgrades.' });
      }, 1600);
    }

    function start() {
      if (started) return; started = true; last = performance.now(); tick.k = -1;
      interval = setInterval(tick, 100);
      refresh(); drawBoard(); nextQuestion();
    }

    const intro = E('div', 'kl-ov');
    intro.append(E('div', 'big', '💰'), E('h2', '', 'Klassiek'), E('p', '', 'Elk goed antwoord brengt geld op. Koop onderaan upgrades zodat je steeds meer verdient en een fout minder pijn doet.'), (() => { const b = E('button', 'kl-btn', 'Tik om te beginnen'); b.type = 'button'; b.addEventListener('click', () => { intro.remove(); start(); }); return b; })());
    root.appendChild(intro); refresh(); drawBoard();

    return {
      destroy() {
        dead = true; if (interval) clearInterval(interval);
        timers.forEach((t) => clearTimeout(t)); timers.clear();
        if (cur) { try { cur.cancel(); } catch (e) { /* */ } cur = null; }
        root.remove(); style.remove();
      },
    };
  },
};
