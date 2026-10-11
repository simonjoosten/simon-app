// Node-test voor docs/big-stadbouwer.js
//   node tools/test-big-stadbouwer.mjs            alle tests + economiesimulatie (samenvatting)
//   node tools/test-big-stadbouwer.mjs --sim 6    uitgebreide simulatie van 6 uur (tabel)
// Pure logica (economie, opslag, offline, prestige, events) + tekenen met een nep-canvas + (als jsdom beschikbaar is) de hele view met een nep-Firestore.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(here, '..', 'docs', 'big-stadbouwer.js');
let checks = 0;
const fail = (m) => { console.error('FAIL:', m); process.exitCode = 1; throw new Error(m); };
const ok = (c, m) => { checks++; if (!c) fail(m); };
const near = (a, b, eps, m) => ok(Math.abs(a - b) <= eps, `${m} (${a} vs ${b})`);

// de https-import van Firestore vervangen door een mock (leest/schrijft in globalThis.__FS)
const STUB = `const doc=(db,...p)=>({path:p.join('/')});
const getDoc=async(r)=>{const F=globalThis.__FS;F.reads++;const v=F.store.get(r.path);return{exists:()=>v!==undefined,data:()=>v}};
const setDoc=async(r,d)=>{const F=globalThis.__FS;if(F.fail)throw new Error('offline');F.writes.push({path:r.path,data:JSON.parse(JSON.stringify(d))});F.store.set(r.path,JSON.parse(JSON.stringify(d)))};`;
globalThis.__FS = { store: new Map(), writes: [], reads: 0, fail: false };
const code = fs.readFileSync(SRC, 'utf8').replace(/import \{[^}]*\} from 'https:[^']*';/, STUB);
ok(code.includes(STUB.slice(0, 20)), 'import vervangen');
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'sb-')), 'big-stadbouwer.mjs');
fs.writeFileSync(tmp, code);
const M = await import(pathToFileURL(tmp).href);
const { BD, BUILDABLE, CATS, UPG, PERKS, GOALS, ACHS, PROJECTS, newCity, calc, step, place, bulldoze, canPlace, buildCost, upgradeBuilding, canUpgrade, buyUp, buyLand, buyProject, buyPerk,
  serialize, deserialize, pickNewest, offlineProgress, prestige, starsFor, canPrestige, dailyInfo, claimDaily, claimGoal, checkAch, tickEvents, douse, takeGift, clearDebris,
  resolveChoice, MAX_DATA, MAX_OFFLINE, mapSize, inLand, landCost, maxLand, isUnlocked, unlockPop, drawCity, carsStep, upgradeCost } = M;

/* ---------- 1. data ---------- */
for (const ch of Object.keys(BD)) {
  const B = BD[ch]; ok(B.n && B.e && B.cat && B.d && typeof B.c === 'number', `gebouw ${ch} compleet`);
  ok(ch.length === 1, 'sleutel is één teken'); ok(B.cat === 'x' || CATS.some((c) => c.id === B.cat), `categorie van ${ch}`);
}
ok(BUILDABLE.length >= 30, 'minstens 30 bouwbare dingen'); ok(!BUILDABLE.includes('H'), 'stadhuis niet bouwbaar');
ok(new Set(BUILDABLE.map((c) => BD[c].n)).size === BUILDABLE.length, 'unieke namen');
ok(GOALS.length >= 25 && ACHS.length >= 20 && UPG.length >= 8 && PROJECTS.length >= 5 && PERKS.length >= 4, 'genoeg doelen, prestaties, upgrades');
ok(new Set(ACHS.map((a) => a.id)).size === ACHS.length, 'unieke prestatie-id\'s');
for (const cat of CATS) ok(BUILDABLE.some((c) => BD[c].cat === cat.id), `categorie ${cat.id} heeft gebouwen`);

/* ---------- 2. stad en terrein ---------- */
const A = newCity(1234), B2 = newCity(1234), C2 = newCity(99);
ok(A.g.join('') === B2.g.join(''), 'terrein is deterministisch'); ok(A.g.join('') !== C2.g.join(''), 'ander zaadje, ander terrein');
const N = A.size, cx = Math.floor(N / 2);
ok(A.g.length === N * N && A.lv.length === N * N, 'rastergrootte'); ok(A.g[cx * N + cx] === 'H', 'stadhuis in het midden');
for (let dy = -2; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) ok(A.g[(cx + dy) * N + cx + dx] !== 'w', 'startgebied is droog');
for (let s = 1; s <= 30; s++) { const T = newCity(s); const water = T.g.filter((c) => c === 'w').length; ok(water < T.g.length * 0.4, `zaad ${s} niet te veel water`); }
ok(mapSize({}) === 22 && mapSize({ map: 3 }) === 28 && mapSize({ map: 9 }) === 32, 'kaartgrootte met erfenis');

