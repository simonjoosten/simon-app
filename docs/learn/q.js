// Learn – de vraag-presentator. Alle 8 vraagtypen (mc, type, tf, order, match, fill, num, multi), tijdsbalk, hints, voorlezen,
// geluid, feedback, toetsenbord en toegankelijkheid. Spellen en Study gebruiken UITSLUITEND ask().
//   ask(host, q, o) -> { promise, cancel() }; promise lost op met { ok, ms, given, typo?, partial?, timeout?, skipped?, hints, correct }.
// Met feedback:true (standaard) lost de promise op ZODRA de speler de feedback weg tikt (Volgende / Enter) of na autoNext ms
// (standaard: goed zonder uitleg gaat na 900 ms vanzelf door; fout blijft staan tot Volgende). o.onAnswer(res) komt direct bij het antwoord.
import { TTS, Snd, checkAnswer, normalizeQ, shuffle, rng, qkey } from './core.js?v=1';

const CSS = `
.lq-root{--ac:var(--lq-ac,var(--accent,#6366f1));--good:#16a34a;--bad:#ef4444;--warn:#f59e0b;box-sizing:border-box;width:100%;max-width:680px;margin:0 auto;padding:.5rem .6rem;display:flex;flex-direction:column;gap:.65rem;color:var(--lq-fg,var(--ink,#1f2330));background:var(--lq-bg,transparent);border-radius:18px;position:relative;font-size:1rem;-webkit-tap-highlight-color:transparent;-webkit-text-size-adjust:100%}
.lq-root *{box-sizing:border-box}
.lq-top{display:flex;align-items:center;gap:.4rem;min-height:2.4rem}
.lq-label{font-weight:700;font-size:.85rem;opacity:.75;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lq-lives{letter-spacing:1px;font-size:.95rem}
.lq-sp{flex:1}
.lq-ib{min-width:44px;min-height:44px;border-radius:12px;border:1px solid var(--line,#e4e6ee);background:var(--card,#fff);color:inherit;font:inherit;font-size:1.05rem;cursor:pointer;padding:0 .6rem}
.lq-ib[disabled]{opacity:.4;cursor:default}
.lq-ib:focus-visible,.lq-opt:focus-visible,.lq-go:focus-visible,.lq-oi:focus-visible,.lq-mi:focus-visible{outline:3px solid var(--ac);outline-offset:2px}
.lq-time{height:12px;border-radius:99px;background:var(--line,#e4e6ee);overflow:hidden;position:relative}
.lq-tbar{height:100%;width:100%;background:var(--ac);border-radius:99px;transition:width .12s linear}
.lq-time.low .lq-tbar{background:var(--bad)}
.lq-tw{display:flex;align-items:center;gap:.5rem}
.lq-tw .lq-time{flex:1}
.lq-tnum{flex:none;min-width:2ch;text-align:right;font-size:.9rem;font-weight:800;font-variant-numeric:tabular-nums}
.lq-card{background:var(--card,#fff);border:1px solid var(--line,#e4e6ee);border-radius:18px;padding:1rem .9rem;text-align:center;animation:lq-in .25s ease-out}
.lq-e{font-size:3.4rem;line-height:1.1;margin-bottom:.35rem}
.lq-q{font-size:1.25rem;font-weight:650;line-height:1.4;overflow-wrap:anywhere}
.lq-q b{color:var(--ac)}
.lq-gap{display:inline-block;min-width:3.2ch;padding:0 .3em;border-bottom:3px solid var(--ac);color:var(--ac);font-weight:800;text-align:center}
.lq-gap.lq-good{color:var(--good);border-color:var(--good);background:none!important}
.lq-gap.lq-bad{color:var(--bad);border-color:var(--bad);background:none!important}
.lq-gi{width:7ch;max-width:60vw;font:inherit;font-weight:800;color:var(--ac);text-align:center;border:0;border-bottom:3px solid var(--ac);background:rgba(99,102,241,.08);border-radius:6px 6px 0 0;padding:.1em .2em;outline:none}
.lq-gi:focus{background:rgba(99,102,241,.16)}
.lq-sub{font-size:.8rem;opacity:.65;margin-top:.35rem}
.lq-opts{display:grid;gap:.5rem;grid-template-columns:1fr}
.lq-opt{display:flex;align-items:center;gap:.65rem;min-height:52px;padding:.6rem .85rem;border:2px solid var(--line,#e4e6ee);background:var(--card,#fff);color:var(--lq-fg,var(--ink,#1f2330));border-radius:14px;font:inherit;font-size:1.05rem;text-align:left;cursor:pointer;transition:transform .08s,border-color .15s,background .15s;animation:lq-in .25s ease-out backwards}
.lq-opt:hover{border-color:var(--ac)}
.lq-opt:active{transform:scale(.98)}
.lq-k{flex:none;display:inline-flex;align-items:center;justify-content:center;width:1.7rem;height:1.7rem;border-radius:9px;background:var(--line,#e4e6ee);font-size:.82rem;font-weight:800}
.lq-ot{flex:1;overflow-wrap:anywhere}
.lq-opt.lq-sel{border-color:var(--ac);background:rgba(99,102,241,.14)}
.lq-opt.lq-sel .lq-k{background:var(--ac);color:#fff}
.lq-good{border-color:var(--good)!important;background:rgba(22,163,74,.16)!important}
.lq-bad{border-color:var(--bad)!important;background:rgba(239,68,68,.16)!important}
.lq-dim{opacity:.55}
.lq-gone{opacity:.18;pointer-events:none;text-decoration:line-through}
.lq-tf{display:grid;grid-template-columns:1fr 1fr;gap:.6rem}
.lq-tf .lq-opt{justify-content:center;min-height:76px;font-size:1.2rem;font-weight:800;flex-direction:column;gap:.1rem}
.lq-tfi{font-size:1.7rem}
.lq-in{width:100%;font:inherit;font-size:1.25rem;padding:.8rem .9rem;border:2px solid var(--line,#e4e6ee);border-radius:14px;background:var(--card,#fff);color:inherit;text-align:center;outline:none}
.lq-in:focus{border-color:var(--ac)}
.lq-pat{text-align:center;font:700 1.1rem ui-monospace,Menlo,monospace;letter-spacing:.2em;opacity:.8;min-height:1.4em;overflow-wrap:anywhere}
.lq-chars{display:flex;flex-wrap:wrap;gap:.35rem;justify-content:center}
.lq-ch{min-width:40px;min-height:40px;border-radius:10px;border:1px solid var(--line,#e4e6ee);background:var(--card,#fff);color:inherit;font:inherit;font-size:1.05rem;cursor:pointer}
.lq-act{display:flex;gap:.5rem;align-items:center;justify-content:center;flex-wrap:wrap}
.lq-go{min-height:50px;padding:0 1.6rem;border-radius:14px;border:0;background:var(--ac);color:#fff;font:inherit;font-size:1.1rem;font-weight:800;cursor:pointer;flex:1;max-width:340px}
.lq-go[disabled]{opacity:.4;cursor:default}
.lq-skip{min-height:44px;border-radius:12px;border:1px solid var(--line,#e4e6ee);background:transparent;color:inherit;font:inherit;font-size:.9rem;padding:0 .9rem;cursor:pointer;opacity:.8}
.lq-ord{display:flex;flex-direction:column;gap:.45rem}
.lq-oi{display:flex;align-items:center;gap:.5rem;min-height:52px;padding:.35rem .5rem .35rem .3rem;border:2px solid var(--line,#e4e6ee);background:var(--card,#fff);border-radius:14px;cursor:pointer;user-select:none;-webkit-user-select:none}
.lq-oi.lq-sel{border-color:var(--ac);background:rgba(99,102,241,.14)}
.lq-oi.lq-ghost{opacity:.3}
.lq-oi.lq-lock{border-style:dashed;opacity:.85}
.lq-hd{flex:none;width:36px;height:44px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;opacity:.6;touch-action:none;cursor:grab}
.lq-on{flex:none;width:1.6rem;height:1.6rem;border-radius:50%;background:var(--ac);color:#fff;font-size:.8rem;font-weight:800;display:flex;align-items:center;justify-content:center}
.lq-ar{flex:none;display:flex;flex-direction:column;gap:2px}
.lq-ar button{width:36px;height:22px;border:1px solid var(--line,#e4e6ee);border-radius:7px;background:var(--card,#fff);color:inherit;font-size:.7rem;cursor:pointer;padding:0;line-height:1}
.lq-drag{position:fixed;z-index:99999;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.25);transform:rotate(1.5deg);opacity:.95;display:flex}
.lq-mw{position:relative}
.lq-mg{display:grid;grid-template-columns:1fr 1fr;column-gap:2rem;row-gap:.5rem;position:relative;z-index:1}
.lq-mc{display:flex;flex-direction:column;gap:.5rem}
.lq-mi{display:flex;align-items:center;gap:.4rem;min-height:52px;padding:.45rem .6rem;border:2px solid var(--line,#e4e6ee);background:var(--card,#fff);color:inherit;border-radius:14px;font:inherit;font-size:1rem;text-align:left;cursor:pointer;overflow-wrap:anywhere}
.lq-mi.lq-sel{border-color:var(--ac);background:rgba(99,102,241,.14)}
.lq-mb{flex:none;min-width:1.5rem;height:1.5rem;border-radius:50%;background:var(--line,#e4e6ee);font-size:.72rem;font-weight:800;display:inline-flex;align-items:center;justify-content:center}
.lq-p0{border-color:#6366f1!important;background:rgba(99,102,241,.16)}.lq-p1{border-color:#f59e0b!important;background:rgba(245,158,11,.18)}.lq-p2{border-color:#10b981!important;background:rgba(16,185,129,.18)}
.lq-p3{border-color:#ec4899!important;background:rgba(236,72,153,.16)}.lq-p4{border-color:#0ea5e9!important;background:rgba(14,165,233,.18)}.lq-p5{border-color:#8b5cf6!important;background:rgba(139,92,246,.18)}
.lq-ms{position:absolute;left:0;top:0;width:100%;height:100%;z-index:0;pointer-events:none;overflow:visible}
.lq-fb{border-radius:16px;padding:.8rem .9rem;border:2px solid var(--line,#e4e6ee);background:var(--card,#fff);animation:lq-in .22s ease-out}
.lq-fb.ok{border-color:var(--good);background:rgba(22,163,74,.1)}
.lq-fb.no{border-color:var(--bad);background:rgba(239,68,68,.08)}
.lq-fb.mid{border-color:var(--warn);background:rgba(245,158,11,.1)}
.lq-ft{font-weight:800;font-size:1.1rem}
.lq-fa{margin-top:.25rem;overflow-wrap:anywhere}
.lq-fa b{color:var(--good)}
.lq-fx{margin-top:.35rem;font-size:.92rem;opacity:.9;overflow-wrap:anywhere}
.lq-fb .lq-go{margin-top:.6rem;width:100%;max-width:none}
.lq-fxl{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:5}
.lq-p{position:absolute;left:50%;top:40%;font-size:1.4rem;animation:lq-conf .85s ease-out forwards}
.lq-pop{animation:lq-pop .35s ease-out}
.lq-shake{animation:lq-shake .4s}
.lq-c{gap:.4rem;padding:.3rem .4rem}
.lq-c .lq-card{padding:.55rem .6rem;border-radius:14px}
.lq-c .lq-e{font-size:2rem;margin-bottom:.1rem}
.lq-c .lq-q{font-size:1.02rem}
.lq-c .lq-opt{min-height:46px;padding:.4rem .65rem;font-size:.98rem}
.lq-c .lq-tf .lq-opt{min-height:58px}
.lq-c .lq-ib{min-width:38px;min-height:38px}
.lq-c .lq-top{min-height:2rem}
.lq-c .lq-in{padding:.55rem .7rem;font-size:1.1rem}
.lq-c .lq-fb{padding:.55rem .7rem}
.lq-c .lq-oi,.lq-c .lq-mi{min-height:44px}
@media(min-width:520px){.lq-opts.lq-two{grid-template-columns:1fr 1fr}.lq-c .lq-opts{grid-template-columns:1fr 1fr}}
@keyframes lq-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes lq-pop{0%{transform:scale(1)}40%{transform:scale(1.06)}100%{transform:scale(1)}}
@keyframes lq-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(4px)}}
@keyframes lq-conf{0%{transform:translate(-50%,0) scale(.4);opacity:1}100%{transform:translate(calc(-50% + var(--dx,0px)),var(--dy,-90px)) rotate(var(--rot,0deg)) scale(1);opacity:0}}
@media (prefers-reduced-motion:reduce){.lq-root *{animation:none!important;transition:none!important}}
`;

