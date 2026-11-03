// huisdier-r4-extra.js - 4 nieuwe onderdelen voor het Extra-tabblad van het Huisdier: Album, Trucjes, Salon en Feestkalender.
// Zelfde contract als huisdier-extra.js: R4_EXTRAS[i].create(host, api) -> { destroy() }. De api komt van modApi() in huisdier.js plus api.r4:
//   r4 = { get(k), set(k, int), add(k, n), spend(n) -> bool, earn(n), level(), born, evOn(date), refresh() }  (alle tellers staan in S.st)
import {
  ALBUM, ALBUM_SETS, ALBUM_N, albumHas, albumAdd, albumCount, albumSetCount, setComplete, setClaimed, drawStickers, PACK_COST, SET_BONUS, PACKS_MAX, dayInt,
  TRICKS, TRICK_STEPS, trickKey, trickStars, trickCount, trickLen, tricksKnown, trickTotalStars, SHOW_PER_DAY, showReward,
  R4_TINTS, tintOwned, upcomingEvents,
} from './huisdier-r4-data.js?v=1';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ico = (api, name, size) => {
  const src = api.gfx && api.gfx.iconSrc ? api.gfx.iconSrc(name) : null;
  if (src) return `<img src="${esc(src)}" width="${size}" height="${size}" alt="" draggable="false" style="width:${size}px;height:${size}px;object-fit:contain;vertical-align:middle">`;
  const e = api.gfx && api.gfx.emoji ? api.gfx.emoji(name) : '⭐';
  return `<span style="font-size:${Math.round(size * 0.8)}px;line-height:${size}px;display:inline-block;width:${size}px;text-align:center">${e}</span>`;
};
const BTN = 'min-height:44px;min-width:44px;padding:8px 14px;border-radius:14px;border:0;font-weight:700;font-size:15px;cursor:pointer;background:#c4b5fd;color:#2e1065';
const BTN2 = BTN.replace('#c4b5fd', '#f1f5f9').replace('#2e1065', '#334155');
const CARD = 'background:rgba(255,255,255,.7);border-radius:16px;padding:10px;margin:8px 0';

// Gemeenschappelijke basis: host met scrollbare inhoud, klikken via data-act, opruimen van timers
function base(host, api, bg, render) {
  host.style.overflowY = 'auto'; host.style.background = bg; host.style.padding = '10px'; host.style.boxSizing = 'border-box'; host.style.color = '#3b2a47';
  host.style.touchAction = 'pan-y'; host.style.webkitOverflowScrolling = 'touch';
  const timers = new Set(); let dead = false;
  const self = {
    api, get dead() { return dead; }, render,
    after(fn, ms) { const id = setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms); timers.add(id); return id; },
    paint() { if (!dead) host.innerHTML = render(self); },
  };
  const onClick = (e) => {
    let t = e.target; while (t && t !== host && !(t.dataset && t.dataset.act)) t = t.parentNode;
    if (!t || t === host || !t.dataset || !t.dataset.act || dead) return;
    try { self.act && self.act(t.dataset.act, t.dataset.v, t); } catch (err) { console.error(err); }
  };
  host.addEventListener('click', onClick);
  self.destroy = () => { if (dead) return; dead = true; timers.forEach((id) => clearTimeout(id)); timers.clear(); host.removeEventListener('click', onClick); host.innerHTML = ''; };
  return self;
}
const R = (api) => api.r4;
const petBox = (api, size, cls, mood) => `<div id="r4pet" style="text-align:center;height:${size + 10}px"><span class="${cls || ''}" style="display:inline-block;transform-origin:50% 90%">${api.pet && api.pet.html ? api.pet.html(size, mood || 'blij') : '🐾'}</span></div>`;

