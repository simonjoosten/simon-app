// Klusjes: taken met taakpunten, scorebord, beloningen (mijlpalen) en bewijs (bericht/foto) dat na 3 dagen verdwijnt.
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDocs, query, where, deleteField }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { ADMIN_UID } from './firebase-config.js';

// Foto verkleinen tot een kleine JPEG (bewust in dit bestand, zodat Klusjes niets van andere bestanden nodig heeft).
const resizeImage = (file, max = 800) => new Promise((res, rej) => {
  const img = new Image(); const url = URL.createObjectURL(file);
  img.onload = () => {
    let { width: w, height: h } = img; const k = Math.min(1, max / Math.max(w, h)); w = Math.round(w * k); h = Math.round(h * k);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(img, 0, 0, w, h);
    let q = 0.75, out = cv.toDataURL('image/jpeg', q);
    while (out.length > 400000 && q > 0.3) { q -= 0.1; out = cv.toDataURL('image/jpeg', q); }
    URL.revokeObjectURL(url); out.length > 440000 ? rej(new Error('Foto is te groot')) : res(out);
  };
  img.onerror = () => rej(new Error('Foto kon niet gelezen worden')); img.src = url;
});

const DAY = 86400000;
const PROOF_DAYS = 3;       // bericht/foto bij een klus verdwijnt na zoveel dagen
const KEEP_DONE_DAYS = 30;  // afgeronde klusjes worden na zoveel dagen opgeruimd
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const weekKey = (d) => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const n = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - n); const y = t.getUTCFullYear(); return `${y}-W${pad(Math.ceil(((t - Date.UTC(y, 0, 1)) / DAY + 1) / 7))}`; };
const when = (t) => (t ? new Date(t).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
const dueText = (t) => (t ? new Date(t).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }) : '');
const REPEAT = { none: 'Eenmalig', daily: 'Elke dag', weekly: 'Elke week' };

// Badge voor het homescherm.
export function watchKlusjesBadge({ db, me, live }, setBadge) {
  const col = collection(db, 'chores');
  if (me.admin && me.apps.includes('klusjesadmin')) {
    let a = 0, b = 0; const set = () => setBadge('klusjesadmin', a + b);
    live(query(col, where('status', '==', 'review')), (s) => { a = s.size; set(); });
    live(query(collection(db, 'milestoneClaims'), where('status', '==', 'pending')), (s) => { b = s.size; set(); });
  }
  if (me.apps.includes('klusjes')) {
    let x = new Map(), y = new Map(); const set = () => { const all = new Map([...x, ...y]); setBadge('klusjes', [...all.values()].filter((c) => c.status === 'open').length); };
    live(query(col, where('to', '==', 'all')), (s) => { x = new Map(s.docs.map((d) => [d.id, d.data()])); set(); });
    live(query(col, where('to', '==', me.uid)), (s) => { y = new Map(s.docs.map((d) => [d.id, d.data()])); set(); });
  }
}

async function fetchChores(db, me) {
  const col = collection(db, 'chores');
  if (me.admin) return (await getDocs(col)).docs.map((d) => ({ id: d.id, ...d.data() }));
  const [a, b] = await Promise.all([getDocs(query(col, where('to', '==', 'all'))), getDocs(query(col, where('to', '==', me.uid)))]);
  const m = new Map(); [...a.docs, ...b.docs].forEach((d) => m.set(d.id, { id: d.id, ...d.data() })); return [...m.values()];
}

// Bewijs na 3 dagen wissen; admin ruimt ook oude afgeronde klusjes op.
async function cleanup(db, me, chores) {
  const now = Date.now();
  for (const c of chores) {
    try {
      if (c.proofAt && now - c.proofAt > PROOF_DAYS * DAY && (c.proofMsg || c.proofPhoto) && (me.admin || c.doneBy === me.uid)) {
        await updateDoc(doc(db, 'chores', c.id), { proofMsg: deleteField(), proofPhoto: deleteField() }); delete c.proofMsg; delete c.proofPhoto;
      }
      if (me.admin && c.status === 'done' && c.approvedAt && now - c.approvedAt > KEEP_DONE_DAYS * DAY) { await deleteDoc(doc(db, 'chores', c.id)); c._gone = true; }
    } catch (e) { console.error(e); }
  }
  return chores.filter((c) => !c._gone);
}