/* ---------- kleine helpers ---------- */
const hasDoc = () => typeof document !== 'undefined';
const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
function h(tag, cls, kids, attrs) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (attrs) for (const k of Object.keys(attrs)) { if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]); }
  for (const kid of [].concat(kids === undefined || kids === null ? [] : kids)) {
    if (kid === null || kid === undefined || kid === false) continue;
    e.appendChild(typeof kid === 'string' || typeof kid === 'number' ? document.createTextNode(String(kid)) : kid);
  }
  return e;
}
const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); };
const has = (el, c) => (' ' + (el.className || '') + ' ').includes(' ' + c + ' ');
const add = (el, ...cs) => { for (const c of cs) if (!has(el, c)) el.className = ((el.className || '') + ' ' + c).trim(); };
const del = (el, ...cs) => { el.className = (el.className || '').split(/\s+/).filter((x) => x && !cs.includes(x)).join(' '); };
const isInput = (t) => !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT');
const fmtLabelNum = (n) => String(+Number(n).toFixed(6)).replace('.', ',');

/* ---------- stijl (gedeeld, wordt opgeruimd als er geen vraag meer in beeld is) ---------- */
const roots = new Set();
let sweepTimer = null;
function ensureStyle() {
  if (!hasDoc()) return;
  if (!document.getElementById('lq-style')) {
    const st = document.createElement('style');
    st.id = 'lq-style';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }
}
function sweep() {
  sweepTimer = null;
  for (const r of [...roots]) if (!r.isConnected) roots.delete(r);
  if (!roots.size) {
    const st = hasDoc() && document.getElementById('lq-style');
    if (st && st.parentNode) st.parentNode.removeChild(st);
  } else sweepTimer = setTimeout(sweep, 5000);
}
function scheduleSweep() { if (sweepTimer) clearTimeout(sweepTimer); sweepTimer = setTimeout(sweep, 4000); }

