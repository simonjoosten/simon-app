export default {
  id: 'koekjesklik',
  name: 'Koekjesklik',
  emoji: '🍪',
  hint: 'Tik zo snel mogelijk op het koekje en koop upgrades. Je hebt 30 seconden!',
  create(host, api) {
    host.style.touchAction = 'none';
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;background:linear-gradient(160deg,#78350f,#451a03);color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:8px;box-sizing:border-box;padding:12px;user-select:none;overflow:hidden';
    host.appendChild(root);
    let dead = false, ended = false;
    const timers = new Set();
    const DURATION = 30;

    const head = document.createElement('div');
    head.style.cssText = 'font-size:18px;font-weight:700;text-align:center;line-height:1.4';
    const cookie = document.createElement('button');
    const cs = Math.min(190, Math.floor(api.h * 0.3), api.w - 60);
    cookie.textContent = '🍪';
    cookie.style.cssText = `width:${cs}px;height:${cs}px;border:0;border-radius:50%;background:radial-gradient(circle,#92400e,#78350f);font-size:${Math.floor(cs * 0.65)}px;line-height:1;cursor:pointer;padding:0;transition:transform .06s;touch-action:manipulation;flex:none`;
    const shop = document.createElement('div');
    shop.style.cssText = 'display:flex;flex-direction:column;gap:6px;width:100%;max-width:380px';
    root.append(head, cookie, shop);

    const ups = [
      { n: '👆 Sterke vinger', d: '+1 per tik', base: 15, g: 1.5, bought: 0 },
      { n: '👩‍🍳 Bakker', d: '+2 per seconde', base: 40, g: 1.45, bought: 0 },
      { n: '🔥 Oven', d: '+8 per seconde', base: 150, g: 1.5, bought: 0 },
      { n: '✨ Gouden deeg', d: 'tikken x2', base: 120, g: 2.2, bought: 0 },
    ];
    const upEls = ups.map((u, i) => {
      const b = document.createElement('button');
      b.style.cssText = 'display:flex;justify-content:space-between;align-items:center;min-height:46px;padding:0 12px;border:0;border-radius:10px;font-size:15px;cursor:pointer;color:#fff;touch-action:manipulation;text-align:left';
      b.addEventListener('pointerdown', e => { e.stopPropagation(); });
      b.addEventListener('click', () => buy(i));
      shop.appendChild(b);
      return b;
    });
    const cost = u => Math.round(u.base * Math.pow(u.g, u.bought));

    let cookies = 0, earned = 0, perTap = 1, perSec = 0, mult = 1, t0 = performance.now(), remaining = DURATION;
    function render() {
      head.innerHTML = `⏱ ${Math.max(0, Math.ceil(remaining))}s · 🍪 ${Math.floor(cookies)}<br><span style="font-size:14px;font-weight:400">Totaal verdiend: ${Math.floor(earned)} · +${perTap * mult}/tik · +${perSec}/s</span>`;
      ups.forEach((u, i) => {
        const c = cost(u);
        const ok = cookies >= c;
        upEls[i].style.background = ok ? '#16a34a' : '#57341b';
        upEls[i].style.opacity = ok ? '1' : '.6';
        upEls[i].innerHTML = `<span>${u.n}<br><small style="opacity:.8">${u.d} (x${u.bought})</small></span><b>${c} 🍪</b>`;
      });
    }
    function tap() {
      if (dead || ended || remaining <= 0) return;
      const g = perTap * mult;
      cookies += g; earned += g;
      api.score(Math.floor(earned));
      cookie.style.transform = 'scale(.92)';
      later(() => { cookie.style.transform = 'scale(1)'; }, 60);
      render();
    }
    function later(fn, ms) { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); }
    function buy(i) {
      if (dead || ended || remaining <= 0) return;
      const u = ups[i], c = cost(u);
      if (cookies < c) return;
      cookies -= c;
      u.bought++;
      if (i === 0) perTap += 1;
      else if (i === 1) perSec += 2;
      else if (i === 2) perSec += 8;
      else mult *= 2;
      render();
    }
    cookie.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); tap(); });
    const onKey = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tap(); } };
    window.addEventListener('keydown', onKey);

    let lastT = performance.now();
    const iv = setInterval(() => {
      if (dead) return;
      const now = performance.now();
      const dt = (now - lastT) / 1000;
      lastT = now;
      remaining = DURATION - (now - t0) / 1000;
      if (perSec) { const g = perSec * dt; cookies += g; earned += g; api.score(Math.floor(earned)); }
      render();
      if (remaining <= 0 && !ended) {
        ended = true;
        head.innerHTML = `Tijd om! 🎉<br>Je bakte ${Math.floor(earned)} koekjes`;
        later(() => api.end(Math.floor(earned)), 1500);
      }
    }, 100);
    timers.add(iv);
    api.score(0);
    render();
    return {
      destroy() {
        dead = true;
        clearInterval(iv);
        timers.forEach(clearTimeout);
        timers.clear();
        window.removeEventListener('keydown', onKey);
        root.remove();
      },
    };
  },
};
