// Bom doorgeven – de bom tikt! Beantwoord je vraag snel en goed om de bom door te geven aan een ander. Wie de bom heeft als hij ontploft, is af.
// Pure logica: createBomb (bots met eigen snelheid/nauwkeurigheid). De view gebruikt alleen env.ask met tijdslimiet.

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
  { name: 'Bram', emoji: '🐻', speed: 1.7, acc: 0.68, tag: '🐢' },
  { name: 'Lotte', emoji: '🦊', speed: 0.6, acc: 0.78, tag: '🐇' },
  { name: 'Sem', emoji: '🐸', speed: 1.0, acc: 0.74, tag: '🙂' },
  { name: 'Fenne', emoji: '🐱', speed: 1.15, acc: 0.82, tag: '🎯' },
];

export function createBomb({ level = 2, rand = Math.random, fx = {}, name = 'Jij' } = {}) {
  const accF = level === 1 ? -0.1 : level === 3 ? 0.1 : 0;
  const spdF = level === 1 ? 1.3 : level === 3 ? 0.8 : 1, fuseF = level === 1 ? 1.25 : level === 3 ? 0.9 : 1;
  const players = [{ id: 0, name, emoji: '🙂', you: true }].concat(BOMB_BOTS.map((b, i) => ({ id: i + 1, name: b.name, emoji: b.emoji, speed: b.speed * spdF, acc: Math.min(0.95, b.acc + accF), tag: b.tag })));
  const S = {
    round: 0, players, holder: 0, prev: -1, fuse: 0, phase: 'turn', pause: 0, t: 0, think: 0, hold: 0, deaths: [], place: 0, score: 0, wins: 0, passes: 0, correct: 0, wrong: 0, streak: 0, best: 0, tally: [], explosions: 0, firstPass: null,
    qTime: Math.max(5, 9 + (level === 1 ? 3 : level === 3 ? -2 : 0) + Math.round(fx.timeBonus || 0)),
  };
  const m = { S };
  const alive = () => S.players.filter(p => p.alive);
  m.alive = alive;
  m.youOut = () => !S.players[0].alive;
  function newFuse() { S.fuse = Math.max(6, (9 + rand() * 7) * fuseF * Math.pow(0.92, S.explosions)); }
  function thinkFor(p) { return (1.6 + rand() * 2.6) * p.speed; }
  function giveTo(id) { if (id === 0) S.sinceYou = 0; S.prev = S.holder; S.holder = id; S.hold = 0; const p = S.players[id]; S.think = p.you ? 0 : thinkFor(p); }
  m.startRound = () => {
    for (const p of S.players) { p.alive = true; p.lives = 1 + (p.you ? (fx.extraLives || 0) : 0); p.shield = p.you ? (fx.shield || 0) : 0; }
    S.deaths = []; S.explosions = 0; S.sinceYou = 0; S.phase = 'turn'; S.pause = 0; S.prev = -1; newFuse(); S.holder = S.round === 0 ? 0 : Math.floor(rand() * S.players.length); giveTo(S.holder);
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
    S.place = place; S.score += pts; if (place === 1) S.wins++;
    S.tally.push({ round: S.round, place, pts }); S.phase = 'round-end';
    ev.push({ type: 'round-end', place, pts, order, last: S.round >= BOMB_ROUNDS - 1 });
  }
  m.nextRound = () => { if (S.round >= BOMB_ROUNDS - 1) { S.phase = 'over'; return false; } S.round++; m.startRound(); return true; };
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
    S.passes++; S.score += 5; if (S.firstPass == null) S.firstPass = S.t; stepPass(0, id, ev); return ev;
  };
  m.tick = dt => {
    const ev = [];
    if (S.phase !== 'turn') return ev;
    if (S.pause > 0) { S.pause -= dt; return ev; }
    S.t += dt; S.fuse -= dt; S.hold += dt; S.sinceYou += dt;
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
  m.done = () => S.phase === 'over' || (S.phase === 'round-end' && S.round >= BOMB_ROUNDS - 1);
  m.win = () => S.wins >= 1 || S.tally.every(r => r.place <= 2);
  return m;
}

