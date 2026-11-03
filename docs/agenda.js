// Agenda: gedeelde afspraken (collection 'events') met maand/week/dag/lijst, categorieën (kleur), herhalingen, herinneringen,
// verjaardagen, feestdagen en een schoolrooster. Extra's (herinneringen, rooster) staan lokaal + in gamesaves.
import { doc, updateDoc, deleteDoc, addDoc, collection, getDocs }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { injectKit, head, wireHead, tabsHtml, ic, playScene, appStore, showToast } from './appkit.js?v=1';
import * as C from './agenda-core.js?v=1';
import { overzichtHtml, toIcs } from './tools-r4-agenda.js?v=1';

export { occursOn, monthGrid } from './agenda-core.js?v=1';
const { ymd, parseKey, addDays, MONTHS, DAYS_SHORT, PALETTE, REPEAT, CATS, colorOf, catOf, occursOn, monthGrid, byTime, longDate, shortDate, countdownText, diffDays } = C;

const fetchEvents = async (db) => (await getDocs(collection(db, 'events'))).docs.map((d) => ({ id: d.id, ...d.data() }));

// Aantal afspraken vandaag (voor de badge op het homescherm).
export async function agendaToday(db) {
  try { const k = ymd(new Date()); return (await fetchEvents(db)).filter((e) => occursOn(e, k)).length; }
  catch (e) { console.error(e); return 0; }
}

const TABS = [['nu', 'Nu', 'bell'], ['maand', 'Maand', 'ticket'], ['week', 'Week', 'compass'], ['dag', 'Dag', 'sun'], ['lijst', 'Lijst', 'scroll'], ['bday', 'Verjaardagen', 'cake'], ['rooster', 'Rooster', 'school'], ['overzicht', 'Overzicht', 'chest']];

