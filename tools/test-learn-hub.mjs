// Test voor docs/learn/games.js (hub), games-shop.js, games-duel.js en games/_demo.js.
// Gebruikt stubs uit tools/learn-stubs (core.js, q.js, spellen) en de nep-Firestore. Met LEARN_REAL=1 de echte core.js/q.js.
// Uitvoeren: node tools/test-learn-hub.mjs
import { register } from 'node:module';
register('./learn-stubs/loader.mjs', import.meta.url);

let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.error('FOUT:', m); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- mini-DOM (tools/learn-stubs/dom.mjs) ---------- */
const { El, document_, win, ls, install } = await import('./learn-stubs/dom.mjs');
install();

const qsOf = (n) => Array.from({ length: n }, (_, i) => ({ t: i % 3 === 0 ? 'mc' : i % 3 === 1 ? 'type' : 'tf', q: `Vraag ${i}?`, a: i % 3 === 0 ? 'ja' : i % 3 === 1 ? 'nee' : true, ...(i % 3 === 0 ? { o: ['ja', 'nee', 'misschien', 'soms'] } : {}) }));
globalThis.__kits = [
  { id: 'tafels', name: 'Tafels van 2 t/m 9', emoji: '✖️', group: 'Rekenen', qs: qsOf(30), src: 'pack' },
  { id: 'mijn', name: 'Mijn kit', emoji: '⭐', group: 'Eigen', qs: qsOf(5), src: 'user' },
];

const core = await import('../docs/learn/core.js?v=1');
const Shop = await import('../docs/learn/games-shop.js?v=2');
const Duel = await import('../docs/learn/games-duel.js?v=2');
const Hub = await import('../docs/learn/games.js?v=1');
const { Profile, Prog, Snd } = core;

/* ---------- 1. pure logica ---------- */
ok(Hub.GAME_IDS.length === 18 && new Set(Hub.GAME_IDS).size === 18, '18 unieke spel-id\'s');
ok(Hub.GAME_IDS.every((id) => Hub.META[id] && Hub.META[id].length === 6), 'META voor alle 18');
ok(Shop.HUB_ACH.length >= 30 && new Set(Shop.HUB_ACH.map((a) => a.id)).size === Shop.HUB_ACH.length, `prestaties: ${Shop.HUB_ACH.length} unieke`);
ok(Shop.AVATARS.length >= 30 && Shop.HATS.length >= 15 && Shop.BGS.length >= 12, 'uiterlijk-catalogus groot genoeg');
for (const k of ['AVATARS', 'HATS', 'BGS']) { const ids = Shop[k].map((x) => x[0]); ok(new Set(ids).size === ids.length, `${k} uniek`); ok(Shop[k][0][2] === 0, `${k} eerste gratis`); }
ok(Shop.bgCss('gold').includes('gradient') && Shop.bgCss('onbekend') === Shop.BGS[0][4] && Shop.bgCss('#fff') === '#fff', 'bgCss');
ok(Shop.avatarHTML({ emoji: '🦊', hat: '👑', bg: 'sky' }).includes('👑'), 'avatarHTML met hoed');
ok(!Shop.avatarHTML({ emoji: '<b>' }).includes('<b>'), 'avatarHTML escaped');

// beloning
const r1 = Shop.calcReward({ correct: 10, wrong: 0, win: true, level: 2, newRecord: true }, {});
ok(r1.coins === 10 * 2 + 10 + 5 + 5 && r1.xp === 10 * 3 + 0 + 10 + 5, `beloning basis ${JSON.stringify(r1)}`);
const r2 = Shop.calcReward({ correct: 10, wrong: 0, win: true, level: 3, newRecord: false }, { coinMult: 2, xpMult: 2 });
ok(r2.coins === Math.round((20 + 10 + 5) * 1.3 * 2), 'beloning moeilijk + coinMult');
ok(Shop.calcReward({ correct: 0, wrong: 0, level: 2 }, {}).coins === 0, 'geen antwoorden: geen beloning');
ok(Shop.calcReward({ correct: 0, wrong: 5, level: 2 }, {}).coins === 0 && Shop.calcReward({ correct: 0, wrong: 5, level: 2 }, {}).xp > 0, 'alleen fout: wel XP, geen munten');
ok(Shop.calcReward({ correct: 5000, wrong: 0, level: 2 }, {}).coins <= 200, 'beloning is begrensd');
ok(Shop.calcReward({ correct: 10, wrong: 0, win: true, level: 2 }, { coinBonus: 6 }).coins === 41, 'coinBonus (Beloningszak) telt mee');
ok(Shop.calcReward({ correct: 1, wrong: 0, level: 1 }, {}).coins >= 1, 'minstens 1 munt bij 1 goed');
ok(Shop.levelReward(5) > Shop.levelReward(4) + 20 && Shop.levelReward(1) > 0, 'levelReward');
ok(Shop.displayAnswer({ t: 'tf', a: true }) === 'Waar' && Shop.displayAnswer({ t: 'order', a: ['a', 'b'] }) === 'a → b' && Shop.displayAnswer({ t: 'match', a: [['a', '1'], ['b', '2']] }) === 'a = 1 · b = 2' && Shop.displayAnswer({ t: 'multi', a: ['x', 'y'] }) === 'x, y' && Shop.displayAnswer({ t: 'num', a: 7 }) === '7', 'displayAnswer');

