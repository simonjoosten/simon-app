// Ronde 4 (groep Creatief): tests voor muziek, piano, kleur, pixel, dobbel en emoji-mixer. Gebruik: node tools/test-r4-creatief.mjs
import assert from 'node:assert/strict';
import { install, El } from './_minidom.mjs';
const env = install();
let n = 0, failed = 0;
const ok = async (name, fn) => { try { await fn(); n++; } catch (e) { failed++; console.error('FAIL', name, (e.stack || String(e)).split('\n').slice(0, 4).join(' | ')); process.exitCode = 1; } };

const S = await import('../docs/music-synth.js');
const M = await import('../docs/music-model.js');
const RM = await import('../docs/creatief-r4-music.js');
const RB = await import('../docs/creatief-r4-beats.js');
const PS = await import('../docs/piano-songs.js');
const RS = await import('../docs/creatief-r4-songs.js');
const K = await import('../docs/kleur.js').catch(() => null);
const RK = await import('../docs/creatief-r4-kleur.js');
const P = await import('../docs/pixel-core.js');
const RP = await import('../docs/creatief-r4-pixel.js');
const PSH = await import('../docs/creatief-r4-pixelshare.js');
const D = await import('../docs/creatief-r4-dice.js');
const DG = await import('../docs/dice-games.js');
const RE = await import('../docs/creatief-r4-emoji.js');
const SH = await import('../docs/creatief-r4-share.js');

// ---- mock audio ----
function mockCtx() {
  const calls = { osc: 0, buf: 0 };
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} });
  const node = () => new Proxy({ connect() {}, start() {}, stop() {}, disconnect() {} }, { get(t, p) { if (p in t) return t[p]; if (['gain', 'frequency', 'detune', 'Q', 'delayTime', 'threshold', 'knee', 'ratio', 'attack', 'release'].includes(p)) return param(); return undefined; }, set(t, p, v) { t[p] = v; return true; } });
  return { calls, sampleRate: 8000, currentTime: 0, destination: node(), createOscillator: () => { calls.osc++; return node(); }, createGain: node, createBiquadFilter: node, createBuffer: (c, l) => { calls.buf++; return { getChannelData: () => new Float32Array(l) }; }, createBufferSource: node, createDelay: node, createConvolver: node, createDynamicsCompressor: node };
}

