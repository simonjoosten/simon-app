// Tijd, ronde 4: tab "Spelletjes en ritmes" met Ritmes (routines achter elkaar), Reactietest en Tijdsgevoel (stop op precies N seconden).
// Pure functies bovenaan (testbaar), UI onderaan: spelTab(api) met api uit tijd.js.
import { esc, injectR4Css, sectionsHtml, bindSections, clamp, blip, pad2 } from './tools-r4-kit.js?v=1';

export const RITMES = [
  { id: 'ochtend', name: 'Ochtendroutine', icon: 'sun', steps: [['Wakker worden en bed opmaken', 3], ['Aankleden', 8], ['Ontbijten', 15], ['Tanden poetsen', 2], ['Tas inpakken', 5]] },
  { id: 'avond', name: 'Naar bed', icon: 'moon', steps: [['Speelgoed opruimen', 5], ['Pyjama aan', 3], ['Tanden poetsen', 2], ['Voorlezen', 15], ['Licht uit', 1]] },
  { id: 'opruim', name: 'Opruimspurt', icon: 'broom', steps: [['Vuile kleren in de mand', 2], ['Speelgoed in de kist', 5], ['Bureau leeg', 3], ['Stofzuigen', 5]] },
  { id: 'huiswerk', name: 'Huiswerk-ritme', icon: 'book', steps: [['Plannen wat je moet doen', 3], ['Moeilijkste opdracht', 20], ['Pauze: water en bewegen', 5], ['Rustige opdracht', 15], ['Tas inpakken', 3]] },
  { id: 'sport', name: 'Beweegmoment', icon: 'trophy', steps: [['Warming-up', 3], ['Hardlopen of springen', 6], ['Spieren rekken', 3], ['Water drinken', 1]] },
];
/** "Tanden poetsen:2, Aankleden:8" -> [[naam, minuten]]. Max 12 stappen, 1 tot 120 minuten. */
export function parseRitme(text) {
  const out = [];
  for (const raw of String(text || '').split(/[,;\n]+/)) {
    const m = /^(.*?)[:=\s]\s*(\d+(?:[.,]\d+)?)\s*(?:min|m)?\s*$/i.exec(raw.trim()); if (!m) continue;
    const name = m[1].trim().slice(0, 40), min = parseFloat(m[2].replace(',', '.')); if (!name || !(min > 0)) continue;
    out.push([name, clamp(Math.round(min * 10) / 10, 0.5, 120)]); if (out.length >= 12) break;
  }
  return out;
}
export const ritmeTotal = (steps) => steps.reduce((a, s) => a + s[1], 0);
/** Waar zijn we na `elapsedMs`? -> {i, left (ms in stap), done, pct} */
export function ritmePos(steps, elapsedMs) {
  let acc = 0;
  for (let i = 0; i < steps.length; i++) { const d = steps[i][1] * 60000; if (elapsedMs < acc + d) return { i, left: acc + d - elapsedMs, done: false, pct: (elapsedMs - acc) / d }; acc += d; }
  return { i: steps.length, left: 0, done: true, pct: 1 };
}
export function reactionRating(ms) {
  if (ms < 180) return ['Bliksemsnel!', 5]; if (ms < 250) return ['Supersnel', 4]; if (ms < 350) return ['Lekker snel', 3]; if (ms < 500) return ['Prima', 2]; return ['Rustig aan, je kunt sneller', 1];
}
export const fmtSec = (ms) => `${(ms / 1000).toFixed(2).replace('.', ',')} s`;
/** Tijdsgevoel: verschil met het doel in ms -> [punten 0-100, tekst] */
export function feelScore(ms, targetSec) {
  const diff = Math.abs(ms - targetSec * 1000), tol = targetSec * 1000 * 0.25;
  const pts = Math.max(0, Math.round(100 * (1 - diff / tol)));
  const txt = diff < 100 ? 'Bijna perfect!' : diff < 300 ? 'Heel dichtbij' : diff < 1000 ? 'Goed gevoel' : ms < targetSec * 1000 ? 'Te vroeg gestopt' : 'Te laat gestopt';
  return [pts, txt];
}

