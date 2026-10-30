// Pizzatent – bak pizza's voor hongerige klanten. Elk goed antwoord bakt verder; koop upgrades in je zaak.
// Pure logica (createPizza) is los testbaar; de view onderaan gebruikt alleen env.ask voor vragen.

/* ---------- helpers ---------- */
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const fmt = n => Math.round(n).toLocaleString('nl-NL');
const mmss = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function fallbackQ(rand) { const a = 2 + Math.floor(rand() * 8), b = 2 + Math.floor(rand() * 8); const r = a * b; return { t: 'mc', q: a + ' × ' + b + ' = ?', a: String(r), o: [String(r), String(r + a), String(r - b), String(r + 2)].sort(() => rand() - 0.5), d: 1 }; }
function mkQSource(env) {
  let buf = [];
  return () => {
    if (!buf.length) { try { buf = (env.pick(10, {}) || []).slice(); } catch (e) { buf = []; } }
    return buf.shift() || fallbackQ(env.rand || Math.random);
  };
}
function mkAsker(env, panel, nextQ) {
  let h = null, tok = 0;
  return {
    busy() { return !!h; },
    start(opts, cb) {
      this.cancel();
      const q = nextQ(), my = ++tok, box = el('div'); panel.appendChild(box);
      try { h = env.ask(box, q, opts); } catch (e) { h = null; setTimeout(() => { if (my === tok) cb({ ok: false, ms: 0 }, q); }, 0); return q; }
      h.promise.then(r => {
        if (my !== tok) return; h = null;
        try { env.report({ q, ok: !!r.ok, ms: r.ms || 0 }); } catch (e) { /* hub */ }
        cb(r, q);
      }, () => {});
      return q;
    },
    cancel() { tok++; if (h) { try { h.cancel(); } catch (e) { /* ok */ } h = null; } panel.innerHTML = ''; },
  };
}

/* ---------- pure logica ---------- */
export const PIZZA_DAY = 240;
export const PIZZA_TARGET = { 1: 450, 2: 700, 3: 950 };
export const PIZZA_UPG = [
  { id: 'oven', name: 'Steenoven', emoji: '🔥', desc: 'Elk goed antwoord bakt meer', costs: [35, 80, 150, 260] },
  { id: 'menu', name: 'Groter menu', emoji: '📜', desc: 'Grotere, duurdere pizza\'s', costs: [50, 120, 230] },
  { id: 'scooter', name: 'Bezorgscooter', emoji: '🛵', desc: 'Meer fooi', costs: [45, 100, 190] },
  { id: 'patience', name: 'Gezellige zaak', emoji: '🪑', desc: 'Klanten wachten langer', costs: [30, 75, 140] },
  { id: 'tables', name: 'Extra tafel', emoji: '🍽️', desc: 'Meer klanten tegelijk', costs: [70, 170] },
  { id: 'helper', name: 'Hulpkok', emoji: '👨‍🍳', desc: 'Bakt zelf een beetje mee', costs: [90, 200, 360] },
  { id: 'sign', name: 'Neonbord', emoji: '💡', desc: 'Er komen meer klanten', costs: [60, 140, 260] },
];
const TOP = ['🍅', '🧀', '🍄', '🌶️', '🫒', '🍍', '🥓', '🌽'];
const FACES = ['👵', '👨‍🦰', '🧒', '👩‍🚀', '🧑‍🎤', '🐻', '🐱', '🦊', '🐸', '🤖'];