/* ===================================================================== ALBUM */
function createAlbum(host, api) {
  let opened = null, msg = '', open = -1;
  const st = () => ({ albaa: R(api).get('albaa'), albab: R(api).get('albab'), albclm: R(api).get('albclm') });
  const today = () => dayInt(new Date());
  const freeLeft = () => R(api).get('albday') !== today();
  const packs = () => Math.min(PACKS_MAX, R(api).get('packs'));
  function openPack(kind) {
    const s = st();
    if (kind === 'free') { if (!freeLeft()) return; R(api).set('albday', today()); }
    else if (kind === 'earned') { if (packs() < 1) return; R(api).set('packs', packs() - 1); }
    else { if (!R(api).spend(PACK_COST)) { msg = `Je hebt ${PACK_COST} 🪙 nodig.`; return self.paint(); } }
    const got = drawStickers(3, s), res = [];
    let coins = 0;
    for (const i of got) { const isNew = albumAdd(s, i); res.push({ i, isNew }); if (!isNew) coins += 2; }
    for (const k of ['albaa', 'albab']) R(api).set(k, s[k]);
    if (coins) R(api).earn(coins);
    R(api).add('packsop', 1);
    // setbonus
    let bonus = 0;
    ALBUM_SETS.forEach((set, si) => { if (setComplete(s, si) && !setClaimed(s, si)) { s.albclm = ((s.albclm | 0) | (1 << si)); bonus += SET_BONUS; api.toast(`🎉 Set "${set.n}" is vol! +${SET_BONUS} 🪙`); } });
    if (bonus) { R(api).set('albclm', s.albclm); R(api).earn(bonus); }
    opened = { res, coins, bonus }; msg = '';
    api.sound && api.sound(res.some((r) => r.isNew) ? 'prestatie' : 'tik');
    R(api).refresh(); self.paint();
  }
  const render = () => {
    const s = st(), n = albumCount(s);
    const head = `<div style="${CARD}text-align:center"><b>📒 Plakboek</b> <small>${n} van ${ALBUM_N} plaatjes</small>
      <div style="height:8px;border-radius:4px;background:#e2e8f0;margin:6px 0;overflow:hidden"><i style="display:block;height:100%;width:${Math.round((n / ALBUM_N) * 100)}%;background:#a78bfa"></i></div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
      <button data-act="pack" data-v="free" style="${BTN}${freeLeft() ? '' : ';opacity:.45'}">🎁 Dagpakje</button>
      <button data-act="pack" data-v="earned" style="${BTN}${packs() ? '' : ';opacity:.45'}">🎮 Spelpakje (${packs()})</button>
      <button data-act="pack" data-v="buy" style="${BTN2}">🪙 ${PACK_COST}: pakje</button></div>
      <small>${freeLeft() ? 'Je dagelijkse pakje wacht op je!' : 'Morgen is er weer een gratis pakje.'} Met een spelletje (60+ punten) win je ook een pakje. Dubbele plaatjes geven 2 🪙.</small>
      ${msg ? `<div style="color:#b91c1c;font-weight:700">${esc(msg)}</div>` : ''}</div>`;
    const op = opened ? `<div style="${CARD}text-align:center;background:#fef9c3"><b>Dit zat erin!</b><div style="display:flex;gap:8px;justify-content:center;margin-top:6px">${opened.res.map((r) => `<div style="width:30%"><div style="background:#fff;border-radius:14px;padding:6px">${ico(api, ALBUM[r.i].ic, 56)}</div><small>${esc(ALBUM[r.i].n)}<br>${r.isNew ? '<b style="color:#16a34a">Nieuw!</b>' : 'dubbel +2 🪙'}</small></div>`).join('')}</div>${opened.bonus ? `<div>Setbonus: +${opened.bonus} 🪙</div>` : ''}</div>` : '';
    const sets = ALBUM_SETS.map((set, si) => {
      const c = albumSetCount(s, si);
      return `<div style="${CARD}"><div style="display:flex;align-items:center;gap:8px">${ico(api, set.ic, 30)}<b>${esc(set.n)}</b><small style="margin-left:auto">${c}/8 ${c === 8 ? '✅' : ''}</small></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:6px">${set.items.map(([ic, name], i) => {
    const have = albumHas(s, si * 8 + i), rare = i >= 6;
    return `<div data-act="sticker" data-v="${si * 8 + i}" style="text-align:center;min-height:56px;border-radius:12px;padding:4px;background:${have ? (rare ? '#fde68a' : '#fff') : '#e2e8f0'};cursor:pointer">${have ? ico(api, ic, 40) : '<span style="font-size:30px;opacity:.35">❓</span>'}<div style="font-size:11px;line-height:1.1">${have ? esc(name) : '???'}</div></div>`;
  }).join('')}</div></div>`;
    }).join('');
    const info = open >= 0 ? `<div style="${CARD}background:#ede9fe;text-align:center">${albumHas(st(), open) ? `${ico(api, ALBUM[open].ic, 48)}<br><b>${esc(ALBUM[open].n)}</b> <small>(${esc(ALBUM_SETS[Math.floor(open / 8)].n)}${ALBUM[open].rare ? ', zeldzaam' : ''})</small>` : '<small>Dit plaatje heb je nog niet. Open een pakje!</small>'}</div>` : '';
    return head + op + info + sets;
  };
  const self = base(host, api, 'linear-gradient(180deg,#ede9fe,#fce7f3)', render);
  self.act = (a, v) => { if (a === 'pack') openPack(v); else if (a === 'sticker') { open = Number(v); self.paint(); } };
  self.paint();
  return { destroy: self.destroy };
}

