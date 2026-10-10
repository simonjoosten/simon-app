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
const W = 7, H = 8;
const B = {
  huis: { n: 'Huis', e: '🏠', c: { coins: 30, wood: 5 }, cap: 4, u: 0, d: '+4 inwoners' },
  boom: { n: 'Houthakker', e: '🪓', c: { coins: 20 }, wood: 1.4, jobs: 2, u: 0, d: '+1,4 hout/s, 2 banen', hap: [[1, -4]] },
  steen: { n: 'Steengroeve', e: '⛰️', c: { coins: 60, wood: 20 }, stone: 0.9, jobs: 3, u: 0, d: '+0,9 steen/s, 3 banen', hap: [[1, -5]] },
  boer: { n: 'Boerderij', e: '🌾', c: { coins: 40, wood: 10 }, food: 2.2, jobs: 2, u: 0, d: '+2,2 voedsel/s, 2 banen' },
  park: { n: 'Park', e: '🌳', c: { coins: 50, wood: 10 }, u: 0, d: '+15 geluk (straal 2)', hap: [[2, 15]] },
  winkel: { n: 'Winkel', e: '🏪', c: { coins: 120, wood: 30 }, coins: 4, jobs: 3, u: 15, d: '+4 munten/s, +6 geluk', hap: [[2, 6]] },
  fabriek: { n: 'Fabriek', e: '🏭', c: { coins: 300, wood: 40, stone: 60 }, coins: 10, jobs: 8, u: 25, d: '+10 munten/s, vervuilt (-20 geluk)', hap: [[2, -20]] },
  flat: { n: 'Flatgebouw', e: '🏢', c: { coins: 220, wood: 20, stone: 40 }, cap: 20, u: 40, d: '+20 inwoners' },
  school: { n: 'School', e: '🏫', c: { coins: 400, stone: 80 }, jobs: 4, u: 60, d: '+10 geluk, +10% belasting', hap: [[2, 10]], tax: 0.1 },
  zorg: { n: 'Ziekenhuis', e: '🏥', c: { coins: 800, stone: 150 }, jobs: 6, u: 100, d: '+14 geluk (straal 3)', hap: [[3, 14]] },
  molen: { n: 'Windmolen', e: '🌬️', c: { coins: 900, wood: 100, stone: 100 }, food: 6, jobs: 3, u: 150, d: '+6 voedsel/s' },
  toren: { n: 'Wolkenkrabber', e: '🏙️', c: { coins: 5000, stone: 800, wood: 400 }, cap: 80, coins: 8, jobs: 10, u: 250, d: '+80 inwoners, +8 munten/s' },
};
const ORDER = Object.keys(B);
const RN = { coins: '🪙', wood: '🪵', stone: '🪨', food: '🌾' };
let ST = {};
function costStr(c) { return Object.keys(c).map((k) => RN[k] + fmt(c[k])).join(' '); }
function canPay(S, c) { return Object.keys(c).every((k) => S.res[k] >= c[k]); }
function cell(S, x, y) { return S.grid[y * W + x]; }
function localHappy(S, x, y) {
  let hp = 50;
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
    const id = cell(S, xx, yy);
    if (!id || !B[id].hap) continue;
    const d = Math.max(Math.abs(xx - x), Math.abs(yy - y));
    if (d === 0) continue;
    for (const [r, v] of B[id].hap) if (d <= r) hp += v;
  }
  return clamp(hp, 0, 100);
}
function stats(S) {
  let cap = 0, jobs = 0, hw = 0, hs = 0;
  const tot = { wood: 0, stone: 0, food: 0, coins: 0 };
  let taxm = 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const id = cell(S, x, y); if (!id) continue;
    const b = B[id];
    if (b.cap) { cap += b.cap; const lh = localHappy(S, x, y); hw += b.cap; hs += lh * b.cap; }
    jobs += b.jobs || 0;
    if (b.tax) taxm += b.tax;
  }
  const happy = hw ? hs / hw : 50;
  const eff = jobs ? Math.min(1, S.pop * 0.7 / jobs) : 1;
  const hf = 0.5 + 0.5 * happy / 100;
  const foodOk = S.res.food > 0 ? 0 : -15;
  const hapF = clamp(happy + foodOk, 0, 100);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const id = cell(S, x, y); if (!id) continue;
    const b = B[id];
    if (b.wood) tot.wood += b.wood * eff * hf;
    if (b.stone) tot.stone += b.stone * eff * hf;
    if (b.food) tot.food += b.food * eff * hf;
    if (b.coins) tot.coins += b.coins * eff * hf * (b.cap ? 1 : 1);
  }
  const tax = S.pop * 0.15 * (hapF / 70) * taxm;
  tot.coins += tax;
  const eat = S.pop * 0.05;
  return { cap, jobs, happy: hapF, eff, tot, tax, eat, net: tot.food - eat };
}
function count(S, id) { return S.grid.filter((x) => x === id).length; }
const GOALS = [
  { id: 'g1', n: 'Bouw je eerste huis', cur: (S) => count(S, 'huis'), tg: 1, r: { coins: 60 } },
  { id: 'g2', n: 'Bereik 10 inwoners', cur: (S) => S.peak, tg: 10, r: { coins: 100, wood: 30 } },
  { id: 'g3', n: 'Bouw 3 boerderijen', cur: (S) => count(S, 'boer'), tg: 3, r: { coins: 150 } },
  { id: 'g4', n: 'Bereik 40 inwoners', cur: (S) => S.peak, tg: 40, r: { coins: 400, stone: 60 } },
  { id: 'g5', n: 'Bouw 3 parken', cur: (S) => count(S, 'park'), tg: 3, r: { coins: 300 } },
  { id: 'g6', n: 'Geluk van 75% bij 30+ inwoners', cur: (S) => (S.pop >= 30 ? stats(S).happy : 0), tg: 75, r: { coins: 800 } },
  { id: 'g7', n: 'Bereik 150 inwoners', cur: (S) => S.peak, tg: 150, r: { coins: 2500, stone: 300, wood: 200 } },
  { id: 'g8', n: 'Bouw een Wolkenkrabber', cur: (S) => count(S, 'toren'), tg: 1, r: { coins: 8000 } },
  { id: 'g9', n: 'Bereik 400 inwoners', cur: (S) => S.peak, tg: 400, r: { coins: 25000 } },
];

