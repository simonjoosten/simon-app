// Learn Spel 18: Quizshow. 15 vragen, de ladder tot 1.000.000, veilige trappen, 3 hulplijnen (50/50, bel een vriend, vraag het publiek).
// Gebouwd uit tools/learn-stubs/src-c/miljonair.src.js (hulpjes ingebouwd).
import { Gx } from './_gfx.js?v=1';
// ---- gedeelde hulpjes ----
const $ = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const $h = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function css(txt) { const s = document.createElement('style'); s.textContent = txt; document.head.appendChild(s); return s; }
function lifecycle() {
  const L = { timers: new Set(), raf: 0, offs: [], dead: false };
  L.after = (f, ms) => { const t = setTimeout(() => { L.timers.delete(t); if (!L.dead) f(); }, ms); L.timers.add(t); return t; };
  L.every = (f, ms) => { const t = setInterval(() => { if (!L.dead) f(); }, ms); L.timers.add(t); return t; };
  L.on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); L.offs.push(() => el.removeEventListener(ev, fn, o)); };
  L.kill = () => { L.dead = true; L.timers.forEach(t => { clearTimeout(t); clearInterval(t); }); L.timers.clear(); if (L.raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(L.raf); L.raf = 0; L.offs.forEach(f => { try { f(); } catch (e) {} }); L.offs = []; };
  return L;
}
function baseCss(P) {
  return `.${P}-root{position:relative;width:100%;overflow:hidden;color:var(--ink);font:inherit;user-select:none;-webkit-user-select:none;touch-action:manipulation;display:flex;flex-direction:column;background:transparent;border-radius:14px;box-sizing:border-box;font-size:calc(16px*var(--gfx-font,1))}
.${P}-root *{box-sizing:border-box}
.${P}-hud{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;justify-content:flex-start;padding:8px 58px 4px 10px;font-weight:800;font-size:calc(15px*var(--gfx-font,1))}
.${P}-chip{display:inline-flex;align-items:center;gap:5px;background:var(--card);border-radius:999px;padding:5px 12px;min-height:34px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.${P}-ov{position:absolute;top:0;left:0;right:0;bottom:0;display:none;align-items:center;justify-content:center;background:rgba(10,12,30,.74);z-index:50;padding:10px;overflow:auto}
.${P}-qbox{background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:16px;padding:12px;width:min(100%,520px);max-height:100%;overflow:auto}
.${P}-card{background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:18px;padding:16px;width:min(100%,460px);max-height:100%;overflow:auto;text-align:center}
.${P}-card h2{margin:0 0 6px;font-size:calc(24px*var(--gfx-font,1))}.${P}-card p{margin:6px 0;opacity:.88;font-size:calc(16px*var(--gfx-font,1));line-height:1.4}
.${P}-big{font-size:54px;line-height:1.1}
.${P}-btn{border:0;border-radius:16px;padding:13px 22px;font:inherit;font-size:calc(17px*var(--gfx-font,1));font-weight:800;background:var(--accent);color:#fff;cursor:pointer;min-height:54px;box-shadow:0 4px 0 rgba(0,0,0,.25),0 6px 12px rgba(0,0,0,.2);margin:4px}
.${P}-btn.alt{background:rgba(127,127,127,.22);color:var(--ink)}
.${P}-btn:disabled{opacity:.45;cursor:default}
.${P}-row{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:stretch}
.${P}-shopi{border:2px solid var(--line);border-radius:16px;padding:10px;background:var(--card);flex:1 1 130px;min-width:120px;max-width:190px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.12)}
.${P}-modes{display:flex;flex-direction:column;gap:8px;margin:10px 0 4px}
.${P}-mode{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:2px;min-height:58px;border:3px solid var(--line);background:var(--card);color:var(--ink);border-radius:16px;padding:8px 14px;font:inherit;font-weight:800;cursor:pointer}
.${P}-mode small{font-weight:600;opacity:.8;font-size:.82em}.${P}-mode.on{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent) inset}
.${P}-shopi b{display:block}.${P}-shopi small{display:block;opacity:.75;min-height:2.4em}
@keyframes ${P}pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}
.${P}-pop{animation:${P}pop .35s ease-out}`;
}
function mkOv(root, P) {
  const el = $('div', P + '-ov'); root.appendChild(el);
  return { el, shown: false, show(n) { el.textContent = ''; if (n) el.appendChild(n); el.style.display = 'flex'; this.shown = true; }, hide() { el.style.display = 'none'; el.textContent = ''; this.shown = false; } };
}
function card(P, o) { // intro/info-kaart: {emoji,title,text,btn,onBtn,extra}
  const c = $('div', P + '-card ' + P + '-pop');
  if (o.ic || o.emoji) c.appendChild(o.ic ? $h('div', P + '-big', Gx.ic(o.ic, 72, o.emoji)) : $('div', P + '-big', o.emoji));
  if (o.title) c.appendChild($('h2', '', o.title));
  if (o.text) c.appendChild($('p', '', o.text));
  if (o.extra) c.appendChild(o.extra);
  if (o.btn) { const b = $('button', P + '-btn', o.btn); b.onclick = o.onBtn; c.appendChild(b); }
  return c;
}
function modePicker(P, modes, cur, onPick) { // modes: {id:{name,desc}} -> {el, get()}
  const box = $('div', P + '-modes'); let val = cur; const bs = {};
  Object.keys(modes).forEach(id => { const b = $h('button', P + '-mode' + (id === val ? ' on' : ''), '<span>' + modes[id].name + '</span><small>' + modes[id].desc + '</small>'); b.type = 'button'; b.onclick = () => { val = id; Object.keys(bs).forEach(k => { bs[k].className = P + '-mode' + (k === val ? ' on' : ''); }); if (onPick) onPick(id); }; bs[id] = b; box.appendChild(b); });
  return { el: box, get: () => val };
}
function makeAsker(env, ov, P, L) {
  let cur = null;
  return {
    async ask(q, o) {
      const box = $('div', P + '-qbox'); ov.show(box);
      let h = null;
      try { h = env.ask(box, q, Object.assign({ compact: true, feedback: true, autoNext: 1200 }, o || {})); } catch (e) { h = null; }
      if (!h) { ov.hide(); return { ok: false, ms: 0 }; }
      cur = h; let r = null;
      try { r = await h.promise; } catch (e) { r = null; }
      cur = null; r = r || { ok: false, ms: 0 };
      if (L.dead) return r;
      ov.hide();
      try { env.report({ q, ok: !!r.ok, ms: r.ms || 0 }); } catch (e) {}
      return r;
    },
    cancel() { try { cur && cur.cancel && cur.cancel(); } catch (e) {} }
  };
}
const FALLBACK_Q = [
  { t: 'tf', q: '2 + 2 = 4', a: true, d: 1 }, { t: 'mc', q: 'Hoeveel is 3 + 4?', a: '7', o: ['6', '7', '8', '9'], d: 1 },
  { t: 'mc', q: 'Welke kleur heeft gras?', a: 'groen', o: ['rood', 'groen', 'blauw', 'geel'], d: 1 }, { t: 'num', q: 'Hoeveel is 5 x 2?', a: 10, d: 1 }
];
function qsupply(env) {
  let buf = [], i = 0;
  return (hard) => {
    if (!buf.length) {
      try { buf = (env.pick(8, hard ? { hard } : {}) || []).slice(); } catch (e) { buf = []; }
      if (!buf.length) buf = FALLBACK_Q.slice(i++ % 2).concat(FALLBACK_Q.slice(0, i % 2));
    }
    return buf.shift();
  };
}
function mkStats() {
  const S = { correct: 0, wrong: 0, streak: 0, best: 0, mark(ok) { if (ok) { S.correct++; S.streak++; if (S.streak > S.best) S.best = S.streak; } else { S.wrong++; S.streak = 0; } return S; } };
  return S;
}
function fit(cv, w, h) {
  const d = Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);
  cv.width = Math.max(1, Math.round(w * d)); cv.height = Math.max(1, Math.round(h * d));
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); return c;
}
function loop(L, host, fn) {
  let last = 0;
  const f = (ts) => {
    if (L.dead) return;
    if (host.isConnected === false) { L.raf = 0; last = 0; L.after(() => { L.raf = requestAnimationFrame(f); }, 400); return; }
    const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016); last = ts;
    try { fn(dt, ts); } catch (e) { if (typeof console !== 'undefined') console.error(e); }
    L.raf = requestAnimationFrame(f);
  };
  L.raf = requestAnimationFrame(f);
}
function dims(host, env) { return { W: clamp(host.clientWidth || env.w || 380, 280, 760), H: clamp(env.h || host.clientHeight || 600, 420, 1100) }; }
function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
const fmtN = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
function snd(env, n) { try { env.snd && env.snd.play(n); } catch (e) {} }
// ---- einde hulpjes ----

