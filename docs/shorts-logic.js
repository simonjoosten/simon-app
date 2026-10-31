// Pure logica voor de Shorts-app (geen DOM, geen netwerk-imports): categorieen, opslag, filters, volgorde, lui laden.
// Getest met tools/test-shorts.mjs.

export const CATS = [
  { id: 'satisfying', name: 'Satisfying', icon: 'candy', group: 'kijk' },
  { id: 'techniek', name: 'Techniek', icon: 'gear', group: 'leer' },
  { id: 'sport', name: 'Sport', icon: 'trophy', group: 'actie' },
  { id: 'dieren', name: 'Dieren', icon: 'dog', group: 'kijk' },
  { id: 'eten', name: 'Eten', icon: 'pizza', group: 'kijk' },
  { id: 'natuur', name: 'Natuur', icon: 'tree', group: 'kijk' },
  { id: 'weetjes', name: 'Weetjes', icon: 'book', group: 'leer' },
  { id: 'quiz', name: 'Quiz', icon: 'puzzle', group: 'leer' },
  { id: 'ruimte', name: 'Ruimte', icon: 'planet', group: 'leer' },
  { id: 'fantasie', name: 'Fantasie', icon: 'dragon', group: 'actie' },
];
export const CAT = Object.fromEntries(CATS.map((c) => [c.id, c]));
export const MAX_DATA = 20000;
export const CLOUD_EVERY = 30000;

