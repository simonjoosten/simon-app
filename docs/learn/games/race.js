// Race – Grand Prix van 3 races tegen 3 bots. Gas per goed antwoord, nitro bij een reeks, auto-upgrades tussen de races.
// Pure racelogica (Race) is los exporteerbaar voor bot-simulaties.

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const TRACK = 1000, RACES = 3, V0 = 10, MAX_T = 135;
export const POINTS = [10, 6, 3, 1];
export const PRIZE = [70, 45, 28, 14];
export const UPGR = [
  { id: 'motor', name: 'Motor', emoji: '🔧', desc: 'Hogere basissnelheid', cost: [40, 100, 200, 360] },
  { id: 'turbo', name: 'Turbo', emoji: '🚀', desc: 'Meer gas per goed antwoord', cost: [40, 100, 200, 360] },
  { id: 'banden', name: 'Banden', emoji: '🛞', desc: 'Minder slippen bij een fout', cost: [30, 80, 160, 300] },
  { id: 'aero', name: 'Aerodynamica', emoji: '🪽', desc: 'Gas blijft langer werken', cost: [35, 90, 180, 330] },
  { id: 'nitro', name: 'Nitro', emoji: '🔥', desc: 'Grotere nitro-stoot bij 4 op rij', cost: [50, 120, 240, 420] },
];
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'];
const BOTS = [['Turbo Tim', '🦊'], ['Snelle Sanne', '🐰'], ['Vlam Vince', '🐯'], ['Racer Roos', '🦄'], ['Bliksem Bas', '🐺']];

