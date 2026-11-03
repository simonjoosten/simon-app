// Ronde 4 – LEARN: nieuwe minigames (games/r4-*.js), kits (r4-packs*.js), uitdagingen/ranglijst (r4-hub.js), werelden (r4-worlds.js).
// Uitvoeren: node tools/test-r4-learn.mjs
import { installR4, advance, pending, clock, mkEnv, findAll, visible, El } from './learn-stubs/r4-dom.mjs';
installR4();
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.error('FOUT:', m); } };
const section = (n) => console.log('--', n);
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ============ 1. pure spellogica met bots ============ */
const Ladder = await import('../docs/learn/games/r4-ladder.js');
const Kluis = await import('../docs/learn/games/r4-kluis.js');
const Drank = await import('../docs/learn/games/r4-drank.js');
const Lava = await import('../docs/learn/games/r4-lava.js');
const Duik = await import('../docs/learn/games/r4-duik.js');
const Rad = await import('../docs/learn/games/r4-rad.js');
const mods = { ladder: Ladder, kluis: Kluis, drank: Drank, lava: Lava, duik: Duik, rad: Rad };
for (const [k, m] of Object.entries(mods)) {
  const d = m.default;
  ok(d.id === 'r4-' + k && typeof d.create === 'function' && d.name && d.emoji && d.color && d.desc && Array.isArray(d.tags) && d.minutes > 0, `${k}: default export (id/name/emoji/create)`);
}
const winRate = (n, f) => { let w = 0; for (let i = 0; i < n; i++) if (f(i + 1)) w++; return w / n; };

