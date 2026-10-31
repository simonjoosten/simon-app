// Ruimtemissie – je raket vliegt op brandstof. Goede antwoorden tanken bij, reeksen geven turbo, asteroïden dwingen je tot snel antwoorden.
// Land op 7 bestemmingen, koop kristal-upgrades en bereik Planeet X. Pure logica: createSpace.

import { Gx } from './_gfx.js?v=1';

/* ---------- helpers ---------- */
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const fmt = n => Math.round(n).toLocaleString('nl-NL');
const mmss = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function fallbackQ(rand) { const a = 2 + Math.floor(rand() * 8), b = 2 + Math.floor(rand() * 8); const r = a * b; return { t: 'mc', q: a + ' × ' + b + ' = ?', a: String(r), o: [String(r), String(r + a), String(r - b), String(r + 2)].sort(() => rand() - 0.5), d: 1 }; }
function mkQSource(env) {
  let buf = [];
  return () => {
    if (!buf.length) { try { buf = (env.pick(10, {}) || []).slice(); } catch (e) { buf = []; } }
    return buf.shift() || fallbackQ(env.rand || Math.random);
  };
}
function mkAsker(env, panel, nextQ) {
  let h = null, tok = 0;
  return {
    busy() { return !!h; },
    start(opts, cb) {
      this.cancel();
      const q = nextQ(), my = ++tok, box = el('div'); panel.appendChild(box);
      try { h = env.ask(box, q, opts); } catch (e) { h = null; setTimeout(() => { if (my === tok) cb({ ok: false, ms: 0 }, q); }, 0); return q; }
      h.promise.then(r => {
        if (my !== tok) return; h = null;
        try { env.report({ q, ok: !!r.ok, ms: r.ms || 0 }); } catch (e) { /* hub */ }
        cb(r, q);
      }, () => {});
      return q;
    },
    cancel() { tok++; if (h) { try { h.cancel(); } catch (e) { /* ok */ } h = null; } panel.innerHTML = ''; },
  };
}

/* ---------- pure logica ---------- */
export const SPACE_CAP = 540;
export const PLANET_DB = {
  maan: { n: 'de Maan', e: '🌙', d: 220, col: '#cbd5e1', ic: 'moon' }, mars: { n: 'Mars', e: '🔴', d: 300, col: '#ef6a4a' }, venus: { n: 'Venus', e: '🟠', d: 380, col: '#f5b35a' },
  jupiter: { n: 'Jupiter', e: '🟤', d: 420, col: '#c58b5c' }, saturnus: { n: 'Saturnus', e: '🪐', d: 470, col: '#e8cf8d', ic: 'planet' }, neptunus: { n: 'Neptunus', e: '🔵', d: 520, col: '#4f7bff' },
  x: { n: 'Planeet X', e: '🌍', d: 560, col: '#34d399', ic: 'earth' },
  // nieuw
  mercurius: { n: 'Mercurius', e: '⚫', d: 260, col: '#b8aea4' }, europa: { n: 'Europa', e: '🧊', d: 400, col: '#cfe8f5' }, titan: { n: 'Titan', e: '🟡', d: 450, col: '#e0a050' },
  uranus: { n: 'Uranus', e: '🩵', d: 500, col: '#7ee0e8' }, pluto: { n: 'Pluto', e: '🤎', d: 540, col: '#d9b8a8' },
};
export const ROUTES = {
  klassiek: { name: 'Klassieke reis', desc: '7 planeten, 9 minuten. De standaardmissie.', legs: ['maan', 'mars', 'venus', 'jupiter', 'saturnus', 'neptunus', 'x'], cap: 540, mult: 1 },
  kort: { name: 'Korte hop', desc: '5 planeten, 6 minuten. Lekker snel.', legs: ['maan', 'mars', 'mercurius', 'venus', 'x'], cap: 360, mult: 0.8 },
  verre: { name: 'Verre reis', desc: '12 planeten, 14 minuten, met Europa, Titan, Uranus en Pluto. Dubbele punten!', legs: ['maan', 'mercurius', 'mars', 'venus', 'europa', 'jupiter', 'titan', 'saturnus', 'uranus', 'neptunus', 'pluto', 'x'], cap: 840, mult: 2 },
};
export const PLANETS = ROUTES.klassiek.legs.map(k => PLANET_DB[k]);
export const SPACE_UPG = [
  { id: 'engine', name: 'Straalmotor', emoji: '🚀', desc: 'Sneller vliegen', costs: [25, 50, 90, 150], ic: 'rocket' },
  { id: 'tank', name: 'Grote tank', emoji: '⛽', desc: 'Meer brandstof mee', costs: [20, 45, 80], ic: 'bag' },
  { id: 'eff', name: 'Zuinige motor', emoji: '🌿', desc: 'Minder verbruik', costs: [25, 55, 95], ic: 'leaf' },
  { id: 'shield', name: 'Ruimteschild', emoji: '🛡️', desc: 'Vangt asteroïden op', costs: [25, 60, 110], ic: 'shield' },
  { id: 'magnet', name: 'Brandstofmagneet', emoji: '🧲', desc: 'Meer brandstof per antwoord', costs: [25, 55, 95], ic: 'magnet' },
  { id: 'radar', name: 'Asteroïden-radar', emoji: '📡', desc: 'Meer tijd om uit te wijken', costs: [30, 65], ic: 'satellite' },
  { id: 'solar', name: 'Zonnepanelen', emoji: '☀️', desc: 'Laden onderweg langzaam bij', costs: [30, 65, 110], ic: 'sun' },
];

