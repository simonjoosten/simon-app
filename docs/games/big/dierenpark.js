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
const SP = [
  { id: 'eend', n: 'Eend', e: '🦆', c: 40, a: 1 },
  { id: 'geit', n: 'Geit', e: '🐐', c: 200, a: 4 },
  { id: 'flamingo', n: 'Flamingo', e: '🦩', c: 1000, a: 20 },
  { id: 'aap', n: 'Aap', e: '🐒', c: 5000, a: 100 },
  { id: 'zebra', n: 'Zebra', e: '🦓', c: 25000, a: 500 },
  { id: 'giraf', n: 'Giraf', e: '🦒', c: 120000, a: 2400 },
  { id: 'olifant', n: 'Olifant', e: '🐘', c: 6e5, a: 12000 },
  { id: 'pinguin', n: 'Pinguïn', e: '🐧', c: 3e6, a: 60000 },
  { id: 'panda', n: 'Panda', e: '🐼', c: 1.5e7, a: 3e5 },
  { id: 'leeuw', n: 'Leeuw', e: '🦁', c: 8e7, a: 1.6e6 },
];
const RARE = [
  { id: 'luiaard', n: 'Luiaard', e: '🦥', w: 40, a: 800, r: 'Zeldzaam' },
  { id: 'pauw', n: 'Pauw', e: '🦚', w: 28, a: 3000, r: 'Zeldzaam' },
  { id: 'kangoeroe', n: 'Kangoeroe', e: '🦘', w: 16, a: 12000, r: 'Episch' },
  { id: 'panter', n: 'Zwarte panter', e: '🐆', w: 9, a: 60000, r: 'Episch' },
  { id: 'eenhoorn', n: 'Eenhoorn', e: '🦄', w: 4, a: 500000, r: 'Legendarisch' },
  { id: 'draak', n: 'Vriendelijke draak', e: '🐉', w: 1.5, a: 6e6, r: 'Mythisch' },
];
const UP = [
  { id: 'park', n: '🌳 Parkgrootte', d: '+25% bezoekers', max: 8, c: (l) => 500 * Math.pow(3.5, l) },
  { id: 'kiosk', n: '🍦 IJskraam & kiosk', d: '+🪙 0,8 per bezoeker', max: 8, c: (l) => 300 * Math.pow(3, l) },
  { id: 'speel', n: '🛝 Speeltuin', d: 'Plezier daalt 12% trager', max: 5, c: (l) => 800 * Math.pow(3, l) },
  { id: 'voer', n: '🥕 Voerautomaat', d: 'Honger daalt 12% trager', max: 5, c: (l) => 800 * Math.pow(3, l) },
  { id: 'verblijf', n: '🏡 Grotere verblijven', d: '+3 dieren per soort', max: 6, c: (l) => 2000 * Math.pow(3.2, l) },
  { id: 'verz', n: '🧑‍⚕️ Dierenverzorger', d: 'Voert en speelt automatisch', max: 8, c: (l) => 600 * Math.pow(2.6, l) },
];
const upl = (S, id) => S.ups[id] || 0;
const cap = (S) => 5 + 3 * upl(S, 'verblijf');
function care(S, id) { return S.care[id] || (S.care[id] = { h: 100, p: 100 }); }
function appealOf(S) {
  let t = 0;
  for (const s of SP) { const n = S.an[s.id] || 0; if (n) { const c = care(S, s.id); t += n * s.a * (0.4 + 0.6 * (c.h + c.p) / 200); } }
  for (const r of RARE) if (S.rare[r.id]) { const c = care(S, r.id); t += r.a * (0.4 + 0.6 * (c.h + c.p) / 200); }
  return t * Math.pow(1.25, upl(S, 'park')) * (1 + 0.03 * achN(S));
}
const demand = (p) => Math.max(0.05, 1.5 - 0.12 * p);
function vps(S) { return appealOf(S) * 0.1 * demand(S.price); }
function inc(S) { return vps(S) * (S.price + 0.8 * upl(S, 'kiosk')); }
function feedCost(S, id) {
  const s = SP.find((x) => x.id === id);
  if (s) return Math.ceil(5 + s.c * 0.004 * (S.an[id] || 0));
  return Math.ceil(2000);
}
function totalAnimals(S) { return Object.values(S.an).reduce((a, b) => a + b, 0) + Object.keys(S.rare).length; }
function drawRare(S) {
  const tot = RARE.reduce((a, r) => a + r.w, 0);
  let x = Math.random() * tot, k = 0;
  while (k < RARE.length - 1 && x > RARE[k].w) { x -= RARE[k].w; k++; }
  return RARE[k];
}

