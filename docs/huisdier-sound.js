// Huisdier 2.0 - geluiden. Alles gesynthetiseerd met WebAudio, geen samples.
// Contract: createSound() -> { unlock, setEnabled, setVolume, isEnabled, play, startLoop, stopLoop, destroy }

const NOTE0 = 261.63; // C4
const nt = (s) => NOTE0 * Math.pow(2, s / 12);
const rnd = (a, b) => a + Math.random() * (b - a);

export const SOUND_NAMES = [
  'tik', 'terug', 'munt', 'koop', 'eten', 'drinken', 'plons', 'poets', 'slaap', 'wakker',
  'kraak', 'uitgekomen', 'level', 'prestatie', 'knuffel', 'cadeau', 'fout', 'klaar', 'ziek',
  'beter', 'plant', 'oogst', 'koken', 'meubel', 'help', 'stem',
  // interactieve meubels
  'tv', 'bladzij', 'piano', 'sprong', 'bubbel', 'sissen', 'knetter', 'muziek', 'schommel',
  'xyl', 'trommel', 'ster', 'spinnen', 'ploep', 'sproeien',
];
export const SPECIES = ['kat', 'hond', 'konijn', 'panda', 'eend', 'kikker', 'eenhoorn', 'draak'];
export const LOOP_NAMES = ['wiegenlied', 'tuin', 'regen'];

// ---------- low level helpers (c = { ctx, out, T, noiseBuf }) ----------

function tone(c, o) {
  const ctx = c.ctx;
  const T = c.T + (o.t || 0);
  const d = o.d || 0.2;
  const v = o.v == null ? 0.15 : o.v;
  const a = o.a == null ? 0.006 : o.a;
  const osc = ctx.createOscillator();
  osc.type = o.type || 'sine';
  const pf = c.pf || 1;
  osc.frequency.setValueAtTime(o.f * pf, T);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to * pf), T + d);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, T);
  g.gain.linearRampToValueAtTime(v, T + a);
  g.gain.exponentialRampToValueAtTime(0.0001, T + d);
  let node = osc;
  if (o.lp) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = o.lp;
    f.Q.value = o.q || 0.7;
    node.connect(f);
    node = f;
  } else if (o.bp) {
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = o.bp;
    f.Q.value = o.q || 2;
    node.connect(f);
    node = f;
  }
  node.connect(g);
  g.connect(c.out);
  const extras = [];
  if (o.vib) {
    const l = ctx.createOscillator();
    const lg = ctx.createGain();
    l.frequency.value = o.vib[0];
    lg.gain.value = o.vib[1];
    l.connect(lg);
    lg.connect(osc.frequency);
    l.start(T);
    l.stop(T + d + 0.06);
    extras.push(l);
  }
  if (o.trem) {
    const l = ctx.createOscillator();
    const lg = ctx.createGain();
    l.frequency.value = o.trem[0];
    lg.gain.value = v * o.trem[1];
    l.connect(lg);
    lg.connect(g.gain);
    l.start(T);
    l.stop(T + d + 0.06);
    extras.push(l);
  }
  osc.start(T);
  osc.stop(T + d + 0.06);
  osc.onended = () => {
    try { g.disconnect(); } catch (e) { /* noop */ }
  };
}

function noise(c, o) {
  const ctx = c.ctx;
  const T = c.T + (o.t || 0);
  const d = o.d || 0.1;
  const v = o.v == null ? 0.1 : o.v;
  const a = o.a == null ? 0.004 : o.a;
  const src = ctx.createBufferSource();
  src.buffer = c.noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = o.type || 'bandpass';
  f.frequency.setValueAtTime(o.f || 1500, T);
  if (o.to) f.frequency.exponentialRampToValueAtTime(Math.max(40, o.to), T + d);
  f.Q.value = o.q || 0.8;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, T);
  g.gain.linearRampToValueAtTime(v, T + a);
  g.gain.exponentialRampToValueAtTime(0.0001, T + d);
  src.connect(f);
  f.connect(g);
  g.connect(c.out);
  src.start(T, Math.random() * 0.5);
  src.stop(T + d + 0.05);
  src.onended = () => {
    try { g.disconnect(); } catch (e) { /* noop */ }
  };
}