const tabs = (cur, list) => `<div class="row wrap">${list.map(([k, l]) => `<button data-tab="${k}" class="${k === cur ? 'pri' : ''}" style="flex:1">${l}</button>`).join('')}</div>`;

/* ===================== Leden: Klusjes ===================== */
export async function klusjesView(c) {
  const { db, me, esc, nice, view } = c;
  let tab = 'todo', chores = [], stats = [], miles = [], claims = [];
  const note = (text) => addDoc(collection(db, 'notifications'), { to: ADMIN_UID, text, from: me.uid, created: Date.now() }).catch(() => {});

  async function load() {
    chores = await cleanup(db, me, await fetchChores(db, me));
    const [s, m, cl] = await Promise.all([getDocs(collection(db, 'taskstats')), getDocs(collection(db, 'milestones')), getDocs(query(collection(db, 'milestoneClaims'), where('uid', '==', me.uid)))]);
    stats = s.docs.map((d) => ({ id: d.id, ...d.data() })); miles = m.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => !x.for || !x.for.length || x.for.includes(me.uid)).sort((a, b) => a.need - b.need); claims = cl.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  const mine = () => stats.find((x) => x.id === me.uid) || { total: 0, streak: 0 };

  function draw() {
    const wk = weekKey(new Date()); const my = mine();
    let body = '';
    if (tab === 'todo') {
      const open = chores.filter((x) => x.status === 'open' || x.status === 'review').sort((a, b) => (a.due || 9e15) - (b.due || 9e15));
      body = open.length ? open.map((x) => {
        const late = x.due && x.due < Date.now() && x.status === 'open';
        return `<div class="box"><b>${esc(x.title)}</b> <span class="chip">${x.points} punten</span>${x.repeat !== 'none' ? ` <small>🔁 ${REPEAT[x.repeat]}</small>` : ''}
          ${x.note ? `<div><small>${esc(x.note)}</small></div>` : ''}${x.due ? `<div><small ${late ? 'class="err"' : ''}>📅 ${late ? 'Te laat: ' : 'Uiterlijk '}${dueText(x.due)}</small></div>` : ''}
          ${x.rejectReason && x.status === 'open' ? `<div class="err"><small>Terug van Simon: ${esc(x.rejectReason)}</small></div>` : ''}
          ${x.status === 'review' ? `<div style="margin-top:.4rem">⏳ Wacht op controle door Simon</div>` : `<div class="row"><button class="pri" data-done="${x.id}">✔ Klaar</button></div><div data-form="${x.id}"></div>`}</div>`;
      }).join('') : '<div class="box"><small>Geen klusjes. 🎉</small></div>';
    } else if (tab === 'done') {
      const done = chores.filter((x) => x.status === 'done' && x.doneBy === me.uid).sort((a, b) => (b.approvedAt || 0) - (a.approvedAt || 0)).slice(0, 30);
      body = done.length ? done.map((x) => `<div class="box"><b>${esc(x.title)}</b> <span class="chip">+${x.given ?? x.points}</span><br><small>Goedgekeurd ${when(x.approvedAt)}</small>
        ${x.proofMsg ? `<div><small>💬 ${esc(x.proofMsg)}</small></div>` : ''}${x.proofPhoto ? `<img src="${x.proofPhoto}" style="max-width:100%;border-radius:10px;margin-top:.3rem" alt="">` : ''}
        ${(x.proofMsg || x.proofPhoto) ? `<small>Bericht en foto verdwijnen ${PROOF_DAYS} dagen na het afronden.</small>` : ''}</div>`).join('') : '<div class="box"><small>Nog niets afgerond.</small></div>';
    } else if (tab === 'score') {
      const rows = stats.map((x) => ({ ...x, wp: x.weekKey === wk ? x.weekPoints : 0 }));
      const list = (key, title) => `<div class="box"><b>${title}</b>${[...rows].sort((a, b) => b[key] - a[key]).map((x, i) => `<div class="row"><span style="width:1.6rem">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span style="flex:1">${esc(x.name)}${x.id === me.uid ? ' <small>(jij)</small>' : ''}${x.streak > 1 ? ` <small>🔥 ${x.streak} dagen</small>` : ''}</span><b>${x[key]}</b></div>`).join('') || '<br><small>Nog geen punten.</small>'}</div>`;
      body = list('wp', 'Deze week') + list('total', 'Totaal');
    } else {
      const total = my.total || 0;
      body = `<div class="box center"><small>Jouw taakpunten</small><div class="code" style="font-size:2.2rem">${total}</div>${my.streak > 1 ? `<small>🔥 ${my.streak} dagen achter elkaar</small>` : ''}</div>`
        + (miles.length ? miles.map((m) => {
          const cl = claims.find((x) => x.milestone === m.id); const pct = Math.min(100, Math.round(total / m.need * 100));
          return `<div class="box"><b>🎁 ${esc(m.title)}</b> <span class="chip">${m.need} punten</span>${m.reward ? `<div><small>${esc(m.reward)}</small></div>` : ''}
            <div style="height:8px;background:var(--line);border-radius:9px;margin:.5rem 0"><div style="height:8px;width:${pct}%;background:var(--accent);border-radius:9px"></div></div>
            ${cl ? `<small>${cl.status === 'done' ? '✅ Geregeld' : '⏳ Aangevraagd, Simon regelt het'}</small>` : total >= m.need ? `<button class="pri" data-claim="${m.id}">🎉 Claim</button>` : `<small>Nog ${m.need - total} punten</small>`}</div>`;
        }).join('') : '<div class="box"><small>Simon heeft nog geen beloningen gemaakt.</small></div>');
    }
    view.innerHTML = `${tabs(tab, [['todo', 'Te doen'], ['done', 'Klaar'], ['score', 'Scorebord'], ['rew', 'Beloningen']])}${body}`;
    view.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; draw(); });
    view.querySelectorAll('[data-done]').forEach((b) => b.onclick = () => openForm(b.dataset.done));
    view.querySelectorAll('[data-claim]').forEach((b) => b.onclick = async () => {
      const m = miles.find((x) => x.id === b.dataset.claim); b.disabled = true;
      try {
        await setDoc(doc(db, 'milestoneClaims', `${m.id}__${me.uid}`), { milestone: m.id, uid: me.uid, name: me.name, title: m.title, status: 'pending', created: Date.now() });
        note(`${me.name} claimt de beloning "${m.title}"`); await load(); draw();
      } catch (e) { alert(nice(e)); b.disabled = false; }
    });
  }

  function openForm(id) {
    const ch = chores.find((x) => x.id === id); const box = view.querySelector(`[data-form="${id}"]`); let photo = null;
    box.innerHTML = `<div class="row"><input data-msg maxlength="300" placeholder="Bericht (optioneel)"></div>
      <div class="row wrap"><button data-pick>📷 Foto</button><span data-pv></span></div>
      <input type="file" accept="image/*" data-file style="display:none">
      <small>Bericht en foto verdwijnen na ${PROOF_DAYS} dagen.</small>
      <div class="row"><button class="pri" data-send>Versturen</button><button data-cancel>Annuleer</button></div><div data-err class="err"></div>`;
    const q = (s) => box.querySelector(s);
    q('[data-pick]').onclick = () => q('[data-file]').click();
    q('[data-file]').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { photo = await resizeImage(f, 800); q('[data-pv]').innerHTML = `<img src="${photo}" style="height:3rem;border-radius:8px" alt="">`; } catch (er) { q('[data-err]').textContent = er.message; } };
    q('[data-cancel]').onclick = () => { box.innerHTML = ''; };
    q('[data-send]').onclick = async () => {
      const msg = q('[data-msg]').value.trim().slice(0, 300); q('[data-send]').disabled = true;
      const data = { status: 'review', doneBy: me.uid, doneByName: me.name, doneAt: Date.now(), proofAt: Date.now() };
      if (msg) data.proofMsg = msg; if (photo) data.proofPhoto = photo;
      try { await updateDoc(doc(db, 'chores', id), data); note(`${me.name} is klaar met "${ch.title}"`); await load(); draw(); }
      catch (e) { q('[data-err]').textContent = nice(e); q('[data-send]').disabled = false; }
    };
  }

  view.innerHTML = '<div class="box center"><small>Laden…</small></div>';
  await load(); draw();
}

