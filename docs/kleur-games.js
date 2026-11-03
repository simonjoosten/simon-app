// Kleurspelletjes (tabblad in de Kleur-app): Raad de kleur, Kleurmenger, Welke is anders? en Kleurgeheugen.
import * as K from './kleur-color.js?v=1';
import { icon } from './gfx/art.js?v=1';
import { GFX } from './gfx/settings.js?v=1';
import { Settings } from './gfx/settings.js?v=1';
import { newAudio } from './music-synth.js?v=2';

// api: { esc, rd(key,dflt), wr(key,val), say(t), scene(id, opts), burst(kind) }
export function mountGames(host, api) {
  const { esc } = api, KEY = 'games';
  let best = K.cleanGames(api.rd(KEY, {})), g = null, disposed = false, ac = null; const timers = [];
  const $ = (s) => host.querySelector(s);
  const later = (fn, ms) => { const t = setTimeout(() => { if (!disposed) fn(); }, ms); timers.push(t); return t; };
  const saveBest = (k, v) => { if (v > best[k]) { best[k] = v; api.wr(KEY, best); return true; } return false; };
  const tone = (f, dur = 0.25) => { if (!Settings.get().sound) return; try { ac = ac || newAudio(); if (!ac) return; if (ac.state === 'suspended') ac.resume().catch(() => {}); const o = ac.createOscillator(), gn = ac.createGain(), t = ac.currentTime; o.type = 'triangle'; o.frequency.value = f; gn.gain.setValueAtTime(0.25, t); gn.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(gn); gn.connect(ac.destination); o.start(t); o.stop(t + dur + 0.02); } catch { /* stil */ } };
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

  function menu() {
    g = null; timers.splice(0).forEach(clearTimeout);
    host.innerHTML = `<div class="card"><b>${icon('target', { size: 28 })} Kleurspelletjes</b><div class="kl-games" style="margin-top:.5rem">
      <button data-g="raad">${icon('paint', { size: 54 })}<b>Raad de kleur</b><small class="mute">Stel de kleur in met de schuiven<br>Beste: ${best.raad || '–'}/500</small></button>
      <button data-g="menger">${icon('flask', { size: 54 })}<b>Kleurmenger</b><small class="mute">Meng verf tot de goede kleur<br>Beste: ${best.menger || '–'}/500</small></button>
      <button data-g="anders">${icon('magnet', { size: 54 })}<b>Welke is anders?</b><small class="mute">Vind het vakje met een andere kleur<br>Beste: niveau ${best.anders || '–'}</small></button>
      <button data-g="geheugen">${icon('crystal', { size: 54 })}<b>Kleurgeheugen</b><small class="mute">Onthoud de volgorde<br>Beste: ${best.geheugen || '–'} rondes</small></button></div></div>`;
  }
  const back = '<button data-g="menu">← Spelletjes</button>';

  // ===== Raad de kleur / Kleurmenger (5 rondes) =====
  function startMatch(kind) { g = { kind, round: 0, scores: [], target: null, w: [0, 0, 0, 0], rgb: [128, 128, 128], shown: null }; nextRound(); }
  function nextRound() {
    g.round++; g.shown = null;
    if (g.kind === 'raad') { g.target = K.randomColor(); g.rgb = [128, 128, 128]; }
    else { const t = K.mixTarget(); g.target = t.color; g.tw = t.weights; g.w = [0, 0, 0, 0]; }
    renderMatch();
  }
  const guessColor = () => (g.kind === 'raad' ? K.rgbToHex(...g.rgb) : K.mixFromWeights(g.w));
  function renderMatch() {
    if (g.round > 5) return endMatch();
    const guess = guessColor(), sl = g.kind === 'raad'
      ? [['Rood', 0, '#ef4444'], ['Groen', 1, '#22c55e'], ['Blauw', 2, '#3b82f6']].map(([n, i, c]) => `<div class="kl-row"><span style="min-width:4rem">${n}</span><input type="range" data-rgb="${i}" min="0" max="255" value="${g.rgb[i]}" style="flex:1;accent-color:${c}"><b style="min-width:2.5rem">${g.rgb[i]}</b></div>`).join('')
      : K.MIX_PRIMARIES.map((p, i) => `<div class="kl-row"><span style="min-width:4rem"><i style="display:inline-block;width:1em;height:1em;border-radius:50%;background:${p.c};border:1px solid #0004;vertical-align:-2px"></i> ${p.name}</span><input type="range" data-mix="${i}" min="0" max="8" value="${g.w[i]}" style="flex:1"><b style="min-width:2rem">${g.w[i]}</b></div>`).join('');
    host.innerHTML = `<div class="card">${back} <b>${g.kind === 'raad' ? 'Raad de kleur' : 'Kleurmenger'}</b> · ronde ${g.round}/5 · ${g.scores.reduce((a, b) => a + b, 0)} punten
      <div class="kl-duel"><div><small>Doel</small><div class="kl-big" style="background:${g.target};height:110px">&nbsp;</div></div><div><small>Jouw kleur</small><div class="kl-big" id="mt-guess" style="background:${guess};height:110px">&nbsp;</div></div></div>
      ${g.kind === 'menger' ? '<small class="mute">Meng rood, geel, blauw en wit zoals een schilder. 0 = niets, 8 = veel.</small>' : ''}${sl}
      <div class="kl-row"><button class="on" data-g="check" style="flex:1;font-size:1.1rem">Klaar!</button></div></div>`;
  }
  function checkMatch() {
    const score = K.matchScore(g.target, guessColor()); g.scores.push(score); tone(300 + score * 6, 0.4);
    host.innerHTML = `<div class="card">${back} <b>Ronde ${g.round}/5</b>
      <div class="kl-duel"><div><small>Doel</small><div class="kl-big" style="background:${g.target};height:110px">${g.target}</div></div><div><small>Jouw kleur</small><div class="kl-big" style="background:${guessColor()};height:110px">${guessColor()}</div></div></div>
      <div class="kl-big" style="border:2px solid var(--line);background:transparent;color:inherit">${score >= 95 ? 'Wauw, bijna perfect!' : score >= 80 ? 'Heel dichtbij!' : score >= 55 ? 'Niet slecht' : 'Nog even oefenen'} · ${score} punten</div>
      <div class="kl-row"><button class="on" data-g="next" style="flex:1;font-size:1.1rem">${g.round >= 5 ? 'Bekijk je score' : 'Volgende ronde'}</button></div></div>`;
  }
  function endMatch() {
    const total = g.scores.reduce((a, b) => a + b, 0), avg = total / 5, st = K.starsForScore(avg), isBest = saveBest(g.kind === 'raad' ? 'raad' : 'menger', total);
    host.innerHTML = `<div class="card" style="text-align:center">${back}<div class="kl-big" style="background:transparent;color:inherit;font-size:2.4rem">${stars(st)}</div><b style="font-size:1.4rem">${total} / 500</b>
      ${isBest ? '<div>🏆 Nieuw record!</div>' : ''}<div>${g.scores.map((s) => `<span class="chip">${s}</span>`).join(' ')}</div>
      <div class="kl-row" style="justify-content:center"><button class="on" data-g="${g.kind}">Nog een keer</button></div></div>`;
    if (isBest && total > 0) api.scene('new-record', { title: 'Nieuw record!', sub: `${total} punten` }); else if (st === 3) api.scene('victory', { title: 'Geweldig!', sub: `${total} punten` });
  }

  // ===== Welke is anders? =====
  function startAnders() { g = { kind: 'anders', level: 1, time: 45, over: false }; newGrid(); g.tick = setInterval(() => { if (disposed || !g || g.kind !== 'anders') return clearInterval(g && g.tick); g.time -= 0.25; const bar = $('#an-time'); if (bar) { bar.style.width = Math.max(0, g.time / 45 * 100) + '%'; } const tt = $('#an-t'); if (tt) tt.textContent = Math.max(0, Math.ceil(g.time)); if (g.time <= 0) endAnders(); }, 250); }
  function newGrid() { g.odd = K.oddOneOut(g.level); renderAnders(); }
  function renderAnders() {
    const o = g.odd;
    host.innerHTML = `<div class="card">${back} <b>Niveau ${g.level}</b> · <span id="an-t">${Math.ceil(g.time)}</span> s
      <div class="kl-timebar"><i id="an-time" style="width:${Math.max(0, g.time / 45 * 100)}%"></i></div>
      <div class="kl-odd" style="grid-template-columns:repeat(${o.n},1fr)">${Array.from({ length: o.n * o.n }, (_, i) => `<button data-odd="${i}" aria-label="Vakje ${i + 1}" style="background:${i === o.idx ? o.odd : o.base}"></button>`).join('')}</div>
      <small class="mute">Tik op het vakje dat een beetje anders is. Fout? Dan verlies je 3 seconden.</small></div>`;
  }
  function endAnders() {
    clearInterval(g.tick); g.over = true; const lvl = g.level - 1, isBest = saveBest('anders', lvl);
    host.innerHTML = `<div class="card" style="text-align:center">${back}<b style="font-size:1.4rem">Tijd is om!</b><div class="kl-big" style="background:transparent;color:inherit;font-size:2.2rem">Niveau ${lvl}</div>${isBest ? '<div>🏆 Nieuw record!</div>' : `<div class="mute">Je record: niveau ${best.anders}</div>`}
      <div class="kl-row" style="justify-content:center"><button class="on" data-g="anders">Nog een keer</button></div></div>`;
    if (isBest && lvl > 0) api.scene('new-record', { title: 'Nieuw record!', sub: `Niveau ${lvl}` });
  }

  // ===== Kleurgeheugen =====
  function startGeheugen() { g = { kind: 'geheugen', seq: [], input: [], busy: true }; nextSeq(); }
  function renderGeheugen(msg, lit = -1) {
    host.innerHTML = `<div class="card">${back} <b>Ronde ${Math.max(1, g.seq.length)}</b> · record ${best.geheugen}
      <div class="kl-simon">${K.SIMON.map((s, i) => `<button data-sim="${i}" aria-label="Kleur ${i + 1}" class="${i === lit ? 'lit' : ''}" style="background:${s.c}" ${g.busy ? 'disabled' : ''}></button>`).join('')}</div><div class="kl-big" style="background:transparent;color:inherit;font-size:1.2rem;min-height:2rem">${msg || ''}</div></div>`;
  }
  function nextSeq() {
    g.seq = K.simonNext(g.seq); g.input = []; g.busy = true; renderGeheugen('Kijk goed…');
    const gap = Math.max(260, 620 - g.seq.length * 25);
    g.seq.forEach((c, i) => { later(() => { renderGeheugen('Kijk goed…', c); tone(K.SIMON[c].f, gap / 1000); later(() => renderGeheugen('Kijk goed…'), gap * 0.7); }, 700 + i * gap); });
    later(() => { g.busy = false; renderGeheugen('Jouw beurt!'); }, 700 + g.seq.length * gap);
  }
  function simonTap(i) {
    if (!g || g.busy) return; g.input.push(i); tone(K.SIMON[i].f, 0.25); const r = K.simonCheck(g.seq, g.input);
    if (r === 'fout') { const rounds = g.seq.length - 1, isBest = saveBest('geheugen', rounds); g.busy = true; tone(110, 0.6);
      host.innerHTML = `<div class="card" style="text-align:center">${back}<b style="font-size:1.4rem">Oei, dat was niet de goede!</b><div class="kl-big" style="background:transparent;color:inherit;font-size:2.2rem">${rounds} ${rounds === 1 ? 'ronde' : 'rondes'}</div>${isBest && rounds > 0 ? '<div>🏆 Nieuw record!</div>' : ''}<div class="kl-row" style="justify-content:center"><button class="on" data-g="geheugen">Nog een keer</button></div></div>`;
      if (isBest && rounds > 0) api.scene('new-record', { title: 'Nieuw record!', sub: `${rounds} rondes` }); return; }
    renderGeheugen('Jouw beurt!', i); later(() => { if (g && !g.busy) renderGeheugen('Jouw beurt!'); }, 150);
    if (r === 'klaar') { g.busy = true; if (g.seq.length % 5 === 0) api.scene('levelup', { title: `${g.seq.length} rondes!` }); later(() => nextSeq(), 700); }
  }

  host.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.odd != null && g && g.kind === 'anders' && !g.over) { if (+b.dataset.odd === g.odd.idx) { g.level++; g.time = Math.min(45, g.time + 2); tone(660, 0.12); newGrid(); } else { g.time -= 3; tone(150, 0.25); b.disabled = true; b.style.opacity = '.25'; } return; }
    if (b.dataset.sim != null) { simonTap(+b.dataset.sim); return; }
    const k = b.dataset.g; if (!k) return;
    if (g && g.tick) clearInterval(g.tick);
    if (k === 'menu') menu(); else if (k === 'raad' || k === 'menger') startMatch(k); else if (k === 'anders') startAnders(); else if (k === 'geheugen') startGeheugen();
    else if (k === 'check') checkMatch(); else if (k === 'next') nextRound();
  });
  host.addEventListener('input', (e) => {
    const t = e.target; if (!g) return;
    if (t.dataset.rgb != null) { g.rgb[+t.dataset.rgb] = +t.value; t.nextElementSibling.textContent = t.value; }
    else if (t.dataset.mix != null) { g.w[+t.dataset.mix] = +t.value; t.nextElementSibling.textContent = t.value; }
    else return;
    const el = $('#mt-guess'); if (el) el.style.background = guessColor();
  });
  void GFX;
  menu();
  return { dispose() { disposed = true; timers.forEach(clearTimeout); if (g && g.tick) clearInterval(g.tick); try { ac && ac.close && ac.close().catch(() => {}); } catch { /* stil */ } } };
}
