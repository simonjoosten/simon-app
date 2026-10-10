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
const COL = ['🟥', '🟦', '🟩', '🟨', '🟪'];
export default {
  id: 'kapperszaak',
  name: 'Kapperszaak',
  emoji: '💇',
  hint: 'Zet klanten in een stoel. Knip in de groene zone en verf in de goede kleurvolgorde!',
  create(host, api) {
    const A = makeApp(host, 'linear-gradient(160deg,#7e22ce,#1e1b4b)');
    const S = { money: 0, total: 0, chairs: 1, sc: 0, pal: 0, asst: 0, rep: 10, served: 0, lost: 0 };
    let queue = [], seats = [], gt = 0, sp = 1, nid = 1, dirty = true;
    const seatN = () => S.chairs;
    const half = () => 0.07 + S.sc * 0.02;
    const nCol = () => 2 + S.pal;
    const stars = () => 1 + Math.floor(S.rep / 20);
    const cost = { chairs: () => Math.round(80 * Math.pow(2.4, S.chairs - 1)), sc: () => Math.round(40 * Math.pow(1.8, S.sc)), pal: () => Math.round(60 * Math.pow(2, S.pal)), asst: () => Math.round(100 * Math.pow(2.2, S.asst)) };
    const max = { chairs: 4, sc: 6, pal: 3, asst: 4 };
    const earn = (n) => { S.money += n; S.total += n; api.score(Math.floor(S.total)); };
    const marker = () => { const p = (gt * 0.75) % 2; return p > 1 ? 2 - p : p; };

    function seat(c) {
      const i = seats.findIndex((s) => s === null);
      if (i < 0 && seats.length >= seatN()) return A.toast('Geen vrije stoel!');
      const st = { c, step: 0, q: 0, mis: 0, zone: 0.2 + Math.random() * 0.6, seq: [], idle: 0 };
      if (c.svc === 'color') st.seq = [0, 1, 2].map(() => rnd(0, nCol() - 1));
      if (i < 0) seats.push(st); else seats[i] = st;
      queue = queue.filter((x) => x !== c); dirty = true; render();
    }
    function finish(st, q) {
      const base = st.c.svc === 'cut' ? 6 : 11;
      const v = Math.round(base * (0.5 + q * 0.9) * (1 + S.rep / 200) + (q > 0.85 ? 3 : 0));
      earn(v); S.served++;
      S.rep = clamp(S.rep + (q > 0.8 ? 3 : q > 0.4 ? 0.5 : -3), 0, 100);
      A.toast((q > 0.85 ? '✨ Prachtig! +' : q > 0.4 ? '👍 Goed +' : '😬 Slordig +') + fmt(v));
      const i = seats.indexOf(st); if (i >= 0) seats[i] = null;
      dirty = true; render();
    }
    function snip(st) {
      const d = Math.abs(marker() - st.zone);
      st.q += d < half() ? 1 : d < half() * 2.2 ? 0.5 : 0; st.idle = 0;
      st.step++; st.zone = 0.15 + Math.random() * 0.7;
      if (st.step >= 3) finish(st, st.q / 3); else render();
    }
    function paint(st, k) {
      st.idle = 0;
      if (st.seq[st.step] === k) st.step++; else st.mis++;
      if (st.step >= 3) finish(st, clamp(1 - st.mis * 0.25, 0.1, 1)); else render();
    }
    function buy(k) {
      if (S[k === 'chairs' ? 'chairs' : k] >= max[k] + (k === 'chairs' ? 0 : 0)) return A.toast('Maximaal!');
      const c = cost[k](); if (S.money < c) return A.toast('Te weinig geld');
      S.money -= c; S[k]++; if (k === 'chairs') seats.push(null); dirty = true; render();
    }
    function tick() {
      const dt = 0.1; gt += dt;
      sp -= dt;
      if (sp <= 0) {
        sp = rnd(35, 70) / 10 / (1 + S.rep / 60);
        if (queue.length < 5) { queue.push({ id: nid++, f: pick(['🧑', '👩', '👨', '🧓', '👧', '👦', '👱‍♀️']), svc: Math.random() < 0.6 ? 'cut' : 'color', pat: 28, max: 28 }); dirty = true; }
      }
      for (const c of queue) c.pat -= dt;
      const gone = queue.filter((c) => c.pat <= 0);
      if (gone.length) { queue = queue.filter((c) => c.pat > 0); S.lost += gone.length; S.rep = clamp(S.rep - 4 * gone.length, 0, 100); A.toast('😤 Klant ging weg (reputatie omlaag)'); dirty = true; }
      if (S.asst > 0) {
        if (queue.length && seats.some((s) => !s) ) { seat(queue[0]); return; }
        for (const st of seats) if (st) { st.idle += dt; if (st.idle > 12 / S.asst) { finish(st, 0.6); return; } }
      }
      if (dirty) { dirty = false; render(); } else A.refresh();
    }
    A.hlive(h('span'), (e) => { e.textContent = '💰 ' + fmt(S.money); });
    A.hlive(h('span'), (e) => { e.textContent = '⭐'.repeat(stars()) + ' ' + Math.floor(S.rep) + '%'; });
    A.hlive(h('span'), (e) => { e.textContent = '✅ ' + S.served; });

    function render() {
      while (seats.length < seatN()) seats.push(null);
      A.draw(() => {
        const out = [];
        out.push(sec('🪑 WACHTRIJ (tik om in een stoel te zetten)'));
        const qr = row([], 'min-height:72px');
        if (!queue.length) qr.appendChild(h('div', 'opacity:.7;padding:10px', 'Niemand in de wachtrij'));
        for (const c of queue) {
          const b = bar(1);
          const card = h('div', box('flex:1;min-width:28%;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px'), [h('div', 'font-size:26px;line-height:1', c.f + (c.svc === 'cut' ? '✂️' : '🎨')), b], () => seat(c));
          A.live(card, () => { const p = c.pat / c.max; b.set(p, p > 0.5 ? '#4ade80' : p > 0.25 ? '#facc15' : '#f87171'); });
          qr.appendChild(card);
        }
        out.push(qr);
        out.push(sec('💈 STOELEN'));
        seats.forEach((st, i) => {
          if (!st) { out.push(h('div', box('text-align:center;opacity:.5;padding:16px'), 'Stoel ' + (i + 1) + ' is vrij')); return; }
          const c = st.c, card = h('div', box('display:flex;flex-direction:column;gap:6px'));
          card.appendChild(h('div', 'display:flex;justify-content:space-between', [h('b', '', c.f + (c.svc === 'cut' ? ' Knippen' : ' Verven')), h('span', '', 'stap ' + (st.step + 1) + '/3')]));
          if (c.svc === 'cut') {
            const track = h('div', 'position:relative;height:30px;border-radius:15px;background:rgba(0,0,0,.4);overflow:hidden');
            const zone = h('div', `position:absolute;top:0;height:100%;left:${(st.zone - half()) * 100}%;width:${half() * 200}%;background:#22c55e;opacity:.85`);
            const mk = h('div', 'position:absolute;top:0;width:6px;height:100%;background:#fff;border-radius:3px');
            track.append(zone, mk);
            A.live(mk, (e) => { e.style.left = 'calc(' + marker() * 100 + '% - 3px)'; });
            card.append(track, btn('✂️ KNIP!', '#db2777', () => snip(st), 'min-height:56px;font-size:20px'));
          } else {
            card.appendChild(h('div', 'font-size:28px;text-align:center', st.seq.map((k, j) => (j < st.step ? '✅' : COL[k])).join(' ')));
            card.appendChild(row(Array.from({ length: nCol() }, (_, k) => btn(COL[k], '#374151', () => paint(st, k), 'flex:1;min-width:48px;font-size:26px'))));
          }
          out.push(card);
        });
        out.push(sec('🛒 UPGRADES'));
        const ups = [['chairs', '💺 Extra stoel (' + S.chairs + '/4)'], ['sc', '✂️ Scherpere schaar (grotere zone)'], ['pal', '🎨 Meer kleuren (' + nCol() + ')'], ['asst', '🧑‍🔧 Assistent (zet klanten neer en helpt)']];
        for (const [k, t] of ups) {
          const lim = k === 'chairs' ? S.chairs >= 4 : S[k] >= max[k];
          const b = btn(t, '#9333ea', () => buy(k), 'width:100%;text-align:left;display:flex;justify-content:space-between;align-items:center;gap:8px');
          b.appendChild(h('span', '', lim ? 'MAX' : fmt(cost[k]())));
          A.live(b, (e) => { e.style.opacity = !lim && S.money >= cost[k]() ? 1 : 0.5; });
          out.push(b);
        }
        out.push(h('div', 'font-size:12px;opacity:.7;text-align:center', 'Reputatie bepaalt hoeveel klanten komen en hoeveel fooi ze geven.'));
        return out;
      });
    }
    render(); api.score(0);
    A.every(tick, 100);
    return { destroy() { A.destroy(); } };
  },
};
