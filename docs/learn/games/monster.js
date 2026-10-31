// Monsterjager – een mini-RPG: kies monsters, versla ze met goede antwoorden, koop wapens en harnassen, versla de Drakenkoning.
// Pure logica (createMonster) is los testbaar; de view tekent een canvas-gevecht en gebruikt alleen env.ask voor vragen.

import { attachWorld, fxLayer, gearBtn, ic, iel, di, palette, softShadow, glow, hexA, mix } from './_gxa.js?v=1';

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
export const MON_TIME_CAP = 480;
export const WEAPONS = [
  { id: 'stok', name: 'Houten stok', icon: 'pencil', emoji: '🪵', atk: 0, cost: 0 },
  { id: 'zwaard', name: 'Ridderzwaard', icon: 'sword', emoji: '🗡️', atk: 3, cost: 35 },
  { id: 'bijl', name: 'Strijdbijl', icon: 'pickaxe', emoji: '🪓', atk: 6, cost: 100 },
  { id: 'staf', name: 'Toverstaf', icon: 'wand', emoji: '🪄', atk: 10, cost: 220 },
  { id: 'draak', name: 'Drakenzwaard', icon: 'bolt', emoji: '⚔️', atk: 15, cost: 420 },
  // ---- nieuw: 4 extra wapens
  { id: 'hamer', name: 'Donderhamer', icon: 'hammer', emoji: '🔨', atk: 20, cost: 640 },
  { id: 'boog', name: 'Zilverboog', icon: 'bow', emoji: '🏹', atk: 26, cost: 950 },
  { id: 'boek', name: 'Toverboek', icon: 'book', emoji: '📘', atk: 33, cost: 1400 },
  { id: 'kristal', name: 'Sterrenkristal', icon: 'crystal', emoji: '🔮', atk: 42, cost: 2100 },
];
export const ARMORS = [
  { id: 'hemd', name: 'Hemd', icon: 'bag', emoji: '👕', def: 0, cost: 0 },
  { id: 'leer', name: 'Leren vest', icon: 'bag', emoji: '🦺', def: 1, cost: 30 },
  { id: 'schild', name: 'Houten schild', icon: 'shield', emoji: '🛡️', def: 2, cost: 85 },
  { id: 'kolder', name: 'Maliënkolder', icon: 'gear', emoji: '⛓️', def: 3, cost: 190 },
  { id: 'goud', name: 'Gouden harnas', icon: 'crown', emoji: '👑', def: 5, cost: 360 },
  // ---- nieuw
  { id: 'mithril', name: 'Mithril-pantser', icon: 'gem', emoji: '💎', def: 7, cost: 620 },
  { id: 'ster', name: 'Sterrenpantser', icon: 'star', emoji: '⭐', def: 9, cost: 1000 },
];
export const POTION = { cost: 14, heal: 0.45 };
export const MONSTERS = [
  { id: 'slijm', name: 'Slijmbal', icon: 'slime', emoji: '🟢', tier: 1, hp: 10, dmg: 2, spd: 7, gold: 8, xp: 8 },
  { id: 'vleer', name: 'Vleermuis', icon: 'owl', emoji: '🦇', tier: 1, hp: 12, dmg: 2, spd: 6.5, gold: 9, xp: 9 },
  { id: 'spin', name: 'Reuzenspin', emoji: '🕷️', tier: 1, hp: 14, dmg: 2, spd: 7, gold: 10, xp: 10 },
  { id: 'wolf', name: 'Wolf', icon: 'dog', emoji: '🐺', tier: 2, hp: 30, dmg: 4, spd: 6.5, gold: 20, xp: 16 },
  { id: 'spook', name: 'Spook', icon: 'ghost', emoji: '👻', tier: 2, hp: 28, dmg: 4, spd: 6, gold: 22, xp: 17 },
  { id: 'krab', name: 'Reuzenkrab', icon: 'crab', emoji: '🦀', tier: 2, hp: 34, dmg: 4, spd: 7, gold: 22, xp: 18 },
  { id: 'trol', name: 'Trol', icon: 'bear', emoji: '🧌', tier: 3, hp: 58, dmg: 6, spd: 6, gold: 38, xp: 28 },
  { id: 'schorp', name: 'Schorpioen', emoji: '🦂', tier: 3, hp: 52, dmg: 6, spd: 5.5, gold: 40, xp: 29 },
  { id: 'heks', name: 'Gekke heks', icon: 'wizard', emoji: '🧙', tier: 3, hp: 56, dmg: 7, spd: 6, gold: 42, xp: 30 },
  { id: 'reus', name: 'Reus', icon: 'elephant', emoji: '👹', tier: 4, hp: 100, dmg: 9, spd: 5.5, gold: 70, xp: 48 },
  { id: 'dino', name: 'Dino', icon: 'dino', emoji: '🦖', tier: 4, hp: 110, dmg: 10, spd: 6, gold: 75, xp: 50 },
  { id: 'robot', name: 'Schrootrobot', icon: 'robot', emoji: '🤖', tier: 4, hp: 105, dmg: 9, spd: 5, gold: 75, xp: 50 },
  { id: 'draak', name: 'Drakenkoning', icon: 'dragon', emoji: '🐲', tier: 5, hp: 240, dmg: 12, spd: 5, gold: 200, xp: 120, boss: true },
  // ---- nieuw: 6 monsters (verschijnen na de oorspronkelijke in de lijst, dus bestaande volgorde blijft gelijk)
  { id: 'kikker', name: 'Gifkikker', icon: 'frog', emoji: '🐸', tier: 1, hp: 13, dmg: 2, spd: 6.8, gold: 9, xp: 9 },
  { id: 'kwal', name: 'Zweefkwal', icon: 'jellyfish', emoji: '🪼', tier: 2, hp: 32, dmg: 4, spd: 6.3, gold: 21, xp: 17 },
  { id: 'skelet', name: 'Botten-Bob', icon: 'skull', emoji: '💀', tier: 2, hp: 33, dmg: 5, spd: 6.6, gold: 23, xp: 18 },
  { id: 'haai', name: 'Landhaai', icon: 'shark', emoji: '🦈', tier: 3, hp: 60, dmg: 7, spd: 5.8, gold: 41, xp: 29 },
  { id: 'alien', name: 'Ruimtewezen', icon: 'alien', emoji: '👽', tier: 3, hp: 54, dmg: 6, spd: 5.6, gold: 40, xp: 29 },
  { id: 'inkt', name: 'Inktmonster', icon: 'octopus', emoji: '🐙', tier: 4, hp: 108, dmg: 10, spd: 5.4, gold: 76, xp: 51 },
];
export const MON_TARGET_LEVEL = 5; // vanaf hier verschijnt de Drakenkoning

