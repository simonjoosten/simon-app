// Klusjes: taken met taakpunten, niveaus, prijzen, weekplanning, scorebord, beloningswinkel (mijlpalen) en bewijs (bericht/foto) dat na 3 dagen verdwijnt.
// Firestore: chores, taskstats, milestones, milestoneClaims, notifications (zoals voorheen; extra velden `icon` mogen door de beheerder worden gezet).
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDocs, query, where, deleteField }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { ADMIN_UID } from './firebase-config.js';
import { injectKit, head, wireHead, tabsHtml, ic, playScene, appStore, showToast } from './appkit.js?v=1';
import * as K from './klusjes-core.js?v=1';

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

const { DAY, PROOF_DAYS, KEEP_DONE_DAYS, dayKey, weekKey, REPEAT } = K;
const when = (t) => (t ? new Date(t).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
const dueText = (t) => (t ? new Date(t).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }) : '');

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

const KCSS = `<style>.kl-ico{flex:none}.kl-late{border-color:#e11d48!important}.kl-day.today{border:2px solid var(--accent)}.kl-chest{filter:grayscale(.1)}.kl-lock .gfx-icon{filter:grayscale(1);opacity:.35}.gw-badge{background:var(--card);border:1px solid var(--line);border-radius:18px}.gw-badge.got{border-color:var(--accent)}</style>`;
const kHead = (title, sub, extra = '') => head({ icon: 'hammer', title, sub, c1: '#f59e0b', c2: '#ea580c', extra });

