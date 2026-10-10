const SU = ['♠', '♥', '♦', '♣'];
const RK = ['🃏', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'B', 'V', 'K'];
const NAMES = ['Jij', 'Bot Bram', 'Bot Fleur'];
const CSS = '.pe *{box-sizing:border-box}.pe .c{width:46px;height:66px;border-radius:7px;background:#fff;color:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;font-size:17px;line-height:1.05;box-shadow:0 2px 4px rgba(0,0,0,.45);flex:none}.pe .c i{font-style:normal;font-size:20px}.pe .rd{color:#d12}.pe .bk{background:repeating-linear-gradient(45deg,#2a4aa8,#2a4aa8 5px,#3a5cc4 5px,#3a5cc4 10px);border:3px solid #fff}.pe .hand{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 0;padding:0 8px}.pe .hand .c{margin-left:-14px;cursor:pointer;transition:transform .12s}.pe .hand .c.ok{transform:translateY(-8px);outline:2px solid #4ade80}.pe .hand .c.no{opacity:.55}.pe button{font:inherit;font-weight:800;border:0;border-radius:12px;color:#fff;cursor:pointer}';
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
const isRed = (c) => c.s === 1 || c.s === 2;
export default {
  id: 'pesten',
  name: 'Pesten',
  emoji: '🂡',
  hint: 'Speel dezelfde kleur of waarde. Wie het eerst geen kaarten heeft wint',
  create(host, api) {
    host.style.touchAction = 'manipulation';
    host.style.background = '#1b4d6b';
    let dead = false, ended = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
    let hands, deck, disc, turn, dir, pending, curSuit, curRank, msg, over, wins = 0, choosing = null, busy;
    const root = document.createElement('div');
    root.className = 'pe';
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;font-family:system-ui,sans-serif;color:#fff;padding:8px 4px;user-select:none;-webkit-user-select:none';
    host.appendChild(root);

    function newGame() {
      deck = [];
      for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ r, s });
      deck.push({ r: 0, s: -1 }, { r: 0, s: -1 });
      shuffle(deck);
      hands = [[], [], []];
      for (let i = 0; i < 7; i++) for (let p = 0; p < 3; p++) hands[p].push(deck.pop());
      disc = [];
      let c;
      do { c = deck.pop(); if ([0, 1, 2, 7, 8, 11].includes(c.r)) { deck.unshift(c); c = null; } } while (!c);
      disc.push(c);
      curSuit = c.s; curRank = c.r;
      turn = 0; dir = 1; pending = 0; over = false; choosing = null; busy = false;
      msg = 'Jij begint!';
    }
    function drawCards(p, n) {
      let got = 0;
      for (let i = 0; i < n; i++) {
        if (!deck.length) {
          if (disc.length <= 1) break;
          const top = disc.pop();
          deck = shuffle(disc); disc = [top];
        }
        hands[p].push(deck.pop()); got++;
      }
      return got;
    }
    function playable(c) {
      if (pending > 0) return c.r === 2 || c.r === 0;
      if (c.r === 0 || c.r === 11 || curSuit === -1) return true;
      return c.s === curSuit || c.r === curRank;
    }
    function nextPlayer(skip) { return ((turn + dir * (skip ? 2 : 1)) % 3 + 3) % 3; }
    function topCard() { return disc[disc.length - 1]; }
    function render() {
      const act = (p) => (turn === p && !over ? 'background:#ffd54a;color:#222' : 'background:#0004');
      let h = '<div style="width:100%;display:flex;justify-content:space-between;font-weight:800;font-size:15px;padding:0 8px"><span>🂡 Pesten</span><span>🔥 Gewonnen ' + wins + '</span></div>';
      h += '<div style="display:flex;justify-content:space-around;width:100%;margin:8px 0">';
      for (const p of [1, 2]) {
        let bk = '';
        for (let i = 0; i < Math.min(hands[p].length, 7); i++) bk += '<div class="c bk" style="width:22px;height:32px;margin-left:' + (i ? -12 : 0) + 'px;border-width:2px"></div>';
        h += '<div style="text-align:center"><div style="display:inline-block;border-radius:10px;padding:3px 10px;font-weight:800;font-size:14px;' + act(p) + '">' + NAMES[p] + ' (' + hands[p].length + ')</div><div style="display:flex;justify-content:center;margin-top:6px;min-height:32px">' + bk + '</div></div>';
      }
      h += '</div>';
      const t = topCard();
      const need = t.r === 0 ? 'alles' : (curRank === 11 || curSuit !== t.s ? 'nu: ' + SU[curSuit] : '');
      h += '<div style="display:flex;align-items:center;justify-content:center;gap:22px;margin:4px 0"><div data-a="draw" style="text-align:center;cursor:pointer"><div class="c bk" style="width:62px;height:88px"></div><div style="font-size:12px;margin-top:3px">Pak (' + deck.length + ')</div></div>';
      h += '<div style="text-align:center">' + cardHtml(t, 1.3) + '<div style="font-size:13px;font-weight:800;margin-top:3px;min-height:16px">' + (curSuit >= 0 ? 'Kleur: <span style="' + (curSuit === 1 || curSuit === 2 ? 'color:#ff8a8a' : '') + '">' + SU[curSuit] + '</span>' : 'Alles mag') + '</div></div></div>';
      h += '<div style="font-size:13px;opacity:.9;min-height:16px">' + (pending > 0 ? '⚠ Pakken: ' + pending + ' kaarten (tegenhouden met 2 of 🃏)' : '') + (dir === 1 ? '' : '  🔄 Richting omgekeerd') + '</div>';
      h += '<div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:900;text-align:center;padding:0 10px">' + msg + '</div>';
      const mine = turn === 0 && !over && !busy && !choosing;
      h += '<div class="hand">';
      hands[0].forEach((c, i) => { h += cardHtml(c, 1, 'data-i="' + i + '"', mine ? (playable(c) ? 'ok' : 'no') : ''); });
      h += '</div>';
      h += '<div style="height:38px;display:flex;align-items:center;margin-top:6px">';
      if (over) { if (hands[0].length === 0) h += '<button data-a="new" style="background:#16a34a;padding:10px 24px;font-size:16px">Nog een spel ▶</button>'; }
      else if (mine) h += '<button data-a="draw" style="background:#7c3aed;padding:9px 20px">' + (pending > 0 ? 'Pak ' + pending + ' kaarten' : 'Pak een kaart') + '</button>';
      h += '</div>';
      if (choosing) {
        h += '<div style="position:absolute;inset:0;background:#000a;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px"><div style="font-size:20px;font-weight:900">Kies een kleur</div><div style="display:flex;gap:12px">';
        for (let s = 0; s < 4; s++) h += '<button data-s="' + s + '" style="width:62px;height:62px;font-size:36px;background:#fff;color:' + (s === 1 || s === 2 ? '#d12' : '#111') + '">' + SU[s] + '</button>';
        h += '</div></div>';
      }
      root.innerHTML = '<style>' + CSS + '</style>' + h;
    }
    function cardHtml(c, z, attr, cls) {
      const big = z && z > 1 ? 'width:60px;height:86px;font-size:22px;' : '';
      if (c.r === 0) return '<div class="c ' + (cls || '') + '" ' + (attr || '') + ' style="' + big + 'font-size:' + (big ? 30 : 24) + 'px">🃏</div>';
      return '<div class="c ' + (isRed(c) ? 'rd ' : '') + (cls || '') + '" ' + (attr || '') + ' style="' + big + '"><b>' + RK[c.r] + '</b><i>' + SU[c.s] + '</i></div>';
    }
    function advance(skipNext, again) {
      if (again) { turn = turn; }
      else turn = nextPlayer(skipNext);
      startTurn();
    }
    function playCard(p, idx, colorChoice) {
      const c = hands[p].splice(idx, 1)[0];
      disc.push(c);
      curSuit = c.s; curRank = c.r;
      let skip = false, again = false, text = NAMES[p] + ' speelt ' + (c.r === 0 ? '🃏' : RK[c.r] + SU[c.s]);
      if (c.r === 2) { pending += 2; text += ' (pak 2)'; }
      else if (c.r === 0) { pending += 5; curSuit = -1; text += ' (pak 5!)'; }
      else if (c.r === 7) { again = true; text += ' (nog een keer)'; }
      else if (c.r === 8) { skip = true; text += ' (volgende slaat over)'; }
      else if (c.r === 1) { dir = -dir; text += ' (richting om)'; }
      else if (c.r === 11) { curSuit = colorChoice; text += ' (kleur ' + SU[colorChoice] + ')'; }
      msg = text;
      if (hands[p].length === 0) { finish(p); return; }
      if (hands[p].length === 1) msg += ' - laatste kaart!';
      render();
      busy = true;
      later(() => { busy = false; advance(skip, again); }, p === 0 ? 400 : 900);
    }
    function finish(p) {
      over = true; busy = false;
      if (p === 0) { wins++; api.score(wins); msg = '🎉 Je hebt geen kaarten meer: JIJ WINT!'; render(); }
      else { msg = '😞 ' + NAMES[p] + ' wint het spel...'; render(); later(() => { if (!ended) { ended = true; api.end(wins); } }, 1700); }
    }
    function drawTurn(p) {
      const n = pending > 0 ? pending : 1;
      const got = drawCards(p, n);
      msg = NAMES[p] + ' pakt ' + got + ' kaart' + (got === 1 ? '' : 'en') + (pending > 0 ? ' (gepest!)' : '');
      pending = 0;
      render();
      busy = true;
      later(() => { busy = false; advance(false, false); }, p === 0 ? 500 : 900);
    }
    function startTurn() {
      if (over) return;
      render();
      if (turn === 0) return;
      busy = true;
      later(() => { busy = false; botMove(turn); }, 900);
    }
    function botMove(p) {
      const h = hands[p];
      const opts = [];
      h.forEach((c, i) => { if (playable(c)) opts.push(i); });
      if (!opts.length) { drawTurn(p); return; }
      // kies kaart: pak-kaarten als tegenhouder; anders eerst gewone kaarten, spaar boer/joker
      const score = (i) => {
        const c = h[i];
        let s = Math.random();
        if (pending > 0) return s + (c.r === 2 ? 2 : 1);
        const nextHand = hands[nextPlayer(false)].length;
        if (c.r === 11) s -= 1.2; else if (c.r === 0) s -= 0.8;
        if (nextHand <= 3 && (c.r === 2)) s += 3;
        if (nextHand <= 3 && c.r === 8) s += 2;
        if (c.r === 7) s += 1.5;
        const same = h.filter((x) => x.s === c.s).length;
        s += same * 0.1;
        return s;
      };
      opts.sort((a, b) => score(b) - score(a));
      const i = opts[0];
      let choice = 0;
      if (h[i].r === 11) {
        const cnt = [0, 0, 0, 0];
        h.forEach((x, k) => { if (k !== i && x.s >= 0) cnt[x.s]++; });
        choice = cnt.indexOf(Math.max(...cnt));
      }
      playCard(p, i, choice);
    }
    root.addEventListener('click', (e) => {
      if (ended) return;
      const sb = e.target.closest('[data-s]');
      if (sb && choosing) { const idx = choosing.idx; choosing = null; playCard(0, idx, Number(sb.dataset.s)); return; }
      const a = e.target.closest('[data-a]');
      if (a) {
        if (a.dataset.a === 'new' && over && hands[0].length === 0) { newGame(); startTurn(); }
        else if (a.dataset.a === 'draw' && turn === 0 && !over && !busy && !choosing) drawTurn(0);
        return;
      }
      const c = e.target.closest('[data-i]');
      if (!c || turn !== 0 || over || busy || choosing) return;
      const i = Number(c.dataset.i);
      const card = hands[0][i];
      if (!card) return;
      if (!playable(card)) { msg = pending > 0 ? 'Je moet een 2 of 🃏 spelen, of pakken' : 'Die kaart mag niet'; render(); return; }
      if (card.r === 11) { choosing = { idx: i }; render(); return; }
      playCard(0, i, 0);
    });
    newGame(); api.score(0); startTurn();
    return {
      destroy() {
        dead = true; timers.forEach(clearTimeout); timers.clear();
        if (root.parentNode) root.parentNode.removeChild(root);
      },
    };
  },
};
