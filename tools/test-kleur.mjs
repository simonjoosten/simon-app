// Tests voor docs/kleur-color.js, docs/kleur-art.js en de kleurplaten. Gebruik: node tools/test-kleur.mjs
import assert from 'node:assert/strict';
import * as C from '../docs/kleur-color.js';
let n = 0; const ok = (name, fn) => { try { fn(); n++; } catch (e) { console.error('FAIL', name, e.stack.split('\n').slice(0, 3).join(' | ')); process.exitCode = 1; } };
const seq = (...a) => { let i = 0; return (m) => a[i++ % a.length] % m; };

ok('omrekenen', () => {
  assert.equal(C.normHex('#ABC'), '#aabbcc'); assert.equal(C.normHex('ff0000'), '#ff0000'); assert.equal(C.normHex('rommel'), '#000000'); assert.equal(C.normHex(null, '#123456'), '#123456'); assert.ok(C.isHex('#a1b2c3') && !C.isHex('#abc'));
  assert.deepEqual(C.hexToRgb('#ff8000'), [255, 128, 0]); assert.equal(C.rgbToHex(255, 128.4, -5), '#ff8000');
  const [h, s, l] = C.hexToHsl('#ff0000'); assert.equal(Math.round(h), 0); assert.equal(Math.round(s), 100); assert.equal(Math.round(l), 50);
  for (const hex of ['#12ab9c', '#fedcba', '#808080', '#ffffff', '#000000', '#3366cc']) { const back = C.hslToHex(...C.hexToHsl(hex)); assert.ok(C.colorDistance(hex, back) < 3, hex + ' ' + back); }
  assert.equal(C.mix('#000000', '#ffffff', 0.5), '#808080'); assert.equal(C.mixPaint([{ c: '#ff0000', w: 1 }, { c: '#0000ff', w: 1 }]), '#800080'); assert.equal(C.mixPaint([]), '#ffffff'); assert.ok(C.lighten('#808080', 20) > '#808080');
});
ok('kleurnamen', () => { assert.equal(C.colorName('#ff0000'), 'rood'); assert.equal(C.colorName('#ffffff'), 'wit'); assert.equal(C.colorName('#000000'), 'zwart'); assert.equal(C.colorName('#40a040'), 'groen'); assert.ok(C.COLOR_NAMES.length >= 40); });
ok('harmonieën', () => {
  const comp = C.harmony('#ff0000', 'compl'); assert.equal(comp.length, 2); assert.equal(comp[0], '#ff0000'); assert.ok(C.colorDistance(comp[1], '#00ffff') < 5);
  assert.equal(C.harmony('#3366cc', 'triade').length, 3); assert.equal(C.harmony('#3366cc', 'tetrade').length, 4); assert.equal(C.harmony('#3366cc', 'split').length, 3); assert.equal(C.harmony('#3366cc', 'analoog').length, 3);
  const mono = C.harmony('#3366cc', 'mono'); assert.equal(mono.length, 5); const ls = mono.map((c) => C.hexToHsl(c)[2]); assert.deepEqual(ls, ls.slice().sort((a, b) => a - b)); assert.equal(C.HARMONIES.length, 6);
  const tri = C.harmony('#ff0000', 'triade').map((c) => Math.round(C.hexToHsl(c)[0])); assert.deepEqual(tri, [0, 120, 240]);
});
ok('palet-generator', () => {
  for (const mode of ['willekeurig', ...C.HARMONIES.map((h) => h.id)]) for (let k = 0; k < 20; k++) { const p = C.generatePalette({ mode, n: 5 }); assert.equal(p.length, 5); assert.ok(p.every(C.isHex)); }
  assert.equal(C.generatePalette({ n: 99 }).length, 8); assert.equal(C.generatePalette({ n: 0 }).length, 5);
  const p = C.generatePalette({ n: 5, locked: { 1: '#123456', 3: '#abcdef' } }); assert.equal(p[1], '#123456'); assert.equal(p[3], '#abcdef');
  const q = C.generatePalette({ mode: 'triade', base: '#ff0000', n: 3 }, seq(0)); assert.ok(Math.abs(C.hexToHsl(q[0])[0] % 360) < 12 || C.hexToHsl(q[0])[0] > 348);
  const rc = C.randomColor(); assert.ok(C.isHex(rc));
});
ok('contrast', () => {
  assert.ok(Math.abs(C.contrastRatio('#000000', '#ffffff') - 21) < 1e-9); assert.ok(Math.abs(C.contrastRatio('#777777', '#777777') - 1) < 1e-9); assert.ok(Math.abs(C.contrastRatio('#767676', '#ffffff') - 4.54) < 0.02);
  const g = C.contrastGrade(4.6); assert.ok(g.normaalAA && !g.normaalAAA && g.grootAA && g.grootAAA); assert.ok(!C.contrastGrade(2.9).grootAA);
  assert.equal(C.bestText('#ffffff'), '#000000'); assert.equal(C.bestText('#001133'), '#ffffff'); assert.equal(C.contrastRatio('#fff', '#000'), C.contrastRatio('#000', '#fff'));
});
ok('contrast verbeteren', () => {
  const f = C.fixContrast('#aaaaaa', '#ffffff'); assert.ok(C.contrastRatio(f, '#ffffff') >= 4.5); assert.equal(C.fixContrast('#000000', '#ffffff'), '#000000');
  const g = C.fixContrast('#555555', '#222222'); assert.ok(C.contrastRatio(g, '#222222') >= 4.5); assert.ok(C.contrastRatio(C.fixContrast('#ff00ff', '#ff00fe'), '#ff00fe') >= 4.5);
});
ok('kleurenblind', () => {
  assert.equal(C.simulateHex('#336699', 'normaal'), '#336699'); assert.equal(C.simulateHex('#ffffff', 'deutan'), '#ffffff'); assert.equal(C.simulateHex('#000000', 'protan'), '#000000');
  const g = C.simulateHex('#ff0000', 'achroma'); const [r, gg, b] = C.hexToRgb(g); assert.ok(r === gg && gg === b && r > 40 && r < 140);
  // rood en groen lijken voor deuteranopen op elkaar (kleiner verschil dan normaal)
  const normal = C.colorDistance('#ff0000', '#00aa00'), dd = C.colorDistance(C.simulateHex('#ff0000', 'deutan'), C.simulateHex('#00aa00', 'deutan')); assert.ok(dd < normal * 0.7, `${dd} ${normal}`);
  const tr = C.colorDistance(C.simulateHex('#ffff00', 'tritan'), C.simulateHex('#ff00ff', 'tritan')); assert.ok(tr < C.colorDistance('#ffff00', '#ff00ff') * 0.6);
  const d = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]); C.simulateImageData(d, 'achroma'); assert.ok(d[0] === d[1] && d[1] === d[2] && d[3] === 255 && d[4] === d[5]); assert.equal(C.CB_TYPES.length, 5);
});
ok('verloop', () => {
  const css = C.gradientCss({ type: 'linear', angle: 450, stops: [{ c: '#ff0000', p: 100 }, { c: '#0000ff', p: 0 }, { c: 'x', p: 50 }] }); assert.equal(css, 'linear-gradient(90deg, #0000ff 0%, #ff0000 100%)');
  assert.ok(C.gradientCss({ type: 'radial', stops: [{ c: '#ff0000', p: 0 }, { c: '#0000ff', p: 100 }] }).startsWith('radial-gradient')); assert.ok(C.gradientCss({ type: 'conic', angle: 30, stops: [{ c: '#ff0000', p: 0 }, { c: '#0000ff', p: 100 }] }).startsWith('conic-gradient(from 30deg')); assert.equal(C.gradientCss({ stops: [{ c: '#ff0000', p: 0 }] }), 'none');
  const st = [{ c: '#000000', p: 0 }, { c: '#ffffff', p: 100 }]; assert.equal(C.gradientAt(st, 50), '#808080'); assert.equal(C.gradientAt(st, -5), '#000000'); assert.equal(C.gradientAt(st, 150), '#ffffff');
});
ok('kleuren uit een foto', () => {
  const W = 60, data = new Uint8ClampedArray(W * W * 4); const cols = [[255, 0, 0], [0, 255, 0], [0, 0, 255]];
  for (let i = 0; i < W * W; i++) { const c = cols[i < 1800 ? 0 : i < 2700 ? 1 : 2]; data.set([...c, 255], i * 4); }
  const pal = C.extractPalette(data, 3); assert.equal(pal.length, 3); assert.equal(pal[0], '#ff0000'); assert.deepEqual(pal.slice().sort(), ['#00ff00', '#0000ff', '#ff0000'].sort());
  assert.deepEqual(C.extractPalette(new Uint8ClampedArray(16), 4), []); assert.equal(C.extractPalette(new Uint8ClampedArray([10, 20, 30, 255, 10, 20, 30, 255]), 5).length >= 1, true);
  const big = new Uint8ClampedArray(2000 * 2000 * 4).fill(200); assert.equal(C.extractPalette(big, 2).length >= 1, true);
});
ok('paletten opslaan', () => {
  assert.equal(C.cleanPalettes([{ name: 'a', colors: ['#112233', '#ABCDEF', 'x'] }, { name: 'b', colors: ['#112233'] }, null, 5]).length, 1);
  assert.deepEqual(C.cleanPalettes([{ name: 'a', colors: ['#112233', '#ABCDEF'] }])[0].colors, ['#112233', '#abcdef']); assert.deepEqual(C.cleanPalettes('x'), []);
  assert.ok(C.paletteCss(['#112233', '#445566']).includes('--kleur-2: #445566;')); assert.equal(C.paletteText(['#1', '#2']), '#1, #2');
  assert.ok(C.SETS.length >= 8 && C.SETS.every((s) => s.colors.length === 24 && s.colors.every(C.isHex) && new Set(s.colors).size >= 22), 'kleursets');
});
ok('spel: raad de kleur / menger', () => {
  assert.equal(C.matchScore('#336699', '#336699'), 100); assert.equal(C.matchScore('#000000', '#ffffff'), 0); assert.ok(C.matchScore('#336699', '#346699') > 95); assert.ok(C.matchScore('#336699', '#3a70a0') > C.matchScore('#336699', '#6a2000'));
  for (let i = 0; i < 100; i++) { const t = C.mixTarget(); assert.equal(t.weights.length, 4); assert.ok(t.weights.some((w) => w > 0)); assert.equal(C.mixFromWeights(t.weights), t.color); }
  assert.equal(C.mixFromWeights([1, 0, 0, 0]), '#e53935'); assert.equal(C.starsForScore(95), 3); assert.equal(C.starsForScore(80), 2); assert.equal(C.starsForScore(60), 1); assert.equal(C.starsForScore(20), 0);
});
ok('spel: welke is anders', () => {
  let prev = Infinity; for (let L = 1; L <= 30; L++) { const o = C.oddOneOut(L); assert.ok(o.n >= 2 && o.n <= 7); assert.ok(o.idx >= 0 && o.idx < o.n * o.n); assert.notEqual(o.base, o.odd); assert.ok(o.delta <= prev + 1e-9); prev = o.delta; assert.ok(C.isHex(o.base) && C.isHex(o.odd)); }
  assert.equal(C.oddOneOut(1).n, 2); assert.equal(C.oddOneOut(40).n, 7); assert.ok(C.oddOneOut(1).delta > 20 && C.oddOneOut(40).delta < 3);
  for (let k = 0; k < 200; k++) { const o = C.oddOneOut(1 + k % 20); assert.ok(C.colorDistance(o.base, o.odd) > 1, 'zichtbaar verschil'); }
});
ok('spel: kleurgeheugen', () => {
  let s = []; for (let i = 0; i < 6; i++) s = C.simonNext(s); assert.equal(s.length, 6); assert.ok(s.every((v) => v >= 0 && v < 4));
  assert.equal(C.simonCheck([0, 1, 2], [0]), 'door'); assert.equal(C.simonCheck([0, 1, 2], [0, 1, 2]), 'klaar'); assert.equal(C.simonCheck([0, 1, 2], [0, 2]), 'fout'); assert.equal(C.SIMON.length, 4);
  assert.deepEqual(C.cleanGames({ raad: 400, menger: -1, anders: 'x' }), { raad: 400, menger: 0, anders: 0, geheugen: 0 }); assert.deepEqual(C.cleanGames(null), { raad: 0, menger: 0, anders: 0, geheugen: 0 });
});
console.log(process.exitCode ? 'MISLUKT' : `OK (${n} tests)`);