export function spelTab(api) {
  injectR4Css();
  const { body, load, save, track } = api;
  let sec = 'ritmes', run = null, rs = null; // run = actief ritme
  const best = () => load('r4-best', { react: 0, feel: {} });
  const draw = () => {
    body.innerHTML = `${sectionsHtml([['ritmes', 'Ritmes'], ['react', 'Reactietest'], ['feel', 'Tijdsgevoel']], sec)}<div data-r4></div>`;
    bindSections(body, (k) => { cleanup(); sec = k; draw(); });
    ({ ritmes: ritmesView, react: reactView, feel: feelView })[sec](body.querySelector('[data-r4]'));
  };
  function cleanup() { api.tickFns.length = 0; run = null; if (rs && rs.t) clearTimeout(rs.t); rs = null; }
  track(() => { if (rs && rs.t) clearTimeout(rs.t); });

  /* ---- Ritmes ---- */
  function ritmesView(host) {
    const own = load('r4-ritmes', []);
    if (run) return runView(host);
    const all = [...RITMES, ...own.map((r) => ({ ...r, own: true }))];
    host.innerHTML = `<div class="r4-card"><b>Ritmes</b><br><small>Een rij taakjes met een timer per stap. Je hoort een piepje bij elke nieuwe stap.</small></div>
      ${all.map((r) => `<div class="r4-card"><div class="r4-row"><b style="flex:1">${esc(r.name)}</b><span class="r4-chip">${r.steps.length} stappen · ${Math.round(ritmeTotal(r.steps))} min</span></div>
        <small>${r.steps.map((s) => esc(s[0])).join(' → ')}</small>
        <div class="r4-row" style="margin-top:.5rem"><button class="r4-btn pri" data-start="${esc(r.id)}">Start</button>${r.own ? `<button class="r4-btn" data-del="${esc(r.id)}" aria-label="Verwijder">✕</button>` : ''}</div></div>`).join('')}
      <div class="r4-card"><b>Eigen ritme maken</b><input class="r4-in" data-nm placeholder="Naam, bijv. Zaterdagklusjes" maxlength="30" style="margin:.4rem 0">
        <textarea class="r4-in" data-st rows="3" placeholder="Eén stap per regel of met komma: Tanden poetsen:2, Aankleden:8"></textarea>
        <button class="r4-btn pri" data-add style="margin-top:.5rem">Bewaren</button> <span data-msg class="r4-bad"></span></div>`;
    host.querySelectorAll('[data-start]').forEach((b) => { b.onclick = () => { const r = all.find((x) => x.id === b.dataset.start); if (r) { api.unlock(); blip(880); run = { r, t0: Date.now(), last: -1 }; ritmesView(host); } }; });
    host.querySelectorAll('[data-del]').forEach((b) => { b.onclick = () => { save('r4-ritmes', own.filter((x) => x.id !== b.dataset.del)); ritmesView(host); }; });
    host.querySelector('[data-add]').onclick = () => {
      const name = host.querySelector('[data-nm]').value.trim(), steps = parseRitme(host.querySelector('[data-st]').value), msg = host.querySelector('[data-msg]');
      if (!name) { msg.textContent = 'Geef je ritme een naam.'; return; } if (!steps.length) { msg.textContent = 'Schrijf stappen als "Aankleden:8" (naam en minuten).'; return; }
      own.push({ id: 'e' + api.newId(), name, icon: 'star', steps }); save('r4-ritmes', own.slice(-12)); ritmesView(host);
    };
  }
  function runView(host) {
    const { r } = run;
    host.innerHTML = `<div class="r4-card" style="text-align:center"><b>${esc(r.name)}</b><div data-now style="font-size:1.3rem;font-weight:800;margin:.5rem 0"></div><div class="r4-big" data-left></div>
      <div class="tu-bar" style="margin:.6rem 0"><i data-bar style="width:0"></i></div><small data-next></small>
      <div class="r4-row" style="justify-content:center;margin-top:.7rem"><button class="r4-btn" data-skip>Volgende stap</button><button class="r4-btn" data-stop>Stoppen</button></div></div>`;
    const q = (s) => host.querySelector(s);
    const upd = (now) => {
      if (!run) return; let el = now - run.t0; const p = ritmePos(r.steps, el);
      if (p.i !== run.last) { if (run.last >= 0) { blip(p.done ? 1175 : 880, 0.25, 0.2); api.buzz && api.buzz([120, 60, 120]); } run.last = p.i; }
      if (p.done) { q('[data-now]').textContent = 'Klaar! Goed gedaan!'; q('[data-left]').textContent = '00:00'; q('[data-bar]').style.width = '100%'; q('[data-next]').textContent = ''; api.tickFns.length = 0; try { api.chime(0.3); } catch {} const b = best(); b.ritmes = (b.ritmes || 0) + 1; save('r4-best', b); return; }
      q('[data-now]').textContent = `${p.i + 1}. ${r.steps[p.i][0]}`; const s = Math.ceil(p.left / 1000); q('[data-left]').textContent = `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
      q('[data-bar]').style.width = Math.round(((p.i + p.pct) / r.steps.length) * 100) + '%'; q('[data-next]').textContent = r.steps[p.i + 1] ? `Straks: ${r.steps[p.i + 1][0]}` : 'Dit is de laatste stap';
    };
    api.tickFns.push((now) => { if (now - (upd._l || 0) >= 250) { upd._l = now; upd(now); } });
    upd(Date.now());
    q('[data-skip]').onclick = () => { const p = ritmePos(r.steps, Date.now() - run.t0); if (!p.done) { run.t0 -= p.left; upd(Date.now()); } };
    q('[data-stop]').onclick = () => { cleanup(); ritmesView(host); };
  }

  /* ---- Reactietest ---- */
  function reactView(host) {
    const b = best(); let state = 'idle', t0 = 0; const results = [];
    const show = (txt, color, sub = '') => { host.innerHTML = `<div class="r4-card" style="text-align:center"><small>Tik zodra het scherm GROEN wordt. Niet te vroeg!</small><button class="r4-pad" data-pad style="background:${color};margin:.6rem 0">${txt}</button>
      <div>${sub}</div><div class="r4-row" style="justify-content:center"><span class="r4-chip">Beste: ${b.react ? Math.round(b.react) + ' ms' : '–'}</span>${results.length ? `<span class="r4-chip">Gemiddeld: ${Math.round(results.reduce((a, x) => a + x, 0) / results.length)} ms</span>` : ''}</div></div>`; host.querySelector('[data-pad]').onclick = tap; };
    function tap() {
      api.unlock();
      if (state === 'idle') { state = 'wait'; show('Wacht…', '#dc2626'); rs = { t: setTimeout(() => { state = 'go'; t0 = performance.now(); show('NU!', '#16a34a'); blip(1000, 0.1, 0.2); }, 1500 + Math.random() * 3500) }; return; }
      if (state === 'wait') { clearTimeout(rs.t); state = 'idle'; show('Te vroeg! Tik om opnieuw te proberen', '#d97706', '<b class="r4-bad">Wacht tot het groen wordt.</b>'); return; }
      if (state === 'go') {
        const ms = Math.max(1, performance.now() - t0), [txt, st] = reactionRating(ms); results.push(ms); state = 'idle'; const nb = !b.react || ms < b.react; if (nb) { b.react = ms; save('r4-best', b); }
        show('Tik om opnieuw te spelen', '#2563eb', `<div class="r4-big">${Math.round(ms)} ms</div><b>${txt}</b> ${'⭐'.repeat(st)}${nb ? '<br><b class="r4-ok">Nieuw record!</b>' : ''}`);
      }
    }
    show('Tik om te starten', '#2563eb');
  }

  /* ---- Tijdsgevoel ---- */
  function feelView(host) {
    const b = best(); let target = 10, running = false, t0 = 0, hide = true;
    const draw2 = (res = '') => {
      host.innerHTML = `<div class="r4-card" style="text-align:center"><b>Stop de klok op precies ${target} seconden</b><br><small>Na 3 seconden verdwijnen de cijfers. Vertrouw op je gevoel!</small>
        <div class="r4-row" style="justify-content:center;margin:.5rem 0">${[5, 10, 20, 60].map((t) => `<button class="r4-btn ${t === target ? 'pri' : ''}" data-t="${t}" ${running ? 'disabled' : ''}>${t} s</button>`).join('')}</div>
        <div class="r4-big" data-disp>${running ? '…' : '0,00'}</div>
        <button class="r4-pad" data-go style="background:${running ? '#dc2626' : '#2563eb'};margin:.6rem 0;min-height:110px">${running ? 'STOP' : 'Start'}</button>${res}
        <span class="r4-chip">Beste ${target} s: ${b.feel[target] != null ? b.feel[target] + ' punten' : '–'}</span></div>`;
      host.querySelectorAll('[data-t]').forEach((x) => { x.onclick = () => { target = +x.dataset.t; draw2(); }; });
      host.querySelector('[data-go]').onclick = () => {
        api.unlock();
        if (!running) { running = true; t0 = performance.now(); draw2(); api.tickFns.length = 0; api.tickFns.push(() => { const e = performance.now() - t0, d = host.querySelector('[data-disp]'); if (d) d.textContent = e < 3000 ? fmtSec(e).replace(' s', '') : '…'; }); return; }
        const e = performance.now() - t0; running = false; api.tickFns.length = 0; const [pts, txt] = feelScore(e, target);
        const nb = pts > (b.feel[target] || 0); if (nb) { b.feel[target] = pts; save('r4-best', b); }
        draw2(`<div class="r4-big">${fmtSec(e)}</div><b>${txt}</b> · ${pts} punten${nb ? '<br><b class="r4-ok">Nieuw record!</b>' : ''}<br>`);
      };
    };
    draw2();
  }
  draw();
}
