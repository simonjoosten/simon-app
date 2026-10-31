// Vissen – goed antwoord = vis aan de haak. Verkoop je vangst (let op prijspieken!), koop betere hengel, boot, aas en koelbox.
// Pure visserslogica (Fishing) is los exporteerbaar voor bot-simulaties.

import { attachWorld, fxLayer, gearBtn, iel, di, palette, softShadow, glow, hexA, mix } from './_gxa.js?v=1';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const ZONES = [
  { id: 0, name: 'Vijver', emoji: '🏞️', sky: ['#7dd3fc', '#e0f2fe'], water: ['#38bdf8', '#0369a1'] },
  { id: 1, name: 'Meer', emoji: '🏔️', sky: ['#93c5fd', '#dbeafe'], water: ['#2563eb', '#1e3a8a'] },
  { id: 2, name: 'Zee', emoji: '🌊', sky: ['#fdba74', '#fef3c7'], water: ['#0e7490', '#164e63'] },
  { id: 3, name: 'Diepzee', emoji: '🌌', sky: ['#4338ca', '#a78bfa'], water: ['#1e1b4b', '#020617'] },
];
export const FISH = [
  { id: 'baars', name: 'Stekelbaars', emoji: '🐟', icon: 'fish', value: 6, zone: 0, w: 10, rod: 0 },
  { id: 'goud', name: 'Goudvis', emoji: '🐠', icon: 'fish', value: 11, zone: 0, w: 6, rod: 0 },
  { id: 'garnaal', name: 'Garnaal', emoji: '🦐', value: 16, zone: 0, w: 3, rod: 1 },
  { id: 'laars', name: 'Oude laars', emoji: '🥾', value: 1, zone: 0, w: 2, rod: 0, junk: true },
  { id: 'eend', name: 'Badeend', emoji: '🦆', icon: 'duck', value: 14, zone: 0, w: 4, rod: 0 },
  { id: 'karper', name: 'Karper', emoji: '🐟', icon: 'fish', value: 24, zone: 1, w: 10, rod: 0 },
  { id: 'kogel', name: 'Kogelvis', emoji: '🐡', value: 38, zone: 1, w: 6, rod: 0 },
  { id: 'krab', name: 'Krab', emoji: '🦀', icon: 'crab', value: 52, zone: 1, w: 4, rod: 1 },
  { id: 'schelp', name: 'Parelschelp', emoji: '🐚', icon: 'shell', value: 62, zone: 1, w: 4, rod: 1 },
  { id: 'kikker', name: 'Gouden kikker', emoji: '🐸', icon: 'frog', value: 85, zone: 1, w: 2, rod: 2 },
  { id: 'tonijn', name: 'Tonijn', emoji: '🐟', icon: 'fish', value: 100, zone: 2, w: 10, rod: 0 },
  { id: 'inkt', name: 'Inktvis', emoji: '🦑', value: 150, zone: 2, w: 6, rod: 1 },
  { id: 'kwal', name: 'Gloedkwal', emoji: '🪼', icon: 'jellyfish', value: 185, zone: 2, w: 4, rod: 1 },
  { id: 'schild', name: 'Zeeschildpad', emoji: '🐢', icon: 'turtle', value: 220, zone: 2, w: 4, rod: 1 },
  { id: 'octo', name: 'Octopus', emoji: '🐙', icon: 'octopus', value: 310, zone: 2, w: 3, rod: 2 },
  { id: 'haai', name: 'Haai', emoji: '🦈', icon: 'shark', value: 520, zone: 2, w: 2, rod: 3 },
  { id: 'kreeft', name: 'Kreeft', emoji: '🦞', value: 450, zone: 3, w: 10, rod: 1 },
  { id: 'dolfijn', name: 'Dolfijn', emoji: '🐬', value: 760, zone: 3, w: 6, rod: 2 },
  { id: 'walvis', name: 'Walvis', emoji: '🐋', icon: 'whale', value: 1300, zone: 3, w: 3, rod: 3 },
  { id: 'meermin', name: 'Zeemeermin', emoji: '🧜', icon: 'mermaid', value: 1800, zone: 3, w: 2, rod: 3 },
  { id: 'schat', name: 'Schatkist', emoji: '💎', icon: 'chest', value: 2600, zone: 3, w: 1, rod: 4 },
  { id: 'kroon', name: 'Zeekoningskroon', emoji: '👑', icon: 'crown', value: 4200, zone: 3, w: 0.6, rod: 4 },
];
export const UPG = [
  { id: 'rod', name: 'Hengel', icon: 'fish', emoji: '🎣', desc: 'Zeldzamere en waardevollere vis', cost: [55, 190, 650, 2300, 8500] },
  { id: 'boat', name: 'Boot', icon: 'boat', emoji: '⛵', desc: 'Nieuwe viswateren', cost: [110, 560, 2800] },
  { id: 'bait', name: 'Aas', icon: 'apple', emoji: '🪱', desc: 'Kans op een dubbele vangst', cost: [45, 170, 560, 1900, 6500] },
  { id: 'cooler', name: 'Koelbox', icon: 'milk', emoji: '🧊', desc: 'Ruimte voor meer vis', cost: [40, 140, 480, 1700] },
  { id: 'market', name: 'Markt', icon: 'shop', emoji: '🏪', desc: 'Hogere verkoopprijs', cost: [75, 280, 1000, 3800] },
  // ---- nieuw
  { id: 'radar', name: 'Visradar', icon: 'compass', emoji: '🧭', desc: 'Gouden haak komt sneller (elke 5 - niveau goede antwoorden)', cost: [90, 380, 1500] },
  { id: 'lamp', name: 'Dieptelamp', icon: 'lightbulb', emoji: '💡', desc: 'Vis uit zee en diepzee is meer waard', cost: [300, 1200, 4800] },
];
export const CAPS = [6, 10, 15, 22, 32];
const GOLDEN_STREAK = 5;
export const goldenEvery = (st) => Math.max(2, GOLDEN_STREAK - st.up.radar);

