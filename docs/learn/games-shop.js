// Learn Spel – winkel, uiterlijk, prestaties en pure hub-logica (beloning, opslag, samenvoegen).
// Hulpbestand van games.js. Pure functies zijn geëxporteerd voor tests (tools/test-learn-hub.mjs).
import { Profile, esc, fmt } from './core.js?v=1';

export const LV_NAMES = ['', 'Makkelijk', 'Normaal', 'Moeilijk'];
export const LV_MULT = [0, 0.8, 1, 1.3];

/* ---------- uiterlijk-catalogus: [id, naam, prijs, vanaf level] ---------- */
export const AVATARS = [
  ['🙂', 'Smiley', 0, 1], ['😎', 'Coole bril', 0, 1], ['🦊', 'Vos', 0, 1], ['🐼', 'Panda', 0, 1],
  ['🐱', 'Kat', 40, 1], ['🐶', 'Hond', 40, 1], ['🐝', 'Bij', 70, 1], ['🐸', 'Kikker', 60, 1], ['🐵', 'Aapje', 60, 1],
  ['🐰', 'Konijn', 80, 1], ['🐻', 'Beer', 100, 2], ['🐨', 'Koala', 80, 2], ['🐢', 'Schildpad', 90, 2], ['🦔', 'Egel', 90, 2],
  ['🐧', 'Pinguïn', 100, 2], ['🦁', 'Leeuw', 120, 2], ['🐯', 'Tijger', 120, 2], ['🦥', 'Luiaard', 110, 3], ['🦩', 'Flamingo', 130, 3],
  ['🦋', 'Vlinder', 140, 3], ['🦉', 'Uil', 150, 3], ['🦒', 'Giraf', 150, 4], ['🐬', 'Dolfijn', 170, 4], ['👻', 'Spook', 150, 4],
  ['🐙', 'Octopus', 160, 4], ['🦈', 'Haai', 180, 4], ['🐘', 'Olifant', 190, 5], ['🐺', 'Wolf', 200, 5], ['🦄', 'Eenhoorn', 200, 5],
  ['🤖', 'Robot', 220, 5], ['👽', 'Alien', 240, 6], ['🦅', 'Adelaar', 260, 6], ['🥷', 'Ninja', 300, 7], ['🧙', 'Tovenaar', 320, 8],
  ['🧑‍🚀', 'Astronaut', 350, 9], ['🦸', 'Superheld', 380, 10], ['🧜', 'Zeemeermin', 400, 11], ['🧞', 'Geest', 420, 12],
  ['🦖', 'Dino', 450, 12], ['🐲', 'Draak', 500, 13],
];
export const HATS = [
  ['', 'Geen hoed', 0, 1], ['🧢', 'Pet', 40, 1], ['🎀', 'Strik', 45, 1], ['🎩', 'Hoge hoed', 50, 1], ['👒', 'Strohoed', 60, 1],
  ['⛑️', 'Reddingshelm', 70, 2], ['🎓', 'Studiehoed', 80, 2], ['🪖', 'Helm', 90, 2], ['🕶️', 'Zonnebril', 100, 2], ['✨', 'Glitter', 110, 3],
  ['🎧', 'Koptelefoon', 120, 3], ['🍕', 'Pizza-hoed', 130, 3], ['🎅', 'Kerstmuts', 140, 3], ['🌟', 'Ster', 150, 4], ['🥇', 'Gouden medaille', 200, 5],
  ['🌈', 'Regenboog', 220, 6], ['🪄', 'Toverstaf', 250, 8], ['🪐', 'Planeet', 280, 9], ['👑', 'Kroon', 300, 10], ['🔥', 'Vuur', 350, 12], ['💎', 'Diamant', 500, 15],
];
export const BGS = [
  ['sky', 'Luchtblauw', 0, 1, 'linear-gradient(135deg,#60a5fa,#38bdf8)'],
  ['mint', 'Munt', 0, 1, 'linear-gradient(135deg,#34d399,#2dd4bf)'],
  ['sunset', 'Zonsondergang', 25, 1, 'linear-gradient(135deg,#fb923c,#f43f5e)'],
  ['candy', 'Snoep', 30, 1, 'linear-gradient(135deg,#f9a8d4,#c4b5fd)'],
  ['sand', 'Zand', 30, 1, 'linear-gradient(135deg,#fde68a,#fdba74)'],
  ['forest', 'Bos', 45, 2, 'linear-gradient(135deg,#22c55e,#166534)'],
  ['ocean', 'Oceaan', 50, 2, 'linear-gradient(135deg,#0ea5e9,#1e3a8a)'],
  ['berry', 'Bessen', 60, 2, 'linear-gradient(135deg,#d946ef,#7e22ce)'],
  ['ice', 'IJs', 70, 3, 'linear-gradient(135deg,#e0f2fe,#7dd3fc)'],
  ['night', 'Nacht', 80, 3, 'linear-gradient(135deg,#1e1b4b,#4338ca)'],
  ['lava', 'Lava', 100, 4, 'linear-gradient(135deg,#facc15,#dc2626,#7f1d1d)'],
  ['neon', 'Neon', 120, 5, 'linear-gradient(135deg,#22d3ee,#a3e635)'],
  ['aurora', 'Poollicht', 150, 6, 'linear-gradient(135deg,#34d399,#6366f1,#ec4899)'],
  ['gold', 'Goud', 200, 8, 'linear-gradient(135deg,#fde047,#d97706)'],
  ['galaxy', 'Sterrenstelsel', 260, 10, 'radial-gradient(circle at 30% 30%,#a78bfa,#1e1b4b 70%)'],
  ['rainbow', 'Regenboog', 400, 12, 'linear-gradient(135deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#8b5cf6)'],
];
export const KINDS = { av: AVATARS, hat: HATS, bg: BGS };
const CK = { av: 'avatar', hat: 'hat', bg: 'bg' };
// Als core.js een eigen uiterlijk-catalogus heeft (Profile.COSMETICS), gebruiken we die zodat Study en Spel hetzelfde zien.
// Anders valt de hub terug op de eigen catalogus hierboven. Item = [id, naam, prijs, vanaf-level].
function coreCos(kind) { try { return Profile.COSMETICS && Profile.COSMETICS[CK[kind]]; } catch { return null; } }
export function catalog(kind) {
  const c = coreCos(kind);
  if (!c) return KINDS[kind] || [];
  const mine = new Map((KINDS[kind] || []).map((x) => [x[0], x[1]]));
  return c.map((x) => [x.id, mine.get(x.id) || (x.name && x.name !== x.id ? x.name : (kind === 'hat' && !x.id ? 'Geen hoed' : (kind === 'av' ? '' : x.name || x.id))), x.cost | 0, 1]);
}
const catItem = (kind, id) => catalog(kind).find((x) => x[0] === id);
function isOwned(kind, id, price, d) {
  if (price === 0) return true;
  try { if (coreCos(kind) && Profile.owns) return !!Profile.owns(CK[kind], id); } catch {}
  return d.own[kind].includes(id);
}

