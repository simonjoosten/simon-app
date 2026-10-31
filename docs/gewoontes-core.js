// Gewoontes: zuivere logica (datums, reeksen, planning, XP/niveaus, prijzen, statistieken, sjablonen, opslagformaat).
export const KEEP_DAYS = 120;
export const MAX_JSON = 40000;
export const MAX_HABITS = 24;

const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); };
export const shiftKey = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dayKey(d); };
export const dow = (k) => (parseKey(k).getDay() + 6) % 7; // maandag = 0
export const DAY_NAMES = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

export const COLORS = [['#8fc9a9', 'Mint'], ['#8dbbe0', 'Lucht'], ['#f2b8a2', 'Perzik'], ['#c9b3e6', 'Lila'], ['#f0d98c', 'Zand'], ['#f0a9c0', 'Roze'], ['#7dd3fc', 'Ijs'], ['#fdba74', 'Oranje']];
export const EMOJI = ['💧', '📖', '🏃', '😴', '🧘', '🥗', '🚶', '🎸', '✍️', '🦷', '🌞', '🧹', '🍎', '🐕', '🎨', '💊', '🧠', '🚴', '🛏️', '☕', '📵', '🌿', '🙏', '💪'];
// 3D-iconen die bij gewoontes passen (namen uit docs/gfx/icons.js)
export const ICON_CHOICES = ['milk', 'book', 'bike', 'moon', 'apple', 'carrot', 'banana', 'strawberry', 'dog', 'cat', 'rabbit', 'flower', 'leaf', 'tree', 'sun', 'guitar', 'piano', 'drum', 'microphone', 'headphones', 'paint', 'pencil', 'camera', 'hammer', 'house', 'trophy', 'star', 'heart', 'bolt', 'flame', 'potion', 'lightbulb', 'bell', 'gear', 'flask', 'globe', 'compass', 'tent', 'boat', 'plane'];

// Sjablonen per categorie: [naam, 3D-icoon, kleurindex, dagen (leeg = elke dag), notitie]
export const TEMPLATE_GROUPS = [
  { id: 'gezond', n: 'Gezond', ic: 'apple', items: [['Water drinken', 'milk', 1, [], '8 glazen per dag'], ['Fruit eten', 'apple', 2, [], ''], ['Groente eten', 'carrot', 0, [], ''], ['Tanden poetsen (avond)', 'star', 6, [], ''], ['Vroeg naar bed', 'moon', 3, [], 'Voor 21:30'], ['Ontbijten', 'egg', 4, [], '']] },
  { id: 'sport', n: 'Sport', ic: 'trophy', items: [['Bewegen', 'bike', 7, [], '30 minuten'], ['Hardlopen', 'bolt', 2, [0, 2, 4], ''], ['Buitenspelen', 'tree', 0, [], ''], ['Zwemmen', 'wave', 6, [5], ''], ['Stretchen', 'flower', 5, [], '5 minuten']] },
  { id: 'school', n: 'School', ic: 'school', items: [['Huiswerk maken', 'pencil', 1, [0, 1, 2, 3], ''], ['Lezen', 'book', 4, [], '20 minuten'], ['Woordjes leren', 'scroll', 3, [0, 2, 4], ''], ['Tas inpakken', 'bag', 7, [0, 1, 2, 3], 'Avond ervoor'], ['Oefenen met rekenen', 'dice', 1, [1, 3], '']] },
  { id: 'creatief', n: 'Creatief', ic: 'paint', items: [['Gitaar oefenen', 'guitar', 7, [], '15 minuten'], ['Piano oefenen', 'piano', 3, [], ''], ['Tekenen', 'paint', 5, [], ''], ['Iets bouwen of maken', 'hammer', 4, [5, 6], ''], ['Schrijven of dagboek', 'pencil', 6, [], '']] },
  { id: 'thuis', n: 'Thuis', ic: 'house', items: [['Kamer opruimen', 'house', 0, [5], ''], ['Bed opmaken', 'bell', 3, [], ''], ['Hond uitlaten', 'dog', 7, [], ''], ['Planten water geven', 'leaf', 0, [2, 5], ''], ['Helpen met koken', 'pizza', 2, [], '']] },
  { id: 'rust', n: 'Rust & geluk', ic: 'heart', items: [['Even stilstaan', 'flower', 3, [], '5 minuten ademen'], ['Iets aardigs doen', 'heart', 5, [], ''], ['Dankbaarheid', 'star', 4, [], 'Drie fijne dingen'], ['Schermloos uurtje', 'moon', 6, [], ''], ['Buiten wandelen', 'sun', 1, [], '']] },
];
export const STARTERS = TEMPLATE_GROUPS.flatMap((g) => g.items).slice(0, 6);

