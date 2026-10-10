const DIEREN = [
  "🐶|hond|Beste vriend van de mens en jaagt achter een bal aan|woef",
  "🐱|kat|Spint op schoot en vangt muizen|miauw",
  "🐮|koe|Staat in de wei en geeft melk|boe",
  "🐷|varken|Roze boerderijdier dat graag in de modder rolt|knor",
  "🐑|schaap|Heeft een wollen jas en staat in de wei|bèèh",
  "🐴|paard|Je kunt erop rijden en het heeft een manen|hinnik",
  "🐔|kip|Legt eieren op de boerderij|tok tok",
  "🐓|haan|Maakt je 's ochtends vroeg wakker|kukeleku",
  "🦆|eend|Zwemt in de vijver en heeft zwemvliezen|kwak kwak",
  "🐸|kikker|Springt, woont bij de sloot en begon als kikkervisje|kwaak",
  "🐭|muis|Klein knaagdiertje dat van kaas houdt|piep",
  "🐰|konijn|Heeft lange oren en eet graag wortels|",
  "🐻|beer|Groot en bruin, houdt in de winter een lange slaap|grom",
  "🐼|panda|Zwart-wit en eet de hele dag bamboe|",
  "🐨|koala|Slaapt bijna de hele dag in eucalyptusbomen in Australië|",
  "🦁|leeuw|De koning van de savanne met een grote manen|brul",
  "🐯|tijger|Grote gestreepte kat uit Azië|grom",
  "🐘|olifant|Grootste landdier met een slurf en slagtanden|toeter",
  "🦒|giraffe|Heeft de langste nek van alle dieren|",
  "🦓|zebra|Lijkt op een paard maar heeft zwarte en witte strepen|",
  "🦘|kangoeroe|Springt rond in Australië en draagt zijn jong in een buidel|",
  "🐒|aap|Klimt in bomen en eet graag bananen|oe oe aa aa",
  "🦊|vos|Slim roodbruin dier met een pluimstaart|",
  "🐺|wolf|Roofdier dat in een roedel leeft en naar de maan huilt|oehoe",
  "🦉|uil|Nachtvogel met grote ogen en een platte kop|oehoe",
  "🦅|adelaar|Grote roofvogel met scherpe ogen en klauwen|",
  "🐧|pinguïn|Vogel die niet kan vliegen maar goed zwemt en op het ijs leeft|",
  "🐬|dolfijn|Slim zeedier dat graag uit het water springt|klik klik",
  "🐳|walvis|Het grootste dier van de wereld, leeft in zee|",
  "🦈|haai|Zeedier met een rugvin en scherpe tanden|",
  "🐙|octopus|Heeft acht armen en leeft in zee|",
  "🐢|schildpad|Heel langzaam en draagt zijn huis als pantser op zijn rug|",
  "🐍|slang|Heeft geen poten en kruipt over de grond|ssss",
  "🐊|krokodil|Groot reptiel met een lange bek vol tanden in de rivier|",
  "🦎|hagedis|Klein reptiel dat zijn staart kan laten vallen|",
  "🐛|rups|Eet bladeren en wordt later een vlinder|",
  "🦋|vlinder|Heeft kleurige vleugels en was eerst een rups|",
  "🐝|bij|Maakt honing en woont in een korf|zoem",
  "🐞|lieveheersbeestje|Klein rood kevertje met zwarte stippen|",
  "🕷️|spin|Heeft acht poten en maakt een web|",
  "🦀|krab|Loopt zijwaarts en heeft grote scharen|",
  "🐌|slak|Heeft een huisje op zijn rug en laat een slijmspoor achter|",
  "🐜|mier|Klein insect dat hard werkt in een kolonie|",
  "🦔|egel|Heeft stekels en rolt zich op als hij bang is|",
  "🦇|vleermuis|Zoogdier dat vliegt en 's nachts jaagt|",
  "🦜|papegaai|Kleurige vogel die woorden kan nazeggen|krijs",
  "🦢|zwaan|Witte statige watervogel met een lange hals|",
  "🦩|flamingo|Roze vogel die vaak op één poot staat|",
  "🦚|pauw|Vogel met een prachtige waaier van veren|",
  "🦌|hert|Mannetjes hebben een gewei op hun kop|burlen",
  "🐫|kameel|Leeft in de woestijn en heeft bulten|",
  "🦏|neushoorn|Groot grijs dier met een hoorn op zijn neus|",
  "🦛|nijlpaard|Groot dier dat veel in de rivier ligt|",
  "🐿️|eekhoorn|Rood bosdiertje dat noten verstopt|",
  "🦫|bever|Knaagt aan bomen en bouwt dammen|",
  "🦦|otter|Speels waterdier dat graag op zijn rug zwemt|",
  "🦥|luiaard|Hangt de hele dag langzaam in een boom|",
  "🐡|kogelvis|Vis die zich opblaast als een bal|",
  "🦭|zeehond|Ligt op zandbanken en heeft een gladde vacht|",
  "🦃|kalkoen|Grote vogel die vaak met Kerst gegeten wordt|klokklok",
  "🐐|geit|Klimt op rotsen en heeft een baardje|mekkeren",
  "🦞|kreeft|Zeedier met scharen dat rood wordt als het gekookt is|",
  "🦑|inktvis|Spuit inkt als hij bang is en heeft tentakels|",
  "🐗|everzwijn|Wild zwijn met slagtanden in het bos|knor",
  "🐆|luipaard|Gevlekte grote kat die goed kan klimmen|",
  "🦍|gorilla|Grootste mensaap, sterk maar vredelievend|",
  "🐠|vis|Zwemt in het aquarium en ademt met kieuwen|",
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
  id: 'dierenquiz', name: 'Dierenquiz', emoji: '🦁', hint: 'Raad het dier - 3 fouten = game over',
  bg: '#3c5a2a', items: DIEREN, lives: 3, qTime: 15,
  build(p, all) {
    const names = all.map((x) => x[1]);
    const opts = others(names, p[1], 3);
    opts.push(p[1]);
    const options = shuffle(opts);
    const answer = options.indexOf(p[1]);
    const types = ['emoji', 'omschrijving'];
    if (p[3]) types.push('geluid');
    const t = types[Math.floor(Math.random() * types.length)];
    if (t === 'emoji') return { big: p[0], prompt: 'Welk dier is dit?', info: 'Plaatje', options, answer };
    if (t === 'omschrijving') return { big: '🤔', prompt: p[2] + '. Welk dier is dit?', info: 'Omschrijving', options, answer };
    return { big: '🔊', prompt: 'Welk dier zegt "' + p[3] + '"?', info: 'Geluid', options, answer };
  },
});
