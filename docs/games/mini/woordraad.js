const RAW = `appel baard beker bezem bloem boter brood brief broek bruin buurt draak drank droom druif eerst einde engel fiets fluit fruit gebak geluk gevel glans graag groen grond haven hoofd horen hotel jacht jager kaars kamer kaart kerel keuze klaar klant klein knoop koers koken komen kraan krant kruid kudde kunst laars leven licht lucht maand maken markt menen meren model mooie motor muren naald nacht nagel neven nooit noten paard paars pauze peren piano plaat plant plein poort preek prijs raken radio regen reden rijst roman salon samen schat schip slang sleep sloot sport staal stoel stoep stoom storm straf strik stuur taart tafel tekst thuis trein trots vader valse vanaf vacht vlees vlieg vloer vogel volle vrede vrees vrouw wagen water weten woord worst zacht zalig zeker zeven zomer zonde zwaan zwart zwijn bloed borst bruid chips dozen droog eiken feest figuur gaten giraf goud haast hagel heren herfst hemel hoorn jonge kaas kikker kleur koorts kopen koud lachen lamp linde loper maten mijne mist molen munt nieuw onder oorlog pijn plank prins punt raam reken riem rood ruzie schaar schoen slaap sneeuw soort spoor steen stoet straat tanden trap tulp vallen varen vlam voet vork wolk zilver zwaar`;

const WORDS = Array.from(new Set(RAW.split(/\s+/).map(w => w.toUpperCase()).filter(w => /^[A-Z]{5}$/.test(w))));

