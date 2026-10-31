// Agenda: zuivere logica (datums, herhalingen, feestdagen, categorieën, rooster, herinneringen). Geen DOM/Firebase.
export const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (k) => { const [y, m, d] = String(k).split('-').map(Number); return { y, m, d }; };
export const keyDate = (k) => { const { y, m, d } = parseKey(k); return new Date(y, m - 1, d, 12); };
export const utcDays = (k) => { const { y, m, d } = parseKey(k); return Math.round(Date.UTC(y, m - 1, d) / 86400000); };
export const addDays = (k, n) => { const { y, m, d } = parseKey(k); return ymd(new Date(y, m - 1, d + n)); };
export const diffDays = (a, b) => utcDays(b) - utcDays(a);
export const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

export const MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
export const DAYS_SHORT = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
export const DAYS_LONG = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
export const PALETTE = ['#9fb8d6', '#a8cdb5', '#e8c79a', '#e5a9a9', '#c3b1d9', '#e6d98f']; // oude kleuren blijven geldig
export const REPEAT = { none: 'Eenmalig', weekly: 'Elke week', yearly: 'Elk jaar' };

// Categorie = kleur (er is geen apart veld in de opslag). De eerste zes kleuren zijn de oude paletkleuren.
export const CATS = [
  { id: 'afspraak', n: 'Afspraak', c: '#9fb8d6', ic: 'bell' },
  { id: 'familie', n: 'Familie', c: '#a8cdb5', ic: 'house' },
  { id: 'school', n: 'School', c: '#e8c79a', ic: 'school' },
  { id: 'sport', n: 'Sport', c: '#e5a9a9', ic: 'trophy' },
  { id: 'feest', n: 'Feest', c: '#c3b1d9', ic: 'balloon' },
  { id: 'verjaardag', n: 'Verjaardag', c: '#e6d98f', ic: 'cake' },
  { id: 'huiswerk', n: 'Huiswerk/toets', c: '#7dd3c0', ic: 'book' },
  { id: 'uitje', n: 'Uitje', c: '#f2a65a', ic: 'car' },
  { id: 'vrienden', n: 'Vrienden', c: '#f09ac4', ic: 'heart' },
  { id: 'hobby', n: 'Hobby/muziek', c: '#8aa4f0', ic: 'note' },
];
export const colorOf = (c) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : PALETTE[0]);
export const catOf = (c) => CATS.find((x) => x.c.toLowerCase() === String(c || '').toLowerCase()) || CATS[0];

// Komt de afspraak voor op deze dag? (yearly op 29 feb valt in niet-schrikkeljaren op 28 feb.)
export function occursOn(ev, key) {
  if (!ev || !ev.date || !key) return false;
  if (ev.repeat === 'weekly') return key >= ev.date && (utcDays(key) - utcDays(ev.date)) % 7 === 0;
  if (ev.repeat === 'yearly') {
    if (key < ev.date) return false;
    const a = parseKey(ev.date), b = parseKey(key);
    if (a.m === 2 && a.d === 29 && !isLeap(b.y)) return b.m === 2 && b.d === 28;
    return a.m === b.m && a.d === b.d;
  }
  return ev.date === key;
}

// Raster van volledige weken (ma t/m zo) voor een maand; month is 0-11 (zoals Date).
export function monthGrid(year, month) {
  const first = new Date(year, month, 1), offset = (first.getDay() + 6) % 7;
  const count = Math.ceil((offset + new Date(year, month + 1, 0).getDate()) / 7) * 7;
  const cells = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(year, month, 1 - offset + i);
    cells.push({ key: ymd(d), day: d.getDate(), inMonth: d.getMonth() === month });
  }
  const weeks = []; for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export const byTime = (a, b) => (a.time || '').localeCompare(b.time || '') || (a.title || '').localeCompare(b.title || '');
export const dowMon = (k) => (keyDate(k).getDay() + 6) % 7; // maandag = 0
export const weekStart = (k) => addDays(k, -dowMon(k));
export const weekDays = (k) => { const s = weekStart(k); return Array.from({ length: 7 }, (_, i) => addDays(s, i)); };
export const longDate = (k) => { const { y, m, d } = parseKey(k); return `${DAYS_LONG[new Date(y, m - 1, d).getDay()]} ${d} ${MONTHS[m - 1]}`; };
export const shortDate = (k) => { const { m, d } = parseKey(k); return `${d} ${MONTHS[m - 1].slice(0, 3)}`; };