/* ---------- taal raden voor voorlezen ---------- */
const WORDS = {
  nl: 'het een van niet zijn wat wie welke hoe waar wordt voor met naar ook maar dit deze dat bij uit je ze'.split(' '),
  en: 'the and to that it for are with they this from have or by not but what all when there can your which their how do you'.split(' '),
  de: 'der die das und ist nicht ein eine ich sie wir mit von zu den dem auf für was wie wo auch sind'.split(' '),
  fr: 'le la les et est un une des du que qui dans pour pas avec sur ce il elle nous vous sont'.split(' '),
  es: 'el los las una que por para con es del como qué y está son'.split(' '),
};
export function guessLang(text, fb) {
  const ws = String(text || '').toLowerCase().replace(/[^a-zà-ÿ\s']/g, ' ').split(/\s+/).filter(Boolean);
  if (ws.length < 3) return fb;
  const sc = {};
  for (const [l, list] of Object.entries(WORDS)) sc[l] = ws.filter((w) => list.includes(w)).length;
  const sorted = Object.entries(sc).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] >= 1 && sorted[0][1] > sorted[1][1]) return sorted[0][0];
  return fb;
}

/* ---------- toetsenbord (alleen de bovenste vraag luistert) ---------- */
const ACTIVE = [];
let keyWired = false;
function onKey(e) {
  const top = ACTIVE[ACTIVE.length - 1];
  if (!top || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target && e.target.isConnected === false) return; // het item waarop gedrukt is, is al weg (volgende vraag)
  try { top.key(e); } catch (err) { /* stil */ }
}
function wireKeys() { if (!keyWired && hasDoc()) { document.addEventListener('keydown', onKey); keyWired = true; } }
function unwireKeys() { if (keyWired && !ACTIVE.length && hasDoc()) { document.removeEventListener('keydown', onKey); keyWired = false; } }
const BY_HOST = typeof WeakMap !== 'undefined' ? new WeakMap() : new Map();

