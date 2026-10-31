// Learn Spel 15: Poortvlucht. Vlieg door 5 luchten, ontwijk obstakels, pak sterren en beantwoord de vraag bij elke poort.
// Gebouwd uit tools/learn-stubs/src-c/vlieg.src.js (hulpjes ingebouwd).
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

const P = 'lvl';

export const STAGES = [
  { name: 'Zonnige ochtend', sky: ['#7dd3fc', '#e0f2fe'], speed: 150, gates: 3, gap: 1000, dens: 0.55, kinds: ['bird', 'balloon'] },
  { name: 'Gouden middag', sky: ['#fdba74', '#fef3c7'], speed: 165, gates: 4, gap: 980, dens: 0.65, kinds: ['bird', 'balloon', 'cloud'] },
  { name: 'Sterrennacht', sky: ['#1e1b4b', '#4338ca'], speed: 175, gates: 4, gap: 960, dens: 0.75, kinds: ['bird', 'cloud', 'kite'] },
  { name: 'Onweer', sky: ['#475569', '#94a3b8'], speed: 185, gates: 4, gap: 940, dens: 0.85, kinds: ['cloud', 'bolt', 'bird'] },
  { name: 'Ruimte', sky: ['#020617', '#312e81'], speed: 195, gates: 5, gap: 920, dens: 0.95, kinds: ['rock', 'ufo', 'bolt'] }
];
// Nieuwe luchten (modus 'avontuur') en wereldvluchten (modus 'wereld', gemaakt uit de gekozen wereld)
export const NEW_STAGES = [
  { name: 'Regenboogvallei', sky: ['#a78bfa', '#fbcfe8'], speed: 165, gates: 4, gap: 960, dens: 0.7, kinds: ['balloon', 'butterfly', 'cloud'], rainbow: true },
  { name: 'Woestijnwind', sky: ['#fb923c', '#fde68a'], speed: 178, gates: 4, gap: 940, dens: 0.8, kinds: ['bird', 'plane', 'kite'] },
  { name: 'Poolnacht', sky: ['#0f172a', '#0e7490'], speed: 188, gates: 4, gap: 930, dens: 0.88, kinds: ['bird', 'cloud', 'comet'], night: true },
  { name: 'Vulkaanroute', sky: ['#450a0a', '#ea580c'], speed: 200, gates: 5, gap: 910, dens: 0.98, kinds: ['rock', 'flame', 'dragon'] }
];
export function worldStages(world) {
  const deco = ((world && world.deco) || []).filter(Boolean); const kinds = deco.length ? deco.slice(0, 6) : ['balloon', 'cloud'];
  const bg = (world && world.bg) || ['#7dd3fc', '#e0f2fe'];
  return [0, 1, 2, 3].map(i => ({ name: ((world && world.name) || 'Wereld') + ' ' + (i + 1), sky: [bg[0], bg[bg.length - 1]], speed: 150 + 15 * i, gates: i === 3 ? 5 : 3 + (i > 0 ? 1 : 0), gap: 990 - 25 * i, dens: 0.6 + 0.12 * i, kinds, paint: true, night: !!(world && world.mood === 'dark') }));
}
export const FLIGHT_MODES = {
  klassiek: { name: 'Klassieke vlucht', desc: '5 luchten van ochtend tot ruimte.' },
  avontuur: { name: 'Avontuurlijke route', desc: '4 nieuwe luchten: regenboog, woestijn, poolnacht en vulkaan.' },
  wereld: { name: 'Mijn wereld', desc: 'Vlieg door jouw gekozen wereld met obstakels uit die wereld.' }
};
export const HANGAR = [
  { id: 'shield', ic: 'shield', emoji: '🛡', name: 'Schild', desc: 'Vangt 1 botsing op.', max: 9, cost: l => 8 + 2 * l },
  { id: 'heart', ic: 'heart', emoji: '❤️', name: 'Extra leven', desc: '+1 hartje.', max: 4, cost: l => 14 + 5 * l },
  { id: 'magnet', ic: 'magnet', emoji: '🧲', name: 'Sterrenmagneet', desc: 'Pakt ook sterren op de banen ernaast.', max: 1, cost: () => 12 },
  { id: 'dbl', ic: 'star', emoji: '💫', name: 'Meer sterren', desc: '+50% sterren.', max: 3, cost: l => 10 + 8 * l },
  { id: 'boost', ic: 'rocket', emoji: '🚀', name: 'Turbo', desc: 'Langere turbo na een goede poort.', max: 3, cost: l => 9 + 6 * l },
  { id: 'calm', ic: 'leaf', emoji: '🍃', name: 'Rustige lucht', desc: 'Vliegt 6% trager.', max: 3, cost: l => 10 + 6 * l },
  { id: 'bell', ic: 'bell', emoji: '🔔', name: 'Poortbel', desc: 'Extra sterren bij elke open poort.', max: 3, cost: l => 9 + 7 * l },
  { id: 'clover', ic: 'clover', emoji: '🍀', name: 'Geluksklaver', desc: 'Af en toe een gratis open poort.', max: 2, cost: l => 18 + 14 * l }
];
const DM = { 1: 0.88, 2: 1, 3: 1.12 };
const RIVAL_T = { 1: 420, 2: 330, 3: 270 };

