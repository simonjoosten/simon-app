// Tests voor docs/music-model.js en docs/music-synth.js (zonder browser). Gebruik: node tools/test-music.mjs
import assert from 'node:assert/strict';
import * as M from '../docs/music-model.js';
import * as S from '../docs/music-synth.js';
let n = 0; const ok = (name, fn) => { try { fn(); n++; } catch (e) { console.error('FAIL', name, e.message); process.exitCode = 1; } };

// ---- mock audio ----
function mockCtx() {
  const calls = { osc: 0, buf: 0, gain: 0, filter: 0 };
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} });
  const node = (k) => new Proxy({ connect() {}, start() {}, stop() {}, disconnect() {} }, { get(t, p) { if (p in t) return t[p]; if (['gain', 'frequency', 'detune', 'Q', 'delayTime', 'threshold', 'knee', 'ratio', 'attack', 'release'].includes(p)) return (t[p] = param()); return undefined; }, set(t, p, v) { t[p] = v; return true; } });
  return { calls, sampleRate: 8000, currentTime: 0, destination: node(), createOscillator: () => { calls.osc++; return node(); }, createGain: () => { calls.gain++; return node(); }, createBiquadFilter: () => { calls.filter++; return node(); }, createBufferSource: () => { calls.buf++; return node(); }, createConvolver: () => node(), createDelay: () => node(), createDynamicsCompressor: () => node(), createAnalyser: () => node(), createBuffer: (ch, len) => ({ getChannelData: () => new Float32Array(len), length: len, numberOfChannels: ch, sampleRate: 8000 }) };
}

ok('noten', () => { assert.equal(S.noteName(60), 'C4'); assert.equal(S.noteName(69), 'A4'); assert.equal(S.noteName(61), 'C#4'); assert.ok(Math.abs(S.midiFreq(69) - 440) < 1e-9); assert.ok(S.isBlack(61) && !S.isBlack(60)); });
ok('27 instrumenten en 18 drums', () => { assert.equal(S.INSTRUMENTS.length, 27); assert.equal(S.DRUMKIT.length, 18); assert.equal(new Set(S.INST_IDS).size, 27); });
ok('alle instrumenten spelen zonder fout', () => {
  const c = mockCtx(), nb = S.makeNoise(c), bus = S.makeBus(c);
  for (const id of S.INST_IDS) { S.playNote(c, bus.input, id, 440, 0.1, 0.5, 0.8, nb); const rel = S.startNote(c, bus.input, id, 220, 1, nb); rel(); rel(); }
  assert.ok(c.calls.osc > 40);
});
ok('alle drums spelen', () => { const c = mockCtx(), nb = S.makeNoise(c); for (const d of S.DRUM_IDS) S.playDrum(c, c.destination, nb, d, 0.1, 0.9); assert.ok(c.calls.osc + c.calls.buf > 12); });
ok('bus-effecten', () => { const c = mockCtx(), b = S.makeBus(c, 0.5); b.setReverb(1); b.setEcho(0.5); b.setFilter(0); b.setVolume(0.3); S.applyFx(b, { rev: .2, echo: .3, filter: .5 }, 120); assert.ok(S.filterFreq(0) < S.filterFreq(1)); assert.equal(Math.round(S.filterFreq(1)), 20000); });
ok('wav', () => { const buf = { numberOfChannels: 2, sampleRate: 8000, length: 4, getChannelData: () => new Float32Array([0, 1, -1, 0.5]) }; const ab = S.encodeWav(buf); assert.equal(ab.byteLength, 44 + 16); assert.equal(new DataView(ab).getUint32(24, true), 8000); });

