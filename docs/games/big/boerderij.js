// ===== Gamescroller groot spel (gedeelde helpers, zelfstandig in dit bestand) =====
const SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
const fmt = (n) => {
  if (n == null || isNaN(n)) return '0';
  if (!isFinite(n)) return '∞';
  if (n < 0) return '-' + fmt(-n);
  if (n < 1000) return (n < 10 && Math.abs(n - Math.round(n)) > 0.05) ? n.toFixed(1).replace('.', ',') : String(Math.floor(n + 1e-9));
  let i = 0;
  while (n >= 999.5 && i < SUF.length - 1) { n /= 1000; i++; }
  const s = n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : n.toFixed(0);
  return s.replace('.', ',') + SUF[i];
};
const fmtT = (s) => {
  s = Math.max(0, Math.ceil(s));
  const hh = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  return hh ? hh + 'u ' + String(m).padStart(2, '0') + 'm' : m ? m + 'm ' + String(ss).padStart(2, '0') + 's' : ss + 's';
};
const h = (tag, css, txt) => {
  const e = document.createElement(tag);
  if (css) e.style.cssText = css;
  if (txt != null) e.textContent = txt;
  return e;
};
const pill = (t) => '<span style="display:inline-block;background:#00000040;border-radius:10px;padding:2px 8px;margin:2px 3px 2px 0;white-space:nowrap">' + t + '</span>';
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const achN = (S) => Object.keys(S.ach || {}).length;
let CTX = { refresh() {}, save() {}, upd() {}, toast() {} };

function btn(parent, title, sub, cb, on = true, col) {
  const b = h('div', 'display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:48px;padding:8px 12px;margin:6px 0;border-radius:12px;box-sizing:border-box;border:1px solid #ffffff30;background:' + (on ? (col || 'linear-gradient(135deg,#ffffff30,#ffffff14)') : '#00000040') + ';opacity:' + (on ? 1 : 0.55) + ';cursor:' + (on ? 'pointer' : 'default'));
  b.appendChild(h('div', 'font-weight:600;font-size:14px;flex:1;line-height:1.3', title));
  if (sub != null && sub !== '') b.appendChild(h('div', 'font-size:12px;opacity:.9;text-align:right;max-width:46%;line-height:1.3;white-space:pre-line', sub));
  if (on) b.onclick = () => { cb(); CTX.upd(); CTX.refresh(true); CTX.save(); };
  parent.appendChild(b);
  return b;
}
function bar(parent, frac, col, label) {
  const o = h('div', 'position:relative;height:' + (label ? 16 : 8) + 'px;border-radius:8px;background:#00000050;overflow:hidden;margin:4px 0');
  o.appendChild(h('div', 'height:100%;width:' + (clamp(frac, 0, 1) * 100).toFixed(1) + '%;background:' + (col || '#ffd54a') + ';border-radius:8px'));
  if (label) o.appendChild(h('div', 'position:absolute;left:0;right:0;top:0;text-align:center;font-size:11px;line-height:16px;font-weight:600;text-shadow:0 1px 2px #000', label));
  parent.appendChild(o);
  return o;
}
function sec(parent, text) { parent.appendChild(h('div', 'font-weight:700;font-size:15px;margin:12px 0 4px;opacity:.95', text)); }
function note(parent, text) { parent.appendChild(h('div', 'font-size:12px;opacity:.8;margin:4px 0 6px;line-height:1.4', text)); }
function card(parent, css) { const c = h('div', 'background:#00000035;border:1px solid #ffffff22;border-radius:14px;padding:10px;margin:6px 0;' + (css || '')); parent.appendChild(c); return c; }

