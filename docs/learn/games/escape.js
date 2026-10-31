// Learn Spel 17: Escape-kamer. 5 kamers: zoek de plekken, los de sloten op met vragen, vind de 3 cijfers en de sleutel en ontsnap.
// Gebouwd uit tools/learn-stubs/src-c/escape.src.js (hulpjes ingebouwd).
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

const P = 'les';

export const ROOMS = [
  { name: 'De Bibliotheek', sky: ['#fde68a', '#b45309'], floor: '#78350f', things: ['📚', '🕰', '🪴', '🖼', '🧸', '🕯', '🪑', '🔭'], icons: ['book', 'hourglass', 'flower', 'paint', 'bear', 'flame', null, 'microscope'], door: '🚪' },
  { name: 'Het Laboratorium', sky: ['#bbf7d0', '#047857'], floor: '#064e3b', things: ['🧪', '🔬', '🧫', '💻', '🧬', '🗄', '⚗️', '🔋'], icons: ['potion', 'microscope', null, 'camera', null, null, 'flask', 'bolt'], door: '🚪' },
  { name: 'De Piramide', sky: ['#fef3c7', '#d97706'], floor: '#92400e', things: ['🏺', '🐍', '🦂', '🗿', '⚱️', '🪔', '📜', '🐫'], icons: [null, null, null, 'rock', null, 'flame', 'scroll', null], door: '🚪' },
  { name: 'Het Piratenschip', sky: ['#7dd3fc', '#1e3a8a'], floor: '#451a03', things: ['⚓', '🦜', '🏴‍☠️', '🛢', '🗺', '🧭', '🪝', '🐙'], icons: [null, 'owl', 'flag', null, 'map', 'compass', null, 'octopus'], door: '🚪' },
  { name: 'Het Ruimtestation', sky: ['#4338ca', '#0f172a'], floor: '#1e293b', things: ['🛰', '🚀', '👨‍🚀', '🪐', '🔋', '📡', '🌌', '🤖'], icons: ['satellite', 'rocket', 'astronaut', 'planet', 'bolt', 'ufo', 'comet', 'robot'], door: '🚪' }
];
// Nieuwe kamers (modus 'nieuw'); 'wereld' maakt kamers uit de gekozen wereld. In deze modi staat in elke kamer ook een kluis (extra puzzel, 2 goede antwoorden = bonus).
export const NEW_ROOMS = [
  { name: 'Het Kasteel', sky: ['#c7d2fe', '#6d28d9'], floor: '#312e81', things: ['🏰', '👑', '🛡️', '⚔️', '🐉', '🔔', '📜', '🕯'], icons: ['castle', 'crown', 'shield', 'sword', 'dragon', 'bell', 'scroll', 'flame'], door: '🚪' },
  { name: 'Het Snoephuis', sky: ['#fbcfe8', '#ec4899'], floor: '#9d174d', things: ['🍭', '🍩', '🧁', '🍪', '🍬', '🎂', '🍦', '🥧'], icons: ['lollipop', 'donut', 'cupcake', 'cookie', 'candy', 'cake', 'icecream', 'pie'], door: '🚪' },
  { name: 'De IJsgrot', sky: ['#e0f2fe', '#0ea5e9'], floor: '#0c4a6e', things: ['🐧', '🐻', '❄️', '🛖', '🔮', '🪨', '🌲', '🎿'], icons: ['penguin', 'bear', 'snowflake', 'igloo', 'crystal', 'rock', 'pine', null], door: '🚪' },
  { name: 'De Onderzeeër', sky: ['#67e8f9', '#164e63'], floor: '#083344', things: ['🐙', '🐢', '🦀', '🐚', '🐳', '🪼', '⚓', '🧭'], icons: ['octopus', 'turtle', 'crab', 'shell', 'whale', 'jellyfish', null, 'compass'], door: '🚪' }
];
export function worldRooms(world) {
  const bg = (world && world.bg) || ['#60a5fa', '#1e3a8a'], dec = ((world && world.deco) || []).filter(Boolean), nm = (world && world.name) || 'Wereld';
  const ic = dec.length ? dec : ['star', 'gem', 'key', 'chest'];
  return [0, 1, 2, 3].map(i => ({ name: nm + ' – kamer ' + (i + 1), sky: [bg[0], bg[bg.length - 1]], floor: (world && world.ground) || '#334155', things: Array(8).fill(''), icons: Array.from({ length: 8 }, (_, k) => ic[(k + i * 3) % ic.length]), door: '🚪' }));
}
export const ESCAPE_MODES = {
  klassiek: { name: 'Klassiek', desc: '5 kamers: bibliotheek tot ruimtestation.' },
  nieuw: { name: 'Nieuwe kamers', desc: '4 nieuwe kamers met een kluis om te kraken.' },
  wereld: { name: 'Mijn wereld', desc: 'Ontsnap uit kamers in jouw gekozen wereld, met kluizen.' }
};
export const POS = [[13, 18], [50, 12], [87, 20], [18, 46], [82, 46], [36, 32], [64, 32], [50, 54]];
export const DECOY = ['Alleen stof en een spinnenweb.', 'Hier zit niets bijzonders. Hmm.', 'Een oude sok! Gelukkig geen vraag.', 'Leeg. Iemand was je voor.', 'Het kraakt, maar er zit niets in.', 'Alleen een briefje: "Succes!"'];
export const PERKS = [
  { id: 'hints', ic: 'lightbulb', emoji: '💡', name: 'Hint-pakket', desc: '+2 hints voor elke kamer.' },
  { id: 'time', ic: 'hourglass', emoji: '⏱', name: 'Extra tijd', desc: '+45 s tijd voor het bonuspunten-record.' },
  { id: 'lock', ic: 'hammer', emoji: '🔧', name: 'Smeerolie', desc: 'De eerste fout in elke kamer telt niet.' },
  { id: 'lens', ic: 'microscope', emoji: '🔍', name: 'Vergrootglas', desc: 'Lege plekken zijn herkenbaar (gedimd).' },
  { id: 'digit', ic: 'dice', emoji: '🔢', name: 'Codekraker', desc: 'Elke kamer begint met 1 cijfer van de code gratis.' },
  { id: 'pick', ic: 'key', emoji: '🗝', name: 'Dietrich', desc: 'Het sleutelslot heeft 1 stap minder.' },
  { id: 'shield', ic: 'shield', emoji: '🛡️', name: 'Codeschild', desc: 'Een foute code telt niet als fout.' },
  { id: 'star', ic: 'star', emoji: '⭐', name: 'Sterrenbonus', desc: '+30 punten per ontsnapte kamer.' }
];
const DIFF_PAR = { 1: 200, 2: 160, 3: 125 };

