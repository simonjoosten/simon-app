const FEITEN = [
  "Een octopus heeft drie harten.|1|Twee harten pompen bloed langs de kieuwen, één door het lichaam.",
  "De zon is een planeet.|0|De zon is een ster, geen planeet.",
  "Honing kan nooit bederven.|1|Honing bevat bijna geen water en is erg zuur, daardoor blijft het heel lang goed.",
  "Vlinders proeven met hun voeten.|1|Ze hebben smaakzintuigjes op hun poten.",
  "Een dag op Venus is korter dan een jaar op Venus.|0|Venus draait zo langzaam dat een dag langer duurt dan haar jaar.",
  "Amsterdam is de hoofdstad van Nederland.|1|Maar de regering zit in Den Haag.",
  "Kamelen slaan water op in hun bulten.|0|In de bulten zit vet, geen water.",
  "Een haai heeft botten.|0|Haaien hebben een skelet van kraakbeen.",
  "Het Great Barrier Reef ligt bij Australië.|1|Het is het grootste koraalrif ter wereld.",
  "Spinnen zijn insecten.|0|Spinnen hebben acht poten en zijn geen insecten.",
  "Water kookt bij 100 graden Celsius op zeeniveau.|1|Hoger op de berg kookt het al bij een lagere temperatuur.",
  "De Eiffeltoren staat in Londen.|0|Hij staat in Parijs.",
  "Pinguïns leven op de Noordpool.|0|Pinguïns leven op het zuidelijk halfrond, niet op de Noordpool.",
  "Een jaar heeft meestal 365 dagen.|1|Eens in de vier jaar is het een schrikkeljaar met 366 dagen.",
  "Bananen groeien aan bomen.|0|De bananenplant is een enorme kruidachtige plant, geen boom.",
  "Het menselijk lichaam bestaat voor het grootste deel uit water.|1|Ongeveer 60 procent.",
  "Giraffen hebben een paarse tong.|1|De tong is donker en beschermt tegen zonnebrand.",
  "Goud is zwaarder dan ijzer.|1|Goud is ruim twee keer zo zwaar per hoeveelheid.",
  "De maan geeft zelf licht.|0|De maan weerkaatst het licht van de zon.",
  "Een mens heeft vijf zintuigen.|1|Zien, horen, ruiken, proeven en voelen.",
  "Struisvogels steken hun kop in het zand als ze bang zijn.|0|Dat is een mythe.",
  "Olifanten zijn bang voor muizen.|0|Dat is een fabel, ze zijn gewoon voorzichtig.",
  "Het is in Australië zomer als het bij ons winter is.|1|Het zuidelijk halfrond heeft tegengestelde seizoenen.",
  "Een kilo veren is lichter dan een kilo lood.|0|Een kilo is een kilo.",
  "Vleermuizen zijn blind.|0|Ze kunnen prima zien, en gebruiken ook echolocatie.",
  "De Nijl is een rivier in Afrika.|1|Het is een van de langste rivieren ter wereld.",
  "Tomaten zijn botanisch gezien een vrucht.|1|Ze bevatten zaadjes en groeien uit een bloem.",
  "Hagedissen kunnen hun staart laten vallen.|1|De staart groeit meestal weer aan.",
  "Een regenboog heeft acht kleuren.|0|Meestal tellen we zeven kleuren.",
  "Koeien hebben vier magen.|0|Ze hebben één maag met vier compartimenten.",
  "De Mount Everest is de hoogste berg ter wereld.|1|Ongeveer 8849 meter hoog.",
  "Mieren kunnen veel meer dragen dan hun eigen gewicht.|1|Sommige soorten tillen wel 50 keer hun eigen gewicht.",
  "Bij een zonsverduistering staat de maan tussen de zon en de aarde.|1|De maan schuift voor de zon.",
  "De Nederlandse vlag is rood, wit en blauw.|1|In die volgorde van boven naar beneden.",
  "Een tomaat is eigenlijk een soort bes.|1|Botanisch gezien is het een bes.",
  "Dolfijnen zijn vissen.|0|Dolfijnen zijn zoogdieren en ademen lucht.",
  "Een slak heeft tanden.|1|Op zijn tong zitten duizenden kleine tandjes.",
  "De Middellandse Zee ligt tussen Europa en Afrika.|1|Daarom heet hij ook zo: midden in het land.",
  "Zonnebloemen draaien mee met de zon als ze jong zijn.|1|Volwassen bloemen kijken meestal naar het oosten.",
  "Alle vogels kunnen vliegen.|0|Pinguïns, struisvogels en kiwi's kunnen het niet.",
  "Een regenworm heeft geen ogen.|1|Hij voelt het licht met zijn huid.",
  "Chocolade is gemaakt van cacaobonen.|1|Die groeien in tropische landen.",
  "De Atlantische Oceaan ligt tussen Europa en Azië.|0|Hij ligt tussen Europa/Afrika en Amerika.",
  "Een driehoek heeft drie hoeken.|1|En ook drie zijden.",
  "Het hart van een blauwe vinvis is zo groot als een auto.|1|Het is ongeveer zo groot als een kleine auto.",
  "Vissen kunnen niet slapen.|0|Ze rusten, ook al hebben ze geen oogleden.",
  "In Nederland rijden we aan de linkerkant van de weg.|0|We rijden rechts.",
  "De Sahara is de grootste hete woestijn ter wereld.|1|Ze ligt in Noord-Afrika.",
  "Een kangoeroe kan achteruit lopen.|0|Door hun staart en poten kunnen ze dat niet.",
  "Planten maken zuurstof.|1|Ze doen dat bij fotosynthese.",
  "Een volwassen mens heeft 206 botten.|1|Baby's hebben er meer, die groeien later aan elkaar.",
  "Schildpadden kunnen uit hun schild kruipen.|0|Het schild is vastgegroeid aan hun lichaam.",
  "De Rijn stroomt door Nederland.|1|Hij komt via Duitsland ons land binnen.",
  "Katten kunnen in het donker helemaal niets zien.|0|Ze zien beter in het donker dan wij.",
  "De Titanic zonk in de 20e eeuw.|1|Het was in 1912.",
  "Tijdens een bliksemflits is het licht eerder bij je dan het geluid.|1|Licht is veel sneller dan geluid.",
  "Je kunt niet niezen met open ogen.|0|Het kan wel, het is een mythe.",
  "Zout water vriest bij 0 graden.|0|Zout water bevriest pas bij ongeveer -2 graden.",
  "Wortels zijn oranje omdat ze bètacaroteen bevatten.|1|Vroeger waren wortels vaak paars of geel.",
  "Een spin heeft zes poten.|0|Een spin heeft acht poten.",
  "Marsmannetjes zijn echt ontdekt.|0|Er is nog nooit leven op Mars gevonden.",
  "De aarde draait om de zon.|1|Eén rondje duurt ongeveer 365 dagen.",
  "Geluid gaat sneller door warme lucht dan door koude lucht.|1|In warme lucht bewegen de deeltjes sneller.",
  "Ijsberen hebben witte huid.|0|Hun huid is zwart, de vacht is doorzichtig.",
  "Een pad is hetzelfde als een kikker.|0|Padden hebben een drogere, ruwe huid.",
  "Een kameleon verandert van kleur om zich te verstoppen.|0|Vooral om te communiceren en door temperatuur.",
  "Nederland heeft meer fietsen dan inwoners.|1|Er zijn zo'n 23 miljoen fietsen.",
  "De Rode Zee is echt rood.|0|Het water is gewoon blauwgroen.",
  "Een bij kan maar één keer steken en gaat dan dood.|1|Honingbijen laten hun angel achter.",
  "Het langste woord in de wereld is Nederlands.|0|Er zijn veel langere woorden in andere talen.",
  "De Efteling ligt in Brabant.|1|In Kaatsheuvel.",
  "Dinosaurussen leefden tegelijk met de mens.|0|Ze waren al miljoenen jaren uitgestorven.",
  "Spaghetti groeit aan bomen.|0|Pasta wordt gemaakt van tarwe.",
  "Het menselijk brein is een spier.|0|Het is een orgaan van zenuwcellen.",
  "Maan en aarde zijn allebei bollen.|1|De maan is wel veel kleiner.",
  "De Noordzee grenst aan Nederland.|1|Onze kust ligt aan de Noordzee.",
  "De langste rivier van Europa is de Volga.|1|Ze stroomt door Rusland.",
  "Je bot groeit niet meer als je volwassen bent.|0|Botten vernieuwen zichzelf je hele leven.",
  "Een flamingo is roze omdat hij roze eet.|1|Door garnalen en algen krijgt de vogel zijn kleur.",
  "In Japan eten ze met stokjes.|1|Eetstokjes zijn gebruikelijk in Oost-Azië.",
  "IJs is zwaarder dan water.|0|IJs drijft op water, dus het is lichter dan water.",
  "De hartslag gaat omhoog als je rent.|1|Je spieren hebben dan meer zuurstof nodig.",
  "De Elfstedentocht gaat langs elf steden in Friesland.|1|Het is een beroemde schaatstocht.",
  "Een olifant kan springen.|0|Olifanten kunnen niet springen.",
  "Het alfabet in Nederland heeft 26 letters.|1|Van A tot en met Z.",
  "Een jaar telt vier seizoenen.|1|Lente, zomer, herfst en winter.",
  "Aarde is de derde planeet van de zon.|1|Na Mercurius en Venus.",
];
const shuffle = (a) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = b[i]; b[i] = b[j]; b[j] = t;
  }
  return b;
};
const others = (vals, correct, n) => shuffle(Array.from(new Set(vals)).filter((v) => v !== correct)).slice(0, n);
const PRAISE = ['Goed zo!', 'Knap!', 'Top!', 'Helemaal goed!', 'Super!', 'Yes!', 'Raak!'];

