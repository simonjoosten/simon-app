// Lavarivier: spring van steen naar steen voordat de lava je inhaalt. Goed antwoord = springen (reeks = dubbele sprong), fout = lava versnelt.
import { base, ic, clamp } from '../r4-ui.js?v=1';

export const STONES = 14;
export const GEMS = [3, 6, 9, 12];
export class LavaGame {
  constructor(o = {}) {
    this.rand = o.rand || Math.random; this.level = o.level || 2; this.fx = o.fx || {};
    this.secPerStone = (this.level === 1 ? 13 : this.level === 2 ? 10 : 8) + (this.fx.timeBonus || 0) * 0.15;
    this.pos = 0; this.lava = -3; this.score = 0; this.gems = new Set(); this.shield = this.fx.shield | 0; this.streak = 0; this.state = 'play'; this.jumps = 0; this.t = 0;
  }
  tick(dt) {
    if (this.state !== 'play') return;
    this.t += dt; this.lava += dt / this.secPerStone;
    if (this.lava >= this.pos) { if (this.shield > 0) { this.shield--; this.lava = this.pos - 2.2; this.shieldUsed = true; } else this.state = 'lost'; }
  }
  answer(ok) {
    if (this.state !== 'play') return { ev: [] };
    const ev = [];
    if (ok) {
      this.streak++; const n = this.streak > 0 && this.streak % 3 === 0 ? 2 : 1;
      for (let i = 0; i < n; i++) { this.pos++; this.jumps++; if (GEMS.includes(this.pos) && !this.gems.has(this.pos)) { this.gems.add(this.pos); this.score += 60; ev.push({ e: 'gem' }); } }
      this.score += 10 * n; ev.push({ e: n === 2 ? 'double' : 'jump' });
      this.lava = Math.min(this.lava, this.pos - 1.2 + 0.0);
      if (this.pos >= STONES) { this.pos = STONES; this.state = 'won'; }
    } else {
      this.streak = 0; this.lava += 1.0; ev.push({ e: 'hot' });
      if (this.lava >= this.pos) { if (this.shield > 0) { this.shield--; this.lava = this.pos - 2.2; ev.push({ e: 'shield' }); } else this.state = 'lost'; }
    }
    return { ev };
  }
  finalScore() { return Math.round(this.score + this.pos * 12 + (this.state === 'won' ? 300 + Math.max(0, 200 - this.t) : 0)); }
}

const CSS = `
.r4v-track{display:flex;align-items:flex-end;margin:0 10px;padding:6px 4px 4px;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.25));border-radius:16px;position:relative;overflow:hidden;height:88px;box-shadow:0 4px 14px rgba(0,0,0,.3)}
.r4v-lavab{position:absolute;left:0;bottom:0;top:0;background:linear-gradient(90deg,#7f1d1d,#ea580c 70%,#fbbf24);opacity:.92;border-radius:16px 0 0 16px;transition:width .25s linear}
.r4v-s{position:relative;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;z-index:1;min-width:0}
.r4v-s b{display:block;width:90%;height:14px;border-radius:7px;background:#94a3b8;box-shadow:inset 0 -4px 0 rgba(0,0,0,.25)}
.r4v-s.me b{background:#22c55e}
.r4v-s .tk{height:34px;display:flex;align-items:flex-end}
.r4v-s .tk i{animation:r4gPop .3s}
.r4v-end b{background:#facc15}
`;

export default {
  id: 'r4-lava', name: 'Lavarivier', emoji: '🌋', color: '#ea580c',
  desc: 'Spring van steen naar steen voor de lava je inhaalt. Een reeks geeft dubbele sprongen!',
  tags: ['snel', 'race'], minutes: 4, duo: false,
  create(host, env) {
    const B = base(host, env, { id: 'r4-lava', css: CSS, cls: 'r4v' });
    const G = new LavaGame({ rand: env.rand, level: env.level, fx: B.fx });
    let trackEl = null, hudEl = null, qEl = null;
    function trackHTML() {
      let h = `<div class="r4v-lavab" style="width:${clamp(((G.lava + 3) / (STONES + 3)) * 100, 0, 100).toFixed(1)}%"></div>`;
      for (let i = 0; i <= STONES; i++) {
        const me = i === G.pos;
        h += `<div class="r4v-s${me ? ' me' : ''}${i === STONES ? ' r4v-end' : ''}"><span class="tk">${me ? `<i>${ic('fox', 34)}</i>` : i === STONES ? ic('flag', 28) : GEMS.includes(i) && !G.gems.has(i) ? ic('gem', 24) : ''}</span><b></b></div>`;
      }
      return h;
    }
    function paint() {
      if (trackEl) trackEl.innerHTML = trackHTML();
      if (hudEl) hudEl.innerHTML = `<span class="r4g-chip">${ic('star', 22)} ${G.score}</span><span class="r4g-chip">${ic('flame', 22)} ${Math.max(0, Math.round(G.pos - G.lava))} stenen</span><span class="sp"></span><span class="r4g-chip">${ic('flame', 20)} ${G.streak}${G.shield ? ' ' + ic('shield', 20) : ''}</span>`;
    }
    function start() {
      B.ui.innerHTML = '<div class="r4g-top"></div><div class="r4v-track"></div><div class="r4g-q"></div>';
      hudEl = B.ui.querySelector('.r4g-top'); trackEl = B.ui.querySelector('.r4v-track'); qEl = B.ui.querySelector('.r4g-q');
      paint();
      B.tick(() => { G.tick(0.25); paint(); if (G.state !== 'play') finish(); }, 250);
      ask();
    }
    function ask() {
      if (B.dead() || B.ended || G.state !== 'play') return;
      B.ask(qEl, (res) => {
        const r = G.answer(res.ok); B.snd(res.ok ? 'goed' : 'fout');
        for (const e of r.ev) {
          if (e.e === 'jump') B.fly('Sprong!'); else if (e.e === 'double') B.fly('Dubbele sprong!'); else if (e.e === 'gem') { B.fly('+60 edelsteen'); B.snd('munt'); }
          else if (e.e === 'hot') B.fly('Lava komt dichterbij!', true); else if (e.e === 'shield') B.fly('Schild!');
        }
        paint();
        if (G.state !== 'play') { finish(); return; }
        B.later(ask, 250);
      }, { compact: true, autoNext: 600, label: 'Spring!' });
    }
    function finish() {
      if (B.ended) return;
      const win = G.state === 'won';
      B.end(win, G.finalScore(), win ? `Over de lavarivier na ${G.jumps} sprongen!` : `Je kwam tot steen ${G.pos} van ${STONES}. De lava was sneller.`);
    }
    B.intro({ icon: 'volcano', emoji: '🌋', title: 'Lavarivier', text: `De lava komt eraan! Beantwoord vragen om van steen naar steen te springen tot de vlag (${STONES}). Elke 3e goede antwoord achter elkaar is een dubbele sprong. Een fout antwoord laat de lava naderen.` }, start);
    return { destroy() { B.destroy(); } };
  },
};
