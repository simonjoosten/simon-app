// Test voor docs/learn/games/{slang,boerderij,vlieg,schat,escape,miljonair}.js (SPELLEN-C)
// 1. pure spellogica + bot-simulaties (progressie, eerste beloning < 30 s, nooit vast)
// 2. rooktest met nep-DOM en handmatige klok: monkey-klikken, kleine kits, opruimen (geen timers/rAF over)
import { install, advance, pending, clock, mkEnv, findAll, visible, El } from './learn-stubs/dom-mock-c.mjs';
install();
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.error('FOUT:', m); } };
const section = (n) => console.log('--', n);
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---- monkey-rooktest ----
async function smoke(mod, o = {}) {
  const id = mod.default.id; const host = new El('div'); const env = mkEnv(o.env || {});
  let inst, threw = null;
  const errs = []; const oe = console.error; console.error = (...a) => { errs.push(a.join(' ')); };
  try {
    inst = mod.default.create(host, env);
    const rand = rng(11); const total = o.seconds || 400;
    for (let t = 0; t < total * 1000 && env.ends.length === 0; t += 250) {
      await advance(250);
      const bs = findAll(host, e => e.tagName === 'BUTTON' && !e.disabled && visible(e) && !(o.avoid && o.avoid.test(e.textContent)));
      if (o.keys) { const k = o.keys[Math.floor(rand() * o.keys.length)]; document.keydown(k); }
      const pref = bs.filter(b => /beginnen|volgend|verder|start|afronden|door/i.test(b.textContent));
      const pool = pref.length && rand() < .8 ? pref : bs;
      if (pool.length) pool[Math.floor(rand() * pool.length)].click();
      if (o.extra) o.extra(host, rand);
    }
  } catch (e) { threw = e; }
  console.error = oe;
  ok(!threw, id + ': smoke gooide ' + (threw && threw.stack));
  ok(errs.length === 0, id + ': console.error tijdens smoke: ' + errs.slice(0, 2).join(' | '));
  try { inst && inst.destroy(); } catch (e) { ok(false, id + ': destroy gooide ' + e.message); }
  await advance(500);
  ok(pending() === 0, id + ': na destroy nog ' + pending() + ' timers/rAF over');
  ok(env.ends.length <= 1, id + ': end meer dan 1x aangeroepen');
  return { env, ended: env.ends.length === 1, end: env.ends[0] };
}
const tiny = { qs: [{ t: 'tf', q: 'Water is nat', a: true }, { t: 'mc', q: '1+1', a: '2', o: ['1', '2', '3', '4'] }] };

