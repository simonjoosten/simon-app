export default {
  id: 'snake',
  name: 'Snake',
  emoji: '🐍',
  hint: 'Veeg of gebruik de pijltjes om te sturen',
  create(host, api) {
    host.style.touchAction = 'none';
    host.style.background = '#0f2a1a';
    const W = api.w || 360, H = api.h || 640;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cols = 16, cell = Math.floor(W / cols), rows = Math.max(8, Math.floor((H - 10) / cell));
    const ox = (W - cols * cell) / 2, oy = (H - rows * cell) / 2;
    let dead = false, done = false, raf = 0, last = 0, acc = 0;
    let snake, dir, queue, food, eaten = 0, step = 0.2, over = false, overT = 0;

    function reset() {
      const cy = Math.floor(rows / 2);
      snake = [{ x: 8, y: cy }, { x: 7, y: cy }, { x: 6, y: cy }];
      dir = { x: 1, y: 0 }; queue = [];
      placeFood();
    }
    function placeFood() {
      const free = [];
      for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) {
        if (!snake.some(s => s.x === x && s.y === y)) free.push({ x, y });
      }
      food = free.length ? free[Math.floor(Math.random() * free.length)] : null;
    }
    function turn(dx, dy) {
      const ref = queue.length ? queue[queue.length - 1] : dir;
      if (ref.x === dx && ref.y === dy) return;
      if (ref.x === -dx && ref.y === -dy) return;
      if (queue.length < 2) queue.push({ x: dx, y: dy });
    }
    function tick() {
      if (queue.length) dir = queue.shift();
      const h = snake[0];
      const n = { x: h.x + dir.x, y: h.y + dir.y };
      const grow = food && n.x === food.x && n.y === food.y;
      if (n.x < 0 || n.y < 0 || n.x >= cols || n.y >= rows) { over = true; return; }
      const body = grow ? snake : snake.slice(0, -1);
      if (body.some(s => s.x === n.x && s.y === n.y)) { over = true; return; }
      snake.unshift(n);
      if (grow) {
        eaten++;
        api.score(eaten * 10);
        step = Math.max(0.08, 0.2 - eaten * 0.004);
        placeFood();
        if (!food) over = true;
      } else snake.pop();
    }

    let sx = 0, sy = 0, sActive = false;
    const onDown = e => { sx = e.clientX; sy = e.clientY; sActive = true; };
    const onMove = e => {
      if (!sActive) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0); else turn(0, dy > 0 ? 1 : -1);
      sx = e.clientX; sy = e.clientY;
    };
    const onUp = () => { sActive = false; };
    const onKey = e => {
      const k = e.key;
      let used = true;
      if (k === 'ArrowUp' || k === 'w' || k === 'W') turn(0, -1);
      else if (k === 'ArrowDown' || k === 's' || k === 'S') turn(0, 1);
      else if (k === 'ArrowLeft' || k === 'a' || k === 'A') turn(-1, 0);
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') turn(1, 0);
      else used = false;
      if (used) e.preventDefault();
    };
    host.addEventListener('pointerdown', onDown);
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerup', onUp);
    host.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey);

    function draw() {
      ctx.fillStyle = '#0f2a1a'; ctx.fillRect(0, 0, W, H);
      for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) {
        ctx.fillStyle = (x + y) % 2 ? '#133421' : '#163a25';
        ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
      }
      if (food) {
        ctx.font = (cell * 0.85) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🍎', ox + (food.x + 0.5) * cell, oy + (food.y + 0.55) * cell);
      }
      for (let i = snake.length - 1; i >= 0; i--) {
        const s = snake[i];
        const t = i / Math.max(1, snake.length);
        ctx.fillStyle = i === 0 ? '#9dff6a' : `hsl(${110 - t * 30},70%,${52 - t * 14}%)`;
        const p = i === 0 ? 1 : 2;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(ox + s.x * cell + p, oy + s.y * cell + p, cell - 2 * p, cell - 2 * p, cell * 0.3)
          : ctx.rect(ox + s.x * cell + p, oy + s.y * cell + p, cell - 2 * p, cell - 2 * p);
        ctx.fill();
      }
      const h = snake[0];
      ctx.fillStyle = '#000';
      const ex = dir.x, ey = dir.y;
      const cx = ox + (h.x + 0.5) * cell, cy = oy + (h.y + 0.5) * cell;
      const px = -ey, py = ex;
      for (const sgn of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(cx + ex * cell * 0.15 + px * sgn * cell * 0.22, cy + ey * cell * 0.15 + py * sgn * cell * 0.22, cell * 0.09, 0, 7);
        ctx.fill();
      }
      if (over) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Game over!', W / 2, H / 2);
      }
    }
    function frame(t) {
      if (dead) return;
      const dt = Math.min(0.1, last ? (t - last) / 1000 : 0.016);
      last = t;
      if (!over) {
        acc += dt;
        while (acc >= step && !over) { acc -= step; tick(); }
      } else {
        overT += dt;
        if (overT > 0.8 && !done) { done = true; api.end(eaten * 10); }
      }
      draw();
      if (!done) raf = requestAnimationFrame(frame);
    }
    reset();
    api.score(0);
    raf = requestAnimationFrame(frame);

    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        host.removeEventListener('pointerdown', onDown);
        host.removeEventListener('pointermove', onMove);
        host.removeEventListener('pointerup', onUp);
        host.removeEventListener('pointercancel', onUp);
        window.removeEventListener('keydown', onKey);
        if (cv.parentNode === host) host.removeChild(cv);
      },
    };
  },
};
