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
// stats: [kracht, snelheid, intelligentie, duurzaamheid]
const SLOTS = [
  { id: 'hoofd', n: 'Hoofd', e: '🧠', parts: [{ n: 'Basis-chip', e: '💾', c: 15, st: [0, 0, 3, 0] }, { n: 'Sensor-oog', e: '👁️', c: 60, st: [0, 1, 6, 0] }, { n: 'Neuraal brein', e: '🤖', c: 350, st: [0, 2, 14, 1] }, { n: 'Quantumkern', e: '🔮', c: 2500, st: [0, 4, 30, 3] }] },
  { id: 'romp', n: 'Romp', e: '🛡️', parts: [{ n: 'Blikken romp', e: '🥫', c: 15, st: [2, 0, 0, 4] }, { n: 'Staalromp', e: '🔩', c: 70, st: [4, 0, 0, 9] }, { n: 'Titaanromp', e: '⚙️', c: 400, st: [8, 0, 0, 18] }, { n: 'Nano-pantser', e: '🧬', c: 2800, st: [14, 0, 0, 35] }] },
  { id: 'armen', n: 'Armen', e: '🦾', parts: [{ n: 'Grijptang', e: '🦀', c: 12, st: [3, 0, 0, 0] }, { n: 'Hydraulische arm', e: '💪', c: 65, st: [8, 0, 0, 1] }, { n: 'Precisiearm', e: '🔧', c: 380, st: [10, 0, 5, 2] }, { n: 'Kracht-exoskelet', e: '🦿', c: 2600, st: [24, 2, 3, 4] }] },
  { id: 'benen', n: 'Beweging', e: '🛞', parts: [{ n: 'Wielen', e: '🛞', c: 12, st: [0, 4, 0, 1] }, { n: 'Rupsbanden', e: '🚜', c: 60, st: [1, 3, 0, 5] }, { n: 'Jetpack', e: '🚀', c: 420, st: [0, 14, 0, 2] }, { n: 'Turbo-poten', e: '🐆', c: 2700, st: [2, 28, 2, 4] }] },
  { id: 'energie', n: 'Energie', e: '🔋', parts: [{ n: 'Batterij', e: '🔋', c: 10, st: [0, 0, 0, 2], m: 1 }, { n: 'Zonnecel', e: '☀️', c: 80, st: [0, 0, 0, 3], m: 1.15 }, { n: 'Fusiecel', e: '⚛️', c: 450, st: [0, 0, 0, 5], m: 1.4 }, { n: 'Antimaterie', e: '💥', c: 3000, st: [0, 0, 0, 8], m: 2 }] },
];
const CATS = [{ n: 'Huishoudrobot', e: '🧹', w: [0, 0, 2, 1] }, { n: 'Fabrieksrobot', e: '🏭', w: [2, 0, 0, 1] }, { n: 'Verkenner', e: '🧭', w: [0, 2, 1, 0] }, { n: 'Beveiliger', e: '🚨', w: [1, 0, 0, 2] }];
const RES = [
  { id: 't2', n: 'Tier 2 onderdelen', e: '🔬', c: [20], d: 'Ontgrendelt de tweede onderdelenreeks.' },
  { id: 't3', n: 'Tier 3 onderdelen', e: '🔭', c: [120], d: 'Ontgrendelt de derde onderdelenreeks.', req: 't2' },
  { id: 't4', n: 'Tier 4 onderdelen', e: '🛰️', c: [700], d: 'Ontgrendelt de vierde onderdelenreeks.', req: 't3' },
  { id: 'line', n: 'Extra bouwlijn', e: '🏗️', c: [30, 100, 300, 900], d: 'Bouw meer robots tegelijk.' },
  { id: 'test', n: 'Testlab', e: '🧪', c: [25, 80, 250, 800], d: 'Testen gaat sneller en geeft meer onderzoekspunten.' },
  { id: 'mkt', n: 'Marketing', e: '📣', c: [30, 100, 300, 900], d: '+15% verkoopprijs per niveau.' },
];
const RN = ['Blip', 'Klik', 'Bolt', 'Zip', 'Rex', 'Nova', 'Pico', 'Wally', 'Gizmo', 'Servo', 'Tick', 'Robbie'];
const eur = n => '€' + fmt(n);
export default {
  id: 'robotfabriek', name: 'Robotfabriek', emoji: '🤖', desc: 'Ontwerp robots met onderdelen, test ze en verkoop ze.',
  async create(host, api) {
    const d = await api.load();
    const S = Object.assign({ money: 80, rp: 0, res: {}, cur: [0, 0, 0, 0, 0], q: [], inv: [], sold: 0, earned: 0, nid: 1, last: Date.now() }, d || {});
    const lv = id => S.res[id] || 0;
    const maxTier = () => 1 + (lv('t2') ? 1 : 0) + (lv('t3') ? 1 : 0) + (lv('t4') ? 1 : 0);
    const lines = () => 1 + lv('line');
    const design = (cur) => {
      const st = [0, 0, 0, 0]; let cost = 0, mult = 1; const tiers = cur;
      SLOTS.forEach((s, i) => { const p = s.parts[cur[i]]; p.st.forEach((v, k) => st[k] += v); cost += p.c; if (p.m) mult = p.m; });
      let syn = 1; const cnt = {}; tiers.forEach(t => cnt[t] = (cnt[t] || 0) + 1); const mx = Math.max(...Object.values(cnt));
      if (mx === 5) syn = 1.25; else if (mx >= 3) syn = 1.1;
      const f = st.map(v => Math.round(v * mult * syn));
      let bc = 0, bs = -1; CATS.forEach((c, i) => { const sc = f.reduce((a, v, k) => a + v * c.w[k], 0); if (sc > bs) { bs = sc; bc = i; } });
      return { st: f, cost, cat: bc, sc: bs, syn, mult, time: 8 + tiers.reduce((a, b) => a + b, 0) * 4 };
    };
    const demand = c => .75 + .5 * Math.sin(Date.now() / 90000 + c * 1.7);
    const price = r => r.sc * 5 * demand(r.cat) * (1 + .15 * lv('mkt')) * (r.st === 'tested' ? r.q : r.defect ? .15 : .7);
    const settle = () => {
      const now = Date.now();
      S.q = S.q.filter(b => { if (b.end > now) return true; S.inv.push({ n: pick(RN) + ' #' + (S.nid++), stt: b.stt, cat: b.cat, sc: b.sc, q: rnd(.85, 1.2), defect: Math.random() < .2, st: 'new', end: 0, tier: b.tier }); api.toast('🤖 Robot klaar: ' + CATS[b.cat].n); return false; });
      S.inv.forEach(r => { if (r.st === 'testing' && r.end <= now) { r.st = 'tested'; if (r.defect) { r.defect = false; r.q *= .9; } S.rp += 1 + r.tier + lv('test'); api.toast('🧪 Test klaar: kwaliteit ' + Math.round(r.q * 100) + '%'); } });
    };
    settle(); S.last = Date.now();
    const A = app(host, api, {
      bg: 'linear-gradient(#0f2a3a,#1e3a4f 60%,#2b2b3a)', acc: '#06b6d4', tabs: [['ont', '📐 Ontwerp'], ['wrk', '🏗️ Werkplaats'], ['mkt', '📈 Markt'], ['res', '🔬 Onderzoek']],
      state: () => { S.last = Date.now(); return S; },
      tick: () => { settle(); S.last = Date.now(); },
      head: el => { $('div', 'font-size:20px;font-weight:800', '🤖 Robotfabriek', el); const r = row(el, 'justify-content:space-between;margin-top:4px'); $('span', 'color:#ffe08a;font-weight:700', '💰 ' + eur(S.money), r); $('span', '', '🔬 ' + fmt(S.rp) + ' OP', r); $('span', 'font-size:12px', '🤖 verkocht ' + fmt(S.sold), r); },
      render: (tab, b) => {
        if (tab === 'ont') {
          SLOTS.forEach((s, i) => { const c = card(b); $('div', 'font-weight:700', s.e + ' ' + s.n, c); const r = row(c, 'flex-wrap:wrap'); s.parts.forEach((p, k) => { const lock = k >= maxTier(); btn(r, lock ? '🔒' : p.e + ' ' + p.n + ' ' + eur(p.c), () => { S.cur[i] = k; A.commit(); }, lock, 'flex:1;min-width:46%;font-size:11px;padding:4px;' + (S.cur[i] === k ? 'background:#0891b2' : 'background:#475569')); }); });
          const D = design(S.cur), c = card(b, 'border:2px solid #22d3ee');
          $('div', 'font-weight:800', 'Jouw ontwerp: ' + CATS[D.cat].e + ' ' + CATS[D.cat].n, c);
          $('div', 'font-size:13px', '💪 ' + D.st[0] + '  ⚡ ' + D.st[1] + '  🧠 ' + D.st[2] + '  🛡️ ' + D.st[3], c);
          $('div', 'font-size:12px;opacity:.85', 'Energie-bonus ×' + D.mult + ' · setbonus ×' + D.syn + (D.syn > 1 ? ' ✨' : '') + ' · score ' + D.sc + ' · verwachte waarde ' + eur(price({ sc: D.sc, cat: D.cat, st: 'tested', q: 1 })), c);
          btn(c, '🔨 Bouwen · ' + eur(D.cost) + ' · ' + D.time + 's', () => { S.money -= D.cost; S.q.push({ stt: D.st, cat: D.cat, sc: D.sc, end: Date.now() + D.time * 1000, tier: Math.max(...S.cur) + 1 }); A.commit(); }, S.money < D.cost || S.q.length >= lines() || S.inv.length >= 12);
          $('div', 'font-size:12px;opacity:.8', 'Tip: gelijke onderdelenreeksen geven setbonus (3 gelijk +10%, 5 gelijk +25%).', b);
        } else if (tab === 'wrk') {
          $('div', 'font-weight:700', '🏗️ Bouwlijnen ' + S.q.length + '/' + lines(), b);
          S.q.forEach(q => { const c = card(b); $('div', '', CATS[q.cat].e + ' ' + CATS[q.cat].n + ' wordt gebouwd... ' + fmtT((q.end - Date.now()) / 1000), c); });
          $('div', 'font-weight:700;margin-top:6px', '📦 Voorraad ' + S.inv.length + '/12', b);
          if (!S.inv.length) $('div', 'opacity:.7;font-size:13px', 'Nog geen robots. Ontwerp en bouw er een!', b);
          S.inv.forEach((r, i) => {
            const c = card(b); $('div', 'font-weight:800', CATS[r.cat].e + ' ' + r.n + ' · ' + CATS[r.cat].n, c);
            $('div', 'font-size:12px', '💪 ' + r.stt[0] + '  ⚡ ' + r.stt[1] + '  🧠 ' + r.stt[2] + '  🛡️ ' + r.stt[3] + ' · ' + (r.st === 'tested' ? '✅ getest, kwaliteit ' + Math.round(r.q * 100) + '%' : r.st === 'testing' ? '🧪 testen... ' + fmtT((r.end - Date.now()) / 1000) : '❓ niet getest (kans op defect!)'), c);
            const rr = row(c);
            if (r.st === 'new') btn(rr, '🧪 Testen (10s)', () => { r.st = 'testing'; r.end = Date.now() + 10000 / (1 + .3 * lv('test')); A.commit(); }, false, 'flex:1;background:#7c3aed');
            btn(rr, 'Verkoop ' + eur(price(r)), () => { const g = price(r); S.money += g; S.earned += g; S.sold++; S.inv.splice(i, 1); A.commit(); }, r.st === 'testing', 'flex:1');
          });
        } else if (tab === 'mkt') {
          const c = card(b); $('div', 'font-weight:800', '📈 Vraag naar robots', c);
          CATS.forEach((k, i) => { const dm = demand(i); const r = row(c, 'justify-content:space-between;padding:4px 0'); $('span', '', k.e + ' ' + k.n, r); $('span', 'font-weight:700;color:' + (dm > 1 ? '#4ade80' : dm < .85 ? '#f87171' : '#fbbf24'), Math.round(dm * 100) + '% ' + (dm > 1 ? '▲' : '▼'), r); bar(c, dm / 1.25, dm > 1 ? '#4ade80' : '#f87171'); });
          $('div', 'font-size:12px;opacity:.85', 'De vraag golft op en neer. Wacht met verkopen tot je categorie hoog staat! Marketing verhoogt alle prijzen.', b);
          $('div', 'margin-top:8px;font-size:13px', 'Totaal verdiend: ' + eur(S.earned), b);
        } else {
          RES.forEach(x => { const l = lv(x.id), cost = x.c[l], c = card(b), locked = x.req && !lv(x.req); $('div', 'font-weight:800', x.e + ' ' + x.n + (x.c.length > 1 ? ' niv ' + l + '/' + x.c.length : l ? ' ✅' : ''), c); $('div', 'font-size:12px;opacity:.85', x.d, c); btn(c, cost === undefined ? 'Klaar' : locked ? '🔒 Eerst vorige' : 'Onderzoek · ' + fmt(cost) + ' OP', () => { S.rp -= cost; S.res[x.id] = l + 1; A.commit(); }, cost === undefined || locked || S.rp < cost, 'background:linear-gradient(#a855f7,#7e22ce)'); });
          $('div', 'font-size:12px;opacity:.8', 'Onderzoekspunten (OP) krijg je door robots te testen.', b);
        }
      },
    });
    return { destroy() { A.destroy(); } };
  },
};
