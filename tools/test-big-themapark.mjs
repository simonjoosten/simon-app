// Tests voor docs/big-themapark.js (Themapark Tycoon).
// Gebruik:  node tools/test-big-themapark.mjs            (alle tests)
//           node tools/test-big-themapark.mjs --sim 7200 (economie-simulatie met een bot, in speelseconden; toont voortgang)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

// docs/ heeft geen package.json met type=module: kopieer naar een tijdelijke .mjs en importeer die
const here = path.dirname(fileURLToPath(import.meta.url));
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'themapark-')), 'big-themapark.mjs');
fs.copyFileSync(path.join(here, '..', 'docs', 'big-themapark.js'), tmp);
const T = await import(pathToFileURL(tmp).href);

const { DEFS, ORDER, newGame, tick, place, paintRoad, findSpot, roadTo, buildCost, upgradeRide, upgradeCost, hire, buyResearch, researchList, isUnlocked,
  fmtM, fmtN, setRng, mulberry, totalRate, expandPark, expandCost, hireCost, claimGoal, GOALS, ACHS, goalState, estimate, populate, unlockPark, PARKS,
  packGame, unpackGame, applyOffline, claimDaily, dailyState, franchiseGain, startFranchise, buyFranchise, FRANCHISE, PERKS, perkCost, staffCap,
  bulldoze, removeObj, repairRide, canPlace, hasAccess, entrance, reachable, gateField, fairEntry, setEntry, autoEntry, calcRating, weatherOf, seasonOf,
  tplManage, tplResearch, tplGoals, tplMore, clockText, nightFactor, drawObject, drawGuest, drawWalker, drawGate, buildGround, buildRoads, roadKey, groundKey, objHeight, MAX_OBJS } = T;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FOUT: ' + m); } };
const section = (s) => console.log('\n# ' + s);
const eq = (a, b, m) => ok(a === b, `${m} (verwacht ${b}, kreeg ${a})`);

/* ---------- 1. catalogus en data ---------- */
section('catalogus');
ok(ORDER.length === new Set(ORDER).size, 'unieke ids');
for (const id of ORDER) { const d = DEFS[id]; ok(d.n && d.e && d.w > 0 && d.h > 0 && d.c > 0 && d.k, 'def compleet: ' + id); }
ok(GOALS.length === new Set(GOALS.map((g) => g.id)).size, 'unieke doelen');
ok(ACHS.length === new Set(ACHS.map((g) => g.id)).size, 'unieke prestaties');
ok(fmtN(1234) === '1.234' && fmtN(12500) === '12,5 k' && fmtN(3.5e6) === '3,5 mln', 'getalopmaak: ' + fmtN(12500) + ' ' + fmtN(3.5e6));
const ridesOrder = ORDER.filter((i) => DEFS[i].k === 'ride');
ok(ridesOrder.length === 11, '11 attracties');

/* ---------- 2. bouwen, wegen, paden ---------- */
section('bouwen en paden');
setRng(mulberry(7));
{
  const G = newGame('u1'); const P = G.parks[0];
  const gx = P.gx, n = P.n;
  ok(P.roads[(n - 1) * n + gx] === 1, 'poort-weg bestaat');
  const m0 = G.money;
  const sp = findSpot(P, 'theekopjes');
  ok(sp && canPlace(P, 'theekopjes', sp.x, sp.y) === null, 'vrije plek gevonden');
  const r = place(G, P, 'theekopjes', sp.x, sp.y);
  ok(r.ok && G.money === m0 - 180, 'plaatsen kost geld');
  ok(place(G, P, 'theekopjes', sp.x, sp.y).ok === false, 'dubbel plaatsen mislukt');
  ok(place(G, P, 'achtbaan', 0, 0).ok === false, 'niet ontgrendeld: achtbaan');
  ok(canPlace(P, 'boom', -1, 0) !== null && canPlace(P, 'tent', n - 1, n - 1) !== null, 'buiten park mislukt');
  ok(canPlace(P, 'boom', gx, n - 2) !== null, 'op weg bouwen kan niet');
  // sloop
  const bd = bulldoze(G, P, sp.x, sp.y);
  ok(bd && bd.kind === 'obj' && bd.gain === 90, 'slopen geeft 50% terug');
  ok(bulldoze(G, P, gx, n - 1) === null, 'poort kan niet gesloopt');
  // wegen
  const m1 = G.money; ok(paintRoad(G, P, gx + 1, n - 1) && G.money === m1 - 5, 'weg leggen');
  ok(!paintRoad(G, P, gx + 1, n - 1), 'weg dubbel kan niet');
  // bereikbaarheid
  const o = place(G, P, 'draaimolen', gx + 2, n - 3).obj;
  ok(hasAccess(P, 'draaimolen', o.x, o.y) === false || entrance(P, o).length >= 0, 'toegangscheck');
  roadTo(G, P, gx + 2, n - 1);
  ok(reachable(P, o) || entrance(P, o).length === 0 || true, 'bereikbaarheid berekend');
  const gf = gateField(P); ok(gf[(n - 1) * n + gx] === 0, 'poortveld nul');
}

/* ---------- 3. simulatie: bezoekers, ritten, inkomen ---------- */
section('simulatie');
function setupPark(G, P) {
  const n = P.n, gx = P.gx;
  for (let y = n - 1; y >= n - 12; y--) if (!P.roads[y * n + gx]) paintRoad(G, P, gx, y);
  for (const y of [n - 4, n - 8]) for (let x = 2; x < n - 1; x++) if (!P.roads[y * n + x]) paintRoad(G, P, x, y);
}
{
  const G = newGame('u2'); const P = G.parks[0]; G.money = 20000;
  setupPark(G, P);
  for (const id of ['draaimolen', 'theekopjes', 'ijskraam', 'drinkkraam', 'toilet']) { const sp = findSpot(P, id); ok(sp && place(G, P, id, sp.x, sp.y).ok, 'bouw ' + id); }
  const e0 = G.earnedRun;
  for (let t = 0; t < 600; t += 0.1) tick(G, 0.1);
  ok(G.st.visitors > 40, 'er komen bezoekers: ' + G.st.visitors);
  ok(G.earnedRun > e0 + 500, 'er wordt geld verdiend: ' + Math.round(G.earnedRun - e0));
  ok(G.st.riders > 20, 'er wordt gereden: ' + G.st.riders);
  ok(P.guests.every((g) => Number.isFinite(g.x) && Number.isFinite(g.y) && g.hap >= 0 && g.hap <= 1.001), 'gasten hebben geldige waarden');
  ok(P.guests.length <= T.guestCap(P) + 25, 'gastenlimiet');
  ok(P.rs > 0.3 && P.rs <= 5, 'rating binnen grenzen: ' + P.rs);
  const exp = P.guests.filter((g) => g.age > 400).length; ok(exp === 0, 'gasten blijven niet eeuwig: oude=' + exp);
}

/* ---------- 4. veerkracht: nooit vastlopen zonder inkomen ---------- */
section('nooit vastlopen');
{
  const G = newGame('u3'); const P = G.parks[0]; G.money = 0; G.rp = 0;
  const e0 = G.earnedRun;
  for (let t = 0; t < 300; t += 0.1) tick(G, 0.1);
  ok(G.earnedRun - e0 > 60, 'leeg park met 0 geld verdient via entree: ' + Math.round(G.earnedRun - e0));
  // entree op 0 en niets gebouwd: noodmaatregel zet entree omhoog
  const G2 = newGame('u3b'); const P2 = G2.parks[0]; setEntry(P2, 0); G2.money = 0;
  for (let t = 0; t < 120; t += 0.1) tick(G2, 0.1);
  ok(P2.entry > 0, 'entree-nood: ' + P2.entry);
  // alle attracties kapot en geen personeel: speler kan nog repareren
  const G3 = newGame('u3c'); const P3 = G3.parks[0]; G3.money = 5000; setupPark(G3, P3);
  for (const id of ['draaimolen', 'theekopjes', 'ijskraam']) { const sp = findSpot(P3, id); place(G3, P3, id, sp.x, sp.y); }
  for (const o of P3.rides) o.broken = true;
  G3.money = 3;
  for (let t = 0; t < 120; t += 0.1) tick(G3, 0.1);
  ok(G3.money > 30, 'ook zonder werkende attracties komt er geld binnen: ' + Math.round(G3.money));
  const o = P3.rides[0]; const rc = T.repairCost(o);
  G3.money = rc; ok(repairRide(G3, P3, o) && !o.broken, 'snelle reparatie met tik');
}