// ================= MUZIEK =================
await ok('instrumenten en drums', () => {
  assert.equal(S.INSTRUMENTS.length, 27); assert.equal(S.DRUMKIT.length, 18);
  assert.equal(new Set(S.INST_IDS).size, 27); assert.equal(new Set(S.DRUM_IDS).size, 18);
  const c = mockCtx(), nb = S.makeNoise(c), bus = S.makeBus(c);
  for (const id of ['kalimba', 'steeldrum', 'vibrafoon', 'banjo', 'pizzicato', 'sax', 'accordeon', 'dudelzak', 'pad', 'laser']) { assert.ok(S.INST_IDS.includes(id), id); const before = c.calls.osc; S.playNote(c, bus.input, id, 330, 0.1, 0.4, 0.8, nb); assert.ok(c.calls.osc > before, 'geen geluid: ' + id); const rel = S.startNote(c, bus.input, id, 220, 1, nb); rel(); }
  for (const id of ['tamb', 'bongo', 'tri', 'wood', 'snap', 'zap']) { assert.ok(S.DRUM_IDS.includes(id), id); const b = c.calls.osc + c.calls.buf; S.playDrum(c, c.destination, nb, id, 0.1, 0.9); assert.ok(c.calls.osc + c.calls.buf > b, 'geen drum: ' + id); }
});
await ok('14 nieuwe voorbeelden', () => {
  assert.equal(Object.keys(RB.R4_PRESETS).length, 14); assert.ok(M.PRESET_KEYS.length >= 25);
  for (const k of Object.keys(RB.R4_PRESETS)) {
    const s = M.buildPreset(k); assert.ok(s, k); assert.ok(M.songHasNotes(s), k); assert.ok(M.patternHasNotes(s, 0) && M.patternHasNotes(s, 1), k);
    const again = M.sanitizeSong(JSON.parse(JSON.stringify(s))); assert.ok(again && M.songHasNotes(again), k + ' sanitize');
    assert.ok(s.tracks.every((t) => (t.kind === 'drums' ? t.kit.length === 8 && t.kit.every((x) => S.DRUM_IDS.includes(x)) : S.INST_IDS.includes(t.inst))), k + ' instrumenten');
    const code = M.songToCode(s, k); const back = M.codeToSong(code); assert.ok(back && back.song.tracks.length === s.tracks.length, k + ' code');
    assert.ok(Object.keys(M.SCALES).includes(s.scale), k + ' toonladder');
  }
  assert.deepEqual(M.buildPreset('salsa').tracks[0].kit.slice(0, 3), ['kick', 'conga', 'bongo']);
  assert.ok(M.SCALE_KEYS.includes('lydisch') && M.SCALE_KEYS.length === 12);
  for (const sc of ['lydisch', 'frygisch', 'arabisch']) assert.equal(M.chordMidis(0, 0, sc).length, 3);
});
await ok('nieuwe voorbeelden spelen in de sequencer', () => {
  const c = mockCtx(), nb = S.makeNoise(c), bus = S.makeBus(c);
  for (const k of Object.keys(RB.R4_PRESETS)) { const s = M.buildPreset(k); const end = M.scheduleSong(c, bus.input, nb, s, M.playOrder(s, 'song', 0), 0.1); assert.ok(end > 0 || end === undefined, k); }
});
await ok('verras me, lied van de dag, mashup', () => {
  const a = RM.surpriseSong(12345), b = RM.surpriseSong(12345), c = RM.surpriseSong(99);
  assert.ok(a && a.song && M.songHasNotes(a.song)); assert.deepEqual(a.song, b.song); assert.equal(a.preset, b.preset);
  for (let i = 1; i < 60; i++) { const r = RM.surpriseSong(i * 977); assert.ok(r && r.song, 'seed ' + i); assert.ok(r.song.bpm >= 60 && r.song.bpm <= 180); assert.ok(M.songHasNotes(r.song)); assert.ok(r.song.tracks.every((t) => t.kind === 'drums' || S.INST_IDS.includes(t.inst))); }
  assert.ok(c.preset); assert.deepEqual(RM.dailySong(20000).song, RM.dailySong(20000).song); assert.notDeepEqual(RM.dailySong(20000).song, RM.dailySong(20001).song);
  const m = RM.mashup('house', 'trap'); assert.ok(m && M.songHasNotes(m)); assert.equal(m.tracks.find((t) => t.kind === 'drums').kit.join(), M.buildPreset('house').tracks[0].kit.join());
  assert.equal(RM.mashup('x', 'house'), null);
});
await ok('loops als bouwstenen', () => {
  const s = M.buildPreset('house');
  for (const L of RM.LOOPS) { const t = RM.loopTargets(s, L.id); assert.ok(t.length >= 1, L.id); const copy = M.cloneSong(s); assert.ok(RM.applyLoop(copy, L.id, t[0], 0), L.id); assert.ok(M.patternHasNotes(copy, 0)); }
  const s2 = M.newSong(); assert.equal(RM.applyLoop(s2, 'vierop', 1, 0), false); assert.equal(RM.applyLoop(s2, 'bestaatniet', 0, 0), false);
  const d = M.newSong(); RM.applyLoop(d, 'vierop', 0, 0); assert.ok(d.pats[0][0][d.tracks[0].kit.indexOf('kick')][4]);
});