export function newFishing(opts = {}) {
  const fx = opts.fx || {};
  return { rand: opts.rand || Math.random, fx, coins: (fx.startCash || 0), earned: 0, up: { rod: 0, boat: 0, bait: 0, cooler: 0, market: 0, radar: 0, lamp: 0 }, zone: 0, inv: [], caught: {}, streak: 0, best: 0, correct: 0, wrong: 0, catches: 0, shield: fx.shield || 0, golden: false, tournament: !!opts.tournament, market: { mult: 1, t: 0, next: opts.tournament ? 10 : 38 }, t: 0, sold: 0, buys: 0, ev: [] };
}
export const cap = (st) => CAPS[st.up.cooler];
export const unlockedZones = (st) => st.up.boat + 1;
export function upCost(st, id) { const u = UPG.find((x) => x.id === id); const l = st.up[id]; return l >= u.cost.length ? null : u.cost[l]; }
export function buy(st, id) {
  const c = upCost(st, id); if (c == null || st.coins < c) return false;
  st.coins -= c; st.up[id]++; st.buys++;
  if (id === 'boat') st.zone = st.up.boat; // meteen naar het nieuwe water
  return true;
}
export function rollFish(st) {
  const rod = st.up.rod, luck = (st.fx.luck || 0);
  let list = FISH.filter((f) => f.zone === st.zone);
  if (st.golden) list = list.filter((f) => !f.junk && f.w <= 4);
  const ws = list.map((f) => f.w * (f.junk ? Math.max(0.2, 1 - 0.18 * rod) : f.w <= 4 ? 1 + 0.45 * rod + luck * 0.8 : 1) * (rod < f.rod ? 0.2 : 1));
  let r = st.rand() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) { r -= ws[i]; if (r <= 0) return list[i]; }
  return list[list.length - 1];
}
export function fishValue(st, f, streak) {
  return Math.max(1, Math.round(f.value * (1 + 0.12 * st.up.rod) * (1 + Math.min(streak, 10) * (0.035 + (st.fx.streakBonus || 0))) * (1 + 0.12 * st.up.market) * (f.zone >= 2 ? 1 + 0.15 * st.up.lamp : 1) * (st.fx.cashMult || 1)));
}
export function inventoryValue(st) { return st.inv.reduce((s, x) => s + Math.round(x.v * st.market.mult), 0); }
export function sellAll(st) {
  const g = inventoryValue(st); if (!st.inv.length) return 0;
  st.coins += g; st.earned += g; st.sold += st.inv.length; st.inv = []; return g;
}
// antwoord: levert { fish:[{f,v,isNew}], miss, soldAuto }
export function answer(st, ok, ms) {
  if (!ok) {
    st.streak = 0; st.wrong++;
    if (st.shield > 0) { st.shield--; return { miss: true, shielded: true, fish: [] }; }
    return { miss: true, fish: [] };
  }
  st.streak++; st.best = Math.max(st.best, st.streak); st.correct++;
  const n = 1 + (st.rand() < 0.1 * st.up.bait ? 1 : 0);
  const out = [];
  let soldAuto = 0;
  for (let i = 0; i < n; i++) {
    const f = rollFish(st); st.golden = false;
    const v = fishValue(st, f, st.streak) * (ms < 4000 ? 1 : 1);
    const isNew = !st.caught[f.id]; st.caught[f.id] = (st.caught[f.id] || 0) + 1; st.catches++;
    if (isNew && !f.junk) { st.coins += Math.round(v * 0.5); st.earned += Math.round(v * 0.5); }
    if (st.inv.length >= cap(st)) soldAuto += sellAll(st);
    st.inv.push({ f, v }); out.push({ f, v, isNew });
  }
  if (st.streak > 0 && st.streak % goldenEvery(st) === 0) st.golden = true;
  return { fish: out, soldAuto, golden: st.golden };
}
export function step(st, dt) {
  st.t += dt; const m = st.market;
  if (m.mult > 1) { m.t -= dt; if (m.t <= 0) { m.mult = 1; m.next = st.t + (st.tournament ? 16 + st.rand() * 6 : 35 + st.rand() * 15); } }
  else if (st.t >= m.next) { m.mult = 2; m.t = st.tournament ? 9 : 12; return 'peak'; }
  return null;
}
export function collection(st) { return Object.keys(st.caught).filter((k) => !FISH.find((f) => f.id === k).junk).length; }
export const SPECIES = FISH.filter((f) => !f.junk).length;
export function autoBuy(st) { for (let k = 0; k < 5; k++) { let best = null, bc = Infinity; for (const u of UPG) { if ((u.id === 'radar' && st.up.boat < 1) || (u.id === 'lamp' && st.up.boat < 2)) continue; const c = upCost(st, u.id); if (c != null && c <= st.coins && c < bc) { best = u.id; bc = c; } } if (!best) break; buy(st, best); } }