const P = 'lmi';

export const LADDER = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000];
export const SAFE = [4, 9];                       // index van veilige trap (na 5e en 10e vraag goed)
export const FRIENDS = [
  { name: 'Juf Lotte', emoji: '👩‍🏫', acc: 0.86, tip: 'Weet veel' },
  { name: 'Opa Kees', emoji: '👴', acc: 0.72, tip: 'Wijs, maar vergeetachtig' },
  { name: 'Broer Tim', emoji: '🧒', acc: 0.6, tip: 'Gokt graag' },
  // nieuwe vrienden
  { name: 'Professor Wiebe', emoji: '🧑‍🔬', acc: 0.9, tip: 'Weet bijna alles, soms te ingewikkeld' },
  { name: 'Tante Roos', emoji: '👵', acc: 0.78, tip: 'Heeft overal een mening over' },
  { name: 'Robbie de Robot', emoji: '🤖', ic: 'robot', acc: 0.82, tip: 'Snel, maar niet creatief' }
];
// Extra hulplijnen (modus 'plus') en andere ladders (modus 'sprint')
export const LIFELINES = {
  fifty: { name: '50/50', ic: 'coin', emoji: '✂️' }, phone: { name: 'Bel', ic: 'bell', emoji: '📞' }, crowd: { name: 'Publiek', ic: 'flag', emoji: '👥' },
  swap: { name: 'Wissel', ic: 'dice', emoji: '🔄' }, time: { name: '+20 s', ic: 'hourglass', emoji: '⏱' }, second: { name: '2e kans', ic: 'shield', emoji: '🛡️' }
};
export const SPRINT = [100, 250, 500, 1000, 2500, 5000, 10000, 20000, 40000, 100000];
export const SHOW_MODES = {
  klassiek: { name: 'Klassiek', desc: '15 vragen voor 1.000.000, 3 hulplijnen.', ladder: LADDER, safe: SAFE, life: ['fifty', 'phone', 'crowd'], time: 1 },
  plus: { name: 'Hulplijnen-plus', desc: '15 vragen en 6 hulplijnen: wissel, +20 s en tweede kans erbij.', ladder: LADDER, safe: SAFE, life: ['fifty', 'phone', 'crowd', 'swap', 'time', 'second'], time: 1 },
  sprint: { name: 'Sprintshow', desc: '10 vragen tot 100.000, korte tijd, 3 hulplijnen.', ladder: SPRINT, safe: [3, 6], life: ['fifty', 'phone', 'crowd'], time: 0.75 }
};
export const TIME = { 1: 45, 2: 32, 3: 22 };

