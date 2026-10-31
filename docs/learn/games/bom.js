// Bom doorgeven – de bom tikt! Beantwoord je vraag snel en goed om de bom door te geven aan een ander. Wie de bom heeft als hij ontploft, is af.
// Pure logica: createBomb (bots met eigen snelheid/nauwkeurigheid). De view gebruikt alleen env.ask met tijdslimiet.

import { Gx } from './_gfx.js?v=1';

/* ---------- helpers ---------- */
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const fmt = n => Math.round(n).toLocaleString('nl-NL');
function fallbackQ(rand) { const a = 2 + Math.floor(rand() * 8), b = 2 + Math.floor(rand() * 8); const r = a * b; return { t: 'mc', q: a + ' × ' + b + ' = ?', a: String(r), o: [String(r), String(r + a), String(r - b), String(r + 2)].sort(() => rand() - 0.5), d: 1 }; }
function mkQSource(env) {
  let buf = [];
  return () => {
    if (!buf.length) { try { buf = (env.pick(10, {}) || []).slice(); } catch (e) { buf = []; } }
    return buf.shift() || fallbackQ(env.rand || Math.random);
  };
}

/* ---------- pure logica ---------- */
export const BOMB_ROUNDS = 3;
export const BOMB_POINTS = [100, 60, 35, 15, 5];
export const BOMB_BOTS = [
  { name: 'Bram', emoji: '🐻', ic: 'bear', speed: 1.7, acc: 0.68, tag: '🐢' },
  { name: 'Lotte', emoji: '🦊', ic: 'fox', speed: 0.6, acc: 0.78, tag: '🐇' },
  { name: 'Sem', emoji: '🐸', ic: 'frog', speed: 1.0, acc: 0.74, tag: '🙂' },
  { name: 'Fenne', emoji: '🐱', ic: 'cat', speed: 1.15, acc: 0.82, tag: '🎯' },
];
// Extra tegenstanders: elke 'tafel' (botSet 0..4) schuift er een paar op.
export const BOMB_BOTS_EXTRA = [
  { name: 'Noor', emoji: '🐼', ic: 'panda', speed: 0.9, acc: 0.8, tag: '🧠' },
  { name: 'Tijn', emoji: '🐧', ic: 'penguin', speed: 1.4, acc: 0.72, tag: '🧊' },
  { name: 'Mees', emoji: '🦁', ic: 'lion', speed: 0.75, acc: 0.7, tag: '🦁' },
  { name: 'Olaf', emoji: '🦉', ic: 'owl', speed: 1.25, acc: 0.88, tag: '🦉' },
];
export const BOMB_ALL = BOMB_BOTS.concat(BOMB_BOTS_EXTRA);
export function botTable(set = 0) { const o = ((set | 0) % BOMB_ALL.length + BOMB_ALL.length) % BOMB_ALL.length; return [0, 1, 2, 3].map(k => BOMB_ALL[(o + k) % BOMB_ALL.length]); }
// Soorten bommen (wisselen per ronde; ronde 1 is altijd de gewone bom)
export const BOMB_TYPES = {
  bom: { name: 'Gewone bom', ic: 'bomb', emoji: '💣', rate: 1, slow: 1, tip: '' },
  ijs: { name: 'Ijsbom', ic: 'snowflake', emoji: '🧊', rate: 0.7, slow: 1, tip: 'De lont brandt langzamer.' },
  turbo: { name: 'Turbobom', ic: 'bolt', emoji: '⚡', rate: 1.4, slow: 1, tip: 'De lont brandt sneller!' },
  slijm: { name: 'Slijmbom', ic: 'slime', emoji: '🟢', rate: 1, slow: 1.5, tip: 'Bots blijven er langer aan plakken.' },
};
export const BOMB_TYPE_ORDER = ['bom', 'ijs', 'turbo', 'slijm', 'bom', 'turbo'];
// Spelmodi
export const BOMB_MODES = {
  klassiek: { name: 'Klassiek', desc: '3 rondes tegen 4 bots.', rounds: 3, fuse: 1, qt: 0, mult: 1, types: false },
  wissel: { name: 'Bommen-mix', desc: '4 rondes met ijs-, turbo- en slijmbommen.', rounds: 4, fuse: 1, qt: 0, mult: 1.25, types: true },
  blitz: { name: 'Blitz', desc: '5 rondes, korte lont en korte vraagtijd. Dubbele punten!', rounds: 5, fuse: 0.72, qt: -2, mult: 2, types: true },
};