// zacht belletje / speeldoos-achtig
function bell(c, f, t, d, v) {
  d = d || 0.7;
  v = v == null ? 0.12 : v;
  tone(c, { f, t, d, v, a: 0.004, lp: 6000 });
  tone(c, { f: f * 2.01, t, d: d * 0.6, v: v * 0.3, a: 0.003, lp: 6000 });
  tone(c, { f: f * 3.5, t, d: d * 0.25, v: v * 0.1, a: 0.002, lp: 6000 });
}

function bubble(c, t, v) {
  const f = rnd(350, 900);
  tone(c, { f, to: f * rnd(1.4, 2), t, d: rnd(0.05, 0.1), v: v == null ? 0.08 : v, a: 0.004, lp: 3000 });
}

function jingle(c, semis, step, v, type) {
  semis.forEach((s, i) => {
    const f = nt(s);
    tone(c, { f, t: i * step, d: step * 2.2, v: v || 0.11, type: type || 'triangle', lp: 3200, a: 0.008 });
    tone(c, { f: f * 2, t: i * step, d: step * 1.2, v: (v || 0.11) * 0.25, lp: 4000 });
  });
}

// ---------- moods ----------

function moodOf(m) {
  switch (m) {
    case 'blij': case 'happy': case 'vrolijk':
      return { pm: 1.15, tm: 0.8, kind: 'blij' };
    case 'verdrietig': case 'sad': case 'droevig': case 'ziek':
      return { pm: 0.85, tm: 1.35, kind: 'verdrietig' };
    case 'moe': case 'tired': case 'slaperig':
      return { pm: 0.9, tm: 1.5, kind: 'moe' };
    default:
      return { pm: 1, tm: 1, kind: 'neutraal' };
  }
}

// ---------- dierengeluiden ----------

const VOICES = {
  kat(c, pm, tm, kind) {
    const b = 560 * pm;
    const d = 0.5 * tm;
    tone(c, { f: b, to: b * 1.35, d: d * 0.4, v: 0.13, type: 'sawtooth', bp: 1400 * pm, q: 1.2, a: 0.03 });
    tone(c, { f: b * 1.35, to: b * 0.8, t: d * 0.38, d: d * 0.62, v: 0.12, type: 'sawtooth', bp: 1100 * pm, q: 1.2, a: 0.02, vib: [6, 8] });
    if (kind === 'blij') tone(c, { f: b * 1.5, to: b * 1.2, t: d + 0.05, d: 0.18, v: 0.07, type: 'sawtooth', bp: 1500, a: 0.01 });
  },
  hond(c, pm, tm, kind) {
    const n = kind === 'blij' ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const t = i * 0.2 * tm;
      noise(c, { t, d: 0.05, v: 0.1, f: 1200, q: 0.9 });
      tone(c, { f: 330 * pm, to: 190 * pm, t, d: 0.16 * tm, v: 0.15, type: 'sawtooth', lp: 900, a: 0.008 });
    }
    if (kind === 'verdrietig') tone(c, { f: 420 * pm, to: 260 * pm, t: 0.25, d: 0.5, v: 0.08, lp: 900, vib: [5, 6], a: 0.05 });
  },
  konijn(c, pm, tm) {
    tone(c, { f: 130 * pm, t: 0, d: 0.28 * tm, v: 0.09, type: 'triangle', lp: 400, trem: [26, 0.6], a: 0.02 });
    tone(c, { f: 950 * pm, to: 1250 * pm, t: 0.08 * tm, d: 0.09 * tm, v: 0.08, lp: 2500, a: 0.005 });
    tone(c, { f: 1100 * pm, to: 900 * pm, t: 0.22 * tm, d: 0.08 * tm, v: 0.06, lp: 2500, a: 0.005 });
  },
  panda(c, pm, tm) {
    const d = 0.7 * tm;
    tone(c, { f: 150 * pm, to: 125 * pm, d, v: 0.16, type: 'triangle', lp: 420, vib: [5, 3], a: 0.12 });
    tone(c, { f: 300 * pm, to: 250 * pm, d: d * 0.8, v: 0.04, lp: 600, a: 0.12 });
    noise(c, { d, v: 0.015, type: 'lowpass', f: 400, a: 0.12 });
  },
  eend(c, pm, tm, kind) {
    const n = kind === 'verdrietig' ? 1 : 2;
    for (let i = 0; i < n; i++) {
      const t = i * 0.2 * tm;
      tone(c, { f: 460 * pm, to: 320 * pm, t, d: 0.14 * tm, v: 0.14, type: 'sawtooth', bp: 1100, q: 3, a: 0.01 });
      tone(c, { f: 920 * pm, to: 640 * pm, t, d: 0.1 * tm, v: 0.03, type: 'square', lp: 1500, a: 0.01 });
    }
  },
  kikker(c, pm, tm, kind) {
    const n = kind === 'blij' ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const t = i * 0.17 * tm;
      tone(c, { f: 150 * pm, to: 230 * pm, t, d: 0.15 * tm, v: 0.14, type: 'square', lp: 650, q: 1.5, trem: [38, 0.7], a: 0.01 });
    }
  },
  eenhoorn(c, pm, tm) {
    const b = 640 * pm;
    const d = 0.55 * tm;
    tone(c, { f: b, to: b * 1.5, d: d * 0.35, v: 0.09, type: 'triangle', lp: 2400, vib: [16, 14], a: 0.03 });
    tone(c, { f: b * 1.5, to: b * 0.85, t: d * 0.33, d: d * 0.67, v: 0.09, type: 'triangle', lp: 2200, vib: [14, 14], a: 0.01 });
    [12, 16, 19, 24, 28].forEach((s, i) => {
      bell(c, nt(s) * pm, d * 0.55 + i * 0.07 * tm, 0.5, 0.05);
    });
  },
  draak(c, pm, tm, kind) {
    const d = 0.75 * tm;
    tone(c, { f: 78 * pm, to: 62 * pm, d, v: 0.2, type: 'sawtooth', lp: 260, trem: [24, 0.6], a: 0.08 });
    tone(c, { f: 156 * pm, to: 120 * pm, d: d * 0.8, v: 0.04, type: 'triangle', lp: 400, trem: [24, 0.5], a: 0.08 });
    if (kind !== 'verdrietig') {
      noise(c, { t: d * 0.55, d: 0.4, v: 0.05, type: 'lowpass', f: 500, to: 1100, q: 0.6, a: 0.12 });
      tone(c, { f: 200 * pm, to: 330 * pm, t: d * 0.55, d: 0.35, v: 0.03, lp: 700, a: 0.12 });
    }
  },
};

