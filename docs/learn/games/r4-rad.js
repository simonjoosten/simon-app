// Rad van Fortuin: elk goed antwoord = een draai aan het rad. Munten, hartjes, schilden... maar pas op voor bommen en bankroet!
import { base, ic } from '../r4-ui.js?v=1';

export const SEGS = [
  { id: 'c50', label: '+50', icon: 'coin', w: 5, good: true }, { id: 'c100', label: '+100', icon: 'coin', w: 4, good: true }, { id: 'c250', label: '+250', icon: 'gem', w: 2, good: true },
  { id: 'x2', label: '2× volgende', icon: 'star', w: 2, good: true }, { id: 'heart', label: '+1 hartje', icon: 'heart', w: 1.5, good: true }, { id: 'shield', label: 'Schild', icon: 'shield', w: 1.5, good: true },
  { id: 'jack', label: 'JACKPOT 500', icon: 'trophy', w: 0.6, good: true }, { id: 'bomb', label: 'Bom! -1 hartje', icon: 'bomb', w: 2, good: false }, { id: 'bank', label: 'Bankroet -30%', icon: 'skull', w: 1, good: false },
];
export const RISKY = [
  { id: 'c250', label: '+250', icon: 'gem', w: 3, good: true }, { id: 'jack', label: 'JACKPOT 500', icon: 'trophy', w: 1.5, good: true }, { id: 'x2', label: '2× volgende', icon: 'star', w: 2, good: true },
  { id: 'bomb', label: 'Bom! -1 hartje', icon: 'bomb', w: 3, good: false }, { id: 'bank', label: 'Bankroet -30%', icon: 'skull', w: 2, good: false },
];
export class WheelGame {
  constructor(o = {}) {
    this.rand = o.rand || Math.random; this.level = o.level || 2; this.fx = o.fx || {};
    this.rounds = 10; this.round = 0; this.hearts = (this.level === 1 ? 4 : this.level === 2 ? 3 : 3) + (this.fx.extraLives | 0); this.shield = this.fx.shield | 0;
    this.coins = Math.round(this.fx.startCash || 0); this.x2 = false; this.state = 'play'; this.spins = 0; this.risky = 0; this.jackpots = 0;
  }
  weights(list) { return list.map((s) => s.w * (s.good ? 1 + (this.fx.luck || 0) * 0.8 : 1)); }
  pickSeg(list) { const w = this.weights(list), t = w.reduce((a, b) => a + b, 0); let r = this.rand() * t; for (let i = 0; i < list.length; i++) { r -= w[i]; if (r <= 0) return list[i]; } return list[list.length - 1]; }
  loseHeart() { if (this.shield > 0) { this.shield--; return false; } this.hearts--; if (this.hearts <= 0) this.state = 'lost'; return true; }
  wrong() { if (this.state !== 'play') return; this.round++; this.loseHeart(); this.check(); }
  check() { if (this.state === 'play' && this.round >= this.rounds) this.state = 'won'; }
  spin(risky) {
    const seg = this.pickSeg(risky ? RISKY : SEGS); this.spins++; if (risky) this.risky++;
    let delta = 0;
    const mult = (n) => { const g = Math.round(n * (this.fx.cashMult || 1)) * (this.x2 ? 2 : 1); this.x2 = false; return g; };
    switch (seg.id) {
      case 'c50': delta = mult(50); break; case 'c100': delta = mult(100); break; case 'c250': delta = mult(250); break;
      case 'jack': delta = mult(500); this.jackpots++; break;
      case 'x2': this.x2 = true; break;
      case 'heart': this.hearts++; break; case 'shield': this.shield++; break;
      case 'bomb': this.loseHeart(); break;
      case 'bank': delta = -Math.round(this.coins * 0.3); this.x2 = false; break;
      default: break;
    }
    this.coins += delta; return { seg, delta };
  }
  nextRound() { this.round++; this.check(); }
  finalScore() { return Math.max(0, this.coins + (this.state === 'won' ? 100 + this.hearts * 30 : 0)); }
}

const CSS = `
.r4r-wheel{margin:6px 10px;padding:10px;background:var(--card);border-radius:20px;box-shadow:0 4px 14px rgba(0,0,0,.25);text-align:center}
.r4r-strip{display:flex;gap:6px;justify-content:center;margin:8px 0}
.r4r-tile{flex:1;max-width:84px;min-height:84px;border-radius:14px;background:rgba(127,127,127,.18);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:11px;font-weight:900;padding:4px}
.r4r-tile.mid{background:var(--accent);color:#fff;transform:scale(1.12);box-shadow:0 4px 0 rgba(0,0,0,.3)}
.r4r-tile.bad{background:#dc2626;color:#fff}
.r4r-res{font-weight:900;font-size:16px;min-height:22px}
.r4r-act{display:flex;gap:8px;margin:8px 0 2px}.r4r-act .r4g-btn{flex:1}
`;

