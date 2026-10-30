// Learn Spel 14: Boerderij. Plant, water (vraag!), oogst, voer dieren (vraag!), verkoop op de markt (vraag = dubbele prijs), koop upgrades.
// Gebouwd uit tools/learn-stubs/src-c/boerderij.src.js (hulpjes ingebouwd).
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

const P = 'lbo';

export const CROPS = [
  { id: 'wortel', emoji: '🥕', name: 'Wortel', grow: 8, seed: 2, price: 6 },
  { id: 'mais', emoji: '🌽', name: 'Mais', grow: 14, seed: 6, price: 16 },
  { id: 'aardbei', emoji: '🍓', name: 'Aardbei', grow: 24, seed: 14, price: 38 },
  { id: 'pompoen', emoji: '🎃', name: 'Pompoen', grow: 40, seed: 30, price: 85 },
  { id: 'meloen', emoji: '🍉', name: 'Meloen', grow: 60, seed: 55, price: 160 }
];
export const LVL_AT = [0, 30, 110, 280, 600];           // verdiend totaal voor gewas-level 1..5
export const ANIMALS = [
  { id: 'kip', emoji: '🐔', name: 'Kip', cost: 35, per: 18, prod: 'ei', pe: '🥚', price: 5, max: 4 },
  { id: 'koe', emoji: '🐄', name: 'Koe', cost: 120, per: 30, prod: 'melk', pe: '🥛', price: 18, max: 3 },
  { id: 'schaap', emoji: '🐑', name: 'Schaap', cost: 300, per: 45, prod: 'wol', pe: '🧶', price: 40, max: 3 }
];
export const PRODUCTS = Object.fromEntries(CROPS.map(c => [c.id, { emoji: c.emoji, name: c.name, price: c.price }]).concat(ANIMALS.map(a => [a.prod, { emoji: a.pe, name: a.prod, price: a.price }])));
export const PLOT_COST = [0, 0, 0, 0, 25, 60, 120, 220, 380, 600, 900, 1300];
export const UPS = [
  { id: 'can', emoji: '🚿', name: 'Gieter-plus', desc: 'Water werkt langer (+12 s).', max: 4, cost: l => 40 + 70 * l },
  { id: 'tractor', emoji: '🚜', name: 'Tractor', desc: 'Oogst en plant zelf (hoger = sneller).', max: 3, cost: l => 120 + 260 * l },
  { id: 'markt', emoji: '🏪', name: 'Marktkraam', desc: '+12% op alle prijzen.', max: 4, cost: l => 60 + 110 * l },
  { id: 'voer', emoji: '🌾', name: 'Betere voer', desc: 'Eén keer voeren = +1 dier-ronde extra.', max: 3, cost: l => 70 + 120 * l }
];
export const SEASON = 360;                                // seconden
export const TARGET = { 1: 1500, 2: 2500, 3: 4000 };         // verdiend totaal voor "gewonnen" per moeilijkheid

