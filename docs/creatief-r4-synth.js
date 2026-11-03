// Ronde 4 (Creatief): 10 extra instrumenten en 6 extra drumgeluiden voor Muziek en Piano.
// Geen imports (om cirkels te voorkomen): music-synth.js geeft de bouwstenen door.

export const R4_INSTRUMENTS = [
  { id: 'kalimba', name: 'Kalimba', icon: 'note', group: 'Slagwerk-melodie' },
  { id: 'steeldrum', name: 'Steeldrum', icon: 'drum', group: 'Slagwerk-melodie' },
  { id: 'vibrafoon', name: 'Vibrafoon', icon: 'bell', group: 'Slagwerk-melodie' },
  { id: 'banjo', name: 'Banjo', icon: 'guitar', group: 'Snaren' },
  { id: 'pizzicato', name: 'Tokkelviool', icon: 'heart', group: 'Snaren' },
  { id: 'sax', name: 'Saxofoon', icon: 'microphone', group: 'Blazers' },
  { id: 'accordeon', name: 'Accordeon', icon: 'headphones', group: 'Blazers' },
  { id: 'dudelzak', name: 'Doedelzak', icon: 'flag', group: 'Blazers' },
  { id: 'pad', name: 'Droomwolk', icon: 'cloud', group: 'Synths' },
  { id: 'laser', name: 'Laser', icon: 'ufo', group: 'Synths' },
];

export const R4_DRUMS = [
  { id: 'tamb', lab: 'Tmb', name: 'Tamboerijn', color: '#f43f5e' },
  { id: 'bongo', lab: 'Bng', name: 'Bongo', color: '#0ea5e9' },
  { id: 'tri', lab: 'Tri', name: 'Triangel', color: '#8b5cf6' },
  { id: 'wood', lab: 'Hout', name: 'Houtblok', color: '#d97706' },
  { id: 'snap', lab: 'Vin', name: 'Vingerknip', color: '#10b981' },
  { id: 'zap', lab: 'Zap', name: 'Laser-tom', color: '#e11d48' },
];

// o = de bouwstenen uit music-synth (osc, filt, sweep, vibrato, noise); f = frequentie. Geeft een envelop terug of null (onbekend id).
export function buildExtra(o, id, f) {
  switch (id) {
    case 'kalimba': o.osc('sine', 1, 0.6); o.osc('sine', 5.4, 0.1); o.osc('sine', 9.6, 0.03); o.noise('bandpass', 4000, 2, 0.05, 0.015); return { a: 0.002, d: 0.9, s: 0.004, r: 0.2, peak: 0.75 };
    case 'steeldrum': o.osc('sine', 1, 0.5); o.osc('sine', 2.01, 0.3); o.osc('sine', 3.02, 0.12); o.osc('triangle', 0.5, 0.12); return { a: 0.003, d: 0.8, s: 0.03, r: 0.25, peak: 0.7 };
    case 'vibrafoon': { const x = o.osc('sine', 1, 0.55); o.osc('sine', 4, 0.1); o.vibrato(x, 5.5, 14, 0.05); return { a: 0.002, d: 2.2, s: 0.05, r: 0.5, peak: 0.6 }; }
    case 'banjo': { const lp = o.filt('bandpass', Math.min(5000, f * 3), 0.9); o.osc('sawtooth', 1, 0.3, 0, lp); o.osc('square', 2, 0.12, 3, lp); o.noise('highpass', 3000, 1, 0.1, 0.02); return { a: 0.002, d: 0.55, s: 0.01, r: 0.12, peak: 0.8 }; }
    case 'pizzicato': { const lp = o.filt('lowpass', 2600, 0.8); o.osc('triangle', 1, 0.5, 0, lp); o.osc('sawtooth', 1, 0.15, 4, lp); o.noise('bandpass', 2000, 1.5, 0.06, 0.015); return { a: 0.002, d: 0.3, s: 0.001, r: 0.08, peak: 0.8 }; }
    case 'sax': { const lp = o.filt('lowpass', Math.min(4200, f * 5), 1.4); const x = o.osc('sawtooth', 1, 0.3, 0, lp); o.osc('square', 1, 0.12, 5, lp); o.vibrato(x, 5, 12, 0.35); o.noise('bandpass', f * 3, 1, 0.05, 0.3); return { a: 0.05, d: 0.15, s: 0.8, r: 0.12, peak: 0.5 }; }
    case 'accordeon': { const lp = o.filt('lowpass', 3000, 0.7); o.osc('sawtooth', 1, 0.2, -9, lp); o.osc('sawtooth', 1, 0.2, 9, lp); o.osc('square', 2, 0.07, 0, lp); return { a: 0.06, d: 0.1, s: 0.9, r: 0.1, peak: 0.45 }; }
    case 'dudelzak': { const lp = o.filt('lowpass', 2200, 2.5); o.osc('sawtooth', 1, 0.28, 0, lp); o.osc('sawtooth', 0.5, 0.18, 2, lp); o.osc('square', 1.5, 0.05, 0, lp); return { a: 0.04, d: 0.05, s: 0.95, r: 0.08, peak: 0.42 }; }
    case 'pad': { const lp = o.filt('lowpass', 1800, 0.6); o.osc('sawtooth', 1, 0.18, -12, lp); o.osc('sawtooth', 1, 0.18, 12, lp); o.osc('triangle', 2, 0.12, 0, lp); o.osc('sine', 0.5, 0.18, 0, lp); return { a: 0.5, d: 0.6, s: 0.8, r: 0.9, peak: 0.4 }; }
    case 'laser': { const lp = o.filt('lowpass', 3500, 6); o.sweep(lp, 6000, 300, 0.25); o.osc('square', 1, 0.2, 0, lp); o.osc('sine', 2, 0.1, 0, lp); return { a: 0.002, d: 0.3, s: 0.2, r: 0.1, peak: 0.45 }; }
    default: return null;
  }
}

// Drums: tone(type,f0,f1,fdur,vol,dur,at) en noise(type,freq,q,vol,dur,at) komen uit playDrum. Geeft true als het id bekend was.
export function drumExtra(id, t, tone, noise) {
  switch (id) {
    case 'tamb': noise('highpass', 8000, 1, 0.4, 0.09, t); noise('bandpass', 5000, 3, 0.25, 0.15, t + 0.01); tone('square', 4500, 4400, 0.05, 0.05, 0.05, t); return true;
    case 'bongo': tone('sine', 420, 330, 0.05, 0.8, 0.16, t); noise('bandpass', 2500, 2, 0.1, 0.015, t); return true;
    case 'tri': tone('sine', 2400, 2400, 0.1, 0.25, 0.9, t); tone('sine', 6200, 6200, 0.1, 0.1, 0.7, t); return true;
    case 'wood': tone('sine', 900, 800, 0.03, 0.7, 0.07, t); tone('sine', 1450, 1300, 0.03, 0.3, 0.05, t); return true;
    case 'snap': noise('bandpass', 2800, 4, 0.5, 0.03, t); tone('triangle', 1700, 900, 0.02, 0.3, 0.04, t); return true;
    case 'zap': tone('sawtooth', 1600, 80, 0.2, 0.45, 0.28, t); return true;
    default: return false;
  }
}
