// Beatmaker: 16-staps sequencer met 6 percussierijen en 8 melodierijen. Alle geluid wordt in de browser gesynthetiseerd (WebAudio).
// Scheduler: "two clocks" (setInterval kijkt vooruit en plant noten op audioContext.currentTime), dus geen drift.
// Export: rendert 2 maten via OfflineAudioContext en maakt er een 16-bit WAV-bestand van.

const STEPS = 16;
const DRUMS = [
  { id: 'kick', lab: 'Kick', name: 'Kick', color: '#ef4444' },
  { id: 'snare', lab: 'Snare', name: 'Snare', color: '#f97316' },
  { id: 'hat', lab: 'HH', name: 'Hi-hat dicht', color: '#eab308' },
  { id: 'open', lab: 'HH+', name: 'Hi-hat open', color: '#84cc16' },
  { id: 'clap', lab: 'Clap', name: 'Clap', color: '#ec4899' },
  { id: 'tom', lab: 'Tom', name: 'Tom', color: '#a855f7' },
];
const MEL_ROWS = 8;
const MEL_COLORS = Array.from({ length: MEL_ROWS }, (_, i) => `hsl(${200 + i * 20} 75% ${55 - i}%)`); // blauw -> roze, rij 0 = hoogste
const SCALES = {
  pentatonisch: { label: 'Pentatonisch', semis: [0, 2, 4, 7, 9] },
  majeur: { label: 'Majeur', semis: [0, 2, 4, 5, 7, 9, 11] },
  mineur: { label: 'Mineur', semis: [0, 2, 3, 5, 7, 8, 10] },
  blues: { label: 'Blues', semis: [0, 3, 5, 6, 7, 10] },
};
const SOUNDS = [['synth', '🎛 Synth'], ['bas', '🎸 Bas'], ['bel', '🔔 Bel'], ['orgel', '⛪ Orgel']];
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SLOT_COUNT = 6;
const ROOT = 60; // C4

// midi-noot voor melodierij r (0 = bovenste = hoogste) in een toonladder
export function rowMidi(r, scaleKey, sound) {
  const semis = (SCALES[scaleKey] || SCALES.pentatonisch).semis;
  const deg = (MEL_ROWS - 1) - r; // 0 = laagste
  const oct = Math.floor(deg / semis.length);
  let m = ROOT + semis[deg % semis.length] + 12 * oct;
  if (sound === 'bas') m -= 24;
  return m;
}
const midiFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
const midiName = (m) => NOTE_NAMES[((m % 12) + 12) % 12];

// ---------- presets ----------
const P = (s) => Array.from({ length: STEPS }, (_, i) => s[i] === 'x');
const mk = (drums, mel) => ({ drums: DRUMS.map((_, i) => P(drums[i] || '')), mel: Array.from({ length: MEL_ROWS }, (_, i) => P((mel && mel[i]) || '')) });
const PRESETS = {
  hiphop: { label: '🎤 Hiphop', bpm: 88, swing: 35, scale: 'mineur', sound: 'bas',
    pat: mk(['x..x..x...x..x..', '....x.......x...', 'x.x.x.x.x.x.x.x.', '......x.......x.', '', ''],
      ['', '', '', '', '', 'x.......x.......', '..x.......x.....', 'x..x..x...x..x..']) },
  house: { label: '🏠 House', bpm: 124, swing: 10, scale: 'mineur', sound: 'synth',
    pat: mk(['x...x...x...x...', '', '', '..x...x...x...x.', '....x.......x...', ''],
      ['', '', '', 'x..x..x...x..x..', '', '..x.......x.....', '', '']) },
  rock: { label: '🎸 Rock', bpm: 112, swing: 0, scale: 'pentatonisch', sound: 'orgel',
    pat: mk(['x.....x.x.x.....', '....x.......x...', 'x.x.x.x.x.x.x.x.', '', '', '..............x.'],
      ['', '', '', '', 'x.......x.......', '', 'x...x...x...x...', '']) },
  chill: { label: '🌙 Chill', bpm: 74, swing: 25, scale: 'majeur', sound: 'bel',
    pat: mk(['x.......x.x.....', '............x...', 'x.x.x.x.x.x.x.x.', '', '', ''],
      ['', 'x...............', '......x.........', '', '........x.......', '', '', 'x.......x.......']) },
};

