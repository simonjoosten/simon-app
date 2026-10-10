export default {
  id: 'tiksnel', name: 'Tiksnel', emoji: '⚡', hint: 'Tik zo vaak je kunt in 10 seconden',
  create(host, api) {
    host.style.touchAction = 'none'; host.style.background = '#2a0f4a'; host.style.fontFamily = 'system-ui,sans-serif'; host.style.color = '#fff';
    const W = api.w || 360, size = Math.min(W - 60, 260);
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;user-select:none;-webkit-user-select:none;overflow:hidden';
    host.appendChild(root);
    const tEl = document.createElement('div'); tEl.style.cssText = 'font-size:40px;font-weight:900'; root.appendChild(tEl);
    const cEl = document.createElement('div'); cEl.style.cssText = 'height:30px;font-size:22px;font-weight:800;color:#ffd54f'; root.appendChild(cEl);
    const btn = document.createElement('button');
    btn.style.cssText = 'width:' + size + 'px;height:' + size + 'px;border-radius:50%;border:8px solid #ffffff55;font-size:' + Math.round(size * 0.3) + 'px;font-weight:900;color:#fff;touch-action:none;cursor:pointer;outline:none;box-shadow:0 10px 0 #0004;transition:transform .05s';
    root.appendChild(btn);
    const sEl = document.createElement('div'); sEl.style.cssText = 'font-size:20px;opacity:.9;font-weight:700'; root.appendChild(sEl);
    let dead = false, over = false, running = false, raf = 0, last = 0, left = 10, taps = 0, combo = 0, sinceTap = 9, best = 0, endTimer = 0;
    function paint() {
      const hue = (200 + combo * 12) % 360;
      btn.style.background = 'radial-gradient(circle at 35% 30%, hsl(' + hue + ',90%,70%), hsl(' + hue + ',80%,45%))';
      tEl.textContent = '⏱ ' + left.toFixed(1);
      sEl.textContent = 'Tikken: ' + taps;
      btn.textContent = running || over ? String(taps) : 'TIK!';
      cEl.textContent = combo >= 5 ? 'COMBO x' + combo + (combo >= 40 ? ' 🚀' : combo >= 20 ? ' 🔥' : combo >= 10 ? ' ⚡' : '') : '';
    }
    function float(text, big) {
      const el = document.createElement('div');
      const x = (Math.random() - 0.5) * size * 0.8;
      el.style.cssText = 'position:absolute;left:50%;top:50%;pointer-events:none;font-weight:900;font-size:' + (big ? 40 : 22) + 'px;color:' + (big ? '#ffd54f' : '#fff');
      el.textContent = text; root.appendChild(el);
      const a = el.animate([{ transform: 'translate(calc(-50% + ' + x + 'px),-50%) scale(1)', opacity: 1 },
        { transform: 'translate(calc(-50% + ' + x + 'px),' + (-size * (big ? 0.9 : 0.7)) + 'px) scale(' + (big ? 1.6 : 1.2) + ')', opacity: 0 }], { duration: big ? 800 : 550, easing: 'ease-out' });
      a.onfinish = () => el.remove();
    }
    function tap() {
      if (over || dead) return;
      if (!running) { running = true; left = 10; }
      taps++; api.score(taps);
      combo = sinceTap < 0.35 ? combo + 1 : 1; sinceTap = 0;
      if (combo > best) best = combo;
      float('+1', false);
      if (combo === 10) float('⚡ Snel!', true); else if (combo === 20) float('🔥 Vuur!', true); else if (combo === 40) float('🚀 Raket!', true);
      btn.animate([{ transform: 'scale(.92)' }, { transform: 'scale(1)' }], { duration: 90 });
      paint();
    }
    btn.addEventListener('pointerdown', e => { e.preventDefault(); tap(); });
    const kd = e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); tap(); } };
    window.addEventListener('keydown', kd);
    function frame(t) {
      if (dead) return; raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (t - (last || t)) / 1000); last = t;
      if (running && !over) {
        left -= dt; sinceTap += dt;
        if (sinceTap > 0.35 && combo) combo = 0;
        if (left <= 0) {
          left = 0; over = true; combo = 0; paint(); sEl.textContent = 'Tijd! ' + taps + ' tikken (beste combo ' + best + ')';
          endTimer = setTimeout(() => { if (!dead) api.end(taps); }, 900);
          return;
        }
        paint();
      }
    }
    api.score(0); paint(); sEl.textContent = 'Tik om te beginnen!';
    raf = requestAnimationFrame(frame);
    return { destroy() {
      dead = true; cancelAnimationFrame(raf); clearTimeout(endTimer);
      window.removeEventListener('keydown', kd);
      if (root.parentNode) root.parentNode.removeChild(root);
    } };
  },
};