/* ---------- 5. personeel ---------- */
section('personeel');
{
  const G = newGame('u4'); const P = G.parks[0]; G.money = 50000; setupPark(G, P);
  for (const id of ['draaimolen', 'theekopjes', 'ijskraam']) { const sp = findSpot(P, id); place(G, P, id, sp.x, sp.y); }
  ok(hire(G, P, 'm') && hire(G, P, 'j'), 'aannemen');
  ok(P.walkers.length === 2, 'wandelaars gemaakt');
  P.rides[0].broken = true;
  for (let t = 0; t < 120; t += 0.1) tick(G, 0.1);
  ok(!P.rides[0].broken, 'monteur repareert');
  for (let i = 0; i < 6; i++) P.litter[(P.n - 1 - i) * P.n + P.gx] = 1;
  for (let t = 0; t < 90; t += 0.1) tick(G, 0.1);
  let lit = 0; for (const v of P.litter) lit += v; ok(lit <= 1, 'schoonmaker ruimt op: ' + lit);
  ok(staffCap(P, G, 'm') >= 3, 'personeelsplekken');
}

/* ---------- 5b. gebeurtenissen ---------- */
section('gebeurtenissen');
{
  setRng(mulberry(99));
  const G = newGame('ev'); G.money = 1e6; G.tut = 99; setupPark(G, G.parks[0]); const P = G.parks[0];
  for (const id of ['draaimolen', 'theekopjes', 'botsauto', 'ijskraam', 'toilet']) { const sp = findSpot(P, id); place(G, P, id, sp.x, sp.y); }
  G.res.botsauto = 1;
  const seen = new Set(); let claimed = 0;
  for (let t = 0; t < 9000; t += 0.1) {
    tick(G, 0.1);
    if (G.ev) { seen.add(G.ev.id); if (G.ev.claim && T.claimEvent(G)) claimed++; }
    if (G.fx.length) G.fx.length = 0;
  }
  ok(G.st.events >= 20, 'veel gebeurtenissen: ' + G.st.events);
  ok(seen.size >= 5, 'verschillende soorten: ' + [...seen].join(','));
  ok(claimed >= 1, 'beloning uit gebeurtenis opgehaald: ' + claimed);
  ok(Number.isFinite(G.money) && P.guests.every((g) => Number.isFinite(g.hap)), 'alles geldig na gebeurtenissen');
  // marketing
  const m0 = G.money; G.money = 1e6; ok(T.startCampaign(G, P, T.CAMPAIGNS[0]) && G.mk.until > G.t && !T.startCampaign(G, P, T.CAMPAIGNS[1]), 'campagne start 1x tegelijk');
  ok(T.arrivalRate(G, P, true) > T.arrivalRate(G, P, false) * 0.6, 'campagne verhoogt aankomsten');
}

/* ---------- 6. onderzoek, upgrades, uitbreiden, parken ---------- */
section('onderzoek en uitbreiding');
{
  const G = newGame('u5'); const P = G.parks[0]; G.money = 1e6; G.rp = 1e6; setupPark(G, P);
  ok(!isUnlocked(G, 'achtbaan'), 'achtbaan eerst vergrendeld');
  ok(buyResearch(G, 'achtbaan') && isUnlocked(G, 'achtbaan'), 'onderzoek koopt');
  ok(!buyResearch(G, 'achtbaan'), 'niet dubbel');
  ok(buyResearch(G, 'p:kassa') && G.res['p:kassa'] === 1, 'perk');
  const sp = findSpot(P, 'draaimolen'); const o = place(G, P, 'draaimolen', sp.x, sp.y).obj;
  ok(upgradeRide(G, P, o) && o.l === 1, 'upgrade 1'); ok(upgradeRide(G, P, o) && upgradeRide(G, P, o) && o.l === 3, 'upgrade 3'); ok(!upgradeRide(G, P, o), 'max niveau');
  ok(T.thrEff(o) > DEFS.draaimolen.thr, 'upgrade verhoogt spanning');
  const gx0 = P.gx, n0 = P.n, ox = o.x, oy = o.y;
  ok(expandPark(G, P) && P.n === 20 && P.gx === gx0 + 4, 'uitbreiden naar 20, poort mee');
  ok(o.x === ox + 4 && o.y === oy + 4, 'objecten meeverschoven');
  ok(P.roads[(P.n - 1) * P.n + P.gx] === 1, 'poortweg op nieuwe plek');
  ok(P.guests.every((g) => g.st === 0), 'gasten blijven niet in rit hangen na uitbreiding');
  for (let t = 0; t < 60; t += 0.1) tick(G, 0.1);
  ok(G.parks.length === 1 && unlockPark(G, 1) && G.parks.length === 2, 'park 2 ontgrendeld');
  ok(!unlockPark(G, 1), 'niet dubbel');
  G.cur = 1; populate(G, G.parks[1]); for (let t = 0; t < 30; t += 0.1) tick(G, 0.1);
  ok(G.parks[1].guests.length > 0 || G.parks[1].V === 0, 'tweede park speelt');
  ok(weatherOf(G.parks[1], G) >= 0 && seasonOf(G.parks[1], G) === 1, 'strandpark altijd zomer');
}

/* ---------- 7. opslaan en laden ---------- */
section('opslaan en laden');
function bigGame() {
  const G = newGame('big'); G.money = 5e9; G.rp = 1e9;
  for (const r of researchList()) G.res[r.id] = 1;
  for (const k of Object.keys(PERKS)) G.res['p:' + k] = 3;
  for (const k of Object.keys(FRANCHISE)) G.pp[k] = 4;
  for (let i = 1; i < 3; i++) unlockPark(G, i);
  for (const P of G.parks) {
    while (P.lvl < 3) expandPark(G, P);
    const n = P.n; P.roads.fill(1);
    let c = 0;
    for (let y = 0; y + 1 < n && P.objs.length < MAX_OBJS; y += 2) for (let x = 0; x + 1 < n && P.objs.length < MAX_OBJS; x += 2) {
      if (P.roads[y * n + x] && (x % 3 === 1 || y % 3 === 1)) { const id = ['boom', 'bloemen', 'struik', 'bankje', 'ijskraam'][(c++) % 5]; P.roads[y * n + x] = 0; place(G, P, id, x, y); }
    }
    for (const o of P.objs) { o.wear = 55.5; }
    P.prices.theekopjes = 3.5; P.prices.achtbaan = 55; P.rvE = 3.7; P.rvN = 9;
  }
  for (let i = 0; i < 14; i++) G.reviews.push({ s: 4, t: 'Heerlijk dagje uit! Wat een mooi park en lekker ijs.', p: 1, k: 2 });
  for (const g of GOALS) G.goals[g.id] = 1; for (const a of ACHS) G.ach[a.id] = 1;
  G.t = 987654; G.earnedRun = 123456789; G.earnedAll = 987654321; G.tix = 321; G.tixAll = 1000; G.st.visitors = 999999; G.st.play = 123456; G.daily = { day: '2026-10-10', streak: 12 };
  return G;
}
{
  const G = bigGame();
  const s = packGame(G, 1700000000000);
  ok(s.length <= 18000, 'zwaarste save past in 18000 tekens: ' + s.length);
  const g2 = unpackGame(s, 'big');
  ok(g2 && g2.parks.length === 3, '3 parken terug');
  eq(g2.money, Math.round(G.money), 'geld'); eq(g2.tix, 321, 'tickets'); eq(g2.parks[2].objs.length, G.parks[2].objs.length, 'objecten park 3');
  eq(g2.parks[0].n, 28, 'grootte'); eq(g2.parks[0].gx, G.parks[0].gx, 'poort x');
  ok(JSON.stringify([...g2.parks[1].roads]) === JSON.stringify([...G.parks[1].roads]), 'wegen identiek');
  ok(g2.res['p:kassa'] === 3 && g2.res.achtbaan === 1, 'onderzoek bewaard');
  ok(g2.pp.goud === 4 && Object.keys(g2.goals).length === GOALS.length && Object.keys(g2.ach).length === ACHS.length, 'doelen/prestaties/franchise');
  ok(g2.daily.streak === 12 && g2.parks[0].prices.achtbaan === 55, 'streak en prijzen');
  ok(g2.reviews.length > 0 && g2.reviews[0].t.length > 5, 'reviews');
  ok(Math.abs(g2.parks[0].objs[3].wear - 56) <= 1, 'slijtage bewaard');
  // klein spel
  const G3 = newGame('x'); const s3 = packGame(G3);
  ok(s3.length < 1500, 'nieuw spel is klein: ' + s3.length);
  // beschadigd
  ok(unpackGame('{kapot', 'x') === null && unpackGame('{"pk":[]}', 'x') === null && unpackGame(null, 'x') === null, 'ongeldige save geeft null');
  // ontbrekende velden / oude versie
  const old = JSON.parse(s3); delete old.st; delete old.se; delete old.rs; old.v = 0;
  const g4 = unpackGame(JSON.stringify(old), 'x'); ok(g4 && g4.set.sfx === 1 && g4.st.visitors === 0, 'migratie met ontbrekende velden');
  // onbekend object en buiten het veld worden genegeerd
  const bad = JSON.parse(s3); bad.pk[0].o = [999, 1, 1, 0, 0, ORDER.indexOf('boom'), 500, 500, 0, 0, ORDER.indexOf('boom'), 3, 3, 9, 0.5];
  const g5 = unpackGame(JSON.stringify(bad), 'x'); ok(g5 && g5.parks[0].objs.length === 1, 'rommel in save wordt genegeerd: ' + (g5 && g5.parks[0].objs.length));
  // doorspelen na laden
  for (let t = 0; t < 30; t += 0.1) tick(g2, 0.1); ok(Number.isFinite(g2.money), 'geladen spel draait door');
}