/* ---------- 3. bouwen, kosten, grond ---------- */
{
  const S = newCity(5); S.money = 100000;
  const i = (cx + 3) * N + cx;
  ok(inLand(S, i), 'startgrond'); ok(!inLand(S, 0), 'hoek is nog niet van jou');
  ok(!canPlace(S, 0, 'h').ok, 'bouwen buiten je grond kan niet');
  const c1 = buildCost(S, 'h'); ok(c1 === 30, `eerste huisje kost 30 (${c1})`);
  ok(place(S, i, 'h').ok && S.g[i] === 'h', 'huisje geplaatst'); ok(S.money === 100000 - 30, 'geld afgetrokken');
  ok(buildCost(S, 'h') > c1, 'bouwen wordt duurder naarmate je stad groeit');
  ok(!place(S, i, 'h').ok, 'niet dubbel bouwen'); ok(!canPlace(S, cx * N + cx, 'h').ok, 'niet op stadhuis');
  const w = S.g.findIndex((c) => c === 'w'); ok(!canPlace(S, w, 'h').ok, 'niet op water');
  const r = bulldoze(S, i); ok(r.ok && r.refund > 0 && S.g[i] === '.', 'slopen geeft geld terug');
  ok(!bulldoze(S, cx * N + cx).ok, 'stadhuis kun je niet slopen');
  const P = newCity(5); P.money = 0; ok(!canPlace(P, i, 'h').ok, 'te weinig geld'); ok(canPlace(P, i, 'h').why === 'Te weinig geld.', 'duidelijke melding');
  ok(!isUnlocked(P, 'f') && isUnlocked(P, 'h'), 'flat is vergrendeld, huisje niet'); P.peak = 130; ok(isUnlocked(P, 'f'), 'ontgrendeld bij 120 inwoners');
  const L = newCity(5); ok(buyLand(L).ok === false, 'grond kopen kost geld'); L.money = 1e6; const R0 = L.land; ok(buyLand(L).ok && L.land === R0 + 1, 'grond kopen'); ok(inLand(L, 4 * N + 4), 'groter gebied');
  while (L.land < maxLand(L)) buyLand(L); ok(!buyLand(L).ok, 'niet meer dan de kaart');
  ok(landCost({ land: 0 }) < landCost({ land: 3 }), 'grond wordt duurder');
  // upgraden
  const U = newCity(5); U.money = 1e6; U.peak = 100; const j = (cx + 3) * N + cx + 1; place(U, j, 'h');
  ok(canUpgrade(U, j).ok, 'upgraden kan'); const lc = upgradeCost(U, j); ok(upgradeBuilding(U, j).ok && U.lv[j] === 2, 'niveau 2'); ok(!canUpgrade(U, j).ok, 'niveau 3 pas bij 400'); U.peak = 450; ok(upgradeBuilding(U, j).ok && U.lv[j] === 3, 'niveau 3'); ok(!canUpgrade(U, j).ok, 'max niveau'); ok(lc > 0, 'upgradekosten');
}

/* ---------- 4. rekenkern ---------- */
{
  const S = newCity(7); let st = calc(S);
  ok(st.net > 0, 'een lege stad heeft netto inkomen (gemeentefonds)'); ok(Number.isFinite(st.happy) && st.happy >= 0 && st.happy <= 100, 'blijdschap tussen 0 en 100');
  const hx = cx - 1, hy = cx + 2; S.money = 1e5;
  place(S, hy * N + hx, 'h'); st = calc(S); ok(st.disc.includes(hy * N + hx) === false, 'huis naast weg (y=cy+1) werkt'); ok(st.cap === 4, 'capaciteit 4');
  const far = (cx + 5) * N + cx - 3; place(S, far, 'h'); st = calc(S); ok(st.disc.includes(far), 'huis zonder weg is losgekoppeld'); ok(st.cap === 4, 'losgekoppeld huis telt niet mee');
  S.pop = 4; place(S, (cx + 2) * N + cx + 2, 'b'); st = calc(S); ok(st.jobs === 5, 'boerderij geeft 5 banen');
  // stroom en water
  const T = newCity(8); T.money = 1e6; T.peak = 1000; T.pop = 300;
  for (let x = 0; x < 6; x++) place(T, (cx + 2) * N + cx - 3 + x, 'f'); let s0 = calc(T); ok(s0.pr < 1 || s0.demP <= s0.pwr, 'stroom kan tekortschieten'); const happy0 = s0.happy;
  for (let k = 0; k < 8; k++) place(T, (cx + 5) * N + 2 + k, 'W'); const s1 = calc(T); ok(s1.pwr > s0.pwr, 'windmolens leveren stroom'); ok(s1.happy >= happy0, 'meer stroom is niet slechter');
  // belasting
  const X = newCity(9); X.money = 1e5; X.peak = 100; X.pop = 100; for (let k = 0; k < 5; k++) place(X, (cx + 2) * N + cx - 3 + k, 'j');
  X.tax = 10; const a = calc(X); X.tax = 20; const b = calc(X); ok(b.taxI > a.taxI, 'hogere belasting, meer geld'); ok(b.happy < a.happy, 'hogere belasting, minder blij'); X.tax = 5; ok(calc(X).happy > a.happy, 'lagere belasting maakt blij');
  // vervuiling
  const V = newCity(10); V.money = 1e6; V.peak = 1000; V.pop = 50; place(V, (cx + 2) * N + cx - 1, 'j'); const hi = (cx + 2) * N + cx - 1, clean = calc(V).hm[hi]; place(V, (cx + 2) * N + cx, 'i'); place(V, (cx + 2) * N + cx + 1, 'E'); ok(calc(V).hm[hi] < clean, 'fabriek en centrale vervuilen');
  // park maakt blij
  const Pk = newCity(11); Pk.money = 1e6; Pk.peak = 100; Pk.pop = 50; place(Pk, (cx + 2) * N + cx - 1, 'j'); const h0 = calc(Pk).hm[(cx + 2) * N + cx - 1]; place(Pk, (cx + 2) * N + cx, 'g'); ok(calc(Pk).hm[(cx + 2) * N + cx - 1] > h0, 'park naast huis verhoogt blijdschap');
  // verkeer
  const Tr = newCity(12); Tr.money = 1e6; Tr.peak = 1000; Tr.pop = 2000; place(Tr, (cx + 2) * N + cx - 1, 'k'); const t0 = calc(Tr).ti; for (let k = 0; k < 3; k++) place(Tr, (cx + 2) * N + cx + 1 + k, 'X'); ok(calc(Tr).ti <= t0, 'treinstation verlaagt verkeersdruk');
  // geld mag nooit negatief worden, ook niet bij hoge kosten
  const D = newCity(13); D.money = 5; D.peak = 5000; for (let k = 0; k < 20; k++) D.g[(cx + 2) * N + 2 + k] = 'P'; D.pop = 0;
  for (let k = 0; k < 600; k++) { step(D, 1); ok(D.money >= 0, 'geld nooit negatief'); } ok(calc(D).crunch || D.money >= 0, 'noodinkomen');
  const E = newCity(14); E.g = E.g.map((c) => (c === 'H' || c === 'w' ? '.' : c === 'r' ? '.' : c)); const e0 = E.money; step(E, 100); ok(E.money > e0, 'ook zonder gebouwen groeit je geld (nooit vastlopen)');
}

