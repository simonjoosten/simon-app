// Tests voor docs/learn/games/{pizza,monster,regen,memory,ruimte,bom}.js (SPELLEN-B). Draaien: node tools/test-learn-spellenb.mjs   (optioneel --sim voor het balansoverzicht)
//   1. pure logica per spel (economie, upgrades, ronde-einde)
//   2. balans-bots: eerste beloning < 30 s, nooit vast, winkans redelijk, lage score blijft spelbaar
//   3. rooktest: elk spel in een nep-DOM met nep-timers en een nep-env.ask: begint, speelt, env.end precies 1x, destroy ruimt alles op
import * as P from '../docs/learn/games/pizza.js';
import * as M from '../docs/learn/games/monster.js';
import * as R from '../docs/learn/games/regen.js';
import * as G from '../docs/learn/games/memory.js';
import * as U from '../docs/learn/games/ruimte.js';
import * as B from '../docs/learn/games/bom.js';

const VERBOSE = process.argv.includes('--sim');
let pass = 0, fail = 0;
async function t(name, fn) { try { await fn(); pass++; if (VERBOSE) console.log('  ok  ', name); } catch (e) { fail++; console.log('  FOUT', name, '\n      ', (e && e.stack) || e); } }
const ok = (c, m) => { if (!c) throw new Error(m || 'onwaar'); };
const eq = (a, b, m) => { if (a !== b) throw new Error(`${m || 'ongelijk'}: ${a} !== ${b}`); };
function mul(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const frac = (n, d) => n / d;
function info(...a) { if (VERBOSE) console.log('     ', ...a); }

/* ---------- 1. contract ---------- */
for (const [id, mod] of [['pizza', P], ['monster', M], ['regen', R], ['memory', G], ['ruimte', U], ['bom', B]]) {
  await t(`${id}: default export volgt het contract`, () => {
    const g = mod.default;
    eq(g.id, id); ok(g.name && g.emoji && /^#[0-9a-f]{6}$/i.test(g.color), 'naam/emoji/kleur'); ok(g.desc && Array.isArray(g.tags) && g.tags.length, 'desc/tags');
    ok(typeof g.minutes === 'number' && typeof g.duo === 'boolean' && typeof g.create === 'function');
  });
}

/* ---------- 2. pure logica ---------- */
await t('pizza: kosten, kopen, bezorgen, klant verdwijnt', () => {
  const m = P.createPizza({ level: 2, rand: mul(1) });
  m.tick(0.5); ok(m.S.custs.length === 1, 'eerste klant meteen');
  const c = m.S.custs[0]; eq(c.need, 1, 'eerste pizza is klein');
  const ev = m.answer(c.id, true); ok(ev.some(e => e.type === 'sale' && e.pay > 0), 'verkocht');
  ok(m.S.coins > 0 && m.S.served === 1);
  eq(m.cost('oven'), 35); ok(!m.buy('oven') || m.S.coins >= 35);
  m.S.coins = 1000; ok(m.buy('oven')); eq(m.S.up.oven, 1); eq(m.S.coins, 965); eq(m.cost('oven'), 80);
  for (let i = 0; i < 6; i++) m.S.coins = 9999, m.buy('oven'); eq(m.cost('oven'), null, 'maximum'); ok(!m.buy('oven'));
  const m2 = P.createPizza({ rand: mul(2) }); m2.tick(0.5); const c2 = m2.S.custs[0]; const ev2 = m2.tick(c2.pat + 1); ok(ev2.some(e => e.type === 'left')); eq(m2.S.lost, 1);
  const m3 = P.createPizza({ rand: mul(3), fx: { startCash: 50 } }); eq(m3.S.coins, 50, 'startCash');
  ok(P.createPizza({ level: 2 }).answer(999, true) === null, 'onbekende klant');
});
await t('monster: gevecht, levelup, flauwvallen, winkel', () => {
  const m = M.createMonster({ level: 2, rand: mul(5) });
  m.start(M.MONSTERS[0]); let ev = m.answer(true); ev = ev.concat(m.answer(true)); ok(ev.some(e => e.type === 'win'), 'slijmbal verslagen in 2 slagen');
  ok(m.S.gold >= 8 && m.S.xp > 0 && m.S.fight === null);
  const m2 = M.createMonster({ level: 2, rand: mul(6) }); m2.S.gold = 200; m2.start(M.MONSTERS.find(x => x.boss)); m2.S.hp = 1;
  const e2 = m2.tick(100); ok(e2.some(e => e.type === 'faint'), 'flauwvallen'); eq(m2.S.hp, m2.maxHp()); eq(m2.S.gold, 150); ok(m2.S.fight === null);
  const m3 = M.createMonster({ rand: mul(7) }); m3.S.gold = 100; ok(m3.buyWeapon(1)); ok(!m3.buyWeapon(1), 'niet dubbel'); ok(!m3.buyWeapon(3), 'te duur'); ok(m3.buyArmor(1)); ok(m3.buyPotion());
  m3.S.hp = 5; ok(m3.heal()); ok(m3.S.hp > 5);
  const m4 = M.createMonster({ rand: mul(8), fx: { shield: 1 } }); m4.start(M.MONSTERS[3]); const hp = m4.S.hp; m4.answer(false); m4.answer(false); m4.answer(false); m4.answer(false); eq(m4.S.hp, hp, 'schild blokt eerste klap');
  const m5 = M.createMonster({ rand: mul(9) }); ok(m5.options().length === 3 && !m5.options().some(o => o.boss)); m5.S.lv = 5; ok(m5.options().some(o => o.boss), 'baas vanaf level 5');
});
await t('regen: wave, schade, item, winkel', () => {
  const m = R.createRain({ level: 2, rand: mul(11) }); m.tick(1.5); ok(m.rocks().length === 1);
  const r = m.target(); const y0 = r.y; m.answer(false); ok(r.y > y0); eq(m.S.combo, 0);
  m.answer(true); eq(m.rocks().length, 0); ok(m.S.coins > 0 && m.S.firstKill != null);
  const m2 = R.createRain({ rand: mul(12), fx: { shield: 1 } }); m2.tick(1.5); const l = m2.S.lives; let hit = null; for (let i = 0; i < 600 && !hit; i++) hit = m2.tick(0.1).find(e => e.type === 'hit' || e.type === 'blocked'); eq(hit.type, 'blocked', 'schild vangt eerste inslag'); eq(m2.S.lives, l); ok(m2.S.shield === 0);
  const m3 = R.createRain({ rand: mul(13) }); m3.S.coins = 500; const c0 = m3.cost('turret'); ok(m3.buy('turret')); ok(m3.cost('turret') > c0, 'prijs stijgt');
  m3.S.lives = m3.S.maxLives; ok(!m3.buy('life'), 'niet boven max'); m3.S.items.push({ id: 99, kind: 'heart', x: .5, y: .2, life: 5 }); m3.S.lives = 2; eq(m3.collect(99), 'heart'); eq(m3.S.lives, 3);
});
await t('memory: kaarten, paar, claim, zetten', () => {
  const m = G.createMemory({ level: 2, rand: mul(21) }); const S = m.S;
  eq(S.cards.length, 12); const prs = {}; S.cards.forEach(c => { prs[c.pair] = (prs[c.pair] || 0) + 1; }); ok(Object.values(prs).every(v => v === 2), 'elk paar 2x');
  const i = 0, j = S.cards.findIndex((c, k) => k !== 0 && c.pair === S.cards[0].pair);
  eq(m.flip(i).type, 'first'); eq(m.flip(j).type, 'match'); ok(m.flip(5) === null, 'geblokkeerd tijdens claim');
  const r = m.claim(true); eq(r[0].type, 'claimed'); eq(S.cards[i].state, 'done'); ok(S.coins > 0 && S.score > 0);
  const a = S.cards.findIndex(c => c.state === 'down'), b = S.cards.findIndex((c, k) => k !== a && c.state === 'down' && c.pair !== S.cards[a].pair);
  const mv = S.moves; m.flip(a); eq(m.flip(b).type, 'mismatch'); eq(S.moves, mv - 1); m.resolveMismatch(); eq(S.cards[a].state, 'down');
  S.coins = 100; const mv2 = S.moves; ok(m.use('moves')); eq(S.moves, mv2 + 4); ok(m.use('hint').idx.length === 2); ok(m.use('peek'));
  S.moves = 1; const x = S.cards.findIndex(c => c.state === 'down'), y = S.cards.findIndex((c, k) => k !== x && c.state === 'down' && c.pair !== S.cards[x].pair); m.flip(x); m.flip(y); const end = m.resolveMismatch(); eq(end.type, 'round-end'); eq(end.reason, 'moves');
  ok(m.nextRound()); eq(S.cards.length, 16); const spec = G.emojiSpecs(3, mul(1)); eq(spec.length, 3);
  const mt = G.createMemory({ rand: mul(5), fx: { hints: 2 } }); eq(mt.price('peek'), 0, 'gratis spiekje via fx.hints');
  const mp = G.createMemory({ rand: mul(5), makePairs: n => [{ a: { txt: '2+2', k: 'q' }, b: { txt: '4', k: 'a' }, q: { t: 'type', q: '2+2', a: '4' } }] }); eq(mp.S.cards.length, 12, 'aangevuld met plaatjes'); ok(mp.S.specs[0].q.a === '4');
});
await t('ruimte: tanken, turbo, asteroïde, landen, winkel', () => {
  const m = U.createSpace({ level: 2, rand: mul(31) }); const S = m.S;
  const f0 = S.fuel; m.tick(1); ok(S.fuel < f0, 'brandstof op'); ok(S.pos > 0);
  S.fuel = 50; m.answer(true); ok(S.fuel > 60); m.answer(true); m.answer(true); ok(S.turbo > 0, 'turbo na 3 goed'); m.answer(false); eq(S.turbo, 0);
  S.danger = 5; const ev = m.answer(true); ok(ev.some(e => e.type === 'dodge')); eq(S.danger, 0);
  S.danger = 5; const f1 = S.fuel; m.answer(false); ok(S.fuel < f1 - 10, 'inslag kost brandstof');
  S.shieldCh = 1; S.danger = 5; const f2 = S.fuel; m.answer(false); ok(S.fuel >= f2 - 0.01, 'schild blokt');
  S.fuel = 0; const sp = m.speed(); S.fuel = 10; ok(sp < m.speed() * 0.5, 'leeg = kruipen, nooit stilstaan'); ok(sp > 0);
  S.pos = m.dist() - 0.01; const lv = m.tick(1); ok(lv.some(e => e.type === 'land')); eq(S.phase, 'land'); eq(S.fuel, m.tank());
  S.crystals = 500; ok(m.buy('engine')); eq(S.up.engine, 1); ok(m.speed() > 8); m.depart(); eq(S.leg, 1); eq(S.phase, 'fly');
  S.leg = U.PLANETS.length - 1; S.pos = m.dist() - 0.01; m.tick(1); eq(S.phase, 'won');
});
await t('bom: ronde, ontploffing, schild, plaatsing', () => {
  const m = B.createBomb({ level: 2, rand: mul(41) }); const S = m.S;
  eq(S.players.length, 5); eq(S.holder, 0, 'jij begint ronde 1 met de bom'); ok(S.fuse >= 6);
  const ev = m.answer(true); ok(ev.some(e => e.type === 'good')); const p = m.passTo(2); ok(p.some(e => e.type === 'pass')); eq(S.holder, 2); eq(S.passes, 1);
  ok(m.passTo(1).length === 0, 'niet je beurt');
  let guard = 0, rend = null; while (!rend && guard++ < 50000) { const e = m.tick(0.1); rend = e.find(x => x.type === 'round-end') || null; if (S.holder === 0 && S.players[0].alive && S.phase === 'turn') { m.answer(true); const c = m.alive().filter(x => !x.you); m.passTo(c[0].id); } }
  ok(rend, 'ronde eindigt altijd'); ok(rend.place >= 1 && rend.place <= 5); eq(S.tally.length, 1); ok(S.score >= B.BOMB_POINTS[rend.place - 1]);
  const m2 = B.createBomb({ rand: mul(42), fx: { shield: 1 } }); m2.S.fuse = 0.05; m2.S.holder = 0; const e2 = m2.tick(0.1); const bm = e2.find(x => x.type === 'boom'); ok(bm && bm.shielded && m2.S.players[0].alive, 'schild redt');
  const m3 = B.createBomb({ rand: mul(43) }); m3.S.fuse = 0.05; m3.S.holder = 0; const e3 = m3.tick(0.1); ok(e3.find(x => x.type === 'boom').out && m3.youOut());
  const m4 = B.createBomb({ rand: mul(44) }); m4.S.holder = 0; const f = m4.S.fuse; m4.answer(false); ok(m4.S.fuse < f, 'fout verkort de lont');
});

/* ---------- 3. balans met bots ---------- */
const median = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
function pizzaRun(seed, acc, level, smartBuy) {
  const r = mul(seed), m = P.createPizza({ level, rand: r }); let next = 4.5, first = null; const dt = 0.1;
  while (!m.done()) {
    m.tick(dt); next -= dt;
    if (smartBuy) for (const id of ['oven', 'tables', 'scooter', 'helper', 'patience', 'menu', 'sign']) m.buy(id);
    if (next <= 0) { const c = m.urgent(); if (c) { const e = m.answer(c.id, r() < acc); if (e && first == null && e.some(x => x.type === 'sale')) first = m.S.t; next = 4.5 * (0.8 + 0.4 * r()); } else next = 0.3; }
  }
  return { earned: m.S.earned, first, win: m.S.earned >= m.target };
}
await t('pizza-balans: eerste verkoop < 30 s, doel haalbaar, ook zonder upgrades niet nul', () => {
  for (const lv of [1, 2, 3]) {
    const a = []; let firstMax = 0; for (let s = 1; s <= 25; s++) { const x = pizzaRun(s, 0.7, lv, true); a.push(x); firstMax = Math.max(firstMax, x.first); }
    info('pizza lv' + lv, 'win', a.filter(x => x.win).length + '/25', 'median', median(a.map(x => x.earned)), 'eerste<=', firstMax.toFixed(1));
    ok(firstMax < 30, 'eerste verkoop te laat: ' + firstMax); ok(frac(a.filter(x => x.win).length, 25) >= 0.8, 'pizza lv' + lv + ' te moeilijk');
  }
  const z = []; for (let s = 1; s <= 25; s++) z.push(pizzaRun(s, 0.5, 2, false).earned); ok(median(z) > 150, 'zonder upgrades en 50% goed moet er nog steeds verdiend worden: ' + median(z));
  const w = []; for (let s = 1; s <= 25; s++) w.push(pizzaRun(s, 0.2, 3, true).earned); ok(median(w) > 50, 'zelfs 20% goed verdient iets');
});
function monsterRun(seed, acc, level) {
  const r = mul(seed), m = M.createMonster({ level, rand: r }), S = m.S; let next = 4, firstFight = null, g = 0; const dt = 0.25;
  while (!m.done() && g++ < 100000) {
    if (!S.fight) {
      for (let k = 0; k < 3; k++) { if (S.wi < 4 && S.gold >= M.WEAPONS[S.wi + 1].cost && (S.ai >= S.wi || S.gold < M.ARMORS[Math.min(4, S.ai + 1)].cost || S.ai >= 4)) m.buyWeapon(S.wi + 1); else if (S.ai < 4 && S.gold >= M.ARMORS[S.ai + 1].cost) m.buyArmor(S.ai + 1); }
      while (S.gold >= M.POTION.cost + 40 && S.potions < 2) m.buyPotion();
      if (S.hp < m.maxHp() * 0.6 && S.potions) m.heal();
      const o = m.options(); const hasBoss = o[o.length - 1].boss;
      const pick = S.defeated === 0 ? o[0] : hasBoss && S.hp > m.maxHp() * 0.6 ? o[o.length - 1] : o[Math.max(0, o.length - (hasBoss ? 2 : 1))];
      m.start(pick); next = 4; S.t += 3; if (S.defeated === 0) firstFight = S.t;
    }
    m.tick(dt); next -= dt;
    if (S.fight && S.hp < m.maxHp() * 0.35 && S.potions) m.heal();
    if (next <= 0 && S.fight) { m.answer(r() < acc); next = 4 * (0.8 + 0.4 * r()); }
  }
  return { t: S.t, win: S.bossDown, first: S.firstReward, faint: S.fainted, done: m.done() };
}
await t('monster-balans: eerste beloning < 30 s, baas verslaan haalbaar, tijdslimiet bereikt = geen vastloper', () => {
  for (const lv of [1, 2, 3]) {
    const a = []; for (let s = 1; s <= 25; s++) a.push(monsterRun(s, 0.8, lv));
    info('monster lv' + lv, 'win', a.filter(x => x.win).length + '/25', 'tmed', median(a.map(x => x.t)).toFixed(0), 'eerste<=', Math.max(...a.map(x => x.first)).toFixed(1));
    ok(a.every(x => x.done), 'altijd een einde'); ok(Math.max(...a.map(x => x.first)) < 30, 'eerste beloning te laat'); ok(frac(a.filter(x => x.win).length, 25) >= 0.8, 'monster lv' + lv + ' te moeilijk');
  }
  const l = []; for (let s = 1; s <= 25; s++) l.push(monsterRun(s, 0.4, 2)); ok(l.every(x => x.done), 'lage nauwkeurigheid loopt niet vast'); ok(l.every(x => x.first != null && x.first < 90), 'ook met 40% goed een eerste overwinning');
});
function rainRun(seed, acc, level) {
  const r = mul(seed), m = R.createRain({ level, rand: r }), S = m.S; let next = 4.5, g = 0; const dt = 0.1;
  while (S.phase !== 'over' && S.phase !== 'won' && g++ < 200000) {
    if (S.phase === 'shop') { const order = S.lives <= 2 ? ['life', 'shield', 'turret', 'slow', 'coin'] : ['turret', 'slow', 'shield', 'coin', 'life']; for (const id of order) if (m.buy(id)) break; m.nextWave(); next = 4.5; continue; }
    m.tick(dt); next -= dt;
    for (const it of S.items.slice()) if (it.kind === 'bomb' || (it.kind === 'heart' && S.lives < S.maxLives) || (it.kind === 'ice' && m.rocks().length >= 2)) m.collect(it.id);
    if (next <= 0) { if (m.rocks().length) { m.answer(r() < acc); next = 4.5 * (0.8 + 0.4 * r()); } else next = 0.2; }
  }
  return { win: S.phase === 'won', wave: S.wave, first: S.firstKill, over: S.phase === 'over' || S.phase === 'won', t: S.t };
}
await t('regen-balans: eerste treffer < 30 s, 80% goed wint meestal, 50% komt ver, nooit eindeloos', () => {
  for (const lv of [1, 2, 3]) {
    const a = []; for (let s = 1; s <= 25; s++) a.push(rainRun(s, 0.8, lv));
    info('regen lv' + lv, 'win', a.filter(x => x.win).length + '/25', 'tmed', median(a.map(x => x.t)).toFixed(0));
    ok(a.every(x => x.over), 'altijd een einde'); ok(Math.max(...a.map(x => x.first)) < 30); ok(frac(a.filter(x => x.win).length, 25) >= 0.8, 'regen lv' + lv + ' te moeilijk');
  }
  const l = []; for (let s = 1; s <= 25; s++) l.push(rainRun(s, 0.5, 2)); ok(median(l.map(x => x.wave)) >= 3, 'met 50% goed kom je in ieder geval tot golf 3: ' + median(l.map(x => x.wave)));
});
function memRun(seed, acc, mem, level) {
  const r = mul(seed), m = G.createMemory({ level, rand: r }), S = m.S; let g = 0; const known = new Map();
  const learn = i => { if (r() < mem) known.set(i, S.cards[i].pair); };
  while (!m.done() && g++ < 8000) {
    if (S.phase === 'round-end') { if (!m.nextRound()) break; known.clear(); continue; }
    if (S.moves <= 2 && S.coins >= 16) m.use('moves');
    const down = S.cards.map((c, i) => c.state === 'down' ? i : -1).filter(i => i >= 0);
    const byPair = {}; for (const [i, p] of known) if (S.cards[i].state === 'down') (byPair[p] = byPair[p] || []).push(i);
    const kp = Object.values(byPair).find(a => a.length >= 2); let first;
    if (kp) first = kp[0]; else { const unk = down.filter(i => !known.has(i)); const pool = unk.length ? unk : down; first = pool[Math.floor(r() * pool.length)]; }
    if (!m.flip(first)) continue; learn(first); m.tick(1.2); if (S.phase === 'round-end') continue;
    let second;
    if (kp) second = kp[1]; else { const p = S.cards[first].pair; const pt = [...known].find(([i, pp]) => pp === p && i !== first && S.cards[i].state === 'down'); if (pt) second = pt[0]; else { const unk = down.filter(i => i !== first && !known.has(i)); const pool = unk.length ? unk : down.filter(i => i !== first); second = pool[Math.floor(r() * pool.length)]; } }
    const ev = m.flip(second); if (!ev) continue; learn(second); m.tick(1.2);
    if (ev.type === 'match') { m.claim(r() < acc); for (const [i] of [...known]) if (S.cards[i].state === 'done') known.delete(i); S.time -= 4.5; } else { m.resolveMismatch(); S.time -= 0.9; }
    m.tick(0);
  }
  return { cleared: S.cleared, win: m.win(), first: S.firstMatch, done: m.done() };
}
await t('memory-balans: eerste paar < 30 s, redelijke spelers winnen, zwakke spelers spelen alle rondes uit', () => {
  for (const lv of [1, 2, 3]) {
    const a = []; for (let s = 1; s <= 30; s++) a.push(memRun(s, 0.8, 0.6, lv));
    info('memory lv' + lv, 'win', a.filter(x => x.win).length + '/30', 'eerste<=', Math.max(...a.map(x => x.first)).toFixed(1));
    ok(a.every(x => x.done), 'altijd een einde'); ok(Math.max(...a.map(x => x.first)) < 30); ok(frac(a.filter(x => x.win).length, 30) >= 0.85, 'memory lv' + lv + ' te moeilijk');
  }
  const l = []; for (let s = 1; s <= 30; s++) l.push(memRun(s, 0.4, 0.2, 2)); ok(l.every(x => x.done), 'zwakke speler loopt niet vast');
});
function spaceRun(seed, acc, level) {
  const r = mul(seed), m = U.createSpace({ level, rand: r }), S = m.S; let next = 4.5, g = 0; const dt = 0.1;
  while (S.phase !== 'over' && S.phase !== 'won' && g++ < 200000) {
    if (S.phase === 'land') { let b = true; while (b) { b = false; for (const id of ['engine', 'eff', 'tank', 'magnet', 'shield']) if (m.buy(id)) { b = true; break; } } m.depart(); next = 4.5; continue; }
    m.tick(dt); next -= dt; if (next <= 0) { m.answer(r() < acc); next = 4.5 * (0.8 + 0.4 * r()); }
  }
  return { win: S.phase === 'won', t: S.t, first: S.firstGain, landed: S.landed };
}
await t('ruimte-balans: eerste brandstof < 30 s, 70% goed bereikt Planeet X, snel is sneller, nooit vast', () => {
  for (const lv of [1, 2, 3]) {
    const a = []; for (let s = 1; s <= 25; s++) a.push(spaceRun(s, 0.7, lv));
    info('ruimte lv' + lv, 'win', a.filter(x => x.win).length + '/25', 'tmed', median(a.map(x => x.t)).toFixed(0));
    ok(Math.max(...a.map(x => x.first)) < 30); ok(a.every(x => x.win), 'ruimte lv' + lv + ' moet haalbaar zijn');
  }
  const hi = median(Array.from({ length: 21 }, (_, i) => spaceRun(i + 1, 0.95, 2).t)), lo = median(Array.from({ length: 21 }, (_, i) => spaceRun(i + 1, 0.3, 2).t));
  ok(lo > hi * 1.15, 'goed antwoorden loont: ' + hi.toFixed(0) + ' vs ' + lo.toFixed(0));
  const bad = Array.from({ length: 15 }, (_, i) => spaceRun(i + 1, 0.0, 3)); ok(bad.every(x => x.landed >= 1), 'zelfs 0% goed komt vooruit (kruipen), dus nooit vast: ' + bad.map(x => x.landed).join(','));
});
function bombRun(seed, acc, level) {
  const r = mul(seed), m = B.createBomb({ level, rand: r }), S = m.S; let ans = 0, g = 0; const dt = 0.1; let total = 0;
  while (!m.done() && g++ < 400000) {
    if (S.phase === 'round-end') { m.nextRound(); ans = 0; continue; }
    if (S.holder === 0 && S.players[0].alive) { ans += dt; if (ans >= 4.5 * (0.8 + 0.4 * r())) { ans = 0; if (r() < acc) { m.answer(true); const c = m.alive().filter(p => !p.you); m.passTo(c[Math.floor(r() * c.length)].id); } else m.answer(false); } } else ans = 0;
    m.tick(dt); total += dt;
  }
  return { win: m.win(), wins: S.wins, t: total, done: m.done(), first: S.firstPass, rounds: S.tally.length };
}
await t('bom-balans: spel eindigt altijd na 3 rondes, 90% goed wint vaak, 40% goed krijgt toch punten', () => {
  for (const lv of [1, 2, 3]) {
    const a = []; for (let s = 1; s <= 40; s++) a.push(bombRun(s, 0.9, lv));
    info('bom lv' + lv, 'win', a.filter(x => x.win).length + '/40', 'tmed', median(a.map(x => x.t)).toFixed(0));
    ok(a.every(x => x.done && x.rounds === 3), 'drie rondes'); ok(frac(a.filter(x => x.win).length, 40) >= 0.5, 'bom lv' + lv + ' te moeilijk voor een goede speler');
  }
  const l = Array.from({ length: 40 }, (_, i) => bombRun(i + 1, 0.4, 2)); ok(l.every(x => x.done)); ok(median(l.map(x => x.t)) > 60, 'duurt minstens een minuut');
});

/* ---------- 4. rooktest in een nep-DOM ---------- */
class FEl {
  constructor(tag) { this.tagName = String(tag).toUpperCase(); this.children = []; this.parent = null; this.style = {}; this._cls = ''; this._html = ''; this.textContent = ''; this.handlers = {}; this.clientWidth = 360; this.clientHeight = 300; this.width = 0; this.height = 0; this.dataset = {}; this.title = ''; this.disabled = false; }
  get className() { return this._cls; } set className(v) { this._cls = String(v); }
  get classList() { const s = this; return { add: (...c) => { const a = new Set(s._cls.split(/\s+/).filter(Boolean)); c.forEach(x => a.add(x)); s._cls = [...a].join(' '); }, remove: (...c) => { const a = new Set(s._cls.split(/\s+/).filter(Boolean)); c.forEach(x => a.delete(x)); s._cls = [...a].join(' '); }, contains: c => s._cls.split(/\s+/).includes(c), toggle: (c, f) => { const has = s._cls.split(/\s+/).includes(c); const want = f === undefined ? !has : !!f; if (want && !has) s._cls += ' ' + c; if (!want && has) s._cls = s._cls.split(/\s+/).filter(x => x !== c).join(' '); return want; } }; }
  get innerHTML() { return this._html; } set innerHTML(v) { this._html = String(v); if (v === '') this._clear(); }
  _clear() { for (const c of this.children) c.parent = null; this.children = []; }
  appendChild(c) { if (c.parent) c.remove(); c.parent = this; this.children.push(c); return c; }
  append(...n) { for (const x of n) this.appendChild(typeof x === 'string' ? Object.assign(new FEl('span'), { textContent: x }) : x); }
  remove() { if (this.parent) { this.parent.children = this.parent.children.filter(c => c !== this); this.parent = null; } }
  addEventListener(t, f) { (this.handlers[t] = this.handlers[t] || []).push(f); } removeEventListener(t, f) { this.handlers[t] = (this.handlers[t] || []).filter(x => x !== f); }
  get isConnected() { let e = this; while (e.parent) e = e.parent; return e === DOC.body || e === DOC.head; }
  setAttribute() {} getBoundingClientRect() { return { left: 0, top: 0, width: 360, height: 300 }; }
  getContext() { const noop = () => {}; const g = { createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }), measureText: () => ({ width: 10 }) }; return new Proxy(g, { get: (o, k) => (k in o ? o[k] : noop), set: () => true }); }
  click(ev) { for (const f of (this.handlers.click || []).slice()) f(ev || {}); }
  text() { return this._html + ' ' + this.textContent; }
}
const DOC = { head: new FEl('head'), body: new FEl('body'), createElement: t => new FEl(t) };
function walk(e, fn) { fn(e); for (const c of e.children.slice()) walk(c, fn); }
function findAll(root, pred) { const out = []; walk(root, e => { if (pred(e)) out.push(e); }); return out; }

