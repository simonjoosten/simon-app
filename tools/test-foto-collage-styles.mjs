// Node-test voor docs/foto-collage-styles.js
//   node tools/test-foto-collage-styles.mjs
// 50 stijlen x 6 aantallen x 4 formaten (x 3 seeds): geen crash, n originele vakjes, binnen het canvas, geen NaN, geldige copyOf, weinig overlap.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fcs-'));
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}');
['foto-collage-styles.js', 'foto-collage-gen.js'].forEach((f) => fs.copyFileSync(path.join(here, '..', 'docs', f), path.join(tmp, f)));
const M = await import(pathToFileURL(path.join(tmp, 'foto-collage-styles.js')).href);
const GEN = await import(pathToFileURL(path.join(tmp, 'foto-collage-gen.js')).href);
const { STYLES, makeRng, shapePath, clipShape, shapeContains, drawBackground, drawDecor, applyFilter, RATIOS } = M;

let checks = 0, errors = 0;
const ok = (c, m) => { checks++; if (!c) { errors++; if (errors < 60) console.error('FAIL:', m); } };

// nep-canvascontext: elke methode bestaat, niets wordt echt getekend
function fakeCtx() {
  const target = { measureText: (t) => ({ width: String(t).length * 6 }), createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), isPointInPath: () => true, getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4).fill(120) }), putImageData() {} };
  return new Proxy(target, { get: (t, k) => (k in t ? t[k] : () => {}), set: () => true });
}

ok(STYLES.length === 50, 'precies 50 stijlen: ' + STYLES.length);
const names = ['Strak raster', 'Brede witte rand', 'Geen ruimte', 'Metselwerk', 'Mozaïek', 'Eén grote foto met kleintjes', 'Filmstrip', 'Contactvel met nummertjes', 'Plakboek', 'Polaroid-stapel', 'Waaier', 'Verspreid op tafel', 'Prikbord met punaises', 'Foto\'s met washi-tape', 'Stapel met bovenste foto groot', 'Puzzelstukjes'];
names.forEach((nm, i) => ok(STYLES[i].name === nm, `stijl ${i + 1} heet ${nm}, niet ${STYLES[i].name}`));
ok(new Set(STYLES.map((s) => s.id)).size === 50, 'ids uniek');
const groups = {}; STYLES.forEach((s) => { groups[s.group] = (groups[s.group] || 0) + 1; });
ok(JSON.stringify(Object.values(groups)) === JSON.stringify([8, 8, 7, 15, 12]), 'groepsgroottes ' + JSON.stringify(groups));

const NS = [4, 6, 8, 10, 12, 15], EPS = 0.004;
const finite = (o) => JSON.stringify(o, (k, v) => (typeof v === 'number' && !Number.isFinite(v) ? '__NaN__' : v)).indexOf('__NaN__') < 0;
function bbox(s, R) { // rotated outer box in unit space (x*R, y)
  const cx = (s.x + s.w / 2) * R, cy = s.y + s.h / 2, w = s.w * R, h = s.h, a = (s.rot || 0) * Math.PI / 180;
  const ex = (Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a))) / 2, ey = (Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a))) / 2;
  return [cx - ex, cy - ey, cx + ex, cy + ey];
}
const stat = {}; let maxOv = {};
for (const st of STYLES) {
  for (const n of NS) for (const [rn, R] of RATIOS) for (const seed of [1, 77, 4242]) {
    const tag = `${st.name} n=${n} ${rn} seed=${seed}`;
    let made;
    try { made = st.make(n, R, makeRng(seed), { text: 'AB7' }); } catch (e) { ok(false, `${tag}: crash ${e.message}`); continue; }
    const sl = made.slots;
    ok(finite(made), `${tag}: NaN/Infinity`);
    ok(made.bgs && made.bgs.length >= 3 && made.bg === made.bgs[0], `${tag}: bgs`);
    const orig = sl.filter((s) => s.copyOf == null);
    ok(orig.length === n, `${tag}: ${orig.length} originelen ipv ${n}`);
    ok(sl.slice(0, n).every((s) => s.copyOf == null), `${tag}: originelen niet eerst`);
    sl.forEach((s, i) => {
      ok(s.w > 0.01 && s.h > 0.01, `${tag}: slot ${i} te klein ${s.w.toFixed(3)}x${s.h.toFixed(3)}`);
      if (s.copyOf != null) ok(Number.isInteger(s.copyOf) && s.copyOf >= 0 && s.copyOf < n && sl[s.copyOf].copyOf == null, `${tag}: copyOf ${s.copyOf} ongeldig`);
      const b = bbox(s, R);
      ok(b[0] >= -EPS * R && b[2] <= R * (1 + EPS) && b[1] >= -EPS && b[3] <= 1 + EPS, `${tag}: slot ${i} buiten canvas [${b.map((v) => v.toFixed(3))}] R=${R}`);
      if (s.frame) { const fw = s.frame.w, fb = s.frame.b || 0; ok(s.w - 2 * fw > 0.005 && s.h - 2 * fw * R - fb * R > 0.005, `${tag}: lijst te dik slot ${i}`); }
      if (s.shape.type === 'cells') ok(s.shape.cells.length > 0 && s.shape.cells.every((q) => q.every(Number.isFinite) && q[2] > 0 && q[3] > 0), `${tag}: cells`);
    });
    // overlap
    let mo = 0;
    for (let i = 0; i < sl.length; i++) for (let j = i + 1; j < sl.length; j++) {
      const a = bbox(sl[i], R), b = bbox(sl[j], R), ix = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), iy = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
      if (ix > 0 && iy > 0) { const r = ix * iy / Math.min((a[2] - a[0]) * (a[3] - a[1]), (b[2] - b[0]) * (b[3] - b[1])); mo = Math.max(mo, r); }
    }
    maxOv[st.name] = Math.max(maxOv[st.name] || 0, mo);
    if (!st.overlap) ok(mo < 0.03, `${tag}: overlap ${mo.toFixed(3)} (stijl is niet als overlappend gemarkeerd)`);
    else ok(mo <= 1.0001, `${tag}: overlap te groot ${mo.toFixed(2)}`);
    // tekenen met nep-canvas: achtergrond, decor, vormen
    try {
      const c = fakeCtx(); drawBackground(c, made.bg, 400, 400 / R); made.bgs.forEach((b) => drawBackground(c, b, 100, 100));
      drawDecor(c, made.decor, 400, 400 / R, false, true); drawDecor(c, made.decor, 400, 400 / R, true, true);
      sl.forEach((s) => { clipShape(c, s.shape, 0, 0, 100, 100); shapeContains(c, s.shape, 0, 0, 100, 100, 50, 50); });
    } catch (e) { ok(false, `${tag}: tekenen ${e.message}`); }
  }
  stat[st.name] = made0(st);
}
function made0(st) { return st.make(6, 1, makeRng(1), {}).slots.length; }

