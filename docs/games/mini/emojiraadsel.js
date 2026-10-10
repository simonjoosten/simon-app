const RAADSELS = [
  "☀️🌻|Zonnebloem|woord", "🌧️🌈|Regenboog|woord", "⛄|Sneeuwpop|woord", "🦷🪥|Tandenborstel|woord",
  "🛏️🏠|Slaapkamer|woord", "📚🏛️|Bibliotheek|woord", "✈️🛬|Vliegveld|woord", "🚒🔥|Brandweerauto|woord",
  "🏖️🏰|Zandkasteel|woord", "🐝🍯|Honingbij|woord", "🚀🌙|Maanlanding|woord", "🕷️🕸️|Spinnenweb|woord",
  "🔑🕳️|Sleutelgat|woord", "⚽🥅|Doelpunt|woord", "🌋|Vulkaan|woord", "🎂🕯️|Verjaardag|woord",
  "📞|Telefoon|woord", "👑👸|Prinses|woord", "🏴‍☠️💎|Piratenschat|woord", "🧊🍦|IJsje|woord",
  "🍎🥧|Appeltaart|eten", "🍓🍦|Aardbeienijs|eten", "🥔🍟|Patat|eten", "🧀🍞|Kaasbroodje|eten",
  "🍫🥛|Chocolademelk|eten", "🥞🍯|Pannenkoek|eten", "🍅🍝|Spaghetti|eten", "🍔🍟|Hamburger|eten",
  "🥜🧈|Pindakaas|eten", "🍇🧃|Druivensap|eten", "🍌|Banaan|eten", "🍕|Pizza|eten",
  "🪰🪰👋|Twee vliegen in één klap|uitdrukking", "🍎🌳|De appel valt niet ver van de boom|uitdrukking",
  "🐴🛒🔙|Het paard achter de wagen spannen|uitdrukking", "🐘🏺|Een olifant in de porseleinkast|uitdrukking",
  "🕳️☁️🦘|Een gat in de lucht springen|uitdrukking", "🐟💦|Als een vis in het water|uitdrukking",
  "☔💦🌧️|Het regent pijpenstelen|uitdrukking", "🧊🔨|Het ijs breken|uitdrukking",
  "🐑🐑🐑😴|Schaapjes tellen|uitdrukking", "🐱🏠❌🐭💃|Als de kat van huis is, dansen de muizen|uitdrukking",
  "🧈🐟|Boter bij de vis|uitdrukking", "👀🙏|Eerst zien, dan geloven|uitdrukking",
  "🧜‍♀️🌊|De Kleine Zeemeermin|film", "🦁👑|De Leeuwenkoning|film", "❄️👸|Frozen|film",
  "🐀👨‍🍳|Ratatouille|film", "🧙‍♂️⚡|Harry Potter|film", "🐠🔍|Op zoek naar Nemo|film",
  "🐺🏠🐷|De drie biggetjes|film", "👸🍎|Sneeuwwitje|film", "👠🎃|Assepoester|film",
  "🐺👧🧺|Roodkapje|film", "🧸🍯|Winnie de Poeh|film", "🐘🎪|Dombo|film",
  "🗼🥐|Parijs|plaats", "🌷🚲|Amsterdam|plaats", "🗽🍎|New York|plaats", "🕰️☔|Londen|plaats",
  "🍕🏛️|Rome|plaats", "🦘🐨|Australië|plaats", "🏔️🧀|Zwitserland|plaats", "🐪🔺|Egypte|plaats",
  "🌴🏝️|Een tropisch eiland|plaats", "🎡🌉|Pretpark|plaats",
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
  id: 'emojiraadsel', name: 'Emojiraadsel', emoji: '🧩', hint: 'Raad het woord of de uitdrukking uit emoji - gebruik een hint als je vastzit',
  bg: '#3a3a78', items: RAADSELS, lives: 3, hints: true,
  build(p, all) {
    const same = all.filter((x) => x[2] === p[2]).map((x) => x[1]);
    let pool = others(same, p[1], 3);
    if (pool.length < 3) pool = pool.concat(others(all.map((x) => x[1]).filter((v) => pool.indexOf(v) < 0), p[1], 3 - pool.length));
    const options = shuffle(pool.concat([p[1]]));
    const hint = 'Soort: ' + p[2] + '. Begint met "' + p[1].charAt(0) + '" en heeft ' + p[1].replace(/ /g, '').length + ' letters.';
    return { big: p[0], prompt: 'Wat bedoelen deze emoji?', info: 'Soort: ' + p[2], options, answer: options.indexOf(p[1]), hint };
  },
});
