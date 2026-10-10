// Kaartenverzamelaar: open pakjes, verzamel kaarten en versla de computer in kaartgevechten.
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
const BTN = 'min-height:44px;padding:8px 12px;border:0;border-radius:12px;font:600 14px system-ui;color:#fff;background:linear-gradient(135deg,#0891b2,#4f46e5);cursor:pointer;';
const B = (txt, fn, p, css, dis) => {
  const b = H('button', BTN + (css || '') + (dis ? 'opacity:.4;' : ''), txt, p);
  b.onclick = () => { if (!dis) fn(); };
  return b;
};
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pickOf = (a) => a[Math.floor(Math.random() * a.length)];
const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

const LIST = [
  [0, '🐀', 'Ratje'], [0, '🐔', 'Kip'], [0, '🐟', 'Vis'], [0, '🦆', 'Eend'], [0, '🐢', 'Schildpad'], [0, '🐛', 'Rups'], [0, '🦀', 'Krab'],
  [0, '🐑', 'Schaap'], [0, '🐷', 'Varken'], [0, '🐸', 'Kikker'], [0, '🐌', 'Slak'], [0, '🐝', 'Bij'], [0, '🦉', 'Uil'], [0, '🐇', 'Haas'],
  [1, '🐺', 'Wolf'], [1, '🦊', 'Vos'], [1, '🦅', 'Adelaar'], [1, '🐊', 'Krokodil'], [1, '🐍', 'Slang'], [1, '🦈', 'Haai'], [1, '🐗', 'Everzwijn'],
  [1, '🦏', 'Neushoorn'], [1, '🐻', 'Beer'], [1, '🐆', 'Luipaard'],
  [2, '🦁', 'Leeuw'], [2, '🐘', 'Olifant'], [2, '🦖', 'Dino'], [2, '🧙', 'Tovenaar'], [2, '🥷', 'Ninja'], [2, '🤖', 'Robot'], [2, '🧛', 'Vampier'], [2, '🧜', 'Zeemeermin'],
  [3, '🐉', 'Draak'], [3, '🦄', 'Eenhoorn'], [3, '🔥', 'Feniks'], [3, '👼', 'Engel'],
];
const BASE = [9, 15, 23, 33];
const CARDS = LIST.map(([r, e, n], i) => {
  const b = BASE[r];
  return { id: i, r, e, n, a: b + ((i * 7) % 7) + (i % 3 === 0 ? 5 : 0), d: b + ((i * 5) % 7) + (i % 3 === 1 ? 5 : 0), s: b + ((i * 3) % 7) + (i % 3 === 2 ? 5 : 0) };
});
const RAR = ['Gewoon', 'Zeldzaam', 'Episch', 'Legendarisch'];
const RCOL = ['#94a3b8', '#38bdf8', '#c084fc', '#fbbf24'];
const PACKS = [
  { n: 'Basispakje', e: '📦', cost: 50, w: [70, 24, 5, 1] },
  { n: 'Zilverpakje', e: '🎁', cost: 220, w: [30, 45, 20, 5] },
  { n: 'Gouden pakje', e: '👑', cost: 900, w: [0, 45, 42, 13] },
];
const STATS = [['a', '⚔️', 'Aanval'], ['d', '🛡️', 'Verdediging'], ['s', '💨', 'Snelheid']];
const FREE_MS = 180000;