// vormen en filters
{
  const c = fakeCtx();
  for (const t of ['rect', 'round', 'circle', 'heart', 'star', 'hex', 'diamond', 'triangle', 'drop', 'cloud', 'sun', 'flower', 'moon', 'paw', 'butterfly', 'blob', 'letter']) { try { shapePath(c, { type: t, ch: 'A', r: .2 }, 0, 0, 10, 10); } catch (e) { ok(false, 'shapePath ' + t + ': ' + e.message); } }
  for (const f of ['none', 'bw', 'sepia', 'warm', 'cool', 'vivid', 'fade', 'pop1', 'pop2', 'pop3', 'pop4']) { try { applyFilter(c, 4, 4, f); } catch (e) { ok(false, 'filter ' + f); } }
}
// de letter-stijl met verschillende teksten
{
  const st = STYLES.find((s) => s.id === 'jouw-letter-of-cijfer');
  for (const text of ['', 'a', '7', 'MAX', '!!!', '♥♥', 'ZZZZZ', '???']) for (const n of NS) { const m = st.make(n, 1, makeRng(3), { text }); ok(m.slots.length === n, `letter '${text}' n=${n}: ${m.slots.length}`); }
}
// zelfde seed = zelfde resultaat, andere seed = (meestal) ander resultaat
{
  let same = 0, diff = 0;
  for (const st of STYLES) { const a = JSON.stringify(st.make(8, 1, makeRng(5), {})), b = JSON.stringify(st.make(8, 1, makeRng(5), {})), c = JSON.stringify(st.make(8, 1, makeRng(6), {})); ok(a === b, st.name + ': niet deterministisch'); if (a !== c) diff++; else same++; }
  console.log(`seed-variatie: ${diff} van 50 stijlen veranderen met een andere seed`);
}
// de ruimte-factor werkt
for (const st of STYLES) for (const gap of [0, 2]) { const m = st.make(6, 0.8, makeRng(2), { gap }); ok(finite(m) && m.slots.length >= 6, `${st.name} gap=${gap}`); }

