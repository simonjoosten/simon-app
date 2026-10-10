const WOORDEN = [
  'MAAN', 'BOOM', 'HUIS', 'KAAS', 'LAMP', 'VUUR', 'WOLK', 'TAND', 'ROOK', 'BLOK', 'ZAND', 'MUUR', 'POES', 'KOEK',
  'TAFEL', 'STOEL', 'FIETS', 'PAARD', 'KLEUR', 'WATER', 'BLOEM', 'SCHIP', 'KRANT', 'MELON', 'TREIN', 'LEPEL', 'PLANT', 'KLOMP',
  'SCHOOL', 'KONIJN', 'BANAAN', 'PIRAAT', 'GITAAR', 'STRAND', 'WINTER', 'BRUGGE', 'CIRKUS', 'FLUITJE',
  'KASTEEL', 'TROMPET', 'PLANEET', 'BLOEMEN', 'VULKAAN', 'ZWEMBAD', 'GRACHTEN', 'TIJGERS',
  'VAKANTIE', 'TELEFOON', 'COMPUTER', 'BOTERHAM', 'SCHILDER', 'WATERVAL', 'MOLENAAR', 'KAMPIOEN',
  'SNEEUWPOP', 'SPEELGOED', 'KANGOEROE', 'ZONNEBRIL', 'REGENBOOG', 'CHOCOLADE', 'AARDBEIEN', 'ASTRONAUT',
  'VERJAARDAG', 'PANNENKOEK', 'SCHATKAMER', 'OLIFANTJES', 'SPEELPLEIN', 'ZWEMBROEK', 'BIBLIOTHEEK',
];
const ALL = Array.from(new Set(WOORDEN));
const sortLetters = (w) => w.split('').sort().join('');
const shuffleArr = (a) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = b[i]; b[i] = b[j]; b[j] = t;
  }
  return b;
};

