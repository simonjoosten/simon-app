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
const SZ = [
  { e: '🛩️', n: 'Propellervlucht', pax: [14, 24], fare: 1.5 },
  { e: '✈️', n: 'Passagiersvlucht', pax: [40, 70], fare: 1.4 },
  { e: '🛫', n: 'Grote vlucht', pax: [90, 130], fare: 1.4 },
  { e: '🛬', n: 'Jumbo', pax: [160, 230], fare: 1.5 },
];
const DEST = ['🗼 Parijs', '🗽 New York', '🏝️ Bali', '🏔️ Zürich', '🏜️ Dubai', '🎡 Londen', '🌴 Malaga', '🏯 Tokio', '🍕 Rome'];
export default {
  id: 'vliegveld',
  name: 'Vliegveld',
  emoji: '✈️',
  hint: 'Wijs vliegtuigen een gate toe, laad bagage en laat niemand te lang wachten!',
  create(host, api) {
    const A = makeApp(host, 'linear-gradient(160deg,#1d4ed8,#0f172a)');
    const S = { money: 30, total: 0, rep: 30, gates: 1, hand: 0, belt: 0, tower: 0, term: 0, flights: 0, diverted: 0 };
    let hold = [], gate = [null], sp = 1, nid = 1, dirty = true, beltT = 0;
    const stars = () => 1 + Math.floor(S.rep / 25);
    const boardV = () => 4 + S.hand * 3;
    const bagV = () => 5 + S.belt * 0;
    const autoBag = () => S.belt * 4;
    const pat = () => 45 + S.tower * 12;
    const cst = { gates: () => Math.round(130 * Math.pow(2.4, S.gates - 1)), hand: () => Math.round(50 * Math.pow(1.9, S.hand)), belt: () => Math.round(70 * Math.pow(2, S.belt)), tower: () => Math.round(60 * Math.pow(1.9, S.tower)), term: () => Math.round(150 * Math.pow(3.2, S.term)) };
    const mx = { gates: 4, hand: 8, belt: 6, tower: 6, term: 3 };
    const earn = (n) => { S.money += n; S.total += n; api.score(Math.floor(S.total)); };

    function toGate(f) {
      const i = gate.findIndex((g, j) => !g && j < S.gates);
      if (i < 0) return A.toast('Alle gates bezet! Wacht even.');
      gate[i] = { f, b: 0, bg: 0, t: 0, par: f.pax / boardV() + f.bags / (bagV() * 1.5) + 6 };
      hold = hold.filter((x) => x !== f); dirty = true; render();
    }
    function load(g) { g.bg = Math.min(g.f.bags, g.bg + bagV()); A.refresh(); check(g); if (dirty) { dirty = false; render(); } }
    function check(g) {
      if (g.b >= g.f.pax && g.bg >= g.f.bags) depart(g);
    }
    function depart(g) {
      const i = gate.indexOf(g); gate[i] = null;
      const waitFrac = 1 - g.f.hp / g.f.max;
      const quick = g.t <= g.par;
      let v = Math.round(g.f.pax * SZ[g.f.sz].fare * (1 + S.rep / 150) * (quick ? 1.3 : 1));
      earn(v); S.flights++;
      S.rep = clamp(S.rep + (waitFrac < 0.4 && quick ? 3 : waitFrac < 0.7 ? 1 : -1), 0, 100);
      A.toast(g.f.e + ' ' + g.f.d + ' vertrokken! +' + fmt(v) + (quick ? ' (snel!)' : '')); dirty = true;
    }
    function buy(k) {
      if (S[k] >= mx[k]) return A.toast('Maximaal!');
      const c = cst[k](); if (S.money < c) return A.toast('Te weinig geld');
      S.money -= c; S[k]++; if (k === 'gates') gate.push(null); dirty = true; render();
    }
    function tick() {
      const dt = 0.25;
      sp -= dt;
      if (sp <= 0) {
        sp = rnd(70, 120) / 10 / (1 + S.rep / 120);
        if (hold.length < 5) {
          const mxs = Math.min(SZ.length - 1, S.term + (S.total > 80 ? 1 : 0));
          const sz = Math.random() < 0.5 ? Math.max(0, mxs - 1) : rnd(0, mxs), z = SZ[sz], pax = rnd(z.pax[0], z.pax[1]);
          hold.push({ id: nid++, sz, e: z.e, d: pick(DEST), pax, bags: Math.round(pax * 0.7), hp: pat(), max: pat() }); dirty = true;
        }
      }
      for (const f of hold) f.hp -= dt;
      const gone = hold.filter((f) => f.hp <= 0);
      if (gone.length) { hold = hold.filter((f) => f.hp > 0); S.diverted += gone.length; S.rep = clamp(S.rep - 8 * gone.length, 0, 100); A.toast('🛬 Vlucht uitgeweken naar ander vliegveld! (-ster)'); dirty = true; }
      for (const g of gate) if (g) {
        g.t += dt; g.b = Math.min(g.f.pax, g.b + boardV() * dt);
        if (S.belt > 0) g.bg = Math.min(g.f.bags, g.bg + autoBag() * dt);
        if (g.b >= g.f.pax && g.bg >= g.f.bags) { depart(g); }
      }
      if (dirty) { dirty = false; render(); } else A.refresh();
    }
    A.hlive(h('span'), (e) => { e.textContent = '💰 ' + fmt(S.money); });
    A.hlive(h('span'), (e) => { e.textContent = '⭐'.repeat(stars()) + ' ' + Math.floor(S.rep) + '%'; });
    A.hlive(h('span'), (e) => { e.textContent = '🛫 ' + S.flights; });

    function render() {
      dirty = false;
      while (gate.length < S.gates) gate.push(null);
      A.draw(() => {
        const out = [];
        out.push(sec('🛬 BOVEN HET VELD (tik om een gate te geven)'));
        const hr = h('div', 'display:flex;flex-direction:column;gap:6px;min-height:50px');
        if (!hold.length) hr.appendChild(h('div', 'opacity:.7;padding:10px', 'Geen vliegtuigen in de wachtrij'));
        for (const f of hold) {
          const b = bar(1);
          const c = h('div', box('cursor:pointer;display:flex;flex-direction:column;gap:4px'), [h('div', 'display:flex;justify-content:space-between;align-items:center', [h('span', 'font-size:22px', f.e), h('span', 'font-size:14px;font-weight:700', f.d), h('span', 'font-size:12px', f.pax + ' 👥 · ' + f.bags + ' 🧳')]), b], () => toGate(f));
          A.live(c, () => { const p = f.hp / f.max; b.set(p, p > 0.5 ? '#4ade80' : p > 0.25 ? '#facc15' : '#f87171'); });
          hr.appendChild(c);
        }
        out.push(hr);
        out.push(sec('🚪 GATES'));
        gate.forEach((g, i) => {
          const card = h('div', box('display:flex;flex-direction:column;gap:5px'));
          if (!g) { card.appendChild(h('div', 'text-align:center;opacity:.5;padding:12px', 'Gate ' + (i + 1) + ' is vrij')); out.push(card); return; }
          card.appendChild(h('div', 'display:flex;justify-content:space-between', [h('b', '', 'Gate ' + (i + 1) + ' · ' + g.f.e + ' ' + g.f.d), h('span', 'font-size:12px', '⏱️ ' + Math.ceil(g.par) + 's richttijd')]));
          const pb = bar(0, '#38bdf8'), bb = bar(0, '#fb923c');
          const t1 = h('div', 'font-size:12px'), t2 = h('div', 'font-size:12px');
          A.live(t1, (e) => { e.textContent = '👥 Instappen ' + Math.floor(g.b) + '/' + g.f.pax; pb.set(g.b / g.f.pax); });
          A.live(t2, (e) => { e.textContent = '🧳 Bagage ' + Math.floor(g.bg) + '/' + g.f.bags; bb.set(g.bg / g.f.bags); });
          card.append(t1, pb, t2, bb, btn('🧳 Bagage laden!', '#ea580c', () => load(g), 'min-height:52px;font-size:18px'));
          out.push(card);
        });
        out.push(sec('🛒 UITBREIDEN'));
        const ups = [['gates', '🚪 Extra gate (' + S.gates + '/4)'], ['hand', '🧑‍✈️ Meer grondpersoneel (sneller instappen)'], ['belt', '🧳 Bagageband (laadt zelf)'], ['tower', '🗼 Betere verkeerstoren (vliegtuigen wachten langer)'], ['term', '🏢 Grotere terminal (grotere vliegtuigen)']];
        for (const [k, t] of ups) {
          const lim = S[k] >= mx[k];
          const b = btn(t, '#7c3aed', () => buy(k), 'width:100%;text-align:left;display:flex;justify-content:space-between;align-items:center;gap:8px');
          b.appendChild(h('span', '', lim ? 'MAX' : fmt(cst[k]())));
          A.live(b, (e) => { e.style.opacity = !lim && S.money >= cst[k]() ? 1 : 0.5; });
          out.push(b);
        }
        out.push(h('div', 'font-size:12px;opacity:.7;text-align:center', 'Vertrek binnen de richttijd = 30% bonus. Uitgeweken vluchten kosten sterren (' + S.diverted + ' tot nu toe).'));
        return out;
      });
    }
    render(); api.score(0);
    A.every(tick, 250);
    return { destroy() { A.destroy(); } };
  },
};