export async function agendaView(ctx) {
  const { db, me, esc, nice, view, addCleanup } = ctx;
  injectKit();
  const todayKey = () => ymd(new Date());
  const now = new Date();
  let events = [], year = now.getFullYear(), month = now.getMonth(), selected = todayKey(), tab = 'nu';
  let form = null, confirmId = null, formErr = '', busy = false, who = 'all', search = '', alive = true;
  const store = appStore(ctx, 'agenda-extra', { rem: {}, rooster: null, fired: {}, bday: '' });
  addCleanup(() => { alive = false; store.flush(); clearInterval(tick); });

  const canEdit = (e) => me.admin || e.by === me.uid;
  const people = () => [...new Map(events.filter((e) => e.by).map((e) => [e.by, e.byName || '?'])).entries()];
  const visible = () => events.filter((e) => who === 'all' || (who === 'mine' ? e.by === me.uid : e.by === who));
  const on = (k) => visible().filter((e) => occursOn(e, k)).sort(byTime);
  const hol = (k) => C.holidayOn(k);
  const load = async () => { events = await fetchEvents(db); };
  const reload = async () => { await load(); draw(); };

  const evChip = (e, k, compact) => {
    const cat = catOf(e.color), rem = store.get().rem[e.id];
    return `<div class="ak-card" style="margin:.35rem 0;padding:.6rem .8rem;border-left:6px solid ${colorOf(e.color)}">
      <div class="row" style="margin:0;align-items:flex-start">${ic(cat.ic, { size: 34 })}<div style="flex:1;min-width:0"><b>${e.time ? `${esc(e.time)} · ` : ''}${esc(e.title)}</b>${e.repeat && e.repeat !== 'none' ? ` <small>🔁 ${REPEAT[e.repeat]}</small>` : ''}${rem != null ? ' <small>🔔</small>' : ''}
        ${e.note ? `<div><small>${esc(e.note)}</small></div>` : ''}<div><small class="mute">${cat.n} · ${esc(e.byName || '?')}</small></div></div></div>
      ${!compact && canEdit(e) ? (confirmId === e.id
        ? `<div class="row wrap"><small>Deze afspraak verwijderen?</small><button class="pri ak-big" data-delyes="${e.id}">Ja, verwijder</button><button class="ak-big" data-delno>Nee</button></div>`
        : `<div class="row wrap"><button class="ak-big" data-edit="${e.id}">✏️ Bewerk</button><button class="ak-big" data-del="${e.id}">🗑 Verwijder</button></div>`) : ''}</div>`;
  };
  const dayHeader = (k) => { const h = hol(k); return `<b>${longDate(k)}</b>${h.map((x) => ` <span class="ak-chip">${ic(x.ic, { size: 18 })}${x.title}</span>`).join('')}`; };

  function whoBar() {
    const ps = people(); if (ps.length < 2 && who === 'all') return '';
    const b = (k, l) => `<button class="ak-chip ${who === k ? 'on' : ''}" data-who="${k}" style="border:0;min-height:38px">${l}</button>`;
    return `<div class="ak-chips" style="margin:.2rem 0 .5rem">${b('all', 'Iedereen')}${b('mine', 'Alleen ik')}${ps.filter(([u]) => u !== me.uid).map(([u, n]) => b(u, esc(n))).join('')}</div>`;
  }

  /* ---------- weergaven ---------- */
  function vNu() {
    const t = todayKey(), tom = addDays(t, 1);
    const todayList = on(t), next = C.upcomingList(visible(), tom, 60, 6);
    const bd = C.upcomingBirthdays(events, t, 3);
    const l = C.lessonNow(C.cleanRooster(store.get().rooster), new Date());
    const nxtEv = todayList.find((e) => C.toMin(e.time) != null && C.toMin(e.time) >= new Date().getHours() * 60 + new Date().getMinutes()) || null;
    let h = `<div class="ak-card" style="text-align:center">${ic('hourglass', { size: 64 })}<div style="font-size:1.3em"><b>${longDate(t)}</b></div><small class="mute">Week ${C.weekNr(t)}${hol(t).length ? ' · ' + hol(t).map((x) => x.title).join(', ') : ''}</small>
      <div style="margin-top:.5rem">${todayList.length ? `<span class="ak-chip on">${todayList.length} ${todayList.length === 1 ? 'afspraak' : 'afspraken'} vandaag</span>` : '<span class="ak-chip">Vandaag niets gepland 🌿</span>'}</div>
      ${nxtEv ? `<div style="margin-top:.4rem"><small>Straks: <b>${esc(nxtEv.time)} ${esc(nxtEv.title)}</b></small></div>` : ''}</div>`;
    if (l.cur || l.next) h += `<div class="ak-card"><div class="row" style="margin:0">${ic('school', { size: 40 })}<div>${l.cur ? `<b>Nu: ${C.subjectOf(l.cur.id).n}</b><br><small>tot ${l.cur.to}</small>` : ''}${l.next ? `<div><small>Straks: ${C.subjectOf(l.next.id).n} om ${l.next.from}</small></div>` : ''}</div></div></div>`;
    if (bd.length) h += `<div class="ak-card"><h3>Verjaardagen</h3>${bd.map((b) => `<div class="row" style="margin:.3rem 0">${ic(b.days === 0 ? 'balloon' : 'cake', { size: 32 })}<span style="flex:1"><b>${esc(b.name)}</b>${b.turns ? ` <small>wordt ${b.turns}</small>` : ''}</span><span class="ak-chip ${b.days === 0 ? 'on' : ''}">${countdownText(b.days)}</span></div>`).join('')}</div>`;
    h += `<div class="ak-card"><h3>Vandaag</h3>${todayList.length ? todayList.map((e) => evChip(e, t, true)).join('') : '<small class="mute">Geen afspraken. Tijd voor iets leuks! 🎈</small>'}</div>`;
    h += `<div class="ak-card"><h3>Hierna</h3>${next.length ? next.map(({ key, ev }) => `<div class="row" style="margin:.2rem 0"><span class="ak-chip" style="min-width:5.5rem;justify-content:center">${key === tom ? 'morgen' : shortDate(key)}</span>${ic(catOf(ev.color).ic, { size: 26 })}<span style="flex:1">${ev.time ? `<small>${esc(ev.time)}</small> ` : ''}${esc(ev.title)}</span></div>`).join('') : '<small class="mute">Niets gepland. 🌿</small>'}</div>`;
    const nh = C.holidays(parseKey(t).y).concat(C.holidays(parseKey(t).y + 1)).find((x) => x.date >= t);
    if (nh) h += `<div class="ak-card"><div class="row" style="margin:0">${ic(nh.ic, { size: 40 })}<span style="flex:1"><b>${nh.title}</b><br><small class="mute">${longDate(nh.date)}</small></span><span class="ak-chip">${countdownText(diffDays(t, nh.date))}</span></div></div>`;
    return h;
  }

  function vMaand() {
    const t = todayKey();
    const head7 = DAYS_SHORT.map((d) => `<div style="text-align:center"><small>${d}</small></div>`).join('');
    const cells = monthGrid(year, month).flat().map((c) => {
      const list = on(c.key), hl = hol(c.key).length;
      const dots = list.slice(0, 4).map((e) => `<span style="width:7px;height:7px;border-radius:50%;background:${colorOf(e.color)};display:inline-block"></span>`).join('');
      const sel = c.key === selected, isToday = c.key === t;
      return `<button data-day="${c.key}" style="padding:.3rem 0;min-height:calc(3.4rem*var(--gfx-scale,1));display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:3px;border-radius:12px;${c.inMonth ? '' : 'opacity:.4;'}${sel ? 'background:var(--accent);color:#fff;' : ''}${isToday && !sel ? 'outline:2px solid var(--accent);' : ''}"><span>${c.day}${hl ? '<sup style="color:#e11d48">•</sup>' : ''}</span><span style="display:flex;gap:2px;height:7px;flex-wrap:wrap;justify-content:center">${dots}</span></button>`;
    }).join('');
    return `<div class="ak-card"><div class="row"><button class="ak-big" data-nav="-1" aria-label="Vorige maand">‹</button><b style="flex:1;text-align:center;font-size:1.15em">${MONTHS[month]} ${year}</b><button class="ak-big" data-nav="1" aria-label="Volgende maand">›</button></div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px">${head7}${cells}</div>
      <div class="ak-chips" style="margin-top:.6rem">${CATS.map((c) => `<span class="ak-chip">${ic(c.ic, { size: 16 })}${c.n}</span>`).join('')}</div></div>${selBox()}`;
  }
  function selBox() {
    const list = on(selected);
    return `<div class="ak-card"><div class="row wrap" style="margin-top:0"><span style="flex:1">${dayHeader(selected)}</span><button class="pri ak-big" data-new>＋ Afspraak</button></div>${list.length ? list.map((e) => evChip(e, selected)).join('') : '<small class="mute">Geen afspraken op deze dag.</small>'}</div>`;
  }
  function vWeek() {
    const days = C.weekDays(selected), t = todayKey();
    return `<div class="ak-card"><div class="row"><button class="ak-big" data-step="-7">‹</button><b style="flex:1;text-align:center">Week ${C.weekNr(selected)} · ${shortDate(days[0])} – ${shortDate(days[6])}</b><button class="ak-big" data-step="7">›</button></div></div>`
      + days.map((k, i) => { const list = on(k); return `<div class="ak-card" style="${k === t ? 'border:2px solid var(--accent);' : ''}"><div class="row wrap" style="margin-top:0"><span style="flex:1">${dayHeader(k)}</span><button class="ak-big" data-addon="${k}">＋</button></div>${list.length ? list.map((e) => evChip(e, k, true)).join('') : '<small class="mute">Vrij 🌿</small>'}</div>`; }).join('');
  }
  function vDag() {
    const list = on(selected), L = C.dayLayout(list), H0 = 7, H1 = 22, px = 56;
    const hours = Array.from({ length: H1 - H0 + 1 }, (_, i) => H0 + i);
    const blocks = L.timed.map((b) => { const top = Math.max(0, (b.s - H0 * 60) / 60 * px), hgt = Math.max(30, (b.t - b.s) / 60 * px - 2), w = 100 / b.n;
      return `<div data-edit="${b.e.id}" style="position:absolute;top:${top}px;height:${hgt}px;left:calc(3.2rem + (100% - 3.4rem)*${b.col / b.n});width:calc((100% - 3.4rem)*${1 / b.n} - 3px);background:${colorOf(b.e.color)};color:#1f2330;border-radius:10px;padding:.2rem .4rem;overflow:hidden;font-size:.85em;cursor:pointer;display:flex;gap:.3rem;align-items:flex-start">${ic(catOf(b.e.color).ic, { size: 22 })}<span><b>${esc(b.e.time)}</b> ${esc(b.e.title)}</span></div>`; }).join('');
    return `<div class="ak-card"><div class="row"><button class="ak-big" data-step="-1">‹</button><span style="flex:1;text-align:center">${dayHeader(selected)}</span><button class="ak-big" data-step="1">›</button></div>
      <div class="row"><button class="ak-big" data-today style="flex:1">Vandaag</button><button class="pri ak-big" data-new style="flex:1">＋ Afspraak</button></div>
      ${L.untimed.length ? `<div><small class="mute">Hele dag</small>${L.untimed.map((e) => evChip(e, selected, true)).join('')}</div>` : ''}
      <div style="position:relative;height:${hours.length * px}px;margin-top:.4rem">${hours.map((h, i) => `<div style="position:absolute;top:${i * px}px;left:0;right:0;border-top:1px solid var(--line);font-size:.75em;color:var(--mute)">${C.pad(h)}:00</div>`).join('')}${blocks}</div></div>
      ${list.length ? `<div class="ak-card"><h3>Details</h3>${list.map((e) => evChip(e, selected)).join('')}</div>` : ''}`;
  }
  function vLijst() {
    const t = todayKey(), found = search.trim() ? C.searchEvents(visible(), search) : null;
    let h = `<div class="ak-card"><div class="row" style="margin:0"><input id="srch" placeholder="🔍 Zoek in alle afspraken" value="${esc(search)}" style="min-height:48px"></div></div>`;
    if (found) h += `<div class="ak-card"><h3>${found.length} gevonden</h3>${found.map((e) => `<div class="row" style="margin:.2rem 0"><span class="ak-chip">${shortDate(e.date)}</span><span style="flex:1">${esc(e.title)}</span><button data-edit="${e.id}">Open</button></div>`).join('') || '<small class="mute">Niets gevonden.</small>'}</div>`;
    else { const l = C.upcomingList(visible(), t, 60, 40); let last = ''; h += `<div class="ak-card"><h3>Komende 60 dagen</h3>${l.map(({ key, ev }) => { const head2 = key !== last ? `<div style="margin-top:.5rem"><b>${key === t ? 'vandaag' : longDate(key)}</b></div>` : ''; last = key; return head2 + evChip(ev, key, true); }).join('') || '<small class="mute">Niets gepland.</small>'}</div>`; }
    return h;
  }
  function vBday() {
    const t = todayKey(), l = C.upcomingBirthdays(events, t, 30);
    return `<div class="ak-card"><div class="row wrap" style="margin:0"><h3 style="flex:1;margin:0">Verjaardagen</h3><button class="pri ak-big" data-newbday>＋ Verjaardag</button></div>
      ${l.map((b) => `<div class="row" style="margin:.5rem 0">${ic(b.days === 0 ? 'balloon' : 'cake', { size: 44 })}<span style="flex:1"><b>${esc(b.name)}</b>${b.turns ? ` <small>wordt ${b.turns}</small>` : ''}<br><small class="mute">${longDate(b.key)}</small></span><span class="ak-chip ${b.days <= 7 ? 'on' : ''}">${countdownText(b.days)}</span></div>`).join('') || '<br><small class="mute">Nog geen verjaardagen. Tik op ＋ Verjaardag en kies bij het jaar een datum (de geboortedatum geeft ook de leeftijd).</small>'}</div>`;
  }
  function vRooster() {
    const r = C.cleanRooster(store.get().rooster), d = (new Date().getDay() + 6) % 7;
    const sel = (di, p) => `<select data-rs="${di}-${p}" style="width:100%;min-height:42px;padding:.2rem"><option value=""></option>${C.SUBJECTS.map((s) => `<option value="${s.id}"${r.days[di][p] === s.id ? ' selected' : ''}>${s.n}</option>`).join('')}</select>`;
    const rows = r.days[0].map((_, p) => `<tr><td style="padding:.2rem;font-size:.75em;white-space:nowrap"><b>${p + 1}</b><br>${C.PERIOD_START[p]}</td>${r.days.map((day, di) => { const s = C.subjectOf(day[p]); return `<td style="padding:2px">${rsEdit ? sel(di, p) : `<div style="background:${s ? s.c : 'var(--line)'};color:#1f2330;border-radius:10px;min-height:40px;padding:.2rem;font-size:.72em;text-align:center;display:flex;align-items:center;justify-content:center;${di === d ? 'outline:2px solid var(--accent)' : ''}">${s ? s.n : ''}</div>`}</td>`; }).join('')}</tr>`).join('');
    return `<div class="ak-card"><div class="row wrap" style="margin:0"><h3 style="flex:1;margin:0">Mijn rooster</h3><button class="ak-big ${rsEdit ? 'pri' : ''}" data-rsedit>${rsEdit ? '✓ Klaar' : '✏️ Aanpassen'}</button></div>
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;table-layout:fixed;min-width:${rsEdit ? 520 : 320}px"><thead><tr><th></th>${['Ma', 'Di', 'Wo', 'Do', 'Vr'].map((x) => `<th><small>${x}</small></th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
      <small class="mute">Het rooster staat op jouw apparaat (en in je eigen opslag), de anderen zien het niet.</small></div>`;
  }
  let rsEdit = false;

  function formHtml() {
    const f = form;
    return `<div class="ak-card" id="aform"><h3>${f.id ? 'Afspraak bewerken' : 'Nieuwe afspraak'}</h3>
      ${f.id ? '' : `<div class="ak-chips" style="margin-bottom:.5rem">${C.TEMPLATES.map((t, i) => `<button class="ak-chip" data-tpl="${i}" style="border:0;min-height:38px">${ic(C.catById(t.cat).ic, { size: 18 })}${t.n}</button>`).join('')}</div>`}
      <div class="row"><input id="f-title" maxlength="80" placeholder="Titel" value="${esc(f.title)}" style="min-height:48px"></div>
      <div class="row wrap"><input id="f-date" type="date" value="${esc(f.date)}" style="flex:1;min-height:48px"><input id="f-time" type="time" value="${esc(f.time)}" style="flex:1;min-height:48px"></div>
      <small class="mute">Tijd is optioneel.</small>
      <div class="row"><input id="f-note" maxlength="200" placeholder="Notitie (optioneel)" value="${esc(f.note)}" style="min-height:48px"></div>
      <div class="row wrap"><select id="f-repeat" style="flex:1;min-height:48px">${Object.entries(REPEAT).map(([k, v]) => `<option value="${k}"${f.repeat === k ? ' selected' : ''}>${v}</option>`).join('')}</select>
        <select id="f-rem" style="flex:1;min-height:48px"><option value="">Geen herinnering</option>${C.REM_OPTIONS.map(([m, l]) => `<option value="${m}"${String(f.rem) === String(m) ? ' selected' : ''}>🔔 ${l}</option>`).join('')}</select></div>
      <div class="ak-pick">${CATS.map((c) => `<button data-color="${c.c}" aria-label="${c.n}" title="${c.n}" class="${f.color.toLowerCase() === c.c ? 'sel' : ''}" style="background:${c.c}">${ic(c.ic, { size: 30 })}</button>`).join('')}</div><small class="mute">${catOf(f.color).n}</small>
      <div class="row"><button class="pri ak-big" data-save style="flex:1"${busy ? ' disabled' : ''}>Opslaan</button><button class="ak-big" data-cancel style="flex:1">Annuleer</button></div>
      <div class="err">${esc(formErr)}</div></div>`;
  }
  function syncForm() {
    if (!form) return; const q = (s) => view.querySelector(s); if (!q('#f-title')) return;
    form.title = q('#f-title').value; form.date = q('#f-date').value; form.time = q('#f-time').value; form.note = q('#f-note').value; form.repeat = q('#f-repeat').value; form.rem = q('#f-rem').value;
  }

  const vOverzicht = () => overzichtHtml({ events: visible(), year: parseKey(selected).y, today: todayKey(), ic });
  const VIEWS = { nu: vNu, maand: vMaand, week: vWeek, dag: vDag, lijst: vLijst, bday: vBday, rooster: vRooster, overzicht: vOverzicht };
  function draw() {
    if (!alive) return;
    view.innerHTML = `<div class="ak">${head({ icon: 'hourglass', title: 'Agenda', sub: `${events.length} afspraken · samen met de anderen`, c1: '#f472b6', c2: '#e11d48' })}${tabsHtml(tab, TABS)}${['maand', 'week', 'dag', 'lijst', 'overzicht'].includes(tab) ? whoBar() : ''}${form ? formHtml() : ''}${VIEWS[tab]()}</div>`;
    bind();
  }
  const openForm = (f) => { form = f; formErr = ''; confirmId = null; draw(); const t = view.querySelector('#f-title'); if (t) t.scrollIntoView({ block: 'center' }); };
  const newForm = (date, extra = {}) => ({ title: '', date, time: '', note: '', repeat: 'none', color: PALETTE[0], rem: '', ...extra });

  function bind() {
    wireHead(view);
    const all = (s) => view.querySelectorAll(s);
    all('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; form = null; draw(); });
    all('[data-goday]').forEach((b) => b.onclick = () => { selected = b.dataset.goday; const p = parseKey(selected); year = p.y; month = p.m - 1; tab = 'dag'; draw(); });
    all('[data-ics]').forEach((b) => b.onclick = () => { try { const blob = new Blob([toIcs(visible())], { type: 'text/calendar' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'agenda.ics'; document.body.appendChild(a); a.click(); a.remove(); showToast && showToast('Bestand gemaakt'); } catch { showToast && showToast('Downloaden lukt niet op dit toestel'); } });
    all('[data-who]').forEach((b) => b.onclick = () => { who = b.dataset.who; draw(); });
    all('[data-nav]').forEach((b) => b.onclick = () => { const d = new Date(year, month + Number(b.dataset.nav), 1); year = d.getFullYear(); month = d.getMonth(); draw(); });
    all('[data-step]').forEach((b) => b.onclick = () => { selected = addDays(selected, Number(b.dataset.step)); const p = parseKey(selected); year = p.y; month = p.m - 1; draw(); });
    all('[data-today]').forEach((b) => b.onclick = () => { const d = new Date(); year = d.getFullYear(); month = d.getMonth(); selected = todayKey(); draw(); });
    all('[data-day]').forEach((b) => b.onclick = () => { selected = b.dataset.day; confirmId = null; const p = parseKey(selected); year = p.y; month = p.m - 1; draw(); });
    all('[data-new]').forEach((b) => b.onclick = () => openForm(newForm(selected)));
    all('[data-addon]').forEach((b) => b.onclick = () => { selected = b.dataset.addon; openForm(newForm(selected)); });
    all('[data-newbday]').forEach((b) => b.onclick = () => openForm(newForm(todayKey(), { title: '🎂 ', repeat: 'yearly', color: C.catById('verjaardag').c })));
    all('[data-edit]').forEach((b) => b.onclick = () => {
      const e = events.find((x) => x.id === b.dataset.edit); if (!e) return;
      if (!canEdit(e)) { showToast(`Gemaakt door ${e.byName || '?'}`); return; }
      const rem = store.get().rem[e.id];
      openForm({ id: e.id, title: e.title || '', date: e.date || selected, time: e.time || '', note: e.note || '', repeat: e.repeat || 'none', color: colorOf(e.color), rem: rem == null ? '' : rem });
    });
    all('[data-del]').forEach((b) => b.onclick = () => { confirmId = b.dataset.del; draw(); });
    all('[data-delno]').forEach((b) => b.onclick = () => { confirmId = null; draw(); });
    all('[data-delyes]').forEach((b) => b.onclick = async () => {
      b.disabled = true;
      try { await deleteDoc(doc(db, 'events', b.dataset.delyes)); confirmId = null; await reload(); }
      catch (e) { alert(nice(e)); b.disabled = false; }
    });
    const sr = view.querySelector('#srch'); if (sr) sr.oninput = () => { search = sr.value; const pos = sr.selectionStart; draw(); const n = view.querySelector('#srch'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* */ } };
    all('[data-rsedit]').forEach((b) => b.onclick = () => { rsEdit = !rsEdit; draw(); });
    all('[data-rs]').forEach((s) => s.onchange = () => { const [di, p] = s.dataset.rs.split('-').map(Number); const r = C.cleanRooster(store.get().rooster); r.days[di][p] = s.value; store.set({ rooster: r }); });
    if (!form) return;
    all('[data-tpl]').forEach((b) => b.onclick = () => { syncForm(); const t = C.TEMPLATES[+b.dataset.tpl]; Object.assign(form, { title: t.title, repeat: t.repeat, color: C.catById(t.cat).c, time: t.time || form.time }); draw(); const i = view.querySelector('#f-title'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); });
    all('[data-color]').forEach((b) => b.onclick = () => { syncForm(); form.color = b.dataset.color; draw(); });
    all('[data-cancel]').forEach((b) => b.onclick = () => { form = null; draw(); });
    all('[data-save]').forEach((b) => b.onclick = async () => {
      syncForm();
      const title = form.title.trim().slice(0, 80);
      if (!title) { formErr = 'Geef de afspraak een titel.'; draw(); return; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) { formErr = 'Kies een datum.'; draw(); return; }
      const data = { title, date: form.date, time: /^\d{2}:\d{2}$/.test(form.time) ? form.time : '', note: form.note.trim().slice(0, 200), repeat: form.repeat, color: form.color };
      busy = true; b.disabled = true;
      try {
        let id = form.id;
        if (id) await updateDoc(doc(db, 'events', id), data);
        else id = (await addDoc(collection(db, 'events'), { ...data, by: me.uid, byName: me.name, created: Date.now() })).id;
        const rem = { ...store.get().rem }; if (form.rem === '' || form.rem == null) delete rem[id]; else { rem[id] = Number(form.rem); askNotify(); } store.set({ rem });
        selected = data.date; const p = parseKey(selected); year = p.y; month = p.m - 1;
        form = null; busy = false; showToast('Opgeslagen ✓'); await reload();
      } catch (e) { busy = false; formErr = nice(e); draw(); }
    });
  }

  /* ---------- herinneringen (zolang de app open is) ---------- */
  const askNotify = () => { try { if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission(); } catch (e) { /* */ } };
  const check = () => {
    try {
      const st = store.get(), due = C.dueReminders(events, new Date(), st.rem || {}, st.fired || {});
      if (!due.length) return; const fired = { ...(st.fired || {}) };
      for (const d of due) {
        fired[d.id] = 1; const txt = `${d.ev.title}${d.minutes > 0 ? ` over ${d.minutes >= 60 ? Math.round(d.minutes / 60) + ' uur' : d.minutes + ' min'}` : ' begint nu'}`;
        showToast(`🔔 ${txt}`);
        try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification('Agenda', { body: txt }); } catch (e) { /* */ }
      }
      const today = todayKey(); for (const k of Object.keys(fired)) if (k.split('|')[1] < today) delete fired[k];
      store.set({ fired });
    } catch (e) { /* stil */ }
  };
  const tick = setInterval(check, 30000);

  view.innerHTML = '<div class="box center"><small>Laden…</small></div>';
  try {
    await Promise.all([load(), store.load()]);
    if (!alive) return;
    draw(); check();
    // Verjaardag vandaag: eenmalig een feestje
    const bd = C.upcomingBirthdays(events, todayKey(), 1).filter((b) => b.days === 0);
    if (bd.length && store.get().bday !== todayKey()) { store.set({ bday: todayKey() }); playScene('victory', { title: 'Hoera!', sub: `${bd[0].name} is jarig vandaag` }); }
  } catch (e) { view.innerHTML = `<div class="box err">${esc(nice(e))}</div>`; }
}
