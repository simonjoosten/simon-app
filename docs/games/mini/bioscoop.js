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
const FILMS = [
  { n: 'Ruimtepiraten', e: '🚀', p: 0.9 }, { n: 'Dino Dansfeest', e: '🦖', p: 0.8 }, { n: 'De Grote Taart', e: '🎂', p: 0.55 },
  { n: 'Spookhuis Spaghetti', e: '👻', p: 0.65 }, { n: 'Superhond', e: '🦸', p: 0.85 }, { n: 'Onderwaterstad', e: '🐠', p: 0.6 },
  { n: 'Het Verdwenen Koekje', e: '🍪', p: 0.45 }, { n: 'Robot Ruzie', e: '🤖', p: 0.75 }, { n: 'Dragon Disco', e: '🐉', p: 0.95 },
  { n: 'Saaie Documentaire', e: '🐌', p: 0.3 },
];
const HC = [30, 40, 55, 75];
export default {
  id: 'bioscoop',
  name: 'Bioscoop',
  emoji: '🎬',
  hint: 'Kies films per zaal en serveer popcorn aan wachtende bezoekers. Haal 5 sterren!',
  create(host, api) {
    const A = makeApp(host, 'linear-gradient(160deg,#7f1d1d,#18181b)');
    const S = { money: 40, total: 0, halls: 1, seat: 0, scr: 0, pop: 0, crew: 0, rep: 20, visitors: 0 };
    let slate = [], showing = [], stock = 4, wait = 0, crewT = 0, filmT = 0, dirty = true;
    const hallCap = (i) => Math.round(HC[i] * (1 + S.seat * 0.2));
    const tix = () => 6 * (1 + S.scr * 0.18);
    const stars = () => 1 + Math.floor(S.rep / 25);
    const popMax = () => 10 + S.pop * 8;
    const popV = () => 1 + S.pop;
    const cst = { halls: () => [0, 250, 700, 1800][S.halls] || 0, seat: () => Math.round(80 * Math.pow(2, S.seat)), scr: () => Math.round(70 * Math.pow(2, S.scr)), pop: () => Math.round(60 * Math.pow(2.1, S.pop)), crew: () => Math.round(110 * Math.pow(2.2, S.crew)) };
    const mx = { halls: 4, seat: 5, scr: 5, pop: 5, crew: 4 };
    const earn = (n) => { S.money += n; S.total += n; api.score(Math.floor(S.total)); };
    const rent = (f) => Math.round(8 + f.p * 30);
    const audience = (i, f) => Math.round(hallCap(i) * clamp(f.pop * (0.5 + S.rep / 130), 0.1, 1));
    const newFilm = () => { const f = pick(FILMS); return { n: f.n, e: f.e, pop: f.p * (0.9 + Math.random() * 0.2), p: f.p, uses: 0 }; };

    function start(i, f) {
      if (showing[i]) return;
      const c = rent(f); if (S.money < c) return A.toast('Filmhuur is te duur: ' + fmt(c));
      S.money -= c;
      const v = audience(i, f);
      showing[i] = { f, v, t: 0, len: 30 };
      wait += Math.round(v * 0.45); f.pop *= 0.8; f.uses++;
      dirty = true; render();
    }
    function finishShow(i) {
      const s = showing[i]; showing[i] = null;
      const v = Math.round(s.v * tix()); earn(v); S.visitors += s.v;
      const full = s.v / hallCap(i) > 0.75;
      S.rep = clamp(S.rep + (full ? 2.5 : 0.3) - Math.min(4, wait * 0.1), 0, 100);
      A.toast(s.f.e + ' Voorstelling klaar: +' + fmt(v)); dirty = true;
    }
    function popcorn() { stock = Math.min(popMax(), stock + popV()); render(); }
    function serve() {
      if (wait < 1) return A.toast('Niemand wacht op popcorn');
      if (stock < 1) return A.toast('Geen popcorn! Tik op de machine.');
      stock--; wait--; earn(4 + S.scr); render();
    }
    function buy(k) {
      if (S[k] >= mx[k] || (k === 'halls' && S.halls >= 4)) return A.toast('Maximaal!');
      const c = cst[k](); if (S.money < c) return A.toast('Te weinig geld');
      S.money -= c; S[k]++; if (k === 'halls') A.toast('Nieuwe zaal geopend!'); dirty = true; render();
    }
    function tick() {
      const dt = 0.25;
      filmT += dt;
      if (filmT >= 45 || slate.length < 4) { filmT = 0; slate.push(newFilm()); while (slate.length > 4) slate.shift(); dirty = true; }
      for (let i = 0; i < S.halls; i++) { const s = showing[i]; if (s) { s.t += dt; if (s.t >= s.len) finishShow(i); } }
      if (S.crew > 0) { crewT += dt; if (crewT >= 2 / S.crew) { crewT = 0; if (wait >= 1 && stock >= 1) { stock--; wait--; earn(4 + S.scr); } } }
      if (wait > 0 && Math.random() < 0.02) { wait = Math.max(0, wait - 1); S.rep = clamp(S.rep - 0.5, 0, 100); }
      if (dirty) { dirty = false; render(); } else A.refresh();
    }
    A.hlive(h('span'), (e) => { e.textContent = '💰 ' + fmt(S.money); });
    A.hlive(h('span'), (e) => { e.textContent = '⭐'.repeat(stars()) + ' ' + Math.floor(S.rep) + '%'; });
    A.hlive(h('span'), (e) => { e.textContent = '🎟️ ' + S.visitors; });

    function render() {
      dirty = false;
      A.draw(() => {
        const out = [];
        out.push(sec('🍿 SNACKBAR'));
        const sn = h('div', box('display:flex;flex-direction:column;gap:6px'));
        const info = h('div', 'display:flex;justify-content:space-between;font-size:15px;font-weight:700');
        A.live(info, (e) => { e.textContent = ''; e.appendChild(h('span', '', '🧑‍🤝‍🧑 Wachtenden: ' + wait)); e.appendChild(h('span', '', '🍿 Voorraad: ' + stock + '/' + popMax())); });
        sn.appendChild(info);
        sn.appendChild(row([btn('🔥 Popcorn maken', '#d97706', popcorn, 'flex:1;min-height:56px'), btn('🥤 Serveer', '#16a34a', serve, 'flex:1;min-height:56px')]));
        out.push(sn);
        out.push(sec('🎞️ ZALEN'));
        for (let i = 0; i < S.halls; i++) {
          const s = showing[i];
          const card = h('div', box('display:flex;flex-direction:column;gap:6px'));
          card.appendChild(h('div', 'display:flex;justify-content:space-between', [h('b', '', 'Zaal ' + (i + 1) + ' (' + hallCap(i) + ' stoelen)'), h('span', '', s ? s.f.e + ' ' + s.v + ' bezoekers' : 'vrij')]));
          if (s) { const b = bar(0, '#f87171'); A.live(b, () => b.set(s.t / s.len)); card.appendChild(h('div', 'font-size:13px', 'Draait: ' + s.f.n)); card.appendChild(b); }
          else {
            slate.forEach((f) => {
              const b = btn([h('span', 'flex:1;text-align:left', f.e + ' ' + f.n), h('span', 'font-size:12px;font-weight:400', '~' + audience(i, f) + ' gasten · huur ' + fmt(rent(f)))], '#1d4ed8', () => start(i, f), 'display:flex;align-items:center;gap:6px;min-height:44px;width:100%;font-size:14px');
              A.live(b, (e) => { e.style.opacity = S.money >= rent(f) ? 1 : 0.5; });
              card.appendChild(b);
            });
          }
          out.push(card);
        }
        out.push(sec('🛒 UPGRADES'));
        const ups = [['halls', '🎦 Nieuwe zaal (' + S.halls + '/4)'], ['seat', '💺 Comfortabele stoelen (+20% plek)'], ['scr', '📽️ Beter scherm (duurdere kaartjes)'], ['pop', '🍿 Grotere popcornmachine'], ['crew', '🧑‍🍳 Snackbar-medewerker']];
        for (const [k, t] of ups) {
          const lim = S[k] >= mx[k];
          const b = btn(t, '#7c3aed', () => buy(k), 'width:100%;text-align:left;display:flex;justify-content:space-between;align-items:center;gap:8px');
          b.appendChild(h('span', '', lim ? 'MAX' : fmt(cst[k]())));
          A.live(b, (e) => { e.style.opacity = !lim && S.money >= cst[k]() ? 1 : 0.5; });
          out.push(b);
        }
        out.push(h('div', 'font-size:12px;opacity:.7;text-align:center', 'Populaire films zakken in populariteit na elke voorstelling. Nieuwe films komen binnen.'));
        return out;
      });
    }
    render(); api.score(0);
    A.every(tick, 250);
    return { destroy() { A.destroy(); } };
  },
};