// ---- model ----
ok('rowMidi', () => { assert.equal(M.rowMidi(7, 0, 'majeur'), 60); assert.equal(M.rowMidi(0, 0, 'majeur'), 60 + 12); assert.equal(M.rowMidi(7, 9, 'majeur'), 57); assert.equal(M.rowMidi(7, 0, 'majeur', -2), 36); });
ok('akkoorden', () => { assert.equal(M.chordName(0, 0, 'majeur'), 'C'); assert.equal(M.chordName(1, 0, 'majeur'), 'Dm'); assert.equal(M.chordName(4, 0, 'majeur'), 'G'); assert.equal(M.chordName(6, 0, 'majeur'), 'Bdim'); assert.equal(M.chordName(0, 9, 'mineur'), 'Am'); assert.deepEqual(M.chordMidis(0, 0, 'majeur'), [48, 52, 55]); assert.equal(M.chordRoman(1, 0, 'majeur'), 'ii'); assert.equal(M.chordRoman(3, 0, 'majeur'), 'IV'); for (const s of M.SCALE_KEYS) for (let d = 0; d < 7; d++) assert.equal(M.chordMidis(d, 3, s).length, 3); });
ok('nieuw lied en tracks', () => {
  const s = M.newSong(); assert.equal(s.tracks.length, 2); assert.equal(s.pats.length, 4);
  const t = M.addTrack(s, 'chord'); assert.ok(t); assert.equal(s.pats[2][2].length, 7);
  while (M.addTrack(s, 'mel')) { /* vul */ } assert.equal(s.tracks.length, M.MAX_TRACKS); assert.equal(new Set(s.tracks.map((x) => x.id)).size, 8);
  assert.ok(M.removeTrack(s, 0)); assert.equal(s.pats[0].length, 7);
});
ok('stepEvents', () => {
  const s = M.buildPreset('pop'); const e0 = M.stepEvents(s, 0, 0);
  assert.ok(e0.some((x) => x.type === 'drum' && x.id === 'kick')); const ch = e0.find((x) => x.type === 'chord'); assert.equal(ch.midis.length, 3); assert.ok(Math.abs(ch.steps - 4 * 0.97) < 1e-9);
  assert.ok(!M.stepEvents(s, 0, 1).some((x) => x.type === 'chord')); // midden van lang akkoord: geen nieuwe start
  s.tracks[0].mute = true; assert.ok(!M.stepEvents(s, 0, 0).some((x) => x.type === 'drum'));
  s.tracks[2].solo = true; assert.ok(M.stepEvents(s, 0, 2).every((x) => x.ti === 2));
});
ok('presets', () => {
  assert.ok(M.PRESET_KEYS.length >= 11);
  for (const k of M.PRESET_KEYS) { const s = M.buildPreset(k); assert.ok(M.songHasNotes(s), k); assert.ok(M.patternHasNotes(s, 0)); assert.ok(M.patternHasNotes(s, 1), k + ' B'); assert.equal(s.pats[0].length, s.tracks.length);
    const back = M.sanitizeSong(M.compactSong(s)); assert.deepEqual(back.pats, s.pats, k); assert.deepEqual(back.chain, s.chain); }
});
ok('variatie verschilt', () => { const s = M.buildPreset('rock'); assert.notDeepEqual(s.pats[1], s.pats[0]); assert.notDeepEqual(s.pats[2], s.pats[0]); });
ok('code delen', () => {
  const s = M.buildPreset('house'); s.tracks[1].vol = 0.35; s.tracks[0].solo = true; s.fx = { rev: 0.5, echo: 0.25, filter: 0.7 }; s.bpm = 133; s.key = 3; s.scale = 'blues';
  const code = M.songToCode(s, 'Mijn beat 🎵'); assert.ok(code.startsWith('MM2:')); assert.ok(code.length < 4000);
  const r = M.codeToSong('  ' + code + '\n'); assert.equal(r.name, 'Mijn beat 🎵'); assert.equal(r.song.bpm, 133); assert.equal(r.song.scale, 'blues'); assert.equal(r.song.key, 3); assert.ok(r.song.tracks[0].solo); assert.equal(r.song.fx.echo, 0.25); assert.equal(Math.round(r.song.tracks[1].vol * 100), 35); assert.deepEqual(r.song.pats, s.pats);
  assert.equal(M.codeToSong('rommel'), null); assert.equal(M.codeToSong('MM2:@@@'), null); assert.equal(M.codeToSong(null), null);
});
ok('sanitize: rommel en grenzen', () => {
  assert.equal(M.sanitizeSong(null), null); assert.equal(M.sanitizeSong({ v: 9 }), null); assert.equal(M.sanitizeSong({ v: 2, t: [] }), null);
  const bad = { v: 2, b: 9999, w: -5, k: 99, s: 'xx', l: 7, f: [5, 'a', null], o: 'q', t: [{ k: 'drums', i: 'kick,nope', v: 500, c: 40, id: 'a b!' }, { k: 'zzz' }, { k: 'mel', i: 'onbekend' }], p: [['zz,1x,ffffffff']], c: [9, -1, 'a'] };
  const s = M.sanitizeSong(bad); assert.ok(s); assert.equal(s.bpm, 200); assert.equal(s.swing, 0); assert.equal(s.key, 11); assert.equal(s.scale, 'pentatonisch'); assert.equal(s.len, 8); assert.equal(s.tracks.length, 2); assert.equal(s.tracks[0].kit.length, 8); assert.equal(s.tracks[0].vol, 1); assert.equal(s.tracks[0].oct, 3); assert.equal(s.tracks[1].inst, 'synth');
  assert.ok(s.chain.every((x) => x >= 0 && x <= 3)); assert.equal(s.pats[0][0][0].length, 32); assert.ok(s.pats[0][0][0].slice(0, 4).every((v) => v === false));
});
ok('oude opslag (v1) laadt nog', () => {
  const old = { drums: [Array(16).fill(false).map((_, i) => i % 4 === 0), [], [], [], [], []], mel: Array.from({ length: 8 }, (_, r) => Array(16).fill(r === 3)), scale: 'blues', sound: 'bas', bpm: 91, swing: 12 };
  const s = M.sanitizeSong(old); assert.equal(s.bpm, 91); assert.equal(s.scale, 'blues'); assert.equal(s.tracks[1].inst, 'bas'); assert.equal(s.tracks[1].oct, -2);
  assert.ok(s.pats[0][0][0][4] && !s.pats[0][0][0][3]); assert.ok(s.pats[0][1][3][5]); assert.equal(s.tracks[0].kit.slice(0, 6).join(), 'kick,snare,hat,open,clap,tom');
});
ok('klonen en kopieren', () => { const s = M.buildPreset('funk'); const c = M.cloneSong(s); assert.deepEqual(c.pats, s.pats); M.copyPattern(s, 0, 3); assert.deepEqual(s.pats[3], s.pats[0]); s.pats[3][0][0][0] = !s.pats[3][0][0][0]; assert.notDeepEqual(s.pats[3], s.pats[0]); M.clearPattern(s, 3); assert.ok(!M.patternHasNotes(s, 3)); });
ok('speelvolgorde en duur', () => { const s = M.buildPreset('disco'); assert.deepEqual(M.playOrder(s, 'pattern', 2), [2]); assert.equal(M.playOrder(s, 'song', 0).length, 8); assert.ok(Math.abs(M.songSeconds(s, 'pattern', 0) - 16 * 60 / 118 / 4) < 1e-9); assert.ok(Math.abs(M.swingOffset(1, 50, 0.1) - 0.02) < 1e-9); assert.equal(M.swingOffset(2, 50, 0.1), 0); });
ok('tempo tikken', () => { assert.equal(M.tapTempo([0, 500, 1000, 1500]), 120); assert.equal(M.tapTempo([0, 500]), null); assert.equal(M.tapTempo([0, 5000, 10000]), null); assert.equal(M.tapTempo([0, 250, 500, 750]) >= 60, true); });
ok('ritmespel', () => {
  for (let L = 1; L <= 8; L++) for (let seed = 0; seed < 20; seed++) { const p = M.rhythmPattern(L, seed); assert.equal(p.length, 16); assert.ok(p[0]); const c = p.filter(Boolean).length; assert.ok(c >= 3 && c <= 8, `L${L} ${c}`); if (L <= 2) assert.ok(p.every((v, i) => !v || i % 4 === 0)); }
  assert.deepEqual(M.rhythmPattern(3, 5), M.rhythmPattern(3, 5)); assert.notDeepEqual(M.rhythmPattern(5, 1), M.rhythmPattern(5, 2));
  const tg = [0, 500, 1000]; let r = M.scoreTaps(tg, [10, 480, 1030]); assert.equal(r.hits, 3); assert.equal(r.stars, 3); assert.ok(r.score >= 90);
  r = M.scoreTaps(tg, [0, 500]); assert.equal(r.hits, 2); assert.ok(r.stars < 3);
  r = M.scoreTaps(tg, [0, 100, 200, 300, 500, 1000]); assert.ok(r.extra >= 3 && r.stars < 3);
  r = M.scoreTaps(tg, []); assert.equal(r.score, 0); assert.equal(r.stars, 0); r = M.scoreTaps([], [1]); assert.equal(r.total, 0);
  r = M.scoreTaps([0], [400]); assert.equal(r.hits, 0);
  assert.deepEqual(M.patternTimes([true, false, false, false, true], 60), [0, 1000]);
});
ok('opslag: 12 plekken, pat-lengtes', () => { assert.ok(M.LENGTHS.includes(8) && M.LENGTHS.includes(16) && M.LENGTHS.includes(32)); const s = M.newSong(); s.len = 32; const t = M.sanitizeSong(M.compactSong(s)); assert.equal(t.len, 32); });
ok('scheduleSong plant alles', () => {
  const c = mockCtx(), nb = S.makeNoise(c), bus = S.makeBus(c); const song = M.buildPreset('pop');
  const end = M.scheduleSong(c, bus.input, nb, song, M.playOrder(song, 'song', 0), 0.1);
  assert.ok(Math.abs(end - (0.1 + 8 * 16 * 60 / 100 / 4)) < 1e-9); assert.ok(c.calls.osc > 50);
});
console.log(process.exitCode ? 'MISLUKT' : `OK (${n} tests)`);