export class Farm {
  constructor(o = {}) {
    this.rand = o.rand || Math.random; this.fx = o.fx || {}; this.diff = o.level || 2;
    this.coins = 18 + Math.max(0, Math.round(this.fx.startCash || 0)); this.earned = 0; this.time = 0; this.sold = 0;
    this.plots = Array.from({ length: 4 }, () => ({ crop: null, t: 0 }));
    this.barn = {}; Object.keys(PRODUCTS).forEach(k => { this.barn[k] = 0; });
    this.animals = []; this.up = { can: 0, tractor: 0, markt: 0, voer: 0 }; this.wet = 0; this.tAuto = 0; this.last = 'wortel';
    this.orders = []; this.ordersDone = 0; this.fedTimes = 0; this.waterTimes = 0; this.harvests = 0;
    for (let i = 0; i < 3; i++) this.orders.push(this.makeOrder());
  }
  get level() { let l = 0; LVL_AT.forEach((v, i) => { if (this.earned >= v) l = i; }); return l; }
  gain(n) { const g = Math.max(1, Math.round(n)); this.coins += g; this.earned += g; return g; }
  unlocked(id) { return CROPS.findIndex(c => c.id === id) <= this.level; }
  priceMult() { return (1 + 0.12 * this.up.markt) * (this.fx.cashMult || 1); }
  makeOrder() {
    const lv = this.level, kinds = CROPS.slice(0, lv + 1).map(c => c.id).concat(this.animals.length ? [...new Set(this.animals.map(a => a.prod))] : []);
    const k = kinds[Math.floor(this.rand() * kinds.length)], n = 2 + Math.floor(this.rand() * 3) + (lv > 2 ? 2 : 0);
    const who = ['Boer Bram', 'Juf Lotte', 'Bakker Joris', 'Opa Kees', 'Chef Mila', 'Buurvrouw Sien'][Math.floor(this.rand() * 6)];
    return { who, item: k, n, reward: Math.round(PRODUCTS[k].price * n * 1.7) + 4 };
  }
  plant(i, id) {
    const p = this.plots[i], c = CROPS.find(x => x.id === id); if (!p || !c || p.crop || !this.unlocked(id) || this.coins < c.seed) return false;
    this.coins -= c.seed; p.crop = id; p.t = 0; this.last = id; return true;
  }
  ripe(i) { const p = this.plots[i]; if (!p || !p.crop) return false; return p.t >= CROPS.find(c => c.id === p.crop).grow; }
  harvest(i) { if (!this.ripe(i)) return false; const p = this.plots[i]; this.barn[p.crop]++; p.crop = null; p.t = 0; this.harvests++; return true; }
  water() { if (!this.plots.some(p => p.crop)) { this.wet = Math.max(this.wet, 15); return true; } this.wet = 30 + 12 * this.up.can; this.waterTimes++; return true; }
  feed() { this.fedTimes++; this.animals.forEach(a => { a.fed += 3 + this.up.voer; }); return this.animals.length > 0; }
  hungry() { return this.animals.some(a => a.fed <= 0); }
  barnValue() { let v = 0; for (const k in this.barn) v += this.barn[k] * PRODUCTS[k].price; return Math.round(v * this.priceMult()); }
  sell(bonus) { // bonus 2 = vraag goed, 1 = fout
    const v = this.barnValue(); if (v <= 0) return 0;
    const g = this.gain(v * (bonus || 1)); this.sold += g; for (const k in this.barn) this.barn[k] = 0; return g;
  }
  deliver(idx) {
    const o = this.orders[idx]; if (!o || this.barn[o.item] < o.n) return 0;
    this.barn[o.item] -= o.n; const g = this.gain(o.reward * (this.fx.cashMult || 1)); this.ordersDone++; this.orders[idx] = this.makeOrder(); return g;
  }
  plotCost() { return PLOT_COST[this.plots.length] || 0; }
  canBuyPlot() { return this.plots.length < 12 && this.coins >= this.plotCost(); }
  buyPlot() { if (!this.canBuyPlot()) return false; this.coins -= this.plotCost(); this.plots.push({ crop: null, t: 0 }); return true; }
  animalCost(id) { const a = ANIMALS.find(x => x.id === id); return Math.round(a.cost * (1 + 0.5 * this.animals.filter(x => x.type === id).length)); }
  canBuyAnimal(id) { const a = ANIMALS.find(x => x.id === id); return this.animals.filter(x => x.type === id).length < a.max && this.coins >= this.animalCost(id) && (id === 'kip' || this.level >= (id === 'koe' ? 2 : 3)); }
  buyAnimal(id) { if (!this.canBuyAnimal(id)) return false; const a = ANIMALS.find(x => x.id === id); this.coins -= this.animalCost(id); this.animals.push({ type: id, prod: a.prod, t: 0, fed: 2 }); return true; }
  upCost(id) { const u = UPS.find(x => x.id === id); return u.cost(this.up[id]); }
  canBuyUp(id) { const u = UPS.find(x => x.id === id); return this.up[id] < u.max && this.coins >= this.upCost(id); }
  buyUp(id) { if (!this.canBuyUp(id)) return false; this.coins -= this.upCost(id); this.up[id]++; return true; }
  tick(dt) {
    this.time += dt; const rate = this.wet > 0 ? 2.2 : 1; if (this.wet > 0) this.wet = Math.max(0, this.wet - dt);
    for (const p of this.plots) if (p.crop) { const g = CROPS.find(c => c.id === p.crop).grow; if (p.t < g) p.t = Math.min(g, p.t + dt * rate); }
    for (const a of this.animals) if (a.fed > 0) { a.t += dt; const per = ANIMALS.find(x => x.id === a.type).per; if (a.t >= per) { a.t -= per; a.fed--; this.barn[a.prod]++; } }
    if (this.up.tractor > 0) {
      this.tAuto += dt; const per = [0, 7, 4, 2.5][this.up.tractor];
      if (this.tAuto >= per) {
        this.tAuto = 0; const i = this.plots.findIndex((p, k) => this.ripe(k));
        if (i >= 0) this.harvest(i);
        else if (this.up.tractor >= 3) { const e = this.plots.findIndex(p => !p.crop); if (e >= 0) this.plant(e, this.unlocked(this.last) ? this.last : 'wortel'); }
      }
    }
  }
}