/* ---------- planning en reeksen ---------- */
export const isDue = (h, key) => !h.sched || !h.sched.length || h.sched.includes(dow(key));
export const schedText = (h) => { const s = h.sched || []; if (!s.length || s.length === 7) return 'elke dag'; if (s.join() === '0,1,2,3,4') return 'op schooldagen'; if (s.join() === '5,6') return 'in het weekend'; return s.map((i) => DAY_NAMES[i]).join(' · '); };

// Oorspronkelijke streak (elke dag): tel vandaag mee als die gedaan is, anders vanaf gisteren.
export function streakOf(days, todayKey) {
  days = days || {};
  let k = days[todayKey] ? todayKey : shiftKey(todayKey, -1), n = 0;
  while (days[k]) { n++; k = shiftKey(k, -1); }
  return n;
}
// Langste reeks opeenvolgende dagen.
export function bestStreak(days) {
  const keys = Object.keys(days || {}).filter((k) => days[k]).sort();
  let best = 0, cur = 0, prev = null;
  for (const k of keys) { cur = prev && shiftKey(prev, 1) === k ? cur + 1 : 1; if (cur > best) best = cur; prev = k; }
  return best;
}
// Reeks die rekening houdt met het schema: dagen waarop de gewoonte niet hoeft, tellen niet mee en breken niets.
export function streakSched(h, todayKey) {
  const days = h.days || {}; let k = todayKey, n = 0, guard = 0;
  if (isDue(h, k) && !days[k]) k = shiftKey(k, -1);
  while (guard++ < 400) {
    if (isDue(h, k)) { if (days[k]) n++; else break; }
    k = shiftKey(k, -1);
    if (k < (h.created ? dayKey(new Date(h.created - 400 * 86400000)) : '0000')) break;
  }
  return n;
}
export function bestSched(h) {
  const keys = Object.keys(h.days || {}).filter((k) => h.days[k]).sort(); if (!keys.length) return 0;
  let best = 0, cur = 0, prev = null;
  for (const k of keys) {
    if (prev) { let g = shiftKey(prev, 1), ok = true; while (g < k) { if (isDue(h, g)) { ok = false; break; } g = shiftKey(g, 1); } cur = ok ? cur + 1 : 1; } else cur = 1;
    if (cur > best) best = cur; prev = k;
  }
  return best;
}
export const doneTotal = (h) => Object.keys(h.days || {}).filter((k) => h.days[k]).length;

