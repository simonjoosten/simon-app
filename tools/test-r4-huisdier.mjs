// Ronde 4, groep HUISDIER: node tools/test-r4-huisdier.mjs
// Test huisdier-r4-data.js (dieren, kleding, kamers, album, trucjes, events, prestaties), huisdier-r4-games.js (6 spelletjes), huisdier-r4-extra.js (4 onderdelen)
// en de koppeling in huisdier.js (opslag blijft werken). Geen browser: nep-DOM en nep-timers.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const docs = path.join(here, '..', 'docs');
const dir = (f) => pathToFileURL(path.join(docs, f)).href;
const D = await import(dir('huisdier-r4-data.js'));
const G = await import(dir('huisdier-r4-games.js'));
const X = await import(dir('huisdier-r4-extra.js'));
const MORE = await import(dir('huisdier-more.js'));
const ART = await import(dir('huisdier-art-pets.js'));
const ROOMS = await import(dir('huisdier-art-rooms.js'));
const { ICONS } = await import(dir('gfx/icons.js'));
const png = (n) => fs.existsSync(path.join(docs, 'art', '3d', n + '.png'));
const RID = /^[a-z0-9-]{1,24}$/;
let checks = 0; const ok = (c, m) => { checks++; assert.ok(c, m); };

// ---------------------------------------------------------------- XML-controle
function checkXml(svg, label) {
  ok(svg.startsWith('<svg') && svg.endsWith('</svg>'), label + ': svg-wortel'); ok(!/NaN|undefined|\[object/.test(svg), label + ': geen NaN/undefined');
  const re = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+(?:="[^"]*")?)*)\s*(\/?)>/g; const stack = []; let m, last = 0;
  while ((m = re.exec(svg))) {
    assert.ok(!/[<>]/.test(svg.slice(last, m.index)), label + ': losse < of >'); last = re.lastIndex;
    const [, close, name, attrs, selfc] = m;
    if (close) assert.equal(stack.pop(), name, label + ': tag-onbalans ' + name);
    else { const names = [...attrs.matchAll(/\s([\w:-]+)=/g)].map((x) => x[1]); assert.equal(new Set(names).size, names.length, label + ': dubbel attribuut'); if (!selfc) stack.push(name); }
  }
  assert.ok(!svg.slice(last).trim() && !stack.length, label + ': balans'); checks++;
  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]); assert.equal(new Set(ids).size, ids.length, label + ': dubbele id'); checks++;
}