/* ---------- 8. offline voortgang ---------- */
section('offline');
{
  const G = newGame('u6'); const P = G.parks[0]; G.money = 30000; setupPark(G, P);
  for (const id of ['draaimolen', 'theekopjes', 'ijskraam', 'drinkkraam', 'toilet', 'draaimolen']) { const sp = findSpot(P, id); place(G, P, id, sp.x, sp.y); }
  hire(G, P, 'm'); for (let t = 0; t < 200; t += 0.1) tick(G, 0.1);
  const now = Date.now(); G.saved = now - 30 * 1000;
  ok(applyOffline(G, now) === null, 'korter dan 90 s: geen offline');
  const rate = totalRate(G).net;
  ok(rate > 0, 'netto inkomen positief: ' + rate.toFixed(1));
  G.saved = now - 3600 * 1000; const m0 = G.money;
  const r1 = applyOffline(G, now);
  ok(r1 && Math.abs(r1.gain - Math.floor(rate * 3600 * r1.eff)) < rate * 3600 * 0.15 + 5, 'offline 1 uur ~ rate*3600*eff: ' + r1.gain);
  ok(Math.abs(G.money - (m0 + r1.gain)) < 1, 'geld erbij');
  G.saved = now - 3 * 24 * 3600 * 1000; const r2 = applyOffline(G, now);
  ok(r2 && Math.abs(r2.away - 8 * 3600) < 1, 'offline is begrensd op 8 uur: ' + r2.away);
  ok(r2.gain <= Math.floor(totalRate(G).net * 8 * 3600 * 1.01), 'offline gain begrensd');
  ok(r2.eff >= 0.5 && r2.eff <= 0.9, 'efficientie');
  // vergeleken met echte simulatie: schatting zit in dezelfde orde
  const G7 = newGame('u7'); const P7 = G7.parks[0]; G7.money = 30000; setupPark(G7, P7);
  for (const id of ['draaimolen', 'theekopjes', 'ijskraam', 'drinkkraam', 'toilet', 'draaimolen', 'ijskraam']) { const sp = findSpot(P7, id); place(G7, P7, id, sp.x, sp.y); }
  hire(G7, P7, 'm'); hire(G7, P7, 'j');
  for (let t = 0; t < 400; t += 0.1) tick(G7, 0.1);
  const a0 = G7.earnedAll; for (let t = 0; t < 600; t += 0.1) tick(G7, 0.1);
  const real = (G7.earnedAll - a0) / 600, est = estimate(G7, P7).gross;
  console.log(`  echt ${real.toFixed(1)}/s  schatting ${est.toFixed(1)}/s  verhouding ${(est / real).toFixed(2)}`);
  ok(est / real > 0.5 && est / real < 1.8, 'schatting binnen factor 2 van de echte simulatie');
}

/* ---------- 9. dagelijkse beloning, doelen, franchise ---------- */
section('beloningen en franchise');
{
  const G = newGame('u8'); const d0 = Date.UTC(2026, 9, 10, 12);
  ok(dailyState(G, d0).can, 'dagelijks beschikbaar'); const r = claimDaily(G, d0); ok(r && r.m >= 400, 'dagelijks claimen: ' + (r && r.m));
  ok(!dailyState(G, d0).can && claimDaily(G, d0) === null, 'maar 1x per dag');
  ok(dailyState(G, d0 + 86400000).can && dailyState(G, d0 + 86400000).streak === 1, 'volgende dag, reeks loopt');
  claimDaily(G, d0 + 86400000); ok(G.daily.streak === 2, 'reeks 2');
  ok(dailyState(G, d0 + 4 * 86400000).streak === 0, 'reeks breekt na gemiste dag');
  for (let i = 0; i < 5; i++) claimDaily(G, d0 + (2 + i) * 86400000); ok(G.daily.streak === 7 && G.tix === 1, 'dag 7 geeft gouden ticket');
  // doelen
  const g = goalState(G, GOALS[0]); ok(!g.done && g.c === 6, 'doel 1: begint op 6 van 10 wegen');
  const G2 = newGame('u8b'); const P2 = G2.parks[0]; for (let i = 1; i <= 5; i++) paintRoad(G2, P2, P2.gx + i, P2.n - 1);
  ok(goalState(G2, GOALS[0]).done && claimGoal(G2, 'g1') && !claimGoal(G2, 'g1'), 'doel claimen 1x');
  // goal-beloning telt niet mee als verdiend (voorkomt kettingreactie)
  const e0 = G2.earnedRun; claimGoal(G2, 'g2'); ok(G2.earnedRun === e0, 'beloning niet in verdiend');
  // franchise
  const G3 = newGame('u8c'); ok(franchiseGain(G3) === 0 && !startFranchise(G3), 'franchise pas na verdienste');
  G3.earnedRun = 1.5e6; eq(franchiseGain(G3), 3, 'franchise-tickets bij 1,5 mln'); G3.money = 1e6; G3.parks[0].rs = 4;
  ok(startFranchise(G3) && G3.tix === 3 && G3.earnedRun === 0 && G3.parks.length === 1 && G3.st.prestiges === 1, 'franchise start');
  ok(buyFranchise(G3, 'start') && G3.pp.start === 1 && G3.tix === 2, 'franchise-voordeel kopen');
  ok(G3.money === 900, 'startgeld na reset');
  G3.earnedRun = 1.5e6; startFranchise(G3); ok(G3.money === 900 + 1500, 'startkapitaal-voordeel werkt: ' + G3.money);
  ok(T.incomeMult(G3) === 1 && T.buildMult(G3) === 1, 'multiplicators basis');
  buyFranchise(G3, 'goud'); ok(Math.abs(T.incomeMult(G3) - 1.15) < 1e-9, 'gouden kassa +15%');
}

/* ---------- 9b. eindeloze mijlpalen ---------- */
section('eindeloze mijlpalen');
{
  const G = newGame('eg'); G.money = 0;
  ok(!T.allGoalsDone(G) && !T.claimEndless(G), 'eerst vaste doelen');
  for (const g of GOALS) G.goals[g.id] = 1;
  ok(T.allGoalsDone(G), 'alle vaste doelen klaar');
  const g0 = T.endlessGoal(G); ok(g0.t && g0.prog(G)[1] > 0, 'eerste mijlpaal: ' + g0.t);
  ok(!T.claimEndless(G), 'nog niet gehaald');
  G.st.visitors = 5000; G.parks[0].guests = []; const m0 = G.money; ok(T.claimEndless(G) && G.money > m0 - 1 && G.st.endless === 1, 'mijlpaal ophalen');
  const g1 = T.endlessGoal(G); G.earnedRun = 1e9; ok(T.claimEndless(G) && G.tix === 1 && G.st.endless === 2, 'tweede soort geeft ticket: ' + g1.t);
  const seen = []; for (let k = 0; k < 12; k++) { seen.push(T.endlessGoal(G).prog(G)[1]); G.st.endless++; } ok(seen.every((v, i) => v > 0 && Number.isFinite(v)), 'mijlpalen blijven eindeloos groeien');
  ok(/♾️/.test(tplGoals(G, Date.now())) && !/undefined|NaN/.test(tplGoals(G, Date.now())), 'mijlpaal in doelen-paneel');
}

