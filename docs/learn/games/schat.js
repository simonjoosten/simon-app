// Learn Spel 16: Schatgraver. Graaf tegels open, volg de goud-hints, ontwijk valkuilen (vraag!), open kisten (vraag!) en laad je energie op met vragen.
// Gebouwd uit tools/learn-stubs/src-c/schat.src.js (hulpjes ingebouwd).
// ---- gedeelde hulpjes (per bestand ingebouwd, geen externe imports) ----
const $ = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
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
  return `.${P}-root{position:relative;width:100%;overflow:hidden;color:var(--ink);font:inherit;user-select:none;-webkit-user-select:none;touch-action:manipulation;display:flex;flex-direction:column;background:var(--card);border-radius:14px;box-sizing:border-box}
.${P}-root *{box-sizing:border-box}
.${P}-hud{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center;justify-content:center;padding:6px 8px;font-weight:700;font-size:14px}
.${P}-chip{background:rgba(127,127,127,.16);border-radius:999px;padding:2px 10px;white-space:nowrap}
.${P}-ov{position:absolute;top:0;left:0;right:0;bottom:0;display:none;align-items:center;justify-content:center;background:rgba(10,12,30,.74);z-index:20;padding:10px;overflow:auto}
.${P}-qbox{background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:16px;padding:12px;width:min(100%,520px);max-height:100%;overflow:auto}
.${P}-card{background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:18px;padding:16px;width:min(100%,460px);max-height:100%;overflow:auto;text-align:center}
.${P}-card h2{margin:0 0 6px;font-size:22px}.${P}-card p{margin:6px 0;opacity:.85}
.${P}-big{font-size:54px;line-height:1.1}
.${P}-btn{border:0;border-radius:12px;padding:10px 16px;font:inherit;font-weight:800;background:var(--accent);color:#fff;cursor:pointer;min-height:44px;box-shadow:0 2px 0 rgba(0,0,0,.25);margin:4px}
.${P}-btn.alt{background:rgba(127,127,127,.22);color:var(--ink)}
.${P}-btn:disabled{opacity:.45;cursor:default}
.${P}-row{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:stretch}
.${P}-shopi{border:1px solid var(--line);border-radius:14px;padding:8px;background:rgba(127,127,127,.08);flex:1 1 120px;min-width:110px;max-width:170px;text-align:center}
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
  if (o.emoji) c.appendChild($('div', P + '-big', o.emoji));
  if (o.title) c.appendChild($('h2', '', o.title));
  if (o.text) c.appendChild($('p', '', o.text));
  if (o.extra) c.appendChild(o.extra);
  if (o.btn) { const b = $('button', P + '-btn', o.btn); b.onclick = o.onBtn; c.appendChild(b); }
  return c;
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

const P = 'lsc';

export const DEPTHS = [
  { name: 'Zandgrot', top: '#d6a85c', bot: '#a16207', open: '#78350f' },
  { name: 'Kristalgang', top: '#8da2fb', bot: '#4f46e5', open: '#1e1b4b' },
  { name: 'IJsgrot', top: '#bae6fd', bot: '#0ea5e9', open: '#0c4a6e' },
  { name: 'Lavatunnel', top: '#f59e0b', bot: '#b91c1c', open: '#450a0a' },
  { name: 'Schatkamer', top: '#fcd34d', bot: '#a16207', open: '#292524' }
];
export const KINDS = { coin: { e: '🪙', v: 6 }, vase: { e: '🏺', v: 14 }, gem: { e: '💎', v: 30 }, crown: { e: '👑', v: 90 } };
export const SHOP = [
  { id: 'bat', emoji: '🔋', name: 'Grote batterij', desc: 'Meer energie per vraag en een hoger maximum.', max: 3, cost: l => 25 + 45 * l },
  { id: 'pick', emoji: '⛏', name: 'Pikhouweel', desc: 'Rotsen kosten minder energie.', max: 2, cost: l => 35 + 60 * l },
  { id: 'radar', emoji: '📡', name: 'Valkuilradar', desc: 'Toont rode cijfers: valkuilen om je heen.', max: 1, cost: () => 45 },
  { id: 'detector', emoji: '🧭', name: 'Brede detector', desc: 'Goudhints kijken 2 tegels ver.', max: 1, cost: () => 70 },
  { id: 'helm', emoji: '⛑️', name: 'Helm', desc: 'Vangt één valkuil op (stapelbaar).', max: 9, cost: l => 30 + 5 * l, stack: true },
  { id: 'map', emoji: '🗺', name: 'Schatkaart', desc: 'Toont meteen waar de trap/hoofdschat ligt (1x).', max: 9, cost: () => 110, stack: true }
];
const COLS = 6, ROWS = 7;

export class Dig {
  constructor(o = {}) {
    this.rand = o.rand || Math.random; this.fx = o.fx || {}; this.diff = o.level || 2;
    this.up = { bat: 0, pick: 0, radar: 0, detector: 0 }; this.helm = this.fx.shield ? 1 : 0; this.maps = 0;
    this.hearts = 3 + Math.max(0, Math.round(this.fx.extraLives || 0)); this.energy = 8 + Math.min(6, Math.round((this.fx.startCash || 0) / 10));
    this.gold = 0; this.total = 0; this.depth = 0; this.digs = 0; this.streak = 0; this.best = 0; this.good = 0; this.bad = 0; this.state = 'play'; this.chests = 0; this.dodged = 0;
    this.gen(0);
  }
  get cols() { return COLS; } get rows() { return ROWS; }
  get maxEnergy() { return 12 + 3 * this.up.bat; }
  mult() { return (1 + this.depth * 0.4) * (this.fx.cashMult || 1); }
  gen(d) {
    this.depth = d; const n = COLS * ROWS, r = this.rand; this.tiles = Array.from({ length: n }, () => ({ kind: 'dirt', open: false, v: 0 })); this.first = d === 0 && this.digs === 0;
    const free = () => { for (let k = 0; k < 300; k++) { const i = Math.floor(r() * n); if (this.tiles[i].kind === 'dirt') return i; } return this.tiles.findIndex(t => t.kind === 'dirt'); };
    const put = (kind, v) => { const i = free(); if (i >= 0) { this.tiles[i].kind = kind; this.tiles[i].v = v || 0; } return i; };
    this.exit = put(d === DEPTHS.length - 1 ? 'final' : 'ladder');
    for (let k = 0; k < 2 + (this.diff === 3 ? 1 : 0) + d; k++) put('trap');
    for (let k = 0; k < 4 + d; k++) put('rock');
    for (let k = 0; k < 3; k++) put('chest', Math.round((40 + 30 * r()) * (1 + d * 0.4)));
    for (let k = 0; k < 7; k++) put('coin'); for (let k = 0; k < 3; k++) put('vase'); for (let k = 0; k < 2 + d; k++) put('gem'); if (d >= 1) put('crown');
    this.mapShown = false;
  }
  nb(i, rad = 1) { const x = i % COLS, y = Math.floor(i / COLS), out = []; for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { if (!dx && !dy) continue; const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < COLS && b < ROWS) out.push(b * COLS + a); } return out; }
  hint(i) { const rad = this.up.detector ? 2 : 1; const unopened = this.nb(i, rad).filter(j => !this.tiles[j].open); return { gold: unopened.filter(j => KINDS[this.tiles[j].kind] || this.tiles[j].kind === 'chest').length, trap: this.up.radar ? this.nb(i, 1).filter(j => !this.tiles[j].open && this.tiles[j].kind === 'trap').length : 0 }; }
  costOf(i) { const t = this.tiles[i]; if (t.kind !== 'rock') return 1; return [2, 1, 0][this.up.pick]; }
  dig(i) {
    const t = this.tiles[i]; if (!t || t.open || this.state !== 'play') return { r: 'noop' };
    const c = this.costOf(i); if (this.energy < c) return { r: 'noenergy', need: c };
    this.energy -= c; t.open = true; this.digs++;
    if (this.first && t.kind !== 'ladder' && t.kind !== 'final') { t.kind = 'coin'; } this.first = false;
    if (KINDS[t.kind]) { const v = Math.max(1, Math.round(KINDS[t.kind].v * this.mult())); this.pay(v); return { r: 'gold', kind: t.kind, v }; }
    switch (t.kind) {
      case 'chest': return { r: 'chest', v: t.v };
      case 'rock': t.kind = 'dirt'; return { r: 'rock', cost: c };
      case 'trap': if (this.helm > 0) { this.helm--; return { r: 'blocked' }; } return { r: 'trap' };
      case 'ladder': return { r: 'ladder' };
      case 'final': { const v = Math.round(250 * (this.fx.cashMult || 1)); this.pay(v); this.state = 'won'; return { r: 'final', v }; }
      default: return { r: 'dirt', hint: this.hint(i) };
    }
  }
  pay(v) { this.gold += v; this.total += v; }
  chest(i, ok) { const t = this.tiles[i]; const v = ok ? Math.round(t.v * this.mult()) : Math.round(t.v * this.mult() * 0.25); t.kind = 'dirt'; this.pay(v); this.chests++; this.mark(ok); return { v, ok }; }
  trap(i, ok) { this.mark(ok); const t = this.tiles[i]; t.kind = 'dirt'; if (ok) { this.dodged++; return { dodged: true }; } this.hearts--; if (this.hearts <= 0) { this.state = 'over'; return { dodged: false, over: true }; } return { dodged: false }; }
  mark(ok) { if (ok) { this.good++; this.streak++; if (this.streak > this.best) this.best = this.streak; } else { this.bad++; this.streak = 0; } }
  recharge(ok) { this.mark(ok); const add = ok ? 5 + this.up.bat + Math.min(3, Math.floor(this.streak / 3)) : 2; const before = this.energy; this.energy = Math.min(Math.max(this.maxEnergy, this.energy), this.energy + add); return this.energy - before; }
  descend() { if (this.depth + 1 < DEPTHS.length) this.gen(this.depth + 1); this.energy = Math.min(this.maxEnergy, this.energy + 2); }
  useMap() { if (this.maps <= 0 || this.mapShown) return false; this.maps--; this.mapShown = true; return true; }
  price(it) { return it.cost(it.stack ? 0 : this.up[it.id]); }
  canBuy(it) { return this.gold >= this.price(it) && (it.stack || this.up[it.id] < it.max); }
  buy(id) { const it = SHOP.find(s => s.id === id); if (!it || !this.canBuy(it)) return false; this.gold -= this.price(it); if (id === 'helm') this.helm++; else if (id === 'map') this.maps++; else this.up[id]++; return true; }
  leave() { if (this.state === 'play') this.state = 'home'; }
  finalScore() { const s = this.total + 60 * this.depth + (this.state === 'won' ? 150 : 0); return Math.round(this.state === 'over' ? s * 0.6 : s); }
}

const CSS = `
.${P}-body{flex:1;overflow:auto;display:flex;flex-direction:column;align-items:center;padding:6px 8px 8px;gap:8px;transition:background .6s}
.${P}-grid{display:grid;gap:5px;width:100%;max-width:440px}
.${P}-t{position:relative;aspect-ratio:1;border:0;border-radius:11px;font-size:28px;padding:0;cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;box-shadow:inset 0 -4px 0 rgba(0,0,0,.28);transition:transform .15s,filter .2s}
.${P}-t:active{transform:scale(.92)}
.${P}-t.o{box-shadow:inset 0 3px 8px rgba(0,0,0,.5);cursor:default}
.${P}-t.dig{animation:${P}dg .35s ease-out}
.${P}-t.map{outline:3px dashed #fde047;animation:${P}pu 1s infinite}
@keyframes ${P}dg{0%{transform:scale(1)}40%{transform:scale(.8) rotate(-6deg)}100%{transform:scale(1)}}
@keyframes ${P}pu{50%{outline-color:transparent}}
.${P}-h1{color:#fde047;font-size:19px;text-shadow:0 1px 2px #000}.${P}-h2{color:#fca5a5;font-size:12px;position:absolute;right:4px;bottom:2px;text-shadow:0 1px 2px #000}
.${P}-act{display:flex;gap:6px;width:100%;max-width:440px}.${P}-act button{flex:1;margin:0;padding:8px 4px;font-size:14px}
.${P}-msg{min-height:22px;font-weight:800;text-align:center;font-size:14px;color:#fff;text-shadow:0 1px 3px #000}
.${P}-bar{height:12px;border-radius:7px;background:rgba(0,0,0,.4);overflow:hidden;width:100%;max-width:440px}.${P}-bar i{display:block;height:100%;background:linear-gradient(90deg,#f59e0b,#fde047);transition:width .25s}`;

export default {
  id: 'schat', name: 'Schatgraver', emoji: '⛏️', color: '#b45309',
  desc: 'Graaf tegels open, volg de goud-hints en ontwijk valkuilen. Vragen laden je energie op!',
  tags: ['denken', 'geld', 'rustig'], minutes: 6, duo: false,
  create(host, env) {
    const L = lifecycle(); const style = css(baseCss(P) + CSS); host.textContent = '';
    const { H } = dims(host, env); const root = $('div', P + '-root'); root.style.height = H + 'px'; host.appendChild(root);
    const g = new Dig({ rand: env.rand || Math.random, fx: env.fx, level: env.level });
    const S = mkStats(); const ov = mkOv(root, P); const asker = makeAsker(env, ov, P, L); const nextQ = qsupply(env);
    let started = false, ended = false, busy = false, leaveArm = 0;
    const hud = $('div', P + '-hud'); const chip = {}; ['depth', 'energy', 'heart', 'gold'].forEach(k => { chip[k] = $('span', P + '-chip'); hud.appendChild(chip[k]); });
    const body = $('div', P + '-body'); const eb = $('div', P + '-bar'); const ebi = $('i'); eb.appendChild(ebi);
    const msg = $('div', P + '-msg', ''); const grid = $('div', P + '-grid'); const act = $('div', P + '-act');
    const bR = $('button', P + '-btn', '⚡ Opladen (vraag)'), bM = $('button', P + '-btn alt', '🗺'), bS = $('button', P + '-btn alt', '🛒'), bH = $('button', P + '-btn alt', '🏠');
    act.append(bR, bM, bS, bH); body.append(eb, msg, grid, act); root.append(hud, body);
    let tiles = [];
    const say = (t) => { msg.textContent = t; };
    const build = () => { grid.textContent = ''; tiles = []; grid.style.gridTemplateColumns = 'repeat(' + g.cols + ',1fr)'; const D = DEPTHS[g.depth]; body.style.background = 'linear-gradient(' + D.top + ',' + D.bot + ')';
      g.tiles.forEach((t, i) => { const b = $('button', P + '-t', ''); b.onclick = () => tap(i); grid.appendChild(b); tiles.push(b); }); };
    const paint = () => {
      const D = DEPTHS[g.depth];
      g.tiles.forEach((t, i) => { const b = tiles[i]; if (!b) return; const open = t.open && t.kind !== 'chest';
        b.className = P + '-t' + (open ? ' o' : '') + (g.mapShown && g.exit === i && !t.open ? ' map' : ''); b.style.background = open || (t.open && t.kind === 'chest') ? D.open : 'linear-gradient(' + D.top + ',' + D.bot + ')';
        let tx = '', sub = '';
        if (t.open) { if (t.kind === 'chest') tx = '🧰'; else if (t.kind === 'dirt') { const h = g.hint(i); tx = h.gold ? '' + h.gold : ''; sub = h.trap ? '' + h.trap : ''; } else if (t.kind === 'ladder') tx = '🪜'; else if (t.kind === 'final') tx = '🏆'; else if (KINDS[t.kind]) tx = KINDS[t.kind].e; }
        else if (!t.open) tx = ''; b.textContent = tx; if (open && t.kind === 'dirt' && tx) b.className += ' ' + P + '-h1'; if (sub) { const s = $('span', P + '-h2', sub); b.appendChild(s); } });
      chip.depth.textContent = '⛰ ' + DEPTHS[g.depth].name + ' ' + (g.depth + 1) + '/' + DEPTHS.length; chip.energy.textContent = '⚡ ' + g.energy + '/' + g.maxEnergy; chip.heart.textContent = '❤️ ' + g.hearts + (g.helm ? ' ⛑' + g.helm : ''); chip.gold.textContent = '🪙 ' + g.gold;
      ebi.style.width = clamp(g.energy / g.maxEnergy * 100, 0, 100) + '%'; bM.textContent = '🗺 ' + g.maps; bM.disabled = !g.maps || g.mapShown; bR.style.outline = g.energy <= 1 ? '3px solid #fde047' : '';
    };
    const finish = (why) => {
      if (ended) return; ended = true; const win = g.state === 'won';
      env.end({ score: g.finalScore(), win: win ? true : (g.state === 'over' ? false : null), stats: { correct: S.correct, wrong: S.wrong, best: S.best, goud: g.total, diepte: g.depth + 1, kisten: g.chests }, summary: why });
    };
    const flyText = (txt, i) => { const b = tiles[i]; if (!b) return; const f = $('div', '', txt); f.style.cssText = 'position:absolute;left:0;right:0;top:-6px;font-size:16px;font-weight:900;color:#fde047;text-shadow:0 1px 3px #000;pointer-events:none;transition:transform .8s,opacity .8s'; b.appendChild(f); L.after(() => { f.style.transform = 'translateY(-34px)'; f.style.opacity = '0'; }, 20); L.after(() => { try { f.remove(); } catch (e) {} }, 900); };
    const ask = async (q) => { busy = true; const r = await asker.ask(q || nextQ(g.depth > 1 ? 3 : g.depth > 0 ? 2 : 1), { time: 0 }); busy = false; return r; };
    const tap = async (i) => {
      if (!started || busy || ov.shown || g.state !== 'play') return;
      const res = g.dig(i); const b = tiles[i];
      if (res.r === 'noop') return;
      if (res.r === 'noenergy') { snd(env, 'fout'); say('Geen energie! Tik op ⚡ Opladen.'); return; }
      if (b) { b.className += ' dig'; }
      if (res.r === 'gold') { snd(env, 'munt'); say(KINDS[res.kind].e + ' +' + res.v + ' goud!'); flyText('+' + res.v, i); }
      else if (res.r === 'dirt') { snd(env, 'klik'); say(res.hint.gold ? '✨ ' + res.hint.gold + ' schat(ten) vlakbij' : 'Hier niets in de buurt.'); }
      else if (res.r === 'rock') { snd(env, 'klik'); say('🪨 Rots weggehakt (' + res.cost + ' energie).'); }
      else if (res.r === 'blocked') { snd(env, 'power'); say('⛑ Je helm redde je van een valkuil!'); }
      else if (res.r === 'ladder') { snd(env, 'level'); say('🪜 De trap omlaag!'); paint(); L.after(() => { if (g.state !== 'play') return; ov.show(card(P, { emoji: '🪜', title: 'Dieper graven?', text: 'Je vond de trap naar ' + DEPTHS[g.depth + 1].name + '. Daar is meer buit (en meer valkuilen).', btn: 'Naar beneden ▼', onBtn: () => { ov.hide(); g.descend(); build(); paint(); say('Welkom in de ' + DEPTHS[g.depth].name + '!'); } })); }, 400); }
      else if (res.r === 'final') { snd(env, 'win'); paint(); say('🏆 De hoofdschat! +' + res.v); L.after(() => finish('Je vond de hoofdschat! ' + g.total + ' goud verzameld.'), 900); return; }
      else if (res.r === 'chest') { snd(env, 'power'); say('🧰 Een kist! Beantwoord de vraag om hem te openen.'); paint(); const r = await ask(); if (L.dead) return; S.mark(r.ok); const c = g.chest(i, r.ok); snd(env, r.ok ? 'goed' : 'fout'); say(r.ok ? '🧰 Kist open! +' + c.v : '🧰 Kist half kapot: +' + c.v); flyText('+' + c.v, i); }
      else if (res.r === 'trap') { snd(env, 'fout'); say('⚠️ Valkuil! Beantwoord snel de vraag om te ontsnappen!'); paint(); const r = await ask(); if (L.dead) return; S.mark(r.ok); const tr = g.trap(i, r.ok); snd(env, r.ok ? 'goed' : 'lose'); say(tr.dodged ? '💨 Ontsnapt!' : '💥 Au! -1 ❤️'); if (tr.over) { paint(); L.after(() => finish('De grot was te gevaarlijk. Je houdt 60% van je buit.'), 700); return; } }
      paint();
    };
    bR.onclick = async () => { if (!started || busy || ov.shown || g.state !== 'play') return; if (g.energy >= g.maxEnergy) { say('Je energie is al vol.'); return; } const r = await ask(); if (L.dead) return; S.mark(r.ok); const add = g.recharge(r.ok); snd(env, r.ok ? 'goed' : 'fout'); say(r.ok ? '⚡ +' + add + ' energie!' : '⚡ Maar +' + add + ' energie'); paint(); };
    bM.onclick = () => { if (g.useMap()) { snd(env, 'power'); say('🗺 De trap is gemarkeerd!'); paint(); } };
    bS.onclick = () => { if (!started || busy) return; const w = $('div'); const co = $('p'); const row = $('div', P + '-row');
      const draw = () => { co.textContent = '🪙 ' + g.gold + ' goud'; row.textContent = ''; SHOP.forEach(it => { const c = $('div', P + '-shopi'); const full = !it.stack && g.up[it.id] >= it.max; c.append($('div', P + '-big', it.emoji), $('b', '', it.name + (it.stack ? '' : ' ' + g.up[it.id] + '/' + it.max)), $('small', '', it.desc)); const bb = $('button', P + '-btn', full ? 'Max' : '🪙 ' + g.price(it)); bb.disabled = full || !g.canBuy(it); bb.onclick = () => { if (g.buy(it.id)) { snd(env, 'munt'); draw(); paint(); } }; c.appendChild(bb); row.appendChild(c); }); };
      draw(); w.append(co, row); ov.show(card(P, { emoji: '🛒', title: 'Graafwinkel', extra: w, btn: 'Verder graven', onBtn: () => { ov.hide(); paint(); } })); };
    bH.onclick = () => { if (!started || busy) return; if (leaveArm < performance.now()) { leaveArm = performance.now() + 2500; bH.textContent = '🏠 Zeker?'; L.after(() => { bH.textContent = '🏠'; }, 2500); return; } g.leave(); finish('Je ging op tijd naar huis met ' + g.total + ' goud.'); };
    build(); paint();
    ov.show(card(P, { emoji: '⛏️', title: 'Schatgraver', text: 'Tik een tegel om te graven (kost energie). Cijfers tonen schatten in de buurt. Bij valkuilen en kisten krijg je een vraag. Vind de trap naar beneden!', btn: 'Tik om te beginnen', onBtn: () => { ov.hide(); started = true; snd(env, 'klik'); say('Tik een tegel!'); } }));
    return { destroy() { asker.cancel(); L.kill(); try { style.remove(); } catch (e) {} host.textContent = ''; } };
  }
};
