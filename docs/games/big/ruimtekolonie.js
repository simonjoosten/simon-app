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
const PL = [
  { id: 'aarde', n: 'Aarde (basis)', e: '🌍', m: 1, f: 1, s: 1, sol: 1, c: null, t: 0 },
  { id: 'maan', n: 'Maan', e: '🌙', m: 1.6, f: 0.6, s: 0.7, sol: 1.3, c: { metal: 150, fuel: 60 }, t: 60 },
  { id: 'mars', n: 'Mars', e: '🔴', m: 1.2, f: 1.6, s: 1.2, sol: 0.6, c: { metal: 600, fuel: 300 }, t: 240 },
  { id: 'ceres', n: 'Ceres', e: '☄️', m: 3.5, f: 1, s: 0.8, sol: 0.3, c: { metal: 3000, fuel: 1500 }, t: 600 },
  { id: 'europa', n: 'Europa', e: '🧊', m: 1, f: 2.5, s: 3, sol: 0.12, c: { metal: 15000, fuel: 9000 }, t: 1500 },
  { id: 'titan', n: 'Titan', e: '🪐', m: 2, f: 5, s: 2, sol: 0.06, c: { metal: 80000, fuel: 50000 }, t: 3600 },
  { id: 'exo', n: 'Nieuwe Aarde', e: '🌌', m: 4, f: 4, s: 6, sol: 1, c: { metal: 5e5, fuel: 3e5 }, t: 7200, tech: 't_warp' },
];
const MOD = [
  { id: 'mijn', n: 'Mijn', e: '⛏️', d: '+1 metaal/s', c: { metal: 30 }, en: -2 },
  { id: 'raf', n: 'Raffinaderij', e: '🛢️', d: '+0,6 brandstof/s', c: { metal: 50 }, en: -3 },
  { id: 'lab', n: 'Laboratorium', e: '🔬', d: '+0,25 wetenschap/s', c: { metal: 120, fuel: 20 }, en: -3 },
  { id: 'zon', n: 'Zonnepaneel', e: '☀️', d: '+5 energie (x zonkracht)', c: { metal: 25 }, en: 5 },
  { id: 'reactor', n: 'Fusiereactor', e: '⚛️', d: '+30 energie', c: { metal: 500, fuel: 200 }, en: 30, tech: 't_fusie' },
];
const TECH = [
  { id: 't_boor', n: 'Diepboren', e: '⛏️', c: 20, req: [], d: 'Metaal +50%' },
  { id: 't_zon', n: 'Betere zonnecellen', e: '☀️', c: 80, req: [], d: 'Zonne-energie +50%' },
  { id: 't_mot1', n: 'Raketmotor I', e: '🚀', c: 40, req: [], d: 'Reistijd -25%, +5% succes' },
  { id: 't_raf', n: 'Efficiënt raffineren', e: '🛢️', c: 60, req: ['t_boor'], d: 'Brandstof +50%' },
  { id: 't_pilot', n: 'Autopilot', e: '🤖', c: 150, req: ['t_mot1'], d: 'Raketten 30% goedkoper, +5% succes' },
  { id: 't_mot2', n: 'Raketmotor II', e: '🚀', c: 400, req: ['t_mot1'], d: 'Reistijd -25%, +5% succes' },
  { id: 't_ai', n: 'Kunstmatige intelligentie', e: '🧠', c: 500, req: ['t_boor'], d: 'Wetenschap +100%' },
  { id: 't_fusie', n: 'Fusie-energie', e: '⚛️', c: 1500, req: ['t_zon'], d: 'Ontgrendelt de Fusiereactor' },
  { id: 't_nano', n: 'Nanobots', e: '🔬', c: 1500, req: ['t_pilot'], d: 'Modules 25% goedkoper' },
  { id: 't_terra', n: 'Terraforming', e: '🌱', c: 4000, req: ['t_fusie', 't_ai'], d: 'Alle productie +50%' },
  { id: 't_warp', n: 'Warpmotor', e: '🌌', c: 10000, req: ['t_mot2', 't_terra'], d: 'Ontgrendelt Nieuwe Aarde' },
];
const has = (S, id) => !!S.tech[id];
const RES = { metal: '🔩', fuel: '⛽', sci: '🔬' };
function costStr(c) { return Object.keys(c).map((k) => RES[k] + fmt(c[k])).join(' '); }
function canPay(S, c) { return Object.keys(c).every((k) => S.res[k] >= c[k]); }
function pay(S, c) { for (const k in c) S.res[k] -= c[k]; }
function modCount(S, pid, mid) { return (S.pl[pid] && S.pl[pid][mid]) || 0; }
function modCost(S, pid, m) {
  const idx = PL.findIndex((p) => p.id === pid);
  const n = modCount(S, pid, m.id);
  const f = Math.pow(1.16, n) * (1 + idx * 2.5) * (has(S, 't_nano') ? 0.75 : 1);
  const c = {};
  for (const k in m.c) c[k] = Math.ceil(m.c[k] * f);
  return c;
}
function plan(S, pid) {
  const p = PL.find((x) => x.id === pid);
  const g = (m) => modCount(S, pid, m);
  const eP = (g('zon') * 5 * p.sol * (has(S, 't_zon') ? 1.5 : 1) + g('reactor') * 30);
  const eC = g('mijn') * 2 + g('raf') * 3 + g('lab') * 3;
  const eff = eC > 0 ? Math.min(1, eP / eC) : 1;
  const all = (has(S, 't_terra') ? 1.5 : 1) * (1 + 0.04 * achN(S));
  return {
    eP, eC, eff,
    metal: g('mijn') * 1 * p.m * eff * (has(S, 't_boor') ? 1.5 : 1) * all,
    fuel: g('raf') * 0.6 * p.f * eff * (has(S, 't_raf') ? 1.5 : 1) * all,
    sci: g('lab') * 0.25 * p.s * eff * (has(S, 't_ai') ? 2 : 1) * all,
  };
}
const travelMult = (S) => (has(S, 't_mot1') ? 0.75 : 1) * (has(S, 't_mot2') ? 0.75 : 1);
const success = (S) => Math.min(0.99, 0.85 + (has(S, 't_mot1') ? 0.05 : 0) + (has(S, 't_mot2') ? 0.05 : 0) + (has(S, 't_pilot') ? 0.05 : 0));
function rocketCost(S) { const f = Math.pow(1.5, S.rockets) * (has(S, 't_pilot') ? 0.7 : 1); return { metal: Math.ceil(100 * f), fuel: Math.ceil(40 * f) }; }
function totals(S) {
  const t = { metal: 0, fuel: 0, sci: 0 };
  for (const p of PL) if (S.un[p.id]) { const q = plan(S, p.id); t.metal += q.metal; t.fuel += q.fuel; t.sci += q.sci; }
  return t;
}
function finish(S, ms) {
  const p = PL.find((x) => x.id === ms.pid);
  if (ms.type === 'exp') {
    if (Math.random() < success(S)) { S.un[ms.pid] = 1; if (!S.pl[ms.pid]) S.pl[ms.pid] = {}; S.landed++; CTX.toast(p.e + ' Kolonie gesticht op ' + p.n + '!'); }
    else { S.rockets = Math.max(0, S.rockets - 1); S.crashes++; CTX.toast('💥 De raket naar ' + p.n + ' is verloren gegaan. Bouw een nieuwe!'); }
  } else {
    const q = plan(S, ms.pid);
    const g = { metal: q.metal * 150, fuel: q.fuel * 150, sci: q.sci * 150 };
    for (const k in g) S.res[k] += g[k];
    S.cargo++; CTX.toast('📦 Lading van ' + p.n + ': ' + RES.metal + fmt(g.metal) + ' ' + RES.fuel + fmt(g.fuel) + ' ' + RES.sci + fmt(g.sci));
  }
}