/* ============================== de presentator ============================== */
export function ask(host, q0, o = {}) {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  const q = normalizeQ(q0);
  if (!host || !hasDoc() || !q) {
    if (resolve) resolve({ ok: false, ms: 0, given: null, hints: 0, error: true });
    return { promise, cancel() {} };
  }
  const prev = BY_HOST.get(host);
  if (prev) { try { prev.cancel(); } catch (e) { /* stil */ } }

  const opts = {
    time: Math.max(0, Number(o.time) || 0),
    hints: Math.max(0, Math.floor(Number(o.hints) || 0)),
    feedback: o.feedback !== false,
    compact: !!o.compact,
    autoNext: o.autoNext,
    shuffle: o.shuffle !== false,
    label: o.label,
    lives: o.lives,
    skip: o.skip !== false,
  };
  const compact = opts.compact;
  const timers = new Set();
  const offs = [];
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
  const every = (fn, ms) => { const id = setInterval(fn, ms); timers.add(id); return id; };
  const stopT = (id) => { clearTimeout(id); clearInterval(id); timers.delete(id); };
  const on = (el, ev, fn, op) => { el.addEventListener(ev, fn, op); offs.push(() => el.removeEventListener(ev, fn, op)); };
  const sfx = (n) => { try { Snd.play(n); } catch (e) { /* stil */ } };
  const rand = Math.random;

  let btnGo = null, btnSkip = null;
  let answered = false, finished = false, cancelled = false, hintsUsed = 0, hintsLeft = opts.hints;
  let result = null, tBar = null, tNum = null, tTimer = null, nextTimer = null, speakToken = 0;
  let t0 = 0;

  ensureStyle();
  clear(host);
  const root = h('div', 'lq-root' + (compact ? ' lq-c' : ''), null, { role: 'group', 'aria-label': 'Vraag' });
  const th = o.theme || {};
  if (th.bg) root.style.setProperty('--lq-bg', th.bg);
  if (th.fg) root.style.setProperty('--lq-fg', th.fg);
  if (th.accent) root.style.setProperty('--lq-ac', th.accent);
  host.appendChild(root);
  roots.add(root);

  const api = {
    q, compact, opts, rand, later, on, sfx, h, shuffle,
    submit: (given, extra) => submit(given, extra),
    refresh: () => refreshSubmit(),
    isDone: () => answered,
  };
  const ctl = makeCtl(api);

  /* --- bovenbalk --- */
  const top = h('div', 'lq-top');
  if (opts.label) top.appendChild(h('span', 'lq-label', String(opts.label)));
  if (opts.lives !== undefined && opts.lives !== null) top.appendChild(h('span', 'lq-lives', '❤️'.repeat(Math.max(0, Math.min(9, opts.lives | 0))) || '💔', { 'aria-label': (opts.lives | 0) + ' levens' }));
  top.appendChild(h('span', 'lq-sp'));
  const speakOk = TTS.supported();
  const btnSay = speakOk ? h('button', 'lq-ib', '🔊', { type: 'button', 'aria-label': 'Lees voor', title: 'Lees voor' }) : null;
  const btnHint = ctl.hint && ctl.hintable !== false ? h('button', 'lq-ib', '💡 ' + hintsLeft, { type: 'button', 'aria-label': 'Hint', title: 'Hint (H)' }) : null;
  if (btnHint && !hintsLeft) btnHint.style.display = 'none';
  if (btnSay) top.appendChild(btnSay);
  if (btnHint) top.appendChild(btnHint);
  if (top.firstChild) root.appendChild(top);

  /* --- tijdsbalk --- */
  let timeBox = null;
  if (opts.time > 0) {
    tBar = h('div', 'lq-tbar'); tNum = h('span', 'lq-tnum', String(Math.ceil(opts.time)));
    timeBox = h('div', 'lq-time', [tBar], { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(opts.time), 'aria-valuenow': String(opts.time), 'aria-label': 'Tijd' });
    root.appendChild(h('div', 'lq-tw', [timeBox, tNum]));
  }

  /* --- vraagkaart --- */
  const card = h('div', 'lq-card');
  if (q.e) card.appendChild(h('div', 'lq-e', q.e, { 'aria-hidden': 'true' }));
  const qNode = ctl.qNode || h('div', 'lq-q', q.q, { role: 'heading', 'aria-level': '2' });
  card.appendChild(qNode);
  if (ctl.sub) card.appendChild(h('div', 'lq-sub', ctl.sub));
  root.appendChild(card);
  root.appendChild(ctl.el);
  if (ctl.extra) root.appendChild(ctl.extra);

  /* --- knoppen --- */
  const act = h('div', 'lq-act');
  if (!ctl.auto) {
    btnGo = h('button', 'lq-go', 'Controleer ✓', { type: 'button' });
    btnGo.setAttribute('disabled', '');
    act.appendChild(btnGo);
    if (opts.skip && ctl.skippable !== false) { btnSkip = h('button', 'lq-skip', 'Weet ik niet', { type: 'button' }); act.appendChild(btnSkip); }
    root.appendChild(act);
  }
  const fbBox = h('div', '', null, { 'aria-live': 'polite', role: 'status' });
  root.appendChild(fbBox);
  const fxl = h('div', 'lq-fxl', null, { 'aria-hidden': 'true' });
  root.appendChild(fxl);

  function refreshSubmit() {
    if (!btnGo || answered) return;
    if (ctl.ready()) btnGo.removeAttribute('disabled'); else btnGo.setAttribute('disabled', '');
  }
  if (btnGo) on(btnGo, 'click', () => { if (ctl.ready()) submit(ctl.value()); });
  if (btnSkip) on(btnSkip, 'click', () => submit(null, { skipped: true }));
  if (btnHint) on(btnHint, 'click', useHint);
  if (btnSay) on(btnSay, 'click', () => { sfx('klik'); speakQ(true); });

  function useHint() {
    if (answered || hintsLeft <= 0 || !ctl.hint) return;
    if (ctl.hint(hintsUsed + 1)) {
      hintsUsed++; hintsLeft--; sfx('klik');
      btnHint.textContent = '💡 ' + hintsLeft;
      if (!hintsLeft) btnHint.setAttribute('disabled', '');
    }
  }

  /* --- voorlezen --- */
  function speakQ(force) {
    if (!speakOk) return;
    const token = ++speakToken;
    const qLang = q.say ? (q.lang || 'nl') : guessLang(q.q, q.lang || 'nl');
    const aLang = q.lang || qLang;
    const text = (q.say || q.q || '').replace(/_{2,}/g, ' … ');
    const readOpts = (ctl.readOptions && ctl.readOptions()) || null;
    TTS.speak(text, qLang).then(() => {
      if (token !== speakToken || cancelled || finished || answered) return;
      if (readOpts && readOpts.length) return TTS.speak(readOpts.join('. '), aLang);
    });
    void force;
  }
  const autoSpeak = o.tts === true || (o.tts !== false && TTS.on) || q.listen === true;
  if (autoSpeak) later(() => speakQ(false), 220);

  /* --- tijd --- */
  if (opts.time > 0) {
    t0 = now();
    tTimer = every(() => {
      if (answered) return;
      const left = Math.max(0, opts.time - (now() - t0) / 1000);
      tBar.style.width = Math.max(0, (left / opts.time) * 100).toFixed(1) + '%';
      tNum.textContent = String(Math.ceil(left));
      timeBox.setAttribute('aria-valuenow', String(Math.ceil(left)));
      if (left / opts.time < 0.3) add(timeBox, 'low');
      if (left > 0 && left <= 3 && Math.ceil(left) !== api._lastTick) { api._lastTick = Math.ceil(left); sfx('tik'); }
      if (left <= 0) submit(null, { timeout: true });
    }, 100);
  }
  t0 = now();

  /* --- antwoord --- */
  function submit(given, extra) {
    if (answered || finished || cancelled) return;
    answered = true;
    extra = extra || {};
    const ms = Math.round(now() - t0);
    if (tTimer) { stopT(tTimer); tTimer = null; }
    speakToken++;
    try { TTS.stop(); } catch (e) { /* stil */ }
    const res = extra.timeout || extra.skipped ? { ok: false, correct: checkAnswer(q, null).correct } : checkAnswer(q, given);
    result = { ok: !!res.ok, ms, given: extra.timeout || extra.skipped ? null : given, hints: hintsUsed, correct: res.correct };
    if (res.typo) result.typo = true;
    if (res.partial !== undefined) result.partial = res.partial;
    if (extra.timeout) result.timeout = true;
    if (extra.skipped) result.skipped = true;
    if (btnGo) btnGo.setAttribute('disabled', '');
    if (btnSkip) btnSkip.setAttribute('disabled', '');
    if (btnHint) btnHint.setAttribute('disabled', '');
    try { ctl.reveal(res, given, extra); } catch (e) { /* stil */ }
    sfx(res.ok ? 'goed' : 'fout');
    add(card, res.ok ? 'lq-pop' : 'lq-shake');
    if (res.ok) burst();
    if (typeof o.onAnswer === 'function') { try { o.onAnswer({ ...result }); } catch (e) { /* stil */ } }
    if (!opts.feedback) { finish(); return; }
    showFeedback(res, extra);
  }

  function burst() {
    const n = compact ? 5 : 10;
    const em = ['⭐', '✨', '🎉', '💫'];
    for (let i = 0; i < n; i++) {
      const p = h('span', 'lq-p', em[i % em.length]);
      p.style.setProperty('--dx', Math.round((Math.random() - 0.5) * 220) + 'px');
      p.style.setProperty('--dy', -Math.round(60 + Math.random() * 90) + 'px');
      p.style.setProperty('--rot', Math.round((Math.random() - 0.5) * 120) + 'deg');
      fxl.appendChild(p);
    }
    later(() => clear(fxl), 1000);
  }

  const PRAISE = ['Goed zo!', 'Yes!', 'Top!', 'Prachtig!', 'Raak!', 'Super!'];
  function showFeedback(res, extra) {
    const partial = !res.ok && (res.partial || 0) >= 0.5;
    const kind = res.ok ? (res.typo ? 'mid' : 'ok') : (partial ? 'mid' : 'no');
    const fb = h('div', 'lq-fb ' + kind);
    let title;
    if (res.ok) title = res.typo ? '✅ Goed! Let wel op de spelling' : '✅ ' + PRAISE[Math.floor(Math.random() * PRAISE.length)];
    else if (extra.timeout) title = '⏰ Tijd is op';
    else if (extra.skipped) title = '🤷 Dat is niet erg, nu weet je het';
    else if (res.partial === 0.75 && ['type', 'fill'].includes(q.t)) title = '🟡 Bijna! Let op het lidwoord';
    else if (partial) title = '🟡 Bijna goed (' + Math.round(res.partial * 100) + '%)';
    else title = '❌ Helaas, niet goed';
    fb.appendChild(h('div', 'lq-ft', title));
    if (!res.ok || res.typo) fb.appendChild(h('div', 'lq-fa', ['Het goede antwoord: ', h('b', '', res.correct)]));
    if (q.x) fb.appendChild(h('div', 'lq-fx', '💡 ' + q.x));
    const go = h('button', 'lq-go', 'Volgende ➜', { type: 'button' });
    fb.appendChild(go);
    clear(fbBox); fbBox.appendChild(fb);
    on(go, 'click', finish);
    let ms = opts.autoNext;
    if (ms === undefined || ms === null) ms = res.ok && !res.typo && !q.x ? 900 : 0;
    if (ms > 0) nextTimer = later(finish, ms);
    try { go.focus(); } catch (e) { /* stil */ }
  }

  function finish() {
    if (finished) return;
    finished = true;
    if (nextTimer) { stopT(nextTimer); nextTimer = null; }
    cleanup(false);
    if (resolve) resolve(result || { ok: false, ms: 0, given: null, hints: hintsUsed });
  }

  function cleanup(removeRoot) {
    for (const id of [...timers]) stopT(id);
    for (const f of offs.splice(0)) { try { f(); } catch (e) { /* stil */ } }
    const i = ACTIVE.indexOf(inst);
    if (i >= 0) ACTIVE.splice(i, 1);
    unwireKeys();
    if (ctl.destroy) { try { ctl.destroy(); } catch (e) { /* stil */ } }
    speakToken++;
    if (BY_HOST.get(host) === inst) BY_HOST.delete(host);
    if (removeRoot && root.parentNode) root.parentNode.removeChild(root);
    scheduleSweep();
  }

  const inst = {
    cancel() {
      if (cancelled || finished) return;
      cancelled = true; finished = true;
      try { TTS.stop(); } catch (e) { /* stil */ }
      cleanup(true);
    },
    born: now(),
    key(e) {
      if (finished) return;
      if ((e.key === 'Enter' || e.key === ' ') && now() - inst.born < 150) return;
      if (answered) {
        if ((e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') && opts.feedback && !isInput(e.target)) { e.preventDefault(); finish(); }
        return;
      }
      const k = e.key;
      if ((k === 'h' || k === 'H') && !isInput(e.target) && ctl.hint) { e.preventDefault(); useHint(); return; }
      if ((k === 'v' || k === 'V') && !isInput(e.target) && speakOk) { e.preventDefault(); speakQ(true); return; }
      if (k === 'Enter' && btnGo && !isInput(e.target)) { if (ctl.ready()) { e.preventDefault(); submit(ctl.value()); } return; }
      if (ctl.key) ctl.key(e);
    },
  };
  ACTIVE.push(inst);
  BY_HOST.set(host, inst);
  wireKeys();
  if (ctl.focus) later(() => { try { ctl.focus(); } catch (e) { /* stil */ } }, 60);
  refreshSubmit();
  return { promise, cancel: () => inst.cancel() };
}
export const renderQ = ask;

/* ============================== controllers per vraagtype ============================== */
function makeCtl(api) {
  const q = api.q;
  if (q.t === 'mc') return mcCtl(api, false);
  if (q.t === 'fill') return q.o && q.o.length >= 2 ? mcCtl(api, true) : textCtl(api);
  if (q.t === 'tf') return tfCtl(api);
  if (q.t === 'multi') return multiCtl(api);
  if (q.t === 'order') return orderCtl(api);
  if (q.t === 'match') return matchCtl(api);
  return textCtl(api); // type, num
}

function sentenceNode(q, gap) { // fill: '___' vervangen door een gat
  const parts = q.q.split('___');
  const kids = [];
  parts.forEach((p, i) => { if (p) kids.push(p); if (i < parts.length - 1) kids.push(i === 0 ? gap : h('span', 'lq-gap', '…')); });
  return h('div', 'lq-q', kids, { role: 'heading', 'aria-level': '2' });
}

/* ---- meerkeuze (en fill met keuzes) ---- */
function mcCtl(api, fillMode) {
  const q = api.q;
  const list = api.opts.shuffle ? shuffle(q.o, api.rand) : q.o.slice();
  const short = list.every((x) => x.length <= 18) && list.length >= 4;
  const wrap = h('div', 'lq-opts' + (short ? ' lq-two' : ''), null, { role: 'group', 'aria-label': 'Antwoorden' });
  const btns = [];
  const gap = fillMode ? h('span', 'lq-gap', '…') : null;
  list.forEach((txt, i) => {
    const b = h('button', 'lq-opt', [h('span', 'lq-k', String(i + 1), { 'aria-hidden': 'true' }), h('span', 'lq-ot', txt)], { type: 'button' });
    b.style.setProperty('animation-delay', i * 40 + 'ms');
    api.on(b, 'click', () => { if (api.isDone()) return; add(b, 'lq-sel'); api.submit(txt); });
    btns.push({ b, txt, gone: false });
    wrap.appendChild(b);
  });
  let eliminated = 0;
  return {
    el: wrap, auto: true, qNode: fillMode ? sentenceNode(q, gap) : null,
    readOptions: () => list,
    focus() { /* niet focussen: voorkomt dat toetsenbordgebruikers per ongeluk selecteren */ },
    key(e) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= btns.length && !btns[n - 1].gone) { e.preventDefault(); btns[n - 1].b.click(); }
    },
    hint() {
      const wrong = btns.filter((x) => !x.gone && x.txt.toLowerCase() !== q.a.toLowerCase());
      const pickN = Math.min(2, wrong.length - 1);
      if (pickN <= 0) return false;
      for (const x of shuffle(wrong, api.rand).slice(0, pickN)) { x.gone = true; add(x.b, 'lq-gone'); x.b.setAttribute('disabled', ''); x.b.setAttribute('aria-hidden', 'true'); eliminated++; }
      return true;
    },
    reveal(res, given) {
      for (const x of btns) {
        x.b.setAttribute('disabled', '');
        const isA = x.txt.toLowerCase() === q.a.toLowerCase();
        const isG = given !== null && given !== undefined && x.txt === given;
        del(x.b, 'lq-sel');
        if (isA) add(x.b, 'lq-good'); else if (isG) add(x.b, 'lq-bad'); else if (!x.gone) add(x.b, 'lq-dim');
      }
      if (gap) { gap.textContent = res.ok ? q.a : (given || q.a); add(gap, res.ok ? 'lq-good' : 'lq-bad'); }
    },
  };
}

