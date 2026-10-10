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
const RAR = ['Gewoon', 'Ongewoon', 'Zeldzaam', 'Legendarisch'];
const RCOL = ['#cfd8dc', '#7ddc5a', '#6ab0ff', '#ffb02e'];
const LOCS = [
  { id: 'vijver', n: 'Vijver', e: '🏞️', c: 0, fish: [
    ['stek', 'Stekelbaars', '🐟', 3, 50, 0], ['karper', 'Karper', '🐟', 6, 30, 0], ['brasem', 'Brasem', '🐠', 11, 15, 1], ['gkarper', 'Gouden karper', '✨', 90, 3, 2]] },
  { id: 'rivier', n: 'Rivier', e: '🌊', c: 500, fish: [
    ['forel', 'Forel', '🐟', 14, 45, 0], ['snoek', 'Snoek', '🐟', 24, 30, 0], ['zalm', 'Zalm', '🍣', 45, 15, 1], ['kreeft', 'Rivierkreeft', '🦞', 40, 10, 1], ['steur', 'Steur', '🐟', 280, 2, 2]] },
  { id: 'meer', n: 'Meer', e: '🏔️', c: 4000, fish: [
    ['baars', 'Baars', '🐟', 35, 45, 0], ['paling', 'Paling', '🐍', 60, 28, 1], ['meerval', 'Meerval', '🐋', 120, 12, 2], ['monster', 'Meermonster', '🐉', 2000, 0.5, 3]] },
  { id: 'kust', n: 'Kust', e: '🏖️', c: 3e4, fish: [
    ['haring', 'Haring', '🐟', 50, 45, 0], ['makreel', 'Makreel', '🐟', 70, 30, 0], ['krab', 'Krab', '🦀', 130, 15, 1], ['zeester', 'Zeester', '⭐', 350, 4, 2], ['octopus', 'Octopus', '🐙', 800, 1.5, 3]] },
  { id: 'diep', n: 'Diepzee', e: '🌌', c: 2.5e5, fish: [
    ['tonijn', 'Tonijn', '🐟', 350, 40, 0], ['inkt', 'Inktvis', '🦑', 700, 28, 1], ['haai', 'Haai', '🦈', 1400, 10, 2], ['lantaarn', 'Lantaarnvis', '💡', 4000, 3, 2], ['reuzeinkt', 'Reuzeninktvis', '🦑', 20000, 0.4, 3]] },
  { id: 'rif', n: 'Koraalrif', e: '🪸', c: 2e6, fish: [
    ['clown', 'Clownvis', '🐠', 900, 40, 0], ['kogel', 'Kogelvis', '🐡', 1500, 28, 1], ['kwal', 'Kwal', '🪼', 3000, 14, 1], ['schild', 'Zeeschildpad', '🐢', 5000, 6, 2], ['dolfijn', 'Dolfijn', '🐬', 12000, 2, 3], ['parel', 'Parelmoer', '🦪', 30000, 0.6, 3]] },
  { id: 'pool', n: 'Poolzee', e: '🧊', c: 2e7, fish: [
    ['kabeljauw', 'Kabeljauw', '🐟', 4000, 40, 0], ['zeehond', 'Zeehond', '🦭', 9000, 20, 1], ['ijsvis', 'IJsvis', '❄️', 18000, 8, 2], ['orka', 'Orka', '🐋', 60000, 1.5, 3], ['vinvis', 'Blauwe vinvis', '🐳', 150000, 0.4, 3]] },
];
const FISH = {};
LOCS.forEach((l) => l.fish.forEach((f) => { FISH[f[0]] = { id: f[0], n: f[1], e: f[2], p: f[3], w: f[4], r: f[5], loc: l.id }; }));
const ALLF = Object.keys(FISH);
const BOATS = [
  { id: 'roei', n: 'Roeiboot', e: '🛶', c: 200, per: 14 },
  { id: 'vis', n: 'Vissersboot', e: '⛵', c: 2000, per: 8 },
  { id: 'trawl', n: 'Trawler', e: '🚢', c: 30000, per: 4.5 },
  { id: 'super', n: 'Supertrawler', e: '🛳️', c: 500000, per: 2.2 },
];
const UPG = [
  { id: 'hengel', n: '🎣 Betere hengel', d: 'Langer reactievenster en meer kans op zeldzame vis', max: 10, c: (l) => 80 * Math.pow(2.4, l) },
  { id: 'hold', n: '📦 Groter ruim', d: '+25 plaatsen', max: 12, c: (l) => 100 * Math.pow(2.2, l) },
  { id: 'markt', n: '🏪 Visafslag', d: '+10% verkoopprijs', max: 10, c: (l) => 250 * Math.pow(2.6, l) },
  { id: 'toren', n: '🗼 Vuurtoren', d: 'Boten vissen 15% sneller', max: 6, c: (l) => 1500 * Math.pow(3, l) },
];
const ul = (S, id) => S.ups[id] || 0;
const holdCap = (S) => 30 + 25 * ul(S, 'hold');
const holdN = (S) => Object.values(S.hold).reduce((a, x) => a + x.n, 0);
const dexN = (S) => Object.keys(S.dex).length;
function sellMult(S) { return (1 + 0.1 * ul(S, 'markt')) * (1 + 0.01 * dexN(S)) * (1 + 0.03 * achN(S)); }
function luck(S, bait) { return 0.15 * ul(S, 'hengel') + (bait ? 1 : 0); }
function draw(S, locId, lk) {
  const loc = LOCS.find((l) => l.id === locId);
  const ws = loc.fish.map((f) => f[4] * (f[5] >= 2 ? Math.pow(1 + lk, f[5] - 1) : 1));
  let x = Math.random() * ws.reduce((a, b) => a + b, 0), k = 0;
  while (k < ws.length - 1 && x > ws[k]) { x -= ws[k]; k++; }
  const f = FISH[loc.fish[k][0]];
  const size = 0.7 + Math.random() * 0.8;
  return { f, size, v: f.p * size };
}
function stash(S, c) {
  const e = S.hold[c.f.id] || (S.hold[c.f.id] = { n: 0, v: 0 });
  e.n++; e.v += c.v;
  const d = S.dex[c.f.id] || (S.dex[c.f.id] = { n: 0, best: 0 });
  d.n++; if (c.size > d.best) d.best = c.size;
  S.caught++;
  for (const q of S.quests) if (q.f === c.f.id && q.got < q.n) q.got++;
}
function newQuest(S) {
  const ids = ALLF.filter((id) => S.locs[FISH[id].loc] && FISH[id].r <= 2);
  const id = pick(ids), f = FISH[id];
  const n = f.r >= 2 ? 1 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 4);
  return { f: id, n, got: 0, r: Math.ceil(f.p * n * 3 + 20) };
}
let fs = { st: 'idle', t: 0, dur: 0, msg: 'Werp je hengel uit!', last: null, bait: false };