section('ladder');
{
  const run = (p, seed, level = 2) => { const r = rng(seed), g = new Ladder.LadderGame({ rand: r, level, fx: {} }); let n = 0; while (g.state === 'play' && n++ < 200) g.playRound(r() < p); ok(n <= Ladder.MAX_ROUNDS + 1, 'ladder: eindigt binnen max rondes'); return g; };
  ok(winRate(300, (s) => run(0.85, s).state === 'won') > 0.6, 'ladder: goede speler wint vaak');
  ok(winRate(300, (s) => run(0.0, s).state === 'won') === 0, 'ladder: niets goed = nooit winst');
  ok(winRate(300, (s) => run(0.5, s, 1).state === 'won') > winRate(300, (s) => run(0.5, s, 3).state === 'won'), 'ladder: makkelijk is makkelijker dan moeilijk');
  const g = run(0.9, 5); ok(g.finalScore() > 0, 'ladder: score > 0');
  ok(Object.entries(Ladder.UP).every(([a, b]) => +b > +a && +b <= Ladder.CELLS) && Object.entries(Ladder.DOWN).every(([a, b]) => +b < +a) && Object.keys(Ladder.UP).every((k) => !(k in Ladder.DOWN)), 'ladder: regenbogen omhoog, haaien omlaag, geen overlap');
  const seen = new Set(); for (let n = 1; n <= Ladder.CELLS; n++) { const p = Ladder.cellPos(n); seen.add(p.r + ',' + p.c); } ok(seen.size === Ladder.CELLS, 'ladder: elk vakje een eigen plek op het bord');
  const gs = new Ladder.LadderGame({ rand: rng(1), level: 2, fx: { shield: 1 } }); gs.me = 12; const l = gs.land(13, 'me'); ok(l.pos === 13 && l.ev[0].e === 'shield', 'ladder: schild redt van haai');
}
section('kluis');
{
  function solve(g, r, p) {
    // slimme bot: houdt consistente codes bij
    let cand = []; const rec = (pre) => { if (pre.length === g.len) { cand.push(pre.slice()); return; } for (let d = 1; d <= Kluis.DIGITS; d++) if (!pre.includes(d)) { pre.push(d); rec(pre); pre.pop(); } }; rec([]);
    let n = 0;
    while (g.state === 'play' && n++ < 200) {
      if (r() >= p) { g.wrongAnswer(); continue; }
      const guess = cand[Math.floor(r() * cand.length)]; const res = g.guess(guess);
      cand = cand.filter((c) => { let e = 0, ne = 0; for (let i = 0; i < g.len; i++) { if (c[i] === guess[i]) e++; else if (guess.includes(c[i])) ne++; } return e === res.exact && ne === res.near; });
    }
    return g;
  }
  ok(winRate(150, (s) => { const r = rng(s); return solve(new Kluis.VaultGame({ rand: r, level: 2, fx: {} }), r, 0.92).state === 'won'; }) > 0.7, 'kluis: slimme bot kraakt vaak');
  ok(winRate(150, (s) => { const r = rng(s); return solve(new Kluis.VaultGame({ rand: r, level: 2, fx: {} }), r, 0.0).state === 'won'; }) === 0, 'kluis: alleen fouten = nooit winst');
  const g = new Kluis.VaultGame({ rand: rng(3), level: 2, fx: {} }); ok(new Set(g.code).size === g.len && g.code.every((d) => d >= 1 && d <= 6), 'kluis: code heeft verschillende cijfers 1..6');
  const r1 = g.guess(g.code.slice()); ok(r1.exact === g.len && g.state === 'won' && g.score() > 400, 'kluis: juiste code wint');
  const g2 = new Kluis.VaultGame({ rand: rng(3), level: 1, fx: { extraLives: 2 } }); ok(g2.alarms === 5, 'kluis: extra levens = extra alarmen');
  const g3 = new Kluis.VaultGame({ rand: rng(3), level: 2, fx: { shield: 1 } }); ok(g3.wrongAnswer() === false && g3.alarms === 3, 'kluis: schild vangt eerste fout');
  const h = g.hint === undefined ? null : new Kluis.VaultGame({ rand: rng(9), level: 2, fx: {} }); const hh = h.hint(); ok(hh && h.code[hh.i] === hh.d, 'kluis: hint klopt');
}
section('drank');
{
  const run = (p, seed, level = 2) => {
    const r = rng(seed), g = new Drank.BrewGame({ rand: r, level, fx: {} }); let n = 0;
    while (g.state === 'play' && n++ < 400) {
      if (r() < p) { const off = g.offer(); const miss = g.missing(); ok(off.length === 3 && new Set(off).size === 3 && (!miss.length || off.some((o) => miss.includes(o))), 'drank: aanbod 3 verschillende met minstens 1 nuttige'); g.add(off.find((o) => miss.includes(o)) || off[0]); } else g.junk();
    }
    ok(n < 400, 'drank: eindigt'); return g;
  };
  ok(winRate(200, (s) => run(0.9, s).state === 'won') > 0.8, 'drank: goede speler wint');
  ok(winRate(200, (s) => run(0.1, s).state === 'won') < 0.1, 'drank: slechte speler verliest');
  const g = new Drank.BrewGame({ rand: rng(2), level: 2, fx: {} }); const need = g.order.slice(); let ev; for (const o of need) ev = g.add(o); ok(ev.ev[0].e === 'sold' && ev.ev[0].perfect && g.coins > 0 && g.served === 1, 'drank: bestelling klaar = verkocht, perfect bij geen rommel');
}
section('lava');
{
  const run = (p, every, seed, level = 2) => {
    const r = rng(seed), g = new Lava.LavaGame({ rand: r, level, fx: {} }); let t = 0, next = every;
    while (g.state === 'play' && t < 600) { g.tick(0.25); t += 0.25; if (t >= next) { g.answer(r() < p); next += every; } }
    ok(t < 600, 'lava: eindigt'); return g;
  };
  ok(winRate(150, (s) => run(0.85, 5, s).state === 'won') > 0.7, 'lava: snelle goede speler wint');
  ok(winRate(150, (s) => run(0.0, 5, s).state === 'won') === 0, 'lava: alleen fouten = verlies');
  ok(winRate(150, (s) => run(0.9, 40, s).state === 'won') === 0, 'lava: te langzaam = lava wint');
  const g = new Lava.LavaGame({ rand: rng(1), level: 2, fx: {} }); g.streak = 2; const before = g.pos; g.answer(true); ok(g.pos === before + 2, 'lava: 3e goed = dubbele sprong');
  const g2 = new Lava.LavaGame({ rand: rng(1), level: 2, fx: { shield: 1 } }); g2.pos = 2; g2.lava = 1.5; g2.answer(false); ok(g2.state === 'play' && g2.shield === 0, 'lava: schild redt van de lava');
}
section('duik');
{
  const run = (p, seed, level = 2) => {
    const r = rng(seed), g = new Duik.DiveGame({ rand: r, level, fx: {} }); let n = 0;
    while (g.state === 'play' && n++ < 500) { if (g.phase === 'choose') { if (g.depth >= 4 || g.o2 < 50) g.surface(); else g.deeper(); continue; } g.answer(r() < p); }
    ok(n < 500, 'duik: eindigt'); return g;
  };
  ok(winRate(150, (s) => run(0.85, s).state === 'won') > 0.5, 'duik: voorzichtige duiker haalt doel');
  ok(winRate(150, (s) => run(0.0, s).state === 'won') === 0, 'duik: alleen fouten = geen buit');
  const g = new Duik.DiveGame({ rand: rng(1), level: 2, fx: {} }); g.answer(true); ok(g.loot > 0 && g.phase === 'choose', 'duik: goed antwoord = buit en keuze'); const got = g.surface(); ok(got > 0 && g.banked === got && g.dive === 2, 'duik: opduiken zet buit veilig');
  const g2 = new Duik.DiveGame({ rand: rng(1), level: 2, fx: {} }); g2.answer(true); g2.o2 = 10; g2.phase = 'ask'; const lost = g2.loot; g2.answer(false); ok(g2.lostLoot === lost && g2.banked === 0 && g2.dive === 2, 'duik: zonder zuurstof ben je de buit van deze duik kwijt');
}
section('rad');
{
  const run = (p, seed, level = 2) => {
    const r = rng(seed), g = new Rad.WheelGame({ rand: r, level, fx: {} }); let n = 0;
    while (g.state === 'play' && n++ < 100) { if (r() < p) { g.spin(false); if (r() < 0.3) g.spin(true); g.nextRound(); } else g.wrong(); }
    ok(n < 100 && g.coins >= 0, 'rad: eindigt, geen negatieve munten'); return g;
  };
  ok(winRate(200, (s) => run(0.9, s).state === 'won') > 0.6, 'rad: goede speler speelt uit');
  ok(winRate(200, (s) => run(0.2, s).state === 'won') < 0.1, 'rad: slechte speler verliest hartjes');
  const g = new Rad.WheelGame({ rand: rng(5), level: 2, fx: {} }); g.coins = 1000; let bank = false; for (let i = 0; i < 400 && !bank; i++) { const gg = new Rad.WheelGame({ rand: rng(i + 1), level: 2, fx: {} }); gg.coins = 1000; const r = gg.spin(true); if (r.seg.id === 'bank') { bank = gg.coins === 700; } } ok(bank, 'rad: bankroet = -30%');
  const w = Rad.SEGS.reduce((a, s) => a + s.w, 0); ok(w > 0 && Rad.SEGS.every((s) => s.id && s.label && s.icon) && Rad.RISKY.every((s) => s.id && s.icon), 'rad: segmenten compleet');
}

