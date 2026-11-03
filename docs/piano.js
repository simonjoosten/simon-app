// Piano: tot 3 octaven (C2-C7 met schuiven), 17 klanken, galm/echo/filter, pedaal, akkoordenmodus, akkoordenkaart, metronoom,
// opnemen met bewaarde opnames en delen via code, 20 liedjes om te leren (stap voor stap), een spel met vallende noten en slagwerk-pads.
// Logica staat in piano-songs.js, geluid in music-synth.js.

import { dailyIndex } from './creatief-r4-songs.js?v=1';
import { INSTRUMENTS, DRUMKIT, NOTE_NAMES, newAudio, makeBus, makeNoise, applyFx, startNote, playNote, playDrum, midiFreq, noteName, click } from './music-synth.js?v=2';
import * as P from './piano-songs.js?v=2';
import { styleTag, gearHtml, wireGear, worldSelectHtml, hero, icon, GFX, Themes, Particles, playScene, copyText, starsStr } from './apps3-ui.js?v=1';

const CSS = `<style>
.pi-kb{position:relative;height:calc(230px*var(--s));background:#111;border-radius:14px;overflow:hidden;touch-action:none;box-shadow:0 6px 18px #0004}
.pi-key{position:absolute;top:0;border:1px solid #0005;touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer;transition:background .06s}
.pi-w{background:linear-gradient(#fff 70%,#e5e7eb);height:100%;z-index:1;border-radius:0 0 9px 9px}
.pi-b{background:linear-gradient(#444,#000);height:62%;z-index:2;border-radius:0 0 7px 7px;box-shadow:0 4px 5px #0006}
html[data-gfx-q="normaal"] .pi-b{box-shadow:none}
.pi-w.on{background:linear-gradient(#c7d2fe,#818cf8);transform:translateY(1px)}
.pi-b.on{background:linear-gradient(#6366f1,#3730a3)}
.pi-key.hint{box-shadow:inset 0 0 0 4px #f59e0b,0 0 14px #f59e0b;animation:pi-pulse .9s infinite alternate}
@keyframes pi-pulse{to{box-shadow:inset 0 0 0 6px #fbbf24,0 0 22px #fbbf24}}
html[data-reduce="1"] .pi-key.hint{animation:none}
.pi-lab{position:absolute;bottom:6px;left:0;right:0;text-align:center;font-size:calc(.72rem*var(--f));font-weight:700;color:#475569;pointer-events:none;line-height:1.05}
.pi-b .pi-lab{color:#cbd5e1;bottom:4px;font-size:calc(.6rem*var(--f))}
.pi-lab small{display:block;font-size:.62rem;opacity:.7}
.pi-ins{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(92px*var(--s)),1fr));gap:.4rem}
.pi-ins button{flex-direction:column;padding:.3rem;font-size:.8rem;line-height:1.1}
.pi-songs{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(150px*var(--s)),1fr));gap:.5rem}
.pi-songs button{flex-direction:column;align-items:flex-start;text-align:left;padding:.5rem .6rem;line-height:1.2;font-weight:700}
.pi-songs button.on{outline:3px solid #f59e0b}
.pi-pads{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem}
.pi-pad{min-height:calc(92px*var(--s));flex-direction:column;font-weight:800;color:#fff;border:0;border-radius:18px;box-shadow:0 5px 0 #0004;touch-action:manipulation}
.pi-pad:active,.pi-pad.hit{transform:translateY(3px);box-shadow:0 2px 0 #0004;filter:brightness(1.25)}
.pi-tape{display:flex;align-items:center;gap:.4rem;padding:.3rem 0;border-top:1px solid var(--line)}
.pi-cv{width:100%;display:block;border-radius:14px;touch-action:none}
.pi-row{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin:.35rem 0}
.pi-row input[type=range]{flex:1;min-width:110px;min-height:calc(44px*var(--s))}
.pi-chord{font-weight:900;font-size:calc(1.3rem*var(--f));min-height:2rem}
</style>`;

const PADKEYS = ['q', 'w', 'e', 'r', 'a', 's', 'd', 'f', 'z', 'x', 'c', 'v', 't', 'g', 'b', 'y', 'h', 'n'];

