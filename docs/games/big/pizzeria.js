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
const TOPS = [
  { id: 'kaas', n: 'Kaas', e: '🧀', p: 2, c: 0 },
  { id: 'ham', n: 'Ham', e: '🥓', p: 3, c: 0 },
  { id: 'champ', n: 'Champignons', e: '🍄', p: 3, c: 0 },
  { id: 'peper', n: 'Peperoni', e: '🌶️', p: 3, c: 120 },
  { id: 'ui', n: 'Ui', e: '🧅', p: 2, c: 200 },
  { id: 'olijf', n: 'Olijven', e: '🫒', p: 3, c: 450 },
  { id: 'ananas', n: 'Ananas', e: '🍍', p: 4, c: 900 },
  { id: 'basil', n: 'Basilicum', e: '🌿', p: 4, c: 2000 },
  { id: 'tonijn', n: 'Tonijn', e: '🐟', p: 5, c: 4500 },
  { id: 'garnaal', n: 'Garnalen', e: '🦐', p: 6, c: 10000 },
  { id: 'truffel', n: 'Truffel', e: '🟤', p: 9, c: 30000 },
];
const FACES = ['🧑', '👩', '👨', '🧓', '👧', '👦', '🧔', '👵', '🤠', '👩‍🎤', '🧑‍🎓', '👨‍🚀'];
const UPS = [
  { id: 'tafel', n: '🪑 Meer tafels', d: 'Meer klanten tegelijk en sneller nieuwe klanten', max: 7, c: (l) => Math.round(150 * Math.pow(2.3, l)) },
  { id: 'oven', n: '🔥 Extra oven', d: 'Meer pizza\'s tegelijk bakken', max: 4, c: (l) => Math.round(300 * Math.pow(3.2, l)) },
  { id: 'snel', n: '⚡ Hetere oven', d: 'Pizza\'s 15% sneller klaar', max: 8, c: (l) => Math.round(200 * Math.pow(2.1, l)) },
  { id: 'decor', n: '🕯️ Gezellig decor', d: 'Klanten wachten 12% langer', max: 6, c: (l) => Math.round(250 * Math.pow(2.4, l)) },
];
const STAFF = [
  { id: 'kok', n: '👨‍🍳 Kok Mario', d: 'Maakt zelf pizza\'s voor wachtende klanten', max: 6, c: (l) => Math.round(400 * Math.pow(2.4, l)) },
  { id: 'ober', n: '🤵 Ober Luigi', d: 'Klanten wachten 10% langer', max: 5, c: (l) => Math.round(350 * Math.pow(2.2, l)) },
  { id: 'reclame', n: '📣 Reclamefolder', d: 'Meer klanten komen langs (+15%)', max: 5, c: (l) => Math.round(500 * Math.pow(2.5, l)) },
];
const unlockedTops = (S) => TOPS.filter((t) => S.tops[t.id]);
const topOf = (id) => TOPS.find((t) => t.id === id) || TOPS[0];
const up = (S, id) => S.ups[id] || 0;
const stf = (S, id) => S.staff[id] || 0;
function patienceMax(S) { return 40 * (1 + 0.12 * up(S, 'decor')) * (1 + 0.1 * stf(S, 'ober')); }
function bakeTime(S) { return 6 * Math.pow(0.85, up(S, 'snel')); }
function maxQueue(S) { return 2 + up(S, 'tafel'); }
function newCustomer(S) {
  const pool = unlockedTops(S);
  const maxK = Math.min(4, 1 + Math.ceil(pool.length / 3));
  const k = 1 + Math.floor(Math.random() * maxK);
  const want = [];
  const cp = pool.slice();
  for (let i = 0; i < k && cp.length; i++) want.push(cp.splice(Math.floor(Math.random() * cp.length), 1)[0].id);
  const base = 5 + want.reduce((a, id) => a + topOf(id).p, 0);
  return { id: S.nextId++, face: pick(FACES), want, pat: patienceMax(S), max: patienceMax(S), pay: Math.round(base * (1 + S.rep / 8)) };
}
function rate(S, stars) {
  S.ratings.push(stars);
  if (S.ratings.length > 20) S.ratings.shift();
  S.rep = S.ratings.reduce((a, b) => a + b, 0) / S.ratings.length;
}
function judge(cust, tops) {
  const w = cust.want, miss = w.filter((x) => tops.indexOf(x) < 0).length, extra = tops.filter((x) => w.indexOf(x) < 0).length;
  return miss + extra;
}
function serve(S, cust, tops) {
  const d = judge(cust, tops), f = cust.pat / cust.max;
  let pay, stars, msg;
  if (d === 0) { pay = cust.pay * (1 + 0.4 * f); stars = f > 0.5 ? 5 : 4; S.perfect++; msg = '😍 Perfect! +🪙 ' + Math.round(pay); }
  else if (d === 1) { pay = cust.pay * 0.5; stars = 3; msg = '😐 Bijna goed. +🪙 ' + Math.round(pay); }
  else { pay = cust.pay * 0.15; stars = 1; msg = '😡 Dit klopt niet! +🪙 ' + Math.round(pay); }
  pay = Math.round(pay);
  S.coins += pay; S.earned += pay; S.served++;
  rate(S, stars);
  S.queue = S.queue.filter((c) => c.id !== cust.id);
  if (S.sel === cust.id) S.sel = S.queue.length ? S.queue[0].id : null;
  CTX.toast(msg);
}
const GOALS = [
  { id: 'g1', n: 'Serveer 10 pizza\'s', cur: (S) => S.served, tg: 10, r: 80 },
  { id: 'g2', n: '5 perfecte pizza\'s', cur: (S) => S.perfect, tg: 5, r: 120 },
  { id: 'g3', n: 'Serveer 50 pizza\'s', cur: (S) => S.served, tg: 50, r: 500 },
  { id: 'g4', n: '25 perfecte pizza\'s', cur: (S) => S.perfect, tg: 25, r: 900 },
  { id: 'g5', n: 'Verdien 5K munten', cur: (S) => S.earned, tg: 5000, r: 1500 },
  { id: 'g6', n: 'Serveer 200 pizza\'s', cur: (S) => S.served, tg: 200, r: 4000 },
  { id: 'g7', n: 'Verdien 100K munten', cur: (S) => S.earned, tg: 1e5, r: 20000 },
  { id: 'g8', n: '1000 pizza\'s geserveerd', cur: (S) => S.served, tg: 1000, r: 100000 },
];

