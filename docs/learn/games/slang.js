// Learn Spel 13: Slimme slang. Eet appels, pak 🎁 vraagblokken, koop upgrades tussen de levels.
// Gebouwd uit tools/learn-stubs/src-c/slang.src.js (hulpjes ingebouwd).
import { Gx } from './_gfx.js?v=1';
import { mix } from './_gfx.js?v=1';
// ---- gedeelde hulpjes ----
const $ = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const $h = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function css(txt) { const s = document.createElement('style'); s.textContent = txt; document.head.appendChild(s); return s; }
function lifecycle() {
  const L = { timers: new Set(), raf: 0, offs: [], dead: false };
  L.after = (f, ms) => { const t = setTimeout(() => { L.timers.delete(t); if (!L.dead) f(); }, ms); L.timers.add(t); return t; };
  L.every = (f, ms) => { const t = setInterval(() => { if (!L.dead) f(); }, ms); L.timers.add(t); return t; };
  L.on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); L.offs.push(() => el.removeEventListener(ev, fn, o)); };
  L.kill = () => { L.dead = true; L.timers.forEach(t => { clearTimeout(t); clearInterval(t); }); L.timers.clear(); if (L.raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(L.raf); L.raf = 0; L.offs.forEach(f => { try { f(); } catch (e) {} }); L.offs = []; };
  return L;
}
function baseCss(P) {
  return `.${P}-root{position:relative;width:100%;overflow:hidden;color:var(--ink);font:inherit;user-select:none;-webkit-user-select:none;touch-action:manipulation;display:flex;flex-direction:column;background:transparent;border-radius:14px;box-sizing:border-box;font-size:calc(16px*var(--gfx-font,1))}
.${P}-root *{box-sizing:border-box}
.${P}-hud{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;justify-content:flex-start;padding:8px 58px 4px 10px;font-weight:800;font-size:calc(15px*var(--gfx-font,1))}
.${P}-chip{display:inline-flex;align-items:center;gap:5px;background:var(--card);border-radius:999px;padding:5px 12px;min-height:34px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.${P}-ov{position:absolute;top:0;left:0;right:0;bottom:0;display:none;align-items:center;justify-content:center;background:rgba(10,12,30,.74);z-index:50;padding:10px;overflow:auto}
.${P}-qbox{background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:16px;padding:12px;width:min(100%,520px);max-height:100%;overflow:auto}
.${P}-card{background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:18px;padding:16px;width:min(100%,460px);max-height:100%;overflow:auto;text-align:center}
.${P}-card h2{margin:0 0 6px;font-size:calc(24px*var(--gfx-font,1))}.${P}-card p{margin:6px 0;opacity:.88;font-size:calc(16px*var(--gfx-font,1));line-height:1.4}
.${P}-big{font-size:54px;line-height:1.1}
.${P}-btn{border:0;border-radius:16px;padding:13px 22px;font:inherit;font-size:calc(17px*var(--gfx-font,1));font-weight:800;background:var(--accent);color:#fff;cursor:pointer;min-height:54px;box-shadow:0 4px 0 rgba(0,0,0,.25),0 6px 12px rgba(0,0,0,.2);margin:4px}
.${P}-btn.alt{background:rgba(127,127,127,.22);color:var(--ink)}
.${P}-btn:disabled{opacity:.45;cursor:default}
.${P}-row{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:stretch}
.${P}-shopi{border:2px solid var(--line);border-radius:16px;padding:10px;background:var(--card);flex:1 1 130px;min-width:120px;max-width:190px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.12)}
.${P}-modes{display:flex;flex-direction:column;gap:8px;margin:10px 0 4px}
.${P}-mode{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:2px;min-height:58px;border:3px solid var(--line);background:var(--card);color:var(--ink);border-radius:16px;padding:8px 14px;font:inherit;font-weight:800;cursor:pointer}
.${P}-mode small{font-weight:600;opacity:.8;font-size:.82em}.${P}-mode.on{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent) inset}
.${P}-shopi b{display:block}.${P}-shopi small{display:block;opacity:.75;min-height:2.4em}
@keyframes ${P}pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}
.${P}-pop{animation:${P}pop .35s ease-out}`;
}
function mkOv(root, P) {
  const el = $('div', P + '-ov'); root.appendChild(el);
  return { el, shown: false, show(n) { el.textContent = ''; if (n) el.appendChild(n); el.style.display = 'flex'; this.shown = true; }, hide() { el.style.display = 'none'; el.textContent = ''; this.shown = false; } };
}
function card(P, o) { // intro/info-kaart: {emoji,title,text,btn,onBtn,extra}
  const c = $('div', P + '-card ' + P + '-pop');
  if (o.ic || o.emoji) c.appendChild(o.ic ? $h('div', P + '-big', Gx.ic(o.ic, 72, o.emoji)) : $('div', P + '-big', o.emoji));
  if (o.title) c.appendChild($('h2', '', o.title));
  if (o.text) c.appendChild($('p', '', o.text));
  if (o.extra) c.appendChild(o.extra);
  if (o.btn) { const b = $('button', P + '-btn', o.btn); b.onclick = o.onBtn; c.appendChild(b); }
  return c;
}
function modePicker(P, modes, cur, onPick) { // modes: {id:{name,desc}} -> {el, get()}
  const box = $('div', P + '-modes'); let val = cur; const bs = {};
  Object.keys(modes).forEach(id => { const b = $h('button', P + '-mode' + (id === val ? ' on' : ''), '<span>' + modes[id].name + '</span><small>' + modes[id].desc + '</small>'); b.type = 'button'; b.onclick = () => { val = id; Object.keys(bs).forEach(k => { bs[k].className = P + '-mode' + (k === val ? ' on' : ''); }); if (onPick) onPick(id); }; bs[id] = b; box.appendChild(b); });
  return { el: box, get: () => val };
}
function makeAsker(env, ov, P, L) {
  let cur = null;
  return {
    async ask(q, o) {
      const box = $('div', P + '-qbox'); ov.show(box);
      let h = null;
      try { h = env.ask(box, q, Object.assign({ compact: true, feedback: true, autoNext: 1200 }, o || {})); } catch (e) { h = null; }
      if (!h) { ov.hide(); return { ok: false, ms: 0 }; }
      cur = h; let r = null;
      try { r = await h.promise; } catch (e) { r = null; }
      cur = null; r = r || { ok: false, ms: 0 };
      if (L.dead) return r;
      ov.hide();
      try { env.report({ q, ok: !!r.ok, ms: r.ms || 0 }); } catch (e) {}
      return r;
    },
    cancel() { try { cur && cur.cancel && cur.cancel(); } catch (e) {} }
  };
}
const FALLBACK_Q = [
  { t: 'tf', q: '2 + 2 = 4', a: true, d: 1 }, { t: 'mc', q: 'Hoeveel is 3 + 4?', a: '7', o: ['6', '7', '8', '9'], d: 1 },
  { t: 'mc', q: 'Welke kleur heeft gras?', a: 'groen', o: ['rood', 'groen', 'blauw', 'geel'], d: 1 }, { t: 'num', q: 'Hoeveel is 5 x 2?', a: 10, d: 1 }
];
function qsupply(env) {
  let buf = [], i = 0;
  return (hard) => {
    if (!buf.length) {
      try { buf = (env.pick(8, hard ? { hard } : {}) || []).slice(); } catch (e) { buf = []; }
      if (!buf.length) buf = FALLBACK_Q.slice(i++ % 2).concat(FALLBACK_Q.slice(0, i % 2));
    }
    return buf.shift();
  };
}
function mkStats() {
  const S = { correct: 0, wrong: 0, streak: 0, best: 0, mark(ok) { if (ok) { S.correct++; S.streak++; if (S.streak > S.best) S.best = S.streak; } else { S.wrong++; S.streak = 0; } return S; } };
  return S;
}
function fit(cv, w, h) {
  const d = Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);
  cv.width = Math.max(1, Math.round(w * d)); cv.height = Math.max(1, Math.round(h * d));
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); return c;
}
function loop(L, host, fn) {
  let last = 0;
  const f = (ts) => {
    if (L.dead) return;
    if (host.isConnected === false) { L.raf = 0; last = 0; L.after(() => { L.raf = requestAnimationFrame(f); }, 400); return; }
    const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016); last = ts;
    try { fn(dt, ts); } catch (e) { if (typeof console !== 'undefined') console.error(e); }
    L.raf = requestAnimationFrame(f);
  };
  L.raf = requestAnimationFrame(f);
}
function dims(host, env) { return { W: clamp(host.clientWidth || env.w || 380, 280, 760), H: clamp(env.h || host.clientHeight || 600, 420, 1100) }; }
function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
const fmtN = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
function snd(env, n) { try { env.snd && env.snd.play(n); } catch (e) {} }
// ---- einde hulpjes ----