const C = {
  bg: 'linear-gradient(180deg,#7fb6e8,#6fa4d6 25%,#4c7fa8 70%,#3a5f80)',
  head: '#0f2c4de6',
  accent: '#ffd666',
  init(sv) {
    const S = Object.assign({ res: { coins: 150, wood: 40, stone: 0, food: 25 }, pop: 0, peak: 0, grid: [], tool: 'huis', goals: {}, built: 0, taxT: 0, ach: {}, last: 0, tab: 'stad' }, sv || {});
    S.res = Object.assign({ coins: 0, wood: 0, stone: 0, food: 0 }, S.res || {});
    if (!Array.isArray(S.grid) || S.grid.length !== W * H) S.grid = new Array(W * H).fill(null);
    if (!S.goals || typeof S.goals !== 'object') S.goals = {};
    if (!S.ach || typeof S.ach !== 'object') S.ach = {};
    return S;
  },
  snap: (S) => S.res.coins,
  welcome: (S, s0, away) => '🏙️ Je stad werkte ' + fmtT(away) + ' door: +' + fmt(S.res.coins - s0) + ' munten.',
  tick(S, dt) {
    ST = stats(S);
    const t = ST.tot;
    S.res.wood += t.wood * dt; S.res.stone += t.stone * dt; S.res.coins += t.coins * dt;
    S.res.food = Math.max(0, S.res.food + (t.food - ST.eat) * dt);
    if (S.pop < ST.cap && S.res.food > 0 && ST.happy >= 25) S.pop = Math.min(ST.cap, S.pop + Math.max(0.15, S.pop * 0.03) * dt);
    else if (S.pop > ST.cap) S.pop = Math.max(ST.cap, S.pop - (S.pop - ST.cap) * 0.5 * dt - 0.05 * dt);
    if (S.res.food <= 0 && S.pop > 1) S.pop = Math.max(1, S.pop - S.pop * 0.02 * dt);
    if (S.pop > S.peak) S.peak = S.pop;
  },
  header: (S) => pill('🪙 ' + fmt(S.res.coins)) + pill('🪵 ' + fmt(S.res.wood)) + pill('🪨 ' + fmt(S.res.stone)) + pill('🌾 ' + fmt(S.res.food)) + pill('👥 ' + Math.floor(S.pop) + '/' + (ST.cap || 0)) + pill('😊 ' + Math.round(ST.happy || 50) + '%'),
  tabs: [
    { id: 'stad', label: '🏙️ Stad', render(S, b) {
      ST = stats(S);
      const grid = h('div', 'display:grid;grid-template-columns:repeat(' + W + ',1fr);gap:3px;background:#2f6b2a;padding:5px;border-radius:14px;border:3px solid #1d4a1a;margin:4px 0 8px');
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const id = cell(S, x, y);
        let border = 'transparent';
        if (id && B[id].cap) { const lh = localHappy(S, x, y); border = lh >= 65 ? '#7dff7d' : lh >= 40 ? '#ffd93a' : '#ff5a4a'; }
        const t = h('div', 'aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:26px;border-radius:8px;cursor:pointer;box-sizing:border-box;border:2px solid ' + border + ';background:' + (id ? '#b9a98a' : '#5fae52'), id ? B[id].e : '');
        t.onclick = () => {
          const cur = cell(S, x, y);
          const i = y * W + x;
          if (S.tool === 'sloop') {
            if (cur) { const c = B[cur].c; for (const k in c) S.res[k] += Math.floor(c[k] * 0.5); S.grid[i] = null; }
          } else if (!cur) {
            const bd = B[S.tool];
            if (!bd) { CTX.toast('Kies eerst een gebouw hieronder'); return; }
            if (S.peak < bd.u) { CTX.toast('Nog niet ontgrendeld'); return; }
            if (!canPay(S, bd.c)) { CTX.toast('Te weinig grondstoffen: ' + costStr(bd.c)); return; }
            for (const k in bd.c) S.res[k] -= bd.c[k];
            S.grid[i] = S.tool; S.built++;
          } else {
            const hp = B[cur].cap ? ' · geluk hier ' + Math.round(localHappy(S, x, y)) + '%' : '';
            CTX.toast(B[cur].e + ' ' + B[cur].n + ': ' + B[cur].d + hp);
          }
          Object.assign(ST, stats(S));
          CTX.upd(); CTX.refresh(true); CTX.save();
        };
        grid.appendChild(t);
      }
      b.appendChild(grid);
      note(b, 'Kleur om een huis: groen = blij, geel = oké, rood = ontevreden. Zet parken in de buurt van huizen en fabrieken ver weg!');
      const pal = h('div', 'display:grid;grid-template-columns:repeat(4,1fr);gap:6px');
      for (const id of ORDER.concat(['sloop'])) {
        const bd = B[id];
        const locked = bd && S.peak < bd.u;
        const on = S.tool === id;
        const t = h('div', 'padding:6px 2px;min-height:62px;box-sizing:border-box;border-radius:12px;text-align:center;font-size:10px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px solid ' + (on ? '#ffd666' : 'transparent') + ';background:' + (on ? '#ffffff35' : '#00000045') + ';opacity:' + (locked ? 0.45 : 1));
        t.appendChild(h('div', 'font-size:22px;line-height:1.1', id === 'sloop' ? '🧹' : locked ? '🔒' : bd.e));
        t.appendChild(h('div', '', id === 'sloop' ? 'Slopen' : locked ? 'vanaf ' + bd.u + ' inw.' : bd.n));
        if (bd && !locked) t.appendChild(h('div', 'opacity:.85', costStr(bd.c)));
        t.onclick = () => { S.tool = id; CTX.refresh(true); };
        pal.appendChild(t);
      }
      b.appendChild(pal);
      if (B[S.tool]) note(b, B[S.tool].e + ' ' + B[S.tool].n + ': ' + B[S.tool].d);
    } },
    { id: 'res', label: '📊 Grondstoffen', render(S, b) {
      ST = stats(S);
      const fmtR = (v) => (v >= 0 ? '+' : '') + fmt(v).replace(/^-/, '−') + '/s';
      const rows = [
        ['🪙 Munten', fmt(S.res.coins), fmtR(ST.tot.coins) + ' (belasting ' + fmt(ST.tax) + ')'],
        ['🪵 Hout', fmt(S.res.wood), fmtR(ST.tot.wood)],
        ['🪨 Steen', fmt(S.res.stone), fmtR(ST.tot.stone)],
        ['🌾 Voedsel', fmt(S.res.food), fmtR(ST.net) + ' (eten ' + fmt(ST.eat) + ')'],
      ];
      for (const r of rows) { const c = card(b, 'display:flex;justify-content:space-between;gap:8px'); c.appendChild(h('div', 'font-weight:700', r[0])); c.appendChild(h('div', 'text-align:right;font-size:13px', r[1] + '  ' + r[2])); }
      const c = card(b);
      c.appendChild(h('div', 'font-weight:700', '👥 Bevolking: ' + Math.floor(S.pop) + ' / ' + ST.cap));
      c.appendChild(h('div', 'font-size:13px;margin-top:4px', 'Banen: ' + ST.jobs + ' · bezetting ' + Math.round(ST.eff * 100) + '% (werkenden = 70% van inwoners)'));
      bar(c, ST.happy / 100, ST.happy >= 65 ? '#7ddc5a' : ST.happy >= 40 ? '#ffd93a' : '#ff5a4a', '😊 Geluk ' + Math.round(ST.happy) + '%');
      if (S.res.food <= 0) note(b, '⚠️ Geen voedsel! Bouw boerderijen, anders krimpt je stad.');
      if (ST.eff < 0.6) note(b, '⚠️ Te weinig werkenden voor alle banen. Bouw meer huizen!');
      if (ST.happy < 50) note(b, '⚠️ Je inwoners zijn niet blij. Bouw parken en haal fabrieken bij huizen weg.');
      note(b, 'Geluk beïnvloedt belasting en productie. Onder 25% komen er geen nieuwe inwoners.');
    } },
    { id: 'handel', label: '🤝 Handel', render(S, b) {
      note(b, 'Verkoop of koop grondstoffen op de markt.');
      const items = [['wood', '🪵 Hout', 1.5], ['stone', '🪨 Steen', 3], ['food', '🌾 Voedsel', 1]];
      for (const [k, n, p] of items) {
        btn(b, 'Verkoop 50 ' + n, '+🪙 ' + fmt(50 * p * 0.8), () => { if (S.res[k] >= 50) { S.res[k] -= 50; S.res.coins += 50 * p * 0.8; } else CTX.toast('Te weinig ' + n); }, S.res[k] >= 50);
        btn(b, 'Koop 50 ' + n, '-🪙 ' + fmt(50 * p * 1.4), () => { const c = 50 * p * 1.4; if (S.res.coins >= c) { S.res.coins -= c; S.res[k] += 50; } }, S.res.coins >= 50 * p * 1.4);
      }
    } },
    { id: 'doelen', label: '🎯 Doelen', render(S, b) {
      for (const g of GOALS) {
        const cur = g.cur(S), ok = cur >= g.tg, done = S.goals[g.id];
        const c = card(b, 'opacity:' + (done ? 0.55 : 1));
        c.appendChild(h('div', 'font-weight:700', (done ? '✅ ' : '') + g.n));
        bar(c, cur / g.tg, '#ffd666', fmt(Math.min(cur, g.tg)) + ' / ' + fmt(g.tg));
        if (!done) btn(c, ok ? '🎁 Pak beloning' : 'Nog bezig', costStr(g.r), () => { S.goals[g.id] = 1; for (const k in g.r) S.res[k] += g.r[k]; CTX.toast('Beloning ontvangen!'); }, ok, 'linear-gradient(135deg,#3f9b4a,#2d6b34)');
      }
    } },
  ],
  ach: [
    { id: 'a1', n: 'Dorpje', d: 'Bereik 20 inwoners', t: (S) => S.peak >= 20 },
    { id: 'a2', n: 'Stadje', d: 'Bereik 100 inwoners', t: (S) => S.peak >= 100 },
    { id: 'a3', n: 'Grote stad', d: 'Bereik 500 inwoners', t: (S) => S.peak >= 500 },
    { id: 'a4', n: 'Bouwvakker', d: 'Bouw 30 gebouwen', t: (S) => S.built >= 30 },
    { id: 'a5', n: 'Stadsplanner', d: 'Heb 40 gebouwen tegelijk', t: (S) => S.grid.filter(Boolean).length >= 40 },
    { id: 'a6', n: 'Groene stad', d: 'Heb 6 parken', t: (S) => count(S, 'park') >= 6 },
    { id: 'a7', n: 'Industrieel', d: 'Heb 3 fabrieken', t: (S) => count(S, 'fabriek') >= 3 },
    { id: 'a8', n: 'Skyline', d: 'Bouw een wolkenkrabber', t: (S) => count(S, 'toren') >= 1 },
    { id: 'a9', n: 'Gezond', d: 'Bouw een ziekenhuis', t: (S) => count(S, 'zorg') >= 1 },
    { id: 'a10', n: 'Blije burgers', d: 'Geluk van 85%+ bij 50+ inwoners', t: (S) => S.pop >= 50 && stats(S).happy >= 85 },
  ],
};

export default {
  id: 'stadbouwer', name: 'Stad Bouwen', emoji: '🏙️', desc: 'Bouw huizen, fabrieken en parken. Houd je inwoners blij en je stad groeiend.',
  async create(host, api) { return runGame(host, api, C); },
};
