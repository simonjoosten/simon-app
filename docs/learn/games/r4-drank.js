// Toverdrank: kook drankjes voor klanten. Goed antwoord = kies een ingrediënt, fout antwoord = slijm in de ketel.
import { base, ic } from '../r4-ui.js?v=1';

export const ING = [['mushroom', 'Paddenstoel', '🍄'], ['flower', 'Bloem', '🌸'], ['gem', 'Kristal', '💎'], ['frog', 'Kikker', '🐸'], ['snowflake', 'Sneeuw', '❄️'], ['flame', 'Vuur', '🔥']];
export const SLIME = 'slime';

export class BrewGame {
  constructor(o = {}) {
    this.rand = o.rand || Math.random; this.level = o.level || 2; this.fx = o.fx || {};
    this.need = this.level === 1 ? 2 : this.level === 2 ? 3 : 4; this.cap = this.need + 1;
    this.hearts = 3 + (this.fx.extraLives | 0); this.shield = this.fx.shield | 0; this.target = 8; this.served = 0; this.coins = 0; this.perfect = 0; this.state = 'play'; this.cauldron = [];
    this.newOrder();
  }
  pickN(arr, n) { const a = arr.slice(), out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(this.rand() * a.length), 1)[0]); return out; }
  newOrder() { this.order = this.pickN(ING.map((x) => x[0]), this.need); this.cauldron = []; }
  missing() { const have = this.cauldron.slice(); const m = []; for (const o of this.order) { const i = have.indexOf(o); if (i >= 0) have.splice(i, 1); else m.push(o); } return m; }
  // 3 keuzes; minstens 1 nuttig (met geluk meer)
  offer() {
    const miss = this.missing(), all = ING.map((x) => x[0]);
    const good = miss.length ? this.pickN(miss, 1) : [];
    const rest = this.pickN(all.filter((x) => !good.includes(x)), 3 - good.length);
    if (this.fx.luck && this.rand() < this.fx.luck && miss.length > 1) { const g2 = this.pickN(miss.filter((x) => !good.includes(x)), 1); if (g2.length) rest[0] = g2[0]; }
    return this.pickN([...good, ...rest], 3);
  }
  add(id) {
    if (this.state !== 'play') return { ev: [] };
    this.cauldron.push(id); const ev = [];
    if (this.missing().length === 0) {
      const mess = this.cauldron.length - this.order.length, gain = (30 + this.need * 20) * (mess === 0 ? 2 : 1) + Math.round((this.fx.startCash || 0) * 0);
      this.coins += gain; this.served++; if (mess === 0) this.perfect++;
      ev.push({ e: 'sold', gain, perfect: mess === 0 }); this.newOrder();
      if (this.served >= this.target) this.state = 'won';
    } else if (this.cauldron.length >= this.cap) {
      ev.push({ e: 'spill' }); this.loseHeart(ev); this.newOrder();
    }
    return { ev };
  }
  junk() { return this.add(SLIME); }
  loseHeart(ev) {
    if (this.shield > 0) { this.shield--; ev.push({ e: 'shield' }); return; }
    this.hearts--; if (this.hearts <= 0) this.state = 'lost';
  }
  score() { return this.coins + this.served * 10 + this.perfect * 25 + (this.state === 'won' ? 150 + this.hearts * 40 : 0); }
}

const CSS = `
.r4d-shop{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin:0 10px;padding:8px 10px;background:var(--card);border-radius:16px;box-shadow:0 4px 14px rgba(0,0,0,.2)}
.r4d-ord{display:flex;gap:4px;align-items:center;font-weight:900}
.r4d-pot{display:flex;gap:4px;min-height:38px;align-items:center;flex-basis:100%;justify-content:center}
.r4d-slot{width:36px;height:36px;border-radius:50%;background:rgba(127,127,127,.2);display:inline-flex;align-items:center;justify-content:center}
.r4d-slot.ok{background:rgba(34,197,94,.3)}.r4d-slot.bad{background:rgba(168,85,247,.3)}
.r4d-pick{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 10px}
.r4d-pick button{border:0;border-radius:16px;background:var(--card);color:var(--ink);min-height:84px;font:inherit;font-weight:900;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;box-shadow:0 4px 0 rgba(0,0,0,.25);cursor:pointer}
.r4d-pick button.need{outline:3px solid #22c55e}
`;

