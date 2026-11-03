// Gewoontes, ronde 4: tab "Inzicht" met weekuitdaging (verzonnen uit jouw gewoontes, voortgang wordt berekend: er is niets extra opgeslagen),
// reeksen in gevaar, sterke en zwakke dagen, vier-weken-trend, tip van de dag en een deelbare terugblik.
// Alles zuiver: html/tekst uit (habits, todayKey). De opslag van gewoontes verandert niet.
import * as G from './gewoontes-core.js?v=1';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export const DAG_LANG = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];

export const TIPS = [
  'Begin klein: twee minuten per dag is beter dan een uur één keer.', 'Koppel een nieuwe gewoonte aan iets wat je al doet, bijvoorbeeld na het tandenpoetsen.', 'Leg je spullen klaar de avond ervoor.',
  'Een gemiste dag is niet erg. Mis alleen nooit twee dagen achter elkaar.', 'Vier elk succesje, ook een klein.', 'Vertel een vriend of ouder wat je gaat doen. Dan houd je het langer vol.',
  'Kies een vast moment, dan hoef je er niet over na te denken.', 'Een goede gewoonte voelt na drie weken al een stuk makkelijker.', 'Maak het leuk: zet er muziek bij aan.',
  'Beloon jezelf met iets kleins als je een reeks van zeven dagen haalt.', 'Als iets te moeilijk is, maak het kleiner. Eén push-up telt ook.', 'Slaap goed: met uitgeruste hersenen houd je alles beter vol.',
  'Kijk eens terug hoe ver je al bent gekomen.', 'Drink een glas water zodra je wakker wordt.', 'Doe de lastigste gewoonte als eerste, dan is de rest een feestje.',
  'Zet een gewoonte op je kamerdeur of spiegel als herinnering.', 'Je hoeft niet perfect te zijn, alleen te blijven proberen.', 'Plan gewoontes op de dagen waarop je ze echt kunt doen.',
  'Elke dag een beetje wordt samen heel veel.', 'Een reeks verliezen? Begin gewoon opnieuw: dat is moed.', 'Zoek een gewoonte-maatje en tel samen af.', 'Vier de mijlpaal: 7, 14, 30 dagen!',
  'Schrijf op waarom je het doet. Dat helpt op saaie dagen.', 'Houd je gewoontes kort en haalbaar.', 'Een lege dag is een nieuwe kans, geen mislukking.',
];
export const tipOf = (dayKey) => TIPS[hashStr(dayKey) % TIPS.length];

/** Maandag van de week van `k`. */
export const weekStart = (k) => G.shiftKey(k, -G.dow(k));
/** Aantal keer gedaan deze week + hoeveel dagen het deze week moest. */
export function weekProgress(h, todayKey) {
  const ws = weekStart(todayKey); let done = 0, due = 0;
  for (let i = 0; i < 7; i++) { const k = G.shiftKey(ws, i); if (G.isDue(h, k)) { due++; if (h.days[k]) done++; } }
  return { done, due };
}
/** De weekuitdaging: kies per week deterministisch een gewoonte en een doel. */
export function weekChallenge(habits, todayKey) {
  if (!habits.length) return null;
  const ws = weekStart(todayKey), h = habits[hashStr(ws) % habits.length], p = weekProgress(h, todayKey);
  const goal = Math.max(1, Math.min(p.due || 7, (p.due || 7) >= 5 ? (p.due || 7) - 1 : p.due || 7)), left = G.dow(todayKey) < 6 ? 6 - G.dow(todayKey) : 0;
  const status = p.done >= goal ? 'klaar' : p.done + left + (h.days[todayKey] || !G.isDue(h, todayKey) ? 0 : 1) < goal ? 'mislukt' : 'bezig';
  return { habit: h, goal, done: p.done, status, bonus: 15 + goal * 3 };
}
/** Reeksen in gevaar: reeks van 3+ en vandaag nog niet gedaan terwijl het moet. */
export function atRisk(habits, todayKey) {
  return habits.map((h) => ({ h, n: G.streakSched(h, todayKey) })).filter((x) => x.n >= 3 && G.isDue(x.h, todayKey) && !x.h.days[todayKey]).sort((a, b) => b.n - a.n);
}
/** Percentage gehaald per weekdag (ma..zo) over de laatste 8 weken; null als nooit nodig. */
export function dayRates(habits, todayKey, weeks = 8) {
  const due = Array(7).fill(0), done = Array(7).fill(0);
  for (let i = 0; i < weeks * 7; i++) { const k = G.shiftKey(todayKey, -i), w = G.dow(k); habits.forEach((h) => { if (h.created && k < G.dayKey(new Date(h.created - 86400000))) return; if (G.isDue(h, k)) { due[w]++; if (h.days[k]) done[w]++; } }); }
  return due.map((d, i) => (d ? Math.round(100 * done[i] / d) : null));
}
/** Totaal-percentage per week voor de laatste 4 weken (oud -> nieuw). */
export function weekTrend(habits, todayKey, weeks = 4) {
  const out = [], ws = weekStart(todayKey);
  for (let w = weeks - 1; w >= 0; w--) {
    const start = G.shiftKey(ws, -7 * w); let due = 0, done = 0;
    for (let i = 0; i < 7; i++) { const k = G.shiftKey(start, i); if (k > todayKey) break; habits.forEach((h) => { if (h.created && k < G.dayKey(new Date(h.created - 86400000))) return; if (G.isDue(h, k)) { due++; if (h.days[k]) done++; } }); }
    out.push({ start, pct: due ? Math.round(100 * done / due) : null });
  }
  return out;
}
/** Tekst om te delen. */
export function terugblik(habits, todayKey, naam = '') {
  const ws = weekStart(todayKey), st = G.dayStatus ? null : null; let done = 0, due = 0, perfect = 0;
  for (let i = 0; i < 7; i++) { const k = G.shiftKey(ws, i); if (k > todayKey) break; const s = G.dayStatus(habits, k); done += s.done; due += s.due; if (G.isPerfect(habits, k)) perfect++; }
  const best = habits.map((h) => ({ n: h.name, s: G.streakSched(h, todayKey) })).sort((a, b) => b.s - a.s)[0];
  return `Mijn gewoontes deze week${naam ? ` (${naam})` : ''}: ${done} van ${due} gedaan${due ? ` (${Math.round(100 * done / due)}%)` : ''}. ${perfect ? `${perfect} perfecte ${perfect === 1 ? 'dag' : 'dagen'}. ` : ''}${best && best.s ? `Langste reeks: ${best.n}, ${best.s} ${best.s === 1 ? 'dag' : 'dagen'} achter elkaar.` : 'Een nieuwe week, een nieuwe kans!'}`;
}