const C = {
  bg: 'linear-gradient(180deg,#87d37c,#4fa86a 40%,#2d7a55)',
  head: '#12482ee6',
  accent: '#ffe27a',
  init(sv) {
    const S = Object.assign({ coins: 60, an: {}, care: {}, rare: {}, ups: {}, price: 4, vis: 0, tickets: 1, earned: 0, draws: 0, seen: {}, vAcc: 0, ach: {}, last: 0, tab: 'park' }, sv || {});
    for (const k of ['an', 'care', 'rare', 'ups', 'seen', 'ach']) if (!S[k] || typeof S[k] !== 'object') S[k] = {};
    return S;
  },
  snap: (S) => S.coins,
  welcome: (S, s0, away) => '🦁 Je park verdiende ' + fmt(S.coins - s0) + ' munten terwijl je weg was (' + fmtT(away) + ').',
  tick(S, dt) {
    const i = inc(S);
    S.coins += i * dt; S.earned += i * dt;
    const v = vps(S) * dt;
    S.vis += v; S.vAcc += v;
    while (S.vAcc >= 150) { S.vAcc -= 150; S.tickets++; }
    const dh = dt / 150 * 100 * Math.pow(0.88, upl(S, 'voer'));
    const dp = dt / 240 * 100 * Math.pow(0.88, upl(S, 'speel'));
    const all = SP.filter((s) => S.an[s.id]).map((s) => s.id).concat(Object.keys(S.rare));
    for (const id of all) { const c = care(S, id); c.h = Math.max(0, c.h - dh); c.p = Math.max(0, c.p - dp); }
    const k = upl(S, 'verz');
    if (k) {
      S.vT = (S.vT || 0) + dt;
      if (S.vT >= 3) {
        S.vT = 0;
        let left = k;
        for (const id of all) {
          if (left <= 0) break;
          const c = care(S, id);
          if (c.p < 45) { c.p = 100; left--; }
          if (c.h < 45 && left > 0) { const fc = feedCost(S, id); if (S.coins >= fc) { S.coins -= fc; c.h = 100; left--; } }
        }
      }
    }
    for (const s of SP) if (S.an[s.id]) S.seen[s.id] = 1;
    for (const r of RARE) if (S.rare[r.id]) S.seen[r.id] = 1;
  },
  header: (S) => pill('🪙 ' + fmt(S.coins)) + pill('📈 ' + fmt(inc(S)) + '/s') + pill('👨‍👩‍👧 ' + fmt(vps(S)) + '/s') + pill('🎟️ ' + S.tickets),
  tabs: [
    { id: 'park', label: '🌳 Park', render(S, b) {
      const c = card(b);
      c.appendChild(h('div', 'font-size:40px;text-align:center;letter-spacing:4px', SP.filter((s) => S.an[s.id]).slice(-5).map((s) => s.e).join('') || '🏞️'));
      c.appendChild(h('div', 'font-size:13px;text-align:center;margin-top:6px', 'Dieren: ' + totalAnimals(S) + ' · Bezoekers totaal: ' + fmt(S.vis) + ' · Aantrekkingskracht: ' + fmt(appealOf(S))));
      sec(b, '🎫 Kaartjesprijs: 🪙 ' + S.price);
      const row = h('div', 'display:flex;gap:8px;align-items:center');
      const mk = (t, d) => { const x = h('div', 'flex:1;text-align:center;padding:12px;border-radius:12px;background:#00000050;font-weight:700;cursor:pointer;font-size:18px;min-height:44px;box-sizing:border-box', t); x.onclick = () => { S.price = clamp(S.price + d, 1, 12); CTX.upd(); CTX.refresh(true); CTX.save(); }; return x; };
      row.appendChild(mk('−', -1));
      row.appendChild(h('div', 'flex:2;text-align:center;font-size:13px', 'Vraag: ' + Math.round(demand(S.price) * 100) + '% · opbrengst ' + fmt(inc(S)) + '/s'));
      row.appendChild(mk('+', 1));
      b.appendChild(row);
      note(b, 'Tip: te duur schrikt bezoekers af, te goedkoop levert weinig op. Zoek de beste prijs!');
      const care0 = SP.filter((s) => S.an[s.id]);
      if (care0.length) {
        sec(b, 'Welzijn');
        let sum = 0, n = 0;
        for (const s of care0) { const cc = care(S, s.id); sum += cc.h + cc.p; n += 2; }
        bar(b, sum / n / 100, sum / n < 40 ? '#ff6b5a' : '#7ddc5a', 'Gemiddeld ' + Math.round(sum / n) + '%');
      }
    } },
    { id: 'dieren', label: '🐘 Dieren', render(S, b) {
      note(b, 'Dieren die honger of verveling hebben trekken minder bezoekers. Voer en speel regelmatig (of huur verzorgers).');
      SP.forEach((s, i) => {
        const n = S.an[s.id] || 0;
        const prev = i === 0 || S.an[SP[i - 1].id];
        if (!n && !prev && S.coins < s.c * 0.3) { card(b, 'opacity:.4').textContent = '🔒 ???'; return; }
        const cost = Math.ceil(s.c * Math.pow(1.2, n));
        const c = card(b);
        c.appendChild(h('div', 'font-weight:700;font-size:15px', s.e + ' ' + s.n + ' (' + n + '/' + cap(S) + ')'));
        if (n) {
          const cc = care(S, s.id);
          bar(c, cc.h / 100, '#ff9f43', '🍖 honger ' + Math.round(cc.h) + '%');
          bar(c, cc.p / 100, '#5aa0ff', '🎾 plezier ' + Math.round(cc.p) + '%');
          const r = h('div', 'display:flex;gap:6px');
          const fc = feedCost(S, s.id);
          const f = h('div', 'flex:1;text-align:center;padding:10px 4px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;min-height:44px;box-sizing:border-box;background:' + (S.coins >= fc ? '#00000055' : '#00000030'), '🍖 Voer 🪙' + fmt(fc));
          f.onclick = () => { if (S.coins >= fc) { S.coins -= fc; cc.h = 100; CTX.upd(); CTX.refresh(true); } };
          const pl = h('div', 'flex:1;text-align:center;padding:10px 4px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;min-height:44px;box-sizing:border-box;background:#00000055', '🎾 Speel (gratis)');
          pl.onclick = () => { cc.p = Math.min(100, cc.p + 40); CTX.refresh(true); };
          r.append(f, pl); c.appendChild(r);
        }
        btn(c, 'Koop ' + s.n, '+' + fmt(s.a) + ' aantrekking\n🪙 ' + fmt(cost), () => { if (S.coins >= cost && n < cap(S)) { S.coins -= cost; S.an[s.id] = n + 1; care(S, s.id); } else if (n >= cap(S)) CTX.toast('Verblijf vol! Bouw grotere verblijven'); }, S.coins >= cost && n < cap(S));
      });
    } },
    { id: 'adopt', label: '🥚 Adoptie', render(S, b) {
      const c = card(b);
      c.appendChild(h('div', 'font-weight:700;font-size:15px', 'Adoptiebureau'));
      c.appendChild(h('div', 'font-size:13px;margin:6px 0', 'Elke 150 bezoekers levert een 🎟️ ticket op. Voor 3 tickets adopteer je een zeldzaam dier! Dubbele dieren geven 2 tickets terug.'));
      btn(b, '🥚 Adopteer een zeldzaam dier', '🎟️ 3 (je hebt ' + S.tickets + ')', () => {
        if (S.tickets < 3) return;
        S.tickets -= 3; S.draws++;
        const r = drawRare(S);
        if (S.rare[r.id]) { S.tickets += 2; CTX.toast('Dubbel: ' + r.e + ' ' + r.n + '. 2 tickets terug'); }
        else { S.rare[r.id] = 1; care(S, r.id); CTX.toast('✨ Nieuw dier: ' + r.e + ' ' + r.n + '! (' + r.r + ')'); }
      }, S.tickets >= 3, 'linear-gradient(135deg,#b06be8,#6a3ab0)');
      sec(b, 'Zeldzame dieren');
      for (const r of RARE) {
        const got = S.rare[r.id];
        const k = card(b, 'display:flex;align-items:center;gap:10px;opacity:' + (got ? 1 : 0.5));
        k.appendChild(h('div', 'font-size:32px', got ? r.e : '❔'));
        const t = h('div', 'flex:1');
        t.appendChild(h('div', 'font-weight:700', got ? r.n : '???'));
        t.appendChild(h('div', 'font-size:12px;opacity:.85', r.r + (got ? ' · +' + fmt(r.a) + ' aantrekking' : '')));
        k.appendChild(t);
        if (got) {
          const cc = care(S, r.id);
          const fc = feedCost(S, r.id);
          const x = h('div', 'padding:10px;border-radius:10px;background:#00000055;font-size:12px;font-weight:700;cursor:pointer;min-height:44px;box-sizing:border-box', '🍖🎾 ' + Math.round((cc.h + cc.p) / 2) + '%');
          x.onclick = () => { if (S.coins >= fc) { S.coins -= fc; cc.h = 100; } cc.p = 100; CTX.upd(); CTX.refresh(true); };
          k.appendChild(x);
        }
      }
    } },
    { id: 'upg', label: '🛠️ Park', render(S, b) {
      for (const u of UP) {
        const l = upl(S, u.id);
        if (l >= u.max) { card(b, 'opacity:.7').textContent = '✅ ' + u.n + ' (max)'; continue; }
        const c = Math.ceil(u.c(l));
        btn(b, u.n + ' ' + l + '/' + u.max, u.d + '\n🪙 ' + fmt(c), () => { if (S.coins >= c) { S.coins -= c; S.ups[u.id] = l + 1; } }, S.coins >= c);
      }
    } },
    { id: 'boek', label: '📖 Dierenboek', render(S, b) {
      const all = SP.concat(RARE);
      const n = all.filter((x) => S.seen[x.id]).length;
      sec(b, 'Ontdekt: ' + n + '/' + all.length);
      const g = h('div', 'display:grid;grid-template-columns:repeat(4,1fr);gap:8px');
      for (const x of all) {
        const t = h('div', 'text-align:center;padding:10px 2px;border-radius:12px;background:#00000040;font-size:11px;opacity:' + (S.seen[x.id] ? 1 : 0.4));
        t.appendChild(h('div', 'font-size:32px', S.seen[x.id] ? x.e : '❔'));
        t.appendChild(h('div', '', S.seen[x.id] ? x.n : '???'));
        g.appendChild(t);
      }
      b.appendChild(g);
    } },
  ],
  ach: [
    { id: 'a1', n: 'Dierenvriend', d: 'Koop je eerste dier', t: (S) => totalAnimals(S) >= 1 },
    { id: 'a2', n: 'Dierenverzamelaar', d: 'Heb 25 dieren', t: (S) => totalAnimals(S) >= 25 },
    { id: 'a3', n: 'Dierenpark vol', d: 'Heb 60 dieren', t: (S) => totalAnimals(S) >= 60 },
    { id: 'a4', n: 'Drukte', d: '1000 bezoekers', t: (S) => S.vis >= 1000 },
    { id: 'a5', n: 'Pretpark', d: '100K bezoekers', t: (S) => S.vis >= 1e5 },
    { id: 'a6', n: 'Eerste zeldzame', d: 'Adopteer een zeldzaam dier', t: (S) => Object.keys(S.rare).length >= 1 },
    { id: 'a7', n: 'Mythisch', d: 'Adopteer de draak', t: (S) => !!S.rare.draak },
    { id: 'a8', n: 'Koningin der dieren', d: 'Koop een leeuw', t: (S) => (S.an.leeuw || 0) >= 1 },
    { id: 'a9', n: 'Rijk', d: 'Verdien 1M munten', t: (S) => S.earned >= 1e6 },
    { id: 'a10', n: 'Compleet', d: 'Ontdek alle dieren', t: (S) => Object.keys(S.seen).length >= SP.length + RARE.length },
  ],
  achNote: 'Elke prestatie geeft +3% aantrekkingskracht.',
};

export default {
  id: 'dierenpark', name: 'Dierenpark', emoji: '🦁', desc: 'Koop en verzorg dieren, trek bezoekers en adopteer zeldzame beesten.',
  async create(host, api) { return runGame(host, api, C); },
};