/* ---------- 5. opslag ---------- */
{
  const S = newCity(21); S.money = 123456.7; S.pop = 77.77; S.peak = 88; S.stars = 3; S.spent = 1; S.perks = { start: 1 }; S.up = { tax: 2, bld: 1 }; S.ach = ['h1', 'p25']; S.goal = 4; S.tax = 12; S.deb = [5, 9]; S.land = 2; S.proj = { expo: 1 };
  S.g[40] = 'f'; S.lv[40] = 3; S.daily = { d: '2026-10-10', s: 3 };
  const s = serialize(S); ok(typeof s === 'string' && s.length < MAX_DATA, `opslag compact (${s.length} tekens)`);
  const R = deserialize(s); ok(R, 'terug te lezen'); ok(R.g.join('') === S.g.join('') && R.lv.join('') === S.lv.join(''), 'raster en niveaus blijven gelijk');
  ok(Math.floor(R.money) === 123456 && Math.abs(R.pop - 77.8) < 0.11 && R.peak === 88 && R.stars === 3 && R.spent === 1 && R.perks.start === 1 && R.up.tax === 2 && R.goal === 4 && R.tax === 12 && R.land === 2 && R.proj.expo === 1 && R.deb.length === 2 && R.daily.s === 3 && R.ach.length === 2, 'alle velden overleven opslaan');
  ok(deserialize('niet json') === null && deserialize('{}') === null && deserialize(JSON.stringify({ n: 22, g: 'abc' })) === null, 'kapotte data wordt afgewezen');
  const bad = JSON.parse(s); bad.m = 'x'; bad.tx = 999; bad.st = null; const R2 = deserialize(JSON.stringify(bad)); ok(R2 && R2.money === 0 && R2.tax === 20 && R2.stars === 0, 'rare waarden worden gerepareerd');
  const old = JSON.parse(s); delete old.ld; delete old.pj; const R3 = deserialize(JSON.stringify(old)); ok(R3.land >= 0 && typeof R3.proj === 'object', 'oude opslag zonder grond/projecten wordt gemigreerd');
  // grootste geval: kaart 32x32, alle prestaties
  const Big = newCity(22, { perks: { map: 5 }, ach: ACHS.map((a) => a.id) }); ok(Big.size === 32, '32x32 kaart'); for (let i = 0; i < Big.g.length; i++) { if (Big.g[i] === '.') { Big.g[i] = 'k'; Big.lv[i] = 3; } } Big.up = Object.fromEntries(UPG.map((u) => [u.id, u.max])); Big.perks = Object.fromEntries(PERKS.map((p) => [p.id, p.max])); Big.proj = Object.fromEntries(PROJECTS.map((p) => [p.id, 1]));
  const sb = serialize(Big); ok(sb.length <= MAX_DATA, `zelfs de grootste stad past (${sb.length} <= ${MAX_DATA})`);
  // nieuwste kiezen
  const a1 = { data: serialize(S), updated: 100 }, a2 = { data: serialize(newCity(3)), updated: 200 };
  ok(pickNewest(a1, a2) === a2 && pickNewest(a2, a1) === a2, 'nieuwste wint'); ok(pickNewest(null, a1) === a1 && pickNewest(a1, { data: 'kapot', updated: 999 }) === a1, 'kapotte cloud-save wordt genegeerd'); ok(pickNewest(null, null) === null, 'niets');
}

/* ---------- 6. offline-voortgang ---------- */
{
  const mk = () => { const S = newCity(31); S.money = 5000; S.peak = 100; for (let k = 0; k < 5; k++) place(S, (cx + 2) * N + cx - 3 + k, 'j'); place(S, (cx + 3) * N + cx, 'W'); place(S, (cx + 3) * N + cx + 1, 'A'); for (let k = 0; k < 2; k++) place(S, (cx + 2) * N + cx + 2 + k, 'a'); S.pop = 20; return S; };
  const a = mk(), b = mk(), c = mk();
  const ra = offlineProgress(a, 8 * 3600), rb = offlineProgress(b, 20 * 3600), rc = offlineProgress(c, 3600);
  ok(ra.secs === 8 * 3600 && rb.secs === MAX_OFFLINE, 'maximaal 8 uur offline'); near(a.money, b.money, 1, '20 uur telt als 8 uur'); ok(ra.gain > 0, 'je verdient terwijl je weg bent'); ok(rc.gain > 0 && rc.gain < ra.gain, 'langer weg is meer, maar begrensd');
  ok(a.pop > 20, 'de bevolking groeit ook door'); ok(a.money >= 0, 'geen negatief geld'); ok(ra.eff === 0.5, 'standaard 50%');
  const d = mk(); d.up.off = 5; ok(offlineProgress(d, 3600).gain > rc.gain, 'Nachtploeg verhoogt offline verdienste');
  const z = mk(); const m0 = z.money; offlineProgress(z, 10); ok(Math.abs(z.money - m0) < 100, 'korte afwezigheid doet weinig');
}

