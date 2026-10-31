// Memory – draai kaartjes om en vind de paren (vraag ↔ antwoord of plaatjes). Een gevonden paar houd je alleen als je de vraag goed beantwoordt.
// Drie rondes, beperkt aantal zetten en tijd; koop onderweg spiekjes, extra zetten en hints. Pure logica: createMemory.

import { Gx } from './_gfx.js?v=1';

/* ---------- helpers ---------- */
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const fmt = n => Math.round(n).toLocaleString('nl-NL');
const mmss = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function fallbackQ(rand) { const a = 2 + Math.floor(rand() * 8), b = 2 + Math.floor(rand() * 8); const r = a * b; return { t: 'mc', q: a + ' × ' + b + ' = ?', a: String(r), o: [String(r), String(r + a), String(r - b), String(r + 2)].sort(() => rand() - 0.5), d: 1 }; }
function mkQSource(env) {
  let buf = [];
  return () => {
    if (!buf.length) { try { buf = (env.pick(10, {}) || []).slice(); } catch (e) { buf = []; } }
    return buf.shift() || fallbackQ(env.rand || Math.random);
  };
}

/* ---------- pure logica ---------- */
export const MEM_ROUNDS = [6, 8, 10];
export const MEM_COST = { peek: 12, moves: 16, hint: 20 };
const EMO = ['🍎', '🐶', '🚀', '🌈', '🎈', '🐸', '🍕', '⚽', '🎸', '🦄', '🌻', '🐙', '🍩', '🚲', '🎲', '🦋', '🍉', '⭐', '🐢', '🎁'];

// specs: [{ a:{txt,k}, b:{txt,k}, q? }] -> kaarten
export function dealCards(specs, rand) {
  const cards = [];
  specs.forEach((s, p) => { cards.push({ pair: p, face: s.a, state: 'down' }); cards.push({ pair: p, face: s.b, state: 'down' }); });
  for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
  return cards;
}
// Kaartthema's (3D-iconen met emoji-terugval). 'mix' = de oude emoji-set.
export const MEM_THEMES = {
  dieren: { name: 'Dieren', icon: 'panda', icons: ['dog', 'cat', 'rabbit', 'bear', 'penguin', 'lion', 'frog', 'duck', 'owl', 'bee', 'butterfly', 'snail', 'elephant', 'monkey', 'fox', 'panda', 'cow', 'pig', 'chicken', 'sheep', 'horse', 'turtle'] },
  eten: { name: 'Lekkers', icon: 'cupcake', icons: ['apple', 'banana', 'carrot', 'strawberry', 'grapes', 'watermelon', 'pizza', 'burger', 'fries', 'hotdog', 'icecream', 'donut', 'cake', 'cookie', 'candy', 'cupcake', 'cheese', 'bread', 'tomato', 'corn'] },
  ruimte: { name: 'Ruimte', icon: 'rocket', icons: ['rocket', 'planet', 'star', 'ufo', 'satellite', 'comet', 'astronaut', 'alien', 'earth', 'moon', 'sun', 'robot', 'crystal', 'gem', 'bolt'] },
  voertuigen: { name: 'Voertuigen', icon: 'car', icons: ['car', 'truck', 'bus', 'train', 'plane', 'boat', 'ship', 'tractor', 'helicopter', 'bike', 'submarine', 'rocket', 'foodtruck', 'ufo'] },
  fantasie: { name: 'Fantasie', icon: 'unicorn', icons: ['dragon', 'ghost', 'unicorn', 'wizard', 'fairy', 'mermaid', 'crystal', 'wand', 'castle', 'crown', 'sword', 'shield', 'potion', 'chest', 'ring', 'dino'] },
  mix: { name: 'Alles door elkaar', icon: 'puzzle', icons: null },
};
export const MEM_THEME_IDS = ['dieren', 'eten', 'ruimte', 'voertuigen', 'fantasie'];
// Spelmodi: klassiek, flits (kaarten even open aan het begin, minder zetten, 1,5x punten), express (veel minder tijd, 2x punten).
export const MEM_MODES = {
  klassiek: { name: 'Klassiek', desc: 'Rustig zoeken met genoeg zetten en tijd.', mv: 1, tm: 1, mult: 1, flash: 0 },
  flits: { name: 'Flitsgeheugen', desc: 'Alle kaartjes zijn 3 seconden open aan het begin. Minder zetten, 1,5x punten.', mv: 0.8, tm: 1, mult: 1.5, flash: 3 },
  express: { name: 'Express', desc: 'Veel minder tijd, maar dubbele punten.', mv: 1, tm: 0.6, mult: 2, flash: 0 },
};
export function emojiSpecs(n, rand, theme) {
  const T = MEM_THEMES[theme];
  const out = [];
  if (T && T.icons) {
    const pool = T.icons.slice();
    while (out.length < n && pool.length) { const e = pool.splice(Math.floor(rand() * pool.length), 1)[0]; out.push({ a: { txt: '', k: 'e', ic: e }, b: { txt: '', k: 'e', ic: e }, q: null }); }
    return out;
  }
  const pool = EMO.slice();
  while (out.length < n && pool.length) { const e = pool.splice(Math.floor(rand() * pool.length), 1)[0]; out.push({ a: { txt: e, k: 'e' }, b: { txt: e, k: 'e' }, q: null }); }
  return out;
}

