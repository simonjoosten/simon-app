// puzzel-extra.js - pure logica voor de extra's van de puzzel-apps: 100 extra levels per puzzel en de dagelijkse puzzel.
// De extra levels zijn de eerste 100 levels van de eindeloze modus van elk spel: die worden deterministisch GEBOUWD uit een
// opgelost eindbeeld (achterwaarts gegenereerd), dus ze zijn per constructie oplosbaar (bewezen in tools/test-puzzel-extra.mjs).
// Een extra level start het spel met een afgeleide save (aparte opslag; de gewone voortgang blijft ongemoeid).
export const EXTRA_COUNT = 100;
export const FIXED = { kratjes: 300, verbind: 300, knopen: 300, pinnen: 300, tangram: 300 };
export const GAMES = {
  kratjes: { name: 'Kratjes schuiven', icon: 'chest', tip: 'Duw alle kratten op de doelen.' },
  verbind: { name: 'Verbind de kleuren', icon: 'rainbow', tip: 'Verbind gelijke kleuren zonder te kruisen.' },
  knopen: { name: 'Knopen ontwarren', icon: 'magnet', tip: 'Sleep de knopen tot geen lijn meer kruist.' },
  pinnen: { name: 'Pinnenspel', icon: 'target', tip: 'Spring over pinnen tot er één over is.' },
  tangram: { name: 'Tangram', icon: 'puzzle', tip: 'Leg de stukken precies in de vorm.' },
};

const pad2 = (n) => (n < 10 ? '0' : '') + n;
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export function prevDateKey(key) { const [y, m, d] = key.split('-').map(Number); const t = new Date(y, m - 1, d - 1, 12); return dateKey(t); }
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// welk extra level (0..99) is vandaag de dagelijkse puzzel van dit spel? Voor elke dag en elk spel stabiel.
export function dailyIndex(id, key) { return hash(id + ':' + key) % EXTRA_COUNT; }

// De save waarmee het spel op extra level n (0..99) start. Alle vaste levels staan op "gehaald" zodat de eindeloze modus open is.
export function extraSave(id, n) {
  n = Math.max(0, Math.min(EXTRA_COUNT - 1, n | 0));
  const F = FIXED[id], L = F + n;
  switch (id) {
    case 'kratjes': return { v: 2, lv: L, s: '3'.repeat(L) };
    case 'verbind': return { v: 2, l: L, m: L, b: '3'.repeat(F), h: 3 };
    case 'knopen': return { v: 2, l: L + 1, m: L + 1, s: '3'.repeat(F) };
    case 'pinnen': return { v: 2, l: L, m: L, s: '3'.repeat(F), e: 0, h: 5 };
    case 'tangram': return { v: 2, lv: L, p: 'f'.repeat(Math.ceil(F / 2)), es: 0, ec: n, h: 5 };
    default: return null;
  }
}
// Welk extra level (0..99) staat er in een save die het spel schrijft? null = geen extra level (of een gewoon level)
export function levelOfSave(id, o) {
  if (!o || typeof o !== 'object') return null;
  const F = FIXED[id];
  let L;
  switch (id) {
    case 'kratjes': case 'tangram': L = o.lv; break;
    case 'verbind': case 'pinnen': L = o.l; break;
    case 'knopen': L = (o.l | 0) - 1; break;
    default: return null;
  }
  L = L | 0;
  return L >= F ? L - F : null;
}

// ---- voortgang van extra levels en dagelijkse puzzel: { x: '0123..' (100 tekens, sterren per level), d: {datum: sterren} }
export function emptyProgress() { return { x: '0'.repeat(EXTRA_COUNT), d: {} }; }
export function cleanProgress(o) {
  const p = emptyProgress();
  if (!o || typeof o !== 'object') return p;
  if (typeof o.x === 'string') p.x = (o.x.replace(/[^0-3]/g, '') + p.x).slice(0, EXTRA_COUNT);
  if (o.d && typeof o.d === 'object') {
    const keys = Object.keys(o.d).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort().slice(-60);
    for (const k of keys) p.d[k] = Math.max(1, Math.min(3, o.d[k] | 0 || 1));
  }
  return p;
}
export function recordExtra(p, n, stars) {
  if (!(n >= 0 && n < EXTRA_COUNT)) return p;
  const cur = +p.x[n] || 0, s = Math.max(1, Math.min(3, stars | 0 || 1));
  if (s > cur) p.x = p.x.slice(0, n) + s + p.x.slice(n + 1);
  return p;
}
export function recordDaily(p, key, stars) {
  const s = Math.max(1, Math.min(3, stars | 0 || 1));
  if ((p.d[key] || 0) < s) p.d[key] = s;
  const keys = Object.keys(p.d).sort();
  while (keys.length > 60) delete p.d[keys.shift()];
  return p;
}
export const extraStats = (p) => { let done = 0, stars = 0; for (const c of p.x) { if (+c) { done++; stars += +c; } } return { done, stars, max: EXTRA_COUNT * 3 }; };
export function dailyStreak(p, today) {
  let n = 0, k = today;
  if (!p.d[k]) k = prevDateKey(k); // vandaag nog niet gedaan: de reeks van gisteren telt nog
  while (p.d[k]) { n++; k = prevDateKey(k); }
  return n;
}
// Het spel meldt zijn totaal aan sterren via score(); een stijging = een level (opnieuw) gehaald. -> aantal sterren (1-3) of 0
export const starsFromScoreDelta = (prev, now) => (now > prev ? Math.max(1, Math.min(3, now - prev)) : 0);
// milestones in de gewone modus: elke 30 sterren een mijlpaal, elke 90 een wereld-mijlpaal
export function milestone(prev, now) {
  if (!(now > prev)) return null;
  if (Math.floor(now / 90) > Math.floor(prev / 90)) return 'wereld';
  if (Math.floor(now / 30) > Math.floor(prev / 30)) return 'mijlpaal';
  return null;
}
