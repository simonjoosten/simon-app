// Race – Grand Prix van 3 races tegen 3 bots. Gas per goed antwoord, nitro bij een reeks, auto-upgrades tussen de races.
// Pure racelogica (Race) is los exporteerbaar voor bot-simulaties.

import { attachWorld, fxLayer, gearBtn, iel, di, palette, softShadow, glow, hexA } from './_gxa.js?v=1';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const TRACK = 1000, RACES = 3, V0 = 10, MAX_T = 135;
export const POINTS = [10, 6, 3, 1];
export const PRIZE = [70, 45, 28, 14];
export const UPGR = [
  { id: 'motor', name: 'Motor', icon: 'gear', emoji: '🔧', desc: 'Hogere basissnelheid', cost: [40, 100, 200, 360] },
  { id: 'turbo', icon: 'rocket', name: 'Turbo', emoji: '🚀', desc: 'Meer gas per goed antwoord', cost: [40, 100, 200, 360] },
  { id: 'banden', icon: 'target', name: 'Banden', emoji: '🛞', desc: 'Minder slippen bij een fout', cost: [30, 80, 160, 300] },
  { id: 'aero', icon: 'cloud', name: 'Aerodynamica', emoji: '🪽', desc: 'Gas blijft langer werken', cost: [35, 90, 180, 330] },
  { id: 'nitro', icon: 'flame', name: 'Nitro', emoji: '🔥', desc: 'Grotere nitro-stoot bij 4 op rij', cost: [50, 120, 240, 420] },
];
export const VEHICLES = [
  { id: 'car', name: 'Raceauto', icon: 'car', emoji: '🏎️', speed: 1, gas: 1, slip: 1, coin: 1, info: 'Evenwichtig' },
  { id: 'truck', name: 'Truck', icon: 'truck', emoji: '🚚', speed: 0.96, gas: 1, slip: 0.45, coin: 1, info: 'Slipt bijna niet' },
  { id: 'bike', name: 'Racefiets', icon: 'bike', emoji: '🚲', speed: 0.92, gas: 1.22, slip: 0.8, coin: 1, info: 'Licht: veel gas per antwoord' },
  { id: 'tractor', name: 'Tractor', icon: 'tractor', emoji: '🚜', speed: 0.84, gas: 1.5, slip: 0.6, coin: 1.2, info: 'Traag, maar een enorme gasstoot' },
  { id: 'foodtruck', name: 'Frietwagen', icon: 'foodtruck', emoji: '🚐', speed: 0.97, gas: 1, slip: 0.9, coin: 1.6, info: 'Verdient 60% meer munten' },
];
export const TRIAL_TRACK = 1200;
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'];
const BOTS = [['Turbo Tim', '🦊', 'fox', 'car'], ['Snelle Sanne', '🐰', 'rabbit', 'bike'], ['Vlam Vince', '🐯', 'lion', 'truck'], ['Racer Roos', '🦄', 'unicorn', 'foodtruck'], ['Bliksem Bas', '🐺', 'dog', 'tractor']];