// ---- pure logica van de Genereer-tab ----
{
  const near = (a, b, e, m) => ok(Math.abs(a - b) <= e, `${m}: ${a} vs ${b}`);
  ok(JSON.stringify(GEN.emptySlots([null, 'x', null, null, 'y'], 5, 3, 2)) === '[3,0]', 'emptySlots begint bij het aangetikte vakje');
  ok(JSON.stringify(GEN.emptySlots([null, 'x', null], 3, null, 5)) === '[0,2]', 'emptySlots: alleen lege vakjes');
  ok(JSON.stringify(GEN.emptySlots(['a', null, null], 3, 0, 1)) === '[1]', 'emptySlots: gevuld vakje wordt overgeslagen');
  // cover-fit: liggende foto in een staand vak vult het hele vak
  let v = GEN.coverView(2000, 1000, 100, 200, 0, 1, .5, .5);
  near(v.sc, 0.2, 1e-9, 'cover schaal'); near(v.vw, 500, 1e-9, 'cover zichtbare breedte'); near(v.vh, 1000, 1e-9, 'cover zichtbare hoogte');
  v = GEN.coverView(2000, 1000, 100, 200, 0, 1, 0, 0); near(v.px, 250, 1e-9, 'middelpunt wordt begrensd links'); near(v.py, 500, 1e-9, 'middelpunt y begrensd');
  v = GEN.coverView(1000, 1000, 100, 100, 0, 2, 1, 1); near(v.px, 750, 1e-9, 'zoom 2 begrensd rechts');
  v = GEN.coverView(1000, 500, 100, 100, Math.PI / 2, 1, .5, .5); near(v.vw, 500, 1e-6, '90 graden: zichtbare breedte in fotoruimte'); near(v.vh, 500, 1e-6, '90 graden: hoogte');
  v = GEN.coverView(1000, 1000, 100, 100, Math.PI / 4, 1, .5, .5); ok(v.sc >= 100 * Math.SQRT2 / 1000 - 1e-9, '45 graden: foto bedekt het gedraaide vak');
  // slepen: foto volgt de vinger (naar rechts slepen = middelpunt naar links)
  const vw = GEN.coverView(2000, 1000, 100, 200, 0, 1, .5, .5), r1 = GEN.dragToCenter(20, 0, 0, 1, 1, 0, vw, 2000, 1000);
  near(r1.cx, (1000 - 20 / vw.sc) / 2000, 1e-9, 'slepen rechts'); near(r1.cy, .5, 1e-9, 'slepen y');
  const r2 = GEN.dragToCenter(20, 0, 0, -1, 1, 0, vw, 2000, 1000); ok(r2.cx > .5, 'gespiegeld: slepen omgekeerd');
  const r3 = GEN.dragToCenter(0, 20, 90, 1, 1, 0, vw, 2000, 1000); ok(r3.cx < .5 && Math.abs(r3.cy - .5) < 1e-9, 'vak 90 graden gedraaid: omlaag slepen = in foto naar links');
  // slim middelpunt: een felle blokje rechtsboven trekt het middelpunt daarheen
  const w = 48, h = 36, d = new Uint8ClampedArray(w * h * 4); for (let i = 0; i < w * h; i++) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 128; d[i * 4 + 3] = 255; }
  for (let y = 4; y < 12; y++) for (let x = 34; x < 44; x++) { const i = (y * w + x) * 4; d[i] = 255; d[i + 1] = 0; d[i + 2] = 0; }
  const f = GEN.smartFocus(d, w, h); ok(f.cx > .6 && f.cy < .45, `smartFocus naar het blokje: ${f.cx.toFixed(2)},${f.cy.toFixed(2)}`);
  const flat = GEN.smartFocus(new Uint8ClampedArray(w * h * 4).fill(100), w, h); near(flat.cx, .5, 1e-9, 'effen plaatje = midden');
  ok(JSON.stringify(GEN.exportSize(1, false)) === '[1080,1080]' && JSON.stringify(GEN.exportSize(9 / 16, false)) === '[1080,1920]' && JSON.stringify(GEN.exportSize(1.5, false)) === '[1080,720]', 'exportSize 1080');
  for (const [, R] of RATIOS) { const [bw, bh] = GEN.exportSize(R, true); ok(bw * bh <= 16000000 && Math.max(bw, bh) <= 3840 && Math.max(bw, bh) >= 3500, `4K-formaat ${bw}x${bh}`); }
  // tekenen van alle stijlen met nep-canvas: lege vakjes, gevulde vakjes (met filter, spiegel, draaiing), selectie, miniatuur
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => fakeCtx() }) };
  for (const st of STYLES) for (const [, R] of RATIOS) {
    const m = st.make(8, R, makeRng(9), {}), photos = [], items = [{ t: 'Hoi', e: false, x: .5, y: .5, s: .1, c: '#fff' }, { t: '❤️', e: true, x: .3, y: .3, s: .1, c: '#000' }];
    for (let i = 0; i < 8; i += 2) photos[i] = { src: { width: 1600, height: 900 }, cx: .4, cy: .6, z: 1.5, flip: i % 4 === 0, rot: i % 3 };
    try {
      for (const o of [{ ui: true, sel: { k: 's', i: 2 } }, { ui: true, sel: { k: 't', i: 0 }, filter: 'sepia', round: .3 }, { thumb: true, photos: null }, { ui: false, filter: 'pop1' }]) GEN.paintCollage(fakeCtx(), m, 300, 300 / R, Object.assign({ photos, items, px: 2, bg: m.bgs[1] }, o));
    } catch (e) { ok(false, `${st.name} ${R}: paintCollage ${e.stack}`); }
  }
}
console.log('max overlap per stijl (niet-overlappende stijlen horen < 0.03):');
console.log(STYLES.map((s) => `${s.index + 1}.${s.name}${s.overlap ? '*' : ''}=${maxOv[s.name].toFixed(2)}`).join('  '));
console.log(`${checks} controles, ${errors} fouten`);
fs.rmSync(tmp, { recursive: true, force: true });
if (errors) process.exit(1);
