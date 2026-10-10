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
const MAT = { cem: { e: '🪣', n: 'Cement', p: 2 }, ste: { e: '🧱', n: 'Stenen', p: 2 }, hou: { e: '🪵', n: 'Hout', p: 3 }, pan: { e: '🟫', n: 'Dakpannen', p: 4 }, gla: { e: '🪟', n: 'Glas', p: 5 } };
const PH = [
  { n: 'Fundering', e: '🕳️', w: 20, m: { cem: 0.25 } },
  { n: 'Muren', e: '🧱', w: 30, m: { ste: 0.2 } },
  { n: 'Dak', e: '🏚️', w: 20, m: { hou: 0.1, pan: 0.15 } },
  { n: 'Afwerking', e: '🪟', w: 15, m: { gla: 0.15, hou: 0.05 } },
];
const TYPES = [
  { n: 'Tuinhuisje', e: '🛖', s: 1, r: 90, t: 150, u: 0 },
  { n: 'Bungalow', e: '🏡', s: 2.2, r: 260, t: 200, u: 120 },
  { n: 'Villa', e: '🏠', s: 4.5, r: 700, t: 260, u: 600 },
  { n: 'Flatgebouw', e: '🏢', s: 9, r: 2000, t: 340, u: 2500 },
];
export default {
  id: 'bouwbedrijf',
  name: 'Bouwbedrijf',
  emoji: '🏗️',
  hint: 'Neem opdrachten aan, koop materialen en bouw huizen fase voor fase voor de deadline!',
  create(host, api) {
    const A = makeApp(host, 'linear-gradient(160deg,#b45309,#1c1917)');
    const S = { money: 60, total: 0, rep: 10, mat: { cem: 10, ste: 10, hou: 6, pan: 4, gla: 4 }, wk: 0, ham: 0, sites: 1, truck: 0, done: 0, fail: 0 };
    let sites = [null], offers = [], offT = 0, nid = 1, dirty = true, warn = 0;
    const tapV = () => 1.2 + S.ham * 0.8;
    const autoV = () => S.wk * 0.7;
    const disc = () => 1 - S.truck * 0.1;
    const mp = (k) => Math.max(1, Math.round(MAT[k].p * disc() * 10) / 10);
    const cst = { wk: () => Math.round(50 * Math.pow(1.8, S.wk)), ham: () => Math.round(35 * Math.pow(1.9, S.ham)), sites: () => 400, truck: () => Math.round(120 * Math.pow(2.3, S.truck)) };
    const mx = { wk: 10, ham: 8, sites: 2, truck: 4 };
    const earn = (n) => { S.money += n; S.total += n; api.score(Math.floor(S.total)); };
    const newOffer = () => {
      const av = TYPES.filter((t) => S.total >= t.u), t = pick(av);
      return { id: nid++, t, r: Math.round(t.r * (1 + S.rep / 200) * (0.9 + Math.random() * 0.25)), tl: Math.round(t.t * (0.9 + Math.random() * 0.3)) };
    };
    const phTotal = (s, i) => Math.round(PH[i].w * s.o.t.s);
    const need = (s) => { const i = s.ph, o = {}; for (const k of Object.keys(PH[i].m)) o[k] = PH[i].m[k]; return o; };

    function accept(o) {
      const i = sites.findIndex((s, j) => !s && j < S.sites);
      if (i < 0) return A.toast('Geen vrije bouwplaats!');
      sites[i] = { o, ph: 0, w: 0, left: o.tl, stall: false }; offers = offers.filter((x) => x !== o); dirty = true; render();
    }
    function work(s, amt) {
      if (!s || s.ph >= PH.length) return;
      let tot = phTotal(s, s.ph), left = Math.min(amt, tot - s.w);
      const m = PH[s.ph].m; let f = 1;
      for (const k of Object.keys(m)) f = Math.min(f, S.mat[k] / (m[k] * left));
      f = clamp(f, 0, 1);
      s.stall = f < 1;
      if (f <= 0.0001) { if (warn <= 0) { A.toast('Materiaal tekort! Koop bij.'); warn = 3; } return; }
      left *= f;
      for (const k of Object.keys(m)) S.mat[k] = Math.max(0, S.mat[k] - m[k] * left);
      s.w += left;
      if (s.w >= tot - 0.001) {
        s.w = 0; s.ph++;
        if (s.ph >= PH.length) {
          const bonus = s.left > s.o.tl * 0.4 ? 1.25 : 1; const v = Math.round(s.o.r * bonus);
          earn(v); S.done++; S.rep = Math.min(100, S.rep + (bonus > 1 ? 6 : 3));
          A.toast(s.o.t.e + ' Klaar! +' + fmt(v) + (bonus > 1 ? ' (snelheidsbonus)' : ''));
          sites[sites.indexOf(s)] = null; dirty = true;
        } else dirty = true;
      }
    }
    function tap(s) { work(s, tapV()); if (dirty) { dirty = false; render(); } else A.refresh(); }
    function buyMat(k, n) {
      const c = mp(k) * n; if (S.money < c) return A.toast('Te weinig geld');
      S.money -= c; S.mat[k] = (S.mat[k] || 0) + n; A.refresh();
    }
    function odd() { earn(2); A.refresh(); }
    function buy(k) {
      if (S[k] >= mx[k]) return A.toast('Maximaal!');
      const c = cst[k](); if (S.money < c) return A.toast('Te weinig geld');
      S.money -= c; S[k]++; if (k === 'sites') sites.push(null); dirty = true; render();
    }
    function tick() {
      const dt = 0.25;
      if (warn > 0) warn -= dt;
      offT -= dt;
      if (offT <= 0) { offT = 25; offers.push(newOffer()); if (offers.length > 3) offers.shift(); dirty = true; }
      for (const s of sites) if (s) {
        s.left -= dt;
        if (S.wk > 0) work(s, autoV() * dt);
        if (s && sites.includes(s) && s.left <= 0) {
          const i = sites.indexOf(s); sites[i] = null; S.fail++; S.rep = Math.max(0, S.rep - 8);
          A.toast('⏰ Te laat! Opdracht ingetrokken'); dirty = true;
        }
      }
      if (dirty) { dirty = false; render(); } else A.refresh();
    }
    A.hlive(h('span'), (e) => { e.textContent = '💰 ' + fmt(S.money); });
    A.hlive(h('span'), (e) => { e.textContent = '⭐ naam ' + Math.floor(S.rep) + '%'; });
    A.hlive(h('span'), (e) => { e.textContent = '🏠 ' + S.done + ' klaar'; });

    function render() {
      dirty = false;
      while (sites.length < S.sites) sites.push(null);
      A.draw(() => {
        const out = [];
        out.push(sec('🏗️ BOUWPLAATSEN (tik op de grote knop om te bouwen)'));
        sites.forEach((s, i) => {
          const card = h('div', box('display:flex;flex-direction:column;gap:6px'));
          if (!s) { card.appendChild(h('div', 'text-align:center;opacity:.55;padding:14px', 'Bouwplaats ' + (i + 1) + ' is leeg. Kies een opdracht.')); out.push(card); return; }
          card.appendChild(h('div', 'display:flex;justify-content:space-between', [h('b', '', s.o.t.e + ' ' + s.o.t.n), h('span', '', 'Beloning ' + fmt(s.o.r))]));
          card.appendChild(h('div', 'font-size:22px;letter-spacing:2px', PH.map((p, j) => (j < s.ph ? '✅' : p.e)).join(' ')));
          const pb = bar(0, '#fb923c'), tb = bar(1, '#38bdf8');
          const info = h('div', 'font-size:13px');
          A.live(info, (e) => { if (s.ph < PH.length) { const m = PH[s.ph].m; e.textContent = 'Fase: ' + PH[s.ph].n + (s.stall ? ' · ⚠️ wacht op ' + Object.keys(m).map((k) => MAT[k].e).join('') : '') + ' · ⏰ ' + Math.max(0, Math.ceil(s.left)) + 's'; } });
          A.live(pb, () => { if (s.ph < PH.length) pb.set(s.w / phTotal(s, s.ph)); });
          A.live(tb, () => tb.set(s.left / s.o.tl, s.left / s.o.tl > 0.4 ? '#38bdf8' : '#f87171'));
          card.append(info, pb, tb, btn('🔨 BOUWEN!', '#ea580c', () => tap(s), 'min-height:58px;font-size:20px'));
          out.push(card);
        });
        out.push(sec('📋 OPDRACHTEN'));
        if (!offers.length) out.push(h('div', 'opacity:.7;padding:6px', 'Wachten op nieuwe opdrachten…'));
        for (const o of offers) {
          out.push(btn([h('span', 'flex:1;text-align:left', o.t.e + ' ' + o.t.n), h('span', 'font-size:12px;font-weight:400', '⏰ ' + o.tl + 's · '), h('span', '', fmt(o.r))], '#0f766e', () => accept(o), 'display:flex;align-items:center;gap:6px;width:100%'));
        }
        out.push(sec('🧱 MATERIALEN (tik +10 om bij te kopen)'));
        const mr = row([]);
        for (const k of Object.keys(MAT)) {
          const b = btn([h('div', 'font-size:20px', MAT[k].e), h('div', 'font-size:12px', ''), h('div', 'font-size:11px;font-weight:400', '+10 · ' + fmt(mp(k) * 10))], '#44403c', () => buyMat(k, 10), 'flex:1;min-width:28%;padding:4px');
          A.live(b, (e) => { e.children[1].textContent = Math.floor(S.mat[k] || 0) + ' ' + MAT[k].n; e.style.opacity = S.money >= mp(k) * 10 ? 1 : 0.5; });
          mr.appendChild(b);
        }
        out.push(mr);
        out.push(btn('🔧 Klusje opknappen (+€2 per tik)', '#57534e', odd, 'width:100%'));
        out.push(sec('🛒 BEDRIJF'));
        const ups = [['wk', '👷 Bouwvakker (bouwt zelf)'], ['ham', '🔨 Betere hamer (sterkere tikken)'], ['sites', '🏗️ Tweede bouwplaats'], ['truck', '🚚 Eigen vrachtwagen (-10% materiaal)']];
        for (const [k, t] of ups) {
          const lim = S[k] >= mx[k];
          const b = btn(t + (S[k] && k !== 'sites' ? ' (niv ' + S[k] + ')' : ''), '#7c3aed', () => buy(k), 'width:100%;text-align:left;display:flex;justify-content:space-between;align-items:center;gap:8px');
          b.appendChild(h('span', '', lim ? 'MAX' : fmt(cst[k]())));
          A.live(b, (e) => { e.style.opacity = !lim && S.money >= cst[k]() ? 1 : 0.5; });
          out.push(b);
        }
        out.push(h('div', 'font-size:12px;opacity:.7;text-align:center', 'Klaar binnen 60% van de tijd = 25% bonus. Te laat = naam omlaag.'));
        return out;
      });
    }
    offers.push(newOffer()); offers.push(newOffer());
    render(); api.score(0);
    A.every(tick, 250);
    return { destroy() { A.destroy(); } };
  },
};