/* ---------- 7. prestige, dagelijks, doelen ---------- */
{
  const S = newCity(41); S.peak = 300; ok(!canPrestige(S), 'nog niet genoeg voor een nieuwe stad'); S.peak = 1000; ok(canPrestige(S) && starsFor(S) === 5, '1000 inwoners = 5 sterren'); S.ach = ['h1']; S.proj = { expo: 1 }; S.perks = { map: 1 }; S.money = 9e6; S.up = { tax: 5 };
  const r = prestige(S, 77); const T = r.S; ok(r.gain === 5 && T.stars === 5 && T.prest === 1, 'sterren erbij'); ok(T.up.tax === undefined && T.pop === 0 && T.land === 0, 'stad begint opnieuw'); ok(T.ach.includes('h1') && T.proj.expo && T.perks.map === 1, 'prestaties, projecten en erfenissen blijven'); ok(T.size === 24, 'erfenis: grotere kaart'); ok(T.money < 1000, 'startgeld is klein');
  { const T3 = newCity(77); T.pop = 200; T3.pop = 200; ok(calc(T).income > calc(T3).income, 'sterren verhogen inkomen'); T.pop = 0; } const T2 = newCity(5, { perks: { start: 2 } }); ok(T2.money === 160 + 500, 'erfenis: startgeld');
  ok(buyPerk(T, 'disc').ok === true && T.spent === 2, 'erfenis kopen met sterren'); T.spent = T.stars; ok(!buyPerk(T, 'disc').ok, 'te weinig sterren');
  // dagelijks
  const D = newCity(1); const d1 = new Date(2026, 9, 10, 9), d2 = new Date(2026, 9, 11, 9), d3 = new Date(2026, 9, 13, 9);
  let i = dailyInfo(D, d1); ok(i.can && i.next === 1, 'eerste dag'); const got = claimDaily(D, d1); ok(got && D.money > 160, 'beloning ontvangen'); ok(!dailyInfo(D, d1).can && claimDaily(D, d1) === null, 'niet twee keer per dag');
  i = dailyInfo(D, d2); ok(i.can && i.next === 2 && i.reward > got.reward, 'volgende dag: streak en meer beloning'); claimDaily(D, d2); ok(dailyInfo(D, d3).next === 1, 'dag gemist: streak begint opnieuw'); for (let k = 0; k < 10; k++) { D.daily = { d: '2026-10-12', s: 9 }; } ok(dailyInfo(D, new Date(2026, 9, 13)).next === 7, 'streak maximaal 7');
  // doelen
  const G = newCity(2); let st = calc(G); ok(claimGoal(G, st) === null, 'doel nog niet klaar'); G.money = 1e5; place(G, (cx + 2) * N + cx - 1, 'h'); place(G, (cx + 2) * N + cx, 'h'); st = calc(G); const m0 = G.money; ok(claimGoal(G, st) && G.goal === 1 && G.money > m0, 'doel geclaimd');
  const got2 = checkAch(G, st); ok(got2.some((a) => a.id === 'h1') && checkAch(G, st).length === 0, 'prestatie maar één keer');
  for (let k = 0; k < GOALS.length; k++) { const [c, t] = GOALS[k].f(newCity(3), calc(newCity(3))); ok(Number.isFinite(c) && t > 0, `doel ${k} heeft getal`); }
}

/* ---------- 8. gebeurtenissen ---------- */
{
  const seq = (arr) => { let i = 0; return () => arr[i++ % arr.length]; };
  const mk = (withFire) => { const S = newCity(51); S.money = 1e5; S.peak = 500; for (let k = 0; k < 6; k++) place(S, (cx + 2) * N + cx - 3 + k, 'j'); if (withFire) place(S, cx * N + cx - 2, 'p'); S.pop = 60; return S; };
  // brand zonder brandweer
  let S = mk(false), st = calc(S); S.ev.cd = 0;
  tickEvents(S, st, 1, seq([0.0, 0.0, 0.0, 0.0]), { news() {}, sfx() {} }); ok(S.ev.fire && S.ev.fire.length === 1 && !S.ev.fire[0].cov, 'brand zonder brandweer');
  const fi = S.ev.fire[0].i; ok(douse(S, st, fi) && S.ev.fire.length === 0 && S.ft === 1, 'zelf blussen door te tikken');
  S = mk(false); st = calc(S); S.ev.cd = 0; tickEvents(S, st, 1, seq([0, 0, 0, 0]), {}); const f2 = S.ev.fire[0].i; tickEvents(S, st, 20, seq([0.9]), {}); ok(S.g[f2] === 'x', 'onbeheerde brand laat puin achter'); ok(bulldoze(S, f2).ok && S.g[f2] === '.', 'puin ruimen is gratis');
  // brand met brandweer
  S = mk(true); st = calc(S); S.ev.cd = 0; tickEvents(S, st, 1, seq([0, 0, 0, 0]), {}); ok(S.ev.fire && S.ev.fire[0].cov, 'brandweer dekt'); const f3 = S.ev.fire[0].i; tickEvents(S, st, 10, seq([0.9]), {}); ok(S.g[f3] !== 'x' && S.fs === 1, 'brandweer blust, gebouw blijft staan');
  // storm / feest / cadeau / choice
  S = mk(true); st = calc(S); S.ev.cd = 0; const w = [0.5]; tickEvents(S, st, 1, seq([0.5, 0.0, 0.5, 0.2, 0.3, 0.6, 0.1]), {}); // kiest op volgorde van gewichten
  S = mk(true); st = calc(S); S.ev.storm = 30; ok(calc(S).pwr >= 0, 'storm rekent'); S.ev.fest = 10; const inc1 = calc(S).income; S.ev.fest = 0; ok(inc1 > calc(S).income, 'feest verhoogt inkomen'); void w;
  S.ev.gift = { i: 3, t: 20 }; ok(takeGift(S, 3) > 0 && !S.ev.gift, 'cadeau pakken'); S.deb = [7]; ok(clearDebris(S, 7) > 0 && S.deb.length === 0, 'takken opruimen');
  const kinds = new Set(); for (let t = 0; t < 4000; t++) { const X = mk(true); const stx = calc(X); X.ev.cd = 0; tickEvents(X, stx, 1, Math.random, { news() {}, sfx() {} }); if (X.ev.fire) kinds.add('brand'); if (X.ev.storm > 0) kinds.add('storm'); if (X.ev.fest > 0) kinds.add('feest'); if (X.ev.gift) kinds.add('cadeau'); if (X.ev.choice) kinds.add('keuze'); if (X.ev.drought > 0) kinds.add('droogte'); if (X.money > 1e5 + 1) kinds.add('toerist'); }
  ok(kinds.size >= 6, `veel soorten gebeurtenissen komen voor (${[...kinds].join(',')})`);
  const Q = mk(true); Q.money = 1000; Q.ev.choice = 'taart'; const msg = resolveChoice(Q, 'taart', true); ok(Q.ev.fest > 0 && Q.money < 1000 && msg, 'keuze: taart'); const Q2 = mk(true); const m1 = Q2.money; resolveChoice(Q2, 'reclame', true); ok(Q2.money > m1 && Q2.ev.bad > 0, 'keuze: reclame'); const Q3 = mk(true); Q3.money = 0; resolveChoice(Q3, 'circus', true); ok(Q3.money === 0, 'keuze: te weinig geld');
  const tc = mk(true); tc.pop = 3; tc.ev.cd = 0; tickEvents(tc, calc(tc), 1, Math.random, {}); ok(!tc.ev.fire && !tc.ev.choice, 'geen gebeurtenissen in het allereerste begin');
}

