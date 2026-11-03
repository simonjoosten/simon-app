// Regenboogladder: bordspel tegen een robot. Goed antwoord = dobbelen en lopen. Regenbogen tillen je omhoog, haaien laten je zakken.
import { base, ic } from '../r4-ui.js?v=1';

export const CELLS = 30;
export const UP = { 3: 11, 8: 17, 14: 23, 19: 27 };      // regenbogen
export const DOWN = { 13: 5, 21: 9, 25: 15, 28: 18 };    // haaien
export const STARS = [6, 12, 20, 24];                    // sterren: bonuspunten
export const MAX_ROUNDS = 40;

export class LadderGame {
  constructor(o = {}) {
    this.rand = o.rand || Math.random; this.level = o.level || 2; this.fx = o.fx || {};
    this.me = 0; this.bot = 0; this.round = 0; this.score = 0; this.stars = new Set(); this.shield = this.fx.shield | 0; this.state = 'play'; this.log = [];
  }
  roll() { let r = 1 + Math.floor(this.rand() * 6); if (this.fx.luck && this.rand() < this.fx.luck * 0.6) r = Math.max(r, 1 + Math.floor(this.rand() * 6)); return r; }
  land(pos, who) {
    const ev = [];
    if (pos > CELLS) pos = CELLS;
    if (UP[pos]) { ev.push({ e: 'up', from: pos, to: UP[pos], who }); pos = UP[pos]; }
    else if (DOWN[pos]) {
      if (who === 'me' && this.shield > 0) { this.shield--; ev.push({ e: 'shield', at: pos, who }); }
      else { ev.push({ e: 'down', from: pos, to: DOWN[pos], who }); pos = DOWN[pos]; }
    }
    return { pos, ev };
  }
  // Een ronde: speler (alleen bij goed antwoord) en daarna de robot.
  playRound(correct) {
    if (this.state !== 'play') return { ev: [] };
    this.round++; const ev = [];
    if (correct) {
      const r = this.roll(); ev.push({ e: 'roll', n: r, who: 'me' });
      const l = this.land(Math.min(CELLS, this.me + r), 'me'); this.me = l.pos; ev.push(...l.ev);
      if (STARS.includes(this.me) && !this.stars.has(this.me)) { this.stars.add(this.me); this.score += 50; ev.push({ e: 'star', at: this.me }); }
      this.score += 15;
      if (this.me >= CELLS) { this.state = 'won'; return { ev }; }
    }
    // robot: makkelijk slaat soms een beurt over
    const skip = this.level === 1 ? 0.4 : this.level === 2 ? 0.28 : 0.1;
    if (this.rand() >= skip) {
      const r = 1 + Math.floor(this.rand() * 6); ev.push({ e: 'roll', n: r, who: 'bot' });
      const l = this.land(Math.min(CELLS, this.bot + r), 'bot'); this.bot = l.pos; ev.push(...l.ev);
      if (this.bot >= CELLS) { this.state = 'lost'; return { ev }; }
    }
    if (this.round >= MAX_ROUNDS) this.state = this.me >= this.bot ? 'won' : 'lost';
    return { ev };
  }
  finalScore() { return Math.round(this.score + this.me * 8 + (this.state === 'won' ? 300 + (MAX_ROUNDS - this.round) * 6 : 0)); }
}

// vakje 1..30 -> (rij van boven, kolom) met slingerpad van onder naar boven
export function cellPos(n, cols = 6) {
  const i = n - 1, row = Math.floor(i / cols), c = i % cols, rows = Math.ceil(CELLS / cols);
  return { r: rows - 1 - row, c: row % 2 ? cols - 1 - c : c };
}

const CSS = `
.r4l-board{display:grid;grid-template-columns:repeat(6,1fr);gap:3px;margin:0 10px;padding:6px;background:var(--card);border-radius:16px;box-shadow:0 4px 14px rgba(0,0,0,.25)}
.r4l-c{position:relative;aspect-ratio:1/0.7;border-radius:9px;background:rgba(127,127,127,.14);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;overflow:hidden}
.r4l-c.up{background:rgba(34,197,94,.28)}.r4l-c.dn{background:rgba(239,68,68,.25)}.r4l-c.st{background:rgba(250,204,21,.35)}
.r4l-c small{position:absolute;left:3px;top:1px;font-size:9px;opacity:.7}
.r4l-t{position:absolute;right:1px;bottom:0;display:flex}
.r4l-t i{animation:r4gPop .35s}
`;