export class EscapeRun {
  constructor(o = {}) {
    this.rand = o.rand || Math.random; this.fx = o.fx || {}; this.diff = o.level || 2; this.perks = {}; this.mode = ESCAPE_MODES[o.mode] ? o.mode : 'klassiek'; this.list = o.roomsList || (this.mode === 'nieuw' ? NEW_ROOMS : ROOMS); this.score = 0; this.rooms = 0; this.wrongAll = 0; this.hintsAll = 0; this.stars = 0; this.good = 0; this.best = 0; this.streak = 0; this.state = 'play';
    this.startRoom(0);
  }
  startRoom(i) {
    const r = this.rand; this.room = i; this.theme = this.list[i]; this.state = 'play'; this.code = [0, 0, 0].map(() => Math.floor(r() * 10)); this.shown = [false, false, false];
    this.hasKey = false; this.codeOk = false; this.open = false; this.wrong = 0; this.hintsUsed = 0; this.t = 0; this.free = this.perks.lock ? 1 : 0; this.hints = 2 + Math.round(this.fx.hints || 0) + 2 * (this.perks.hints || 0); this.tries = 0;
    const order = POS.map((_, k) => k).sort(() => r() - 0.5); this.spots = POS.map((p, k) => ({ x: p[0], y: p[1], e: this.theme.things[k], ic: this.theme.icons && this.theme.icons[k], role: 'decoy', done: false, prog: 0, need: 1, text: DECOY[Math.floor(r() * DECOY.length)] }));
    [0, 1, 2].forEach(d => { const s = this.spots[order[d]]; s.role = 'digit'; s.d = d; s.need = 1 + (i >= 3 && d === 2 ? 1 : 0); });
    const ks = this.spots[order[3]]; ks.role = 'key'; ks.need = Math.max(1, 1 + (i >= 2 ? 1 : 0) + (i >= 4 ? 1 : 0) - (this.perks.pick || 0));
    this.spots[order[4]].role = 'hint';
    if (this.mode !== 'klassiek') { const sf = this.spots[order[5]]; sf.role = 'safe'; sf.need = 2; }
    if (this.perks.digit) { const d = Math.floor(r() * 3); this.shown[d] = true; this.spots.find(s => s.role === 'digit' && s.d === d).done = true; }
    this.par = (DIFF_PAR[this.diff] || 160) + 45 * (this.perks.time || 0) + 20 * i;
  }
  lens(s) { return this.perks.lens && s.role === 'decoy'; }
  examine(idx) {
    const s = this.spots[idx]; if (!s) return { r: 'none' };
    if (s.done) return { r: 'done' };
    if (s.role === 'decoy') { s.done = true; return { r: 'empty', text: s.text }; }
    if (s.role === 'hint') { s.done = true; this.hints++; return { r: 'hint', text: 'Een hint-token gevonden! 💡 +1' }; }
    return { r: 'locked', role: s.role, prog: s.prog, need: s.need };
  }
  solve(idx, ok) {
    const s = this.spots[idx]; if (!s || s.done || (s.role !== 'digit' && s.role !== 'key' && s.role !== 'safe')) return { r: 'none' };
    if (!ok && s.role === 'safe') { s.prog = 0; this.streak = 0; return { r: 'safefail' }; }
    if (!ok) { this.streak = 0; if (this.free > 0) { this.free--; return { r: 'free' }; } this.wrong++; this.wrongAll++; return { r: 'wrong' }; }
    this.good++; this.streak++; if (this.streak > this.best) this.best = this.streak; s.prog++;
    if (s.prog < s.need) return { r: 'progress', prog: s.prog, need: s.need };
    s.done = true; if (s.role === 'safe') { this.hints++; this.score += 25; return { r: 'safe' }; }
    if (s.role === 'digit') { this.shown[s.d] = true; return { r: 'digit', d: s.d, v: this.code[s.d] }; }
    this.hasKey = true; return { r: 'key' };
  }
  enterCode(str) {
    this.tries++; const ok = String(str) === this.code.join(''); if (ok) this.codeOk = true; else if (!this.perks.shield) { this.wrong++; this.wrongAll++; }
    return { ok, door: ok && this.hasKey };
  }
  tryDoor() { if (this.codeOk && this.hasKey) { this.open = true; return this.finishRoom(); } return null; }
  hint() {
    if (this.hints <= 0) return null; this.hints--; this.hintsUsed++; this.hintsAll++;
    const nxt = this.spots.findIndex(s => !s.done && (s.role === 'digit' || (s.role === 'key')));
    const dg = this.spots.findIndex(s => !s.done && s.role === 'digit');
    if (dg >= 0) return { spot: dg }; if (nxt >= 0) return { spot: nxt };
    return { door: true };
  }
  finishRoom() {
    const tb = Math.max(0, Math.round((this.par - this.t) / this.par * 80)); const sc = Math.max(40, 100 + tb - 15 * this.wrong - 20 * this.hintsUsed + 20 * this.room) + 30 * (this.perks.star || 0);
    const stars = this.wrong === 0 && this.hintsUsed === 0 && this.t <= this.par ? 3 : this.wrong <= 2 && this.t <= this.par * 1.5 ? 2 : 1;
    this.score += sc; this.stars += stars; this.rooms++; this.state = this.room + 1 >= this.list.length ? 'won' : 'perk';
    return { score: sc, stars, time: this.t, wrong: this.wrong };
  }
  offers() { const pool = PERKS.filter(p => (p.id === 'hints' || p.id === 'time') || !this.perks[p.id]); const out = []; while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(this.rand() * pool.length), 1)[0]); return out; }
  pickPerk(id) { this.perks[id] = (this.perks[id] || 0) + 1; this.startRoom(this.room + 1); }
}

