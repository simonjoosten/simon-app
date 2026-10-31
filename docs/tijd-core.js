// Tijd: pure logica (geen DOM): opmaak, wekker-berekening, klok-vragen, tijdzones, zonnestand voor de globe,
// aftellen naar gebeurtenissen, interval-schema's en een schaakklok.
const pad = (n) => String(n).padStart(2, '0');
export const pad2 = pad;

/** Formatteer milliseconden als mm:ss, of hh:mm:ss vanaf een uur. Rondt naar beneden af. */
export function fmt(ms) {
  const s = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`;
}
/** Stopwatch-formaat mm:ss.cc (honderdsten). */
export function fmtCs(ms) {
  const t = Math.max(0, Math.floor((Number(ms) || 0) / 10));
  const cs = t % 100, s = Math.floor(t / 100);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return `${h > 0 ? pad(h) + ':' : ''}${pad(m)}:${pad(r)}.${pad(cs)}`;
}
/**
 * Eerstvolgende afgaan van een wekker, strikt na nowDate. alarm = { time:'HH:MM', days:[0..6] } met 0 = zondag.
 * Lege days = elke dag/eenmalig het eerstvolgende moment. Geeft Date of null bij ongeldige tijd.
 */
export function nextAlarmTime(alarm, nowDate) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String((alarm && alarm.time) || ''));
  if (!m) return null;
  const h = +m[1], mi = +m[2];
  if (h > 23 || mi > 59) return null;
  const days = Array.isArray(alarm.days) ? alarm.days.filter((d) => d >= 0 && d <= 6) : [];
  const now = nowDate instanceof Date ? nowDate : new Date(nowDate);
  for (let i = 0; i <= 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, h, mi, 0, 0);
    if (d.getTime() > now.getTime() && (!days.length || days.includes(d.getDay()))) return d;
  }
  return null;
}

/* ---------- kalender ---------- */
export function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return { week: Math.ceil(((t - y0) / 864e5 + 1) / 7), year: t.getUTCFullYear() };
}
export function dayOfYear(d) { return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 864e5); }
export function easter(year) { // Gregoriaans (Meeus/Jones/Butcher)
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, mo - 1, da);
}
export const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

/* ---------- Nederlandse kloktijd ---------- */
const NW = ['nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf', 'dertien', 'veertien'];
const hw = (h) => NW[((h + 11) % 12) + 1];
/** 14:15 -> "kwart over twee". */
export function dutchTime(h, m) {
  h = ((h % 24) + 24) % 24; m = ((m % 60) + 60) % 60;
  const nx = h + 1;
  if (m === 0) return `${hw(h)} uur`;
  if (m === 15) return `kwart over ${hw(h)}`;
  if (m === 30) return `half ${hw(nx)}`;
  if (m === 45) return `kwart voor ${hw(nx)}`;
  if (m < 15) return `${NW[m]} over ${hw(h)}`;
  if (m < 30) return `${NW[30 - m]} voor half ${hw(nx)}`;
  if (m < 45) return `${NW[m - 30]} over half ${hw(nx)}`;
  return `${NW[60 - m]} voor ${hw(nx)}`;
}
export const digital = (h, m) => `${pad(h)}:${pad(m)}`;
/** Hoeken (graden, 0 = boven, met de klok mee) van de wijzers. */
export function handAngles(h, m, s = 0) { return { hour: ((h % 12) + m / 60 + s / 3600) * 30, minute: (m + s / 60) * 6, second: s * 6 }; }
/** Aangeklikte hoek -> minuut (0..59) afgerond op stap. */
export function angleToMinute(deg, step = 1) { const m = Math.round((((deg % 360) + 360) % 360) / 6 / step) * step; return m % 60; }

/* ---------- klok-vragen (leren) ---------- */
const sh = (r, a) => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
export const CLOCK_LEVELS = ['Hele uren', 'Halve en kwartieren', 'Vijf minuten', 'Elke minuut', '24-uurs en duur'];
function minutesFor(level, r) { return level === 1 ? 0 : level === 2 ? [0, 15, 30, 45][ri(r, 0, 3)] : level === 3 ? ri(r, 0, 11) * 5 : ri(r, 0, 59); }
/**
 * Klokvraag. type: 'lees' (klok -> digitaal kiezen), 'woord' (klok -> Nederlands kiezen), 'zet' (zet de wijzers),
 * 'duur' (rekenen met tijd, vanaf niveau 4). Geeft { type, level, h, m, prompt, choices?, answer }.
 */
export function makeClockQuestion(level, r = Math.random, forceType) {
  level = Math.max(1, Math.min(5, level | 0 || 1));
  const types = level === 1 ? ['lees', 'zet', 'woord'] : level <= 3 ? ['lees', 'woord', 'zet'] : level === 4 ? ['lees', 'zet', 'duur', 'woord'] : ['duur', 'dag24', 'lees'];
  const type = forceType || types[ri(r, 0, types.length - 1)];
  const h = ri(r, 1, 12), m = minutesFor(Math.min(level, 4), r);
  const opts = (right, make) => { const set = new Set([right]); let g = 0; while (set.size < 4 && g++ < 60) set.add(make()); return sh(r, [...set]); };
  if (type === 'lees') { const ans = digital(h, m); return { type, level, h, m, prompt: 'Hoe laat is het?', choices: opts(ans, () => digital(ri(r, 1, 12), level >= 3 ? ri(r, 0, 11) * 5 : [0, 15, 30, 45][ri(r, 0, 3)])), answer: ans }; }
  if (type === 'woord') { const ans = dutchTime(h, m); return { type, level, h, m, prompt: 'Hoe laat is het? Kies de goede tekst.', choices: opts(ans, () => dutchTime(ri(r, 1, 12), minutesFor(Math.min(level, 3), r))), answer: ans }; }
  if (type === 'zet') return { type, level, h, m, prompt: `Zet de klok op ${level <= 3 ? dutchTime(h, m) : digital(h, m)}.`, answer: { h: h % 12, m } };
  if (type === 'dag24') { const H = ri(r, 13, 23), M = ri(r, 0, 11) * 5; return { type, level, h: H, m: M, prompt: `Het is ${digital(H, M)} uur. Hoe laat is dat op de gewone klok?`, choices: opts(dutchTime(H, M), () => dutchTime(ri(r, 1, 12), ri(r, 0, 11) * 5)), answer: dutchTime(H, M) }; }
  // duur
  const startMin = ri(r, 6, 20) * 60 + ri(r, 0, 11) * 5, add = ri(r, 2, 16) * 5 + (level === 5 ? ri(r, 0, 3) * 60 : 0);
  const end = startMin + add, fmtT = (x) => digital(Math.floor(x / 60) % 24, x % 60);
  if (r() < 0.5) { const ans = fmtT(end); return { type: 'duur', level, h: Math.floor(startMin / 60) % 24, m: startMin % 60, prompt: `Het is ${fmtT(startMin)}. Over ${add >= 60 ? `${Math.floor(add / 60)} uur en ${add % 60} minuten` : `${add} minuten`} is het hoe laat?`, choices: opts(ans, () => fmtT(end + (ri(r, -4, 4) || 5) * 5)), answer: ans }; }
  const ans = add >= 60 ? `${Math.floor(add / 60)} uur ${add % 60 ? add % 60 + ' min' : ''}`.trim() : `${add} min`;
  const mk = (x) => (x >= 60 ? `${Math.floor(x / 60)} uur ${x % 60 ? x % 60 + ' min' : ''}`.trim() : `${x} min`);
  return { type: 'duur', level, h: Math.floor(startMin / 60) % 24, m: startMin % 60, prompt: `De les begint om ${fmtT(startMin)} en eindigt om ${fmtT(end)}. Hoe lang duurt de les?`, choices: opts(ans, () => mk(Math.max(5, add + (ri(r, -4, 4) || 3) * 5))), answer: ans };
}
export function checkClockAnswer(q, given) {
  if (q.type === 'zet') return !!given && (given.h % 12) === q.answer.h && given.m === q.answer.m;
  return given === q.answer;
}

/* ---------- Tijdzones ---------- */
export const CITIES = [
  { id: 'ams', name: 'Amsterdam', tz: 'Europe/Amsterdam', lat: 52.37, lon: 4.9 }, { id: 'lon', name: 'Londen', tz: 'Europe/London', lat: 51.5, lon: -0.12 },
  { id: 'par', name: 'Parijs', tz: 'Europe/Paris', lat: 48.85, lon: 2.35 }, { id: 'mad', name: 'Madrid', tz: 'Europe/Madrid', lat: 40.4, lon: -3.7 },
  { id: 'rom', name: 'Rome', tz: 'Europe/Rome', lat: 41.9, lon: 12.5 }, { id: 'ath', name: 'Athene', tz: 'Europe/Athens', lat: 37.98, lon: 23.7 },
  { id: 'ist', name: 'Istanbul', tz: 'Europe/Istanbul', lat: 41.0, lon: 28.97 }, { id: 'mos', name: 'Moskou', tz: 'Europe/Moscow', lat: 55.75, lon: 37.6 },
  { id: 'rey', name: 'Reykjavik', tz: 'Atlantic/Reykjavik', lat: 64.1, lon: -21.9 }, { id: 'cai', name: 'Caïro', tz: 'Africa/Cairo', lat: 30.04, lon: 31.24 },
  { id: 'lag', name: 'Lagos', tz: 'Africa/Lagos', lat: 6.5, lon: 3.4 }, { id: 'nai', name: 'Nairobi', tz: 'Africa/Nairobi', lat: -1.29, lon: 36.82 },
  { id: 'kaa', name: 'Kaapstad', tz: 'Africa/Johannesburg', lat: -33.9, lon: 18.4 }, { id: 'dub', name: 'Dubai', tz: 'Asia/Dubai', lat: 25.2, lon: 55.27 },
  { id: 'del', name: 'Delhi', tz: 'Asia/Kolkata', lat: 28.6, lon: 77.2 }, { id: 'ban', name: 'Bangkok', tz: 'Asia/Bangkok', lat: 13.75, lon: 100.5 },
  { id: 'sin', name: 'Singapore', tz: 'Asia/Singapore', lat: 1.35, lon: 103.8 }, { id: 'pek', name: 'Peking', tz: 'Asia/Shanghai', lat: 39.9, lon: 116.4 },
  { id: 'sel', name: 'Seoel', tz: 'Asia/Seoul', lat: 37.57, lon: 126.98 }, { id: 'tok', name: 'Tokio', tz: 'Asia/Tokyo', lat: 35.68, lon: 139.7 },
  { id: 'syd', name: 'Sydney', tz: 'Australia/Sydney', lat: -33.87, lon: 151.2 }, { id: 'auc', name: 'Auckland', tz: 'Pacific/Auckland', lat: -36.85, lon: 174.76 },
  { id: 'hon', name: 'Honolulu', tz: 'Pacific/Honolulu', lat: 21.3, lon: -157.86 }, { id: 'anc', name: 'Anchorage', tz: 'America/Anchorage', lat: 61.2, lon: -149.9 },
  { id: 'la', name: 'Los Angeles', tz: 'America/Los_Angeles', lat: 34.05, lon: -118.24 }, { id: 'den', name: 'Denver', tz: 'America/Denver', lat: 39.74, lon: -104.99 },
  { id: 'chi', name: 'Chicago', tz: 'America/Chicago', lat: 41.88, lon: -87.63 }, { id: 'ny', name: 'New York', tz: 'America/New_York', lat: 40.71, lon: -74.0 },
  { id: 'mex', name: 'Mexico-Stad', tz: 'America/Mexico_City', lat: 19.43, lon: -99.13 }, { id: 'bog', name: 'Bogota', tz: 'America/Bogota', lat: 4.71, lon: -74.07 },
  { id: 'sao', name: 'São Paulo', tz: 'America/Sao_Paulo', lat: -23.55, lon: -46.63 }, { id: 'bue', name: 'Buenos Aires', tz: 'America/Argentina/Buenos_Aires', lat: -34.6, lon: -58.38 },
  { id: 'par2', name: 'Paramaribo', tz: 'America/Paramaribo', lat: 5.85, lon: -55.2 }, { id: 'wil', name: 'Willemstad', tz: 'America/Curacao', lat: 12.11, lon: -68.93 },
];
export const CITY = Object.fromEntries(CITIES.map((c) => [c.id, c]));
export const DEFAULT_CITIES = ['ams', 'ny', 'tok', 'syd'];

const fmtCache = new Map();
function dtf(tz) { let f = fmtCache.get(tz); if (!f) { f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short' }); fmtCache.set(tz, f); } return f; }
/** Datum/tijd-onderdelen in een tijdzone. */
export function tzParts(date, tz) {
  const o = {}; for (const p of dtf(tz).formatToParts(date)) o[p.type] = p.value;
  const WD = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
  return { y: +o.year, mo: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second, wd: WD[o.weekday] };
}
/** Verschil met UTC in minuten (op dat moment, dus met zomertijd). */
export function tzOffsetMin(date, tz) { const p = tzParts(date, tz); return Math.round((Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - Math.floor(date.getTime() / 1000) * 1000) / 60000); }
export function formatOffset(min) { const s = min < 0 ? '−' : '+', a = Math.abs(min); return `UTC${s}${Math.floor(a / 60)}${a % 60 ? ':' + pad(a % 60) : ''}`; }
/** Hoeveel uur loopt tz2 voor op tz1 (kan een halve zijn). */
export function hoursAhead(tz1, tz2, date = new Date()) { return (tzOffsetMin(date, tz2) - tzOffsetMin(date, tz1)) / 60; }
/** Wandtijd {y,mo,d,h,mi} in fromTz -> echte Date (UTC-moment). */
export function zonedToDate(w, tz) {
  let guess = Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi);
  for (let i = 0; i < 3; i++) guess = Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi) - tzOffsetMin(new Date(guess), tz) * 60000;
  return new Date(guess);
}
/** Zet h:mi van een datum in fromTz om naar toTz. Geeft { h, mi, dayShift (-1|0|1), date }. */
export function convertTime(h, mi, fromTz, toTz, on = new Date()) {
  const f = tzParts(on, fromTz), d = zonedToDate({ y: f.y, mo: f.mo, d: f.d, h, mi }, fromTz), t = tzParts(d, toTz);
  const a = Date.UTC(f.y, f.mo - 1, f.d), b = Date.UTC(t.y, t.mo - 1, t.d);
  return { h: t.h, mi: t.mi, dayShift: Math.round((b - a) / 864e5), date: d };
}
/**
 * Vergaderslots (stappen van 30 min) waarin het in ALLE zones tussen startH en endH is.
 * Geeft lijst van { from, to } als uren in de eerste zone (bv. 15, 17.5) over de dag van `on` in de eerste zone.
 */
export function meetingWindows(tzs, on = new Date(), startH = 8, endH = 20) {
  if (!tzs.length) return [];
  const f = tzParts(on, tzs[0]), out = []; let cur = null;
  for (let k = 0; k < 48; k++) {
    const hh = Math.floor(k / 2), mm = (k % 2) * 30, d = zonedToDate({ y: f.y, mo: f.mo, d: f.d, h: hh, mi: mm }, tzs[0]);
    const ok = tzs.every((tz) => { const p = tzParts(d, tz), x = p.h + p.mi / 60; return x >= startH && x + 0.5 <= endH; });
    if (ok) { if (!cur) cur = { from: hh + mm / 60, to: hh + mm / 60 + 0.5 }; else cur.to += 0.5; } else if (cur) { out.push(cur); cur = null; }
  }
  if (cur) out.push(cur);
  return out;
}
export const hhmm = (x) => `${pad(Math.floor(x))}:${pad(Math.round((x % 1) * 60))}`;

/* ---------- Zon (voor de globe) ---------- */
const rad = Math.PI / 180;
/** Punt op aarde waar de zon nu recht boven staat. */
export function subsolar(date) {
  const N = dayOfYear(new Date(date.getTime() + date.getTimezoneOffset() * 60000));
  const B = 2 * Math.PI * (N - 81) / 364, eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const decl = 23.44 * Math.sin(2 * Math.PI * (N - 81) / 365.25);
  const utcH = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  let lon = (12 - utcH - eot / 60) * 15; lon = ((lon + 540) % 360) - 180;
  return { lat: decl, lon };
}
/** Hoogte van de zon (graden) op een plek: 90 = recht boven, 0 = horizon. */
export function sunAltitude(date, lat, lon) {
  const s = subsolar(date);
  const c = Math.sin(lat * rad) * Math.sin(s.lat * rad) + Math.cos(lat * rad) * Math.cos(s.lat * rad) * Math.cos((lon - s.lon) * rad);
  return Math.asin(Math.max(-1, Math.min(1, c))) / rad;
}
export const isDaytime = (date, lat, lon) => sunAltitude(date, lat, lon) > -0.83;

/* ---------- Aftellen ---------- */
export function countdownParts(ms) {
  const total = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(total / 86400), h = Math.floor((total % 86400) / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  return { d, h, m, s, total };
}
export const EVENT_PRESETS = [
  { id: 'nieuwjaar', name: 'Nieuwjaar', icon: 'balloon', md: [1, 1] }, { id: 'valentijn', name: 'Valentijnsdag', icon: 'heart', md: [2, 14] },
  { id: 'pasen', name: 'Pasen', icon: 'egg', easter: true }, { id: 'koningsdag', name: 'Koningsdag', icon: 'crown', md: [4, 27] },
  { id: 'bevrijding', name: 'Bevrijdingsdag', icon: 'flag', md: [5, 5] }, { id: 'zomer', name: 'Begin van de zomer', icon: 'sun', md: [6, 21] },
  { id: 'halloween', name: 'Halloween', icon: 'skull', md: [10, 31] }, { id: 'sint', name: 'Sinterklaas', icon: 'gift', md: [12, 5] },
  { id: 'kerst', name: 'Kerstmis', icon: 'pine', md: [12, 25] }, { id: 'oudnieuw', name: 'Oud en nieuw', icon: 'star', md: [12, 31], h: 24 },
];
/** Tijdstip (ms) waarnaar afgeteld wordt. ev: preset-id, of {date:'YYYY-MM-DD', time?:'HH:MM', yearly?} . Geeft null bij onbekend. */
export function eventTarget(ev, now = Date.now()) {
  const nowD = new Date(now);
  if (ev.preset || ev.md || ev.easter) {
    const p = ev.md || ev.easter ? ev : EVENT_PRESETS.find((x) => x.id === ev.preset); if (!p) return null;
    for (let y = nowD.getFullYear(); y <= nowD.getFullYear() + 1; y++) {
      const d = p.easter ? easter(y) : new Date(y, p.md[0] - 1, p.md[1]); if (p.h) d.setHours(p.h, 0, 0, 0);
      if (d.getTime() > now - (p.h ? 0 : 0)) return d.getTime();
    }
    return null;
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ev.date || ''); if (!m) return null;
  const [hh, mm] = /^(\d{1,2}):(\d{2})$/.test(ev.time || '') ? ev.time.split(':').map(Number) : [0, 0];
  let t = new Date(+m[1], +m[2] - 1, +m[3], hh, mm).getTime();
  if (ev.yearly) { let y = +m[1]; while (t <= now && y < nowD.getFullYear() + 3) { y++; t = new Date(y, +m[2] - 1, +m[3], hh, mm).getTime(); } }
  return t;
}

/* ---------- Interval-timer ---------- */
export const INTERVAL_PRESETS = [
  { id: 'tabata', name: 'Tabata', work: 20, rest: 10, rounds: 8, warm: 10, cool: 0 }, { id: 'hiit', name: 'HIIT', work: 40, rest: 20, rounds: 10, warm: 30, cool: 30 },
  { id: 'hardlopen', name: 'Hardlopen', work: 60, rest: 30, rounds: 6, warm: 120, cool: 120 }, { id: 'leren', name: 'Leren', work: 1500, rest: 300, rounds: 4, warm: 0, cool: 0 },
  { id: 'oefenen', name: 'Instrument oefenen', work: 300, rest: 60, rounds: 4, warm: 0, cool: 0 }, { id: 'tanden', name: 'Tanden poetsen', work: 30, rest: 2, rounds: 4, warm: 0, cool: 0 },
];
export function buildIntervalPlan(c) {
  const plan = [], n = Math.max(1, Math.min(99, c.rounds | 0 || 1));
  if (c.warm > 0) plan.push({ type: 'warm', secs: c.warm, round: 0 });
  for (let i = 1; i <= n; i++) { plan.push({ type: 'work', secs: Math.max(1, c.work | 0), round: i }); if (c.rest > 0 && i < n) plan.push({ type: 'rest', secs: c.rest, round: i }); }
  if (c.cool > 0) plan.push({ type: 'cool', secs: c.cool, round: n });
  return plan;
}
export const planTotal = (plan) => plan.reduce((a, s) => a + s.secs, 0);
/** Welk onderdeel loopt er na `elapsed` seconden? Geeft null als klaar. */
export function segmentAt(plan, elapsed) {
  let t = 0;
  for (let i = 0; i < plan.length; i++) { if (elapsed < t + plan[i].secs) return { idx: i, seg: plan[i], left: t + plan[i].secs - elapsed, into: elapsed - t }; t += plan[i].secs; }
  return null;
}

/* ---------- Schaakklok (beurtklok) ---------- */
export function newTurnClock(minutes, incSec = 0) { return { t: [minutes * 60000, minutes * 60000], active: -1, inc: incSec * 1000, last: 0, over: -1, moves: [0, 0] }; }
/** Laat de tijd van de actieve speler aflopen tot `now`. */
export function turnTick(c, now) { if (c.active < 0 || c.over >= 0) return c; const dt = now - c.last; c.last = now; c.t[c.active] = Math.max(0, c.t[c.active] - dt); if (c.t[c.active] === 0) c.over = c.active; return c; }
/** Speler `p` drukt op zijn knop: beurt gaat naar de ander (of start de klok). */
export function turnPress(c, p, now) {
  if (c.over >= 0) return c;
  if (c.active < 0) { c.active = 1 - p; c.last = now; return c; }
  if (p !== c.active) return c;
  turnTick(c, now); if (c.over >= 0) return c;
  c.t[p] += c.inc; c.moves[p]++; c.active = 1 - p; c.last = now; return c;
}
