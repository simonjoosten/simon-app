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
const FL = [
  { id: 'van', n: 'Vanille', e: '🍦', c: '#fde68a', u: 0, w: [1, 1, 2, 2] },
  { id: 'aard', n: 'Aardbei', e: '🍓', c: '#fb7185', u: 0, w: [3, 2, 1, 0.5] },
  { id: 'choc', n: 'Chocolade', e: '🍫', c: '#a16207', u: 0, w: [1, 1, 2, 3] },
  { id: 'cit', n: 'Citroen', e: '🍋', c: '#fde047', u: 150, w: [3, 2, 0.5, 0.3] },
  { id: 'munt', n: 'Munt', e: '🌿', c: '#34d399', u: 500, w: [3, 2, 1, 0.3] },
  { id: 'pist', n: 'Pistache', e: '🥜', c: '#a3e635', u: 1200, w: [1, 2, 2, 2] },
];
const TP = [
  { id: 'saus', n: 'Chocosaus', e: '🍫', b: 60 },
  { id: 'hagel', n: 'Hagelslag', e: '🌈', b: 140 },
  { id: 'kers', n: 'Kers', e: '🍒', b: 300 },
];
const WE = [
  { n: 'Zonnig', e: '☀️', m: 1.7 }, { n: 'Mild', e: '⛅', m: 1 }, { n: 'Regen', e: '🌧️', m: 0.5 }, { n: 'Koud', e: '❄️', m: 0.45 },
];
const SEAS = ['🌸 Lente', '☀️ Zomer', '🍂 Herfst', '❄️ Winter'];
export default {
  id: 'ijssalon',
  name: 'IJssalon',
  emoji: '🍨',
  hint: 'Bouw de ijsjes zoals klanten vragen. Let op het weer en kies je smaken!',
  save: 'day',
  create(host, api) {
    const A = makeApp(host, 'linear-gradient(160deg,#0e7490,#1e3a8a)');
    const S = { money: 25, total: 0, shop: 0, stock: { van: 10, aard: 10, choc: 10 }, tops: {}, mach: 0, frz: 0, wT: 0, wi: 1, served: 0, lost: 0 };
    let cust = [], tray = [], topSel = null, sp = 2, nid = 1, dirty = true, ok = false;
    const unl = (f) => S.total >= f.u;
    const cap = () => 20 + S.frz * 10;
    const sPrice = () => 2.5 * (1 + S.mach * 0.15);
    const qmax = () => (S.shop ? 6 : 3);
    const cMach = () => Math.round(50 * Math.pow(1.9, S.mach));
    const cFrz = () => Math.round(40 * Math.pow(1.8, S.frz));
    const season = () => Math.floor(S.wT / 160) % 4;
    const weather = () => WE[S.wi];
    const save = () => { if (ok) api.save(JSON.parse(JSON.stringify(S))); };
    const earn = (n) => { S.money += n; S.total += n; api.score(Math.floor(S.total)); };
    const change = () => { save(); render(); };
    const trayCount = (f) => tray.filter((x) => x === f).length;

    function addScoop(f) {
      if (tray.length >= 3) return A.toast('Maximaal 3 bollen');
      if ((S.stock[f.id] || 0) - trayCount(f.id) < 1) return A.toast('Deze smaak is op! Koop bij.');
      tray.push(f.id); render();
    }
    function give(c) {
      if (!tray.length) return A.toast('Maak eerst een ijsje');
      let hit = 0; tray.forEach((x, i) => { if (c.w[i] === x) hit++; });
      const exact = hit === c.w.length && tray.length === c.w.length;
      const topOk = (c.top || null) === (topSel || null);
      for (const x of tray) S.stock[x] = Math.max(0, (S.stock[x] || 0) - 1);
      let v = tray.length * sPrice() + (topSel ? 1.5 : 0);
      if (exact && topOk) v = v * 1.4 + (c.pat / c.max > 0.4 ? 2 : 0); else if (hit > 0) v *= 0.7; else v *= 0.3;
      v = Math.max(1, Math.round(v)); earn(v); S.served++;
      A.toast((exact && topOk ? '😍 Precies goed! +' : hit ? '🙂 Beetje anders +' : '😕 Verkeerd ijsje +') + fmt(v));
      cust = cust.filter((x) => x !== c); tray = []; topSel = null; change();
    }
    function restock(f) {
      if (S.money < 8) return A.toast('Te weinig geld');
      if ((S.stock[f.id] || 0) + 8 > cap()) return A.toast('Vriezer vol');
      S.money -= 8; S.stock[f.id] = (S.stock[f.id] || 0) + 8; change();
    }
    function buyTop(t) { if (S.tops[t.id]) return; if (S.money < t.b) return A.toast('Te weinig geld'); S.money -= t.b; S.tops[t.id] = 1; change(); }
    function buyShop() { if (S.money < 500) return A.toast('Te weinig geld'); S.money -= 500; S.shop = 1; change(); }
    function buyMach() { const c = cMach(); if (S.mach >= 6) return; if (S.money < c) return A.toast('Te weinig geld'); S.money -= c; S.mach++; change(); }
    function buyFrz() { const c = cFrz(); if (S.frz >= 5) return; if (S.money < c) return A.toast('Te weinig geld'); S.money -= c; S.frz++; change(); }

    function tick() {
      const dt = 0.25;
      S.wT += dt;
      if (Math.floor(S.wT * 4) % 160 === 0) {
        const s = season(), r = Math.random();
        S.wi = s === 1 ? (r < 0.6 ? 0 : r < 0.85 ? 1 : 2) : s === 3 ? (r < 0.5 ? 3 : r < 0.8 ? 2 : 1) : (r < 0.3 ? 0 : r < 0.7 ? 1 : 2);
        A.toast('Nu: ' + weather().e + ' ' + weather().n); dirty = true;
      }
      sp -= dt;
      if (sp <= 0) {
        const wm = weather().m * (S.shop ? Math.max(0.8, 1) : (S.wi === 2 ? 0.6 : 1));
        sp = 5 / wm / (S.shop ? 1.5 : 1);
        if (cust.length < qmax()) {
          const av = FL.filter(unl), n = rnd(1, S.shop ? 3 : 2);
          const w = []; for (let i = 0; i < n; i++) {
            const tot = av.reduce((a, f) => a + f.w[S.wi], 0); let r = Math.random() * tot, ch = av[0];
            for (const f of av) { r -= f.w[S.wi]; if (r <= 0) { ch = f; break; } }
            w.push(ch.id);
          }
          const tk = Object.keys(S.tops);
          const mx = S.shop ? 40 : 28;
          cust.push({ id: nid++, w, top: tk.length && Math.random() < 0.4 ? pick(tk) : null, pat: mx, max: mx, f: pick(['👦', '👧', '🧑', '👩', '👨', '🧒']) }); dirty = true;
        }
      }
      if (S.money < 8 && FL.filter(unl).every((f) => !(S.stock[f.id] > 0))) { S.stock.van = (S.stock.van || 0) + 6; A.toast('🎁 Een leverancier schenkt 6 bollen vanille'); dirty = true; }
      for (const c of cust) c.pat -= dt;
      const gone = cust.filter((c) => c.pat <= 0);
      if (gone.length) { cust = cust.filter((c) => c.pat > 0); S.lost += gone.length; A.toast('😢 Klant weggelopen'); dirty = true; }
      if (Math.floor(S.wT * 4) % 20 === 0) save();
      if (dirty) { dirty = false; render(); } else A.refresh();
    }
    A.hlive(h('span'), (e) => { e.textContent = '💰 ' + fmt(S.money); });
    A.hlive(h('span'), (e) => { e.textContent = SEAS[season()] + ' ' + weather().e + ' ' + weather().n; });
    A.hlive(h('span'), (e) => { e.textContent = S.shop ? '🏪 Winkel' : '🛒 Kar'; });

    const fe = (id) => FL.find((f) => f.id === id).e;
    function render() {
      A.draw(() => {
        const out = [];
        out.push(sec('👥 KLANTEN (' + cust.length + '/' + qmax() + ') · tik om je ijsje te geven'));
        const cr = row([], 'min-height:84px');
        if (!cust.length) cr.appendChild(h('div', 'opacity:.7;padding:10px', 'Geen klanten… ' + (weather().m < 1 ? 'slecht weer!' : 'straks komen ze!')));
        for (const c of cust) {
          const b = bar(1);
          const card = h('div', box('flex:1;min-width:30%;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px'), [h('div', 'font-size:22px', c.f + (c.top ? TP.find((t) => t.id === c.top).e : '')), h('div', 'font-size:22px;line-height:1', c.w.map(fe).join('')), b], () => give(c));
          A.live(card, () => { const p = c.pat / c.max; b.set(p, p > 0.5 ? '#4ade80' : p > 0.25 ? '#facc15' : '#f87171'); });
          cr.appendChild(card);
        }
        out.push(cr);
        out.push(sec('🍦 JOUW IJSJE'));
        out.push(h('div', box('display:flex;align-items:center;justify-content:space-between;min-height:44px'), [h('div', 'font-size:28px', tray.length ? tray.map(fe).join('') + (topSel ? TP.find((t) => t.id === topSel).e : '') + '🍦' : h('span', 'font-size:13px;opacity:.7', 'tik op smaken')), btn('🗑️', '#be123c', () => { tray = []; topSel = null; render(); }, 'min-height:36px')]));
        const sr = row([]);
        for (const f of FL) {
          if (!unl(f)) { sr.appendChild(h('div', box('flex:1;min-width:30%;text-align:center;opacity:.5;font-size:12px;padding:12px 4px'), '🔒 ' + fmt(f.u))); continue; }
          const b = btn([h('div', 'font-size:22px', f.e), h('div', 'font-size:11px', f.n), h('div', 'font-size:11px', ''), ], '#0369a1', () => addScoop(f), 'flex:1;min-width:30%;padding:4px');
          A.live(b, (e) => { e.children[2].textContent = (S.stock[f.id] || 0) + ' over'; e.style.opacity = (S.stock[f.id] || 0) > 0 ? 1 : 0.4; });
          sr.appendChild(b);
        }
        out.push(sr);
        const ts = Object.keys(S.tops);
        if (ts.length) out.push(row(ts.map((id) => btn(TP.find((t) => t.id === id).e + ' ' + TP.find((t) => t.id === id).n, topSel === id ? '#16a34a' : '#0e7490', () => { topSel = topSel === id ? null : id; render(); }, 'flex:1;min-width:30%'))));
        out.push(sec('🛒 INKOPEN & UPGRADES'));
        out.push(row(FL.filter(unl).map((f) => { const b = btn(f.e + ' +8 · ' + fmt(8), '#15803d', () => restock(f), 'flex:1;min-width:30%;font-size:13px'); return b; })));
        const up = (t, c, fn, dim) => { const b = btn(t, '#7c3aed', fn, 'width:100%;text-align:left;display:flex;justify-content:space-between'); b.appendChild(h('span', '', c)); A.live(b, (e) => { e.style.opacity = dim() ? 1 : 0.5; }); return b; };
        if (!S.shop) out.push(up('🏪 Winkel openen (meer plek, altijd droog)', fmt(500), buyShop, () => S.money >= 500));
        out.push(up('🧊 IJsmachine niv ' + S.mach + ' (+15% prijs)', S.mach >= 6 ? 'MAX' : fmt(cMach()), buyMach, () => S.mach < 6 && S.money >= cMach()));
        out.push(up('❄️ Grotere vriezer (' + cap() + ')', S.frz >= 5 ? 'MAX' : fmt(cFrz()), buyFrz, () => S.frz < 5 && S.money >= cFrz()));
        for (const t of TP) if (!S.tops[t.id]) out.push(up(t.e + ' Topping: ' + t.n, fmt(t.b), () => buyTop(t), () => S.money >= t.b));
        out.push(h('div', 'font-size:12px;opacity:.7;text-align:center', 'Bediend: ' + S.served + ' · Weggelopen: ' + S.lost));
        return out;
      });
    }
    const go = () => { ok = true; api.score(Math.floor(S.total)); render(); A.every(tick, 250); };
    api.load().then((s) => {
      if (A.isDead()) return;
      if (s && typeof s === 'object') { Object.assign(S, s); S.stock = s.stock || {}; S.tops = s.tops || {}; }
      go();
    }).catch(() => { if (!A.isDead()) go(); });
    return { destroy() { if (ok) save(); A.destroy(); } };
  },
};
