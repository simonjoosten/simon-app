// Gewoontes: dagelijkse gewoontes met streaks en een mini-kalender. Eén document habits/{uid} = { data: <JSON-string>, updated: ms }.
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const KEEP_DAYS = 120;      // per gewoonte bewaren we alleen de laatste 120 dagen
const MAX_JSON = 40000;     // de JSON-string blijft hier onder
const MAX_HABITS = 20;
const DEBOUNCE = 1500;
const EMOJI = ['💧', '📖', '🏃', '😴', '🧘', '🥗', '🚶', '🎸', '✍️', '🦷', '🌞', '🧹', '🍎', '🐕', '🎨', '💊', '🧠', '🚴', '🛏️', '☕', '📵', '🌿', '🙏', '💪'];
const COLORS = [['#8fc9a9', 'Mint'], ['#8dbbe0', 'Lucht'], ['#f2b8a2', 'Perzik'], ['#c9b3e6', 'Lila'], ['#f0d98c', 'Zand'], ['#f0a9c0', 'Roze']];
const STARTERS = [['Water drinken', '💧', 0], ['Lezen', '📖', 3], ['Bewegen', '🏃', 1], ['Vroeg slapen', '😴', 2], ['Buiten wandelen', '🚶', 4], ['Even stilstaan', '🧘', 5]];

/* ---------- pure datumhulp en streaks ---------- */
const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const shiftKey = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dayKey(d); };

// Huidige streak: tel vandaag mee als die gedaan is, anders vanaf gisteren.
export function streakOf(days, todayKey) {
  days = days || {};
  let k = days[todayKey] ? todayKey : shiftKey(todayKey, -1), n = 0;
  while (days[k]) { n++; k = shiftKey(k, -1); }
  return n;
}

// Langste reeks opeenvolgende dagen.
export function bestStreak(days) {
  const keys = Object.keys(days || {}).filter((k) => days[k]).sort();
  let best = 0, cur = 0, prev = null;
  for (const k of keys) { cur = prev && shiftKey(prev, 1) === k ? cur + 1 : 1; if (cur > best) best = cur; prev = k; }
  return best;
}

/* ---------- opslag ---------- */
function trimDays(days, keep) {
  const keys = Object.keys(days || {}).filter((k) => days[k]).sort().slice(-keep); const out = {};
  keys.forEach((k) => { out[k] = 1; }); return out;
}
function serialize(habits) {
  let keep = KEEP_DAYS, s;
  for (;;) {
    s = JSON.stringify({ habits: habits.map((h) => ({ ...h, days: trimDays(h.days, keep) })) });
    if (s.length < MAX_JSON || keep <= 7) break;
    keep = Math.max(7, keep - 15);
  }
  return s;
}
function parse(str) {
  try {
    const o = JSON.parse(str);
    return (o.habits || []).filter((h) => h && h.id).map((h) => ({
      id: String(h.id), name: String(h.name || '').slice(0, 40), emoji: h.emoji || '⭐', color: h.color || COLORS[0][0], days: h.days && typeof h.days === 'object' ? h.days : {}, created: h.created || Date.now(),
    }));
  } catch (e) { return null; }
}

const CSS = `
.gw-ring{width:3.6rem;height:3.6rem;min-width:3.6rem;border-radius:50%;border:3px solid var(--line);background:var(--card);font-size:1.7rem;line-height:1;padding:0;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .15s,background .2s}
.gw-ring:active{transform:scale(.92)}
.gw-ring.on{border-color:transparent}
.gw-ring.off span{opacity:.55}
.gw-bar{height:10px;background:var(--line);border-radius:9px;margin:.6rem 0 .3rem;overflow:hidden}
.gw-bar div{height:10px;background:var(--accent);border-radius:9px;transition:width .4s}
.gw-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-top:.5rem}
.gw-cal i{aspect-ratio:1;border-radius:5px;background:var(--line);opacity:.55;display:block}
.gw-cal i.on{opacity:1}
.gw-cal i.fut{opacity:.2}
.gw-cal i.today{outline:2px solid var(--ink);outline-offset:1px}
.gw-pick{display:flex;flex-wrap:wrap;gap:.3rem;margin:.4rem 0}
.gw-pick button{min-width:2.4rem;padding:.3rem;font-size:1.2rem}
.gw-pick button.sel{outline:2px solid var(--accent)}
.gw-dot{width:2rem;height:2rem;border-radius:50%;padding:0;border:2px solid transparent}
.gw-dot.sel{border-color:var(--ink)}
.gw-top{display:flex;gap:.7rem;align-items:center}
.gw-top .gw-info{flex:1;min-width:0}
`;

