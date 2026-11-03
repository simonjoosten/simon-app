// Kluiskraker: kraak de geheime code. Elk goed antwoord geeft een poging; elk fout antwoord zet het alarm aan.
import { base, ic } from '../r4-ui.js?v=1';

export const DIGITS = 6;
export class VaultGame {
  constructor(o = {}) {
    this.rand = o.rand || Math.random; this.level = o.level || 2; this.fx = o.fx || {};
    this.len = this.level === 1 ? 3 : this.level === 2 ? 4 : 4;
    this.maxAlarms = 3 + (this.fx.extraLives | 0); this.alarms = this.maxAlarms; this.shield = this.fx.shield | 0;
    this.maxGuesses = this.level === 1 ? 8 : this.level === 2 ? 9 : 8; this.guesses = []; this.state = 'play'; this.hints = new Set();
    const pool = [1, 2, 3, 4, 5, 6]; this.code = [];
    for (let i = 0; i < this.len; i++) this.code.push(pool.splice(Math.floor(this.rand() * pool.length), 1)[0]);
  }
  wrongAnswer() {
    if (this.state !== 'play') return false;
    if (this.shield > 0) { this.shield--; return false; }
    this.alarms--; if (this.alarms <= 0) this.state = 'lost'; return true;
  }
  // onthult een nog onbekende plek van de code (gratis hint na een goed antwoord, max 1 per 3 goede antwoorden door de UI)
  hint() { const free = []; for (let i = 0; i < this.len; i++) if (!this.hints.has(i)) free.push(i); if (!free.length) return null; const i = free[Math.floor(this.rand() * free.length)]; this.hints.add(i); return { i, d: this.code[i] }; }
  guess(g) {
    if (this.state !== 'play' || !Array.isArray(g) || g.length !== this.len) return null;
    let exact = 0, near = 0; for (let i = 0; i < this.len; i++) { if (g[i] === this.code[i]) exact++; else if (this.code.includes(g[i])) near++; }
    this.guesses.push({ g: g.slice(), exact, near });
    if (exact === this.len) this.state = 'won'; else if (this.guesses.length >= this.maxGuesses) this.state = 'lost';
    return { exact, near };
  }
  score() { return this.state === 'won' ? 400 + this.alarms * 80 + (this.maxGuesses - this.guesses.length) * 30 : this.guesses.reduce((s, x) => s + x.exact * 15 + x.near * 5, 0); }
}

const CSS = `
.r4k-hist{display:flex;flex-direction:column;gap:4px;margin:0 10px;padding:8px;background:var(--card);border-radius:16px;max-height:36%;overflow-y:auto;box-shadow:0 4px 14px rgba(0,0,0,.2)}
.r4k-row{display:flex;align-items:center;gap:6px;font-weight:900}
.r4k-d{width:34px;height:34px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:18px;box-shadow:inset 0 -3px 0 rgba(0,0,0,.25)}
.r4k-d.e{background:rgba(127,127,127,.25);color:var(--ink);box-shadow:none}
.r4k-fb{margin-left:auto;font-size:13px;white-space:nowrap}
.r4k-pad{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:8px 10px}
.r4k-pad button{min-height:48px;border-radius:12px;border:0;color:#fff;font:inherit;font-weight:900;font-size:20px;box-shadow:0 3px 0 rgba(0,0,0,.25)}
.r4k-act{display:flex;gap:8px;margin:0 10px 10px}.r4k-act .r4g-btn{flex:1}
.r4k-dig0{background:#ef4444}.r4k-dig1{background:#f97316}.r4k-dig2{background:#16a34a}.r4k-dig3{background:#0ea5e9}.r4k-dig4{background:#8b5cf6}.r4k-dig5{background:#ec4899}
`;
const CLS = (d) => 'r4k-dig' + (d - 1);

