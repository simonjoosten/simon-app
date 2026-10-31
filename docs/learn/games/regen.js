// Woordenregen – meteoren vallen op je stad. Elk goed antwoord schiet de laagste meteoor weg. Overleef 6 golven en koop upgrades tussendoor.
// Pure logica (createRain) is los testbaar; de view tekent een canvas en gebruikt alleen env.ask voor vragen.

import { attachWorld, fxLayer, gearBtn, ic, iel, di, palette, softShadow, glow, hexA, mix } from './_gxa.js?v=1';

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
  { id: 'life', name: 'Extra leven', icon: 'heart', emoji: '❤️', desc: '+1 leven (max 6)', base: 28 },
  { id: 'shield', name: 'Stadsschild', icon: 'shield', emoji: '🛡️', desc: 'Vangt 1 inslag op', base: 24 },
  { id: 'slow', name: 'Zwaartekrachtveld', icon: 'snowflake', emoji: '🧊', desc: 'Meteoren vallen 10% trager', base: 36 },
  { id: 'turret', name: 'Laserkanon', icon: 'robot', emoji: '🤖', desc: 'Schiet zelf af en toe een meteoor weg', base: 48 },
  { id: 'coin', name: 'Muntmagneet', icon: 'magnet', emoji: '💰', desc: '+30% munten per meteoor', base: 30 },
  { id: 'nuke', name: 'Noodbom', icon: 'bomb', emoji: '💣', desc: 'Een knop die alle meteoren tegelijk wegblaast', base: 70 },
];
// meteoor-soorten: vanaf welke golf ze komen, gewicht, snelheid, grootte, levens (goede antwoorden), muntfactor
export const METEORS = {
  rots: { icon: 'rock', emoji: '🪨', hp: 1, v: 1, size: 1, coin: 1, w: 10, wave: 1 },
  komeet: { icon: 'comet', emoji: '☄️', hp: 1, v: 1.5, size: 0.85, coin: 1.5, w: 3, wave: 2 },
  ufo: { icon: 'ufo', emoji: '🛸', hp: 1, v: 0.8, size: 1.1, coin: 2, w: 2, wave: 3, sway: true },
  groot: { icon: 'volcano', emoji: '🌋', hp: 2, v: 0.85, size: 1.4, coin: 2.2, w: 2, wave: 3 },
  ijs: { icon: 'snowflake', emoji: '❄️', hp: 1, v: 1, size: 1, coin: 1, w: 2, wave: 4, freezes: true },
};
export const ITEM_KINDS = ['ice', 'bomb', 'heart', 'gold', 'shield'];

