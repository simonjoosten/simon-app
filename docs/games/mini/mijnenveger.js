export default {
  id: 'mijnenveger', name: 'Mijnenveger', emoji: '💣', hint: 'Tik = openen, lang drukken = vlag',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#22304a'; host.style.fontFamily = 'system-ui,sans-serif'; host.style.color = '#fff';
    const N = 8, M = 10, W = api.w || 360;
    const cs = Math.max(28, Math.min(42, Math.floor((W - 24) / N)));
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;user-select:none;-webkit-user-select:none';
    host.appendChild(root);
    const head = document.createElement('div');
    head.style.cssText = 'display:flex;gap:14px;align-items:center;font-size:18px;font-weight:700;width:' + (cs * N) + 'px;justify-content:space-between';
    const mEl = document.createElement('span'), tEl = document.createElement('span');
    const fb = document.createElement('button');
    fb.style.cssText = 'border:0;border-radius:12px;padding:8px 12px;font-size:16px;font-weight:700;color:#fff;background:#4a5a7a;touch-action:none;cursor:pointer';
    head.appendChild(mEl); head.appendChild(fb); head.appendChild(tEl); root.appendChild(head);
    const gridEl = document.createElement('div');
    gridEl.style.cssText = 'display:grid;gap:2px;grid-template-columns:repeat(' + N + ',' + cs + 'px)';
    root.appendChild(gridEl);
    const msg = document.createElement('div'); msg.style.cssText = 'font-size:14px;opacity:.8;text-align:center;padding:0 16px';
    msg.textContent = 'Tik om te openen. Lang drukken (of vlag-knop) zet een vlag.'; root.appendChild(msg);
    let dead = false, over = false, started = false, flagMode = false, secs = 0, flags = 0, opened = 0, interval = 0, endTimer = 0;
    const cells = [];
    for (let i = 0; i < N * N; i++) cells.push({ mine: false, open: false, flag: false, n: 0, el: null });
    const COLORS = ['', '#4fc3f7', '#81c784', '#ff8a80', '#ba68c8', '#ffb74d', '#4dd0e1', '#fff', '#bbb'];
    function nb(i) {
      const x = i % N, y = Math.floor(i / N), out = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue; const xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < N && yy >= 0 && yy < N) out.push(yy * N + xx);
      }
      return out;
    }
    function place(safe) {
      const ban = new Set([safe].concat(nb(safe)));
      let n = 0;
      while (n < M) { const i = Math.floor(Math.random() * N * N); if (!cells[i].mine && !ban.has(i)) { cells[i].mine = true; n++; } }
      cells.forEach((c, i) => { c.n = nb(i).filter(j => cells[j].mine).length; });
    }
    function paint(i) {
      const c = cells[i], el = c.el;
      if (c.open) {
        el.style.background = c.mine ? '#e53935' : '#34456a';
        el.textContent = c.mine ? '💣' : (c.n ? String(c.n) : ''); el.style.color = COLORS[c.n] || '#fff';
      } else {
        el.style.background = '#5d7bb5'; el.style.color = '#fff';
        el.textContent = c.flag ? '🚩' : '';
      }
    }
    function status() {
      mEl.textContent = '💣 ' + (M - flags); tEl.textContent = '⏱ ' + secs;
      fb.textContent = flagMode ? '🚩 Vlag aan' : '👆 Openen';
      fb.style.background = flagMode ? '#e0a030' : '#4a5a7a';
    }
    function lose(hit) {
      over = true; clearInterval(interval);
      cells.forEach((c, i) => { if (c.mine) { c.open = true; paint(i); } });
      cells[hit].el.style.outline = '3px solid #fff';
      msg.textContent = 'Boem! Je raakte een mijn.';
      endTimer = setTimeout(() => { if (!dead) api.end(0); }, 1300);
    }
    function win() {
      over = true; clearInterval(interval);
      const sc = Math.max(100, 1000 - secs * 5);
      msg.textContent = 'Gewonnen! Bonus: ' + sc; api.score(sc);
      cells.forEach((c, i) => { if (c.mine && !c.flag) { c.flag = true; paint(i); } });
      endTimer = setTimeout(() => { if (!dead) api.end(sc); }, 1300);
    }
    function openCell(i) {
      if (over || cells[i].flag || cells[i].open) return;
      if (!started) {
        started = true; place(i);
        interval = setInterval(() => { if (!over && !dead) { secs++; status(); } }, 1000);
      }
      if (cells[i].mine) { cells[i].open = true; paint(i); lose(i); return; }
      const st = [i];
      while (st.length) {
        const k = st.pop(), c = cells[k];
        if (c.open || c.flag) continue;
        c.open = true; opened++; paint(k);
        if (c.n === 0) for (const j of nb(k)) if (!cells[j].open && !cells[j].mine) st.push(j);
      }
      if (opened === N * N - M) win();
    }
    function toggleFlag(i) {
      if (over || cells[i].open) return;
      cells[i].flag = !cells[i].flag; flags += cells[i].flag ? 1 : -1; paint(i); status();
    }
    const timers = new Set();
    cells.forEach((c, i) => {
      const el = document.createElement('div');
      el.style.cssText = 'width:' + cs + 'px;height:' + cs + 'px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:' + Math.round(cs * 0.55) + 'px;cursor:pointer;touch-action:none';
      c.el = el; paint(i); gridEl.appendChild(el);
      let pt = 0, long = false, active = false;
      el.addEventListener('pointerdown', e => {
        if (e.button === 2) return;
        e.preventDefault(); active = true; long = false;
        pt = setTimeout(() => { if (active && !dead) { long = true; toggleFlag(i); } }, 450); timers.add(pt);
      });
      const clear = () => { clearTimeout(pt); timers.delete(pt); };
      el.addEventListener('pointerup', () => {
        if (!active) return; active = false; clear();
        if (!long) { if (flagMode) toggleFlag(i); else openCell(i); }
      });
      el.addEventListener('pointerleave', () => { active = false; clear(); });
      el.addEventListener('pointercancel', () => { active = false; clear(); });
      el.addEventListener('contextmenu', e => { e.preventDefault(); if (!over) toggleFlag(i); });
    });
    fb.addEventListener('pointerdown', e => { e.preventDefault(); flagMode = !flagMode; status(); });
    status();
    return { destroy() {
      dead = true; clearInterval(interval); clearTimeout(endTimer);
      timers.forEach(clearTimeout); timers.clear();
      if (root.parentNode) root.parentNode.removeChild(root);
    } };
  },
};
