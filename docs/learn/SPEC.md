# Learn – contract (LEES DIT EERST, houd je eraan)

Twee apps in simon-app, die één kern delen:
- **Learn Study** (`learnstudy`): leren zelf. Kits (vragensets), leren (herhaling), oefenen, toets, levens-modus, taal leren, flitskaarten, voorlezen, tekst→vragen, voortgang.
- **Learn Spel** (`learnspel`): Gimkit-achtige leerspellen (18+), waarin goede antwoorden je spel voeden. Profiel met upgrades van jezelf, winkel, dagopdrachten, uitdaging met je broer.

Alles is statisch: plain ES-modules, GEEN build, GEEN npm, GEEN externe libs/afbeeldingen (alleen canvas, SVG, DOM, emoji). Nederlands. Mobile-first (360-430px breed; ook muis+toetsenbord). Safari/iPhone is hoofddoel: geen ctx.filter, geen ctx.roundRect, geen OffscreenCanvas. Kindvriendelijk, geen geweld buiten cartoon. Leuk en niet te lastig, maar met veel diepte. Geen alert/prompt/confirm. Elk bestand injecteert eigen CSS via <style> met unieke klassenprefix, gebruikt var(--card), var(--ink), var(--line), var(--accent) en werkt licht+donker. Alles opruimen (timers, rAF, listeners, audio, <style>, speech) in destroy/addCleanup. Importeer andermans bestanden ALLEEN via de paden hieronder, met vaste `?v=1` query en try/catch-fallback waar het kan.

Map: `docs/learn/`. Bestanden en eigenaar:
- `core.js`, `q.js` – kern (agent KERN)
- `study.js` – Learn Study app (agent STUDY)
- `games.js` – Learn Spel app: hub, winkel, uitdaging (agent HUB)
- `games/<id>.js` – de spellen (agents SPELLEN-A/B/C)
- `packs/<id>.js` – kant-en-klare kits (agents PACKS-A/B) + `packs/index.js` (agent KERN: lijst die packs lui laadt)

## 1. Vraag-model (compact, JSON-vriendelijk)
```js
{ t: 'mc'|'type'|'tf'|'order'|'match'|'fill'|'num'|'multi',
  q: 'Vraagtekst',            // bij fill staat '___' op de plek van het gat
  a: ...,                      // zie per type
  o: ['..','..','..','..'],    // opties (mc, multi, fill-met-keuze)
  alt: ['..'],                 // extra goede antwoorden (type, fill, num)
  e: '🐶',                     // emoji/plaatje (optioneel, groot getoond)
  say: 'tekst om voor te lezen', // optioneel (anders q)
  lang: 'nl'|'en'|'de'|'fr'|'es',// taal van het antwoord/say (voor voorlezen en typtolerantie)
  x: 'uitleg na het antwoord',  // optioneel
  g: 'groep/tag',              // optioneel (voor filteren)
  d: 1                          // moeilijkheid 1..3 (optioneel, standaard 2)
}
```
Types: `mc` a = de juiste optie als tekst (moet in o staan; 4 opties, 2-6 mag); `type` a = tekst; `tf` a = true/false (q is een bewering); `order` q = opdracht, `a` = array items in de goede volgorde (3-6 items); `match` `a` = array van [links, rechts] paren (3-5 paren); `fill` a = tekst (met `o` = keuzes, of zonder = typen); `num` a = getal, `alt` evt. andere getallen, optioneel `tol` (tolerantie); `multi` o = opties, a = array juiste opties.
Een **kit**: `{ id, name, emoji, desc, lang?, group?, qs: [vraag, ...], src: 'user'|'pack' }`. Een vraag-sleutel is `qkey(q)` (stabiele korte hash van type+q+a).