const P = 'lsl';

export const LEVELS = [
  { cols: 11, rows: 11, wrap: true, obs: 0, goal: 5, tick: 200 },
  { cols: 12, rows: 12, wrap: true, obs: 0, goal: 7, tick: 180 },
  { cols: 12, rows: 12, wrap: false, obs: 3, goal: 8, tick: 170 },
  { cols: 13, rows: 13, wrap: false, obs: 6, goal: 10, tick: 155 },
  { cols: 13, rows: 13, wrap: false, obs: 9, goal: 12, tick: 142 }
];
export const SHOP = [
  { id: 'slow', ic: 'snail', emoji: '🐢', name: 'Rustig tempo', desc: 'Slang gaat iets trager.', max: 3, cost: l => 8 + 5 * l },
  { id: 'magnet', ic: 'magnet', emoji: '🧲', name: 'Magneet', desc: 'Appels komen naar je toe.', max: 2, cost: l => 10 + 8 * l },
  { id: 'heart', ic: 'heart', emoji: '❤️', name: 'Extra leven', desc: '+1 leven.', max: 4, cost: l => 12 + 4 * l },
  { id: 'ghost', ic: 'ghost', emoji: '👻', name: 'Spookstaart', desc: 'Na een 🎁 kun je door jezelf heen.', max: 2, cost: l => 14 + 8 * l },
  { id: 'dbl', ic: 'star', emoji: '✨', name: 'Dubbele punten', desc: '+50% punten.', max: 3, cost: l => 10 + 6 * l },
  { id: 'shield', ic: 'shield', emoji: '🛡', name: 'Schild', desc: 'Vangt één botsing op.', max: 9, cost: l => 9 + 2 * l },
  { id: 'clover', ic: 'clover', emoji: '🍀', name: 'Geluksklaver', desc: 'Het 🎁 blijft langer staan.', max: 3, cost: l => 9 + 6 * l },
  { id: 'compass', ic: 'compass', emoji: '🧭', name: 'Kompas', desc: 'Het 🎁 verschijnt vaker.', max: 2, cost: l => 14 + 10 * l }
];
// Voer: elke soort heeft eigen punten, groei en gems (volgorde vast, geen random nodig)
export const FOODS = {
  apple: { ic: 'apple', e: '🍎', name: 'Appel', pts: 1, grow: 1, gems: 1 },
  banana: { ic: 'banana', e: '🍌', name: 'Banaan', pts: 1.4, grow: 1, gems: 1 },
  strawberry: { ic: 'strawberry', e: '🍓', name: 'Aardbei', pts: 1.2, grow: 1, gems: 2 },
  grapes: { ic: 'grapes', e: '🍇', name: 'Druiven', pts: 1.6, grow: 2, gems: 1 },
  golden: { ic: 'cupcake', e: '🧁', name: 'Gouden taartje', pts: 3, grow: 1, gems: 4 }
};
const FOOD_ORDER = ['apple', 'apple', 'banana', 'strawberry', 'apple', 'grapes'];
export const SKINS = {
  groen: { name: 'Groen', a: '#16a34a', b: '#15803d', head: '#22c55e' },
  regenboog: { name: 'Regenboog', rainbow: true, head: '#f43f5e' },
  goud: { name: 'Goud', a: '#f59e0b', b: '#d97706', head: '#fbbf24' },
  ijs: { name: 'IJs', a: '#38bdf8', b: '#0ea5e9', head: '#7dd3fc' },
  paars: { name: 'Paars', a: '#a855f7', b: '#7e22ce', head: '#c084fc' }
};
// Spelmodi: levels (5 vaste levels), oneindig (door na level 5 met steeds snellere levels), doolhof (veel rotsen, geen doorgang door de rand)
export const SLANG_MODES = {
  levels: { name: 'Levels', desc: '5 levels, tussendoor naar de winkel.' },
  oneindig: { name: 'Eindeloos', desc: 'Na level 5 ga je door met steeds snellere levels.' },
  doolhof: { name: 'Rotsendoolhof', desc: 'Veel meer rotsen en altijd muren. Extra punten!' }
};
export function levelDef(i, mode) {
  let L;
  if (i < LEVELS.length) L = Object.assign({}, LEVELS[i]);
  else { const k = i - LEVELS.length + 1; L = { cols: 13, rows: 13, wrap: false, obs: Math.min(16, 9 + k), goal: 12 + k, tick: Math.max(88, 142 - k * 6) }; }
  if (mode === 'doolhof') { L.wrap = false; L.obs = Math.round(L.obs * 1.6) + 3; L.goal = Math.max(5, L.goal - 1); }
  return L;
}
const DIFF_MUL = { 1: 1.22, 2: 1, 3: 0.84 };