export function createMonster({ level = 2, rand = Math.random, fx = {}, endless = false } = {}) {
  const hpF = level === 1 ? 0.8 : level === 3 ? 1.15 : 1, tF = level === 1 ? 1.25 : level === 3 ? 0.85 : 1;
  const S = { t: 0, lv: 1, xp: 0, hp: 0, gold: Math.round(fx.startCash || 0), earned: 0, wi: 0, ai: 0, potions: 0, defeated: 0, fainted: 0, fight: null, correct: 0, wrong: 0, combo: 0, best: 0, bossDown: false, firstReward: null, endless };
  const m = { S };
  m.maxHp = () => 40 + 10 * (S.lv - 1) + 10 * (fx.extraLives || 0);
  m.xpNeed = () => 16 + 10 * (S.lv - 1);
  m.def = () => ARMORS[S.ai].def;
  m.dmg = () => 7 + 2 * S.lv + WEAPONS[S.wi].atk;
  m.maxTier = () => Math.min(4, 1 + Math.floor((S.lv - 1) / 2));
  S.hp = m.maxHp();
  m.bossOpen = () => S.lv >= MON_TARGET_LEVEL;
  m.options = () => {
    const mt = m.maxTier(), pool = MONSTERS.filter(x => !x.boss && x.tier <= mt && x.tier >= Math.max(1, mt - 1));
    const out = [];
    const p = pool.slice();
    while (out.length < 3 && p.length) out.push(p.splice(Math.floor(rand() * p.length), 1)[0]);
    out.sort((a, b) => a.tier - b.tier || a.hp - b.hp);
    if (m.bossOpen() && !endless) out.push(MONSTERS.find(x => x.boss));
    return out;
  };
  m.start = def => { const sc = endless ? 1 + 0.05 * S.defeated : 1; S.fight = { def, hp: Math.round(def.hp * hpF * sc), max: Math.round(def.hp * hpF * sc), gauge: 0, shield: fx.shield || 0, spd: def.spd * tF * 1.3, extra: endless ? Math.floor(S.defeated / 6) : 0 }; return S.fight; };
  m.heal = () => { if (S.potions <= 0 || S.hp >= m.maxHp()) return false; S.potions--; S.hp = Math.min(m.maxHp(), S.hp + Math.ceil(m.maxHp() * POTION.heal)); return true; };
  m.buyPotion = () => { if (S.gold < POTION.cost) return false; S.gold -= POTION.cost; S.potions++; return true; };
  m.buyWeapon = i => { const w = WEAPONS[i]; if (!w || i <= S.wi || S.gold < w.cost) return false; S.gold -= w.cost; S.wi = i; return true; };
  m.buyArmor = i => { const a = ARMORS[i]; if (!a || i <= S.ai || S.gold < a.cost) return false; S.gold -= a.cost; S.ai = i; return true; };
  function monsterHit(ev) {
    const f = S.fight; let d = Math.max(1, f.def.dmg + (f.extra || 0) - m.def());
    if (f.shield > 0) { f.shield--; ev.push({ type: 'block' }); return; }
    S.hp -= d; ev.push({ type: 'hurt', dmg: d });
    if (S.hp <= 0) {
      const lost = Math.floor(S.gold * 0.25); S.gold -= lost; S.fainted++; S.hp = m.maxHp(); S.fight = null; S.combo = 0;
      ev.push({ type: 'faint', lost });
    }
  }
  m.answer = ok => {
    const f = S.fight; if (!f) return [];
    const ev = [];
    if (ok) {
      S.correct++; S.combo++; S.best = Math.max(S.best, S.combo);
      const crit = rand() < 0.08 + 0.3 * (fx.luck || 0);
      let d = m.dmg() * (1 + Math.min(S.combo, 5) * (0.06 + (fx.streakBonus || 0)));
      if (crit) d *= 2; d = Math.max(1, Math.round(d));
      f.hp -= d; ev.push({ type: 'hit', dmg: d, crit });
      if (f.hp <= 0) {
        const g = Math.round(f.def.gold * (fx.cashMult || 1)); S.gold += g; S.earned += g; S.xp += f.def.xp; S.defeated++;
        if (S.firstReward == null) S.firstReward = S.t;
        let ups = 0; while (S.xp >= m.xpNeed()) { S.xp -= m.xpNeed(); S.lv++; ups++; S.hp = m.maxHp(); }
        if (f.def.boss) S.bossDown = true;
        S.fight = null; ev.push({ type: 'win', gold: g, xp: f.def.xp, ups, boss: !!f.def.boss });
      }
    } else {
      S.wrong++; S.combo = 0; f.gauge += 0.3;
      ev.push({ type: 'miss' });
      if (f.gauge >= 1) { f.gauge = 0; monsterHit(ev); }
    }
    return ev;
  };
  m.tick = dt => {
    S.t += dt; const f = S.fight; const ev = [];
    if (!f) return ev;
    f.gauge += dt / f.spd;
    if (f.gauge >= 1) { f.gauge = 0; monsterHit(ev); }
    return ev;
  };
  m.done = () => S.bossDown || S.t >= MON_TIME_CAP || (endless && S.fainted >= 3);
  m.score = () => S.defeated * 100 + S.earned + S.lv * 50 + (S.bossDown ? 500 : 0);
  return m;
}

