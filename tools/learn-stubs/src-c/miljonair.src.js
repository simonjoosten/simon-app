// Learn Spel 18: Quizshow. 15 vragen, de ladder tot 1.000.000, veilige trappen, 3 hulplijnen (50/50, bel een vriend, vraag het publiek).
// Gebouwd uit tools/learn-stubs/src-c/miljonair.src.js (hulpjes ingebouwd).
//@HELPERS
const P = 'lmi';

export const LADDER = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000];
export const SAFE = [4, 9];                       // index van veilige trap (na 5e en 10e vraag goed)
export const FRIENDS = [
  { name: 'Juf Lotte', emoji: '👩‍🏫', acc: 0.86, tip: 'Weet veel' },
  { name: 'Opa Kees', emoji: '👴', acc: 0.72, tip: 'Wijs, maar vergeetachtig' },
  { name: 'Broer Tim', emoji: '🧒', acc: 0.6, tip: 'Gokt graag' }
];
export const TIME = { 1: 45, 2: 32, 3: 22 };

export const fmtE = (n) => '€ ' + fmtN(n);
export function bankAfter(step) { // step = aantal goede antwoorden; geeft veilige/gewonnen bedrag bij stoppen
  return step <= 0 ? 0 : LADDER[step - 1];
}
export function safeFloor(step) { // bedrag bij verkeerd antwoord als je nu 'step' goed hebt
  let s = 0; SAFE.forEach(i => { if (step > i) s = LADDER[i]; }); return s;
}
// opties voor hulplijnen: {opts:[...], idx} of null als dit vraagtype geen vaste opties heeft
export function optionsOf(q) {
  if (q.t === 'mc' && Array.isArray(q.o) && q.o.length >= 2) return { opts: q.o.slice(), idx: q.o.indexOf(q.a) };
  if (q.t === 'fill' && Array.isArray(q.o) && q.o.length >= 2) return { opts: q.o.slice(), idx: q.o.indexOf(q.a) };
  if (q.t === 'tf') return { opts: ['Waar', 'Onwaar'], idx: q.a ? 0 : 1 };
  return null;
}
// type/fill/num -> mc (met afleiders uit pool); null als niet mogelijk
export function toMc(q, pool, rand) {
  if (q.t === 'mc' || (q.t === 'fill' && q.o)) return q;
  if (q.t !== 'type' && q.t !== 'fill' && q.t !== 'num') return null;
  const ans = String(q.a); const ds = new Set();
  if (q.t === 'num') {
    const n = Number(q.a); if (!isFinite(n)) return null; const step = Math.max(1, Math.round(Math.abs(n) * 0.15)) || 1;
    [step, -step, 2 * step, -2 * step, 3 * step, 10, -10].forEach(d => { if (ds.size < 3 && String(n + d) !== ans) ds.add(String(n + d)); });
  } else {
    (pool || []).forEach(p => { const a = p && (typeof p.a === 'string' || typeof p.a === 'number') ? String(p.a) : null; if (a && a !== ans && a.length < 40 && (!q.lang || !p.lang || p.lang === q.lang)) ds.add(a); });
  }
  const arr = [...ds].sort(() => rand() - .5).slice(0, 3); if (arr.length < 3) return null;
  const o = arr.concat([ans]).sort(() => rand() - .5);
  return Object.assign({}, q, { t: 'mc', o, a: ans, alt: undefined });
}
export function fiftyQ(q, rand, pool) {
  const m = q.t === 'tf' ? null : toMc(q, pool, rand); if (!m) return null; const o = optionsOf(m); if (!o || o.idx < 0 || o.opts.length < 3) return null;
  const wrong = o.opts.filter((_, i) => i !== o.idx); const keepWrong = wrong[Math.floor(rand() * wrong.length)];
  const keep = o.opts.filter(x => x === m.a || x === keepWrong);
  return Object.assign({}, m, { o: keep });
}
export function crowdPct(n, idx, acc, rand) {
  const w = Array.from({ length: n }, (_, i) => i === idx ? acc * 100 : (1 - acc) * 100 / (n - 1) * (0.4 + rand() * 1.2));
  const sum = w.reduce((a, b) => a + b, 0); const p = w.map(x => Math.round(x / sum * 100)); const d = 100 - p.reduce((a, b) => a + b, 0); p[idx] += d; return p;
}
export function friendSays(q, friend, step, level, rand) {
  const acc = clamp(friend.acc - 0.012 * step + (level === 1 ? 0.06 : level === 3 ? -0.05 : 0), 0.3, 0.97); const o = optionsOf(q); const right = rand() < acc;
  if (o) { let i = o.idx; if (!right) { const others = o.opts.map((_, k) => k).filter(k => k !== o.idx); i = others[Math.floor(rand() * others.length)]; } return { text: (right && rand() < .75 ? 'Zeker weten: ' : 'Ik denk ') + (q.t === 'tf' ? o.opts[i] : o.opts[i]) + '.', idx: i, right }; }
  if (q.t === 'type' || q.t === 'fill' || q.t === 'num') return right ? { text: 'Ik denk dat het "' + q.a + '" is.', right } : { text: 'Hmm... daar heb ik geen idee van, sorry!', right: false };
  return { text: right ? 'Ik zou het rustig stap voor stap doen, dan komt het goed.' : 'Dit is lastig, ik weet het niet.', right: false, none: true };
}
export class Show {
  constructor(o = {}) { this.rand = o.rand || Math.random; this.level = o.level || 2; this.fx = o.fx || {}; this.step = 0; this.state = 'play'; this.life = { fifty: true, phone: true, crowd: true }; this.good = 0; this.bad = 0; this.best = 0; this.streak = 0; this.used = 0; }
  get money() { return bankAfter(this.step); }
  get floor() { return safeFloor(this.step); }
  get hard() { return this.step < 5 ? 1 : this.step < 10 ? 2 : 3; }
  correct() { this.good++; this.streak++; if (this.streak > this.best) this.best = this.streak; this.step++; if (this.step >= LADDER.length) this.state = 'won'; return this.state; }
  wrong() { this.bad++; this.streak = 0; this.state = 'lost'; return this.floor; }
  stop() { this.state = 'stopped'; return this.money; }
  time() { return (TIME[this.level] || 32) + Math.round(this.fx.timeBonus || 0); }
  use(k) { if (!this.life[k]) return false; this.life[k] = false; this.used++; return true; }
  result() { return this.state === 'won' ? LADDER[LADDER.length - 1] : this.state === 'lost' ? this.floor : this.money; }
}

