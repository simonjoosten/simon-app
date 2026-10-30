// Learn Spel 13: Slimme slang. Eet appels, pak 🎁 vraagblokken, koop upgrades tussen de levels.
// Gebouwd uit tools/learn-stubs/src-c/slang.src.js (hulpjes ingebouwd).
//@HELPERS
const P = 'lsl';

export const LEVELS = [
  { cols: 11, rows: 11, wrap: true, obs: 0, goal: 5, tick: 200 },
  { cols: 12, rows: 12, wrap: true, obs: 0, goal: 7, tick: 180 },
  { cols: 12, rows: 12, wrap: false, obs: 3, goal: 8, tick: 170 },
  { cols: 13, rows: 13, wrap: false, obs: 6, goal: 10, tick: 155 },
  { cols: 13, rows: 13, wrap: false, obs: 9, goal: 12, tick: 142 }
];
export const SHOP = [
  { id: 'slow', emoji: '🐢', name: 'Rustig tempo', desc: 'Slang gaat iets trager.', max: 3, cost: l => 8 + 5 * l },
  { id: 'magnet', emoji: '🧲', name: 'Magneet', desc: 'Appels komen naar je toe.', max: 2, cost: l => 10 + 8 * l },
  { id: 'heart', emoji: '❤️', name: 'Extra leven', desc: '+1 leven.', max: 4, cost: l => 12 + 4 * l },
  { id: 'ghost', emoji: '👻', name: 'Spookstaart', desc: 'Na een 🎁 kun je door jezelf heen.', max: 2, cost: l => 14 + 8 * l },
  { id: 'dbl', emoji: '✨', name: 'Dubbele punten', desc: '+50% punten.', max: 3, cost: l => 10 + 6 * l },
  { id: 'shield', emoji: '🛡', name: 'Schild', desc: 'Vangt één botsing op.', max: 9, cost: l => 9 + 2 * l }
];
const DIFF_MUL = { 1: 1.22, 2: 1, 3: 0.84 };

