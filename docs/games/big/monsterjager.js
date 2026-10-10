// Monsterjager: vang monsters, train ze en laat ze automatisch vechten in de arena.
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
const BTN = 'min-height:44px;padding:8px 12px;border:0;border-radius:12px;font:600 14px system-ui;color:#fff;background:linear-gradient(135deg,#16a34a,#0d9488);cursor:pointer;';
const B = (txt, fn, p, css, dis) => {
  const b = H('button', BTN + (css || '') + (dis ? 'opacity:.4;' : ''), txt, p);
  b.onclick = () => { if (!dis) fn(); };
  return b;
};

const SP = [
  { n: 'Kikkerpop', e: '🐸', r: 0, z: 0, b: 5 },
  { n: 'Hopperd', e: '🐰', r: 0, z: 0, b: 5 },
  { n: 'Bijtje', e: '🐝', r: 1, z: 0, b: 7 },
  { n: 'Vuurvos', e: '🦊', r: 0, z: 1, b: 8 },
  { n: 'Nachtuil', e: '🦉', r: 1, z: 1, b: 10 },
  { n: 'Maanwolf', e: '🐺', r: 2, z: 1, b: 13 },
  { n: 'Grotvleer', e: '🦇', r: 0, z: 2, b: 12 },
  { n: 'Webspin', e: '🕷️', r: 1, z: 2, b: 15 },
  { n: 'Grotdraak', e: '🐉', r: 2, z: 2, b: 19 },
  { n: 'Sterrenwezen', e: '👾', r: 3, z: 2, b: 26 },
  { n: 'Lavakrab', e: '🦀', r: 0, z: 3, b: 17 },
  { n: 'Vuurgeest', e: '🔥', r: 1, z: 3, b: 21 },
  { n: 'Zonnehoorn', e: '🦄', r: 3, z: 3, b: 30 },
];
const RAR = ['Gewoon', 'Zeldzaam', 'Episch', 'Legendarisch'];
const RCOL = ['#94a3b8', '#38bdf8', '#c084fc', '#fbbf24'];
const ZONES = [
  { n: 'Zonnige weide', e: '🌼', need: 0 },
  { n: 'Fluisterbos', e: '🌲', need: 3 },
  { n: 'Echo-grot', e: '🕳️', need: 8 },
  { n: 'Vulkaanrand', e: '🌋', need: 15 },
];
const ENEMY = [['Wilde Slijmbal', '🟢'], ['Boze Kraai', '🐦‍⬛'], ['Stekelvarken', '🦔'], ['Reuzenmier', '🐜'], ['Ruwe Beer', '🐻'], ['Spookje', '👻'], ['Steengolem', '🗿'], ['IJsdraak', '🐲']];

