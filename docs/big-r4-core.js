// Ronde 4 voor de "big-" tycoon-spellen: gedeelde laag met seizoenen, evenementen, prestaties, dagelijkse opdrachten en Legende-rang.
// - createEngine(cfg, io): pure logica (geen DOM) -> testbaar in node.
// - mount(ctx, cfg): bouwt knop + paneel + zwevende evenement-bel bovenop een bestaand spel.
// Het spel zelf levert alleen: metrics() (tellers), rate() (inkomen per seconde), add(v) (geld erbij), en optioneel ng (nieuw spel+).
// Opslag: localStorage + gamesaves/big-<spel>-r4__<uid> (klein: < 2000 tekens). Geen nieuwe collecties of rules.

export const R4_VERSION = 1;
export const R4M = { v: 1 };                     // totale bonusfactor (voor wie hem wil lezen)
const MAXDT = 5;

/* ---------- seizoenen (echte kalender) ---------- */
// from/to = [maand, dag] (inclusief). mult = inkomensbonus tijdens het seizoen.
export const SEASONS = [
  { id: 'winter', n: 'Winterwonder', e: '❄️', from: [1, 2], to: [2, 7], mult: 1.10, col: '#5b8def', fall: ['❄️', '⛄', '✨'], scene: 'intro-stad', tip: 'Alles sneeuwt in! Gezellig druk.' },
  { id: 'valentijn', n: 'Valentijnsweek', e: '💘', from: [2, 8], to: [2, 16], mult: 1.15, col: '#e8588d', fall: ['💘', '💖', '🌹'], scene: 'intro-kasteel', tip: 'Liefde in de lucht. Iedereen is extra blij.' },
  { id: 'voorjaar', n: 'Voorjaarsbloei', e: '🌷', from: [2, 17], to: [4, 18], mult: 1.10, col: '#54b86a', fall: ['🌷', '🌼', '🦋'], scene: 'intro-boerderij', tip: 'De bloemen komen op. Fris en vrolijk.' },
  { id: 'lente', n: 'Lentefeest', e: '🐣', from: [4, 19], to: [4, 26], mult: 1.15, col: '#f0b429', fall: ['🐣', '🥚', '🌸'], scene: 'intro-bos', tip: 'Zoek de eitjes! Een feestelijke week.' },
  { id: 'koning', n: 'Koningsfeest', e: '👑', from: [4, 27], to: [5, 5], mult: 1.25, col: '#f08a24', fall: ['👑', '🎈', '🎉'], scene: 'intro-pretpark', tip: 'Oranje boven! Vrijmarkt en feest.' },
  { id: 'mei', n: 'Meiweer', e: '🌼', from: [5, 6], to: [6, 20], mult: 1.12, col: '#7bc043', fall: ['🌼', '☀️', '🐝'], scene: 'intro-boerderij', tip: 'Heerlijk weer om buiten te zijn.' },
  { id: 'zomer', n: 'Zomerfestival', e: '☀️', from: [6, 21], to: [8, 31], mult: 1.20, col: '#f5a524', fall: ['☀️', '🌊', '🍦'], scene: 'intro-onderwater', tip: 'Zomervakantie! Het is overal druk.' },
  { id: 'najaar', n: 'Gouden najaar', e: '🍂', from: [9, 1], to: [10, 23], mult: 1.10, col: '#c8742a', fall: ['🍂', '🍁', '🌰'], scene: 'intro-bos', tip: 'Bladeren dwarrelen naar beneden.' },
  { id: 'halloween', n: 'Spookweek', e: '🎃', from: [10, 24], to: [11, 5], mult: 1.20, col: '#8a4bd0', fall: ['🎃', '👻', '🦇'], scene: 'intro-kasteel', tip: 'Boe! Een beetje griezelen is heerlijk.' },
  { id: 'lampion', n: 'Lampionnenfeest', e: '🏮', from: [11, 6], to: [11, 14], mult: 1.12, col: '#e0662b', fall: ['🏮', '⭐', '🍬'], scene: 'intro-stad', tip: 'Lichtjes in het donker. Liedjes zingen!' },
  { id: 'sint', n: 'Sinterklaasfeest', e: '🎁', from: [11, 15], to: [12, 6], mult: 1.22, col: '#d63a3a', fall: ['🎁', '🍬', '⭐'], scene: 'intro-snoepland', tip: 'Pepernoten en cadeautjes!' },
  { id: 'kerst', n: 'Kerstfeest', e: '🎄', from: [12, 7], to: [12, 26], mult: 1.25, col: '#2f9e5b', fall: ['🎄', '❄️', '⭐'], scene: 'intro-stad', tip: 'Lichtjes, sneeuw en warme chocolademelk.' },
  { id: 'oudnieuw', n: 'Oud & Nieuw', e: '🎆', from: [12, 27], to: [12, 31], mult: 1.25, col: '#7d4ee0', fall: ['🎆', '🎇', '✨'], scene: 'intro-pretpark', tip: 'Vuurwerk! Een knallend einde van het jaar.' },
];
const md = (m, d) => m * 100 + d;
export function seasonAt(date = new Date()) {
  const k = md(date.getMonth() + 1, date.getDate());
  for (const s of SEASONS) if (k >= md(...s.from) && k <= md(...s.to)) return s;
  return SEASONS[0];                              // 1 januari valt bij Oud & Nieuw-nasleep: gewoon winter
}
export const seasonById = (id) => SEASONS.find((s) => s.id === id) || SEASONS[0];

/* ---------- rangen (Legende) ---------- */
export const RANKS = [
  { n: 'Beginner', e: '🌱', at: 0 }, { n: 'Leerling', e: '📘', at: 4 }, { n: 'Bouwer', e: '🔨', at: 10 }, { n: 'Ondernemer', e: '💼', at: 20 },
  { n: 'Directeur', e: '🎩', at: 35 }, { n: 'Topper', e: '🏅', at: 55 }, { n: 'Kampioen', e: '🏆', at: 80 }, { n: 'Meester', e: '🎓', at: 115 },
  { n: 'Held', e: '🦸', at: 160 }, { n: 'Tycoon', e: '💎', at: 220 }, { n: 'Superster', e: '🌟', at: 300 }, { n: 'Legende', e: '👑', at: 400 },
];
export const rankOf = (tot) => { let r = 0; for (let i = 0; i < RANKS.length; i++) if (tot >= RANKS[i].at) r = i; return r; };