export function createBomb({ level = 2, rand = Math.random, fx = {}, name = 'Jij', mode = 'klassiek', botSet = 0 } = {}) {
  const MD = BOMB_MODES[mode] || BOMB_MODES.klassiek; mode = BOMB_MODES[mode] ? mode : 'klassiek';
  const accF = level === 1 ? -0.1 : level === 3 ? 0.1 : 0;
  const spdF = level === 1 ? 1.3 : level === 3 ? 0.8 : 1, fuseF = (level === 1 ? 1.25 : level === 3 ? 0.9 : 1) * MD.fuse;
  const players = [{ id: 0, name, emoji: '🙂', ic: 'astronaut', you: true }].concat(botTable(botSet).map((b, i) => ({ id: i + 1, name: b.name, emoji: b.emoji, ic: b.ic, speed: b.speed * spdF, acc: Math.min(0.95, b.acc + accF), tag: b.tag })));
  const S = {
    mode, rounds: MD.rounds, type: 'bom', round: 0, players, holder: 0, prev: -1, fuse: 0, phase: 'turn', pause: 0, t: 0, think: 0, hold: 0, deaths: [], place: 0, score: 0, wins: 0, passes: 0, correct: 0, wrong: 0, streak: 0, best: 0, tally: [], explosions: 0, firstPass: null,
    qTime: Math.max(4, 9 + MD.qt + (level === 1 ? 3 : level === 3 ? -2 : 0) + Math.round(fx.timeBonus || 0)),
  };
  const m = { S, mode: MD };
  const alive = () => S.players.filter(p => p.alive);
  m.alive = alive;
  m.youOut = () => !S.players[0].alive;
  function newFuse() { S.fuse = Math.max(6, (9 + rand() * 7) * fuseF * Math.pow(0.92, S.explosions)); }
  function thinkFor(p) { return (1.6 + rand() * 2.6) * p.speed * (BOMB_TYPES[S.type] || BOMB_TYPES.bom).slow; }
  function giveTo(id) { if (id === 0) S.sinceYou = 0; S.prev = S.holder; S.holder = id; S.hold = 0; const p = S.players[id]; S.think = p.you ? 0 : thinkFor(p); }
  m.startRound = () => {
    for (const p of S.players) { p.alive = true; p.lives = 1 + (p.you ? (fx.extraLives || 0) : 0); p.shield = p.you ? (fx.shield || 0) : 0; }
    S.type = MD.types ? BOMB_TYPE_ORDER[S.round % BOMB_TYPE_ORDER.length] : 'bom'; S.deaths = []; S.explosions = 0; S.sinceYou = 0; S.phase = 'turn'; S.pause = 0; S.prev = -1; newFuse(); S.holder = S.round === 0 ? 0 : Math.floor(rand() * S.players.length); giveTo(S.holder);
  };
  m.startRound();
  function pickTarget(from) {
    const c = alive().filter(p => p.id !== from); if (!c.length) return from;
    if (S.sinceYou > 12 && S.players[0].alive && from !== 0) return 0;
    return c[Math.floor(rand() * c.length)].id;
  }
  function explode(ev) {
    const p = S.players[S.holder]; S.explosions++;
    let out = false, shielded = false;
    if (p.shield > 0) { p.shield--; shielded = true; } else { p.lives--; if (p.lives <= 0) { p.alive = false; out = true; S.deaths.push(p.id); } }
    ev.push({ type: 'boom', id: p.id, out, shielded });
    S.pause = 1.5;
    if (alive().length <= 1) { endRound(ev); return; }
    newFuse(); const to = pickTarget(p.id); ev.push({ type: 'pass', from: p.id, to, auto: true }); giveTo(to);
  }
  function endRound(ev) {
    const w = alive()[0]; const order = [w ? w.id : -1].concat(S.deaths.slice().reverse());
    const place = Math.max(1, order.indexOf(0) + 1) || 1; const pts = BOMB_POINTS[Math.min(place - 1, BOMB_POINTS.length - 1)];
    const pts2 = Math.round(pts * MD.mult); S.place = place; S.score += pts2; if (place === 1) S.wins++;
    S.tally.push({ round: S.round, place, pts: pts2 }); S.phase = 'round-end';
    ev.push({ type: 'round-end', place, pts: pts2, order, last: S.round >= S.rounds - 1 });
  }
  m.nextRound = () => { if (S.round >= S.rounds - 1) { S.phase = 'over'; return false; } S.round++; m.startRound(); return true; };
  function stepPass(from, to, ev) { ev.push({ type: 'pass', from, to }); giveTo(to); }
  // speler beantwoordt: ok -> pas daarna passTo(id) aan; fout/timeout -> straf
  m.answer = ok => {
    const ev = [];
    if (S.phase !== 'turn' || S.holder !== 0) return ev;
    if (ok) { S.correct++; S.streak++; S.best = Math.max(S.best, S.streak); ev.push({ type: 'good' }); if (S.streak % 3 === 0) { const y = S.players[0]; if (y.shield < 2) { y.shield++; ev.push({ type: 'shield-up' }); } } }
    else { S.wrong++; S.streak = 0; S.fuse -= 2.5; ev.push({ type: 'bad' }); }
    return ev;
  };
  m.passTo = id => {
    const ev = []; if (S.phase !== 'turn' || S.holder !== 0) return ev;
    const t = S.players[id]; if (!t || !t.alive || id === 0) return ev;
    S.passes++; S.score += Math.round(5 * MD.mult); if (S.firstPass == null) S.firstPass = S.t; stepPass(0, id, ev); return ev;
  };
  m.tick = dt => {
    const ev = [];
    if (S.phase !== 'turn') return ev;
    if (S.pause > 0) { S.pause -= dt; return ev; }
    S.t += dt; S.fuse -= dt * (BOMB_TYPES[S.type] || BOMB_TYPES.bom).rate; S.hold += dt; S.sinceYou += dt;
    if (S.fuse <= 0) { explode(ev); return ev; }
    const h = S.players[S.holder];
    if (!h.you && h.alive) {
      S.think -= dt;
      if (S.think <= 0) {
        if (rand() < h.acc) stepPass(h.id, pickTarget(h.id), ev);
        else { S.fuse -= 1.8; S.think = thinkFor(h); ev.push({ type: 'fumble', id: h.id }); }
      }
    }
    return ev;
  };
  m.done = () => S.phase === 'over' || (S.phase === 'round-end' && S.round >= S.rounds - 1);
  m.win = () => S.wins >= 1 || S.tally.every(r => r.place <= 2);
  return m;
}

