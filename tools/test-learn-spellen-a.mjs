// Tests voor SPELLEN-A: klassiek, toren, baas, race, vissen, vlag (economie-simulaties + rooktests met nep-DOM)
import { installMock, makeEnv } from './learn-stubs/a-mock.mjs';
const M = installMock();
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.error('FOUT:', m); } };
const rng = (s) => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const only = process.argv[2];
const want = (n) => !only || only === n;

async function smoke(name, mod, { acc = 0.8, level = 2, thinkMs = 3000, maxMs = 900000, fx = {}, tapBegin = true, extra = null, begin = /beginnen/i } = {}) {
  const { env, log } = makeEnv({ acc, level, thinkMs, clock: M.clock, fx });
  const host = document.createElement('div'); document.body.appendChild(host);
  const styles0 = document.head.children.length;
  const g = mod.default.create(host, env);
  ok(g && typeof g.destroy === 'function', name + ': create geeft {destroy}');
  if (tapBegin) {
    // klik elke knop met 'begin' in de tekst
    const all = host.all().filter((e) => e.tagName === 'BUTTON' && begin.test(e.textContent));
    ok(all.length >= 1, name + ': startknop aanwezig');
    all.forEach((b) => b.click());
  }
  const step = 500; let t = 0;
  const flush = () => new Promise((r) => setImmediate(r));
  while (!log.ends.length && t < maxMs) { M.clock.advance(step); t += step; await flush(); if (extra) host.all().filter((e) => e.tagName === 'BUTTON' && extra.test(e.textContent) && e.parentNode).forEach((b) => b.click()); }
  M.clock.advance(5000); await flush();
  ok(log.ends.length === 1, name + ': env.end precies 1x (was ' + log.ends.length + ', t=' + (t / 1000) + 's)');
  const r = log.ends[0] || {};
  ok(typeof r.score === 'number' && isFinite(r.score), name + ': score is getal');
  ok(typeof r.summary === 'string' && r.summary.length > 3, name + ': summary');
  ok(r.stats && typeof r.stats === 'object', name + ': stats');
  ok(log.reports.length > 0 && log.reports.every((x) => x.q && typeof x.ok === 'boolean'), name + ': report per vraag');
  g.destroy(); g.destroy();
  M.clock.advance(5000); await flush();
  ok(M.clock.timers.size === 0 && M.clock.raf.size === 0, name + ': na destroy geen timers/rAF (' + M.clock.timers.size + '/' + M.clock.raf.size + ')');
  ok(document.head.children.length === styles0, name + ': <style> opgeruimd');
  ok(log.ends.length === 1, name + ': na destroy geen 2e end');
  return { r, log, t };
}