export function createMemory({ level = 2, rand = Math.random, fx = {}, makePairs, mode = 'klassiek', themes, themeSeed = 0 } = {}) {
  const MD = MEM_MODES[mode] || MEM_MODES.klassiek; mode = MEM_MODES[mode] ? mode : 'klassiek';
  const mvF = (level === 1 ? 2.6 : level === 3 ? 1.6 : 2.0) * MD.mv, tF = (level === 1 ? 1.3 : level === 3 ? 0.85 : 1) * MD.tm;
  const TH = (themes && themes.length ? themes : MEM_THEME_IDS).slice();
  const startTheme = Math.abs(themeSeed | 0) % TH.length;
  const S = {
    mode, theme: 'mix', round: 0, cards: [], specs: [], first: -1, second: -1, phase: 'pick', moves: 0, movesMax: 0, time: 0, timeMax: 0, score: 0, coins: Math.round(fx.startCash || 0), earned: 0,
    combo: 0, best: 0, matches: 0, correct: 0, wrong: 0, cleared: 0, free: { peek: fx.hints || 0, hint: 0 }, t: 0, firstMatch: null, log: [],
  };
  const m = { S };
  m.pairs = () => MEM_ROUNDS[S.round];
  m.mode = MD;
  function setup() {
    const n = MEM_ROUNDS[S.round];
    S.specs = (makePairs ? makePairs(n) : null) || [];
    if (S.specs.length < n) { S.theme = TH[(startTheme + S.round) % TH.length]; S.specs = S.specs.concat(emojiSpecs(n - S.specs.length, rand, S.theme)); }
    S.cards = dealCards(S.specs, rand); S.first = S.second = -1; S.phase = 'pick';
    S.movesMax = S.moves = Math.round(n * mvF) + 2 * (fx.extraLives || 0);
    S.timeMax = S.time = Math.round(n * 16 * tF) + (fx.timeBonus || 0);
  }
  setup();
  m.left = () => S.cards.filter(c => c.state !== 'done').length / 2;
  function roundEnd(reason) {
    const done = m.left() === 0; let bonus = 0;
    if (done) { bonus = Math.round((S.moves * 5 + Math.floor(S.time)) * MD.mult); S.cleared++; S.score += bonus; }
    S.phase = 'round-end'; S.log.push({ round: S.round, done, reason, bonus });
    return { type: 'round-end', done, reason, bonus, last: S.round >= MEM_ROUNDS.length - 1 };
  }
  m.nextRound = () => { if (S.round >= MEM_ROUNDS.length - 1) { S.phase = 'over'; return false; } S.round++; setup(); return true; };
  m.flip = i => {
    const c = S.cards[i]; if (S.phase !== 'pick' || !c || c.state !== 'down') return null;
    c.state = 'up';
    if (S.first < 0) { S.first = i; return { type: 'first' }; }
    S.second = i; const a = S.cards[S.first];
    if (a.pair === c.pair) { S.phase = 'claim'; return { type: 'match', pair: c.pair, q: S.specs[c.pair].q }; }
    S.phase = 'mismatch'; S.moves--; S.combo = 0; return { type: 'mismatch' };
  };
  m.resolveMismatch = () => {
    if (S.phase !== 'mismatch') return null;
    S.cards[S.first].state = 'down'; S.cards[S.second].state = 'down'; S.first = S.second = -1; S.phase = 'pick';
    return S.moves <= 0 ? roundEnd('moves') : null;
  };
  m.claim = ok => {
    if (S.phase !== 'claim') return null;
    const a = S.cards[S.first], b = S.cards[S.second]; let ev;
    if (ok) {
      a.state = b.state = 'done'; S.matches++; S.correct++; S.combo++; S.best = Math.max(S.best, S.combo);
      const pts = Math.round((20 + 5 * Math.min(S.combo - 1, 8)) * MD.mult); S.score += pts;
      const c = Math.round((10 + Math.min(S.combo, 6)) * (fx.cashMult || 1)); S.coins += c; S.earned += c;
      if (S.firstMatch == null) S.firstMatch = S.t;
      ev = { type: 'claimed', pts, coins: c };
    } else {
      a.state = b.state = 'down'; S.wrong++; S.combo = 0; S.moves--; ev = { type: 'lost' };
    }
    S.first = S.second = -1; S.phase = 'pick';
    if (m.left() === 0) return [ev, roundEnd('clear')];
    if (S.moves <= 0) return [ev, roundEnd('moves')];
    return [ev];
  };
  m.tick = dt => {
    if (S.phase === 'round-end' || S.phase === 'over' || S.phase === 'claim') return null;
    S.t += dt; S.time -= dt;
    if (S.time <= 0) { S.time = 0; for (const c of S.cards) if (c.state === 'up') c.state = 'down'; S.first = S.second = -1; return roundEnd('time'); }
    return null;
  };
  m.price = k => (S.free[k] > 0 ? 0 : MEM_COST[k]);
  m.use = k => {
    if (S.phase === 'round-end' || S.phase === 'over' || !(k in MEM_COST)) return null;
    const p = m.price(k); if (S.coins < p) return null;
    if (k === 'moves' && S.moves >= S.movesMax + 12) return null;
    if (p === 0) S.free[k]--; else S.coins -= p;
    if (k === 'moves') { S.moves += 4; return { k }; }
    if (k === 'peek') return { k };
    const left = []; S.specs.forEach((s, p2) => { const idx = S.cards.map((c, i) => (c.pair === p2 && c.state === 'down' ? i : -1)).filter(i => i >= 0); if (idx.length === 2) left.push(idx); });
    return { k, idx: left.length ? left[Math.floor(rand() * left.length)] : [] };
  };
  m.done = () => S.phase === 'over' || (S.phase === 'round-end' && S.round >= MEM_ROUNDS.length - 1);
  m.win = () => S.cleared >= 2;
  return m;
}