export class Flight {
  constructor(o = {}) {
    this.rand = o.rand || Math.random; this.fx = o.fx || {}; this.diff = o.level || 2;
    this.lives = 3 + Math.max(0, Math.round(this.fx.extraLives || 0)); this.shield = this.fx.shield ? 1 : 0;
    this.up = { shield: 0, heart: 0, magnet: 0, dbl: 0, boost: 0, calm: 0, bell: 0, clover: 0 };
    this.mode = FLIGHT_MODES[o.mode] ? o.mode : 'klassiek'; this.stages = o.stages || (this.mode === 'avontuur' ? NEW_STAGES : STAGES);
    this.stars = Math.min(24, Math.round((this.fx.startCash || 0) / 5)); this.score = 0; this.streak = 0; this.best = 0;
    this.good = 0; this.bad = 0; this.hits = 0; this.starsTotal = 0; this.d = 0; this.lane = 1; this.laneF = 1; this.boost = 0; this.inv = 0; this.t = 0; this.stage = -1; this.state = 'play';
    this.startStage(0);
  }
  get mult() { return 1 + Math.min(this.streak, 10) * (0.1 + (this.fx.streakBonus || 0) * 0.5); }
  startStage(i) {
    this.stage = i; const S = this.S = this.stages[i]; this.d = 0; this.items = []; this.boost = 0; this.inv = 0; this.state = 'play'; this.gateIdx = 0;
    const r = this.rand; let x = 330;
    for (let k = 0; k < S.gates; k++) {
      const gx = (k + 1) * S.gap;
      while (x < gx - 260) {
        if (r() < S.dens) {
          const free = Math.floor(r() * 3), blocked = [0, 1, 2].filter(l => l !== free); const n = r() < 0.35 + 0.15 * i ? 2 : 1;
          const kind = S.kinds[Math.floor(r() * S.kinds.length)];
          (n === 2 ? blocked : [blocked[Math.floor(r() * 2)]]).forEach(l => this.items.push({ x, lane: l, kind: 'ob', ob: kind, hit: false }));
          if (r() < 0.8) for (let c = 0; c < 3; c++) this.items.push({ x: x + 70 + c * 38, lane: free, kind: 'coin', got: false });
        } else { const l = Math.floor(r() * 3); for (let c = 0; c < 4; c++) this.items.push({ x: x + c * 38, lane: l, kind: 'coin', got: false }); }
        x += 210 + r() * 70;
      }
      this.items.push({ x: gx, lane: 1, kind: 'gate', state: 'closed' }); x = gx + 300;
    }
    this.end = S.gates * S.gap + 380;
  }
  speed() { return this.S.speed * (DM[this.diff] || 1) * (this.boost > 0 ? 1.45 : 1) * (1 - 0.06 * this.up.calm); }
  move(dl) { this.lane = clamp(this.lane + dl, 0, 2); }
  addStars(n) { const g = Math.max(1, Math.round(n * (1 + 0.5 * this.up.dbl) * (this.fx.cashMult || 1))); this.stars += g; this.starsTotal += g; return g; }
  hurt(ev) {
    if (this.inv > 0) return; if (this.shield > 0) { this.shield--; this.inv = 1.2; ev.push('shield'); return; }
    this.lives--; this.hits++; this.streak = 0; this.inv = 1.8; ev.push('hurt'); if (this.lives <= 0) { this.state = 'over'; ev.push('over'); }
  }
  update(dt) {
    const ev = []; if (this.state !== 'play') return ev;
    this.t += dt; if (this.boost > 0) this.boost -= dt; if (this.inv > 0) this.inv -= dt;
    this.laneF += (this.lane - this.laneF) * Math.min(1, dt * 12); const prevD = this.d; this.d += this.speed() * dt;
    for (const it of this.items) {
      if (it.kind === 'gate') { if (it.state === 'closed' && prevD < it.x && this.d >= it.x) { this.d = it.x; this.state = 'ask'; this.cur = it; ev.push({ e: 'gate', it }); return ev; } continue; }
      if ((it.got || it.hit) || Math.abs(it.x - this.d) > 22) continue;
      const dl = Math.abs(this.laneF - it.lane);
      if (it.kind === 'coin') { if (dl < 0.55 || (this.up.magnet && dl < 1.55)) { it.got = true; const g = this.addStars(1); this.score += Math.round(5 * this.mult); ev.push({ e: 'coin', it, g }); } }
      else if (dl < 0.6 && this.boost <= 0) { it.hit = true; this.hurt(ev); ev.push({ e: 'bump', it }); if (this.state === 'over') return ev; }
    }
    if (this.d >= this.end) { this.state = 'hangar'; this.score += 100 * (this.stage + 1); ev.push('stage'); }
    return ev;
  }
  answer(ok) {
    const ev = []; if (this.state !== 'ask') return ev; this.state = 'play'; const it = this.cur;
    if (!ok && this.up.clover > 0 && this.rand() < 0.15 * this.up.clover) { ok = true; this.freeGate = (this.freeGate || 0) + 1; }
    if (ok) { it.state = 'open'; this.streak++; if (this.streak > this.best) this.best = this.streak; this.good++; this.score += Math.round(100 * this.mult); this.addStars(3 + this.up.bell * 2); this.boost = 2.2 + 1.3 * this.up.boost; this.inv = Math.max(this.inv, this.boost); ev.push('open'); }
    else { it.state = 'broken'; this.bad++; this.hurt(ev); this.streak = 0; ev.push('smash'); }
    this.d = it.x + 1; return ev;
  }
  offers() { const pool = HANGAR.filter(h => h.id === 'shield' || h.id === 'heart' || this.up[h.id] < h.max); const out = []; while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(this.rand() * pool.length), 1)[0]); return out; }
  priceOf(h) { return h.cost(this.up[h.id]); }
  buy(id) { const h = HANGAR.find(x => x.id === id); if (!h) return false; const lv = this.up[id]; if (id !== 'heart' && id !== 'shield' && lv >= h.max) return false; const c = h.cost(lv); if (this.stars < c) return false; this.stars -= c; this.up[id]++; if (id === 'heart') this.lives++; if (id === 'shield') this.shield++; return true; }
  nextStage() { if (this.state !== 'hangar') return; if (this.stage + 1 >= this.stages.length) { this.state = 'won'; return; } this.startStage(this.stage + 1); }
  progress() { return clamp((this.stage + clamp(this.d / this.end, 0, 1)) / this.stages.length, 0, 1); }
  rivalProgress() { return clamp((this.wall || 0) / (RIVAL_T[this.diff] || 330), 0, 1); }
}

