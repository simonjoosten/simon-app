// Monsterjager – een mini-RPG: kies monsters, versla ze met goede antwoorden, koop wapens en harnassen, versla de Drakenkoning.
// Pure logica (createMonster) is los testbaar; de view tekent een canvas-gevecht en gebruikt alleen env.ask voor vragen.

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
  { id: 'stok', name: 'Houten stok', emoji: '🪵', atk: 0, cost: 0 },
  { id: 'zwaard', name: 'Ridderzwaard', emoji: '🗡️', atk: 3, cost: 35 },
  { id: 'bijl', name: 'Strijdbijl', emoji: '🪓', atk: 6, cost: 100 },
  { id: 'staf', name: 'Toverstaf', emoji: '🪄', atk: 10, cost: 220 },
  { id: 'draak', name: 'Drakenzwaard', emoji: '⚔️', atk: 15, cost: 420 },
];
export const ARMORS = [
  { id: 'hemd', name: 'Hemd', emoji: '👕', def: 0, cost: 0 },
  { id: 'leer', name: 'Leren vest', emoji: '🦺', def: 1, cost: 30 },
  { id: 'schild', name: 'Houten schild', emoji: '🛡️', def: 2, cost: 85 },
  { id: 'kolder', name: 'Maliënkolder', emoji: '⛓️', def: 3, cost: 190 },
  { id: 'goud', name: 'Gouden harnas', emoji: '👑', def: 5, cost: 360 },
];
export const POTION = { cost: 14, heal: 0.45 };
export const MONSTERS = [
  { id: 'slijm', name: 'Slijmbal', emoji: '🟢', tier: 1, hp: 10, dmg: 2, spd: 7, gold: 8, xp: 8 },
  { id: 'vleer', name: 'Vleermuis', emoji: '🦇', tier: 1, hp: 12, dmg: 2, spd: 6.5, gold: 9, xp: 9 },
  { id: 'spin', name: 'Reuzenspin', emoji: '🕷️', tier: 1, hp: 14, dmg: 2, spd: 7, gold: 10, xp: 10 },
  { id: 'wolf', name: 'Wolf', emoji: '🐺', tier: 2, hp: 30, dmg: 4, spd: 6.5, gold: 20, xp: 16 },
  { id: 'spook', name: 'Spook', emoji: '👻', tier: 2, hp: 28, dmg: 4, spd: 6, gold: 22, xp: 17 },
  { id: 'krab', name: 'Reuzenkrab', emoji: '🦀', tier: 2, hp: 34, dmg: 4, spd: 7, gold: 22, xp: 18 },
  { id: 'trol', name: 'Trol', emoji: '🧌', tier: 3, hp: 58, dmg: 6, spd: 6, gold: 38, xp: 28 },
  { id: 'schorp', name: 'Schorpioen', emoji: '🦂', tier: 3, hp: 52, dmg: 6, spd: 5.5, gold: 40, xp: 29 },
  { id: 'heks', name: 'Gekke heks', emoji: '🧙', tier: 3, hp: 56, dmg: 7, spd: 6, gold: 42, xp: 30 },
  { id: 'reus', name: 'Reus', emoji: '👹', tier: 4, hp: 100, dmg: 9, spd: 5.5, gold: 70, xp: 48 },
  { id: 'dino', name: 'Dino', emoji: '🦖', tier: 4, hp: 110, dmg: 10, spd: 6, gold: 75, xp: 50 },
  { id: 'robot', name: 'Schrootrobot', emoji: '🤖', tier: 4, hp: 105, dmg: 9, spd: 5, gold: 75, xp: 50 },
  { id: 'draak', name: 'Drakenkoning', emoji: '🐲', tier: 5, hp: 240, dmg: 12, spd: 5, gold: 200, xp: 120, boss: true },
];
export const MON_TARGET_LEVEL = 5; // vanaf hier verschijnt de Drakenkoning