// Percentage gehaald over de laatste n dagen (alleen dagen dat het moest, vanaf de aanmaakdatum).
export function rate(h, todayKey, n = 30) {
  let due = 0, done = 0; const start = h.created ? dayKey(new Date(h.created)) : '0000';
  for (let i = 0; i < n; i++) { const k = shiftKey(todayKey, -i); if (k < start || !isDue(h, k)) continue; due++; if (h.days[k]) done++; }
  return due ? Math.round(done / due * 100) : 0;
}
// Voor elke weekdag: hoeveel keer gedaan in de laatste `weeks` weken.
export function weekdayCounts(habits, todayKey, weeks = 12) {
  const out = Array(7).fill(0);
  for (let i = 0; i < weeks * 7; i++) { const k = shiftKey(todayKey, -i); const w = dow(k); habits.forEach((h) => { if (h.days[k]) out[w]++; }); }
  return out;
}
// Heatmap: kolommen = weken (oud -> nieuw), rijen = ma..zo; waarde 0..1 (aandeel gedaan van wat moest), -1 = toekomst, -2 = niets te doen.
export function heatmap(habits, todayKey, weeks = 12) {
  const start = shiftKey(todayKey, -(dow(todayKey) + (weeks - 1) * 7)); const cols = [];
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const k = shiftKey(start, w * 7 + d);
      if (k > todayKey) { col.push(-1); continue; }
      const due = habits.filter((h) => isDue(h, k) && (!h.created || k >= dayKey(new Date(h.created - 86400000))));
      col.push(due.length ? due.filter((h) => h.days[k]).length / due.length : -2);
    }
    cols.push(col);
  }
  return cols;
}
export function dayStatus(habits, key) { const due = habits.filter((h) => isDue(h, key)); return { due: due.length, done: due.filter((h) => h.days[key]).length }; }
export const isPerfect = (habits, key) => { const s = dayStatus(habits, key); return s.due >= 2 && s.done === s.due; };
export function perfectRun(habits, todayKey) { let n = 0, k = todayKey; if (!isPerfect(habits, k)) k = shiftKey(k, -1); while (n < 400 && isPerfect(habits, k)) { n++; k = shiftKey(k, -1); } return n; }

/* ---------- XP, niveaus en prijzen ---------- */
export const xpGain = (streakAfter) => 10 + Math.min(10, Math.max(0, streakAfter));
export const levelStart = (L) => 50 * L * (L - 1); // totaal XP waarop level L begint
export function levelOf(xp) { let L = 1; while (levelStart(L + 1) <= xp) L++; return L; }
export const LEVEL_TITLES = ['Beginner', 'Starter', 'Doorzetter', 'Volhouder', 'Vaste waarde', 'Kampioen', 'Meester', 'Held', 'Legende', 'Superster'];
export const levelTitle = (L) => LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, L - 1)];
export const levelIcon = (L) => ['star', 'bolt', 'shield', 'medal', 'trophy', 'crown', 'gem', 'dragon', 'unicorn', 'rocket'][Math.min(9, L - 1)];
export function levelProgress(xp) { const L = levelOf(xp), a = levelStart(L), b = levelStart(L + 1); return { level: L, into: xp - a, need: b - a, pct: Math.round((xp - a) / (b - a) * 100) }; }

