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
const SP = [
  { id: 'compy', n: 'Compsognathus', e: '🦎', diet: 'vlees', pcs: 4, ap: 2, dg: 1, hc: 60, ht: 20, site: 0 },
  { id: 'ankylo', n: 'Ankylosaurus', e: '🐢', diet: 'plant', pcs: 5, ap: 4, dg: 0, hc: 150, ht: 30, site: 0 },
  { id: 'raptor', n: 'Velociraptor', e: '🦅', diet: 'vlees', pcs: 6, ap: 7, dg: 4, hc: 400, ht: 40, site: 0 },
  { id: 'trike', n: 'Triceratops', e: '🦏', diet: 'plant', pcs: 6, ap: 8, dg: 1, hc: 900, ht: 50, site: 1 },
  { id: 'brach', n: 'Brachiosaurus', e: '🦕', diet: 'plant', pcs: 8, ap: 14, dg: 1, hc: 2500, ht: 70, site: 1 },
  { id: 'stego', n: 'Stegosaurus', e: '🦔', diet: 'plant', pcs: 7, ap: 11, dg: 2, hc: 1800, ht: 60, site: 1 },
  { id: 'ptero', n: 'Pteranodon', e: '🦇', diet: 'vlees', pcs: 7, ap: 16, dg: 3, hc: 6000, ht: 80, site: 2 },
  { id: 'spino', n: 'Spinosaurus', e: '🐊', diet: 'vlees', pcs: 9, ap: 24, dg: 7, hc: 15000, ht: 100, site: 2 },
  { id: 'trex', n: 'Tyrannosaurus Rex', e: '🦖', diet: 'vlees', pcs: 10, ap: 40, dg: 10, hc: 40000, ht: 140, site: 2 },
];
const BY = {}; for (const s of SP) BY[s.id] = s;
const SITES = [{ n: 'Zandduinen', e: '🏜️', c: 40, t: 25, unlock: 0 }, { n: 'Kleiheuvels', e: '⛰️', c: 400, t: 40, unlock: 1 }, { n: 'Vulkaanrots', e: '🌋', c: 4000, t: 60, unlock: 2 }];
const FAC = [{ id: 'park', n: 'Parkeerplaats', e: '🅿️', c: 150, d: '+10 bezoekers per minuut ruimte' }, { id: 'rest', n: 'Restaurant', e: '🍔', c: 300, d: '+€1,5 per bezoeker' }, { id: 'shop', n: 'Souvenirwinkel', e: '🧸', c: 500, d: '+€2 per bezoeker' }, { id: 'price', n: 'Entreeprijs-verbetering', e: '🎟️', c: 800, d: '+30% inkomsten' }];
const eur = n => '€' + fmt(n);
export default {
  id: 'dinopark', name: 'Dinopark', emoji: '🦖', desc: 'Graaf fossielen op, broed dino\'s uit en bouw je park.',
  async create(host, api) {
    const d = await api.load();
    const S = Object.assign({ money: 150, fos: {}, dinos: {}, digs: [], crews: 1, incs: [{ sp: null, end: 0 }], pens: 1, fac: { park: 0, rest: 0, shop: 0, price: 0 }, sec: 0, unlockedSite: 0, esc: null, nextEsc: 120, earned: 0, escapes: 0, last: Date.now() }, d || {});
    const count = () => Object.values(S.dinos).reduce((a, b) => a + b, 0);
    const appeal = () => SP.reduce((a, s) => a + (S.dinos[s.id] || 0) * s.ap, 0);
    const danger = () => SP.reduce((a, s) => a + (S.dinos[s.id] || 0) * s.dg, 0);
    const visitors = () => Math.min(10 + S.fac.park * 10, 8 + appeal() * 1.5);
    const rate = () => visitors() * (3 + S.fac.rest * 1.5 + S.fac.shop * 2) * (1 + .3 * S.fac.price) / 60;
    const secPower = () => 1 + S.sec * .6;
    const cap = () => S.pens * 2;
    const collect = () => {
      const now = Date.now();
      S.digs = S.digs.filter(dg => { if (dg.end > now) return true; const site = dg.site; const pool = SP.filter(s => s.site <= site && s.site >= Math.max(0, site - 1)); const n = ri(3, 5) + S.crews - 1; const found = {}; for (let i = 0; i < n; i++) { const s = pick(pool); S.fos[s.id] = (S.fos[s.id] || 0) + 1; found[s.id] = (found[s.id] || 0) + 1; } api.toast('⛏️ Gevonden: ' + Object.keys(found).map(k => found[k] + '× ' + BY[k].e).join(' ')); return false; });
      S.incs.forEach(i => { if (i.sp && i.end <= now) { S.dinos[i.sp] = (S.dinos[i.sp] || 0) + 1; api.toast('🥚 Uitgekomen: ' + BY[i.sp].e + ' ' + BY[i.sp].n + '!'); i.sp = null; } });
    };
    const off = Math.min((Date.now() - S.last) / 1000, 28800);
    if (off > 60) { const g = rate() * off * .8; S.money += g; S.earned += g; api.toast('Het park verdiende ' + eur(g) + ' terwijl je weg was.'); if (danger() > 0 && Math.random() < clamp(off / 3600 * .02 * danger() / secPower(), 0, .8)) { const loss = Math.min(S.money * .2, rate() * 900); S.money -= loss; api.toast('🚨 Er ontsnapte een dino terwijl je weg was! Schade ' + eur(loss)); } }
    collect(); S.last = Date.now();
    const A = app(host, api, {
      bg: 'linear-gradient(#14532d,#365314 60%,#713f12)', acc: '#84cc16', tabs: [['dig', '⛏️ Opgraving'], ['lab', '🥚 Lab'], ['park', '🌴 Park'], ['sec', '🛡️ Beveiliging']],
      state: () => { S.last = Date.now(); return S; },
      tick: dt => {
        S.last = Date.now(); const g = rate() * dt; S.money += g; S.earned += g; collect();
        if (!S.esc) { S.nextEsc -= dt; if (S.nextEsc <= 0) { S.nextEsc = 90; if (danger() > 0 && Math.random() < clamp(.02 * danger() / secPower() * 1.5, 0, .7)) { const cand = SP.filter(s => S.dinos[s.id] && s.dg > 0); const s = pick(cand); S.esc = s.id; S.escapes++; } } }
      },
      head: el => { $('div', 'font-size:20px;font-weight:800', '🦖 Dinopark', el); const r = row(el, 'justify-content:space-between;margin-top:4px'); $('span', 'color:#ffe08a;font-weight:700', '💰 ' + eur(S.money), r); $('span', 'font-size:12px', '+' + eur(rate()) + '/s · 👥 ' + Math.round(visitors()) + '/min', r); },
      render: (tab, b) => {
        if (S.esc) { const s = BY[S.esc], c = card(b, 'background:#b91c1c;border:2px solid #fecaca'); $('div', 'font-weight:800;font-size:16px', '🚨 ' + s.e + ' ' + s.n + ' is ontsnapt!', c); $('div', 'font-size:13px', 'Bezoekers rennen weg! Stuur de bewakers (kans ' + Math.round(clamp(.3 + S.sec * .09, 0, .95) * 100) + '%) of sluit het park veilig.', c); btn(c, '🛡️ Bewakers sturen', () => { if (Math.random() < clamp(.3 + S.sec * .09, 0, .95)) { api.toast('✅ Dino gevangen! Wat een held.'); S.money += 50 + danger() * 10; } else { const loss = Math.min(S.money * .25, rate() * 600 + 50); S.money -= loss; api.toast('💥 Mislukt! Schade ' + eur(loss)); } S.esc = null; A.commit(); }, false, 'background:#f59e0b;color:#222;margin-right:6px'); btn(c, '🔒 Park sluiten (-' + eur(rate() * 180) + ')', () => { S.money = Math.max(0, S.money - rate() * 180); S.esc = null; A.commit(); }, false, 'background:#444'); }
        if (tab === 'dig') {
          S.digs.forEach(dg => { const c = card(b, 'background:rgba(251,191,36,.2)'); $('div', 'font-weight:700', SITES[dg.site].e + ' Graven bij ' + SITES[dg.site].n + '... ' + fmtT((dg.end - Date.now()) / 1000), c); bar(c, 1 - (dg.end - Date.now()) / dg.len, '#fbbf24'); });
          $('div', 'font-size:12px;opacity:.9', 'Graafploegen: ' + S.crews + ' (' + S.digs.length + ' bezig). Meer ploegen = meer fossielen en tegelijk graven.', b);
          SITES.forEach((st, i) => { const open = i <= S.unlockedSite; const cost = open ? st.c : st.c * 5; btn(b, open ? st.e + ' Graaf bij ' + st.n + ' · ' + eur(st.c) + ' · ' + st.t + 's' : '🔒 Ontgrendel ' + st.n + ' · ' + eur(st.c * 5), () => { if (open) { S.money -= st.c; S.digs.push({ site: i, end: Date.now() + st.t * 1000 / (1 + .15 * (S.crews - 1)), len: st.t * 1000 / (1 + .15 * (S.crews - 1)) }); } else { S.money -= cost; S.unlockedSite = i; } A.commit(); }, S.money < cost || (open && S.digs.length >= S.crews) || (!open && i > S.unlockedSite + 1), 'display:block;width:100%'); });
          const cc = Math.round(200 * Math.pow(2.5, S.crews - 1)); btn(b, '👷 Extra graafploeg · ' + eur(cc), () => { S.money -= cc; S.crews++; A.commit(); }, S.money < cc || S.crews >= 6, 'background:linear-gradient(#a855f7,#7e22ce);width:100%');
          const c = card(b); $('div', 'font-weight:800', '🦴 Fossielen', c);
          const kn = SP.filter(s => S.fos[s.id]); if (!kn.length) $('div', 'opacity:.7;font-size:13px', 'Nog niets gevonden. Begin met graven!', c);
          kn.forEach(s => { $('div', 'font-size:13px;padding:2px 0', s.e + ' ' + s.n + ': ' + S.fos[s.id] + '/' + s.pcs + ' botten', c); bar(c, S.fos[s.id] / s.pcs, '#fbbf24'); });
        } else if (tab === 'lab') {
          S.incs.forEach((inc, i) => { const c = card(b); $('div', 'font-weight:800', '🥚 Broedmachine ' + (i + 1), c); if (inc.sp) { $('div', '', BY[inc.sp].e + ' ' + BY[inc.sp].n + ' ' + fmtT((inc.end - Date.now()) / 1000), c); bar(c, 1 - (inc.end - Date.now()) / (BY[inc.sp].ht * 1000), '#f472b6'); } else { const rdy = SP.filter(s => (S.fos[s.id] || 0) >= s.pcs); if (!rdy.length) $('div', 'font-size:12px;opacity:.8', 'Verzamel genoeg fossielen van één soort.', c); rdy.forEach(s => btn(c, s.e + ' Uitbroeden ' + s.n + ' · ' + eur(s.hc), () => { S.money -= s.hc; S.fos[s.id] -= s.pcs; inc.sp = s.id; inc.end = Date.now() + s.ht * 1000; A.commit(); }, S.money < s.hc || count() + S.incs.filter(x => x.sp).length >= cap(), 'width:100%;min-height:40px;font-size:13px')); } });
          const ic = Math.round(500 * Math.pow(3, S.incs.length - 1)); btn(b, '➕ Extra broedmachine · ' + eur(ic), () => { S.money -= ic; S.incs.push({ sp: null, end: 0 }); A.commit(); }, S.money < ic || S.incs.length >= 5, 'width:100%;background:linear-gradient(#a855f7,#7e22ce)');
          $('div', 'font-size:12px;opacity:.85;margin-top:4px', 'Plek in het park: ' + count() + '/' + cap(), b);
        } else if (tab === 'park') {
          const c = card(b); $('div', 'font-weight:800', '🌴 Dino\'s in je park (' + count() + '/' + cap() + ')', c);
          if (!count()) $('div', 'opacity:.7;font-size:13px', 'Nog geen dino\'s.', c);
          SP.filter(s => S.dinos[s.id]).forEach(s => $('div', 'padding:3px 0;font-size:14px', s.e + ' ' + S.dinos[s.id] + '× ' + s.n + ' · aantrekkelijkheid ' + s.ap + ' · ' + (s.diet === 'vlees' ? '🥩' : '🌿'), c));
          const pc = Math.round(150 * Math.pow(2, S.pens - 1)); btn(b, '🏗️ Nieuw hok (+2 plekken) · ' + eur(pc), () => { S.money -= pc; S.pens++; A.commit(); }, S.money < pc || S.pens >= 12, 'width:100%');
          FAC.forEach(f => { const lv = S.fac[f.id], cost = Math.round(f.c * Math.pow(1.9, lv)), c2 = card(b); $('div', 'font-weight:800', f.e + ' ' + f.n + ' niv ' + lv, c2); $('div', 'font-size:12px;opacity:.85', f.d, c2); btn(c2, eur(cost), () => { S.money -= cost; S.fac[f.id]++; A.commit(); }, S.money < cost || lv >= 10); });
        } else {
          const c = card(b); $('div', 'font-weight:800', '🛡️ Beveiliging niv ' + S.sec, c);
          $('div', 'font-size:13px', 'Gevaar van je dino\'s: ' + danger() + ' · ontsnappingskans per ronde: ' + Math.round(clamp(.03 * danger() / secPower(), 0, .7) * 100) + '%', c);
          $('div', 'font-size:13px', 'Kans dat bewakers een ontsnapte dino vangen: ' + Math.round(clamp(.3 + S.sec * .09, 0, .95) * 100) + '%', c);
          const sc = Math.round(250 * Math.pow(2.1, S.sec)); btn(c, '🚧 Betere hekken & bewakers · ' + eur(sc), () => { S.money -= sc; S.sec++; A.commit(); }, S.money < sc || S.sec >= 12);
          $('div', 'font-size:12px;opacity:.8', 'Ontsnappingen tot nu toe: ' + S.escapes + '. Vleeseters zijn gevaarlijker (🥩).', b);
        }
      },
    });
    return { destroy() { A.destroy(); } };
  },
};