function installFake() {
  const orig = { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout, setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval, raf: globalThis.requestAnimationFrame, caf: globalThis.cancelAnimationFrame, document: globalThis.document, window: globalThis.window };
  let now = 0, id = 1; const tm = new Map();
  const add = (fn, ms, rep) => { const i = id++; tm.set(i, { fn, at: now + Math.max(0, ms || 0), rep: rep ? Math.max(1, ms) : 0 }); return i; };
  globalThis.setTimeout = (fn, ms) => add(fn, ms, false); globalThis.clearTimeout = i => { tm.delete(i); };
  globalThis.setInterval = (fn, ms) => add(fn, ms, true); globalThis.clearInterval = i => { tm.delete(i); };
  globalThis.requestAnimationFrame = fn => add(() => fn(now), 16, false); globalThis.cancelAnimationFrame = i => { tm.delete(i); };
  globalThis.document = DOC; globalThis.window = { devicePixelRatio: 1, addEventListener() {}, removeEventListener() {} };
  return {
    now: () => now, pending: () => tm.size,
    async advance(ms) {
      const end = now + ms;
      for (;;) {
        let best = null, bi = 0; for (const [i, x] of tm) if (x.at <= end && (!best || x.at < best.at)) { best = x; bi = i; }
        if (!best) break; now = best.at; if (best.rep) best.at = now + best.rep; else tm.delete(bi);
        best.fn(); await Promise.resolve();
      }
      now = end; await Promise.resolve();
    },
    restore() { Object.assign(globalThis, { setTimeout: orig.setTimeout, clearTimeout: orig.clearTimeout, setInterval: orig.setInterval, clearInterval: orig.clearInterval, requestAnimationFrame: orig.raf, cancelAnimationFrame: orig.caf }); if (orig.document === undefined) delete globalThis.document; else globalThis.document = orig.document; if (orig.window === undefined) delete globalThis.window; else globalThis.window = orig.window; },
  };
}