export function createMonster({ level = 2, rand = Math.random, fx = {} } = {}) {
  const hpF = level === 1 ? 0.8 : level === 3 ? 1.15 : 1, tF = level === 1 ? 1.25 : level === 3 ? 0.85 : 1;
  const S = { t: 0, lv: 1, xp: 0, hp: 0, gold: Math.round(fx.startCash || 0), earned: 0, wi: 0, ai: 0, potions: 0, defeated: 0, fainted: 0, fight: null, correct: 0, wrong: 0, combo: 0, best: 0, bossDown: false, firstReward: null };
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
    if (m.bossOpen()) out.push(MONSTERS.find(x => x.boss));
    return out;
  };
  m.start = def => { S.fight = { def, hp: Math.round(def.hp * hpF), max: Math.round(def.hp * hpF), gauge: 0, shield: fx.shield || 0, spd: def.spd * tF * 1.3 }; return S.fight; };
  m.heal = () => { if (S.potions <= 0 || S.hp >= m.maxHp()) return false; S.potions--; S.hp = Math.min(m.maxHp(), S.hp + Math.ceil(m.maxHp() * POTION.heal)); return true; };
  m.buyPotion = () => { if (S.gold < POTION.cost) return false; S.gold -= POTION.cost; S.potions++; return true; };
  m.buyWeapon = i => { const w = WEAPONS[i]; if (!w || i <= S.wi || S.gold < w.cost) return false; S.gold -= w.cost; S.wi = i; return true; };
  m.buyArmor = i => { const a = ARMORS[i]; if (!a || i <= S.ai || S.gold < a.cost) return false; S.gold -= a.cost; S.ai = i; return true; };
  function monsterHit(ev) {
    const f = S.fight; let d = Math.max(1, f.def.dmg - m.def());
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
  m.done = () => S.bossDown || S.t >= MON_TIME_CAP;
  m.score = () => S.defeated * 100 + S.earned + S.lv * 50 + (S.bossDown ? 500 : 0);
  return m;
}

/* ---------- stijl ---------- */
const CSS = `
.mo-root{position:relative;display:flex;flex-direction:column;width:100%;box-sizing:border-box;background:var(--card);color:var(--ink);border-radius:14px;overflow:hidden;font-family:inherit;user-select:none;-webkit-user-select:none}
.mo-hud{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;padding:7px 12px;font-weight:800;font-size:14px;border-bottom:1px solid var(--line)}
.mo-xp{flex:1 1 70px;height:8px;border-radius:5px;background:var(--line);overflow:hidden;min-width:60px}.mo-xp>i{display:block;height:100%;background:#a855f7;transition:width .3s}
.mo-cv{display:block;width:100%;height:210px;background:#bfe3ff}
.mo-panel{flex:1 1 auto;padding:8px 10px 12px;overflow:auto;border-top:1px solid var(--line)}
.mo-h{font-weight:900;font-size:16px;margin:2px 0 6px}
.mo-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:8px}
.mo-card{border:2px solid var(--line);border-radius:12px;padding:8px 4px;text-align:center;cursor:pointer;background:var(--card);color:var(--ink);font-weight:700;font-size:13px}
.mo-card .e{font-size:34px;line-height:1.2;display:block}.mo-card small{display:block;opacity:.75;font-weight:600}
.mo-card.boss{border-color:#dc2626;background:rgba(220,38,38,.1)}
.mo-card:active{transform:scale(.96)}
.mo-shop{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.mo-it{border:1.5px solid var(--line);border-radius:10px;padding:5px 8px;font-size:12px;font-weight:700;background:var(--card);color:var(--ink);cursor:pointer;text-align:left}
.mo-it.can{border-color:#22c55e;background:rgba(34,197,94,.14)}.mo-it.own{opacity:.6;border-style:dashed}
.mo-bar{display:flex;gap:6px;margin-bottom:6px}
.mo-sm{border:1.5px solid var(--line);background:var(--card);color:var(--ink);border-radius:9px;padding:4px 10px;font-weight:800;font-size:13px;cursor:pointer}
.mo-msg{font-weight:800;text-align:center;padding:4px;min-height:22px}
.mo-ov{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:20px;text-align:center;background:rgba(15,10,40,.85);color:#fff}
.mo-ov h2{margin:0;font-size:26px}.mo-ov p{margin:0;max-width:310px;font-size:15px;line-height:1.35}
.mo-btn{background:var(--accent,#6366f1);color:#fff;border:0;border-radius:12px;padding:12px 26px;font-size:17px;font-weight:800;cursor:pointer}
`;

