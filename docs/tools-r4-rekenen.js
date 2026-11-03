// Rekenen, ronde 4: "Extra spellen" met 6 nieuwe modi: Romeinse cijfers, Binair, Getallenrij, Priemjacht, Bliksemrekenen (60 s) en Schatten.
// Pure vraag-makers bovenaan (testbaar); extraScreen(root, env) tekent het scherm. Scores in state.r4 (klein, blijft in de bestaande save).
import { esc, rng, pick, shuffle, clamp, blip } from './tools-r4-kit.js?v=1';

/* ---------- pure logica ---------- */
const ROMAN = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
export function toRoman(n) { n = Math.floor(n); if (n < 1 || n > 3999) return ''; let s = ''; for (const [v, r] of ROMAN) while (n >= v) { s += r; n -= v; } return s; }
export function fromRoman(s) {
  s = String(s).toUpperCase(); if (!/^[MDCLXVI]+$/.test(s)) return 0; let n = 0, i = 0;
  for (const [v, r] of ROMAN) while (s.startsWith(r, i)) { n += v; i += r.length; }
  return i === s.length && toRoman(n) === s ? n : 0;
}
export const toBin = (n) => (n >>> 0).toString(2);
export const fromBin = (s) => (/^[01]+$/.test(s) ? parseInt(s, 2) : NaN);
export function isPrime(n) { if (n < 2 || !Number.isInteger(n)) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }
export const primesUpTo = (n) => { const a = []; for (let i = 2; i <= n; i++) if (isPrime(i)) a.push(i); return a; };