// ---------- geluid (werkt zowel op AudioContext als OfflineAudioContext) ----------
export function makeNoise(c) {
  const len = Math.floor(c.sampleRate * 1);
  const b = c.createBuffer(1, len, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

// master-keten: gain -> compressor -> uitgang
export function makeChain(c, volume) {
  const master = c.createGain(); master.gain.value = volume;
  const comp = c.createDynamicsCompressor();
  try { comp.threshold.value = -10; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.15; } catch {}
  master.connect(comp); comp.connect(c.destination);
  return master;
}

function env(g, t, peak, dur, floor = 0.0001) {
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(floor, t + dur);
}

export function playDrum(c, dest, noiseBuf, id, t) {
  const noise = (type, freq, q, vol, dur, at = t) => {
    const s = c.createBufferSource(); s.buffer = noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); s.connect(f); f.connect(g); g.connect(dest);
    env(g, at, vol, dur); s.start(at); s.stop(at + dur + 0.05);
  };
  const tone = (type, f0, f1, fdur, vol, dur) => {
    const o = c.createOscillator(), g = c.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + fdur);
    o.connect(g); g.connect(dest); env(g, t, vol, dur); o.start(t); o.stop(t + dur + 0.05);
  };
  if (id === 'kick') { tone('sine', 160, 42, 0.12, 1.0, 0.5); noise('lowpass', 800, 0.7, 0.15, 0.02); }
  else if (id === 'snare') { tone('triangle', 200, 140, 0.08, 0.5, 0.14); noise('highpass', 1800, 0.7, 0.6, 0.22); }
  else if (id === 'hat') noise('highpass', 7500, 0.7, 0.45, 0.05);
  else if (id === 'open') noise('highpass', 6500, 0.7, 0.4, 0.35);
  else if (id === 'clap') { [0, 0.011, 0.022].forEach((o) => noise('bandpass', 1500, 1.2, 0.55, 0.02, t + o)); noise('bandpass', 1400, 1.0, 0.5, 0.18, t + 0.033); }
  else if (id === 'tom') { tone('sine', 220, 100, 0.15, 0.85, 0.4); }
}

export function playNote(c, dest, sound, freq, t, dur) {
  const g = c.createGain(); g.connect(dest);
  const oscs = [];
  const osc = (type, mult, vol, det = 0, out = g) => {
    const o = c.createOscillator(), og = c.createGain(); o.type = type; o.frequency.value = freq * mult; o.detune.value = det;
    og.gain.value = vol; o.connect(og); og.connect(out); o.start(t); oscs.push(o);
  };
  let a = 0.01, peak = 0.5, sus = 0.3, rel = 0.15, hold = dur;
  if (sound === 'synth') {
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; lp.Q.value = 2; lp.connect(g);
    osc('sawtooth', 1, 0.3, -7, lp); osc('sawtooth', 1, 0.3, 7, lp); osc('square', 0.5, 0.15, 0, lp);
    a = 0.015; peak = 0.45; sus = 0.5; rel = 0.12;
  } else if (sound === 'bas') {
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500; lp.connect(g);
    osc('sine', 1, 0.7, 0, lp); osc('square', 1, 0.25, 0, lp); osc('triangle', 2, 0.15, 0, lp);
    a = 0.008; peak = 0.9; sus = 0.5; rel = 0.08;
  } else if (sound === 'bel') {
    osc('sine', 1, 0.5); osc('sine', 2.76, 0.18); osc('sine', 5.4, 0.08);
    a = 0.002; peak = 0.5; sus = 0.0005; rel = 0.4; hold = Math.max(dur, 1.0);
  } else { // orgel
    osc('sine', 1, 0.4); osc('sine', 2, 0.3); osc('sine', 4, 0.12); osc('sine', 0.5, 0.2);
    a = 0.02; peak = 0.4; sus = 0.8; rel = 0.1;
  }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  const end = t + hold;
  g.gain.exponentialRampToValueAtTime(Math.max(0.0005, peak * sus), Math.max(t + a + 0.01, end - rel * 0.5));
  g.gain.setValueAtTime(Math.max(0.0005, peak * sus), end);
  g.gain.exponentialRampToValueAtTime(0.0001, end + rel);
  oscs.forEach((o) => o.stop(end + rel + 0.05));
}