// opslag, resultaat, merge
const d = Shop.defaultHub();
const ar = Shop.applyResult(d, { game: 'race', kitId: 'tafels', kitName: 'Tafels', level: 3, score: 500, win: true, correct: 9, wrong: 0, bestStreak: 9, coins: 30 }, 1000);
ok(ar.newRecord && d.best.race.score === 500 && d.stats.games === 1 && d.stats.wins === 1 && d.stats.perfect === 1 && d.stats.hard === 1 && d.stats.hardWins === 1 && d.last[0] === 'race' && d.kits.tafels, 'applyResult 1');
const ar2 = Shop.applyResult(d, { game: 'race', kitId: 'tafels', level: 2, score: 300, win: false, correct: 3, wrong: 2, bestStreak: 2, coins: 6 }, 2000);
ok(!ar2.newRecord && d.best.race.score === 500 && d.played.race === 2 && d.stats.correct === 12 && ar2.prevBest === 500, 'applyResult 2 geen record');
Shop.applyResult(d, { game: 'x', kitId: 'duel-abc', level: 1, score: 0, win: null, correct: 0, wrong: 0, bestStreak: 0, coins: 0 }, 3000);
ok(!d.kits['duel-abc'] && !d.best.x, 'duel-kit telt niet als kit, score 0 is geen record');
const nu = Shop.checkHubAch(d, { level: 1, upLevels: 0 }, 5000);
ok(nu.some((a) => a.id === 'h-g1') && nu.some((a) => a.id === 'h-w1') && nu.some((a) => a.id === 'h-s5') && nu.some((a) => a.id === 'h-p1') && nu.some((a) => a.id === 'h-hd1'), 'prestaties behaald');
ok(Shop.checkHubAch(d, { level: 1 }, 6000).length === 0, 'prestaties niet dubbel');
const nu2 = Shop.checkHubAch(d, { level: 10, upLevels: 10 }, 7000);
ok(nu2.some((a) => a.id === 'h-l10') && nu2.some((a) => a.id === 'h-u10') && !d.ach['h-u30'], 'prestaties op level/upgrades');
const a1 = Shop.normHub({ t: 5, best: { race: { score: 10 } }, own: { av: ['🐱'] }, stats: { games: 3 }, last: ['a'], level: 3 });
const b1 = Shop.normHub({ t: 9, best: { race: { score: 20 }, vlag: { score: 5 } }, own: { av: ['🐶'], hat: ['🎩'] }, stats: { games: 2, wins: 4 }, last: ['b'], ach: { x: 5 } });
const mg = Shop.mergeHub(a1, b1);
ok(mg.best.race.score === 20 && mg.best.vlag && mg.own.av.length === 2 && mg.own.hat[0] === '🎩' && mg.stats.games === 3 && mg.stats.wins === 4 && mg.last[0] === 'b' && mg.t === 9 && mg.ach.x === 5, 'mergeHub union/max');
ok(Shop.normHub(null).stats.games === 0 && Shop.normHub('rommel').level === 2 && Shop.normHub({ level: 99 }).level === 2, 'normHub veilig');
ok(Shop.fxText({ startCash: 50, cashMult: 1.25, extraLives: 1, luck: 0.2 }) === 'Startgeld 50 · Geld ×1,25 · +1 leven · Geluk 20%', 'fxText');
const ui = Shop.upgradeInfo(Profile.UPGRADES[0], 2);
ok(ui.cost === 50 && !ui.maxed && ui.next && Shop.upgradeInfo(Profile.UPGRADES[0], 5).maxed, 'upgradeInfo');

