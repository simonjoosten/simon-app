// Grafische instellingen: kwaliteit, schaal, geluid, kleurenblind, thema, accent. Local-first (localStorage `gfx:settings`) + optioneel cloud.
// Contract: docs/gfx/SPEC.md. Geen ctx.filter: het kleurenblind-filter is één verborgen SVG (feColorMatrix) met CSS `filter:url(#id)` op <html>.

const KEY = 'gfx:settings';
const QUALS = ['normaal', 'hoog', 'ultra'];
const CBS = ['uit', 'deutan', 'protan', 'tritan'];
const THEMES = ['auto', 'licht', 'donker'];
const FS_URL = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const g = globalThis;

// Gangbare matrices (Machado e.a.), 4x5 voor feColorMatrix.
export const CB_MATRIX = {
  deutan: '0.367 0.861 -0.228 0 0  0.280 0.673 0.047 0 0  -0.012 0.043 0.969 0 0  0 0 0 1 0',
  protan: '0.152 1.053 -0.205 0 0  0.115 0.786 0.099 0 0  -0.004 -0.048 1.052 0 0  0 0 0 1 0',
  tritan: '1.256 -0.077 -0.179 0 0  -0.078 0.931 0.148 0 0  0.005 0.691 0.304 0 0  0 0 0 1 0',
};

function autoQuality() {
  try {
    const n = g.navigator || {};
    const cores = n.hardwareConcurrency || 4, mem = n.deviceMemory || 4, dpr = g.devicePixelRatio || 1;
    if (cores <= 2 || mem <= 2) return 'normaal';
    if (cores >= 8 && mem >= 8 && dpr <= 2.5) return 'ultra';
    if (cores >= 4 && mem >= 4) return 'hoog';
    return 'normaal';
  } catch { return 'normaal'; }
}

const defaults = () => ({
  quality: autoQuality(), uiScale: 1, fontScale: 1, sound: true, music: true, reduceMotion: false,
  colorblind: 'uit', theme: 'auto', accent: '#6366f1',
});

function sanitize(o, base) {
  const r = Object.assign({}, base);
  if (!o || typeof o !== 'object') return r;
  if (QUALS.includes(o.quality)) r.quality = o.quality;
  if (isFinite(o.uiScale)) r.uiScale = clamp(+o.uiScale, 0.9, 1.5);
  if (isFinite(o.fontScale)) r.fontScale = clamp(+o.fontScale, 0.85, 1.6);
  for (const k of ['sound', 'music', 'reduceMotion']) if (typeof o[k] === 'boolean') r[k] = o[k];
  if (CBS.includes(o.colorblind)) r.colorblind = o.colorblind;
  if (THEMES.includes(o.theme)) r.theme = o.theme;
  if (typeof o.accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(o.accent)) r.accent = o.accent;
  return r;
}

function read() {
  try { return JSON.parse(g.localStorage.getItem(KEY) || 'null'); } catch { return null; }
}

let state = sanitize(read(), defaults());
let userSetQuality = !!(read() && QUALS.includes(read().quality));
const subs = new Set();
let cloud = null, cloudTimer = null, updated = 0;

// Live bijgewerkt object voor canvas-code.
export const GFX = {
  q: 1, reduce: false, dpr: 1,
  // aantal deeltjes geschaald naar kwaliteit (normaal 0.5x, hoog 1x, ultra 1.6x); bij reduce bijna niets
  particles(n) { const f = this.reduce ? 0.2 : [0.5, 1, 1.6][this.q]; return Math.max(0, Math.round(n * f)); },
};