/* ---- waar / onwaar ---- */
function tfCtl(api) {
  const q = api.q;
  const mk = (val, icon, txt, key) => {
    const b = h('button', 'lq-opt', [h('span', 'lq-tfi', icon, { 'aria-hidden': 'true' }), h('span', '', txt)], { type: 'button', 'aria-label': txt + ' (toets ' + key + ')' });
    api.on(b, 'click', () => { if (api.isDone()) return; add(b, 'lq-sel'); api.submit(val); });
    return b;
  };
  const bT = mk(true, '👍', 'Waar', '1'), bF = mk(false, '👎', 'Onwaar', '2');
  const wrap = h('div', 'lq-tf', [bT, bF]);
  return {
    el: wrap, auto: true, hintable: false,
    readOptions: () => null,
    key(e) {
      const k = e.key.toLowerCase();
      if (['1', 'j', 'w', 'arrowleft'].includes(k)) { e.preventDefault(); bT.click(); }
      else if (['2', 'n', 'o', 'arrowright'].includes(k)) { e.preventDefault(); bF.click(); }
    },
    reveal(res, given) {
      bT.setAttribute('disabled', ''); bF.setAttribute('disabled', '');
      del(bT, 'lq-sel'); del(bF, 'lq-sel');
      const goodBtn = q.a ? bT : bF, badBtn = q.a ? bF : bT;
      add(goodBtn, 'lq-good');
      if (!res.ok && given !== null && given !== undefined) add(badBtn, 'lq-bad'); else add(badBtn, 'lq-dim');
    },
  };
}