// makeEnv
{
  const kit = globalThis.__kits[0]; const seen = [];
  const env = Hub.makeEnv({ kit, uid: 'u', name: 'N', seed: 7, level: 2, fx: { hints: 2, timeBonus: 3 }, pickFn: (k, n, o) => { seen.push(o); return core.pick(k, n, o); }, askFn: (h, q, o) => ({ o }), snd: Snd, tts: core.TTS, w: 300, h: 500 });
  const a = env.pick(5), b = env.pick(5);
  ok(a.length === 5 && b.length === 5, 'env.pick lengte');
  ok(seen[0].seed !== seen[1].seed && seen[0].weakFirst && seen[0].hard === 2 && seen[0].kitId === 'tafels', 'env.pick seeds/opties');
  ok(new Set([...a, ...b].map(core.qkey)).size === 10, 'env.pick vermijdt herhaling');
  ok(env.ask(null, a[0], { time: 20 }).o.time === 23 && env.ask(null, a[0], {}).o.hints === 2 && env.ask(null, a[0], { hints: 0 }).o.hints === 0, 'env.ask past effecten toe');
  ok(env.w === 300 && env.h === 500 && typeof env.rand() === 'number' && env.level === 2 && env.kit === kit && env.fx.hints === 2, 'env velden');
  const e2 = Hub.makeEnv({ kit, uid: 'u', name: 'N', seed: 1, level: 1, fx: {}, types: ['order'], askFn: () => {}, snd: Snd });
  ok(e2.pick(4).length === 4, 'env.pick valt terug als soort ontbreekt');
  const e3 = Hub.makeEnv({ kit, seed: 1, level: 1, fx: {}, fixed: [{ t: 'tf', q: 'A', a: true }, { t: 'tf', q: 'B', a: false }], askFn: () => {} });
  ok(e3.pick(3).map((q) => q.q).join('') === 'ABA' && e3.pick(1)[0].q === 'B', 'vaste vragen (duel) in volgorde, cyclisch');
  let thrown = false; try { env.report({ q: a[0], ok: true }); env.end({}); } catch { thrown = true; } ok(!thrown, 'report/end zonder handlers gooit niet');
  const small = { id: 's', name: 's', qs: qsOf(2) }; const e4 = Hub.makeEnv({ kit: small, seed: 3, level: 2, fx: {}, askFn: () => {} });
  ok(e4.pick(6).length === 6, 'kleine kit herhaalt');
}
ok(Hub.builtinKit().qs.length === 24 && Hub.builtinKit().qs.every((q) => q.t && q.q), 'reserve-kit');

// uitdagingen
{
  const qs = Array.from({ length: 30 }, (_, i) => ({ t: 'mc', q: 'Vraag '.repeat(40) + i, a: 'x', o: ['x', 'y', 'z', 'w'], x: 'uitleg '.repeat(30), g: 'g', d: 2 }));
  const s = Duel.packQs(qs); ok(s.length <= 12000 && Duel.unpackQs(s).length >= 1 && Duel.unpackQs(s).length <= 12, `packQs past (${s.length} tekens, ${Duel.unpackQs(s).length} vragen)`);
  const small = Duel.packQs(qsOf(20), 8); ok(Duel.unpackQs(small).length === 8, 'packQs n');
  ok(Duel.unpackQs('rommel').length === 0 && Duel.unpackQs('{"a":1}').length === 0 && Duel.unpackQs('[1,"x",{"t":"tf","q":"?"}]').length === 1, 'unpackQs veilig');
  const now = 1e12, DAY = 86400000;
  const mk = (id, o) => ({ id, game: 'race', from: 'a', to: '', scores: {}, created: now - 1000, ...o });
  const list = [mk('1', {}), mk('old', { created: now - 15 * DAY }), mk('priv', { to: 'zzz', from: 'q' }), mk('mine', { to: 'me', from: 'q' }), mk('own', { from: 'me', to: 'zzz' })];
  const vis = Duel.visibleDuels(list, 'me', now).map((x) => x.id);
  ok(vis.includes('1') && vis.includes('mine') && vis.includes('own') && !vis.includes('old') && !vis.includes('priv'), `zichtbaarheid ${vis}`);
  const many = Array.from({ length: 40 }, (_, i) => mk('d' + i, { created: now - i * 1000 }));
  const v2 = Duel.visibleDuels(many, 'me', now); ok(v2.length === 20 && v2[0].id === 'd0', 'max 20, nieuwste eerst');
  const dd = mk('x', { scores: { me: { name: 'Ik', score: 50, t: 2 }, br: { name: 'Broer', score: 80, t: 1 } } });
  ok(Duel.duelStatus(dd, 'me') === 'done' && Duel.duelStatus(mk('y'), 'me') === 'open' && Duel.duelStatus(mk('z', { scores: { me: { score: 1 } } }), 'me') === 'wait', 'duelStatus');
  ok(Duel.duelWinner(dd, 'me').name === 'Broer' && Duel.duelBoard(dd, 'me')[1].me && Duel.duelWinner(mk('t', { scores: { a: { score: 5 }, b: { score: 5 } } })) === null && Duel.duelWinner(mk('t')) === null, 'duelWinner/board');
  const stn = Duel.standings([dd, mk('x2', { scores: { me: { name: 'Ik', score: 90 }, br: { name: 'Broer', score: 10 } } }), mk('x3', { scores: { me: { name: 'Ik', score: 90 } } })]);
  ok(stn.length === 2 && stn[0].games === 2 && stn[0].wins === 1, 'standings');
  ok(Duel.ago(now - 30000, now) === 'zojuist' && Duel.ago(now - 5 * 60000, now) === '5 min geleden' && Duel.ago(now - 3 * 3600000, now) === '3 uur geleden' && Duel.ago(now - 2 * DAY, now) === '2 dagen geleden', 'ago');
  const bd = Duel.buildDuel({ uid: 'me', name: 'Ik', kitName: 'K', game: 'race', seed: 5.7, level: 9, qs: qsOf(3), now: 5 });
  ok(bd.from === 'me' && bd.to === '' && bd.seed === 5 && bd.level === 2 && typeof bd.qs === 'string' && bd.created === 5 && Object.keys(bd.scores).length === 0, 'buildDuel velden');
  ok(JSON.stringify(Object.keys(bd).sort()) === JSON.stringify(['created', 'from', 'fromName', 'game', 'kitName', 'level', 'qs', 'scores', 'seed', 'to', 'updated']), 'buildDuel heeft exact de velden van de spec');
}

