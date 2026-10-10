const fmt = n => { n = Math.floor(n || 0); if (n < 1000) return String(n); const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi']; let i = -1, v = n; while (v >= 1000 && i < u.length - 1) { v /= 1000; i++; } return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : v.toFixed(0)).replace('.', ',') + u[i]; };
const $ = (t, css, txt, p) => { const e = document.createElement(t); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; if (p) p.appendChild(e); return e; };
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmtT = s => { s = Math.max(0, Math.ceil(s)); return s >= 3600 ? Math.floor(s / 3600) + 'u ' + Math.floor(s % 3600 / 60) + 'm' : s >= 60 ? Math.floor(s / 60) + 'm ' + (s % 60) + 's' : s + 's'; };
function btn(p, label, fn, dis, css) { const b = $('button', 'min-height:44px;border:0;border-radius:12px;padding:8px 12px;font-weight:700;font-size:14px;color:#fff;background:linear-gradient(#4f8cff,#2f5fd0);cursor:pointer;margin:3px 0;' + (dis ? 'opacity:.4;' : '') + (css || ''), label, p); b.addEventListener('click', () => { if (!dis) fn(); }); return b; }
function card(p, css) { return $('div', 'background:rgba(255,255,255,.1);border-radius:14px;padding:10px;margin:8px 0;' + (css || ''), null, p); }
function bar(p, pct, color) { const o = $('div', 'height:10px;background:rgba(0,0,0,.35);border-radius:6px;overflow:hidden;margin:4px 0', null, p); $('div', 'height:100%;width:' + (clamp(pct, 0, 1) * 100) + '%;background:' + (color || '#4ade80'), null, o); return o; }
function row(p, css) { return $('div', 'display:flex;align-items:center;gap:8px;' + (css || ''), null, p); }
function app(host, api, o) {
  host.style.background = o.bg; host.style.color = '#fff'; host.style.fontFamily = 'system-ui,-apple-system,sans-serif'; host.style.overflowY = 'auto';
  const root = $('div', 'max-width:430px;margin:0 auto;padding:10px 10px 30px;box-sizing:border-box', null, host);
  const head = $('div', '', null, root);
  const tb = $('div', 'display:flex;gap:4px;margin:8px 0;position:sticky;top:0;z-index:5;padding:4px 0;background:' + o.bg, null, root);
  const body = $('div', '', null, root);
  let tab = o.tabs[0][0], down = false, dead = false, last = Date.now();
  const dn = () => { down = true; }, up = () => { down = false; };
  host.addEventListener('pointerdown', dn); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  const A = {
    tab: () => tab,
    go(t) { tab = t; A.render(); },
    render() {
      if (dead) return;
      head.replaceChildren(); o.head(head);
      tb.replaceChildren();
      for (const [id, l] of o.tabs) { const b = $('button', 'flex:1;min-height:44px;border:0;border-radius:10px;font-weight:700;font-size:12px;padding:2px;cursor:pointer;color:#fff;background:' + (id === tab ? o.acc : 'rgba(255,255,255,.12)'), l, tb); b.addEventListener('click', () => A.go(id)); }
      body.replaceChildren(); o.render(tab, body);
    },
    commit() { A.render(); api.save(o.state()); },
  };
  A.render();
  const iv = setInterval(() => { const n = Date.now(), dt = Math.min((n - last) / 1000, 60); last = n; if (o.tick) o.tick(dt); if (!down) A.render(); }, 1000);
  const sv = setInterval(() => api.save(o.state()), 10000);
  A.destroy = () => { dead = true; clearInterval(iv); clearInterval(sv); host.removeEventListener('pointerdown', dn); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); try { api.save(o.state()); } catch (e) {} };
  return A;
}
const EL = [{ id: 'vuur', n: 'Vuur', e: '🔥' }, { id: 'ijs', n: 'IJs', e: '❄️' }, { id: 'storm', n: 'Storm', e: '⚡' }, { id: 'aarde', n: 'Aarde', e: '🪨' }, { id: 'licht', n: 'Licht', e: '✨' }];
const SPELLS = [{ id: 'vuur', n: 'Vuurbal', c: 0, m: 6, d: 10 }, { id: 'ijs', n: 'IJspijl', c: 80, m: 6, d: 10 }, { id: 'storm', n: 'Bliksemflits', c: 400, m: 8, d: 14 }, { id: 'aarde', n: 'Rotsgooi', c: 1500, m: 8, d: 14 }, { id: 'licht', n: 'Lichtstraal', c: 6000, m: 10, d: 20 }];
const ING = [{ id: 'bloem', n: 'Maanbloem', e: '🌸' }, { id: 'zwam', n: 'Magische zwam', e: '🍄' }, { id: 'kristal', n: 'Kristal', e: '💎' }, { id: 'bes', n: 'IJsbes', e: '🫐' }, { id: 'wortel', n: 'Vuurwortel', e: '🌶️' }, { id: 'schub', n: 'Drakenschub', e: '🐲' }];
const LOCS = [{ n: 'Fluisterbos', e: '🌲', t: 25, loot: ['bloem', 'zwam'] }, { n: 'Kristalgrot', e: '🕳️', t: 45, loot: ['kristal', 'bes', 'zwam'] }, { n: 'Drakenvulkaan', e: '🌋', t: 80, loot: ['wortel', 'schub', 'kristal'] }];
const POT = [
  { id: 'heal', n: 'Genezingsdrank', e: '🧪', in: { zwam: 2, bloem: 1 }, v: 25, d: 'Herstelt 50% levenskracht in de toren.' },
  { id: 'mana', n: 'Manadrank', e: '🔵', in: { kristal: 1, bloem: 2 }, v: 30, d: 'Herstelt 40 mana.' },
  { id: 'kracht', n: 'Krachtdrank', e: '🟠', in: { wortel: 2, schub: 1 }, v: 90, d: 'Je volgende 3 spreuken doen 1,5x schade.' },
  { id: 'schild', n: 'Schilddrank', e: '🛡️', in: { bes: 2, kristal: 1 }, v: 70, d: 'Blokkeert de volgende monsteraanval.' },
];
const MON = ['Slijmerd 🟢', 'Skelet 💀', 'Spook 👻', 'Gnoom 🧌', 'Kobold 👺', 'Mummie 🧟', 'Draakje 🐉', 'Heks 🧙‍♀️'];
const FLOORS = [{ id: 'tuin', n: 'Kruidentuin', e: '🌿', c: 120, d: 'Laat Maanbloemen en zwammen groeien.' }, { id: 'lib', n: 'Bibliotheek', e: '📚', c: 200, d: 'Spreuken worden sterker per niveau.' }, { id: 'lab', n: 'Alchemielab', e: '⚗️', c: 300, d: 'Extra ketel om drankjes te brouwen.' }, { id: 'mana', n: 'Manakamer', e: '🔮', c: 250, d: 'Meer mana en snellere regeneratie.' }, { id: 'uitk', n: 'Uitkijktoren', e: '🔭', c: 350, d: 'Expedities gaan sneller en leveren meer op.' }];
const fe = n => '🪙' + fmt(n);
export default {
  id: 'magierstoren', name: 'Magiërstoren', emoji: '🧙', desc: 'Bouw je toren, brouw drankjes en beklim de gevaarlijke torens.',
  async create(host, api) {
    const d = await api.load();
    const S = Object.assign({ gold: 60, mana: 50, ing: { bloem: 3, zwam: 2 }, pot: {}, spl: { vuur: 1 }, fl: { tuin: 0, lib: 0, lab: 0, mana: 0, uitk: 0 }, exp: [], brew: [], best: 0, run: null, log: [], last: Date.now(), tuinAt: Date.now() }, d || {});
    const maxMana = () => 50 + 25 * S.fl.mana, regen = () => 1 + .5 * S.fl.mana;
    const cauldrons = () => 1 + S.fl.lab;
    const sdmg = sp => SPELLS.find(x => x.id === sp).d * (1 + .3 * (S.spl[sp] - 1)) * (1 + .1 * S.fl.lib);
    const add = (id, n) => { S.ing[id] = (S.ing[id] || 0) + n; };
    const settle = (dt) => {
      S.mana = Math.min(maxMana(), S.mana + regen() * dt);
      if (S.fl.tuin) { S.tuinAt = (S.tuinAt || 0) + dt; const per = 20 / S.fl.tuin; while (S.tuinAt >= per && dt < 90000) { S.tuinAt -= per; add(S.tuinAt % 2 < 1 ? 'bloem' : 'zwam', 1); if (S.ing.bloem + S.ing.zwam > 200) break; } }
      const now = Date.now();
      S.exp = S.exp.filter(x => { if (x.end > now) return true; const L = LOCS[x.loc], got = {}; const n = ri(3, 5) + S.fl.uitk; for (let i = 0; i < n; i++) { const k = pick(L.loot); add(k, 1); got[k] = (got[k] || 0) + 1; } api.toast('🧭 ' + L.n + ': ' + Object.keys(got).map(k => got[k] + ING.find(i => i.id === k).e).join(' ')); return false; });
      S.brew = S.brew.filter(x => { if (x.end > now) return true; S.pot[x.p] = (S.pot[x.p] || 0) + 1; api.toast('⚗️ Klaar: ' + POT.find(p => p.id === x.p).n); return false; });
    };
    const off = Math.min((Date.now() - S.last) / 1000, 28800);
    if (off > 1) { const tuinG = S.fl.tuin ? Math.floor(Math.min(off, 3600) / (20 / S.fl.tuin)) : 0; S.tuinAt = 0; settle(Math.min(off, 3600 * 8)); if (tuinG > 0) api.toast('🌿 De tuin leverde ' + tuinG + ' ingrediënten'); }
    S.last = Date.now();
    const newMon = () => { const fl = S.run.floor, boss = fl % 5 === 0; const hp = Math.round((18 + fl * 9 + fl * fl * .6) * (boss ? 2.5 : 1)); S.run.mon = { n: (boss ? 'BAAS ' : '') + pick(MON), hp, mhp: hp, wk: EL[(fl * 7 + 3) % 5].id, atk: Math.round((4 + fl * 1.6) * (boss ? 1.5 : 1)) }; };
    const hit = () => { const m = S.run.mon; if (S.run.shield) { S.run.shield = false; S.log.unshift('🛡️ Je schild blokkeert de aanval!'); } else { S.run.hp -= m.atk; S.log.unshift(m.n + ' raakt je voor ' + m.atk + '.'); } if (S.run.hp <= 0) { S.log.unshift('💀 Je valt op verdieping ' + S.run.floor + '. Je wordt naar huis gedragen.'); S.gold += S.run.loot; S.run = null; } };
    const cast = sp => {
      const SP = SPELLS.find(x => x.id === sp); S.mana -= SP.m; const m = S.run.mon;
      let dmg = sdmg(sp) * (m.wk === sp ? 2 : 1) * rnd(.9, 1.1); if (S.run.boost > 0) { dmg *= 1.5; S.run.boost--; }
      dmg = Math.round(dmg); m.hp -= dmg; S.log.unshift(SP.n + ' doet ' + dmg + (m.wk === sp ? ' (zwakte!)' : '') + '.');
      if (m.hp <= 0) { const g = Math.round(S.run.floor * 14 + 10); S.run.loot += g; const lt = pick(ING).id; add(lt, 1); S.log.unshift('✅ ' + m.n + ' verslagen! +' + g + ' goud, +1 ' + ING.find(i => i.id === lt).e); if (S.run.floor > S.best) S.best = S.run.floor; S.run.floor++; S.run.hp = Math.min(S.run.mhp, S.run.hp + Math.round(S.run.mhp * .15)); newMon(); } else hit();
      S.log.length = Math.min(S.log.length, 6);
    };
    const A = app(host, api, {
      bg: 'linear-gradient(#1a1040,#3b1a66)', acc: '#a855f7', tabs: [['toren', '🏰 Toren'], ['verz', '🧭 Verzamel'], ['brouw', '⚗️ Brouwen'], ['spel', '📕 Spreuken'], ['klim', '⚔️ Klim']],
      state: () => { S.last = Date.now(); return S; },
      tick: dt => { settle(dt); S.last = Date.now(); },
      head: el => { $('div', 'font-size:20px;font-weight:800', '🧙 Magiërstoren', el); const r = row(el, 'justify-content:space-between;margin-top:4px'); $('span', 'color:#ffe08a;font-weight:700', fe(S.gold), r); $('span', '', '🔮 ' + Math.floor(S.mana) + '/' + maxMana(), r); $('span', 'font-size:12px', '🏔️ Beste: ' + S.best, r); bar(el, S.mana / maxMana(), '#60a5fa'); },
      render: (tab, b) => {
        if (tab === 'toren') {
          const t = card(b, 'text-align:center'); $('div', 'font-size:22px', '🔺', t); FLOORS.slice().reverse().forEach(f => { const lv = S.fl[f.id]; $('div', 'background:rgba(255,255,255,' + (lv ? .18 : .05) + ');margin:2px auto;width:' + (200 + (lv ? 0 : -20)) + 'px;border-radius:6px;padding:4px', f.e + ' ' + f.n + ' · niv ' + lv, t); }); $('div', 'font-size:22px', '🚪', t);
          FLOORS.forEach(f => { const lv = S.fl[f.id], cost = Math.round(f.c * Math.pow(2.2, lv)), c = card(b); $('div', 'font-weight:800', f.e + ' ' + f.n, c); $('div', 'font-size:12px;opacity:.85', f.d, c); btn(c, lv >= 8 ? 'MAX' : (lv ? 'Verbeter ' : 'Bouw verdieping ') + fe(cost), () => { S.gold -= cost; S.fl[f.id]++; A.commit(); }, S.gold < cost || lv >= 8); });
        } else if (tab === 'verz') {
          S.exp.forEach(x => { const c = card(b, 'background:rgba(34,197,94,.2)'); $('div', 'font-weight:700', LOCS[x.loc].e + ' ' + LOCS[x.loc].n + ' ' + fmtT((x.end - Date.now()) / 1000), c); });
          const slots = 1 + Math.floor(S.fl.uitk / 2);
          LOCS.forEach((L, i) => { const t = L.t / (1 + .15 * S.fl.uitk); btn(b, L.e + ' ' + L.n + ' · ' + Math.round(t) + 's · ' + L.loot.map(k => ING.find(x => x.id === k).e).join(''), () => { S.exp.push({ loc: i, end: Date.now() + t * 1000 }); A.commit(); }, S.exp.length >= slots || (i === 2 && S.best < 5) || (i === 1 && S.best < 2), 'display:block;width:100%' + ((i === 2 && S.best < 5) || (i === 1 && S.best < 2) ? ';background:#444' : '')); });
          $('div', 'font-size:12px;opacity:.8', 'Plekken voor expedities: ' + slots + '. Grot ontgrendelt bij verdieping 2, vulkaan bij 5 in de klim.', b);
          const c = card(b); $('div', 'font-weight:800', '🎒 Ingrediënten', c); ING.forEach(i => $('div', 'font-size:14px', i.e + ' ' + i.n + ': ' + (S.ing[i.id] || 0), c));
        } else if (tab === 'brouw') {
          S.brew.forEach(x => { const c = card(b, 'background:rgba(168,85,247,.25)'); $('div', 'font-weight:700', POT.find(p => p.id === x.p).e + ' Brouwt... ' + fmtT((x.end - Date.now()) / 1000), c); });
          POT.forEach(p => { const c = card(b), ok = Object.keys(p.in).every(k => (S.ing[k] || 0) >= p.in[k]); $('div', 'font-weight:800', p.e + ' ' + p.n + ' (' + (S.pot[p.id] || 0) + ')', c); $('div', 'font-size:12px;opacity:.85', p.d + ' Nodig: ' + Object.keys(p.in).map(k => p.in[k] + ING.find(i => i.id === k).e).join(' '), c); const r = row(c); btn(r, 'Brouw · 15s', () => { for (const k in p.in) S.ing[k] -= p.in[k]; S.brew.push({ p: p.id, end: Date.now() + 15000 }); A.commit(); }, !ok || S.brew.length >= cauldrons(), 'flex:1'); btn(r, 'Verkoop ' + fe(p.v), () => { S.pot[p.id]--; S.gold += p.v; A.commit(); }, !(S.pot[p.id] > 0), 'flex:1;background:#555'); });
          $('div', 'font-size:12px;opacity:.8', 'Ketels: ' + cauldrons() + ' (bouw het Alchemielab voor meer).', b);
        } else if (tab === 'spel') {
          SPELLS.forEach(sp => { const lv = S.spl[sp.id] || 0, e = EL.find(x => x.id === sp.id), c = card(b); $('div', 'font-weight:800', e.e + ' ' + sp.n + (lv ? ' niv ' + lv : ' (onbekend)'), c); if (lv) $('div', 'font-size:12px', 'Schade ' + Math.round(sdmg(sp.id)) + ' · ' + sp.m + ' mana', c); const cost = lv ? Math.round(sp.c * 0.5 * Math.pow(2, lv - 1) + 40 * lv) : sp.c; btn(c, lv ? 'Verbeter ' + fe(cost) : 'Leer ' + fe(cost), () => { S.gold -= cost; S.spl[sp.id] = lv + 1; A.commit(); }, S.gold < cost || lv >= 10); });
        } else {
          const R = S.run;
          if (!R) { const mhp = 60 + 12 * S.fl.lib + 8 * S.fl.mana; btn(b, '🚪 Beklim de toren (levenskracht ' + mhp + ')', () => { S.run = { floor: 1, hp: mhp, mhp, loot: 0, boost: 0, shield: false }; newMon(); S.log = []; A.commit(); }, false, 'width:100%'); $('div', 'font-size:13px;opacity:.85', 'Elke verdieping heeft een monster met een zwakte. Gebruik het juiste element voor dubbele schade! Elke 5e verdieping is een baas.', b); }
          else {
            const m = R.mon; const c = card(b); $('div', 'font-weight:800', '🏰 Verdieping ' + R.floor + ' · ❤️ ' + R.hp + '/' + R.mhp + (R.shield ? ' 🛡️' : '') + (R.boost ? ' 🟠×' + R.boost : ''), c); bar(c, R.hp / R.mhp, '#ef4444');
            $('div', 'font-weight:700;margin-top:6px', m.n + ' · ' + m.hp + '/' + m.mhp, c); bar(c, m.hp / m.mhp, '#f59e0b'); $('div', 'font-size:13px', 'Zwakte: ' + EL.find(x => x.id === m.wk).e + ' ' + EL.find(x => x.id === m.wk).n + ' · aanval ' + m.atk, c);
            SPELLS.filter(sp => S.spl[sp.id]).forEach(sp => btn(b, EL.find(x => x.id === sp.id).e + ' ' + sp.n + ' (' + sp.m + ' mana)' + (m.wk === sp.id ? ' ⭐' : ''), () => { cast(sp.id); A.commit(); }, S.mana < sp.m, 'width:100%;' + (m.wk === sp.id ? 'background:linear-gradient(#f59e0b,#d97706)' : '')));
            const pr = row(b, 'flex-wrap:wrap');
            POT.forEach(p => { if (!(S.pot[p.id] > 0)) return; btn(pr, p.e + '×' + S.pot[p.id], () => { S.pot[p.id]--; if (p.id === 'heal') R.hp = Math.min(R.mhp, R.hp + R.mhp / 2); if (p.id === 'mana') S.mana = Math.min(maxMana(), S.mana + 40); if (p.id === 'kracht') R.boost = 3; if (p.id === 'schild') R.shield = true; A.commit(); }, false, 'flex:1;background:#555'); });
            btn(b, '🏃 Terugtrekken (neem ' + fe(R.loot) + ' mee)', () => { S.gold += R.loot; S.run = null; A.commit(); }, false, 'width:100%;background:#7a2020;font-size:12px');
          }
          if (S.log.length) { const c = card(b, 'font-size:12px'); S.log.forEach(l => $('div', '', '• ' + l, c)); }
        }
      },
    });
    return { destroy() { A.destroy(); } };
  },
};