/* ---------- stijl ---------- */
const CSS = `
.me-root{position:relative;display:flex;flex-direction:column;width:100%;box-sizing:border-box;background:transparent;color:var(--ink);border-radius:14px;overflow:hidden;font-family:inherit;user-select:none;-webkit-user-select:none;font-size:calc(16px*var(--gfx-font,1))}
.me-hud{display:flex;justify-content:flex-start;align-items:center;gap:7px;flex-wrap:wrap;padding:8px 58px 4px 10px;font-weight:800;font-size:calc(15px*var(--gfx-font,1))}
.me-hud span{display:inline-flex;align-items:center;gap:5px;background:var(--card);border-radius:99px;padding:5px 11px;box-shadow:0 2px 6px rgba(0,0,0,.18);min-height:34px}
.me-board{padding:10px;display:grid;grid-template-columns:repeat(4,1fr);gap:calc(10px*var(--gfx-scale,1))}
.me-card{position:relative;aspect-ratio:1/1;perspective:600px;cursor:pointer;-webkit-tap-highlight-color:transparent;min-height:64px}
.me-in{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .35s}
html[data-reduce="1"] .me-in{transition:none}
.me-card.up .me-in,.me-card.done .me-in,.me-card.peek .me-in{transform:rotateY(180deg)}
.me-f,.me-b{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:16px;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px;box-sizing:border-box;line-height:1.12;font-weight:800;overflow:hidden;word-break:break-word}
.me-b{background:linear-gradient(145deg,rgba(255,255,255,.3),rgba(0,0,0,.22)),var(--gx-a,#ec4899);color:#fff;box-shadow:0 5px 0 rgba(0,0,0,.28),0 8px 14px rgba(0,0,0,.25);border:2px solid rgba(255,255,255,.55)}
.me-b .gx-ic{opacity:.92}
.me-f{transform:rotateY(180deg);background:#fffbeb;color:#1f2937;border:3px solid #fbbf24;box-shadow:0 5px 0 #d97706,0 8px 14px rgba(0,0,0,.2)}
.me-f.q{background:#eef2ff;border-color:#818cf8;color:#1e1b4b;box-shadow:0 5px 0 #4f46e5,0 8px 14px rgba(0,0,0,.2)}.me-f.a{background:#ecfdf5;border-color:#34d399;color:#064e3b;box-shadow:0 5px 0 #059669,0 8px 14px rgba(0,0,0,.2)}
.me-card.done{opacity:.6}.me-card.done .me-f{border-color:#22c55e}
.me-card.hint{animation:mehint .5s 3}.me-card.claim .me-f{animation:meclaim .6s infinite alternate}
@keyframes mehint{50%{transform:scale(1.12)}}@keyframes meclaim{to{box-shadow:0 0 0 5px #facc15}}
.me-tools{display:flex;gap:8px;padding:0 10px 8px}
.me-tool{flex:1;min-height:52px;border:2px solid var(--line);background:var(--card);color:var(--ink);border-radius:14px;padding:6px 4px;font-size:calc(13px*var(--gfx-font,1));font-weight:800;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;box-shadow:0 2px 6px rgba(0,0,0,.15)}
.me-tool.can{border-color:#22c55e;background:var(--card);box-shadow:0 0 0 2px rgba(34,197,94,.45),0 2px 6px rgba(0,0,0,.15)}
.me-panel{flex:1 1 auto;min-height:210px;padding:8px 10px 12px;margin:0 8px 8px;background:var(--card);border-radius:18px;box-shadow:0 3px 12px rgba(0,0,0,.18)}
.me-info{padding:22px 12px;text-align:center;font-weight:700;opacity:.8;line-height:1.4}
.me-ov{position:absolute;inset:0;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px;text-align:center;background:rgba(15,10,35,.84);color:#fff}
.me-ov h2{margin:0;font-size:calc(28px*var(--gfx-font,1))}.me-ov p{margin:0;max-width:330px;font-size:calc(16px*var(--gfx-font,1));line-height:1.4}
.me-btn{background:var(--accent,#6366f1);color:#fff;border:0;border-radius:16px;padding:15px 30px;min-height:54px;font-size:calc(18px*var(--gfx-font,1));font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.35)}
.me-modes{display:flex;flex-direction:column;gap:8px;width:100%;max-width:340px}
.me-mode{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:2px;min-height:58px;border:3px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff;border-radius:16px;padding:8px 14px;font:inherit;font-weight:800;cursor:pointer}
.me-mode small{font-weight:600;opacity:.85;font-size:.8em}
.me-mode.on{border-color:#facc15;background:rgba(250,204,21,.22)}
.me-theme{display:inline-flex;align-items:center;gap:6px}
`;