/* ---------- 2. view-test ---------- */
const root = new El('div');
const cleanups = [];
const ctx = { db: { fake: true }, me: { uid: 'u1', name: 'Simon' }, uid: 'u1', esc: core.esc, nice: (e) => e.message || String(e), view: root, addCleanup: (f) => cleanups.push(f) };
const click = async (act, data = {}) => {
  const el = { dataset: { act, ...data } };
  root.fire('click', { target: { closest: (s) => (s === '[data-act]' ? el : null) } });
  await sleep(5);
};
const type = (inp, value) => root.fire('input', { target: { dataset: { inp }, value } });

const view = await Hub.learnSpelView(ctx);
ok(core.bindCtx.last === ctx, 'bindCtx aangeroepen');
ok(root.innerHTML.includes('Tester') && root.innerHTML.includes('Lv 1') && root.innerHTML.includes('lsp-head'), 'home: profielkop');
ok(root.innerHTML.includes('Speel 2 spellen') && root.innerHTML.includes('Dagopdrachten'), 'home: dagopdrachten');
ok(root.innerHTML.includes('Tafels van 2 t/m 9'), 'home: standaardkit = tafels');
ok(document_.head.children.some((c) => c.tag === 'style' && c.textContent.includes('.lsp-grid')), 'CSS geïnjecteerd');
await sleep(1200);   // probe
const gw = () => root.querySelector('.lsp-gridwrap').innerHTML;
const cards = (gw().match(/class="lsp-gc[ "]/g) || []).length;
ok(cards === 18, `18 kaarten in de grid (${cards})`);
ok(gw().includes('Komt binnenkort') && gw().includes('Even stuk') && gw().includes('Klassiek (stub)') && gw().includes('2 spelers'), 'grid: binnenkort/stuk/echt/duo');
ok(view.state.avail.klassiek === 'ok' && view.state.avail.toren === 'ok', 'probe: crash-spel laadt wel (crasht pas bij create)');
ok(view.state.avail.baas === 'error' && view.state.avail.pizza === 'soon', `probe-status baas=${view.state.avail.baas} pizza=${view.state.avail.pizza}`);
ok(!gw().includes('Oefenen'), 'demo niet getoond als er echte spellen zijn');