const C = {
  bg: 'radial-gradient(circle at 20% 10%,#2a1f5c,#0e0a26 60%,#05030f)',
  head: '#0a0720e8',
  accent: '#7be3ff',
  init(sv) {
    const S = Object.assign({ res: { metal: 90, fuel: 0, sci: 0 }, un: { aarde: 1 }, pl: { aarde: { mijn: 1, zon: 1 } }, tech: {}, rockets: 0, missions: [], sel: 'aarde', landed: 0, cargo: 0, crashes: 0, scans: 0, total: 0, ach: {}, last: 0, tab: 'basis' }, sv || {});
    S.res = Object.assign({ metal: 0, fuel: 0, sci: 0 }, S.res || {});
    for (const k of ['un', 'pl', 'tech', 'ach']) if (!S[k] || typeof S[k] !== 'object') S[k] = {};
    if (!Array.isArray(S.missions)) S.missions = [];
    return S;
  },
  snap: (S) => S.res.metal + S.res.fuel + S.res.sci,
  welcome: (S, s0, away) => '🚀 Terwijl je weg was (' + fmtT(away) + ') verzamelde je kolonie ' + fmt(S.res.metal + S.res.fuel + S.res.sci - s0) + ' grondstoffen.',
  tick(S, dt) {
    const t = totals(S);
    S.res.metal += t.metal * dt; S.res.fuel += t.fuel * dt; S.res.sci += t.sci * dt;
    S.total += (t.metal + t.fuel + t.sci) * dt;
    const now = Date.now();
    const done = S.missions.filter((m) => now >= m.t0 + m.dur * 1000);
    if (done.length) {
      S.missions = S.missions.filter((m) => now < m.t0 + m.dur * 1000);
      for (const m of done) finish(S, m);
      CTX.refresh();
    }
  },
  header(S) {
    const t = totals(S);
    return pill('🔩 ' + fmt(S.res.metal) + ' (+' + fmt(t.metal) + ')') + pill('⛽ ' + fmt(S.res.fuel) + ' (+' + fmt(t.fuel) + ')') + pill('🔬 ' + fmt(S.res.sci) + ' (+' + fmt(t.sci) + ')') + pill('🚀 ' + (S.rockets - S.missions.length) + '/' + S.rockets);
  },
  tabs: [
    { id: 'basis', label: '🛰️ Basis', render(S, b) {
      const t = totals(S);
      const big = h('div', 'margin:8px auto;width:150px;height:150px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,#6ad,#136 70%);box-shadow:0 0 40px #4ae6;cursor:pointer;transition:transform .06s');
      big.appendChild(h('div', 'font-size:60px;line-height:1', '📡'));
      big.appendChild(h('div', 'font-size:12px;font-weight:700;margin-top:4px', 'Scan: +' + fmt(2 + modCount(S, 'aarde', 'mijn') * 2) + ' 🔩'));
      big.onpointerdown = () => { big.style.transform = 'scale(.93)'; };
      big.onpointerup = big.onpointerleave = () => { big.style.transform = ''; };
      big.onclick = () => { const v = 2 + modCount(S, 'aarde', 'mijn') * 2; S.res.metal += v; S.scans++; if (Math.random() < 0.05) { S.res.sci += 1 + S.landed; CTX.toast('🛸 Signaal ontdekt! +' + (1 + S.landed) + ' 🔬'); } CTX.upd(); };
      b.appendChild(big);
      note(b, 'Tik op de scanner voor extra metaal. Bouw mijnen en zonnepanelen op Aarde, en stuur raketten naar andere planeten.');
      sec(b, 'Koloniën');
      for (const p of PL) {
        if (!S.un[p.id]) continue;
        const q = plan(S, p.id);
        const c = card(b, 'display:flex;gap:10px;align-items:center');
        c.appendChild(h('div', 'font-size:30px', p.e));
        const x = h('div', 'flex:1');
        x.appendChild(h('div', 'font-weight:700', p.n));
        x.appendChild(h('div', 'font-size:12px;opacity:.9', '🔩' + fmt(q.metal) + ' ⛽' + fmt(q.fuel) + ' 🔬' + fmt(q.sci) + ' per s · ⚡ ' + Math.round(q.eff * 100) + '%'));
        c.appendChild(x);
      }
      if (S.missions.length) { sec(b, 'Onderweg'); for (const m of S.missions) { const p = PL.find((x) => x.id === m.pid); const left = (m.t0 + m.dur * 1000 - Date.now()) / 1000; bar(b, 1 - left / m.dur, '#7be3ff', '🚀 ' + (m.type === 'exp' ? 'Expeditie ' : 'Lading ') + p.e + ' ' + fmtT(left)); } }
    } },
    { id: 'planeten', label: '🪐 Planeten', render(S, b) {
      const chips = h('div', 'display:flex;gap:6px;overflow-x:auto;padding:2px 0 6px');
      for (const p of PL) {
        const un = S.un[p.id];
        const x = h('div', 'flex:0 0 auto;min-width:58px;padding:8px;border-radius:12px;text-align:center;font-size:11px;cursor:pointer;border:2px solid ' + (S.sel === p.id ? '#7be3ff' : 'transparent') + ';background:#00000050;opacity:' + (un ? 1 : 0.4));
        x.appendChild(h('div', 'font-size:26px', un ? p.e : '🔒'));
        x.appendChild(h('div', '', p.n.split(' ')[0]));
        if (un) x.onclick = () => { S.sel = p.id; CTX.refresh(true); };
        chips.appendChild(x);
      }
      b.appendChild(chips);
      const p = PL.find((x) => x.id === S.sel && S.un[x.id]) || PL[0];
      const q = plan(S, p.id);
      const c = card(b);
      c.appendChild(h('div', 'font-weight:700;font-size:16px', p.e + ' ' + p.n));
      c.appendChild(h('div', 'font-size:12px;opacity:.9;margin:4px 0', 'Rijkdom: metaal x' + p.m + ' · brandstof x' + p.f + ' · wetenschap x' + p.s + ' · zon x' + p.sol));
      bar(c, q.eC ? Math.min(1, q.eP / q.eC) : 1, q.eff >= 1 ? '#7ddc5a' : '#ff6b5a', '⚡ ' + fmt(q.eP) + ' / ' + fmt(q.eC) + ' energie');
      if (q.eff < 1) note(c, '⚠️ Energietekort! Productie draait op ' + Math.round(q.eff * 100) + '%. Bouw zonnepanelen.');
      for (const m of MOD) {
        if (m.tech && !has(S, m.tech)) { card(b, 'opacity:.45').textContent = '🔒 ' + m.e + ' ' + m.n + ' (onderzoek nodig)'; continue; }
        const cost = modCost(S, p.id, m);
        btn(b, m.e + ' ' + m.n + ' · ' + modCount(S, p.id, m.id), m.d + '\n' + costStr(cost), () => {
          if (canPay(S, cost)) { pay(S, cost); if (!S.pl[p.id]) S.pl[p.id] = {}; S.pl[p.id][m.id] = modCount(S, p.id, m.id) + 1; }
        }, canPay(S, cost));
      }
    } },
    { id: 'raket', label: '🚀 Raketten', render(S, b) {
      const free = S.rockets - S.missions.length;
      const rc = rocketCost(S);
      btn(b, '🚀 Bouw een raket (' + S.rockets + ')', costStr(rc), () => { if (canPay(S, rc)) { pay(S, rc); S.rockets++; } }, canPay(S, rc), 'linear-gradient(135deg,#7a4ae8,#4a2aa8)');
      note(b, 'Vrije raketten: ' + free + ' · Slagingskans expeditie: ' + Math.round(success(S) * 100) + '% · Reistijd x' + travelMult(S).toFixed(2).replace('.', ','));
      sec(b, 'Expedities (nieuwe kolonies)');
      for (const p of PL) {
        if (!p.c || S.un[p.id]) continue;
        if (p.tech && !has(S, p.tech)) { card(b, 'opacity:.45').textContent = '🔒 ' + p.e + ' ' + p.n + ' (onderzoek Warpmotor)'; continue; }
        if (S.missions.some((m) => m.type === 'exp' && m.pid === p.id)) continue;
        const dur = Math.ceil(p.t * travelMult(S));
        btn(b, p.e + ' Naar ' + p.n, fmtT(dur) + '\n' + costStr(p.c), () => {
          if (free < 1 || !canPay(S, p.c)) return;
          pay(S, p.c); S.missions.push({ type: 'exp', pid: p.id, t0: Date.now(), dur });
        }, free >= 1 && canPay(S, p.c));
      }
      sec(b, 'Vrachtvluchten');
      note(b, 'Haal 150 seconden aan productie op van een kolonie.');
      for (const p of PL) {
        if (!S.un[p.id] || p.id === 'aarde') continue;
        const dur = Math.max(30, Math.ceil(p.t * 0.5 * travelMult(S)));
        const q = plan(S, p.id);
        btn(b, p.e + ' Lading van ' + p.n, fmtT(dur) + '\n🔩' + fmt(q.metal * 150) + ' ⛽' + fmt(q.fuel * 150) + ' 🔬' + fmt(q.sci * 150), () => {
          if (free < 1) return;
          S.missions.push({ type: 'cargo', pid: p.id, t0: Date.now(), dur });
        }, free >= 1);
      }
      if (S.missions.length) {
        sec(b, 'Onderweg');
        for (const m of S.missions) { const p = PL.find((x) => x.id === m.pid); const left = (m.t0 + m.dur * 1000 - Date.now()) / 1000; bar(b, 1 - left / m.dur, '#7be3ff', (m.type === 'exp' ? '🚀 Expeditie ' : '📦 Lading ') + p.e + ' ' + fmtT(left)); }
      }
    } },
    { id: 'tech', label: '🔬 Technologie', render(S, b) {
      note(b, 'Onderzoek kost wetenschap 🔬. Sommige onderzoeken vereisen eerst een ander.');
      for (const t of TECH) {
        const done = has(S, t.id);
        const open = t.req.every((r) => has(S, r));
        if (done) { card(b, 'opacity:.7').textContent = '✅ ' + t.e + ' ' + t.n + ' – ' + t.d; continue; }
        if (!open) { const rq = t.req.filter((r) => !has(S, r)).map((r) => TECH.find((x) => x.id === r).n).join(', '); card(b, 'opacity:.45').textContent = '🔒 ' + t.n + ' (eerst: ' + rq + ')'; continue; }
        btn(b, t.e + ' ' + t.n, t.d + '\n🔬 ' + fmt(t.c), () => { if (S.res.sci >= t.c) { S.res.sci -= t.c; S.tech[t.id] = 1; CTX.toast('Onderzocht: ' + t.n); } }, S.res.sci >= t.c);
      }
    } },
  ],
  ach: [
    { id: 'a1', n: 'Eerste mijn', d: 'Heb 5 modules op Aarde', t: (S) => Object.values(S.pl.aarde || {}).reduce((a, b) => a + b, 0) >= 5 },
    { id: 'a2', n: 'Lanceerbasis', d: 'Bouw je eerste raket', t: (S) => S.rockets >= 1 },
    { id: 'a3', n: 'Maanlanding', d: 'Kolonie op de Maan', t: (S) => !!S.un.maan },
    { id: 'a4', n: 'Marsbewoner', d: 'Kolonie op Mars', t: (S) => !!S.un.mars },
    { id: 'a5', n: 'Buitenste planeten', d: 'Kolonie op Titan', t: (S) => !!S.un.titan },
    { id: 'a6', n: 'Nieuwe Aarde', d: 'Vestig je op Nieuwe Aarde', t: (S) => !!S.un.exo },
    { id: 'a7', n: 'Geleerde', d: 'Onderzoek 5 technologieën', t: (S) => Object.keys(S.tech).length >= 5 },
    { id: 'a8', n: 'Alwetend', d: 'Onderzoek alle technologieën', t: (S) => Object.keys(S.tech).length >= TECH.length },
    { id: 'a9', n: 'Vrachtvaarder', d: 'Voltooi 10 vrachtvluchten', t: (S) => S.cargo >= 10 },
    { id: 'a10', n: 'Pechvogel', d: 'Verlies een raket', t: (S) => S.crashes >= 1 },
    { id: 'a11', n: 'Grondstoffenbaron', d: 'Verzamel 1M grondstoffen', t: (S) => S.total >= 1e6 },
  ],
  achNote: 'Elke prestatie geeft +4% op alle productie.',
};

export default {
  id: 'ruimtekolonie', name: 'Ruimtekolonie', emoji: '🚀', desc: 'Kolonialiseer planeten, bouw raketten en onderzoek de technologieboom.',
  async create(host, api) { return runGame(host, api, C); },
};