function syncGFX() {
  GFX.q = Math.max(0, QUALS.indexOf(state.quality));
  let sysReduce = false;
  try { sysReduce = !!(g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch { /* stil */ }
  GFX.reduce = !!state.reduceMotion || (sysReduce && !userSetReduce);
  const d = g.devicePixelRatio || 1;
  GFX.dpr = Math.max(1, Math.min(d, [1, 1.5, 2][GFX.q]));
}
let userSetReduce = !!(read() && typeof read().reduceMotion === 'boolean');

function ensureFilter(doc, mode) {
  let el = doc.getElementById('gfx-cb-svg');
  if (mode === 'uit') { if (el && el.remove) el.remove(); return; }
  if (!el) {
    const host = doc.createElement('div');
    host.id = 'gfx-cb-svg';
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    host.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"><filter id="gfx-cb-filter" color-interpolation-filters="sRGB"><feColorMatrix id="gfx-cb-matrix" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/></filter></svg>';
    (doc.body || doc.documentElement).appendChild(host);
    el = host;
  }
  const m = el.querySelector && el.querySelector('#gfx-cb-matrix');
  if (m) m.setAttribute('values', CB_MATRIX[mode]);
}

function ensureStyle(doc, mode) {
  let st = doc.getElementById('gfx-cb-style');
  if (mode === 'uit') { if (st && st.remove) st.remove(); return; }
  if (!st) { st = doc.createElement('style'); st.id = 'gfx-cb-style'; (doc.head || doc.documentElement).appendChild(st); }
  st.textContent = 'html{filter:url(#gfx-cb-filter)}';
}

function apply() {
  syncGFX();
  const doc = g.document;
  if (!doc || !doc.documentElement) return;
  const el = doc.documentElement, s = state;
  el.setAttribute('data-gfx-q', String(GFX.q));
  el.setAttribute('data-reduce', GFX.reduce ? '1' : '0');
  el.setAttribute('data-cb', s.colorblind);
  el.setAttribute('data-gfx-theme', s.theme);
  if (s.theme === 'auto') el.removeAttribute('data-theme'); else el.setAttribute('data-theme', s.theme === 'licht' ? 'light' : 'dark');
  const st = el.style;
  st.setProperty('--gfx-scale', String(s.uiScale));
  st.setProperty('--gfx-font', String(s.fontScale));
  st.setProperty('--gfx-accent', s.accent);
  try { ensureFilter(doc, s.colorblind); ensureStyle(doc, s.colorblind); } catch { /* stil */ }
}

function save() {
  updated = Date.now();
  try { g.localStorage.setItem(KEY, JSON.stringify(Object.assign({}, state, { _u: updated }))); } catch { /* stil */ }
  if (cloud) {
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(pushCloud, 2500);
  }
}

async function pushCloud() {
  if (!cloud) return;
  try {
    const fs = await import(FS_URL);
    await fs.setDoc(fs.doc(cloud.db, 'gamesaves', 'gfx-settings__' + cloud.uid),
      { game: 'gfx-settings', uid: cloud.uid, data: JSON.stringify(state), updated });
  } catch { /* stil: best effort */ }
}

function emit() { for (const f of [...subs]) { try { f(Settings.get()); } catch { /* stil */ } } }

export const Settings = {
  get() { return Object.assign({}, state); },
  set(partial) {
    if (!partial || typeof partial !== 'object') return Settings.get();
    if ('quality' in partial) userSetQuality = true;
    if ('reduceMotion' in partial) userSetReduce = true;
    state = sanitize(partial, state);
    save(); apply(); emit();
    return Settings.get();
  },
  // terug naar standaard (kwaliteit weer automatisch)
  reset() {
    userSetQuality = false; userSetReduce = false;
    state = defaults();
    try { g.localStorage.removeItem(KEY); } catch { /* stil */ }
    apply(); emit(); if (cloud) { updated = Date.now(); clearTimeout(cloudTimer); cloudTimer = setTimeout(pushCloud, 2500); }
    return Settings.get();
  },
  onChange(fn) { subs.add(fn); return () => subs.delete(fn); },
  apply,
  // Firestore gamesaves/gfx-settings__<uid>, exact {game,uid,data,updated}. Nieuwste wint. Best effort.
  async bindCloud(db, uid) {
    if (!db || !uid) return false;
    cloud = { db, uid };
    try {
      const fs = await import(FS_URL);
      const snap = await fs.getDoc(fs.doc(db, 'gamesaves', 'gfx-settings__' + uid));
      if (snap.exists()) {
        const d = snap.data();
        const loc = read();
        if (d && typeof d.data === 'string' && (d.updated || 0) > ((loc && loc._u) || 0)) {
          let o = null; try { o = JSON.parse(d.data); } catch { /* stil */ }
          if (o) {
            state = sanitize(o, state); userSetQuality = true;
            updated = d.updated || Date.now();
            try { g.localStorage.setItem(KEY, JSON.stringify(Object.assign({}, state, { _u: updated }))); } catch { /* stil */ }
            apply(); emit();
          }
        } else if (loc) { updated = loc._u || Date.now(); pushCloud(); }
      } else if (read()) pushCloud();
      return true;
    } catch { return false; }
  },
};

apply();
try {
  if (g.matchMedia) {
    const mq = g.matchMedia('(prefers-reduced-motion: reduce)');
    const h = () => { apply(); emit(); };
    if (mq.addEventListener) mq.addEventListener('change', h);
  }
} catch { /* stil */ }
