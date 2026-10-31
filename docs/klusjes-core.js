// Klusjes: zuivere logica (weken, planning, niveaus, prijzen, sjablonen, iconen). Geen DOM/Firebase.
export const DAY = 86400000;
export const PROOF_DAYS = 3;
export const KEEP_DONE_DAYS = 30;
export const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const weekKey = (d) => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const n = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - n); const y = t.getUTCFullYear(); return `${y}-W${pad(Math.ceil(((t - Date.UTC(y, 0, 1)) / DAY + 1) / 7))}`; };
export const REPEAT = { none: 'Eenmalig', daily: 'Elke dag', weekly: 'Elke week' };
export const DAY_LONG = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
export const DAY_NL = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
export const dowMon = (d) => (d.getDay() + 6) % 7;
export const startOfDay = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const mondayOf = (t) => { const d = new Date(startOfDay(t)); d.setDate(d.getDate() - dowMon(d)); return d.getTime(); };

// Eerstvolgende datum (23:59) met deze weekdag (0 = maandag), vanaf `from` (vandaag telt mee).
export function nextWeekday(dow, from = Date.now()) {
  const d = new Date(startOfDay(from)); const add = (dow - dowMon(d) + 7) % 7; d.setDate(d.getDate() + add); d.setHours(23, 59, 0, 0); return d.getTime();
}
export function dueState(c, now = Date.now()) {
  if (!c.due) return 'none';
  if (c.due < now) return 'late';
  if (startOfDay(c.due) === startOfDay(now)) return 'today';
  return c.due - now < 3 * DAY ? 'soon' : 'later';
}
// Verdeel open klusjes over de huidige week (ma..zo), "te laat" en "zonder datum".
export function weekPlan(chores, now = Date.now()) {
  const mon = mondayOf(now), days = Array.from({ length: 7 }, (_, i) => ({ i, ts: mon + i * DAY, items: [] })), late = [], later = [], none = [];
  for (const c of chores.filter((x) => x.status === 'open' || x.status === 'review')) {
    if (!c.due) { none.push(c); continue; }
    const s = startOfDay(c.due);
    if (c.due < now && startOfDay(now) > s) late.push(c);
    else if (s >= mon && s < mon + 7 * DAY) { days[Math.round((s - mon) / DAY)].items.push(c); }
    else if (s < mon) late.push(c); else later.push(c);
  }
  days.forEach((d) => d.items.sort((a, b) => a.due - b.due));
  return { days, late, later, none };
}

/* ---------- niveaus ---------- */
export const levelStart = (L) => 25 * L * (L - 1);
export function levelOf(points) { let L = 1; while (levelStart(L + 1) <= (points || 0)) L++; return L; }
export const LEVEL_TITLES = ['Helpertje', 'Klusser', 'Doorzetter', 'Vakman', 'Meester-klusser', 'Huisheld', 'Klusprof', 'Superheld', 'Legende', 'Klus-koning'];
export const levelTitle = (L) => LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, L - 1)];
export const levelIcon = (L) => ['hammer', 'gear', 'shield', 'medal', 'trophy', 'crown', 'gem', 'dragon', 'unicorn', 'rocket'][Math.min(9, L - 1)];
export function levelProgress(points) { const L = levelOf(points), a = levelStart(L), b = levelStart(L + 1); return { level: L, into: (points || 0) - a, need: b - a, pct: Math.round(((points || 0) - a) / (b - a) * 100) }; }

/* ---------- prijzen (afgeleid van de punten die de beheerder bijhoudt) ---------- */
export const BADGES = [
  { id: 'p1', n: 'Eerste punten', d: 'Je eerste taakpunten', ic: 'coin', test: (s) => s.total >= 1 },
  { id: 'p50', n: '50 punten', d: '50 taakpunten verdiend', ic: 'star', test: (s) => s.total >= 50 },
  { id: 'p100', n: '100 punten', d: '100 taakpunten verdiend', ic: 'medal', test: (s) => s.total >= 100 },
  { id: 'p250', n: '250 punten', d: '250 taakpunten verdiend', ic: 'trophy', test: (s) => s.total >= 250 },
  { id: 'p500', n: '500 punten', d: '500 taakpunten verdiend', ic: 'gem', test: (s) => s.total >= 500 },
  { id: 'p1000', n: '1000 punten', d: '1000 taakpunten verdiend', ic: 'crown', test: (s) => s.total >= 1000 },
  { id: 'st3', n: '3 dagen op rij', d: 'Drie dagen achter elkaar een klusje', ic: 'flame', test: (s) => s.streak >= 3 },
  { id: 'st7', n: 'Een week lang', d: 'Zeven dagen achter elkaar', ic: 'bolt', test: (s) => s.streak >= 7 },
  { id: 'st14', n: 'Twee weken!', d: 'Veertien dagen achter elkaar', ic: 'dragon', test: (s) => s.streak >= 14 },
  { id: 'wk30', n: 'Topweek', d: '30 punten in één week', ic: 'rainbow', test: (s) => s.wp >= 30 },
  { id: 'wk75', n: 'Superweek', d: '75 punten in één week', ic: 'unicorn', test: (s) => s.wp >= 75 },
  { id: 'lv5', n: 'Niveau 5', d: 'Bereik niveau 5', ic: 'rocket', test: (s) => levelOf(s.total) >= 5 },
];
export const badgeOf = (id) => BADGES.find((b) => b.id === id);
export function earned(stat, wk) {
  const s = { total: (stat && stat.total) || 0, streak: (stat && stat.streak) || 0, wp: stat && stat.weekKey === wk ? stat.weekPoints || 0 : 0 };
  return BADGES.filter((b) => b.test(s)).map((b) => b.id);
}