// ---------- hulpjes
export const norm = (s) => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
export function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function shuffle(arr, rng = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---------- staat
export const ORDERS = ['nieuw', 'id', 'random'];
export const DATA_MODES = ['auto', 'zuinig', 'normaal'];
export const VOL_DEFAULT = 0.7;
export const clampVol = (x) => { const n = Number(x); return Number.isFinite(n) ? Math.round(Math.max(0, Math.min(1, n)) * 100) / 100 : VOL_DEFAULT; };
export function defaultState() { return { v: 1, fav: [], seen: {}, opt: { order: 'nieuw', mix: true, data: 'auto', sound: false, vol: VOL_DEFAULT }, last: '', u: 0 }; }

// Maakt van willekeurige (oude/kapotte) data een geldige staat; onbekende ids blijven staan (nieuwe filmpjes komen later).
export function sanitizeState(raw) {
  const s = defaultState();
  if (!raw || typeof raw !== 'object') return s;
  const idOk = (x) => typeof x === 'string' && /^[A-Za-z0-9_-]{1,24}$/.test(x);
  if (Array.isArray(raw.fav)) s.fav = [...new Set(raw.fav.filter(idOk))].slice(0, 1000);
  if (raw.seen && typeof raw.seen === 'object') {
    for (const k of Object.keys(raw.seen).slice(0, 2000)) { const n = Math.floor(Number(raw.seen[k])); if (idOk(k) && n > 0) s.seen[k] = Math.min(n, 999); }
  }
  const o = raw.opt && typeof raw.opt === 'object' ? raw.opt : {};
  if (ORDERS.includes(o.order)) s.opt.order = o.order;
  if (typeof o.mix === 'boolean') s.opt.mix = o.mix;
  if (DATA_MODES.includes(o.data)) s.opt.data = o.data;
  if (typeof o.sound === 'boolean') s.opt.sound = o.sound;
  if (o.vol != null && o.vol !== '') s.opt.vol = clampVol(o.vol);
  if (idOk(raw.last)) s.last = raw.last;
  s.u = Number(raw.u) > 0 ? Math.floor(Number(raw.u)) : 0;
  return s;
}
export function serialize(s) {
  let out = JSON.stringify(s);
  if (out.length > MAX_DATA) { // noodrem: oudste bekeken-tellers laten vallen
    const c = sanitizeState(s); const ks = Object.keys(c.seen);
    while (JSON.stringify(c).length > MAX_DATA && ks.length) delete c.seen[ks.shift()];
    out = JSON.stringify(c);
  }
  return out;
}
// Cloud + lokaal samenvoegen: de nieuwste kant wint voor favorieten/opties, bekeken = per filmpje het maximum.
export function mergeStates(a, b) {
  const A = sanitizeState(a), B = sanitizeState(b);
  const nw = B.u > A.u ? B : A;
  const out = { v: 1, fav: nw.fav.slice(), seen: {}, opt: Object.assign({}, nw.opt), last: nw.last, u: Math.max(A.u, B.u) };
  for (const k of new Set([...Object.keys(A.seen), ...Object.keys(B.seen)])) out.seen[k] = Math.max(A.seen[k] || 0, B.seen[k] || 0);
  return out;
}

// Opslag: lokaal eerst (localStorage), cloud (gamesaves/shorts-state__<uid>) gespaard (max 1x/30 s + flush bij sluiten).
// env: { ls, cloud:{getDoc,setDoc,doc,db}|null, now, setTimeout, clearTimeout }
export function createStore(uid, env = {}) {
  const ls = env.ls || (typeof localStorage !== 'undefined' ? localStorage : null);
  const now = env.now || Date.now;
  const st = env.setTimeout || setTimeout, ct = env.clearTimeout || clearTimeout;
  const cloud = env.cloud || null;
  const key = 'shorts:state:' + uid, docId = 'shorts-state__' + uid;
  let state = defaultState(), timer = null, dirty = false, lastPush = 0, busy = false, subs = new Set();
  const readLocal = () => { try { return sanitizeState(JSON.parse(ls.getItem(key))); } catch { return defaultState(); } };
  state = readLocal();
  const saveLocal = () => { try { ls.setItem(key, serialize(state)); } catch { /* geen opslag */ } };
  const touch = () => { state.u = Math.max(now(), state.u + 1); saveLocal(); dirty = true; schedule(); for (const f of [...subs]) { try { f(state); } catch { /* */ } } };
  function schedule() { if (!cloud || timer) return; const wait = Math.max(0, CLOUD_EVERY - (now() - lastPush)); timer = st(() => { timer = null; push(); }, wait); }
  async function push(force) {
    if (!cloud || !dirty || busy) return false;
    busy = true;
    try {
      const data = serialize(state);
      await cloud.setDoc(cloud.doc(cloud.db, 'gamesaves', docId), { game: 'shorts-state', uid, data, updated: state.u });
      dirty = false; lastPush = now(); return true;
    } catch { schedule(); return false; } finally { busy = false; }
  }
  return {
    key, docId,
    get state() { return state; },
    onChange(f) { subs.add(f); return () => subs.delete(f); },
    isFav: (id) => state.fav.includes(id),
    views: (id) => state.seen[id] || 0,
    toggleFav(id) { const i = state.fav.indexOf(id); if (i >= 0) state.fav.splice(i, 1); else state.fav.push(id); touch(); return i < 0; },
    setFav(id, on) { const has = state.fav.includes(id); if (on && !has) state.fav.push(id); else if (!on && has) state.fav.splice(state.fav.indexOf(id), 1); else return has; touch(); return on; },
    markSeen(id) { state.seen[id] = Math.min(999, (state.seen[id] || 0) + 1); touch(); },
    setOpt(p) { const c = sanitizeState({ opt: Object.assign({}, state.opt, p) }); state.opt = c.opt; touch(); },
    setLast(id) { if (state.last === id) return; state.last = id; state.u = Math.max(state.u, 1); saveLocal(); },
    async loadCloud() {
      if (!cloud) return false;
      try {
        const snap = await cloud.getDoc(cloud.doc(cloud.db, 'gamesaves', docId));
        if (!snap.exists()) { if (state.u > 0) { dirty = true; schedule(); } return true; }
        const d = snap.data(); let remote = null; try { remote = JSON.parse(d.data); } catch { /* */ }
        if (remote) { remote.u = Number(remote.u) || Number(d.updated) || 0; const merged = mergeStates(state, remote); const changed = JSON.stringify(merged) !== JSON.stringify(state); state = merged; saveLocal(); if (merged.u > remote.u) { dirty = true; schedule(); } if (changed) for (const f of [...subs]) { try { f(state); } catch { /* */ } } }
        return true;
      } catch { return false; }
    },
    flush: () => { if (timer) { ct(timer); timer = null; } return push(true); },
    destroy() { if (timer) { ct(timer); timer = null; } subs.clear(); },
  };
}

// ---------- filteren & zoeken
export function searchMatch(item, q) {
  const words = norm(q).split(' ').filter(Boolean);
  if (!words.length) return true;
  const hay = norm([item.t, (item.tags || []).join(' '), (CAT[item.c] || {}).name || item.c].join(' '));
  return words.every((w) => hay.includes(w));
}
// filter: 'all' | 'fav' | 'new' | categorie-id
export function filterList(all, { cat = 'all', q = '' } = {}, store) {
  const fav = new Set(store ? store.state.fav : []);
  return all.filter((it) => {
    if (cat === 'fav' && !fav.has(it.id)) return false;
    if (cat === 'new' && store && store.views(it.id) > 0) return false;
    if (CAT[cat] && it.c !== cat) return false;
    return searchMatch(it, q);
  });
}

// ---------- volgorde
const idCmp = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
export function baseOrder(list, order, views = () => 0, rng = Math.random) {
  if (order === 'random') return shuffle(list, rng);
  if (order === 'id') return list.slice().sort(idCmp);
  return list.slice().sort((a, b) => (views(a.id) - views(b.id)) || idCmp(a, b)); // nieuw eerst
}
// Mix: wissel categorieen af, liefst ook andere groep (kijk/leer/actie) dan de vorige; nooit 2x dezelfde categorie achter elkaar als het kan.
export function mixOrder(list) {
  const buckets = new Map();
  for (const it of list) { if (!buckets.has(it.c)) buckets.set(it.c, []); buckets.get(it.c).push(it); }
  const out = []; let prev = null;
  const grp = (c) => (CAT[c] ? CAT[c].group : c);
  while (out.length < list.length) {
    let best = null, bs = -Infinity;
    for (const [c, arr] of buckets) {
      if (!arr.length) continue;
      let score = arr.length * 1.0;
      if (prev) { if (c === prev) score -= 1e6; else if (grp(c) === grp(prev)) score -= 1e3; }
      if (score > bs) { bs = score; best = c; }
    }
    out.push(buckets.get(best).shift()); prev = best;
  }
  return out;
}
export function buildFeed(all, filter, store, opt = {}, rng = Math.random) {
  const o = Object.assign({ order: 'nieuw', mix: true }, (store && store.state.opt) || {}, opt);
  let list = filterList(all, filter, store);
  list = baseOrder(list, o.order, (id) => (store ? store.views(id) : 0), rng);
  if (o.mix && list.length > 2 && !CAT[filter && filter.cat]) list = mixOrder(list);
  return list;
}

// ---------- lui laden: alleen huidig +- radius heeft een video-src
export function windowRange(cur, len, radius) { const a = Math.max(0, cur - radius), b = Math.min(len - 1, cur + radius); const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }
export function createLazy({ attach, detach, radius = 1 }) {
  let active = new Set();
  return {
    get active() { return [...active].sort((a, b) => a - b); },
    setRadius(r) { radius = r; },
    move(cur, len) {
      const want = new Set(windowRange(cur, len, radius));
      for (const i of [...active]) if (!want.has(i)) { active.delete(i); detach(i); }
      for (const i of want) if (!active.has(i)) { active.add(i); attach(i); }
    },
    clear() { for (const i of [...active]) detach(i); active = new Set(); },
  };
}

// ---------- mobiele data
export function dataMode(nav, pref = 'auto') {
  if (pref === 'normaal') return { zuinig: false, reason: '' };
  if (pref === 'zuinig') return { zuinig: true, reason: 'zuinig' };
  const c = nav && (nav.connection || nav.mozConnection || nav.webkitConnection);
  if (!c) return { zuinig: false, reason: '' };
  if (c.saveData) return { zuinig: true, reason: 'databesparing' };
  if (c.type === 'cellular') return { zuinig: true, reason: 'mobiel' };
  if (/^(slow-2g|2g|3g)$/.test(c.effectiveType || '')) return { zuinig: true, reason: 'traag' };
  return { zuinig: false, reason: '' };
}
export const fmtMB = (kb) => (kb >= 1024 ? (kb / 1024).toFixed(1).replace('.', ',') + ' MB' : Math.round(kb) + ' KB');

// ---------- geluid (m4a per filmpje, synchroon met de stille <video>)
export const DRIFT_MAX = 0.15; // seconden verschil tussen audio en video voordat we bijsturen
export const audioUrl = (base, it) => (it && it.a === 1 ? base + it.id + '.m4a' : '');

// Eén Audio-element dat voor het huidige filmpje van src wisselt (iOS ontgrendelt het bij de eerste tik op de geluid-knop).
// env: { createAudio:()=>Audio-achtig, base:'shorts/', onBlocked:()=>void, onLoad:(it)=>void }
// Audio-achtig: play()->Promise|undefined, pause(), load(), currentTime, duration, paused, ended, volume, preload, src, removeAttribute(), addEventListener(), removeEventListener().
// Zonder m4a, bij laadfout of bij geblokkeerd afspelen blijft het stil, zonder fout.
export function createAudioSync(env = {}) {
  const make = env.createAudio || (() => new Audio());
  const base = env.base || '';
  let audio = null, video = null, item = null, url = '', enabled = false, vol = VOL_DEFAULT, zuinig = false, hidden = false, failed = false, srcSet = '';
  const unbind = [];
  const guard = (f) => { try { return f(); } catch { return undefined; } };
  function ensure() {
    if (audio) return audio;
    audio = guard(make);
    if (!audio) return null;
    guard(() => { audio.loop = false; audio.volume = vol; audio.preload = 'none'; });
    const on = (n, f) => { guard(() => audio.addEventListener(n, f)); unbind.push(() => guard(() => audio.removeEventListener(n, f))); };
    on('error', () => { failed = true; });
    on('ended', () => { sync(); });
    return audio;
  }
  function applySrc() {
    if (!audio) return;
    const want = enabled && url ? url : '';
    if (want === srcSet) return;
    guard(() => audio.pause());
    srcSet = want; failed = false;
    if (want) {
      guard(() => { audio.preload = zuinig ? 'none' : 'auto'; audio.src = want; });
      if (!zuinig) guard(() => audio.load()); // zuinig: pas laden zodra er echt gespeeld wordt
      if (env.onLoad) guard(() => env.onLoad(item));
    } else {
      guard(() => { audio.removeAttribute('src'); audio.load(); });
    }
  }
  const wants = () => !!(enabled && !hidden && video && url && !failed && !video.paused);
  function play() {
    let p; try { p = audio.play(); } catch { p = null; }
    if (p && typeof p.catch === 'function') p.catch((e) => { if (e && e.name === 'NotAllowedError' && env.onBlocked) guard(env.onBlocked); });
  }
  function sync(force) { try { syncNow(force); } catch { /* stil blijven, nooit een fout naar de app */ } }
  function syncNow(force) {
    if (!audio) return;
    if (!wants()) { if (!audio.paused) guard(() => audio.pause()); return; }
    if (enabled && url && srcSet !== url) applySrc();
    const vt = Number(video.currentTime) || 0;
    const dur = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : Infinity;
    const target = Math.max(0, Math.min(vt, dur - 0.03));
    if (audio.paused || audio.ended) {
      if (vt >= dur - 0.03) return; // einde van het geluid: wacht tot de video weer begint
      guard(() => { audio.currentTime = target; });
      play();
      return;
    }
    if (force || Math.abs((Number(audio.currentTime) || 0) - target) > DRIFT_MAX) guard(() => { audio.currentTime = target; });
  }
  const vEvents = ['play', 'playing', 'pause', 'seeking', 'seeked', 'waiting', 'stalled', 'timeupdate', 'emptied'];
  const vUnbind = [];
  function bindVideo() {
    vUnbind.splice(0).forEach((f) => f());
    if (!video || !video.addEventListener) return;
    const v = video;
    for (const n of vEvents) {
      const f = () => { if (n === 'seeking' || n === 'seeked') sync(true); else if (n === 'waiting' || n === 'stalled') { if (audio && !audio.paused) guard(() => audio.pause()); } else sync(); };
      v.addEventListener(n, f); vUnbind.push(() => guard(() => v.removeEventListener(n, f)));
    }
  }
  return {
    get audio() { return audio; },
    get enabled() { return enabled; },
    get failed() { return failed; },
    get url() { return url; },
    has: (it) => !!(it && it.a === 1),
    // Moet in een tik-handler aangeroepen worden bij het aanzetten (ontgrendelt audio op iOS).
    setEnabled(on) {
      enabled = !!on;
      if (enabled) ensure();
      applySrc(); sync(true);
      if (!enabled && audio) guard(() => audio.pause());
    },
    setVolume(v) { vol = clampVol(v); if (audio) guard(() => { audio.volume = vol; }); },
    setZuinig(z) { zuinig = !!z; if (audio && srcSet) guard(() => { audio.preload = zuinig ? 'none' : 'auto'; }); },
    setHidden(h) { hidden = !!h; sync(); },
    setTarget(it, vid) {
      item = it || null; video = vid || null;
      url = video && it ? audioUrl(base, it) : '';
      bindVideo();
      if (enabled) ensure();
      applySrc(); sync(true);
    },
    sync, tick() { if (audio && enabled) sync(); },
    destroy() {
      vUnbind.splice(0).forEach((f) => f());
      unbind.splice(0).forEach((f) => f());
      if (audio) { guard(() => audio.pause()); guard(() => audio.removeAttribute('src')); guard(() => audio.load()); }
      audio = null; video = null; item = null; url = ''; srcSet = ''; enabled = false;
    },
  };
}
