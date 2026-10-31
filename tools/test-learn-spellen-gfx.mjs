// Fase 2: nieuwe inhoud/modi/grafiek van de 9 Learn-spellen (memory, ruimte, bom, slang, boerderij, vlieg, schat, escape, miljonair).
// 1. pure logica van de nieuwe modi/items  2. UI-rooktest per modus (nep-DOM, canvas-achtergrond aanwezig, ⚙-knop, opruimen)
import { install, advance, pending, mkEnv, findAll, visible, El } from './learn-stubs/dom-mock-c.mjs';
install();
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.error('FOUT:', m); } };
const section = (n) => console.log('--', n);
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const G = id => import('../docs/learn/games/' + id + '.js');

/* ---------- logica ---------- */
{
  section('memory');
  const M = await G('memory');
  ok(Object.keys(M.MEM_MODES).length >= 3 && Object.keys(M.MEM_THEMES).length >= 5, 'memory: modi/thema\'s');
  for (const th of M.MEM_THEME_IDS) { const sp = M.emojiSpecs(10, rng(3), th); ok(sp.length === 10 && sp.every(x => x.a.ic && x.a.ic === x.b.ic), 'memory: thema ' + th + ' geeft 10 plaatjesparen'); ok(new Set(sp.map(x => x.a.ic)).size === 10, 'memory: unieke plaatjes ' + th); }
  const fl = M.createMemory({ level: 2, rand: rng(4), mode: 'flits' }), kl = M.createMemory({ level: 2, rand: rng(4) });
  ok(fl.S.movesMax < kl.S.movesMax, 'memory: flits heeft minder zetten'); ok(M.createMemory({ rand: rng(4), mode: 'express' }).S.timeMax < kl.S.timeMax, 'memory: express minder tijd');
  const ex = M.createMemory({ rand: rng(5), mode: 'express' }); const a = ex.S.cards.findIndex(c => c.pair === 0), b = ex.S.cards.findIndex((c, i) => i !== a && c.pair === 0); ex.flip(a); ex.flip(b); const ev = ex.claim(true)[0]; ok(ev.pts === 40, 'memory: express dubbele punten (' + ev.pts + ')');
  ok(M.createMemory({ rand: rng(6), mode: 'bestaatniet' }).S.mode === 'klassiek', 'memory: onbekende modus -> klassiek');
  const t1 = M.createMemory({ rand: rng(7), themeSeed: 0 }).S.theme, t2 = M.createMemory({ rand: rng(7), themeSeed: 1 }).S.theme; ok(t1 !== t2, 'memory: themeSeed wisselt thema');
}
{
  section('ruimte');
  const U = await G('ruimte');
  ok(Object.keys(U.PLANET_DB).length >= 11 && U.PLANETS.length === 7, 'ruimte: planeten');
  for (const [id, rt] of Object.entries(U.ROUTES)) { ok(rt.legs.every(k => U.PLANET_DB[k]), 'ruimte: route ' + id + ' heeft geldige planeten'); }
  const run = (route, seed, acc = 0.9) => { const r = rng(seed), m = U.createSpace({ level: 2, rand: r, route }); let t = 0; while (m.S.phase !== 'won' && m.S.phase !== 'over' && t < 2000) { if (m.S.phase === 'land') { for (const u of U.SPACE_UPG) while (m.buy(u.id) && false) {} m.depart(); continue; } if (Math.floor(t * 2) % 2 === 0) m.answer(r() < acc); m.tick(0.5); t += 0.5; } return m; };
  for (const route of ['kort', 'verre', 'klassiek']) { let w = 0; for (let s = 1; s <= 20; s++) if (run(route, s).S.phase === 'won') w++; console.log('   ruimte', route, 'gewonnen', w + '/20'); ok(w >= 8, 'ruimte: route ' + route + ' te zwaar (' + w + ')'); }
  const m = U.createSpace({ rand: rng(2), route: 'verre' }); ok(m.planets.length === 12 && m.S.cap === 840, 'ruimte: verre reis'); ok(m.finalScore() === 0, 'ruimte: score start 0');
  const m2 = U.createSpace({ rand: rng(2) }); m2.S.crystals = 500; const d0 = m2.drain(); ok(m2.buy('solar') && m2.drain() < d0, 'ruimte: zonnepanelen verlagen verbruik'); ok(m2.buy('radar') && m2.warn() === 10, 'ruimte: radar verlengt waarschuwing');
}
{
  section('bom');
  const B = await G('bom');
  ok(B.BOMB_ALL.length === 8 && new Set(B.BOMB_ALL.map(b => b.ic)).size === 8, 'bom: 8 bots met eigen icoon');
  for (let k = 0; k < 8; k++) ok(new Set(B.botTable(k).map(b => b.name)).size === 4, 'bom: tafel ' + k + ' heeft 4 verschillende bots');
  ok(B.botTable(0)[0].name === 'Bram' && B.botTable(4)[0].name === 'Noor', 'bom: botSet schuift op');
  const m = B.createBomb({ rand: rng(3), mode: 'blitz', botSet: 4 }); ok(m.S.rounds === 5 && m.S.players.length === 5 && m.S.players[1].name === 'Noor', 'bom: blitz-modus');
  ok(B.createBomb({ rand: rng(3), mode: 'blitz' }).S.qTime < B.createBomb({ rand: rng(3) }).S.qTime, 'bom: blitz kortere vraagtijd');
  const w = B.createBomb({ rand: rng(5), mode: 'wissel' }); ok(w.S.type === 'bom', 'bom: ronde 1 gewone bom'); w.S.round = 1; w.startRound(); ok(w.S.type === 'ijs', 'bom: ronde 2 ijsbom');
  const f1 = B.createBomb({ rand: rng(5), mode: 'wissel' }); f1.S.round = 2; f1.startRound(); const turbo = f1.S.type; f1.S.fuse = 10; f1.tick(1); ok(turbo === 'turbo' && f1.S.fuse < 9, 'bom: turbobom brandt sneller (' + f1.S.fuse + ')');
  const i1 = B.createBomb({ rand: rng(5), mode: 'wissel' }); i1.S.round = 1; i1.startRound(); i1.S.fuse = 10; i1.tick(1); ok(i1.S.fuse > 9, 'bom: ijsbom brandt langzamer (' + i1.S.fuse + ')');
  // volledige spelletjes eindigen altijd
  for (const mode of ['klassiek', 'wissel', 'blitz']) { let fin = 0; for (let s = 1; s <= 10; s++) { const r = rng(s), g = B.createBomb({ rand: r, mode, botSet: s }); let n = 0; while (!g.done() && n++ < 20000) { if (g.S.phase === 'round-end') { g.nextRound(); continue; } if (g.S.holder === 0 && g.S.players[0].alive) { g.answer(r() < 0.8); const c = g.alive().filter(p => !p.you); if (c.length) g.passTo(c[0].id); } g.tick(0.1); } if (g.done()) fin++; } ok(fin === 10, 'bom: modus ' + mode + ' loopt nooit vast (' + fin + '/10)'); }
}
{
  section('slang');
  const S = await G('slang');
  ok(Object.keys(S.FOODS).length >= 5 && Object.keys(S.SKINS).length >= 5 && S.SHOP.length >= 8, 'slang: voer/skins/winkel');
  const g = new S.SnakeGame({ rand: rng(2), mode: 'doolhof' }); ok(g.L.obs > S.LEVELS[0].obs && g.wrap === false || g.L.wrap === false, 'slang: doolhof = rotsen, geen wrap'); ok(g.maxLv === 5, 'slang: doolhof 5 levels');
  const e = new S.SnakeGame({ rand: rng(2), mode: 'oneindig' }); ok(e.maxLv === Infinity, 'slang: eindeloos'); const lv7 = S.levelDef(7, 'oneindig'); ok(lv7.goal > 12 && lv7.tick < 142 && lv7.tick >= 88, 'slang: levels worden sneller');
  const kinds = new Set(); const f = new S.SnakeGame({ rand: rng(3) }); for (let i = 0; i < 20; i++) kinds.add(f.spawnFood().k); ok(kinds.has('golden') && kinds.size >= 5, 'slang: alle voersoorten komen voor (' + [...kinds] + ')');
  f.apple = { x: f.snake[0].x + 1, y: f.snake[0].y, k: 'grapes' }; f.dir = { x: 1, y: 0 }; f.nd = { x: 1, y: 0 }; const len = f.snake.length, ev = f.step(); ok(ev.some(x => x.e === 'apple' && x.k === 'grapes') && f.grow >= 2, 'slang: druiven laten 2 groeien');
  f.gems = 500; ok(f.buy('clover') && f.buy('compass'), 'slang: nieuwe winkelitems te koop');
  ok(new S.SnakeGame({ rand: rng(1), skin: 'goud' }).skin === 'goud' && new S.SnakeGame({ rand: rng(1), skin: 'xx' }).skin === 'groen', 'slang: skin valideert');
}
{
  section('boerderij');
  const F = await G('boerderij');
  ok(F.CROPS.length >= 9 && F.ANIMALS.length >= 7 && Object.keys(F.FARM_MODES).length === 3, 'boerderij: inhoud');
  ok(F.CROPS.every(c => c.ic) && F.ANIMALS.every(a => a.ic), 'boerderij: alles heeft een icoon');
  const f = new F.Farm({ rand: rng(2), mode: 'markt' }); ok(f.season === 240 && f.orders.length === 5, 'boerderij: marktdag'); const f0 = new F.Farm({ rand: rng(2) }); ok(f0.orders.length === 3 && f0.season === 360, 'boerderij: seizoen');
  const ordF = new F.Farm({ rand: rng(9), mode: 'markt' }).orders[0], ordN = new F.Farm({ rand: rng(9) }).orders[0]; ok(ordF.reward > ordN.reward * 1.5 || ordF.item !== ordN.item, 'boerderij: markt-opdrachten dubbel');
  const w = new F.Farm({ rand: rng(3), mode: 'weer' }); w.plant(0, 'wortel'); w.weather = 'hagel'; w.tick(5); ok(w.plots[0].t === 0, 'boerderij: hagel stopt groei'); w.weather = 'zon'; w.wxT = 99; w.tick(2); ok(Math.abs(w.plots[0].t - 3) < 1e-9, 'boerderij: zon x1,5');
  const seen = new Set(); const w2 = new F.Farm({ rand: rng(4), mode: 'weer' }); for (let i = 0; i < 4000; i++) { w2.tick(1); if (w2.weather) seen.add(w2.weather); } ok(seen.size >= 3, 'boerderij: wisselend weer (' + [...seen] + ')');
  const c = new F.Farm({ rand: rng(1) }); c.earned = 3600; ok(c.level === 8 && c.unlocked('tarwe'), 'boerderij: tarwe ontgrendelt op hoog level'); c.coins = 5000; ok(c.canBuyAnimal('paard') && c.buyAnimal('paard'), 'boerderij: paard kopen'); const c2 = new F.Farm({ rand: rng(1) }); c2.coins = 5000; ok(!c2.canBuyAnimal('varken'), 'boerderij: varken vergrendeld op level 1');
  ok(c.barn.honing === 0 && c.barn.truffel === 0 && 'eendenei' in c.barn, 'boerderij: nieuwe producten in de schuur');
}
{
  section('vlieg');
  const V = await G('vlieg');
  ok(V.NEW_STAGES.length === 4 && V.STAGES.length === 5, 'vlieg: luchten');
  const wd = V.worldStages({ name: 'Bos', bg: ['#a7f3d0', '#fef9c3'], deco: ['tree', 'fox', 'owl'], mood: 'light' }); ok(wd.length === 4 && wd.every(s => s.paint && s.kinds.includes('fox')), 'vlieg: wereldluchten');
  for (const [mode, st] of [['klassiek', null], ['avontuur', null], ['wereld', wd]]) {
    let wins = 0; for (let seed = 1; seed <= 12; seed++) {
      const r = rng(seed), g = new V.Flight({ rand: r, mode, stages: st }); let n = 0;
      while (g.state !== 'won' && g.state !== 'over' && n++ < 200000) {
        if (g.state === 'play') { const near = g.items.filter(i => i.kind !== 'gate' && !i.hit && !i.got && i.x - g.d > -10 && i.x - g.d < 150); const bad = new Set(near.filter(i => i.kind === 'ob').map(i => i.lane)); if (bad.has(g.lane)) { const o = [0, 1, 2].filter(l => !bad.has(l)).sort((a, b) => Math.abs(a - g.lane) - Math.abs(b - g.lane))[0]; if (o !== undefined && o !== g.lane) g.move(Math.sign(o - g.lane)); } for (const e of g.update(1 / 30)) if (e && e.e === 'gate') g.answer(r() < 0.8); }
        else if (g.state === 'hangar') { for (const h of g.offers()) { while (g.buy(h.id) && h.id !== 'heart' && h.id !== 'shield') {} } g.nextStage(); } else break;
      }
      ok(n < 200000, 'vlieg: vast in modus ' + mode); if (g.state === 'won') wins++; ok(g.stages.length === (mode === 'klassiek' ? 5 : 4), 'vlieg: aantal luchten ' + mode);
    }
    console.log('   vlieg', mode, 'gewonnen', wins + '/12'); ok(wins >= 4, 'vlieg: modus ' + mode + ' te zwaar (' + wins + ')');
  }
  const g = new V.Flight({ rand: rng(2) }); g.up.bell = 2; g.state = 'ask'; g.cur = { state: 'closed' }; const s0 = g.stars; g.answer(true); ok(g.stars - s0 >= 7, 'vlieg: poortbel geeft extra sterren (' + (g.stars - s0) + ')');
  const cl = new V.Flight({ rand: () => 0.01 }); cl.up.clover = 2; cl.state = 'ask'; cl.cur = { state: 'closed' }; cl.answer(false); ok(cl.good === 1 && cl.freeGate === 1, 'vlieg: geluksklaver geeft gratis poort');
}
{
  section('schat');
  const D = await G('schat');
  ok(Object.keys(D.KINDS).length >= 8 && D.NEW_DEPTHS.length === 4 && D.SHOP.length >= 8, 'schat: inhoud');
  const wd = D.worldDepths({ name: 'Bos', bg: ['#a7f3d0', '#fef9c3'], ground: '#2f7d32', accent: '#16a34a' }); ok(wd.length === 4 && wd.every(d => d.top && d.bot && d.open), 'schat: wereldgrotten');
  for (const [mode, dp] of [['klassiek', null], ['expeditie', null], ['wereld', wd]]) {
    let wins = 0, kinds = new Set(); for (let seed = 1; seed <= 15; seed++) {
      const r = rng(seed), g = new D.Dig({ rand: r, mode, depths: dp }); let n = 0;
      g.tiles.forEach(t => kinds.add(t.kind));
      while (g.state === 'play' && n++ < 5000) {
        const un = g.tiles.map((t, i) => i).filter(i => !g.tiles[i].open); const pick = (g.mapShown && !g.tiles[g.exit].open) ? g.exit : un[Math.floor(r() * un.length)];
        if (g.energy < g.costOf(pick)) { g.recharge(r() < 0.8); continue; }
        const x = g.dig(pick); if (x.r === 'chest') g.chest(pick, r() < 0.8); else if (x.r === 'trap') g.trap(pick, r() < 0.8); else if (x.r === 'ladder') { g.descend(); g.tiles.forEach(t => kinds.add(t.kind)); }
        if (g.energy < 2) g.recharge(r() < 0.8);
      }
      ok(n < 5000, 'schat: vast in modus ' + mode); if (g.state === 'won') wins++;
    }
    console.log('   schat', mode, 'gewonnen', wins + '/15'); ok(wins >= 5, 'schat: modus ' + mode + ' te zwaar (' + wins + ')');
    if (mode === 'klassiek') ok(['shell', 'medal', 'ring', 'crystal'].every(k => kinds.has(k)), 'schat: nieuwe schatsoorten komen voor (' + [...kinds] + ')');
  }
  const g = new D.Dig({ rand: rng(2) }); g.gold = 1000; const m0 = g.mult(); ok(g.buy('magnet') && g.mult() > m0, 'schat: goudmagneet'); g.buy('clover'); ok(g.up.clover === 1, 'schat: klaver');
}
{
  section('escape');
  const E = await G('escape');
  ok(E.NEW_ROOMS.length === 4 && E.PERKS.length >= 8 && E.ROOMS.length === 5, 'escape: kamers/perks');
  ok(E.ROOMS.every(r => r.icons && r.icons.length === 8) && E.NEW_ROOMS.every(r => r.icons.length === 8), 'escape: iconen per kamer');
  const wr = E.worldRooms({ name: 'Bos', bg: ['#a7f3d0', '#fef9c3'], deco: ['tree', 'fox', 'owl'], ground: '#2f7d32' }); ok(wr.length === 4 && wr[0].icons.every(Boolean), 'escape: wereldkamers');
  for (const [mode, rl] of [['klassiek', null], ['nieuw', null], ['wereld', wr]]) {
    let solved = 0, safes = 0; for (let seed = 1; seed <= 15; seed++) {
      const r = rng(seed), g = new E.EscapeRun({ rand: r, mode, roomsList: rl }); let n = 0;
      while (g.state !== 'won' && n++ < 4000) {
        if (g.state === 'perk') { g.pickPerk(g.offers()[0].id); continue; }
        if (g.spots.some(s => s.role === 'safe')) safes++;
        const sf = g.spots.findIndex(s => !s.done && s.role === 'safe'); if (sf >= 0 && r() < 0.5) { g.solve(sf, r() < 0.8); continue; }
        const need = g.spots.map((s, i) => i).filter(i => !g.spots[i].done && (g.spots[i].role === 'digit' || g.spots[i].role === 'key'));
        if (!need.length) { g.enterCode(g.code.join('')); g.tryDoor(); continue; }
        g.solve(need[0], r() < 0.8);
      }
      if (g.state === 'won') solved++; ok(n < 4000, 'escape: vast in ' + mode);
    }
    ok(solved === 15, 'escape: modus ' + mode + ' altijd te winnen (' + solved + ')'); ok((mode === 'klassiek') === (safes === 0), 'escape: kluizen alleen in nieuwe modi (' + mode + ' ' + safes + ')');
  }
  const g = new E.EscapeRun({ rand: rng(4), mode: 'nieuw' }); g.startRoom(1); const sf = g.spots.findIndex(s => s.role === 'safe'); ok(sf >= 0 && g.spots[sf].need === 2, 'escape: kluis heeft 2 stappen'); const h0 = g.hints, sc0 = g.score;
  ok(g.solve(sf, true).r === 'progress' && g.solve(sf, false).r === 'safefail' && g.spots[sf].prog === 0, 'escape: fout reset kluis'); g.solve(sf, true); ok(g.solve(sf, true).r === 'safe' && g.hints === h0 + 1 && g.score === sc0 + 25, 'escape: kluis geeft hint en punten');
  const p = new E.EscapeRun({ rand: rng(4) }); p.perks = { shield: 1 }; p.startRoom(0); const w0 = p.wrong; p.enterCode('abc'); ok(p.wrong === w0, 'escape: codeschild'); const p2 = new E.EscapeRun({ rand: rng(4) }); p2.perks = { pick: 1 }; p2.startRoom(2); ok(p2.spots.find(s => s.role === 'key').need === 1, 'escape: dietrich');
}
{
  section('miljonair');
  const Q = await G('miljonair');
  ok(Object.keys(Q.SHOW_MODES).length === 3 && Q.FRIENDS.length === 6 && Object.keys(Q.LIFELINES).length === 6, 'miljonair: inhoud');
  const s = new Q.Show({ rand: rng(2), mode: 'sprint' }); ok(s.lad.length === 10 && s.life.fifty && !s.life.swap && s.hard === 1, 'miljonair: sprint'); for (let i = 0; i < 10; i++) s.correct(); ok(s.state === 'won' && s.result() === 100000, 'miljonair: sprint 100.000');
  const sp = new Q.Show({ rand: rng(2), mode: 'sprint' }); for (let i = 0; i < 5; i++) sp.correct(); ok(sp.floor === 1000 && sp.hard === 2, 'miljonair: veilige trap sprint (' + sp.floor + ')'); ok(sp.time() < new Q.Show({ rand: rng(2) }).time(), 'miljonair: sprint kortere tijd');
  const pl = new Q.Show({ rand: rng(2), mode: 'plus' }); ok(Object.keys(pl.life).length === 6 && pl.use('swap') && !pl.use('swap'), 'miljonair: plus-hulplijnen eenmalig');
  const k = new Q.Show({ rand: rng(2) }); ok(k.hard === 1 && (k.step = 5, k.hard === 2) && (k.step = 10, k.hard === 3), 'miljonair: moeilijkheidstrap klassiek ongewijzigd'); ok(Q.safeFloor(10) === 32000 && Q.bankAfter(15) === 1000000, 'miljonair: standaard ladder');
}

