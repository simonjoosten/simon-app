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
const CLS = [{ id: 0, n: 'Kracht', e: '💪' }, { id: 1, n: 'Snelheid', e: '⚡' }, { id: 2, n: 'Brein', e: '🧠' }];
const HNAMES = ['Captain Kaas', 'Luna Bliksem', 'Dr. Draai', 'Turbo Tim', 'IJsvrouw', 'Mega Mo', 'Sterre', 'Vlam Fleur', 'Schaduw Sam', 'Pixel Pip', 'Donder Daan', 'Kiki Kracht', 'Wolk Wout', 'Neon Noor'];
const HEMOJI = ['🦸', '🦸‍♀️', '🦹', '🧙', '🥷', '🤖', '🧑‍🚀', '🦊', '🐺', '🦅'];
const VILLAINS = [
  { id: 'v1', n: 'Dokter Rommel', e: '🥴', d: 40, reward: 600, story: 'Hij laat alle prullenbakken van de stad overlopen!' },
  { id: 'v2', n: 'De IJskoning', e: '🥶', d: 120, reward: 3000, story: 'Hij bevriest het zwembad en alle ijsjes!' },
  { id: 'v3', n: 'Robo-Rat', e: '🐀', d: 350, reward: 15000, story: 'Een gigantische robotrat knaagt aan de bruggen.' },
  { id: 'v4', n: 'Madame Mist', e: '🌫️', d: 900, reward: 70000, story: 'Ze hult heel het land in dikke mist.' },
  { id: 'v5', n: 'Keizer Chaos', e: '👾', d: 2400, reward: 400000, story: 'De grote baas van alle schurken. Bereid je voor!' },
];
const BASE = [{ id: 'gym', n: 'Trainingszaal', e: '🏋️', c: 200, d: 'Training gaat sneller.' }, { id: 'med', n: 'Ziekenboeg', e: '🏥', c: 300, d: 'Gewonde helden herstellen sneller.' }, { id: 'hq', n: 'Hoofdkwartier', e: '🏢', c: 500, d: '+2 plekken voor helden.' }, { id: 'radar', n: 'Radar', e: '📡', c: 400, d: 'Meer missies op het bord.' }];
const MTYPES = [{ n: 'Kat uit boom redden', e: '🐈', w: [.2, .6, .2] }, { n: 'Bankoverval stoppen', e: '🏦', w: [.4, .4, .2] }, { n: 'Bom onschadelijk maken', e: '💣', w: [.1, .2, .7] }, { n: 'Brand blussen', e: '🔥', w: [.5, .3, .2] }, { n: 'Dief achtervolgen', e: '🏃', w: [.2, .7, .1] }, { n: 'Geheime code kraken', e: '🔐', w: [.1, .1, .8] }, { n: 'Reuzenrobot tegenhouden', e: '🤖', w: [.7, .1, .2] }];
const eur = n => '🪙' + fmt(n);
export default {
  id: 'superhelden', name: 'Superhelden Academie', emoji: '🦸', desc: 'Werf helden, train ze en red de stad van schurken.',
  async create(host, api) {
    const d = await api.load();
    const S = Object.assign({ coins: 150, fame: 0, heroes: [], board: [], active: [], base: { gym: 0, med: 0, hq: 0, radar: 0 }, beaten: {}, cands: [], sel: [], nid: 1, wins: 0, fails: 0, boardAt: 0, last: Date.now() }, d || {});
    const hid = id => S.heroes.find(h => h.id === id);
    const power = (h, w) => h.s[0] * w[0] + h.s[1] * w[1] + h.s[2] * w[2];
    const mkHero = () => { const c = ri(0, 2), tier = Math.floor(Math.log2(1 + S.fame / 50)); const s = [ri(4, 8), ri(4, 8), ri(4, 8)]; s[c] += ri(4, 8) + tier * 2; return { id: 0, name: pick(HNAMES), e: pick(HEMOJI), cls: c, s, xp: 0, lv: 1, hurt: 0, train: null }; };
    const mkMission = () => { const t = pick(MTYPES), tier = Math.floor(Math.log2(1 + S.fame / 40)); const diff = Math.round(8 * Math.pow(1.5, tier) * rnd(.7, 1.6) * (1 + S.heroes.length * .25)); return { t, diff, dur: ri(15, 60) + tier * 10, reward: Math.round(diff * rnd(3, 5)), fame: Math.max(1, Math.round(diff / 8)) }; };
    const fillBoard = () => { while (S.board.length < 3 + S.base.radar) S.board.push(mkMission()); };
    const maxHeroes = () => 3 + 2 * S.base.hq;
    const chance = (team, diff, w) => { if (!team.length) return 0; let st = team.reduce((a, h) => a + power(h, w), 0); if (new Set(team.map(h => h.cls)).size > 1) st *= 1.1; return clamp(.5 + (st - diff) / diff * .5, .05, .95); };
    const busy = h => S.active.some(a => a.ids.includes(h.id)) || (h.train && h.train.until > Date.now()) || h.hurt > Date.now();
    const finish = a => {
      const team = a.ids.map(hid).filter(Boolean), m = a.m;
      const ok = Math.random() < a.p;
      if (ok) { S.coins += m.reward; S.fame += m.fame; S.wins++; if (a.vid) { S.beaten[a.vid] = true; } team.forEach(h => { h.xp += m.fame + 2; while (h.xp >= h.lv * 10) { h.xp -= h.lv * 10; h.lv++; h.s = h.s.map(v => v + 1); } }); api.toast('✅ Gelukt: ' + (m.t ? m.t.n : m.n) + ' (+' + fmt(m.reward) + ' munten)'); }
      else { S.fails++; team.forEach(h => { if (Math.random() < .6) h.hurt = Date.now() + 40000 / (1 + S.base.med * .4); }); api.toast('❌ Mislukt: ' + (m.t ? m.t.n : m.n) + '. Helden zijn moe.'); }
    };
    const sweep = () => { const now = Date.now(); const done = S.active.filter(a => a.end <= now); S.active = S.active.filter(a => a.end > now); done.forEach(finish); if (done.length) fillBoard(); };
    sweep(); fillBoard();
    S.last = Date.now();
    S.sel = S.sel.filter(id => hid(id));
    const A = app(host, api, {
      bg: 'linear-gradient(#1b1f5e,#6b1d6e)', acc: '#ef4444', tabs: [['mis', '🚨 Missies'], ['her', '🦸 Helden'], ['wrv', '🧑‍🤝‍🧑 Werven'], ['schurk', '😈 Schurken'], ['base', '🏢 Basis']],
      state: () => { S.last = Date.now(); return S; },
      tick: () => { sweep(); S.heroes.forEach(h => { if (h.train && h.train.until <= Date.now()) { h.s[h.train.st] += 2; h.train = null; } }); S.board = S.board.slice(0, 3 + S.base.radar); fillBoard(); },
      head: el => { $('div', 'font-size:20px;font-weight:800', '🦸 Superhelden Academie', el); const r = row(el, 'justify-content:space-between;margin-top:4px'); $('span', 'color:#ffd86b;font-weight:700', eur(S.coins), r); $('span', '', '⭐ Faam ' + fmt(S.fame), r); $('span', 'font-size:12px', '🦸 ' + S.heroes.length + '/' + maxHeroes(), r); },
      render: (tab, b) => {
        if (tab === 'mis') {
          S.active.forEach(a => { const c = card(b, 'background:rgba(34,197,94,.2)'); $('div', 'font-weight:700', '🏃 ' + (a.m.t ? a.m.t.e + ' ' + a.m.t.n : a.m.e + ' ' + a.m.n) + ' · ' + fmtT((a.end - Date.now()) / 1000), c); $('div', 'font-size:12px', a.ids.map(hid).filter(Boolean).map(h => h.e + h.name).join(', '), c); });
          const free = S.heroes.filter(h => !busy(h));
          const c0 = card(b); $('div', 'font-weight:700', 'Kies je team (max 3) – beschikbaar: ' + free.length, c0);
          const rr = row(c0, 'flex-wrap:wrap');
          free.forEach(h => btn(rr, h.e + ' ' + h.name.split(' ')[0] + ' ' + CLS[h.cls].e, () => { S.sel = S.sel.includes(h.id) ? S.sel.filter(x => x !== h.id) : S.sel.length < 3 ? [...S.sel, h.id] : S.sel; A.commit(); }, false, 'font-size:12px;padding:4px 8px;' + (S.sel.includes(h.id) ? 'background:#16a34a' : 'background:#555')));
          if (!free.length) $('div', 'font-size:12px;opacity:.7', 'Alle helden zijn bezig of moe.', c0);
          const team = S.sel.map(hid).filter(h => h && !busy(h));
          S.board.forEach((m, i) => {
            const c = card(b), p = chance(team, m.diff, m.t.w);
            $('div', 'font-weight:800', m.t.e + ' ' + m.t.n, c);
            $('div', 'font-size:12px;opacity:.9', 'Moeilijkheid ' + m.diff + ' · ' + fmtT(m.dur) + ' · beloning ' + eur(m.reward) + ' + ⭐' + m.fame, c);
            $('div', 'font-size:12px;opacity:.9', 'Beste klasse: ' + m.t.w.map((w, k) => w >= .4 ? CLS[k].e : '').join(''), c);
            $('div', 'font-size:13px;font-weight:700;color:' + (p > .7 ? '#4ade80' : p > .4 ? '#fbbf24' : '#f87171'), 'Slagingskans: ' + Math.round(p * 100) + '%', c);
            btn(c, team.length ? '🚀 Ga op missie' : 'Kies eerst helden', () => { S.active.push({ m, ids: team.map(h => h.id), end: Date.now() + m.dur * 1000, p }); S.board.splice(i, 1); S.sel = []; fillBoard(); A.commit(); }, !team.length);
          });
          btn(b, '🔄 Nieuw bord (' + eur(20) + ')', () => { S.coins -= 20; S.board = []; fillBoard(); A.commit(); }, S.coins < 20, 'background:#555');
        } else if (tab === 'her') {
          if (!S.heroes.length) $('div', 'opacity:.8', 'Je hebt nog geen helden. Ga naar Werven!', b);
          S.heroes.forEach(h => {
            const c = card(b); $('div', 'font-weight:800', h.e + ' ' + h.name + ' · niv ' + h.lv + ' ' + CLS[h.cls].e, c);
            $('div', 'font-size:12px', '💪 ' + h.s[0] + '  ⚡ ' + h.s[1] + '  🧠 ' + h.s[2] + ' · xp ' + h.xp + '/' + h.lv * 10, c);
            if (h.hurt > Date.now()) $('div', 'font-size:12px;color:#fca5a5', '😴 Uitrusten: ' + fmtT((h.hurt - Date.now()) / 1000), c);
            else if (h.train && h.train.until > Date.now()) $('div', 'font-size:12px;color:#93c5fd', '🏋️ Training ' + CLS[h.train.st].n + ': ' + fmtT((h.train.until - Date.now()) / 1000), c);
            else if (S.active.some(a => a.ids.includes(h.id))) $('div', 'font-size:12px', '🚀 Op missie', c);
            else {
              if (h.train) { h.s[h.train.st] += 2; h.train = null; }
              const cost = Math.round(40 * Math.pow(1.25, h.s[0] + h.s[1] + h.s[2] - 12) + 20); const r = row(c, 'flex-wrap:wrap');
              CLS.forEach(k => btn(r, 'Train ' + k.e + ' ' + eur(cost), () => { S.coins -= cost; h.train = { st: k.id, until: Date.now() + 25000 / (1 + S.base.gym * .4) }; A.commit(); }, S.coins < cost, 'flex:1;font-size:11px;padding:4px'));
              btn(c, 'Ontslaan', () => { S.heroes = S.heroes.filter(x => x !== h); A.commit(); }, false, 'background:#7a2020;font-size:11px;min-height:36px');
            }
          });
        } else if (tab === 'wrv') {
          const cost = Math.round(80 * Math.pow(1.5, S.heroes.length));
          $('div', 'font-size:13px;opacity:.85', 'Een schouwing kost ' + eur(cost) + '. Daarna kies je 1 van 3 kandidaten.', b);
          if (!S.cands.length) btn(b, '📣 Schouwing houden · ' + eur(cost), () => { S.coins -= cost; S.cands = [mkHero(), mkHero(), mkHero()]; A.commit(); }, S.coins < cost || S.heroes.length >= maxHeroes(), 'width:100%');
          if (S.heroes.length >= maxHeroes()) $('div', 'color:#fca5a5', 'Je basis zit vol! Bouw een Hoofdkwartier.', b);
          S.cands.forEach((h, i) => { const c = card(b); $('div', 'font-weight:800', h.e + ' ' + h.name + ' ' + CLS[h.cls].e + ' ' + CLS[h.cls].n, c); $('div', 'font-size:12px', '💪 ' + h.s[0] + '  ⚡ ' + h.s[1] + '  🧠 ' + h.s[2], c); btn(c, 'Aannemen', () => { h.id = S.nid++; S.heroes.push(h); S.cands = []; A.commit(); }, S.heroes.length >= maxHeroes()); });
          if (S.cands.length) btn(b, 'Niemand (opnieuw proberen)', () => { S.cands = []; A.commit(); }, false, 'background:#555');
        } else if (tab === 'schurk') {
          const team = S.sel.map(hid).filter(h => h && !busy(h));
          $('div', 'font-size:12px;opacity:.85', 'Kies je team bij Missies en versla hier de schurken. Eénmalige grote beloning!', b);
          VILLAINS.forEach(v => {
            const c = card(b), done = S.beaten[v.id], p = chance(team, v.d, [.34, .33, .33]);
            $('div', 'font-weight:800', v.e + ' ' + v.n + (done ? ' ✅' : ''), c); $('div', 'font-size:12px;opacity:.9', v.story + ' · sterkte ' + v.d + ' · beloning ' + eur(v.reward), c);
            if (!done) { $('div', 'font-size:13px;font-weight:700', 'Slagingskans: ' + Math.round(p * 100) + '%', c); const busyV = S.active.some(a => a.vid === v.id); btn(c, busyV ? 'Bezig...' : 'Aanvallen!', () => { S.active.push({ m: { n: v.n, e: v.e, reward: v.reward, fame: Math.round(v.d / 4) }, ids: team.map(h => h.id), end: Date.now() + 90000, p, vid: v.id }); S.sel = []; A.commit(); }, !team.length || busyV, 'background:#b91c1c'); }
          });
        } else {
          BASE.forEach(x => { const lv = S.base[x.id], cost = Math.round(x.c * Math.pow(2.2, lv)); const c = card(b); $('div', 'font-weight:800', x.e + ' ' + x.n + ' niv ' + lv, c); $('div', 'font-size:12px;opacity:.85', x.d, c); btn(c, lv >= 8 ? 'MAX' : 'Uitbreiden ' + eur(cost), () => { S.coins -= cost; S.base[x.id]++; A.commit(); }, S.coins < cost || lv >= 8); });
          $('div', 'font-size:12px;opacity:.7', 'Gewonnen: ' + S.wins + ' · Mislukt: ' + S.fails, b);
        }
      },
    });
    return { destroy() { A.destroy(); } };
  },
};
