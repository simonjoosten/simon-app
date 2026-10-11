// Agenda: gedeelde afspraken en verjaardagen (collection 'events').
import { doc, updateDoc, deleteDoc, addDoc, collection, getDocs }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = (k) => { const [y, m, d] = String(k).split('-').map(Number); return { y, m, d }; };
const utcDays = (k) => { const { y, m, d } = parseKey(k); return Math.round(Date.UTC(y, m - 1, d) / 86400000); };
const addDays = (k, n) => { const { y, m, d } = parseKey(k); return ymd(new Date(y, m - 1, d + n)); };
const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

const MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
const DAYS_SHORT = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const DAYS_LONG = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const PALETTE = ['#9fb8d6', '#a8cdb5', '#e8c79a', '#e5a9a9', '#c3b1d9', '#e6d98f'];
const REPEAT = { none: 'Eenmalig', weekly: 'Elke week', yearly: 'Elk jaar' };
const colorOf = (c) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : PALETTE[0]);

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

const fetchEvents = async (db) => (await getDocs(collection(db, 'events'))).docs.map((d) => ({ id: d.id, ...d.data() }));
const byTime = (a, b) => (a.time || '').localeCompare(b.time || '') || (a.title || '').localeCompare(b.title || '');

// Aantal afspraken vandaag (voor de badge op het homescherm).
export async function agendaToday(db) {
  try { const k = ymd(new Date()); return (await fetchEvents(db)).filter((e) => occursOn(e, k)).length; }
  catch (e) { console.error(e); return 0; }
}

