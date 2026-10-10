const el = (p, css, txt) => { const d = document.createElement('div'); d.style.cssText = css || ''; if (txt != null) d.textContent = txt; if (p) p.appendChild(d); return d; };
const NAMES = ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW'];
const FULL = ['Noord', 'Noordoost', 'Oost', 'Zuidoost', 'Zuid', 'Zuidwest', 'West', 'Noordwest'];

export default {
  id: 'richtingsgevoel', name: 'Richtingsgevoel', emoji: '🧭', hint: 'Volg de draaiingen en tik waar je nu naartoe kijkt',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = 'linear-gradient(180deg,#0d3b4f,#0b1f33)';
    host.style.fontFamily = 'system-ui,sans-serif';
    host.style.display = 'flex'; host.style.flexDirection = 'column'; host.style.alignItems = 'center';
    const top = el(host, 'height:52px;width:100%;display:flex;align-items:center;justify-content:space-between;padding:0 16px;box-sizing:border-box;color:#fff;font-size:20px;font-weight:800;flex:none');
    const sTxt = el(top, '', ''), hearts = el(top, '', '');
    const msg = el(host, 'height:96px;width:100%;display:flex;align-items:center;justify-content:center;text-align:center;color:#ffe082;font-size:24px;font-weight:800;padding:0 14px;box-sizing:border-box;flex:none');
    const D = Math.max(200, Math.min(api.w - 40, api.h - 260, 340));
    const dial = el(host, 'position:relative;width:' + D + 'px;height:' + D + 'px;border-radius:50%;background:radial-gradient(circle,#16507a,#0e2f4a);border:4px solid #4fc3f7;flex:none;margin-top:6px');
    const cx = D / 2, cy = D / 2, R = D / 2 - 26;
    const needleH = R * 0.62;
    const needle = el(dial, 'position:absolute;width:26px;height:' + needleH + 'px;left:' + (cx - 13) + 'px;top:' + (cy - needleH) + 'px;background:#ff5252;clip-path:polygon(50% 0,100% 100%,0 100%);transform-origin:50% 100%;transition:transform .5s ease-in-out');
    el(dial, 'position:absolute;width:16px;height:16px;border-radius:50%;background:#fff;left:' + (cx - 8) + 'px;top:' + (cy - 8) + 'px');
    const timers = [];
    let dead = false, ended = false, level = 0, lives = 3, heading = 0, ang = 0, accepting = false, nbtn = [], mode8 = false;
    const later = (fn, ms) => { const id = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(id); };
    const showHearts = () => { hearts.textContent = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives); };
    function buildButtons() {
      nbtn.forEach(b => b.remove()); nbtn = [];
      for (let k = 0; k < 8; k++) {
        if (!mode8 && k % 2) continue;
        const a = k * Math.PI / 4, x = cx + Math.sin(a) * R, y = cy - Math.cos(a) * R, s = 46;
        const b = el(dial, 'position:absolute;width:' + s + 'px;height:' + s + 'px;border-radius:50%;background:#e1f5fe;color:#0d3b4f;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;cursor:pointer;left:' + (x - s / 2) + 'px;top:' + (y - s / 2) + 'px;-webkit-tap-highlight-color:transparent;user-select:none', NAMES[k]);
        b.dataset.k = k; nbtn.push(b);
      }
    }
    function setNeedle(a) { needle.style.transform = 'rotate(' + a + 'deg)'; }
    function stepText(d) {
      const a = Math.abs(d);
      if (a === 180) return '↻ Draai om (180°)';
      return (d > 0 ? '↻ ' + a + '° naar rechts' : '↺ ' + a + '° naar links');
    }
    function round() {
      mode8 = level >= 5; buildButtons();
      accepting = false;
      const steps = Math.min(8, 2 + Math.floor(level / 2));
      const unit = mode8 ? 45 : 90;
      const choices = mode8 ? [45, -45, 90, -90, 135, -135, 180] : [90, -90, 180];
      heading = mode8 ? Math.floor(Math.random() * 8) * 45 : Math.floor(Math.random() * 4) * 90;
      ang = heading; needle.style.transition = 'none'; setNeedle(ang); needle.offsetWidth; needle.style.transition = 'transform .5s ease-in-out';
      needle.style.opacity = '1';
      const seq = []; for (let i = 0; i < steps; i++) seq.push(choices[Math.floor(Math.random() * choices.length)]);
      const stepMs = Math.max(750, 1500 - level * 55);
      const showNeedle = level < 4;
      msg.textContent = 'Je kijkt naar ' + FULL[((heading % 360) + 360) % 360 / 45] + '.';
      let cur = heading;
      seq.forEach((d, i) => {
        later(() => {
          cur += d; msg.textContent = (i + 1) + '/' + steps + '  ' + stepText(d);
          if (showNeedle) { ang += d; setNeedle(ang); } else { needle.style.opacity = '0'; }
        }, 1600 + i * stepMs);
      });
      later(() => {
        accepting = true; msg.textContent = 'Waar kijk je nu naartoe?';
        needle.style.opacity = '0';
      }, 1600 + steps * stepMs + (showNeedle ? 300 : 0));
      round.final = (((cur % 360) + 360) % 360) / 45;
      round.unit = unit;
    }
    function pick(k) {
      if (!accepting || ended) return;
      accepting = false;
      const ok = k === round.final;
      needle.style.transition = 'none'; setNeedle(round.final * 45); needle.style.opacity = '1';
      nbtn.forEach(b => { if (+b.dataset.k === round.final) b.style.background = '#69f0ae'; });
      if (ok) { level++; api.score(level); msg.textContent = 'Goed! ' + FULL[round.final]; }
      else {
        lives--; showHearts();
        nbtn.forEach(b => { if (+b.dataset.k === k) b.style.background = '#ff5252'; });
        msg.textContent = 'Het was ' + FULL[round.final];
      }
      if (lives <= 0) { ended = true; later(() => api.end(level), 1500); return; }
      later(round, ok ? 1000 : 1700);
    }
    const pd = e => { const t = e.target; if (t && t.dataset && t.dataset.k !== undefined) { e.preventDefault(); pick(+t.dataset.k); } };
    dial.addEventListener('pointerdown', pd);
    api.score(0); showHearts(); msg.textContent = 'Maak je klaar...';
    later(round, 700);
    return { destroy() {
      dead = true; timers.forEach(clearTimeout);
      dial.removeEventListener('pointerdown', pd);
      top.remove(); msg.remove(); dial.remove();
    } };
  },
};
