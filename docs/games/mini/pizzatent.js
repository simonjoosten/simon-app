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
const TOP = [
  { id: 'kaas', e: '🧀', u: 0 }, { id: 'tomaat', e: '🍅', u: 0 }, { id: 'paddo', e: '🍄', u: 0 },
  { id: 'ham', e: '🥓', u: 1 }, { id: 'ananas', e: '🍍', u: 2 }, { id: 'olijf', e: '🫒', u: 3 },
];
const UP = {
  oven: { n: '🔥 Extra oven', d: 'meer pizza\'s tegelijk', b: 90, g: 2.2, max: 5 },
  snel: { n: '⏱️ Hete steenoven', d: 'bakt 25% sneller', b: 70, g: 1.8, max: 6 },
  bez: { n: '🛵 Bezorger', d: 'haalt pizza\'s zelf uit de oven', b: 130, g: 2.3, max: 4 },
  menu: { n: '📖 Nieuwe toppings', d: 'ham, ananas, olijven', b: 100, g: 2.5, max: 3 },
  prijs: { n: '🏷️ Duurdere pizza\'s', d: '+20% prijs', b: 80, g: 1.9, max: 6 },
};
export default {
  id: 'pizzatent',
  name: 'Pizzatent',
  emoji: '🍕',
  hint: 'Kies deeg en toppings van het bonnetje, bak de pizza en let op het drukte-uur!',
  save: 'day',
  create(host, api) {
    const A = makeApp(host, 'linear-gradient(160deg,#9a1c1c,#3f0d0d)');
    const S = { money: 15, total: 0, day: 1, dayT: 0, ups: { oven: 0, snel: 0, bez: 0, menu: 0, prijs: 0 }, made: 0, perfect: 0 };
    let tickets = [], ovens = [], sp = 2, nid = 1, dirty = true, ok = false, rush = 0, rushCd = 60, selId = null, dough = null, tops = [], bezT = 3;
    const nOv = () => 2 + S.ups.oven;
    const price = (n) => Math.round((5 + n * 2) * (1 + S.ups.prijs * 0.2));
    const cost = (k) => Math.round(UP[k].b * Math.pow(UP[k].g, S.ups[k]));
    const avail = () => TOP.filter((t) => t.u <= S.ups.menu);
    const save = () => { if (ok) api.save(JSON.parse(JSON.stringify(S))); };
    const earn = (n) => { S.money += n; S.total += n; api.score(Math.floor(S.total)); };
    const change = () => { save(); render(); };
    const sel = () => tickets.find((t) => t.id === selId);

    function pickTicket(t) { selId = t.id; dough = null; tops = []; dirty = true; render(); }
    function toggle(id) { tops = tops.includes(id) ? tops.filter((x) => x !== id) : [...tops, id]; render(); }
    function bake() {
      const t = sel(); if (!t) return A.toast('Kies eerst een bonnetje');
      if (!dough) return A.toast('Kies eerst deeg');
      if (ovens.length >= nOv()) return A.toast('Alle ovens zijn vol');
      let q = dough === t.dough ? 0.4 : 0.1;
      const hit = t.tops.filter((x) => tops.includes(x)).length, wrong = tops.filter((x) => !t.tops.includes(x)).length;
      q += 0.6 * (hit / t.tops.length) - 0.2 * wrong;
      ovens.push({ tid: t.id, q: clamp(q, 0.1, 1), n: t.tops.length, t: 0, need: 8 / (1 + S.ups.snel * 0.25), done: false, rush: rush > 0 });
      tickets = tickets.filter((x) => x !== t); selId = null; dough = null; tops = []; change();
    }
    function collect(o) {
      if (!o.done) return A.toast('Nog aan het bakken…');
      ovens = ovens.filter((x) => x !== o);
      const burnt = o.t > o.need + 7;
      let v = price(o.n) * o.q * (burnt ? 0.3 : 1) * (o.rush ? 2 : 1);
      v = Math.max(1, Math.round(v)); earn(v); S.made++; if (o.q >= 1 && !burnt) S.perfect++;
      A.toast((burnt ? '🔥 Aangebrand! ' : o.q >= 1 ? '⭐ Perfect! ' : '') + '+' + fmt(v)); change();
    }
    function buy(k) {
      if (S.ups[k] >= UP[k].max) return A.toast('Maximaal!');
      const c = cost(k); if (S.money < c) return A.toast('Te weinig geld');
      S.money -= c; S.ups[k]++; change();
    }
    function tick() {
      const dt = 0.25;
      sp -= dt;
      if (sp <= 0) {
        sp = (rush > 0 ? rnd(15, 30) : rnd(50, 90)) / 10;
        if (tickets.length < 6) {
          const av = avail(), n = rnd(1, Math.min(3, av.length));
          const ts = []; while (ts.length < n) { const x = pick(av).id; if (!ts.includes(x)) ts.push(x); }
          tickets.push({ id: nid++, dough: pick(['dun', 'dik']), tops: ts, pat: 60, max: 60 }); dirty = true;
        }
      }
      rushCd -= dt;
      if (rush > 0) { rush -= dt; if (rush <= 0) { A.toast('Drukte-uur voorbij'); dirty = true; } }
      else if (rushCd <= 0) { rush = 25; rushCd = rnd(70, 100); A.toast('🔔 DRUKTE-UUR! Dubbele fooi!'); dirty = true; }
      for (const t of tickets) t.pat -= dt;
      const gone = tickets.filter((t) => t.pat <= 0);
      if (gone.length) { tickets = tickets.filter((t) => t.pat > 0); if (gone.some((g) => g.id === selId)) { selId = null; tops = []; dough = null; } A.toast('😠 Bon verlopen'); dirty = true; }
      for (const o of ovens) { o.t += dt; if (!o.done && o.t >= o.need) { o.done = true; dirty = true; } }
      if (S.ups.bez > 0) {
        bezT -= dt;
        if (bezT <= 0) { bezT = 6 / S.ups.bez; const o = ovens.find((x) => x.done); if (o) collect(o); }
      }
      S.dayT += dt; if (S.dayT >= 120) { S.dayT = 0; S.day++; }
      if (Math.floor(S.dayT * 4) % 20 === 0) save();
      if (dirty) { dirty = false; render(); } else A.refresh();
    }
    A.hlive(h('span'), (e) => { e.textContent = '💰 ' + fmt(S.money); });
    A.hlive(h('span'), (e) => { e.textContent = rush > 0 ? '🔔 DRUKTE ' + Math.ceil(rush) + 's' : '⏳ rustig'; e.style.color = rush > 0 ? '#fde047' : '#fff'; });
    A.hlive(h('span'), (e) => { e.textContent = '📅 Dag ' + S.day; });

    function render() {
      A.draw(() => {
        const out = [];
        out.push(sec('🧾 BONNETJES (tik om te maken)'));
        const tr = row([], 'min-height:70px');
        if (!tickets.length) tr.appendChild(h('div', 'opacity:.7;padding:10px', 'Nog geen bestellingen…'));
        for (const t of tickets) {
          const b = bar(1);
          const c = h('div', box('flex:1;min-width:30%;cursor:pointer;display:flex;flex-direction:column;gap:3px;align-items:center;' + (t.id === selId ? 'outline:3px solid #fde047;' : '')), [h('div', 'font-size:12px', t.dough === 'dun' ? 'dun deeg' : 'dik deeg'), h('div', 'font-size:22px', t.tops.map((x) => TOP.find((y) => y.id === x).e).join('')), b], () => pickTicket(t));
          A.live(c, () => { const p = t.pat / t.max; b.set(p, p > 0.5 ? '#4ade80' : p > 0.25 ? '#facc15' : '#f87171'); });
          tr.appendChild(c);
        }
        out.push(tr);
        out.push(sec('👨‍🍳 PIZZA MAKEN'));
        const mk = h('div', box('display:flex;flex-direction:column;gap:6px'));
        const t = sel();
        if (!t) mk.appendChild(h('div', 'opacity:.7', 'Tik op een bonnetje om te beginnen'));
        else {
          mk.appendChild(row(['dun', 'dik'].map((d) => btn((d === 'dun' ? '🫓 Dun' : '🍞 Dik') + ' deeg', dough === d ? '#16a34a' : '#78350f', () => { dough = d; render(); }, 'flex:1'))));
          mk.appendChild(row(avail().map((x) => btn(x.e, tops.includes(x.id) ? '#16a34a' : '#78350f', () => toggle(x.id), 'width:52px;font-size:24px;padding:4px'))));
          mk.appendChild(btn('🔥 In de oven!', '#dc2626', bake));
        }
        out.push(mk);
        out.push(sec('🔥 OVENS (' + ovens.length + '/' + nOv() + ')'));
        const orow = row([]);
        for (let i = 0; i < nOv(); i++) {
          const o = ovens[i];
          if (!o) { orow.appendChild(h('div', box('flex:1;min-width:30%;text-align:center;opacity:.5;padding:14px 4px'), 'leeg')); continue; }
          const b = bar(0, '#fb923c');
          const c = h('div', box('flex:1;min-width:30%;text-align:center;cursor:pointer;display:flex;flex-direction:column;gap:4px'), [h('div', 'font-size:26px;line-height:1.2', o.done ? '🍕' : '♨️'), b], () => collect(o));
          A.live(c, () => { b.set(o.done ? 1 : o.t / o.need, o.done ? '#4ade80' : '#fb923c'); if (o.done && o.t > o.need + 7) c.style.outline = '3px solid #ef4444'; else c.style.outline = o.done ? '3px solid #4ade80' : 'none'; });
          orow.appendChild(c);
        }
        out.push(orow);
        out.push(sec('🛒 UPGRADES'));
        for (const k of Object.keys(UP)) {
          const u = UP[k];
          const b = btn([h('div', 'text-align:left', u.n + (S.ups[k] ? ' (niv ' + S.ups[k] + ')' : '')), h('div', 'font-size:11px;font-weight:400;text-align:left', u.d), h('div', '', S.ups[k] >= u.max ? 'MAX' : fmt(cost(k)))], '#7c3aed', () => buy(k), 'width:100%;display:flex;flex-direction:column;align-items:flex-start;gap:0');
          A.live(b, (e) => { e.style.opacity = S.money >= cost(k) && S.ups[k] < u.max ? 1 : 0.5; });
          out.push(b);
        }
        out.push(h('div', 'font-size:12px;opacity:.7;text-align:center', 'Pizza\'s gebakken: ' + S.made + ' · Perfect: ' + S.perfect));
        return out;
      });
    }
    const go = () => { ok = true; api.score(Math.floor(S.total)); render(); A.every(tick, 250); };
    api.load().then((s) => {
      if (A.isDead()) return;
      if (s && typeof s === 'object') { Object.assign(S, s); S.ups = Object.assign({ oven: 0, snel: 0, bez: 0, menu: 0, prijs: 0 }, s.ups); }
      go();
    }).catch(() => { if (!A.isDead()) go(); });
    return { destroy() { if (ok) save(); A.destroy(); } };
  },
};
