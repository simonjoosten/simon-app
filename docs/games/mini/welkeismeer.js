const el = (p, css, txt) => { const d = document.createElement('div'); d.style.cssText = css || ''; if (txt != null) d.textContent = txt; if (p) p.appendChild(d); return d; };
const EM = ['🍎', '🐟', '⭐', '🍪', '🐝', '🎈', '🍓', '🐸', '🌸', '🍕', '🦋', '💎'];

export default {
  id: 'welkeismeer', name: 'Welke is meer?', emoji: '⚖️', hint: 'Tik de kant met de meeste emoji, razendsnel',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = 'linear-gradient(180deg,#e8f5e9,#b2dfdb)';
    host.style.fontFamily = 'system-ui,sans-serif';
    host.style.display = 'flex'; host.style.flexDirection = 'column';
    const top = el(host, 'height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;font-size:20px;font-weight:800;color:#004d40;flex:none');
    const tTxt = el(top, '', ''), sTxt = el(top, '', '');
    const row = el(host, 'flex:1;display:flex;gap:10px;padding:0 10px 10px;min-height:0');
    const mk = () => el(row, 'flex:1;position:relative;background:#ffffffaa;border-radius:20px;border:3px solid transparent;cursor:pointer;overflow:hidden;-webkit-tap-highlight-color:transparent');
    const panels = [mk(), mk()];
    panels.forEach((p, i) => { p.dataset.side = i; });
    let dead = false, ended = false, score = 0, left = 30, big = 0, locked = false;
    const total = 30;
    function fillPanel(p, count, emoji) {
      p.innerHTML = '';
      const W = p.clientWidth || (api.w - 30) / 2, H = p.clientHeight || api.h - 100;
      const cols = 4, cw = W / cols, rows = Math.max(1, Math.floor(H / cw));
      const slots = []; for (let i = 0; i < cols * rows; i++) slots.push(i);
      for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
      const n = Math.min(count, slots.length);
      for (let k = 0; k < n; k++) {
        const s = slots[k], x = (s % cols) * cw, y = Math.floor(s / cols) * cw;
        const d = el(p, 'position:absolute;pointer-events:none;font-size:' + Math.floor(cw * 0.62) + 'px;line-height:1;left:' + (x + cw * 0.1 + Math.random() * cw * 0.15) + 'px;top:' + (y + cw * 0.1 + Math.random() * cw * 0.15) + 'px', emoji);
      }
    }
    function round() {
      locked = false;
      const lvl = score;
      const base = Math.min(18, 3 + Math.floor(lvl / 1.5));
      const diff = Math.max(1, 4 - Math.floor(lvl / 5));
      big = Math.random() < 0.5 ? 0 : 1;
      const small = base, more = base + diff;
      const e1 = EM[Math.floor(Math.random() * EM.length)];
      let e2 = EM[Math.floor(Math.random() * EM.length)];
      if (Math.random() < 0.5) e2 = e1;
      fillPanel(panels[big], more, e1); fillPanel(panels[1 - big], small, e2);
    }
    function upd() { tTxt.textContent = '⏱ ' + Math.max(0, left).toFixed(1) + 's'; sTxt.textContent = '⚖️ ' + score; }
    function finish() {
      if (ended) return; ended = true; clearInterval(iv);
      top.firstChild.textContent = 'Tijd om!';
      setTimeout(() => { if (!dead) api.end(score); }, 1000);
    }
    function choose(s) {
      if (ended || locked) return;
      locked = true;
      const ok = s === big, p = panels[s];
      if (ok) { score++; api.score(score); p.style.borderColor = '#43a047'; }
      else { left -= 3; p.style.borderColor = '#e53935'; }
      upd();
      if (left <= 0) { left = 0; upd(); finish(); return; }
      setTimeout(() => { if (dead || ended) return; p.style.borderColor = 'transparent'; round(); }, ok ? 80 : 350);
    }
    const pd = e => { let t = e.target; while (t && t.dataset.side === undefined && t !== host) t = t.parentNode; if (t && t.dataset && t.dataset.side !== undefined) { e.preventDefault(); choose(+t.dataset.side); } };
    row.addEventListener('pointerdown', pd);
    const kd = e => { if (e.key === 'ArrowLeft' || e.key === 'a') choose(0); else if (e.key === 'ArrowRight' || e.key === 'd') choose(1); };
    window.addEventListener('keydown', kd);
    const iv = setInterval(() => { if (dead || ended) return; left -= 0.1; if (left <= 0) { left = 0; upd(); finish(); } else upd(); }, 100);
    api.score(0); upd();
    const st = setTimeout(() => { if (!dead) round(); }, 30);
    return { destroy() {
      dead = true; clearInterval(iv); clearTimeout(st);
      row.removeEventListener('pointerdown', pd); window.removeEventListener('keydown', kd);
      top.remove(); row.remove();
    } };
  },
};
