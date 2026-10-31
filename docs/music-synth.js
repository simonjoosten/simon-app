// Gedeelde geluidsmotor voor Piano en Muziekmaker: 17 instrumenten, 12 drumgeluiden en effecten (galm, echo, filter).
// Alles wordt in de browser gesynthetiseerd met WebAudio (geen samples). Werkt op AudioContext én OfflineAudioContext.

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const SOLFEGE = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
export const midiFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
export const pitchClass = (m) => ((m % 12) + 12) % 12;
export const noteName = (m) => NOTE_NAMES[pitchClass(m)] + (Math.floor(m / 12) - 1);   // 60 -> C4
export const isBlack = (m) => [1, 3, 6, 8, 10].includes(pitchClass(m));

// ---- instrumenten ----
export const INSTRUMENTS = [
  { id: 'piano', name: 'Piano', icon: 'piano', group: 'Toetsen' },
  { id: 'epiano', name: 'E-piano', icon: 'piano', group: 'Toetsen' },
  { id: 'orgel', name: 'Orgel', icon: 'bell', group: 'Toetsen' },
  { id: 'synth', name: 'Synth', icon: 'bolt', group: 'Synths' },
  { id: 'supersaw', name: 'Superlead', icon: 'star', group: 'Synths' },
  { id: 'chip', name: '8-bit', icon: 'puzzle', group: 'Synths' },
  { id: 'chip2', name: '8-bit zacht', icon: 'puzzle', group: 'Synths' },
  { id: 'bas', name: 'Bas', icon: 'guitar', group: 'Bas' },
  { id: 'acid', name: 'Acid-bas', icon: 'flame', group: 'Bas' },
  { id: 'gitaar', name: 'Gitaar', icon: 'guitar', group: 'Snaren' },
  { id: 'harp', name: 'Harp', icon: 'fairy', group: 'Snaren' },
  { id: 'strijkers', name: 'Strijkers', icon: 'heart', group: 'Snaren' },
  { id: 'xylofoon', name: 'Xylofoon', icon: 'note', group: 'Slagwerk-melodie' },
  { id: 'marimba', name: 'Marimba', icon: 'note', group: 'Slagwerk-melodie' },
  { id: 'bel', name: 'Bel', icon: 'bell', group: 'Slagwerk-melodie' },
  { id: 'fluit', name: 'Fluit', icon: 'wand', group: 'Blazers' },
  { id: 'koper', name: 'Koper', icon: 'trophy', group: 'Blazers' },
];
export const INST_IDS = INSTRUMENTS.map((i) => i.id);
export const instInfo = (id) => INSTRUMENTS.find((i) => i.id === id) || INSTRUMENTS[0];

// ---- drums ----
export const DRUMKIT = [
  { id: 'kick', lab: 'Kick', name: 'Bas-drum', color: '#ef4444' },
  { id: 'boem', lab: 'Boem', name: 'Lange 808-kick', color: '#dc2626' },
  { id: 'snare', lab: 'Snare', name: 'Snaredrum', color: '#f97316' },
  { id: 'rim', lab: 'Rim', name: 'Rimshot', color: '#fb923c' },
  { id: 'hat', lab: 'HH', name: 'Hi-hat dicht', color: '#eab308' },
  { id: 'open', lab: 'HH+', name: 'Hi-hat open', color: '#84cc16' },
  { id: 'clap', lab: 'Clap', name: 'Klap', color: '#ec4899' },
  { id: 'tom', lab: 'Tom', name: 'Tom', color: '#a855f7' },
  { id: 'cowbell', lab: 'Bel', name: 'Koebel', color: '#14b8a6' },
  { id: 'crash', lab: 'Crash', name: 'Crashbekken', color: '#06b6d4' },
  { id: 'shaker', lab: 'Shk', name: 'Shaker', color: '#3b82f6' },
  { id: 'conga', lab: 'Cng', name: 'Conga', color: '#6366f1' },
];
export const DRUM_IDS = DRUMKIT.map((d) => d.id);
export const drumInfo = (id) => DRUMKIT.find((d) => d.id === id) || DRUMKIT[0];