/* ============ 2. rooktest met nep-DOM: monkey-klikken, opruimen ============ */
section('rooktest');
async function smoke(mod, o = {}) {
  const id = mod.default.id, host = new El('div'), r = rng(o.seed || 11);
  const env = mkEnv({ answer: () => ({ ok: r() < (o.p ?? 0.75) }), askDelay: 40, level: o.level || 2, fx: o.fx });
  const errs = []; const oe = console.error; console.error = (...a) => { errs.push(a.join(' ')); };
  let inst, threw = null, clicks = 0;
  try {
    inst = mod.default.create(host, env);
    for (let t = 0; t < (o.seconds || 600) * 1000 && env.ends.length === 0; t += 250) {
      await advance(250);
      const bs = findAll(host, (e) => e.tagName === 'BUTTON' && !e.disabled && visible(e) && !/^⚙/.test(e.textContent));
      const pref = bs.filter((b) => /beginnen|Probeer|Dieper|Opduiken|nee|doorgaan|Risico/i.test(b.textContent));
      const pool = pref.length && r() < 0.7 ? pref : bs;
      if (pool.length) { pool[Math.floor(r() * pool.length)].click(); clicks++; }
    }
  } catch (e) { threw = e; }
  console.error = oe;
  ok(!threw, id + ': smoke gooide ' + (threw && threw.stack));
  ok(errs.length === 0, id + ': console.error: ' + errs.slice(0, 2).join(' | '));
  ok(clicks >= 1, id + ': er is geklikt (' + clicks + ')');
  try { inst && inst.destroy(); } catch (e) { ok(false, id + ': destroy gooide ' + e.message); }
  await advance(1200);
  ok(pending() === 0, id + ': na destroy nog ' + pending() + ' timers/rAF over');
  ok(env.ends.length <= 1, id + ': end meer dan 1x');
  return env;
}
for (const [k, m] of Object.entries(mods)) {
  for (const level of [1, 3]) {
    const env = await smoke(m, { level, seed: 20 + level });
    ok(env.ends.length === 1, `${k} L${level}: spel eindigt zelf met env.end (${env.ends.length})`);
    const e = env.ends[0];
    if (e) ok(Number.isFinite(e.score) && e.score >= 0 && typeof e.win === 'boolean' && e.stats && Number.isFinite(e.stats.correct) && typeof e.summary === 'string', `${k}: end-resultaat heeft score/win/stats/summary`);
    ok(env.reports.length > 0 && env.reports.every((x) => x.q && typeof x.ok === 'boolean'), `${k}: vragen gerapporteerd (${env.reports.length})`);
  }
  // met upgrades en een zeer kleine kit
  const env2 = mkEnv({ qs: [{ t: 'tf', q: 'Water is nat', a: true }], fx: { startCash: 50, cashMult: 1.5, streakBonus: 2, extraLives: 2, timeBonus: 5, hints: 1, shield: 2, luck: 0.5 }, askDelay: 20 });
  const host = new El('div'); let inst, th = null; try { inst = m.default.create(host, env2); for (let t = 0; t < 120000 && !env2.ends.length; t += 250) { await advance(250); const bs = findAll(host, (e) => e.tagName === 'BUTTON' && !e.disabled); if (bs.length) bs[(t / 250) % bs.length].click(); } } catch (e) { th = e; }
  ok(!th, `${k}: kleine kit + upgrades zonder fout ${th && th.stack}`); try { inst.destroy(); } catch {} await advance(800); ok(pending() === 0, `${k}: opgeruimd (kleine kit)`);
}
// destroy tijdens een openstaande vraag
for (const [k, m] of Object.entries(mods)) {
  const host = new El('div'), env = mkEnv({ askDelay: 5000 }); const inst = m.default.create(host, env);
  const go = findAll(host, (e) => e.tagName === 'BUTTON' && /beginnen/i.test(e.textContent))[0]; go && go.click(); await advance(300);
  inst.destroy(); await advance(8000); ok(pending() === 0 && env.ends.length === 0 && env.reports.length === 0, `${k}: destroy midden in een vraag laat niets achter`);
}