function choices(r, right, near, n = 4, fmt = String) {
  const set = new Set([right]); let guard = 0;
  while (set.size < n && guard++ < 80) { const c = near(); if (c !== right && c != null && !(typeof c === 'number' && (c < 0 || !Number.isFinite(c)))) set.add(c); }
  return shuffle(r, [...set]).map((v) => ({ v, label: fmt(v) }));
}
/** Niveau 1 tot 3. Elke vraag: {q, choices:[{v,label}], answer} */
export function romeinQ(level, r = Math.random) {
  const max = [20, 100, 1000][clamp(level, 1, 3) - 1], n = 1 + Math.floor(r() * max);
  if (r() < 0.5) { const R = toRoman(n); return { q: `Welk getal is ${R}?`, answer: n, choices: choices(r, n, () => n + Math.round((r() - 0.5) * 12) || n + 1) }; }
  const R = toRoman(n); return { q: `Hoe schrijf je ${n} met Romeinse cijfers?`, answer: R, choices: choices(r, R, () => toRoman(Math.max(1, n + Math.round((r() - 0.5) * 10) || 1))) };
}
export function binairQ(level, r = Math.random) {
  const bits = [3, 4, 6][clamp(level, 1, 3) - 1], n = 1 + Math.floor(r() * (2 ** bits - 1));
  if (r() < 0.5) return { q: `Binair ${toBin(n)} is in ons tientallig stelsel…`, answer: n, choices: choices(r, n, () => n + Math.round((r() - 0.5) * 8) || n + 1) };
  return { q: `Schrijf ${n} binair (met 0 en 1)`, answer: toBin(n), choices: choices(r, toBin(n), () => toBin(clamp(n + Math.round((r() - 0.5) * 8) || 1, 1, 2 ** bits))) };
}
/** Getallenrij met een regel; vraag is het volgende getal. */
export function rijQ(level, r = Math.random) {
  const kind = Math.floor(r() * (level === 1 ? 2 : level === 2 ? 4 : 6));
  let seq, ans, rule;
  const a = 1 + Math.floor(r() * 9), d = 2 + Math.floor(r() * 7);
  if (kind === 0) { seq = [0, 1, 2, 3, 4].map((i) => a + i * d); ans = a + 5 * d; rule = `elke keer erbij ${d}`; }
  else if (kind === 1) { const s = 40 + Math.floor(r() * 40); seq = [0, 1, 2, 3, 4].map((i) => s - i * d); ans = s - 5 * d; rule = `elke keer eraf ${d}`; }
  else if (kind === 2) { seq = [0, 1, 2, 3, 4].map((i) => a * 2 ** i); ans = a * 32; rule = 'elke keer keer 2'; }
  else if (kind === 3) { seq = [1, 2, 3, 4, 5].map((i) => i * i); ans = 36; rule = 'kwadraten'; }
  else if (kind === 4) { seq = [1, 1, 2, 3, 5, 8]; ans = 13; rule = 'twee vorige samen (Fibonacci)'; }
  else { seq = [1, 3, 6, 10, 15]; ans = 21; rule = 'driehoeksgetallen: steeds 1 meer erbij'; }
  return { q: `${seq.join(', ')}, …?`, answer: ans, rule, choices: choices(r, ans, () => ans + Math.round((r() - 0.5) * 12) || ans + 1) };
}
/** Priemjacht: 16 getallen, minstens 4 priem. */
export function priemRound(level, r = Math.random) {
  const max = [30, 60, 100][clamp(level, 1, 3) - 1], pr = primesUpTo(max), nums = new Set();
  shuffle(r, pr).slice(0, 5 + Math.floor(r() * 3)).forEach((p) => nums.add(p));
  while (nums.size < 16) nums.add(2 + Math.floor(r() * (max - 1)));
  return shuffle(r, [...nums]).map((n) => ({ n, prime: isPrime(n) }));
}
/** Bliksemrekenen: snelle som/verschil/keer. */
export function bliksemQ(streak, r = Math.random) {
  const lvl = Math.min(3, 1 + Math.floor(streak / 5)), t = Math.floor(r() * 3);
  let a, b, ans, q;
  if (t === 0) { a = 2 + Math.floor(r() * 10 * lvl); b = 2 + Math.floor(r() * 10 * lvl); ans = a + b; q = `${a} + ${b}`; }
  else if (t === 1) { a = 5 + Math.floor(r() * 12 * lvl); b = 1 + Math.floor(r() * a); ans = a - b; q = `${a} − ${b}`; }
  else { a = 2 + Math.floor(r() * (lvl + 3)); b = 2 + Math.floor(r() * (lvl + 4)); ans = a * b; q = `${a} × ${b}`; }
  return { q, answer: ans, choices: choices(r, ans, () => ans + (r() < 0.5 ? -1 : 1) * (1 + Math.floor(r() * 4))) };
}
/** Schatten: hoe dicht zit je bij het antwoord? punten 0-100 */
export function schatQ(level, r = Math.random) {
  const a = 11 + Math.floor(r() * (level === 1 ? 40 : level === 2 ? 90 : 190)), b = 11 + Math.floor(r() * (level === 1 ? 40 : level === 2 ? 90 : 190));
  return { q: `${a} × ${b}`, exact: a * b };
}
export function schatScore(guess, exact) { if (!Number.isFinite(guess)) return 0; const rel = Math.abs(guess - exact) / exact; return Math.max(0, Math.round(100 * (1 - rel * 4))); }

export const MODES = [
  { id: 'romein', name: 'Romeinse cijfers', icon: 'crown', desc: 'I, V, X, L, C, D, M' },
  { id: 'binair', name: 'Binair', icon: 'bolt', desc: 'Rekenen als een computer' },
  { id: 'rij', name: 'Getallenrij', icon: 'puzzle', desc: 'Welk getal komt nu?' },
  { id: 'priem', name: 'Priemjacht', icon: 'target', desc: 'Tik alle priemgetallen' },
  { id: 'bliksem', name: 'Bliksemrekenen', icon: 'flame', desc: '60 seconden, zo veel mogelijk' },
  { id: 'schat', name: 'Schatten', icon: 'star', desc: 'Dichtbij is ook goed' },
];

