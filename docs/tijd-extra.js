// Tijd: aftellen naar gebeurtenissen, interval-timer en beurtklok.
import * as T from './tijd-core.js?v=1';
import { icon, GFX, playScene, escHtml as esc } from './tools-ui.js?v=1';

const ICON_CHOICES = ['gift', 'balloon', 'cake', 'heart', 'star', 'plane', 'ship', 'tent', 'trophy', 'rocket', 'sun', 'snowflake', 'ferriswheel', 'school', 'book', 'puzzle'].filter((x, i, a) => a.indexOf(x) === i);

/* ---------- Aftellen ---------- */
export function countTab(api) {
  const { body, load, save, track } = api;
  let evs = load('aftellen', null);
  if (!Array.isArray(evs)) { evs = [{ id: api.newId(), preset: 'kerst', name: 'Kerstmis', icon: 'pine' }, { id: api.newId(), preset: 'sint', name: 'Sinterklaas', icon: 'gift' }]; save('aftellen', evs); }
  const fired = new Set(load('aftellen-gezien', []));
  let adding = false;
  const persist = () => save('aftellen', evs);

  function draw() {
    api.tickFns.length = 0;
    const have = new Set(evs.map((e) => e.preset).filter(Boolean));
    body.innerHTML = `${evs.length ? '' : '<p class="center"><small>Nog niets om naar uit te kijken. Voeg hieronder iets toe!</small></p>'}
      <div data-list>${evs.map((e) => `<div class="tu-card" data-ev="${e.id}" style="display:flex;align-items:center;gap:.8rem">${icon(e.icon || 'gift', { size: 64 })}<span style="flex:1;min-width:0"><b style="font-size:1.15rem">${esc(e.name)}</b><div data-big style="font-size:calc(2rem * var(--gfx-font,1));font-weight:800;line-height:1.1"></div><small data-small style="font-variant-numeric:tabular-nums"></small><div class="tu-bar" style="margin-top:.35rem"><i data-bar style="width:0"></i></div></span><button data-rm="${e.id}" aria-label="Verwijder" style="min-width:44px;min-height:44px">✕</button></div>`).join('')}</div>
      <div class="tu-card"><b>Snel toevoegen</b><div class="tu-row" style="margin-top:.4rem">${T.EVENT_PRESETS.filter((p) => !have.has(p.id)).map((p) => `<button class="tu-big" data-pre="${p.id}" style="min-height:48px;font-size:.95rem">${icon(p.icon, { size: 26 })} ${esc(p.name)}</button>`).join('') || '<small>Alles al toegevoegd.</small>'}</div></div>
      <div class="tu-card"><b>${icon('ticket', { size: 26 })} Eigen gebeurtenis</b>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-top:.5rem"><input data-n class="tu-inp" placeholder="Naam (bijv. Vakantie)" maxlength="30" style="grid-column:span 2"><input data-d type="date" class="tu-inp"><input data-t type="time" class="tu-inp" value="00:00"></div>
        <label class="tu-row" style="margin:.5rem 0"><input type="checkbox" data-y> <span>Elk jaar opnieuw (verjaardag)</span></label>
        <div class="tu-row" data-ic>${ICON_CHOICES.map((i, k) => `<button data-i="${i}" class="${k === 0 ? 'pri' : ''}" style="padding:.2rem;min-width:50px;min-height:50px;border-radius:14px">${icon(i, { size: 36 })}</button>`).join('')}</div>
        <button class="tu-big pri" data-add style="margin-top:.7rem">Toevoegen</button><div data-msg class="tu-bad" style="margin-top:.3rem"></div></div>`;
    let chosen = ICON_CHOICES[0];
    body.querySelectorAll('[data-i]').forEach((b) => { b.onclick = () => { chosen = b.dataset.i; body.querySelectorAll('[data-i]').forEach((x) => x.classList.toggle('pri', x === b)); }; });
    body.querySelectorAll('[data-rm]').forEach((b) => { b.onclick = () => { evs = evs.filter((e) => e.id !== b.dataset.rm); persist(); draw(); }; });
    body.querySelectorAll('[data-pre]').forEach((b) => { b.onclick = () => { const p = T.EVENT_PRESETS.find((x) => x.id === b.dataset.pre); evs.push({ id: api.newId(), preset: p.id, name: p.name, icon: p.icon }); persist(); draw(); }; });
    body.querySelector('[data-add]').onclick = () => {
      const name = body.querySelector('[data-n]').value.trim(), date = body.querySelector('[data-d]').value, time = body.querySelector('[data-t]').value, yearly = body.querySelector('[data-y]').checked;
      const msg = body.querySelector('[data-msg]'); if (!name) { msg.textContent = 'Geef de gebeurtenis een naam.'; return; } if (!date) { msg.textContent = 'Kies een datum.'; return; }
      const ev = { id: api.newId(), name, date, time, yearly, icon: chosen };
      if (!yearly && T.eventTarget(ev) <= Date.now()) { msg.textContent = 'Die datum is al geweest. Kies een datum in de toekomst, of zet "elk jaar opnieuw" aan.'; return; }
      evs.push(ev); persist(); draw();
    };
    const total = {};
    const tick = (now) => {
      if (now - (tick._l || 0) < 500) return; tick._l = now;
      for (const e of evs) {
        const node = body.querySelector(`[data-ev="${e.id}"]`); if (!node) continue;
        const tg = T.eventTarget(e, now); if (tg == null) continue;
        const p = T.countdownParts(tg - now), big = node.querySelector('[data-big]'), small = node.querySelector('[data-small]');
        total[e.id] = total[e.id] || Math.max(tg - now, 1);
        if (p.d > 0) { big.textContent = `${p.d} ${p.d === 1 ? 'dag' : 'dagen'}`; small.textContent = `${p.h} u ${T.pad2(p.m)} min ${T.pad2(p.s)} s`; } else { big.textContent = `${T.pad2(p.h)}:${T.pad2(p.m)}:${T.pad2(p.s)}`; small.textContent = p.total === 0 ? 'Het is zover!' : 'Bijna zover'; }
        node.querySelector('[data-bar]').style.width = `${Math.min(100, Math.max(2, 100 * (1 - (tg - now) / Math.max(total[e.id], tg - now))))}%`;
        // net voorbij? (binnen 1 minuut na het tijdstip) viering, maar maar één keer
        const key = `${e.id}:${tg}`;
        if (p.total <= 1 && !fired.has(key)) { fired.add(key); save('aftellen-gezien', [...fired].slice(-30)); playScene(document.body, 'daily-bonus', { title: e.name, sub: 'Het is zover!' }); }
      }
    };
    api.tickFns.push(tick);
  }
  draw();
}

