// Learn Spel 15: Poortvlucht. Vlieg door 5 luchten, ontwijk obstakels, pak sterren en beantwoord de vraag bij elke poort.
// Gebouwd uit tools/learn-stubs/src-c/vlieg.src.js (hulpjes ingebouwd).
//@HELPERS
const P = 'lvl';

export const STAGES = [
  { name: 'Zonnige ochtend', sky: ['#7dd3fc', '#e0f2fe'], speed: 150, gates: 3, gap: 1000, dens: 0.55, kinds: ['bird', 'balloon'] },
  { name: 'Gouden middag', sky: ['#fdba74', '#fef3c7'], speed: 165, gates: 4, gap: 980, dens: 0.65, kinds: ['bird', 'balloon', 'cloud'] },
  { name: 'Sterrennacht', sky: ['#1e1b4b', '#4338ca'], speed: 175, gates: 4, gap: 960, dens: 0.75, kinds: ['bird', 'cloud', 'kite'] },
  { name: 'Onweer', sky: ['#475569', '#94a3b8'], speed: 185, gates: 4, gap: 940, dens: 0.85, kinds: ['cloud', 'bolt', 'bird'] },
  { name: 'Ruimte', sky: ['#020617', '#312e81'], speed: 195, gates: 5, gap: 920, dens: 0.95, kinds: ['rock', 'ufo', 'bolt'] }
];
export const HANGAR = [
  { id: 'shield', emoji: '🛡', name: 'Schild', desc: 'Vangt 1 botsing op.', max: 9, cost: l => 8 + 2 * l },
  { id: 'heart', emoji: '❤️', name: 'Extra leven', desc: '+1 hartje.', max: 4, cost: l => 14 + 5 * l },
  { id: 'magnet', emoji: '🧲', name: 'Sterrenmagneet', desc: 'Pakt ook sterren op de banen ernaast.', max: 1, cost: () => 12 },
  { id: 'dbl', emoji: '💫', name: 'Meer sterren', desc: '+50% sterren.', max: 3, cost: l => 10 + 8 * l },
  { id: 'boost', emoji: '🚀', name: 'Turbo', desc: 'Langere turbo na een goede poort.', max: 3, cost: l => 9 + 6 * l },
  { id: 'calm', emoji: '🍃', name: 'Rustige lucht', desc: 'Vliegt 6% trager.', max: 3, cost: l => 10 + 6 * l }
];
const DM = { 1: 0.88, 2: 1, 3: 1.12 };
const RIVAL_T = { 1: 420, 2: 330, 3: 270 };