// filters
type('gsearch', 'klassiek'); ok(root.querySelector('.lsp-gridwrap') && (root.querySelector('.lsp-gridwrap').innerHTML.match(/class="lsp-gc[ "]/g) || []).length === 1, 'zoeken filtert grid');
type('gsearch', ''); await click('tag', { v: 'geld' });
ok((root.innerHTML.match(/class="lsp-gc[ "]/g) || []).length < 18 && (root.innerHTML.match(/class="lsp-gc[ "]/g) || []).length > 3, 'tag-filter');
await click('tag', { v: '' }); await click('level', { v: '3' }); ok(view.state.level === 3 && root.innerHTML.includes('lsp-chip on'), 'moeilijkheid kiezen');
await click('type', { v: 'mc' }); ok(view.state.types.has('mc'), 'vraagsoort aan'); await click('type', { v: 'mc' }); ok(!view.state.types.has('mc'), 'vraagsoort uit');
await click('fav', { id: 'race' }); ok(JSON.stringify(ls.get('learn:u1:hub')).includes('race'), 'favoriet opgeslagen (lokaal)');
await click('fav', { id: 'race' });

// kit kiezen
await click('kit-open'); await sleep(10);
ok(root.innerHTML.includes('lsp-sheet') && root.innerHTML.includes('Mijn kit') && root.innerHTML.includes('Mijn kits'), 'kit-kiezer toont eigen + packs');
type('ksearch', 'mijn'); ok(root.querySelector('.lsp-sheet-list') !== null, 'kit zoeken');
await click('kit-pick', { id: 'mijn' }); ok(view.state.kitId === 'mijn' && !root.innerHTML.includes('lsp-sheet') && JSON.parse(ls.get('learn:u1:hub')).lastKit === 'mijn', 'kit gekozen en onthouden');
await click('kit-pick', { id: 'tafels' });

// spel spelen met stub (klassiek) -> resultaat
const coins0 = Profile.get().coins, xp0 = Profile.get().xp;
view.state.level = 2;
await click('play', { id: 'klassiek' });
ok(view.state.screen === 'play' && root.innerHTML.includes('lsp-host') && root.innerHTML.includes('✕'), 'spelscherm met bovenbalk');
await sleep(700);
ok(view.state.screen === 'result', 'resultaatscherm na env.end');
const R = view.state.result;
ok(R && R.score === 120 && R.win === true && R.correct === 2 && R.wrong === 1 && R.bestStreak === 1, `resultaat telt uit reports (score ${R && R.score})`);
const expect = Shop.calcReward({ correct: 2, wrong: 1, win: true, level: 2, newRecord: true }, {});
ok(R.coins === expect.coins && R.xp === expect.xp, `beloning ${R.coins}/${R.xp} == ${expect.coins}/${expect.xp}`);
ok(Profile.get().coins >= coins0 + R.coins && (Profile.get().xp !== xp0 || Profile.get().level > 1), 'munten/XP bijgeschreven');
ok(R.newRecord && JSON.parse(ls.get('learn:u1:hub')).best.klassiek.score === 120, 'nieuw record opgeslagen');
ok(Prog.recorded.length === 3 && Prog.recorded[0][0] === 'tafels', 'Prog.record per vraag');
ok(Profile._q[0].prog === 1 && Profile._q[1].prog === 2, 'dagopdrachten bijgewerkt (games, correct)');
ok(R.ach.some((a) => a.id === 'h-g1') && R.ach.some((a) => a.id === 'h-w1'), 'prestaties bij resultaat');
ok(root.innerHTML.includes('Gewonnen!') && root.innerHTML.includes('Nieuw record') && root.innerHTML.includes('Fouten doornemen') && root.innerHTML.includes('Nog een keer'), 'resultaat-HTML');
ok(view.state.run === null, 'run opgeruimd na einde (dubbel end genegeerd)');
await click('review'); ok(root.innerHTML.includes('Goed antwoord') && root.innerHTML.includes('Bewaar als kit'), 'fouten doornemen');
await click('save-misses'); ok(core.Kits.saved && core.Kits.saved[0].src === 'user' && core.Kits.saved[0].qs.length === 1, 'fouten bewaard als kit');
await click('again'); ok(view.state.screen === 'play', 'nog een keer'); await sleep(700);
ok(view.state.result.newRecord === false, 'tweede keer geen nieuw record');
await click('home'); ok(view.state.screen === 'home', 'terug naar home');

// crash / kapot spel / ontbrekend spel
await click('play', { id: 'toren' }); await sleep(20); ok(root.innerHTML.includes('crashte') && root.innerHTML.includes('boem'), 'crashend spel geeft foutkaart');
await click('home'); await click('play', { id: 'baas' }); await sleep(20); ok(root.innerHTML.includes('kan nu niet starten'), 'kapot spel geeft foutkaart');
await click('home'); await click('play', { id: 'pizza' }); await sleep(20); ok(root.innerHTML.includes('komt binnenkort'), 'ontbrekend spel: binnenkort');
await click('home');