const CSS = `
.${P}-root{background:linear-gradient(#1e1b4b,#312e81 60%,#1e1b4b);color:#fff}
.${P}-ladder{display:flex;gap:3px;padding:0 10px;justify-content:center}
.${P}-pip{flex:1;height:8px;border-radius:4px;background:rgba(255,255,255,.18);max-width:24px}
.${P}-pip.ok{background:#4ade80}.${P}-pip.cur{background:#fde047;box-shadow:0 0 8px #fde047}.${P}-pip.safe{border-bottom:3px solid #f97316}
.${P}-host{display:flex;gap:8px;align-items:center;padding:6px 10px;min-height:56px}
.${P}-host b{font-size:34px}.${P}-bub{background:rgba(255,255,255,.14);border-radius:14px;padding:6px 10px;font-size:14px;font-weight:600;flex:1}
.${P}-life{display:flex;gap:8px;justify-content:center;padding:0 8px}
.${P}-life button{flex:1;max-width:130px;margin:0;padding:6px 4px;font-size:14px;border:2px solid #fde047;background:rgba(0,0,0,.25);color:#fde047;box-shadow:none}
.${P}-life button:disabled{opacity:.3;border-color:#999;color:#999;text-decoration:line-through}
.${P}-main{flex:1;overflow:auto;padding:8px;display:flex;flex-direction:column;justify-content:center}
.${P}-main .${P}-qbox{margin:0 auto}
.${P}-crowd{display:flex;gap:6px;align-items:flex-end;height:70px;margin:6px 0}.${P}-crowd div{flex:1;background:#38bdf8;border-radius:4px 4px 0 0;text-align:center;font-size:12px;font-weight:800;color:#082f49;min-height:14px}
.${P}-amount{font-size:30px;font-weight:900;color:#fde047}
.${P}-friend{display:flex;gap:8px;align-items:center;border:1px solid var(--line);border-radius:14px;padding:8px;width:100%;margin:4px 0;background:rgba(127,127,127,.1);cursor:pointer;font:inherit;color:inherit;text-align:left}`;

