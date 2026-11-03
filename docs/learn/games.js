// Learn Spel – de hub: home, spel-launcher, resultaat/beloning, winkel, dagopdrachten, prestaties, uitdagingen, ranglijst.
// Spellen staan in ./games/<id>.js (lui geladen). Zie docs/learn/SPEC.md §5 en §7.
// Hulpbestanden: games-shop.js (winkel, uiterlijk, prestaties, beloning, stijlen), games-duel.js (uitdagingen).
import { Profile, Prog, Snd, TTS, Kits, allKits, getKit, pick, rng, qkey, bindCtx, fmt, esc } from './core.js?v=1';
import './r4-worlds.js?v=1';   // extra werelden: moet vóór games-shop (die maakt er winkelitems van)
import * as Shop from './games-shop.js?v=2';
import * as Duel from './games-duel.js?v=2';
import * as KM from './games-kitmaker.js?v=2';
import { GFX, Settings } from '../gfx/settings.js?v=1';
import { openSettingsPanel } from '../gfx/panel.js?v=1';
import { Themes, WORLDS } from '../gfx/themes.js?v=1';
import { Scenes } from '../gfx/scenes.js?v=1';
import * as Core from './core.js?v=1';
import * as R4 from './r4-hub.js?v=1';
import { isR4, r4Kit, mergeR4 as mergeR4Kits } from './r4-packs.js?v=1';
const { ic, emo } = Shop;

export const GAME_IDS = ['klassiek', 'toren', 'baas', 'race', 'vissen', 'vlag', 'pizza', 'monster', 'regen', 'memory', 'ruimte', 'bom', 'slang', 'boerderij', 'vlieg', 'schat', 'escape', 'miljonair', 'r4-ladder', 'r4-kluis', 'r4-drank', 'r4-lava', 'r4-duik', 'r4-rad'];
// reservemeta zodat de kaarten meteen getoond worden; het spelbestand zelf wint zodra het geladen is
export const META = {
  klassiek: ['Klassiek', '💰', '#6366f1', 'Verdien geld met goede antwoorden en koop upgrades.', ['geld', 'solo'], 4],
  toren: ['Torenverdediging', '🏰', '#0ea5e9', 'Antwoorden geven geld voor torens tegen golven monsters.', ['verdedigen', 'geld'], 6],
  baas: ['Baasgevecht', '🐉', '#dc2626', 'Versla de eindbaas samen met je bots.', ['team', 'snel'], 5],
  race: ['Race', '🏎️', '#f97316', 'Gas geven met goede antwoorden. Wie is eerst?', ['race', 'snel'], 4],
  vissen: ['Vissen', '🎣', '#0891b2', 'Vang vissen, verkoop ze en koop een betere hengel.', ['rustig', 'geld'], 5],
  vlag: ['Vlaggenroof', '🚩', '#16a34a', 'Loop over de kaart en steel de vlag.', ['race', 'denken'], 5],
  pizza: ['Pizzatent', '🍕', '#ea580c', 'Bak en bezorg pizza\'s en verbeter je tent.', ['geld', 'rustig'], 5],
  monster: ['Monsterjager', '⚔️', '#7c3aed', 'Wapens, levels en monsters om te verslaan.', ['rpg', 'denken'], 6],
  regen: ['Woordenregen', '🌧️', '#2563eb', 'Vang de vallende antwoorden op tijd.', ['snel', 'typen'], 3],
  memory: ['Memory', '🃏', '#db2777', 'Vind de paren vraag en antwoord.', ['denken', 'rustig'], 4],
  ruimte: ['Ruimtemissie', '🚀', '#4338ca', 'Brandstof voor je raket: bereik de planeten.', ['race', 'ruimte'], 5],
  bom: ['Bom doorgeven', '💣', '#b91c1c', 'Geef de bom door voor hij afgaat.', ['snel', 'duo'], 3],
  slang: ['Slimme slang', '🐍', '#15803d', 'Eet de juiste antwoord-blokken en groei.', ['snel', 'denken'], 4],
  boerderij: ['Boerderij', '🐄', '#65a30d', 'Plant, oogst, verzorg dieren en verkoop.', ['rustig', 'geld'], 6],
  vlieg: ['Poortvlucht', '🪂', '#0284c7', 'Vlieg door de poort met het goede antwoord.', ['snel', 'race'], 4],
  schat: ['Schatgraver', '⛏️', '#a16207', 'Graaf tegels, vind schatten, mijd valkuilen.', ['denken', 'geld'], 5],
  escape: ['Escape-kamer', '🗝️', '#475569', 'Open deuren en sloten in 5 kamers.', ['denken', 'rustig'], 7],
  miljonair: ['Quizshow', '🎤', '#c026d3', 'Klim de ladder naar de top met 3 hulplijnen.', ['quiz', 'denken'], 6],
  'r4-ladder': ['Regenboogladder', '🌈', '#06b6d4', 'Bordspel tegen een robot: goed antwoord = dobbelen. Klim regenbogen, ontwijk haaien!', ['bordspel', 'denken'], 5],
  'r4-kluis': ['Kluiskraker', '🔐', '#475569', 'Kraak de geheime code met je goede antwoorden. Fout = alarm!', ['denken', 'puzzel'], 5],
  'r4-drank': ['Toverdrank', '🧪', '#9333ea', 'Kook drankjes voor klanten: goede antwoorden geven ingrediënten.', ['rustig', 'geld'], 5],
  'r4-lava': ['Lavarivier', '🌋', '#ea580c', 'Spring van steen naar steen voor de lava je inhaalt.', ['snel', 'race'], 4],
  'r4-duik': ['Diepzee-duik', '🤿', '#0e7490', 'Duik dieper voor meer schatten. Durf jij door?', ['geld', 'denken'], 5],
  'r4-rad': ['Rad van Fortuin', '🎡', '#db2777', 'Elk goed antwoord = een draai aan het rad.', ['geluk', 'quiz'], 4],
};
/* ---------- iconen, werelden, scenes per spel ---------- */
export const GAME_ICON = { klassiek: 'coin', toren: 'castle', baas: 'dragon', race: 'car', vissen: 'fish', vlag: 'flag', pizza: 'pizza', monster: 'sword', regen: 'cloud', memory: 'puzzle', ruimte: 'rocket', bom: 'bomb', slang: 'frog', boerderij: 'cow', vlieg: 'balloon', schat: 'pickaxe', escape: 'key', miljonair: 'trophy', 'r4-ladder': 'rainbow', 'r4-kluis': 'lock', 'r4-drank': 'potion', 'r4-lava': 'volcano', 'r4-duik': 'submarine', 'r4-rad': 'dice', _demo: 'target' };
// standaardwereld per spel (de speler kan elke wereld kiezen)
export const DEFAULT_WORLD = { klassiek: 'stad', toren: 'kasteel', baas: 'vulkaan', race: 'woestijn', vissen: 'onderwater', vlag: 'bos', pizza: 'pretpark', monster: 'dino', regen: 'wolken', memory: 'snoepland', ruimte: 'ruimte', bom: 'neon', slang: 'jungle', boerderij: 'boerderij', vlieg: 'wolken', schat: 'piraten', escape: 'robots', miljonair: 'neon', 'r4-ladder': 'regenboog', 'r4-kluis': 'mijn', 'r4-drank': 'toverbos', 'r4-lava': 'vulkaan', 'r4-duik': 'onderwater', 'r4-rad': 'circus', _demo: 'herfst' };
// welke intro-scène bij welke wereld hoort (de scène krijgt de wereld als achtergrond via opts.theme)
export const INTRO_FOR = { ruimte: 'intro-ruimte', onderwater: 'intro-onderwater', kasteel: 'intro-kasteel', bos: 'intro-bos', stad: 'intro-stad', pretpark: 'intro-pretpark', boerderij: 'intro-boerderij', snoepland: 'intro-snoepland',
  woestijn: 'intro-bos', ijs: 'intro-bos', jungle: 'intro-bos', herfst: 'intro-bos', dino: 'intro-bos', vulkaan: 'intro-kasteel', piraten: 'intro-onderwater', robots: 'intro-stad', neon: 'intro-stad', wolken: 'intro-pretpark',
  regenboog: 'intro-snoepland', mijn: 'intro-kasteel', strand: 'intro-onderwater', toverbos: 'intro-bos', poolnacht: 'intro-bos', circus: 'intro-pretpark' };