export function bgCss(id) {
  try { if (coreCos('bg') && Profile.bgCss && coreCos('bg').some((x) => x.id === id)) return Profile.bgCss(id); } catch {}
  const b = BGS.find((x) => x[0] === id);
  if (b) return b[4];
  if (typeof id === 'string' && /^(#|linear|radial|rgb|hsl)/.test(id)) return id;
  return BGS[0][4];
}
export function avatarHTML(av, size = 56) {
  av = av || {};
  const s = size, fs = Math.round(s * 0.58), hs = Math.round(s * 0.34);
  return `<span class="lsp-av" style="width:${s}px;height:${s}px;background:${bgCss(av.bg)}"><span class="lsp-av-e" style="font-size:${fs}px">${esc(av.emoji || '🙂')}</span>${av.hat ? `<span class="lsp-av-h" style="font-size:${hs}px;top:${-Math.round(hs * 0.45)}px">${esc(av.hat)}</span>` : ''}</span>`;
}

/* ---------- hub-opslag (eigen deel naast Profile) ---------- */
export function defaultHub() {
  return {
    v: 1, t: 0, own: { av: [], hat: [], bg: [] }, best: {}, played: {}, last: [], fav: [], kits: {},
    lastKit: '', level: 2, types: [], ach: {},
    stats: { games: 0, wins: 0, correct: 0, wrong: 0, answers: 0, bestStreak: 0, perfect: 0, hard: 0, hardWins: 0, duels: 0, duelWins: 0, coinsEarned: 0, claimed: 0, upBuys: 0 },
  };
}
export function normHub(x) {
  const d = defaultHub();
  if (!x || typeof x !== 'object') return d;
  for (const k of ['own', 'best', 'played', 'kits', 'ach', 'stats']) if (x[k] && typeof x[k] === 'object') Object.assign(d[k], x[k]);
  for (const k of ['av', 'hat', 'bg']) if (!Array.isArray(d.own[k])) d.own[k] = [];
  for (const k of ['last', 'fav', 'types']) if (Array.isArray(x[k])) d[k] = x[k].filter((v) => typeof v === 'string').slice(0, 40);
  if (typeof x.lastKit === 'string') d.lastKit = x.lastKit;
  if ([1, 2, 3].includes(x.level)) d.level = x.level;
  d.t = +x.t || 0;
  return d;
}
// Samenvoegen van lokaal en cloud (union / max): verliest nooit iets.
export function mergeHub(a, b) {
  a = normHub(a); b = normHub(b);
  const newer = a.t >= b.t ? a : b, older = newer === a ? b : a;
  const o = defaultHub();
  o.t = Math.max(a.t, b.t);
  for (const k of ['av', 'hat', 'bg']) o.own[k] = [...new Set([...a.own[k], ...b.own[k]])];
  for (const id of new Set([...Object.keys(a.best), ...Object.keys(b.best)])) {
    const x = a.best[id], y = b.best[id];
    o.best[id] = !x ? y : !y ? x : (x.score >= y.score ? x : y);
  }
  for (const k of new Set([...Object.keys(a.played), ...Object.keys(b.played)])) o.played[k] = Math.max(a.played[k] || 0, b.played[k] || 0);
  for (const k of new Set([...Object.keys(a.kits), ...Object.keys(b.kits)])) o.kits[k] = 1;
  for (const k of new Set([...Object.keys(a.ach), ...Object.keys(b.ach)])) o.ach[k] = Math.min(a.ach[k] || Infinity, b.ach[k] || Infinity);
  for (const k of Object.keys(o.stats)) o.stats[k] = Math.max(a.stats[k] || 0, b.stats[k] || 0);
  o.last = newer.last.length ? newer.last : older.last;
  o.fav = [...new Set([...newer.fav, ...older.fav])];
  o.lastKit = newer.lastKit || older.lastKit; o.level = newer.level; o.types = newer.types;
  return o;
}

/* ---------- beloning ---------- */
export function calcReward(r, fx = {}) {
  const correct = Math.min(80, Math.max(0, r.correct | 0)), wrong = Math.max(0, r.wrong | 0);
  const lm = LV_MULT[r.level] || 1;
  if (!correct && !wrong) return { coins: 0, xp: 0 };
  const baseC = correct * 2 + (r.win === true ? 10 : 0) + (r.newRecord ? 5 : 0) + (!wrong && correct >= 5 ? 5 : 0);
  const baseX = correct * 3 + Math.min(wrong, 20) + (r.win === true ? 10 : 0) + 5;
  const coins = correct > 0 ? Math.max(1, Math.round(baseC * lm * (fx.coinMult || 1))) + Math.round(fx.coinBonus || 0) : 0;
  const xp = Math.max(1, Math.round(baseX * lm * (fx.xpMult || 1)));
  return { coins, xp };
}
export function levelReward(level) { return 10 + 3 * level + (level % 5 === 0 ? 25 : 0); }

export function displayAnswer(q) {
  if (!q) return '';
  const a = q.a;
  switch (q.t) {
    case 'tf': return a ? 'Waar' : 'Onwaar';
    case 'order': return Array.isArray(a) ? a.join(' → ') : String(a);
    case 'match': return Array.isArray(a) ? a.map((p) => (Array.isArray(p) ? p.join(' = ') : p)).join(' · ') : String(a);
    case 'multi': return Array.isArray(a) ? a.join(', ') : String(a);
    default: return String(a == null ? '' : a);
  }
}

// Verwerk een spelresultaat in de hub-data. Geeft { newRecord, prevBest } terug.
export function applyResult(d, r, now = Date.now()) {
  const s = d.stats;
  s.games++; if (r.win === true) s.wins++;
  s.correct += r.correct | 0; s.wrong += r.wrong | 0; s.answers += (r.correct | 0) + (r.wrong | 0);
  s.bestStreak = Math.max(s.bestStreak, r.bestStreak | 0);
  if (!r.wrong && r.correct >= 8) s.perfect++;
  if (r.level === 3) { s.hard++; if (r.win === true) s.hardWins++; }
  if (r.coins) s.coinsEarned += r.coins;
  d.played[r.game] = (d.played[r.game] || 0) + 1;
  if (r.kitId && !String(r.kitId).startsWith('duel-')) d.kits[r.kitId] = 1;
  d.last = [r.game, ...d.last.filter((x) => x !== r.game)].slice(0, 6);
  const prev = d.best[r.game];
  const score = +r.score || 0;
  const newRecord = score > 0 && (!prev || score > prev.score);
  if (newRecord) d.best[r.game] = { score, kit: r.kitName || '', level: r.level, t: now };
  d.t = now;
  return { newRecord, prevBest: prev ? prev.score : 0 };
}

/* ---------- prestaties van de hub (minstens 30) ---------- */
const A = (id, emoji, name, desc, reward, prog) => ({ id, emoji, name, desc, reward, prog });
const stat = (k) => (s) => s.stats[k] || 0;
export const HUB_ACH = [
  A('h-g1', '🎮', 'Eerste keer', 'Speel je eerste spel.', 10, (s) => [s.stats.games, 1]),
  A('h-g10', '🕹️', 'Op dreef', 'Speel 10 spellen.', 20, (s) => [s.stats.games, 10]),
  A('h-g50', '🎯', 'Vaste speler', 'Speel 50 spellen.', 50, (s) => [s.stats.games, 50]),
  A('h-g100', '🏟️', 'Spelletjes-fan', 'Speel 100 spellen.', 100, (s) => [s.stats.games, 100]),
  A('h-g250', '🌍', 'Leergame-legende', 'Speel 250 spellen.', 250, (s) => [s.stats.games, 250]),
  A('h-w1', '🏆', 'Winnaar', 'Win een spel.', 15, (s) => [s.stats.wins, 1]),
  A('h-w10', '🥇', 'Tien keer top', 'Win 10 spellen.', 50, (s) => [s.stats.wins, 10]),
  A('h-w50', '👑', 'Kampioen', 'Win 50 spellen.', 150, (s) => [s.stats.wins, 50]),
  A('h-c50', '✅', '50 goed', 'Geef 50 goede antwoorden in spellen.', 15, (s) => [s.stats.correct, 50]),
  A('h-c250', '📗', '250 goed', 'Geef 250 goede antwoorden.', 40, (s) => [s.stats.correct, 250]),
  A('h-c1000', '📚', '1000 goed', 'Geef 1000 goede antwoorden.', 120, (s) => [s.stats.correct, 1000]),
  A('h-c5000', '🎓', 'Professor', 'Geef 5000 goede antwoorden.', 400, (s) => [s.stats.correct, 5000]),
  A('h-s5', '🔥', 'Reeks van 5', 'Beantwoord 5 vragen achter elkaar goed.', 10, (s) => [s.stats.bestStreak, 5]),
  A('h-s10', '⚡', 'Reeks van 10', '10 goed achter elkaar.', 25, (s) => [s.stats.bestStreak, 10]),
  A('h-s20', '🚀', 'Reeks van 20', '20 goed achter elkaar.', 60, (s) => [s.stats.bestStreak, 20]),
  A('h-s50', '☄️', 'Onstopbaar', '50 goed achter elkaar.', 200, (s) => [s.stats.bestStreak, 50]),
  A('h-p1', '💯', 'Foutloos', 'Speel een spel met minstens 8 goede en 0 foute antwoorden.', 30, (s) => [s.stats.perfect, 1]),
  A('h-p5', '🌟', 'Vijf keer foutloos', 'Vijf foutloze spellen.', 100, (s) => [s.stats.perfect, 5]),
  A('h-d3', '🧭', 'Ontdekker', 'Speel 3 verschillende spellen.', 20, (s) => [s.distinct, 3]),
  A('h-d9', '🗺️', 'Wereldreiziger', 'Speel 9 verschillende spellen.', 80, (s) => [s.distinct, 9]),
  A('h-d18', '🏅', 'Alle spellen', 'Speel alle 18 spellen minstens één keer.', 250, (s) => [s.distinct, 18]),
  A('h-k3', '🗂️', 'Drie kits', 'Speel met 3 verschillende kits.', 20, (s) => [s.kitCount, 3]),
  A('h-k10', '🗃️', 'Kit-verzamelaar', 'Speel met 10 verschillende kits.', 70, (s) => [s.kitCount, 10]),
  A('h-hd1', '🌶️', 'Durver', 'Speel een spel op moeilijk.', 20, (s) => [s.stats.hard, 1]),
  A('h-hd5', '🦁', 'Heldenmoed', 'Win 5 spellen op moeilijk.', 120, (s) => [s.stats.hardWins, 5]),
  A('h-du1', '⚔️', 'Uitdager', 'Speel je eerste uitdaging.', 20, (s) => [s.stats.duels, 1]),
  A('h-du2', '🤝', 'Broer verslagen', 'Win een uitdaging.', 50, (s) => [s.stats.duelWins, 1]),
  A('h-du3', '🥊', 'Duel-meester', 'Win 5 uitdagingen.', 150, (s) => [s.stats.duelWins, 5]),
  A('h-u1', '🛒', 'Eerste upgrade', 'Koop een upgrade van jezelf.', 10, (s) => [s.stats.upBuys, 1]),
  A('h-u10', '🔧', 'Sterker worden', 'Koop 10 upgrade-levels.', 60, (s) => [s.upLevels, 10]),
  A('h-u30', '🛠️', 'Supermens', 'Koop 30 upgrade-levels.', 200, (s) => [s.upLevels, 30]),
  A('h-l5', '⭐', 'Level 5', 'Bereik level 5.', 30, (s) => [s.level, 5]),
  A('h-l10', '🌠', 'Level 10', 'Bereik level 10.', 80, (s) => [s.level, 10]),
  A('h-l20', '🪐', 'Level 20', 'Bereik level 20.', 250, (s) => [s.level, 20]),
  A('h-m500', '🪙', 'Muntjes sparen', 'Verdien 500 munten met spellen.', 20, (s) => [s.stats.coinsEarned, 500]),
  A('h-m5000', '💰', 'Rijk', 'Verdien 5000 munten met spellen.', 100, (s) => [s.stats.coinsEarned, 5000]),
  A('h-o5', '👗', 'Modebewust', 'Bezit 5 uiterlijk-items.', 30, (s) => [s.owned, 5]),
  A('h-o15', '🎭', 'Verkleedkist', 'Bezit 15 uiterlijk-items.', 100, (s) => [s.owned, 15]),
  A('h-q1', '📅', 'Opdracht klaar', 'Haal een dagopdracht op.', 10, (s) => [s.stats.claimed, 1]),
  A('h-q10', '🗓️', 'Dagelijkse held', 'Haal 10 dagopdrachten op.', 80, (s) => [s.stats.claimed, 10]),
];
export function hubSnapshot(d, extra = {}) {
  const own = d.own;
  return {
    stats: d.stats, distinct: Object.keys(d.played).filter((k) => d.played[k] > 0 && !k.startsWith('_')).length,
    kitCount: Object.keys(d.kits).length, owned: own.av.length + own.hat.length + own.bg.length,
    level: extra.level || 1, upLevels: extra.upLevels || 0,
  };
}
// Controleert alle hub-prestaties; geeft de nieuw behaalde terug (en zet ze in d.ach).
export function checkHubAch(d, extra = {}, now = Date.now()) {
  const snap = hubSnapshot(d, extra), out = [];
  for (const a of HUB_ACH) {
    if (d.ach[a.id]) continue;
    let p; try { p = a.prog(snap); } catch { p = [0, 1]; }
    if (p[0] >= p[1]) { d.ach[a.id] = now; out.push(a); }
  }
  return out;
}
export function achProgress(d, a, extra = {}) {
  try { return a.prog(hubSnapshot(d, extra)); } catch { return [0, 1]; }
}

/* ---------- winkel-UI (geeft HTML terug; klikken worden in act() afgehandeld) ---------- */
const FX_FMT = {
  startCash: (v) => `Startgeld ${num(v)}`, cashMult: (v) => `Geld ×${num(v)}`, streakBonus: (v) => `Reeksbonus +${num(v)}`,
  extraLives: (v) => `+${num(v)} ${v === 1 ? 'leven' : 'levens'}`, timeBonus: (v) => `+${num(v)} sec per vraag`, hints: (v) => `${num(v)} ${v === 1 ? 'hint' : 'hints'}`,
  shield: (v) => `${num(v)} ${v === 1 ? 'schild' : 'schilden'}`, xpMult: (v) => `XP ×${num(v)}`, coinMult: (v) => `Munten ×${num(v)}`, luck: (v) => `Geluk ${Math.round(v * 100)}%`,
};
function num(v) { return String(Math.round(v * 100) / 100).replace('.', ','); }
export function fxText(fx) {
  if (!fx) return '';
  return Object.keys(fx).filter((k) => FX_FMT[k] && fx[k]).map((k) => FX_FMT[k](fx[k])).join(' · ');
}
export function upgradeInfo(u, lv) {
  let cur = {}, nxt = {};
  try { cur = lv > 0 ? u.fx(lv) : {}; } catch {}
  try { nxt = lv < u.max ? u.fx(lv + 1) : {}; } catch {}
  let cost = 0; try { cost = lv < u.max ? u.cost(lv) : 0; } catch {}
  return { cur: fxText(cur), next: fxText(nxt), cost, maxed: lv >= u.max };
}
export function upLevelsTotal() {
  let n = 0; try { const up = Profile.get().up || {}; for (const k of Object.keys(up)) n += +up[k] || 0; } catch {}
  return n;
}

export function shopHTML(api) {
  const p = Profile.get(), d = api.store.d, tab = api.S.shopTab || 'up';
  const tabs = [['up', '⚡ Upgrades'], ['av', '🦊 Avatars'], ['hat', '🎩 Hoeden'], ['bg', '🎨 Achtergronden']];
  let h = `<div class="lsp-card2 lsp-preview">${avatarHTML(p.avatar, 84)}<div style="flex:1;min-width:0"><b>Je naam</b><input class="lsp-search" data-inp="pname" maxlength="20" value="${esc(p.name || '')}" placeholder="Jouw naam" style="width:100%;margin:4px 0"><small>🪙 ${fmt(p.coins || 0)} munten</small></div></div>`;
  h += `<div class="lsp-chips">${tabs.map(([k, l]) => `<button class="lsp-chip${tab === k ? ' on' : ''}" data-act="shop-tab" data-v="${k}">${l}</button>`).join('')}</div>`;
  if (tab === 'up') {
    const ups = Profile.UPGRADES || [];
    let fxAll = ''; try { fxAll = fxText(Profile.effects()); } catch {}
    h += `<div class="lsp-note">Upgrades blijven altijd van jou en werken in alle spellen.${fxAll ? `<br><b>Nu actief:</b> ${esc(fxAll)}` : ''}</div>`;
    if (!ups.length) h += `<div class="lsp-empty">De winkel is nog leeg.</div>`;
    h += '<div class="lsp-list">';
    for (const u of ups) {
      const lv = (p.up && p.up[u.id]) || 0, i = upgradeInfo(u, lv), can = !i.maxed && (p.coins || 0) >= i.cost;
      const pips = Array.from({ length: Math.min(u.max, 12) }, (_, k) => `<i class="${k < lv ? 'on' : ''}"></i>`).join('');
      h += `<div class="lsp-up"><div class="lsp-up-e">${esc(u.emoji)}</div><div class="lsp-up-m"><b>${esc(u.name)}</b> <small>Lv ${lv}/${u.max}</small><div class="lsp-pips">${pips}</div><small>${esc(u.desc)}</small>
        ${i.next ? `<small class="lsp-nx">${i.cur ? `Nu: ${esc(i.cur)} → ` : 'Straks: '}${esc(i.next)}</small>` : (i.maxed ? '<small class="lsp-nx">Maximaal! 🎉</small>' : '')}</div>
        <button class="lsp-buy" data-act="buy-up" data-id="${esc(u.id)}" ${can ? '' : 'disabled'}>${i.maxed ? 'MAX' : `🪙 ${fmt(i.cost)}`}</button></div>`;
    }
    h += '</div>';
  } else {
    const list = catalog(tab), av = p.avatar || {}, lvl = (Profile.levelInfo() || {}).level || 1;
    h += '<div class="lsp-cosgrid">';
    for (const it of list) {
      const [id, name, price, lv] = it, owned = isOwned(tab, id, price, d), locked = !owned && lvl < lv;
      const eq = tab === 'av' ? av.emoji === id : tab === 'hat' ? (av.hat || '') === id : av.bg === id;
      const prev = tab === 'av' ? avatarHTML({ ...av, emoji: id }, 48) : tab === 'hat' ? avatarHTML({ ...av, hat: id }, 48) : avatarHTML({ ...av, bg: id }, 48);
      h += `<button class="lsp-cos${eq ? ' eq' : ''}${locked ? ' lock' : ''}" data-act="${owned ? 'equip' : 'buy-cos'}" data-k="${tab}" data-id="${esc(id)}" ${locked ? 'disabled' : ''}>${prev}<span class="n">${esc(name) || '&nbsp;'}</span><span class="p">${eq ? '✔ Aan' : owned ? 'Gebruik' : locked ? `🔒 Level ${lv}` : `🪙 ${price}`}</span></button>`;
    }
    h += '</div>';
  }
  return h;
}

// Klik-afhandeling voor de winkel. Geeft true terug als de actie van ons was.
export function shopAct(act, data, api) {
  const p = Profile.get(), d = api.store.d;
  if (act === 'shop-tab') { api.S.shopTab = data.v; api.rerender(); return true; }
  if (act === 'buy-up') {
    const u = (Profile.UPGRADES || []).find((x) => x.id === data.id); if (!u) return true;
    const before = (p.up && p.up[u.id]) || 0;
    let ok = false; try { ok = Profile.buyUpgrade(u.id); } catch {}
    if (ok) { d.stats.upBuys++; api.snd('munt'); api.toast(`${u.emoji} ${u.name} → level ${before + 1}`); api.afterChange(); }
    else { api.snd('fout'); api.toast('Niet genoeg munten.'); }
    api.rerender(); return true;
  }
  if (act === 'buy-cos') {
    const it = catItem(data.k, data.id); if (!it) return true;
    const lvl = (Profile.levelInfo() || {}).level || 1;
    if (isOwned(data.k, it[0], it[2], d)) return true;
    if (lvl < it[3]) { api.toast(`Dit krijg je op level ${it[3]}.`); return true; }
    let ok = false;
    try { ok = (coreCos(data.k) && Profile.buyCosmetic) ? Profile.buyCosmetic(CK[data.k], it[0]) : Profile.spend(it[2]); } catch {}
    if (!ok) { api.snd('fout'); api.toast('Niet genoeg munten.'); return true; }
    if (!d.own[data.k].includes(it[0])) d.own[data.k].push(it[0]);
    api.snd('munt'); equip(data.k, it[0], p); api.toast(`${it[1] || 'Nieuw'} gekocht en aangedaan!`); api.afterChange(); api.rerender(); return true;
  }
  if (act === 'equip') { equip(data.k, data.id, p); api.snd('klik'); api.rerender(); return true; }
  return false;
}
function equip(kind, id, p) {
  const av = { emoji: '🙂', hat: '', bg: 'sky', ...(p.avatar || {}) };
  if (kind === 'av') av.emoji = id; else if (kind === 'hat') av.hat = id; else av.bg = id;
  try { Profile.setAvatar(av); } catch {}
}

/* ---------- prestaties-UI ---------- */
export function achHTML(api) {
  const d = api.store.d, extra = api.extra();
  let core = []; try { core = Profile.achievements() || []; } catch {}
  const rows = [
    ...core.map((a) => ({ emoji: a.emoji, name: a.name, desc: a.desc || '', done: !!a.done, p: a.goal ? [a.prog || 0, a.goal] : null, reward: a.coins })),
    ...HUB_ACH.map((a) => { const p = achProgress(d, a, extra); return { emoji: a.emoji, name: a.name, desc: a.desc, done: !!d.ach[a.id], p, reward: a.reward }; }),
  ];
  const done = rows.filter((r) => r.done).length;
  let h = `<div class="lsp-card2"><b>🎖️ Prestaties</b><small>${done} van ${rows.length} behaald</small><div class="lsp-xp"><i style="width:${Math.round(100 * done / Math.max(1, rows.length))}%"></i></div></div><div class="lsp-list">`;
  rows.sort((a, b) => (b.done ? 1 : 0) - (a.done ? 1 : 0));
  for (const r of rows) {
    const pct = r.p ? Math.min(100, Math.round(100 * r.p[0] / r.p[1])) : (r.done ? 100 : 0);
    h += `<div class="lsp-ach${r.done ? ' done' : ''}"><div class="lsp-ach-e">${esc(r.emoji || '🏅')}</div><div class="lsp-ach-m"><b>${esc(r.name)}</b><small>${esc(r.desc)}</small>${r.done ? '' : r.p ? `<div class="lsp-xp s"><i style="width:${pct}%"></i></div><small>${fmt(Math.min(r.p[0], r.p[1]))} / ${fmt(r.p[1])}${r.reward ? ` · beloning 🪙 ${r.reward}` : ''}</small>` : ''}</div>${r.done ? '<span class="lsp-ok">✔</span>' : ''}</div>`;
  }
  return h + '</div>';
}

/* ---------- stijlen (klassenprefix lsp-), door games.js geïnjecteerd ---------- */
export const CSS = `
.lsp{max-width:760px;margin:0 auto;padding:0 2px 80px;color:var(--ink);font-size:15px;line-height:1.35;-webkit-tap-highlight-color:transparent}
.lsp *{box-sizing:border-box}
.lsp button{font:inherit;color:inherit;cursor:pointer}
.lsp small{display:block;opacity:.68;font-size:12.5px;line-height:1.3}
.lsp b{font-weight:700}
.lsp-av{position:relative;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;flex:none;box-shadow:0 2px 8px rgba(0,0,0,.18),inset 0 0 0 2px rgba(255,255,255,.35)}
.lsp-av-e{line-height:1}
.lsp-av-h{position:absolute;left:50%;transform:translateX(-50%) rotate(-8deg);line-height:1;filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
.lsp-head{display:flex;align-items:center;gap:12px;padding:12px;border-radius:18px;background:var(--card);border:1px solid var(--line);margin:4px 0 10px}
.lsp-avbtn{background:none;border:0;padding:6px 0 0;position:relative}
.lsp-hmain{flex:1;min-width:0}
.lsp-name{font-weight:800;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lsp-lv{display:inline-block;font-size:11px;font-weight:800;background:var(--accent);color:#fff;border-radius:99px;padding:1px 8px;margin-left:6px;vertical-align:2px}
.lsp-xp{height:9px;border-radius:99px;background:rgba(127,127,127,.2);overflow:hidden;margin:6px 0 3px}
.lsp-xp.s{height:6px;margin:5px 0 2px}
.lsp-xp i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--accent),#a78bfa);transition:width .6s cubic-bezier(.2,.9,.3,1)}
.lsp-coins{font-weight:800;background:rgba(250,204,21,.2);border:1px solid rgba(250,204,21,.55);border-radius:99px;padding:6px 12px;white-space:nowrap}
.lsp-nav{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;scrollbar-width:none}
.lsp-nav::-webkit-scrollbar{display:none}
.lsp-nav button{flex:none;border:1px solid var(--line);background:var(--card);border-radius:99px;padding:8px 14px;font-weight:700;font-size:14px}
.lsp-nav button.on{background:var(--accent);border-color:var(--accent);color:#fff}
.lsp-card2{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:12px 14px;margin:0 0 10px}
.lsp-card2>b{display:block;margin-bottom:2px}
.lsp-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.lsp-btn{border:0;background:var(--accent);color:#fff!important;font-weight:800;border-radius:12px;padding:10px 16px}
.lsp-btn.ghost{background:rgba(127,127,127,.16);color:var(--ink)!important}
.lsp-btn.big{width:100%;margin-top:10px;padding:13px;font-size:16px}
.lsp-btn:disabled,.lsp-buy:disabled{opacity:.45;cursor:default}
.lsp-btn:active:not(:disabled),.lsp-gc:active,.lsp-cos:active{transform:scale(.97)}
.lsp-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
.lsp-chip{border:1px solid var(--line);background:var(--card);border-radius:99px;padding:6px 12px;font-size:13.5px;font-weight:600}
.lsp-chip.on{background:var(--accent);border-color:var(--accent);color:#fff}
.lsp-lab{font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;opacity:.6;margin:10px 0 2px}
.lsp-note{background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.3);border-radius:12px;padding:8px 12px;margin:0 0 10px;font-size:13.5px}
.lsp-note.err{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.4)}
.lsp-empty{text-align:center;opacity:.7;padding:26px 10px}
.lsp-q{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--line)}
.lsp-q:first-of-type{border-top:0}
.lsp-q-m{flex:1;min-width:0}
.lsp-q .lsp-xp{margin:4px 0 0}
.lsp-q.done{opacity:.6}
.lsp-claim{border:0;background:#f59e0b;color:#fff!important;font-weight:800;border-radius:10px;padding:7px 12px;animation:lspPulse 1.2s infinite}
.lsp-kitbtn{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px 14px;margin:0 0 8px}
.lsp-kitbtn .e{font-size:26px}
.lsp-kitbtn .t{flex:1;min-width:0}
.lsp-kitbtn .t b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lsp-tools{display:flex;gap:8px;margin:8px 0}
.lsp-search{flex:1;min-width:0;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:12px;padding:10px 12px;font:inherit}
.lsp-sec{font-weight:800;margin:14px 2px 6px;display:flex;align-items:center;gap:8px}
.lsp-sec small{display:inline;font-weight:500}
.lsp-recent{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
.lsp-recent::-webkit-scrollbar{display:none}
.lsp-rc{flex:none;display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:var(--card);border-radius:14px;padding:8px 12px;font-weight:700}
.lsp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
@media(min-width:560px){.lsp-grid{grid-template-columns:repeat(3,1fr)}}
.lsp-gc{position:relative;text-align:left;border:0;border-radius:18px;padding:12px 12px 10px;color:#fff!important;background:linear-gradient(150deg,var(--c),rgba(0,0,0,.35) 190%),var(--c);display:flex;flex-direction:column;gap:3px;min-height:150px;overflow:hidden;box-shadow:0 3px 10px rgba(0,0,0,.18);transition:transform .12s}
.lsp-gc small{color:#fff;opacity:.88}
.lsp-gc b{font-size:15.5px}
.lsp-gc-e{font-size:38px;line-height:1.1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25))}
.lsp-gc-f{margin-top:auto;font-size:12px;font-weight:700;opacity:.95}
.lsp-tags{display:flex;gap:4px;flex-wrap:wrap}
.lsp-tags i{font-style:normal;font-size:10.5px;font-weight:700;background:rgba(255,255,255,.22);border-radius:99px;padding:1px 7px}
.lsp-fav{position:absolute;right:8px;top:6px;font-size:20px;opacity:.9;padding:2px 4px}
.lsp-gc.soon{filter:grayscale(.85);opacity:.55;box-shadow:none}
.lsp-badge{position:absolute;left:0;right:0;bottom:0;text-align:center;background:rgba(0,0,0,.6);font-size:11px;font-weight:800;padding:4px}
.lsp-badge.err{background:rgba(185,28,28,.85)}
.lsp-list{display:flex;flex-direction:column;gap:8px}
.lsp-up,.lsp-ach{display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:10px 12px}
.lsp-up-e,.lsp-ach-e{font-size:30px;width:44px;text-align:center;flex:none}
.lsp-up-m,.lsp-ach-m{flex:1;min-width:0}
.lsp-nx{color:var(--accent);opacity:1!important;font-weight:600}
.lsp-pips{display:flex;gap:3px;margin:4px 0}
.lsp-pips i{width:14px;height:6px;border-radius:3px;background:rgba(127,127,127,.28)}
.lsp-pips i.on{background:var(--accent)}
.lsp-buy{flex:none;border:0;background:#f59e0b;color:#fff!important;font-weight:800;border-radius:12px;padding:10px 12px;min-width:74px}
.lsp-ach.done{background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.4)}
.lsp-ok{color:#16a34a;font-weight:900;font-size:20px}
.lsp-preview{display:flex;align-items:center;gap:14px}
.lsp-cosgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
@media(min-width:520px){.lsp-cosgrid{grid-template-columns:repeat(4,1fr)}}
.lsp-cos{display:flex;flex-direction:column;align-items:center;gap:4px;border:2px solid var(--line);background:var(--card);border-radius:14px;padding:10px 4px;text-align:center}
.lsp-cos.eq{border-color:var(--accent)}
.lsp-cos.lock{opacity:.5}
.lsp-cos .n{font-size:12px;font-weight:700}
.lsp-cos .p{font-size:12px;opacity:.75}
.lsp-sheet-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:60;display:flex;align-items:flex-end;justify-content:center}
.lsp-sheet{background:var(--card);color:var(--ink);width:100%;max-width:640px;max-height:84vh;border-radius:20px 20px 0 0;display:flex;flex-direction:column;padding:14px;animation:lspUp .22s ease-out}
.lsp-sheet-list{overflow-y:auto;flex:1;margin-top:8px;-webkit-overflow-scrolling:touch}
.lsp-kit{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--line);padding:9px 4px}
.lsp-kit .e{font-size:24px;width:32px;text-align:center}
.lsp-kit.on{background:rgba(99,102,241,.12);border-radius:10px}
.lsp-duel{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:12px;margin:0 0 10px}
.lsp-duel.open{border-color:var(--accent)}
.lsp-duel-top{display:flex;align-items:center;gap:10px;margin-bottom:4px}
.lsp-duel-top>div{flex:1;min-width:0}
.lsp-duel-e{font-size:24px;width:42px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:12px;flex:none}
.lsp-st{font-size:11.5px;font-weight:800;border-radius:99px;padding:3px 9px;background:rgba(127,127,127,.2);white-space:nowrap}
.lsp-st.open{background:var(--accent);color:#fff}.lsp-st.win{background:#16a34a;color:#fff}.lsp-st.lose{background:#dc2626;color:#fff}
.lsp-board{margin-top:6px}
.lsp-brow{display:flex;align-items:center;gap:8px;font-size:13.5px;margin:3px 0}
.lsp-brow>span{width:96px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lsp-brow>b{width:54px;text-align:right}
.lsp-brow.me>span{font-weight:800}
.lsp-bar2{flex:1;height:10px;background:rgba(127,127,127,.2);border-radius:99px;overflow:hidden}
.lsp-bar2 i{display:block;height:100%;background:#94a3b8;border-radius:99px}
.lsp-brow.me .lsp-bar2 i{background:var(--accent)}
.lsp-rank{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--line)}
.lsp-rank:first-of-type{border-top:0}
.lsp-rank .e{font-size:24px;width:32px;text-align:center}
.lsp-rank .m{flex:1;min-width:0}
.lsp-rank .s{font-weight:800;font-size:17px}
.lsp-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0}
.lsp-stat{background:rgba(127,127,127,.1);border-radius:12px;text-align:center;padding:8px 4px}
.lsp-stat b{display:block;font-size:20px}
.lsp-play{display:flex;flex-direction:column;gap:6px}
.lsp-bar{display:flex;align-items:center;gap:8px;padding:2px 2px}
.lsp-bar .lsp-tt{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lsp-bar button{border:1px solid var(--line);background:var(--card);border-radius:10px;min-width:40px;height:38px;font-weight:800}
.lsp-bar button.arm{background:#dc2626;color:#fff;border-color:#dc2626;padding:0 10px}
.lsp-cnt{font-weight:800;font-size:13px;opacity:.85}
.lsp-host{position:relative;width:100%;border-radius:16px;overflow:hidden;background:var(--card);border:1px solid var(--line);min-height:420px;touch-action:manipulation}
.lsp-res{text-align:center;padding-top:8px}
.lsp-res h2{margin:4px 0;font-size:26px}
.lsp-big{font-size:64px;line-height:1;animation:lspPop .5s cubic-bezier(.2,1.6,.4,1)}
.lsp-score{font-size:44px;font-weight:900;color:var(--accent);margin:2px 0}
.lsp-ribbon{display:inline-block;background:linear-gradient(90deg,#f59e0b,#ef4444);color:#fff;font-weight:900;border-radius:99px;padding:4px 14px;margin:4px 0;animation:lspPulse 1.2s infinite}
.lsp-rew{display:flex;gap:10px;justify-content:center;margin:12px 0}
.lsp-rew>div{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:8px 18px;font-weight:800;font-size:18px;animation:lspPop .5s both}
.lsp-rew>div:nth-child(2){animation-delay:.12s}
.lsp-lvup{background:linear-gradient(90deg,rgba(99,102,241,.2),rgba(236,72,153,.2));border-radius:14px;padding:8px 12px;margin:8px 0;font-weight:800}
.lsp-new{background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.4);border-radius:12px;padding:6px 10px;margin:6px 0;text-align:left}
.lsp-miss{text-align:left;border-top:1px solid var(--line);padding:8px 2px}
.lsp-miss small{opacity:.85}
.lsp-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#1f2937;color:#fff;border-radius:99px;padding:10px 18px;font-weight:700;z-index:80;max-width:88vw;text-align:center;animation:lspUp .2s ease-out;box-shadow:0 4px 14px rgba(0,0,0,.35)}
.lsp-cf{position:fixed;top:-20px;font-size:22px;z-index:70;pointer-events:none;animation:lspFall 2.2s linear forwards}
.lsp-err{text-align:center;padding:28px 12px}
@keyframes lspUp{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}
@keyframes lspPop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes lspPulse{50%{transform:scale(1.06)}}
@keyframes lspFall{to{transform:translateY(110vh) rotate(540deg);opacity:.8}}
@media(prefers-reduced-motion:reduce){.lsp *{animation:none!important;transition:none!important}}
`;