function quiz(cfg) {
  const useLives = cfg.lives !== null;
  const lives0 = useLives ? (cfg.lives === undefined ? 3 : cfg.lives) : 0;
  const parsed = cfg.items.map((s) => s.split('|'));
  const game = {
    id: cfg.id, name: cfg.name, emoji: cfg.emoji, hint: cfg.hint,
    create(host, api) {
      host.style.touchAction = 'manipulation';
      host.style.background = cfg.bg || '#22304f';
      const root = document.createElement('div');
      root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;font-family:system-ui,sans-serif;color:#fff;padding:10px 10px 12px;box-sizing:border-box;user-select:none;-webkit-user-select:none;overflow:hidden';
      const bigSize = Math.max(40, Math.min(84, Math.round(api.h * 0.12)));
      root.innerHTML =
        '<div style="width:100%;display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:16px"><span data-r="lives"></span><span data-r="streak"></span><span data-r="score"></span></div>' +
        '<div style="width:100%;height:8px;border-radius:4px;background:rgba(255,255,255,.18);margin:8px 0;overflow:hidden;flex:0 0 auto"><div data-r="bar" style="height:100%;width:100%;background:#ffd24a"></div></div>' +
        '<div data-r="info" style="font-size:13px;opacity:.75;min-height:16px;text-align:center"></div>' +
        '<div data-r="big" style="font-size:' + bigSize + 'px;line-height:1.15;text-align:center;margin-top:8px;max-width:100%;word-break:break-word"></div>' +
        '<div data-r="prompt" style="font-size:20px;font-weight:700;text-align:center;margin:8px 4px;min-height:50px"></div>' +
        '<div data-r="msg" style="font-size:15px;text-align:center;min-height:40px;margin:2px 6px"></div>' +
        '<button data-r="hintbtn" style="display:none;margin:4px 0 8px;padding:8px 16px;border:0;border-radius:18px;background:#7a5ac8;color:#fff;font-size:15px;font-weight:700;cursor:pointer;touch-action:manipulation">💡 Hint (-5 punten)</button>' +
        '<div data-r="opts" style="display:flex;flex-direction:column;gap:9px;width:100%;max-width:420px;margin-top:auto"></div>';
      host.appendChild(root);
      const q = (n) => root.querySelector('[data-r="' + n + '"]');
      const elLives = q('lives'), elStreak = q('streak'), elScore = q('score'), elBar = q('bar'), elInfo = q('info');
      const elBig = q('big'), elPrompt = q('prompt'), elMsg = q('msg'), elOpts = q('opts'), elHint = q('hintbtn');
      if (cfg.hints) elHint.style.display = 'block';

      let dead = false, done = false, started = false, timer = 0, ticker = 0;
      let order = [], qi = 0, score = 0, lives = lives0, streak = 0, locked = true, cur = null;
      let tLeft = 0, total = cfg.totalTime || 0, hintUsed = false;
      let btns = [];

      function setT(fn, ms) { clearTimeout(timer); timer = setTimeout(() => { if (!dead) fn(); }, ms); }
      function hud() {
        let l = '';
        if (useLives) l += '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(Math.max(0, lives0 - lives));
        if (cfg.totalTime) l += (l ? '  ' : '') + '⏱ ' + Math.max(0, Math.ceil(total)) + 's';
        elLives.textContent = l;
        elStreak.textContent = streak > 1 ? '🔥 ' + streak : '';
        elScore.textContent = '⭐ ' + score;
        api.score(score);
        let f = 1;
        if (cfg.totalTime) f = total / (cfg.totalTime + 20);
        else if (cfg.qTime) f = tLeft / cfg.qTime;
        else f = 0;
        elBar.style.width = Math.max(0, Math.min(1, f)) * 100 + '%';
        elBar.style.background = f < 0.25 ? '#ff6b6b' : '#ffd24a';
      }
      function saveState() {
        if (cfg.save && started && !done) api.save({ o: order, q: qi, s: score, l: lives, k: streak });
      }
      function finish() {
        if (done) return;
        done = true;
        clearTimeout(timer); clearInterval(ticker);
        locked = true;
        if (cfg.save) api.clear();
        elMsg.textContent = 'Klaar! Eindscore: ' + score;
        api.score(score);
        api.end(score);
      }
      function show() {
        if (done) return;
        if (useLives && lives <= 0) return finish();
        if (qi >= order.length) {
          if (cfg.loop) { order = shuffle(parsed.map((_, i) => i)); qi = 0; } else return finish();
        }
        cur = cfg.build(parsed[order[qi]], parsed);
        elBig.textContent = cur.big || '';
        elPrompt.textContent = cur.prompt || '';
        elInfo.textContent = (cur.info || '') + (cfg.loop ? '' : '  (' + (qi + 1) + '/' + order.length + ')');
        elMsg.textContent = '';
        elOpts.innerHTML = '';
        btns = [];
        const n = cur.options.length;
        cur.options.forEach((t, i) => {
          const b = document.createElement('button');
          b.textContent = t;
          const h = n <= 2 ? 62 : 50;
          b.style.cssText = 'min-height:' + h + 'px;border:0;border-radius:12px;background:#3d5a99;color:#fff;font-size:' + (t.length > 22 ? 15 : 19) + 'px;font-weight:700;cursor:pointer;touch-action:manipulation;padding:6px 10px';
          b.addEventListener('click', () => answer(i));
          elOpts.appendChild(b);
          btns.push(b);
        });
        hintUsed = false;
        elHint.disabled = false;
        elHint.style.opacity = '1';
        tLeft = cfg.qTime || 0;
        locked = false;
        hud();
      }
      function answer(i) {
        if (locked || dead || done) return;
        locked = true;
        const ok = i === cur.answer;
        btns.forEach((b, k) => {
          b.disabled = true;
          if (k === cur.answer) b.style.background = '#2e9e57';
          else if (k === i) b.style.background = '#a33a4a';
          else b.style.opacity = '0.55';
        });
        const right = cur.options[cur.answer];
        if (ok) {
          streak++;
          let gain = 10 + Math.min(streak - 1, 5) * 2;
          if (cfg.qTime) gain += Math.ceil((tLeft / cfg.qTime) * 5);
          if (hintUsed) gain = 5;
          score += gain;
          if (cfg.totalTime) total += cfg.bonus || 0;
          elMsg.textContent = '✅ ' + PRAISE[Math.floor(Math.random() * PRAISE.length)] + ' +' + gain + (cur.explain ? ' ' + cur.explain : '');
        } else {
          streak = 0;
          if (useLives) lives--;
          if (cfg.totalTime) total = Math.max(0, total - (cfg.penalty || 0));
          elMsg.textContent = (i < 0 ? '⏰ Te laat! ' : '❌ Helaas! ') + 'Het goede antwoord: ' + right + (cur.explain ? '. ' + cur.explain : '');
        }
        qi++;
        hud();
        saveState();
        const quick = !!cfg.totalTime;
        const delay = ok ? (cur.explain ? 1700 : quick ? 300 : 800) : (cur.explain ? 3200 : quick ? 900 : 1800);
        setT(show, delay);
      }
      function useHint() {
        if (locked || dead || done || hintUsed || !cur || !cur.hint) return;
        hintUsed = true;
        elHint.disabled = true;
        elHint.style.opacity = '0.5';
        const wrong = [];
        cur.options.forEach((_, k) => { if (k !== cur.answer) wrong.push(k); });
        shuffle(wrong).slice(0, Math.max(1, cur.options.length - 2)).forEach((k) => {
          btns[k].disabled = true;
          btns[k].style.opacity = '0.25';
        });
        elMsg.textContent = '💡 ' + cur.hint;
      }
      elHint.addEventListener('click', useHint);
      function onKey(e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const k = e.key.toLowerCase();
        if (k >= '1' && k <= '9') {
          const i = Number(k) - 1;
          if (cur && i < cur.options.length && !btns[i].disabled) answer(i);
        } else if (k === 'h' && cfg.hints) useHint();
      }
      window.addEventListener('keydown', onKey);

      function begin(s) {
        started = true;
        const n = parsed.length;
        let ok = false;
        if (s && Array.isArray(s.o) && s.o.length === n && s.o.every((v) => Number.isInteger(v) && v >= 0 && v < n) &&
            Number.isInteger(s.q) && s.q >= 0 && s.q < n && s.l > 0) {
          order = s.o; qi = s.q; score = Number(s.s) || 0; lives = s.l; streak = Number(s.k) || 0; ok = true;
        }
        if (!ok) order = shuffle(parsed.map((_, i) => i));
        hud();
        show();
        ticker = setInterval(() => {
          if (dead || done) return;
          if (cfg.totalTime) {
            total -= 0.1;
            if (total <= 0) { total = 0; hud(); finish(); return; }
          }
          if (cfg.qTime && !locked) {
            tLeft -= 0.1;
            if (tLeft <= 0) { tLeft = 0; answer(-1); return; }
          }
          if (cfg.totalTime || cfg.qTime) hud();
        }, 100);
      }
      if (cfg.save) {
        let p;
        try { p = api.load(); } catch (e) { p = Promise.resolve(null); }
        Promise.resolve(p).then((s) => { if (!dead) begin(s); }, () => { if (!dead) begin(null); });
      } else begin(null);

      return {
        destroy() {
          saveState();
          dead = true;
          clearTimeout(timer); clearInterval(ticker);
          window.removeEventListener('keydown', onKey);
          if (root.parentNode) root.parentNode.removeChild(root);
        },
      };
    },
  };
  if (cfg.save) game.save = cfg.save;
  return game;
}
export default quiz({
  id: 'waarofnietwaar', name: 'Waar of niet waar', emoji: '🤔', hint: 'Is het waar of niet waar? 3 fouten = game over', save: 'day',
  bg: '#1f4a5a', items: FEITEN, lives: 3,
  build(p) {
    return { big: '🤔', prompt: p[0], info: 'Waar of niet waar?', options: ['✅ Waar', '❌ Niet waar'], answer: p[1] === '1' ? 0 : 1, explain: p[2] };
  },
});