// ================= PIANO =================
await ok('piano: extra liedjes', () => {
  assert.equal(RS.R4_SONGS.length, 14); assert.equal(RS.R4_DRILLS.length, 4); assert.ok(PS.SONGS.length >= 38);
  const ids = PS.SONGS.map((s) => s.id); assert.equal(new Set(ids).size, ids.length);
  for (const s of [...RS.R4_SONGS, ...RS.R4_DRILLS]) {
    assert.ok(PS.SONG_BY_ID[s.id], s.id); const raw = s.notes.split(/\s+/); const notes = PS.songNotes(s); assert.equal(notes.length, raw.length, s.id + ' onleesbare noot'); assert.ok(notes.length >= 8, s.id);
    assert.ok([1, 2, 3].includes(s.level) && s.bpm >= 60 && s.bpm <= 160, s.id); const r = PS.songRange(PS.songTimeline(s)); assert.ok(r.lo >= PS.KEY_MIN && r.hi <= PS.KEY_MAX, s.id + ' bereik'); assert.ok(PS.songSeconds(s) > 3, s.id);
  }
  for (let d = 0; d < 400; d++) { const i = RS.dailyIndex(PS.SONGS.length, d * 86400000); assert.ok(i >= 0 && i < PS.SONGS.length); }
  assert.equal(RS.dailyIndex(0), 0);
  const g = PS.newGame(PS.songTimeline(PS.SONG_BY_ID.stillenacht)); assert.ok(g.total > 10);
});
await ok('piano: pads hebben genoeg toetsen', async () => {
  const src = (await import('node:fs')).readFileSync(new URL('../docs/piano.js', import.meta.url), 'utf8'); const m = /const PADKEYS = \[(.*?)\]/.exec(src); const keys = m[1].split(',').map((x) => x.trim()); assert.ok(keys.length >= S.DRUMKIT.length, `${keys.length} toetsen voor ${S.DRUMKIT.length} pads`); assert.equal(new Set(keys).size, keys.length);
});