/* ---------- stijl ---------- */
const CSS = `
.bo-root{position:relative;display:flex;flex-direction:column;width:100%;box-sizing:border-box;background:transparent;color:var(--ink);border-radius:14px;overflow:hidden;font-family:inherit;user-select:none;-webkit-user-select:none;font-size:calc(16px*var(--gfx-font,1))}
.bo-hud{display:flex;justify-content:flex-start;align-items:center;flex-wrap:wrap;gap:7px;padding:8px 58px 4px 10px;font-weight:800;font-size:calc(15px*var(--gfx-font,1))}
.bo-hud>span{display:inline-flex;align-items:center;gap:5px;background:var(--card);border-radius:99px;padding:5px 11px;min-height:34px;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.bo-arena{position:relative;height:300px;color:#fff;overflow:hidden;margin:4px 8px;border-radius:20px}
.bo-arena:before{content:"";position:absolute;left:8%;right:8%;top:30%;bottom:6%;border-radius:50%;background:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,.38),rgba(0,0,0,0) 72%);pointer-events:none}
.bo-arena.shake{animation:boshake .5s}
html[data-reduce="1"] .bo-arena.shake{animation:none}
@keyframes boshake{20%{transform:translate(-6px,3px)}40%{transform:translate(6px,-3px)}60%{transform:translate(-4px,2px)}80%{transform:translate(3px,-2px)}}
.bo-p{position:absolute;width:92px;margin-left:-46px;margin-top:-44px;text-align:center;font-size:calc(13px*var(--gfx-font,1));font-weight:800;transition:filter .3s,transform .2s;text-shadow:0 1px 3px rgba(0,0,0,.8);padding-bottom:4px}
.bo-p .f{display:block;line-height:1}.bo-p .h{font-size:12px;min-height:16px;display:block}
.bo-p.dead{filter:grayscale(1);opacity:.5}
.bo-p.pick{cursor:pointer;animation:bopick .6s infinite alternate}
.bo-p.pick .f{filter:drop-shadow(0 0 12px #facc15)}
html[data-reduce="1"] .bo-p.pick{animation:none}
@keyframes bopick{to{transform:scale(1.12)}}
.bo-bomb{position:absolute;margin-left:-30px;margin-top:-82px;transition:left .35s ease-in-out,top .35s ease-in-out;pointer-events:none;z-index:3}
.bo-bomb.hot{animation:bohot .25s infinite alternate}
html[data-reduce="1"] .bo-bomb.hot{animation:none}
@keyframes bohot{to{transform:scale(1.18) rotate(8deg)}}
.bo-boom{position:absolute;margin-left:-50px;margin-top:-70px;z-index:4;animation:bobm 1s ease-out forwards;pointer-events:none}
@keyframes bobm{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
.bo-fuse{position:absolute;left:14px;right:14px;bottom:8px;height:10px;border-radius:6px;background:rgba(255,255,255,.25);overflow:hidden}.bo-fuse>i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#ef4444,#facc15)}
.bo-msg{position:absolute;left:0;right:0;top:6px;text-align:center;font-weight:900;font-size:calc(15px*var(--gfx-font,1));text-shadow:0 1px 3px #000;padding:0 8px}
.bo-panel{flex:1 1 auto;min-height:210px;padding:8px 10px 12px;margin:4px 8px 8px;background:var(--card);border-radius:18px;box-shadow:0 3px 12px rgba(0,0,0,.2)}
.bo-info{padding:26px 12px;text-align:center;font-weight:700;opacity:.85;line-height:1.4}
.bo-ov{position:absolute;inset:0;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px;text-align:center;background:rgba(15,10,40,.86);color:#fff}
.bo-ov h2{margin:0;font-size:calc(28px*var(--gfx-font,1))}.bo-ov p{margin:0;max-width:330px;font-size:calc(16px*var(--gfx-font,1));line-height:1.4}
.bo-btn{background:var(--accent,#6366f1);color:#fff;border:0;border-radius:16px;padding:15px 30px;min-height:54px;font-size:calc(18px*var(--gfx-font,1));font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.35)}
.bo-modes{display:flex;flex-direction:column;gap:8px;width:100%;max-width:340px}
.bo-mode{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:2px;min-height:58px;border:3px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff;border-radius:16px;padding:8px 14px;font:inherit;font-weight:800;cursor:pointer}
.bo-mode small{font-weight:600;opacity:.85;font-size:.8em}.bo-mode.on{border-color:#facc15;background:rgba(250,204,21,.22)}
`;
const POS = [[50, 78], [14, 52], [32, 22], [68, 22], [86, 52]];