/* ===================== Admin: Klusjes Admin ===================== */
export async function klusjesAdminView(c) {
  const { db, me, esc, nice, view } = c;
  let tab = 'check', chores = [], stats = [], miles = [], claims = [], members = [];
  const tell = (uid, name, text) => addDoc(collection(db, 'notifications'), { to: uid, toName: name, text, created: Date.now() }).catch(() => {});

  async function load() {
    chores = await cleanup(db, me, await fetchChores(db, me));
    const [s, m, cl, u] = await Promise.all([getDocs(collection(db, 'taskstats')), getDocs(collection(db, 'milestones')), getDocs(collection(db, 'milestoneClaims')), getDocs(collection(db, 'users'))]);
    stats = s.docs.map((d) => ({ id: d.id, ...d.data() })); miles = m.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.need - b.need);
    claims = cl.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.created - a.created);
    members = u.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => x.status === 'approved' && x.id !== me.uid);
  }

  async function approve(ch, pts) {
    const now = new Date();
    await updateDoc(doc(db, 'chores', ch.id), { status: 'done', approvedAt: now.getTime(), given: pts });
    const sref = doc(db, 'taskstats', ch.doneBy); const st = (await getDoc(sref)).data() || { total: 0, weekKey: '', weekPoints: 0, streak: 0, lastDay: '' };
    const wk = weekKey(now), today = dayKey(now), yest = dayKey(new Date(now.getTime() - DAY));
    st.total = (st.total || 0) + pts; st.weekPoints = (st.weekKey === wk ? st.weekPoints : 0) + pts; st.weekKey = wk;
    st.streak = st.lastDay === today ? st.streak || 1 : st.lastDay === yest ? (st.streak || 0) + 1 : 1; st.lastDay = today; st.name = ch.doneByName;
    await setDoc(sref, st);
    if (ch.repeat && ch.repeat !== 'none') {
      const step = ch.repeat === 'daily' ? DAY : 7 * DAY; const base = ch.due && ch.due > now.getTime() - step ? ch.due : now.getTime();
      await addDoc(collection(db, 'chores'), { title: ch.title, note: ch.note || '', points: ch.points, to: ch.to, toName: ch.toName || '', repeat: ch.repeat, due: base + step, status: 'open', created: now.getTime() });
    }
    await tell(ch.doneBy, ch.doneByName, `Klusje "${ch.title}" goedgekeurd: +${pts} taakpunten${pts !== ch.points ? ` (in plaats van ${ch.points})` : ''} 🎉`);
  }
  async function reject(ch, reason) {
    await updateDoc(doc(db, 'chores', ch.id), { status: 'open', rejectReason: reason || 'Probeer het nog eens.', doneBy: deleteField(), doneByName: deleteField(), doneAt: deleteField(), proofMsg: deleteField(), proofPhoto: deleteField(), proofAt: deleteField() });
    await tell(ch.doneBy, ch.doneByName, `Klusje "${ch.title}" is niet goedgekeurd: ${reason || 'probeer het nog eens'}`);
  }

  function draw() {
    const wk = weekKey(new Date()); let body = '';
    if (tab === 'check') {
      const rev = chores.filter((x) => x.status === 'review').sort((a, b) => a.doneAt - b.doneAt); const pend = claims.filter((x) => x.status === 'pending');
      body = `<div class="box"><b>Te controleren</b>${rev.length ? '' : '<br><small>Niets te controleren.</small>'}</div>` + rev.map((x) => `<div class="box"><b>${esc(x.title)}</b> <span class="chip">${x.points} punten</span><br>
        <small>${esc(x.doneByName)} · ${when(x.doneAt)}</small>${x.proofMsg ? `<div>💬 ${esc(x.proofMsg)}</div>` : ''}${x.proofPhoto ? `<img src="${x.proofPhoto}" style="max-width:100%;border-radius:10px;margin-top:.3rem" alt="">` : ''}
        <div class="row wrap"><input id="ap-${x.id}" type="number" min="0" max="1000" value="${x.points}" style="max-width:5rem"><small>punten geven</small><button class="pri" data-ok="${x.id}">✔ Goedkeuren</button><button data-no="${x.id}">✘ Afkeuren</button></div><div data-rej="${x.id}"></div></div>`).join('')
        + `<div class="box"><b>Beloningen om te regelen</b>${pend.length ? '' : '<br><small>Geen aanvragen.</small>'}${pend.map((x) => `<div class="row"><span style="flex:1">🎁 ${esc(x.name)}: <b>${esc(x.title)}</b><br><small>${when(x.created)}</small></span><button class="pri" data-ar="${x.id}">Geregeld</button></div>`).join('')}</div>`;
    } else if (tab === 'chores') {
      const open = chores.filter((x) => x.status !== 'done').sort((a, b) => (a.due || 9e15) - (b.due || 9e15));
      body = `<div class="box"><b>Nieuw klusje</b>
        <div class="row"><input id="nt" maxlength="80" placeholder="Titel (bijv. vuilnis buiten zetten)"></div>
        <div class="row"><input id="nn" maxlength="200" placeholder="Uitleg (optioneel)"></div>
        <div class="row wrap"><input id="np" type="number" min="1" max="1000" value="10" style="max-width:5.5rem"><span><small>taakpunten</small></span>
          </div>
        <div class="row wrap" id="nto"><small>Voor wie:</small>${members.map((m) => `<label style="display:flex;gap:.3rem;align-items:center"><input type="checkbox" value="${m.id}"> ${esc(m.name)}</label>`).join('')}</div>
        <small>Niemand aangevinkt = één klusje voor iedereen (de eerste die klaar is). Meerdere aangevinkt = ieder krijgt een eigen klusje.</small>
        <div class="row wrap"><select id="nr" style="flex:1">${Object.entries(REPEAT).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select><input id="nd" type="date" style="flex:1"></div>
        <div class="row"><button class="pri" id="nadd" style="flex:1">Toevoegen</button></div><div id="nerr" class="err"></div></div>`
        + (open.length ? open.map((x) => `<div class="box"><b>${esc(x.title)}</b> <span class="chip">${x.points}</span> <small>voor ${x.to === 'all' ? 'iedereen' : esc(x.toName || x.to)}${x.repeat !== 'none' ? ` · 🔁 ${REPEAT[x.repeat]}` : ''}${x.due ? ` · 📅 ${dueText(x.due)}` : ''}${x.status === 'review' ? ' · ⏳ te controleren' : ''}</small>
          <div class="row"><button data-del="${x.id}">Verwijder</button></div></div>`).join('') : '<div class="box"><small>Geen open klusjes.</small></div>');
    } else if (tab === 'rew') {
      body = `<div class="box"><b>Nieuwe beloning (mijlpaal)</b>
        <div class="row"><input id="mt" maxlength="60" placeholder="Naam (bijv. Pizza-avond)"></div>
        <div class="row"><input id="mr" maxlength="120" placeholder="Wat krijgt hij? (optioneel)"></div>
        <div class="row wrap" id="mto"><small>Voor wie:</small>${members.map((m) => `<label style="display:flex;gap:.3rem;align-items:center"><input type="checkbox" value="${m.id}"> ${esc(m.name)}</label>`).join('')}</div><small>Niemand aangevinkt = voor iedereen.</small>
        <div class="row"><input id="mn" type="number" min="1" value="100" style="max-width:6rem"><small>taakpunten nodig</small><button class="pri" id="madd" style="margin-left:auto">Toevoegen</button></div><div id="merr" class="err"></div></div>`
        + (miles.length ? miles.map((m) => `<div class="box"><b>🎁 ${esc(m.title)}</b> <span class="chip">${m.need} punten</span>${m.reward ? `<div><small>${esc(m.reward)}</small></div>` : ''}<div><small>Voor: ${(m.for && m.for.length) ? m.for.map((u) => esc((members.find((x) => x.id === u) || {}).name || '?')).join(', ') : 'iedereen'}</small></div><div class="row"><button data-mdel="${m.id}">Verwijder</button></div></div>`).join('') : '<div class="box"><small>Nog geen beloningen.</small></div>');
    } else {
      const rows = stats.map((x) => ({ ...x, wp: x.weekKey === wk ? x.weekPoints : 0 }));
      body = `<div class="box"><b>Punten geven of afnemen</b>
        <div class="row wrap"><select id="ps" style="flex:1">${members.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select><input id="pn" type="number" min="1" max="1000" value="5" style="max-width:5rem"></div>
        <div class="row"><input id="pr" maxlength="100" placeholder="Reden (bijv. extra geholpen)"></div>
        <div class="row wrap"><button class="pri" id="pplus" style="flex:1">＋ Geven</button><button id="pmin" style="flex:1">− Afnemen</button></div><div id="perr" class="err"></div></div>`
        + ['wp', 'total'].map((key) => `<div class="box"><b>${key === 'wp' ? 'Deze week' : 'Totaal'}</b>${[...rows].sort((a, b) => b[key] - a[key]).map((x, i) => `<div class="row"><span style="width:1.6rem">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span style="flex:1">${esc(x.name)}${x.streak > 1 ? ` <small>🔥 ${x.streak}</small>` : ''}</span><b>${x[key]}</b></div>`).join('') || '<br><small>Nog geen punten.</small>'}</div>`).join('');
    }
    const pending = chores.filter((x) => x.status === 'review').length + claims.filter((x) => x.status === 'pending').length;
    view.innerHTML = `${tabs(tab, [['check', `Controleren${pending ? ` (${pending})` : ''}`], ['chores', 'Klusjes'], ['rew', 'Beloningen'], ['score', 'Scorebord']])}${body}`;
    view.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; draw(); });
    const run = (p) => p.then(async () => { await load(); draw(); }).catch((e) => alert(nice(e)));
    view.querySelectorAll('[data-ok]').forEach((b) => b.onclick = () => { const ch = chores.find((x) => x.id === b.dataset.ok); const pts = parseInt(view.querySelector(`#ap-${ch.id}`).value, 10); if (!(pts >= 0 && pts <= 1000)) return alert('Vul een aantal punten in (0 tot 1000).'); b.disabled = true; run(approve(ch, pts)); });
    view.querySelectorAll('[data-no]').forEach((b) => b.onclick = () => {
      const id = b.dataset.no, box = view.querySelector(`[data-rej="${id}"]`);
      box.innerHTML = '<div class="row"><input data-why maxlength="120" placeholder="Reden (optioneel)"><button class="pri" data-go>Afkeuren</button></div>';
      box.querySelector('[data-go]').onclick = () => run(reject(chores.find((x) => x.id === id), box.querySelector('[data-why]').value.trim()));
    });
    view.querySelectorAll('[data-ar]').forEach((b) => b.onclick = () => { const cl = claims.find((x) => x.id === b.dataset.ar); run(updateDoc(doc(db, 'milestoneClaims', cl.id), { status: 'done' }).then(() => tell(cl.uid, cl.name, `Je beloning "${cl.title}" is geregeld! 🎁`))); });
    view.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => confirm('Dit klusje verwijderen?') && run(deleteDoc(doc(db, 'chores', b.dataset.del))));
    view.querySelectorAll('[data-mdel]').forEach((b) => b.onclick = () => confirm('Deze beloning verwijderen?') && run(deleteDoc(doc(db, 'milestones', b.dataset.mdel))));
    if (view.querySelector('#nadd')) view.querySelector('#nadd').onclick = () => {
      const title = view.querySelector('#nt').value.trim(), pts = parseInt(view.querySelector('#np').value, 10), picked = [...view.querySelectorAll('#nto input:checked')].map((i) => i.value);
      if (!title) { view.querySelector('#nerr').textContent = 'Geef het klusje een titel.'; return; }
      if (!(pts >= 1 && pts <= 1000)) { view.querySelector('#nerr').textContent = 'Punten: tussen 1 en 1000.'; return; }
      const d = view.querySelector('#nd').value; const due = d ? new Date(d + 'T23:59:00').getTime() : null;
      const base = { title, note: view.querySelector('#nn').value.trim().slice(0, 200), points: pts, repeat: view.querySelector('#nr').value, due, status: 'open', created: Date.now() };
      const targets = picked.length ? picked.map((id) => ({ to: id, toName: (members.find((m) => m.id === id) || {}).name || '' })) : [{ to: 'all', toName: '' }];
      run(Promise.all(targets.map((t) => addDoc(collection(db, 'chores'), { ...base, ...t })))
        .then(() => Promise.all((picked.length ? targets : members.map((m) => ({ to: m.id, toName: m.name }))).map((t) => tell(t.to, t.toName, `Nieuw klusje: "${title}" (${pts} taakpunten)`)))));
    };
    const adjust = (sign) => {
      const uid = view.querySelector('#ps').value, n = parseInt(view.querySelector('#pn').value, 10), why = view.querySelector('#pr').value.trim();
      if (!uid || !(n >= 1 && n <= 1000)) { view.querySelector('#perr').textContent = 'Kies iemand en een aantal punten (1 tot 1000).'; return; }
      const mem = members.find((m) => m.id === uid); const wk = weekKey(new Date());
      run((async () => {
        const sref = doc(db, 'taskstats', uid); const st = (await getDoc(sref)).data() || { total: 0, weekKey: wk, weekPoints: 0, streak: 0, lastDay: '' };
        st.total = Math.max(0, (st.total || 0) + sign * n); st.weekPoints = Math.max(0, (st.weekKey === wk ? st.weekPoints : 0) + sign * n); st.weekKey = wk; st.name = mem.name;
        await setDoc(sref, st);
        await tell(uid, mem.name, `${sign > 0 ? `+${n}` : `−${n}`} taakpunten${why ? `: ${why}` : ''}`);
      })());
    };
    if (view.querySelector('#pplus')) { view.querySelector('#pplus').onclick = () => adjust(1); view.querySelector('#pmin').onclick = () => adjust(-1); }
    if (view.querySelector('#madd')) view.querySelector('#madd').onclick = () => {
      const title = view.querySelector('#mt').value.trim(), need = parseInt(view.querySelector('#mn').value, 10);
      if (!title || !(need >= 1)) { view.querySelector('#merr').textContent = 'Vul een naam en aantal punten in.'; return; }
      run(addDoc(collection(db, 'milestones'), { title, reward: view.querySelector('#mr').value.trim().slice(0, 120), need, for: [...view.querySelectorAll('#mto input:checked')].map((i) => i.value), created: Date.now() }));
    };
  }

  view.innerHTML = '<div class="box center"><small>Laden…</small></div>';
  await load(); draw();
}
