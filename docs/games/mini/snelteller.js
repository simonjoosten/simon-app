const el = (p, css, txt) => { const d = document.createElement('div'); d.style.cssText = css || ''; if (txt != null) d.textContent = txt; if (p) p.appendChild(d); return d; };
const EM = ['🐥', '⭐', '🍒', '🎈', '🐞', '🍩', '🔔', '🐟'];

export default {
  id: 'snelteller', name: 'Snelteller', emoji: '👀', hint: 'Items flitsen voorbij: hoeveel zag je?',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = 'linear-gradient(180deg,#311b92,#1a237e)';
    host.style.fontFamily = 'system-ui,sans-serif';
    host.style.display = 'flex'; host.style.flexDirection = 'column';
    const info = el(host, 'height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;color:#fff;font-size:20px;font-weight:800;flex:none');
    const msg = el(info, '', ''), hearts = el(info, '', '');
    const stage = el(host, 'flex:1;margin:0 14px;border-radius:20px;background:#ffffff14;position:relative;overflow:hidden;min-height:0');
    const opts = el(host, 'height:150px;flex:none;display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px 14px;box-sizing:border-box');
    const timers = [];
    let dead = false, ended = false, level = 0, lives = 3, answer = 0, accepting = false, btns = [];
    const later = (fn, ms) => { const id = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(id); };
    const showHearts = () => { hearts.textContent = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives); };
    function makeBtns(vals) {
      opts.innerHTML = ''; btns = [];
      vals.forEach((v, i) => {
        const b = el(opts, 'background:#fff;color:#311b92;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:900;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none', accepting ? String(v) : '');
        b.dataset.v = v; b.dataset.i = i; b.style.opacity = '.4'; btns.push(b);
      });
    }
    function round() {
      accepting = false;
      const n = 3 + Math.floor(level * 0.7) + Math.floor(Math.random() * 2);
      answer = n;
      const dur = Math.max(220, 1000 - level * 55);
      const set = new Set([n]);
      const offs = [-2, -1, 1, 2, 3, -3];
      while (set.size < 4) { const c = n + offs[Math.floor(Math.random() * offs.length)] * (level > 8 ? 1 : 1); if (c >= 1) set.add(c); }
      const vals = Array.from(set); for (let i = vals.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [vals[i], vals[j]] = [vals[j], vals[i]]; }
      stage.innerHTML = '';
      makeBtns(vals);
      msg.textContent = 'Kijk goed!';
      later(() => {
        const W = stage.clientWidth || api.w - 28, H = stage.clientHeight || 360;
        const em = EM[Math.floor(Math.random() * EM.length)];
        const pts = [];
        for (let i = 0; i < n; i++) {
          let best = null, bd = -1;
          for (let t = 0; t < 14; t++) {
            const x = 6 + Math.random() * (W - 54), y = 6 + Math.random() * (H - 54);
            let md = 1e9; pts.forEach(p => { md = Math.min(md, Math.hypot(p[0] - x, p[1] - y)); });
            if (md > bd) { bd = md; best = [x, y]; }
          }
          pts.push(best);
          el(stage, 'position:absolute;font-size:42px;line-height:1;left:' + best[0] + 'px;top:' + best[1] + 'px', em);
        }
        later(() => {
          stage.innerHTML = ''; accepting = true; msg.textContent = 'Hoeveel zag je?';
          btns.forEach(b => { b.textContent = b.dataset.v; b.style.opacity = '1'; });
        }, dur);
      }, 700);
    }
    function pick(i) {
      if (!accepting || ended) return;
      accepting = false;
      const b = btns[i], ok = +b.dataset.v === answer;
      if (ok) { b.style.background = '#66bb6a'; level++; api.score(level); msg.textContent = 'Goed!'; }
      else {
        b.style.background = '#e53935'; lives--; showHearts();
        btns.forEach(x => { if (+x.dataset.v === answer) x.style.background = '#66bb6a'; });
        msg.textContent = 'Het waren er ' + answer;
      }
      if (lives <= 0) { ended = true; later(() => api.end(level), 1400); return; }
      later(round, ok ? 700 : 1500);
    }
    const pd = e => { const t = e.target; if (t && t.dataset && t.dataset.i !== undefined) { e.preventDefault(); pick(+t.dataset.i); } };
    opts.addEventListener('pointerdown', pd);
    const kd = e => { const k = parseInt(e.key, 10); if (k >= 1 && k <= 4) pick(k - 1); };
    window.addEventListener('keydown', kd);
    api.score(0); showHearts(); msg.textContent = 'Maak je klaar...';
    later(round, 700);
    return { destroy() {
      dead = true; timers.forEach(clearTimeout);
      opts.removeEventListener('pointerdown', pd); window.removeEventListener('keydown', kd);
      info.remove(); stage.remove(); opts.remove();
    } };
  },
};