// ---------------------------------------------------------------------------------------------
const E = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const clr = (e) => { while (e.firstChild) e.removeChild(e.firstChild); };
const addCss = (id, t) => { const s = document.createElement('style'); s.setAttribute('data-learn-g', id); s.textContent = t; document.head.appendChild(s); return s; };
const fmt = (n) => { n = Math.round(n); return n >= 1e4 ? (n / 1e3).toFixed(1).replace('.', ',') + 'K' : String(n); };
const EF = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
// vis-icoon (of emoji als er geen 3D-icoon voor bestaat)
const fiel = (f, size, cls) => { if (f.icon) return iel(f.icon, size, cls); const s = E('span', 'gx-ie ' + (cls || ''), f.emoji); s.style.fontSize = Math.round(size * 0.8) + 'px'; s.style.width = s.style.height = size + 'px'; return s; };
const CW = 360, CH = 250, SEA = 84;
const CSS = `
.vi-root{position:relative;display:flex;flex-direction:column;gap:8px;width:100%;height:100%;min-height:460px;padding:8px;box-sizing:border-box;color:var(--ink);overflow:auto;font-size:calc(16px*var(--gfx-font,1))}
.vi-root *{box-sizing:border-box}
.vi-cv{width:100%;max-width:560px;align-self:center;aspect-ratio:${CW}/${CH};border-radius:18px;border:3px solid color-mix(in srgb,var(--line) 70%,#000);display:block;background:#0369a1;box-shadow:0 8px 22px #0005}
.vi-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.vi-chip{background:color-mix(in srgb,var(--card) 92%,transparent);border:1px solid var(--line);border-radius:14px;padding:6px 11px;font-weight:800;font-size:calc(15px*var(--gfx-font,1));white-space:nowrap;display:flex;gap:5px;align-items:center;min-height:44px}
.vi-chip.peak{background:#fde047;color:#422006;animation:vi-p .6s infinite alternate}
@keyframes vi-p{to{transform:scale(1.05)}}
.vi-sell{margin-left:auto;border:0;border-radius:14px;background:linear-gradient(135deg,#22c55e,#15803d);color:#fff;font:inherit;font-weight:900;font-size:calc(16px*var(--gfx-font,1));padding:8px 16px;min-height:48px;cursor:pointer;display:flex;gap:6px;align-items:center}
.vi-sell[disabled]{opacity:.45}
.vi-zone{border:2px solid var(--line);background:color-mix(in srgb,var(--card) 92%,transparent);color:var(--ink);border-radius:12px;font:inherit;font-size:calc(14px*var(--gfx-font,1));padding:6px 12px;min-height:44px;cursor:pointer;font-weight:700}
.vi-zone.on{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 30%,transparent)}
.vi-zone[disabled]{opacity:.35}
.vi-shop{display:grid;grid-template-columns:repeat(auto-fit,minmax(calc(76px*var(--gfx-scale,1)),1fr));gap:6px}
.vi-up{border:2px solid var(--line);background:color-mix(in srgb,var(--card) 94%,transparent);color:var(--ink);border-radius:14px;padding:5px 2px;font:inherit;font-size:calc(12px*var(--gfx-font,1));text-align:center;cursor:pointer;opacity:.65;line-height:1.1;min-height:calc(78px*var(--gfx-scale,1))}
.vi-up .e{display:block;margin:0 auto}.vi-up b{display:block}.vi-up .c{font-weight:900;font-size:calc(14px*var(--gfx-font,1));display:block}
.vi-up.can{opacity:1;border-color:#22c55e;box-shadow:0 0 0 2px #22c55e44}
.vi-q{flex:1;min-height:160px;background:color-mix(in srgb,var(--card) 93%,transparent);border:1px solid var(--line);border-radius:18px;padding:8px;overflow:auto}
.vi-ov{position:absolute;inset:0;background:color-mix(in srgb,var(--card) 88%,transparent);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;padding:18px;z-index:40}
.vi-ov h2{margin:0;font-size:calc(30px*var(--gfx-font,1))}.vi-ov p{margin:0;max-width:340px;opacity:.9;line-height:1.4}
.vi-btn{border:0;background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff;border-radius:18px;font:inherit;font-weight:900;font-size:calc(19px*var(--gfx-font,1));padding:14px 28px;min-height:54px;cursor:pointer;box-shadow:0 6px 16px #2563eb66}
.vi-btn.alt{background:linear-gradient(135deg,#f59e0b,#ef4444);box-shadow:0 6px 16px #ef444466}
`;

