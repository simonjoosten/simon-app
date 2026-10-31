// Weer: pure logica (geen DOM): weercodes, wind, UV, maanfase, advies, activiteiten, data normaliseren (Open-Meteo).
const DAGEN = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
export const DAGEN_LANG = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
export { DAGEN };

/* ---------- weercodes (WMO) ---------- */
// kind: clear | mostly | partly | cloudy | fog | drizzle | rain | heavy | snow | storm  ; icons: namen uit de 3D-iconen
const W = (text, kind, icons, emoji) => ({ text, kind, icons, emoji });
export const WMO = {
  0: W('Onbewolkt', 'clear', ['sun'], '☀️'), 1: W('Overwegend zonnig', 'mostly', ['sun', 'cloud'], '🌤️'), 2: W('Half bewolkt', 'partly', ['cloud', 'sun'], '⛅'), 3: W('Bewolkt', 'cloudy', ['cloud'], '☁️'),
  45: W('Mist', 'fog', ['cloud'], '🌫️'), 48: W('Rijpmist', 'fog', ['cloud'], '🌫️'),
  51: W('Lichte motregen', 'drizzle', ['rain'], '🌦️'), 53: W('Motregen', 'drizzle', ['rain'], '🌦️'), 55: W('Zware motregen', 'rain', ['rain'], '🌧️'), 56: W('IJzel-motregen', 'rain', ['rain'], '🌧️'), 57: W('IJzel-motregen', 'rain', ['rain'], '🌧️'),
  61: W('Lichte regen', 'drizzle', ['rain'], '🌦️'), 63: W('Regen', 'rain', ['rain'], '🌧️'), 65: W('Zware regen', 'heavy', ['rain'], '🌧️'), 66: W('IJzelregen', 'rain', ['rain'], '🌧️'), 67: W('IJzelregen', 'heavy', ['rain'], '🌧️'),
  71: W('Lichte sneeuw', 'snow', ['snowflake'], '🌨️'), 73: W('Sneeuw', 'snow', ['snowflake'], '🌨️'), 75: W('Zware sneeuw', 'snow', ['snowflake'], '❄️'), 77: W('Korrelsneeuw', 'snow', ['snowflake'], '🌨️'),
  80: W('Lichte buien', 'drizzle', ['rain', 'sun'], '🌦️'), 81: W('Buien', 'rain', ['rain'], '🌧️'), 82: W('Zware buien', 'heavy', ['rain'], '⛈️'), 85: W('Sneeuwbuien', 'snow', ['snowflake'], '🌨️'), 86: W('Zware sneeuwbuien', 'snow', ['snowflake'], '🌨️'),
  95: W('Onweer', 'storm', ['bolt'], '⛈️'), 96: W('Onweer met hagel', 'storm', ['bolt'], '⛈️'), 99: W('Zwaar onweer met hagel', 'storm', ['bolt'], '⛈️'),
};
/** Info bij een weercode; 's nachts wordt zon een maan. */
export function wmoInfo(code, night = false) {
  const base = WMO[code] || W('Onbekend', 'cloudy', ['cloud'], '🌡️');
  if (!night) return { ...base, code };
  const icons = base.icons.map((i) => (i === 'sun' ? 'moon' : i));
  const text = code === 0 ? 'Helder' : code === 1 ? 'Overwegend helder' : base.text;
  return { ...base, icons, text, emoji: code <= 1 ? '🌙' : base.emoji, code, night: true };
}
/** Parameters voor de animatie: hoeveel wolken (0..1), neerslag (0..1), soort deeltjes. */
export function sceneParams(code, o = {}) {
  const info = wmoInfo(code, !!o.night), k = info.kind;
  const clouds = { clear: 0.05, mostly: 0.25, partly: 0.55, cloudy: 0.9, fog: 0.85, drizzle: 0.8, rain: 0.9, heavy: 1, snow: 0.85, storm: 1 }[k];
  const precip = { drizzle: 0.35, rain: 0.65, heavy: 1, snow: code >= 75 || code === 86 ? 0.9 : 0.55, storm: 0.85 }[k] || 0;
  const flakes = k === 'snow', hail = code === 96 || code === 99;
  return { kind: k, clouds: o.clouds != null ? Math.max(clouds * 0.6, Math.min(1, o.clouds / 100)) : clouds, precip, flakes, hail, thunder: k === 'storm', fog: k === 'fog', night: !!o.night, wind: o.wind || 0, text: info.text };
}