function yawn(c, species, pm) {
  const base = ({ kat: 520, hond: 300, konijn: 380, panda: 180, eend: 400, kikker: 250, eenhoorn: 500, draak: 120 })[species] || 350;
  const b = base * pm;
  tone(c, { f: b * 0.9, to: b * 1.25, d: 0.5, v: 0.1, type: 'triangle', lp: 900, a: 0.25, vib: [4, 4] });
  tone(c, { f: b * 1.25, to: b * 0.55, t: 0.5, d: 0.75, v: 0.1, type: 'triangle', lp: 800, a: 0.02, vib: [4, 4] });
  noise(c, { t: 0.1, d: 1.1, v: 0.012, type: 'lowpass', f: 700, a: 0.3 });
}

function stem(c, p) {
  const species = p.species;
  const m = moodOf(p.mood);
  const pm = (p.pitch || 1) * (m.kind === 'moe' ? 1 : m.pm);
  if (m.kind === 'moe') {
    yawn(c, species, p.pitch || 1);
    return;
  }
  const fn = VOICES[species] || VOICES.kat;
  fn(c, pm, m.tm, m.kind);
  if (m.kind === 'verdrietig') {
    // klein zuchtje erachteraan
    tone(c, { f: 300 * pm, to: 200 * pm, t: 0.5 * m.tm, d: 0.35, v: 0.04, lp: 700, a: 0.08 });
  }
}

// ---------- effect-geluiden ----------

