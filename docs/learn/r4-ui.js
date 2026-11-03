// Ronde 4 – gedeelde basis voor de nieuwe Learn-minigames (games/r4-*.js).
// Geeft elk spel: wereld-achtergrond + 3D-iconen (Gx), opruimbare timers/rAF, een intro, vraagronde-hulp, vlieg-tekst en een veilig einde.
// Alles wat het spel start gaat via B.later / B.tick / B.loop zodat destroy() niets laat hangen.
import { Gx } from './games/_gfx.js?v=1';

export const BASE_CSS = `
.r4g{position:absolute;inset:0;overflow:hidden;color:var(--ink);font-family:inherit}
.r4g *{box-sizing:border-box}
.r4g-ui{position:absolute;inset:0;display:flex;flex-direction:column;z-index:2}
.r4g-top{display:flex;align-items:center;gap:8px;padding:8px 58px 6px 10px;font-weight:900;flex-wrap:wrap}
.r4g-top .sp{flex:1}
.r4g-chip{display:inline-flex;align-items:center;gap:5px;background:var(--card);color:var(--ink);border-radius:99px;padding:5px 11px;font-weight:900;box-shadow:0 2px 6px rgba(0,0,0,.18);min-height:34px}
.r4g-card{background:var(--card);color:var(--ink);border-radius:18px;box-shadow:0 4px 14px rgba(0,0,0,.2);padding:10px}
.r4g.gx-host{position:absolute}
.r4g-q{flex:1;overflow-y:auto;margin:8px 10px 10px;padding:10px;background:var(--card);border-radius:18px;box-shadow:0 4px 14px rgba(0,0,0,.25)}
.r4g-btn{border:0;background:var(--accent);color:#fff;font:inherit;font-weight:900;border-radius:14px;padding:12px 22px;min-height:46px;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.25)}
.r4g-btn.alt{background:var(--card);color:var(--ink);border:2px solid var(--line)}
.r4g-btn:disabled{opacity:.45}
.r4g-intro{margin:auto;text-align:center;padding:20px;max-width:350px;background:var(--card);border-radius:22px;box-shadow:0 6px 22px rgba(0,0,0,.3)}
.r4g-intro h3{margin:6px 0 4px;font-size:22px}
.r4g-intro p{margin:6px 0;font-size:14px;line-height:1.35}
.r4g-fly{position:absolute;left:50%;top:92px;transform:translateX(-50%);font-weight:900;font-size:24px;color:#16a34a;pointer-events:none;z-index:50;text-shadow:0 2px 6px rgba(0,0,0,.45);animation:r4gFly 1s ease-out forwards;white-space:nowrap}
.r4g-fly.bad{color:#ef4444}
.r4g-bar{height:10px;border-radius:99px;background:rgba(127,127,127,.3);overflow:hidden}
.r4g-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--accent),#22d3ee);transition:width .25s}
.r4g-bar.warn i{background:linear-gradient(90deg,#f97316,#ef4444)}
html[data-reduce="1"] .r4g-fly{animation:none;opacity:.9}
@keyframes r4gFly{to{transform:translate(-50%,-50px);opacity:0}}
@keyframes r4gPop{0%{transform:scale(.6)}60%{transform:scale(1.18)}100%{transform:scale(1)}}
@keyframes r4gShake{20%{transform:translateX(-5px)}60%{transform:translateX(5px)}}
`;

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const ic = (name, size = 28, emo) => Gx.ic(name, size, emo);