// plan alle klanken van één stap op tijd t
export function scheduleStep(c, dest, noiseBuf, pat, step, t, stepDur) {
  DRUMS.forEach((d, r) => { if (pat.drums[r][step]) playDrum(c, dest, noiseBuf, d.id, t); });
  for (let r = 0; r < MEL_ROWS; r++) if (pat.mel[r][step]) playNote(c, dest, pat.sound, midiFreq(rowMidi(r, pat.scale, pat.sound)), t, stepDur * 0.9);
}

// tijd (in s, t.o.v. de start van de stap) van het swing-verschuiving voor stap s
export const swingOffset = (step, swing, stepDur) => (step % 2 === 1 ? (swing / 100) * 0.4 * stepDur : 0);

// ---------- WAV-encoder (16-bit PCM, little endian) ----------
export function encodeWav(buf) {
  const ch = buf.numberOfChannels, sr = buf.sampleRate, n = buf.length;
  const data = []; for (let i = 0; i < ch; i++) data.push(buf.getChannelData(i));
  const bytes = n * ch * 2, ab = new ArrayBuffer(44 + bytes), dv = new DataView(ab);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); dv.setUint32(4, 36 + bytes, true); str(8, 'WAVE'); str(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, ch, true);
  dv.setUint32(24, sr, true); dv.setUint32(28, sr * ch * 2, true); dv.setUint16(32, ch * 2, true); dv.setUint16(34, 16, true);
  str(36, 'data'); dv.setUint32(40, bytes, true);
  let o = 44;
  for (let i = 0; i < n; i++) for (let k = 0; k < ch; k++) {
    let s = data[k][i]; s = Math.max(-1, Math.min(1, s));
    dv.setInt16(o, s < 0 ? Math.round(s * 32768) : Math.round(s * 32767), true); o += 2;
  }
  return ab;
}