export function newRace(opts = {}) {
  const rand = opts.rand || Math.random, level = clamp(opts.level || 2, 1, 3), fx = opts.fx || {};
  const names = BOTS.slice().sort(() => rand() - 0.5).slice(0, 3);
  const accBase = [0.5, 0.68, 0.8][level - 1];
  const cars = [{ id: 0, me: true, name: opts.name || 'Jij', emoji: '😎', color: COLORS[0], x: 0, boost: 0, slip: 0, pts: 0, wheel: 0, last: 0 }];
  names.forEach(([n, e], i) => cars.push({ id: i + 1, bot: true, name: n, emoji: e, color: COLORS[i + 1], x: 0, boost: 0, slip: 0, pts: 0, wheel: 0, acc: clamp(accBase + (rand() - 0.5) * 0.14, 0.3, 0.93), think: [8, 6.5, 5.5][level - 1] * (0.85 + rand() * 0.3), timer: 3, mult: [1.0, 1.09, 1.17][level - 1] * (0.96 + rand() * 0.08), last: 0 }));
  return { rand, level, fx, cars, up: { motor: 0, turbo: 0, banden: 0, aero: 0, nitro: 0 }, coins: (fx.startCash || 0) * 0.3, race: 0, phase: 'idle', cd: 3, t: 0, streak: 0, best: 0, correct: 0, wrong: 0, results: [], ev: [], noFx: !!opts.noFx, spent: 0, shield: fx.shield || 0, nitroUses: 0, placeNow: 1 };
}
const ev = (st, e) => { if (st.noFx) return; if (st.ev.length > 40) st.ev.shift(); st.ev.push(e); };
export function startRace(st) {
  st.race++; st.phase = 'countdown'; st.cd = 3.2; st.t = 0; st.streak = 0; st.ev = [];
  for (const c of st.cars) { c.x = 0; c.boost = 0; c.slip = 0; c.fin = null; c.place = 0; c.timer = 2 + st.rand() * 3; c.last = 0; }
}
export const baseSpeed = (st) => V0 * (1 + 0.065 * st.up.motor);
export const gasPower = (st) => 6.2 * (1 + 0.22 * st.up.turbo) * (1 + (st.fx.cashMult ? (st.fx.cashMult - 1) * 0.1 : 0));
export const tau = (st) => 3.4 * (1 + 0.16 * st.up.aero);
export function answer(st, ok, ms) {
  const me = st.cars[0]; if (st.phase !== 'race') return { gas: 0 };
  if (!ok) {
    st.streak = 0; st.wrong++;
    if (st.shield > 0) { st.shield--; return { gas: 0, shielded: true }; }
    me.boost *= 0.2; me.slip = Math.max(0.5, 1.5 - 0.28 * st.up.banden); ev(st, { k: 'skid', life: 0.8, max: 0.8 });
    return { gas: 0, slip: true };
  }
  st.streak++; st.best = Math.max(st.best, st.streak); st.correct++;
  let g = gasPower(st) * (ms < 4500 ? 1.15 : 1) * (1 + Math.min(st.streak, 8) * ((st.fx.streakBonus || 0) + 0.02));
  let nitro = false;
  if (st.streak % 4 === 0) { g *= 1.7 + 0.35 * st.up.nitro; nitro = true; st.nitroUses++; ev(st, { k: 'nitro', life: 1, max: 1 }); }
  me.boost += g; st.coins += 8 + (nitro ? 6 : 0);
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
    else {
      const rub = clamp((me.x - c.x) / 500, -0.1, 0.1); // elastiek: houdt de race spannend
      v = V0 * c.mult * (1 + rub);
      c.timer -= dt;
      if (c.timer <= 0) { c.timer += c.think * (0.8 + st.rand() * 0.4); if (st.rand() < c.acc) c.boost += 7.2 * (0.9 + st.rand() * 0.2); else { c.boost *= 0.2; c.slip = 1.3; } }
    }
    v += c.boost; if (c.slip > 0) { v *= 0.45; c.slip -= dt; }
    c.boost *= Math.exp(-dt / (c.me ? tau(st) : 3.4)); c.v = v;
    c.x += v * dt; c.wheel += v * dt * 0.8;
    if (c.fin == null && c.x >= TRACK) { c.fin = st.t - (c.x - TRACK) / Math.max(v, 1); }
  }
  st.placeNow = placeOf(st, me);
  if ((me.fin != null && st.t - me.fin > 1.2) || st.t > MAX_T) endRace(st);
}
function endRace(st) {
  const order = st.cars.slice().sort((a, b) => (a.fin != null && b.fin != null ? a.fin - b.fin : a.fin != null ? -1 : b.fin != null ? 1 : b.x - a.x));
  order.forEach((c, i) => { c.place = i + 1; c.pts += POINTS[i]; });
  const me = st.cars[0]; st.coins += PRIZE[me.place - 1]; st.results.push({ place: me.place, time: me.fin });
  st.phase = st.race >= RACES ? 'gameover' : 'between';
}
export function upCost(st, id) { const u = UPGR.find((x) => x.id === id); const l = st.up[id]; return l >= u.cost.length ? null : u.cost[l]; }
export function buyUp(st, id) { const c = upCost(st, id); if (c == null || st.coins < c) return false; st.coins -= c; st.spent += c; st.up[id]++; return true; }
export function autoBuy(st) { for (let k = 0; k < 5; k++) { let best = null, bc = Infinity; for (const u of UPGR) { const c = upCost(st, u.id); if (c != null && c <= st.coins && c < bc) { best = u.id; bc = c; } } if (!best) break; buyUp(st, best); } }