const CSS = `
.${P}-scene{position:relative;flex:1;margin:4px 8px;border-radius:20px;overflow:hidden;min-height:280px;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.${P}-floor{position:absolute;left:0;right:0;bottom:0;height:34%;}
.${P}-sp{position:absolute;transform:translate(-50%,-50%);border:0;background:rgba(255,255,255,.2);border-radius:22px;width:calc(76px*var(--gfx-scale,1));height:calc(76px*var(--gfx-scale,1));font-size:42px;cursor:pointer;padding:0;transition:transform .2s,opacity .3s;box-shadow:0 4px 0 rgba(0,0,0,.3),0 8px 14px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center}
.${P}-sp:active{transform:translate(-50%,-50%) scale(.9)}
.${P}-sp.done{opacity:.4;box-shadow:none}.${P}-sp.glow{animation:${P}gl .8s infinite;background:rgba(253,224,71,.55)}
.${P}-sp.lock::after{content:'🔒';position:absolute;right:-4px;top:-8px;font-size:20px}
.${P}-sp.safe{background:rgba(250,204,21,.28);box-shadow:0 0 0 3px #facc15,0 4px 0 rgba(0,0,0,.3)}
.${P}-sp.dim{opacity:.7}
.${P}-door{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);width:100px;height:120px;border:0;border-radius:14px 14px 4px 4px;background:linear-gradient(#92400e,#451a03);font-size:44px;cursor:pointer;box-shadow:0 0 0 5px #1c0f06,0 8px 14px rgba(0,0,0,.35);color:#fde047;display:flex;align-items:center;justify-content:center}
.${P}-door.open{background:linear-gradient(#bbf7d0,#22c55e);animation:${P}gl .8s 3}
html[data-reduce="1"] .${P}-sp.glow,html[data-reduce="1"] .${P}-door.open{animation:none}
@keyframes ${P}gl{50%{transform:translate(-50%,-50%) scale(1.14)}}
.${P}-inv{display:flex;gap:8px;justify-content:center;align-items:center;padding:6px 8px 10px;flex-wrap:wrap}
.${P}-dg{width:56px;height:60px;border-radius:14px;background:var(--card);display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:900;box-shadow:0 2px 8px rgba(0,0,0,.2)}
.${P}-dg.on{background:#fde047;color:#422006}
.${P}-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}.${P}-pad button{margin:0;font-size:26px;min-height:62px}
.${P}-disp{font-size:38px;letter-spacing:10px;font-weight:900;background:#052e16;color:#4ade80;border-radius:12px;padding:8px;min-height:60px;font-family:monospace}
.${P}-say{position:absolute;left:8px;right:8px;top:8px;background:rgba(0,0,0,.72);color:#fff;border-radius:14px;padding:8px 12px;font-weight:700;font-size:calc(15px*var(--gfx-font,1));text-align:center;pointer-events:none;z-index:5}`;

