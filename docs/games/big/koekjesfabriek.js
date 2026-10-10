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
const BLD = [
  { id: 'hand', n: 'Bakkershand', e: '🧑‍🍳', c: 15, p: 0.1 },
  { id: 'oma', n: 'Oma met oven', e: '👵', c: 100, p: 1 },
  { id: 'bakkerij', n: 'Bakkerij', e: '🥖', c: 1100, p: 8 },
  { id: 'fabriek', n: 'Koekjesfabriek', e: '🏭', c: 12000, p: 47 },
  { id: 'meelmolen', n: 'Meelmolen', e: '🌾', c: 130000, p: 260 },
  { id: 'chocolade', n: 'Chocoladerivier', e: '🍫', c: 1.4e6, p: 1400 },
  { id: 'suiker', n: 'Suikerplaneet', e: '🪐', c: 2e7, p: 7800 },
  { id: 'tijd', n: 'Koekjesmachine van de tijd', e: '⏳', c: 3.3e8, p: 44000 },
  { id: 'portaal', n: 'Koekjesdimensie', e: '🌀', c: 5.1e9, p: 260000 },
];
const RECIPES = [
  { n: 'Boterkoekje', e: '🧈', t: 1e3 },
  { n: 'Chocoladekoekje', e: '🍪', t: 1e4 },
  { n: 'Havermoutkoek', e: '🥣', t: 1e5 },
  { n: 'Stroopwafel', e: '🧇', t: 1e6 },
  { n: 'Speculaas', e: '🏠', t: 1e7 },
  { n: 'Macaron', e: '🍬', t: 1e8 },
  { n: 'Brownie', e: '🟫', t: 1e9 },
  { n: 'IJskoekje', e: '🍦', t: 1e10 },
  { n: 'Regenboogkoek', e: '🌈', t: 1e11 },
  { n: 'Sterrenkoekje', e: '⭐', t: 1e12 },
];
function bUps(id) {
  const b = BLD.find((x) => x.id === id);
  return [
    { id: id + '1', n: b.n + ' verbeterd', c: b.c * 10, need: 1, m: 2 },
    { id: id + '2', n: b.n + ' plus', c: b.c * 100, need: 10, m: 2 },
    { id: id + '3', n: b.n + ' deluxe', c: b.c * 5000, need: 30, m: 2 },
    { id: id + '4', n: b.n + ' legendarisch', c: b.c * 400000, need: 60, m: 3 },
  ];
}
const bcost = (i, own) => Math.ceil(BLD[i].c * Math.pow(1.15, own));
function buff(S, t) { return S.buffs.find((b) => b.t === t); }
function recipeBonus(S) { return 1 + 0.03 * RECIPES.filter((r) => S.total >= r.t).length; }
function cps(S) {
  let t = 0;
  for (const b of BLD) {
    let q = 1;
    for (const u of bUps(b.id)) if (S.ups[u.id]) q *= u.m;
    t += (S.b[b.id] || 0) * b.p * q;
  }
  let m = recipeBonus(S) * (1 + 0.05 * achN(S)) * (1 + 0.02 * S.hemel);
  if (S.ups.g1) m *= 1.25;
  if (S.ups.g2) m *= 1.5;
  if (buff(S, 'frenzy')) m *= 7;
  return t * m;
}
function perClick(S) {
  let c = 1;
  for (const k of ['k1', 'k2', 'k3', 'k4']) if (S.ups[k]) c *= 2;
  c += cps(S) * (S.ups.vinger ? 0.03 : 0);
  if (buff(S, 'click')) c *= 15;
  return c * recipeBonus(S) * (1 + 0.02 * S.hemel);
}
let gold = null, goldTimer = 20, goldCb = null;
function spawnGolden(S, ctx) {
  if (gold || !ctx || !ctx.over) return;
  const rare = Math.random() < 0.1;
  const el = h('div', 'position:absolute;pointer-events:auto;cursor:pointer;font-size:' + (rare ? 52 : 46) + 'px;line-height:1;left:' + rnd(8, 72).toFixed(0) + '%;top:' + rnd(160, 460).toFixed(0) + 'px;filter:drop-shadow(0 0 12px gold);animation:kfpop 0.5s ease-out;transition:transform .2s', rare ? '🌟' : '🍪');
  if (!rare) el.style.filter = 'drop-shadow(0 0 14px #ffd700) hue-rotate(10deg) saturate(2) brightness(1.4)';
  el.onclick = () => {
    if (!gold) return;
    el.remove(); gold = null; S.goldClicks++;
    const r = Math.random();
    if (r < 0.4) { S.buffs.push({ t: 'frenzy', left: 30 }); ctx.toast('🔥 Bakwoede! Productie x7 voor 30 seconden'); }
    else if (r < 0.7) { const g = Math.min(cps(S) * 900, S.cookies * 0.15) + 13; S.cookies += g; S.total += g; ctx.toast('🍀 Geluksvogel! +' + fmt(g) + ' koekjes'); }
    else if (r < 0.9) { S.buffs.push({ t: 'click', left: 15 }); ctx.toast('👆 Tikgekte! Tikken x15 voor 15 seconden'); }
    else { const g = cps(S) * 60 * 5 + 777; S.cookies += g; S.total += g; ctx.toast('🎁 Jackpot! +' + fmt(g) + ' koekjes'); }
    ctx.upd(); ctx.save();
  };
  ctx.over.appendChild(el);
  gold = { el, left: rare ? 8 : 12 };
}

