const fmt = n => { n = Math.floor(n || 0); if (n < 1000) return String(n); const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi']; let i = -1, v = n; while (v >= 1000 && i < u.length - 1) { v /= 1000; i++; } return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : v.toFixed(0)).replace('.', ',') + u[i]; };
const $ = (t, css, txt, p) => { const e = document.createElement(t); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; if (p) p.appendChild(e); return e; };
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmtT = s => { s = Math.max(0, Math.ceil(s)); return s >= 3600 ? Math.floor(s / 3600) + 'u ' + Math.floor(s % 3600 / 60) + 'm' : s >= 60 ? Math.floor(s / 60) + 'm ' + (s % 60) + 's' : s + 's'; };
function btn(p, label, fn, dis, css) { const b = $('button', 'min-height:44px;border:0;border-radius:12px;padding:8px 12px;font-weight:700;font-size:14px;color:#fff;background:linear-gradient(#4f8cff,#2f5fd0);cursor:pointer;margin:3px 0;' + (dis ? 'opacity:.4;' : '') + (css || ''), label, p); b.addEventListener('click', () => { if (!dis) fn(); }); return b; }
function card(p, css) { return $('div', 'background:rgba(255,255,255,.1);border-radius:14px;padding:10px;margin:8px 0;' + (css || ''), null, p); }
function bar(p, pct, color) { const o = $('div', 'height:10px;background:rgba(0,0,0,.35);border-radius:6px;overflow:hidden;margin:4px 0', null, p); $('div', 'height:100%;width:' + (clamp(pct, 0, 1) * 100) + '%;background:' + (color || '#4ade80'), null, o); return o; }
function row(p, css) { return $('div', 'display:flex;align-items:center;gap:8px;' + (css || ''), null, p); }
function app(host, api, o) {
  host.style.background = o.bg; host.style.color = '#fff'; host.style.fontFamily = 'system-ui,-apple-system,sans-serif'; host.style.overflowY = 'auto';
  const root = $('div', 'max-width:430px;margin:0 auto;padding:10px 10px 30px;box-sizing:border-box', null, host);
  const head = $('div', '', null, root);
  const tb = $('div', 'display:flex;gap:4px;margin:8px 0;position:sticky;top:0;z-index:5;padding:4px 0;background:' + o.bg, null, root);
  const body = $('div', '', null, root);
  let tab = o.tabs[0][0], down = false, dead = false, last = Date.now();
  const dn = () => { down = true; }, up = () => { down = false; };
  host.addEventListener('pointerdown', dn); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  const A = {
    tab: () => tab,
    go(t) { tab = t; A.render(); },
    render() {
      if (dead) return;
      head.replaceChildren(); o.head(head);
      tb.replaceChildren();
      for (const [id, l] of o.tabs) { const b = $('button', 'flex:1;min-height:44px;border:0;border-radius:10px;font-weight:700;font-size:12px;padding:2px;cursor:pointer;color:#fff;background:' + (id === tab ? o.acc : 'rgba(255,255,255,.12)'), l, tb); b.addEventListener('click', () => A.go(id)); }
      body.replaceChildren(); o.render(tab, body);
    },
    commit() { A.render(); api.save(o.state()); },
  };
  A.render();
  const iv = setInterval(() => { const n = Date.now(), dt = Math.min((n - last) / 1000, 60); last = n; if (o.tick) o.tick(dt); if (!down) A.render(); }, 1000);
  const sv = setInterval(() => api.save(o.state()), 10000);
  A.destroy = () => { dead = true; clearInterval(iv); clearInterval(sv); host.removeEventListener('pointerdown', dn); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); try { api.save(o.state()); } catch (e) {} };
  return A;
}
const RAW = [{ id: 'ijzer', n: 'IJzererts', e: '⛏️', c: 25, r: .5 }, { id: 'hout', n: 'Hout', e: '🪓', c: 60, r: .5 }, { id: 'plastic', n: 'Plastic', e: '🛢️', c: 250, r: .4 }];
const RECIPES = [
  { id: 'spijker', n: 'Spijkers', e: '🔩', in: { ijzer: 2 }, t: 2, p: 6, unlock: 0 },
  { id: 'plank', n: 'Planken', e: '🪵', in: { hout: 2 }, t: 3, p: 8, unlock: 150 },
  { id: 'auto', n: 'Speelgoedauto', e: '🚗', in: { plastic: 3, ijzer: 1 }, t: 5, p: 45, unlock: 1500 },
  { id: 'meubel', n: 'Meubel', e: '🪑', in: { plank: 4, spijker: 6 }, t: 8, p: 220, unlock: 12000 },
  { id: 'tablet', n: 'Tablet', e: '📱', in: { plastic: 6, ijzer: 4, spijker: 4 }, t: 12, p: 900, unlock: 80000 },
  { id: 'fiets', n: 'Fiets', e: '🚲', in: { ijzer: 8, plastic: 4, spijker: 10 }, t: 20, p: 3200, unlock: 500000 },
];
const NAME = {}; for (const x of RAW) NAME[x.id] = x; for (const x of RECIPES) NAME[x.id] = x;
const eur = n => '€' + fmt(n);
export default {
  id: 'fabriekbaas', name: 'Fabriekbaas', emoji: '🏭', desc: 'Bouw lopende banden, automatiseer en lever orders.',
  async create(host, api) {
    const d = await api.load();
    const S = Object.assign({ money: 40, st: { ijzer: 10, hout: 0, plastic: 0 }, miners: { ijzer: 1, hout: 0, plastic: 0 }, lines: {}, ware: 0, orders: [], nextOrder: 20, made: 0, earned: 0, delivered: 0, last: Date.now() }, d || {});
    S.lines.spijker = S.lines.spijker || { lv: 0, auto: false, sell: false, prog: 0 };
    const cap = () => 100 * Math.pow(2, S.ware);
    const stock = id => Math.floor(S.st[id] || 0);
    const price = id => { const r = NAME[id]; const base = r.p; return base * (1 + .25 * Math.sin(Date.now() / 60000 + id.length * 2)); };
    const speed = l => 1 + l.lv * .3;
    const sellAll = (id, keep) => { const n = Math.max(0, stock(id) - (keep || 0)); if (n > 0) { const g = n * price(id); S.money += g; S.earned += g; S.st[id] -= n; } };
    const advance = dt => {
      for (const r of RAW) S.st[r.id] = Math.min(cap(), (S.st[r.id] || 0) + S.miners[r.id] * r.r * dt);
      for (const R of RECIPES) {
        const l = S.lines[R.id]; if (!l || !l.auto) continue;
        l.prog += dt * speed(l);
        let n = Math.floor(l.prog / R.t), lim = n;
        for (const k in R.in) lim = Math.min(lim, Math.floor((S.st[k] || 0) / R.in[k]));
        lim = Math.min(lim, Math.max(0, Math.floor(cap() - (S.st[R.id] || 0))));
        if (lim < 0) lim = 0;
        for (const k in R.in) S.st[k] -= R.in[k] * lim;
        S.st[R.id] = (S.st[R.id] || 0) + lim; S.made += lim;
        l.prog -= lim * R.t; if (lim < n) l.prog = 0;
        if (l.sell) sellAll(R.id, 0);
      }
    };
    const off = Math.min((Date.now() - S.last) / 1000, 28800);
    if (off > 30) { const m0 = S.money; advance(off); api.toast('Offline: ' + fmt(off / 60) + ' min productie' + (S.money > m0 ? ', +' + eur(S.money - m0) : '')); }
    S.last = Date.now();
    const newOrder = () => {
      const open = RECIPES.filter(r => S.lines[r.id]);
      const R = pick(open), q = ri(3, 12) * (R.p < 50 ? 4 : 1);
      S.orders.push({ id: R.id, q, reward: Math.round(q * R.p * rnd(1.7, 2.4)), exp: Date.now() + 240000 });
    };
    const A = app(host, api, {
      bg: 'linear-gradient(#2b2f36,#3d3320)', acc: '#f59e0b', tabs: [['fab', '🏭 Fabriek'], ['grond', '⛏️ Grondstof'], ['order', '📦 Orders'], ['mag', '🏬 Magazijn']],
      state: () => { S.last = Date.now(); return S; },
      tick: dt => {
        advance(dt); S.last = Date.now();
        S.orders = S.orders.filter(o => o.exp > Date.now());
        S.nextOrder -= dt; if (S.nextOrder <= 0) { if (S.orders.length < 4) newOrder(); S.nextOrder = 45; }
      },
      head: el => { $('div', 'font-size:20px;font-weight:800', '🏭 Fabriekbaas', el); const r = row(el, 'justify-content:space-between;margin-top:4px'); $('span', 'color:#ffd86b;font-weight:700', '💰 ' + eur(S.money), r); $('span', 'font-size:12px', '⚙️ ' + fmt(S.made) + ' gemaakt · 📦 ' + fmt(S.delivered) + ' orders', r); },
      render: (tab, b) => {
        if (tab === 'fab') {
          RECIPES.forEach(R => {
            const l = S.lines[R.id];
            const ins = Object.keys(R.in).map(k => R.in[k] + NAME[k].e).join(' + ');
            if (!l) { const c = card(b, 'opacity:.9'); $('div', 'font-weight:700', R.e + ' ' + R.n + ' · ' + ins + ' → 1', c); btn(c, 'Bouw lopende band · ' + eur(R.unlock), () => { S.money -= R.unlock; S.lines[R.id] = { lv: 0, auto: false, sell: false, prog: 0 }; A.commit(); }, S.money < R.unlock); return; }
            const c = card(b); const h = row(c, 'justify-content:space-between');
            $('div', 'font-weight:800', R.e + ' ' + R.n + ' ×' + stock(R.id), h); $('div', 'font-size:12px', 'Waarde ' + eur(price(R.id)), h);
            $('div', 'font-size:12px;opacity:.85', ins + ' → 1 · ' + (R.t / speed(l)).toFixed(1).replace('.', ',') + 's per stuk · niveau ' + l.lv, c);
            if (l.auto) bar(c, l.prog / R.t, '#f59e0b');
            const can = Object.keys(R.in).every(k => stock(k) >= R.in[k]) && stock(R.id) < cap();
            const r = row(c, 'flex-wrap:wrap');
            btn(r, '👋 Maak 1', () => { for (const k in R.in) S.st[k] -= R.in[k]; S.st[R.id] = (S.st[R.id] || 0) + 1; S.made++; A.commit(); }, !can, 'flex:1');
            const uc = Math.round(R.unlock * .5 + 80) * Math.pow(1.6, l.lv);
            btn(r, '⚡ Sneller ' + eur(uc), () => { S.money -= uc; l.lv++; A.commit(); }, S.money < uc || l.lv >= 15, 'flex:1;font-size:12px;background:linear-gradient(#a855f7,#7e22ce)');
            if (!l.auto) { const ac = R.unlock * 4 + 400; btn(c, '🤖 Automatiseren ' + eur(ac), () => { S.money -= ac; l.auto = true; A.commit(); }, S.money < ac, 'width:100%;background:linear-gradient(#10b981,#047857)'); }
            else btn(c, l.sell ? '💸 Auto-verkoop: AAN' : '💸 Auto-verkoop: UIT', () => { l.sell = !l.sell; A.commit(); }, false, 'width:100%;font-size:12px;background:' + (l.sell ? '#059669' : '#555'));
          });
        } else if (tab === 'grond') {
          RAW.forEach(r => {
            const n = S.miners[r.id], cost = Math.round(r.c * Math.pow(1.15, n)), c = card(b);
            $('div', 'font-weight:800', r.e + ' ' + r.n + ' · ' + fmt(S.st[r.id] || 0) + ' / ' + fmt(cap()), c);
            $('div', 'font-size:12px', n + ' winners · ' + (n * r.r).toFixed(1).replace('.', ',') + '/s', c);
            bar(c, (S.st[r.id] || 0) / cap(), '#60a5fa');
            const rr = row(c);
            btn(rr, '👋 +1 grondstof', () => { S.st[r.id] = Math.min(cap(), (S.st[r.id] || 0) + 1); A.commit(); }, false, 'flex:1;background:#555');
            btn(rr, 'Winner ' + eur(cost), () => { S.money -= cost; S.miners[r.id]++; A.commit(); }, S.money < cost, 'flex:1');
          });
        } else if (tab === 'order') {
          if (!S.orders.length) $('div', 'opacity:.7', 'Nog geen orders... er komt zo een klant!', b);
          S.orders.forEach((o, i) => {
            const R = NAME[o.id], c = card(b), ok = stock(o.id) >= o.q;
            $('div', 'font-weight:800', R.e + ' ' + o.q + '× ' + R.n + ' → ' + eur(o.reward), c);
            $('div', 'font-size:12px;opacity:.85', 'Voorraad ' + stock(o.id) + ' · nog ' + fmtT((o.exp - Date.now()) / 1000), c);
            btn(c, ok ? '🚚 Leveren' : 'Te weinig voorraad', () => { S.st[o.id] -= o.q; S.money += o.reward; S.earned += o.reward; S.delivered++; S.orders.splice(i, 1); A.commit(); }, !ok);
          });
        } else {
          const c = card(b); $('div', 'font-weight:800', '🏬 Magazijn (max ' + fmt(cap()) + ' per soort)', c);
          [...RAW, ...RECIPES.filter(r => S.lines[r.id])].forEach(x => { const r = row(c, 'justify-content:space-between;padding:3px 0'); $('span', '', x.e + ' ' + x.n + ': ' + fmt(S.st[x.id] || 0), r); if (x.p) btn(r, 'Verkoop ' + eur(stock(x.id) * price(x.id)), () => { sellAll(x.id, 0); A.commit(); }, stock(x.id) < 1, 'min-height:36px;font-size:12px'); });
          const cost = 500 * Math.pow(3, S.ware);
          btn(b, '⬆️ Uitbreiden naar ' + fmt(cap() * 2) + ' · ' + eur(cost), () => { S.money -= cost; S.ware++; A.commit(); }, S.money < cost || S.ware >= 12, 'width:100%');
          $('div', 'font-size:12px;opacity:.7;margin-top:6px', 'Marktprijzen schommelen: verkoop als de waarde hoog is! Geautomatiseerde banden draaien ook als je weg bent (max 8 uur).', b);
        }
      },
    });
    return { destroy() { A.destroy(); } };
  },
};
