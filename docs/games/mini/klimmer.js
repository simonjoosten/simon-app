// Klimmer: klim de berg, tik links/midden/rechts voor de volgende greep
const setup = (host, api) => {
  host.style.touchAction = 'none';
  host.style.userSelect = 'none';
  const W = api.w || 360, H = api.h || 640;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const c = document.createElement('canvas');
  c.width = W * dpr; c.height = H * dpr;
  c.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block';
  host.appendChild(c);
  const g = c.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { c, g, W, H };
};

export default {
  id: 'klimmer',
  name: 'Klimmer',
  emoji: '⛰️',
  hint: 'Tik links, midden of rechts waar de volgende greep zit',
  create(host, api) {
    const { c, g, W, H } = setup(host, api);
    const GAP = 92, cx = [W * 0.2, W * 0.5, W * 0.8];
    const holds = [{ col: 1, type: 'normal' }];
    let cur = 0, cam = 0, stamina = 100, arrive = 0, shake = 0, t = 0, msg = '', msgT = 0;
    let over = false, dead = false, raf = 0, last = 0, score = 0, fall = 0, lastCol = 1, hx = cx[1];

    const addHold = () => {
      const i = holds.length;
      let col = Math.floor(Math.random() * 3);
      if (Math.random() < 0.3) col = holds[i - 1].col === 1 ? (Math.random() < 0.5 ? 0 : 2) : 1;
      let type = 'normal';
      if (i % 14 === 0) type = 'rest';
      else if (i > 18 && Math.random() < Math.min(0.3, 0.05 + i * 0.004)) type = 'crumble';
      holds.push({ col, type });
    };
    for (let i = 0; i < 12; i++) addHold();

    const finish = () => { if (over) return; over = true; fall = 0; api.end(score); };
    const say = (s) => { msg = s; msgT = 0.9; };
    const pick = (col) => {
      if (over) return;
      const nx = holds[cur + 1];
      if (col === nx.col) {
        cur++;
        while (holds.length < cur + 12) addHold();
        lastCol = holds[cur - 1].col;
        score = cur; api.score(score);
        const quick = arrive < 0.45;
        stamina = Math.min(100, stamina + (quick ? 7 : 4));
        if (holds[cur].type === 'rest') { stamina = Math.min(100, stamina + 35); say('Rustplek! +kracht'); }
        arrive = 0;
      } else {
        stamina -= 18; shake = 0.3; say('Mis!');
        if (stamina <= 0) finish();
      }
    };
    const pd = (e) => {
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) * W / r.width;
      pick(x < W / 3 ? 0 : x < 2 * W / 3 ? 1 : 2);
    };
    const kd = (e) => {
      const m = { ArrowLeft: 0, KeyA: 0, ArrowDown: 1, ArrowUp: 1, KeyS: 1, ArrowRight: 2, KeyD: 2 }[e.code];
      if (m !== undefined) { pick(m); e.preventDefault(); }
    };
    host.addEventListener('pointerdown', pd);
    window.addEventListener('keydown', kd);

    const step = (dt) => {
      t += dt; msgT = Math.max(0, msgT - dt); shake = Math.max(0, shake - dt);
      cam += (cur * GAP - cam) * Math.min(1, dt * 8);
      hx += (cx[holds[cur].col] - hx) * Math.min(1, dt * 14);
      if (over) { fall += dt; return; }
      arrive += dt;
      const rate = Math.min(34, 8 + cur * 0.22);
      if (holds[cur].type !== 'rest' || cur === 0) stamina -= rate * dt * (cur === 0 ? 0.3 : 1);
      if (holds[cur].type === 'crumble' && arrive > 1.3) { say('De greep brak!'); finish(); }
      if (stamina <= 0) { stamina = 0; finish(); }
    };

    const sy = (i) => H * 0.66 - (i * GAP - cam);

    const draw = () => {
      const alt = Math.min(1, cam / 4000);
      const sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, `rgb(${Math.round(70 + alt * 120)},${Math.round(130 + alt * 60)},${Math.round(200 + alt * 20)})`);
      sky.addColorStop(1, '#cfe6f5');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.font = '40px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.globalAlpha = 0.8;
      g.fillText('☁️', ((t * 10) % (W + 80)) - 40, 80);
      g.fillText('☁️', W - ((t * 6) % (W + 80)) + 40 - 40, 200);
      g.globalAlpha = 1;
      // rotswand
      const sx = shake > 0 ? Math.sin(t * 60) * 4 : 0;
      g.save(); g.translate(sx, 0);
      g.fillStyle = '#6f6a66'; g.fillRect(10, 0, W - 20, H);
      g.fillStyle = '#5b5753';
      for (let i = 0; i < 14; i++) {
        const yy = (((i * 91 - cam * 1) % (H + 60)) + H + 60) % (H + 60) - 30;
        g.fillRect(20 + (i * 53) % (W - 80), yy, 30 + (i * 17) % 40, 4);
        g.fillRect(30 + (i * 79) % (W - 90), yy + 30, 3, 28);
      }
      // grepen
      for (let i = Math.max(0, cur - 2); i < holds.length; i++) {
        const y = sy(i);
        if (y < -40 || y > H + 40) continue;
        const h = holds[i], x = cx[h.col];
        const isNext = i === cur + 1;
        let col = h.type === 'rest' ? '#46c46a' : h.type === 'crumble' ? '#d08a4a' : '#e8dcc8';
        g.globalAlpha = i <= cur + 1 ? 1 : 0.55;
        const jig = h.type === 'crumble' && i === cur ? Math.sin(t * 50) * 2 : 0;
        g.fillStyle = col; g.beginPath(); g.ellipse(x + jig, y, isNext ? 30 : 24, isNext ? 20 : 16, 0, 0, 7); g.fill();
        g.strokeStyle = isNext ? '#fff' : 'rgba(0,0,0,0.3)'; g.lineWidth = isNext ? 4 : 2; g.stroke();
        if (isNext) {
          g.strokeStyle = 'rgba(255,255,255,' + (0.4 + 0.4 * Math.sin(t * 8)) + ')';
          g.beginPath(); g.ellipse(x, y, 40, 28, 0, 0, 7); g.stroke();
        }
        g.globalAlpha = 1;
      }
      // klimmer
      const cy = sy(cur);
      const off = over ? fall * fall * 900 : 0;
      g.strokeStyle = '#c22'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(hx, cy + 10 + off); g.lineTo(W / 2, H + 20); g.stroke();
      g.font = '46px serif';
      g.save(); g.translate(hx, cy + 6 + off); g.rotate(over ? fall * 4 : Math.sin(t * 3) * 0.05);
      g.scale(cx[holds[cur].col] > W / 2 ? -1 : 1, 1);
      g.fillText('🧗', 0, 0); g.restore();
      g.restore();
      // uithoudingsbalk
      const bw = W - 40;
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(20, 14, bw, 14);
      g.fillStyle = stamina > 50 ? '#52d96a' : stamina > 25 ? '#f1c232' : '#e0453a';
      g.fillRect(20, 14, bw * Math.max(0, stamina) / 100, 14);
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(20, 14, bw, 14);
      g.fillStyle = '#fff'; g.font = 'bold 20px sans-serif'; g.textAlign = 'center';
      g.fillText(cur + ' m', W / 2, 52);
      if (msgT > 0) { g.fillStyle = '#ffe66b'; g.font = 'bold 22px sans-serif'; g.fillText(msg, W / 2, 84); }
      if (cur < 3) { g.fillStyle = 'rgba(0,0,0,0.6)'; g.font = '14px sans-serif'; g.fillText('Tik in de kolom van de witte greep', W / 2, H - 20); }
      void lastCol;
    };

    const loop = (ts) => {
      if (dead) return;
      const dt = Math.min(0.033, (ts - (last || ts)) / 1000);
      last = ts; step(dt); draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return {
      destroy() {
        dead = true; cancelAnimationFrame(raf);
        host.removeEventListener('pointerdown', pd);
        window.removeEventListener('keydown', kd);
        c.remove();
      },
    };
  },
};