if (want('klassiek')) {
  const K = await import('../docs/learn/games/klassiek.js');
  const { Eco, UPS, makeBots, botTick, default: G } = K;
  ok(G.id === 'klassiek' && G.minutes === 4, 'klassiek meta');
  // bot-sim van de speler
  function sim(acc, thinkS, secs, seed) {
    const rand = rng(seed); const fx = {}; const st = Eco.newState(fx); let t = 0, first = null, firstBuy = null, minCash = 0;
    while (t < secs) {
      t += thinkS; Eco.tickBank(st, thinkS);
      if (rand() < acc) { const g = Eco.correct(st, thinkS * 1000, fx, 1); if (first == null) first = t; ok(g > 0, 'gain>0'); } else Eco.wrong(st);
      minCash = Math.min(minCash, st.cash);
      const b = Eco.autoBuy(st); if (b && firstBuy == null) firstBuy = t;
    }
    return { st, first, firstBuy, minCash };
  }
  const good = sim(0.85, 5, 240, 1), mid = sim(0.6, 7, 240, 2), bad = sim(0.4, 8, 240, 3);
  console.log('klassiek 85%:', good.st.buys, 'upgrades, cash', Math.round(good.st.earned), 'eerste koop na', good.firstBuy, 's');
  console.log('klassiek 60%:', mid.st.buys, 'upgrades, cash', Math.round(mid.st.earned), '| 30%:', bad.st.buys, bad.st.earned);
  ok(good.first <= 6, 'eerste beloning < 30s'); ok(good.firstBuy <= 40, 'eerste upgrade binnen 40s (' + good.firstBuy + ')');
  ok(good.st.buys >= 8, 'goede speler koopt >= 8 upgrades (' + good.st.buys + ')');
  ok(mid.st.buys >= 5, 'middelmatige speler >= 5 upgrades'); ok(bad.st.buys >= 1, 'zwakke speler komt ook vooruit');
  ok(good.minCash >= 0 && bad.minCash >= 0, 'geld nooit negatief');
  ok(good.st.earned > mid.st.earned && mid.st.earned > bad.st.earned, 'beter spelen loont');
  // bots vs speler (normaal): speler goed wint vaak
  let wins = 0, N = 40;
  for (let s = 0; s < N; s++) {
    const rand = rng(100 + s); const bots = makeBots(2, rand, 4); const me = sim(0.8, 5.5, 240, 500 + s).st;
    for (let t = 0; t < 240; t += 0.1) bots.forEach((b) => botTick(b, 0.1, rand, 1));
    if (me.cash >= Math.max(...bots.map((b) => b.st.cash))) wins++;
  }
  console.log('klassiek: speler 80% wint', wins, '/', N);
  ok(wins >= 8 && wins <= 36, 'winkans redelijk (niet 0 en niet altijd): ' + wins);
  const out = await smoke('klassiek', K, {});
  console.log('klassiek smoke ok, score', out.r.score);
  await smoke('klassiek-eindeloos', K, { begin: /Eindeloos/, acc: 0.6, thinkMs: 3000 });
  await smoke('klassiek-makkelijk-fx', K, { level: 1, acc: 0.2, fx: { startCash: 100, shield: 2, cashMult: 1.5 } });
}

