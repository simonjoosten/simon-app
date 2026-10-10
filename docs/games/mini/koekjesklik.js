// Koekjesklik: eindeloze koekjesklikker
const SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'];
function fmt(n) {
  if (!isFinite(n)) return '∞';
  if (n < 1000) return n < 10 && n % 1 ? n.toFixed(1).replace('.', ',') : String(Math.floor(n));
  let i = 0;
  while (n >= 1000 && i < SUF.length - 1) { n /= 1000; i++; }
  const s = n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2);
  return s.replace(/\.?0+$/, '').replace('.', ',') + SUF[i];
}

const BUILDINGS = [
  { n: 'Cursor', e: '👆', cost: 15, cps: 0.1 },
  { n: 'Oma', e: '👵', cost: 100, cps: 1 },
  { n: 'Boerderij', e: '🌾', cost: 1100, cps: 8 },
  { n: 'Bakkerij', e: '🥖', cost: 12000, cps: 47 },
  { n: 'Fabriek', e: '🏭', cost: 130000, cps: 260 },
  { n: 'Bank', e: '🏦', cost: 1.4e6, cps: 1400 },
  { n: 'Tempel', e: '🛕', cost: 2e7, cps: 7800 },
  { n: 'Toverschool', e: '🧙', cost: 3.3e8, cps: 44000 },
  { n: 'Raketbasis', e: '🚀', cost: 5.1e9, cps: 260000 },
];

// upgrades: {n,e,cost,t:'click'|'b'|'all', i, f, req(fn state)->bool}
const UPGRADES = [];
BUILDINGS.forEach((b, i) => {
  UPGRADES.push({ n: b.n + ' x2', e: b.e, cost: b.cost * 10, t: 'b', i, f: 2, need: 5 });
  UPGRADES.push({ n: b.n + ' x2 (turbo)', e: b.e, cost: b.cost * 100, t: 'b', i, f: 2, need: 25 });
});
UPGRADES.push({ n: 'Sterke vingers', e: '💪', cost: 100, t: 'click', f: 2, tot: 50 });
UPGRADES.push({ n: 'Gouden vinger', e: '✨', cost: 5000, t: 'click', f: 2, tot: 2000 });
UPGRADES.push({ n: 'Diamanten vinger', e: '💎', cost: 250000, t: 'click', f: 2, tot: 100000 });
UPGRADES.push({ n: 'Chocoladeschilfers', e: '🍫', cost: 50000, t: 'all', f: 1.1, tot: 20000 });
UPGRADES.push({ n: 'Geheim recept', e: '📜', cost: 5e6, t: 'all', f: 1.25, tot: 2e6 });
UPGRADES.push({ n: 'Koekjesmagie', e: '🔮', cost: 5e8, t: 'all', f: 1.5, tot: 2e8 });

const ACHS = [
  { n: 'Eerste koekje', e: '🥠', ok: (s) => s.total >= 1 },
  { n: '100 koekjes', e: '🍪', ok: (s) => s.total >= 100 },
  { n: '1K koekjes', e: '🥛', ok: (s) => s.total >= 1e3 },
  { n: '100K koekjes', e: '🎂', ok: (s) => s.total >= 1e5 },
  { n: '1M koekjes', e: '🏆', ok: (s) => s.total >= 1e6 },
  { n: '1B koekjes', e: '👑', ok: (s) => s.total >= 1e9 },
  { n: '1T koekjes', e: '🌟', ok: (s) => s.total >= 1e12 },
  { n: '100 tikken', e: '👉', ok: (s) => s.clicks >= 100 },
  { n: '1000 tikken', e: '🔥', ok: (s) => s.clicks >= 1000 },
  { n: '10 gebouwen', e: '🏠', ok: (s) => s.nb >= 10 },
  { n: '100 gebouwen', e: '🏙️', ok: (s) => s.nb >= 100 },
  { n: '10 per sec', e: '⚡', ok: (s) => s.cps >= 10 },
  { n: '1K per sec', e: '🚄', ok: (s) => s.cps >= 1e3 },
  { n: '1M per sec', e: '🌋', ok: (s) => s.cps >= 1e6 },
  { n: 'Eerste gouden', e: '🌕', ok: (s) => s.golden >= 1 },
  { n: '10 gouden', e: '💰', ok: (s) => s.golden >= 10 },
  { n: '5 upgrades', e: '🛠️', ok: (s) => s.nu >= 5 },
  { n: '15 upgrades', e: '🧪', ok: (s) => s.nu >= 15 },
];