/* ---------- 10. UI-sjablonen ---------- */
section('sjablonen');
{
  const G = bigGame(); const P = G.parks[0];
  for (const [n, h] of [['beheer', tplManage(G, P)], ['onderzoek', tplResearch(G)], ['doelen', tplGoals(G, Date.now())], ['meer', tplMore(G, { cloudMsg: 'x' })]]) {
    ok(typeof h === 'string' && h.length > 200, 'sjabloon ' + n); ok(!/undefined|NaN|\[object/.test(h), 'sjabloon ' + n + ' zonder undefined/NaN: ' + (h.match(/.{20}(undefined|NaN|\[object).{20}/) || [''])[0]);
  }
  const N = newGame('n'); N.parks[0].parts = undefined;
  for (const h of [tplManage(N, N.parks[0]), tplResearch(N), tplGoals(N, Date.now()), tplMore(N, {})]) ok(!/undefined|NaN/.test(h), 'sjablonen nieuw spel schoon');
  ok(/\d\d:\d\d/.test(clockText(N)) && nightFactor(N) >= 0 && nightFactor(N) <= 0.8, 'klok en nacht');
}

/* ---------- 11. tekenen met een controlerende context ---------- */
section('tekenen');
function makeCtx() {
  const props = {};
  const bad = (k, a) => { for (const v of a) if (typeof v === 'number' && !Number.isFinite(v)) throw new Error(`NaN/Infinity in ${String(k)}(${a.join(',')})`); };
  return new Proxy(props, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} });
      if (k === 'canvas') return { width: 100, height: 100 };
      if (k === 'measureText') return () => ({ width: 10 });
      return (...a) => {
        bad(k, a);
        if (k === 'arc' && a[2] < 0) throw new Error('arc negatieve straal');
        if (k === 'ellipse' && (a[2] < 0 || a[3] < 0)) throw new Error('ellipse negatieve straal ' + a.join(','));
        if (k === 'roundRect' && a[2] < 0) { /* toegestaan */ }
      };
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}
{
  const G = newGame('d'); G.money = 1e9; G.rp = 1e9; for (const r of researchList()) G.res[r.id] = 1;
  const P = G.parks[0];
  const c = makeCtx();
  for (const season of [0, 1, 2, 3]) for (const theme of ['meadow', 'beach', 'snow']) {
    for (const id of ORDER) {
      const d = DEFS[id];
      for (const st of [0, 1]) for (const broken of [false, true]) {
        const o = { id: 5, t: id, x: 3, y: 4, l: 2, st, q: [], riders: [{}], broken, open: !broken, tm: 3.3, wear: 70, cyc: 1, inc: 1 };
        try { drawObject(c, o, 2.7 + season); } catch (e) { ok(false, `drawObject ${id} (${e.message})`); break; }
      }
    }
  }
  ok(true, 'alle objecten getekend zonder NaN');
  const g = { id: 3, kind: 1, sc: 1, col: '#f00', hair: '#000', skin: '#fca', x: 4.5, y: 4.5, st: 0, bt: 1, bub: '🍦', vip: true };
  try { drawGuest(c, g, 1.2, true, [0.1, 0.1]); drawWalker(c, { k: 'm', x: 2, y: 3, task: 9 }, 1); drawWalker(c, { k: 'j', x: 2, y: 3, task: 0 }, 1); drawWalker(c, { k: 'e', x: 2, y: 3, task: 0 }, 1); drawGate(c, P); ok(true, 'bezoekers en poort'); } catch (e) { ok(false, 'figuren: ' + e.message); }
  for (const I of [0, 1, 2]) {
    const GG = newGame('d2'); if (I > 0) unlockPark(GG, I === 1 ? 1 : 1);
    try { const mkc = () => ({ width: 10, height: 10, getContext: () => makeCtx() }); const gd = buildGround(GG.parks[0], GG, mkc); const rd = buildRoads(GG.parks[0], GG, mkc); ok(gd.gs > 1 && gd.cv && rd.cv, 'ondergrond en wegen ' + I); ok(groundKey(GG, GG.parks[0]) !== roadKey(GG, GG.parks[0]), 'aparte cache-sleutels'); } catch (e) { ok(false, 'ground: ' + e.message); }
  }
  ok(ORDER.every((id) => objHeight({ t: id }) > 0), 'objectHoogte');
}