export function createSpace({ level = 2, rand = Math.random, fx = {}, route = 'klassiek' } = {}) {
  const RT = ROUTES[route] || ROUTES.klassiek, PL = RT.legs.map(k => PLANET_DB[k]);
  const dF = level === 1 ? 0.88 : level === 3 ? 1.12 : 1;
  const S = {
    route, cap: RT.cap, t: 0, leg: 0, pos: 0, fuel: 100, crystals: Math.round(fx.startCash || 0), got: 0, up: {}, shieldCh: fx.shield || 0, streak: 0, turbo: 0, phase: 'fly', danger: 0, astT: 14 + rand() * 6,
    correct: 0, wrong: 0, best: 0, score: 0, dodged: 0, hits: 0, landed: 0, firstGain: null,
  };
  SPACE_UPG.forEach(u => { S.up[u.id] = 0; });
  const m = { S, planets: PL, route: RT };
  m.tank = () => 100 + 25 * S.up.tank + 10 * (fx.extraLives || 0);
  m.speed = () => (8 + 1.5 * S.up.engine) * (S.turbo > 0 ? 1.5 : 1) * (S.fuel > 0 ? 1 : 0.25);
  m.drain = () => Math.max(1.6, 4.2 * (1 - 0.1 * S.up.eff) - 0.45 * S.up.solar);
  m.warn = () => 8 + 2 * S.up.radar;
  m.dist = () => PL[Math.min(S.leg, PL.length - 1)].d * dF;
  S.fuel = m.tank();
  function hit(ev) {
    S.danger = 0; S.hits++; S.streak = 0; S.turbo = 0;
    if (S.shieldCh > 0) { S.shieldCh--; ev.push({ type: 'blocked' }); } else { S.fuel = Math.max(0, S.fuel - 14); ev.push({ type: 'hit' }); }
  }
  m.answer = ok => {
    const ev = [];
    if (S.phase !== 'fly') return ev;
    if (ok) {
      S.correct++; S.streak++; S.best = Math.max(S.best, S.streak);
      const add = 16 * (1 + 0.2 * S.up.magnet); S.fuel = Math.min(m.tank(), S.fuel + add);
      const cr = Math.round((2 + (S.streak >= 3 ? 1 : 0)) * (fx.cashMult || 1)); S.crystals += cr; S.got += cr;
      S.score += 5 + Math.min(S.streak, 10);
      if (S.streak >= 3) S.turbo = 4;
      if (S.firstGain == null) S.firstGain = S.t;
      ev.push({ type: 'good', fuel: add, cr });
      if (S.danger > 0) { S.danger = 0; S.dodged++; S.crystals += 4; S.got += 4; S.score += 15; ev.push({ type: 'dodge' }); }
    } else {
      S.wrong++; S.streak = 0; S.turbo = 0; ev.push({ type: 'bad' });
      if (S.danger > 0) hit(ev);
    }
    return ev;
  };
  m.tick = dt => {
    const ev = []; if (S.phase !== 'fly') return ev;
    S.t += dt; S.turbo = Math.max(0, S.turbo - dt);
    S.fuel = Math.max(0, S.fuel - m.drain() * dt);
    S.pos += m.speed() * dt;
    S.astT -= dt;
    if (S.danger > 0) { S.danger -= dt; if (S.danger <= 0) hit(ev); }
    else if (S.astT <= 0) { S.astT = 18 + rand() * 8; S.danger = m.warn(); ev.push({ type: 'asteroid' }); }
    if (S.pos >= m.dist()) {
      const p = PL[S.leg]; S.landed++; S.danger = 0;
      const bonus = 12 + 6 * S.leg; S.crystals += bonus; S.got += bonus; S.score += Math.round(100 * (S.leg + 1) * RT.mult);
      S.fuel = m.tank(); S.shieldCh = Math.max(S.shieldCh, S.up.shield + (fx.shield || 0)); S.phase = 'land'; S.streak = 0; S.turbo = 0;
      ev.push({ type: 'land', planet: p, bonus, last: S.leg >= PL.length - 1 });
      if (S.leg >= PL.length - 1) S.phase = 'won';
    } else if (S.t >= S.cap) { S.phase = 'over'; ev.push({ type: 'over' }); }
    return ev;
  };
  m.cost = id => { const u = SPACE_UPG.find(x => x.id === id); return S.up[id] >= u.costs.length ? null : u.costs[S.up[id]]; };
  m.buy = id => { const c = m.cost(id); if (c == null || S.crystals < c) return false; S.crystals -= c; S.up[id]++; if (id === 'tank') S.fuel = m.tank(); if (id === 'shield') S.shieldCh++; return true; };
  m.depart = () => { if (S.phase !== 'land') return; S.leg++; S.pos = 0; S.phase = 'fly'; S.astT = 12 + rand() * 6; };
  m.finalScore = () => S.score + (S.phase === 'won' ? Math.round(300 * RT.mult) : 0);
  return m;
}