/* ============ 3. kits ============ */
section('kits');
const Core = await import('../docs/learn/core.js?v=1');
const Packs = await import('../docs/learn/r4-packs.js');
{
  let total = 0; const names = new Set();
  ok(Packs.R4_PACKS.length === 10, `10 nieuwe kits (${Packs.R4_PACKS.length})`);
  for (const p of Packs.R4_PACKS) {
    const raw = await p.load(); const kit = await Packs.r4Kit(p.id, Core.normalizeQ);
    ok(raw.qs.length >= 25, `${p.id}: >= 25 vragen (${raw.qs.length})`); total += kit.qs.length;
    ok(kit.qs.length === raw.qs.length, `${p.id}: alle vragen geldig voor normalizeQ (${kit.qs.length}/${raw.qs.length})`);
    ok(p.id.startsWith('r4-') && p.name && p.emoji && p.group && p.desc, `${p.id}: metadata`);
    ok(!names.has(p.id), 'uniek id'); names.add(p.id);
    const keys = new Set();
    for (const q of kit.qs) {
      keys.add(Core.qkey(q));
      if (q.t === 'mc') ok(q.o.includes(q.a) && new Set(q.o).size === q.o.length && q.o.length >= 2, `${p.id}: mc heeft eigen antwoord en unieke opties: ${q.q}`);
      if (q.t === 'match') ok(new Set(q.a.map((x) => x[1])).size === q.a.length && new Set(q.a.map((x) => x[0])).size === q.a.length, `${p.id}: match zonder dubbele kanten: ${q.q}`);
      if (q.t === 'order') ok(new Set(q.a).size === q.a.length, `${p.id}: order uniek: ${q.q}`);
      // het goede antwoord moet door checkAnswer geaccepteerd worden
      let given = q.a;
      if (q.t === 'match') given = q.a.map((x) => x.slice());
      const r = Core.checkAnswer(q, given); ok(r && r.ok, `${p.id}: goed antwoord wordt goedgekeurd: ${q.q} (${r && JSON.stringify(r)})`);
      if (q.t === 'tf') { const r2 = Core.checkAnswer(q, !q.a); ok(!r2.ok, `${p.id}: fout antwoord bij tf wordt afgekeurd`); }
    }
    ok(keys.size === kit.qs.length, `${p.id}: geen dubbele vragen (${keys.size}/${kit.qs.length})`);
    const types = new Set(kit.qs.map((q) => q.t)); ok(types.size >= 3, `${p.id}: gevarieerde vraagsoorten (${[...types]})`);
  }
  ok(total >= 200, `minstens 200 extra vragen (${total})`);
  console.log('   extra vragen in totaal:', total);
  const merged = Packs.mergeR4([{ id: 'x', name: 'X' }, { id: 'r4-vikingen', name: 'dubbel' }]); ok(merged.length === 11 && merged.filter((k) => k.id === 'r4-vikingen').length === 1, 'mergeR4 voegt toe zonder dubbelen');
  ok(Packs.isR4('r4-logica') && !Packs.isR4('tafels') && (await Packs.r4Kit('nope')) === null, 'isR4/r4Kit onbekend');
  const spaans = await Packs.r4Kit('r4-es-huis-school', Core.normalizeQ); ok(spaans.qs.some((q) => q.lang === 'es'), 'spaans-kit heeft lang es');
  // afronden: antwoorden kloppen met echte rekenregels
  const af = await Packs.r4Kit('r4-afronden', Core.normalizeQ); ok(af.qs.some((q) => /Rond 65 af/.test(q.q) && q.a === 70) && af.qs.some((q) => /helft van 36/.test(q.q) && q.a === 18), 'afronden: sommen kloppen');
  // pick() werkt op een R4-kit (kit is bruikbaar voor spellen)
  const pk = Core.pick(af, 10, { seed: 3 }); ok(pk.length === 10, 'pick() op R4-kit');
}