/* ---------- 9. tekenen met een nep-canvas (geen NaN, geen fouten) ---------- */
function mockCtx() {
  const grad = { addColorStop() {} }, store = {};
  return new Proxy(store, {
    get: (t, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => grad : k === 'measureText' ? () => ({ width: 10 }) : k in t ? t[k] : (...a) => { for (const x of a) if (typeof x === 'number' && !Number.isFinite(x)) throw new Error(`NaN-argument in ${String(k)}(${a.join(',')})`); } ),
    set: (t, k, v) => { t[k] = v; return true; },
  });
}
{
  const S = newCity(61); S.money = 1e9; S.peak = 99999; S.land = maxLand(S); const chars = BUILDABLE;
  let i = 0; for (let y = 2; y < N - 2 && i < chars.length; y += 2) for (let x = 2; x < N - 2 && i < chars.length; x += 2) { const idx = y * N + x; if (S.g[idx] !== 'w' && S.g[idx] !== 'H') { S.g[idx] = chars[i++]; S.lv[idx] = 1 + (i % 3); } }
  S.g[3 * N + 3] = 'x'; S.deb = [4 * N + 4]; S.ev = { fire: [{ i: 5 * N + 5, t: 5, cov: true }, { i: 6 * N + 6, t: 5, cov: false }], gift: { i: 7 * N + 7, t: 9 }, storm: 20 };
  for (let k = 0; k < N; k++) S.g[(cx + 1) * N + k] = 'r';
  const st = calc(S), cars = []; carsStep(cars, S, 0.1, 12); ok(cars.length === 12, 'auto\'s verschijnen op wegen');
  for (let k = 0; k < 200; k++) carsStep(cars, S, 0.1, 12); ok(cars.every((c) => Number.isFinite(c.p) && c.p >= 0 && c.x >= 0 && c.y >= 0), 'auto\'s blijven geldig');
  const c = mockCtx(), glow = { w: 1 };
  for (const night of [0, 0.5, 1]) for (const layer of ['', 'blij']) for (const z of [14, 36, 90]) {
    drawCity(c, { S, st, cam: { x: N / 2, y: N / 2, z }, t: 12.3, night, cars, floaters: [{ x: 3, y: 3, text: '+5', col: '#fff', t: 0.5 }], tool: 'h', ghost: { x: 4, y: 4, ok: true }, sel: 2 * N + 2, layer, W: 360, H: 560, dpr: 2, glow, discSet: new Set(st.disc), range: { x: 5, y: 5, r: 6 } });
  }
  for (const ch of BUILDABLE) for (const lv of [1, 2, 3]) { const T = newCity(2); T.g[(cx + 3) * N + cx] = ch; T.lv[(cx + 3) * N + cx] = lv; drawCity(c, { S: T, st: calc(T), cam: { x: cx, y: cx, z: 40 }, t: 1, night: 0.8, cars: [], floaters: [], tool: ch, ghost: { x: cx, y: cx + 4, ok: false }, sel: -1, layer: '', W: 300, H: 400, dpr: 1, glow, discSet: null }); }
  checks++;
}

