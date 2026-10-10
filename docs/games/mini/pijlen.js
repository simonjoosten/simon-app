export default {
  id: 'pijlen', name: 'Pijlen', emoji: '➡️', hint: 'Veeg of tik de richting van de pijl. Rood = tegenovergesteld!',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = 'linear-gradient(#1f2a5c,#3a1f5c)';
    host.style.display = 'flex'; host.style.flexDirection = 'column'; host.style.fontFamily = 'system-ui,sans-serif'; host.style.color = '#fff';
    const top = document.createElement('div');
    top.style.cssText = 'height:50px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;font-size:18px;font-weight:700';
    const arrow = document.createElement('div');
    arrow.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:130px;line-height:1;user-select:none';
    const note = document.createElement('div');
    note.style.cssText = 'font-size:18px;height:24px;font-weight:700;text-align:center';
    const bar = document.createElement('div');
    bar.style.cssText = 'height:10px;margin:6px 14px;border-radius:5px;background:#4cf;transform-origin:left';
    const pad = document.createElement('div');
    pad.style.cssText = 'height:150px;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr);gap:8px;padding:8px 14px 12px';
    host.appendChild(top); host.appendChild(arrow); host.appendChild(note); host.appendChild(bar); host.appendChild(pad);
    const SYM = ['⬆️', '⬅️', '➡️', '⬇️'], DX = [[0, -1], [-1, 0], [1, 0], [0, 1]];
    const btnPos = [[0, 1], [1, 0], [1, 2], [1, 1]]; // up (row0,col1), left(row1,col0), right(row1,col2), down(row1,col1)
    let dead = false, ended = false, score = 0, mistakes = 0, cur = null, remain = 0, limit = 0, raf = 0, last = 0, inv = false, lock = 0;
    function press(d) { if (ended || lock > 0 || !cur) return; judge(d); }
    SYM.forEach((s, d) => {
      const b = document.createElement('div');
      b.textContent = s;
      b.style.cssText = 'grid-row:' + (btnPos[d][0] + 1) + ';grid-column:' + (btnPos[d][1] + 1) + ';background:rgba(255,255,255,.15);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:30px;user-select:none';
      b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); press(d); });
      pad.appendChild(b);
    });
    function lives() { return '❤️'.repeat(3 - mistakes) + '🖤'.repeat(mistakes); }
    function hud() { top.innerHTML = '<span>Score ' + score + '</span><span>' + lives() + '</span>'; }
    function next() {
      cur = { d: Math.floor(Math.random() * 4) };
      inv = score >= 8 && Math.random() < Math.min(0.15 + score * 0.008, 0.4);
      limit = Math.max(0.65, 2.2 - score * 0.06); remain = limit;
      arrow.textContent = SYM[cur.d]; arrow.style.color = inv ? '#f44' : '#fff';
      arrow.style.filter = inv ? 'hue-rotate(150deg) saturate(3)' : '';
      note.textContent = inv ? 'TEGEN! Kies de andere kant' : '';
    }
    function judge(d) {
      const want = inv ? 3 - cur.d : cur.d; // 0<->3 (up/down), 1<->2 (left/right)
      if (d === want) { score++; api.score(score); hud(); arrow.style.transform = 'scale(1.15)'; lock = 0.05; setTimeout(() => { if (!dead) arrow.style.transform = ''; }, 80); next(); }
      else miss();
    }
    function miss() {
      mistakes++; hud(); cur = null; lock = 0.5;
      arrow.textContent = '❌'; note.textContent = '';
      if (mistakes >= 3) { ended = true; api.end(score); }
    }
    let sx = 0, sy = 0, down = false;
    const pd = e => { down = true; sx = e.clientX; sy = e.clientY; };
    const pu = e => {
      if (!down) return; down = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) < 25 && Math.abs(dy) < 25) return;
      press(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 1) : (dy > 0 ? 3 : 0));
    };
    const pc = () => { down = false; };
    host.addEventListener('pointerdown', pd); host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pc);
    const kd = e => {
      const m = { ArrowUp: 0, w: 0, ArrowLeft: 1, a: 1, ArrowRight: 2, d: 2, ArrowDown: 3, s: 3 }[e.key];
      if (m !== undefined) { e.preventDefault(); press(m); }
    };
    window.addEventListener('keydown', kd);
    function frame(ts) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min((ts - (last || ts)) / 1000, 0.1); last = ts;
      if (ended) return;
      if (lock > 0) { lock -= dt; if (lock <= 0 && !cur) next(); }
      else if (cur) {
        remain -= dt;
        if (remain <= 0) miss();
      }
      bar.style.transform = 'scaleX(' + (cur ? Math.max(0, remain / limit) : 0) + ')';
      bar.style.background = cur && remain / limit < 0.3 ? '#f55' : '#4cf';
    }
    api.score(0); hud(); lock = 0.4;
    arrow.textContent = '🏹'; note.textContent = 'Klaar?';
    raf = requestAnimationFrame(frame);
    return { destroy() {
      dead = true; cancelAnimationFrame(raf);
      host.removeEventListener('pointerdown', pd); host.removeEventListener('pointerup', pu); host.removeEventListener('pointercancel', pc);
      window.removeEventListener('keydown', kd);
      top.remove(); arrow.remove(); note.remove(); bar.remove(); pad.remove();
    } };
  },
};