export function newRace(opts = {}) {
  const rand = opts.rand || Math.random, level = clamp(opts.level || 2, 1, 3), fx = opts.fx || {};
  const trial = !!opts.trial, veh = VEHICLES.find((v) => v.id === opts.vehicle) || VEHICLES[0];
  const names = BOTS.slice().sort(() => rand() - 0.5).slice(0, trial ? 0 : 3);
  const accBase = [0.5, 0.68, 0.8][level - 1];
  const cars = [{ id: 0, me: true, name: opts.name || 'Jij', emoji: '😎', icon: 'astronaut', vehicle: veh.icon, color: COLORS[0], x: 0, boost: 0, slip: 0, pts: 0, wheel: 0, last: 0 }];
  if (trial) cars.push({ id: 1, bot: true, ghost: true, name: 'Spookauto', emoji: '👻', icon: 'ghost', vehicle: 'car', color: COLORS[1], x: 0, boost: 0, slip: 0, pts: 0, wheel: 0, acc: 1, think: 9, timer: 9, mult: 1, last: 0 });
  names.forEach(([n, e, ic, vh], i) => cars.push({ id: i + 1, bot: true, name: n, emoji: e, icon: ic, vehicle: vh, color: COLORS[i + 1], x: 0, boost: 0, slip: 0, pts: 0, wheel: 0, acc: clamp(accBase + (rand() - 0.5) * 0.14, 0.3, 0.93), think: [8, 6.5, 5.5][level - 1] * (0.85 + rand() * 0.3), timer: 3, mult: [1.0, 1.09, 1.17][level - 1] * (0.96 + rand() * 0.08), last: 0 }));
  return { rand, level, fx, cars, veh, trial, track: trial ? TRIAL_TRACK : TRACK, races: trial ? 1 : RACES, up: { motor: 0, turbo: 0, banden: 0, aero: 0, nitro: 0 }, coins: (fx.startCash || 0) * 0.3, race: 0, phase: 'idle', cd: 3, t: 0, streak: 0, best: 0, correct: 0, wrong: 0, results: [], ev: [], noFx: !!opts.noFx, spent: 0, shield: fx.shield || 0, nitroUses: 0, placeNow: 1 };
}
const ev = (st, e) => { if (st.noFx) return; if (st.ev.length > 40) st.ev.shift(); st.ev.push(e); };
export function startRace(st) {
  st.race++; st.phase = 'countdown'; st.cd = 3.2; st.t = 0; st.streak = 0; st.ev = [];
  for (const c of st.cars) { c.x = 0; c.boost = 0; c.slip = 0; c.fin = null; c.place = 0; c.timer = 2 + st.rand() * 3; c.last = 0; }
}
export const baseSpeed = (st) => V0 * (1 + 0.065 * st.up.motor) * st.veh.speed;
export const gasPower = (st) => 6.2 * (1 + 0.22 * st.up.turbo) * (1 + (st.fx.cashMult ? (st.fx.cashMult - 1) * 0.1 : 0)) * st.veh.gas;
export const tau = (st) => 3.4 * (1 + 0.16 * st.up.aero);
export function answer(st, ok, ms) {
  const me = st.cars[0]; if (st.phase !== 'race') return { gas: 0 };
  if (!ok) {
    st.streak = 0; st.wrong++;
    if (st.shield > 0) { st.shield--; return { gas: 0, shielded: true }; }
    me.boost *= 0.2; me.slip = Math.max(0.5, 1.5 - 0.28 * st.up.banden) * st.veh.slip; ev(st, { k: 'skid', life: 0.8, max: 0.8 });
    return { gas: 0, slip: true };
  }
  st.streak++; st.best = Math.max(st.best, st.streak); st.correct++;
  let g = gasPower(st) * (ms < 4500 ? 1.15 : 1) * (1 + Math.min(st.streak, 8) * ((st.fx.streakBonus || 0) + 0.02));
  let nitro = false;
  if (st.streak % 4 === 0) { g *= 1.7 + 0.35 * st.up.nitro; nitro = true; st.nitroUses++; ev(st, { k: 'nitro', life: 1, max: 1 }); }
  me.boost += g; st.coins += Math.round((8 + (nitro ? 6 : 0)) * st.veh.coin);
  return { gas: g, nitro };
}
export function placeOf(st, car) { let p = 1; for (const c of st.cars) if (c !== car && (c.fin != null && car.fin == null ? true : c.fin != null && car.fin != null ? c.fin < car.fin : c.fin == null && car.fin == null && c.x > car.x)) p++; return p; }
export function step(st, dt) {
  for (const e of st.ev) e.life -= dt; if (st.ev.length) st.ev = st.ev.filter((e) => e.life > 0);
  if (st.phase === 'countdown') { st.cd -= dt; if (st.cd <= 0) { st.phase = 'race'; ev(st, { k: 'go', life: 1, max: 1 }); } return; }
  if (st.phase !== 'race') return;
  st.t += dt;
  const me = st.cars[0];
  for (const c of st.cars) {
    let v;
    if (c.me) v = baseSpeed(st);
    else if (c.ghost) v = V0 * 1.2;
    else {
      const rub = clamp((me.x - c.x) / 500, -0.1, 0.1); // elastiek: houdt de race spannend
      v = V0 * c.mult * (1 + rub);
      c.timer -= dt;
      if (c.timer <= 0) { c.timer += c.think * (0.8 + st.rand() * 0.4); if (st.rand() < c.acc) c.boost += 7.2 * (0.9 + st.rand() * 0.2); else { c.boost *= 0.2; c.slip = 1.3; } }
    }
    v += c.boost; if (c.slip > 0) { v *= 0.45; c.slip -= dt; }
    c.boost *= Math.exp(-dt / (c.me ? tau(st) : 3.4)); c.v = v;
    c.x += v * dt; c.wheel += v * dt * 0.8;
    if (c.fin == null && c.x >= st.track) { c.fin = st.t - (c.x - st.track) / Math.max(v, 1); }
  }
  st.placeNow = placeOf(st, me);
  if ((me.fin != null && st.t - me.fin > 1.2) || st.t > MAX_T) endRace(st);
}
function endRace(st) {
  const order = st.cars.slice().sort((a, b) => (a.fin != null && b.fin != null ? a.fin - b.fin : a.fin != null ? -1 : b.fin != null ? 1 : b.x - a.x));
  order.forEach((c, i) => { c.place = i + 1; c.pts += POINTS[i]; });
  const me = st.cars[0]; st.coins += PRIZE[me.place - 1]; st.results.push({ place: me.place, time: me.fin });
  st.phase = st.race >= st.races ? 'gameover' : 'between';
}
export function upCost(st, id) { const u = UPGR.find((x) => x.id === id); const l = st.up[id]; return l >= u.cost.length ? null : u.cost[l]; }
export function buyUp(st, id) { const c = upCost(st, id); if (c == null || st.coins < c) return false; st.coins -= c; st.spent += c; st.up[id]++; return true; }
export function autoBuy(st) { for (let k = 0; k < 5; k++) { let best = null, bc = Infinity; for (const u of UPGR) { const c = upCost(st, u.id); if (c != null && c <= st.coins && c < bc) { best = u.id; bc = c; } } if (!best) break; buyUp(st, best); } }