async function runGame(host, api, C) {
  host.innerHTML = '';
  host.style.cssText += ';overflow-y:auto;overflow-x:hidden;background:' + C.bg + ';color:#fff;font-family:system-ui,-apple-system,sans-serif;-webkit-user-select:none;user-select:none;';
  const wrap = h('div', 'position:relative;max-width:430px;margin:0 auto;padding:8px 10px 40px;min-height:100%;box-sizing:border-box');
  const head = h('div', 'position:sticky;top:0;z-index:5;padding:8px 10px;margin:-8px -10px 6px;background:' + (C.head || '#000000a0') + ';font-size:13px;line-height:1.6');
  const tabsEl = h('div', 'display:flex;gap:6px;overflow-x:auto;padding:4px 0 8px;scrollbar-width:none');
  const box = h('div', '');
  const over = h('div', 'position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:8;overflow:hidden');
  wrap.append(head, tabsEl, box, over);
  host.appendChild(wrap);
  let saved = null;
  try { saved = await api.load(); } catch (e) { saved = null; }
  if (!saved || typeof saved !== 'object') saved = null;
  const S = C.init(saved);
  if (!S.ach) S.ach = {};
  const tabs = C.ach ? C.tabs.concat([{ id: 'ach', label: '🏆 Prestaties', render(S, b) {
    sec(b, '🏆 Prestaties (' + achN(S) + '/' + C.ach.length + ')');
    if (C.achNote) note(b, C.achNote);
    for (const a of C.ach) {
      const got = !!S.ach[a.id];
      const c = card(b, 'display:flex;gap:10px;align-items:center;opacity:' + (got ? 1 : 0.55));
      c.appendChild(h('div', 'font-size:24px', got ? '🏆' : '🔒'));
      const t = h('div', 'flex:1');
      t.appendChild(h('div', 'font-weight:700;font-size:14px', a.n));
      t.appendChild(h('div', 'font-size:12px;opacity:.85', a.d));
      c.appendChild(t);
    }
  } }]) : C.tabs;
  let dead = false, down = false, tab = tabs.some((t) => t.id === S.tab) ? S.tab : tabs[0].id;
  const toast = (t) => { try { api.toast(t); } catch (e) {} };
  const save = () => { S.last = Date.now(); try { api.save(S); } catch (e) {} };
  function upd() { head.innerHTML = C.header(S); }
  function renderTabs() {
    tabsEl.innerHTML = '';
    for (const t of tabs) {
      const on = t.id === tab;
      const b = h('div', 'flex:0 0 auto;padding:10px 14px;min-height:44px;box-sizing:border-box;border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;background:' + (on ? (C.accent || '#ffd54a') : '#00000040') + ';color:' + (on ? '#1a1200' : '#fff'), t.label);
      b.onclick = () => { tab = t.id; S.tab = tab; renderTabs(); render(true); };
      tabsEl.appendChild(b);
    }
  }
  function render(force) {
    if (dead || (down && !force)) return;
    const t = tabs.find((x) => x.id === tab) || tabs[0];
    box.innerHTML = '';
    try { t.render(S, box); } catch (e) { box.textContent = 'Oeps: ' + e.message; }
  }
  CTX = { refresh: render, save, upd, toast, over, S, tabGo(id) { tab = id; S.tab = id; renderTabs(); render(true); } };
  const ctx = CTX;
  // offline voortgang
  const now = Date.now();
  const away = saved && S.last ? Math.min(Math.max((now - S.last) / 1000, 0), 28800) : 0;
  let welcome = null;
  if (away >= 10) {
    const snap = C.snap ? C.snap(S) : null;
    if (C.offline) C.offline(S, away, ctx);
    else { const n = Math.min(300, Math.ceil(away / 2)); for (let i = 0; i < n; i++) C.tick(S, away / n, ctx); }
    welcome = C.welcome ? C.welcome(S, snap, away) : null;
  }
  S.last = now;
  if (C.start) C.start(S, ctx);
  renderTabs(); upd(); render(true);
  if (welcome) setTimeout(() => { if (!dead) toast(welcome); }, 500);
  function checkAch() {
    if (!C.ach) return;
    for (const a of C.ach) {
      if (!S.ach[a.id]) { let ok = false; try { ok = a.t(S); } catch (e) {} if (ok) { S.ach[a.id] = 1; toast('🏆 ' + a.n); save(); } }
    }
  }
  const pd = () => { down = true; };
  const pu = () => { setTimeout(() => { down = false; }, 120); };
  host.addEventListener('pointerdown', pd);
  host.addEventListener('pointerup', pu);
  host.addEventListener('pointercancel', pu);
  let lastT = Date.now(), n = 0;
  const iv = setInterval(() => {
    const t = Date.now();
    const dt = Math.min(Math.max((t - lastT) / 1000, 0), 28800);
    lastT = t; S.last = t;
    try { C.tick(S, dt, ctx); } catch (e) { console.error(e); }
    n++; upd();
    if (n % 4 === 0) { checkAch(); render(false); }
  }, 250);
  const sv = setInterval(save, 10000);
  return {
    destroy() {
      if (dead) return;
      dead = true;
      clearInterval(iv); clearInterval(sv);
      host.removeEventListener('pointerdown', pd);
      host.removeEventListener('pointerup', pu);
      host.removeEventListener('pointercancel', pu);
      if (C.stop) { try { C.stop(S); } catch (e) {} }
      save();
    },
  };
}
// ===== Einde helpers =====
const CROPS = [
  { id: 'tarwe', n: 'Tarwe', e: '🌾', g: 20, s: 2, p: 4, x: 1, l: 1 },
  { id: 'wortel', n: 'Wortel', e: '🥕', g: 45, s: 5, p: 11, x: 2, l: 2 },
  { id: 'aardappel', n: 'Aardappel', e: '🥔', g: 90, s: 10, p: 24, x: 3, l: 3 },
  { id: 'tomaat', n: 'Tomaat', e: '🍅', g: 180, s: 25, p: 70, x: 5, l: 4 },
  { id: 'mais', n: 'Maïs', e: '🌽', g: 360, s: 60, p: 170, x: 8, l: 6 },
  { id: 'aardbei', n: 'Aardbei', e: '🍓', g: 600, s: 120, p: 380, x: 12, l: 8 },
  { id: 'pompoen', n: 'Pompoen', e: '🎃', g: 1200, s: 300, p: 1000, x: 20, l: 11 },
  { id: 'druif', n: 'Druiven', e: '🍇', g: 2700, s: 800, p: 2900, x: 40, l: 15 },
];
const ANIMALS = [
  { id: 'kip', n: 'Kip', e: '🐔', pr: 'ei', pe: '🥚', pn: 'Eieren', per: 40, p: 12, c: 50, l: 1 },
  { id: 'koe', n: 'Koe', e: '🐄', pr: 'melk', pe: '🥛', pn: 'Melk', per: 90, p: 45, c: 450, l: 5 },
  { id: 'schaap', n: 'Schaap', e: '🐑', pr: 'wol', pe: '🧶', pn: 'Wol', per: 150, p: 120, c: 2800, l: 8 },
  { id: 'bij', n: 'Bijenkorf', e: '🐝', pr: 'honing', pe: '🍯', pn: 'Honing', per: 120, p: 220, c: 10000, l: 12 },
];
const PRODUCTS = {}; ANIMALS.forEach((a) => { PRODUCTS[a.pr] = a; });
const itemInfo = (id) => { const c = CROPS.find((x) => x.id === id); if (c) return { e: c.e, n: c.n, p: c.p }; const a = PRODUCTS[id]; return a ? { e: a.pe, n: a.pn, p: a.p } : { e: '?', n: id, p: 1 }; };
const xpNeed = (l) => 15 * l * l;
const UPG = [
  { id: 'groei', n: '🌧️ Sproeisysteem', d: 'Gewassen groeien 10% sneller', max: 4, c: (l) => 200 * Math.pow(3, l) },
  { id: 'markt', n: '🏪 Marktkraam', d: '+10% verkoopprijs', max: 5, c: (l) => 300 * Math.pow(3, l) },
  { id: 'mest', n: '💩 Beste mest', d: '20% kans op dubbele oogst', max: 3, c: (l) => 500 * Math.pow(4, l) },
  { id: 'stal', n: '🏠 Grotere stal', d: '+4 plaatsen per diersoort', max: 5, c: (l) => 400 * Math.pow(3, l) },
];
function growTime(S, c) { return c.g * 1000 * (1 - 0.1 * (S.ups.groei || 0)); }
function sellMult(S) { return 1 + 0.1 * (S.ups.markt || 0) + 0.04 * achN(S); }
function mkt(id) {
  const i = CROPS.findIndex((c) => c.id === id) + ANIMALS.findIndex((a) => a.pr === id) + 2;
  const m = Math.floor(Date.now() / 60000);
  const f = (k) => 0.82 + 0.5 * Math.abs(Math.sin((m + k) * 12.9898 + i * 78.233));
  return { v: f(0), up: f(0) >= f(-1) };
}
const price = (S, id) => itemInfo(id).p * mkt(id).v * sellMult(S);
function cap(S) { return 4 + 4 * (S.ups.stal || 0); }
function addXp(S, x) {
  S.xp += x;
  while (S.xp >= xpNeed(S.lvl)) { S.xp -= xpNeed(S.lvl); S.lvl++; CTX.toast('🎉 Level ' + S.lvl + '! Nieuwe dingen ontgrendeld'); }
}
function newOrder(S) {
  const pool = CROPS.filter((c) => c.l <= S.lvl).map((c) => c.id).concat(ANIMALS.filter((a) => a.l <= S.lvl && S.animals[a.id] && S.animals[a.id].n > 0).map((a) => a.pr));
  const items = {};
  const k = 1 + (Math.random() < 0.5 ? 1 : 0) + (S.lvl > 6 ? 1 : 0);
  let val = 0;
  for (let i = 0; i < k; i++) { const id = pick(pool); const q = 2 + Math.floor(Math.random() * (3 + S.lvl / 2)); items[id] = (items[id] || 0) + q; }
  for (const id in items) val += items[id] * itemInfo(id).p;
  return { items, reward: Math.ceil(val * 1.7), xp: Math.ceil(val / 8) + 3 };
}
function harvest(S, i) {
  const pl = S.plots[i]; if (!pl || !pl.c) return false;
  const c = CROPS.find((x) => x.id === pl.c);
  if (Date.now() - pl.t < growTime(S, c)) return false;
  const y = 1 + (Math.random() < 0.2 * (S.ups.mest || 0) ? 1 : 0);
  S.inv[c.id] = (S.inv[c.id] || 0) + y;
  S.harv += y; addXp(S, c.x * y);
  S.plots[i] = { c: null, t: 0 };
  return c;
}
function plant(S, i, id) {
  const c = CROPS.find((x) => x.id === id);
  if (!c || S.plots[i].c || S.coins < c.s || c.l > S.lvl) return false;
  S.coins -= c.s; S.plots[i] = { c: id, t: Date.now() }; return true;
}