const C = {
  bg: 'linear-gradient(180deg,#5b2e1a,#8a4b2a 45%,#3b1d10)',
  head: '#3a1a0ce8',
  accent: '#ffb347',
  init(sv) {
    const S = Object.assign({ cookies: 0, total: 0, all: 0, clicks: 0, b: {}, ups: {}, buffs: [], goldClicks: 0, hemel: 0, hemelTotal: 0, resets: 0, buyN: 1, ach: {}, last: 0, tab: 'bak' }, sv || {});
    for (const k of ['b', 'ups', 'ach']) if (!S[k] || typeof S[k] !== 'object') S[k] = {};
    if (!Array.isArray(S.buffs)) S.buffs = [];
    return S;
  },
  start(S, ctx) {
    if (!document.getElementById('kfstyle')) {
      const st = document.createElement('style'); st.id = 'kfstyle';
      st.textContent = '@keyframes kfpop{from{transform:scale(0)}to{transform:scale(1)}}@keyframes kfwob{0%{transform:scale(1)}50%{transform:scale(.93)}100%{transform:scale(1)}}';
      document.head.appendChild(st);
    }
    gold = null; goldTimer = 15;
  },
  stop() { if (gold && gold.el) gold.el.remove(); gold = null; },
  snap: (S) => S.cookies,
  welcome: (S, s0, away) => '🍪 Terwijl je weg was (' + fmtT(away) + ') bakte de fabriek ' + fmt(S.cookies - s0) + ' koekjes!',
  offline(S, away) {
    const g = cps({ ...S, buffs: [] }) * away * 0.9;
    S.cookies += g; S.total += g; S.all += g; S.buffs = [];
  },
  tick(S, dt, ctx) {
    const g = cps(S) * dt;
    S.cookies += g; S.total += g; S.all += g;
    for (const b of S.buffs) b.left -= dt;
    S.buffs = S.buffs.filter((b) => b.left > 0);
    if (gold) { gold.left -= dt; if (gold.left <= 0) { gold.el.remove(); gold = null; } }
    else if (ctx && ctx.over) { goldTimer -= dt; if (goldTimer <= 0) { spawnGolden(S, ctx); goldTimer = rnd(45, 110); } }
  },
  header: (S) => pill('🍪 ' + fmt(S.cookies)) + pill('⚙️ ' + fmt(cps(S)) + '/s') + S.buffs.map((b) => pill((b.t === 'frenzy' ? '🔥 woede' : '👆 tikgekte') + ' ' + Math.ceil(b.left) + 's')).join('') + (S.hemel ? pill('☁️ ' + S.hemel) : ''),
  tabs: [
    { id: 'bak', label: '🍪 Bakken', render(S, b) {
      const big = h('div', 'margin:14px auto 6px;width:220px;height:220px;display:flex;align-items:center;justify-content:center;font-size:170px;line-height:1;cursor:pointer;filter:drop-shadow(0 10px 18px #000a);transition:transform .08s', '🍪');
      big.onpointerdown = () => { big.style.transform = 'scale(.9)'; };
      big.onpointerup = big.onpointerleave = () => { big.style.transform = ''; };
      big.onclick = () => { const v = perClick(S); S.cookies += v; S.total += v; S.all += v; S.clicks++; CTX.upd(); };
      b.appendChild(big);
      b.appendChild(h('div', 'text-align:center;font-size:13px;opacity:.9', '+' + fmt(perClick(S)) + ' per tik'));
      note(b, 'Let op: af en toe verschijnt er een gouden koekje. Tik er snel op voor een bonus!');
      const c = card(b);
      c.appendChild(h('div', 'font-size:13px', 'Totaal gebakken: ' + fmt(S.total) + ' · Tikken: ' + fmt(S.clicks)));
      c.appendChild(h('div', 'font-size:13px;margin-top:3px', '🌟 Gouden koekjes: ' + S.goldClicks));
      const nx = RECIPES.find((r) => S.total < r.t);
      if (nx) { bar(b, S.total / nx.t, '#ffb347', 'Volgend recept: ' + nx.e + ' ' + nx.n); }
    } },
    { id: 'geb', label: '🏭 Gebouwen', render(S, b) {
      const row = h('div', 'display:flex;gap:6px');
      for (const n of [1, 10, 100]) {
        const t = h('div', 'flex:1;text-align:center;padding:10px;border-radius:10px;font-weight:700;cursor:pointer;background:' + (S.buyN === n ? '#ffb347;color:#2a1300' : '#00000050'), 'x' + n);
        t.onclick = () => { S.buyN = n; CTX.refresh(true); };
        row.appendChild(t);
      }
      b.appendChild(row);
      BLD.forEach((x, i) => {
        const own = S.b[x.id] || 0;
        if (i > 1 && !own && S.total < x.c * 0.4 && !(S.b[BLD[i - 1].id])) { card(b, 'opacity:.45').textContent = '🔒 ???'; return; }
        let tot = 0;
        for (let k = 0; k < S.buyN; k++) tot += bcost(i, own + k);
        let q = 1; for (const u of bUps(x.id)) if (S.ups[u.id]) q *= u.m;
        btn(b, x.e + ' ' + x.n + ' · ' + own, '+' + fmt(x.p * q) + '/s elk\n🍪 ' + fmt(tot), () => { if (S.cookies >= tot) { S.cookies -= tot; S.b[x.id] = own + S.buyN; } }, S.cookies >= tot);
      });
    } },
    { id: 'upg', label: '🛠️ Upgrades', render(S, b) {
      let any = false;
      sec(b, 'Algemeen');
      const gl = [
        { id: 'k1', n: '👆 Sterke vingers', d: 'tikken x2', c: 100, ok: true },
        { id: 'k2', n: '👆 Deegvingers', d: 'tikken x2', c: 1000, ok: S.ups.k1 },
        { id: 'k3', n: '👆 Gouden vingers', d: 'tikken x2', c: 50000, ok: S.ups.k2 },
        { id: 'k4', n: '👆 Diamanten vingers', d: 'tikken x2', c: 5e6, ok: S.ups.k3 },
        { id: 'vinger', n: '🤲 Meebakkende hand', d: 'tik + 3% van /s', c: 15000, ok: true },
        { id: 'g1', n: '🧂 Geheime ingredient', d: 'alles x1,25', c: 5e5, ok: true },
        { id: 'g2', n: '📻 Muziek in de fabriek', d: 'alles x1,5', c: 5e7, ok: S.ups.g1 },
      ];
      for (const u of gl) if (!S.ups[u.id] && u.ok) { any = true; btn(b, u.n, u.d + '\n🍪 ' + fmt(u.c), () => { if (S.cookies >= u.c) { S.cookies -= u.c; S.ups[u.id] = 1; } }, S.cookies >= u.c); }
      sec(b, 'Gebouwen');
      for (const x of BLD) for (const u of bUps(x.id)) {
        if (S.ups[u.id] || (S.b[x.id] || 0) < u.need) continue;
        any = true;
        btn(b, x.e + ' ' + u.n, 'x' + u.m + ' (vanaf ' + u.need + ')\n🍪 ' + fmt(u.c), () => { if (S.cookies >= u.c) { S.cookies -= u.c; S.ups[u.id] = 1; } }, S.cookies >= u.c);
      }
      if (!any) note(b, 'Geen upgrades beschikbaar. Bouw meer gebouwen!');
    } },
    { id: 'rec', label: '📖 Recepten', render(S, b) {
      note(b, 'Elk nieuw recept (door het totaal aantal gebakken koekjes) geeft +3% op alles. Nu: x' + recipeBonus(S).toFixed(2).replace('.', ','));
      for (const r of RECIPES) {
        const got = S.total >= r.t;
        const c = card(b, 'display:flex;align-items:center;gap:10px;opacity:' + (got ? 1 : 0.5));
        c.appendChild(h('div', 'font-size:28px', got ? r.e : '❔'));
        const t = h('div', 'flex:1');
        t.appendChild(h('div', 'font-weight:700', got ? r.n : 'Geheim recept'));
        t.appendChild(h('div', 'font-size:12px;opacity:.85', got ? 'Ontgrendeld' : 'Bak ' + fmt(r.t) + ' koekjes in totaal'));
        c.appendChild(t);
      }
    } },
    { id: 'hemel', label: '☁️ Hemel', render(S, b) {
      const p = Math.floor(Math.sqrt(S.total / 1e9));
      const gain = p;
      const c = card(b);
      c.appendChild(h('div', 'font-weight:700;font-size:15px', 'Hemelse koekjes'));
      c.appendChild(h('div', 'font-size:13px;margin:6px 0', 'Laat alles achter en begin opnieuw. Elke hemelse chip geeft +2% productie en tikkracht, voor altijd. Totaal gebakken in deze run telt mee (vanaf 1B).'));
      c.appendChild(h('div', 'font-size:13px', 'Chips nu: ' + S.hemel + ' · Bij herstarten erbij: ' + gain));
      btn(b, gain > 0 ? '☁️ Herstart voor +' + gain + ' chips' : '🔒 Nog niet genoeg koekjes (vanaf 1B totaal)', '', () => {
        if (gain < 1) return;
        S.hemel += gain; S.hemelTotal += gain; S.resets++;
        S.cookies = 0; S.total = 0; S.b = {}; S.ups = {}; S.buffs = [];
        CTX.toast('☁️ Nieuwe start met +' + gain + ' hemelse chips');
      }, gain > 0, 'linear-gradient(135deg,#5aa0ff,#2d5fb0)');
    } },
  ],
  ach: [
    { id: 'a1', n: 'Eerste koekje', d: 'Bak 1 koekje', t: (S) => S.total >= 1 },
    { id: 'a2', n: 'Trommel vol', d: 'Bak 1000 koekjes', t: (S) => S.total >= 1000 },
    { id: 'a3', n: 'Koekjesmiljonair', d: 'Bak 1M koekjes', t: (S) => S.total >= 1e6 },
    { id: 'a4', n: 'Koekjesmiljardair', d: 'Bak 1B koekjes', t: (S) => S.total >= 1e9 },
    { id: 'a5', n: 'Klikker', d: 'Tik 1000 keer', t: (S) => S.clicks >= 1000 },
    { id: 'a6', n: 'Goudzoeker', d: 'Pak 1 gouden koekje', t: (S) => S.goldClicks >= 1 },
    { id: 'a7', n: 'Goudkoorts', d: 'Pak 15 gouden koekjes', t: (S) => S.goldClicks >= 15 },
    { id: 'a8', n: 'Bouwvakker', d: 'Heb 50 gebouwen', t: (S) => Object.values(S.b).reduce((a, c) => a + c, 0) >= 50 },
    { id: 'a9', n: 'Imperium', d: 'Heb 250 gebouwen', t: (S) => Object.values(S.b).reduce((a, c) => a + c, 0) >= 250 },
    { id: 'a10', n: 'Receptenboek', d: 'Ontgrendel 5 recepten', t: (S) => S.total >= 1e5 * 100 },
    { id: 'a11', n: 'Hemelpoort', d: 'Herstart naar de hemel', t: (S) => S.resets >= 1 },
    { id: 'a12', n: 'Tijdreiziger', d: 'Koop een tijdmachine', t: (S) => (S.b.tijd || 0) >= 1 },
  ],
  achNote: 'Elke prestatie geeft +5% productie.',
};

export default {
  id: 'koekjesfabriek', name: 'Koekjesfabriek', emoji: '🍪', desc: 'Bak koekjes, bouw een fabriek en vang gouden koekjes.',
  async create(host, api) { return runGame(host, api, C); },
};
