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
const PRD = [
  { id: 'bal', e: '⚽', n: 'Bal', c: 2, p: 5, l: 0 },
  { id: 'auto', e: '🚗', n: 'Autootje', c: 3, p: 7, l: 0 },
  { id: 'knuf', e: '🧸', n: 'Knuffel', c: 4, p: 9, l: 0 },
  { id: 'puzzel', e: '🧩', n: 'Puzzel', c: 5, p: 12, l: 1 },
  { id: 'robot', e: '🤖', n: 'Robot', c: 12, p: 28, l: 2 },
  { id: 'drone', e: '🚁', n: 'Drone', c: 25, p: 58, l: 3 },
];
const MN = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
const EV = {
  2: { n: '🐣 Pasen', all: 1.3, m: { knuf: 2 } },
  6: { n: '🏖️ Zomervakantie', all: 1.4, m: { bal: 3, auto: 1.5 } },
  8: { n: '🎒 Verjaardagsfeestjes', all: 1.3, m: { puzzel: 2 } },
  10: { n: '🎅 Sinterklaas', all: 2.2, m: { knuf: 1.5, robot: 1.5 } },
  11: { n: '🎄 Kerst', all: 2.8, m: { robot: 2, drone: 2, puzzel: 1.5 } },
};
const PM = [0.75, 0.9, 1, 1.2, 1.5];
export default {
  id: 'speelgoedwinkel',
  name: 'Speelgoedwinkel',
  emoji: '🧸',
  hint: 'Koop in, kies je prijzen en reken klanten af. Bereid je voor op feestdagen!',
  create(host, api) {
    const A = makeApp(host, 'linear-gradient(160deg,#db2777,#4c1d95)');
    const S = { money: 40, total: 0, mo: 0, yr: 1, mt: 0, stock: { bal: 5, auto: 5, knuf: 3 }, pi: {}, shelf: 0, ad: 0, staff: 0, lvl: 0, missed: 0, sold: 0 };
    let wp = {}, till = [], sp = 2, nid = 1, dirty = true, staffT = 3, ok = false;
    const cap = () => 12 + S.shelf * 8;
    const pidx = (p) => (S.pi[p.id] === undefined ? 2 : S.pi[p.id]);
    const sell = (p) => Math.max(1, Math.round(p.p * PM[pidx(p)]));
    const ev = () => EV[S.mo];
    const evMul = (p) => { const e = ev(); return e ? e.all * (e.m[p.id] || 1) : 0.8; };
    const prods = () => PRD.filter((p) => p.l <= S.lvl);
    const cst = { shelf: () => Math.round(50 * Math.pow(1.9, S.shelf)), ad: () => Math.round(70 * Math.pow(2.1, S.ad)), staff: () => Math.round(120 * Math.pow(2.3, S.staff)), lvl: () => Math.round(250 * Math.pow(3, S.lvl)) };
    const mx = { shelf: 6, ad: 5, staff: 4, lvl: 3 };
    const save = () => {};
    const earn = (n) => { S.money += n; S.total += n; api.score(Math.floor(S.total)); };
    const change = () => { save(); dirty = false; render(); };
    const newPrices = () => { wp = {}; for (const p of PRD) wp[p.id] = Math.max(1, Math.round(p.c * (0.85 + Math.random() * 0.4) * (S.mo === 10 || S.mo === 11 ? 1.2 : 1) * 10) / 10); };
    const stockOf = (p) => S.stock[p.id] || 0;

    function buyStock(p, n) {
      const room = cap() - stockOf(p), k = Math.min(n, room);
      if (k <= 0) return A.toast('Schap is vol');
      const c = Math.round(wp[p.id] * k * 10) / 10;
      if (S.money < c) { const aff = Math.floor(S.money / wp[p.id]); if (aff <= 0) return A.toast('Te weinig geld'); return buyStock(p, Math.min(aff, k)); }
      S.money -= c; S.stock[p.id] = stockOf(p) + k; change();
    }
    function price(p, d) { S.pi[p.id] = clamp(pidx(p) + d, 0, 4); change(); }
    function pay(c) {
      till = till.filter((x) => x !== c);
      const v = sell(c.p) * c.q; earn(v); S.sold += c.q; A.toast('+' + fmt(v)); change();
    }
    function up(k) {
      if (S[k] >= mx[k]) return A.toast('Maximaal!');
      const c = cst[k](); if (S.money < c) return A.toast('Te weinig geld');
      S.money -= c; S[k]++; if (k === 'lvl') A.toast('Nieuw speelgoed in het assortiment!'); change();
    }
    function tick() {
      const dt = 0.25;
      S.mt += dt;
      if (S.mt >= 20) { S.mt = 0; S.mo++; if (S.mo >= 12) { S.mo = 0; S.yr++; } newPrices(); if (ev()) A.toast('📣 Deze maand: ' + ev().n + '!'); dirty = true; save(); }
      sp -= dt;
      if (sp <= 0) {
        const mm = (ev() ? ev().all : 0.8) * (1 + S.ad * 0.25);
        sp = 4.5 / mm;
        const p = pick(prods());
        const q = rnd(1, 2);
        const maxP = p.p * (0.8 + Math.random() * 0.7) * Math.max(1, evMul(p) * 0.7);
        if (stockOf(p) < 1) { S.missed++; A.toast('😕 ' + p.e + ' is uitverkocht'); }
        else if (sell(p) > maxP) { S.missed++; A.toast('😒 ' + p.e + ' te duur'); }
        else if (till.length < 5) {
          const qq = Math.min(q, stockOf(p)); S.stock[p.id] -= qq;
          till.push({ id: nid++, p, q: qq, f: pick(['👩', '👨', '👧', '🧒', '👵', '👴']), pat: 25, max: 25 }); dirty = true;
        }
      }
      if (S.money < 10 && !till.length && prods().every((p) => stockOf(p) < 1)) { S.money += 15; A.toast('🎁 Oma stopt je 15 euro toe'); dirty = true; }
      for (const c of till) c.pat -= dt;
      const gone = till.filter((c) => c.pat <= 0);
      if (gone.length) { till = till.filter((c) => c.pat > 0); for (const c of gone) S.stock[c.p.id] = stockOf(c.p) + c.q; A.toast('😠 Klant wachtte te lang'); dirty = true; }
      if (S.staff > 0) { staffT -= dt; if (staffT <= 0) { staffT = 5 / S.staff; if (till.length) { pay(till[0]); return; } } }
      if (Math.floor(S.mt * 4) % 20 === 0) save();
      if (dirty) { dirty = false; render(); } else A.refresh();
    }
    A.hlive(h('span'), (e) => { e.textContent = '💰 ' + fmt(S.money); });
    A.hlive(h('span'), (e) => { e.textContent = '📅 ' + MN[S.mo] + ' jaar ' + S.yr; });
    A.hlive(h('span'), (e) => { e.textContent = ev() ? ev().n : '😴 rustige maand'; e.style.color = ev() ? '#fde047' : '#fff'; });

    function render() {
      A.draw(() => {
        const out = [];
        let nx = null, d = 0; for (let i = 1; i <= 12 && !nx; i++) if (EV[(S.mo + i) % 12]) { nx = EV[(S.mo + i) % 12]; d = i; }
        out.push(h('div', box('font-size:13px;text-align:center'), 'Komt eraan: ' + nx.n + ' over ' + d + ' maand' + (d > 1 ? 'en' : '') + '. Vul je voorraad!'));
        out.push(sec('🛎️ KASSA (tik om af te rekenen)'));
        const tr = row([], 'min-height:70px');
        if (!till.length) tr.appendChild(h('div', 'opacity:.7;padding:10px', 'Niemand bij de kassa'));
        for (const c of till) {
          const b = bar(1);
          const card = h('div', box('flex:1;min-width:28%;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px'), [h('div', 'font-size:22px', c.f + c.p.e + (c.q > 1 ? '×' + c.q : '')), h('div', 'font-size:12px', fmt(sell(c.p) * c.q)), b], () => pay(c));
          A.live(card, () => { const p = c.pat / c.max; b.set(p, p > 0.5 ? '#4ade80' : p > 0.25 ? '#facc15' : '#f87171'); });
          tr.appendChild(card);
        }
        out.push(tr);
        if (till.length) out.push(btn('💳 Afrekenen: ' + till[0].p.e, '#16a34a', () => pay(till[0]), 'min-height:54px;font-size:18px'));
        out.push(sec('📦 VOORRAAD, INKOOP & PRIJZEN'));
        for (const p of prods()) {
          const card = h('div', box('display:flex;flex-direction:column;gap:5px'));
          card.appendChild(h('div', 'display:flex;justify-content:space-between;font-size:14px', [h('b', '', p.e + ' ' + p.n + (evMul(p) >= 2 ? ' 🔥' : '')), h('span', '', stockOf(p) + '/' + cap() + ' op voorraad'), h('span', 'opacity:.8', 'inkoop ' + fmt(wp[p.id]) + (wp[p.id] <= p.c ? ' 👍' : ''))]));
          const rr = row([btn('−', '#be185d', () => price(p, -1), 'width:44px'), h('div', 'flex:1;text-align:center;align-self:center;font-weight:700', 'Prijs ' + fmt(sell(p))), btn('+', '#be185d', () => price(p, 1), 'width:44px'), btn('+5', '#15803d', () => buyStock(p, 5), 'width:54px'), btn('+15', '#15803d', () => buyStock(p, 15), 'width:54px')]);
          rr.style.flexWrap = 'nowrap'; card.appendChild(rr); out.push(card);
        }
        out.push(sec('🛒 UITBREIDEN'));
        const ups = [['shelf', '🗄️ Grotere schappen (' + cap() + ')'], ['ad', '📢 Reclame (meer klanten)'], ['staff', '🧑‍💼 Kassamedewerker (rekent af)'], ['lvl', '🏬 Winkel uitbreiden (nieuw speelgoed)']];
        for (const [k, t] of ups) {
          const lim = S[k] >= mx[k];
          const b = btn(t, '#7c3aed', () => up(k), 'width:100%;text-align:left;display:flex;justify-content:space-between;align-items:center;gap:8px');
          b.appendChild(h('span', '', lim ? 'MAX' : fmt(cst[k]())));
          A.live(b, (e) => { e.style.opacity = !lim && S.money >= cst[k]() ? 1 : 0.5; });
          out.push(b);
        }
        out.push(h('div', 'font-size:12px;opacity:.7;text-align:center', 'Verkocht: ' + S.sold + ' · Gemist (te duur/op): ' + S.missed));
        return out;
      });
    }
    const go = () => { ok = true; if (!Object.keys(wp).length) newPrices(); api.score(Math.floor(S.total)); render(); A.every(tick, 250); };
    go();
    return { destroy() { A.destroy(); } };
  },
};