/* ---------- het spel ---------- */
export default {
  id: 'monster', name: 'Monsterjager', emoji: '🗡️', color: '#7c3aed',
  desc: 'Kies een monster en versla het met goede antwoorden. Koop wapens en harnassen en versla de Drakenkoning!',
  tags: ['rpg', 'denken', 'solo'], minutes: 6, duo: false,
  create(host, env) {
    let dead = false, ended = false, raf = 0, last = 0, mode = 'intro';
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms); timers.add(id); return id; };
    const snd = n => { try { env.snd && env.snd.play(n); } catch (e) { /* stil */ } };
    const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    host.innerHTML = '';
    const root = el('div', 'mo-root'); root.style.height = Math.max(540, env.h || 620) + 'px'; host.appendChild(root);
    const m = createMonster({ level: env.level, rand: env.rand || Math.random, fx: env.fx || {} });
    const S = m.S;
    const hud = el('div', 'mo-hud'); const lvEl = el('span'), xpWrap = el('div', 'mo-xp'), xpBar = el('i'), goldEl = el('span'), gearEl = el('span'), timeEl = el('span');
    xpWrap.appendChild(xpBar); hud.append(lvEl, xpWrap, goldEl, gearEl, timeEl); root.appendChild(hud);
    const cv = el('canvas', 'mo-cv'); root.appendChild(cv);
    const panel = el('div', 'mo-panel'); root.appendChild(panel);
    const askBox = el('div');
    const ask = mkAsker(env, askBox, mkQSource(env));
    const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    let W = env.w || 360, H = 210;
    function resize() { W = cv.clientWidth || env.w || 360; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    resize();
    const ctx = cv.getContext && cv.getContext('2d');

    /* visuele toestand */
    const fl = [], parts = []; let heroLunge = 0, monLunge = 0, monFlash = 0, heroFlash = 0, shake = 0, msg = '';
    const FONT = "'Apple Color Emoji','Segoe UI Emoji',sans-serif";
    function floatTxt(txt, x, y, col) { fl.push({ txt, x, y, col, life: 1 }); }
    function burst(x, y, n, col) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = 40 + Math.random() * 90; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 0.7, col }); } }
    function bar(x, y, w, h, r, col) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x, y, w, h); ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp(r, 0, 1), h); }
    function draw(dt) {
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const f = S.fight, tier = f ? f.def.tier : 1;
      const g = ctx.createLinearGradient(0, 0, 0, H); const skies = [['#9bd7ff', '#e6f6ff'], ['#9bd7ff', '#e6f6ff'], ['#f9b27c', '#fde9c9'], ['#8a6bbf', '#f4b7a1'], ['#3b2a5e', '#c2577a'], ['#1c1030', '#7a1f3d']];
      const sk = skies[Math.min(tier, 5)]; g.addColorStop(0, sk[0]); g.addColorStop(1, sk[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 3; i++) { const x = ((S.t * 6 + i * 130) % (W + 80)) - 40; ctx.beginPath(); ctx.arc(x, 40 + i * 22, 16, 0, 6.3); ctx.arc(x + 18, 44 + i * 22, 12, 0, 6.3); ctx.fill(); }
      ctx.fillStyle = tier >= 4 ? '#4a3f6b' : '#6fbf73'; ctx.beginPath(); ctx.moveTo(0, 150); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 140 + Math.sin(x / 55) * 10); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      ctx.fillStyle = tier >= 4 ? '#352c52' : '#4fa55a'; ctx.fillRect(0, 168, W, H - 168);
      const sx = shake > 0 ? (Math.random() - 0.5) * 8 * shake : 0; shake = Math.max(0, shake - dt * 3);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const bob = Math.sin(S.t * 3) * 3;
      // held
      const hx = W * 0.22 + heroLunge * 50 + sx, hy = 150 + bob - Math.sin(Math.min(1, heroLunge) * 3.14) * 12;
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(W * 0.22, 172, 24, 6, 0, 0, 6.3); ctx.fill();
      ctx.globalAlpha = heroFlash > 0 ? 0.5 + 0.5 * Math.sin(S.t * 60) : 1;
      ctx.font = '46px ' + FONT; ctx.fillText('🦸', hx, hy);
      ctx.font = '24px ' + FONT; ctx.fillText(WEAPONS[S.wi].emoji, hx + 26, hy + 6); ctx.fillText(ARMORS[S.ai].def ? ARMORS[S.ai].emoji : '', hx - 24, hy + 10);
      ctx.globalAlpha = 1;
      bar(W * 0.22 - 34, 88, 68, 7, S.hp / m.maxHp(), '#22c55e');
      ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#12202f'; ctx.fillText(Math.max(0, S.hp) + '/' + m.maxHp(), W * 0.22, 106);
      // monster
      if (f) {
        const size = f.def.boss ? 78 : 40 + f.def.tier * 7;
        const mx = W * 0.76 - monLunge * 70 + sx, my = 150 - size / 2 + 22 + bob * (f.def.boss ? 1.5 : 1) - Math.sin(Math.min(1, monLunge) * 3.14) * 10;
        ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(W * 0.76, 172, size * 0.5, 7, 0, 0, 6.3); ctx.fill();
        ctx.globalAlpha = monFlash > 0 ? 0.35 : 1; ctx.font = size + 'px ' + FONT; ctx.fillText(f.def.emoji, mx, my); ctx.globalAlpha = 1;
        const bw = 90; bar(W * 0.76 - bw / 2, 14, bw, 9, f.hp / f.max, f.def.boss ? '#dc2626' : '#f97316');
        ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#12202f'; ctx.fillText(f.def.name + ' ' + Math.max(0, f.hp) + '/' + f.max, W * 0.76, 36);
        bar(W * 0.76 - bw / 2, 46, bw, 5, f.gauge, f.gauge > 0.75 ? '#ef4444' : '#facc15');
        ctx.font = '10px sans-serif'; ctx.fillText('⚡ aanval', W * 0.76, 62);
      } else { ctx.font = '34px ' + FONT; ctx.fillText('🏕️', W * 0.76, 140); }
      // deeltjes en teksten
      for (const p of parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt; ctx.fillStyle = p.col; ctx.globalAlpha = clamp(p.life * 1.6, 0, 1); ctx.fillRect(p.x, p.y, 4, 4); }
      ctx.globalAlpha = 1; for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
      for (const t of fl) { t.life -= dt * 0.9; t.y -= 34 * dt; ctx.globalAlpha = clamp(t.life * 1.5, 0, 1); ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#fff'; ctx.strokeStyle = t.col; ctx.lineWidth = 4; ctx.strokeText(t.txt, t.x, t.y); ctx.fillText(t.txt, t.x, t.y); }
      ctx.globalAlpha = 1; for (let i = fl.length - 1; i >= 0; i--) if (fl[i].life <= 0) fl.splice(i, 1);
      heroLunge = Math.max(0, heroLunge - dt * 3.5); monLunge = Math.max(0, monLunge - dt * 3); monFlash = Math.max(0, monFlash - dt); heroFlash = Math.max(0, heroFlash - dt);
    }
    function renderHud() {
      lvEl.textContent = '⭐ Lv ' + S.lv; xpBar.style.width = clamp(S.xp / m.xpNeed(), 0, 1) * 100 + '%';
      goldEl.textContent = '💰 ' + fmt(S.gold); gearEl.textContent = WEAPONS[S.wi].emoji + ARMORS[S.ai].emoji + (S.potions ? ' 🧪' + S.potions : ''); timeEl.textContent = '⏱ ' + mmss(MON_TIME_CAP - S.t);
    }
    function applyEvents(ev) {
      for (const e of ev) {
        if (e.type === 'hit') { heroLunge = 1; monFlash = 0.18; shake = 0.6; floatTxt((e.crit ? '💥' : '') + '-' + e.dmg, W * 0.76, 90, e.crit ? '#dc2626' : '#f97316'); burst(W * 0.76, 120, e.crit ? 16 : 8, e.crit ? '#facc15' : '#fff'); snd('goed'); }
        if (e.type === 'hurt') { monLunge = 1; heroFlash = 0.4; shake = 0.8; floatTxt('-' + e.dmg, W * 0.22, 100, '#dc2626'); snd('fout'); }
        if (e.type === 'block') { monLunge = 1; floatTxt('🛡️ geblokt', W * 0.22, 100, '#3b82f6'); snd('klik'); }
        if (e.type === 'miss') { snd('fout'); }
        if (e.type === 'win') { burst(W * 0.76, 130, 24, '#facc15'); snd(e.boss ? 'win' : 'munt'); msg = '🎉 Gewonnen! +' + e.gold + '💰 +' + e.xp + ' XP' + (e.ups ? ' · LEVEL UP! ⭐' : ''); if (e.ups) snd('level'); }
        if (e.type === 'faint') { snd('lose'); msg = '😵 Je valt flauw… je verliest ' + e.lost + '💰 maar je bent weer fit.'; }
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
    function renderFightPanel() { if (msgEl) msgEl.textContent = S.combo >= 2 ? '🔥 Reeks ×' + S.combo + ' (extra schade)' : ''; if (healBtn) healBtn.textContent = '🧪 Drankje (' + S.potions + ')'; }
    function startFight(def) {
      if (ended) return;
      m.start(def); mode = 'fight'; msg = '';
      panel.innerHTML = ''; const bar2 = el('div', 'mo-bar'); healBtn = el('button', 'mo-sm'); healBtn.type = 'button';
      healBtn.addEventListener('click', () => { if (m.heal()) { snd('power'); floatTxt('💚 +hp', W * 0.22, 110, '#16a34a'); renderHud(); renderFightPanel(); } else snd('fout'); });
      msgEl = el('div', 'mo-msg'); bar2.append(healBtn); panel.append(bar2, msgEl, askBox); renderFightPanel();
      snd('klik'); nextAsk();
    }
    function showPick() {
      if (dead || ended) return;
      mode = 'pick'; ask.cancel(); panel.innerHTML = ''; healBtn = msgEl = null;
      const h = el('div', 'mo-h', msg ? msg : 'Kies je tegenstander'); panel.appendChild(h); msg = '';
      const cards = el('div', 'mo-cards');
      for (const d of m.options()) {
        const c = el('button', 'mo-card' + (d.boss ? ' boss' : '')); c.type = 'button';
        c.innerHTML = '<span class="e">' + d.emoji + '</span>' + d.name + '<small>❤️ ' + Math.round(d.hp * (env.level === 1 ? 0.8 : env.level === 3 ? 1.15 : 1)) + ' · 💰 ' + d.gold + '</small><small>' + (d.boss ? '👑 BAAS' : '⭐'.repeat(d.tier)) + '</small>';
        c.addEventListener('click', () => startFight(d)); cards.appendChild(c);
      }
      panel.appendChild(cards);
      const shop = el('div', 'mo-shop');
      WEAPONS.forEach((w, i) => { if (i === 0) return; const b = el('button', 'mo-it ' + (i <= S.wi ? 'own' : S.gold >= w.cost ? 'can' : '')); b.type = 'button'; b.innerHTML = w.emoji + ' ' + w.name + ' <small>(+' + w.atk + ') ' + (i <= S.wi ? '✔' : '💰' + w.cost) + '</small>'; b.addEventListener('click', () => { if (m.buyWeapon(i)) { snd('power'); renderHud(); showPick(); } else snd('fout'); }); shop.appendChild(b); });
      ARMORS.forEach((a, i) => { if (i === 0) return; const b = el('button', 'mo-it ' + (i <= S.ai ? 'own' : S.gold >= a.cost ? 'can' : '')); b.type = 'button'; b.innerHTML = a.emoji + ' ' + a.name + ' <small>(−' + a.def + ' schade) ' + (i <= S.ai ? '✔' : '💰' + a.cost) + '</small>'; b.addEventListener('click', () => { if (m.buyArmor(i)) { snd('power'); renderHud(); showPick(); } else snd('fout'); }); shop.appendChild(b); });
      const pb = el('button', 'mo-it ' + (S.gold >= POTION.cost ? 'can' : '')); pb.type = 'button'; pb.innerHTML = '🧪 Drankje <small>💰' + POTION.cost + ' · heelt ' + Math.round(POTION.heal * 100) + '%</small>'; pb.addEventListener('click', () => { if (m.buyPotion()) { snd('munt'); renderHud(); showPick(); } else snd('fout'); }); shop.appendChild(pb);
      if (S.potions && S.hp < m.maxHp()) { const hb = el('button', 'mo-it can'); hb.type = 'button'; hb.textContent = '💚 Drink nu'; hb.addEventListener('click', () => { if (m.heal()) { snd('power'); renderHud(); showPick(); } }); shop.appendChild(hb); }
      panel.appendChild(el('div', 'mo-h', 'Winkel <small style="font-weight:600;opacity:.7">· ❤️ ' + S.hp + '/' + m.maxHp() + ' · schade per goed antwoord ' + m.dmg() + '</small>')); panel.appendChild(shop);
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
        else if (S.t >= MON_TIME_CAP && mode === 'fight') { mode = 'over'; ask.cancel(); later(finish, 600); }
        renderHud();
      }
      draw(dt);
      raf = requestAnimationFrame(loop);
    }
    function finish() {
      if (ended) return; ended = true; ask.cancel();
      const win = S.bossDown;
      const ov = el('div', 'mo-ov', '<h2>' + (win ? '🏆 Drakenkoning verslagen!' : '⏱ De dag is voorbij') + '</h2><p>' + S.defeated + ' monsters verslagen · level ' + S.lv + '</p>'); root.appendChild(ov); snd(win ? 'win' : 'level');
      later(() => { try { env.end({ score: m.score(), win, stats: { correct: S.correct, wrong: S.wrong, 'best streak': S.best, monsters: S.defeated, level: S.lv, flauwgevallen: S.fainted }, summary: S.defeated + ' monsters, level ' + S.lv + (win ? ', Drakenkoning verslagen!' : '') }); } catch (e) { /* hub */ } }, 1700);
    }
    const intro = el('div', 'mo-ov', '<h2>🗡️ Monsterjager</h2><p>Kies een monster. Elk goed antwoord is een zwaardslag; fout of te traag en het monster slaat terug. Koop wapens, versla de 🐲 Drakenkoning!</p>');
    const go = el('button', 'mo-btn', 'Tik om te beginnen'); go.type = 'button';
    go.addEventListener('click', () => { intro.remove(); snd('klik'); showPick(); });
    intro.appendChild(go); root.appendChild(intro);
    renderHud(); raf = requestAnimationFrame(loop);
    const onResize = () => resize(); window.addEventListener && window.addEventListener('resize', onResize);
    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf); clearTimeout(raf); timers.forEach(clearTimeout); timers.clear();
        try { ask.cancel(); } catch (e) { /* ok */ }
        window.removeEventListener && window.removeEventListener('resize', onResize);
        style.remove(); try { host.innerHTML = ''; } catch (e) { /* ok */ }
      },
    };
  },
};