/* ============ 4. uitdagingen en ranglijst ============ */
section('uitdagingen');
const H = await import('../docs/learn/r4-hub.js');
{
  ok(H.weekKey(Date.UTC(2026, 0, 1, 12)) === '2026-W01' && H.weekKey(new Date(2026, 10, 2, 12).getTime()) === '2026-W45' && H.weekKey(new Date(2024, 11, 30, 12).getTime()) === '2025-W01', 'weekKey (ISO)');
  ok(H.addDays('2026-03-01', -1) === '2026-02-28' && H.addDays('2026-12-31', 1) === '2027-01-01', 'addDays');
  const ids = ['a', 'b', 'c', 'd', 'e', 'f']; const c1 = H.dailyChallenge('2026-11-02', ids), c2 = H.dailyChallenge('2026-11-02', ids), c3 = H.dailyChallenge('2026-11-03', ids);
  ok(JSON.stringify(c1) === JSON.stringify(c2) && ids.includes(c1.game) && c1.level >= 1 && c1.level <= 3 && c1.reward > 0 && c1.n > 0 && c1.text, 'dagelijkse uitdaging is deterministisch per dag');
  const games = new Set(), kinds = new Set(); for (let i = 0; i < 60; i++) { const c = H.dailyChallenge(H.addDays('2026-01-01', i), ids); games.add(c.game); kinds.add(c.kind); } ok(games.size === ids.length && kinds.size === 4, 'dagelijkse uitdaging wisselt van spel en soort');
  ok(c1.seed !== c3.seed, 'seed per dag anders');
  const wc = H.weeklyChallenge('2026-W45'); ok(wc.goals.length === 4 && new Set(wc.goals.map((g) => g.id)).size === 4 && JSON.stringify(wc) === JSON.stringify(H.weeklyChallenge('2026-W45')), 'weekuitdaging: 4 verschillende doelen, deterministisch');
  // verwerken
  const d = H.normR4(null); const now = new Date(2026, 10, 2, 12).getTime(); H.rollover(d, now);
  const ch = { key: H.dayKey(now), game: 'x', level: 2, kind: 'correct', n: 8, text: 't', seed: 1, reward: 90 };
  let r = H.recordResult(d, { game: 'x', kit: 'K', level: 2, score: 100, win: false, correct: 5, wrong: 3, bestStreak: 3, daily: true, ch }, now); ok(!r.dailyDone && d.day.done === 0, 'daily: te weinig goed = niet gehaald');
  r = H.recordResult(d, { game: 'x', kit: 'K', level: 2, score: 300, win: true, correct: 9, wrong: 0, bestStreak: 9, daily: true, ch }, now + 1000); ok(r.dailyDone && d.day.done === 1 && d.ds.n === 1, 'daily gehaald, reeks 1');
  r = H.recordResult(d, { game: 'x', kit: 'K', level: 2, score: 300, win: true, correct: 9, wrong: 0, bestStreak: 9, daily: true, ch }, now + 2000); ok(!r.dailyDone && d.ds.n === 1, 'daily telt maar 1x per dag');
  const st = H.dailyStatus(d, ch); ok(st.ready && !st.claimed, 'daily klaar om op te halen');
  const coins = H.claimDaily(d, ch, now + 3000); ok(coins === 90 && H.claimDaily(d, ch, now + 4000) === 0 && d.tot.dailies === 1, 'daily claim 1x');
  // volgende dag: reeks loopt door met bonus
  const n2 = now + 86400000; H.rollover(d, n2); const ch2 = { ...ch, key: H.dayKey(n2) };
  H.recordResult(d, { game: 'x', kit: 'K', level: 2, score: 300, win: true, correct: 9, wrong: 0, bestStreak: 9, daily: true, ch: ch2 }, n2); ok(d.ds.n === 2 && H.claimDaily(d, ch2, n2) === 90 + H.streakBonus(2), 'reeks 2 dagen geeft bonus');
  // dag overgeslagen: reeks weg
  const n3 = n2 + 3 * 86400000; H.rollover(d, n3); ok(d.ds.n === 0 && d.ds.best === 2, 'reeks verbroken na gemiste dag, beste blijft');
  // week
  const wk = H.weekKey(now); const w2 = H.weeklyChallenge(wk); const d2 = H.normR4(null); H.rollover(d2, now);
  for (let i = 0; i < 14; i++) H.recordResult(d2, { game: 'g' + (i % 7), kit: 'K', level: 2, score: 100 + i, win: true, correct: 14, wrong: 0, bestStreak: 14 }, now + i * 1000);
  const prog = H.weeklyProgress(d2, w2); ok(prog.every((g) => g.done), `weekdoelen gehaald met 14 volle spellen ${JSON.stringify(prog.map((g) => [g.id, g.prog, g.n]))}`);
  ok(H.claimWeekly(d2, w2, 'bonus', now) === 0, 'bonus pas na alle doelen');
  let sum = 0; for (const g of prog) { const c = H.claimWeekly(d2, w2, g.id, now); sum += c; ok(c === g.coins && H.claimWeekly(d2, w2, g.id, now) === 0, `weekdoel ${g.id} 1x claimen`); }
  ok(H.claimWeekly(d2, w2, 'bonus', now) === w2.bonus && H.claimWeekly(d2, w2, 'bonus', now) === 0 && d2.tot.weeklies === 1, 'weekbonus 1x');
  const nextWeek = now + 8 * 86400000; H.rollover(d2, nextWeek); ok(d2.wk.games === 0 && d2.wk.claimed.length === 0 && d2.hist.length === 14, 'nieuwe week reset tellers, geschiedenis blijft');
  // ranglijst
  section('ranglijst');
  const lb = H.normR4(null); H.rollover(lb, now);
  const put = (g, s, b, t) => H.recordResult(lb, { game: g, kit: 'Kit', level: 2, score: s, win: s > 150, correct: 5, wrong: 1, bestStreak: b }, t);
  put('a', 100, 3, now); put('b', 400, 5, now + 10); put('a', 250, 8, now + 20); put('c', 50, 1, now - 3 * 86400000); put('d', 900, 2, now - 20 * 86400000);
  ok(H.leaderboard(lb, 'today', now).map((x) => x.v).join() === '400,250,100', 'today: gesorteerd, alleen vandaag');
  ok(H.leaderboard(lb, 'all', now)[0].v === 900 && H.leaderboard(lb, 'all', now).length === 5, 'all: hoogste eerst');
  const wkRows = H.leaderboard(lb, 'week', now); ok(wkRows.every((x) => H.weekKey(x.t) === H.weekKey(now)) && wkRows[0].v === 400, 'week: alleen deze week');
  const gm = H.leaderboard(lb, 'game', now); ok(gm.filter((x) => x.g === 'a').length === 1 && gm.find((x) => x.g === 'a').v === 250, 'game: beste per spel');
  ok(H.leaderboard(lb, 'streak', now)[0].v === 8 && H.leaderboard(lb, 'bestaatniet', now).length === 0, 'streak-modus en onbekende modus');
  ok(H.RANK_MODES.length === 5, '5 ranglijst-modi');
  // opslag
  for (let i = 0; i < 300; i++) H.recordResult(lb, { game: 'g' + (i % 20), kit: 'Een lange kitnaam hier', level: 2, score: i, win: false, correct: 1, wrong: 1, bestStreak: 1 }, now + i);
  ok(lb.hist.length === H.HIST_MAX, `geschiedenis max ${H.HIST_MAX}`);
  ok(JSON.stringify(lb).length < 20000 && H.r4ForCloud(lb).length <= 17500, `r4-opslag klein genoeg (${JSON.stringify(lb).length})`);
  const back = H.normR4(JSON.parse(H.r4ForCloud(lb))); ok(back.hist.length > 20 && back.ds.best === lb.ds.best, 'cloud-versie blijft leesbaar');
  const m = H.mergeR4(d2, lb); ok(m.tot.dailies >= 0 && m.hist.length >= lb.hist.length, 'mergeR4 verliest geen geschiedenis');
  ok(H.normR4('rommel').v === 1 && H.normR4({ hist: [{ g: 5 }, null, { g: 'a', s: 'x' }] }).hist.length === 1, 'normR4 is robuust');
  // HTML
  const api = { esc: (s) => String(s).replace(/</g, '&lt;'), ic: (n) => `[${n}]`, fmt: (n) => String(n), meta: (id) => ({ name: 'Spel ' + id, emoji: 'E' }), bigIcon: () => '[big]' };
  const hd = H.dailyHTML(d, ch2, api, H.weeklyChallenge(wk)); ok(hd.includes('Uitdaging van vandaag') && hd.includes('Weekuitdaging') && hd.includes('data-act="r4-'), 'dailyHTML');
  const hr = H.rankModesHTML(lb, 'all', api, now); ok(hr.includes('data-act="r4-rank"') && hr.includes('Ranglijst') && hr.includes(String(H.leaderboard(lb, 'all', now)[0].v)), 'rankModesHTML');
}