if (want('toren')) {
  const T = await import('../docs/learn/games/toren.js');
  const { newTD, step, answer, autoPlay, WAVES } = T;
  ok(T.default.id === 'toren', 'toren meta');
  function sim(acc, thinkS, level, seed, fx = {}) {
    const rand = rng(seed); const st = newTD({ level, fx, noFx: true }); let t = 0, firstGold = null, nextA = thinkS;
    while (st.phase !== 'won' && st.phase !== 'lost' && t < 900) {
      t += 1 / 20; step(st, 1 / 20);
      if (t >= nextA) { nextA += thinkS * (0.8 + rand() * 0.4); const g0 = st.gold; answer(st, rand() < acc, thinkS * 1000, st.fx); if (firstGold == null && st.gold > g0) firstGold = t; autoPlay(st); }
      if (Math.floor(t * 20) % 40 === 0) autoPlay(st);
    }
    return { st, t, firstGold };
  }
  for (const level of [1, 2, 3]) {
    let w = 0, N = 20, wt = 0, tt = 0;
    for (let s = 0; s < N; s++) { const r = sim(0.8, 6, level, 40 + s); if (r.st.phase === 'won') w++; ok(r.st.phase === 'won' || r.st.phase === 'lost', 'toren eindigt (level ' + level + ')'); tt += r.t; if (!s) ok(r.firstGold <= 20, 'toren: eerste beloning snel'); }
    console.log('toren level', level, 'bot 80%/6s wint', w + '/' + N, 'gem. duur', Math.round(tt / N), 's');
    if (level === 2) ok(w >= 8, 'toren normaal: haalbaar (' + w + ')');
    if (level === 1) ok(w >= 12, 'toren makkelijk wint vaak (' + w + ')');
  }
  let wl = 0; for (let s = 0; s < 10; s++) { const r = sim(0.3, 8, 2, 90 + s); ok(r.st.phase === 'won' || r.st.phase === 'lost', 'zwakke bot eindigt'); if (r.st.phase === 'lost') wl++; ok(r.t < 600, 'zwakke bot niet eindeloos'); }
  console.log('toren zwakke bot (30%) verliest', wl + '/10');
  const out = await smoke('toren', T, { acc: 0.85, thinkMs: 4000 }); console.log('toren smoke ok', out.r.summary);
  await smoke('toren-eindeloos', T, { begin: /Eindeloos/, acc: 0.6, thinkMs: 4000 });
  await smoke('toren-zwak', T, { acc: 0.1, level: 3, thinkMs: 6000 });
}
if (want('baas')) {
  const B = await import('../docs/learn/games/baas.js');
  const { newBoss, step, playerAnswer, autoBuy } = B;
  ok(B.default.id === 'baas', 'baas meta');
  function sim(acc, thinkS, level, seed, fx = {}) {
    const rand = rng(seed); const st = newBoss({ level, rand, fx, noFx: true }); let t = 0, nextA = thinkS, firstCoin = null;
    while (st.phase === 'fight' && t < 900) {
      t += 0.05; step(st, 0.05);
      if (t >= nextA) { nextA += thinkS * (0.8 + rand() * 0.4); const c0 = st.coins; playerAnswer(st, rand() < acc, thinkS * 1000); if (firstCoin == null && st.coins > c0) firstCoin = t; autoBuy(st); }
    }
    return { st, t, firstCoin };
  }
  for (const level of [1, 2, 3]) {
    let w = 0, N = 30, tt = 0;
    for (let s = 0; s < N; s++) { const r = sim(0.8, 6, level, 7 + s); if (r.st.phase === 'won') w++; ok(r.st.phase !== 'fight', 'baas eindigt'); tt += r.t; }
    console.log('baas level', level, 'bot 80%/6s wint', w + '/' + N, 'gem. duur', Math.round(tt / N), 's');
    if (level === 2) ok(w >= 12 && w <= 29, 'baas normaal: haalbaar maar niet triviaal (' + w + ')');
    if (level === 1) ok(w >= 20, 'baas makkelijk (' + w + ')');
  }
  let wl = 0, tmax = 0; for (let s = 0; s < 20; s++) { const r = sim(0.3, 8, 2, 200 + s); ok(r.st.phase !== 'fight', 'zwakke bot eindigt'); if (r.st.phase === 'lost') wl++; tmax = Math.max(tmax, r.t); ok(r.firstCoin == null || r.firstCoin < 150, "eerste munt snel genoeg"); }
  console.log('baas zwakke bot 30%: verliest', wl + '/20, max duur', Math.round(tmax), 's'); ok(tmax < 500, 'baas altijd binnen 8 min');
  const out = await smoke('baas', B, { acc: 0.8, thinkMs: 5000 }); console.log('baas smoke ok', out.r.summary);
  await smoke('baas-rush', B, { begin: /Baas-rush/, acc: 0.8, thinkMs: 4000 });
  await smoke('baas-zwak', B, { acc: 0.0, thinkMs: 6000, level: 3 });
}
if (want('race')) {
  const R = await import('../docs/learn/games/race.js');
  const { newRace, startRace, step, answer, autoBuy, TRACK, RACES } = R;
  ok(R.default.id === 'race', 'race meta');
  function sim(acc, thinkS, level, seed, fx = {}) {
    const rand = rng(seed); const st = newRace({ level, rand, fx, noFx: true }); const places = []; let maxT = 0, firstGas = null;
    for (let r = 0; r < RACES; r++) {
      startRace(st); let t = 0, nextA = thinkS;
      while (st.phase !== 'between' && st.phase !== 'gameover' && t < 400) {
        t += 0.05; step(st, 0.05);
        if (st.phase === 'race' && t >= nextA + 3.2) { nextA += thinkS * (0.8 + rand() * 0.4); const a = answer(st, rand() < acc, thinkS * 1000); if (firstGas == null && a.gas) firstGas = t; }
      }
      ok(st.phase === 'between' || st.phase === 'gameover', 'race eindigt'); maxT = Math.max(maxT, st.t); places.push(st.cars[0].place); autoBuy(st);
    }
    return { st, places, maxT, firstGas };
  }
  for (const level of [1, 2, 3]) {
    let top2 = 0, N = 30, tot = 0, champ = 0, mx = 0;
    for (let s = 0; s < N; s++) { const r = sim(0.8, 5, level, 11 + s); top2 += r.places.filter((p) => p <= 2).length; tot += r.places.length; const best = Math.max(...r.st.cars.map((c) => c.pts)); if (r.st.cars[0].pts === best) champ++; mx = Math.max(mx, r.maxT); }
    console.log('race level', level, 'bot 80%/5s: top2', Math.round(100 * top2 / tot) + '%', 'kampioen', champ + '/' + N, 'langste race', Math.round(mx), 's');
    if (level === 2) ok(champ >= 8 && champ <= 29, 'race normaal: haalbaar maar niet triviaal (' + champ + ')');
    if (level === 1) ok(champ >= 15, 'race makkelijk (' + champ + ')');
  }
  let mx = 0; for (let s = 0; s < 20; s++) { const r = sim(0.2, 9, 3, 300 + s); mx = Math.max(mx, r.maxT); ok(r.st.cars[0].fin != null || r.st.t >= 0, 'zwakke bot rijdt'); }
  console.log('race zwakke bot (20%) langste race', Math.round(mx), 's'); ok(mx <= 135, 'race altijd < 135 s');
  const out = await smoke('race', R, { acc: 0.8, thinkMs: 4000, extra: /Volgende race|^Klaar/ }); console.log('race smoke ok', out.r.summary, Math.round(out.t / 1000), 's');
  await smoke('race-tijdrit', R, { begin: /Tijdrit/, acc: 0.8, thinkMs: 4000, extra: /Volgende race|^Klaar/ });
  await smoke('race-zwak', R, { acc: 0.1, thinkMs: 7000, level: 3, extra: /Volgende race|^Klaar/ });
}
if (want('vissen')) {
  const V = await import('../docs/learn/games/vissen.js');
  const { newFishing, answer, step, sellAll, autoBuy, collection, unlockedZones, SPECIES } = V;
  ok(V.default.id === 'vissen', 'vissen meta');
  function sim(acc, thinkS, seed, secs = 240) {
    const rand = rng(seed); const st = newFishing({ rand, fx: {} }); let t = 0, firstCatch = null, firstBuy = null;
    while (t < secs) {
      t += thinkS; step(st, thinkS);
      const r = answer(st, rand() < acc, thinkS * 1000); if (r.fish.length && firstCatch == null) firstCatch = t;
      if (st.inv.length >= 4 || st.market.mult > 1) sellAll(st);
      const b0 = st.buys; autoBuy(st); if (st.buys > b0 && firstBuy == null) firstBuy = t;
      if (st.coins < 0) ok(false, 'vissen: negatief');
    }
    sellAll(st); return { st, firstCatch, firstBuy };
  }
  const good = sim(0.85, 5, 1), mid = sim(0.6, 7, 2), bad = sim(0.3, 9, 3);
  for (const [n, r] of [['85%', good], ['60%', mid], ['30%', bad]]) console.log('vissen', n, 'verdiend', Math.round(r.st.earned), 'upgrades', r.st.buys, 'boot', r.st.up.boat, 'hengel', r.st.up.rod, 'soorten', collection(r.st) + '/' + SPECIES, 'eerste koop', r.firstBuy);
  ok(good.firstCatch <= 10, 'vissen: eerste vangst snel'); ok(good.firstBuy <= 40, 'vissen: eerste upgrade < 40 s (' + good.firstBuy + ')');
  ok(good.st.up.boat >= 2, 'vissen: goede speler bereikt de zee (boot ' + good.st.up.boat + ')'); ok(mid.st.up.boat >= 1, 'vissen: middel bereikt het meer'); ok(bad.st.buys >= 2, 'vissen: zwakke speler komt vooruit');
  ok(good.st.earned > mid.st.earned && mid.st.earned > bad.st.earned, 'vissen: beter spelen loont');
  ok(good.st.up.boat < 4 && collection(good.st) >= 7, 'vissen: verzamelen loont');
  const out = await smoke('vissen', V, { acc: 0.8, thinkMs: 4000 }); console.log('vissen smoke ok', out.r.summary);
  await smoke('vissen-toernooi', V, { begin: /Vistoernooi/, acc: 0.8, thinkMs: 3000 });
  await smoke('vissen-zwak', V, { acc: 0.0, thinkMs: 6000, level: 3, fx: { shield: 2, luck: 0.5 } });
}
if (want('vlag')) {
  const F = await import('../docs/learn/games/vlag.js');
  const { newFlag, step, answer, autoPlay, bfs, MY_FLAG, RED_FLAG } = F;
  ok(F.default.id === 'vlag', 'vlag meta');
  for (let s = 0; s < 50; s++) { const st = newFlag({ rand: rng(s) }); ok(bfs(st.walls, { c: 4, r: 9 }, { c: 4, r: 0 }), 'vlag: kaart verbonden ' + s); }
  function sim(acc, thinkS, level, seed) {
    const rand = rng(seed); const st = newFlag({ level, rand, fx: {}, noFx: true }); let t = 0, nextA = thinkS, firstCap = null;
    while (st.phase === 'play' && t < 400) {
      t += 0.1; step(st, 0.1);
      if (t >= nextA) { nextA += thinkS * (0.8 + rand() * 0.4); answer(st, rand() < acc, thinkS * 1000); }
      autoPlay(st); if (firstCap == null && st.caps.blue) firstCap = t;
    }
    return { st, t, firstCap };
  }
  for (const level of [1, 2, 3]) {
    let w = 0, N = 30, tot = 0, red = 0, tg = 0; for (let s = 0; s < N; s++) { const r = sim(0.8, 5, level, 20 + s); if (r.st.phase === 'won') w++; tot += r.st.caps.blue; red += r.st.caps.red; tg += r.st.tagged; ok(r.st.phase !== 'play', 'vlag eindigt'); }
    console.log('vlag level', level, 'bot 80%/5s wint', w + '/' + N, 'gem. caps', (tot / N).toFixed(1), 'rood', (red / N).toFixed(1), 'getikt', (tg / N).toFixed(1));
    if (level === 2) ok(w >= 8, 'vlag normaal haalbaar (' + w + ')');
    if (level === 1) ok(w >= 14, 'vlag makkelijk (' + w + ')');
  }
  let c0 = 0, fc = 0; for (let s = 0; s < 20; s++) { const r = sim(0.3, 8, 2, 400 + s); c0 += r.st.caps.blue; ok(r.st.phase !== 'play', 'zwakke bot eindigt'); if (r.firstCap != null) fc++; }
  console.log('vlag zwakke bot 30%: gem. vlaggen', (c0 / 20).toFixed(1), ' ten minste 1 vlag in', fc + '/20');
  ok(fc >= 5, 'vlag: ook een zwakke speler scoort soms');
  const out = await smoke('vlag', F, { acc: 0.8, thinkMs: 4000 }); console.log('vlag smoke ok', out.r.summary);
  await smoke('vlag-blitz', F, { begin: /Blitz/, acc: 0.8, thinkMs: 4000 });
  await smoke('vlag-zwak', F, { acc: 0.0, thinkMs: 6000, level: 3, fx: { shield: 2 } });
}