/* ---------- het spel ---------- */
export default {
  id: 'memory', name: 'Memory', emoji: '🃏', color: '#ec4899',
  desc: 'Vind de paren (vraag en antwoord of plaatjes). Een gevonden paar houd je alleen met een goed antwoord. Drie rondes, zetten en tijd zijn beperkt!',
  tags: ['denken', 'rustig', 'solo'], minutes: 5, duo: false,
  create(host, env) {
    let dead = false, ended = false, iv = 0, started = false, busy = false;
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms); timers.add(id); return id; };
    const snd = n => { try { env.snd && env.snd.play(n); } catch (e) { /* stil */ } };
    const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    host.innerHTML = '';
    const root = el('div', 'me-root'); root.style.minHeight = Math.max(560, env.h || 620) + 'px'; host.appendChild(root);
    const gx = Gx.start(root, env, 'memory');
    const backIc = (gx.world.deco && gx.world.deco[0]) || 'star';
    const nextQ = mkQSource(env);
    const rand = env.rand || Math.random;

    // paren uit de kit: korte vraag ↔ kort antwoord
    function shortAns(q) {
      if (!q) return null;
      if (q.t === 'tf' || q.t === 'order' || q.t === 'match' || q.t === 'multi') return null;
      let a = q.a; if (typeof a === 'number') a = String(a); if (typeof a !== 'string') return null;
      return a.length <= 20 ? a : null;
    }
    function makePairs(n) {
      let pool = []; try { pool = env.pick(n * 4, {}) || []; } catch (e) { pool = []; }
      const out = [], seen = new Set();
      for (const q of pool) {
        const a = shortAns(q), face = q.e && String(q.q).length > 30 ? q.e : String(q.q || '').replace('___', '…');
        if (!a || face.length > 34 || seen.has(a.toLowerCase())) continue;
        seen.add(a.toLowerCase()); out.push({ a: { txt: (q.e ? q.e + ' ' : '') + face, k: 'q' }, b: { txt: a, k: 'a' }, q });
        if (out.length >= n) break;
      }
      return out;
    }
    let mode = 'klassiek';
    const mk = md => createMemory({ level: env.level, rand, fx: env.fx || {}, makePairs, mode: md, themeSeed: (env.seed | 0) });
    let m = mk(mode), S = m.S;

    const hud = el('div', 'me-hud'); const roundEl = el('span'), movesEl = el('span'), timeEl = el('span'), coinEl = el('span'), scoreEl = el('span');
    hud.append(roundEl, movesEl, timeEl, coinEl, scoreEl); root.appendChild(hud);
    const board = el('div', 'me-board'); root.appendChild(board);
    const tools = el('div', 'me-tools'); root.appendChild(tools);
    const panel = el('div', 'me-panel'); root.appendChild(panel);
    let cardEls = [];
    const toolEls = { peek: el('button', 'me-tool'), moves: el('button', 'me-tool'), hint: el('button', 'me-tool') };
    Object.entries(toolEls).forEach(([k, b]) => { b.type = 'button'; b.addEventListener('click', () => useTool(k)); tools.appendChild(b); });

    function buildBoard() {
      board.innerHTML = ''; cardEls = []; board.style.gridTemplateColumns = 'repeat(' + (S.cards.length >= 20 ? 5 : 4) + ',1fr)';
      S.cards.forEach((c, i) => {
        const d = el('div', 'me-card'), inn = el('div', 'me-in'), b = el('div', 'me-b', Gx.ic(backIc, S.cards.length >= 20 ? 40 : 52, '✨')), f = el('div', 'me-f ' + (c.face.k === 'q' ? 'q' : c.face.k === 'a' ? 'a' : ''));
        const L = c.face.txt.length;
        if (c.face.ic) f.innerHTML = Gx.ic(c.face.ic, S.cards.length >= 20 ? 56 : 72, c.face.txt || undefined);
        else { f.textContent = c.face.txt; f.style.fontSize = c.face.k === 'e' ? '40px' : L > 22 ? '12px' : L > 12 ? '14px' : L > 6 ? '17px' : '23px'; }
        inn.append(b, f); d.appendChild(inn); d.addEventListener('click', () => onCard(i)); board.appendChild(d); cardEls.push(d);
      });
      panel.innerHTML = '<div class="me-info">Tik op een kaartje om het om te draaien.<br>Onthoud waar alles ligt!</div>';
    }
    function flash(sec) { if (!sec) return; busy = true; cardEls.forEach(d => d.classList.add('peek')); later(() => { cardEls.forEach(d => d.classList.remove('peek')); busy = false; }, sec * 1000); }
    function sync() {
      S.cards.forEach((c, i) => { const d = cardEls[i]; if (!d) return; d.classList.toggle('up', c.state === 'up'); d.classList.toggle('done', c.state === 'done'); d.classList.toggle('claim', S.phase === 'claim' && (i === S.first || i === S.second)); });
      roundEl.innerHTML = Gx.ic(MEM_THEMES[S.theme] ? MEM_THEMES[S.theme].icon : 'puzzle', 24, '🃏') + ' Ronde ' + (S.round + 1) + '/' + MEM_ROUNDS.length; movesEl.innerHTML = Gx.ic('target', 24, '👆') + ' ' + S.moves; timeEl.innerHTML = Gx.ic('hourglass', 24, '⏱') + ' ' + mmss(S.time); coinEl.innerHTML = Gx.ic('coin', 24, '💰') + ' ' + fmt(S.coins); scoreEl.innerHTML = Gx.ic('star', 24, '⭐') + ' ' + fmt(S.score);
      timeEl.style.color = S.time < 15 ? '#dc2626' : ''; movesEl.style.color = S.moves <= 3 ? '#dc2626' : '';
      const lab = { peek: Gx.ic('lightbulb', 26, '👁') + '<span>Spiek</span>', moves: Gx.ic('clover', 26, '➕') + '<span>+4 zetten</span>', hint: Gx.ic('magnet', 26, '💡') + '<span>Hint</span>' };
      for (const k of Object.keys(toolEls)) { const p = m.price(k); toolEls[k].innerHTML = lab[k] + '<small>' + (p ? Gx.ic('coin', 14, '💰') + ' ' + p : S.free[k] ? 'gratis ×' + S.free[k] : 'gratis') + '</small>'; toolEls[k].className = 'me-tool' + (S.coins >= p ? ' can' : ''); }
    }
    function useTool(k) {
      if (!started || ended || busy && k !== 'moves') return;
      const r = m.use(k); if (!r) { snd('fout'); return; }
      snd('power'); gx.burstEl(toolEls[k], 'sparkle', 10);
      if (k === 'peek') { cardEls.forEach((d, i) => { if (S.cards[i].state !== 'done') d.classList.add('peek'); }); later(() => cardEls.forEach(d => d.classList.remove('peek')), 1700); }
      if (k === 'hint' && r.idx.length) { r.idx.forEach(i => cardEls[i].classList.add('hint')); later(() => r.idx.forEach(i => cardEls[i] && cardEls[i].classList.remove('hint')), 1700); }
      sync();
    }
    let ak = null;
    function onCard(i) {
      if (!started || ended || busy) return;
      const ev = m.flip(i); if (!ev) return;
      snd('tik'); sync(); gx.burstEl(cardEls[i], 'sparkle', 4, { power: 0.4 });
      if (ev.type === 'mismatch') { busy = true; later(() => { snd('fout'); const r = m.resolveMismatch(); busy = false; sync(); if (r) handleRound(r); }, 900); }
      if (ev.type === 'match') {
        busy = true; snd('goed'); gx.burstEl(cardEls[S.first], 'stars', 10); gx.burstEl(cardEls[S.second], 'stars', 10);
        later(() => {
          if (S.phase !== 'claim') return;
          try { panel.scrollIntoView && panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { /* ok */ }
          panel.innerHTML = ''; const h = el('div', 'me-info', '🎉 Een paar! Beantwoord de vraag om het te houden.'); h.style.padding = '4px'; const box = el('div'); panel.append(h, box);
          const q = ev.q || nextQ(); let handle = null, cancelled = false;
          try { handle = env.ask(box, q, { compact: true, feedback: true, autoNext: 600 }); } catch (e) { handle = null; }
          ak = { cancel() { cancelled = true; try { handle && handle.cancel(); } catch (e) { /* ok */ } } };
          const fin = r => {
            if (cancelled || dead) return;
            try { env.report({ q, ok: !!r.ok, ms: r.ms || 0 }); } catch (e) { /* hub */ }
            const i1 = S.first, i2 = S.second; const res = m.claim(!!r.ok); snd(r.ok ? 'munt' : 'fout'); if (r.ok) { gx.burstEl(cardEls[i1], 'coins', 6); gx.burstEl(cardEls[i2], 'sparkle', 12); }
            later(() => { panel.innerHTML = '<div class="me-info">' + (r.ok ? '✅ Paar is van jou! Ga zo door.' : '❌ Helaas, het paar draait terug. Onthoud waar het ligt!') + '</div>'; busy = false; sync(); if (res && res[1]) handleRound(res[1]); }, 450);
            sync();
          };
          if (handle) handle.promise.then(fin, () => fin({ ok: false, ms: 0 })); else fin({ ok: false, ms: 0 });
        }, 700);
      }
    }
    function handleRound(r) {
      busy = true; if (ak) ak.cancel();
      const reason = { clear: '🎉 Alle paren gevonden!', moves: '👆 Geen zetten meer', time: '⏱ Tijd is op' }[r.reason];
      const last = r.last;
      const ov = el('div', 'me-ov', '<h2>' + (r.done ? '🌟 Ronde gehaald!' : 'Ronde voorbij') + '</h2><p>' + reason + (r.done ? '<br>Bonus: +' + r.bonus + ' punten' : '<br>Er lagen nog ' + m.left() + ' paren.') + '</p>');
      const b = el('button', 'me-btn', last ? 'Klaar' : 'Volgende ronde ▶'); b.type = 'button';
      b.addEventListener('click', () => { ov.remove(); if (last) { finish(); return; } m.nextRound(); buildBoard(); busy = false; sync(); snd('klik'); flash(m.mode.flash); });
      ov.appendChild(b); root.appendChild(ov); snd(r.done ? 'win' : 'level'); if (r.done) gx.burst((root.clientWidth || 360) / 2, 160, 'confetti', 50, { spread: 2.4 });
    }
    function finish() {
      if (ended) return; ended = true; clearInterval(iv);
      try { env.end({ score: S.score, win: m.win(), stats: { correct: S.correct, wrong: S.wrong, 'best streak': S.best, paren: S.matches, rondes: S.cleared }, summary: S.matches + ' paren gevonden, ' + S.cleared + '/' + MEM_ROUNDS.length + ' rondes gehaald (' + m.mode.name + ')' }); } catch (e) { /* hub */ }
    }
    function frame() {
      if (!started || ended || !root.isConnected) return;
      const r = m.tick(0.25); sync(); if (r) handleRound(r);
    }
    buildBoard(); sync();
    const intro = el('div', 'me-ov', '<h2>' + Gx.ic('puzzle', 40, '🃏') + ' Memory</h2><p>Draai twee kaartjes om en zoek de paren. Heb je een paar, dan moet je een vraag goed beantwoorden om het te houden.</p>');
    const modesBox = el('div', 'me-modes'); const modeBtns = {};
    Object.entries(MEM_MODES).forEach(([id, md]) => {
      const b = el('button', 'me-mode' + (id === mode ? ' on' : ''), '<span>' + md.name + '</span><small>' + md.desc + '</small>'); b.type = 'button';
      b.addEventListener('click', () => { mode = id; Object.entries(modeBtns).forEach(([k, x]) => { x.className = 'me-mode' + (k === id ? ' on' : ''); }); snd('klik'); });
      modeBtns[id] = b; modesBox.appendChild(b);
    });
    intro.appendChild(modesBox);
    const go = el('button', 'me-btn', 'Tik om te beginnen'); go.type = 'button';
    go.addEventListener('click', () => { intro.remove(); snd('klik'); if (mode !== 'klassiek') { m = mk(mode); S = m.S; buildBoard(); } sync(); started = true; iv = setInterval(frame, 250); flash(m.mode.flash); });
    intro.appendChild(go); root.appendChild(intro);
    return {
      destroy() {
        dead = true; clearInterval(iv); timers.forEach(clearTimeout); timers.clear(); gx.destroy();
        try { ak && ak.cancel(); } catch (e) { /* ok */ }
        style.remove(); try { host.innerHTML = ''; } catch (e) { /* ok */ }
      },
    };
  },
};