export default {
  id: 'r4-rad', name: 'Rad van Fortuin', emoji: '🎡', color: '#db2777',
  desc: 'Elk goed antwoord = een draai aan het rad. Munten, schilden en jackpots, maar pas op voor bommen!',
  tags: ['geluk', 'quiz'], minutes: 4, duo: false,
  create(host, env) {
    const B = base(host, env, { id: 'r4-rad', css: CSS, cls: 'r4r' });
    const G = new WheelGame({ rand: env.rand, level: env.level, fx: B.fx });
    function hud() { return `<div class="r4g-top"><span class="r4g-chip">${ic('coin', 22)} ${G.coins}${G.x2 ? ' ×2' : ''}</span><span class="r4g-chip">${ic('target', 22)} ${Math.min(G.round + 1, G.rounds)}/${G.rounds}</span><span class="sp"></span><span class="r4g-chip">${'❤️'.repeat(Math.max(0, G.hearts))}${G.shield ? ' ' + ic('shield', 20) + G.shield : ''}</span></div>`; }
    function draw(body) { B.ui.innerHTML = hud() + (body || '<div class="r4g-q"></div>'); }
    function ask() {
      if (B.dead() || B.ended) return;
      draw();
      B.ask(B.ui.querySelector('.r4g-q'), (res) => {
        if (res.ok) { B.snd('goed'); wheel(false, true); }
        else { B.snd('fout'); G.wrong(); B.fly(G.shield || G.hearts > 0 ? 'Fout: -1 hartje' : 'Fout!', true); draw(); if (G.state !== 'play') B.later(finish, 800); else B.later(ask, 900); }
      }, { compact: true, label: `Draai ${Math.min(G.round + 1, G.rounds)} van ${G.rounds}` });
    }
    function tile(s, cls) { return `<div class="r4r-tile ${cls || ''} ${s && !s.good && cls === 'mid' ? 'bad' : ''}">${s ? ic(s.icon, 38) : ''}<span>${s ? s.label : ''}</span></div>`; }
    // laat het rad rollen en landt op het vooraf bepaalde segment
    function wheel(risky, first) {
      const res = G.spin(risky), list = risky ? RISKY : SEGS; let step = 0; const total = 14;
      draw(`<div class="r4r-wheel"><b>${risky ? 'Risico-draai!' : 'Draai aan het rad!'}</b><div class="r4r-strip"></div><div class="r4r-res"></div></div>`);
      const strip = B.ui.querySelector('.r4r-strip'), out = B.ui.querySelector('.r4r-res');
      const show = (a, b, c) => { strip.innerHTML = tile(a) + tile(b, 'mid') + tile(c); };
      const rnd = () => list[Math.floor(B.rand() * list.length)];
      let prev = [rnd(), rnd()];
      const roll = () => {
        if (B.dead()) return;
        step++;
        const mid = step >= total ? res.seg : rnd();
        show(prev[1], mid, rnd()); prev = [prev[1], mid]; B.snd('tik');
        if (step < total) B.later(roll, 60 + step * step * 2.2);
        else land();
      };
      function land() {
        const s = res.seg;
        out.textContent = s.good ? `${s.label}!` : `${s.label}`;
        if (res.delta > 0) { B.fly('+' + res.delta); B.snd('munt'); } else if (res.delta < 0) { B.fly(String(res.delta), true); B.snd('fout'); } else B.snd(s.good ? 'power' : 'fout');
        B.later(() => decide(first && !risky), 900);
      }
      roll();
    }
    function decide(canRisk) {
      if (G.state !== 'play') { finish(); return; }
      if (!canRisk) { G.nextRound(); if (G.state !== 'play') { finish(); return; } ask(); return; }
      draw(`<div class="r4r-wheel"><b>Nog een draai wagen?</b><div class="r4r-res">Risico-rad: grote prijzen, maar ook bommen en bankroet.</div><div class="r4r-act"><button class="r4g-btn alt" data-stay="1">Nee, doorgaan</button><button class="r4g-btn" data-risk="1">Risico-draai</button></div></div>`);
      for (const b of B.ui.querySelectorAll('button')) b.addEventListener('click', () => { if (b.getAttribute('data-risk')) wheel(true, false); else if (b.getAttribute('data-stay')) decide(false); });
    }
    function finish() {
      if (B.ended) return;
      const win = G.state === 'won';
      B.end(win, G.finalScore(), win ? `Alle ${G.rounds} rondes uitgespeeld met ${G.coins} munten!` : `Je hartjes zijn op, maar je had ${G.coins} munten.`);
    }
    B.intro({ icon: 'dice', emoji: '🎡', title: 'Rad van Fortuin', text: `Antwoord goed en draai aan het rad: munten, jackpots, schilden en hartjes, maar ook bommen en bankroet. Na een draai mag je een risico-draai wagen. ${G.rounds} rondes, ${G.hearts} hartjes.` }, ask);
    return { destroy() { B.destroy(); } };
  },
};
