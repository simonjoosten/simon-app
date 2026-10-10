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
const MINERS = [
  { id: 'leerling', n: 'Leerling-mijnwerker', e: '🧒', c: 15, p: 0.2 },
  { id: 'pikhouwer', n: 'Pikhouwer', e: '⛏️', c: 110, p: 1.5 },
  { id: 'dynamiet', n: 'Dynamietman', e: '🧨', c: 1200, p: 9 },
  { id: 'boor', n: 'Boorrig', e: '🔩', c: 13000, p: 52 },
  { id: 'graaf', n: 'Graafmachine', e: '🚜', c: 140000, p: 290 },
  { id: 'drill', n: 'Diamantboor', e: '💎', c: 1.6e6, p: 1600 },
  { id: 'golem', n: 'Goudgolem', e: '🗿', c: 2.2e7, p: 9000 },
  { id: 'draak', n: 'Schatdraak', e: '🐲', c: 3.5e8, p: 52000 },
];
const LAYERS = [
  { n: 'Zandgrond', e: '🟫', m: 1, c: 0 },
  { n: 'Kleilaag', e: '🧱', m: 2, c: 1500 },
  { n: 'Steenlaag', e: '🪨', m: 5, c: 3e4 },
  { n: 'Kopermijn', e: '🟠', m: 14, c: 6e5 },
  { n: 'Zilverader', e: '⚪', m: 40, c: 1.2e7 },
  { n: 'Diamantgrot', e: '💠', m: 150, c: 3e8 },
  { n: 'Lavakamers', e: '🌋', m: 700, c: 8e9 },
  { n: 'De Kern', e: '🔥', m: 4000, c: 3e11 },
];
const GEMS = [
  { id: 'kwarts', n: 'Kwarts', e: '🤍', r: 50 },
  { id: 'amethist', n: 'Amethist', e: '🟣', r: 28 },
  { id: 'topaas', n: 'Topaas', e: '🟡', r: 14 },
  { id: 'smaragd', n: 'Smaragd', e: '🟢', r: 6 },
  { id: 'robijn', n: 'Robijn', e: '🔴', r: 2.5 },
  { id: 'saffier', n: 'Saffier', e: '🔵', r: 1 },
  { id: 'diamant', n: 'Diamant', e: '💎', r: 0.35 },
];
const CLICKUP = [
  { id: 'c1', n: 'Stevigere houweel', c: 100, m: 2 },
  { id: 'c2', n: 'Stalen punt', c: 1500, m: 3 },
  { id: 'c3', n: 'Mijnwerkershandschoenen', c: 5e4, m: 4 },
  { id: 'c4', n: 'Hydraulische hamer', c: 2e6, m: 5 },
  { id: 'c5', n: 'Gouddetector', c: 1e8, m: 6 },
  { id: 'c6', n: 'Kristalhouweel', c: 5e9, m: 8 },
];
const NUGSHOP = [
  { id: 'start', n: 'Startkapitaal', d: 'Begin elke run met 5K goud', c: 2 },
  { id: 'cheap', n: 'Korting bij de hoofdman', d: 'Mijnwerkers 10% goedkoper', c: 5 },
  { id: 'gemx', n: 'Edelsteenneus', d: 'Edelstenen 2x zo vaak', c: 8 },
  { id: 'auto', n: 'Automatische pikhouwers', d: 'Alle mijnwerkers +25%', c: 15 },
  { id: 'tap', n: 'Sterke armen', d: 'Tikken +100%', c: 25 },
];
const gemTotal = (S) => GEMS.reduce((a, g) => a + (S.gems[g.id] || 0), 0);
const gemSet = (S) => GEMS.every((g) => (S.gems[g.id] || 0) > 0);
function minerUps(id) {
  const m = MINERS.find((x) => x.id === id);
  return [
    { id: id + '1', n: m.n + ' training', c: m.c * 60, need: 5, m: 2 },
    { id: id + '2', n: m.n + ' superuitrusting', c: m.c * 900, need: 20, m: 2 },
    { id: id + '3', n: m.n + ' meesterklasse', c: m.c * 20000, need: 50, m: 3 },
  ];
}
function nug(S, id) { return !!S.shop[id]; }
function cost(S, mi, owned) { return Math.ceil(MINERS[mi].c * Math.pow(1.15, owned) * (nug(S, 'cheap') ? 0.9 : 1)); }
function mult(S) {
  const layer = LAYERS[S.layer].m;
  const nb = 1 + 0.1 * S.nugTotal;
  const gb = 1 + 0.02 * gemTotal(S);
  const sb = gemSet(S) ? 2 : 1;
  const ab = 1 + 0.05 * achN(S);
  return layer * nb * gb * sb * ab;
}
function perSec(S) {
  let t = 0;
  MINERS.forEach((m, i) => {
    let q = 1;
    for (const u of minerUps(m.id)) if (S.ups[u.id]) q *= u.m;
    t += (S.miners[m.id] || 0) * m.p * q;
  });
  if (S.ups.glob1) t *= 1.5;
  if (S.ups.glob2) t *= 2;
  if (nug(S, 'auto')) t *= 1.25;
  return t * mult(S);
}
function perClick(S) {
  let c = 1;
  for (const u of CLICKUP) if (S.ups[u.id]) c *= u.m;
  if (S.ups.fing) c += perSec(S) * 0.02;
  if (nug(S, 'tap')) c *= 2;
  return c * mult(S);
}
function pendingNug(S) { return Math.floor(Math.sqrt(S.run / 2e6)); }
function findGem(S, bonus) {
  const w = GEMS.map((g, i) => g.r * (i <= S.layer + 1 ? 1 : 0.2) * (i < 3 ? 1 : (1 + S.layer * 0.3)));
  let tot = w.reduce((a, b) => a + b, 0), r = Math.random() * tot, k = 0;
  while (k < w.length - 1 && r > w[k]) { r -= w[k]; k++; }
  S.gems[GEMS[k].id] = (S.gems[GEMS[k].id] || 0) + 1;
  return GEMS[k];
}
function gemRate(S) {
  const m = Object.values(S.miners).reduce((a, b) => a + b, 0);
  let r = (0.004 * m + 0.01) * (1 + S.layer * 0.4);
  if (S.ups.gem1) r *= 2;
  if (S.ups.gem2) r *= 2;
  if (nug(S, 'gemx')) r *= 2;
  return r;
}