export class SnakeGame {
  constructor(o) {
    this.rand = o.rand || Math.random; this.fx = o.fx || {}; this.diff = o.level || 2;
    this.up = { slow: 0, magnet: 0, ghost: 0, dbl: 0, heart: 0, shield: 0, clover: 0, compass: 0 };
    this.mode = SLANG_MODES[o.mode] ? o.mode : 'levels'; this.maxLv = this.mode === 'oneindig' ? Infinity : LEVELS.length; this.skin = SKINS[o.skin] ? o.skin : 'groen'; this.nFood = 0; this.pmul = this.mode === 'doolhof' ? 1.5 : 1;
    this.lives = 3 + Math.max(0, Math.round(this.fx.extraLives || 0));
    this.shield = this.fx.shield ? 1 : 0;
    this.gems = Math.min(30, Math.round((this.fx.startCash || 0) / 5));
    this.score = 0; this.streak = 0; this.best = 0; this.lvIdx = 0; this.totalApples = 0; this.gatesOk = 0; this.gatesBad = 0;
    this.ghostT = 0; this.slowT = 0; this.inv = 0; this.ticks = 0; this.state = 'play';
    this.startLevel(0);
  }
  get mult() { return 1 + Math.min(this.streak, 10) * (0.1 + (this.fx.streakBonus || 0) * 0.5); }
  startLevel(i) {
    const L = this.L = levelDef(i, this.mode); this.lvIdx = i; this.cols = L.cols; this.rows = L.rows; this.wrap = L.wrap;
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
    this.apple = this.spawnFood();
  }
  spawnFood() {
    const n = ++this.nFood; const k = n % 8 === 0 ? 'golden' : FOOD_ORDER[n % FOOD_ORDER.length];
    const p = this.randFree(); p.k = k; return p;
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
  gain(base) { return Math.round(base * this.pmul * this.mult * (1 + 0.5 * this.up.dbl)); }
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
      if (d <= 1 + this.up.magnet && d > 0) { const ax = this.apple.x, ay = this.apple.y; this.apple = { k: this.apple.k, x: ax + Math.sign(x - ax) * (Math.abs(x - ax) >= Math.abs(y - ay) ? 1 : 0), y: ay + Math.sign(y - ay) * (Math.abs(x - ax) < Math.abs(y - ay) ? 1 : 0) }; }
    }
    if (this.apple && this.apple.x === x && this.apple.y === y) {
      const fd = FOODS[this.apple.k] || FOODS.apple; const g = this.gain(10 * fd.pts); this.score += g; this.addGems(fd.gems); this.grow += fd.grow; this.apples++; this.totalApples++; ev.push({ e: 'apple', x, y, g, k: this.apple.k });
      this.apple = null; this.apple = this.spawnFood();
      if (this.apples % Math.max(1, 3 - this.up.compass) === 0 && !this.gate && this.apples < this.L.goal) { const p = this.randFree(); this.gate = { x: p.x, y: p.y, ttl: 100 + 40 * this.up.clover }; ev.push('gatespawn'); }
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
  nextLevel() { if (this.state !== 'shop') return; if (this.lvIdx + 1 >= this.maxLv) { this.state = 'won'; return; } this.state = 'play'; this.startLevel(this.lvIdx + 1); }
}

const CSS = `
.${P}-cvw{flex:1;display:flex;align-items:center;justify-content:center;min-height:0}
.${P}-cvw canvas{border-radius:16px;touch-action:none;background:#14532d;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.${P}-pad{display:grid;grid-template-columns:repeat(3,78px);grid-template-rows:repeat(2,60px);gap:7px;justify-content:center;padding:6px 0 10px}
.${P}-pad button{border:0;border-radius:18px;background:var(--card);color:var(--ink);font-size:28px;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.25),0 5px 10px rgba(0,0,0,.18)}
.${P}-skins{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:6px 0}
.${P}-skin{width:50px;height:50px;border-radius:50%;border:4px solid transparent;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.3)}
.${P}-skin.on{border-color:var(--accent)}
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
    const gx = Gx.start(root, env, 'slang');
    const WD = gx.world, tA = mix(WD.ground || '#4ade80', '#ffffff', 0.14), tB = mix(WD.ground || '#4ade80', '#000000', 0.12), tBorder = mix(WD.ground || '#78350f', '#000000', 0.55);
    let mode = 'levels', skin = 'groen';
    const hud = $('div', P + '-hud'); const cvw = $('div', P + '-cvw'); const cv = $('canvas'); cvw.appendChild(cv);
    const pad = $('div', P + '-pad'); root.append(hud, cvw, pad);
    const ov = mkOv(root, P); const asker = makeAsker(env, ov, P, L); const nextQ = qsupply(env); const S = mkStats();
    const side = Math.floor(Math.min(W - 8, H - 64 - 150)); const ctx = fit(cv, side, side);
    let g = new SnakeGame({ rand: env.rand || Math.random, fx: env.fx, level: env.level });
    let acc = 0, started = false, ended = false, prev = g.snake.map(s => ({ x: s.x, y: s.y })), parts = [], shake = 0, elapsed = 0, ringT = 0;
    const dirs = { '←': [-1, 0], '↑': [0, -1], '↓': [0, 1], '→': [1, 0] };
    [null, '↑', null, '←', '↓', '→'].forEach(k => { const b = $('button', '', k || ''); if (k) { b.onclick = () => g.setDir(...dirs[k]); } else b.style.visibility = 'hidden'; pad.appendChild(b); });
    const chips = {}; ['lv', 'life', 'apple', 'gem', 'score', 'mult'].forEach(k => { chips[k] = $('span', P + '-chip'); hud.appendChild(chips[k]); });
    const upd = () => {
      chips.lv.innerHTML = Gx.ic('flag', 24, '🏁') + ' ' + (g.lvIdx + 1) + '/' + (g.maxLv === Infinity ? '∞' : g.maxLv); chips.life.innerHTML = Gx.ic('heart', 24, '❤️') + ' ' + g.lives + (g.shield ? ' ' + Gx.ic('shield', 22, '🛡') + g.shield : '');
      chips.apple.innerHTML = Gx.ic('apple', 24, '🍎') + ' ' + g.apples + '/' + g.L.goal; chips.gem.innerHTML = Gx.ic('gem', 24, '💎') + ' ' + g.gems; chips.score.innerHTML = Gx.ic('star', 24, '⭐') + ' ' + fmtN(g.score);
      chips.mult.innerHTML = Gx.ic('flame', 24, '🔥') + ' ×' + g.mult.toFixed(1);
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
    const burst = (x, y, col, n, txt) => { const cs = side / g.cols; try { const r = cv.getBoundingClientRect(), b = root.getBoundingClientRect(); gx.burst(r.left - b.left + (x + .5) * cs, r.top - b.top + (y + .5) * cs, n > 10 ? 'stars' : 'sparkle', n, { color: col }); } catch (e) {} if (txt) parts.push({ x: (x + .5) * cs, y: (y + .5) * cs, vx: 0, vy: -40, life: 1, txt }); };
    const showShop = () => {
      snd(env, 'level');
      const wrap = $('div'); const gem = $h('p', '', ''); const row = $('div', P + '-row');
      const refresh = () => { gem.innerHTML = Gx.ic('gem', 26, '💎') + ' ' + g.gems + ' gems'; row.textContent = ''; g.offers_ = g.offers_ || g.offers(); g.offers_.forEach(it => { const c = $('div', P + '-shopi'); const price = g.priceOf(it); c.append($h('div', P + '-big', Gx.ic(it.ic, 60, it.emoji)), $('b', '', it.name), $('small', '', it.desc)); const b = $h('button', P + '-btn', Gx.ic('gem', 22, '💎') + ' ' + price); b.disabled = g.gems < price; b.onclick = () => { if (g.buy(it.id)) { snd(env, 'munt'); refresh(); upd(); } }; c.appendChild(b); row.appendChild(c); }); };
      g.offers_ = null; refresh(); wrap.append(gem, row);
      const last = g.lvIdx + 1 >= LEVELS.length;
      gx.burst((root.clientWidth || 360) / 2, 160, 'confetti', 44);
      ov.show(card(P, { ic: 'trophy', emoji: '🎉', title: 'Level ' + (g.lvIdx + 1) + ' klaar!', text: last ? 'Laatste level gehaald!' : 'Koop upgrades voor je slang.', extra: wrap, btn: last ? 'Afronden 🏆' : 'Volgend level ▶', onBtn: () => { g.offers_ = null; g.nextLevel(); ov.hide(); if (g.state === 'won') { finish(true, 'Alle ' + g.maxLv + ' levels gehaald! ' + g.totalApples + ' stuks voer.'); return; } prev = g.snake.map(s => ({ x: s.x, y: s.y })); acc = 0; upd(); } }));
    };
    const handle = async (evs) => {
      for (const e of evs) {
        const t = typeof e === 'string' ? e : e.e;
        if (t === 'apple') { snd(env, 'munt'); burst(e.x, e.y, e.k === 'golden' ? '#facc15' : '#ef4444', e.k === 'golden' ? 14 : 6, '+' + e.g); }
        else if (t === 'gatespawn') snd(env, 'power');
        else if (t === 'shield') { snd(env, 'power'); shake = .25; }
        else if (t === 'crash') { snd(env, 'fout'); shake = .4; }
        else if (t === 'level') showShop();
        else if (t === 'over') { snd(env, 'lose'); L.after(() => finish(g.mode === 'oneindig' && g.lvIdx >= 5, 'Geen levens meer. Je haalde level ' + (g.lvIdx + 1) + '.'), 700); }
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
      for (let y = 0; y < g.rows; y++) for (let x = 0; x < g.cols; x++) { c.fillStyle = (x + y) & 1 ? tA : tB; c.fillRect(x * cs, y * cs, cs + .5, cs + .5); }
      if (!g.wrap) { c.strokeStyle = tBorder; c.lineWidth = 5; c.strokeRect(2, 2, side - 4, side - 4); } else { c.strokeStyle = 'rgba(255,255,255,.7)'; c.setLineDash([6, 6]); c.lineWidth = 2; c.strokeRect(1, 1, side - 2, side - 2); c.setLineDash([]); }
      g.obst.forEach(o => { Gx.draw(c, 'rock', (o.x + .5) * cs, (o.y + .5) * cs, cs * 1.12, '🪨', { shadow: true }); });
      if (g.apple) { const fd = FOODS[g.apple.k] || FOODS.apple, x = (g.apple.x + .5) * cs, y = (g.apple.y + .5) * cs, sz = cs * 1.1 * (1 + Math.sin(t * 5) * .06); if (g.apple.k === 'golden' && gx.q() > 0) { c.fillStyle = 'rgba(250,204,21,.35)'; c.beginPath(); c.arc(x, y, cs * .62, 0, 6.3); c.fill(); } Gx.draw(c, fd.ic, x, y, sz, fd.e, { shadow: true }); }
      if (g.gate) { const pu = 1 + Math.sin(t * 8) * .08; Gx.draw(c, 'gift', (g.gate.x + .5) * cs, (g.gate.y + .5) * cs, cs * 1.2 * pu, '🎁', { shadow: true }); }
      const p = started && g.state === 'play' ? clamp(acc / g.tickMs(), 0, 1) : 1;
      const n = g.snake.length; const blink = g.inv > 0 && Math.floor(t * 10) % 2 === 0;
      for (let i = n - 1; i >= 0; i--) {
        const s = g.snake[i], q = prev[Math.min(i, prev.length - 1)] || s; let px = q.x, py = q.y;
        if (Math.abs(s.x - q.x) > 1.5 || Math.abs(s.y - q.y) > 1.5) { px = s.x; py = s.y; }
        const x = (px + (s.x - px) * p + .5) * cs, y = (py + (s.y - py) * p + .5) * cs, r = cs * (.46 - .12 * i / Math.max(n, 6));
        c.globalAlpha = (g.ghostT > 0 ? .55 : 1) * (blink ? .35 : 1); const sk = SKINS[g.skin] || SKINS.groen; c.fillStyle = sk.rainbow ? 'hsl(' + ((i * 28) % 360) + ',80%,55%)' : i % 2 ? sk.b : sk.a; if (i === 0) c.fillStyle = sk.head;
        c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill(); c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.arc(x - r * .3, y - r * .32, r * .45, 0, 6.3); c.fill();
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
        if (elapsed > (g.mode === 'oneindig' ? 720 : 480)) { finish(false, 'Tijd om! ' + g.totalApples + ' appels.'); }
      }
      draw(dt);
    });
    upd();
    const mp = modePicker(P, SLANG_MODES, mode, null);
    const skinRow = $('div', P + '-skins'); const skinEls = {};
    Object.keys(SKINS).forEach(id => { const sk = SKINS[id], b = $('button', P + '-skin' + (id === skin ? ' on' : '')); b.type = 'button'; b.setAttribute('aria-label', sk.name); b.style.background = sk.rainbow ? 'linear-gradient(135deg,#f43f5e,#f59e0b,#22c55e,#38bdf8,#a855f7)' : sk.a; b.onclick = () => { skin = id; Object.keys(skinEls).forEach(k => { skinEls[k].className = P + '-skin' + (k === id ? ' on' : ''); }); }; skinEls[id] = b; skinRow.appendChild(b); });
    const ext = $('div'); ext.append(mp.el, skinRow);
    ov.show(card(P, { ic: 'apple', emoji: '🐍', title: 'Slimme slang', text: 'Eet fruit. Pak het cadeau en beantwoord de vraag voor bonuspunten! Zwiep of gebruik de pijltjes. Kies een spel en een kleur.', extra: ext, btn: 'Tik om te beginnen', onBtn: () => {
      mode = mp.get(); if (mode !== 'levels' || skin !== 'groen') { g = new SnakeGame({ rand: env.rand || Math.random, fx: env.fx, level: env.level, mode, skin }); prev = g.snake.map(s => ({ x: s.x, y: s.y })); }
      ov.hide(); started = true; snd(env, 'klik'); upd(); } }));
    return { destroy() { asker.cancel(); L.kill(); gx.destroy(); try { style.remove(); } catch (e) {} host.textContent = ''; } };
  }
};
