// Learn Spel 14: Boerderij. Plant, water (vraag!), oogst, voer dieren (vraag!), verkoop op de markt (vraag = dubbele prijs), koop upgrades.
// Gebouwd uit tools/learn-stubs/src-c/boerderij.src.js (hulpjes ingebouwd).
//@HELPERS
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
