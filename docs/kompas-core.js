// Kompas: pure logica (geen DOM): windstreken, afstanden en richtingen op aarde, zonnestand, hoogte meten,
// luchtdruk, schatzoek-regels en schatcodes.
export const WINDS = ['N', 'NNO', 'NO', 'ONO', 'O', 'OZO', 'ZO', 'ZZO', 'Z', 'ZZW', 'ZW', 'WZW', 'W', 'WNW', 'NW', 'NNW'];
export const WINDNAMES = { N: 'Noord', NNO: 'Noord-noordoost', NO: 'Noordoost', ONO: 'Oost-noordoost', O: 'Oost', OZO: 'Oost-zuidoost', ZO: 'Zuidoost', ZZO: 'Zuid-zuidoost', Z: 'Zuid', ZZW: 'Zuid-zuidwest', ZW: 'Zuidwest', WZW: 'West-zuidwest', W: 'West', WNW: 'West-noordwest', NW: 'Noordwest', NNW: 'Noord-noordwest' };
export const norm360 = (d) => ((d % 360) + 360) % 360;
export const dir = (deg) => WINDS[Math.round(norm360(deg) / 22.5) % 16];
export const dirName = (deg) => WINDNAMES[dir(deg)];
/** Kleinste hoek (-180..180) van `from` naar `to`; positief = naar rechts draaien. */
export const angleDiff = (from, to) => ((norm360(to) - norm360(from) + 540) % 360) - 180;

const R = 6371000, rad = Math.PI / 180, deg = 180 / Math.PI;
/** Afstand in meters tussen twee punten (haversine). */
export function distance(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
/** Kompaskoers (0..360, 0 = noord) van punt 1 naar punt 2. */
export function bearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin((lon2 - lon1) * rad) * Math.cos(lat2 * rad), x = Math.cos(lat1 * rad) * Math.sin(lat2 * rad) - Math.sin(lat1 * rad) * Math.cos(lat2 * rad) * Math.cos((lon2 - lon1) * rad);
  return norm360(Math.atan2(y, x) * deg);
}
/** Eindpunt als je `dist` meter loopt met koers `brg`. */
export function destination(lat, lon, brg, dist) {
  const d = dist / R, b = brg * rad, p1 = lat * rad, l1 = lon * rad;
  const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(b));
  const l2 = l1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
  return { lat: p2 * deg, lon: ((l2 * deg + 540) % 360) - 180 };
}
export function fmtDist(m) { return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 2 : 1).replace('.', ',')} km`; }
/** 52.3702 -> 52° 22' 12.7" N */
export function dms(v, isLat) {
  const a = Math.abs(v), d = Math.floor(a), m = Math.floor((a - d) * 60), s = ((a - d) * 60 - m) * 60;
  return `${d}° ${m}' ${s.toFixed(1)}" ${isLat ? (v >= 0 ? 'N' : 'Z') : (v >= 0 ? 'O' : 'W')}`;
}
export const fmtCoord = (lat, lon) => `${lat.toFixed(5).replace('.', ',')}, ${lon.toFixed(5).replace('.', ',')}`;
/** Leest "52,3702 4,8952" of "52.37, 4.89" of 52° 22' N ... (alleen decimaal). */
export function parseCoord(s) {
  const m = String(s || '').replace(/,/g, '.').match(/-?\d+(?:\.\d+)?/g);
  if (!m || m.length < 2) return null;
  const lat = parseFloat(m[0]), lon = parseFloat(m[1]);
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon } : null;
}

/* ---------- zon ---------- */
/** Zonnestand: { azimuth (0=noord, met de klok mee), altitude (graden boven de horizon) } */
export function sunPosition(date, lat, lon) {
  const d = date.getTime() / 864e5 - 0.5 + 2440588 - 2451545, M = rad * (357.5291 + 0.98560028 * d);
  const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)), L = M + C + rad * 102.9372 + Math.PI, e = rad * 23.4397;
  const dec = Math.asin(Math.sin(e) * Math.sin(L)), ra = Math.atan2(Math.sin(L) * Math.cos(e), Math.cos(L));
  const H = rad * (280.16 + 360.9856235 * d) - rad * -lon - ra, phi = lat * rad;
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
  const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  return { azimuth: norm360(az * deg + 180), altitude: alt * deg };
}