const QS = [
  { t: 'mc', q: 'Hoeveel is 3 × 4?', a: '12', o: ['12', '7', '14', '9'] }, { t: 'type', q: 'Hoofdstad van Frankrijk?', a: 'Parijs' }, { t: 'tf', q: 'De zon is een ster.', a: true },
  { t: 'num', q: '5 + 6 = ?', a: 11 }, { t: 'mc', q: 'Wat is groen?', e: '🐸', a: 'kikker', o: ['kikker', 'banaan', 'zon', 'maan'] }, { t: 'type', q: 'dog', a: 'hond' },
];
async function smoke(mod, { acc = 0.8, level = 2, maxSec = 900, fx = {} } = {}) {
  const fk = installFake(); const headBefore = DOC.head.children.length;
  const host = new FEl('div'); DOC.body.appendChild(host);
  const rand = mul(77); const pending = []; let ends = [], reports = 0, asks = 0, qi = 0;
  const env = {
    kit: { qs: QS }, uid: 'u', name: 'Test', seed: 1, level, rand, fx: Object.assign({ startCash: 0, cashMult: 1, streakBonus: 0, extraLives: 0, timeBonus: 0, hints: 0, shield: 0, luck: 0 }, fx),
    pick: (n) => Array.from({ length: n }, () => QS[(qi++) % QS.length]), snd: { play() {} }, tts: {}, w: 360, h: 640, report: () => { reports++; }, end: r => { ends.push(r); },
    ask: (box, q, o) => { asks++; const p = {}; p.promise = new Promise(res => { p.res = res; }); p.cancel = () => { p.cancelled = true; }; pending.push(p); box.appendChild(Object.assign(new FEl('div'), { _html: 'vraag ' + q.q })); p.opts = o; return p; },
  };
  let game, err = null;
  try {
    game = mod.default.create(host, env);
    const start = findAll(host, e => e.tagName === 'BUTTON' && e.text().includes('Tik om te beginnen'))[0]; ok(start, 'startknop aanwezig'); start.click();
    const r = mul(1234);
    for (let step = 0; step < maxSec * 10 && !ends.length; step++) {
      await fk.advance(100);
      // beantwoord openstaande vragen
      while (pending.length) { const p = pending.shift(); if (p.cancelled) continue; p.res({ ok: r() < acc, ms: 1500 }); await Promise.resolve(); }
      if (step % 5 === 0) {
        // generieke keuzes van de speler
        const pick = pred => findAll(host, pred);
        for (const e of pick(e => /mo-card/.test(e.className)).slice(-1)) e.click();
        for (const e of pick(e => /(^| )(rg-btn|ru-btn|me-btn|bo-btn)( |$)/.test(e.className) && !e.text().includes('Tik om te beginnen'))) e.click();
        for (const e of pick(e => /bo-p/.test(e.className) && /pick/.test(e.className))) { e.click(); break; }
        for (const e of pick(e => /(^| )me-card( |$)/.test(e.className)).filter(() => r() < 0.3).slice(0, 2)) e.click();
        for (const e of pick(e => /pz-c( |$)/.test(e.className)).filter(() => r() < 0.2)) e.click();
        for (const e of pick(e => /(rg-item|ru-item|mo-it|pz-up|me-tool)/.test(e.className)).filter(() => r() < 0.1)) e.click();
      }
    }
    ok(ends.length === 1, 'env.end precies 1x, was ' + ends.length);
    const res = ends[0]; ok(typeof res.score === 'number' && isFinite(res.score) && res.score >= 0, 'score'); ok(res.win === true || res.win === false || res.win === null); ok(res.stats && typeof res.summary === 'string' && res.summary.length > 0);
    await fk.advance(5000); eq(ends.length, 1, 'niet nog een keer beeindigd');
    ok(asks > 0 && reports > 0, 'vragen gesteld en gemeld (' + asks + '/' + reports + ')');
  } catch (e) { err = e; }
  try { game && game.destroy(); } catch (e) { err = err || e; }
  await fk.advance(3000);
  const left = fk.pending(), styles = DOC.head.children.length - headBefore;
  fk.restore();
  if (err) throw err;
  eq(styles, 0, '<style> opgeruimd'); eq(left, 0, 'timers/rAF opgeruimd: ' + left); eq(host.children.length, 0, 'host leeg');
  return ends[0];
}
for (const [id, mod] of [['pizza', P], ['monster', M], ['regen', R], ['memory', G], ['ruimte', U], ['bom', B]]) {
  await t(`${id}: rooktest (spelen tot env.end, destroy ruimt op)`, async () => {
    const r = await smoke(mod, { acc: 0.8 }); info(id, 'score', r.score, 'win', r.win, '-', r.summary);
  });
  await t(`${id}: rooktest met weinig goede antwoorden en andere moeilijkheid`, async () => { await smoke(mod, { acc: 0.3, level: 3 }); });
}
await t('rooktest: vroeg destroy (voor het begin en midden in het spel) laat niets achter', async () => {
  for (const mod of [P, M, R, G, U, B]) {
    const fk = installFake(); const hb = DOC.head.children.length; const host = new FEl('div'); DOC.body.appendChild(host);
    const env = { kit: { qs: QS }, level: 2, rand: mul(3), fx: {}, pick: n => QS.slice(0, n), snd: { play() {} }, report() {}, end() { throw new Error('end niet verwacht'); }, w: 360, h: 600, ask: (b) => ({ promise: new Promise(() => {}), cancel() {} }) };
    const g1 = mod.default.create(host, env); g1.destroy();
    const g2 = mod.default.create(host, env); findAll(host, e => e.tagName === 'BUTTON' && e.text().includes('Tik om te beginnen'))[0].click(); await fk.advance(4000); g2.destroy(); await fk.advance(3000);
    const left = fk.pending(); fk.restore(); eq(left, 0, mod.default.id + ': timers over ' + left); eq(DOC.head.children.length - hb, 0, mod.default.id + ': style over'); host.remove();
  }
});

console.log(`\n${pass} geslaagd, ${fail} mislukt`);
process.exit(fail ? 1 : 0);
