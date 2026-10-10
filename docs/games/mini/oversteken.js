export default {
  id: 'oversteken', name: 'Oversteken', emoji: '🐸', hint: 'Veeg omhoog/links/rechts (tik = vooruit): over wegen en boomstammen',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#2e7d32';
    const W = api.w || 360, H = api.h || 640, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    const COLS = 9, CELL = W / COLS, P = COLS + 6, BASEY = H - 110;
    let dead = false, raf = 0, last = 0, over = false, endTimer = 0, ended = false;
    const rows = []; let lastType = 'grass', streak = 0;
    const CAR = ['🚗', '🚕', '🚙', '🚌', '🚚', '🏎️'];
    function makeRow(i) {
      let type;
      if (i <= 1) type = 'grass';
      else {
        const r = Math.random();
        if (streak >= 3 && lastType !== 'grass') type = 'grass';
        else type = r < 0.2 ? 'grass' : r < 0.62 ? 'road' : 'river';
      }
      streak = type === lastType ? streak + 1 : 1; lastType = type;
      const row = { type, objs: [], v: 0, deco: [] };
      const lvl = Math.min(i / 60, 1);
      if (type === 'grass') { for (let k = 0; k < 3; k++) if (Math.random() < 0.5) row.deco.push([Math.random() * COLS, ['🌼', '🌷', '🌿'][Math.floor(Math.random() * 3)]]); }
      else {
        const dir = Math.random() < 0.5 ? 1 : -1;
        row.v = dir * (type === 'road' ? 1.3 + Math.random() * 1.4 + lvl * 1.6 : 0.9 + Math.random() * 1.0 + lvl * 0.8);
        const n = type === 'road' ? 2 + (Math.random() < 0.5 + lvl * 0.3 ? 1 : 0) : 3;
        const off = Math.random() * P;
        for (let k = 0; k < n; k++) {
          const w = type === 'road' ? (Math.random() < 0.25 ? 2 : 1) : 2 + (Math.random() < 0.5 ? 1 : 0) + (lvl > 0.5 && Math.random() < 0.4 ? -0.5 : 0);
          row.objs.push({ x: ((off + k * P / n) % P) - 3, w, e: CAR[Math.floor(Math.random() * CAR.length)] });
        }
      }
      return row;
    }
    function getRow(i) { if (i < 0) return { type: 'grass', objs: [], v: 0, deco: [] }; while (rows.length <= i) rows.push(makeRow(rows.length)); return rows[i]; }
    for (let i = 0; i < 20; i++) getRow(i);
    const fr = { row: 0, x: Math.floor(COLS / 2), hop: 0, fx0: 0, row0: 0 };
    let best = 0, cam = 0, camMin = 0, started = false, face = 0, cause = '';
    api.score(0);
    function die(c) { if (over) return; over = true; cause = c; endTimer = 0.9; }
    function move(dx, dy) {
      if (over || fr.hop > 0.5) return;
      const nx = fr.x + dx, nr = fr.row + dy;
      if (nr < 0 || nx < -0.5 || nx > COLS - 0.5) return;
      started = true;
      fr.fx0 = fr.x; fr.row0 = fr.row; fr.hop = 1;
      fr.row = nr; fr.x = nx;
      if (getRow(nr).type !== 'river') fr.x = Math.round(fr.x);
      if (nr > best) { best = nr; api.score(best); }
      if (dx < 0) face = -1; else if (dx > 0) face = 1;
    }
    let sx = 0, sy = 0, down = false;
    const pd = e => { down = true; sx = e.clientX; sy = e.clientY; };
    const pu = e => {
      if (!down) return; down = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) { move(0, 1); return; }
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1, 0); else move(0, dy < 0 ? 1 : -1);
    };
    const pc = () => { down = false; };
    host.addEventListener('pointerdown', pd); host.addEventListener('pointerup', pu); host.addEventListener('pointercancel', pc);
    const kd = e => {
      const m = { ArrowUp: [0, 1], w: [0, 1], ArrowDown: [0, -1], s: [0, -1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] }[e.key];
      if (m) { e.preventDefault(); move(m[0], m[1]); }
    };
    window.addEventListener('keydown', kd);
    function frame(ts) {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min((ts - (last || ts)) / 1000, 0.05); last = ts;
      // move objects
      for (let i = Math.max(0, fr.row - 6); i < fr.row + 18; i++) {
        const r = getRow(i);
        for (const o of r.objs) { o.x += r.v * dt; if (o.x > COLS + 3) o.x -= P; else if (o.x < -3) o.x += P; }
      }
      if (fr.hop > 0) fr.hop = Math.max(0, fr.hop - dt / 0.1);
      if (!over) {
        const r = getRow(fr.row);
        if (r.type === 'road') {
          for (const o of r.objs) if (fr.x + 0.8 > o.x + 0.1 && fr.x + 0.2 < o.x + o.w - 0.1) { die('auto'); break; }
        } else if (r.type === 'river') {
          let on = null;
          for (const o of r.objs) if (fr.x + 0.5 > o.x && fr.x + 0.5 < o.x + o.w) { on = o; break; }
          if (on) { fr.x += r.v * dt; if (fr.x < -0.6 || fr.x > COLS - 0.4) die('water'); }
          else if (fr.hop < 0.3) die('water');
        }
        if (started) camMin += dt * (0.22 + Math.min(best, 80) * 0.006);
        if (fr.row < camMin - 2.4) die('adelaar');
      }
      cam += (Math.max(fr.row, camMin) - cam) * Math.min(1, dt * 6);
      if (cam < camMin) cam = camMin;
      if (over && !ended) { endTimer -= dt; if (endTimer <= 0) { ended = true; api.end(best); } }
      draw();
    }
    function ry(i) { return BASEY - (i - cam) * CELL; }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const lo = Math.floor(cam - BASEY / CELL) - 1, hi = Math.ceil(cam + (H - BASEY) / CELL) + 1;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let i = Math.max(0, lo); i <= hi; i++) {
        const r = getRow(i), y = ry(i);
        ctx.fillStyle = r.type === 'grass' ? (i % 2 ? '#43a047' : '#4caf50') : r.type === 'road' ? '#37474f' : '#1e88e5';
        ctx.fillRect(0, y - CELL / 2, W, CELL + 1);
        if (r.type === 'road') { ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let x = 0; x < W; x += 36) ctx.fillRect(x, y - 1, 18, 2); }
        ctx.font = (CELL * 0.6) + 'px serif';
        for (const d of r.deco) ctx.fillText(d[1], d[0] * CELL, y);
        for (const o of r.objs) {
          if (r.type === 'river') {
            ctx.fillStyle = '#8d6e63'; ctx.beginPath();
            const rx = o.x * CELL, rw = o.w * CELL;
            if (ctx.roundRect) ctx.roundRect(rx, y - CELL * 0.35, rw, CELL * 0.7, 10); else ctx.rect(rx, y - CELL * 0.35, rw, CELL * 0.7);
            ctx.fill(); ctx.fillStyle = '#a1887f'; ctx.fillRect(rx + 8, y - 3, rw - 16, 6);
          } else {
            ctx.font = (CELL * 0.85) + 'px serif';
            for (let k = 0; k < o.w; k++) {
              ctx.save(); const cx = (o.x + k + 0.5) * CELL; ctx.translate(cx, y);
              if (r.v > 0) ctx.scale(-1, 1);
              ctx.fillText(o.e, 0, 0); ctx.restore();
            }
          }
        }
      }
      // frog
      const t = fr.hop > 0 ? 1 - fr.hop : 1;
      const dispRow = fr.row0 + (fr.row - fr.row0) * (fr.hop > 0 ? t : 1);
      const dispX = fr.hop > 0 ? fr.fx0 + (fr.x - fr.fx0) * t : fr.x;
      const lift = fr.hop > 0 ? Math.sin(t * Math.PI) * 8 : 0;
      ctx.font = (CELL * 0.85) + 'px serif';
      ctx.fillText(over ? (cause === 'water' ? '💦' : cause === 'adelaar' ? '🦅' : '💥') : '🐸', (dispX + 0.5) * CELL, ry(dispRow) - lift);
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, W, 30);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Rijen: ' + best, 10, 16);
    }
    raf = requestAnimationFrame(frame);
    return { destroy() {
      dead = true; cancelAnimationFrame(raf);
      host.removeEventListener('pointerdown', pd); host.removeEventListener('pointerup', pu); host.removeEventListener('pointercancel', pc);
      window.removeEventListener('keydown', kd);
      cv.remove();
    } };
  },
};