export function createPizza({ level = 2, rand = Math.random, fx = {} } = {}) {
  const lvF = level === 1 ? 1.3 : level === 3 ? 0.85 : 1;
  const S = { t: 0, coins: Math.round(fx.startCash || 0), earned: 0, served: 0, lost: 0, combo: 0, best: 0, correct: 0, wrong: 0, custs: [], up: {}, id: 1, spawnIn: 0.4, helperIn: 0 };
  PIZZA_UPG.forEach(u => { S.up[u.id] = 0; });
  const ppa = () => 1 + 0.5 * S.up.oven;
  const slots = () => 2 + S.up.tables;
  const interval = () => Math.max(4.5, (10.5 - 1.2 * S.up.sign) - S.t / 70) * (level === 1 ? 1.15 : level === 3 ? 0.9 : 1);
  const m = { S, ppa, slots };
  m.done = () => S.t >= PIZZA_DAY;
  m.urgent = () => S.custs.reduce((b, c) => (!b || c.left < b.left ? c : b), null);
  function spawn() {
    const first = S.served + S.lost === 0 && S.custs.length === 0;
    const maxLen = 2 + S.up.menu;
    const len = first ? 1 : 1 + Math.floor(rand() * maxLen);
    const want = []; for (let i = 0; i < len; i++) want.push(TOP[Math.floor(rand() * TOP.length)]);
    const pat = (28 + 6 * len) * (1 + 0.2 * S.up.patience) * lvF;
    const c = { id: S.id++, face: FACES[Math.floor(rand() * FACES.length)], want, need: len, prog: 0, pat, left: pat, price: 10 + 8 * len + 4 * S.up.menu * len / 2 };
    S.custs.push(c); return c;
  }
  function deliver(c) {
    const stk = (0.05 + (fx.streakBonus || 0)) * Math.min(S.combo, 10);
    const base = c.price * (1 + stk) * (fx.cashMult || 1);
    const tip = c.price * 0.5 * clamp(c.left / c.pat, 0, 1) * (1 + 0.3 * S.up.scooter);
    const pay = Math.round(base + tip);
    S.coins += pay; S.earned += pay; S.served++;
    S.custs = S.custs.filter(x => x !== c);
    return { type: 'sale', id: c.id, pay, tip: Math.round(tip) };
  }
  m.answer = (id, ok) => {
    const c = S.custs.find(x => x.id === id); if (!c) return null;
    const ev = [];
    if (ok) {
      S.correct++; S.combo++; S.best = Math.max(S.best, S.combo); c.prog += ppa();
      ev.push({ type: 'good', id });
      if (c.prog >= c.need - 1e-9) ev.push(deliver(c));
    } else {
      S.wrong++; S.combo = 0; c.prog = Math.max(0, c.prog - 0.5); c.left -= 4;
      ev.push({ type: 'bad', id });
    }
    return ev;
  };
  m.tick = dt => {
    const ev = []; S.t += dt;
    for (const c of S.custs.slice()) { c.left -= dt; if (c.left <= 0) { S.custs = S.custs.filter(x => x !== c); S.lost++; S.combo = 0; ev.push({ type: 'left', id: c.id }); } }
    S.spawnIn -= dt;
    if (S.spawnIn <= 0) { if (S.custs.length < slots()) { const c = spawn(); ev.push({ type: 'spawn', id: c.id }); } S.spawnIn = interval(); }
    if (S.up.helper > 0 && S.custs.length) {
      S.helperIn -= dt;
      if (S.helperIn <= 0) {
        S.helperIn = 14 - 3 * S.up.helper;
        const c = S.custs.reduce((b, x) => (!b || x.prog > b.prog ? x : b), null);
        if (c) { c.prog += ppa() * 0.5; ev.push({ type: 'help', id: c.id }); if (c.prog >= c.need - 1e-9) ev.push(deliver(c)); }
      }
    }
    return ev;
  };
  m.cost = id => { const u = PIZZA_UPG.find(x => x.id === id); return S.up[id] >= u.costs.length ? null : u.costs[S.up[id]]; };
  m.buy = id => { const c = m.cost(id); if (c == null || S.coins < c) return false; S.coins -= c; S.up[id]++; return true; };
  m.target = PIZZA_TARGET[level] || PIZZA_TARGET[2];
  return m;
}