// ---------------------------------------------------------------------------------------------
const E = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const clr = (e) => { while (e.firstChild) e.removeChild(e.firstChild); };
const addCss = (id, t) => { const s = document.createElement('style'); s.setAttribute('data-learn-g', id); s.textContent = t; document.head.appendChild(s); return s; };
const EF = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const CW = 360, CH = 230, LANE = 30, ROAD_Y = 74, PX = 3.2;
const CSS = `
.ra-root{position:relative;display:flex;flex-direction:column;gap:6px;width:100%;height:100%;min-height:440px;padding:6px;box-sizing:border-box;color:var(--ink);overflow:auto}
.ra-root *{box-sizing:border-box}
.ra-cv{width:100%;max-width:520px;align-self:center;aspect-ratio:${CW}/${CH};border-radius:16px;border:2px solid var(--line);display:block;background:#7dd3fc}
.ra-info{display:flex;gap:6px;flex-wrap:wrap}
.ra-chip{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:3px 10px;font-weight:800;font-size:13px}
.ra-q{flex:1;min-height:150px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:6px;overflow:auto}
.ra-ov{position:absolute;inset:0;background:color-mix(in srgb,var(--card) 94%,transparent);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px;padding:16px;z-index:9;overflow:auto}
.ra-ov h2{margin:0;font-size:24px}.ra-ov p{margin:0;max-width:330px;opacity:.85;line-height:1.35}.ra-ov .big{font-size:56px}
.ra-btn{border:0;background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;border-radius:16px;font:inherit;font-weight:900;font-size:18px;padding:12px 28px;cursor:pointer;box-shadow:0 6px 16px #ef444466}
.ra-shop{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;width:100%;max-width:380px}
.ra-up{border:2px solid var(--line);background:var(--card);color:var(--ink);border-radius:12px;padding:5px 1px;font:inherit;font-size:10px;cursor:pointer;opacity:.6;line-height:1.15}
.ra-up .e{font-size:22px;display:block}.ra-up b{display:block}.ra-up .c{font-weight:900;font-size:12px;display:block}
.ra-up.can{opacity:1;border-color:#22c55e}
.ra-tbl{width:100%;max-width:330px;border-collapse:collapse;font-size:14px}.ra-tbl td{padding:3px 6px;border-bottom:1px solid var(--line)}.ra-tbl tr.me{font-weight:900;background:color-mix(in srgb,var(--accent) 18%,transparent)}
`;

