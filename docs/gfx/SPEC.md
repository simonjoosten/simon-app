# Kwaliteitsslag – afspraken (fase 1)

Doel: de apps zien er veel mooier en groter uit. Echte plaatjes i.p.v. emoji's (Blender-renders en zelf getekende canvas-kunst),
instellingen (kwaliteit Normaal/Hoog/Ultra, schaal, geluid, ...), werelden/thema's en korte animatie-scènes.

## Mapstructuur
- `tools/blender/common.py` (klaar), `render_all.py`, `models_a.py`, `models_b.py` -> 3D-icoontjes -> `docs/art/3d/<naam>.png` (192x192, transparant, PNG)
- `docs/art/manifest.js` (gegenereerd door render_all.py): `export const ART3D = { names: [...], v: 1 }` – lijst van wat echt bestaat.
- `docs/gfx/settings.js`, `art.js`, `fx.js`, `scenes.js`, `themes.js`, `panel.js` – de gedeelde kern (ES-modules, geen build).
- Alle bestandsimports krijgen `?v=1`. Geen externe libraries, geen netwerk. Safari: geen ctx.filter, ctx.roundRect, OffscreenCanvas.

## Icoonnamen (bindend; de Blender-agents maken ze, art.js heeft per naam een emoji-fallback)
Elke naam = één kebab-case id. Lijst staat in `docs/gfx/icons.js` (export `ICONS = { naam: emoji }`, zie die file; die is leidend).

## Public API (docs/gfx/art.js)
```js
import { icon, iconUrl, has, preload } from './gfx/art.js?v=1';
iconUrl('coin')            // -> 'art/3d/coin.png' (relatief t.o.v. docs/ via new URL(..., import.meta.url)) of null als die niet bestaat
icon('coin', {size:32, cls:'x', alt:'munt'})  // -> HTML-string '<img ...>' (of <span> met emoji als de PNG ontbreekt)
has('coin')                // bool: bestaat de PNG (op basis van manifest)
preload(['coin','gem'])    // -> Promise<Map naam -> HTMLImageElement> voor canvas: ctx.drawImage
drawIcon(ctx, 'coin', x, y, size, {rot, shadow, alpha})  // sync; tekent PNG als geladen, anders emoji-tekst; start de load op de achtergrond
```
## Instellingen (docs/gfx/settings.js)
```js
import { Settings, GFX } from './gfx/settings.js?v=1';
Settings.get()   // { quality:'normaal'|'hoog'|'ultra', uiScale:1, fontScale:1, sound:true, music:true, reduceMotion:false, colorblind:'uit'|'deutan'|'protan'|'tritan', theme:'auto'|'licht'|'donker', accent:'#6366f1' }
Settings.set(partial); Settings.onChange(fn) -> off()
GFX.q            // 0|1|2 (normaal|hoog|ultra) live bijgewerkt; GFX.reduce bool; GFX.particles(n) -> n geschaald naar kwaliteit; GFX.dpr -> aanbevolen canvas-resolutie (1/1.5/2 begrensd door devicePixelRatio)
```
Opslag: localStorage `gfx:settings` (+ best-effort `gamesaves/gfx-settings__<uid>` via `Settings.bindCloud(db, uid)` met exact velden {game,uid,data,updated}).
Default quality: automatisch kiezen op basis van `navigator.hardwareConcurrency`/deviceMemory/dpr, maar gebruiker kan altijd overrulen.
`Settings.apply()` zet op `<html>`: `data-gfx-q`, `data-reduce`, `data-cb` (kleurenblind), CSS-vars `--gfx-scale`, `--gfx-font`, `--gfx-accent`; en een SVG-kleurenblind-filter (feColorMatrix) zonder ctx.filter.

## Paneel (docs/gfx/panel.js)
`openSettingsPanel({ title, toast })` -> modal met alle instellingen, grote touch-knoppen, nl; sluit netjes (verwijdert node en <style>). Alles via DOM, geen globale CSS-lekken (prefix `.gfx-`).

## FX (docs/gfx/fx.js)
Canvas-hulpjes die op kwaliteit reageren: `Particles(ctx-agnostic)`: `fx.burst(x,y,{kind:'coins'|'sparkle'|'confetti'|'smoke'|'bubbles'|'stars', n})`, `fx.update(dt)`, `fx.draw(ctx)`;
`softShadow(ctx,x,y,rx,ry,a)`, `glow(ctx,x,y,r,color,a)` (radial gradient, geen blur-filter), `vignette(ctx,w,h,a)`, `gradientSky(ctx,w,h,top,bottom)`, `lightRays`, `bokeh`. Bij GFX.q=0 doen dure effecten niets of minder.

## Scènes (docs/gfx/scenes.js) – geanimeerde intro's/overwinning, getekend in canvas (geen video)
`Scenes.list` (id -> {name}), `Scenes.play(host, id, opts) -> { stop(), done: Promise }` met opts `{title, sub, theme, w, h, loop:false, skippable:true}`.
Minstens 14 scènes: intro-ruimte, intro-onderwater, intro-kasteel, intro-bos, intro-stad, intro-pretpark, intro-boerderij, intro-snoepland,
victory (confetti+trofee), levelup, chest-open, coins-rain, boss-defeated, new-record, daily-bonus. Gebruik bij voorkeur icons uit art.js.
Elke scène: ≥3 lagen parallax/animatie, 2-4 seconden, tik = overslaan, respecteert GFX.reduce (dan statisch + korte fade).

## Thema's/werelden (docs/gfx/themes.js)
```js
WORLDS = [{ id:'ruimte', name:'Ruimte', emoji:'🚀', bg:['#0b1026','#3b1d6e'], accent:'#a78bfa', ground:'#1e1b4b', deco:['rocket','planet','star'], particle:'stars', mood:'dark' }, ...]  // >= 12 werelden
Themes.world(id), Themes.forGame(gameId) -> huidige wereld voor dat spel (opslag gfx:world:<gameId>), Themes.setForGame(gameId, worldId),
Themes.paintBackground(ctx, w, h, world, t)  // lagen: verloop + ver/mid/voor-deco + deeltjes; kwaliteit-bewust
Themes.cssVars(world) -> object voor style
```
Werelden minimaal: ruimte, onderwater, kasteel, bos, woestijn, ijs, snoepland, stad, jungle, vulkaan, wolken, piraten, robots, dino, neon, herfst.

## Kwaliteitsregels
- Elke module test je met `node` (mock DOM waar nodig) – GEEN browser gebruiken, de hoofdagent test dat zelf.
- Ultra mag mooi zijn; Normaal moet vlot blijven op een oude iPhone (geen shadowBlur-orgieën, lage deeltjesaantallen).
- Teksten in het Nederlands, voor kinderen/tieners; grote tikvlakken (≥44px).
- Rapporteer kort wat je gemaakt hebt en wat niet getest is.
