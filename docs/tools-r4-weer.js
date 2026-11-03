// Weer, ronde 4: tab "Mijn weer" met Weerbericht (leesbaar en voorlezen), Dagboek, Gok het weer (punten) en Kalender-statistiek (14 dagen).
// Pure functies bovenaan; mijnWeerTab(b, env) tekent. Eigen data in store.d.r4 (klein: max 30 dagboekregels, 20 gokken).
import * as W from './weer-core.js?v=1';
import { esc, injectR4Css, sectionsHtml, bindSections, clamp, dayKey, blip } from './tools-r4-kit.js?v=1';

const f0 = (v) => Math.round(v);
/** Een kort weerbericht voor vandaag en morgen, in kindertaal. */
export function weerBericht(st, now = Date.now()) {
  const c = st.current, d0 = st.days[0] || {}, d1 = st.days[1] || null, info = W.wmoInfo(c.code, !c.day);
  const out = [`Goedendag! Op dit moment is het ${f0(c.temp)} graden en het weer is: ${info.text.toLowerCase()}.`];
  out.push(`Vandaag wordt het hooguit ${f0(d0.max)} graden en minimaal ${f0(d0.min)} graden.`);
  if (d0.rain >= 0.5) out.push(`Er valt vandaag ${String(d0.rain.toFixed(1)).replace('.', ',')} millimeter regen, dus pak een jas of paraplu.`); else out.push('Het blijft vandaag droog.');
  if (c.wind >= 30) out.push(`Het waait stevig, windkracht ${W.bft(c.wind)}.`);
  if (d1) out.push(`Morgen: ${W.wmoInfo(d1.code).text.toLowerCase()}, tot ${f0(d1.max)} graden${d1.rain >= 0.5 ? ' en regen' : ''}.`);
  out.push(c.temp < 5 ? 'Trek je warme jas aan!' : c.temp > 24 ? 'Vergeet je water en zonnebrand niet.' : 'Fijne dag!');
  return out.join(' ');
}
/** Statistiek over de komende dagen. */
export function kalenderStats(days) {
  if (!days.length) return null;
  const by = (f, mx = true) => days.reduce((b, d, i) => (b == null || (mx ? f(d) > f(days[b]) : f(d) < f(days[b])) ? i : b), null);
  return {
    droog: days.filter((d) => d.rain < 0.5).length, nat: days.filter((d) => d.rain >= 0.5).length, vorst: days.filter((d) => d.min <= 0).length, zomers: days.filter((d) => d.max >= 25).length,
    warm: by((d) => d.max), koud: by((d) => d.min, false), nat1: by((d) => d.rain), wind: by((d) => d.wind), zon: by((d) => d.sunHours || 0), totRegen: days.reduce((a, d) => a + d.rain, 0),
  };
}
/** Gok-het-weer: punten voor temperatuur (±) en regen (ja/nee). */
export function gokScore(g, actual) {
  const dt = Math.abs(g.temp - actual.max), tp = dt <= 0.5 ? 60 : dt <= 1.5 ? 45 : dt <= 3 ? 30 : dt <= 5 ? 15 : 0;
  const rainReal = actual.rain >= 0.5, rp = g.rain === rainReal ? 40 : 0;
  return { punten: tp + rp, tempOk: dt <= 1.5, regenOk: g.rain === rainReal, diff: Math.round(dt * 10) / 10 };
}
export function dagboekReeks(diary, today = dayKey()) {
  const set = new Set(diary.map((e) => e.date)); let n = 0; const d = new Date(today + 'T12:00:00');
  if (!set.has(today)) d.setDate(d.getDate() - 1);
  while (set.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
export const MOODS = [['sun', 'Zonnig'], ['cloud', 'Bewolkt'], ['rain', 'Regen'], ['snowflake', 'Sneeuw'], ['bolt', 'Onweer'], ['windmill', 'Winderig']];

export function mijnWeerTab(b, env) {
  injectR4Css();
  const { st, store, icon, track, loc } = env;
  const R = () => (store.get().r4 ||= { diary: [], guesses: [], pts: 0 });
  const save = () => store.set(store.get());
  let sec = 'bericht', speaking = false;
  const draw = () => { b.innerHTML = `${sectionsHtml([['bericht', 'Weerbericht'], ['boek', 'Dagboek'], ['gok', 'Gok het weer'], ['kal', 'Statistiek']], sec)}<div data-r4></div>`; bindSections(b, (k) => { try { speechSynthesis.cancel(); } catch {} sec = k; draw(); }); ({ bericht, boek, gok, kal })[sec](b.querySelector('[data-r4]')); };
  track(() => { try { speechSynthesis.cancel(); } catch {} });

  function bericht(h) {
    const txt = weerBericht(st), can = typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
    h.innerHTML = `<div class="r4-card"><b>Weerbericht voor ${esc(loc.name)}</b><p data-txt style="font-size:1.1rem;line-height:1.5">${esc(txt)}</p>
      <div class="r4-row">${can ? '<button class="r4-btn pri" data-say>Lees voor</button>' : ''}<button class="r4-btn" data-copy>Kopieer</button></div><small data-msg></small></div>`;
    const say = h.querySelector('[data-say]');
    if (say) say.onclick = () => { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(txt); u.lang = 'nl-NL'; u.rate = 0.95; speechSynthesis.speak(u); } catch {} };
    h.querySelector('[data-copy]').onclick = async () => { try { await navigator.clipboard.writeText(txt); h.querySelector('[data-msg]').textContent = 'Gekopieerd!'; } catch { h.querySelector('[data-msg]').textContent = 'Kopiëren lukt niet op dit toestel.'; } };
  }

  function boek(h) {
    const r = R(), today = dayKey(); let mood = 'sun';
    const done = r.diary.find((e) => e.date === today);
    h.innerHTML = `<div class="r4-card"><b>Mijn weerdagboek</b> <span class="r4-chip">Reeks: ${dagboekReeks(r.diary)} ${dagboekReeks(r.diary) === 1 ? 'dag' : 'dagen'}</span>
      ${done ? `<p>Vandaag opgeschreven: ${icon(done.mood, { size: 28 })} ${esc(done.note || '')} <small>(het was ${done.temp}° toen jij schreef)</small></p>` : `<p><small>Kijk naar buiten. Wat zie je? Dan vergelijken we met de weerdienst.</small></p>
      <div class="r4-row" data-moods>${MOODS.map(([m, n]) => `<button class="r4-btn ${m === mood ? 'pri' : ''}" data-m="${m}" aria-label="${n}" style="min-width:56px">${icon(m, { size: 30 })}</button>`).join('')}</div>
      <input class="r4-in" data-note placeholder="Wat merk je? (bijv. koude wind)" maxlength="60" style="margin:.5rem 0"><button class="r4-btn pri" data-save>Opschrijven</button>`}</div>
      <div class="r4-card"><b>Laatste dagen</b>${r.diary.length ? r.diary.slice().reverse().slice(0, 10).map((e) => `<div class="r4-row" style="border-top:1px solid var(--line);padding:.3rem 0">${icon(e.mood, { size: 30 })}<b>${esc(e.date.slice(5).split('-').reverse().join('-'))}</b><span style="flex:1">${esc(e.note || '')}</span><small>${e.temp}°</small></div>`).join('') : '<small>Nog niets opgeschreven.</small>'}</div>`;
    if (!done) {
      h.querySelectorAll('[data-m]').forEach((x) => { x.onclick = () => { mood = x.dataset.m; h.querySelectorAll('[data-m]').forEach((y) => y.classList.toggle('pri', y === x)); }; });
      h.querySelector('[data-save]').onclick = () => { r.diary.push({ date: today, mood, note: h.querySelector('[data-note]').value.trim().slice(0, 60), temp: f0(st.current.temp) }); r.diary = r.diary.slice(-30); save(); blip(784); boek(h); };
    }
  }

  function gok(h) {
    const r = R(), today = dayKey(), tomorrow = st.days[1] ? st.days[1].date : null;
    // oplossen: gokken voor vandaag of eerder, vergeleken met de dagwaarden die de weerdienst nu geeft voor vandaag
    const todayDay = st.days.find((d) => d.date === today);
    r.guesses.forEach((g) => { if (!g.done && g.date === today && todayDay) { const s = gokScore(g, todayDay); g.done = true; g.res = s; r.pts += s.punten; save(); } });
    const mine = r.guesses.find((g) => g.date === tomorrow), open = r.guesses.filter((g) => g.done).slice(-5).reverse();
    h.innerHTML = `<div class="r4-card"><b>Gok het weer van morgen</b> <span class="r4-chip">${r.pts} punten</span>
      ${mine ? `<p>Jouw gok voor morgen: <b>${mine.temp}°</b> en ${mine.rain ? 'regen' : 'droog'}. Kom morgen terug voor je punten!</p>` : `<p><small>Hoe warm wordt het morgen, en regent het? Tot 100 punten.</small></p>
      <label>Hoogste temperatuur: <b data-tv>12°</b> <input type="range" data-t min="-10" max="38" value="12" style="width:100%"></label>
      <div class="r4-row" style="margin:.4rem 0"><button class="r4-btn" data-r="1">Regen</button><button class="r4-btn pri" data-r="0">Droog</button></div><button class="r4-btn pri" data-ok>Mijn gok vastleggen</button>`}</div>
      <div class="r4-card"><b>Uitslagen</b>${open.length ? open.map((g) => `<div class="r4-row" style="border-top:1px solid var(--line);padding:.3rem 0"><b>${esc(g.date.slice(5))}</b><span style="flex:1">gok ${g.temp}°, ${g.rain ? 'regen' : 'droog'}</span><b>${g.res.punten} pt</b></div>`).join('') : '<small>Nog geen uitslagen.</small>'}</div>`;
    if (!mine && tomorrow) {
      let rain = false; const t = h.querySelector('[data-t]');
      t.oninput = () => { h.querySelector('[data-tv]').textContent = t.value + '°'; };
      h.querySelectorAll('[data-r]').forEach((x) => { x.onclick = () => { rain = x.dataset.r === '1'; h.querySelectorAll('[data-r]').forEach((y) => y.classList.toggle('pri', y === x)); }; });
      h.querySelector('[data-ok]').onclick = () => { r.guesses.push({ date: tomorrow, temp: clamp(parseInt(t.value, 10) || 0, -30, 50), rain }); r.guesses = r.guesses.slice(-20); save(); blip(660); gok(h); };
    }
  }

  function kal(h) {
    const days = st.days, S = kalenderStats(days), maxRain = Math.max(1, ...days.map((d) => d.rain)), nm = (i) => (i === 0 ? 'vandaag' : W.DAGEN_LANG[days[i].wd]);
    h.innerHTML = `<div class="r4-card"><b>De komende ${days.length} dagen</b>
      <div class="r4-row" style="margin:.4rem 0"><span class="r4-chip">${S.droog} droge dagen</span><span class="r4-chip">${S.nat} natte dagen</span>${S.zomers ? `<span class="r4-chip">${S.zomers} zomerse dagen</span>` : ''}${S.vorst ? `<span class="r4-chip">${S.vorst} vorstdagen</span>` : ''}</div>
      <div style="display:flex;align-items:flex-end;gap:3px;height:90px">${days.map((d) => `<div title="${esc(d.date)}" style="flex:1;background:#38bdf8;border-radius:4px 4px 0 0;height:${Math.max(3, Math.round(86 * d.rain / maxRain))}px"></div>`).join('')}</div><small>Regen per dag (in mm) · samen ${S.totRegen.toFixed(1).replace('.', ',')} mm</small></div>
      <div class="r4-card"><div class="r4-row">${icon('sun', { size: 30 })} Warmste dag: <b>${nm(S.warm)} (${f0(days[S.warm].max)}°)</b></div>
        <div class="r4-row">${icon('snowflake', { size: 30 })} Koudste nacht: <b>${nm(S.koud)} (${f0(days[S.koud].min)}°)</b></div>
        <div class="r4-row">${icon('rain', { size: 30 })} Natste dag: <b>${S.totRegen > 0.5 ? nm(S.nat1) : 'geen'}</b></div>
        <div class="r4-row">${icon('windmill', { size: 30 })} Winderigste dag: <b>${nm(S.wind)} (${f0(days[S.wind].wind)} km/u)</b></div></div>`;
  }
  draw();
}