/* ===================================================================== TRUCJES */
const ARROWS = [['⬅️', 'Links'], ['⬆️', 'Omhoog'], ['⬇️', 'Omlaag'], ['➡️', 'Rechts']];
function createTricks(host, api) {
  let prac = null, anim = '', note = '', show = false;
  const today = () => dayInt(new Date());
  const stAll = () => { const o = {}; for (const t of TRICKS) o[trickKey(t.id)] = R(api).get(trickKey(t.id)); return o; };
  const showsLeft = () => (R(api).get('shwday') === today() ? Math.max(0, SHOW_PER_DAY - R(api).get('shwn')) : SHOW_PER_DAY);
  const playAnim = (id) => { anim = 'r4-do-' + id; self.paint(); self.after(() => { anim = ''; self.paint(); }, 2400); };
  function startPractice(id) {
    const t = TRICKS.find((x) => x.id === id); if (!t || R(api).level() < t.lv) return;
    const len = trickLen(stAll(), id), seq = Array.from({ length: len }, () => Math.floor(Math.random() * 4));
    prac = { id, seq, pos: 0, phase: 'show', lit: -1 };
    self.paint();
    seq.forEach((v, j) => { self.after(() => { if (!prac) return; prac.lit = v; self.paint(); }, 600 + j * 700); self.after(() => { if (!prac) return; prac.lit = -1; self.paint(); }, 600 + j * 700 + 450); });
    self.after(() => { if (prac) { prac.phase = 'input'; self.paint(); } }, 700 + len * 700);
  }
  function tap(v) {
    if (!prac || prac.phase !== 'input') return;
    if (prac.seq[prac.pos] !== v) { note = 'Oei, mis! Probeer het nog eens.'; api.sound && api.sound('tap'); prac = null; return self.paint(); }
    prac.pos++;
    if (prac.pos >= prac.seq.length) {
      const id = prac.id, before = trickStars(stAll(), id); prac = null;
      R(api).add(trickKey(id), 1);
      const after = trickStars(stAll(), id), t = TRICKS.find((x) => x.id === id);
      const day = today(), earned = R(api).get('trday') === day ? R(api).get('trn') : 0;
      let extra = '';
      if (earned < 5) { R(api).set('trday', day); R(api).set('trn', earned + 1); R(api).earn(2); extra = ' +2 🪙'; }
      api.award && api.award({ xp: 4, happy: 4, bond: 1 });
      note = after > before ? `🌟 ${t.n}: nu ${'★'.repeat(after)}!${extra}` : `Gelukt!${extra}`;
      api.sound && api.sound(after > before ? 'prestatie' : 'munt');
      R(api).refresh(); playAnim(id); return;
    }
    self.paint();
  }
  function perform() {
    const known = TRICKS.filter((t) => trickStars(stAll(), t.id) >= 1);
    if (!known.length || show) return;
    if (showsLeft() < 1) { note = 'Morgen kun je weer optreden!'; return self.paint(); }
    show = true; const day = today(), n = R(api).get('shwday') === day ? R(api).get('shwn') : 0;
    R(api).set('shwday', day); R(api).set('shwn', n + 1); R(api).add('shown', 1);
    const stars = trickTotalStars(stAll()), coins = showReward(stars);
    known.forEach((t, j) => self.after(() => { anim = 'r4-do-' + t.id; note = `${t.e} ${t.n}!`; self.paint(); }, j * 1300));
    self.after(() => { show = false; anim = ''; if (coins) R(api).earn(coins); api.award && api.award({ xp: 10, happy: 10, bond: 2 }); note = `👏 Wat een show! +${coins} 🪙`; api.sound && api.sound('prestatie'); R(api).refresh(); self.paint(); }, known.length * 1300 + 400);
    self.paint();
  }
  const render = () => {
    const s = stAll(), lv = R(api).level();
    const pet = petBox(api, 120, anim, anim ? 'blijblij' : 'blij');
    const list = TRICKS.map((t) => {
      const st = trickStars(s, t.id), locked = lv < t.lv, cnt = trickCount(s, t.id), nextN = TRICK_STEPS.find((x) => cnt < x);
      return `<div style="${CARD}display:flex;align-items:center;gap:10px;${locked ? 'opacity:.55' : ''}"><span style="font-size:30px">${t.e}</span><div style="flex:1"><b>${esc(t.n)}</b> <span style="color:#f59e0b">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span><br><small>${locked ? `🔒 vanaf niveau ${t.lv}` : esc(t.d) + (nextN ? ` (${cnt}/${nextN})` : ' Meester!')}</small></div>
        ${locked ? '' : `<div style="display:flex;flex-direction:column;gap:4px"><button data-act="train" data-v="${t.id}" style="${BTN}">Oefen</button>${st ? `<button data-act="do" data-v="${t.id}" style="${BTN2}">Laat zien</button>` : ''}</div>`}</div>`;
    }).join('');
    let pracBox = '';
    if (prac) {
      pracBox = `<div style="${CARD}text-align:center;background:#fef9c3"><b>${prac.phase === 'show' ? 'Kijk goed…' : `Jouw beurt! ${prac.pos}/${prac.seq.length}`}</b><div style="display:flex;gap:8px;justify-content:center;margin-top:8px">${ARROWS.map(([a, n], i) => `<button data-act="arrow" data-v="${i}" aria-label="${n}" style="${BTN};font-size:28px;min-width:64px;min-height:64px;background:${prac.lit === i ? '#facc15' : '#c4b5fd'}">${a}</button>`).join('')}</div></div>`;
    }
    return `${pet}<div style="text-align:center;min-height:24px;font-weight:700">${esc(note)}</div>
      <div style="${CARD}text-align:center"><b>🎓 Trucjes</b> <small>${tricksKnown(s)}/${TRICKS.length} geleerd · ${trickTotalStars(s)}/${TRICKS.length * 3} sterren</small><br>
      <button data-act="show" style="${BTN}${tricksKnown(s) && showsLeft() ? '' : ';opacity:.45'}">🎭 Optreden (${showsLeft()} vandaag)</button></div>${pracBox}${list}`;
  };
  const self = base(host, api, 'linear-gradient(180deg,#e0f2fe,#fef9c3)', render);
  self.act = (a, v) => { if (a === 'train') { note = ''; startPractice(v); } else if (a === 'arrow') tap(Number(v)); else if (a === 'do') { note = ''; playAnim(v); api.award && api.award({ happy: 3, bond: 1 }); api.sound && api.sound('tik'); } else if (a === 'show') perform(); };
  self.paint();
  return { destroy: self.destroy };
}

