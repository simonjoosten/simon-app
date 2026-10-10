const el = (p, css, txt) => { const d = document.createElement('div'); d.style.cssText = css || ''; if (txt != null) d.textContent = txt; if (p) p.appendChild(d); return d; };

export default {
  id: 'patroonherhaling', name: 'Patroon', emoji: '🔲', hint: 'Onthoud welke vakjes oplichten en tik ze na',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = 'linear-gradient(160deg,#1b1442,#0e2a4a)';
    host.style.fontFamily = 'system-ui,sans-serif';
    host.style.display = 'flex'; host.style.flexDirection = 'column'; host.style.alignItems = 'center';
    const info = el(host, 'height:64px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:700;text-align:center;padding:0 10px;flex:none', '');
    const side = Math.max(160, Math.min(api.w - 24, api.h - 150));
    const board = el(host, 'width:' + side + 'px;height:' + side + 'px;display:grid;gap:8px;flex:none');
    const timers = [];
    let dead = false, ended = false, level = 1, phase = 'wait', cells = [], target = new Set(), found = new Set(), size = 3;
    const later = (fn, ms) => { const id = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(id); };
    const sizeFor = l => (l <= 3 ? 3 : l <= 7 ? 4 : l <= 12 ? 5 : 6);

    function build() {
      board.innerHTML = '';
      size = sizeFor(level);
      board.style.gridTemplateColumns = 'repeat(' + size + ',1fr)';
      board.style.gridTemplateRows = 'repeat(' + size + ',1fr)';
      cells = [];
      for (let i = 0; i < size * size; i++) {
        const c = el(board, 'border-radius:14px;background:#2b3a67;transition:background .12s,transform .12s;cursor:pointer;-webkit-tap-highlight-color:transparent');
        c.dataset.i = i; cells.push(c);
      }
    }
    function startLevel() {
      build(); phase = 'show'; found = new Set(); target = new Set();
      const count = Math.min(size * size - 2, 2 + Math.ceil(level * 0.8));
      while (target.size < count) target.add(Math.floor(Math.random() * size * size));
      info.textContent = 'Kijk goed... (ronde ' + level + ')';
      later(() => { target.forEach(i => { cells[i].style.background = '#ffd54f'; cells[i].style.transform = 'scale(.94)'; }); }, 500);
      later(() => {
        target.forEach(i => { cells[i].style.background = '#2b3a67'; cells[i].style.transform = ''; });
        phase = 'input'; info.textContent = 'Jouw beurt! Tik ' + count + ' vakjes';
      }, 500 + 800 + count * 200);
    }
    function tap(i) {
      if (phase !== 'input' || ended) return;
      const c = cells[i];
      if (found.has(i)) return;
      if (!target.has(i)) {
        phase = 'over'; ended = true; c.style.background = '#e53935';
        target.forEach(t => { if (!found.has(t)) cells[t].style.background = '#ffd54f66'; });
        info.textContent = 'Mis! Ronde ' + (level - 1) + ' gehaald';
        later(() => api.end(level - 1), 1300);
        return;
      }
      found.add(i); c.style.background = '#66bb6a';
      if (found.size === target.size) {
        phase = 'wait'; api.score(level); info.textContent = 'Goed zo!'; level++;
        later(startLevel, 800);
      }
    }
    const pd = e => { const t = e.target; if (t && t.dataset && t.dataset.i !== undefined) { e.preventDefault(); tap(+t.dataset.i); } };
    board.addEventListener('pointerdown', pd);
    api.score(0);
    info.textContent = 'Maak je klaar...';
    later(startLevel, 600);
    return { destroy() {
      dead = true; timers.forEach(clearTimeout);
      board.removeEventListener('pointerdown', pd);
      info.remove(); board.remove();
    } };
  },
};
