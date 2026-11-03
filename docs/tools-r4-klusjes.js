// Klusjes, ronde 4: tab "Extra" met Klusjes-bingo (elke week een nieuwe kaart), Spaarplanner, Puntenoverzicht (14 dagen) en Verrassingsklusje.
// Alles wordt berekend uit de bestaande klusjes en taakpunten: er komen geen nieuwe collecties of rechten bij.
import * as K from './klusjes-core.js?v=1';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hash = (s) => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed) => { let a = hash(seed); return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

/** Bingo-soorten: naam en de iconen waarmee een klusje erbij hoort. */
export const SOORTEN = [
  { id: 'keuken', n: 'Keuken', ic: 'cookie', icons: ['cookie', 'pizza'] }, { id: 'schoon', n: 'Schoonmaken', ic: 'bell', icons: ['bell', 'gear', 'paint'] }, { id: 'afval', n: 'Afval', ic: 'bomb', icons: ['bomb'] },
  { id: 'dieren', n: 'Dieren', ic: 'dog', icons: ['dog', 'cat', 'rabbit', 'fish'] }, { id: 'tuin', n: 'Tuin', ic: 'flower', icons: ['flower', 'leaf'] }, { id: 'was', n: 'Was', ic: 'cloud', icons: ['cloud'] },
  { id: 'kamer', n: 'Opruimen', ic: 'house', icons: ['house'] }, { id: 'winkel', n: 'Boodschappen', ic: 'bag', icons: ['bag'] }, { id: 'hulp', n: 'Helpen', ic: 'heart', icons: ['heart', 'star'] },
  { id: 'wiel', n: 'Auto en fiets', ic: 'car', icons: ['car'] }, { id: 'boek', n: 'Leren', ic: 'book', icons: ['book'] },
];
/** 9 vakjes voor deze week en deze speler (altijd dezelfde kaart binnen een week). */
export function bingoCard(wk, uid) {
  const r = rng(`${wk}|${uid}`), a = SOORTEN.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, 9);
}
/** Klusjes van deze week die ik deed (goedgekeurd), vanaf maandag. */
export function doneThisWeek(chores, uid, now = Date.now()) {
  const mon = K.mondayOf(now);
  return chores.filter((x) => x.status === 'done' && x.doneBy === uid && (x.approvedAt || 0) >= mon);
}
export function bingoState(card, done) {
  const hit = card.map((s) => done.some((c) => s.icons.includes(K.choreIcon(c))));
  const L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const lines = L.filter((l) => l.every((i) => hit[i])).length;
  return { hit, lines, full: hit.every(Boolean), count: hit.filter(Boolean).length };
}
/** Punten per dag voor de laatste n dagen (oud -> nieuw). */
export function perDay(chores, uid, now = Date.now(), n = 14) {
  const out = []; const t0 = K.startOfDay(now);
  for (let i = n - 1; i >= 0; i--) { const d0 = t0 - i * K.DAY, d1 = d0 + K.DAY; const pts = chores.filter((x) => x.status === 'done' && x.doneBy === uid && (x.approvedAt || 0) >= d0 && (x.approvedAt || 0) < d1).reduce((a, x) => a + (x.given ?? x.points ?? 0), 0); out.push({ ts: d0, pts }); }
  return out;
}
/** Wanneer haal ik de volgende beloning? */
export function forecast(days, total, need) {
  const sum = days.reduce((a, d) => a + d.pts, 0), avg = sum / Math.max(1, days.length), left = Math.max(0, need - total);
  if (left === 0) return { left: 0, avg, days: 0 };
  if (avg <= 0) return { left, avg: 0, days: null };
  return { left, avg, days: Math.ceil(left / avg) };
}
/** Verrassingsklusje van vandaag (altijd hetzelfde voor dezelfde dag en speler, 'again' geeft een andere). */
export function surprise(dayKey, uid, again = 0) {
  const all = K.CHORE_TEMPLATES.flatMap((g) => g.items.map((it) => ({ title: it[0], points: it[1], icon: it[2], group: g.n })));
  return all[Math.floor(rng(`${dayKey}|${uid}|${again}`)() * all.length)];
}

