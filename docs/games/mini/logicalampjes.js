const el = (p, css, txt) => { const d = document.createElement('div'); d.style.cssText = css || ''; if (txt != null) d.textContent = txt; if (p) p.appendChild(d); return d; };

export default {
  id: 'logicalampjes', name: 'Logica-lampjes', emoji: '💡', hint: 'Zet alle lampjes aan met de schakelaars, let op je zetten',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = 'linear-gradient(180deg,#1a1a2e,#16213e)';
    host.style.fontFamily = 'system-ui,sans-serif';
    host.style.display = 'flex'; host.style.flexDirection = 'column';
    const top = el(host, 'height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;color:#fff;font-size:19px;font-weight:800;flex:none');
    const lvTxt = el(top, '', ''), hearts = el(top, '', '');
    const msg = el(host, 'height:46px;display:flex;align-items:center;justify-content:center;color:#ffe082;font-size:18px;font-weight:800;text-align:center;padding:0 12px;flex:none');
    const lampBox = el(host, 'display:flex;flex-wrap:wrap;justify-content:center;gap:12px;padding:10px 12px;flex:none');
    const swBox = el(host, 'flex:1;display:grid;gap:10px;padding:10px 14px;align-content:start;min-height:0;overflow:hidden');
    const bottom = el(host, 'height:70px;flex:none;display:flex;gap:10px;align-items:center;padding:0 14px');
    const movesTxt = el(bottom, 'flex:1;color:#fff;font-size:18px;font-weight:800', '');
    const resetBtn = el(bottom, 'padding:12px 18px;border-radius:14px;background:#455a8a;color:#fff;font-weight:800;font-size:16px;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent', 'Opnieuw');
    resetBtn.dataset.reset = '1';
    let dead = false, ended = false, level = 1, lives = 3, n = 0, wires = [], start = [], state = [], budget = 0, used = 0, lamps = [], locked = false;
    const timers = [];
    const later = (fn, ms) => { const id = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(id); };
    const showHearts = () => { hearts.textContent = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives); };
    function gen() {
      n = Math.min(7, 3 + Math.floor((level - 1) / 2));
      const k = Math.min(n, 2 + Math.floor((level - 1) / 2));
      budget = k + (level < 4 ? 3 : 2);
      for (let tries = 0; tries < 200; tries++) {
        wires = [];
        for (let s = 0; s < n; s++) {
          const cnt = 1 + Math.ceil(Math.random() * (level > 3 ? 3 : 2)), set = new Set();
          while (set.size < Math.min(cnt, n)) set.add(Math.floor(Math.random() * n));
          wires.push(Array.from(set).sort((a, b) => a - b));
        }
        const st = new Array(n).fill(true);
        const order = []; for (let s = 0; s < n; s++) order.push(s);
        for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
        order.slice(0, k).forEach(s => wires[s].forEach(l => { st[l] = !st[l]; }));
        const off = st.filter(x => !x).length;
        if (off >= 2) { start = st; break; }
        start = st;
      }
    }
    function build() {
      lampBox.innerHTML = ''; swBox.innerHTML = ''; lamps = [];
      swBox.style.gridTemplateColumns = 'repeat(' + (n > 4 ? 3 : 2) + ',1fr)';
      for (let i = 0; i < n; i++) {
        const l = el(lampBox, 'width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;transition:background .2s,box-shadow .2s', String(i + 1));
        lamps.push(l);
      }
      wires.forEach((w, s) => {
        const b = el(swBox, 'background:#2d3a63;border-radius:16px;padding:10px 6px;text-align:center;color:#fff;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;box-shadow:0 4px 0 #0006');
        b.dataset.s = s;
        el(b, 'font-size:22px;pointer-events:none', '🔘');
        el(b, 'font-size:13px;font-weight:700;color:#b0bec5;pointer-events:none', 'lampjes ' + w.map(x => x + 1).join(' + '));
      });
    }
    function paint() {
      lamps.forEach((l, i) => {
        const on = state[i];
        l.style.background = on ? '#ffeb3b' : '#3a3f55'; l.style.color = on ? '#6d4c00' : '#8892b0';
        l.style.boxShadow = on ? '0 0 18px 4px #ffeb3b99' : 'none';
      });
      movesTxt.textContent = 'Zetten over: ' + (budget - used);
    }
    function load(fresh) {
      if (fresh) gen();
      state = start.slice(); used = 0; locked = false;
      if (fresh) build();
      lvTxt.textContent = 'Level ' + level; msg.textContent = 'Zet alle lampjes aan!';
      paint();
    }
    function press(s) {
      if (locked || ended) return;
      wires[s].forEach(l => { state[l] = !state[l]; });
      used++; paint();
      if (state.every(x => x)) {
        locked = true; msg.textContent = 'Level gehaald!'; api.score(level); level++;
        later(() => load(true), 1000);
      } else if (used >= budget) {
        locked = true; lives--; showHearts(); msg.textContent = 'Geen zetten meer!';
        if (lives <= 0) { ended = true; msg.textContent = 'Helaas, ' + (level - 1) + ' levels gehaald'; later(() => api.end(level - 1), 1400); return; }
        later(() => load(true), 1200);
      }
    }
    const pd = e => {
      let t = e.target;
      if (t && t.dataset && t.dataset.reset) { e.preventDefault(); if (!ended && !locked) load(false); return; }
      while (t && t !== swBox && !(t.dataset && t.dataset.s !== undefined)) t = t.parentNode;
      if (t && t.dataset && t.dataset.s !== undefined) { e.preventDefault(); press(+t.dataset.s); }
    };
    host.addEventListener('pointerdown', pd);
    api.score(0); showHearts(); load(true);
    return { destroy() {
      dead = true; timers.forEach(clearTimeout);
      host.removeEventListener('pointerdown', pd);
      top.remove(); msg.remove(); lampBox.remove(); swBox.remove(); bottom.remove();
    } };
  },
};