## 2. `docs/learn/core.js` (agent KERN) – exports
```js
export const LANGS            // { nl:{name:'Nederlands', speech:'nl-NL'}, en:{.., speech:'en-GB'}, de, fr, es }
export function rng(seed)     // deterministische random: () => 0..1 (mulberry32)
export function shuffle(arr, rand=Math.random)       // nieuw array
export function qkey(q)       // stabiele sleutel (string, kort)
export function normalizeQ(q) // maakt een geldige vraag (vult d, trimt, valideert; gooit niet; geeft null bij onbruikbaar)
export function checkAnswer(q, given) // -> { ok:boolean, partial?:number(0..1), correct:string } ; given: string | boolean | number | string[] | [l,r][] volgens type
        // type/fill/num: hoofdletters/accenten/spaties/leestekens tolerant (en lang-bewust), kleine typefouten (Levenshtein<=1 bij woorden >=5 letters) => ok maar flag typo:true
export function makeOptions(q, pool, n=4, rand)  // maakt een mc-vraag van een type-vraag door foute opties uit pool (andere vragen met zelfde g/lang) te trekken; geeft nieuwe vraag-object
export function toTypeQ(q)    // mc -> type (zonder o)
export function pick(kit, n, o={}) // -> array van n (unieke, zo mogelijk) vragen. o: { seed, types:[..], hard:1..3, weakFirst:true, kitId, avoid:Set(qkey) }; als kit kleiner is dan n herhaalt hij pas als alles geweest is
export const Kits = {   // eigen kits (lokaal + cloud)
  async load(),         // laadt (lokaal, daarna cloud-merge). Veilig meerdere keren aanroepen.
  list(),               // [kit] van de gebruiker (sync, na load)
  get(id), save(kit), remove(id), newId(),
  onChange(fn) -> off()
}
export async function allKits()   // [{id,name,emoji,group,count,lang,src,load:async()=>kit}] eigen kits + packs (packs lui)
export async function getKit(id)  // kit (eigen of pack) met qs; null als niet bestaat
export const Prog = {   // voortgang per kit en per vraag (Leitner-boxen 0..5)
  async load(), box(kitId,q) -> 0..5, record(kitId,q,ok,ms), dueFirst(kit) -> qs gesorteerd (te herhalen eerst), weak(kitId, n) -> qs,
  mastery(kitId, kit) -> {pct, known, learning, new}, history(kitId) -> toetsresultaten, addResult(kitId,res), stats() -> {streak, today:{answers,correct,xp}, goal, best}
}
export const Profile = {   // speler (xp, coins, upgrades, uiterlijk)
  async load(), get() -> { name, xp, level, coins, stars, streak, avatar:{emoji,hat,bg}, up:{[id]:level}, ach:{}, quests:{...}, stats:{...} },
  addXp(n), addCoins(n), spend(n) -> bool, levelInfo() -> {level, cur, next},
  UPGRADES: [{ id, name, emoji, desc, max, cost(level)->coins, fx(level)->{...} }], buyUpgrade(id) -> bool,
  effects() -> { startCash, cashMult, streakBonus, extraLives, timeBonus(sec), hints, shield, xpMult, coinMult, luck(0..1) }  // door upgrades bepaald; games gebruiken dit
  setAvatar(o), quests() -> dagopdrachten [{id,text,goal,prog,reward,done}], bumpQuest(kind,n), claimQuest(id), achievements() -> [{id,name,emoji,done}], checkAch()
}
export const TTS = { supported(), speak(text, lang, o={rate}) -> Promise (resolved na afloop of direct bij niet-ondersteund), stop(), on:false, setOn(b), rate, setRate(r), voices(lang) }
export const Snd = { play(name), setOn(b), on }  // WebAudio-geluidjes: 'goed','fout','klik','munt','level','win','lose','tik','power'. Zachte volume. Veilig zonder AudioContext.
export function todayKey(), fmt(n) (1,2K / 3,4M stijl), esc(s)
export function bindCtx(ctx)   // ctx = {db, uid, me} van de host-app; zet cloud-opslag aan: gamesaves/<game>__<uid> met velden EXACT { game, uid, data(JSON-string max 18000 tekens), updated }
```
Opslag: local-first in localStorage (`learn:<uid>:<naam>`), cloud (Firestore `setDoc(doc(db,'gamesaves', game+'__'+uid), {game, uid, data, updated})`) max 1x per 30 s en bij sluiten, met games `learn-kits-0..learn-kits-4` (kits verdeeld in blokken <18000 tekens), `learn-prog`, `learn-profile`. Neem de nieuwste van lokaal/cloud. Fouten in de cloud stil afvangen. Versioneer saves en migreer. Import: `import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js'` (de test-importmap vervangt dit door een nep).

