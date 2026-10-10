// Piano: 2 octaven, 4 klanken, opnemen en afspelen, en liedjes leren met oplichtende toetsen. Geluid wordt in de browser gemaakt.

const NOTES = [];   // C4 t/m B5
['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].forEach((n, i) => NOTES.push({ name: n + '4', midi: 60 + i, black: n.includes('#') }));
['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].forEach((n, i) => NOTES.push({ name: n + '5', midi: 72 + i, black: n.includes('#') }));
const KEYMAP = { a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72, o: 73, l: 74, p: 75, ';': 76, "'": 77 };
const SOUNDS = [['piano', '🎹 Piano'], ['orgel', '⛪ Orgel'], ['synth', '🎛 Synth'], ['bel', '🔔 Bel']];
const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);
const nm = (m) => NOTES.find((x) => x.midi === m)?.name || '';
// Liedjes als [midi, lengte in tel]; tel = 1 is een kwart noot
const SONGS = {
  'Altijd is Kortjakje ziek': [[64, 1], [62, 1], [60, 1], [62, 1], [64, 1], [64, 1], [64, 2], [62, 1], [62, 1], [62, 2], [64, 1], [67, 1], [67, 2], [64, 1], [62, 1], [60, 1], [62, 1], [64, 1], [64, 1], [64, 1], [64, 1], [62, 1], [62, 1], [64, 1], [62, 1], [60, 3]],
  'Vader Jacob': [[60, 1], [62, 1], [64, 1], [60, 1], [60, 1], [62, 1], [64, 1], [60, 1], [64, 1], [65, 1], [67, 2], [64, 1], [65, 1], [67, 2], [67, 1], [69, 1], [67, 1], [65, 1], [64, 1], [60, 1], [67, 1], [69, 1], [67, 1], [65, 1], [64, 1], [60, 1], [60, 1], [55 + 5, 1], [60, 2]],
  'Slaap kindje slaap': [[64, 2], [62, 1], [60, 1], [62, 2], [64, 2], [67, 2], [64, 1], [62, 1], [60, 3]],
  'Ode aan de vreugde': [[64, 1], [64, 1], [65, 1], [67, 1], [67, 1], [65, 1], [64, 1], [62, 1], [60, 1], [60, 1], [62, 1], [64, 1], [64, 1.5], [62, 0.5], [62, 2]],
};

// ctx: { view, esc, addCleanup }
export function pianoView(ctx) {
  const { view, esc, addCleanup } = ctx;
  let ac = null, master = null, sound = 'piano', volume = 0.7, rec = null, tape = [], playing = null, learn = null, learnPos = 0, alive = true;
  const down = new Map();   // pointerId -> {midi, stop}
  addCleanup(() => { alive = false; stopAll(); try { ac && ac.close(); } catch {} window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); stopPlayback(); });

  const ensure = () => {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = volume; master.connect(ac.destination); } catch { return false; } }
    if (ac.state === 'suspended') ac.resume().catch(() => {}); return true;
  };
  // Start een noot, geeft een functie terug die hem laat uitklinken.
  function start(midi) {
    if (!ensure()) return () => {};
    const t = ac.currentTime, f = freq(midi), g = ac.createGain(); g.connect(master); const oscs = [];
    const osc = (type, mult, vol, det = 0) => { const o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.value = f * mult; o.detune.value = det; og.gain.value = vol; o.connect(og); og.connect(g); o.start(t); oscs.push(o); };
    let attack = 0.01, decay = 1.2, sustain = 0.3, release = 0.35;
    if (sound === 'piano') { osc('triangle', 1, 0.55); osc('sine', 2, 0.25); osc('sine', 3, 0.1); decay = 1.5; sustain = 0.08; release = 0.4; }
    else if (sound === 'orgel') { osc('sine', 1, 0.4); osc('sine', 2, 0.3); osc('sine', 4, 0.15); osc('square', 0.5, 0.05); attack = 0.03; decay = 0.1; sustain = 0.8; release = 0.15; }
    else if (sound === 'synth') { osc('sawtooth', 1, 0.25, -6); osc('sawtooth', 1, 0.25, 6); osc('square', 0.5, 0.15); attack = 0.02; decay = 0.4; sustain = 0.5; release = 0.3; }
    else { osc('sine', 1, 0.5); osc('sine', 2.76, 0.2); osc('sine', 5.4, 0.1); attack = 0.002; decay = 1.8; sustain = 0.02; release = 0.5; }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + attack); g.gain.exponentialRampToValueAtTime(Math.max(0.001, sustain), t + attack + decay);
    return () => { const n = ac.currentTime; try { g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(Math.max(0.001, g.gain.value), n); g.gain.exponentialRampToValueAtTime(0.0001, n + release); oscs.forEach((o) => o.stop(n + release + 0.05)); } catch {} };
  }
  function stopAll() { down.forEach((d) => d.stop()); down.clear(); }

  const keyEl = (midi) => view.querySelector(`[data-m="${midi}"]`);
  const light = (midi, on) => { const el = keyEl(midi); if (el) el.classList.toggle('on', on); };
  function noteOn(id, midi) {
    if (down.has(id)) return; const stop = start(midi); down.set(id, { midi, stop, t0: performance.now() }); light(midi, true);
    if (rec) rec.push({ midi, on: true, t: performance.now() - rec.t0 });
    if (learn) checkLearn(midi);
  }
  function noteOff(id) { const d = down.get(id); if (!d) return; d.stop(); down.delete(id); light(d.midi, false); if (rec) rec.push({ midi: d.midi, on: false, t: performance.now() - rec.t0 }); }
  function checkLearn(midi) { const want = learn[learnPos]; if (!want) return; if (midi === want[0]) { learnPos++; showHint(); if (learnPos >= learn.length) { learn = null; setMsg('🎉 Klaar! Goed gedaan!'); clearHints(); } } }
  const clearHints = () => view.querySelectorAll('.hint').forEach((e) => e.classList.remove('hint'));
  function showHint() { clearHints(); if (learn && learn[learnPos]) { const el = keyEl(learn[learnPos][0]); if (el) el.classList.add('hint'); setMsg(`Speel de oplichtende toets (${learnPos + 1}/${learn.length})`); } }
  const setMsg = (t) => { const el = view.querySelector('#pi-msg'); if (el) el.textContent = t; };

  function onKey(e) { if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return; const m = KEYMAP[e.key.toLowerCase()]; if (m) { e.preventDefault(); noteOn('k' + m, m); } }
  function onKeyUp(e) { const m = KEYMAP[e.key.toLowerCase()]; if (m) noteOff('k' + m); }
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKeyUp);

  function playTape(events) {
    if (!events.length) return; stopPlayback(); setMsg('▶ Afspelen…'); const ids = new Map(); const timers = [];
    events.forEach((ev) => timers.push(setTimeout(() => { if (!alive) return; if (ev.on) { const stop = start(ev.midi); ids.set(ev.midi, stop); light(ev.midi, true); } else { const s = ids.get(ev.midi); if (s) { s(); ids.delete(ev.midi); } light(ev.midi, false); } }, ev.t)));
    const end = events[events.length - 1].t + 600; timers.push(setTimeout(() => { setMsg(''); ids.forEach((s) => s()); }, end));
    playing = { clear: () => { timers.forEach(clearTimeout); ids.forEach((s) => s()); ids.clear(); NOTES.forEach((n) => light(n.midi, false)); } };
  }
  const stopPlayback = () => { if (playing && playing.clear) playing.clear(); playing = null; };
  const songTape = (song, bpm = 110) => { const beat = 60000 / bpm; let t = 0; const ev = []; song.forEach(([m, len]) => { ev.push({ midi: m, on: true, t: t * beat }); ev.push({ midi: m, on: false, t: (t + len * 0.9) * beat }); t += len; }); return ev; };

  function draw() {
    const whites = NOTES.filter((n) => !n.black); const W = 100 / whites.length;
    const style = `<style>.pi-key{position:absolute;top:0;border:1px solid #0004;border-radius:0 0 8px 8px;touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer}
      .pi-w{background:linear-gradient(#fff,#eee);height:100%;z-index:1}.pi-b{background:linear-gradient(#333,#000);height:62%;z-index:2}
      .pi-w.on{background:#a5b4fc}.pi-b.on{background:#6366f1}.pi-key.hint{box-shadow:inset 0 0 0 4px #f59e0b,0 0 12px #f59e0b}
      .pi-lab{position:absolute;bottom:4px;left:0;right:0;text-align:center;font-size:.6rem;color:#555;pointer-events:none}</style>`;
    let keys = ''; let wi = 0;
    NOTES.forEach((n) => {
      if (!n.black) { keys += `<div class="pi-key pi-w" data-m="${n.midi}" style="left:${wi * W}%;width:${W}%"><span class="pi-lab">${n.name.startsWith('C') ? n.name : ''}</span></div>`; wi++; }
      else keys += `<div class="pi-key pi-b" data-m="${n.midi}" style="left:${wi * W - W * 0.3}%;width:${W * 0.6}%"></div>`;
    });
    view.innerHTML = `${style}
      <div class="box" style="padding:.6rem">
        <div class="row wrap" style="margin:0 0 .5rem">${SOUNDS.map(([k, l]) => `<button data-snd="${k}" class="${k === sound ? 'pri' : ''}">${l}</button>`).join('')}</div>
        <div id="pi-kb" style="position:relative;height:220px;background:#111;border-radius:10px;overflow:hidden;padding-top:0">${keys}</div>
        <div class="row" style="margin-top:.5rem"><small>🔈</small><input type="range" id="pi-vol" min="0" max="1" step="0.05" value="${volume}" style="flex:1"><small>${'Typ ook op je toetsenbord: A W S E D F T G Y H U J K'}</small></div>
        <div class="row wrap"><button id="pi-rec" class="${rec ? 'pri' : ''}">${rec ? '⏹ Stop' : '⏺ Opnemen'}</button><button id="pi-play" ${tape.length ? '' : 'disabled'}>▶ Afspelen</button><button id="pi-clr" ${tape.length ? '' : 'disabled'}>🗑 Wis opname</button></div>
        <div id="pi-msg" style="min-height:1.4rem"><small></small></div>
      </div>
      <div class="box"><b>Leer een liedje</b><div class="row wrap">${Object.keys(SONGS).map((s) => `<button data-song="${esc(s)}">${esc(s)}</button>`).join('')}</div>
        <div class="row wrap"><button id="pi-demo">▶ Laat horen</button><button id="pi-stoplearn">Stop met leren</button></div>
        <small>Kies een liedje: de volgende toets licht oranje op. Speel hem om verder te gaan.</small></div>`;
    const kb = view.querySelector('#pi-kb');
    kb.querySelectorAll('.pi-key').forEach((el) => {
      const midi = +el.dataset.m;
      el.onpointerdown = (e) => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch {} noteOn('p' + e.pointerId, midi); };
      el.onpointerup = el.onpointercancel = (e) => noteOff('p' + e.pointerId);
      el.onlostpointercapture = (e) => noteOff('p' + e.pointerId);
      el.oncontextmenu = (e) => e.preventDefault();
    });
    // vegen over de toetsen (glissando)
    kb.onpointermove = (e) => { const d = down.get('p' + e.pointerId); if (!d || e.buttons === 0) return; const t = document.elementFromPoint(e.clientX, e.clientY); const el = t && t.closest && t.closest('.pi-key'); if (el && +el.dataset.m !== d.midi) { noteOff('p' + e.pointerId); noteOn('p' + e.pointerId, +el.dataset.m); } };
    view.querySelectorAll('[data-snd]').forEach((b) => b.onclick = () => { sound = b.dataset.snd; view.querySelectorAll('[data-snd]').forEach((x) => x.classList.toggle('pri', x === b)); });
    view.querySelector('#pi-vol').oninput = (e) => { volume = +e.target.value; if (master) master.gain.value = volume; };
    view.querySelector('#pi-rec').onclick = () => { if (rec) { tape = rec.filter((x) => x.midi); rec = null; } else { stopPlayback(); rec = []; rec.t0 = performance.now(); tape = []; } draw(); if (rec) setMsg('⏺ Aan het opnemen… speel een melodie.'); };
    view.querySelector('#pi-play').onclick = () => playTape(tape);
    view.querySelector('#pi-clr').onclick = () => { tape = []; stopPlayback(); draw(); };
    view.querySelectorAll('[data-song]').forEach((b) => b.onclick = () => { stopPlayback(); learn = SONGS[b.dataset.song]; learnPos = 0; showHint(); });
    view.querySelector('#pi-demo').onclick = () => { const name = [...view.querySelectorAll('[data-song]')].length && (learn ? Object.keys(SONGS).find((k) => SONGS[k] === learn) : Object.keys(SONGS)[0]); playTape(songTape(SONGS[name])); };
    view.querySelector('#pi-stoplearn').onclick = () => { learn = null; clearHints(); setMsg(''); stopPlayback(); };
  }
  draw();
}