export default {
  id: 'monsterjager', name: 'Monsterjager', emoji: '🎯', desc: 'Vang monsters, train ze en laat ze vechten in de arena.',
  async create(host, api) {
    const def = { coins: 80, mons: [{ id: 1, sp: 0, lv: 1, xp: 0 }], team: [1], nid: 2, stage: 0, best: 0, net: 0, dex: { 0: 1 }, last: Date.now(), wins: 0, zone: 0 };
    let S = Object.assign({}, def, (await api.load()) || {});
    let alive = true, tab = 'vang', msg = '', F = null, A = {};
    host.style.cssText += ';background:linear-gradient(#0f2a1d,#0b1a14);color:#e8fff1;font-family:system-ui,sans-serif;';
    const root = H('div', 'max-width:430px;margin:0 auto;padding:10px;box-sizing:border-box;', null, host);
    const save = () => { S.last = Date.now(); api.save(S); };
    const mon = (id) => S.mons.find((m) => m.id === id);
    const pw = (m) => Math.round(SP[m.sp].b * (1 + 0.25 * (m.lv - 1)));
    const trainCost = (m) => Math.round(10 * Math.pow(m.lv, 1.6));
    const teamPower = () => S.team.reduce((a, id) => a + (mon(id) ? pw(mon(id)) : 0), 0);

    // Offline voortgang: team verdient munten terwijl je weg bent
    const away = Math.min((Date.now() - (S.last || Date.now())) / 60000, 480);
    if (away > 1) {
      const gain = Math.floor(away * (2 + teamPower() * 0.15));
      S.coins += gain;
      msg = 'Terwijl je weg was verdiende je team ' + fmt(gain) + ' munten!';
      api.toast('Offline: +' + fmt(gain) + ' munten');
    }

    function newFight() {
      const st = S.stage;
      const mx = Math.round(40 * Math.pow(1.2, st));
      const en = ENEMY[st % ENEMY.length];
      F = { emax: mx, ehp: mx, eatk: Math.round(5 * Math.pow(1.17, st)), en: en[0], ee: en[1], hp: S.team.map((id) => (mon(id) ? pw(mon(id)) * 5 : 0)), mhp: S.team.map((id) => (mon(id) ? pw(mon(id)) * 5 : 0)), log: ['Een ' + en[0] + ' verschijnt!'] };
    }
    function say(t) { F.log.unshift(t); if (F.log.length > 5) F.log.pop(); }

    function tick() {
      if (!alive) return;
      if (S.team.length === 0) { if (tab === 'arena') updArena(); return; }
      if (!F) newFight();
      let any = false;
      S.team.forEach((id, i) => {
        const m = mon(id);
        if (!m || F.hp[i] <= 0) return;
        any = true;
        F.ehp -= pw(m) * (0.8 + Math.random() * 0.4);
      });
      if (F.ehp <= 0) {
        const rew = Math.round(15 + S.stage * 10);
        S.coins += rew; S.wins++;
        S.team.forEach((id) => {
          const m = mon(id); if (!m) return;
          m.xp += 5 + S.stage;
          while (m.lv < 30 && m.xp >= m.lv * 10) { m.xp -= m.lv * 10; m.lv++; api.toast(SP[m.sp].n + ' is nu level ' + m.lv + '!'); }
        });
        S.stage++; if (S.stage > S.best) S.best = S.stage;
        save();
        const old = F.en;
        newFight(); say('Gewonnen van ' + old + '! +' + rew + ' munten');
      } else if (any) {
        const alive2 = S.team.map((_, i) => i).filter((i) => F.hp[i] > 0);
        const j = alive2[Math.floor(Math.random() * alive2.length)];
        F.hp[j] -= F.eatk * (0.8 + Math.random() * 0.4);
        if (F.hp[j] <= 0) say(SP[mon(S.team[j]).sp].n + ' is uitgeschakeld!');
        if (F.hp.every((x) => x <= 0)) { say('Team verslagen! Even uitrusten...'); const lg = F.log; newFight(); F.log = lg; }
      }
      if (tab === 'arena') updArena();
      if (tab !== 'arena') { const c = root.querySelector('[data-coins]'); if (c) c.textContent = '🪙 ' + fmt(S.coins); }
    }

    function updArena() {
      if (!A.log) return;
      if (!F) { A.log.textContent = 'Kies eerst een team in je verzameling.'; return; }
      A.en.textContent = F.ee + ' ' + F.en + ' (ronde ' + (S.stage + 1) + ')';
      A.ebar.style.width = Math.max(0, (F.ehp / F.emax) * 100) + '%';
      A.log.innerHTML = '';
      F.log.forEach((l) => H('div', 'font-size:13px;opacity:.85;padding:2px 0;', l, A.log));
      A.team.forEach((el, i) => { el.style.width = Math.max(0, (F.hp[i] / F.mhp[i]) * 100) + '%'; });
      A.coins.textContent = '🪙 ' + fmt(S.coins);
    }

    function render() {
      const st = host.scrollTop;
      root.innerHTML = ''; A = {};
      const top = H('div', 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;', null, root);
      H('div', 'font:800 20px system-ui;', '🎯 Monsterjager', top);
      const c = H('div', 'font:700 16px system-ui;background:#0006;padding:6px 12px;border-radius:20px;', '🪙 ' + fmt(S.coins), top);
      c.setAttribute('data-coins', '1');
      const tabs = H('div', 'display:flex;gap:6px;margin-bottom:10px;', null, root);
      [['vang', '🎯 Vangen'], ['dex', '📖 Verzameling'], ['arena', '⚔️ Arena']].forEach(([k, l]) => {
        B(l, () => { tab = k; render(); }, tabs, 'flex:1;font-size:13px;' + (tab === k ? '' : 'background:#1f3a2c;'));
      });
      if (msg) H('div', 'background:#0a3d2a;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:14px;', msg, root);
      if (tab === 'vang') vang(); else if (tab === 'dex') dex(); else arena();
      host.scrollTop = st;
    }

    function vang() {
      const nc = 0.04 * S.net;
      H('div', 'font-size:13px;opacity:.8;margin-bottom:6px;', 'Kies een gebied. Nieuwe gebieden ontgrendel je door in de arena te winnen.', root);
      ZONES.forEach((z, zi) => {
        const open = S.best >= z.need;
        const cost = 8 * (zi + 1);
        const card = H('div', 'background:#14382a;border-radius:14px;padding:10px;margin-bottom:8px;' + (open ? '' : 'opacity:.55;'), null, root);
        H('div', 'font:700 16px system-ui;', z.e + ' ' + z.n, card);
        const here = SP.filter((s) => s.z === zi);
        H('div', 'font-size:13px;margin:4px 0;', here.map((s) => (S.dex[SP.indexOf(s)] ? s.e : '❓')).join(' '), card);
        if (!open) H('div', 'font-size:12px;', '🔒 Bereik arenaronde ' + (z.need + 1), card);
        else B('Net uitwerpen (🪙 ' + cost + ')', () => {
          if (S.coins < cost) { msg = 'Je hebt te weinig munten. Win een arenagevecht!'; render(); return; }
          S.coins -= cost;
          const pool = [];
          SP.forEach((s, i) => { if (s.z === zi) for (let k = 0; k < 4 - s.r; k++) pool.push(i); });
          const si = pool[Math.floor(Math.random() * pool.length)];
          const sp = SP[si];
          const chance = Math.max(0.1, 0.85 - 0.2 * sp.r + nc);
          if (Math.random() < chance) {
            S.mons.push({ id: S.nid++, sp: si, lv: 1, xp: 0 });
            S.dex[si] = (S.dex[si] || 0) + 1;
            msg = '🎉 Gevangen: ' + sp.e + ' ' + sp.n + ' (' + RAR[sp.r] + ')!';
            if (S.team.length < 3) S.team.push(S.nid - 1);
          } else msg = sp.e + ' ' + sp.n + ' ontsnapte (kans was ' + Math.round(chance * 100) + '%).';
          save(); render();
        }, card, 'width:100%;');
      });
      const nc2 = 100 * Math.pow(2, S.net);
      const nb = H('div', 'background:#14382a;border-radius:14px;padding:10px;', null, root);
      H('div', 'font-weight:700;', '🕸️ Net niveau ' + S.net + ' (+' + S.net * 4 + '% vangkans)', nb);
      B(S.net >= 8 ? 'Maximaal' : 'Verbeter net (🪙 ' + fmt(nc2) + ')', () => { S.coins -= nc2; S.net++; msg = 'Je net is sterker!'; save(); render(); }, nb, 'width:100%;margin-top:6px;', S.net >= 8 || S.coins < nc2);
    }

    function dex() {
      H('div', 'font-size:13px;opacity:.85;margin-bottom:6px;', 'Team (' + S.team.length + '/3) vecht automatisch. Ontdekt: ' + Object.keys(S.dex).length + '/' + SP.length, root);
      const list = S.mons.slice().sort((a, b) => pw(b) - pw(a));
      list.forEach((m) => {
        const sp = SP[m.sp];
        const inT = S.team.includes(m.id);
        const card = H('div', 'background:#14382a;border-left:5px solid ' + RCOL[sp.r] + ';border-radius:12px;padding:8px 10px;margin-bottom:8px;', null, root);
        H('div', 'font:700 15px system-ui;', sp.e + ' ' + sp.n + ' · lvl ' + m.lv + (inT ? ' ⭐' : ''), card);
        H('div', 'font-size:12px;opacity:.8;', RAR[sp.r] + ' · kracht ' + pw(m) + ' · xp ' + m.xp + '/' + m.lv * 10, card);
        const row = H('div', 'display:flex;gap:6px;margin-top:6px;', null, card);
        const tc = trainCost(m);
        B(m.lv >= 30 ? 'Max' : 'Train 🪙' + fmt(tc), () => { S.coins -= tc; m.lv++; m.xp = 0; F = null; save(); render(); }, row, 'flex:1;font-size:12px;', m.lv >= 30 || S.coins < tc);
        B(inT ? 'Uit team' : 'In team', () => {
          if (inT) S.team = S.team.filter((x) => x !== m.id);
          else if (S.team.length < 3) S.team.push(m.id);
          else { msg = 'Team zit vol (max 3).'; }
          F = null; save(); render();
        }, row, 'flex:1;font-size:12px;background:#0369a1;');
        if (!inT && S.mons.length > 1) B('Laat los 🪙' + 5 * (sp.r + 1) * m.lv, () => { S.coins += 5 * (sp.r + 1) * m.lv; S.mons = S.mons.filter((x) => x.id !== m.id); save(); render(); }, row, 'font-size:12px;background:#7f1d1d;');
      });
    }

    function arena() {
      const box = H('div', 'background:#14382a;border-radius:14px;padding:12px;', null, root);
      if (S.team.length === 0) { H('div', '', 'Je team is leeg. Zet monsters in je team via Verzameling.', box); return; }
      A.en = H('div', 'font:700 16px system-ui;margin-bottom:6px;', '', box);
      const eb = H('div', 'height:12px;background:#0006;border-radius:6px;overflow:hidden;', null, box);
      A.ebar = H('div', 'height:100%;background:#ef4444;width:100%;', null, eb);
      H('div', 'margin:12px 0 4px;font-size:13px;opacity:.8;', 'Jouw team (vecht automatisch)', box);
      A.team = [];
      S.team.forEach((id) => {
        const m = mon(id); if (!m) return;
        H('div', 'font-size:13px;margin-top:4px;', SP[m.sp].e + ' ' + SP[m.sp].n + ' lvl ' + m.lv, box);
        const bar = H('div', 'height:8px;background:#0006;border-radius:6px;overflow:hidden;', null, box);
        A.team.push(H('div', 'height:100%;background:#22c55e;width:100%;', null, bar));
      });
      A.log = H('div', 'margin-top:10px;min-height:70px;', '', box);
      A.coins = H('div', 'margin-top:6px;font-weight:700;', '', box);
      H('div', 'font-size:12px;opacity:.7;margin-top:6px;', 'Beste ronde: ' + (S.best + 1) + ' · overwinningen: ' + fmt(S.wins) + ' · teamkracht ' + teamPower(), box);
      B('Naar eerdere ronde', () => { if (S.stage > 0) { S.stage--; F = null; save(); render(); } }, box, 'margin-top:8px;width:100%;background:#334155;', S.stage === 0);
      updArena();
    }

    render();
    const iv1 = setInterval(tick, 1000);
    const iv2 = setInterval(save, 10000);
    return {
      destroy() { alive = false; clearInterval(iv1); clearInterval(iv2); save(); },
    };
  },
};
