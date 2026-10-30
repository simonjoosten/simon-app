// Memory – draai kaartjes om en vind de paren (vraag ↔ antwoord of plaatjes). Een gevonden paar houd je alleen als je de vraag goed beantwoordt.
// Drie rondes, beperkt aantal zetten en tijd; koop onderweg spiekjes, extra zetten en hints. Pure logica: createMemory.

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
export function emojiSpecs(n, rand) {
  const pool = EMO.slice(); const out = [];
  while (out.length < n && pool.length) { const e = pool.splice(Math.floor(rand() * pool.length), 1)[0]; out.push({ a: { txt: e, k: 'e' }, b: { txt: e, k: 'e' }, q: null }); }
  return out;
}

export function createMemory({ level = 2, rand = Math.random, fx = {}, makePairs } = {}) {
  const mvF = level === 1 ? 2.6 : level === 3 ? 1.6 : 2.0, tF = level === 1 ? 1.3 : level === 3 ? 0.85 : 1;
  const S = {
    round: 0, cards: [], specs: [], first: -1, second: -1, phase: 'pick', moves: 0, movesMax: 0, time: 0, timeMax: 0, score: 0, coins: Math.round(fx.startCash || 0), earned: 0,
    combo: 0, best: 0, matches: 0, correct: 0, wrong: 0, cleared: 0, free: { peek: fx.hints || 0, hint: 0 }, t: 0, firstMatch: null, log: [],
  };
  const m = { S };
  m.pairs = () => MEM_ROUNDS[S.round];
  function setup() {
    const n = MEM_ROUNDS[S.round];
    S.specs = (makePairs ? makePairs(n) : null) || [];
    if (S.specs.length < n) S.specs = S.specs.concat(emojiSpecs(n - S.specs.length, rand));
    S.cards = dealCards(S.specs, rand); S.first = S.second = -1; S.phase = 'pick';
    S.movesMax = S.moves = Math.round(n * mvF) + 2 * (fx.extraLives || 0);
    S.timeMax = S.time = Math.round(n * 16 * tF) + (fx.timeBonus || 0);
  }
  setup();
  m.left = () => S.cards.filter(c => c.state !== 'done').length / 2;
  function roundEnd(reason) {
    const done = m.left() === 0; let bonus = 0;
    if (done) { bonus = S.moves * 5 + Math.floor(S.time); S.cleared++; S.score += bonus; }
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
      const pts = 20 + 5 * Math.min(S.combo - 1, 8); S.score += pts;
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
.me-root{position:relative;display:flex;flex-direction:column;width:100%;box-sizing:border-box;background:var(--card);color:var(--ink);border-radius:14px;overflow:hidden;font-family:inherit;user-select:none;-webkit-user-select:none}
.me-hud{display:flex;justify-content:space-between;gap:6px;flex-wrap:wrap;padding:7px 12px;font-weight:800;font-size:14px;border-bottom:1px solid var(--line)}
.me-board{padding:10px;display:grid;grid-template-columns:repeat(4,1fr);gap:7px;background:linear-gradient(160deg,rgba(236,72,153,.1),rgba(99,102,241,.1))}
.me-card{position:relative;aspect-ratio:1/1;perspective:500px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.me-in{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .35s}
.me-card.up .me-in,.me-card.done .me-in,.me-card.peek .me-in{transform:rotateY(180deg)}
.me-f,.me-b{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:11px;display:flex;align-items:center;justify-content:center;text-align:center;padding:3px;box-sizing:border-box;line-height:1.12;font-weight:800;overflow:hidden;word-break:break-word}
.me-b{background:repeating-linear-gradient(45deg,#ec4899,#ec4899 8px,#db2777 8px,#db2777 16px);color:#fff;font-size:26px;box-shadow:0 3px 0 #9d174d}
.me-f{transform:rotateY(180deg);background:#fffbeb;color:#1f2937;border:2px solid #fbbf24;box-shadow:0 3px 0 #d97706}
.me-f.q{background:#eef2ff;border-color:#818cf8;color:#1e1b4b}.me-f.a{background:#ecfdf5;border-color:#34d399;color:#064e3b}
.me-card.done{opacity:.55}.me-card.done .me-f{border-color:#22c55e}
.me-card.hint{animation:mehint .5s 3}.me-card.claim .me-f{animation:meclaim .6s infinite alternate}
@keyframes mehint{50%{transform:scale(1.12)}}@keyframes meclaim{to{box-shadow:0 0 0 4px #facc15}}
.me-tools{display:flex;gap:6px;padding:0 10px 6px}
.me-tool{flex:1;border:1.5px solid var(--line);background:var(--card);color:var(--ink);border-radius:10px;padding:6px 4px;font-size:12px;font-weight:800;cursor:pointer}
.me-tool.can{border-color:#22c55e;background:rgba(34,197,94,.14)}
.me-panel{flex:1 1 auto;min-height:210px;padding:6px 8px 10px;border-top:1px solid var(--line)}
.me-info{padding:22px 12px;text-align:center;font-weight:700;opacity:.75;line-height:1.4}
.me-ov{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:20px;text-align:center;background:rgba(30,10,40,.86);color:#fff}
.me-ov h2{margin:0;font-size:26px}.me-ov p{margin:0;max-width:310px;font-size:15px;line-height:1.35}
.me-btn{background:var(--accent,#6366f1);color:#fff;border:0;border-radius:12px;padding:12px 26px;font-size:17px;font-weight:800;cursor:pointer}
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
    const m = createMemory({ level: env.level, rand, fx: env.fx || {}, makePairs });
    const S = m.S;

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
        const d = el('div', 'me-card'), inn = el('div', 'me-in'), b = el('div', 'me-b', '✨'), f = el('div', 'me-f ' + (c.face.k === 'q' ? 'q' : c.face.k === 'a' ? 'a' : ''));
        f.textContent = c.face.txt; const L = c.face.txt.length; f.style.fontSize = c.face.k === 'e' ? '34px' : L > 22 ? '10px' : L > 12 ? '12px' : L > 6 ? '15px' : '20px';
        inn.append(b, f); d.appendChild(inn); d.addEventListener('click', () => onCard(i)); board.appendChild(d); cardEls.push(d);
      });
      panel.innerHTML = '<div class="me-info">Tik op een kaartje om het om te draaien.<br>Onthoud waar alles ligt!</div>';
    }
    function sync() {
      S.cards.forEach((c, i) => { const d = cardEls[i]; if (!d) return; d.classList.toggle('up', c.state === 'up'); d.classList.toggle('done', c.state === 'done'); d.classList.toggle('claim', S.phase === 'claim' && (i === S.first || i === S.second)); });
      roundEl.textContent = '🃏 Ronde ' + (S.round + 1) + '/' + MEM_ROUNDS.length; movesEl.textContent = '👆 ' + S.moves; timeEl.textContent = '⏱ ' + mmss(S.time); coinEl.textContent = '💰 ' + fmt(S.coins); scoreEl.textContent = '⭐ ' + fmt(S.score);
      timeEl.style.color = S.time < 15 ? '#dc2626' : ''; movesEl.style.color = S.moves <= 3 ? '#dc2626' : '';
      const lab = { peek: '👁 Spiek', moves: '➕ 4 zetten', hint: '💡 Hint' };
      for (const k of Object.keys(toolEls)) { const p = m.price(k); toolEls[k].textContent = lab[k] + (p ? ' · 💰' + p : S.free[k] ? ' · gratis ×' + S.free[k] : ''); toolEls[k].className = 'me-tool' + (S.coins >= p ? ' can' : ''); }
    }
    function useTool(k) {
      if (!started || ended || busy && k !== 'moves') return;
      const r = m.use(k); if (!r) { snd('fout'); return; }
      snd('power');
      if (k === 'peek') { cardEls.forEach((d, i) => { if (S.cards[i].state !== 'done') d.classList.add('peek'); }); later(() => cardEls.forEach(d => d.classList.remove('peek')), 1700); }
      if (k === 'hint' && r.idx.length) { r.idx.forEach(i => cardEls[i].classList.add('hint')); later(() => r.idx.forEach(i => cardEls[i] && cardEls[i].classList.remove('hint')), 1700); }
      sync();
    }
    let ak = null;
    function onCard(i) {
      if (!started || ended || busy) return;
      const ev = m.flip(i); if (!ev) return;
      snd('tik'); sync();
      if (ev.type === 'mismatch') { busy = true; later(() => { snd('fout'); const r = m.resolveMismatch(); busy = false; sync(); if (r) handleRound(r); }, 900); }
      if (ev.type === 'match') {
        busy = true; snd('goed');
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
            const res = m.claim(!!r.ok); snd(r.ok ? 'munt' : 'fout');
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
      b.addEventListener('click', () => { ov.remove(); if (last) { finish(); return; } m.nextRound(); buildBoard(); busy = false; sync(); snd('klik'); });
      ov.appendChild(b); root.appendChild(ov); snd(r.done ? 'win' : 'level');
    }
    function finish() {
      if (ended) return; ended = true; clearInterval(iv);
      try { env.end({ score: S.score, win: m.win(), stats: { correct: S.correct, wrong: S.wrong, 'best streak': S.best, paren: S.matches, rondes: S.cleared }, summary: S.matches + ' paren gevonden, ' + S.cleared + '/' + MEM_ROUNDS.length + ' rondes gehaald' }); } catch (e) { /* hub */ }
    }
    function frame() {
      if (!started || ended || !root.isConnected) return;
      const r = m.tick(0.25); sync(); if (r) handleRound(r);
    }
    buildBoard(); sync();
    const intro = el('div', 'me-ov', '<h2>🃏 Memory</h2><p>Draai twee kaartjes om en zoek de paren. Heb je een paar, dan moet je een vraag goed beantwoorden om het te houden. Pas op voor tijd en zetten!</p>');
    const go = el('button', 'me-btn', 'Tik om te beginnen'); go.type = 'button';
    go.addEventListener('click', () => { intro.remove(); snd('klik'); started = true; iv = setInterval(frame, 250); });
    intro.appendChild(go); root.appendChild(intro);
    return {
      destroy() {
        dead = true; clearInterval(iv); timers.forEach(clearTimeout); timers.clear();
        try { ak && ak.cancel(); } catch (e) { /* ok */ }
        style.remove(); try { host.innerHTML = ''; } catch (e) { /* ok */ }
      },
    };
  },
};