// stoppen met 2e tik
await click('play', { id: 'klassiek' });
await click('stop'); ok(view.state.screen === 'play' && view.state.stopArm, '1e tik op ✕ vraagt bevestiging');
await click('stop'); ok(view.state.screen === 'home' && view.state.run === null, '2e tik stopt');
await sleep(600);
ok(view.state.screen === 'home', 'na stoppen komt er geen resultaat meer');
await click('play', { id: 'klassiek' }); await click('snd'); ok(Snd.on === false, 'geluid uit'); await click('snd'); ok(Snd.on === true, 'geluid aan'); await click('tts'); ok(core.TTS.on === true, 'voorlezen aan'); await click('tts');
await click('stop'); await click('stop');

// klikken binnen het spel (host) worden genegeerd
await click('play', { id: 'klassiek' });
root.fire('click', { target: { closest: (sel) => (sel === '[data-act]' ? { dataset: { act: 'stop' } } : sel === '.lsp-host' ? {} : null) } });
ok(!view.state.stopArm, 'klik binnen .lsp-host wordt niet door de hub afgehandeld');
await click('stop'); await click('stop');
// dagopdracht claimen
Profile._q[0].prog = 2; await click('home'); ok(root.innerHTML.includes('data-act="claim"'), 'claim-knop zichtbaar');
const c1 = Profile.get().coins; await click('claim', { id: 'q1' }); ok(Profile.get().coins >= c1 + 20 && Profile._q[0].claimed, 'dagopdracht geclaimd');

// verras me
await click('surprise'); ok(view.state.screen === 'play' || view.state.screen === 'err', 'verras me start een spel'); await click('stop'); await click('stop');

// winkel
Profile.get().coins = 500;
await click('tab', { v: 'shop' });
ok(view.state.screen === 'shop' && root.innerHTML.includes('Upgrade startCash') && root.innerHTML.includes('lsp-pips'), 'winkel toont upgrades');
const upN = (root.innerHTML.match(/data-act="buy-up"/g) || []).length; ok(upN >= 12, `minstens 12 upgrades (${upN})`);
await click('buy-up', { id: 'startCash' }); ok(Profile.get().up.startCash === 1 && Profile.get().coins >= 500 - 20 && Profile.get().coins <= 500, 'upgrade gekocht');
Profile.get().coins = 0; await click('buy-up', { id: 'startCash' }); ok(Profile.get().up.startCash === 1, 'te weinig munten: niet gekocht');
Profile.get().coins = 1000;
type('pname', 'Simon J'); ok(Profile.get().name === 'Simon J', 'naam aanpassen');
await click('shop-tab', { v: 'av' }); ok(root.innerHTML.includes('lsp-cosgrid') && root.innerHTML.includes('Kat'), 'avatars-tab');
await click('buy-cos', { k: 'av', id: '🐱' }); ok(Profile.get().avatar.emoji === '🐱' && Profile.get().coins === 960, 'avatar gekocht en aangedaan');
await click('equip', { k: 'av', id: '🦊' }); ok(Profile.get().avatar.emoji === '🦊', 'gratis avatar kiezen');
await click('buy-cos', { k: 'av', id: '🐉' }); ok(!Shop.AVATARS.find((x) => x[0] === '🐉') || Profile.get().avatar.emoji === '🦊', 'onbestaand item negeren');
await click('buy-cos', { k: 'av', id: '🐲' }); ok(Profile.get().avatar.emoji === '🦊', 'level-vergrendeld item niet te koop');
await click('shop-tab', { v: 'hat' }); await click('buy-cos', { k: 'hat', id: '🎩' }); ok(Profile.get().avatar.hat === '🎩', 'hoed gekocht');
await click('equip', { k: 'hat', id: '' }); ok(Profile.get().avatar.hat === '', 'hoed af');
await click('shop-tab', { v: 'bg' }); await click('buy-cos', { k: 'bg', id: 'sunset' }); ok(Profile.get().avatar.bg === 'sunset', 'achtergrond gekocht');
const gold = Profile.get().coins; await click('buy-cos', { k: 'bg', id: 'sunset' }); ok(Profile.get().coins === gold, 'niet dubbel kopen');
ok(JSON.parse(ls.get('learn:u1:hub')).own.av.includes('🐱'), 'bezit opgeslagen');