// ================= SLANG =================
{
  section('slang');
  const mod = await import('../docs/learn/games/slang.js'); const { SnakeGame, LEVELS, SHOP } = mod;
  ok(mod.default.id === 'slang' && typeof mod.default.create === 'function', 'slang: default export');
  function bot(g, p, rand) {
    const h = g.snake[0]; const tgt = g.gate || g.apple; const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let best = null, bd = 1e9;
    for (const [dx, dy] of opts) {
      if (dx === -g.dir.x && dy === -g.dir.y) continue;
      let x = h.x + dx, y = h.y + dy; if (g.wrap) { x = (x + g.cols) % g.cols; y = (y + g.rows) % g.rows; } else if (x < 0 || y < 0 || x >= g.cols || y >= g.rows) continue;
      if (g.hit(x, y, true)) continue;
      let d = Math.abs(x - tgt.x) + Math.abs(y - tgt.y); if (g.wrap) { d = Math.min(Math.abs(x - tgt.x), g.cols - Math.abs(x - tgt.x)) + Math.min(Math.abs(y - tgt.y), g.rows - Math.abs(y - tgt.y)); }
      d += rand() * .5; if (d < bd) { bd = d; best = [dx, dy]; }
    }
    if (best) g.setDir(...best);
  }
  function run(p, seed, diff = 2) {
    const rand = rng(seed); const g = new SnakeGame({ rand, fx: {}, level: diff }); let ticks = 0, first = null, ms = 0;
    while (g.state !== 'won' && g.state !== 'over' && ticks < 30000) {
      if (g.state === 'play') { bot(g, p, rand); const ev = g.step(); ticks++; ms += g.tickMs(); if (first === null && g.score > 0) first = ms; for (const e of ev) if (e && e.e === 'gate') { g.answer(rand() < p); } }
      else if (g.state === 'shop') { for (const it of g.offers()) while (g.buy(it.id)) { if (it.id === 'heart') break; } g.nextLevel(); }
      else break;
    }
    return { g, ticks, first, ms };
  }
  let wins = 0, over = 0, firsts = [];
  for (let s = 1; s <= 30; s++) { const r = run(0.8, s); if (r.g.state === 'won') wins++; if (r.g.state === 'over') over++; firsts.push(r.first); ok(r.ticks < 30000, 'slang: bot kwam vast (seed ' + s + ')'); ok(r.first !== null && r.first < 30000, 'slang: eerste beloning te laat'); }
  ok(wins >= 12, 'slang: te zwaar, bot wint maar ' + wins + '/30'); console.log('   slang bot p=.8: gewonnen ' + wins + '/30, dood ' + over);
  const r2 = run(0.3, 5); ok(r2.ticks < 30000, 'slang: slechte speler loopt vast');
  const easy = run(0.8, 3, 1), hard = run(0.8, 3, 3); ok(easy.g.tickMs() >= hard.g.tickMs(), 'slang: moeilijkheid tempo');
  const g = new SnakeGame({ rand: rng(1), fx: { extraLives: 2, startCash: 100, shield: 1 }, level: 2 }); ok(g.lives === 5 && g.gems === 20 && g.shield === 1, 'slang: fx toegepast');
  g.gems = 100; ok(g.buy('slow') && g.up.slow === 1 && g.gems < 100, 'slang: kopen'); g.gems = 0; ok(!g.buy('slow'), 'slang: te weinig gems');
  ok(SHOP.length >= 6 && LEVELS.length === 5, 'slang: shop/levels');
  const sm = await smoke(mod, { keys: ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'], seconds: 500 }); console.log('   slang smoke ended=' + sm.ended);
  const sm2 = await smoke(mod, { env: tiny, seconds: 120, keys: ['ArrowLeft', 'ArrowUp'] });
}
// ================= BOERDERIJ =================
{
  section('boerderij');
  const mod = await import('../docs/learn/games/boerderij.js'); const { Farm, CROPS, ANIMALS, UPS, SEASON, TARGET } = mod;
  ok(mod.default.id === 'boerderij', 'boerderij: id');
  // bot: menselijk tempo (1 actie per 0,8 s), kiest beste gewas, koopt slim
  function play(p, seed, level = 2, apm = 3) {
    const rand = rng(seed); const f = new Farm({ rand, fx: {}, level }); let t = 0, firstSale = null, stuck = 0, lastEarn = 0, maxIdle = 0, idle = 0;
    while (t < SEASON) {
      let acted = false;
      const ripe = f.plots.findIndex((x, i) => f.ripe(i));
      if (ripe >= 0 && f.up.tractor < 2) { f.harvest(ripe); acted = true; }
      else if (f.orders.some(o => f.barn[o.item] >= o.n)) { f.deliver(f.orders.findIndex(o => f.barn[o.item] >= o.n)); acted = true; }
      else if (f.barnValue() >= (t < 30 ? 6 : 10 + f.level * 15) || (f.barnValue() > 0 && t % 40 < 1)) { const ok2 = rand() < p; f.sell(ok2 ? 2 : 1); if (firstSale === null) firstSale = t; acted = true; }
      else if (f.wet <= 0 && f.plots.some(x => x.crop) && (t % 5 < 1)) { f.water(); acted = true; }
      else if (f.animals.length && f.hungry()) { f.feed(); acted = true; }
      else { const e = f.plots.findIndex(x => !x.crop); if (e >= 0) { let best = CROPS[0]; CROPS.forEach(c => { if (f.unlocked(c.id) && c.price / c.grow > best.price / best.grow * 0.9 && c.seed <= f.coins) best = c; }); if (f.plant(e, best.id)) acted = true; else if (f.plant(e, 'wortel')) acted = true; } }
      if (!acted) { for (const a of ['kip', 'koe', 'schaap']) if (f.animals.filter(x => x.type === a).length < (a === 'kip' ? 2 : 1) && f.buyAnimal(a)) { acted = true; break; } }
      if (!acted && f.plots.length < 8 && f.buyPlot()) acted = true;
      if (!acted) for (const u of ['markt', 'tractor', 'can', 'voer']) if (f.up[u] < 2 && f.buyUp(u)) { acted = true; break; }
      if (!acted && f.plots.length < 12 && f.coins > 400 && f.buyPlot()) acted = true;
      if (!acted) for (const a of ['kip', 'koe', 'schaap']) if (f.buyAnimal(a)) { acted = true; break; }
      if (f.earned === lastEarn) { idle += apm; maxIdle = Math.max(maxIdle, idle); } else { idle = 0; lastEarn = f.earned; }
      const step = acted ? apm : 1; f.tick(step); t += step;
    }
    return { f, firstSale, maxIdle };
  }
  ok(CROPS[0].grow <= 10 && CROPS[0].seed <= 18, 'boerderij: eerste oogst/beloning < 30 s');
  const res = [];
  for (let s = 1; s <= 20; s++) { const r = play(0.8, s); res.push(r.f.earned); ok(r.firstSale !== null && r.firstSale < 90, 'boerderij: eerste verkoop te laat ' + r.firstSale); ok(r.maxIdle < 120, 'boerderij: bot zat vast zonder inkomen ' + r.maxIdle); }
  const avg = res.reduce((a, b) => a + b, 0) / res.length; console.log('   boerderij bot p=.8: gem. verdiend ' + Math.round(avg) + ', min ' + Math.min(...res) + ', max ' + Math.max(...res) + ' (doelen ' + JSON.stringify(TARGET) + ')');
  ok(avg > TARGET[2] * 1.2 && avg < TARGET[2] * 4, 'boerderij: balans normaal (gem ' + Math.round(avg) + ')');
  ok(Math.min(...res) > TARGET[1], 'boerderij: makkelijk haalbaar');
  const f = new Farm({ rand: rng(1), fx: { startCash: 20, cashMult: 1.5 } }); ok(f.coins === 38, 'boerderij: startCash'); f.barn.wortel = 10; ok(f.sell(1) === Math.round(60 * 1.5), 'boerderij: cashMult verkoop');
  ok(!f.plant(0, 'meloen'), 'boerderij: vergrendeld gewas'); ok(f.plant(0, 'wortel') && !f.plant(0, 'wortel'), 'boerderij: planten'); f.tick(8); ok(f.harvest(0), 'boerderij: oogst');
  const sm = await smoke(mod, { seconds: 2000 }); ok(sm.ended && sm.end.score >= 0, 'boerderij: seizoen eindigt'); console.log('   boerderij smoke score=' + (sm.end && sm.end.score) + ' win=' + (sm.end && sm.end.win));
  await smoke(mod, { env: tiny, seconds: 60 });
}
// ================= VLIEG =================
{
  section('vlieg');
  const mod = await import('../docs/learn/games/vlieg.js'); const { Flight, STAGES, HANGAR } = mod;
  ok(mod.default.id === 'vlieg', 'vlieg: id');
  function fly(p, seed, diff = 2, skill = 0.9) {
    const rand = rng(seed); const g = new Flight({ rand, fx: {}, level: diff }); let t = 0, first = null, n = 0;
    while (g.state !== 'won' && g.state !== 'over' && n++ < 200000) {
      if (g.state === 'play') {
        // bot: kijk 150 units vooruit; ontwijk, verkies sterren
        const near = g.items.filter(i => i.kind !== 'gate' && !i.hit && !i.got && i.x - g.d > -10 && i.x - g.d < 150);
        const bad = new Set(near.filter(i => i.kind === 'ob').map(i => i.lane)); const coin = near.find(i => i.kind === 'coin' && !bad.has(i.lane));
        if (rand() < skill) { let want = g.lane; if (bad.has(g.lane)) { const opts = [0, 1, 2].filter(l => !bad.has(l)); want = opts.sort((a, b) => Math.abs(a - g.lane) - Math.abs(b - g.lane))[0]; } else if (coin) want = coin.lane; if (want !== g.lane) g.move(Math.sign(want - g.lane)); }
        const ev = g.update(1 / 30); t += 1 / 30; if (first === null && g.score > 0) first = t;
        for (const e of ev) if (e && e.e === 'gate') g.answer(rand() < p);
      } else if (g.state === 'hangar') { for (const h of g.offers()) { while (g.buy(h.id) && h.id !== 'heart' && h.id !== 'shield') {} } g.nextStage(); }
      else break;
    }
    return { g, t, first, n };
  }
  let wins = 0, tsum = 0; const N = 24;
  for (let s = 1; s <= N; s++) { const r = fly(0.8, s); if (r.g.state === 'won') wins++; tsum += r.t; ok(r.n < 200000, 'vlieg: bot vast'); ok(r.first !== null && r.first < 20, 'vlieg: eerste beloning te laat ' + r.first); }
  console.log('   vlieg bot p=.8: gewonnen ' + wins + '/' + N + ', gem. vliegtijd ' + Math.round(tsum / N) + ' s'); ok(wins >= N * 0.45, 'vlieg: te zwaar'); ok(tsum / N > 70 && tsum / N < 300, 'vlieg: duur ' + tsum / N);
  const bad = fly(0.1, 3, 3, 0.5); ok(bad.g.state === 'over', 'vlieg: slechte speler gaat dood'); ok(bad.n < 200000, 'vlieg: slecht loopt vast');
  const g = new Flight({ rand: rng(1), fx: { extraLives: 1, startCash: 50, shield: 1 }, level: 2 }); ok(g.lives === 4 && g.stars === 10 && g.shield === 1, 'vlieg: fx');
  // elke rij laat minstens 1 vrije baan
  for (let i = 0; i < 5; i++) { const f = new Flight({ rand: rng(i + 9) }); f.startStage(i); const rows = {}; f.items.filter(x => x.kind === 'ob').forEach(x => { (rows[Math.round(x.x)] = rows[Math.round(x.x)] || new Set()).add(x.lane); }); ok(Object.values(rows).every(s => s.size < 3), 'vlieg: rij dicht in stage ' + i); }
  const sm = await smoke(mod, { seconds: 900, keys: ['ArrowUp', 'ArrowDown'] }); console.log('   vlieg smoke ended=' + sm.ended);
  await smoke(mod, { env: tiny, seconds: 80, keys: ['ArrowUp'] });
}
// ================= SCHAT =================
{
  section('schat');
  const mod = await import('../docs/learn/games/schat.js'); const { Dig, DEPTHS, SHOP } = mod;
  ok(mod.default.id === 'schat', 'schat: id');
  function dive(p, seed, diff = 2) {
    const rand = rng(seed); const g = new Dig({ rand, fx: {}, level: diff }); let qs = 0, steps = 0, firstGold = null, pending = null;
    while (g.state === 'play' && steps++ < 5000) {
      for (const it of [SHOP[4], SHOP[0], SHOP[1], SHOP[2]]) if (g.canBuy(it) && g.gold > 70) g.buy(it.id);
      if (g.maps > 0 || (g.gold >= 110 && g.maps === 0 && rand() < .2)) { if (g.gold >= 110 && g.maps === 0) g.buy('map'); g.useMap(); }
      const un = g.tiles.map((t, i) => i).filter(i => !g.tiles[i].open);
      let pick;
      if (g.mapShown && !g.tiles[g.exit].open) pick = g.exit;
      else { let best = -1, bs = -1; for (const i of un) { const sc = g.nb(i).reduce((a, j) => a + (g.tiles[j].open && g.tiles[j].kind === 'dirt' ? g.hint(j).gold : 0), 0) + rand(); if (sc > bs) { bs = sc; best = i; } } pick = best; }
      const cost = g.costOf(pick);
      if (g.energy < cost) { qs++; g.recharge(rand() < p); continue; }
      const r = g.dig(pick); if (firstGold === null && g.total > 0) firstGold = g.digs;
      if (r.r === 'chest') { qs++; g.chest(pick, rand() < p); } else if (r.r === 'trap') { qs++; g.trap(pick, rand() < p); } else if (r.r === 'ladder') g.descend();
      if (g.energy < 2 && rand() < .3) { qs++; g.recharge(rand() < p); }
    }
    return { g, qs, steps, firstGold };
  }
  let wins = 0, over = 0, qsum = 0, dsum = 0; const N = 40;
  for (let s = 1; s <= N; s++) { const r = dive(0.8, s); if (r.g.state === 'won') wins++; if (r.g.state === 'over') over++; qsum += r.qs; dsum += r.g.digs; ok(r.steps < 5000, 'schat: bot vast ' + s); ok(r.firstGold !== null && r.firstGold <= 3, 'schat: eerste beloning pas na ' + r.firstGold + ' digs'); }
  console.log('   schat bot p=.8: gewonnen ' + wins + '/' + N + ', dood ' + over + ', gem. vragen ' + Math.round(qsum / N) + ', gem. digs ' + Math.round(dsum / N)); ok(wins >= N * 0.5, 'schat: te zwaar'); ok(qsum / N > 12 && qsum / N < 45, 'schat: aantal vragen ' + qsum / N);
  const b = dive(0.0, 4); ok(b.steps < 5000, 'schat: nooit-goed loopt vast'); 
  const g = new Dig({ rand: rng(2), fx: { startCash: 30, shield: 1, extraLives: 1 } }); ok(g.energy === 11 && g.helm === 1 && g.hearts === 4, 'schat: fx');
  const g2 = new Dig({ rand: rng(3) }); g2.energy = 0; ok(g2.dig(0).r === 'noenergy', 'schat: geen energie'); ok(g2.recharge(true) >= 5, 'schat: opladen werkt altijd');
  const sm = await smoke(mod, { seconds: 900 }); console.log('   schat smoke ended=' + sm.ended);
  await smoke(mod, { env: tiny, seconds: 100 });
}
// ================= ESCAPE =================
{
  section('escape');
  const mod = await import('../docs/learn/games/escape.js'); const { EscapeRun, ROOMS, PERKS, POS } = mod;
  ok(mod.default.id === 'escape', 'escape: id'); ok(ROOMS.length === 5, 'escape: 5 kamers');
  function escape(p, seed, useHint = false) {
    const rand = rng(seed); const g = new EscapeRun({ rand, fx: {}, level: 2 }); let qs = 0, steps = 0, firstReward = null;
    while (g.state !== 'won' && steps++ < 4000) {
      if (g.state === 'perk') { g.pickPerk(g.offers()[0].id); continue; }
      const open = g.spots.map((s, i) => i).filter(i => !g.spots[i].done);
      const need = g.spots.map((s, i) => i).filter(i => !g.spots[i].done && (g.spots[i].role === 'digit' || g.spots[i].role === 'key'));
      if (!need.length) { // alle sloten open: code invoeren
        const r = g.enterCode(g.code.join('')); if (!g.codeOk) { ok(false, 'escape: code onjuist'); break; } const d = g.tryDoor(); if (d && firstReward === null) firstReward = 1; continue; }
      let i;
      if (useHint && g.hints > 0) { i = g.hint().spot; } else i = open[Math.floor(rand() * open.length)];
      const r = g.examine(i); if (r.r === 'locked') { qs++; g.solve(i, rand() < p); }
    }
    return { g, qs, steps };
  }
  let qsum = 0, N = 30, solved = 0;
  for (let s = 1; s <= N; s++) { const r = escape(0.8, s); if (r.g.state === 'won') solved++; qsum += r.qs; ok(r.steps < 4000, 'escape: bot vast (seed ' + s + ')'); }
  console.log('   escape bot p=.8: ontsnapt ' + solved + '/' + N + ', gem. vragen ' + Math.round(qsum / N)); ok(solved === N, 'escape: altijd te winnen'); ok(qsum / N > 18 && qsum / N < 60, 'escape: vragen ' + qsum / N);
  const low = escape(0.05, 4); ok(low.g.state === 'won', 'escape: ook met bijna alles fout oplosbaar');
  const g = new EscapeRun({ rand: rng(3), fx: { hints: 2 }, level: 2 }); ok(g.hints === 4, 'escape: fx hints'); g.pickPerk; const h = g.hint(); ok(h && g.spots[h.spot].role === 'digit', 'escape: hint wijst naar slot'); 
  const g3 = new EscapeRun({ rand: rng(5), level: 2 }); g3.perks = { digit: 1, lock: 1 }; g3.startRoom(0); ok(g3.shown.filter(Boolean).length === 1 && g3.free === 1, 'escape: perks'); 
  ok(POS.length === 8, 'escape: posities');
  const sm = await smoke(mod, { seconds: 2500, extra: (host) => {
    const dg = findAll(host, e => e.className.includes('les-dg')); if (dg.length < 4) return;
    const digits = dg.slice(0, 3).map(e => e.textContent); if (!(digits.every(d => /\d/.test(d)) && dg[3].textContent === '🗝')) return;
    const door = findAll(host, e => e.className.includes('les-door'))[0]; if (!door) return; door.click();
    const bs = findAll(host, e => e.tagName === 'BUTTON' && visible(e)); for (const d of digits) { const b = bs.find(x => x.textContent === d && x.className.includes('alt')); if (b) b.click(); } const okb = bs.find(x => x.textContent === 'OK'); if (okb) okb.click(); } });
  console.log('   escape smoke ended=' + sm.ended); ok(sm.ended && sm.end.win, 'escape: UI-run ontsnapt niet');
  await smoke(mod, { env: tiny, seconds: 100 });
}
// ================= MILJONAIR =================
{
  section('miljonair');
  const mod = await import('../docs/learn/games/miljonair.js'); const { Show, LADDER, SAFE, safeFloor, bankAfter, optionsOf, toMc, fiftyQ, crowdPct, friendSays, FRIENDS } = mod;
  ok(mod.default.id === 'miljonair', 'miljonair: id'); ok(LADDER.length === 15 && LADDER[14] === 1000000, 'miljonair: ladder');
  ok(safeFloor(3) === 0 && safeFloor(5) === 1000 && safeFloor(10) === 32000 && safeFloor(12) === 32000, 'miljonair: veilige trappen'); ok(bankAfter(0) === 0 && bankAfter(15) === 1000000, 'miljonair: bank');
  const r = rng(5); const mc = { t: 'mc', q: 'x', a: 'B', o: ['A', 'B', 'C', 'D'] };
  for (let i = 0; i < 40; i++) { const f = fiftyQ(mc, r, []); ok(f && f.o.length === 2 && f.o.includes('B'), 'miljonair: 50/50 behoudt antwoord'); }
  ok(fiftyQ({ t: 'tf', q: 'x', a: true }, r, []) === null, 'miljonair: tf geen 50/50'); ok(fiftyQ({ t: 'order', q: 'x', a: ['1', '2'] }, r, []) === null, 'miljonair: order geen 50/50');
  const num = toMc({ t: 'num', q: '6x7', a: 42 }, [], r); ok(num && num.o.length === 4 && num.o.includes('42') && new Set(num.o).size === 4, 'miljonair: num -> mc');
  const pool = [{ t: 'type', a: 'Rome' }, { t: 'type', a: 'Parijs' }, { t: 'type', a: 'Madrid' }, { t: 'type', a: 'Berlijn' }]; const ty = toMc({ t: 'type', q: 'Hoofdstad NL?', a: 'Amsterdam' }, pool, r); ok(ty && ty.o.includes('Amsterdam') && ty.o.length === 4, 'miljonair: type -> mc'); ok(toMc({ t: 'type', q: 'x', a: 'a' }, [], r) === null, 'miljonair: te kleine pool');
  for (let i = 0; i < 30; i++) { const p = crowdPct(4, 2, 0.7, r); ok(p.reduce((a, b) => a + b, 0) === 100 && p.length === 4, 'miljonair: publiek optelling'); }
  let hit = 0; for (let i = 0; i < 400; i++) { const s = friendSays(mc, FRIENDS[0], 2, 2, r); if (s.idx === 1) hit++; } ok(hit > 300 && hit < 400, 'miljonair: vriend ~ nauwkeurigheid (' + hit + ')');
  // bot: speelt de ladder met kans p per vraag, stopt bij 'risico' volgens strategie
  function show(p, seed, stopAt = 99) { const rr = rng(seed); const g = new Show({ rand: rr, level: 2 }); let qs = 0; while (g.state === 'play') { if (g.step >= stopAt) { g.stop(); break; } qs++; const pp = p - g.step * 0.015 + (g.life.fifty && g.step > 6 && g.use('fifty') ? 0.15 : 0); if (rr() < pp) g.correct(); else g.wrong(); if (qs > 100) ok(false, 'miljonair: oneindig'); } return g; }
  let w = 0, sum = 0; const N = 400; for (let s = 1; s <= N; s++) { const g = show(0.93, s); if (g.state === 'won') w++; sum += g.result(); }
  console.log('   miljonair bot p=.93: miljonair ' + w + '/' + N + ', gem. ' + Math.round(sum / N)); ok(w > 0 && w < N * .5, 'miljonair: balans top'); ok(sum / N > 5000, 'miljonair: gem. te laag');
  const bad = show(0.3, 2); ok(bad.state === 'lost' && bad.result() === safeFloor(bad.step), 'miljonair: fout valt terug');
  ok(show(0.99, 7, 10).result() === 32000 || show(0.99, 7, 10).state === 'lost', 'miljonair: stoppen');
  const sm = await smoke(mod, { seconds: 600 }); console.log('   miljonair smoke ended=' + sm.ended + ' score=' + (sm.end && sm.end.score)); ok(sm.ended, 'miljonair: UI eindigt');
  await smoke(mod, { env: tiny, seconds: 200 });
  await smoke(mod, { env: { answer: () => ({ ok: true }) }, seconds: 1500, avoid: /Stop|50\/50|Bel|Publiek/ }).then(x => { ok(x.ended && x.end.win === true && x.end.score === 1000000, 'miljonair: alles goed = 1M (' + JSON.stringify(x.end && x.end.score) + ')'); });
}
//@NEXT
console.log(fails ? '\n' + fails + ' FOUTEN' : '\nAlles OK');
process.exit(fails ? 1 : 0);