export default {
  id: 'r4-kluis', name: 'Kluiskraker', emoji: '🔐', color: '#475569',
  desc: 'Kraak de geheime code met je goede antwoorden. Fout = alarm!',
  tags: ['denken', 'puzzel'], minutes: 5, duo: false,
  create(host, env) {
    const B = base(host, env, { id: 'r4-kluis', css: CSS, cls: 'r4k' });
    const G = new VaultGame({ rand: env.rand, level: env.level, fx: B.fx });
    let entry = [], hintInfo = [], goodSinceHint = 0, phase = 'ask';
    const dig = (d, cls = '') => `<span class="r4k-d ${d ? CLS(d) : 'e'} ${cls}">${d || ''}</span>`;
    function hud() { return `<div class="r4g-top"><span class="r4g-chip">${ic('lock', 22)} ${G.len} cijfers</span><span class="r4g-chip">${ic('bell', 22)} ${'●'.repeat(Math.max(0, G.alarms))}${'○'.repeat(Math.max(0, G.maxAlarms - G.alarms))}</span><span class="sp"></span><span class="r4g-chip">${ic('key', 22)} ${G.guesses.length}/${G.maxGuesses}</span></div>`; }
    function hintRow() {
      const slots = []; for (let i = 0; i < G.len; i++) slots.push(G.hints.has(i) ? dig(G.code[i]) : dig(0));
      return `<div class="r4k-row" style="margin:0 10px 6px;justify-content:center"><small>Bekende plekken:</small>${slots.join('')}</div>`;
    }
    function histHTML() {
      if (!G.guesses.length) return '<div class="r4k-hist"><small>Nog geen pogingen. Beantwoord een vraag goed om te raden!</small></div>';
      return '<div class="r4k-hist">' + G.guesses.map((x) => `<div class="r4k-row">${x.g.map((d) => dig(d)).join('')}<span class="r4k-fb">🎯${x.exact} · ↔${x.near}</span></div>`).join('') + '</div>';
    }
    function draw(extra) { B.ui.innerHTML = hud() + hintRow() + histHTML() + (extra || '<div class="r4g-q"></div>'); }
    function ask() {
      if (B.dead() || B.ended) return;
      phase = 'ask'; draw();
      B.ask(B.ui.querySelector('.r4g-q'), (res) => {
        if (res.ok) {
          B.snd('goed'); goodSinceHint++;
          if (goodSinceHint >= 3) { goodSinceHint = 0; const h = G.hint(); if (h) B.fly('Hint: plek ' + (h.i + 1) + ' is ' + h.d); }
          B.later(openPad, 350);
        } else {
          B.snd('fout'); const hit = G.wrongAnswer();
          B.fly(hit ? 'ALARM!' : 'Schild houdt het alarm stil', hit); draw();
          if (G.state === 'lost') B.later(finish, 800); else B.later(ask, 900);
        }
      }, { compact: true, label: 'Vraag voor een poging' });
    }
    function padHTML() {
      let h = '<div class="r4g-q" style="flex:0 0 auto;padding:0"><div class="r4k-row" style="justify-content:center;margin:6px 10px">';
      for (let i = 0; i < G.len; i++) h += dig(entry[i] || 0);
      h += '</div><div class="r4k-pad">';
      for (let d = 1; d <= DIGITS; d++) h += `<button class="${CLS(d)}" data-d="${d}" ${entry.includes(d) ? 'disabled' : ''}>${d}</button>`;
      h += `</div><div class="r4k-act"><button class="r4g-btn alt" data-clr="1">Wissen</button><button class="r4g-btn" data-ok="1" ${entry.length === G.len ? '' : 'disabled'}>Probeer!</button></div></div>`;
      return h;
    }
    function openPad() {
      if (B.dead() || B.ended) return;
      phase = 'pad'; entry = []; drawPad();
    }
    function drawPad() {
      draw(padHTML());
      for (const b of B.ui.querySelectorAll('button')) {
        b.addEventListener('click', () => {
          if (b.getAttribute && b.getAttribute('data-d')) { const d = +b.getAttribute('data-d'); if (entry.length < G.len && !entry.includes(d)) entry.push(d); drawPad(); }
          else if (b.getAttribute && b.getAttribute('data-clr')) { entry = []; drawPad(); }
          else if (b.getAttribute && b.getAttribute('data-ok')) submit();
        });
      }
    }
    function submit() {
      if (entry.length !== G.len) return;
      const r = G.guess(entry); entry = [];
      if (!r) return;
      B.snd(r.exact ? 'munt' : 'tik'); B.fly(r.exact === G.len ? 'GEKRAAKT!' : `${r.exact} op de goede plek, ${r.near} verkeerde plek`);
      draw();
      if (G.state !== 'play') B.later(finish, 900); else B.later(ask, 1300);
    }
    function finish() {
      const win = G.state === 'won';
      B.end(win, G.score(), win ? `Kluis gekraakt in ${G.guesses.length} pogingen!` : `De code was ${G.code.join(' ')}. Volgende keer lukt het!`);
    }
    B.intro({ icon: 'lock', emoji: '🔐', title: 'Kluiskraker', text: `Er is een geheime code van ${G.len} verschillende cijfers (1 tot 6). Elk goed antwoord geeft je een poging: je ziet hoeveel er goed staan en hoeveel er op de verkeerde plek staan. Maar ${G.maxAlarms} foute antwoorden zetten het alarm aan!` }, ask);
    return { destroy() { B.destroy(); } };
  },
};