export function createRain({ level = 2, rand = Math.random, fx = {}, endless = false } = {}) {
  const gapF = level === 1 ? 1.2 : level === 3 ? 0.88 : 1, fallF = level === 1 ? 1.2 : level === 3 ? 0.88 : 1;
  const lives0 = 3 + (level === 1 ? 1 : 0) + (fx.extraLives || 0);
  const S = {
    t: 0, wave: 1, total: 0, spawned: 0, lives: lives0, maxLives: Math.max(6, lives0), shield: fx.shield || 0, coins: Math.round(fx.startCash || 0), earned: 0, score: 0,
    combo: 0, best: 0, correct: 0, wrong: 0, kills: 0, meteors: [], items: [], freeze: 0, turretT: 10, up: { life: 0, shield: 0, slow: 0, turret: 0, coin: 0, nuke: 0 }, nukes: 0, endless,
    phase: 'play', spawnIn: 1.2, id: 1, sel: 0, firstKill: null,
  };
  const m = { S };
  const T = n => 5 + n;
  S.total = T(1);
  const ew = () => (endless && S.wave > 10 ? 10 + (S.wave - 10) * 0.3 : S.wave);
  const fallTime = () => Math.max(3.5, (20 - 1.4 * ew())) * fallF * (1 + 0.1 * S.up.slow) * (1 + (fx.timeBonus || 0) / 60);
  const gap = () => Math.max(2.2, 7.2 - 0.4 * ew()) * gapF;
  m.rocks = () => S.meteors.filter(x => x.kind === 'rock');
  m.target = () => {
    const rs = m.rocks(); if (!rs.length) return null;
    return rs.find(r => r.id === S.sel) || rs.reduce((b, r) => (r.y > b.y ? r : b), rs[0]);
  };
  function dropItem(x, y) {
    if (rand() >= 0.14 + 0.18 * (fx.luck || 0)) return;
    const r = rand(); S.items.push({ id: S.id++, kind: r < 0.35 ? 'ice' : r < 0.55 ? 'bomb' : r < 0.75 ? 'heart' : r < 0.88 ? 'gold' : 'shield', x, y, life: 9 });
  }
  function kill(r, free) {
    S.meteors = S.meteors.filter(x => x !== r); S.kills++;
    const mt = METEORS[r.type] || METEORS.rots;
    const c = Math.round((4 + Math.min(S.combo, 8) / 2) * (1 + 0.3 * S.up.coin) * (fx.cashMult || 1) * (free ? 0.5 : 1) * mt.coin);
    if (mt.freezes) S.freeze = Math.max(S.freeze, 3);
    S.coins += c; S.earned += c; S.score += 10 + Math.min(S.combo, 15) * 2;
    if (S.firstKill == null) S.firstKill = S.t;
    if (S.sel === r.id) S.sel = 0;
    dropItem(r.x, r.y);
    return c;
  }
  function spawn() {
    const x = 0.08 + rand() * 0.84;
    let type = 'rots';
    if (S.wave >= 2) { const ks = Object.keys(METEORS).filter(k => METEORS[k].wave <= S.wave), tot = ks.reduce((a, k) => a + METEORS[k].w, 0); let q = rand() * tot; for (const k of ks) { q -= METEORS[k].w; if (q <= 0) { type = k; break; } } }
    const mt = METEORS[type];
    S.meteors.push({ id: S.id++, kind: 'rock', type, hp: mt.hp, x, x0: x, y: -0.05, v: mt.v / fallTime(), size: (0.8 + rand() * 0.5) * mt.size, spin: rand() * 6 });
    S.spawned++;
  }
  m.answer = ok => {
    const r = m.target(); const ev = [];
    if (ok) {
      S.correct++; S.combo++; S.best = Math.max(S.best, S.combo);
      if (r && r.hp > 1) { r.hp--; r.y = Math.max(-0.05, r.y - 0.12); ev.push({ type: 'dent', x: r.x, y: r.y }); }
      else if (r) { const x = r.x, y = r.y, t = r.type, c = kill(r); ev.push({ type: 'kill', x, y, coins: c, mtype: t }); }
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
    else if (it.kind === 'gold') { const c = Math.round(18 * (fx.cashMult || 1)); S.coins += c; S.earned += c; }
    else if (it.kind === 'shield') S.shield++;
    else { for (const r of m.rocks()) { kill(r, true); } }
    return it.kind;
  };
  m.nuke = () => { if (S.nukes <= 0 || S.phase !== 'play') return 0; S.nukes--; let n = 0; for (const r of m.rocks()) { kill(r, true); n++; } return n; };
  m.select = id => { if (S.meteors.some(r => r.id === id && r.kind === 'rock')) S.sel = id; };
  m.tick = dt => {
    const ev = []; if (S.phase !== 'play') return ev;
    S.t += dt;
    const mult = S.freeze > 0 ? 0.25 : 1; S.freeze = Math.max(0, S.freeze - dt);
    for (const r of S.meteors.slice()) {
      r.y += r.v * dt * mult; if (METEORS[r.type] && METEORS[r.type].sway) r.x = clamp(r.x0 + Math.sin(S.t * 2 + r.spin) * 0.07, 0.05, 0.95);
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
      if (S.wave >= RAIN_WAVES && !endless) { S.phase = 'won'; S.score += S.lives * 50; ev.push({ type: 'won' }); } else { S.phase = 'shop'; ev.push({ type: 'wave-clear' }); }
    }
    return ev;
  };
  m.cost = id => { const it = RAIN_SHOP.find(x => x.id === id); return Math.round(it.base * (1 + 0.45 * S.up[id])); };
  m.buy = id => {
    const c = m.cost(id); if (S.coins < c) return false;
    if (id === 'life' && S.lives >= S.maxLives) return false;
    S.coins -= c; S.up[id]++;
    if (id === 'life') S.lives++; if (id === 'shield') S.shield++; if (id === 'nuke') S.nukes++;
    return true;
  };
  m.nextWave = () => { if (S.phase !== 'shop') return; S.wave++; S.total = T(S.wave); S.spawned = 0; S.spawnIn = 1.5; S.phase = 'play'; S.meteors = []; S.items = []; S.turretT = Math.max(6, 16 - 3 * S.up.turret); };
  m.finalScore = () => S.score;
  return m;
}

/* ---------- stijl ---------- */
const CSS = `
.rg-root{position:relative;display:flex;flex-direction:column;width:100%;box-sizing:border-box;color:var(--ink);border-radius:16px;overflow:hidden;font-family:inherit;user-select:none;-webkit-user-select:none;font-size:calc(16px*var(--gfx-font,1))}
.rg-hud{display:flex;justify-content:space-between;align-items:center;gap:6px;padding:8px 10px;font-weight:800;font-size:calc(16px*var(--gfx-font,1));background:color-mix(in srgb,var(--card) 90%,transparent);border-bottom:1px solid var(--line)}
.rg-hud>span{display:flex;align-items:center;gap:4px;min-height:34px}
.rg-cv{display:block;width:100%;flex:1 1 auto;min-height:250px;background:transparent;touch-action:manipulation}
.rg-panel{flex:0 0 auto;min-height:210px;padding:8px 10px 12px;background:color-mix(in srgb,var(--card) 94%,transparent);border-top:1px solid var(--line)}
.rg-shop{padding:8px 4px}.rg-shop h3{margin:0 0 8px;font-size:calc(18px*var(--gfx-font,1))}
.rg-item{display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;margin-bottom:6px;padding:8px 12px;min-height:58px;border:2px solid var(--line);border-radius:14px;background:var(--card);color:var(--ink);text-align:left;font:inherit;font-size:calc(15px*var(--gfx-font,1));font-weight:700;cursor:pointer}
.rg-item small{display:block;font-weight:600;opacity:.8}.rg-item b{margin-left:auto;white-space:nowrap;display:flex;gap:4px;align-items:center}
.rg-item.can{border-color:#22c55e;background:rgba(34,197,94,.13)}
.rg-nuke{position:absolute;right:10px;top:56px;z-index:20;border:0;border-radius:16px;background:linear-gradient(135deg,#ef4444,#f97316);color:#fff;font:inherit;font-weight:900;font-size:calc(15px*var(--gfx-font,1));padding:6px 12px;min-height:48px;cursor:pointer;display:none;gap:6px;align-items:center;box-shadow:0 4px 14px #ef444488}
.rg-ov{position:absolute;inset:0;z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px;text-align:center;background:rgba(5,8,30,.86);color:#fff}
.rg-ov h2{margin:0;font-size:calc(30px*var(--gfx-font,1))}.rg-ov p{margin:0;max-width:330px;font-size:calc(16px*var(--gfx-font,1));line-height:1.4}
.rg-btn{background:var(--accent,#6366f1);color:#fff;border:0;border-radius:16px;padding:14px 26px;min-height:54px;font:inherit;font-size:calc(18px*var(--gfx-font,1));font-weight:800;cursor:pointer}
.rg-btn.alt{background:linear-gradient(135deg,#f59e0b,#ef4444)}
.rg-types{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;max-width:340px}
.rg-types span{background:rgba(255,255,255,.14);border-radius:12px;padding:4px 8px;font-size:calc(13px*var(--gfx-font,1));display:flex;gap:4px;align-items:center}
.rg-wait{padding:34px 10px;text-align:center;font-weight:700;opacity:.7}
`;
const TYPE_NAMES = { rots: 'Rots', komeet: 'Komeet: snel', ufo: 'Ufo: zweeft heen en weer', groot: 'Vulkaanrots: 2 antwoorden', ijs: 'IJsbal: bevriest' };

/* ---------- het spel ---------- */
export default {
  id: 'regen', name: 'Woordenregen', emoji: '☄️', color: '#0ea5e9',
  desc: 'Meteoren vallen op je stad! Elk goed antwoord schiet de laagste meteoor weg. Vijf soorten meteoren, vijf power-ups. Overleef zes golven of ga eindeloos door.',
  tags: ['snel', 'verdedigen', 'solo', 'eindeloos'], minutes: 5, duo: false,
  create(host, env) {
    let dead = false, ended = false, raf = 0, last = 0, started = false, askOn = false, cool = false, shopShown = false, endless = false;
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms); timers.add(id); return id; };
    const snd = n => { try { env.snd && env.snd.play(n); } catch (e) { /* stil */ } };
    const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    host.innerHTML = '';
    const root = el('div', 'rg-root'); root.style.height = Math.max(580, env.h || 620) + 'px'; host.appendChild(root);
    const bgw = attachWorld(root, env, 'regen'); const fxl = fxLayer(root, env);
    const world = bgw.world, pal = palette(world);
    let m = createRain({ level: env.level, rand: env.rand || Math.random, fx: env.fx || {} });
    let S = m.S;
    const hud = el('div', 'rg-hud'); const waveEl = el('span'), livesEl = el('span'), coinEl = el('span'), comboEl = el('span');
    hud.append(waveEl, livesEl, coinEl, comboEl, gearBtn()); root.appendChild(hud);
    const cv = el('canvas', 'rg-cv'); root.appendChild(cv);
    const nukeBtn = el('button', 'rg-nuke'); nukeBtn.type = 'button'; root.appendChild(nukeBtn);
    const panel = el('div', 'rg-panel'); root.appendChild(panel);
    const askBox = el('div'); const ak = mkAsker(env, askBox, mkQSource(env)); panel.appendChild(askBox);
    const dpr = Math.min(2, Math.max(1, (typeof window !== 'undefined' && window.devicePixelRatio) || 1) * ((env.gfx && env.gfx.q === 0) ? 1 : 1.25));
    let W = env.w || 360, H = 300;
    function resize() { W = cv.clientWidth || env.w || 360; H = cv.clientHeight || 300; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    resize();
    const ctx = cv.getContext && cv.getContext('2d');
    const qq = () => (env.gfx && env.gfx.q != null ? env.gfx.q : 1);
    const toRoot = (x, y) => { try { const a = cv.getBoundingClientRect(), b = root.getBoundingClientRect(); return [a.left - b.left + x, a.top - b.top + y]; } catch (e) { return [x, y]; } };
    const lasers = []; const flt = []; let flash = 0, shake = 0;
    const burst = (x, y, n, kind) => { const [rx, ry] = toRoot(x, y); fxl.burst(rx, ry, kind || 'sparkle', n); };
    const floatTxt = (txt, x, y, col) => flt.push({ txt, x, y, col, life: 1 });
    function groundY() { return H - 46; }
    function draw(dt) {
      if (!ctx) return; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const q = qq();
      const sx = shake > 0 ? (Math.random() - 0.5) * 10 * shake : 0; shake = Math.max(0, shake - dt * 3);
      ctx.save(); ctx.translate(sx, 0);
      const gy = groundY();
      ctx.fillStyle = hexA(pal.a, 0.95); ctx.fillRect(-10, gy, W + 20, H - gy);
      for (let i = 0; i < 12; i++) { const bx = (i / 12) * W, bw = W / 12 - 3, bh = 14 + ((i * 37) % 26); ctx.fillStyle = i % 2 ? pal.pathEdge : mix(pal.pathEdge, pal.a, 0.4); ctx.fillRect(bx, gy - bh, bw, bh); ctx.fillStyle = '#ffd86b'; if ((i + Math.floor(S.t)) % 3) ctx.fillRect(bx + 3, gy - bh + 4, 3, 3); }
      if (S.shield > 0) { ctx.strokeStyle = 'rgba(96,165,250,' + (0.55 + 0.3 * Math.sin(S.t * 4)) + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(W / 2, gy + 30, W * 0.55, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const tg = m.target();
      for (const r of S.meteors) {
        const x = r.x * W, y = r.y * (gy - 10), sz = 46 * r.size, mt = METEORS[r.type] || METEORS.rots;
        if (q > 0) glow(ctx, x, y - 18, sz * 0.9, r.type === 'ijs' ? '#7dd3fc' : '#fb923c', 0.4);
        const tail = ctx.createLinearGradient(x, y - 70, x, y); tail.addColorStop(0, 'rgba(255,140,40,0)'); tail.addColorStop(1, r.type === 'ijs' ? 'rgba(125,211,252,.7)' : 'rgba(255,170,60,.75)');
        ctx.fillStyle = tail; ctx.beginPath(); ctx.moveTo(x - sz * 0.3, y); ctx.lineTo(x + sz * 0.3, y); ctx.lineTo(x, y - 72); ctx.fill();
        di(ctx, mt.icon, x, y, sz, { q, shadow: false, rot: Math.sin(S.t * 2 + r.spin) * 0.2 });
        if (mt.hp > 1) { ctx.fillStyle = '#0008'; ctx.fillRect(x - 16, y + sz * 0.5, 32, 5); ctx.fillStyle = '#ef4444'; ctx.fillRect(x - 16, y + sz * 0.5, 32 * (r.hp / mt.hp), 5); }
        if (S.freeze > 0) di(ctx, 'snowflake', x + sz * 0.4, y - sz * 0.4, 20, { q, shadow: false });
        if (r === tg) { ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(x, y, sz * 0.6 + 8 + Math.sin(S.t * 8) * 2, 0, 6.3); ctx.stroke(); ctx.setLineDash([]); }
      }
      const ICO = { ice: 'snowflake', bomb: 'bomb', heart: 'heart', gold: 'bag', shield: 'shield' };
      for (const it of S.items) { const x = it.x * W, y = it.y * (gy - 10) + 20; ctx.globalAlpha = it.life < 2 ? 0.5 + 0.5 * Math.sin(S.t * 14) : 1; di(ctx, ICO[it.kind] || 'star', x, y + Math.sin(S.t * 4 + it.id) * 3, 46, { q }); ctx.globalAlpha = 1; }
      for (const l of lasers) { l.life -= dt * 5; ctx.strokeStyle = 'rgba(120,255,200,' + clamp(l.life, 0, 1) + ')'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(W / 2, gy); ctx.lineTo(l.x * W, l.y * (gy - 10)); ctx.stroke(); if (q > 0) glow(ctx, l.x * W, l.y * (gy - 10), 26, '#6ee7b7', 0.5 * clamp(l.life, 0, 1)); }
      for (let i = lasers.length - 1; i >= 0; i--) if (lasers[i].life <= 0) lasers.splice(i, 1);
      di(ctx, 'rocket', W / 2, gy - 12, 54, { q });
      for (const t of flt) { t.life -= dt * 0.9; t.y -= 30 * dt; ctx.globalAlpha = clamp(t.life * 1.5, 0, 1); ctx.font = 'bold 20px sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.65)'; ctx.fillStyle = t.col; ctx.strokeText(t.txt, t.x, t.y); ctx.fillText(t.txt, t.x, t.y); }
      ctx.globalAlpha = 1; for (let i = flt.length - 1; i >= 0; i--) if (flt[i].life <= 0) flt.splice(i, 1);
      ctx.restore();
      if (flash > 0) { ctx.fillStyle = 'rgba(255,60,60,' + flash * 0.4 + ')'; ctx.fillRect(0, 0, W, H); flash = Math.max(0, flash - dt * 2.5); }
    }
    let hk = '';
    function renderHud() {
      const k = S.wave + '|' + S.lives + '|' + S.shield + '|' + Math.floor(S.coins) + '|' + S.combo + '|' + S.score + '|' + S.nukes; if (k === hk) return; hk = k;
      waveEl.innerHTML = ic('flag', 28) + ' Golf ' + S.wave + (endless ? '' : '/' + RAIN_WAVES);
      livesEl.innerHTML = ic('heart', 28) + ' ' + S.lives + (S.shield ? ' ' + ic('shield', 26) + S.shield : '');
      coinEl.innerHTML = ic('coin', 28) + ' ' + fmt(S.coins); comboEl.innerHTML = S.combo >= 2 ? ic('flame', 28) + ' x' + S.combo : ic('star', 28) + ' ' + fmt(S.score);
      nukeBtn.style.display = S.nukes > 0 && S.phase === 'play' ? 'flex' : 'none'; nukeBtn.innerHTML = ic('bomb', 30) + ' Noodbom (' + S.nukes + ')';
    }
    function applyEvents(ev) {
      for (const e of ev) {
        if (e.type === 'kill') { const x = e.x * W, y = e.y * (groundY() - 10); lasers.push({ x: e.x, y: e.y, life: 1 }); burst(x, y, 14, 'sparkle'); burst(x, y, 4, 'coins'); floatTxt('+' + e.coins, x, y, '#fde047'); if (S.combo > 0 && S.combo % 5 === 0) burst(W / 2, 60, 24, 'confetti'); snd('goed'); }
        if (e.type === 'dent') { burst(e.x * W, e.y * (groundY() - 10), 8, 'smoke'); floatTxt('geraakt!', e.x * W, e.y * (groundY() - 10), '#fbbf24'); snd('goed'); }
        if (e.type === 'laser') { lasers.push({ x: e.x, y: e.y, life: 1 }); burst(e.x * W, e.y * (groundY() - 10), 10, 'sparkle'); snd('power'); }
        if (e.type === 'hit') { burst(e.x * W, groundY(), 20, 'smoke'); flash = 1; shake = 1; snd('lose'); floatTxt('Au!', e.x * W, groundY() - 20, '#fff'); }
        if (e.type === 'blocked') { burst(e.x * W, groundY() - 30, 12, 'sparkle'); snd('klik'); floatTxt('geblokt', e.x * W, groundY() - 30, '#93c5fd'); }
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
    nukeBtn.addEventListener('click', () => { if (!started || ended || S.nukes <= 0) return; const n = m.nuke(); if (S.phase === 'play') { snd('power'); shake = 1; flash = 0.6; burst(W / 2, H / 2, 40, 'stars'); floatTxt('BOEM!', W / 2, H / 2, '#fde047'); renderHud(); } });
    function showShop() {
      shopShown = true; ak.cancel(); askOn = false; panel.innerHTML = '';
      const box = el('div', 'rg-shop'); box.appendChild(el('h3', null, 'Golf ' + S.wave + ' gehaald! Koop upgrades (' + ic('coin', 24) + ' ' + fmt(S.coins) + ')'));
      for (const it of RAIN_SHOP) {
        const c = m.cost(it.id), can = S.coins >= c && !(it.id === 'life' && S.lives >= S.maxLives);
        const b = el('button', 'rg-item' + (can ? ' can' : '')); b.type = 'button';
        b.innerHTML = ic(it.icon, 42) + '<span>' + it.name + ' <small>' + it.desc + (S.up[it.id] ? ' · gekocht x' + S.up[it.id] : '') + '</small></span><b>' + ic('coin', 22) + ' ' + c + '</b>';
        b.addEventListener('click', () => { if (m.buy(it.id)) { snd('power'); fxl.burstEl(b, 'sparkle', 12); renderHud(); showShop(); } else snd('fout'); });
        box.appendChild(b);
      }
      const go = el('button', 'rg-btn', 'Volgende golf'); go.type = 'button'; go.style.width = '100%';
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
      if (ended) return; ended = true; ak.cancel(); snd(win ? 'win' : 'lose'); nukeBtn.style.display = 'none';
      const ov = el('div', 'rg-ov', '<div>' + ic(win ? 'trophy' : 'volcano', 96) + '</div><h2>' + (win ? 'Stad gered!' : endless ? 'Golf ' + S.wave + ' bereikt!' : 'De stad is geraakt') + '</h2><p>' + S.kills + ' meteoren weggeschoten · golf ' + S.wave + (endless ? '' : '/' + RAIN_WAVES) + '</p>'); root.appendChild(ov);
      fxl.burst((root.clientWidth || 360) / 2, 160, win ? 'confetti' : 'smoke', win ? 60 : 12);
      later(() => { try { env.end({ score: m.finalScore(), win: endless ? null : win, stats: { correct: S.correct, wrong: S.wrong, 'best streak': S.best, meteoren: S.kills, golf: S.wave }, summary: (endless ? 'Eindeloos: ' : '') + 'golf ' + S.wave + (endless ? '' : '/' + RAIN_WAVES) + ', ' + S.kills + ' meteoren' }); } catch (e) { /* hub */ } }, 1600);
    }
    function onTap(ev) {
      if (!started || ended || S.phase !== 'play') return;
      const rc = cv.getBoundingClientRect ? cv.getBoundingClientRect() : { left: 0, top: 0 };
      const px = (ev.clientX - rc.left), py = (ev.clientY - rc.top), gy = groundY();
      for (const it of S.items) { if (Math.abs(it.x * W - px) < 36 && Math.abs(it.y * (gy - 10) + 20 - py) < 38) { const k = m.collect(it.id); snd('power'); if (k === 'bomb') { burst(px, py, 30, 'stars'); shake = 1; } else burst(px, py, 12, k === 'gold' ? 'coins' : 'sparkle'); floatTxt(k === 'ice' ? 'bevroren' : k === 'heart' ? '+1 leven' : k === 'gold' ? '+munten' : k === 'shield' ? '+schild' : 'BOEM', px, py, '#fff'); renderHud(); return; } }
      let best = null, bd = 52;
      for (const r of m.rocks()) { const d = Math.hypot(r.x * W - px, r.y * (gy - 10) - py); if (d < bd) { bd = d; best = r; } }
      if (best) { m.select(best.id); snd('klik'); }
    }
    cv.addEventListener('pointerdown', onTap);
    function begin(md) {
      endless = md === 'eindeloos';
      if (endless) { m = createRain({ level: env.level, rand: env.rand || Math.random, fx: env.fx || {}, endless: true }); S = m.S; }
      intro.remove(); snd('klik'); started = true; renderHud();
    }
    const intro = el('div', 'rg-ov', '<div>' + ic('comet', 96) + '</div><h2>Woordenregen</h2><p>Beantwoord vragen om de laagste meteoor weg te schieten (tik op een meteoor om er één te kiezen). Tik op vallende power-ups om ze te pakken!</p>');
    const types = el('div', 'rg-types'); types.innerHTML = Object.keys(METEORS).map(k => '<span>' + ic(METEORS[k].icon, 26) + (TYPE_NAMES[k] || k) + '</span>').join('');
    const go = el('button', 'rg-btn', 'Tik om te beginnen (6 golven)'); go.type = 'button'; go.addEventListener('click', () => begin('golven'));
    const go2 = el('button', 'rg-btn alt', 'Eindeloos: hoe ver kom je?'); go2.type = 'button'; go2.addEventListener('click', () => begin('eindeloos'));
    intro.append(types, go, go2); root.appendChild(intro);
    renderHud(); raf = requestAnimationFrame(loop);
    const onResize = () => resize(); window.addEventListener && window.addEventListener('resize', onResize);
    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf); clearTimeout(raf); timers.forEach(clearTimeout); timers.clear();
        try { ak.cancel(); } catch (e) { /* ok */ }
        cv.removeEventListener('pointerdown', onTap); window.removeEventListener && window.removeEventListener('resize', onResize);
        try { fxl.destroy(); bgw.destroy(); } catch (e) { /* ok */ }
        style.remove(); try { host.innerHTML = ''; } catch (e) { /* ok */ }
      },
    };
  },
};