/* ---- meerdere goede antwoorden ---- */
function multiCtl(api) {
  const q = api.q;
  const list = api.opts.shuffle ? shuffle(q.o, api.rand) : q.o.slice();
  const wrap = h('div', 'lq-opts', null, { role: 'group', 'aria-label': 'Kies alle goede antwoorden' });
  const st = list.map((txt) => ({ txt, sel: false, gone: false, b: null }));
  st.forEach((s, i) => {
    const k = h('span', 'lq-k', String(i + 1), { 'aria-hidden': 'true' });
    const b = h('button', 'lq-opt', [k, h('span', 'lq-ot', s.txt)], { type: 'button', 'aria-pressed': 'false' });
    s.b = b; s.k = k;
    api.on(b, 'click', () => {
      if (api.isDone() || s.gone) return;
      s.sel = !s.sel;
      if (s.sel) add(b, 'lq-sel'); else del(b, 'lq-sel');
      b.setAttribute('aria-pressed', String(s.sel)); k.textContent = s.sel ? '✓' : String(i + 1);
      api.sfx('klik'); api.refresh();
    });
    wrap.appendChild(b);
  });
  return {
    el: wrap, sub: 'Kies alle goede antwoorden',
    ready: () => st.some((s) => s.sel),
    value: () => st.filter((s) => s.sel).map((s) => s.txt),
    readOptions: () => list,
    key(e) { const n = parseInt(e.key, 10); if (n >= 1 && n <= st.length) { e.preventDefault(); st[n - 1].b.click(); } },
    hint() {
      const wrong = st.filter((s) => !s.gone && !q.a.some((a) => a.toLowerCase() === s.txt.toLowerCase()));
      if (!wrong.length) return false;
      for (const s of shuffle(wrong, api.rand).slice(0, 2)) { s.gone = true; s.sel = false; del(s.b, 'lq-sel'); add(s.b, 'lq-gone'); s.b.setAttribute('disabled', ''); }
      api.refresh();
      return true;
    },
    reveal() {
      for (const s of st) {
        s.b.setAttribute('disabled', '');
        const good = q.a.some((a) => a.toLowerCase() === s.txt.toLowerCase());
        del(s.b, 'lq-sel');
        s.k.textContent = good ? '✓' : (s.sel ? '✗' : '·');
        if (good) add(s.b, 'lq-good'); else if (s.sel) add(s.b, 'lq-bad'); else if (!s.gone) add(s.b, 'lq-dim');
      }
    },
  };
}

/* ---- typen: type, fill (open) en num ---- */
const CHARS = { de: ['ä', 'ö', 'ü', 'ß'], fr: ['é', 'è', 'ê', 'à', 'ç', 'ù', 'ô', 'î', 'œ'], es: ['á', 'é', 'í', 'ó', 'ú', 'ñ', '¿', '¡'] };
function textCtl(api) {
  const q = api.q;
  const isNum = q.t === 'num', isFill = q.t === 'fill';
  const mkInput = (cls) => {
    const inp = h('input', cls, null, { type: 'text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done', 'aria-label': 'Jouw antwoord' });
    if (isNum) { inp.setAttribute('inputmode', 'decimal'); inp.setAttribute('placeholder', 'Typ een getal'); }
    else { if (!isFill) inp.setAttribute('placeholder', 'Typ je antwoord…'); if (q.lang) inp.setAttribute('lang', q.lang); }
    return inp;
  };
  const inp = mkInput(isFill ? 'lq-gi' : 'lq-in');
  if (isFill) inp.setAttribute('size', String(Math.max(6, Math.min(24, String(q.a).length + 2))));
  api.on(inp, 'input', () => api.refresh());
  api.on(inp, 'keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); if (inp.value.trim()) api.submit(inp.value); }
  });
  const ans = String(isNum ? fmtLabelNum(q.a) : q.a);
  const single = !isNum && !/\s/.test(ans) && ans.length <= 24;
  const pat = h('div', 'lq-pat', '', { 'aria-live': 'polite' });
  const hintLine = h('div', 'lq-sub', '');
  let revealed = 0;
  const drawPat = () => {
    const chars = ans.split('');
    pat.textContent = chars.map((c, i) => (/\s/.test(c) ? '  ' : (i < revealed ? c : '_'))).join(' ');
  };
  if (!isNum && ans.length <= 40) drawPat();
  const wrap = h('div', '');
  wrap.style.setProperty('display', 'flex'); wrap.style.setProperty('flex-direction', 'column'); wrap.style.setProperty('gap', '.5rem');
  let gapNode = null;
  if (!isFill) wrap.appendChild(inp);
  if (!isNum) wrap.appendChild(pat);
  wrap.appendChild(hintLine);
  const chars = CHARS[q.lang];
  if (chars && !isNum) {
    const row = h('div', 'lq-chars');
    for (const c of chars) {
      const b = h('button', 'lq-ch', c, { type: 'button', 'aria-label': 'teken ' + c });
      api.on(b, 'click', () => { if (api.isDone()) return; inp.value += c; try { inp.focus(); } catch (e) { /* stil */ } api.refresh(); });
      row.appendChild(b);
    }
    wrap.appendChild(row);
  }
  if (isFill) { gapNode = sentenceNode(q, inp); }
  const numHint = () => {
    const a = Number(q.a); const w = Math.max(2, Math.round(Math.abs(a) * (revealed ? 0.12 : 0.4)));
    const off = (parseInt(qkey(q).slice(0, 3), 36) % (w + 1));
    const lo = Math.floor(a - off), hi = lo + w;
    hintLine.textContent = `💡 Het antwoord ligt tussen ${fmtLabelNum(lo)} en ${fmtLabelNum(Math.max(hi, Math.ceil(a)))}`;
  };
  return {
    el: wrap, qNode: gapNode,
    sub: isNum ? null : (single ? `${ans.length} letters` : null),
    ready: () => inp.value.trim().length > 0,
    value: () => inp.value,
    focus() { inp.focus(); },
    hint() {
      if (isNum) { numHint(); revealed++; return true; }
      if (revealed >= ans.length) return false;
      revealed = Math.min(ans.length, revealed + 1);
      drawPat();
      return true;
    },
    reveal(res, given) {
      inp.setAttribute('disabled', '');
      add(inp, res.ok ? 'lq-good' : 'lq-bad');
      if (isFill && gapNode) { /* het gat blijft de invoer */ }
    },
  };
}