/* ---------- iconen en sjablonen ---------- */
const KW = [
  [/vaatwas|afwas|afruim|tafel (dekken|afruimen)|bestek|keuken/i, 'cookie'], [/stofzuig|dweil|vegen|poets|schoon|stoffen/i, 'bell'], [/vuilnis|afval|container|kliko|papier|glas/i, 'bomb'],
  [/hond|uitlaten/i, 'dog'], [/kat|poes|kattenbak/i, 'cat'], [/konijn|cavia|hamster/i, 'rabbit'], [/vis|aquarium/i, 'fish'], [/plant|tuin|gras|water geven|bloem|onkruid/i, 'flower'],
  [/was|kleren|ophangen|strijk|droger/i, 'cloud'], [/bed|slaapkamer|kamer|opruim|speelgoed|lego/i, 'house'], [/boodschap|winkel|brood/i, 'bag'], [/koken|eten|bakken|ontbijt|lunch|soep/i, 'pizza'],
  [/auto|fiets|wassen auto|band/i, 'car'], [/huiswerk|leren|lezen|boek|school/i, 'book'], [/broertje|zusje|oppas|helpen/i, 'heart'], [/sneeuw|schep|blad|bladeren/i, 'leaf'],
];
export function choreIcon(c) {
  if (c && typeof c.icon === 'string' && c.icon) return c.icon;
  const t = (c && c.title) || ''; const hit = KW.find(([re]) => re.test(t)); return hit ? hit[1] : 'hammer';
}
export const ICON_PICK = ['hammer', 'bell', 'cookie', 'bomb', 'dog', 'cat', 'flower', 'cloud', 'house', 'bag', 'pizza', 'car', 'book', 'heart', 'leaf', 'gear', 'paint', 'star'];
export const MILE_ICONS = ['gift', 'pizza', 'icecream', 'ticket', 'camera', 'car', 'cake', 'ferriswheel', 'balloon', 'puzzle', 'chest', 'money', 'headphones', 'rocket'];
// [titel, punten, icoon, herhaling]
export const CHORE_TEMPLATES = [
  { id: 'keuken', n: 'Keuken', ic: 'cookie', items: [['Tafel dekken', 3, 'cookie', 'daily'], ['Tafel afruimen', 3, 'cookie', 'daily'], ['Vaatwasser uitruimen', 5, 'cookie', 'daily'], ['Afwassen', 6, 'cookie', 'none']] },
  { id: 'huis', n: 'In huis', ic: 'house', items: [['Eigen kamer opruimen', 8, 'house', 'weekly'], ['Stofzuigen', 10, 'bell', 'weekly'], ['Bed opmaken', 2, 'house', 'daily'], ['Wasmand wegbrengen', 3, 'cloud', 'weekly'], ['Wasgoed opvouwen', 6, 'cloud', 'none']] },
  { id: 'buiten', n: 'Buiten', ic: 'tree', items: [['Vuilnis buiten zetten', 5, 'bomb', 'weekly'], ['Papier naar de container', 4, 'bomb', 'none'], ['Planten water geven', 4, 'flower', 'weekly'], ['Tuinwerk', 12, 'leaf', 'none'], ['Fiets of auto wassen', 12, 'car', 'none']] },
  { id: 'dieren', n: 'Dieren', ic: 'dog', items: [['Hond uitlaten', 6, 'dog', 'daily'], ['Dieren eten geven', 3, 'cat', 'daily'], ['Kattenbak schoonmaken', 5, 'cat', 'weekly']] },
  { id: 'extra', n: 'Extra', ic: 'star', items: [['Boodschappen halen', 8, 'bag', 'none'], ['Helpen met koken', 6, 'pizza', 'none'], ['Oppassen op broertje of zusje', 10, 'heart', 'none'], ['Iets extra\'s dat opvalt', 10, 'star', 'none']] },
];

/* ---------- scorebord en beloningen ---------- */
export function ranking(stats, wk, key) {
  return stats.map((x) => ({ ...x, wp: x.weekKey === wk ? x.weekPoints || 0 : 0 })).sort((a, b) => (b[key] || 0) - (a[key] || 0) || String(a.name).localeCompare(String(b.name)));
}
// Eerstvolgende beloning die nog niet geclaimd is.
export function nextMilestone(miles, claims, total) {
  return miles.find((m) => !claims.some((c) => c.milestone === m.id) && m.need > total) || null;
}
export const claimable = (miles, claims, total) => miles.filter((m) => total >= m.need && !claims.some((c) => c.milestone === m.id));
export function cheerKid(open, done) {
  if (!open && !done) return 'Geen klusjes. Lekker rustig! 🌿';
  if (!open) return 'Alles gedaan, wat een held! 🎉';
  if (open === 1) return 'Nog één klusje en je bent klaar. Jij kan dit!';
  return `Nog ${open} klusjes. Eén voor één lukt het wel! 💪`;
}