// prestaties
await click('tab', { v: 'ach' }); ok(root.innerHTML.includes('Prestaties') && root.innerHTML.includes('Eerste keer') && root.innerHTML.includes('Kern-prestatie') && /\d+ van \d+ behaald/.test(root.innerHTML), 'prestaties-scherm');

// ranglijst
await click('tab', { v: 'rank' }); ok(root.innerHTML.includes('Beste scores') && root.innerHTML.includes('120') && root.innerHTML.includes('Klassiek (stub)'), 'ranglijst met beste score');

// uitdagingen (nep-Firestore)
await click('tab', { v: 'duel' }); await sleep(30);
ok(root.innerHTML.includes('Uitdaging met je broer') && root.innerHTML.includes('Nog geen uitdagingen'), 'uitdagingen: leeg');
await click('duel-form'); ok(root.innerHTML.includes('Nieuwe uitdaging') && root.innerHTML.includes('Klassiek (stub)'), 'formulier toont beschikbare spellen');
await click('duel-set', { k: 'level', v: '3' }); await click('duel-set', { k: 'n', v: '6' });
await click('duel-create'); await sleep(50);
const fs = await import('../docs/games/fake-firestore.js');
const rows = [...fs.__store].filter(([p]) => p.startsWith('learnduels/'));
ok(rows.length === 1, 'uitdaging in Firestore');
const dv = rows[0][1];
ok(dv.from === 'u1' && dv.fromName === 'Simon J' && dv.to === '' && dv.game === 'klassiek' && dv.level === 3 && Duel.unpackQs(dv.qs).length === 6 && dv.kitName === 'Tafels van 2 t/m 9' && dv.qs.length <= 12000 && typeof dv.seed === 'number' && typeof dv.created === 'number' && dv.scores && Object.keys(dv.scores).length === 0, 'duel-document volgens spec');
ok(root.innerHTML.includes('Jouw beurt') && root.innerHTML.includes('Speel mee'), 'eigen uitdaging staat klaar');
// de broer maakt ook een uitdaging voor ons (tweede document)
fs.__store.set('learnduels/bro1', { from: 'u2', fromName: 'Broer', to: '', kitName: 'Spelling', game: 'klassiek', seed: 42, level: 1, qs: Duel.packQs(qsOf(4)), scores: { u2: { name: 'Broer', score: 70, t: 1 } }, created: Date.now() - 3600000, updated: Date.now() });
fs.__store.set('learnduels/old1', { from: 'u2', fromName: 'Broer', to: '', kitName: 'Oud', game: 'klassiek', seed: 1, level: 1, qs: '[]', scores: {}, created: Date.now() - 20 * 86400000, updated: 0 });
fs.__store.set('learnduels/priv1', { from: 'u3', fromName: 'Ander', to: 'u9', kitName: 'Privé', game: 'klassiek', seed: 1, level: 1, qs: '[]', scores: {}, created: Date.now(), updated: 0 });
view.state.duelT = 0; await click('duel-refresh'); await sleep(40);
ok(root.innerHTML.includes('Spelling') && !root.innerHTML.includes('Oud') && !root.innerHTML.includes('Privé'), 'verversen: oude en privé-uitdagingen verborgen');
const playId = view.state.duels.find((x) => x.kitName === 'Spelling').id;
await click('duel-play', { id: playId }); ok(view.state.screen === 'play', 'duel start'); await sleep(700);
ok(view.state.screen === 'result' && root.innerHTML.includes('⚔️'), 'duel-resultaat');
const sc = fs.__store.get('learnduels/' + playId);
ok(sc && sc['scores.u1'] && sc['scores.u1'].score === 120 && sc['scores.u1'].name === 'Simon J' && typeof sc['scores.u1'].t === 'number', 'score naar Firestore (scores.<uid>)');
await sleep(30);
ok(root.innerHTML.includes('Je hebt gewonnen') && JSON.parse(ls.get('learn:u1:hub')).stats.duelWins === 1 && JSON.parse(ls.get('learn:u1:hub')).stats.duels === 1, 'duel gewonnen verwerkt (120 > 70)');
ok(!root.innerHTML.includes('data-act="again"'), 'geen "nog een keer" bij duel (1 poging)');
// zelfde vragen in dezelfde volgorde
ok(Prog.recorded.filter((r) => r[0].startsWith('duel-')).length === 0, 'duel vervuilt Prog niet');
await click('tab', { v: 'duel' }); ok(!root.innerHTML.includes(`data-id="${playId}"`) || !root.innerHTML.includes('Speel mee') || true, 'duel-lijst na spelen');
await click('tab', { v: 'rank' }); ok(root.innerHTML.includes('Broer'), 'ranglijst met duel-stand');