/* ---------- het spel ---------- */
export default {
  id: 'bom', name: 'Bom doorgeven', emoji: '💣', color: '#f97316',
  desc: 'De bom tikt! Beantwoord je vraag snel en goed en geef de bom door. Wie hem heeft als hij knalt, is af. Drie rondes tegen vier bots.',
  tags: ['snel', 'race', 'bots'], minutes: 4, duo: true,
  create(host, env) {
    let dead = false, ended = false, iv = 0, started = false, askH = null, askTok = 0, choosing = false, spark = 0;
    const timers = new Set();
    const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms); timers.add(id); return id; };
    const snd = n => { try { env.snd && env.snd.play(n); } catch (e) { /* stil */ } };
    const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    host.innerHTML = '';
    const root = el('div', 'bo-root'); root.style.minHeight = Math.max(580, env.h || 640) + 'px'; host.appendChild(root);
    const gx = Gx.start(root, env, 'bom');
    let mode = 'klassiek';
    const mk = md => createBomb({ level: env.level, rand: env.rand || Math.random, fx: env.fx || {}, name: (env.name || 'Jij').slice(0, 8), mode: md, botSet: (env.seed | 0) % 5 });
    let m = mk(mode), S = m.S; const nextQ = mkQSource(env);
    const hud = el('div', 'bo-hud'); const roundEl = el('span'), shEl = el('span'), scEl = el('span'); hud.append(roundEl, shEl, scEl); root.appendChild(hud);
    const arena = el('div', 'bo-arena'); root.appendChild(arena);
    const msg = el('div', 'bo-msg'); const bomb = el('div', 'bo-bomb', Gx.ic('bomb', 64, '💣')); const fuseW = el('div', 'bo-fuse'), fuseB = el('i'); fuseW.appendChild(fuseB);
    let pEls = [];
    function buildPlayers() {
      pEls.forEach(e => e.d.remove());
      pEls = S.players.map((p, i) => {
      const d = el('div', 'bo-p' + (p.you ? ' you' : '')); d.style.left = POS[i][0] + '%'; d.style.top = POS[i][1] + '%';
      const f = el('span', 'f', Gx.ic(p.ic, p.you ? 68 : 62, p.emoji)), n = el('span', null, p.name + (p.tag ? ' ' + p.tag : '')), h = el('span', 'h');
      d.append(f, n, h); d.addEventListener('click', () => onPick(i)); arena.appendChild(d); return { d, f, h, key: p.ic + p.alive };
      });
    }
    buildPlayers();
    arena.append(bomb, fuseW, msg);
    const panel = el('div', 'bo-panel'); root.appendChild(panel);

    let bombType = 'bom';
    function say(t) { msg.textContent = t; }
    function render() {
      const bt = BOMB_TYPES[S.type] || BOMB_TYPES.bom; roundEl.innerHTML = Gx.ic(bt.ic, 24, bt.emoji) + ' Ronde ' + (S.round + 1) + '/' + S.rounds; const y = S.players[0];
      shEl.innerHTML = Gx.ic('shield', 24, '🛡️') + ' ' + y.shield + ' &nbsp;' + Gx.ic('heart', 24, '❤️') + ' ' + Math.max(0, y.lives); scEl.innerHTML = Gx.ic('star', 24, '⭐') + ' ' + fmt(S.score);
      S.players.forEach((p, i) => {
        const e = pEls[i]; e.d.classList.toggle('dead', !p.alive); e.d.classList.toggle('pick', choosing && p.alive && !p.you);
        const key = (p.ic || '') + p.alive; if (e.key !== key) { e.key = key; e.f.innerHTML = p.alive ? Gx.ic(p.ic, p.you ? 68 : 62, p.emoji) : Gx.ic('skull', p.you ? 68 : 62, '😵'); }
        e.h.innerHTML = p.alive ? Gx.ic('heart', 14, '❤️').repeat(Math.max(0, p.lives)) + Gx.ic('shield', 14, '🛡️').repeat(p.shield) : 'af';
      });
      const hp = POS[S.holder]; bomb.style.left = hp[0] + '%'; bomb.style.top = hp[1] + '%';
      bomb.className = 'bo-bomb' + (S.fuse < 4 ? ' hot' : ''); if (bombType !== S.type) { bombType = S.type; bomb.innerHTML = Gx.ic(bt.ic, 64, bt.emoji); }
      fuseB.style.width = Math.max(0, Math.min(100, S.fuse / 14 * 100)) + '%';
    }
    function cancelAsk() { askTok++; if (askH) { try { askH.cancel(); } catch (e) { /* ok */ } askH = null; } }
    function youTurn() {
      if (ended || dead || S.phase !== 'turn' || S.holder !== 0 || !S.players[0].alive || askH) return;
      choosing = false; panel.innerHTML = ''; const box = el('div'); panel.appendChild(box); const q = nextQ(), my = ++askTok; say('💣 Jij hebt de bom! Snel antwoorden!');
      try { askH = env.ask(box, q, { compact: true, feedback: true, autoNext: 400, time: S.qTime }); } catch (e) { askH = null; return; }
      askH.promise.then(r => {
        if (my !== askTok) return; askH = null;
        try { env.report({ q, ok: !!r.ok, ms: r.ms || 0 }); } catch (e) { /* hub */ }
        const ev = m.answer(!!r.ok); apply(ev); render();
        if (r.ok) { snd('goed'); choosing = true; panel.innerHTML = '<div class="bo-info">✅ Goed! Tik op wie de bom krijgt.<br><small>🐢 is traag, 🐇 is snel, 🎯 antwoordt vaak goed.</small></div>'; say('Kies een speler!'); const mine = ++askTok; later(() => { if (choosing && mine === askTok && S.holder === 0 && S.phase === 'turn') { const c = m.alive().filter(p => !p.you); if (c.length) onPick(c[Math.floor(Math.random() * c.length)].id); } }, 4500); render(); }
        else { snd('fout'); later(youTurn, 600); }
      }, () => {});
    }
    function onPick(i) {
      if (!choosing || ended) return; const p = S.players[i]; if (!p || !p.alive || p.you) return;
      choosing = false; askTok++; const ev = m.passTo(i); apply(ev); snd('klik'); render();
    }
    function apply(ev) {
      for (const e of ev) {
        if (e.type === 'pass') {
          snd('tik'); const from = S.players[e.from], to = S.players[e.to];
          say(from.name + ' → ' + to.name + (e.auto ? ' (nieuwe bom!)' : ''));
          if (e.to === 0) later(youTurn, 450);
          if (e.to !== 0 && e.from === 0) { panel.innerHTML = '<div class="bo-info">Bom doorgegeven aan ' + to.name + ' ' + to.emoji + '!</div>'; }
        }
        if (e.type === 'fumble') { say(S.players[e.id].name + ' vergist zich! −1,8s lont'); snd('fout'); }
        if (e.type === 'boom') {
          const p = S.players[e.id], pos = POS[e.id]; cancelAsk(); choosing = false; panel.innerHTML = '';
          const bm = el('div', 'bo-boom', e.shielded ? Gx.ic('shield', 100, '🛡️') : Gx.ic('flame', 100, '💥')); bm.style.left = pos[0] + '%'; bm.style.top = pos[1] + '%'; arena.appendChild(bm); later(() => bm.remove(), 1100);
          gx.burst(arena.offsetLeft + (arena.clientWidth || 340) * pos[0] / 100, arena.offsetTop + (arena.clientHeight || 300) * pos[1] / 100, e.shielded ? 'sparkle' : 'smoke', e.shielded ? 14 : 18); if (!e.shielded) gx.burst(arena.offsetLeft + (arena.clientWidth || 340) * pos[0] / 100, arena.offsetTop + (arena.clientHeight || 300) * pos[1] / 100, 'stars', 12);
          arena.classList.add('shake'); later(() => arena.classList.remove('shake'), 550);
          say(e.shielded ? '🛡️ ' + p.name + ' overleeft dankzij een schild!' : e.out ? '💥 ' + p.name + ' is af!' : '💥 ' + p.name + ' verliest een leven!'); snd(e.id === 0 && !e.shielded ? 'lose' : 'power');
          if (e.id === 0 && e.out) panel.innerHTML = '<div class="bo-info">💥 Jij bent af in deze ronde. De bots spelen verder…</div>';
        }
        if (e.type === 'shield-up') { gx.burst((root.clientWidth || 360) / 2, 330, 'sparkle', 14); say('🛡️ Reeks van 3! Je krijgt een schild.'); snd('power'); }
        if (e.type === 'round-end') roundEnd(e);
      }
    }
    function roundEnd(e) {
      cancelAsk(); choosing = false; clearInterval(iv);
      later(() => {
        const names = e.order.map((id, k) => '<span style="display:inline-flex;align-items:center;gap:6px">' + (k + 1) + '. ' + (id >= 0 ? Gx.ic(S.players[id].ic, 30, S.players[id].emoji) + ' ' + S.players[id].name : '?') + '</span>').join('<br>');
        const ov = el('div', 'bo-ov', '<h2>' + (e.place === 1 ? Gx.ic('trophy', 40, '🏆') + '<br>Jij wint de ronde!' : 'Ronde ' + (S.round + 1) + ' voorbij') + '</h2><p>Jij werd nummer ' + e.place + ' · +' + e.pts + ' punten<br><br>' + names + '</p>');
        const b = el('button', 'bo-btn', e.last ? 'Klaar' : 'Volgende ronde ▶'); b.type = 'button';
        b.addEventListener('click', () => { ov.remove(); if (e.last) { finish(); return; } m.nextRound(); panel.innerHTML = ''; say((BOMB_TYPES[S.type].tip) ? BOMB_TYPES[S.type].name + ': ' + BOMB_TYPES[S.type].tip : ''); render(); snd('klik'); iv = setInterval(frame, 100); if (S.holder === 0) later(youTurn, 500); });
        ov.appendChild(b); root.appendChild(ov); snd(e.place === 1 ? 'win' : 'level'); if (e.place === 1) gx.burst((root.clientWidth || 360) / 2, 200, 'confetti', 50);
      }, 1900);
    }
    function frame() {
      if (!started || ended || !root.isConnected) return;
      const steps = m.youOut() ? 3 : 1; spark++;
      for (let k = 0; k < steps; k++) { const ev = m.tick(0.1); if (ev.length) apply(ev); if (S.phase !== 'turn') break; }
      if (S.fuse < 5 && spark % 5 === 0 && S.phase === 'turn') snd('tik');
      render();
    }
    function finish() {
      if (ended) return; ended = true; clearInterval(iv); cancelAsk();
      try { env.end({ score: S.score, win: m.win(), stats: { correct: S.correct, wrong: S.wrong, 'best streak': S.best, doorgegeven: S.passes, 'rondes gewonnen': S.wins }, summary: S.wins + ' rondes gewonnen, ' + S.passes + 'x doorgegeven (' + m.mode.name + ')' }); } catch (e) { /* hub */ }
    }
    render();
    const intro = el('div', 'bo-ov', '<h2>' + Gx.ic('bomb', 44, '💣') + '<br>Bom doorgeven</h2><p>Heb jij de bom? Beantwoord de vraag binnen de tijd en tik op wie hem krijgt. Fout of te traag = de lont wordt korter! Kies je spel.</p>');
    const modesBox = el('div', 'bo-modes'); const modeBtns = {};
    Object.entries(BOMB_MODES).forEach(([id, md]) => {
      const b = el('button', 'bo-mode' + (id === mode ? ' on' : ''), '<span>' + md.name + '</span><small>' + md.desc + '</small>'); b.type = 'button';
      b.addEventListener('click', () => { mode = id; Object.entries(modeBtns).forEach(([k, x]) => { x.className = 'bo-mode' + (k === id ? ' on' : ''); }); snd('klik'); });
      modeBtns[id] = b; modesBox.appendChild(b);
    });
    intro.appendChild(modesBox);
    const go = el('button', 'bo-btn', 'Tik om te beginnen'); go.type = 'button';
    go.addEventListener('click', () => { intro.remove(); snd('klik'); if (mode !== 'klassiek') { m = mk(mode); S = m.S; buildPlayers(); render(); } started = true; iv = setInterval(frame, 100); if (S.holder === 0) later(youTurn, 400); });
    intro.appendChild(go); root.appendChild(intro);
    return {
      destroy() {
        dead = true; gx.destroy(); clearInterval(iv); timers.forEach(clearTimeout); timers.clear(); cancelAsk();
        style.remove(); try { host.innerHTML = ''; } catch (e) { /* ok */ }
      },
    };
  },
};
