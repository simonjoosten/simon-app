# Gamescroller – spelcontract (lees dit eerst)

Alles is statisch: plain ES-modules in de browser, GEEN build-stap, GEEN npm-pakketten, GEEN externe afbeeldingen of
libraries (alleen emoji, canvas en DOM). Taal van alle teksten in het spel: **Nederlands**. Mobile-first (telefoon, ~360x640),
maar moet ook met muis en toetsenbord werken. Veilig voor kinderen, geen geweld in beeld behalve cartoon-niveau.

Houd elk bestand zelfstandig. Importeer nooit andere spelbestanden. Gebruik geen `alert`/`prompt`/`confirm`.

## 1. Minigame  (`docs/games/mini/<id>.js`)

```js
export default {
  id: 'snake',            // = bestandsnaam zonder .js, kleine letters/cijfers/streepjes
  name: 'Snake',          // korte NL naam
  emoji: '🐍',
  hint: 'Veeg om te sturen',   // 1 korte zin hoe je speelt
  create(host, api) {
    // host: een <div> (position:relative; overflow:hidden). Maak daar zelf je canvas/DOM in. Zet host.style.touchAction='none'.
    // api.w, api.h : pixelbreedte/-hoogte van host (ca. 360x640, kan afwijken -> schaal je spel mee)
    // api.score(n) : toon live score (heel getal, hoger = beter)
    // api.end(n)   : spel is afgelopen met eindscore n. De shell toont game-over + opnieuw. Roep dit EXACT 1 keer aan.
    return { destroy() { /* verwijder ALLE listeners, timers, requestAnimationFrame, audio */ } };
  },
};
```
Regels:
- Het spel start meteen bij `create` (de shell toont vooraf een "Speel"-knop). Een spel duurt typisch 20-120 seconden.
- Elk spel is echt speelbaar, met moeilijker worden, een duidelijke game-over en een score. Geen placeholders.
- Input: gebruik pointer events (`pointerdown/move/up`) voor touch + muis; voeg toetsenbord toe waar dat logisch is
  (pijltjes/WASD/spatie). Luister op `host` (niet op `window`) voor pointer events; voor toetsen mag `window`, ruim op in destroy().
- Teken met canvas (`devicePixelRatio` respecteren is een plus) of met DOM. Gebruik `requestAnimationFrame` met
  tijdstap `dt` (geen vaste frame-aanname). Pauzeer niet zelf; de shell vernietigt het spel als het uit beeld gaat.
- Geluid: niet nodig. Als je het doet: alleen WebAudio-beep, nooit autoplay-problemen veroorzaken (try/catch).
- Kleuren: kies zelf een eigen achtergrond voor host (donker of kleurrijk), zorg dat tekst goed leesbaar is.
- Geen errors in de console bij normaal spelen. Na `destroy()` mogen er geen callbacks meer lopen.
- Voor `api.end` na destroy: doe niets.

## 2. Big game (`docs/games/big/<id>.js`) – groter spel met opslaan

```js
export default {
  id: 'goudmijn', name: 'Goudmijn', emoji: '⛏️', desc: 'Delf goud, koop mijnwerkers, word rijk.',
  async create(host, api) {
    // host: <div> met scrolbare kolom (breedte max ~430px). Bouw UI met DOM (knoppen, tekst). Mag ook <canvas> gebruiken.
    // api.load()  -> Promise<object|null>  : eerder opgeslagen voortgang (JSON-object) of null
    // api.save(o) : bewaar voortgang (o = gewoon JSON-object, < 100 KB). Wordt gedebounced weggeschreven. Roep dit aan na
    //               elke betekenisvolle verandering EN minstens elke ~10 s via setInterval.
    // api.toast(t): korte melding onderin
    return { destroy() { /* intervals/listeners opruimen; doe nog een laatste api.save */ } };
  },
};
```
Regels:
- Een echt "groot" spel: diepte, progressie (upgrades, levels, verzamelingen), meerdere schermen/tabs binnen het spel, doelen.
- Voortgang MOET opslaan en laden (api.load aan het begin). Offline-voortgang berekenen met `Date.now()` verschil (max 8 uur).
- Zorg dat de balans redelijk is: eerste 2 minuten geven al snel iets te doen/kopen; getallen netjes formatteren (1,2K / 3,4M).
- Maak de UI aantrekkelijk met emoji + inline CSS (gradients, afgeronde hoeken). Grote tikvlakken (min. 44px hoog).
- Geen zware bibliotheken. Alles in één bestand, mag 400-900 regels zijn.

## 3. Clips (korte geanimeerde grapjes)  (`docs/games/clips/<naam>.js`)

```js
export const CLIPS = [
  { id: 'a01', title: 'De ontsnapte kip', caption: 'Hij had echt haast.', dur: 6,
    draw(ctx, t, w, h) { /* teken frame op tijd t (seconden, 0..dur) op canvas ctx; w=360, h=640 logisch */ } },
];
```
Regels:
- `draw` is een PURE functie van `t` (deterministisch, geen state tussen frames) zodat de lus naadloos herhaalt: gebruik `t % dur`-logica,
  sinussen en easing. Schaal: de shell zet `ctx` al op 360x640 logische eenheden; wis zelf het canvas (`ctx.clearRect`) en teken achtergrond.
- Emoji tekenen met `ctx.font = '72px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('🐔', x, y)`.
- De `caption` en `title` worden door de shell als DOM-tekst over het beeld gezet; teken die zelf NIET.
- Elk clipje moet echt grappig/verrassend zijn (gag, ontsnapping, tegenslag, plot twist) in 4-8 seconden, in Nederlands humor.
- Maak veel verschillende situaties (niet 80x hetzelfde met andere emoji). Hergebruik van hulpfuncties binnen het bestand is prima.
- `id` unieke korte strings.

## Testen
- Syntaxcheck: `node --check <bestand>.js` (er staat een package.json met type=module in docs/games).
- Controleer zelf zorgvuldig op typefouten, undefined variabelen en vergeten opruimen in destroy().
- Schrijf alleen in je eigen bestanden. Raak `docs/index.html`, `docs/chat.js`, `docs/games/shell.js` en andere bestanden NIET aan.
