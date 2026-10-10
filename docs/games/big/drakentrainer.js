// Drakentrainer: broed eieren uit, voed en train draken, win wedstrijden en vind zeldzame soorten.
const fmt = (n) => {
  n = Math.floor(n);
  if (n < 1000) return String(n);
  const u = ['K', 'M', 'B', 'T'];
  let i = -1, v = n;
  while (v >= 1000 && i < 3) { v /= 1000; i++; }
  return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : v.toFixed(0)).replace('.', ',') + u[i];
};
const H = (tag, css, txt, p) => {
  const e = document.createElement(tag);
  if (css) e.style.cssText = css;
  if (txt != null) e.textContent = txt;
  if (p) p.appendChild(e);
  return e;
};
const BTN = 'min-height:44px;padding:8px 12px;border:0;border-radius:12px;font:600 14px system-ui;color:#fff;background:linear-gradient(135deg,#db2777,#7c3aed);cursor:pointer;';
const B = (txt, fn, p, css, dis) => {
  const b = H('button', BTN + (css || '') + (dis ? 'opacity:.4;' : ''), txt, p);
  b.onclick = () => { if (!dis) fn(); };
  return b;
};
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const time = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return s >= 60 ? Math.floor(s / 60) + 'm ' + (s % 60) + 's' : s + 's';
};

const SP = [
  { n: 'Vlamdrakie', e: '🔥', r: 0, m: 'p' }, { n: 'Waterdrakie', e: '💧', r: 0, m: 's' }, { n: 'Bladerdrakie', e: '🌿', r: 0, m: 'c' },
  { n: 'Zandwyrm', e: '🏜️', r: 0, m: 'p' }, { n: 'Donderdraak', e: '⚡', r: 1, m: 's' }, { n: 'IJsdraak', e: '❄️', r: 1, m: 'c' },
  { n: 'Schaduwdraak', e: '🌑', r: 1, m: 'p' }, { n: 'Zonnedraak', e: '☀️', r: 2, m: 'c' }, { n: 'Kristaldraak', e: '💎', r: 2, m: 's' },
  { n: 'Stormdraak', e: '🌪️', r: 2, m: 'p' }, { n: 'Regenboogdraak', e: '🌈', r: 3, m: 'c' }, { n: 'Sterrendraak', e: '⭐', r: 3, m: 's' },
];
const RAR = ['Gewoon', 'Zeldzaam', 'Episch', 'Legendarisch'];
const RCOL = ['#94a3b8', '#38bdf8', '#c084fc', '#fbbf24'];
const EGGS = [
  { n: 'Gewoon ei', e: '🥚', cost: 40, t: 30, w: [70, 25, 5, 0] },
  { n: 'Gespikkeld ei', e: '🪺', cost: 250, t: 120, w: [0, 50, 40, 10] },
  { n: 'Gouden ei', e: '🌟', cost: 1500, t: 600, w: [0, 0, 60, 40] },
];
const STAT = { p: ['💪', 'Kracht'], s: ['💨', 'Snelheid'], c: ['✨', 'Charme'] };
const COMP = [
  { k: 'p', n: 'Vechtarena', e: '🥊' }, { k: 's', n: 'Drakenrace', e: '🏁' }, { k: 'c', n: 'Schoonheidsshow', e: '🎪' },
];
const TIERS = [{ n: 'Beginners', lv: 12, cost: 10, rew: 40 }, { n: 'Gevorderden', lv: 40, cost: 40, rew: 200 }, { n: 'Meesters', lv: 110, cost: 150, rew: 1000 }];