/* ---------- wind ---------- */
export const BEAUFORT = [
  { n: 0, max: 1, name: 'Windstil', land: 'De rook gaat recht omhoog.', sea: 'De zee is glad als een spiegel.' },
  { n: 1, max: 5, name: 'Zwak', land: 'Je ziet aan de rook welke kant de wind op gaat.', sea: 'Kleine rimpeltjes.' },
  { n: 2, max: 11, name: 'Zwak', land: 'Je voelt de wind in je gezicht; blaadjes ritselen.', sea: 'Kleine golfjes.' },
  { n: 3, max: 19, name: 'Matig', land: 'Bladeren en dunne takken bewegen; vlaggen wapperen.', sea: 'Hier en daar witte schuimkopjes.' },
  { n: 4, max: 28, name: 'Matig', land: 'Papier waait op en kleine takken bewegen.', sea: 'Veel witte schuimkoppen.' },
  { n: 5, max: 38, name: 'Vrij krachtig', land: 'Kleine bomen gaan heen en weer; fietsen kost moeite.', sea: 'Flinke golven met schuim.' },
  { n: 6, max: 49, name: 'Krachtig', land: 'Dikke takken bewegen; paraplu’s zijn moeilijk vast te houden.', sea: 'Grote golven met witte koppen.' },
  { n: 7, max: 61, name: 'Hard', land: 'Hele bomen bewegen; tegen de wind in lopen is zwaar.', sea: 'De zee kookt, schuim waait in banen.' },
  { n: 8, max: 74, name: 'Stormachtig', land: 'Takken breken af; lopen is bijna niet mogelijk.', sea: 'Hoge golven; veel schuim.' },
  { n: 9, max: 88, name: 'Storm', land: 'Dakpannen waaien van daken; kleine schade.', sea: 'Zeer hoge golven.' },
  { n: 10, max: 102, name: 'Zware storm', land: 'Bomen worden ontworteld; flinke schade.', sea: 'Enorme golven; de zee is wit.' },
  { n: 11, max: 117, name: 'Zeer zware storm', land: 'Zeer grote schade, zeldzaam.', sea: 'Uitzonderlijk hoge golven.' },
  { n: 12, max: Infinity, name: 'Orkaan', land: 'Verwoestingen.', sea: 'De lucht is gevuld met schuim en nevel.' },
];
export function bft(kmh) { const i = BEAUFORT.findIndex((b) => kmh < b.max); return i < 0 ? 12 : i; }
const D8 = ['noorden', 'noordoosten', 'oosten', 'zuidoosten', 'zuiden', 'zuidwesten', 'westen', 'noordwesten'];
export const D8s = ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW'];
/** Windrichting = waar de wind VANDAAN komt. */
export const windFrom = (deg) => D8[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
export const windFromShort = (deg) => D8s[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

/* ---------- UV, luchtkwaliteit, maan ---------- */
export function uvInfo(uv) {
  const u = Math.round((uv || 0) * 10) / 10;
  if (u < 3) return { level: 'Laag', color: '#16a34a', advice: 'Je hoeft je niet in te smeren.' };
  if (u < 6) return { level: 'Matig', color: '#eab308', advice: 'Smeer je in als je lang buiten bent.' };
  if (u < 8) return { level: 'Hoog', color: '#f97316', advice: 'Smeren, pet op en zoek schaduw rond het middaguur.' };
  if (u < 11) return { level: 'Zeer hoog', color: '#dc2626', advice: 'Goed insmeren, pet en zonnebril. Blijf in de schaduw.' };
  return { level: 'Extreem', color: '#7c3aed', advice: 'Blijf zoveel mogelijk binnen of in de schaduw.' };
}
export function aqiInfo(v) {
  if (v == null || Number.isNaN(v)) return null;
  if (v <= 20) return { text: 'Goed', color: '#16a34a' }; if (v <= 40) return { text: 'Redelijk', color: '#84cc16' }; if (v <= 60) return { text: 'Matig', color: '#eab308' };
  if (v <= 80) return { text: 'Slecht', color: '#f97316' }; if (v <= 100) return { text: 'Zeer slecht', color: '#dc2626' }; return { text: 'Extreem slecht', color: '#7c3aed' };
}
export function pollenLevel(v) { if (v == null) return null; return v < 10 ? 'laag' : v < 50 ? 'matig' : v < 200 ? 'hoog' : 'zeer hoog'; }
const SYN = 29.530588853;
/** Maanfase: phase 0..1 (0 = nieuwe maan, 0,5 = volle maan), fractie verlicht en naam. */
export function moonPhase(date) {
  const days = (date.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5, phase = (((days % SYN) + SYN) % SYN) / SYN;
  const illum = (1 - Math.cos(phase * 2 * Math.PI)) / 2;
  const names = ['Nieuwe maan', 'Wassende sikkel', 'Eerste kwartier', 'Wassende maan', 'Volle maan', 'Afnemende maan', 'Laatste kwartier', 'Afnemende sikkel'];
  return { phase, illum, name: names[Math.floor(phase * 8 + 0.5) % 8] };
}
export function nextFullMoon(date) { const d = new Date(date.getTime()); for (let i = 0; i < 31; i++) { const p = moonPhase(d).phase; if (Math.abs(p - 0.5) < 0.017) return d; d.setUTCDate(d.getUTCDate() + 1); } return null; }

/* ---------- tijd in de plaats ---------- */
/** Lokale tijd-string ("2026-10-31T14:00") van een plaats -> echt tijdstip (ms). */
export const epoch = (str, offSec = 0) => Date.parse(String(str).length === 16 ? str + ':00Z' : String(str) + (/Z|[+-]\d\d:\d\d$/.test(str) ? '' : 'Z')) - offSec * 1000;
export const placeParts = (ms, offSec = 0) => { const d = new Date(ms + offSec * 1000); return { y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds(), wd: d.getUTCDay() }; };
export const hhmm = (ms, offSec = 0) => { const p = placeParts(ms, offSec); return `${String(p.h).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}`; };
export const dayLength = (sec) => `${Math.floor(sec / 3600)} u ${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')} min`;
/** Waar staat de zon op de boog? 0 = opkomst, 1 = ondergang; null als het nacht is. */
export function sunFraction(now, rise, set) { if (now < rise || now > set) return null; return (now - rise) / (set - rise); }

/* ---------- Open-Meteo-antwoord normaliseren ---------- */
export function normalize(j) {
  const off = j.utc_offset_seconds || 0, c = j.current || {}, h = j.hourly || {}, d = j.daily || {};
  const hours = (h.time || []).map((t, i) => ({ t: epoch(t, off), temp: h.temperature_2m[i], feels: h.apparent_temperature ? h.apparent_temperature[i] : h.temperature_2m[i], pop: h.precipitation_probability ? h.precipitation_probability[i] ?? 0 : 0, rain: h.precipitation ? h.precipitation[i] ?? 0 : 0, code: h.weather_code[i], wind: h.wind_speed_10m ? h.wind_speed_10m[i] : 0, dir: h.wind_direction_10m ? h.wind_direction_10m[i] : 0, uv: h.uv_index ? h.uv_index[i] ?? 0 : 0, clouds: h.cloud_cover ? h.cloud_cover[i] : null, day: h.is_day ? !!h.is_day[i] : true }));
  const days = (d.time || []).map((t, i) => ({ date: t, wd: new Date(t + 'T12:00:00Z').getUTCDay(), code: d.weather_code[i], max: d.temperature_2m_max[i], min: d.temperature_2m_min[i], rain: d.precipitation_sum[i] ?? 0, pop: d.precipitation_probability_max ? d.precipitation_probability_max[i] ?? 0 : 0, sunrise: epoch(d.sunrise[i], off), sunset: epoch(d.sunset[i], off), uv: d.uv_index_max ? d.uv_index_max[i] ?? 0 : 0, wind: d.wind_speed_10m_max ? d.wind_speed_10m_max[i] : 0, gust: d.wind_gusts_10m_max ? d.wind_gusts_10m_max[i] : 0, sunHours: d.sunshine_duration ? (d.sunshine_duration[i] || 0) / 3600 : null, daylight: d.daylight_duration ? d.daylight_duration[i] : null }));
  const m = j.minutely_15 || {};
  const rain15 = (m.time || []).map((t, i) => ({ t: epoch(t, off), mm: m.precipitation[i] || 0 }));
  return { off, tz: j.timezone, current: { temp: c.temperature_2m, feels: c.apparent_temperature, hum: c.relative_humidity_2m, code: c.weather_code, wind: c.wind_speed_10m, dir: c.wind_direction_10m, gust: c.wind_gusts_10m, rain: c.precipitation, day: !!c.is_day, clouds: c.cloud_cover, pmsl: c.pressure_msl, psurf: c.surface_pressure, t: c.time ? epoch(c.time, off) : Date.now() }, hours, days, rain15 };
}
export function currentHourIndex(hours, now) { let k = 0; for (let i = 0; i < hours.length; i++) { if (hours[i].t <= now) k = i; else break; } return k; }

/** Regen de komende uren: { state: 'none'|'now'|'soon', minutes, mm, text } */
export function rainSummary(rain15, now) {
  if (!rain15 || !rain15.length) return { state: 'none', text: 'Geen regen verwacht de komende 2 uur.' };
  const i = rain15.findIndex((r) => r.t + 15 * 60e3 > now && r.mm >= 0.1);
  if (i < 0) return { state: 'none', text: 'Geen regen verwacht de komende 2 uur.' };
  const min = Math.round((rain15[i].t - now) / 60000);
  return min <= 5 ? { state: 'now', minutes: 0, mm: rain15[i].mm, text: `Het regent nu of bijna (${rain15[i].mm.toFixed(1).replace('.', ',')} mm).` } : { state: 'soon', minutes: min, mm: rain15[i].mm, text: `Het gaat regenen over ${min} minuten. Neem een jas of paraplu mee.` };
}

/* ---------- advies ---------- */
/** Kleding- en tasadvies. */
export function clothing({ feels, rain, pop, wind, uv, code }) {
  const out = [];
  if (feels <= 0) out.push({ icon: 'snowflake', text: 'Het vriest: dikke jas, muts, sjaal en handschoenen.' });
  else if (feels <= 8) out.push({ icon: 'snowflake', text: 'Koud: warme jas en een muts.' });
  else if (feels <= 14) out.push({ icon: 'cloud', text: 'Fris: een trui of jas.' });
  else if (feels <= 20) out.push({ icon: 'leaf', text: 'Een lichte jas of vest is genoeg.' });
  else if (feels <= 27) out.push({ icon: 'sun', text: 'Lekker: een T-shirt en korte broek kan.' });
  else out.push({ icon: 'flame', text: 'Heet: luchtige kleren en veel water drinken.' });
  if ((pop >= 50 || rain >= 0.5) && code < 70) out.push({ icon: 'rain', text: 'Neem een paraplu of regenjas mee.' });
  if (code >= 71 && code <= 86) out.push({ icon: 'snowflake', text: 'Het sneeuwt: waterdichte schoenen.' });
  if (wind >= 38) out.push({ icon: 'cloud', text: 'Het waait hard: een jas die dicht kan en pas op voor je paraplu.' });
  if (uv >= 3) out.push({ icon: 'sun', text: `UV ${Math.round(uv)}: zonnebrand, pet en zonnebril.` });
  if (code >= 95) out.push({ icon: 'bolt', text: 'Onweer: blijf binnen en ga niet onder een boom staan.' });
  return out;
}
/** Hoe leuk is een dag voor een activiteit? Score 0..100. day = genormaliseerde dag, h = gemiddelden. */
export function activityScores(day) {
  const t = (day.max + day.min) / 2, mx = day.max, rainy = day.rain >= 1 || day.pop >= 60, wet = Math.min(1, day.rain / 8), w = day.wind, storm = day.code >= 95;
  const clamp = (x) => Math.max(0, Math.min(100, Math.round(x)));
  const tempScore = (lo, hi, v) => (v >= lo && v <= hi ? 100 : Math.max(0, 100 - Math.abs(v < lo ? lo - v : v - hi) * 8));
  const dry = 100 * (1 - wet), ws = Math.max(0, 100 - w * 1.8), rm = rainy ? 0.55 : 1, sm = storm ? 0.2 : 1;
  const fietsen = clamp((tempScore(10, 24, mx) * 0.4 + ws * 0.25 + dry * 0.35) * rm * sm);
  const buiten = clamp((tempScore(12, 26, mx) * 0.45 + dry * 0.55) * rm * sm);
  const strand = clamp((tempScore(22, 34, mx) * 0.55 + (day.sunHours != null ? Math.min(100, day.sunHours * 11) : 50) * 0.3 + Math.max(0, 100 - w * 1.5) * 0.15) * (rainy ? 0.4 : 1) * sm);
  const vlieger = clamp((Math.max(0, 100 - Math.abs(w - 25) * 5) * 0.7 + dry * 0.3) * sm);
  const wandelen = clamp((tempScore(5, 22, mx) * 0.5 + dry * 0.5) * rm * sm);
  return [
    { id: 'fietsen', name: 'Fietsen', icon: 'bike', score: fietsen }, { id: 'buiten', name: 'Buitenspelen', icon: 'tree', score: buiten }, { id: 'strand', name: 'Strand of zwemmen', icon: 'shell', score: strand },
    { id: 'vlieger', name: 'Vlieger oplaten', icon: 'balloon', score: vlieger }, { id: 'wandelen', name: 'Wandelen met de hond', icon: 'dog', score: wandelen },
  ];
}
export function bestDayFor(days, id) { let best = null; days.forEach((d, i) => { const s = activityScores(d).find((a) => a.id === id).score; if (!best || s > best.score) best = { i, score: s, day: d }; }); return best; }
export const scoreWord = (s) => (s >= 80 ? 'Top' : s >= 60 ? 'Goed' : s >= 40 ? 'Gaat wel' : s >= 20 ? 'Liever niet' : 'Slecht');
/** Korte zin over de dag. */
export function daySummary(day) {
  const i = wmoInfo(day.code), parts = [i.text.toLowerCase()];
  parts.push(`${Math.round(day.max)}° overdag`);
  if (day.rain >= 0.5) parts.push(`${day.rain.toFixed(1).replace('.', ',')} mm regen`);
  if (day.wind >= 30) parts.push(`wind tot ${Math.round(day.wind)} km/u`);
  return parts.join(', ');
}

/* ---------- Weer-quiz ---------- */
export const CLOUDS = [
  { id: 'cumulus', name: 'Stapelwolk (cumulus)', icon: 'cloud', desc: 'Wit en pluizig, als watten. Komt op mooie dagen.', height: 'laag' },
  { id: 'cirrus', name: 'Sluierwolk (cirrus)', icon: 'cloud', desc: 'Dunne witte slierten hoog in de lucht, van ijskristallen. Het weer gaat vaak veranderen.', height: 'hoog' },
  { id: 'stratus', name: 'Laagwolk (stratus)', icon: 'cloud', desc: 'Een grijze deken. Geeft motregen of mist.', height: 'laag' },
  { id: 'cumulonimbus', name: 'Onweerswolk (cumulonimbus)', icon: 'bolt', desc: 'Een enorme torenhoge wolk met een plat dak. Brengt hoosbuien, hagel en onweer.', height: 'laag tot heel hoog' },
  { id: 'altocumulus', name: 'Schaapjeswolken', icon: 'sheep', desc: 'Kleine witte wolkjes in rijen, als een kudde schaapjes.', height: 'midden' },
  { id: 'nimbostratus', name: 'Regenwolk (nimbostratus)', icon: 'rain', desc: 'Dik en donkergrijs. Hierdoor regent het lang.', height: 'laag tot midden' },
];
export function makeWeatherQuiz(r = Math.random) {
  const pick = (a) => a[Math.floor(r() * a.length)], sh = (a) => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
  const kind = pick(['bft', 'wolk', 'wolkdesc', 'uv', 'wind', 'maan']);
  const mk = (q, ans, wrongs) => ({ q, answer: ans, choices: sh([ans, ...[...new Set(wrongs.filter((w) => w !== ans))].slice(0, 3)]) });
  if (kind === 'bft') { const n = pick([2, 4, 6, 8, 10]); return mk(`Hoe heet windkracht ${n} op de schaal van Beaufort?`, BEAUFORT[n].name, [...new Set(BEAUFORT.filter((b) => b.name !== BEAUFORT[n].name).map((b) => b.name))]); }
  if (kind === 'wolk') { const c = pick(CLOUDS); return mk(`Welke wolk is dit? "${c.desc}"`, c.name, CLOUDS.filter((x) => x !== c).map((x) => x.name)); }
  if (kind === 'wolkdesc') { const c = pick(CLOUDS.slice(0, 4)); return mk(`Wat brengt een ${c.name.split(' (')[0].toLowerCase()} meestal?`, c.desc.split('. ').pop().replace(/\.$/, ''), CLOUDS.filter((x) => x !== c).map((x) => x.desc.split('. ').pop().replace(/\.$/, ''))); }
  if (kind === 'uv') { const u = pick([1, 4, 7, 9, 12]); return mk(`De UV-index is ${u}. Hoe noemen we dat?`, uvInfo(u).level, ['Laag', 'Matig', 'Hoog', 'Zeer hoog', 'Extreem']); }
  if (kind === 'wind') { const d = pick([0, 90, 180, 270]); return mk(`De wind komt uit het ${windFrom(d)}. Waar waait hij naartoe?`, windFrom(d + 180), ['noorden', 'oosten', 'zuiden', 'westen']); }
  const m = pick([[0, 'Nieuwe maan'], [0.25, 'Eerste kwartier'], [0.5, 'Volle maan'], [0.75, 'Laatste kwartier']]);
  return mk(`Hoe heet de maan als de fase ${Math.round(m[0] * 100)} procent door de maand is?`, m[1], ['Nieuwe maan', 'Eerste kwartier', 'Volle maan', 'Laatste kwartier']);
}
