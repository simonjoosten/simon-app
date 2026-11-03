// Diepzee-duik: duik dieper voor meer schatten, maar durf je door? Fout = zuurstof weg. Opduiken om je buit veilig te stellen.
import { base, ic } from '../r4-ui.js?v=1';

export const DIVES = 3;
export class DiveGame {
  constructor(o = {}) {
    this.rand = o.rand || Math.random; this.level = o.level || 2; this.fx = o.fx || {};
    this.target = this.level === 1 ? 300 : this.level === 2 ? 450 : 600;
    this.dive = 1; this.banked = 0; this.shield = this.fx.shield | 0; this.state = 'play'; this.lostLoot = 0; this.bestDepth = 0; this.chests = 0;
    this.startDive();
  }
  startDive() { this.depth = 0; this.o2 = 100 + (this.fx.extraLives | 0) * 15; this.loot = 0; this.phase = 'ask'; }
  wrongCost() { return 28 + this.depth * 2; }
  answer(ok) {
    if (this.state !== 'play' || this.phase !== 'ask') return { ev: [] };
    const ev = [];
    if (ok) {
      this.depth++; this.bestDepth = Math.max(this.bestDepth, this.depth);
      let gain = Math.round((15 + this.depth * 10) * (this.fx.cashMult || 1));
      if (this.rand() < 0.18 + (this.fx.luck || 0) * 0.2) { gain += 40 + this.depth * 10; this.chests++; ev.push({ e: 'chest' }); }
      this.loot += gain; this.o2 = Math.min(100, this.o2 + 6); ev.push({ e: 'deeper', gain });
      this.phase = 'choose';
    } else {
      if (this.shield > 0) { this.shield--; ev.push({ e: 'shield' }); this.phase = this.depth > 0 ? 'choose' : 'ask'; }
      else {
        this.o2 -= this.wrongCost(); ev.push({ e: 'zap' });
        if (this.o2 <= 0) { this.lostLoot += this.loot; ev.push({ e: 'drown', lost: this.loot }); this.loot = 0; this.endDive(); }
        else this.phase = this.depth > 0 ? 'choose' : 'ask';
      }
    }
    return { ev };
  }
  surface() { if (this.phase !== 'choose') return 0; const g = this.loot; this.banked += g; this.loot = 0; this.endDive(); return g; }
  deeper() { if (this.phase === 'choose') this.phase = 'ask'; }
  endDive() { if (this.dive >= DIVES) this.state = this.banked >= this.target ? 'won' : 'lost'; else { this.dive++; this.startDive(); } }
  finalScore() { return this.banked + (this.state === 'won' ? 200 : 0) + this.bestDepth * 5; }
}

const CSS = `
.r4w-gauge{display:flex;gap:8px;margin:0 10px;padding:8px 10px;background:var(--card);border-radius:16px;align-items:center;box-shadow:0 4px 14px rgba(0,0,0,.25)}
.r4w-gauge .r4g-bar{flex:1}
.r4w-dec{display:flex;gap:10px;margin:10px;flex-wrap:wrap}.r4w-dec .r4g-btn{flex:1 1 140px;min-height:64px}
.r4w-sub{text-align:center;margin:6px 0}
`;

export default {
  id: 'r4-duik', name: 'Diepzee-duik', emoji: '🤿', color: '#0e7490',
  desc: 'Duik dieper voor meer schatten. Durf jij door, of stel je je buit veilig?',
  tags: ['geld', 'denken'], minutes: 5, duo: false,
  create(host, env) {
    const B = base(host, env, { id: 'r4-duik', css: CSS, cls: 'r4w' });
    const G = new DiveGame({ rand: env.rand, level: env.level, fx: B.fx });
    function hud() { return `<div class="r4g-top"><span class="r4g-chip">${ic('submarine', 22)} Duik ${G.dive}/${DIVES}</span><span class="r4g-chip">${ic('chest', 22)} ${G.banked}/${G.target}</span><span class="sp"></span><span class="r4g-chip">${G.shield ? ic('shield', 20) + ' ' : ''}${ic('coin', 20)} ${G.loot}</span></div>`; }
    function gauge() { const warn = G.o2 < 35; return `<div class="r4w-gauge">${ic('fish', 26)}<b>${G.depth * 10} m</b><div class="r4g-bar${warn ? ' warn' : ''}"><i style="width:${Math.max(0, G.o2)}%"></i></div><small>zuurstof ${Math.max(0, Math.round(G.o2))}</small></div>`; }
    function draw(body) { B.ui.innerHTML = hud() + gauge() + (body || '<div class="r4g-q"></div>'); }
    function ask() {
      if (B.dead() || B.ended) return;
      draw();
      B.ask(B.ui.querySelector('.r4g-q'), (res) => {
        const prevDive = G.dive, r = G.answer(res.ok); B.snd(res.ok ? 'goed' : 'fout');
        for (const e of r.ev) {
          if (e.e === 'deeper') B.fly('+' + e.gain); else if (e.e === 'chest') { B.fly('Schatkist!'); B.snd('munt'); }
          else if (e.e === 'zap') B.fly('Zuurstof lekt!', true); else if (e.e === 'shield') B.fly('Schild!');
          else if (e.e === 'drown') B.fly('Buit kwijt: ' + e.lost, true);
        }
        next(prevDive !== G.dive);
      }, { compact: true, label: `Dieper naar ${(G.depth + 1) * 10} m` });
    }
    function next() {
      if (G.state !== 'play') { draw(); B.later(finish, 900); return; }
      if (G.phase === 'choose') choose(); else B.later(ask, 700);
    }
    function choose() {
      draw(`<div class="r4w-sub"><b>${G.depth * 10} m diep.</b> Zuurstof ${Math.round(G.o2)}. Een fout kost ${G.wrongCost()}.</div><div class="r4w-dec"><button class="r4g-btn" data-deeper="1">${ic('whale', 26)} Dieper!</button><button class="r4g-btn alt" data-up="1">${ic('chest', 26)} Opduiken (+${G.loot})</button></div>`);
      for (const b of B.ui.querySelectorAll('button')) b.addEventListener('click', () => {
        if (b.getAttribute('data-deeper')) { G.deeper(); ask(); }
        else if (b.getAttribute('data-up')) { const g = G.surface(); B.fly('Veilig! +' + g); B.snd('munt'); if (G.state !== 'play') { draw(); B.later(finish, 900); } else B.later(ask, 800); }
      });
    }
    function finish() {
      const win = G.state === 'won';
      B.end(win, G.finalScore(), win ? `Schatten binnengehaald: ${G.banked} munten! Diepste duik: ${G.bestDepth * 10} m.` : `Je haalde ${G.banked} van de ${G.target} munten. Nog een duik?`);
    }
    B.intro({ icon: 'submarine', emoji: '🤿', title: 'Diepzee-duik', text: `Elk goed antwoord brengt je 10 meter dieper met meer buit. Opduiken zet je buit veilig, maar bij te weinig zuurstof verlies je alles van deze duik! Verzamel ${G.target} munten in ${DIVES} duiken.` }, ask);
    return { destroy() { B.destroy(); } };
  },
};