export default {
  id: 'miljonair', name: 'Quizshow', emoji: '🎤', color: '#4f46e5',
  desc: 'Beantwoord 15 vragen op rij voor de 1.000.000. Gebruik je 3 hulplijnen slim en stop op tijd!',
  tags: ['denken', 'solo'], minutes: 6, duo: false,
  create(host, env) {
    const L = lifecycle(); const style = css(baseCss(P) + CSS); host.textContent = '';
    const { H } = dims(host, env); const root = $('div', P + '-root'); root.style.height = H + 'px'; host.appendChild(root);
    const g = new Show({ rand: env.rand || Math.random, fx: env.fx, level: env.level }); const rand = env.rand || Math.random;
    const S = mkStats(); const ov = mkOv(root, P); const nextQ = qsupply(env);
    let ended = false, curQ = null, curH = null, token = 0, qStart = 0, qTime = 30, answered = false, pool = [];
    try { pool = (env.pick(20, {}) || []); } catch (e) { pool = []; }
    const hud = $('div', P + '-hud'); const chip = {}; ['step', 'bank', 'safe'].forEach(k => { chip[k] = $('span', P + '-chip'); hud.appendChild(chip[k]); });
    const ladder = $('div', P + '-ladder'); const pips = LADDER.map((_, i) => { const p = $('div', P + '-pip' + (SAFE.includes(i) ? ' safe' : '')); ladder.appendChild(p); return p; });
    const hostRow = $('div', P + '-host'); const face = $('b', '', '🎤'); const bub = $('div', P + '-bub', ''); hostRow.append(face, bub);
    const life = $('div', P + '-life'); const lb = { fifty: $('button', P + '-btn', '✂️ 50/50'), phone: $('button', P + '-btn', '📞 Bel'), crowd: $('button', P + '-btn', '👥 Publiek') }; Object.values(lb).forEach(b => life.appendChild(b));
    const main = $('div', P + '-main'); const box = $('div', P + '-qbox'); main.appendChild(box); root.append(hud, ladder, hostRow, life, main);
    const talk = (t) => { bub.textContent = t; };
    const paint = () => {
      chip.step.textContent = '❓ ' + Math.min(g.step + 1, 15) + '/15'; chip.bank.textContent = '💰 ' + fmtE(g.money); chip.safe.textContent = '🛟 ' + fmtE(g.floor);
      pips.forEach((p, i) => { p.className = P + '-pip' + (SAFE.includes(i) ? ' safe' : '') + (i < g.step ? ' ok' : i === g.step ? ' cur' : ''); });
      Object.keys(lb).forEach(k => { lb[k].disabled = !g.life[k] || answered; });
    };
    const finish = (why) => {
      if (ended) return; ended = true; const win = g.state === 'won';
      env.end({ score: g.result(), win: win ? true : (g.state === 'stopped' ? null : false), stats: { correct: S.correct, wrong: S.wrong, best: S.best, trap: g.step, hulplijnen: g.used }, summary: why });
    };
    const cancelCur = () => { token++; try { curH && curH.cancel && curH.cancel(); } catch (e) {} curH = null; };
    const present = (q, remaining) => {
      box.textContent = ''; curQ = q; const my = ++token; qStart = performance.now(); qTime = remaining;
      let h = null; try { h = env.ask(box, q, { compact: true, feedback: true, autoNext: 1500, time: remaining }); } catch (e) { h = null; }
      curH = h; if (!h) { onResult({ ok: false }); return; }
      h.promise.then(r => { if (my !== token || L.dead) return; onResult(r || { ok: false }); }, () => { if (my === token && !L.dead) onResult({ ok: false }); });
    };
    const onResult = (r) => {
      if (answered) return; answered = true; curH = null; try { env.report({ q: curQ, ok: !!r.ok, ms: r.ms || 0 }); } catch (e) {} S.mark(!!r.ok); paint();
      if (r.ok) {
        snd(env, g.step + 1 === 5 || g.step + 1 === 10 ? 'level' : 'goed'); const st = g.correct();
        if (st === 'won') { snd(env, 'win'); talk('🎉 JE BENT MILJONAIR!'); L.after(() => { paint(); ov.show(card(P, { emoji: '🏆', title: 'MILJONAIR!', text: 'Alle 15 vragen goed. ' + fmtE(1000000) + '!', btn: 'Klaar', onBtn: () => { ov.hide(); finish('Alle 15 vragen goed: ' + fmtE(1000000) + '!'); } })); }, 600); return; }
        paint(); L.after(() => decide(), 600);
      } else {
        snd(env, 'lose'); const fl = g.wrong(); talk('😬 Helaas! Je valt terug naar ' + fmtE(fl) + '.');
        L.after(() => { ov.show(card(P, { emoji: '😬', title: 'Helaas!', text: 'Het goede antwoord kostte je de top. Je neemt ' + fmtE(fl) + ' mee.', btn: 'Verder', onBtn: () => { ov.hide(); finish('Fout bij vraag ' + (g.step + 1) + '. Je neemt ' + fmtE(fl) + ' mee.'); } })); }, 700);
      }
    };
    const decide = () => {
      const nxt = LADDER[g.step]; const safeNote = SAFE.includes(g.step - 1) ? ' Dit is een veilige trap: je kunt niet lager vallen dan ' + fmtE(g.money) + '.' : '';
      const w = $('div'); w.appendChild($('div', P + '-amount', fmtE(g.money))); w.appendChild($('p', '', 'Doorspelen voor ' + fmtE(nxt) + '? Bij een fout val je terug naar ' + fmtE(g.floor) + '.' + safeNote));
      const r = $('div', P + '-row'); const go = $('button', P + '-btn', '▶ Door voor ' + fmtE(nxt)); const stop = $('button', P + '-btn alt', '💰 Stop en neem ' + fmtE(g.money));
      go.onclick = () => { ov.hide(); next(); }; stop.onclick = () => { ov.hide(); g.stop(); snd(env, 'win'); finish('Gestopt met ' + fmtE(g.money) + ' na ' + g.step + ' vragen.'); }; r.append(go, stop); w.appendChild(r);
      ov.show(card(P, { emoji: '✅', title: 'Goed!', extra: w }));
    };
    const next = () => {
      answered = false; const q = nextQ(g.hard); const t = g.time() + (g.step >= 10 ? 0 : 6); paint();
      const val = LADDER[g.step]; talk('Vraag ' + (g.step + 1) + ' voor ' + fmtE(val) + '!' + (SAFE.includes(g.step) ? ' Dit is de veilige trap.' : '')); present(q, t);
    };
    const remaining = () => Math.max(6, Math.round(qTime - (performance.now() - qStart) / 1000));
    lb.fifty.onclick = () => {
      if (answered || !g.life.fifty || !curQ) return; const f = fiftyQ(curQ, rand, pool); if (!f) { talk('✂️ 50/50 kan niet bij dit soort vraag. Je houdt hem!'); snd(env, 'fout'); return; }
      g.use('fifty'); snd(env, 'power'); talk('✂️ Twee antwoorden vallen weg!'); cancelCur(); present(f, remaining()); paint();
    };
    lb.crowd.onclick = () => {
      if (answered || !g.life.crowd || !curQ) return; const o = optionsOf(curQ); if (!o) { talk('👥 Het publiek kan hier geen mening over geven. Je houdt hem!'); snd(env, 'fout'); return; }
      g.use('crowd'); snd(env, 'power'); const acc = clamp(0.88 - 0.035 * g.step + (g.level === 1 ? .08 : g.level === 3 ? -.06 : 0), 0.3, .95); const pc = crowdPct(o.opts.length, o.idx, acc, rand);
      const w = $('div'); const bars = $('div', P + '-crowd'); pc.forEach((p, i) => { const b = $('div', '', p + '%'); b.style.height = Math.max(14, p * .7) + 'px'; bars.appendChild(b); }); w.append(bars, $('p', '', o.opts.map((x, i) => String.fromCharCode(65 + i) + ': ' + String(x).slice(0, 14)).join('  ')));
      ov.show(card(P, { emoji: '👥', title: 'Het publiek stemt', extra: w, btn: 'Terug naar de vraag', onBtn: () => ov.hide() })); paint();
    };
    lb.phone.onclick = () => {
      if (answered || !g.life.phone || !curQ) return; const w = $('div');
      FRIENDS.forEach(f => { const b = $('button', P + '-friend', ''); b.append($('b', '', f.emoji), $('span', '', f.name + ' - ' + f.tip)); b.onclick = () => { g.use('phone'); snd(env, 'power'); const s = friendSays(curQ, f, g.step, g.level, rand); w.textContent = ''; w.append($('div', P + '-big', f.emoji), $('p', '', f.name + ' zegt:'), $('p', '', '"' + s.text + '"')); const ok2 = $('button', P + '-btn', 'Bedankt!'); ok2.onclick = () => { ov.hide(); }; w.appendChild(ok2); paint(); }; w.appendChild(b); });
      ov.show(card(P, { emoji: '📞', title: 'Wie bel je?', extra: w }));
    };
    paint();
    ov.show(card(P, { emoji: '🎤', title: 'Quizshow', text: 'Beantwoord 15 vragen voor ' + fmtE(1000000) + '. Bij trap 5 en 10 val je niet lager. Je hebt 3 hulplijnen en je mag altijd stoppen.', btn: 'Tik om te beginnen', onBtn: () => { ov.hide(); snd(env, 'klik'); next(); } }));
    return { destroy() { cancelCur(); L.kill(); try { style.remove(); } catch (e) {} host.textContent = ''; } };
  }
};