/* ---- ordenen ---- */
function orderCtl(api) {
  const q = api.q;
  let cur = shuffle(q.a, api.rand);
  for (let t = 0; t < 6 && cur.every((x, i) => x === q.a[i]); t++) cur = shuffle(q.a, api.rand);
  if (cur.every((x, i) => x === q.a[i])) cur = cur.slice(1).concat(cur[0]);
  let locked = 0, sel = -1, grab = false, drag = null, done = false;
  const wrap = h('div', 'lq-ord', null, { role: 'list', 'aria-label': 'Zet in de goede volgorde' });
  const upOff = [];
  const mv = (i, d) => {
    const j = i + d;
    if (done || i < locked || j < locked || j >= cur.length) return false;
    const t = cur[i]; cur[i] = cur[j]; cur[j] = t;
    return true;
  };
  function render() {
    for (const f of upOff.splice(0)) f();
    clear(wrap);
    cur.forEach((txt, i) => {
      const isLock = i < locked;
      const hd = h('span', 'lq-hd', isLock ? '🔒' : '⠿', { 'aria-hidden': 'true' });
      const num = h('span', 'lq-on', String(i + 1), { 'aria-hidden': 'true' });
      const label = h('span', 'lq-ot', txt);
      label.style.setProperty('flex', '1');
      label.style.setProperty('overflow-wrap', 'anywhere');
      const up = h('button', '', '▲', { type: 'button', 'aria-label': 'Omhoog' });
      const dn = h('button', '', '▼', { type: 'button', 'aria-label': 'Omlaag' });
      if (done || isLock) { up.setAttribute('disabled', ''); dn.setAttribute('disabled', ''); }
      const row = h('div', 'lq-oi' + (isLock ? ' lq-lock' : '') + (sel === i ? ' lq-sel' : '') + (drag && drag.idx === i ? ' lq-ghost' : ''), [hd, num, label, h('span', 'lq-ar', [up, dn])], { role: 'listitem', tabindex: '0', 'aria-label': `${i + 1}. ${txt}` });
      const lis = (el, ev, fn) => { el.addEventListener(ev, fn); upOff.push(() => el.removeEventListener(ev, fn)); };
      lis(up, 'click', (e) => { e.stopPropagation(); if (mv(i, -1)) { sel = i - 1; api.sfx('klik'); render(); } });
      lis(dn, 'click', (e) => { e.stopPropagation(); if (mv(i, 1)) { sel = i + 1; api.sfx('klik'); render(); } });
      lis(row, 'click', () => {
        if (done || isLock) return;
        if (sel === -1 || sel === i) { sel = sel === i ? -1 : i; api.sfx('klik'); render(); return; }
        if (sel < locked) { sel = i; render(); return; }
        const t = cur[sel]; cur[sel] = cur[i]; cur[i] = t; sel = -1; api.sfx('klik'); render();
      });
      lis(hd, 'pointerdown', (e) => startDrag(e, i, row));
      wrap.appendChild(row);
    });
    api.refresh();
  }
  function startDrag(e, i, row) {
    if (done || i < locked || (e.button !== undefined && e.button > 0)) return;
    e.preventDefault && e.preventDefault();
    const rect = row.getBoundingClientRect ? row.getBoundingClientRect() : { left: 0, top: 0, width: 300, height: 52 };
    const ghost = h('div', 'lq-oi lq-drag', [h('span', 'lq-hd', '⠿'), h('span', 'lq-ot', cur[i])]);
    ghost.style.setProperty('width', rect.width + 'px');
    ghost.style.setProperty('left', rect.left + 'px');
    ghost.style.setProperty('top', rect.top + 'px');
    document.body.appendChild(ghost);
    drag = { idx: i, ghost, dy: (e.clientY || 0) - rect.top };
    sel = -1;
    render();
    const move = (ev) => {
      if (!drag) return;
      ghost.style.setProperty('top', (ev.clientY - drag.dy) + 'px');
      const rows = wrap.children;
      let target = drag.idx;
      for (let k = 0; k < rows.length; k++) {
        const r = rows[k].getBoundingClientRect ? rows[k].getBoundingClientRect() : null;
        if (r && ev.clientY >= r.top && ev.clientY <= r.bottom) { target = k; break; }
      }
      target = Math.max(locked, Math.min(cur.length - 1, target));
      if (target !== drag.idx) { const it = cur.splice(drag.idx, 1)[0]; cur.splice(target, 0, it); drag.idx = target; render(); }
    };
    const up = () => { endDrag(); };
    const cancelDrag = () => endDrag();
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', cancelDrag);
    drag.off = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', cancelDrag); };
  }
  function endDrag() {
    if (!drag) return;
    drag.off(); if (drag.ghost.parentNode) drag.ghost.parentNode.removeChild(drag.ghost);
    drag = null; api.sfx('klik'); render();
  }
  render();
  return {
    el: wrap,
    sub: 'Sleep, of tik op twee items om ze te wisselen',
    ready: () => true,
    value: () => cur.slice(),
    readOptions: () => cur,
    key(e) {
      const k = e.key;
      if (k === 'ArrowUp' || k === 'ArrowDown') {
        e.preventDefault();
        const d = k === 'ArrowUp' ? -1 : 1;
        if (sel === -1) sel = d > 0 ? locked : cur.length - 1;
        else if (grab) { if (mv(sel, d)) sel += d; }
        else sel = Math.max(locked, Math.min(cur.length - 1, sel + d));
        render();
      } else if (k === ' ' && sel >= locked) { e.preventDefault(); grab = !grab; api.sfx('klik'); }
    },
    hint() {
      if (locked >= cur.length - 1) return false;
      const want = q.a[locked];
      const at = cur.indexOf(want, locked);
      if (at < 0) return false;
      cur.splice(at, 1); cur.splice(locked, 0, want);
      locked++; sel = -1; render();
      return true;
    },
    reveal(res) {
      done = true; sel = -1; if (drag) endDrag();
      render();
      const rows = wrap.children;
      cur.forEach((x, i) => { const r = rows[i]; if (!r) return; add(r, x.toLowerCase() === q.a[i].toLowerCase() ? 'lq-good' : 'lq-bad'); });
    },
    destroy() { if (drag) { drag.off(); if (drag.ghost.parentNode) drag.ghost.parentNode.removeChild(drag.ghost); drag = null; } for (const f of upOff.splice(0)) f(); },
  };
}