const CSS = `
.${P}-cvw{flex:1;position:relative;min-height:0}
.${P}-cvw canvas{display:block;width:100%;touch-action:none}
.${P}-ctl{display:flex;gap:12px;justify-content:center;padding:6px}
.${P}-ctl button{flex:0 0 120px;border:0;border-radius:20px;font-size:32px;min-height:64px;background:var(--card);color:var(--ink);cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.25),0 6px 12px rgba(0,0,0,.2)}
.${P}-ctl button:active{background:var(--accent);color:#fff}
.${P}-race{height:14px;border-radius:7px;background:var(--card);position:relative;margin:6px 22px 4px;box-shadow:0 2px 6px rgba(0,0,0,.2),0 0 0 3px var(--card)}
.${P}-race b{position:absolute;top:-14px;transition:left .3s linear;line-height:0}
.${P}-cvw canvas{border-radius:16px;box-shadow:0 6px 18px rgba(0,0,0,.3)}
.${P}-cvw{margin:0 6px}`;

export default {
  id: 'vlieg', name: 'Poortvlucht', emoji: '✈️', color: '#0ea5e9',
  desc: 'Vlieg omhoog en omlaag langs obstakels en beantwoord bij elke poort de vraag om erdoorheen te komen.',
  tags: ['snel', 'race', 'solo'], minutes: 5, duo: false,
  create(host, env) {
    const L = lifecycle(); const style = css(baseCss(P) + CSS); host.textContent = '';
    const { W, H } = dims(host, env); const root = $('div', P + '-root'); root.style.height = H + 'px'; host.appendChild(root);
    const gx = Gx.start(root, env, 'vlieg'); let mode = 'klassiek';
    const hud = $('div', P + '-hud'); const chip = {}; ['stage', 'life', 'star', 'score', 'mult'].forEach(k => { chip[k] = $('span', P + '-chip'); hud.appendChild(chip[k]); });
    const race = $('div', P + '-race'); const me = $h('b', '', Gx.ic('plane', 30, '✈️')), riv = $h('b', '', Gx.ic('helicopter', 30, '🛩')); race.append(riv, me);
    const cvw = $('div', P + '-cvw'); const cv = $('canvas'); cvw.appendChild(cv);
    const ctl = $('div', P + '-ctl'); const bu = $('button', '', '▲'), bd = $('button', '', '▼'); bu.setAttribute('aria-label', 'Omhoog'); bd.setAttribute('aria-label', 'Omlaag'); ctl.append(bu, bd);
    root.append(hud, race, cvw, ctl);
    const cw = W - 12, ch = Math.max(200, H - 48 - 26 - 84); const ctx = fit(cv, cw, ch);
    const ov = mkOv(root, P); const asker = makeAsker(env, ov, P, L); const nextQ = qsupply(env); const S = mkStats();
    let g = new Flight({ rand: env.rand || Math.random, fx: env.fx, level: env.level });
    let started = false, ended = false, parts = [], shake = 0, time = 0, bg = [], gateFlash = 0;
    for (let i = 0; i < 18; i++) bg.push({ x: Math.random() * cw, y: Math.random() * ch * .8, s: .4 + Math.random() * 1.2 });
    const laneY = (l) => ch * (0.22 + 0.28 * l); const px = cw * 0.22;
    bu.onclick = () => g.move(-1); bd.onclick = () => g.move(1);
    L.on(document, 'keydown', e => { const k = e.key; if (k === 'ArrowUp' || k === 'w') g.move(-1); else if (k === 'ArrowDown' || k === 's') g.move(1); });
    let sy = 0; L.on(cv, 'touchstart', e => { sy = e.touches[0].clientY; }, { passive: true });
    L.on(cv, 'touchend', e => { const dy = e.changedTouches[0].clientY - sy; if (Math.abs(dy) > 18) g.move(Math.sign(dy)); }, { passive: true });
    L.on(cv, 'pointerdown', e => { if (e.pointerType === 'touch') return; const r = cv.getBoundingClientRect(); g.move((e.clientY - r.top) < laneY(g.lane) ? -1 : 1); });
    const upd = () => {
      chip.stage.innerHTML = Gx.ic('cloud', 24, '☁️') + ' ' + (g.stage + 1) + '/' + g.stages.length; chip.life.innerHTML = Gx.ic('heart', 24, '❤️') + ' ' + g.lives + (g.shield ? ' ' + Gx.ic('shield', 22, '🛡') + g.shield : ''); chip.star.innerHTML = Gx.ic('star', 24, '⭐') + ' ' + g.stars;
      chip.score.innerHTML = Gx.ic('trophy', 24, '🏆') + ' ' + fmtN(g.score); chip.mult.innerHTML = Gx.ic('flame', 24, '🔥') + ' ×' + g.mult.toFixed(1);
      me.style.left = 'calc(' + (g.progress() * 100) + '% - 15px)'; riv.style.left = 'calc(' + (g.rivalProgress() * 100) + '% - 15px)';
    };
    const finish = (win, why) => {
      if (ended) return; ended = true; const rank = g.progress() >= g.rivalProgress() ? 1 : 2; const bonus = win && rank === 1 ? 300 : 0;
      env.end({ score: Math.round(g.score + bonus), win: !!win, stats: { correct: S.correct, wrong: S.wrong, best: S.best, sterren: g.starsTotal, botsingen: g.hits, positie: win ? rank : null }, summary: why + (win ? (rank === 1 ? ' Je won van Piet de Piloot! +300' : ' Piet de Piloot was net sneller.') : '') });
    };
    const burst = (x, y, col, n) => { try { const r = cv.getBoundingClientRect(), b = root.getBoundingClientRect(); gx.burst(r.left - b.left + x, r.top - b.top + y, n > 10 ? 'stars' : 'sparkle', n, { color: col }); } catch (e) {} for (let i = 0; i < (gx.q() > 1 ? 0 : Math.min(n, 4)); i++) { const a = Math.random() * 6.28, v = 40 + Math.random() * 120; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .6, col }); } };
    const shopUI = () => {
      snd(env, 'level'); const wrap = $('div'); const st = $h('p'); const row = $('div', P + '-row'); let offers = g.offers();
      const draw = () => { st.innerHTML = Gx.ic('star', 26, '⭐') + ' ' + g.stars + ' sterren'; row.textContent = ''; offers.forEach(it => { const c = $('div', P + '-shopi'); const pr = g.priceOf(it); c.append($h('div', P + '-big', Gx.ic(it.ic, 60, it.emoji)), $('b', '', it.name), $('small', '', it.desc)); const b = $h('button', P + '-btn', Gx.ic('star', 22, '⭐') + ' ' + pr); b.disabled = g.stars < pr || (it.id !== 'heart' && it.id !== 'shield' && g.up[it.id] >= it.max); b.onclick = () => { if (g.buy(it.id)) { snd(env, 'munt'); draw(); upd(); } }; c.appendChild(b); row.appendChild(c); }); };
      draw(); wrap.append(st, row); const last = g.stage + 1 >= g.stages.length;
      gx.burst((root.clientWidth || 360) / 2, 160, 'confetti', 40);
      ov.show(card(P, { ic: 'trophy', emoji: '🛬', title: 'Hangar - ' + g.stages[g.stage].name + ' gehaald!', text: last ? 'Laatste lucht gehaald!' : 'Koop upgrades voor je vliegtuig.', extra: wrap, btn: last ? 'Landen 🏆' : 'Volgende lucht ▶', onBtn: () => { ov.hide(); g.nextStage(); if (g.state === 'won') { finish(true, 'Alle ' + g.stages.length + ' luchten gehaald!'); return; } upd(); } }));
    };
    const handle = async (evs) => {
      for (const e of evs) {
        const t = typeof e === 'string' ? e : e.e;
        if (t === 'coin') { snd(env, 'tik'); burst(px + (e.it.x - g.d), laneY(e.it.lane), '#facc15', 5); }
        else if (t === 'bump' || t === 'hurt') { snd(env, 'fout'); shake = .4; }
        else if (t === 'shield') { snd(env, 'power'); shake = .2; }
        else if (t === 'stage') shopUI();
        else if (t === 'over') { snd(env, 'lose'); L.after(() => finish(false, 'Neergestort in ' + g.stages[g.stage].name.toLowerCase() + '.'), 700); }
        else if (t === 'gate') {
          snd(env, 'power'); const r = await asker.ask(nextQ(g.stage > 2 ? 3 : g.stage > 0 ? 2 : 1), { time: 0 }); if (L.dead) return;
          S.mark(r.ok); const res = g.answer(!!r.ok); snd(env, r.ok ? 'goed' : 'fout'); gateFlash = 1; if (r.ok) burst(px + 40, laneY(1), '#fde047', 24); else shake = .5;
          upd(); await handle(res);
        }
      }
      upd();
    };
    const OBI = { bird: ['owl', '🐦'], balloon: ['balloon', '🎈'], kite: ['bolt', '🪁'], rock: ['rock', '☄️'], ufo: ['ufo', '🛸'], plane: ['plane', '✈️'], flame: ['flame', '🔥'], dragon: ['dragon', '🐉'], comet: ['comet', '☄️'], butterfly: ['butterfly', '🦋'] };
    const drawObj = (c, o, x, y) => {
      c.save(); c.translate(x, y);
      if (o.ob === 'cloud' || o.ob === 'bolt') { c.fillStyle = o.ob === 'bolt' ? '#334155' : '#f1f5f9'; [[-18, 5, 16], [0, -5, 20], [19, 5, 16]].forEach(([a, b, r]) => { c.beginPath(); c.arc(a, b, r, 0, 6.3); c.fill(); }); if (o.ob === 'bolt') { c.fillStyle = '#facc15'; c.beginPath(); c.moveTo(-2, 8); c.lineTo(10, 8); c.lineTo(0, 30); c.lineTo(4, 16); c.lineTo(-6, 16); c.closePath(); c.fill(); } }
      else { const m = OBI[o.ob]; Gx.draw(c, m ? m[0] : o.ob, 0, 0, 58, m ? m[1] : undefined, { shadow: true }); }
      c.restore();
    };
    const draw = (dt) => {
      const c = ctx, S0 = g.S, t = time; c.save(); if (shake > 0) { shake -= dt; c.translate((Math.random() - .5) * 8, (Math.random() - .5) * 8); }
      const night = S0.night !== undefined ? S0.night : (g.stage === 2 || g.stage === 4) && g.mode === 'klassiek';
      if (S0.paint) Gx.paint(c, cw, ch, gx.world, gx.reduce() ? 0 : t); else { const gr = c.createLinearGradient(0, 0, 0, ch); gr.addColorStop(0, S0.sky[0]); gr.addColorStop(1, S0.sky[1]); c.fillStyle = gr; c.fillRect(-10, -10, cw + 20, ch + 20); }
      const spd = g.state === 'play' ? g.speed() : 0;
      if (S0.rainbow) { ['#ef4444', '#f59e0b', '#fde047', '#22c55e', '#38bdf8', '#a855f7'].forEach((col, k) => { c.strokeStyle = col; c.globalAlpha = .55; c.lineWidth = 9; c.beginPath(); c.arc(cw * .6 - ((g.d * .05) % (cw * 1.8)) + cw * .6, ch * 1.05, ch * .85 - k * 9, Math.PI, 0); c.stroke(); }); c.globalAlpha = 1; }
      if (!S0.paint) bg.forEach(b => { b.x -= spd * dt * b.s * .35; if (b.x < -60) { b.x = cw + 40; b.y = Math.random() * ch * .85; } if (night) { c.fillStyle = 'rgba(255,255,255,' + (.4 + .3 * Math.sin(t * 3 + b.y)) + ')'; c.beginPath(); c.arc(b.x, b.y, 1 + b.s, 0, 6.3); c.fill(); } else { c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(b.x, b.y, 26 * b.s, 9 * b.s, 0, 0, 6.3); c.fill(); } });
      if (!S0.paint) { c.fillStyle = night ? 'rgba(15,23,42,.5)' : 'rgba(34,120,70,.35)'; c.beginPath(); c.moveTo(0, ch); for (let x = 0; x <= cw; x += 20) c.lineTo(x, ch - 26 - 18 * Math.sin((x + g.d * .4) / 70) - 10 * Math.sin((x + g.d * .4) / 25)); c.lineTo(cw, ch); c.fill(); }
      for (let l = 0; l < 3; l++) { c.strokeStyle = 'rgba(255,255,255,.14)'; c.setLineDash([10, 14]); c.lineWidth = 2; c.beginPath(); c.moveTo(0, laneY(l)); c.lineTo(cw, laneY(l)); c.stroke(); c.setLineDash([]); }
      for (const it of g.items) {
        const x = px + (it.x - g.d); if (x < -60 || x > cw + 60) continue; const y = laneY(it.lane);
        if (it.kind === 'coin') { if (it.got) continue; Gx.draw(c, 'star', x, y, 28 + Math.sin(t * 8 + it.x) * 2, '⭐', { shadow: gx.q() > 0 }); }
        else if (it.kind === 'ob') { if (!it.hit) drawObj(c, it, x, y); }
        else { const gy = ch * .5, gh = ch * .8, open = it.state === 'open', brk = it.state === 'broken';
          c.fillStyle = brk ? '#78716c' : open ? '#22c55e' : '#f97316'; c.fillRect(x - 6, gy - gh / 2, 12, gh * (brk ? .35 : 1)); c.fillRect(x - 6, gy + gh / 2 - (brk ? gh * .35 : 0), 12, brk ? gh * .35 : 0);
          if (!open && !brk) { c.fillStyle = 'rgba(249,115,22,.28)'; c.fillRect(x - 40, gy - gh / 2, 80, gh); Gx.draw(c, 'lock', x, gy, 64, '❓', { shadow: true }); }
          if (open) { c.strokeStyle = 'rgba(253,224,71,' + clamp(gateFlash, 0, 1) + ')'; c.lineWidth = 6; c.beginPath(); c.arc(x, gy, gh / 2 * (1.2 - gateFlash * .2), 0, 6.3); c.stroke(); } }
      }
      gateFlash = Math.max(0, gateFlash - dt * .8);
      const py = laneY(g.laneF); const blink = g.inv > 0 && Math.floor(t * 12) % 2 === 0 && g.boost <= 0;
      c.save(); c.translate(px, py); c.rotate((g.lane - g.laneF) * -.35); c.globalAlpha = blink ? .35 : 1;
      if (g.boost > 0) { c.fillStyle = 'rgba(253,224,71,.7)'; c.beginPath(); c.moveTo(-26, 0); c.lineTo(-62 - Math.random() * 14, -6); c.lineTo(-62 - Math.random() * 14, 6); c.fill(); if (gx.q() > 0 && !gx.reduce() && Math.random() < .5) burst(px - 40, py, '#fde047', 1); }
      Gx.draw(c, 'plane', 0, 0, 84, '✈️', { shadow: false });
      if (g.shield) { c.strokeStyle = 'rgba(59,130,246,.85)'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, 52, 32, 0, 0, 6.3); c.stroke(); }
      c.restore();
      for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) { parts.splice(i, 1); continue; } c.globalAlpha = clamp(q.life * 1.7, 0, 1); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, 3, 0, 6.3); c.fill(); c.globalAlpha = 1; }
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 0, cw * clamp(g.d / g.end, 0, 1), 4);
      c.restore();
    };
    loop(L, host, (dt) => {
      time += dt; if (started && g.state !== 'over' && g.state !== 'won') g.wall = (g.wall || 0) + dt;
      if (started && g.state === 'play' && !ov.shown) { const ev = g.update(dt); if (ev.length) handle(ev); else if (Math.floor(time * 4) !== Math.floor((time - dt) * 4)) upd(); }
      draw(dt);
    });
    upd();
    const mp = modePicker(P, FLIGHT_MODES, mode, null);
    ov.show(card(P, { ic: 'plane', emoji: '✈️', title: 'Poortvlucht', text: 'Wissel van baan met ▲ ▼ (of zwiep). Pak de sterren, ontwijk obstakels. Bij elke poort beantwoord je een vraag om erdoorheen te vliegen. Kies je route.', extra: mp.el, btn: 'Tik om te beginnen', onBtn: () => {
      mode = mp.get(); if (mode !== 'klassiek') { g = new Flight({ rand: env.rand || Math.random, fx: env.fx, level: env.level, mode, stages: mode === 'wereld' ? worldStages(gx.world) : null }); }
      ov.hide(); started = true; snd(env, 'klik'); upd(); } }));
    return { destroy() { asker.cancel(); L.kill(); gx.destroy(); try { style.remove(); } catch (e) {} host.textContent = ''; } };
  }
};
