const el = (p, css, txt) => { const d = document.createElement('div'); d.style.cssText = css || ''; if (txt != null) d.textContent = txt; if (p) p.appendChild(d); return d; };

const EASY = [['🐶', '🐱'], ['🍎', '🍌'], ['🚗', '🚀'], ['🌞', '🌙'], ['🐸', '🐙']];
const MED = [['🙂', '🙃'], ['🐶', '🐕'], ['🍎', '🍅'], ['🌕', '🌝'], ['🐻', '🐼'], ['🍊', '🍑'], ['🐭', '🐹']];
const HARD = [['😀', '😃'], ['🕐', '🕑'], ['😊', '😌'], ['🌚', '🌑'], ['🐰', '🐇'], ['🔵', '🟦'], ['😄', '😁'], ['🍋', '🍐']];

export default {
  id: 'zoekverschil', name: 'Zoek het verschil', emoji: '🔍', hint: 'Tik de afwijkende emoji, 30 seconden',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = 'linear-gradient(180deg,#fff7e0,#ffe0b2)';
    host.style.fontFamily = 'system-ui,sans-serif';
    host.style.display = 'flex'; host.style.flexDirection = 'column'; host.style.alignItems = 'center';
    const top = el(host, 'height:56px;width:100%;display:flex;align-items:center;justify-content:space-between;padding:0 16px;box-sizing:border-box;font-size:20px;font-weight:800;color:#5d4037;flex:none');
    const tTxt = el(top, '', '');
    const sTxt = el(top, '', '');
    const bar = el(host, 'width:calc(100% - 32px);height:8px;border-radius:4px;background:#0001;flex:none;overflow:hidden');
    const fill = el(bar, 'height:100%;width:100%;background:#fb8c00');
    const side = Math.max(160, Math.min(api.w - 20, api.h - 110));
    const grid = el(host, 'width:' + side + 'px;height:' + side + 'px;display:grid;margin-top:10px;flex:none');
    let dead = false, ended = false, found = 0, left = 30, flash = null;
    const total = 30;
    function pick() {
      const pool = found < 3 ? EASY : found < 8 ? MED.concat(found < 5 ? EASY : []) : HARD.concat(MED);
      const p = pool[Math.floor(Math.random() * pool.length)];
      return Math.random() < 0.5 ? p : [p[1], p[0]];
    }
    function build() {
      const n = Math.min(8, 3 + Math.floor(found / 2));
      grid.innerHTML = '';
      grid.style.gridTemplateColumns = 'repeat(' + n + ',1fr)';
      grid.style.gridTemplateRows = 'repeat(' + n + ',1fr)';
      const odd = Math.floor(Math.random() * n * n), p = pick();
      const fs = Math.floor(side / n * 0.66);
      for (let i = 0; i < n * n; i++) {
        const c = el(grid, 'display:flex;align-items:center;justify-content:center;font-size:' + fs + 'px;border-radius:10px;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none', i === odd ? p[1] : p[0]);
        c.dataset.i = i; if (i === odd) c.dataset.odd = '1';
      }
    }
    function upd() {
      tTxt.textContent = '⏱ ' + Math.max(0, left).toFixed(1) + 's';
      sTxt.textContent = '🔍 ' + found;
      fill.style.width = Math.max(0, left / total * 100) + '%';
    }
    function finish() {
      if (ended) return; ended = true; clearInterval(iv);
      grid.innerHTML = ''; el(grid, 'grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#5d4037;text-align:center', 'Tijd om! ' + found + ' gevonden');
      grid.style.gridTemplateColumns = '1fr'; grid.style.gridTemplateRows = '1fr';
      setTimeout(() => { if (!dead) api.end(found); }, 1200);
    }
    const pd = e => {
      const t = e.target; if (ended || !t || t.dataset.i === undefined) return;
      e.preventDefault();
      if (t.dataset.odd) { found++; api.score(found); left = Math.min(total, left + 0.5); build(); }
      else {
        left -= 2; t.style.background = '#ef9a9a';
        const tt = t; setTimeout(() => { if (!dead) tt.style.background = ''; }, 250);
        if (left <= 0) { left = 0; upd(); finish(); return; }
      }
      upd();
    };
    grid.addEventListener('pointerdown', pd);
    const iv = setInterval(() => { if (dead || ended) return; left -= 0.1; if (left <= 0) { left = 0; upd(); finish(); } else upd(); }, 100);
    api.score(0); build(); upd();
    return { destroy() {
      dead = true; clearInterval(iv); clearTimeout(flash);
      grid.removeEventListener('pointerdown', pd);
      top.remove(); bar.remove(); grid.remove();
    } };
  },
};