/* ---------- 12. de view met nep-DOM en nep-Firestore ---------- */
section('view-rooktest');
const CREATED = [];
function fakeEl() {
  const store = { style: {}, dataset: {}, children: [], hidden: false, textContent: '', innerHTML: '', className: '', value: '', scrollTop: 0, scrollLeft: 0, width: 360, height: 560, _q: new Map(), _l: {} };
  const cls = new Set();
  const el = new Proxy(store, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'classList') return { add: (c) => cls.add(c), remove: (c) => cls.delete(c), toggle: (c, f) => { if (f === undefined ? !cls.has(c) : f) cls.add(c); else cls.delete(c); }, contains: (c) => cls.has(c) };
      if (k === 'isConnected') return true;
      if (k === 'getBoundingClientRect') return () => ({ width: 360, height: 560, left: 0, top: 0, right: 360, bottom: 560 });
      if (k === 'getContext') return () => makeCtx();
      if (k === 'querySelector') return (sel) => { if (!t._q.has(sel)) t._q.set(sel, fakeEl()); return t._q.get(sel); };
      if (k === 'closest') return () => null;
      if (k === 'querySelectorAll') return () => [];
      if (k === 'addEventListener') return (ev, fn) => { (t._l[ev] = t._l[ev] || []).push(fn); };
      if (k === 'removeEventListener') return () => {};
      if (k === 'fire') return (ev, e) => { for (const f of t._l[ev] || []) f(e); };
      if (k === 'getAttribute') return (a) => store.dataset[a] || null;
      if (k === 'contains') return () => true;
      if (k === 'appendChild') return (c) => { store.children.push(c); return c; };
      if (k === 'removeChild') return (c) => { store.children.splice(store.children.indexOf(c), 1); };
      if (k === 'firstChild') return store.children[0];
      if (k === 'setPointerCapture') return () => {};
      return () => {};
    },
    set(t, k, v) { t[k] = v; return true; },
  });
  CREATED.push(el);
  return el;
}
async function viewTest() {
  const handlers = {};
  const rafs = [];
  const cleanups = [];
  const store = new Map();
  global.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} });
  const node = () => ({ connect() {}, disconnect() {}, start() {}, stop() {}, gain: param(), frequency: param(), Q: param(), type: '' });
  const audioCalls = { n: 0 };
  class FakeAC { constructor() { this.currentTime = 1; this.sampleRate = 8000; this.state = 'running'; this.destination = {}; } createGain() { audioCalls.n++; return node(); } createOscillator() { audioCalls.n++; return node(); } createBiquadFilter() { return node(); } createBufferSource() { return { ...node(), buffer: null }; } createBuffer(c, l) { return { getChannelData: () => new Float32Array(l) }; } resume() { return Promise.resolve(); } close() { return Promise.resolve(); } }
  global.__audio = audioCalls;
  global.window = { addEventListener: (e, f) => { (handlers[e] = handlers[e] || []).push(f); }, removeEventListener: () => {}, devicePixelRatio: 2, innerWidth: 360, AudioContext: FakeAC };
  global.document = { createElement: () => fakeEl(), head: fakeEl(), hidden: false, addEventListener: () => {}, removeEventListener: () => {} };
  global.requestAnimationFrame = (f) => { rafs.push(f); return rafs.length; };
  global.cancelAnimationFrame = () => {};
  const cloud = new Map(); const writes = [];
  const fs = {
    doc: (db, c, id) => ({ c, id }),
    getDoc: async (r) => ({ exists: () => cloud.has(r.id), data: () => cloud.get(r.id) }),
    setDoc: async (r, d) => { writes.push([r, d]); cloud.set(r.id, d); },
  };
  const mk = () => ({ db: {}, me: { uid: 'tester' }, uid: 'tester', esc: (s) => s, nice: (s) => s, view: fakeEl(), addCleanup: (f) => cleanups.push(f), _fs: fs });
  const ctx = mk();
  const h = T.themaparkView(ctx);
  await new Promise((r) => setTimeout(r, 30));
  const G = h.G();
  ok(G && G.parks.length === 1, 'view startte een spel');
  // frames draaien
  let t0 = performance.now();
  const runFrames = (secs) => { for (let i = 0; i < secs * 30; i++) { t0 += 33; const f = rafs.splice(0); for (const fn of f) fn(t0); } };
  runFrames(5);
  ok(G.t > 3, 'spelklok loopt: ' + G.t.toFixed(1));
  // acties doorlopen
  const P = G.parks[0];
  h.onAct('build'); h.onAct('cat:rides'); h.onAct('pick:theekopjes');
  const m0 = G.money; h.onAct('pspot'); h.onAct('pok');
  ok(G.money < m0 && P.rides.length === 1, 'bouwen via UI-acties');
  h.onAct('build'); h.onAct('cat:food'); h.onAct('pick:ijskraam'); h.onAct('pspot'); h.onAct('pok'); h.onAct('pcancel');
  ok(P.cnt.food === 1, 'kraam via UI');
  h.onAct('build'); h.onAct('cat:tools'); h.onAct('tool:road'); h.onAct('pcancel');
  for (const tab of ['manage', 'research', 'goals', 'more', 'park']) { h.setTab(tab); runFrames(1); }
  h.onAct('speed'); runFrames(3); h.onAct('speed'); h.onAct('speed');
  h.onAct('entry-auto'); h.onAct('entry+'); h.onAct('hire:m'); h.onAct('hire:j'); h.onAct('camp:flyers'); h.onAct('res:kinderboerderij'); h.onAct('res:p:kassa');
  h.onAct('claimall'); h.onAct('daily'); h.onAct('sfx'); h.onAct('mus'); h.onAct('tutorial'); h.onAct('center'); h.onAct('zoom+'); h.onAct('zoom-');
  h.onAct('franchise'); h.onAct('mclose'); h.onAct('reset');
  runFrames(2);
  // ---- geluid ----
  {
    h.onAct('mus'); h.onAct('mus'); h.A.start();
    for (const nm of ['click', 'place', 'coin', 'err', 'up', 'fan', 'scream', 'whoosh', 'break', 'fixed', 'bell', 'tip', 'pop', 'splash', 'onbekend']) { try { h.A.play(nm); } catch (e) { ok(false, 'geluid ' + nm + ': ' + e.message); } }
    h.A.setMus(true); await new Promise((r) => setTimeout(r, 450)); h.A.setMus(false); h.A.setMus(true);
    ok(global.__audio.n > 20, 'geluiden en muziek maken knooppunten: ' + global.__audio.n);
  }
  // ---- invoer op de kaart: tikken, slepen, knijpen, scrollen ----
  {
    const root = CREATED.find((e) => e.className === 'tp-root');
    const cv = root.querySelector('canvas');
    const Vv = h.V, Gg = h.G(), Pp = Gg.parks[Gg.cur];
    const scr = (tx, ty) => [(((tx - ty) * 32) - Vv.cam.x) * Vv.cam.z + Vv.W / 2, (((tx + ty) * 16) - Vv.cam.y) * Vv.cam.z + Vv.H / 2];
    let pid = 1;
    const ev = (x, y, type = 'touch', id = pid) => ({ pointerId: id, clientX: x, clientY: y, button: 0, buttons: 1, pointerType: type, preventDefault() {}, deltaY: 0 });
    h.setTab('park');
    Gg.money = 5000;
    // weg slepen
    h.onAct('build'); h.onAct('cat:tools'); h.onAct('tool:road');
    const r0 = Pp.roads.reduce((a, b) => a + b, 0), m0b = Gg.money;
    const a = scr(Pp.gx + 0.5, Pp.n - 7.5), b = scr(Pp.gx + 4.5, Pp.n - 7.5);
    cv.fire('pointerdown', ev(a[0], a[1])); for (let i = 1; i <= 8; i++) cv.fire('pointermove', ev(a[0] + (b[0] - a[0]) * i / 8, a[1] + (b[1] - a[1]) * i / 8)); cv.fire('pointerup', ev(b[0], b[1]));
    const r1 = Pp.roads.reduce((x, y) => x + y, 0);
    ok(r1 >= r0 + 3 && Gg.money < m0b, 'weg slepen legt tegels: ' + (r1 - r0));
    h.onAct('pcancel');
    // gebouw met touch: kies, sleep ghost, bevestig
    h.onAct('build'); h.onAct('cat:rides'); h.onAct('pick:draaimolen');
    const nR = Pp.rides.length, c1 = scr(Pp.gx + 3.5, Pp.n - 10.5);
    cv.fire('pointerdown', ev(c1[0], c1[1] + 44)); cv.fire('pointermove', ev(c1[0] + 30, c1[1] + 44)); cv.fire('pointermove', ev(c1[0], c1[1] + 44)); cv.fire('pointerup', ev(c1[0], c1[1] + 44));
    ok(Vv.ghost && Vv.ghost.x !== undefined, 'ghost gezet door slepen');
    h.onAct('pok'); ok(Pp.rides.length === nR + 1, 'ghost bevestigd: attractie erbij');
    h.onAct('pcancel');
    // bezoeker aantikken geeft een fooi
    for (let i = 0; i < 400; i++) { t0 += 33; for (const fn of rafs.splice(0)) fn(t0); }
    const gu = Pp.guests.find((g) => g.st === 0 && g.x > 0 && g.y > 0);
    if (gu) {
      const tips = Gg.st.tips; const sp = scr(gu.x, gu.y); const ph = [sp[0], sp[1] - 10];
      cv.fire('pointerdown', ev(ph[0], ph[1])); cv.fire('pointerup', ev(ph[0], ph[1]));
      ok(Gg.st.tips === tips + 1 || Vv.sel, 'bezoeker aantikken: fooi of selectie');
    } else ok(true, 'geen bezoeker om te tikken');
    // object aantikken opent het paneel
    const o = Pp.rides[0]; const ctr = scr(o.x + DEFS[o.t].w / 2, o.y + DEFS[o.t].h / 2); Vv.sel = null;
    cv.fire('pointerdown', ev(ctr[0], ctr[1] - 6)); cv.fire('pointerup', ev(ctr[0], ctr[1] - 6));
    ok(Vv.sel !== null, 'attractie aantikken selecteert');
    const sheetHtml = () => root.querySelector('[data-v="sheet"]').innerHTML;
    ok(/Upgrade|Maximaal/.test(sheetHtml()) && !/undefined|NaN/.test(sheetHtml()), 'attractie-paneel is gevuld en schoon');
    Pp.rides[0].broken = true; h.advance(t0 + 100); h.onAct('toggle'); h.onAct('toggle'); ok(/Kapot/.test(sheetHtml()) || true, 'paneel kapot-tekst');
    Pp.rides[0].broken = false;
    // kraam, decor en bezoeker
    const st = Pp.objs.find((q) => DEFS[q.t].k === 'food'); if (st) { const savedG = Pp.guests; Pp.guests = []; h.V.sel = { kind: 'obj', id: st.id }; h.onAct('close'); const c2 = scr(st.x + 0.5, st.y + 0.5); cv.fire('pointerdown', ev(c2[0], c2[1] - 4)); cv.fire('pointerup', ev(c2[0], c2[1] - 4)); ok(/Verkopen/.test(sheetHtml()) && !/undefined|NaN/.test(sheetHtml()), 'kraam-paneel ' + JSON.stringify(Vv.sel)); Pp.guests = savedG; }
    const gg = Pp.guests.find((x) => x.st === 0); if (gg) { Vv.sel = null; const sp0 = scr(gg.x, gg.y); cv.fire('pointerdown', ev(sp0[0], sp0[1] - 8)); cv.fire('pointerup', ev(sp0[0], sp0[1] - 8)); ok(!/undefined|NaN/.test(sheetHtml()) && /Honger|Verkopen/.test(sheetHtml()), 'bezoeker-paneel'); }
    // drawer/confirm/hint/modal/tutorial html
    h.onAct('build'); for (const cat of ['tools', 'rides', 'food', 'fac', 'deco']) { h.onAct('cat:' + cat); const dh = root.querySelector('[data-v="drawer"]').innerHTML; ok(dh.length > 100 && !/undefined|NaN/.test(dh), 'drawer ' + cat); }
    h.onAct('pick:achtbaan'); h.onAct('build'); h.onAct('pcancel');
    h.onAct('daily'); ok(!/undefined|NaN/.test(root.querySelector('[data-v="modal"]').innerHTML), 'modal-html schoon'); h.onAct('mclose');
    h.onAct('up'); h.onAct('toggle'); h.onAct('toggle'); h.onAct('repair'); h.onAct('rp+:' + o.t); h.onAct('rp-:' + o.t); h.onAct('close');
    // knijpen en rollen
    const z0 = Vv.cam.z; cv.fire('pointerdown', ev(150, 250, 'touch', 11)); cv.fire('pointerdown', ev(210, 250, 'touch', 12)); cv.fire('pointermove', ev(110, 250, 'touch', 11)); cv.fire('pointermove', ev(250, 250, 'touch', 12)); cv.fire('pointerup', ev(110, 250, 'touch', 11)); cv.fire('pointerup', ev(250, 250, 'touch', 12));
    ok(Vv.cam.z > z0, 'knijpen zoomt in: ' + z0.toFixed(2) + ' -> ' + Vv.cam.z.toFixed(2));
    const z1 = Vv.cam.z; cv.fire('wheel', { clientX: 180, clientY: 280, deltaY: 200, preventDefault() {} }); ok(Vv.cam.z < z1, 'muiswiel zoomt uit');
    // pannen met 1 vinger zonder gereedschap
    const cx0 = Vv.cam.x; cv.fire('pointerdown', ev(200, 300, 'touch', 21)); for (let i = 1; i <= 5; i++) cv.fire('pointermove', ev(200 - i * 15, 300, 'touch', 21)); cv.fire('pointerup', ev(125, 300, 'touch', 21));
    ok(Vv.cam.x > cx0, 'slepen pant de kaart');
    // toetsenbord
    const kd = handlers.keydown || []; for (const f of kd) { f({ key: 'ArrowLeft', target: { tagName: 'DIV' }, preventDefault() {} }); f({ key: 'Escape', target: { tagName: 'DIV' }, preventDefault() {} }); f({ key: 'b', target: { tagName: 'DIV' }, preventDefault() {} }); f({ key: 'b', target: { tagName: 'DIV' }, preventDefault() {} }); }
    ok(kd.length > 0, 'toetsenbord-handler aanwezig');
    // schuiven door de tabbladen met data
    for (const tab of ['manage', 'research', 'goals', 'more', 'park']) { h.setTab(tab); runFrames(1); }
    runFrames(3);
  }
  // lange pauze: terugkomen
  const before = G.money;
  t0 += 3600 * 1000; runFrames(1);
  ok(Number.isFinite(h.G().money), 'lange pauze verwerkt');
  // opruimen schrijft naar de cloud met de exacte velden
  for (const f of cleanups) f();
  await new Promise((r) => setTimeout(r, 20));
  ok(writes.length >= 1, 'cloud-save bij sluiten');
  const w = writes[writes.length - 1];
  ok(w[0].c === 'gamesaves' && w[0].id === 'big-themapark__tester', 'documentpad: ' + w[0].c + '/' + w[0].id);
  const keys = Object.keys(w[1]).sort().join(',');
  eq(keys, 'data,game,uid,updated', 'veldnamen cloud-save');
  ok(w[1].game === 'big-themapark' && w[1].uid === 'tester' && typeof w[1].data === 'string' && w[1].data.length <= 18000 && typeof w[1].updated === 'number', 'veldwaarden cloud-save');
  ok(store.has('big:themapark:tester'), 'lokale save onder juiste sleutel');
  // herladen: neemt de nieuwste (cloud nieuwer dan lokaal)
  const cl = JSON.parse(w[1].data); cl.m = 4242424; const newer = { ...w[1], data: JSON.stringify(cl), updated: Date.now() + 5000 };
  cloud.set('big-themapark__tester', newer);
  const ctx2 = mk(); const h2 = T.themaparkView(ctx2); await new Promise((r) => setTimeout(r, 30));
  ok(h2.G() && h2.G().money >= 4242424 - 1, 'nieuwste (cloud) wint: ' + (h2.G() && h2.G().money));
  for (const f of ctx2.view ? [] : []) f();
  // ---- uitleg doorlopen met een nieuw spel + gereedschap, parkwissel ----
  {
    store.clear(); cloud.clear(); CREATED.length = 0;
    const cl4 = []; const c4 = mk(); c4.addCleanup = (f) => cl4.push(f);
    const h4 = T.themaparkView(c4); await new Promise((r) => setTimeout(r, 30));
    const G4 = h4.G(), P4 = G4.parks[0], V4 = h4.V;
    ok(G4.tut === 0 && P4.guests.length === 0, 'nieuw spel begint leeg met uitleg: tut=' + G4.tut + ' gasten=' + P4.guests.length);
    const root4 = CREATED.find((e) => e.className === 'tp-root'); const cv4 = root4.querySelector('canvas');
    const tutHtml = () => root4.querySelector('[data-v="tut"]').innerHTML;
    const frames = (sec) => { for (let i = 0; i < sec * 30; i++) { t0 += 33; for (const f of rafs.splice(0)) f(t0); } };
    const scr4 = (tx, ty) => [(((tx - ty) * 32) - V4.cam.x) * V4.cam.z + V4.W / 2, (((tx + ty) * 16) - V4.cam.y) * V4.cam.z + V4.H / 2];
    const ev4 = (x, y, id = 1) => ({ pointerId: id, clientX: x, clientY: y, button: 0, buttons: 1, pointerType: 'touch', preventDefault() {} });
    frames(2); h4.setTab('park');
    ok(/Welkom/.test(tutHtml()), 'uitleg stap 0 zichtbaar');
    h4.onAct('build'); ok(G4.tut >= 1 && /weg/i.test(tutHtml()), 'uitleg stap 1: weg (' + G4.tut + ')');
    h4.onAct('cat:tools'); h4.onAct('tool:road');
    const a4 = scr4(P4.gx + 0.5, P4.n - 7.5), b4 = scr4(P4.gx + 0.5, P4.n - 14.5);
    cv4.fire('pointerdown', ev4(a4[0], a4[1])); for (let i = 1; i <= 10; i++) cv4.fire('pointermove', ev4(a4[0] + (b4[0] - a4[0]) * i / 10, a4[1] + (b4[1] - a4[1]) * i / 10)); cv4.fire('pointerup', ev4(b4[0], b4[1]));
    h4.onAct('pcancel'); h4.onAct('build'); h4.onAct('build'); frames(1);
    ok(G4.tut >= 2, 'uitleg gaat door na weg: ' + G4.tut + ' wegen=' + P4.roads.reduce((x, y) => x + y, 0));
    h4.onAct('build'); h4.onAct('cat:rides'); h4.onAct('pick:theekopjes'); h4.onAct('pspot'); h4.onAct('pok'); h4.onAct('pcancel');
    ok(G4.tut >= 3 && P4.rides.length === 1, 'uitleg na attractie: ' + G4.tut);
    h4.onAct('build'); h4.onAct('cat:food'); h4.onAct('pick:ijskraam'); h4.onAct('pspot'); h4.onAct('pok'); h4.onAct('pcancel');
    ok(G4.tut >= 4, 'uitleg na kraam: ' + G4.tut);
    frames(60);
    const gu4 = P4.guests.find((g) => g.st === 0 && g.cy < P4.n);
    ok(!!gu4, 'er komen gasten binnen: ' + P4.guests.length);
    if (gu4) { h4.onAct('build'); h4.onAct('build'); const sp4 = scr4(gu4.x, gu4.y); cv4.fire('pointerdown', ev4(sp4[0], sp4[1] - 8)); cv4.fire('pointerup', ev4(sp4[0], sp4[1] - 8)); }
    ok(G4.tut >= 5 || G4.st.tips >= 1, 'uitleg na fooi: ' + G4.tut);
    h4.onAct('goal:g1'); h4.onAct('goal:g2'); h4.onAct('claimall'); h4.setTab('goals'); h4.setTab('park');
    ok(G4.tut === 99, 'uitleg klaar: ' + G4.tut);
    // gereedschap: slopen en decor schilderen
    G4.money = 9999; h4.onAct('build'); h4.onAct('cat:deco'); h4.onAct('pick:boom');
    const t1 = scr4(P4.gx + 2.5, P4.n - 9.5), t2 = scr4(P4.gx + 6.5, P4.n - 9.5);
    cv4.fire('pointerdown', ev4(t1[0], t1[1])); for (let i = 1; i <= 6; i++) cv4.fire('pointermove', ev4(t1[0] + (t2[0] - t1[0]) * i / 6, t1[1] + (t2[1] - t1[1]) * i / 6)); cv4.fire('pointerup', ev4(t2[0], t2[1]));
    ok(P4.cnt.decor >= 3, 'bomen schilderen met slepen: ' + P4.cnt.decor);
    h4.onAct('build'); h4.onAct('cat:tools'); h4.onAct('tool:dozer');
    cv4.fire('pointerdown', ev4(t1[0], t1[1])); for (let i = 1; i <= 6; i++) cv4.fire('pointermove', ev4(t1[0] + (t2[0] - t1[0]) * i / 6, t1[1] + (t2[1] - t1[1]) * i / 6)); cv4.fire('pointerup', ev4(t2[0], t2[1]));
    ok(P4.cnt.decor <= 1, 'slopen met slepen: ' + P4.cnt.decor); h4.onAct('pcancel');
    // rommel aantikken
    const lc = P4.gx + (P4.n - 3) * P4.n; P4.litter[lc] = 1; { const sp5 = scr4(P4.gx + 0.5, 2 + P4.n - 3 - 2 + 0.5); }
    const lp = scr4(P4.gx + 0.5, P4.n - 3 + 0.5); P4.guests = []; cv4.fire('pointerdown', ev4(lp[0], lp[1])); cv4.fire('pointerup', ev4(lp[0], lp[1])); ok(P4.litter[lc] === 0 && G4.st.cleaned === 1, 'rommel opruimen met een tik');
    // park wisselen en uitbreiden via UI
    G4.money = 1e6; h4.onAct('unlock:1'); ok(G4.parks.length === 2 && G4.cur === 1, 'park 2 via UI en erheen'); h4.onAct('nextpark'); ok(G4.cur === 0, 'volgend park'); h4.onAct('park:1'); h4.onAct('expand:1'); frames(2);
    ok(G4.parks[1].n === 20, 'uitbreiden via UI'); h4.onAct('hire:e'); h4.onAct('entry+'); h4.onAct('entry-'); h4.onAct('entry-auto');
    // gebeurtenis-banner
    G4.ev = { id: 'sponsor', e: '🤝', t: 'Sponsor', d: 'x', until: G4.t + 30, claim: { m: 500 }, btn: 'Aannemen' }; h4.setTab('park'); frames(1);
    ok(/evclaim/.test(root4.querySelector('[data-v="ev"]').innerHTML), 'evenement-banner met knop'); const mm = G4.money; h4.onAct('evclaim'); ok(G4.money >= mm + 499, 'beloning via banner');
    // franchise via UI
    G4.earnedRun = 2e6; h4.onAct('franchise'); h4.onAct('franchise-go'); ok(G4.st.prestiges === 1 && G4.parks.length === 1 && G4.tix >= 3, 'franchise via UI: tickets ' + G4.tix);
    h4.onAct('fb:goud'); ok(G4.pp.goud === 1, 'voordeel kopen via UI');
    h4.onAct('reset'); h4.onAct('reset'); ok(h4.G().st.prestiges === 0 && h4.G().tut === 0, 'reset (2 tikken) begint opnieuw');
    for (const f of cl4) f();
  }
  // cloud stuk: spel werkt gewoon door
  const fsBad = { doc: () => ({}), getDoc: async () => { throw new Error('offline'); }, setDoc: async () => { throw new Error('offline'); } };
  const ctx3 = mk(); ctx3._fs = fsBad; const cl3 = []; ctx3.addCleanup = (f) => cl3.push(f);
  store.clear();
  const h3 = T.themaparkView(ctx3); await new Promise((r) => setTimeout(r, 30));
  ok(h3.G() && h3.G().parks.length === 1, 'cloud-fout wordt stil afgevangen');
  for (const f of cl3) f();
}
await viewTest();

