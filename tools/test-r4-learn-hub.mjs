// Ronde 4 – hub-integratie (games.js): uitdagingen, ranglijst-modi, R4-kits in de kitkiezer, 24 spellen, extra werelden.
// Gebruikt dezelfde stubs als test-learn-hub.mjs (+ een stub voor r4-ladder). Uitvoeren: node tools/test-r4-learn-hub.mjs
import { register } from 'node:module';
register('./learn-stubs/loader.mjs', import.meta.url);
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.error('FOUT:', m); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const { El, ls, install } = await import('./learn-stubs/dom.mjs');
install();
globalThis.__kits = [{ id: 'tafels', name: 'Tafels van 2 t/m 9', emoji: '✖️', group: 'Rekenen', qs: Array.from({ length: 40 }, (_, i) => ({ t: 'tf', q: `Vraag ${i}?`, a: true })), src: 'pack' }];
const H = await import('../docs/learn/r4-hub.js');
const Hub = await import('../docs/learn/games.js?v=1');
const core = await import('../docs/learn/core.js?v=1');
const { Profile } = core;

// kies een dag waarop de dagelijkse uitdaging op r4-ladder valt (die heeft een stub)
let dayStr = null; for (let i = 0; i < 400; i++) { const k = H.addDays('2026-11-02', i); if (H.dailyChallenge(k, Hub.GAME_IDS).game === 'r4-ladder') { dayStr = k; break; } }
ok(dayStr, 'er is een dag met r4-ladder als dagspel');
const [yy, mm, dd] = dayStr.split('-').map(Number); const FIXED = new Date(yy, mm - 1, dd, 12).getTime();
const RealDate = Date;
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(FIXED); } static now() { return FIXED; } };
const ch = H.dailyChallenge(dayStr, Hub.GAME_IDS);

ok(Hub.GAME_IDS.length === 24 && Hub.GAME_IDS.slice(18).join() === 'r4-ladder,r4-kluis,r4-drank,r4-lava,r4-duik,r4-rad', '6 nieuwe spel-id\'s achter de oude 18');
ok(Hub.GAME_IDS.every((id) => Hub.META[id] && Hub.GAME_ICON[id] && Hub.DEFAULT_WORLD[id]), 'META/icoon/standaardwereld voor alle 24');
const { WORLDS } = await import('../docs/gfx/themes.js?v=1');
ok(Object.values(Hub.DEFAULT_WORLD).every((w) => WORLDS.some((x) => x.id === w)), 'standaardwerelden bestaan allemaal');
ok(Object.values(Hub.INTRO_FOR).length >= 24, 'intro-scene voor de nieuwe werelden');
for (const w of ['regenboog', 'mijn', 'strand', 'toverbos', 'poolnacht', 'circus']) ok(Hub.INTRO_FOR[w], 'intro voor ' + w);

const root = new El('div'); const cleanups = [];
const ctx = { db: { fake: true }, me: { uid: 'u1', name: 'Simon' }, uid: 'u1', esc: core.esc, nice: (e) => e.message || String(e), view: root, addCleanup: (f) => cleanups.push(f) };
const click = async (act, data = {}) => { const el = { dataset: { act, ...data } }; root.fire('click', { target: { closest: (s) => (s === '[data-act]' ? el : null) } }); await sleep(8); };
const view = await Hub.learnSpelView(ctx);
ok(root.innerHTML.includes('Uitdaging van vandaag') && root.innerHTML.includes('Weekuitdaging') && root.innerHTML.includes('r4-play-day'), 'home toont dag- en weekuitdaging');
ok(root.innerHTML.indexOf('Uitdaging van vandaag') < root.innerHTML.indexOf('Dagopdrachten'), 'uitdaging staat boven de dagopdrachten');
await sleep(1500);
ok((root.querySelector('.lsp-gridwrap').innerHTML.match(/class="lsp-gc[ "]/g) || []).length === 24, '24 spelkaarten');