function cheer(done, total) {
  if (!total) return 'Voeg je eerste gewoonte toe, klein beginnen is prima.';
  if (done === 0) return 'Een rustig begin: kies er één en start klein. 🌱';
  if (done === total) return 'Alles gedaan voor vandaag, mooi gedaan! 🎉';
  const p = done / total;
  if (p < 0.5) return 'Goed bezig, elke stap telt. 🌿';
  if (p < 1) return 'Meer dan de helft al, bijna daar! ☀️';
  return '';
}

export async function gewoontesView(ctx) {
  const { db, me, esc, view, addCleanup } = ctx;
  const LS = `gewoontes:${me.uid}`;
  const ref = doc(db, 'habits', me.uid);
  let habits = [], updated = 0, dirty = false, timer = null, saveState = 'ok', saving = false;
  let adding = false, draft = { name: '', emoji: EMOJI[0], color: COLORS[0][0] };
  let editId = null, edit = null, delId = null;
  let alive = true;

  const readLocal = () => { try { const o = JSON.parse(localStorage.getItem(LS) || 'null'); return o && typeof o.data === 'string' ? o : null; } catch (e) { return null; } };
  const writeLocal = (data, upd) => { try { localStorage.setItem(LS, JSON.stringify({ data, updated: upd })); return true; } catch (e) { return false; } };

  async function flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!dirty || saving) return;
    const data = serialize(habits), upd = updated; dirty = false; saving = true;
    try { await setDoc(ref, { data, updated: upd }); saveState = 'ok'; }
    catch (e) { console.error(e); saveState = 'local'; dirty = true; }
    saving = false;
    if (alive) paintStatus();
  }
  function changed() {
    updated = Date.now(); dirty = true;
    writeLocal(serialize(habits), updated);
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, DEBOUNCE);
  }
  addCleanup(() => { alive = false; if (timer) { clearTimeout(timer); timer = null; } if (dirty) { dirty = true; saving = false; flush(); } });

  // Laden: nieuwste van lokaal en Firebase.
  view.innerHTML = '<div class="box center"><small>Laden…</small></div>';
  const loc = readLocal(); let remote = null;
  try { const s = await getDoc(ref); if (s.exists()) { const d = s.data(); if (d && typeof d.data === 'string') remote = d; } } catch (e) { console.error(e); saveState = 'local'; }
  const best = loc && (!remote || (loc.updated || 0) >= (remote.updated || 0)) ? loc : remote;
  if (best) { habits = parse(best.data) || []; updated = best.updated || 0; if (best === loc && remote && (loc.updated || 0) > (remote.updated || 0)) dirty = true; if (best === loc && !remote) dirty = habits.length > 0; if (dirty) timer = setTimeout(flush, DEBOUNCE); }
  if (!alive) return;

  const today = () => dayKey(new Date());
  const colorBtns = (cur, attr) => COLORS.map(([c, n]) => `<button class="gw-dot ${c === cur ? 'sel' : ''}" style="background:${c}" title="${n}" aria-label="${n}" ${attr}="${c}"></button>`).join('');
  const emojiBtns = (cur, attr) => EMOJI.map((e) => `<button class="${e === cur ? 'sel' : ''}" ${attr}="${e}">${e}</button>`).join('');

  function calendar(h, t) {
    const td = parseKey(t), dow = (td.getDay() + 6) % 7; // maandag = 0
    const start = shiftKey(t, -(dow + 28)); let out = '';
    for (let i = 0; i < 35; i++) {
      const k = shiftKey(start, i), on = h.days[k] ? 1 : 0, fut = k > t;
      out += `<i class="${on ? 'on' : ''} ${fut ? 'fut' : ''} ${k === t ? 'today' : ''}" ${on ? `style="background:${h.color}"` : ''} title="${k}"></i>`;
    }
    return `<div class="gw-cal">${out}</div>`;
  }

  function paintStatus() {
    const el = view.querySelector('[data-status]'); if (!el) return;
    el.innerHTML = saveState === 'local' ? '<small>💾 Staat veilig op dit apparaat</small>' : '';
  }

  function card(h, i, t) {
    const done = !!h.days[t], st = streakOf(h.days, t), bs = bestStreak(h.days);
    if (editId === h.id) {
      return `<div class="box"><b>Gewoonte aanpassen</b>
        <div class="row"><input data-ename maxlength="40" value="${esc(edit.name)}" placeholder="Naam"></div>
        <div class="gw-pick">${emojiBtns(edit.emoji, 'data-eemoji')}</div>
        <div class="gw-pick">${colorBtns(edit.color, 'data-ecolor')}</div>
        <div class="row"><button class="pri" data-esave>Opslaan</button><button data-ecancel>Annuleer</button></div></div>`;
    }
    return `<div class="box"><div class="gw-top">
      <button class="gw-ring ${done ? 'on' : 'off'}" data-toggle="${h.id}" aria-pressed="${done}" aria-label="${esc(h.name)} ${done ? 'ongedaan maken' : 'afvinken'}" style="${done ? `background:${h.color}` : ''}"><span>${done ? '✓' : h.emoji}</span></button>
      <div class="gw-info"><b>${h.emoji} ${esc(h.name)}</b><br>
        <small>🔥 ${st} ${st === 1 ? 'dag' : 'dagen'} op rij · Beste: ${bs}</small></div></div>
      ${calendar(h, t)}
      <div class="row wrap" style="margin-top:.5rem">
        <button data-up="${h.id}" ${i === 0 ? 'disabled' : ''} aria-label="Omhoog">↑</button><button data-down="${h.id}" ${i === habits.length - 1 ? 'disabled' : ''} aria-label="Omlaag">↓</button>
        <button data-edit="${h.id}">Aanpassen</button>
        ${delId === h.id ? `<span class="err">Echt weghalen?</span><button class="pri" data-delyes="${h.id}">Ja, weg</button><button data-delno>Nee</button>` : `<button data-del="${h.id}">Verwijder</button>`}
      </div></div>`;
  }

  function draw() {
    const t = today(), total = habits.length, dn = habits.filter((h) => h.days[t]).length, pct = total ? Math.round(dn / total * 100) : 0;
    let html = `<style>${CSS}</style>
      <div class="box"><b>Vandaag</b> <span class="chip">${dn} van ${total} gedaan</span>
        <div class="gw-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div style="width:${pct}%"></div></div>
        <small>${cheer(dn, total)}</small><div data-status></div></div>`;
    if (!total) {
      html += `<div class="box"><b>Zin om te beginnen?</b><br><small>Tik op een voorbeeld om het toe te voegen.</small>
        <div class="row wrap" style="margin-top:.4rem">${STARTERS.map(([n, e], i) => `<button data-starter="${i}">${e} ${n}</button>`).join('')}</div></div>`;
    }
    html += habits.map((h, i) => card(h, i, t)).join('');
    if (adding) {
      html += `<div class="box"><b>Nieuwe gewoonte</b>
        <div class="row"><input data-nname maxlength="40" value="${esc(draft.name)}" placeholder="Bijv. water drinken"></div>
        <div class="gw-pick">${emojiBtns(draft.emoji, 'data-nemoji')}</div>
        <div class="gw-pick">${colorBtns(draft.color, 'data-ncolor')}</div>
        <div class="row"><button class="pri" data-nsave>Toevoegen</button><button data-ncancel>Annuleer</button></div><div class="err" data-nerr></div></div>`;
    } else if (habits.length < MAX_HABITS) {
      html += `<div class="row"><button class="pri" data-new style="flex:1">＋ Nieuwe gewoonte</button></div>`;
    }
    view.innerHTML = html; paintStatus(); bind();
  }

  function bind() {
    const $$ = (s) => view.querySelectorAll(s);
    const find = (id) => habits.find((h) => h.id === id);
    const move = (id, d) => { const i = habits.findIndex((h) => h.id === id), j = i + d; if (j < 0 || j >= habits.length) return; [habits[i], habits[j]] = [habits[j], habits[i]]; changed(); draw(); };
    $$('[data-toggle]').forEach((b) => b.onclick = () => { const h = find(b.dataset.toggle), t = today(); if (h.days[t]) delete h.days[t]; else h.days[t] = 1; changed(); draw(); });
    $$('[data-up]').forEach((b) => b.onclick = () => move(b.dataset.up, -1));
    $$('[data-down]').forEach((b) => b.onclick = () => move(b.dataset.down, 1));
    $$('[data-del]').forEach((b) => b.onclick = () => { delId = b.dataset.del; draw(); });
    $$('[data-delno]').forEach((b) => b.onclick = () => { delId = null; draw(); });
    $$('[data-delyes]').forEach((b) => b.onclick = () => { habits = habits.filter((h) => h.id !== b.dataset.delyes); delId = null; changed(); draw(); });
    $$('[data-edit]').forEach((b) => b.onclick = () => { const h = find(b.dataset.edit); editId = h.id; edit = { name: h.name, emoji: h.emoji, color: h.color }; delId = null; draw(); });
    $$('[data-starter]').forEach((b) => b.onclick = () => { const [n, e, c] = STARTERS[+b.dataset.starter]; habits.push(mkHabit(n, e, COLORS[c][0])); changed(); draw(); });
    // bewerken
    const en = view.querySelector('[data-ename]'); if (en) en.oninput = () => { edit.name = en.value; };
    $$('[data-eemoji]').forEach((b) => b.onclick = () => { edit.emoji = b.dataset.eemoji; draw(); });
    $$('[data-ecolor]').forEach((b) => b.onclick = () => { edit.color = b.dataset.ecolor; draw(); });
    const es = view.querySelector('[data-esave]'); if (es) es.onclick = () => { const h = find(editId), n = edit.name.trim().slice(0, 40); if (!n) return; Object.assign(h, { name: n, emoji: edit.emoji, color: edit.color }); editId = null; changed(); draw(); };
    const ec = view.querySelector('[data-ecancel]'); if (ec) ec.onclick = () => { editId = null; draw(); };
    // toevoegen
    const nw = view.querySelector('[data-new]'); if (nw) nw.onclick = () => { adding = true; draw(); const i = view.querySelector('[data-nname]'); if (i) i.focus(); };
    const nn = view.querySelector('[data-nname]'); if (nn) nn.oninput = () => { draft.name = nn.value; };
    $$('[data-nemoji]').forEach((b) => b.onclick = () => { draft.emoji = b.dataset.nemoji; draw(); });
    $$('[data-ncolor]').forEach((b) => b.onclick = () => { draft.color = b.dataset.ncolor; draw(); });
    const nc = view.querySelector('[data-ncancel]'); if (nc) nc.onclick = () => { adding = false; draw(); };
    const ns = view.querySelector('[data-nsave]');
    if (ns) ns.onclick = () => {
      const n = draft.name.trim().slice(0, 40);
      if (!n) { view.querySelector('[data-nerr]').textContent = 'Geef je gewoonte een naam.'; return; }
      habits.push(mkHabit(n, draft.emoji, draft.color)); draft = { name: '', emoji: EMOJI[0], color: COLORS[0][0] }; adding = false; changed(); draw();
    };
  }
  const mkHabit = (name, emoji, color) => ({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, emoji, color, days: {}, created: Date.now() });

  draw();
}