export default {
  id: 'escape', name: 'Escape-kamer', emoji: '🔐', color: '#7c3aed',
  desc: 'Zoek in de kamer, kraak de sloten met je kennis en vind de code en de sleutel om te ontsnappen.',
  tags: ['denken', 'rustig', 'solo'], minutes: 7, duo: false,
  create(host, env) {
    const L = lifecycle(); const style = css(baseCss(P) + CSS); host.textContent = '';
    const { H } = dims(host, env); const root = $('div', P + '-root'); root.style.height = H + 'px'; host.appendChild(root);
    const gx = Gx.start(root, env, 'escape'); let mode = 'klassiek';
    let g = new EscapeRun({ rand: env.rand || Math.random, fx: env.fx, level: env.level });
    const S = mkStats(); const ov = mkOv(root, P); const asker = makeAsker(env, ov, P, L); const nextQ = qsupply(env);
    let started = false, ended = false, busy = false, lastT = 0, glowSpot = -1, glowDoor = false, spotEls = [], doorEl = null;
    const hud = $('div', P + '-hud'); const chip = {}; ['room', 'time', 'score', 'hint'].forEach(k => { chip[k] = $('span', P + '-chip'); hud.appendChild(chip[k]); });
    const scene = $('div', P + '-scene'); const inv = $('div', P + '-inv'); const sayEl = $('div', P + '-say'); sayEl.style.display = 'none';
    root.append(hud, scene, inv);
    const timeChip = () => { chip.time.innerHTML = Gx.ic('hourglass', 24, '⏱') + ' ' + Math.round(g.t) + '/' + g.par; };
    const say = (t) => { sayEl.textContent = t; sayEl.style.display = 'block'; scene.appendChild(sayEl); L.after(() => { sayEl.style.display = 'none'; }, 2600); };
    const build = () => {
      scene.textContent = ''; spotEls = []; const T = g.theme; scene.style.background = 'linear-gradient(' + T.sky[0] + ',' + T.sky[1] + ')';
      const fl = $('div', P + '-floor'); fl.style.background = 'linear-gradient(rgba(0,0,0,.15),' + T.floor + ')'; scene.appendChild(fl);
      g.spots.forEach((s, i) => { const b = $h('button', P + '-sp', Gx.ic(s.ic, 54, s.e || undefined)); b.style.left = s.x + '%'; b.style.top = s.y * 1.1 + 4 + '%'; b.onclick = () => tapSpot(i); scene.appendChild(b); spotEls.push(b); });
      doorEl = $('button', P + '-door', ''); doorEl.onclick = () => tapDoor(); scene.appendChild(doorEl);
    };
    const paint = () => {
      g.spots.forEach((s, i) => { const b = spotEls[i]; if (!b) return; b.className = P + '-sp' + (s.done ? ' done' : '') + (!s.done && (s.role === 'digit' || s.role === 'key') && s.prog > 0 ? ' lock' : '') + (glowSpot === i ? ' glow' : '') + (!s.done && g.lens(s) ? ' dim' : '') + (s.role === 'safe' && !s.done ? ' safe' : ''); });
      if (doorEl) doorEl.className = P + '-door' + (g.open ? ' open' : '') + (glowDoor ? ' glow' : ''); if (doorEl) { const dk = g.open ? 'star' : (g.codeOk && g.hasKey ? 'key' : 'lock'); if (doorEl._k !== dk) { doorEl._k = dk; doorEl.innerHTML = Gx.ic(dk, 64, dk === 'star' ? '🌟' : dk === 'key' ? '🔓' : '🔒'); } }
      chip.room.innerHTML = Gx.ic('key', 24, '🚪') + ' ' + (g.room + 1) + '/' + g.list.length + ' ' + g.theme.name; timeChip(); chip.score.innerHTML = Gx.ic('trophy', 24, '🏆') + ' ' + fmtN(g.score); chip.hint.innerHTML = Gx.ic('lightbulb', 24, '💡') + ' ' + g.hints;
      inv.textContent = ''; for (let d = 0; d < 3; d++) { inv.appendChild($('div', P + '-dg' + (g.shown[d] ? ' on' : ''), g.shown[d] ? String(g.code[d]) : '?')); }
      inv.appendChild($h('div', P + '-dg' + (g.hasKey ? ' on' : ''), g.hasKey ? Gx.ic('key', 40, '🗝') : '·')); const bh = $h('button', P + '-btn alt', Gx.ic('lightbulb', 26, '💡') + ' Hint'); bh.disabled = g.hints <= 0; bh.onclick = useHint; inv.appendChild(bh);
    };
    const useHint = () => { if (!started || busy || ov.shown) return; const h = g.hint(); if (!h) return; snd(env, 'power'); glowSpot = h.spot != null ? h.spot : -1; glowDoor = !!h.door; say(h.door ? '🤖 Robbie: Tik op de deur en toets de code in!' : '🤖 Robbie: kijk daar eens goed!'); paint(); L.after(() => { glowSpot = -1; glowDoor = false; paint(); }, 5000); };
    const tapSpot = async (i) => {
      if (!started || busy || ov.shown || g.state !== 'play') return; const res = g.examine(i); snd(env, 'klik');
      if (res.r === 'done') { say('Hier ben je al geweest.'); return; }
      if (res.r === 'empty' || res.r === 'hint') { say(res.text); if (res.r === 'hint') snd(env, 'munt'); paint(); return; }
      if (res.r === 'locked') {
        busy = true; say(res.role === 'safe' ? 'Een kluis! Twee goede antwoorden na elkaar (' + (res.prog + 1) + '/' + res.need + ').' : res.role === 'key' ? '🗝 Een slot! Los de vraag op' + (res.need > 1 ? ' (' + (res.prog + 1) + '/' + res.need + ')' : '') + '.' : '🔒 Een cijferslot: beantwoord de vraag.');
        const r = await asker.ask(nextQ(g.room > 2 ? 3 : g.room > 0 ? 2 : 1), { time: 0 }); busy = false; if (L.dead) return; S.mark(r.ok);
        const o = g.solve(i, !!r.ok); snd(env, r.ok ? 'goed' : 'fout');
        if (o.r === 'wrong') say('Het slot klemt. Probeer het nog eens!'); else if (o.r === 'free') say('🔧 Smeerolie! Deze fout telt niet.'); else if (o.r === 'progress') say('Eén slot open, nog ' + (o.need - o.prog) + ' te gaan.');
        else if (o.r === 'digit') { say('🔢 Cijfer ' + (o.d + 1) + ' is ' + o.v + '!'); snd(env, 'level'); gx.burstEl(spotEls[i], 'sparkle', 12); } else if (o.r === 'key') { say('🗝 Je vond de sleutel!'); snd(env, 'level'); gx.burstEl(spotEls[i], 'stars', 14); }
        else if (o.r === 'safe') { say('Kluis open! +25 punten en een hint.'); snd(env, 'munt'); gx.burstEl(spotEls[i], 'coins', 10); } else if (o.r === 'safefail') say('De kluis blijft dicht. Probeer het opnieuw!');
        paint();
      }
    };
    const keypad = () => {
      let cur = ''; const w = $('div'); const disp = $('div', P + '-disp', '___'); const pad = $('div', P + '-pad'); const info = $('p', '', 'Toets de 3 cijfers van de code in.');
      const upd = () => { disp.textContent = (cur + '___').slice(0, 3).split('').join(' '); };
      for (const n of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK']) { const b = $('button', P + '-btn' + (n === 'OK' ? '' : ' alt'), n); b.onclick = () => { snd(env, 'klik');
        if (n === '⌫') cur = cur.slice(0, -1); else if (n === 'OK') { if (cur.length < 3) { info.textContent = 'Nog niet genoeg cijfers.'; return; } const r = g.enterCode(cur); if (!r.ok) { snd(env, 'fout'); info.textContent = '❌ Piep! Fout. Zoek de cijfers (de gele vakjes).'; cur = ''; upd(); paint(); return; } snd(env, 'goed'); ov.hide(); if (r.door) openDoor(); else { say('✅ Code klopt! Nu nog de sleutel 🗝'); paint(); } return; } else if (cur.length < 3) cur += n; upd(); }; pad.appendChild(b); }
      const shown = $('p', '', 'Bekende cijfers: ' + g.code.map((c, i) => g.shown[i] ? c : '?').join(' ')); w.append(shown, disp, info, pad);
      ov.show(card(P, { ic: 'lock', emoji: '🔢', title: 'Codeslot', extra: w, btn: 'Terug', onBtn: () => ov.hide() }));
    };
    const openDoor = () => {
      const r = g.tryDoor(); if (!r) return; snd(env, 'win'); paint();
      L.after(() => {
        if (g.state === 'won') { gx.burst((root.clientWidth || 360) / 2, 200, 'confetti', 70); ov.show(card(P, { ic: 'trophy', emoji: '🏆', title: 'Ontsnapt uit alle kamers!', text: 'Je behaalde ' + g.stars + ' sterren en ' + fmtN(g.score) + ' punten.', btn: 'Klaar', onBtn: () => { ov.hide(); finish(true, 'Alle ' + g.list.length + ' kamers ontsnapt met ' + g.stars + ' sterren.'); } })); return; }
        const w = $('div'); const row = $('div', P + '-row'); g.offers().forEach(p => { const c = $('div', P + '-shopi'); c.append($h('div', P + '-big', Gx.ic(p.ic, 60, p.emoji)), $('b', '', p.name), $('small', '', p.desc)); const b = $('button', P + '-btn', 'Kies'); b.onclick = () => { ov.hide(); g.pickPerk(p.id); build(); paint(); say(g.theme.name + '! Zoek de cijfers en de sleutel.'); }; c.appendChild(b); row.appendChild(c); }); w.appendChild(row);
        gx.burst((root.clientWidth || 360) / 2, 160, 'confetti', 40);
        ov.show(card(P, { ic: 'star', emoji: '🎉', title: 'Kamer ' + (g.room + 1) + ' ontsnapt!', text: '⭐'.repeat(r.stars) + '  +' + r.score + ' punten (' + Math.round(r.time) + ' s). Kies een voordeel:', extra: w }));
      }, 700);
    };
    const tapDoor = () => { if (!started || busy || ov.shown || g.state !== 'play') return; snd(env, 'klik'); if (g.codeOk && g.hasKey) { openDoor(); return; } if (g.codeOk) { say('De code klopt al. Je mist nog de sleutel 🗝'); return; } keypad(); };
    const finish = (win, why) => { if (ended) return; ended = true; env.end({ score: Math.round(g.score), win: !!win, stats: { correct: S.correct, wrong: S.wrong, best: S.best, kamers: g.rooms, sterren: g.stars, hints: g.hintsAll }, summary: why }); };
    build(); paint();
    L.every(() => { if (!started) return; const now = performance.now(); const dt = Math.min(1, (now - lastT) / 1000); lastT = now; if (ov.shown || busy || g.state !== 'play') return; g.t += dt; timeChip(); }, 500);
    const mp = modePicker(P, ESCAPE_MODES, mode, null);
    ov.show(card(P, { ic: 'key', emoji: '🔐', title: 'Escape-kamer', text: 'Tik op dingen in de kamer. Sloten openen met een goed antwoord. Vind 3 cijfers + de sleutel, toets de code in op de deur. Hint helpt als je vastzit!', extra: mp.el, btn: 'Tik om te beginnen', onBtn: () => {
      mode = mp.get(); if (mode !== 'klassiek') { g = new EscapeRun({ rand: env.rand || Math.random, fx: env.fx, level: env.level, mode, roomsList: mode === 'wereld' ? worldRooms(gx.world) : null }); build(); paint(); }
      ov.hide(); started = true; lastT = performance.now(); snd(env, 'klik'); say('Zoek de 3 cijfers en de sleutel.'); } }));
    return { destroy() { asker.cancel(); L.kill(); gx.destroy(); try { style.remove(); } catch (e) {} host.textContent = ''; } };
  }
};
