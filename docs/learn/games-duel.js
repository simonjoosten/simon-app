// Learn Spel – uitdaging met je broer (asynchroon). Firestore-collectie `learnduels`.
// Quota-zuinig: GEEN live listeners; alleen 1 query (limit 20) bij openen of op de ververs-knop.
// Document: { from, fromName, to ('' = iedereen), kitName, game, seed, level, qs (JSON-string <= 12000 tekens),
//             scores: { [uid]: { name, score, t } }, created, updated }
//
// Voorgestelde Firestore-regels (staan NIET in firestore.rules; toevoegen vóór gebruik):
//   match /learnduels/{id} {
//     allow read: if isMember();
//     allow create: if isMember() && request.resource.data.from == request.auth.uid
//       && request.resource.data.qs is string && request.resource.data.qs.size() <= 12000
//       && request.resource.data.keys().hasOnly(['from','fromName','to','kitName','game','seed','level','qs','scores','created','updated']);
//     allow update: if isMember()
//       && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['scores','updated'])
//       && request.resource.data.scores.diff(resource.data.scores).affectedKeys().hasOnly([request.auth.uid]);
//     allow delete: if isMember() && resource.data.from == request.auth.uid;
//   }
import { esc } from './core.js?v=1';
import { avatarHTML, LV_NAMES } from './games-shop.js?v=1';

export const DUEL_MAX_QS = 12, DUEL_MAX_CHARS = 12000, DUEL_DAYS = 14, DUEL_SHOW = 20, DAY_MS = 86400000;
const FS_URL = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
let fsP = null;
const FS = () => (fsP || (fsP = import(FS_URL)));

/* ---------- pure logica ---------- */
const ms = (v) => (typeof v === 'number' ? v : v && typeof v.toMillis === 'function' ? v.toMillis() : v && v.seconds ? v.seconds * 1000 : 0);
export function trimQ(q) {
  const o = {};
  for (const k of ['t', 'q', 'a', 'o', 'alt', 'e', 'say', 'lang', 'x', 'g', 'd', 'tol']) if (q[k] !== undefined && q[k] !== '') o[k] = q[k];
  return o;
}
// Pakt maximaal n vragen in een JSON-string die binnen de limiet past.
export function packQs(qs, n = DUEL_MAX_QS, maxChars = DUEL_MAX_CHARS) {
  let list = (qs || []).slice(0, Math.min(n, DUEL_MAX_QS)).map(trimQ);
  let s = JSON.stringify(list);
  while (s.length > maxChars && list.length > 1) { list = list.slice(0, -1); s = JSON.stringify(list); }
  if (s.length > maxChars) { list = list.map((q) => ({ ...q, x: undefined, say: undefined })); s = JSON.stringify(list); }
  return s.length > maxChars ? '[]' : s;
}
export function unpackQs(s) {
  try { const a = JSON.parse(s); return Array.isArray(a) ? a.filter((q) => q && typeof q === 'object' && q.t && q.q !== undefined) : []; } catch { return []; }
}
export function buildDuel({ uid, name, kitName, game, seed, level, qs, to = '', now = Date.now() }) {
  return {
    from: uid, fromName: String(name || 'Speler').slice(0, 30), to: to || '', kitName: String(kitName || 'Kit').slice(0, 60), game,
    seed: Math.floor(+seed) || 1, level: [1, 2, 3].includes(level) ? level : 2, qs: typeof qs === 'string' ? qs : packQs(qs),
    scores: {}, created: now, updated: now,
  };
}
export function duelVisible(d, uid, now = Date.now()) {
  if (!d || !d.game) return false;
  if (now - ms(d.created) > DUEL_DAYS * DAY_MS) return false;
  return d.from === uid || !d.to || d.to === uid;
}
// Max 20 zichtbaar, nieuwste eerst.
export function visibleDuels(list, uid, now = Date.now()) {
  return (list || []).filter((d) => duelVisible(d, uid, now)).sort((a, b) => ms(b.created) - ms(a.created)).slice(0, DUEL_SHOW);
}
export function duelBoard(d, uid) {
  return Object.entries(d.scores || {}).map(([id, s]) => ({ uid: id, name: (s && s.name) || 'Speler', score: +(s && s.score) || 0, t: +(s && s.t) || 0, me: id === uid }))
    .sort((a, b) => b.score - a.score || a.t - b.t);
}
export function duelStatus(d, uid) {
  const played = !!(d.scores && d.scores[uid]);
  const others = Object.keys(d.scores || {}).filter((k) => k !== uid).length;
  return !played ? 'open' : others ? 'done' : 'wait';
}
// Wie wint? alleen bij >= 2 spelers en geen gelijkspel op de top.
export function duelWinner(d, uid) {
  const b = duelBoard(d, uid);
  if (b.length < 2 || b[0].score === b[1].score) return null;
  return b[0];
}
export function standings(duels) {
  const m = {};
  for (const d of duels || []) {
    const w = duelWinner(d); if (!w) continue;
    for (const s of duelBoard(d)) { const r = m[s.uid] || (m[s.uid] = { uid: s.uid, name: s.name, wins: 0, games: 0 }); r.games++; r.name = s.name; if (s.uid === w.uid) r.wins++; }
  }
  return Object.values(m).sort((a, b) => b.wins - a.wins || a.games - b.games);
}
export function ago(t, now = Date.now()) {
  const m = Math.max(0, Math.floor((now - t) / 60000));
  if (m < 1) return 'zojuist'; if (m < 60) return `${m} min geleden`;
  const h = Math.round(m / 60); if (h < 24) return `${h} uur geleden`;
  const d = Math.round(h / 24); return `${d} ${d === 1 ? 'dag' : 'dagen'} geleden`;
}

