// Ronde 4 (Creatief): vijf nieuwe dobbelspellen voor Dobbel & kies, plus extra draaiwiel-voorbeelden.
//  hl   = Hoger of lager (d10, hoe lang hou je het vol?)
//  derby= Dobbelrace (kies een renner 2-12, twee stenen bepalen wie opschuift)
//  bj   = Eenentwintig (tegen de computer, niet over de 21)
//  ms   = Dagmissie (elke dag een andere opdracht met 5 stenen en 3 worpen)
//  gs   = Raad de som (raad de uitkomst van drie stenen, 8 rondes)
// Spelregels zijn puur (testbaar met node); de schermen staan onderaan en krijgen hun hulpmiddelen van dice.js mee.

export const R4_GAMES = {
  hl: { title: 'Hoger of lager', icon: 'target', sub: 'Hoe lang haal jij het?' },
  derby: { title: 'Dobbelrace', icon: 'rocket', sub: 'Kies je renner en juich' },
  bj: { title: 'Eenentwintig', icon: 'coin', sub: 'Dichtbij 21, niet erover' },
  ms: { title: 'Dagmissie', icon: 'medal', sub: 'Elke dag een nieuwe opdracht' },
  gs: { title: 'Raad de som', icon: 'crystal', sub: 'Voorspel de dobbelstenen' },
};
export const isR4Game = (g) => Object.prototype.hasOwnProperty.call(R4_GAMES, g);

const defRand = (n) => Math.floor(Math.random() * n);

// ---------- Hoger of lager ----------
export const HL_SIDES = 10;
export function hlNew(best = 0, r = defRand) { return { cur: 1 + r(HL_SIDES), streak: 0, best: best | 0, over: false, last: null, msg: '' }; }
export function hlGuess(g, dir, r = defRand) {
  if (g.over || (dir !== 'hoger' && dir !== 'lager')) return g;
  const prev = g.cur, next = 1 + r(HL_SIDES); g.last = prev; g.cur = next;
  if (next === prev) { g.msg = 'Gelijk! Dat telt niet fout.'; return g; }
  const ok = dir === 'hoger' ? next > prev : next < prev;
  if (ok) { g.streak++; g.best = Math.max(g.best, g.streak); g.msg = 'Goed!'; } else { g.over = true; g.msg = `Helaas, ${next} is niet ${dir} dan ${prev}.`; }
  return g;
}
// kans dat "hoger"/"lager" klopt (voor het hint-knopje)
export const hlOdds = (cur) => ({ hoger: (HL_SIDES - cur) / HL_SIDES, lager: (cur - 1) / HL_SIDES });

// ---------- Dobbelrace (derby) ----------
export const DERBY_LEN = { 2: 2, 3: 3, 4: 5, 5: 6, 6: 8, 7: 9, 8: 8, 9: 6, 10: 5, 11: 3, 12: 2 };
export const DERBY_RUNNERS = Object.keys(DERBY_LEN).map(Number);
export const DERBY_NAMES = { 2: 'Slak', 3: 'Egel', 4: 'Konijn', 5: 'Hond', 6: 'Vos', 7: 'Paard', 8: 'Panda', 9: 'Leeuw', 10: 'Haai', 11: 'Draak', 12: 'Raket' };
export function derbyNew(pick) { return { pick: DERBY_RUNNERS.includes(pick) ? pick : 7, pos: Object.fromEntries(DERBY_RUNNERS.map((k) => [k, 0])), rolls: 0, winner: null, last: null }; }
export function derbyRoll(g, a, b) {
  if (g.winner != null) return g;
  const s = a + b; g.last = s; g.rolls++;
  if (DERBY_LEN[s]) { g.pos[s]++; if (g.pos[s] >= DERBY_LEN[s]) g.winner = s; }
  return g;
}
export const derbyWon = (g) => g.winner === g.pick;

