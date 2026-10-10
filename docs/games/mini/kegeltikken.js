export default {
  id: 'kegeltikken',
  name: 'Kegeltikken',
  emoji: '🎳',
  hint: 'Tik precies zoveel kegels als de opdracht zegt',
  create(host, api) {
    const W = api.w || 360, H = api.h || 640;
    host.style.touchAction = 'none';
    host.style.userSelect = 'none';
    host.style.background = 'linear-gradient(#3d2b1f,#7a5230)';
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;font-family:system-ui,sans-serif;color:#fff';
    const hud = document.createElement('div');
    hud.style.cssText = 'position:absolute;top:8px;left:12px;right:12px;display:flex;justify-content:space-between;font-size:18px;font-weight:700';
    const elScore = document.createElement('span'), elLives = document.createElement('span'), elRound = document.createElement('span');
    hud.append(elScore, elRound, elLives);
    const bar = document.createElement('div');
    bar.style.cssText = 'position:absolute;top:40px;left:12px;right:12px;height:8px;border-radius:4px;background:rgba(255,255,255,.2);overflow:hidden';
    const barIn = document.createElement('div');
    barIn.style.cssText = 'height:100%;width:100%;background:#80ed99';
    bar.appendChild(barIn);
    const prompt = document.createElement('div');
    prompt.style.cssText = 'position:absolute;top:58px;left:0;right:0;text-align:center;font-size:34px;font-weight:900;text-shadow:0 2px 0 rgba(0,0,0,.5);padding:0 10px;line-height:1.15';
    const field = document.createElement('div');
    field.style.cssText = 'position:absolute;left:10px;right:10px;top:150px;bottom:20px';
    const fb = document.createElement('div');
    fb.style.cssText = 'position:absolute;left:0;right:0;top:46%;text-align:center;font-size:44px;font-weight:900;pointer-events:none;text-shadow:0 3px 0 rgba(0,0,0,.5);opacity:0';
    root.append(hud, bar, prompt, field, fb);
    host.appendChild(root);

    const MAXR = 20;
    let round = 0, lives = 3, score = 0, pins = [], rule = null, timeLeft = 0, timeMax = 1, locked = false;
    let ended = false, endTimer = 0, nextTimer = 0, fbTimer = 0, raf = 0, alive = true, last = performance.now();

    const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

    function makeExpr(avail) {
      // geeft { text, v } met 1 <= v <= avail
      for (let k = 0; k < 40; k++) {
        const kind = round < 3 ? 0 : round < 8 ? ri(0, 1) : ri(0, 2);
        let a, b, v, text;
        if (kind === 0) { v = ri(1, Math.min(avail, round < 3 ? 4 : 7)); if (round < 3) return { text: String(v), v }; a = ri(1, v); b = v - a; if (b < 1) continue; text = a + ' + ' + b; }
        else if (kind === 1) { a = ri(3, Math.min(avail + 5, 14)); b = ri(1, a - 1); v = a - b; text = a + ' - ' + b; }
        else { a = ri(2, 3); b = ri(2, 3); v = a * b; text = a + ' x ' + b; }
        if (v >= 1 && v <= avail) return { text, v };
      }
      return { text: '1', v: 1 };
    }

    function build() {
      field.innerHTML = ''; pins = []; locked = false;
      const N = Math.min(12, 5 + Math.floor(round / 2));
      const colored = round >= 5 && round % 3 !== 0;
      const staan = !colored && round >= 3 && round % 4 === 3;
      const fw = W - 20, fh = H - 170;
      const cols = 4, rows = 4;
      const cells = [];
      for (let i = 0; i < cols * rows; i++) cells.push(i);
      for (let i = cells.length - 1; i > 0; i--) { const j = ri(0, i); [cells[i], cells[j]] = [cells[j], cells[i]]; }
      const reds = colored ? Math.max(3, Math.floor(N * 0.5)) : 0;
      for (let i = 0; i < N; i++) {
        const c = cells[i], cx = (c % cols + 0.5) * fw / cols + ri(-8, 8), cy = (Math.floor(c / cols) + 0.5) * fh / rows + ri(-10, 10);
        const red = i < reds;
        const el = document.createElement('div');
        el.style.cssText = 'position:absolute;width:42px;height:70px;left:' + (cx - 21) + 'px;top:' + (cy - 35) + 'px;cursor:pointer;transition:transform .25s,opacity .25s;' +
          'border-radius:21px 21px 12px 12px / 32px 32px 12px 12px;border:2px solid #333;box-shadow:0 5px 0 rgba(0,0,0,.35);' +
          (red ? 'background:linear-gradient(#e53935 0 45%,#fff 45% 60%,#e53935 60%)' : 'background:linear-gradient(#fff 0 45%,#e53935 45% 58%,#fff 58%)');
        const p = { el, red, down: false };
        el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); hit(p); });
        field.appendChild(el); pins.push(p);
      }
      if (colored) {
        const ex = makeExpr(reds);
        rule = { mode: 'tik', color: true, v: ex.v };
        prompt.innerHTML = 'Tik ' + (ex.text) + ' <span style="color:#ff6b6b">rode</span> kegels';
      } else if (staan) {
        const ex = makeExpr(N - 1);
        rule = { mode: 'staan', color: false, v: ex.v };
        prompt.textContent = 'Laat ' + ex.text + ' kegels staan';
      } else {
        const ex = makeExpr(N);
        rule = { mode: 'tik', color: false, v: ex.v };
        prompt.textContent = 'Tik ' + ex.text + ' kegels';
      }
      timeMax = timeLeft = Math.max(4, 9 - round * 0.35) + (prompt.textContent.match(/[+x-]/) ? 2.5 : 0);
    }

    function flash(txt, col) {
      fb.textContent = txt; fb.style.color = col; fb.style.opacity = '1';
      clearTimeout(fbTimer);
      fbTimer = setTimeout(() => { fb.style.opacity = '0'; }, 600);
    }

    function knock(p) { p.down = true; p.el.style.transform = 'rotate(' + (Math.random() < 0.5 ? -80 : 80) + 'deg) translateY(10px)'; p.el.style.opacity = '.35'; }

    function hit(p) {
      if (locked || ended || p.down) return;
      knock(p);
      if (rule.color && !p.red) { fail('Verkeerde kleur!'); return; }
      const knocked = pins.filter((q) => q.down).length;
      const standing = pins.length - knocked;
      if (rule.mode === 'tik' && knocked === rule.v) success();
      else if (rule.mode === 'staan' && standing === rule.v) success();
    }

    function success() {
      locked = true;
      const pts = 10 + Math.round(timeLeft * 4) + round * 2;
      score += pts; api.score(score);
      flash('+' + pts, '#80ed99');
      round++;
      if (round >= MAXR) { finish(); return; }
      nextTimer = setTimeout(build, 700);
    }

    function fail(txt) {
      locked = true;
      lives--;
      flash(txt, '#ff6b6b');
      if (lives <= 0) { finish(); return; }
      round++;
      nextTimer = setTimeout(build, 900);
    }

    function finish() {
      if (ended) return;
      ended = true; locked = true;
      endTimer = setTimeout(() => { api.end(score); }, 1000);
    }

    function tick(now) {
      if (!alive) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (!locked && !ended) {
        timeLeft -= dt;
        if (timeLeft <= 0) { timeLeft = 0; fail('Te laat!'); }
      }
      barIn.style.width = Math.max(0, timeLeft / timeMax * 100) + '%';
      barIn.style.background = timeLeft / timeMax > 0.3 ? '#80ed99' : '#ff6b6b';
      elScore.textContent = 'Score ' + score;
      elRound.textContent = 'Ronde ' + Math.min(round + 1, MAXR);
      elLives.textContent = '❤️'.repeat(Math.max(0, lives));
      raf = requestAnimationFrame(tick);
    }
    build();
    raf = requestAnimationFrame(tick);

    return {
      destroy() {
        alive = false; cancelAnimationFrame(raf);
        clearTimeout(endTimer); clearTimeout(nextTimer); clearTimeout(fbTimer);
        root.remove();
      },
    };
  },
};