// ISO-weeknummer
export function weekNr(k) {
  const d = keyDate(k); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const n = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - n); const y0 = Date.UTC(t.getUTCFullYear(), 0, 1);
  return Math.ceil(((t - y0) / 86400000 + 1) / 7);
}

export function countdownText(n) {
  if (n === 0) return 'vandaag'; if (n === 1) return 'morgen'; if (n === -1) return 'gisteren';
  return n > 0 ? `over ${n} dagen` : `${-n} dagen geleden`;
}

/* ---------- feestdagen ---------- */
export function easter(y) { // Gregoriaans (Meeus/Jones/Butcher)
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${y}-${pad(month)}-${pad(day)}`;
}
const nthSunday = (y, m, n) => { const first = ymd(new Date(y, m - 1, 1)); const off = (7 - keyDate(first).getDay()) % 7; return addDays(first, off + 7 * (n - 1)); };
export function holidays(y) {
  const e = easter(y); const ko = ymd(new Date(y, 3, 27)); const kd = keyDate(ko).getDay() === 0 ? `${y}-04-26` : ko;
  return [
    { date: `${y}-01-01`, title: 'Nieuwjaarsdag', ic: 'star', free: true },
    { date: `${y}-02-14`, title: 'Valentijnsdag', ic: 'heart' },
    { date: addDays(e, -2), title: 'Goede Vrijdag', ic: 'bell' },
    { date: e, title: 'Eerste Paasdag', ic: 'egg', free: true },
    { date: addDays(e, 1), title: 'Tweede Paasdag', ic: 'egg', free: true },
    { date: kd, title: 'Koningsdag', ic: 'crown', free: true },
    { date: `${y}-05-04`, title: 'Dodenherdenking', ic: 'flag' },
    { date: `${y}-05-05`, title: 'Bevrijdingsdag', ic: 'flag' },
    { date: nthSunday(y, 5, 2), title: 'Moederdag', ic: 'flower' },
    { date: addDays(e, 39), title: 'Hemelvaartsdag', ic: 'cloud', free: true },
    { date: addDays(e, 49), title: 'Eerste Pinksterdag', ic: 'balloon', free: true },
    { date: addDays(e, 50), title: 'Tweede Pinksterdag', ic: 'balloon', free: true },
    { date: nthSunday(y, 6, 3), title: 'Vaderdag', ic: 'trophy' },
    { date: `${y}-10-31`, title: 'Halloween', ic: 'ghost' },
    { date: `${y}-11-11`, title: 'Sint-Maarten', ic: 'flame' },
    { date: `${y}-12-05`, title: 'Pakjesavond', ic: 'gift' },
    { date: `${y}-12-06`, title: 'Sinterklaas', ic: 'gift' },
    { date: `${y}-12-25`, title: 'Eerste Kerstdag', ic: 'pine', free: true },
    { date: `${y}-12-26`, title: 'Tweede Kerstdag', ic: 'pine', free: true },
    { date: `${y}-12-31`, title: 'Oudejaarsdag', ic: 'balloon' },
  ].sort((a, b) => (a.date < b.date ? -1 : 1));
}
export const holidayOn = (key) => holidays(parseKey(key).y).filter((h) => h.date === key);

/* ---------- verjaardagen ---------- */
export const isBirthday = (e) => e && e.repeat === 'yearly' && (/^🎂/.test(e.title || '') || catOf(e.color).id === 'verjaardag');
export const bdayName = (title) => String(title || '').replace(/^🎂\s*/, '').trim();
// Eerstvolgende voorkomen op of na `from` van een jaarlijkse afspraak.
export function nextYearly(ev, from) {
  const a = parseKey(ev.date), fy = parseKey(from).y;
  for (let y = fy; y <= fy + 1; y++) {
    let d = a.d; if (a.m === 2 && a.d === 29 && !isLeap(y)) d = 28;
    const k = `${y}-${pad(a.m)}-${pad(d)}`;
    if (k >= from && k >= ev.date) return k;
  }
  return null;
}
export function upcomingBirthdays(events, from, limit = 12) {
  const out = [];
  for (const e of events) {
    if (!isBirthday(e)) continue;
    const k = nextYearly(e, from); if (!k) continue;
    const years = parseKey(k).y - parseKey(e.date).y; // alleen zinvol als de datum de geboortedatum is
    out.push({ ev: e, key: k, days: diffDays(from, k), name: bdayName(e.title), turns: years > 0 && years < 120 ? years : null });
  }
  return out.sort((a, b) => a.days - b.days || a.name.localeCompare(b.name)).slice(0, limit);
}

/* ---------- tijd en dagoverzicht ---------- */
export const toMin = (t) => { const m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return m ? Math.min(1439, +m[1] * 60 + +m[2]) : null; };
export const fromMin = (n) => `${pad(Math.floor(n / 60) % 24)}:${pad(n % 60)}`;
// Plaatst afspraken met tijd op een dag-tijdlijn (1 uur lang als er geen eindtijd is) en geeft kolommen bij overlap.
export function dayLayout(list, dur = 60) {
  const timed = list.filter((e) => toMin(e.time) != null).map((e) => ({ e, s: toMin(e.time), t: toMin(e.time) + dur })).sort((a, b) => a.s - b.s);
  const cols = []; const out = [];
  for (const it of timed) {
    let c = cols.findIndex((end) => end <= it.s); if (c < 0) { c = cols.length; cols.push(0); }
    cols[c] = it.t; out.push({ ...it, col: c });
  }
  // aantal kolommen per overlappende groep
  for (const it of out) it.n = Math.max(...out.filter((o) => o.s < it.t && o.t > it.s).map((o) => o.col)) + 1;
  return { timed: out, untimed: list.filter((e) => toMin(e.time) == null) };
}

/* ---------- herinneringen ---------- */
export const REM_OPTIONS = [[0, 'Op tijd'], [10, '10 minuten ervoor'], [30, '30 minuten ervoor'], [60, '1 uur ervoor'], [1440, '1 dag ervoor']];
// remMap: eventId -> minuten; fired: object met "id|dag" -> true. Geeft de herinneringen die nu af moeten gaan.
export function dueReminders(events, now, remMap, fired) {
  const out = []; const today = ymd(now); const nowMin = now.getHours() * 60 + now.getMinutes();
  for (const e of events) {
    const m = remMap[e.id]; if (m == null) continue;
    const t = toMin(e.time);
    // 1 dag ervoor: morgen op dezelfde tijd valt de afspraak (of de hele dag): vanaf nu tot de afspraak
    for (const k of [today, addDays(today, 1)]) {
      if (!occursOn(e, k)) continue;
      const startAbs = diffDays(today, k) * 1440 + (t == null ? 480 : t); // zonder tijd: 08:00
      const trigger = startAbs - m;
      const id = `${e.id}|${k}`;
      if (nowMin >= trigger && nowMin < startAbs + 30 && !fired[id]) out.push({ id, ev: e, key: k, minutes: startAbs - nowMin });
    }
  }
  return out;
}

/* ---------- sjablonen ---------- */
export const TEMPLATES = [
  { n: 'Verjaardag', title: '🎂 ', cat: 'verjaardag', repeat: 'yearly', time: '' },
  { n: 'Sporttraining', title: 'Training', cat: 'sport', repeat: 'weekly', time: '18:30' },
  { n: 'Toets', title: 'Toets ', cat: 'huiswerk', repeat: 'none', time: '' },
  { n: 'Huiswerk', title: 'Huiswerk maken', cat: 'huiswerk', repeat: 'none', time: '16:00' },
  { n: 'Afspreken', title: 'Afspreken met ', cat: 'vrienden', repeat: 'none', time: '14:00' },
  { n: 'Logeren', title: 'Logeren bij ', cat: 'vrienden', repeat: 'none', time: '' },
  { n: 'Tandarts', title: 'Tandarts', cat: 'afspraak', repeat: 'none', time: '' },
  { n: 'Muziekles', title: 'Muziekles', cat: 'hobby', repeat: 'weekly', time: '16:00' },
  { n: 'Uitje', title: 'Uitje naar ', cat: 'uitje', repeat: 'none', time: '10:00' },
  { n: 'Familiedag', title: 'Familiedag', cat: 'familie', repeat: 'none', time: '' },
  { n: 'Feestje', title: 'Feestje van ', cat: 'feest', repeat: 'none', time: '15:00' },
  { n: 'Schoolreisje', title: 'Schoolreisje', cat: 'school', repeat: 'none', time: '08:30' },
];
export const catById = (id) => CATS.find((c) => c.id === id) || CATS[0];

/* ---------- rooster (lokaal) ---------- */
export const SUBJECTS = [
  { id: 'wi', n: 'Wiskunde', c: '#60a5fa', ic: 'gear' }, { id: 'ne', n: 'Nederlands', c: '#f87171', ic: 'book' },
  { id: 'en', n: 'Engels', c: '#a78bfa', ic: 'globe' }, { id: 'fr', n: 'Frans', c: '#f472b6', ic: 'flag' },
  { id: 'gs', n: 'Geschiedenis', c: '#d6a35f', ic: 'scroll' }, { id: 'ak', n: 'Aardrijkskunde', c: '#34d399', ic: 'earth' },
  { id: 'bi', n: 'Biologie', c: '#4ade80', ic: 'leaf' }, { id: 'na', n: 'Natuurkunde', c: '#22d3ee', ic: 'flask' },
  { id: 'sk', n: 'Scheikunde', c: '#2dd4bf', ic: 'potion' }, { id: 'ku', n: 'Kunst', c: '#fb923c', ic: 'paint' },
  { id: 'mu', n: 'Muziek', c: '#c084fc', ic: 'note' }, { id: 'lo', n: 'Gym', c: '#f59e0b', ic: 'trophy' },
  { id: 'in', n: 'Informatica', c: '#38bdf8', ic: 'robot' }, { id: 'ts', n: 'Tussenuur', c: '#94a3b8', ic: 'hourglass' },
  { id: 'mk', n: 'Mentor', c: '#fbbf24', ic: 'bell' }, { id: 'ov', n: 'Overig', c: '#9ca3af', ic: 'star' },
];
export const subjectOf = (id) => SUBJECTS.find((s) => s.id === id) || null;
export const PERIOD_START = ['08:30', '09:20', '10:25', '11:15', '12:25', '13:15', '14:20', '15:10', '16:00'];
export const PERIOD_MIN = 50;
export const emptyRooster = () => ({ days: Array.from({ length: 5 }, () => Array(9).fill('')) });
export function cleanRooster(r) {
  const base = emptyRooster(); if (!r || !Array.isArray(r.days)) return base;
  r.days.slice(0, 5).forEach((d, i) => { if (Array.isArray(d)) d.slice(0, 9).forEach((v, j) => { if (subjectOf(v)) base.days[i][j] = v; }); });
  return base;
}
// Welke les is er nu / straks? date = Date. Weekend: geen.
export function lessonNow(r, date) {
  const dow = (date.getDay() + 6) % 7; if (dow > 4) return { cur: null, next: null };
  const mins = date.getHours() * 60 + date.getMinutes(); let cur = null, next = null;
  r.days[dow].forEach((s, j) => {
    if (!s) return; const a = toMin(PERIOD_START[j]), b = a + PERIOD_MIN;
    if (mins >= a && mins < b) cur = { p: j + 1, id: s, from: PERIOD_START[j], to: fromMin(b) };
    else if (mins < a && !next) next = { p: j + 1, id: s, from: PERIOD_START[j], to: fromMin(b) };
  });
  return { cur, next };
}
export const lessonsLeft = (r, date) => { const dow = (date.getDay() + 6) % 7; if (dow > 4) return 0; const mins = date.getHours() * 60 + date.getMinutes(); return r.days[dow].filter((s, j) => s && toMin(PERIOD_START[j]) + PERIOD_MIN > mins).length; };

/* ---------- zoeken ---------- */
export function searchEvents(events, term) {
  const t = String(term || '').trim().toLowerCase(); if (!t) return [];
  return events.filter((e) => `${e.title || ''} ${e.note || ''} ${e.byName || ''}`.toLowerCase().includes(t)).sort((a, b) => (a.date < b.date ? -1 : 1));
}

// Komende afspraken (met datum) vanaf `from`, maximaal `days` vooruit.
export function upcomingList(events, from, days = 30, limit = 40) {
  const out = [];
  for (let i = 0; i < days; i++) { const k = addDays(from, i); for (const e of events.filter((x) => occursOn(x, k)).sort(byTime)) out.push({ key: k, ev: e }); if (out.length >= limit) break; }
  return out.slice(0, limit);
}