// ---------------------------------------------------------------- dieren
const OLD_TYPES = ['kat', 'hond', 'konijn', 'panda', 'eend', 'kikker', 'eenhoorn', 'draakje'];
ok(D.R4_SPECIES.length >= 9, '9 nieuwe dieren');
for (const s of D.R4_SPECIES) {
  ok(/^[a-z]{3,12}$/.test(s.id) && !OLD_TYPES.includes(s.id), 'nieuw id ' + s.id); ok(ICONS[s.ic], 'icoon ' + s.ic); ok(png(s.ic), '3D-plaatje ' + s.ic);
  ok(s.pal.length === 6 && new Set(s.pal.map((p) => p.n)).size === 6, '6 kleuren ' + s.id); ok(s.pal.every((p) => /^#[0-9a-f]{6}$/.test(p.c[0]) && /^#[0-9a-f]{6}$/.test(p.c[1])), 'staaltjes ' + s.id);
  ok(['kat', 'hond', 'konijn', 'panda', 'eend', 'kikker', 'eenhoorn', 'draak'].includes(s.snd), 'stem ' + s.id);
  const h = D.r4AvatarInner(s.id, 2, 'art/3d/x.png'); ok(h.includes('hd-r4i') && h.includes('hue-rotate'), 'filter in plaatje'); ok(D.r4AvatarInner(s.id, 0, null).includes(s.e), 'emoji-terugval');
}
ok(D.isR4Species('vos') && !D.isR4Species('kat') && !D.isR4Species('__proto__'), 'isR4Species');
ok(D.R4_SPECIES_BY.vos.pal[0].f === 'none', 'eerste kleur = natuurlijk');

// ---------------------------------------------------------------- kleurlagen
ok(D.R4_TINTS.length >= 10 && new Set(D.R4_TINTS.map((t) => t.id)).size === D.R4_TINTS.length, '10 kleurlagen');
ok(D.tintClass({ tint: 1 }) === 'r4-t-goud' && D.tintClass({}) === '' && D.tintClass({ tint: 99 }) === '' && D.tintClass(undefined) === '', 'tintClass');
ok(D.tintOwned({ tints: 5 }, 0) && !D.tintOwned({ tints: 5 }, 1) && D.tintOwned({ tints: 5 }, 2) && D.tintCount({ tints: 5 }) === 2, 'bitmasker kleurlagen');
for (const t of D.R4_TINTS) ok(D.R4_CSS.includes('.r4-t-' + t.id), 'css ' + t.id);

// ---------------------------------------------------------------- kleding
ok(D.R4_ACC.length >= 20, '20+ kledingstukken: ' + D.R4_ACC.length);
const oldAcc = new Set(Object.values(ART.ACCESSORIES).flat().map((a) => a.id));
for (const a of D.R4_ACC) {
  ok(RID.test(a.id) && !oldAcc.has(a.id), 'nieuw veilig id ' + a.id); ok(D.R4_SLOTS.includes(a.slot), 'slot ' + a.id); ok(a.price > 0 && a.minLevel >= 1 && a.name, 'velden ' + a.id);
  ok(a.vb.length === 4 && a.vb.every(Number.isFinite), 'viewBox'); const d = a.draw(); ok(typeof d.front === 'string' && typeof d.back === 'string' && (d.front + d.back).length > 40, 'tekening ' + a.id);
}
ok(new Set(D.R4_ACC.map((a) => a.id)).size === D.R4_ACC.length, 'unieke kleding-id');
ok(D.R4_SLOTS.every((sl) => D.R4_ACC.filter((a) => a.slot === sl).length >= 4), 'minstens 4 per plek');
const W = D.wrapArt(ART);
ok(W.ACCESSORIES.hat.length === ART.ACCESSORIES.hat.length + D.R4_ACC.filter((a) => a.slot === 'hat').length, 'lijst uitgebreid'); ok(ART.ACCESSORIES.hat.every((a) => W.ACCESSORIES.hat.some((b) => b.id === a.id)), 'oude kleding blijft');
ok(W.SPECIES === ART.SPECIES && W.eggSVG === ART.eggSVG && W.MOODS === ART.MOODS, 'overige exports blijven');
// oude uitvoer onveranderd zonder nieuwe kleding
const plain = ART.petSVG('kat', { palette: 1, stage: 'volwassen', mood: 'blij', outfit: { hat: 'kroon' }, size: 200 });
const norm = (v) => v.replace(/\bh\d+(?=[A-Za-z])/g, 'hN').replace(/(["#])h\d+/g, '$1hN');
ok(norm(W.petSVG('kat', { palette: 1, stage: 'volwassen', mood: 'blij', outfit: { hat: 'kroon' }, size: 200 })) === norm(plain), 'oude kleding: identieke SVG (op id-teller na)');
let n = 0;
for (const sp of ART.SPECIES) for (const a of D.R4_ACC) { const sv = W.petSVG(sp.id, { palette: 0, stage: 'volwassen', mood: 'blij', outfit: { [a.slot]: a.id }, size: 120 }); checkXml(sv, sp.id + '+' + a.id); ok(sv.length > ART.petSVG(sp.id, { palette: 0, stage: 'volwassen', mood: 'blij', size: 120 }).length, 'kleding zit erin ' + a.id); n++; }
// alles tegelijk, baby-stadium, en ei
checkXml(W.petSVG('draak', { palette: 2, stage: 'baby', mood: 'slaap', outfit: { hat: 'r4-ijskroon', glasses: 'r4-vrbril', neck: 'r4-lint', body: 'r4-engelenvleugels' } }), 'volledige outfit');
checkXml(W.petSVG('kat', { stage: 'ei', outfit: { hat: 'r4-ijskroon' } }), 'ei negeert kleding');
checkXml(W.petSVG('kat', { outfit: { hat: 'r4-vrbril' } }), 'kleding op verkeerde plek wordt genegeerd');
for (const a of D.R4_ACC) checkXml(W.accessorySVG(a.slot, a.id, 64), 'preview ' + a.id);
checkXml(W.accessorySVG('hat', 'kroon', 64), 'oude preview');
ok(typeof ART.anchorsOf === 'function' && ART.anchorsOf('hond').mouthY === 115 && ART.anchorsOf('bestaat-niet').hx === 100, 'anchorsOf');

// ---------------------------------------------------------------- kamers en meubels
ok(D.R4_ROOMS.length === 3 && D.R4_FURN.length === 24, '3 kamers, 24 meubels');
const oldRooms = new Set(ROOMS.ROOMS.map((r) => r.id)), oldFurn = new Set(ROOMS.FURNITURE.map((f) => f.id)), moreFurn = new Set(MORE.MORE_FURN.map((f) => f[0]));
for (const r of D.R4_ROOMS) {
  ok(/^[a-z]{3,10}$/.test(r.id) && !['woon', 'keuken', 'slaap', 'bad', 'tuin', 'speel'].includes(r.id), 'kamer-id ' + r.id); ok(!oldRooms.has(r.a), 'art-id nieuw ' + r.a);
  ok(r.decor.length >= 5 && r.decor.every(([ic, x, y, w]) => ICONS[ic] && png(ic) && x >= 0 && x <= 100 && y >= 0 && y <= 100 && w > 0), 'decor ' + r.id);
  ok(D.R4_FURN.filter((f) => f[2] === r.a).length === 8, '8 meubels in ' + r.id);
  const html = D.roomBackdropHTML(r.id, (nm) => 'art/3d/' + nm + '.png', (nm) => ICONS[nm]); ok(html.includes('hd-r4bg') && html.includes('<img'), 'backdrop html'); ok(D.roomBackdropHTML(r.id, null, (nm) => ICONS[nm]).includes('<span'), 'backdrop emoji-terugval');
}
ok(D.roomBackdropHTML('woon', null) === '', 'oude kamers: geen backdrop');
for (const [id, name, room, price, lv, ic, e] of D.R4_FURN) { ok(RID.test(id) && !oldFurn.has(id) && !moreFurn.has(id), 'nieuw meubel-id ' + id); ok(D.R4_ROOMS.some((r) => r.a === room), 'kamer ' + room); ok(price > 0 && lv >= 1 && name && e, 'velden'); ok(ICONS[ic] && png(ic), 'icoon ' + ic); }
ok(new Set(D.R4_FURN.map((f) => f[0])).size === 24, 'unieke meubel-id');
const mf = MORE.MORE_FURN, fm = MORE.FURN_META, before = mf.length;
D.registerR4Furniture(mf, fm); D.registerR4Furniture(mf, fm);
ok(mf.length === before + 24, 'registratie is idempotent'); ok(MORE.isExtraFurn('r4-ufo') && fm['r4-ufo'].room === 'sterrenwacht', 'FURN_META bijgewerkt');
const ext = D.extendRoomsR4(MORE.extendRooms(ROOMS, (nm) => 'art/3d/' + nm + '.png'));
ok(ext.FURNITURE.length === ROOMS.FURNITURE.length + MORE.MORE_FURN.length, 'meubels in lijst'); ok(ext.FURNITURE.filter((f) => f.room === 'strandje').length === 8, 'strand-meubels in winkel');
for (const r of D.R4_ROOMS) { ok(ext.SLOT_POS[r.a].length === 8 && ext.FLOOR_Y[r.a] === 78, 'plekken ' + r.a); ok(!ROOMS.SLOT_POS[r.a], 'originele module niet aangepast'); }
ok(ext.furnitureSVG('r4-ufo', 40).includes('ufo.png') && ext.furnitureSVG('bank', 40).startsWith('<svg'), 'meubel-SVG');
const sp = MORE.overlaySpots(['r4-ufo', 'r4-alien', 0, 'bank'], ext.SLOT_POS.sterrenwacht, 'sterrenwacht'); ok(sp.length === 2 && sp[0].w > 10, 'overlay-plekken');
for (const r of D.R4_ROOMS) for (const night of [false, true]) checkXml(ext.roomSVG('huisje', r.a, { night, furniture: ['r4-ufo', 0], width: '100%', height: '100%' }), 'kamer-svg ' + r.a);
for (const h of ROOMS.HOUSES) checkXml(ext.roomSVG(h.id, 'zolderkamer', { furniture: [] }), 'huis ' + h.id + ' met nieuwe kamer');

// ---------------------------------------------------------------- album
ok(D.ALBUM_N === 56 && D.ALBUM.length === 56 && D.ALBUM_SETS.length === 7, '56 plaatjes in 7 sets');
for (const a of D.ALBUM) ok(ICONS[a.ic] && png(a.ic) && a.n, 'plaatje ' + a.ic);
for (const s of D.ALBUM_SETS) { ok(s.items.length === 8 && new Set(s.items.map((i) => i[0])).size === 8, 'set ' + s.id); ok(ICONS[s.ic], 'set-icoon'); }
{
  const st = {}; ok(D.albumCount(st) === 0 && !D.albumHas(st, 0), 'leeg album');
  ok(D.albumAdd(st, 0) && !D.albumAdd(st, 0), 'toevoegen + dubbel'); ok(D.albumAdd(st, 27) && D.albumAdd(st, 28) && D.albumAdd(st, 55), 'randen van de bitmaskers');
  ok(D.albumHas(st, 27) && D.albumHas(st, 28) && D.albumHas(st, 55) && !D.albumHas(st, 29) && D.albumCount(st) === 4, 'bits kloppen'); ok(st.albaa > 0 && st.albab > 0 && st.albaa < 2 ** 31 && st.albab < 2 ** 31, 'int32-veilig');
  ok(!D.albumAdd(st, -1) && !D.albumAdd(st, 56) && !D.albumAdd(st, NaN), 'ongeldige index');
  for (let i = 0; i < 8; i++) D.albumAdd(st, 8 + i); ok(D.setComplete(st, 1) && !D.setComplete(st, 0) && D.setsDone(st) === 1, 'set vol');
  ok(!D.setClaimed(st, 1) && D.setClaimed({ albclm: 2 }, 1), 'bonus-vlag');
  // pakjes: altijd minstens één nieuw plaatje zolang het album niet vol is
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const a2 = {}; let packs = 0; while (D.albumCount(a2) < 56 && packs < 200) { const got = D.drawStickers(3, a2, rnd); ok(got.length === 3 && got.every((i) => i >= 0 && i < 56), 'trekking'); const s0 = D.albumCount(a2); got.forEach((i) => D.albumAdd(a2, i)); ok(D.albumCount(a2) > s0, 'minstens 1 nieuw'); packs++; }
  ok(D.albumCount(a2) === 56 && packs < 100, 'album in ' + packs + ' pakjes vol');
  ok(D.drawStickers(3, a2, rnd).length === 3, 'ook met vol album'); ok(D.dayInt(new Date(2026, 10, 2)) === 20261102, 'dayInt');
}

// ---------------------------------------------------------------- trucjes
ok(D.TRICKS.length === 10 && new Set(D.TRICKS.map((t) => t.id)).size === 10, '10 trucjes');
for (const t of D.TRICKS) { ok(/^[a-z]{2,7}$/.test(t.id) && /^[a-z]{2,8}$/.test(D.trickKey(t.id)), 'st-sleutel ' + t.id); ok(D.R4_CSS.includes('.r4-do-' + t.id) && D.R4_CSS.includes('@keyframes r4-a-' + t.id), 'animatie ' + t.id); }
{
  const st = {}; ok(D.trickStars(st, 'zit') === 0 && D.tricksKnown(st) === 0 && D.trickLen(st, 'zit') === 3, 'start');
  st.kzit = 3; ok(D.trickStars(st, 'zit') === 1 && D.trickLen(st, 'zit') === 4 && D.tricksKnown(st) === 1, '3 oefeningen = 1 ster'); st.kzit = 8; ok(D.trickStars(st, 'zit') === 2); st.kzit = 15; ok(D.trickStars(st, 'zit') === 3 && D.trickLen(st, 'zit') === 6 && D.trickTotalStars(st) === 3, '15 = 3 sterren');
  ok(D.showReward(0) === 0 && D.showReward(3) === 6 && D.showReward(30) === 15, 'optreden-beloning gemaximeerd');
}

// ---------------------------------------------------------------- evenementen
const day = (y, m, d) => new Date(y, m - 1, d, 12), ids = (d) => D.r4EventsOn(d).map((e) => e.id);
ok(ids(day(2026, 10, 4)).join() === 'dierendag', 'dierendag'); ok(ids(day(2026, 11, 11)).join() === 'sintmaarten' && ids(day(2026, 12, 31)).join() === 'oudnieuw', 'sint-maarten, oud en nieuw');
ok(ids(day(2026, 5, 10)).join() === 'moederdag' && ids(day(2026, 5, 17)).length === 0, 'moederdag = 2e zondag mei'); ok(ids(day(2026, 6, 21)).join() === 'vaderdag', 'vaderdag = 3e zondag juni');
ok(ids(day(2026, 2, 15)).join() === 'carnaval' && ids(day(2026, 2, 17)).join() === 'carnaval' && ids(day(2026, 2, 18)).length === 0 && ids(day(2026, 2, 14)).length === 0, 'carnaval 15-17 feb 2026 (Pasen 5 april)');
ok(ids(day(2026, 5, 24)).join() === 'pinksteren' && ids(day(2026, 5, 25)).join() === 'pinksteren', 'pinksteren 2026'); ok(ids(day(2026, 1, 21)).join() === 'knuffeldag' && ids(day(2026, 3, 14)).join() === 'pidag', 'knuffel- en taartdag');
ok(ids(day(2026, 3, 3)).length === 0, 'gewone dag');
for (let y = 2024; y <= 2032; y++) for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) for (const e of D.r4EventsOn(new Date(y, m - 1, d, 12))) { ok(/^[a-z]{3,12}$/.test(e.id), 'claim-id ' + e.id); ok(ICONS[e.ic] && png(e.ic) && e.bonus > 0 && e.say && e.n && e.e, 'event-velden ' + e.id); }
{
  const seen = new Set(); for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) D.r4EventsOn(new Date(2026, m - 1, d, 12)).forEach((e) => seen.add(e.id)); ok(seen.size >= 10, 'minstens 10 extra feestdagen: ' + seen.size);
  const old = new Set(['nieuwjaar', 'valentijn', 'koningsdag', 'zomerdag', 'halloween', 'sint', 'kerst', 'pasen', 'verjaardag']); ok([...seen].every((i) => !old.has(i)), 'geen dubbele id met huisdier-more.js');
  const both = (dd) => MORE.eventsOn(dd).concat(D.r4EventsOn(dd)); const up = D.upcomingEvents(day(2026, 11, 2), both, 6);
  ok(up.length === 6 && up.every((e, i) => i === 0 || e.days >= up[i - 1].days) && up[0].id === 'sintmaarten' && up[0].days === 9, 'komende feestdagen op volgorde: ' + up.map((u) => u.id));
  ok(new Set(up.map((u) => u.id)).size === up.length, 'geen herhaling');
  const claims = MORE.addClaim([], D.r4EventsOn(day(2026, 10, 4))[0], day(2026, 10, 4)); ok(claims[0] === 'dierendag:2026' && MORE.cleanClaims(claims).length === 1, 'claim-sleutel overleeft cleanClaims');
  const plan = MORE.particlePlan(MORE.seasonOf(day(2026, 10, 4)), D.r4EventsOn(day(2026, 10, 4)), 2, false); ok(plan.length === 10 && plan.every((p) => ICONS[p.ic]), 'deeltjes');
}

// ---------------------------------------------------------------- prestaties
const OLD_ACH_IDS = new Set([...fs.readFileSync(path.join(docs, 'huisdier.js'), 'utf8').matchAll(/^  \['([a-z0-9]+)', '[^']+', '[^']+', '[^']*', /gm)].map((m) => m[1]));
ok(OLD_ACH_IDS.size >= 40, 'oude prestaties gevonden: ' + OLD_ACH_IDS.size);
ok(D.R4_ACH.length === 30 && new Set(D.R4_ACH.map((a) => a.id)).size === 30, '30 prestaties');
for (const a of D.R4_ACH) { ok(!OLD_ACH_IDS.has(a.id) && a.e && a.n && a.d && typeof a.t === 'function', 'prestatie ' + a.id); }
{
  const empty = { type: 'kat', st: {}, hs: {}, fp: {}, own: [] }; const x0 = { age: 0, lv: 1, placed: 0, clothes: 0, furn: 0 };
  ok(D.R4_ACH.every((a) => a.t(empty, x0) === false), 'niets gratis bij een nieuw huisdier');
  const full = { type: 'vos', st: { albaa: 2 ** 28 - 1, albab: 2 ** 28 - 1, albclm: 127, shown: 30, rgame: 60, calvis: 1, packsop: 25, tints: 1023 }, hs: Object.fromEntries(D.R4_GAME_IDS.map((g) => [g, 100])), fp: { zolder: ['r4-ufo'], strand: [0, 'r4-krab'], ruimte: ['r4-ufo'] }, own: D.R4_ACC.map((a) => a.id) };
  for (const t of D.TRICKS) full.st[D.trickKey(t.id)] = 15;
  ok(D.R4_ACH.every((a) => a.t(full, x0) === true), 'alles waar bij een volle save: ' + D.R4_ACH.filter((a) => !a.t(full, x0)).map((a) => a.id));
}

// ---------------------------------------------------------------- spelletjes: spelregels
ok(G.GAMES_R4.length === 6 && G.GAMES_R4.map((g) => g.id).join() === D.R4_GAME_IDS.join(), '6 spelletjes, ids gelijk aan R4_GAME_IDS');
for (const g of G.GAMES_R4) ok(/^[a-z]+$/.test(g.id) && g.name && g.desc && g.emoji && typeof g.create === 'function', 'spel ' + g.id);
for (const nm of G.ALL_ICON_NAMES) { ok(ICONS[nm], 'icoon bestaat ' + nm); ok(png(nm), '3D-plaatje bestaat ' + nm); }
{
  const seen = new Set(); for (let i = 0; i < 300; i++) seen.add(G.molKind(i / 300)[0]); ok([...seen].sort().join() === 'bee,bomb,rabbit', 'molKind'); ok(G.molStay(0) > G.molStay(25) && G.molStay(500) >= 0.65 && G.molDelay(0) > G.molDelay(25) && G.molDelay(900) >= 0.3, 'moltempo');
  ok(G.jumpY(0) === 0 && G.jumpY(G.RUN.jump) === 0 && Math.abs(G.jumpY(0.31) - 1) < 1e-9 && G.jumpY(-5) === 0 && G.jumpY(99) === 0, 'sprongboog');
  ok(G.runnerHit(0, 0, 10, 10, 5, 5, 10, 10) && !G.runnerHit(0, 0, 10, 10, 10, 0, 10, 10) && !G.runnerHit(0, 0, 10, 10, 0, 20, 5, 5), 'botsing'); ok(G.runSpeed(30) > G.runSpeed(0) && G.runGap(0) > G.runGap(30) && G.runGap(900) >= 0.85, 'rentempo');
  ok(G.patternNext([], () => 0.99).join() === '3' && G.patternNext([1], () => 0).join() === '1,0', 'patroon groeit'); ok(G.patternCheck([1, 2], 0, 1) === 'ok' && G.patternCheck([1, 2], 1, 2) === 'done' && G.patternCheck([1, 2], 0, 3) === 'wrong', 'patroon-controle'); ok(G.patternShow(1) > G.patternShow(10) && G.patternShow(99) >= 260, 'patroontempo');
  ok(G.popScore(true) === 2 && G.popScore(false) === -1, 'popscore'); for (let i = 0; i < 50; i++) ok(G.popTarget('star') !== 'star', 'nieuw doel');
  ok(G.caught(100, 300, 48, 100, 110, 310) && !G.caught(300, 300, 48, 100, 110, 310) && !G.caught(100, 100, 48, 100, 110, 310) && !G.caught(100, 400, 48, 100, 110, 310), 'vangen'); ok(G.fruitDelay(0) > G.fruitDelay(30) && G.fruitDelay(999) >= 0.32, 'fruittempo');
  const r = G.sortRounds(16); ok(r.length === 16, 'sorteerrondes'); const cnt = {}; r.forEach((x) => { cnt[x.cat] = (cnt[x.cat] || 0) + 1; ok(G.SORT.items[x.cat].includes(x.ic), 'item hoort bij categorie'); }); ok(Object.keys(cnt).length === 3 && Math.min(...Object.values(cnt)) >= 5, 'alle categorieen komen voor');
  const all = Object.values(G.SORT.items).flat(); ok(new Set(all).size === all.length, 'geen item in twee categorieen');
  ok(G.scale100(5, 10) === 50 && G.scale100(99, 10) === 100, 'scale100 doorgegeven');
}

// ---------------------------------------------------------------- spelletjes: rooktest met nep-DOM
class El {
  constructor(t) { this.tag = t; this.style = {}; this.children = []; this.listeners = {}; this.parentNode = null; this._html = ''; this.textContent = ''; this.offsetWidth = 1; this.clientWidth = 360; this.clientHeight = 560; }
  set innerHTML(v) { this._html = v; } get innerHTML() { return this._html; }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentNode = null; return c; }
  addEventListener(t, f) { (this.listeners[t] ||= []).push(f); } removeEventListener(t, f) { this.listeners[t] = (this.listeners[t] || []).filter((x) => x !== f); }
  fire(t, e = {}) { (this.listeners[t] || []).slice().forEach((f) => f({ preventDefault() {}, clientX: 120, clientY: 5, ...e })); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 360, height: 560 }; }
  all() { return this.children.flatMap((c) => [c, ...c.all()]); }
}
globalThis.document = { createElement: (t) => new El(t) };
let rafQ = []; globalThis.requestAnimationFrame = (f) => { rafQ.push(f); return rafQ.length; }; globalThis.cancelAnimationFrame = () => {};
const step = (n, t0 = 0) => { for (let i = 0; i < n; i++) { const q = rafQ; rafQ = []; q.forEach((f) => f(t0 + (i + 1) * 40)); } };
const gfx = { iconSrc: (nm) => 'art/3d/' + nm + '.png', emoji: (nm) => ICONS[nm] };
const mkApi = (log) => ({ w: 360, h: 560, score: (v) => log.score.push(v), end: (v) => { log.end = v; }, pet: { html: (s) => `<i>${s}</i>` }, gfx });
for (const g of G.GAMES_R4) {
  const host = new El('div'), log = { score: [], end: null }; const inst = g.create(host, mkApi(log)); ok(inst && typeof inst.destroy === 'function', g.id + ' maakt een instantie');
  step(40); for (const e of host.all()) if (e.listeners.pointerdown) e.fire('pointerdown'); for (const e of [host, ...host.all()]) if (e.listeners.pointermove) e.fire('pointermove'); step(40);
  inst.destroy(); inst.destroy(); ok(host.children.length === 0, g.id + ' ruimt zijn DOM op');
  ok(log.score.every((s) => Number.isInteger(s) && s >= 0 && s <= 100), g.id + ' scores 0-100: ' + log.score.slice(0, 5));
}
// geen gfx/pet meegegeven: emoji-terugval, geen crash
for (const g of G.GAMES_R4) { const host = new El('div'); const inst = g.create(host, { w: 300, h: 420, score() {}, end() {} }); step(10); for (const e of host.all()) if (e.listeners.pointerdown) e.fire('pointerdown'); step(5); inst.destroy(); }
// een heel spel uitspelen tot de eindscore (zonder te tikken): molletjes, bellenprik, fruitmand, hindernisren komen op score 0..100
for (const id of ['molletjes', 'ballonpop', 'fruitmand', 'hindernis']) {
  const g = G.GAMES_R4.find((x) => x.id === id), host = new El('div'), log = { score: [], end: null }; const inst = g.create(host, mkApi(log));
  step(900); ok(log.score.length > 0, id + ' heeft de eindscore gemeld'); ok(log.score[log.score.length - 1] <= 100, id + ' eindscore'); inst.destroy();
}
{ // molletjes: alle beestjes aantikken geeft punten, bommen kosten punten
  const g = G.GAMES_R4.find((x) => x.id === 'molletjes'), host = new El('div'), log = { score: [], end: null }; const inst = g.create(host, mkApi(log));
  for (let r = 0; r < 60; r++) { step(8); for (const e of host.all()) if (e.listeners.pointerdown) e.fire('pointerdown'); }
  ok(log.score.length > 0 && Math.max(...log.score) > 0, 'molletjes: tikken levert punten op: ' + Math.max(...log.score)); inst.destroy();
}
{ // patroon: foute tik beëindigt, goede tikken tellen (met versnelde timers)
  const realST = globalThis.setTimeout; globalThis.setTimeout = (f, ms) => realST(f, Math.floor((ms || 0) / 200));
  const g = G.GAMES_R4.find((x) => x.id === 'patroon'), host = new El('div'), log = { score: [], end: null }; const inst = g.create(host, mkApi(log));
  await new Promise((r) => realST(r, 120)); const pads = host.all().filter((e) => e.listeners.pointerdown); ok(pads.length === 4, 'patroon: 4 knoppen');
  inst.destroy(); globalThis.setTimeout = realST;
}

// ---------------------------------------------------------------- onderdelen (album, trucjes, salon, kalender) met nep-api
function mkHost() { const h = new El('div'); h.dataset = {}; return h; }
const click = (host, act, v = '') => { const t = { dataset: { act, v }, parentNode: host }; host.listeners.click.forEach((f) => f({ target: t })); };
function mkApi2(init = {}) {
  const st = { ...init }, log = { toasts: [], awards: [], sounds: [], refresh: 0 }; let coins = init.__coins ?? 500, lvl = init.__lv ?? 12; delete st.__coins; delete st.__lv;
  const api = {
    w: 360, h: 560, gfx, pet: { html: (s) => `<b>pet${s}</b>`, name: 'Fien' }, toast: (m) => log.toasts.push(m), award: (a) => log.awards.push(a), sound: (n) => log.sounds.push(n),
    r4: { get: (k) => st[k] | 0, set: (k, v) => { st[k] = Math.floor(v); }, add: (k, n) => { st[k] = (st[k] | 0) + n; }, spend: (n) => { if (coins < n) return false; coins -= n; return true; }, earn: (n) => { coins += n; return n; }, level: () => lvl, born: Date.now() - 5 * 86400000, evOn: (d) => MORE.eventsOn(d).concat(D.r4EventsOn(d)), refresh: () => { log.refresh++; } },
  };
  return { api, st, log, coins: () => coins };
}
const realST = globalThis.setTimeout; globalThis.setTimeout = (f, ms) => realST(f, Math.floor((ms || 0) / 100));
const wait = (ms) => new Promise((r) => realST(r, ms));
{ // album
  const m = mkApi2(), host = mkHost(), inst = X.R4_EXTRAS.find((e) => e.id === 'album').create(host, m.api);
  ok(host.innerHTML.includes('Plakboek') && host.innerHTML.includes('Dagpakje') && host.innerHTML.includes('0 van 56'), 'album tekent');
  click(host, 'pack', 'free'); const n1 = D.albumCount({ albaa: m.st.albaa, albab: m.st.albab }); ok(n1 === 3 && m.st.albday === D.dayInt(new Date()) && m.st.packsop === 1, 'dagpakje geeft 3 nieuwe plaatjes'); ok(host.innerHTML.includes('Dit zat erin'), 'pakje getoond');
  click(host, 'pack', 'free'); ok(D.albumCount({ albaa: m.st.albaa, albab: m.st.albab }) === 3, 'dagpakje maar één keer per dag');
  click(host, 'pack', 'earned'); ok(m.st.packsop === 1, 'geen spelpakje zonder pakje'); m.st.packs = 2; click(host, 'pack', 'earned'); ok(m.st.packs === 1 && m.st.packsop === 2, 'spelpakje gebruikt');
  const c0 = m.coins(); click(host, 'pack', 'buy'); ok(m.coins() <= c0 - 20 + 6 && m.st.packsop === 3, 'gekocht pakje kost 20');
  const poor = mkApi2({ __coins: 5 }), h2 = mkHost(); X.R4_EXTRAS[0].create(h2, poor.api); click(h2, 'pack', 'buy'); ok(!poor.st.packsop && h2.innerHTML.includes('nodig'), 'te weinig munten: geen pakje');
  // set vol -> bonus precies één keer
  const m3 = mkApi2({ albaa: 0b11111111, __coins: 0 }), h3 = mkHost(); X.R4_EXTRAS[0].create(h3, m3.api); m3.st.packs = 3; click(h3, 'pack', 'earned'); ok((m3.st.albclm & 1) === 1 && m3.coins() >= 25 && m3.log.toasts.some((t) => t.includes('Boerderij')), 'setbonus (nu: ' + m3.coins() + ')');
  const c1 = m3.coins(); click(h3, 'pack', 'earned'); ok(m3.coins() < c1 + 25, 'setbonus maar één keer');
  click(host, 'sticker', '3'); ok(host.innerHTML.includes('Dit plaatje') || host.innerHTML.includes('zeldzaam') || host.innerHTML.includes('Boerderij'), 'plaatje-info'); inst.destroy(); ok(host.innerHTML === '', 'album ruimt op'); click(host, 'pack', 'free');
}
{ // trucjes: oefenen met de juiste en foute volgorde
  const m = mkApi2(), host = mkHost(), inst = X.R4_EXTRAS.find((e) => e.id === 'trucjes').create(host, m.api);
  ok(host.innerHTML.includes('Trucjes') && host.innerHTML.includes('Oefen') && host.innerHTML.includes('Optreden'), 'trucjes tekent');
  const real = Math.random; Math.random = () => 0.1; // reeks = allemaal 0 (links)
  click(host, 'train', 'zit'); await wait(120); ok(host.innerHTML.includes('Jouw beurt'), 'invoerfase na het voorbeeld');
  click(host, 'arrow', '0'); click(host, 'arrow', '0'); click(host, 'arrow', '0'); ok(m.st.kzit === 1 && m.log.awards.length === 1, 'goed gedaan: teller omhoog'); ok(m.st.trn === 1, 'dagelijkse munten geteld');
  click(host, 'train', 'zit'); await wait(120); click(host, 'arrow', '3'); ok(m.st.kzit === 1 && host.innerHTML.includes('mis'), 'fout: geen punt');
  for (let i = 0; i < 8; i++) { click(host, 'train', 'zit'); await wait(150); const len = D.trickLen({ kzit: m.st.kzit | 0 }, 'zit'); for (let j = 0; j < len; j++) click(host, 'arrow', '0'); }
  ok(m.st.kzit >= 3 && D.trickStars(m.st, 'zit') >= 1, 'na meer oefenen: ster (' + m.st.kzit + ')'); ok(m.st.trn <= 5, 'maximaal 5 beloningen per dag: ' + m.st.trn);
  Math.random = real;
  click(host, 'show'); await wait(250); ok(m.st.shown === 1 && m.st.shwn === 1 && m.log.awards.some((a) => a.xp === 10), 'optreden gegeven'); for (let i = 0; i < 4; i++) click(host, 'show'); await wait(250); ok(m.st.shown <= 3, 'maximaal 3 optredens per dag: ' + m.st.shown);
  click(host, 'do', 'zit'); ok(host.innerHTML.includes('r4-do-zit'), 'trucje-animatie'); inst.destroy(); ok(host.innerHTML === '', 'trucjes ruimt op');
  const m2 = mkApi2({ __lv: 1 }), h2 = mkHost(); X.R4_EXTRAS[1].create(h2, m2.api); ok(h2.innerHTML.includes('vanaf niveau 12'), 'vergrendelde trucjes tonen niveau'); click(h2, 'train', 'tover'); ok(!h2.innerHTML.includes('Kijk goed'), 'te hoog niveau: geen training'); click(h2, 'show'); ok(!m2.st.shown, 'optreden zonder trucjes kan niet');
}
{ // salon
  const m = mkApi2({ __lv: 3, __coins: 100 }), host = mkHost(), inst = X.R4_EXTRAS.find((e) => e.id === 'salon').create(host, m.api);
  ok(host.innerHTML.includes('Kleurensalon') && host.innerHTML.includes('Goud'), 'salon tekent');
  click(host, 'buy', '0'); ok(!m.st.tints, 'goud vergrendeld onder niveau 6'); click(host, 'buy', '3'); ok(D.tintOwned(m.st, 3) && m.st.tint === 4 && m.coins() === 60, 'pastel gekocht (40) en gekozen');
  click(host, 'wear', '8'); ok(m.st.tint === 4, 'niet-gekochte laag kan niet gedragen worden'); click(host, 'wear', '-1'); ok(m.st.tint === 0, 'terug naar gewoon');
  click(host, 'wear', '3'); ok(m.st.tint === 4, 'gekochte laag dragen'); click(host, 'buy', '3'); ok(m.coins() === 60, 'niet dubbel betalen');
  click(host, 'look', '1'); ok(host.innerHTML.includes('r4-t-regenboog'), 'voorbeeld met kleurlaag'); const p = mkApi2({ __lv: 20, __coins: 10 }), h2 = mkHost(); X.R4_EXTRAS[2].create(h2, p.api); click(h2, 'buy', '1'); ok(!p.st.tints && h2.innerHTML.includes('nodig'), 'te weinig munten'); inst.destroy();
}
{ // kalender
  const m = mkApi2(), host = mkHost(), inst = X.R4_EXTRAS.find((e) => e.id === 'kalender').create(host, m.api);
  ok(m.st.calvis === 1 && host.innerHTML.includes('Feestkalender') && host.innerHTML.includes('Verjaardag van je huisdier') && host.innerHTML.includes('+'), 'kalender tekent'); ok((host.innerHTML.match(/over \d+ dagen|Morgen|Vandaag!/g) || []).length >= 8, 'komende feestdagen'); inst.destroy();
}
for (const e of X.R4_EXTRAS) ok(/^[a-z]+$/.test(e.id) && e.name && e.desc && e.emoji && typeof e.create === 'function', 'extra ' + e.id);
globalThis.setTimeout = realST;

// ---------------------------------------------------------------- koppeling met huisdier.js: opslag blijft werken
const hsrc = fs.readFileSync(path.join(docs, 'huisdier.js'), 'utf8');
for (const needle of ["from './huisdier-r4-data.js?v=1'", "import('./huisdier-r4-games.js?v=1')", "import('./huisdier-r4-extra.js?v=1')", 'registerR4Furniture(MORE_FURN, FURN_META)', 'extendRoomsR4(', 'wrapArt(m)', 'isR4Species(s.type)', 'r4Backdrop(room)', 'r4: r4Api()', 'for (const a of R4_ACH) ACH.push', 'R4_GAME_IDS.includes(g.g.id)', 'r4EventsOn(new Date())', 'tintClass(s.st)', '${R4_CSS}', 'exAll()'])
  ok(hsrc.includes(needle), 'huisdier.js bevat ' + needle);
const tmp = path.join(docs, 'huisdier-r4-tmp.mjs');
fs.writeFileSync(tmp, hsrc.replace(/import \{ doc, getDoc, setDoc \}\s+from 'https:[^']+';/, 'const doc = () => ({}), getDoc = async () => ({ exists: () => false }), setDoc = async () => {};'));
let H;
try { H = await import(pathToFileURL(tmp).href); } finally { fs.unlinkSync(tmp); }
{
  const now = Date.now();
  // nieuw dier + nieuwe kamers overleven opslaan en laden
  const s = H.newPet({ type: 'vos', name: 'Foxy', hue: 3 }, now);
  ok(s.type === 'vos' && s.hue === 3, 'newPet met nieuw dier');
  s.fp = { zolder: ['r4-schatkist', 0, 'r4-spookje'], strand: [0, 'r4-krab'], ruimte: ['r4-ufo'], woon: ['bank'] }; s.own = ['r4-schatkist', 'r4-krab', 'r4-ufo', 'r4-ijskroon', 'bank']; s.wr = { h: 'r4-ijskroon', f: 'r4-vrbril' };
  s.st = { tint: 4, tints: 8, albaa: 255, albab: 1, albclm: 1, kzit: 5, packs: 2, rgame: 3 }; s.hs = { molletjes: 80, patroon: 7 }; s.ach = ['r4alb8'];
  const raw = H.packState(s); ok(raw.length < 18000, 'save past: ' + raw.length + ' tekens'); const back = H.parseState(raw);
  ok(back && back.type === 'vos' && back.hue === 3, 'dier blijft'); ok(back.fp.zolder[2] === 'r4-spookje' && back.fp.strand[1] === 'r4-krab' && back.fp.ruimte[0] === 'r4-ufo' && back.fp.zolder.length === 8, 'nieuwe kamers blijven (8 plekken)');
  ok(back.wr.h === 'r4-ijskroon' && back.own.includes('r4-ufo'), 'kleding en meubels blijven'); ok(back.st.tint === 4 && back.st.albaa === 255 && back.st.kzit === 5 && back.st.packs === 2, 'tellers blijven'); ok(back.hs.molletjes === 80 && back.ach.includes('r4alb8'), 'highscores en prestaties blijven');
  for (const t of D.R4_SPECIES) { const p = H.parseState(H.packState(H.newPet({ type: t.id, name: 'X' }, now))); ok(p && p.type === t.id, 'alle nieuwe dieren laden: ' + t.id); }
  // oude saves: elk oud type, een v3-save zonder nieuwe velden, en een onbekend type
  for (const t of OLD_TYPES) ok(H.parseState(H.packState(H.newPet({ type: t, name: 'Oud' }, now))).type === t, 'oud type ' + t);
  const old = JSON.stringify({ v: 3, name: 'Bella', type: 'kat', hue: 2, pe: 'lief', born: now - 9e8, h: now - 8e8, last: now, hunger: 70, happy: 70, energy: 70, clean: 70, bond: 40, xp: 400, coins: 55, rm: 'woon', fp: { woon: ['bank'], tuin: ['i-boom'] }, st: { feed: 12 }, hs: { sterrenregen: 44 }, ach: ['egg', 'hatch'] });
  const o = H.parseState(old); ok(o && o.type === 'kat' && o.fp.woon[0] === 'bank' && o.fp.tuin[0] === 'i-boom' && o.hs.sterrenregen === 44 && o.ach.length === 2, 'oude v3-save blijft kloppen'); ok(!o.st.tint && o.fp.zolder.every((v) => v === 0), 'nieuwe velden hebben veilige standaardwaarden');
  ok(H.parseState(JSON.stringify({ v: 3, type: 'bestaat-niet' })) === null, 'onbekend dier wordt geweigerd'); ok(H.parseState(JSON.stringify({ v: 3, type: 'vos', st: { 'x-1': 5, albaa: 7 }, fp: { zolder: ['<script>', 'r4-ufo'] } })).fp.zolder.join() === '0,r4-ufo,0,0,0,0,0,0', 'gevaarlijke id\'s worden weggefilterd');
  // pakket blijft klein bij veel gegevens
  const big = H.newPet({ type: 'leeuw', name: 'Groot' }, now); big.st = Object.fromEntries(['albaa', 'albab', 'albclm', 'albday', 'packs', 'packsop', 'tint', 'tints', 'trday', 'trn', 'shwday', 'shwn', 'shown', 'rgame', 'calvis', ...D.TRICKS.map((t) => D.trickKey(t.id))].map((k) => [k, 123456789])); ok(H.packState(big).length < 3000, 'r4-tellers: klein: ' + H.packState(big).length);
}
console.log(`r4 huisdier OK (${checks} controles, ${n} kleding-SVG's)`);