/* ===================================================================== SALON */
function createSalon(host, api) {
  let note = '', prev = -1;
  const sx = () => ({ tint: R(api).get('tint'), tints: R(api).get('tints') });
  const render = () => {
    const s = sx(), lv = R(api).level(), cur = s.tint - 1, shown = prev >= 0 ? prev : cur;
    const cls = shown >= 0 ? `r4-t-${R4_TINTS[shown].id}` : '';
    return `${petBox(api, 130, cls, 'blijblij')}<div style="text-align:center;min-height:22px;font-weight:700">${esc(note)}</div>
      <div style="${CARD}text-align:center"><b>🎨 Kleurensalon</b><br><small>Een speciale kleurlaag voor alle dieren, ook met kleren aan. Tik op een kleur om te passen.</small></div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
      <div data-act="look" data-v="-1" style="${CARD}margin:0;text-align:center;cursor:pointer;${cur < 0 ? 'outline:3px solid #8b5cf6' : ''}"><div style="font-size:28px">🐾</div><b>Gewoon</b><br><button data-act="wear" data-v="-1" style="${BTN2}">${cur < 0 ? '✓ Gekozen' : 'Kies'}</button></div>
      ${R4_TINTS.map((t, i) => {
    const own = tintOwned(s, i), lock = lv < t.lv;
    return `<div data-act="look" data-v="${i}" style="${CARD}margin:0;text-align:center;cursor:pointer;${cur === i ? 'outline:3px solid #8b5cf6' : ''}${lock && !own ? ';opacity:.55' : ''}"><div style="font-size:28px">${t.e}</div><b>${esc(t.n)}</b><br>${own ? `<button data-act="wear" data-v="${i}" style="${BTN2}">${cur === i ? '✓ Gekozen' : 'Kies'}</button>` : lock ? `<small>🔒 niveau ${t.lv}</small>` : `<button data-act="buy" data-v="${i}" style="${BTN}">🪙 ${t.p}</button>`}</div>`;
  }).join('')}</div>`;
  };
  const self = base(host, api, 'linear-gradient(180deg,#fce7f3,#dbeafe)', render);
  self.act = (a, v) => {
    const i = Number(v), t = R4_TINTS[i];
    if (a === 'look') { prev = i; self.paint(); }
    else if (a === 'wear') { if (i >= 0 && !tintOwned(sx(), i)) return; R(api).set('tint', i + 1); prev = -1; note = i < 0 ? 'Weer gewoon!' : `${t.e} ${t.n}!`; api.sound && api.sound('tik'); R(api).refresh(); self.paint(); }
    else if (a === 'buy') {
      if (!t || tintOwned(sx(), i) || R(api).level() < t.lv) return;
      if (!R(api).spend(t.p)) { note = `Je hebt ${t.p} 🪙 nodig.`; return self.paint(); }
      R(api).set('tints', (R(api).get('tints') | 0) | (1 << i)); R(api).set('tint', i + 1); prev = -1; note = `${t.e} ${t.n} is van jou!`; api.sound && api.sound('prestatie'); R(api).refresh(); self.paint();
    }
  };
  self.paint();
  return { destroy: self.destroy };
}

