// Agenda, ronde 4: tab "Overzicht" met jaar-heatmap, statistiek per soort, vrije dagen-vinder en export naar je telefoonagenda (.ics).
// Alles is zuiver (events erin, html of tekst eruit) zodat het testbaar is zonder DOM of Firebase. Herhalingen (2-wekelijks, maandelijks) staan in agenda-core.js.
import * as C from './agenda-core.js?v=1';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Aantal afspraken per dag voor een heel jaar: { 'YYYY-MM-DD': n } (alleen dagen met n>0). */
export function yearCounts(events, year) {
  const out = {}; const start = `${year}-01-01`, days = C.isLeap(year) ? 366 : 365;
  for (let i = 0; i < days; i++) { const k = C.addDays(start, i); let n = 0; for (const e of events) if (C.occursOn(e, k)) n++; if (n) out[k] = n; }
  return out;
}
/** Aantal afspraken per soort (kleur) in een maand: [{cat, n}] aflopend. */
export function catStats(events, year, month0) {
  const first = `${year}-${C.pad(month0 + 1)}-01`, len = new Date(year, month0 + 1, 0).getDate(), m = new Map();
  for (let i = 0; i < len; i++) { const k = C.addDays(first, i); for (const e of events) if (C.occursOn(e, k)) { const c = C.catOf(e.color); m.set(c.id, { cat: c, n: ((m.get(c.id) || {}).n || 0) + 1 }); } }
  return [...m.values()].sort((a, b) => b.n - a.n);
}
/** Eerste `max` vrije dagen (geen afspraak) vanaf `from`, kijkend `span` dagen vooruit. */
export function freeDays(events, from, span = 21, max = 5) {
  const out = []; for (let i = 0; i < span && out.length < max; i++) { const k = C.addDays(from, i); if (!events.some((e) => C.occursOn(e, k))) out.push(k); } return out;
}
/** Drukste dagen in de komende `span` dagen. */
export function busiestDays(events, from, span = 30, max = 3) {
  const a = []; for (let i = 0; i < span; i++) { const k = C.addDays(from, i); const n = events.filter((e) => C.occursOn(e, k)).length; if (n > 1) a.push({ key: k, n }); }
  return a.sort((x, y) => y.n - x.n || x.key.localeCompare(y.key)).slice(0, max);
}
const icsEsc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
/** Tekst voor een .ics-bestand. Herhalingen worden RRULE's. */
export function toIcs(events, stamp = '20260101T000000Z') {
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//simon-app//agenda//NL', 'CALSCALE:GREGORIAN'];
  for (const e of events) {
    if (!e || !e.date) continue; const d = e.date.replace(/-/g, ''), t = /^\d{2}:\d{2}$/.test(e.time || '') ? e.time.replace(':', '') + '00' : '';
    L.push('BEGIN:VEVENT', `UID:${icsEsc(e.id || e.title)}-${d}@simon-app`, `DTSTAMP:${stamp}`);
    if (t) L.push(`DTSTART:${d}T${t}`, `DTEND:${d}T${t}`); else L.push(`DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${C.addDays(e.date, 1).replace(/-/g, '')}`);
    L.push(`SUMMARY:${icsEsc(e.title)}`); if (e.note) L.push(`DESCRIPTION:${icsEsc(e.note)}`);
    const rr = { weekly: 'FREQ=WEEKLY', biweekly: 'FREQ=WEEKLY;INTERVAL=2', monthly: 'FREQ=MONTHLY', yearly: 'FREQ=YEARLY' }[e.repeat]; if (rr) L.push(`RRULE:${rr}`);
    L.push('END:VEVENT');
  }
  L.push('END:VCALENDAR'); return L.join('\r\n') + '\r\n';
}

/** HTML van de tab. env: { events (zichtbaar), year, today, ic } */
export function overzichtHtml({ events, year, today, ic }) {
  const counts = yearCounts(events, year), max = Math.max(1, ...Object.values(counts));
  const shade = (n) => (n ? `rgba(225,29,72,${0.2 + 0.7 * n / max})` : 'var(--line)');
  const months = C.MONTHS.map((nm, m0) => {
    const weeks = C.monthGrid(year, m0);
    return `<div style="min-width:0"><b style="font-size:.8rem">${nm.slice(0, 3)}</b><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-top:2px">${weeks.flat().map((c) => c.inMonth ? `<button data-goday="${c.key}" aria-label="${c.key}: ${counts[c.key] || 0} afspraken" style="aspect-ratio:1;min-height:0;min-width:0;padding:0;border-radius:3px;border:${c.key === today ? '2px solid var(--accent)' : '0'};background:${shade(counts[c.key])}"></button>` : '<span></span>').join('')}</div></div>`;
  }).join('');
  const cm = new Date(today + 'T12:00:00'), stats = catStats(events, cm.getFullYear(), cm.getMonth()), tot = stats.reduce((a, s) => a + s.n, 0) || 1;
  const free = freeDays(events, today), busy = busiestDays(events, today);
  return `<div class="ak-card"><h3>Jaaroverzicht ${year}</h3><small class="mute">Hoe roder, hoe drukker. Tik op een dag om hem te openen.</small>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.7rem;margin-top:.5rem">${months}</div></div>
    <div class="ak-card"><h3>Deze maand per soort</h3>${stats.length ? stats.map((s) => `<div class="row" style="margin:.25rem 0">${ic(s.cat.ic, { size: 28 })}<span style="width:6.5rem">${esc(s.cat.n)}</span><span style="flex:1;height:12px;border-radius:99px;background:var(--line);overflow:hidden"><i style="display:block;height:100%;width:${Math.round(100 * s.n / tot)}%;background:${s.cat.c}"></i></span><b>${s.n}</b></div>`).join('') : '<small class="mute">Deze maand staat nog niets.</small>'}</div>
    <div class="ak-card"><h3>Vrije dagen</h3><small class="mute">De eerstvolgende dagen zonder afspraak:</small><div class="ak-chips" style="margin-top:.4rem">${free.length ? free.map((k) => `<button class="ak-chip" data-goday="${k}" style="border:0;min-height:40px">${C.shortDate ? esc(C.shortDate(k)) : k}</button>`).join('') : '<small>De komende weken zit vol!</small>'}</div>
      ${busy.length ? `<h3 style="margin-top:.8rem">Drukste dagen</h3><div class="ak-chips">${busy.map((b) => `<button class="ak-chip" data-goday="${b.key}" style="border:0;min-height:40px">${C.shortDate ? esc(C.shortDate(b.key)) : b.key} · ${b.n}</button>`).join('')}</div>` : ''}</div>
    <div class="ak-card"><h3>Naar je telefoonagenda</h3><small class="mute">Maak een .ics-bestand van deze afspraken. Open het op je telefoon of computer om ze in Apple Agenda of Google Agenda te zetten.</small><div style="margin-top:.5rem"><button class="ak-big pri" data-ics>Download .ics</button></div></div>`;
}
