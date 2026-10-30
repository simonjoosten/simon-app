// Ruimtemissie – je raket vliegt op brandstof. Goede antwoorden tanken bij, reeksen geven turbo, asteroïden dwingen je tot snel antwoorden.
// Land op 7 bestemmingen, koop kristal-upgrades en bereik Planeet X. Pure logica: createSpace.

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
export const PLANETS = [
  { n: 'de Maan', e: '🌙', d: 220, col: '#cbd5e1' }, { n: 'Mars', e: '🔴', d: 300, col: '#ef6a4a' }, { n: 'Venus', e: '🟠', d: 380, col: '#f5b35a' },
  { n: 'Jupiter', e: '🟤', d: 420, col: '#c58b5c' }, { n: 'Saturnus', e: '🪐', d: 470, col: '#e8cf8d' }, { n: 'Neptunus', e: '🔵', d: 520, col: '#4f7bff' },
  { n: 'Planeet X', e: '🌍', d: 560, col: '#34d399' },
];
export const SPACE_UPG = [
  { id: 'engine', name: 'Straalmotor', emoji: '🚀', desc: 'Sneller vliegen', costs: [25, 50, 90, 150] },
  { id: 'tank', name: 'Grote tank', emoji: '⛽', desc: 'Meer brandstof mee', costs: [20, 45, 80] },
  { id: 'eff', name: 'Zuinige motor', emoji: '🌿', desc: 'Minder verbruik', costs: [25, 55, 95] },
  { id: 'shield', name: 'Ruimteschild', emoji: '🛡️', desc: 'Vangt asteroïden op', costs: [25, 60, 110] },
  { id: 'magnet', name: 'Brandstofmagneet', emoji: '🧲', desc: 'Meer brandstof per antwoord', costs: [25, 55, 95] },
];

export function createSpace({ level = 2, rand = Math.random, fx = {} } = {}) {
  const dF = level === 1 ? 0.88 : level === 3 ? 1.12 : 1;
  const S = {
    t: 0, leg: 0, pos: 0, fuel: 100, crystals: Math.round(fx.startCash || 0), got: 0, up: {}, shieldCh: fx.shield || 0, streak: 0, turbo: 0, phase: 'fly', danger: 0, astT: 14 + rand() * 6,
    correct: 0, wrong: 0, best: 0, score: 0, dodged: 0, hits: 0, landed: 0, firstGain: null,
  };
  SPACE_UPG.forEach(u => { S.up[u.id] = 0; });
  const m = { S };
  m.tank = () => 100 + 25 * S.up.tank + 10 * (fx.extraLives || 0);
  m.speed = () => (8 + 1.5 * S.up.engine) * (S.turbo > 0 ? 1.5 : 1) * (S.fuel > 0 ? 1 : 0.25);
  m.drain = () => 4.2 * (1 - 0.1 * S.up.eff);
  m.dist = () => PLANETS[Math.min(S.leg, PLANETS.length - 1)].d * dF;
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
    else if (S.astT <= 0) { S.astT = 18 + rand() * 8; S.danger = 8; ev.push({ type: 'asteroid' }); }
    if (S.pos >= m.dist()) {
      const p = PLANETS[S.leg]; S.landed++; S.danger = 0;
      const bonus = 12 + 6 * S.leg; S.crystals += bonus; S.got += bonus; S.score += 100 * (S.leg + 1);
      S.fuel = m.tank(); S.shieldCh = Math.max(S.shieldCh, S.up.shield + (fx.shield || 0)); S.phase = 'land'; S.streak = 0; S.turbo = 0;
      ev.push({ type: 'land', planet: p, bonus, last: S.leg >= PLANETS.length - 1 });
      if (S.leg >= PLANETS.length - 1) S.phase = 'won';
    } else if (S.t >= SPACE_CAP) { S.phase = 'over'; ev.push({ type: 'over' }); }
    return ev;
  };
  m.cost = id => { const u = SPACE_UPG.find(x => x.id === id); return S.up[id] >= u.costs.length ? null : u.costs[S.up[id]]; };
  m.buy = id => { const c = m.cost(id); if (c == null || S.crystals < c) return false; S.crystals -= c; S.up[id]++; if (id === 'tank') S.fuel = m.tank(); if (id === 'shield') S.shieldCh++; return true; };
  m.depart = () => { if (S.phase !== 'land') return; S.leg++; S.pos = 0; S.phase = 'fly'; S.astT = 12 + rand() * 6; };
  m.finalScore = () => S.score + (S.phase === 'won' ? 300 : 0);
  return m;
}