export class Flight {
  constructor(o = {}) {
    this.rand = o.rand || Math.random; this.fx = o.fx || {}; this.diff = o.level || 2;
    this.lives = 3 + Math.max(0, Math.round(this.fx.extraLives || 0)); this.shield = this.fx.shield ? 1 : 0;
    this.up = { shield: 0, heart: 0, magnet: 0, dbl: 0, boost: 0, calm: 0 };
    this.stars = Math.min(24, Math.round((this.fx.startCash || 0) / 5)); this.score = 0; this.streak = 0; this.best = 0;
    this.good = 0; this.bad = 0; this.hits = 0; this.starsTotal = 0; this.d = 0; this.lane = 1; this.laneF = 1; this.boost = 0; this.inv = 0; this.t = 0; this.stage = -1; this.state = 'play';
    this.startStage(0);
  }
  get mult() { return 1 + Math.min(this.streak, 10) * (0.1 + (this.fx.streakBonus || 0) * 0.5); }
  startStage(i) {
    this.stage = i; const S = this.S = STAGES[i]; this.d = 0; this.items = []; this.boost = 0; this.inv = 0; this.state = 'play'; this.gateIdx = 0;
    const r = this.rand; let x = 330;
    for (let k = 0; k < S.gates; k++) {
      const gx = (k + 1) * S.gap;
      while (x < gx - 260) {
        if (r() < S.dens) {
          const free = Math.floor(r() * 3), blocked = [0, 1, 2].filter(l => l !== free); const n = r() < 0.35 + 0.15 * i ? 2 : 1;
          const kind = S.kinds[Math.floor(r() * S.kinds.length)];
          (n === 2 ? blocked : [blocked[Math.floor(r() * 2)]]).forEach(l => this.items.push({ x, lane: l, kind: 'ob', ob: kind, hit: false }));
          if (r() < 0.8) for (let c = 0; c < 3; c++) this.items.push({ x: x + 70 + c * 38, lane: free, kind: 'coin', got: false });
        } else { const l = Math.floor(r() * 3); for (let c = 0; c < 4; c++) this.items.push({ x: x + c * 38, lane: l, kind: 'coin', got: false }); }
        x += 210 + r() * 70;
      }
      this.items.push({ x: gx, lane: 1, kind: 'gate', state: 'closed' }); x = gx + 300;
    }
    this.end = S.gates * S.gap + 380;
  }
  speed() { return this.S.speed * (DM[this.diff] || 1) * (this.boost > 0 ? 1.45 : 1) * (1 - 0.06 * this.up.calm); }
  move(dl) { this.lane = clamp(this.lane + dl, 0, 2); }
  addStars(n) { const g = Math.max(1, Math.round(n * (1 + 0.5 * this.up.dbl) * (this.fx.cashMult || 1))); this.stars += g; this.starsTotal += g; return g; }
  hurt(ev) {
    if (this.inv > 0) return; if (this.shield > 0) { this.shield--; this.inv = 1.2; ev.push('shield'); return; }
    this.lives--; this.hits++; this.streak = 0; this.inv = 1.8; ev.push('hurt'); if (this.lives <= 0) { this.state = 'over'; ev.push('over'); }
  }
  update(dt) {
    const ev = []; if (this.state !== 'play') return ev;
    this.t += dt; if (this.boost > 0) this.boost -= dt; if (this.inv > 0) this.inv -= dt;
    this.laneF += (this.lane - this.laneF) * Math.min(1, dt * 12); const prevD = this.d; this.d += this.speed() * dt;
    for (const it of this.items) {
      if (it.kind === 'gate') { if (it.state === 'closed' && prevD < it.x && this.d >= it.x) { this.d = it.x; this.state = 'ask'; this.cur = it; ev.push({ e: 'gate', it }); return ev; } continue; }
      if ((it.got || it.hit) || Math.abs(it.x - this.d) > 22) continue;
      const dl = Math.abs(this.laneF - it.lane);
      if (it.kind === 'coin') { if (dl < 0.55 || (this.up.magnet && dl < 1.55)) { it.got = true; const g = this.addStars(1); this.score += Math.round(5 * this.mult); ev.push({ e: 'coin', it, g }); } }
      else if (dl < 0.6 && this.boost <= 0) { it.hit = true; this.hurt(ev); ev.push({ e: 'bump', it }); if (this.state === 'over') return ev; }
    }
    if (this.d >= this.end) { this.state = 'hangar'; this.score += 100 * (this.stage + 1); ev.push('stage'); }
    return ev;
  }
  answer(ok) {
    const ev = []; if (this.state !== 'ask') return ev; this.state = 'play'; const it = this.cur;
    if (ok) { it.state = 'open'; this.streak++; if (this.streak > this.best) this.best = this.streak; this.good++; this.score += Math.round(100 * this.mult); this.addStars(3); this.boost = 2.2 + 1.3 * this.up.boost; this.inv = Math.max(this.inv, this.boost); ev.push('open'); }
    else { it.state = 'broken'; this.bad++; this.hurt(ev); this.streak = 0; ev.push('smash'); }
    this.d = it.x + 1; return ev;
  }
  offers() { const pool = HANGAR.filter(h => h.id === 'shield' || h.id === 'heart' || this.up[h.id] < h.max); const out = []; while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(this.rand() * pool.length), 1)[0]); return out; }
  priceOf(h) { return h.cost(this.up[h.id]); }
  buy(id) { const h = HANGAR.find(x => x.id === id); if (!h) return false; const lv = this.up[id]; if (id !== 'heart' && id !== 'shield' && lv >= h.max) return false; const c = h.cost(lv); if (this.stars < c) return false; this.stars -= c; this.up[id]++; if (id === 'heart') this.lives++; if (id === 'shield') this.shield++; return true; }
  nextStage() { if (this.state !== 'hangar') return; if (this.stage + 1 >= STAGES.length) { this.state = 'won'; return; } this.startStage(this.stage + 1); }
  progress() { return clamp((this.stage + clamp(this.d / this.end, 0, 1)) / STAGES.length, 0, 1); }
  rivalProgress() { return clamp((this.wall || 0) / (RIVAL_T[this.diff] || 330), 0, 1); }
}

