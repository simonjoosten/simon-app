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
const TYPES = ['🐶', '🐱', '🐰', '🐹', '🐢', '🦜', '🐴', '🐑'];
const NAMES = ['Bram', 'Luna', 'Sjors', 'Fien', 'Max', 'Noor', 'Pip', 'Daan', 'Tess', 'Koen', 'Mila', 'Bobbie', 'Sam', 'Lotte'];
const NEEDS = [{ k: 'hun', e: '🍖', n: 'Voeren', c: '#ea580c' }, { k: 'cln', e: '🧼', n: 'Wassen', c: '#0891b2' }, { k: 'fun', e: '🎾', n: 'Spelen', c: '#16a34a' }];
export default {
  id: 'dierenasiel',
  name: 'Dierenasiel',
  emoji: '🐶',
  hint: 'Verzorg je dieren: voeren, wassen en spelen. Blije dieren worden geadopteerd!',
  create(host, api) {
    const A = makeApp(host, 'linear-gradient(160deg,#15803d,#064e3b)');
    const S = { money: 20, total: 0, food: 25, cages: 3, adopt: 0, vol: 0, vet: 0, don: 0, play: 0, auto: 0 };
    let an = [], sel = null, vis = 8, cd = 0, volT = 3, nid = 1, dirty = true;
    const cst = { cages: () => Math.round(60 * Math.pow(2.1, S.cages - 3)), vol: () => Math.round(70 * Math.pow(2.2, S.vol)), vet: () => 150, don: () => Math.round(60 * Math.pow(1.9, S.don)), play: () => Math.round(50 * Math.pow(1.9, S.play)), auto: () => Math.round(90 * Math.pow(2, S.auto)) };
    const mx = { cages: 8, vol: 4, vet: 1, don: 6, play: 5, auto: 4 };
    const earn = (n) => { S.money += n; S.total += n; api.score(Math.floor(S.total)); };
    const mood = (a) => (a.hun + a.cln + a.fun) / 3;
    const fill = () => 30 + S.play * 8;
    const find = () => an.find((a) => a.id === sel);

    function care(a, k) {
      if (k === 'hun') {
        if (S.food < 1) return A.toast('Geen voer meer! Koop voer.');
        S.food--; a.hun = Math.min(100, a.hun + fill() + S.auto * 8);
      } else a[k] = Math.min(100, a[k] + fill());
      render();
    }
    function heal(a) { if (!a.sick) return; if (S.money < 15) return A.toast('Dierenarts kost ' + fmt(15)); S.money -= 15; a.sick = false; a.hun = Math.max(a.hun, 40); a.cln = Math.max(a.cln, 40); a.fun = Math.max(a.fun, 40); render(); }
    function rescue() {
      if (an.length >= S.cages) return A.toast('Geen vrij hok! Bouw een extra hok.');
      if (cd > 0) return A.toast('Wacht even…');
      cd = 6;
      const a = { id: nid++, e: pick(TYPES), n: pick(NAMES), hun: 40, cln: 40, fun: 40, sick: false, low: 0 };
      an.push(a); sel = a.id; A.toast(a.e + ' ' + a.n + ' is opgevangen!'); render();
    }
    function adopt(a) {
      an = an.filter((x) => x !== a); if (sel === a.id) sel = null;
      const v = 30 + Math.round(mood(a) / 3) + S.don * 5; earn(v); S.adopt++;
      A.toast('🏠 ' + a.e + ' ' + a.n + ' is geadopteerd! +' + fmt(v)); dirty = true;
    }
    function buyFood() { if (S.money < 10) return A.toast('Te weinig geld'); S.money -= 10; S.food += 15; render(); }
    function buy(k) {
      if (S[k] >= mx[k]) return A.toast('Maximaal!');
      const c = cst[k](); if (S.money < c) return A.toast('Te weinig geld');
      S.money -= c; S[k]++; render();
    }
    function tick() {
      const dt = 0.25;
      if (cd > 0) cd -= dt;
      for (const a of an) {
        const r = a.sick ? 0.5 : 1;
        a.hun = Math.max(0, a.hun - 1.5 * dt * r); a.cln = Math.max(0, a.cln - 1 * dt * r); a.fun = Math.max(0, a.fun - 1.2 * dt * r);
        if (!a.sick && (a.hun <= 0 || a.cln <= 0 || a.fun <= 0)) { a.low += dt; if (a.low > 8) { if (S.vet) { a.low = 0; a.hun = a.cln = a.fun = 50; A.toast('🩺 Dierenarts hielp ' + a.n); } else { a.sick = true; A.toast('🤒 ' + a.n + ' is ziek!'); dirty = true; } } } else if (a.low > 0 && mood(a) > 20) a.low = 0;
      }
      vis -= dt;
      if (vis <= 0) {
        vis = rnd(60, 110) / 10;
        const best = an.filter((a) => !a.sick).sort((x, y) => mood(y) - mood(x))[0];
        if (best && mood(best) >= 65) adopt(best);
        else { const d = 2 + S.don * 2; earn(d); A.toast('👨‍👩‍👧 Bezoekers: donatie +' + fmt(d) + (best ? ' (dieren zijn niet blij genoeg)' : '')); }
      }
      if (S.vol > 0 && an.length) {
        volT -= dt;
        if (volT <= 0) {
          volT = 4 / S.vol;
          const a = an.slice().sort((x, y) => Math.min(x.hun, x.cln, x.fun) - Math.min(y.hun, y.cln, y.fun))[0];
          const k = ['hun', 'cln', 'fun'].sort((x, y) => a[x] - a[y])[0];
          if (!(k === 'hun' && S.food < 1)) { if (k === 'hun') S.food--; a[k] = Math.min(100, a[k] + 25); }
        }
      }
      if (dirty) { dirty = false; render(); } else A.refresh();
    }
    A.hlive(h('span'), (e) => { e.textContent = '💰 ' + fmt(S.money); });
    A.hlive(h('span'), (e) => { e.textContent = '🍖 voer ' + S.food; });
    A.hlive(h('span'), (e) => { e.textContent = '🏠 ' + S.adopt + ' adopties'; });

    function render() {
      dirty = false;
      A.draw(() => {
        const out = [];
        out.push(sec('🐾 HOKKEN (' + an.length + '/' + S.cages + ') · tik op een dier'));
        const gr = row([]);
        for (let i = 0; i < S.cages; i++) {
          const a = an[i];
          if (!a) { gr.appendChild(h('div', box('flex:1;min-width:30%;text-align:center;opacity:.45;padding:16px 4px;font-size:13px'), 'leeg hok')); continue; }
          const b = bar(1);
          const c = h('div', box('flex:1;min-width:30%;text-align:center;cursor:pointer;display:flex;flex-direction:column;gap:3px;' + (a.id === sel ? 'outline:3px solid #fde047;' : '')), [h('div', 'font-size:30px;line-height:1.1', a.e), h('div', 'font-size:12px', a.n), b], () => { sel = a.id; render(); });
          A.live(c, () => { const m = mood(a) / 100; b.set(m, a.sick ? '#a78bfa' : m > 0.65 ? '#4ade80' : m > 0.35 ? '#facc15' : '#f87171'); });
          gr.appendChild(c);
        }
        out.push(gr);
        const a = find();
        out.push(sec('❤️ VERZORGEN'));
        const card = h('div', box('display:flex;flex-direction:column;gap:6px'));
        if (!a) card.appendChild(h('div', 'opacity:.7', an.length ? 'Kies een dier om te verzorgen' : 'Vang een dier op om te beginnen!'));
        else {
          card.appendChild(h('div', 'font-weight:700', a.e + ' ' + a.n + (a.sick ? ' 🤒 ziek' : mood(a) >= 65 ? ' 😊 blij' : mood(a) >= 35 ? ' 😐' : ' 😢')));
          for (const n of NEEDS) { const b = bar(a[n.k] / 100, n.c); A.live(b, () => b.set(a[n.k] / 100, n.c)); card.appendChild(h('div', 'display:flex;align-items:center;gap:6px;font-size:13px', [h('span', 'width:24px', n.e), b])); }
          card.appendChild(row(NEEDS.map((n) => btn(n.e + ' ' + n.n, n.c, () => care(a, n.k), 'flex:1;min-width:30%;min-height:54px'))));
          if (a.sick) card.appendChild(btn('💊 Dierenarts ' + fmt(15), '#7c3aed', () => heal(a)));
        }
        out.push(card);
        out.push(row([btn('🚑 Dier opvangen', '#0d9488', rescue, 'flex:1'), btn('🍖 15 voer · ' + fmt(10), '#b45309', buyFood, 'flex:1')]));
        out.push(sec('🛒 UITBREIDEN'));
        const ups = [['cages', '🏠 Extra hok (' + S.cages + '/8)'], ['vol', '🧑‍🌾 Vrijwilliger (verzorgt zelf)'], ['vet', '🩺 Dierenarts (geen zieke dieren meer)'], ['don', '🎁 Donatiebus & kraam'], ['play', '🛝 Speeltuin (+ effect)'], ['auto', '🥣 Voerautomaat (+ voer)']];
        for (const [k, t] of ups) {
          const lim = S[k] >= mx[k];
          const b = btn(t, '#7c3aed', () => buy(k), 'width:100%;text-align:left;display:flex;justify-content:space-between;align-items:center;gap:8px');
          b.appendChild(h('span', '', lim ? 'MAX' : fmt(cst[k]())));
          A.live(b, (e) => { e.style.opacity = !lim && S.money >= cst[k]() ? 1 : 0.5; });
          out.push(b);
        }
        return out;
      });
    }
    render(); api.score(0);
    A.every(tick, 250);
    return { destroy() { A.destroy(); } };
  },
};