// Legende-voordelen, te koop met sterren (blijven altijd bewaard)
export const PERKS = {
  inc: { n: 'Gouden handen', e: '💰', max: 10, d: '+5% inkomen per niveau', cost: (l) => 2 + l },
  evt: { n: 'Feestneus', e: '🎈', max: 5, d: 'Evenementen komen 10% vaker', cost: (l) => 3 + l * 2 },
  gift: { n: 'Gulle gevers', e: '🎁', max: 5, d: 'Cadeaus en dagbeloningen +20%', cost: (l) => 3 + l * 2 },
  long: { n: 'Lange adem', e: '⏳', max: 5, d: 'Bonussen duren 15% langer', cost: (l) => 3 + l * 2 },
  luck: { n: 'Geluksster', e: '🍀', max: 5, d: 'Meer kans op een ster bij evenementen', cost: (l) => 4 + l * 2 },
};

/* ---------- algemene evenementen ---------- */
// kind: mult (x mult gedurende secs) | gift (rate x secs erbij) | star (sterren)
export const EVENTS = [
  { id: 'gold', e: '🌟', n: 'Gouden kwartier', d: 'Twee keer zoveel inkomen!', kind: 'mult', mult: 2, secs: 60, w: 5 },
  { id: 'rush', e: '🎉', n: 'Drukte!', d: 'Iedereen komt kijken: anderhalf keer inkomen.', kind: 'mult', mult: 1.5, secs: 120, w: 6 },
  { id: 'gift', e: '🎁', n: 'Cadeautje', d: 'Een mooi bedrag voor je kassa.', kind: 'gift', secs: 90, w: 7 },
  { id: 'jack', e: '💎', n: 'Jackpot', d: 'Een flinke buit!', kind: 'gift', secs: 300, w: 1.5 },
  { id: 'star', e: '☄️', n: 'Vallende ster', d: 'Wens iets! Je krijgt een Legende-ster.', kind: 'star', stars: 1, w: 2.5 },
];

/* ---------- algemene prestaties (voor elk spel) ---------- */
const GEN_ACH = [
  { id: 'g_min10', n: 'Even blijven', e: '⏱️', d: '10 minuten gespeeld', pts: 1, test: (m, R) => R.play >= 600 },
  { id: 'g_min60', n: 'Een uurtje', e: '⌛', d: '1 uur gespeeld', pts: 1, test: (m, R) => R.play >= 3600 },
  { id: 'g_min300', n: 'Echte fan', e: '🕰️', d: '5 uur gespeeld', pts: 2, test: (m, R) => R.play >= 18000 },
  { id: 'g_ev5', n: 'Gelukzoeker', e: '🎈', d: '5 evenementen gepakt', pts: 1, test: (m, R) => R.evN >= 5 },
  { id: 'g_ev30', n: 'Evenementenjager', e: '🎪', d: '30 evenementen gepakt', pts: 2, test: (m, R) => R.evN >= 30 },
  { id: 'g_dq3', n: 'Drie dagen op rij', e: '📅', d: 'Opdrachten 3 dagen achter elkaar', pts: 1, test: (m, R) => R.dq.best >= 3 },
  { id: 'g_dq7', n: 'Een hele week', e: '🗓️', d: 'Opdrachten 7 dagen achter elkaar', pts: 2, test: (m, R) => R.dq.best >= 7 },
  { id: 'g_dqn20', n: 'Opdrachtenvriend', e: '✅', d: '20 opdrachten voltooid', pts: 2, test: (m, R) => R.dqN >= 20 },
  { id: 'g_seas3', n: 'Seizoensgast', e: '🍁', d: '3 verschillende seizoenen meegemaakt', pts: 2, test: (m, R) => R.seen.length >= 3 },
  { id: 'g_perk', n: 'Eerste voordeel', e: '🛍️', d: 'Een Legende-voordeel gekocht', pts: 1, test: (m, R) => Object.keys(R.perks).length >= 1 },
];

/* ---------- hulpjes ---------- */
const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const mul32 = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysBetween = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000);
export function fmtNum(n) {
  n = Math.floor(n || 0); const a = Math.abs(n);
  if (a < 10000) return String(n);
  const U = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx'];
  let i = 0, v = a; while (v >= 1000 && i < U.length - 1) { v /= 1000; i++; }
  return (n < 0 ? '-' : '') + (v < 100 ? v.toFixed(1).replace('.', ',').replace(',0', '') : Math.round(v)) + U[i];
}
const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

export function newR4() {
  return { v: R4_VERSION, ach: {}, pts: 0, tot: 0, perks: {}, play: 0, evN: 0, dqN: 0, giftN: 0, seen: [], ngSeen: 0, dq: { day: '', list: [], streak: 0, best: 0, last: '', bonus: 0 }, ev: { next: 150 }, upd: 0 };
}
export function sanitize(o) {
  const n = newR4();
  if (!o || typeof o !== 'object') return n;
  n.ach = {}; if (o.ach && typeof o.ach === 'object') for (const k of Object.keys(o.ach).slice(0, 300)) n.ach[String(k).slice(0, 24)] = 1;
  n.pts = Math.max(0, Math.floor(num(o.pts))); n.tot = Math.max(0, Math.floor(num(o.tot)));
  if (o.perks && typeof o.perks === 'object') for (const k of Object.keys(PERKS)) { const l = Math.floor(num(o.perks[k])); if (l > 0) n.perks[k] = Math.min(PERKS[k].max, l); }
  n.play = Math.max(0, num(o.play)); n.evN = Math.max(0, Math.floor(num(o.evN))); n.dqN = Math.max(0, Math.floor(num(o.dqN))); n.giftN = Math.max(0, Math.floor(num(o.giftN)));
  n.seen = Array.isArray(o.seen) ? o.seen.filter((x) => SEASONS.some((s) => s.id === x)).slice(0, 20) : [];
  n.ngSeen = Math.max(0, Math.floor(num(o.ngSeen)));
  const d = o.dq || {};
  n.dq = {
    day: typeof d.day === 'string' ? d.day.slice(0, 10) : '', streak: Math.max(0, Math.floor(num(d.streak))), best: Math.max(0, Math.floor(num(d.best))), last: typeof d.last === 'string' ? d.last.slice(0, 10) : '', bonus: d.bonus ? 1 : 0,
    list: Array.isArray(d.list) ? d.list.slice(0, 3).map((q) => ({ id: String(q.id || '').slice(0, 24), tier: Math.min(2, Math.max(0, Math.floor(num(q.tier)))), base: num(q.base), goal: Math.max(1, num(q.goal, 1)), cl: q.cl ? 1 : 0 })) : [],
  };
  n.ev = { next: Math.max(20, num(o.ev && o.ev.next, 150)) };
  n.upd = num(o.upd);
  return n;
}