export function makeNoise(c) {
  const len = Math.floor(c.sampleRate * 1.5);
  const b = c.createBuffer(1, len, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

// galm-impuls: stereo ruis die uitdooft
export function makeImpulse(c, secs = 1.8) {
  const len = Math.floor(c.sampleRate * secs);
  const b = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  return b;
}

// Master-keten met effecten. Alles verbindt met bus.input.
export function makeBus(c, volume = 0.8) {
  const input = c.createGain();
  const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 20000; filter.Q.value = 0.9;
  const dry = c.createGain();
  const master = c.createGain(); master.gain.value = volume;
  const comp = c.createDynamicsCompressor();
  try { comp.threshold.value = -12; comp.knee.value = 14; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.16; } catch { /* ok */ }
  input.connect(filter); filter.connect(dry); dry.connect(master);
  const revSend = c.createGain(); revSend.gain.value = 0;
  const conv = c.createConvolver(); try { conv.buffer = makeImpulse(c); } catch { /* ok */ }
  const revRet = c.createGain(); revRet.gain.value = 0.9;
  filter.connect(revSend); revSend.connect(conv); conv.connect(revRet); revRet.connect(master);
  const echoSend = c.createGain(); echoSend.gain.value = 0;
  const delay = c.createDelay(2); delay.delayTime.value = 0.36;
  const fb = c.createGain(); fb.gain.value = 0.42;
  const echoLP = c.createBiquadFilter(); echoLP.type = 'lowpass'; echoLP.frequency.value = 3200;
  const echoRet = c.createGain(); echoRet.gain.value = 0.8;
  filter.connect(echoSend); echoSend.connect(delay); delay.connect(echoLP); echoLP.connect(fb); fb.connect(delay); echoLP.connect(echoRet); echoRet.connect(master);
  master.connect(comp);
  let analyser = null;
  try { analyser = c.createAnalyser && c.createAnalyser(); if (analyser) { analyser.fftSize = 64; analyser.smoothingTimeConstant = 0.7; comp.connect(analyser); } } catch { analyser = null; }
  comp.connect(c.destination);
  return {
    input, master, analyser,
    setVolume(v) { master.gain.value = Math.max(0, Math.min(1.2, v)); },
    setReverb(v) { revSend.gain.value = Math.max(0, Math.min(1, v)) * 0.9; },
    setEcho(v) { echoSend.gain.value = Math.max(0, Math.min(1, v)) * 0.8; },
    setEchoTime(s) { delay.delayTime.value = Math.max(0.05, Math.min(1.5, s)); },
    setFilter(v) { filter.frequency.value = filterFreq(v); },   // 1 = helemaal open, 0 = dof
  };
}
export const filterFreq = (v) => 250 * Math.pow(80, Math.max(0, Math.min(1, v)));
export function applyFx(bus, fx, bpm) {
  if (!bus || !fx) return;
  bus.setReverb(fx.rev || 0); bus.setEcho(fx.echo || 0); bus.setFilter(fx.filter == null ? 1 : fx.filter);
  if (bpm) bus.setEchoTime(60 / bpm * 0.75);   // echo op een achtste-punt
}

// ---- melodische stem ----
// build(o): o.osc(type, mult, vol, detune, out) maakt een oscillator; o.filt(type,freq,q) een filter; geeft envelop terug {a,d,s,r,peak}
function build(c, dest, id, f, t, vel, nb) {
  const amp = c.createGain(); amp.connect(dest);
  const oscs = [], srcs = [];
  const o = {
    amp,
    osc(type, mult, vol, det = 0, out = amp) {
      const x = c.createOscillator(), g = c.createGain();
      x.type = type; x.frequency.value = f * mult; x.detune.value = det; g.gain.value = vol;
      x.connect(g); g.connect(out); x.start(t); oscs.push(x); return x;
    },
    filt(type, freq, q = 0.7, out = amp) { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = freq; b.Q.value = q; b.connect(out); return b; },
    sweep(filter, from, to, dur) { filter.frequency.setValueAtTime(from, t); filter.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur); },
    vibrato(x, rate, depth, delay = 0.2) {
      const l = c.createOscillator(), g = c.createGain(); l.frequency.value = rate; g.gain.value = 0;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(depth, t + delay + 0.3);
      l.connect(g); g.connect(x.detune); l.start(t); oscs.push(l);
    },
    noise(type, freq, q, vol, dur, out = amp) {
      if (!nb) return;
      const s = c.createBufferSource(); s.buffer = nb; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = freq; fl.Q.value = q;
      const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(fl); fl.connect(g); g.connect(out); s.start(t); s.stop(t + dur + 0.05); srcs.push(s);
    },
  };
  let e = { a: 0.01, d: 0.4, s: 0.3, r: 0.25, peak: 0.5 };
  switch (id) {
    case 'piano': o.osc('triangle', 1, 0.5); o.osc('sine', 2, 0.25); o.osc('sine', 3, 0.1); o.osc('sine', 4.02, 0.05); o.noise('bandpass', Math.min(8000, f * 6), 1.2, 0.12, 0.03);
      e = { a: 0.004, d: 1.6, s: 0.07, r: 0.35, peak: 0.7 }; break;
    case 'epiano': o.osc('sine', 1, 0.5); o.osc('sine', 14, 0.04); o.osc('triangle', 2, 0.18, 4); o.osc('sine', 3, 0.05);
      e = { a: 0.005, d: 1.4, s: 0.12, r: 0.3, peak: 0.65 }; break;
    case 'orgel': o.osc('sine', 1, 0.4); o.osc('sine', 2, 0.3); o.osc('sine', 4, 0.14); o.osc('sine', 0.5, 0.2); o.osc('square', 1, 0.04);
      e = { a: 0.02, d: 0.1, s: 0.85, r: 0.12, peak: 0.45 }; break;
    case 'synth': { const lp = o.filt('lowpass', 2400, 2); o.osc('sawtooth', 1, 0.3, -7, lp); o.osc('sawtooth', 1, 0.3, 7, lp); o.osc('square', 0.5, 0.15, 0, lp);
      e = { a: 0.015, d: 0.4, s: 0.5, r: 0.15, peak: 0.45 }; break; }
    case 'supersaw': { const lp = o.filt('lowpass', 5200, 1); [-18, -9, 0, 9, 18].forEach((d) => o.osc('sawtooth', 1, 0.14, d, lp)); o.osc('sawtooth', 0.5, 0.12, 0, lp);
      e = { a: 0.03, d: 0.3, s: 0.65, r: 0.25, peak: 0.45 }; break; }
    case 'chip': { const x = o.osc('square', 1, 0.28); o.vibrato(x, 6, 8, 0.25); e = { a: 0.003, d: 0.12, s: 0.7, r: 0.04, peak: 0.45 }; break; }
    case 'chip2': o.osc('triangle', 1, 0.7); e = { a: 0.003, d: 0.1, s: 0.85, r: 0.04, peak: 0.6 }; break;
    case 'bas': { const lp = o.filt('lowpass', 520); o.osc('sine', 1, 0.7, 0, lp); o.osc('square', 1, 0.22, 0, lp); o.osc('triangle', 2, 0.14, 0, lp);
      e = { a: 0.008, d: 0.25, s: 0.55, r: 0.08, peak: 0.95 }; break; }
    case 'acid': { const lp = o.filt('lowpass', 1800, 9); o.sweep(lp, 2600, 260, 0.22); o.osc('sawtooth', 1, 0.45, 0, lp); e = { a: 0.004, d: 0.2, s: 0.5, r: 0.06, peak: 0.6 }; break; }
    case 'gitaar': { const lp = o.filt('lowpass', 3500, 1); o.sweep(lp, 4200, 700, 0.35); o.osc('sawtooth', 1, 0.3, -4, lp); o.osc('triangle', 1, 0.35, 5, lp); o.osc('sine', 2, 0.1, 0, lp); o.noise('bandpass', 2500, 1, 0.08, 0.02);
      e = { a: 0.003, d: 1.1, s: 0.05, r: 0.2, peak: 0.7 }; break; }
    case 'harp': o.osc('sine', 1, 0.5); o.osc('triangle', 2, 0.2); o.osc('sine', 3, 0.08); e = { a: 0.002, d: 1.7, s: 0.02, r: 0.4, peak: 0.65 }; break;
    case 'strijkers': { const lp = o.filt('lowpass', 3200, 0.8); const x1 = o.osc('sawtooth', 1, 0.2, -8, lp), x2 = o.osc('sawtooth', 1, 0.2, 8, lp); o.osc('sawtooth', 2, 0.06, 0, lp); o.vibrato(x1, 5.2, 6, 0.4); o.vibrato(x2, 5.6, 6, 0.4);
      e = { a: 0.18, d: 0.3, s: 0.8, r: 0.35, peak: 0.45 }; break; }
    case 'xylofoon': o.osc('sine', 1, 0.55); o.osc('sine', 3.9, 0.22); o.osc('sine', 9.3, 0.05); e = { a: 0.001, d: 0.45, s: 0.002, r: 0.1, peak: 0.7 }; break;
    case 'marimba': o.osc('sine', 1, 0.7); o.osc('sine', 3.97, 0.14); e = { a: 0.002, d: 0.7, s: 0.004, r: 0.12, peak: 0.8 }; break;
    case 'bel': o.osc('sine', 1, 0.5); o.osc('sine', 2.76, 0.2); o.osc('sine', 5.4, 0.1); o.osc('sine', 8.9, 0.04); e = { a: 0.002, d: 2.0, s: 0.01, r: 0.5, peak: 0.55 }; break;
    case 'fluit': { const x = o.osc('sine', 1, 0.5); o.osc('sine', 2, 0.08); o.vibrato(x, 5, 9, 0.3); o.noise('bandpass', f * 2, 1.5, 0.05, 0.25); e = { a: 0.06, d: 0.1, s: 0.85, r: 0.12, peak: 0.55 }; break; }
    case 'koper': { const lp = o.filt('lowpass', 800, 1); o.sweep(lp, 700, 3200, 0.12); o.osc('sawtooth', 1, 0.3, -4, lp); o.osc('sawtooth', 1, 0.3, 4, lp); e = { a: 0.04, d: 0.2, s: 0.8, r: 0.12, peak: 0.45 }; break; }
    default: o.osc('triangle', 1, 0.6); e = { a: 0.01, d: 0.5, s: 0.3, r: 0.2, peak: 0.5 };
  }
  const peak = e.peak * Math.max(0.05, Math.min(1.2, vel));
  return { amp, oscs, srcs, e: { ...e, peak } };
}

// Noot met bekende lengte (voor sequencers, afspelen). Geeft de totale eindtijd terug.
export function playNote(c, dest, id, f, t, dur, vel = 1, nb = null) {
  const v = build(c, dest, id, f, t, vel, nb), { a, d, s, r, peak } = v.e, g = v.amp.gain;
  const hold = Math.max(0.03, dur), sus = Math.max(0.0005, peak * s);
  g.setValueAtTime(0.0001, t);
  g.linearRampToValueAtTime(peak, t + Math.min(a, hold));
  let lvl = peak;
  if (hold > a) {
    const dd = Math.min(d, hold - a);
    lvl = Math.max(sus, peak * Math.pow(sus / peak, dd / d));
    g.exponentialRampToValueAtTime(lvl, t + a + dd);
  } else lvl = peak * (hold / a);
  const end = t + hold;
  g.setValueAtTime(Math.max(0.0005, lvl), end);
  g.exponentialRampToValueAtTime(0.0001, end + r);
  v.oscs.forEach((x) => x.stop(end + r + 0.05));
  return end + r + 0.05;
}

// Noot die aanhoudt tot je loslaat (toetsen). Geeft een functie terug die hem laat uitklinken.
export function startNote(c, dest, id, f, vel = 1, nb = null, at = null) {
  const t = at == null ? c.currentTime : at;
  const v = build(c, dest, id, f, t, vel, nb), { a, d, s, r, peak } = v.e, g = v.amp.gain, sus = Math.max(0.0005, peak * s);
  g.setValueAtTime(0.0001, t); g.linearRampToValueAtTime(peak, t + a); g.exponentialRampToValueAtTime(sus, t + a + d);
  let stopped = false;
  return function release() {
    if (stopped) return; stopped = true;
    const n = c.currentTime;
    try { const cur = Math.max(0.0005, g.value); g.cancelScheduledValues(n); g.setValueAtTime(cur, n); g.exponentialRampToValueAtTime(0.0001, n + r); } catch { /* ok */ }
    try { v.oscs.forEach((x) => x.stop(n + r + 0.05)); } catch { /* ok */ }
  };
}

// ---- drums ----
export function playDrum(c, dest, nb, id, t, vel = 1) {
  const V = Math.max(0.05, Math.min(1.3, vel));
  const env = (g, at, peak, dur) => { g.gain.setValueAtTime(peak * V, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur); };
  const noise = (type, freq, q, vol, dur, at = t, out = dest) => {
    if (!nb) return;
    const s = c.createBufferSource(); s.buffer = nb; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); s.connect(f); f.connect(g); g.connect(out); env(g, at, vol, dur); s.start(at); s.stop(at + dur + 0.05);
  };
  const tone = (type, f0, f1, fdur, vol, dur, at = t) => {
    const o = c.createOscillator(), g = c.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, at); o.frequency.exponentialRampToValueAtTime(f1, at + fdur);
    o.connect(g); g.connect(dest); env(g, at, vol, dur); o.start(at); o.stop(at + dur + 0.05);
  };
  switch (id) {
    case 'kick': tone('sine', 160, 42, 0.12, 1.0, 0.5); noise('lowpass', 800, 0.7, 0.15, 0.02); break;
    case 'boem': tone('sine', 110, 36, 0.35, 1.1, 1.0); tone('triangle', 220, 60, 0.05, 0.25, 0.1); break;
    case 'snare': tone('triangle', 200, 140, 0.08, 0.5, 0.14); noise('highpass', 1800, 0.7, 0.6, 0.22); break;
    case 'rim': tone('square', 820, 600, 0.02, 0.28, 0.04); noise('bandpass', 2400, 2, 0.35, 0.03); break;
    case 'hat': noise('highpass', 7500, 0.7, 0.45, 0.05); break;
    case 'open': noise('highpass', 6500, 0.7, 0.4, 0.35); break;
    case 'clap': [0, 0.011, 0.022].forEach((o) => noise('bandpass', 1500, 1.2, 0.55, 0.02, t + o)); noise('bandpass', 1400, 1.0, 0.5, 0.18, t + 0.033); break;
    case 'tom': tone('sine', 220, 100, 0.15, 0.85, 0.4); break;
    case 'cowbell': tone('square', 560, 556, 0.1, 0.2, 0.28); tone('square', 845, 840, 0.1, 0.2, 0.28); break;
    case 'crash': noise('highpass', 5200, 0.5, 0.45, 1.2); noise('bandpass', 9000, 1, 0.25, 0.8); break;
    case 'shaker': noise('bandpass', 7000, 1.6, 0.35, 0.07); break;
    case 'conga': tone('sine', 330, 250, 0.06, 0.8, 0.22); noise('bandpass', 1800, 2, 0.12, 0.02); break;
    default: break;
  }
}

// kort klikje (metronoom)
export function click(c, dest, t, accent) {
  const o = c.createOscillator(), g = c.createGain(); o.type = 'square'; o.frequency.value = accent ? 1700 : 1100;
  o.connect(g); g.connect(dest); g.gain.setValueAtTime(accent ? 0.28 : 0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); o.start(t); o.stop(t + 0.07);
}

// ---- WAV-encoder (16-bit PCM) ----
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

// De audio-context aanmaken (Safari: webkitAudioContext).
export function newAudio() {
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  return AC ? new AC() : null;
}
