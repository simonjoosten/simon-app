const SU = ['♠', '♥', '♦', '♣'];
const RK = ['', '', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'B', 'V', 'K', 'A'];
const PAY = [
  ['Royal flush', 800], ['Straight flush', 400], ['Carré', 200], ['Full house', 80], ['Kleur', 50],
  ['Straat', 40], ['Drie gelijke', 30], ['Twee paar', 20], ['Paar B of hoger', 10],
];
const CSS = '.pk *{box-sizing:border-box}.pk .card{width:60px;height:88px;border-radius:9px;background:#fff;color:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;font-size:25px;line-height:1.05;box-shadow:0 3px 8px rgba(0,0,0,.45);cursor:pointer;transition:transform .15s;animation:pkin .3s backwards}.pk .card i{font-style:normal;font-size:28px}.pk .red{color:#d12}.pk .held{transform:translateY(-14px);outline:3px solid #ffd54a}.pk button{font:inherit;font-weight:900;border:0;border-radius:14px;color:#fff;cursor:pointer;padding:14px 26px;font-size:18px}@keyframes pkin{from{transform:rotateY(90deg);opacity:0}to{transform:none;opacity:1}}';
function evaluate(h) {
  const rs = h.map((c) => c.r).sort((a, b) => a - b);
  const cnt = {};
  rs.forEach((r) => { cnt[r] = (cnt[r] || 0) + 1; });
  const groups = Object.entries(cnt).map(([r, n]) => [Number(r), n]).sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flush = h.every((c) => c.s === h[0].s);
  const uniq = new Set(rs).size === 5;
  const straight = uniq && (rs[4] - rs[0] === 4 || (rs[4] === 14 && rs[0] === 2 && rs[3] === 5));
  const royal = straight && flush && rs[0] === 10;
  if (royal) return { name: 'Royal flush!', pts: 800, idx: [0, 1, 2, 3, 4] };
  if (straight && flush) return { name: 'Straight flush!', pts: 400, idx: [0, 1, 2, 3, 4] };
  if (groups[0][1] === 4) return { name: 'Carré!', pts: 200 };
  if (groups[0][1] === 3 && groups[1][1] === 2) return { name: 'Full house!', pts: 80 };
  if (flush) return { name: 'Kleur!', pts: 50 };
  if (straight) return { name: 'Straat!', pts: 40 };
  if (groups[0][1] === 3) return { name: 'Drie gelijke', pts: 30 };
  if (groups[0][1] === 2 && groups[1][1] === 2) return { name: 'Twee paar', pts: 20 };
  if (groups[0][1] === 2 && groups[0][0] >= 11) return { name: 'Paar van ' + RK[groups[0][0]] + 's', pts: 10 };
  if (groups[0][1] === 2) return { name: 'Laag paar (telt niet)', pts: 0 };
  return { name: 'Niets', pts: 0 };
}
export default {
  id: 'pokerhand',
  name: 'Pokerhand',
  emoji: '♠️',
  hint: 'Kies welke kaarten je houdt, wissel de rest en maak een mooie pokerhand',
  create(host, api) {
    host.style.touchAction = 'manipulation';
    host.style.background = '#0f5132';
    let dead = false, ended = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
    let deck = [], hand = [], held = [false, false, false, false, false], round = 1, total = 0, phase = 'deal', res = null;
    const root = document.createElement('div');
    root.className = 'pk';
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;font-family:system-ui,sans-serif;color:#fff;padding:10px 6px;user-select:none;-webkit-user-select:none';
    host.appendChild(root);
    function newDeck() {
      deck = [];
      for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) deck.push({ r, s });
      for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
    }
    function dealHand() {
      newDeck(); hand = []; held = [false, false, false, false, false]; res = null; phase = 'deal';
      for (let i = 0; i < 5; i++) hand.push(deck.pop());
      render(true);
    }
    function render(anim) {
      let h = '<div style="width:100%;display:flex;justify-content:space-between;font-weight:800;font-size:16px;padding:0 8px"><span>♠️ Ronde ' + Math.min(round, 10) + '/10</span><span>⭐ Punten ' + total + '</span></div>';
      h += '<div style="margin:12px 0 6px;font-size:13px;opacity:.9;line-height:1.5;text-align:center;padding:0 6px">' + PAY.map((p) => p[0] + ' <b>' + p[1] + '</b>').join(' · ') + '</div>';
      h += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%">';
      h += '<div style="min-height:44px;font-size:22px;font-weight:900;text-align:center;margin-bottom:22px">' + (res ? res.name + (res.pts ? ' +' + res.pts : '') : 'Tik de kaarten die je wilt houden') + '</div>';
      h += '<div style="display:flex;gap:6px;justify-content:center;margin-top:12px">';
      hand.forEach((c, i) => {
        h += '<div data-i="' + i + '" class="card' + ((c.s === 1 || c.s === 2) ? ' red' : '') + (held[i] ? ' held' : '') + '"' + (anim || (res && !held[i]) ? ' style="animation-delay:' + i * 70 + 'ms"' : ' style="animation:none"') + '><b>' + RK[c.r] + '</b><i>' + SU[c.s] + '</i></div>';
      });
      h += '</div><div style="height:22px;margin-top:6px;display:flex;gap:6px">';
      hand.forEach((c, i) => { h += '<div style="width:60px;text-align:center;font-size:12px;font-weight:900;color:#ffd54a">' + (held[i] && !res ? 'HOUDEN' : '') + '</div>'; });
      h += '</div></div>';
      if (phase === 'deal') h += '<button data-a="draw" style="background:#16a34a">Wissel de rest ▶</button>';
      else h += '<button data-a="next" style="background:#2563eb">' + (round >= 10 ? 'Klaar - eindscore' : 'Volgende ronde ▶') + '</button>';
      root.innerHTML = '<style>' + CSS + '</style>' + h;
    }
    root.addEventListener('click', (e) => {
      if (ended) return;
      const a = e.target.closest('[data-a]');
      if (a) {
        if (a.dataset.a === 'draw' && phase === 'deal') {
          for (let i = 0; i < 5; i++) if (!held[i]) hand[i] = deck.pop();
          res = evaluate(hand); total += res.pts; api.score(total); phase = 'result';
          render(false);
        } else if (a.dataset.a === 'next' && phase === 'result') {
          if (round >= 10) { ended = true; api.end(total); return; }
          round++; dealHand();
        }
        return;
      }
      const c = e.target.closest('[data-i]');
      if (c && phase === 'deal') {
        const i = Number(c.dataset.i);
        held[i] = !held[i];
        const el = root.querySelector('[data-i="' + i + '"]');
        // zonder volledige herrender (geen animatie): alleen stijl wisselen
        render(false);
      }
    });
    api.score(0);
    dealHand();
    return {
      destroy() {
        dead = true; timers.forEach(clearTimeout); timers.clear();
        if (root.parentNode) root.parentNode.removeChild(root);
      },
    };
  },
};