// ---------- Eenentwintig ----------
export function bjNew() { return { me: [], comp: [], phase: 'speler', result: null }; }
export const bjTotal = (a) => a.reduce((x, y) => x + y, 0);
export function bjHit(g, v) {
  if (g.phase !== 'speler') return g;
  g.me.push(v);
  if (bjTotal(g.me) > 21) { g.phase = 'klaar'; g.result = 'verloren'; } else if (bjTotal(g.me) === 21) return bjStand(g, () => v);
  return g;
}
export function bjStand(g, r = () => 1 + defRand(6)) {
  if (g.phase !== 'speler') return g;
  g.phase = 'comp'; const mine = bjTotal(g.me);
  // de computer gooit tot hij minstens 17 heeft of tot hij je heeft bereikt (gelijk of hoger)
  while (bjTotal(g.comp) < 17 && bjTotal(g.comp) < mine && g.comp.length < 12) g.comp.push(r());
  const c = bjTotal(g.comp); g.phase = 'klaar';
  g.result = c > 21 ? 'gewonnen' : mine > c ? 'gewonnen' : mine === c ? 'gelijk' : 'verloren';
  return g;
}

// ---------- Dagmissie ----------
const cnt = (d) => { const m = {}; d.forEach((v) => { m[v] = (m[v] || 0) + 1; }); return m; };
const maxSame = (d) => Math.max(...Object.values(cnt(d)));
const longestRun = (d) => { const u = [...new Set(d)].sort((a, b) => a - b); let best = 1, run = 1; for (let i = 1; i < u.length; i++) { run = u[i] === u[i - 1] + 1 ? run + 1 : 1; best = Math.max(best, run); } return best; };
export const MISSIONS = [
  { id: 'drie', text: 'Gooi drie dezelfde', check: (d) => maxSame(d) >= 3 },
  { id: 'vier', text: 'Gooi vier dezelfde', check: (d) => maxSame(d) >= 4 },
  { id: 'straat4', text: 'Gooi een straatje van 4 (bijv. 2-3-4-5)', check: (d) => longestRun(d) >= 4 },
  { id: 'hoog', text: 'Gooi samen 24 of meer', check: (d) => bjTotal(d) >= 24 },
  { id: 'laag', text: 'Gooi samen 11 of minder', check: (d) => bjTotal(d) <= 11 },
  { id: 'even', text: 'Gooi alleen even getallen', check: (d) => d.every((v) => v % 2 === 0) },
  { id: 'oneven', text: 'Gooi alleen oneven getallen', check: (d) => d.every((v) => v % 2 === 1) },
  { id: 'fullhouse', text: 'Gooi een full house (3 + 2 dezelfde)', check: (d) => { const v = Object.values(cnt(d)).sort(); return v.length === 2 && v[0] === 2 && v[1] === 3; } },
  { id: 'straat5', text: 'Gooi een straat van 5', check: (d) => longestRun(d) >= 5 },
  { id: 'twee-paar', text: 'Gooi twee paren', check: (d) => Object.values(cnt(d)).filter((x) => x >= 2).length >= 2 },
];
export const MISSION_BY_ID = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));
export const dayNumber = (t = Date.now()) => Math.floor(t / 86400000);
export const missionOf = (day = dayNumber()) => MISSIONS[((day * 7 + 3) % MISSIONS.length + MISSIONS.length) % MISSIONS.length];
export function msNew(day = dayNumber()) { return { day, mission: missionOf(day).id, dice: [0, 0, 0, 0, 0], held: [false, false, false, false, false], rolls: 0, state: 'bezig' }; }
export function msRoll(g, r = defRand) {
  if (g.state !== 'bezig' || g.rolls >= 3) return g;
  g.dice = g.dice.map((v, i) => (g.rolls > 0 && g.held[i] ? v : 1 + r(6))); g.rolls++;
  if (MISSION_BY_ID[g.mission].check(g.dice)) g.state = 'gehaald'; else if (g.rolls >= 3) g.state = 'mislukt';
  return g;
}
export function msHold(g, i) { if (g.rolls === 0 || g.state !== 'bezig' || i < 0 || i > 4) return false; g.held[i] = !g.held[i]; return true; }

// ---------- Raad de som ----------
export const GS_ROUNDS = 8, GS_DICE = 3;
export function gsNew(best = 0) { return { round: 0, points: 0, best: best | 0, last: null, done: false }; }
export function gsPoints(guess, sum) { const d = Math.abs(guess - sum); return d === 0 ? 10 : Math.max(0, 6 - d); }
export function gsPlay(g, guess, dice) {
  if (g.done) return g;
  const sum = bjTotal(dice), p = gsPoints(guess, sum); g.last = { guess, sum, p, dice: dice.slice() }; g.points += p; g.round++;
  if (g.round >= GS_ROUNDS) { g.done = true; g.best = Math.max(g.best, g.points); }
  return g;
}