export default {
  id: 'r4-drank', name: 'Toverdrank', emoji: '🧪', color: '#9333ea',
  desc: 'Kook drankjes voor klanten: goede antwoorden geven ingrediënten, foute geven slijm.',
  tags: ['rustig', 'geld'], minutes: 5, duo: false,
  create(host, env) {
    const B = base(host, env, { id: 'r4-drank', css: CSS, cls: 'r4d' });
    const G = new BrewGame({ rand: env.rand, level: env.level, fx: B.fx });
    const name = (id) => (ING.find((x) => x[0] === id) || [id, id])[1];
    const slot = (id, cls) => `<span class="r4d-slot ${cls || ''}">${id ? ic(id, 30) : ''}</span>`;
    function hud() { return `<div class="r4g-top"><span class="r4g-chip">${ic('coin', 22)} ${G.coins}</span><span class="r4g-chip">${ic('potion', 22)} ${G.served}/${G.target}</span><span class="sp"></span><span class="r4g-chip">${'❤️'.repeat(Math.max(0, G.hearts))}${G.shield ? ic('shield', 20) : ''}</span></div>`; }
    function shopHTML() {
      const miss = G.missing().slice();
      const orderHTML = G.order.map((o) => { const need = miss.indexOf(o); if (need >= 0) { miss.splice(need, 1); return slot(o, ''); } return slot(o, 'ok'); }).join('');
      const pot = []; for (let i = 0; i < G.cap; i++) { const id = G.cauldron[i]; pot.push(slot(id, id ? (G.order.includes(id) ? 'ok' : 'bad') : '')); }
      return `<div class="r4d-shop"><div>${ic('wizard', 40)}</div><div class="r4d-ord">Bestelling: ${orderHTML}</div><div class="r4d-pot">${ic('potion', 30)}${pot.join('')}</div></div>`;
    }
    function draw(body) { B.ui.innerHTML = hud() + shopHTML() + (body || '<div class="r4g-q"></div>'); }
    function ask() {
      if (B.dead() || B.ended) return;
      draw();
      B.ask(B.ui.querySelector('.r4g-q'), (res) => {
        if (res.ok) { B.snd('goed'); choose(); }
        else { B.snd('fout'); const r = G.junk(); B.fly('Slijm in de ketel!', true); after(r); }
      }, { compact: true, label: `Klant ${G.served + 1} van ${G.target}` });
    }
    function choose() {
      const offer = G.offer(), miss = G.missing();
      draw(`<div class="r4g-card" style="margin:8px 10px 0;text-align:center"><b>Kies een ingrediënt</b></div><div class="r4d-pick">${offer.map((o) => `<button data-i="${o}" class="${miss.includes(o) ? 'need' : ''}">${ic(o, 44)}<span>${name(o)}</span></button>`).join('')}</div>`);
      for (const b of B.ui.querySelectorAll('button')) b.addEventListener('click', () => { const id = b.getAttribute('data-i'); if (id) { B.snd('klik'); after(G.add(id)); } });
    }
    function after(r) {
      for (const e of r.ev) {
        if (e.e === 'sold') { B.fly(e.perfect ? `Perfect! +${e.gain}` : `Verkocht! +${e.gain}`); B.snd('munt'); }
        else if (e.e === 'spill') { B.fly('Gemorst! Klant boos', true); B.snd('fout'); }
        else if (e.e === 'shield') B.fly('Schild!');
      }
      draw();
      if (G.state !== 'play') { B.later(finish, 900); return; }
      B.later(ask, 900);
    }
    function finish() {
      const win = G.state === 'won';
      B.end(win, G.score(), win ? `${G.served} klanten blij gemaakt, waarvan ${G.perfect} perfect!` : `De klanten gingen boos weg na ${G.served} drankjes.`);
    }
    B.intro({ icon: 'potion', emoji: '🧪', title: 'Toverdrank', text: `Klanten bestellen een drankje van ${G.need} ingrediënten. Antwoord goed en kies een ingrediënt; antwoord fout en er valt slijm in de ketel. Is de ketel vol? Dan mors je! Bedien ${G.target} klanten.` }, ask);
    return { destroy() { B.destroy(); } };
  },
};