/* ---- paren verbinden ---- */
function matchCtl(api) {
  const q = api.q;
  const left = q.a.map((p) => p[0]);
  const right = shuffle(q.a.map((p) => p[1]), api.rand);
  const n = left.length;
  const correctR = (li) => right.findIndex((r) => r.toLowerCase() === q.a[li][1].toLowerCase());
  const pairs = new Map(); // li -> ri
  const lockedL = new Set();
  let selL = -1, done = false;
  const lb = [], rb = [];
  const lcol = h('div', 'lq-mc'), rcol = h('div', 'lq-mc');
  const mkBtn = (txt, tag, i, side) => {
    const badge = h('span', 'lq-mb', tag, { 'aria-hidden': 'true' });
    const b = h('button', 'lq-mi', [badge, h('span', 'lq-ot', txt)], { type: 'button' });
    b._badge = badge; b._tag = tag;
    api.on(b, 'click', () => (side === 'L' ? clickL(i) : clickR(i)));
    return b;
  };
  left.forEach((t, i) => { const b = mkBtn(t, String(i + 1), i, 'L'); lb.push(b); lcol.appendChild(b); });
  right.forEach((t, i) => { const b = mkBtn(t, String.fromCharCode(65 + i), i, 'R'); rb.push(b); rcol.appendChild(b); });
  const grid = h('div', 'lq-mg', [lcol, rcol]);
  const NS = 'http://www.w3.org/2000/svg';
  let svg = null;
  try { svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'lq-ms'); svg.setAttribute('aria-hidden', 'true'); } catch (e) { svg = null; }
  const wrap = h('div', 'lq-mw', svg ? [svg, grid] : [grid]);
  const pairOfR = (ri) => { for (const [l, r] of pairs) if (r === ri) return l; return -1; };
  function paint() {
    lb.forEach((b, i) => { del(b, 'lq-sel', 'lq-p0', 'lq-p1', 'lq-p2', 'lq-p3', 'lq-p4', 'lq-p5'); b._badge.textContent = b._tag; });
    rb.forEach((b) => { del(b, 'lq-sel', 'lq-p0', 'lq-p1', 'lq-p2', 'lq-p3', 'lq-p4', 'lq-p5'); b._badge.textContent = b._tag; });
    if (selL >= 0) add(lb[selL], 'lq-sel');
    for (const [l, r] of pairs) { const c = 'lq-p' + (l % 6); add(lb[l], c); add(rb[r], c); rb[r]._badge.textContent = String(l + 1); lb[l]._badge.textContent = '✓'; }
    lines();
    api.refresh();
  }
  function lines() {
    if (!svg) return;
    try {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const base = wrap.getBoundingClientRect ? wrap.getBoundingClientRect() : null;
      if (!base || !base.width) return;
      const colors = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#0ea5e9', '#8b5cf6'];
      for (const [l, r] of pairs) {
        const a = lb[l].getBoundingClientRect(), b = rb[r].getBoundingClientRect();
        const ln = document.createElementNS(NS, 'line');
        ln.setAttribute('x1', String(a.right - base.left)); ln.setAttribute('y1', String(a.top + a.height / 2 - base.top));
        ln.setAttribute('x2', String(b.left - base.left)); ln.setAttribute('y2', String(b.top + b.height / 2 - base.top));
        ln.setAttribute('stroke', colors[l % 6]); ln.setAttribute('stroke-width', '4'); ln.setAttribute('stroke-linecap', 'round');
        svg.appendChild(ln);
      }
    } catch (e) { /* stil */ }
  }
  function clickL(i) {
    if (done) return;
    api.sfx('klik');
    if (lockedL.has(i)) return;
    if (pairs.has(i)) { pairs.delete(i); selL = i; } else selL = selL === i ? -1 : i;
    paint();
  }
  function clickR(ri) {
    if (done) return;
    api.sfx('klik');
    const owner = pairOfR(ri);
    if (selL >= 0) {
      if (owner >= 0 && lockedL.has(owner)) return;
      if (owner >= 0) pairs.delete(owner);
      pairs.set(selL, ri); selL = -1;
    } else if (owner >= 0 && !lockedL.has(owner)) { pairs.delete(owner); selL = owner; }
    paint();
  }
  const onResize = () => lines();
  try { window.addEventListener('resize', onResize); } catch (e) { /* stil */ }
  api.later(lines, 80);
  return {
    el: wrap, sub: 'Tik links op iets en dan rechts op wat erbij hoort',
    ready: () => pairs.size === n,
    value: () => [...pairs].map(([l, r]) => [left[l], right[r]]),
    readOptions: () => null,
    key(e) {
      const k = e.key;
      const num = parseInt(k, 10);
      if (num >= 1 && num <= n) { e.preventDefault(); clickL(num - 1); return; }
      const li = k.length === 1 ? k.toLowerCase().charCodeAt(0) - 97 : -1;
      if (li >= 0 && li < n) { e.preventDefault(); clickR(li); }
    },
    hint() {
      for (let li = 0; li < n; li++) {
        if (lockedL.has(li)) continue;
        const ri = correctR(li);
        if (pairs.get(li) === ri) { lockedL.add(li); continue; }
        const owner = pairOfR(ri);
        if (owner >= 0 && lockedL.has(owner)) continue;
        if (owner >= 0) pairs.delete(owner);
        pairs.set(li, ri); lockedL.add(li); selL = -1; paint();
        return true;
      }
      return false;
    },
    reveal() {
      done = true; selL = -1;
      paint();
      lb.forEach((b, li) => {
        b.setAttribute('disabled', ''); rb.forEach((x) => x.setAttribute('disabled', ''));
        const ri = pairs.get(li);
        const ok = ri !== undefined && ri === correctR(li);
        add(b, ok ? 'lq-good' : 'lq-bad'); if (ri !== undefined) add(rb[ri], ok ? 'lq-good' : 'lq-bad');
      });
    },
    destroy() { try { window.removeEventListener('resize', onResize); } catch (e) { /* stil */ } },
  };
}

void rng;
