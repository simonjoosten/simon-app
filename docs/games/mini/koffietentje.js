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
const DR = [
  { id: 'espresso', n: 'Espresso', e: '☕', p: 3, t: 2, u: 0 },
  { id: 'cappu', n: 'Cappuccino', e: '🥛', p: 5, t: 3.5, u: 80 },
  { id: 'latte', n: 'Latte', e: '🧋', p: 8, t: 5, u: 300 },
  { id: 'choco', n: 'Choco', e: '🍫', p: 11, t: 6.5, u: 900 },
];
const UP = {
  mach: { n: '☕ Extra machine', d: 'meer koffie tegelijk', b: 60, g: 2, max: 3 },
  speed: { n: '⚡ Snellere machine', d: '+30% tempo', b: 45, g: 1.7, max: 8 },
  staff: { n: '🧑‍🍳 Barista inhuren', d: 'helpt zelf met zetten en serveren', b: 120, g: 2.1, max: 5 },
  deco: { n: '🪴 Gezellig interieur', d: 'meer klanten, meer geduld', b: 80, g: 1.9, max: 6 },
  price: { n: '🏷️ Betere bonen', d: '+20% prijs', b: 70, g: 1.9, max: 6 },
};
export default {
  id: 'koffietentje',
  name: 'Koffietentje',
  emoji: '☕',
  hint: 'Zet koffie en tik op wachtende klanten om te serveren. Koop upgrades!',
  save: 'day',
  create(host, api) {
    const A = makeApp(host, 'linear-gradient(160deg,#7c4a1e,#3b1d0a)');
    const S = { money: 20, total: 0, beans: 12, day: 1, dayT: 0, ready: {}, ups: { mach: 0, speed: 0, staff: 0, deco: 0, price: 0 }, served: 0, lost: 0 };
    let cust = [], brew = [], sp = 2, staffT = 3, nid = 1, dirty = true, ok = false;
    const unl = (d) => S.total >= d.u;
    const price = (d) => Math.round(d.p * (1 + S.ups.price * 0.2));
    const slots = () => 1 + S.ups.mach;
    const spd = () => 1 + S.ups.speed * 0.3;
    const cost = (k) => Math.round(UP[k].b * Math.pow(UP[k].g, S.ups[k]));
    const rdy = () => DR.reduce((a, d) => a + (S.ready[d.id] || 0), 0);
    const save = () => { if (ok) api.save(JSON.parse(JSON.stringify(S))); };
    const earn = (n) => { S.money += n; S.total += n; api.score(Math.floor(S.total)); };
    const change = () => { dirty = true; save(); render(); dirty = false; };

    function startBrew(d) {
      if (!unl(d)) return A.toast('Nog op slot: verdien ' + fmt(d.u));
      if (S.beans < 1) return A.toast('Geen bonen meer! Koop bonen.');
      if (brew.length >= slots()) return A.toast('Alle machines zijn bezig');
      if (rdy() + brew.length >= 8) return A.toast('Toonbank is vol, serveer eerst');
      S.beans--; brew.push({ d, t: d.t }); change();
    }
    function serve(c) {
      if (!(S.ready[c.w.id] > 0)) return A.toast('Nog geen ' + c.w.n + ' klaar!');
      S.ready[c.w.id]--;
      const tip = c.pat / c.max > 0.5 ? Math.ceil(price(c.w) * 0.35) : 0;
      earn(price(c.w) + tip); S.served++;
      cust = cust.filter((x) => x !== c);
      A.toast('+' + fmt(price(c.w) + tip) + (tip ? ' (fooi!)' : '')); change();
    }
    function buy(k) {
      if (S.ups[k] >= UP[k].max) return A.toast('Maximaal!');
      const c = cost(k); if (S.money < c) return A.toast('Te weinig geld');
      S.money -= c; S.ups[k]++; change();
    }
    function buyBeans() { if (S.money < 12) return A.toast('Te weinig geld'); S.money -= 12; S.beans += 20; change(); }

    function tick() {
      const dt = 0.25;
      sp -= dt;
      if (sp <= 0) {
        sp = rnd(30, 70) / 10 / (1 + S.ups.deco * 0.2);
        if (cust.length < 5) {
          const opts = DR.filter(unl);
          const w = Math.random() < 0.5 ? opts[0] : pick(opts);
          const mx = 24 + S.ups.deco * 4;
          cust.push({ id: nid++, w, pat: mx, max: mx, f: pick(['🧑', '👩', '👨', '🧓', '👧', '🧔', '👱']) }); dirty = true;
        }
      }
      for (const b of brew) b.t -= dt * spd();
      const done = brew.filter((b) => b.t <= 0);
      if (done.length) { brew = brew.filter((b) => b.t > 0); done.forEach((b) => { S.ready[b.d.id] = (S.ready[b.d.id] || 0) + 1; }); dirty = true; }
      for (const c of cust) c.pat -= dt;
      const gone = cust.filter((c) => c.pat <= 0);
      if (gone.length) { cust = cust.filter((c) => c.pat > 0); S.lost += gone.length; A.toast('😠 Een klant liep weg'); dirty = true; }
      if (S.ups.staff > 0) {
        staffT -= dt;
        if (staffT <= 0) {
          staffT = 7 / S.ups.staff;
          const c = cust.find((x) => S.ready[x.w.id] > 0);
          if (c) { S.ready[c.w.id]--; earn(price(c.w)); S.served++; cust = cust.filter((x) => x !== c); }
          else {
            const n = cust.find((x) => !(S.ready[x.w.id] > 0) && !brew.some((b) => b.d === x.w));
            if (n && S.beans > 0 && brew.length < slots() && rdy() + brew.length < 8) { S.beans--; brew.push({ d: n.w, t: n.w.t }); }
          }
          dirty = true;
        }
      }
      if (S.beans < 1 && S.money < 12 && !brew.length && !cust.some((c) => S.ready[c.w.id] > 0)) { S.beans += 5; A.toast('🎁 De buurman geeft 5 bonen'); dirty = true; }
      S.dayT += dt;
      if (S.dayT >= 90) { S.dayT = 0; S.day++; A.toast('☀️ Dag ' + S.day + ' begint!'); }
      if (Math.floor(S.dayT * 4) % 20 === 0) save();
      if (dirty) { dirty = false; render(); } else A.refresh();
    }

    A.hlive(h('span'), (e) => { e.textContent = '💰 ' + fmt(S.money); });
    A.hlive(h('span'), (e) => { e.textContent = '🫘 ' + S.beans; });
    A.hlive(h('span'), (e) => { e.textContent = '📅 Dag ' + S.day; });

    function render() {
      A.draw(() => {
        const out = [];
        out.push(sec('👥 KLANTEN (tik om te serveren)'));
        const cr = row([], 'min-height:84px');
        if (!cust.length) cr.appendChild(h('div', 'opacity:.7;padding:10px', 'Even wachten op de eerste klant…'));
        for (const c of cust) {
          const b = bar(1, '#4ade80');
          const card = h('div', box('width:30%;min-width:96px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;flex:1'), [h('div', 'font-size:28px;line-height:1', c.f + c.w.e), h('div', 'font-size:12px', c.w.n), b], () => serve(c));
          A.live(card, () => { const p = c.pat / c.max; b.set(p, p > 0.5 ? '#4ade80' : p > 0.25 ? '#facc15' : '#f87171'); card.style.outline = S.ready[c.w.id] > 0 ? '3px solid #4ade80' : 'none'; });
          cr.appendChild(card);
        }
        out.push(cr);
        out.push(sec('🧺 TOONBANK'));
        const stock = DR.filter((d) => S.ready[d.id] > 0).map((d) => d.e.repeat(S.ready[d.id])).join(' ');
        out.push(h('div', box('min-height:22px;font-size:22px'), stock || h('span', 'font-size:13px;opacity:.7', 'leeg, zet koffie!')));
        if (brew.length) {
          const bb = h('div', box('display:flex;flex-direction:column;gap:4px;font-size:13px'));
          for (const b of brew) { const br = bar(0, '#fb923c'); A.live(br, () => br.set(1 - b.t / b.d.t)); bb.append(h('div', '', 'Bezig: ' + b.d.e + ' ' + b.d.n), br); }
          out.push(bb);
        }
        out.push(sec('☕ KOFFIE ZETTEN (machines ' + brew.length + '/' + slots() + ')'));
        const g = row([]);
        for (const d of DR) {
          const b = btn(unl(d) ? [d.e + ' ' + d.n, h('div', 'font-size:11px;font-weight:400', fmt(price(d)) + ' · ' + d.t + 's')] : '🔒 ' + fmt(d.u), unl(d) ? '#b45309' : '#57534e', () => startBrew(d), 'flex:1;min-width:46%');
          g.appendChild(b);
        }
        out.push(g);
        out.push(sec('🛒 WINKEL'));
        const bb = btn('🫘 20 bonen kopen · ' + fmt(12), '#15803d', buyBeans, 'width:100%'); A.live(bb, (e) => { e.style.opacity = S.money >= 12 ? 1 : 0.5; });
        out.push(bb);
        for (const k of Object.keys(UP)) {
          const u = UP[k];
          const b = btn([h('div', 'text-align:left', u.n + (S.ups[k] ? ' (niv ' + S.ups[k] + ')' : '')), h('div', 'font-size:11px;font-weight:400;text-align:left', u.d)], '#7c3aed', () => buy(k), 'width:100%;display:flex;justify-content:space-between;align-items:center;gap:8px');
          b.appendChild(h('div', '', S.ups[k] >= u.max ? 'MAX' : fmt(cost(k))));
          A.live(b, (e) => { e.style.opacity = S.money >= cost(k) && S.ups[k] < u.max ? 1 : 0.5; });
          out.push(b);
        }
        out.push(h('div', 'font-size:12px;opacity:.7;text-align:center', 'Bediend: ' + S.served + ' · Weggelopen: ' + S.lost));
        return out;
      });
    }
    api.load().then((s) => {
      if (A.isDead()) return;
      if (s && typeof s === 'object') { Object.assign(S, s); S.ups = Object.assign({ mach: 0, speed: 0, staff: 0, deco: 0, price: 0 }, s.ups); S.ready = s.ready || {}; }
      ok = true; api.score(Math.floor(S.total)); render(); A.every(tick, 250);
    }).catch(() => { if (A.isDead()) return; ok = true; render(); A.every(tick, 250); });
    return { destroy() { if (ok) save(); A.destroy(); } };
  },
};