/* ---------- stijl ---------- */
const CSS = `
.mo-root{position:relative;display:flex;flex-direction:column;width:100%;box-sizing:border-box;color:var(--ink);border-radius:16px;overflow:hidden;font-family:inherit;user-select:none;-webkit-user-select:none;font-size:calc(16px*var(--gfx-font,1))}
.mo-hud{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;padding:8px 10px;font-weight:800;font-size:calc(16px*var(--gfx-font,1));background:color-mix(in srgb,var(--card) 90%,transparent);border-bottom:1px solid var(--line)}
.mo-hud>span{display:flex;align-items:center;gap:4px;min-height:34px}
.mo-xp{flex:1 1 70px;height:10px;border-radius:5px;background:var(--line);overflow:hidden;min-width:60px}.mo-xp>i{display:block;height:100%;background:#a855f7;transition:width .3s}
.mo-cv{display:block;width:100%;height:240px;background:transparent}
.mo-panel{flex:1 1 auto;padding:8px 10px 14px;overflow:auto;background:color-mix(in srgb,var(--card) 94%,transparent);border-top:1px solid var(--line)}
.mo-h{font-weight:900;font-size:calc(18px*var(--gfx-font,1));margin:2px 0 6px}
.mo-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(calc(104px*var(--gfx-scale,1)),1fr));gap:8px}
.mo-card{border:3px solid var(--line);border-radius:16px;padding:8px 4px;text-align:center;cursor:pointer;background:var(--card);color:var(--ink);font:inherit;font-weight:800;font-size:calc(14px*var(--gfx-font,1));min-height:calc(130px*var(--gfx-scale,1))}
.mo-card .e{line-height:1.2;display:block}.mo-card small{display:block;opacity:.8;font-weight:700;font-size:calc(12px*var(--gfx-font,1))}
.mo-card.boss{border-color:#dc2626;background:rgba(220,38,38,.1)}
.mo-card:active{transform:scale(.96)}
.mo-shop{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.mo-it{border:2px solid var(--line);border-radius:12px;padding:6px 10px;min-height:48px;font:inherit;font-size:calc(13px*var(--gfx-font,1));font-weight:700;background:var(--card);color:var(--ink);cursor:pointer;text-align:left;display:flex;gap:6px;align-items:center}
.mo-it.can{border-color:#22c55e;background:rgba(34,197,94,.14)}.mo-it.own{opacity:.6;border-style:dashed}
.mo-bar{display:flex;gap:6px;margin-bottom:6px}
.mo-sm{border:2px solid var(--line);background:var(--card);color:var(--ink);border-radius:12px;padding:6px 14px;min-height:44px;font:inherit;font-weight:800;font-size:calc(14px*var(--gfx-font,1));cursor:pointer;display:flex;gap:6px;align-items:center}
.mo-msg{font-weight:800;text-align:center;padding:4px;min-height:24px}
.mo-ov{position:absolute;inset:0;z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px;text-align:center;background:rgba(15,10,40,.86);color:#fff}
.mo-ov h2{margin:0;font-size:calc(30px*var(--gfx-font,1))}.mo-ov p{margin:0;max-width:330px;font-size:calc(16px*var(--gfx-font,1));line-height:1.4}
.mo-btn{background:var(--accent,#6366f1);color:#fff;border:0;border-radius:16px;padding:14px 26px;min-height:54px;font:inherit;font-size:calc(18px*var(--gfx-font,1));font-weight:800;cursor:pointer}
.mo-btn.alt{background:linear-gradient(135deg,#ef4444,#f59e0b)}
`;