/* ---------- stijl ---------- */
const CSS = `
.pz-root{position:relative;display:flex;flex-direction:column;width:100%;box-sizing:border-box;background:var(--card);color:var(--ink);border-radius:14px;overflow:hidden;font-family:inherit;user-select:none;-webkit-user-select:none}
.pz-hud{display:flex;justify-content:space-between;align-items:center;gap:6px;padding:8px 12px;font-weight:800;font-size:15px;border-bottom:1px solid var(--line)}
.pz-hud b{font-variant-numeric:tabular-nums}
.pz-shop{position:relative;flex:1 1 auto;min-height:170px;padding:8px;background:linear-gradient(#fde7c8,#f6c99a 60%,#c98a52 60%,#a8693a);color:#3b2412;overflow:hidden}
.pz-row{display:flex;gap:6px;justify-content:center;flex-wrap:nowrap}
.pz-c{flex:1 1 0;max-width:92px;min-width:0;background:#fffaf0;border:2px solid #e6c9a0;border-radius:12px;padding:4px 3px;text-align:center;cursor:pointer;transition:transform .15s,box-shadow .15s}
.pz-c.sel{border-color:#ef4444;box-shadow:0 0 0 3px rgba(239,68,68,.3);transform:translateY(-3px)}
.pz-c .f{font-size:26px;line-height:1.1}.pz-c .w{font-size:13px;min-height:17px;letter-spacing:-1px}
.pz-bar{height:6px;border-radius:4px;background:rgba(0,0,0,.12);margin:2px 2px;overflow:hidden}
.pz-bar>i{display:block;height:100%;width:0;transition:width .25s linear;background:#22c55e}
.pz-bar.p>i{background:#f59e0b}
.pz-stage{position:relative;margin:8px auto 0;text-align:center}
.pz-pizza{position:relative;width:88px;height:88px;margin:0 auto;border-radius:50%;background:radial-gradient(circle at 40% 35%,#ffe08a,#f2b04a 70%,#d98a2b);box-shadow:0 4px 0 #b36a1e,0 8px 14px rgba(0,0,0,.25);transition:transform .2s}
.pz-pizza.bump{transform:scale(1.1) rotate(8deg)}
.pz-pizza span{position:absolute;font-size:18px;transition:opacity .3s,transform .3s}
.pz-pizza span.off{opacity:.2;filter:grayscale(1)}
.pz-hint{font-size:12px;font-weight:700;margin-top:4px;opacity:.85}
.pz-road{position:absolute;left:0;right:0;bottom:2px;height:26px;pointer-events:none}
.pz-scoot{position:absolute;bottom:0;left:-40px;font-size:24px;animation:pzride 1.6s linear forwards}
@keyframes pzride{to{left:110%}}
.pz-pop{position:absolute;left:50%;top:30%;font-weight:900;font-size:20px;color:#15803d;text-shadow:0 1px 0 #fff;animation:pzpop 1.1s ease-out forwards;pointer-events:none;white-space:nowrap}
.pz-pop.bad{color:#b91c1c}
@keyframes pzpop{from{transform:translate(-50%,0);opacity:1}to{transform:translate(-50%,-48px);opacity:0}}
.pz-ups{display:flex;gap:5px;overflow-x:auto;padding:6px 8px;border-top:1px solid var(--line);-webkit-overflow-scrolling:touch}
.pz-up{flex:0 0 auto;border:1.5px solid var(--line);background:var(--card);color:var(--ink);border-radius:10px;padding:4px 8px;font-size:12px;font-weight:700;line-height:1.2;cursor:pointer;text-align:left;min-width:92px}
.pz-up small{display:block;font-weight:600;opacity:.75}
.pz-up.can{border-color:#22c55e;background:rgba(34,197,94,.14)}
.pz-up.max{opacity:.55}
.pz-panel{flex:0 0 auto;min-height:210px;padding:6px 8px 10px;border-top:1px solid var(--line)}
.pz-wait{padding:36px 10px;text-align:center;font-weight:700;opacity:.7}
.pz-ov{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:20px;text-align:center;background:rgba(20,10,5,.82);color:#fff}
.pz-ov h2{margin:0;font-size:26px}.pz-ov p{margin:0;max-width:300px;font-size:15px;line-height:1.35}
.pz-btn{background:var(--accent,#6366f1);color:#fff;border:0;border-radius:12px;padding:12px 26px;font-size:17px;font-weight:800;cursor:pointer}
`;