const C = {
  bg: 'linear-gradient(180deg,#9bd36b,#5da54a 30%,#3c7a37 70%,#2a5a2a)',
  head: '#1f4a1fe0',
  accent: '#ffe066',
  init(sv) {
    const S = Object.assign({ coins: 30, xp: 0, lvl: 1, plots: [], inv: {}, feed: 20, animals: {}, ups: {}, orders: [], sel: 'tarwe', harv: 0, sold: 0, done: 0, earned: 0, ach: {}, last: 0, tab: 'akker' }, sv || {});
    for (const k of ['inv', 'animals', 'ups', 'ach']) if (!S[k] || typeof S[k] !== 'object') S[k] = {};
    if (!Array.isArray(S.plots)) S.plots = [];
    while (S.plots.length < 4) S.plots.push({ c: null, t: 0 });
    if (!Array.isArray(S.orders)) S.orders = [];
    if (!S.orders.length) { S.orders = [newOrder(S), newOrder(S)]; }
    return S;
  },
  offline(S, away, ctx) { C.tick(S, away, ctx); },
  welcome: (S, s, away) => '🌾 Welkom terug! Je gewassen groeiden door en de dieren werkten ' + fmtT(away) + ' door.',
  tick(S, dt) {
    for (const a of ANIMALS) {
      const st = S.animals[a.id]; if (!st || !st.n) continue;
      st.acc = (st.acc || 0) + st.n * dt / a.per;
      let units = Math.floor(st.acc);
      if (units > 0) {
        const can = Math.floor(S.feed / 0.5);
        const made = Math.min(units, can);
        if (made > 0) { S.feed -= made * 0.5; S.inv[a.pr] = (S.inv[a.pr] || 0) + made; }
        st.acc -= units; if (made < units) st.acc = 0;
      }
    }
    if (S.ups.tractor) {
      for (let i = 0; i < S.plots.length; i++) {
        const pl = S.plots[i];
        if (pl.c) { const c = harvest(S, i); if (c) plant(S, i, c.id); }
      }
    }
  },
  header: (S) => pill('🪙 ' + fmt(S.coins)) + pill('⭐ Level ' + S.lvl + ' (' + fmt(S.xp) + '/' + fmt(xpNeed(S.lvl)) + ')') + pill('🥣 voer ' + fmt(S.feed)),
  tabs: [
    { id: 'akker', label: '🌱 Akkers', render(S, b) {
      const sel = h('div', 'display:flex;gap:6px;overflow-x:auto;padding:2px 0');
      for (const c of CROPS) {
        const ok = c.l <= S.lvl;
        const t = h('div', 'flex:0 0 auto;min-width:64px;padding:6px 8px;border-radius:12px;text-align:center;font-size:12px;cursor:pointer;border:2px solid ' + (S.sel === c.id ? '#ffe066' : 'transparent') + ';background:' + (ok ? '#00000040' : '#00000070') + ';opacity:' + (ok ? 1 : 0.5));
        t.appendChild(h('div', 'font-size:24px', ok ? c.e : '🔒'));
        t.appendChild(h('div', '', ok ? '🪙' + c.s : 'lvl ' + c.l));
        if (ok) t.onclick = () => { S.sel = c.id; CTX.refresh(true); };
        sel.appendChild(t);
      }
      b.appendChild(sel);
      const cr = CROPS.find((x) => x.id === S.sel) || CROPS[0];
      note(b, cr.n + ': groeit ' + fmtT(growTime(S, cr) / 1000) + ', levert 🪙 ' + fmt(cr.p * sellMult(S)) + ' (zaadje 🪙 ' + cr.s + ')');
      const grid = h('div', 'display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:8px 0');
      S.plots.forEach((pl, i) => {
        const c = pl.c ? CROPS.find((x) => x.id === pl.c) : null;
        const left = c ? growTime(S, c) - (Date.now() - pl.t) : 0;
        const ready = c && left <= 0;
        const t = h('div', 'aspect-ratio:1;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;background:' + (ready ? 'linear-gradient(#a0d468,#6a9a2f)' : '#6b4a2b') + ';border:2px solid ' + (ready ? '#ffe066' : '#4a321c') + ';text-align:center;font-size:11px;box-sizing:border-box');
        t.appendChild(h('div', 'font-size:30px;line-height:1.1', !c ? '' : ready ? c.e : left > growTime(S, c) / 2 ? '🌱' : '🌿'));
        if (c && !ready) t.appendChild(h('div', '', fmtT(left / 1000)));
        else if (ready) t.appendChild(h('div', 'font-weight:700', 'Oogst!'));
        else t.appendChild(h('div', 'opacity:.7', 'leeg'));
        t.onclick = () => {
          if (!c) { if (!plant(S, i, S.sel)) CTX.toast(cr.l > S.lvl ? 'Nog niet ontgrendeld' : 'Te weinig munten'); }
          else if (ready) harvest(S, i);
          else CTX.toast('Nog ' + fmtT(left / 1000) + ' tot oogst');
          CTX.upd(); CTX.refresh(true); CTX.save();
        };
        grid.appendChild(t);
      });
      b.appendChild(grid);
      const row = h('div', 'display:flex;gap:8px');
      const mk = (txt, f) => { const x = h('div', 'flex:1;text-align:center;padding:12px 6px;border-radius:12px;font-weight:700;font-size:13px;cursor:pointer;background:#00000050;min-height:44px;box-sizing:border-box', txt); x.onclick = () => { f(); CTX.upd(); CTX.refresh(true); CTX.save(); }; row.appendChild(x); };
      mk('🧺 Oogst alles', () => { let n = 0; S.plots.forEach((p, i) => { if (harvest(S, i)) n++; }); if (n) CTX.toast(n + ' percelen geoogst'); });
      mk('🌱 Plant alles', () => { let n = 0; S.plots.forEach((p, i) => { if (plant(S, i, S.sel)) n++; }); if (!n) CTX.toast('Niets geplant'); });
      b.appendChild(row);
      if (S.plots.length < 16) {
        const pc = Math.round(60 * Math.pow(2.1, S.plots.length - 4));
        btn(b, '➕ Nieuw perceel kopen', '🪙 ' + fmt(pc), () => { if (S.coins >= pc) { S.coins -= pc; S.plots.push({ c: null, t: 0 }); } }, S.coins >= pc, 'linear-gradient(135deg,#8a5a2b,#5a3a1a)');
      }
    } },
    { id: 'dier', label: '🐄 Dieren', render(S, b) {
      const fc = 25;
      btn(b, '🥣 Voer kopen (+25)', '🪙 ' + fc + ' · voorraad ' + fmt(S.feed), () => { if (S.coins >= fc) { S.coins -= fc; S.feed += 25; } }, S.coins >= fc);
      note(b, 'Elk product kost een half voer. Zonder voer produceren je dieren niets! Maximaal ' + cap(S) + ' per soort.');
      ANIMALS.forEach((a) => {
        const st = S.animals[a.id] || { n: 0, acc: 0 };
        if (a.l > S.lvl) { card(b, 'opacity:.5').textContent = '🔒 ' + a.e + ' ' + a.n + ' (level ' + a.l + ')'; return; }
        const cost = Math.ceil(a.c * Math.pow(1.25, st.n));
        const c = card(b);
        c.appendChild(h('div', 'font-weight:700', a.e + ' ' + a.n + ' x' + st.n + ' → ' + a.pe + ' ' + a.pn + ' per ' + fmtT(a.per) + ' elk'));
        c.appendChild(h('div', 'font-size:12px;opacity:.85;margin-bottom:4px', 'Voorraad: ' + fmt(S.inv[a.pr] || 0)));
        btn(c, 'Koop ' + a.n, '🪙 ' + fmt(cost), () => { if (S.coins >= cost && st.n < cap(S)) { S.coins -= cost; S.animals[a.id] = { n: st.n + 1, acc: st.acc || 0 }; } else if (st.n >= cap(S)) CTX.toast('Stal vol, bouw een grotere stal'); }, S.coins >= cost && st.n < cap(S));
      });
    } },
    { id: 'markt', label: '🏪 Markt', render(S, b) {
      note(b, 'Prijzen schommelen elke minuut. Verkoop als ze hoog staan (▲)!');
      const ids = Object.keys(S.inv).filter((k) => S.inv[k] > 0);
      if (!ids.length) note(b, 'Je schuur is leeg. Oogst eerst iets.');
      let total = 0;
      for (const id of ids) {
        const inf = itemInfo(id), n = S.inv[id], pr = price(S, id), m = mkt(id);
        total += n * pr;
        btn(b, inf.e + ' ' + inf.n + ' x' + fmt(n), (m.up ? '▲' : '▼') + ' 🪙 ' + fmt(pr) + ' per stuk', () => {
          const g = Math.floor(n * pr); S.coins += g; S.earned += g; S.sold += n; S.inv[id] = 0; CTX.toast('Verkocht voor 🪙 ' + fmt(g));
        }, true, m.up ? 'linear-gradient(135deg,#3f9b4a,#2d6b34)' : 'linear-gradient(135deg,#a05a3a,#6a3a24)');
      }
      if (ids.length > 1) btn(b, '💰 Verkoop alles', '🪙 ' + fmt(total), () => {
        const g = Math.floor(total); S.coins += g; S.earned += g; for (const id of ids) { S.sold += S.inv[id]; S.inv[id] = 0; } CTX.toast('Verkocht voor 🪙 ' + fmt(g));
      }, true, 'linear-gradient(135deg,#e8b923,#a87c0a)');
    } },
    { id: 'orders', label: '📦 Bestellingen', render(S, b) {
      note(b, 'Klanten betalen extra voor grote bestellingen. Voltooid: ' + S.done);
      S.orders.forEach((o, idx) => {
        const c = card(b);
        let ok = true;
        for (const id in o.items) {
          const inf = itemInfo(id), have = S.inv[id] || 0;
          if (have < o.items[id]) ok = false;
          c.appendChild(h('div', 'font-size:14px;color:' + (have >= o.items[id] ? '#b9ffb0' : '#fff'), inf.e + ' ' + inf.n + ': ' + fmt(have) + ' / ' + o.items[id]));
        }
        btn(c, ok ? '✅ Leveren' : 'Nog niet genoeg', '🪙 ' + fmt(o.reward) + ' · ⭐ ' + o.xp, () => {
          for (const id in o.items) S.inv[id] -= o.items[id];
          S.coins += o.reward; S.earned += o.reward; S.done++; addXp(S, o.xp);
          S.orders[idx] = newOrder(S);
          CTX.toast('Bestelling geleverd! +🪙 ' + fmt(o.reward));
        }, ok, 'linear-gradient(135deg,#3f9b4a,#2d6b34)');
        const sk = btn(c, '🔄 Andere bestelling', '', () => { S.orders[idx] = newOrder(S); }, true, '#00000040');
        sk.style.minHeight = '40px';
      });
      if (S.orders.length < 3 && S.lvl >= 5) btn(b, '➕ Derde bestelling openen', '', () => { S.orders.push(newOrder(S)); }, true);
    } },
    { id: 'shop', label: '🛠️ Winkel', render(S, b) {
      for (const u of UPG) {
        const l = S.ups[u.id] || 0;
        if (l >= u.max) { card(b, 'opacity:.7').textContent = '✅ ' + u.n + ' (max)'; continue; }
        const c = u.c(l);
        btn(b, u.n + ' (niveau ' + l + '/' + u.max + ')', u.d + '\n🪙 ' + fmt(c), () => { if (S.coins >= c) { S.coins -= c; S.ups[u.id] = l + 1; } }, S.coins >= c);
      }
      if (!S.ups.tractor) btn(b, '🚜 Tractor', 'Oogst en plant automatisch\n🪙 25K (vanaf level 10)', () => { if (S.coins >= 25000 && S.lvl >= 10) { S.coins -= 25000; S.ups.tractor = 1; } else CTX.toast('Nog niet beschikbaar'); }, S.coins >= 25000 && S.lvl >= 10);
      else card(b, 'opacity:.7').textContent = '✅ Tractor actief';
      const st = card(b);
      st.textContent = '📊 Geoogst: ' + fmt(S.harv) + ' · Verkocht: ' + fmt(S.sold) + ' · Totaal verdiend: 🪙 ' + fmt(S.earned);
    } },
  ],
  ach: [
    { id: 'a1', n: 'Eerste oogst', d: 'Oogst 1 gewas', t: (S) => S.harv >= 1 },
    { id: 'a2', n: 'Boer in de dop', d: 'Oogst 100 gewassen', t: (S) => S.harv >= 100 },
    { id: 'a3', n: 'Oogstmachine', d: 'Oogst 1500 gewassen', t: (S) => S.harv >= 1500 },
    { id: 'a4', n: 'Kleine handelaar', d: 'Verdien 1000 munten met verkopen', t: (S) => S.earned >= 1000 },
    { id: 'a5', n: 'Grootgrondbezitter', d: 'Heb 12 percelen', t: (S) => S.plots.length >= 12 },
    { id: 'a6', n: 'Leverancier', d: 'Voltooi 10 bestellingen', t: (S) => S.done >= 10 },
    { id: 'a7', n: 'Dierenvriend', d: 'Heb 10 dieren', t: (S) => Object.values(S.animals).reduce((a, x) => a + x.n, 0) >= 10 },
    { id: 'a8', n: 'Level 10', d: 'Bereik level 10', t: (S) => S.lvl >= 10 },
    { id: 'a9', n: 'Level 15', d: 'Bereik level 15', t: (S) => S.lvl >= 15 },
    { id: 'a10', n: 'Machinist', d: 'Koop de tractor', t: (S) => !!S.ups.tractor },
  ],
  achNote: 'Elke prestatie geeft +4% verkoopprijs.',
};

export default {
  id: 'boerderij', name: 'Boerderij', emoji: '🚜', desc: 'Plant gewassen die in echte tijd groeien, oogst en verzorg je dieren.',
  async create(host, api) { return runGame(host, api, C); },
};