const SOUNDS = {
  tik(c) {
    tone(c, { f: 1300, to: 950, d: 0.04, v: 0.1, lp: 3000, a: 0.002 });
  },
  terug(c) {
    tone(c, { f: 820, to: 720, d: 0.05, v: 0.09, lp: 2800, a: 0.002 });
    tone(c, { f: 620, to: 480, t: 0.05, d: 0.07, v: 0.09, lp: 2800, a: 0.002 });
  },
  munt(c) {
    [0, 0.07, 0.15].forEach((t, i) => {
      const f = [1760, 2349, 2093][i];
      tone(c, { f, t, d: 0.3, v: 0.07, lp: 5000, a: 0.002 });
      tone(c, { f: f * 2.4, t, d: 0.12, v: 0.02, lp: 6000, a: 0.002 });
    });
    noise(c, { d: 0.04, v: 0.02, f: 4000, q: 1 });
  },
  koop(c) {
    noise(c, { d: 0.05, v: 0.05, f: 2500, q: 1 });
    bell(c, 1568, 0.05, 0.35, 0.09);
    bell(c, 2093, 0.2, 0.9, 0.1);
  },
  eten(c) {
    [0, 0.2].forEach((t) => {
      noise(c, { t, d: 0.06, v: 0.09, f: 2600, q: 0.9, a: 0.002 });
      noise(c, { t: t + 0.05, d: 0.05, v: 0.06, f: 3200, q: 1.1, a: 0.002 });
      noise(c, { t: t + 0.09, d: 0.04, v: 0.04, f: 2200, q: 1.1, a: 0.002 });
      tone(c, { f: 190, to: 140, t, d: 0.09, v: 0.07, type: 'triangle', lp: 500, a: 0.004 });
    });
  },
  drinken(c) {
    [0, 0.17, 0.34].forEach((t, i) => {
      tone(c, { f: 280 + i * 30, to: 520 + i * 40, t, d: 0.12, v: 0.09, lp: 1500, a: 0.01 });
    });
    bubble(c, 0.5, 0.05);
  },
  plons(c) {
    noise(c, { d: 0.35, v: 0.06, type: 'lowpass', f: 2800, to: 500, q: 0.7, a: 0.01 });
    tone(c, { f: 220, to: 120, d: 0.15, v: 0.1, lp: 600, a: 0.005 });
    for (let i = 0; i < 6; i++) bubble(c, 0.12 + i * 0.09 + rnd(0, 0.04), 0.07);
  },
  poets(c) {
    [0, 0.17, 0.34].forEach((t) => {
      noise(c, { t, d: 0.15, v: 0.05, f: 3000, to: 5000, q: 0.8, a: 0.04 });
    });
    bell(c, 2637, 0.55, 0.5, 0.05);
  },
  slaap(c) {
    [nt(7), nt(4), nt(0), nt(-5)].forEach((f, i) => {
      tone(c, { f, t: i * 0.3, d: 0.7, v: 0.09, lp: 1400, a: 0.05, vib: [4, 2] });
    });
  },
  wakker(c) {
    [nt(-5), nt(0), nt(4)].forEach((f, i) => {
      tone(c, { f, t: i * 0.11, d: 0.3, v: 0.09, type: 'triangle', lp: 2200, a: 0.01 });
    });
    bell(c, nt(16), 0.35, 0.5, 0.06);
  },
  kraak(c) {
    [0, 0.11, 0.2, 0.33].forEach((t, i) => {
      noise(c, { t, d: 0.03, v: 0.1 - i * 0.012, f: 1800 + i * 300, q: 1.5, a: 0.001 });
      tone(c, { f: 900 - i * 100, to: 500, t, d: 0.03, v: 0.04, lp: 1800, a: 0.001 });
    });
  },
  uitgekomen(c) {
    jingle(c, [0, 4, 7, 12, 16, 19], 0.1, 0.1);
    bell(c, nt(24), 0.62, 0.9, 0.07);
  },
  level(c) {
    jingle(c, [0, 4, 7, 12], 0.12, 0.11);
    bell(c, nt(24), 0.5, 0.8, 0.06);
  },
  prestatie(c) {
    const seq = [[0, 0.0], [0, 0.14], [0, 0.28], [5, 0.42], [4, 0.7], [7, 0.88]];
    seq.forEach(([s, t], i) => {
      const d = i >= 3 ? 0.3 : 0.14;
      tone(c, { f: nt(s + 7), t, d: d + 0.1, v: 0.09, type: 'triangle', lp: 2400, a: 0.01 });
      tone(c, { f: nt(s + 14), t, d: d + 0.1, v: 0.045, type: 'square', lp: 1800, a: 0.01 });
    });
    [0, 4, 7, 12].forEach((s) => tone(c, { f: nt(s + 12), t: 1.05, d: 0.9, v: 0.05, type: 'triangle', lp: 2200, a: 0.02 }));
    bell(c, nt(31), 1.1, 1, 0.05);
  },
  knuffel(c) {
    [0, 4, 7].forEach((s, i) => {
      tone(c, { f: nt(s - 12), t: i * 0.05, d: 0.9, v: 0.09, lp: 700, a: 0.18, vib: [5, 2] });
    });
    tone(c, { f: nt(0), d: 0.8, v: 0.04, type: 'triangle', lp: 900, a: 0.2 });
  },
  cadeau(c) {
    noise(c, { d: 0.25, v: 0.025, f: 1500, to: 5000, a: 0.1 });
    [4, 7, 11, 16, 19].forEach((s, i) => bell(c, nt(s + 12), 0.2 + i * 0.09, 0.6, 0.08));
  },
  fout(c) {
    tone(c, { f: 300, to: 130, d: 0.28, v: 0.14, lp: 700, vib: [14, 10], a: 0.008 });
  },
  klaar(c) {
    bell(c, nt(19), 0, 0.9, 0.11);
    bell(c, nt(24), 0.12, 1, 0.08);
  },
  ziek(c) {
    tone(c, { f: 420, to: 310, d: 0.55, v: 0.1, type: 'triangle', lp: 900, vib: [6, 12], a: 0.05 });
    tone(c, { f: 330, to: 230, t: 0.5, d: 0.6, v: 0.09, type: 'triangle', lp: 800, vib: [6, 12], a: 0.05 });
  },
  beter(c) {
    noise(c, { d: 0.25, v: 0.015, type: 'lowpass', f: 600, a: 0.1 });
    bell(c, nt(12), 0.15, 0.8, 0.1);
    bell(c, nt(19), 0.33, 1.0, 0.1);
  },
  plant(c) {
    noise(c, { d: 0.18, v: 0.1, type: 'lowpass', f: 450, to: 200, q: 0.6, a: 0.005 });
    tone(c, { f: 150, to: 70, d: 0.18, v: 0.14, lp: 400, a: 0.004 });
    bubble(c, 0.12, 0.04);
  },
  oogst(c) {
    tone(c, { f: 380, to: 900, d: 0.09, v: 0.12, lp: 2500, a: 0.004 });
    noise(c, { t: 0.08, d: 0.03, v: 0.05, f: 3000, q: 1 });
    bell(c, nt(19), 0.1, 0.5, 0.07);
  },
  koken(c) {
    for (let i = 0; i < 9; i++) bubble(c, i * 0.1 + rnd(0, 0.06), 0.06);
    noise(c, { d: 1.0, v: 0.012, type: 'lowpass', f: 900, a: 0.2 });
  },
  meubel(c) {
    tone(c, { f: 320, to: 170, d: 0.1, v: 0.16, lp: 900, a: 0.002 });
    noise(c, { d: 0.03, v: 0.06, f: 900, q: 1, a: 0.001 });
  },
  // ---- interactieve meubels ----
  tv(c) {
    noise(c, { d: 0.22, v: 0.05, f: 3200, q: 0.5, a: 0.01 });
    [0, 5, 9, 7].forEach((s, i) => tone(c, { f: nt(s + 12), t: 0.25 + i * 0.12, d: 0.14, v: 0.07, type: 'square', lp: 2000, a: 0.005 }));
  },
  bladzij(c) {
    noise(c, { d: 0.16, v: 0.07, f: 2200, to: 5000, q: 0.6, a: 0.02 });
    noise(c, { t: 0.32, d: 0.14, v: 0.06, f: 2000, to: 4500, q: 0.6, a: 0.02 });
    tone(c, { f: nt(12), t: 0.5, d: 0.5, v: 0.04, lp: 2400, a: 0.02 });
  },
  piano(c) {
    [0, 4, 7, 12, 7, 9, 12, 16].forEach((s, i) => {
      tone(c, { f: nt(s), t: i * 0.11, d: 0.7, v: 0.1, type: 'triangle', lp: 2600, a: 0.004 });
      tone(c, { f: nt(s) * 2, t: i * 0.11, d: 0.3, v: 0.03, lp: 3500, a: 0.003 });
    });
  },
  sprong(c) {
    [0, 0.32, 0.62].forEach((t, i) => {
      tone(c, { f: 230 - i * 20, to: 620 - i * 60, t, d: 0.22, v: 0.12, lp: 1800, a: 0.01, vib: [18, 8] });
    });
    noise(c, { t: 0.9, d: 0.06, v: 0.04, f: 900, q: 1 });
  },
  bubbel(c) {
    for (let i = 0; i < 12; i++) bubble(c, i * 0.07 + rnd(0, 0.05), 0.07);
    noise(c, { d: 0.9, v: 0.012, type: 'lowpass', f: 1200, a: 0.1 });
  },
  sissen(c) {
    noise(c, { d: 0.8, v: 0.06, type: 'highpass', f: 3500, q: 0.6, a: 0.03 });
    noise(c, { t: 0.1, d: 0.5, v: 0.04, f: 5200, q: 1, a: 0.04 });
    bell(c, nt(24), 0.85, 0.5, 0.06);
  },
  knetter(c) {
    for (let i = 0; i < 9; i++) noise(c, { t: i * 0.09 + rnd(0, 0.06), d: 0.03, v: rnd(0.04, 0.09), f: rnd(1500, 4000), q: 1.4, a: 0.001 });
    noise(c, { d: 0.9, v: 0.02, type: 'lowpass', f: 500, a: 0.15 });
  },
  muziek(c) {
    [0, 4, 7, 4, 9, 7, 12].forEach((s, i) => {
      tone(c, { f: nt(s), t: i * 0.14, d: 0.22, v: 0.09, type: 'square', lp: 1600, a: 0.006 });
      tone(c, { f: nt(s - 12), t: i * 0.14, d: 0.22, v: 0.05, type: 'triangle', lp: 800, a: 0.006 });
    });
  },
  schommel(c) {
    [0, 0.5].forEach((t, i) => {
      noise(c, { t, d: 0.45, v: 0.035, f: 500 + i * 200, to: 1100 - i * 400, q: 2, a: 0.1 });
      tone(c, { f: 420 + i * 40, to: 560 - i * 60, t, d: 0.45, v: 0.025, type: 'triangle', lp: 1000, a: 0.1, vib: [9, 6] });
    });
  },
  xyl(c) {
    [0, 2, 4, 7, 9, 12].forEach((s, i) => bell(c, nt(s + 19), i * 0.09, 0.45, 0.09));
  },
  trommel(c) {
    [0, 0.14, 0.28, 0.42, 0.56].forEach((t, i) => {
      tone(c, { f: i % 2 ? 220 : 160, to: 70, t, d: 0.14, v: 0.17, lp: 700, a: 0.002 });
      noise(c, { t, d: 0.05, v: 0.06, f: 2600, q: 0.8, a: 0.001 });
    });
    noise(c, { t: 0.7, d: 0.4, v: 0.05, f: 6000, q: 1.2, a: 0.01 });
  },
  ster(c) {
    [0, 7, 12, 16, 19].forEach((s, i) => bell(c, nt(s + 24), i * 0.13, 0.7, 0.06));
    tone(c, { f: nt(0), d: 1.1, v: 0.03, lp: 700, a: 0.3 });
  },
  spinnen(c) {
    tone(c, { f: 70, to: 62, d: 1.4, v: 0.1, type: 'sawtooth', lp: 260, a: 0.25, trem: [22, 0.7] });
    tone(c, { f: 140, to: 124, d: 1.4, v: 0.04, lp: 400, a: 0.25, trem: [22, 0.7] });
  },
  ploep(c) {
    tone(c, { f: 380, to: 900, d: 0.1, v: 0.12, lp: 2000, a: 0.004 });
    bell(c, nt(19), 0.1, 0.4, 0.06);
  },
  sproeien(c) {
    noise(c, { d: 0.9, v: 0.05, f: 2600, to: 1200, q: 0.7, a: 0.08 });
    for (let i = 0; i < 4; i++) bubble(c, 0.5 + i * 0.1, 0.04);
  },
  help(c) {
    bell(c, nt(16), 0, 0.7, 0.12);
    bell(c, nt(12), 0.3, 1.0, 0.12);
  },
};