const CSS = `
.${P}-body{flex:1;overflow:auto;padding:4px 8px 8px;display:flex;flex-direction:column;gap:6px;background:linear-gradient(#bae6fd 0,#dcfce7 90px,#86efac 100%)}
.${P}-bar{height:10px;border-radius:6px;background:rgba(0,0,0,.18);overflow:hidden}.${P}-bar i{display:block;height:100%;background:linear-gradient(90deg,#f59e0b,#22c55e);width:0}
.${P}-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.${P}-plot{position:relative;aspect-ratio:1;border:0;border-radius:14px;background:linear-gradient(#a16207,#78350f);font-size:34px;cursor:pointer;padding:0;box-shadow:inset 0 -4px 0 rgba(0,0,0,.25);transition:filter .3s}
.${P}-plot.wet{background:linear-gradient(#854d0e,#451a03)}
.${P}-plot.ripe{animation:${P}bob .8s ease-in-out infinite;box-shadow:0 0 0 3px #facc15,inset 0 -4px 0 rgba(0,0,0,.25)}
.${P}-plot.empty{opacity:.85}
.${P}-plot i{position:absolute;left:8%;right:8%;bottom:5px;height:5px;border-radius:3px;background:rgba(0,0,0,.35);overflow:hidden}.${P}-plot i b{display:block;height:100%;background:#4ade80}
.${P}-plot span{display:block;line-height:1}
@keyframes ${P}bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.${P}-panel{background:rgba(255,255,255,.72);color:#1f2937;border-radius:12px;padding:6px 8px}
body.dark .${P}-panel,:root[data-theme=dark] .${P}-panel{background:rgba(30,41,59,.85);color:#f1f5f9}
.${P}-seeds{display:flex;gap:5px;overflow-x:auto}
.${P}-seed{flex:0 0 auto;border:2px solid transparent;border-radius:12px;background:rgba(255,255,255,.7);color:#1f2937;padding:3px 8px;font:inherit;font-weight:700;font-size:13px;cursor:pointer;min-height:44px;text-align:center}
.${P}-seed.on{border-color:#16a34a;background:#dcfce7}.${P}-seed.lock{opacity:.4}
.${P}-act{display:flex;gap:6px}.${P}-act button{flex:1;margin:0;padding:8px 4px;font-size:14px}
.${P}-ani{display:flex;gap:4px;flex-wrap:wrap;min-height:34px;align-items:center;font-size:24px}
.${P}-ani span{position:relative}.${P}-ani span.hun{filter:grayscale(1);opacity:.6}
.${P}-ord{display:flex;gap:6px;overflow-x:auto}
.${P}-oc{flex:0 0 auto;min-width:118px;border-radius:12px;padding:4px 8px;font-size:12px;background:rgba(255,255,255,.78);color:#1f2937;border:2px solid transparent}
.${P}-oc.ready{border-color:#f59e0b;cursor:pointer;background:#fef3c7}
.${P}-fl{position:absolute;pointer-events:none;font-weight:900;color:#fff;text-shadow:0 1px 3px #000;z-index:9;animation:${P}fl 1s ease-out forwards}
@keyframes ${P}fl{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-40px)}}`;