if (want('nieuw')) {
  // ---- klassiek: 9 upgrades, jackpot/opkikker
  const K = await import('../docs/learn/games/klassiek.js');
  ok(K.UPS.length === 9 && K.UPS.every((u) => u.icon && u.vals.length === u.cost.length + 1), 'klassiek: 9 upgrades met icoon');
  { const st = K.Eco.newState({}); st.lvl.jackpot = 2; st.correct = 4; const a = K.Eco.gain(st, 9999, {}, 1); st.correct = 0; const b = K.Eco.gain(st, 9999, {}, 1); ok(a > b * 2.5, 'jackpot op 5e antwoord');
    const s2 = K.Eco.newState({}); s2.lvl.comeback = 2; const n0 = K.Eco.gain(s2, 9999, {}, 1); K.Eco.wrong(s2); ok(K.Eco.gain(s2, 9999, {}, 1) > n0 * 2, 'opkikker na fout'); K.Eco.correct(s2, 9999, {}, 1); ok(!s2.comeback, 'opkikker eenmalig');
    const s3 = K.Eco.newState({}); s3.lvl.gold = 3; ok(K.goldMult(s3) === 3.5 && K.goldDur(s3) === 30, 'gouden uur'); s3.cash = 1e6; ok(K.Eco.buy(s3, 'time') && s3.lvl.time === 1); }
  // ---- toren: 9 torens, 11 monsters, kristal/vuur/eindeloos
  const T = await import('../docs/learn/games/toren.js');
  ok(Object.keys(T.TOWERS).length === 9 && Object.values(T.TOWERS).every((x) => x.icon), 'toren: 9 torens'); ok(Object.keys(T.MONSTERS).length === 12 && Object.values(T.MONSTERS).every((x) => x.icon), 'toren: 12 monstersoorten');
  { const st = T.newTD({ level: 2, fx: {}, noFx: true }); st.gold = 9999; const a = T.build(st, 0, 0, 'boog'), k = T.build(st, 1, 0, 'kristal'); ok(a && k, 'bouwen'); ok(T.boostOf(st, a) > 1.2 && T.boostOf(st, k) === 1, 'kristal versterkt buren');
    const far = T.build(st, 8, 7, 'boog'); ok(T.boostOf(st, far) === 1, 'ver weg geen boost');
    const st2 = T.newTD({ level: 2, fx: {}, noFx: true, endless: true }); st2.gold = 9999; T.build(st2, 2, 0, 'vuur'); T.startWave(st2); T.step(st2, 0.1); st2.mons.push({ id: 99, type: 'worm', d: 100, hp: 100, max: 100, speed: 0, x: 2 * 40 + 20, y: 1 * 40 + 20, slow: 0, slowF: 1, hurt: 0, r: 11, burn: 0, burnDps: 0 }); for (let i = 0; i < 20; i++) T.step(st2, 0.1); ok(st2.mons[0].burn > 0 || st2.mons[0].hp < 100, 'vuur brandt');
    const st3 = T.newTD({ level: 2, fx: {}, noFx: true, endless: true }); st3.wave = 10; st3.phase = 'wave'; st3.queue = []; st3.mons = []; T.step(st3, 0.1); ok(st3.phase === 'build' && st3.wave === 10, 'eindeloos: na golf 10 niet gewonnen'); ok(T.startWave(st3) && st3.wave === 11, 'golf 11 start'); ok(T.waveDef(14).length > 0 && T.waveDef(30).length > 0 && T.hpBase(11) < T.hpBase(10) * 1.5 && T.hpBase(30) > T.hpBase(11), 'eindeloze golven groeien beperkt');
    const st4 = T.newTD({ level: 2, fx: {}, noFx: true }); st4.wave = 10; st4.phase = 'wave'; st4.queue = []; st4.mons = []; T.step(st4, 0.1); ok(st4.phase === 'won', 'campagne wint na golf 10'); }
  // ---- baas: 10 bazen, rush, bom/vriezer, trekjes
  const B = await import('../docs/learn/games/baas.js');
  ok(B.BOSSES.length === 10 && B.BOSSES.every((b) => b.icon), 'baas: 10 bazen');
  { const st = B.newBoss({ level: 2, rand: rng(3), fx: {}, noFx: true, boss: 6 }); ok(st.boss.trait === 'snel', 'gekozen baas'); st.coins = 999; const hp0 = st.boss.hp; ok(B.buy(st, 'bom') && st.boss.hp < hp0 - 300, 'bom'); st.boss.atkT = 1; ok(B.buy(st, 'vries') && st.boss.atkT > 6, 'vriezer');
    const kr = B.newBoss({ level: 2, rand: rng(3), fx: {}, noFx: true, boss: 9 }); kr.rand = () => 0.99; const h1 = kr.boss.hp; B.playerAnswer(kr, true, 9999); const dn = h1 - kr.boss.hp; const kr2 = B.newBoss({ level: 2, rand: rng(3), fx: {}, noFx: true, boss: 0 }); kr2.rand = () => 0.99; const g1 = kr2.boss.hp; B.playerAnswer(kr2, true, 9999); ok(dn < (g1 - kr2.boss.hp) * 0.9, 'krab heeft harnas'); kr.weak.active = 5; const h2 = kr.boss.hp; B.playerAnswer(kr, true, 9999); ok(h2 - kr.boss.hp > dn * 2, 'zwakke plek omzeilt harnas');
    const ru = B.newBoss({ level: 2, rand: rng(5), fx: {}, noFx: true, rush: true }); ok(ru.bossTotal === 3 && ru.boss.max < 3000, 'rush: 3 kortere bazen'); const first = ru.boss.name; ru.boss.hp = 1; B.playerAnswer(ru, true, 9999); ok(ru.phase === 'fight' && ru.bossNo === 2 && ru.boss.name !== first, 'rush: volgende baas'); ru.boss.hp = 1; B.playerAnswer(ru, true, 9999); ru.boss.hp = 1; B.playerAnswer(ru, true, 9999); ok(ru.phase === 'won' && ru.bossNo === 3, 'rush: na 3 bazen gewonnen'); }
  // rush-balans met bot
  { let w = 0; for (let s = 0; s < 20; s++) { const r = rng(900 + s), st = B.newBoss({ level: 2, rand: r, fx: {}, noFx: true, rush: true }); let t = 0, nextA = 6; while (st.phase === 'fight' && t < 900) { t += 0.05; B.step(st, 0.05); if (t >= nextA) { nextA += 6 * (0.8 + r() * 0.4); B.playerAnswer(st, r() < 0.8, 6000); B.autoBuy(st); } } if (st.phase === 'won') w++; ok(st.phase !== 'fight', 'rush eindigt'); } console.log('baas-rush bot 80%/6s wint', w + '/20'); ok(w >= 5, 'baas-rush haalbaar (' + w + ')'); }
  // ---- race: voertuigen + tijdrit
  const R = await import('../docs/learn/games/race.js');
  ok(R.VEHICLES.length === 5 && R.VEHICLES.every((v) => v.icon), 'race: 5 voertuigen');
  { const base = R.newRace({ level: 2, rand: rng(1), fx: {}, noFx: true }), tr = R.newRace({ level: 2, rand: rng(1), fx: {}, noFx: true, vehicle: 'tractor' }); ok(R.gasPower(tr) > R.gasPower(base) * 1.4 && R.baseSpeed(tr) < R.baseSpeed(base), 'tractor: meer gas, minder snelheid');
    const tri = R.newRace({ level: 2, rand: rng(2), fx: {}, noFx: true, trial: true }); ok(tri.cars.length === 2 && tri.races === 1 && tri.track === R.TRIAL_TRACK, 'tijdrit-opzet'); R.startRace(tri); let t = 0; while (tri.phase !== 'between' && tri.phase !== 'gameover' && t < 400) { t += 0.05; R.step(tri, 0.05); if (tri.phase === 'race' && Math.floor(t * 20) % 80 === 0) R.answer(tri, true, 3000); } ok(tri.phase === 'gameover', 'tijdrit eindigt als 1 race'); ok(tri.cars[0].fin != null || tri.t >= R.MAX_T, 'tijdrit heeft een tijd');
    const ft = R.newRace({ level: 2, rand: rng(2), fx: {}, noFx: true, vehicle: 'foodtruck' }); R.startRace(ft); ft.phase = 'race'; const c0 = ft.coins; R.answer(ft, true, 9999); const c1 = ft.coins - c0; const nr = R.newRace({ level: 2, rand: rng(2), fx: {}, noFx: true }); R.startRace(nr); nr.phase = 'race'; R.answer(nr, true, 9999); ok(c1 > nr.coins, 'frietwagen verdient meer'); }
  // ---- vissen: 21 soorten, radar/lamp, toernooi
  const V = await import('../docs/learn/games/vissen.js');
  ok(V.SPECIES === 21 && V.FISH.every((f) => f.emoji), 'vissen: 21 soorten'); ok(V.UPG.length === 7, 'vissen: 7 upgrades');
  { const st = V.newFishing({ rand: rng(4), fx: {} }); st.up.radar = 2; ok(V.goldenEvery(st) === 3, 'radar: gouden haak sneller'); const a = V.fishValue(st, { value: 100, zone: 2 }, 0); st.up.lamp = 2; ok(V.fishValue(st, { value: 100, zone: 2 }, 0) > a * 1.2 && V.fishValue(st, { value: 100, zone: 0 }, 0) < V.fishValue(st, { value: 100, zone: 2 }, 0), 'dieptelamp alleen diep');
    const tn = V.newFishing({ rand: rng(5), fx: {}, tournament: true }); ok(tn.market.next === 10, 'toernooi: snelle eerste piek'); V.step(tn, 11); ok(tn.market.mult === 2 && tn.market.t <= 9, 'toernooi-piek');
    const seenF = new Set(); const z = V.newFishing({ rand: rng(6), fx: {} }); z.up.rod = 4; for (let zn = 0; zn < 4; zn++) { z.zone = zn; for (let i = 0; i < 600; i++) seenF.add(V.rollFish(z).id); } ok(['eend', 'schelp', 'kwal', 'meermin', 'kroon'].every((id) => seenF.has(id)), 'nieuwe vissen komen voor'); }
  // ---- vlag: 9 winkelitems, blitz, lokeend/teleport/robot
  const F = await import('../docs/learn/games/vlag.js');
  ok(F.SHOP.length === 9 && F.SHOP.every((u) => u.icon), 'vlag: 9 items');
  { const st = F.newFlag({ level: 2, rand: rng(8), fx: {}, noFx: true }); st.coins = 9999; ok(F.buy(st, 'tele') && st.me.r === 5 && st.me.c === 4, 'teleport'); const b0 = st.bank; ok(F.buy(st, 'sprint') && st.bank === b0 + 4, 'sprint'); ok(F.buy(st, 'decoy') && st.decoyT === 8, 'lokeend'); const n0 = st.agents.length; ok(F.buy(st, 'robot') && st.agents.length === n0 + 1 && !F.buy(st, 'robot'), 'robotwacht 1x');
    for (let i = 0; i < 100; i++) F.step(st, 0.1); ok(st.agents.filter((a) => a.role === 'guard').every((a) => a.r <= 4), 'wachters blijven in hun helft');
    const bl = F.newFlag({ level: 2, rand: rng(9), fx: {}, noFx: true, blitz: true }); bl.limit = F.BLITZ_LIMIT; bl.caps.blue = 3; F.step(bl, 0.1); ok(bl.phase === 'play', 'blitz: niet klaar bij 3 vlaggen'); bl.t = F.BLITZ_LIMIT + 1; F.step(bl, 0.1); ok(bl.phase === 'won', 'blitz: einde op tijd'); }
}
if (fails) { console.error(fails + ' fout(en)'); process.exit(1); } else console.log('ALLES OK (spellen-a)');