/* ---------- 10. economie-simulatie met een slimme bot ---------- */
function runBot(hours, opt = {}) {
  const S = newCity(opt.seed || 7, {}), n = S.size, cy = Math.floor(n / 2);
  let t = 0, firstUp = null, firstUpAfford = null, firstGoal = null, stallRun = 0, maxStall = 0, minNet = 1e9; const log = [], goalTimes = [], marks = {};
  const inl = (i) => inLand(S, i);
  const PLAN = [0, -3, 3, -6, 6, -9, 9, -12].map((d) => cy + 1 + d).filter((y) => y > 0 && y < n - 1);
  const free = (i) => (S.g[i] === '.' || S.g[i] === 't') && !PLAN.includes((i / n) | 0) && inl(i);
  const freeRoad = (i) => inl(i) && (S.g[i] === '.' || S.g[i] === 't' || S.g[i] === 'x');
  const adj = (i) => { const x = i % n, y = (i / n) | 0; return (x > 0 && S.g[i - 1] === 'r') || (x < n - 1 && S.g[i + 1] === 'r') || (y > 0 && S.g[i - n] === 'r') || (y < n - 1 && S.g[i + n] === 'r'); };
  const slots = () => { const a = []; for (let i = 0; i < n * n; i++) if (free(i) && adj(i)) a.push(i); return a; };
  const anywhere = () => { const a = []; for (let i = 0; i < n * n; i++) if (free(i)) a.push(i); return a; };
  const rows = [cy + 1];
  const extend = () => { for (const y of PLAN) { if (rows.includes(y)) continue; rows.push(y); return true; } return false; };
  const roads = () => { for (const y of rows) for (let x = 0; x < n; x++) { const i = y * n + x; if (freeRoad(i)) { const r = place(S, i, 'r'); if (!r.ok && r.cost) return false; } } return true; };
  const best = (chs) => chs.split('').filter((c) => isUnlocked(S, c)).sort((a, b) => BD[b].c - BD[a].c);
  function tryBuild(chs) {
    for (const ch of best(chs)) {
      if (buildCost(S, ch) > S.money) continue;
      const sl = BD[ch].noRoad ? anywhere() : slots(); if (!sl.length) { if (extend()) roads(); return false; }
      const i = BD[ch].noRoad ? sl[sl.length - 1] : sl[Math.floor(sl.length / 2) % sl.length]; if (place(S, i, ch).ok) return ch;
    }
    return false;
  }
  function replaceWeak(chs) {
    const top = best(chs)[0]; if (!top || S.money < buildCost(S, top) * 1.1) return; let wi = -1, wc = 1e18;
    for (let i = 0; i < n * n; i++) { const c = S.g[i]; if (!BD[c] || 'rtH'.includes(c)) continue; const same = chs.includes(c) || (BD[c].res && BD[top].res) || (BD[c].jobs && BD[top].jobs); if (same && BD[c].c < BD[top].c * 0.3 && S.lv[i] === 1 && BD[c].c < wc) { wc = BD[c].c; wi = i; } }
    if (wi >= 0) bulldoze(S, wi);
  }
  roads();
  while (t < hours * 3600) {
    if (t % 5 === 0) roads();
    for (let k = 0; k < 6; k++) {
      const st = calc(S), cnt = st.cnt, nn = (c) => c.split('').reduce((a, x) => a + (cnt[x] || 0), 0), popT = Math.max(S.pop, st.target);
      const needP = popT * 0.08 + st.jobs * 0.05 + 10, needW = popT * 0.07 + st.jobs * 0.03 + 6; let r = false;
      const needs = [[st.pwr < needP * 1.1 && S.pop > 3, 'WZE'], [st.wat < needW * 1.1 && S.pop > 3, 'ALR'], [st.cap < Math.max(8, st.jobs / 0.6 + 4) || S.pop > st.cap * 0.8, 'hjfkv'],
        [st.jobs < st.cap * 0.57, S.pop > 15 ? 'baioC' : 'ba'], [st.shopCap < S.pop * 0.9 && S.pop > 6, 'mneq'], [S.pop > 20 && nn('c') < Math.ceil(S.pop / 150), 'c'], [S.pop > 30 && nn('p') < Math.ceil(S.pop / 250), 'p'],
        [S.pop > 60 && nn('z') < Math.ceil(S.pop / 600), 'z'], [S.pop > 10 && nn('gdF') < Math.ceil(S.pop / 28), 'gdF'], [st.ti > 0.8 && nn('BX') < Math.ceil(S.pop / 100), 'BX'], [S.pop > 150 && nn('lSP') < Math.ceil(S.pop / 500), 'lSP']];
      for (const [cond, chs] of needs) { if (!cond) continue; r = tryBuild(chs); if (r) break; if (/^(WZE|ALR)$/.test(chs) && best(chs).length && buildCost(S, best(chs).slice(-1)[0]) > S.money) break; if (!anywhere().length && S.money > 5000) replaceWeak(chs); }
      if (r) continue;
      let up = null; for (const u of UPG) { const l = S.up[u.id] || 0; if (l < u.max) { const c = upgCost(u, l); if (!up || c < up.c) up = { u, c }; } }
      if (up && firstUpAfford == null && S.money >= up.c) firstUpAfford = t;
      if (up && up.c <= S.money * 0.5 + 1 && (up.c < st.net * 400 || S.money > up.c * 3)) { buyUp(S, up.u.id); if (firstUp == null) firstUp = t; continue; }
      if (S.money > 300) { let bi = -1, bc = 1e18; for (let i = 0; i < n * n; i++) { const B = BD[S.g[i]]; if (!B || !B.c) continue; if ('hjfkvbaioCmneq'.includes(S.g[i]) && canUpgrade(S, i).ok) { const c = upgradeCost(S, i) / (B.res || B.jobs || B.shop || 1); if (c < bc) { bc = c; bi = i; } } } if (bi >= 0 && upgradeCost(S, bi) < S.money * 0.7 && upgradeCost(S, bi) < Math.max(400, st.net * 400)) { upgradeBuilding(S, bi); continue; } }
      if (S.land < maxLand(S) && slots().length < 6 && S.money > landCost(S) * 1.1) { buyLand(S); roads(); continue; }
      for (const p of PROJECTS) if (!S.proj[p.id] && S.money > p.cost * 1.1) buyProject(S, p.id);
      if (slots().length < 8 && extend()) roads(); break;
    }
    const stc = calc(S); for (let g = 0; g < 3; g++) { const G = claimGoal(S, stc); if (G) { goalTimes.push([t, G.t]); if (firstGoal == null) firstGoal = t; } else break; }
    checkAch(S, stc);
    const sp = step(S, 1); t += 1; minNet = Math.min(minNet, sp.net); if (sp.net < 0.2) { stallRun++; maxStall = Math.max(maxStall, stallRun); } else stallRun = 0;
    ok(S.money >= 0 && Number.isFinite(S.money) && Number.isFinite(S.pop), 'simulatie blijft rekenen met geldige getallen');
    for (const m of [10, 25, 60, 100, 250, 500, 1000, 1500, 2000]) if (!marks[m] && S.pop >= m) marks[m] = t;
    if (t % (opt.every || 900) === 0) log.push({ min: t / 60, pop: Math.round(S.pop), geld: Math.round(S.money), netto: +sp.net.toFixed(1), blij: Math.round(sp.happy), banen: Math.round(sp.jobs), plek: Math.round(sp.cap), upg: Object.values(S.up).reduce((a, b) => a + b, 0), grond: S.land, stroom: Math.round(sp.pr * 100), water: Math.round(sp.wr * 100), verkeer: +sp.ti.toFixed(2), werkloos: +sp.unemp.toFixed(2), onderwijs: +sp.eduR.toFixed(2) });
  }
  return { S, log, firstUp, firstUpAfford, firstGoal, goalTimes, marks, maxStall, minNet };
}
const upgCost = (u, l) => M.upgCost(u, l);
{
  const simH = process.argv.includes('--sim') ? +process.argv[process.argv.indexOf('--sim') + 1] || 4 : 3;
  const r = runBot(simH, { every: process.argv.includes('--sim') ? 1200 : 1800 });
  console.log(`\nSimulatie (${simH} uur, slimme bot):`);
  console.log(`  eerste upgrade betaalbaar na ${r.firstUpAfford} s, gekocht na ${r.firstUp} s`);
  console.log(`  eerste doel na ${r.firstGoal} s; ${r.goalTimes.length} doelen in ${simH} uur`);
  console.log(`  langste periode met bijna geen netto inkomen: ${r.maxStall} s; laagste netto: ${r.minNet.toFixed(2)}/s`);
  console.log('  inwoners-mijlpalen (minuten):', Object.entries(r.marks).map(([k, v]) => `${k}:${(v / 60).toFixed(0)}`).join('  '));
  console.table(r.log);
  ok(r.firstUpAfford != null && r.firstUpAfford < 20, `eerste upgrade binnen 20 s betaalbaar (${r.firstUpAfford})`);
  ok(r.firstGoal != null && r.firstGoal < 120, `eerste doel binnen 2 minuten (${r.firstGoal})`);
  ok(r.maxStall === 0 && r.minNet > 0, 'nooit vastgelopen zonder inkomen');
  const keys = Object.keys(r.marks).map(Number).sort((a, b) => a - b); ok(keys.length >= 5, 'bot haalt minstens 5 bevolkingsmijlpalen'); for (let k = 1; k < keys.length; k++) ok(r.marks[keys[k]] >= r.marks[keys[k - 1]], 'mijlpalen in volgorde');
  ok(r.marks[100] > 8 * 60, `100 inwoners duurt even (min. 8 min, nu ${(r.marks[100] / 60).toFixed(1)})`); ok(r.marks[25] < 5 * 60, '25 inwoners binnen 5 minuten');
  if (r.marks[10] && r.marks[25] && r.marks[100]) { ok(r.marks[25] - r.marks[10] < 4 * 60, 'soepele start'); ok(r.marks[100] - r.marks[25] < 40 * 60, 'geen lange stilstand tussen 25 en 100 inwoners'); }
  for (let k = 1; k < r.goalTimes.length; k++) ok(r.goalTimes[k][0] - r.goalTimes[k - 1][0] < 70 * 60, `tussen twee doelen zit nooit meer dan 70 minuten (${r.goalTimes[k][1]})`);
  const s = serialize(r.S); ok(s.length < MAX_DATA, `simulatiestad past in de opslag (${s.length})`);
}