/* ---------- stijl ---------- */
const CSS = `
.ru-root{position:relative;display:flex;flex-direction:column;width:100%;box-sizing:border-box;background:transparent;color:var(--ink);border-radius:14px;overflow:hidden;font-family:inherit;user-select:none;-webkit-user-select:none;font-size:calc(16px*var(--gfx-font,1))}
.ru-hud{display:flex;align-items:center;justify-content:flex-start;gap:8px;padding:8px 58px 4px 10px;font-weight:800;font-size:calc(15px*var(--gfx-font,1))}
.ru-hud>span{display:inline-flex;align-items:center;gap:5px;background:var(--card);border-radius:99px;padding:5px 11px;min-height:34px;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.ru-fuel{flex:1 1 90px;height:16px;border-radius:9px;background:var(--card);overflow:hidden;min-width:70px;box-shadow:0 2px 6px rgba(0,0,0,.2),0 0 0 3px var(--card)}.ru-fuel>i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#22c55e,#facc15);transition:width .2s}
.ru-cv{display:block;width:100%;height:250px;background:transparent}
.ru-panel{flex:1 1 auto;min-height:210px;padding:8px 10px 12px;margin:0 8px 8px;background:var(--card);border-radius:18px;box-shadow:0 3px 12px rgba(0,0,0,.2);overflow:auto}
.ru-warn{background:#dc2626;color:#fff;text-align:center;font-weight:900;border-radius:10px;padding:8px;margin-bottom:6px;animation:ruwarn .5s infinite alternate}
html[data-reduce="1"] .ru-warn{animation:none}
@keyframes ruwarn{to{background:#f97316}}
.ru-land h3{margin:2px 0 8px;font-size:calc(19px*var(--gfx-font,1))}
.ru-item{display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;margin-bottom:8px;padding:10px 12px;min-height:56px;border:2px solid var(--line);border-radius:14px;background:var(--card);color:var(--ink);text-align:left;font-size:calc(15px*var(--gfx-font,1));font-weight:700;cursor:pointer}
.ru-item .e{display:inline-flex}.ru-item small{display:block;font-weight:600;opacity:.75}.ru-item b{margin-left:auto;white-space:nowrap;display:inline-flex;align-items:center;gap:4px}
.ru-item.can{border-color:#22c55e;background:rgba(34,197,94,.13)}.ru-item.max{opacity:.5}
.ru-ov{position:absolute;inset:0;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px;text-align:center;background:rgba(3,5,25,.86);color:#fff}
.ru-ov h2{margin:0;font-size:calc(28px*var(--gfx-font,1))}.ru-ov p{margin:0;max-width:330px;font-size:calc(16px*var(--gfx-font,1));line-height:1.4}
.ru-btn{background:var(--accent,#6366f1);color:#fff;border:0;border-radius:16px;padding:15px 30px;min-height:54px;font-size:calc(18px*var(--gfx-font,1));font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.35)}
.ru-modes{display:flex;flex-direction:column;gap:8px;width:100%;max-width:340px}
.ru-mode{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:2px;min-height:58px;border:3px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff;border-radius:16px;padding:8px 14px;font:inherit;font-weight:800;cursor:pointer}
.ru-mode small{font-weight:600;opacity:.85;font-size:.8em}.ru-mode.on{border-color:#facc15;background:rgba(250,204,21,.22)}
`;

