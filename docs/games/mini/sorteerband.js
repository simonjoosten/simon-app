const el = (p, css, txt) => { const d = document.createElement('div'); d.style.cssText = css || ''; if (txt != null) d.textContent = txt; if (p) p.appendChild(d); return d; };
const CATS = [
  { n: 'fruit', icon: '🍎', items: ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉', '🍐'] },
  { n: 'dieren', icon: '🐶', items: ['🐶', '🐱', '🐭', '🐸', '🐵', '🐔', '🐷'] },
  { n: 'voertuigen', icon: '🚗', items: ['🚗', '🚌', '🚲', '✈️', '🚀', '🚂', '🚜'] },
];

export default {
  id: 'sorteerband', name: 'Sorteerband', emoji: '📦', hint: 'Tik links of rechts om te sorteren, let op de regel!',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#263238';
    host.style.fontFamily = 'system-ui,sans-serif';
    const W = api.w, H = api.h;
    const top = el(host, 'position:absolute;left:0;right:0;top:0;height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;color:#fff;font-size:20px;font-weight:800;z-index:3');
    const sTxt = el(top, '', ''), hearts = el(top, '', '');
    const belt = el(host, 'position:absolute;left:' + (W / 2 - 45) + 'px;width:90px;top:48px;bottom:' + 120 + 'px;background:repeating-linear-gradient(180deg,#455a64 0,#455a64 18px,#37474f 18px,#37474f 36px);border-left:4px solid #90a4ae;border-right:4px solid #90a4ae');
    const BINH = 110, lineY = H - BINH - 50;
    const mkBin = (x, c) => el(host, 'position:absolute;bottom:8px;left:' + x + 'px;width:' + (W / 2 - 14) + 'px;height:' + BINH + 'px;border-radius:18px;background:' + c + ';display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-weight:800;text-align:center;box-shadow:0 4px 0 #0005 inset;z-index:2');
    const binL = mkBin(8, '#c62828'), binR = mkBin(W / 2 + 6, '#1565c0');
    const binLab = [el(binL, 'font-size:34px', ''), el(binL, 'font-size:14px', '')];
    const binRab = [el(binR, 'font-size:34px', ''), el(binR, 'font-size:14px', '')];
    const banner = el(host, 'position:absolute;left:0;right:0;top:' + (H * 0.3) + 'px;text-align:center;color:#ffeb3b;font-size:26px;font-weight:900;text-shadow:0 2px 6px #000;opacity:0;transition:opacity .3s;z-index:4;pointer-events:none');
    const ruleTxt = el(host, 'position:absolute;left:0;right:0;top:48px;text-align:center;color:#b0bec5;font-size:13px;font-weight:700;z-index:3;pointer-events:none');
    let dead = false, ended = false, score = 0, lives = 3, items = [], rule = null, sinceChange = 0, raf = 0, last = 0, spawnGap = 0, timers = [];
    const showHearts = () => { hearts.textContent = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives); };
    function setRule(first) {
      let r;
      do { r = { lone: Math.floor(Math.random() * 3), side: Math.floor(Math.random() * 2) }; } while (rule && r.lone === rule.lone && r.side === rule.side);
      rule = r; sinceChange = 0;
      const lone = CATS[r.lone], others = CATS.filter((_, i) => i !== r.lone);
      const loneBin = r.side === 0 ? binLab : binRab, othBin = r.side === 0 ? binRab : binLab;
      loneBin[0].textContent = lone.icon; loneBin[1].textContent = lone.n;
      othBin[0].textContent = others[0].icon + others[1].icon; othBin[1].textContent = others[0].n + ' + ' + others[1].n;
      ruleTxt.textContent = '';
      if (!first) {
        banner.textContent = 'Nieuwe regel!'; banner.style.opacity = '1';
        const id = setTimeout(() => { banner.style.opacity = '0'; }, 1300); timers.push(id);
      }
    }
    const sideOf = ci => (ci === rule.lone ? rule.side : 1 - rule.side);
    function spawn() {
      const ci = Math.floor(Math.random() * 3), c = CATS[ci];
      const d = el(host, 'position:absolute;width:64px;height:64px;left:' + (W / 2 - 32) + 'px;top:0;font-size:46px;line-height:64px;text-align:center;z-index:2;pointer-events:none;transition:transform .25s,opacity .25s;will-change:transform', c.items[Math.floor(Math.random() * c.items.length)]);
      items.push({ d, ci, y: 40, done: false });
    }
    function lose() {
      lives--; showHearts();
      if (lives <= 0 && !ended) { ended = true; banner.textContent = 'Klaar! ' + score + ' gesorteerd'; banner.style.opacity = '1'; timers.push(setTimeout(() => { if (!dead) api.end(score); }, 1300)); }
    }
    function sort(side) {
      if (ended) return;
      let it = null;
      items.forEach(i => { if (!i.done && (!it || i.y > it.y)) it = i; });
      if (!it) return;
      it.done = true;
      const ok = sideOf(it.ci) === side;
      it.d.style.transform = 'translate(' + (side === 0 ? -W * 0.3 : W * 0.3) + 'px,' + (it.y + 60) + 'px) scale(.5)'; it.d.style.opacity = '0';
      const d = it.d; timers.push(setTimeout(() => d.remove(), 300));
      items = items.filter(i => i !== it);
      if (ok) {
        score++; api.score(score); sinceChange++; sTxt.textContent = '📦 ' + score;
        if (sinceChange >= 6) setRule(false);
      } else {
        lose();
        banner.textContent = 'Fout bakje!'; banner.style.opacity = '1'; timers.push(setTimeout(() => { if (!ended) banner.style.opacity = '0'; }, 700));
      }
    }
    const pd = e => { e.preventDefault(); const r = host.getBoundingClientRect(); sort(e.clientX - r.left < W / 2 ? 0 : 1); };
    host.addEventListener('pointerdown', pd);
    const kd = e => { if (e.key === 'ArrowLeft' || e.key === 'a') sort(0); else if (e.key === 'ArrowRight' || e.key === 'd') sort(1); };
    window.addEventListener('keydown', kd);
    function frame(t) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
      if (ended) return;
      const v = Math.min(280, 80 + score * 4.5);
      spawnGap -= v * dt;
      if (spawnGap <= 0 && items.length < 6) { spawn(); spawnGap = 120 + Math.random() * 40; }
      for (const it of items.slice()) {
        it.y += v * dt;
        it.d.style.top = '0px'; it.d.style.transform = 'translateY(' + it.y + 'px)';
        if (it.y > lineY && !it.done) {
          it.done = true; items = items.filter(i => i !== it); it.d.remove();
          banner.textContent = 'Te laat!'; banner.style.opacity = '1';
          timers.push(setTimeout(() => { if (!ended) banner.style.opacity = '0'; }, 600));
          lose();
        }
      }
    }
    api.score(0); showHearts(); sTxt.textContent = '📦 0'; setRule(true);
    raf = requestAnimationFrame(frame);
    return { destroy() {
      dead = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout);
      host.removeEventListener('pointerdown', pd); window.removeEventListener('keydown', kd);
      host.innerHTML = '';
    } };
  },
};