export function pianoView(ctx) {
  const { view, esc, addCleanup } = ctx;
  const PKEY = 'piano:progress', TKEY = 'piano:tapes', SKEY = 'piano:prefs';
  const rd = (k, d) => { try { const o = JSON.parse(localStorage.getItem(k) || 'null'); return o == null ? d : o; } catch { return d; } };
  const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  const prefs = Object.assign({ inst: 'piano', vol: 0.8, label: 'noten', octs: (globalThis.innerWidth || 400) >= 700 ? 3 : 2, start: 60, rev: 0.2, echo: 0, filter: 1, chordType: 'maj', speed: 1, bpm: 100 }, rd(SKEY, {}) || {});
  if (!INSTRUMENTS.some((i) => i.id === prefs.inst)) prefs.inst = 'piano';
  prefs.octs = prefs.octs === 3 ? 3 : prefs.octs === 1 ? 1 : 2; prefs.start = Math.max(P.KEY_MIN, Math.min(P.KEY_MAX - prefs.octs * 12, Math.round(prefs.start / 12) * 12));
  const savePrefs = () => wr(SKEY, prefs);
  let tab = 'play', ac = null, bus = null, nb = null, alive = true, heroCtl = null, pedal = false, chordMode = false, spaceDown = false;
  let tapes = P.sanitizeTapes(rd(TKEY, [])), progress = rd(PKEY, {}) || {}, rec = null, playback = null, learn = null, learnSong = null, game = null, gsong = P.SONG_BY_ID.twinkel, metOn = false, metTimer = 0, metNext = 0, metBeat = 0, code = '';
  const down = new Map(), sustained = [], lit = new Map(), timers = [];
  const $ = (s) => view.querySelector(s);
  const setMsg = (t) => { const e = $('#pi-msg'); if (e) e.textContent = t || ''; };

  addCleanup(() => {
    alive = false; stopAll(); stopPlayback(); stopMetronome(); stopGame(true); timers.forEach(clearTimeout);
    try { heroCtl && heroCtl.dispose(); } catch { /* stil */ }
    try { ac && ac.close && ac.close().catch(() => {}); } catch { /* stil */ } ac = null;
    window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp);
  });

  // ----- audio -----
  function ensure() {
    if (!ac) { try { ac = newAudio(); if (!ac) return false; bus = makeBus(ac, prefs.vol); nb = makeNoise(ac); fx(); } catch { ac = null; return false; } }
    if (ac.state === 'suspended') { try { ac.resume().catch(() => {}); } catch { /* stil */ } }
    return true;
  }
  function fx() { if (!bus) return; bus.setVolume(prefs.vol); applyFx(bus, { rev: prefs.rev, echo: prefs.echo, filter: prefs.filter }, prefs.bpm); }
  function releaseLater(stop) { if (pedal) sustained.push(stop); else stop(); }
  function stopAll() { down.forEach((d) => d.stops.forEach((s) => s())); down.clear(); sustained.splice(0).forEach((s) => s()); lit.clear(); view.querySelectorAll('.pi-key.on').forEach((e) => e.classList.remove('on')); }

  // ----- toetsen -----
  const keyEl = (m) => view.querySelector(`.pi-key[data-m="${m}"]`);
  function light(m, on) { const c = (lit.get(m) || 0) + (on ? 1 : -1); if (c <= 0) lit.delete(m); else lit.set(m, c); const el = keyEl(m); if (el) el.classList.toggle('on', c > 0); }
  function noteOn(id, midi, vel = 1) {
    if (down.has(id) || !ensure()) return;
    const midis = chordMode ? P.chordNotes(midi, prefs.chordType) : [midi];
    const stops = midis.map((m) => startNote(ac, bus.input, prefs.inst, midiFreq(m), vel * (midis.length > 1 ? 0.75 : 1), nb));
    down.set(id, { midis, stops }); midis.forEach((m) => light(m, true));
    if (rec) midis.forEach((m) => rec.events.push({ midi: m, on: true, t: performance.now() - rec.t0 }));
    updateChordName();
    const L = P.keyLayout(prefs.start, prefs.octs), k = L.keys.find((x) => x.midi === midi);
    if (heroCtl && k && !GFX.reduce) heroCtl.burst(((k.x + k.w / 2) / 100) * (($('#pi-hero canvas') || {}).clientWidth || 320), 90, { kind: GFX.q ? 'sparkle' : 'stars', n: 4, power: 0.6 });
    if (game && game.running) gamePress(midi);
    if (learn) learnPress(midi);
  }
  function noteOff(id) {
    const d = down.get(id); if (!d) return; down.delete(id);
    d.stops.forEach(releaseLater); d.midis.forEach((m) => light(m, false));
    if (rec) d.midis.forEach((m) => rec.events.push({ midi: m, on: false, t: performance.now() - rec.t0 }));
    updateChordName();
  }
  function updateChordName() {
    const el = $('#pi-chordname'); if (!el) return;
    const all = []; down.forEach((d) => d.midis.forEach((m) => all.push(m)));
    el.textContent = all.length >= 2 ? (P.detectChord(all) ? 'Akkoord: ' + P.detectChord(all) : all.map(noteName).join(' ')) : (all.length ? noteName(all[0]) : ' ');
  }
  function pedalSet(on) {
    pedal = on; const b = $('#pi-pedal'); if (b) b.classList.toggle('on', on);
    if (!on) sustained.splice(0).forEach((s) => s());
  }

  function renderKeys() {
    const kb = $('#pi-kb'); if (!kb) return;
    const L = P.keyLayout(prefs.start, prefs.octs), mode = prefs.label;
    kb.innerHTML = L.keys.map((k) => {
      let lab = '';
      if (mode === 'noten' || mode === 'dore') lab = k.black ? '' : P.labelFor(k.midi, mode) + (k.midi % 12 === 0 ? `<small>${Math.floor(k.midi / 12) - 1}</small>` : '');
      else if (mode === 'toets') lab = P.keyLetterFor(k.midi, prefs.start).toUpperCase();
      else if (k.midi % 12 === 0) lab = noteName(k.midi);
      return `<div class="pi-key ${k.black ? 'pi-b' : 'pi-w'}${lit.has(k.midi) ? ' on' : ''}" data-m="${k.midi}" style="left:${k.x}%;width:${k.w}%"><span class="pi-lab">${lab}</span></div>`;
    }).join('');
    const os = $('#pi-octs'); if (os) os.value = String(prefs.octs);
    const info = $('#pi-octinfo'); if (info) info.textContent = `${noteName(prefs.start)} – ${noteName(prefs.start + prefs.octs * 12)}`;
    showHint();
  }
  function wireKeys() {
    const kb = $('#pi-kb');
    kb.addEventListener('pointerdown', (e) => { const el = e.target.closest && e.target.closest('.pi-key'); if (!el) return; e.preventDefault(); try { kb.setPointerCapture(e.pointerId); } catch { /* stil */ } noteOn('p' + e.pointerId, +el.dataset.m); });
    kb.addEventListener('pointermove', (e) => {
      const d = down.get('p' + e.pointerId); if (!d || e.buttons === 0) return;
      const t = document.elementFromPoint(e.clientX, e.clientY), el = t && t.closest && t.closest('.pi-key');
      if (el && +el.dataset.m !== d.midis[0] && !chordMode) { noteOff('p' + e.pointerId); noteOn('p' + e.pointerId, +el.dataset.m); }
    });
    const up = (e) => noteOff('p' + e.pointerId);
    kb.addEventListener('pointerup', up); kb.addEventListener('pointercancel', up); kb.addEventListener('lostpointercapture', up);
    kb.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  function shiftOct(d) {
    const ns = prefs.start + d * 12; if (ns < P.KEY_MIN || ns + prefs.octs * 12 > P.KEY_MAX) return;
    stopAll(); prefs.start = ns; savePrefs(); renderKeys();
  }

  // ----- toetsenbord van de computer -----
  const typing = (e) => { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT'); };
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || typing(e)) return;
    const k = e.key.toLowerCase();
    if (e.key === ' ' && tab !== 'pads') { e.preventDefault(); if (!spaceDown) { spaceDown = true; pedalSet(true); } return; }
    if (tab === 'pads') { const i = PADKEYS.indexOf(k); if (i >= 0 && !e.repeat) { e.preventDefault(); hitPad(i); } return; }
    if (e.repeat) return;
    if (k === 'z') { shiftOct(-1); return; } if (k === 'x') { shiftOct(1); return; }
    const o = P.KEYMAP[k]; if (o == null) return;
    const m = prefs.start + o; if (m > prefs.start + prefs.octs * 12) return;
    e.preventDefault(); noteOn('k' + k, m);
  }
  function onKeyUp(e) { const k = e.key.toLowerCase(); if (e.key === ' ') { if (spaceDown) { spaceDown = false; pedalSet(false); } return; } if (P.KEYMAP[k] != null) noteOff('k' + k); }
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKeyUp);

  // ----- metronoom -----
  function startMetronome() {
    if (!ensure()) return; metOn = true; metBeat = 0; metNext = ac.currentTime + 0.1;
    metTimer = setInterval(() => { while (metNext < ac.currentTime + 0.15) { click(ac, bus.input, metNext, metBeat % 4 === 0); const b = metBeat; timers.push(setTimeout(() => { const d = $('#pi-beat'); if (d) d.style.background = b % 4 === 0 ? '#f59e0b' : '#6366f1'; timers.push(setTimeout(() => { const d2 = $('#pi-beat'); if (d2) d2.style.background = 'transparent'; }, 90)); }, Math.max(0, (metNext - ac.currentTime) * 1000))); metBeat++; metNext += 60 / prefs.bpm; } }, 25);
  }
  function stopMetronome() { metOn = false; if (metTimer) { clearInterval(metTimer); metTimer = 0; } }

  // ----- opnemen / afspelen -----
  function stopPlayback() { if (playback) { playback.timers.forEach(clearTimeout); try { playback.session.disconnect(); } catch { /* stil */ } playback.lit.forEach((m) => light(m, false)); playback = null; const b = $('#pi-tapestop'); if (b) b.disabled = true; } }
  function playNotes(notes, inst, onEnd) {
    if (!notes.length || !ensure()) return; stopPlayback();
    const session = ac.createGain(); session.connect(bus.input); const t0 = ac.currentTime + 0.12, tm = [], on = new Set();
    notes.forEach(([m, s, d]) => {
      playNote(ac, session, inst, midiFreq(m), t0 + s / 1000, d / 1000, 0.9, nb);
      tm.push(setTimeout(() => { if (!alive) return; light(m, true); on.add(m); }, 120 + s), setTimeout(() => { if (!alive) return; if (on.has(m)) { light(m, false); on.delete(m); } }, 120 + s + d));
    });
    const end = 120 + P.tapeSeconds(notes) * 1000 + 600; tm.push(setTimeout(() => { stopPlayback(); setMsg(''); if (onEnd) onEnd(); }, end));
    playback = { timers: tm, session, lit: on }; const b = $('#pi-tapestop'); if (b) b.disabled = false;
  }
  function toggleRec() {
    if (rec) {
      const notes = P.eventsToNotes(rec.events); rec = null;
      if (notes.length) { tapes.unshift({ name: `Opname ${new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`, inst: prefs.inst, notes }); tapes = tapes.slice(0, P.TAPE_MAX); wr(TKEY, tapes); setMsg(`✔ Opname bewaard (${P.tapeSeconds(notes).toFixed(1)} s).`); } else setMsg('Er is niets opgenomen.');
    } else { stopPlayback(); rec = { t0: performance.now(), events: [] }; setMsg('⏺ Aan het opnemen… speel een melodie!'); }
    renderBottom();
  }

  // ----- leren (stap voor stap) -----
  const clearHints = () => view.querySelectorAll('.pi-key.hint').forEach((e) => e.classList.remove('hint'));
  function showHint() {
    clearHints();
    if (learn && learn.pos < learn.notes.length) { const el = keyEl(learn.notes[learn.pos].midi); if (el) el.classList.add('hint'); }
    if (game && game.running && game.lanes) { /* de baan toont de noot al */ }
  }
  function learnFit(song) {
    const tl = P.songTimeline(song), r = P.songRange(tl), octs = r.hi - r.lo <= 24 ? 2 : 3;
    prefs.octs = Math.max(prefs.octs, octs) > 3 ? 3 : (prefs.octs < octs ? octs : prefs.octs); prefs.start = P.fitStart(r.lo, r.hi, prefs.octs); stopAll(); renderKeys();
  }
  function startLearn(song) {
    stopPlayback(); stopGame(true); learnFit(song);
    learn = { song, notes: P.songTimeline(song), pos: 0 }; showHint(); setMsg(`Speel de oplichtende toets (1/${learn.notes.length})`);
  }
  function learnPress(midi) {
    const want = learn.notes[learn.pos]; if (!want) return;
    if (midi === want.midi) {
      learn.pos++; showHint();
      if (learn.pos >= learn.notes.length) {
        const s = learn.song; learn = null; clearHints(); setMsg(`🎉 Klaar! Je kunt “${s.name}” spelen!`);
        const pr = progress[s.id] || {}; if (!pr.learned) { pr.learned = true; progress[s.id] = pr; wr(PKEY, progress); playScene(view, 'levelup', { title: 'Liedje geleerd!', sub: s.name }); renderTop(); }
      } else setMsg(`Speel de oplichtende toets (${learn.pos + 1}/${learn.notes.length})`);
    }
  }
  function demo(song) { playNotes(P.songTimeline(song).map((n) => [n.midi, Math.round(n.t), Math.round(n.d)]), prefs.inst); learnFit(song); setMsg('👂 Luister goed…'); }

  // ----- spel: vallende noten -----
  const APPROACH = 2300;
  function startGame() {
    if (!ensure()) { setMsg('Geluid werkt niet in deze browser.'); return; }
    stopPlayback(); learn = null; clearHints(); stopGame(true);
    const tl = P.songTimeline(gsong, +prefs.speed), r = P.songRange(tl); prefs.octs = r.hi - r.lo <= 24 ? Math.max(2, prefs.octs === 3 ? 3 : 2) : 3; prefs.start = P.fitStart(r.lo, r.hi, prefs.octs); stopAll(); renderKeys();
    const L = P.keyLayout(prefs.start, prefs.octs);
    game = { running: true, g: P.newGame(tl), t0: performance.now() + 3200, L, parts: new Particles(), pops: [], raf: 0, last: performance.now(), done: false, shake: 0, end: tl.length ? tl[tl.length - 1].t + tl[tl.length - 1].d + 900 : 1000 };
    if (heroCtl) heroCtl.run(false); setMsg(''); renderTop();
    game.raf = requestAnimationFrame(gameFrame);
  }
  function stopGame(silent) { if (game) { cancelAnimationFrame(game.raf); game.running = false; } game = null; if (!silent) renderTop(); }
  function gamePress(midi) {
    const now = performance.now() - game.t0, r = P.press(game.g, midi, now);
    if (!r) { if (now > -300) { game.g.combo = 0; } return; }
    const cv = $('#pi-cv'); if (!cv) return; const k = game.L.keys.find((x) => x.midi === midi), w = cv.clientWidth, x = (k.x + k.w / 2) / 100 * w, h = cv.clientHeight, y = h * 0.82;
    game.pops.push({ x, y, t: 0, text: r.grade === 'perfect' ? 'Perfect!' : r.grade === 'goed' ? 'Goed!' : 'Ok', c: r.grade === 'perfect' ? '#fde047' : r.grade === 'goed' ? '#86efac' : '#93c5fd' });
    game.parts.burst(x, y, { kind: r.grade === 'perfect' ? 'sparkle' : 'stars', n: r.grade === 'perfect' ? 10 : 5, power: 0.8 });
  }
  function gameFrame(ts) {
    if (!game || !game.running || !alive) return; const G = game; G.raf = requestAnimationFrame(gameFrame);
    const dt = Math.min(0.05, (ts - G.last) / 1000 || 0.016); G.last = ts;
    const cv = $('#pi-cv'); if (!cv) return;
    const w = cv.clientWidth || 320, h = cv.clientHeight || 300, d = GFX.dpr || 1;
    if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
    const now = performance.now() - G.t0, hitY = h * 0.84;
    P.sweep(G.g, now);
    try { Themes.paintBackground(c, w, h, heroCtl ? heroCtl.world : Themes.forGame('piano'), now / 1000); } catch { c.fillStyle = '#1e1b4b'; c.fillRect(0, 0, w, h); }
    // banen
    c.save(); c.globalAlpha = 0.18; G.L.keys.filter((k) => !k.black).forEach((k, i) => { c.fillStyle = i % 2 ? '#fff' : '#000'; c.fillRect(k.x / 100 * w, 0, k.w / 100 * w, h); }); c.restore();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(0, hitY, w, 3);
    G.g.notes.forEach((n) => {
      const k = G.L.keys.find((x) => x.midi === n.midi); if (!k) return;
      const yEnd = hitY - (n.t - now) / APPROACH * hitY, hh = Math.max(26, n.d / APPROACH * hitY), y = yEnd - hh;
      if (y > h || yEnd < -10) return;
      const x = k.x / 100 * w + 2, ww = k.w / 100 * w - 4, hue = (n.midi % 12) * 30;
      c.globalAlpha = n.state === 'wacht' ? 1 : n.state === 'mis' ? 0.25 : Math.max(0, 1 - (now - n.t) / 400);
      if (c.globalAlpha <= 0) { c.globalAlpha = 1; return; }
      c.fillStyle = n.state === 'mis' ? '#64748b' : `hsl(${hue} 85% ${k.black ? 45 : 60}%)`;
      c.beginPath(); c.moveTo(x + 8, y); c.lineTo(x + ww - 8, y); c.quadraticCurveTo(x + ww, y, x + ww, y + 8); c.lineTo(x + ww, yEnd - 8); c.quadraticCurveTo(x + ww, yEnd, x + ww - 8, yEnd); c.lineTo(x + 8, yEnd); c.quadraticCurveTo(x, yEnd, x, yEnd - 8); c.lineTo(x, y + 8); c.quadraticCurveTo(x, y, x + 8, y); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x + 4, y + 3, ww - 8, 4);
      c.globalAlpha = 1;
    });
    G.parts.update(dt); G.parts.draw(c);
    G.pops.forEach((p) => { p.t += dt; c.globalAlpha = Math.max(0, 1 - p.t / 0.8); c.fillStyle = p.c; c.font = `800 ${Math.round(18 * (1 + 0.3 * (1 - p.t)))}px system-ui`; c.textAlign = 'center'; c.fillText(p.text, p.x, p.y - p.t * 60); c.globalAlpha = 1; }); G.pops = G.pops.filter((p) => p.t < 0.8);
    // scorebord
    c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, w, 34); c.fillStyle = '#fff'; c.font = '800 16px system-ui'; c.textAlign = 'left'; c.fillText(`Score ${G.g.score}`, 10, 23);
    c.textAlign = 'right'; const mult = 1 + Math.min(3, Math.floor(G.g.combo / 8)); c.fillText(`Combo ${G.g.combo}${mult > 1 ? ' ×' + mult : ''}`, w - 10, 23);
    if (now < 0) { c.textAlign = 'center'; c.font = '900 64px system-ui'; c.fillStyle = '#fff'; c.fillText(String(Math.ceil(-now / 1000)), w / 2, h * 0.45); }
    if (now > G.end || (P.gameDone(G.g) && now > 400 && now > G.end - 900)) finishGame();
  }
  function finishGame() {
    const G = game; if (!G || G.done) return; G.done = true; cancelAnimationFrame(G.raf); G.running = false;
    const res = P.gameResult(G.g), pr = progress[gsong.id] || {}, newBest = res.score > (pr.best || 0);
    if (newBest) pr.best = res.score; pr.stars = Math.max(pr.stars || 0, res.stars); progress[gsong.id] = pr; wr(PKEY, progress);
    G.res = res; renderTop();
    if (res.stars === 3) playScene(view, 'victory', { title: 'Geweldig gespeeld!', sub: gsong.name });
    else if (newBest && res.score > 0) playScene(view, 'new-record', { title: 'Nieuw record!', sub: `${res.score} punten` });
  }

  // ----- pads -----
  function hitPad(i) {
    const d = DRUMKIT[i]; if (!d || !ensure()) return;
    playDrum(ac, bus.input, nb, d.id, ac.currentTime + 0.002, 1);
    const el = view.querySelector(`.pi-pad[data-i="${i}"]`); if (el) { el.classList.add('hit'); timers.push(setTimeout(() => el.classList.remove('hit'), 110)); }
    if (heroCtl && !GFX.reduce) heroCtl.burst(40 + (i % 4) * 80, 90, { kind: 'stars', n: 3, power: 0.5 });
  }

  // ----- opbouw -----
  function build() {
    view.innerHTML = `${styleTag()}${CSS}<div class="ap" id="pi"><div id="pi-hero"></div>
      <div class="tabs2" id="pi-tabs">${[['play', '🎹 Spelen'], ['learn', '📖 Leren'], ['game', '🎮 Spel'], ['pads', '🥁 Slagwerk']].map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div id="pi-top"></div>
      <div class="card" id="pi-kbbox"><div class="pi-row" style="margin-top:0"><button id="pi-octd" aria-label="Lager">◀</button><b id="pi-octinfo" style="min-width:6.5rem;text-align:center"></b><button id="pi-octu" aria-label="Hoger">▶</button>
        <span style="flex:1"></span><button id="pi-pedal" title="Pedaal (spatiebalk)">🦶 Pedaal</button><select id="pi-octs" aria-label="Aantal octaven">${[1, 2, 3].map((n) => `<option value="${n}"${n === prefs.octs ? ' selected' : ''}>${n} oct.</option>`).join('')}</select></div>
        <div class="pi-kb" id="pi-kb"></div><div class="pi-chord" id="pi-chordname" style="text-align:center">&nbsp;</div></div>
      <div id="pi-bottom"></div><div class="msg" id="pi-msg"></div></div>`;
    heroCtl = hero($('#pi-hero'), { gameId: 'piano', height: 110, title: `${icon('piano', { size: 30 })} Piano`, rightHtml: `${worldSelectHtml('piano')}${gearHtml()}` });
    $('#ap-world').onchange = (e) => heroCtl.setWorld(e.target.value);
    wireGear(view, setMsg); wireKeys();
    $('#pi-octd').onclick = () => shiftOct(-1); $('#pi-octu').onclick = () => shiftOct(1);
    $('#pi-pedal').onclick = () => pedalSet(!pedal);
    $('#pi-octs').onchange = (e) => { const n = +e.target.value; stopAll(); prefs.octs = n; prefs.start = Math.min(prefs.start, P.KEY_MAX - n * 12); savePrefs(); renderKeys(); };
    $('#pi-tabs').onclick = (e) => { const b = e.target.closest('[data-tab]'); if (!b) return; setTab(b.dataset.tab); };
    wireDelegates(); renderKeys(); setTab(tab);
  }
  function setTab(t) {
    tab = t; if (t !== 'game') stopGame(true); if (t !== 'learn') { learn = null; clearHints(); } stopPlayback(); setMsg('');
    $('#pi-tabs').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x.dataset.tab === t));
    $('#pi-kbbox').style.display = t === 'pads' ? 'none' : '';
    renderTop(); renderBottom();
  }
  const diffStars = (s) => '●'.repeat(s.level) + '○'.repeat(3 - s.level);
  function renderTop() {
    const el = $('#pi-top'); if (!el) return;
    if (tab === 'learn') {
      el.innerHTML = `<div class="card"><b>${icon('book', { size: 26 })} Kies een liedje</b> <small class="mute">${P.SONGS.length} liedjes · ●=makkelijk ●●●=lastig</small>
        <div style="margin:.4rem 0"><button data-song="${P.SONGS[dailyIndex(P.SONGS.length)].id}" style="min-height:44px">${icon('star', { size: 24 })} Liedje van de dag: ${esc(P.SONGS[dailyIndex(P.SONGS.length)].name)}</button></div>
        <div class="pi-songs" style="margin-top:.5rem">${P.SONGS.map((s) => { const pr = progress[s.id] || {}; return `<button data-song="${s.id}" class="${learnSong && learnSong.id === s.id ? 'on' : ''}">${icon(s.icon, { size: 30 })}<span>${esc(s.name)}</span><small class="mute">${diffStars(s)}${pr.learned ? ' ✓ geleerd' : ''}</small></button>`; }).join('')}</div>
        ${learnSong ? `<div class="pi-row" style="margin-top:.6rem"><b style="flex:1">${esc(learnSong.name)}</b><button data-act="demo">👂 Laat horen</button><button data-act="learn" class="on">🐢 Stap voor stap</button><button data-act="togame">🎮 Als spel</button><button data-act="stoplearn">⏹</button></div>` : '<small class="mute">Tik op een liedje.</small>'}</div>`;
    } else if (tab === 'game') {
      const res = game && game.res;
      el.innerHTML = `<div class="card"><div class="pi-row" style="margin-top:0"><select id="pi-gsong" aria-label="Liedje" style="flex:1">${P.SONGS.map((s) => `<option value="${s.id}"${s.id === gsong.id ? ' selected' : ''}>${esc(s.name)} ${diffStars(s)}${progress[s.id] && progress[s.id].stars ? ' ' + '★'.repeat(progress[s.id].stars) : ''}</option>`).join('')}</select>
        <select id="pi-gspeed" aria-label="Snelheid">${[[0.7, '🐢 Langzaam'], [1, '🚶 Normaal'], [1.3, '🐇 Snel']].map(([v, l]) => `<option value="${v}"${+prefs.speed === v ? ' selected' : ''}>${l}</option>`).join('')}</select>
        ${game && game.running ? '<button data-act="gstop">⏹ Stop</button>' : '<button data-act="gstart" class="on">▶ Start</button>'}</div>
        <canvas id="pi-cv" class="pi-cv" style="height:${Math.round(300 * (GFX.q ? 1 : 0.9))}px"></canvas>
        ${res ? `<div style="text-align:center;margin-top:.5rem"><div class="stars" style="font-size:2rem">${starsStr(res.stars)}</div><b>${res.accuracy}% goed · ${res.score} punten · beste combo ${res.bestCombo}</b><br><small class="mute">Perfect ${res.counts.perfect} · Goed ${res.counts.goed} · Ok ${res.counts.ok} · Gemist ${res.counts.mis}</small></div>` : '<small class="mute">Speel de blokjes precies als ze de lijn raken. Gebruik de toetsen hieronder (of je toetsenbord).</small>'}</div>`;
      if (game) { const cv = $('#pi-cv'); if (cv) { cv.width = cv.clientWidth; } }
    } else if (tab === 'pads') {
      el.innerHTML = `<div class="card"><b>${icon('drum', { size: 26 })} Slagwerk-pads</b> <small class="mute">Tik of gebruik de toetsen Q W E R / A S D F / Z X C V</small>
        <div class="pi-pads" style="margin-top:.5rem">${DRUMKIT.map((d, i) => `<button class="pi-pad" data-i="${i}" style="background:${d.color}">${esc(d.name)}<small>${PADKEYS[i].toUpperCase()}</small></button>`).join('')}</div>
        <div class="pi-row"><button id="pi-met2" class="${metOn ? 'on' : ''}" data-act="met">⏱ Metronoom</button><input type="range" id="pi-bpm2" min="50" max="200" value="${prefs.bpm}" aria-label="Tempo"><b id="pi-bpmv2">${prefs.bpm}</b><i id="pi-beat" style="width:22px;height:22px;border-radius:50%;border:2px solid var(--accent);display:inline-block"></i></div>
        <small class="mute">Wil je een hele beat maken? Probeer de Muziekmaker!</small></div>`;
    } else el.innerHTML = '';
  }
  function renderBottom() {
    const el = $('#pi-bottom'); if (!el) return;
    if (tab !== 'play') { el.innerHTML = tab === 'learn' || tab === 'game' ? instrumentSelect() : ''; return; }
    const keyOpts = NOTE_NAMES.map((n, i) => `<option value="${i}">${n}</option>`).join('');
    el.innerHTML = `<div class="card"><b>Kies een klank</b><div class="pi-ins" style="margin-top:.4rem">${INSTRUMENTS.map((i) => `<button data-inst="${i.id}" class="${i.id === prefs.inst ? 'on' : ''}">${icon(i.icon, { size: 30 })}<span>${esc(i.name)}</span></button>`).join('')}</div></div>
      <div class="card"><div class="pi-row" style="margin-top:0"><span>🔈 Volume</span><input type="range" data-p="vol" min="0" max="100" value="${Math.round(prefs.vol * 100)}"></div>
        <div class="pi-row"><span>🌊 Galm</span><input type="range" data-p="rev" min="0" max="100" value="${Math.round(prefs.rev * 100)}"></div>
        <div class="pi-row"><span>🔁 Echo</span><input type="range" data-p="echo" min="0" max="100" value="${Math.round(prefs.echo * 100)}"></div>
        <div class="pi-row"><span>🎚 Filter</span><input type="range" data-p="filter" min="0" max="100" value="${Math.round(prefs.filter * 100)}"></div>
        <div class="pi-row"><span>Letters op de toetsen</span><select id="pi-label"><option value="noten"${prefs.label === 'noten' ? ' selected' : ''}>Notennamen (C D E)</option><option value="dore"${prefs.label === 'dore' ? ' selected' : ''}>Do Re Mi</option><option value="toets"${prefs.label === 'toets' ? ' selected' : ''}>Toetsenbordletters</option><option value="geen"${prefs.label === 'geen' ? ' selected' : ''}>Alleen de C</option></select></div>
        <small class="mute">Tip: met je computertoetsenbord speel je ook (A W S E D F …). Z/X = octaaf lager/hoger, spatiebalk = pedaal.</small></div>
      <div class="card"><div class="pi-row" style="margin-top:0"><b style="flex:1">${icon('wand', { size: 26 })} Akkoorden</b><button data-act="chordmode" class="${chordMode ? 'on' : ''}">${chordMode ? 'Akkoord-modus: aan' : 'Akkoord-modus: uit'}</button>
          <select id="pi-ctype" aria-label="Soort akkoord">${P.CHORD_TYPES.map((t) => `<option value="${t.id}"${t.id === prefs.chordType ? ' selected' : ''}>${t.name}</option>`).join('')}</select></div>
        <small class="mute">Akkoord-modus: één toets speelt een heel akkoord. Of hou meerdere toetsen tegelijk in en zie hierboven hoe het akkoord heet.</small>
        <div class="pi-row"><span>Akkoordenkaart in</span><select id="pi-ckey">${keyOpts}</select></div><div class="pi-row" id="pi-cmap"></div></div>
      <div class="card"><div class="pi-row" style="margin-top:0"><button data-act="met" id="pi-met" class="${metOn ? 'on' : ''}">⏱ Metronoom</button><input type="range" id="pi-bpm" min="50" max="200" value="${prefs.bpm}" aria-label="Tempo"><b id="pi-bpmv">${prefs.bpm}</b><i id="pi-beat" style="width:22px;height:22px;border-radius:50%;border:2px solid var(--accent);display:inline-block"></i></div></div>
      <div class="card"><div class="pi-row" style="margin-top:0"><b style="flex:1">${icon('microphone', { size: 26 })} Opnemen</b><button data-act="rec" class="${rec ? 'on' : ''}" style="min-width:8rem">${rec ? '⏹ Stop' : '⏺ Opnemen'}</button><button data-act="tapestop" id="pi-tapestop" ${playback ? '' : 'disabled'}>⏹</button></div>
        ${tapes.length ? tapes.map((t, i) => `<div class="pi-tape"><button data-act="tplay" data-i="${i}" aria-label="Afspelen">▶</button><span style="flex:1;min-width:0"><b>${esc(t.name)}</b><br><small class="mute">${P.tapeSeconds(t.notes).toFixed(1)} s · ${esc((INSTRUMENTS.find((x) => x.id === t.inst) || INSTRUMENTS[0]).name)}</small></span><button data-act="tshare" data-i="${i}" title="Maak code">🔗</button><button data-act="tdel" data-i="${i}" aria-label="Verwijderen">🗑</button></div>`).join('') : '<small class="mute">Nog geen opnames. Druk op Opnemen en speel!</small>'}
        <div class="pi-row"><textarea id="pi-code" rows="2" placeholder="Code van een opname (delen met vrienden)" spellcheck="false" style="flex:1">${esc(code)}</textarea></div>
        <div class="pi-row"><button data-act="tcopy">📋 Kopieer</button><button data-act="tload">📥 Laad code</button></div></div>`;
    renderChordMap();
  }
  function instrumentSelect() { return `<div class="card"><div class="pi-row" style="margin:0"><span>Klank</span><select id="pi-inst2" style="flex:1">${INSTRUMENTS.map((i) => `<option value="${i.id}"${i.id === prefs.inst ? ' selected' : ''}>${esc(i.name)}</option>`).join('')}</select></div></div>`; }
  function renderChordMap() {
    const el = $('#pi-cmap'), ks = $('#pi-ckey'); if (!el || !ks) return; ks.value = String(prefs.ckey || 0);
    el.innerHTML = P.keyChords(+ks.value).map((c, i) => `<button data-chord="${i}" style="flex:1;min-width:calc(56px*var(--s));flex-direction:column"><b>${esc(c.name)}</b><small class="mute">${c.roman}</small></button>`).join('');
  }
  function playChord(notes) {
    if (!ensure()) return; const id = 'c' + Math.random(), midis = notes.map((m) => m + 12);
    const stops = midis.map((m) => startNote(ac, bus.input, prefs.inst, midiFreq(m), 0.7, nb)); midis.forEach((m) => light(m, true));
    down.set(id, { midis, stops }); updateChordName();
    timers.push(setTimeout(() => { if (down.has(id)) noteOff(id); }, 900));
  }

  function wireDelegates() {
    view.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('button'); if (!b || b.disabled || !view.contains(b)) return;
      if (b.dataset.inst) { prefs.inst = b.dataset.inst; savePrefs(); renderBottom(); if (ensure()) { const s = startNote(ac, bus.input, prefs.inst, midiFreq(60), 0.9, nb); timers.push(setTimeout(s, 450)); } return; }
      if (b.dataset.song) { learnSong = P.SONG_BY_ID[b.dataset.song]; gsong = learnSong; renderTop(); return; }
      if (b.dataset.chord != null) { const c = P.keyChords(+$('#pi-ckey').value)[+b.dataset.chord]; playChord(c.notes); return; }
      const a = b.dataset.act; if (!a) return;
      switch (a) {
        case 'demo': demo(learnSong); break;
        case 'learn': startLearn(learnSong); break;
        case 'stoplearn': learn = null; clearHints(); stopPlayback(); setMsg(''); break;
        case 'togame': gsong = learnSong; setTab('game'); break;
        case 'gstart': startGame(); break;
        case 'gstop': stopGame(false); break;
        case 'met': if (metOn) stopMetronome(); else startMetronome(); view.querySelectorAll('[data-act=met]').forEach((x) => x.classList.toggle('on', metOn)); break;
        case 'chordmode': chordMode = !chordMode; renderBottom(); break;
        case 'rec': toggleRec(); break;
        case 'tapestop': stopPlayback(); break;
        case 'tplay': { const t = tapes[+b.dataset.i]; if (t) playNotes(t.notes, t.inst); break; }
        case 'tdel': tapes.splice(+b.dataset.i, 1); wr(TKEY, tapes); renderBottom(); break;
        case 'tshare': { const t = tapes[+b.dataset.i]; if (t) { code = P.tapeToCode(t); renderBottom(); setMsg('Code gemaakt! Kopieer hem en stuur hem door.'); } break; }
        case 'tcopy': { const v = ($('#pi-code') || {}).value || code; if (!v) { setMsg('Maak eerst een code met 🔗.'); break; } copyText(v).then((ok) => setMsg(ok ? '✔ Gekopieerd!' : 'Kopiëren lukt niet: selecteer de tekst zelf.')); break; }
        case 'tload': { const t = P.codeToTape(($('#pi-code') || {}).value); if (!t) { setMsg('Deze code klopt niet. Plak de hele code.'); break; } tapes.unshift({ name: t.name || 'Opname van een vriend', inst: INSTRUMENTS.some((i) => i.id === t.inst) ? t.inst : 'piano', notes: t.notes }); tapes = tapes.slice(0, P.TAPE_MAX); wr(TKEY, tapes); code = ''; renderBottom(); setMsg('✔ Opname geladen!'); break; }
        default: break;
      }
    });
    view.addEventListener('pointerdown', (e) => { const p = e.target.closest && e.target.closest('.pi-pad'); if (p) { e.preventDefault(); hitPad(+p.dataset.i); } });
    view.addEventListener('input', (e) => {
      const t = e.target;
      if (t.dataset.p) { prefs[t.dataset.p] = +t.value / 100; fx(); savePrefs(); }
      else if (t.id === 'pi-bpm' || t.id === 'pi-bpm2') { prefs.bpm = +t.value; const v = $('#pi-bpmv') || $('#pi-bpmv2'); if (v) v.textContent = prefs.bpm; fx(); }
      else if (t.id === 'pi-code') code = t.value;
    });
    view.addEventListener('change', (e) => {
      const t = e.target;
      if (t.id === 'pi-label') { prefs.label = t.value; savePrefs(); renderKeys(); }
      else if (t.id === 'pi-ctype') { prefs.chordType = t.value; savePrefs(); }
      else if (t.id === 'pi-ckey') { prefs.ckey = +t.value; renderChordMap(); }
      else if (t.id === 'pi-inst2') { prefs.inst = t.value; savePrefs(); }
      else if (t.id === 'pi-gsong') { gsong = P.SONG_BY_ID[t.value]; stopGame(true); renderTop(); }
      else if (t.id === 'pi-gspeed') { prefs.speed = +t.value; savePrefs(); }
    });
  }

  build();
}
