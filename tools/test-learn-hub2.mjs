// Test fase 2 van de hub: werelden, env.world/gfx, scenes, extra winkelitems, wereld-prestaties, opslaglimiet.
// Uitvoeren: node tools/test-learn-hub2.mjs   (en ook: LEARN_CORE=real node tools/test-learn-hub2.mjs voor de echte core.js)
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
register('./learn-stubs/loader.mjs', import.meta.url);
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.error('FOUT:', m); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const { El, document_, ls, install } = await import('./learn-stubs/dom.mjs');
install();
globalThis.__kits = [{ id: 'tafels', name: 'Tafels', emoji: '✖️', group: 'Rekenen', qs: Array.from({ length: 30 }, (_, i) => ({ t: 'tf', q: `V${i}`, a: true })), src: 'pack' }];
const core = await import('../docs/learn/core.js?v=1');
const Shop = await import('../docs/learn/games-shop.js?v=2');
const Hub = await import('../docs/learn/games.js?v=1');
const { Themes, WORLDS } = await import('../docs/gfx/themes.js?v=1');
const { Profile } = core;
const REAL = process.env.LEARN_CORE === 'real';

/* ---------- pure logica ---------- */
ok(Shop.EXTRA_COUNT >= 25, `minstens 25 nieuwe items (${Shop.EXTRA_COUNT})`);
for (const [k, list] of Object.entries({ av: Shop.EXTRA_AV, hat: Shop.EXTRA_HAT, bg: Shop.EXTRA_BG, fx: Shop.FX_SETS, title: Shop.TITLES })) {
  const ids = list.map((x) => x[0]); ok(new Set(ids).size === ids.length, `${k}: unieke id's`);
  ok(list.every((x) => x[1] && x[2] >= 0 && x[3] >= 1), `${k}: naam/prijs/level`);
}
ok(Shop.EXTRA_AV.concat(Shop.EXTRA_HAT).every((x) => [...x[0]].length <= 8 && Shop.iconFor(x[0])), 'extra avatars/hoeden passen in 8 tekens en hebben een 3D-icoon');
ok(Shop.EXTRA_BG.every((x) => x[0].length <= 20) && Shop.EXTRA_BG.length === WORLDS.length, 'achtergronden per wereld, id <= 20 tekens');
ok(Shop.FX_SETS.every((f) => f[4].length === 3 && /^#/.test(f[5])), 'effecten-sets: 3 iconen + kleur');
ok(Shop.bgCss('w-ruimte').includes('gradient') && Shop.bgCss('w-ruimte') !== Shop.BGS[0][4], 'bgCss voor wereld-achtergrond');
ok(Shop.catalog('av').length > Shop.AVATARS.length - 1 || REAL, 'catalogus uitgebreid');
ok(Shop.catalog('fx').length === Shop.FX_SETS.length && Shop.catalog('title').length === Shop.TITLES.length, 'fx/title-catalogus');
ok(Shop.emo('👑', 30).includes('👑') && Shop.emo('🫠', 30).includes('lsp-emo') && Shop.ic('coin', 20).length > 10, 'emo/ic helpers (alt of emoji-fallback)');
ok(Shop.iconFor('⚔️') === 'sword' && Shop.iconFor('⚔') === 'sword' && Shop.iconFor('zzz') === null, 'iconFor normaliseert variatie-selectors');

// hub-opslag: nieuwe velden, oude saves, samenvoegen
const old = Shop.normHub({ v: 1, t: 5, own: { av: ['🐱'], hat: [], bg: [] }, best: {}, stats: { games: 2 } });
ok(old.own.fx.length === 0 && old.eq.fx === 'conf' && old.eq.title === '' && old.wl.length === 0 && old.intro === 1 && old.stats.games === 2, 'oude save laadt met standaardwaarden');
const d1 = Shop.defaultHub();
for (const w of ['ruimte', 'bos', 'ijs', 'neon']) Shop.applyResult(d1, { game: 'race', level: 2, score: 5, win: false, correct: 1, wrong: 0, bestStreak: 1, coins: 1, world: w });
Shop.applyResult(d1, { game: 'bom', level: 2, score: 5, win: false, correct: 1, wrong: 0, bestStreak: 1, coins: 1, world: 'ruimte' });
ok(d1.wp.race.length === 4 && d1.wp.bom.length === 1 && d1.wl.length === 4, 'werelden per spel bijgehouden');
const na = Shop.checkHubAch(d1, {}, 1).map((a) => a.id);
ok(na.includes('h-wr3') && na.includes('h-wg1') && !na.includes('h-wg3') && !na.includes('h-wr9'), `wereld-prestaties ${na}`);
Shop.noteWorld(d1, 'race', 'ruimte'); ok(d1.wp.race.length === 4, 'geen dubbele wereld');
for (let i = 0; i < 10; i++) Shop.noteWorld(d1, 'x', 'w' + i); ok(d1.wp.x.length === 6, 'max 6 werelden per spel');
for (const g of ['a', 'b', 'c']) for (const w of ['x1', 'x2', 'x3']) Shop.noteWorld(d1, g, w);
ok(Shop.checkHubAch(d1, {}, 2).some((a) => a.id === 'h-wg3'), '3 spellen in 3 werelden');
const m = Shop.mergeHub(Shop.normHub({ t: 1, own: { fx: ['goud'] }, wp: { race: ['ijs'] }, wl: ['ijs'] }), Shop.normHub({ t: 2, own: { fx: ['vuur'], title: ['slim'] }, wp: { race: ['bos'] }, wl: ['bos'], eq: { fx: 'vuur', title: 'slim' }, intro: 0 }));
ok(m.own.fx.length === 2 && m.own.title[0] === 'slim' && m.wp.race.length === 2 && m.wl.length === 2 && m.eq.fx === 'vuur' && m.intro === 0, 'mergeHub: fx/title/wp/wl/eq/intro');
ok(Shop.normHub({ wp: { a: 'rommel', b: ['x', 5, 'y'] }, wl: 7, eq: { fx: 123 } }).wp.b.length === 2 && Shop.normHub({ wl: 7 }).wl.length === 0, 'normHub weert rommel');
// opslaglimiet: een enorme hub blijft onder 20000 tekens
{
  const big = Shop.defaultHub();
  for (let i = 0; i < 400; i++) big.kits['kit-' + i + '-xxxxxxxxxxxxxxxx'] = 1;
  for (const g of Hub.GAME_IDS) { big.best[g] = { score: 99999, kit: 'Een heel lange kitnaam '.repeat(8), level: 2, t: 1e12 }; big.wp[g] = ['onderwater', 'woestijn', 'snoepland', 'pretpark', 'boerderij', 'robots']; big.played[g] = 999; }
  big.wl = WORLDS.map((w) => w.id); big.own.av = Shop.catalog('av').map((x) => x[0]); big.own.hat = Shop.catalog('hat').map((x) => x[0]); big.own.bg = Shop.catalog('bg').map((x) => x[0]);
  const s = Shop.hubForCloud(big); ok(s.length <= 20000, `hub-cloud ${s.length} <= 20000`);
  const back = Shop.normHub(JSON.parse(s)); ok(back.wl.length === WORLDS.length && back.own.av.length === big.own.av.length, 'ingekorte cloud-hub blijft leesbaar en houdt bezit');
  ok(Shop.hubForCloud(Shop.defaultHub()).length < 1500, 'kleine hub blijft klein');
}

// hub-helpers
ok(Hub.GAME_IDS.every((id) => Hub.GAME_ICON[id] && Shop.hasIcon(Hub.GAME_ICON[id]) !== undefined) && Object.keys(Hub.GAME_ICON).length >= 18, 'icoon per spel');
ok(Hub.GAME_IDS.every((id) => WORLDS.some((w) => w.id === Hub.DEFAULT_WORLD[id])), 'standaardwereld per spel bestaat');
ok(WORLDS.every((w) => /^intro-/.test(Hub.introFor(w.id))), 'intro per wereld');
ok(Hub.resultScenes({ id: 'baas', win: true, lvUps: [] })[0] === 'boss-defeated' && Hub.resultScenes({ id: 'race', win: true, lvUps: [{}] }).join() === 'victory,levelup' && Hub.resultScenes({ id: 'race', win: false, newRecord: true, lvUps: [] })[0] === 'new-record' && Hub.resultScenes({ id: 'race', win: false, coins: 5, lvUps: [] }).length === 0 && Hub.resultScenes({ id: 'race', win: null, coins: 60, lvUps: [] })[0] === 'coins-rain', 'resultaat-scenes');
{
  ls.set && ls.set('gfx:world:klassiek', 'ijs');
  ok(Hub.worldOf('klassiek').id === 'ijs' && Hub.worldOf('race').id === 'woestijn', 'worldOf: bewaard of standaard');
  Themes.setForGame('race', 'neon'); ok(Hub.worldOf('race').id === 'neon', 'worldOf volgt Themes.setForGame');
}
{
  const env = Hub.makeEnv({ kit: globalThis.__kits[0], seed: 1, level: 2, fx: {}, askFn: () => {}, world: Themes.world('bos'), gfx: { q: 2, reduce: false }, scene: 'intro-bos' });
  ok(env.world.id === 'bos' && env.gfx.q === 2 && env.gfx.reduce === false && env.scene === 'intro-bos', 'env.world/gfx/scene');
  const e2 = Hub.makeEnv({ kit: globalThis.__kits[0], seed: 1, level: 2, fx: {}, askFn: () => {} });
  ok(e2.world && e2.world.id && e2.gfx && typeof e2.gfx.q === 'number', 'env.world/gfx hebben standaardwaarden');
}
ok(/§ Wereld & kwaliteit/.test(readFileSync(new URL('../docs/learn/SPEC.md', import.meta.url), 'utf8')), 'SPEC.md bevat § Wereld & kwaliteit');

/* ---------- view ---------- */
const root = new El('div');
const ctx = { db: null, me: { uid: 'u2', name: 'Sim' }, uid: 'u2', esc: core.esc, nice: (e) => e.message || String(e), view: root, addCleanup: () => {} };
const click = async (act, data = {}) => { const el = { dataset: { act, ...data } }; root.fire('click', { target: { closest: (s) => (s === '[data-act]' ? el : null) } }); await sleep(5); };
const view = await Hub.learnSpelView(ctx);
await sleep(1200);
const html = () => root.innerHTML;
ok(html().includes('data-act="settings"') && html().includes('⚙'), 'instellingenknop in de kop');
ok(html().includes('gfx-icon') && html().includes('lsp-gc-ic') && html().includes('lsp-wchip'), 'kaarten met 3D-icoon en wereld-chip');
ok((html().match(/data-act="worlds"/g) || []).length >= 1, 'wereld-chip op kaart');
await click('settings'); ok(true, 'settings openen gooit niet');
await click('worlds', { id: 'klassiek' });
ok(view.state.wsheet === 'klassiek' && html().includes('lsp-wsheet') && (html().match(/class="lsp-wp[ "]/g) || []).length === WORLDS.length, 'wereld-kiezer toont alle werelden');
await click('world-set', { id: 'klassiek', w: 'dino' });
ok(Hub.worldOf('klassiek').id === 'dino' && html().includes('Spelen in Dino'), 'wereld kiezen wordt onthouden');
await click('intro-toggle'); ok(JSON.parse(ls.get('learn:u2:hub')).intro === 0, 'intro uitzetten onthouden');
await click('intro-toggle');
await click('world-close'); ok(view.state.wsheet === '' && !html().includes('lsp-wsheet'), 'wereld-kiezer sluit');
// spel start met de wereld in env; wereld wordt genoteerd
await click('worlds', { id: 'klassiek' }); await click('world-set', { id: 'klassiek', w: 'ijs' });
await click('intro-toggle'); // uit: geen intro nodig in de node-mock
await click('world-play', { id: 'klassiek' });
await sleep(900);
ok(view.state.screen === 'result' && view.state.result.world.id === 'ijs' && view.state.result.newWorld === true, 'resultaat kent de wereld');
ok(JSON.parse(ls.get('learn:u2:hub')).wp.klassiek.includes('ijs'), 'wereld opgeslagen in hub');
ok(html().includes('lsp-hero') && html().includes('Nieuwe wereld') && html().includes('Andere wereld'), 'resultaat: hero, nieuwe wereld, andere wereld-knop');
await click('worlds', { id: 'klassiek' }); ok(html().includes('lsp-wsheet'), 'wereld-kiezer ook vanaf resultaat'); await click('world-close');
await click('home');
// winkel: extra items
Profile.get().coins = 5000;
await click('tab', { v: 'shop' }); await click('shop-tab', { v: 'fx' });
ok(html().includes('lsp-fxprev') && html().includes('Gouden regen'), 'effecten-tab');
await click('buy-cos', { k: 'fx', id: 'goud' });
const hub = () => JSON.parse(ls.get('learn:u2:hub'));
ok(hub().own.fx.includes('goud') && hub().eq.fx === 'goud' && Profile.get().coins === 4940, 'effecten-set gekocht en aan');
await click('equip', { k: 'fx', id: 'conf' }); ok(hub().eq.fx === 'conf', 'terug naar gratis set');
await click('shop-tab', { v: 'title' }); await click('buy-cos', { k: 'title', id: 'slim' });
ok(hub().eq.title === 'slim' && html().includes('Slimmerik'), 'titel gekocht en zichtbaar in de kop/winkel');
await click('shop-tab', { v: 'hat' }); await click('buy-cos', { k: 'hat', id: '🎈' });
ok(Profile.get().avatar.hat === '🎈' && hub().own.hat.includes('🎈'), 'extra hoed gekocht (bezit in hub)');
await click('buy-cos', { k: 'hat', id: '🐉' }); ok(Profile.get().avatar.hat === '🎈', 'level-vergrendelde extra hoed niet te koop');
await click('shop-tab', { v: 'bg' }); await click('buy-cos', { k: 'bg', id: 'w-ruimte' });
ok(Profile.get().avatar.bg === 'w-ruimte' && hub().own.bg.includes('w-ruimte'), 'wereld-achtergrond gekocht');
await click('shop-tab', { v: 'av' }); await click('buy-cos', { k: 'av', id: '🐟' });
ok(Profile.get().avatar.emoji === '🐟', 'extra avatar gekocht');
const coinsNow = Profile.get().coins; await click('buy-cos', { k: 'av', id: '🐟' }); ok(Profile.get().coins === coinsNow, 'niet dubbel kopen');
ok(html().includes('gfx-icon'), 'winkel gebruikt iconen');
await click('tab', { v: 'ach' }); ok(html().includes('Alle werelden') && html().includes('Wereldkampioen'), 'wereld-prestaties in lijst');
await click('tab', { v: 'rank' }); ok(html().includes('Werelden'), 'ranglijst toont werelden');
view.destroy();

console.log(`${passes} gelukt, ${fails} mislukt${REAL ? ' (echte core)' : ''}`);
process.exit(fails ? 1 : 0);