/* ---------- hoogte meten, helling, luchtdruk ---------- */
/** Hoogte van een boom/gebouw: afstand (m) tot de voet, kijkhoek (graden) naar de top, ooghoogte (m). */
export function heightFromAngle(distM, angleDeg, eyeM = 1.5) { return Math.max(0, distM * Math.tan(Math.min(89, Math.max(0, angleDeg)) * rad) + eyeM); }
export const slopePercent = (angleDeg) => Math.tan(angleDeg * rad) * 100;
/** Hoogte (m) uit luchtdruk (hPa) met de standaardatmosfeer; p0 = druk op zeeniveau. */
export function altitudeFromPressure(p, p0 = 1013.25) { return 44330 * (1 - Math.pow(p / p0, 1 / 5.255)); }
/** Verwachte druk op een hoogte. */
export function pressureAtAltitude(h, p0 = 1013.25) { return p0 * Math.pow(1 - h / 44330, 5.255); }
export function pressureWord(hpa) { return hpa < 1000 ? 'laag (kans op regen en wind)' : hpa < 1020 ? 'gemiddeld' : hpa < 1030 ? 'hoog (meestal rustig weer)' : 'zeer hoog'; }

/* ---------- schatcode: locatie <-> korte code ---------- */
const AL = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // zonder I, L, O, U
export function encodeSpot(lat, lon) {
  const a = BigInt(Math.round((lat + 90) * 1e5)), o = BigInt(Math.round((lon + 180) * 1e5));
  let v = (a << 26n) | o, s = '';
  for (let i = 0; i < 11; i++) { s = AL[Number(v & 31n)] + s; v >>= 5n; }
  let sum = 0; for (const c of s) sum += AL.indexOf(c);
  s += AL[sum % 32];
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
}
export function decodeSpot(code) {
  const s = String(code || '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  if (s.length !== 12 || [...s].some((c) => !AL.includes(c))) return null;
  let sum = 0; for (let i = 0; i < 11; i++) sum += AL.indexOf(s[i]);
  if (AL[sum % 32] !== s[11]) return null;
  let v = 0n; for (let i = 0; i < 11; i++) v = (v << 5n) | BigInt(AL.indexOf(s[i]));
  const a = Number(v >> 26n), o = Number(v & ((1n << 26n) - 1n)), lat = a / 1e5 - 90, lon = o / 1e5 - 180;
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon } : null;
}

/* ---------- schatzoek ---------- */
export const HUNT_LEVELS = [
  { id: 1, name: 'Dichtbij', min: 50, max: 130, desc: 'Een rondje om de buurt' }, { id: 2, name: 'Wandeling', min: 150, max: 400, desc: 'Een korte wandeling' }, { id: 3, name: 'Ontdekker', min: 400, max: 900, desc: 'Een flinke tocht (met een volwassene)' },
];
/** Verstop een schat op willekeurige afstand en richting vanaf pos. */
export function makeTreasure(pos, level = 1, r = Math.random) {
  const L = HUNT_LEVELS[Math.min(2, Math.max(0, level - 1))], dist = L.min + r() * (L.max - L.min), brg = r() * 360, p = destination(pos.lat, pos.lon, brg, dist);
  return { lat: p.lat, lon: p.lon, dist, bearing: brg };
}
/** Warm of koud, afhankelijk van hoe ver je nog moet ten opzichte van het begin. */
export function hotCold(dist, startDist) {
  const r = dist / Math.max(1, startDist);
  if (dist <= 20 || r < 0.06) return { id: 5, text: 'Kokend heet!', color: '#dc2626', icon: 'flame' };
  if (r < 0.2) return { id: 4, text: 'Heet', color: '#f97316', icon: 'flame' };
  if (r < 0.45) return { id: 3, text: 'Warm', color: '#f59e0b', icon: 'sun' };
  if (r < 0.7) return { id: 2, text: 'Lauw', color: '#84cc16', icon: 'cloud' };
  if (r < 1.0) return { id: 1, text: 'Koud', color: '#38bdf8', icon: 'snowflake' };
  return { id: 0, text: 'IJskoud', color: '#6366f1', icon: 'snowflake' };
}
/** Straal waarbinnen de schat "gevonden" is: past zich aan GPS-nauwkeurigheid aan (10..30 m). */
export const foundRadius = (acc) => Math.min(30, Math.max(10, (acc || 10) * 1.2));
export function clueText(t, from) {
  const d = distance(from.lat, from.lon, t.lat, t.lon), b = bearing(from.lat, from.lon, t.lat, t.lon);
  return `De schat ligt ongeveer ${Math.round(d / 10) * 10} meter naar het ${dirName(b).toLowerCase()}.`;
}
export function huntReward(level, found) { return found * (5 + level * 3); }