export default {
  id: 'r4-ladder', name: 'Regenboogladder', emoji: '🌈', color: '#06b6d4',
  desc: 'Bordspel tegen een robot: goed antwoord = dobbelen. Klim regenbogen, ontwijk haaien!',
  tags: ['bordspel', 'denken'], minutes: 5, duo: false,
  create(host, env) {
    const B = base(host, env, { id: 'r4-ladder', css: CSS, cls: 'r4l' });
    const G = new LadderGame({ rand: env.rand, level: env.level, fx: B.fx });
    function boardHTML() {
      const cells = [];
      for (let n = 1; n <= CELLS; n++) { const p = cellPos(n); cells[p.r * 6 + p.c] = n; }
      return cells.map((n) => {
        const cls = UP[n] ? ' up' : DOWN[n] ? ' dn' : STARS.includes(n) ? ' st' : '';
        const mark = UP[n] ? ic('rainbow', 20) + '→' + UP[n] : DOWN[n] ? ic('shark', 20) + '→' + DOWN[n] : STARS.includes(n) ? (G.stars.has(n) ? '✔' : ic('star', 20)) : '';
        const tk = (G.me === n ? `<i>${ic('fox', 22)}</i>` : '') + (G.bot === n ? `<i>${ic('robot', 22)}</i>` : '');
        return `<div class="r4l-c${cls}"><small>${n}</small>${mark}<span class="r4l-t">${tk}</span></div>`;
      }).join('');
    }
    function hud() { return `<div class="r4g-top"><span class="r4g-chip">${ic('fox', 22)} ${G.me}</span><span class="r4g-chip">${ic('robot', 22)} ${G.bot}</span><span class="sp"></span><span class="r4g-chip">${ic('star', 22)} ${G.score}</span>${G.shield ? `<span class="r4g-chip">${ic('shield', 22)} ${G.shield}</span>` : ''}</div>`; }
    function say(ev) {
      for (const e of ev) {
        if (e.e === 'roll') B.fly((e.who === 'me' ? 'Jij gooit ' : 'Robot gooit ') + e.n, e.who === 'bot');
        else if (e.e === 'up') B.fly(e.who === 'me' ? 'Regenboog! Omhoog!' : 'Robot klimt!', e.who === 'bot');
        else if (e.e === 'down') B.fly(e.who === 'me' ? 'Haai! Omlaag...' : 'Robot gebeten!', e.who === 'me');
        else if (e.e === 'shield') B.fly('Schild redt je!');
        else if (e.e === 'star') { B.fly('+50 ster!'); B.snd('munt'); }
      }
    }
    function turn() {
      if (B.dead() || B.ended) return;
      ui_render();
      const qh = B.ui.querySelector('.r4g-q');
      B.ask(qh, (res) => {
        const r = G.playRound(res.ok); B.snd(res.ok ? 'goed' : 'fout');
        if (!res.ok) B.fly('Fout: je mag niet dobbelen', true);
        say(r.ev);
        ui_render();
        if (G.state !== 'play') { B.later(finish, 900); return; }
        B.later(turn, 1100);
      }, { compact: true, label: `Ronde ${G.round + 1}` });
    }
    function ui_render() { B.ui.innerHTML = hud() + `<div class="r4l-board">${boardHTML()}</div><div class="r4g-q"></div>`; }
    function finish() {
      const win = G.state === 'won';
      B.end(win, G.finalScore(), win ? `Je bereikte de finish in ronde ${G.round}!` : 'De robot was sneller. Nog een keer!');
    }
    B.intro({ icon: 'rainbow', emoji: '🌈', title: 'Regenboogladder', text: 'Beantwoord de vraag goed om te dobbelen en naar de finish (30) te lopen. Regenbogen tillen je omhoog, haaien bijten je terug. Verslaat de robot jou?' }, turn);
    return { destroy() { B.destroy(); } };
  },
};
