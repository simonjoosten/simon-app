const WOORDEN = [
  'FIETS', 'KAAS', 'BOOM', 'HUIS', 'SCHOOL', 'KONIJN', 'OLIFANT', 'GIRAFFE', 'VLIEGTUIG', 'TREIN',
  'PANNENKOEK', 'CHOCOLADE', 'ZONNEBRIL', 'PARAPLU', 'VOETBAL', 'REGENBOOG', 'KASTEEL', 'DRAAK', 'PIRAAT', 'SCHATKIST',
  'BIBLIOTHEEK', 'COMPUTER', 'TELEFOON', 'KEUKEN', 'SLAAPKAMER', 'TANDENBORSTEL', 'AARDBEI', 'BANAAN', 'APPELTAART', 'FRIETJES',
  'STROOPWAFEL', 'WINDMOLEN', 'TULP', 'KLOMPEN', 'GRACHT', 'BRUG', 'STRAND', 'ZANDKASTEEL', 'ZEEPAARDJE', 'DOLFIJN',
  'KROKODIL', 'PINGUIN', 'EEKHOORN', 'VLINDER', 'LIEVEHEERSBEESTJE', 'SPIN', 'KIKKER', 'SCHILDPAD', 'PAPEGAAI', 'UIL',
  'BRANDWEERAUTO', 'POLITIE', 'AMBULANCE', 'TRACTOR', 'RAKET', 'MAANLANDING', 'STERRENBEELD', 'ASTRONAUT', 'ZWEMBAD', 'SCHOMMEL',
  'TROMPET', 'VIOOL', 'GITAAR', 'TAMBOER', 'VERJAARDAG', 'CADEAUTJE', 'SLINGER', 'TAART', 'KAARSJE', 'FEESTHOED',
  'SNEEUWPOP', 'SCHAATSEN', 'ZOMERVAKANTIE', 'CAMPING', 'TENT', 'ZAKLAMP', 'KOMPAS', 'LANDKAART', 'RUGZAK', 'BOOMHUT',
];
export default {
  id: 'galgje',
  name: 'Galgje',
  emoji: '🔤',
  hint: 'Raad het woord letter voor letter - 6 fouten is game over',
  create(host, api) {
    host.style.touchAction = 'manipulation';
    host.style.background = '#2b2146';
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;font-family:system-ui,sans-serif;color:#fff;padding:10px 8px 12px;box-sizing:border-box;user-select:none;-webkit-user-select:none';
    root.innerHTML =
      '<div style="width:100%;display:flex;justify-content:space-between;font-weight:700;font-size:16px;padding:0 6px"><span data-r="info"></span><span data-r="lives"></span></div>' +
      '<svg viewBox="0 0 200 170" style="width:62%;max-width:230px;flex:0 0 auto;margin:4px 0" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none">' +
      '<path stroke="#a8825a" d="M20 160 H110 M45 160 V15 H130 M45 45 L75 15"/>' +
      '<path data-p="0" stroke="#d9c7ff" d="M130 15 V35" />' +
      '<circle data-p="1" cx="130" cy="50" r="15" stroke="#ffd9a8"/>' +
      '<path data-p="2" d="M130 65 V105" stroke="#ffd9a8"/>' +
      '<path data-p="3" d="M130 75 L110 95" stroke="#ffd9a8"/>' +
      '<path data-p="4" d="M130 75 L150 95" stroke="#ffd9a8"/>' +
      '<path data-p="5" d="M130 105 L113 135 M130 105 L147 135" stroke="#ffd9a8"/>' +
      '</svg>' +
      '<div data-r="word" style="font-size:30px;font-weight:800;letter-spacing:5px;min-height:40px;text-align:center;word-break:break-all;padding:0 6px"></div>' +
      '<div data-r="msg" style="min-height:22px;font-size:16px;margin:4px 0 8px;text-align:center"></div>' +
      '<div data-r="kb" style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;width:100%;max-width:380px;margin-top:auto"></div>';
    host.appendChild(root);
    const q = n => root.querySelector('[data-r="' + n + '"]');
    const elInfo = q('info'), elLives = q('lives'), elWord = q('word'), elMsg = q('msg'), elKb = q('kb');
    const parts = Array.from(root.querySelectorAll('[data-p]'));

    let dead = false, done = false, timer = 0;
    let order = WOORDEN.slice().sort(() => Math.random() - 0.5), idx = 0;
    let word = '', guessed = new Set(), wrong = 0, score = 0, solved = 0, locked = false;
    const btns = {};
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(L => {
      const b = document.createElement('button');
      b.textContent = L;
      b.style.cssText = 'height:44px;border:0;border-radius:10px;background:#5b4a9e;color:#fff;font-size:20px;font-weight:700;cursor:pointer;touch-action:manipulation';
      b.addEventListener('click', () => guess(L));
      elKb.appendChild(b); btns[L] = b;
    });
    function setBtn(L, state) {
      const b = btns[L];
      b.disabled = state !== 'free';
      b.style.background = state === 'free' ? '#5b4a9e' : state === 'good' ? '#2e9e57' : '#a33a4a';
      b.style.opacity = state === 'free' ? '1' : '0.65';
    }
    function setTimer(fn, ms) { clearTimeout(timer); timer = setTimeout(() => { if (!dead) fn(); }, ms); }
    function render() {
      elWord.textContent = word.split('').map(c => guessed.has(c) ? c : '_').join(' ');
      elLives.textContent = '❤️'.repeat(Math.max(0, 6 - wrong)) + '🖤'.repeat(Math.min(6, wrong));
      elInfo.textContent = 'Score ' + score;
      parts.forEach((p, i) => { p.style.display = i < wrong ? '' : 'none'; });
    }
    function nextWord() {
      if (idx >= order.length) { order = WOORDEN.slice().sort(() => Math.random() - 0.5); idx = 0; }
      word = order[idx++]; guessed = new Set(); wrong = 0; locked = false;
      for (const L in btns) setBtn(L, 'free');
      elMsg.textContent = 'Woord ' + (solved + 1) + ' (' + word.length + ' letters)';
      render();
    }
    function guess(L) {
      if (locked || dead || guessed.has(L)) return;
      guessed.add(L);
      if (word.indexOf(L) >= 0) {
        setBtn(L, 'good');
        if (word.split('').every(c => guessed.has(c))) {
          locked = true; solved++;
          const pts = word.length * 5 + (6 - wrong) * 5;
          score += pts; api.score(score);
          elMsg.textContent = 'Goed! +' + pts + ' punten';
          render();
          setTimer(nextWord, 1200);
          return;
        }
      } else {
        setBtn(L, 'bad'); wrong++;
        if (wrong >= 6) {
          locked = true;
          for (const c of word) guessed.add(c);
          render();
          elWord.style.color = '#ff9aa8';
          elMsg.textContent = 'Helaas! Het woord was ' + word;
          setTimer(() => { if (!done) { done = true; api.end(score); } }, 2000);
          return;
        }
      }
      render();
    }
    const onKey = e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const L = (e.key || '').toUpperCase();
      if (L.length === 1 && btns[L]) { e.preventDefault(); guess(L); }
    };
    window.addEventListener('keydown', onKey);
    api.score(0);
    nextWord();
    return {
      destroy() {
        dead = true; clearTimeout(timer);
        window.removeEventListener('keydown', onKey);
        if (root.parentNode === host) host.removeChild(root);
      },
    };
  },
};