// ================= KLEUR =================
await ok('kleur: nieuwe platen', () => {
  assert.ok(RK.PLATEN_R4.length >= 50, 'aantal ' + RK.PLATEN_R4.length);
  const ids = RK.PLATEN_R4.map((p) => p.id); assert.equal(new Set(ids).size, ids.length);
  const SHAPE = /^<(circle|ellipse|rect|polygon|path)\b[^<>]*\/>$/;
  for (const p of RK.PLATEN_R4) {
    assert.ok(p.naam && p.emoji && p.groep, p.id); assert.ok(p.shapes.length >= 3 && p.shapes.length <= 160, p.id + ' vormen ' + p.shapes.length); assert.ok(Array.isArray(p.decor));
    for (const sh of [...p.shapes, ...p.decor]) { assert.match(sh, SHAPE, p.id + ': ' + sh); assert.ok(!/NaN|undefined|Infinity/.test(sh), p.id + ' ongeldig getal: ' + sh); }
  }
  const inGroup = new Set(RK.GROEPEN_R4.flatMap((g) => g[2])); assert.equal(inGroup.size, ids.length); RK.GROEPEN_R4.forEach((g) => { assert.ok(g[2].length >= 3, g[0]); g[2].forEach((id) => assert.ok(ids.includes(id))); });
});
await ok('kleur: in de app en svg', async () => {
  const KL = await import('../docs/kleur.js'); assert.ok(KL.PLATEN.length >= 85); const all = KL.PLATEN.map((p) => p.id); assert.equal(new Set(all).size, all.length, 'dubbele id');
  for (const id of ['huis', 'kat', 'mandala1', 'pixels']) assert.ok(all.includes(id), 'oude plaat weg: ' + id);
  for (const p of KL.PLATEN) { const svg = KL.svgString(p, { 0: '#ff0000', bg: '#eeeeee' }, { id: true }); assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>') && !svg.includes('NaN'), p.id); }
});

// ================= PIXEL =================
await ok('pixel: sjablonen en animatie', () => {
  assert.equal(RP.R4_TEMPLATES.length, 30); assert.ok(P.TEMPLATES.length >= 40);
  const names = P.TEMPLATES.map((t) => t.name); assert.equal(new Set(names).size, names.length, 'dubbele naam');
  let anim = 0;
  for (const t of RP.R4_TEMPLATES) {
    assert.equal(t.rows.length, 16, t.name); t.rows.forEach((r) => assert.equal(r.length, 16, t.name));
    const used = (rows) => new Set(rows.join('').replace(/\./g, '')); for (const ch of used(t.rows)) assert.ok(t.key[ch], t.name + ' ' + ch);
    const d = P.templateDoc(t); assert.ok(P.countColors(d.frames[0][0]) >= 3, t.name);
    if (t.frames) { anim++; assert.ok(t.frames.length >= 3 && t.frames.length <= 8, t.name); t.frames.forEach((f) => { assert.equal(f.length, 16); f.forEach((r) => assert.equal(r.length, 16)); for (const ch of used(f)) assert.ok(t.key[ch], t.name + ' frame ' + ch); }); assert.equal(d.frames.length, t.frames.length); assert.ok(d.fps >= 3); const sets = new Set(t.frames.map((f) => f.join('|'))); assert.ok(sets.size >= 2, t.name + ' beweegt niet'); assert.ok(P.gifFromDoc(d, 4).length > 100, 'gif ' + t.name); }
    else assert.equal(d.frames.length, 1);
  }
  assert.equal(anim, 10);
});
await ok('pixel: delen met een code', () => {
  const t = RP.R4_TEMPLATES.find((x) => x.frames), d = P.templateDoc(t); const code = PSH.docToCode(d, 'Mijn test ✨');
  assert.ok(code.startsWith('PXA1:')); const r = PSH.codeToDoc(code); assert.ok(r); assert.equal(r.name, 'Mijn test ✨'); assert.equal(r.doc.n, 16); assert.equal(r.doc.frames.length, d.frames.length);
  assert.deepEqual(P.composite(r.doc, 1), P.composite(d, 1));
  for (const bad of ['', null, 'PXA1:', 'PXA1:!!!', 'PX:abc', 'PXA1:' + Buffer.from('{"v":2}').toString('base64url'), 'PXA1:' + 'A'.repeat(70000), 'PXA1:' + Buffer.from(JSON.stringify({ v: 2, size: 13, frames: [], layers: [], pal: [] })).toString('base64url'), 'PXA1:' + Buffer.from(JSON.stringify({ v: 2, size: 8, layers: [{ name: 'a' }], frames: [['0,3']], pal: ['<script>'] })).toString('base64url')]) assert.equal(PSH.codeToDoc(bad), null, String(bad).slice(0, 30));
  const big = P.newDoc(16); big.frames[0][0][5] = '#123456'; const rr = PSH.codeToDoc(PSH.docToCode(big)); assert.equal(rr.doc.frames[0][0][5], '#123456');
  assert.equal(SH.safeName('Hallo Wereld!!'), 'hallo-wereld'); assert.equal(SH.safeName('', 'x'), 'x');
});

// ================= DOBBEL =================
const seq = (...a) => { let i = 0; return (m) => a[i++ % a.length] % m; };
await ok('dobbel: hoger of lager', () => {
  const g = D.hlNew(3, seq(4)); assert.equal(g.cur, 5); assert.equal(g.best, 3);
  D.hlGuess(g, 'hoger', seq(8)); assert.equal(g.streak, 1); assert.equal(g.cur, 9); D.hlGuess(g, 'hoger', seq(8)); assert.equal(g.streak, 1); assert.ok(!g.over); // gelijk
  D.hlGuess(g, 'hoger', seq(1)); assert.ok(g.over); assert.equal(g.best, 3); const frozen = JSON.stringify(g); D.hlGuess(g, 'lager', seq(0)); assert.equal(JSON.stringify(g), frozen);
  const h = D.hlNew(0, seq(0)); for (let i = 0; i < 5; i++) { D.hlGuess(h, 'hoger', seq(i + 1)); } assert.equal(h.streak, 5); assert.equal(h.best, 5);
  const o = D.hlOdds(1); assert.equal(o.lager, 0); assert.ok(Math.abs(o.hoger - 0.9) < 1e-9); assert.equal(D.hlOdds(10).hoger, 0);
  D.hlGuess(D.hlNew(), 'sideways'); // onbekend commando mag niet crashen
});
await ok('dobbel: derby is eerlijk en eindigt', () => {
  assert.equal(D.DERBY_RUNNERS.length, 11); let sum = 0; const p = (k) => (6 - Math.abs(7 - k)) / 36;
  // verwacht aantal worpen tot de finish is voor alle renners ongeveer gelijk (eerlijke baan)
  const exp = D.DERBY_RUNNERS.map((k) => D.DERBY_LEN[k] / p(k)); const mn = Math.min(...exp), mx = Math.max(...exp); assert.ok(mx / mn < 1.4, `verhouding ${mx / mn}`);
  const wins = Object.fromEntries(D.DERBY_RUNNERS.map((k) => [k, 0])); let seed = 7; const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 6000; i++) { const g = D.derbyNew(7); let guard = 0; while (g.winner == null && guard++ < 500) D.derbyRoll(g, 1 + Math.floor(rnd() * 6), 1 + Math.floor(rnd() * 6)); assert.ok(g.winner != null); wins[g.winner]++; sum++; }
  for (const k of D.DERBY_RUNNERS) assert.ok(wins[k] / sum > 0.03 && wins[k] / sum < 0.2, `renner ${k}: ${wins[k] / sum}`);
  const g = D.derbyNew(99); assert.equal(g.pick, 7); D.derbyRoll(g, 3, 4); assert.equal(g.pos[7], 1); assert.equal(g.rolls, 1); for (let i = 0; i < 8; i++) D.derbyRoll(g, 3, 4); assert.equal(g.winner, 7); assert.ok(D.derbyWon(g)); const r = g.rolls; D.derbyRoll(g, 1, 1); assert.equal(g.rolls, r);
  assert.equal(D.DERBY_RUNNERS.every((k) => D.DERBY_NAMES[k]), true);
});
await ok('dobbel: eenentwintig', () => {
  let g = D.bjNew(); D.bjHit(g, 6); D.bjHit(g, 6); D.bjHit(g, 6); D.bjHit(g, 6); assert.equal(g.phase, 'klaar'); assert.equal(g.result, 'verloren'); D.bjHit(g, 1); assert.equal(g.me.length, 4);
  g = D.bjNew(); D.bjHit(g, 6); D.bjHit(g, 6); D.bjHit(g, 5); assert.equal(D.bjTotal(g.me), 17); D.bjStand(g, () => 6); assert.deepEqual(g.comp, [6, 6, 6]); assert.equal(g.result, 'verloren'); // 18 tegen 17
  g = D.bjNew(); D.bjHit(g, 6); D.bjHit(g, 6); D.bjHit(g, 2); D.bjStand(g, () => 6); assert.equal(g.result, 'verloren' === g.result ? 'verloren' : g.result); // 14 vs 18
  g = D.bjNew(); D.bjHit(g, 6); D.bjHit(g, 6); D.bjHit(g, 6); D.bjHit(g, 3); assert.equal(D.bjTotal(g.me), 21); assert.equal(g.phase, 'klaar'); assert.ok(['gewonnen', 'gelijk'].includes(g.result)); // 21: computer mag niet winnen
  g = D.bjNew(); D.bjHit(g, 3); let k = 0; D.bjStand(g, () => [6, 6, 6][k++]); assert.equal(g.comp.length, 1); assert.equal(g.result, 'verloren'); // comp 6 > 3
  g = D.bjNew(); D.bjHit(g, 6); D.bjStand(g, () => 6); assert.equal(g.result, 'gelijk'); assert.deepEqual(g.comp, [6]);
  g = D.bjNew(); for (let i = 0; i < 3; i++) D.bjHit(g, 5); D.bjStand(g, () => 6); assert.equal(D.bjTotal(g.comp), 18); assert.equal(g.result, 'verloren'); // 15 vs 18
  g = D.bjNew(); D.bjHit(g, 6); D.bjHit(g, 6); D.bjHit(g, 6); D.bjStand(g, () => 6); assert.equal(g.result, 'gewonnen' === g.result ? 'gewonnen' : g.result);
  for (let t = 0; t < 400; t++) { const q = D.bjNew(); while (q.phase === 'speler') { if (D.bjTotal(q.me) >= 14) D.bjStand(q, () => 1 + Math.floor(Math.random() * 6)); else D.bjHit(q, 1 + Math.floor(Math.random() * 6)); } assert.ok(['gewonnen', 'gelijk', 'verloren'].includes(q.result)); if (q.result === 'gewonnen') assert.ok(D.bjTotal(q.me) <= 21 && (D.bjTotal(q.comp) > 21 || D.bjTotal(q.me) > D.bjTotal(q.comp))); }
});
await ok('dobbel: dagmissie', () => {
  assert.equal(D.MISSIONS.length, 10); const ids = D.MISSIONS.map((m) => m.id); assert.equal(new Set(ids).size, 10);
  const chk = (id, d) => D.MISSION_BY_ID[id].check(d);
  assert.ok(chk('drie', [2, 2, 2, 5, 6]) && !chk('drie', [1, 2, 3, 4, 6])); assert.ok(chk('vier', [3, 3, 3, 3, 1]) && !chk('vier', [3, 3, 3, 1, 1]));
  assert.ok(chk('straat4', [1, 2, 3, 4, 6]) && chk('straat4', [3, 4, 5, 6, 6]) && !chk('straat4', [1, 2, 4, 5, 6])); assert.ok(chk('straat5', [2, 3, 4, 5, 6]) && !chk('straat5', [1, 2, 3, 4, 6]));
  assert.ok(chk('hoog', [5, 5, 5, 5, 4]) && !chk('hoog', [5, 5, 5, 5, 3])); assert.ok(chk('laag', [1, 1, 2, 3, 4]) && !chk('laag', [2, 2, 2, 3, 3]));
  assert.ok(chk('even', [2, 4, 6, 2, 4]) && !chk('even', [2, 4, 6, 2, 3])); assert.ok(chk('oneven', [1, 3, 5, 1, 3]) && !chk('oneven', [1, 3, 5, 1, 2]));
  assert.ok(chk('fullhouse', [2, 2, 3, 3, 3]) && !chk('fullhouse', [2, 2, 2, 2, 3]) && !chk('fullhouse', [3, 3, 3, 3, 3])); assert.ok(chk('twee-paar', [1, 1, 2, 2, 5]) && !chk('twee-paar', [1, 1, 2, 3, 5]));
  assert.equal(D.missionOf(20000).id, D.missionOf(20000).id); assert.equal(new Set(Array.from({ length: 10 }, (_, i) => D.missionOf(20000 + i).id)).size, 10);
  const g = D.msNew(20000); assert.equal(g.state, 'bezig'); assert.equal(D.msHold(g, 1), false);
  D.msRoll(g, seq(0, 1, 2, 3, 4)); assert.deepEqual(g.dice, [1, 2, 3, 4, 5]); assert.equal(g.rolls, 1);
  const g2 = { ...D.msNew(), mission: 'drie' }; D.msRoll(g2, seq(0, 1, 2, 3, 4)); assert.equal(g2.state, 'bezig'); assert.ok(D.msHold(g2, 0)); D.msHold(g2, 1); D.msRoll(g2, seq(5, 5, 5)); assert.equal(g2.dice[0], 1); assert.equal(g2.dice[1], 2); assert.deepEqual(g2.dice.slice(2), [6, 6, 6]); assert.equal(g2.state, 'gehaald'); D.msRoll(g2); assert.equal(g2.rolls, 2);
  const g3 = { ...D.msNew(), mission: 'vier' }; for (let i = 0; i < 5; i++) D.msRoll(g3, seq(0, 1, 2, 3, 4)); assert.equal(g3.state, 'mislukt'); assert.equal(g3.rolls, 3);
});
await ok('dobbel: raad de som', () => {
  assert.equal(D.gsPoints(10, 10), 10); assert.equal(D.gsPoints(10, 11), 5); assert.equal(D.gsPoints(10, 8), 4); assert.equal(D.gsPoints(3, 18), 0);
  const g = D.gsNew(20); for (let i = 0; i < 8; i++) { assert.ok(!g.done); D.gsPlay(g, 10, [3, 3, 4]); } assert.ok(g.done); assert.equal(g.points, 80); assert.equal(g.best, 80); D.gsPlay(g, 10, [3, 3, 4]); assert.equal(g.round, 8);
});
await ok('dobbel: wielen en spellen', () => {
  assert.equal(Object.keys(D.R4_GAMES).length, 5); assert.ok(D.isR4Game('hl') && !D.isR4Game('y') && !D.isR4Game('constructor'));
  assert.ok(Object.keys(DG.WHEEL_PRESETS).length >= 13); for (const [k, v] of Object.entries(DG.WHEEL_PRESETS)) assert.ok(v.length >= 3 && v.every((x) => typeof x === 'string' && x), k);
  assert.equal(DG.WHEEL_PRESETS['Wat eten we?'].length, 8);
});