export class SnakeGame {
  constructor(o) {
    this.rand = o.rand || Math.random; this.fx = o.fx || {}; this.diff = o.level || 2;
    this.up = { slow: 0, magnet: 0, ghost: 0, dbl: 0, heart: 0, shield: 0 };
    this.lives = 3 + Math.max(0, Math.round(this.fx.extraLives || 0));
    this.shield = this.fx.shield ? 1 : 0;
    this.gems = Math.min(30, Math.round((this.fx.startCash || 0) / 5));
    this.score = 0; this.streak = 0; this.best = 0; this.lvIdx = 0; this.totalApples = 0; this.gatesOk = 0; this.gatesBad = 0;
    this.ghostT = 0; this.slowT = 0; this.inv = 0; this.ticks = 0; this.state = 'play';
    this.startLevel(0);
  }
  get mult() { return 1 + Math.min(this.streak, 10) * (0.1 + (this.fx.streakBonus || 0) * 0.5); }
  startLevel(i) {
    const L = this.L = LEVELS[i]; this.lvIdx = i; this.cols = L.cols; this.rows = L.rows; this.wrap = L.wrap;
    this.apples = 0; this.gate = null; this.apple = null; this.obst = [];
    const cx = this.cols >> 1, cy = this.rows >> 1;
    this.snake = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }]; this.dir = { x: 1, y: 0 }; this.nd = { x: 1, y: 0 }; this.grow = 0;
    let n = L.obs, guard = 500;
    while (n > 0 && guard-- > 0) {
      const x = Math.floor(this.rand() * this.cols), y = Math.floor(this.rand() * this.rows);
      if (Math.abs(x - cx) < 4 && Math.abs(y - cy) < 4) continue;
      if (this.obst.some(o => o.x === x && o.y === y)) continue;
      this.obst.push({ x, y }); n--;
    }
    this.apple = this.randFree();
  }
  hit(x, y, skipTail) {
    if (this.obst.some(o => o.x === x && o.y === y)) return 'rock';
    const n = this.snake.length - (skipTail ? 1 : 0);
    for (let i = 0; i < n; i++) if (this.snake[i].x === x && this.snake[i].y === y) return 'self';
    return null;
  }
  randFree() {
    for (let k = 0; k < 400; k++) {
      const x = Math.floor(this.rand() * this.cols), y = Math.floor(this.rand() * this.rows);
      if (this.hit(x, y)) continue;
      if (this.apple && this.apple.x === x && this.apple.y === y) continue;
      if (this.gate && this.gate.x === x && this.gate.y === y) continue;
      return { x, y };
    }
    for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) if (!this.hit(x, y)) return { x, y };
    return { x: 0, y: 0 };
  }
  setDir(dx, dy) { if (dx === -this.dir.x && dy === -this.dir.y) return; this.nd = { x: dx, y: dy }; }
  tickMs() { return this.L.tick * (DIFF_MUL[this.diff] || 1) * (1 + 0.12 * this.up.slow) * (this.slowT > 0 ? 1.3 : 1); }
  gain(base) { return Math.round(base * this.mult * (1 + 0.5 * this.up.dbl)); }
  addGems(n) { this.gems += Math.max(1, Math.round(n * (this.fx.cashMult || 1))); }
  crash(ev) {
    if (this.shield > 0) {
      this.shield--; ev.push('shield');
      for (const d of [{ x: -this.dir.y, y: this.dir.x }, { x: this.dir.y, y: -this.dir.x }]) {
        const nx = this.snake[0].x + d.x, ny = this.snake[0].y + d.y;
        if (nx >= 0 && ny >= 0 && nx < this.cols && ny < this.rows && !this.hit(nx, ny, true)) { this.nd = d; this.dir = d; break; }
      }
      return;
    }
    this.lives--; this.streak = 0; ev.push('crash');
    if (this.lives <= 0) { this.state = 'over'; ev.push('over'); return; }
    const cx = this.cols >> 1, cy = this.rows >> 1, len = Math.max(3, Math.min(this.snake.length - 2, 8));
    this.snake = []; for (let i = 0; i < len; i++) this.snake.push({ x: clamp(cx - i, 0, this.cols - 1), y: cy });
    this.snake = this.snake.filter((s, i, a) => a.findIndex(t => t.x === s.x && t.y === s.y) === i);
    this.dir = { x: 1, y: 0 }; this.nd = { x: 1, y: 0 }; this.grow = 0; this.inv = 14;
    this.obst = this.obst.filter(o => Math.abs(o.x - cx) > 1 || Math.abs(o.y - cy) > 1);
  }
  step() {
    const ev = []; if (this.state !== 'play') return ev;
    this.ticks++; this.dir = this.nd; const h = this.snake[0];
    let x = h.x + this.dir.x, y = h.y + this.dir.y;
    if (this.wrap) { x = (x + this.cols) % this.cols; y = (y + this.rows) % this.rows; }
    if (this.ghostT > 0) this.ghostT--; if (this.slowT > 0) this.slowT--; const wasInv = this.inv > 0; if (this.inv > 0) this.inv--;
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) { if (wasInv) { x = clamp(x, 0, this.cols - 1); y = clamp(y, 0, this.rows - 1); } else { this.crash(ev); return ev; } }
    const k = this.hit(x, y, this.grow <= 0);
    if (k && !wasInv && !(k === 'self' && this.ghostT > 0)) { this.crash(ev); return ev; }
    if (k === 'rock' && wasInv) this.obst = this.obst.filter(o => o.x !== x || o.y !== y);
    this.snake.unshift({ x, y }); if (this.grow > 0) this.grow--; else this.snake.pop();
    if (this.up.magnet > 0 && this.apple) {
      const d = Math.abs(this.apple.x - x) + Math.abs(this.apple.y - y);
      if (d <= 1 + this.up.magnet && d > 0) { const ax = this.apple.x, ay = this.apple.y; this.apple = { x: ax + Math.sign(x - ax) * (Math.abs(x - ax) >= Math.abs(y - ay) ? 1 : 0), y: ay + Math.sign(y - ay) * (Math.abs(x - ax) < Math.abs(y - ay) ? 1 : 0) }; }
    }
    if (this.apple && this.apple.x === x && this.apple.y === y) {
      const g = this.gain(10); this.score += g; this.addGems(1); this.grow++; this.apples++; this.totalApples++; ev.push({ e: 'apple', x, y, g });
      this.apple = null; this.apple = this.randFree();
      if (this.apples % 3 === 0 && !this.gate && this.apples < this.L.goal) { const p = this.randFree(); this.gate = { x: p.x, y: p.y, ttl: 100 }; ev.push('gatespawn'); }
      if (this.apples >= this.L.goal) this.levelDone(ev);
    } else if (this.gate && this.gate.x === x && this.gate.y === y) {
      this.gate = null; this.state = 'ask'; ev.push({ e: 'gate', x, y });
    }
    if (this.gate && this.state === 'play') { this.gate.ttl--; if (this.gate.ttl <= 0) { this.gate = null; ev.push('gateend'); } }
    return ev;
  }
  levelDone(ev) { this.gate = null; this.state = 'shop'; this.score += 40 * (this.lvIdx + 1); ev.push('level'); }
  answer(ok) {
    const ev = [];
    if (this.state !== 'ask') return ev;
    this.state = 'play';
    if (ok) {
      this.streak++; if (this.streak > this.best) this.best = this.streak; this.gatesOk++;
      const g = this.gain(50); this.score += g; this.addGems(3); this.grow += 3; this.apples += 2; this.totalApples += 2;
      this.ghostT = this.up.ghost * 45; this.slowT = 60; ev.push({ e: 'good', g });
      if (this.apples >= this.L.goal) this.levelDone(ev);
    } else {
      this.streak = 0; this.gatesBad++; const cut = Math.min(2, this.snake.length - 3); for (let i = 0; i < cut; i++) this.snake.pop(); ev.push('bad');
    }
    return ev;
  }
  offers() {
    const av = SHOP.filter(s => s.id === 'heart' || s.id === 'shield' || this.up[s.id] < s.max);
    const out = []; const pool = av.slice();
    while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(this.rand() * pool.length), 1)[0]);
    return out;
  }
  priceOf(it) { return it.cost(this.up[it.id] || 0); }
  buy(id) {
    const it = SHOP.find(s => s.id === id); if (!it) return false;
    const lv = this.up[id] || 0; if (id !== 'heart' && id !== 'shield' && lv >= it.max) return false;
    const c = it.cost(lv); if (this.gems < c) return false;
    this.gems -= c; this.up[id] = lv + 1;
    if (id === 'heart') this.lives++; if (id === 'shield') this.shield++;
    return true;
  }
  nextLevel() { if (this.state !== 'shop') return; if (this.lvIdx + 1 >= LEVELS.length) { this.state = 'won'; return; } this.state = 'play'; this.startLevel(this.lvIdx + 1); }
}