export default {
  id: 'anagram',
  name: 'Anagram',
  emoji: '🔀',
  hint: 'Zet de gehusselde letters in de goede volgorde - voor de tijd om is',
  create(host, api) {
    host.style.touchAction = 'manipulation';
    host.style.background = '#2e3b66';
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;font-family:system-ui,sans-serif;color:#fff;padding:10px 10px 12px;box-sizing:border-box;user-select:none;-webkit-user-select:none;overflow:hidden';
    root.innerHTML =
      '<div style="width:100%;display:flex;justify-content:space-between;font-weight:700;font-size:16px"><span data-r="lives"></span><span data-r="round"></span><span data-r="score"></span></div>' +
      '<div style="width:100%;height:10px;border-radius:5px;background:rgba(255,255,255,.18);margin:8px 0;overflow:hidden"><div data-r="bar" style="height:100%;width:100%;background:#ffd24a"></div></div>' +
      '<div data-r="time" style="font-size:14px;opacity:.8;min-height:18px"></div>' +
      '<div data-r="slots" style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap;margin-top:26px;min-height:56px"></div>' +
      '<div data-r="msg" style="min-height:44px;margin:14px 6px 6px;text-align:center;font-size:17px;font-weight:700"></div>' +
      '<div data-r="tiles" style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:8px"></div>' +
      '<div style="display:flex;gap:10px;margin-top:auto;width:100%;max-width:420px">' +
      '<button data-r="shuf" style="flex:1;height:48px;border:0;border-radius:12px;background:#5b4a9e;color:#fff;font-size:16px;font-weight:700;cursor:pointer">🔀 Hussel</button>' +
      '<button data-r="clr" style="flex:1;height:48px;border:0;border-radius:12px;background:#4a6a9e;color:#fff;font-size:16px;font-weight:700;cursor:pointer">⌫ Wis</button>' +
      '<button data-r="hnt" style="flex:1;height:48px;border:0;border-radius:12px;background:#9e7a2e;color:#fff;font-size:16px;font-weight:700;cursor:pointer">💡 Hint</button>' +
      '</div>';
    host.appendChild(root);
    const q = (n) => root.querySelector('[data-r="' + n + '"]');
    const elLives = q('lives'), elRound = q('round'), elScore = q('score'), elBar = q('bar'), elTime = q('time');
    const elSlots = q('slots'), elMsg = q('msg'), elTiles = q('tiles');

    let dead = false, done = false, timer = 0, ticker = 0;
    let round = 0, lives = 3, score = 0, streak = 0;
    let word = '', tiles = [], answer = [], tLeft = 0, tMax = 1, locked = true;
    const used = {};

    function setT(fn, ms) { clearTimeout(timer); timer = setTimeout(() => { if (!dead) fn(); }, ms); }
    function hud() {
      elLives.textContent = '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(Math.max(0, 3 - lives));
      elRound.textContent = 'Woord ' + (round + 1) + (streak > 1 ? '  🔥' + streak : '');
      elScore.textContent = '⭐ ' + score;
      api.score(score);
    }
    function pickWord() {
      const len = Math.min(4 + Math.floor(round / 2), 11);
      let pool = ALL.filter((w) => w.length === len);
      if (!pool.length) {
        const maxLen = Math.max.apply(null, ALL.map((w) => w.length));
        pool = ALL.filter((w) => w.length === Math.min(len, maxLen));
      }
      let fresh = pool.filter((w) => !used[w]);
      if (!fresh.length) { pool.forEach((w) => { delete used[w]; }); fresh = pool; }
      const w = fresh[Math.floor(Math.random() * fresh.length)];
      used[w] = 1;
      return w;
    }
    function scramble(w) {
      let letters = w.split('');
      for (let t = 0; t < 20; t++) {
        letters = shuffleArr(letters);
        if (letters.join('') !== w) break;
      }
      return letters;
    }
    function newWord() {
      if (done) return;
      word = pickWord();
      tiles = scramble(word).map((ch) => ({ ch, used: false }));
      answer = [];
      tMax = tLeft = Math.max(18, 14 + word.length * 4 - Math.floor(round / 2) * 2);
      locked = false;
      elMsg.textContent = '';
      hud();
      render();
    }
    function tileSize() { return Math.max(30, Math.min(52, Math.floor((api.w - 20) / word.length) - 6)); }
    function render() {
      const s = tileSize();
      elSlots.innerHTML = '';
      for (let i = 0; i < word.length; i++) {
        const d = document.createElement('div');
        const has = i < answer.length;
        d.textContent = has ? tiles[answer[i]].ch : '';
        d.style.cssText = 'width:' + s + 'px;height:' + (s + 6) + 'px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:' + Math.round(s * 0.55) + 'px;font-weight:800;box-sizing:border-box;' +
          (has ? 'background:#ffd24a;color:#2e3b66;cursor:pointer' : 'background:rgba(255,255,255,.12);border:2px dashed rgba(255,255,255,.35)');
        if (has) d.addEventListener('click', () => removeAt(i));
        elSlots.appendChild(d);
      }
      elTiles.innerHTML = '';
      tiles.forEach((t, i) => {
        const b = document.createElement('button');
        b.textContent = t.ch;
        b.disabled = t.used;
        b.style.cssText = 'width:' + s + 'px;height:' + (s + 6) + 'px;border:0;border-radius:10px;font-size:' + Math.round(s * 0.55) + 'px;font-weight:800;cursor:pointer;touch-action:manipulation;background:' + (t.used ? 'rgba(255,255,255,.1)' : '#5b7fd0') + ';color:' + (t.used ? 'transparent' : '#fff');
        b.addEventListener('click', () => addTile(i));
        elTiles.appendChild(b);
      });
    }
    function addTile(i) {
      if (locked || dead || done || tiles[i].used || answer.length >= word.length) return;
      tiles[i].used = true;
      answer.push(i);
      render();
      if (answer.length === word.length) check();
    }
    function removeAt(i) {
      if (locked || dead || done || i >= answer.length) return;
      const idx = answer.splice(i, 1)[0];
      tiles[idx].used = false;
      render();
    }
    function check() {
      const str = answer.map((i) => tiles[i].ch).join('');
      if (str === word || (ALL.indexOf(str) >= 0 && sortLetters(str) === sortLetters(word))) {
        locked = true;
        streak++;
        const gain = word.length * 10 + Math.ceil(tLeft) * 2 + Math.min(streak - 1, 5) * 5;
        score += gain;
        elMsg.textContent = '✅ ' + str + '! +' + gain;
        round++;
        hud();
        setT(newWord, 1100);
      } else {
        elMsg.textContent = '❌ Dat is het niet, probeer nog eens';
        tLeft = Math.max(0, tLeft - 2);
        locked = true;
        setT(() => {
          answer.forEach((i) => { tiles[i].used = false; });
          answer = [];
          elMsg.textContent = '';
          locked = false;
          render();
        }, 700);
      }
    }
    function timeUp() {
      locked = true;
      streak = 0;
      lives--;
      elMsg.textContent = '⏰ Tijd om! Het woord was ' + word;
      answer = [];
      tiles.forEach((t) => { t.used = false; });
      hud();
      if (lives <= 0) setT(finish, 1800);
      else { round++; setT(newWord, 2000); }
    }
    function finish() {
      if (done) return;
      done = true;
      clearInterval(ticker); clearTimeout(timer);
      api.score(score);
      api.end(score);
    }
    function hint() {
      if (locked || dead || done) return;
      let p = 0;
      while (p < answer.length && tiles[answer[p]].ch === word[p]) p++;
      while (answer.length > p) { const idx = answer.pop(); tiles[idx].used = false; }
      const want = word[p];
      const ti = tiles.findIndex((t) => !t.used && t.ch === want);
      if (ti < 0) return;
      score = Math.max(0, score - 8);
      hud();
      tiles[ti].used = true;
      answer.push(ti);
      render();
      if (answer.length === word.length) check();
    }
    function clearAll() {
      if (locked || dead || done) return;
      answer.forEach((i) => { tiles[i].used = false; });
      answer = [];
      render();
    }
    function reshuffle() {
      if (locked || dead || done) return;
      answer.forEach((i) => { tiles[i].used = false; });
      answer = [];
      tiles = scramble(word).map((ch) => ({ ch, used: false }));
      render();
    }
    q('shuf').addEventListener('click', reshuffle);
    q('clr').addEventListener('click', clearAll);
    q('hnt').addEventListener('click', hint);
    function onKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Backspace') { if (answer.length) removeAt(answer.length - 1); e.preventDefault(); return; }
      if (e.key.length !== 1) return;
      const ch = e.key.toUpperCase();
      const ti = tiles.findIndex((t) => !t.used && t.ch === ch);
      if (ti >= 0) addTile(ti);
    }
    window.addEventListener('keydown', onKey);

    ticker = setInterval(() => {
      if (dead || done || locked) return;
      tLeft -= 0.1;
      if (tLeft <= 0) { tLeft = 0; elBar.style.width = '0%'; timeUp(); return; }
      elBar.style.width = (tLeft / tMax) * 100 + '%';
      elBar.style.background = tLeft / tMax < 0.25 ? '#ff6b6b' : '#ffd24a';
      elTime.textContent = '⏱ ' + Math.ceil(tLeft) + ' sec';
    }, 100);

    newWord();

    return {
      destroy() {
        dead = true;
        clearTimeout(timer); clearInterval(ticker);
        window.removeEventListener('keydown', onKey);
        if (root.parentNode) root.parentNode.removeChild(root);
      },
    };
  },
};