## 3. `docs/learn/q.js` (agent KERN) – de vraag-presentator
```js
export function ask(host, q, o = {}) -> { promise: Promise<{ok, ms, given, typo?, partial?}>, cancel() }
// Tekent de vraag in host (een <div>) en lost op zodra de speler antwoordt. Alle 8 types volledig bediend (tap, typen met toetsenbord/Enter, slepen of tikken om te ordenen, paren verbinden).
// o: { time: sec|0, tts:true|false, hints:0..n (aantal beschikbare hints; hint = 2 foute opties weg / eerste letter), feedback:true (toon goed/fout + x, anders meteen resolve), compact:false (kleiner voor in spellen), autoNext:ms, theme:{bg,fg,accent}, lives?, label? }
// Kleine animaties en geluid via Snd. Voorlezen: als o.tts of TTS.on -> lees vraag (en opties bij mc) voor via TTS met q.lang||'nl'; knop 🔊 om opnieuw te lezen.
export function renderQ(host, q, o) -> handle  // alias
```
Spellen en Study gebruiken UITSLUITEND `ask` voor vragen (zo heeft elk spel automatisch alle vraagsoorten, tijd, hints en voorlezen).

## 4. Packs (agents PACKS-A/B) – `docs/learn/packs/<id>.js`
```js
export default { id, name, emoji, group, desc, lang?, build() -> kit { id, name, emoji, desc, lang, qs:[...] } }  // build is sync of async, deterministisch
```
`packs/index.js` (agent KERN) exporteert `PACKS = [{id,name,emoji,group,desc,lang,count?, load: () => import('./<id>.js?v=1').then(m=>m.default.build())}]` voor ALLE pack-bestanden (KERN genereert dit na afloop uit de bestandsnamen; PACKS-agents melden hun lijst met id/name/emoji/group/desc). Groepen: 'Talen', 'Spelling', 'Rekenen', 'Wereld', 'Natuur', 'Mens', 'Geschiedenis', 'Creatief', 'Technologie'.
Inhoud: ALLEEN feiten waar je zeker van bent; kindvriendelijk; mix van vraagtypen per pack (vooral mc/type/tf, ook order/match/fill/num/multi waar het past); vaak ook `lang` en `say`; goede foute opties (mc) die echt lijken op het goede antwoord; `x` uitleg bij moeilijkere vragen; moeilijkheid `d` 1..3; 80-400 vragen per pack (rekenpacks mogen gegenereerd zijn met vaste seed: genereer ruim 300).

## 5. Spellen (agents SPELLEN-A/B/C) – `docs/learn/games/<id>.js`
```js
export default {
  id: 'klassiek', name: 'Klassiek', emoji: '💰', color: '#6366f1',    // kaartkleur
  desc: 'Verdien geld met goede antwoorden en koop upgrades.',
  tags: ['geld','solo'],           // vrij (bv. 'geld','verdedigen','race','denken','snel','rustig')
  minutes: 4,                       // ca. speelduur
  duo: false,                       // true als er een 2-spelers-variant is (tegen de computer-bot of 'hotseat' naast elkaar)
  create(host, env) { ...; return { destroy() {} }; }
}
```
`env` (door de hub gemaakt): `{ kit, uid, name, seed, level: 1..3 (makkelijk/normaal/moeilijk), pick(n, o) -> vragen uit de kit (core.pick met seed en weak-first), ask(host, q, o) -> core q.ask (voegt tts/hints/tijd uit speler-effecten toe), fx: Profile.effects(), snd: Snd, tts: TTS, rand: rng(seed), w, h (px van host), report(r), end(result) }`.
- `env.report({ q, ok, ms })` na ELK beantwoorde vraag (hub voert Prog, XP-meter, dagopdrachten bij).
- `env.end({ score: number, win: boolean|null, stats: {correct, wrong, best streak, ...}, summary: 'korte tekst' })` EXACT 1 keer aan het einde (daarna toont de hub resultaat, beloning en 'nog een keer'). Spellen zijn af in 3-8 minuten (de speler kiest soms 'doorspelen' binnen het spel waar dat past).
- Spelers-upgrades werken door: `env.fx.startCash`, `cashMult`, `streakBonus`, `extraLives`, `timeBonus`, `hints`, `shield`, `luck`. Pas ze toe waar ze betekenis hebben (bv. extraLives in levens-spellen; startCash bij geldspellen).
- Het spel mag eigen upgrades/winkel IN het spel hebben (Gimkit-gevoel: verdien geld, koop upgrades in het spel), onafhankelijk van de profiel-upgrades.
- Grafische kwaliteit: canvas of DOM met vloeiende animaties, uitnodigend; emoji mag, getekende vormen beter. Uitleg van het spel in max 2 zinnen vóór de start ('Tik om te beginnen').
- Elk spel gebruikt `env.ask` voor ALLE vragen (de ask-UI past zich aan: o.compact=true in spellen waar het scherm gedeeld wordt).
- Bots/tegenstanders: eenvoudige AI met naam en emoji, snelheid afhankelijk van env.level.
- Spellen werken met elke kit (ook met kleine kits van 5 vragen: kies dan herhalend), alle vraagsoorten, en moeten NIET vastlopen als er weinig vragen zijn.