export async function agendaView(ctx) {
  const { db, me, esc, nice, view } = ctx;
  const todayKey = () => ymd(new Date());
  const now = new Date();
  let events = [], year = now.getFullYear(), month = now.getMonth(), selected = todayKey();
  let form = null;        // null | { id?, title, date, time, note, repeat, color }
  let confirmId = null;   // afspraak waarvan het verwijderen bevestigd wordt
  let formErr = '', busy = false;

  const canEdit = (e) => me.admin || e.by === me.uid;
  const on = (k) => events.filter((e) => occursOn(e, k)).sort(byTime);
  const longDate = (k) => { const { y, m, d } = parseKey(k); return `${DAYS_LONG[new Date(y, m - 1, d).getDay()]} ${d} ${MONTHS[m - 1]}`; };

  async function load() { events = await fetchEvents(db); }
  async function reload() { await load(); draw(); }

  function eventRow(e, k, full) {
    const own = canEdit(e);
    return `<div class="box" style="border-left:5px solid ${colorOf(e.color)}">
      <div><b>${e.time ? `${esc(e.time)} · ` : ''}${esc(e.title)}</b>${e.repeat && e.repeat !== 'none' ? ` <small>🔁 ${REPEAT[e.repeat]}</small>` : ''}</div>
      ${e.note ? `<div><small>${esc(e.note)}</small></div>` : ''}
      ${full ? `<div><small>Gemaakt door ${esc(e.byName || '?')}</small></div>` : ''}
      ${full && own ? (confirmId === e.id
        ? `<div class="row wrap"><small>Deze afspraak verwijderen?</small><button class="pri" data-delyes="${e.id}">Ja, verwijder</button><button data-delno>Nee</button></div>`
        : `<div class="row wrap"><button data-edit="${e.id}">✏️ Bewerk</button><button data-del="${e.id}">🗑 Verwijder</button></div>`) : ''}
    </div>`;
  }

  function upcoming() {
    const t = todayKey(); let out = '';
    for (let i = 0; i < 7; i++) {
      const k = addDays(t, i), list = on(k); if (!list.length) continue;
      const label = i === 0 ? 'vandaag' : i === 1 ? 'morgen' : longDate(k);
      out += `<div class="row" style="align-items:flex-start"><span class="chip" style="min-width:4.5rem;text-align:center">${esc(label)}</span><span style="flex:1">${list.map((e) =>
        `<div><span style="display:inline-block;width:.6rem;height:.6rem;border-radius:50%;background:${colorOf(e.color)};margin-right:.3rem"></span>${e.time ? `<small>${esc(e.time)}</small> ` : ''}${esc(e.title)}</div>`).join('')}</span></div>`;
    }
    return `<div class="box"><b>Komende 7 dagen</b>${out || '<br><small>Niets gepland. 🌿</small>'}</div>`;
  }

  function grid() {
    const t = todayKey();
    const head = DAYS_SHORT.map((d) => `<div style="text-align:center"><small>${d}</small></div>`).join('');
    const cells = monthGrid(year, month).flat().map((c) => {
      const dots = on(c.key).slice(0, 3).map((e) => `<span style="width:6px;height:6px;border-radius:50%;background:${colorOf(e.color)};display:inline-block"></span>`).join('');
      const sel = c.key === selected, isToday = c.key === t;
      return `<button data-day="${c.key}" style="padding:.35rem 0;min-height:2.9rem;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:3px;${c.inMonth ? '' : 'opacity:.4;'}${sel ? 'background:var(--accent);color:#fff;' : ''}${isToday && !sel ? 'outline:2px solid var(--accent);' : ''}"><span>${c.day}</span><span style="display:flex;gap:2px;height:6px">${dots}</span></button>`;
    }).join('');
    return `<div class="box">
      <div class="row"><button data-nav="-1" aria-label="Vorige maand">‹</button><b style="flex:1;text-align:center">${MONTHS[month]} ${year}</b><button data-nav="1" aria-label="Volgende maand">›</button></div>
      <div class="row"><button data-today style="flex:1">Vandaag</button><button class="pri" data-new style="flex:1">＋ Afspraak</button></div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px">${head}${cells}</div></div>`;
  }

  function formHtml() {
    const f = form;
    return `<div class="box"><b>${f.id ? 'Afspraak bewerken' : 'Nieuwe afspraak'}</b>
      <div class="row wrap"><button data-bday>🎂 Verjaardag</button><small>vult titel en jaarlijkse herhaling in</small></div>
      <div class="row"><input id="f-title" maxlength="80" placeholder="Titel" value="${esc(f.title)}"></div>
      <div class="row wrap"><input id="f-date" type="date" value="${esc(f.date)}" style="flex:1"><input id="f-time" type="time" value="${esc(f.time)}" style="flex:1"></div>
      <small>Tijd is optioneel.</small>
      <div class="row"><input id="f-note" maxlength="200" placeholder="Notitie (optioneel)" value="${esc(f.note)}"></div>
      <div class="row"><select id="f-repeat" style="flex:1">${Object.entries(REPEAT).map(([k, v]) => `<option value="${k}"${f.repeat === k ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="row wrap">${PALETTE.map((c) => `<button data-color="${c}" aria-label="Kleur" style="width:2.2rem;height:2.2rem;border-radius:50%;background:${c};border:3px solid ${f.color === c ? 'var(--ink)' : 'transparent'}"></button>`).join('')}</div>
      <div class="row"><button class="pri" data-save style="flex:1"${busy ? ' disabled' : ''}>Opslaan</button><button data-cancel style="flex:1">Annuleer</button></div>
      <div class="err">${esc(formErr)}</div></div>`;
  }

  function syncForm() { // lees invoervelden terug in de formulierstatus
    if (!form) return;
    const q = (s) => view.querySelector(s); if (!q('#f-title')) return;
    form.title = q('#f-title').value; form.date = q('#f-date').value; form.time = q('#f-time').value;
    form.note = q('#f-note').value; form.repeat = q('#f-repeat').value;
  }

  function draw() {
    const list = on(selected);
    const dayBox = `<div class="box"><b>${longDate(selected)}</b></div>${list.length ? list.map((e) => eventRow(e, selected, true)).join('') : '<div class="box"><small>Geen afspraken op deze dag.</small></div>'}`;
    view.innerHTML = `${upcoming()}${grid()}${form ? formHtml() : ''}${dayBox}`;
    const all = (s) => view.querySelectorAll(s);
    const openForm = (f) => { form = f; formErr = ''; confirmId = null; draw(); const t = view.querySelector('#f-title'); if (t) t.scrollIntoView({ block: 'center' }); };
    all('[data-nav]').forEach((b) => b.onclick = () => { const d = new Date(year, month + Number(b.dataset.nav), 1); year = d.getFullYear(); month = d.getMonth(); draw(); });
    all('[data-today]').forEach((b) => b.onclick = () => { const d = new Date(); year = d.getFullYear(); month = d.getMonth(); selected = todayKey(); draw(); });
    all('[data-day]').forEach((b) => b.onclick = () => { selected = b.dataset.day; confirmId = null; const p = parseKey(selected); if (p.m - 1 !== month || p.y !== year) { year = p.y; month = p.m - 1; } draw(); });
    all('[data-new]').forEach((b) => b.onclick = () => openForm({ title: '', date: selected, time: '', note: '', repeat: 'none', color: PALETTE[0] }));
    all('[data-edit]').forEach((b) => b.onclick = () => {
      const e = events.find((x) => x.id === b.dataset.edit); if (!e) return;
      openForm({ id: e.id, title: e.title || '', date: e.date || selected, time: e.time || '', note: e.note || '', repeat: e.repeat || 'none', color: colorOf(e.color) });
    });
    all('[data-del]').forEach((b) => b.onclick = () => { confirmId = b.dataset.del; draw(); });
    all('[data-delno]').forEach((b) => b.onclick = () => { confirmId = null; draw(); });
    all('[data-delyes]').forEach((b) => b.onclick = async () => {
      b.disabled = true;
      try { await deleteDoc(doc(db, 'events', b.dataset.delyes)); confirmId = null; await reload(); }
      catch (e) { alert(nice(e)); b.disabled = false; }
    });
    if (!form) return;
    all('[data-color]').forEach((b) => b.onclick = () => { syncForm(); form.color = b.dataset.color; draw(); });
    all('[data-bday]').forEach((b) => b.onclick = () => {
      syncForm(); const name = form.title.replace(/^🎂\s*/, '').trim();
      form.title = `🎂 ${name}`.trimEnd().slice(0, 80); form.repeat = 'yearly'; draw();
      const t = view.querySelector('#f-title'); t.focus(); t.setSelectionRange(t.value.length, t.value.length);
    });
    all('[data-cancel]').forEach((b) => b.onclick = () => { form = null; draw(); });
    all('[data-save]').forEach((b) => b.onclick = async () => {
      syncForm();
      const title = form.title.trim().slice(0, 80);
      if (!title) { formErr = 'Geef de afspraak een titel.'; draw(); return; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) { formErr = 'Kies een datum.'; draw(); return; }
      const data = { title, date: form.date, time: /^\d{2}:\d{2}$/.test(form.time) ? form.time : '', note: form.note.trim().slice(0, 200), repeat: form.repeat, color: form.color };
      busy = true; b.disabled = true;
      try {
        if (form.id) await updateDoc(doc(db, 'events', form.id), data);
        else await addDoc(collection(db, 'events'), { ...data, by: me.uid, byName: me.name, created: Date.now() });
        selected = data.date; const p = parseKey(selected); year = p.y; month = p.m - 1;
        form = null; busy = false; await reload();
      } catch (e) { busy = false; formErr = nice(e); draw(); }
    });
  }

  view.innerHTML = '<div class="box center"><small>Laden…</small></div>';
  try { await load(); draw(); }
  catch (e) { view.innerHTML = `<div class="box err">${esc(nice(e))}</div>`; }
}