export default {
  id: 'vissen', name: 'Vissen', emoji: '🎣', color: '#0ea5e9',
  desc: 'Elk goed antwoord haalt een vis binnen (21 soorten). Verkoop slim, koop betere spullen, of speel het snelle vistoernooi!',
  tags: ['geld', 'rustig', 'upgrades', 'toernooi'], minutes: 4, duo: false,
  create(host, env) {
    const style = addCss('vissen', CSS);
    const f0 = env.fx || {};
    const fx = { startCash: clamp(+f0.startCash || 0, 0, 5000), cashMult: clamp(+f0.cashMult || 1, 0.5, 5), streakBonus: clamp(+f0.streakBonus || 0, 0, 0.5), luck: clamp(+f0.luck || 0, 0, 1), shield: Math.round(clamp(+f0.shield || 0, 0, 5)), hints: Math.round(clamp(+f0.hints || 0, 0, 5)) };
    let st = newFishing({ fx, rand: env.rand });
    let LIMIT = 240 + clamp(+f0.timeBonus || 0, 0, 60), tournament = false;
    let timeLeft = LIMIT;
    const root = E('div', 'vi-root'); host.appendChild(root);
    const bgw = attachWorld(root, env, 'vissen'); const fl = fxLayer(root, env);
    const world = bgw.world, pal = palette(world);
    let dead = false, ended = false, cur = null, started = false, raf = 0, last = 0, nQ = 0, queue = [], uiT = 0, seen = new Set();
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
    const qq = () => (env.gfx && env.gfx.q != null ? env.gfx.q : 1);
    const cv = E('canvas', 'vi-cv'); const dpr = Math.min(2, Math.max(1, globalThis.devicePixelRatio || 1) * ((env.gfx && env.gfx.q === 0) ? 1 : 1.25)); cv.width = Math.round(CW * dpr); cv.height = Math.round(CH * dpr); const ctx = cv.getContext('2d');
    const row1 = E('div', 'vi-row'); const cCoins = E('div', 'vi-chip'), cInv = E('div', 'vi-chip'), cTime = E('div', 'vi-chip'), cBook = E('div', 'vi-chip'); const sellBtn = E('button', 'vi-sell'); sellBtn.type = 'button';
    row1.append(cCoins, cInv, cTime, cBook, sellBtn, gearBtn());
    const row2 = E('div', 'vi-row'); const zoneBtns = ZONES.map((z) => { const b = E('button', 'vi-zone', z.emoji + ' ' + z.name); b.type = 'button'; b.addEventListener('click', () => { if (z.id < unlockedZones(st)) { st.zone = z.id; env.snd.play('klik'); refresh(); } }); row2.appendChild(b); return b; });
    const shop = E('div', 'vi-shop'); const upEls = {};
    for (const u of UPG) { const b = E('button', 'vi-up'); b.type = 'button'; b.title = u.desc; const c = E('span', 'c'), nm = E('b'); b.append(iel(u.icon, 36, 'e'), nm, c); b.addEventListener('click', () => { if (!started || ended) return; if (buy(st, u.id)) { env.snd.play('power'); toast(u.name + ' niveau ' + st.up[u.id], u.icon); fl.burstEl(b, 'sparkle', 12); } else env.snd.play('klik'); refresh(); }); upEls[u.id] = { b, c, nm }; shop.appendChild(b); }
    const qhost = E('div', 'vi-q');
    root.append(cv, row1, row2, shop, qhost);
    sellBtn.addEventListener('click', () => { if (!started || ended) return; const g = sellAll(st); if (g) { env.snd.play('munt'); popups.push({ t: 1.2, max: 1.2, s: '+' + fmt(g), x: 300, y: 70, c: '#fde047' }); fl.burstEl(sellBtn, 'coins', 10); } refresh(); });
    const toRoot = (x, y) => { try { const a = cv.getBoundingClientRect(), b = root.getBoundingClientRect(), k = (a.width || CW) / CW; return [a.left - b.left + x * k, a.top - b.top + y * k]; } catch (e) { return [x, y]; } };

    const popups = [];
    let toastEl = null;
    function toast(t, icon) { if (toastEl) toastEl.remove(); toastEl = E('div', 'vi-chip'); if (icon) toastEl.appendChild(iel(icon, 26)); toastEl.appendChild(E('span', '', t)); toastEl.style.cssText = 'position:absolute;left:50%;top:8px;transform:translateX(-50%);z-index:35;background:#111d;color:#fff'; root.appendChild(toastEl); const el = toastEl; later(() => el.remove(), 1800); }
    const chip = (el, ico, txt, cls) => { clr(el); el.append(iel(ico, 26), E('span', '', txt)); if (cls != null) el.className = 'vi-chip ' + cls; };
    function refresh() {
      const m = Math.max(0, Math.floor(timeLeft));
      chip(cCoins, 'coin', fmt(st.coins)); chip(cInv, st.market.mult > 1 ? 'flame' : 'bag', (st.market.mult > 1 ? 'PRIJSPIEK x2 · ' : '') + st.inv.length + '/' + cap(st) + ' = ' + fmt(inventoryValue(st)), st.market.mult > 1 ? 'peak' : ''); chip(cTime, 'hourglass', Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'));
      chip(cBook, 'book', collection(st) + '/' + SPECIES + (st.golden ? ' *' : ''));
      clr(sellBtn); sellBtn.append(iel('money', 28), E('span', '', 'Verkoop')); sellBtn.disabled = !st.inv.length;
      zoneBtns.forEach((b, i) => { b.disabled = i >= unlockedZones(st); b.className = 'vi-zone' + (st.zone === i ? ' on' : ''); });
      for (const u of UPG) { const c = upCost(st, u.id), el = upEls[u.id]; el.c.textContent = c == null ? 'MAX' : fmt(c); el.nm.textContent = u.name + ' ' + st.up[u.id]; el.b.className = 'vi-up' + (c != null && st.coins >= c ? ' can' : ''); }
    }

    // ---- tekenen
    const wdeco = (world.deco && world.deco.length ? world.deco : ['shell']);
    const swim = ['fish', 'jellyfish', 'turtle', 'fish', 'crab', 'whale'];
    const deco = []; for (let i = 0; i < 8; i++) deco.push({ x: (i * 53) % CW, y: SEA + 34 + (i * 37) % (CH - SEA - 60), v: 12 + (i * 7) % 18, dir: i % 2 ? 1 : -1, n: swim[i % swim.length], s: 20 + (i * 3) % 10 });
    let anim = null;
    function draw() {
      const q = qq();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, CW, CH);
      const Z = ZONES[st.zone], tt = st.t;
      const sky = ctx.createLinearGradient(0, 0, 0, SEA); const bc = world.bg; sky.addColorStop(0, bc[0]); sky.addColorStop(1, bc[bc.length - 1]); ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, SEA);
      // wereld-decoratie in de lucht en op de horizon
      di(ctx, wdeco[(st.zone) % wdeco.length], 52, 38, 46, { q, shadow: false });
      di(ctx, wdeco[(st.zone + 2) % wdeco.length], (tt * 6) % (CW + 80) - 40, 24, 36, { q, shadow: false });
      di(ctx, wdeco[(st.zone + 1) % wdeco.length], (tt * 4 + 190) % (CW + 80) - 40, 52, 30, { q, shadow: false });
      const w0 = mix(Z.water[0], world.accent, 0.22), w1 = mix(Z.water[1], world.accent, 0.12);
      const wat = ctx.createLinearGradient(0, SEA, 0, CH); wat.addColorStop(0, w0); wat.addColorStop(1, w1); ctx.fillStyle = wat; ctx.fillRect(0, SEA, CW, CH - SEA);
      if (q > 0) { ctx.fillStyle = '#ffffff22'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(40 + i * 75, SEA); ctx.lineTo(70 + i * 75, SEA); ctx.lineTo(30 + i * 75 + Math.sin(tt + i) * 14, CH); ctx.lineTo(5 + i * 75 + Math.sin(tt + i) * 14, CH); ctx.fill(); } }
      ctx.strokeStyle = '#ffffff88'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = 0; x <= CW; x += 8) ctx.lineTo(x, SEA + Math.sin(x / 14 + tt * 2) * 2); ctx.stroke();
      for (const d of deco) { d.x += d.dir * d.v * 0.016; if (d.x > CW + 20) d.x = -20; if (d.x < -20) d.x = CW + 20; ctx.save(); ctx.translate(d.x, d.y + Math.sin(tt * 2 + d.v) * 3); ctx.scale(-d.dir, 1); ctx.globalAlpha = 0.6; di(ctx, d.n, 0, 0, d.s, { q, shadow: false }); ctx.restore(); }
      ctx.globalAlpha = 1;
      // bodem met wereld-decoratie
      ctx.fillStyle = hexA(pal.pathEdge, 0.55); ctx.fillRect(0, CH - 10, CW, 10);
      for (let i = 0; i < 4; i++) di(ctx, wdeco[(i + st.zone) % wdeco.length], 26 + i * 98, CH - 20, 30, { q });
      // boot
      const bob = Math.sin(tt * 2) * 2.5, bx = 120, by = SEA - 8 + bob;
      const boatIcon = st.up.boat >= 3 ? 'submarine' : st.up.boat >= 2 ? 'ship' : 'boat';
      di(ctx, boatIcon, bx, by - 6, 92, { q });
      di(ctx, 'cat', bx - 8, by - 38, 38, { q, shadow: false });
      const tipX = bx + 36, tipY = by - 46; ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx + 4, by - 26); ctx.lineTo(tipX, tipY); ctx.stroke();
      let hookX = tipX + 18, hookY = SEA + 40 + Math.sin(tt * 1.5) * 4, fishE = null, fishX = 0, fishY = 0;
      if (anim) {
        const p = clamp(anim.t / anim.dur, 0, 1);
        if (anim.ok) { const down = p < 0.4 ? p / 0.4 : 1; const up = p < 0.4 ? 0 : (p - 0.4) / 0.6; hookY = SEA + 20 + down * (anim.y - SEA - 20) * (1 - up); fishE = anim.fish; fishX = hookX; fishY = hookY; if (up > 0.7) { const j = (up - 0.7) / 0.3; fishX = hookX - j * 50; fishY = Math.min(hookY, SEA) - Math.sin(j * 3.14) * 40 - j * 10; if (!anim.splash) { anim.splash = true; const [rx, ry] = toRoot(hookX, SEA); fl.burst(rx, ry, 'bubbles', 10); } } if (up >= 0.99) fishE = null; }
        else { hookY = SEA + 20 + Math.sin(p * 9) * 6 + p * 40; }
      }
      ctx.strokeStyle = '#ffffffcc'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.quadraticCurveTo(tipX + 14, hookY * 0.6 + tipY * 0.4, hookX, hookY); ctx.stroke();
      ctx.beginPath(); ctx.arc(hookX, hookY + 3, 3, 0, 6.2832); ctx.strokeStyle = '#e5e7eb'; ctx.stroke();
      if (fishE) { if (fishE.icon) di(ctx, fishE.icon, fishX, fishY + 4, fishE.junk ? 34 : 46, { q, shadow: false }); else { ctx.font = (fishE.junk ? 26 : 34) + 'px ' + EF; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(fishE.emoji, fishX, fishY + 8); } }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let i = popups.length - 1; i >= 0; i--) { const p = popups[i], a = clamp(p.t / p.max, 0, 1); ctx.globalAlpha = a; ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = p.c; ctx.strokeStyle = '#0009'; ctx.lineWidth = 3; ctx.strokeText(p.s, p.x, p.y - (1 - a) * 28); ctx.fillText(p.s, p.x, p.y - (1 - a) * 28); ctx.globalAlpha = 1; }
      if (st.market.mult > 1) { ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#0009'; ctx.lineWidth = 3; const t = 'Prijspiek: verkoop nu! (' + Math.ceil(st.market.t) + ' s)'; ctx.strokeText(t, CW / 2, 10); ctx.fillText(t, CW / 2, 10); }
      ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.fillText(Z.emoji + ' ' + Z.name, CW - 8, CH - 18); ctx.textAlign = 'center';
    }

    // ---- vragen
    function takeQ() {
      if (!queue.length) { try { queue = env.pick(12) || []; } catch (e) { queue = []; } }
      return queue.shift() || { t: 'num', q: 'Wat is ' + (3 + (nQ % 6)) + ' + ' + (2 + (nQ % 4)) + '?', a: 5 + (nQ % 6) + (nQ % 4) };
    }
    function nextQuestion() {
      if (dead || ended) return;
      const q = takeQ(); nQ++; clr(qhost);
      try { cur = env.ask(qhost, q, { compact: true, feedback: true, autoNext: 650, hints: fx.hints, time: env.level === 3 ? 25 : 0, label: st.golden ? 'Gouden haak: zeldzame vis!' : 'Vang een vis' }); } catch (e) { cur = { promise: Promise.resolve({ ok: false, ms: 0 }), cancel() {} }; }
      const h = cur;
      h.promise.then((r) => {
        if (dead || ended || cur !== h) return; cur = null; r = r || {};
        try { env.report({ q, ok: !!r.ok, ms: r.ms || 0 }); } catch (e) { /* hub */ }
        const res = answer(st, !!r.ok, r.ms || 9999);
        if (res.miss) { anim = { t: 0, dur: 0.9, ok: false }; env.snd.play('fout'); popups.push({ t: 1, max: 1, s: res.shielded ? 'net gered!' : 'Mis!', x: 200, y: 110, c: '#fca5a5' }); }
        else {
          const first = res.fish[0]; anim = { t: 0, dur: 1.3, ok: true, fish: first.f, y: SEA + 50 + st.rand() * 80 };
          env.snd.play(first.f.junk ? 'tik' : first.v >= 100 ? 'power' : 'munt');
          res.fish.forEach((c, i) => popups.push({ t: 1.6, max: 1.6, s: c.f.name + (c.isNew && !c.f.junk ? ' NIEUW!' : '') + ' +' + fmt(c.v), x: 215, y: 62 - i * 20, c: c.isNew ? '#a7f3d0' : '#fff' }));
          if (res.fish.some((c) => c.isNew && !c.f.junk)) fl.burstEl(cBook, 'stars', 12);
          if (res.fish.some((c) => c.v >= 300)) fl.burstEl(cCoins, 'coins', 8);
          if (res.soldAuto) { popups.push({ t: 1.6, max: 1.6, s: 'Koelbox vol: verkocht +' + fmt(res.soldAuto), x: 215, y: 100, c: '#fde047' }); }
          if (res.golden) toast('Gouden haak! Volgende vangst is zeldzaam', 'star');
        }
        refresh(); later(nextQuestion, 120);
      }).catch(() => { if (!dead && !ended && cur === h) { cur = null; later(nextQuestion, 300); } });
    }

    function loop() {
      raf = 0; if (dead) return;
      if (host.isConnected === false) { later(loop, 500); last = performance.now(); return; }
      const now = performance.now(); const dt = clamp((now - last) / 1000, 0, 0.1); last = now;
      if (started && !ended) {
        timeLeft -= dt; const ev = step(st, dt); if (ev === 'peak') { toast('Prijspiek! Alles x2 voor ' + (tournament ? 9 : 12) + ' s', 'flame'); env.snd.play('level'); fl.burstEl(cInv, 'sparkle', 16); }
        if (anim) { anim.t += dt; if (anim.t > anim.dur) anim = null; }
        for (let i = popups.length - 1; i >= 0; i--) { popups[i].t -= dt; if (popups[i].t <= 0) popups.splice(i, 1); }
        uiT += dt; if (uiT > 0.25) { uiT = 0; refresh(); }
        if (timeLeft <= 0) finish();
      }
      draw(); raf = requestAnimationFrame(loop);
    }
    function finish() {
      if (ended) return; ended = true;
      if (cur) { try { cur.cancel(); } catch (e) { /* */ } cur = null; }
      st.market.mult = 1; const g = sellAll(st); const col = collection(st);
      const score = Math.round(st.earned + col * 40);
      const ov = E('div', 'vi-ov'); const big = E('div', 'big'); big.appendChild(iel(col >= 10 ? 'trophy' : 'fish', 96));
      ov.append(big, E('h2', '', tournament ? 'Het toernooi is voorbij!' : 'De dag zit erop!'), E('p', '', 'Je verdiende ' + fmt(st.earned) + ' munten en ving ' + col + ' van de ' + SPECIES + ' soorten.' + (g ? ' (Laatste vangst verkocht: ' + fmt(g) + ')' : '')));
      root.appendChild(ov); env.snd.play('win'); fl.burst((root.clientWidth || 360) / 2, 150, 'confetti', 40);
      later(() => env.end({ score, win: null, stats: { correct: st.correct, wrong: st.wrong, 'beste reeks': st.best, vissen: st.catches, soorten: col, upgrades: st.buys }, summary: (tournament ? 'Vistoernooi: ' : '') + fmt(st.earned) + ' munten verdiend · ' + st.catches + ' vissen · ' + col + '/' + SPECIES + ' soorten.' }), 1800);
    }
    function start(mode) {
      if (started) return; started = true; tournament = mode === 'toernooi';
      if (tournament) { st = newFishing({ fx, rand: env.rand, tournament: true }); LIMIT = 120; timeLeft = LIMIT; }
      last = performance.now(); refresh(); nextQuestion();
    }
    const intro = E('div', 'vi-ov');
    const mk = (txt, cls, m) => { const b = E('button', 'vi-btn ' + cls, txt); b.type = 'button'; b.addEventListener('click', () => { intro.remove(); start(m); }); return b; };
    const bigI = E('div', 'big'); bigI.appendChild(iel('fish', 96));
    intro.append(bigI, E('h2', '', 'Vissen'), E('p', '', 'Elk goed antwoord vangt een vis. Verkoop je vangst (op een prijspiek krijg je dubbel!) en koop betere spullen.'), mk('Tik om te beginnen (4 min)', '', 'dag'), mk('Vistoernooi: 2 min, vaak prijspieken', 'alt', 'toernooi'));
    root.appendChild(intro); refresh(); last = performance.now(); raf = requestAnimationFrame(loop);

    return { destroy() { dead = true; if (raf) cancelAnimationFrame(raf); timers.forEach((t) => clearTimeout(t)); timers.clear(); if (cur) { try { cur.cancel(); } catch (e) { /* */ } cur = null; } fl.destroy(); bgw.destroy(); root.remove(); style.remove(); } };
  },
};
