// Gewoontes: dagelijkse gewoontes met reeksen, schema (welke dagen), XP en niveaus, prijzen, statistieken en sjablonen.
// Eén document habits/{uid} = { data: <JSON-string>, updated: ms } (oude gegevens laden gewoon door).
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { injectKit, head, wireHead, tabsHtml, ic, playScene, showToast } from './appkit.js?v=1';
import { ICONS } from './gfx/icons.js?v=1';
import * as G from './gewoontes-core.js?v=1';

export { dayKey, streakOf, bestStreak } from './gewoontes-core.js?v=1';
const { COLORS, EMOJI, ICON_CHOICES, DAY_NAMES, dayKey, shiftKey, isDue } = G;
const DEBOUNCE = 1500;
const TABS = [['nu', 'Vandaag', 'sun'], ['week', 'Week', 'compass'], ['cijfers', 'Cijfers', 'lightbulb'], ['prijzen', 'Prijzen', 'trophy'], ['sjablonen', 'Sjablonen', 'puzzle']];

const CSS = `
.gw-ring{width:calc(4.4rem*var(--gfx-scale,1));height:calc(4.4rem*var(--gfx-scale,1));min-width:calc(4.4rem*var(--gfx-scale,1));border-radius:50%;border:3px solid var(--line);background:var(--card);padding:0;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .15s,background .2s;position:relative}
.gw-ring:active{transform:scale(.9)}
.gw-ring.on{border-color:transparent}
.gw-ring .tick{position:absolute;right:-4px;bottom:-4px;background:#16a34a;color:#fff;border-radius:50%;width:1.5rem;height:1.5rem;font-size:.95rem;display:flex;align-items:center;justify-content:center}
.gw-ring.off .gfx-icon{opacity:.8}
.gw-ring.rest{opacity:.45}
.gw-week{display:flex;gap:4px;margin-top:.5rem}
.gw-week button{flex:1;min-width:0;min-height:calc(42px*var(--gfx-scale,1));padding:.1rem;border-radius:11px;font-size:.7rem;line-height:1.1}
.gw-week button.fut{opacity:.35}.gw-week button.rest{opacity:.5;border-style:dashed}
.gw-heat{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,1fr);gap:3px}
.gw-heat i{display:block;aspect-ratio:1;border-radius:4px;min-width:14px}
.gw-lock .gfx-icon{filter:grayscale(1);opacity:.35}
.gw-badge{text-align:center;padding:.6rem .3rem;border-radius:18px;background:var(--card);border:1px solid var(--line);font-size:.8rem}
.gw-badge.got{border-color:var(--accent)}
.gw-top{display:flex;gap:.8rem;align-items:center}.gw-top .gw-info{flex:1;min-width:0}
.gw-dot{width:calc(2.4rem*var(--gfx-scale,1));height:calc(2.4rem*var(--gfx-scale,1));border-radius:50%;padding:0;border:3px solid transparent}.gw-dot.sel{border-color:var(--ink)}
.gw-days{display:flex;gap:.3rem}.gw-days button{flex:1;min-height:44px;padding:0}.gw-days button.sel{background:var(--accent);color:#fff;border-color:var(--accent)}
`;