export default {
  id: 'drakentrainer', name: 'Drakentrainer', emoji: '🐲', desc: 'Broed eieren uit, train draken en win wedstrijden.',
  async create(host, api) {
    const def = { coins: 120, eggs: [{ id: 1, t: 0, h: 0 }], dragons: [], slots: 2, nid: 2, trophies: 0, dex: {}, last: Date.now(), frac: 0, wins: 0 };
    let S = Object.assign({}, def, (await api.load()) || {});
    if (S.eggs.length === 1 && S.eggs[0].h === 0) S.eggs[0].h = Date.now() + 15000;
    let alive = true, tab = 'eggs', msg = '';
    host.style.cssText += ';background:linear-gradient(#2a1040,#12071f);color:#fbeaff;font-family:system-ui,sans-serif;';
    const root = H('div', 'max-width:430px;margin:0 auto;padding:10px;box-sizing:border-box;', null, host);
    const save = () => { S.last = Date.now(); api.save(S); };

    const mood = (d) => Math.max(0, Math.min(100, d.mood - (Date.now() - d.mt) / 20000));
    const income = (d) => (mood(d) >= 30 ? (d.lv + (d.p + d.s + d.c) / 10) * (1 + SP[d.sp].r * 0.8) / 60 : 0); // munten per seconde
    const energy = (d) => Math.min(5, d.en + (Date.now() - d.et) / 30000);
    const totalIncome = () => S.dragons.reduce((a, d) => a + income(d), 0);

    // offline inkomsten
    const away = Math.min((Date.now() - (S.last || Date.now())) / 1000, 8 * 3600);
    if (away > 30) {
      const g = Math.floor(totalIncome() * away * 0.8);
      if (g > 0) { S.coins += g; msg = 'Je draken verdienden ' + fmt(g) + ' munten terwijl je weg was!'; api.toast('Offline: +' + fmt(g) + ' munten'); }
    }

    function hatch(egg) {
      const w = EGGS[egg.t].w;
      let x = rnd(1, 100), r = 0, acc = 0;
      for (let i = 0; i < 4; i++) { acc += w[i]; if (x <= acc) { r = i; break; } }
      const list = SP.map((s, i) => i).filter((i) => SP[i].r === r);
      const si = list[rnd(0, list.length - 1)];
      const sp = SP[si];
      const d = { id: S.nid++, sp: si, name: sp.n, lv: 1, xp: 0, p: 3 + sp.r * 3 + rnd(0, 3), s: 3 + sp.r * 3 + rnd(0, 3), c: 3 + sp.r * 3 + rnd(0, 3), mood: 60, mt: Date.now(), en: 5, et: Date.now() };
      d[sp.m] += 3;
      S.dragons.push(d); S.dex[si] = (S.dex[si] || 0) + 1;
      S.eggs = S.eggs.filter((x2) => x2.id !== egg.id);
      msg = '🎉 Het ei is uitgekomen: ' + sp.e + ' ' + sp.n + ' (' + RAR[sp.r] + ')!';
      api.toast('Nieuwe draak: ' + sp.n);
    }
    const addXp = (d, x) => {
      d.xp += x;
      while (d.xp >= d.lv * 20) { d.xp -= d.lv * 20; d.lv++; d.p++; d.s++; d.c++; msg += ' ⭐ ' + d.name + ' is level ' + d.lv + '!'; }
    };

    function tick() {
      if (!alive) return;
      S.frac += totalIncome();
      if (S.frac >= 1) { S.coins += Math.floor(S.frac); S.frac -= Math.floor(S.frac); }
      let hatched = false;
      S.eggs.slice().forEach((e) => { if (e.h && Date.now() >= e.h) { hatch(e); hatched = true; } });
      if (hatched) { save(); render(); return; }
      labels();
    }
    function labels() {
      root.querySelectorAll('[data-coins]').forEach((el) => { el.textContent = '🪙 ' + fmt(S.coins) + ' (+' + (totalIncome() * 60).toFixed(1).replace('.', ',') + '/min)'; });
      root.querySelectorAll('[data-hatch]').forEach((el) => { el.textContent = time(Number(el.getAttribute('data-hatch')) - Date.now()); });
    }

    function render() {
      if (!alive) return;
      const st = host.scrollTop;
      root.innerHTML = '';
      const top = H('div', 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;', null, root);
      H('div', 'font:800 19px system-ui;', '🐲 Drakentrainer', top);
      H('div', 'font:700 13px system-ui;background:#0006;padding:6px 10px;border-radius:16px;', '', top).setAttribute('data-coins', '1');
      const tabs = H('div', 'display:flex;gap:5px;margin-bottom:8px;', null, root);
      [['eggs', '🥚'], ['dragons', '🐲'], ['comp', '🏆'], ['book', '📖']].forEach(([k, l]) => B(l, () => { tab = k; msg = ''; render(); }, tabs, 'flex:1;font-size:18px;' + (tab === k ? '' : 'background:#3a2252;')));
      if (msg) { H('div', 'background:#4a1d6b;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:14px;', msg, root); }
      if (tab === 'eggs') eggsUI(); else if (tab === 'dragons') dragonsUI(); else if (tab === 'comp') compUI(); else bookUI();
      host.scrollTop = st;
      labels();
    }
    const card = (css) => H('div', 'background:#35194f;border-radius:14px;padding:10px;margin-bottom:8px;' + (css || ''), null, root);

    function eggsUI() {
      H('div', 'font-weight:700;margin-bottom:6px;', 'Broedmachine (' + S.eggs.length + '/' + S.slots + ')', root);
      S.eggs.forEach((e) => {
        const c = card('display:flex;align-items:center;gap:10px;');
        H('div', 'font-size:40px;', EGGS[e.t].e, c);
        const m = H('div', 'flex:1;', null, c);
        H('div', 'font-weight:700;', EGGS[e.t].n, m);
        const t = H('div', 'font-size:13px;', '', m); t.setAttribute('data-hatch', String(e.h));
        B('Sneller (🪙' + Math.round(EGGS[e.t].cost / 2) + ')', () => { const cst = Math.round(EGGS[e.t].cost / 2); S.coins -= cst; e.h = Math.max(Date.now(), e.h - EGGS[e.t].t * 500); save(); render(); }, c, 'font-size:12px;', S.coins < Math.round(EGGS[e.t].cost / 2));
      });
      if (!S.eggs.length) H('div', 'opacity:.7;font-size:13px;margin-bottom:8px;', 'De broedmachine is leeg. Koop een ei!', root);
      H('div', 'font-weight:700;margin:8px 0 4px;', 'Eieren kopen', root);
      EGGS.forEach((g, i) => {
        const chances = g.w.map((w, r) => (w ? RAR[r] + ' ' + w + '%' : '')).filter(Boolean).join(', ');
        const c = card();
        H('div', 'font-weight:700;', g.e + ' ' + g.n + ' · broedt ' + time(g.t * 1000), c);
        H('div', 'font-size:12px;opacity:.8;margin:2px 0 6px;', chances, c);
        B('Koop 🪙' + fmt(g.cost), () => { S.coins -= g.cost; S.eggs.push({ id: S.nid++, t: i, h: Date.now() + g.t * 1000 }); save(); render(); }, c, 'width:100%;', S.coins < g.cost || S.eggs.length >= S.slots);
      });
      const sc = 300 * Math.pow(3, S.slots - 2);
      B('Extra broedplek (🪙' + fmt(sc) + ')', () => { S.coins -= sc; S.slots++; save(); render(); }, root, 'width:100%;background:#0f766e;', S.coins < sc || S.slots >= 8);
    }

    function dragonsUI() {
      if (!S.dragons.length) { H('div', 'opacity:.8;', 'Nog geen draken. Wacht tot je ei uitkomt!', root); return; }
      S.dragons.slice().sort((a, b) => SP[b.sp].r - SP[a.sp].r || b.lv - a.lv).forEach((d) => {
        const sp = SP[d.sp], m = mood(d), en = energy(d);
        const c = card('border-left:5px solid ' + RCOL[sp.r] + ';');
        H('div', 'font:700 15px system-ui;', sp.e + '🐲 ' + d.name + ' · lvl ' + d.lv, c);
        H('div', 'font-size:12px;opacity:.85;margin:2px 0;', RAR[sp.r] + ' · 💪' + d.p + ' 💨' + d.s + ' ✨' + d.c + ' · xp ' + d.xp + '/' + d.lv * 20, c);
        H('div', 'font-size:12px;', (m >= 30 ? '😊' : '😫') + ' stemming ' + Math.round(m) + '% · ⚡ energie ' + Math.floor(en) + '/5 · 🪙 ' + (income(d) * 60).toFixed(1).replace('.', ',') + '/min', c);
        const row = H('div', 'display:flex;gap:5px;margin-top:6px;flex-wrap:wrap;', null, c);
        B('🍖 Voer (🪙' + (5 + d.lv * 2) + ')', () => { const cst = 5 + d.lv * 2; S.coins -= cst; d.mood = Math.min(100, m + 30); d.mt = Date.now(); addXp(d, 6); save(); render(); }, row, 'flex:1 1 100%;font-size:13px;background:#b45309;', S.coins < 5 + d.lv * 2);
        ['p', 's', 'c'].forEach((k) => {
          const cst = 10 + d.lv * 6;
          B(STAT[k][0] + ' Train (🪙' + cst + ')', () => {
            S.coins -= cst; d.en = en - 1; d.et = Date.now(); d[k] += 2; addXp(d, 8); save(); render();
          }, row, 'flex:1;font-size:12px;padding:6px;', S.coins < cst || en < 1);
        });
        const nb = B('✏️ Naam', () => {
          const inp = H('input', 'width:100%;min-height:40px;box-sizing:border-box;margin-top:6px;border-radius:8px;border:0;padding:6px;font-size:16px;', null, c);
          inp.value = d.name; inp.maxLength = 14; inp.focus();
          let done = false;
          const fin = () => { if (done) return; done = true; d.name = inp.value.trim() || sp.n; save(); render(); };
          inp.onkeydown = (ev) => { if (ev.key === 'Enter') fin(); };
          inp.onblur = fin;
        }, row, 'flex:1 1 100%;font-size:12px;background:#4b3366;min-height:36px;');
      });
    }

    function compUI() {
      H('div', 'font-size:13px;opacity:.85;margin-bottom:6px;', '🏆 Trofeeën: ' + S.trophies + ' · gewonnen: ' + S.wins + '. Kies een wedstrijd en een draak. Hongerige draken (stemming < 30%) presteren slechter.', root);
      COMP.forEach((cp) => {
        const c = card();
        H('div', 'font:700 15px system-ui;margin-bottom:4px;', cp.e + ' ' + cp.n + ' (' + STAT[cp.k][1] + ')', c);
        TIERS.forEach((t, ti) => {
          const row = H('div', 'margin-top:5px;', null, c);
          H('div', 'font-size:12px;opacity:.8;', t.n + ' (tegenstander ' + STAT[cp.k][0] + t.lv + ') · inzet 🪙' + t.cost + ' · prijs 🪙' + t.rew, row);
          const r2 = H('div', 'display:flex;gap:5px;flex-wrap:wrap;margin-top:3px;', null, row);
          S.dragons.forEach((d) => {
            const sel = B(SP[d.sp].e + d.name + ' ' + STAT[cp.k][0] + d[cp.k], () => {
              S.coins -= t.cost;
              const mul = mood(d) >= 30 ? 1 : 0.7;
              const mine = d[cp.k] * mul * (0.7 + Math.random() * 0.6);
              const opp = t.lv * (0.7 + Math.random() * 0.6);
              if (mine >= opp) {
                S.coins += t.rew; S.trophies++; S.wins++; addXp(d, 10 + ti * 15);
                msg = '🏆 ' + d.name + ' wint de ' + cp.n + ' (' + t.n + ')! +🪙' + t.rew + ' en een trofee.';
              } else { addXp(d, 3); msg = '😢 ' + d.name + ' verliest (' + Math.round(mine) + ' tegen ' + Math.round(opp) + '). Train harder!'; }
              save(); render();
            }, r2, 'font-size:12px;padding:4px 8px;min-height:44px;', S.coins < t.cost);
          });
          if (!S.dragons.length) H('div', 'font-size:12px;', 'Je hebt een draak nodig.', row);
        });
      });
    }

    function bookUI() {
      H('div', 'margin-bottom:6px;font-weight:700;', 'Drakenboek: ' + Object.keys(S.dex).length + '/' + SP.length + ' ontdekt', root);
      SP.forEach((s, i) => {
        const found = !!S.dex[i];
        const c = card('display:flex;align-items:center;gap:10px;border-left:5px solid ' + RCOL[s.r] + ';' + (found ? '' : 'opacity:.55;'));
        H('div', 'font-size:30px;', found ? s.e + '🐲' : '❓', c);
        H('div', 'font-size:13px;', found ? s.n + ' · ' + RAR[s.r] + ' · hoofdstat ' + STAT[s.m][1] + ' · aantal: ' + S.dex[i] : 'Nog niet ontdekt (' + RAR[s.r] + ')', c);
      });
    }

    render();
    const iv = setInterval(tick, 1000);
    const iv2 = setInterval(() => { if (alive) save(); }, 10000);
    return { destroy() { alive = false; clearInterval(iv); clearInterval(iv2); save(); } };
  },
};