/* ---------- het spel ---------- */
export default {
  id: 'pizza', name: 'Pizzatent', emoji: '🍕', color: '#ef4444',
  desc: 'Bak pizza\'s voor hongerige klanten: elk goed antwoord bakt verder. Koop betere ovens, scooters en een hulpkok!',
  tags: ['geld', 'snel', 'solo'], minutes: 4, duo: false,
  create(host, env) {
    let dead = false, ended = false, cool = false, askFor = 0, sel = 0, iv = 0;
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms); timers.add(id); return id; };
    const snd = n => { try { env.snd && env.snd.play(n); } catch (e) { /* stil */ } };
    const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    host.innerHTML = '';
    const root = el('div', 'pz-root'); root.style.height = Math.max(520, env.h || 600) + 'px'; host.appendChild(root);
    const m = createPizza({ level: env.level, rand: env.rand || Math.random, fx: env.fx || {} });
    const S = m.S;
    const hud = el('div', 'pz-hud'); const coinsEl = el('b'), comboEl = el('b'), timeEl = el('b');
    hud.append(coinsEl, comboEl, timeEl); root.appendChild(hud);
    const shop = el('div', 'pz-shop'), row = el('div', 'pz-row'), stage = el('div', 'pz-stage'), pizza = el('div', 'pz-pizza'), hint = el('div', 'pz-hint'), road = el('div', 'pz-road');
    stage.append(pizza, hint); shop.append(row, stage, road); root.appendChild(shop);
    const ups = el('div', 'pz-ups'); root.appendChild(ups);
    const panel = el('div', 'pz-panel'); root.appendChild(panel);
    const ak = mkAsker(env, panel, mkQSource(env));

    // upgrade-knoppen
    const upEls = PIZZA_UPG.map(u => {
      const b = el('button', 'pz-up'); b.type = 'button';
      b.addEventListener('click', () => { if (m.buy(u.id)) { snd('power'); pop('⬆️ ' + u.name); renderUps(); renderHud(); } else snd('fout'); });
      ups.appendChild(b); return { u, b };
    });
    function renderUps() {
      for (const { u, b } of upEls) {
        const c = m.cost(u.id), lvl = S.up[u.id];
        b.className = 'pz-up' + (c == null ? ' max' : S.coins >= c ? ' can' : '');
        b.innerHTML = u.emoji + ' ' + u.name + ' <small>' + (c == null ? 'MAX' : 'Lv ' + lvl + ' · 💰' + c) + '</small>';
        b.title = u.desc;
      }
    }
    function renderHud() {
      coinsEl.textContent = '💰 ' + fmt(S.coins);
      comboEl.textContent = S.combo >= 2 ? '🔥 ×' + S.combo : '🍕 ' + S.served;
      timeEl.textContent = '⏱ ' + mmss(PIZZA_DAY - S.t);
    }
    function pop(txt, bad) { const p = el('div', 'pz-pop' + (bad ? ' bad' : ''), txt); shop.appendChild(p); later(() => p.remove(), 1200); }

    // klantkaarten
    const cards = new Map();
    function syncCards() {
      const ids = S.custs.map(c => c.id).join(',');
      if (syncCards.k !== ids) {
        syncCards.k = ids; row.innerHTML = ''; cards.clear();
        for (const c of S.custs) {
          const d = el('div', 'pz-c'), f = el('div', 'f', c.face), w = el('div', 'w', c.want.join('')), pb = el('div', 'pz-bar'), pi = el('i'), tb = el('div', 'pz-bar p'), ti = el('i');
          pb.appendChild(pi); tb.appendChild(ti); d.append(f, w, pb, tb);
          d.addEventListener('click', () => { if (ended) return; sel = c.id; renderSel(); ensureAsk(true); });
          row.appendChild(d); cards.set(c.id, { d, pi, ti });
        }
      }
      for (const c of S.custs) {
        const k = cards.get(c.id); if (!k) continue;
        k.pi.style.width = clamp(c.prog / c.need, 0, 1) * 100 + '%';
        const r = clamp(c.left / c.pat, 0, 1); k.ti.style.width = r * 100 + '%'; k.ti.style.background = r < 0.3 ? '#ef4444' : r < 0.6 ? '#f59e0b' : '#22c55e';
      }
      renderSel();
    }
    function renderSel() {
      for (const [id, k] of cards) k.d.className = 'pz-c' + (id === sel ? ' sel' : '');
      const c = S.custs.find(x => x.id === sel);
      pizza.innerHTML = '';
      if (c) {
        c.want.forEach((t, i) => {
          const s = el('span', i < Math.floor(c.prog + 1e-9) ? '' : 'off', t); const a = (i / c.want.length) * 6.283 + 0.6, r = c.want.length === 1 ? 0 : 24;
          s.style.left = 35 + Math.cos(a) * r + 'px'; s.style.top = 34 + Math.sin(a) * r + 'px'; pizza.appendChild(s);
        });
        hint.textContent = 'Bestelling: ' + c.want.join(' ') + ' · stap ' + Math.min(c.need, Math.floor(c.prog) + 1) + '/' + c.need;
      } else hint.textContent = 'Wachten op klanten…';
    }
    function ensureAsk(force) {
      if (ended || dead) return;
      let c = S.custs.find(x => x.id === sel);
      if (!c) { c = m.urgent(); sel = c ? c.id : 0; renderSel(); }
      if (!c) { ak.cancel(); askFor = 0; panel.innerHTML = '<div class="pz-wait">🕐 Even wachten op de volgende klant…</div>'; return; }
      if (!force && askFor === c.id && ak.busy()) return;
      if (cool && !force) return;
      cool = false; askFor = c.id;
      ak.start({ compact: true, feedback: true, autoNext: 500 }, r => {
        askFor = 0; const ev = m.answer(c.id, r.ok); if (!ev) { ensureAsk(); return; }
        snd(r.ok ? 'goed' : 'fout');
        if (r.ok) { pizza.className = 'pz-pizza bump'; later(() => { pizza.className = 'pz-pizza'; }, 220); }
        for (const e of ev) if (e.type === 'sale') { snd('munt'); pop('+' + e.pay + ' 💰' + (e.tip > 2 ? ' (fooi ' + e.tip + ')' : '')); const s = el('div', 'pz-scoot', '🛵🍕'); road.appendChild(s); later(() => s.remove(), 1700); }
        if (!r.ok) pop('Oeps! −4s', true);
        cool = true; later(() => { cool = false; ensureAsk(); }, r.ok ? 250 : 1000);
        syncCards(); renderHud(); renderUps();
      });
    }

    function frame() {
      if (ended || dead || !root.isConnected) return;
      const ev = m.tick(0.1);
      for (const e of ev) {
        if (e.type === 'left') { snd('lose'); pop('😞 Klant weg', true); if (e.id === askFor) { ak.cancel(); askFor = 0; cool = false; } }
        if (e.type === 'help') pop('👨‍🍳 +hulp');
        if (e.type === 'sale') { snd('munt'); pop('+' + e.pay + ' 💰'); }
        if (e.type === 'spawn') snd('klik');
      }
      syncCards(); renderHud(); renderUps();
      if (!cool && (!askFor || !ak.busy())) ensureAsk();
      if (m.done()) finish();
    }
    function finish() {
      if (ended) return; ended = true; ak.cancel(); clearInterval(iv);
      const win = S.earned >= m.target;
      const ov = el('div', 'pz-ov', '<h2>🔔 Sluitingstijd!</h2><p>Je verdiende 💰 ' + fmt(S.earned) + ' met ' + S.served + ' pizza\'s.' + (win ? ' Doel gehaald!' : ' Doel was ' + m.target + '.') + '</p>');
      root.appendChild(ov); snd(win ? 'win' : 'level');
      later(() => {
        try { env.end({ score: S.earned, win, stats: { correct: S.correct, wrong: S.wrong, 'best streak': S.best, pizzas: S.served, 'klanten kwijt': S.lost }, summary: S.served + ' pizza\'s bezorgd, 💰 ' + fmt(S.earned) + ' verdiend' }); } catch (e) { /* hub */ }
      }, 1800);
    }

    // intro
    const intro = el('div', 'pz-ov', '<h2>🍕 Pizzatent</h2><p>Tik op een klant en beantwoord vragen: elk goed antwoord bakt de pizza verder. Snel bezorgen = meer fooi. Koop upgrades onderin!</p>');
    const go = el('button', 'pz-btn', 'Tik om te beginnen'); go.type = 'button';
    go.addEventListener('click', () => { intro.remove(); snd('klik'); iv = setInterval(frame, 100); ensureAsk(); });
    intro.appendChild(go); root.appendChild(intro);
    renderUps(); renderHud(); renderSel();

    return {
      destroy() {
        dead = true; clearInterval(iv); timers.forEach(clearTimeout); timers.clear();
        try { ak.cancel(); } catch (e) { /* ok */ }
        style.remove(); try { host.innerHTML = ''; } catch (e) { /* ok */ }
      },
    };
  },
};
