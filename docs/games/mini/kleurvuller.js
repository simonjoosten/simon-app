export default {
  id: 'kleurvuller', name: 'Kleurvuller', emoji: '🎨', hint: 'Vul het raster vanaf linksboven met één kleur in max. 22 zetten',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#1d1d2b';
    host.style.display = 'flex'; host.style.flexDirection = 'column'; host.style.fontFamily = 'system-ui,sans-serif'; host.style.color = '#fff';
    const N = 12, MAXM = 22;
    const COL = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'];
    const top = document.createElement('div');
    top.style.cssText = 'height:50px;display:flex;align-items:center;justify-content:space-around;font-size:18px;font-weight:700';
    const gridWrap = document.createElement('div');
    gridWrap.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;padding:6px';
    const cv = document.createElement('canvas');
    const side = Math.max(120, Math.min((api.w || 360) - 20, (api.h || 640) - 50 - 110 - 20));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = side * dpr; cv.height = side * dpr; cv.style.cssText = 'width:' + side + 'px;height:' + side + 'px;border-radius:10px';
    gridWrap.appendChild(cv);
    const btns = document.createElement('div');
    btns.style.cssText = 'height:110px;display:flex;gap:8px;padding:8px 10px 14px';
    host.appendChild(top); host.appendChild(gridWrap); host.appendChild(btns);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    let dead = false, ended = false, moves = 0, g = [], cur = 0;
    const timers = [];
    function later(fn, ms) { const id = setTimeout(() => { if (!dead) fn(); }, ms); timers.push(id); }
    for (let r = 0; r < N; r++) { g.push([]); for (let c = 0; c < N; c++) g[r].push(Math.floor(Math.random() * 6)); }
    cur = g[0][0];
    function flood(color) {
      const old = g[0][0]; if (old === color) return false;
      const st = [[0, 0]];
      while (st.length) {
        const [r, c] = st.pop();
        if (r < 0 || c < 0 || r >= N || c >= N || g[r][c] !== old) continue;
        g[r][c] = color; st.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
      }
      return true;
    }
    function done() { const v = g[0][0]; for (const row of g) for (const x of row) if (x !== v) return false; return true; }
    function draw() {
      const cs = side / N;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { ctx.fillStyle = COL[g[r][c]]; ctx.fillRect(c * cs, r * cs, cs + 0.5, cs + 0.5); }
      ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1;
      for (let i = 1; i < N; i++) { ctx.beginPath(); ctx.moveTo(i * cs, 0); ctx.lineTo(i * cs, side); ctx.moveTo(0, i * cs); ctx.lineTo(side, i * cs); ctx.stroke(); }
      top.innerHTML = '<span>Zetten over: ' + (MAXM - moves) + '</span><span>Punten: ' + (done() ? Math.max(0, MAXM - moves) * 100 + 100 : 0) + '</span>';
    }
    function pick(color) {
      if (ended) return;
      if (!flood(color)) return;
      moves++; draw();
      if (done()) {
        ended = true; const s = (MAXM - moves) * 100 + 100; api.score(s); later(() => api.end(s), 900);
      } else if (moves >= MAXM) {
        ended = true; top.innerHTML = '<span>Geen zetten meer!</span>'; later(() => api.end(0), 900);
      }
    }
    COL.forEach((c, i) => {
      const b = document.createElement('div');
      b.style.cssText = 'flex:1;border-radius:14px;background:' + c + ';box-shadow:inset 0 -4px rgba(0,0,0,.25);cursor:pointer';
      b.addEventListener('pointerdown', e => { e.preventDefault(); pick(i); });
      btns.appendChild(b);
    });
    const kd = e => { const k = parseInt(e.key, 10); if (k >= 1 && k <= 6) pick(k - 1); };
    window.addEventListener('keydown', kd);
    api.score(0); draw();
    return { destroy() {
      dead = true; timers.forEach(clearTimeout); window.removeEventListener('keydown', kd);
      top.remove(); gridWrap.remove(); btns.remove();
    } };
  },
};