// ---------- loops ----------

// "Altijd bij jou" achtige rustige speeldoos-melodie (eigen compositie, pentatonisch)
const LULLABY = [
  [7, 1], [4, 1], [0, 1], [4, 1], [7, 1], [12, 1], [9, 2],
  [9, 1], [7, 1], [4, 1], [7, 1], [9, 1], [7, 1], [4, 2],
  [2, 1], [4, 1], [7, 1], [4, 1], [2, 1], [0, 1], [-3, 2],
  [0, 1], [4, 1], [7, 1], [4, 1], [0, 3],
];

function makeLoop(env, name) {
  const { ctx, out } = env;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2);
  g.connect(out);
  const L = { timers: new Set(), nodes: [], stopped: false };
  const c = { ctx, out: g, noiseBuf: env.noiseBuf, T: 0 };
  const later = (fn, ms) => {
    const id = setTimeout(() => {
      L.timers.delete(id);
      if (!L.stopped) {
        try { fn(); } catch (e) { /* noop */ }
      }
    }, ms);
    L.timers.add(id);
  };

  if (name === 'wiegenlied') {
    const step = 0.62;
    const phrase = () => {
      c.T = ctx.currentTime + 0.05;
      let t = 0;
      LULLABY.forEach(([s, beats]) => {
        bell(c, nt(s + 12), t, 1.3, 0.055);
        t += beats * step;
      });
      // zachte pad onder de melodie
      tone(c, { f: nt(-12), t: 0, d: t * 0.5, v: 0.02, lp: 400, a: 0.8 });
      tone(c, { f: nt(-5), t: t * 0.5, d: t * 0.5, v: 0.02, lp: 400, a: 0.8 });
      later(phrase, (t + 1.2) * 1000);
    };
    phrase();
  } else if (name === 'tuin') {
    const chirp = () => {
      c.T = ctx.currentTime + 0.02;
      const base = rnd(2400, 3800);
      const n = 1 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) {
        const f = base * rnd(0.9, 1.25);
        tone(c, { f, to: f * rnd(0.75, 1.5), t: i * 0.11, d: 0.07, v: 0.018, lp: 5000, a: 0.008 });
      }
      later(chirp, rnd(1500, 4500));
    };
    const rustle = () => {
      c.T = ctx.currentTime + 0.02;
      noise(c, { d: 2.5, v: 0.006, type: 'lowpass', f: 700, to: 1200, a: 1 });
      later(rustle, 3500);
    };
    chirp();
    rustle();
  } else if (name === 'regen') {
    const src = ctx.createBufferSource();
    src.buffer = env.noiseBuf;
    src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 500;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    const rg = ctx.createGain();
    rg.gain.value = 0.045;
    src.connect(hp);
    hp.connect(lp);
    lp.connect(rg);
    rg.connect(g);
    src.start();
    L.nodes.push(src);
    const drop = () => {
      c.T = ctx.currentTime + 0.02;
      const f = rnd(900, 2200);
      tone(c, { f, to: f * 0.7, d: 0.05, v: 0.012, lp: 3000, a: 0.003 });
      later(drop, rnd(150, 700));
    };
    drop();
  } else {
    return null;
  }

  L.stop = () => {
    L.stopped = true;
    L.timers.forEach((id) => clearTimeout(id));
    L.timers.clear();
    try {
      const t = ctx.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(Math.max(0.0001, g.gain.value || 1), t);
      g.gain.linearRampToValueAtTime(0.0001, t + 0.4);
    } catch (e) { /* noop */ }
    const nodes = L.nodes;
    const id = setTimeout(() => {
      nodes.forEach((n) => { try { n.stop(); } catch (e) { /* noop */ } });
      try { g.disconnect(); } catch (e) { /* noop */ }
    }, 500);
    return id;
  };
  return L;
}