/* ---------- het spel ---------- */
export default {
  id: 'monster', name: 'Monsterjager', emoji: '🗡️', color: '#7c3aed',
  desc: 'Kies een monster (18 soorten) en versla het met goede antwoorden. Koop 8 wapens en 6 harnassen en versla de Drakenkoning, of verdedig je arena eindeloos!',
  tags: ['rpg', 'denken', 'solo', 'arena'], minutes: 6, duo: false,
  create(host, env) {
    let dead = false, ended = false, raf = 0, last = 0, mode = 'intro', endless = false;
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms); timers.add(id); return id; };
    const snd = n => { try { env.snd && env.snd.play(n); } catch (e) { /* stil */ } };
    const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    host.innerHTML = '';
    const root = el('div', 'mo-root'); root.style.height = Math.max(580, env.h || 620) + 'px'; host.appendChild(root);
    const bgw = attachWorld(root, env, 'monster'); const fxl = fxLayer(root, env);
    const world = bgw.world, pal = palette(world);
    let m = createMonster({ level: env.level, rand: env.rand || Math.random, fx: env.fx || {} });
    let S = m.S;
    const hud = el('div', 'mo-hud'); const lvEl = el('span'), xpWrap = el('div', 'mo-xp'), xpBar = el('i'), goldEl = el('span'), gearEl = el('span'), timeEl = el('span');
    xpWrap.appendChild(xpBar); hud.append(lvEl, xpWrap, goldEl, gearEl, timeEl, gearBtn()); root.appendChild(hud);
    const cv = el('canvas', 'mo-cv'); root.appendChild(cv);
    const panel = el('div', 'mo-panel'); root.appendChild(panel);
    const askBox = el('div');
    const ask = mkAsker(env, askBox, mkQSource(env));
    const dpr = Math.min(2, Math.max(1, (typeof window !== 'undefined' && window.devicePixelRatio) || 1) * ((env.gfx && env.gfx.q === 0) ? 1 : 1.25));
    let W = env.w || 360, H = 240;
    function resize() { W = cv.clientWidth || env.w || 360; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    resize();
    const ctx = cv.getContext && cv.getContext('2d');
    const qq = () => (env.gfx && env.gfx.q != null ? env.gfx.q : 1);
    const toRoot = (x, y) => { try { const a = cv.getBoundingClientRect(), b = root.getBoundingClientRect(); return [a.left - b.left + x, a.top - b.top + y]; } catch (e) { return [x, y]; } };
    // sprite met 3D-icoon, emoji als er geen icoon is
    function sprite(it, x, y, size, q) { if (it.icon) di(ctx, it.icon, x, y, size, { q }); else { ctx.font = Math.round(size * 0.8) + 'px "Apple Color Emoji","Segoe UI Emoji",sans-serif'; ctx.fillText(it.emoji, x, y); } }
    const wdeco = (world.deco && world.deco.length ? world.deco : ['tree']);

    /* visuele toestand */
    const flt = []; let heroLunge = 0, monLunge = 0, monFlash = 0, heroFlash = 0, shake = 0, msg = '';
    function floatTxt(txt, x, y, col) { flt.push({ txt, x, y, col, life: 1 }); }
    function burst(x, y, n, kind) { const [rx, ry] = toRoot(x, y); fxl.burst(rx, ry, kind || 'sparkle', n); }
    function bar(x, y, w, h, r, col) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x, y, w, h); ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp(r, 0, 1), h); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h); }
    function draw(dt) {
      if (!ctx) return;
      const q = qq();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const f = S.fight;
      // grond met wereld-kleuren en decoratie
      ctx.fillStyle = hexA(pal.a, 0.92); ctx.fillRect(0, 170, W, H - 170); ctx.fillStyle = hexA(pal.b, 0.9); ctx.fillRect(0, 170, W, 6);
      for (let i = 0; i < 4; i++) di(ctx, wdeco[i % wdeco.length], W * (0.1 + i * 0.27), 160, 40 + (i % 2) * 8, { q });
      const sx = shake > 0 ? (Math.random() - 0.5) * 8 * shake : 0; shake = Math.max(0, shake - dt * 3);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const bob = Math.sin(S.t * 3) * 3;
      const hx = W * 0.22 + heroLunge * 50 + sx, hy = 150 + bob - Math.sin(Math.min(1, heroLunge) * 3.14) * 12;
      softShadow(ctx, W * 0.22, 192, 30, 7, 0.35);
      ctx.globalAlpha = heroFlash > 0 ? 0.5 + 0.5 * Math.sin(S.t * 60) : 1;
      di(ctx, 'lion', hx, hy, 76, { q, shadow: false });
      sprite(WEAPONS[S.wi], hx + 34, hy + 8, 38, q); if (S.ai) sprite(ARMORS[S.ai], hx - 30, hy + 14, 30, q);
      ctx.globalAlpha = 1;
      bar(W * 0.22 - 36, 76, 72, 8, S.hp / m.maxHp(), '#22c55e');
      ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000b'; ctx.lineWidth = 3; const ht = Math.max(0, S.hp) + '/' + m.maxHp(); ctx.strokeText(ht, W * 0.22, 98); ctx.fillText(ht, W * 0.22, 98);
      if (f) {
        const size = f.def.boss ? 120 : 64 + f.def.tier * 10;
        const mx = W * 0.76 - monLunge * 70 + sx, my = 168 - size / 2 + bob * (f.def.boss ? 1.5 : 1) - Math.sin(Math.min(1, monLunge) * 3.14) * 10;
        softShadow(ctx, W * 0.76, 192, size * 0.5, 8, 0.35);
        if (f.def.boss && q > 0) glow(ctx, mx, my, size * 0.8, '#ef4444', 0.35);
        ctx.globalAlpha = monFlash > 0 ? 0.35 : 1; sprite(f.def, mx, my, size, q); ctx.globalAlpha = 1;
        const bw = 100; bar(W * 0.76 - bw / 2, 12, bw, 10, f.hp / f.max, f.def.boss ? '#dc2626' : '#f97316');
        ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000b'; ctx.lineWidth = 3; const mt = f.def.name + ' ' + Math.max(0, f.hp) + '/' + f.max; ctx.strokeText(mt, W * 0.76, 36); ctx.fillText(mt, W * 0.76, 36);
        bar(W * 0.76 - bw / 2, 46, bw, 6, f.gauge, f.gauge > 0.75 ? '#ef4444' : '#facc15');
        ctx.font = 'bold 11px sans-serif'; ctx.strokeText('aanval', W * 0.76, 62); ctx.fillText('aanval', W * 0.76, 62);
      } else { di(ctx, 'tent', W * 0.76, 150, 80, { q }); }
      for (const t of flt) { t.life -= dt * 0.9; t.y -= 34 * dt; ctx.globalAlpha = clamp(t.life * 1.5, 0, 1); ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#fff'; ctx.strokeStyle = t.col; ctx.lineWidth = 5; ctx.strokeText(t.txt, t.x, t.y); ctx.fillText(t.txt, t.x, t.y); }
      ctx.globalAlpha = 1; for (let i = flt.length - 1; i >= 0; i--) if (flt[i].life <= 0) flt.splice(i, 1);
      heroLunge = Math.max(0, heroLunge - dt * 3.5); monLunge = Math.max(0, monLunge - dt * 3); monFlash = Math.max(0, monFlash - dt); heroFlash = Math.max(0, heroFlash - dt);
    }
    let hk = '';
    function renderHud() {
      const k = S.lv + '|' + S.xp + '|' + S.gold + '|' + S.wi + '|' + S.ai + '|' + S.potions + '|' + Math.ceil(S.t) + '|' + S.fainted; if (k === hk) return; hk = k;
      lvEl.innerHTML = ic('star', 28) + ' Lv ' + S.lv; xpBar.style.width = clamp(S.xp / m.xpNeed(), 0, 1) * 100 + '%';
      goldEl.innerHTML = ic('coin', 28) + ' ' + fmt(S.gold); gearEl.innerHTML = ic(WEAPONS[S.wi].icon, 30) + (S.ai ? ic(ARMORS[S.ai].icon, 30) : '') + (S.potions ? ic('potion', 28) + S.potions : '');
      timeEl.innerHTML = ic('hourglass', 26) + ' ' + mmss(MON_TIME_CAP - S.t) + (endless ? ' ' + ic('heart', 24) + (3 - S.fainted) : '');
    }
    function applyEvents(ev) {
      for (const e of ev) {
        if (e.type === 'hit') { heroLunge = 1; monFlash = 0.18; shake = 0.6; floatTxt((e.crit ? 'KRIT! ' : '') + '-' + e.dmg, W * 0.76, 90, e.crit ? '#dc2626' : '#f97316'); burst(W * 0.76, 120, e.crit ? 18 : 8, e.crit ? 'stars' : 'sparkle'); snd('goed'); }
        if (e.type === 'hurt') { monLunge = 1; heroFlash = 0.4; shake = 0.8; floatTxt('-' + e.dmg, W * 0.22, 100, '#dc2626'); burst(W * 0.22, 130, 6, 'smoke'); snd('fout'); }
        if (e.type === 'block') { monLunge = 1; floatTxt('geblokt!', W * 0.22, 100, '#3b82f6'); snd('klik'); }
        if (e.type === 'miss') { snd('fout'); }
        if (e.type === 'win') { burst(W * 0.76, 130, 24, 'coins'); burst(W * 0.76, 130, e.boss ? 50 : 10, e.boss ? 'confetti' : 'stars'); snd(e.boss ? 'win' : 'munt'); msg = 'Gewonnen! +' + e.gold + ' munten +' + e.xp + ' XP' + (e.ups ? ' · LEVEL UP!' : ''); if (e.ups) snd('level'); }
        if (e.type === 'faint') { snd('lose'); msg = 'Je valt flauw... je verliest ' + e.lost + ' munten maar je bent weer fit.'; }
      }
    }
    function endFightIfNeeded() {
      if (S.fight) return false;
      if (mode !== 'fight') return true;
      ask.cancel(); renderHud();
      if (m.done()) { later(finish, 1300); mode = 'over'; return true; }
      later(showPick, 1300); mode = 'wait'; return true;
    }
    function nextAsk() {
      if (dead || ended || mode !== 'fight' || !S.fight) return;
      ask.start({ compact: true, feedback: true, autoNext: 500 }, r => {
        const ev = m.answer(r.ok); applyEvents(ev); renderHud(); renderFightPanel();
        if (endFightIfNeeded()) return;
        later(nextAsk, r.ok ? 250 : 900);
      });
    }
    let msgEl = null, healBtn = null;
    function renderFightPanel() { if (msgEl) msgEl.textContent = S.combo >= 2 ? 'Reeks x' + S.combo + ' (extra schade)' : ''; if (healBtn) healBtn.innerHTML = ic('potion', 28) + ' Drankje (' + S.potions + ')'; }
    function startFight(def) {
      if (ended) return;
      m.start(def); mode = 'fight'; msg = '';
      panel.innerHTML = ''; const bar2 = el('div', 'mo-bar'); healBtn = el('button', 'mo-sm'); healBtn.type = 'button';
      healBtn.addEventListener('click', () => { if (m.heal()) { snd('power'); floatTxt('+hp', W * 0.22, 110, '#16a34a'); burst(W * 0.22, 130, 10, 'sparkle'); renderHud(); renderFightPanel(); } else snd('fout'); });
      msgEl = el('div', 'mo-msg'); bar2.append(healBtn); panel.append(bar2, msgEl, askBox); renderFightPanel();
      snd('klik'); nextAsk();
    }
    function itemBtn(it, owned, afford, label, onBuy) {
      const b = el('button', 'mo-it ' + (owned ? 'own' : afford ? 'can' : '')); b.type = 'button'; b.innerHTML = ic(it.icon, 34) + '<span>' + it.name + '<br><small>' + label + '</small></span>'; b.addEventListener('click', onBuy); return b;
    }
    function showPick() {
      if (dead || ended) return;
      mode = 'pick'; ask.cancel(); panel.innerHTML = ''; healBtn = msgEl = null;
      const h = el('div', 'mo-h', msg ? msg : 'Kies je tegenstander'); panel.appendChild(h); msg = '';
      const cards = el('div', 'mo-cards');
      for (const d of m.options()) {
        const c = el('button', 'mo-card' + (d.boss ? ' boss' : '')); c.type = 'button';
        const hpv = Math.round(d.hp * (env.level === 1 ? 0.8 : env.level === 3 ? 1.15 : 1) * (endless ? 1 + 0.05 * S.defeated : 1));
        c.innerHTML = '<span class="e">' + (d.icon ? ic(d.icon, 64) : '<span style="font-size:52px">' + d.emoji + '</span>') + '</span>' + d.name + '<small>' + ic('heart', 16) + ' ' + hpv + ' · ' + ic('coin', 16) + ' ' + d.gold + '</small><small>' + (d.boss ? 'BAAS' : '★'.repeat(d.tier)) + '</small>';
        c.addEventListener('click', () => startFight(d)); cards.appendChild(c);
      }
      panel.appendChild(cards);
      const shop = el('div', 'mo-shop');
      WEAPONS.forEach((w, i) => { if (i === 0) return; shop.appendChild(itemBtn(w, i <= S.wi, S.gold >= w.cost, '+' + w.atk + ' schade ' + (i <= S.wi ? '✔' : '· ' + w.cost), () => { if (m.buyWeapon(i)) { snd('power'); burst(W * 0.22, 130, 14, 'sparkle'); renderHud(); showPick(); } else snd('fout'); })); });
      ARMORS.forEach((a, i) => { if (i === 0) return; shop.appendChild(itemBtn(a, i <= S.ai, S.gold >= a.cost, '-' + a.def + ' schade ' + (i <= S.ai ? '✔' : '· ' + a.cost), () => { if (m.buyArmor(i)) { snd('power'); burst(W * 0.22, 130, 14, 'sparkle'); renderHud(); showPick(); } else snd('fout'); })); });
      shop.appendChild(itemBtn({ icon: 'potion', name: 'Drankje' }, false, S.gold >= POTION.cost, 'heelt ' + Math.round(POTION.heal * 100) + '% · ' + POTION.cost, () => { if (m.buyPotion()) { snd('munt'); renderHud(); showPick(); } else snd('fout'); }));
      if (S.potions && S.hp < m.maxHp()) { const hb = el('button', 'mo-it can'); hb.type = 'button'; hb.innerHTML = ic('heart', 30) + ' Drink nu'; hb.addEventListener('click', () => { if (m.heal()) { snd('power'); renderHud(); showPick(); } }); shop.appendChild(hb); }
      panel.appendChild(el('div', 'mo-h', 'Winkel <small style="font-weight:600;opacity:.75">· ' + S.hp + '/' + m.maxHp() + ' levens · schade per goed antwoord ' + m.dmg() + '</small>')); panel.appendChild(shop);
      renderHud();
    }
    function loop(ts) {
      if (dead) return;
      const dt = Math.min(0.1, (ts - (last || ts)) / 1000); last = ts;
      if (!root.isConnected) { raf = setTimeout(() => { raf = requestAnimationFrame(loop); }, 400); return; }
      if (mode !== 'intro' && !ended) {
        if (mode === 'fight' || mode === 'pick' || mode === 'wait') { const ev = m.tick(dt); if (ev.length) { applyEvents(ev); renderHud(); renderFightPanel(); if (mode === 'fight') { if (!S.fight) { if (endFightIfNeeded()) { /* verwerkt */ } } } } }
        if (!S.fight && mode === 'fight') endFightIfNeeded();
        if (m.done() && mode !== 'over' && !S.fight) { mode = 'over'; ask.cancel(); later(finish, 600); }
        else if (m.done() && mode === 'fight') { mode = 'over'; ask.cancel(); later(finish, 600); }
        renderHud();
      }
      draw(dt);
      raf = requestAnimationFrame(loop);
    }
    function finish() {
      if (ended) return; ended = true; ask.cancel();
      const win = S.bossDown;
      const ov = el('div', 'mo-ov', '<div>' + ic(win ? 'trophy' : endless ? 'medal' : 'hourglass', 96) + '</div><h2>' + (win ? 'Drakenkoning verslagen!' : endless ? 'De arena is voorbij' : 'De dag is voorbij') + '</h2><p>' + S.defeated + ' monsters verslagen · level ' + S.lv + '</p>'); root.appendChild(ov); snd(win ? 'win' : 'level');
      fxl.burst((root.clientWidth || 360) / 2, 160, win ? 'confetti' : 'coins', win ? 60 : 16);
      later(() => { try { env.end({ score: m.score(), win: endless ? null : win, stats: { correct: S.correct, wrong: S.wrong, 'best streak': S.best, monsters: S.defeated, level: S.lv, flauwgevallen: S.fainted }, summary: (endless ? 'Arena: ' : '') + S.defeated + ' monsters, level ' + S.lv + (win ? ', Drakenkoning verslagen!' : '') }); } catch (e) { /* hub */ } }, 1700);
    }
    function begin(md) {
      endless = md === 'arena';
      if (endless) { m = createMonster({ level: env.level, rand: env.rand || Math.random, fx: env.fx || {}, endless: true }); S = m.S; }
      intro.remove(); snd('klik'); showPick();
    }
    const intro = el('div', 'mo-ov', '<div>' + ic('lion', 96) + '</div><h2>Monsterjager</h2><p>Kies een monster. Elk goed antwoord is een zwaardslag; fout of te traag en het monster slaat terug. Koop wapens en versla de Drakenkoning!</p>');
    const go = el('button', 'mo-btn', 'Tik om te beginnen'); go.type = 'button'; go.addEventListener('click', () => begin('rpg'));
    const go2 = el('button', 'mo-btn alt', 'Arena: eindeloos, 3 keer flauwvallen'); go2.type = 'button'; go2.addEventListener('click', () => begin('arena'));
    intro.append(go, go2); root.appendChild(intro);
    renderHud(); raf = requestAnimationFrame(loop);
    const onResize = () => resize(); window.addEventListener && window.addEventListener('resize', onResize);
    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf); clearTimeout(raf); timers.forEach(clearTimeout); timers.clear();
        try { ask.cancel(); } catch (e) { /* ok */ }
        window.removeEventListener && window.removeEventListener('resize', onResize);
        try { fxl.destroy(); bgw.destroy(); } catch (e) { /* ok */ }
        style.remove(); try { host.innerHTML = ''; } catch (e) { /* ok */ }
      },
    };
  },
};