export default {
  id: 'woordraad',
  name: 'Woordraad',
  emoji: '🔤',
  hint: 'Raad het woord van 5 letters in 6 pogingen. Groen = goede plek, geel = verkeerde plek.',
  create(host, api) {
    host.style.touchAction = 'none';
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;background:#121826;color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:space-between;box-sizing:border-box;padding:10px 6px;user-select:none';
    host.appendChild(root);
    let dead = false, ended = false;
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); };

    const info = document.createElement('div');
    info.style.cssText = 'font-size:16px;font-weight:700;text-align:center;min-height:22px';
    const msg = document.createElement('div');
    msg.style.cssText = 'font-size:15px;min-height:20px;color:#fde68a;text-align:center';
    const tile = Math.max(30, Math.min(52, Math.floor((api.h - 340) / 6 - 5), Math.floor((api.w - 40) / 5 - 5)));
    const gridEl = document.createElement('div');
    gridEl.style.cssText = `display:grid;grid-template-columns:repeat(5,${tile}px);gap:5px`;
    const tiles = [];
    for (let i = 0; i < 30; i++) {
      const t = document.createElement('div');
      t.style.cssText = `width:${tile}px;height:${tile}px;border:2px solid #3b4660;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:${Math.floor(tile * 0.55)}px;font-weight:800;box-sizing:border-box`;
      gridEl.appendChild(t);
      tiles.push(t);
    }
    const kb = document.createElement('div');
    kb.style.cssText = 'display:flex;flex-direction:column;gap:6px;width:100%;align-items:center';
    const keyEls = {};
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', '+ZXCVBNM-'];
    const kw = Math.min(34, Math.floor((api.w - 12 - 9 * 5) / 10));
    for (const row of rows) {
      const r = document.createElement('div');
      r.style.cssText = 'display:flex;gap:5px;justify-content:center';
      for (const ch of row) {
        const b = document.createElement('button');
        const special = ch === '+' || ch === '-';
        b.textContent = ch === '+' ? 'OK' : ch === '-' ? '⌫' : ch;
        b.style.cssText = `height:44px;min-width:${special ? kw * 1.5 : kw}px;padding:0 ${special ? 6 : 0}px;border:0;border-radius:6px;background:#475069;color:#fff;font-size:${special ? 14 : 16}px;font-weight:700;cursor:pointer;touch-action:manipulation`;
        b.addEventListener('click', () => press(ch === '+' ? 'ENTER' : ch === '-' ? 'BACK' : ch));
        r.appendChild(b);
        if (!special) keyEls[ch] = b;
      }
      kb.appendChild(r);
    }
    const top = document.createElement('div');
    top.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px';
    top.append(info, msg);
    root.append(top, gridEl, kb);

    let score = 0, solved = 0, target = '', row = 0, cur = '', locked = false;
    const used = new Set();
    const COLORS = { g: '#2f9e44', y: '#c9a227', x: '#2b3246' };
    const keyState = {};

    function pickWord() {
      let pool = WORDS.filter(w => !used.has(w));
      if (!pool.length) { used.clear(); pool = WORDS; }
      target = pool[Math.floor(Math.random() * pool.length)];
      used.add(target);
    }
    function newWord() {
      pickWord();
      row = 0; cur = ''; locked = false;
      for (const t of tiles) { t.textContent = ''; t.style.background = 'transparent'; t.style.borderColor = '#3b4660'; }
      for (const k in keyEls) { keyEls[k].style.background = '#475069'; }
      for (const k in keyState) delete keyState[k];
      msg.textContent = '';
      updateInfo();
    }
    function updateInfo() { info.textContent = `Woord ${solved + 1} · Score ${score}`; }
    function renderRow() {
      for (let i = 0; i < 5; i++) {
        const t = tiles[row * 5 + i];
        t.textContent = cur[i] || '';
        t.style.borderColor = cur[i] ? '#8b97b5' : '#3b4660';
      }
    }
    function evaluate(guess) {
      const res = Array(5).fill('x');
      const left = {};
      for (let i = 0; i < 5; i++) {
        if (guess[i] === target[i]) res[i] = 'g';
        else left[target[i]] = (left[target[i]] || 0) + 1;
      }
      for (let i = 0; i < 5; i++) {
        if (res[i] === 'g') continue;
        if (left[guess[i]] > 0) { res[i] = 'y'; left[guess[i]]--; }
      }
      return res;
    }
    function press(k) {
      if (dead || locked) return;
      if (k === 'BACK') { cur = cur.slice(0, -1); renderRow(); return; }
      if (k === 'ENTER') {
        if (cur.length < 5) { msg.textContent = 'Te kort, vul 5 letters in'; return; }
        submit();
        return;
      }
      if (cur.length < 5) { cur += k; msg.textContent = ''; renderRow(); }
    }
    function submit() {
      const res = evaluate(cur);
      for (let i = 0; i < 5; i++) {
        const t = tiles[row * 5 + i];
        t.style.background = COLORS[res[i]];
        t.style.borderColor = COLORS[res[i]];
        const ch = cur[i];
        const rank = { x: 1, y: 2, g: 3 };
        if (!keyState[ch] || rank[res[i]] > rank[keyState[ch]]) {
          keyState[ch] = res[i];
          if (keyEls[ch]) keyEls[ch].style.background = res[i] === 'x' ? '#1c2233' : COLORS[res[i]];
        }
      }
      const guess = cur;
      row++; cur = '';
      if (guess === target) {
        locked = true;
        const bonus = (7 - row) * 20;
        score += bonus;
        solved++;
        api.score(score);
        msg.textContent = `Goed! +${bonus} punten 🎉`;
        updateInfo();
        later(newWord, 1600);
      } else if (row >= 6) {
        locked = true;
        msg.textContent = `Helaas, het woord was ${target}`;
        later(() => { if (!ended) { ended = true; api.end(score); } }, 2200);
      }
    }
    const onKey = e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') { e.preventDefault(); press('ENTER'); }
      else if (e.key === 'Backspace') press('BACK');
      else if (/^[a-zA-Z]$/.test(e.key)) press(e.key.toUpperCase());
    };
    window.addEventListener('keydown', onKey);
    api.score(0);
    newWord();
    return {
      destroy() {
        dead = true;
        timers.forEach(clearTimeout);
        timers.clear();
        window.removeEventListener('keydown', onKey);
        root.remove();
      },
    };
  },
};