// css = spel-eigen CSS (klassenprefix r4<naam>-). opts: { id, accent }
export function base(host, env, opts = {}) {
  const doc = document;
  const B = { env, fx: env.fx || {}, rand: env.rand || Math.random, correct: 0, wrong: 0, streak: 0, best: 0, ended: false, gx: null };
  let dead = false;
  const timers = new Set(), ints = new Set(); let rafId = 0, loopFn = null, lastT = 0, handle = null;
  const style = doc.createElement('style'); style.textContent = BASE_CSS + (opts.css || ''); host.appendChild(style);
  const wrap = doc.createElement('div'); wrap.className = 'r4g ' + (opts.cls || ''); host.appendChild(wrap);
  try { B.gx = Gx.start(wrap, env, opts.id || 'r4', { gear: true }); } catch (e) { B.gx = null; }
  const ui = doc.createElement('div'); ui.className = 'r4g-ui'; wrap.appendChild(ui);
  B.wrap = wrap; B.ui = ui; B.world = (B.gx && B.gx.world) || env.world || {};
  B.dead = () => dead;
  B.ic = ic;
  B.later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };
  B.tick = (fn, ms) => { const t = setInterval(() => { if (!dead) fn(); }, ms); ints.add(t); return t; };
  B.untick = (t) => { clearInterval(t); ints.delete(t); };
  B.loop = (fn) => {
    loopFn = fn; lastT = 0;
    if (rafId) return;
    const step = (ts) => {
      rafId = 0; if (dead || !loopFn) return;
      const dt = lastT ? Math.min(0.05, (ts - lastT) / 1000) : 0.016; lastT = ts;
      try { loopFn(dt); } catch (e) { /* een spelfout stopt de loop niet */ }
      if (!dead && loopFn) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
  };
  B.stopLoop = () => { loopFn = null; if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } };
  B.snd = (n) => { try { env.snd && env.snd.play(n); } catch (e) { /* stil */ } };
  B.fly = (txt, bad) => {
    const f = doc.createElement('div'); f.className = 'r4g-fly' + (bad ? ' bad' : ''); f.textContent = txt; wrap.appendChild(f);
    B.later(() => { try { f.remove(); } catch (e) { /* ok */ } }, 1000);
  };
  B.burst = (el, kind) => { try { B.gx && el && B.gx.burstEl(el, kind || 'sparkle', 14); } catch (e) { /* ok */ } };
  // intro-kaart; start() wordt aangeroepen na een tik
  B.intro = (o, start) => {
    ui.innerHTML = `<div class="r4g-intro"><div>${ic(o.icon || 'star', 72, o.emoji)}</div><h3>${o.title}</h3><p>${o.text}</p><button class="r4g-btn" data-go="1">${o.button || 'Tik om te beginnen'}</button></div>`;
    const b = ui.querySelector('[data-go]'); if (b) b.addEventListener('click', () => { if (!dead) start(); });
  };
  // Punten met upgrades: cashMult en reeksbonus
  B.pts = (n) => Math.max(1, Math.round(n * (B.fx.cashMult || 1) * (1 + Math.min(B.streak, 10) * 0.04 + (B.fx.streakBonus || 0) * 0.02)));
  B.lives = (n) => n + (B.fx.extraLives | 0);
  // Stelt een vraag in container `into`. onDone({ok, ms, q}). o: { time, label, autoNext }
  B.ask = (into, onDone, o = {}) => {
    let q = null; try { q = (env.pick(1) || [])[0]; } catch (e) { q = null; }
    if (!q) { B.later(() => onDone({ ok: true, ms: 0, q: null }), 50); return null; }
    const t0 = Date.now();
    try { handle = env.ask(into, q, { time: o.time || 0, feedback: true, compact: !!o.compact, autoNext: o.autoNext == null ? 900 : o.autoNext, label: o.label || '' }); } catch (e) { handle = null; }
    if (!handle || !handle.promise) { B.later(() => onDone({ ok: true, ms: 0, q }), 50); return q; }
    const h = handle;
    h.promise.then((res) => {
      if (dead || h !== handle) return;
      const ok = !!(res && res.ok), ms = (res && res.ms) || (Date.now() - t0);
      try { env.report({ q, ok, ms }); } catch (e) { /* ok */ }
      if (ok) { B.correct++; B.streak++; B.best = Math.max(B.best, B.streak); } else { B.wrong++; B.streak = 0; }
      handle = null;
      onDone({ ok, ms, q });
    }).catch(() => { if (!dead && h === handle) { handle = null; onDone({ ok: false, ms: 0, q }); } });
    return q;
  };
  B.cancelAsk = () => { try { handle && handle.cancel && handle.cancel(); } catch (e) { /* ok */ } handle = null; };
  B.end = (win, score, summary) => {
    if (B.ended) return; B.ended = true; B.stopLoop(); B.cancelAsk();
    try { env.end({ score: Math.max(0, Math.round(score || 0)), win, stats: { correct: B.correct, wrong: B.wrong, bestStreak: B.best }, summary: summary || '' }); } catch (e) { /* ok */ }
  };
  B.destroy = () => {
    dead = true; B.stopLoop(); B.cancelAsk();
    for (const t of timers) clearTimeout(t); timers.clear();
    for (const t of ints) clearInterval(t); ints.clear();
    try { B.gx && B.gx.destroy(); } catch (e) { /* ok */ }
    try { style.remove(); wrap.remove(); } catch (e) { /* ok */ }
  };
  return B;
}

// kleine deterministische rng voor spel-indelingen (los van env.rand zodat borden stabiel zijn per seed)
export function mulberry(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