// ---------- Extra draaiwielen ----------
export const R4_WHEELS = {
  'Dagje uit': ['Dierentuin', 'Zwembad', 'Pretpark', 'Bos', 'Strand', 'Museum', 'Bioscoop', 'Speeltuin'],
  'Wie ruimt op?': ['Mama', 'Papa', 'Jij', 'Broer of zus', 'Iedereen!'],
  'Dier-opdracht': ['Loop als een eend', 'Spring als een kikker', 'Brul als een leeuw', 'Kruip als een slak', 'Vlieg als een vogel', 'Zwem als een vis'],
  'Superkracht': ['Onzichtbaar', 'Supersnel', 'Vliegen', 'Gedachten lezen', 'Superkracht', 'Praten met dieren', 'Tijdreizen'],
  'Ijsje kiezen': ['Vanille', 'Chocola', 'Aardbei', 'Pistache', 'Citroen', 'Stracciatella'],
  'Kleur kiezen': ['Rood', 'Blauw', 'Geel', 'Groen', 'Paars', 'Oranje', 'Roze'],
  'Sport': ['Voetbal', 'Zwemmen', 'Tennis', 'Hardlopen', 'Fietsen', 'Dansen', 'Turnen'],
  'Strafje of klusje': ['Handen wassen', 'Kamer opruimen', 'Tafel dekken', 'Planten water geven', 'Hond uitlaten', 'Een tekening maken'],
};

