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
const BT = {
  carr: { e: '🎠', n: 'Carrousel', c: 40, r: 0.6, ap: 3, k: 'ride' },
  trein: { e: '🚂', n: 'Treintje', c: 90, r: 1.1, ap: 5, k: 'ride' },
  rad: { e: '🎡', n: 'Reuzenrad', c: 160, r: 1.9, ap: 8, k: 'ride' },
  bak: { e: '🎢', n: 'Achtbaan', c: 400, r: 4.5, ap: 16, k: 'ride' },
  kraam: { e: '🍦', n: 'Ijskraam', c: 35, r: 0, ap: 1, k: 'food' },
  wc: { e: '🚻', n: 'Toiletten', c: 25, r: 0, ap: 0, k: 'wc' },
  boom: { e: '🌳', n: 'Bomen & bankjes', c: 15, r: 0, ap: 0, k: 'deco' },
};
const N = 36, COLS = 6;
export default {
  id: 'pretpark',
  name: 'Pretpark',
  emoji: '🎢',
  hint: 'Bouw attracties op het raster, verzamel munten en hou bezoekers gelukkig!',
  create(host, api) {
    const A = makeApp(host, 'linear-gradient(160deg,#0ea5e9,#6d28d9)');
    const S = { money: 100, total: 0, mark: 0, coll: 0 };
    let cells = Array(N).fill(null), sel = -1, V = 0, rain = 0, rainCd = 90, ct = 0, dirty = true;
    const count = (k) => cells.reduce((a, c) => a + (c && BT[c.t].k === k ? (k === 'ride' ? 1 : c.l) : 0), 0);
    const rides = () => count('ride');
    const appeal = () => cells.reduce((a, c) => a + (c ? BT[c.t].ap * (1 + (c.l - 1) * 0.5) : 0), 0) * (1 + S.mark * 0.25);
    const happy = () => {
      let hp = 55 + count('deco') * 4 + count('wc') * 3 - Math.max(0, V - (6 + count('wc') * 10)) * 1.2 - Math.max(0, V - (8 + count('food') * 14)) * 0.8;
      if (rain > 0) hp -= 10; return clamp(hp, 0, 100);
    };
    const target = () => Math.round(appeal() * (0.5 + happy() / 100) * (rain > 0 ? 0.5 : 1));
    const rate = (c) => BT[c.t].r * (1 + (c.l - 1) * 0.6) * clamp(V / Math.max(1, rides() * 3), 0.4, 1.5);
    const capC = (c) => 12 + BT[c.t].r * 25 * c.l;
    const lvC = (c) => Math.round(BT[c.t].c * Math.pow(1.9, c.l));
    const mkC = () => Math.round(100 * Math.pow(2.2, S.mark));
    const earn = (n) => { S.money += n; S.total += n; api.score(Math.floor(S.total)); };

    function build(t) {
      if (sel < 0 || cells[sel]) return;
      const b = BT[t]; if (S.money < b.c) return A.toast('Te weinig geld voor ' + b.n);
      S.money -= b.c; cells[sel] = { t, l: 1, c: 0 }; render();
    }
    function collect(i) {
      const c = cells[i]; if (!c || c.c < 1) return false;
      const v = c.c * (0.7 + happy() / 160); c.c = 0; earn(v); return v;
    }
    function tapCell(i) {
      sel = i; const c = cells[i];
      if (c && c.c >= 1) { const v = collect(i); A.toast('💰 +' + fmt(v)); }
      render();
    }
    function collectAll() { let s = 0; for (let i = 0; i < N; i++) { const v = collect(i); if (v) s += v; } if (s) A.toast('💰 Alles opgehaald +' + fmt(s)); render(); }
    function upgrade() { const c = cells[sel]; if (!c || c.l >= 4 || BT[c.t].k === 'deco') return; const p = lvC(c); if (S.money < p) return A.toast('Te weinig geld'); S.money -= p; c.l++; render(); }
    function demolish() { const c = cells[sel]; if (!c) return; S.money += Math.floor(BT[c.t].c * 0.5); cells[sel] = null; render(); }
    function buyMark() { const c = mkC(); if (S.mark >= 5) return; if (S.money < c) return A.toast('Te weinig geld'); S.money -= c; S.mark++; render(); }
    function buyColl() { if (S.coll >= 1 || S.money < 300) return A.toast(S.coll ? 'Al gekocht' : 'Te weinig geld'); S.money -= 300; S.coll = 1; render(); }

    function tick() {
      const dt = 0.5;
      rainCd -= dt;
      if (rain > 0) { rain -= dt; if (rain <= 0) A.toast('☀️ De zon schijnt weer'); }
      else if (rainCd <= 0) { rain = 20; rainCd = rnd(90, 150); A.toast('☔ Regenbui! Minder bezoekers'); }
      const tg = target(); V += (tg - V) * 0.1 + (tg > V ? 0.2 : -0.2); V = Math.max(0, V);
      for (const c of cells) if (c && BT[c.t].r) c.c = Math.min(capC(c), c.c + rate(c) * dt);
      for (const c of cells) if (c && BT[c.t].k === 'food') { const v = V * 0.05 * c.l * dt; earn(v); }
      ct += dt;
      if (S.coll && ct >= 8) { ct = 0; for (let i = 0; i < N; i++) collect(i); }
      A.refresh();
    }
    A.hlive(h('span'), (e) => { e.textContent = '💰 ' + fmt(S.money); });
    A.hlive(h('span'), (e) => { const hp = happy(); e.textContent = (hp > 70 ? '😀' : hp > 40 ? '🙂' : '😟') + ' ' + Math.round(hp) + '%'; });
    A.hlive(h('span'), (e) => { e.textContent = '👨‍👩‍👧 ' + Math.round(V) + (rain > 0 ? ' ☔' : ''); });

    function render() {
      dirty = false;
      A.draw(() => {
        const out = [];
        const g = h('div', 'display:grid;grid-template-columns:repeat(' + COLS + ',1fr);gap:4px;background:rgba(34,197,94,.35);padding:5px;border-radius:12px');
        for (let i = 0; i < N; i++) {
          const c = cells[i];
          const el = h('div', 'height:48px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:26px;position:relative;cursor:pointer;background:' + (c ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.1)') + ';' + (i === sel ? 'outline:3px solid #fde047;' : ''), c ? BT[c.t].e : '', () => tapCell(i));
          if (c) {
            const bd = h('span', 'position:absolute;right:2px;top:0;font-size:10px;font-weight:800;color:#fde047', c.l > 1 ? 'L' + c.l : '');
            const co = h('span', 'position:absolute;left:2px;bottom:0;font-size:11px');
            A.live(co, (e) => { e.textContent = c.c >= 1 && BT[c.t].r ? '💰' : ''; });
            el.append(bd, co);
          }
          g.appendChild(el);
        }
        out.push(g);
        const p = h('div', box('display:flex;flex-direction:column;gap:6px'));
        const c = sel >= 0 ? cells[sel] : null;
        if (sel < 0) p.appendChild(h('div', 'opacity:.8;font-size:14px', 'Tik op een vakje om te bouwen. Tik op 💰 om munten te pakken.'));
        else if (!c) {
          p.appendChild(h('div', 'font-weight:700', 'Bouw hier:'));
          const bl = row([]);
          for (const t of Object.keys(BT)) { const b = BT[t]; const bt = btn([h('div', 'font-size:22px', b.e), h('div', 'font-size:11px', fmt(b.c))], '#4f46e5', () => build(t), 'flex:1;min-width:22%;padding:4px'); A.live(bt, (e) => { e.style.opacity = S.money >= b.c ? 1 : 0.45; }); bl.appendChild(bt); }
          p.appendChild(bl);
          p.appendChild(h('div', 'font-size:12px;opacity:.8', 'Attracties trekken bezoekers; 🍦 verkoopt ijs; 🚻 en 🌳 maken bezoekers blij.'));
        } else {
          const b = BT[c.t];
          p.appendChild(h('div', 'font-weight:700', b.e + ' ' + b.n + ' (niveau ' + c.l + ')'));
          const info = h('div', 'font-size:13px;opacity:.9'); A.live(info, (e) => { e.textContent = b.r ? 'Munten: ' + Math.floor(c.c) + '/' + Math.floor(capC(c)) : b.k === 'food' ? 'Verkoopt ijs aan bezoekers' : b.k === 'wc' ? 'Bezoekers blijven blij' : 'Maakt het park mooier'; });
          p.appendChild(info);
          const r2 = [];
          if (b.r) r2.push(btn('💰 Ophalen', '#16a34a', () => { const v = collect(sel); if (v) A.toast('+' + fmt(v)); render(); }, 'flex:1'));
          if (b.k !== 'deco' && c.l < 4) { const u = btn('⬆️ ' + fmt(lvC(c)), '#d97706', upgrade, 'flex:1'); A.live(u, (e) => { e.style.opacity = S.money >= lvC(c) ? 1 : 0.5; }); r2.push(u); }
          r2.push(btn('🗑️ Sloop', '#be123c', demolish, 'flex:1'));
          p.appendChild(row(r2));
        }
        out.push(p);
        out.push(btn('💰 Alle munten ophalen', '#15803d', collectAll));
        out.push(sec('🛒 PARK'));
        const m = btn('📢 Reclamecampagne niv ' + S.mark + ' (+25% bezoekers)', '#7c3aed', buyMark, 'width:100%;text-align:left;display:flex;justify-content:space-between;gap:8px'); m.appendChild(h('span', '', S.mark >= 5 ? 'MAX' : fmt(mkC()))); A.live(m, (e) => { e.style.opacity = S.mark < 5 && S.money >= mkC() ? 1 : 0.5; }); out.push(m);
        const k = btn('🧑‍💼 Kassamedewerker (haalt zelf munten op)', '#7c3aed', buyColl, 'width:100%;text-align:left;display:flex;justify-content:space-between;gap:8px'); k.appendChild(h('span', '', S.coll ? 'GEKOCHT' : fmt(300))); A.live(k, (e) => { e.style.opacity = !S.coll && S.money >= 300 ? 1 : 0.5; }); out.push(k);
        out.push(h('div', 'font-size:12px;opacity:.8;text-align:center', 'Bezoekers komen af op attracties. Te veel mensen zonder toiletten, ijs of bomen worden ongelukkig.'));
        return out;
      });
    }
    render(); api.score(0);
    A.every(tick, 500);
    return { destroy() { A.destroy(); } };
  },
};