/* =====================================================================
   ENGINE
   ===================================================================== */
// cfg: { game, name, ico, achs[], dailies[], events[], flavor{}, news[], metrics(), rate(), add(v), money?(), ng?{label,count(),can(),go()}, minGift }
// io:  { now(): Date, rng(): 0..1 }
export function createEngine(cfg, io = {}) {
  const now = io.now || (() => new Date());
  const rng = io.rng || Math.random;
  const R = newR4();
  const E = { cfg, R, t: 0, pending: null, active: null, mult: 1, season: seasonAt(now()), listeners: {}, qd: 0, achT: 0 };
  const ACHS = [...GEN_ACH, ...(cfg.achs || [])];
  const EVS = [...EVENTS, ...(cfg.events || [])];
  E.ACHS = ACHS; E.EVS = EVS;
  const emit = (k, a) => { for (const f of E.listeners[k] || []) { try { f(a); } catch { /* luisteraar mag niets breken */ } } };
  E.on = (k, f) => { (E.listeners[k] = E.listeners[k] || []).push(f); return () => { E.listeners[k] = E.listeners[k].filter((x) => x !== f); }; };
  const m = () => { try { return cfg.metrics() || {}; } catch { return {}; } };
  const rate = () => { try { return Math.max(0, num(cfg.rate())); } catch { return 0; } };
  const lvl = (k) => R.perks[k] || 0;
  E.perkLvl = lvl;
  E.rank = () => rankOf(R.tot);
  E.ngCount = () => { try { return cfg.ng ? Math.max(0, Math.floor(num(cfg.ng.count()))) : 0; } catch { return 0; } };
  E.baseMult = () => (1 + 0.05 * lvl('inc')) * E.season.mult * (1 + Math.min(0.6, 0.03 * E.ngCount())) * (1 + 0.01 * E.rank());
  E.multiplier = () => E.baseMult() * (E.active && E.active.kind === 'mult' ? E.active.mult : 1);
  E.giftMult = () => 1 + 0.2 * lvl('gift');
  E.giftAmount = (secs) => Math.max(num(cfg.minGift, 25), rate() * secs) * E.giftMult();
  const pay = (v) => { if (v > 0) { try { cfg.add(v); } catch { /* spel niet klaar */ } } return v; };

  /* --- sterren / rang --- */
  E.addStars = (n) => {
    if (!(n > 0)) return;
    const before = E.rank(); R.pts += n; R.tot += n;
    const after = E.rank(); if (after > before) emit('rank', { rank: after, info: RANKS[after] });
    emit('stars', { n });
  };

  /* --- seizoen --- */
  E.checkSeason = () => {
    const s = seasonAt(now());
    if (s.id !== E.season.id) { E.season = s; emit('season', { season: s, changed: true }); }
    if (!R.seen.includes(s.id)) { R.seen.push(s.id); emit('season', { season: s, first: true }); }
    return s;
  };

  /* --- prestaties --- */
  E.achProgress = (a) => { if (a.prog) { try { const [c, mx] = a.prog(m(), R); return [Math.min(c, mx), mx]; } catch { /* geen */ } } return null; };
  E.checkAch = () => {
    const mm = m(), got = [];
    for (const a of ACHS) {
      if (R.ach[a.id]) continue;
      let ok = false; try { ok = !!a.test(mm, R); } catch { ok = false; }
      if (!ok) continue;
      R.ach[a.id] = 1; const pts = a.pts || 1;
      const gold = pay(E.giftAmount(60 * pts));
      E.addStars(pts); got.push({ a, pts, gold }); emit('ach', { a, pts, gold });
    }
    return got;
  };

  /* --- dagelijkse opdrachten --- */
  const dailyPool = () => cfg.dailies || [];
  E.goalFor = (q, tier) => {
    const base = q.g ? q.g[tier] : 1;
    const sc = 1 + 0.12 * E.rank();
    if (q.secs) return Math.max(Math.round(base * 0.5), Math.round(Math.max(rate() * q.secs[tier], base)));
    return Math.max(1, Math.round(base * (q.noscale ? 1 : sc)));
  };
  E.ensureDaily = () => {
    const day = dayKey(now()), D = R.dq, pool = dailyPool();
    if (D.day === day && D.list.length) return false;
    if (!pool.length) return false;
    if (D.last && D.last !== day) { const gap = daysBetween(D.last, day); if (gap > 1) D.streak = 0; }
    const r = mul32(hashStr(cfg.game + day)); const mm = m();
    const idx = pool.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    D.day = day; D.bonus = 0;
    D.list = [0, 1, 2].map((tier, k) => { const q = pool[idx[k % pool.length]]; return { id: q.id, tier, base: num(mm[q.metric]), goal: E.goalFor(q, tier), cl: 0 }; });
    emit('daily', { fresh: true });
    return true;
  };
  E.dailyState = () => {
    const mm = m();
    return R.dq.list.map((s) => {
      const q = dailyPool().find((x) => x.id === s.id); if (!q) return null;
      let cur = num(mm[q.metric]) - s.base; if (cur < 0) { s.base = num(mm[q.metric]); cur = 0; }   // spel opnieuw begonnen
      return { slot: s, q, cur: Math.min(cur, s.goal), done: cur >= s.goal, claimed: !!s.cl, text: q.t(s.goal) };
    }).filter(Boolean);
  };
  E.claimDaily = (i) => {
    const st = E.dailyState()[i]; if (!st || !st.done || st.claimed) return null;
    const D = R.dq, day = dayKey(now());
    st.slot.cl = 1; R.dqN++;
    if (D.last !== day) { D.streak = D.last && daysBetween(D.last, day) === 1 ? D.streak + 1 : 1; D.last = day; D.best = Math.max(D.best, D.streak); }
    const secs = [120, 300, 600][st.slot.tier], streakB = 1 + Math.min(0.5, 0.1 * (D.streak - 1));
    const gold = pay(E.giftAmount(secs) * streakB);
    const stars = st.slot.tier === 2 ? 2 : 1; E.addStars(stars);
    let bonus = 0;
    if (!D.bonus && R.dq.list.every((s) => s.cl)) { D.bonus = 1; bonus = 2; E.addStars(2); pay(E.giftAmount(900)); }
    const out = { gold, stars, bonus, streak: D.streak }; emit('daily', { claimed: out }); return out;
  };

  /* --- evenementen --- */
  E.pickEvent = () => {
    const tot = EVS.reduce((s, e) => s + (e.w || 1), 0); let x = rng() * tot;
    for (const e of EVS) { x -= e.w || 1; if (x <= 0) return e; }
    return EVS[0];
  };
  E.spawn = (id) => {
    if (E.pending) return E.pending;
    const base = id ? EVS.find((e) => e.id === id) : E.pickEvent();
    E.pending = { ev: base || EVS[0], left: 40 }; emit('event', { spawn: E.pending }); return E.pending;
  };
  E.takeEvent = () => {
    const p = E.pending; if (!p) return null;
    E.pending = null; R.evN++;
    const ev = p.ev, longK = 1 + 0.15 * lvl('long'); let out = { ev };
    if (ev.kind === 'mult') { E.active = { id: ev.id, e: ev.e, n: ev.n, kind: 'mult', mult: ev.mult, left: ev.secs * longK, total: ev.secs * longK }; }
    else if (ev.kind === 'gift') { out.gold = pay(E.giftAmount(ev.secs)); R.giftN++; }
    else if (ev.kind === 'star') { E.addStars(ev.stars || 1); out.stars = ev.stars || 1; }
    if (ev.kind !== 'star' && rng() < 0.12 + 0.06 * lvl('luck')) { E.addStars(1); out.stars = (out.stars || 0) + 1; }
    R.ev.next = E.t + E.nextGap();
    emit('event', { took: out }); return out;
  };
  E.nextGap = () => (150 + rng() * 150) * Math.pow(0.9, lvl('evt'));
  // het seizoensevenement: elke keer als een nieuw seizoen begint krijg je meteen een bonus-evenement
  E.seasonBonus = () => {
    const s = E.season; E.pending = null;
    E.active = { id: 'season', e: s.e, n: s.n + '-bonus', kind: 'mult', mult: 1.5, left: 90 * (1 + 0.15 * lvl('long')), total: 90 * (1 + 0.15 * lvl('long')) };
    emit('event', { took: { ev: { e: s.e, n: s.n + '-bonus', d: s.tip } } });
  };

  /* --- perks --- */
  E.perkCost = (k) => PERKS[k].cost(lvl(k));
  E.buyPerk = (k) => {
    const P = PERKS[k]; if (!P || lvl(k) >= P.max) return false;
    const c = P.cost(lvl(k)); if (R.pts < c) return false;
    R.pts -= c; R.perks[k] = lvl(k) + 1; emit('perk', { k }); return true;
  };

  /* --- nieuw spel+ --- */
  E.checkNg = () => {
    const c = E.ngCount();
    if (c > R.ngSeen) { const n = c - R.ngSeen; R.ngSeen = c; E.addStars(3 * n); emit('ng', { n }); }
  };

  /* --- hoofdstap: dt seconden gespeeld --- */
  E.step = (dt) => {
    dt = Math.min(MAXDT, Math.max(0, dt)); if (!dt) return;
    E.t += dt; R.play += dt;
    E.qd += dt; E.achT += dt;
    if (E.qd >= 15) { E.qd = 0; E.checkSeason(); E.ensureDaily(); E.checkNg(); }
    // bonus-inkomen: het spel houdt zelf zijn basisinkomen bij, wij tellen het extra stukje erbij
    const mult = E.multiplier(); R4M.v = mult;
    if (mult > 1.0001) pay(rate() * (mult - 1) * dt);
    if (E.active) { E.active.left -= dt; if (E.active.left <= 0) { const a = E.active; E.active = null; emit('event', { ended: a }); } }
    if (E.pending) { E.pending.left -= dt; if (E.pending.left <= 0) { E.pending = null; R.ev.next = E.t + E.nextGap() * 0.6; emit('event', { missed: true }); } }
    else if (E.t >= R.ev.next && !E.active) E.spawn();
    if (E.achT >= 2) { E.achT = 0; E.checkAch(); }
  };
  E.start = () => { E.checkSeason(); E.ensureDaily(); E.checkNg(); E.checkAch(); R.ev.next = Math.min(Math.max(R.ev.next, E.t + 45), E.t + 300); };

  /* --- opslag --- */
  E.serialize = () => { R.upd = Date.now(); return JSON.stringify(R); };
  E.load = (str) => {
    let o = null; try { o = typeof str === 'string' ? JSON.parse(str) : str; } catch { o = null; }
    if (!o) return false; Object.assign(R, sanitize(o)); return true;
  };
  E.counts = () => ({ ach: Object.keys(R.ach).length, achMax: ACHS.length, dailyDone: R.dq.list.filter((s) => s.cl).length });
  return E;
}