// ---------------------------------------------------------------------------------------------
const E = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const clr = (e) => { while (e.firstChild) e.removeChild(e.firstChild); };
const addCss = (id, t) => { const s = document.createElement('style'); s.setAttribute('data-learn-g', id); s.textContent = t; document.head.appendChild(s); return s; };
const CW = 360, CH = 252, LANE = 36, ROAD_Y = 84, PX = 3.2;
const CSS = `
.ra-root{position:relative;display:flex;flex-direction:column;gap:8px;width:100%;height:100%;min-height:460px;padding:8px;box-sizing:border-box;color:var(--ink);overflow:auto;font-size:calc(16px*var(--gfx-font,1))}
.ra-root *{box-sizing:border-box}
.ra-cv{width:100%;max-width:560px;align-self:center;aspect-ratio:${CW}/${CH};border-radius:18px;border:3px solid color-mix(in srgb,var(--line) 70%,#000);display:block;background:#7dd3fc;box-shadow:0 8px 22px #0005}
.ra-info{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.ra-chip{background:color-mix(in srgb,var(--card) 92%,transparent);border:1px solid var(--line);border-radius:14px;padding:6px 12px;font-weight:800;font-size:calc(15px*var(--gfx-font,1));display:flex;gap:5px;align-items:center;min-height:44px}
.ra-q{flex:1;min-height:170px;background:color-mix(in srgb,var(--card) 93%,transparent);border:1px solid var(--line);border-radius:18px;padding:8px;overflow:auto}
.ra-ov{position:absolute;inset:0;background:color-mix(in srgb,var(--card) 90%,transparent);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;padding:16px;z-index:40;overflow:auto}
.ra-ov h2{margin:0;font-size:calc(28px*var(--gfx-font,1))}.ra-ov p{margin:0;max-width:340px;opacity:.9;line-height:1.4}
.ra-btn{border:0;background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;border-radius:18px;font:inherit;font-weight:900;font-size:calc(19px*var(--gfx-font,1));padding:14px 28px;min-height:54px;cursor:pointer;box-shadow:0 6px 16px #ef444466}
.ra-btn.alt{background:linear-gradient(135deg,#0ea5e9,#6366f1);box-shadow:0 6px 16px #6366f166}
.ra-shop{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;width:100%;max-width:420px}
.ra-up{border:2px solid var(--line);background:var(--card);color:var(--ink);border-radius:14px;padding:6px 2px;font:inherit;font-size:calc(12px*var(--gfx-font,1));cursor:pointer;opacity:.65;line-height:1.15;min-height:calc(84px*var(--gfx-scale,1))}
.ra-up .e{display:block;margin:0 auto}.ra-up b{display:block}.ra-up .c{font-weight:900;font-size:calc(14px*var(--gfx-font,1));display:block}
.ra-up.can{opacity:1;border-color:#22c55e}
.ra-veh{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;width:100%;max-width:440px}
.ra-vh{border:3px solid var(--line);background:var(--card);color:var(--ink);border-radius:16px;padding:6px 2px;font:inherit;font-size:calc(12px*var(--gfx-font,1));cursor:pointer;line-height:1.15;min-height:calc(104px*var(--gfx-scale,1))}
.ra-vh.on{border-color:#f97316;box-shadow:0 0 0 3px #f9731655}
.ra-vh .e{display:block;margin:0 auto}.ra-vh b{display:block}
.ra-vinfo{min-height:2.6em;font-size:calc(14px*var(--gfx-font,1))}
.ra-tbl{width:100%;max-width:360px;border-collapse:collapse;font-size:calc(15px*var(--gfx-font,1))}.ra-tbl td{padding:4px 6px;border-bottom:1px solid var(--line)}.ra-tbl tr.me{font-weight:900;background:color-mix(in srgb,var(--accent) 18%,transparent)}
`;

