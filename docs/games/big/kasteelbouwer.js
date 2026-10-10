// Kasteelbouwer: bouw je kasteel, verzamel grondstoffen, train soldaten, sla aanvallen af en breid je rijk uit.
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
const BTN = 'min-height:44px;padding:8px 12px;border:0;border-radius:12px;font:600 14px system-ui;color:#fff;background:linear-gradient(135deg,#b45309,#78350f);cursor:pointer;';
const B = (txt, fn, p, css, dis) => {
  const b = H('button', BTN + (css || '') + (dis ? 'opacity:.4;' : ''), txt, p);
  b.onclick = () => { if (!dis) fn(); };
  return b;
};
const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

const RES = { wood: '🪵', stone: '🪨', food: '🌾', gold: '🪙' };
const RNAME = { wood: 'hout', stone: 'steen', food: 'voedsel', gold: 'goud' };
const BLD = {
  lumber: { e: '🪓', n: 'Houthakker', d: '+0,8 hout/s', cost: { wood: 15 } },
  quarry: { e: '⛏️', n: 'Steengroeve', d: '+0,5 steen/s', cost: { wood: 30 } },
  farm: { e: '🌻', n: 'Boerderij', d: '+0,6 voedsel/s', cost: { wood: 25 } },
  house: { e: '🏘️', n: 'Dorpshuizen', d: '+0,4 goud/s (belasting)', cost: { wood: 40, stone: 15 } },
  barracks: { e: '🛖', n: 'Kazerne', d: '+5 plekken voor soldaten', cost: { wood: 60, stone: 40 } },
  wall: { e: '🧱', n: 'Kasteelmuur', d: '+12 verdediging', cost: { stone: 60, wood: 20 } },
  tower: { e: '🗼', n: 'Wachttoren', d: '+9 verdediging', cost: { stone: 90, gold: 30 } },
  smith: { e: '⚒️', n: 'Smid', d: 'Soldaten +1 kracht per niveau', cost: { stone: 70, gold: 60 } },
};
const PROV = [
  { n: 'Boerendorp', e: '🌾', str: 30, gold: 60 },
  { n: 'Bosrand', e: '🌲', str: 80, gold: 140 },
  { n: 'Moerasland', e: '🐸', str: 170, gold: 300 },
  { n: 'Rotsvallei', e: '⛰️', str: 330, gold: 600 },
  { n: 'Havenstad', e: '⚓', str: 620, gold: 1100 },
  { n: 'Woestijnrijk', e: '🏜️', str: 1100, gold: 2000 },
  { n: 'Ijsvesting', e: '🏔️', str: 1900, gold: 3600 },
  { n: 'Drakenberg', e: '🐉', str: 3400, gold: 8000 },
];
const ATK_MS = 180000;
const FOES = [['Struikrovers', '🥷'], ['Wolven', '🐺'], ['Barbaren', '🪓'], ['Orks', '👹'], ['Trollen', '🧌'], ['Een draak', '🐉']];