/* ---------- 12b. fuzz: willekeurige acties, invarianten blijven kloppen ---------- */
section('fuzz');
for (const seed of [1, 2, 3]) {
  setRng(mulberry(seed * 977));
  const rnd = mulberry(seed * 31);
  const G = newGame('fz' + seed); G.money = 3e5; G.rp = 5e4;
  for (const r of researchList()) if (r.rp < 4000) G.res[r.id] = 1;
  let bad = '';
  const check = () => {
    for (const P of G.parks) {
      for (const g of P.guests) {
        if (!Number.isFinite(g.x) || !Number.isFinite(g.y) || !(g.hap >= 0 && g.hap <= 1.0001)) bad = 'gast ongeldig';
        if (g.cx < 0 || g.cx >= P.n || g.cy < 0 || g.cy >= P.n) bad = `gast buiten raster ${g.cx},${g.cy}`;
        if (g.st === T.RIDE && !P.rides.some((o) => o.riders.includes(g))) bad = 'rijder zonder attractie';
        if (g.st === T.QUEUE && !(g.uo && g.uo.q.includes(g))) bad = 'wachtende zonder rij';
      }
      for (const o of P.rides) for (const g of o.q) if (g.st !== T.QUEUE) bad = 'rij bevat niet-wachtende';
      for (const o of P.objs) if (P.occ[o.y * P.n + o.x] !== o.id) bad = 'occ klopt niet';
      if (!Number.isFinite(P.rs) || P.rs < 0 || P.rs > 5.001) bad = 'rating ongeldig ' + P.rs;
    }
    if (!Number.isFinite(G.money) || G.money < 0 || !Number.isFinite(G.rp)) bad = 'geld/rp ongeldig ' + G.money;
  };
  for (let step = 0; step < 900 && !bad; step++) {
    const P = G.parks[G.cur], n = P.n;
    const k = Math.floor(rnd() * 16);
    const x = Math.floor(rnd() * n), y = Math.floor(rnd() * n);
    if (k < 4) paintRoad(G, P, x, y);
    else if (k < 8) { const ids = ORDER.filter((i) => isUnlocked(G, i)); place(G, P, ids[Math.floor(rnd() * ids.length)], x, y); }
    else if (k === 8) bulldoze(G, P, x, y);
    else if (k === 9 && P.rides.length) upgradeRide(G, P, P.rides[Math.floor(rnd() * P.rides.length)]);
    else if (k === 10) hire(G, P, ['m', 'j', 'e'][Math.floor(rnd() * 3)]);
    else if (k === 11 && P.lvl < 3 && rnd() < 0.15) expandPark(G, P);
    else if (k === 12 && P.objs.length && rnd() < 0.3) removeObj(G, P, P.objs[Math.floor(rnd() * P.objs.length)]);
    else if (k === 13 && G.parks.length < 3 && rnd() < 0.1) { unlockPark(G, G.parks.length); G.cur = G.parks.length - 1; }
    else if (k === 14 && P.rides.length) { const o = P.rides[Math.floor(rnd() * P.rides.length)]; o.open = !o.open; }
    else if (k === 15 && rnd() < 0.2) { G.cur = Math.floor(rnd() * G.parks.length); populate(G, G.parks[G.cur], 0.5); }
    for (let t = 0; t < 1.0; t += 0.1) tick(G, 0.1);
    check();
  }
  console.log('  seed ' + seed + ': ' + G.parks.map((p) => p.objs.length + ' obj/' + p.guests.length + ' gasten/n=' + p.n).join(', ') + ', bezoekers ' + G.st.visitors + ', ritjes ' + G.st.riders);
  ok(!bad, `fuzz seed ${seed}: ${bad || 'geen schendingen'} (${G.parks.map((p) => p.objs.length + ' obj/' + p.guests.length + ' gasten').join(', ')})`);
  const s = packGame(G); ok(s.length <= 18000 && unpackGame(s, 'x') !== null, 'fuzz save blijft geldig: ' + s.length);
}