export const TIPS = ['Tip: een lange reeks goede antwoorden geeft extra bonus!', 'Tip: lees de vraag rustig, snel hoeft niet altijd.', 'Tip: met upgrades uit de winkel kom je verder.', 'Tip: kies een andere wereld met de wereld-knop.', 'Tip: fouten oefen je later nog eens in Learn Study.', 'Tip: elke dag nieuwe dagopdrachten met munten.', 'Tip: speel een spel in 3 werelden voor een prestatie!'];
export function introFor(worldId) { return INTRO_FOR[worldId] || 'intro-stad'; }
// Welke scène(s) hoort bij een resultaat? (pure functie, getest)
export function resultScenes(r) {
  const out = [];
  if (r.win === true) out.push(r.id === 'baas' ? 'boss-defeated' : 'victory');
  else if (r.newRecord) out.push('new-record');
  else if (r.coins >= 40) out.push('coins-rain');
  if (r.lvUps && r.lvUps.length) out.push('levelup');
  if (r.win === true && r.newRecord && out.length < 2) out.push('new-record');
  return out.slice(0, 2);
}
export function worldOf(id) {
  let saved = null; try { saved = globalThis.localStorage.getItem('gfx:world:' + id); } catch {}
  if (saved && WORLDS.some((w) => w.id === saved)) return Themes.world(saved);
  return DEFAULT_WORLD[id] ? Themes.world(DEFAULT_WORLD[id]) : Themes.forGame(id);
}
const DEMO_META = { name: 'Oefenen', emoji: '🎯', color: '#0d9488', desc: 'Gewoon vragen beantwoorden met bonus voor een reeks.', tags: ['rustig'], minutes: 3 };
const TYPES = [['mc', '🔘 Kiezen'], ['type', '⌨️ Typen'], ['tf', '✅ Waar/onwaar'], ['order', '🔢 Volgorde'], ['match', '🔗 Paren'], ['fill', '✏️ Invullen'], ['num', '🔟 Getal'], ['multi', '☑️ Meerdere']];

/* ---------- reserve-kit zodat er altijd iets te spelen is ---------- */
export function builtinKit() {
  const qs = [];
  for (let i = 0; i < 24; i++) {
    const a = 2 + (i % 8), b = 2 + ((i * 3 + 1) % 8), p = a * b, k = i % 3;
    if (k === 0) qs.push({ t: 'mc', q: `${a} × ${b} = ?`, a: String(p), o: [...new Set([String(p), String(p + a), String(p - b), String(p + 2)])], g: 'tafels', d: 1 });
    else if (k === 1) qs.push({ t: 'num', q: `${a} × ${b} = ?`, a: p, g: 'tafels', d: 2 });
    else qs.push({ t: 'tf', q: `${a} × ${b} = ${i % 2 ? p : p + 1}`, a: !!(i % 2), g: 'tafels', d: 1 });
  }
  return { id: 'builtin-proef', name: 'Proefkit: tafels', emoji: '✖️', desc: 'Een kleine kit om mee te proberen.', lang: 'nl', group: 'Rekenen', qs, src: 'pack' };
}

/* ---------- env voor een spel (los testbaar) ---------- */
export function makeEnv(o) {
  const { kit, level = 2, seed = 1, fx = {}, fixed = null, types = [] } = o;
  const gq = (() => { try { return { q: GFX.q | 0, reduce: !!GFX.reduce }; } catch { return { q: 0, reduce: false }; } })();
  const pickFn = o.pickFn || pick, qk = o.qkey || qkey;
  let calls = 0, cursor = 0; const used = new Set();
  const env = {
    kit, uid: o.uid, name: o.name, seed, level, fx, world: o.world || WORLDS[0], gfx: o.gfx || gq, scene: o.scene || '', snd: o.snd, tts: o.tts, rand: (o.rng || rng)(seed), w: o.w || 360, h: o.h || 560,
    pick(n, po = {}) {
      n = Math.max(1, Math.floor(n) || 1);
      if (fixed && fixed.length) { const out = []; for (let i = 0; i < n; i++) out.push({ ...fixed[cursor++ % fixed.length] }); return out; }
      const avoid = used.size >= kit.qs.length ? new Set() : used;
      const base = { seed: seed + (calls++) * 7919, hard: level, weakFirst: true, kitId: kit.id, avoid };
      let r = null;
      try { r = pickFn(kit, n, { ...base, ...(types.length ? { types } : {}), ...po }); } catch { r = null; }
      if (!r || !r.length) { try { r = pickFn(kit, n, { ...base, ...po, types: undefined }); } catch { r = null; } }
      r = r || [];
      for (const q of r) used.add(qk(q));
      return r;
    },
    ask(host, q, ao = {}) {
      const a = { hints: fx.hints || 0, ...(fx.tts ? { tts: true } : {}), ...ao };
      if (a.time > 0 && fx.timeBonus) a.time = a.time + fx.timeBonus;
      return o.askFn(host, q, a);
    },
    report(r) { try { o.onReport && o.onReport(r); } catch (e) { /* hub-fout mag een spel niet breken */ } },
    end(res) { try { o.onEnd && o.onEnd(res); } catch (e) { /* idem */ } },
  };
  return env;
}

