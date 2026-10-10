const WOORDEN = [
  'KAT', 'ZON', 'VIS', 'BAL', 'KOE', 'EEND', 'HOND', 'BOOM', 'HUIS', 'MAAN', 'KAAS', 'ROOS', 'BOEK', 'TAND', 'POES', 'KOEK',
  'TAART', 'FIETS', 'BLOEM', 'PAARD', 'KLOK', 'STER', 'SCHIP', 'TREIN', 'BROOD', 'MELK', 'APPEL', 'DRAAK', 'ROBOT', 'RAKET', 'WOLK', 'KLEUR',
  'BANAAN', 'KONIJN', 'SCHOOL', 'PIRAAT', 'GITAAR', 'STRAND', 'WINTER', 'ZOMER', 'CIRKUS', 'ANANAS',
  'KASTEEL', 'DOLFIJN', 'OLIFANT', 'VLINDER', 'TROMPET', 'PLANEET', 'VULKAAN', 'SPAGHETTI',
  'VAKANTIE', 'TELEFOON', 'COMPUTER', 'KROKODIL', 'PANNENKOEK', 'REGENBOOG',
];

export default {
  id: 'letterregen',
  name: 'Letterregen',
  emoji: '🔤',
  hint: 'Tik of typ de vallende letters in de juiste volgorde om het woord te maken',
  create(host, api) {
    host.style.touchAction = 'none';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = api.w, H = api.h;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block';
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const R = 24;
    const GROUND = H - 34;
    let dead = false, done = false, raf = 0, last = 0;
    let letters = [], pops = [];
    let lives = 3, score = 0, wordsDone = 0, streak = 0;
    let word = '', prog = 0, spawnT = 0, msg = '', msgT = 0, flash = 0;
    let order = [], oi = 0;

    function pickWord() {
      const maxLen = Math.min(3 + Math.floor(wordsDone / 3), 9);
      const lo = Math.max(3, maxLen - 2);
      let pool = WOORDEN.filter((w) => w.length >= lo && w.length <= maxLen);
      if (!pool.length) pool = WOORDEN;
      let w = pool[Math.floor(Math.random() * pool.length)];
      for (let i = 0; i < 5 && w === word; i++) w = pool[Math.floor(Math.random() * pool.length)];
      return w;
    }
    function nextWord() {
      word = pickWord();
      prog = 0;
    }
    function say(t) { msg = t; msgT = 1.4; }
    function countOf(ch, except) {
      let n = 0;
      letters.forEach((l) => { if (l !== except && l.ch === ch) n++; });
      return n;
    }
    function spawn() {
      const need = word[prog];
      let ch;
      const have = countOf(need, null);
      if (Math.random() < (have === 0 ? 0.7 : 0.2)) ch = need;
      else if (Math.random() < 0.5) ch = word[Math.floor(Math.random() * word.length)];
      else ch = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      let x = R + Math.random() * (W - 2 * R);
      for (let t = 0; t < 8; t++) {
        const cx = R + Math.random() * (W - 2 * R);
        const ok = letters.every((l) => Math.abs(l.x - cx) > R * 1.6 || l.y > 2 * R + 20);
        x = cx;
        if (ok) break;
      }
      const speed = Math.min(60 + wordsDone * 6, 190) + Math.random() * 25;
      letters.push({ x, y: -R, ch, vy: speed, hue: (ch.charCodeAt(0) * 37) % 360 });
    }
    function lose() {
      lives--;
      flash = 0.4;
      streak = 0;
      if (lives <= 0) finish();
    }
    function finish() {
      if (done) return;
      done = true;
      api.score(score);
      api.end(score);
    }
    function pop(x, y, txt, col) { pops.push({ x, y, txt, col, t: 0.8 }); }
    function removeLetter(l) {
      const i = letters.indexOf(l);
      if (i >= 0) letters.splice(i, 1);
    }
    function handle(l) {
      if (done) return;
      if (l.ch === word[prog]) {
        removeLetter(l);
        prog++;
        score += 5;
        pop(l.x, l.y, '+5', '#7dffa0');
        if (prog >= word.length) {
          streak++;
          const gain = word.length * 10 + Math.min(streak - 1, 5) * 5;
          score += gain;
          wordsDone++;
          say('Goed! ' + word + ' +' + gain);
          nextWord();
        }
      } else {
        removeLetter(l);
        score = Math.max(0, score - 3);
        pop(l.x, l.y, '-3', '#ff7d7d');
        flash = 0.15;
      }
      api.score(score);
    }
    function onDown(e) {
      e.preventDefault();
      if (done) return;
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (W / r.width), y = (e.clientY - r.top) * (H / r.height);
      let best = null, bd = (R + 16) * (R + 16);
      letters.forEach((l) => {
        const d = (l.x - x) * (l.x - x) + (l.y - y) * (l.y - y);
        if (d < bd) { bd = d; best = l; }
      });
      if (best) handle(best);
    }
    function onKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey || done) return;
      if (e.key.length !== 1) return;
      const ch = e.key.toUpperCase();
      let best = null;
      letters.forEach((l) => { if (l.ch === ch && (!best || l.y > best.y)) best = l; });
      if (best) handle(best);
    }
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);

    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#12214a'); g.addColorStop(1, '#2a3f7a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      if (flash > 0) { ctx.fillStyle = 'rgba(255,60,60,' + Math.min(0.35, flash) + ')'; ctx.fillRect(0, 0, W, H); }
      // grond
      ctx.fillStyle = '#2e8b57';
      ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = '#3fb06f';
      ctx.fillRect(0, GROUND, W, 5);
      // HUD
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.font = '700 16px system-ui,sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('❤️'.repeat(Math.max(0, lives)), 10, 18);
      ctx.textAlign = 'right';
      ctx.fillText('⭐ ' + score + (streak > 1 ? '  🔥' + streak : ''), W - 10, 18);
      // woord
      const fs = Math.min(34, Math.floor((W - 20) / word.length / 0.75));
      ctx.font = '800 ' + fs + 'px system-ui,sans-serif';
      ctx.textAlign = 'center';
      const step = fs * 0.8;
      const x0 = W / 2 - (word.length - 1) * step / 2;
      for (let i = 0; i < word.length; i++) {
        const done_ = i < prog;
        ctx.fillStyle = done_ ? '#7dffa0' : i === prog ? '#ffd24a' : 'rgba(255,255,255,.4)';
        ctx.fillText(word[i], x0 + i * step, 52);
        ctx.fillRect(x0 + i * step - fs * 0.3, 52 + fs * 0.6, fs * 0.6, 3);
      }
      // letters
      ctx.font = '800 26px system-ui,sans-serif';
      ctx.textAlign = 'center';
      letters.forEach((l) => {
        const isNext = l.ch === word[prog];
        ctx.beginPath();
        ctx.arc(l.x, l.y, R, 0, Math.PI * 2);
        ctx.fillStyle = 'hsl(' + l.hue + ',65%,55%)';
        ctx.fill();
        ctx.lineWidth = isNext ? 4 : 2;
        ctx.strokeStyle = isNext ? '#ffd24a' : 'rgba(255,255,255,.6)';
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.fillText(l.ch, l.x, l.y + 1);
      });
      ctx.font = '700 18px system-ui,sans-serif';
      pops.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.t / 0.8);
        ctx.fillStyle = p.col;
        ctx.fillText(p.txt, p.x, p.y - (0.8 - p.t) * 40);
      });
      ctx.globalAlpha = 1;
      if (msgT > 0) {
        ctx.font = '800 22px system-ui,sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, msgT) + ')';
        ctx.fillText(msg, W / 2, H / 2);
      }
    }
    function frame(ts) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016);
      last = ts;
      if (!done) {
        spawnT -= dt;
        if (spawnT <= 0) {
          spawn();
          spawnT = Math.max(0.5, 1.15 - wordsDone * 0.03) * (0.8 + Math.random() * 0.4);
        }
        for (let i = letters.length - 1; i >= 0; i--) {
          const l = letters[i];
          l.y += l.vy * dt;
          if (l.y > GROUND - R * 0.4) {
            letters.splice(i, 1);
            if (l.ch === word[prog] && countOf(l.ch, null) === 0) {
              say('Gemist: ' + l.ch);
              lose();
              if (done) break;
            }
          }
        }
      }
      pops.forEach((p) => { p.t -= dt; });
      pops = pops.filter((p) => p.t > 0);
      if (msgT > 0) msgT -= dt;
      if (flash > 0) flash -= dt;
      draw();
    }
    nextWord();
    api.score(0);
    raf = requestAnimationFrame(frame);

    return {
      destroy() {
        dead = true;
        cancelAnimationFrame(raf);
        canvas.removeEventListener('pointerdown', onDown);
        window.removeEventListener('keydown', onKey);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      },
    };
  },
};
