const SU = ['♠', '♥', '♦', '♣'];
const RK = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CSS = '.bj *{box-sizing:border-box}.bj .bc{width:50px;height:72px;border-radius:7px;background:#fff;color:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:800;font-size:18px;line-height:1.1;box-shadow:0 2px 5px rgba(0,0,0,.4);margin-left:-18px;animation:bjin .25s}.bj .bc:first-child{margin-left:0}.bj .bc i{font-style:normal;font-size:22px}.bj .rd{color:#d12}.bj .bk{background:repeating-linear-gradient(45deg,#2a4aa8,#2a4aa8 6px,#3a5cc4 6px,#3a5cc4 12px);border:3px solid #fff}.bj button{font:inherit;font-weight:800;border:0;border-radius:12px;padding:11px 14px;color:#fff;background:#1d6fd6;cursor:pointer}.bj button:disabled{opacity:.4}.bj .ch{background:#c49a1a;border-radius:50%;width:54px;height:54px;padding:0;border:4px dashed #fff3}@keyframes bjin{from{transform:translateY(-14px);opacity:0}to{transform:none;opacity:1}}';
export default {
  id: 'blackjack',
  name: 'Blackjack',
  emoji: '🃏',
  hint: 'Kom dichter bij 21 dan de deler, zonder erover te gaan',
  save: 'day',
  create(host, api) {
    host.style.touchAction = 'manipulation';
    host.style.background = '#0b5d3b';
    let dead = false, ended = false, ready = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
    let chips = 100, bet = 10, best = 100, phase = 'bet', deck = [], pl = [], dl = [], msg = '';
    const root = document.createElement('div');
    root.className = 'bj';
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;font-family:system-ui,sans-serif;color:#fff;padding:10px 10px 12px;user-select:none;-webkit-user-select:none';
    const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
    const view = document.createElement('div');
    view.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;align-items:center';
    root.appendChild(view);
    host.appendChild(root);

    function newDeck() {
      deck = [];
      for (let k = 0; k < 4; k++) for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ r, s });
      for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
    }
    function draw() { if (!deck.length) newDeck(); return deck.pop(); }
    function val(h) {
      let t = 0, a = 0;
      for (const c of h) { t += c.r > 10 ? 10 : c.r === 1 ? 11 : c.r; if (c.r === 1) a++; }
      while (t > 21 && a > 0) { t -= 10; a--; }
      return t;
    }
    function persist() {
      if (!ready || phase === 'over') return;
      api.save({ chips: chips + (phase === 'play' || phase === 'dealer' ? bet : 0), best });
    }
    const cardHtml = (c, hid) => hid ? '<div class="bc bk"></div>' : '<div class="bc' + ((c.s === 1 || c.s === 2) ? ' rd' : '') + '"><b>' + RK[c.r] + '</b><i>' + SU[c.s] + '</i></div>';
    const handHtml = (h, hideSecond) => h.map((c, i) => cardHtml(c, hideSecond && i === 1)).join('');

    function render() {
      if (!ready) { view.innerHTML = '<div style="margin:auto;font-size:18px">Laden...</div>'; return; }
      const hide = phase === 'play';
      let h = '<div style="width:100%;display:flex;justify-content:space-between;font-weight:800;font-size:16px"><span>💰 ' + chips + '</span><span>🏆 ' + best + '</span></div>';
      h += '<div style="margin-top:14px;font-size:14px;opacity:.85">Dealer ' + (pl.length ? (hide ? '' : val(dl)) : '') + '</div>';
      h += '<div style="display:flex;min-height:76px;margin:6px 0 0 18px">' + handHtml(dl, hide) + '</div>';
      h += '<div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;font-size:19px;font-weight:800;padding:0 8px;min-height:50px">' + (msg || (phase === 'bet' ? 'Zet je in' : '')) + '</div>';
      h += '<div style="display:flex;min-height:76px;margin:0 0 0 18px">' + handHtml(pl, false) + '</div>';
      h += '<div style="margin:6px 0 10px;font-size:14px;opacity:.85">Jij ' + (pl.length ? val(pl) : '') + (phase !== 'bet' ? ' · inzet ' + bet : '') + '</div>';
      if (phase === 'bet') {
        h += '<div style="font-size:18px;font-weight:800;margin-bottom:8px">Inzet: ' + bet + '</div><div style="display:flex;gap:8px;margin-bottom:12px">';
        for (const v of [5, 10, 25, 50]) h += '<button class="ch" data-a="add" data-v="' + v + '">' + v + '</button>';
        h += '</div><div style="display:flex;gap:8px"><button data-a="clr" style="background:#555">Wis</button><button data-a="all" style="background:#b8472a">Alles</button><button data-a="deal" style="background:#17a34a">Delen</button></div>';
      } else if (phase === 'play') {
        h += '<div style="display:flex;gap:8px"><button data-a="hit">Kaart</button><button data-a="stand" style="background:#b8472a">Blijven</button><button data-a="dbl" style="background:#7a3fc4"' + (pl.length === 2 && chips >= bet ? '' : ' disabled') + '>Dubbel</button></div>';
      } else if (phase === 'result') {
        h += '<button data-a="next" style="background:#17a34a;padding:13px 30px;font-size:17px">Volgende ronde</button>';
      } else if (phase === 'over') {
        h += '<div style="font-weight:800">Je tegoed is op!</div>';
      }
      view.innerHTML = h;
    }
    function settle() {
      phase = 'result';
      const p = val(pl), d = val(dl);
      const pbj = pl.length === 2 && p === 21, dbj = dl.length === 2 && d === 21;
      let pay = 0;
      if (pbj && dbj) { pay = bet; msg = 'Beiden blackjack: gelijk'; }
      else if (pbj) { pay = bet + Math.floor(bet * 1.5); msg = 'BLACKJACK! 3 om 2 🎉'; }
      else if (dbj) msg = 'Dealer heeft blackjack';
      else if (p > 21) msg = 'Bust! Te hoog 💥';
      else if (d > 21) { pay = bet * 2; msg = 'Dealer bust: jij wint! 🎉'; }
      else if (p > d) { pay = bet * 2; msg = 'Jij wint! 🎉'; }
      else if (p === d) { pay = bet; msg = 'Gelijkspel'; }
      else msg = 'Dealer wint';
      chips += pay;
      if (chips > best) best = chips;
      api.score(best);
      if (chips <= 0) {
        phase = 'over'; msg = msg + ' - tegoed op!';
        api.clear();
        render();
        later(() => { if (!ended) { ended = true; api.end(best); } }, 1600);
        return;
      }
      render();
      persist();
    }
    function dealerPlay() {
      phase = 'dealer'; render();
      const step = () => {
        if (val(dl) < 17) { dl.push(draw()); render(); later(step, 700); } else settle();
      };
      later(step, 600);
    }
    function deal() {
      if (bet <= 0 || bet > chips) return;
      if (deck.length < 20) newDeck();
      chips -= bet; msg = '';
      pl = [draw(), draw()]; dl = [draw(), draw()];
      phase = 'play';
      if (val(pl) === 21 || val(dl) === 21) { settle(); return; }
      render(); persist();
    }
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]');
      if (!b || !ready || ended) return;
      const a = b.dataset.a;
      if (phase === 'bet') {
        if (a === 'add') bet = Math.min(chips, bet + Number(b.dataset.v));
        else if (a === 'clr') bet = Math.min(chips, 5);
        else if (a === 'all') bet = chips;
        else if (a === 'deal') { deal(); return; }
        render();
      } else if (phase === 'play') {
        if (a === 'hit') {
          pl.push(draw());
          const v = val(pl);
          if (v > 21) settle(); else if (v === 21) dealerPlay(); else render();
        } else if (a === 'stand') dealerPlay();
        else if (a === 'dbl' && pl.length === 2 && chips >= bet) {
          chips -= bet; bet *= 2; pl.push(draw());
          if (val(pl) > 21) settle(); else dealerPlay();
        }
      } else if (phase === 'result' && a === 'next') {
        phase = 'bet'; pl = []; dl = []; msg = ''; bet = Math.max(5, Math.min(bet, chips));
        if (bet > chips) bet = chips;
        render(); persist();
      }
    });
    newDeck();
    render();
    api.load().then((s) => {
      if (dead) return;
      if (s && typeof s.chips === 'number' && s.chips > 0) { chips = s.chips; best = Math.max(s.best || 0, chips); }
      bet = Math.min(10, chips);
      ready = true; api.score(best); render();
    }).catch(() => { if (dead) return; ready = true; render(); });
    return {
      destroy() {
        dead = true; timers.forEach(clearTimeout); timers.clear();
        persist();
        if (root.parentNode) root.parentNode.removeChild(root);
      },
    };
  },
};