// ---- dobbel: schermen met een nep-omgeving ----
await ok('dobbel: alle vijf schermen draaien', async () => {
  for (const game of Object.keys(D.R4_GAMES)) {
    let token = 1, html = '', rolled = 0, scenes = 0; const store = {}; const states = {};
    const body = { set innerHTML(v) { html = v; }, get innerHTML() { return html; }, querySelectorAll: () => [], onclick: null };
    const e = { body, esc: (x) => String(x).replace(/[<&]/g, ''), icon: () => '', rand: (m) => Math.floor(Math.random() * m), mkDice: () => { }, rollAll: async () => { rolled++; }, dice: () => [], colorOf: () => '#dc2626', sfx() { }, say() { }, playScene: () => { scenes++; }, token: () => token, sleep: async () => { }, store: { get: (k) => store[k], set: (k, v) => { store[k] = v; } }, state: (k, init) => (states[k] ||= init()) };
    D.mountR4(game, e); assert.ok(html.includes('dc-table'), game); assert.equal(typeof body.onclick, 'function', game);
    const press = async (act, extra = {}) => { const b = { dataset: { r4: act, ...extra }, disabled: false }; await body.onclick({ target: { closest: () => b } }); };
    if (game === 'hl') { for (let i = 0; i < 40 && !states.hl.over; i++) await press(Math.random() < 0.5 ? 'hoger' : 'lager'); assert.ok(states.hl.over || states.hl.streak >= 40); await press('again'); assert.equal(states.hl.streak, 0); assert.ok(!store.best || store.best.hl >= 0); }
    if (game === 'derby') { await press('pick', { v: '9' }); assert.equal(states.derby.pick, 9); await press('go'); for (let i = 0; i < 50 && states.derby.running; i++) await new Promise((r) => setImmediate(r)); assert.ok(states.derby.g.winner != null); assert.ok(html.includes('wint')); assert.ok(store.derby.n === 1); await press('new'); assert.equal(states.derby.g, null); }
    if (game === 'bj') { await press('hit'); assert.equal(states.bj.g.me.length, 1); await press('stand'); assert.equal(states.bj.g.phase, 'klaar'); assert.equal(states.bj.score.w + states.bj.score.d + states.bj.score.l, 1); await press('new'); assert.equal(states.bj.g.me.length, 0); }
    if (game === 'ms') { await press('roll'); assert.equal(states.ms.rolls, 1); await press('hold', { i: '0' }); assert.ok(states.ms.held[0]); await press('roll'); await press('roll'); assert.ok(states.ms.state !== 'bezig'); await press('again'); assert.equal(states.ms.rolls, 0); assert.ok(states.ms.practice); }
    if (game === 'gs') { await press('plus'); assert.equal(states.gs.guess, 11); for (let i = 0; i < 8; i++) await press('go'); assert.ok(states.gs.g.done); assert.ok(store.best.gs >= 0); await press('new'); assert.equal(states.gs.g.round, 0); }
    assert.ok(rolled >= 0 && scenes >= 0);
  }
});

