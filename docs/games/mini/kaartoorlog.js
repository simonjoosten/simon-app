const SU = ['♠', '♥', '♦', '♣'];
const RK = ['', '', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'B', 'V', 'K', 'A'];
const CSS = '.ko *{box-sizing:border-box}.ko .card{width:92px;height:132px;border-radius:11px;background:#fff;color:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;font-size:38px;box-shadow:0 5px 12px rgba(0,0,0,.45);animation:kopop .25s}.ko .card i{font-style:normal;font-size:40px}.ko .red{color:#d12}.ko .back{background:repeating-linear-gradient(45deg,#2a4aa8,#2a4aa8 6px,#3a5cc4 6px,#3a5cc4 12px);border:5px solid #fff}.ko .sm{width:34px;height:48px;border-width:3px;border-radius:6px;margin-left:-22px;box-shadow:0 1px 3px rgba(0,0,0,.5);animation:none}.ko button{font:inherit;font-weight:900;border:0;border-radius:14px;color:#fff;cursor:pointer;padding:14px 22px;font-size:18px}@keyframes kopop{from{transform:scale(.6);opacity:0}to{transform:none;opacity:1}}';
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
export default {
  id: 'kaartoorlog',
  name: 'Kaartoorlog',
  emoji: '⚔️',
  hint: 'Hoogste kaart wint. Gelijk? Dan is het oorlog!',
  create(host, api) {
    host.style.touchAction = 'manipulation';
    host.style.background = '#6b1d1d';
    let dead = false, ended = false, busy = false, auto = false, over = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
    let me = [], cp = [], tbl = null, msg = 'Tik op "Draai om!"', score = 0, round = 0, games = 0;
    const root = document.createElement('div');
    root.className = 'ko';
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;font-family:system-ui,sans-serif;color:#fff;padding:12px;user-select:none;-webkit-user-select:none';
    host.appendChild(root);
    function deal() {
      const d = [];
      for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) d.push({ r, s });
      shuffle(d);
      me = d.slice(0, 26); cp = d.slice(26); tbl = null; round = 0; over = false; busy = false;
      msg = 'Nieuw spel! Tik op "Draai om!"';
    }
    const face = (c) => '<div class="card' + ((c.s === 1 || c.s === 2) ? ' red' : '') + '"><b>' + RK[c.r] + '</b><i>' + SU[c.s] + '</i></div>';
    const pile = (n) => { let s = ''; const k = Math.min(5, Math.ceil(n / 6)); for (let i = 0; i < k; i++) s += '<div class="card back sm"></div>'; return '<div style="display:flex;padding-left:22px;min-height:48px;align-items:center">' + s + '</div>'; };
    function render() {
      let h = '<div style="width:100%;display:flex;justify-content:space-between;font-weight:800;font-size:16px"><span>⚔️ Ronde ' + round + '/80</span><span>⭐ Score ' + score + '</span></div>';
      h += '<div style="margin-top:10px;font-weight:800">🤖 Computer: ' + cp.length + ' kaarten</div>' + pile(cp.length);
      h += '<div style="flex:1;display:flex;align-items:center;justify-content:center;gap:24px;width:100%">';
      if (tbl) {
        h += '<div style="text-align:center">' + face(tbl.cp) + (tbl.hid ? '<div style="font-size:12px;margin-top:4px">+' + tbl.hid + ' verborgen</div>' : '') + '</div>';
        h += '<div style="text-align:center">' + face(tbl.me) + (tbl.hid ? '<div style="font-size:12px;margin-top:4px">+' + tbl.hid + ' verborgen</div>' : '') + '</div>';
      } else h += '<div style="font-size:60px">⚔️</div>';
      h += '</div>';
      h += '<div style="min-height:44px;font-size:19px;font-weight:900;text-align:center;padding:0 6px">' + msg + '</div>';
      h += '<div style="margin-top:6px;font-weight:800">🙂 Jij: ' + me.length + ' kaarten</div>' + pile(me.length);
      h += '<div style="display:flex;gap:10px;margin-top:10px">';
      if (!over) h += '<button data-a="go" style="background:#16a34a"' + (busy || auto ? ' disabled' : '') + '>Draai om!</button><button data-a="auto" style="background:' + (auto ? '#d97706' : '#7c3aed') + '">' + (auto ? '⏸ Stop auto' : '⏩ Auto') + '</button>';
      else h += '<button data-a="new" style="background:#16a34a">Nieuw spel ▶</button>';
      h += '</div>';
      root.innerHTML = '<style>' + CSS + '</style>' + h;
    }
    function takeCards(winnerArr, cards) { shuffle(cards); for (const c of cards) winnerArr.push(c); }
    function play() {
      if (busy || over || ended) return;
      busy = true;
      round++;
      let pot = [];
      let hid = 0;
      let a = me.shift(), b = cp.shift();
      pot.push(a, b);
      let warCount = 0;
      while (a.r === b.r) {
        warCount++;
        if (!me.length || !cp.length) break; // wie geen kaarten meer heeft verliest meteen
        const dn = Math.min(3, me.length - 1, cp.length - 1);
        for (let i = 0; i < dn; i++) pot.push(me.shift(), cp.shift());
        hid += dn;
        a = me.shift(); b = cp.shift();
        pot.push(a, b);
      }
      tbl = { me: a, cp: b, hid };
      let m = '';
      if (a.r === b.r) {
        // oorlog zonder uitkomst: iemand heeft geen kaarten meer
        if (!me.length && !cp.length) { takeCards(me, pot.slice(0, Math.ceil(pot.length / 2))); takeCards(cp, pot.slice(Math.ceil(pot.length / 2))); m = 'Gelijkspel in de oorlog!'; }
        else if (!me.length) { takeCards(cp, pot); m = 'Oorlog! Jij hebt geen kaarten meer...'; }
        else { takeCards(me, pot); m = 'Oorlog! De computer heeft geen kaarten meer!'; }
      } else if (a.r > b.r) { takeCards(me, pot); score += 1 + (warCount ? 3 * warCount : 0); m = (warCount ? '⚔️ OORLOG gewonnen! +' + (1 + 3 * warCount) : 'Jij wint de ronde! +1') + (pot.length > 2 && !warCount ? '' : ''); }
      else { takeCards(cp, pot); m = warCount ? '⚔️ OORLOG verloren...' : 'Computer wint de ronde'; }
      api.score(score);
      msg = m;
      render();
      later(() => {
        busy = false;
        if (!me.length || !cp.length || round >= 80) return judge();
        render();
        if (auto) later(play, 350);
      }, 750);
    }
    function judge() {
      auto = false;
      const won = me.length > cp.length;
      over = true;
      if (won) {
        games++; score += 25; api.score(score);
        msg = '🏆 Jij wint het spel! +25 punten';
        render();
      } else {
        msg = me.length === cp.length ? 'Gelijk eindigt... de computer wint op het randje' : '💀 De computer wint het spel';
        render();
        later(() => { if (!ended) { ended = true; api.end(score); } }, 1700);
      }
    }
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]');
      if (!b || ended) return;
      const a = b.dataset.a;
      if (a === 'go') play();
      else if (a === 'auto') { auto = !auto; render(); if (auto && !busy) play(); }
      else if (a === 'new' && over && me.length + cp.length >= 0) { deal(); render(); }
    });
    deal(); api.score(0); render();
    return {
      destroy() {
        dead = true; timers.forEach(clearTimeout); timers.clear();
        if (root.parentNode) root.parentNode.removeChild(root);
      },
    };
  },
};
