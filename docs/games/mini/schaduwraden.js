const el = (p, css, txt) => { const d = document.createElement('div'); d.style.cssText = css || ''; if (txt != null) d.textContent = txt; if (p) p.appendChild(d); return d; };
const GROUPS = [
  ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐯'],
  ['🐘', '🦒', '🦓', '🐍', '🐢', '🦀', '🐙', '🦆'],
  ['🍎', '🍌', '🍇', '🍓', '🍍', '🍒', '🍉', '🥕'],
  ['🚗', '🚲', '✈️', '🚀', '⛵', '🚂', '🚜', '🚁'],
  ['⚽', '🎸', '🎈', '🔔', '🔑', '🎩', '👑', '⏰'],
];
const ALL = [].concat(...GROUPS);

export default {
  id: 'schaduwraden', name: 'Schaduwraden', emoji: '🌑', hint: 'Welke emoji hoort bij de schaduw?',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = 'linear-gradient(180deg,#fff3c4,#ffcc80)';
    host.style.fontFamily = 'system-ui,sans-serif';
    host.style.display = 'flex'; host.style.flexDirection = 'column';
    const top = el(host, 'height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;font-size:20px;font-weight:800;color:#4e342e;flex:none');
    const tTxt = el(top, '', ''), sTxt = el(top, '', '');
    const bar = el(host, 'height:8px;margin:0 16px;border-radius:4px;background:#0001;overflow:hidden;flex:none');
    const fill = el(bar, 'height:100%;width:100%;background:#6d4c41');
    const stage = el(host, 'flex:1;display:flex;align-items:center;justify-content:center;min-height:0');
    const shape = el(stage, 'font-size:' + Math.floor(Math.min(api.w * 0.55, api.h * 0.3)) + 'px;line-height:1;filter:brightness(0);transition:filter .3s,transform .3s');
    const opts = el(host, 'height:170px;flex:none;display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px;box-sizing:border-box');
    let dead = false, ended = false, score = 0, left = 40, answer = '', locked = false, btns = [];
    const total = 40;
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    function round() {
      locked = false;
      const g = GROUPS[Math.floor(Math.random() * GROUPS.length)];
      answer = g[Math.floor(Math.random() * g.length)];
      const sameGroup = score >= 6 ? 3 : score >= 3 ? 2 : 0;
      const set = [answer];
      const gp = shuffle(g.filter(x => x !== answer));
      for (let i = 0; i < sameGroup; i++) set.push(gp[i]);
      const rest = shuffle(ALL.filter(x => !set.includes(x)));
      while (set.length < 4) set.push(rest.pop());
      shuffle(set);
      shape.textContent = answer; shape.style.filter = 'brightness(0)'; shape.style.transform = '';
      opts.innerHTML = ''; btns = [];
      set.forEach((e, i) => {
        const b = el(opts, 'background:#fff;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:52px;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;box-shadow:0 3px 0 #0002', e);
        b.dataset.i = i; b.dataset.e = e; btns.push(b);
      });
    }
    function upd() { tTxt.textContent = '⏱ ' + Math.max(0, left).toFixed(1) + 's'; sTxt.textContent = '🌑 ' + score; fill.style.width = Math.max(0, Math.min(100, left / total * 100)) + '%'; }
    function finish() {
      if (ended) return; ended = true; clearInterval(iv); locked = true;
      shape.style.filter = 'none';
      setTimeout(() => { if (!dead) api.end(score); }, 1100);
    }
    function pick(i) {
      if (ended || locked || !btns[i]) return;
      locked = true;
      const b = btns[i], ok = b.dataset.e === answer;
      shape.style.filter = 'none'; shape.style.transform = 'scale(1.08)';
      if (ok) { score++; left = Math.min(total, left + 1.5); api.score(score); b.style.background = '#a5d6a7'; }
      else { left -= 4; b.style.background = '#ef9a9a'; }
      upd();
      if (left <= 0) { left = 0; upd(); finish(); return; }
      setTimeout(() => { if (!dead && !ended) round(); }, ok ? 350 : 700);
    }
    const pd = e => { const t = e.target; if (t && t.dataset && t.dataset.i !== undefined) { e.preventDefault(); pick(+t.dataset.i); } };
    opts.addEventListener('pointerdown', pd);
    const kd = e => { const k = parseInt(e.key, 10); if (k >= 1 && k <= 4) pick(k - 1); };
    window.addEventListener('keydown', kd);
    const iv = setInterval(() => { if (dead || ended) return; if (!locked) left -= 0.1; if (left <= 0) { left = 0; upd(); finish(); } else upd(); }, 100);
    api.score(0); round(); upd();
    return { destroy() {
      dead = true; clearInterval(iv);
      opts.removeEventListener('pointerdown', pd); window.removeEventListener('keydown', kd);
      top.remove(); bar.remove(); stage.remove(); opts.remove();
    } };
  },
};