/* ---------- Interval-timer ---------- */
export function intervalTab(api) {
  const { body, load, save } = api;
  let cfg = Object.assign({ work: 40, rest: 20, rounds: 8, warm: 10, cool: 0 }, load('interval', {}));
  let run = null; // { t0, paused:null|ms, plan, last }
  const COL = { warm: '#f59e0b', work: '#ef4444', rest: '#22c55e', cool: '#38bdf8' }, NAME = { warm: 'Opwarmen', work: 'Doe!', rest: 'Rust', cool: 'Afkoelen' };
  const fmtS = (s) => (s >= 60 ? `${Math.floor(s / 60)}:${T.pad2(s % 60)}` : `${s} s`);
  const persist = () => save('interval', cfg);

  function setup() {
    api.tickFns.length = 0; run = null;
    body.innerHTML = `<div class="tu-card"><b>Kies een schema</b><div class="tu-row" style="margin-top:.4rem">${T.INTERVAL_PRESETS.map((p) => `<button class="tu-big" data-pre="${p.id}" style="min-height:48px;font-size:.95rem">${esc(p.name)}</button>`).join('')}</div></div>
      <div class="tu-card">${[['work', 'Inspanning', 5, 5, 3600], ['rest', 'Rust', 5, 0, 1800], ['rounds', 'Rondes', 1, 1, 50], ['warm', 'Opwarmen', 5, 0, 600], ['cool', 'Afkoelen', 5, 0, 600]].map(([k, l, st, mn, mx]) => `<div class="tu-row" style="justify-content:space-between;margin:.4rem 0"><span>${l}</span><span class="tu-row"><button class="tu-big" data-dec="${k}|${st}|${mn}" style="min-width:52px">−</button><b data-v="${k}" style="min-width:4.5rem;text-align:center;font-size:1.2rem">${k === 'rounds' ? cfg[k] : fmtS(cfg[k])}</b><button class="tu-big" data-inc="${k}|${st}|${mx}" style="min-width:52px">+</button></span></div>`).join('')}
        <p><small>Totaal: ${fmtS(T.planTotal(T.buildIntervalPlan(cfg)))}</small></p><button class="tu-big pri" data-go style="width:100%">${icon('flame', { size: 28 })} Start</button></div>`;
    body.querySelectorAll('[data-pre]').forEach((b) => { b.onclick = () => { const p = T.INTERVAL_PRESETS.find((x) => x.id === b.dataset.pre); cfg = { work: p.work, rest: p.rest, rounds: p.rounds, warm: p.warm, cool: p.cool }; persist(); setup(); }; });
    body.querySelectorAll('[data-dec]').forEach((b) => { b.onclick = () => { const [k, st, mn] = b.dataset.dec.split('|'); cfg[k] = Math.max(+mn, cfg[k] - +st); persist(); setup(); }; });
    body.querySelectorAll('[data-inc]').forEach((b) => { b.onclick = () => { const [k, st, mx] = b.dataset.inc.split('|'); cfg[k] = Math.min(+mx, cfg[k] + +st); persist(); setup(); }; });
    body.querySelector('[data-go]').onclick = start;
  }
  function start() {
    api.unlock(); const plan = T.buildIntervalPlan(cfg); run = { t0: Date.now(), plan, paused: null, lastIdx: -1, lastSec: -1 };
    const C = 2 * Math.PI * 90;
    body.innerHTML = `<div class="tu-card" data-card style="text-align:center;transition:background .3s"><div data-phase style="font-size:calc(2rem * var(--gfx-font,1));font-weight:800"></div>
      <div style="position:relative;width:min(70vw,260px);margin:.5rem auto"><svg viewBox="0 0 200 200" width="100%"><circle cx="100" cy="100" r="90" fill="none" stroke="var(--line)" stroke-width="12"/><circle data-ring cx="100" cy="100" r="90" fill="none" stroke="#ef4444" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="0" transform="rotate(-90 100 100)"/></svg>
        <div data-left style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:3.2rem;font-weight:800;font-variant-numeric:tabular-nums"></div></div>
      <div data-round style="font-weight:700"></div><div class="tu-bar" style="margin:.5rem 0"><i data-total style="width:0"></i></div>
      <div class="tu-row" style="justify-content:center"><button class="tu-big" data-pause>Pauze</button><button class="tu-big" data-stop>Stop</button></div></div>`;
    body.querySelector('[data-stop]').onclick = setup;
    body.querySelector('[data-pause]').onclick = (e) => { if (run.paused == null) { run.paused = Date.now(); e.target.textContent = 'Verder'; } else { run.t0 += Date.now() - run.paused; run.paused = null; e.target.textContent = 'Pauze'; } };
    api.tickFns.push((now) => {
      if (!run) return; const el = ((run.paused ?? now) - run.t0) / 1000, seg = T.segmentAt(run.plan, el), tot = T.planTotal(run.plan);
      if (!seg) { finish(); return; }
      const col = COL[seg.seg.type], left = Math.ceil(seg.left);
      body.querySelector('[data-phase]').textContent = NAME[seg.seg.type]; body.querySelector('[data-phase]').style.color = col;
      body.querySelector('[data-left]').textContent = fmtS(left);
      const ring = body.querySelector('[data-ring]'); ring.setAttribute('stroke', col); ring.setAttribute('stroke-dashoffset', String(C * (seg.into / seg.seg.secs)));
      body.querySelector('[data-round]').textContent = seg.seg.round ? `Ronde ${seg.seg.round} van ${cfg.rounds}` : '';
      body.querySelector('[data-total]').style.width = `${Math.min(100, 100 * el / tot)}%`;
      if (seg.idx !== run.lastIdx) { run.lastIdx = seg.idx; if (seg.seg.type === 'work') api.beep(880, 0.35, 0.3); else if (seg.seg.type === 'rest') api.beep(520, 0.4, 0.25); else api.beep(660, 0.25, 0.2); api.buzz(120); }
      else if (left <= 3 && left !== run.lastSec && seg.seg.secs > 4) api.beep(440, 0.1, 0.18);
      run.lastSec = left;
    });
  }
  function finish() {
    run = null; api.tickFns.length = 0; api.chime(0.4); api.buzz([200, 100, 200]);
    body.innerHTML = `<div class="tu-card" style="text-align:center">${icon('trophy', { size: 90 })}<h2>Klaar!</h2><p>Je hebt ${cfg.rounds} rondes volbracht.</p><button class="tu-big pri" data-again>Nog een keer</button></div>`;
    body.querySelector('[data-again]').onclick = setup; playScene(document.body, 'victory', { title: 'Klaar!', sub: 'Goed gedaan' });
  }
  setup();
}