const CSS = `
.${P}-cvw{flex:1;position:relative;min-height:0}
.${P}-cvw canvas{display:block;width:100%;touch-action:none}
.${P}-ctl{display:flex;gap:10px;justify-content:center;padding:6px}
.${P}-ctl button{flex:0 0 96px;border:0;border-radius:16px;font-size:26px;min-height:54px;background:rgba(127,127,127,.25);color:var(--ink);cursor:pointer}
.${P}-ctl button:active{background:var(--accent);color:#fff}
.${P}-race{height:12px;border-radius:6px;background:rgba(127,127,127,.25);position:relative;margin:0 14px 2px}
.${P}-race b{position:absolute;top:-6px;font-size:14px;transition:left .3s linear}`;

export default {
  id: 'vlieg', name: 'Poortvlucht', emoji: '✈️', color: '#0ea5e9',
  desc: 'Vlieg omhoog en omlaag langs obstakels en beantwoord bij elke poort de vraag om erdoorheen te komen.',
  tags: ['snel', 'race', 'solo'], minutes: 5, duo: false,
  create(host, env) {
    const L = lifecycle(); const style = css(baseCss(P) + CSS); host.textContent = '';
    const { W, H } = dims(host, env); const root = $('div', P + '-root'); root.style.height = H + 'px'; host.appendChild(root);
    const hud = $('div', P + '-hud'); const chip = {}; ['stage', 'life', 'star', 'score', 'mult'].forEach(k => { chip[k] = $('span', P + '-chip'); hud.appendChild(chip[k]); });
    const race = $('div', P + '-race'); const me = $('b', '', '✈️'), riv = $('b', '', '🛩'); race.append(riv, me);
    const cvw = $('div', P + '-cvw'); const cv = $('canvas'); cvw.appendChild(cv);
    const ctl = $('div', P + '-ctl'); const bu = $('button', '', '▲'), bd = $('button', '', '▼'); ctl.append(bu, bd);
    root.append(hud, race, cvw, ctl);
    const cw = W, ch = Math.max(200, H - 44 - 18 - 66); const ctx = fit(cv, cw, ch);
    const ov = mkOv(root, P); const asker = makeAsker(env, ov, P, L); const nextQ = qsupply(env); const S = mkStats();
    const g = new Flight({ rand: env.rand || Math.random, fx: env.fx, level: env.level });
    let started = false, ended = false, parts = [], shake = 0, time = 0, bg = [], gateFlash = 0;
    for (let i = 0; i < 18; i++) bg.push({ x: Math.random() * cw, y: Math.random() * ch * .8, s: .4 + Math.random() * 1.2 });
    const laneY = (l) => ch * (0.22 + 0.28 * l); const px = cw * 0.22;
    bu.onclick = () => g.move(-1); bd.onclick = () => g.move(1);
    L.on(document, 'keydown', e => { const k = e.key; if (k === 'ArrowUp' || k === 'w') g.move(-1); else if (k === 'ArrowDown' || k === 's') g.move(1); });
    let sy = 0; L.on(cv, 'touchstart', e => { sy = e.touches[0].clientY; }, { passive: true });
    L.on(cv, 'touchend', e => { const dy = e.changedTouches[0].clientY - sy; if (Math.abs(dy) > 18) g.move(Math.sign(dy)); }, { passive: true });
    L.on(cv, 'pointerdown', e => { if (e.pointerType === 'touch') return; const r = cv.getBoundingClientRect(); g.move((e.clientY - r.top) < laneY(g.lane) ? -1 : 1); });
    const upd = () => {
      chip.stage.textContent = '☁️ ' + (g.stage + 1) + '/' + STAGES.length; chip.life.textContent = '❤️ ' + g.lives + (g.shield ? ' 🛡' + g.shield : ''); chip.star.textContent = '⭐ ' + g.stars;
      chip.score.textContent = '🏆 ' + fmtN(g.score); chip.mult.textContent = '🔥 ×' + g.mult.toFixed(1);
      me.style.left = 'calc(' + (g.progress() * 100) + '% - 8px)'; riv.style.left = 'calc(' + (g.rivalProgress() * 100) + '% - 8px)';
    };
    const finish = (win, why) => {
      if (ended) return; ended = true; const rank = g.progress() >= g.rivalProgress() ? 1 : 2; const bonus = win && rank === 1 ? 300 : 0;
      env.end({ score: Math.round(g.score + bonus), win: !!win, stats: { correct: S.correct, wrong: S.wrong, best: S.best, sterren: g.starsTotal, botsingen: g.hits, positie: win ? rank : null }, summary: why + (win ? (rank === 1 ? ' Je won van Piet de Piloot! +300' : ' Piet de Piloot was net sneller.') : '') });
    };
    const burst = (x, y, col, n) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 40 + Math.random() * 120; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .6, col }); } };
    const shopUI = () => {
      snd(env, 'level'); const wrap = $('div'); const st = $('p'); const row = $('div', P + '-row'); let offers = g.offers();
      const draw = () => { st.textContent = '⭐ ' + g.stars + ' sterren'; row.textContent = ''; offers.forEach(it => { const c = $('div', P + '-shopi'); const pr = g.priceOf(it); c.append($('div', P + '-big', it.emoji), $('b', '', it.name), $('small', '', it.desc)); const b = $('button', P + '-btn', '⭐ ' + pr); b.disabled = g.stars < pr || (it.id !== 'heart' && it.id !== 'shield' && g.up[it.id] >= it.max); b.onclick = () => { if (g.buy(it.id)) { snd(env, 'munt'); draw(); upd(); } }; c.appendChild(b); row.appendChild(c); }); };
      draw(); wrap.append(st, row); const last = g.stage + 1 >= STAGES.length;
      ov.show(card(P, { emoji: '🛬', title: 'Hangar - ' + STAGES[g.stage].name + ' gehaald!', text: last ? 'Laatste lucht gehaald!' : 'Koop upgrades voor je vliegtuig.', extra: wrap, btn: last ? 'Landen 🏆' : 'Volgende lucht ▶', onBtn: () => { ov.hide(); g.nextStage(); if (g.state === 'won') { finish(true, 'Alle luchten gehaald!'); return; } upd(); } }));
    };
    const handle = async (evs) => {
      for (const e of evs) {
        const t = typeof e === 'string' ? e : e.e;
        if (t === 'coin') { snd(env, 'tik'); burst(px + (e.it.x - g.d), laneY(e.it.lane), '#facc15', 5); }
        else if (t === 'bump' || t === 'hurt') { snd(env, 'fout'); shake = .4; }
        else if (t === 'shield') { snd(env, 'power'); shake = .2; }
        else if (t === 'stage') shopUI();
        else if (t === 'over') { snd(env, 'lose'); L.after(() => finish(false, 'Neergestort in de ' + STAGES[g.stage].name.toLowerCase() + '.'), 700); }
        else if (t === 'gate') {
          snd(env, 'power'); const r = await asker.ask(nextQ(g.stage > 2 ? 3 : g.stage > 0 ? 2 : 1), { time: 0 }); if (L.dead) return;
          S.mark(r.ok); const res = g.answer(!!r.ok); snd(env, r.ok ? 'goed' : 'fout'); gateFlash = 1; if (r.ok) burst(px + 40, laneY(1), '#fde047', 24); else shake = .5;
          upd(); await handle(res);
        }
      }
      upd();
    };
    const drawObj = (c, o, x, y) => {
      c.save(); c.translate(x, y);
      if (o.ob === 'cloud' || o.ob === 'bolt') { c.fillStyle = o.ob === 'bolt' ? '#334155' : '#e2e8f0'; [[-14, 4, 13], [0, -4, 16], [15, 4, 13]].forEach(([a, b, r]) => { c.beginPath(); c.arc(a, b, r, 0, 6.3); c.fill(); }); if (o.ob === 'bolt') { c.fillStyle = '#facc15'; c.beginPath(); c.moveTo(-2, 8); c.lineTo(8, 8); c.lineTo(0, 26); c.lineTo(3, 14); c.lineTo(-5, 14); c.closePath(); c.fill(); } }
      else { c.font = '34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText({ bird: '🐦', balloon: '🎈', kite: '🪁', rock: '☄️', ufo: '🛸' }[o.ob] || '☁️', 0, 0); }
      c.restore();
    };
    const draw = (dt) => {
      const c = ctx, S0 = g.S, t = time; c.save(); if (shake > 0) { shake -= dt; c.translate((Math.random() - .5) * 8, (Math.random() - .5) * 8); }
      const gr = c.createLinearGradient(0, 0, 0, ch); gr.addColorStop(0, S0.sky[0]); gr.addColorStop(1, S0.sky[1]); c.fillStyle = gr; c.fillRect(-10, -10, cw + 20, ch + 20);
      const spd = g.state === 'play' ? g.speed() : 0; const night = g.stage === 2 || g.stage === 4;
      bg.forEach(b => { b.x -= spd * dt * b.s * .35; if (b.x < -60) { b.x = cw + 40; b.y = Math.random() * ch * .85; } if (night) { c.fillStyle = 'rgba(255,255,255,' + (.4 + .3 * Math.sin(t * 3 + b.y)) + ')'; c.beginPath(); c.arc(b.x, b.y, 1 + b.s, 0, 6.3); c.fill(); } else { c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(b.x, b.y, 26 * b.s, 9 * b.s, 0, 0, 6.3); c.fill(); } });
      c.fillStyle = night ? 'rgba(15,23,42,.5)' : 'rgba(34,120,70,.35)'; c.beginPath(); c.moveTo(0, ch); for (let x = 0; x <= cw; x += 20) c.lineTo(x, ch - 26 - 18 * Math.sin((x + g.d * .4) / 70) - 10 * Math.sin((x + g.d * .4) / 25)); c.lineTo(cw, ch); c.fill();
      for (let l = 0; l < 3; l++) { c.strokeStyle = 'rgba(255,255,255,.14)'; c.setLineDash([10, 14]); c.lineWidth = 2; c.beginPath(); c.moveTo(0, laneY(l)); c.lineTo(cw, laneY(l)); c.stroke(); c.setLineDash([]); }
      for (const it of g.items) {
        const x = px + (it.x - g.d); if (x < -60 || x > cw + 60) continue; const y = laneY(it.lane);
        if (it.kind === 'coin') { if (it.got) continue; c.fillStyle = '#facc15'; c.beginPath(); c.arc(x, y, 9 + Math.sin(t * 8 + it.x) * 1.2, 0, 6.3); c.fill(); c.fillStyle = '#fef08a'; c.beginPath(); c.arc(x - 2, y - 2, 4, 0, 6.3); c.fill(); }
        else if (it.kind === 'ob') { if (!it.hit) drawObj(c, it, x, y); }
        else { const gy = ch * .5, gh = ch * .8, open = it.state === 'open', brk = it.state === 'broken';
          c.fillStyle = brk ? '#78716c' : open ? '#22c55e' : '#f97316'; c.fillRect(x - 6, gy - gh / 2, 12, gh * (brk ? .35 : 1)); c.fillRect(x - 6, gy + gh / 2 - (brk ? gh * .35 : 0), 12, brk ? gh * .35 : 0);
          if (!open && !brk) { c.fillStyle = 'rgba(249,115,22,.28)'; c.fillRect(x - 40, gy - gh / 2, 80, gh); c.fillStyle = '#fff'; c.font = 'bold 40px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('❓', x, gy); }
          if (open) { c.strokeStyle = 'rgba(253,224,71,' + clamp(gateFlash, 0, 1) + ')'; c.lineWidth = 6; c.beginPath(); c.arc(x, gy, gh / 2 * (1.2 - gateFlash * .2), 0, 6.3); c.stroke(); } }
      }
      gateFlash = Math.max(0, gateFlash - dt * .8);
      const py = laneY(g.laneF); const blink = g.inv > 0 && Math.floor(t * 12) % 2 === 0 && g.boost <= 0;
      c.save(); c.translate(px, py); c.rotate((g.lane - g.laneF) * -.35); c.globalAlpha = blink ? .35 : 1;
      if (g.boost > 0) { c.fillStyle = 'rgba(253,224,71,.7)'; c.beginPath(); c.moveTo(-26, 0); c.lineTo(-62 - Math.random() * 14, -6); c.lineTo(-62 - Math.random() * 14, 6); c.fill(); }
      c.fillStyle = '#ef4444'; c.beginPath(); c.ellipse(0, 0, 30, 11, 0, 0, 6.3); c.fill(); c.fillStyle = '#f87171'; c.beginPath(); c.ellipse(4, -3, 18, 5, 0, 0, 6.3); c.fill();
      c.fillStyle = '#bae6fd'; c.beginPath(); c.ellipse(8, -6, 8, 5, 0, 0, 6.3); c.fill();
      c.fillStyle = '#b91c1c'; c.beginPath(); c.moveTo(-8, 2); c.lineTo(-22, 22); c.lineTo(6, 4); c.fill(); c.beginPath(); c.moveTo(-24, -2); c.lineTo(-32, -14); c.lineTo(-14, -2); c.fill();
      c.strokeStyle = '#e5e7eb'; c.lineWidth = 3; const pr = Math.sin(t * 40) * 11; c.beginPath(); c.moveTo(31, -pr); c.lineTo(31, pr); c.stroke();
      if (g.shield) { c.strokeStyle = 'rgba(59,130,246,.85)'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, 40, 24, 0, 0, 6.3); c.stroke(); }
      c.restore();
      for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) { parts.splice(i, 1); continue; } c.globalAlpha = clamp(q.life * 1.7, 0, 1); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, 3, 0, 6.3); c.fill(); c.globalAlpha = 1; }
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 0, cw * clamp(g.d / g.end, 0, 1), 4);
      c.restore();
    };
    loop(L, host, (dt) => {
      time += dt; if (started && g.state !== 'over' && g.state !== 'won') g.wall = (g.wall || 0) + dt;
      if (started && g.state === 'play' && !ov.shown) { const ev = g.update(dt); if (ev.length) handle(ev); else if (Math.floor(time * 4) !== Math.floor((time - dt) * 4)) upd(); }
      draw(dt);
    });
    upd();
    ov.show(card(P, { emoji: '✈️', title: 'Poortvlucht', text: 'Wissel van baan met ▲ ▼ (of zwiep). Pak ⭐, ontwijk obstakels. Bij elke ❓-poort beantwoord je een vraag om erdoorheen te vliegen.', btn: 'Tik om te beginnen', onBtn: () => { ov.hide(); started = true; snd(env, 'klik'); } }));
    return { destroy() { asker.cancel(); L.kill(); try { style.remove(); } catch (e) {} host.textContent = ''; } };
  }
};