// ---------- publieke API ----------

export function createSound() {
  let ctx = null;
  let master = null;
  let comp = null;
  let bus = null;
  let noiseBuf = null;
  let enabled = true;
  let volume = 0.8;
  let destroyed = false;
  const loops = new Map(); // name -> loop object (actief)
  const wanted = new Set(); // gewenste loops (ook bij uitgeschakeld)
  const closing = new Set(); // opruim-timers van gestopte loops

  function applyVolume() {
    try {
      if (master) {
        const v = enabled ? 0.6 * volume : 0;
        master.gain.setTargetAtTime(v, ctx.currentTime, 0.02);
      }
    } catch (e) { /* noop */ }
  }

  function build() {
    if (ctx || destroyed) return;
    try {
      const AC = (typeof globalThis !== 'undefined') && (globalThis.AudioContext || globalThis.webkitAudioContext);
      if (!AC) return;
      ctx = new AC();
      comp = ctx.createDynamicsCompressor();
      try {
        comp.threshold.value = -18;
        comp.knee.value = 24;
        comp.ratio.value = 6;
        comp.attack.value = 0.005;
        comp.release.value = 0.2;
      } catch (e) { /* noop */ }
      master = ctx.createGain();
      master.gain.value = enabled ? 0.6 * volume : 0;
      bus = ctx.createGain();
      bus.gain.value = 1;
      bus.connect(comp);
      comp.connect(master);
      master.connect(ctx.destination);
      const len = Math.floor(ctx.sampleRate || 44100);
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate || 44100);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    } catch (e) {
      ctx = null;
    }
  }

  function startLoops() {
    wanted.forEach((n) => {
      if (!loops.has(n)) {
        try {
          const L = makeLoop({ ctx, out: bus, noiseBuf }, n);
          if (L) loops.set(n, L);
        } catch (e) { /* noop */ }
      }
    });
  }

  function haltLoop(name) {
    const L = loops.get(name);
    if (!L) return;
    loops.delete(name);
    try {
      const id = L.stop();
      if (id) {
        closing.add(id);
        setTimeout(() => closing.delete(id), 600);
      }
    } catch (e) { /* noop */ }
  }

  const api = {
    unlock() {
      try {
        if (destroyed) return;
        build();
        if (!ctx) return;
        if (ctx.state === 'suspended' && ctx.resume) {
          const r = ctx.resume();
          if (r && r.catch) r.catch(() => {});
        }
        if (enabled) startLoops();
      } catch (e) { /* noop */ }
    },
    setEnabled(on) {
      try {
        enabled = !!on;
        applyVolume();
        if (!enabled) {
          Array.from(loops.keys()).forEach(haltLoop);
        } else if (ctx) {
          startLoops();
        }
      } catch (e) { /* noop */ }
    },
    setVolume(v) {
      try {
        v = Number(v);
        if (!isFinite(v)) return;
        volume = Math.max(0, Math.min(1, v));
        applyVolume();
      } catch (e) { /* noop */ }
    },
    isEnabled() { return enabled; },
    play(name, opts) {
      try {
        if (!enabled || destroyed) return;
        if (!ctx) build();
        if (!ctx) return;
        if (ctx.state === 'suspended' && ctx.resume) {
          const r = ctx.resume();
          if (r && r.catch) r.catch(() => {});
        }
        const o = opts || {};
        const pitch = Math.max(0.7, Math.min(1.4, Number(o.pitch) || 1));
        const c = { ctx, out: bus, noiseBuf, T: ctx.currentTime + 0.02 };
        if (name === 'stem') {
          stem(c, { species: o.species, pitch, mood: o.mood });
          return;
        }
        const fn = SOUNDS[name];
        if (!fn) return;
        c.pf = pitch;
        fn(c);
      } catch (e) { /* noop */ }
    },
    startLoop(name) {
      try {
        if (destroyed || LOOP_NAMES.indexOf(name) < 0) return;
        wanted.add(name);
        if (!ctx || !enabled) return;
        if (loops.has(name)) return;
        const L = makeLoop({ ctx, out: bus, noiseBuf }, name);
        if (L) loops.set(name, L);
      } catch (e) { /* noop */ }
    },
    stopLoop(name) {
      try {
        wanted.delete(name);
        haltLoop(name);
      } catch (e) { /* noop */ }
    },
    destroy() {
      try {
        destroyed = true;
        wanted.clear();
        Array.from(loops.keys()).forEach(haltLoop);
        closing.forEach((id) => clearTimeout(id));
        closing.clear();
        if (ctx && ctx.close) {
          const r = ctx.close();
          if (r && r.catch) r.catch(() => {});
        }
      } catch (e) { /* noop */ }
      ctx = null;
      master = null;
      comp = null;
      bus = null;
    },
  };
  return api;
}

export default createSound;