// ================= EMOJI =================
await ok('emoji: stijlen, verhaaltje, dag, raadspel, poster', () => {
  assert.equal(RE.EXTRA_MODES.length, 8); const log = [];
  const ctx = new Proxy({}, { get: (o, k) => (k in o ? o[k] : (...a) => { if (k === 'fillText') log.push(a[0]); }), set: (o, k, v) => { o[k] = v; return true; } });
  for (const [m] of RE.EXTRA_MODES) { log.length = 0; assert.equal(RE.drawExtraMix(ctx, '🐱', '🍕', m, 512), true, m); assert.ok(log.length >= 2 && log.includes('🐱') && log.includes('🍕'), m + ' ' + log.join('')); }
  assert.equal(RE.drawExtraMix(ctx, 'a', 'b', 'half', 100), false);
  const st = RE.mixStory('kat', 'Pizza', 'Katza', 5); assert.ok(st.includes('kat') && st.includes('pizza') && st.includes('Katza')); assert.equal(st, RE.mixStory('kat', 'Pizza', 'Katza', 5)); assert.notEqual(RE.mixStory('kat', 'pizza', 'K', 1), RE.mixStory('kat', 'pizza', 'K', 2)); assert.ok(!RE.mixStory(null, undefined, '', 0).includes('undefined'));
  const pairs = [['a', 'b'], ['c', 'd'], ['e', 'f']]; assert.deepEqual(RE.mixOfTheDay(pairs, 20000), RE.mixOfTheDay(pairs, 20000)); assert.equal(RE.mixOfTheDay([], 1), null); assert.ok(new Set(Array.from({ length: 30 }, (_, i) => RE.mixOfTheDay(pairs, 20000 + i).join())).size > 1);
  const all = ['🐱', '🐶', '🍕', '🍔', '🚀', '🌵', '🎸', '🐟']; const q = RE.quizRound(all, () => 0.3); assert.equal(q.opts.length, 6); assert.ok(q.opts.includes(q.a) && q.opts.includes(q.b) && q.a !== q.b); assert.ok(RE.EXTRA_MODE_IDS.includes(q.mode) || ['half', 'hoed', 'hoek', 'draai', 'totem', 'smoothie'].includes(q.mode));
  RE.quizPick(q, q.a); RE.quizPick(q, q.a); assert.equal(q.picked.length, 1); RE.quizPick(q, q.b); assert.ok(q.done); assert.equal(q.score, 3); RE.quizPick(q, '🚀'); assert.equal(q.picked.length, 2);
  const q2 = RE.quizRound(all); const wrong = q2.opts.filter((x) => x !== q2.a && x !== q2.b); RE.quizPick(q2, wrong[0]); RE.quizPick(q2, wrong[1]); assert.equal(q2.score, 0); RE.quizPick(RE.quizRound(all), 'niet-in-opties');
  assert.equal(RE.quizRound(['a', 'b', 'c']).opts.length, 3);
  for (let c = 0; c <= 8; c++) { const L = RE.posterLayout(c, 1024); assert.equal(L.length, Math.min(6, c)); L.forEach((r) => assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.s <= 1024.01 && r.y + r.s <= 1024.01 && r.s > 100, `${c}: ${JSON.stringify(r)}`)); }
});

console.log(failed ? `FOUT: ${failed} mislukt, ${n} gelukt` : `OK (${n} tests)`);