/* ---------- Beurtklok (schaakklok) ---------- */
export function turnTab(api) {
  const { body, load, save } = api;
  let mins = load('beurt-min', 5), inc = load('beurt-inc', 0), clock = null, over = false;
  function setup() {
    api.tickFns.length = 0; clock = null; over = false;
    body.innerHTML = `<div class="tu-card" style="text-align:center">${icon('dice', { size: 72 })}<h2 style="margin:.2rem 0">Beurtklok</h2><p>Voor schaken, bordspellen of een quiz. Elke speler tikt na zijn beurt op zijn eigen helft.</p>
      <b>Tijd per speler</b><div class="tu-row" style="justify-content:center;margin:.4rem 0">${[1, 3, 5, 10, 15, 30].map((m) => `<button class="tu-big ${m === mins ? 'pri' : ''}" data-m="${m}">${m} min</button>`).join('')}</div>
      <b>Bonus per zet</b><div class="tu-row" style="justify-content:center;margin:.4rem 0">${[0, 2, 5, 10].map((s) => `<button class="tu-big ${s === inc ? 'pri' : ''}" data-i="${s}">${s ? '+' + s + ' s' : 'geen'}</button>`).join('')}</div>
      <button class="tu-big pri" data-go style="margin-top:.5rem">Start</button></div>`;
    body.querySelectorAll('[data-m]').forEach((b) => { b.onclick = () => { mins = +b.dataset.m; save('beurt-min', mins); setup(); }; });
    body.querySelectorAll('[data-i]').forEach((b) => { b.onclick = () => { inc = +b.dataset.i; save('beurt-inc', inc); setup(); }; });
    body.querySelector('[data-go]').onclick = play;
  }
  function play() {
    api.unlock(); clock = T.newTurnClock(mins, inc);
    const half = (p, rot) => `<button data-p="${p}" style="width:100%;border-radius:20px;min-height:calc(34vh);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.2rem;${rot ? 'transform:rotate(180deg);' : ''}font-weight:800"><span data-t${p} style="font-size:calc(3.6rem * var(--gfx-font,1));font-variant-numeric:tabular-nums"></span><small data-s${p}></small></button>`;
    body.innerHTML = `${half(1, true)}<div class="tu-row" style="justify-content:center;margin:.5rem 0"><button class="tu-big" data-stop>Stop</button></div>${half(0, false)}`;
    body.querySelector('[data-stop]').onclick = setup;
    body.querySelectorAll('[data-p]').forEach((b) => { b.onclick = () => { if (over) return; T.turnPress(clock, +b.dataset.p, Date.now()); api.beep(clock.active === 0 ? 700 : 560, 0.06, 0.2); render(Date.now()); }; });
    const render = (now) => {
      T.turnTick(clock, now);
      for (const p of [0, 1]) {
        const b = body.querySelector(`[data-p="${p}"]`); if (!b) return;
        const t = clock.t[p], active = clock.active === p;
        body.querySelector(`[data-t${p}]`).textContent = t < 20000 ? `${Math.floor(t / 1000)}.${Math.floor((t % 1000) / 100)}` : T.fmt(t + 999);
        body.querySelector(`[data-s${p}]`).textContent = clock.over === p ? 'Tijd is om!' : clock.active < 0 ? 'Tik om te starten' : active ? 'Jouw beurt' : `${clock.moves[p]} zetten`;
        b.style.background = clock.over === p ? '#dc2626' : active ? 'var(--accent)' : 'var(--card)'; b.style.color = clock.over === p || active ? '#fff' : 'inherit';
      }
      if (clock.over >= 0 && !over) { over = true; api.chime(0.5); api.buzz([300, 100, 300]); }
    };
    api.tickFns.push((now) => { if (clock) render(now); });
    render(Date.now());
  }
  setup();
}