/* ---------- scherm ---------- */
export function extraScreen(root, env) {
  const { S, save, go, icon, C, celebrate, track } = env;
  const R4 = () => (S().r4 ||= { best: {}, played: 0 });
  const rec = (id, score) => { const r = R4(); const nb = score > (r.best[id] || 0); if (nb) r.best[id] = score; r.played++; return nb; };
  const reward = (coins, xp) => { const res = C.award(S(), coins, xp); save(); celebrate && celebrate(res); };
  const back = (to = 'extra', label = '← Terug') => `<button class="tu-big" data-go="${to}" style="margin:.3rem 0">${label}</button>`;
  const bind = () => root.querySelectorAll('[data-go]').forEach((b) => { b.onclick = () => go(b.dataset.go, b.dataset.arg); });
  const lvlOf = (id) => R4().lvl && R4().lvl[id] || 1;

  function menu() {
    root.innerHTML = `${back('hub', '← Terug')}<h2 style="margin:.3rem 0">Extra spellen</h2>
      <div class="tu-grid">${MODES.map((m) => `<button class="tu-tile" data-go="extra" data-arg="${m.id}">${icon(m.icon, { size: 56 })}<span>${esc(m.name)}</span><small>${esc(m.desc)}${R4().best[m.id] ? `<br>Record: ${R4().best[m.id]}` : ''}</small></button>`).join('')}</div>`;
    bind();
  }
  function levelPick(id) {
    const m = MODES.find((x) => x.id === id);
    if (id === 'bliksem') return playBliksem();
    root.innerHTML = `${back()}<div class="tu-card" style="text-align:center">${icon(m.icon, { size: 72 })}<h3 style="margin:.2rem 0">${esc(m.name)}</h3><div>${esc(m.desc)}</div>
      <div class="tu-row" style="justify-content:center;margin-top:.7rem">${[1, 2, 3].map((l) => `<button class="tu-big ${l === lvlOf(id) ? 'pri' : ''}" data-lv="${l}">Niveau ${l}</button>`).join('')}</div></div>`;
    bind();
    root.querySelectorAll('[data-lv]').forEach((b) => { b.onclick = () => { const r = R4(); (r.lvl ||= {})[id] = +b.dataset.lv; save(); start(id, +b.dataset.lv); }; });
  }
  function start(id, lv) { if (id === 'priem') return playPriem(lv); if (id === 'schat') return playSchat(lv); return playChoice(id, lv); }

  function playChoice(id, lv) {
    const mk = { romein: romeinQ, binair: binairQ, rij: rijQ }[id]; let i = 0, right = 0, locked = false;
    const next = () => {
      if (i >= 10) return end();
      const q = mk(lv); locked = false;
      root.innerHTML = `<div class="tu-top"><button class="tu-big" data-go="extra" data-arg="${id}" style="min-height:48px">✕</button><b style="flex:1">Vraag ${i + 1} van 10</b><span class="tu-chip">${right} goed</span></div><div class="tu-bar"><i style="width:${i * 10}%"></i></div>
        <div class="tu-card"><div class="rk-q">${esc(q.q)}</div><div class="rk-ch">${q.choices.map((c, k) => `<button data-c="${k}">${esc(c.label)}</button>`).join('')}</div><div class="rk-fb" data-fb></div></div>`;
      bind();
      root.querySelectorAll('[data-c]').forEach((b) => { b.onclick = () => {
        if (locked) return; locked = true; const ok = q.choices[+b.dataset.c].v === q.answer; if (ok) right++; blip(ok ? 880 : 220, 0.15, 0.15);
        root.querySelector('[data-fb]').innerHTML = ok ? '<b class="tu-ok">Goed zo!</b>' : `<b class="tu-bad">Nee, het was ${esc(String(q.choices.find((c) => c.v === q.answer).label))}</b>${q.rule ? `<br><small>Regel: ${esc(q.rule)}</small>` : ''}`;
        b.classList.add(ok ? 'tu-pop' : 'tu-shake'); i++; setTimeout(next, ok ? 700 : 1700);
      }; });
    };
    function end() {
      const score = right * 10 * lv, nb = rec(id, score); reward(right * 2 * lv, right * 4 * lv);
      root.innerHTML = `${back()}<div class="tu-card" style="text-align:center">${icon(right >= 8 ? 'trophy' : 'star', { size: 84 })}<h2 style="margin:.3rem 0">${right} van 10 goed</h2><div>${score} punten ${nb ? '<b class="tu-ok">· nieuw record!</b>' : ''}</div><div class="tu-row" style="justify-content:center;margin-top:.7rem"><button class="tu-big pri" data-again>Nog een keer</button></div></div>`;
      bind(); root.querySelector('[data-again]').onclick = () => start(id, lv);
    }
    next();
  }

  function playPriem(lv) {
    const cells = priemRound(lv), found = new Set(), wrong = new Set(); let tl = 30, over = false, iv = null;
    const need = cells.filter((c) => c.prime).length;
    const draw = () => {
      root.innerHTML = `<div class="tu-top"><button class="tu-big" data-go="extra" data-arg="priem" style="min-height:48px">✕</button><b style="flex:1">Tik de priemgetallen</b><span class="tu-chip" data-tl>${tl} s</span></div>
        <div class="tu-card"><small>Een priemgetal is alleen deelbaar door 1 en zichzelf (2, 3, 5, 7, 11…). Gevonden: ${found.size} van ${need}.</small>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin-top:.6rem">${cells.map((c, k) => `<button class="rk-cell ${found.has(k) ? 'fix' : ''} ${wrong.has(k) ? 'bad' : ''}" data-k="${k}" style="min-height:64px;font-size:1.3rem">${c.n}</button>`).join('')}</div></div>`;
      bind();
      root.querySelectorAll('[data-k]').forEach((b) => { b.onclick = () => {
        if (over) return; const k = +b.dataset.k, c = cells[k]; if (found.has(k)) return;
        if (c.prime) { found.add(k); blip(880 + found.size * 60, 0.1, 0.15); } else { wrong.add(k); tl = Math.max(0, tl - 3); blip(200, 0.2, 0.15); }
        if (found.size >= need) return fin(); draw();
      }; });
    };
    function fin() {
      over = true; clearInterval(iv); const good = found.size, score = Math.max(0, good * 20 + tl * 2 - wrong.size * 10) * lv, nb = rec('priem', score);
      reward(good * lv, good * 3 * lv);
      root.innerHTML = `${back()}<div class="tu-card" style="text-align:center">${icon(good === need ? 'trophy' : 'star', { size: 84 })}<h2 style="margin:.3rem 0">${good} van ${need} priemgetallen</h2><div>${score} punten ${nb ? '<b class="tu-ok">· nieuw record!</b>' : ''}</div>
        <small>Alle priemgetallen hier: ${cells.filter((c) => c.prime).map((c) => c.n).sort((a, b) => a - b).join(', ')}</small><div class="tu-row" style="justify-content:center;margin-top:.7rem"><button class="tu-big pri" data-again>Nog een keer</button></div></div>`;
      bind(); root.querySelector('[data-again]').onclick = () => playPriem(lv);
    }
    draw();
    iv = setInterval(() => { if (over) return; tl--; const e = root.querySelector('[data-tl]'); if (e) e.textContent = tl + ' s'; if (tl <= 0) fin(); }, 1000);
    track && track(() => clearInterval(iv));
  }

  function playBliksem() {
    let tl = 60, right = 0, wrong = 0, streak = 0, best = 0, over = false, iv = null, q = null;
    const draw = () => {
      q = bliksemQ(streak);
      root.innerHTML = `<div class="tu-top"><button class="tu-big" data-go="extra" style="min-height:48px">✕</button><b style="flex:1">Bliksemrekenen</b><span class="tu-chip" data-tl>${tl} s</span><span class="tu-chip">${right} goed</span></div>
        <div class="tu-card"><div class="rk-q">${esc(q.q)} = ?</div><div class="rk-ch">${q.choices.map((c, k) => `<button data-c="${k}">${c.label}</button>`).join('')}</div><div class="rk-fb">${streak >= 3 ? `Reeks van ${streak}!` : ''}</div></div>`;
      bind();
      root.querySelectorAll('[data-c]').forEach((b) => { b.onclick = () => { if (over) return; const ok = q.choices[+b.dataset.c].v === q.answer; if (ok) { right++; streak++; best = Math.max(best, streak); } else { wrong++; streak = 0; tl = Math.max(0, tl - 2); } blip(ok ? 900 : 220, 0.08, 0.12); draw(); }; });
    };
    function fin() {
      over = true; clearInterval(iv); const score = right * 10 + best * 5, nb = rec('bliksem', score); reward(Math.floor(right / 2), right * 2);
      root.innerHTML = `${back()}<div class="tu-card" style="text-align:center">${icon('flame', { size: 84 })}<h2 style="margin:.3rem 0">${right} goed in 60 seconden</h2><div>Langste reeks ${best} · ${score} punten ${nb ? '<b class="tu-ok">· nieuw record!</b>' : ''}</div><div class="tu-row" style="justify-content:center;margin-top:.7rem"><button class="tu-big pri" data-again>Nog een keer</button></div></div>`;
      bind(); root.querySelector('[data-again]').onclick = () => playBliksem();
    }
    draw();
    iv = setInterval(() => { if (over) return; tl--; const e = root.querySelector('[data-tl]'); if (e) e.textContent = tl + ' s'; if (tl <= 0) fin(); }, 1000);
    track && track(() => clearInterval(iv));
  }

  function playSchat(lv) {
    let i = 0, total = 0;
    const next = () => {
      if (i >= 5) return end(); const q = schatQ(lv);
      root.innerHTML = `<div class="tu-top"><button class="tu-big" data-go="extra" data-arg="schat" style="min-height:48px">✕</button><b style="flex:1">Schatten ${i + 1} van 5</b><span class="tu-chip">${total} punten</span></div>
        <div class="tu-card"><div class="rk-q">${q.q} ≈ ?</div><small>Reken niet precies uit: schat zo goed als je kunt (rond af!).</small><input class="tu-inp" data-g inputmode="numeric" placeholder="Jouw schatting" style="margin:.6rem 0"><button class="tu-big pri" data-ok>Klaar</button><div class="rk-fb" data-fb></div></div>`;
      bind();
      root.querySelector('[data-ok]').onclick = () => {
        const g = parseFloat(String(root.querySelector('[data-g]').value).replace(',', '.')); if (!Number.isFinite(g)) { root.querySelector('[data-fb]').innerHTML = '<span class="tu-bad">Typ een getal.</span>'; return; }
        const pts = schatScore(g, q.exact); total += pts; i++;
        root.querySelector('[data-fb]').innerHTML = `<b>${pts} punten</b> · het antwoord is ${q.exact}<br><button class="tu-big" data-n>Verder</button>`; root.querySelector('[data-ok]').disabled = true; root.querySelector('[data-n]').onclick = next;
      };
    };
    function end() {
      const nb = rec('schat', total); reward(Math.floor(total / 80), Math.floor(total / 25));
      root.innerHTML = `${back()}<div class="tu-card" style="text-align:center">${icon('star', { size: 84 })}<h2 style="margin:.3rem 0">${total} van 500 punten</h2>${nb ? '<b class="tu-ok">Nieuw record!</b>' : ''}<div class="tu-row" style="justify-content:center;margin-top:.7rem"><button class="tu-big pri" data-again>Nog een keer</button></div></div>`;
      bind(); root.querySelector('[data-again]').onclick = () => playSchat(lv);
    }
    next();
  }

  return (arg) => (arg ? levelPick(arg) : menu());
}