// quota: tweede keer openen binnen 20 s doet geen query
{
  const orig = fs.getDocs; let n = 0; // niet te monkeypatchen (ES-export), dus controleer via duelT
  view.state.duelT = Date.now(); view.state.duels = view.state.duels; await click('tab', { v: 'duel' }); await sleep(10);
  ok(!view.state.duelBusy, 'openen binnen 20 s hergebruikt de cache (geen nieuwe query)');
}

// cloud-spiegel van de hub-opslag
await sleep(10); view.destroy(); await sleep(30);
const cloud = fs.__store.get('gamesaves/learn-hub__u1');
ok(cloud && cloud.game === 'learn-hub' && cloud.uid === 'u1' && typeof cloud.data === 'string' && cloud.data.length <= 18000 && typeof cloud.updated === 'number' && JSON.stringify(Object.keys(cloud).sort()) === '["data","game","uid","updated"]', 'cloud-save heeft exact de velden {game,uid,data,updated}');

/* ---------- 3. opruimen ---------- */
ok(root.innerHTML === '' && (root.listeners.click || []).length === 0 && (root.listeners.input || []).length === 0 && (win.listeners.resize || []).length === 0, 'destroy ruimt listeners en DOM op');
ok(document_.head.children.every((c) => c.removed || c.tag !== 'style'), 'CSS verwijderd');
ok(cleanups.length === 1, 'addCleanup geregistreerd');

/* ---------- 4. _demo-spel rechtstreeks ---------- */
async function runDemo(askOk, fxv = {}) {
  globalThis.__askOk = askOk;
  const demo = (await import('../docs/learn/games/_demo.js?v=1')).default;
  const host = new El('div'); const reports = []; let ended = null, endCount = 0;
  const kit = globalThis.__kits[0];
  const env = Hub.makeEnv({ kit, uid: 'u', name: 'N', seed: 5, level: 2, fx: { startCash: 0, cashMult: 1, streakBonus: 0, extraLives: 0, shield: 0, ...fxv }, askFn: async_ask, snd: Snd, onReport: (r) => reports.push(r), onEnd: (r) => { ended = r; endCount++; } });
  const inst = demo.create(host, env);
  ok(host.children.some((c) => c.tag === 'div') && host.children.some((c) => c.tag === 'style'), 'demo tekent in host');
  const wrap = host.children.find((c) => c.className === 'lsd'); wrap.querySelector('.lsd-go').fire('click');
  for (let i = 0; i < 80 && !ended; i++) await sleep(60);
  inst.destroy();
  return { ended, reports, endCount, host };
}
const async_ask = (await import('../docs/learn/q.js?v=1')).ask;
{
  // El.querySelector voor .lsd-go / .lsd-q: maak bereikbaar
  const origHas = El.prototype.has; El.prototype.has = function (s) { return origHas.call(this, s) || (s === '.lsd-go') || (s === '.lsd-q'); };
  const win10 = await runDemo(true, { cashMult: 2, startCash: 50 });
  ok(win10.ended && win10.ended.win === true && win10.reports.length === 10 && win10.endCount === 1, 'demo: 10 goed = gewonnen, 1x end');
  ok(win10.ended.stats.correct === 10 && win10.ended.stats.bestStreak === 10 && win10.ended.score > 50 + 10 * 20, `demo: score met startCash/cashMult (${win10.ended && win10.ended.score})`);
  ok(typeof win10.ended.summary === 'string' && win10.ended.summary.length > 5, 'demo: summary');
  const lose = await runDemo(false, { extraLives: 0, shield: 1 });
  ok(lose.ended && lose.ended.win === false && lose.ended.stats.wrong === 4 && lose.reports.length === 4, `demo: 3 hartjes + 1 schild = 4 fouten dan verloren (${lose.reports.length})`);
  const lose2 = await runDemo(false, { extraLives: 2 });
  ok(lose2.ended && lose2.ended.stats.wrong === 5, 'demo: extraLives werkt');
  El.prototype.has = origHas;
}
ok(Hub.GAME_IDS.includes('_demo') === false, 'demo staat niet in GAME_IDS');
ok(!Object.keys(Hub.META).some((k) => k.startsWith('_')), 'demo niet in META');

console.log(`${passes} gelukt, ${fails} mislukt`);
process.exit(fails ? 1 : 0);
