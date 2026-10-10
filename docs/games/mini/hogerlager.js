const SU = ['♠', '♥', '♦', '♣'];
const RK = ['', '', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'B', 'V', 'K', 'A']; // 2..14 (A hoog)
const CSS = '.hl *{box-sizing:border-box}.hl .card{width:130px;height:190px;border-radius:14px;background:#fff;color:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;font-size:56px;box-shadow:0 6px 16px rgba(0,0,0,.45);transition:transform .3s}.hl .card i{font-style:normal;font-size:60px}.hl .red{color:#d12}.hl .back{background:repeating-linear-gradient(45deg,#2a4aa8,#2a4aa8 8px,#3a5cc4 8px,#3a5cc4 16px);border:6px solid #fff}.hl button{font:inherit;font-weight:900;border:0;border-radius:16px;color:#fff;cursor:pointer;font-size:21px;padding:16px 0;flex:1}.hl button:disabled{opacity:.4}@keyframes hlpop{0%{transform:rotateY(90deg)}100%{transform:none}}.hl .flip{animation:hlpop .3s}@keyframes hlshake{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}.hl .shake{animation:hlshake .3s 2}';
export default {
  id: 'hogerlager',
  name: 'Hoger Lager',
  emoji: '🔼',
  hint: 'Is de volgende kaart hoger of lager? Hoe langer de reeks, hoe beter',
  create(host, api) {
    host.style.touchAction = 'manipulation';
    host.style.background = '#14532d';
    let dead = false, ended = false, busy = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
    let deck = [], cur = null, nxt = null, streak = 0, jokers = 0, msg = 'Hoger of lager?', result = '';
    const root = document.createElement('div');
    root.className = 'hl';
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;font-family:system-ui,sans-serif;color:#fff;padding:12px;user-select:none;-webkit-user-select:none';
    host.appendChild(root);
    function newDeck() {
      deck = [];
      for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) deck.push({ r, s });
      for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
    }
    function draw() { if (deck.length < 1) newDeck(); return deck.pop(); }
    const face = (c, cls) => '<div class="card ' + (cls || '') + ((c.s === 1 || c.s === 2) ? ' red' : '') + '"><b>' + RK[c.r] + '</b><i>' + SU[c.s] + '</i></div>';
    function render() {
      let h = '<div style="width:100%;display:flex;justify-content:space-between;font-weight:800;font-size:17px"><span>🔥 Reeks: ' + streak + '</span><span>🃏 Overslaan: ' + jokers + '</span></div>';
      h += '<div style="flex:1;display:flex;align-items:center;justify-content:center;gap:16px;width:100%">';
      h += '<div style="text-align:center"><div style="font-size:13px;opacity:.8;margin-bottom:6px">Huidige kaart</div>' + face(cur, '') + '</div>';
      h += '<div style="text-align:center"><div style="font-size:13px;opacity:.8;margin-bottom:6px">Volgende</div>' + (nxt ? face(nxt, 'flip') : '<div class="card back' + (result === 'bad' ? ' shake' : '') + '"></div>') + '</div>';
      h += '</div>';
      h += '<div style="min-height:36px;font-size:20px;font-weight:900;text-align:center;margin-bottom:10px">' + msg + '</div>';
      h += '<div style="display:flex;gap:12px;width:100%;max-width:340px"><button data-a="hi" style="background:#16a34a"' + (busy ? ' disabled' : '') + '>⬆ Hoger</button><button data-a="lo" style="background:#dc2626"' + (busy ? ' disabled' : '') + '>⬇ Lager</button></div>';
      h += '<button data-a="skip" style="margin-top:10px;background:#7c3aed;flex:none;padding:10px 24px;font-size:16px;width:100%;max-width:340px"' + (busy || jokers < 1 ? ' disabled' : '') + '>Kaart overslaan</button>';
      root.innerHTML = '<style>' + CSS + '</style>' + h;
    }
    function guess(dir) {
      if (busy || ended) return;
      busy = true;
      nxt = draw();
      let ok;
      if (nxt.r === cur.r) { msg = 'Gelijk! Gratis door 😅'; result = 'eq'; ok = null; }
      else if ((dir === 'hi') === (nxt.r > cur.r)) { streak++; api.score(streak); ok = true; result = 'good'; msg = 'Goed! ✅'; if (streak % 5 === 0) { jokers++; msg += ' +1 overslaan 🃏'; } }
      else { ok = false; result = 'bad'; msg = 'Helaas, fout! ❌'; }
      render();
      if (ok === false) { later(() => { if (!ended) { ended = true; api.end(streak); } }, 1500); return; }
      later(() => { cur = nxt; nxt = null; busy = false; result = ''; msg = 'Hoger of lager?'; render(); }, 1000);
    }
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]');
      if (!b || busy || ended) return;
      const a = b.dataset.a;
      if (a === 'hi' || a === 'lo') guess(a);
      else if (a === 'skip' && jokers > 0) { jokers--; cur = draw(); msg = 'Overgeslagen!'; render(); }
    });
    newDeck(); cur = draw(); api.score(0); render();
    return {
      destroy() {
        dead = true; timers.forEach(clearTimeout); timers.clear();
        if (root.parentNode) root.parentNode.removeChild(root);
      },
    };
  },
};