/* ---------- UI-rooktest per modus ---------- */
async function smoke(id, modeName, o = {}) {
  const mod = await G(id); const host = new El('div'); const env = mkEnv(o.env || {});
  const errs = []; const oe = console.error; console.error = (...a) => { errs.push(a.join(' ')); };
  let inst, threw = null, sawGear = false, sawBackdrop = false;
  const r = rng(21);
  try {
    inst = mod.default.create(host, env);
    sawGear = findAll(host, e => /gx-gear/.test(e.className)).length === 1;
    sawBackdrop = findAll(host, e => e.tagName === 'CANVAS' && /gx-bd/.test(e.className)).length === 1;
    if (modeName) { const mb = findAll(host, e => e.tagName === 'BUTTON' && e.textContent.startsWith(modeName))[0]; if (!mb) throw new Error('modus-knop ' + modeName + ' niet gevonden'); mb.click(); }
    const st = findAll(host, e => e.tagName === 'BUTTON' && /Tik om te beginnen/.test(e.textContent))[0]; if (!st) throw new Error('startknop niet gevonden'); st.click();
    const total = o.seconds || 600;
    for (let t = 0; t < total * 1000 && env.ends.length === 0; t += 250) {
      await advance(250);
      const bs = findAll(host, e => e.tagName === 'BUTTON' && !e.disabled && visible(e) && !/gx-gear/.test(e.className) && !(o.avoid && o.avoid.test(e.textContent)));
      const pref = bs.filter(b => /beginnen|volgend|verder|start|afronden|door|klaar/i.test(b.textContent));
      const pool = pref.length && r() < 0.8 ? pref : bs;
      if (pool.length) pool[Math.floor(r() * pool.length)].click();
      for (const c of findAll(host, e => /(me-card|bo-p)( |$)/.test(e.className)).filter(() => r() < 0.3).slice(0, 2)) c.click();
      for (const c of findAll(host, e => new RegExp('(lsl-t|lbo-plot|lsc-t|les-sp|les-door)( |$)').test(e.className)).filter(() => r() < 0.3).slice(0, 3)) c.click();
      if (o.keys) document.keydown(o.keys[Math.floor(r() * o.keys.length)]);
    }
  } catch (e) { threw = e; }
  console.error = oe;
  ok(!threw, id + '/' + modeName + ': smoke gooide ' + (threw && threw.stack));
  ok(errs.length === 0, id + '/' + modeName + ': console.error ' + errs.slice(0, 2).join(' | '));
  ok(sawGear, id + ': ⚙-knop aanwezig'); ok(sawBackdrop, id + ': wereld-achtergrond (canvas) aanwezig');
  try { inst && inst.destroy(); } catch (e) { ok(false, id + ': destroy gooide ' + e.message); }
  await advance(500);
  ok(pending() === 0, id + '/' + modeName + ': na destroy nog ' + pending() + ' timers/rAF');
  ok(env.ends.length <= 1, id + ': end > 1x');
  const heads = findAll(globalThis.document.head, e => e.tagName === 'STYLE').length; ok(heads === 0, id + '/' + modeName + ': <style> opgeruimd (' + heads + ')');
  return { ended: env.ends.length === 1, end: env.ends[0], env };
}
const runs = [
  ['memory', 'Flitsgeheugen', { seconds: 900 }], ['memory', 'Express', { seconds: 900 }], ['ruimte', 'Korte hop', { seconds: 900 }], ['ruimte', 'Verre reis', { seconds: 1000 }],
  ['bom', 'Bommen-mix', { seconds: 900 }], ['bom', 'Blitz', { seconds: 900 }],
  ['slang', 'Eindeloos', { seconds: 800, keys: ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'] }], ['slang', 'Rotsendoolhof', { seconds: 600, keys: ['ArrowLeft', 'ArrowUp'] }],
  ['boerderij', 'Marktdag', { seconds: 600 }], ['boerderij', 'Wisselend weer', { seconds: 800 }],
  ['vlieg', 'Avontuurlijke route', { seconds: 900, keys: ['ArrowUp', 'ArrowDown'] }], ['vlieg', 'Mijn wereld', { seconds: 900, keys: ['ArrowUp', 'ArrowDown'] }],
  ['schat', 'Nieuwe grotten', { seconds: 900 }], ['schat', 'Mijn wereld', { seconds: 900 }],
  ['escape', 'Nieuwe kamers', { seconds: 900 }], ['escape', 'Mijn wereld', { seconds: 900 }],
  ['miljonair', 'Hulplijnen-plus', { seconds: 900 }], ['miljonair', 'Sprintshow', { seconds: 900 }],
];
for (const [id, name, o] of runs) { const r = await smoke(id, name, o); console.log('   ' + id + ' / ' + name + ' ended=' + r.ended); }

console.log(fails ? '\n' + fails + ' FOUTEN' : '\nAlles OK');
process.exit(fails ? 1 : 0);