/* =====================================================================
   OPSLAG (lokaal + wolk)
   ===================================================================== */
async function loadCloudDoc(db, game, uid) {
  try {
    const fs = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
    const sn = await fs.getDoc(fs.doc(db, 'gamesaves', `big-${game}-r4__${uid}`));
    if (!sn.exists()) return null;
    const d = sn.data() || {}; return typeof d.data === 'string' ? d.data : null;
  } catch { return null; }
}
async function saveCloudDoc(db, game, uid, data) {
  try {
    const fs = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
    await fs.setDoc(fs.doc(db, 'gamesaves', `big-${game}-r4__${uid}`), { game: `big-${game}-r4`, uid, data, updated: Date.now() });
    return true;
  } catch { return false; }
}
// kies de "grootste" voortgang bij twee opslagplekken
export const pickBetter = (a, b) => { if (!a) return b; if (!b) return a; const A = sanitize(JSON.parse(a)), B = sanitize(JSON.parse(b)); return (B.tot + B.play / 600) > (A.tot + A.play / 600) ? b : a; };

/* =====================================================================
   UI
   ===================================================================== */
const CSS = `
.r4-fab{position:fixed;left:8px;z-index:9000;width:52px;height:52px;border-radius:50%;border:0;padding:0;cursor:pointer;color:#fff;font:700 22px system-ui,sans-serif;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,0,0,.35);touch-action:none;-webkit-tap-highlight-color:transparent}
.r4-fab img.gfx-ic,.r4-fab .gfx-ei{width:30px;height:30px}
.r4-badge{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;border-radius:10px;background:#e63946;color:#fff;font:700 12px/20px system-ui;text-align:center;padding:0 5px;box-shadow:0 1px 4px rgba(0,0,0,.4)}
.r4-ring{position:absolute;inset:-3px;border-radius:50%;border:3px solid #ffd23f;animation:r4pulse 1.2s infinite;pointer-events:none}
@keyframes r4pulse{0%{transform:scale(1);opacity:1}100%{transform:scale(1.35);opacity:0}}
.r4-bubble{position:fixed;left:68px;z-index:9001;max-width:min(260px,calc(100vw - 90px));padding:10px 14px;border:0;border-radius:18px;background:#fff;color:#1e293b;font:600 15px/1.25 system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.4);cursor:pointer;text-align:left;min-height:44px;animation:r4pop .35s ease-out}
.r4-bubble small{display:block;font-weight:500;opacity:.7}
.r4-bubble i{display:block;height:4px;border-radius:2px;background:#ffd23f;margin-top:6px;transform-origin:left}
@keyframes r4pop{0%{transform:scale(.3);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
.r4-act{position:fixed;left:68px;z-index:9001;padding:6px 12px;border-radius:14px;background:rgba(20,20,40,.82);color:#fff;font:600 13px system-ui;pointer-events:none}
.r4-back{position:fixed;inset:0;z-index:100000;background:rgba(10,10,30,.62);display:flex;align-items:flex-end;justify-content:center}
@media(min-width:620px){.r4-back{align-items:center}}
.r4-panel{width:min(560px,100%);max-height:92vh;display:flex;flex-direction:column;background:var(--card,#fff);color:var(--ink,#1e293b);border-radius:22px 22px 0 0;overflow:hidden;font:16px/1.35 system-ui,sans-serif;box-shadow:0 -6px 30px rgba(0,0,0,.4)}
@media(min-width:620px){.r4-panel{border-radius:22px}}
.r4-head{position:relative;padding:14px 16px 10px;color:#fff;overflow:hidden}
.r4-head h2{margin:0;font-size:1.25em;position:relative}
.r4-head p{margin:2px 0 0;font-size:.85em;opacity:.92;position:relative}
.r4-x{position:absolute;right:8px;top:8px;width:44px;height:44px;border:0;border-radius:50%;background:rgba(255,255,255,.25);color:#fff;font-size:20px;cursor:pointer;z-index:2}
.r4-fall{position:absolute;top:-24px;font-size:20px;opacity:.85;animation:r4fall linear infinite;pointer-events:none}
@keyframes r4fall{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(130px) rotate(200deg);opacity:0}}
.r4-tabs{display:flex;gap:4px;padding:8px 8px 0;overflow-x:auto;border-bottom:1px solid rgba(128,128,128,.25)}
.r4-tab{flex:1 0 auto;min-height:44px;padding:6px 10px;border:0;border-radius:12px 12px 0 0;background:transparent;color:inherit;font:600 14px system-ui;cursor:pointer;opacity:.65;white-space:nowrap}
.r4-tab.on{opacity:1;background:rgba(128,128,128,.16)}
.r4-body{padding:12px 14px 18px;overflow:auto;-webkit-overflow-scrolling:touch}
.r4-card{border:1px solid rgba(128,128,128,.28);border-radius:14px;padding:10px 12px;margin:0 0 9px;background:rgba(128,128,128,.07)}
.r4-card h4{margin:0 0 3px;font-size:1em}
.r4-card small{opacity:.75}
.r4-row{display:flex;align-items:center;gap:10px}
.r4-row>.r4-grow{flex:1;min-width:0}
.r4-btn{min-height:44px;padding:8px 14px;border:0;border-radius:12px;background:#4f7cff;color:#fff;font:700 15px system-ui;cursor:pointer}
.r4-btn[disabled]{opacity:.4;cursor:default}
.r4-btn.gold{background:#f0a500;color:#2b1d00}
.r4-bar{height:8px;border-radius:4px;background:rgba(128,128,128,.25);overflow:hidden;margin-top:5px}
.r4-bar b{display:block;height:100%;background:#4cc27a;border-radius:4px}
.r4-ach{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.r4-ach>div{border:1px solid rgba(128,128,128,.28);border-radius:12px;padding:8px;text-align:center;background:rgba(128,128,128,.07)}
.r4-ach>div.no{opacity:.45;filter:grayscale(.8)}
.r4-ach .e{font-size:26px;display:block}
.r4-ach b{display:block;font-size:.88em}
.r4-ach small{font-size:.75em;opacity:.8;display:block}
.r4-pill{display:inline-block;padding:2px 9px;border-radius:10px;background:rgba(128,128,128,.2);font-size:.82em;font-weight:700}
.r4-toast{position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:100002;max-width:92vw;padding:10px 16px;border-radius:16px;background:#1e1e3a;color:#fff;font:600 15px system-ui;box-shadow:0 4px 20px rgba(0,0,0,.5);animation:r4pop .35s ease-out;pointer-events:none;text-align:center}
.r4-sea{position:fixed;inset:0;z-index:8999;pointer-events:none;overflow:hidden}
.r4-sea span{position:absolute;top:-30px;animation:r4sea linear forwards;font-size:24px}
@keyframes r4sea{0%{transform:translateY(0) rotate(0);opacity:0}10%{opacity:1}100%{transform:translateY(105vh) rotate(260deg);opacity:.2}}
@media(prefers-reduced-motion:reduce){.r4-fall,.r4-ring,.r4-sea span{animation:none!important}}
`;