// kitkiezer toont de nieuwe kits
await click('kit-open'); await sleep(10);
ok(root.innerHTML.includes('Vikingen') && root.innerHTML.includes('Dierenrecords') && root.innerHTML.includes('Spaans: huis en school'), 'kitkiezer bevat R4-kits');
await click('kit-pick', { id: 'r4-vikingen' }); ok(view.state.kitId === 'r4-vikingen', 'R4-kit gekozen');

// dagelijkse uitdaging spelen met de R4-kit
const coins0 = Profile.get().coins;
await click('r4-play-day'); await sleep(900);
ok(view.state.screen === 'result' && view.state.result.id === 'r4-ladder' && view.state.result.dailyDone === true, `uitdaging gespeeld, gehaald (screen ${view.state.screen})`);
ok(globalThis.__r4stub && globalThis.__r4stub.level === ch.level && globalThis.__r4stub.seed === ch.seed, 'dagelijkse uitdaging gebruikt vaste seed en niveau');
ok(globalThis.__r4stub.kit.id === 'r4-vikingen' && globalThis.__r4stub.kit.qs.length >= 25, 'spel kreeg de R4-kit met vragen');
ok(root.innerHTML.includes('Dagelijkse uitdaging gehaald'), 'resultaat meldt dagelijkse uitdaging');
const saved = JSON.parse(ls.get('learn:u1:r4')); ok(saved.day.done === 1 && saved.hist.length === 1 && saved.hist[0].g === 'r4-ladder' && saved.wk.games === 1, 'r4-opslag lokaal bijgewerkt');
await click('home'); ok(root.innerHTML.includes('data-act="r4-claim-day"'), 'claim-knop voor dag');
await click('r4-claim-day'); ok(Profile.get().coins >= coins0 + ch.reward && !root.innerHTML.includes('data-act="r4-claim-day"'), 'munten bijgeschreven voor dagelijkse uitdaging');
await click('r4-claim-day'); const c1 = Profile.get().coins; await click('r4-claim-day'); ok(Profile.get().coins === c1, 'niet twee keer te claimen');
ok(JSON.parse(ls.get('learn:u1:r4')).day.claimed === 1, 'claim opgeslagen');

// ranglijst-modi
await click('tab', { v: 'rank' });
ok(root.innerHTML.includes('Ranglijst') && root.innerHTML.includes('r4-rank') && root.innerHTML.includes('Jouw statistieken'), 'rank-scherm met modi');
for (const m of ['week', 'all', 'game', 'streak', 'today']) { await click('r4-rank', { v: m }); ok(view.state.r4mode === m && root.innerHTML.includes('lsp-chip on'), 'modus ' + m); }
ok(root.innerHTML.includes('Regenboogladder'), 'ranglijst toont het gespeelde spel');

// weekdoel claimen na genoeg spel
const st = JSON.parse(ls.get('learn:u1:r4')); const wc = H.weeklyChallenge(H.weekKey(FIXED));
await click('tab', { v: 'home' });
const ready = H.weeklyProgress(JSON.parse(ls.get('learn:u1:r4')) && H.normR4(JSON.parse(ls.get('learn:u1:r4'))), wc).filter((g) => g.done && !g.claimed);
if (ready.length) { const c2 = Profile.get().coins; await click('r4-claim-week', { id: ready[0].id }); ok(Profile.get().coins >= c2 + ready[0].coins, 'weekdoel claim geeft munten'); } else ok(true, 'geen weekdoel klaar na 1 spel (ok)');

// nieuw spel dat ontbreekt: toast, geen crash
await click('play', { id: 'r4-kluis' }); await sleep(30);
ok(view.state.screen === 'err' || view.state.screen === 'play' || view.state.screen === 'home', 'ontbrekend R4-spel crasht de hub niet');

// opruimen
cleanups.forEach((f) => f()); await sleep(20);
ok(root.innerHTML === '', 'hub ruimt op');
globalThis.Date = RealDate;
console.log(`\n${passes} gelukt, ${fails} mislukt`);
process.exit(fails ? 1 : 0);
