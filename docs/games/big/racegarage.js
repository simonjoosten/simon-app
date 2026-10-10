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
const MODELS = [
  { n: 'Roestbak', e: '🚗', c: 0, s: [30, 30, 30, 45] }, { n: 'Sporty Hatchback', e: '🚙', c: 3500, s: [45, 45, 48, 50] },
  { n: 'Sportcoupé', e: '🏎️', c: 22000, s: [60, 60, 62, 55] }, { n: 'Supersport', e: '🏁', c: 140000, s: [78, 78, 80, 62] }, { n: 'Hypercar', e: '🚀', c: 900000, s: [95, 95, 98, 70] },
];
const PARTS = [{ id: 0, n: 'Motor', e: '🔧', st: 'Topsnelheid' }, { id: 1, n: 'Banden & ophanging', e: '🛞', st: 'Grip' }, { id: 2, n: 'Turbo', e: '💨', st: 'Acceleratie' }, { id: 3, n: 'Betrouwbaarheid', e: '🛠️', st: 'Betrouwbaarheid' }];
const TRACKS = [
  { n: 'Snelweg Circuit', e: '🛣️', w: [.5, .15, .25, .1], risk: .06, d: 'Lange rechte stukken: topsnelheid telt.' },
  { n: 'Bergpas', e: '⛰️', w: [.1, .55, .2, .15], risk: .1, d: 'Bochtig: grip is koning.' },
  { n: 'Stadsrace', e: '🏙️', w: [.15, .3, .4, .15], risk: .08, d: 'Veel optrekken tussen de muren.' },
  { n: 'Woestijnrally', e: '🏜️', w: [.2, .2, .15, .45], risk: .14, d: 'Zwaar voor de auto: betrouwbaar blijven!' },
];
const TIERS = [{ n: 'Bronzen Beker', e: '🥉', base: 34, prize: 400, ent: 0 }, { n: 'Zilveren Cup', e: '🥈', base: 52, prize: 2500, ent: 1 }, { n: 'Gouden Liga', e: '🥇', base: 72, prize: 20000, ent: 2 }, { n: 'Wereldkampioenschap', e: '🏆', base: 96, prize: 150000, ent: 3 }];
const AINAMES = ['Max Snelweg', 'Dirk Draai', 'Tess Turbo', 'Rik Remspoor', 'Fien Fastlane', 'Gerrit Gaspedaal', 'Lola Lak'];
const TY = { soft: { n: 'Soft 🔴', dry: 1.08, rain: .95 }, hard: { n: 'Hard ⚪', dry: 1, rain: .93 }, regen: { n: 'Regen 🔵', dry: .88, rain: 1.12 } };
const ST = { aggr: { n: 'Aanvallen 🔥', m: 1.05, v: 14, r: 1.6 }, bal: { n: 'Gebalanceerd ⚖️', m: 1, v: 8, r: 1 }, safe: { n: 'Veilig 🛡️', m: .96, v: 4, r: .5 } };
const POINTS = [25, 18, 15, 12, 10, 8];
const eur = n => '€' + fmt(n);
export default {
  id: 'racegarage', name: 'Race Garage', emoji: '🏎️', desc: 'Koop en tune auto\'s en win kampioenschappen.',
  async create(host, api) {
    const d = await api.load();
    const S = Object.assign({ money: 300, cars: [{ m: 0, up: [0, 0, 0, 0] }], sel: 0, tyre: 'hard', strat: 'bal', champ: null, tierWins: [0, 0, 0, 0], wins: 0, races: 0, last: Date.now(), res: null, weather: null }, d || {});
    const stats = c => MODELS[c.m].s.map((v, i) => v + c.up[i] * 4);
    const sponsor = () => 2 + S.wins * 3 + S.tierWins.reduce((a, b, i) => a + b * 20 * (i + 1), 0);
    const off = Math.min((Date.now() - S.last) / 1000, 28800);
    let msg = '';
    if (off > 60) { const g = sponsor() * off / 60; S.money += g; msg = 'Sponsors betaalden ' + eur(g) + ' terwijl je weg was.'; api.toast(msg); }
    S.last = Date.now();
    const newWeather = () => { const rain = Math.random() < .35; S.weather = { rain, fc: Math.random() < .75 ? rain : !rain }; };
    if (!S.weather) newWeather();
    const unlocked = t => t === 0 || S.tierWins[t - 1] > 0;
    const perf = (st, tr, rain, ty, sr, noise) => {
      const base = st[0] * tr.w[0] + st[1] * tr.w[1] + st[2] * tr.w[2] + st[3] * tr.w[3];
      return base * TY[ty][rain ? 'rain' : 'dry'] * ST[sr].m + (Math.random() - .5) * 2 * (noise !== undefined ? noise : ST[sr].v);
    };
    const race = (tier, tr, prizeMul) => {
      const car = S.cars[S.sel], st = stats(car), rain = S.weather.rain;
      const me = { n: 'Jij', me: true, p: perf(st, tr, rain, S.tyre, S.strat), dnf: false };
      const dnfP = clamp(tr.risk * ST[S.strat].r * (1 - st[3] / 130) + .01, .01, .6);
      if (Math.random() < dnfP) me.dnf = true;
      const ai = shuffle(AINAMES).slice(0, 5).map((n, i) => {
        const ar = TIERS[tier].base + (i - 2) * 4;
        return { n, p: ar + (Math.random() - .5) * 18, dnf: Math.random() < .04 };
      });
      const all = [me, ...ai].sort((a, b) => (a.dnf - b.dnf) || (b.p - a.p));
      const pos = all.findIndex(x => x.me);
      const T = TIERS[tier];
      const prize = me.dnf ? 0 : Math.round(T.prize * prizeMul * [1, .6, .4, .25, .15, .1][pos]);
      S.money += prize; S.races++; if (pos === 0 && !me.dnf) S.wins++;
      const text = me.dnf ? '💥 Je valt uit met pech! Misschien meer betrouwbaarheid of een veiliger strategie?' : pos === 0 ? '🏆 Je wint de race!' : pos < 3 ? '🥈 Podium! Goed gereden.' : 'Je finisht als ' + (pos + 1) + 'e.';
      S.res = { track: tr.n, rain, order: all.map(x => ({ n: x.n, me: !!x.me, dnf: x.dnf })), pos, dnf: me.dnf, prize, text };
      if (S.champ) {
        const c = S.champ;
        all.forEach((x, i) => { c.pts[x.n] = (c.pts[x.n] || 0) + (x.dnf ? 0 : (POINTS[i] || 0)); });
        c.i++;
        if (c.i >= c.tracks.length) {
          const rank = Object.entries(c.pts).sort((a, b) => b[1] - a[1]);
          const mypos = rank.findIndex(x => x[0] === 'Jij');
          const bonus = Math.round(TIERS[c.tier].prize * [6, 3, 1.5][mypos] || 0);
          if (mypos === 0) { S.tierWins[c.tier]++; }
          S.money += bonus;
          S.res.final = (mypos === 0 ? '🎉 KAMPIOEN van de ' + TIERS[c.tier].n + '! ' : 'Eindstand: ' + (mypos + 1) + 'e. ') + (bonus ? 'Bonus ' + eur(bonus) + '.' : 'Geen bonus.');
          S.champ = null;
        }
      }
      newWeather();
    };
    const A = app(host, api, {
      bg: 'linear-gradient(#1c1c24,#3a0f14)', acc: '#e11d2e', tabs: [['race', '🏁 Race'], ['garage', '🔧 Garage'], ['shop', '🛒 Winkel'], ['champ', '🏆 Kampioen']],
      state: () => { S.last = Date.now(); return S; },
      tick: dt => { S.money += sponsor() * dt / 60; S.last = Date.now(); },
      head: el => { $('div', 'font-size:20px;font-weight:800', '🏎️ Race Garage', el); const r = row(el, 'justify-content:space-between;margin-top:4px'); $('span', 'color:#ffd86b;font-weight:700', '💰 ' + eur(S.money), r); $('span', 'font-size:12px', '🏆 ' + S.wins + ' zeges · 📣 ' + eur(sponsor()) + '/min', r); },
      render: (tab, b) => {
        const car = S.cars[S.sel], st = stats(car);
        if (tab === 'race') {
          const c = card(b); $('div', 'font-weight:800', MODELS[car.m].e + ' ' + MODELS[car.m].n, c);
          $('div', 'font-size:12px;opacity:.85', 'Top ' + st[0] + ' · Grip ' + st[1] + ' · Accel ' + st[2] + ' · Betrouw. ' + st[3], c);
          const w = S.weather; $('div', 'margin-top:6px', 'Voorspelling: ' + (w.fc ? '🌧️ regen' : '☀️ droog') + ' (niet altijd juist!)', c);
          $('div', 'font-weight:700;margin-top:6px', 'Banden', c); const r1 = row(c);
          for (const k in TY) btn(r1, TY[k].n, () => { S.tyre = k; A.commit(); }, false, 'flex:1;font-size:12px;' + (S.tyre === k ? 'background:#e11d2e' : 'background:#444'));
          $('div', 'font-weight:700;margin-top:6px', 'Strategie', c); const r2 = row(c);
          for (const k in ST) btn(r2, ST[k].n, () => { S.strat = k; A.commit(); }, false, 'flex:1;font-size:12px;' + (S.strat === k ? 'background:#e11d2e' : 'background:#444'));
          if (S.champ) {
            const ch = S.champ, tr = TRACKS[ch.tracks[ch.i]];
            const c2 = card(b, 'border:2px solid #ffd86b'); $('div', 'font-weight:800', TIERS[ch.tier].e + ' ' + TIERS[ch.tier].n + ' · race ' + (ch.i + 1) + '/' + ch.tracks.length, c2);
            $('div', '', tr.e + ' ' + tr.n + ' – ' + tr.d, c2);
            btn(c2, '🚦 Start kampioenschapsrace', () => { race(ch.tier, tr, 1); A.commit(); }, false, 'width:100%;background:#e11d2e');
          } else $('div', 'opacity:.8;font-size:13px;margin:6px 0', 'Start een kampioenschap in het tabblad Kampioen, of rijd een losse race:', b);
          if (!S.champ) TRACKS.forEach(tr => { const tier = [0, 1, 2, 3].filter(unlocked).pop(); btn(b, tr.e + ' ' + tr.n + ' (vrije race ' + TIERS[tier].e + ')', () => { race(tier, tr, .3); A.commit(); }, false, 'display:block;width:100%;background:#444;font-size:13px'); });
          if (S.res) {
            const r = S.res, c3 = card(b, 'background:rgba(255,255,255,.16)');
            $('div', 'font-weight:800', 'Uitslag · ' + r.track + (r.rain ? ' 🌧️' : ' ☀️'), c3); $('div', 'margin:4px 0', r.text + (r.prize ? ' Prijs ' + eur(r.prize) + '.' : ''), c3);
            r.order.forEach((x, i) => $('div', 'font-size:13px;' + (x.me ? 'color:#ffd86b;font-weight:700' : ''), (i + 1) + '. ' + x.n + (x.dnf ? ' (uitgevallen)' : ''), c3));
            if (r.final) $('div', 'margin-top:6px;font-weight:800;color:#4ade80', r.final, c3);
          }
        } else if (tab === 'garage') {
          S.cars.forEach((cr, i) => {
            const M = MODELS[cr.m], s = stats(cr), c = card(b, i === S.sel ? 'outline:2px solid #e11d2e' : '');
            $('div', 'font-weight:800', M.e + ' ' + M.n + (i === S.sel ? ' (in gebruik)' : ''), c);
            if (i !== S.sel) btn(c, 'Kies deze auto', () => { S.sel = i; A.commit(); }, false, 'background:#444');
            PARTS.forEach(p => { const lv = cr.up[p.id], cost = Math.round(120 * Math.pow(1.6, lv) * (1 + cr.m * 1.2)); const r = row(c, 'justify-content:space-between'); $('div', 'font-size:12px;flex:1', p.e + ' ' + p.st + ' ' + s[p.id] + ' (niv ' + lv + '/10)', r); btn(r, lv >= 10 ? 'MAX' : eur(cost), () => { S.money -= cost; cr.up[p.id]++; A.commit(); }, lv >= 10 || S.money < cost, 'font-size:12px;min-width:80px'); });
            if (S.cars.length > 1) btn(c, 'Verkoop voor ' + eur(MODELS[cr.m].c * .5 + cr.up.reduce((a, v) => a + v, 0) * 50), () => { S.money += MODELS[cr.m].c * .5 + cr.up.reduce((a, v) => a + v, 0) * 50; S.cars.splice(i, 1); if (S.sel >= S.cars.length || S.sel === i) S.sel = 0; A.commit(); }, false, 'background:#7a2020;font-size:12px');
          });
        } else if (tab === 'shop') {
          MODELS.forEach((M, i) => { if (i === 0) return; const c = card(b), owned = S.cars.filter(x => x.m === i).length; $('div', 'font-weight:800', M.e + ' ' + M.n + (owned ? ' (bezit ' + owned + ')' : ''), c); $('div', 'font-size:12px;opacity:.85', 'Top ' + M.s[0] + ' · Grip ' + M.s[1] + ' · Accel ' + M.s[2] + ' · Betrouw. ' + M.s[3], c); btn(c, 'Koop · ' + eur(M.c), () => { S.money -= M.c; S.cars.push({ m: i, up: [0, 0, 0, 0] }); S.sel = S.cars.length - 1; A.commit(); }, S.money < M.c || S.cars.length >= 8); });
        } else {
          if (S.champ) { const ch = S.champ, c = card(b); $('div', 'font-weight:800', 'Stand ' + TIERS[ch.tier].n, c); Object.entries(ch.pts).sort((a, b2) => b2[1] - a[1]).forEach(([n, p], i) => $('div', n === 'Jij' ? 'color:#ffd86b;font-weight:700' : '', (i + 1) + '. ' + n + ' – ' + p + ' punten', c)); btn(c, 'Opgeven', () => { S.champ = null; A.commit(); }, false, 'background:#7a2020'); }
          else TIERS.forEach((T, ti) => { const c = card(b), ok = unlocked(ti); $('div', 'font-weight:800', T.e + ' ' + T.n + (S.tierWins[ti] ? ' · ' + S.tierWins[ti] + 'x gewonnen' : ''), c); $('div', 'font-size:12px;opacity:.85', 'Tegenstanders niveau ' + T.base + ' · 4 races · prijzengeld tot ' + eur(T.prize) + ' per race', c); btn(c, ok ? 'Doe mee' : '🔒 Win eerst de vorige', () => { S.champ = { tier: ti, i: 0, tracks: shuffle([0, 1, 2, 3]), pts: { Jij: 0 } }; A.go('race'); api.save(S); }, !ok); });
        }
      },
    });
    return { destroy() { A.destroy(); } };
  },
};