export function inzichtHtml({ habits, today, ic }) {
  if (!habits.length) return `<div class="ak-card"><small class="mute">Voeg eerst een gewoonte toe, dan verschijnen hier uitdagingen en inzichten.</small></div><div class="ak-card"><h3>Tip van de dag</h3><p>${esc(tipOf(today))}</p></div>`;
  const ch = weekChallenge(habits, today), risk = atRisk(habits, today), rates = dayRates(habits, today), tr = weekTrend(habits, today);
  const known = rates.map((r, i) => ({ r, i })).filter((x) => x.r != null), top = known.slice().sort((a, b) => b.r - a.r)[0], low = known.slice().sort((a, b) => a.r - b.r)[0];
  return `<div class="ak-card"><h3>Weekuitdaging</h3>${ch ? `<div class="row" style="margin:0">${ch.habit.icon ? ic(ch.habit.icon, { size: 44 }) : `<span style="font-size:2rem">${esc(ch.habit.emoji)}</span>`}<div style="flex:1"><b>Doe "${esc(ch.habit.name)}" ${ch.goal}x deze week</b><br><small class="mute">${ch.done} van ${ch.goal} gehaald${ch.status === 'klaar' ? ' · Gelukt!' : ch.status === 'mislukt' ? ' · Dit lukt niet meer, volgende week nieuwe kans' : ''}</small></div></div>
      <div style="height:12px;border-radius:99px;background:var(--line);overflow:hidden;margin-top:.5rem"><i style="display:block;height:100%;width:${Math.min(100, Math.round(100 * ch.done / ch.goal))}%;background:${ch.status === 'klaar' ? '#16a34a' : 'var(--accent)'}"></i></div>` : ''}</div>
    ${risk.length ? `<div class="ak-card" style="border-color:#f59e0b"><h3>${ic('flame', { size: 26 })} Reeks in gevaar!</h3>${risk.slice(0, 4).map((x) => `<div class="row" style="margin:.25rem 0"><b style="flex:1">${esc(x.h.name)}</b><span class="ak-chip">${x.n} dagen</span><button class="ak-big pri" data-toggle="${esc(x.h.id)}">Nu doen</button></div>`).join('')}</div>` : ''}
    <div class="ak-card"><h3>Sterke en zwakke dagen</h3><div style="display:flex;gap:4px;align-items:flex-end;height:90px">${rates.map((r, i) => `<div style="flex:1;text-align:center"><div style="height:${r == null ? 4 : Math.max(4, Math.round(r * 0.7))}px;background:${top && i === top.i ? '#16a34a' : low && i === low.i && known.length > 1 ? '#f59e0b' : 'var(--accent)'};border-radius:4px 4px 0 0"></div><small>${G.DAY_NAMES[i]}</small></div>`).join('')}</div>
      ${top ? `<small class="mute">Jouw beste dag is <b>${DAG_LANG[top.i]}</b> (${top.r}%).${low && low.i !== top.i ? ` ${DAG_LANG[low.i]} is lastiger (${low.r}%): plan daar iets makkelijks.` : ''}</small>` : ''}</div>
    <div class="ak-card"><h3>Laatste 4 weken</h3><div class="row" style="align-items:flex-end;gap:.5rem">${tr.map((t) => `<div style="flex:1;text-align:center"><div style="height:${t.pct == null ? 4 : Math.max(4, t.pct * 0.8)}px;background:var(--accent);border-radius:6px"></div><b>${t.pct == null ? '–' : t.pct + '%'}</b><br><small class="mute">${t.start.slice(5).split('-').reverse().join('-')}</small></div>`).join('')}</div></div>
    <div class="ak-card"><h3>Tip van de dag</h3><p style="margin:.2rem 0">${esc(tipOf(today))}</p></div>
    <div class="ak-card"><h3>Terugblik delen</h3><p style="margin:.2rem 0"><small>${esc(terugblik(habits, today))}</small></p><button class="ak-big" data-copyweek>Kopieer tekst</button> <small data-copymsg class="mute"></small></div>`;
}
