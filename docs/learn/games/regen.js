// Woordenregen – meteoren vallen op je stad. Elk goed antwoord schiet de laagste meteoor weg. Overleef 6 golven en koop upgrades tussendoor.
// Pure logica (createRain) is los testbaar; de view tekent een canvas en gebruikt alleen env.ask voor vragen.

/* ---------- helpers ---------- */
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const fmt = n => Math.round(n).toLocaleString('nl-NL');
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
export const RAIN_WAVES = 6;
export const RAIN_SHOP = [
  { id: 'life', name: 'Extra leven', emoji: '❤️', desc: '+1 leven (max 6)', base: 28 },
  { id: 'shield', name: 'Stadsschild', emoji: '🛡️', desc: 'Vangt 1 inslag op', base: 24 },
  { id: 'slow', name: 'Zwaartekrachtveld', emoji: '🧊', desc: 'Meteoren vallen 10% trager', base: 36 },
  { id: 'turret', name: 'Laserkanon', emoji: '🤖', desc: 'Schiet zelf af en toe een meteoor weg', base: 48 },
  { id: 'coin', name: 'Muntmagneet', emoji: '💰', desc: '+30% munten per meteoor', base: 30 },
];

export function createRain({ level = 2, rand = Math.random, fx = {} } = {}) {
  const gapF = level === 1 ? 1.2 : level === 3 ? 0.88 : 1, fallF = level === 1 ? 1.2 : level === 3 ? 0.88 : 1;
  const lives0 = 3 + (level === 1 ? 1 : 0) + (fx.extraLives || 0);
  const S = {
    t: 0, wave: 1, total: 0, spawned: 0, lives: lives0, maxLives: Math.max(6, lives0), shield: fx.shield || 0, coins: Math.round(fx.startCash || 0), earned: 0, score: 0,
    combo: 0, best: 0, correct: 0, wrong: 0, kills: 0, meteors: [], items: [], freeze: 0, turretT: 10, up: { life: 0, shield: 0, slow: 0, turret: 0, coin: 0 },
    phase: 'play', spawnIn: 1.2, id: 1, sel: 0, firstKill: null,
  };
  const m = { S };
  const T = n => 5 + n;
  S.total = T(1);
  const fallTime = () => (20 - 1.4 * S.wave) * fallF * (1 + 0.1 * S.up.slow) * (1 + (fx.timeBonus || 0) / 60);
  const gap = () => (7.2 - 0.4 * S.wave) * gapF;
  m.rocks = () => S.meteors.filter(x => x.kind === 'rock');
  m.target = () => {
    const rs = m.rocks(); if (!rs.length) return null;
    return rs.find(r => r.id === S.sel) || rs.reduce((b, r) => (r.y > b.y ? r : b), rs[0]);
  };
  function dropItem(x, y) {
    if (rand() >= 0.14 + 0.18 * (fx.luck || 0)) return;
    const r = rand(); S.items.push({ id: S.id++, kind: r < 0.45 ? 'ice' : r < 0.7 ? 'bomb' : 'heart', x, y, life: 9 });
  }
  function kill(r, free) {
    S.meteors = S.meteors.filter(x => x !== r); S.kills++;
    const c = Math.round((4 + Math.min(S.combo, 8) / 2) * (1 + 0.3 * S.up.coin) * (fx.cashMult || 1) * (free ? 0.5 : 1));
    S.coins += c; S.earned += c; S.score += 10 + Math.min(S.combo, 15) * 2;
    if (S.firstKill == null) S.firstKill = S.t;
    if (S.sel === r.id) S.sel = 0;
    dropItem(r.x, r.y);
    return c;
  }
  function spawn() {
    const x = 0.08 + rand() * 0.84;
    S.meteors.push({ id: S.id++, kind: 'rock', x, y: -0.05, v: 1 / fallTime(), size: 0.8 + rand() * 0.5, spin: rand() * 6 });
    S.spawned++;
  }
  m.answer = ok => {
    const r = m.target(); const ev = [];
    if (ok) {
      S.correct++; S.combo++; S.best = Math.max(S.best, S.combo);
      if (r) { const x = r.x, y = r.y, c = kill(r); ev.push({ type: 'kill', x, y, coins: c }); }
    } else {
      S.wrong++; S.combo = 0; if (r) { r.y += 0.08; ev.push({ type: 'miss', x: r.x, y: r.y }); }
    }
    return ev;
  };
  m.collect = id => {
    const it = S.items.find(x => x.id === id); if (!it) return null;
    S.items = S.items.filter(x => x !== it);
    if (it.kind === 'ice') S.freeze = 5;
    else if (it.kind === 'heart') S.lives = Math.min(S.maxLives, S.lives + 1);
    else { for (const r of m.rocks()) { kill(r, true); } }
    return it.kind;
  };
  m.select = id => { if (S.meteors.some(r => r.id === id && r.kind === 'rock')) S.sel = id; };
  m.tick = dt => {
    const ev = []; if (S.phase !== 'play') return ev;
    S.t += dt;
    const mult = S.freeze > 0 ? 0.25 : 1; S.freeze = Math.max(0, S.freeze - dt);
    for (const r of S.meteors.slice()) {
      r.y += r.v * dt * mult;
      if (r.y >= 1) {
        S.meteors = S.meteors.filter(x => x !== r); S.combo = 0;
        if (S.sel === r.id) S.sel = 0;
        if (S.shield > 0) { S.shield--; ev.push({ type: 'blocked', x: r.x }); } else { S.lives--; ev.push({ type: 'hit', x: r.x }); }
      }
    }
    for (const it of S.items.slice()) { it.y += dt * 0.05; it.life -= dt; if (it.life <= 0) S.items = S.items.filter(x => x !== it); }
    if (S.lives <= 0) { S.phase = 'over'; ev.push({ type: 'over' }); return ev; }
    if (S.spawned < S.total) { S.spawnIn -= dt; if (S.spawnIn <= 0) { spawn(); S.spawnIn = gap(); ev.push({ type: 'spawn' }); } }
    if (S.up.turret > 0) {
      S.turretT -= dt;
      if (S.turretT <= 0) { S.turretT = Math.max(6, 16 - 3 * S.up.turret); const r = m.target(); if (r) { ev.push({ type: 'laser', x: r.x, y: r.y }); kill(r, true); } }
    }
    if (S.spawned >= S.total && !m.rocks().length) {
      S.score += 25 * S.wave;
      if (S.wave >= RAIN_WAVES) { S.phase = 'won'; S.score += S.lives * 50; ev.push({ type: 'won' }); } else { S.phase = 'shop'; ev.push({ type: 'wave-clear' }); }
    }
    return ev;
  };
  m.cost = id => { const it = RAIN_SHOP.find(x => x.id === id); return Math.round(it.base * (1 + 0.45 * S.up[id])); };
  m.buy = id => {
    const c = m.cost(id); if (S.coins < c) return false;
    if (id === 'life' && S.lives >= S.maxLives) return false;
    S.coins -= c; S.up[id]++;
    if (id === 'life') S.lives++; if (id === 'shield') S.shield++;
    return true;
  };
  m.nextWave = () => { if (S.phase !== 'shop') return; S.wave++; S.total = T(S.wave); S.spawned = 0; S.spawnIn = 1.5; S.phase = 'play'; S.meteors = []; S.items = []; S.turretT = Math.max(6, 16 - 3 * S.up.turret); };
  m.finalScore = () => S.score;
  return m;
}