export const fmtE = (n) => '€ ' + fmtN(n);
export function bankAfter(step, lad = LADDER) { // step = aantal goede antwoorden; geeft veilige/gewonnen bedrag bij stoppen
  return step <= 0 ? 0 : lad[step - 1];
}
export function safeFloor(step, lad = LADDER, safe = SAFE) { // bedrag bij verkeerd antwoord als je nu 'step' goed hebt
  let s = 0; safe.forEach(i => { if (step > i) s = lad[i]; }); return s;
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
  constructor(o = {}) { this.rand = o.rand || Math.random; this.level = o.level || 2; this.fx = o.fx || {}; this.step = 0; this.state = 'play'; this.mode = SHOW_MODES[o.mode] ? o.mode : 'klassiek'; this.MD = SHOW_MODES[this.mode]; this.lad = this.MD.ladder; this.safe = this.MD.safe; this.life = {}; this.MD.life.forEach(k => { this.life[k] = true; }); this.good = 0; this.bad = 0; this.best = 0; this.streak = 0; this.used = 0; }
  get money() { return bankAfter(this.step, this.lad); }
  get floor() { return safeFloor(this.step, this.lad, this.safe); }
  get hard() { const r = this.step / this.lad.length; return r < 1 / 3 ? 1 : r < 2 / 3 ? 2 : 3; }
  correct() { this.good++; this.streak++; if (this.streak > this.best) this.best = this.streak; this.step++; if (this.step >= this.lad.length) this.state = 'won'; return this.state; }
  wrong() { this.bad++; this.streak = 0; this.state = 'lost'; return this.floor; }
  stop() { this.state = 'stopped'; return this.money; }
  time() { return Math.round((TIME[this.level] || 32) * this.MD.time) + Math.round(this.fx.timeBonus || 0); }
  use(k) { if (!this.life[k]) return false; this.life[k] = false; this.used++; return true; }
  result() { return this.state === 'won' ? this.lad[this.lad.length - 1] : this.state === 'lost' ? this.floor : this.money; }
}