export default {
  id: 'kasteelbouwer', name: 'Kasteelbouwer', emoji: '🏰', desc: 'Bouw een kasteel, train soldaten en breid je rijk uit.',
  async create(host, api) {
    const def = { r: { wood: 60, stone: 20, food: 30, gold: 20 }, b: { lumber: 1, quarry: 0, farm: 1, house: 0, barracks: 0, wall: 0, tower: 0, smith: 0 }, sol: 0, conq: [], wave: 0, nextAtk: Date.now() + 300000, last: Date.now(), hist: [], won: 0, lost: 0, hunger: 0 };
    let S = Object.assign({}, def, (await api.load()) || {});
    S.r = Object.assign({}, def.r, S.r); S.b = Object.assign({}, def.b, S.b);
    let alive = true, tab = 'castle', msg = '';
    host.style.cssText += ';background:linear-gradient(#2a2118,#14100b);color:#fdf3e0;font-family:system-ui,sans-serif;';
    const root = H('div', 'max-width:430px;margin:0 auto;padding:10px;box-sizing:border-box;', null, host);
    const save = () => { S.last = Date.now(); api.save(S); };

    const mul = () => 1 + 0.1 * S.conq.length;
    const rate = () => ({
      wood: 0.8 * S.b.lumber * mul(), stone: 0.5 * S.b.quarry * mul(),
      food: 0.6 * S.b.farm * mul() - 0.04 * S.sol, gold: 0.4 * S.b.house * mul(),
    });
    const cap = () => 200 + 150 * (S.b.barracks + S.b.wall) + 100 * S.b.house;
    const maxSol = () => 5 * S.b.barracks;
    const power = () => S.sol * (5 + S.b.smith);
    const defense = () => power() + 12 * S.b.wall + 9 * S.b.tower;
    const strength = (w) => Math.round(6 * Math.pow(1.22, w));
    const bcost = (k) => {
      const o = {};
      Object.entries(BLD[k].cost).forEach(([r, v]) => { o[r] = Math.round(v * Math.pow(1.55, S.b[k])); });
      return o;
    };
    const canPay = (c) => Object.entries(c).every(([r, v]) => S.r[r] >= v);
    const pay = (c) => Object.entries(c).forEach(([r, v]) => { S.r[r] -= v; });
    const costTxt = (c) => Object.entries(c).map(([r, v]) => RES[r] + fmt(v)).join(' ');

    function produce(sec) {
      const rt = rate(), cp = cap();
      ['wood', 'stone', 'food', 'gold'].forEach((k) => {
        S.r[k] = Math.max(0, Math.min(cp, S.r[k] + rt[k] * sec));
      });
      if (S.r.food <= 0 && rt.food < 0 && S.sol > 0) {
        S.hunger += sec;
        if (S.hunger >= 15) { S.hunger = 0; S.sol--; msg = '😢 Een soldaat verliet je leger door honger! Bouw meer boerderijen.'; }
      } else S.hunger = 0;
    }

    function attack() {
      const w = S.wave, st = strength(w), d = defense();
      const f = FOES[Math.min(FOES.length - 1, Math.floor(w / 4))];
      let t;
      if (d >= st) {
        const g = Math.round(20 + st * 1.5);
        S.r.gold = Math.min(cap(), S.r.gold + g); S.won++;
        const lostS = Math.floor(S.sol * 0.08 * Math.min(1, st / Math.max(1, d)));
        S.sol -= lostS;
        t = '🛡️ ' + f[1] + ' ' + f[0] + ' (sterkte ' + st + ') afgeslagen! +' + g + ' goud' + (lostS ? ', ' + lostS + ' soldaten gesneuveld' : '') + '.';
      } else {
        ['wood', 'stone', 'food', 'gold'].forEach((k) => { S.r[k] = Math.floor(S.r[k] * 0.7); });
        const lostS = Math.ceil(S.sol * 0.3); S.sol -= lostS; S.lost++;
        t = '💥 ' + f[1] + ' ' + f[0] + ' (sterkte ' + st + ') braken door je verdediging (' + d + ')! Je verloor 30% grondstoffen en ' + lostS + ' soldaten.';
      }
      S.wave++; S.hist.unshift(t); S.hist = S.hist.slice(0, 6);
      return t;
    }

    // offline: productie en gemiste aanvallen
    const away = Math.min((Date.now() - (S.last || Date.now())) / 1000, 8 * 3600);
    if (away > 10) {
      produce(away);
      let miss = Math.min(5, Math.floor((Date.now() - S.nextAtk) / ATK_MS) + 1);
      if (Date.now() < S.nextAtk) miss = 0;
      for (let i = 0; i < miss; i++) attack();
      if (Date.now() >= S.nextAtk) S.nextAtk = Date.now() + ATK_MS;
      msg = '⏳ Terwijl je weg was (' + Math.round(away / 60) + ' min) produceerde je rijk grondstoffen' + (miss ? ' en werden er ' + miss + ' aanvallen afgehandeld. Zie het leger-tabblad.' : '.');
    }

    function tick() {
      if (!alive) return;
      produce(1);
      if (Date.now() >= S.nextAtk) {
        const t = attack(); S.nextAtk = Date.now() + ATK_MS; msg = t; api.toast(S.hist[0].slice(0, 40)); save();
        render(); return;
      }
      upd();
    }
    function upd() {
      const rt = rate();
      root.querySelectorAll('[data-res]').forEach((el) => {
        const k = el.getAttribute('data-res');
        el.textContent = RES[k] + ' ' + fmt(S.r[k]) + ' (' + (rt[k] >= 0 ? '+' : '') + rt[k].toFixed(1).replace('.', ',') + '/s)';
      });
      const t = root.querySelector('[data-atk]');
      if (t) t.textContent = mmss(S.nextAtk - Date.now());
    }

    function render() {
      if (!alive) return;
      const st = host.scrollTop;
      root.innerHTML = '';
      H('div', 'font:800 20px system-ui;margin-bottom:6px;', '🏰 Kasteelbouwer', root);
      const rs = H('div', 'display:grid;grid-template-columns:1fr 1fr;gap:4px;background:#0006;border-radius:12px;padding:6px 8px;margin-bottom:8px;font:600 13px system-ui;', null, root);
      Object.keys(RES).forEach((k) => H('div', '', '', rs).setAttribute('data-res', k));
      H('div', 'grid-column:span 2;font-size:11px;opacity:.7;', 'Opslagruimte per grondstof: ' + fmt(cap()), rs);
      const tabs = H('div', 'display:flex;gap:6px;margin-bottom:8px;', null, root);
      [['castle', '🏰 Kasteel'], ['army', '⚔️ Leger'], ['realm', '🗺️ Rijk']].forEach(([k, l]) => B(l, () => { tab = k; render(); }, tabs, 'flex:1;font-size:13px;' + (tab === k ? '' : 'background:#4a3a28;')));
      if (msg) { H('div', 'background:#5a3d1a;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:13px;', msg, root); msg = ''; }
      if (tab === 'castle') castleUI(); else if (tab === 'army') armyUI(); else realmUI();
      host.scrollTop = st;
      upd();
    }
    const card = (css) => H('div', 'background:#3a2c1c;border-radius:14px;padding:10px;margin-bottom:8px;' + (css || ''), null, root);

    function castleUI() {
      const g = card();
      H('div', 'font-weight:700;margin-bottom:6px;', '🤲 Zelf verzamelen', g);
      const row = H('div', 'display:flex;gap:6px;', null, g);
      [['wood', '🪓 Hout'], ['stone', '⛏️ Steen'], ['food', '🌾 Oogst']].forEach(([k, l]) => B(l + ' +' + (3 + Math.floor(S.b.lumber / 2)), () => { S.r[k] = Math.min(cap(), S.r[k] + 3 + Math.floor(S.b.lumber / 2)); upd(); }, row, 'flex:1;font-size:12px;background:#166534;'));
      Object.keys(BLD).forEach((k) => {
        const b = BLD[k], c = bcost(k);
        const el = card('display:flex;align-items:center;gap:8px;');
        H('div', 'font-size:30px;', b.e, el);
        const m = H('div', 'flex:1;', null, el);
        H('div', 'font:700 14px system-ui;', b.n + ' (niv ' + S.b[k] + ')', m);
        H('div', 'font-size:11px;opacity:.8;', b.d, m);
        B((S.b[k] ? '⬆️ ' : '🔨 ') + costTxt(c), () => { pay(c); S.b[k]++; save(); render(); }, el, 'font-size:12px;min-width:92px;', !canPay(c) || Math.max(...Object.values(c)) > cap());
      });
    }

    function armyUI() {
      const a = card();
      H('div', 'font:700 15px system-ui;', '🛡️ Verdediging ' + defense() + ' · ⚔️ soldaten ' + S.sol + '/' + maxSol(), a);
      H('div', 'font-size:12px;opacity:.85;margin:4px 0;', 'Volgende aanval over ', a);
      const tt = H('b', 'font-size:20px;display:block;', '', a); tt.setAttribute('data-atk', '1');
      const st = strength(S.wave), f = FOES[Math.min(FOES.length - 1, Math.floor(S.wave / 4))];
      H('div', 'font-size:13px;margin:4px 0;', 'Vijand: ' + f[1] + ' ' + f[0] + ' met sterkte ' + st + ' (' + (defense() >= st ? '✅ je houdt stand' : '⚠️ te zwak!') + ')', a);
      const cost = { food: 10, gold: 8 };
      const row = H('div', 'display:flex;gap:6px;margin-top:6px;', null, a);
      [1, 5].forEach((n) => B('Train ' + n + ' (🌾' + 10 * n + ' 🪙' + 8 * n + ')', () => { S.r.food -= 10 * n; S.r.gold -= 8 * n; S.sol += n; save(); render(); }, row, 'flex:1;font-size:12px;', S.sol + n > maxSol() || S.r.food < cost.food * n || S.r.gold < cost.gold * n));
      if (maxSol() === 0) H('div', 'font-size:12px;margin-top:6px;', 'Bouw eerst een Kazerne om soldaten te trainen.', a);
      B('Dienst weigeren: ontslaan -1', () => { S.sol--; save(); render(); }, a, 'width:100%;margin-top:6px;background:#475569;font-size:12px;', S.sol <= 0);
      const h = card();
      H('div', 'font-weight:700;margin-bottom:4px;', '📜 Verslagen: ' + S.won + ' afgeslagen · ' + S.lost + ' verloren', h);
      if (!S.hist.length) H('div', 'font-size:12px;opacity:.7;', 'Nog geen aanvallen gehad.', h);
      S.hist.forEach((t) => H('div', 'font-size:12px;padding:3px 0;opacity:.9;', t, h));
    }

    function realmUI() {
      H('div', 'font-size:13px;opacity:.85;margin-bottom:6px;', 'Verover gebieden met je soldaten. Elk veroverd gebied geeft +10% productie en een vergoeding. Je legerkracht: ' + power() + '. Verliezers sneuvelen: winnen kost 15% van je leger, verliezen 35%.', root);
      PROV.forEach((p, i) => {
        const done = S.conq.includes(i);
        const open = i === 0 || S.conq.includes(i - 1);
        const c = card('display:flex;align-items:center;gap:10px;' + (open ? '' : 'opacity:.5;'));
        H('div', 'font-size:32px;', done ? '🚩' : p.e, c);
        const m = H('div', 'flex:1;', null, c);
        H('div', 'font-weight:700;', p.n + (done ? ' ✓' : ''), m);
        H('div', 'font-size:12px;opacity:.8;', 'Vijandelijke kracht ' + p.str + ' · beloning 🪙' + fmt(p.gold), m);
        if (!done) B('⚔️ Aanvallen', () => {
          const mine = power() * (0.85 + Math.random() * 0.3);
          if (mine >= p.str) {
            S.conq.push(i); S.sol -= Math.floor(S.sol * 0.15); S.r.gold = Math.min(cap(), S.r.gold + p.gold);
            msg = '🚩 ' + p.n + ' veroverd! +🪙' + fmt(p.gold) + ' en +10% productie.';
          } else { const l = Math.ceil(S.sol * 0.35); S.sol -= l; msg = '😞 De aanval op ' + p.n + ' mislukte. ' + l + ' soldaten sneuvelden.'; }
          save(); render();
        }, c, 'font-size:12px;min-width:90px;', !open || S.sol === 0);
      });
      if (S.conq.length === PROV.length) H('div', 'text-align:center;font:800 18px system-ui;margin-top:10px;', '👑 Je regeert over het hele rijk!', root);
    }

    render();
    const iv = setInterval(tick, 1000);
    const iv2 = setInterval(() => { if (alive) save(); }, 10000);
    return { destroy() { alive = false; clearInterval(iv); clearInterval(iv2); save(); } };
  },
};
