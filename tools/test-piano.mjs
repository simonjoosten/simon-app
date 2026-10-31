// Tests voor docs/piano-songs.js (liedjes, spel, akkoorden, opnames). Gebruik: node tools/test-piano.mjs
import assert from 'node:assert/strict';
import * as P from '../docs/piano-songs.js';
let n = 0; const ok = (name, fn) => { try { fn(); n++; } catch (e) { console.error('FAIL', name, e.message); process.exitCode = 1; } };

ok('noten lezen', () => {
  assert.deepEqual(P.parseNote('C4'), { midi: 60, len: 1 }); assert.deepEqual(P.parseNote('F#5:2'), { midi: 78, len: 2 }); assert.deepEqual(P.parseNote('Bb3:.5'), { midi: 58, len: 0.5 }); assert.deepEqual(P.parseNote('r:1.5'), { midi: null, len: 1.5 }); assert.equal(P.parseNote('H9'), null);
  assert.equal(P.parseNote('A4').midi, 69); assert.equal(P.parseNote('C-1').midi, 0);
  assert.equal(P.parseSong('C4 | D4:2 xx r').length, 3);
});
ok('20 liedjes, allemaal geldig', () => {
  assert.ok(P.SONGS.length >= 20); assert.equal(new Set(P.SONGS.map((s) => s.id)).size, P.SONGS.length);
  for (const s of P.SONGS) { const tl = P.songTimeline(s); assert.ok(tl.length >= 8, s.id); const r = P.songRange(tl); assert.ok(r.lo >= P.KEY_MIN && r.hi <= P.KEY_MAX, s.id + ' bereik'); assert.ok(r.hi - r.lo <= 24, s.id + ' past op 3 octaven');
    assert.ok([1, 2, 3].includes(s.level)); assert.ok(s.bpm >= 60 && s.bpm <= 160); assert.ok(P.songSeconds(s) > 4 && P.songSeconds(s) < 90, s.id);
    const bad = s.notes.split(/\s+/).filter((t) => t !== '|' && !P.parseNote(t)); assert.deepEqual(bad, [], s.id); }
  assert.equal(P.parseSong(P.SONG_BY_ID.kortjakje.notes).length, 26); assert.equal(P.SONG_BY_ID.slaap.notes.split(' ').length, 9);
});
ok('tijdlijn', () => {
  const tl = P.songTimeline({ bpm: 60, notes: 'C4 r:1 D4:2' }); assert.equal(tl.length, 2); assert.equal(tl[0].t, 0); assert.equal(tl[1].t, 2000); assert.ok(tl[1].d < 2000 && tl[1].d > 1500);
  assert.equal(P.songTimeline({ bpm: 60, notes: 'C4 D4' }, 0.5)[1].t, 2000);
});
ok('toetsenbord-indeling', () => {
  const L = P.keyLayout(60, 2); assert.equal(L.whites, 15); assert.equal(L.keys.length, 25); const last = L.keys[L.keys.length - 1]; assert.equal(last.midi, 84); assert.ok(Math.abs(last.x + last.w - 100) < 1e-9);
  const cs = L.keys.find((k) => k.midi === 61); assert.ok(cs.black && cs.x > 0); assert.ok(L.keys.every((k) => k.x >= -1e-9 && k.x + k.w <= 100 + 1e-9));
  assert.equal(P.fitStart(60, 76, 2), 60); assert.equal(P.fitStart(48, 79, 3), 48); assert.equal(P.fitStart(60, 84, 2), 60); const s = P.fitStart(40, 90, 3); assert.ok(s >= 36 && s + 36 <= 96);
  assert.equal(P.keyLetterFor(60, 60), 'a'); assert.equal(P.keyLetterFor(61, 60), 'w'); assert.equal(P.keyLetterFor(84, 60), ''); assert.equal(P.labelFor(60, 'noten'), 'C'); assert.equal(P.labelFor(62, 'dore'), 'Re'); assert.equal(P.labelFor(62, 'geen'), '');
});
ok('akkoorden herkennen', () => {
  assert.equal(P.detectChord([60, 64, 67]), 'C'); assert.equal(P.detectChord([57, 60, 64]), 'Am'); assert.equal(P.detectChord([60, 64, 67, 70]), 'C7'); assert.equal(P.detectChord([64, 67, 72]), 'C/E'); assert.equal(P.detectChord([62, 65, 69]), 'Dm'); assert.equal(P.detectChord([60, 64, 67, 71]), 'Cmaj7');
  assert.equal(P.detectChord([60]), null); assert.equal(P.detectChord([60, 61, 62]), null); assert.equal(P.detectChord([60, 67]), 'C5'); assert.equal(P.detectChord([71, 74, 77]), 'Bdim');
  assert.deepEqual(P.chordNotes(60, 'min'), [60, 63, 67]);
  const kc = P.keyChords(0); assert.deepEqual(kc.map((c) => c.name), ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']); assert.equal(P.keyChords(7)[0].name, 'G'); assert.equal(P.keyChords(7)[6].name, 'F#dim'); kc.forEach((c) => assert.equal(P.detectChord(c.notes), c.name));
});
ok('spel: raken en missen', () => {
  const tl = P.songTimeline({ bpm: 60, notes: 'C4 D4 E4 C4' }); const g = P.newGame(tl);
  assert.equal(P.press(g, 62, 0), null); // verkeerde noot
  let r = P.press(g, 60, 20); assert.equal(r.grade, 'perfect');
  assert.equal(P.press(g, 60, 20), null); // niet 2x dezelfde noot
  r = P.press(g, 62, 1000 + 100); assert.equal(r.grade, 'goed');
  assert.equal(P.press(g, 64, 2000 + 190).grade, 'ok');
  assert.equal(P.press(g, 60, 3000 + 400), null); assert.equal(P.sweep(g, 3000 + 100), 0); assert.equal(P.sweep(g, 3000 + 250), 1);
  assert.ok(P.gameDone(g)); const res = P.gameResult(g); assert.equal(res.counts.mis, 1); assert.equal(res.accuracy, 53); assert.equal(res.stars, 1);
  assert.equal(g.combo, 0); assert.equal(g.best, 3);
});
ok('spel: perfecte ronde = 3 sterren, combo-vermenigvuldiger', () => {
  const tl = P.songTimeline(P.SONG_BY_ID.twinkel); const g = P.newGame(tl); tl.forEach((nn) => P.press(g, nn.midi, nn.t));
  const r = P.gameResult(g); assert.equal(r.stars, 3); assert.equal(r.accuracy, 100); assert.equal(r.bestCombo, tl.length); assert.ok(r.score > tl.length * 100); assert.ok(P.gameDone(g));
  const g2 = P.newGame(tl); P.sweep(g2, 1e9); const r2 = P.gameResult(g2); assert.equal(r2.stars, 0); assert.equal(r2.score, 0);
  assert.equal(P.gameResult(P.newGame([])).stars, 0);
});
ok('opnames', () => {
  const ev = [{ midi: 60, on: true, t: 1000 }, { midi: 64, on: true, t: 1200 }, { midi: 60, on: false, t: 1500 }, { midi: 64, on: false, t: 1700 }, { midi: 67, on: true, t: 2000 }];
  const notes = P.eventsToNotes(ev); assert.deepEqual(notes, [[60, 0, 500], [64, 200, 500], [67, 1000, 300]]); assert.equal(P.tapeSeconds(notes), 1.3); assert.deepEqual(P.eventsToNotes([]), []);
  const tape = { name: 'Mijn 🎹 stuk', inst: 'harp', notes }; const code = P.tapeToCode(tape); assert.ok(code.startsWith('PN1:')); const back = P.codeToTape(' ' + code + ' '); assert.deepEqual(back, tape);
  assert.equal(P.codeToTape('MM2:abc'), null); assert.equal(P.codeToTape('PN1:@@'), null); assert.equal(P.codeToTape(undefined), null);
  assert.deepEqual(P.cleanNotes([[60, 0, 100], [1, 5, 'x'], 'x', [200, -5, 99999]]), [[60, 0, 100], [108, 0, 10000]]); assert.deepEqual(P.cleanNotes('x'), []);
  const t = P.sanitizeTapes(Array.from({ length: 12 }, (_, i) => ({ name: 't' + i, notes: [[60, 0, 100]] })).concat([null])); assert.equal(t.length, 8); assert.deepEqual(P.sanitizeTapes([{ notes: [] }]), []);
});
console.log(process.exitCode ? 'MISLUKT' : `OK (${n} tests)`);
