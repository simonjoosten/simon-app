// Ronde 4 – dagelijkse en wekelijkse uitdaging + ranglijst-modi voor de Learn Spel-hub.
// Puur en testbaar: geen DOM, geen opslag. games.js bewaart de toestand (lokaal `learn:<uid>:r4`, cloud gamesaves `learn-r4__<uid>`).
export const HIST_MAX = 120;
export const RANK_MODES = [['today', 'Vandaag'], ['week', 'Deze week'], ['all', 'Altijd'], ['game', 'Per spel'], ['streak', 'Reeksen']];

const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
// ISO-weeknummer (maandag = begin van de week)
export function weekKey(t = Date.now()) {
  const d = new Date(t); const u = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const wd = u.getUTCDay() || 7; u.setUTCDate(u.getUTCDate() + 4 - wd);
  const y0 = new Date(Date.UTC(u.getUTCFullYear(), 0, 1));
  return `${u.getUTCFullYear()}-W${pad(Math.ceil(((u - y0) / 86400000 + 1) / 7))}`;
}
export function addDays(key, n) { const [y, m, d] = key.split('-').map(Number); return dayKey(new Date(y, m - 1, d + n, 12).getTime()); }
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mul(seed) { let s = seed >>> 0 || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---------- toestand ---------- */
export function defaultR4() {
  return { v: 1, t: 0, hist: [], day: { key: '', done: 0, claimed: 0, best: 0, bestCorrect: 0 }, wk: { key: '', games: 0, correct: 0, wins: 0, perfect: 0, streak: 0, played: [], claimed: [] }, ds: { n: 0, last: '', best: 0 }, tot: { dailies: 0, weeklies: 0, coins: 0 } };
}
const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
export function normR4(x) {
  const d = defaultR4(); if (!x || typeof x !== 'object') return d;
  d.t = num(x.t);
  if (Array.isArray(x.hist)) d.hist = x.hist.filter((h) => h && typeof h.g === 'string').slice(-HIST_MAX).map((h) => ({ t: num(h.t), g: h.g.slice(0, 24), k: String(h.k || '').slice(0, 24), l: num(h.l, 2), s: num(h.s), w: h.w ? 1 : 0, c: num(h.c), x: num(h.x), b: num(h.b), d: h.d ? 1 : 0 }));
  if (x.day && typeof x.day === 'object') Object.assign(d.day, { key: String(x.day.key || ''), done: num(x.day.done), claimed: num(x.day.claimed), best: num(x.day.best), bestCorrect: num(x.day.bestCorrect) });
  if (x.wk && typeof x.wk === 'object') {
    Object.assign(d.wk, { key: String(x.wk.key || ''), games: num(x.wk.games), correct: num(x.wk.correct), wins: num(x.wk.wins), perfect: num(x.wk.perfect), streak: num(x.wk.streak) });
    if (Array.isArray(x.wk.played)) d.wk.played = [...new Set(x.wk.played.filter((v) => typeof v === 'string'))].slice(0, 40);
    if (Array.isArray(x.wk.claimed)) d.wk.claimed = [...new Set(x.wk.claimed.filter((v) => typeof v === 'string'))].slice(0, 12);
  }
  if (x.ds && typeof x.ds === 'object') Object.assign(d.ds, { n: num(x.ds.n), last: String(x.ds.last || ''), best: num(x.ds.best) });
  if (x.tot && typeof x.tot === 'object') Object.assign(d.tot, { dailies: num(x.tot.dailies), weeklies: num(x.tot.weeklies), coins: num(x.tot.coins) });
  return d;
}
// lokaal en cloud samenvoegen zonder iets te verliezen
export function mergeR4(a, b) {
  a = normR4(a); b = normR4(b);
  const n = a.t >= b.t ? a : b, o = n === a ? b : a;
  const seen = new Set(), hist = [];
  for (const h of [...a.hist, ...b.hist].sort((p, q) => p.t - q.t)) { const k = `${h.t}|${h.g}|${h.s}`; if (!seen.has(k)) { seen.add(k); hist.push(h); } }
  const out = { ...n, hist: hist.slice(-HIST_MAX) };
  if (o.day.key === n.day.key) out.day = { key: n.day.key, done: Math.max(a.day.done, b.day.done), claimed: Math.max(a.day.claimed, b.day.claimed), best: Math.max(a.day.best, b.day.best), bestCorrect: Math.max(a.day.bestCorrect, b.day.bestCorrect) };
  if (o.wk.key === n.wk.key) out.wk = { key: n.wk.key, games: Math.max(a.wk.games, b.wk.games), correct: Math.max(a.wk.correct, b.wk.correct), wins: Math.max(a.wk.wins, b.wk.wins), perfect: Math.max(a.wk.perfect, b.wk.perfect), streak: Math.max(a.wk.streak, b.wk.streak), played: [...new Set([...a.wk.played, ...b.wk.played])], claimed: [...new Set([...a.wk.claimed, ...b.wk.claimed])] };
  out.ds = a.ds.last >= b.ds.last ? { ...a.ds, best: Math.max(a.ds.best, b.ds.best) } : { ...b.ds, best: Math.max(a.ds.best, b.ds.best) };
  out.tot = { dailies: Math.max(a.tot.dailies, b.tot.dailies), weeklies: Math.max(a.tot.weeklies, b.tot.weeklies), coins: Math.max(a.tot.coins, b.tot.coins) };
  return out;
}
// kleine cloud-versie (max 17500 tekens)
export function r4ForCloud(d, max = 17500) {
  let s = JSON.stringify(d); if (s.length <= max) return s;
  const c = { ...d, hist: d.hist.slice() }; while (s.length > max && c.hist.length > 10) { c.hist.splice(0, 10); s = JSON.stringify(c); }
  return s.slice(0, max);
}
// nieuwe dag/week: tellers resetten
export function rollover(d, now = Date.now()) {
  const dk = dayKey(now), wk = weekKey(now);
  if (d.day.key !== dk) d.day = { key: dk, done: 0, claimed: 0, best: 0, bestCorrect: 0 };
  if (d.wk.key !== wk) d.wk = { key: wk, games: 0, correct: 0, wins: 0, perfect: 0, streak: 0, played: [], claimed: [] };
  if (d.ds.last && d.ds.last !== dk && d.ds.last !== addDays(dk, -1)) d.ds.n = 0;   // reeks verbroken
  return d;
}

/* ---------- dagelijkse uitdaging ---------- */
const DAILY_KINDS = [
  { kind: 'correct', text: (n) => `Haal ${n} goede antwoorden in één spel`, n: [8, 12, 16] },
  { kind: 'win', text: () => 'Win het spel', n: [1, 1, 1] },
  { kind: 'streak', text: (n) => `Haal een reeks van ${n} goede antwoorden`, n: [4, 6, 8] },
  { kind: 'score', text: (n) => `Haal minstens ${n} punten`, n: [150, 250, 400] },
];
export function dailyChallenge(key, gameIds, level = 0) {
  const ids = (gameIds || []).filter(Boolean); const r = mul(hash('daily:' + key));
  const game = ids.length ? ids[Math.floor(r() * ids.length)] : 'klassiek';
  const k = DAILY_KINDS[Math.floor(r() * DAILY_KINDS.length)]; const lv = level ? Math.min(3, Math.max(1, level)) : [2, 2, 3, 1, 2, 3, 2][hash('lv:' + key) % 7]; const n = k.n[lv - 1];
  return { key, game, level: lv, kind: k.kind, n, text: k.text(n), seed: 1 + (hash('seed:' + key) % 2000000000), reward: 50 + lv * 20 };
}
export function dailyMet(ch, r) {
  if (!ch || !r) return false;
  if (ch.kind === 'correct') return num(r.correct) >= ch.n;
  if (ch.kind === 'win') return r.win === true;
  if (ch.kind === 'streak') return num(r.bestStreak) >= ch.n;
  return num(r.score) >= ch.n;
}
export function streakBonus(n) { return Math.min(100, Math.max(0, (n - 1)) * 10); }
export function dailyStatus(d, ch) { rollover(d); return { done: d.day.done >= 1, claimed: d.day.claimed >= 1, ready: d.day.done >= 1 && !d.day.claimed, streak: d.ds.n, bonus: streakBonus(d.ds.n), reward: ch.reward }; }
// claim: geeft munten terug (0 als niet kan)
export function claimDaily(d, ch, now = Date.now()) {
  rollover(d, now); if (!(d.day.done >= 1) || d.day.claimed) return 0;
  const coins = ch.reward + streakBonus(d.ds.n); d.day.claimed = 1; d.tot.dailies++; d.tot.coins += coins; return coins;
}

/* ---------- wekelijkse uitdaging ---------- */
const WEEK_POOL = [
  { id: 'games', text: (n) => `Speel ${n} spellen`, n: 10, stat: (w) => w.games, coins: 80 },
  { id: 'correct', text: (n) => `Geef ${n} goede antwoorden`, n: 120, stat: (w) => w.correct, coins: 100 },
  { id: 'wins', text: (n) => `Win ${n} spellen`, n: 5, stat: (w) => w.wins, coins: 100 },
  { id: 'variety', text: (n) => `Speel ${n} verschillende spellen`, n: 5, stat: (w) => w.played.length, coins: 90 },
  { id: 'streak', text: (n) => `Haal een reeks van ${n} goed`, n: 12, stat: (w) => w.streak, coins: 90 },
  { id: 'perfect', text: (n) => `Speel ${n} spellen zonder fouten`, n: 2, stat: (w) => w.perfect, coins: 120 },
];
export const WEEK_BONUS = 150;
export function weeklyChallenge(key) {
  const r = mul(hash('week:' + key)); const pool = WEEK_POOL.slice(); const goals = [];
  while (goals.length < 4 && pool.length) { const p = pool.splice(Math.floor(r() * pool.length), 1)[0]; goals.push({ id: p.id, n: p.n, text: p.text(p.n), coins: p.coins }); }
  return { key, goals, bonus: WEEK_BONUS };
}
export function weeklyProgress(d, wc) {
  rollover(d);
  return wc.goals.map((g) => { const p = WEEK_POOL.find((x) => x.id === g.id); const prog = Math.min(g.n, p ? p.stat(d.wk) : 0); return { ...g, prog, done: prog >= g.n, claimed: d.wk.claimed.includes(g.id) }; });
}
export function claimWeekly(d, wc, id, now = Date.now()) {
  rollover(d, now); const list = weeklyProgress(d, wc);
  if (id === 'bonus') {
    if (d.wk.claimed.includes('bonus') || !list.every((g) => g.claimed)) return 0;
    d.wk.claimed.push('bonus'); d.tot.weeklies++; d.tot.coins += wc.bonus; return wc.bonus;
  }
  const g = list.find((x) => x.id === id); if (!g || !g.done || g.claimed) return 0;
  d.wk.claimed.push(g.id); d.tot.coins += g.coins; return g.coins;
}

/* ---------- resultaat verwerken ---------- */
// r: { game, kit, level, score, win, correct, wrong, bestStreak, daily (bool: gespeeld als dagelijkse uitdaging), ch (de uitdaging) }
export function recordResult(d, r, now = Date.now()) {
  rollover(d, now);
  d.hist.push({ t: now, g: String(r.game).slice(0, 24), k: String(r.kit || '').slice(0, 24), l: r.level || 2, s: Math.max(0, Math.round(num(r.score))), w: r.win === true ? 1 : 0, c: num(r.correct), x: num(r.wrong), b: num(r.bestStreak), d: r.daily ? 1 : 0 });
  if (d.hist.length > HIST_MAX) d.hist.splice(0, d.hist.length - HIST_MAX);
  const w = d.wk; w.games++; w.correct += num(r.correct); if (r.win === true) w.wins++; if (!num(r.wrong) && num(r.correct) >= 5) w.perfect++;
  w.streak = Math.max(w.streak, num(r.bestStreak)); if (!w.played.includes(r.game)) w.played.push(r.game);
  d.day.best = Math.max(d.day.best, num(r.score)); d.day.bestCorrect = Math.max(d.day.bestCorrect, num(r.correct));
  let dailyNow = false;
  if (r.daily && r.ch && r.ch.key === d.day.key && !d.day.done && dailyMet(r.ch, r)) {
    d.day.done = 1; dailyNow = true;
    if (d.ds.last === addDays(d.day.key, -1)) d.ds.n++; else if (d.ds.last !== d.day.key) d.ds.n = 1;
    d.ds.last = d.day.key; d.ds.best = Math.max(d.ds.best, d.ds.n);
  }
  d.t = now; return { dailyDone: dailyNow };
}

/* ---------- ranglijst-modi ---------- */
const sameDay = (t, now) => dayKey(t) === dayKey(now);
export function leaderboard(d, mode, now = Date.now()) {
  const h = d.hist || [];
  if (mode === 'today') return h.filter((x) => sameDay(x.t, now)).sort((a, b) => b.s - a.s).slice(0, 8).map((x) => ({ g: x.g, v: x.s, sub: `${x.k} · ${x.c} goed`, t: x.t, win: !!x.w }));
  if (mode === 'week') { const wk = weekKey(now); return h.filter((x) => weekKey(x.t) === wk).sort((a, b) => b.s - a.s).slice(0, 8).map((x) => ({ g: x.g, v: x.s, sub: `${x.k} · ${x.c} goed`, t: x.t, win: !!x.w })); }
  if (mode === 'all') return h.slice().sort((a, b) => b.s - a.s).slice(0, 8).map((x) => ({ g: x.g, v: x.s, sub: `${x.k} · ${x.c} goed`, t: x.t, win: !!x.w }));
  if (mode === 'game') {
    const best = {}; for (const x of h) { const b = best[x.g]; if (!b || x.s > b.s) best[x.g] = x; }
    return Object.values(best).sort((a, b) => b.s - a.s).slice(0, 12).map((x) => ({ g: x.g, v: x.s, sub: `${x.k} · ${x.c} goed`, t: x.t, win: !!x.w }));
  }
  if (mode === 'streak') return h.filter((x) => x.b > 0).sort((a, b) => b.b - a.b || b.s - a.s).slice(0, 8).map((x) => ({ g: x.g, v: x.b, sub: `reeks · ${x.k}`, t: x.t, win: !!x.w, unit: 'reeks' }));
  return [];
}

/* ---------- HTML (api: { esc, ic, fmt, meta(id), bigIcon(id,m,size) }) ---------- */
export function dailyHTML(d, ch, api, wc) {
  const { esc, ic, meta } = api; const st = dailyStatus(d, ch), m = meta(ch.game);
  let h = `<div class="lsp-card2 r4-day"><b class="lsp-sectitle">${ic('target', 34)} Uitdaging van vandaag</b>`;
  h += `<div class="lsp-q${st.claimed ? ' done' : ''}"><div class="lsp-q-i">${api.bigIcon(ch.game, m, 40)}</div><div class="lsp-q-m"><div><b>${esc(m.name)}</b> · ${esc(ch.text)}</div><small>Iedereen speelt vandaag hetzelfde spel · ${esc(['', 'makkelijk', 'normaal', 'moeilijk'][ch.level])} · beloning ${ch.reward}${st.bonus ? ' + ' + st.bonus : ''} munten${d.ds.n ? ' · reeks ' + d.ds.n + ' dagen' : ''}</small></div>`;
  h += st.ready ? `<button class="lsp-claim" data-act="r4-claim-day">${ic('coin', 24)} ${ch.reward + st.bonus}</button>` : st.claimed ? '<small>klaar</small>' : `<button class="lsp-claim" data-act="r4-play-day">Spelen</button>`;
  h += '</div></div>';
  if (wc) {
    const list = weeklyProgress(d, wc); const all = list.every((g) => g.claimed), bonusDone = d.wk.claimed.includes('bonus');
    h += `<div class="lsp-card2 r4-week"><b class="lsp-sectitle">${ic('trophy', 34)} Weekuitdaging <small style="display:inline">· ${esc(wc.key)}</small></b>`;
    for (const g of list) {
      const pct = Math.round((100 * g.prog) / g.n);
      h += `<div class="lsp-q${g.claimed ? ' done' : ''}"><div class="lsp-q-i">${ic(g.claimed ? 'medal' : g.done ? 'gift' : 'star', 30)}</div><div class="lsp-q-m"><div>${esc(g.text)}</div><div class="lsp-xp s"><i style="width:${pct}%"></i></div><small>${g.prog} / ${g.n}</small></div>`;
      h += g.done && !g.claimed ? `<button class="lsp-claim" data-act="r4-claim-week" data-id="${esc(g.id)}">${ic('coin', 24)} ${g.coins}</button>` : `<small style="white-space:nowrap">${g.claimed ? 'klaar' : g.coins + ' munten'}</small>`;
      h += '</div>';
    }
    h += `<div class="lsp-q${bonusDone ? ' done' : ''}"><div class="lsp-q-i">${ic('crown', 30)}</div><div class="lsp-q-m"><div>Alle vier klaar: bonus</div></div>`;
    h += all && !bonusDone ? `<button class="lsp-claim" data-act="r4-claim-week" data-id="bonus">${ic('coin', 24)} ${wc.bonus}</button>` : `<small>${bonusDone ? 'klaar' : wc.bonus + ' munten'}</small>`;
    h += '</div></div>';
  }
  return h;
}
export function rankModesHTML(d, mode, api, now = Date.now()) {
  const { esc, ic, fmt, meta } = api; const rows = leaderboard(d, mode, now);
  let h = `<div class="lsp-card2"><b class="lsp-sectitle">${ic('trophy', 32)} Ranglijst</b><div class="lsp-chips">${RANK_MODES.map(([k, l]) => `<button class="lsp-chip${k === mode ? ' on' : ''}" data-act="r4-rank" data-v="${k}">${l}</button>`).join('')}</div>`;
  if (!rows.length) h += `<small>${mode === 'today' ? 'Nog niets gespeeld vandaag. Op naar de eerste plek!' : 'Hier komen je beste scores te staan.'}</small>`;
  else h += rows.map((r, i) => { const m = meta(r.g); return `<div class="lsp-rank"><span class="e">${api.bigIcon(r.g, m, 36)}</span><div class="m"><b>${i + 1}. ${esc(m.name)}</b><small>${esc(r.sub)} · ${esc(new Date(r.t).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }))}</small></div><span class="s">${fmt(r.v)} ${r.win ? ic('trophy', 18) : ''}</span></div>`; }).join('');
  h += `<small>Streak-dagen van de dagelijkse uitdaging: ${d.ds.n} (beste ${d.ds.best}) · ${d.tot.dailies} dagelijkse uitdagingen gehaald</small></div>`;
  return h;
}