export function extraHtml({ chores, stats, miles, claims, me, now = Date.now(), plan = {}, ic }) {
  const wk = K.weekKey(new Date(now)), card = bingoCard(wk, me.uid), done = doneThisWeek(chores, me.uid, now), B = bingoState(card, done);
  const my = stats.find((x) => x.id === me.uid) || { total: 0 }, total = my.total || 0, next = K.nextMilestone(miles, claims, total), days = perDay(chores, me.uid, now), fc = next ? forecast(days, total, next.need) : null;
  const mx = Math.max(1, ...days.map((d) => d.pts)), today = K.dayKey(new Date(now)), sur = plan.surprise && plan.surprise.day === today ? plan.surprise : null;
  const s = sur ? { title: sur.title, points: sur.points, icon: sur.icon } : surprise(today, me.uid, plan.again || 0);
  return `<div class="ak-card"><h3>Klusjes-bingo</h3><small class="mute">Doe een klusje van elke soort. Een rij, kolom of schuine lijn is bingo! ${B.count} van 9 gehaald.</small>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem;margin-top:.5rem">${card.map((c, i) => `<div style="text-align:center;padding:.5rem .2rem;border-radius:14px;border:2px solid ${B.hit[i] ? '#16a34a' : 'var(--line)'};background:${B.hit[i] ? 'rgba(22,163,74,.15)' : 'var(--card)'};min-height:76px">${ic(c.ic, { size: 40 })}<div style="font-size:.78rem;font-weight:700">${esc(c.n)}${B.hit[i] ? ' ✓' : ''}</div></div>`).join('')}</div>
      <p style="margin:.6rem 0 0"><b>${B.full ? 'Volle kaart! Je bent een klusheld!' : B.lines ? `Bingo! ${B.lines} ${B.lines === 1 ? 'lijn' : 'lijnen'} vol.` : 'Nog geen bingo. Succes!'}</b></p></div>
    <div class="ak-card"><h3>Spaarplanner</h3>${next ? `<div class="row" style="margin:0">${ic(next.icon && next.icon.length < 20 ? next.icon : 'gift', { size: 56 })}<div style="flex:1"><b>${esc(next.title)}</b><br><small class="mute">Nog ${fc.left} punten</small></div></div>
      <p style="margin:.4rem 0 0">${fc.days == null ? 'Doe een paar klusjes, dan reken ik uit wanneer je er bent.' : `Je haalt gemiddeld <b>${(Math.round(fc.avg * 10) / 10).toString().replace('.', ',')}</b> punten per dag. Zo ben je er over ongeveer <b>${fc.days} ${fc.days === 1 ? 'dag' : 'dagen'}</b>.`}</p>` : '<small class="mute">Er is nu geen beloning om voor te sparen.</small>'}</div>
    <div class="ak-card"><h3>Mijn punten, 14 dagen</h3><div style="display:flex;gap:3px;align-items:flex-end;height:90px">${days.map((d) => `<div title="${d.pts} punten" style="flex:1;min-width:0;height:${d.pts ? Math.max(6, Math.round(86 * d.pts / mx)) : 3}px;background:${d.pts ? 'var(--accent)' : 'var(--line)'};border-radius:4px 4px 0 0"></div>`).join('')}</div>
      <small class="mute">Samen ${days.reduce((a, d) => a + d.pts, 0)} punten · beste dag ${Math.max(...days.map((d) => d.pts))} punten</small></div>
    <div class="ak-card"><h3>Verrassingsklusje</h3><div class="row" style="margin:0">${ic(s.icon, { size: 56 })}<div style="flex:1"><b>${esc(s.title)}</b><br><small class="mute">Doe dit extra, dan ben je een topper (${s.points} punten als Simon het toevoegt).</small></div></div>
      <div class="row" style="margin-top:.5rem">${sur && sur.ok ? '<span class="ak-chip on">Ik ga het doen!</span>' : '<button class="ak-big pri" data-sur="ok">Ik ga het doen</button>'}<button class="ak-big" data-sur="again">Andere</button></div></div>`;
}