/* ---------- het spel ---------- */
export default {
  id: 'ruimte', name: 'Ruimtemissie', emoji: '🚀', color: '#4f46e5',
  desc: 'Je raket vliegt op brandstof: goede antwoorden tanken bij en geven turbo. Land op zeven planeten en bereik Planeet X!',
  tags: ['race', 'snel', 'solo'], minutes: 6, duo: false,
  create(host, env) {
    let dead = false, ended = false, raf = 0, last = 0, started = false, cool = false;
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms); timers.add(id); return id; };
    const snd = n => { try { env.snd && env.snd.play(n); } catch (e) { /* stil */ } };
    const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    host.innerHTML = '';
    const root = el('div', 'ru-root'); root.style.height = Math.max(560, env.h || 620) + 'px'; host.appendChild(root);
    const gx = Gx.start(root, env, 'ruimte');
    let route = 'klassiek';
    const mk = r => createSpace({ level: env.level, rand: env.rand || Math.random, fx: env.fx || {}, route: r });
    let m = mk(route), S = m.S;
    const hud = el('div', 'ru-hud'); const legEl = el('span'), fuelWrap = el('div', 'ru-fuel'), fuelBar = el('i'), crEl = el('span'), timeEl = el('span');
    fuelWrap.appendChild(fuelBar); hud.append(legEl, fuelWrap, crEl, timeEl); root.appendChild(hud);
    const cv = el('canvas', 'ru-cv'); root.appendChild(cv);
    const panel = el('div', 'ru-panel'); root.appendChild(panel);
    const warn = el('div', 'ru-warn', Gx.ic('rock', 26, '⚠️') + ' Asteroïdenveld! Antwoord snel en goed om uit te wijken!'); warn.style.display = 'none';
    const askBox = el('div'); const ak = mkAsker(env, askBox, mkQSource(env));
    panel.append(warn, askBox);
    const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    let W = env.w || 360; const H = 250;
    function resize() { W = cv.clientWidth || env.w || 360; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    resize();
    const ctx = cv.getContext && cv.getContext('2d');
    const stars = []; for (let i = 0; i < 90; i++) stars.push({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.7 });
    const parts = [], fl = []; let shake = 0, flash = 0, dodgeY = 0, astX = -1, astY = 0;
    const FONT = "'Apple Color Emoji','Segoe UI Emoji',sans-serif";
    const floatTxt = (txt, x, y, col) => fl.push({ txt, x, y, col, life: 1 });
    const burst = (x, y, n, col) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = 30 + Math.random() * 100; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.7, col }); } };
    const dark = gx.dark;
    function draw(dt) {
      if (!ctx) return; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const PLS = m.planets, pl = PLS[Math.min(S.leg, PLS.length - 1)], frac = clamp(S.pos / m.dist(), 0, 1), sp = S.phase === 'fly' ? m.speed() : 0;
      const q = gx.q(), calm = gx.reduce();
      const sx = shake > 0 && !calm ? (Math.random() - 0.5) * 8 * shake : 0; shake = Math.max(0, shake - dt * 3);
      ctx.save(); ctx.translate(sx, 0);
      ctx.fillStyle = dark ? '#fff' : 'rgba(255,255,255,.9)';
      const ns = q === 0 ? 30 : stars.length;
      for (let k = 0; k < ns; k++) { const s2 = stars[k]; if (!calm) { s2.x -= (sp * 0.012 + 0.01) * s2.z * dt * 2.2; if (s2.x < 0) { s2.x = 1; s2.y = Math.random(); } } const len = 1 + sp * s2.z * 0.35; ctx.globalAlpha = (dark ? 0.4 : 0.25) + 0.5 * s2.z; ctx.fillRect(s2.x * W, s2.y * H, len, 1.6); }
      ctx.globalAlpha = 1; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      // doelplaneet groeit
      const pr = 16 + frac * frac * 100, px = W + 20 - frac * (W * 0.34), py = H * 0.42;
      if (q > 0) { const gl = ctx.createRadialGradient(px, py, pr * 0.8, px, py, pr * 1.7); gl.addColorStop(0, pl.col + '66'); gl.addColorStop(1, pl.col + '00'); ctx.fillStyle = gl; ctx.fillRect(px - pr * 1.7, py - pr * 1.7, pr * 3.4, pr * 3.4); }
      if (pl.ic && Gx.has(pl.ic)) Gx.draw(ctx, pl.ic, px, py, pr * 2.1, pl.e, { shadow: false });
      else {
        const pg = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, pr * 0.1, px, py, pr); pg.addColorStop(0, '#fff'); pg.addColorStop(0.25, pl.col); pg.addColorStop(1, '#151a3a');
        ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, pr, 0, 6.3); ctx.fill();
        if (pl.n === 'Saturnus') { ctx.strokeStyle = 'rgba(240,220,160,.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(px, py, pr * 1.5, pr * 0.3, -0.3, 0, 6.3); ctx.stroke(); }
      }
      // achtergrondplaneetje van vorige
      if (S.leg > 0) { const pp = PLS[S.leg - 1], back = Math.max(0, 1 - frac * 3); ctx.globalAlpha = back; ctx.fillStyle = pp.col; ctx.beginPath(); ctx.arc(30 - frac * 120, H * 0.72, 40 * back + 4, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; }
      // asteroide
      if (S.danger > 0 && astX < 0) { astX = W + 20; astY = H * 0.5; }
      if (astX >= 0) { astX -= dt * (S.danger > 0 ? 90 : 300); Gx.draw(ctx, 'rock', astX, astY + dodgeY * 0.5, 54, '☄️', { rot: astX * 0.03, shadow: true }); if (astX < -30) astX = -1; }
      // raket
      const rx = W * 0.25, ry = H * 0.5 + Math.sin(S.t * 3) * 3 + dodgeY; dodgeY *= Math.pow(0.02, dt);
      const turbo = S.turbo > 0, fl2 = (turbo ? 40 : 22) + Math.random() * 8;
      if (S.phase === 'fly') { const fg = ctx.createLinearGradient(rx - 30 - fl2, 0, rx - 22, 0); fg.addColorStop(0, 'rgba(255,80,0,0)'); fg.addColorStop(1, turbo ? '#7dd3fc' : '#fbbf24'); ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(rx - 22, ry - 8); ctx.lineTo(rx - 30 - fl2, ry); ctx.lineTo(rx - 22, ry + 8); ctx.fill(); if (q > 0 && !calm && Math.random() < 0.5) gx.burst(rx - 30, ry, 'smoke', 1, { power: 0.2, angle: Math.PI, spread: 0.6, size: 0.6 }); }
      Gx.draw(ctx, 'rocket', rx, ry, 64, '🚀', { rot: Math.PI / 2, shadow: false });
      if (S.shieldCh > 0) { ctx.strokeStyle = 'rgba(96,165,250,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(rx, ry, 40, 0, 6.3); ctx.stroke(); }
      for (const p of parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; ctx.fillStyle = p.col; ctx.globalAlpha = clamp(p.life * 1.6, 0, 1); ctx.fillRect(p.x, p.y, 4, 4); }
      ctx.globalAlpha = 1; for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
      for (const t of fl) { t.life -= dt * 0.9; t.y -= 28 * dt; ctx.globalAlpha = clamp(t.life * 1.5, 0, 1); ctx.font = 'bold 20px sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.65)'; ctx.fillStyle = t.col; ctx.strokeText(t.txt, t.x, t.y); ctx.fillText(t.txt, t.x, t.y); }
      ctx.globalAlpha = 1; for (let i = fl.length - 1; i >= 0; i--) if (fl[i].life <= 0) fl.splice(i, 1);
      ctx.restore();
      // voortgangsbalk
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(14, H - 20, W - 28, 7); ctx.fillStyle = '#facc15'; ctx.fillRect(14, H - 20, (W - 28) * frac, 7);
      Gx.draw(ctx, 'rocket', 14 + (W - 28) * frac, H - 16, 26, '🚀', { rot: Math.PI / 2 });
      ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = dark ? '#e0e7ff' : '#1e293b'; ctx.textAlign = 'left'; ctx.lineWidth = 3; ctx.strokeStyle = dark ? 'rgba(0,0,0,.5)' : 'rgba(255,255,255,.7)'; const lab = '→ ' + pl.n + '  ' + Math.max(0, Math.round(m.dist() - S.pos)) + ' km'; ctx.strokeText(lab, 14, H - 36); ctx.fillText(lab, 14, H - 36); ctx.textAlign = 'center';
      if (turbo) { ctx.fillStyle = '#7dd3fc'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('⚡ TURBO', W * 0.25, 22); }
      if (flash > 0) { ctx.fillStyle = 'rgba(255,60,60,' + flash * 0.35 + ')'; ctx.fillRect(0, 0, W, H); flash = Math.max(0, flash - dt * 2.5); }
    }
    function renderHud() {
      legEl.innerHTML = Gx.ic('planet', 24, '🌌') + ' ' + Math.min(S.leg + 1, m.planets.length) + '/' + m.planets.length;
      fuelBar.style.width = clamp(S.fuel / m.tank(), 0, 1) * 100 + '%'; fuelBar.style.background = S.fuel / m.tank() < 0.25 ? '#ef4444' : '';
      crEl.innerHTML = Gx.ic('gem', 24, '💎') + ' ' + fmt(S.crystals); timeEl.innerHTML = Gx.ic('hourglass', 24, '⏱') + ' ' + mmss(S.cap - S.t);
      warn.style.display = S.danger > 0 ? 'block' : 'none';
    }
    function applyEvents(ev) {
      for (const e of ev) {
        if (e.type === 'good') { gx.burst(W * 0.25, 125, 'sparkle', 6, { power: 0.5 }); floatTxt('+⛽' + Math.round(e.fuel), W * 0.25, 70, '#86efac'); snd('goed'); }
        if (e.type === 'bad') { snd('fout'); }
        if (e.type === 'dodge') { dodgeY = -40; astY = 140; floatTxt('Uitgeweken! +4💎', W * 0.3, 40, '#fde047'); snd('power'); gx.burst(W * 0.25, 125, 'stars', 10); }
        if (e.type === 'hit') { shake = 1; flash = 1; burst(W * 0.25, 125, 20, '#fb923c'); gx.burst(W * 0.25, 125, 'smoke', 8); floatTxt('−14 ⛽', W * 0.25, 70, '#f87171'); snd('lose'); }
        if (e.type === 'blocked') { burst(W * 0.25, 115, 14, '#60a5fa'); floatTxt('🛡️ Geblokt', W * 0.25, 70, '#93c5fd'); snd('klik'); }
        if (e.type === 'asteroid') { snd('tik'); }
        if (e.type === 'land') { snd(e.last ? 'win' : 'level'); }
      }
    }
    function nextAsk() {
      if (dead || ended || !started || S.phase !== 'fly' || ak.busy() || cool) return;
      ak.start({ compact: true, feedback: true, autoNext: 400 }, r => {
        const ev = m.answer(r.ok); applyEvents(ev); renderHud(); cool = true; later(() => { cool = false; }, r.ok ? 200 : 800);
      });
    }
    function showLand(planet, bonus) {
      ak.cancel(); panel.innerHTML = '';
      const box = el('div', 'ru-land'); box.appendChild(el('h3', null, Gx.ic(planet.ic || 'planet', 30, planet.e) + ' Geland op ' + planet.n + '! +' + bonus + ' ' + Gx.ic('gem', 20, '💎') + ' · brandstof vol'));
      gx.burst((root.clientWidth || 360) / 2, 120, 'confetti', 30);
      const list = el('div'); box.appendChild(list);
      const draw2 = () => {
        list.innerHTML = '';
        for (const u of SPACE_UPG) {
          const c = m.cost(u.id), b = el('button', 'ru-item' + (c == null ? ' max' : S.crystals >= c ? ' can' : '')); b.type = 'button';
          b.innerHTML = '<span class="e">' + Gx.ic(u.ic, 38, u.emoji) + '</span><span>' + u.name + ' <small>' + u.desc + ' · niveau ' + S.up[u.id] + '</small></span><b>' + (c == null ? 'MAX' : Gx.ic('gem', 20, '💎') + ' ' + c) + '</b>';
          b.addEventListener('click', () => { if (m.buy(u.id)) { snd('power'); renderHud(); draw2(); } else snd('fout'); }); list.appendChild(b);
        }
      };
      draw2();
      const go = el('button', 'ru-btn', 'Opstijgen 🚀'); go.type = 'button'; go.style.width = '100%';
      go.addEventListener('click', () => { m.depart(); panel.innerHTML = ''; panel.append(warn, askBox); snd('klik'); renderHud(); });
      box.appendChild(go); panel.appendChild(box);
    }
    function loop(ts) {
      if (dead) return;
      const dt = Math.min(0.1, (ts - (last || ts)) / 1000); last = ts;
      if (!root.isConnected) { raf = setTimeout(() => { raf = requestAnimationFrame(loop); }, 400); return; }
      if (started && !ended) {
        const ev = m.tick(dt);
        if (ev.length) {
          applyEvents(ev);
          for (const e of ev) {
            if (e.type === 'land') { if (e.last) later(() => finish(true), 900); else later(() => showLand(e.planet, e.bonus), 700); }
            if (e.type === 'over') finish(false);
          }
        }
        if (S.phase === 'fly') nextAsk();
        renderHud();
      }
      draw(dt); raf = requestAnimationFrame(loop);
    }
    function finish(win) {
      if (ended) return; ended = true; ak.cancel(); snd(win ? 'win' : 'level');
      const ov = el('div', 'ru-ov', '<h2>' + Gx.ic(win ? 'earth' : 'hourglass', 44, win ? '🌍' : '⏱') + '<br>' + (win ? 'Planeet X bereikt!' : 'Missietijd om') + '</h2><p>' + S.landed + ' planeten bereikt · beste reeks ' + S.best + '</p>'); root.appendChild(ov); if (win) gx.burst((root.clientWidth || 360) / 2, 200, 'confetti', 60);
      later(() => { try { env.end({ score: m.finalScore(), win, stats: { correct: S.correct, wrong: S.wrong, 'best streak': S.best, planeten: S.landed, uitgeweken: S.dodged }, summary: S.landed + '/' + m.planets.length + ' planeten bereikt (' + m.route.name + ')' }); } catch (e) { /* hub */ } }, 1600);
    }
    const intro = el('div', 'ru-ov', '<h2>' + Gx.ic('rocket', 44, '🚀') + '<br>Ruimtemissie</h2><p>Antwoord goed om te tanken en turbo te krijgen (3 goed op rij). Bij asteroïden moet je snel én goed antwoorden. Kies je reis!</p>');
    const modesBox = el('div', 'ru-modes'); const modeBtns = {};
    Object.entries(ROUTES).forEach(([id, rt]) => {
      const b = el('button', 'ru-mode' + (id === route ? ' on' : ''), '<span>' + rt.name + '</span><small>' + rt.desc + '</small>'); b.type = 'button';
      b.addEventListener('click', () => { route = id; Object.entries(modeBtns).forEach(([k, x]) => { x.className = 'ru-mode' + (k === id ? ' on' : ''); }); snd('klik'); });
      modeBtns[id] = b; modesBox.appendChild(b);
    });
    intro.appendChild(modesBox);
    const go = el('button', 'ru-btn', 'Tik om te beginnen'); go.type = 'button';
    go.addEventListener('click', () => { intro.remove(); snd('klik'); if (route !== 'klassiek') { m = mk(route); S = m.S; } started = true; });
    intro.appendChild(go); root.appendChild(intro);
    renderHud(); raf = requestAnimationFrame(loop);
    const onResize = () => resize(); window.addEventListener && window.addEventListener('resize', onResize);
    return {
      destroy() {
        dead = true; gx.destroy(); cancelAnimationFrame(raf); clearTimeout(raf); timers.forEach(clearTimeout); timers.clear();
        try { ak.cancel(); } catch (e) { /* ok */ }
        window.removeEventListener && window.removeEventListener('resize', onResize);
        style.remove(); try { host.innerHTML = ''; } catch (e) { /* ok */ }
      },
    };
  },
};