const C = {
  bg: 'linear-gradient(180deg,#bfe9ff,#4aa3d8 25%,#14608f 65%,#082f4d)',
  head: '#06304de6',
  accent: '#ffd23f',
  init(sv) {
    const S = Object.assign({ coins: 0, locs: { vijver: 1 }, loc: 'vijver', hold: {}, dex: {}, fleet: {}, ups: {}, bait: 0, quests: [], caught: 0, lost: 0, earned: 0, ach: {}, last: 0, tab: 'vis' }, sv || {});
    for (const k of ['locs', 'hold', 'dex', 'fleet', 'ups', 'ach']) if (!S[k] || typeof S[k] !== 'object') S[k] = {};
    if (!Array.isArray(S.quests)) S.quests = [];
    S.locs.vijver = 1;
    while (S.quests.length < 2) S.quests.push(newQuest(S));
    return S;
  },
  start() { fs = { st: 'idle', t: 0, dur: 0, msg: 'Werp je hengel uit!', last: null, bait: false }; },
  snap: (S) => S.coins + Object.values(S.hold).reduce((a, x) => a + x.v, 0),
  welcome: (S, s0, away) => '⛵ Je vloot was ' + fmtT(away) + ' op zee en haalde vis binnen (ruim: ' + holdN(S) + '/' + holdCap(S) + ').',
  tick(S, dt) {
    if (fs.st === 'wait') { fs.t += dt; if (fs.t >= fs.dur) { fs.st = 'bite'; fs.t = 0; fs.dur = 1.6 + 0.15 * ul(S, 'hengel'); fs.msg = '❗ Beet! Haal in!'; CTX.refresh(true); } }
    else if (fs.st === 'bite') { fs.t += dt; if (fs.t >= fs.dur) { fs.st = 'idle'; fs.msg = '💨 Hij ontsnapte! Te langzaam.'; S.lost++; CTX.refresh(true); } }
    const sp = 1 + 0.15 * ul(S, 'toren');
    for (const b of BOATS) {
      const fl = S.fleet[b.id]; if (!fl || !fl.n) continue;
      fl.acc = (fl.acc || 0) + fl.n * dt * sp / b.per;
      let guard = 0;
      while (fl.acc >= 1 && guard++ < 400) {
        fl.acc -= 1;
        if (holdN(S) >= holdCap(S)) { fl.acc = 0; break; }
        stash(S, draw(S, fl.loc, luck(S, false) * 0.5));
      }
      if (fl.acc > 1) fl.acc = 0;
    }
  },
  header: (S) => pill('🪙 ' + fmt(S.coins)) + pill('📦 ' + holdN(S) + '/' + holdCap(S)) + pill('📖 ' + dexN(S) + '/' + ALLF.length) + (S.bait ? pill('🪱 ' + S.bait) : ''),
  tabs: [
    { id: 'vis', label: '🎣 Vissen', render(S, b) {
      const loc = LOCS.find((l) => l.id === S.loc);
      const row = h('div', 'display:flex;gap:6px;overflow-x:auto;padding:2px 0 6px');
      for (const l of LOCS) {
        const un = S.locs[l.id];
        const x = h('div', 'flex:0 0 auto;min-width:62px;padding:8px;border-radius:12px;text-align:center;font-size:11px;cursor:pointer;border:2px solid ' + (S.loc === l.id ? '#ffd23f' : 'transparent') + ';background:#00000050;opacity:' + (un ? 1 : 0.6));
        x.appendChild(h('div', 'font-size:24px', un ? l.e : '🔒'));
        x.appendChild(h('div', '', un ? l.n : '🪙' + fmt(l.c)));
        x.onclick = () => {
          if (un) { S.loc = l.id; if (fs.st !== 'idle') { fs.st = 'idle'; fs.msg = 'Je bent verhuisd. Werp opnieuw uit!'; } }
          else if (S.coins >= l.c) { S.coins -= l.c; S.locs[l.id] = 1; S.loc = l.id; CTX.toast('Nieuwe visplek: ' + l.n + '!'); CTX.upd(); }
          else CTX.toast('Je hebt 🪙 ' + fmt(l.c) + ' nodig voor ' + l.n);
          CTX.refresh(true); CTX.save();
        };
        row.appendChild(x);
      }
      b.appendChild(row);
      const bigCol = fs.st === 'bite' ? 'radial-gradient(circle,#ff7a5a,#c0301a)' : fs.st === 'wait' ? 'radial-gradient(circle,#4a8fc0,#1d5a85)' : 'radial-gradient(circle,#ffd23f,#d68a00)';
      const big = h('div', 'margin:8px auto;width:190px;height:190px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;cursor:pointer;box-shadow:0 8px 24px #0008;background:' + bigCol + ';' + (fs.st === 'bite' ? 'animation:vbpulse .35s infinite alternate;' : ''));
      big.appendChild(h('div', 'font-size:70px;line-height:1', fs.st === 'bite' ? '🐟' : fs.st === 'wait' ? '🪝' : '🎣'));
      big.appendChild(h('div', 'font-size:15px;font-weight:800;margin-top:6px;color:' + (fs.st === 'idle' ? '#2a1a00' : '#fff'), fs.st === 'bite' ? 'HAAL IN!' : fs.st === 'wait' ? 'Wachten...' : 'Werp uit'));
      big.onclick = () => {
        if (fs.st === 'idle') {
          if (holdN(S) >= holdCap(S)) { CTX.toast('Ruim vol! Verkoop eerst je vis.'); return; }
          fs.bait = S.bait > 0 && S.useBait;
          if (fs.bait) S.bait--;
          fs.st = 'wait'; fs.t = 0; fs.dur = rnd(1.5, 4) / (fs.bait ? 2 : 1); fs.msg = '🌊 Wachten op een beet...';
        } else if (fs.st === 'wait') {
          fs.st = 'idle'; fs.msg = '🙈 Te vroeg getrokken!';
        } else if (fs.st === 'bite') {
          if (holdN(S) >= holdCap(S)) { fs.st = 'idle'; fs.msg = 'Ruim vol!'; }
          else {
            const c = draw(S, S.loc, luck(S, fs.bait)); stash(S, c); fs.last = c; fs.st = 'idle';
            fs.msg = '🎉 ' + c.f.e + ' ' + c.f.n + ' (' + Math.round(c.size * 40) + ' cm)!';
            if (c.f.r >= 2) CTX.toast('✨ ' + RAR[c.f.r] + 'e vangst: ' + c.f.n + '!');
          }
        }
        CTX.upd(); CTX.refresh(true); CTX.save();
      };
      b.appendChild(big);
      b.appendChild(h('div', 'text-align:center;font-weight:700;margin:4px 0;min-height:22px', fs.msg));
      if (fs.last) { const c = card(b, 'text-align:center'); c.appendChild(h('div', 'font-size:40px', fs.last.f.e)); c.appendChild(h('div', 'font-weight:700;color:' + RCOL[fs.last.f.r], fs.last.f.n + ' · ' + RAR[fs.last.f.r])); c.appendChild(h('div', 'font-size:12px', 'Waarde ongeveer 🪙 ' + fmt(fs.last.v * sellMult(S)))); }
      const tog = btn(b, '🪱 Lokaas gebruiken: ' + (S.useBait ? 'AAN' : 'UIT'), S.bait + ' over', () => { S.useBait = !S.useBait; }, true, '#00000040');
      let total = 0; for (const id in S.hold) total += S.hold[id].v * sellMult(S);
      btn(b, '💰 Verkoop alle vis (' + holdN(S) + ')', '🪙 ' + fmt(total), () => {
        const g = Math.floor(total); S.coins += g; S.earned += g; S.hold = {};
        CTX.toast('Verkocht voor 🪙 ' + fmt(g));
      }, holdN(S) > 0, 'linear-gradient(135deg,#3f9b4a,#2d6b34)');
      note(b, 'Visplek: ' + loc.n + '. Tik "Werp uit", wacht tot het aas zinkt en trek zodra het ❗ verschijnt.');
      if (!document.getElementById('vbstyle')) { const st = document.createElement('style'); st.id = 'vbstyle'; st.textContent = '@keyframes vbpulse{from{transform:scale(1)}to{transform:scale(1.08)}}'; document.head.appendChild(st); }
    } },
    { id: 'vloot', label: '⛵ Vloot', render(S, b) {
      note(b, 'Boten vissen automatisch op een plek naar keuze en vullen je ruim. Tik op de plek om te wisselen.');
      BOATS.forEach((bt, i) => {
        const fl = S.fleet[bt.id] || { n: 0, loc: S.loc, acc: 0 };
        if (i > 0 && !(S.fleet[BOATS[i - 1].id] && S.fleet[BOATS[i - 1].id].n) && S.coins < bt.c * 0.3 && !fl.n) { card(b, 'opacity:.4').textContent = '🔒 ???'; return; }
        const cost = Math.ceil(bt.c * Math.pow(1.3, fl.n));
        const c = card(b);
        c.appendChild(h('div', 'font-weight:700;font-size:15px', bt.e + ' ' + bt.n + ' x' + fl.n));
        c.appendChild(h('div', 'font-size:12px;opacity:.9', '1 vis per ' + fmtT(bt.per) + ' per boot'));
        if (fl.n) {
          const un = LOCS.filter((l) => S.locs[l.id]);
          const cur = LOCS.find((l) => l.id === fl.loc) || LOCS[0];
          btn(c, '📍 Vist op: ' + cur.e + ' ' + cur.n, 'wissel', () => { const ix = un.findIndex((l) => l.id === fl.loc); fl.loc = un[(ix + 1) % un.length].id; }, true, '#00000040');
        }
        btn(c, 'Koop ' + bt.n, '🪙 ' + fmt(cost), () => { if (S.coins >= cost) { S.coins -= cost; if (!S.fleet[bt.id]) S.fleet[bt.id] = { n: 0, loc: S.loc, acc: 0 }; S.fleet[bt.id].n++; } }, S.coins >= cost);
      });
    } },
    { id: 'haven', label: '⚓ Haven', render(S, b) {
      for (const u of UPG) {
        const l = ul(S, u.id);
        if (l >= u.max) { card(b, 'opacity:.7').textContent = '✅ ' + u.n + ' (max)'; continue; }
        const c = Math.ceil(u.c(l));
        btn(b, u.n + ' ' + l + '/' + u.max, u.d + '\n🪙 ' + fmt(c), () => { if (S.coins >= c) { S.coins -= c; S.ups[u.id] = l + 1; } }, S.coins >= c);
      }
      sec(b, 'Winkel');
      const pc = 40 + 20 * Math.floor(ul(S, 'hengel') / 2);
      btn(b, '🪱 Lokaas x10', '🪙 ' + fmt(pc), () => { if (S.coins >= pc) { S.coins -= pc; S.bait += 10; } }, S.coins >= pc);
      note(b, 'Lokaas: sneller een beet en veel meer kans op zeldzame vis (voor één worp).');
      const c = card(b);
      c.textContent = '📊 Gevangen: ' + fmt(S.caught) + ' · Ontsnapt: ' + S.lost + ' · Verdiend: 🪙 ' + fmt(S.earned);
    } },
    { id: 'quest', label: '📜 Opdrachten', render(S, b) {
      note(b, 'Vang de gevraagde vis (elke vangst telt, ook van je boten).');
      S.quests.forEach((q, i) => {
        const f = FISH[q.f], ok = q.got >= q.n;
        const c = card(b);
        c.appendChild(h('div', 'font-weight:700', f.e + ' Vang ' + q.n + 'x ' + f.n + ' (' + q.got + '/' + q.n + ')'));
        bar(c, q.got / q.n, '#ffd23f');
        btn(c, ok ? '🎁 Claim beloning' : 'Nog bezig', '🪙 ' + fmt(q.r), () => { S.coins += q.r; S.earned += q.r; S.done = (S.done || 0) + 1; S.quests[i] = newQuest(S); CTX.toast('Opdracht voltooid! +🪙 ' + fmt(q.r)); }, ok, 'linear-gradient(135deg,#3f9b4a,#2d6b34)');
        if (!ok) { const sk = btn(c, '🔄 Andere opdracht', '', () => { S.quests[i] = newQuest(S); }, true, '#00000040'); sk.style.minHeight = '40px'; }
      });
    } },
    { id: 'dex', label: '📖 Visboek', render(S, b) {
      sec(b, 'Ontdekt: ' + dexN(S) + '/' + ALLF.length + ' · +' + dexN(S) + '% verkoopprijs');
      LOCS.forEach((l) => {
        b.appendChild(h('div', 'font-weight:700;margin:10px 0 4px', l.e + ' ' + l.n));
        const g = h('div', 'display:grid;grid-template-columns:repeat(3,1fr);gap:6px');
        for (const f of l.fish) {
          const fi = FISH[f[0]], d = S.dex[fi.id];
          const t = h('div', 'text-align:center;padding:8px 2px;border-radius:10px;background:#00000040;font-size:11px;border:1px solid ' + (d ? RCOL[fi.r] : 'transparent') + ';opacity:' + (d ? 1 : 0.5));
          t.appendChild(h('div', 'font-size:26px', d ? fi.e : '❔'));
          t.appendChild(h('div', '', d ? fi.n : '???'));
          t.appendChild(h('div', 'opacity:.8', d ? 'x' + d.n + ' · ' + Math.round(d.best * 40) + 'cm' : RAR[fi.r]));
          g.appendChild(t);
        }
        b.appendChild(g);
      });
    } },
  ],
  ach: [
    { id: 'a1', n: 'Eerste vangst', d: 'Vang 1 vis', t: (S) => S.caught >= 1 },
    { id: 'a2', n: 'Visser', d: 'Vang 100 vissen', t: (S) => S.caught >= 100 },
    { id: 'a3', n: 'Vissersheld', d: 'Vang 2000 vissen', t: (S) => S.caught >= 2000 },
    { id: 'a4', n: 'Zeeman', d: 'Koop een Vissersboot', t: (S) => !!(S.fleet.vis && S.fleet.vis.n) },
    { id: 'a5', n: 'Reder', d: 'Koop een Supertrawler', t: (S) => !!(S.fleet.super && S.fleet.super.n) },
    { id: 'a6', n: 'Ontdekkingsreiziger', d: 'Ontgrendel 4 visplekken', t: (S) => Object.keys(S.locs).length >= 4 },
    { id: 'a7', n: 'Aan de pool', d: 'Ontgrendel de Poolzee', t: (S) => !!S.locs.pool },
    { id: 'a8', n: 'Verzamelaar', d: 'Ontdek 15 soorten', t: (S) => dexN(S) >= 15 },
    { id: 'a9', n: 'Visboek compleet', d: 'Ontdek alle soorten', t: (S) => dexN(S) >= ALLF.length },
    { id: 'a10', n: 'Legende', d: 'Vang een legendarische vis', t: (S) => ALLF.some((id) => FISH[id].r === 3 && S.dex[id]) },
    { id: 'a11', n: 'Klusjesman', d: 'Voltooi 5 opdrachten', t: (S) => (S.done || 0) >= 5 },
  ],
  achNote: 'Elke prestatie geeft +3% verkoopprijs.',
};

export default {
  id: 'vissersboot', name: 'Vissersboot Imperium', emoji: '🎣', desc: 'Vang vis, bouw een vloot en verzamel alle zeldzame vissen.',
  async create(host, api) { return runGame(host, api, C); },
};