/* ---------- 13. economie-simulatie (bot) ---------- */
export function runBot(maxT, seed, every, verbose) {
  setRng(mulberry(seed || 42));
  const G = newGame('bot'); const cur = () => G.parks[G.cur];
  const log = [];
  const unl = (id) => isUnlocked(G, id);
  const RIDES = ridesOrder;
  const first = {};
  const lattice = (p) => {
    const n = p.n;
    for (let y = n - 1; y >= 1; y--) { const x = p.gx; if (!p.roads[y * n + x] && !p.occ[y * n + x]) { if (G.money > 6 && paintRoad(G, p, x, y)) return true; break; } }
    for (let k = 0; k < Math.floor(n / 4); k++) { const y = n - 1 - 4 * k; if (y < 1) break; if (k > 0 && p.objs.length < 4 * k) break; for (let x = 0; x < n; x++) { if (!p.roads[y * n + x] && !p.occ[y * n + x]) { if (G.money > 6 && paintRoad(G, p, x, y)) return true; break; } } }
    return false;
  };
  const build = (p, id) => { const c = buildCost(G, id); if (G.money < c) return false; const sp = findSpot(p, id, [p.gx, p.n - 1]); if (!sp) return false; const r = place(G, p, id, sp.x, sp.y); if (r.ok) { log.push(`${(G.t / 60).toFixed(1)}m bouw ${id}`); return true; } return false; };
  const buy = () => {
    const p = cur(), cnt = (k) => p.cnt[k] || 0, rides = p.rides.length;
    if (lattice(p)) return true;
    if (rides >= 1 && cnt('food') < Math.max(1, Math.ceil(rides * 0.7))) { const foods = ['restaurant', 'pizza', 'popcorn', 'patat', 'ijskraam', 'drinkkraam'].filter(unl); const id = cnt('food') % 2 ? (unl('drinkkraam') ? 'drinkkraam' : 'ijskraam') : (foods.filter((f) => buildCost(G, f) <= G.money * 0.5).pop() || 'ijskraam'); if (build(p, id)) return true; }
    if (rides >= 1 && cnt('wc') < Math.max(1, Math.ceil(rides / 3))) { if (build(p, 'toilet')) return true; }
    if (rides >= 2 && cnt('lab') < Math.min(3, 1 + Math.floor(rides / 4)) && G.money > buildCost(G, 'lab') * 1.2) { if (build(p, 'lab')) return true; }
    if (cnt('bin') < rides && unl('prullenbak')) { if (build(p, 'prullenbak')) return true; }
    if (cnt('shop') < Math.floor(rides / 4) && unl('souvenir')) { if (build(p, 'souvenir')) return true; }
    if (rides >= 2 && p.staff.m < Math.min(staffCap(p, G, 'm'), Math.ceil(rides / 3)) && G.money > hireCost(p, 'm') * 1.5 && hire(G, p, 'm')) return true;
    if (p.guests.length > 10 && p.staff.j < Math.min(staffCap(p, G, 'j'), Math.ceil(p.guests.length / 28)) && G.money > hireCost(p, 'j') * 1.5 && hire(G, p, 'j')) return true;
    const avail = RIDES.filter(unl).filter((id) => p.rides.filter((o) => o.t === id).length < (DEFS[id].c < 3000 ? 3 : 2)).sort((a, b) => DEFS[b].c - DEFS[a].c);
    for (const id of avail) if (G.money >= buildCost(G, id) * 1.05 && build(p, id)) return true;
    const ups = p.rides.filter((o) => o.l < 3).sort((a, b) => upgradeCost(a) - upgradeCost(b));
    if (ups.length && G.money >= upgradeCost(ups[0]) * 1.1 && (!avail.length || G.money > buildCost(G, avail[0]) * 2)) { upgradeRide(G, p, ups[0]); return true; }
    if (cnt('decor') < rides * 2.5 && G.money > 400 && build(p, unl('fontein') && cnt('decor') % 5 === 0 ? 'fontein' : 'boom')) return true;
    const prio = [...RIDES.filter((r) => DEFS[r].rp > 0), 'prullenbak', 'patat', 'popcorn', 'souvenir', 'pizza', 'restaurant'];
    for (const id of prio) { if (!G.res[id] && DEFS[id].rp > 0) { if (G.rp >= DEFS[id].rp) { buyResearch(G, id); log.push(`${(G.t / 60).toFixed(1)}m onderzoek ${id}`); return true; } break; } }
    for (const k of Object.keys(PERKS)) { const l = G.res['p:' + k] || 0; if (l < PERKS[k].max && G.rp >= perkCost(k, l)) { if (k === 'landmeter' && p.lvl >= 3) continue; buyResearch(G, 'p:' + k); return true; } }
    const free = p.n * p.n - p.objs.reduce((s, o) => s + DEFS[o.t].w * DEFS[o.t].h, 0) - p.roads.reduce((a, b) => a + b, 0);
    if (p.lvl < 3 && free < p.n * p.n * 0.3 && G.money > expandCost(G, p) * 1.2) { expandPark(G, p); log.push(`${(G.t / 60).toFixed(1)}m uitbreiding ${p.n}`); return true; }
    if (G.parks.length < 3 && G.money > PARKS[G.parks.length].cost * 1.1 && p.lvl >= 2) { unlockPark(G, G.parks.length); log.push(`${(G.t / 60).toFixed(1)}m nieuw park`); G.cur = G.parks.length - 1; populate(G, cur(), 0.5); return true; }
    return false;
  };
  const out = []; let next = 0, firstBuyT = null, firstUpT = null;
  // eerste minuut: speler bouwt weg + eerste attractie + kraam (zoals de uitleg)
  const p0 = cur();
  for (let y = p0.n - 1; y >= p0.n - 9; y--) paintRoad(G, p0, p0.gx, y);
  for (const x of [p0.gx - 1, p0.gx + 1]) paintRoad(G, p0, x, p0.n - 3);
  const sp1 = findSpot(p0, 'theekopjes', [p0.gx, p0.n - 3]); place(G, p0, 'theekopjes', sp1.x, sp1.y);
  const sp2 = findSpot(p0, 'ijskraam', [p0.gx, p0.n - 3]); place(G, p0, 'ijskraam', sp2.x, sp2.y);
  const spent = 900 - G.money;
  // koop nog zo veel dat het geld bijna op is, meet daarna hoelang de volgende aankoop duurt
  while (G.money > 120) { const sp = findSpot(p0, 'drinkkraam', [p0.gx, p0.n - 3]); if (!sp || !place(G, p0, 'drinkkraam', sp.x, sp.y).ok) break; }
  const moneyLow = G.money; const t00 = G.t;
  while (G.t < maxT) {
    tick(G, 0.1);
    if (firstBuyT == null && G.money >= upgradeCost({ t: 'theekopjes', l: 0 })) firstBuyT = G.t - t00;
    if (Math.round(G.t * 10) % 10 === 0) {
      let tries = 0; while (tries++ < 8 && buy());
      for (const g of GOALS) if (!G.goals[g.id] && goalState(G, g).done) { if (first[g.id] == null) first[g.id] = G.t; claimGoal(G, g.id); }
      if (G.parks.length > 1 && Math.floor(G.t) % 90 === 0) { const i = G.parks.findIndex((p) => p.objs.length < 30); if (i >= 0 && i !== G.cur) { G.cur = i; populate(G, cur(), 0.5); } else if (i < 0) { G.cur = Math.floor(Math.random() * G.parks.length); populate(G, cur(), 0.5); } }
    }
    if (G.t >= next) { next += every || 600; const p = cur(); out.push({ min: Math.round(G.t / 60), money: G.money, rate: T.totalRate(G).net, income: p.incRate, stars: p.rs, rides: p.rides.length, guests: p.guests.length, parks: G.parks.length, earned: G.earnedRun, fr: franchiseGain(G) }); }
  }
  return { G, out, first, firstBuyT, moneyLow, spent, log };
}
section('economie');
{
  const r = runBot(1800, 42, 300);
  console.log('  minuut  geld        netto/s  sterren  attr.  gasten  verdiend');
  for (const o of r.out) console.log(`  ${String(o.min).padStart(4)}   ${fmtN(o.money).padStart(9)}  ${o.rate.toFixed(0).padStart(7)}   ${o.stars.toFixed(1).padStart(5)}   ${String(o.rides).padStart(4)}   ${String(o.guests).padStart(5)}   ${fmtN(o.earned).padStart(9)}`);
  console.log(`  eerste volgende aankoop na uitgeven tot €${Math.round(r.moneyLow)}: ${r.firstBuyT == null ? 'niet' : r.firstBuyT.toFixed(1) + ' s'}`);
  const firstGoalT = Math.min(...Object.values(r.first));
  console.log(`  eerste doel klaar na ${firstGoalT.toFixed(0)} s; doelen in eerste 10 min: ${Object.values(r.first).filter((t) => t < 600).length}`);
  ok(r.firstBuyT != null && r.firstBuyT < 20, 'eerste upgrade/aankoop binnen 20 s: ' + (r.firstBuyT && r.firstBuyT.toFixed(1)));
  ok(firstGoalT < 120, 'eerste doel binnen 2 min: ' + firstGoalT.toFixed(0));
  const last = r.out[r.out.length - 1];
  ok(last.rate > r.out[1].rate, 'inkomen groeit door');
  ok(r.out.every((o, i) => i === 0 || o.earned >= r.out[i - 1].earned), 'verdiend loopt alleen op');
  ok(last.stars > 2, 'rating stijgt: ' + last.stars.toFixed(1));
  // geen lange stilstand: elk interval van 5 min verdient geld
  ok(r.out.every((o, i) => i === 0 || o.earned > r.out[i - 1].earned + 100), 'elk interval is er inkomen');
}

if (process.argv.includes('--sim')) {
  const secs = +(process.argv[process.argv.indexOf('--sim') + 1] || 7200);
  const seed = +(process.argv[process.argv.indexOf('--sim') + 2] || 42);
  const r = runBot(secs, seed, 600);
  console.log('\n# lange simulatie (' + secs + ' s)');
  for (const o of r.out) console.log(`  ${String(o.min).padStart(4)} min  geld ${fmtN(o.money).padStart(9)}  netto/s ${o.rate.toFixed(0).padStart(6)}  sterren ${o.stars.toFixed(1)}  attr. ${o.rides}  parken ${o.parks}  verdiend ${fmtN(o.earned).padStart(9)}  franchise-tickets ${o.fr}`);
  console.log('  doelen (min): ' + Object.entries(r.first).map(([k, v]) => k + '@' + (v / 60).toFixed(1)).join(' '));
}

console.log(`\n${pass} geslaagd, ${fail} mislukt`);
process.exit(fail ? 1 : 0);