const C = {
  bg: 'linear-gradient(180deg,#8e1b1b,#c0392b 35%,#7a1f16)',
  head: '#3b0a07e8',
  accent: '#ffd23f',
  init(sv) {
    const S = Object.assign({ coins: 20, rep: 4, ratings: [], served: 0, perfect: 0, lost: 0, earned: 0, queue: [], oven: [], build: [], sel: null, nextId: 1, spawnT: 1, kokT: 0, ups: {}, staff: {}, tops: { kaas: 1, ham: 1, champ: 1 }, goals: {}, ach: {}, last: 0, tab: 'keuken' }, sv || {});
    for (const k of ['ups', 'staff', 'tops', 'goals', 'ach']) if (!S[k] || typeof S[k] !== 'object') S[k] = {};
    for (const k of ['ratings', 'queue', 'oven', 'build']) if (!Array.isArray(S[k])) S[k] = [];
    return S;
  },
  offline(S, away) {
    const k = stf(S, 'kok');
    if (!k) return;
    const n = Math.min(3000, Math.floor(k * away / 14));
    const avg = (5 + unlockedTops(S).length * 2.2) * 0.85;
    S.coins += Math.round(n * avg); S.earned += Math.round(n * avg); S.served += n;
    S._off = n;
  },
  welcome(S) { const n = S._off || 0; S._off = 0; return n ? '🍕 Kok Mario serveerde ' + fmt(n) + ' pizza\'s terwijl je weg was!' : null; },
  tick(S, dt) {
    S.spawnT -= dt;
    if (S.spawnT <= 0) {
      if (S.queue.length < maxQueue(S)) { S.queue.push(newCustomer(S)); if (!S.sel) S.sel = S.queue[S.queue.length - 1].id; CTX.refresh(); }
      S.spawnT = Math.max(3, 13 / (1 + 0.22 * up(S, 'tafel')) / (0.55 + S.rep / 5) / (1 + 0.15 * stf(S, 'reclame')));
    }
    for (const c of S.queue) c.pat -= dt;
    const gone = S.queue.filter((c) => c.pat <= 0);
    if (gone.length) {
      for (const c of gone) { S.lost++; rate(S, 1); }
      S.queue = S.queue.filter((c) => c.pat > 0);
      if (!S.queue.find((c) => c.id === S.sel)) S.sel = S.queue.length ? S.queue[0].id : null;
      CTX.toast('😤 Een klant is boos weggelopen');
      CTX.refresh();
    }
    const bt = bakeTime(S);
    for (const o of S.oven) { if (o.t < bt) { o.t += dt; if (o.t >= bt) CTX.refresh(); } }
    const k = stf(S, 'kok');
    if (k && S.queue.length) {
      S.kokT += dt;
      const every = 14 / k;
      if (S.kokT >= every) {
        S.kokT = 0;
        const c = S.queue[0];
        const pay = Math.round(c.pay * 0.9);
        S.coins += pay; S.earned += pay; S.served++; rate(S, 4);
        S.queue.shift();
        if (S.sel === c.id) S.sel = S.queue.length ? S.queue[0].id : null;
        CTX.refresh();
      }
    }
  },
  header: (S) => pill('🪙 ' + fmt(S.coins)) + pill('⭐ ' + S.rep.toFixed(1).replace('.', ',')) + pill('🍕 ' + fmt(S.served)) + pill('🪑 ' + S.queue.length + '/' + maxQueue(S)),
  tabs: [
    { id: 'keuken', label: '👨‍🍳 Keuken', render(S, b) {
      sec(b, 'Klanten (tik om te kiezen)');
      if (!S.queue.length) note(b, 'Even geen klanten... de volgende komt zo.');
      S.queue.forEach((c) => {
        const on = c.id === S.sel;
        const card1 = card(b, 'cursor:pointer;border:2px solid ' + (on ? '#ffd23f' : '#ffffff22') + ';background:' + (on ? '#ffffff22' : '#00000035'));
        const r = h('div', 'display:flex;align-items:center;gap:10px');
        r.appendChild(h('div', 'font-size:34px', c.pat / c.max < 0.3 ? '😠' : c.pat / c.max < 0.6 ? '😕' : c.face));
        const t = h('div', 'flex:1');
        t.appendChild(h('div', 'font-size:22px', c.want.map((id) => topOf(id).e).join(' ')));
        t.appendChild(h('div', 'font-size:12px;opacity:.9', c.want.map((id) => topOf(id).n).join(', ') + ' · 🪙 ' + c.pay));
        r.appendChild(t);
        card1.appendChild(r);
        bar(card1, c.pat / c.max, c.pat / c.max < 0.3 ? '#ff5a4a' : c.pat / c.max < 0.6 ? '#ffb02e' : '#7ddc5a');
        card1.onclick = () => { S.sel = c.id; CTX.refresh(true); };
      });
      sec(b, 'Pizza beleggen');
      const g = h('div', 'display:grid;grid-template-columns:repeat(4,1fr);gap:6px');
      for (const t of unlockedTops(S)) {
        const on = S.build.indexOf(t.id) >= 0;
        const x = h('div', 'padding:6px 2px;min-height:56px;box-sizing:border-box;border-radius:12px;text-align:center;font-size:11px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px solid ' + (on ? '#ffd23f' : 'transparent') + ';background:' + (on ? '#ffffff35' : '#00000045'));
        x.appendChild(h('div', 'font-size:24px;line-height:1.1', t.e));
        x.appendChild(h('div', '', t.n));
        x.onclick = () => { const i = S.build.indexOf(t.id); if (i >= 0) S.build.splice(i, 1); else S.build.push(t.id); CTX.refresh(true); };
        g.appendChild(x);
      }
      b.appendChild(g);
      const full = S.oven.length >= 1 + up(S, 'oven');
      btn(b, '🍕 Pizza met ' + (S.build.length ? S.build.map((id) => topOf(id).e).join('') : '(niets)'), full ? 'Oven vol' : 'In de oven (' + fmtT(bakeTime(S)) + ')', () => {
        if (!S.build.length || full) return;
        S.oven.push({ tops: S.build.slice(), t: 0 }); S.build = [];
      }, S.build.length > 0 && !full, 'linear-gradient(135deg,#e67e22,#b8561a)');
      sec(b, 'Oven (' + S.oven.length + '/' + (1 + up(S, 'oven')) + ')');
      const bt = bakeTime(S);
      S.oven.forEach((o, i) => {
        const ready = o.t >= bt;
        const c = card(b);
        c.appendChild(h('div', 'font-size:20px', o.tops.map((id) => topOf(id).e).join(' ')));
        if (!ready) bar(c, o.t / bt, '#ff9f43', 'Bakken...');
        else {
          const cust = S.queue.find((x) => x.id === S.sel);
          btn(c, cust ? '✅ Klaar! Serveer aan ' + cust.face : '✅ Klaar (kies eerst een klant)', '', () => { const cu = S.queue.find((x) => x.id === S.sel); if (!cu) return; serve(S, cu, o.tops); S.oven.splice(i, 1); }, !!cust, 'linear-gradient(135deg,#3f9b4a,#2d6b34)');
          const tr = btn(c, '🗑️ Weggooien', '', () => { S.oven.splice(i, 1); }, true, '#00000040'); tr.style.minHeight = '40px';
        }
      });
      if (!S.oven.length) note(b, 'De oven is leeg.');
    } },
    { id: 'uitbr', label: '🏗️ Uitbreiden', render(S, b) {
      sec(b, 'Restaurant');
      for (const u of UPS) {
        const l = up(S, u.id);
        if (l >= u.max) { card(b, 'opacity:.7').textContent = '✅ ' + u.n + ' (max)'; continue; }
        const c = u.c(l);
        btn(b, u.n + ' ' + l + '/' + u.max, u.d + '\n🪙 ' + fmt(c), () => { if (S.coins >= c) { S.coins -= c; S.ups[u.id] = l + 1; } }, S.coins >= c);
      }
      sec(b, 'Recepten (nieuwe toppings)');
      for (const t of TOPS) {
        if (S.tops[t.id]) continue;
        btn(b, t.e + ' ' + t.n, 'waarde ' + t.p + '\n🪙 ' + fmt(t.c), () => { if (S.coins >= t.c) { S.coins -= t.c; S.tops[t.id] = 1; } }, S.coins >= t.c);
      }
      if (unlockedTops(S).length === TOPS.length) note(b, 'Alle toppings ontgrendeld!');
    } },
    { id: 'staff', label: '👥 Personeel', render(S, b) {
      note(b, 'Personeel werkt ook door als je weg bent.');
      for (const u of STAFF) {
        const l = stf(S, u.id);
        const c = u.c(l);
        if (l >= u.max) { card(b, 'opacity:.7').textContent = '✅ ' + u.n + ' x' + l + ' (max)'; continue; }
        btn(b, u.n + ' x' + l, u.d + '\n🪙 ' + fmt(c), () => { if (S.coins >= c) { S.coins -= c; S.staff[u.id] = l + 1; } }, S.coins >= c);
      }
      const c = card(b);
      c.textContent = '📊 Perfect: ' + S.perfect + ' · Geserveerd: ' + S.served + ' · Boos weggelopen: ' + S.lost;
    } },
    { id: 'doelen', label: '🎯 Doelen', render(S, b) {
      for (const g of GOALS) {
        const cur = g.cur(S), ok = cur >= g.tg, done = S.goals[g.id];
        const c = card(b, 'opacity:' + (done ? 0.55 : 1));
        c.appendChild(h('div', 'font-weight:700', (done ? '✅ ' : '') + g.n));
        bar(c, cur / g.tg, '#ffd23f', fmt(Math.min(cur, g.tg)) + ' / ' + fmt(g.tg));
        if (!done) btn(c, ok ? '🎁 Pak beloning' : 'Nog bezig', '🪙 ' + fmt(g.r), () => { S.goals[g.id] = 1; S.coins += g.r; CTX.toast('+🪙 ' + fmt(g.r)); }, ok, 'linear-gradient(135deg,#3f9b4a,#2d6b34)');
      }
    } },
  ],
  ach: [
    { id: 'a1', n: 'Eerste pizza', d: 'Serveer 1 pizza', t: (S) => S.served >= 1 },
    { id: 'a2', n: 'Pizzabakker', d: 'Serveer 100 pizza\'s', t: (S) => S.served >= 100 },
    { id: 'a3', n: 'Pizzakoning', d: 'Serveer 1000 pizza\'s', t: (S) => S.served >= 1000 },
    { id: 'a4', n: 'Perfectionist', d: '50 perfecte pizza\'s', t: (S) => S.perfect >= 50 },
    { id: 'a5', n: 'Vijfsterren', d: 'Haal een beoordeling van 4,8+ (na 10 klanten)', t: (S) => S.ratings.length >= 10 && S.rep >= 4.8 },
    { id: 'a6', n: 'Teamwork', d: 'Neem een kok aan', t: (S) => stf(S, 'kok') >= 1 },
    { id: 'a7', n: 'Grote zaak', d: 'Heb 6 tafels extra', t: (S) => up(S, 'tafel') >= 6 },
    { id: 'a8', n: 'Alle smaken', d: 'Ontgrendel alle toppings', t: (S) => unlockedTops(S).length === TOPS.length },
    { id: 'a9', n: 'Rijk', d: 'Verdien 100K', t: (S) => S.earned >= 1e5 },
  ],
};

export default {
  id: 'pizzeria', name: 'Pizzeria Tycoon', emoji: '🍕', desc: 'Neem bestellingen op, beleg de pizza\'s en breid je restaurant uit.',
  async create(host, api) { return runGame(host, api, C); },
};
