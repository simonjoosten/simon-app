# Gamescroller – spelcontract (lees dit eerst)

Alles is statisch: plain ES-modules in de browser, GEEN build-stap, GEEN npm-pakketten, GEEN externe afbeeldingen of
libraries (alleen emoji, canvas en DOM). Taal van alle teksten in het spel: **Nederlands**. Mobile-first (telefoon, ~360x640),
maar moet ook met muis en toetsenbord werken. Veilig voor kinderen, geen geweld in beeld behalve cartoon-niveau.

Houd elk bestand zelfstandig. Importeer nooit andere spelbestanden. De huidige spellen staan in docs/games/mini/ (je mag ze bekijken voor stijl, maar niet kopiëren of wijzigen). Gebruik geen `alert`/`prompt`/`confirm`.

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

### Opslaan van voortgang (alleen voor spellen die dat in hun opdracht hebben)
Voeg dan een eigenschap `save` toe aan het spel-object: `save: 'day'` (de shell bewaart de stand 1 dag en wist hem daarna vanzelf)
of `save: 'forever'` (blijft altijd). De beste score bewaart de shell sowieso zelf.
```js
export default {
  id: '...', name: '...', emoji: '...', hint: '...',
  save: 'day',                         // of 'forever'
  create(host, api) {
    api.load().then((saved) => { /* saved = object of null; maak/herstel je spel */ });  // Promise -> object | null
    api.save(obj);                     // bewaar de stand (JSON-object, KLEIN: maximaal ~10 KB). Roep aan na elke zet/betekenisvolle verandering en bij destroy.
    api.clear();                       // wis de stand (bij gewonnen/verloren/nieuw spel)
    return { destroy() { /* ruim op; werkt ook als load nog bezig is; doe in destroy nog een laatste api.save(...) */ } };
  },
};
```
Bewaar alleen wat nodig is om verder te spelen (bord, score, beurt, tegoeden), geen plaatjes of grote lijsten. Spellen zonder `save` roepen deze functies NIET aan.
Spellen die nooit "af" zijn (tycoons, klikkers): roep `api.end` NIET aan, maar werk `api.score(n)` voortdurend bij; de shell bewaart de hoogste score zodra de speler stopt.
Tycoontjes: speelbaar in 3-10 minuten per sessie, met een eigen thema, geld verdienen, upgrades kopen en een duidelijk doel; met `save: 'day'` of `'forever'` zoals in hun opdracht.

## 2. Clips (korte geanimeerde grapjes)  (`docs/games/clips/<naam>.js`)

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
