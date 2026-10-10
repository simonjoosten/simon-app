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
const ING = [{ id: 'bloem', n: 'Bloem', e: '🌾', p: 1 }, { id: 'gist', n: 'Gist', e: '🧫', p: 2 }, { id: 'suiker', n: 'Suiker', e: '🍬', p: 2 }, { id: 'boter', n: 'Boter', e: '🧈', p: 3 }, { id: 'ei', n: 'Eieren', e: '🥚', p: 2 }, { id: 'melk', n: 'Melk', e: '🥛', p: 2 }, { id: 'fruit', n: 'Fruit', e: '🍎', p: 4 }, { id: 'chocola', n: 'Chocola', e: '🍫', p: 5 }, { id: 'noten', n: 'Noten', e: '🥜', p: 6 }];
const REC = [
  { id: 'brood', n: 'Brood', e: '🍞', in: ['bloem', 'gist'], t: 20, p: 6 }, { id: 'koekje', n: 'Koekjes', e: '🍪', in: ['bloem', 'boter', 'suiker'], t: 25, p: 9 },
  { id: 'pannenkoek', n: 'Pannenkoeken', e: '🥞', in: ['bloem', 'ei', 'melk'], t: 20, p: 10 }, { id: 'cake', n: 'Cake', e: '🍰', in: ['bloem', 'ei', 'suiker'], t: 30, p: 14 },
  { id: 'croissant', n: 'Croissants', e: '🥐', in: ['bloem', 'boter', 'gist'], t: 30, p: 15 }, { id: 'muffin', n: 'Muffins', e: '🧁', in: ['bloem', 'fruit', 'ei'], t: 30, p: 18 },
  { id: 'brownie', n: 'Brownies', e: '🟫', in: ['chocola', 'ei', 'boter'], t: 35, p: 22 }, { id: 'appeltaart', n: 'Appeltaart', e: '🥧', in: ['bloem', 'boter', 'fruit'], t: 40, p: 25 },
  { id: 'slagroom', n: 'Slagroomtaart', e: '🎂', in: ['ei', 'melk', 'suiker'], t: 50, p: 28 }, { id: 'notentaart', n: 'Notentaart', e: '🌰', in: ['noten', 'suiker', 'boter'], t: 45, p: 32 },
  { id: 'donut', n: 'Donuts', e: '🍩', in: ['bloem', 'suiker', 'melk'], t: 25, p: 12 }, { id: 'chocotaart', n: 'Chocoladetaart', e: '🍫', in: ['chocola', 'melk', 'suiker'], t: 40, p: 30 },
];
const key = a => a.slice().sort().join('+');
const RBY = {}; for (const r of REC) RBY[r.id] = r;
const RKEY = {}; for (const r of REC) RKEY[key(r.in)] = r;
const IBY = {}; for (const i of ING) IBY[i.id] = i;
const eur = n => '€' + fmt(n);
const QM = { p: 1.5, g: 1, b: .25 };
export default {
  id: 'bakkerij', name: 'Bakkerij', emoji: '🥖', desc: 'Ontdek recepten, bak op tijd en bedien je klanten.',
  async create(host, api) {
    const d = await api.load();
    const S = Object.assign({ money: 60, ing: { bloem: 8, gist: 4 }, known: ['brood'], ovens: [{ r: null, start: 0 }], disp: {}, cust: [], spec: null, upg: { disp: 0, decor: 0, ad: 0 }, nextC: 5, nextS: 150, served: 0, earned: 0, mix: [], msg: '', last: Date.now() }, d || {});
    const cap = () => 12 * (1 + S.upg.disp);
    const dsp = id => S.disp[id] || (S.disp[id] = { p: 0, g: 0, b: 0 });
    const total = id => { const x = dsp(id); return x.p + x.g + x.b; };
    const off = Math.min((Date.now() - S.last) / 1000, 28800);
    if (off > 90) {
      let sold = 0, gain = 0; const maxS = Math.floor(off / 60) * (1 + S.upg.decor);
      for (const id of S.known) { const x = dsp(id); for (const q of ['p', 'g', 'b']) { while (x[q] > 0 && sold < maxS) { x[q]--; sold++; gain += RBY[id].p * QM[q] * .7; } } }
      S.money += gain; S.earned += gain; if (gain) api.toast('Nachtverkoop: ' + sold + ' stuks, ' + eur(gain));
      S.ovens.forEach(o => { if (o.r) { o.start = Date.now() - 999999000; } });
    }
    S.last = Date.now();
    const quality = (o) => { const R = RBY[o.r], f = (Date.now() - o.start) / (R.t * 1000); return f < .7 ? 'b' : f < .9 ? 'g' : f <= 1.15 ? 'p' : f <= 1.4 ? 'g' : 'b'; };
    const newCust = () => { if (!S.known.length) return; const R = RBY[pick(S.known)]; S.cust.push({ id: R.id, pat: 45 + S.upg.decor * 8, tip: Math.random() < .3 }); };
    const serve = (c, i) => { const x = dsp(c.id); const q = x.p ? 'p' : x.g ? 'g' : x.b ? 'b' : null; if (!q) return false; x[q]--; const g = RBY[c.id].p * QM[q] * (c.tip ? 1.5 : 1) * (1 + S.upg.ad * .1); S.money += g; S.earned += g; S.served++; S.cust.splice(i, 1); return true; };
    const newSpec = () => {
      const k = S.known.filter(id => RBY[id].p >= 9); if (k.length < 2) return;
      const items = {}; const n = ri(2, 3); for (let i = 0; i < n; i++) { const id = pick(k); items[id] = (items[id] || 0) + ri(2, 4); }
      let val = 0; for (const id in items) val += items[id] * RBY[id].p;
      S.spec = { items, reward: Math.round(val * 2.2), exp: Date.now() + 360000, name: pick(['Verjaardagsfeest', 'Bruiloft', 'Kantoorborrel', 'Schoolfeest', 'Koninklijke ontvangst']) };
    };
    const A = app(host, api, {
      bg: 'linear-gradient(#5b3a1e,#a2672b)', acc: '#d97706', tabs: [['oven', '🔥 Oven'], ['shop', '🛍️ Winkel'], ['rec', '📖 Recepten'], ['inkoop', '🧺 Inkoop'], ['up', '⬆️ Upgrades']],
      state: () => { S.last = Date.now(); return S; },
      tick: dt => {
        S.last = Date.now();
        S.cust.forEach(c => c.pat -= dt); S.cust = S.cust.filter(c => c.pat > 0);
        S.nextC -= dt; if (S.nextC <= 0) { if (S.cust.length < 3 + S.upg.decor) newCust(); S.nextC = 10 / (1 + S.upg.decor * .2 + S.upg.ad * .1); }
        S.nextS -= dt; if (S.nextS <= 0) { if (!S.spec) newSpec(); S.nextS = 180; }
        if (S.spec && S.spec.exp < Date.now()) S.spec = null;
      },
      head: el => { $('div', 'font-size:20px;font-weight:800', '🥖 Bakkerij', el); const r = row(el, 'justify-content:space-between;margin-top:4px'); $('span', 'color:#ffe08a;font-weight:700', '💰 ' + eur(S.money), r); $('span', 'font-size:12px', '🧾 ' + fmt(S.served) + ' klanten · ' + S.known.length + '/' + REC.length + ' recepten', r); },
      render: (tab, b) => {
        if (tab === 'oven') {
          $('div', 'font-size:12px;opacity:.9;margin-bottom:4px', 'Haal je bakwerk eruit in het gouden venster voor perfecte kwaliteit (1,5x). Te vroeg of te laat = rauw of verbrand.', b);
          S.ovens.forEach((o, i) => {
            const c = card(b);
            if (!o.r) {
              $('div', 'font-weight:800', '♨️ Oven ' + (i + 1) + ' – leeg', c);
              S.known.forEach(id => { const R = RBY[id], ok = R.in.every(k => (S.ing[k] || 0) >= 1); btn(c, R.e + ' ' + R.n + ' (' + R.in.map(k => IBY[k].e).join('') + ' · ' + R.t + 's)', () => { R.in.forEach(k => S.ing[k]--); o.r = id; o.start = Date.now(); A.commit(); }, !ok, 'width:100%;min-height:40px;font-size:13px;background:' + (ok ? '' : '#555')); });
            } else {
              const R = RBY[o.r], f = (Date.now() - o.start) / (R.t * 1000), q = quality(o);
              $('div', 'font-weight:800', R.e + ' ' + R.n + ' – ' + (q === 'p' ? '✨ PERFECT!' : q === 'g' ? 'bijna / goed' : f < 1 ? 'nog rauw' : '🔥 verbrand!'), c);
              const wrap = $('div', 'position:relative;height:18px;background:rgba(0,0,0,.4);border-radius:9px;overflow:hidden;margin:6px 0', null, c);
              const sc = 1.6; $('div', 'position:absolute;left:' + (.9 / sc * 100) + '%;width:' + (.25 / sc * 100) + '%;height:100%;background:rgba(250,204,21,.5)', null, wrap);
              $('div', 'position:absolute;left:0;height:100%;width:' + (clamp(f / sc, 0, 1) * 100) + '%;background:' + (q === 'p' ? '#facc15' : q === 'g' ? '#fb923c' : f < 1 ? '#93c5fd' : '#7f1d1d') + ';opacity:.85', null, wrap);
              btn(c, '🧤 Uit de oven halen', () => { dsp(o.r)[q] += 3; if (total(o.r) > cap()) { let ex = total(o.r) - cap(); for (const k of ['b', 'g', 'p']) { const m = Math.min(ex, dsp(o.r)[k]); dsp(o.r)[k] -= m; ex -= m; } api.toast('Vitrine vol, een deel is weggegooid.'); } o.r = null; A.commit(); }, false, 'width:100%');
            }
          });
        } else if (tab === 'shop') {
          if (S.spec) { const sp = S.spec, c = card(b, 'background:#7c3aed'); $('div', 'font-weight:800', '🎉 Speciale bestelling: ' + sp.name, c); const ok = Object.keys(sp.items).every(id => total(id) >= sp.items[id]); $('div', 'font-size:13px', Object.keys(sp.items).map(id => sp.items[id] + '× ' + RBY[id].e + total(id) + ' op voorraad').join(' · ') + ' · ' + fmtT((sp.exp - Date.now()) / 1000), c); btn(c, 'Leveren · ' + eur(sp.reward), () => { for (const id in sp.items) { let n = sp.items[id]; for (const q of ['b', 'g', 'p']) { const m = Math.min(n, dsp(id)[q]); dsp(id)[q] -= m; n -= m; } } S.money += sp.reward; S.earned += sp.reward; S.spec = null; A.commit(); }, !ok, 'background:#facc15;color:#222'); }
          $('div', 'font-weight:700', '🧑‍🤝‍🧑 Klanten (' + S.cust.length + ')', b);
          if (!S.cust.length) $('div', 'opacity:.8;font-size:13px', 'Even wachten op klanten...', b);
          S.cust.forEach((c, i) => { const R = RBY[c.id], cc = card(b), r = row(cc); $('div', 'font-size:28px', pick2(i), r); const t = $('div', 'flex:1', null, r); $('div', 'font-weight:700;font-size:14px', R.e + ' ' + R.n + (c.tip ? ' 💝 geeft fooi' : ''), t); bar(t, c.pat / (45 + S.upg.decor * 8), c.pat < 12 ? '#f55' : '#4ade80'); btn(r, total(c.id) ? 'Serveer' : 'Op?', () => { serve(c, i); A.commit(); }, !total(c.id), 'min-width:80px'); });
          const c = card(b); $('div', 'font-weight:700', '🪟 Vitrine (max ' + cap() + ' per soort)', c);
          S.known.forEach(id => { const x = dsp(id); $('div', 'font-size:13px;padding:2px 0', RBY[id].e + ' ' + RBY[id].n + ': ✨' + x.p + ' 👍' + x.g + ' 🔥' + x.b + ' · ' + eur(RBY[id].p), c); });
        } else if (tab === 'rec') {
          const c = card(b); $('div', 'font-weight:800', '🧪 Experimenteer (kies 2 of 3 ingrediënten)', c);
          const r = row(c, 'flex-wrap:wrap');
          ING.forEach(x => { const on = S.mix.includes(x.id); btn(r, x.e + ' ' + (S.ing[x.id] || 0), () => { S.mix = on ? S.mix.filter(m => m !== x.id) : S.mix.length < 3 ? [...S.mix, x.id] : S.mix; A.commit(); }, false, 'min-width:56px;padding:4px 6px;background:' + (on ? '#16a34a' : '#555')); });
          const can = S.mix.length >= 2 && S.mix.every(m => (S.ing[m] || 0) >= 1);
          btn(c, '🔬 Probeer' + (S.mix.length ? ' ' + S.mix.map(m => IBY[m].e).join('+') : ''), () => {
            S.mix.forEach(m => S.ing[m]--); const R = RKEY[key(S.mix)];
            if (R && !S.known.includes(R.id)) { S.known.push(R.id); S.msg = '🎉 Nieuw recept ontdekt: ' + R.e + ' ' + R.n + '!'; S.money += R.p * 5; }
            else if (R) S.msg = 'Dat recept ken je al: ' + R.e + ' ' + R.n + '.'; else S.msg = '🤢 Plakkerige prut... dat werkt niet.';
            S.mix = []; A.commit();
          }, !can);
          if (S.msg) $('div', 'margin-top:6px;font-weight:700;color:#ffe08a', S.msg, c);
          const c2 = card(b); $('div', 'font-weight:800', '📖 Kookboek', c2);
          REC.forEach(R => { const k = S.known.includes(R.id); $('div', 'font-size:13px;padding:2px 0;' + (k ? '' : 'opacity:.6'), k ? R.e + ' ' + R.n + ' = ' + R.in.map(x => IBY[x].e).join(' + ') + ' · ' + R.t + 's · ' + eur(R.p) : '❓ Onbekend recept (' + R.in.length + ' ingrediënten)' + (R.in.length === 3 ? '' : ''), c2); });
          const un = REC.filter(R => !S.known.includes(R.id));
          if (un.length) btn(c2, '💡 Hint kopen ' + eur(80), () => { S.money -= 80; const R = un[0]; S.msg = 'Hint: het ' + R.n.toLowerCase() + ' bevat ' + IBY[R.in[0]].e + ' ' + IBY[R.in[0]].n.toLowerCase() + '.'; A.commit(); }, S.money < 80, 'background:#555');
        } else if (tab === 'inkoop') {
          ING.forEach(x => { const cost = x.p * 5, c = card(b), r = row(c, 'justify-content:space-between'); $('div', 'font-weight:700', x.e + ' ' + x.n + ': ' + (S.ing[x.id] || 0), r); btn(r, '+5 · ' + eur(cost), () => { S.money -= cost; S.ing[x.id] = (S.ing[x.id] || 0) + 5; A.commit(); }, S.money < cost, 'min-width:110px'); });
        } else {
          const U = [['disp', '🪟 Grotere vitrine', 100], ['decor', '🪴 Gezellige inrichting', 150], ['ad', '📢 Reclame', 250]];
          U.forEach(([id, n, c0]) => { const lv = S.upg[id], cost = Math.round(c0 * Math.pow(2, lv)), c = card(b); $('div', 'font-weight:800', n + ' niv ' + lv, c); btn(c, lv >= 8 ? 'MAX' : eur(cost), () => { S.money -= cost; S.upg[id]++; A.commit(); }, S.money < cost || lv >= 8); });
          const oc = Math.round(200 * Math.pow(3, S.ovens.length - 1)), c = card(b); $('div', 'font-weight:800', '♨️ Ovens: ' + S.ovens.length + '/6', c); btn(c, 'Extra oven · ' + eur(oc), () => { S.money -= oc; S.ovens.push({ r: null, start: 0 }); A.commit(); }, S.money < oc || S.ovens.length >= 6);
        }
      },
    });
    function pick2(i) { return ['🧑', '👵', '👨‍🦰', '👧', '🧔', '👩‍🦳'][i % 6]; }
    return { destroy() { A.destroy(); } };
  },
};