export const BADGES = [
  { id: 'first', n: 'Eerste vinkje', d: 'Vink je eerste gewoonte af', ic: 'star' },
  { id: 's3', n: '3 dagen op rij', d: 'Een reeks van 3', ic: 'flame' },
  { id: 's7', n: 'Een hele week', d: 'Een reeks van 7', ic: 'medal' },
  { id: 's14', n: 'Twee weken!', d: 'Een reeks van 14', ic: 'shield' },
  { id: 's30', n: 'Een maand lang', d: 'Een reeks van 30', ic: 'trophy' },
  { id: 's60', n: 'Onverslaanbaar', d: 'Een reeks van 60', ic: 'gem' },
  { id: 's100', n: 'Honderd dagen', d: 'Een reeks van 100', ic: 'crown' },
  { id: 'perfect', n: 'Perfecte dag', d: 'Alles gedaan op één dag (minstens 2 gewoontes)', ic: 'rainbow' },
  { id: 'perfect7', n: 'Perfecte week', d: '7 perfecte dagen achter elkaar', ic: 'unicorn' },
  { id: 'c50', n: '50 vinkjes', d: 'In totaal 50 keer afgevinkt', ic: 'coin' },
  { id: 'c250', n: '250 vinkjes', d: 'In totaal 250 keer afgevinkt', ic: 'money' },
  { id: 'c1000', n: '1000 vinkjes', d: 'In totaal 1000 keer afgevinkt', ic: 'chest' },
  { id: 'five', n: 'Vijf gewoontes', d: 'Bouw vijf gewoontes op', ic: 'puzzle' },
  { id: 'l5', n: 'Niveau 5', d: 'Bereik niveau 5', ic: 'rocket' },
  { id: 'l10', n: 'Niveau 10', d: 'Bereik niveau 10', ic: 'planet' },
];
export const badgeOf = (id) => BADGES.find((b) => b.id === id);
// Welke prijzen zijn nu verdiend? (afgeleid van de gegevens; de aanroeper vergelijkt met wat al bewaard is)
export function earnedBadges(habits, meta, todayKey) {
  const out = new Set(); const m = meta || {};
  const checks = Math.max(m.checks || 0, habits.reduce((a, h) => a + doneTotal(h), 0));
  if (checks >= 1) out.add('first');
  const best = habits.reduce((a, h) => Math.max(a, streakSched(h, todayKey), bestSched(h)), 0);
  [3, 7, 14, 30, 60, 100].forEach((n) => { if (best >= n) out.add('s' + n); });
  if (isPerfect(habits, todayKey)) out.add('perfect');
  if (perfectRun(habits, todayKey) >= 7) out.add('perfect7');
  [50, 250, 1000].forEach((n) => { if (checks >= n) out.add('c' + n); });
  if (habits.length >= 5) out.add('five');
  const L = levelOf(m.xp || 0); if (L >= 5) out.add('l5'); if (L >= 10) out.add('l10');
  return [...out];
}

/* ---------- opslag ---------- */
function trimDays(days, keep) { const keys = Object.keys(days || {}).filter((k) => days[k]).sort().slice(-keep); const out = {}; keys.forEach((k) => { out[k] = 1; }); return out; }
export function serialize(habits, meta) {
  let keep = KEEP_DAYS, s;
  for (;;) {
    s = JSON.stringify({ habits: habits.map((h) => ({ ...h, days: trimDays(h.days, keep) })), meta: meta || {} });
    if (s.length < MAX_JSON || keep <= 7) break;
    keep = Math.max(7, keep - 15);
  }
  return s;
}
export const defaultMeta = () => ({ xp: 0, checks: 0, badges: [], seen: {}, perfectDay: '' });
export function parseAll(str) {
  try {
    const o = JSON.parse(str);
    const habits = (o.habits || []).filter((h) => h && h.id).map((h) => ({
      id: String(h.id), name: String(h.name || '').slice(0, 40), emoji: h.emoji || '⭐', icon: typeof h.icon === 'string' ? h.icon.slice(0, 20) : '', color: h.color || COLORS[0][0],
      sched: Array.isArray(h.sched) ? h.sched.filter((x) => Number.isInteger(x) && x >= 0 && x <= 6) : [], note: typeof h.note === 'string' ? h.note.slice(0, 60) : '',
      days: h.days && typeof h.days === 'object' ? h.days : {}, created: h.created || Date.now(),
    }));
    return { habits, meta: { ...defaultMeta(), ...(o.meta && typeof o.meta === 'object' ? o.meta : {}) } };
  } catch (e) { return null; }
}
export const parse = (str) => { const r = parseAll(str); return r ? r.habits : null; };

export function cheer(done, total) {
  if (!total) return 'Voeg je eerste gewoonte toe, klein beginnen is prima.';
  if (done === 0) return 'Een rustig begin: kies er één en start klein. 🌱';
  if (done === total) return 'Alles gedaan voor vandaag, mooi gedaan! 🎉';
  const p = done / total;
  if (p < 0.5) return 'Goed bezig, elke stap telt. 🌿';
  return 'Meer dan de helft al, bijna daar! ☀️';
}
export const MILESTONES = [7, 14, 30, 60, 100, 200, 365];
// Is dit precies een nieuwe mijlpaal van de reeks?
export const milestoneHit = (n) => MILESTONES.includes(n);