/* ---------- Firestore ---------- */
export async function fetchDuels(api) {
  const { db, uid } = api.ctx;
  if (!db) throw new Error('Geen verbinding met de cloud.');
  const { collection, getDocs, query, orderBy, limit } = await FS();
  const snap = await getDocs(query(collection(db, 'learnduels'), orderBy('created', 'desc'), limit(DUEL_SHOW)));
  const out = [];
  snap.forEach((s) => { const x = s.data(); if (x) out.push({ ...x, id: s.id }); });
  return visibleDuels(out, uid);
}
export async function createDuel(api, { game, level, n }) {
  const { db, uid } = api.ctx;
  if (!db) throw new Error('Geen verbinding met de cloud.');
  const kit = await api.getKit();
  if (!kit || !kit.qs || !kit.qs.length) throw new Error('Kies eerst een kit met vragen.');
  const seed = 1 + Math.floor(Math.random() * 2000000000);
  const qs = api.pickQs(kit, Math.min(DUEL_MAX_QS, n || 8), { seed, hard: level });
  const d = buildDuel({ uid, name: api.name(), kitName: kit.name, game, seed, level, qs });
  const { collection, doc, setDoc } = await FS();
  const ref = doc(collection(db, 'learnduels'));
  await setDoc(ref, d);
  return { ...d, id: ref.id };
}
export async function submitScore(api, duel, score) {
  const { db, uid } = api.ctx;
  const rec = { name: api.name(), score: Math.round(+score || 0), t: Date.now() };
  duel.scores = { ...(duel.scores || {}), [uid]: rec };
  if (!db) return rec;
  const { doc, updateDoc } = await FS();
  await updateDoc(doc(db, 'learnduels', duel.id), { ['scores.' + uid]: rec, updated: Date.now() });
  return rec;
}