const CSS = `
.${P}-cvw{flex:1;display:flex;align-items:center;justify-content:center;min-height:0}
.${P}-cvw canvas{border-radius:12px;touch-action:none;background:#14532d}
.${P}-pad{display:grid;grid-template-columns:repeat(3,64px);grid-template-rows:repeat(2,52px);gap:6px;justify-content:center;padding:6px 0 10px}
.${P}-pad button{border:0;border-radius:14px;background:rgba(127,127,127,.25);color:var(--ink);font-size:22px;cursor:pointer}
.${P}-pad button:active{background:var(--accent);color:#fff}
@media (hover:hover) and (min-width:900px){.${P}-pad{display:none}}`;

export default {
  id: 'slang', name: 'Slimme slang', emoji: '🐍', color: '#16a34a',
  desc: 'Eet appels, pak de 🎁 vraagblokken en overleef 5 levels vol rotsen.',
  tags: ['snel', 'solo', 'geld'], minutes: 5, duo: false,
  create(host, env) {
    const L = lifecycle(); const style = css(baseCss(P) + CSS);
    host.textContent = '';
    const { W, H } = dims(host, env);
    const root = $('div', P + '-root'); root.style.height = H + 'px'; host.appendChild(root);
    const hud = $('div', P + '-hud'); const cvw = $('div', P + '-cvw'); const cv = $('canvas'); cvw.appendChild(cv);
    const pad = $('div', P + '-pad'); root.append(hud, cvw, pad);
    const ov = mkOv(root, P); const asker = makeAsker(env, ov, P, L); const nextQ = qsupply(env); const S = mkStats();
    const side = Math.floor(Math.min(W - 8, H - 56 - 122)); const ctx = fit(cv, side, side);
    const g = new SnakeGame({ rand: env.rand || Math.random, fx: env.fx, level: env.level });
    let acc = 0, started = false, ended = false, prev = g.snake.map(s => ({ x: s.x, y: s.y })), parts = [], shake = 0, elapsed = 0, ringT = 0;
    const dirs = { '←': [-1, 0], '↑': [0, -1], '↓': [0, 1], '→': [1, 0] };
    [null, '↑', null, '←', '↓', '→'].forEach(k => { const b = $('button', '', k || ''); if (k) { b.onclick = () => g.setDir(...dirs[k]); } else b.style.visibility = 'hidden'; pad.appendChild(b); });
    const chips = {}; ['lv', 'life', 'apple', 'gem', 'score', 'mult'].forEach(k => { chips[k] = $('span', P + '-chip'); hud.appendChild(chips[k]); });
    const upd = () => {
      chips.lv.textContent = '🏁 ' + (g.lvIdx + 1) + '/' + LEVELS.length; chips.life.textContent = '❤️ ' + g.lives + (g.shield ? ' 🛡' + g.shield : '');
      chips.apple.textContent = '🍎 ' + g.apples + '/' + g.L.goal; chips.gem.textContent = '💎 ' + g.gems; chips.score.textContent = '⭐ ' + fmtN(g.score);
      chips.mult.textContent = '🔥 ×' + g.mult.toFixed(1);
    };
    const finish = (win, why) => {
      if (ended) return; ended = true;
      env.end({ score: Math.round(g.score), win: !!win, stats: { correct: S.correct, wrong: S.wrong, best: S.best, appels: g.totalApples, level: g.lvIdx + (win ? 1 : 0) }, summary: why });
    };
    const key = (e) => { const m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1] }[e.key]; if (m) { g.setDir(...m); if (e.preventDefault) e.preventDefault(); } };
    L.on(document, 'keydown', key);
    let tx = 0, ty = 0;
    L.on(cv, 'touchstart', e => { const t = e.touches[0]; tx = t.clientX; ty = t.clientY; }, { passive: true });
    L.on(cv, 'touchend', e => { const t = e.changedTouches[0]; const dx = t.clientX - tx, dy = t.clientY - ty; if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return; if (Math.abs(dx) > Math.abs(dy)) g.setDir(Math.sign(dx), 0); else g.setDir(0, Math.sign(dy)); }, { passive: true });
    const burst = (x, y, col, n, txt) => { const cs = side / g.cols; for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 40 + Math.random() * 90; parts.push({ x: (x + .5) * cs, y: (y + .5) * cs, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .6, col }); } if (txt) parts.push({ x: (x + .5) * cs, y: (y + .5) * cs, vx: 0, vy: -40, life: 1, txt }); };
    const showShop = () => {
      snd(env, 'level');
      const wrap = $('div'); const gem = $('p', '', ''); const row = $('div', P + '-row');
      const refresh = () => { gem.textContent = '💎 ' + g.gems + ' gems'; row.textContent = ''; g.offers_ = g.offers_ || g.offers(); g.offers_.forEach(it => { const c = $('div', P + '-shopi'); const price = g.priceOf(it); c.append($('div', P + '-big', it.emoji), $('b', '', it.name), $('small', '', it.desc)); const b = $('button', P + '-btn', '💎 ' + price); b.disabled = g.gems < price; b.onclick = () => { if (g.buy(it.id)) { snd(env, 'munt'); refresh(); upd(); } }; c.appendChild(b); row.appendChild(c); }); };
      g.offers_ = null; refresh(); wrap.append(gem, row);
      const last = g.lvIdx + 1 >= LEVELS.length;
      ov.show(card(P, { emoji: '🎉', title: 'Level ' + (g.lvIdx + 1) + ' klaar!', text: last ? 'Laatste level gehaald!' : 'Koop upgrades voor je slang.', extra: wrap, btn: last ? 'Afronden 🏆' : 'Volgend level ▶', onBtn: () => { g.offers_ = null; g.nextLevel(); ov.hide(); if (g.state === 'won') { finish(true, 'Alle 5 levels gehaald! ' + g.totalApples + ' appels.'); return; } prev = g.snake.map(s => ({ x: s.x, y: s.y })); acc = 0; upd(); } }));
    };
    const handle = async (evs) => {
      for (const e of evs) {
        const t = typeof e === 'string' ? e : e.e;
        if (t === 'apple') { snd(env, 'munt'); burst(e.x, e.y, '#ef4444', 8, '+' + e.g); }
        else if (t === 'gatespawn') snd(env, 'power');
        else if (t === 'shield') { snd(env, 'power'); shake = .25; }
        else if (t === 'crash') { snd(env, 'fout'); shake = .4; }
        else if (t === 'level') showShop();
        else if (t === 'over') { snd(env, 'lose'); L.after(() => finish(false, 'Geen levens meer. Je haalde level ' + (g.lvIdx + 1) + '.'), 700); }
        else if (t === 'gate') {
          snd(env, 'power'); const q = nextQ(g.lvIdx > 2 ? 3 : g.lvIdx > 0 ? 2 : 1);
          const r = await asker.ask(q, { time: 0 }); if (L.dead) return;
          S.mark(r.ok); const res = g.answer(!!r.ok); snd(env, r.ok ? 'goed' : 'fout');
          if (r.ok) burst(e.x, e.y, '#facc15', 16, '+' + (res.find(x => x.e === 'good') || {}).g); else shake = .3;
          prev = g.snake.map(s => ({ x: s.x, y: s.y })); upd(); await handle(res);
        }
      }
      upd();
    };
    const draw = (dt) => {
      const cs = side / g.cols; const c = ctx; const t = performance.now ? performance.now() / 1000 : 0;
      c.save(); if (shake > 0) { shake -= dt; c.translate((Math.random() - .5) * 6, (Math.random() - .5) * 6); }
      for (let y = 0; y < g.rows; y++) for (let x = 0; x < g.cols; x++) { c.fillStyle = (x + y) & 1 ? '#86efac' : '#4ade80'; c.fillRect(x * cs, y * cs, cs + .5, cs + .5); }
      if (!g.wrap) { c.strokeStyle = '#78350f'; c.lineWidth = 5; c.strokeRect(2, 2, side - 4, side - 4); } else { c.strokeStyle = 'rgba(255,255,255,.7)'; c.setLineDash([6, 6]); c.lineWidth = 2; c.strokeRect(1, 1, side - 2, side - 2); c.setLineDash([]); }
      g.obst.forEach(o => { const x = o.x * cs, y = o.y * cs; c.fillStyle = '#64748b'; rrect(c, x + 2, y + 3, cs - 4, cs - 5, cs * .3); c.fill(); c.fillStyle = '#94a3b8'; rrect(c, x + cs * .2, y + cs * .2, cs * .35, cs * .25, 4); c.fill(); });
      if (g.apple) { const x = (g.apple.x + .5) * cs, y = (g.apple.y + .55) * cs, r = cs * .36 * (1 + Math.sin(t * 5) * .05); c.fillStyle = '#dc2626'; c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill(); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(x - r * .35, y - r * .35, r * .25, 0, 6.3); c.fill(); c.fillStyle = '#15803d'; c.beginPath(); c.ellipse(x + r * .3, y - r * 1.05, r * .4, r * .2, -.6, 0, 6.3); c.fill(); }
      if (g.gate) { const x = g.gate.x * cs, y = g.gate.y * cs, pu = 1 + Math.sin(t * 8) * .08; c.save(); c.translate(x + cs / 2, y + cs / 2); c.scale(pu, pu); c.fillStyle = '#fbbf24'; rrect(c, -cs * .4, -cs * .38, cs * .8, cs * .76, 5); c.fill(); c.fillStyle = '#ef4444'; c.fillRect(-cs * .06, -cs * .38, cs * .12, cs * .76); c.fillRect(-cs * .4, -cs * .06, cs * .8, cs * .12); c.fillStyle = '#fff'; c.font = 'bold ' + Math.round(cs * .4) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 0, 0); c.restore(); c.strokeStyle = g.gate.ttl < 30 ? '#ef4444' : '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(x + cs / 2, y + cs / 2, cs * .52, -1.57, -1.57 + 6.28 * g.gate.ttl / 100); c.stroke(); }
      const p = started && g.state === 'play' ? clamp(acc / g.tickMs(), 0, 1) : 1;
      const n = g.snake.length; const blink = g.inv > 0 && Math.floor(t * 10) % 2 === 0;
      for (let i = n - 1; i >= 0; i--) {
        const s = g.snake[i], q = prev[Math.min(i, prev.length - 1)] || s; let px = q.x, py = q.y;
        if (Math.abs(s.x - q.x) > 1.5 || Math.abs(s.y - q.y) > 1.5) { px = s.x; py = s.y; }
        const x = (px + (s.x - px) * p + .5) * cs, y = (py + (s.y - py) * p + .5) * cs, r = cs * (.46 - .12 * i / Math.max(n, 6));
        c.globalAlpha = (g.ghostT > 0 ? .55 : 1) * (blink ? .35 : 1); c.fillStyle = i % 2 ? '#15803d' : '#16a34a'; if (i === 0) c.fillStyle = '#22c55e';
        c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill();
        if (i === 0) {
          c.fillStyle = '#fff'; const dx = g.dir.x, dy = g.dir.y, ex = -dy * r * .45, ey = dx * r * .45;
          c.beginPath(); c.arc(x + dx * r * .35 + ex, y + dy * r * .35 + ey, r * .26, 0, 6.3); c.arc(x + dx * r * .35 - ex, y + dy * r * .35 - ey, r * .26, 0, 6.3); c.fill();
          c.fillStyle = '#111'; c.beginPath(); c.arc(x + dx * r * .5 + ex, y + dy * r * .5 + ey, r * .12, 0, 6.3); c.arc(x + dx * r * .5 - ex, y + dy * r * .5 - ey, r * .12, 0, 6.3); c.fill();
          if (g.shield) { c.strokeStyle = 'rgba(59,130,246,.9)'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r * 1.35, 0, 6.3); c.stroke(); }
        }
        c.globalAlpha = 1;
      }
      for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) { parts.splice(i, 1); continue; } c.globalAlpha = clamp(q.life * 1.6, 0, 1); if (q.txt) { c.fillStyle = '#fff'; c.strokeStyle = '#14532d'; c.lineWidth = 3; c.font = 'bold ' + Math.round(cs * .55) + 'px sans-serif'; c.textAlign = 'center'; c.strokeText(q.txt, q.x, q.y); c.fillText(q.txt, q.x, q.y); } else { c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, 3, 0, 6.3); c.fill(); } c.globalAlpha = 1; }
      c.restore();
    };
    loop(L, host, (dt) => {
      if (started && g.state === 'play' && !ov.shown) {
        elapsed += dt; acc += dt * 1000; let guard = 0;
        while (g.state === 'play' && acc >= g.tickMs() && guard++ < 4) { acc -= g.tickMs(); prev = g.snake.map(s => ({ x: s.x, y: s.y })); const ev = g.step(); if (ev.length) { handle(ev); } }
        if (elapsed > 480) { finish(false, 'Tijd om! ' + g.totalApples + ' appels.'); }
      }
      draw(dt);
    });
    upd();
    ov.show(card(P, { emoji: '🐍', title: 'Slimme slang', text: 'Eet appels 🍎. Pak het 🎁 en beantwoord de vraag voor bonuspunten! Zwiep of gebruik de pijltjes.', btn: 'Tik om te beginnen', onBtn: () => { ov.hide(); started = true; snd(env, 'klik'); } }));
    return { destroy() { asker.cancel(); L.kill(); try { style.remove(); } catch (e) {} host.textContent = ''; } };
  }
};