export async function gewoontesView(ctx) {
  const { db, me, esc, view, addCleanup } = ctx;
  injectKit();
  const LS = `gewoontes:${me.uid}`;
  const ref = doc(db, 'habits', me.uid);
  let habits = [], meta = G.defaultMeta(), updated = 0, dirty = false, timer = null, saveState = 'ok', saving = false, alive = true;
  let tab = 'nu', form = null, delId = null, group = 'gezond';

  const readLocal = () => { try { const o = JSON.parse(localStorage.getItem(LS) || 'null'); return o && typeof o.data === 'string' ? o : null; } catch (e) { return null; } };
  const writeLocal = (data, upd) => { try { localStorage.setItem(LS, JSON.stringify({ data, updated: upd })); return true; } catch (e) { return false; } };

  async function flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!dirty || saving) return;
    const data = G.serialize(habits, meta), upd = updated; dirty = false; saving = true;
    try { await setDoc(ref, { data, updated: upd }); saveState = 'ok'; }
    catch (e) { console.error(e); saveState = 'local'; dirty = true; }
    saving = false;
    if (alive) paintStatus();
  }
  function changed() {
    updated = Date.now(); dirty = true;
    writeLocal(G.serialize(habits, meta), updated);
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, DEBOUNCE);
  }
  addCleanup(() => { alive = false; if (timer) { clearTimeout(timer); timer = null; } if (dirty) { saving = false; flush(); } });

  view.innerHTML = '<div class="box center"><small>Laden…</small></div>';
  const loc = readLocal(); let remote = null;
  try { const s = await getDoc(ref); if (s.exists()) { const d = s.data(); if (d && typeof d.data === 'string') remote = d; } } catch (e) { console.error(e); saveState = 'local'; }
  const best = loc && (!remote || (loc.updated || 0) >= (remote.updated || 0)) ? loc : remote;
  if (best) {
    const p = G.parseAll(best.data); if (p) { habits = p.habits; meta = p.meta; } updated = best.updated || 0;
    if (best === loc && remote && (loc.updated || 0) > (remote.updated || 0)) dirty = true;
    if (best === loc && !remote) dirty = habits.length > 0;
    if (dirty) timer = setTimeout(flush, DEBOUNCE);
  }
  if (!alive) return;

  const today = () => dayKey(new Date());
  const find = (id) => habits.find((h) => h.id === id);
  const iconOf = (h, size = 44) => (h.icon && ICONS[h.icon] ? ic(h.icon, { size }) : `<span style="font-size:${Math.round(size * 0.75)}px;line-height:1">${h.emoji || '⭐'}</span>`);
  const mkHabit = (name, emoji, color, extra = {}) => ({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, emoji, icon: '', color, sched: [], note: '', days: {}, created: Date.now(), ...extra });
  const lvl = () => G.levelProgress(meta.xp || 0);

  /* ---------- afvinken + beloningen ---------- */
  function toggleDay(h, key) {
    const t = today(); if (key > t) return;
    const before = lvl().level, was = !!h.days[key];
    let s;
    if (was) { s = G.streakSched(h, key); delete h.days[key]; meta.xp = Math.max(0, (meta.xp || 0) - G.xpGain(s)); meta.checks = Math.max(0, (meta.checks || 0) - 1); }
    else { h.days[key] = 1; s = G.streakSched(h, key); meta.xp = (meta.xp || 0) + G.xpGain(s); meta.checks = (meta.checks || 0) + 1; }
    let scene = null;
    if (!was) {
      const now = lvl();
      if (now.level > before) scene = ['levelup', { title: `Niveau ${now.level}!`, sub: G.levelTitle(now.level) }];
      else if (key === t && G.milestoneHit(G.streakSched(h, t)) && (meta.seen[h.id] || 0) < G.streakSched(h, t)) { const n = G.streakSched(h, t); meta.seen[h.id] = n; scene = ['victory', { title: `${n} dagen op rij!`, sub: h.name }]; }
      const nb = G.earnedBadges(habits, meta, t).filter((b) => !meta.badges.includes(b));
      if (nb.length) { meta.badges = [...meta.badges, ...nb]; showToast(`Nieuwe prijs: ${G.badgeOf(nb[0]).n}`); if (!scene) scene = ['chest-open', { title: G.badgeOf(nb[0]).n, sub: 'Nieuwe prijs!' }]; }
      if (!scene && key === t && G.isPerfect(habits, t) && meta.perfectDay !== t) { meta.perfectDay = t; scene = ['coins-rain', { title: 'Perfecte dag!', sub: 'Alles gedaan' }]; }
    }
    changed(); draw();
    if (scene) playScene(scene[0], scene[1]);
  }

  /* ---------- weergaven ---------- */
  function ringSvg(pct, size = 96) {
    const r = 40, c = 2 * Math.PI * r;
    return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${pct}%"><circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--line)" stroke-width="10"/><circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--accent)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(c * pct / 100).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 50 50)"/><text x="50" y="57" text-anchor="middle" font-size="22" font-weight="700" fill="currentColor">${pct}%</text></svg>`;
  }
  function weekRow(h, t) {
    const start = G.shiftKey(t, -G.dow(t)); let out = '';
    for (let i = 0; i < 7; i++) {
      const k = shiftKey(start, i), on = h.days[k], fut = k > t, due = isDue(h, k);
      out += `<button class="${fut ? 'fut' : ''} ${due ? '' : 'rest'}" data-tg="${h.id}|${k}" ${fut ? 'disabled' : ''} aria-label="${DAY_NAMES[i]}" style="${on ? `background:${h.color};border-color:${h.color}` : ''};${k === t ? 'outline:2px solid var(--ink);outline-offset:1px' : ''}">${DAY_NAMES[i]}<br>${on ? '✓' : due ? '·' : '–'}</button>`;
    }
    return `<div class="gw-week">${out}</div>`;
  }
  function card(h, t) {
    const done = !!h.days[t], due = isDue(h, t), st = G.streakSched(h, t), bs = G.bestSched(h);
    if (form && form.id === h.id) return formHtml();
    return `<div class="ak-card"><div class="gw-top">
      <button class="gw-ring ${done ? 'on' : 'off'} ${due ? '' : 'rest'}" data-toggle="${h.id}" aria-pressed="${done}" aria-label="${esc(h.name)} ${done ? 'ongedaan maken' : 'afvinken'}" style="${done ? `background:${h.color}` : ''}">${iconOf(h, 46)}${done ? '<span class="tick">✓</span>' : ''}</button>
      <div class="gw-info"><b style="font-size:1.1em">${esc(h.name)}</b>${h.note ? `<div><small class="mute">${esc(h.note)}</small></div>` : ''}
        <div><small>${ic('flame', { size: 18 })} ${st} ${st === 1 ? 'dag' : 'dagen'} op rij · beste ${bs}</small></div><small class="mute">${G.schedText(h)}${due ? '' : ' · vandaag rust 😴'}</small></div></div>
      ${weekRow(h, t)}
      <div class="row wrap" style="margin-top:.5rem"><button class="ak-big" data-edit="${h.id}">Aanpassen</button>
        ${delId === h.id ? `<span class="err">Echt weghalen?</span><button class="pri ak-big" data-delyes="${h.id}">Ja, weg</button><button class="ak-big" data-delno>Nee</button>` : `<button class="ak-big" data-del="${h.id}">Verwijder</button>`}</div></div>`;
  }
  function formHtml() {
    const f = form;
    return `<div class="ak-card"><h3>${f.id ? 'Gewoonte aanpassen' : 'Nieuwe gewoonte'}</h3>
      <div class="row"><input data-fname maxlength="40" value="${esc(f.name)}" placeholder="Bijv. water drinken" style="min-height:48px"></div>
      <div class="row"><input data-fnote maxlength="60" value="${esc(f.note)}" placeholder="Notitie (bijv. 8 glazen)" style="min-height:48px"></div>
      <small class="mute">Plaatje</small><div class="ak-pick">${ICON_CHOICES.map((n) => `<button data-ficon="${n}" class="${f.icon === n ? 'sel' : ''}" aria-label="${n}">${ic(n, { size: 34 })}</button>`).join('')}${EMOJI.map((e) => `<button data-femoji="${e}" class="${!f.icon && f.emoji === e ? 'sel' : ''}">${e}</button>`).join('')}</div>
      <small class="mute">Kleur</small><div class="ak-pick">${COLORS.map(([c, n]) => `<button class="gw-dot ${c === f.color ? 'sel' : ''}" style="background:${c}" title="${n}" aria-label="${n}" data-fcolor="${c}"></button>`).join('')}</div>
      <small class="mute">Op welke dagen? ${f.sched.length ? '' : '(elke dag)'}</small>
      <div class="gw-days">${DAY_NAMES.map((d, i) => `<button data-fday="${i}" class="${f.sched.includes(i) ? 'sel' : ''}">${d}</button>`).join('')}</div>
      <div class="ak-chips" style="margin:.4rem 0"><button class="ak-chip" data-fpre="0,1,2,3,4" style="border:0">Schooldagen</button><button class="ak-chip" data-fpre="5,6" style="border:0">Weekend</button><button class="ak-chip" data-fpre="" style="border:0">Elke dag</button></div>
      <div class="row"><button class="pri ak-big" data-fsave style="flex:1">${f.id ? 'Opslaan' : 'Toevoegen'}</button><button class="ak-big" data-fcancel style="flex:1">Annuleer</button></div><div class="err" data-ferr></div></div>`;
  }
  function vNu() {
    const t = today(), s = G.dayStatus(habits, t), pct = s.due ? Math.round(s.done / s.due * 100) : 0, L = lvl();
    let h = `<div class="ak-card"><div class="row" style="margin:0">${ringSvg(pct)}<div style="flex:1"><b style="font-size:1.15em">Vandaag</b> <span class="ak-chip">${s.done} van ${s.due}</span><br><small>${G.cheer(s.done, s.due)}</small>
      <div class="ak-bar" style="margin-top:.5rem"><div style="width:${L.pct}%"></div></div><small class="mute">Niveau ${L.level} · ${L.into}/${L.need} XP</small></div></div><div data-status></div></div>`;
    if (!habits.length) {
      h += `<div class="ak-card"><h3>Zin om te beginnen?</h3><small class="mute">Tik op een voorbeeld om het toe te voegen.</small><div class="ak-chips" style="margin-top:.5rem">${G.STARTERS.map((x, i) => `<button class="ak-big" data-starter="${i}">${ic(x[1], { size: 24 })} ${x[0]}</button>`).join('')}</div></div>`;
    }
    h += habits.map((x) => card(x, t)).join('');
    if (form && !form.id) h += formHtml();
    else if (habits.length < G.MAX_HABITS) h += `<div class="row"><button class="pri ak-big" data-new style="flex:1">＋ Nieuwe gewoonte</button></div>`;
    return h;
  }
  function vWeek() {
    const t = today(), start = shiftKey(t, -G.dow(t));
    const days = Array.from({ length: 7 }, (_, i) => shiftKey(start, i));
    return `<div class="ak-card"><h3>Deze week</h3><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;min-width:300px"><thead><tr><th></th>${DAY_NAMES.map((d, i) => `<th style="font-size:.75em;${days[i] === t ? 'color:var(--accent)' : ''}">${d}</th>`).join('')}</tr></thead><tbody>
      ${habits.map((h) => `<tr><td style="padding:.25rem .2rem;white-space:nowrap;max-width:7rem;overflow:hidden;text-overflow:ellipsis">${iconOf(h, 26)} <small>${esc(h.name)}</small></td>${days.map((k) => { const on = h.days[k], fut = k > t, due = isDue(h, k); return `<td style="padding:2px;text-align:center"><button data-tg="${h.id}|${k}" ${fut ? 'disabled' : ''} style="width:100%;min-height:42px;padding:0;border-radius:10px;${on ? `background:${h.color};border-color:${h.color}` : ''};opacity:${fut ? .3 : due ? 1 : .45}">${on ? '✓' : due ? '' : '–'}</button></td>`; }).join('')}</tr>`).join('') || '<tr><td><small class="mute">Nog geen gewoontes.</small></td></tr>'}
      </tbody><tfoot><tr><td><small class="mute">Klaar</small></td>${days.map((k) => { const s = G.dayStatus(habits, k); return `<td style="text-align:center;font-size:.75em">${k > t ? '' : s.due ? `${s.done}/${s.due}` : ''}</td>`; }).join('')}</tr></tfoot></table></div></div>`;
  }
  function vCijfers() {
    const t = today(); if (!habits.length) return '<div class="ak-card"><small class="mute">Voeg eerst een gewoonte toe, dan verschijnen hier je cijfers.</small></div>';
    const hm = G.heatmap(habits, t, 12), wc = G.weekdayCounts(habits, t, 12), mx = Math.max(1, ...wc);
    const totalDone = habits.reduce((a, h) => a + G.doneTotal(h), 0), L = lvl();
    return `<div class="ak-card"><div class="ak-grid" style="grid-template-columns:repeat(3,1fr);text-align:center">
        <div>${ic(G.levelIcon(L.level), { size: 44 })}<br><b>Niveau ${L.level}</b><br><small class="mute">${G.levelTitle(L.level)}</small></div>
        <div>${ic('flame', { size: 44 })}<br><b>${Math.max(0, ...habits.map((h) => G.streakSched(h, t)))}</b><br><small class="mute">beste reeks nu</small></div>
        <div>${ic('coin', { size: 44 })}<br><b>${Math.max(totalDone, meta.checks || 0)}</b><br><small class="mute">vinkjes</small></div></div></div>
      <div class="ak-card"><h3>Laatste 12 weken</h3><div class="gw-heat">${hm.map((col) => col.map((v) => `<i style="background:${v === -1 ? 'transparent' : v === -2 ? 'var(--line)' : 'var(--accent)'};opacity:${v === -1 ? 0 : v === -2 ? .35 : (0.2 + 0.8 * v).toFixed(2)}"></i>`).join('')).join('')}</div><small class="mute">Donkerder = meer gedaan. Grijs = niets te doen.</small></div>
      <div class="ak-card"><h3>Beste dagen</h3><div style="display:flex;gap:6px;align-items:flex-end;height:110px">${wc.map((n, i) => `<div style="flex:1;text-align:center"><div style="height:${Math.round(n / mx * 80)}px;min-height:3px;background:var(--accent);border-radius:7px 7px 3px 3px"></div><small>${DAY_NAMES[i]}</small></div>`).join('')}</div></div>
      <div class="ak-card"><h3>Per gewoonte (30 dagen)</h3>${habits.map((h) => { const r = G.rate(h, t, 30); return `<div style="margin:.6rem 0"><div class="row" style="margin:0">${iconOf(h, 30)}<b style="flex:1">${esc(h.name)}</b><span class="ak-chip">${r}%</span></div><div class="ak-bar" style="margin-top:.3rem"><div style="width:${r}%;background:${h.color}"></div></div><small class="mute">Beste reeks ${G.bestSched(h)} · totaal ${G.doneTotal(h)}x</small></div>`; }).join('')}</div>`;
  }
  function vPrijzen() {
    const L = lvl(), got = new Set(meta.badges || []);
    return `<div class="ak-card" style="text-align:center">${ic(G.levelIcon(L.level), { size: 80 })}<div style="font-size:1.3em"><b>Niveau ${L.level}: ${G.levelTitle(L.level)}</b></div><div class="ak-bar" style="margin:.6rem 0"><div style="width:${L.pct}%"></div></div><small class="mute">${meta.xp || 0} XP · nog ${L.need - L.into} tot niveau ${L.level + 1}</small></div>
      <div class="ak-card"><h3>Prijzen (${got.size}/${G.BADGES.length})</h3><div class="ak-grid" style="grid-template-columns:repeat(3,1fr)">${G.BADGES.map((b) => `<div class="gw-badge ${got.has(b.id) ? 'got' : 'gw-lock'}">${ic(b.ic, { size: 52 })}<div><b>${b.n}</b></div><small class="mute">${b.d}</small></div>`).join('')}</div></div>
      <div class="ak-card"><h3>Hoe werkt het?</h3><small class="mute">Elk vinkje geeft 10 XP, plus een bonus voor je reeks (tot +10). Bij een nieuw niveau, een mijlpaal (7, 14, 30, 60, 100 dagen) of een prijs krijg je een feestje.</small></div>`;
  }
  function vSjablonen() {
    const g = G.TEMPLATE_GROUPS.find((x) => x.id === group) || G.TEMPLATE_GROUPS[0];
    return `<div class="ak-chips" style="margin:.3rem 0">${G.TEMPLATE_GROUPS.map((x) => `<button class="ak-chip ${x.id === g.id ? 'on' : ''}" data-grp="${x.id}" style="border:0;min-height:42px">${ic(x.ic, { size: 22 })}${x.n}</button>`).join('')}</div>
      ${g.items.map((it, i) => { const has = habits.some((h) => h.name === it[0]); return `<div class="ak-card" style="padding:.6rem .8rem"><div class="row" style="margin:0">${ic(it[1], { size: 44 })}<div style="flex:1"><b>${it[0]}</b><br><small class="mute">${it[4] ? it[4] + ' · ' : ''}${G.schedText({ sched: it[3] })}</small></div>${has ? '<span class="ak-chip">✓ Heb je al</span>' : `<button class="pri ak-big" data-tpl="${g.id}|${i}">＋</button>`}</div></div>`; }).join('')}`;
  }

  function paintStatus() {
    const el = view.querySelector('[data-status]'); if (!el) return;
    el.innerHTML = saveState === 'local' ? '<small>💾 Staat veilig op dit apparaat</small>' : '';
  }
  function draw() {
    if (!alive) return;
    const body = { nu: vNu, week: vWeek, cijfers: vCijfers, prijzen: vPrijzen, sjablonen: vSjablonen }[tab]();
    const L = lvl();
    view.innerHTML = `<style>${CSS}</style><div class="ak">${head({ icon: 'flame', title: 'Gewoontes', sub: `Niveau ${L.level} · ${G.levelTitle(L.level)}`, c1: '#34d399', c2: '#0f766e' })}${tabsHtml(tab, TABS)}${body}</div>`;
    paintStatus(); bind();
  }

  function bind() {
    wireHead(view);
    const $$ = (s) => view.querySelectorAll(s);
    $$('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; form = null; draw(); });
    $$('[data-toggle]').forEach((b) => b.onclick = () => toggleDay(find(b.dataset.toggle), today()));
    $$('[data-tg]').forEach((b) => b.onclick = () => { const [id, k] = b.dataset.tg.split('|'); toggleDay(find(id), k); });
    $$('[data-del]').forEach((b) => b.onclick = () => { delId = b.dataset.del; draw(); });
    $$('[data-delno]').forEach((b) => b.onclick = () => { delId = null; draw(); });
    $$('[data-delyes]').forEach((b) => b.onclick = () => { habits = habits.filter((h) => h.id !== b.dataset.delyes); delId = null; changed(); draw(); });
    $$('[data-starter]').forEach((b) => b.onclick = () => { const [n, icn, c, s, note] = G.STARTERS[+b.dataset.starter]; habits.push(mkHabit(n, ICONS[icn] || '⭐', COLORS[c][0], { icon: icn, sched: s, note })); changed(); draw(); });
    $$('[data-grp]').forEach((b) => b.onclick = () => { group = b.dataset.grp; draw(); });
    $$('[data-tpl]').forEach((b) => b.onclick = () => { const [gid, i] = b.dataset.tpl.split('|'); const it = G.TEMPLATE_GROUPS.find((x) => x.id === gid).items[+i]; if (habits.length >= G.MAX_HABITS) return showToast('Je hebt het maximum aantal gewoontes bereikt.'); habits.push(mkHabit(it[0], ICONS[it[1]] || '⭐', COLORS[it[2]][0], { icon: it[1], sched: it[3].slice(), note: it[4] })); changed(); showToast('Toegevoegd ✓'); draw(); });
    $$('[data-new]').forEach((b) => b.onclick = () => { form = { name: '', note: '', emoji: EMOJI[0], icon: ICON_CHOICES[0], color: COLORS[0][0], sched: [] }; draw(); const i = view.querySelector('[data-fname]'); if (i) i.focus(); });
    $$('[data-edit]').forEach((b) => b.onclick = () => { const h = find(b.dataset.edit); form = { id: h.id, name: h.name, note: h.note || '', emoji: h.emoji, icon: h.icon || '', color: h.color, sched: (h.sched || []).slice() }; delId = null; draw(); });
    if (!form) return;
    const fn = view.querySelector('[data-fname]'); if (fn) fn.oninput = () => { form.name = fn.value; };
    const fo = view.querySelector('[data-fnote]'); if (fo) fo.oninput = () => { form.note = fo.value; };
    $$('[data-ficon]').forEach((b) => b.onclick = () => { form.icon = b.dataset.ficon; draw(); });
    $$('[data-femoji]').forEach((b) => b.onclick = () => { form.emoji = b.dataset.femoji; form.icon = ''; draw(); });
    $$('[data-fcolor]').forEach((b) => b.onclick = () => { form.color = b.dataset.fcolor; draw(); });
    $$('[data-fday]').forEach((b) => b.onclick = () => { const i = +b.dataset.fday; form.sched = form.sched.includes(i) ? form.sched.filter((x) => x !== i) : [...form.sched, i].sort(); draw(); });
    $$('[data-fpre]').forEach((b) => b.onclick = () => { form.sched = b.dataset.fpre ? b.dataset.fpre.split(',').map(Number) : []; draw(); });
    const fc = view.querySelector('[data-fcancel]'); if (fc) fc.onclick = () => { form = null; draw(); };
    const fs = view.querySelector('[data-fsave]');
    if (fs) fs.onclick = () => {
      const n = form.name.trim().slice(0, 40);
      if (!n) { view.querySelector('[data-ferr]').textContent = 'Geef je gewoonte een naam.'; return; }
      const emoji = form.icon && ICONS[form.icon] ? ICONS[form.icon] : form.emoji;
      const sched = form.sched.length === 7 ? [] : form.sched;
      if (form.id) Object.assign(find(form.id), { name: n, note: form.note.trim().slice(0, 60), emoji, icon: form.icon, color: form.color, sched });
      else habits.push(mkHabit(n, emoji, form.color, { icon: form.icon, sched, note: form.note.trim().slice(0, 60) }));
      form = null; changed(); draw();
    };
  }

  draw();
}