/* ---------- stijl ---------- */
const CSS = `
.rg-root{position:relative;display:flex;flex-direction:column;width:100%;box-sizing:border-box;background:var(--card);color:var(--ink);border-radius:14px;overflow:hidden;font-family:inherit;user-select:none;-webkit-user-select:none}
.rg-hud{display:flex;justify-content:space-between;gap:6px;padding:7px 12px;font-weight:800;font-size:14px;border-bottom:1px solid var(--line)}
.rg-cv{display:block;width:100%;flex:1 1 auto;min-height:230px;background:#0b1030;touch-action:manipulation}
.rg-panel{flex:0 0 auto;min-height:200px;padding:6px 8px 10px;border-top:1px solid var(--line)}
.rg-shop{padding:8px 4px}.rg-shop h3{margin:0 0 6px;font-size:17px}
.rg-item{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;margin-bottom:6px;padding:8px 10px;border:1.5px solid var(--line);border-radius:12px;background:var(--card);color:var(--ink);text-align:left;font-size:14px;font-weight:700;cursor:pointer}
.rg-item .e{font-size:26px}.rg-item small{display:block;font-weight:600;opacity:.75}.rg-item b{margin-left:auto;white-space:nowrap}
.rg-item.can{border-color:#22c55e;background:rgba(34,197,94,.13)}
.rg-ov{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:20px;text-align:center;background:rgba(5,8,30,.86);color:#fff}
.rg-ov h2{margin:0;font-size:26px}.rg-ov p{margin:0;max-width:310px;font-size:15px;line-height:1.35}
.rg-btn{background:var(--accent,#6366f1);color:#fff;border:0;border-radius:12px;padding:12px 26px;font-size:17px;font-weight:800;cursor:pointer}
.rg-wait{padding:34px 10px;text-align:center;font-weight:700;opacity:.7}
`;