/* ---------- stijl ---------- */
const CSS = `
.ru-root{position:relative;display:flex;flex-direction:column;width:100%;box-sizing:border-box;background:var(--card);color:var(--ink);border-radius:14px;overflow:hidden;font-family:inherit;user-select:none;-webkit-user-select:none}
.ru-hud{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 12px;font-weight:800;font-size:14px;border-bottom:1px solid var(--line)}
.ru-fuel{flex:1 1 90px;height:12px;border-radius:7px;background:var(--line);overflow:hidden;min-width:70px}.ru-fuel>i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#22c55e,#facc15);transition:width .2s}
.ru-cv{display:block;width:100%;height:230px;background:#050818}
.ru-panel{flex:1 1 auto;min-height:210px;padding:6px 8px 10px;border-top:1px solid var(--line);overflow:auto}
.ru-warn{background:#dc2626;color:#fff;text-align:center;font-weight:900;border-radius:8px;padding:4px;margin-bottom:4px;animation:ruwarn .5s infinite alternate}
@keyframes ruwarn{to{background:#f97316}}
.ru-land h3{margin:2px 0 8px;font-size:18px}
.ru-item{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;margin-bottom:6px;padding:8px 10px;border:1.5px solid var(--line);border-radius:12px;background:var(--card);color:var(--ink);text-align:left;font-size:14px;font-weight:700;cursor:pointer}
.ru-item .e{font-size:24px}.ru-item small{display:block;font-weight:600;opacity:.75}.ru-item b{margin-left:auto;white-space:nowrap}
.ru-item.can{border-color:#22c55e;background:rgba(34,197,94,.13)}.ru-item.max{opacity:.5}
.ru-ov{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:20px;text-align:center;background:rgba(3,5,25,.88);color:#fff}
.ru-ov h2{margin:0;font-size:26px}.ru-ov p{margin:0;max-width:310px;font-size:15px;line-height:1.35}
.ru-btn{background:var(--accent,#6366f1);color:#fff;border:0;border-radius:12px;padding:12px 26px;font-size:17px;font-weight:800;cursor:pointer}
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
    const root = el('div', 'ru-root'); root.style.height = Math.max(540, env.h || 620) + 'px'; host.appendChild(root);
    const m = createSpace({ level: env.level, rand: env.rand || Math.random, fx: env.fx || {} });
    const S = m.S;
    const hud = el('div', 'ru-hud'); const legEl = el('span'), fuelWrap = el('div', 'ru-fuel'), fuelBar = el('i'), crEl = el('span'), timeEl = el('span');
    fuelWrap.appendChild(fuelBar); hud.append(legEl, fuelWrap, crEl, timeEl); root.appendChild(hud);
    const cv = el('canvas', 'ru-cv'); root.appendChild(cv);
    const panel = el('div', 'ru-panel'); root.appendChild(panel);
    const warn = el('div', 'ru-warn', '⚠️ Asteroïdenveld! Antwoord snel en goed om uit te wijken!'); warn.style.display = 'none';
    const askBox = el('div'); const ak = mkAsker(env, askBox, mkQSource(env));
    panel.append(warn, askBox);
    const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    let W = env.w || 360; const H = 230;
    function resize() { W = cv.clientWidth || env.w || 360; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    resize();
    const ctx = cv.getContext && cv.getContext('2d');
    const stars = []; for (let i = 0; i < 70; i++) stars.push({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.7 });
    const parts = [], fl = []; let shake = 0, flash = 0, dodgeY = 0, astX = -1, astY = 0;
    const FONT = "'Apple Color Emoji','Segoe UI Emoji',sans-serif";
    const floatTxt = (txt, x, y, col) => fl.push({ txt, x, y, col, life: 1 });
    const burst = (x, y, n, col) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = 30 + Math.random() * 100; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.7, col }); } };
    function draw(dt) {
      if (!ctx) return; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const pl = PLANETS[Math.min(S.leg, PLANETS.length - 1)], frac = clamp(S.pos / m.dist(), 0, 1), sp = S.phase === 'fly' ? m.speed() : 0;
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#04061a'); g.addColorStop(1, '#1b1050'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const sx = shake > 0 ? (Math.random() - 0.5) * 8 * shake : 0; shake = Math.max(0, shake - dt * 3);
      ctx.save(); ctx.translate(sx, 0);
      ctx.fillStyle = '#fff';
      for (const s of stars) { s.x -= (sp * 0.012 + 0.01) * s.z * dt * 2.2; if (s.x < 0) { s.x = 1; s.y = Math.random(); } const len = 1 + sp * s.z * 0.35; ctx.globalAlpha = 0.4 + 0.6 * s.z; ctx.fillRect(s.x * W, s.y * H, len, 1.5); }
      ctx.globalAlpha = 1; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      // doelplaneet groeit
      const pr = 14 + frac * frac * 95, px = W + 20 - frac * (W * 0.34) - (S.phase === 'land' || S.phase === 'won' ? 0 : 0);
      const pg = ctx.createRadialGradient(px - pr * 0.3, H * 0.42 - pr * 0.3, pr * 0.1, px, H * 0.42, pr); pg.addColorStop(0, '#fff'); pg.addColorStop(0.25, pl.col); pg.addColorStop(1, '#151a3a');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, H * 0.42, pr, 0, 6.3); ctx.fill();
      if (pl.e === '🪐') { ctx.strokeStyle = 'rgba(240,220,160,.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(px, H * 0.42, pr * 1.5, pr * 0.3, -0.3, 0, 6.3); ctx.stroke(); }
      // achtergrondplaneetje van vorige
      if (S.leg > 0) { const pp = PLANETS[S.leg - 1], back = Math.max(0, 1 - frac * 3); ctx.globalAlpha = back; ctx.fillStyle = pp.col; ctx.beginPath(); ctx.arc(30 - frac * 120, H * 0.7, 40 * back + 4, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; }
      // asteroide
      if (S.danger > 0 && astX < 0) { astX = W + 20; astY = H * 0.5; }
      if (astX >= 0) { astX -= dt * (S.danger > 0 ? 90 : 300); ctx.font = '40px ' + FONT; ctx.fillText('☄️', astX, astY + dodgeY * 0.5); if (astX < -30) astX = -1; }
      // raket
      const rx = W * 0.25, ry = H * 0.5 + Math.sin(S.t * 3) * 3 + dodgeY; dodgeY *= Math.pow(0.02, dt);
      const turbo = S.turbo > 0, fl2 = (turbo ? 38 : 20) + Math.random() * 8;
      if (S.phase === 'fly') { const fg = ctx.createLinearGradient(rx - 22 - fl2, 0, rx - 14, 0); fg.addColorStop(0, 'rgba(255,80,0,0)'); fg.addColorStop(1, turbo ? '#7dd3fc' : '#fbbf24'); ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(rx - 14, ry - 6); ctx.lineTo(rx - 22 - fl2, ry); ctx.lineTo(rx - 14, ry + 6); ctx.fill(); }
      ctx.save(); ctx.translate(rx, ry); ctx.rotate(Math.PI / 4); ctx.font = '40px ' + FONT; ctx.fillText('🚀', 0, 0); ctx.restore();
      if (S.shieldCh > 0) { ctx.strokeStyle = 'rgba(96,165,250,.8)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(rx, ry, 30, 0, 6.3); ctx.stroke(); }
      for (const p of parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; ctx.fillStyle = p.col; ctx.globalAlpha = clamp(p.life * 1.6, 0, 1); ctx.fillRect(p.x, p.y, 4, 4); }
      ctx.globalAlpha = 1; for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
      for (const t of fl) { t.life -= dt * 0.9; t.y -= 28 * dt; ctx.globalAlpha = clamp(t.life * 1.5, 0, 1); ctx.font = 'bold 17px sans-serif'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.fillStyle = t.col; ctx.strokeText(t.txt, t.x, t.y); ctx.fillText(t.txt, t.x, t.y); }
      ctx.globalAlpha = 1; for (let i = fl.length - 1; i >= 0; i--) if (fl[i].life <= 0) fl.splice(i, 1);
      ctx.restore();
      // voortgangsbalk
      ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(14, H - 18, W - 28, 5); ctx.fillStyle = '#facc15'; ctx.fillRect(14, H - 18, (W - 28) * frac, 5);
      ctx.font = '14px ' + FONT; ctx.fillText('🚀', 14 + (W - 28) * frac, H - 15); ctx.fillText(pl.e, W - 12, H - 28);
      ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#e0e7ff'; ctx.textAlign = 'left'; ctx.fillText('→ ' + pl.n + '  ' + Math.max(0, Math.round(m.dist() - S.pos)) + ' km', 14, H - 30); ctx.textAlign = 'center';
      if (turbo) { ctx.fillStyle = '#7dd3fc'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('⚡ TURBO', W * 0.25, 22); }
      if (flash > 0) { ctx.fillStyle = 'rgba(255,60,60,' + flash * 0.35 + ')'; ctx.fillRect(0, 0, W, H); flash = Math.max(0, flash - dt * 2.5); }
    }
    function renderHud() {
      legEl.textContent = '🌌 ' + Math.min(S.leg + 1, PLANETS.length) + '/' + PLANETS.length;
      fuelBar.style.width = clamp(S.fuel / m.tank(), 0, 1) * 100 + '%'; fuelBar.style.background = S.fuel / m.tank() < 0.25 ? '#ef4444' : '';
      crEl.textContent = '💎 ' + fmt(S.crystals); timeEl.textContent = '⏱ ' + mmss(SPACE_CAP - S.t);
      warn.style.display = S.danger > 0 ? 'block' : 'none';
    }
    function applyEvents(ev) {
      for (const e of ev) {
        if (e.type === 'good') { floatTxt('+⛽' + Math.round(e.fuel), W * 0.25, 70, '#86efac'); snd('goed'); }
        if (e.type === 'bad') { snd('fout'); }
        if (e.type === 'dodge') { dodgeY = -40; astY = 140; floatTxt('Uitgeweken! +4💎', W * 0.3, 40, '#fde047'); snd('power'); }
        if (e.type === 'hit') { shake = 1; flash = 1; burst(W * 0.25, 115, 20, '#fb923c'); floatTxt('−14 ⛽', W * 0.25, 70, '#f87171'); snd('lose'); }
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
      const box = el('div', 'ru-land'); box.appendChild(el('h3', null, planet.e + ' Geland op ' + planet.n + '! +' + bonus + ' 💎 · brandstof vol'));
      const list = el('div'); box.appendChild(list);
      const draw2 = () => {
        list.innerHTML = '';
        for (const u of SPACE_UPG) {
          const c = m.cost(u.id), b = el('button', 'ru-item' + (c == null ? ' max' : S.crystals >= c ? ' can' : '')); b.type = 'button';
          b.innerHTML = '<span class="e">' + u.emoji + '</span><span>' + u.name + ' <small>' + u.desc + ' · niveau ' + S.up[u.id] + '</small></span><b>' + (c == null ? 'MAX' : '💎 ' + c) + '</b>';
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
      const ov = el('div', 'ru-ov', '<h2>' + (win ? '🌍 Planeet X bereikt!' : '⏱ Missietijd om') + '</h2><p>' + S.landed + ' planeten bereikt · beste reeks ' + S.best + '</p>'); root.appendChild(ov);
      later(() => { try { env.end({ score: m.finalScore(), win, stats: { correct: S.correct, wrong: S.wrong, 'best streak': S.best, planeten: S.landed, uitgeweken: S.dodged }, summary: S.landed + '/' + PLANETS.length + ' planeten bereikt' }); } catch (e) { /* hub */ } }, 1600);
    }
    const intro = el('div', 'ru-ov', '<h2>🚀 Ruimtemissie</h2><p>Antwoord goed om te tanken en turbo te krijgen (3 goed op rij). Bij ⚠️ asteroïden moet je snel én goed antwoorden. Land op 7 planeten!</p>');
    const go = el('button', 'ru-btn', 'Tik om te beginnen'); go.type = 'button';
    go.addEventListener('click', () => { intro.remove(); snd('klik'); started = true; });
    intro.appendChild(go); root.appendChild(intro);
    renderHud(); raf = requestAnimationFrame(loop);
    const onResize = () => resize(); window.addEventListener && window.addEventListener('resize', onResize);
    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf); clearTimeout(raf); timers.forEach(clearTimeout); timers.clear();
        try { ak.cancel(); } catch (e) { /* ok */ }
        window.removeEventListener && window.removeEventListener('resize', onResize);
        style.remove(); try { host.innerHTML = ''; } catch (e) { /* ok */ }
      },
    };
  },
};