export default {
  id: 'kaartenverzamelaar', name: 'Kaartenverzamelaar', emoji: '🃏', desc: 'Open pakjes, verzamel kaarten en versla de computer.',
  async create(host, api) {
    const def = { coins: 150, own: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 14: 1 }, deck: [], packs: 1, packT: Date.now(), level: 1, maxLevel: 1, wins: 0, losses: 0, opened: 0, last: Date.now() };
    let S = Object.assign({}, def, (await api.load()) || {});
    let alive = true, tab = 'packs', msg = '', reveal = null, bt = null;
    host.style.cssText += ';background:linear-gradient(#0c1d3a,#070f20);color:#e8f1ff;font-family:system-ui,sans-serif;';
    const root = H('div', 'max-width:430px;margin:0 auto;padding:10px;box-sizing:border-box;', null, host);
    const save = () => { S.last = Date.now(); api.save(S); };

    const mult = (id) => 1 + 0.1 * (Math.min(5, S.own[id] || 1) - 1);
    const val = (c, k) => Math.round(c[k] * (c.mul || mult(c.id)));
    function accrue() {
      const now = Date.now();
      if (S.packs >= 3) { S.packT = now; return; }
      while (S.packs < 3 && now >= S.packT + FREE_MS) { S.packs++; S.packT += FREE_MS; }
      if (S.packs >= 3) S.packT = now;
    }
    const before = S.packs;
    accrue();
    if (S.packs > before) api.toast('Je hebt ' + (S.packs - before) + ' gratis pakje(s) gekregen!');

    function draw(w) {
      const x = rnd(1, w.reduce((a, b) => a + b, 0));
      let acc = 0, r = 0;
      for (let i = 0; i < 4; i++) { acc += w[i]; if (x <= acc) { r = i; break; } }
      return pickOf(CARDS.filter((c) => c.r === r));
    }
    function openPack(w) {
      const cards = [];
      for (let i = 0; i < 5; i++) cards.push(draw(w));
      const res = cards.map((c) => ({ id: c.id, isNew: !S.own[c.id] && !cards.slice(0, cards.indexOf(c)).some((x) => x.id === c.id) }));
      cards.forEach((c) => { S.own[c.id] = (S.own[c.id] || 0) + 1; });
      S.opened++;
      reveal = { cards: res, i: 0 };
      if (S.deck.length < 5) autoDeck();
      save(); render();
    }
    function autoDeck() {
      const own = CARDS.filter((c) => S.own[c.id]).sort((a, b) => val(b, 'a') + val(b, 'd') + val(b, 's') - (val(a, 'a') + val(a, 'd') + val(a, 's')));
      S.deck = own.slice(0, 5).map((c) => c.id);
    }
    if (S.deck.length < 5) autoDeck();

    function card(c, p, o) {
      o = o || {};
      const el = H('div', 'background:linear-gradient(160deg,' + RCOL[c.r] + '55,#1e293b);border:2px solid ' + RCOL[c.r] + ';border-radius:12px;padding:6px;text-align:center;' + (o.css || ''), null, p);
      H('div', 'font-size:' + (o.big ? 54 : 30) + 'px;', c.e, el);
      H('div', 'font:700 ' + (o.big ? 14 : 11) + 'px system-ui;', c.n + (o.count > 1 ? ' x' + o.count : ''), el);
      H('div', 'font-size:' + (o.big ? 13 : 10) + 'px;', '⚔️' + val(c, 'a') + ' 🛡️' + val(c, 'd') + ' 💨' + val(c, 's'), el);
      if (o.tag) H('div', 'font-size:10px;color:#fde047;', o.tag, el);
      return el;
    }

    // ===== gevecht =====
    function startBattle() {
      const L = S.level;
      const maxR = Math.min(3, Math.floor(L / 3));
      const mul = 1 + 0.06 * (L - 1);
      const opp = [];
      while (opp.length < 5) {
        let r = rnd(0, maxR);
        if (Math.random() < 0.5) r = Math.max(0, r - 1);
        const c = pickOf(CARDS.filter((x) => x.r === r));
        if (!opp.some((o) => o.id === c.id)) opp.push(Object.assign({}, c, { mul }));
      }
      bt = { opp, myUsed: [], oppUsed: [], round: 0, score: [0, 0], phase: 'lead', pick: null, last: null, done: false };
      bt.phase = 'lead';
      tab = 'battle'; render();
    }
    const myLeft = () => S.deck.filter((id) => !bt.myUsed.includes(id));
    const oppLeft = () => bt.opp.filter((c) => !bt.oppUsed.includes(c.id));
    function compLead() {
      // computer kiest kaart + stat
      const c = pickOf(oppLeft());
      const st = STATS.slice().sort((a, b) => c[b[0]] - c[a[0]])[Math.random() < 0.75 ? 0 : 1][0];
      bt.cl = { c, st };
      bt.phase = 'respond';
    }
    function resolve(mine, theirs, st) {
      const a = val(mine, st), b = val(theirs, st);
      bt.oppUsed.push(theirs.id); bt.myUsed.push(mine.id);
      let res;
      if (a > b) { bt.score[0]++; res = '✅ Jij wint de ronde: ' + a + ' tegen ' + b; }
      else if (b > a) { bt.score[1]++; res = '❌ Computer wint de ronde: ' + b + ' tegen ' + a; }
      else res = '🤝 Gelijkspel: ' + a + ' allebei';
      bt.last = { mine, theirs, st, res };
      bt.round++; bt.cl = null; bt.pick = null;
      if (bt.round >= 5) {
        bt.done = true; bt.phase = 'end';
        if (bt.score[0] > bt.score[1]) {
          const rew = 30 * S.level; S.coins += rew; S.wins++; bt.reward = rew;
          if (S.level === S.maxLevel && S.level < 12) { S.maxLevel++; }
          if (S.level === S.maxLevel - 1 || true) { if (Math.random() < 0.3) { S.packs = Math.min(5, S.packs + 1); bt.bonus = true; } }
        } else { S.losses++; bt.reward = Math.round(8 * S.level); S.coins += bt.reward; }
        save();
      } else if (bt.round % 2 === 1) { bt.phase = 'result'; bt.next = 'comp'; }
      else { bt.phase = 'result'; bt.next = 'lead'; }
      render();
    }
    function battleUI() {
      if (!bt) {
        const c = card0();
        H('div', 'font:700 16px system-ui;', '⚔️ Kaartgevecht', c);
        H('div', 'font-size:13px;margin:6px 0;line-height:1.5;', 'Beste van 5 rondes met je deck van 5 kaarten. Bij je eigen beurt kies je kaart en eigenschap; de computer reageert. Bij de beurt van de computer zie je zijn kaart en eigenschap, daarna kies jij een kaart.', c);
        if (S.deck.length < 5) { H('div', '', 'Je hebt minstens 5 verschillende kaarten nodig. Open pakjes!', c); return; }
        H('div', 'font-weight:700;margin:6px 0;', 'Tegenstander niveau: ' + S.level + ' / ' + S.maxLevel, c);
        const row = H('div', 'display:flex;gap:6px;margin-bottom:6px;', null, c);
        B('◀', () => { S.level = Math.max(1, S.level - 1); render(); }, row, 'width:50px;background:#334155;', S.level <= 1);
        B('Start gevecht!', startBattle, row, 'flex:1;background:linear-gradient(135deg,#dc2626,#b45309);');
        B('▶', () => { S.level = Math.min(S.maxLevel, S.level + 1); render(); }, row, 'width:50px;background:#334155;', S.level >= S.maxLevel);
        H('div', 'font-size:12px;opacity:.8;', 'Gewonnen: ' + S.wins + ' · verloren: ' + S.losses, c);
        return;
      }
      const c = card0();
      H('div', 'font:700 15px system-ui;text-align:center;', 'Ronde ' + Math.min(5, bt.round + 1) + '/5 · Jij ' + bt.score[0] + ' - ' + bt.score[1] + ' Computer', c);
      if (bt.last) {
        const l = H('div', 'margin:8px 0;padding:6px;background:#0005;border-radius:10px;font-size:13px;text-align:center;', null, c);
        H('div', '', 'Jij: ' + l_(bt.last.mine) + '  vs  Computer: ' + l_(bt.last.theirs) + ' · ' + STATS.find((s) => s[0] === bt.last.st)[1], l);
        H('div', 'font-weight:700;', bt.last.res, l);
      }
      if (bt.phase === 'end') {
        const won = bt.score[0] > bt.score[1], draw2 = bt.score[0] === bt.score[1];
        H('div', 'text-align:center;font-size:48px;', won ? '🏆' : draw2 ? '🤝' : '😢', c);
        H('div', 'text-align:center;font-weight:700;', (won ? 'Gewonnen!' : 'Verloren...') + ' +🪙' + bt.reward + (bt.bonus ? ' en een gratis pakje!' : '') + (won && S.level === S.maxLevel - 1 && S.maxLevel <= 12 ? ' Nieuw niveau open!' : ''), c);
        B('Terug', () => { bt = null; render(); }, c, 'width:100%;margin-top:8px;');
        return;
      }
      if (bt.phase === 'result') {
        B('Volgende ronde ▶', () => { if (bt.next === 'comp') compLead(); else bt.phase = 'lead'; render(); }, c, 'width:100%;');
        return;
      }
      if (bt.phase === 'respond') {
        H('div', 'text-align:center;margin:6px 0;', 'De computer speelt ' + bt.cl.c.e + ' ' + bt.cl.c.n + ' en kiest ' + STATS.find((s) => s[0] === bt.cl.st)[2] + ' (' + val(bt.cl.c, bt.cl.st) + '). Kies je kaart:', c);
        const g = H('div', 'display:grid;grid-template-columns:repeat(3,1fr);gap:6px;', null, c);
        myLeft().forEach((id) => { const cd = CARDS[id]; const el = card(cd, g, { css: 'cursor:pointer;', tag: STATS.find((s) => s[0] === bt.cl.st)[1] + ' ' + val(cd, bt.cl.st) }); el.onclick = () => resolve(cd, bt.cl.c, bt.cl.st); });
        return;
      }
      // lead
      if (bt.pick == null) {
        H('div', 'text-align:center;margin:6px 0;', 'Jouw beurt: kies een kaart', c);
        const g = H('div', 'display:grid;grid-template-columns:repeat(3,1fr);gap:6px;', null, c);
        myLeft().forEach((id) => { const el = card(CARDS[id], g, { css: 'cursor:pointer;' }); el.onclick = () => { bt.pick = id; render(); }; });
      } else {
        const cd = CARDS[bt.pick];
        card(cd, c, { big: true, css: 'width:140px;margin:8px auto;' });
        H('div', 'text-align:center;margin-bottom:6px;', 'Kies een eigenschap:', c);
        const row = H('div', 'display:flex;gap:6px;', null, c);
        STATS.forEach(([k, e, n]) => B(e + ' ' + n + ' ' + val(cd, k), () => {
          const oc = oppLeft();
          // computer kiest meestal de kaart met de beste waarde voor deze eigenschap, soms een willekeurige
          const sorted = oc.slice().sort((a, b) => b[k] * b.mul - a[k] * a.mul);
          const theirs = Math.random() < 0.6 ? sorted[0] : pickOf(oc);
          resolve(cd, theirs, k);
        }, row, 'flex:1;font-size:12px;padding:6px;'));
        B('Andere kaart', () => { bt.pick = null; render(); }, c, 'width:100%;margin-top:6px;background:#334155;');
      }
    }
    const l_ = (c) => c.e + c.n;
    const card0 = () => H('div', 'background:#14284d;border-radius:14px;padding:12px;margin-bottom:8px;', null, root);

    // ===== schermen =====
    function packsUI() {
      accrue();
      if (reveal) {
        const c = card0();
        const r = reveal;
        H('div', 'text-align:center;font-weight:700;margin-bottom:8px;', r.i < r.cards.length ? 'Tik op de kaart om om te draaien (' + (r.i + 1) + '/5)' : 'Klaar! Dit zit in je pakje:', c);
        if (r.i < r.cards.length) {
          const x = r.cards[r.i], cd = CARDS[x.id];
          const el = card(cd, c, { big: true, css: 'width:160px;margin:10px auto;cursor:pointer;', tag: x.isNew ? '🆕 NIEUW!' : '' });
          el.onclick = () => { r.i++; render(); };
          H('div', 'text-align:center;font-size:12px;color:' + RCOL[cd.r] + ';', RAR[cd.r], c);
        } else {
          const g = H('div', 'display:grid;grid-template-columns:repeat(3,1fr);gap:6px;', null, c);
          r.cards.forEach((x) => card(CARDS[x.id], g, { tag: x.isNew ? '🆕' : '' }));
          B('Prima', () => { reveal = null; render(); }, c, 'width:100%;margin-top:8px;');
        }
        return;
      }
      const f = card0();
      H('div', 'font-weight:700;', '🎁 Gratis pakjes: ' + S.packs + '/3', f);
      const t = H('div', 'font-size:12px;opacity:.8;margin:2px 0 6px;', S.packs >= 3 ? 'Vol! Open er een om weer te sparen.' : 'Volgend pakje over ' + mmss(S.packT + FREE_MS - Date.now()), f);
      t.setAttribute('data-timer', '1');
      B('Open gratis pakje', () => { S.packs--; if (S.packs === 2) S.packT = Date.now(); openPack(PACKS[0].w); }, f, 'width:100%;background:linear-gradient(135deg,#16a34a,#0d9488);', S.packs <= 0);
      PACKS.forEach((p) => {
        const c = card0();
        H('div', 'font:700 15px system-ui;', p.e + ' ' + p.n + ' (5 kaarten)', c);
        H('div', 'font-size:12px;opacity:.8;margin:2px 0 6px;', p.w.map((w, i) => (w ? RAR[i] + ' ' + w + '%' : '')).filter(Boolean).join(' · '), c);
        B('Koop en open 🪙' + fmt(p.cost), () => { S.coins -= p.cost; openPack(p.w); }, c, 'width:100%;', S.coins < p.cost);
      });
    }
    function collUI() {
      const have = CARDS.filter((c) => S.own[c.id]).length;
      H('div', 'font-weight:700;margin-bottom:6px;', 'Verzameling: ' + have + '/' + CARDS.length + ' · Dubbele kaarten maken een kaart sterker (+10% per extra, tot x5)', root);
      H('div', 'font-size:12px;margin-bottom:6px;', 'Tik op een kaart om hem in je deck te zetten (' + S.deck.length + '/5).', root);
      B('Beste deck automatisch kiezen', () => { autoDeck(); save(); render(); }, root, 'width:100%;margin-bottom:8px;background:#0f766e;');
      const g = H('div', 'display:grid;grid-template-columns:repeat(3,1fr);gap:6px;', null, root);
      CARDS.forEach((c) => {
        if (!S.own[c.id]) { const e = H('div', 'border:2px dashed #475569;border-radius:12px;padding:6px;text-align:center;opacity:.5;min-height:80px;', null, g); H('div', 'font-size:28px;', '❓', e); H('div', 'font-size:10px;', RAR[c.r], e); return; }
        const inD = S.deck.includes(c.id);
        const el = card(c, g, { count: S.own[c.id], css: 'cursor:pointer;' + (inD ? 'box-shadow:0 0 0 3px #fde047;' : ''), tag: inD ? '⭐ in deck' : '' });
        el.onclick = () => {
          if (inD) S.deck = S.deck.filter((x) => x !== c.id);
          else if (S.deck.length < 5) S.deck.push(c.id);
          else { S.deck.shift(); S.deck.push(c.id); }
          save(); render();
        };
      });
      if (S.own) {
        const sell = CARDS.filter((c) => (S.own[c.id] || 0) > 5);
        if (sell.length) B('Verkoop overtollige kaarten (>5 stuks) voor munten', () => { let g2 = 0; sell.forEach((c) => { const n = S.own[c.id] - 5; g2 += n * (c.r + 1) * 12; S.own[c.id] = 5; }); S.coins += g2; msg = 'Verkocht voor 🪙' + g2; save(); render(); }, root, 'width:100%;margin-top:8px;background:#7f1d1d;');
      }
    }

    function render() {
      if (!alive) return;
      const st = host.scrollTop;
      root.innerHTML = '';
      const top = H('div', 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;', null, root);
      H('div', 'font:800 19px system-ui;', '🃏 Kaartenverzamelaar', top);
      H('div', 'font:700 14px system-ui;background:#0006;padding:6px 12px;border-radius:16px;', '🪙 ' + fmt(S.coins), top);
      const tabs = H('div', 'display:flex;gap:6px;margin-bottom:8px;', null, root);
      [['packs', '📦 Pakjes'], ['coll', '🗂️ Kaarten'], ['battle', '⚔️ Gevecht']].forEach(([k, l]) => B(l, () => { if (reveal && reveal.i < 5) return; tab = k; msg = ''; render(); }, tabs, 'flex:1;font-size:13px;' + (tab === k ? '' : 'background:#233a66;')));
      if (msg) H('div', 'background:#1e3a8a;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:13px;', msg, root);
      if (tab === 'packs') packsUI(); else if (tab === 'coll') collUI(); else battleUI();
      host.scrollTop = st;
    }

    render();
    const iv = setInterval(() => {
      if (!alive) return;
      const b = S.packs;
      accrue();
      const t = root.querySelector('[data-timer]');
      if (S.packs !== b && tab === 'packs' && !reveal) render();
      else if (t && S.packs < 3) t.textContent = 'Volgend pakje over ' + mmss(S.packT + FREE_MS - Date.now());
    }, 1000);
    const iv2 = setInterval(() => { if (alive) save(); }, 10000);
    return { destroy() { alive = false; clearInterval(iv); clearInterval(iv2); save(); } };
  },
};