/* ---------- 11. de hele view in jsdom met nep-Firestore (alleen als jsdom aanwezig is) ---------- */
async function loadJsdom() {
  const cands = [process.env.JSDOM_DIR, path.join(here, '..', 'node_modules'), '/private/tmp/claude-502/lint/node_modules', path.join(os.homedir(), 'node_modules')].filter(Boolean);
  for (const d of cands) { try { const req = createRequire(path.join(d.replace(/node_modules\/?$/, ''), 'x.js')); return req('jsdom'); } catch (e) { /* volgende */ } }
  return null;
}
const jsd = await loadJsdom();
if (!jsd) console.log('\n(jsdom niet gevonden: view-test overgeslagen)');
else {
  const dom = new jsd.JSDOM('<!doctype html><body><div id="v"></div></body>', { pretendToBeVisual: true, url: 'https://example.test/', runScripts: 'outside-only' });
  const w = dom.window; const g = globalThis;
  for (const k of ['window', 'document', 'localStorage', 'requestAnimationFrame', 'cancelAnimationFrame', 'AudioContext']) { if (k === 'window') g.window = w; else if (k in w) { try { g[k] = w[k]; } catch (e) { Object.defineProperty(g, k, { value: w[k], configurable: true }); } } }
  Object.defineProperty(g, 'navigator', { value: w.navigator, configurable: true });
  w.HTMLCanvasElement.prototype.getContext = function () { return mockCtx(); };
  w.HTMLElement.prototype.getBoundingClientRect = function () { return { width: 360, height: 600, left: 0, top: 0, right: 360, bottom: 600 }; };
  const view = w.document.getElementById('v'); const cleanups = [];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); const errors = []; w.addEventListener('error', (e) => errors.push(e.error || e.message));
  const origErr = console.error; console.error = (...a) => { errors.push(a.join(' ')); };
  await M.stadbouwerView({ db: {}, me: { uid: 'u1', name: 'Test' }, esc, nice: (x) => x, uid: 'u1', view, addCleanup: (f) => cleanups.push(f) });
  const root = view.querySelector('.sb-root'); ok(root && view.querySelector('canvas'), 'view bouwt de UI');
  const click = (sel) => { const el = view.querySelector(sel); ok(el, `element ${sel} bestaat`); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
  const ptr = (type, x, y, id = 1) => { const ev = new w.MouseEvent(type, { bubbles: true, clientX: x, clientY: y }); for (const [k, v] of Object.entries({ offsetX: x, offsetY: y, pointerId: id, pointerType: 'touch' })) Object.defineProperty(ev, k, { value: v }); view.querySelector('canvas').dispatchEvent(ev); };
  ok(/Welkom|Tik op/.test(view.textContent), 'tutorial en welkom zichtbaar'); ok(view.querySelector('[data-h="tut"]').style.display === 'block', 'tutorial zichtbaar bij nieuwe stad');
  for (const t of ['bouw', 'stad', 'plan', 'doel', 'meer']) { click(`.sb-tab[data-v="${t}"]`); ok(view.querySelector('.sb-sheet.open'), `tab ${t} opent`); ok(view.querySelector('.sb-sc').textContent.length > 20, `tab ${t} heeft inhoud`); }
  click('.sb-tab[data-v="bouw"]'); click('.sb-tab[data-v="bouw"]'); ok(!view.querySelector('.sb-sheet.open'), 'zelfde tab sluit');
  click('.sb-tab[data-v="bouw"]'); click('[data-a="cat"][data-v="weg"]'); click('[data-a="pick"][data-v="r"]'); ok(view.querySelector('.sb-tool.show'), 'bouwgereedschap actief');
  // veeg een stukje weg: tegel onder het midden (W=360,H=600 -> cam 11.5)
  const z = 26, cxp = 180, cyp = 300; ptr('pointerdown', cxp, cyp + z * 2); ptr('pointermove', cxp + z * 2, cyp + z * 2); ptr('pointerup', cxp + z * 2, cyp + z * 2);
  click('[data-a="tool0"]'); ok(!view.querySelector('.sb-tool.show'), 'gereedschap uit');
  await new Promise((r) => setTimeout(r, 1300));
  click('.sb-tab[data-v="plan"]'); click('[data-a="buyup"][data-v="bld"]');
  click('.sb-tab[data-v="meer"]'); click('[data-a="snd"]'); click('[data-a="save"]'); await new Promise((r) => setTimeout(r, 50));
  const loc = JSON.parse(w.localStorage.getItem('big:stadbouwer:u1')); ok(loc && typeof loc.data === 'string' && loc.updated > 0, 'lokale opslag onder sleutel big:stadbouwer:<uid>');
  const S1 = deserialize(loc.data); ok(S1.g.filter((c) => c === 'r').length >= 10, 'wegen zijn gebouwd via de view'); ok(S1.snd === 0, 'geluid uit wordt bewaard');
  const writes = globalThis.__FS.writes.filter((x) => x.path === 'gamesaves/big-stadbouwer__u1'); ok(writes.length >= 1, 'cloud-opslag op het juiste pad'); const wr = writes[writes.length - 1].data;
  ok(Object.keys(wr).sort().join() === 'data,game,uid,updated', `exact de juiste velden (${Object.keys(wr)})`); ok(wr.game === 'big-stadbouwer' && wr.uid === 'u1' && typeof wr.data === 'string' && wr.data.length <= 18000 && typeof wr.updated === 'number', 'veldwaarden kloppen');
  const nW = globalThis.__FS.writes.length; await new Promise((r) => setTimeout(r, 1200)); ok(globalThis.__FS.writes.length === nW, 'niet vaker dan 1x per 60 s naar de cloud');
  // klik op kaart in kies-modus
  ptr('pointerdown', cxp, cyp); ptr('pointerup', cxp, cyp);
  // sluiten ruimt op en schrijft nog eens
  const before = globalThis.__FS.writes.length; cleanups.forEach((f) => f()); await new Promise((r) => setTimeout(r, 30)); ok(globalThis.__FS.writes.length > before, 'bij sluiten wordt nog eens opgeslagen');
  const timersAfter = globalThis.__FS.writes.length; await new Promise((r) => setTimeout(r, 1200)); ok(globalThis.__FS.writes.length === timersAfter, 'na opruimen lopen er geen timers meer');
  // opnieuw openen: cloud nieuwer dan lokaal wordt gekozen, en offline-voortgang verschijnt
  const cloud = globalThis.__FS.store.get('gamesaves/big-stadbouwer__u1'); const S2 = deserialize(cloud.data); S2.money = 777777; S2.last = Date.now() - 3 * 3600 * 1000; S2.tut = 99; S2.snd = 0;
  globalThis.__FS.store.set('gamesaves/big-stadbouwer__u1', { game: 'big-stadbouwer', uid: 'u1', data: serialize(S2), updated: Date.now() + 5000 });
  view.innerHTML = ''; await M.stadbouwerView({ db: {}, me: { uid: 'u1' }, esc, nice: (x) => x, uid: 'u1', view, addCleanup: (f) => cleanups.push(f) });
  ok(view.querySelector('.sb-modal.show') && /Welkom terug/.test(view.querySelector('.sb-modal').textContent), 'welkom-terug scherm met offline-opbrengst'); ok(/\+/.test(view.querySelector('.sb-modal').textContent), 'toont opbrengst');
  click('[data-a="modalok"]'); ok(!view.querySelector('.sb-modal.show'), 'modal sluit');
  // cloud-fout wordt stil afgevangen
  globalThis.__FS.fail = true; click('.sb-tab[data-v="meer"]'); click('[data-a="save"]'); await new Promise((r) => setTimeout(r, 50)); globalThis.__FS.fail = false;
  cleanups.forEach((f) => f()); console.error = origErr;
  ok(errors.length === 0, `geen fouten in de console: ${errors.slice(0, 3).join(' | ')}`);
  w.close();
}

console.log(`\nAlle ${checks} controles geslaagd.`);