/* ---------- hoofdview ---------- */
export async function learnSpelView(ctx) {
  const root = ctx.view, uid = ctx.uid || (ctx.me && ctx.me.uid) || 'anon';
  const doc_ = typeof document !== 'undefined' ? document : null;
  let dead = false;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
  const nice = ctx.nice || ((e) => (e && (e.message || e.code)) || 'Er ging iets mis');
  try { bindCtx(ctx); } catch {}
  await Promise.all([Promise.resolve().then(() => Profile.load()).catch(() => {}), Promise.resolve().then(() => Prog.load()).catch(() => {})]);

  /* --- hub-opslag --- */
  const LSK = `learn:${uid}:hub`;
  const lsGet = () => { try { return JSON.parse(localStorage.getItem(LSK)); } catch { return null; } };
  const store = {
    d: Shop.normHub(lsGet()), cloudAt: 0, dirty: false,
    save() { this.d.t = Date.now(); try { localStorage.setItem(LSK, JSON.stringify(this.d)); } catch {} this.dirty = true; this.cloud(); },
    async cloud(force) {
      if (!ctx.db || !this.dirty || (!force && Date.now() - this.cloudAt < 30000)) return;
      this.cloudAt = Date.now(); this.dirty = false;
      try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
        const data = Shop.hubForCloud(this.d);
        await setDoc(doc(ctx.db, 'gamesaves', 'learn-hub__' + uid), { game: 'learn-hub', uid, data, updated: Date.now() });
      } catch { this.dirty = true; }
    },
    async pull() {
      if (!ctx.db) return;
      try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
        const s = await getDoc(doc(ctx.db, 'gamesaves', 'learn-hub__' + uid));
        if (s.exists && s.exists()) { const c = JSON.parse(s.data().data); this.d = Shop.mergeHub(this.d, c); try { localStorage.setItem(LSK, JSON.stringify(this.d)); } catch {} if (!dead && S.screen !== 'play') render(); }
      } catch { /* cloud is aanvulling */ }
    },
  };

  /* --- ronde 4: uitdagingen + ranglijst (lokaal `learn:<uid>:r4`, cloud gamesaves learn-r4) --- */
  const R4K = `learn:${uid}:r4`;
  const r4s = {
    d: R4.rollover(R4.normR4((() => { try { return JSON.parse(localStorage.getItem(R4K)); } catch { return null; } })())), cloudAt: 0, dirty: false,
    save() { this.d.t = Date.now(); try { localStorage.setItem(R4K, JSON.stringify(this.d)); } catch {} this.dirty = true; this.cloud(); },
    async cloud(force) {
      if (!ctx.db || !this.dirty || (!force && Date.now() - this.cloudAt < 30000)) return;
      this.cloudAt = Date.now(); this.dirty = false;
      try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
        await setDoc(doc(ctx.db, 'gamesaves', 'learn-r4__' + uid), { game: 'learn-r4', uid, data: R4.r4ForCloud(this.d), updated: Date.now() });
      } catch { this.dirty = true; }
    },
    async pull() {
      if (!ctx.db) return;
      try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
        const sn = await getDoc(doc(ctx.db, 'gamesaves', 'learn-r4__' + uid));
        if (sn.exists && sn.exists()) { this.d = R4.rollover(R4.mergeR4(this.d, JSON.parse(sn.data().data))); try { localStorage.setItem(R4K, JSON.stringify(this.d)); } catch {} if (!dead && (S.screen === 'home' || S.screen === 'rank')) render(); }
      } catch { /* cloud is aanvulling */ }
    },
  };
  const dailyCh = () => R4.dailyChallenge(R4.dayKey(), GAME_IDS);
  const weeklyCh = () => R4.weeklyChallenge(R4.weekKey());

  /* --- toestand --- */
  const S = {
    screen: 'home', shopTab: 'up', kitList: [], kitId: store.d.lastKit || '', kit: null, level: store.d.level || 2, types: new Set(store.d.types || []),
    query: '', tag: '', picker: false, kq: '', avail: {}, availErr: {}, probed: false, duels: null, duelBusy: false, duelErr: '', duelT: 0, dform: null,
    r4mode: 'today', run: null, result: null, stopArm: false, reviewOpen: false, wsheet: '', scene: null,
  };
  const P = Profile;
  const pget = () => { try { return P.get() || {}; } catch { return {}; } };
  const myName = () => pget().name || (ctx.me && ctx.me.name) || 'Speler';
  const snd = (n) => { try { Snd.play(n); } catch {} };
  const extra = () => { let level = 1; try { level = P.levelInfo().level || 1; } catch {} return { level, upLevels: Shop.upLevelsTotal() }; };

  /* --- spelbestanden lui laden --- */
  const modCache = new Map();
  function loadGame(id) {
    if (!modCache.has(id)) {
      modCache.set(id, import('./games/' + id + '.js?v=2').then((m) => {
        const d = m && m.default;
        if (!d || typeof d.create !== 'function') throw new Error('Dit spel mist een create()-functie.');
        return { ok: true, def: d };
      }).catch((e) => {
        const msg = String((e && e.message) || e);
        return { ok: false, err: msg, missing: /Failed to fetch|Importing a module|Cannot find|NOT_FOUND|not found|404|Load failed/i.test(msg) && !/Syntax|Unexpected|is not defined|not a function/i.test(msg) };
      }));
    }
    return modCache.get(id);
  }
  const defs = {};
  function meta(id) {
    const d = defs[id], m = META[id] || [];
    if (id === '_demo' && !d) return { id, ...DEMO_META };
    return {
      id, name: (d && d.name) || m[0] || id, emoji: (d && d.emoji) || m[1] || '🎮', color: (d && d.color) || m[2] || '#6366f1',
      desc: (d && d.desc) || m[3] || '', tags: (d && d.tags) || m[4] || [], minutes: (d && d.minutes) || m[5] || 4, duo: !!(d && d.duo),
    };
  }
  async function probe() {
    for (const id of GAME_IDS) {
      if (dead) return;
      const r = await loadGame(id);
      if (dead) return;
      if (r.ok) { defs[id] = r.def; S.avail[id] = 'ok'; } else { S.avail[id] = r.missing ? 'soon' : 'error'; S.availErr[id] = r.err; }
      if (S.screen === 'home' && !S.picker) updateGrid();
      await new Promise((res) => later(res, 30));
    }
    S.probed = true;
    if (!GAME_IDS.some((id) => S.avail[id] === 'ok')) { const r = await loadGame('_demo'); if (r.ok) { defs._demo = r.def; S.avail._demo = 'ok'; } }
    if (S.screen === 'home' && !S.picker) updateGrid();
  }
  const gameIds = () => { const ok = GAME_IDS.filter((id) => S.avail[id] === 'ok'); return ok.length ? ok : (S.avail._demo === 'ok' ? ['_demo'] : []); };

  /* --- kits --- */
  async function loadKitList() {
    try { S.kitList = (await allKits()) || []; } catch { S.kitList = []; }
    try { S.kitList = mergeR4Kits(S.kitList); } catch { /* r4-kits zijn extra */ }
    const usable = (k) => !(k.src === 'user' && k.count === 0);   // packs melden soms nog geen aantal (0 = nog niet geladen)
    if (!S.kitList.some(usable)) S.kitList = [...S.kitList, { id: 'builtin-proef', name: 'Proefkit: tafels', emoji: '✖️', group: 'Rekenen', count: 24, lang: 'nl', src: 'pack' }];
    if (!S.kitId || !S.kitList.some((k) => k.id === S.kitId)) {
      const t = S.kitList.find((k) => /tafel/i.test(k.name || '') && usable(k)) || S.kitList.find(usable) || S.kitList[0];
      S.kitId = t ? t.id : '';
    }
  }
  const kitEntry = () => S.kitList.find((k) => k.id === S.kitId);
  const kitLabel = () => { const e = kitEntry(); return e ? e.name : 'geen kit'; };
  const kitCache = new Map();
  async function getKitById(id) {
    if (kitCache.has(id) && kitCache.get(id).qs && kitCache.get(id).qs.length) return kitCache.get(id);
    let k = null;
    if (id === 'builtin-proef') k = builtinKit(); else if (isR4(id)) { try { k = await r4Kit(id, Core.normalizeQ); } catch { k = null; } } else { try { k = await getKit(id); } catch { k = null; } }
    if (k) kitCache.set(id, k);
    return k;
  }
  const currentKit = () => getKitById(S.kitId);
  const kmOpts = () => ({ toast, snd, onChange: () => { kitCache.clear(); loadKitList().then(() => { if (!dead) render(); }); } });
  function openMaker(opts) { KM.openKitMaker(kmOpts(), opts || {}).catch(() => toast('De kit-maker laden lukt niet')); }

  /* --- kleine UI-hulpen --- */
  function toast(msg) {
    if (!doc_ || !root) return;
    const old = root.querySelector('.lsp-toast'); if (old) old.remove();
    const t = doc_.createElement('div'); t.className = 'lsp-toast'; t.textContent = msg; root.appendChild(t);
    later(() => { try { t.remove(); } catch {} }, 2600);
  }
  function confetti(n = 26) {
    if (!doc_ || !root || GFX.reduce) return;
    const set = Shop.fxSet(store.d.eq && store.d.eq.fx).slice(4, 5)[0] || ['star'];
    const lim = Math.min(n, GFX.q === 0 ? 14 : GFX.q === 1 ? 24 : 40);
    for (let i = 0; i < lim; i++) {
      const s = doc_.createElement('span'); s.className = 'lsp-cf'; s.innerHTML = ic(set[i % set.length], 22 + Math.round(Math.random() * 16));
      s.style.left = Math.round(Math.random() * 96) + '%'; s.style.animationDelay = (Math.random() * 0.6).toFixed(2) + 's';
      root.appendChild(s); later(() => { try { s.remove(); } catch {} }, 3200);
    }
  }
  /* --- scenes (korte canvas-animaties, tik = overslaan) --- */
  function stopScene() { const sc = S.scene; S.scene = null; if (sc) { try { sc.stop(); } catch {} } }
  function playScenes(host, list, optsFn) {
    stopScene();
    if (!host || !list.length) return Promise.resolve();
    let stopped = false, cur = null;
    S.scene = { stop() { stopped = true; if (cur) cur.stop(); } };
    const handle = S.scene;
    return (async () => {
      for (const id of list) {
        if (stopped || dead) break;
        try { cur = Scenes.play(host, id, optsFn(id)); const r = await cur.done; if (r && r.skipped) break; } catch { break; }
      }
      if (S.scene === handle) S.scene = null;
    })();
  }
  function overlayScene(id, opts) {
    if (!doc_ || !root) return;
    const ov = doc_.createElement('div'); ov.className = 'lsp-scene'; root.appendChild(ov);
    playScenes(ov, [id], () => opts).then(() => { try { ov.remove(); } catch {} });
  }
  function afterChange() {
    const nu = Shop.checkHubAch(store.d, extra());
    if (nu.length) { let c = 0; for (const a of nu) c += a.reward; try { P.addCoins(c); } catch {} snd('level'); toast(`Prestatie: ${nu[0].name}! +${c} munten`); }
    try { const r = P.checkAch(); if (Array.isArray(r) && r.length && !nu.length) toast(`Nieuwe prestatie: ${r[0].name || ''}`); } catch {}
    store.save();
  }

  /* --- HTML: onderdelen --- */
  function headerHTML() {
    const p = pget(); let li = { level: 1, cur: 0, next: 100 }; try { li = P.levelInfo() || li; } catch {}
    const pct = Math.max(0, Math.min(100, Math.round(100 * (li.cur || 0) / Math.max(1, li.next || 1))));
    let streak = p.streak || 0;
    const ttl = Shop.titleOf(store.d);
    return `<div class="lsp-head"><button class="lsp-avbtn" data-act="tab" data-v="shop" aria-label="Uiterlijk aanpassen">${Shop.avatarHTML(p.avatar, 72, Shop.ringOf(store.d))}</button>
      <div class="lsp-hmain"><div class="lsp-name">${esc(myName())}<span class="lsp-lv">Lv ${li.level}</span></div>${ttl ? `<div class="lsp-ttl">${ic('medal', 16)} ${esc(ttl)}</div>` : ''}<div class="lsp-xp"><i style="width:${pct}%"></i></div><small>${fmt(li.cur || 0)} / ${fmt(li.next || 0)} XP${streak ? ` · ${ic('flame', 16)} ${streak} ${streak === 1 ? 'dag' : 'dagen'}` : ''}</small></div>
      <div class="lsp-coins">${ic('coin', 30)} ${fmt(p.coins || 0)}</div><button class="lsp-gear" data-act="settings" aria-label="Instellingen">⚙️</button></div>`;
  }
  const NAV_IC = { home: 'dice', shop: 'bag', duel: 'sword', rank: 'trophy', ach: 'medal' };
  function navHTML() {
    const tabs = [['home', 'Spelen'], ['shop', 'Winkel'], ['duel', 'Uitdagen'], ['rank', 'Ranglijst'], ['ach', 'Prestaties']];
    return `<div class="lsp-nav">${tabs.map(([k, l]) => `<button class="${S.screen === k ? 'on' : ''}" data-act="tab" data-v="${k}">${ic(NAV_IC[k], 26)}<span>${l}</span></button>`).join('')}</div>`;
  }
  function questsHTML() {
    let qs = []; try { qs = P.quests() || []; } catch {}
    if (!qs.length) return '';
    const left = qs.filter((q) => !(q.claimed !== undefined ? q.claimed : q.done)).length;
    return `<div class="lsp-card2"><b class="lsp-sectitle">${ic('target', 34)} Dagopdrachten <small style="display:inline">· ${left ? left + ' te doen' : 'alles klaar!'}</small></b>` + qs.map((q) => {
      const pct = Math.min(100, Math.round(100 * (q.prog || 0) / Math.max(1, q.goal || 1))), claimed = q.claimed !== undefined ? !!q.claimed : !!q.done, ready = !claimed && (q.prog || 0) >= (q.goal || 1);
      return `<div class="lsp-q${claimed ? ' done' : ''}"><div class="lsp-q-i">${ic(claimed ? 'medal' : ready ? 'gift' : 'star', 32)}</div><div class="lsp-q-m"><div>${esc(q.text)}</div><div class="lsp-xp s"><i style="width:${pct}%"></i></div><small>${fmt(Math.min(q.prog || 0, q.goal || 0))} / ${fmt(q.goal || 0)}</small></div>
        ${ready ? `<button class="lsp-claim" data-act="claim" data-id="${esc(q.id)}">${ic('coin', 24)} ${q.reward || ''}</button>` : `<small style="white-space:nowrap;display:flex;align-items:center;gap:3px">${claimed ? 'klaar' : ic('coin', 18) + ' ' + (q.reward || '')}</small>`}</div>`;
    }).join('') + '</div>';
  }
  const gameIcon = (id, m) => (m && m.icon) || GAME_ICON[id] || null;
  function bigIcon(id, m, size) { const n = gameIcon(id, m); return n ? ic(n, size) : `<span class="lsp-emo" style="font-size:${Math.round(size * 0.8)}px">${esc(m.emoji)}</span>`; }
  function cardHTML(id) {
    const m = meta(id), st = S.avail[id], best = store.d.best[id], fav = store.d.fav.includes(id);
    const dead_ = st === 'soon' || st === 'error';
    const tag = dead_ ? 'div' : 'button';
    const w = worldOf(id), deco = w.deco && w.deco[0];
    return `<${tag} class="lsp-gc${dead_ ? ' soon' : ''}" style="--c:${esc(m.color)}" data-act="${dead_ ? 'noop' : 'play'}" data-id="${esc(id)}">
      ${dead_ ? '' : `<span class="lsp-fav" data-act="fav" data-id="${esc(id)}">${fav ? '★' : '☆'}</span>`}
      <span class="lsp-gc-ic">${bigIcon(id, m, 96)}${deco ? `<span class="lsp-gc-deco">${ic(deco, 40)}</span>` : ''}</span><b>${esc(m.name)}</b><small>${esc(m.desc)}</small>
      <span class="lsp-tags">${(m.tags || []).slice(0, 3).map((t) => `<i>${esc(t)}</i>`).join('')}${m.duo ? '<i>2 spelers</i>' : ''}</span>
      ${dead_ ? '' : `<span class="lsp-wchip" role="button" data-act="worlds" data-id="${esc(id)}">${esc(w.emoji)} ${esc(w.name)} ▾</span>`}
      <span class="lsp-gc-f">⏱ ±${m.minutes} min${best ? ` · ${ic('medal', 18)} ${fmt(best.score)}` : ''}</span>
      ${st === 'soon' ? '<span class="lsp-badge">Komt binnenkort</span>' : st === 'error' ? '<span class="lsp-badge err">Even stuk</span>' : ''}</${tag}>`;
  }
  function worldSheetHTML() {
    const id = S.wsheet; if (!id) return '';
    const m = meta(id), cur = worldOf(id);
    const wps = WORLDS.map((w) => `<button class="lsp-wp${w.id === cur.id ? ' on' : ''}" data-act="world-set" data-id="${esc(id)}" data-w="${esc(w.id)}" aria-label="${esc(w.name)}"><span class="pv" style="background:linear-gradient(180deg,${esc(w.bg.join(','))})"><i style="background:${esc(w.ground)}"></i><span class="d">${ic(w.deco[0], 44)}</span><span class="e">${esc(w.emoji)}</span></span><span class="t">${esc(w.name)}</span></button>`).join('');
    return `<div class="lsp-sheet-bg" data-act="world-close"><div class="lsp-sheet lsp-wsheet" data-act="noop"><div class="lsp-sectitle" style="display:flex;align-items:center;gap:10px">${bigIcon(id, m, 48)}<div><b>${esc(m.name)}</b><small>Kies een wereld: zo ziet het spel eruit</small></div></div>
      <div class="lsp-wrow">${wps}</div>
      <button class="lsp-tog${store.d.intro === 0 ? '' : ' on'}" data-act="intro-toggle"><span>Intro-filmpje voor het spel</span><i></i></button>
      <button class="lsp-btn big" data-act="world-play" data-id="${esc(id)}">${ic('rocket', 26)} Spelen in ${esc(cur.name)}</button><button class="lsp-btn ghost" data-act="world-close" style="margin-top:8px;width:100%">Sluiten</button></div></div>`;
  }
  function visibleIds() {
    const q = S.query.trim().toLowerCase();
    let ids = [...GAME_IDS]; if (S.avail._demo === 'ok') ids = ['_demo', ...ids];
    ids = ids.filter((id) => {
      const m = meta(id);
      if (S.tag && !(m.tags || []).includes(S.tag)) return false;
      if (q && !(`${m.name} ${m.desc} ${(m.tags || []).join(' ')}`.toLowerCase().includes(q))) return false;
      return true;
    });
    const rank = (id) => (S.avail[id] === 'soon' || S.avail[id] === 'error' ? 2 : store.d.fav.includes(id) ? 0 : 1);
    return ids.map((id, i) => [id, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map((x) => x[0]);
  }
  function allTags() {
    const c = {}; for (const id of GAME_IDS) for (const t of meta(id).tags || []) c[t] = (c[t] || 0) + 1;
    return Object.keys(c).sort((a, b) => c[b] - c[a]).slice(0, 9);
  }
  function gridSectionHTML() {
    const recent = store.d.last.filter((id) => S.avail[id] === 'ok');
    const ids = visibleIds();
    let h = '';
    if (recent.length && !S.query && !S.tag) h += `<div class="lsp-sec">${ic('hourglass', 28)} Laatst gespeeld</div><div class="lsp-recent">${recent.slice(0, 5).map((id) => { const m = meta(id); return `<button class="lsp-rc" data-act="play" data-id="${esc(id)}">${bigIcon(id, m, 36)}${esc(m.name)}</button>`; }).join('')}</div>`;
    const okN = GAME_IDS.filter((id) => S.avail[id] === 'ok').length;
    h += `<div class="lsp-sec">${ic('dice', 28)} Alle spellen <small>${S.probed ? `${okN} beschikbaar` : 'laden…'}</small></div>`;
    h += ids.length ? `<div class="lsp-grid">${ids.map(cardHTML).join('')}</div>` : '<div class="lsp-empty">Geen spel gevonden. Probeer een ander woord.</div>';
    return h;
  }
  function homeHTML() {
    const e = kitEntry();
    let h = '';
    try { h += R4.dailyHTML(r4s.d, dailyCh(), r4api, weeklyCh()); } catch { /* uitdagingen zijn extra */ }
    h += questsHTML();
    h += `<button class="lsp-kitbtn" data-act="kit-open"><span class="e">${esc((e && e.emoji) || '📚')}</span><span class="t"><b>${esc(e ? e.name : 'Kies een kit')}</b><small>${e ? `${e.count > 0 ? e.count + ' vragen · ' : ''}tik om een andere kit te kiezen` : 'Maak hier je eigen kit'}</small></span><span>▾</span></button>`;
    h += `<div class="lsp-chips">${[1, 2, 3].map((l) => `<button class="lsp-chip${S.level === l ? ' on' : ''}" data-act="level" data-v="${l}">${['', '🟢', '🟡', '🔴'][l]} ${Shop.LV_NAMES[l]}</button>`).join('')}</div>`;
    h += `<div class="lsp-chips"><button class="lsp-chip${S.types.size ? '' : ' on'}" data-act="type" data-v="*">Alle vragen</button>${TYPES.map(([k, l]) => `<button class="lsp-chip${S.types.has(k) ? ' on' : ''}" data-act="type" data-v="${k}">${l}</button>`).join('')}</div>`;
    h += `<div class="lsp-tools"><input class="lsp-search" data-inp="gsearch" type="search" placeholder="Zoek een spel…" value="${esc(S.query)}"><button class="lsp-btn" data-act="surprise">${ic('dice', 26)} Verras me</button></div>`;
    h += `<div class="lsp-chips"><button class="lsp-chip${S.tag ? '' : ' on'}" data-act="tag" data-v="">Alles</button>${allTags().map((t) => `<button class="lsp-chip${S.tag === t ? ' on' : ''}" data-act="tag" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
    h += `<div class="lsp-gridwrap">${gridSectionHTML()}</div>`;
    return h;
  }
  function pickerHTML() {
    const q = S.kq.trim().toLowerCase();
    const list = S.kitList.filter((k) => !q || `${k.name} ${k.group || ''}`.toLowerCase().includes(q));
    const groups = {}; for (const k of list) { const g = k.src === 'user' ? '⭐ Mijn kits' : (k.group || 'Overig'); (groups[g] || (groups[g] = [])).push(k); }
    const names = Object.keys(groups).sort((a, b) => (a[0] === '⭐' ? -1 : b[0] === '⭐' ? 1 : a.localeCompare(b)));
    return `<div class="lsp-sheet-bg" data-act="kit-close"><div class="lsp-sheet" data-act="noop"><b>📚 Kies een kit</b><input class="lsp-search" data-inp="ksearch" type="search" placeholder="Zoek een kit…" value="${esc(S.kq)}" style="margin-top:8px"><div class="lsp-sheet-list">${pickerListHTML(groups, names)}</div><div style="display:flex;gap:6px;margin-top:8px"><button class="lsp-btn" style="flex:1" data-act="kit-new">➕ Nieuwe kit maken</button><button class="lsp-btn" style="flex:1" data-act="kit-import">📥 Kit-code</button></div><button class="lsp-btn ghost" data-act="kit-close" style="margin-top:8px">Sluiten</button></div></div>`;
  }
  function pickerListHTML(groups, names) {
    if (!groups) {
      const q = S.kq.trim().toLowerCase(); groups = {};
      for (const k of S.kitList.filter((k) => !q || `${k.name} ${k.group || ''}`.toLowerCase().includes(q))) { const g = k.src === 'user' ? '⭐ Mijn kits' : (k.group || 'Overig'); (groups[g] || (groups[g] = [])).push(k); }
      names = Object.keys(groups).sort((a, b) => (a[0] === '⭐' ? -1 : b[0] === '⭐' ? 1 : a.localeCompare(b)));
    }
    if (!names.length) return '<div class="lsp-empty">Geen kits gevonden.</div>';
    return names.map((g) => `<div class="lsp-lab">${esc(g)}</div>` + groups[g].map((k) => `<div style="display:flex;gap:6px;align-items:stretch"><button style="flex:1;min-width:0" class="lsp-kit${k.id === S.kitId ? ' on' : ''}" data-act="kit-pick" data-id="${esc(k.id)}"><span class="e">${esc(k.emoji || '📚')}</span><span style="flex:1;min-width:0"><b>${esc(k.name)}</b><small>${k.count > 0 ? k.count + ' vragen' : ''}${k.lang && k.lang !== 'nl' ? ' · ' + esc(k.lang) : ''}</small></span></button>${k.src === 'user' ? `<button class="lsp-btn" data-act="kit-edit" data-id="${esc(k.id)}" aria-label="Bewerk kit">✏️</button>` : `<button class="lsp-btn" data-act="kit-copy" data-id="${esc(k.id)}" aria-label="Maak een eigen kopie" title="Eigen kopie maken">📝</button>`}</div>`).join('')).join('');
  }
  function rankHTML() {
    const d = store.d, s = d.stats;
    let h = '';
    try { h += R4.rankModesHTML(r4s.d, S.r4mode, r4api); } catch { /* ranglijst-modi zijn extra */ }
    h += `<div class="lsp-card2"><b class="lsp-sectitle">${ic('star', 32)} Jouw statistieken</b><div class="lsp-stats">
      <div class="lsp-stat"><b>${fmt(s.games)}</b><small>spellen</small></div><div class="lsp-stat"><b>${fmt(s.wins)}</b><small>gewonnen</small></div><div class="lsp-stat"><b>${s.answers ? Math.round(100 * s.correct / s.answers) : 0}%</b><small>goed</small></div>
      <div class="lsp-stat"><b>${fmt(s.correct)}</b><small>goede antwoorden</small></div><div class="lsp-stat"><b>${s.bestStreak}</b><small>beste reeks</small></div><div class="lsp-stat"><b>${s.duelWins}/${s.duels}</b><small>duels gewonnen</small></div></div></div>`;
    const rows = GAME_IDS.map((id) => [id, d.best[id]]).sort((a, b) => ((b[1] && b[1].score) || -1) - ((a[1] && a[1].score) || -1));
    h += `<div class="lsp-card2"><b class="lsp-sectitle">${ic('medal', 32)} Beste scores op dit toestel</b>` + rows.map(([id, b], i) => { const m = meta(id); return `<div class="lsp-rank"><span class="e">${bigIcon(id, m, 40)}</span><div class="m"><b>${esc(m.name)}</b><small>${b ? `${esc(b.kit || '')} · ${Shop.LV_NAMES[b.level] || ''} · ${new Date(b.t).toLocaleDateString('nl-NL')}` : 'nog niet gespeeld'}</small></div><span class="s">${b ? fmt(b.score) : '–'}${i === 0 && b ? ' ' + ic('crown', 24) : ''}</span></div>`; }).join('') + '</div>';
    h += `<div class="lsp-card2"><b class="lsp-sectitle">${ic('rainbow', 32)} Werelden</b><small>${store.d.wl.length} van ${WORLDS.length} werelden gespeeld</small><div class="lsp-xp"><i style="width:${Math.round(100 * store.d.wl.length / WORLDS.length)}%"></i></div></div>`;
    const st = S.duels ? Duel.standings(S.duels) : null;
    h += `<div class="lsp-card2"><b class="lsp-sectitle">${ic('sword', 32)} Uitdagingen</b>`;
    if (!ctx.db) h += '<small>Geen verbinding met de cloud.</small>';
    else if (!st) h += `<small>${S.duelBusy ? 'Laden…' : 'Nog niet geladen.'}</small><button class="lsp-btn ghost" data-act="duel-refresh">Laden</button>`;
    else if (!st.length) h += '<small>Nog geen afgeronde uitdagingen. Daag je broer uit!</small>';
    else h += st.map((r, i) => `<div class="lsp-rank"><span class="e">${ic(['trophy', 'medal', 'medal'][i] || 'star', 34)}</span><div class="m"><b>${esc(r.name)}${r.uid === uid ? ' (jij)' : ''}</b><small>${r.games} uitdagingen</small></div><span class="s">${r.wins} ${ic('trophy', 20)}</span></div>`).join('');
    return h + '</div>';
  }

  /* --- hoofd-render --- */
  function render() {
    if (dead || !root) return;
    if (S.screen === 'play' || S.screen === 'err') return;
    stopScene();
    let y = 0; try { y = window.scrollY || 0; } catch {}
    const cls = `lsp q${GFX.q | 0}${GFX.reduce ? ' rm' : ''}`;
    if (S.screen === 'result') { root.innerHTML = `<div class="${cls}">${resultHTML()}${worldSheetHTML()}</div>`; try { window.scrollTo(0, 0); } catch {} return; }
    let body = '';
    if (S.screen === 'home') body = homeHTML() + (S.picker ? pickerHTML() : '') + worldSheetHTML();
    else if (S.screen === 'shop') body = Shop.shopHTML(api);
    else if (S.screen === 'duel') body = Duel.duelsHTML(api);
    else if (S.screen === 'rank') body = rankHTML();
    else if (S.screen === 'ach') body = Shop.achHTML(api);
    root.innerHTML = `<div class="${cls}">${headerHTML()}${navHTML()}<div class="lsp-body">${body}</div></div>`;
    try { window.scrollTo(0, y); } catch {}
  }
  function updateGrid() {
    const g = root && root.querySelector('.lsp-gridwrap'); if (g) g.innerHTML = gridSectionHTML();
  }

  /* --- spel starten --- */
  function errorCard(title, msg) {
    S.screen = 'err'; root.innerHTML = `<div class="lsp"><div class="lsp-err"><div style="font-size:52px">😵</div><h3>${esc(title)}</h3><small>${esc(msg)}</small><button class="lsp-btn big" data-act="home">Terug naar de spellen</button></div></div>`;
  }
  async function startGame(id, o = {}) {
    if (S.run) destroyRun();
    S.screen = 'play'; root.innerHTML = '<div class="lsp"><div class="lsp-empty">Spel laden…</div></div>';
    const r = await loadGame(id); if (dead) return;
    if (!r.ok) { errorCard(r.missing ? 'Dit spel komt binnenkort' : 'Dit spel kan nu niet starten', r.err || ''); return; }
    defs[id] = r.def;
    let askMod = null;
    try { askMod = await import('./q.js?v=1'); } catch (e) { errorCard('De vragen-module ontbreekt', String(e && e.message || e)); return; }
    if (dead) return;
    const askFn = askMod.ask || askMod.renderQ;
    let kit, level = S.level, seed = 1 + Math.floor(Math.random() * 2000000000), fixed = null, duel = o.duel || null;
    if (duel) {
      fixed = Duel.unpackQs(duel.qs); level = duel.level || 2; seed = duel.seed || 1;
      kit = { id: 'duel-' + duel.id, name: duel.kitName, emoji: '⚔️', qs: fixed, src: 'duel' };
      if (!fixed.length) { errorCard('Deze uitdaging heeft geen vragen', ''); return; }
    } else {
      kit = await currentKit(); if (dead) return;
      if (!kit || !kit.qs || !kit.qs.length) { errorCard('Deze kit heeft geen vragen', 'Kies een andere kit of maak er een in Learn Study.'); return; }
      if (o.daily) { level = o.daily.level; seed = o.daily.seed; } else { store.d.level = level; }
      store.d.lastKit = kit.id; store.d.types = [...S.types]; store.save();
    }
    const m = meta(id);
    const world = worldOf(id);
    root.innerHTML = `<div class="lsp q${GFX.q | 0}${GFX.reduce ? ' rm' : ''}"><div class="lsp-play"><div class="lsp-bar"><button data-act="stop" aria-label="Stoppen">✕</button><b class="lsp-tt">${bigIcon(id, m, 28)} ${esc(m.name)}${duel ? ' · ' + ic('sword', 22) : ''} <small style="display:inline">${esc(world.emoji)} ${esc(world.name)}</small></b><span class="lsp-cnt">✓ 0</span><button data-act="snd" aria-label="Geluid">${Snd.on === false ? '🔇' : '🔊'}</button>${TTS.supported && TTS.supported() ? `<button data-act="tts" aria-label="Voorlezen">${TTS.on ? '🗣️' : '🤐'}</button>` : ''}</div><div class="lsp-host"></div></div></div>`;
    try { window.scrollTo(0, 0); } catch {}
    const host = root.querySelector('.lsp-host');
    const sz = hostSize(host);
    const introId = introFor(world.id);
    const R = S.run = { id, kit, level, seed, duel, daily: o.daily || null, world, answers: 0, correct: 0, wrong: 0, streak: 0, bestStreak: 0, misses: [], seen: new Set(), ended: false, inst: null, fx: null, t0: Date.now(), host };
    let fx = {}; try { fx = P.effects() || {}; } catch {}
    R.fx = fx;
    const env = makeEnv({ kit, uid, name: myName(), seed, level, fx, world, scene: introId, gfx: { q: GFX.q | 0, reduce: !!GFX.reduce }, fixed: duel ? fixed : null, types: duel ? [] : [...S.types], snd: Snd, tts: TTS, w: sz.w, h: sz.h, askFn,
      onReport: (rep) => onReport(R, rep), onEnd: (res) => { if (R.ended) return; R.ended = true; later(() => finish(R, res), 450); } });
    R.env = env;
    if (store.d.intro !== 0 && !o.noIntro) {
      const tip = TIPS[(seed >>> 3) % TIPS.length];
      await playScenes(host, [introId], () => ({ theme: world.id, title: m.name, sub: tip }));
      if (dead || S.run !== R) return;
    }
    try { R.inst = r.def.create(host, env); } catch (e) { destroyRun(); errorCard('Het spel crashte bij het starten', String(e && e.message || e)); return; }
  }
  function hostSize(host) {
    let w = 360, h = 560;
    try { const r = host.getBoundingClientRect(); w = Math.max(240, Math.floor(host.clientWidth || r.width || 360)); h = Math.max(440, Math.floor((window.innerHeight || 700) - (r.top || 50) - 10)); host.style.height = h + 'px'; } catch {}
    return { w, h };
  }
  function onReport(R, rep) {
    if (!rep) return;
    const ok = !!rep.ok; R.answers++;
    if (ok) { R.correct++; R.streak++; R.bestStreak = Math.max(R.bestStreak, R.streak); } else { R.wrong++; R.streak = 0; if (rep.q) { const k = qkey(rep.q); if (!R.seen.has(k)) { R.seen.add(k); R.misses.push(rep.q); } } }
    if (!R.duel && rep.q) { try { Prog.record(R.kit.id, rep.q, ok, rep.ms || 0); } catch {} }
    const c = root && root.querySelector('.lsp-cnt'); if (c) c.textContent = `✓ ${R.correct}`;
  }
  function destroyRun() {
    const R = S.run; if (!R) return; S.run = null;
    stopScene();
    try { R.inst && R.inst.destroy && R.inst.destroy(); } catch {}
    try { TTS.stop(); } catch {}
    try { if (R.host) R.host.innerHTML = ''; } catch {}
  }

  /* --- einde van een spel: beloning --- */
  function finish(R, res) {
    if (dead || S.run !== R) return;
    res = res || {};
    const st = res.stats || {};
    const num = (v) => (Number.isFinite(+v) ? +v : 0);
    let correct = R.correct, wrong = R.wrong;
    if (!R.answers) { correct = num(st.correct); wrong = num(st.wrong); }
    const bestStreak = Math.max(R.bestStreak, num(st.bestStreak ?? st['best streak'] ?? st.beststreak ?? st.streak));
    const score = Math.max(0, Math.round(num(res.score)));
    const win = res.win === true ? true : res.win === false ? false : null;
    const d = store.d, prev = d.best[R.id], wid = R.world ? R.world.id : '', newWorld = !!wid && !(d.wp[R.id] || []).includes(wid), newRecord = score > 0 && (!prev || score > prev.score);
    const rw = Shop.calcReward({ correct, wrong, win, level: R.level, newRecord }, R.fx);
    let before = 1, after = 1; try { before = P.levelInfo().level; } catch {}
    let xr = null;
    try { if (rw.coins) P.addCoins(rw.coins); if (rw.xp) xr = P.addXp(rw.xp); } catch {}
    try { after = P.levelInfo().level; } catch { after = before; }
    // level-ups: core geeft ze zelf een beloning (xr.levels); zo niet, dan geeft de hub die
    const lvUps = [];
    if (xr && Array.isArray(xr.levels)) for (const l of xr.levels) lvUps.push({ level: l.level, coins: l.coins || 0 });
    else for (let l = before + 1; l <= after; l++) { const c = Shop.levelReward(l); lvUps.push({ level: l, coins: c }); try { P.addCoins(c); } catch {} }
    try {
      P.bumpQuest('games', 1);
      if (win === true) P.bumpQuest('wins', 1);
      if (!wrong && correct >= 5) P.bumpQuest('perfect', 1);
      if (bestStreak > 0) P.bumpQuest('streak', bestStreak);
    } catch {}
    Shop.applyResult(d, { game: R.id, kitId: R.kit.id, kitName: R.kit.name, level: R.level, score, win, correct, wrong, bestStreak, coins: rw.coins, world: wid });
    if (R.duel) d.stats.duels++;
    let r4r = null;
    if (!R.duel) { try { r4r = R4.recordResult(r4s.d, { game: R.id, kit: R.kit.name, level: R.level, score, win, correct, wrong, bestStreak, daily: !!R.daily, ch: R.daily }); r4s.save(); } catch { r4r = null; } }
    const nu = Shop.checkHubAch(d, extra()); let achCoins = 0; for (const a of nu) achCoins += a.reward;
    if (achCoins) { try { P.addCoins(achCoins); } catch {} }
    let coreNew = []; try { const r = P.checkAch(); if (Array.isArray(r)) coreNew = r; } catch {}
    store.save();
    const m = meta(R.id);
    S.result = { id: R.id, name: m.name, emoji: m.emoji, kit: R.kit.name, level: R.level, score, win, correct, wrong, bestStreak, summary: String(res.summary || ''), coins: rw.coins, xp: rw.xp, newRecord, prevBest: prev ? prev.score : 0, lvUps, ach: nu, coreAch: coreNew, misses: R.misses.slice(0, 12), world: R.world || null, newWorld, duel: R.duel, duelNote: R.duel ? 'Score wordt verstuurd…' : '', kitObj: R.kit, saved: false };
    if (r4r && r4r.dailyDone) S.result.dailyDone = true;
    destroyRun();
    S.screen = 'result'; S.reviewOpen = false; render();
    snd(win === false ? 'lose' : 'win'); if (win === true || newRecord || lvUps.length) confetti();
    const hero = root.querySelector('.lsp-hero');
    if (hero && !R.duel) playScenes(hero, resultScenes(S.result), (sid) => ({ value: '+' + rw.coins, title: sid === 'levelup' && lvUps.length ? 'Level ' + lvUps[lvUps.length - 1].level + '!' : undefined, sub: sid === 'new-record' ? fmt(score) + ' punten' : undefined })).then(() => { const hh = root && root.querySelector('.lsp-hero'); if (hh && S.screen === 'result' && lvUps.length) snd('level'); });
    if (R.duel) {
      Duel.submitScore(api, R.duel, score).then(() => {
        const w = Duel.duelWinner(R.duel, uid); if (w && w.me) { d.stats.duelWins++; afterChange(); }
        if (S.result && S.result.duel === R.duel) { S.result.duelNote = w ? (w.me ? '🏆 Je hebt gewonnen!' : `${w.name} staat voor.`) : 'Score verstuurd. Wachten op de ander.'; if (S.screen === 'result') render(); }
        S.duelT = 0;
      }).catch((e) => { if (S.result) { S.result.duelNote = 'Versturen mislukt: ' + nice(e); if (S.screen === 'result') render(); } });
    }
  }
  function resultHTML() {
    const r = S.result; if (!r) return '<div class="lsp-empty">Geen resultaat.</div>';
    const big = r.win === true ? 'trophy' : r.win === false ? 'shield' : (r.correct >= r.wrong ? 'star' : 'medal');
    const title = r.win === true ? 'Gewonnen!' : r.win === false ? 'Bijna! Volgende keer beter' : 'Goed gespeeld!';
    const acc = r.correct + r.wrong ? Math.round(100 * r.correct / (r.correct + r.wrong)) : 0;
    let li = { level: 1, cur: 0, next: 100 }; try { li = P.levelInfo() || li; } catch {}
    const pct = Math.max(0, Math.min(100, Math.round(100 * (li.cur || 0) / Math.max(1, li.next || 1))));
    const m = meta(r.id);
    let h = `<div class="lsp-res"><div class="lsp-hero" style="--rc:${esc(m.color)}"><div class="lsp-big">${ic(big, 150)}</div></div><h2>${title}</h2><small style="display:flex;justify-content:center;align-items:center;gap:6px">${bigIcon(r.id, m, 24)} ${esc(r.name)} · ${esc(r.kit)} · ${Shop.LV_NAMES[r.level]}${r.world ? ` · ${esc(r.world.emoji)} ${esc(r.world.name)}` : ''}</small>
      <div class="lsp-score">${fmt(r.score)}</div>${r.newRecord ? `<div class="lsp-ribbon">${ic('star', 24)} Nieuw record!${r.prevBest ? ` (was ${fmt(r.prevBest)})` : ''}</div>` : ''}
      ${r.newWorld ? `<div class="lsp-note" style="display:flex;align-items:center;gap:8px;justify-content:center">${ic('rainbow', 30)} Nieuwe wereld voor dit spel: <b>${esc(r.world.name)}</b></div>` : ''}
      ${r.dailyDone ? `<div class="lsp-note" style="display:flex;align-items:center;gap:8px;justify-content:center">${ic('target', 30)} <b>Dagelijkse uitdaging gehaald!</b> Haal je beloning op bij Spelen.</div>` : ''}
      ${r.summary ? `<div class="lsp-note">${esc(r.summary)}</div>` : ''}
      <div class="lsp-stats"><div class="lsp-stat"><b>${r.correct}</b><small>goed</small></div><div class="lsp-stat"><b>${r.wrong}</b><small>fout</small></div><div class="lsp-stat"><b>${r.bestStreak}</b><small>beste reeks</small></div></div>
      <small>${acc}% goed</small>
      <div class="lsp-rew"><div>${ic('coin', 36)} +${r.coins}</div><div>${ic('star', 36)} +${r.xp} XP</div></div>
      <div class="lsp-xp"><i style="width:${pct}%"></i></div><small>Level ${li.level} · ${fmt(li.cur || 0)} / ${fmt(li.next || 0)} XP</small>`;
    for (const u of r.lvUps) h += `<div class="lsp-lvup">${ic('medal', 40)} Level ${u.level}! Bonus +${u.coins} ${ic('coin', 22)}</div>`;
    for (const a of r.ach) h += `<div class="lsp-new">${emo(a.emoji, 40)} <div><b>Prestatie: ${esc(a.name)}</b> <small style="display:inline">+${a.reward} munten</small></div></div>`;
    for (const a of r.coreAch) h += `<div class="lsp-new">${emo(a.emoji || '🎖️', 40)} <div><b>Prestatie: ${esc(a.name || '')}</b></div></div>`;
    if (r.duel) h += `<div class="lsp-note">${ic('sword', 22)} ${esc(r.duelNote)}</div>`;
    if (r.misses.length) {
      h += `<div class="lsp-row" style="justify-content:center"><button class="lsp-btn ghost" data-act="review">${S.reviewOpen ? '▲ Verberg' : '▼ Fouten doornemen'} (${r.misses.length})</button></div>`;
      if (S.reviewOpen) {
        h += '<div class="lsp-card2" style="text-align:left;margin-top:8px">' + r.misses.map((q) => `<div class="lsp-miss"><b>${esc(String(q.e || '') + ' ' + String(q.q || '').slice(0, 160))}</b><br><small>Goed antwoord: <b>${esc(Shop.displayAnswer(q))}</b>${q.x ? ' · ' + esc(q.x) : ''}</small></div>`).join('');
        h += `<small style="margin-top:8px">Tip: oefen deze vragen ook in Learn Study zodat ze er vanzelf in komen.</small><button class="lsp-btn ghost" data-act="save-misses" ${r.saved ? 'disabled' : ''} style="margin-top:6px">${r.saved ? '✔ Opgeslagen als kit' : '💾 Bewaar als kit "Mijn fouten"'}</button></div>`;
      }
    }
    h += `<div class="lsp-row" style="justify-content:center;margin-top:14px">${r.duel ? '' : `<button class="lsp-btn" data-act="again">${ic('rocket', 26)} Nog een keer</button><button class="lsp-btn ghost" data-act="worlds" data-id="${esc(r.id)}">${ic('rainbow', 26)} Andere wereld</button>`}<button class="lsp-btn ghost" data-act="home">${ic('dice', 26)} Ander spel</button>${r.duel ? `<button class="lsp-btn ghost" data-act="tab" data-v="duel">${ic('sword', 26)} Naar uitdagingen</button>` : ''}</div></div>`;
    return h;
  }

  /* --- acties --- */
  function surprise() {
    const ok = GAME_IDS.filter((id) => S.avail[id] === 'ok'), unk = GAME_IDS.filter((id) => !S.avail[id]);
    const pool = ok.length ? ok : unk.length ? unk : (S.avail._demo === 'ok' ? ['_demo'] : []);
    if (!pool.length) { toast('Er zijn nog geen spellen beschikbaar.'); return; }
    startGame(pool[Math.floor(Math.random() * pool.length)]);
  }
  const SIMPLE = {
    home() { S.screen = 'home'; S.picker = false; render(); },
    tab(d) { S.screen = d.v; S.picker = false; if (d.v === 'duel' || d.v === 'rank') { if (ctx.db && !S.duels) Duel.duelsRefresh(api); } render(); try { window.scrollTo(0, 0); } catch {} },
    level(d) { S.level = +d.v; store.d.level = S.level; store.save(); render(); },
    type(d) { if (d.v === '*') S.types.clear(); else if (S.types.has(d.v)) S.types.delete(d.v); else S.types.add(d.v); render(); },
    tag(d) { S.tag = d.v || ''; render(); },
    fav(d) { const f = store.d.fav, i = f.indexOf(d.id); if (i >= 0) f.splice(i, 1); else f.push(d.id); store.save(); updateGrid(); },
    play(d) { startGame(d.id); },
    surprise,
    'r4-rank'(d) { S.r4mode = d.v || 'today'; render(); },
    'r4-play-day'() { const ch = dailyCh(); if (S.avail[ch.game] === 'soon' || S.avail[ch.game] === 'error') { toast('Het spel van vandaag is er nog niet. Probeer later.'); return; } startGame(ch.game, { daily: ch }); },
    'r4-claim-day'() {
      const c = R4.claimDaily(r4s.d, dailyCh()); if (!c) { toast('Nog niet af.'); return; }
      try { P.addCoins(c); } catch {} r4s.save(); snd('munt'); confetti(24); toast(`Dagelijkse uitdaging! +${c} munten`); afterChange(); render();
    },
    'r4-claim-week'(d) {
      const c = R4.claimWeekly(r4s.d, weeklyCh(), d.id); if (!c) { toast('Nog niet af.'); return; }
      try { P.addCoins(c); } catch {} r4s.save(); snd('munt'); confetti(d.id === 'bonus' ? 36 : 14); toast(d.id === 'bonus' ? `Week-bonus! +${c} munten` : `Beloning! +${c} munten`); afterChange(); render();
    },
    claim(d) {
      let out = false; try { out = P.claimQuest(d.id); } catch {}
      if (!out) { toast('Nog niet af.'); return; }
      store.d.stats.claimed++; snd('munt');
      toast(out.bonus ? 'Alle opdrachten klaar! Bonus +50 munten en een ster' : `Beloning opgehaald! +${out.coins || ''} munten`.replace('+ ', ''));
      confetti(out.bonus ? 30 : 12);
      afterChange(); render();
      if (out.bonus) overlayScene('daily-bonus', { value: '+' + ((out.coins || 0) + 50), title: 'Alle opdrachten klaar!' });
      else if (out.levels && out.levels.length) overlayScene('levelup', { title: 'Level ' + out.levels[out.levels.length - 1].level + '!' });
    },
    'kit-open'() { S.picker = true; S.kq = ''; render(); loadKitList().then(() => { if (S.picker && !dead) render(); }); },
    'kit-close'() { S.picker = false; render(); },
    'kit-new'() { openMaker(null); },
    'kit-import'() { KM.openKitImport(kmOpts()).catch(() => toast('Kit-code laden lukt niet')); },
    async 'kit-edit'(d) { const k = await getKitById(d.id); if (!k) { toast('Deze kit is niet te laden'); return; } openMaker({ kit: k }); },
    async 'kit-copy'(d) { const k = await getKitById(d.id); if (!k || !k.qs || !k.qs.length) { toast('Deze kit is niet te laden'); return; } openMaker({ kit: { name: k.name, emoji: k.emoji, desc: k.desc, lang: k.lang, group: undefined, qs: k.qs }, copy: true }); },
    'kit-pick'(d) { S.kitId = d.id; S.picker = false; store.d.lastKit = d.id; store.save(); render(); },
    stop() {
      if (!S.stopArm) { S.stopArm = true; const b = root.querySelector('[data-act="stop"]'); if (b) { b.textContent = 'Echt stoppen?'; b.className = 'arm'; } later(() => { S.stopArm = false; const b2 = root && root.querySelector('[data-act="stop"]'); if (b2 && S.run) { b2.textContent = '✕'; b2.className = ''; } }, 3000); return; }
      S.stopArm = false; const n = S.run ? S.run.answers : 0; destroyRun(); S.screen = 'home'; render(); toast(n ? `Gestopt. ${n} antwoorden zijn wel geteld.` : 'Gestopt.');
    },
    snd() { const on = !(Snd.on !== false); try { Snd.setOn(on); } catch {} const b = root.querySelector('[data-act="snd"]'); if (b) b.textContent = on ? '🔊' : '🔇'; if (on) snd('klik'); },
    tts() { const on = !TTS.on; try { TTS.setOn(on); if (!on) TTS.stop(); } catch {} const b = root.querySelector('[data-act="tts"]'); if (b) b.textContent = on ? '🗣️' : '🤐'; },
    review() { S.reviewOpen = !S.reviewOpen; render(); },
    'save-misses'() {
      const r = S.result; if (!r || r.saved) return;
      try { Kits.save({ id: Kits.newId(), name: 'Mijn fouten', emoji: '🎯', desc: 'Vragen die ik miste in Learn Spel.', lang: (r.kitObj && r.kitObj.lang) || 'nl', qs: r.misses, src: 'user' }); r.saved = true; toast('Kit "Mijn fouten" is opgeslagen.'); loadKitList(); } catch (e) { toast('Opslaan lukte niet.'); }
      render();
    },
    again() { if (S.result && !S.result.duel) startGame(S.result.id); },
    settings() { try { openSettingsPanel({ title: 'Instellingen', toast }); } catch (e) { toast('Instellingen openen lukt niet'); } },
    worlds(d) { S.wsheet = d.id; render(); },
    'world-close'() { S.wsheet = ''; render(); },
    'world-set'(d) {
      try { Themes.setForGame(d.id, d.w); } catch {}
      snd('klik');
      const sc = root.querySelector('.lsp-wrow'), x = sc ? sc.scrollLeft : 0, y = (() => { try { return window.scrollY || 0; } catch { return 0; } })();
      render();
      const nr = root.querySelector('.lsp-wrow'); if (nr) nr.scrollLeft = x;
      try { window.scrollTo(0, y); } catch {}
    },
    'world-play'(d) { S.wsheet = ''; startGame(d.id); },
    'intro-toggle'() { store.d.intro = store.d.intro === 0 ? 1 : 0; store.save(); const b = root.querySelector('[data-act="intro-toggle"]'); if (b) b.className = 'lsp-tog' + (store.d.intro === 0 ? '' : ' on'); },
    noop() {},
  };
  const r4api = { esc, ic, fmt, meta, bigIcon };
  const api = {
    ctx, S, store, rerender: render, toast, snd, afterChange, extra, startGame, gameIds, meta, kitLabel, nice,
    name: myName, getKit: currentKit, pickQs: (kit, n, o) => pick(kit, n, o),
  };
  function onClick(e) {
    const t = e.target; if (!t || !t.closest) return;
    if (S.screen === 'play' && t.closest('.lsp-host')) return;   // klikken in het spel zelf zijn van het spel
    const el = t.closest('[data-act]'); if (!el) return;
    const act = el.dataset.act, data = el.dataset;
    if (act === 'noop') return;
    try {
      if (SIMPLE[act]) { SIMPLE[act](data); return; }
      if (Shop.shopAct(act, data, api)) return;
      if (Duel.duelsAct(act, data, api)) return;
    } catch (err) { toast('Oeps: ' + nice(err)); }
  }
  function onInput(e) {
    const t = e.target, k = t && t.dataset && t.dataset.inp; if (!k) return;
    if (k === 'pname') { try { if (P.setName) P.setName(t.value || ''); } catch {} return; }
    if (k === 'gsearch') { S.query = t.value || ''; updateGrid(); }
    else if (k === 'ksearch') { S.kq = t.value || ''; const l = root.querySelector('.lsp-sheet-list'); if (l) l.innerHTML = pickerListHTML(); }
  }
  function onResize() {
    const R = S.run; if (!R || !R.host) return;
    const sz = hostSize(R.host); R.env.w = sz.w; R.env.h = sz.h;
    try { R.inst && R.inst.resize && R.inst.resize(sz.w, sz.h); } catch {}
  }

  /* --- starten --- */
  let styleEl = null;
  if (doc_) { styleEl = doc_.createElement('style'); styleEl.id = 'lsp-css'; styleEl.textContent = Shop.CSS; (doc_.head || doc_.body || root).appendChild(styleEl); }
  let offSettings = null;
  try { offSettings = Settings.onChange(() => { if (!dead && S.screen !== 'play' && S.screen !== 'err' && S.screen !== 'result') render(); }); } catch {}
  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('resize', onResize);
  const destroy = () => {
    if (dead) return; dead = true;
    destroyRun(); stopScene();
    try { offSettings && offSettings(); } catch {}
    for (const t of timers) clearTimeout(t); timers.clear();
    try { root.removeEventListener('click', onClick); root.removeEventListener('input', onInput); } catch {}
    try { window.removeEventListener('resize', onResize); } catch {}
    try { styleEl && styleEl.remove(); } catch {}
    try { store.cloud(true); } catch {}
    try { r4s.cloud(true); } catch {}
    try { root.innerHTML = ''; } catch {}
  };
  if (ctx.addCleanup) ctx.addCleanup(destroy);

  await loadKitList();
  render();
  later(() => { probe(); }, 120);
  later(() => { store.pull(); r4s.pull(); }, 1500);
  return { destroy, state: S };
}
