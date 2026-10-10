const el = (p, css, txt) => { const d = document.createElement('div'); d.style.cssText = css || ''; if (txt != null) d.textContent = txt; if (p) p.appendChild(d); return d; };

export default {
  id: 'volgorde', name: 'Volgorde', emoji: '🔢', hint: 'Tik de getallen in volgorde, zo snel mogelijk',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = 'linear-gradient(160deg,#e3f2fd,#bbdefb)';
    host.style.fontFamily = 'system-ui,sans-serif';
    host.style.display = 'flex'; host.style.flexDirection = 'column';
    const top = el(host, 'height:54px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;font-size:19px;font-weight:800;color:#0d47a1;flex:none');
    const tTxt = el(top, '', ''), sTxt = el(top, '', '');
    const bar = el(host, 'height:8px;margin:0 16px;border-radius:4px;background:#0001;overflow:hidden;flex:none');
    const fill = el(bar, 'height:100%;width:100%;background:#1976d2');
    const field = el(host, 'flex:1;position:relative;margin:8px;min-height:0');
    let dead = false, ended = false, round = 0, N = 0, nextN = 1, left = 0, limit = 1, score = 0, cells = [], locked = false;
    const timers = [];
    function build() {
      round++;
      N = Math.min(30, 4 + round * 2);
      nextN = 1; locked = false;
      limit = N * 1.1 + 3; left = limit;
      field.innerHTML = ''; cells = [];
      const cols = N <= 8 ? 3 : N <= 15 ? 4 : 5;
      const rows = Math.ceil(N / cols);
      const fw = field.clientWidth || api.w - 16, fh = field.clientHeight || api.h - 90;
      const cw = fw / cols, ch = fh / rows, sz = Math.min(cw, ch) * 0.82;
      const slots = []; for (let i = 0; i < cols * rows; i++) slots.push(i);
      for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
      for (let k = 1; k <= N; k++) {
        const s = slots[k - 1], c = s % cols, r = Math.floor(s / cols);
        const jx = (cw - sz) * (0.2 + Math.random() * 0.6), jy = (ch - sz) * (0.2 + Math.random() * 0.6);
        const hue = (k * 37) % 360;
        const b = el(field, 'position:absolute;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;box-shadow:0 3px 0 #0003;width:' + sz + 'px;height:' + sz + 'px;font-size:' + Math.floor(sz * 0.5) + 'px;left:' + (c * cw + jx) + 'px;top:' + (r * ch + jy) + 'px;background:hsl(' + hue + ',65%,48%)', String(k));
        b.dataset.k = k; cells.push(b);
      }
      upd();
    }
    function upd() {
      tTxt.textContent = '⏱ ' + Math.max(0, left).toFixed(1) + 's  ·  Ronde ' + round;
      sTxt.textContent = '→ ' + Math.min(nextN, N);
      fill.style.width = Math.max(0, left / limit * 100) + '%';
    }
    function finish() {
      if (ended) return; ended = true; locked = true; clearInterval(iv);
      tTxt.textContent = 'Tijd om!';
      timers.push(setTimeout(() => { if (!dead) api.end(score); }, 1200));
    }
    function tap(k, b) {
      if (locked || ended) return;
      if (k === nextN) {
        b.style.visibility = 'hidden'; nextN++; score++; api.score(score);
        if (nextN > N) {
          const bonus = Math.floor(left);
          score += bonus; api.score(score); locked = true;
          sTxt.textContent = '+' + bonus + ' bonus';
          timers.push(setTimeout(() => { if (!dead && !ended) build(); }, 700));
        } else upd();
      } else {
        left -= 1.5; b.style.transform = 'scale(.8)'; b.style.filter = 'grayscale(1)';
        timers.push(setTimeout(() => { b.style.transform = ''; b.style.filter = ''; }, 200));
        if (left <= 0) { left = 0; upd(); finish(); } else upd();
      }
    }
    const pd = e => { const t = e.target; if (t && t.dataset && t.dataset.k !== undefined) { e.preventDefault(); tap(+t.dataset.k, t); } };
    field.addEventListener('pointerdown', pd);
    const iv = setInterval(() => { if (dead || ended || locked) return; left -= 0.1; if (left <= 0) { left = 0; upd(); finish(); } else upd(); }, 100);
    api.score(0);
    timers.push(setTimeout(() => { if (!dead) build(); }, 30));
    return { destroy() {
      dead = true; clearInterval(iv); timers.forEach(clearTimeout);
      field.removeEventListener('pointerdown', pd);
      top.remove(); bar.remove(); field.remove();
    } };
  },
};