const MAX_OFFLINE = 8 * 3600 * 1000;

export default {
  id: 'koekjesklik',
  name: 'Koekjesklik',
  emoji: '🍪',
  hint: 'Tik op het koekje en bouw je koekjesimperium',
  save: 'forever',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.userSelect = 'none';
    host.style.webkitUserSelect = 'none';
    const doc = host.ownerDocument || document;
    const el = (tag, cls, txt) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

    const st = {
      cookies: 0, total: 0, clicks: 0, golden: 0,
      b: BUILDINGS.map(() => 0), up: UPGRADES.map(() => 0), ach: ACHS.map(() => 0),
      t: Date.now(),
    };
    let loaded = false, destroyed = false;
    let buffs = []; // {kind,until}
    let goldenEl = null, goldenTimer = null, spawnTimer = null;
    const timers = new Set();
    let tickIv = null, saveIv = null;
    let lastTick = Date.now();
    let toastTimer = null;

    const css = doc.createElement('style');
    css.textContent = `
.kk{position:absolute;inset:0;display:flex;flex-direction:column;background:linear-gradient(#3b2415,#1f120a);color:#fff;font-family:system-ui,sans-serif;overflow:hidden}
.kk-top{text-align:center;padding:8px 6px 0}
.kk-cnt{font-size:34px;font-weight:800;color:#ffd98a;line-height:1.1}
.kk-cps{font-size:13px;opacity:.85}
.kk-buff{min-height:18px;font-size:12px;color:#ffe066;font-weight:700}
.kk-stage{position:relative;flex:0 0 34%;display:flex;align-items:center;justify-content:center}
.kk-cookie{font-size:min(30vw,150px);line-height:1;cursor:pointer;transition:transform .08s;filter:drop-shadow(0 6px 8px #0008);-webkit-tap-highlight-color:transparent}
.kk-cookie.p{transform:scale(.9)}
.kk-float{position:absolute;pointer-events:none;font-weight:800;font-size:20px;color:#fff3c4;text-shadow:0 2px 3px #000;animation:kkup .9s ease-out forwards;z-index:5}
@keyframes kkup{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-70px)}}
.kk-gold{position:absolute;font-size:46px;cursor:pointer;z-index:8;animation:kkpulse 1s ease-in-out infinite;filter:drop-shadow(0 0 10px gold)}
@keyframes kkpulse{50%{transform:scale(1.2) rotate(10deg)}}
.kk-tabs{display:flex;gap:4px;padding:4px 6px}
.kk-tab{flex:1;padding:6px 0;border-radius:8px;border:0;background:#5a3a22;color:#fff;font-size:13px;font-weight:700}
.kk-tab.on{background:#c98a3b}
.kk-list{flex:1;overflow-y:auto;padding:4px 6px 8px;-webkit-overflow-scrolling:touch;touch-action:pan-y}
.kk-row{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;margin-bottom:5px;padding:7px 9px;border-radius:10px;border:0;background:#4a2f1c;color:#fff;text-align:left;font-size:13px}
.kk-row.ok{background:#6b8f2f}
.kk-row.done{background:#3a2a1c;opacity:.75}
.kk-row.lock{opacity:.45}
.kk-ic{font-size:26px;width:34px;text-align:center}
.kk-nm{font-weight:800;font-size:14px}
.kk-sub{font-size:11px;opacity:.85}
.kk-mid{flex:1;min-width:0}
.kk-n{font-size:22px;font-weight:800;opacity:.8}
.kk-toast{position:absolute;left:8px;right:8px;top:6px;padding:8px;border-radius:10px;background:#000c;color:#ffe9a8;text-align:center;font-size:13px;z-index:20;pointer-events:none;display:none}
`;
    host.appendChild(css);

    const root = el('div', 'kk');
    const top = el('div', 'kk-top');
    const cnt = el('div', 'kk-cnt', '0');
    const cpsE = el('div', 'kk-cps', '');
    const buffE = el('div', 'kk-buff', '');
    top.append(cnt, cpsE, buffE);
    const stage = el('div', 'kk-stage');
    const cookie = el('div', 'kk-cookie', '🍪');
    stage.appendChild(cookie);
    const tabs = el('div', 'kk-tabs');
    const tabNames = ['Gebouwen', 'Upgrades', 'Prestaties'];
    const tabBtns = tabNames.map((n, i) => {
      const b = el('button', 'kk-tab', n);
      b.type = 'button';
      b.onclick = () => { tab = i; refreshLists(); };
      tabs.appendChild(b);
      return b;
    });
    const list = el('div', 'kk-list');
    const toast = el('div', 'kk-toast');
    root.append(top, stage, tabs, list, toast);
    host.appendChild(root);
    let tab = 0;

    // ---- berekeningen ----
    const mult = {
      all() { let m = 1; UPGRADES.forEach((u, k) => { if (st.up[k] && u.t === 'all') m *= u.f; }); return m; },
      b(i) { let m = 1; UPGRADES.forEach((u, k) => { if (st.up[k] && u.t === 'b' && u.i === i) m *= u.f; }); return m; },
      click() { let m = 1; UPGRADES.forEach((u, k) => { if (st.up[k] && u.t === 'click') m *= u.f; }); return m; },
    };
    function buffMul(kind) {
      const now = Date.now();
      let m = 1;
      buffs.forEach((b) => { if (b.until > now && b.kind === kind) m *= b.f; });
      return m;
    }
    function baseCps() {
      let c = 0;
      BUILDINGS.forEach((b, i) => { c += st.b[i] * b.cps * mult.b(i); });
      return c * mult.all();
    }
    const cps = () => baseCps() * buffMul('cps');
    function clickVal() {
      // klik = 1 + 5% van cps (basis), x klikbonussen
      return (1 + baseCps() * 0.05) * mult.click() * buffMul('click');
    }
    const price = (i) => Math.ceil(BUILDINGS[i].cost * Math.pow(1.15, st.b[i]));
    const nb = () => st.b.reduce((a, c) => a + c, 0);
    const nu = () => st.up.reduce((a, c) => a + c, 0);
    function upVisible(k) {
      const u = UPGRADES[k];
      if (u.t === 'b') return st.b[u.i] >= u.need;
      return st.total >= u.tot;
    }

    function addCookies(n) {
      st.cookies += n;
      st.total += n;
    }

    // ---- UI ----
    function showToast(msg) {
      toast.textContent = msg;
      toast.style.display = 'block';
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 3000);
    }
    function later(fn, ms) {
      const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
      timers.add(id);
      return id;
    }
    function floatText(txt, x, y) {
      const f = el('div', 'kk-float', txt);
      f.style.left = Math.max(0, x - 20) + 'px';
      f.style.top = y + 'px';
      stage.appendChild(f);
      later(() => { if (f.parentNode) f.parentNode.removeChild(f); }, 950);
    }

    let rows = [];
    function refreshLists() {
      tabBtns.forEach((b, i) => b.classList.toggle('on', i === tab));
      list.textContent = '';
      rows = [];
      if (tab === 0) {
        BUILDINGS.forEach((b, i) => {
          const r = el('button', 'kk-row');
          r.type = 'button';
          const ic = el('div', 'kk-ic', b.e);
          const mid = el('div', 'kk-mid');
          const nm = el('div', 'kk-nm', b.n);
          const sub = el('div', 'kk-sub');
          mid.append(nm, sub);
          const n = el('div', 'kk-n');
          r.append(ic, mid, n);
          r.onclick = () => buyBuilding(i);
          list.appendChild(r);
          rows.push({ r, sub, n, i });
        });
      } else if (tab === 1) {
        let any = false;
        UPGRADES.forEach((u, k) => {
          if (st.up[k] || !upVisible(k)) return;
          any = true;
          const r = el('button', 'kk-row');
          r.type = 'button';
          const ic = el('div', 'kk-ic', u.e);
          const mid = el('div', 'kk-mid');
          const desc = u.t === 'click' ? 'Tikken x' + u.f : u.t === 'all' ? 'Alles +' + Math.round((u.f - 1) * 100) + '%' : u.n.split(' x2')[0] + ' x2';
          mid.append(el('div', 'kk-nm', u.n), el('div', 'kk-sub', desc));
          const c = el('div', 'kk-nm', '🍪 ' + fmt(u.cost));
          r.append(ic, mid, c);
          r.onclick = () => buyUpgrade(k);
          list.appendChild(r);
          rows.push({ r, k });
        });
        if (!any) list.appendChild(el('div', 'kk-sub', 'Geen upgrades beschikbaar. Koop meer gebouwen en bak meer koekjes!'));
        list.appendChild(el('div', 'kk-sub', 'Gekocht: ' + nu() + ' / ' + UPGRADES.length));
      } else {
        ACHS.forEach((a, k) => {
          const r = el('div', 'kk-row ' + (st.ach[k] ? 'done' : 'lock'));
          r.append(el('div', 'kk-ic', st.ach[k] ? a.e : '🔒'), el('div', 'kk-nm', a.n));
          list.appendChild(r);
        });
      }
      updateUI();
    }

    function updateUI() {
      cnt.textContent = fmt(Math.floor(st.cookies)) + ' koekjes';
      cpsE.textContent = 'per seconde: ' + fmt(cps()) + ' · per tik: ' + fmt(clickVal());
      const now = Date.now();
      buffs = buffs.filter((b) => b.until > now);
      buffE.textContent = buffs.map((b) => b.label + ' ' + Math.ceil((b.until - now) / 1000) + 's').join(' · ');
      if (tab === 0) {
        rows.forEach((o) => {
          const p = price(o.i);
          o.r.className = 'kk-row' + (st.cookies >= p ? ' ok' : '');
          o.sub.textContent = '🍪 ' + fmt(p) + ' · ' + fmt(BUILDINGS[o.i].cps * mult.b(o.i) * mult.all()) + '/s per stuk';
          o.n.textContent = st.b[o.i];
        });
      } else if (tab === 1) {
        rows.forEach((o) => {
          o.r.className = 'kk-row' + (st.cookies >= UPGRADES[o.k].cost ? ' ok' : '');
        });
      }
    }

    // ---- acties ----
    function checkAch() {
      const s = { total: st.total, clicks: st.clicks, nb: nb(), nu: nu(), cps: baseCps(), golden: st.golden };
      let changed = false;
      ACHS.forEach((a, k) => {
        if (!st.ach[k] && a.ok(s)) {
          st.ach[k] = 1; changed = true;
          showToast('Prestatie: ' + a.e + ' ' + a.n + '!');
        }
      });
      if (changed && tab === 2) refreshLists();
      return changed;
    }
    function persist() {
      if (!loaded) return;
      st.t = Date.now();
      try {
        api.save({ c: st.cookies, T: st.total, k: st.clicks, g: st.golden, b: st.b.slice(), u: st.up.slice(), a: st.ach.slice(), t: st.t });
      } catch (e) { /* negeren */ }
    }
    function score() { api.score(Math.floor(st.total)); }

    function buyBuilding(i) {
      const p = price(i);
      if (st.cookies < p) return;
      st.cookies -= p; st.b[i]++;
      checkAch(); persist(); updateUI();
    }
    function buyUpgrade(k) {
      const u = UPGRADES[k];
      if (st.up[k] || st.cookies < u.cost) return;
      st.cookies -= u.cost; st.up[k] = 1;
      checkAch(); persist(); refreshLists();
    }
    function tap(x, y) {
      const v = clickVal();
      addCookies(v);
      st.clicks++;
      floatText('+' + fmt(v), x, y);
      cookie.classList.add('p');
      later(() => cookie.classList.remove('p'), 80);
      checkAch(); score(); updateUI();
    }
    const onDown = (ev) => {
      ev.preventDefault();
      const r = stage.getBoundingClientRect();
      const x = (ev.clientX || 0) - r.left + (Math.random() * 40 - 20);
      const y = (ev.clientY || 0) - r.top - 20;
      tap(x, y);
    };
    cookie.addEventListener('pointerdown', onDown);

    // ---- gouden koekjes ----
    function scheduleGolden() {
      if (destroyed) return;
      spawnTimer = later(spawnGolden, 40000 + Math.random() * 80000);
    }
    function removeGolden() {
      if (goldenEl && goldenEl.parentNode) goldenEl.parentNode.removeChild(goldenEl);
      goldenEl = null;
      if (goldenTimer) { clearTimeout(goldenTimer); timers.delete(goldenTimer); goldenTimer = null; }
    }
    function spawnGolden() {
      if (destroyed) return;
      removeGolden();
      const g = el('div', 'kk-gold', '🌕');
      const w = host.clientWidth || api.w || 360, h = host.clientHeight || api.h || 640;
      g.style.left = Math.floor(20 + Math.random() * Math.max(10, w - 90)) + 'px';
      g.style.top = Math.floor(70 + Math.random() * Math.max(10, h * 0.45)) + 'px';
      g.addEventListener('pointerdown', (ev) => { ev.preventDefault(); clickGolden(); });
      root.appendChild(g);
      goldenEl = g;
      goldenTimer = later(() => { removeGolden(); scheduleGolden(); }, 13000);
    }
    function clickGolden() {
      removeGolden();
      st.golden++;
      const r = Math.random(), now = Date.now();
      if (r < 0.4) {
        buffs.push({ kind: 'cps', f: 7, until: now + 30000, label: '🔥 Razernij x7' });
        showToast('Razernij! Productie x7 voor 30s');
      } else if (r < 0.7) {
        buffs.push({ kind: 'click', f: 10, until: now + 15000, label: '👆 Tik-bonus x10' });
        showToast('Tik-bonus! Tikken x10 voor 15s');
      } else {
        const gain = Math.min(cps() * 900, st.cookies * 0.15) + 13;
        addCookies(gain);
        showToast('Geluk! +' + fmt(gain) + ' koekjes');
      }
      checkAch(); score(); persist(); updateUI();
      scheduleGolden();
    }

    // ---- tikken van de klok ----
    function tick() {
      if (!loaded || destroyed) return;
      const now = Date.now();
      const dt = Math.min(1, Math.max(0, (now - lastTick) / 1000));
      lastTick = now;
      const c = cps() * dt;
      if (c > 0) addCookies(c);
      score();
      if (checkAch() && tab === 0) updateUI();
      updateUI();
    }

    api.load().then((s) => {
      if (destroyed) return;
      let msg = '';
      if (s && typeof s === 'object') {
        const num = (v) => (typeof v === 'number' && isFinite(v) && v >= 0 ? v : 0);
        st.cookies = num(s.c); st.total = Math.max(num(s.T), st.cookies);
        st.clicks = num(s.k); st.golden = num(s.g);
        if (Array.isArray(s.b)) BUILDINGS.forEach((_, i) => { st.b[i] = Math.floor(num(s.b[i])); });
        if (Array.isArray(s.u)) UPGRADES.forEach((_, i) => { st.up[i] = s.u[i] ? 1 : 0; });
        if (Array.isArray(s.a)) ACHS.forEach((_, i) => { st.ach[i] = s.a[i] ? 1 : 0; });
        const last = num(s.t);
        const dt = last ? Math.min(MAX_OFFLINE, Math.max(0, Date.now() - last)) : 0;
        if (dt > 5000) {
          const gain = baseCps() * (dt / 1000);
          if (gain > 0) { addCookies(gain); msg = 'Welkom terug! Je bakkers bakten ' + fmt(gain) + ' koekjes terwijl je weg was.'; }
        }
      }
      loaded = true;
      lastTick = Date.now();
      refreshLists();
      checkAch();
      score();
      if (msg) showToast(msg);
      persist();
      tickIv = setInterval(tick, 100);
      saveIv = setInterval(persist, 10000);
      scheduleGolden();
    }).catch(() => {
      if (destroyed) return;
      loaded = true;
      lastTick = Date.now();
      refreshLists();
      tickIv = setInterval(tick, 100);
      saveIv = setInterval(persist, 10000);
      scheduleGolden();
    });

    refreshLists();

    return {
      destroy() {
        if (destroyed) return;
        persist();
        destroyed = true;
        if (tickIv) clearInterval(tickIv);
        if (saveIv) clearInterval(saveIv);
        if (toastTimer) clearTimeout(toastTimer);
        timers.forEach((id) => clearTimeout(id));
        timers.clear();
        cookie.removeEventListener('pointerdown', onDown);
        removeGolden();
        if (root.parentNode) root.parentNode.removeChild(root);
        if (css.parentNode) css.parentNode.removeChild(css);
      },
    };
  },
};