/* ---------- Virtuele wandeling (binnen spelen) ---------- */
export const VIRTUAL_START = { lat: 52.0, lon: 5.0 };
export function stepVirtual(p, brg, m = 10) { return Object.assign({}, destination(p.lat, p.lon, brg, m), { acc: 5 }); }

/* ---------- Richting-quiz ---------- */
const OPP = (d) => (d + 180) % 360;
export const CARDINALS = [['Noord', 0], ['Noordoost', 45], ['Oost', 90], ['Zuidoost', 135], ['Zuid', 180], ['Zuidwest', 225], ['West', 270], ['Noordwest', 315]];
/** Meerkeuzevraag over windstreken. Geeft { q, choices, answer }. */
export function makeDirQuestion(level = 1, r = Math.random) {
  const pool = level === 1 ? CARDINALS.filter((c) => c[1] % 90 === 0) : CARDINALS, pick = (a) => a[Math.floor(r() * a.length)];
  const kind = pick(level === 1 ? ['tegenover', 'rechts', 'links'] : ['tegenover', 'rechts', 'links', 'graden', 'draai']);
  const sh = (a) => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
  const [name, d] = pick(pool), nm = (deg) => CARDINALS.find((c) => c[1] === norm360(deg))[0];
  let q, ans, wrongs;
  if (kind === 'tegenover') { q = `Welke windstreek is recht tegenover ${name}?`; ans = nm(OPP(d)); }
  else if (kind === 'rechts') { q = `Je kijkt naar het ${name.toLowerCase()}. Welke kant is rechts van je?`; ans = nm(d + 90); }
  else if (kind === 'links') { q = `Je kijkt naar het ${name.toLowerCase()}. Welke kant is links van je?`; ans = nm(d - 90); }
  else if (kind === 'graden') { q = `Hoeveel graden is ${name} op het kompas?`; ans = String(d); wrongs = sh(CARDINALS.map((c) => String(c[1])).filter((x) => x !== ans)).slice(0, 3); }
  else { q = `Je kijkt naar het ${name.toLowerCase()} en draait een kwartslag naar rechts. Waar kijk je dan naar?`; ans = nm(d + 90); }
  wrongs = wrongs || sh(pool.map((c) => c[0]).filter((x) => x !== ans)).slice(0, 3);
  return { q, answer: ans, choices: sh([ans, ...wrongs]), kind };
}
/** Is de wijzer lang genoeg binnen de marge? Teruggeven: voortgang 0..1. */
export function holdProgress(state, headingNow, target, now, tol = 12, needMs = 1800) {
  const ok = Math.abs(angleDiff(headingNow, target)) <= tol;
  if (!ok) { state.since = 0; return 0; }
  if (!state.since) state.since = now;
  return Math.min(1, (now - state.since) / needMs);
}