/* ===================================================================== FEESTKALENDER */
function createCalendar(host, api) {
  R(api).set('calvis', 1);
  const render = () => {
    const now = new Date(), today = R(api).evOn(now), up = upcomingEvents(now, R(api).evOn, 10);
    const born = R(api).born ? new Date(R(api).born) : null;
    let bday = '';
    if (born) { let nx = new Date(now.getFullYear(), born.getMonth(), born.getDate(), 12); if (nx < new Date(now.getFullYear(), now.getMonth(), now.getDate())) nx = new Date(now.getFullYear() + 1, born.getMonth(), born.getDate(), 12); const dd = Math.round((nx - new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)) / 86400000); bday = `<div style="${CARD}display:flex;gap:10px;align-items:center">${ico(api, 'cake', 40)}<div><b>Verjaardag van je huisdier</b><br><small>${dd === 0 ? 'Vandaag! 🎉' : `over ${dd} dag${dd === 1 ? '' : 'en'}`}</small></div></div>`; }
    return `<div style="${CARD}text-align:center"><b>📅 Feestkalender</b><br><small>${today.length ? 'Vandaag: ' + today.map((e) => esc(e.n)).join(', ') + '. Haal je feestbonus op bij Thuis!' : 'Vandaag is een gewone dag. Hieronder zie je wat eraan komt.'}</small></div>${bday}
      ${up.map((e) => `<div style="${CARD}display:flex;gap:10px;align-items:center">${ico(api, e.ic, 40)}<div style="flex:1"><b>${esc(e.n)}</b><br><small>${e.days === 0 ? 'Vandaag!' : e.days === 1 ? 'Morgen' : `over ${e.days} dagen`} · ${e.date.getDate()}-${e.date.getMonth() + 1}</small></div><span style="font-weight:700">+${e.bonus} 🪙</span></div>`).join('')}`;
  };
  const self = base(host, api, 'linear-gradient(180deg,#dcfce7,#fef9c3)', render);
  self.paint();
  return { destroy: self.destroy };
}

export const R4_EXTRAS = [
  { id: 'album', name: 'Plakboek', emoji: '📒', desc: 'Verzamel 56 plaatjes in 7 sets. Elke dag een gratis pakje!', create: createAlbum },
  { id: 'trucjes', name: 'Trucjes', emoji: '🎓', desc: 'Leer je huisdier 10 trucjes en geef een optreden.', create: createTricks },
  { id: 'salon', name: 'Kleurensalon', emoji: '🎨', desc: 'Geef je huisdier een speciale kleur: goud, regenboog, neon…', create: createSalon },
  { id: 'kalender', name: 'Feestkalender', emoji: '📅', desc: 'Welke feestdag komt eraan? Met bonusmunten.', create: createCalendar },
];