export default {
  id: 'race', name: 'Race', emoji: '🏎️', color: '#f97316',
  desc: 'Elk goed antwoord geeft gas! Kies uit 5 voertuigen en win 3 races tegen 3 bots, of probeer de tijdrit tegen de spookauto.',
  tags: ['race', 'snel', 'bots', 'tijdrit'], minutes: 5, duo: false,
  create(host, env) {
    const style = addCss('race', CSS);
    const f0 = env.fx || {};
    const fx = { startCash: clamp(+f0.startCash || 0, 0, 5000), cashMult: clamp(+f0.cashMult || 1, 0.5, 5), streakBonus: clamp(+f0.streakBonus || 0, 0, 0.5), shield: Math.round(clamp(+f0.shield || 0, 0, 5)), hints: Math.round(clamp(+f0.hints || 0, 0, 5)) };
    let st = newRace({ level: env.level || 2, rand: env.rand, fx, name: env.name });
    const root = E('div', 'ra-root'); host.appendChild(root);
    const bgw = attachWorld(root, env, 'race'); const fl = fxLayer(root, env);
    const world = bgw.world, pal = palette(world);
    let dead = false, ended = false, cur = null, started = false, raf = 0, last = 0, nQ = 0, queue = [], infoT = 0, vehicle = 'car', trial = false, seenEv = new Set();
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
    const cv = E('canvas', 'ra-cv'); const dpr = Math.min(2, Math.max(1, globalThis.devicePixelRatio || 1) * ((env.gfx && env.gfx.q === 0) ? 1 : 1.25)); cv.width = Math.round(CW * dpr); cv.height = Math.round(CH * dpr); const ctx = cv.getContext('2d');
    const qq = () => (env.gfx && env.gfx.q != null ? env.gfx.q : 1);
    const info = E('div', 'ra-info'); const cRace = E('div', 'ra-chip'), cPlace = E('div', 'ra-chip'), cCoins = E('div', 'ra-chip'), cStreak = E('div', 'ra-chip'); info.append(cRace, cPlace, cStreak, cCoins, gearBtn());
    const qhost = E('div', 'ra-q');
    root.append(cv, info, qhost);
    const chip = (el, ico, txt) => { clr(el); el.append(iel(ico, 26), E('span', '', txt)); };
    let ik = '';
    function infoUpdate() {
      const k = st.race + '|' + st.placeNow + '|' + Math.floor(st.coins) + '|' + st.streak; if (k === ik) return; ik = k;
      chip(cRace, 'flag', st.trial ? 'Tijdrit' : 'Race ' + Math.max(1, st.race) + '/' + st.races); chip(cPlace, 'trophy', st.placeNow + 'e plek'); chip(cCoins, 'coin', String(Math.floor(st.coins))); chip(cStreak, 'flame', st.streak + (st.streak % 4 === 3 ? ' (nitro!)' : ''));
    }
    const toRoot = (x, y) => { try { const a = cv.getBoundingClientRect(), b = root.getBoundingClientRect(), k = (a.width || CW) / CW; return [a.left - b.left + x * k, a.top - b.top + y * k]; } catch (e) { return [x, y]; } };

    // ---- tekenen
    const deco = (world.deco && world.deco.length ? world.deco : ['tree', 'flower']);
    const scenery = []; for (let i = 0; i < 40; i++) scenery.push({ x: 40 + i * 53 + (i * 37 % 20), n: deco[(i * 3 + (i >> 2)) % deco.length], s: 34 + (i * 7 % 5) * 3 });
    function draw() {
      const q = qq();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, CW, CH);
      const me = st.cars[0], camX = me.x, track = st.track;
      const sky = ctx.createLinearGradient(0, 0, 0, ROAD_Y); const bgc = world.bg; sky.addColorStop(0, bgc[0]); sky.addColorStop(1, bgc[bgc.length - 1]); ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, ROAD_Y);
      for (let l = 0; l < 2; l++) { ctx.fillStyle = l ? pal.a : pal.b; ctx.globalAlpha = l ? 1 : 0.6; ctx.beginPath(); ctx.moveTo(0, ROAD_Y); const sp = l ? 0.5 : 0.2; for (let x = 0; x <= CW; x += 12) { const wx = x + camX * PX * sp; ctx.lineTo(x, ROAD_Y - 14 - l * 8 - Math.sin(wx / (50 + l * 30)) * (10 + l * 4) - Math.sin(wx / 23) * 3); } ctx.lineTo(CW, ROAD_Y); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.fillStyle = pal.a; ctx.fillRect(0, ROAD_Y - 4, CW, 6);
      ctx.fillStyle = pal.pathEdge; ctx.fillRect(0, ROAD_Y, CW, LANE * 4 + 8);
      ctx.fillStyle = 'rgba(255,255,255,.12)'; for (let l = 0; l < 4; l += 2) ctx.fillRect(0, ROAD_Y + 2 + l * LANE, CW, LANE);
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(0, ROAD_Y, CW, 2); ctx.fillRect(0, ROAD_Y + LANE * 4 + 6, CW, 2);
      ctx.fillStyle = '#ffffff88'; const off = -((camX * PX) % 40);
      for (let l = 1; l < 4; l++) for (let x = off; x < CW; x += 40) ctx.fillRect(x, ROAD_Y + l * LANE + 3, 20, 2);
      const fx0 = 110 + (track - camX) * PX; if (fx0 > -20 && fx0 < CW + 20) { for (let i = 0; i < 19; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#111'; ctx.fillRect(fx0, ROAD_Y + i * 8, 8, 8); ctx.fillStyle = i % 2 ? '#111' : '#fff'; ctx.fillRect(fx0 + 8, ROAD_Y + i * 8, 8, 8); } ctx.fillStyle = '#ef4444'; ctx.fillRect(fx0 - 4, ROAD_Y - 40, 4, 40); ctx.fillRect(fx0 + 16, ROAD_Y - 40, 4, 40); ctx.fillRect(fx0 - 4, ROAD_Y - 40, 24, 10); }
      const sx = 110 - camX * PX; if (sx > -10 && sx < CW) { ctx.fillStyle = '#fff'; ctx.fillRect(sx, ROAD_Y, 4, LANE * 4 + 4); }
      for (const sc of scenery) { const x = 110 + (sc.x - camX) * PX; if (x < -30 || x > CW + 30) continue; di(ctx, sc.n, x, ROAD_Y - 14, sc.s, { q }); }
      st.cars.forEach((c, i) => {
        const y = ROAD_Y + 6 + i * LANE + 17; const x = 110 + (c.x - camX) * PX;
        if (x < -34) { ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('< ' + c.name, 4, y); return; }
        if (x > CW + 34) { ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'right'; ctx.fillText(c.name + ' >', CW - 4, y); return; }
        const bounce = Math.sin(c.wheel * 0.9) * 1.2, boosted = c.boost > 5;
        if (boosted && q > 0) glow(ctx, x - 26, y + 4, 22, '#fb923c', 0.55);
        if (boosted) { ctx.beginPath(); ctx.moveTo(x - 24, y + 1); ctx.lineTo(x - 36 - (Math.sin(c.wheel * 2) + 1) * 8, y + 5); ctx.lineTo(x - 24, y + 9); ctx.fillStyle = '#fbbf24'; ctx.fill(); }
        di(ctx, c.vehicle, x, y - 4 + bounce, 56, { q });
        if (c.slip > 0) { ctx.save(); ctx.translate(x, y - 12); ctx.rotate(Math.sin(c.wheel * 3) * 0.3); di(ctx, 'star', 0, 0, 20, { q, shadow: false }); ctx.restore(); }
        ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = c.me ? '#fde047' : '#fff'; ctx.strokeStyle = '#000b'; ctx.lineWidth = 3; const nm = c.me ? 'Jij' : c.name.split(' ')[0]; ctx.strokeText(nm, x, y - 26); ctx.fillText(nm, x, y - 26);
      });
      ctx.fillStyle = '#0009'; ctx.fillRect(10, 10, CW - 20, 8); ctx.fillStyle = '#fff'; ctx.fillRect(CW - 12, 6, 2, 16);
      for (const c of st.cars) { const px = 10 + clamp(c.x / track, 0, 1) * (CW - 20); if (c.icon && q >= 0) di(ctx, c.me ? 'astronaut' : c.icon, px, 14, c.me ? 22 : 18, { q, shadow: false }); }
      const kmh = Math.round((me.v || 0) * 7.2); ctx.textAlign = 'left'; ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0008'; ctx.lineWidth = 3; ctx.strokeText(kmh + ' km/u', 10, 38); ctx.fillText(kmh + ' km/u', 10, 38);
      ctx.fillStyle = '#0006'; ctx.fillRect(10, 44, 90, 8); ctx.fillStyle = me.boost > 8 ? '#f97316' : '#fde047'; ctx.fillRect(10, 44, 90 * clamp(me.boost / 14, 0, 1), 8);
      ctx.textAlign = 'center';
      for (const e of st.ev) {
        const a = clamp(e.life / e.max, 0, 1);
        if (e.k === 'nitro') { ctx.globalAlpha = a; ctx.font = 'bold 28px sans-serif'; ctx.fillStyle = '#fb923c'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.strokeText('NITRO!', CW / 2, 70); ctx.fillText('NITRO!', CW / 2, 70); ctx.globalAlpha = 1; if (!seenEv.has(e)) { seenEv.add(e); const [rx, ry] = toRoot(110, ROAD_Y + 6 + 17); fl.burst(rx, ry, 'sparkle', 20, { angle: Math.PI, spread: 1.2 }); fl.burst(rx, ry, 'smoke', 6); } }
        if (e.k === 'go') { ctx.globalAlpha = a; ctx.font = 'bold 44px sans-serif'; ctx.fillStyle = '#22c55e'; ctx.strokeStyle = '#000'; ctx.lineWidth = 5; ctx.strokeText('GO!', CW / 2, 130); ctx.fillText('GO!', CW / 2, 130); ctx.globalAlpha = 1; }
        if (e.k === 'skid') { ctx.globalAlpha = a; ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#fca5a5'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText('Slip!', 110, 70); ctx.fillText('Slip!', 110, 70); ctx.globalAlpha = 1; if (!seenEv.has(e)) { seenEv.add(e); const [rx, ry] = toRoot(110, ROAD_Y + 20); fl.burst(rx, ry, 'smoke', 8); } }
      }
      if (seenEv.size > 100) seenEv = new Set([...seenEv].filter((e) => st.ev.includes(e)));
      if (st.phase === 'countdown') { ctx.font = 'bold 72px sans-serif'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 6; const n = String(Math.max(1, Math.ceil(st.cd - 0.2))); ctx.strokeText(n, CW / 2, 150); ctx.fillText(n, CW / 2, 150); }
    }

    // ---- vragen
    function takeQ() {
      if (!queue.length) { try { queue = env.pick(12) || []; } catch (e) { queue = []; } }
      return queue.shift() || { t: 'num', q: 'Wat is ' + (3 + (nQ % 6)) + ' + ' + (2 + (nQ % 4)) + '?', a: 5 + (nQ % 6) + (nQ % 4) };
    }
    function nextQuestion() {
      if (dead || ended || st.phase !== 'race') return;
      const q = takeQ(); nQ++; clr(qhost);
      try { cur = env.ask(qhost, q, { compact: true, feedback: true, autoNext: 550, hints: fx.hints, time: env.level === 3 ? 20 : 0, label: 'Geef gas!' }); } catch (e) { cur = { promise: Promise.resolve({ ok: false, ms: 0 }), cancel() {} }; }
      const h = cur;
      h.promise.then((r) => {
        if (dead || ended || cur !== h) return; cur = null; r = r || {};
        try { env.report({ q, ok: !!r.ok, ms: r.ms || 0 }); } catch (e) { /* hub */ }
        const res = answer(st, !!r.ok, r.ms || 9999);
        env.snd.play(r.ok ? (res.nitro ? 'power' : 'goed') : 'fout');
        if (r.ok) fl.burstEl(cCoins, 'coins', 3);
        later(nextQuestion, 30);
      }).catch(() => { if (!dead && !ended && cur === h) { cur = null; later(nextQuestion, 300); } });
    }

    let phasePrev = 'idle';
    function loop() {
      raf = 0; if (dead) return;
      if (host.isConnected === false) { later(loop, 500); last = performance.now(); return; }
      const now = performance.now(); const dt = clamp((now - last) / 1000, 0, 0.1); last = now;
      if (started && !ended) {
        step(st, dt); infoT += dt; if (infoT > 0.25) { infoT = 0; infoUpdate(); }
        if (phasePrev === 'countdown' && st.phase === 'race') nextQuestion();
        if (phasePrev === 'race' && st.phase !== 'race') { if (cur) { try { cur.cancel(); } catch (e) { /* */ } cur = null; } clr(qhost); raceOver(); }
        phasePrev = st.phase;
      }
      draw(); raf = requestAnimationFrame(loop);
    }
    function raceOver() {
      const me = st.cars[0]; env.snd.play(me.place === 1 ? 'win' : 'level'); ik = ''; infoUpdate();
      const ov = E('div', 'ra-ov');
      const big = E('div', 'big'); big.appendChild(iel(me.place === 1 ? 'trophy' : me.place === 2 ? 'medal' : 'flag', 90));
      ov.append(big, E('h2', '', (st.trial ? 'Tijdrit' : 'Race ' + st.race) + ': ' + me.place + 'e plek'));
      if (me.place === 1) fl.burst((root.clientWidth || 360) / 2, 140, 'confetti', 50);
      if (st.trial && me.fin != null) ov.appendChild(E('p', '', 'Jouw tijd: ' + me.fin.toFixed(1) + ' s'));
      const tbl = E('table', 'ra-tbl'); const tb = E('tbody'); tbl.appendChild(tb);
      st.cars.slice().sort((a, b) => a.place - b.place).forEach((c) => { const tr = E('tr', c.me ? 'me' : ''); const t1 = E('td'); t1.append(iel(c.icon, 26), E('span', '', ' ' + c.name)); tr.append(E('td', '', c.place + '.'), t1, E('td', '', '+' + POINTS[c.place - 1] + ' (totaal ' + c.pts + ')')); tb.appendChild(tr); });
      ov.appendChild(tbl);
      if (st.phase === 'gameover') {
        const champ = st.cars.slice().sort((a, b) => b.pts - a.pts || a.id - b.id)[0];
        ov.append(E('h2', '', champ.me ? 'Jij bent kampioen!' : 'Kampioen: ' + champ.name), (() => { const b = E('button', 'ra-btn', 'Klaar'); b.type = 'button'; b.addEventListener('click', () => { ov.remove(); finish(champ.me); }); return b; })());
      } else {
        const pc = E('p'); pc.append(iel('coin', 24), E('span', '', ' ' + Math.floor(st.coins) + ' - tune je auto voor de volgende race:')); ov.appendChild(pc);
        const shop = E('div', 'ra-shop'); const els = {};
        const refresh = () => { for (const u of UPGR) { const c = upCost(st, u.id), o = els[u.id]; o.c.textContent = c == null ? 'MAX' : String(c); o.nm.textContent = u.name + ' ' + st.up[u.id]; o.b.className = 'ra-up' + (c != null && st.coins >= c ? ' can' : ''); } };
        for (const u of UPGR) { const b = E('button', 'ra-up'); b.type = 'button'; b.title = u.desc; const c = E('span', 'c'), nm = E('b'); b.append(iel(u.icon, 36, 'e'), nm, c); b.addEventListener('click', () => { if (buyUp(st, u.id)) { env.snd.play('power'); fl.burstEl(b, 'sparkle', 10); } refresh(); infoUpdate(); }); els[u.id] = { b, c, nm }; shop.appendChild(b); }
        refresh();
        const go = E('button', 'ra-btn', 'Volgende race'); go.type = 'button'; go.addEventListener('click', () => { ov.remove(); beginRace(); });
        ov.append(shop, go);
      }
      root.appendChild(ov);
    }
    function beginRace() { startRace(st); phasePrev = 'countdown'; ik = ''; infoUpdate(); }
    function finish(win) {
      if (ended) return; ended = true;
      const me = st.cars[0], places = st.results.map((r) => r.place);
      const timeBonus = st.trial && me.fin != null ? Math.max(0, Math.round((140 - me.fin) * 12)) : 0;
      env.end({ score: me.pts * 100 + st.correct * 5 + timeBonus, win: !!win, stats: { correct: st.correct, wrong: st.wrong, 'beste reeks': st.best, punten: me.pts, nitro: st.nitroUses, plekken: places.join('-') }, summary: (st.trial ? 'Tijdrit' + (me.fin != null ? ' in ' + me.fin.toFixed(1) + ' s' : '') + (win ? ': spookauto verslagen' : '') : (win ? 'Kampioen' : 'Eindstand') + ' met ' + me.pts + ' punten · plekken ' + places.join(', ')) + ' · ' + st.correct + ' goed.' });
    }
    function start(m) {
      if (started) return; started = true; trial = m === 'tijdrit';
      st = newRace({ level: env.level || 2, rand: env.rand, fx, name: env.name, vehicle, trial });
      last = performance.now(); beginRace();
    }
    const intro = E('div', 'ra-ov');
    const bigI = E('div', 'big'); bigI.appendChild(iel('car', 90));
    const vinfo = E('p', 'ra-vinfo', VEHICLES[0].info); const vgrid = E('div', 'ra-veh'); const vbtn = {};
    for (const v of VEHICLES) { const b = E('button', 'ra-vh' + (v.id === vehicle ? ' on' : '')); b.type = 'button'; b.append(iel(v.icon, 48, 'e'), E('b', '', v.name)); b.addEventListener('click', () => { vehicle = v.id; for (const k in vbtn) vbtn[k].className = 'ra-vh' + (k === v.id ? ' on' : ''); vinfo.textContent = v.name + ': ' + v.info; env.snd.play('klik'); }); vbtn[v.id] = b; vgrid.appendChild(b); }
    const mk = (txt, cls, m) => { const b = E('button', 'ra-btn ' + cls, txt); b.type = 'button'; b.addEventListener('click', () => { intro.remove(); start(m); }); return b; };
    intro.append(bigI, E('h2', '', 'Race'), E('p', '', 'Elk goed antwoord geeft gas, 4 op rij geeft nitro. Een fout laat je slippen. Kies je voertuig:'), vgrid, vinfo, mk('Tik om te beginnen (3 races)', '', 'gp'), mk('Tijdrit tegen de spookauto', 'alt', 'tijdrit'));
    root.appendChild(intro); infoUpdate(); last = performance.now(); raf = requestAnimationFrame(loop);

    return { destroy() { dead = true; if (raf) cancelAnimationFrame(raf); timers.forEach((t) => clearTimeout(t)); timers.clear(); if (cur) { try { cur.cancel(); } catch (e) { /* */ } cur = null; } fl.destroy(); bgw.destroy(); root.remove(); style.remove(); } };
  },
};