export default {
  id: 'boerderij', name: 'Boerderij', emoji: '🚜', color: '#65a30d',
  desc: 'Plant en oogst. Goede antwoorden geven water, voer en betere marktprijzen!',
  tags: ['geld', 'rustig', 'solo'], minutes: 6, duo: false,
  create(host, env) {
    const L = lifecycle(); const style = css(baseCss(P) + CSS); host.textContent = '';
    const { H } = dims(host, env);
    const root = $('div', P + '-root'); root.style.height = H + 'px'; host.appendChild(root);
    const f = new Farm({ rand: env.rand || Math.random, fx: env.fx, level: env.level });
    const target = TARGET[env.level] || TARGET[2];
    const S = mkStats(); const ov = mkOv(root, P); const asker = makeAsker(env, ov, P, L); const nextQ = qsupply(env);
    let started = false, ended = false, sel = 'wortel', busy = false, lastT = 0, lastLevel = 0;
    const hud = $('div', P + '-hud'); const chip = {}; ['coin', 'time', 'goal'].forEach(k => { chip[k] = $('span', P + '-chip'); hud.appendChild(chip[k]); });
    const barW = $('div', P + '-bar'); const bar = $('i'); barW.appendChild(bar);
    const body = $('div', P + '-body'); root.append(hud, barW, body);
    const grid = $('div', P + '-grid'); const aniP = $('div', P + '-panel'); const ani = $('div', P + '-ani'); aniP.appendChild(ani);
    const seedsP = $('div', P + '-seeds'); const ordP = $('div', P + '-ord'); const act = $('div', P + '-act'); const barnP = $('div', P + '-panel'); barnP.style.fontSize = '13px';
    body.append(grid, seedsP, barnP, aniP, ordP, act);
    const flash = (txt, el) => { const t = $('div', P + '-fl', txt); t.style.left = '40%'; t.style.top = (el ? 30 : 100) + 'px'; root.appendChild(t); L.after(() => { try { t.remove(); } catch (e) {} }, 1000); };
    const bW = $('button', P + '-btn', '💧 Gieten'), bF = $('button', P + '-btn alt', '🌾 Voeren'), bS = $('button', P + '-btn', '🛒 Verkopen'), bU = $('button', P + '-btn alt', '⬆️ Winkel');
    act.append(bW, bF, bS, bU);
    const plotEls = []; const seedEls = {};
    const rebuildPlots = () => { grid.textContent = ''; plotEls.length = 0; f.plots.forEach((p, i) => { const b = $('button', P + '-plot empty'); const em = $('span', '', ''); const pr = $('i'); const pb = $('b'); pr.appendChild(pb); b.append(em, pr); b.onclick = () => tapPlot(i); grid.appendChild(b); plotEls.push({ b, em, pb }); }); if (f.plots.length < 12) { const nb = $('button', P + '-plot empty', '➕'); nb.style.fontSize = '22px'; nb.onclick = () => { if (f.buyPlot()) { snd(env, 'munt'); rebuildPlots(); } else { snd(env, 'fout'); flash('Nog ' + (f.plotCost() - f.coins) + '🪙 nodig'); } }; const c = $('span', '', '+' + f.plotCost()); c.style.cssText = 'font-size:12px;display:block'; nb.appendChild(c); grid.appendChild(nb); } };
    CROPS.forEach(c => { const b = $('button', P + '-seed', ''); b.onclick = () => { if (f.unlocked(c.id)) { sel = c.id; snd(env, 'klik'); } }; seedsP.appendChild(b); seedEls[c.id] = b; });
    const tapPlot = (i) => {
      if (!started || ov.shown) return; const p = f.plots[i];
      if (f.ripe(i)) { const id = p.crop; f.harvest(i); snd(env, 'munt'); flash('+' + PRODUCTS[id].emoji); }
      else if (!p.crop) { if (f.plant(i, sel)) snd(env, 'klik'); else { const c = CROPS.find(x => x.id === sel); if (f.coins < c.seed) { snd(env, 'fout'); flash('Te weinig 🪙'); } } }
      refresh();
    };
    const doQ = async (kind) => {
      if (busy || !started) return; busy = true;
      const q = nextQ(); const r = await asker.ask(q, { time: 0 }); if (L.dead) return; busy = false; S.mark(r.ok);
      const bonus = r.ok ? 1 + Math.min(S.streak, 8) * (0.05 + (env.fx.streakBonus || 0)) : 0;
      if (kind === 'water') { f.water(); if (!r.ok) f.wet = Math.min(f.wet, 12); snd(env, r.ok ? 'goed' : 'fout'); flash(r.ok ? '💧 Water!' : '💧 Een beetje'); }
      else if (kind === 'feed') { f.feed(); if (!r.ok) f.animals.forEach(a => { a.fed = Math.max(a.fed - 2, 1); }); snd(env, r.ok ? 'goed' : 'fout'); flash(r.ok ? '🌾 Lekker!' : '🌾 Wat voer'); }
      else if (kind === 'sell') { const g = f.sell((r.ok ? 2 : 1) * (r.ok ? bonus / 1 : 1)); snd(env, g ? 'munt' : 'klik'); flash('+' + g + '🪙'); }
      refresh();
    };
    bW.onclick = () => doQ('water'); bF.onclick = () => { if (!f.animals.length) { flash('Nog geen dieren'); snd(env, 'fout'); return; } doQ('feed'); };
    bS.onclick = () => { if (f.barnValue() <= 0) { snd(env, 'fout'); flash('Schuur is leeg'); return; } doQ('sell'); };
    bU.onclick = () => { if (!started) return; shop(); };
    const shop = () => {
      const w = $('div'); const co = $('p', '', ''); const row = $('div', P + '-row');
      const draw = () => { co.textContent = '🪙 ' + fmtN(f.coins); row.textContent = '';
        const add = (emoji, name, desc, cost, can, fn) => { const c = $('div', P + '-shopi'); c.append($('div', P + '-big', emoji), $('b', '', name), $('small', '', desc)); const b = $('button', P + '-btn', cost == null ? 'Max' : '🪙 ' + cost); b.disabled = cost == null || !can; b.onclick = () => { if (fn()) { snd(env, 'munt'); draw(); refresh(); } }; c.appendChild(b); row.appendChild(c); };
        ANIMALS.forEach(a => { const n = f.animals.filter(x => x.type === a.id).length; const lock = a.id !== 'kip' && f.level < (a.id === 'koe' ? 2 : 3); add(a.emoji, a.name + ' (' + n + '/' + a.max + ')', lock ? 'Ontgrendelt op boerderij-level ' + (a.id === 'koe' ? 3 : 4) : a.pe + ' elke ' + a.per + ' s', n >= a.max ? null : f.animalCost(a.id), f.canBuyAnimal(a.id), () => f.buyAnimal(a.id)); });
        UPS.forEach(u => add(u.emoji, u.name + ' ' + f.up[u.id] + '/' + u.max, u.desc, f.up[u.id] >= u.max ? null : f.upCost(u.id), f.canBuyUp(u.id), () => f.buyUp(u.id)));
        const pc = f.plots.length >= 12 ? null : f.plotCost(); add('🟫', 'Extra akker (' + f.plots.length + '/12)', 'Meer plek om te planten.', pc, f.canBuyPlot(), () => { const r = f.buyPlot(); if (r) rebuildPlots(); return r; });
      };
      draw(); w.append(co, row); ov.show(card(P, { emoji: '🏪', title: 'Winkel', extra: w, btn: 'Terug naar de boerderij', onBtn: () => ov.hide() }));
    };
    const finish = () => {
      if (ended) return; ended = true; const win = f.earned >= target;
      env.end({ score: Math.round(f.earned), win, stats: { correct: S.correct, wrong: S.wrong, best: S.best, geoogst: f.harvests, opdrachten: f.ordersDone, dieren: f.animals.length }, summary: 'Je verdiende ' + fmtN(f.earned) + ' 🪙 (doel ' + fmtN(target) + '). ' + f.ordersDone + ' opdrachten klaar.' });
    };
    const refresh = () => {
      chip.coin.textContent = '🪙 ' + fmtN(f.coins); chip.time.textContent = '⏱ ' + Math.max(0, Math.ceil(SEASON - f.time)) + ' s' + (f.wet > 0 ? ' 💧' : '');
      chip.goal.textContent = '🎯 ' + fmtN(f.earned) + '/' + fmtN(target); bar.style.width = clamp(f.earned / target * 100, 0, 100) + '%';
      f.plots.forEach((p, i) => { const e = plotEls[i]; if (!e) return; const c = p.crop && CROPS.find(x => x.id === p.crop); const rp = f.ripe(i);
        e.em.textContent = !c ? '' : rp ? c.emoji : p.t > c.grow * .5 ? '🌿' : '🌱'; e.pb.style.width = c ? clamp(p.t / c.grow * 100, 0, 100) + '%' : '0%';
        e.b.className = P + '-plot ' + (!c ? 'empty' : rp ? 'ripe' : '') + (f.wet > 0 && c ? ' wet' : ''); });
      CROPS.forEach(c => { const b = seedEls[c.id]; const un = f.unlocked(c.id); b.className = P + '-seed' + (sel === c.id ? ' on' : '') + (un ? '' : ' lock'); b.textContent = un ? c.emoji + ' ' + c.name + ' · 🪙' + c.seed + '→' + c.price : '🔒 lvl ' + (CROPS.indexOf(c) + 1); });
      barnP.textContent = '🧺 Schuur: ' + (Object.keys(f.barn).filter(k => f.barn[k] > 0).map(k => PRODUCTS[k].emoji + f.barn[k]).join('  ') || 'leeg') + '  (≈ 🪙' + f.barnValue() + ')';
      ani.textContent = ''; if (!f.animals.length) ani.textContent = '🐣 Nog geen dieren. Koop een kip in de winkel!'; f.animals.forEach(a => { const s = $('span', a.fed <= 0 ? 'hun' : '', ANIMALS.find(x => x.id === a.type).emoji + (a.fed <= 0 ? '💤' : '')); ani.appendChild(s); });
      ordP.textContent = ''; f.orders.forEach((o, i) => { const ready = f.barn[o.item] >= o.n; const c = $('div', P + '-oc' + (ready ? ' ready' : ''), ''); c.textContent = o.who + ': ' + o.n + '× ' + PRODUCTS[o.item].emoji + ' → 🪙' + o.reward + (ready ? ' ✔ tik!' : ' (' + f.barn[o.item] + '/' + o.n + ')'); c.onclick = () => { if (ready) { const g = f.deliver(i); snd(env, 'level'); flash('+' + g + '🪙 opdracht!'); refresh(); } }; ordP.appendChild(c); });
      bF.style.outline = f.hungry() && f.animals.length ? '3px solid #f59e0b' : ''; bS.style.outline = f.barnValue() >= 25 ? '3px solid #facc15' : '';
      if (f.level > lastLevel) { lastLevel = f.level; if (f.level > 0) { snd(env, 'level'); flash('🌟 Nieuw gewas!'); } }
    };
    rebuildPlots(); refresh();
    L.every(() => {
      if (!started) return; const now = performance.now(); const dt = Math.min(1, (now - lastT) / 1000); lastT = now;
      if (ov.shown) return; f.tick(dt); refresh(); if (f.time >= SEASON) finish();
    }, 250);
    ov.show(card(P, { emoji: '🚜', title: 'Boerderij', text: 'Plant gewassen, tik om te oogsten. Water en voer met een vraag; een goede marktvraag geeft dubbele prijs. Haal het doel binnen ' + SEASON / 60 + ' minuten!', btn: 'Tik om te beginnen', onBtn: () => { ov.hide(); started = true; lastT = performance.now(); snd(env, 'klik'); tapPlot(0); } }));
    return { destroy() { asker.cancel(); L.kill(); try { style.remove(); } catch (e) {} host.textContent = ''; } };
  }
};