/* ---------- het spel ---------- */
export default {
  id: 'regen', name: 'Woordenregen', emoji: '☄️', color: '#0ea5e9',
  desc: 'Meteoren vallen op je stad! Elk goed antwoord schiet de laagste meteoor weg. Overleef zes golven.',
  tags: ['snel', 'verdedigen', 'solo'], minutes: 5, duo: false,
  create(host, env) {
    let dead = false, ended = false, raf = 0, last = 0, started = false, askOn = false, cool = false, shopShown = false;
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms); timers.add(id); return id; };
    const snd = n => { try { env.snd && env.snd.play(n); } catch (e) { /* stil */ } };
    const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    host.innerHTML = '';
    const root = el('div', 'rg-root'); root.style.height = Math.max(540, env.h || 620) + 'px'; host.appendChild(root);
    const m = createRain({ level: env.level, rand: env.rand || Math.random, fx: env.fx || {} });
    const S = m.S;
    const hud = el('div', 'rg-hud'); const waveEl = el('span'), livesEl = el('span'), coinEl = el('span'), comboEl = el('span');
    hud.append(waveEl, livesEl, coinEl, comboEl); root.appendChild(hud);
    const cv = el('canvas', 'rg-cv'); root.appendChild(cv);
    const panel = el('div', 'rg-panel'); root.appendChild(panel);
    const askBox = el('div'); const ak = mkAsker(env, askBox, mkQSource(env)); panel.appendChild(askBox);
    const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    let W = env.w || 360, H = 300;
    function resize() { W = cv.clientWidth || env.w || 360; H = cv.clientHeight || 300; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    resize();
    const ctx = cv.getContext && cv.getContext('2d');
    const stars = []; for (let i = 0; i < 40; i++) stars.push({ x: Math.random(), y: Math.random() * 0.8, s: Math.random() * 1.6 + 0.4 });
    const fl = [], parts = [], lasers = []; let flash = 0, shake = 0;
    const FONT = "'Apple Color Emoji','Segoe UI Emoji',sans-serif";
    const burst = (x, y, n, col) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = 40 + Math.random() * 110; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.7, col }); } };
    const floatTxt = (txt, x, y, col) => fl.push({ txt, x, y, col, life: 1 });
    function groundY() { return H - 38; }
    function draw(dt) {
      if (!ctx) return; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05081f'); g.addColorStop(0.7, '#1c2b66'); g.addColorStop(1, '#5a3f7a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; for (const s of stars) { ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(S.t * 0.8 + s.x * 20)); ctx.fillRect(s.x * W, s.y * H, s.s, s.s); } ctx.globalAlpha = 1;
      const sx = shake > 0 ? (Math.random() - 0.5) * 10 * shake : 0; shake = Math.max(0, shake - dt * 3);
      ctx.save(); ctx.translate(sx, 0);
      // stad
      const gy = groundY(); ctx.fillStyle = '#10163a'; ctx.fillRect(-10, gy, W + 20, H - gy);
      for (let i = 0; i < 12; i++) { const bx = (i / 12) * W, bw = W / 12 - 3, bh = 12 + ((i * 37) % 22); ctx.fillStyle = i % 2 ? '#1b2456' : '#222d6b'; ctx.fillRect(bx, gy - bh, bw, bh); ctx.fillStyle = '#ffd86b'; if ((i + Math.floor(S.t)) % 3) ctx.fillRect(bx + 3, gy - bh + 4, 3, 3); }
      if (S.shield > 0) { ctx.strokeStyle = 'rgba(96,165,250,' + (0.5 + 0.3 * Math.sin(S.t * 4)) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W / 2, gy + 30, W * 0.55, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const tg = m.target();
      for (const r of S.meteors) {
        const x = r.x * W, y = r.y * (gy - 10), sz = 30 * r.size;
        const tail = ctx.createLinearGradient(x, y - 60, x, y); tail.addColorStop(0, 'rgba(255,140,40,0)'); tail.addColorStop(1, 'rgba(255,170,60,.75)');
        ctx.fillStyle = tail; ctx.beginPath(); ctx.moveTo(x - sz * 0.35, y); ctx.lineTo(x + sz * 0.35, y); ctx.lineTo(x, y - 62); ctx.fill();
        const rg = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, sz * 0.6); rg.addColorStop(0, '#fcd9a0'); rg.addColorStop(0.5, '#b4693a'); rg.addColorStop(1, '#5a2f1c');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, sz * 0.55, 0, 6.3); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(x + 4, y + 3, sz * 0.12, 0, 6.3); ctx.arc(x - 6, y - 4, sz * 0.09, 0, 6.3); ctx.fill();
        if (S.freeze > 0) { ctx.font = '16px ' + FONT; ctx.fillText('❄️', x + sz * 0.4, y - sz * 0.4); }
        if (r === tg) { ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(x, y, sz * 0.55 + 8 + Math.sin(S.t * 8) * 2, 0, 6.3); ctx.stroke(); ctx.setLineDash([]); }
      }
      for (const it of S.items) { const x = it.x * W, y = it.y * (gy - 10) + 20; ctx.globalAlpha = it.life < 2 ? 0.5 + 0.5 * Math.sin(S.t * 14) : 1; ctx.font = '30px ' + FONT; ctx.fillText(it.kind === 'ice' ? '🧊' : it.kind === 'bomb' ? '💣' : '💖', x, y + Math.sin(S.t * 4 + it.id) * 3); ctx.globalAlpha = 1; }
      for (const l of lasers) { l.life -= dt * 5; ctx.strokeStyle = 'rgba(120,255,200,' + clamp(l.life, 0, 1) + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(W / 2, gy); ctx.lineTo(l.x * W, l.y * (gy - 10)); ctx.stroke(); }
      for (let i = lasers.length - 1; i >= 0; i--) if (lasers[i].life <= 0) lasers.splice(i, 1);
      ctx.font = '26px ' + FONT; ctx.fillText('🚀', W / 2, gy - 6);
      for (const p of parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 160 * dt; ctx.fillStyle = p.col; ctx.globalAlpha = clamp(p.life * 1.6, 0, 1); ctx.fillRect(p.x, p.y, 4, 4); }
      ctx.globalAlpha = 1; for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
      for (const t of fl) { t.life -= dt * 0.9; t.y -= 30 * dt; ctx.globalAlpha = clamp(t.life * 1.5, 0, 1); ctx.font = 'bold 18px sans-serif'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.fillStyle = t.col; ctx.strokeText(t.txt, t.x, t.y); ctx.fillText(t.txt, t.x, t.y); }
      ctx.globalAlpha = 1; for (let i = fl.length - 1; i >= 0; i--) if (fl[i].life <= 0) fl.splice(i, 1);
      ctx.restore();
      if (flash > 0) { ctx.fillStyle = 'rgba(255,60,60,' + flash * 0.4 + ')'; ctx.fillRect(0, 0, W, H); flash = Math.max(0, flash - dt * 2.5); }
    }
    function renderHud() {
      waveEl.textContent = '🌊 Golf ' + S.wave + '/' + RAIN_WAVES; livesEl.textContent = '❤️'.repeat(Math.min(S.lives, 8)) + (S.shield ? ' 🛡️' + S.shield : '');
      coinEl.textContent = '💰 ' + fmt(S.coins); comboEl.textContent = S.combo >= 2 ? '🔥 ×' + S.combo : '⭐ ' + fmt(S.score);
    }
    function applyEvents(ev) {
      for (const e of ev) {
        if (e.type === 'kill') { const x = e.x * W, y = e.y * (groundY() - 10); lasers.push({ x: e.x, y: e.y, life: 1 }); burst(x, y, 16, '#fbbf24'); floatTxt('+' + e.coins, x, y, '#fde047'); snd('goed'); }
        if (e.type === 'laser') { lasers.push({ x: e.x, y: e.y, life: 1 }); burst(e.x * W, e.y * (groundY() - 10), 12, '#6ee7b7'); snd('power'); }
        if (e.type === 'hit') { burst(e.x * W, groundY(), 22, '#f87171'); flash = 1; shake = 1; snd('lose'); floatTxt('💔', e.x * W, groundY() - 20, '#fff'); }
        if (e.type === 'blocked') { burst(e.x * W, groundY() - 30, 14, '#60a5fa'); snd('klik'); floatTxt('🛡️', e.x * W, groundY() - 30, '#fff'); }
        if (e.type === 'miss') { snd('fout'); floatTxt('te laag!', e.x * W, e.y * (groundY() - 10), '#f87171'); }
      }
    }
    function nextAsk() {
      if (dead || ended || !started || S.phase !== 'play' || askOn) return;
      if (!m.rocks().length) return;
      askOn = true;
      ak.start({ compact: true, feedback: true, autoNext: 400 }, r => {
        askOn = false; const ev = m.answer(r.ok); applyEvents(ev); renderHud();
        cool = true; later(() => { cool = false; }, r.ok ? 200 : 850);
      });
    }
    function showShop() {
      shopShown = true; ak.cancel(); askOn = false; panel.innerHTML = '';
      const box = el('div', 'rg-shop'); box.appendChild(el('h3', null, '🎉 Golf ' + S.wave + ' gehaald! Koop upgrades (💰 ' + fmt(S.coins) + ')'));
      for (const it of RAIN_SHOP) {
        const c = m.cost(it.id), can = S.coins >= c && !(it.id === 'life' && S.lives >= S.maxLives);
        const b = el('button', 'rg-item' + (can ? ' can' : '')); b.type = 'button';
        b.innerHTML = '<span class="e">' + it.emoji + '</span><span>' + it.name + ' <small>' + it.desc + (S.up[it.id] ? ' · gekocht ×' + S.up[it.id] : '') + '</small></span><b>💰 ' + c + '</b>';
        b.addEventListener('click', () => { if (m.buy(it.id)) { snd('power'); renderHud(); showShop(); } else snd('fout'); });
        box.appendChild(b);
      }
      const go = el('button', 'rg-btn', 'Volgende golf ▶'); go.type = 'button'; go.style.width = '100%';
      go.addEventListener('click', () => { m.nextWave(); shopShown = false; panel.innerHTML = ''; panel.appendChild(askBox); snd('klik'); renderHud(); });
      box.appendChild(go); panel.appendChild(box);
    }
    function loop(ts) {
      if (dead) return;
      const dt = Math.min(0.1, (ts - (last || ts)) / 1000); last = ts;
      if (!root.isConnected) { raf = setTimeout(() => { raf = requestAnimationFrame(loop); }, 400); return; }
      if (started && !ended) {
        const ev = m.tick(dt); if (ev.length) { applyEvents(ev); for (const e of ev) { if (e.type === 'wave-clear') { snd('level'); later(showShop, 600); } if (e.type === 'over') finish(false); if (e.type === 'won') finish(true); } }
        if (S.phase === 'play' && !cool) nextAsk();
        renderHud();
      }
      draw(dt); raf = requestAnimationFrame(loop);
    }
    function finish(win) {
      if (ended) return; ended = true; ak.cancel(); snd(win ? 'win' : 'lose');
      const ov = el('div', 'rg-ov', '<h2>' + (win ? '🏙️ Stad gered!' : '💥 De stad is geraakt') + '</h2><p>' + S.kills + ' meteoren weggeschoten · golf ' + S.wave + '/' + RAIN_WAVES + '</p>'); root.appendChild(ov);
      later(() => { try { env.end({ score: m.finalScore(), win, stats: { correct: S.correct, wrong: S.wrong, 'best streak': S.best, meteoren: S.kills, golf: S.wave }, summary: 'golf ' + S.wave + '/' + RAIN_WAVES + ', ' + S.kills + ' meteoren' }); } catch (e) { /* hub */ } }, 1600);
    }
    function onTap(ev) {
      if (!started || ended || S.phase !== 'play') return;
      const rc = cv.getBoundingClientRect ? cv.getBoundingClientRect() : { left: 0, top: 0 };
      const px = (ev.clientX - rc.left), py = (ev.clientY - rc.top), gy = groundY();
      for (const it of S.items) { if (Math.abs(it.x * W - px) < 30 && Math.abs(it.y * (gy - 10) + 20 - py) < 32) { const k = m.collect(it.id); snd('power'); if (k === 'bomb') { burst(px, py, 30, '#fb923c'); shake = 1; } floatTxt(k === 'ice' ? '❄️ bevroren' : k === 'heart' ? '+❤️' : '💥', px, py, '#fff'); renderHud(); return; } }
      let best = null, bd = 44;
      for (const r of m.rocks()) { const d = Math.hypot(r.x * W - px, r.y * (gy - 10) - py); if (d < bd) { bd = d; best = r; } }
      if (best) { m.select(best.id); snd('klik'); }
    }
    cv.addEventListener('pointerdown', onTap);
    const intro = el('div', 'rg-ov', '<h2>☄️ Woordenregen</h2><p>Beantwoord vragen om de laagste meteoor weg te schieten (tik op een meteoor om er één te kiezen). Tik op vallende 🧊 💣 💖 om ze te pakken!</p>');
    const go = el('button', 'rg-btn', 'Tik om te beginnen'); go.type = 'button';
    go.addEventListener('click', () => { intro.remove(); snd('klik'); started = true; });
    intro.appendChild(go); root.appendChild(intro);
    renderHud(); raf = requestAnimationFrame(loop);
    const onResize = () => resize(); window.addEventListener && window.addEventListener('resize', onResize);
    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf); clearTimeout(raf); timers.forEach(clearTimeout); timers.clear();
        try { ak.cancel(); } catch (e) { /* ok */ }
        cv.removeEventListener('pointerdown', onTap); window.removeEventListener && window.removeEventListener('resize', onResize);
        style.remove(); try { host.innerHTML = ''; } catch (e) { /* ok */ }
      },
    };
  },
};