const CSS = `
.${P}-root{color:var(--ink)}
.${P}-ladder{display:flex;gap:4px;padding:8px 12px;margin:0 10px;justify-content:center;background:var(--card);border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.18)}
.${P}-pip{flex:1;height:12px;border-radius:6px;background:rgba(127,127,127,.3);max-width:26px}
.${P}-pip.ok{background:#22c55e}.${P}-pip.cur{background:#f59e0b;box-shadow:0 0 8px #f59e0b}.${P}-pip.safe{border-bottom:4px solid #f97316}
.${P}-host{display:flex;gap:10px;align-items:center;padding:8px 10px;min-height:64px}
.${P}-host b{display:inline-flex}.${P}-bub{background:var(--card);border-radius:16px;padding:10px 14px;font-size:calc(16px*var(--gfx-font,1));font-weight:700;flex:1;box-shadow:0 2px 8px rgba(0,0,0,.18)}
.${P}-life{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;padding:0 8px}
.${P}-life button{flex:1 1 28%;max-width:150px;margin:0;padding:6px 4px;font-size:calc(15px*var(--gfx-font,1));border:3px solid #f59e0b;background:var(--card);color:var(--ink);box-shadow:0 3px 0 rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;gap:5px}
.${P}-life button:disabled{opacity:.35;border-color:#999;text-decoration:line-through}
.${P}-main{flex:1;overflow:auto;padding:8px;display:flex;flex-direction:column;justify-content:center}
.${P}-main .${P}-qbox{margin:0 auto;box-shadow:0 4px 16px rgba(0,0,0,.25)}
.${P}-crowd{display:flex;gap:6px;align-items:flex-end;height:80px;margin:6px 0}.${P}-crowd div{flex:1;background:#38bdf8;border-radius:4px 4px 0 0;text-align:center;font-size:13px;font-weight:800;color:#082f49;min-height:16px}
.${P}-amount{font-size:calc(34px*var(--gfx-font,1));font-weight:900;color:#d97706}
.${P}-friend{display:flex;gap:10px;align-items:center;border:2px solid var(--line);border-radius:16px;padding:10px;width:100%;margin:5px 0;background:var(--card);cursor:pointer;font:inherit;font-size:calc(15px*var(--gfx-font,1));color:inherit;text-align:left;min-height:56px}
.${P}-friend b{display:inline-flex;font-size:30px}`;