// ---------- weergave ----------
// ctx: { view, esc, uid, addCleanup }
export function muziekView(ctx) {
  const { view, esc, uid, addCleanup } = ctx;
  const KEY = `music:${uid}:slots`;
  const blank = () => ({ drums: DRUMS.map(() => new Array(STEPS).fill(false)), mel: Array.from({ length: MEL_ROWS }, () => new Array(STEPS).fill(false)) });
  const st = { ...blank(), scale: 'pentatonisch', sound: 'synth', bpm: 100, swing: 0, volume: 0.8 };
  let ac = null, master = null, session = null, noiseBuf = null;
  let playing = false, timer = 0, raf = 0, nextT = 0, step = 0, queue = [], curStep = -1;
  let alive = true, selSlot = 0, exporting = false, touched = false;
  let slots = loadSlots();
  const urls = []; const timeouts = [];
  const cells = { d: [], m: [] };
  const $ = (s) => view.querySelector(s);

  addCleanup(() => {
    alive = false; stop(true);
    try { ac && ac.close && ac.close().catch(() => {}); } catch {}
    ac = null; master = null;
    timeouts.forEach(clearTimeout); urls.forEach((u) => { try { URL.revokeObjectURL(u); } catch {} });
  });

  // ----- opslag -----
  function loadSlots() {
    let arr = [];
    try { arr = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { arr = []; }
    if (!Array.isArray(arr)) arr = [];
    const out = [];
    for (let i = 0; i < SLOT_COUNT; i++) out.push(arr[i] && typeof arr[i] === 'object' && arr[i].data ? arr[i] : null);
    return out;
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(slots)); return true; } catch { return false; } }
  const snapshot = () => JSON.parse(JSON.stringify({ drums: st.drums, mel: st.mel, scale: st.scale, sound: st.sound, bpm: st.bpm, swing: st.swing }));
  function apply(d) {
    if (!d || !Array.isArray(d.drums) || !Array.isArray(d.mel)) return false;
    const fix = (rows, n) => Array.from({ length: n }, (_, r) => Array.from({ length: STEPS }, (_, s) => !!(rows[r] && rows[r][s])));
    st.drums = fix(d.drums, DRUMS.length); st.mel = fix(d.mel, MEL_ROWS);
    if (SCALES[d.scale]) st.scale = d.scale;
    if (SOUNDS.some((x) => x[0] === d.sound)) st.sound = d.sound;
    if (+d.bpm >= 60 && +d.bpm <= 180) st.bpm = Math.round(+d.bpm);
    if (+d.swing >= 0 && +d.swing <= 100) st.swing = Math.round(+d.swing);
    return true;
  }

  // ----- audio -----
  function ensure() {
    if (!ac) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        ac = new AC(); master = makeChain(ac, st.volume); noiseBuf = makeNoise(ac);
      } catch { ac = null; return false; }
    }
    if (ac.state === 'suspended') { try { ac.resume().catch(() => {}); } catch {} }
    return true;
  }
  const stepDur = () => 60 / st.bpm / 4;

  function schedule() {
    if (!ac || !playing) return;
    const ahead = document.hidden ? 1.0 : 0.15;
    if (nextT < ac.currentTime - 0.05) nextT = ac.currentTime + 0.05; // te ver achter (tab op de achtergrond): opnieuw uitlijnen
    const pat = { drums: st.drums, mel: st.mel, scale: st.scale, sound: st.sound };
    while (nextT < ac.currentTime + ahead) {
      const t = nextT + swingOffset(step, st.swing, stepDur());
      scheduleStep(ac, session, noiseBuf, pat, step, t, stepDur());
      queue.push({ s: step, t });
      step = (step + 1) % STEPS;
      nextT += stepDur(); // het raster blijft exact, ook als het tempo verandert
    }
  }
  function frame() {
    if (!alive || !playing) return;
    const now = ac.currentTime; let cur = -1;
    while (queue.length && queue[0].t <= now) cur = queue.shift().s;
    if (cur >= 0) showStep(cur);
    raf = requestAnimationFrame(frame);
  }
  function play() {
    if (playing || !ensure()) return;
    session = ac.createGain(); session.connect(master);
    playing = true; touched = true; step = 0; queue = []; nextT = ac.currentTime + 0.06;
    schedule();
    timer = setInterval(schedule, 25);
    raf = requestAnimationFrame(frame);
    updateHint(); updatePlayBtn();
  }
  function stop(silent) {
    if (timer) { clearInterval(timer); timer = 0; }
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (session) { // al ingeplande klanken meteen stilzetten
      const s = session; session = null;
      try { s.gain.setValueAtTime(s.gain.value, ac.currentTime); s.gain.linearRampToValueAtTime(0, ac.currentTime + 0.03); timeouts.push(setTimeout(() => { try { s.disconnect(); } catch {} }, 80)); } catch {}
    }
    playing = false; queue = []; showStep(-1);
    if (!silent) updatePlayBtn();
  }
  function preview(kind, r) {
    if (!ensure()) return;
    const t = ac.currentTime + 0.005;
    if (kind === 'd') playDrum(ac, master, noiseBuf, DRUMS[r].id, t);
    else playNote(ac, master, st.sound, midiFreq(rowMidi(r, st.scale, st.sound)), t, 0.3);
  }

  // ----- export -----
  async function exportWav() {
    if (exporting) return;
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const msg = $('#mu-msg');
    if (!OAC) { msg.textContent = 'Exporteren wordt niet ondersteund door deze browser.'; return; }
    exporting = true; updateExportBtn(); msg.textContent = 'Bezig met renderen…';
    try {
      const sr = 44100, sd = stepDur(), bars = 2, total = bars * STEPS * sd + 1.5;
      const oc = new OAC(2, Math.ceil(total * sr), sr);
      const m = makeChain(oc, st.volume), nb = makeNoise(oc);
      const pat = { drums: st.drums, mel: st.mel, scale: st.scale, sound: st.sound };
      for (let i = 0; i < bars * STEPS; i++) {
        const s = i % STEPS;
        scheduleStep(oc, m, nb, pat, s, i * sd + swingOffset(s, st.swing, sd) + 0.02, sd);
      }
      const buf = await oc.startRendering();
      if (!alive) return;
      let peak = 0; for (let k = 0; k < buf.numberOfChannels; k++) { const d = buf.getChannelData(k); for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; } }
      if (peak > 0.98) { const g = 0.98 / peak; for (let k = 0; k < buf.numberOfChannels; k++) { const d = buf.getChannelData(k); for (let i = 0; i < d.length; i++) d[i] *= g; } }
      const blob = new Blob([encodeWav(buf)], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob); urls.push(url);
      const a = document.createElement('a'); a.href = url; a.download = `beat-${st.bpm}bpm.wav`;
      document.body.appendChild(a); a.click(); a.remove();
      timeouts.push(setTimeout(() => { try { URL.revokeObjectURL(url); } catch {} }, 60000));
      msg.textContent = `✔ Klaar: ${(blob.size / 1024 / 1024).toFixed(1)} MB (2 maten, ${st.bpm} bpm).`;
    } catch (e) {
      if (alive) msg.textContent = 'Exporteren is mislukt.';
    }
    exporting = false; if (alive) updateExportBtn();
  }

  // ----- UI-hulp -----
  function showStep(s) {
    if (s === curStep) return;
    for (let i = 0; i < STEPS; i++) if (i === curStep || i === s) {
      const on = i === s;
      cells.d.forEach((row) => row[i] && row[i].classList.toggle('ph', on));
      cells.m.forEach((row) => row[i] && row[i].classList.toggle('ph', on));
      const h = $(`#mu-h${i}`); if (h) h.classList.toggle('ph', on);
    }
    curStep = s;
  }
  function paint(kind, r, s, val) {
    const arr = kind === 'd' ? st.drums : st.mel;
    if (arr[r][s] === val) return false;
    arr[r][s] = val;
    const el = cells[kind][r][s]; if (el) el.classList.toggle('on', val);
    return true;
  }
  function refreshCells() {
    st.drums.forEach((row, r) => row.forEach((v, s) => cells.d[r][s].classList.toggle('on', v)));
    st.mel.forEach((row, r) => row.forEach((v, s) => cells.m[r][s].classList.toggle('on', v)));
    updateHint();
  }
  function anyOn() { return st.drums.some((r) => r.some(Boolean)) || st.mel.some((r) => r.some(Boolean)); }
  function updateHint() { const h = $('#mu-hint'); if (h) h.style.display = (anyOn() || playing || touched) ? 'none' : ''; }
  function updatePlayBtn() { const b = $('#mu-play'); if (b) { b.textContent = playing ? '⏹ Stop' : '▶ Speel'; b.classList.toggle('pri', !playing); } }
  function updateExportBtn() { const b = $('#mu-exp'); if (b) { b.disabled = exporting; b.textContent = exporting ? '⏳ Bezig…' : '💾 Exporteer .wav'; } }
  function updateMelLabels() {
    for (let r = 0; r < MEL_ROWS; r++) { const l = $(`#mu-ml${r}`); if (l) l.textContent = midiName(rowMidi(r, st.scale, st.sound)); }
  }
  function syncControls() {
    $('#mu-bpm').value = st.bpm; $('#mu-bpmv').textContent = st.bpm;
    $('#mu-swing').value = st.swing; $('#mu-swingv').textContent = st.swing + '%';
    $('#mu-vol').value = st.volume;
    $('#mu-scale').value = st.scale;
    view.querySelectorAll('[data-snd]').forEach((b) => b.classList.toggle('pri', b.dataset.snd === st.sound));
    updateMelLabels();
  }
  function slotLabel(i) { const s = slots[i]; return `${i + 1}. ${s ? s.name : '(leeg)'}`; }
  function renderSlots() {
    const sel = $('#mu-slot'); if (!sel) return;
    sel.innerHTML = slots.map((_, i) => `<option value="${i}">${esc(slotLabel(i))}</option>`).join('');
    sel.value = String(selSlot);
    const nm = $('#mu-name'); if (nm && document.activeElement !== nm) nm.value = slots[selSlot] ? slots[selSlot].name : '';
  }

  function randomize() {
    const rnd = (p) => Math.random() < p;
    st.drums = DRUMS.map((d, r) => Array.from({ length: STEPS }, (_, s) => {
      if (d.id === 'kick') return s % 4 === 0 ? rnd(0.85) : rnd(0.12);
      if (d.id === 'snare') return s % 8 === 4 ? rnd(0.9) : rnd(0.06);
      if (d.id === 'hat') return s % 2 === 0 ? rnd(0.8) : rnd(0.25);
      if (d.id === 'open') return s % 4 === 2 ? rnd(0.35) : rnd(0.03);
      if (d.id === 'clap') return s % 8 === 4 ? rnd(0.4) : rnd(0.04);
      return rnd(0.07);
    }));
    st.mel = Array.from({ length: MEL_ROWS }, () => new Array(STEPS).fill(false));
    let last = 4 + Math.floor(Math.random() * 3);
    for (let s = 0; s < STEPS; s++) {
      if (!rnd(s % 2 === 0 ? 0.55 : 0.2)) continue;
      last = Math.max(0, Math.min(MEL_ROWS - 1, last + Math.floor(Math.random() * 5) - 2));
      st.mel[last][s] = true;
    }
    touched = true; refreshCells();
  }

  // ----- opbouw -----
  function build() {
    const css = `<style>
      .mu-grid{display:grid;grid-template-columns:38px repeat(${STEPS},minmax(0,1fr));gap:2px;margin-bottom:2px;touch-action:none;user-select:none;-webkit-user-select:none}
      .mu-lab{display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:700;border-radius:6px;color:#fff;min-height:40px;padding:0;overflow:hidden}
      .mu-c{min-height:40px;border-radius:5px;background:rgba(128,128,128,.16);cursor:pointer;-webkit-tap-highlight-color:transparent}
      .mu-c.g{margin-left:3px}
      .mu-c.on{background:var(--c);box-shadow:inset 0 -3px 0 #0003}
      .mu-c.ph{background:rgba(128,128,128,.4)}
      .mu-c.on.ph{background:var(--c);filter:brightness(1.45) saturate(1.1)}
      .mu-h{font-size:.5rem;text-align:center;opacity:.55;height:16px;line-height:16px;border-radius:4px}
      .mu-h.g{margin-left:3px}
      .mu-h.ph{background:var(--accent,#6366f1);color:#fff;opacity:1}
      .mu-sec{font-size:.8rem;font-weight:700;margin:.5rem 0 .25rem}
      .mu-ctl{display:flex;align-items:center;gap:.5rem;margin:.3rem 0}
      .mu-ctl>span{min-width:4.2rem;font-size:.85rem}
      .mu-ctl input[type=range]{flex:1;min-height:40px}
      .mu-ctl output{min-width:2.6rem;text-align:right;font-variant-numeric:tabular-nums;font-size:.85rem}
      #mu-view button,#mu-view select,#mu-view input[type=text]{min-height:40px}
      #mu-view select,#mu-view input[type=text]{font:inherit;padding:0 .5rem;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--ink);min-width:0}
    </style>`;
    const hdr = `<div class="mu-grid"><div></div>${Array.from({ length: STEPS }, (_, i) => `<div class="mu-h${i % 4 === 0 && i ? ' g' : ''}" id="mu-h${i}">${i % 4 === 0 ? i / 4 + 1 : '·'}</div>`).join('')}</div>`;
    const rowHtml = (kind, r, label, color, title) =>
      `<div class="mu-grid"><div class="mu-lab" id="${kind === 'm' ? 'mu-ml' + r : ''}" style="background:${color}" title="${esc(title)}">${esc(label)}</div>${Array.from({ length: STEPS }, (_, s) => `<div class="mu-c${s % 4 === 0 && s ? ' g' : ''}" data-k="${kind}" data-r="${r}" data-s="${s}" style="--c:${color}"></div>`).join('')}</div>`;
    view.innerHTML = `${css}<div id="mu-view">
      <div class="box" id="mu-hint" style="text-align:center;padding:.7rem"><b>Tik op de vakjes en druk op ▶</b><br><small>Sleep over de vakjes om er meer tegelijk te zetten. Of kies hieronder een voorbeeld.</small></div>
      <div class="box" style="padding:.6rem">
        <div class="row wrap" style="margin:0 0 .4rem"><button id="mu-play" class="pri" style="flex:1;font-size:1.05rem">▶ Speel</button><button id="mu-rnd">🎲 Willekeurig</button><button id="mu-clr">🗑 Wis</button></div>
        <div class="row wrap" id="mu-presets" style="margin:0 0 .4rem">${Object.keys(PRESETS).map((k) => `<button data-pre="${k}">${PRESETS[k].label}</button>`).join('')}</div>
        <div class="mu-ctl"><span>Tempo</span><input type="range" id="mu-bpm" min="60" max="180" step="1" value="${st.bpm}"><output id="mu-bpmv">${st.bpm}</output></div>
        <div class="mu-ctl"><span>Swing</span><input type="range" id="mu-swing" min="0" max="100" step="1" value="${st.swing}"><output id="mu-swingv">${st.swing}%</output></div>
        <div class="mu-ctl"><span>🔈 Volume</span><input type="range" id="mu-vol" min="0" max="1" step="0.05" value="${st.volume}"><output></output></div>
      </div>
      <div class="box" style="padding:.5rem">
        ${hdr}
        <div class="mu-sec">🥁 Ritme</div>
        ${DRUMS.map((d, r) => rowHtml('d', r, d.lab, d.color, d.name)).join('')}
        <div class="mu-sec">🎹 Melodie</div>
        <div class="row wrap" style="margin:0 0 .4rem"><select id="mu-scale" aria-label="Toonladder">${Object.keys(SCALES).map((k) => `<option value="${k}">${SCALES[k].label}</option>`).join('')}</select>${SOUNDS.map(([k, l]) => `<button data-snd="${k}" class="${k === st.sound ? 'pri' : ''}">${l}</button>`).join('')}</div>
        ${Array.from({ length: MEL_ROWS }, (_, r) => rowHtml('m', r, midiName(rowMidi(r, st.scale, st.sound)), MEL_COLORS[r], 'Melodierij ' + (MEL_ROWS - r))).join('')}
      </div>
      <div class="box" style="padding:.6rem">
        <b>Opslaan en laden</b>
        <div class="row" style="margin:.4rem 0"><select id="mu-slot" style="flex:1" aria-label="Opslagplek"></select></div>
        <div class="row" style="margin:.4rem 0"><input type="text" id="mu-name" maxlength="30" placeholder="Naam van je beat" style="flex:1"></div>
        <div class="row wrap"><button id="mu-save">💾 Opslaan</button><button id="mu-load">📂 Laden</button><button id="mu-del">✖ Leegmaken</button></div>
        <hr style="border:0;border-top:1px solid var(--line);margin:.7rem 0">
        <div class="row wrap"><button id="mu-exp">💾 Exporteer .wav</button><small>Download je beat (2 maten) als geluidsbestand.</small></div>
        <div id="mu-msg" style="min-height:1.4rem;margin-top:.3rem"></div>
      </div></div>`;
    view.querySelectorAll('.mu-c').forEach((el) => { (cells[el.dataset.k][+el.dataset.r] ||= [])[+el.dataset.s] = el; });
    wire();
    syncControls(); renderSlots(); refreshCells();
  }

  function wire() {
    // tikken en slepen op het raster
    let drag = null;
    const cellAt = (x, y) => { const e = document.elementFromPoint(x, y); return e && e.closest ? e.closest('.mu-c') : null; };
    const hit = (el) => {
      if (!el || !view.contains(el)) return;
      const k = el.dataset.k, r = +el.dataset.r, s = +el.dataset.s;
      if (drag.val === null) drag.val = !(k === 'd' ? st.drums : st.mel)[r][s];
      if (paint(k, r, s, drag.val)) { touched = true; updateHint(); if (drag.val) preview(k, r); }
    };
    view.addEventListener('pointerdown', (e) => {
      const el = e.target.closest && e.target.closest('.mu-c'); if (!el) return;
      e.preventDefault(); ensure(); drag = { val: null, id: e.pointerId };
      try { el.setPointerCapture(e.pointerId); } catch {}
      hit(el);
    });
    view.addEventListener('pointermove', (e) => { if (!drag || e.pointerId !== drag.id) return; hit(cellAt(e.clientX, e.clientY)); });
    const end = (e) => { if (drag && e.pointerId === drag.id) drag = null; };
    view.addEventListener('pointerup', end); view.addEventListener('pointercancel', end);
    view.addEventListener('contextmenu', (e) => { if (e.target.closest && e.target.closest('.mu-grid')) e.preventDefault(); });

    $('#mu-play').onclick = () => { if (playing) stop(); else play(); };
    $('#mu-clr').onclick = () => { const b = blank(); st.drums = b.drums; st.mel = b.mel; refreshCells(); };
    $('#mu-rnd').onclick = () => randomize();
    view.querySelectorAll('[data-pre]').forEach((b) => b.onclick = () => {
      const p = PRESETS[b.dataset.pre];
      apply({ drums: p.pat.drums, mel: p.pat.mel, scale: p.scale, sound: p.sound, bpm: p.bpm, swing: p.swing });
      touched = true; syncControls(); refreshCells();
    });
    $('#mu-bpm').oninput = (e) => { st.bpm = +e.target.value; $('#mu-bpmv').textContent = st.bpm; };
    $('#mu-swing').oninput = (e) => { st.swing = +e.target.value; $('#mu-swingv').textContent = st.swing + '%'; };
    $('#mu-vol').oninput = (e) => { st.volume = +e.target.value; if (master) master.gain.value = st.volume; };
    $('#mu-scale').onchange = (e) => { st.scale = e.target.value; updateMelLabels(); };
    view.querySelectorAll('[data-snd]').forEach((b) => b.onclick = () => {
      st.sound = b.dataset.snd; ensure();
      view.querySelectorAll('[data-snd]').forEach((x) => x.classList.toggle('pri', x === b));
      updateMelLabels(); preview('m', 3);
    });
    $('#mu-slot').onchange = (e) => { selSlot = +e.target.value; const nm = $('#mu-name'); nm.value = slots[selSlot] ? slots[selSlot].name : ''; };
    $('#mu-save').onclick = () => {
      const name = ($('#mu-name').value || '').trim().slice(0, 30) || `Beat ${selSlot + 1}`;
      slots[selSlot] = { name, data: snapshot(), saved: Date.now() };
      $('#mu-msg').textContent = persist() ? `✔ Opgeslagen in plek ${selSlot + 1}.` : 'Opslaan is niet gelukt (opslag is vol of uitgeschakeld).';
      renderSlots(); $('#mu-name').value = name;
    };
    $('#mu-load').onclick = () => {
      const s = slots[selSlot];
      if (!s) { $('#mu-msg').textContent = 'Deze plek is leeg.'; return; }
      if (!apply(s.data)) { $('#mu-msg').textContent = 'Dit patroon kon niet geladen worden.'; return; }
      touched = true; syncControls(); refreshCells(); $('#mu-msg').textContent = `✔ "${s.name}" geladen.`;
    };
    $('#mu-del').onclick = () => {
      if (!slots[selSlot]) { $('#mu-msg').textContent = 'Deze plek is al leeg.'; return; }
      slots[selSlot] = null; persist(); renderSlots(); $('#mu-name').value = ''; $('#mu-msg').textContent = `Plek ${selSlot + 1} is leeg gemaakt.`;
    };
    $('#mu-exp').onclick = () => exportWav();
  }

  build();
}
