// ---- hulpfuncties (zelfstandig in dit bestand) ----
const h = (tag, css, kids, fn) => {
  const e = document.createElement(tag);
  if (css) e.style.cssText = css;
  if (kids && typeof kids === 'object' && !Array.isArray(kids)) kids = [kids];
  if (Array.isArray(kids)) {
    for (const k of kids) { if (k == null || k === false) continue; e.appendChild(typeof k === 'object' ? k : document.createTextNode(String(k))); }
  } else if (kids != null) e.textContent = String(kids);
  if (fn) e.addEventListener('click', () => fn());
  return e;
};
const fmt = (n) => '€' + Math.floor(n).toLocaleString('nl-NL');
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const btn = (txt, bg, fn, css = '') => h('button', `min-height:48px;padding:8px 10px;border:0;border-radius:12px;background:${bg};color:#fff;font-size:15px;font-weight:700;touch-action:manipulation;cursor:pointer;font-family:inherit;${css}`, txt, fn);
const box = (extra = '') => `background:rgba(255,255,255,.13);border-radius:12px;padding:8px 10px;box-sizing:border-box;${extra}`;
const bar = (pct, col = '#4ade80') => {
  const o = h('div', 'height:8px;border-radius:4px;background:rgba(0,0,0,.4);overflow:hidden;flex:none;width:100%');
  const i = h('div', `height:100%;width:${clamp(pct, 0, 1) * 100}%;background:${col}`);
  o.appendChild(i);
  o.set = (p, c) => { i.style.width = clamp(p, 0, 1) * 100 + '%'; if (c) i.style.background = c; };
  return o;
};
function makeApp(host, bg) {
  host.style.touchAction = 'pan-y';
  const root = h('div', `position:absolute;left:0;top:0;width:100%;height:100%;display:flex;flex-direction:column;font-family:system-ui,sans-serif;color:#fff;user-select:none;overflow:hidden;box-sizing:border-box;background:${bg}`);
  const head = h('div', 'flex:none;padding:8px 12px;background:rgba(0,0,0,.4);font-weight:700;font-size:15px;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap');
  const body = h('div', 'flex:1;overflow-y:auto;padding:8px 10px 28px;display:flex;flex-direction:column;gap:8px');
  const toastEl = h('div', 'position:absolute;left:50%;bottom:16px;transform:translateX(-50%);background:rgba(0,0,0,.8);color:#fff;padding:8px 14px;border-radius:20px;font-size:14px;font-weight:700;pointer-events:none;opacity:0;transition:opacity .25s;max-width:90%;text-align:center');
  root.append(head, body, toastEl);
  host.appendChild(root);
  let lives = [], plives = [], dead = false, tt = null;
  const timers = new Set(), ivs = new Set();
  const A = {
    root, head, body,
    isDead: () => dead,
    live(e, fn) { lives.push(() => fn(e)); fn(e); return e; },
    hlive(e, fn) { plives.push(() => fn(e)); fn(e); head.appendChild(e); return e; },
    refresh() { for (const f of plives) f(); for (const f of lives) f(); },
    draw(fn) { const st = body.scrollTop; lives = []; const kids = fn(); body.replaceChildren(...kids); body.scrollTop = st; },
    every(fn, ms) { const i = setInterval(() => { if (!dead) fn(); }, ms); ivs.add(i); },
    later(fn, ms) { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); },
    toast(msg) { toastEl.textContent = msg; toastEl.style.opacity = '1'; if (tt) { clearTimeout(tt); timers.delete(tt); } tt = setTimeout(() => { toastEl.style.opacity = '0'; }, 1600); timers.add(tt); },
    destroy() { dead = true; ivs.forEach(clearInterval); timers.forEach(clearTimeout); root.remove(); },
  };
  return A;
}
const sec = (t) => h('div', 'font-size:13px;font-weight:800;opacity:.8;margin-top:2px;letter-spacing:.5px', t);
const row = (kids, css = '') => h('div', `display:flex;gap:6px;flex-wrap:wrap;${css}`, kids);
// ---- einde hulpfuncties ----
const ST = { s: { e: '🚿', n: 'Spuiten' }, z: { e: '🧼', n: 'Zeep' }, b: { e: '🪥', n: 'Borstelen' }, w: { e: '✨', n: 'Wax' }, d: { e: '💨', n: 'Drogen' } };
const PR = [
  { id: 'basis', n: 'Basis', st: ['s', 'z', 'd'], p: 8, u: 0 },
  { id: 'deluxe', n: 'Deluxe', st: ['s', 'z', 'b', 'd'], p: 17, u: 150 },
  { id: 'premium', n: 'Premium', st: ['s', 'z', 'b', 'w', 'd'], p: 32, u: 600 },
];
const CARS = [{ e: '🚗', m: 1 }, { e: '🚙', m: 1.2 }, { e: '🚕', m: 1 }, { e: '🚐', m: 1.5 }, { e: '🚚', m: 2 }];
export default {
  id: 'autowasserette',
  name: 'Autowasserette',
  emoji: '🚗',
  hint: 'Zet auto\'s in de wasstraat en tik per fase. Snel en goed = reputatie!',
  create(host, api) {
    const A = makeApp(host, 'linear-gradient(160deg,#0369a1,#0f172a)');
    const S = { money: 0, total: 0, rep: 20, lanes: 1, pow: 0, arm: 0, wax: 0, served: 0, lost: 0 };
    let queue = [], lanes = [null], sp = 1.5, nid = 1, dirty = true;
    const unl = (p) => S.total >= p.u;
    const tapV = () => 1.6 + S.pow * 0.9;
    const armV = () => S.arm * 1.2;
    const stars = () => 1 + Math.floor(S.rep / 25);
    const price = (c) => Math.round(c.pr.p * c.car.m * (1 + S.wax * 0.15) * (1 + S.rep / 250));
    const cst = { lane: () => 180, pow: () => Math.round(35 * Math.pow(1.8, S.pow)), arm: () => Math.round(90 * Math.pow(2, S.arm)), wax: () => Math.round(60 * Math.pow(2, S.wax)) };
    const earn = (n) => { S.money += n; S.total += n; api.score(Math.floor(S.total)); };

    function load(c) {
      const i = lanes.findIndex((l) => !l);
      if (i < 0) return A.toast('Wasstraat bezet!');
      lanes[i] = { c, st: 0, w: 0, need: 10 * c.car.m, t: 0, par: (c.pr.st.length * 10 * c.car.m) / (tapV() * 2.2) + 3 };
      queue = queue.filter((x) => x !== c); dirty = true; render();
    }
    function done(l, i) {
      const c = l.c, fast = l.t <= l.par;
      let v = price(c) + (fast ? Math.ceil(price(c) * 0.3) : 0);
      earn(v); S.served++; S.rep = clamp(S.rep + (fast ? 3 : 0.5), 0, 100);
      A.toast((fast ? '⚡ Supersnel! +' : '✅ Schoon! +') + fmt(v));
      lanes[i] = null; dirty = true;
    }
    function work(i, key) {
      const l = lanes[i]; if (!l) return;
      if (l.c.pr.st[l.st] !== key) return A.toast('Eerst fase ' + ST[l.c.pr.st[l.st]].n + '!');
      l.w += tapV(); advance(l, i); if (!dirty) A.refresh(); else render();
    }
    function advance(l, i) {
      if (l.w >= l.need) { l.w = 0; l.st++; dirty = true; if (l.st >= l.c.pr.st.length) done(l, i); }
    }
    function buy(k) {
      const lim = { lane: S.lanes >= 2, pow: S.pow >= 8, arm: S.arm >= 6, wax: S.wax >= 5 }[k];
      if (lim) return A.toast('Maximaal!');
      const c = cst[k](); if (S.money < c) return A.toast('Te weinig geld');
      S.money -= c; if (k === 'lane') { S.lanes++; lanes.push(null); } else S[k]++;
      dirty = true; render();
    }
    function tick() {
      const dt = 0.2;
      sp -= dt;
      if (sp <= 0) {
        sp = rnd(30, 60) / 10 / (1 + S.rep / 80);
        if (queue.length < 5) {
          const av = PR.filter(unl);
          queue.push({ id: nid++, car: pick(CARS), pr: Math.random() < 0.5 ? av[0] : pick(av), pat: 30, max: 30 }); dirty = true;
        }
      }
      for (const c of queue) c.pat -= dt;
      const gone = queue.filter((c) => c.pat <= 0);
      if (gone.length) { queue = queue.filter((c) => c.pat > 0); S.lost += gone.length; S.rep = clamp(S.rep - 5 * gone.length, 0, 100); A.toast('😠 Auto reed weg (reputatie omlaag)'); dirty = true; }
      lanes.forEach((l, i) => {
        if (!l) return;
        l.t += dt;
        if (S.arm > 0) { l.w += armV() * dt; advance(l, i); }
      });
      if (dirty) { dirty = false; render(); } else A.refresh();
    }
    A.hlive(h('span'), (e) => { e.textContent = '💰 ' + fmt(S.money); });
    A.hlive(h('span'), (e) => { e.textContent = '⭐'.repeat(stars()) + ' ' + Math.floor(S.rep) + '%'; });
    A.hlive(h('span'), (e) => { e.textContent = '🚗 ' + S.served; });

    function render() {
      dirty = false;
      while (lanes.length < S.lanes) lanes.push(null);
      A.draw(() => {
        const out = [];
        out.push(sec('🅿️ WACHTENDE AUTO\'S (tik om de wasstraat in te rijden)'));
        const qr = row([], 'min-height:78px');
        if (!queue.length) qr.appendChild(h('div', 'opacity:.7;padding:10px', 'Geen auto\'s in de rij'));
        for (const c of queue) {
          const b = bar(1);
          const card = h('div', box('flex:1;min-width:28%;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px'), [h('div', 'font-size:30px;line-height:1.1', c.car.e), h('div', 'font-size:11px', c.pr.n + ' · ' + fmt(price(c))), b], () => load(c));
          A.live(card, () => { const p = c.pat / c.max; b.set(p, p > 0.5 ? '#4ade80' : p > 0.25 ? '#facc15' : '#f87171'); });
          qr.appendChild(card);
        }
        out.push(qr);
        out.push(sec('🧽 WASSTRAAT'));
        lanes.forEach((l, i) => {
          const card = h('div', box('display:flex;flex-direction:column;gap:6px'));
          if (!l) { card.appendChild(h('div', 'text-align:center;opacity:.5;padding:16px', 'Baan ' + (i + 1) + ' is vrij')); out.push(card); return; }
          const pr = l.c.pr;
          card.appendChild(h('div', 'display:flex;justify-content:space-between;align-items:center', [h('span', 'font-size:34px', l.c.car.e + '🫧'), h('span', 'font-size:22px', pr.st.map((k, j) => (j < l.st ? '✅' : ST[k].e)).join(' '))]));
          const b = bar(0, '#38bdf8'); A.live(b, () => b.set(l.w / l.need));
          card.appendChild(b);
          const cur = pr.st[l.st];
          card.appendChild(row(pr.st.map((k, j) => { const on = j === l.st; return btn(ST[k].e + ' ' + (on ? 'TIK!' : ''), on ? '#0ea5e9' : '#334155', () => work(i, k), `flex:1;min-width:44px;font-size:${on ? 22 : 18}px;opacity:${j < l.st ? 0.3 : on ? 1 : 0.6}`); })));
          if (cur) card.appendChild(h('div', 'font-size:12px;opacity:.8;text-align:center', 'Nu: ' + ST[cur].n));
          out.push(card);
        });
        out.push(sec('🛒 UPGRADES'));
        const ups = [['lane', '🛣️ Tweede wasbaan', S.lanes >= 2], ['pow', '💪 Sterkere tikken (niv ' + S.pow + ')', S.pow >= 8], ['arm', '🤖 Robotarmen (niv ' + S.arm + ', werken zelf)', S.arm >= 6], ['wax', '✨ Glansspray (+15% prijs, niv ' + S.wax + ')', S.wax >= 5]];
        for (const [k, t, lim] of ups) {
          const b = btn(t, '#7c3aed', () => buy(k), 'width:100%;text-align:left;display:flex;justify-content:space-between;align-items:center;gap:8px');
          b.appendChild(h('span', '', lim ? 'MAX' : fmt(cst[k]())));
          A.live(b, (e) => { e.style.opacity = !lim && S.money >= cst[k]() ? 1 : 0.5; });
          out.push(b);
        }
        const nx = PR.find((p) => !unl(p));
        out.push(h('div', 'font-size:12px;opacity:.75;text-align:center', nx ? 'Volgend programma (' + nx.n + ') bij totaal ' + fmt(nx.u) : 'Alle wasprogramma\'s ontgrendeld!'));
        return out;
      });
    }
    render(); api.score(0);
    A.every(tick, 200);
    return { destroy() { A.destroy(); } };
  },
};