const C = {
  bg: 'linear-gradient(180deg,#2b1d0e,#4a2f12 40%,#1d1308)',
  head: '#1b1006e6',
  accent: '#ffc83d',
  init(sv) {
    const S = Object.assign({ gold: 0, run: 0, all: 0, clicks: 0, miners: {}, ups: {}, layer: 0, gems: {}, nug: 0, nugTotal: 0, shop: {}, restarts: 0, buyN: 1, gemAcc: 0, ach: {}, last: 0, tab: 'delf' }, sv || {});
    for (const k of ['miners', 'ups', 'gems', 'shop', 'ach']) if (!S[k] || typeof S[k] !== 'object') S[k] = {};
    return S;
  },
  snap: (S) => S.gold,
  welcome: (S, s0, away) => '⛏️ Terwijl je weg was (' + fmtT(away) + ') delfden je mijnwerkers ' + fmt(S.gold - s0) + ' goud!',
  tick(S, dt, ctx) {
    const g = perSec(S) * dt;
    S.gold += g; S.run += g; S.all += g;
    S.gemAcc += gemRate(S) * dt;
    let guard = 0;
    while (S.gemAcc >= 1 && guard++ < 5000) { S.gemAcc -= 1; const gm = findGem(S); if (dt < 5 && ctx) ctx.toast('Gevonden: ' + gm.e + ' ' + gm.n + '!'); }
    if (S.gemAcc > 1) S.gemAcc = 0;
  },
  header: (S) => pill('🪙 ' + fmt(S.gold)) + pill('⚙️ ' + fmt(perSec(S)) + '/s') + pill('🧭 ' + LAYERS[S.layer].e + ' ' + LAYERS[S.layer].n) + (S.nugTotal ? pill('🔩 ' + fmt(S.nug) + ' spijkers') : ''),
  tabs: [
    { id: 'delf', label: '⛏️ Delven', render(S, b) {
      const big = h('div', 'margin:10px auto;width:210px;height:210px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,#ffe27a,#c98a12 60%,#7a4c06);box-shadow:0 8px 30px #000a,inset 0 -8px 20px #0006;cursor:pointer;transition:transform .06s');
      big.appendChild(h('div', 'font-size:84px;line-height:1', LAYERS[S.layer].e));
      big.appendChild(h('div', 'font-size:14px;font-weight:700;margin-top:4px;text-shadow:0 1px 2px #000', '+' + fmt(perClick(S))));
      big.onpointerdown = () => { big.style.transform = 'scale(.94)'; };
      big.onpointerup = big.onpointerleave = () => { big.style.transform = ''; };
      big.onclick = () => {
        S.clicks++; const v = perClick(S); S.gold += v; S.run += v; S.all += v;
        if (Math.random() < 0.02 * (nug(S, 'gemx') ? 2 : 1) * (S.ups.gem1 ? 2 : 1)) { const gm = findGem(S); CTX.toast('Gevonden: ' + gm.e + ' ' + gm.n + '!'); }
        CTX.upd();
      };
      b.appendChild(big);
      note(b, 'Tik op de rots om goud te delven. Je zit in: ' + LAYERS[S.layer].n + ' (x' + fmt(LAYERS[S.layer].m) + ' opbrengst).');
      const cs = card(b);
      cs.appendChild(h('div', 'font-size:13px', '👆 Tikken: ' + fmt(S.clicks) + ' · 🏦 Totaal verdiend: ' + fmt(S.all) + ' · 🔁 Herstarts: ' + S.restarts));
      cs.appendChild(h('div', 'font-size:13px;margin-top:4px', '💎 Edelstenen gevonden: ' + fmt(gemTotal(S)) + ' (+' + (gemTotal(S) * 2) + '% goud)'));
    } },
    { id: 'mijn', label: '👷 Mijnwerkers', render(S, b) {
      const row = h('div', 'display:flex;gap:6px');
      for (const n of [1, 10, 100]) {
        const t = h('div', 'flex:1;text-align:center;padding:10px;border-radius:10px;font-weight:700;cursor:pointer;background:' + (S.buyN === n ? '#ffc83d;color:#201400' : '#00000050'), 'x' + n);
        t.onclick = () => { S.buyN = n; CTX.refresh(true); };
        row.appendChild(t);
      }
      b.appendChild(row);
      MINERS.forEach((m, i) => {
        const own = S.miners[m.id] || 0;
        if (i > 0 && !(S.miners[MINERS[i - 1].id] || S.gold >= m.c * 0.5 || own)) {
          const l = card(b, 'opacity:.5'); l.textContent = '🔒 ???'; return;
        }
        let n = S.buyN, tot = 0;
        for (let k = 0; k < n; k++) tot += cost(S, i, own + k);
        const q = 1 * (() => { let z = 1; for (const u of minerUps(m.id)) if (S.ups[u.id]) z *= u.m; return z; })();
        btn(b, m.e + ' ' + m.n + ' · ' + own + ' stuks', '+' + fmt(m.p * q * mult(S)) + '/s elk\n' + '🪙 ' + fmt(tot), () => {
          if (S.gold >= tot) { S.gold -= tot; S.miners[m.id] = own + n; }
        }, S.gold >= tot);
      });
    } },
    { id: 'upg', label: '🛠️ Upgrades', render(S, b) {
      let any = false;
      sec(b, 'Tik-upgrades');
      const nextC = CLICKUP.find((u) => !S.ups[u.id]);
      if (nextC) { any = true; btn(b, '🖐️ ' + nextC.n, 'tikken x' + nextC.m + '\n🪙 ' + fmt(nextC.c), () => { if (S.gold >= nextC.c) { S.gold -= nextC.c; S.ups[nextC.id] = 1; } }, S.gold >= nextC.c); }
      const misc = [
        { id: 'fing', n: '🤝 Samenwerking', d: 'tik krijgt 2% van /s', c: 25000, ok: true },
        { id: 'gem1', n: '🔍 Loep', d: 'edelstenen 2x vaker', c: 8000, ok: true },
        { id: 'gem2', n: '🔦 Mijnlamp', d: 'edelstenen 2x vaker', c: 4e6, ok: S.ups.gem1 },
        { id: 'glob1', n: '📣 Betere sfeer', d: 'alle goud x1,5', c: 3e5, ok: true },
        { id: 'glob2', n: '🍺 Gratis bier', d: 'alle goud x2', c: 2e8, ok: S.ups.glob1 },
      ];
      sec(b, 'Algemeen');
      for (const u of misc) if (!S.ups[u.id] && u.ok) { any = true; btn(b, u.n, u.d + '\n🪙 ' + fmt(u.c), () => { if (S.gold >= u.c) { S.gold -= u.c; S.ups[u.id] = 1; } }, S.gold >= u.c); }
      sec(b, 'Mijnwerkers-upgrades');
      for (const m of MINERS) for (const u of minerUps(m.id)) {
        if (S.ups[u.id] || (S.miners[m.id] || 0) < u.need) continue;
        any = true;
        btn(b, m.e + ' ' + u.n, 'x' + u.m + ' (vanaf ' + u.need + ')\n🪙 ' + fmt(u.c), () => { if (S.gold >= u.c) { S.gold -= u.c; S.ups[u.id] = 1; } }, S.gold >= u.c);
      }
      if (!any) note(b, 'Geen upgrades beschikbaar. Koop meer mijnwerkers!');
    } },
    { id: 'lagen', label: '🧭 Lagen', render(S, b) {
      note(b, 'Graaf dieper voor een veel hogere opbrengst en zeldzamere edelstenen.');
      LAYERS.forEach((l, i) => {
        const cur = i === S.layer, done = i < S.layer, next = i === S.layer + 1;
        const c = card(b, 'display:flex;gap:10px;align-items:center;opacity:' + (done || cur || next ? 1 : 0.4) + (cur ? ';border-color:#ffc83d' : ''));
        c.appendChild(h('div', 'font-size:28px', l.e));
        const t = h('div', 'flex:1');
        t.appendChild(h('div', 'font-weight:700', l.n + (cur ? ' (hier)' : done ? ' ✓' : '')));
        t.appendChild(h('div', 'font-size:12px;opacity:.85', 'Opbrengst x' + fmt(l.m)));
        c.appendChild(t);
        if (next) {
          const ok = S.gold >= l.c;
          const bt = h('div', 'padding:10px 12px;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;background:' + (ok ? '#ffc83d;color:#201400' : '#00000060'), '🪙 ' + fmt(l.c));
          if (ok) bt.onclick = () => { S.gold -= l.c; S.layer = i; CTX.toast('Je graaft nu in: ' + l.n + '!'); CTX.upd(); CTX.refresh(true); CTX.save(); };
          c.appendChild(bt);
        }
      });
    } },
    { id: 'gems', label: '💎 Edelstenen', render(S, b) {
      note(b, 'Edelstenen vind je door te tikken en door je mijnwerkers. Elke steen geeft +2% goud. Heb je alle soorten, dan verdubbelt alles!');
      GEMS.forEach((g, i) => {
        const n = S.gems[g.id] || 0;
        const c = card(b, 'display:flex;align-items:center;gap:10px;opacity:' + (n ? 1 : 0.5));
        c.appendChild(h('div', 'font-size:28px', n ? g.e : '❔'));
        c.appendChild(h('div', 'flex:1;font-weight:700', n ? g.n : 'Onbekende steen'));
        c.appendChild(h('div', 'font-size:18px;font-weight:700', 'x' + fmt(n)));
      });
      const sc = card(b);
      sc.textContent = gemSet(S) ? '🌈 Volledige collectie! Alle goud x2.' : 'Verzamel alle ' + GEMS.length + ' soorten voor x2 bonus.';
      note(b, 'Vindkans per seconde: ' + (gemRate(S) * 100).toFixed(1).replace('.', ',') + '%');
    } },
    { id: 'herstart', label: '🔁 Herstart', render(S, b) {
      const p = pendingNug(S);
      const c = card(b);
      c.appendChild(h('div', 'font-weight:700;font-size:15px', 'Herstart met bonus'));
      c.appendChild(h('div', 'font-size:13px;margin:6px 0;opacity:.9', 'Begin opnieuw in de zandgrond. Je behoudt je edelstenen, prestaties en krijgt Gouden Spijkers: elk geeft +10% op alle goud, voor altijd.'));
      c.appendChild(h('div', 'font-size:13px', 'Deze run verdiend: ' + fmt(S.run) + ' · Spijkers die je nu krijgt: 🔩 ' + fmt(p)));
      btn(b, p > 0 ? '🔁 Herstart voor +' + p + ' spijker(s)' : '🔒 Nog niet genoeg (vanaf 2M goud in een run)', '', () => {
        if (p < 1) return;
        S.nug += p; S.nugTotal += p; S.restarts++;
        S.gold = nug(S, 'start') ? 5000 : 0; S.run = 0; S.miners = {}; S.ups = {}; S.layer = 0; S.gemAcc = 0;
        CTX.toast('Nieuwe start! +' + p + ' Gouden Spijkers');
      }, p > 0, 'linear-gradient(135deg,#d98a00,#a35c00)');
      sec(b, 'Spijkerwinkel (je hebt 🔩 ' + fmt(S.nug) + ')');
      for (const s of NUGSHOP) {
        if (S.shop[s.id]) { const k = card(b, 'opacity:.7'); k.textContent = '✅ ' + s.n + ' – ' + s.d; continue; }
        btn(b, s.n, s.d + '\n🔩 ' + s.c, () => { if (S.nug >= s.c) { S.nug -= s.c; S.shop[s.id] = 1; } }, S.nug >= s.c);
      }
    } },
  ],
  ach: [
    { id: 'a1', n: 'Eerste goud', d: 'Verdien 100 goud', t: (S) => S.all >= 100 },
    { id: 'a2', n: 'Rijkaard', d: 'Verdien 1M goud', t: (S) => S.all >= 1e6 },
    { id: 'a3', n: 'Miljardair', d: 'Verdien 1B goud', t: (S) => S.all >= 1e9 },
    { id: 'a4', n: 'Tikmeester', d: 'Tik 500 keer', t: (S) => S.clicks >= 500 },
    { id: 'a5', n: 'Tikkoning', d: 'Tik 5000 keer', t: (S) => S.clicks >= 5000 },
    { id: 'a6', n: 'Ploeg', d: 'Heb 25 mijnwerkers', t: (S) => Object.values(S.miners).reduce((a, b) => a + b, 0) >= 25 },
    { id: 'a7', n: 'Leger', d: 'Heb 150 mijnwerkers', t: (S) => Object.values(S.miners).reduce((a, b) => a + b, 0) >= 150 },
    { id: 'a8', n: 'Diepzwemmer', d: 'Bereik de Kopermijn', t: (S) => S.layer >= 3 },
    { id: 'a9', n: 'Naar de Kern', d: 'Bereik De Kern', t: (S) => S.layer >= 7 },
    { id: 'a10', n: 'Steentjesverzamelaar', d: 'Vind 10 edelstenen', t: (S) => gemTotal(S) >= 10 },
    { id: 'a11', n: 'Regenboog', d: 'Verzamel alle soorten edelstenen', t: (S) => gemSet(S) },
    { id: 'a12', n: 'Nieuw begin', d: 'Herstart voor het eerst', t: (S) => S.restarts >= 1 },
    { id: 'a13', n: 'Veteraan', d: 'Herstart 5 keer', t: (S) => S.restarts >= 5 },
    { id: 'a14', n: 'Draak getemd', d: 'Koop een Schatdraak', t: (S) => (S.miners.draak || 0) >= 1 },
  ],
  achNote: 'Elke prestatie geeft +5% op al je goud.',
};

export default {
  id: 'goudmijn', name: 'Goudmijn', emoji: '⛏️', desc: 'Delf goud, koop mijnwerkers, ontdek lagen en edelstenen.',
  async create(host, api) { return runGame(host, api, C); },
};