export default {
  id: 'race', name: 'Race', emoji: '🏎️', color: '#f97316',
  desc: 'Elk goed antwoord geeft gas! Win 3 races tegen 3 bots en tune je auto tussendoor.',
  tags: ['race', 'snel', 'bots'], minutes: 5, duo: false,
  create(host, env) {
    const style = addCss('race', CSS);
    const f0 = env.fx || {};
    const fx = { startCash: clamp(+f0.startCash || 0, 0, 5000), cashMult: clamp(+f0.cashMult || 1, 0.5, 5), streakBonus: clamp(+f0.streakBonus || 0, 0, 0.5), shield: Math.round(clamp(+f0.shield || 0, 0, 5)), hints: Math.round(clamp(+f0.hints || 0, 0, 5)) };
    const st = newRace({ level: env.level || 2, rand: env.rand, fx, name: env.name });
    const root = E('div', 'ra-root'); host.appendChild(root);
    let dead = false, ended = false, cur = null, started = false, raf = 0, last = 0, nQ = 0, queue = [], infoT = 0;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
    const cv = E('canvas', 'ra-cv'); const dpr = Math.min(2, globalThis.devicePixelRatio || 1); cv.width = CW * dpr; cv.height = CH * dpr; const ctx = cv.getContext('2d');
    const info = E('div', 'ra-info'); const cRace = E('div', 'ra-chip'), cPlace = E('div', 'ra-chip'), cCoins = E('div', 'ra-chip'), cStreak = E('div', 'ra-chip'); info.append(cRace, cPlace, cStreak, cCoins);
    const qhost = E('div', 'ra-q');
    root.append(cv, info, qhost);
    function infoUpdate() {
      cRace.textContent = '🏁 Race ' + Math.max(1, st.race) + '/' + RACES; cPlace.textContent = '🏆 ' + st.placeNow + 'e plek'; cCoins.textContent = '🪙 ' + Math.floor(st.coins); cStreak.textContent = '🔥 ' + st.streak + (st.streak % 4 === 3 ? ' (nitro!)' : '');
    }

    // ---- tekenen
    const scenery = []; for (let i = 0; i < 40; i++) scenery.push({ x: 40 + i * 53 + (i * 37 % 20), k: i % 4 });
    function carShape(x, y, color, wheel, boosted, me) {
      ctx.beginPath(); ctx.ellipse(x, y + 12, 24, 4, 0, 0, 6.2832); ctx.fillStyle = '#0004'; ctx.fill();
      if (boosted) { ctx.beginPath(); ctx.moveTo(x - 24, y + 2); ctx.lineTo(x - 24 - 14 - Math.random() * 10, y + 5); ctx.lineTo(x - 24, y + 8); ctx.fillStyle = '#fbbf24'; ctx.fill(); }
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x - 24, y + 9); ctx.lineTo(x - 24, y + 1); ctx.quadraticCurveTo(x - 20, y - 3, x - 10, y - 4); ctx.lineTo(x - 5, y - 11); ctx.lineTo(x + 8, y - 11); ctx.lineTo(x + 13, y - 4); ctx.quadraticCurveTo(x + 24, y - 3, x + 26, y + 3); ctx.lineTo(x + 26, y + 9); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#bae6fd'; ctx.beginPath(); ctx.moveTo(x - 3, y - 4); ctx.lineTo(x - 0, y - 9); ctx.lineTo(x + 7, y - 9); ctx.lineTo(x + 10, y - 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#0003'; ctx.fillRect(x - 24, y + 4, 50, 2);
      ctx.fillStyle = '#fde047'; ctx.fillRect(x + 22, y + 0, 4, 3);
      for (const wx of [x - 13, x + 15]) { ctx.beginPath(); ctx.arc(wx, y + 9, 6, 0, 6.2832); ctx.fillStyle = '#111827'; ctx.fill(); ctx.beginPath(); ctx.arc(wx, y + 9, 2.5, 0, 6.2832); ctx.fillStyle = '#9ca3af'; ctx.fill(); ctx.beginPath(); ctx.moveTo(wx, y + 9); ctx.lineTo(wx + Math.cos(wheel) * 5.5, y + 9 + Math.sin(wheel) * 5.5); ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1.5; ctx.stroke(); }
      if (me) { ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.moveTo(x - 4, y - 18); ctx.lineTo(x + 4, y - 18); ctx.lineTo(x, y - 13); ctx.closePath(); ctx.fill(); }
    }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const me = st.cars[0], camX = me.x;
      const sky = ctx.createLinearGradient(0, 0, 0, ROAD_Y); sky.addColorStop(0, '#38bdf8'); sky.addColorStop(1, '#e0f2fe'); ctx.fillStyle = sky; ctx.fillRect(0, 0, CW, ROAD_Y);
      // heuvels (parallax)
      for (let l = 0; l < 2; l++) { ctx.fillStyle = l ? '#16a34a' : '#86efac'; ctx.beginPath(); ctx.moveTo(0, ROAD_Y); const sp = l ? 0.5 : 0.2; for (let x = 0; x <= CW; x += 12) { const wx = x + camX * PX * sp; ctx.lineTo(x, ROAD_Y - 14 - l * 8 - Math.sin(wx / (50 + l * 30)) * (10 + l * 4) - Math.sin(wx / 23) * 3); } ctx.lineTo(CW, ROAD_Y); ctx.fill(); }
      // gras + weg
      ctx.fillStyle = '#4ade80'; ctx.fillRect(0, ROAD_Y - 4, CW, 6);
      ctx.fillStyle = '#475569'; ctx.fillRect(0, ROAD_Y, CW, LANE * 4 + 6);
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(0, ROAD_Y, CW, 2); ctx.fillRect(0, ROAD_Y + LANE * 4 + 4, CW, 2);
      ctx.fillStyle = '#ffffff88'; const off = -((camX * PX) % 40);
      for (let l = 1; l < 4; l++) for (let x = off; x < CW; x += 40) ctx.fillRect(x, ROAD_Y + l * LANE + 2, 20, 2);
      // finish + start
      const fx0 = 110 + (TRACK - camX) * PX; if (fx0 > -20 && fx0 < CW + 20) { for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#111'; ctx.fillRect(fx0, ROAD_Y + i * 8, 8, 8); ctx.fillStyle = i % 2 ? '#111' : '#fff'; ctx.fillRect(fx0 + 8, ROAD_Y + i * 8, 8, 8); } ctx.fillStyle = '#ef4444'; ctx.fillRect(fx0 - 4, ROAD_Y - 40, 4, 40); ctx.fillRect(fx0 + 16, ROAD_Y - 40, 4, 40); ctx.fillRect(fx0 - 4, ROAD_Y - 40, 24, 10); }
      const sx = 110 - camX * PX; if (sx > -10 && sx < CW) { ctx.fillStyle = '#fff'; ctx.fillRect(sx, ROAD_Y, 4, LANE * 4 + 4); }
      // randdingen
      for (const s of scenery) { const x = 110 + (s.x - camX) * PX; if (x < -20 || x > CW + 20) continue; ctx.font = '20px ' + EF; ctx.textAlign = 'center'; ctx.fillText(['🌲', '🏠', '🌳', '🪧'][s.k], x, ROAD_Y - 4); }
      // auto's (speler onderaan = voorgrond)
      st.cars.forEach((c, i) => {
        const y = ROAD_Y + 4 + i * LANE + 14; let x = 110 + (c.x - camX) * PX;
        if (x < -30) { ctx.fillStyle = c.color; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('◀ ' + c.name, 4, y); return; }
        if (x > CW + 30) { ctx.fillStyle = c.color; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'right'; ctx.fillText(c.name + ' ▶', CW - 4, y); return; }
        carShape(x, y, c.color, c.wheel, c.boost > 5, c.me);
        ctx.font = 'bold 9px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(c.emoji + ' ' + (c.me ? '' : c.name.split(' ')[0]), x - 4, y - 20);
        if (c.slip > 0) { ctx.font = '14px ' + EF; ctx.fillText('💫', x, y - 20); }
      });
      // HUD: voortgangsbalk + snelheidsmeter
      ctx.fillStyle = '#0009'; ctx.fillRect(10, 10, CW - 20, 8); ctx.fillStyle = '#fff'; ctx.fillRect(CW - 12, 6, 2, 16);
      for (const c of st.cars) { ctx.beginPath(); ctx.arc(10 + clamp(c.x / TRACK, 0, 1) * (CW - 20), 14, c.me ? 6 : 4.5, 0, 6.2832); ctx.fillStyle = c.color; ctx.fill(); if (c.me) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); } }
      const kmh = Math.round((me.v || 0) * 7.2); ctx.textAlign = 'left'; ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0008'; ctx.lineWidth = 3; ctx.strokeText(kmh + ' km/u', 10, 36); ctx.fillText(kmh + ' km/u', 10, 36);
      ctx.fillStyle = '#0006'; ctx.fillRect(10, 42, 80, 7); ctx.fillStyle = me.boost > 8 ? '#f97316' : '#fde047'; ctx.fillRect(10, 42, 80 * clamp(me.boost / 14, 0, 1), 7);
      ctx.textAlign = 'center';
      for (const e of st.ev) {
        const a = clamp(e.life / e.max, 0, 1);
        if (e.k === 'nitro') { ctx.globalAlpha = a; ctx.font = 'bold 26px sans-serif'; ctx.fillStyle = '#fb923c'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.strokeText('NITRO!', CW / 2, 62); ctx.fillText('NITRO!', CW / 2, 62); ctx.globalAlpha = 1; }
        if (e.k === 'go') { ctx.globalAlpha = a; ctx.font = 'bold 40px sans-serif'; ctx.fillStyle = '#22c55e'; ctx.strokeStyle = '#000'; ctx.lineWidth = 5; ctx.strokeText('GO!', CW / 2, 120); ctx.fillText('GO!', CW / 2, 120); ctx.globalAlpha = 1; }
        if (e.k === 'skid') { ctx.globalAlpha = a; ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = '#fca5a5'; ctx.fillText('Slip!', 110, ROAD_Y + 4 + 3 * LANE - 6); ctx.globalAlpha = 1; }
      }
      if (st.phase === 'countdown') { ctx.font = 'bold 64px sans-serif'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 6; const n = String(Math.max(1, Math.ceil(st.cd - 0.2))); ctx.strokeText(n, CW / 2, 140); ctx.fillText(n, CW / 2, 140); }
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
      const me = st.cars[0]; env.snd.play(me.place === 1 ? 'win' : 'level'); infoUpdate();
      const ov = E('div', 'ra-ov');
      ov.append(E('div', 'big', ['🥇', '🥈', '🥉', '🏁'][me.place - 1]), E('h2', '', 'Race ' + st.race + ': ' + me.place + 'e plek'));
      const tbl = E('table', 'ra-tbl'); const tb = E('tbody'); tbl.appendChild(tb);
      st.cars.slice().sort((a, b) => a.place - b.place).forEach((c) => { const tr = E('tr', c.me ? 'me' : ''); tr.append(E('td', '', c.place + '.'), E('td', '', c.emoji + ' ' + c.name), E('td', '', '+' + POINTS[c.place - 1] + ' (totaal ' + c.pts + ')')); tb.appendChild(tr); });
      ov.appendChild(tbl);
      if (st.phase === 'gameover') {
        const champ = st.cars.slice().sort((a, b) => b.pts - a.pts || a.id - b.id)[0];
        ov.append(E('h2', '', champ.me ? '🏆 Jij bent kampioen!' : 'Kampioen: ' + champ.name), (() => { const b = E('button', 'ra-btn', 'Klaar'); b.type = 'button'; b.addEventListener('click', () => { ov.remove(); finish(champ.me); }); return b; })());
      } else {
        ov.appendChild(E('p', '', '🪙 ' + Math.floor(st.coins) + ' — tune je auto voor de volgende race:'));
        const shop = E('div', 'ra-shop'); const els = {};
        const refresh = () => { for (const u of UPGR) { const c = upCost(st, u.id), o = els[u.id]; o.c.textContent = c == null ? 'MAX' : String(c); o.nm.textContent = u.name + ' ' + st.up[u.id]; o.b.className = 'ra-up' + (c != null && st.coins >= c ? ' can' : ''); } };
        for (const u of UPGR) { const b = E('button', 'ra-up'); b.type = 'button'; b.title = u.desc; const c = E('span', 'c'), nm = E('b'); b.append(E('span', 'e', u.emoji), nm, c); b.addEventListener('click', () => { if (buyUp(st, u.id)) env.snd.play('power'); refresh(); infoUpdate(); }); els[u.id] = { b, c, nm }; shop.appendChild(b); }
        refresh();
        const go = E('button', 'ra-btn', 'Volgende race'); go.type = 'button'; go.addEventListener('click', () => { ov.remove(); beginRace(); });
        ov.append(shop, go);
      }
      root.appendChild(ov);
    }
    function beginRace() { startRace(st); phasePrev = 'countdown'; infoUpdate(); }
    function finish(win) {
      if (ended) return; ended = true;
      const me = st.cars[0], places = st.results.map((r) => r.place);
      env.end({ score: me.pts * 100 + st.correct * 5, win: !!win, stats: { correct: st.correct, wrong: st.wrong, 'beste reeks': st.best, punten: me.pts, nitro: st.nitroUses, plekken: places.join('-') }, summary: (win ? 'Kampioen' : 'Eindstand') + ' met ' + me.pts + ' punten · plekken ' + places.join(', ') + ' · ' + st.correct + ' goed.' });
    }
    function start() { if (started) return; started = true; last = performance.now(); beginRace(); }
    const intro = E('div', 'ra-ov'); const sb = E('button', 'ra-btn', 'Tik om te beginnen'); sb.type = 'button'; sb.addEventListener('click', () => { intro.remove(); start(); });
    intro.append(E('div', 'big', '🏎️'), E('h2', '', 'Race'), E('p', '', 'Elk goed antwoord geeft gas, 4 op rij geeft nitro. Een fout laat je slippen. Win 3 races en tune je auto!'), sb);
    root.appendChild(intro); infoUpdate(); last = performance.now(); raf = requestAnimationFrame(loop);

    return { destroy() { dead = true; if (raf) cancelAnimationFrame(raf); timers.forEach((t) => clearTimeout(t)); timers.clear(); if (cur) { try { cur.cancel(); } catch (e) { /* */ } cur = null; } root.remove(); style.remove(); } };
  },
};