export default {
  id: 'miljonair', name: 'Quizshow', emoji: '🎤', color: '#4f46e5',
  desc: 'Beantwoord 15 vragen op rij voor de 1.000.000. Gebruik je hulplijnen slim en stop op tijd!',
  tags: ['denken', 'solo'], minutes: 6, duo: false,
  create(host, env) {
    const L = lifecycle(); const style = css(baseCss(P) + CSS); host.textContent = '';
    const { H } = dims(host, env); const root = $('div', P + '-root'); root.style.height = H + 'px'; host.appendChild(root);
    const gx = Gx.start(root, env, 'miljonair'); let mode = 'klassiek';
    let g = new Show({ rand: env.rand || Math.random, fx: env.fx, level: env.level }); const rand = env.rand || Math.random;
    const S = mkStats(); const ov = mkOv(root, P); const nextQ = qsupply(env);
    let ended = false, curQ = null, curH = null, token = 0, qStart = 0, qTime = 30, answered = false, pool = [], secondArmed = false;
    try { pool = (env.pick(20, {}) || []); } catch (e) { pool = []; }
    const hud = $('div', P + '-hud'); const chip = {}; ['step', 'bank', 'safe'].forEach(k => { chip[k] = $('span', P + '-chip'); hud.appendChild(chip[k]); });
    const ladder = $('div', P + '-ladder'); let pips = [];
    const buildPips = () => { ladder.textContent = ''; pips = g.lad.map((_, i) => { const p = $('div', P + '-pip' + (g.safe.includes(i) ? ' safe' : '')); ladder.appendChild(p); return p; }); };
    buildPips();
    const hostRow = $('div', P + '-host'); const face = $h('b', '', Gx.ic('microphone', 52, '🎤')); const bub = $('div', P + '-bub', ''); hostRow.append(face, bub);
    const life = $('div', P + '-life'); const lb = {};
    Object.keys(LIFELINES).forEach(k => { const b = $h('button', P + '-btn', Gx.ic(LIFELINES[k].ic, 28, LIFELINES[k].emoji) + '<span>' + LIFELINES[k].name + '</span>'); lb[k] = b; life.appendChild(b); });
    const main = $('div', P + '-main'); const box = $('div', P + '-qbox'); main.appendChild(box); root.append(hud, ladder, hostRow, life, main);
    const talk = (t) => { bub.textContent = t; };
    const paint = () => {
      const n = g.lad.length;
      chip.step.innerHTML = Gx.ic('puzzle', 24, '❓') + ' ' + Math.min(g.step + 1, n) + '/' + n; chip.bank.innerHTML = Gx.ic('bag', 24, '💰') + ' ' + fmtE(g.money); chip.safe.innerHTML = Gx.ic('shield', 24, '🛟') + ' ' + fmtE(g.floor);
      pips.forEach((p, i) => { p.className = P + '-pip' + (g.safe.includes(i) ? ' safe' : '') + (i < g.step ? ' ok' : i === g.step ? ' cur' : ''); });
      Object.keys(lb).forEach(k => { const has = k in g.life; lb[k].style.display = has ? '' : 'none'; lb[k].disabled = !g.life[k] || answered; });
    };
    const finish = (why) => {
      if (ended) return; ended = true; const win = g.state === 'won';
      env.end({ score: g.result(), win: win ? true : (g.state === 'stopped' ? null : false), stats: { correct: S.correct, wrong: S.wrong, best: S.best, trap: g.step, hulplijnen: g.used }, summary: why + ' (' + g.MD.name + ')' });
    };
    const cancelCur = () => { token++; try { curH && curH.cancel && curH.cancel(); } catch (e) {} curH = null; };
    const present = (q, remaining) => {
      box.textContent = ''; curQ = q; const my = ++token; qStart = performance.now(); qTime = remaining;
      let h = null; try { h = env.ask(box, q, { compact: true, feedback: true, autoNext: 1500, time: remaining }); } catch (e) { h = null; }
      curH = h; if (!h) { onResult({ ok: false }); return; }
      h.promise.then(r => { if (my !== token || L.dead) return; onResult(r || { ok: false }); }, () => { if (my === token && !L.dead) onResult({ ok: false }); });
    };
    const onResult = (r) => {
      if (answered) return;
      if (!r.ok && secondArmed) { secondArmed = false; talk('Tweede kans! Probeer het nog eens.'); snd(env, 'power'); gx.burst((root.clientWidth || 360) / 2, 120, 'sparkle', 14); L.after(() => present(curQ, Math.max(15, remaining())), 500); return; }
      answered = true; curH = null; try { env.report({ q: curQ, ok: !!r.ok, ms: r.ms || 0 }); } catch (e) {} S.mark(!!r.ok); paint();
      if (r.ok) {
        const safeStep = g.safe.includes(g.step); snd(env, safeStep ? 'level' : 'goed'); const st = g.correct();
        gx.burst((root.clientWidth || 360) / 2, 150, safeStep ? 'confetti' : 'sparkle', safeStep ? 40 : 14);
        if (st === 'won') { snd(env, 'win'); talk('🎉 JE BENT MILJONAIR!'); gx.burst((root.clientWidth || 360) / 2, 160, 'confetti', 80); L.after(() => { paint(); ov.show(card(P, { ic: 'trophy', emoji: '🏆', title: 'MILJONAIR!', text: 'Alle ' + g.lad.length + ' vragen goed. ' + fmtE(g.lad[g.lad.length - 1]) + '!', btn: 'Klaar', onBtn: () => { ov.hide(); finish('Alle ' + g.lad.length + ' vragen goed: ' + fmtE(g.lad[g.lad.length - 1]) + '!'); } })); }, 600); return; }
        paint(); L.after(() => decide(), 600);
      } else {
        snd(env, 'lose'); const fl = g.wrong(); talk('😬 Helaas! Je valt terug naar ' + fmtE(fl) + '.'); gx.burst((root.clientWidth || 360) / 2, 150, 'smoke', 14);
        L.after(() => { ov.show(card(P, { ic: 'bomb', emoji: '😬', title: 'Helaas!', text: 'Het goede antwoord kostte je de top. Je neemt ' + fmtE(fl) + ' mee.', btn: 'Verder', onBtn: () => { ov.hide(); finish('Fout bij vraag ' + (g.step + 1) + '. Je neemt ' + fmtE(fl) + ' mee.'); } })); }, 700);
      }
    };
    const decide = () => {
      const nxt = g.lad[g.step]; const safeNote = g.safe.includes(g.step - 1) ? ' Dit is een veilige trap: je kunt niet lager vallen dan ' + fmtE(g.money) + '.' : '';
      const w = $('div'); w.appendChild($('div', P + '-amount', fmtE(g.money))); w.appendChild($('p', '', 'Doorspelen voor ' + fmtE(nxt) + '? Bij een fout val je terug naar ' + fmtE(g.floor) + '.' + safeNote));
      const r = $('div', P + '-row'); const go = $('button', P + '-btn', '▶ Door voor ' + fmtE(nxt)); const stop = $('button', P + '-btn alt', '💰 Stop en neem ' + fmtE(g.money));
      go.onclick = () => { ov.hide(); next(); }; stop.onclick = () => { ov.hide(); g.stop(); snd(env, 'win'); finish('Gestopt met ' + fmtE(g.money) + ' na ' + g.step + ' vragen.'); }; r.append(go, stop); w.appendChild(r);
      ov.show(card(P, { ic: 'medal', emoji: '✅', title: 'Goed!', extra: w }));
    };
    const next = () => {
      answered = false; const q = nextQ(g.hard); const t = g.time() + (g.step >= Math.round(g.lad.length * 2 / 3) ? 0 : 6); paint();
      const val = g.lad[g.step]; talk('Vraag ' + (g.step + 1) + ' voor ' + fmtE(val) + '!' + (g.safe.includes(g.step) ? ' Dit is de veilige trap.' : '')); present(q, t);
    };
    const remaining = () => Math.max(6, Math.round(qTime - (performance.now() - qStart) / 1000));
    lb.fifty.onclick = () => {
      if (answered || !g.life.fifty || !curQ) return; const f = fiftyQ(curQ, rand, pool); if (!f) { talk('✂️ 50/50 kan niet bij dit soort vraag. Je houdt hem!'); snd(env, 'fout'); return; }
      g.use('fifty'); snd(env, 'power'); talk('✂️ Twee antwoorden vallen weg!'); cancelCur(); present(f, remaining()); paint();
    };
    lb.swap.onclick = () => {
      if (answered || !g.life.swap || !curQ) return; g.use('swap'); snd(env, 'power'); talk('🔄 Nieuwe vraag!'); cancelCur(); present(nextQ(g.hard), remaining() + 4); paint();
    };
    lb.time.onclick = () => {
      if (answered || !g.life.time || !curQ) return; g.use('time'); snd(env, 'power'); talk('⏱ 20 seconden extra!'); cancelCur(); present(curQ, remaining() + 20); paint();
    };
    lb.second.onclick = () => {
      if (answered || !g.life.second || !curQ) return; g.use('second'); secondArmed = true; snd(env, 'power'); talk('🛡️ Tweede kans actief: je eerste foute antwoord telt niet.'); gx.burst((root.clientWidth || 360) / 2, 130, 'sparkle', 12); paint();
    };
    lb.crowd.onclick = () => {
      if (answered || !g.life.crowd || !curQ) return; const o = optionsOf(curQ); if (!o) { talk('👥 Het publiek kan hier geen mening over geven. Je houdt hem!'); snd(env, 'fout'); return; }
      g.use('crowd'); snd(env, 'power'); const acc = clamp(0.88 - 0.035 * g.step + (g.level === 1 ? .08 : g.level === 3 ? -.06 : 0), 0.3, .95); const pc = crowdPct(o.opts.length, o.idx, acc, rand);
      const w = $('div'); const bars = $('div', P + '-crowd'); pc.forEach((p, i) => { const b = $('div', '', p + '%'); b.style.height = Math.max(16, p * .8) + 'px'; bars.appendChild(b); }); w.append(bars, $('p', '', o.opts.map((x, i) => String.fromCharCode(65 + i) + ': ' + String(x).slice(0, 14)).join('  ')));
      ov.show(card(P, { ic: 'flag', emoji: '👥', title: 'Het publiek stemt', extra: w, btn: 'Terug naar de vraag', onBtn: () => ov.hide() })); paint();
    };
    lb.phone.onclick = () => {
      if (answered || !g.life.phone || !curQ) return; const w = $('div');
      FRIENDS.forEach(f => { const b = $('button', P + '-friend', ''); b.append($h('b', '', Gx.ic(f.ic, 40, f.emoji)), $('span', '', f.name + ' - ' + f.tip)); b.onclick = () => { g.use('phone'); snd(env, 'power'); const s = friendSays(curQ, f, g.step, g.level, rand); w.textContent = ''; w.append($h('div', P + '-big', Gx.ic(f.ic, 72, f.emoji)), $('p', '', f.name + ' zegt:'), $('p', '', '"' + s.text + '"')); const ok2 = $('button', P + '-btn', 'Bedankt!'); ok2.onclick = () => { ov.hide(); }; w.appendChild(ok2); paint(); }; w.appendChild(b); });
      ov.show(card(P, { ic: 'bell', emoji: '📞', title: 'Wie bel je?', extra: w }));
    };
    paint();
    const mp = modePicker(P, SHOW_MODES, mode, null);
    ov.show(card(P, { ic: 'microphone', emoji: '🎤', title: 'Quizshow', text: 'Beantwoord de vragen voor het grote bedrag. Bij de veilige trappen val je niet lager. Je hebt hulplijnen en je mag altijd stoppen. Kies je show.', extra: mp.el, btn: 'Tik om te beginnen', onBtn: () => {
      mode = mp.get(); if (mode !== 'klassiek') { g = new Show({ rand: env.rand || Math.random, fx: env.fx, level: env.level, mode }); buildPips(); }
      ov.hide(); snd(env, 'klik'); next(); } }));
    return { destroy() { cancelCur(); L.kill(); gx.destroy(); try { style.remove(); } catch (e) {} host.textContent = ''; } };
  }
};