De 18 spellen (SPELLEN-A: 1-6, SPELLEN-B: 7-12, SPELLEN-C: 13-18):
1 `klassiek` Klassiek (geld, upgrades vermenigvuldiger/reeks/verzekering, tijdslimiet 4 min), 2 `toren` Torenverdediging (antwoorden = geld voor torens, golven monsters), 3 `baas` Baasgevecht (eindbaas, schade per goed antwoord, bots als teamgenoten), 4 `race` Race (auto's, gas per goed antwoord, bots), 5 `vissen` Vissen (vis vangen, verkopen, betere hengel/boot), 6 `vlag` Vlaggenroof (kaart, lopen met goede antwoorden, bots verdedigen),
7 `pizza` Pizzatent (bestellingen, bak- en bezorg-upgrades), 8 `monster` Monsterjager (RPG: wapens/levels, monsters kiezen), 9 `regen` Woordenregen (vallende antwoorden/vragen, zoals typespel), 10 `memory` Memory (kaartjes vraag/antwoord, tijd en zetten), 11 `ruimte` Ruimtemissie (raket brandstof, planeten bereiken), 12 `bom` Bom doorgeven (bots + jij, bom tikt, vragen onder tijdsdruk),
13 `slang` Slimme slang (slang eet juiste antwoord-blokken), 14 `boerderij` Boerderij (planten, oogsten, dieren, verkopen), 15 `vlieg` Poortvlucht (vlieg door poorten met antwoorden), 16 `schat` Schatgraver (graaf tegels, vind schatten, valkuilen), 17 `escape` Escape-kamer (deuren, sloten, hints, 5 kamers), 18 `miljonair` Quizshow (ladder tot de top, 3 hulplijnen, veilige trappen).

## 6. `docs/learn/study.js` (agent STUDY)
`export function learnStudyView(ctx)`; ctx = { db, me, esc, nice, uid, view, addCleanup }. Roept `bindCtx(ctx)` aan. Tabs onderaan: 📚 Kits · 🎓 Leren · ✍️ Toets · 🗣 Talen · 📊 Voortgang. Onderdelen:
- **Kit-bibliotheek**: eigen kits + packs per groep (zoekbalk, filter op taal), 'recent', voortgangsring per kit.
- **Kit-maker** (zodat je NIET alles zelf hoeft te typen): (a) snel invullen met regel per vraag, (b) **plak-import** van tekst/woordlijst (herkent `woord - vertaling`, `woord;vertaling`, tabs, `vraag? antwoord`, genummerde lijsten, CSV) met voorbeeldweergave en types kiezen, (c) **tekst → vragen** (plak een stukje tekst; heuristiek maakt invul-, waar/onwaar- en meerkeuzevragen van zinnen, getallen en namen) met aanvinken welke je houdt, (d) **generator-wizard** (tafels, optellen/aftrekken/delen met niveau, klok kijken, geld, breuken, procenten, hoofdletters/leestekens-opdrachten, woordjes-paar → automatisch mc+type+luister), (e) kit kopiëren/bewerken van een pack, (f) exporteren/delen als tekst en importeren van code (een kit als compacte tekst die je naar je broer kunt sturen en plakken).
- **Leren** (herhalingsmodus, Leitner): sessie van ~10 vragen waar te-herhalen vragen eerst komen; per nieuwe vraag eerst 'leerkaart' (vraag + antwoord tonen), dan mc, daarna typen; uitleg bij fout; voortgang per vraag (Prog.record); beloning aan het einde (XP/munten).
- **Oefenen**: vrije oefening met kiesbare vraagsoorten, aantal, moeilijkheid, directe feedback + uitleg, 'alleen zwakke vragen'.
- **Toets**: kies kit, aantal vragen, tijd (optioneel), vraagsoorten; GEEN feedback tijdens de toets; aan het einde cijfer (1-10), overzicht per vraag met goed antwoord, 'oefen mijn fouten' knop, geschiedenis van toetsen per kit (Prog.addResult).
- **Levens-modus**: 3 levens (+ upgrades), door tot je levens op zijn, reeks-teller, highscore per kit.
- **Talen**: 'woordjes leren' met fasen (zien+horen → kiezen → typen → luisteren-en-typen), richting NL→taal / taal→NL / gemengd, voorlees aan, voorbeeldzinnen als de vraag die heeft, taalkaart (voortgang per taal).
- **Flitskaarten**: omdraaien met animatie, 'ik wist het / nog niet', stapel schudden, voorlezen.
- **Voorlezen**: globale instelling (aan/uit, snelheid, stem per taal); automatisch bij elke vraag als aan.
- **Voortgang**: streak, dagdoel (aantal antwoorden), per kit beheersing (nieuw/lerend/gekend), zwakste vragen, toets-geschiedenis, XP/level (Profile), prestaties.
Alle vragen via `ask` uit q.js. Kleine kitgrootte-eisen: kits tot 500 vragen, vraag max 400 tekens.

## 7. `docs/learn/games.js` (agent HUB)
`export function learnSpelView(ctx)`; zelfde ctx; roept `bindCtx(ctx)` aan. Schermen:
- **Home**: profielkop (avatar-emoji met hoed/achtergrond, naam, level + XP-balk, munten), dagopdrachten, kit-kiezer (eigen + packs; standaard 'Tafels' of laatst gebruikt), spelgrid (kaarten met emoji, kleur, tags; filter/zoek; 'Verras me' knop kiest willekeurig; 'laatst gespeeld' bovenaan), moeilijkheid makkelijk/normaal/moeilijk, vraagsoorten-filter.
- **Spel starten**: laadt `games/<id>.js` lui (`import('./games/'+id+'.js?v=1')`, try/catch, foutkaart als hij ontbreekt of crasht), maakt `env`, host-div (volle breedte, hoogte ca. beschikbaar scherm), bovenbalk met ✕ (stoppen, vraagt bevestiging zonder confirm(): 2e tik) en 🔊 (Snd/TTS-schakelaar).
- **Resultaat**: score, beloning (munten/XP volgens correct/wrong/effects.coinMult/xpMult), 'nieuw record', fouten doornemen (de gemiste vragen met goede antwoord; 'oefen die in Study' hint), 'nog een keer' / 'ander spel'.
- **Upgrades van jezelf** (winkel): minstens 12 permanente upgrades met meerdere levels (bv. Slimme start (+startCash), Geldmagneet (cashMult), Reeks-kampioen (streakBonus), Extra leven, Tijd erbij, Hint-hulp, Schild, Dubbele XP, Muntenregen (coinMult), Geluksster (luck), Snelle denker (kortere vraagtijd-penalty), Voorlees-helper…), plus uiterlijk: avatars (emoji), hoeden, achtergronden. Level-ups geven beloningen. Prestaties-lijst (minstens 30).
- **Uitdaging met je broer** (asynchroon): maak een uitdaging (kit + spel + seed + moeilijkheid + max 12 vragen opgeslagen als JSON in het document) in Firestore collectie `learnduels` met velden { from, fromName, to (mag leeg = iedereen), kitName, game, seed, level, qs (JSON-string max 12000 tekens), scores (map uid -> {name, score, t}), created, updated }; de ander ziet 'Uitdagingen' met openstaande en afgeronde duels, speelt dezelfde vragen en dezelfde seed, scores naast elkaar. Max 20 duels per gebruiker zichtbaar; opruimen na 14 dagen (verbergen). Leest: `query(collection(db,'learnduels'), orderBy('created','desc'), limit(20))` (let op: geen samengestelde index nodig). Quota-zuinig (geen live listeners; ververs-knop + bij openen).
- **Ranglijst**: je beste score per spel op dit toestel + de scores uit de duels.
Resultaten worden verwerkt met core: Prog.record per vraag, Profile.addXp/addCoins, Profile.bumpQuest, Profile.checkAch.

## 8. Algemene kwaliteitseisen
- Alles werkt zonder internet en zonder Firestore (cloud is aanvulling).
- Houd geheugen/CPU in de hand (geen zware loops per frame; pauzeer rAF als view niet verbonden is).
- Schrijf pure logica los testbaar (node-tests in `tools/test-learn-<naam>.mjs`: bv. checkAnswer-tolerantie, pick, Leitner, generators, parsers, economie/balans van een spel via een bot-simulatie). Controleer `node --check`. Gebruik de browser NIET (de pane wordt gedeeld; de hoofdagent test visueel).
- Schrijf ALLEEN je eigen bestanden. Rapporteer kort in het Nederlands: wat erin zit, exacte exports, wat je niet kon testen.
