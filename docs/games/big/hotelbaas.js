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
const TYPES = [{ n: 'Budgetkamer', e: '🛏️', p: 30, c: 150, s: 1 }, { n: 'Standaardkamer', e: '🛌', p: 70, c: 900, s: 1 }, { n: 'Luxekamer', e: '🛋️', p: 180, c: 6000, s: 2 }, { n: 'Suite', e: '👑', p: 450, c: 40000, s: 3 }, { n: 'Penthouse', e: '🏙️', p: 1200, c: 250000, s: 4 }];
const FEAT = [{ id: 'tv', n: 'Tv', e: '📺', c: 200 }, { id: 'mini', n: 'Minibar', e: '🍹', c: 600 }, { id: 'bad', n: 'Bubbelbad', e: '🛁', c: 2000 }, { id: 'balkon', n: 'Balkon', e: '🌅', c: 5000 }];
const STAFF = [{ id: 'rec', n: 'Receptionist', e: '🧑‍💼', c: 400, d: 'Wijst wachtende gasten automatisch een kamer toe.' }, { id: 'sch', n: 'Schoonmaker', e: '🧹', c: 300, d: 'Maakt vuile kamers automatisch en sneller schoon.' }, { id: 'kok', n: 'Kok', e: '👨‍🍳', c: 1000, d: '+10% inkomsten per kok (ontbijtbuffet).' }, { id: 'con', n: 'Conciërge', e: '🛎️', c: 2000, d: 'Gasten wachten langer in de lobby.' }];
const REPS = [0, 40, 150, 500, 1500];
const NAMES = ['Anouk', 'Bram', 'Cas', 'Daan', 'Eva', 'Fleur', 'Gijs', 'Hanna', 'Ivo', 'Jasmijn', 'Koen', 'Lotte', 'Milan', 'Noor', 'Otto', 'Pien'];
const FACES = ['👨', '👩', '🧓', '👴', '👵', '🧑', '👱', '🧔', '👸', '🤴'];
const eur = n => '€' + fmt(n);
const newRoom = t => ({ t, f: [], st: 'free', until: 0, g: '', s: 1 });
export default {
  id: 'hotelbaas', name: 'Hotelbaas', emoji: '🏨', desc: 'Beheer je hotel: kamers, gasten, personeel en evenementen.',
  async create(host, api) {
    const d = await api.load();
    const S = Object.assign({ money: 250, rep: 0, rooms: [], staff: {}, queue: [], nextGuest: 3, nextEvent: 120, event: null, served: 0, earned: 0, last: Date.now(), log: [] }, d || {});
    if (!S.rooms.length) S.rooms = [newRoom(0), newRoom(0)];
    const stars = () => 1 + REPS.filter((x, i) => i > 0 && S.rep >= x).length;
    const sf = id => S.staff[id] || 0;
    const log = t => { S.log.unshift(t); S.log.length = Math.min(S.log.length, 6); };
    let welcome = '';
    const off = Math.min((Date.now() - S.last) / 1000, 28800);
    if (off > 60) {
      if (sf('rec') > 0 && sf('sch') > 0) {
        const gain = S.rooms.reduce((a, r) => a + TYPES[r.t].p * (1 + .1 * sf('kok')), 0) / 40 * 0.6 * off;
        S.money += gain; S.earned += gain; S.rep += Math.floor(off / 600);
        welcome = 'Terwijl je weg was verdiende het hotel ' + eur(gain) + '!';
      } else welcome = 'Zonder receptionist en schoonmaker stond het hotel stil terwijl je weg was.';
      S.queue = []; for (const r of S.rooms) { r.st = 'free'; r.g = ''; }
    }
    S.last = Date.now();
    if (welcome) api.toast(welcome);
    const spawn = o => {
      if (S.queue.length >= 8) return;
      const st = stars();
      const want = o && o.want != null ? o.want : Math.min(TYPES.length - 1, Math.floor(Math.random() * (st + 1.2)));
      S.queue.push(Object.assign({ name: pick(NAMES), e: pick(FACES), want, feat: Math.random() < .6 ? pick(FEAT).id : null, pay: 1, pat: 50 + 15 * sf('con'), vip: false, crit: false }, o || {}, { want }));
    };
    const assign = (gi, ri2) => {
      const g = S.queue[gi], r = S.rooms[ri2];
      if (!g || !r || r.st !== 'free') return;
      let s = 1;
      if (r.t < g.want) s -= .5 * (g.want - r.t);
      if (g.feat) s += r.f.includes(g.feat) ? .4 : -.2;
      s += .1 * sf('kok');
      r.s = s; r.g = g.name; r.gg = g; r.st = 'busy'; r.until = Date.now() + 25000;
      S.queue.splice(gi, 1);
    };
    const bestRoom = g => {
      let best = -1, bs = -9;
      S.rooms.forEach((r, i) => { if (r.st !== 'free') return; let s = (r.t >= g.want ? 2 : 0) - Math.abs(r.t - g.want) * .3 + (g.feat && r.f.includes(g.feat) ? 1 : 0); if (s > bs) { bs = s; best = i; } });
      return best;
    };
    const EVENTS = {
      bruiloft: () => ({ t: '💒 Bruiloft!', d: 'Een bruidspaar wil feesten in jullie hotel. Drie rijke gasten komen eraan (3x betalen).', o: [{ l: 'Accepteren', f: () => { for (let i = 0; i < 3; i++) spawn({ want: Math.min(2, stars()), pay: 3, vip: true }); } }, { l: 'Weigeren', f: () => { } }] }),
      recensent: () => ({ t: '🕵️ Hotelrecensent', d: 'Een anonieme recensent logeert vandaag. Een top-ervaring geeft +20 reputatie, een slechte -20!', o: [{ l: 'Welkom!', f: () => spawn({ want: 1, crit: true, pay: 1.5, feat: pick(FEAT).id, name: 'Mr. Kritisch', e: '🧐' }) }] }),
      storm: () => { const c = Math.round(S.money * .1 + 100); return { t: '⛈️ Storm!', d: 'Het dak lekt. Repareren kost ' + eur(c) + ', negeren kost reputatie.', o: [{ l: 'Repareer (' + eur(c) + ')', f: () => { if (S.money >= c) S.money -= c; else S.rep -= 10; } }, { l: 'Negeer (-10 rep)', f: () => { S.rep -= 10; } }] }; },
      congres: () => ({ t: '🎤 Congres', d: 'Een congresgroep komt: 4 zakenreizigers die dubbel betalen.', o: [{ l: 'Prima!', f: () => { for (let i = 0; i < 4; i++) spawn({ want: 1, pay: 2 }); } }] }),
      lijst: () => ({ t: '📰 Reclame in de krant', d: 'Voor ' + eur(200 + S.rooms.length * 50) + ' krijg je extra bekendheid (+15 reputatie).', o: [{ l: 'Doen', f: () => { const c = 200 + S.rooms.length * 50; if (S.money >= c) { S.money -= c; S.rep += 15; } } }, { l: 'Nee', f: () => { } }] }),
    };
    const checkout = r => {
      const g = r.gg || {}, s = r.s;
      const inc = TYPES[r.t].p * (1 + .1 * sf('kok')) * (g.pay || 1) * clamp(.5 + s / 2, .3, 1.6);
      S.money += inc; S.earned += inc; S.served++;
      if (g.crit) { S.rep += s >= 1 ? 20 : -20; log('🕵️ Recensent: ' + (s >= 1 ? 'vijf sterren! +20' : 'vernietigend! -20')); }
      else if (s >= 1) S.rep += g.vip ? 3 : 1; else if (s < .6) S.rep -= 2;
      r.gg = null; r.g = '';
      if (sf('sch') > 0) { r.st = 'dirty'; r.until = Date.now() + 10000 / sf('sch'); } else { r.st = 'dirty'; r.until = 0; }
      if (S.rep < 0) S.rep = 0;
    };
    const step = () => {
      const now = Date.now();
      S.nextGuest -= 1; if (S.nextGuest <= 0) { spawn(); S.nextGuest = 9 / (1 + .25 * stars()) * rnd(.7, 1.3); }
      for (let i = S.queue.length - 1; i >= 0; i--) { S.queue[i].pat -= 1; if (S.queue[i].pat <= 0) { const g = S.queue.splice(i, 1)[0]; S.rep = Math.max(0, S.rep - (g.crit ? 20 : 1)); log(g.name + ' liep boos weg.'); } }
      for (const r of S.rooms) {
        if (r.st === 'busy' && now >= r.until) checkout(r);
        else if (r.st === 'dirty' && r.until && now >= r.until) r.st = 'free';
      }
      for (let k = 0; k < sf('rec'); k++) { if (!S.queue.length) break; const bi = bestRoom(S.queue[0]); if (bi >= 0) assign(0, bi); else break; }
      S.nextEvent -= 1;
      if (S.event && S.nextEvent <= 0) { S.event = null; S.nextEvent = 100; }
      else if (!S.event && S.nextEvent <= 0) { S.event = pick(Object.keys(EVENTS)); S.nextEvent = 60; }
    };
    const A = app(host, api, {
      bg: 'linear-gradient(#1e2a4a,#2c1f3d)', acc: '#e0a526', tabs: [['rec', '🛎️ Receptie'], ['room', '🛏️ Kamers'], ['staff', '👥 Team'], ['goal', '🏆 Doelen']],
      state: () => { S.last = Date.now(); return S; },
      tick: dt => { for (let i = 0; i < Math.ceil(Math.min(dt, 30)); i++) step(); S.last = Date.now(); },
      head: el => {
        $('div', 'font-size:20px;font-weight:800', '🏨 Hotelbaas  ' + '⭐'.repeat(stars()), el);
        const r = row(el, 'justify-content:space-between;font-size:15px;margin-top:4px'); $('span', 'color:#ffd86b;font-weight:700', '💰 ' + eur(S.money), r); $('span', '', '❤️ Reputatie ' + fmt(S.rep), r); $('span', '', '🧳 ' + fmt(S.served), r);
        if (welcome) { $('div', 'background:#2a6;border-radius:10px;padding:6px 10px;margin-top:6px;font-size:13px', welcome, el); }
      },
      render: (tab, b) => {
        if (tab === 'rec') {
          if (S.event) { const ev = EVENTS[S.event](); const c = card(b, 'background:#6a3dd6'); $('div', 'font-weight:800;font-size:16px', ev.t, c); $('div', 'font-size:13px;margin:4px 0', ev.d, c); for (const op of ev.o) btn(c, op.l, () => { op.f(); S.event = null; S.nextEvent = 90 + ri(0, 60); A.commit(); }, false, 'margin-right:6px;background:#e0a526;color:#222'); }
          $('div', 'font-weight:700;margin:6px 0', '🚪 Lobby (' + S.queue.length + '/8)', b);
          if (!S.queue.length) $('div', 'opacity:.7;font-size:13px', 'Geen wachtende gasten...', b);
          S.queue.forEach((g, gi) => {
            const c = card(b); const r = row(c);
            $('div', 'font-size:30px', g.e, r); const t = $('div', 'flex:1;font-size:13px', null, r);
            $('div', 'font-weight:700', g.name + (g.vip ? ' 💎' : '') + (g.crit ? ' 🕵️' : ''), t);
            $('div', '', 'Wil minimaal: ' + TYPES[g.want].e + ' ' + TYPES[g.want].n + (g.feat ? ' + ' + FEAT.find(f => f.id === g.feat).e : '') + ' · betaalt ' + g.pay + 'x', t);
            bar(t, g.pat / (50 + 15 * sf('con')), g.pat < 15 ? '#f55' : '#4ade80');
            const free = S.rooms.map((rm, i) => [rm, i]).filter(x => x[0].st === 'free');
            if (!free.length) $('div', 'font-size:12px;opacity:.7', 'Geen vrije kamer!', c);
            const rr = row(c, 'flex-wrap:wrap');
            free.slice(0, 8).forEach(([rm, i]) => btn(rr, TYPES[rm.t].e + (i + 1) + rm.f.map(f => FEAT.find(x => x.id === f).e).join(''), () => { assign(gi, i); A.commit(); }, false, 'min-width:48px;padding:6px;font-size:13px'));
          });
          if (S.log.length) { const c = card(b, 'font-size:12px;opacity:.8'); for (const l of S.log) $('div', '', '• ' + l, c); }
        } else if (tab === 'room') {
          S.rooms.forEach((r, i) => {
            const T = TYPES[r.t], c = card(b), h = row(c, 'justify-content:space-between');
            $('div', 'font-weight:700', T.e + ' Kamer ' + (i + 1) + ' · ' + T.n, h);
            $('div', 'font-size:12px', r.st === 'free' ? '✅ vrij' : r.st === 'busy' ? '🧳 ' + r.g + ' (' + fmtT((r.until - Date.now()) / 1000) + ')' : '🧺 vuil', h);
            if (r.st === 'dirty' && !sf('sch')) btn(c, '🧹 Schoonmaken', () => { r.st = 'free'; A.commit(); });
            const fr = row(c, 'flex-wrap:wrap;gap:4px');
            for (const f of FEAT) { const has = r.f.includes(f.id), cost = f.c * (r.t + 1); btn(fr, f.e + (has ? ' ✓' : ' ' + eur(cost)), () => { S.money -= cost; r.f.push(f.id); A.commit(); }, has || S.money < cost, 'font-size:12px;padding:4px 8px;' + (has ? 'background:#2a8' : '')); }
            if (r.t < TYPES.length - 1 && r.st === 'free') { const nt = TYPES[r.t + 1], cost = Math.round(nt.c * .6); btn(c, '⬆️ Verbouw naar ' + nt.n + ' (' + eur(cost) + ')' + (stars() < nt.s ? ' 🔒' + nt.s + '⭐' : ''), () => { S.money -= cost; r.t++; A.commit(); }, S.money < cost || stars() < nt.s, 'background:linear-gradient(#a855f7,#7e22ce);font-size:12px'); }
          });
          $('div', 'font-weight:700;margin-top:10px', '🏗️ Nieuwe kamer bouwen (' + S.rooms.length + '/20)', b);
          TYPES.forEach((T, ti) => { const cost = Math.round(T.c * Math.pow(1.1, S.rooms.length)); btn(b, T.e + ' ' + T.n + ' · ' + eur(cost) + (stars() < T.s ? ' 🔒' + T.s + '⭐' : ''), () => { S.money -= cost; S.rooms.push(newRoom(ti)); A.commit(); }, S.money < cost || stars() < T.s || S.rooms.length >= 20, 'display:block;width:100%'); });
        } else if (tab === 'staff') {
          for (const s of STAFF) { const n = sf(s.id), cost = Math.round(s.c * Math.pow(1.7, n)), c = card(b); $('div', 'font-weight:700', s.e + ' ' + s.n + ' ×' + n, c); $('div', 'font-size:12px;opacity:.85', s.d, c); btn(c, 'Aannemen · ' + eur(cost), () => { S.money -= cost; S.staff[s.id] = n + 1; A.commit(); }, S.money < cost || n >= 10); }
          $('div', 'font-size:12px;opacity:.7', 'Tip: receptionist + schoonmaker laten het hotel ook draaien als je weg bent (max 8 uur).', b);
        } else {
          const goals = [['⭐ 2 sterren', stars() >= 2], ['⭐⭐⭐ 3 sterren', stars() >= 3], ['⭐⭐⭐⭐⭐ 5 sterren: legendarisch hotel', stars() >= 5], ['🛏️ 10 kamers', S.rooms.length >= 10], ['🧳 100 gasten bediend', S.served >= 100], ['💰 1 miljoen verdiend', S.earned >= 1e6], ['👑 Een Suite gebouwd', S.rooms.some(r => r.t >= 3)]];
          const c = card(b); $('div', 'font-weight:800', 'Doelen', c);
          for (const [t, ok] of goals) $('div', 'padding:6px 0;' + (ok ? 'color:#4ade80' : 'opacity:.7'), (ok ? '✅ ' : '⬜ ') + t, c);
          const nx = REPS[stars()]; if (nx) $('div', 'font-size:13px;margin-top:6px', 'Volgende ster bij ' + fmt(nx) + ' reputatie.', c);
          $('div', 'font-size:13px;opacity:.8', 'Totaal verdiend: ' + eur(S.earned), c);
        }
      },
    });
    return { destroy() { A.destroy(); } };
  },
};
