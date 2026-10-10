export default {
  id: 'kleurentest', name: 'Kleurentest', emoji: '🎨', hint: 'Tik de KLEUR van de letters, niet het woord',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#1d1b2e'; host.style.color = '#fff';
    host.style.fontFamily = 'system-ui,sans-serif';
    const C = [{ n: 'ROOD', c: '#ff3b3b' }, { n: 'GROEN', c: '#2ecc40' }, { n: 'BLAUW', c: '#3d8bff' }, { n: 'GEEL', c: '#ffdc00' }];
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;padding:14px;box-sizing:border-box;gap:12px';
    host.appendChild(root);
    const info = document.createElement('div');
    info.style.cssText = 'display:flex;justify-content:space-between;font-weight:700;font-size:18px';
    const tEl = document.createElement('span'), sEl = document.createElement('span');
    info.appendChild(tEl); info.appendChild(sEl); root.appendChild(info);
    const barW = document.createElement('div'); barW.style.cssText = 'height:8px;border-radius:4px;background:#ffffff22;overflow:hidden';
    const bar = document.createElement('div'); bar.style.cssText = 'height:100%;background:#7bed9f;width:100%'; barW.appendChild(bar); root.appendChild(barW);
    const word = document.createElement('div');
    word.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;font-size:' + Math.round(Math.min(72, (api.w || 360) / 5)) + 'px;font-weight:900;letter-spacing:2px;border-radius:18px;background:#ffffff0d;transition:background .15s';
    root.appendChild(word);
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px';
    root.appendChild(grid);
    const tip = document.createElement('div'); tip.style.cssText = 'text-align:center;opacity:.7;font-size:13px'; tip.textContent = 'Tik de naam van de kleur waarin het woord is geschreven';
    root.appendChild(tip);
    let dead = false, over = false, raf = 0, last = 0, left = 30, good = 0, bad = 0, cur = null, order = [0, 1, 2, 3];
    const btns = [];
    for (let i = 0; i < 4; i++) {
      const b = document.createElement('button');
      b.style.cssText = 'height:74px;border:0;border-radius:16px;background:#3a3659;color:#fff;font-size:22px;font-weight:800;touch-action:none;cursor:pointer';
      grid.appendChild(b); btns.push(b);
    }
    function labelButtons() { btns.forEach((b, i) => { b.textContent = C[order[i]].n; b.dataset.k = String(order[i]); }); }
    function next() {
      const w = Math.floor(Math.random() * 4);
      let ink = w;
      if (Math.random() < 0.88) { ink = (w + 1 + Math.floor(Math.random() * 3)) % 4; }
      cur = { w, ink };
      word.textContent = C[w].n; word.style.color = C[ink].c;
    }
    function flash(ok) {
      word.style.background = ok ? '#2ecc4044' : '#ff3b3b55';
      setTimeout(() => { if (!dead) word.style.background = '#ffffff0d'; }, 140);
    }
    function answer(k) {
      if (over || dead || !cur) return;
      if (k === cur.ink) {
        good++; api.score(good); flash(true);
        if (good % 12 === 0) { order = order.slice().sort(() => Math.random() - 0.5); labelButtons(); }
      } else { bad++; left = Math.max(0, left - 2); flash(false); }
      next();
    }
    btns.forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); answer(Number(b.dataset.k)); }));
    const kd = e => { const i = '1234'.indexOf(e.key); if (i >= 0) answer(order[i]); };
    window.addEventListener('keydown', kd);
    labelButtons(); next(); api.score(0);
    function render() {
      tEl.textContent = '⏱ ' + Math.ceil(left) + ' s'; sEl.textContent = '✅ ' + good;
      bar.style.width = (left / 30 * 100) + '%';
      bar.style.background = left < 8 ? '#ff6b6b' : '#7bed9f';
    }
    function frame(t) {
      if (dead) return; raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (t - (last || t)) / 1000); last = t;
      if (!over) { left -= dt; if (left <= 0) { left = 0; over = true; render(); api.end(good); return; } }
      render();
    }
    raf = requestAnimationFrame(frame);
    return { destroy() {
      dead = true; cancelAnimationFrame(raf); window.removeEventListener('keydown', kd);
      if (root.parentNode) root.parentNode.removeChild(root);
    } };
  },
};