/* ---------- UI ---------- */
export function duelsHTML(api) {
  const S = api.S, uid = api.ctx.uid, f = S.dform || (S.dform = { open: false, game: '', level: 2, n: 8 });
  const ids = api.gameIds();
  if (!f.game || !ids.includes(f.game)) f.game = ids[0] || '';
  let h = `<div class="lsp-card2"><b>⚔️ Uitdaging met je broer</b><small>Jullie spelen dezelfde vragen en dezelfde spelstart, op je eigen tijd. De hoogste score wint.</small>
    <div class="lsp-row"><button class="lsp-btn" data-act="duel-form">${f.open ? '✕ Sluiten' : '＋ Nieuwe uitdaging'}</button><button class="lsp-btn ghost" data-act="duel-refresh" ${S.duelBusy ? 'disabled' : ''}>🔄 Verversen</button></div></div>`;
  if (f.open) {
    h += `<div class="lsp-card2"><b>Nieuwe uitdaging</b><small>Kit: <b>${esc(api.kitLabel())}</b> (kies een andere kit op het beginscherm)</small>
      <div class="lsp-lab">Spel</div><div class="lsp-chips">${ids.map((id) => { const m = api.meta(id); return `<button class="lsp-chip${f.game === id ? ' on' : ''}" data-act="duel-set" data-k="game" data-v="${esc(id)}">${esc(m.emoji)} ${esc(m.name)}</button>`; }).join('') || '<small>Nog geen spellen beschikbaar.</small>'}</div>
      <div class="lsp-lab">Moeilijkheid</div><div class="lsp-chips">${[1, 2, 3].map((l) => `<button class="lsp-chip${f.level === l ? ' on' : ''}" data-act="duel-set" data-k="level" data-v="${l}">${LV_NAMES[l]}</button>`).join('')}</div>
      <div class="lsp-lab">Aantal vragen (voor de vragenset)</div><div class="lsp-chips">${[6, 8, 10, 12].map((n) => `<button class="lsp-chip${f.n === n ? ' on' : ''}" data-act="duel-set" data-k="n" data-v="${n}">${n}</button>`).join('')}</div>
      <button class="lsp-btn big" data-act="duel-create" ${S.duelBusy || !f.game ? 'disabled' : ''}>⚔️ Uitdaging versturen</button></div>`;
  }
  if (S.duelErr) h += `<div class="lsp-note err">${esc(S.duelErr)}</div>`;
  if (S.duelBusy && !S.duels) h += '<div class="lsp-empty">Laden…</div>';
  const list = S.duels;
  if (list && !list.length) h += '<div class="lsp-empty">Nog geen uitdagingen. Maak er een en stuur je broer een seintje! 💪</div>';
  for (const d of list || []) {
    const m = api.meta(d.game), st = duelStatus(d, uid), board = duelBoard(d, uid), top = Math.max(1, ...board.map((b) => b.score));
    const w = duelWinner(d, uid);
    const chip = st === 'open' ? '<span class="lsp-st open">Jouw beurt</span>' : st === 'wait' ? '<span class="lsp-st wait">Wachten op de ander</span>' : w ? (w.me ? '<span class="lsp-st win">Gewonnen 🏆</span>' : '<span class="lsp-st lose">Verloren</span>') : '<span class="lsp-st done">Gelijkspel</span>';
    h += `<div class="lsp-duel ${st}"><div class="lsp-duel-top"><span class="lsp-duel-e" style="background:${esc(m.color)}">${esc(m.emoji)}</span><div><b>${esc(m.name)}</b><small>${esc(d.kitName)} · ${LV_NAMES[d.level] || ''} · ${(unpackQs(d.qs) || []).length} vragen</small></div>${chip}</div>
      <small>Van ${esc(d.fromName || '?')} · ${ago(ms(d.created))}</small>
      <div class="lsp-board">${board.map((b) => `<div class="lsp-brow${b.me ? ' me' : ''}"><span>${esc(b.name)}${b.me ? ' (jij)' : ''}</span><div class="lsp-bar2"><i style="width:${Math.round(100 * b.score / top)}%"></i></div><b>${b.score}</b></div>`).join('') || '<small>Nog niemand heeft gespeeld.</small>'}</div>
      ${st === 'open' ? `<button class="lsp-btn big" data-act="duel-play" data-id="${esc(d.id)}">▶ Speel mee</button>` : ''}</div>`;
  }
  return h;
}

export async function duelsRefresh(api, force = false) {
  const S = api.S;
  if (S.duelBusy) return;
  if (!force && S.duels && Date.now() - (S.duelT || 0) < 20000) return;   // quota-zuinig
  S.duelBusy = true; S.duelErr = ''; api.rerender();
  try { S.duels = await fetchDuels(api); S.duelT = Date.now(); } catch (e) { S.duelErr = api.nice(e); }
  S.duelBusy = false; api.rerender();
}

export function duelsAct(act, data, api) {
  const S = api.S, f = S.dform || (S.dform = { open: false, game: '', level: 2, n: 8 });
  if (act === 'duel-form') { f.open = !f.open; api.rerender(); return true; }
  if (act === 'duel-refresh') { duelsRefresh(api, true); return true; }
  if (act === 'duel-set') { f[data.k] = data.k === 'game' ? data.v : +data.v; api.rerender(); return true; }
  if (act === 'duel-create') {
    if (S.duelBusy) return true;
    S.duelBusy = true; S.duelErr = ''; api.rerender();
    createDuel(api, f).then((d) => { S.duels = visibleDuels([d, ...(S.duels || [])], api.ctx.uid); S.duelT = Date.now(); f.open = false; api.toast('Uitdaging staat klaar! Speel zelf ook mee.'); })
      .catch((e) => { S.duelErr = api.nice(e); }).finally(() => { S.duelBusy = false; api.rerender(); });
    return true;
  }
  if (act === 'duel-play') {
    const d = (S.duels || []).find((x) => x.id === data.id); if (!d) return true;
    api.startGame(d.game, { duel: d });
    return true;
  }
  return false;
}
export { avatarHTML };