/* ===================== Leden: Klusjes ===================== */
export async function klusjesView(c) {
  const { db, me, esc, nice, view } = c;
  injectKit();
  let tab = 'todo', chores = [], stats = [], miles = [], claims = [];
  const store = appStore(c, 'klusjes-extra', { lastTotal: null, lastLevel: 0, badges: [], fav: '' });
  const note = (text) => addDoc(collection(db, 'notifications'), { to: ADMIN_UID, text, from: me.uid, created: Date.now() }).catch(() => {});

  async function load() {
    chores = await cleanup(db, me, await fetchChores(db, me));
    const [s, m, cl] = await Promise.all([getDocs(collection(db, 'taskstats')), getDocs(collection(db, 'milestones')), getDocs(query(collection(db, 'milestoneClaims'), where('uid', '==', me.uid)))]);
    stats = s.docs.map((d) => ({ id: d.id, ...d.data() })); miles = m.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => !x.for || !x.for.length || x.for.includes(me.uid)).sort((a, b) => a.need - b.need); claims = cl.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  const mine = () => stats.find((x) => x.id === me.uid) || { total: 0, streak: 0 };

  function choreCard(x) {
    const st = K.dueState(x), late = st === 'late' && x.status === 'open';
    return `<div class="ak-card ${late ? 'kl-late' : ''}"><div class="row" style="margin:0;align-items:flex-start">${ic(K.choreIcon(x), { size: 56 })}<div style="flex:1;min-width:0"><b style="font-size:1.1em">${esc(x.title)}</b><br>
        <span class="ak-chip on">${ic('coin', { size: 16 })} ${x.points} punten</span>${x.repeat !== 'none' ? ` <span class="ak-chip">🔁 ${REPEAT[x.repeat]}</span>` : ''}
        ${x.note ? `<div><small>${esc(x.note)}</small></div>` : ''}${x.due ? `<div><small ${late ? 'class="err"' : ''}>📅 ${late ? 'Te laat: ' : st === 'today' ? 'Vandaag: ' : 'Uiterlijk '}${dueText(x.due)}</small></div>` : ''}
        ${x.rejectReason && x.status === 'open' ? `<div class="err"><small>Terug van Simon: ${esc(x.rejectReason)}</small></div>` : ''}</div></div>
      ${x.status === 'review' ? `<div style="margin-top:.4rem">⏳ Wacht op controle door Simon</div>` : `<div class="row"><button class="pri ak-big" data-done="${x.id}" style="flex:1">✔ Klaar!</button></div><div data-form="${x.id}"></div>`}</div>`;
  }

  function draw() {
    const wk = weekKey(new Date()); const my = mine(); const total = my.total || 0, L = K.levelProgress(total);
    let body = '';
    const open = chores.filter((x) => x.status === 'open' || x.status === 'review').sort((a, b) => (a.due || 9e15) - (b.due || 9e15));
    if (tab === 'todo') {
      const nOpen = open.filter((x) => x.status === 'open').length, nDone = chores.filter((x) => x.status === 'done' && x.doneBy === me.uid && K.dayKey(new Date(x.approvedAt || 0)) === dayKey(new Date())).length;
      body = `<div class="ak-card" style="text-align:center">${ic(nOpen ? 'hammer' : 'trophy', { size: 64 })}<div style="font-size:1.1em"><b>${K.cheerKid(nOpen, nDone)}</b></div></div>` + (open.length ? open.map(choreCard).join('') : '');
    } else if (tab === 'week') {
      const p = K.weekPlan(chores), today = new Date();
      const section = (title, items, extra = '') => items.length ? `<div class="ak-card ${extra}"><h3>${title}</h3>${items.map((x) => `<div class="row" style="margin:.3rem 0">${ic(K.choreIcon(x), { size: 30 })}<span style="flex:1">${esc(x.title)}${x.status === 'review' ? ' <small>⏳</small>' : ''}</span><span class="ak-chip">${x.points}</span></div>`).join('')}</div>` : '';
      body = section('Te laat', p.late, 'kl-late') + p.days.map((d) => { const isToday = K.startOfDay(d.ts) === K.startOfDay(today.getTime()); return `<div class="ak-card kl-day ${isToday ? 'today' : ''}"><div class="row" style="margin:0"><b style="flex:1">${K.DAY_NL[d.i]} ${new Date(d.ts).getDate()}/${new Date(d.ts).getMonth() + 1}${isToday ? ' · vandaag' : ''}</b><span class="ak-chip">${d.items.reduce((a, x) => a + x.points, 0)} punten</span></div>${d.items.map((x) => `<div class="row" style="margin:.3rem 0">${ic(K.choreIcon(x), { size: 30 })}<span style="flex:1">${esc(x.title)}${x.status === 'review' ? ' <small>⏳</small>' : ''}</span><span class="ak-chip">${x.points}</span></div>`).join('') || '<small class="mute">Niets gepland 🌿</small>'}</div>`; }).join('')
        + section('Later', p.later) + section('Zonder datum', p.none);
    } else if (tab === 'done') {
      const done = chores.filter((x) => x.status === 'done' && x.doneBy === me.uid).sort((a, b) => (b.approvedAt || 0) - (a.approvedAt || 0)).slice(0, 30);
      body = done.length ? done.map((x) => `<div class="ak-card"><div class="row" style="margin:0">${ic(K.choreIcon(x), { size: 44 })}<div style="flex:1"><b>${esc(x.title)}</b> <span class="ak-chip on">+${x.given ?? x.points}</span><br><small>Goedgekeurd ${when(x.approvedAt)}</small></div></div>
        ${x.proofMsg ? `<div><small>💬 ${esc(x.proofMsg)}</small></div>` : ''}${x.proofPhoto ? `<img src="${x.proofPhoto}" style="max-width:100%;border-radius:12px;margin-top:.3rem" alt="">` : ''}
        ${(x.proofMsg || x.proofPhoto) ? `<small>Bericht en foto verdwijnen ${PROOF_DAYS} dagen na het afronden.</small>` : ''}</div>`).join('') : '<div class="ak-card"><small>Nog niets afgerond.</small></div>';
    } else if (tab === 'score') {
      const rows = (key) => K.ranking(stats, wk, key);
      const list = (key, title) => `<div class="ak-card"><h3>${title}</h3>${rows(key).map((x, i) => `<div class="row" style="margin:.4rem 0"><span style="width:2.4rem;text-align:center">${i < 3 ? ic(['medal', 'medal', 'medal'][i], { size: 30 }) + '' : i + 1}</span><span style="flex:1">${esc(x.name)}${x.id === me.uid ? ' <small>(jij)</small>' : ''}${x.streak > 1 ? ` <small>🔥 ${x.streak} dagen</small>` : ''}<br><small class="mute">Niveau ${K.levelOf(x.total || 0)} · ${K.levelTitle(K.levelOf(x.total || 0))}</small></span><b>${x[key] || 0}</b></div>`).join('') || '<small>Nog geen punten.</small>'}</div>`;
      body = list('wp', 'Deze week') + list('total', 'Totaal');
    } else if (tab === 'shop') {
      const next = K.nextMilestone(miles, claims, total), fav = store.get().fav;
      body = `<div class="ak-card" style="text-align:center">${ic('coin', { size: 56 })}<div style="font-size:2.2rem;font-weight:800">${total}</div><small>Jouw taakpunten</small>${my.streak > 1 ? `<div><small>🔥 ${my.streak} dagen achter elkaar</small></div>` : ''}
        ${next ? `<div class="ak-bar" style="margin:.7rem 0 .2rem"><div style="width:${Math.min(100, Math.round(total / next.need * 100))}%"></div></div><small>Nog ${next.need - total} punten tot <b>${esc(next.title)}</b></small>` : ''}</div>`
        + (miles.length ? miles.map((m) => {
          const cl = claims.find((x) => x.milestone === m.id); const pct = Math.min(100, Math.round(total / m.need * 100));
          return `<div class="ak-card ${cl && cl.status === 'done' ? '' : ''}"><div class="row" style="margin:0">${ic(m.icon && m.icon.length < 20 ? m.icon : 'gift', { size: 64 })}<div style="flex:1"><b>${esc(m.title)}</b> <span class="ak-chip">${m.need} punten</span>${m.reward ? `<div><small>${esc(m.reward)}</small></div>` : ''}</div>
            <button class="ak-big" data-fav="${m.id}" aria-label="Favoriet" title="Hier spaar ik voor">${fav === m.id ? '⭐' : '☆'}</button></div>
            <div class="ak-bar" style="margin:.6rem 0"><div style="width:${pct}%"></div></div>
            ${cl ? `<small>${cl.status === 'done' ? '✅ Geregeld' : '⏳ Aangevraagd, Simon regelt het'}</small>` : total >= m.need ? `<button class="pri ak-big" data-claim="${m.id}" style="width:100%">🎉 Claim je beloning!</button>` : `<small>Nog ${m.need - total} punten · ${pct}%</small>`}</div>`;
        }).join('') : '<div class="ak-card"><small>Simon heeft nog geen beloningen gemaakt.</small></div>');
    } else {
      const got = new Set(K.earned(my, wk));
      body = `<div class="ak-card" style="text-align:center">${ic(K.levelIcon(L.level), { size: 80 })}<div style="font-size:1.3em"><b>Niveau ${L.level}: ${K.levelTitle(L.level)}</b></div><div class="ak-bar" style="margin:.6rem 0"><div style="width:${L.pct}%"></div></div><small class="mute">${total} punten · nog ${L.need - L.into} tot niveau ${L.level + 1}</small></div>
        <div class="ak-card"><h3>Prijzen (${got.size}/${K.BADGES.length})</h3><div class="ak-grid" style="grid-template-columns:repeat(3,1fr)">${K.BADGES.map((b) => `<div class="gw-badge ${got.has(b.id) ? 'got' : 'kl-lock'}" style="text-align:center;padding:.5rem .2rem;font-size:.8rem">${ic(b.ic, { size: 52 })}<div><b>${b.n}</b></div><small class="mute">${b.d}</small></div>`).join('')}</div></div>`;
    }
    const pend = open.filter((x) => x.status === 'open').length;
    view.innerHTML = `${KCSS}<div class="ak">${kHead('Klusjes', `Niveau ${L.level} · ${total} punten`)}${tabsHtml(tab, [['todo', `Te doen${pend ? ` (${pend})` : ''}`, 'hammer'], ['week', 'Week', 'compass'], ['done', 'Klaar', 'medal'], ['score', 'Scorebord', 'trophy'], ['shop', 'Winkel', 'chest'], ['prijzen', 'Prijzen', 'crown']])}${body}</div>`;
    wireHead(view);
    view.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; draw(); });
    view.querySelectorAll('[data-done]').forEach((b) => b.onclick = () => openForm(b.dataset.done));
    view.querySelectorAll('[data-fav]').forEach((b) => b.onclick = () => { store.set({ fav: store.get().fav === b.dataset.fav ? '' : b.dataset.fav }); draw(); });
    view.querySelectorAll('[data-claim]').forEach((b) => b.onclick = async () => {
      const m = miles.find((x) => x.id === b.dataset.claim); b.disabled = true;
      try {
        await setDoc(doc(db, 'milestoneClaims', `${m.id}__${me.uid}`), { milestone: m.id, uid: me.uid, name: me.name, title: m.title, status: 'pending', created: Date.now() });
        note(`${me.name} claimt de beloning "${m.title}"`); await load(); draw(); playScene('chest-open', { title: m.title, sub: 'Beloning aangevraagd!' });
      } catch (e) { alert(nice(e)); b.disabled = false; }
    });
  }

  function openForm(id) {
    const ch = chores.find((x) => x.id === id); const box = view.querySelector(`[data-form="${id}"]`); let photo = null;
    box.innerHTML = `<div class="row"><input data-msg maxlength="300" placeholder="Bericht (optioneel)" style="min-height:48px"></div>
      <div class="row wrap"><button class="ak-big" data-lib>🖼 Fotobibliotheek</button><button class="ak-big" data-cam>📷 Camera</button><span data-pv></span></div>
      <input type="file" accept="image/*" data-file style="display:none"><input type="file" accept="image/*" capture="environment" data-file2 style="display:none">
      <small>Bericht en foto verdwijnen na ${PROOF_DAYS} dagen.</small>
      <div class="row"><button class="pri ak-big" data-send style="flex:1">Versturen</button><button class="ak-big" data-cancel>Annuleer</button></div><div data-err class="err"></div>`;
    const q = (s) => box.querySelector(s);
    const pick = async (e) => { const f = e.target.files[0]; if (!f) return; try { photo = await resizeImage(f, 800); q('[data-pv]').innerHTML = `<img src="${photo}" style="height:3.5rem;border-radius:8px" alt="">`; } catch (er) { q('[data-err]').textContent = er.message; } };
    q('[data-lib]').onclick = () => q('[data-file]').click(); q('[data-cam]').onclick = () => q('[data-file2]').click();
    q('[data-file]').onchange = pick; q('[data-file2]').onchange = pick;
    q('[data-cancel]').onclick = () => { box.innerHTML = ''; };
    q('[data-send]').onclick = async () => {
      const msg = q('[data-msg]').value.trim().slice(0, 300); q('[data-send]').disabled = true;
      const data = { status: 'review', doneBy: me.uid, doneByName: me.name, doneAt: Date.now(), proofAt: Date.now() };
      if (msg) data.proofMsg = msg; if (photo) data.proofPhoto = photo;
      try { await updateDoc(doc(db, 'chores', id), data); note(`${me.name} is klaar met "${ch.title}"`); showToast('Verstuurd, Simon kijkt het na!'); await load(); draw(); }
      catch (e) { q('[data-err]').textContent = nice(e); q('[data-send]').disabled = false; }
    };
  }

  view.innerHTML = '<div class="box center"><small>Laden…</small></div>';
  await Promise.all([load(), store.load()]); draw();
  // Feestjes: nieuw niveau, nieuwe punten of nieuwe prijs sinds de vorige keer
  try {
    const s = store.get(), my = mine(), total = my.total || 0, lv = K.levelOf(total), wk = weekKey(new Date());
    const got = K.earned(my, wk), fresh = got.filter((b) => !s.badges.includes(b));
    let scene = null;
    if (s.lastTotal != null && lv > (s.lastLevel || 1)) scene = ['levelup', { title: `Niveau ${lv}!`, sub: K.levelTitle(lv) }];
    else if (s.lastTotal != null && total > s.lastTotal) scene = ['coins-rain', { title: `+${total - s.lastTotal} punten!`, sub: 'Goed gedaan' }];
    else if (s.lastTotal != null && fresh.length) scene = ['chest-open', { title: K.badgeOf(fresh[0]).n, sub: 'Nieuwe prijs!' }];
    store.set({ lastTotal: total, lastLevel: lv, badges: got });
    if (scene) playScene(scene[0], scene[1]);
  } catch (e) { /* geen feestje */ }
}