// ---------- Schermen ----------
// env = { body, esc, icon, rand, mkDice, rollAll, sfx, say, playScene, token, store:{get,set}, sleep }
export function mountR4(g, env) {
  const { body } = env; const st = env.store;
  const best = (k) => (st.get('best') || {})[k] | 0, setBest = (k, v) => { const b = st.get('best') || {}; if (v > (b[k] | 0)) { b[k] = v; st.set('best', b); } };
  const my = env.token(), stale = () => env.token() !== my;
  const btn = (act, label, extra = '') => `<button data-r4="${act}" ${extra} style="min-height:48px;min-width:48px">${label}</button>`;
  const die = (n) => Array.from({ length: n }, (_, i) => `<canvas class="d3" data-i="${i}"></canvas>`).join('');
  const wrap = (inner) => { body.innerHTML = `<div class="dc-table" id="r4-t">${inner}</div>`; };
  const on = (fn) => { body.onclick = (e) => { const b = e.target.closest && e.target.closest('[data-r4]'); if (!b || b.disabled) return; fn(b.dataset.r4, b); }; };

  if (g === 'hl') {
    const S = env.state('hl', () => hlNew(best('hl')));
    const show = (value, label) => { env.mkDice('#r4-t canvas.d3', [{ sides: HL_SIDES, color: env.colorOf(), value, label }]); };
    const render = () => {
      const o = hlOdds(S.cur);
      wrap(`<div class="dc-big">Reeks: ${S.streak} &middot; Record: ${S.best}</div><div style="text-align:center">${die(1)}</div>
        <div style="text-align:center;min-height:1.6rem;font-weight:700">${S.over ? `${env.esc(S.msg)}` : S.last ? env.esc(S.msg) : 'Is de volgende worp hoger of lager?'}</div>
        <div style="text-align:center">${S.over ? btn('again', 'Nog een keer') : `${btn('hoger', '⬆ Hoger')} ${btn('lager', '⬇ Lager')}`}</div>
        <div style="text-align:center;font-size:.85rem;opacity:.85;margin-top:.4rem">Een gelijke worp telt niet fout. Kans op hoger: ${Math.round(o.hoger * 100)}%, op lager: ${Math.round(o.lager * 100)}%.</div>`);
      show(S.cur);
    };
    render();
    on(async (a) => {
      if (a === 'again') { Object.assign(S, hlNew(best('hl'))); render(); return; }
      if (S.over) return; const prev = S.cur, wasStreak = S.streak;
      body.querySelectorAll('[data-r4]').forEach((b) => { b.disabled = true; });
      hlGuess(S, a, env.rand); env.sfx('roll');
      try { await env.rollAll(env.dice(), [S.cur], 700); } catch { /* stil */ }
      if (stale()) return;
      if (S.over) { env.sfx('bad'); setBest('hl', S.best); } else { env.sfx(S.streak > wasStreak ? 'pop' : 'tick'); if (S.streak > 0 && S.streak % 5 === 0 && S.streak > wasStreak) { env.playScene('victory', { title: `${S.streak} goed achter elkaar!` }); } setBest('hl', S.best); }
      void prev; const keepMsg = S.msg; render(); env.say(keepMsg);
    });
  } else if (g === 'derby') {
    const S = env.state('derby', () => ({ g: null, pick: 7, running: false }));
    const render = () => {
      if (!S.g) {
        wrap(`<div class="dc-big">Kies je renner</div><div style="display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center">${DERBY_RUNNERS.map((k) => `<button data-r4="pick" data-v="${k}" class="${k === S.pick ? 'on' : ''}" style="min-height:52px;min-width:72px"><b>${k}</b><br><small>${DERBY_NAMES[k]}</small></button>`).join('')}</div>
          <div style="text-align:center;margin-top:.5rem">${btn('go', '🏁 Start de race!')}</div>
          <div style="text-align:center;font-size:.85rem;opacity:.85;margin-top:.4rem">Twee dobbelstenen: de som bepaalt wie een stap vooruit mag. De 7 komt het vaakst, maar de baan is ook het langst. Eerlijk!</div>`);
        return;
      }
      const G2 = S.g;
      wrap(`<div style="text-align:center">${die(2)}</div><div class="dc-big">${G2.winner != null ? (derbyWon(G2) ? '🎉 Jouw renner wint!' : `${DERBY_NAMES[G2.winner]} (${G2.winner}) wint!`) : (G2.last ? `Worp: ${G2.last}` : 'Daar gaan ze…')}</div>
        <div style="display:grid;gap:3px">${DERBY_RUNNERS.map((k) => `<div style="display:flex;align-items:center;gap:6px"><span style="width:4.6rem;font-size:.8rem;${k === G2.pick ? 'font-weight:800' : ''}">${k} ${DERBY_NAMES[k]}</span><div style="flex:1;height:16px;border-radius:8px;background:#0002;position:relative"><i style="position:absolute;left:0;top:0;bottom:0;border-radius:8px;width:${Math.round(G2.pos[k] / DERBY_LEN[k] * 100)}%;background:${k === G2.pick ? '#f59e0b' : '#38bdf8'}"></i></div></div>`).join('')}</div>
        <div style="text-align:center;margin-top:.5rem">${G2.winner != null ? btn('new', 'Nog een race') : (S.running ? '<small>De race loopt…</small>' : btn('go', '⏸ Hervat'))}</div>`);
      env.mkDice('#r4-t canvas.d3', [{ sides: 6, color: env.colorOf(), value: (S.dd || [1, 1])[0], pips: true }, { sides: 6, color: '#2563eb', value: (S.dd || [1, 1])[1], pips: true }]);
    };
    const run = async () => {
      if (S.running) return; S.running = true;
      while (S.g && S.g.winner == null && !stale()) {
        const a = 1 + env.rand(6), b = 1 + env.rand(6); S.dd = [a, b]; derbyRoll(S.g, a, b); render(); env.sfx('roll');
        try { await env.rollAll(env.dice(), [a, b], 420); } catch { /* stil */ }
        if (stale()) { S.running = false; return; }
        await env.sleep(260);
      }
      S.running = false; if (stale()) return;
      if (S.g && S.g.winner != null) { const won = derbyWon(S.g); env.sfx(won ? 'win' : 'bad'); if (won) env.playScene('victory', { title: 'Jouw renner wint!' }); const b = st.get('derby') || { w: 0, n: 0 }; b.n++; if (won) b.w++; st.set('derby', b); env.say(`Jouw renners hebben ${b.w} van de ${b.n} races gewonnen.`); }
      render();
    };
    render();
    on((a, b) => {
      if (a === 'pick') { S.pick = +b.dataset.v; render(); } else if (a === 'go') { if (!S.g) S.g = derbyNew(S.pick); run(); } else if (a === 'new') { S.g = null; render(); }
    });
  } else if (g === 'bj') {
    const S = env.state('bj', () => ({ g: bjNew(), busy: false, score: { w: 0, l: 0, d: 0 } }));
    const render = () => {
      const G2 = S.g, done = G2.phase === 'klaar';
      wrap(`<div class="dc-row" style="justify-content:space-around"><div class="dc-big">Jij<br>${bjTotal(G2.me)}</div><div class="dc-big">Computer<br>${G2.comp.length ? bjTotal(G2.comp) : '?'}</div></div>
        <div style="text-align:center">${die(1)}</div>
        <div style="text-align:center;min-height:1.6rem;font-weight:700">${done ? (G2.result === 'gewonnen' ? '🎉 Gewonnen!' : G2.result === 'gelijk' ? 'Gelijkspel.' : 'Verloren…') : `Jouw worpen: ${G2.me.join(' + ') || '–'}`}</div>
        ${G2.comp.length ? `<div style="text-align:center;font-size:.9rem">Computer: ${G2.comp.join(' + ')}</div>` : ''}
        <div style="text-align:center">${done ? btn('new', 'Nog een keer') : `${btn('hit', '🎲 Gooi nog een keer', S.busy ? 'disabled' : '')} ${btn('stand', '✋ Stop', G2.me.length && !S.busy ? '' : 'disabled')}`}</div>
        <div style="text-align:center;font-size:.85rem;opacity:.85;margin-top:.4rem">Tel je worpen op. Kom zo dicht mogelijk bij 21 maar ga er niet overheen. Gewonnen ${S.score.w} · gelijk ${S.score.d} · verloren ${S.score.l}</div>`);
      env.mkDice('#r4-t canvas.d3', [{ sides: 6, color: env.colorOf(), value: G2.me[G2.me.length - 1] || 6, pips: true }]);
    };
    const finish = () => { const r = S.g.result; S.score[r === 'gewonnen' ? 'w' : r === 'gelijk' ? 'd' : 'l']++; env.sfx(r === 'gewonnen' ? 'win' : r === 'gelijk' ? 'pop' : 'bad'); if (r === 'gewonnen') env.playScene('victory', { title: 'Gewonnen!' }); };
    render();
    on(async (a) => {
      if (a === 'new') { S.g = bjNew(); render(); return; }
      if (S.busy || S.g.phase !== 'speler') return;
      if (a === 'hit') { S.busy = true; const v = 1 + env.rand(6); env.sfx('roll'); try { await env.rollAll(env.dice(), [v], 700); } catch { /* stil */ } if (stale()) return; bjHit(S.g, v); S.busy = false; const was = S.g.phase === 'klaar'; render(); if (was) finish(); }
      else if (a === 'stand') { S.busy = true; bjStand(S.g, () => 1 + env.rand(6)); S.busy = false; render(); finish(); }
    });
  } else if (g === 'ms') {
    const S = env.state('ms', () => msNew());
    const M = () => MISSION_BY_ID[S.mission];
    const render = () => {
      const done = S.state !== 'bezig', hist = st.get('ms') || {};
      wrap(`<div class="dc-big">${env.icon('medal', { size: 30 })} ${env.esc(M().text)}</div><div style="text-align:center;font-size:.85rem;opacity:.85">Je hebt 3 worpen. Tik na de eerste worp op stenen om ze vast te houden. Tot nu toe ${hist.done | 0} dagmissies gehaald.</div>
        <div style="text-align:center">${die(5)}</div>
        <div style="display:flex;gap:.3rem;justify-content:center;flex-wrap:wrap">${S.dice.map((v, i) => `<button data-r4="hold" data-i="${i}" class="${S.held[i] ? 'on' : ''}" ${S.rolls === 0 || done ? 'disabled' : ''} style="min-height:44px;min-width:56px">${S.held[i] ? '🔒' : '🔓'} ${v || '–'}</button>`).join('')}</div>
        <div class="dc-big">${S.state === 'gehaald' ? '🎉 Missie gehaald!' : S.state === 'mislukt' ? 'Niet gelukt. Morgen een nieuwe kans!' : `Worp ${Math.min(3, S.rolls + 1)} van 3`}</div>
        <div style="text-align:center">${done ? '<small>Morgen komt er weer een nieuwe missie.</small>' : btn('roll', '🎲 Gooi', S.busy ? 'disabled' : '')}${done ? ` ${btn('again', 'Oefenen')}` : ''}</div>`);
      env.mkDice('#r4-t canvas.d3', S.dice.map((v, i) => ({ sides: 6, color: env.colorOf(), value: v || 6, pips: true, highlight: S.held[i] })));
    };
    render();
    on(async (a, b) => {
      if (a === 'hold') { if (msHold(S, +b.dataset.i)) { env.sfx('pop'); render(); } return; }
      if (a === 'again') { Object.assign(S, msNew(dayNumber() + 1 + env.rand(50))); S.practice = true; render(); return; }
      if (a === 'roll' && !S.busy && S.state === 'bezig') {
        S.busy = true; const before = S.dice.slice(), held = S.held.slice(); msRoll(S, env.rand); const vals = S.dice.slice(); env.sfx('roll');
        const list = env.dice(); try { await env.rollAll(list.map((d, i) => (S.rolls > 1 && held[i] ? null : d)), vals, 800); } catch { /* stil */ }
        void before; if (stale()) return; S.busy = false;
        if (S.state === 'gehaald') { env.sfx('win'); if (!S.practice) { const h = st.get('ms') || {}; if (h.last !== S.day) { h.last = S.day; h.done = (h.done | 0) + 1; st.set('ms', h); } } env.playScene('victory', { title: 'Missie gehaald!' }); } else if (S.state === 'mislukt') env.sfx('bad');
        render();
      }
    });
  } else if (g === 'gs') {
    const S = env.state('gs', () => ({ g: gsNew(best('gs')), guess: 10, busy: false }));
    const render = () => {
      const G2 = S.g;
      wrap(`<div class="dc-big">Ronde ${Math.min(GS_ROUNDS, G2.round + 1)} van ${GS_ROUNDS} &middot; ${G2.points} punten</div>
        <div style="text-align:center">${die(GS_DICE)}</div>
        <div style="text-align:center;min-height:1.6rem;font-weight:700">${G2.last ? `Je raadde ${G2.last.guess}, het werd ${G2.last.sum}: ${G2.last.p} punten${G2.last.p === 10 ? ' 🎯' : ''}` : `Raad de som van ${GS_DICE} stenen (${GS_DICE}–${GS_DICE * 6}).`}</div>
        ${G2.done ? `<div class="dc-big">Klaar! ${G2.points} punten (record ${G2.best})</div><div style="text-align:center">${btn('new', 'Nog een keer')}</div>`
          : `<div style="display:flex;gap:.3rem;justify-content:center;align-items:center;flex-wrap:wrap">${btn('minus', '−')}<b style="min-width:3rem;text-align:center;font-size:1.6rem">${S.guess}</b>${btn('plus', '+')}${btn('go', '🎲 Gooi!', S.busy ? 'disabled' : '')}</div>
          <div style="text-align:center;font-size:.85rem;opacity:.85;margin-top:.4rem">Precies goed = 10 punten, 1 ernaast = 5, 2 = 4, enzovoort. Gemiddeld is de som ${GS_DICE * 3.5}.</div>`}`);
      env.mkDice('#r4-t canvas.d3', Array.from({ length: GS_DICE }, (_, i) => ({ sides: 6, color: env.colorOf(), value: (G2.last && G2.last.dice[i]) || 6, pips: true })));
    };
    render();
    on(async (a) => {
      if (a === 'minus') { S.guess = Math.max(GS_DICE, S.guess - 1); render(); return; }
      if (a === 'plus') { S.guess = Math.min(GS_DICE * 6, S.guess + 1); render(); return; }
      if (a === 'new') { S.g = gsNew(S.g.best); render(); return; }
      if (a === 'go' && !S.busy && !S.g.done) {
        S.busy = true; const vals = Array.from({ length: GS_DICE }, () => 1 + env.rand(6)); env.sfx('roll');
        try { await env.rollAll(env.dice(), vals, 800); } catch { /* stil */ }
        if (stale()) return; S.busy = false; gsPlay(S.g, S.guess, vals); env.sfx(S.g.last.p >= 6 ? 'coin' : 'tick');
        if (S.g.done) { setBest('gs', S.g.points); env.sfx('win'); if (S.g.points >= 50) env.playScene('victory', { title: `${S.g.points} punten!` }); }
        render();
      }
    });
  }
}