/* ============ 5. werelden ============ */
section('werelden');
{
  const { Themes, WORLDS } = await import('../docs/gfx/themes.js?v=1');
  const W = await import('../docs/learn/r4-worlds.js');
  ok(W.R4_WORLDS.length === 6 && WORLDS.length === 24, `24 werelden in totaal (${WORLDS.length})`);
  ok(new Set(WORLDS.map((w) => w.id)).size === WORLDS.length, 'unieke wereld-id\'s');
  const icons = new Set((await import('node:fs')).readdirSync(new URL('../docs/art/3d/', import.meta.url)).map((f) => f.replace('.png', '')));
  for (const w of W.R4_WORLDS) {
    ok(Themes.world(w.id) === w && w.name && w.emoji && w.bg.length === 3 && w.deco.length >= 5, `${w.id}: gevonden via Themes.world`);
    ok(w.deco.every((n) => icons.has(n)), `${w.id}: alle deco-iconen bestaan (${w.deco.filter((n) => !icons.has(n))})`);
    const ctx = new El('canvas').getContext('2d'); let th = null; try { Themes.paintBackground(ctx, 360, 560, w.id, 1.5); Themes.paintBackground(ctx, 360, 560, w, 3); } catch (e) { th = e; } ok(!th, `${w.id}: tekent zonder fout ${th && th.message}`);
    ok(Themes.setForGame('testspel', w.id) === true, `${w.id}: setForGame`);
  }
  const Shop = await import('../docs/learn/games-shop.js?v=2'); ok(Shop.EXTRA_BG.length === WORLDS.length && Shop.EXTRA_BG.every((x) => x[0].length <= 20), 'winkel heeft een achtergrond per wereld (ook de nieuwe)');
  W.installWorlds(); ok(WORLDS.length === 24, 'installWorlds is idempotent');
}

console.log(`\n${passes} gelukt, ${fails} mislukt`);
process.exit(fails ? 1 : 0);