/* ---------- stijl ---------- */
const CSS = `
.bo-root{position:relative;display:flex;flex-direction:column;width:100%;box-sizing:border-box;background:var(--card);color:var(--ink);border-radius:14px;overflow:hidden;font-family:inherit;user-select:none;-webkit-user-select:none}
.bo-hud{display:flex;justify-content:space-between;gap:6px;padding:7px 12px;font-weight:800;font-size:14px;border-bottom:1px solid var(--line)}
.bo-arena{position:relative;height:250px;background:radial-gradient(ellipse at 50% 55%,#312e81,#1e1b4b 70%);color:#fff;overflow:hidden}
.bo-arena.shake{animation:boshake .5s}
@keyframes boshake{20%{transform:translate(-6px,3px)}40%{transform:translate(6px,-3px)}60%{transform:translate(-4px,2px)}80%{transform:translate(3px,-2px)}}
.bo-p{position:absolute;width:74px;margin-left:-37px;margin-top:-34px;text-align:center;font-size:12px;font-weight:800;transition:filter .3s,transform .2s}
.bo-p .f{font-size:34px;line-height:1.1;display:block}.bo-p .h{font-size:11px;min-height:15px}
.bo-p.you .f{font-size:40px}
.bo-p.dead{filter:grayscale(1);opacity:.5}
.bo-p.pick{cursor:pointer;animation:bopick .6s infinite alternate}
.bo-p.pick .f{text-shadow:0 0 14px #facc15}
@keyframes bopick{to{transform:scale(1.12)}}
.bo-bomb{position:absolute;font-size:40px;margin-left:-20px;margin-top:-52px;transition:left .35s ease-in-out,top .35s ease-in-out;pointer-events:none;z-index:3}
.bo-bomb.hot{animation:bohot .25s infinite alternate}
@keyframes bohot{to{transform:scale(1.18) rotate(8deg)}}
.bo-boom{position:absolute;font-size:80px;margin-left:-40px;margin-top:-60px;z-index:4;animation:bobm 1s ease-out forwards;pointer-events:none}
@keyframes bobm{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
.bo-fuse{position:absolute;left:12px;right:12px;bottom:6px;height:7px;border-radius:4px;background:rgba(255,255,255,.2);overflow:hidden}.bo-fuse>i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#ef4444,#facc15)}
.bo-msg{position:absolute;left:0;right:0;top:4px;text-align:center;font-weight:900;font-size:14px;text-shadow:0 1px 2px #000}
.bo-panel{flex:1 1 auto;min-height:210px;padding:6px 8px 10px;border-top:1px solid var(--line)}
.bo-info{padding:26px 12px;text-align:center;font-weight:700;opacity:.8;line-height:1.4}
.bo-ov{position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:20px;text-align:center;background:rgba(15,10,40,.88);color:#fff}
.bo-ov h2{margin:0;font-size:26px}.bo-ov p{margin:0;max-width:310px;font-size:15px;line-height:1.4}
.bo-btn{background:var(--accent,#6366f1);color:#fff;border:0;border-radius:12px;padding:12px 26px;font-size:17px;font-weight:800;cursor:pointer}
`;
const POS = [[50, 80], [13, 50], [30, 17], [70, 17], [87, 50]];

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
    const root = el('div', 'bo-root'); root.style.minHeight = Math.max(540, env.h || 620) + 'px'; host.appendChild(root);
    const m = createBomb({ level: env.level, rand: env.rand || Math.random, fx: env.fx || {}, name: (env.name || 'Jij').slice(0, 8) });
    const S = m.S; const nextQ = mkQSource(env);
    const hud = el('div', 'bo-hud'); const roundEl = el('span'), shEl = el('span'), scEl = el('span'); hud.append(roundEl, shEl, scEl); root.appendChild(hud);
    const arena = el('div', 'bo-arena'); root.appendChild(arena);
    const msg = el('div', 'bo-msg'); const bomb = el('div', 'bo-bomb', '💣'); const fuseW = el('div', 'bo-fuse'), fuseB = el('i'); fuseW.appendChild(fuseB);
    const pEls = S.players.map((p, i) => {
      const d = el('div', 'bo-p' + (p.you ? ' you' : '')); d.style.left = POS[i][0] + '%'; d.style.top = POS[i][1] + '%';
      const f = el('span', 'f', p.emoji), n = el('span', null, p.name + (p.tag ? ' ' + p.tag : '')), h = el('span', 'h');
      d.append(f, n, h); d.addEventListener('click', () => onPick(i)); arena.appendChild(d); return { d, f, h };
    });
    arena.append(bomb, fuseW, msg);
    const panel = el('div', 'bo-panel'); root.appendChild(panel);

    function say(t) { msg.textContent = t; }
    function render() {
      roundEl.textContent = '💣 Ronde ' + (S.round + 1) + '/' + BOMB_ROUNDS; const y = S.players[0];
      shEl.textContent = '🛡️ ' + y.shield + '  ❤️ ' + Math.max(0, y.lives); scEl.textContent = '⭐ ' + fmt(S.score);
      S.players.forEach((p, i) => {
        const e = pEls[i]; e.d.classList.toggle('dead', !p.alive); e.d.classList.toggle('pick', choosing && p.alive && !p.you);
        e.f.textContent = p.alive ? p.emoji : '😵'; e.h.textContent = p.alive ? '❤️'.repeat(Math.max(0, p.lives)) + '🛡️'.repeat(p.shield) : 'af';
      });
      const hp = POS[S.holder]; bomb.style.left = hp[0] + '%'; bomb.style.top = hp[1] + '%';
      bomb.className = 'bo-bomb' + (S.fuse < 4 ? ' hot' : '');
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
          const bm = el('div', 'bo-boom', e.shielded ? '🛡️' : '💥'); bm.style.left = pos[0] + '%'; bm.style.top = pos[1] + '%'; arena.appendChild(bm); later(() => bm.remove(), 1100);
          arena.classList.add('shake'); later(() => arena.classList.remove('shake'), 550);
          say(e.shielded ? '🛡️ ' + p.name + ' overleeft dankzij een schild!' : e.out ? '💥 ' + p.name + ' is af!' : '💥 ' + p.name + ' verliest een leven!'); snd(e.id === 0 && !e.shielded ? 'lose' : 'power');
          if (e.id === 0 && e.out) panel.innerHTML = '<div class="bo-info">💥 Jij bent af in deze ronde. De bots spelen verder…</div>';
        }
        if (e.type === 'shield-up') { say('🛡️ Reeks van 3! Je krijgt een schild.'); snd('power'); }
        if (e.type === 'round-end') roundEnd(e);
      }
    }
    function roundEnd(e) {
      cancelAsk(); choosing = false; clearInterval(iv);
      later(() => {
        const names = e.order.map((id, k) => (k + 1) + '. ' + (id >= 0 ? S.players[id].emoji + ' ' + S.players[id].name : '?')).join('<br>');
        const ov = el('div', 'bo-ov', '<h2>' + (e.place === 1 ? '🏆 Jij wint de ronde!' : 'Ronde ' + (S.round + 1) + ' voorbij') + '</h2><p>Jij werd nummer ' + e.place + ' · +' + e.pts + ' punten<br><br>' + names + '</p>');
        const b = el('button', 'bo-btn', e.last ? 'Klaar' : 'Volgende ronde ▶'); b.type = 'button';
        b.addEventListener('click', () => { ov.remove(); if (e.last) { finish(); return; } m.nextRound(); panel.innerHTML = ''; say(''); render(); snd('klik'); iv = setInterval(frame, 100); if (S.holder === 0) later(youTurn, 500); });
        ov.appendChild(b); root.appendChild(ov); snd(e.place === 1 ? 'win' : 'level');
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
      try { env.end({ score: S.score, win: m.win(), stats: { correct: S.correct, wrong: S.wrong, 'best streak': S.best, doorgegeven: S.passes, 'rondes gewonnen': S.wins }, summary: S.wins + ' rondes gewonnen, ' + S.passes + 'x doorgegeven' }); } catch (e) { /* hub */ }
    }
    render();
    const intro = el('div', 'bo-ov', '<h2>💣 Bom doorgeven</h2><p>Heb jij de bom? Beantwoord de vraag binnen de tijd en tik op wie hem krijgt. Fout of te traag = de lont wordt korter! Let op: een 🐢 houdt de bom lang vast, een 🐇 geeft hem snel door. Kies slim!</p>');
    const go = el('button', 'bo-btn', 'Tik om te beginnen'); go.type = 'button';
    go.addEventListener('click', () => { intro.remove(); snd('klik'); started = true; iv = setInterval(frame, 100); if (S.holder === 0) later(youTurn, 400); });
    intro.appendChild(go); root.appendChild(intro);
    return {
      destroy() {
        dead = true; clearInterval(iv); timers.forEach(clearTimeout); timers.clear(); cancelAsk();
        style.remove(); try { host.innerHTML = ''; } catch (e) { /* ok */ }
      },
    };
  },
};