export async function mount(ctx, cfg, opts = {}) {
  if (typeof document === 'undefined' || !ctx) return null;
  let BG = null; try { BG = await import('./big-gfx.js?v=1'); } catch { BG = null; }
  const uid = String(ctx.uid || (ctx.me && (ctx.me.uid || ctx.me.id)) || 'anon');
  const host = cfg.host || ctx.view || document.body;
  const E = createEngine(cfg);
  const lsKey = `big:r4:${cfg.game}:${uid}`;
  let local = null; try { local = localStorage.getItem(lsKey); } catch { /* geen opslag */ }
  if (local) E.load(local);
  let alive = true, panel = null, tab = 'nu', cloudAt = 0, dirty = false;
  const db = ctx.db;
  if (db) loadCloudDoc(db, cfg.game, uid).then((c) => { if (!alive || !c) return; try { const best = pickBetter(E.serialize(), c); if (best === c) { E.load(c); E.checkAch(); refresh(); } } catch { /* stil */ } });

  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const ico = (e, s) => (BG && BG.ico ? BG.ico(e, s) : e);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = cfg.fmt || fmtNum;
  const q = () => (BG && BG.GFX ? BG.GFX.q : 1), reduce = () => !!(BG && BG.GFX && BG.GFX.reduce);

  /* knop (verticaal versleepbaar, positie onthouden) */
  const fab = document.createElement('button'); fab.type = 'button'; fab.className = 'r4-fab'; fab.setAttribute('aria-label', 'Extra: seizoen, opdrachten en prestaties');
  let posKey = `big:r4:pos:${cfg.game}`, top = 0.4;
  try { top = Math.min(0.85, Math.max(0.12, parseFloat(localStorage.getItem(posKey)) || 0.4)); } catch { /* standaard */ }
  const setTop = () => { fab.style.top = Math.round(window.innerHeight * top) + 'px'; bubble.style.top = (parseInt(fab.style.top, 10) + 2) + 'px'; actEl.style.top = (parseInt(fab.style.top, 10) + 60) + 'px'; };
  const bubble = document.createElement('button'); bubble.type = 'button'; bubble.className = 'r4-bubble'; bubble.style.display = 'none';
  const actEl = document.createElement('div'); actEl.className = 'r4-act'; actEl.style.display = 'none';
  document.body.appendChild(fab); document.body.appendChild(bubble); document.body.appendChild(actEl);
  let drag = null;
  fab.addEventListener('pointerdown', (e) => { drag = { y: e.clientY, t: top, moved: false }; try { fab.setPointerCapture(e.pointerId); } catch { /* ok */ } });
  fab.addEventListener('pointermove', (e) => { if (!drag) return; const dy = e.clientY - drag.y; if (Math.abs(dy) > 8) drag.moved = true; if (drag.moved) { top = Math.min(0.85, Math.max(0.12, drag.t + dy / window.innerHeight)); setTop(); } });
  fab.addEventListener('pointerup', () => { if (!drag) return; const mv = drag.moved; drag = null; if (mv) { try { localStorage.setItem(posKey, String(top)); } catch { /* ok */ } } else openPanel(); });
  bubble.addEventListener('click', () => takeEvent());

  function toast(msg, ms = 3200) {
    const t = document.createElement('div'); t.className = 'r4-toast'; t.innerHTML = msg; document.body.appendChild(t);
    if (BG && BG.iconify) { try { BG.iconify(t); } catch { /* ok */ } }
    setTimeout(() => { try { t.remove(); } catch { /* weg */ } }, ms);
  }
  function seasonRain(s) {
    if (reduce()) return;
    const box = document.createElement('div'); box.className = 'r4-sea';
    const n = [10, 18, 28][q()] || 14;
    for (let i = 0; i < n; i++) { const sp = document.createElement('span'); sp.textContent = s.fall[i % s.fall.length]; sp.style.left = (Math.random() * 96) + '%'; sp.style.animationDuration = (3.5 + Math.random() * 3) + 's'; sp.style.animationDelay = (Math.random() * 2.5) + 's'; sp.style.fontSize = (18 + Math.random() * 16) + 'px'; box.appendChild(sp); }
    document.body.appendChild(box); setTimeout(() => { try { box.remove(); } catch { /* weg */ } }, 9500);
  }
  const scene = (kind, o) => { try { if (BG) BG.milestone(host, kind, o); } catch { /* geen scene */ } };

  function takeEvent() {
    const out = E.takeEvent(); if (!out) return;
    const ev = out.ev; let msg = `${ev.e} <b>${esc(ev.n)}</b>`;
    if (out.gold) msg += `<br>+${fmt(out.gold)} ${cfg.cur || ''}`;
    if (ev.kind === 'mult') msg += `<br>${esc(ev.d)}`;
    if (out.stars) msg += `<br>⭐ +${out.stars} Legende-ster${out.stars > 1 ? 'ren' : ''}`;
    toast(msg); scene(ev.id === 'jack' ? 'chest-open' : 'coins-rain', { title: ev.n, sub: out.gold ? '+' + fmt(out.gold) : '' });
    dirty = true; refresh(); save();
  }
  E.on('event', (x) => { if (x.spawn) showBubble(); else if (x.missed || x.ended) { hideBubble(); refresh(); } });
  E.on('ach', ({ a, pts, gold }) => { toast(`${a.e} <b>Prestatie: ${esc(a.n)}</b><br><small>+${pts} ⭐ · +${fmt(gold)} ${cfg.cur || ''}</small>`, 3800); scene('new-record', { title: 'Prestatie!', sub: a.n, icon: 'trophy' }); dirty = true; refresh(); });
  E.on('rank', ({ info }) => { setTimeout(() => { toast(`${info.e} <b>Nieuwe rang: ${info.n}!</b>`, 4200); scene('victory', { title: 'Rang: ' + info.n, sub: 'Legende-rang omhoog', force: true }); }, 1800); });
  E.on('ng', ({ n }) => { toast(`🔄 <b>Nieuw spel+ bonus!</b><br>+${3 * n} ⭐`, 4200); });
  E.on('daily', (x) => { if (x.claimed) { const c = x.claimed; scene('daily-bonus', { title: 'Opdracht klaar!', sub: `+${fmt(c.gold)} · ${c.streak} dagen op rij`, force: true }); } dirty = true; refresh(); });
  E.on('season', (x) => {
    if (!x.first) return;
    const s = x.season, key = `r4:${cfg.game}:${s.id}:${new Date().getFullYear()}`;
    let seen = false; try { seen = !!localStorage.getItem('big:r4s:' + key); localStorage.setItem('big:r4s:' + key, '1'); } catch { /* ok */ }
    if (seen) return;
    setTimeout(() => {
      if (!alive) return;
      seasonRain(s);
      try { if (BG) BG.intro(host, key, s.scene, { title: s.n, sub: s.tip, force: true }); } catch { /* geen intro */ }
      E.seasonBonus(); toast(`${s.e} <b>${esc(s.n)} is begonnen!</b><br><small>${esc(s.tip)} Bonus: +${Math.round((s.mult - 1) * 100)}% inkomen</small>`, 5200);
    }, 6500);
  });

  function showBubble() {
    const p = E.pending; if (!p) return;
    bubble.innerHTML = `${ico(p.ev.e, 24)} <b>${esc(p.ev.n)}</b><small>Tik snel om te pakken!</small><i></i>`;
    bubble.style.display = ''; bubble.querySelector('i').style.width = '100%';
    if (BG && BG.iconify) { try { BG.iconify(bubble); } catch { /* ok */ } }
    setTop(); refreshFab();
  }
  function hideBubble() { bubble.style.display = 'none'; refreshFab(); }

  function claimable() { return E.dailyState().filter((s) => s.done && !s.claimed).length; }
  function refreshFab() {
    const s = E.season, c = claimable();
    const html = `${ico(s.e, 30)}${c ? `<span class="r4-badge">${c}</span>` : ''}${E.pending ? '<span class="r4-ring"></span>' : ''}`;
    if (fab.__h !== html) { fab.__h = html; fab.innerHTML = html; if (BG && BG.iconify) { try { BG.iconify(fab); } catch { /* ok */ } } }
    fab.style.background = `linear-gradient(135deg, ${s.col}, #1e1e3a)`;
    if (E.active) { actEl.style.display = ''; actEl.textContent = `${E.active.e} ×${E.active.mult} nog ${Math.ceil(E.active.left)}s`; } else actEl.style.display = 'none';
  }

  /* paneel */
  function bar(c, mx) { return `<div class="r4-bar"><b style="width:${Math.round(100 * Math.min(1, c / Math.max(1, mx)))}%"></b></div>`; }
  function viewNu() {
    const s = E.season, R = E.R, rk = RANKS[E.rank()], next = RANKS[E.rank() + 1];
    const fl = (cfg.flavor && cfg.flavor[s.id]) || s.tip;
    let h = `<div class="r4-card"><div class="r4-row"><span style="font-size:34px">${s.e}</span><div class="r4-grow"><h4>${esc(s.n)} <span class="r4-pill">+${Math.round((s.mult - 1) * 100)}% inkomen</span></h4><small>${esc(fl)}</small></div></div></div>`;
    h += `<div class="r4-card"><div class="r4-row"><span style="font-size:30px">${rk.e}</span><div class="r4-grow"><h4>Rang: ${rk.n} · ⭐ ${R.pts}</h4><small>Totaal ${R.tot} sterren${next ? ` · volgende rang bij ${next.at}` : ' · hoogste rang!'}</small>${next ? bar(R.tot - rk.at, next.at - rk.at) : ''}</div></div></div>`;
    h += `<div class="r4-card"><h4>Je totale bonus: ×${E.multiplier().toFixed(2).replace('.', ',')}</h4><small>Seizoen ×${s.mult.toFixed(2).replace('.', ',')} · Gouden handen +${5 * E.perkLvl('inc')}% · Rang +${E.rank()}%${E.ngCount() ? ` · Nieuw spel+ +${Math.round(Math.min(60, 3 * E.ngCount()))}%` : ''}</small></div>`;
    if (E.active) h += `<div class="r4-card"><h4>${E.active.e} ${esc(E.active.n)} actief!</h4><small>×${E.active.mult} inkomen, nog ${Math.ceil(E.active.left)} seconden</small>${bar(E.active.left, E.active.total)}</div>`;
    else if (E.pending) h += `<div class="r4-card"><h4>${E.pending.ev.e} ${esc(E.pending.ev.n)}!</h4><small>${esc(E.pending.ev.d)}</small><br><button class="r4-btn gold" data-a="take" style="margin-top:6px">Pakken!</button></div>`;
    else h += `<div class="r4-card"><h4>🎈 Evenementen</h4><small>Zo nu en dan verschijnt er een bel naast de knop. Tik snel om een bonus te pakken!</small></div>`;
    const ds = E.dailyState(); const open = ds.filter((d) => !d.claimed).length;
    h += `<div class="r4-card"><div class="r4-row"><div class="r4-grow"><h4>📅 Dagopdrachten: ${ds.length - open}/${ds.length} klaar</h4><small>Reeks: ${R.dq.streak} ${R.dq.streak === 1 ? 'dag' : 'dagen'} op rij (beste ${R.dq.best})</small></div><button class="r4-btn" data-a="tab" data-v="dag">Bekijk</button></div></div>`;
    return h;
  }
  function viewDag() {
    const ds = E.dailyState(), R = E.R; const names = ['Makkelijk', 'Gemiddeld', 'Uitdaging'];
    let h = `<p style="margin:0 0 8px"><small>Elke dag nieuwe opdrachten. Alle drie? Dan krijg je een bonus! Reeks: <b>${R.dq.streak}</b> ${R.dq.streak === 1 ? 'dag' : 'dagen'} (+${Math.min(50, 10 * Math.max(0, R.dq.streak - 1))}% beloning).</small></p>`;
    ds.forEach((d, i) => {
      h += `<div class="r4-card"><div class="r4-row"><span style="font-size:28px">${d.q.e}</span><div class="r4-grow"><h4>${esc(d.text)} <span class="r4-pill">${names[d.slot.tier]}</span></h4><small>${fmt(d.cur)} / ${fmt(d.slot.goal)} · beloning ${d.slot.tier === 2 ? '2' : '1'} ⭐ + geld</small>${bar(d.cur, d.slot.goal)}</div>
        <button class="r4-btn ${d.done && !d.claimed ? 'gold' : ''}" data-a="claim" data-i="${i}" ${d.done && !d.claimed ? '' : 'disabled'}>${d.claimed ? 'Gehaald' : d.done ? 'Pak!' : 'Bezig'}</button></div></div>`;
    });
    if (R.dq.bonus) h += `<div class="r4-card"><h4>🎉 Alles gehaald vandaag!</h4><small>Bonus is al uitgekeerd. Tot morgen!</small></div>`;
    return h;
  }
  function viewAch() {
    const R = E.R; const c = E.counts();
    let h = `<p style="margin:0 0 8px"><b>${c.ach}</b> van <b>${c.achMax}</b> prestaties</p><div class="r4-ach">`;
    for (const a of E.ACHS) {
      const got = !!R.ach[a.id], pr = got ? null : E.achProgress(a);
      h += `<div class="${got ? '' : 'no'}"><span class="e">${a.e}</span><b>${esc(a.n)}</b><small>${esc(a.d)}</small>${pr ? bar(pr[0], pr[1]) : ''}<small>${got ? '✔ ' : ''}${a.pts || 1} ⭐</small></div>`;
    }
    return h + '</div>';
  }
  function viewLeg() {
    const R = E.R, rk = RANKS[E.rank()];
    let h = `<div class="r4-card"><div class="r4-row"><span style="font-size:34px">${rk.e}</span><div class="r4-grow"><h4>${rk.n}</h4><small>Je hebt <b>${R.pts}</b> ⭐ om uit te geven. Sterren verdien je met prestaties, opdrachten en evenementen. Je voordelen blijven altijd.</small></div></div></div>`;
    for (const k of Object.keys(PERKS)) {
      const P = PERKS[k], l = E.perkLvl(k), maxed = l >= P.max, c = P.cost(l);
      h += `<div class="r4-card"><div class="r4-row"><span style="font-size:26px">${P.e}</span><div class="r4-grow"><h4>${P.n} <span class="r4-pill">${l}/${P.max}</span></h4><small>${P.d}</small></div><button class="r4-btn" data-a="perk" data-k="${k}" ${maxed || R.pts < c ? 'disabled' : ''}>${maxed ? 'Max' : c + ' ⭐'}</button></div></div>`;
    }
    if (cfg.ng) {
      let can = false; try { can = !!cfg.ng.can(); } catch { can = false; }
      h += `<div class="r4-card"><h4>🔄 ${esc(cfg.ng.label || 'Nieuw spel+')}</h4><small>${esc(cfg.ng.desc || 'Begin opnieuw met permanente voordelen.')} Je hebt dit al <b>${E.ngCount()}</b> keer gedaan: dat geeft +${Math.round(Math.min(60, 3 * E.ngCount()))}% inkomen en bij elke nieuwe start 3 ⭐ extra.</small><br><small>${can ? 'Je kunt nu opnieuw beginnen in het menu van het spel (Meer / Prestige).' : esc(cfg.ng.need || 'Speel verder om dit vrij te spelen.')}</small></div>`;
    }
    return h;
  }
  function viewNew() {
    const news = cfg.news || [];
    return `<p style="margin:0 0 8px"><small>Nieuw in dit spel:</small></p>` + news.map((n) => `<div class="r4-card"><div class="r4-row"><span style="font-size:26px">${n.e}</span><div class="r4-grow"><h4>${esc(n.t)}</h4><small>${esc(n.d)}</small></div></div></div>`).join('');
  }
  const TABS = [['nu', '✨ Nu'], ['dag', '📅 Opdrachten'], ['ach', '🏆 Prestaties'], ['leg', '👑 Legende'], ['new', '🆕 Nieuw']];
  function refresh() {
    refreshFab();
    if (!panel) return;
    const body = panel.querySelector('.r4-body'), s = E.season;
    const head = panel.querySelector('.r4-head'); head.style.background = `linear-gradient(135deg, ${s.col}, #1e1e3a)`;
    panel.querySelectorAll('.r4-tab').forEach((b) => b.classList.toggle('on', b.dataset.v === tab));
    const html = tab === 'nu' ? viewNu() : tab === 'dag' ? viewDag() : tab === 'ach' ? viewAch() : tab === 'leg' ? viewLeg() : viewNew();
    if (body.__h !== html) { const sc = body.scrollTop; body.__h = html; body.innerHTML = html; body.scrollTop = sc; if (BG && BG.iconify) { try { BG.iconify(body); } catch { /* ok */ } } }
  }
  function openPanel() {
    if (panel) return;
    const s = E.season;
    const back = document.createElement('div'); back.className = 'r4-back';
    const falls = reduce() ? '' : Array.from({ length: [4, 8, 12][q()] || 6 }, (_, i) => `<span class="r4-fall" style="left:${(i * 37 + 8) % 92}%;animation-duration:${3 + (i % 4)}s;animation-delay:${(i % 5) * 0.6}s">${s.fall[i % s.fall.length]}</span>`).join('');
    back.innerHTML = `<div class="r4-panel" role="dialog" aria-label="${esc(cfg.name)} extra"><div class="r4-head">${falls}<button class="r4-x" aria-label="Sluiten">✕</button><h2>${s.e} ${esc(cfg.name)}: ${esc(s.n)}</h2><p>${esc(s.tip)}</p></div>
      <div class="r4-tabs">${TABS.map(([v, l]) => `<button class="r4-tab" data-v="${v}">${l}</button>`).join('')}</div><div class="r4-body"></div></div>`;
    document.body.appendChild(back); panel = back;
    back.addEventListener('pointerdown', (e) => { if (e.target === back) closePanel(); });
    back.addEventListener('click', (e) => {
      const t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
      if (t.classList.contains('r4-x')) return closePanel();
      if (t.classList.contains('r4-tab')) { tab = t.dataset.v; return refresh(); }
      const a = t.dataset.a; if (!a) return;
      if (a === 'tab') { tab = t.dataset.v; refresh(); } else if (a === 'take') takeEvent();
      else if (a === 'claim') { const o = E.claimDaily(+t.dataset.i); if (o) { toast(`✅ <b>Opdracht klaar!</b><br>+${fmt(o.gold)} ${cfg.cur || ''} · ⭐ +${o.stars}${o.bonus ? ' · bonus ⭐ +' + o.bonus : ''}`); save(); } }
      else if (a === 'perk') { if (E.buyPerk(t.dataset.k)) { toast(`${PERKS[t.dataset.k].e} <b>${PERKS[t.dataset.k].n}</b> niveau ${E.perkLvl(t.dataset.k)}!`); save(); } }
      refresh();
    });
    if (BG && BG.iconify) { try { BG.iconify(back); } catch { /* ok */ } }
    refresh();
  }
  function closePanel() { if (panel) { try { panel.remove(); } catch { /* weg */ } panel = null; } }

  /* opslaan en tikken */
  function save(force) {
    try { localStorage.setItem(lsKey, E.serialize()); } catch { /* geen opslag */ }
    const t = Date.now();
    if (db && (force || t - cloudAt > 90000)) { cloudAt = t; saveCloudDoc(db, cfg.game, uid, E.serialize()); }
    dirty = false;
  }
  setTop(); E.start(); refreshFab();
  let last = Date.now(), sec = 0;
  const timer = setInterval(() => {
    const t = Date.now(), dt = Math.min(MAXDT, (t - last) / 1000); last = t;
    if (typeof document !== 'undefined' && document.hidden) return;
    E.step(dt); sec += dt;
    if (E.pending && bubble.style.display !== 'none') { const i = bubble.querySelector('i'); if (i) i.style.width = Math.max(0, E.pending.left / 40 * 100) + '%'; }
    if (sec >= 1) { sec = 0; refreshFab(); if (panel && (tab === 'nu' || tab === 'dag')) refresh(); }
    if (dirty || sec === 0 && Math.random() < 0.05) save();
  }, 500);
  const onResize = () => setTop(); window.addEventListener('resize', onResize);
  const onHide = () => save(true); window.addEventListener('pagehide', onHide);
  const destroy = () => {
    if (!alive) return; alive = false; clearInterval(timer); save(true); closePanel();
    window.removeEventListener('resize', onResize); window.removeEventListener('pagehide', onHide);
    for (const el of [fab, bubble, actEl, st]) { try { el.remove(); } catch { /* weg */ } }
  };
  if (ctx.addCleanup) ctx.addCleanup(destroy);
  return { engine: E, destroy, open: openPanel };
}