/* ===================== Admin: Klusjes Admin ===================== */
export async function klusjesAdminView(c) {
  const { db, me, esc, nice, view } = c;
  injectKit();
  let tab = 'check', chores = [], stats = [], miles = [], claims = [], members = [], pickIcon = 'hammer', mileIcon = 'gift', tpl = 'keuken', days = [], fill = null;
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
      const next = { title: ch.title, note: ch.note || '', points: ch.points, to: ch.to, toName: ch.toName || '', repeat: ch.repeat, due: base + step, status: 'open', created: now.getTime() };
      if (ch.icon) next.icon = ch.icon;
      await addDoc(collection(db, 'chores'), next);
    }
    await tell(ch.doneBy, ch.doneByName, `Klusje "${ch.title}" goedgekeurd: +${pts} taakpunten${pts !== ch.points ? ` (in plaats van ${ch.points})` : ''} 🎉`);
  }
  async function reject(ch, reason) {
    await updateDoc(doc(db, 'chores', ch.id), { status: 'open', rejectReason: reason || 'Probeer het nog eens.', doneBy: deleteField(), doneByName: deleteField(), doneAt: deleteField(), proofMsg: deleteField(), proofPhoto: deleteField(), proofAt: deleteField() });
    await tell(ch.doneBy, ch.doneByName, `Klusje "${ch.title}" is niet goedgekeurd: ${reason || 'probeer het nog eens'}`);
  }

  const forWho = (id) => `<div class="row wrap" id="${id}"><small>Voor wie:</small>${members.map((m) => `<label style="display:flex;gap:.3rem;align-items:center;min-height:44px"><input type="checkbox" value="${m.id}"> ${esc(m.name)}</label>`).join('')}</div>`;
  const iconRow = (attr, list, cur) => `<div class="ak-pick">${list.map((n) => `<button ${attr}="${n}" class="${cur === n ? 'sel' : ''}" aria-label="${n}">${ic(n, { size: 34 })}</button>`).join('')}</div>`;

  function draw() {
    const wk = weekKey(new Date()); let body = '';
    if (tab === 'check') {
      const rev = chores.filter((x) => x.status === 'review').sort((a, b) => a.doneAt - b.doneAt); const pend = claims.filter((x) => x.status === 'pending');
      body = `<div class="ak-card"><h3>Te controleren</h3>${rev.length ? '' : '<small>Niets te controleren. 🎉</small>'}</div>` + rev.map((x) => `<div class="ak-card"><div class="row" style="margin:0">${ic(K.choreIcon(x), { size: 44 })}<div><b>${esc(x.title)}</b> <span class="ak-chip">${x.points} punten</span><br>
        <small>${esc(x.doneByName)} · ${when(x.doneAt)}</small></div></div>${x.proofMsg ? `<div>💬 ${esc(x.proofMsg)}</div>` : ''}${x.proofPhoto ? `<img src="${x.proofPhoto}" style="max-width:100%;border-radius:12px;margin-top:.3rem" alt="">` : ''}
        <div class="row wrap"><input id="ap-${x.id}" type="number" min="0" max="1000" value="${x.points}" style="max-width:5rem"><small>punten geven</small><button class="pri ak-big" data-ok="${x.id}">✔ Goedkeuren</button><button class="ak-big" data-no="${x.id}">✘ Afkeuren</button></div><div data-rej="${x.id}"></div></div>`).join('')
        + `<div class="ak-card"><h3>Beloningen om te regelen</h3>${pend.length ? '' : '<small>Geen aanvragen.</small>'}${pend.map((x) => `<div class="row"><span style="flex:1">🎁 ${esc(x.name)}: <b>${esc(x.title)}</b><br><small>${when(x.created)}</small></span><button class="pri ak-big" data-ar="${x.id}">Geregeld</button></div>`).join('')}</div>`;
    } else if (tab === 'chores') {
      const open = chores.filter((x) => x.status !== 'done').sort((a, b) => (a.due || 9e15) - (b.due || 9e15)); const g = K.CHORE_TEMPLATES.find((x) => x.id === tpl);
      body = `<div class="ak-card"><h3>Nieuw klusje</h3>
        <div class="ak-chips">${K.CHORE_TEMPLATES.map((x) => `<button class="ak-chip ${x.id === tpl ? 'on' : ''}" data-tplg="${x.id}" style="border:0;min-height:40px">${ic(x.ic, { size: 20 })}${x.n}</button>`).join('')}</div>
        <div class="ak-chips" style="margin:.5rem 0">${g.items.map((it, i) => `<button class="ak-chip" data-tpl="${i}" style="border:0;min-height:40px">${ic(it[2], { size: 20 })}${it[0]} (${it[1]})</button>`).join('')}</div>
        <div class="row"><input id="nt" maxlength="80" placeholder="Titel (bijv. vuilnis buiten zetten)" value="${esc(fill ? fill.t : '')}" style="min-height:48px"></div>
        <div class="row"><input id="nn" maxlength="200" placeholder="Uitleg (optioneel)"></div>
        <div class="row wrap"><input id="np" type="number" min="1" max="1000" value="${fill ? fill.p : 10}" style="max-width:5.5rem"><span><small>taakpunten</small></span></div>
        ${iconRow('data-pi', K.ICON_PICK, pickIcon)}
        ${forWho('nto')}
        <small>Niemand aangevinkt = één klusje voor iedereen (de eerste die klaar is). Meerdere aangevinkt = ieder krijgt een eigen klusje.</small>
        <div class="row wrap"><select id="nr" style="flex:1">${Object.entries(REPEAT).map(([k, v]) => `<option value="${k}"${fill && fill.r === k ? ' selected' : ''}>${v}</option>`).join('')}</select><input id="nd" type="date" style="flex:1"></div>
        <div class="row"><button class="pri ak-big" id="nadd" style="flex:1">Toevoegen</button></div><div id="nerr" class="err"></div></div>`
        + (open.length ? open.map((x) => `<div class="ak-card"><div class="row" style="margin:0">${ic(K.choreIcon(x), { size: 40 })}<div style="flex:1"><b>${esc(x.title)}</b> <span class="ak-chip">${x.points}</span><br><small>voor ${x.to === 'all' ? 'iedereen' : esc(x.toName || x.to)}${x.repeat !== 'none' ? ` · 🔁 ${REPEAT[x.repeat]}` : ''}${x.due ? ` · 📅 ${dueText(x.due)}` : ''}${x.status === 'review' ? ' · ⏳ te controleren' : ''}</small></div><button class="ak-big" data-del="${x.id}">Verwijder</button></div></div>`).join('') : '<div class="ak-card"><small>Geen open klusjes.</small></div>');
    } else if (tab === 'plan') {
      const p = K.weekPlan(chores.filter((x) => x.status !== 'done'));
      body = `<div class="ak-card"><h3>Wekelijkse planning maken</h3><small class="mute">Kies een klusje en de dagen: voor elke dag komt er een klusje dat elke week terugkomt.</small>
        <div class="ak-chips" style="margin:.5rem 0">${K.CHORE_TEMPLATES.flatMap((x) => x.items).map((it, i) => `<button class="ak-chip" data-pfill="${i}" style="border:0;min-height:40px">${ic(it[2], { size: 20 })}${it[0]}</button>`).join('')}</div>
        <div class="row"><input id="pt" maxlength="80" placeholder="Titel" value="${esc(fill ? fill.t : '')}" style="min-height:48px"><input id="pp" type="number" min="1" max="1000" value="${fill ? fill.p : 5}" style="max-width:5.5rem"></div>
        <div class="gw-days" style="display:flex;gap:.3rem">${K.DAY_NL.map((d, i) => `<button data-pd="${i}" class="${days.includes(i) ? 'pri' : ''}" style="flex:1;min-height:44px;padding:0">${d}</button>`).join('')}</div>
        ${forWho('pto')}
        <div class="row"><button class="pri ak-big" id="padd" style="flex:1">Planning aanmaken</button></div><div id="perr2" class="err"></div></div>`
        + p.days.map((d) => `<div class="ak-card"><div class="row" style="margin:0"><b style="flex:1">${K.DAY_NL[d.i]} ${new Date(d.ts).getDate()}/${new Date(d.ts).getMonth() + 1}</b><span class="ak-chip">${d.items.length}</span></div>${d.items.map((x) => `<div class="row" style="margin:.2rem 0">${ic(K.choreIcon(x), { size: 26 })}<span style="flex:1">${esc(x.title)} <small>${x.to === 'all' ? '' : esc(x.toName || '')}</small></span><span class="ak-chip">${x.points}</span></div>`).join('') || '<small class="mute">Leeg</small>'}</div>`).join('');
    } else if (tab === 'rew') {
      body = `<div class="ak-card"><h3>Nieuwe beloning (mijlpaal)</h3>
        <div class="row"><input id="mt" maxlength="60" placeholder="Naam (bijv. Pizza-avond)" style="min-height:48px"></div>
        <div class="row"><input id="mr" maxlength="120" placeholder="Wat krijgt hij? (optioneel)"></div>
        ${iconRow('data-mi', K.MILE_ICONS, mileIcon)}${forWho('mto')}<small>Niemand aangevinkt = voor iedereen.</small>
        <div class="row"><input id="mn" type="number" min="1" value="100" style="max-width:6rem"><small>taakpunten nodig</small><button class="pri ak-big" id="madd" style="margin-left:auto">Toevoegen</button></div><div id="merr" class="err"></div></div>`
        + (miles.length ? miles.map((m) => `<div class="ak-card"><div class="row" style="margin:0">${ic(m.icon && m.icon.length < 20 ? m.icon : 'gift', { size: 48 })}<div style="flex:1"><b>${esc(m.title)}</b> <span class="ak-chip">${m.need} punten</span>${m.reward ? `<div><small>${esc(m.reward)}</small></div>` : ''}<div><small>Voor: ${(m.for && m.for.length) ? m.for.map((u) => esc((members.find((x) => x.id === u) || {}).name || '?')).join(', ') : 'iedereen'}</small></div></div><button class="ak-big" data-mdel="${m.id}">Verwijder</button></div></div>`).join('') : '<div class="ak-card"><small>Nog geen beloningen.</small></div>');
    } else {
      const rows = (key) => K.ranking(stats, wk, key);
      body = `<div class="ak-card"><h3>Punten geven of afnemen</h3>
        <div class="row wrap"><select id="ps" style="flex:1">${members.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select><input id="pn" type="number" min="1" max="1000" value="5" style="max-width:5rem"></div>
        <div class="row"><input id="pr" maxlength="100" placeholder="Reden (bijv. extra geholpen)"></div>
        <div class="row wrap"><button class="pri ak-big" id="pplus" style="flex:1">＋ Geven</button><button class="ak-big" id="pmin" style="flex:1">− Afnemen</button></div><div id="perr" class="err"></div></div>`
        + stats.map((x) => { const L = K.levelProgress(x.total || 0); return `<div class="ak-card"><div class="row" style="margin:0">${ic(K.levelIcon(L.level), { size: 48 })}<div style="flex:1"><b>${esc(x.name)}</b> <small>niveau ${L.level} · ${K.levelTitle(L.level)}</small><div class="ak-bar" style="margin-top:.3rem"><div style="width:${L.pct}%"></div></div></div><b>${x.total || 0}</b></div></div>`; }).join('')
        + ['wp', 'total'].map((key) => `<div class="ak-card"><h3>${key === 'wp' ? 'Deze week' : 'Totaal'}</h3>${rows(key).map((x, i) => `<div class="row"><span style="width:1.6rem">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span style="flex:1">${esc(x.name)}${x.streak > 1 ? ` <small>🔥 ${x.streak}</small>` : ''}</span><b>${x[key] || 0}</b></div>`).join('') || '<small>Nog geen punten.</small>'}</div>`).join('');
    }
    const pending = chores.filter((x) => x.status === 'review').length + claims.filter((x) => x.status === 'pending').length;
    view.innerHTML = `${KCSS}<div class="ak">${kHead('Klusjes Admin', `${chores.filter((x) => x.status !== 'done').length} open · ${pending} te regelen`)}${tabsHtml(tab, [['check', `Controleren${pending ? ` (${pending})` : ''}`, 'bell'], ['chores', 'Klusjes', 'hammer'], ['plan', 'Planning', 'compass'], ['rew', 'Beloningen', 'gift'], ['score', 'Scorebord', 'trophy']])}${body}</div>`;
    wireHead(view);
    const $ = (s) => view.querySelector(s);
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
    view.querySelectorAll('[data-tplg]').forEach((b) => b.onclick = () => { tpl = b.dataset.tplg; draw(); });
    view.querySelectorAll('[data-tpl]').forEach((b) => b.onclick = () => { const it = K.CHORE_TEMPLATES.find((x) => x.id === tpl).items[+b.dataset.tpl]; fill = { t: it[0], p: it[1], r: it[3] }; pickIcon = it[2]; draw(); });
    view.querySelectorAll('[data-pfill]').forEach((b) => b.onclick = () => { const it = K.CHORE_TEMPLATES.flatMap((x) => x.items)[+b.dataset.pfill]; fill = { t: it[0], p: it[1], r: 'weekly' }; pickIcon = it[2]; draw(); });
    view.querySelectorAll('[data-pi]').forEach((b) => b.onclick = () => { pickIcon = b.dataset.pi; draw(); });
    view.querySelectorAll('[data-mi]').forEach((b) => b.onclick = () => { mileIcon = b.dataset.mi; draw(); });
    view.querySelectorAll('[data-pd]').forEach((b) => b.onclick = () => { const i = +b.dataset.pd; days = days.includes(i) ? days.filter((x) => x !== i) : [...days, i].sort(); draw(); });
    if ($('#nadd')) $('#nadd').onclick = () => {
      const title = $('#nt').value.trim(), pts = parseInt($('#np').value, 10), picked = [...view.querySelectorAll('#nto input:checked')].map((i) => i.value);
      if (!title) { $('#nerr').textContent = 'Geef het klusje een titel.'; return; }
      if (!(pts >= 1 && pts <= 1000)) { $('#nerr').textContent = 'Punten: tussen 1 en 1000.'; return; }
      const d = $('#nd').value; const due = d ? new Date(d + 'T23:59:00').getTime() : null;
      const base = { title, note: $('#nn').value.trim().slice(0, 200), points: pts, icon: pickIcon, repeat: $('#nr').value, due, status: 'open', created: Date.now() };
      const targets = picked.length ? picked.map((id) => ({ to: id, toName: (members.find((m) => m.id === id) || {}).name || '' })) : [{ to: 'all', toName: '' }];
      fill = null;
      run(Promise.all(targets.map((t) => addDoc(collection(db, 'chores'), { ...base, ...t })))
        .then(() => Promise.all((picked.length ? targets : members.map((m) => ({ to: m.id, toName: m.name }))).map((t) => tell(t.to, t.toName, `Nieuw klusje: "${title}" (${pts} taakpunten)`)))));
    };
    if ($('#padd')) $('#padd').onclick = () => {
      const title = $('#pt').value.trim(), pts = parseInt($('#pp').value, 10), picked = [...view.querySelectorAll('#pto input:checked')].map((i) => i.value);
      if (!title) { $('#perr2').textContent = 'Geef het klusje een titel.'; return; }
      if (!(pts >= 1 && pts <= 1000)) { $('#perr2').textContent = 'Punten: tussen 1 en 1000.'; return; }
      if (!days.length) { $('#perr2').textContent = 'Kies minstens één dag.'; return; }
      const targets = picked.length ? picked.map((id) => ({ to: id, toName: (members.find((m) => m.id === id) || {}).name || '' })) : [{ to: 'all', toName: '' }];
      const jobs = []; for (const dw of days) for (const t of targets) jobs.push(addDoc(collection(db, 'chores'), { title, note: '', points: pts, icon: pickIcon, repeat: 'weekly', due: K.nextWeekday(dw), status: 'open', created: Date.now(), ...t }));
      const all = days.length; days = []; fill = null;
      run(Promise.all(jobs).then(() => Promise.all((picked.length ? targets : members.map((m) => ({ to: m.id, toName: m.name }))).map((t) => tell(t.to, t.toName, `Nieuwe weekplanning: "${title}" (${all} dagen per week)`)))));
    };
    const adjust = (sign) => {
      const uid = $('#ps').value, n = parseInt($('#pn').value, 10), why = $('#pr').value.trim();
      if (!uid || !(n >= 1 && n <= 1000)) { $('#perr').textContent = 'Kies iemand en een aantal punten (1 tot 1000).'; return; }
      const mem = members.find((m) => m.id === uid); const wk2 = weekKey(new Date());
      run((async () => {
        const sref = doc(db, 'taskstats', uid); const st = (await getDoc(sref)).data() || { total: 0, weekKey: wk2, weekPoints: 0, streak: 0, lastDay: '' };
        st.total = Math.max(0, (st.total || 0) + sign * n); st.weekPoints = Math.max(0, (st.weekKey === wk2 ? st.weekPoints : 0) + sign * n); st.weekKey = wk2; st.name = mem.name;
        await setDoc(sref, st);
        await tell(uid, mem.name, `${sign > 0 ? `+${n}` : `−${n}`} taakpunten${why ? `: ${why}` : ''}`);
      })());
    };
    if ($('#pplus')) { $('#pplus').onclick = () => adjust(1); $('#pmin').onclick = () => adjust(-1); }
    if ($('#madd')) $('#madd').onclick = () => {
      const title = $('#mt').value.trim(), need = parseInt($('#mn').value, 10);
      if (!title || !(need >= 1)) { $('#merr').textContent = 'Vul een naam en aantal punten in.'; return; }
      run(addDoc(collection(db, 'milestones'), { title, reward: $('#mr').value.trim().slice(0, 120), need, icon: mileIcon, for: [...view.querySelectorAll('#mto input:checked')].map((i) => i.value), created: Date.now() }));
    };
  }

  view.innerHTML = '<div class="box center"><small>Laden…</small></div>';
  await load(); draw();
}
